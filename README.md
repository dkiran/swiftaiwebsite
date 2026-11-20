# Swift AI website

Marketing site for **Swift AI Tech Solutions Private Limited**. Astro static site (plain HTML/CSS, minimal JS) plus our own Node API (forms saved to MySQL, ZeptoMail email, chat assistant) running on your server.

## Develop
```bash
npm install
npm run dev        # http://localhost:4321
npm test           # unit tests (forms, calculators, chat handler)
npm run build && npm run check   # build + SEO/AEO structure checks on dist/
```

## Before launch: replace placeholders
| What | Where |
|---|---|
| Domain (`swift-ai.in` is assumed from your email domain; confirm) | `astro.config.mjs`, `src/data/site.ts`, `public/robots.txt` |
| Email, phone, addresses, GSTIN, social links | `src/data/site.ts` |
| **Calculator rates (illustrative only!)** | `src/data/pricing.ts` |
| Chat assistant facts | `src/data/knowledge.ts` |
| Privacy and Terms | `src/pages/privacy`, `src/pages/terms` (have a lawyer review) |

## Forms, chat and the API
The website posts forms to its own API (`/api/forms`) and the chat to `/api/chat`. A small Node service in `server/` saves submissions to MySQL, emails you through ZeptoMail, and hosts the chat assistant. See `docs/deployment.md` for the full server setup (this replaces Formspree and AWS Lambda).

```bash
npm run test:server     # API tests (set TEST_DB_HOST, TEST_DB_USER, TEST_DB_PASSWORD, TEST_DB_NAME to also run the real-database tests)
npm run build:server    # builds server/dist/main.mjs
```
Locally, `npm run dev` has no API. To try forms locally, run the built API against a test database and set `PUBLIC_FORM_ENDPOINT=http://127.0.0.1:3100/api/forms` in `.env`.

## Add a blog post
Create `src/content/blog/<slug>.md` with frontmatter `title` (max 70 chars), `description` (70–160), `tldr`, `date`, `category` (`AI Automation` or `Fractional CTO`), `readingMinutes`, and optional `faq`. The build fails on missing fields. Sitemap, RSS, `llms.txt` and schema update automatically.

## Add a CTO / CAIO profile (curated network)
1. A CTO or CAIO applies at `/join-as-a-cto/`. The submission (including their **private** hourly rate and publishing consent) is saved in MySQL (`form_submissions`) and emailed to you. Keep the rate in your own records; it is never put on the site.
2. After you review them and they consent, create `src/content/profiles/<first-last>.md` (copy `d-kiran-kumar.md`). Fields: `name`, `headline`, `roles` (CTO and/or CAIO), `yearsExperience`, `domains`, `skills`, `engagement` (fractional, full-time, advisory, interim), optional `availability` (available, limited, booked), `location`, `linkedin`, `highlights`, `status` (published or draft), and a Markdown bio.
3. **There is no `rate` field and the build fails if you add one.** Companies see rates only when they request an introduction and you share it.
4. Commit and deploy. The profile appears on `/cto-network/` with its own page, search and filters pick it up automatically. Use `status: draft` to hide a profile.
5. When a company requests an introduction (form `Introduction request: <name>`), you connect them and share the rate.

## SEO / AEO / GEO included
Per-page title, description, canonical, Open Graph; JSON-LD (Organization, WebSite, Service, FAQPage, Article, BreadcrumbList, WebApplication, SoftwareApplication); answer-first copy and FAQs; `sitemap-index.xml`, `rss.xml`, `llms.txt`, and `robots.txt` that welcomes AI crawlers. After launch, submit the sitemap in Google Search Console and Bing Webmaster Tools.

## Font note
apple.com uses SF Pro, which Apple's license does not allow hosting on websites. The site uses `-apple-system, "SF Pro Display"` (real SF Pro on Apple devices) with self-hosted Inter as the fallback elsewhere.
