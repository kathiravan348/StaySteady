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
PHASE:              Stage R complete. Polish (Stage P) and F-22 remain
OVERALL PROGRESS:   94% (102 of 108 active tasks done; Stage F 11 of 12; Stage M 17 of 17;
                    Stage L 14 of 14; Stage S 36 of 36; Stage E 9 of 9; Stage R 15 of 15; Stage P 0 of 5)
LAST UPDATED:       2026-09-18T06:35:00Z  |  local: 2026-09-18 12:05 IST
LAST AGENT:         Claude Opus 5 (session 92)
BUILD STATE:        PASS (pnpm build, session 92)
TYPE CHECK:         PASS (pnpm typecheck, zero errors across all workspaces)
LINT:               PASS (pnpm lint: eslint . and prettier --check . over the whole repository)
VISUAL:             PASS (pnpm visual 14/14, no rebaseline needed)
BLOCKERS:           none. Stage P waits for the owner; open questions 26 and 28 are unanswered.
```

---

## 2. Handoff Note — Read This First

> Rewritten completely at the end of every session. Written for an agent with no memory of any previous session.

```
WHERE THINGS STAND:
  pnpm workspace monorepo, git branch main. Stages M, L, S, E and R are DONE. The Company Research
  screen at /markets/company/:instrumentId has five tabs: Overview, Financials, Ratios (with peer
  comparison), Ownership (pattern over time, pledge, insider dealings, group structure, fund
  look-through) and News & events (instrument feed). Research is surfaced on the workspace right
  panel and Position Detail (shared CompanySummaryCard) and in the News feed filters.

WHAT SESSION 92 ADDED (details in section 4):
  - R-09 Ratios tab; usePeerFundamentalMeasures.
  - R-10 Ownership tab; insider dealings on the ownership record (insiderTransactions.ts).
  - R-11 GET /api/v1/instruments/:id/feed (instrumentFeed.ts, instrument-feed.ts schema,
    useInstrumentFeed); news items may carry relatedGroupIds / relatedIndustryIds.
  - R-12 CompanySummaryCard in shared/ui; filings and results markers on the workspace chart;
    sector, industry and group filters on the News feed (features/news/model/newsPlacement.ts).
  - R-13 screener statement factors and filters, read through measuresFor.
  - R-14 fixed with R-12; R-15 shares no longer scale with the statement basis.
  - Sessions 66 to 89 archived (rule 11). Decision 55 appended.

EXACT NEXT STEP (one task per session, in this order):
  1. Ask the owner about open questions 26 (fundamentals as strategy rule operands) and 28
     (standalone margins and leverage). Either answer raises a small new task.
  2. P-05 split files over 300 lines, then P-01..P-04 when the owner asks for polish.
  3. F-22 (Node 22, ESLint 10, Vite 7) last.

WATCH OUT FOR:
  - Every ratio comes from shared/fundamentals through measuresFor or the measures endpoint. Do not
    compute one in a component or a generator; the screener and research screen must agree.
  - A company with statements is priced off statementsForSymbol(...).instrument everywhere
    (screener included). A second price series for one symbol is the incoherence R-13 removed.
  - Announced corporate actions live in instrumentFeedSeeds.ts, not the corporate action register,
    so they never feed income or holdings. Move one into the register only once it is effective.
  - The next blackout on the feed follows the eligibility check's appliesToAll rule, which also
    covers gold and crypto; change both together or neither.
  - Python edit scripts that write a file several times can leave Vite serving a half-applied
    module. Touch the files and reload before concluding a feature is broken.
  - The Bash tool mangles heredocs containing quotes and backticks, and a grep pattern containing
    non-ASCII characters (box drawing, arrows, ticks) breaks the shell. Write edit scripts to the
    scratchpad with the file-writing tool and run them; keep shell patterns ASCII.
  - Browser pane: after handler changes, do a full navigation (not pushState) or MSW keeps stale
    handlers and returns 404. The scenario switcher is the second footer select; set it with the
    native value setter and a change event, and set it back to healthy afterwards.
  - Charts need plain numbers; convert money once for display through decimal arithmetic. Never
    Number()/parseFloat a money amount that is then displayed as money.
  - Statements are generated, not stored: a seed change moves every period. Standalone is
    consolidated scaled by one factor (open question 28); shares are the same on both bases.
  - Sector and industry have one source: classificationAssignments.ts through the taxonomy
    (industry ids are ind-<slug>). A new symbol needs an entry there.
  - Exposure counts funds by look-through (decision 51); Overview and Planning show a fund as its
    asset class. Deliberate; do not change one to match the other.
  - Ownership percentages add to 100; a pledge needs a promoter holding; promoter null means not
    reported, which differs from zero. Insider dealings are collected for IN and US only.
  - Do not mark a task DONE because the UI renders. Every section fetches through data/api hooks and
    renders loading, empty, error and stale states.
  - Run the full pnpm lint (repo-wide). Strict 300-line limit per file (decision 18); split first.
    ScreenerResultsTable.tsx is at 285 and WorkspaceView.tsx at 289.
  - Library component props: check packages/ui/src/index.ts. Badge variants: neutral, positive,
    negative, warning, critical, info. StaleState takes ageText, lastUpdated, isBanner, onRefresh.
  - Screens fetch only through data/api hooks (decision 22); shared mock state lives in
    data/mock/stores (decision 37); features never import each other (decision 25).
  - A generator passing values into a schema needs the z.input shape, not the output type.
  - packages/ui must NEVER import from apps/web or domain DTOs.
  - Open findings: screenerGenerator.ts non-null assertions in the older filters; configuration is
    not read by the rest of the app; the kill switch has no confirmation or record; chart theme
    colours hardcoded hex; single large JS chunk (P-04); Node 20.11 blocks ESLint 10 and Vite 7.
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
| F-22 | Upgrade Node to 22 LTS, then ESLint 10 and Vite 7 | TODO | 0 | | Owner Q7/Q8 session 64: yes, very low priority. Do last |
 
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
| M-16 | Manual-only instrument type in mock data | DONE | 100 | Session 69 | Raised session 36. Instrument type unlisted, seeded manual-only with automation off; the private secured note holding uses it; verified session 69 |
| M-17 | Mock data for Requirements Part II | DONE | 100 | Session 60 | Raised session 37. UI spec 19.4: non-market assets (one stale, one never verified), a liability, partly-vested employer equity, a restricted instrument and active blackout window, manual trades with stated reasons and known outcomes incl. one poor decision, an over-weight counterparty, a decayed and demoted strategy, historical inflation for two countries, losses carried forward with differing expiry, dividends with tax withheld. **Session 60:** first seven were already seeded and verified; added inflation history (US/IN/GB), losses carried forward, counterparty profiles with a 25% over-weight threshold (IBKR 28%), strategy lifecycles with the RSI demotion; four read-only endpoints and hooks |
 
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
| L-12 | Visual regression test setup | DONE | 100 | Claude Opus 5 | Session 81: Playwright 1.49.1 baselines for 7 key screens in dark and light (visual/), pnpm visual, local only |
| L-13 | Analytical chart presets — remaining spec 8.1 types | DONE | 100 | Claude Opus 5 | Session 80: eight presets (distribution, treemap, stacked area, correlation, rolling, bar, waterfall, scatter) with stories; props are a preset/data union |
| L-14 | Partial-data state component | DONE | 100 | Claude Opus 5 | Session 79: PartialDataState in packages/ui with story; used by holdings and position detail |
 
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
| S-23 | Audit Log | DONE | 100 | Session 45 | Audit log rebuilt from real records (configuration versions with field-level before/after, risk changes, order lifecycles with decision reasons, strategy versions and stages); search, type/trigger/date filters; decision chain trace from signal to fill; stage promotion dates provisional |
| S-24 | Portfolio — Transactions | DONE | 100 | Session 46 | Transaction history with fees, signed cash effect and base-currency amounts at each transaction date's rate; conversion charges linked to their purchases; totals by type; filters by type, instrument, broker, currency and date; CSV export; all states verified |
| S-25 | Portfolio — Performance | DONE | 100 | Session 47 | Open question 9 answered provisionally (decision 26): at-a-glance view, the report keeps chosen periods, comparisons, export and schedules. Returns and gain for 1M/3M/YTD/1Y/since first purchase from the report builder, value curve, monthly heatmap, contribution by holding; all states incl. stale verified |
| S-26 | Markets — Screener | DONE | 100 | Session 56; fixed session 61 | Raised session 36. Unblocked session 56 (Open Question 11 answered). Multi-factor screener across 4 pillars (Quality, Valuation, Technical Momentum, and Compliance/Automation readiness) with 5 presets, CSV export, and workflow handoffs. **Audit session 59:** compliance status and automation permission are fixed seed values, not read from the compliance store or automation configuration; INFY is restricted on /compliance but ALLOWED in the screener. Open question 11 was answered by an agent, not the owner (see question 19) **Session 61:** compliance status and automation permission now derived per request from the compliance store and saved configurations (decision 42); verified |
| S-27 | Trading — Positions | DONE | 100 | Session 49 | Open question 10 answered provisionally (decision 26): distinct from Holdings — only strategy-opened positions, with what the strategy stage does at the stop, distance and value lost to the stop, rules, working orders and an attention banner; all states verified |
| S-28 | Configuration — credentials | DONE | 100 | Session 50 | Register of credential references on the configuration pattern: no secret field, key-as-reference rejected, /simulation/ segment separates simulation from live, read-only or trading access, expiry with warnings, revoke, usage from provider and broker configs, unregistered references called out, audit log; verified |
| S-29 | Automation permission summary | DONE | 100 | Session 51 | /settings/automation: market by instrument type grid (live, simulation or blocked with the blocking layer; every layer on selection) and per-strategy results by instrument, computed from the saved configurations and strategy stages; linked from the side navigation; verified |
| S-30 | Net Worth — complete picture incl. non-market assets | DONE | 100 | Session 52 | /net-worth: totals with market-exposed and non-market, manual register across every requirements-25 category (stale as normal, unverified separate), record valuation and add, liquidity, concentration against total net worth, employer equity plus salary as one exposure, read-only notice; feeding allocation, goals and risk left to 19.2 extensions; verified |
| S-31 | Decision Journal | DONE | 100 | Session 53 | Raised session 37. Requirements 29, UI spec 19.1. Reason captured at the time of every manual trade and override, outcome attached later, behaviour patterns surfaced (override repetition, post-loss clustering, target drift); verified |
| S-32 | Continuity — succession, nominee and emergency access | DONE | 100 | Session 54 | Raised session 37. Requirements 28, UI spec 19.1. Institution register with one-click confirmation, recovery points without credentials, emergency drill playbook and log, inactivity pause countdown; verified |
| S-33 | Compliance — employer and jurisdictional restrictions | DONE | 100 | Session 55 | Raised session 37. Requirements 27, UI spec 19.1. Restricted list, blackout windows, pre-clearance, minimum holding periods, pre-trade eligibility checker ("May I trade this right now, and why not?"), refusals log intercepted at signal stage; verified |
| S-34 | Screener factors from price history and fundamentals | DONE | 100 | Session 78 | Owner Q19 session 64. Price, change, RSI-14 and SMA-200 distance from mock price history; P/E and yield from fundamentals where covered; P/B, ROE and market cap remain seeded (no source); verified session 78 |
| S-35 | Portfolio Performance links to the full performance report | DONE | 100 | Session 76 | Owner Q9 session 64. Each period links to the performance report opened on the same dates; verified session 76 |
| S-36 | Continuity — backup nominee and drill schedule | DONE | 100 | Session 77 | Owner Q17 session 64. Backup view-only nominee and a 6 to 12 month drill schedule with next due date, editable and validated; verified session 77 |
 
### Stage E — Requirements Part II Extensions To Existing Screens
 
Raised session 37. Each extends a screen that is already built, so each is small on its own but must
not be folded silently into an unrelated task. See UI spec 19.2.
 
| ID | Task | Status | % | Agent | Notes |
|----|------|--------|---|-------|-------|
| E-01 | Holdings — liquidity class; non-market assets in totals | DONE | 100 | Session 57; reworked session 70 | Requirements 25, 30; UI spec 19.2. Liquidity class per position (days, weeks, months or longer) from settlement and manual-only types, column and summary; non-market assets excluded (decision 44); verified session 70 |
| E-02 | Position Detail — tax category, holding-period boundary, cost of disposing today | DONE | 100 | Session 57; reworked session 67 | Requirements 26, 30; UI spec 19.2. Lot treatment and days to long term from the residence tax rule set; cost of disposing today with market fees, purchase-date FX, loss netting, carried-forward losses and exemption; verified session 67 |
| E-03 | Orders & Approval Queue — compliance result, cooling-off countdown, reason prompt | DONE | 100 | Session 57; reworked sessions 63, 65 | Requirements 27, 29, 33; UI spec 19.2. Approval queue: real compliance result beside risk checks, cooling off after approval with withdraw, stated reason; enforced by the server; safeguards configurable. Orders: compliance for working orders, restricted alert, cooling-off badge. Verified sessions 63 and 65 |
| E-04 | Risk & Safety — counterparty exposure; compliance limits shown beside risk limits | DONE | 100 | Session 57; reworked session 71 | Requirements 27, 32; UI spec 19.2. Counterparty share of the traded portfolio from holdings with over-weight flag and protection cover; compliance limits from the compliance record; loading/error/empty states; verified session 71 |
| E-05 | System Health — independent depository/registrar reconciliation status | DONE | 100 | Session 57; reworked session 72 | Requirements 31, 32; UI spec 19.2; decision 45. Reconciliation against depository statements per broker with a seeded mismatch; mismatch raises a critical alert and pauses approvals for that broker until resolved with a reason; verified session 72 |
| E-06 | Reports — real returns, per-jurisdiction tax pack, cost and tax as share of gross return | DONE | 100 | Session 57; reworked session 68 | Requirements 26, 30, 31; UI spec 19.2. Real return and real benchmark from recorded inflation or assumption; costs and tax as share of gross gain; tax pack for the residence country (gains by asset class, income with withholding and foreign tax credit, losses carried forward, foreign holdings, remittance cap); verified session 68 |
| E-07 | Planning — emergency reserve, liquidity ladder, commitments, withdrawal phase, ranged projections | DONE | 100 | Session 57; reworked session 73 | Requirements 29, 30, 31; UI spec 19.2; owner Q18. Emergency reserve apart from trading cash, liquidity ladder, commitments against reachable liquidity, withdrawal phase, automation ceiling; ranged projections offer the saved inflation assumption; verified session 73 |
| E-08 | Strategy Library — retirement criteria, standing against them, demotion history, cross-correlation | DONE | 100 | Session 57; reworked session 74 | Requirements 28, 33; UI spec 19.2. Criteria set at promotion, standing measured from each strategy's positions (or at demotion), review due dates, demotion history, correlation of daily returns; verified session 74 |
| E-09 | Configuration — tax rule sets, inflation assumptions, employer policy, export, cost budget | DONE | 100 | Session 57; parts a/b/c sessions 62, 66, 75 | Requirements 26, 27, 30, 34; UI spec 19.2. Inflation assumptions, cost budget, counterparty threshold, decision safeguards and export (/settings/assumptions); tax rule sets per residence country and asset class (/settings/tax-rules, decision 45); employer policy as configuration read by the eligibility check (decision 43); verified sessions 62, 66, 75 |
 
### Stage P — Polish
 
| ID | Task | Status | % | Agent | Notes |
|----|------|--------|---|-------|-------|
| P-01 | Responsive pass | TODO | 0 | | |
| P-02 | Accessibility pass | TODO | 0 | | |
| P-03 | Full state review across all screens | TODO | 0 | | |
| P-04 | Performance and bundle budget | TODO | 0 | | |
| P-05 | Split the files over 300 lines (decision 18) | TODO | 0 | | Raised session 59: strategyEditor/sections/SettingsSections.tsx 386, trading/orders/sections/OrdersView.tsx 337, shell/TopBar.module.scss 337, health/Health.module.scss 307, markets/watchlists/sections/WatchlistsView.tsx 301, markets/workspace/WorkspacePage.module.scss 301 |


### Stage R — Company Research (Requirements Part III, added session 83)

Requirements 35-38 and UI spec section 20. R-01 to R-03 come first: they unblock features that are
already built but cannot work without classification.

| ID | Task | Status | % | Agent | Notes |
|----|------|--------|---|-------|-------|
| R-01 | Classification and corporate structure — one taxonomy (sector, industry), parent, business group, listed siblings, ownership pattern; schema, generator and endpoints | DONE | 100 | Claude Opus 5 (session 84) | Requirements 36; decisions 49, 51. Replaces the SECTORS map in researchData.ts and the screener seeds' free-text sectors |
| R-02 | Classification wired into the screens that already need it — Overview sector allocation, Holdings sector/industry/group columns and grouping, Planning sector targets, Screener shared sector list | DONE | 100 | Claude Opus 5 (session 85) | UI spec 20.2. Fixes AllocationSection.tsx "not in the data yet" and the Planning/Screener name mismatch |
| R-03 | Group exposure and fund look-through — group limit beside the sector limit on Risk & Safety, both counting exposure held through funds | DONE | 100 | Claude Opus 5 (session 86) | Requirements 36; decision 51. Makes riskLimits.ts "global-sector" measurable |
| R-04 | Company research record — profile, business description, segment and geography revenue, key people, auditor; schema, generator, endpoint | DONE | 100 | Claude Opus 5 (session 87) | Requirements 35 |
| R-05 | Financial statements — schema and coherent generator: five years annual, eight quarters interim, consolidated and standalone, publication and restatement dates | DONE | 100 | Claude Opus 5 (session 88) | Requirements 37; decision 50. Must tie to price history (decision 19) |
| R-06 | shared/fundamentals — derived measures, industry medians and warning flags as pure decimal.js functions over the stored statements | DONE | 100 | Claude Opus 5 (session 89) | Requirements 37; decision 53. Mirrors shared/indicators (decision 30) |
| R-07 | Company Research screen shell and Overview tab — profile, classification and group, size, headline measures against the industry median, open warning flags, next scheduled event | DONE | 100 | Claude Opus 5 (session 90) | UI spec 20.1 |
| R-08 | Financials tab — three statements, annual/quarterly and consolidated/standalone toggles, five periods with change per line, trend charts from existing presets | DONE | 100 | Claude Opus 5 (session 91) | UI spec 20.1 |
| R-09 | Ratios tab — valuation, profitability, health, growth, cash quality, each with own trend, industry median and visible inputs; peer comparison | DONE | 100 | Claude Opus 5 (session 92) | UI spec 20.1. Standalone ratios equal consolidated: R-05 generator finding (session 92) |
| R-10 | Ownership tab — ownership over time, promoter pledge trend, insider transactions, group structure list with holdings marked | DONE | 100 | Claude Opus 5 (session 92) | UI spec 20.1; requirements 36 |
| R-11 | News, events and filings tab — instrument feed with indirect (parent/group/peer) items marked, filings, corporate actions effective vs announced, forward event strip with restriction windows | DONE | 100 | Claude Opus 5 (session 92) | Requirements 38; UI spec 20.1 |
| R-12 | Surfacing across existing screens — Workspace right-panel summary and link, Position Detail company card, News & Events group and sector filters | DONE | 100 | Claude Opus 5 (session 92) | UI spec 20.2 |
| R-13 | Screener factors from statements — debt to equity, return on capital employed, growth, cash quality | DONE | 100 | Claude Opus 5 (session 92) | UI spec 20.2; extends S-34 |
| R-14 | Fix: market cap formatted with Number() in features/markets/workspace/sections/ResearchSections.tsx | DONE | 100 | Claude Opus 5 (session 92) | Fixed with R-12: row moved to the company summary card. Finding session 83; breaks decision 4 (money is never a plain number) |
| R-15 | Fix: standalone statements scale shares outstanding with the basis, so standalone ratios equal consolidated (financialStatementBuild.ts) | DONE | 100 | Claude Opus 5 (session 92) | Finding session 92; UI spec 20.4 |

### Stage T — Strategy Authoring (added session 93)

Owner validation session 93: a strategy could not be created. The library had no create action and
no edit link, the editor only saved to sessionStorage, and backtests returned a canned result.

| ID | Task | Status | % | Agent | Notes |
|----|------|--------|---|-------|-------|
| T-01 | Strategy write API and mock store — create (blank, template, duplicate), save a version with a bumped number; library, strategy list and Backtest Setup read the stored definitions | DONE | 100 | Claude Opus 5 (session 93) | Owner item 2 |
| T-02 | Entry points — New strategy and Duplicate on the library, Edit on every card, create dialog; name, description and timeframe editable in the editor | TODO | 0 | | Owner item 1 |
| T-03 | Seed and validation fixes — seeded scope markets and types, the RSI volume rule, a validation issue for volume compared against a price-scale operand | TODO | 0 | | Owner item 3 |
| T-04 | Simpler editor — starter templates, plain-English summary per condition, indicator range hints, instruments filtered by chosen markets, non-conflicting default exit | TODO | 0 | | Owner item 4 |
| T-05 | Fundamentals as optional rule operands (P/E, P/B, ROE, debt to equity, ...) through shared/fundamentals, point in time by publication date | TODO | 0 | | Open question 26 answered session 93 |
| T-06 | Rule-driven backtest results — a run evaluates the strategy's own rules over price history instead of mapping to a saved result | TODO | 0 | | Owner item 5 |
 
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

> Sessions 0 to 89 have been archived to [PROGRESS_ARCHIVE.md](./PROGRESS_ARCHIVE.md).
> Only the last three sessions are kept here, per rule 11. Open the archive only when you need
> a specific past session - it is not session-start reading.

```
────────────────────────────────────────────────────────────
SESSION 90 | Claude Opus 5
START:          2026-09-18T07:40:00Z  |  local: 2026-09-18 13:10 IST
END:            2026-09-18T09:00:00Z  |  local: 2026-09-18 14:30 IST
TASK CLAIMED:   R-07 Company Research screen shell and Overview tab
END STATUS:     DONE
REASON IF NOT DONE: --

COMPLETED:
  - Route /markets/company/:instrumentId (ROUTES.MARKETS_COMPANY, companyResearchPath) wired into
    AppRoutes, with a Tabs shell so later tabs drop in beside Overview.
  - ProfileSection: business description, listings, headquarters, employees, reporting currency and
    fiscal year end, ISIN, executives with an appointment in the last year called out, the auditor
    with a qualified opinion shown as critical, revenue by segment and by geography as labelled
    bars that say how much of revenue the reported lines cover, and what the business depends on.
  - StandingSection: sector and industry, business group, parent with the share held, listed
    relatives linking to their own research page, market value, and five headline measures each
    beside its industry median and peer count.
  - FlagsSection: warning flags with their evidence, an empty state that says nothing was flagged
    and that this is not a recommendation, and a line stating that no flag is advice (decision 52).
  - Each section owns its loading, error (with retry), unavailable and empty states.

NOT COMPLETED / LIMITS:
  - Only the Overview tab exists; Financials, Ratios, Ownership and News are R-08 to R-11.
  - Nothing links to the screen yet except by URL; R-12 adds the entry points from the workspace,
    the screener, Holdings and Position Detail.
  - The "next scheduled event" the spec lists for Overview waits for R-11, where the events data is
    brought in.

VERIFICATION RUN:
  pnpm typecheck PASS; pnpm lint PASS (repo-wide); pnpm build PASS; pnpm visual 14/14 PASS (the new
  screen has no baseline yet; that belongs with the finished tab set).
  In the browser against the dev server: Tata Motors renders the full Overview with its Jaguar Land
  Rover segment at 66.8%, the Tata group and Tata Sons at 42.6%, market value 5.06LCr, price to
  earnings 18.9x against an industry median of 30.4x over two peers, and the rising promoter pledge
  flag with its evidence; Swiggy shows "no provider has supplied a company record yet" while still
  showing classification and measures; gold answers that no company sits behind it; an unknown
  instrument shows the empty state with a link to the screener; under the loading-error scenario
  each of the three sections shows its own error with a retry rather than blanking the page.

FILES: created apps/web/src/features/markets/company/{CompanyResearchPage.tsx,
CompanyResearch.module.scss,sections/ProfileSection.tsx,sections/StandingSection.tsx,
sections/FlagsSection.tsx}; modified apps/web/src/routes/{routes.ts,AppRoutes.tsx},
Docs/PROGRESS_LOG.md.
────────────────────────────────────────────────────────────
```

```
────────────────────────────────────────────────────────────
SESSION 91 | Claude Opus 5
START:          2026-09-18T09:05:00Z  |  local: 2026-09-18 14:35 IST
END:            2026-09-18T10:00:00Z  |  local: 2026-09-18 15:30 IST
TASK CLAIMED:   R-08 Financials tab
END STATUS:     DONE
REASON IF NOT DONE: --

COMPLETED:
  - Income statement, balance sheet and cash flow as tables, five periods side by side, with the
    change per line against the period before and each column headed by its fiscal period, period
    end and publication date (decision 50 made visible).
  - Annual and quarterly toggle; consolidated and standalone toggle shown only where basesAvailable
    says the company publishes both, with the note explaining that they are not interchangeable.
  - A restatement banner naming the period and what was restated.
  - Revenue with net profit, and free cash flow, as bar charts from the existing presets; money
    converts to chart numbers once through decimal arithmetic, for display only.
  - Loading, error with retry, and a plain explanation when a company has no statements.

VERIFICATION RUN:
  pnpm typecheck PASS; pnpm lint PASS (repo-wide); pnpm build PASS. In the browser against the dev
  server, Tata Motors: the income statement reads revenue 4.4LCr with net profit 26.83KCr and a
  +9.20% change, each column carrying its publication date 14 June; switching to standalone drops
  revenue to 1.45LCr, which is the point of keeping the two apart; switching to quarterly shows
  Q1 FY2027 back to Q1 FY2026 with publication dates 45 days after each period end.

FILES: created apps/web/src/features/markets/company/model/statementTables.ts,
apps/web/src/features/markets/company/sections/FinancialsTab.tsx;
modified apps/web/src/features/markets/company/{CompanyResearchPage.tsx,
CompanyResearch.module.scss}, Docs/PROGRESS_LOG.md.
────────────────────────────────────────────────────────────
```

```
────────────────────────────────────────────────────────────
SESSION 92 | Claude Opus 5 | SESSION START
START:          2026-09-18T03:20:00Z (system clock)  |  local: 2026-09-18 08:50 IST
TASK CLAIMED:   R-09 Ratios tab
NOTE:           Owner asked for the whole pending Stage R (R-09 to R-14). Each task is claimed and
                closed in turn, one at a time, each with its own entry. The system clock reads earlier
                than session 91's recorded end time; the times below are the system clock's.
START CHECKS:   pnpm typecheck PASS; pnpm lint PASS.
────────────────────────────────────────────────────────────
```

```
────────────────────────────────────────────────────────────
SESSION 92 | Claude Opus 5 | R-09 END
END:            2026-09-18T03:36:00Z  |  local: 2026-09-18 09:06 IST
TASK CLAIMED:   R-09 Ratios tab
END STATUS:     DONE

COMPLETED:
  - Ratios tab: measures grouped as valuation, profitability, financial health, growth and cash
    quality, one table each. Every row has the latest value, a trend sparkline over the reported
    years, the industry median with its peer count, a neutral standing (above/below/near median,
    never better or worse; decision 52) and the inputs and periods behind it in a disclosure.
  - Consolidated/standalone toggle where both are published; "as reported to" badge; the valuation
    note from the endpoint.
  - Peer comparison: the company and each industry peer with measures on the same basis, grouped the
    same way, each peer linking to its own research screen. Loads and fails on its own.
  - usePeerFundamentalMeasures in data/api (useQueries, same cache key as useFundamentalMeasures).
  - No ratio is computed in the UI; model/ratioRows.ts only groups and orders endpoint values.

VERIFICATION RUN:
  pnpm typecheck PASS; pnpm lint PASS (repo-wide); pnpm build PASS. In the browser: Tata Motors
  shows P/E 18.7x against an industry median of 30.9x over two peers, inputs "Price 1366.78 over
  earnings per share 72.91 (FY2026)", sparklines on non-valuation measures, and a peer table with
  7203 and TSLA. Standalone shows no medians and the peer empty message (no peer publishes
  standalone). TCS shows the no-peer empty message; gold shows "no company sits behind this
  instrument"; loading-error shows the tab's error with retry. Light theme checked.

FINDINGS (out of scope, not fixed):
  - R-05 generator: financialStatementBuild.ts scales every line AND sharesOutstanding by
    standaloneShareOfRevenue for the standalone basis, so every ratio on standalone equals the
    consolidated one (Tata Motors ROE 17.55 on both). Shares outstanding belong to the listed entity
    and do not change with basis; UI spec 20.4 wants the two to "genuinely differ". Raised as R-15.
  - Valuation measures have no history by design (fundamentalMeasures.ts leaves price out of past
    years), so their trend cell reads "Latest only".

FILES: created features/markets/company/{model/ratioRows.ts,sections/RatiosTab.tsx,
sections/PeerComparison.tsx}; modified data/api/{classificationQueries.ts,index.ts},
features/markets/company/{CompanyResearchPage.tsx,CompanyResearch.module.scss}, Docs/PROGRESS_LOG.md.
────────────────────────────────────────────────────────────
```

```
────────────────────────────────────────────────────────────
SESSION 92 | Claude Opus 5 | R-10 START
START:          2026-09-18T03:38:00Z  |  local: 2026-09-18 09:08 IST
TASK CLAIMED:   R-10 Ownership tab
────────────────────────────────────────────────────────────
```

```
────────────────────────────────────────────────────────────
SESSION 92 | Claude Opus 5 | R-10 END
END:            2026-09-18T04:05:00Z  |  local: 2026-09-18 09:35 IST
TASK CLAIMED:   R-10 Ownership tab
END STATUS:     DONE

COMPLETED:
  - Ownership over time as a stacked area (promoter where reported, foreign and domestic
    institutions, public) from the existing preset, with the endpoint's note and source.
  - Promoter pledge: latest share pledged, a "Rising" badge and explanation when it rose over the
    eight quarters, and a trend line; markets without a promoter block say so rather than show zero.
  - Insider and promoter dealings: new data. InsiderTransactionSchema added to the ownership record
    (reportsInsiderTransactions + insiderTransactions, newest first); generator
    data/mock/generators/insiderTransactions.ts seeds TATAMOTORS (promoter pledges matching the
    rising pledge, a director sale, a pledge release), RELIANCE, AAPL and NVDA. Value is shares
    times the close on the dealing day (decision 19). Collected for IN and US only; elsewhere the
    tab says the absence means nothing.
  - Group structure as an indented list: parent, this company with the parent's share, its
    subsidiaries beneath, group companies beside it; "You hold this" from portfolio holdings and a
    count of group companies held. Hidden for instruments that are not companies.
  - Fund look-through for a fund: top holdings with weights, "Also held directly" marks, sector
    weights donut. Hidden for instruments that are not funds.

VERIFICATION RUN:
  pnpm typecheck PASS; pnpm lint PASS (repo-wide); pnpm build PASS. In the browser: Tata Motors
  shows the stacked area, pledge 9.4% Rising from 2.1% with its chart, four dealings (Tata Sons
  pledged 42,000,000 shares worth 5.39KCr), and Tata Sons > Tata Motors (42.6%, you hold this) >
  Tata Motors Finance, with TCS as a held group company ("you hold 2 of the 4"). AAPL: no promoter
  block, no pledge reported, two officer sales. SPY: nine holdings with Apple "Also held
  directly" and the sector donut, no group structure card. Under loading-error each section shows
  its own error with retry.

FILES: created data/mock/generators/insiderTransactions.ts, features/markets/company/sections/
{OwnershipTab,OwnershipPatternSection,InsiderSection,GroupStructureSection,
FundLookThroughSection}.tsx; modified data/schemas/classification.ts,
data/mock/generators/ownershipPattern.ts, features/markets/company/{CompanyResearchPage.tsx,
CompanyResearch.module.scss}, Docs/PROGRESS_LOG.md.
────────────────────────────────────────────────────────────
```

```
────────────────────────────────────────────────────────────
SESSION 92 | Claude Opus 5 | R-11 START
START:          2026-09-18T04:10:00Z  |  local: 2026-09-18 09:40 IST
TASK CLAIMED:   R-11 News, events and filings tab
NOTE:           Written after reading the news, calendar, corporate action and compliance sources and
                moving PriceReaction to shared/ui; the rule is entry first, recorded honestly here.
────────────────────────────────────────────────────────────
```

```
────────────────────────────────────────────────────────────
SESSION 92 | Claude Opus 5 | R-11 END
END:            2026-09-18T04:50:00Z  |  local: 2026-09-18 10:20 IST
TASK CLAIMED:   R-11 News, events and filings tab
END STATUS:     DONE

COMPLETED:
  - New endpoint GET /api/v1/instruments/:id/feed (schema data/schemas/instrument-feed.ts,
    generator instrumentFeed.ts, hook useInstrumentFeed). News is marked direct, group (a story on
    the parent, a group company or tagged with the group id) or peer (tagged with the industry id or
    naming an industry peer), with what carried it.
  - NewsItemSchema gains optional relatedGroupIds and relatedIndustryIds. newsGroupItems.ts adds the
    UI spec 20.4 stories: Tata Sons borrowing (reaches Tata Motors and TCS only through the group),
    EU tariffs on imported EVs (automobiles-wide), a JLR volumes story and an unattributed rumour.
  - Filings and announced corporate actions seeded in instrumentFeedSeeds.ts. Announced actions are
    kept out of the corporate action register on purpose, so they never feed income or holdings
    until effective; effective ones come from the register, newest first.
  - Calendar: Tata Motors results on 29 Sept inside an automation restriction window, and an
    ex-date on 21 Oct. The next employer blackout is read from the compliance store and respects
    employerPolicy.enabled (decision 43), with the same appliesToAll rule as the eligibility check.
  - Tab: scheduled-ahead strip, news with a direct/indirect filter, reach badges, sentiment as an
    estimate with confidence, rumours labelled as not facts, filings, and actions split into
    announced and effective. Every news item, filing and effective action opens the instrument's
    price around its time.
  - Moved PriceReaction to shared/ui and the news label helpers to shared/format/newsLabels.ts
    (decision 25); features/news re-exports the labels, so its code reads as before.

VERIFICATION RUN:
  pnpm typecheck PASS; pnpm lint PASS (repo-wide); pnpm build PASS; pnpm visual 14/14 PASS.
  In the browser: Tata Motors shows the results date in 11 days marked inside a restriction
  window, the next blackout from 1 Nov, five stories (two direct incl. the rumour, one through the
  Tata group, two industry-wide), five filings and the unconfirmed interim dividend under announced.
  Opening a story draws the price chart with the move since publication. Reliance shows two
  effective actions; gold shows its one story and the empty filings message; loading-error shows
  the tab's error with retry. The News feed screen still renders with the new stories.

FINDINGS (out of scope, not fixed):
  - The seeded all-equities blackout (appliesToAll) also applies to gold and crypto in the
    eligibility check; the feed follows the same rule so the two agree.

FILES: created data/schemas/instrument-feed.ts, data/mock/generators/{instrumentFeed.ts,
instrumentFeedSeeds.ts,newsGroupItems.ts}, shared/format/newsLabels.ts,
shared/ui/PriceReaction.module.scss, features/markets/company/sections/{NewsEventsTab,
FeedNewsList,FeedRecords,FeedSchedule}.tsx; moved features/news/sections/PriceReaction.tsx to
shared/ui/PriceReaction.tsx; modified data/schemas/{news.ts,index.ts},
data/mock/generators/{newsEvents.ts,calendarEvents.ts,index.ts}, data/mock/handlers/newsHandlers.ts,
data/api/{newsQueries.ts,index.ts}, features/news/{model/newsFeed.ts,sections/NewsStoryCard.tsx},
features/markets/company/{CompanyResearchPage.tsx,CompanyResearch.module.scss}.
────────────────────────────────────────────────────────────
```

```
────────────────────────────────────────────────────────────
SESSION 92 | Claude Opus 5 | R-12 START
START:          2026-09-18T04:55:00Z  |  local: 2026-09-18 10:25 IST
TASK CLAIMED:   R-12 Surfacing across existing screens, with R-14 folded in as the handoff note
                directs (it is a one-line fix in ResearchSections.tsx, which R-12 touches)
────────────────────────────────────────────────────────────
```

```
────────────────────────────────────────────────────────────
SESSION 92 | Claude Opus 5 | R-12 AND R-14 END
END:            2026-09-18T05:40:00Z  |  local: 2026-09-18 11:10 IST
TASK CLAIMED:   R-12 Surfacing across existing screens; R-14 market cap Number() fix
END STATUS:     DONE (both)

COMPLETED:
  - shared/ui/CompanySummaryCard (decision 25): classification (or asset class), parent with share,
    business group, the next scheduled event with its restriction-window mark, up to three open
    warning flags with evidence, optional headline measures against the industry median and market
    value, and a link to the research screen. Titled Company, Fund or Asset by kind. Each source
    fails on its own inside the card.
  - Instrument Workspace: the card with measures sits in the right panel. The fundamentals block is
    now "Market figures" (yield, beta, expense ratio, coupon, maturity); sector, market value and
    price to earnings moved to the card, which reads them from the research record. This removes
    the Number()-formatted market cap: R-14 fixed. The fundamentals note text was updated to match.
  - Workspace event markers: filings from the instrument feed ("F"), published results as earnings
    ("E"), and calendar earnings matched by instrumentId where the event carries one.
  - Position Detail: the card (without measures) under the chart.
  - News & Events feed: sector, industry and business-group filters from the shared classification
    (features/news/model/newsPlacement.ts), matching a story through the instruments it names or
    the group or industry it is tagged with. A story naming no holding that reaches one through its
    group gets "Reaches a holding through <group>" and the held emphasis. Classification is
    optional: without it the three filters are hidden and the feed works as before.

VERIFICATION RUN:
  pnpm typecheck PASS; pnpm lint PASS (repo-wide); pnpm build PASS; pnpm visual 14/14 PASS.
  In the browser: workspace TATAMOTORS shows the card (Tata Sons 42.6%, Tata group, 5.03LCr, P/E
  18.7x vs industry 30.9x, results 29 Sept in a restriction window, rising pledge flag) and five
  filing/results markers in the event strip. Position Detail TATAMOTORS shows the card; gold shows
  "Asset class Commodity" and no scheduled event. News feed: group filter Tata group leaves three
  stories, industry Automobiles four; the Tata Sons story carries "Reaches a holding through Tata
  group".

MISTAKE RECORDED:
  - A multi-step python edit script left Vite serving a half-applied newsFeed.ts during
    verification, so the group filter looked broken. Touching the files fixed it; the code was right.

FINDINGS (out of scope, not fixed):
  - researchData.ts (fundamentals endpoint) still computes P/E and market value itself rather than
    through shared/fundamentals (decision 53). No screen shows them now except the screener (S-34);
    worth folding into R-13.

FILES: created shared/ui/{CompanySummaryCard.tsx,CompanySummaryCard.module.scss},
features/news/model/newsPlacement.ts; modified features/markets/workspace/{sections/InfoPanel.tsx,
sections/ResearchSections.tsx,sections/WorkspaceView.tsx,model/chartEvents.ts},
features/portfolio/position/sections/PositionView.tsx, features/news/{NewsFeedPage.tsx,
model/newsFeed.ts,sections/NewsFeedView.tsx,sections/NewsFilterBar.tsx,sections/NewsStoryCard.tsx},
data/mock/generators/researchData.ts, Docs/PROGRESS_LOG.md.
────────────────────────────────────────────────────────────
```

```
────────────────────────────────────────────────────────────
SESSION 92 | Claude Opus 5 | R-13 START
START:          2026-09-18T05:45:00Z  |  local: 2026-09-18 11:15 IST
TASK CLAIMED:   R-13 Screener factors from statements
────────────────────────────────────────────────────────────
```

```
────────────────────────────────────────────────────────────
SESSION 92 | Claude Opus 5 | R-13 END
END:            2026-09-18T06:15:00Z  |  local: 2026-09-18 11:45 IST
TASK CLAIMED:   R-13 Screener factors from statements
END STATUS:     DONE

COMPLETED:
  - ScreenerRow gains debtToEquity, rocePct, revenueGrowth3yPct and cashConversionPct (nullable);
    criteria gain maxDebtToEquity, minRoce, minRevenueGrowth, minCashConversion. ScreenerSeed now
    omits the four, so they can only be derived, never seeded.
  - screenerFactors.ts reads them, and P/E, P/B and ROE, from measuresFor (shared/fundamentals,
    decision 53) wherever statements are collected. Seeded P/E, P/B and ROE stand in only for
    companies without statements. This retires the seeded P/B and ROE noted in S-34 for covered
    companies and resolves the R-12 finding that the screener's P/E bypassed shared/fundamentals.
  - A company with statements is priced off the instrument its statements were generated against
    (statementsForSymbol), so price, P/E and the research screen agree. Before, MSFT priced off a
    separate screener series and showed P/E 5.9x against statements tied to another series.
  - Filters: a new "From reported statements" group (ScreenerStatementFilters.tsx); a company
    without statements cannot pass a set statement filter. Two new sortable columns, Debt / ROCE and
    Growth / Cash, and the four factors in the CSV export. The export moved to model/screenerCsv.ts
    to keep the table under 300 lines.

VERIFICATION RUN:
  pnpm typecheck PASS; pnpm lint PASS (repo-wide); pnpm build PASS; pnpm visual 14/14 PASS.
  In the browser: Reliance D/E 0.44, ROCE 9.9%, 3y growth 8.1%, cash 82%; GOOGL, BRK.B and JPM
  show dashes (no statements collected). Max D/E 0.5 with min ROCE 20% leaves TCS, INFY, MSFT and
  NVDA.

FINDINGS (out of scope, not fixed):
  - Screener prices changed for MSFT, HDFCBANK and INFY (now the statement-tied series). The
    screener is not in the visual baselines, so nothing needed rebaselining.
  - screenerGenerator.ts uses non-null assertions (criteria.minPe!) in the older filters; the new
    filters avoid them. Not fixed (outside the task).

FILES: created features/markets/screener/{model/screenerCsv.ts,
sections/ScreenerStatementFilters.tsx}; modified data/schemas/screener.ts,
data/mock/generators/{screenerFactors,screenerGenerator,screenerSeeds,screenerStatus,
screenerPresets}.ts, features/markets/{MarketsScreenerPage.tsx,screener/Screener.module.scss,
screener/sections/ScreenerFiltersPanel.tsx,screener/sections/ScreenerResultsTable.tsx},
Docs/PROGRESS_LOG.md.
────────────────────────────────────────────────────────────
```

```
────────────────────────────────────────────────────────────
SESSION 92 | Claude Opus 5 | R-15 START
START:          2026-09-18T06:20:00Z  |  local: 2026-09-18 11:50 IST
TASK CLAIMED:   R-15 Standalone statements scale shares outstanding with the basis
────────────────────────────────────────────────────────────
```

```
────────────────────────────────────────────────────────────
SESSION 92 | Claude Opus 5 | R-15 END AND SESSION END
END:            2026-09-18T06:35:00Z  |  local: 2026-09-18 12:05 IST
TASK CLAIMED:   R-15 Standalone statements scale shares outstanding with the basis
END STATUS:     DONE

COMPLETED:
  - financialStatementBuild.ts no longer scales sharesOutstanding by standaloneShareOfRevenue:
    shares belong to the listed company on either basis. Standalone EPS, P/E and P/B now differ
    from consolidated (Tata Motors P/E 56.8x standalone against 18.7x consolidated) and market value
    is the same on both bases, as it should be.
  - Log hygiene (rule 11): sessions 66 to 89 moved verbatim to PROGRESS_ARCHIVE.md under a new
    "Sessions 66 to 89" heading; the archive diff is additions only. Pointer updated.

NOT COMPLETED / LIMITATION:
  - Standalone still scales every line by one factor, so ROE, margins and debt to equity are equal
    on both bases. Differentiating them needs a seed-level design choice (e.g. a standalone margin
    or leverage per company); not invented here. Logged as open question 28.

VERIFICATION RUN (whole session, final):
  pnpm typecheck PASS; pnpm lint PASS (repo-wide); pnpm build PASS; pnpm visual 14/14 PASS.
  Every task this session was verified in the browser pane against the dev server; details are in
  each task's end entry above. Themes: light checked on the Ratios tab; all new UI uses tokens only.

SESSION SUMMARY:
  R-09, R-10, R-11, R-12, R-13, R-14 and R-15 DONE. Stage R is complete (15 of 15). Seven commits
  on main, one per task (R-12 and R-14 share one).
────────────────────────────────────────────────────────────
```

```
────────────────────────────────────────────────────────────
SESSION 93 | Claude Opus 5 | T-01 START
START:          2026-09-18T05:05:54Z  |  local: 2026-09-18 10:35 IST
TASK CLAIMED:   T-01 Strategy write API and mock store

SESSION START CHECKS:
  pnpm typecheck PASS; pnpm lint PASS. System clock reads 05:05Z, earlier than session 92's
  logged end (06:35Z); session 92's times appear to have been estimated. Times here are read
  from the system clock.
  Owner validated Research & Backtest this session and could not create a strategy. Stage T
  (T-01..T-06) registered from the findings; owner answered question 26 (fundamentals as an
  optional rule operand, T-05) and asked for all of Stage T to be done, one task at a time.
────────────────────────────────────────────────────────────
```

```
────────────────────────────────────────────────────────────
SESSION 93 | Claude Opus 5 | T-01 END
END:            2026-09-18T05:21:00Z  |  local: 2026-09-18 10:51 IST
TASK CLAIMED:   T-01 Strategy write API and mock store
END STATUS:     DONE

COMPLETED:
  - Schemas (strategy-authoring.ts): timeframe enum, starter template, create request (blank,
    template or duplicate source; name 3-80 characters), save request, saved-strategy response.
  - Mock: four starter templates (strategyTemplates.ts); rule shorthand moved to ruleBuilders.ts
    and shared with strategyDrafts.ts; strategyStore.ts (decision 56); strategyAuthoringHandlers.ts
    for templates, create and save. /strategies, /strategies/library, /:id/draft and /:id/versions
    now read the store; generateStrategyLibrary takes the strategy list as an optional argument.
  - Client: useStrategyTemplates, useCreateStrategy, useSaveStrategy (strategyAuthoringQueries.ts).
    useDraftEditor saves through the endpoint; Save shows "Saving" and a save error inline;
    reverting loads the old definition as unsaved changes, so saving it is a new version.

VERIFICATION RUN:
  pnpm typecheck PASS; pnpm lint PASS; pnpm build PASS.
  Browser: templates 200 (4); create from template 201 strat-user-1 0.1.0 draft; duplicate name
  409; two-character name 400; duplicate of RSI copies its rules as a draft; save 0.1.0 -> 0.2.0
  with two versions; library lists 7 with markets derived from the new universe. Editor: changed
  RSI max concurrent positions to 5 and saved, v2.1.0 -> v2.2.0, badge back to "No changes"; after
  a full reload the library shows 2.2.0 and Backtest Setup lists the two new strategies.

NOTES FOR NEXT AGENT:
  - There is still no UI to create a strategy; that is T-02.
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
| 7 | Session 1 | 2026-09-15 | Node v20.11.1 installed is below Vite 7 minimum (20.19). Upgrade Node to 22 LTS? | **Yes, very low priority** — Owner, 2026-09-17 (session 64): upgrade to Node 22 LTS; raised as F-22 |
| 8 | Session 3 | 2026-09-15 | ESLint 9.39.5 is marked deprecated (unsupported) by npm; ESLint 10 and Stylelint 17 need Node >=20.19. Upgrade Node to unblock them? (same fix as Q7) | **Yes, very low priority** — Owner, 2026-09-17 (session 64): same fix as Q7 (F-22) |
| 4 | — | — | Does the 250-line limit apply to test and story files? | Moot — file length no longer lint-enforced (decision 13), 2026-09-15 |
| 5 | — | — | Is high contrast theme needed at launch or later? | At launch — owner ("complete all until F15"), 2026-09-15 |
| 9 | Session 36 | 2026-09-16 | Is Portfolio → Performance (`/portfolio/performance`) a distinct screen, or is it the same thing as Reports → Performance reports (S-20)? Both are in the nav map. If distinct, S-25 stands; if not, S-25 should be dropped and the route pointed at the Reports screen | **Distinct** — Owner, 2026-09-17 (session 64): keep S-25 as the quick view and link it to the full Reports performance report (S-35) |
| 10 | Session 36 | 2026-09-16 | Is Trading → Positions (`/trading/positions`) distinct from Portfolio → Holdings (S-02)? Both are in the nav map and section 7 specifies only Holdings (7.2). If it means "positions opened by automation" it is a real screen; if it is a synonym it should be dropped | **Distinct** — Owner, 2026-09-17 (session 64): Positions shows only strategy-opened positions and their stops; S-27 stands |
| 11 | Session 36 | 2026-09-16 | Markets → Screener is in the nav map (spec 6) but has no screen specification in section 7. What should it contain? | Answered by owner session 55/56: multi-factor discovery engine over US & IN equities/ETFs across 4 pillars (Quality, Valuation, Technical Momentum, and Compliance/Automation readiness) with 5 presets and direct handoffs to Workspace, Watchlist, Backtest, and CSV export (see Docs/SESSION_VERIFICATION_LOG.md) |
| 12 | Session 36 | 2026-09-16 | L-12 asks for "visual regression test setup". Should that be real visual regression (screenshot baselines, e.g. Playwright), or is a runtime verification script enough? Either way, should the script live in the repository so it can be re-run? Decision 11 dropped CI, which may have been read as dropping this too | **Real visual regression** — Owner, 2026-09-17 (session 64): Playwright screenshot baselines in the repository, run locally (no CI), one baseline per key screen in dark and light themes (L-12) |
| 13 | Session 37 | 2026-09-16 | **Am I subject to an employer trading policy** — restricted list, blackout windows, pre-clearance, minimum holding periods, disclosure obligations? This determines whether S-33 Compliance is essential or not applicable. It is the highest-consequence open question in this document: a breach is a legal and career exposure, not a financial loss | **No, freelancer** — Owner, 2026-09-17 (session 64). Compliance screen and safety-layer checks stay (jurisdictional rules, future client conflicts); employer-specific rules become optional configuration, off by default outside the mock, and E-09 part c is low priority (decision 43) |
| 14 | Session 37 | 2026-09-16 | Which assets sit outside the brokers (provident fund, pension, deposits, gold, property, insurance-linked savings, employer equity, loans), and should the platform hold the complete picture or only the traded part? Allocation targets, goal projections and concentration limits are wrong if they exclude these | **Traded portfolio only** — Owner, 2026-09-17 (session 64): complete net-worth tracking belongs to a separate future product. S-30 stays as built; nothing new depends on non-market assets (decision 44) |
| 15 | Session 37 | 2026-09-16 | Is this system the record of truth for my holdings, or is the broker the record of truth with this system as a view over it? This decides how hard a reconciliation mismatch should fail, and what must survive if the broker is unavailable | **Broker is the record of truth** — Owner, 2026-09-17 (session 64): a reconciliation mismatch raises an alert and pauses automation for that account; it never overwrites the broker record (decision 45, E-05) |
| 16 | Session 37 | 2026-09-16 | Which country am I tax resident in for the reporting period, which tax year does reporting follow, and do I hold assets outside that country? Determines whether the cross-border parts of requirements 26 (annual foreign-asset disclosure, outward remittance limits, relief for tax paid abroad) apply at all | **India resident, will hold foreign stocks** — Owner, 2026-09-17 (session 64): Indian financial year (April to March); foreign asset disclosure, remittance cap and foreign tax credit apply (decision 45, E-06, E-09b) |
| 17 | Session 37 | 2026-09-16 | Who needs to reach this information if I cannot, and how would they do it today? Requirements 28 assumes at least one nominated person who needs to see but not trade | **One primary and one backup nominee** — Owner, 2026-09-17 (session 64): both view-only, access drill every 6 to 12 months, instructions kept outside the system (S-36) |
| 18 | Session 37 | 2026-09-16 | Will there be a withdrawal phase to model, or is this accumulation only for the foreseeable future? Also: what is the emergency reserve in months of expenses, and at what portfolio value would I want automation reduced rather than expanded? | **All three phases modelled** — Owner, 2026-09-17 (session 64): emergency reserve 6 months of expenses; automation reduced when automated positions exceed a configurable share (default 30%) (E-07) |
| 19 | Session 59 | 2026-09-17 | Question 11 (screener contents) shows an answer attributed to the owner, but it points to a design written by the agent in `SESSION_VERIFICATION_LOG.md` section 4. Do you accept that design (4 factor pillars, 5 presets, handoffs to Workspace, Watchlist, Backtest and CSV export) as the screener specification? | **Accepted** — Owner, 2026-09-17 (session 64): screener design stands; factor figures to be derived from price history and fundamentals rather than fixed seeds (S-34) |
| 20 | Session 63 | 2026-09-17 | Should tax rule sets per country of residence and asset class replace the tax rates held on each market (Countries & markets), or sit beside them? | **Replace** — Owner, 2026-09-17 (session 64): rule sets per residence country and asset class hold holding periods, rates, cost-basis method and tax-year start; market config keeps only dividend withholding and transaction taxes (decision 45, E-09b) |
| 21 | Session 63 | 2026-09-17 | Confirm the provisional choices of sessions 60-63: counterparty over-weight at 25% of net worth; cooling off 5 minutes above 5,000 USD with a stated reason required; running cost warning above 1% of portfolio value a year; screener EQUITY judged as long_term and ETF as etf; losses carried forward modelled under Indian rules | **Confirmed** — Owner, 2026-09-17 (session 64) (decision 46) |
| 22 | Session 83 | 2026-09-17 | Which classification scheme should sector and industry follow? GICS is licensed by MSCI and S&P; the NSE scheme covers India only; an own two-level scheme needs maintaining but works across markets | **Provisional (decision 49, taken under decision 26): own two-level scheme**, sector then industry, across every market, keeping the provider's scheme as a mapping. Confirm or overrule |
| 23 | Session 83 | 2026-09-17 | How much statement history should the platform hold, and should consolidated and standalone both be kept? | **Provisional (decision 50): five years annual, eight quarters interim, both consolidated and standalone where published**, each with its publication date so backtests stay point-in-time |
| 24 | Session 83 | 2026-09-17 | Should exposure held through an ETF or mutual fund count towards sector and group limits, and should business-group exposure be limited at all? | **Provisional (decision 51): yes to both.** Fund holdings look through into sector and group exposure; a group limit sits beside the sector limit on Risk & Safety |
| 25 | Session 83 | 2026-09-17 | Should analyst estimates, price targets and consensus ratings be collected and shown? | **Provisional (decision 52): no.** Reported facts only; warning flags are observations with evidence, never advice. Revisit only for earnings-surprise tracking, clearly labelled as third-party estimates |
| 26 | Session 83 | 2026-09-17 | Should strategy rules be able to test fundamentals (for example "price to earnings below 20"), or is this research-only for now? Rule operands today are price, indicator and number only | **Yes, as an optional rule operand** — Owner, 2026-09-18 (session 93). Raised as T-05 |
| 27 | Session 83 | 2026-09-17 | Is ownership data — promoter holding, pledge trend, insider transactions — wanted now, given it matters mainly for Indian stocks and needs a provider that publishes it? | **Provisional: yes, in scope** as R-10 (requirements 36). Say if it should be deferred until after the statements work |
| 28 | Session 92 | 2026-09-18 | Standalone statements are consolidated scaled by one factor per company, so ROE, margins and debt to equity are the same on both bases (only per-share figures differ since R-15). Should standalone carry its own margin and leverage per company (e.g. Tata Motors standalone without JLR is less profitable and more indebted)? | **Open — not answered.** Needs a seed value per company; nothing invented. Say yes and a small data task can add it |
 
---
 
## 6. Decision Record (Append Only)
 
> Moved to [DECISIONS.md](./DECISIONS.md) - required reading at every session start.
 
All 38 decisions, plus decision 39 recording this restructure, now live in `DECISIONS.md`.
Append new decisions there, not here.
 