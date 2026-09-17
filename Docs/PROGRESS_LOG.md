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
PHASE:              Stage S Screens — in progress (S-01 to S-25 and S-27 to S-30 done; S-26 blocked)
OVERALL PROGRESS:   75% (66 of 88 active tasks done; Stage F 100%; Stage M 15 of 17;
                    Stage L 11 of 14 + L-12 partial; Stage S 29 of 33; Stage E 0 of 9)
LAST UPDATED:       2026-09-17T03:37:00Z  |  local: 2026-09-17 09:07 IST
LAST AGENT:         session 52 (S-30 Net Worth)
BUILD STATE:        PASS (Vite 6 + React 19; JS one 3,421 kB chunk — see P-04)
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
  pnpm workspace monorepo, git branch main. Stages F, M and L done. Stage S: S-01 to S-25 and S-27
  to S-30 done, S-26 BLOCKED on open question 11. The owner asked for the remaining S tasks one by
  one, each committed (no push), taking the recommended option whenever a choice comes up
  (decision 26). typecheck, ESLint and Prettier pass.

  Session history older than the last three sessions is in PROGRESS_ARCHIVE.md and is NOT
  session-start reading.

WHAT I COMPLETED THIS SESSION:
  - Session 52: S-30 Net Worth. See session 52 end entry.
  - Session 51: S-29 Automation permission summary. Session 50: S-28 Configuration — credentials.

WHAT IS PARTIALLY DONE:
  Nothing.

EXACT NEXT STEP:
  Claim S-31 Decision Journal (requirements 29; UI spec 19.1): manual trades and limit overrides
  with the reason given at the time, outcome attached once known, filters by type, instrument,
  strategy and override, and behaviour patterns (override repetition, post-loss clustering, target
  drift). UI spec 19.4 asks for one clearly poor decision. Reuse the approval decision reasons the
  trading store already keeps. Then S-32 and S-33.

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
 
> Sessions 0 to 49 have been archived to [PROGRESS_ARCHIVE.md](./PROGRESS_ARCHIVE.md).
> Only the last three sessions are kept here, per rule 11. Open the archive only when you need
> a specific past session - it is not session-start reading.
 
```
────────────────────────────────────────────────────────────
SESSION:        50 — START ENTRY
AGENT:          Claude Opus 5 (claude-opus-5)
START:          2026-09-17T03:14:00Z  |  local: 2026-09-17 08:44 IST (UTC+05:30)
TASK CLAIMED:   S-28 Configuration — credentials
OWNER INPUT:    "Try to complete the remaining pending S items one by one"; decision 26

PRE-WORK VERIFICATION:
  git:         S-27 committed as 7766cb3; working tree clean
  type check:  PASS, ESLint: PASS, build: PASS (run immediately before the S-27 commit)

SCOPE (UI spec 7.18; requirements 139, 176, 200, 457, 472-475):
  - A register of credential references, following the configuration pattern (decision 38): list
    with health and enabled switch, detail form, inline validation, version history with diff and
    revert, new entries starting in simulation
  - Each entry holds the reference, a label, simulation or live, read-only or trading access, where
    the secret is kept (described), issue and expiry dates and the warning window. There is no field
    for a secret value anywhere, and a value typed into the reference is rejected
  - Health: expired, expiring within the warning window, revoked while in use, a live credential
    used by a simulation entry or the reverse, trading access nothing needs, read-only access for a
    broker that places orders, unused
  - "Used by" is worked out from the saved provider and broker configurations; references those
    configurations use that are not registered are called out
  - Credential changes appear in the audit log with the other configuration areas
  - Hard constraint kept: no credentials are added; mock references only
────────────────────────────────────────────────────────────

────────────────────────────────────────────────────────────
SESSION:        50 — END ENTRY
AGENT:          Claude Opus 5 (claude-opus-5)
END:            2026-09-17T03:19:00Z  |  local: 2026-09-17 08:49 IST (UTC+05:30)
TASK:           S-28 Configuration — credentials — DONE

WHAT WAS BUILT (UI spec 7.18; requirements 139, 176, 200, 457, 472-475):
  - /settings/credentials on the configuration pattern (decision 38): list with health, mode and an
    enabled (revoke) switch; detail form; inline validation; version history with diff and revert;
    new entries start in simulation, read-only
  - An entry holds the reference, what it is for, where the secret is kept (in words), simulation or
    live, read-only or trading access, issue and expiry dates and the warning window. No field for a
    secret exists; a key typed as the reference is rejected
  - Simulation references must carry a /simulation/ segment and live ones must not, so the two sets
    cannot be confused from the reference alone (requirement 474)
  - Health: expired (critical), expiring inside the warning window, revoked while in use
    (critical), used by a provider or broker in the other mode (critical), trading access nothing
    needs, read-only access for a broker that places orders, unused
  - "Used by" from the saved provider and broker configurations; a banner lists references those
    configurations name that are not registered
  - Credential changes appear in the audit log; provider and broker saves and reverts refresh the
    credential list so usage never lags
  - Shared: DateField added to shared/config form fields
  - States: loading, error, empty (no references and none named); no stale state, as with the other
    configuration screens — the entries are settings, not a feed

MOCK DATA:
  - GET/POST /api/v1/config/credentials, PUT /:reference, POST /:reference/revert (versioned
    configuration factory). Six seeded references: the five the provider and broker configurations
    already name plus an unused IBKR paper-account reference; dates relative to today, the primary
    market data key 14 days from expiry. Mock references only; no credential exists anywhere

FILES CREATED:
  - data/schemas/config-credentials.ts, data/mock/generators/credentialConfig.ts
  - features/settings/credentials/{model/credentialDraft.ts, sections/CredentialsView.tsx,
    sections/CredentialForm.tsx}
FILES MODIFIED:
  - features/settings/SettingsCredentialsPage.tsx — rewritten from a placeholder
  - data/mock/stores/configStore.ts, data/mock/handlers/settingsConfigHandlers.ts and
    auditHandlers.ts, data/api/settingsConfigQueries.ts and configQueries.ts (credential cache
    refresh), schemas, generators and api index files, shared/config/FormFields.tsx and index.ts
  - Docs: session 47 moved verbatim to PROGRESS_ARCHIVE.md (rule 11)

DEPENDENCIES ADDED:
  - none

DECISIONS MADE:
  - none (the /simulation/ segment rule applies requirement 474 within this screen's schema)

VERIFICATION RUN:
  type check:  PASS — exit 0
  lint:        ESLint PASS; Prettier --check PASS on apps/web/src
  build:       PASS — exit 0
  list:        6 references; primary market data key "Expires in 14 days on 2026-10-01" (needs
               attention); IBKR paper account "Nothing uses this reference"; others healthy with users
  validation:  "sk_live_51HxYzAbC" as the reference -> "This looks like a key, not a reference";
               vault://brokers/zerodha-paper in simulation -> needs a /simulation/ segment; simulation
               notice shown on a new entry
  add:         vault://simulation/brokers/zerodha-paper saved with a reason -> 7 references, flagged
               unused; audit log "Credential vault://simulation/brokers/zerodha-paper configured"
  revoke:      Zerodha switched off -> v2, "Revoked, but Zerodha still uses it and cannot connect."
  usage:       IBKR broker form reference changed to vault://brokers/interactive-brokers-2026 and
               saved -> credentials page at once shows "1 reference in use is not registered" and the
               old IBKR reference "Nothing uses this reference"
  revert:      primary key to version 1 -> "Expired 351 days ago on 2025-10-01; Primary market data
               provider cannot connect."
  states:      loading-error -> "Credential references unavailable"; reset to healthy
  not exercised: the empty state (every scenario seeds references)

MISTAKES THIS SESSION (recorded per rules section 7):
  - The session 50 start time (03:14:00Z) was estimated ahead of the clock again; the claim ran at
    03:10Z. Times are now read from the clock before writing an entry
  - A wiring script stopped part-way because an anchor appeared twice; nothing was half-written in
    the file it stopped on, and the rest was finished with direct edits
  - The first build refreshed the credential list only on its own saves, so a broker saved through
    its form left usage out of date for up to 30 seconds; provider and broker saves now refresh it

FINDINGS (out of scope, not fixed):
  - Provider and broker connection tests still check references against their own seed lists, not
    this register, so a revoked or expired credential still tests as resolving
  - A broker configuration has one credential reference; requirement 200 asks for separate
    simulation and live entries per broker
  - No configuration screen has a stale state
────────────────────────────────────────────────────────────

────────────────────────────────────────────────────────────
SESSION:        51 — START ENTRY
AGENT:          Claude Opus 5 (claude-opus-5)
START:          2026-09-17T03:21:00Z  |  local: 2026-09-17 08:51 IST (UTC+05:30)
TASK CLAIMED:   S-29 Automation permission summary
OWNER INPUT:    "Try to complete the remaining pending S items one by one"; decision 26

PRE-WORK VERIFICATION:
  git:         S-28 committed as 3ac81b2; working tree clean
  type check:  PASS, ESLint: PASS, build: PASS (run immediately before the S-28 commit)

SCOPE (UI spec 7.18 last bullet; requirements 233):
  - New route /settings/automation, linked from the side navigation under Trading & Safety
  - A market by instrument type grid of the layered result: automated live, simulation only, or
    blocked, naming the first layer that blocks. Selecting a cell shows every layer — market,
    instrument type and each broker that could carry it — with what each allows or blocks
  - Per strategy: its stage (orders without asking, orders with approval, or none) and, for each
    instrument in its universe, whether it can actually trade and why not
  - No new endpoint: computed from the saved market, broker and instrument type configurations and
    the strategies, so it changes the moment any of them is saved
────────────────────────────────────────────────────────────

────────────────────────────────────────────────────────────
SESSION:        51 — END ENTRY
AGENT:          Claude Opus 5 (claude-opus-5)
END:            2026-09-17T03:26:00Z  |  local: 2026-09-17 08:56 IST (UTC+05:30)
TASK:           S-29 Automation permission summary — DONE

WHAT WAS BUILT (UI spec 7.18 last bullet; requirements 233):
  - /settings/automation ("What automation can trade"), linked from the side navigation under
    Trading & Safety as "What Can Trade"
  - Summary: market and type pairs automated live, simulation only, and the strategies that can
    trade live
  - Market by instrument type grid: Live, Simulation or Blocked, naming the first layer that blocks
    (market, instrument type or broker). Selecting a cell lists every layer — the market, the
    instrument type and each enabled broker carrying that type there — with what it allows or
    blocks and a link to the screen where it is changed
  - By strategy: stage effect (orders without asking, after approval, or none) and, for each
    instrument in the universe, what actually happens: trades live or in simulation through which
    broker, or why it is blocked
  - Loading, error and empty states; no stale state, as with the configuration screens (derived
    from settings, not a feed)

MOCK DATA:
  - None added: computed from the saved market, broker and instrument type configurations,
    strategies and instruments, sharing their query cache, so a save on those screens shows here at
    once

FILES CREATED:
  - features/settings/SettingsAutomationPage.tsx
  - features/settings/automation/{Automation.module.scss, model/permissionLayers.ts,
    sections/PermissionMatrix.tsx, sections/StrategyPermissions.tsx}
FILES MODIFIED:
  - routes/routes.ts (SETTINGS_AUTOMATION), routes/AppRoutes.tsx, shell/Sidebar.tsx
  - Docs: session 48 moved verbatim to PROGRESS_ARCHIVE.md (rule 11)

DEPENDENCIES ADDED:
  - none

DECISIONS MADE:
  - none

VERIFICATION RUN:
  type check:  PASS — exit 0
  lint:        ESLint PASS; Prettier --check PASS on apps/web/src
  build:       PASS — exit 0
  grid:        5 markets by 11 types; 12 of 55 pairs live, 0 simulation; Singapore blocked by the
               market throughout ("Singapore does not permit automation", while its type and
               Interactive Brokers allow it); India swing: market, type and Zerodha all allow
  strategies:  Dual Moving Average Momentum — SPY and AAPL live through Interactive Brokers without
               asking; RSI Oversold Mean Reversion — TSLA through Interactive Brokers and TATAMOTORS
               through Zerodha after approval; Donchian, Post-Earnings and Yield Curve place no
               orders at their stages
  propagation: Swing switched off on the instrument types screen -> US swing "Blocked / Instrument
               type", 8 of 55 live, TSLA "Blocked: Swing is switched off."
  states:      loading-error -> "Automation permissions unavailable"; reset to healthy
  not exercised: the empty state (every scenario seeds markets and types) and a simulation-only
               pair (no market or broker is seeded in simulation)

MISTAKES THIS SESSION (recorded per rules section 7):
  - The first draft summarised the broker layer with a comparison that was always true; replaced
    with a plain status before the first check

FINDINGS (out of scope, not fixed):
  - Nothing that raises signals, orders or approvals consults these layers: the Donchian strategy
    is in observation (places no orders here) yet has a pending gold sell in the approval queue
  - The side navigation links Configuration to markets only; providers, brokers, instrument types,
    currencies, alert rules and credentials are reachable only by address or in-page links
────────────────────────────────────────────────────────────

────────────────────────────────────────────────────────────
SESSION:        52 — START ENTRY
AGENT:          Claude Opus 5 (claude-opus-5)
START:          2026-09-17T03:28:00Z  |  local: 2026-09-17 08:58 IST (UTC+05:30)
TASK CLAIMED:   S-30 Net Worth — complete picture incl. non-market assets
OWNER INPUT:    "Try to complete the remaining pending S items one by one"; decision 26

PRE-WORK VERIFICATION:
  git:         S-29 committed as 0536e21; working tree clean
  type check:  PASS, ESLint: PASS, build: PASS (run immediately before the S-29 commit)

SCOPE (requirements 25; UI spec 19.1, 19.3, 19.4):
  - New route /net-worth, linked from the side navigation under Portfolio
  - Totals: net worth, assets and liabilities, market-exposed and non-market; the brokerage part
    comes from the shared portfolio valuation, so it matches Performance and Reports
  - Manual asset register across every category in requirements 25 (retirement, cash and deposits,
    gold, property, insurance-linked savings, employer equity with vesting, liabilities): type,
    institution, value, last-updated date, valuation method (manual, periodic or formula-accrued),
    liquidity class; stale after its own age as a normal state, unverified marked separately
  - Record a new valuation, and add an asset
  - Liquidity classes; concentration by issuer, sector and asset class against total net worth
    with configured limits; employer equity and salary shown as one combined exposure
  - Read-only to strategy and execution, said plainly on the screen; nothing here can be traded
  - Scope choice (decision 26): feeding these assets into allocation, goals and risk limits
    (requirements 25 "participate in") belongs to those screens' extensions (UI spec 19.2) and is
    not part of this task
────────────────────────────────────────────────────────────

────────────────────────────────────────────────────────────
SESSION:        52 — END ENTRY
AGENT:          Claude Opus 5 (claude-opus-5)
END:            2026-09-17T03:37:00Z  |  local: 2026-09-17 09:07 IST (UTC+05:30)
TASK:           S-30 Net Worth — complete picture incl. non-market assets — DONE

WHAT WAS BUILT (requirements 25; UI spec 19.1, 19.3):
  - /net-worth, linked from the side navigation under Portfolio
  - A plain notice that nothing on the screen can be traded and automation never reads it
  - Totals in the top-bar currency: net worth, assets, liabilities, market-exposed and non-market
    (with shares of assets), and the brokerage portfolio at today's prices
  - Employer exposure: vested and unvested equity plus a year's salary from the same employer as
    one figure, against a 25% limit
  - Liquidity classes as shares of total assets; concentration by asset class, issuer and sector
    against total net worth with limits (60%, 20%, 35%), over-limit items flagged
  - Manual asset register: name, institution, type, value in its own currency and in the view
    currency (liabilities negative), last updated, "Due for an update" past its own age (the normal
    state, not an error), "Unverified" separately, liquidity. Row detail: valuation method, recorded
    value, rate, maturity, issuer, purchase cost, the asset a loan is secured against, vesting
  - Record a new valuation (value, date, verified) and add an asset or liability, both validated
    inline with the same schema the mock saves with
  - Loading, error and empty states; the stale state is the per-record "Due for an update"

MOCK DATA:
  - GET /api/v1/net-worth?currency=, POST /api/v1/net-worth/assets, PUT
    /api/v1/net-worth/assets/:id/valuation; writes return the whole view
  - Eleven records across every category in requirements 25 (UI spec 19.4): EPF accruing at 8.25%,
    PPF deliberately past its 180-day age, savings, a fixed deposit accruing at 7.1%, sovereign gold
    bonds, gold jewellery never verified, an apartment with purchase cost, an endowment policy's
    surrender value, partly vested employer RSUs, a home loan secured against the apartment and a
    credit card balance; dates relative to today. Brokerage from the shared portfolio valuation

FILES CREATED:
  - data/schemas/net-worth.ts; data/mock/generators/netWorthAssets.ts and netWorthView.ts;
    data/mock/stores/netWorthStore.ts; data/mock/handlers/netWorthHandlers.ts;
    data/api/netWorthQueries.ts
  - features/netWorth/{NetWorthPage.tsx, NetWorth.module.scss, model/netWorthLabels.ts,
    sections/NetWorthSummary.tsx, ExposureSections.tsx, AssetRegister.tsx,
    RecordValuationForm.tsx, AddAssetForm.tsx}
FILES MODIFIED:
  - routes/routes.ts (NET_WORTH), routes/AppRoutes.tsx, shell/Sidebar.tsx; schemas, generators,
    handlers and api index files
  - Docs: session 49 moved verbatim to PROGRESS_ARCHIVE.md (rule 11)

DEPENDENCIES ADDED:
  - none

DECISIONS MADE:
  - none. Scope choices recorded in the start entry (decision 26): feeding these records into
    allocation, goals and risk limits is left to those screens' extensions (UI spec 19.2). Limits
    and the employer rule (equity plus a year's salary) are mock settings, stated on the screen

VERIFICATION RUN:
  type check:  PASS — exit 0
  lint:        ESLint PASS; Prettier --check PASS on apps/web/src
  build:       PASS — exit 0
  totals:      USD net worth $316,285.95; assets $382,816.34; liabilities $66,530.38;
               market-exposed $157,201.20 (41% of assets); brokerage $98,449.44 across 7 holdings
  flags:       "1 record due for an update" (Public Provident Fund, 212 days); "1 value never
               verified" (gold jewellery); Northwind Systems combined $131,286.94, 41.5% of net
               worth, above the 25% limit
  exposures:   liquidity locked 53.8%, within a month 41.1%; real estate 51.7% (limit 60%),
               Government of India 15.0% (limit 20%), information technology 18.6%
  valuation:   "abc" rejected inline; PPF recorded at 1012500.00 -> "today", the due badge and its
               count gone, net worth $317,137.16
  add:         empty form -> "Name the asset", "Say where it is held", amount error; Car loan
               600000 INR at SBI -> -$8,171.59 in the register, liabilities $74,701.98
  currency:    INR view: apartment ₹1,20,00,000.00, net worth ₹2,26,85,827.84
  states:      loading-error -> "Net worth unavailable"; empty-portfolio -> brokerage $0.00 with
               the manual records still shown; reset to healthy
  not exercised: the empty state (every scenario seeds manual records)

MISTAKES THIS SESSION (recorded per rules section 7):
  - The totals card repeated the page title "Net worth"; renamed during verification

FINDINGS (out of scope, not fixed):
  - Allocation targets, goal projections and risk concentration limits still use only the
    brokerage portfolio (requirements 25 "participate in"; UI spec 19.2 extensions)
  - Holdings has no liquidity class and does not include manual assets in its totals (UI spec 19.2)
  - The add form does not take maturity, purchase cost, vesting or a secured-against link; records
    can be added without them and there is no edit or delete for a record
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
 