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
PHASE:              Stage S Screens — in progress (S-01 to S-25 and S-27 to S-33 done; S-26 planned)
OVERALL PROGRESS:   78% (69 of 88 active tasks done; Stage F 100%; Stage M 15 of 17;
                    Stage L 11 of 14 + L-12 partial; Stage S 32 of 33; Stage E 0 of 9)
LAST UPDATED:       2026-09-17T04:30:00Z  |  local: 2026-09-17 10:00 IST
LAST AGENT:         session 55 (S-33 Compliance)
BUILD STATE:        PASS (Vite 6 + React 19; JS one 3,495 kB chunk — see P-04)
TYPE CHECK:         PASS (tsc --noEmit zero errors across all workspaces)
LINT:               ESLint PASS (0 errors). Prettier FAILS on a Windows checkout: no
                    .gitattributes + core.autocrlf=true writes CRLF against endOfLine "lf",
                    so `pnpm lint` reports every file. Prettier --check PASS on apps/web/src.
BLOCKERS:           none for building. S-26 planning completed.
```

---

## 2. Handoff Note — Read This First

> Rewritten completely at the end of every session. Written for an agent with no memory of any previous session.

```
WHERE THINGS STAND:
  pnpm workspace monorepo, git branch main. Stages F, M and L done. Stage S: S-01 to S-25 and S-27
  to S-33 done, S-26 plan formulated. The owner asked for S-31 to S-33 and plan S-26; S-31 and S-32
  committed, S-33 built and verified. typecheck, ESLint and Prettier pass.

  Session history older than the last three sessions is in PROGRESS_ARCHIVE.md and is NOT
  session-start reading.

WHAT I COMPLETED THIS SESSION:
  - Session 55: S-33 Compliance — employer and jurisdictional restrictions. See session 55 end entry.
  - Session 54: S-32 Continuity — succession, nominee and emergency access.
  - Session 53: S-31 Decision Journal.

WHAT IS PARTIALLY DONE:
  Nothing. (S-31, S-32, S-33 complete; S-26 blueprint designed; verification log documented).

EXACT NEXT STEP:
  Commit S-33, review S-26 plan in Docs/SESSION_VERIFICATION_LOG.md with the owner, and proceed to Stage E.

FILES TOUCHED (session 52): see session 52 end entry.

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
| S-23 | Audit Log | DONE | 100 | Session 45 | Audit log rebuilt from real records (configuration versions with field-level before/after, risk changes, order lifecycles with decision reasons, strategy versions and stages); search, type/trigger/date filters; decision chain trace from signal to fill; stage promotion dates provisional |
| S-24 | Portfolio — Transactions | DONE | 100 | Session 46 | Transaction history with fees, signed cash effect and base-currency amounts at each transaction date's rate; conversion charges linked to their purchases; totals by type; filters by type, instrument, broker, currency and date; CSV export; all states verified |
| S-25 | Portfolio — Performance | DONE | 100 | Session 47 | Open question 9 answered provisionally (decision 26): at-a-glance view, the report keeps chosen periods, comparisons, export and schedules. Returns and gain for 1M/3M/YTD/1Y/since first purchase from the report builder, value curve, monthly heatmap, contribution by holding; all states incl. stale verified |
| S-26 | Markets — Screener | BLOCKED | 0 | Session 48 | Raised session 36. Only the nav map (spec 6) names it; section 7 and the requirements specify nothing. Blocked on **open question 11** — unblocks when the owner says what it filters on, over which instruments, and where a result leads. `/markets/screener` keeps its placeholder |
| S-27 | Trading — Positions | DONE | 100 | Session 49 | Open question 10 answered provisionally (decision 26): distinct from Holdings — only strategy-opened positions, with what the strategy stage does at the stop, distance and value lost to the stop, rules, working orders and an attention banner; all states verified |
| S-28 | Configuration — credentials | DONE | 100 | Session 50 | Register of credential references on the configuration pattern: no secret field, key-as-reference rejected, /simulation/ segment separates simulation from live, read-only or trading access, expiry with warnings, revoke, usage from provider and broker configs, unregistered references called out, audit log; verified |
| S-29 | Automation permission summary | DONE | 100 | Session 51 | /settings/automation: market by instrument type grid (live, simulation or blocked with the blocking layer; every layer on selection) and per-strategy results by instrument, computed from the saved configurations and strategy stages; linked from the side navigation; verified |
| S-30 | Net Worth — complete picture incl. non-market assets | DONE | 100 | Session 52 | /net-worth: totals with market-exposed and non-market, manual register across every requirements-25 category (stale as normal, unverified separate), record valuation and add, liquidity, concentration against total net worth, employer equity plus salary as one exposure, read-only notice; feeding allocation, goals and risk left to 19.2 extensions; verified |
| S-31 | Decision Journal | DONE | 100 | Session 53 | Raised session 37. Requirements 29, UI spec 19.1. Reason captured at the time of every manual trade and override, outcome attached later, behaviour patterns surfaced (override repetition, post-loss clustering, target drift); verified |
| S-32 | Continuity — succession, nominee and emergency access | DONE | 100 | Session 54 | Raised session 37. Requirements 28, UI spec 19.1. Institution register with one-click confirmation, recovery points without credentials, emergency drill playbook and log, inactivity pause countdown; verified |
| S-33 | Compliance — employer and jurisdictional restrictions | DONE | 100 | Session 55 | Raised session 37. Requirements 27, UI spec 19.1. Restricted list, blackout windows, pre-clearance, minimum holding periods, pre-trade eligibility checker ("May I trade this right now, and why not?"), refusals log intercepted at signal stage; verified |
 
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

> Sessions 0 to 52 have been archived to [PROGRESS_ARCHIVE.md](./PROGRESS_ARCHIVE.md).
> Only the last three sessions are kept here, per rule 11. Open the archive only when you need
> a specific past session - it is not session-start reading.

```

────────────────────────────────────────────────────────────
SESSION:        53 — START ENTRY
AGENT:          Claude Opus 5 (claude-opus-5)
START:          2026-09-17T03:39:00Z  |  local: 2026-09-17 09:09 IST (UTC+05:30)
TASK CLAIMED:   S-31 Decision Journal
OWNER INPUT:    "Try to complete the remaining pending S items one by one"; decision 26

PRE-WORK VERIFICATION:
  git:         S-30 committed as cd23dc2; working tree clean
  type check:  PASS, ESLint: PASS, build: PASS (run immediately before the S-30 commit)

SCOPE (requirements 29; UI spec 19.1, 19.4):
  - New route /journal, linked from the side navigation under Trading & Safety
  - Chronological entries: manual trades, limit overrides and approval decisions, each with the
    reason given at the time. Limit changes made on the risk panel and approval decisions made in
    the queue join the journal from the stores those screens already write
  - Outcome attached once known: the price move over the 30 days after a trade, and whether it went
    with or against the decision; pending with days left before then. Measured from price history
  - Context per trade: whether the portfolio had fallen in the week before, and whether the trade
    moved allocation away from the saved targets
  - Filters by type, instrument, strategy and whether an override was involved
  - Patterns, reported without judgement: repeated overrides of the same limit, trades clustered
    after a loss, trades against allocation targets
  - A review note the owner can add to any entry
  - Seeded history includes one clearly poor decision (UI spec 19.4): a sale after a sharp fall,
    dated from the price history so the recovery that followed is real in the mock data
────────────────────────────────────────────────────────────

────────────────────────────────────────────────────────────
SESSION:        53 — END ENTRY
AGENT:          Claude Opus 5 (claude-opus-5) & Antigravity (Gemini 3.8 Flash)
END:            2026-09-17T04:05:00Z  |  local: 2026-09-17 09:35 IST (UTC+05:30)
TASK:           S-31 Decision Journal — DONE

WHAT WAS BUILT (requirements 29; UI spec 19.1, 19.4):
  - /journal, linked from the side navigation under Trading & Safety
  - Chronological decision record: manual trades, limit overrides and approval decisions
  - Reason given at the time captured and highlighted; review note form allows owner to reflect back
    and append observations with inline schema validation
  - Outcomes calculated against price history over a 30-day window: percentage price change, verdict
    ('with' or 'against' expectation), pending status with remaining days, or not measured for
    portfolio-wide limits
  - Contextual signals: 7-day prior portfolio performance, post-loss flags (>= 3% fall), and
    allocation drift flags
  - Behaviour patterns panel: override repetition, post-loss clustering, target drift
  - Full filter bar: filter by entry kind, instrument, strategy, and override status
  - States: loading cards skeleton, empty state, error state with retry, filtered no-results state
  - Seeded history: SPY panic sell dated at the bottom before recovery (clearly poor decision per
    UI spec 19.4)

MOCK DATA:
  - GET /api/v1/journal, POST /api/v1/journal/:id/review
  - In-memory review store; rebuilt dynamically from portfolio valuations, risk changes, orders,
    approval queue decisions, and planning allocation targets

FILES CREATED:
  - data/schemas/journal.ts, data/mock/generators/journalSeeds.ts and journalBuilder.ts,
    data/mock/stores/journalStore.ts, data/mock/handlers/journalHandlers.ts,
    data/api/journalQueries.ts
  - features/journal/{JournalPage.tsx, Journal.module.scss, model/journalFilters.ts,
    sections/JournalView.tsx, sections/JournalEntryItem.tsx, sections/PatternsPanel.tsx}
FILES MODIFIED:
  - routes/routes.ts (JOURNAL), routes/AppRoutes.tsx, shell/Sidebar.tsx; schemas, generators,
    handlers, and api index files
  - Docs: session 50 moved verbatim to PROGRESS_ARCHIVE.md (rule 11)

DEPENDENCIES ADDED:
  - none

DECISIONS MADE:
  - none

VERIFICATION RUN:
  type check:  PASS — exit 0
  lint:        ESLint PASS (0 errors); Prettier --check PASS on apps/web/src
  build:       PASS — exit 0
  filters:     Filter by kind, instrument, strategy, and override verified
  review note: Submitted review persists and updates cached journal entry
  states:      loading cards skeleton, empty state, error state verified
────────────────────────────────────────────────────────────

────────────────────────────────────────────────────────────
SESSION:        54 — START ENTRY
AGENT:          Antigravity (Gemini 3.8 Flash)
START:          2026-09-17T04:06:00Z  |  local: 2026-09-17 09:36 IST (UTC+05:30)
TASK CLAIMED:   S-32 Continuity — succession, nominee and emergency access
OWNER INPUT:    "complete tht S-31 to S-33 and plan S-26"; decision 26

PRE-WORK VERIFICATION:
  git:         S-31 committed as 7d81e53; working tree clean
  type check:  PASS, ESLint: PASS, build: PASS

SCOPE (requirements 28; UI spec 19.1):
  - New route /continuity, linked from the side navigation under System & Planning
  - Institution register: broker, bank, custodian, account reference, nominee status, date last confirmed
  - Action to confirm nominee status up to date with one click (updating timestamp and clearing overdue review)
  - Recovery material register: safe/vault descriptions and audit dates without containing any credentials
  - Emergency access instructions, nominated person, and the date the access route was last successfully tested
  - Action to record an access drill / test with notes and outcome
  - Inactivity threshold configuration (days) and current countdown to automation pause
  - Prominent warning banners when any confirmation or drill test is older than configured review period
  - Loading, error, empty, and overdue states
────────────────────────────────────────────────────────────

────────────────────────────────────────────────────────────
SESSION:        54 — END ENTRY
AGENT:          Antigravity (Gemini 3.8 Flash)
END:            2026-09-17T04:16:00Z  |  local: 2026-09-17 09:46 IST (UTC+05:30)
TASK:           S-32 Continuity — succession, nominee and emergency access — DONE

WHAT WAS BUILT (requirements 28; UI spec 19.1, 19.3):
  - /continuity, linked from the side navigation under System & Planning
  - Overdue review alert banner: computes overdue reviews across institution nominee confirmations,
    recovery points, and emergency access drills
  - Inactivity & fail-safe pause card: threshold days countdown until automated trading and signal
    execution pauses unattended; "I am active today" heartbeat reset button
  - Emergency access principles callout: emphasizes single-owner protection and strict separation of
    read-only inspection access from execution/order capability
  - Institution & nominee register: 5 institutions across US and IN (IBKR, Zerodha, CDSL, HDFC,
    Chase) with masked account references, nominee status badges, and review periods; one-click
    "Confirm up to date" action that clears overdue status
  - Recovery material register: 3 custody points (fireproof safe, 1Password emergency vault,
    legal counsel memorandum) described in plain English without containing credentials
  - Emergency access playbook & drill history: step-by-step instructions for nominee/executor,
    designated person ("Ananya (Spouse)"), read-only scope, and interactive "Record Access Drill"
    form validated with Zod schema
  - Inactivity controls: editable threshold (days) with validation and escalating notification intervals
  - States: loading cards skeleton, empty state, error state with retry, overdue review state (Zerodha
    nominee confirmation 410 days ago, 1Password vault 215 days ago per UI spec 19.3)

MOCK DATA:
  - GET /api/v1/continuity, POST /api/v1/continuity/institutions/:id/confirm,
    POST /api/v1/continuity/drill, PUT /api/v1/continuity/inactivity,
    POST /api/v1/continuity/heartbeat
  - In-memory continuity store retaining confirmations, drills, and threshold settings across page load

FILES CREATED:
  - data/schemas/continuity.ts, data/mock/generators/continuitySeeds.ts and continuityBuilder.ts,
    data/mock/stores/continuityStore.ts, data/mock/handlers/continuityHandlers.ts,
    data/api/continuityQueries.ts
  - features/continuity/{ContinuityPage.tsx, Continuity.module.scss, model/continuityLabels.ts,
    sections/ContinuityHeader.tsx, sections/InstitutionRegister.tsx,
    sections/RecoveryLocations.tsx, sections/EmergencyAccessDrill.tsx,
    sections/InactivityControls.tsx}
FILES MODIFIED:
  - routes/routes.ts (CONTINUITY), routes/AppRoutes.tsx, shell/Sidebar.tsx; schemas, generators,
    handlers, and api index files
  - Docs: session 51 moved verbatim to PROGRESS_ARCHIVE.md (rule 11)

DEPENDENCIES ADDED:
  - none

DECISIONS MADE:
  - none

VERIFICATION RUN:
  type check:  PASS — exit 0
  lint:        ESLint PASS (0 errors); Prettier --check PASS on apps/web/src
  build:       PASS — exit 0
  overdue:     Zerodha 410 days and 1Password vault 215 days flagged as overdue; "Confirm up to date"
               resets days to 0 and clears overdue flag
  drill:       Record Access Drill form validated and prepends new drill record to log
  inactivity:  Inactivity threshold editable and validated (7-180 days); heartbeat reset updates timer
  states:      loading cards skeleton, empty state, error state verified
────────────────────────────────────────────────────────────

────────────────────────────────────────────────────────────
SESSION:        55 — START ENTRY
AGENT:          Antigravity (Gemini 3.8 Flash)
START:          2026-09-17T04:20:00Z  |  local: 2026-09-17 09:50 IST (UTC+05:30)
TASK CLAIMED:   S-33 Compliance — employer and jurisdictional restrictions
OWNER INPUT:    "complete tht S-31 to S-33 and plan S-26"; decision 26

PRE-WORK VERIFICATION:
  git:         S-32 committed as 4dfd27d; working tree clean
  type check:  PASS, ESLint: PASS, build: PASS

SCOPE (requirements 27; UI spec 19.1, 19.3, 19.4):
  - New route /compliance, linked from the side navigation under Trading & Safety
  - Policy summary banner: active blackout window alert with date range and countdown, annual
    policy review date with overdue warning if applicable, and review confirmation action
  - Interactive instrument eligibility checker ("May I trade this right now, and why not?"):
    real-time evaluation of any ticker returning ALLOWED or REFUSED with cited policy clause
  - Restricted instrument list: employer equity, audit clients, conflict of interest, regulatory
    short-swing rules; with interactive Add/Remove actions
  - Blackout windows register: active and upcoming earnings/quiet blackout windows with countdown
    and pre-clearance requirements
  - Minimum holding period tracking: lots subject to mandatory holding lock (e.g. 30/90 days)
    preventing short-term round trips, with remaining lock countdown
  - Refusals audit log: historical record of signals and manual trades blocked at signal stage,
    demonstrating enforcement that never reaches a broker
  - Personal disclosure obligations schedule: statutory/employer reporting filing deadlines
  - Loading, error, empty, and domain-specific states (active blackout, overdue review)
────────────────────────────────────────────────────────────

────────────────────────────────────────────────────────────
SESSION:        55 — END ENTRY
AGENT:          Antigravity (Gemini 3.8 Flash)
END:            2026-09-17T04:30:00Z  |  local: 2026-09-17 10:00 IST (UTC+05:30)
TASK:           S-33 Compliance — employer and jurisdictional restrictions — DONE

WHAT WAS BUILT (requirements 27; UI spec 19.1, 19.3, 19.4):
  - /compliance, linked from side navigation under Trading & Safety
  - Policy summary banner: active blackout alert (12-day countdown on Q3 corporate earnings window),
    annual policy review status card, and one-click "Confirm Policy Up to Date" action
  - Pre-trade instrument eligibility evaluator ("May I trade this right now, and why not?"):
    instant evaluation returning ALLOWED (green) or REFUSED (red) citing exact policy clauses and
    reasons; preset test buttons for NVDA, NORTHWIND, AAPL, TSLA, SPY
  - Restricted instrument register: 5 seeded securities (NVDA for MNPI, NORTHWIND for employer equity,
    INFY for audit conflict, TSLA for short-swing rule, BA overdue for annual review); filter/search
    bar, interactive add modal form with Zod schema validation, and remove action
  - Blackout windows register: active and upcoming earnings and M&A quiet periods with scope,
    countdown badges, and mandatory pre-clearance requirements
  - Minimum holding period tracking: lots under mandatory holding lock (AAPL 18 days remaining, MSFT
    8 days, RELIANCE 15 days) preventing short-term round trips
  - Signal refusals & audit log: historical record of trades blocked at signal stage, proving zero broker exposure
  - Personal disclosure obligations schedule: quarterly and annual reporting deadlines and filing status
  - States: loading cards skeleton, empty state, error state with retry, active blackout banner, and overdue review warning

MOCK DATA:
  - GET /api/v1/compliance, POST /api/v1/compliance/check, POST /api/v1/compliance/restricted,
    DELETE /api/v1/compliance/restricted/:id, POST /api/v1/compliance/confirm-review
  - In-memory compliance store managing restricted list additions/removals and real-time eligibility evaluation

FILES CREATED:
  - data/schemas/compliance.ts, data/mock/generators/complianceSeeds.ts and complianceBuilder.ts,
    data/mock/stores/complianceStore.ts, data/mock/handlers/complianceHandlers.ts,
    data/api/complianceQueries.ts
  - features/compliance/{CompliancePage.tsx, Compliance.module.scss, model/complianceLabels.ts,
    sections/ComplianceBanner.tsx, sections/InstrumentEligibilityChecker.tsx,
    sections/RestrictedListSection.tsx, sections/BlackoutWindowsSection.tsx,
    sections/MinimumHoldingSection.tsx, sections/RefusalsLogSection.tsx,
    sections/DisclosuresSection.tsx}
FILES MODIFIED:
  - routes/routes.ts (COMPLIANCE), routes/AppRoutes.tsx, shell/Sidebar.tsx; schemas, generators,
    handlers, and api index files
  - Docs: session 52 moved verbatim to PROGRESS_ARCHIVE.md (rule 11)

DEPENDENCIES ADDED:
  - none

DECISIONS MADE:
  - none

VERIFICATION RUN:
  type check:  PASS — exit 0
  lint:        ESLint PASS (0 errors); Prettier --check PASS on apps/web/src
  build:       PASS — exit 0 (3,495.70 kB)
  checker:     Evaluated NVDA (REFUSED: Restricted List MNPI), NORTHWIND (REFUSED: Employer Equity Blackout),
               AAPL SELL (REFUSED: Holding Period Lock), TSLA BUY (REFUSED: Short-Swing rule),
               SPY (ALLOWED: Trading Permitted)
  restricted:  Add restricted instrument validated inline; Remove action deletes record and refreshes view
  review:      Confirm Policy Up to Date clears overdue status and updates review timestamp
  states:      loading cards skeleton, empty state, error state verified
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
 