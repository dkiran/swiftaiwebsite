# CTO / CAIO Network Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans. Steps use checkbox syntax.

**Goal:** Curated CTO/CAIO profiles with browse, search and introduction requests, plus information pages on fractional CTO types and fractional CAIO.
**Architecture:** Astro content collection `profiles` (strict schema, no rate field), pure filter/sort functions in `src/lib/network.ts` used by a client-side browse page, one static page per profile.
**Tech Stack:** Astro 5, vitest, existing LeadForm and Base layout.
**Spec:** `docs/superpowers/specs/2026-11-19-swift-ai-website-design.md` (addendum 2026-11-20)

## Global Constraints
- Rates are never published: schema is `.strict()` and a check fails the build if a profile page shows an hourly rate.
- No email or phone on profile pages; contact only via the introduction form.
- No invented people, credentials or claims; seed only the founder from confirmed facts.
- Existing global wording (not India-only); INR pricing unaffected.

## Review Focus
- Profile file with a `rate` field: build must fail.
- Filters returning zero results: friendly empty state, not a blank page.
- JavaScript disabled on browse page: all profiles still listed.
- Profile with no availability or no linkedin: renders without "undefined".

### Task 1: Network library (TDD)
**Files:** Create `src/lib/network.ts`, `src/lib/network.test.ts`
**Interfaces:** Produces `filterProfiles(items, filters)`, `sortProfiles(items)`, `initials(name)`, `facets(items)`.
- [ ] Write failing tests (search, role, domain, engagement, availability, minYears, combos, case-insensitive, sort order, initials, facets); run; expect FAIL.
- [ ] Implement; run; expect PASS. Commit.

### Task 2: Collection, browse and profile pages
**Files:** `src/content.config.ts`, `src/content/profiles/d-kiran-kumar.md`, `src/pages/cto-network/index.astro`, `src/pages/cto-network/[slug].astro`, `src/components/ProfileCard.astro`
- [ ] Add strict `profiles` collection; seed founder profile; browse page with filters and empty state; profile page with Person schema and introduction form.
- [ ] Build; confirm a profile with `rate` fails the build; commit.

### Task 3: Information pages and navigation
**Files:** `src/pages/fractional-cto/types/index.astro`, `src/pages/fractional-caio/index.astro`, `src/layouts/Base.astro`, `src/data/site.ts`, `src/pages/fractional-cto/index.astro`
- [ ] Write pages with FAQs and Service schema; add nav and footer links; commit.

### Task 4: Registration form, knowledge, checks, verification
**Files:** `src/pages/join-as-a-cto/index.astro`, `src/pages/hire-a-cto/index.astro`, `src/data/knowledge.ts`, `src/pages/llms.txt.ts`, `scripts/check-seo.mjs`
- [ ] Extend join form (role, private rate, headline, engagement); add browse link to hire page; chat/llms updates; check-script rules (profile pages have Person schema and no hourly rate; network and info pages exist).
- [ ] Browser-test filters, empty state, no-JS, profile form, 320px; run all tests; commit and push.
