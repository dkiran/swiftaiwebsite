-- Swift AI API: database schema (Phase 1). Safe to run more than once.
-- Create the database and a least-privilege user once, as the MySQL admin (see docs/deployment.md), then run this file:
--   mysql -u root -p swiftai < server/schema.sql

CREATE TABLE IF NOT EXISTS form_submissions (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  form_name   VARCHAR(100)    NOT NULL,
  payload     LONGTEXT        NOT NULL,            -- JSON text of the submitted fields (kept as text for compatibility)
  ip          VARCHAR(45)     NOT NULL,
  user_agent  VARCHAR(255)    NOT NULL,
  email_sent  TINYINT(1)      NOT NULL DEFAULT 0,
  email_error VARCHAR(255)    NULL,
  created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_form_created (form_name, created_at),
  KEY idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
