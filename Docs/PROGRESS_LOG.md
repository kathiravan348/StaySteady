# StaySteady — Progress Log
 
**Single source of truth for build progress across all agents.**
 
- Read `AGENT_RULES.md` before touching this file.
- Sections 1 and 2 are **mutable** — overwrite them at every session end.
- Section 3 is **mutable** — update task statuses only.
- Section 4 is **append-only** — never edit or delete a past entry. Sessions older than the last
  three live in [PROGRESS_ARCHIVE.md](./PROGRESS_ARCHIVE.md).
- Section 5 is **append-only**.
- Decisions live in [DECISIONS.md](./DECISIONS.md) — append there, not here.
---
 
## 1. Current Status
 
```
PHASE:              Stage S Screens — in progress (S-01 to S-15 done); requirements review done (session 37)
OVERALL PROGRESS:   59% (52 of 88 active tasks done; Stage F 100%; Stage M 15 of 17;
                    Stage L 11 of 14 + L-12 partial; Stage S 15 of 33; Stage E 0 of 9)
LAST UPDATED:       2026-09-16T15:55:00Z  |  local: 2026-09-16 21:25 IST
LAST AGENT:         session 37 (requirements review — docs only, no code changed)
BUILD STATE:        PASS (Vite 6 + React 19; JS one 3,120 kB chunk, up from 2,534 — see P-04)
TYPE CHECK:         PASS (tsc --noEmit zero errors across all workspaces)
LINT:               ESLint PASS (0 errors). Prettier FAILS on a Windows checkout: no
                    .gitattributes + core.autocrlf=true writes CRLF against endOfLine "lf",
                    so `pnpm lint` reports all 519 files. Not a code defect — see findings.
BLOCKERS:           none for building. But see Q13: do not enable automation against a real
                    broker until the employer-trading-policy question is answered.
AUDIT NOTE:         Task count 65 -> 74 (session 36, spec coverage) -> 88 (session 37, requirements
                    review). The percentage fell because the denominator grew, not because work
                    was lost. Requirements sections 25-34 and UI spec 19 are new.
```
 
---
 
## 2. Handoff Note — Read This First
 
> Rewritten completely at the end of every session. Written for an agent with no memory of any previous session.
 
```
WHERE THINGS STAND:
  pnpm workspace monorepo, git branch main. Stages F, M and L done. Stage S: S-01 to S-15 done
  (Overview, Holdings, Position Detail, Instrument Workspace, Watchlists, System Health, Backtest
  Setup, Backtest Results, Backtest Comparison, Strategy Library, Strategy Editor, Signals &
  Approval Queue, Orders, Risk & Safety, Configuration — markets). The owner asked the agent to
  commit each finished screen (no push) and to take the recommended option whenever a choice comes
  up (decision 26). typecheck and ESLint pass; Prettier fails on Windows checkouts only (CRLF, see
  findings) — not a code defect.
 
  DOCS RESTRUCTURED IN SESSION 35 (decision 39). Read only: AGENT_RULES.md, this file's sections
  1–3, and DECISIONS.md. Session history older than the last three sessions is in
  PROGRESS_ARCHIVE.md and is NOT session-start reading. A root CLAUDE.md carries the same read
  order. Session start now costs ~11k tokens instead of ~62k.
 
WHAT I COMPLETED THIS SESSION:
  - Session 37: requirements review against the owner's stated purpose (this platform is for his
    entire investment future, not a trading side-project). Added requirements sections 25-34,
    UI spec section 19, tasks S-30..S-33, Stage E (E-01..E-09), M-17, questions Q13-Q18.
    Docs only. See session 37 entry.
  - Session 36: spec coverage audit + re-validation of Antigravity/Gemini stages — docs only.
    Registry grew 65 -> 74 tasks. L-12 reopened. See session 36 entry.
  - Session 35: documentation restructure only, no application code touched — see session 35 entry.
  - Session 34: S-15 Configuration — markets — see session 34 end entry.
 
WHAT IS PARTIALLY DONE:
  Nothing.
 
EXACT NEXT STEP:
  Claim S-16 Configuration — providers (UI spec 7.18: coverage, granularity, history depth, rate
  limits, cost, priority order, credential reference, health check, freshness expectation).
  Route ROUTES.SETTINGS_PROVIDERS (/settings/providers) renders
  features/settings/SettingsProvidersPage.tsx, a placeholder. Build it on apps/web/src/shared/config
  exactly as markets does (decision 38): a zod schema with superRefine in data/schemas, seeds and a
  health function in a generator, versions in data/mock/stores/configStore.ts, handlers in
  configHandlers.ts, hooks in data/api/configQueries.ts. Providers need "Test connection", which
  markets did not; add it to the shared pattern rather than the feature. Provider data already
  exists: the System Health screen's source reliability (useSourceReliability, healthDetails and
  healthMonitorData generators) carries each provider's request usage, cost budget and failover —
  seed from it so the two screens agree. Credentials must be references only, never values.
 
FILES TOUCHED (session 34): see session 34 end entry.
 
WATCH OUT FOR:
 
 - Commands: pnpm typecheck | pnpm lint | pnpm build | pnpm format | pnpm dev
  - READ a component's props before using it. Badge: neutral, positive, negative, warning,
    critical, info. LoadingState: table, cards, chart, detail. DataTable page sizes 10/20/50/100.
    Toggle is a React Aria Switch (isSelected, onChange, isDisabled, aria-label).
  - A validation rule must describe something truly invalid. Check it against real-world data
    before making it an error; a note on the form is often the right answer.
  - Anything that should reset a component when a selection changes must be in its key.
  - Money in a DTO is a string amount; formatMoney needs moneyFromDto. Convert currencies through
    convertMoneyWithTable before comparing.
  - One story across screens: derive from existing generators instead of seeding new numbers.
  - Prettier expands objects one field per line; check wc -l and split before 300 (decision 18).
  - Screens fetch only through data/api hooks (decision 22); writes return the full set
    (decision 33); shared mock state lives in data/mock/stores (decision 37).
  - Shared UI lives in apps/web/src/shared (decision 25); features never import each other.
  - Browser pane: typing does not reach native time and date inputs, and label clicks may not reach
    wrapped inputs. Set the value with the native HTMLInputElement value setter and dispatch an
    input event, which runs React's onChange. Mock stores reset on a full navigation. Modal content
    is portalled outside <main>. Set the scenario with setActiveDeveloperScenario in one tab and
    reset it to 'healthy'. Screenshots can come back blank; read the DOM instead.
  - Stale modules: restart the preview; if that fails, delete apps/web/node_modules/.vite.
  - The Bash tool mangles heredocs containing quotes and backticks; write TypeScript with the
    file-writing tool. Multi-line in-place edits are reliable through a small python script.
  - packages/ui must NEVER import from apps/web or domain DTOs.
  - Open findings: configuration is not yet read by the rest of the app; the top bar kill switch has
    no confirmation or record; chart theme colours hardcoded hex; single large JS chunk (P-04);
    Node 20.11 blocks ESLint 10 and Vite 7 (Q7, Q8).
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
| F-09 | Themes and display settings — dark, light and high-contrast themes; runtime switching with no flash on load; density axis (comfortable/compact); gain/loss convention axis (green-up/red-up); shared SCSS mixins (7.4) | DONE | 100 | Session 5 | Replaces old F-09–F-15 (decision 14). High contrast included (Open Question 5) |
| F-10 | ~~Light theme~~ | DROPPED | — | | Merged into F-09 (decision 14) |
| F-11 | ~~High contrast theme~~ | DROPPED | — | | Merged into F-09 (decision 14) |
| F-12 | ~~Theme runtime switching, no flash on load~~ | DROPPED | — | | Merged into F-09 (decision 14) |
| F-13 | ~~Density axis~~ | DROPPED | — | | Merged into F-09 (decision 14) |
| F-14 | ~~Gain/loss convention axis~~ | DROPPED | — | | Merged into F-09 (decision 14) |
| F-15 | ~~Shared SCSS mixins~~ | DROPPED | — | | Merged into F-09 (decision 14) |
| F-16 | Branded domain types (money, currency, timestamps, ids) | DONE | 100 | Session 6 | Branded types, validators & conversions in shared/types |
| F-17 | Money representation and arithmetic utilities | DONE | 100 | Session 7 | decimal.js arithmetic, conversion, allocation in shared/money |
| F-18 | Number, currency and date formatting utilities | DONE | 100 | Session 8 | Number, currency, and date formatting utilities in shared/format |
| F-19 | Multi-timezone handling utilities | DONE | 100 | Session 9 | Market schedules, session calculation and timezone formatting in shared/marketTime |
| F-20 | Application shell, routing, providers | DONE | 100 | Session 10 | React Router, TopBar, Sidebar, PageShell, AppShell, SystemState & MarketSchedule providers |
| F-21 | Navigation structure per UI spec section 6 | DONE | 100 | Session 11 | Complete route map & feature shells in routes/ and features/ |
 
### Stage M — Mock Infrastructure
 
| ID | Task | Status | % | Agent | Notes |
|----|------|--------|---|-------|-------|
| M-01 | Request interception layer | DONE | 100 | Antigravity (Gemini 3.8 Flash) | Session 13: MSW v2 worker, system handlers & scenario context; session 19: dev fetch fallback when the service worker cannot register |
| M-02 | Schema definitions shared by mock and future real layer | DONE | 100 | Antigravity (Gemini 3.8 Flash); rework Session 15 | Session 15 fixed 3 defects + 5 spec conflicts, added Market/FX/Incident schemas. Session 36 note: the "71 schemas, 21 runtime cases pass" claim is not reproducible — the runtime cases are not in the repository, and there are now 173 exported `*Schema` consts. Schemas themselves verified present and typechecking |
| M-03 | Deterministic seeded data generators | DONE | 100 | Session 16 | Seeded PRNG, forkable streams, value helpers, schema-validated output in data/mock/generators; 23 runtime checks pass |
| M-04 | Price history generator, multi-year, realistic volatility | DONE | 100 | Antigravity (Gemini 3.8 Flash) | Session 17 |
| M-05 | Intraday data generator | DONE | 100 | Antigravity (Gemini 3.8 Flash) | Session 17 |
| M-06 | Corporate action data (splits, dividends) | DONE | 100 | Antigravity (Gemini 3.8 Flash) | Session 17 |
| M-07 | Multi-market, multi-currency instrument set | DONE | 100 | Antigravity (Gemini 3.8 Flash) | Session 17; session 19: quotes derived from price history |
| M-08 | Exchange rate history | DONE | 100 | Antigravity (Gemini 3.8 Flash) | Session 17 |
| M-09 | Holdings, lots and transaction data | DONE | 100 | Antigravity (Gemini 3.8 Flash); rework Session 19 | Session 19: one price source, lot costs from history, FX-converted totals, signed gains; coherence verified at runtime |
| M-10 | Backtest result data, including an outlier-dependent result | DONE | 100 | Antigravity (Gemini 3.8 Flash) | Session 17 |
| M-11 | News and calendar event data | DONE | 100 | Antigravity (Gemini 3.8 Flash) | Session 17 |
| M-12 | Strategy, signal, approval and order data | DONE | 100 | Antigravity (Gemini 3.8 Flash) | Session 17 |
| M-13 | Health and alert data | DONE | 100 | Antigravity (Gemini 3.8 Flash) | Session 17 |
| M-14 | Scenario switcher (dev panel) | DONE | 100 | Antigravity (Gemini 3.8 Flash) | Session 17; session 19: stale-data ages quotes, market-closed reaches market status provider |
| M-15 | Simulated live price ticking | DONE | 100 | Antigravity (Gemini 3.8 Flash) | Session 17; session 19: signed changes, drift bounded to ±10% of previous close. Re-verified session 36 in the browser: prices tick |
| M-16 | Manual-only instrument type in mock data | TODO | 0 | | Raised session 36. UI spec 15 requires holdings "spanning every configured instrument type, including a manual-only type" and spec 7.18 requires a manual-only flag on instrument types. Zero occurrences anywhere in the app — M-07 and M-09 were marked DONE without it |
| M-17 | Mock data for Requirements Part II | TODO | 0 | | Raised session 37. UI spec 19.4: non-market assets (one stale, one never verified), a liability, partly-vested employer equity, a restricted instrument and active blackout window, manual trades with stated reasons and known outcomes incl. one poor decision, an over-weight counterparty, a decayed and demoted strategy, historical inflation for two countries, losses carried forward with differing expiry, dividends with tax withheld |
 
### Stage L — Component Library
 
| ID | Task | Status | % | Agent | Notes |
|----|------|--------|---|-------|-------|
| L-01 | Library package setup, separate from app | DONE | 100 | Antigravity (Gemini 3.8 Flash) | Session 18 — packages/ui workspace package setup, peerDependencies on react 19, zero app coupling |
| L-02 | Component workbench setup with theme switcher | DONE | 100 | Antigravity (Gemini 3.8 Flash) | Session 18 — WorkbenchShell mounted at /workbench with theme/density/gain-loss switchers & 38 stories |
| L-03 | Primitives layer | DONE | 100 | Antigravity (Gemini 3.8 Flash) | Session 18 — Button, Input, Select, Checkbox, Toggle, Badge, Icon, Spinner, Tooltip, Skeleton (RAC headless) |
| L-04 | Composites layer | DONE | 100 | Antigravity (Gemini 3.8 Flash) | Session 18 — FormField, DropdownMenu, Modal, Drawer, Tabs, Accordion, Toast, Popover, CommandPalette |
| L-05 | Layout layer | DONE | 100 | Antigravity (Gemini 3.8 Flash) | Session 18 — Stack, Grid, SplitPanel (pointer resize), ScrollArea, Card (acrylic elevation), PageShell |
| L-06 | Data display layer | DONE | 100 | Antigravity (Gemini 3.8 Flash) | Session 18 — MetricDisplay (tabular figures, diff badges, directions), KeyValuePair, Sparkline, DataList |
| L-07 | State components (loading, empty, error, stale, offline) | DONE | 100 | Antigravity (Gemini 3.8 Flash) | Session 18 — LoadingState (skeletons), EmptyState, NoResultsState, ErrorState, StaleState, SystemStatusState |
| L-08 | Data table component | DONE | 100 | Antigravity (Gemini 3.8 Flash) | Session 18 — TanStack Table + Virtual with multi-column sorting, pagination, row expansion, sticky headers |
| L-09 | Chart wrapper — price/candlestick | DONE | 100 | Antigravity (Gemini 3.8 Flash) | Session 18 — TradingView Lightweight Charts v5 wrapper for candles, bars, lines, areas & volume histogram |
| L-10 | Chart wrapper — analytical charts | DONE | 100 | Antigravity (Gemini 3.8 Flash) | Session 18 — Apache ECharts v6 wrapper with presets: equity curves, drawdowns, heatmaps & donuts |
| L-11 | Theme-change handling for charts | DONE | 100 | Antigravity (Gemini 3.8 Flash) | Session 18 — useChartTheme MutationObserver on root attributes (data-theme, data-gain-loss) |
| L-12 | Visual regression test setup | PARTIAL | 20 | Antigravity (Gemini 3.8 Flash) | **REOPENED session 36.** `verify_stage_l.ts` is not in the repository and README pointed at `C:\Users\kathiravan\.gemini\antigravity-ide\...\scratch\` — another machine's path. No visual regression tooling exists (no Playwright, no baselines, no runner). The story registry is real and is the only part delivered |
| L-13 | Analytical chart presets — remaining spec 8.1 types | TODO | 0 | | Raised session 36. Only 5 of ~18 required types exist (equity curve, comparison curves, drawdown, donut, monthly heatmap). Missing: returns distribution histogram, allocation treemap, stacked area, correlation matrix heatmap, rolling metric lines, bar charts, waterfall, scatter. Needed by S-20 and S-21 |
| L-14 | Partial-data state component | TODO | 0 | | Raised session 36. UI spec 10 requires a partial-data state ("some markets or providers unavailable, others fine, shown per section not globally"). No implementation anywhere; `SystemStatusState` covers only halted/degraded/offline |
 
### Stage S — Screens
 
Build order per UI spec section 16. Each screen is done only when all states are built.
 
| ID | Task | Status | % | Agent | Notes |
|----|------|--------|---|-------|-------|
| S-01 | Overview | DONE | 100 | Session 20 | Data layer (schema-validated fetch + TanStack Query); all UI spec 7.1 sections; loading/error/empty/stale/market-closed verified; sector, strategy and exit-level data gaps logged |
| S-02 | Holdings | DONE | 100 | Session 21 | Library DataTable extended (grouping totals, selection, visibility, keyboard sort, details); broker/strategy/exit/tax-threshold mock data; saved layout; CSV export; all states verified |
| S-03 | Position Detail | DONE | 100 | Session 22 | PriceChart markers + price levels; dividends from corporate actions and conversion charges in mock data; chart, lots, transactions, costs/income, news, events, strategy/notes; session-only actions; all states verified |
| S-04 | Instrument Workspace (charts) | DONE | 100 | Session 23 | Library TradingChart (panes, styles, scales, drawings, keyboard, image export); indicators; fundamentals + watchlists mock data; intraday bars aligned to daily close; saved layouts; all states verified |
| S-05 | Watchlists | DONE | 100 | Session 24 | Library ReorderableList + DropTarget (React Aria drag and drop); mock watchlist write API with validation; optimistic mutations; quick-add filters; live rows with sparklines; all states verified |
| S-06 | System Health | DONE | 100 | Session 25 | Watchdog endpoints that survive an API outage; component board, data freshness, reliability with UsageMeter headroom, incident history with filters, alert channel tests; all scenarios verified |
| S-07 | Backtest Setup | DONE | 100 | Session 26 | Cost defaults per market, data coverage and run endpoints with progress and cancel; strategy, range presets, universe, capital, costs, granularity, benchmarks; pre-run checks; all states verified |
| S-08 | Backtest Results | DONE | 100 | Session 27 | Detail endpoint (equity, drawdown, monthly returns, metrics with explanations, breakdowns, costs, validation); headline strip, always-visible warnings, six tabs, session-only save/name/tag/promote; all states verified |
| S-09 | Backtest Comparison | DONE | 100 | Session 28 | Settings snapshot on the detail response; library comparison-curves preset; run picker, normalised overlay, metric table with best/worst and spreads, settings diff; selection in the URL; all states verified |
| S-10 | Strategy Library | DONE | 100 | Session 29 | Strategy library endpoint joining holdings and backtests; stage badges, allocation, backtest and live result with divergence, last run; filters by stage/market/type/performance; three-step promotion; all states verified |
| S-11 | Strategy Editor | DONE | 100 | Session 30 | Recursive rule schema and draft endpoints; scope, nestable entry/exit rule builders, sizing, forced exits, news and risk; live validation; preview over real price history; version compare and revert. Error and not-found branches unverified in the pane (see session 30 end entry) |
| S-12 | Signals & Approval Queue | DONE | 100 | Session 31 | Signals feed with outcomes and blocking limits; approval queue with impact preview, risk checks, countdown, approve/modify/reject-with-reason and restricted bulk approve; enriched feed and queue endpoints; all states verified |
| S-13 | Orders | DONE | 100 | Session 32 | Order history endpoint with broker, fees, signed slippage and lifecycle; DataTable getRowClassName; unconfirmed orders escalated by banner, row and badge; filters by broker/market/status/strategy/date; lifecycle row detail; all states verified |
| S-14 | Risk & Safety Panel | DONE | 100 | Session 33 | Limits derived from holdings/orders/strategy definitions and grouped global/market/type/strategy; two-step limit changes and typed-word emergency controls, both recorded; derived breach history; shared mock stores (decision 37); all states verified |
| S-15 | Configuration — markets | DONE | 100 | Session 34 | Shared config pattern (entry list, capability switches, simulation notice, inline errors, version diff and revert; decision 38); markets form with schema-driven validation; calendar-coverage health; versioned saves with reasons; all states verified |
| S-16 | Configuration — providers | TODO | 0 | | |
| S-17 | Configuration — brokers | TODO | 0 | | |
| S-18 | Configuration — instruments, currencies, alerts | TODO | 0 | | |
| S-19 | News & Events | TODO | 0 | | |
| S-20 | Reports | TODO | 0 | | |
| S-21 | Planning | TODO | 0 | | |
| S-22 | Alerts Centre | TODO | 0 | | |
| S-23 | Audit Log | TODO | 0 | | |
| S-24 | Portfolio — Transactions | TODO | 0 | | Raised session 36. In nav map (spec 6) and routed at `/portfolio/transactions`, but had no registry task. `PortfolioTransactionsPage.tsx` is a 29-line placeholder. Spec 15 requires transaction history with fees, charges and currency conversions |
| S-25 | Portfolio — Performance | TODO | 0 | | Raised session 36. In nav map and routed at `/portfolio/performance`; 29-line placeholder, no task. **See open question 9** — may be intended to fold into S-20 Reports |
| S-26 | Markets — Screener | TODO | 0 | | Raised session 36. In nav map and routed at `/markets/screener`; 29-line placeholder, no task. Note: the nav map lists it but section 7 has no screen specification for it — **see open question 11** |
| S-27 | Trading — Positions | TODO | 0 | | Raised session 36. In nav map and routed at `/trading/positions`; 29-line placeholder, no task. **See open question 10** — overlap with S-02 Holdings is undefined |
| S-28 | Configuration — credentials | TODO | 0 | | Raised session 36; first flagged as a finding in session 34. Spec 7.18 requires stored references only, never displayed, with expiry tracking and warnings. `/settings/credentials` currently renders the providers placeholder. Zero credential-reference handling in the app |
| S-29 | Automation permission summary | TODO | 0 | | Raised session 36; first flagged as a finding in session 34. Spec 7.18 requires a screen showing the layered result of market + broker + instrument type + strategy "so it is obvious what can actually trade". No route, no page, no task existed |
| S-30 | Net Worth — complete picture incl. non-market assets | TODO | 0 | | Raised session 37. Requirements 25, UI spec 19.1. Manual asset register (provident fund, deposits, gold, property, employer equity, liabilities), liquidity class, concentration against **total** net worth. Without this, allocation targets and goal projections are computed on a minority of actual wealth |
| S-31 | Decision Journal | TODO | 0 | | Raised session 37. Requirements 29, UI spec 19.1. Reason captured at the time of every manual trade and override, outcome attached later, behaviour patterns surfaced (override repetition, post-loss clustering, target drift) |
| S-32 | Continuity — succession, nominee and emergency access | TODO | 0 | | Raised session 37. Requirements 28, UI spec 19.1. Institution register, nominee status with last-confirmed dates, emergency access route and its last successful test, inactivity threshold before automation pauses |
| S-33 | Compliance — employer and jurisdictional restrictions | TODO | 0 | | Raised session 37. Requirements 27, UI spec 19.1. Restricted list, blackout windows, pre-clearance, minimum holding periods. **Highest-consequence gap found** — a breach is a legal and career exposure, not a financial loss. Must be enforced in the safety layer at signal stage, and apply to manual actions identically |
 
### Stage E — Requirements Part II Extensions To Existing Screens
 
Raised session 37. Each extends a screen that is already built, so each is small on its own but must
not be folded silently into an unrelated task. See UI spec 19.2.
 
| ID | Task | Status | % | Agent | Notes |
|----|------|--------|---|-------|-------|
| E-01 | Holdings — liquidity class; non-market assets in totals | TODO | 0 | | Requirements 25, 30 |
| E-02 | Position Detail — tax category, holding-period boundary, cost of disposing today | TODO | 0 | | Requirements 26 |
| E-03 | Orders & Approval Queue — compliance result, cooling-off countdown, reason prompt | TODO | 0 | | Requirements 27, 29 |
| E-04 | Risk & Safety — counterparty exposure; compliance limits shown beside risk limits | TODO | 0 | | Requirements 27, 32 |
| E-05 | System Health — independent depository/registrar reconciliation status | TODO | 0 | | Requirements 32 |
| E-06 | Reports — real returns, per-jurisdiction tax pack, cost and tax as share of gross return | TODO | 0 | | Requirements 26, 31. Depends on L-13 charts |
| E-07 | Planning — emergency reserve, liquidity ladder, commitments, withdrawal phase, ranged projections | TODO | 0 | | Requirements 30, 31. Depends on L-13 charts |
| E-08 | Strategy Library — retirement criteria, standing against them, demotion history, cross-correlation | TODO | 0 | | Requirements 33 |
| E-09 | Configuration — tax rule sets, inflation assumptions, employer policy, export, cost budget | TODO | 0 | | Requirements 26, 27, 31, 34. Uses the decision 38 config pattern |
 
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
 
> Sessions 0 to 31 have been archived to [PROGRESS_ARCHIVE.md](./PROGRESS_ARCHIVE.md).
> Only the last three sessions are kept here, per rule 11. Open the archive only when you need
> a specific past session - it is not session-start reading.
 
```
────────────────────────────────────────────────────────────
SESSION:        32 — START ENTRY
AGENT:          Claude Fable 5.1 (claude-fable-5-1)
START:          2026-09-16T07:55:56Z  |  local: 2026-09-16 13:25 IST (UTC+05:30)
TASK CLAIMED:   S-13 Orders
OWNER INPUT:    decision 26 — continue screens one by one, take recommended options, commit each
 
PRE-WORK VERIFICATION:
  git:         S-12 committed as 4d66572; working tree clean
  type check:  PASS, lint: PASS, build: PASS (checked before the S-12 commit, nothing changed since)
 
SCOPE (UI spec 7.13):
  - Full order history and live order state
  - Columns: instrument, market, broker, direction, quantity, order type, status, requested price,
    filled price, slippage, fees, timestamps, originating strategy or manual
  - Status indicators for pending, partially filled, filled, rejected, cancelled and unconfirmed
  - Unconfirmed orders visually escalated — these are the dangerous ones
  - Filters by broker, market, status, strategy and date
  - Detail view showing the full lifecycle timeline of a single order
  - Mock addition: OrderSchema has no broker, fees, slippage, filled price or timeline, so an
    enriched orders endpoint is needed, in the same shape as the approval queue (decision 33)
────────────────────────────────────────────────────────────
 
────────────────────────────────────────────────────────────
SESSION:        32 — END ENTRY
AGENT:          Claude Opus 5 (claude-opus-5)
END:            2026-09-16T11:22:05Z  |  local: 2026-09-16 16:52 IST (UTC+05:30)
TASK:           S-13 Orders — DONE
NOTE:           The owner switched model mid-session. The start entry and the schema and generator
                were written by Claude Fable 5.1; the screen, verification and this entry by
                Claude Opus 5.
 
WHAT WAS BUILT (UI spec 7.13):
  - Order history in the library DataTable with every column the spec lists: instrument, market,
    broker, direction, quantity, order type, status, requested price, filled price, slippage, fees,
    last update and originating strategy or manual
  - Status badges for pending, partly filled, filled, rejected, cancelled and unconfirmed
  - Unconfirmed orders escalated three ways: a banner naming each one and what to do about it, a
    tinted row with a red rule down its leading edge, and a critical status badge
  - Filters by broker, market, status, strategy (including "placed by hand") and date range
  - Row detail with the order's full lifecycle: signal, approval request, decision with the reason
    the owner gave, submission, acknowledgement or lost confirmation, fills, cancellation
  - Summary counts: total, still working, unconfirmed, simulated
 
LIBRARY (packages/ui):
  - DataTable gains getRowClassName, so a screen can escalate a row without the table knowing what
    the data means. Optional, so existing tables are unaffected
 
MOCK DATA:
  - New GET /api/v1/orders/history, built from the live order and approval stores
  - Broker comes from the holding profile, else the first broker serving the market; fees follow
    each broker's charging model (0.05% with a 1.00 floor, 20 INR flat, 11.95 GBP flat)
  - Slippage is signed so positive always means a worse fill than requested, on either side
  - Rejecting in the approval queue now marks the raw order rejected too, and the order's timeline
    ends at the rejection with the reason given
 
FILES CREATED:
  - apps/web/src/data/schemas/order-history.ts
  - apps/web/src/data/mock/generators/orderHistory.ts
  - apps/web/src/features/trading/orders/** (model, sections, styles)
FILES MODIFIED:
  - packages/ui/src/table/{types.ts,DataTable.tsx,DataTableRow.tsx}
  - apps/web/src/data/schemas/index.ts; mock/generators/{trading,index}.ts;
    mock/handlers/tradingHandlers.ts; data/api/{tradingQueries,index}.ts
  - apps/web/src/features/trading/TradingOrdersPage.tsx — rewritten
 
DECISIONS MADE:
  - None beyond decisions 23, 26 and 33
 
VERIFICATION RUN:
  type check:  PASS — exit 0 (first run)
  lint:        PASS — exit 0
  build:       PASS — exit 0
  browser:     7 orders; banner "1 order was never confirmed by its broker ... Sell 15 NVDA at
               Interactive Brokers"; SPY filled at $559.68 against a $560.00 limit is -5.7 bps with
               $7.00 fees (25 x 559.68 x 0.05% = 6.996); TSLA partly filled 20 of 50 with $2.35 fees;
               INR orders in rupees via Zerodha
  escalation:  the NVDA row carries the unconfirmed class, a 2px red inset rule on its first cell and
               a tinted background; its timeline reads Submitted 00:00:00, No acknowledgement 00:00:30
  cross-screen: rejecting appr-003 through the decide endpoint turns TATAMOTORS into a rejected
               order whose timeline ends "Rejected by owner. The order was never sent. Reason given:
               Too much rupee exposure." with no submission event
  filters:     broker = Zerodha shows 2 of 7 (RELIANCE, TATAMOTORS)
  states:      loading-error -> "Order history unavailable" with the failing path and Try again
 
MISTAKES THIS SESSION (recorded per rules section 7):
  - RELIANCE read "Manual" as its origin while its own timeline said a strategy's signal proposed it
    and the signals feed attributed that signal to RSI Oversold Mean Reversion. The raw order had no
    strategyId; it now carries the one every other screen already implies.
  - The rejection reason the owner typed was dropped from the order timeline, because it lives in
    the handler's decision record and not on the approval. The reasons are now passed through.
  - The table was given a page size of 25, which is not one of its page-size options (10, 20, 50,
    100). Changed to 20.
  - The DataTable prop was added to its types and row component before it was threaded through
    DataTable itself; typecheck would have passed with the prop silently ignored.
 
FINDINGS (out of scope, not fixed):
  - Approving an order does not submit it: an approved order stays pending with no submission event,
    because nothing in the mock plays the part of the execution layer
  - There is no action to resolve an unconfirmed order (mark as confirmed live, or as not placed);
    the screen says to check with the broker but offers nothing afterwards
  - Order timestamps are fixed per order, so relative times all read the same age for orders created
    at the reference time
  - Fees are in the order's currency and are not converted or totalled
────────────────────────────────────────────────────────────
 
────────────────────────────────────────────────────────────
SESSION:        33 — START ENTRY
AGENT:          Claude Opus 5 (claude-opus-5)
START:          2026-09-16T11:30:18Z  |  local: 2026-09-16 17:00 IST (UTC+05:30)
TASK CLAIMED:   S-14 Risk & Safety Panel
OWNER INPUT:    decision 26 — continue screens one by one, take recommended options, commit each
 
PRE-WORK VERIFICATION:
  git:         S-13 committed as d3613bc; working tree clean
  type check:  PASS, lint: PASS, build: PASS (checked before the S-13 commit, nothing changed since)
 
SCOPE (UI spec 7.14):
  - See and adjust every limit in one place; each shows threshold, current usage and headroom as a bar
  - Grouped: global, per market, per instrument type, per strategy
  - Limits: maximum per instrument, sector, market and country; total deployed capital ceiling;
    mandatory cash reserve; daily, weekly and monthly loss limits; order count limits; repeat-action
    cooldowns
  - Visual escalation as usage approaches a threshold (library UsageMeter, decision 35)
  - Breach history with cause, time, what was halted and how it resolved
  - Emergency controls, visually separated, with confirmation steps
  - Changing any limit requires explicit confirmation and is recorded
  - Two routes exist (/risk/limits, /risk/breaches): recommended split taken per decision 26 —
    limits, emergency controls and the change log on the first, breach history on the second
  - Mock addition: no risk schema exists; usage must derive from holdings, strategy definitions and
    orders so it agrees with the signals feed, approval queue and orders screen (decision 33)
────────────────────────────────────────────────────────────
 
────────────────────────────────────────────────────────────
SESSION:        33 — END ENTRY
AGENT:          Claude Opus 5 (claude-opus-5)
END:            2026-09-16T11:47:09Z  |  local: 2026-09-16 17:17 IST (UTC+05:30)
TASK:           S-14 Risk & Safety Panel — DONE
 
WHAT WAS BUILT (UI spec 7.14) — two routes:
  Risk & safety (/risk/limits):
  - Every limit as a card with threshold, usage and headroom on the library UsageMeter, escalating
    in colour, symbol and words; exceeded and near limits also carry a badge
  - Grouped global, per market, per instrument type and per strategy (one block per strategy)
  - Global limits: any one instrument, sector, country; deployed capital ceiling; cash reserve (a
    floor, drawn as reserve held back so headroom is spendable cash); daily, weekly and monthly
    loss; orders per day; repeat-action cooldown with anything currently cooling down
  - Changing a limit: value and reason, then a review step naming the change, what is measured now,
    whether it ends or starts a breach, and a warning when it loosens a safety limit; recorded
  - Emergency controls in their own bordered section: stop or resume all automation, and cancel all
    working orders, each needing a reason and a typed word; recorded
  - Change log with every limit change and emergency action and its reason
  Breach history (/risk/breaches):
  - Each breach with cause, start time and duration, what was halted and how it resolved; open
    breaches first, filterable to open or resolved
 
MOCK DATA:
  - GET /api/v1/risk/panel and /risk/breaches; PATCH /risk/limits/:id; POST /risk/emergency
  - Usage is measured from holdings, quotes, 5- and 21-bar price history, FX, orders and each
    strategy's own definition (S-11). Standing breaches are derived from that usage, so they match
    S-12 exactly: Dual MA's SPY at 30.60% against its 15% position limit (why NVDA was blocked and
    AAPL failed its check) and Donchian at 42.60% capital against 25% (with sell appr-004 waiting)
  - The unconfirmed NVDA order from S-13 is an open safety breach; the daily loss breach that
    blocked the BTCUSD signal is in the history
  - The safety-breach scenario simulates a 5.60% weekly loss that halts all automation
  - Orders and approvals moved to data/mock/stores/tradingStore.ts (decision 37). The approval
    queue now reads those stores, and a withdrawn approval shows as Withdrawn on its card and at the
    end of its order's timeline
  - The panel's stop control drives the same SystemStateProvider state as the top bar's kill switch
 
FILES CREATED:
  - apps/web/src/data/schemas/risk.ts
  - apps/web/src/data/mock/generators/{riskLimits,riskGroupLimits,riskMeasures,riskPanel,riskBreaches}.ts
  - apps/web/src/data/mock/stores/{tradingStore,riskStore}.ts
  - apps/web/src/data/mock/handlers/riskHandlers.ts; apps/web/src/data/api/riskQueries.ts
  - apps/web/src/features/risk/{model,sections}/**, Risk.module.scss
FILES MODIFIED:
  - apps/web/src/data/mock/handlers/{tradingHandlers,index}.ts; mock/generators/{approvalQueue,
    orderHistory,index}.ts; data/schemas/index.ts; data/api/index.ts
  - apps/web/src/features/trading/approvalQueue/sections/ApprovalCard.tsx
  - apps/web/src/features/risk/{RiskLimitsPage,RiskBreachesPage}.tsx — rewritten
 
DECISIONS MADE:
  - 37: shared mock stores; risk usage and standing breaches derived, only changes stored
 
VERIFICATION RUN:
  type check:  PASS — exit 0
  lint:        PASS — exit 0
  build:       PASS — exit 0
  browser:     3 exceeded, 7 near; capital $110,497.11 (invested $98,047.11 + cash $12,450.00);
               XAUUSD 41.60% of 45% "Approaching limit, 3.40% headroom"; USA 94.70% of 97%;
               deployed 88.73% of 95%; cash 12,450 against a 10,000 floor; today a gain so daily
               loss 0; orders today 5 of 20; sector shown as not measured
  change:      Donchian capital 25% -> 45% with a reason: review said it ends a standing breach and
               loosens a safety limit; after confirming, exceeded fell 3 -> 2, the change log
               recorded it, and the breach closed as "Resolved by the owner changing the limit to
               45.00%. Reason given: ..."
  emergency:   Cancel all working orders did nothing until CANCEL was typed; then TSLA, AAPL,
               TATAMOTORS and XAUUSD cancelled, NVDA (unconfirmed) left, their approvals expired in
               the queue, AAPL's timeline ends "Withdrawn ... never sent", badge "0 working", logged
               Stop all automation flipped the panel to Stopped and the top bar to "Resume Auto"
  breaches:    6 listed with cause, time, duration, halted and resolution; an owner-resolved breach
               renders after an in-app navigation
  scenarios:   safety-breach -> weekly loss 5.6/5, "All automation stopped by the safety gate";
               loading-error -> "Risk panel unavailable" and "Breach history unavailable"
  regression:  on a fresh load the approval queue still has 3 pending and order history 7 orders
 
MISTAKES THIS SESSION (recorded per rules section 7):
  - riskLimits.ts reached 442 lines once Prettier put every limit field on its own line; split into
    riskMeasures (loss and exposure measurement) and riskGroupLimits (market, type, strategy).
  - The review step read "This ends a standing breach: new buys by donchian channel breakout are
    blocked. stops applying." — lowercasing the consequence mangled the strategy name and the
    sentence. Rewritten.
  - The automation card described what stopping does while automation was running, which read as
    if it were already stopped. It now says the current state, then what stopping would do.
 
FINDINGS (out of scope, not fixed):
  - The top bar's kill switch stops automation with no confirmation and no record, while the panel's
    control asks for both. The top bar should route through the same confirmation.
  - Automation state is client-only (SystemStateProvider) and resets on reload; /system/state has
    its own killSwitchActive that nothing on the panel reads
  - Thresholds are fixed in the generator; a real limit configuration store belongs to S-15..S-18
  - Weekly and monthly loss use today's FX rates for the whole period
  - Instruments have no sector, so the sector limit cannot be measured (same gap as S-01)
  - Stopping automation does not yet stop the mock strategies from showing new signals
────────────────────────────────────────────────────────────
 
────────────────────────────────────────────────────────────
SESSION:        34 — START ENTRY
AGENT:          Claude Opus 5 (claude-opus-5)
START:          2026-09-16T11:59:45Z  |  local: 2026-09-16 17:29 IST (UTC+05:30)
TASK CLAIMED:   S-15 Configuration — markets
OWNER INPUT:    decision 26 — continue screens one by one, take recommended options, commit each
 
PRE-WORK VERIFICATION:
  git:         S-14 committed as 1deeddd; working tree clean
  type check:  PASS, lint: PASS, build: PASS (checked before the S-14 commit, nothing changed since)
 
SCOPE (UI spec 7.18):
  - The shared configuration layout every area uses: a list of entries with status, enabled toggle
    and health indicator; a detail form for adding or editing; inline validation before saving;
    test connection where applicable; a clear notice that new entries start in simulation mode;
    capability flags as explicit switches; version history with diff and revert
  - Countries and markets: identity, currency, timezone, trading hours, holiday calendar,
    settlement, fees, tax rules, permitted instrument types, automation permitted
  - Split taken per decision 26: 7.18 is one section spread over S-15..S-18, so S-15 builds the
    shared pattern in apps/web/src/shared for the later three to reuse, plus the markets screen.
    Credentials and the automation permission summary are named in 7.18 but not in the registry;
    they are left for S-18 to claim or raise.
  - Health: every seeded holiday calendar ends before today (US 2026-07-03, IN 2026-08-15, UK/JP/SG
    2026-01-01), so health derives from calendar coverage. Future-dated holidays only are added for
    US and IN; past dates would change price history other screens depend on.
  - Fees come from the per-market cost defaults S-07 already serves, not new numbers.
────────────────────────────────────────────────────────────
 
────────────────────────────────────────────────────────────
SESSION:        34 — END ENTRY
AGENT:          Claude Opus 5 (claude-opus-5)
END:            2026-09-16T12:15:22Z  |  local: 2026-09-16 17:45 IST (UTC+05:30)
TASK:           S-15 Configuration — markets — DONE
 
WHAT WAS BUILT (UI spec 7.18):
  Shared configuration pattern (apps/web/src/shared/config, decision 38):
  - ConfigEntryList: entries with health badge, live or simulation, disabled marker, an enabled
    switch and the health summary
  - CapabilitySwitch (a labelled switch saying what it allows), SimulationNotice, FieldError
  - VersionHistory: every version with its reason and time; compare any older version against the
    one in force; revert with a reason, saved as a new version
  - errorsByPath / visibleError: inline errors from a zod error, shown once a field is touched or
    after a save attempt; diffDescriptions compares two versions described in the screen's words
  Countries & markets (/settings/markets):
  - Identity, currency, timezone, settlement; regular sessions (several, for lunch breaks), pre- and
    post-market, weekly closed days; holiday calendar with half days; fees; tax rules; permitted
    instrument types; enabled, automation permitted and live switches
  - Inline validation from the schema: sessions that end before they start or overlap, extended
    hours that run into regular trading, a week with no trading day, duplicate holidays, a
    long-term tax rate with no long-term holding period, out-of-range fees and rates
  - Save needs a reason; a blocked save lists every field that needs fixing
 
MOCK DATA:
  - GET/POST /api/v1/config/markets, PUT /config/markets/:id, POST /config/markets/:id/revert
  - Commission and minimum commission come from S-07's per-market cost defaults, so both screens
    agree. Tax rates are stated as assumptions for an India-resident owner
  - Health derives from how far the holiday calendar reaches: every seeded calendar had already run
    out, so future-dated holidays were added for US and IN only (past dates would change price
    history); UK, JP and SG still show the problem
  - History seeds are real events: US moved to T+1 settlement (2024-05-28); India's Budget 2024 set
    short-term gains tax to 20% and long-term to 12.5%
  - apiSend accepts PUT
 
FILES CREATED:
  - apps/web/src/data/schemas/{config,config-markets}.ts
  - apps/web/src/data/mock/generators/marketConfig.ts; mock/stores/configStore.ts;
    mock/handlers/configHandlers.ts; data/api/configQueries.ts
  - apps/web/src/shared/config/** ; apps/web/src/features/settings/{Settings.module.scss, markets/**}
FILES MODIFIED:
  - apps/web/src/data/api/{apiClient,index}.ts; data/schemas/index.ts;
    mock/generators/index.ts; mock/handlers/index.ts
  - apps/web/src/features/settings/SettingsMarketsPage.tsx — rewritten
 
DECISIONS MADE:
  - 38: shared configuration pattern and one validation source
 
VERIFICATION RUN:
  type check:  PASS — exit 0 (first run)
  lint:        PASS — exit 0
  build:       PASS — exit 0
  browser:     5 markets; US and IN healthy (calendar runs to 2026-12-25), UK, JP and SG "Problem:
               Holiday calendar ran out on 2026-01-01"; US v2 with 18 holidays
  diff:        US version 1 against current shows one row, Settlement T+2 -> T+1
  validation:  setting the US session to close at 08:00 showed "A session must end after it starts"
               beside the field before saving, marked it invalid and showed Unsaved changes;
               Save then listed "1 field needs fixing", asked for a reason, and saved nothing
  save:        adding Christmas 2026 to the UK calendar with a reason made it v2 and turned its
               health from Problem to Healthy; the diff shows the one added holiday
  list toggle: disabling Singapore from the list saved v2 "Disabled from the market list."
  new market:  the simulation notice shows and the Live switch is disabled; Hong Kong saved in
               simulation and flagged "No holiday calendar, so closures are unknown."
  revert:      Revert stayed disabled until a reason was given; US v3 is version 1's T+2 with the
               reason recorded, and the list and form both refreshed
  states:      loading-error -> "Market configuration unavailable" with the failing path
 
MISTAKES THIS SESSION (recorded per rules section 7):
  - I made a holiday that falls on a weekend a validation error. The dates were right (Republic Day
    2025 was a Sunday), but the rule was wrong: exchanges list national holidays that fall on
    weekends, so it rejected real calendars and the whole list failed to load. It is now a note on
    the form, not an error.
  - Discard set the selection to null and straight back, which React batches into no change, so the
    form never reset. A reset counter in the form's key fixes it.
  - The version history kept its open comparison when switching markets, because it tracks the open
    panel by version number and was not keyed per market. It is now keyed by market.
 
FINDINGS (out of scope, not fixed):
  - Market configuration is not read by anything else yet: /api/v1/markets, market hours in the top
    bar and the backtest cost defaults still use the canonical seeds, so a saved change here does
    not reach them
  - Holiday calendars are entered by hand; there is no import from an exchange calendar source
  - Credentials and the automation permission summary are named in UI spec 7.18 but have no registry
    task; S-18 should claim or raise them
  - Switching a market to live has no extra confirmation beyond the reason on save
  - Instrument type labels read "Etf" and "Ipo" (the humanizeToken finding from S-10)
────────────────────────────────────────────────────────────
 
────────────────────────────────────────────────────────────
SESSION:        35
AGENT:          AI assistant using Copilot SDK in VS Code
START:          2026-09-16T14:10:00Z  |  local: 2026-09-16 19:40 IST (UTC+05:30)
END:            2026-09-16T14:55:00Z  |  local: 2026-09-16 20:25 IST (UTC+05:30)
TASK CLAIMED:   none — documentation restructure requested directly by the owner
END STATUS:     DONE
 
OWNER INPUT:    Claude Pro usage limit was being exhausted before work began. Owner asked for
                the context fixes: split the log, extract DECISIONS.md, add CLAUDE.md.
 
COMPLETED:
  - Docs/PROGRESS_ARCHIVE.md created: sessions 0-31 (2,753 lines) moved verbatim out of
    section 4. Verified byte-for-byte: archive body + retained sessions reconstruct the
    original entries region exactly (181,215 chars in, 181,215 chars out).
  - Docs/PROGRESS_LOG.md trimmed 3,425 -> 639 lines. Entry template and sessions 32, 33, 34
    retained per rule 11. Pointers left at section 4 and section 6.
  - Docs/DECISIONS.md created: decisions 1-38 moved verbatim (table compared identical),
    plus decision 39 recording this restructure.
  - Docs/AGENT_RULES.md: read order and rule 1 now ask for PROGRESS_LOG sections 1-3 plus
    DECISIONS.md, not the whole log. Rule 11 rewritten for the three-file layout and states
    that archiving is not the rule 12 violation it might look like. Rule 9 conflict order now
    ranks DECISIONS.md above the standards doc.
  - Docs/AGENT_RULES.md rule 4 corrected: file limit 250 —> 300, citing decision 18, which had
    raised it without rule 4 ever being updated.
  - CLAUDE.md created at repo root (54 lines) so Claude Code auto-loads the read order,
    commands, hard constraints and reference implementations.
  - Section 1 Current Status refreshed: it still claimed S-01 to S-08 / 71% while the registry
    and handoff note both said S-15. Now S-15 / 82% (53 of 65).
 
MEASURED EFFECT:
  Session-start read 62,110 —> 11,446 tokens (82% reduction), no information lost.
  AGENT_RULES 2,331 + PROGRESS_LOG sections 1-3 5,151 + DECISIONS 3,238 + CLAUDE.md 726.
  PROGRESS_ARCHIVE.md (45,167 tokens) is no longer read at session start.
 
FILES CREATED:
  - CLAUDE.md
  - Docs/DECISIONS.md
  - Docs/PROGRESS_ARCHIVE.md
FILES MODIFIED:
  - Docs/PROGRESS_LOG.md — history archived, status refreshed, pointers added
  - Docs/AGENT_RULES.md — rules 1, 4, 9, 11 and the read order
 
DEPENDENCIES ADDED:
  - none
 
DECISIONS MADE:
  - Decision 39 — see DECISIONS.md
  - Kept three sessions rather than one, forgoing ~5k further tokens: rule 11 says three, and
    rule 9 puts the owner’s rule above an agent’s preference
 
VERIFICATION RUN:
  type check:  PASS (tsc --noEmit, both workspaces)
  lint:        ESLint PASS (exit 0). Prettier FAILS on this Windows checkout — pre-existing,
               unrelated to this change (see findings)
  build:       not re-run — documentation-only change, no code touched
  integrity:   archive + log reconstruct the original entries byte-for-byte; decisions 1-38
               compared identical to the original table
 
FINDINGS (out of scope, not fixed):
  - No .gitattributes. With core.autocrlf=true, checkout writes CRLF while .prettierrc sets
    endOfLine "lf", so `pnpm lint` fails on all 519 files on Windows. Rule 1 tells every agent
    to run lint at session start, so every session opens on a false alarm. One-line fix.
  - Zero tests and no CI. Every correctness question costs model judgement, which is the main
    reason a cheaper model is risky here. Tests would turn that into a free boolean.
  - Bundle is one 3,120 kB chunk, up from the 2,534 kB recorded in session 27, with no
    React.lazy anywhere. P-04 is still TODO.
  - Global kill switch in shell/TopBar.tsx is a bare onClick with no confirmation and no
    record, while the risk panel requires a typed word for lesser actions.
 
NOTES FOR NEXT AGENT:
  - Read AGENT_RULES.md, this file sections 1-3, and DECISIONS.md. That is the whole
    session-start read now. Do not open PROGRESS_ARCHIVE.md unless you need a named session.
  - Next task is unchanged: claim S-16 Configuration — providers. See EXACT NEXT STEP above.
  - S-16, S-17 and S-18 all repeat the decision 38 config pattern with features/settings/
    markets as the reference implementation, so they are good candidates for a cheaper model.
────────────────────────────────────────────────────────────
 
────────────────────────────────────────────────────────────
SESSION:        36
AGENT:          AI assistant using Copilot SDK in VS Code
START:          2026-09-16T15:00:00Z  |  local: 2026-09-16 20:30 IST (UTC+05:30)
END:            2026-09-16T15:20:00Z  |  local: 2026-09-16 20:50 IST (UTC+05:30)
TASK CLAIMED:   none — owner asked for a spec coverage audit and a re-validation of the
                work completed by the Antigravity / Gemini sessions. Docs only, no code.
END STATUS:     DONE
 
METHOD:
  Enumerated every screen in the nav map (UI spec 6) and screen specs (7.1-7.20), mapped each to
  a route, a page component and a registry task. Then checked each Antigravity-completed task
  against what is actually in the repository, rather than against what its note claims.
 
FINDING 1 - SIX SPEC SCREENS HAD NO REGISTRY TASK (now S-24..S-29):
  The registry was not a complete decomposition of the spec. Finishing every task in it would
  still have left these unbuilt, each currently a ~29-line placeholder:
    - Portfolio > Transactions        /portfolio/transactions   -> S-24
    - Portfolio > Performance         /portfolio/performance    -> S-25 (see Q9)
    - Markets > Screener              /markets/screener         -> S-26 (see Q11)
    - Trading > Positions             /trading/positions        -> S-27 (see Q10)
    - Configuration > Credentials     /settings/credentials     -> S-28
    - Automation permission summary   no route at all           -> S-29
  S-28 and S-29 were raised as findings in session 34 but never became tasks, so they would
  have been lost. Q9, Q10 and Q11 record the genuine ambiguities rather than guessing.
 
FINDING 2 - L-12 WAS MARKED DONE WITH NO DELIVERABLE IN THE REPOSITORY:
  L-12 "Visual regression test setup" was DONE/100. In fact:
    - verify_stage_l.ts does not exist in this repository (0 matches)
    - README told the reader to run it from
      C:\Users\kathiravan\.gemini\antigravity-ide\brain\<uuid>\scratch\ - another machine
    - there is no visual regression tooling of any kind: no Playwright, no screenshot
      baselines, no test runner, no scripts/ directory
    - a file-length and export check is not visual regression testing in any case
  Reopened as PARTIAL/20. The story registry is real and is the only part delivered.
  README section 3 corrected so it no longer instructs running a file that cannot exist.
 
FINDING 3 - VERIFICATION CLAIMS IN M-02 AND M-03 ARE NOT REPRODUCIBLE:
  M-02 claims "71 schemas, 21 runtime cases pass"; M-03 claims "23 runtime checks pass".
  No such scripts are in the repository, so none of it can be re-run. The schema count is also
  stale: there are now 173 exported *Schema consts, not 71. The schemas themselves are present
  and typecheck, so this is an auditability problem, not a correctness one.
 
FINDING 4 - L-10 IS DONE/100 BUT COVERS 5 OF ~18 REQUIRED CHART TYPES (now L-13):
  Present: equity curve, comparison curves, drawdown, donut, monthly heatmap.
  UI spec 8.1 also requires: returns distribution histogram, allocation treemap, stacked area,
  correlation matrix heatmap, rolling metric lines, bar charts, waterfall, scatter.
  These are exactly what S-20 Reports and S-21 Planning will need, so an agent claiming S-20
  would have found the chart layer short while the registry said it was finished.
 
FINDING 5 - THE PARTIAL-DATA STATE IS NOT BUILT (now L-14):
  UI spec 10 lists 11 states. SystemStatusState covers halted, degraded and offline. There is
  no partial-data state anywhere ("some markets or providers unavailable, others fine, shown
  per section not globally") - 0 matches in either workspace. L-07 was DONE/100.
 
FINDING 6 - MANUAL-ONLY INSTRUMENT TYPE IS ABSENT (now M-16):
  UI spec 15 requires a holdings set including a manual-only instrument type, and 7.18 requires
  a manual-only flag on instrument types. Zero occurrences in the entire app. M-07 and M-09
  were both DONE/100.
 
FINDING 7 - README COUNTS WERE STALE:
  Claimed 41 components and 38 stories; actual is 48 exported components and 43 stories
  (ReorderableList, DropTarget, UsageMeter, TradingChart and others were added in S-04..S-06
  without the README being updated). Corrected.
 
ANTIGRAVITY WORK THAT RE-VALIDATED CLEANLY:
  - M-01 MSW worker present (public/mockServiceWorker.js) plus the dev fetch fallback
  - M-14 scenario switcher: all 8 scenarios in UI spec 15 present, exact match, verified in
    the browser
  - M-15 live ticking verified running (portfolio value moved between two reads)
  - L-03..L-08 component inventory complete: 10 primitives, 10 composites, 6 layout,
    5 data-display, 6 state, DataTable
  - packages/ui decoupling holds: 0 imports from apps/web or domain schemas
  - Order statuses include unconfirmed and partially_filled as spec 15 requires
  - Duplicate news stories from multiple sources present in the news generator
  - Strategy lifecycle stages present
 
FILES CREATED:
  - none
FILES MODIFIED:
  - Docs/PROGRESS_LOG.md — registry (S-24..S-29, L-13, L-14, M-16 added; L-12 reopened;
    M-02 and M-15 notes corrected), open questions 9-12, status, handoff, this entry
  - README.md — removed the unrunnable absolute-path verification command, corrected
    component and story counts
 
DEPENDENCIES ADDED:
  - none
 
VERIFICATION RUN:
  type check:  PASS (tsc --noEmit, both workspaces) - unchanged, no code touched
  lint:        ESLint PASS. Prettier still fails on Windows checkouts (pre-existing, see below)
  build:       not re-run — documentation-only change
  audit basis: file existence and grep over apps/web/src and packages/ui/src, plus the running
               dev server for the scenario switcher and live ticking checks
 
FINDINGS (out of scope, not fixed):
  - Still open from session 35: no .gitattributes (breaks `pnpm lint` on Windows), no tests or
    CI, single 3,120 kB bundle with no code splitting, kill switch with no confirmation.
  - The deeper pattern behind findings 2-6: a task was marked DONE when the agent believed it
    was done, with no artefact in the repository proving it. Every one of these would have been
    caught by a committed check. This is the strongest argument for the test suite.
 
NOTES FOR NEXT AGENT:
  - The registry is now 74 tasks, not 65. Do not trust an older percentage.
  - Next task is still S-16 Configuration — providers. The audit did not change that.
  - Before claiming S-20 Reports or S-21 Planning, read L-13: the analytical chart presets they
    need do not exist yet.
  - Answer Q9, Q10 and Q11 before building S-25, S-26 or S-27; they may be duplicates or
    unspecified. Do not guess.
────────────────────────────────────────────────────────────
 
────────────────────────────────────────────────────────────
SESSION:        37
AGENT:          AI assistant using Copilot SDK in VS Code
START:          2026-09-16T15:25:00Z  |  local: 2026-09-16 20:55 IST (UTC+05:30)
END:            2026-09-16T15:55:00Z  |  local: 2026-09-16 21:25 IST (UTC+05:30)
TASK CLAIMED:   none — owner asked for a requirements re-validation. Docs only, no code.
END STATUS:     DONE
 
OWNER INPUT:
  "the project is entirely for my personal use, and its for my complete future investment so
  focus on that, no need to focus on codings." The review was therefore aimed at the investment
  domain, not at engineering tooling. An earlier tooling review in this session was abandoned
  on that instruction and none of it was written to the docs.
  This authorises editing the specification documents, which rule 12 otherwise forbids.
 
METHOD:
  Re-read the requirements and UI specification against one question: if this system holds the
  complete financial picture of one person for decades, what is missing that could cost them?
  Each candidate gap was grepped across both specs before being called a gap, so nothing already
  covered was duplicated.
 
CONFIRMED ALREADY COVERED (not re-added):
  - Broker reconciliation: sections 8 and 16 already require it, with account mismatch as a
    critical alert. Only the independent depository/registrar cross-check was missing (now 32).
  - Corporate actions, data quality, watchdog, alert escalation, audit trail, backups, currency
    handling and cost transparency are all well covered and were left alone.
 
GAPS FOUND AND ADDED AS REQUIREMENTS 25-34:
  25 Complete net worth   - the specs model only broker-traded assets. Provident fund, deposits,
                            gold, property, employer equity and liabilities were absent, so every
                            allocation target, concentration limit and goal projection is computed
                            on a minority of actual wealth. Largest structural gap.
  26 Tax in depth         - lots and holding periods existed; loss carry-forward with expiry,
                            advance instalments, withholding and treaty relief, foreign-asset
                            disclosure, remittance limits and a non-calendar tax year did not.
  27 Personal compliance  - absent entirely. Employer restricted lists, blackout windows,
                            pre-clearance and minimum holding periods. Highest-consequence gap:
                            a breach is legal and career exposure, not a financial loss. Must be
                            enforced at signal stage and apply to manual actions identically.
  28 Continuity           - the security model locks the system down but nothing lets a nominated
                            person reach the record if the owner cannot. Viewing is specified as
                            separable from trading. Automation pauses after configured inactivity.
  29 Behavioural          - the existing safety layer guards machine decisions only. Cooling-off,
                            manual caps, override recording, pattern detection and a decision
                            journal now guard the owner against himself.
  30 Liquidity/withdrawal - trading cash reserve existed; a life emergency reserve, liquidity
                            classification, known commitments and any withdrawal phase did not.
  31 Real returns         - every metric was nominal, which overstates progress over decades.
                            Inflation-adjusted reporting, ranged projections with stated
                            assumptions, and a simple-benchmark comparison added.
  32 Counterparty risk    - the watchdog asks whether a broker is reachable, never what happens
                            if one fails. Exposure per custodian, independent statement
                            reconciliation, and provable holdings without the broker.
  33 Strategy decay       - strategies had a promotion path and no way down. Retirement criteria
                            defined before going live, automatic demotion, cross-correlation.
  34 Export/dormant       - backups existed, portability did not. Open-format export, a dormant
                            mode safe to leave unattended, and running-cost budget tracking.
 
UI SPEC SECTION 19 ADDED:
  19.1 four new screens (Net Worth, Decision Journal, Continuity, Compliance)
  19.2 nine existing screens that must be extended
  19.3 five new states: stale by design, unverified, restricted, cooling off, overdue review
  19.4 the mock data these need
 
REGISTRY:
  - S-30..S-33 new screens; Stage E (E-01..E-09) extensions to built screens; M-17 mock data
  - Active tasks 74 -> 88. Progress reads 59%, down from 70%, because the denominator grew.
    No completed work was lost or reopened in this session.
 
OPEN QUESTIONS RAISED (Q13-Q18) - these are the owner-only decisions:
  Q13 employer trading policy (blocks real-broker automation), Q14 which assets sit outside the
  brokers, Q15 is this system or the broker the record of truth, Q16 tax residence and tax year,
  Q17 who needs access if the owner cannot, Q18 withdrawal phase and emergency reserve.
  Per rule 3, every one was written as a question with a marked provisional choice rather than
  an invented requirement.
 
FILES CREATED:
  - none
FILES MODIFIED:
  - Docs/Personal_Investment_Platform_Requirements.md — Part II sections 25-34, new
    risks in 23, new open questions in 24
  - Docs/UI_Specification_Mock_Phase.md — section 19
  - Docs/PROGRESS_LOG.md — registry, Q13-Q18, status, handoff, this entry
 
DEPENDENCIES ADDED:
  - none
 
VERIFICATION RUN:
  type check:  not re-run — no code touched; last known PASS (session 36)
  lint:        not re-run — Docs/** is ESLint-ignored
  build:       not re-run — documentation-only change
  gap basis:   every claimed gap grepped across both specs before being written up
 
NOTES FOR NEXT AGENT:
  - Requirements 25-34 are design intent, not yet scheduled work. The existing Stage S order is
    unchanged and S-16 Configuration - providers is still the next task.
  - Rates, thresholds, holding periods and tax-year boundaries in section 26 are deliberately
    not stated. They are configuration, per Pillar 0. Do not hardcode a number from anywhere.
  - Q13 is the one to escalate. Until it is answered, do not build anything that could place an
    order at a real broker, and treat S-33 Compliance as required rather than optional.
  - S-30 Net Worth is the highest-value new screen: it corrects the denominator that S-21
    Planning and E-06/E-07 depend on. Consider it before the Reports and Planning extensions.
────────────────────────────────────────────────────────────
```
 
---
 
## 5. Open Questions For The Owner (Append Only)
 
> Agents add here when a spec is silent. Owner answers inline. Answered items stay for the record.
 
| # | Raised by | Date | Question | Answer |
|---|-----------|------|----------|--------|
| 1 | — | — | Which headless component library or component kit for the library layer? | React Aria Components — owner, 2026-09-15 (see decision 6) |
| 2 | — | — | Integer minor units or a decimal library for money? | Decimal library (decimal.js chosen in F-17) — owner & session 7 (see decisions 7, 15) |
| 3 | — | — | Library as separate repository or workspace package? | pnpm workspace package in same repo — owner, 2026-09-15 (see decision 8) |
| 6 | Session 1 | 2026-09-15 | Framework/bundler not named in any spec | React + Vite SPA — owner, 2026-09-15 (see decision 9) |
| 7 | Session 1 | 2026-09-15 | Node v20.11.1 installed is below Vite 7 minimum (20.19). Upgrade Node to 22 LTS? | unanswered — provisional: Vite 6 pinned |
| 8 | Session 3 | 2026-09-15 | ESLint 9.39.5 is marked deprecated (unsupported) by npm; ESLint 10 and Stylelint 17 need Node >=20.19. Upgrade Node to unblock them? (same fix as Q7) | unanswered — provisional: ESLint 9, Stylelint 16 pinned |
| 4 | — | — | Does the 250-line limit apply to test and story files? | Moot — file length no longer lint-enforced (decision 13), 2026-09-15 |
| 5 | — | — | Is high contrast theme needed at launch or later? | At launch — owner ("complete all until F15"), 2026-09-15 |
| 9 | Session 36 | 2026-09-16 | Is Portfolio → Performance (`/portfolio/performance`) a distinct screen, or is it the same thing as Reports → Performance reports (S-20)? Both are in the nav map. If distinct, S-25 stands; if not, S-25 should be dropped and the route pointed at the Reports screen | unanswered — provisional: kept as separate task S-25 so it is not silently lost |
| 10 | Session 36 | 2026-09-16 | Is Trading → Positions (`/trading/positions`) distinct from Portfolio → Holdings (S-02)? Both are in the nav map and section 7 specifies only Holdings (7.2). If it means "positions opened by automation" it is a real screen; if it is a synonym it should be dropped | unanswered — provisional: kept as separate task S-27 |
| 11 | Session 36 | 2026-09-16 | Markets → Screener is in the nav map (spec 6) but has no screen specification in section 7. What should it contain? | unanswered — provisional: task S-26 raised as a placeholder so the gap is visible; do not build until specified |
| 12 | Session 36 | 2026-09-16 | L-12 asks for "visual regression test setup". Should that be real visual regression (screenshot baselines, e.g. Playwright), or is a runtime verification script enough? Either way, should the script live in the repository so it can be re-run? Decision 11 dropped CI, which may have been read as dropping this too | unanswered — provisional: L-12 reopened as PARTIAL; no tooling added |
| 13 | Session 37 | 2026-09-16 | **Am I subject to an employer trading policy** — restricted list, blackout windows, pre-clearance, minimum holding periods, disclosure obligations? This determines whether S-33 Compliance is essential or not applicable. It is the highest-consequence open question in this document: a breach is a legal and career exposure, not a financial loss | unanswered — provisional: S-33 raised and specified; **do not enable any automation against a real broker until this is answered** |
| 14 | Session 37 | 2026-09-16 | Which assets sit outside the brokers (provident fund, pension, deposits, gold, property, insurance-linked savings, employer equity, loans), and should the platform hold the complete picture or only the traded part? Allocation targets, goal projections and concentration limits are wrong if they exclude these | unanswered — provisional: S-30 Net Worth raised on the assumption the complete picture is wanted |
| 15 | Session 37 | 2026-09-16 | Is this system the record of truth for my holdings, or is the broker the record of truth with this system as a view over it? This decides how hard a reconciliation mismatch should fail, and what must survive if the broker is unavailable | unanswered — provisional: treated as a view over the broker, with an independent record kept good enough to prove a position (requirements 32) |
| 16 | Session 37 | 2026-09-16 | Which country am I tax resident in for the reporting period, which tax year does reporting follow, and do I hold assets outside that country? Determines whether the cross-border parts of requirements 26 (annual foreign-asset disclosure, outward remittance limits, relief for tax paid abroad) apply at all | unanswered — provisional: requirements written so every rate, threshold, holding period and tax-year boundary is configuration, never hardcoded |
| 17 | Session 37 | 2026-09-16 | Who needs to reach this information if I cannot, and how would they do it today? Requirements 28 assumes at least one nominated person who needs to see but not trade | unanswered — provisional: S-32 Continuity raised; access to view is specified as separable from ability to act |
| 18 | Session 37 | 2026-09-16 | Will there be a withdrawal phase to model, or is this accumulation only for the foreseeable future? Also: what is the emergency reserve in months of expenses, and at what portfolio value would I want automation reduced rather than expanded? | unanswered — provisional: requirements 30 written to cover accumulation, partial withdrawal and full withdrawal, so none is foreclosed |
 
---
 
## 6. Decision Record (Append Only)
 
> Moved to [DECISIONS.md](./DECISIONS.md) - required reading at every session start.
 
All 38 decisions, plus decision 39 recording this restructure, now live in `DECISIONS.md`.
Append new decisions there, not here.
 