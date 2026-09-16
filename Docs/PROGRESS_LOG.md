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
PHASE:              Stage S Screens — in progress (S-01 to S-22 done)
OVERALL PROGRESS:   67% (59 of 88 active tasks done; Stage F 100%; Stage M 15 of 17;
                    Stage L 11 of 14 + L-12 partial; Stage S 22 of 33; Stage E 0 of 9)
LAST UPDATED:       2026-09-16T22:40:30Z  |  local: 2026-09-17 04:10 IST
LAST AGENT:         session 44 (S-22 Alerts Centre)
BUILD STATE:        PASS (Vite 6 + React 19; JS one 3,329 kB chunk — see P-04)
TYPE CHECK:         PASS (tsc --noEmit zero errors across all workspaces)
LINT:               ESLint PASS (0 errors). Prettier FAILS on a Windows checkout: no
                    .gitattributes + core.autocrlf=true writes CRLF against endOfLine "lf",
                    so `pnpm lint` reports every file. Not a code defect — see findings.
BLOCKERS:           none for building. But see Q13: do not enable automation against a real
                    broker until the employer-trading-policy question is answered.
```

---

## 2. Handoff Note — Read This First

> Rewritten completely at the end of every session. Written for an agent with no memory of any previous session.

```
WHERE THINGS STAND:
  pnpm workspace monorepo, git branch main. Stages F, M and L done. Stage S: S-01 to S-22 done
  (Overview, Holdings, Position Detail, Instrument Workspace, Watchlists, System Health, Backtest
  screens, Strategy Library and Editor, Signals & Approvals, Orders, Risk & Safety, the 7.18
  Configuration areas except credentials (S-28) and the automation permission summary (S-29),
  News & Events, Reports, Planning, Alerts Centre). The owner asked for the remaining S tasks one
  by one, each committed (no push), taking the recommended option whenever a choice comes up
  (decision 26). typecheck and ESLint pass; Prettier fails on Windows checkouts only (CRLF).

  Session history older than the last three sessions is in PROGRESS_ARCHIVE.md and is NOT
  session-start reading.

WHAT I COMPLETED THIS SESSION:
  - Session 44: S-22 Alerts Centre. See session 44 end entry.
  - Session 43: S-21 Planning. Session 42: S-20 Reports.

WHAT IS PARTIALLY DONE:
  Nothing.

EXACT NEXT STEP:
  Claim S-23 Audit Log (UI spec 7.20: complete record of configuration changes, approvals, orders,
  limit changes and stage promotions; what changed with before and after, timestamp and trigger;
  filterable and searchable; trace one decision chain from signal through approval to order to
  fill). Route ROUTES.AUDIT (/audit) renders features/audit/AuditLogPage.tsx (placeholder). Build
  the log from records that already exist rather than a separate seed: configuration versions
  (configStore), risk limit change log (riskStore), approval decisions and orders (tradingStore),
  strategy promotions (strategy library), and the order history lifecycle for the decision chain
  (signal -> approval -> order -> fill). Copy features/trading/orders for list + filters + detail.
  Then S-24 onward in registry order; S-26 Screener has no specification (open question 11): mark
  it BLOCKED, do not invent it.

FILES TOUCHED (session 44): see session 44 end entry.

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
  - Two files differing only in case (configFields.ts / ConfigFields.tsx) break the build on
    Windows. Pick a distinct name.
  - The Bash tool may fail with a temp-directory error; PowerShell works. Write multi-line text
    through a file, not a heredoc.
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
| S-16 | Configuration — providers | DONE | 100 | Session 38 | Shared config pattern extended (form fields, draft hook, save card, test connection; decision 40); coverage, granularity, history, rate limits and cost, priority with failover order, credential reference, health check, freshness; health and faults shared with System Health; all states verified |
| S-17 | Configuration — brokers | DONE | 100 | Session 39 | Markets, instrument types, order types, capabilities incl. paper account, fees, credential reference, automation switch per instrument type; API vs manual brokers; read-only connection test; health from System Health faults and usage plus holdings outside coverage; all states verified |
| S-18 | Configuration — instruments, currencies, alerts | DONE | 100 | Session 40 | Instrument types (fixed list; markets, granularity, minimum sizes, settlement and tax overrides, manual-only, automation); currencies (versioned base currency, FX rate source and fallback, stale limit, conversion cost); alert rules (category, severity, channels, escalation, quiet hours with critical override, test alert); handler and hook factories (decision 41); all states verified |
| S-19 | News & Events | DONE | 100 | Session 41 | Live feed with grouped duplicate stories, sentiment always with confidence and styled as an estimate, importance, holdings emphasis, seven filters, price reaction per story, stale banner from the news provider's configured freshness; month/week/day calendar with impact, restriction windows and held-only filter; all states verified |
| S-20 | Reports | DONE | 100 | Session 42 | Six report types on one screen (performance with time-weighted return and currency effect, allocation, costs, income, tax summary, strategy attribution); period presets and custom range; one report currency; previous-period and benchmark comparison; CSV export; scheduled reports with run history; computed from the same lots, prices and FX as the portfolio; all states verified |
| S-21 | Planning | DONE | 100 | Session 43 | Allocation targets by type, country, currency and sector with drift, in-place editing and suggested corrective trades with estimated costs; goals with progress, projected value and completion; scenario projections (cautious, expected, hopeful, real terms) and proposed-trade preview across all dimensions; no order path; all states verified |
| S-22 | Alerts Centre | DONE | 100 | Session 44 | Alert groups with occurrences, severity in word/symbol/colour, filters by severity/category/market/state, acknowledge and resolve with notes and history, escalation from the saved alert rules with failed deliveries named, links to the screen holding each fact; stale banner and empty state built but not browser-verified |
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
 
> Sessions 0 to 41 have been archived to [PROGRESS_ARCHIVE.md](./PROGRESS_ARCHIVE.md).
> Only the last three sessions are kept here, per rule 11. Open the archive only when you need
> a specific past session - it is not session-start reading.
 
```
────────────────────────────────────────────────────────────
SESSION:        42 — START ENTRY
AGENT:          Claude Opus 5 (claude-opus-5)
START:          2026-09-16T21:58:10Z  |  local: 2026-09-17 03:28 IST (UTC+05:30)
TASK CLAIMED:   S-20 Reports
OWNER INPUT:    "Try to complete the remaining pending S items one by one"; decision 26

PRE-WORK VERIFICATION:
  git:         S-19 committed as 6138a89; working tree clean
  type check:  PASS, ESLint: PASS, build: PASS (run immediately before the S-19 commit)

SCOPE (UI spec 7.16):
  - Report types: performance, allocation, costs, income, tax summary, strategy attribution
  - Period presets and custom range; one currency for the whole report; comparison with the
    previous period of equal length and with a benchmark; export; scheduled reports with history
  - The three routes (/reports/performance, /costs, /tax) open the same screen on that report
    type; the other three types are reached from the type selector (?type= in the URL), since the
    nav map has no route for them
  - Mock endpoint GET /api/v1/reports computes a report from the same holdings, lots, price
    history, FX history and transactions the portfolio screens use, so totals agree. Returns are
    time-weighted (daily chain-linked, excluding contributions); the currency effect is shown
    apart from price return. Benchmark: SPY in the report currency
  - Tax and income use the market configuration (S-15) for holding periods, rates and dividend
    withholding, and are labelled as estimates for an India-resident owner, not advice
  - Scheduled reports: create, enable or disable, run now, delete; run history with delivery
    status through the configured alert channels (the webhook fails, as on System Health)
  - PROVISIONAL: the mock data has no sales, so realised gains are zero in every period; this is
    stated on the report rather than invented
────────────────────────────────────────────────────────────

────────────────────────────────────────────────────────────
SESSION:        42 — END ENTRY
AGENT:          Claude Opus 5 (claude-opus-5)
END:            2026-09-16T22:15:00Z  |  local: 2026-09-17 03:45 IST (UTC+05:30)
TASK:           S-20 Reports — DONE

WHAT WAS BUILT (UI spec 7.16):
  - One reports screen for six types: performance, allocation, costs, income, tax summary and
    strategy attribution. /reports/performance, /costs and /tax open on their type; any type can be
    picked and is kept in ?type= so a report can be linked to
  - Period presets (this month, last month, this quarter, year to date, last 12 months) and a
    custom range, checked before asking (end by yesterday, start after price history begins)
  - One currency for the whole report (USD, INR, EUR, GBP), defaulting to the configured base
    currency (S-18)
  - Comparison with the previous period of equal length (every metric shows the earlier value and
    the change) or with the S&P 500 (performance), shown in words beside each metric
  - Headline metrics with notes, a chart (growth of 100 against the benchmark; allocation donut),
    tables with totals, and the assumptions behind the numbers always shown
  - Export CSV of metrics, comparisons, tables and notes
  - Scheduled reports: add (type, frequency, currency, delivery channel), pause or resume, run now,
    delete; report history with delivered or failed results. Delivery follows the alert channel's
    test outcome, so the webhook schedule fails as it does on System Health
  - While a changed report loads, the previous one stays visible with a clear notice (stale);
    loading, error and empty-portfolio states built

MOCK DATA:
  - GET /api/v1/reports?type&from&to&currency&comparison; GET/POST /reports/schedules,
    PATCH/DELETE /reports/schedules/:id, POST /reports/schedules/:id/run; GET /reports/runs
  - Reports are computed from the same holdings, lots, transactions, price history and FX history
    as the portfolio screens: year-to-date value at end $97,791.81 against a live portfolio total of
    $98,142.18 (closing prices versus live quotes)
  - Returns are time-weighted (chain-linked daily, weekly beyond six months, excluding money added);
    the currency effect is separated on units held throughout
  - Tax and income use the market configuration's holding periods, rates and dividend withholding
  - Seeded schedules (monthly performance, quarterly tax, a paused weekly costs report on the
    failing webhook) and six past runs

FILES CREATED:
  - data/schemas/reports.ts; data/api/reportQueries.ts
  - data/mock/generators/{reportValuation,reportParts,reportPortfolioBuilders,reportAttribution,
    reportCashBuilders,reportTaxBuilder,reports}.ts; data/mock/stores/reportStore.ts;
    data/mock/handlers/reportHandlers.ts
  - features/reports/{Reports.module.scss, model/reportModel.ts, model/reportLimits.ts,
    sections/ReportScreen.tsx, sections/ReportControls.tsx, sections/ReportBody.tsx,
    sections/ScheduledReports.tsx}
FILES MODIFIED:
  - features/reports/{ReportsPerformancePage,ReportsCostsPage,ReportsTaxPage}.tsx — rewritten
  - data/schemas/index.ts; data/api/index.ts; mock/generators/index.ts; mock/handlers/index.ts
  - Docs: session 39 moved verbatim to PROGRESS_ARCHIVE.md (rule 11)

DEPENDENCIES ADDED:
  - none

DECISIONS MADE:
  - none

VERIFICATION RUN:
  type check:  PASS — exit 0
  lint:        ESLint PASS; Prettier --check PASS on every changed file (CRLF finding unchanged)
  build:       PASS — exit 0
  endpoint:    all six types returned 200 before the UI was built; end date before start -> 400
               "The start date must be on or before the end date"
  performance: year to date against the previous period: start $86,005.15 (previous $93,345.56),
               time-weighted return -2.80% (previous -22.73%, +19.93 pts), currency effect
               -$639.37; with the benchmark: "S&P 500 (SPY) -6.45% (+3.65 pts against it)";
               growth-of-100 chart and by-holding table rendered
  tax:         switched to tax, INR, last month: URL ?type=tax, period 2026-08-01 to 2026-08-31,
               "Estimated tax if everything were sold ₹96,612.57", one lot within 30 days of long-term
  costs:       /reports/costs opened on costs: $4.50 commissions (AAPL $3.00, BTCUSD $1.50),
               previous period $1.50
  allocation:  value at end ₹72,07,862.73 in INR; largest position 40.96% (XAUUSD), unsigned
  validation:  From after To -> "The start date must be on or before the end date."
  schedules:   Run now on the weekly costs schedule added a failed run "Endpoint returned 502 Bad
               Gateway"; added an income quarterly GBP schedule to mobile push; paused the tax
               schedule
  states:      loading-error -> "Report unavailable" and "Scheduled reports unavailable";
               empty-portfolio -> "Nothing to report yet"; reset to healthy

MISTAKES THIS SESSION (recorded per rules section 7):
  - Every percentage was formatted with a sign, so shares read "+40.96%"; percentages now carry a
    signed flag and only returns are signed
  - Two builder files went over 300 lines; tax and attribution were split out

FINDINGS (out of scope, not fixed):
  - PROVISIONAL (see start entry): the mock data has no sales, so realised gains are always zero
  - Cash balances are not included in any report
  - Interest and fund income are not tracked; losses carried forward are not tracked (requirements 26)
  - Inflation-adjusted returns (UI spec 19) need inflation history (M-17)
  - L-13 chart presets are still missing (returns distribution, waterfall for costs, stacked area
    for allocation over time); tables stand in for them
  - Scheduled runs only happen on "Run now"; nothing runs on the schedule in the mock phase
  - Holdings' lot purchase dates drive valuation, so a period before the first purchase reports zero
────────────────────────────────────────────────────────────

────────────────────────────────────────────────────────────
SESSION:        43 — START ENTRY
AGENT:          Claude Opus 5 (claude-opus-5)
START:          2026-09-16T22:15:43Z  |  local: 2026-09-17 03:45 IST (UTC+05:30)
TASK CLAIMED:   S-21 Planning
OWNER INPUT:    "Try to complete the remaining pending S items one by one"; decision 26

PRE-WORK VERIFICATION:
  git:         S-20 committed as 2c689d2; working tree clean
  type check:  PASS, ESLint: PASS, build: PASS (run immediately before the S-20 commit)

CORRECTION (rules section 7): the session 41 end entry gives END 2026-09-16T22:25:00Z. That time
  was estimated, not read from the clock, and is later than session 42 actually ended (22:15Z).
  Session 41 ended at about 21:58Z, before session 42 started. The entry is left as written.

SCOPE (UI spec 7.17):
  - Allocation targets by instrument type, country, currency and sector; target versus actual with
    drift beyond a tolerance highlighted; suggested corrective trades with estimated costs
  - Goals with target amount and date, linked holdings, progress and projected completion
  - Scenario modelling: adjust return, inflation, contribution and horizon assumptions and see
    projected outcomes; model a proposed trade's effect on allocation and costs before committing
  - Current values come from the report valuation (S-20) in the configured base currency; trade
    cost estimates use the broker fee rules (S-17) and currency conversion costs (S-18)
  - Sector exists only for individual stocks (fundamentals seeds). ETFs, gold, crypto and the
    private bond are shown as "Not classified" and cannot be targeted by sector; this is stated,
    not invented
  - Suggestions and trade previews never create an order or an approval; they say so
────────────────────────────────────────────────────────────

────────────────────────────────────────────────────────────
SESSION:        43 — END ENTRY
AGENT:          Claude Opus 5 (claude-opus-5)
END:            2026-09-16T22:31:00Z  |  local: 2026-09-17 04:01 IST (UTC+05:30)
TASK:           S-21 Planning — DONE

WHAT WAS BUILT (UI spec 7.17):
  Allocation targets (/planning/allocation):
  - Instrument type, country, currency and sector: value, actual share, target, a bar with a target
    tick, drift in points and a status badge (within tolerance, over, under, no target)
  - Targets edited in place with a live check that they add up to 100% (or are all cleared), a
    tolerance and a reason; currency selector (default: configured base currency)
  - Suggested corrective trades per bucket outside tolerance: trims or adds to the largest holding,
    whole units unless fractional, estimated cost, and a link that opens the trade preview prefilled
  Goals (/planning/goals):
  - Goal cards: current value of linked holdings, progress bar, projected value at the target date
    with any shortfall, projected completion month, on track or behind plan, projection chart with the
    target line; add, edit and delete (two-step) with inline checks
  Scenarios (/planning/scenarios):
  - Projected outcomes: contribution, years, expected return, spread and inflation -> cautious,
    expected and hopeful cases from today's portfolio value, chart and table in nominal terms and in
    today's money
  - Proposed trade preview: instrument, direction, quantity -> value, estimated cost with breakdown,
    warnings (whole units, selling more than held, manual-only type, disabled type, manual broker,
    a bucket moving outside tolerance) and before/after for all four dimensions. No order button

MOCK DATA:
  - GET/PUT /api/v1/planning/allocation; GET/POST /planning/goals, PUT/DELETE /planning/goals/:id;
    POST /planning/projection; POST /planning/trade-preview
  - Values from the report valuation (shared as handlers/portfolioValuation.ts, now also used by the
    report handlers): invested value $98,047.11 at 2026-09-16
  - Costs: broker fee rules (S-17) and currency conversion bps (S-18), e.g. selling 7 XAUUSD at IBKR
    $5.49; buying RELIANCE at Zerodha adds 30 bps conversion
  - Seeds: targets by instrument type (long term 35, ETF 30, commodity 20, bond 10, digital asset 5)
    and currency (USD 80, INR 10, GBP 10), 5 points tolerance; goals "House deposit" (behind plan)
    and "Retirement top-up" (on track)
  - Sector is only known for individual stocks (fundamentals seeds, now exported as SECTORS); funds,
    gold, crypto and the bond are "Not classified"

FILES CREATED:
  - data/schemas/planning.ts; data/api/planningQueries.ts
  - data/mock/generators/{planningAllocation,planningProjections,planningTradePreview}.ts;
    data/mock/stores/planningStore.ts; data/mock/handlers/{planningHandlers,portfolioValuation}.ts
  - features/planning/{Planning.module.scss, model/planningModel.ts, sections/AllocationView.tsx,
    AllocationTargets.tsx, GoalCard.tsx, GoalForm.tsx, ProjectionPanel.tsx, TradePreviewPanel.tsx}
FILES MODIFIED:
  - features/planning/{PlanningAllocationPage,PlanningGoalsPage,PlanningScenariosPage}.tsx —
    rewritten from placeholders
  - data/mock/handlers/{reportHandlers,index}.ts; data/mock/generators/{index,researchData}.ts;
    data/schemas/index.ts; data/api/index.ts
  - Docs: session 40 moved verbatim to PROGRESS_ARCHIVE.md (rule 11)

DEPENDENCIES ADDED:
  - none

DECISIONS MADE:
  - none

VERIFICATION RUN:
  type check:  PASS — exit 0
  lint:        ESLint PASS; Prettier --check PASS on every changed file (CRLF finding unchanged)
  build:       PASS — exit 0
  endpoints:   all planning endpoints 200 before the UI; selling unheld NVDA -> 400 "NVDA is not
               held, so there is nothing to sell"
  allocation:  commodity 41.6% against 20% "Over target +21.6 pts"; currency view USD 94.8% against
               80%; setting commodity to 30 -> "Targets add up to 110.0%" and Save disabled; with
               long term 25 and a reason, saved; commodity still over, long term now within
  suggestion:  "Sell 13 XAUUSD ... estimated cost $10.20"; its preview link opened scenarios with
               XAUUSD, sell, 7 prefilled (after the saved change)
  preview:     selling 7 XAUUSD ~$10,979.99, cost $5.49 (IBKR commission), commodity 41.6% -> 34.2%
               within tolerance; all four dimensions shown before and after
  projection:  $1,000 a month for 10 years at 6% ± 3%, 4% inflation: expected $338,060.88,
               $228,381.82 in today's money
  goals:       2 goals, 1 on track; House deposit $46,692.86 of $90,000, short by $5,423.13, reached
               around 2029-12-16; an empty form listed four things missing; added "Car" (behind
               plan), then deleted it through the two-step delete
  states:      loading-error -> "Goals unavailable" and "Allocation unavailable"; empty-portfolio ->
               "Nothing to allocate yet"; reset to healthy. Stale: values are stated "at" the close
               date shown on each screen; there is no live stream to go stale

MISTAKES THIS SESSION (recorded per rules section 7):
  - I used UsageMeter for goal progress; it escalates to warning colours as it fills, which suits a
    limit but reads a nearly reached goal as a problem. Replaced with a plain progress bar
  - A goal shortfall was first computed with plain numbers; it now uses Money
  - The first goal projection loop was convoluted; simplified before verification

FINDINGS (out of scope, not fixed):
  - Trade previews are always in USD; the screen does not offer a currency
  - Allocation excludes cash and assets outside the brokers (S-30 Net Worth)
  - Suggested trades for different dimensions can overlap (stated on screen)
  - Allocation targets are not versioned like configuration; only the latest reason is kept
  - Sectors for ETFs and funds would need look-through holdings data
────────────────────────────────────────────────────────────

────────────────────────────────────────────────────────────
SESSION:        44 — START ENTRY
AGENT:          Claude Opus 5 (claude-opus-5)
START:          2026-09-16T22:31:44Z  |  local: 2026-09-17 04:01 IST (UTC+05:30)
TASK CLAIMED:   S-22 Alerts Centre
OWNER INPUT:    "Try to complete the remaining pending S items one by one"; decision 26

PRE-WORK VERIFICATION:
  git:         S-21 committed as 8a5d903; working tree clean
  type check:  PASS, ESLint: PASS, build: PASS (run immediately before the S-21 commit)

SCOPE (UI spec 7.19):
  - Chronological list with severity, category, source, market, time and acknowledgement state;
    filters by severity, category, market and state; repeated alerts grouped with their
    occurrences; acknowledge and resolve with optional notes; escalation state shown for
    unacknowledged critical alerts
  - New endpoint /api/v1/alerts/centre with a store for state and notes. The existing
    /api/v1/system/alerts feed (Overview) is left unchanged
  - Alerts describe things other screens already show: the unconfirmed order (S-13), an expiring
    approval (S-12), the provider delay (System Health), failed report deliveries on the webhook
    (S-20), the Apple regulatory story on a holding (S-19), broker maintenance, allocation drift
    (S-21). Developer scenarios add their alert (provider down, broker disconnected, safety breach)
  - Escalation follows the saved alert rules (S-18): a critical alert matched by the critical rule
    goes to its channels, and escalates to the rule's escalation channels after its wait unless
    acknowledged; the webhook's failing test shows as a failed escalation delivery
────────────────────────────────────────────────────────────

────────────────────────────────────────────────────────────
SESSION:        44 — END ENTRY
AGENT:          Claude Opus 5 (claude-opus-5)
END:            2026-09-16T22:40:30Z  |  local: 2026-09-17 04:10 IST (UTC+05:30)
TASK:           S-22 Alerts Centre — DONE

WHAT WAS BUILT (UI spec 7.19):
  - /alerts: counts of open critical, unacknowledged, escalated and resolved alerts; filters by
    severity, category, market and state (default: not resolved); newest first
  - Each alert: severity in word, symbol and coloured edge; state; category, source and market;
    relative time; repeated alerts grouped as "×4 occurrences" with every occurrence listed
  - Expanding shows the message, a link to the screen that holds the fact, occurrences, and the
    acknowledge/resolve history with notes; Acknowledge and Resolve with an optional note
  - Unacknowledged critical alerts show their escalation: the rule, where they were sent, and
    either when they escalate ("at 22:40:01 UTC (in 2 minutes) unless acknowledged") or that they
    escalated and to which channels, naming a failed delivery
  - The list refreshes each minute; a failed refresh keeps the last list with a stale banner

MOCK DATA:
  - GET /api/v1/alerts/centre, POST /api/v1/alerts/centre/:id/action {action, note}
  - Seven alerts about facts other screens show (NVDA unconfirmed order, TSLA approval expiring,
    failed report deliveries on the webhook, London price delays, AAPL news, commodity allocation
    drift, broker maintenance); scenarios add provider down, broker disconnected or safety breach
  - Escalation computed from the saved alert rules (S-18) and channel test results
  - /api/v1/system/alerts (Overview) unchanged

FILES CREATED:
  - data/schemas/alerts-centre.ts; data/api/alertCentreQueries.ts
  - data/mock/generators/alertCentre.ts; data/mock/handlers/alertCentreHandlers.ts
  - features/alerts/{Alerts.module.scss, model/alertFilters.ts, sections/AlertCentreView.tsx,
    sections/AlertItem.tsx}
FILES MODIFIED:
  - features/alerts/AlertsPage.tsx — rewritten from a placeholder
  - data/schemas/index.ts; data/api/index.ts; data/mock/generators/index.ts; data/mock/handlers/index.ts
  - Docs: session 41 moved verbatim to PROGRESS_ARCHIVE.md (rule 11)

DEPENDENCIES ADDED:
  - none

DECISIONS MADE:
  - none

VERIFICATION RUN:
  type check:  PASS — exit 0
  lint:        ESLint PASS; Prettier --check PASS on every changed file (CRLF finding unchanged)
  build:       PASS — exit 0
  list:        "Open critical 1, Unacknowledged 5, Escalated 0, Resolved 1"; NVDA critical first
               with its escalation; London delays "×4 occurrences", acknowledged, with four
               occurrence times and the seeded note
  filters:     critical -> 1; UK -> 1
  acknowledge: NVDA with note "Called the broker: order is live." -> Acknowledged, escalation gone,
               history shows the note; counts became open critical 0, unacknowledged 4
  escalation:  provider-down: provider alert "×3 occurrences ... Escalated to Email, Webhook ...
               Delivery to Webhook failed"; NVDA "Escalates ... (in 2 minutes) unless acknowledged"
  resolve:     resolving the provider alert removed it from "Not resolved" and listed it under
               Resolved
  states:      loading-error -> "Alerts unavailable"; reset to healthy
  NOT verified in the browser: the stale banner after a failed refresh (needs a refetch to fail
  while data is on screen); and the empty state (no scenario yields zero alerts)

MISTAKES THIS SESSION (recorded per rules section 7):
  - A future escalation first read "Escalates ... in the future" because formatRelativeTime only
    describes the past; it now shows the time and minutes remaining
  - Two seeded links pointed at routes that do not exist (/system, /risk); corrected to
    /health/status and /risk/limits before verification

FINDINGS (out of scope, not fixed):
  - The top bar's unread count is a hardcoded 3 in SystemStateProvider, not the open alert count
  - The Overview's recent alerts still use the older /system/alerts feed, so acknowledging here
    does not change it
  - Alert state resets on a full reload, like every mock store
  - Quiet hours from the alert rules are not applied to the escalation times shown
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
 