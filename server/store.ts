import type { Pool, ResultSetHeader } from 'mysql2/promise';

export type SubmissionInput = { formName: string; payload: Record<string, string>; ip: string; userAgent: string };
export type StoredSubmission = SubmissionInput & { id: number; emailSent: boolean; emailError: string | null };

/** What the API needs from a database. Phase 2 and 3 will extend this with users, sessions and profiles. */
export interface Store {
  insertSubmission(s: SubmissionInput): Promise<number>;
  markEmailSent(id: number, ok: boolean, error?: string): Promise<void>;
}

const cut = (s: string, n: number) => (s.length > n ? s.slice(0, n) : s);

export function createMysqlStore(pool: Pool): Store {
  return {
    async insertSubmission(s) {
      const [res] = await pool.execute<ResultSetHeader>(
        'INSERT INTO form_submissions (form_name, payload, ip, user_agent) VALUES (?, ?, ?, ?)',
        [cut(s.formName, 100), JSON.stringify(s.payload), cut(s.ip, 45), cut(s.userAgent, 255)],
      );
      return res.insertId;
    },
    async markEmailSent(id, ok, error) {
      await pool.execute('UPDATE form_submissions SET email_sent = ?, email_error = ? WHERE id = ?', [ok ? 1 : 0, ok ? null : cut(error ?? 'unknown error', 255), id]);
    },
  };
}

/** In-memory store for tests and local experiments. */
export function createMemoryStore(): Store & { submissions: StoredSubmission[] } {
  const submissions: StoredSubmission[] = [];
  return {
    submissions,
    async insertSubmission(s) {
      const id = submissions.length + 1;
      submissions.push({ ...s, id, emailSent: false, emailError: null });
      return id;
    },
    async markEmailSent(id, ok, error) {
      const row = submissions.find((x) => x.id === id);
      if (row) { row.emailSent = ok; row.emailError = ok ? null : cut(error ?? 'unknown error', 255); }
    },
  };
}
