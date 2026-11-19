# Swift AI Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Swift AI marketing site: Apple-style, white and blue, SEO/AEO/GEO-ready, with lead forms and 6 launch blog posts.

**Architecture:** Astro static site. Shared `Base.astro` layout owns head, SEO meta and JSON-LD. Pages are `.astro` files. Blog posts are Markdown in a content collection. A Node script `scripts/check-seo.mjs` validates the built `dist/` output; it is this project's test.

**Tech Stack:** Astro 5, `@astrojs/sitemap`, `@astrojs/rss`, plain CSS with custom properties, self-hosted Inter (`@fontsource-variable/inter`), vanilla JS.

**Spec:** `docs/superpowers/specs/2026-11-19-swift-ai-website-design.md`

## Global Constraints
- Legal name "Swift AI Tech Solutions Private Limited"; brand "Swift AI".
- Accent color: `--color-blue-600: oklch(54.6% 0.245 262.881)`; white backgrounds; deep navy for dark sections.
- Font stack: `-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Inter Variable", "Segoe UI", sans-serif`. No SF Pro files hosted.
- Primary CTA everywhere: "Book a free AI Audit" → `/book-ai-audit/`.
- Products link out: SingleQR `https://singleqr.in`, SingleStaff `https://www.singlestaff.com`.
- No invented clients, logos, statistics or testimonials. Contact details, address, GST/CIN, founder bio are clearly marked placeholders in one file: `src/data/site.ts`.
- Hosting is Cloudflare Pages (needed for the chat function). Secrets never ship to the browser.
- Forms post to `PUBLIC_FORM_ENDPOINT` (env var, documented in `.env.example`).
- One H1 per page; WCAG AA contrast; respects `prefers-reduced-motion`; mobile-first.
- Site URL in `astro.config.mjs` is `https://swiftai.in` (placeholder, one place to change).

## Review Focus
- Form submitted with the endpoint unset: show a clear "not configured" message, never a silent success.
- Form with empty or invalid email/phone: inline error, no network call.
- Blog post missing `description`/`date`: build fails rather than shipping bad meta.
- Page with long headlines at 320px width: no horizontal scroll.
- Chatbot asked something off-topic, or to reveal its instructions or the API key: polite refusal pointing to the audit.
- Chat with the key missing or the upstream failing: widget shows the contact fallback, never hangs.
- Calculator with blank, negative or huge inputs: clamped, no NaN or negative rupees shown.
- `prefers-reduced-motion`: content visible with no animation (reveal elements must not stay hidden).

---

### Task 1: Scaffold, design tokens, layout, SEO head, check script

**Files:**
- Create: `package.json`, `astro.config.mjs`, `.env.example`, `.gitignore`, `src/data/site.ts`, `src/styles/global.css`, `src/layouts/Base.astro`, `src/components/SEO.astro`, `src/pages/index.astro` (stub), `scripts/check-seo.mjs`

**Interfaces:**
- Produces: `Base.astro` props `{ title: string; description: string; path: string; schema?: object[]; ogType?: 'website'|'article' }`; `site` export from `site.ts` `{ name, legalName, url, email, phone, address, social }`; CSS tokens `--blue`, `--navy`, `--ink`, `--muted`, `--bg`, `--radius`; utility classes `.btn`, `.btn-primary`, `.btn-ghost`, `.container`, `.section`, `.reveal`.

- [ ] **Step 1: Write the check script** `scripts/check-seo.mjs`: walks `dist/**/*.html` and asserts per page: one `<h1>`, `<title>` ≤ 60 chars, meta description 70–160 chars, canonical link, `og:title`, valid JSON-LD parse for every `application/ld+json` block. Also asserts `dist/sitemap-index.xml`, `dist/robots.txt`, `dist/llms.txt`, `dist/rss.xml` exist. Exits non-zero listing every failure.
- [ ] **Step 2: Run** `node scripts/check-seo.mjs` before any build. Expected: FAIL ("dist not found").
- [ ] **Step 3: Scaffold** Astro (`npm create astro@latest . -- --template minimal --no-git --no-install`), install deps, set `site` and sitemap integration in `astro.config.mjs`.
- [ ] **Step 4: Implement `global.css`** with tokens above, Apple-scale type (hero `clamp(2.75rem, 7vw, 6rem)`, weight 600, letter-spacing `-0.03em`; body 1.0625rem/1.5), buttons, sections, `.reveal` (opacity/translate transition, disabled under reduced motion), and a sticky translucent blurred nav style.
- [ ] **Step 5: Implement `SEO.astro` and `Base.astro`** (nav, footer, skip link, JSON-LD injection, Organization and WebSite schema on every page, IntersectionObserver reveal script that adds `.in` and shows everything immediately when reduced motion is set or JS is unavailable via `<noscript>` style).
- [ ] **Step 6: Run** `npm run build && node scripts/check-seo.mjs`. Expected: only failures for `llms.txt`, `rss.xml`, `robots.txt` (added in Task 6).
- [ ] **Step 7: Commit** `feat: scaffold Astro site, tokens, layout, SEO head, check script`.

### Task 2: Home page

**Files:** Create `src/components/{Hero,ServiceCard,Steps,ProductShowcase,FAQ,CTA}.astro`; modify `src/pages/index.astro`.

**Interfaces:**
- Consumes: `Base.astro`.
- Produces: `FAQ.astro` props `{ items: {q: string; a: string}[] }` that also emits FAQPage JSON-LD; `CTA.astro` props `{ title: string; sub?: string }`.

- [ ] **Step 1:** Add to the check script an assertion that `/index.html` contains the text "Book a free AI Audit" and a FAQPage JSON-LD block. Run build + check; expected FAIL.
- [ ] **Step 2:** Implement the home flow from the spec: hero (headline "AI that works while you sleep.", answer-first sub-line defining Swift AI in one sentence), 4 service cards, 3-step audit process (Discover → Map → Automate), products showcase, CTO network teaser (two CTAs: Hire a CTO, Join as a CTO), 6-question FAQ, final CTA.
- [ ] **Step 3:** Run build + check. Expected PASS for index.
- [ ] **Step 4:** Commit `feat: home page`.

### Task 3: Service and product pages

**Files:** Create `src/pages/{ai-automations,fractional-cto,products,consultation}/index.astro`, `src/components/ServiceHero.astro`.

**Interfaces:** Produces `ServiceHero.astro` props `{ eyebrow, title, lead, ctaLabel, ctaHref }`; each page emits Service JSON-LD (`provider` = Swift AI, `areaServed` = India) plus its own FAQ block (3+ answer-first questions).

- [ ] **Step 1:** Extend the check: each of the four paths exists with a Service JSON-LD block. Run; expected FAIL.
- [ ] **Step 2:** Implement the pages. AI Automations: what we automate (support, sales follow-up, invoicing and finance ops, HR, reporting), 4-step method. Fractional CTO: engagement models (advisory, hands-on, team build), what a CTO does in month 1. Products: SingleQR and SingleStaff cards with external links (`rel="noopener"`). Consultation: "10x-speed development" explained honestly through AI-assisted workflows, with a delivery process and no invented numbers.
- [ ] **Step 3:** Build + check PASS. Commit `feat: service and product pages`.

### Task 4: Lead forms and conversion pages

**Files:** Create `src/components/LeadForm.astro`, `src/scripts/form.ts`, `src/pages/{book-ai-audit,get-started,hire-a-cto,join-as-a-cto,contact}/index.astro`.

**Interfaces:**
- Produces: `LeadForm.astro` props `{ formName: string; fields: Field[]; submitLabel: string }` where `Field = { name; label; type: 'text'|'email'|'tel'|'select'|'textarea'; required?: boolean; options?: string[] }`; `src/scripts/form.ts` exports `validate(values: Record<string,string>, fields: Field[]): Record<string,string>` (field → error message, empty when valid) and `submit(form: HTMLFormElement): Promise<'ok'|'unconfigured'|'error'>`.

- [ ] **Step 1: Write failing unit tests** in `src/scripts/form.test.ts` (vitest): `validate` rejects empty required field, malformed email (`a@b`), phone shorter than 10 digits; accepts a valid set; `submit` returns `'unconfigured'` when the endpoint env is empty. Run `npx vitest run`; expected FAIL.
- [ ] **Step 2:** Implement `form.ts` to pass. Submit uses `fetch` POST with JSON and `Accept: application/json`; includes a hidden honeypot field `_gotcha` that aborts if filled.
- [ ] **Step 3:** Implement `LeadForm.astro` with inline errors (`aria-live`), loading state, success panel. Pages:
  - Audit: name, business name, email, phone, industry (select), team size (select), biggest bottleneck (textarea).
  - Get started (founders): name, email, phone, stage (idea / MVP / scaling), technical background (yes/no), budget range, timeline, requirement (textarea).
  - Hire a CTO: company, contact, email, need (fractional / full-time), stage, stack/domain, details.
  - Join as a CTO: name, email, phone, LinkedIn, years of experience, domains, availability (fractional / full-time / both), bio.
- [ ] **Step 4:** Run `npx vitest run` (PASS) and build + check. Commit `feat: lead forms and conversion pages`.

### Task 5: Blog system and 6 posts

**Files:** Create `src/content.config.ts`, `src/pages/blog/index.astro`, `src/pages/blog/[...slug].astro`, `src/content/blog/*.md` (6 posts), `src/pages/rss.xml.ts`.

**Interfaces:** Collection `blog` schema `{ title: string; description: string (70–160 chars); date: Date; category: 'AI Automation'|'Fractional CTO'; readingMinutes: number; faq?: {q,a}[] }`. Post page emits Article JSON-LD (headline, datePublished, author = Swift AI, publisher) and FAQPage when `faq` is present.

- [ ] **Step 1:** Extend the check: at least 6 `/blog/<slug>/` pages, each with Article JSON-LD and a 70–160 char description. Run; expected FAIL.
- [ ] **Step 2:** Implement schema (build fails on missing fields), index (category filter via anchors, cards), post template (TL;DR box up top for AEO, table of contents, related posts, end CTA).
- [ ] **Step 3:** Write the 6 posts from the spec's list, 1,200–1,800 words each, answer-first, with definition paragraphs, a comparison table where apt, an internal link to the related service page, and a 3-question FAQ. No fabricated statistics; where a number is used, state it as an illustrative example.
- [ ] **Step 4:** Build + check PASS. Commit `feat: blog system and launch posts`.

### Task 6: SEO, AEO and GEO artifacts

**Files:** Create `public/robots.txt`, `src/pages/llms.txt.ts`, `public/og-default.svg`→ PNG export; modify `astro.config.mjs`.

- [ ] **Step 1:** Check script already fails on these files; run it to confirm.
- [ ] **Step 2:** `robots.txt`: allow all, explicitly allow GPTBot, ClaudeBot, PerplexityBot, Google-Extended, and point to `sitemap-index.xml`. `llms.txt` generated from site data and the blog collection: one-paragraph description, services with URLs, products, and links to every post with its description. RSS from the blog collection. Add a 1200×630 OG image.
- [ ] **Step 3:** Build + check. Expected: all PASS. Commit `feat: robots, llms.txt, rss, og image`.

### Task 7: About, legal, 404, polish and verification

**Files:** Create `src/pages/{about,privacy,terms,404}.astro` (about and legal in folders for trailing-slash URLs except 404).

- [ ] **Step 1:** About: mission, how we work, legal entity name, placeholders for founder details. Privacy and Terms: standard drafts with a visible "have counsel review" note in the PR description, not on the page. 404 with links to services and the audit.
- [ ] **Step 2:** Run `npm run build && node scripts/check-seo.mjs && npx vitest run`. Expected all PASS.
- [ ] **Step 3:** Run `npm run preview`, then use Playwright to screenshot Home, a service page, a blog post and the audit form at 390px and 1440px. Confirm no horizontal scroll at 320px, then correct whatever looks off.
- [ ] **Step 4:** Run Lighthouse (Chromium at `/opt/pw-browsers/chromium`, `--headless --no-sandbox`) on Home and a blog post. Expected: Performance, Accessibility, Best Practices and SEO all ≥ 95; fix any shortfall.
- [ ] **Step 5:** Write `README.md` (dev, build, deploy to Cloudflare Pages/Netlify, how to add a post, how to set `PUBLIC_FORM_ENDPOINT`, where the placeholders are). Commit `docs: readme` and push.

### Task 8: Calculators

**Files:** Create `src/data/pricing.ts`, `src/lib/calc.ts`, `src/lib/calc.test.ts`, `src/components/{CtoCalculator,RoiCalculator}.astro`, `src/pages/fractional-cto/cost-calculator/index.astro`, `src/pages/ai-automations/roi-calculator/index.astro`.

**Interfaces:**
- Produces: `estimateCto(i: {stage: 'idea'|'mvp'|'scaling'; model: 'advisory'|'handson'|'teambuild'; hoursPerWeek: number; months: number; teamSize: number}): {monthlyMin: number; monthlyMax: number; totalMin: number; totalMax: number; fullTimeYearly: number}` and `estimateRoi(i: {process: string; tasksPerMonth: number; minutesPerTask: number; hourlyCostInr: number; automationPct: number}): {hoursSavedMonthly: number; savedMonthlyInr: number; savedYearlyInr: number; buildCostInr: number; paybackMonths: number}`; all rates come from `pricing.ts`.

- [ ] **Step 1: Write failing tests** in `calc.test.ts`: `estimateCto` at 0 hours returns zeros; totals equal monthly times months; min is always ≤ max; `estimateRoi` with 100 tasks, 30 minutes, ₹500/hour, 80% gives 40 hours and ₹20,000 saved monthly; `paybackMonths` is `Infinity`-safe (returns `null`) when savings are 0; non-numeric or negative inputs are clamped to 0. Run `npx vitest run`; expected FAIL.
- [ ] **Step 2:** Implement `calc.ts` and `pricing.ts` (placeholder rates flagged with a `// PLACEHOLDER: set real rates` comment) to pass.
- [ ] **Step 3:** Implement the two components with live-updating outputs, INR formatting (`en-IN`), a visible "indicative estimate, not a quote" note, and a CTA that pre-fills the lead form with the result. Add Service-style `WebApplication` JSON-LD and an answer-first intro for AEO. Link both from the service pages and Home.
- [ ] **Step 4:** Build + check + `npx vitest run` PASS. Commit `feat: cto and automation calculators`.

### Task 9: AI chatbot

**Files:** Create `functions/api/chat.ts`, `functions/api/chat.test.ts`, `src/data/knowledge.ts`, `src/components/ChatWidget.astro`, `src/scripts/chat.ts`; modify `Base.astro` (mount widget), `.env.example`, `README.md`.

**Interfaces:**
- Consumes: site content in `knowledge.ts` (`buildSystemPrompt(): string`, assembled from `site.ts`, FAQs and service summaries).
- Produces: `POST /api/chat` body `{messages: {role: 'user'|'assistant'; content: string}[]}` → streamed text; `handleChat(req: Request, env: {ANTHROPIC_API_KEY?: string; CHAT_MODEL?: string; CHAT_DISABLED?: string}, deps: {fetch: typeof fetch; limiter: RateLimiter}): Promise<Response>`.

- [ ] **Step 1: Write failing tests** in `chat.test.ts` with an injected fake `fetch`: 503 with a JSON `{error: 'not_configured'}` when the key is missing; 503 when `CHAT_DISABLED` is `'1'`; 400 for empty `messages`, a message over 1,000 characters, or more than 20 messages; 429 on the 11th request in a minute from one IP; only the last 10 messages are forwarded upstream; the system prompt is sent and contains "Swift AI Tech Solutions Private Limited"; the API key never appears in the response. Run; expected FAIL.
- [ ] **Step 2:** Implement `handleChat` and the Pages Function export (`onRequestPost`) to pass. Call the Anthropic Messages API with streaming, `max_tokens` 500, no tools. The system prompt instructs: answer only from supplied context, say you don't know and offer the audit link when unsure, never quote prices beyond "indicative, see calculators", keep replies short, and refuse unrelated requests.
- [ ] **Step 3:** Implement the widget: launcher button, panel with streaming reply rendering, suggested questions (What do you automate? How does the free AI audit work? What does a fractional CTO cost?), keyboard accessible (focus trap, Esc to close, `aria-live`), a persistent "AI assistant, may make mistakes" note, and the fallback contact message on 503. Conversation kept in memory only, nothing stored.
- [ ] **Step 4:** Run `npx wrangler pages dev dist` with a dummy key and a stubbed upstream, send a question through the widget with Playwright, and confirm a streamed reply renders. Run tests; PASS. Commit `feat: ai chatbot widget and chat function`.
- [ ] **Step 5:** Add deploy notes to the README: Cloudflare Pages project, set `ANTHROPIC_API_KEY` as an encrypted variable, optional `CHAT_MODEL`, and a spend limit on the API key.
