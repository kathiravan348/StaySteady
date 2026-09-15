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
OVERALL PROGRESS:   6% (4 of 65 active tasks done — F-01 to F-04; 10 merged/dropped)
LAST UPDATED:       2026-09-15T06:19:12Z  |  local: 2026-09-15 11:49 IST
LAST AGENT:         Claude Opus 5 (session 4)
BUILD STATE:        PASS (blank React + Vite app, empty library package)
TYPE CHECK:         PASS (all section 6.1 flags active via tsconfig.base.json)
LINT:               PASS — minimal ESLint recommended presets + Prettier (decision 13)
BLOCKERS:           none (Open Questions 7/8, Node version, non-blocking)
```

---

## 2. Handoff Note — Read This First

> Rewritten completely at the end of every session. Written for an agent with no memory of any previous session.

```
WHERE THINGS STAND:
  pnpm workspace monorepo, git branch main, HEAD ddc28e9. Session 2–3 changes
  are staged by owner; session 4 (F-04) changes are NOT staged or committed.
  apps/web is a blank React 19 + Vite 6 app that renders "StaySteady".
  packages/ui is an empty library shell (src/index.ts exports nothing).
  Lint is minimal (one eslint.config.mjs + Prettier). typecheck, lint, build pass.
  Token system exists: apps/web/src/styles/global.scss (imported in main.tsx)
  emits 142 CSS custom properties on :root — primitives, semantic and domain
  layers — with dark theme values as the default and color-scheme: dark.
  Owner merged old F-09–F-15 into one F-09 (decision 14).

WHAT I COMPLETED THIS SESSION:
  F-04 — Styling foundation (SCSS tokens as CSS custom properties).

WHAT IS PARTIALLY DONE:
  Nothing. No half-finished work exists.

EXACT NEXT STEP:
  Claim task F-09 (Themes and display settings). Suggested shape:
  - Keep dark on :root as default; add [data-theme='light'] and, if Open
    Question 5 says so, [data-theme='high-contrast'] remapping ONLY the
    semantic and domain maps (never primitives)
  - Theme resolved before first paint (small inline script in index.html
    reading saved preference / prefers-color-scheme)
  - [data-density] and [data-gain-loss='red-up'] as separate attributes
  - Section 7.4 mixins go in apps/web/src/styles/mixins/
  Ask the owner about Open Question 5 (high contrast at launch) first.

FILES I TOUCHED:
  apps/web/src/styles/** (new), apps/web/src/main.tsx (global.scss import),
  apps/web/package.json (sass), pnpm-lock.yaml, Docs/PROGRESS_LOG.md

WATCH OUT FOR:
  - Root commands: pnpm typecheck | pnpm lint | pnpm build | pnpm dev | pnpm format
  - Token names: --surface-*, --text-*, --border-*, --interactive-*, --focus-ring,
    --change-gain/loss/flat, --severity-low/medium/high/critical, --market-*,
    --freshness-live/delayed/stale, --mode-*, --chart-series-1..8,
    --motion-price-flash. Components use these, never --color-* primitives.
  - Semantic/domain maps reference primitives through palette('hue', step)
    (styles/functions/_palette.scss). New token values follow the same pattern.
  - styles/mixins/_custom-properties.scss serialises lists item by item; do not
    replace it with plain #{$value} or meta.inspect — font names lose quotes
    or one-item lists emit invalid "(a,)" syntax (bug found and fixed session 4).
  - sass is pinned ~1.99.0: 1.100+ requires Node >=20.19 (Open Question 7).
  - Dark-theme contrast measured in browser: lowest pair text-muted on
    surface-overlay 4.91:1. Recheck contrast when adding light/high-contrast.
  - Lint no longer checks SCSS, file length or import boundaries. Standards
    still ask for them as habits: tokens in styles/tokens, no raw colours or
    sizes in component styles, camelCase CSS Module classes, files under
    ~250 lines, features never importing each other.
  - Never add compiler flags per package that weaken tsconfig.base.json.
  - New code must satisfy every 6.1 flag (array[i] is T | undefined, optional
    props reject explicit undefined, override keyword, export type for types).
  - ESLint 9 is npm-deprecated; ESLint 10 needs Node >=20.19
    (Open Question 8). Do not bump majors unless the owner upgrades Node.
  - Docs/ is in .prettierignore — never run a formatter on spec documents.
  - Node installed is v20.11.1, below Vite 7's minimum. Vite is pinned to ^6
    (Open Question 7). Do not bump to Vite 7 unless the owner upgrades Node.
  - pnpm reports "Ignored build scripts: esbuild". Build and dev work anyway;
    leave it unless something actually fails.
  - packageManager is pinned to pnpm@10.34.5; ignore pnpm's upgrade banner.
  - git is 2.21 (old): `git init -b` and some newer flags are unsupported.
    (Pre-commit hooks were dropped — decision 11.)
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

Status values: `TODO` / `CLAIMED` / `PARTIAL` / `DONE` / `BLOCKED` / `DROPPED`

Only one task may be `CLAIMED` at a time. Claiming requires a session-start log entry.

### Stage F — Foundations

| ID | Task | Status | % | Agent | Notes |
|----|------|--------|---|-------|-------|
| F-01 | Repository, package manager, workspace setup | DONE | 100 | Session 1 | pnpm workspace; apps/web (React+Vite), packages/ui shell |
| F-02 | TypeScript config per standards section 6.1 | DONE | 100 | Session 2 | Root tsconfig.base.json; all flags proven by failing fixture |
| F-03 | Lint and format config, all rules from standards section 9 | DONE | 100 | Session 3 | Reworked to minimal: one eslint.config.mjs + Prettier, no Stylelint (decision 13) |
| F-04 | Styling foundation — SCSS tokens (primitive, semantic, domain: gain/loss, severity, market state) emitted as CSS custom properties | DONE | 100 | Session 4 | 142 custom properties in apps/web/src/styles; replaces old F-04–F-08 (decision 11) |
| F-05 | ~~SCSS primitive token layer~~ | DROPPED | — | | Merged into F-04 (decision 11) |
| F-06 | ~~SCSS semantic token layer~~ | DROPPED | — | | Merged into F-04 (decision 11) |
| F-07 | ~~SCSS domain token layer~~ | DROPPED | — | | Merged into F-04 (decision 11) |
| F-08 | ~~Token contract validation at build time~~ | DROPPED | — | | Removed entirely (decision 11) |
| F-09 | Themes and display settings — dark, light and high-contrast themes; runtime switching with no flash on load; density axis (comfortable/compact); gain/loss convention axis (green-up/red-up); shared SCSS mixins (7.4) | CLAIMED | 0 | Session 5 | Replaces old F-09–F-15 (decision 14). High contrast included (Open Question 5) |
| F-10 | ~~Light theme~~ | DROPPED | — | | Merged into F-09 (decision 14) |
| F-11 | ~~High contrast theme~~ | DROPPED | — | | Merged into F-09 (decision 14) |
| F-12 | ~~Theme runtime switching, no flash on load~~ | DROPPED | — | | Merged into F-09 (decision 14) |
| F-13 | ~~Density axis~~ | DROPPED | — | | Merged into F-09 (decision 14) |
| F-14 | ~~Gain/loss convention axis~~ | DROPPED | — | | Merged into F-09 (decision 14) |
| F-15 | ~~Shared SCSS mixins~~ | DROPPED | — | | Merged into F-09 (decision 14) |
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

────────────────────────────────────────────────────────────
SESSION:        2 — START ENTRY
AGENT:          Claude Opus 5 (claude-opus-5)
START:          2026-09-15T05:40:18Z  |  local: 2026-09-15 11:10 IST (UTC+05:30)
TASK CLAIMED:   F-02 TypeScript config per standards section 6.1

PRE-WORK VERIFICATION:
  git:         owner committed session 1 work as ddc28e9 "initial commit"; tree clean
  type check:  PASS — exit 0
  lint:        PASS (placeholder only) — exit 0
  build:       PASS — exit 0
  discrepancy: none; codebase matches session 1 end entry
────────────────────────────────────────────────────────────

────────────────────────────────────────────────────────────
SESSION:        2 — END ENTRY
AGENT:          Claude Opus 5 (claude-opus-5)
START:          2026-09-15T05:40:18Z  |  local: 2026-09-15 11:10 IST (UTC+05:30)
END:            2026-09-15T05:42:27Z  |  local: 2026-09-15 11:12 IST (UTC+05:30)
TASK CLAIMED:   F-02 TypeScript config per standards section 6.1
END STATUS:     DONE
REASON IF NOT DONE: n/a

COMPLETED:
  - Root tsconfig.base.json with strict plus every section 6.1 flag:
    noUncheckedIndexedAccess, exactOptionalPropertyTypes, noUnusedLocals,
    noUnusedParameters, noImplicitReturns, noFallthroughCasesInSwitch,
    noImplicitOverride, forceConsistentCasingInFileNames, isolatedModules
  - apps/web and packages/ui tsconfigs now extend the base; they only add include/types
  - Build fails on type error: web build runs tsc --noEmit before vite build; ui build is tsc --noEmit

NOT COMPLETED:
  - nothing within F-02

FILES CREATED:
  - tsconfig.base.json
FILES MODIFIED:
  - apps/web/tsconfig.json — extends base, keeps vite/client types
  - packages/ui/tsconfig.json — extends base
  - Docs/PROGRESS_LOG.md — sections 1, 2, 3 (F-02), appended 4
FILES DELETED:
  - none

DEPENDENCIES ADDED:
  - none

DECISIONS MADE:
  - Single shared base config at repo root rather than per-package flags — one place to enforce 6.1, packages cannot drift — reversible: yes
  - skipLibCheck kept on — spec silent; avoids failing on third-party .d.ts; applies to node_modules only, not project code — reversible: yes

PROVISIONAL CHOICES (spec was silent):
  - skipLibCheck: true (see above) — owner may request false

VERIFICATION RUN:
  type check:  PASS — pnpm typecheck, exit 0
  lint:        PASS (placeholder only, no rules run) — exit 0
  build:       PASS — pnpm build, exit 0 (bundle unchanged, 69.58 kB gzip)
  flag proof:  scratchpad fixture extending tsconfig.base.json FAILED as intended with
               TS7006, TS2322, TS2375, TS6133 x2, TS7030, TS7029, TS4114, TS1205, TS1261/TS1149
               — one expected error per flag; fixture is outside the repo
  showConfig:  both packages report every 6.1 flag true in effective config
  themes:      n/a — no theme system exists yet
  states:      n/a — no screens exist

FINDINGS (out of scope, not fixed):
  - none

NEW OPEN QUESTIONS:
  - none

NOTES FOR NEXT AGENT:
  - Session 2 changes are uncommitted; owner commits
────────────────────────────────────────────────────────────

────────────────────────────────────────────────────────────
SESSION:        3 — START ENTRY
AGENT:          Claude Opus 5 (claude-opus-5)
START:          2026-09-15T05:45:31Z  |  local: 2026-09-15 11:15 IST (UTC+05:30)
TASK CLAIMED:   F-03 Lint and format config, all rules from standards section 9

PRE-WORK VERIFICATION:
  git:         HEAD ddc28e9; session 2 files staged in index but not committed
  type check:  PASS — exit 0
  lint:        PASS (placeholder only) — exit 0
  build:       PASS — exit 0
  discrepancy: none; state matches session 2 end entry

OWNER INPUT:
  - Open Question 4 still unanswered; owner said to proceed. Provisional: test and
    story files get a 250-line warning, not an error (see session 3 end entry).

ENVIRONMENT CONSTRAINT FOUND:
  - eslint 10.x and stylelint 17.x require Node >=20.19; installed Node is 20.11.1.
    Will pin eslint 9.x and stylelint 16.x (ties to Open Question 7).
────────────────────────────────────────────────────────────

────────────────────────────────────────────────────────────
SESSION:        3 — END ENTRY
AGENT:          Claude Opus 5 (claude-opus-5)
START:          2026-09-15T05:45:31Z  |  local: 2026-09-15 11:15 IST (UTC+05:30)
END:            2026-09-15T06:02:15Z  |  local: 2026-09-15 11:32 IST (UTC+05:30)
TASK CLAIMED:   F-03 Lint and format config, all rules from standards section 9
END STATUS:     DONE
REASON IF NOT DONE: n/a

COMPLETED:
  - ESLint 9 flat config: typescript-eslint strictTypeChecked + 6.2/6.3 rules
    (no any, no object-literal assertions, no non-null, described ts comments,
    explicit module boundary types, no enums, exhaustive switch, prefer-readonly,
    type-only imports); import order; no default exports (config/stories exempt);
    restricted paths (features never import each other — zones generated from
    folders; library never imports app; library layers import downward only);
    no deep @staysteady/ui/* imports; no data-fetching/routing imports in library;
    jsx-a11y strict; one component per file; 250-line error + 200-line warning;
    max-depth 4; max-params 4; described eslint-disable comments only
  - Stylelint 16 + standard-scss: no raw colours/spacing/radius/font-size/duration
    outside token files; max nesting 3; no ids; no !important; @media only in
    mixins; focus outline never removed; camelCase classes; module files: no
    element selectors, no :global, no SCSS variables in values
  - Prettier with Docs/ ignored; root scripts lint, lint:es, lint:style, format, format:check
  - Removed echo lint placeholders from both packages
  - OWNER INTERRUPTION (mid-session): owner judged Foundations too heavy for a personal
    project. Applied decisions 10–12: relaxed lint, merged old F-04–F-08 into new F-04,
    dropped hooks/CI/token contract, edited standards doc 3.4, 5.4, 9

NOT COMPLETED:
  - nothing within F-03

FILES CREATED:
  - eslint.config.mjs, stylelint.config.mjs, .prettierrc.json, .prettierignore
  - tooling/eslint/typescript.mjs, imports.mjs, react.mjs, size.mjs, comments.mjs, plugin.mjs
FILES MODIFIED:
  - package.json — lint/format scripts, devDependencies
  - apps/web/package.json, packages/ui/package.json — removed placeholder lint scripts
  - pnpm-workspace.yaml — Prettier quote style only
  - pnpm-lock.yaml — new dependencies
  - Docs/Frontend_Engineering_Standards.md — sections 3.4, 5.4, 9 (owner request, decision 12)
  - Docs/PROGRESS_LOG.md — sections 1, 2, 3, appended 4, 5, 6
FILES DELETED:
  - tooling/eslint/rules/component-filename.mjs — rule removed by owner (decision 10);
    created and deleted within this session
  - Temporary lint fixtures under apps/web/src/features, apps/web/src/styles,
    packages/ui/src/charts, packages/ui/src/primitives — created and deleted this session,
    never committed; contents verified before deletion

DEPENDENCIES ADDED (root devDependencies):
  - eslint 9.39.5, @eslint/js 9.39.5 — linter; v10 needs Node >=20.19
  - typescript-eslint 8.70.0 — TypeScript rules (6.2/6.3)
  - eslint-plugin-import-x 4.17.1, eslint-import-resolver-typescript 4.4.5 — import order and restricted paths
  - eslint-plugin-jsx-a11y 6.10.2 — markup accessibility (section 9)
  - eslint-plugin-react 7.37.5 — one component per file
  - @eslint-community/eslint-plugin-eslint-comments 4.8.1 — described suppressions (6.2)
  - eslint-config-prettier 10.1.8 — disables rules Prettier owns
  - globals 17.12.0 — Node globals for .mjs config files
  - prettier 3.9.6 — formatter (section 9)
  - stylelint 16.26.1, stylelint-config-standard-scss 16.0.0 — SCSS rules (7.2); v17 needs Node >=20.19
  - typescript ~5.9.2 at root — required peer of typescript-eslint

DECISIONS MADE:
  - One root ESLint config for the whole monorepo, split into tooling/eslint modules — reversible: yes
  - Feature isolation zones generated from apps/web/src/features folders at config load — reversible: yes
  - React version set explicitly to 19.0 in lint settings (detect fails from root) — reversible: yes
  - Owner decisions 10, 11, 12 (see section 6)

PROVISIONAL CHOICES (spec was silent):
  - Open Q4: tests/stories warn at 250 lines, never error
  - Library layer folder names: primitives, composites, layout, data-display, charts (from 4.2)
  - Library banned imports list: @tanstack/react-query, msw, react-router(-dom), @tanstack/react-router
  - Class naming: camelCase (7.3 said choose once)
  - Prettier: single quotes, trailing commas, printWidth 100
  - Stylelint token/theme/mixin exemption paths: **/styles/{tokens,themes,mixins}/**

VERIFICATION RUN:
  fixtures:    temporary violation files, before relaxation: ESLint 30 errors + 3 warnings,
               every targeted rule fired; 260-line test file warned only; Stylelint flagged
               every targeted rule in a .module.scss; token and mixin fixtures produced
               zero errors (exemptions work). Fixtures then deleted.
  type check:  PASS — exit 0 (after relaxation and fixture removal)
  lint:        PASS — eslint, stylelint, prettier --check all exit 0
  build:       PASS — exit 0, bundle unchanged 69.58 kB gzip
  themes:      n/a — no theme system exists yet
  states:      n/a — no screens exist

MISTAKES THIS SESSION (recorded per rules section 7):
  - First stylelint config set selector-max-compound-selectors 3 alongside max-nesting-depth 3,
    which silently blocked 3-level nesting the standard allows. Found by fixture, raised to 4,
    then removed entirely by owner decision 10.

FINDINGS (out of scope, not fixed):
  - eslint 9.39.5 is npm-deprecated (unsupported) — Open Question 8
  - pnpm ignored build scripts for esbuild and unrs-resolver; lint and build work regardless

NEW OPEN QUESTIONS:
  - Open Question 8 (ESLint 9 deprecated / Node upgrade)

NOTES FOR NEXT AGENT:
  - Session 2 and 3 changes are uncommitted; owner commits
  - Lint is intentionally relaxed; do not re-add removed rules without a decision-change entry
────────────────────────────────────────────────────────────

────────────────────────────────────────────────────────────
SESSION:        3 — CORRECTION ENTRY (references session 3 end entry above)
AGENT:          Claude Opus 5 (claude-opus-5)
TIME:           2026-09-15T06:08:28Z  |  local: 2026-09-15 11:38 IST (UTC+05:30)
TASK:           F-03 rework — owner asked to revert F-03 to minimal lint (decision 13)
END STATUS:     DONE

SUPERSEDES in the session 3 end entry:
  - The ESLint rule list, Stylelint rules, tooling/eslint modules, the dependency list
    and the provisional choices tied to them (Q4 handling, layer folder names, banned
    library imports, Stylelint exemption paths, camelCase enforcement)

COMPLETED:
  - Deleted tooling/ (6 files, contents verified) and stylelint.config.mjs
  - eslint.config.mjs rewritten: @eslint/js + typescript-eslint + jsx-a11y (.tsx)
    recommended presets, Node globals for .mjs, eslint-config-prettier last
  - Root scripts now: lint = eslint . && prettier --check . ; format = prettier --write .
  - Standards doc 5.1, 7.2, 8, 9 edited: file length, import boundaries and raw SCSS
    values become habits, not lint rules

DEPENDENCIES REMOVED:
  - stylelint, stylelint-config-standard-scss, eslint-plugin-import-x,
    eslint-import-resolver-typescript, eslint-plugin-react,
    @eslint-community/eslint-plugin-eslint-comments — no longer used
DEPENDENCIES KEPT:
  - eslint 9.39.5, @eslint/js, typescript-eslint, eslint-plugin-jsx-a11y,
    eslint-config-prettier, globals, prettier, typescript

VERIFICATION RUN:
  type check:  PASS — exit 0
  lint:        PASS — eslint and prettier --check exit 0
  build:       PASS — exit 0, bundle unchanged
  stale refs:  none outside append-only log history

NOTES FOR NEXT AGENT:
  - Session 2 and 3 changes are uncommitted; owner commits
  - Do not re-add custom lint rules or Stylelint without a decision-change entry
────────────────────────────────────────────────────────────

────────────────────────────────────────────────────────────
SESSION:        4 — START ENTRY
AGENT:          Claude Opus 5 (claude-opus-5)
START:          2026-09-15T06:12:34Z  |  local: 2026-09-15 11:42 IST (UTC+05:30)
TASK CLAIMED:   F-04 Styling foundation — SCSS tokens emitted as CSS custom properties

PRE-WORK VERIFICATION:
  git:         HEAD ddc28e9; all session 2–3 changes staged by owner, not committed
  type check:  PASS — exit 0
  lint:        PASS — exit 0
  build:       PASS — exit 0
  discrepancy: none; state matches session 3 correction entry

ENVIRONMENT CONSTRAINT FOUND:
  - sass latest (1.104.1) requires Node >=20.19; installed Node is 20.11.1.
    Will pin the newest sass release supporting Node 20.11 (ties to Open Question 7).
────────────────────────────────────────────────────────────

────────────────────────────────────────────────────────────
SESSION:        4 — END ENTRY
AGENT:          Claude Opus 5 (claude-opus-5)
START:          2026-09-15T06:12:34Z  |  local: 2026-09-15 11:42 IST (UTC+05:30)
END:            2026-09-15T06:19:12Z  |  local: 2026-09-15 11:49 IST (UTC+05:30)
TASK CLAIMED:   F-04 Styling foundation — SCSS tokens emitted as CSS custom properties
END STATUS:     DONE
REASON IF NOT DONE: n/a

COMPLETED:
  - Layer 1 primitives: colour scales (neutral, blue, green, red, amber, magenta, teal,
    purple), space 0–11, radius, font families, font sizes, weights, line heights,
    tabular-nums font variant, shadows, z-index scale, durations, easings
  - Layer 2 semantic (dark default): surface, text, border, interactive, focus-ring
  - Layer 3 domain (dark default): change gain/loss/flat, severity low→critical,
    market open/pre-open/post-close/closed/holiday, freshness live/delayed/stale,
    automation mode, chart series 1–8, motion price-flash
  - custom-properties mixin flattens nested maps to --layer-key-subkey properties;
    palette() function makes semantic/domain values reference primitives via var()
  - global.scss emits all layers on :root with color-scheme: dark; imported in main.tsx
  - OWNER DECISION mid-session: old F-09–F-15 merged into one F-09 (decision 14)

NOT COMPLETED:
  - nothing within F-04 (themes, switching, density and convention axes are F-09)

FILES CREATED:
  - apps/web/src/styles/global.scss
  - apps/web/src/styles/functions/_palette.scss
  - apps/web/src/styles/mixins/_custom-properties.scss
  - apps/web/src/styles/tokens/_primitives.scss, _semantic.scss, _domain.scss
FILES MODIFIED:
  - apps/web/src/main.tsx — side-effect import of styles/global.scss
  - apps/web/package.json, pnpm-lock.yaml — sass devDependency
  - Docs/PROGRESS_LOG.md — sections 1, 2, 3 (F-04, F-09–F-15), appended 4, 6
FILES DELETED:
  - none

DEPENDENCIES ADDED:
  - sass ~1.99.0 (apps/web dev) — Vite needs it to compile SCSS; 1.99.0 is the last
    release supporting Node >=14, 1.100.0+ requires Node >=20.19 (verified via npm)

DECISIONS MADE:
  - Styles live in apps/web/src/styles (standards 8 "styles, tokens and themes" area),
    not a separate package — promote later if the library workbench needs them — reversible: yes
  - No prefix on custom property names (--surface-base, not --ss-surface-base) — reversible: yes
  - Dark values emitted on :root as the default theme (UI spec 2) — reversible: yes
  - Global stylesheet imported in main.tsx; app shell and providers remain F-20 — reversible: yes

PROVISIONAL CHOICES (spec was silent):
  - All palette hex values, spacing and font-size scales — owner may retune visually
  - Severity colours: low neutral, medium blue, high amber, critical magenta
    (spec: amber for warnings, critical distinct from loss red)
  - Automation mode colours: simulation blue, observation teal, manual-approval amber,
    full-automation purple
  - Chart series order avoids green/red so series never read as gain/loss

VERIFICATION RUN:
  type check:  PASS — exit 0
  lint:        PASS — eslint and prettier --check exit 0
  build:       PASS — exit 0; CSS 4.50 kB (1.39 kB gzip), JS unchanged 69.58 kB gzip
  css output:  142 custom properties; font stacks keep quoted names; shadows valid
  browser:     dev server, computed :root — color-scheme dark; var chains resolve
               (--change-gain → rgb(76,193,130), --surface-base → rgb(17,21,26));
               all three shadows apply to a real element
  contrast:    measured vs surface-base unless noted — text-primary 17.07, text-secondary
               9.83, text-muted 6.57, text-muted on surface-overlay 4.91, gain 8.08,
               loss 6.07, severity-high 10.01, severity-critical 5.55,
               on-primary on interactive-primary 5.92 — all >= 4.5 (WCAG AA)
  themes:      dark default only; other themes are F-09
  states:      n/a — no screens exist

MISTAKES THIS SESSION (recorded per rules section 7):
  - First mixin used meta.inspect directly; one-item comma lists (the shadow tokens after
    Prettier added a trailing comma) emitted invalid "(0 1px 2px …,)". Found by inspecting
    built CSS; fixed by serialising list items individually. Re-verified in build and browser.

FINDINGS (out of scope, not fixed):
  - pnpm ignored the @parcel/watcher build script pulled in by sass; build and dev unaffected

NEW OPEN QUESTIONS:
  - none (Open Question 5, high contrast at launch, now matters for F-09)

NOTES FOR NEXT AGENT:
  - Session 4 changes are not staged or committed; owner commits
────────────────────────────────────────────────────────────

────────────────────────────────────────────────────────────
SESSION:        5 — START ENTRY
AGENT:          Claude Opus 5 (claude-opus-5)
START:          2026-09-15T06:25:53Z  |  local: 2026-09-15 11:55 IST (UTC+05:30)
TASK CLAIMED:   F-09 Themes and display settings (covers old F-09–F-15, decision 14)

PRE-WORK VERIFICATION:
  git:         HEAD ddc28e9; sessions 2–4 changes all staged by owner, not committed
  type check:  PASS — exit 0
  lint:        PASS — exit 0
  build:       PASS — exit 0
  discrepancy: none; state matches session 4 end entry

OWNER INPUT:
  - Owner: "complete all until F15" — taken as the answer to Open Question 5:
    high-contrast theme is built now, at launch.
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
| 8 | Session 3 | 2026-09-15 | ESLint 9.39.5 is marked deprecated (unsupported) by npm; ESLint 10 and Stylelint 17 need Node >=20.19. Upgrade Node to unblock them? (same fix as Q7) | unanswered — provisional: ESLint 9, Stylelint 16 pinned |
| 4 | — | — | Does the 250-line limit apply to test and story files? | Moot — file length no longer lint-enforced (decision 13), 2026-09-15 |
| 5 | — | — | Is high contrast theme needed at launch or later? | At launch — owner ("complete all until F15"), 2026-09-15 |

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
| 10 | 2026-09-15 | DECISION CHANGE: lint relaxed — removed 50-line function limit, complexity cap, component file-name rule, selector compound cap. Kept 250-line file limit, max-depth 4, max-params 4, one component per file, strict TS rules, no raw values, a11y | Personal project; those rules add friction without preventing wrong numbers or broken themes | Yes | Owner (session 3) |
| 11 | 2026-09-15 | DECISION CHANGE: old F-04–F-08 merged into one F-04 "Styling foundation"; pre-commit hooks, CI and build-time token contract validation dropped | Personal project; one token pass is enough, checks run locally before commit | Yes | Owner (session 3) |
| 12 | 2026-09-15 | DECISION CHANGE: Frontend_Engineering_Standards.md sections 3.4, 5.4 and 9 edited to match decisions 10 and 11. AGENT_RULES.md needed no change | Keeps docs authoritative so future sessions do not re-add removed rules | Yes | Owner (session 3) |
| 13 | 2026-09-15 | DECISION CHANGE (supersedes 10): lint reduced to one eslint.config.mjs — @eslint/js, typescript-eslint and jsx-a11y recommended presets + Prettier. tooling/ and Stylelint removed. Standards 5.1, 7.2, 8, 9 edited to call file length, import boundaries and raw SCSS values habits | Personal project; strict tsc flags already catch most real errors | Yes | Owner (session 3) |
| 14 | 2026-09-15 | DECISION CHANGE: old F-09–F-15 (dark, light, high contrast, runtime switching, density, gain/loss convention, mixins) merged into one F-09 "Themes and display settings" | Personal project; these share one attribute-on-root mechanism and are simpler built together | Yes | Owner (session 4) |
