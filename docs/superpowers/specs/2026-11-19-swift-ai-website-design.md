# Swift AI Tech Solutions: Marketing Website Design

Date: 2026-11-19 · Status: awaiting approval

## Intent and why
Marketing site for **Swift AI Tech Solutions Private Limited** ("Swift AI"). It should look and feel like a top-tier tech company and turn three audiences into leads:

1. **SMEs / MSMEs** → book a **free AI Audit call** (primary CTA).
2. **Startup founders (technical or not)** → submit their requirement to request an appointment.
3. **CTOs and companies** → a CTO network where experienced CTOs register and companies hire them fractionally or full-time. The full platform is a **later, separate project**; the site only collects interest now.

## Goals
- Apple-style design: generous whitespace, huge light-to-semibold headlines with tight tracking, scroll reveals, product-style sections.
- Colors: white plus blue, in the spirit of singleqr.in.
- SEO, AEO and GEO built in from the start.
- 6 launch blog posts on AI automation and Fractional CTO.
- Fast: Lighthouse 95+ on all four scores, mobile-first.

## Non-goals
- CTO marketplace features: accounts, profiles, vetting, matching, payments.
- A CMS, a backend, or user logins.

## Anti-goals
- A generic template look.
- Unverifiable claims (fake client logos, invented statistics or testimonials).
- Heavy JavaScript.

## Constraints
- **Font:** SF Pro cannot be self-hosted (Apple's license). Use the stack `-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", Inter, "Segoe UI", sans-serif`. Real SF Pro shows on Apple devices; Inter (self-hosted) covers the rest. Weights and sizes follow Apple's type scale.
- **Colors (decided by user):** white plus Tailwind v4 `blue-600`, `--color-blue-600: oklch(54.6% 0.245 262.881)` (about `#155dfc`), used for links, buttons and accents. Deep navy for dark sections is my call.
- **Forms:** static site, so they post to a form service (Formspree or Web3Forms). One key to paste in.
- **Facts:** only what you've told me: the legal name, the four services and the two products with their URLs. Contact details, address, CIN/GST and founder bio are placeholders you fill in.

## Approaches considered
1. Hand-written HTML: simple, but blog, sitemap and schema upkeep gets tedious.
2. **Astro static site (chosen as my recommendation).** It outputs plain HTML, writes blog posts as Markdown, and auto-generates the sitemap, RSS and schema. It can grow into the platform later.
3. Next.js: too much JavaScript, and only worthwhile once logins exist.

## Design (all my calls unless you say otherwise)
**Pages:** Home · AI Automations · Fractional CTO · Products (SingleQR, SingleStaff) · Consultation ("10x-speed software development") · Hire a CTO · Join as a CTO · Book a Free AI Audit · Blog (index and posts) · About · Contact · Privacy and Terms.

**Home flow:** hero ("AI that works while you sleep" style headline, with the audit CTA) → the 4 services as large cards → how an AI audit works (3 steps) → products showcase → CTO network teaser → FAQ → final CTA.

**Content improvements I'll make:**
- Services rewritten as outcomes: hours saved, cost cut, speed to launch.
- A concrete process for each service.
- "AI Audit" defined as a 45-minute call plus a written opportunity map.
- Founder intake form asks stage, budget, timeline and the problem.

**SEO / AEO / GEO:**
- Per-page titles, meta descriptions, canonical URLs and Open Graph tags.
- JSON-LD: Organization, WebSite, Service, FAQPage, Article and BreadcrumbList.
- Answer-first sections, FAQ blocks and definitions written to be quoted by AI assistants.
- `llms.txt`, `sitemap.xml`, `robots.txt` allowing GPTBot, ClaudeBot and PerplexityBot, and an RSS feed.
- Semantic HTML, one H1 per page, internal linking between blogs and services.
- India-targeted keywords ("AI automation for MSMEs India", "fractional CTO India").

**Blog (launch set):**
1. What Is AI Automation? A Guide for Indian SMEs
2. 10 Business Processes Every MSME Can Automate with AI This Year
3. What Is a Fractional CTO? (and When You Need One)
4. Fractional CTO vs Full-Time CTO: Cost, Control and Risk
5. How to Run an AI Audit on Your Business in a Day
6. How Non-Technical Founders Should Hire and Manage a CTO

**Structure:** Astro + plain CSS (design tokens, light and dark sections), minimal JavaScript for scroll reveals and form handling, deployable to Cloudflare Pages or Netlify.

## Left to the builder
Exact copy polish, visual details and animation, icons and illustrations (SVG, no stock photos), accessibility (WCAG AA), and the placeholder contact data.

## Addendum (2026-11-19): AI chatbot and calculators

### AI chatbot ("Ask Swift AI")
- Floating chat widget on every page that answers visitor questions about services, process, products, CTO network, audit and pricing approach.
- **Needs a server.** A static site cannot hold an API key, so chat runs through a **Cloudflare Pages Function** (`functions/api/chat.ts`) that calls the Claude API. Hosting is therefore **Cloudflare Pages** (free tier). The API key is a secret (`ANTHROPIC_API_KEY`) set in Cloudflare, never in the repo or the browser.
- **Grounded answers:** the system prompt is built from the site's own content (services, FAQs, product facts, blog summaries). It must say it doesn't know rather than invent prices, clients or guarantees, and then point to the audit booking or contact form.
- **Abuse and cost controls:** per-IP rate limit, message length cap, short conversation history cap, no tool use, honeypot-free streaming response, and a kill switch via env var.
- **Lead handoff:** every answer can offer "Book a free AI Audit"; the bot never collects payment or sensitive data.
- Without the key configured the widget shows a contact-us fallback instead of failing silently.
- Ongoing cost: Claude API usage, paid by Swift AI. The model name is an env var (`CHAT_MODEL`, default a small fast Claude model).

### Calculators (client-side, no server)
- **Fractional CTO cost estimator** (`/fractional-cto/cost-calculator/`): inputs are company stage, engagement model (advisory / hands-on / team build), hours per week, duration, and team size to manage; output is a monthly and total range with a comparison against a full-time CTO's yearly cost.
- **AI automation ROI calculator** (`/ai-automations/roi-calculator/`): inputs are process (support, invoicing, lead follow-up, reporting, HR), tasks per month, minutes per task, hourly cost in INR, and expected automation share; output is hours and rupees saved per month and year, plus payback period against an estimated build cost.
- Both end with the CTA (audit booking or CTO request), can email the result through the lead form, and are linked from the matching service page and the home page.
- **All rates and assumptions live in one file, `src/data/pricing.ts`, and are labelled "indicative estimate, not a quote".** I do not know Swift AI's real prices, so the values I put in are placeholders for you to set before launch.
