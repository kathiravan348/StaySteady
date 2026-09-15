# StaySteady — Progress Log

**Single source of truth for build progress across all agents.**

- Read `AGENT_RULES.md` before touching this file.
- Sections 1 and 2 are **mutable** — overwrite them at every session end.
- Section 3 is **mutable** — update task statuses only.
- Section 4 is **append-only** — never edit or delete a past entry.
- Section 5 is **append-only**.

---

## 1. Current Status

```
PHASE:              UI Mock Phase
OVERALL PROGRESS:   1% (1 of 75 tasks done — F-01)
LAST UPDATED:       2026-09-15T05:32:34Z  |  local: 2026-09-15 11:02 IST
LAST AGENT:         Claude Opus 5 (session 1)
BUILD STATE:        PASS (blank React + Vite app, empty library package)
TYPE CHECK:         PASS (baseline strict tsconfig; section 6.1 flags pending F-02)
LINT:               PLACEHOLDER — echo only, real lint is F-03
BLOCKERS:           none (Open Question 7, Node version, is non-blocking)
```

---

## 2. Handoff Note — Read This First

> Rewritten completely at the end of every session. Written for an agent with no memory of any previous session.

```
WHERE THINGS STAND:
  pnpm workspace monorepo exists and is a git repo (branch main, NO commits yet).
  apps/web is a blank React 19 + Vite 6 app that renders "StaySteady".
  packages/ui is an empty library shell (src/index.ts exports nothing).
  typecheck, lint (placeholder) and build all pass from the repo root.

WHAT I COMPLETED THIS SESSION:
  F-01 — repository, package manager, workspace setup.

WHAT IS PARTIALLY DONE:
  Nothing. No half-finished work exists.

EXACT NEXT STEP:
  Claim task F-02 (TypeScript config per standards section 6.1).
  Both tsconfig.json files are a strict-mode baseline only — F-02 adds the
  section 6.1 flags and likely a shared base config at the repo root.

FILES I TOUCHED:
  package.json, pnpm-workspace.yaml, pnpm-lock.yaml, .gitignore, .editorconfig,
  .nvmrc, .claude/launch.json, apps/web/*, packages/ui/*, Docs/PROGRESS_LOG.md

WATCH OUT FOR:
  - Root commands: pnpm typecheck | pnpm lint | pnpm build | pnpm dev
  - "lint" in both packages is an echo placeholder. F-03 must replace it with
    real ESLint + Stylelint. Do not treat the current PASS as real linting.
  - Node installed is v20.11.1, below Vite 7's minimum. Vite is pinned to ^6
    (Open Question 7). Do not bump to Vite 7 unless the owner upgrades Node.
  - pnpm reports "Ignored build scripts: esbuild". Build and dev work anyway;
    leave it unless something actually fails.
  - packageManager is pinned to pnpm@10.34.5; ignore pnpm's upgrade banner.
  - git is 2.21 (old): `git init -b` and some newer flags are unsupported.
    F-04 hook tooling must work with it.
  - Read Frontend_Engineering_Standards.md section 1 before writing any styling
    code. The SCSS-plus-CSS-custom-properties split is decided (decision 1).
  - React Aria Components (decision 6) and the decimal library (decision 7)
    are decided but NOT installed — they belong to L-01 and F-17.

DO NOT:
  Do not start UI screens before the token system and mock layer exist.
  Building screens first means rewriting them later.
  Do not add Tailwind (decision 2).
```

---

## 3. Task Registry

Status values: `TODO` / `CLAIMED` / `PARTIAL` / `DONE` / `BLOCKED`

Only one task may be `CLAIMED` at a time. Claiming requires a session-start log entry.

### Stage F — Foundations

| ID | Task | Status | % | Agent | Notes |
|----|------|--------|---|-------|-------|
| F-01 | Repository, package manager, workspace setup | DONE | 100 | Session 1 | pnpm workspace; apps/web (React+Vite), packages/ui shell |
| F-02 | TypeScript config per standards section 6.1 | TODO | 0 | | |
| F-03 | Lint and format config, all rules from standards section 9 | TODO | 0 | | |
| F-04 | Pre-commit hooks and CI checks | TODO | 0 | | |
| F-05 | SCSS primitive token layer | TODO | 0 | | |
| F-06 | SCSS semantic token layer | TODO | 0 | | |
| F-07 | SCSS domain token layer (gain/loss, severity, market state) | TODO | 0 | | |
| F-08 | Token contract validation at build time | TODO | 0 | | |
| F-09 | Dark theme | TODO | 0 | | |
| F-10 | Light theme | TODO | 0 | | |
| F-11 | High contrast theme | TODO | 0 | | |
| F-12 | Theme runtime switching, no flash on load | TODO | 0 | | |
| F-13 | Density axis (comfortable / compact) | TODO | 0 | | |
| F-14 | Gain/loss convention axis (green-up / red-up) | TODO | 0 | | |
| F-15 | Shared SCSS mixins per standards section 7.4 | TODO | 0 | | |
| F-16 | Branded domain types (money, currency, timestamps, ids) | TODO | 0 | | |
| F-17 | Money representation and arithmetic utilities | TODO | 0 | | |
| F-18 | Number, currency and date formatting utilities | TODO | 0 | | |
| F-19 | Multi-timezone handling utilities | TODO | 0 | | |
| F-20 | Application shell, routing, providers | TODO | 0 | | |
| F-21 | Navigation structure per UI spec section 6 | TODO | 0 | | |

### Stage M — Mock Infrastructure

| ID | Task | Status | % | Agent | Notes |
|----|------|--------|---|-------|-------|
| M-01 | Request interception layer | TODO | 0 | | |
| M-02 | Schema definitions shared by mock and future real layer | TODO | 0 | | |
| M-03 | Deterministic seeded data generators | TODO | 0 | | |
| M-04 | Price history generator, multi-year, realistic volatility | TODO | 0 | | |
| M-05 | Intraday data generator | TODO | 0 | | |
| M-06 | Corporate action data (splits, dividends) | TODO | 0 | | |
| M-07 | Multi-market, multi-currency instrument set | TODO | 0 | | |
| M-08 | Exchange rate history | TODO | 0 | | |
| M-09 | Holdings, lots and transaction data | TODO | 0 | | |
| M-10 | Backtest result data, including an outlier-dependent result | TODO | 0 | | |
| M-11 | News and calendar event data | TODO | 0 | | |
| M-12 | Strategy, signal, approval and order data | TODO | 0 | | |
| M-13 | Health and alert data | TODO | 0 | | |
| M-14 | Scenario switcher (dev panel) | TODO | 0 | | |
| M-15 | Simulated live price ticking | TODO | 0 | | |

### Stage L — Component Library

| ID | Task | Status | % | Agent | Notes |
|----|------|--------|---|-------|-------|
| L-01 | Library package setup, separate from app | TODO | 0 | | |
| L-02 | Component workbench setup with theme switcher | TODO | 0 | | |
| L-03 | Primitives layer | TODO | 0 | | |
| L-04 | Composites layer | TODO | 0 | | |
| L-05 | Layout layer | TODO | 0 | | |
| L-06 | Data display layer | TODO | 0 | | |
| L-07 | State components (loading, empty, error, stale, offline) | TODO | 0 | | |
| L-08 | Data table component | TODO | 0 | | |
| L-09 | Chart wrapper — price/candlestick | TODO | 0 | | |
| L-10 | Chart wrapper — analytical charts | TODO | 0 | | |
| L-11 | Theme-change handling for charts | TODO | 0 | | |
| L-12 | Visual regression test setup | TODO | 0 | | |

### Stage S — Screens

Build order per UI spec section 16. Each screen is done only when all states are built.

| ID | Task | Status | % | Agent | Notes |
|----|------|--------|---|-------|-------|
| S-01 | Overview | TODO | 0 | | |
| S-02 | Holdings | TODO | 0 | | |
| S-03 | Position Detail | TODO | 0 | | |
| S-04 | Instrument Workspace (charts) | TODO | 0 | | |
| S-05 | Watchlists | TODO | 0 | | |
| S-06 | System Health | TODO | 0 | | |
| S-07 | Backtest Setup | TODO | 0 | | |
| S-08 | Backtest Results | TODO | 0 | | |
| S-09 | Backtest Comparison | TODO | 0 | | |
| S-10 | Strategy Library | TODO | 0 | | |
| S-11 | Strategy Editor | TODO | 0 | | |
| S-12 | Signals & Approval Queue | TODO | 0 | | |
| S-13 | Orders | TODO | 0 | | |
| S-14 | Risk & Safety Panel | TODO | 0 | | |
| S-15 | Configuration — markets | TODO | 0 | | |
| S-16 | Configuration — providers | TODO | 0 | | |
| S-17 | Configuration — brokers | TODO | 0 | | |
| S-18 | Configuration — instruments, currencies, alerts | TODO | 0 | | |
| S-19 | News & Events | TODO | 0 | | |
| S-20 | Reports | TODO | 0 | | |
| S-21 | Planning | TODO | 0 | | |
| S-22 | Alerts Centre | TODO | 0 | | |
| S-23 | Audit Log | TODO | 0 | | |

### Stage P — Polish

| ID | Task | Status | % | Agent | Notes |
|----|------|--------|---|-------|-------|
| P-01 | Responsive pass | TODO | 0 | | |
| P-02 | Accessibility pass | TODO | 0 | | |
| P-03 | Full state review across all screens | TODO | 0 | | |
| P-04 | Performance and bundle budget | TODO | 0 | | |

---

## 4. Session History (Append Only)

> Copy the template. Never edit an entry after writing it. Corrections go in a new entry referencing the old one.

### Entry Template

```
────────────────────────────────────────────────────────────
SESSION:        <sequential number>
AGENT:          <model name and version>
START:          <ISO 8601 UTC>  |  local: <local time + zone>
END:            <ISO 8601 UTC>  |  local: <local time + zone>
TASK CLAIMED:   <task id and name>
END STATUS:     DONE | PARTIAL | BLOCKED | ABANDONED
REASON IF NOT DONE: <context limit / usage limit / blocker / other>

COMPLETED:
  - <specific, verifiable statements only>

NOT COMPLETED:
  - <what remains within the claimed task>

FILES CREATED:
  - <path>
FILES MODIFIED:
  - <path> — <what changed>
FILES DELETED:
  - <path> — <why>

DEPENDENCIES ADDED:
  - <name> — <why it was needed>

DECISIONS MADE:
  - <decision> — <reasoning> — <reversible: yes/no>

PROVISIONAL CHOICES (spec was silent):
  - <choice> — <needs confirmation from owner>

VERIFICATION RUN:
  type check:  PASS / FAIL — <errors if any>
  lint:        PASS / FAIL — <errors if any>
  build:       PASS / FAIL — <errors if any>
  themes:      verified in <which themes>
  states:      <which states built and checked>

FINDINGS (out of scope, not fixed):
  - <what is wrong, where>

NEW OPEN QUESTIONS:
  - <question>

NOTES FOR NEXT AGENT:
  - <anything non-obvious>
────────────────────────────────────────────────────────────
```

### Entries

```
────────────────────────────────────────────────────────────
SESSION:        0
AGENT:          (documentation only — no code written)
START:          —
END:            —
TASK CLAIMED:   none
END STATUS:     n/a

NOTES:
  Log initialised. Specification documents and engineering standards
  written. No code exists yet. First coding session starts at F-01.
────────────────────────────────────────────────────────────

────────────────────────────────────────────────────────────
SESSION:        1 — START ENTRY
AGENT:          Claude Opus 5 (claude-opus-5)
START:          2026-09-15T05:28:26Z  |  local: 2026-09-15 10:58 IST (UTC+05:30)
TASK CLAIMED:   F-01 Repository, package manager, workspace setup

PRE-WORK VERIFICATION:
  type check:  n/a — no code exists
  lint:        n/a — no code exists
  build:       n/a — no code exists
  discrepancy: none; codebase state matches log (docs only, not a git repo)

ENVIRONMENT FOUND:
  Node v20.11.1, npm 10.9.0, corepack 0.23.0, git 2.21.0, pnpm not installed

OWNER DECISIONS RECEIVED BEFORE START (recorded in sections 5 and 6):
  - Framework: React + Vite SPA
  - Open Q1: React Aria Components
  - Open Q2: decimal library
  - Open Q3: pnpm workspace monorepo
────────────────────────────────────────────────────────────

────────────────────────────────────────────────────────────
SESSION:        1 — END ENTRY
AGENT:          Claude Opus 5 (claude-opus-5)
START:          2026-09-15T05:28:26Z  |  local: 2026-09-15 10:58 IST (UTC+05:30)
END:            2026-09-15T05:32:34Z  |  local: 2026-09-15 11:02 IST (UTC+05:30)
TASK CLAIMED:   F-01 Repository, package manager, workspace setup
END STATUS:     DONE
REASON IF NOT DONE: n/a

COMPLETED:
  - git repository initialised, HEAD on branch main, no commits made
  - pnpm workspace with apps/* and packages/* globs
  - apps/web: React + Vite + TypeScript, renders placeholder <main>
  - packages/ui: empty library shell, exports "." -> src/index.ts
  - Root scripts typecheck / lint / build / dev delegate to workspace packages
  - .gitignore (ignores .env* so credentials cannot be committed), .editorconfig, .nvmrc

NOT COMPLETED:
  - nothing within F-01

FILES CREATED:
  - package.json, pnpm-workspace.yaml, pnpm-lock.yaml
  - .gitignore, .editorconfig, .nvmrc
  - .claude/launch.json — dev server preview config used for verification
  - apps/web/package.json, tsconfig.json, vite.config.ts, index.html
  - apps/web/src/main.tsx, apps/web/src/App.tsx
  - packages/ui/package.json, tsconfig.json, src/index.ts
FILES MODIFIED:
  - Docs/PROGRESS_LOG.md — sections 1, 2, 3 (F-01), appended 4, 5, 6
FILES DELETED:
  - none

DEPENDENCIES ADDED:
  - pnpm 10.34.5 (global, via npm -g) — package manager per decision 8;
    corepack enable was not used because on Windows it writes to Program Files
  - react 19.3.0, react-dom 19.3.0 — UI framework per decision 9
  - vite 6.4.3, @vitejs/plugin-react 4.7.0 — bundler/dev server per decision 9
  - typescript 5.9.3 — type checking (both packages)
  - @types/react 19.3.0, @types/react-dom 19.3.0 — React type definitions

DECISIONS MADE:
  - Package names @staysteady/web and @staysteady/ui — conventional scope — reversible: yes
  - vite.config.ts uses a default export — Vite requires it (standards 6.2 exception) — reversible: n/a

PROVISIONAL CHOICES (spec was silent):
  - Vite pinned to ^6 and .nvmrc set to 20.11.1 to match installed Node — needs owner answer to Open Question 7
  - Lint script is an echo placeholder so the root lint command exists — replaced by F-03
  - Library "build" runs tsc --noEmit only — real library build output is L-01

VERIFICATION RUN:
  type check:  PASS — pnpm typecheck, both packages, exit 0
  lint:        PASS (placeholder only, no rules run) — exit 0
  build:       PASS — pnpm build, vite produced dist (224.04 kB JS, 69.58 kB gzip)
  dev server:  PASS — http://localhost:5173 rendered "StaySteady", no console or server errors
  themes:      n/a — no theme system exists yet (F-09..F-12)
  states:      n/a — no screens exist

FINDINGS (out of scope, not fixed):
  - git 2.21.0 is old; may limit hook tooling choices in F-04
  - pnpm ignored esbuild's build script; no functional impact observed

NEW OPEN QUESTIONS:
  - Open Question 7 (Node upgrade to 22 LTS)

NOTES FOR NEXT AGENT:
  - Nothing is committed; the owner has not asked for a commit yet
  - Bundle-size budget (standards 11) should be set in P-04; current blank build is ~70 kB gzip, mostly React
────────────────────────────────────────────────────────────
```

---

## 5. Open Questions For The Owner (Append Only)

> Agents add here when a spec is silent. Owner answers inline. Answered items stay for the record.

| # | Raised by | Date | Question | Answer |
|---|-----------|------|----------|--------|
| 1 | — | — | Which headless component library or component kit for the library layer? | React Aria Components — owner, 2026-09-15 (see decision 6) |
| 2 | — | — | Integer minor units or a decimal library for money? | Decimal library; specific library chosen in F-17 — owner, 2026-09-15 (see decision 7) |
| 3 | — | — | Library as separate repository or workspace package? | pnpm workspace package in same repo — owner, 2026-09-15 (see decision 8) |
| 6 | Session 1 | 2026-09-15 | Framework/bundler not named in any spec | React + Vite SPA — owner, 2026-09-15 (see decision 9) |
| 7 | Session 1 | 2026-09-15 | Node v20.11.1 installed is below Vite 7 minimum (20.19). Upgrade Node to 22 LTS? | unanswered — provisional: Vite 6 pinned |
| 4 | — | — | Does the 250-line limit apply to test and story files? | unanswered |
| 5 | — | — | Is high contrast theme needed at launch or later? | unanswered |

---

## 6. Decision Record (Append Only)

> Decisions that later agents must not reverse without a decision-change entry here.

| # | Date | Decision | Reasoning | Reversible | Changed by |
|---|------|----------|-----------|------------|------------|
| 1 | — | SCSS authors tokens, CSS custom properties apply them at runtime | SCSS alone cannot switch themes without a reload | No — structural | — |
| 2 | — | No Tailwind; CSS Modules with SCSS instead | Avoids two sources of truth for design tokens | No — structural | — |
| 3 | — | Theme, density and gain/loss convention are three independent axes | Prevents theme count multiplying | Yes | — |
| 4 | — | Money never represented as a plain number | Floating point error accumulates across simulated trades | No — structural | — |
| 5 | — | Mock data served through request interception, not hardcoded fixtures | Allows real backend swap with no UI changes | No — structural | — |
| 6 | 2026-09-15 | Headless component library: React Aria Components | Strongest keyboard/screen-reader support; timezone-aware date primitives suit multi-market needs | No — structural | Owner (session 1) |
| 7 | 2026-09-15 | Money represented with a decimal library, not integer minor units | FX rates, fractional fund units and crypto precision exceed fixed minor-unit scales | No — structural | Owner (session 1) |
| 8 | 2026-09-15 | pnpm workspace monorepo: `apps/web` (app), `packages/ui` (library) | One pipeline; import boundaries enforceable by lint | Yes, with effort | Owner (session 1) |
| 9 | 2026-09-15 | React + Vite single-page app, no server rendering | Single user, mock phase with request interception; SSR adds cost with no benefit | Yes, with effort | Owner (session 1) |
