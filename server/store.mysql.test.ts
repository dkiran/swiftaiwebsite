import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFileSync } from 'node:fs';
import mysql from 'mysql2/promise';
import { createMysqlStore } from './store';

// Integration test against a real MySQL/MariaDB. Skipped unless TEST_DB_HOST is set.
// Example: TEST_DB_HOST=127.0.0.1 TEST_DB_USER=swiftai_test TEST_DB_PASSWORD=... TEST_DB_NAME=swiftai_test npx vitest run server/store.mysql.test.ts
const enabled = !!process.env.TEST_DB_HOST;
describe.skipIf(!enabled)('mysql store (real database)', () => {
  let pool: mysql.Pool;
  beforeAll(async () => {
    pool = mysql.createPool({ host: process.env.TEST_DB_HOST, user: process.env.TEST_DB_USER, password: process.env.TEST_DB_PASSWORD, database: process.env.TEST_DB_NAME, charset: 'utf8mb4', multipleStatements: true });
    await pool.query('DROP TABLE IF EXISTS form_submissions');
    await pool.query(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));
  });
  afterAll(async () => { await pool?.end(); });

  it('inserts a submission and reads it back, including unicode and quotes', async () => {
    const store = createMysqlStore(pool);
    const id = await store.insertSubmission({ formName: 'Test form', payload: { name: "Anaïs O'Brien", note: 'नमस्ते 🌸 "quoted"' }, ip: '203.0.113.9', userAgent: 'UA' });
    expect(id).toBeGreaterThan(0);
    const [rows] = await pool.query('SELECT * FROM form_submissions WHERE id = ?', [id]);
    const row = (rows as any[])[0];
    expect(row.form_name).toBe('Test form');
    expect(JSON.parse(row.payload)).toEqual({ name: "Anaïs O'Brien", note: 'नमस्ते 🌸 "quoted"' });
    expect(row.email_sent).toBe(0);
  });
  it('is safe against SQL injection in values (parameterised)', async () => {
    const store = createMysqlStore(pool);
    const evil = "x'); DROP TABLE form_submissions; --";
    const id = await store.insertSubmission({ formName: evil, payload: { a: evil }, ip: '1.1.1.1', userAgent: evil });
    const [rows] = await pool.query('SELECT form_name FROM form_submissions WHERE id = ?', [id]);
    expect((rows as any[])[0].form_name).toBe(evil);
  });
  it('records email success and failure', async () => {
    const store = createMysqlStore(pool);
    const a = await store.insertSubmission({ formName: 'F', payload: { a: '1' }, ip: '1.1.1.1', userAgent: 'u' });
    const b = await store.insertSubmission({ formName: 'F', payload: { a: '1' }, ip: '1.1.1.1', userAgent: 'u' });
    await store.markEmailSent(a, true);
    await store.markEmailSent(b, false, 'smtp refused');
    const [rows] = await pool.query('SELECT id, email_sent, email_error FROM form_submissions WHERE id IN (?, ?) ORDER BY id', [a, b]);
    expect((rows as any[]).map((r) => [r.email_sent, r.email_error])).toEqual([[1, null], [0, 'smtp refused']]);
  });
  it('truncates over-long user agents and error text instead of failing', async () => {
    const store = createMysqlStore(pool);
    const id = await store.insertSubmission({ formName: 'F', payload: { a: '1' }, ip: '1.1.1.1', userAgent: 'U'.repeat(600) });
    await store.markEmailSent(id, false, 'E'.repeat(600));
    const [rows] = await pool.query('SELECT user_agent, email_error FROM form_submissions WHERE id = ?', [id]);
    const row = (rows as any[])[0];
    expect(row.user_agent.length).toBe(255);
    expect(row.email_error.length).toBe(255);
  });
});
