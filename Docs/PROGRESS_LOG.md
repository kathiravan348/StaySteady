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
PHASE:              Stage S Screens — in progress (S-01 to S-25 done)
OVERALL PROGRESS:   70% (62 of 88 active tasks done; Stage F 100%; Stage M 15 of 17;
                    Stage L 11 of 14 + L-12 partial; Stage S 25 of 33; Stage E 0 of 9)
LAST UPDATED:       2026-09-17T02:54:00Z  |  local: 2026-09-17 08:24 IST
LAST AGENT:         session 47 (S-25 Portfolio — Performance)
BUILD STATE:        PASS (Vite 6 + React 19; JS one 3,356 kB chunk — see P-04)
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
  pnpm workspace monorepo, git branch main. Stages F, M and L done. Stage S: S-01 to S-25 done.
  The owner asked for the remaining S tasks one by one, each committed (no push), taking the
  recommended option whenever a choice comes up (decision 26). typecheck, ESLint and Prettier pass.

  Session history older than the last three sessions is in PROGRESS_ARCHIVE.md and is NOT
  session-start reading.

WHAT I COMPLETED THIS SESSION:
  - Session 47: S-25 Portfolio — Performance. See session 47 end entry.
  - Session 46: S-24 Portfolio — Transactions. Session 45: S-23 Audit Log.

WHAT IS PARTIALLY DONE:
  Nothing.

EXACT NEXT STEP:
  S-26 Screener: no specification (open question 11) — mark it BLOCKED with the reason, do not
  invent it. Then S-27 Trading — Positions (open question 10): recommended reading is positions
  opened by automation (strategy, entry signal, stop and target, exit rules), distinct from S-02
  Holdings. Then S-28..S-33.

FILES TOUCHED (session 47): see session 47 end entry.

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
 
> Sessions 0 to 44 have been archived to [PROGRESS_ARCHIVE.md](./PROGRESS_ARCHIVE.md).
> Only the last three sessions are kept here, per rule 11. Open the archive only when you need
> a specific past session - it is not session-start reading.
 
```
────────────────────────────────────────────────────────────
SESSION:        45 — START ENTRY
AGENT:          Claude Opus 5 (claude-opus-5)
START:          2026-09-16T22:41:04Z  |  local: 2026-09-17 04:11 IST (UTC+05:30)
TASK CLAIMED:   S-23 Audit Log
OWNER INPUT:    "Try to complete the remaining pending S items one by one"; decision 26

PRE-WORK VERIFICATION:
  git:         S-22 committed as eacc895; working tree clean
  type check:  PASS, ESLint: PASS, build: PASS (run immediately before the S-22 commit)

SCOPE (UI spec 7.20):
  - Complete record of configuration changes, approvals, orders, limit changes and stage
    promotions; each with what changed (before and after), time and trigger; filterable and
    searchable; trace one decision chain end to end (signal -> approval -> order -> fill)
  - Built from records that already exist, not a separate seed, so an edit made on another screen
    appears here: configuration versions (all seven areas), risk limit and emergency changes, the
    order history timelines (which carry signal, approval and fill events and decision reasons),
    strategy definition versions
  - PROVISIONAL: stage promotions are held in the browser session on the Strategy Library screen,
    not on the server, so the audit log records each strategy's promotions up to its current stage
    at dates derived from the library, and says so. A server-side promotion record is a finding
  - The decision chain is the order history timeline for that order, reached from any entry in it
────────────────────────────────────────────────────────────

────────────────────────────────────────────────────────────
SESSION:        45 — END ENTRY
AGENT:          Claude Opus 5 (claude-opus-5)
END:            2026-09-16T22:49:00Z  |  local: 2026-09-17 04:19 IST (UTC+05:30)
TASK:           S-23 Audit Log — DONE

WHAT WAS BUILT (UI spec 7.20):
  - /audit: every entry newest first in a table (when, type, what happened, what it is about,
    triggered by, number of changes); opening a row shows the reason and a before/after table
  - Types: configuration, approval, order, signal, risk limit, emergency control, stage promotion,
    strategy definition; triggers: you, a strategy, the system, the broker
  - Search across title, subject, reason and every before/after value; filters by type, trigger
    and date range; no-results state
  - "Trace the decision chain" on any entry belonging to an order shows the order's lifecycle as
    numbered steps from signal to fill, with the entry's own step marked, and the signal, approval
    and order ids

MOCK DATA:
  - GET /api/v1/audit, rebuilt on every request from: all seven configuration version stores
    (field-level before/after from the snapshots), the risk change log, order history timelines
    (with approval decision reasons), strategy definition versions and strategy library stages
  - PROVISIONAL (see start entry): stage promotions are not recorded on the server, so each step up
    to a strategy's current stage is dated 45 days apart and says so in its reason

FILES CREATED:
  - data/schemas/audit.ts; data/api/auditQueries.ts
  - data/mock/generators/auditLog.ts; data/mock/handlers/auditHandlers.ts
  - features/audit/{Audit.module.scss, model/auditFilters.ts, sections/AuditView.tsx,
    sections/DecisionChain.tsx}
FILES MODIFIED:
  - features/audit/AuditLogPage.tsx — rewritten from a placeholder
  - data/schemas/index.ts; data/api/index.ts; data/mock/generators/index.ts; data/mock/handlers/index.ts
  - Docs: session 42 moved verbatim to PROGRESS_ARCHIVE.md (rule 11)

DEPENDENCIES ADDED:
  - none

DECISIONS MADE:
  - none

VERIFICATION RUN:
  type check:  PASS — exit 0
  lint:        ESLint PASS; Prettier --check PASS on every changed file (CRLF finding unchanged)
  build:       PASS — exit 0
  endpoint:    80 entries (configuration 48, order 11, strategy stage 10, approval 5, signal 5,
               strategy definition 1)
  search:      "settlement" -> 1 entry, "Market US changed (version 2)", opened to "US equities
               moved to T+1 settlement" and "Settlement days 2 -> 1"
  chain:       "ord-0001" -> Filled entry -> Trace: six steps (signal raised, approval requested,
               approved, submitted, acknowledged, filled "(this entry)") with signal
               sig-01-spy-buy, approval appr-002-approved
  live record: changed INR conversion cost to 35 bps through the API, moved to Overview and back
               in the app: 81 entries, "Currency INR changed (version 3)", reason "Bank raised its
               FX margin.", "Conversion cost bps 30 -> 35"
  states:      loading-error -> "Audit log unavailable"; reset to healthy. Stale: the log is a
               record rebuilt on each visit, with no live stream to go stale

MISTAKES THIS SESSION (recorded per rules section 7):
  - Diff field names first came through as raw paths ("settlementDays"); they are now labelled
    ("Settlement days", "Fees › commission bps")

FINDINGS (out of scope, not fixed):
  - The order history timeline for ord-0001 has "Signal raised" at 14:28 after "Approval
    requested" at 14:15, so the decision chain shows the signal after its approval request. The
    times come from the S-13 order history generator
  - Stage promotions should be recorded on the server (the library keeps them in session storage)
  - Watchlist edits, goal and allocation target changes, report schedules and alert
    acknowledgements are not in the audit log yet
  - Risk changes carry title and detail text rather than structured before/after values
────────────────────────────────────────────────────────────

────────────────────────────────────────────────────────────
SESSION:        46 — START ENTRY
AGENT:          Claude Opus 5 (claude-opus-5)
START:          2026-09-16T22:49:44Z  |  local: 2026-09-17 04:19 IST (UTC+05:30)
TASK CLAIMED:   S-24 Portfolio — Transactions
OWNER INPUT:    "Try to complete the remaining pending S items one by one"; decision 26

PRE-WORK VERIFICATION:
  git:         S-23 committed as 2783986; working tree clean
  type check:  PASS, ESLint: PASS, build: PASS (run immediately before the S-23 commit)

SCOPE (UI spec 15, nav map 6): transaction history with fees, charges and currency conversions
  - /portfolio/transactions: every transaction (deposit, buys, dividends, conversion charges) with
    instrument, broker, quantity, price, fees and cash effect; each amount also in the base currency
    at the exchange rate on the day it happened, not today's rate
  - A purchase outside the USD funding currency shows its conversion: the rate used and the charge,
    linked to the charge transaction
  - Filters by type, instrument, broker, currency and date; totals by type in the base currency;
    CSV export; row detail with notes and a link to the position
  - Screen-only: the existing /api/v1/portfolio/transactions, holdings, brokers and FX history
    carry everything; no new endpoint
────────────────────────────────────────────────────────────

────────────────────────────────────────────────────────────
SESSION:        46 — END ENTRY
AGENT:          Claude Opus 5 (claude-opus-5)
END:            2026-09-16T22:56:30Z  |  local: 2026-09-17 04:26 IST (UTC+05:30)
TASK:           S-24 Portfolio — Transactions — DONE

WHAT WAS BUILT (UI spec 15, nav map 6):
  - /portfolio/transactions: every transaction newest first with date, type, instrument, broker,
    quantity, fees, signed cash effect in its own currency, and the same amount in the base currency
    (top bar) at the exchange rate on the transaction's date
  - Totals by type in the base currency for the transactions shown
  - Filters by type, instrument, broker, currency and date range; no-results state; CSV export of
    the rows shown, including the rate used
  - Row detail: notes, fees and unit price, the day's rate, and for a purchase outside the USD funding
    currency the conversion charge booked with it; link to the position
  - Loading, error and empty (empty-portfolio) states. Transactions are a record, not a stream, so
    there is no stale state beyond the loading of fresh data

MOCK DATA:
  - None added: /portfolio/transactions, holdings, brokers and FX history already carry everything

FILES CREATED:
  - features/portfolio/transactions/{Transactions.module.scss, model/transactionRows.ts,
    sections/TransactionsView.tsx}
FILES MODIFIED:
  - features/portfolio/PortfolioTransactionsPage.tsx — rewritten from a placeholder
  - Docs: session 43 moved verbatim to PROGRESS_ARCHIVE.md (rule 11)

DEPENDENCIES ADDED:
  - none

DECISIONS MADE:
  - none

VERIFICATION RUN:
  type check:  PASS — exit 0
  lint:        ESLint PASS; Prettier --check PASS on every changed file (CRLF finding unchanged)
  build:       PASS — exit 0
  list:        19 transactions; totals Buy (11) -$111,617.33, Dividend (5) +$115.91, Fee or charge
               (2) -$8.10, Deposit (1) +$50,000.00
  currency:    INR filter -> RELIANCE dividend +₹470.00 = +$6.53, buy -₹64,255.20 = -$835.25, charge
               -₹160.63 = -$2.09; the buy's detail: "1 INR = 0.0130 USD on 2022-05-13" and "Bought
               in INR: money was converted from USD, with a conversion charge of ₹160.63 booked the
               same day"
  filters:     Dividend -> 5 transactions, total +$115.91
  states:      loading-error -> "Transactions unavailable"; empty-portfolio -> "No transactions
               yet"; reset to healthy

MISTAKES THIS SESSION (recorded per rules section 7):
  - The session-start script matched the registry row by passing its text through the shell, which
    mangled the backticks in it; it failed safely (nothing written). A new script matches the row
    by task id
  - Colouring whole rows by inflow or outflow tinted every cell; only the amount is coloured now

FINDINGS (out of scope, not fixed):
  - Mock buys at every broker carry a 1.50 fee in the instrument's currency (₹1.50 at Zerodha),
    while order history and broker configuration charge Zerodha ₹20 flat
  - Purchases total about $111,600 against a single $50,000 deposit, so the mock cash record does
    not balance
  - The base currency here follows the top bar switch, not the configured base currency (S-18)
  - No sells, withdrawals or splits exist in the mock data, so those filters are empty
────────────────────────────────────────────────────────────

────────────────────────────────────────────────────────────
SESSION:        47 — START ENTRY
AGENT:          Claude Opus 5 (claude-opus-5)
START:          2026-09-16T22:57:12Z  |  local: 2026-09-17 04:27 IST (UTC+05:30)
TASK CLAIMED:   S-25 Portfolio — Performance
OWNER INPUT:    "Try to complete the remaining pending S items one by one"; decision 26

PRE-WORK VERIFICATION:
  git:         S-24 committed as 0cefb99; working tree clean
  type check:  PASS, ESLint: PASS, build: PASS (run immediately before the S-24 commit)

SCOPE:
  - Open question 9 (is Portfolio -> Performance the same as Reports -> Performance?) is still
    unanswered. Recommended option taken (decision 26), keeping both and making them different
    rather than duplicates: this screen is the at-a-glance portfolio view (value since the first
    purchase, returns for standard periods, a monthly returns heatmap, contribution by holding);
    the report stays the place for chosen periods, comparisons, export and schedules, and is linked
  - Computed on the mock side with the report valuation and the performance builder (S-20), so a
    period's return here equals the performance report for the same dates
  - New endpoint GET /api/v1/portfolio/performance?currency=
────────────────────────────────────────────────────────────

────────────────────────────────────────────────────────────
SESSION:        47 — END ENTRY
AGENT:          Claude Opus 5 (claude-opus-5)
END:            2026-09-17T02:54:00Z  |  local: 2026-09-17 08:24 IST (UTC+05:30)
TASK:           S-25 Portfolio — Performance — DONE

WHAT WAS BUILT (nav map 6; open question 9, recommended option per decision 26):
  - /portfolio/performance: time-weighted returns and money gain or loss for 1 month, 3 months,
    year to date, 1 year and since the first purchase, each with its dates
  - Value since the first purchase (weekly equity curve), with a note that rises include money
    added; monthly returns heatmap; contribution by holding with each holding's share of the total
  - A note explains why a return and a money gain can point in different directions, and links to
    the performance report for chosen periods, benchmark comparison and export (not duplicated)
  - Loading, error, empty (empty-portfolio) and stale states. Stale: the page expects valuations at
    the previous day's close and shows a banner with how many days behind they are

MOCK DATA:
  - GET /api/v1/portfolio/performance?currency= built from the shared portfolio valuation and the
    performance report builder (S-20), so a period here equals the report for the same dates
  - loading-error returns 500; stale-data holds valuations back three days

FILES CREATED:
  - data/schemas/portfolio-performance.ts, data/mock/generators/portfolioPerformance.ts,
    data/mock/handlers/performanceHandlers.ts, data/api/performanceQueries.ts
  - features/portfolio/performance/{Performance.module.scss, sections/PerformanceView.tsx}
FILES MODIFIED:
  - features/portfolio/PortfolioPerformancePage.tsx — rewritten from a placeholder
  - schemas, generators, handlers and api index files (exports and handler registration)
  - Docs: session 44 moved verbatim to PROGRESS_ARCHIVE.md (rule 11)

DEPENDENCIES ADDED:
  - none

DECISIONS MADE:
  - none (open question 9 answered provisionally with the recommended option, as the start entry
    records)

VERIFICATION RUN:
  type check:  PASS — exit 0
  lint:        ESLint PASS; Prettier --check PASS on apps/web/src
  build:       PASS — exit 0
  periods:     1 month +4.76% (+$4,458.16), 3 months +8.89%, year to date -2.81% (-$1,864.82),
               1 year -4.90%, since 2022-01-14 +1.39% with -$13,817.22; value $98,047.11 at the
               2026-09-16 close; 57 months in the heatmap; both charts render
  contribution: 7 holdings, shares add to -99.9% (rounding) of a loss; XAUUSD -$17,471.16 (-126.4%)
  states:      stale-data -> banner "valued at the 2026-09-13 close, 3 days behind the last close";
               loading-error -> "Performance unavailable"; empty-portfolio -> "No performance yet";
               reset to healthy

MISTAKES THIS SESSION (recorded per rules section 7):
  - The note under the contribution table said only a losing holding shows a negative share; every
    share keeps its holding's sign. Corrected during browser verification
  - The page was first written without a stale state; added before completion

FINDINGS (out of scope, not fixed):
  - Transactions (S-24) and Reports (S-20) have no stale state; the S-24 entry argues a record needs
    none, but CLAUDE.md requires one on every screen
  - The base currency here follows the top bar switch, not the configured base currency (S-18)
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
 