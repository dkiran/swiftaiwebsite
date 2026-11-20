import mysql from 'mysql2/promise';
import { loadConfig } from './config';
import { createApp } from './app';
import { createMysqlStore } from './store';
import { createNodeServer } from './node-adapter';
import { sendMail } from './email';
import { createLimiter } from '../infra/chat/handler';

const config = loadConfig(process.env);

const pool = mysql.createPool({ ...config.db, charset: 'utf8mb4', connectionLimit: 5, waitForConnections: true, connectTimeout: 10_000, timezone: 'Z' });
await pool.query('SELECT 1'); // fail fast if the database is unreachable

const mail = config.mail;
const app = createApp({
  store: createMysqlStore(pool),
  mailer: mail ? (m) => sendMail(m, mail) : null,
  notifyTo: config.notifyEmail,
  formsLimiter: createLimiter(10, 60_000),
  chatLimiter: createLimiter(10, 60_000),
  chatEnv: config.chatEnv,
  fetch,
});
const server = createNodeServer(app, { trustProxy: config.trustProxy, maxBody: 64 * 1024 });
server.listen(config.port, config.host, () => {
  console.log(`swiftai-api listening on ${config.host}:${config.port} (email ${mail ? 'on' : 'off'}, chat ${config.chatEnv.ANTHROPIC_API_KEY ? 'on' : 'off'})`);
});

const shutdown = () => { server.close(() => { pool.end().finally(() => process.exit(0)); }); setTimeout(() => process.exit(1), 10_000).unref(); };
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('unhandledRejection', (e) => console.error('unhandled rejection:', e instanceof Error ? e.message : 'unknown'));
