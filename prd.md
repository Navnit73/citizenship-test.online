# PRD: citizenship-test.online

**Product:** Multi-country citizenship test practice and learning platform (US, UK, AU, CA)
**Stack:** Next.js (App Router, TypeScript) · MongoDB (Mongoose) · Axios · Tailwind CSS + DaisyUI · Auth.js · Zod · Vitest/Jest + React Testing Library + Playwright
**Audience for this document:** Claude Code (or any engineer) building the product phase by phase using test-driven development.
**Version:** 1.0 · November 2026

> **Research note:** Competitor and exam facts below come from knowledge current to mid-2026, not live web research. Before content goes live, verify every exam rule (question counts, pass marks, fees, handbook editions) against the official government source linked on each country page. Exam rules change (the US civics test changed in 2025), so these values must live in the database, never hard-coded.

---

## 1. Problem and Goal

Hundreds of thousands of people each month search for citizenship test practice. Existing sites are mostly single-country, ad-heavy, visually dated, and weak on accessibility. Very few let a learner **read, listen, and write** answers, which matters because the US test is oral and includes English reading and writing, and many learners are not native English speakers.

**Goal:** Build the most useful free practice site for the four major English-speaking citizenship tests, with an admin CMS that lets the owner publish unlimited tests, blogs, guides, how-tos, and legal pages without code changes.

**Success metrics (12 months):** 100K monthly organic sessions; top-10 ranking for 20+ target keywords; average 3+ tests started per session; 10% visitor-to-account conversion; Core Web Vitals "Good" on 90% of URLs.

---

## 2. Competitor Research

| Competitor (verify current status)                | Coverage       | Strengths                                                      | Gaps we exploit                                            |
| ------------------------------------------------- | -------------- | -------------------------------------------------------------- | ---------------------------------------------------------- |
| lifeintheuktests.co.uk / lifeintheuktestweb.co.uk | UK only        | Huge question banks, strong rankings for "life in the uk test" | Dated UI, heavy ads, no audio, no learning path            |
| Official handbook publisher (TSO)                 | UK only        | Official authority                                             | Paid, no free practice                                     |
| uscis.gov citizenship resource center             | US only        | Authoritative, free audio & flashcards                         | Not a practice product; no progress tracking or mock exams |
| citizenshiptests.org                              | US, UK, CA, AU | Multi-country, simple                                          | Thin content, no accounts, limited study modes             |
| CitizenPath / Boundless                           | US             | Trust, application help                                        | Test prep is a funnel for paid services                    |
| Various Canada and Australia quiz sites           | Single country | Rank for long-tail                                             | Small banks, outdated guides, poor mobile UX               |

**Our differentiation:**

1. Four countries under one trusted brand with consistent UX.
2. Three study modes on every question: **Read** (text), **Listen** (text-to-speech audio), **Write** (type the answer; dictation for the US writing test).
3. Exam-accurate mock tests that mirror each country's real rules (counts, timers, pass marks, special rules).
4. Chapter-based learning paths tied to the official handbook, with progress tracking and weak-topic review.
5. Fast, ad-light, accessible (WCAG 2.2 AA), and mobile-first.
6. Clear disclaimer: not affiliated with any government; always links to the official source.

---

## 3. Keyword Strategy (from the Keyword Planner export)

The supplied data covers UK and US terms only; run equivalent research for Canada and Australia before Phase 4.

| Cluster                | Example keywords                                                                                          | Volume band | Target page                 |
| ---------------------- | --------------------------------------------------------------------------------------------------------- | ----------- | --------------------------- |
| UK head term           | life in the uk test, life in the uk exam, uk test life in the uk                                          | 100K–1M     | /uk/life-in-the-uk-test     |
| UK practice            | life in uk test practice, life in the uk free test, british citizenship mock test                         | 1K–100K     | /uk/practice-test           |
| UK questions           | life in the uk test questions, british citizenship test questions, uk citizenship questions (+900% trend) | 1K–100K     | /uk/questions               |
| UK booking & cost      | uk life test booking (high CPC), life in the uk test how much, gov life in the uk test                    | 1K–100K     | /uk/how-to-book             |
| UK English requirement | english test for citizenship uk (medium competition, top CPC ≈ ₹2,106)                                    | 1K–10K      | /uk/english-requirement     |
| US head term           | us citizenship test, american citizenship test, us naturalization test                                    | 10K–100K    | /us/citizenship-test        |
| US questions           | us citizenship test questions, united states naturalization test questions                                | 10K–100K    | /us/civics-questions        |
| US practice            | us citizenship test practice, us citizenship test online, us civics test                                  | 1K–10K      | /us/practice-test           |
| US new test            | new us citizenship test, us citizenship and immigration services test (+900%)                             | 1K–10K      | /us/civics-questions + blog |

**Rules:** one primary keyword per URL, no cannibalisation between hub and practice pages, skip dated terms like "2018 us citizenship test" except as a redirect/explainer blog.

---

## 4. Exam Rules to Model (store in `Country.examConfig`)

| Country | Test                                                       | Questions asked                                                                                   | Pass rule                                             | Time                 | Source material                                                   |
| ------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | -------------------- | ----------------------------------------------------------------- |
| US      | Civics (2025 version) + English reading, writing, speaking | Up to 20 from 128 (2008 version: up to 10 from 100, 6 to pass, still used for older applications) | 12 correct; test stops once passed                    | Oral, no fixed timer | USCIS civics questions                                            |
| UK      | Life in the UK Test                                        | 24                                                                                                | 18 correct (75%)                                      | 45 min               | _Life in the United Kingdom: A Guide for New Residents_ (3rd ed.) |
| CA      | Citizenship test                                           | 20                                                                                                | 15 correct (75%)                                      | 30 min               | _Discover Canada_ (watch for revised guide)                       |
| AU      | Citizenship test                                           | 20                                                                                                | 75% **and** all 5 Australian values questions correct | 45 min               | _Australian Citizenship: Our Common Bond_                         |

The engine must support both versions of the US test and any future change without code edits.

---

## 5. Information Architecture

### 5.1 Global pages

`/` Home · `/tests` all tests · `/blog` · `/guides` · `/how-to` · `/about` · `/contact` · `/dashboard` · `/login` · `/admin/*`

### 5.2 Five core pages per country (20 total)

**United States (`/us`)**

1. `/us/citizenship-test` – hub: what the test is, 2025 vs 2008 versions, eligibility, interview flow.
2. `/us/practice-test` – adaptive mock interview (stops at 12 correct or 9 wrong), Listen mode default.
3. `/us/civics-questions` – full bank with answers, audio, state-specific answers (senators, governor) by state selector.
4. `/us/english-test` – reading and writing practice with official vocabulary lists and dictation (Write mode).
5. `/us/naturalization-guide` – N-400 steps, fees, interview prep, oath ceremony.

**United Kingdom (`/uk`)**

1. `/uk/life-in-the-uk-test` – hub (targets the 100K–1M head term).
2. `/uk/practice-test` – 24-question, 45-minute timed mocks; unlimited free tests.
3. `/uk/questions` – question bank by handbook chapter.
4. `/uk/study-guide` – chapter summaries, key dates, flashcards.
5. `/uk/how-to-book` – booking, fees, ID, what happens on the day, plus a linked `/uk/english-requirement` page.

**Canada (`/ca`)**

1. `/ca/citizenship-test` – hub.
2. `/ca/practice-test` – 20 questions, 30 minutes.
3. `/ca/questions` – by _Discover Canada_ chapter, including regional questions by province.
4. `/ca/study-guide` – chapter summaries.
5. `/ca/how-to-apply` – eligibility, language proof, test invitation, interview.

**Australia (`/au`)**

1. `/au/citizenship-test` – hub.
2. `/au/practice-test` – 20 questions, 45 minutes, values-question rule enforced.
3. `/au/questions` – by _Our Common Bond_ part, values questions flagged.
4. `/au/study-guide` – parts 1–4 summaries, values deep dive.
5. `/au/how-to-apply` – eligibility, booking, what to bring.

Each country page includes: breadcrumb, table of contents, "Start free test" CTA, last-reviewed date, official-source link, FAQ block (FAQPage schema), related guides.

### 5.3 Legal pages (CMS-managed, type `legal`)

Privacy Policy (UK GDPR, EU GDPR, CCPA/CPRA), Terms of Use, Cookie Policy (with consent banner), Disclaimer (not affiliated with USCIS, Home Office, IRCC, or Department of Home Affairs), Editorial & Accuracy Policy, Accessibility Statement, Affiliate/Advertising Disclosure, DMCA/Content Removal, Contact.

---

## 6. Home Page Specification

1. **Hero:** "Pass your citizenship test with free practice for the US, UK, Canada and Australia." Primary CTA "Start a free test", secondary "Choose your country".
2. **Country selector:** four flag cards (test name, question count, pass mark, link to hub). Auto-highlight a country from geo-IP, never auto-redirect.
3. **How it works:** Pick country → Study by chapter → Take mock tests → Track readiness.
4. **Study modes strip:** Read, Listen, Write with a 3-question live demo widget.
5. **Popular tests:** latest/most-taken tests from DB.
6. **Readiness score teaser:** sign-up prompt to save progress.
7. **Latest guides and blog posts:** 6 cards from CMS.
8. **Trust block:** official sources used, last updated date, editorial policy link, user stats.
9. **FAQ:** 6 questions (FAQPage schema).
10. **Footer:** country links, resources, legal pages, disclaimer.

Performance budget: LCP < 2.0 s, CLS < 0.1, JS < 150 KB on first load. Rendered with ISR (revalidate on CMS publish).

---

## 7. Functional Requirements

### 7.1 Test engine

- Test types: `mock` (exam rules), `chapter` (topic practice), `custom` (admin-built), `weak-areas` (generated from user mistakes), `flashcards`.
- Question types: single choice, multiple choice (UK "select two"), true/false, short text (US civics, fuzzy-matched against accepted answers), dictation (US writing).
- **Read mode:** question and options as text; optional translation toggle (later phase).
- **Listen mode:** audio via pre-generated MP3 (stored in object storage) with Web Speech API fallback; playback speed 0.75×/1×/1.25×; auto-play option.
- **Write mode:** typed answers, normalised (case, punctuation, articles) and scored against `acceptedAnswers`; dictation plays audio and grades spelling word by word.
- Optional **Speak mode** (Phase 6): Web Speech recognition for US oral practice.
- Timer per country config, pause disabled in mock mode, auto-submit on expiry.
- Results: score, pass/fail by country rule, per-chapter breakdown, review with explanations and handbook references, share card.
- Randomisation: seeded shuffle of questions and options; no repeats within a session.

### 7.2 Content management (admin)

- Roles: `admin`, `editor`, `author`, `user`.
- Post types: `blog`, `guide`, `howto`, `legal`, `page` (generic landing page), all sharing one `Post` model with rich-text (TipTap) or MDX body, SEO fields, country tag, category, featured image, status (draft/scheduled/published), revision history.
- Question bank CRUD with CSV/JSON bulk import, chapter tagging, difficulty, explanation, source reference, audio generation button.
- Test builder: pick rules or hand-pick questions, set timer/pass mark, publish to a URL.
- Dynamic page routing so new pages publish without deploys.
- Media library, redirects manager, sitemap auto-update.

### 7.3 User features

- Optional account (email magic link + Google). Guest attempts stored locally then merged on signup.
- Dashboard: readiness score per country, streak, attempts history, weak chapters, bookmarked questions.
- Exam date reminder emails (Phase 6).

### 7.4 SEO

- Server-rendered metadata, canonical URLs, `sitemap.xml` and `robots.txt` generated from DB.
- Schema: Article, FAQPage, BreadcrumbList, Quiz (on practice pages), Organization.
- Internal linking module: each post links to its country hub and practice test.
- No index on dashboard, admin, and results pages.

---

## 8. Data Model (MongoDB / Mongoose)

```ts
Country   { code: 'us'|'uk'|'ca'|'au', name, slug, examConfig: { versions: [{ key, questionsAsked, poolSize, passRule: { type: 'count'|'percent', value }, requiredTags?: [{ tag, mustAllBeCorrect }], stopWhenPassed, timeLimitSec }] , activeVersion }, officialSourceUrl, lastReviewedAt }
Chapter   { countryCode, title, slug, order, summary }
Question  { countryCode, version, chapterId, type, prompt, options: [{ id, text }], correctOptionIds, acceptedAnswers, explanation, sourceRef, tags (e.g. 'values', 'state-specific'), difficulty, audioUrl, status }
Test      { title, slug, countryCode, kind, questionIds?, rules, timeLimitSec, isPublished, seo }
Attempt   { userId?, guestId?, testId, countryCode, seed, answers: [{ questionId, response, correct, timeMs }], score, passed, startedAt, finishedAt, mode }
Post      { type, title, slug, countryCode?, categoryId, body, excerpt, seo: { title, description, ogImage, noindex }, authorId, status, publishedAt, revisions }
User      { email, name, role, image, preferences: { country, mode, audioSpeed }, createdAt }
Redirect  { from, to, status }
```

Indexes: unique `{ slug, type }` on Post, unique `{ slug }` on Test, `{ countryCode, chapterId, status }` on Question, `{ userId, finishedAt: -1 }` on Attempt.

---

## 9. Architecture

- Next.js App Router; server components for content pages, client components for the test player.
- Route handlers under `/app/api/*` validated with Zod; Axios used in client components through a single typed `apiClient` instance with interceptors (auth, error normalisation, retry on 5xx).
- Business logic in pure functions under `/lib/engine` (scoring, pass rules, shuffling, answer normalisation) so it is 100% unit-testable without DB or React.
- Data access through repositories (`/lib/db/repos`) to keep route handlers thin.
- DaisyUI themes: `light` and `dark`, plus a high-contrast theme for accessibility.
- Hosting: Vercel (or similar) + MongoDB Atlas; audio files on S3-compatible storage behind a CDN.

---

## 10. Test-Driven Development Approach

**Process:** For every feature, write a failing test first (red), implement the minimum code to pass (green), then refactor. No PR merges with failing tests or coverage drops.

**Test pyramid and tools**

| Layer         | Tool                                 | Scope                                           | Coverage target         |
| ------------- | ------------------------------------ | ----------------------------------------------- | ----------------------- |
| Unit          | Vitest (or Jest)                     | `/lib/engine`, utils, Zod schemas, Axios client | 95% lines               |
| Component     | React Testing Library                | Test player, question card, timer, CMS forms    | 80%                     |
| Integration   | Vitest + mongodb-memory-server + MSW | API routes, repositories, auth guards           | 80%                     |
| End-to-end    | Playwright                           | Critical journeys on desktop and mobile         | Key flows               |
| Accessibility | axe-core in Playwright               | Every page template                             | Zero serious violations |

**Required unit tests (write these first):**

- `scoreAttempt` passes UK at 18/24 and fails at 17/24.
- AU attempt with 19/20 fails if any `values` question is wrong.
- US 2025 version stops after 12 correct and fails after 9 wrong; 2008 version uses 6 of 10.
- CA passes at 15/20.
- `normalizeAnswer` treats "The Constitution." and "constitution" as equal.
- `seededShuffle` is deterministic for the same seed and never repeats questions.
- Timer auto-submits at zero.
- Post slug uniqueness per type; scheduled posts stay hidden before `publishedAt`.
- Non-admin requests to `/api/admin/*` return 403.

**E2E journeys:** guest takes UK mock test and sees results; user signs up and guest attempt merges; editor publishes a guide that appears in sitemap and listing; Listen mode plays audio; Write mode grades dictation.

**CI:** GitHub Actions running lint, type-check, unit, integration, and Playwright on every PR; Lighthouse CI budget check on preview deploys.

---

## 11. Phased Development Plan

**Phase 0 – Foundation (Week 1)**
Repo, TypeScript strict, Tailwind + DaisyUI, ESLint/Prettier, Vitest, Playwright, CI pipeline, MongoDB connection helper, env validation with Zod. _Done when:_ CI is green with a sample test.

**Phase 1 – Engine and Data (Weeks 2–3)**
TDD the pure engine (scoring, rules, shuffle, normalisation). Mongoose models and repositories with integration tests. Seed script with sample questions for all four countries. _Done when:_ all Section 10 unit tests pass.

**Phase 2 – Test Player (Weeks 4–5)**
Question card, Read/Listen/Write modes, timer, results and review screens, guest attempts in local storage, Axios client. _Done when:_ a guest can complete a mock test in each country on mobile with zero axe violations.

**Phase 3 – CMS and Admin (Weeks 6–7)**
Auth.js with roles, admin layout, Post CRUD with rich text, question bank CRUD with bulk import, test builder, media upload, redirects, revisions. _Done when:_ an editor can publish a blog, guide, how-to, legal page, and new test without code changes.

**Phase 4 – Public Pages and SEO (Weeks 8–9)**
Home page, 20 country pages, listings for blog/guides/how-to, legal pages, metadata, schema, sitemap, cookie consent, analytics. Write first 30 content pieces mapped to the keyword clusters. _Done when:_ Lighthouse ≥ 90 in all categories on every template.

**Phase 5 – Accounts and Progress (Weeks 10–11)**
Dashboard, readiness score, weak-area tests, bookmarks, guest-to-user merge. _Done when:_ E2E merge journey passes.

**Phase 6 – Growth and Monetisation (Week 12+)**
Pre-generated audio for all questions, Speak mode, email reminders, translations (Hindi, Urdu, Arabic, Spanish, Punjabi, Tagalog), optional premium (ad-free, unlimited weak-area tests), affiliate placements for English (SELT) test providers on the high-CPC UK English pages.

---

## 12. Non-Functional Requirements

- **Accessibility:** WCAG 2.2 AA, keyboard-complete test player, captions/transcripts for all audio.
- **Security:** rate-limited APIs, CSRF protection on mutations, sanitised rich text, admin audit log.
- **Privacy:** minimal data, consent before analytics/ads, account deletion and export.
- **Accuracy:** every question carries a source reference; each country page shows a "last reviewed" date and is re-reviewed quarterly or when official rules change.

## 13. Out of Scope (v1)

Native mobile apps, paid human tutoring, application form filing, countries beyond the four listed.
