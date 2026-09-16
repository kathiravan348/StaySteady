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
PHASE:              Stage S Screens — in progress (S-01 to S-19 done)
OVERALL PROGRESS:   64% (56 of 88 active tasks done; Stage F 100%; Stage M 15 of 17;
                    Stage L 11 of 14 + L-12 partial; Stage S 19 of 33; Stage E 0 of 9)
LAST UPDATED:       2026-09-16T22:25:00Z  |  local: 2026-09-17 03:55 IST
LAST AGENT:         session 41 (S-19 News & Events)
BUILD STATE:        PASS (Vite 6 + React 19; JS one 3,238 kB chunk — see P-04)
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
  pnpm workspace monorepo, git branch main. Stages F, M and L done. Stage S: S-01 to S-19 done
  (Overview, Holdings, Position Detail, Instrument Workspace, Watchlists, System Health, Backtest
  screens, Strategy Library and Editor, Signals & Approvals, Orders, Risk & Safety, all 7.18
  Configuration areas except credentials (S-28) and the automation permission summary (S-29), and
  News & Events). The owner asked for the remaining S tasks one by one, each committed (no push),
  taking the recommended option whenever a choice comes up (decision 26). typecheck and ESLint
  pass; Prettier fails on Windows checkouts only (CRLF, see findings) — not a code defect.

  Session history older than the last three sessions is in PROGRESS_ARCHIVE.md and is NOT
  session-start reading.

WHAT I COMPLETED THIS SESSION:
  - Session 41: S-19 News & Events. See session 41 end entry.
  - Session 40: S-18 Configuration — instruments, currencies, alerts.

WHAT IS PARTIALLY DONE:
  Nothing.

EXACT NEXT STEP:
  Claim S-20 Reports (UI spec 7.16: report types performance, allocation, costs, income, tax
  summaries, strategy attribution; period presets and custom ranges; currency selector for the
  whole report; comparison with benchmarks and previous periods; export; scheduled reports and
  history). Find the route in routes/routes.ts (REPORTS*) and its placeholder page. L-13 (missing
  analytical chart presets) is TODO — use the existing presets (equity curve, comparison curves,
  drawdown, donut, monthly heatmap) and DataTable, and log what a missing preset would add rather
  than building L-13 inside S-20. Derive every number from existing holdings, transactions,
  dividends (holdingCashFlows), orders and backtests; convert with convertMoneyWithTable. Then
  continue in registry order. S-26 Screener has no specification (open question 11): mark it
  BLOCKED, do not invent it.

FILES TOUCHED (session 41): see session 41 end entry.

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
 
> Sessions 0 to 38 have been archived to [PROGRESS_ARCHIVE.md](./PROGRESS_ARCHIVE.md).
> Only the last three sessions are kept here, per rule 11. Open the archive only when you need
> a specific past session - it is not session-start reading.
 
```
────────────────────────────────────────────────────────────
SESSION:        39 — START ENTRY
AGENT:          Claude Opus 5 (claude-opus-5)
START:          2026-09-16T17:16:27Z  |  local: 2026-09-16 22:46 IST (UTC+05:30)
TASK CLAIMED:   S-17 Configuration — brokers
OWNER INPUT:    "start s-17"; decision 26 (take recommended options, commit each screen)

PRE-WORK VERIFICATION:
  git:         S-16 committed as cd91b55; working tree clean
  type check:  PASS, ESLint: PASS, build: PASS (run immediately before the S-16 commit; nothing has
               changed since)

SCOPE (UI spec 7.18):
  - Brokers: markets, instrument types, capabilities, order types, simulation availability, fees,
    credentials, automation toggles per instrument type
  - Built on shared/config (decisions 38 and 40). Seeds come from CANONICAL_BROKERS (markets,
    account currency, automation support), the order history fee rules (IBKR 5 bps with a 1.00
    minimum, Zerodha 20 flat, HL 11.95 flat, private agent none) and the System Health broker
    sources and faults, so the screens agree
  - Brokers with no API (HL, private placement agent) are tracking-only: no orders, no credential,
    no automation, and no connection test
  - Test connection reads the session and account only. It never places, changes or cancels an
    order, and says so on the screen
  - /settings/credentials keeps the placeholder; /settings/brokers gets the real page
────────────────────────────────────────────────────────────

────────────────────────────────────────────────────────────
SESSION:        39 — END ENTRY
AGENT:          Claude Opus 5 (claude-opus-5)
END:            2026-09-16T17:31:00Z  |  local: 2026-09-16 23:01 IST (UTC+05:30)
TASK:           S-17 Configuration — brokers — DONE

WHAT WAS BUILT (UI spec 7.18):
  Brokers (/settings/brokers), on shared/config (decisions 38 and 40):
  - Account: id, name, country, account currency, connection (API, or manual from imported
    statements)
  - What it trades: markets (from the market configuration), instrument types, order types
  - Capabilities as switches: places orders, streams positions, fractional quantities, short
    selling, paper account (simulation availability)
  - Fees: percentage with a minimum, flat per order, or none, with the commission on a 10,000 trade
  - Credential reference (API brokers only)
  - Automation by instrument type: one switch per instrument type the broker trades, off unless the
    broker places orders, with a note naming covered markets whose own configuration blocks
    automation (currently SG)
  - Read-only Test connection for API brokers (credential, session, account read, paper account);
    manual brokers say there is nothing to test
  - Inline validation from the schema: a manual broker that places orders, streams positions, has
    a paper account or a credential; an API broker without a valid reference (a key-like value is
    rejected); order types without order placement or vice versa; automation without order
    placement or for a type the broker does not trade; a percentage fee with no rate; a flat fee
    with no amount
  - Switching to manual, turning order placement off, or removing an instrument type clears what
    can no longer apply (order types, automation), so the form never shows errors it caused itself
  - /settings/credentials now has its own placeholder (SettingsCredentialsPage)
  - Shared ConnectionTest takes an optional description

MOCK DATA:
  - GET/POST /api/v1/config/brokers, PUT /:id, POST /:id/revert, POST /config/brokers/test
  - Seeds: markets, account currency and country from CANONICAL_BROKERS; fees are the order history
    rules (IBKR 5 bps min 1.00, Zerodha 20.00 flat, HL 11.95 flat, private agent none); API usage,
    latency and faults from System Health. HL and the private placement agent are manual
  - Health: scenario faults, API usage against the limit (Zerodha 84%, as on System Health), an API
    broker never connected, holdings (from HOLDING_PROFILES) outside the configured markets or
    instrument types, and a disabled broker that still holds positions
  - The test contacts nothing and has no order step. Known references are the two seeded ones
  - History seeds are invented mock history: IBKR v1 covered US and UK only; Zerodha v1 allowed no
    automation
  - Save rejects markets that are not configured

FILES CREATED:
  - apps/web/src/data/schemas/config-brokers.ts
  - apps/web/src/data/mock/generators/{brokerConfig,brokerConnectionTest}.ts;
    mock/handlers/brokerConfigHandlers.ts
  - apps/web/src/features/settings/brokers/** ; features/settings/SettingsCredentialsPage.tsx
FILES MODIFIED:
  - data/schemas/index.ts; data/api/{configQueries,index}.ts; mock/generators/index.ts;
    mock/handlers/configHandlers.ts; mock/stores/configStore.ts
  - shared/config/ConnectionTest.tsx (description prop)
  - features/settings/SettingsBrokersPage.tsx — rewritten from the placeholder; routes/AppRoutes.tsx
  - Docs: session 36 moved verbatim to PROGRESS_ARCHIVE.md (rule 11)

DEPENDENCIES ADDED:
  - none

DECISIONS MADE:
  - none (follows 38 and 40)

VERIFICATION RUN:
  type check:  PASS — exit 0
  lint:        ESLint PASS; Prettier --check PASS on every changed file (CRLF finding unchanged)
  build:       PASS — exit 0
  list:        IBKR healthy "Connected; 4 holdings, 35% of monthly API requests used"; Zerodha
               "Needs attention: 84% of the monthly API request limit used"; HL and private agent
               "Tracked from imported statements; 1 holding"
  test:        IBKR passed credential, session (64 ms, System Health's figure), account read (USD,
               4 positions) and paper account
  validation:  "U1234567:hunter2" as the reference -> "This looks like a key, not a reference",
               test blocked; switching to manual hid the credential, disabled order placement and
               replaced the test with a note; a flat fee of 0 -> "A flat fee needs an amount"
  save/revert: removing Digital asset saved v3 and health became "Holds BTCUSD outside the markets
               or instrument types set here"; revert to v2 with a reason made v4, Healthy again;
               IBKR v1 diff shows one row, Markets US, UK -> US, UK, JP, SG
  new:         simulation notice; Groww saved as an API broker in simulation, "Needs attention: Not
               connected yet"; its test failed on the unknown reference; turning on Places orders
               showed order types and enabled automation switches; removing Long term removed its
               automation
  scenarios:   broker-disconnected -> IBKR Problem "Session expired; new orders to this broker are
               paused" and a failed session check; loading-error -> "Broker configuration
               unavailable"; reset to healthy
  placeholder: /settings/credentials shows "Credentials configuration is not built yet"

MISTAKES THIS SESSION (recorded per rules section 7):
  - A new API broker first reported "Connected; 0 holdings" though it had never connected. It now
    warns "Not connected yet".
  - Seeds listed instrument types in a different order from the checkboxes, so an edit showed as a
    whole-list change in the diff. The version description now lists them in a fixed order.
  - The Bash tool stopped working mid-session (temp-directory error); PowerShell was used instead.

FINDINGS (out of scope, not fixed):
  - Broker configuration is not read elsewhere: orders, approvals and holdings still use
    CANONICAL_BROKERS and the fixed fee rules in orderHistory.ts
  - The automation permission summary (S-29) should combine market, broker, instrument type and
    strategy; this screen only notes markets that block automation
  - Fee amounts are "in each trade's currency", matching order history, so a minimum of 1.00 means
    1 USD on a US trade and 1 GBP on a UK trade; a real broker may state minimums per currency
  - Instrument type labels elsewhere still read "Etf" and "Ipo" (humanizeToken); fixed on this
    screen only
────────────────────────────────────────────────────────────

────────────────────────────────────────────────────────────
SESSION:        40 — START ENTRY
AGENT:          Claude Opus 5 (claude-opus-5)
START:          2026-09-16T17:32:39Z  |  local: 2026-09-16 23:02 IST (UTC+05:30)
TASK CLAIMED:   S-18 Configuration — instruments, currencies, alerts
OWNER INPUT:    "start S-18"; decision 26 (take recommended options, commit each screen)

PRE-WORK VERIFICATION:
  git:         S-17 committed as 4b226c2; working tree clean
  type check:  PASS, ESLint: PASS, build: PASS (run immediately before the S-17 commit; nothing has
               changed since)

SCOPE (UI spec 7.18), built in this order so a partial hand-off is clean:
  1. Instrument types: enabled, automation permitted, applicable markets, granularity, minimum
     sizes, settlement, tax thresholds, manual-only flag. One entry per InstrumentTypeSchema value;
     types are a fixed list, so there is no "add". Markets seed from each market configuration's
     permitted instrument types. Settlement and tax threshold may be left to follow the market.
     PROVISIONAL: no type is seeded manual-only, because no manual-only type exists in the mock
     data (M-16). The flag is configurable; seeding one would invent data M-16 owns.
  2. Currencies: base currency selection, exchange rate source, conversion cost assumptions. One
     entry per supported currency (enabled, rate source, maximum rate age, conversion cost), plus a
     separately versioned base currency. Conversion costs come from the 0.25% charge (decision 28)
     and the per-market backtest FX costs; the rate source is the FX rates provider (S-16).
  3. Alert rules: per category, per severity, channel selection, escalation rules, quiet hours with
     critical override. Channels are System Health's; "Send test alert" reuses ConnectionTest and
     follows System Health's channel test outcomes (the webhook fails).
  - Instrument types and currencies have no simulation or live mode, so the entry list's mode badge
    becomes optional in shared/config
  - New handlers and hooks for these three areas go through small factories, since each would
    otherwise repeat the provider/broker files; existing areas are not moved (scope)
────────────────────────────────────────────────────────────

────────────────────────────────────────────────────────────
SESSION:        40 — END ENTRY
AGENT:          Claude Opus 5 (claude-opus-5)
END:            2026-09-16T17:52:00Z  |  local: 2026-09-16 23:22 IST (UTC+05:30)
TASK:           S-18 Configuration — instruments, currencies, alerts — DONE

WHAT WAS BUILT (UI spec 7.18), all three areas on shared/config (decisions 38, 40, 41):
  Instrument types (/settings/instruments):
  - One entry per instrument type, no "add"; enabled, manual only, automation permitted (switched
    off and locked while manual only), markets, price granularity, minimum quantity and order
    value, settlement and long-term tax holding period that either follow each market or override
  - Validation: an enabled type with no market, automation on a manual-only type, no granularity
    unless manual only, intraday without an intraday granularity, a zero minimum quantity
  - Health: disabled while held; a chosen market whose own configuration does not permit the type;
    automation permitted but no enabled broker automates it
  Currencies (/settings/currencies):
  - Base currency (USD, INR, EUR, GBP) versioned on its own, with a note that the top bar switch
    only changes the display; each currency: enabled (locked for the base), rate source and
    fallback chosen from providers that supply FX rates, stale-after minutes, conversion cost with
    the cost of converting 10,000 of the base currency
  - Validation: fallback equal to the main source; server refuses disabling the base currency,
    making a disabled currency the base, and unknown providers
  - Health: base currency disabled; rate source not an enabled FX provider (critical without a
    fallback); source down; rate older than the stale limit; disabled while held
  Alert rules (/settings/alerts):
  - Add and edit rules: category, minimum severity, channels (System Health's, labelled never tested
    or last test failed), escalation after N minutes to further channels, quiet hours with time zone,
    critical alerts break through quiet hours, enabled
  - Validation: no channel, escalation with no channel or only channels already sent to, quiet
    hours that start and end at the same time; server rejects unknown channels
  - Send test alert (the shared test card, now titled per area): one check per channel including
    escalation channels; nothing is sent
  - Health: a channel that failed its last test, one never tested, every direct channel failing
    (critical), and critical alerts held by quiet hours when the override is off
  Shared changes:
  - versionedConfigHandlers (mock list/save/revert/create factory) and settingsConfigQueries helper
    hooks, used by these three areas only (decision 41); configStore exports appendVersion
  - ConfigEntryList mode badge optional; ConnectionTest title and action label; TimeField moved
    from markets into shared/config FormFields (markets re-verified); instrumentTypeLabel and
    instrumentTypeInSentence in shared/format, used by brokers and instrument types

MOCK DATA:
  - GET /api/v1/config/{instruments,currencies,alerts}, PUT /:id, POST /:id/revert,
    POST /config/alerts (create), POST /config/alerts/test,
    GET/PUT /api/v1/config/base-currency, POST /config/base-currency/revert
  - Instrument type markets seed from each market's permitted instrument types and automation from
    the brokers' automation switches, read from the saved configuration stores
  - Conversion costs: USD 0 (funding currency), INR/JPY/SGD 30 bps (backtest per-market FX costs),
    others 25 bps (decision 28's 0.25%). Rate source prov-fx, stale after 60 minutes
  - Alert channels and test outcomes are System Health's (webhook fails, SMS never tested)
  - History seeds are invented mock history: mutual fund minimum 1 -> 0.001; INR conversion
    25 -> 30 bps; critical rule escalation 30 -> 5 minutes

FILES CREATED:
  - data/schemas/config-{instruments,currencies,alerts}.ts
  - data/mock/generators/{instrumentTypeConfig,currencyConfig,alertRuleConfig}.ts
  - data/mock/handlers/{versionedConfigHandlers,settingsConfigHandlers}.ts;
    data/api/settingsConfigQueries.ts
  - features/settings/{instruments,currencies,alerts}/** ;
    features/settings/Settings{Instruments,Currencies,Alerts}Page.tsx
FILES MODIFIED:
  - data/schemas/index.ts; data/api/index.ts; mock/generators/index.ts;
    mock/handlers/configHandlers.ts; mock/stores/configStore.ts
  - shared/config/{ConfigEntryList,ConnectionTest,FormFields}.tsx, shared/config/index.ts;
    shared/format/{display,index}.ts
  - features/settings/markets/{model/marketDraft.ts,sections/MarketFields.tsx,
    sections/MarketIdentityHours.tsx}; features/settings/brokers/model/brokerDraft.ts
  - routes/AppRoutes.tsx: /settings/instruments and /settings/currencies no longer render the
    markets page; /settings/alerts no longer renders the Alerts Centre page
  - Docs: session 37 moved verbatim to PROGRESS_ARCHIVE.md (rule 11); decision 41

DEPENDENCIES ADDED:
  - none

DECISIONS MADE:
  - 41: mock handler and query hook factories for configuration areas from S-18 on

VERIFICATION RUN:
  type check:  PASS — exit 0
  lint:        ESLint PASS; Prettier --check PASS on every changed file (CRLF finding unchanged)
  build:       PASS — exit 0
  endpoints:   all four GETs 200 and schema-valid before any UI was built
  instruments: 11 types, no Add button; Long term set manual only -> automation switched off and
               locked; minimum quantity 0 -> "Must be above zero"; settlement override field
               appears; saved v2 "manual only"; v1 diff showed exactly Automation permitted,
               Manual only and Settlement; revert made v3 with automation permitted again
  currencies:  USD (base) healthy, INR "30 bps to convert into it; 1 held"; USD's Enabled switch
               locked; INR shows "Converting 10,000 USD into INR is assumed to cost $30.00";
               fallback = main source -> inline error; base changed to INR with a reason -> v2,
               list relabelled INR (base) and USD's health refreshed; disabling INR from the list
               -> "INR is the base currency; choose another base currency before disabling it"
  alerts:      critical rule "Needs attention: Webhook failed its last test (+1 more)"; test
               alert passed push, SMS and email, failed webhook with 502; escalation only to
               channels already used -> inline error; start = end quiet hours -> inline error;
               override off saved v3 with the held-critical warning added (+2 more); a new rule
               "Weekly summary" was added
  states:      loading-error on all three pages -> "... unavailable" with the failing path; reset
               to healthy
  markets:     re-verified the moved TimeField: session 1 opens 17:00 -> "A session must end
               after it starts" and Unsaved changes
  NOT verified in the browser: the blocking-error summary when adding an alert rule with no
  channel (my script pressed the list's Add rule button instead of the save button); the same
  summary is verified on markets and providers and is the shared ConfigSaveCard

MISTAKES THIS SESSION (recorded per rules section 7):
  - The first alert health rule for held critical alerts was a tangle of conditions that could
    never be true as intended; replaced with one clear condition before any UI used it
  - The list endpoint factory first passed unknown data to HttpResponse.json, which does not
    typecheck; it now serialises the validated data

FINDINGS (out of scope, not fixed):
  - PROVISIONAL (see start entry): no instrument type is seeded manual-only because no manual-only
    type exists in the mock data (M-16)
  - None of these settings are read by the rest of the app yet: the top bar base currency switch,
    backtest FX costs, conversion charges on holdings and alert delivery all use their own seeds
  - An alert channel test run on System Health updates that screen only; alert rule health reads
    the seeded last test
  - Long-term can be made manual only while brokers still automate it; the layered view belongs to
    S-29 (automation permission summary)
  - /settings/alerts rendered the Alerts Centre page before this session; the Alerts Centre itself
    is S-22 and still has its own route
  - Providers, brokers and markets still use their own handler and hook files; moving them onto the
    factories is a separate refactor
────────────────────────────────────────────────────────────

────────────────────────────────────────────────────────────
SESSION:        41 — START ENTRY
AGENT:          Claude Opus 5 (claude-opus-5)
START:          2026-09-16T21:42:11Z  |  local: 2026-09-17 03:12 IST (UTC+05:30)
TASK CLAIMED:   S-19 News & Events
OWNER INPUT:    "Try to complete the remaining pending S items one by one"; decision 26

PRE-WORK VERIFICATION:
  git:         S-18 committed as 9dd4302; working tree clean
  type check:  PASS, ESLint: PASS, build: PASS (run immediately before the S-18 commit; nothing has
               changed since)

SCOPE (UI spec 7.6):
  - Live feed: newest first; headline, source, time, affected instruments, category, sentiment with
    confidence, importance; filters by market, country, instrument, category, sentiment,
    importance and held only; emphasis for news on holdings; duplicate stories grouped and
    collapsible with a source count; expanding shows the summary and a price reaction chart
    around publication
  - Calendar: month, week and day layouts; events marked by category and importance; restriction
    window marked; held-only filter
  - Sentiment always shows its confidence and is styled apart from confirmed facts
  - Mock data: every story was published at the same instant and no story touched AAPL, AZN or
    gold, so publication times are spread over recent days and stories on held instruments are
    added. Calendar events gain an optional instrument so "held only" can work. Existing ids and
    stories are kept.
  - Stale: under the stale-data scenario the feed ages, and a banner appears when the newest story
    is older than the news provider's freshness expectation (15 minutes, S-16 seed)
  - Remaining S tasks will follow one at a time. S-26 Screener has no specification (open
    question 11, "do not build until specified"); it will be marked BLOCKED rather than invented.
────────────────────────────────────────────────────────────

────────────────────────────────────────────────────────────
SESSION:        41 — END ENTRY
AGENT:          Claude Opus 5 (claude-opus-5)
END:            2026-09-16T22:25:00Z  |  local: 2026-09-17 03:55 IST (UTC+05:30)
TASK:           S-19 News & Events — DONE

WHAT WAS BUILT (UI spec 7.6):
  Live feed (/news/feed):
  - Stories newest first; reports of the same story grouped with "and N more sources", expandable
    to every report; headline, source, relative time (full time on hover), instrument chips,
    category, importance, and holdings marked with a Held badge and a leading edge
  - Sentiment is always "Estimated sentiment: Bearish · 71% confidence" in a dashed, italic pill,
    apart from the solid fact badges; an unconfirmed report is labelled as such
  - Filters: market, country, instrument, category, sentiment, importance (medium or high, high
    only), held only; no-results state with clear filters
  - Expanding shows the summary, all reports, and the price reaction: daily bars before and after
    publication with the publication day marked and the move stated in words
  - Stale banner when the newest story is older than the news provider's freshness expectation, read
    from the provider configuration (S-16) — the first screen to use saved configuration
  Calendar (/news/calendar):
  - Month, week and day layouts with previous, today and next; clicking a date opens its day
  - Impact shown by a coloured edge and in words; category in words; events inside a trading
    restriction window have a dashed outline and say so; held instruments are named
  - Held-only filter; empty message per range

MOCK DATA:
  - Every story had been published at the same instant; stories are now dated minutes to days
    before the request, so the feed has an order and the stale-data scenario can age it by 3 hours
  - Added 8 stories (a three-source Apple story, AstraZeneca, gold, SPY, a second Reliance report
    grouped with the first, RBI minutes) so holdings have news; existing ids kept
  - Calendar events may name an instrument (optional instrumentId); 6 events added for held
    instruments and major releases; calendarEvents.ts split out of newsEvents.ts (line limit)

FILES CREATED:
  - features/news/{News.module.scss, model/newsFeed.ts, model/calendarModel.ts}
  - features/news/sections/{NewsFeedView,NewsFilterBar,NewsStoryCard,PriceReaction,CalendarView,
    CalendarEventItem}.tsx
  - data/mock/generators/calendarEvents.ts
FILES MODIFIED:
  - features/news/{NewsFeedPage,NewsCalendarPage}.tsx — rewritten from placeholders
  - data/schemas/news.ts (optional instrumentId); data/mock/generators/{newsEvents,index}.ts;
    data/mock/handlers/newsHandlers.ts
  - Docs: session 38 moved verbatim to PROGRESS_ARCHIVE.md (rule 11)

DEPENDENCIES ADDED:
  - none

DECISIONS MADE:
  - none

VERIFICATION RUN:
  type check:  PASS — exit 0
  lint:        ESLint PASS; Prettier --check PASS on every changed file (CRLF finding unchanged)
  build:       PASS — exit 0
  feed:        "14 reports in 10 stories · 7 about holdings"; newest is the Fed story (Bloomberg and
               1 more source, 12m ago, SPY held); the Apple story shows "Financial Times and 2 more
               sources"; expanding it listed all three reports and drew the reaction chart with
               "AAPL moved -0.79% ... The reaction is still forming"
  filters:     high importance 4 stories; high and bearish 1; held only 7; India 2; earnings in IN
               -> "No stories match these filters"
  states:      stale-data -> banner "newest story is 3 h old; news is expected within 15 min";
               loading-error -> "News unavailable" and "Calendar unavailable"; reset to healthy
  calendar:    September 2026 month grid, 7 events, 2 in restriction windows, today marked; held
               only -> 2 events; week of 14 September with details; next month October with 4
               events; clicking 29 October opened the day with "Apple Q4 Earnings ... AAPL (held)
               ... Inside a trading restriction window"
  regression:  Overview still shows news and the FOMC event with no unavailable sections

MISTAKES THIS SESSION (recorded per rules section 7):
  - The first stale banner put an explanation in StaleState's "Last update" slot, which read
    "Last update: The news provider is expected..."; it now shows the newest story's time there
  - The first month-range loop had contradictory stop conditions; replaced with a range from the
    week of the 1st to the week of the last day

FINDINGS (out of scope, not fixed):
  - Restriction windows are a fixed flag on each event; nothing configures them yet (S-33)
  - News only has daily prices around publication; an intraday reaction needs intraday history
  - The feed is not live-pushed; it refreshes when the query refetches
  - Calendar dates are UTC calendar dates, not each market's local date
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
 