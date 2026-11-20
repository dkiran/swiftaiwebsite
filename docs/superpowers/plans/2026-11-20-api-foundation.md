# API Foundation (Phase 1) Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans. Steps use checkbox syntax.

**Goal:** Replace Formspree and Lambda with our own Node service on EC2: forms saved to MySQL, email notification through ZeptoMail, chat endpoint.
**Architecture:** Web-standard handlers (`Request` to `Response`) in `server/`, a tiny router, a store interface with MySQL and in-memory implementations, a Node http adapter, esbuild bundle, systemd and nginx files.
**Tech Stack:** Node 20+, TypeScript, mysql2, vitest, esbuild.
**Spec:** `docs/superpowers/specs/2026-11-19-website-design.md` addendum 2026-11-20 (file `2026-11-19-swift-ai-website-design.md`)

## Global Constraints
- Service listens on 127.0.0.1 only; secrets only in env; parameterised SQL only.
- A lead must never be lost: if the notification email fails, the submission is still stored and the visitor still gets success.
- Phone rule: Indian (10 digits starting 6-9, optional 0, 91 or +91) or international E.164 (+, 8-15 digits).

## Review Focus
- HTML/script injection in submitted values must be escaped in the notification email.
- A body larger than the limit is rejected before parsing.
- Honeypot-filled submissions are accepted silently and never stored or emailed.
- Behind nginx the client IP comes from the proxy header only when TRUST_PROXY=1.
- MySQL down: visitor gets a clear error, no crash.

### Task 1: Phone validation (shared)
- [ ] Failing tests for `isValidPhone`, `normalizePhone`; implement `src/lib/phone.ts`; use it in `src/scripts/form.ts`.
### Task 2: Email module
- [ ] Failing tests (ZeptoMail request shape, token prefix handling, escaping, error status); implement `server/email.ts`.
### Task 3: Forms handler and stores
- [ ] Failing tests for `handleForm` with memory store and fake mailer; implement `server/forms.ts`, `server/store.ts` (memory + MySQL), `server/schema.sql`; MySQL integration test against a real database.
### Task 4: App, Node adapter, entry point
- [ ] Failing tests for routing and an end-to-end HTTP test; implement `server/app.ts`, `server/node-adapter.ts`, `server/main.ts`, `server/config.ts`.
### Task 5: Website wiring, deploy files, docs
- [ ] Same-origin default endpoints in the website; nginx proxy, systemd unit, env example, deploy script, backup, docs; real run against MariaDB; commit and push.
