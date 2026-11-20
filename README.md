# Swift AI website

Marketing site for **Swift AI Tech Solutions Private Limited**. Astro static site (plain HTML/CSS, minimal JS) plus an optional AI chat function on AWS Lambda.

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
| Domain (`swiftai.in` is a placeholder) | `astro.config.mjs`, `src/data/site.ts`, `public/robots.txt` |
| Email, phone, address, CIN, GSTIN, social links | `src/data/site.ts` |
| **Calculator rates (illustrative only!)** | `src/data/pricing.ts` |
| Chat assistant facts | `src/data/knowledge.ts` |
| Privacy and Terms | `src/pages/privacy`, `src/pages/terms` (have a lawyer review) |

## Lead forms
Forms post JSON to `PUBLIC_FORM_ENDPOINT`. **Formspree:** paste your form URL, nothing else. **Web3Forms:** set the endpoint to `https://api.web3forms.com/submit` and put your key in `PUBLIC_FORM_ACCESS_KEY`. Copy `.env.example` to `.env` locally; set the variable in your host's build settings for production. If unset, forms show a "not connected" message instead of silently succeeding.

## Hosting on AWS
**Site (static):** `npm run build`, then upload `dist/` to an S3 bucket behind CloudFront (or connect the repo to AWS Amplify Hosting with build command `npm run build`, output `dist`). Serve `/404.html` for missing pages and enable HTTPS.

**Chat assistant (Lambda):**
1. `npm run build:chat` creates `infra/chat/dist/index.mjs`; zip it as `chat.zip` and create a Node.js 22 Lambda with handler `index.handler`.
2. Enable a **Function URL** (auth NONE) and add it as `PUBLIC_CHAT_ENDPOINT` in the site's build settings, then rebuild.
3. Lambda environment variables: `ANTHROPIC_API_KEY` (store in Secrets Manager or encrypted env var), optional `CHAT_MODEL` (default `claude-haiku-5-5`), `ALLOWED_ORIGIN` (`https://your-domain`), `CHAT_DISABLED=1` as a kill switch.
4. **Control cost:** set a spend limit on the Anthropic key, set reserved concurrency on the Lambda (for example 5), and optionally put AWS WAF rate limiting in front. The built-in limiter (10 requests per minute per IP) is per Lambda container only.
5. Without `PUBLIC_CHAT_ENDPOINT` the widget shows a contact fallback.

## Add a blog post
Create `src/content/blog/<slug>.md` with frontmatter `title` (max 70 chars), `description` (70–160), `tldr`, `date`, `category` (`AI Automation` or `Fractional CTO`), `readingMinutes`, and optional `faq`. The build fails on missing fields. Sitemap, RSS, `llms.txt` and schema update automatically.

## SEO / AEO / GEO included
Per-page title, description, canonical, Open Graph; JSON-LD (Organization, WebSite, Service, FAQPage, Article, BreadcrumbList, WebApplication, SoftwareApplication); answer-first copy and FAQs; `sitemap-index.xml`, `rss.xml`, `llms.txt`, and `robots.txt` that welcomes AI crawlers. After launch, submit the sitemap in Google Search Console and Bing Webmaster Tools.

## Font note
apple.com uses SF Pro, which Apple's license does not allow hosting on websites. The site uses `-apple-system, "SF Pro Display"` (real SF Pro on Apple devices) with self-hosted Inter as the fallback elsewhere.
