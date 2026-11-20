import type { MailConfig } from './email';
import type { Env as ChatEnv } from '../infra/chat/handler';

export type Config = {
  port: number; host: string; trustProxy: boolean;
  db: { host: string; port: number; user: string; password: string; database: string };
  mail: MailConfig | null; notifyEmail: string; chatEnv: ChatEnv;
};

/** Reads and validates environment variables. Fails fast with a clear list instead of starting half-configured. */
export function loadConfig(env: Record<string, string | undefined>): Config {
  const missing = ['DB_USER', 'DB_PASSWORD', 'DB_NAME'].filter((k) => !env[k]);
  if (missing.length) throw new Error(`Missing required environment variables: ${missing.join(', ')}`);

  const port = Number(env.PORT ?? 3100);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be a number between 1 and 65535');
  const dbPort = Number(env.DB_PORT ?? 3306);
  if (!Number.isInteger(dbPort) || dbPort < 1 || dbPort > 65535) throw new Error('DB_PORT must be a number between 1 and 65535');

  let mail: MailConfig | null = null;
  if (env.ZEPTOMAIL_TOKEN) {
    const lacking = ['MAIL_FROM_ADDRESS', 'NOTIFY_EMAIL'].filter((k) => !env[k]);
    if (lacking.length) throw new Error(`ZEPTOMAIL_TOKEN is set but these are missing: ${lacking.join(', ')}`);
    mail = { token: env.ZEPTOMAIL_TOKEN, host: env.ZEPTOMAIL_API_HOST || 'api.zeptomail.com', fromAddress: env.MAIL_FROM_ADDRESS!, fromName: env.MAIL_FROM_NAME || 'Swift AI' };
  }
  return {
    port, host: env.HOST || '127.0.0.1', trustProxy: env.TRUST_PROXY === '1',
    db: { host: env.DB_HOST || '127.0.0.1', port: dbPort, user: env.DB_USER!, password: env.DB_PASSWORD!, database: env.DB_NAME! },
    mail, notifyEmail: env.NOTIFY_EMAIL || '',
    chatEnv: { ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY, CHAT_MODEL: env.CHAT_MODEL, CHAT_DISABLED: env.CHAT_DISABLED, ALLOWED_ORIGIN: env.ALLOWED_ORIGIN },
  };
}
