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
PHASE:              Stage E rework; E-03 done, E-09 parts a and b done
OVERALL PROGRESS:   77% (72 of 93 active tasks done; Stage F 11 of 12; Stage M 16 of 17;
                    Stage L 11 of 14 + L-12 partial; Stage S 33 of 36;
                    Stage E 1 of 9, 8 partial; Stage P 0 of 5)
LAST UPDATED:       2026-09-17T13:16:00Z  |  local: 2026-09-17 18:46 IST
LAST AGENT:         session 71 (Claude Opus 5; E-04 risk panel)
BUILD STATE:        PASS (Vite 6 + React 19; single 3.5 MB chunk, see P-04)
TYPE CHECK:         PASS (pnpm typecheck, zero errors across all workspaces)
LINT:               PASS (pnpm lint: eslint . and prettier --check . over the whole repository)
BLOCKERS:           none. Owner answered the open questions (session 64); only question 12 tooling work remains as a task.
```

---

## 2. Handoff Note — Read This First

> Rewritten completely at the end of every session. Written for an agent with no memory of any previous session.

```
WHERE THINGS STAND:
  pnpm workspace monorepo, git branch main. Stages F and S are done except S-26 (screener, 90%).
  Session 59 audited sessions 53-58 and found Stage E (E-01..E-09) was mostly hardcoded display:
  fixed arrays and component state inside features, no mock endpoints, no data/api hooks, no
  loading/error states, and one fake result (every approval card says compliance "Passed").
  All nine are now PARTIAL with the precise gap written in each registry row.
  Session history older than sessions 57, 58, 59 is in PROGRESS_ARCHIVE.md (not session-start reading).

WHAT SESSION 59 COMPLETED:
  - Verified typecheck, ESLint and build pass. Found pnpm lint failing (Prettier): two files from
    sessions 56/57 unformatted, plus CRLF working copies. Fixed both; added .gitattributes
    (eol=lf) so Windows checkouts match .prettierrc endOfLine "lf". pnpm lint now passes repo-wide.
  - Reopened E-01..E-09 and S-26 as PARTIAL; added P-05 (six older files over 300 lines);
    added open question 19 (question 11 was answered by an agent, not the owner).
  - Archived sessions 55-56 verbatim (rule 11; log was 595 lines).

WHAT IS PARTIALLY DONE:
  - E-01..E-09: see each registry row for what exists and what is missing.
  - L-12: no visual regression tooling (question 12).

EXACT NEXT STEP (one task per session, in this order):
  Owner answered questions 7-10, 12-21 in session 64; decisions 43-46 record the direction.
  1. E-01 (per Q14), E-04, E-05 (per Q15), E-07 (per Q18), E-08.
  2. S-34, S-35, S-36, M-16, L-13, L-14, L-12 (Playwright), P-05, P-01..P-04.
  3. Low priority: E-09 part c (employer rules optional), F-22 (Node 22 upgrade).

SESSION 60 (M-17) ADDED: schemas inflation.ts, tax-losses.ts, counterparties.ts,
  strategy-lifecycle.ts; generators inflationHistory, taxLossCarryForward, counterpartyProfiles,
  strategyLifecycle; handlers/partTwoReferenceHandlers.ts; api/partTwoReferenceQueries.ts.

WATCH OUT FOR:
  - Do not mark a task DONE because the UI renders. Stage E was marked DONE with no data layer.
    Every Stage E section must fetch through data/api hooks and render loading/error/empty states.
  - Run the full `pnpm lint` (repo-wide), not prettier on a hand-picked list of files.
  - Strict 300 lines limit per file (decision 18). Always split components/generators before 300 lines.
  - Library component props: check packages/ui/src/index.ts. Badge variants include positive,
    negative, neutral, critical, info. LoadingState: table, cards, chart, detail. DataTable page
    sizes 10/20/50/100. Toggle is a React Aria Switch (isSelected, onChange, isDisabled, aria-label).
  - A validation rule must describe something truly invalid. Check it against real-world data
    before making it an error; a note on the form is often the right answer.
  - Anything that should reset a component when a selection changes must be in its key.
  - Money in a DTO is a string amount; formatMoney needs moneyFromDto. Convert currencies through
    convertMoneyWithTable before comparing. Never Number()/parseFloat a money amount.
  - One story across screens: derive from existing generators instead of seeding new numbers.
  - Prettier expands objects one field per line; check line counts and split before 300.
  - Screens fetch only through data/api hooks (decision 22); writes return the full set
    (decision 33); shared mock state lives in data/mock/stores (decision 37).
  - Shared UI lives in apps/web/src/shared (decision 25); features never import each other.
  - Browser pane: typing does not reach native time and date inputs, and label clicks may not reach
    wrapped inputs. Set the value with the native HTMLInputElement value setter and dispatch an
    input event, which runs React's onChange. Mock stores reset on a full navigation. Modal content
    is portalled outside <main>. Set the scenario with setActiveDeveloperScenario in one tab and
    reset it to 'healthy'. Screenshots can come back blank; read the DOM instead.
  - Stale modules: restart the preview; if that fails, delete apps/web/node_modules/.vite.
  - The Bash tool mangles heredocs containing quotes and backticks; write files with the
    file-writing tool. Multi-line in-place edits are reliable through a small python script.
  - packages/ui must NEVER import from apps/web or domain DTOs.
  - Two files differing only in case (configFields.ts / ConfigFields.tsx) break the build on
    Windows. Pick a distinct name.
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
| L-12 | Visual regression test setup | PARTIAL | 20 | Antigravity (Gemini 3.8 Flash) | **REOPENED session 36.** `verify_stage_l.ts` is not in the repository and README pointed at `C:\Users\kathiravan\.gemini\antigravity-ide\...\scratch\` — another machine's path. No visual regression tooling exists (no Playwright, no baselines, no runner). The story registry is real and is the only part delivered **Owner Q12 session 64:** Playwright screenshot baselines, local only, key screens in dark and light. |
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
| S-26 | Markets — Screener | DONE | 100 | Session 56; fixed session 61 | Raised session 36. Unblocked session 56 (Open Question 11 answered). Multi-factor screener across 4 pillars (Quality, Valuation, Technical Momentum, and Compliance/Automation readiness) with 5 presets, CSV export, and workflow handoffs. **Audit session 59:** compliance status and automation permission are fixed seed values, not read from the compliance store or automation configuration; INFY is restricted on /compliance but ALLOWED in the screener. Open question 11 was answered by an agent, not the owner (see question 19) **Session 61:** compliance status and automation permission now derived per request from the compliance store and saved configurations (decision 42); verified |
| S-27 | Trading — Positions | DONE | 100 | Session 49 | Open question 10 answered provisionally (decision 26): distinct from Holdings — only strategy-opened positions, with what the strategy stage does at the stop, distance and value lost to the stop, rules, working orders and an attention banner; all states verified |
| S-28 | Configuration — credentials | DONE | 100 | Session 50 | Register of credential references on the configuration pattern: no secret field, key-as-reference rejected, /simulation/ segment separates simulation from live, read-only or trading access, expiry with warnings, revoke, usage from provider and broker configs, unregistered references called out, audit log; verified |
| S-29 | Automation permission summary | DONE | 100 | Session 51 | /settings/automation: market by instrument type grid (live, simulation or blocked with the blocking layer; every layer on selection) and per-strategy results by instrument, computed from the saved configurations and strategy stages; linked from the side navigation; verified |
| S-30 | Net Worth — complete picture incl. non-market assets | DONE | 100 | Session 52 | /net-worth: totals with market-exposed and non-market, manual register across every requirements-25 category (stale as normal, unverified separate), record valuation and add, liquidity, concentration against total net worth, employer equity plus salary as one exposure, read-only notice; feeding allocation, goals and risk left to 19.2 extensions; verified |
| S-31 | Decision Journal | DONE | 100 | Session 53 | Raised session 37. Requirements 29, UI spec 19.1. Reason captured at the time of every manual trade and override, outcome attached later, behaviour patterns surfaced (override repetition, post-loss clustering, target drift); verified |
| S-32 | Continuity — succession, nominee and emergency access | DONE | 100 | Session 54 | Raised session 37. Requirements 28, UI spec 19.1. Institution register with one-click confirmation, recovery points without credentials, emergency drill playbook and log, inactivity pause countdown; verified |
| S-33 | Compliance — employer and jurisdictional restrictions | DONE | 100 | Session 55 | Raised session 37. Requirements 27, UI spec 19.1. Restricted list, blackout windows, pre-clearance, minimum holding periods, pre-trade eligibility checker ("May I trade this right now, and why not?"), refusals log intercepted at signal stage; verified |
| S-34 | Screener factors from price history and fundamentals | TODO | 0 | | Owner Q19 session 64: price, RSI, SMA distance from M-04 price history; P/E, ROE, yield from fundamentals (S-04) instead of fixed seeds |
| S-35 | Portfolio Performance links to the full performance report | TODO | 0 | | Owner Q9 session 64: small; link S-25 quick view to Reports performance with the same period |
| S-36 | Continuity — backup nominee and drill schedule | TODO | 0 | | Owner Q17 session 64: second view-only nominee, drill due every 6 to 12 months with overdue state |
 
### Stage E — Requirements Part II Extensions To Existing Screens
 
Raised session 37. Each extends a screen that is already built, so each is small on its own but must
not be folded silently into an unrelated task. See UI spec 19.2.
 
| ID | Task | Status | % | Agent | Notes |
|----|------|--------|---|-------|-------|
| E-01 | Holdings — liquidity class; non-market assets in totals | DONE | 100 | Session 57; reworked session 70 | Requirements 25, 30; UI spec 19.2. Liquidity class per position (days, weeks, months or longer) from settlement and manual-only types, column and summary; non-market assets excluded (decision 44); verified session 70 |
| E-02 | Position Detail — tax category, holding-period boundary, cost of disposing today | DONE | 100 | Session 57; reworked session 67 | Requirements 26, 30; UI spec 19.2. Lot treatment and days to long term from the residence tax rule set; cost of disposing today with market fees, purchase-date FX, loss netting, carried-forward losses and exemption; verified session 67 |
| E-03 | Orders & Approval Queue — compliance result, cooling-off countdown, reason prompt | DONE | 100 | Session 57; reworked sessions 63, 65 | Requirements 27, 29, 33; UI spec 19.2. Approval queue: real compliance result beside risk checks, cooling off after approval with withdraw, stated reason; enforced by the server; safeguards configurable. Orders: compliance for working orders, restricted alert, cooling-off badge. Verified sessions 63 and 65 |
| E-04 | Risk & Safety — counterparty exposure; compliance limits shown beside risk limits | DONE | 100 | Session 57; reworked session 71 | Requirements 27, 32; UI spec 19.2. Counterparty share of the traded portfolio from holdings with over-weight flag and protection cover; compliance limits from the compliance record; loading/error/empty states; verified session 71 |
| E-05 | System Health — independent depository/registrar reconciliation status | PARTIAL | 15 | Session 57; audited session 59 | UI only: hardcoded accounts with unmasked account numbers; "Reconcile now" is a 1.2s timer that always reports 0 discrepancies. Needs a mock endpoint, a seeded discrepancy and states **Owner Q15 session 64:** broker is the record of truth; a mismatch raises an alert and pauses automation for that account. |
| E-06 | Reports — real returns, per-jurisdiction tax pack, cost and tax as share of gross return | DONE | 100 | Session 57; reworked session 68 | Requirements 26, 30, 31; UI spec 19.2. Real return and real benchmark from recorded inflation or assumption; costs and tax as share of gross gain; tax pack for the residence country (gains by asset class, income with withholding and foreign tax credit, losses carried forward, foreign holdings, remittance cap); verified session 68 |
| E-07 | Planning — emergency reserve, liquidity ladder, commitments, withdrawal phase, ranged projections | PARTIAL | 20 | Session 57; audited session 59 | UI only: component-state reserve and fixed ladder. Missing: known commitments against projected liquidity, ranged projections with stated assumptions, data from the mock layer **Owner Q18 session 64:** reserve target 6 months (configurable); automation reduced above a configurable share of automated positions, default 30%. |
| E-08 | Strategy Library — retirement criteria, standing against them, demotion history, cross-correlation | PARTIAL | 20 | Session 57; audited session 59 | UI only: fixed demotion log and correlation matrix in the feature folder. Missing: retirement criteria set at promotion, standing computed from results, correlation from return series |
| E-09 | Configuration — tax rule sets, inflation assumptions, employer policy, export, cost budget | PARTIAL | 85 | Session 57; audited 59; parts a/b sessions 62, 66 | Requirements 26, 27, 30, 34; UI spec 19.2. **Done:** inflation assumptions, cost budget, counterparty threshold, decision safeguards and export settings (/settings/assumptions); tax rule sets per residence country and asset class replacing per-market rates (/settings/tax-rules, decision 45). **Remaining (low priority, decision 43):** employer policy rules as configuration read by the compliance store |
 
### Stage P — Polish
 
| ID | Task | Status | % | Agent | Notes |
|----|------|--------|---|-------|-------|
| P-01 | Responsive pass | TODO | 0 | | |
| P-02 | Accessibility pass | TODO | 0 | | |
| P-03 | Full state review across all screens | TODO | 0 | | |
| P-04 | Performance and bundle budget | TODO | 0 | | |
| P-05 | Split the files over 300 lines (decision 18) | TODO | 0 | | Raised session 59: strategyEditor/sections/SettingsSections.tsx 386, trading/orders/sections/OrdersView.tsx 337, shell/TopBar.module.scss 337, health/Health.module.scss 307, markets/watchlists/sections/WatchlistsView.tsx 301, markets/workspace/WorkspacePage.module.scss 301 |
 
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

> Sessions 0 to 65 have been archived to [PROGRESS_ARCHIVE.md](./PROGRESS_ARCHIVE.md).
> Only the last three sessions are kept here, per rule 11. Open the archive only when you need
> a specific past session - it is not session-start reading.

```
────────────────────────────────────────────────────────────
SESSION:        66 — START ENTRY
AGENT:          Claude Opus 5
START:          2026-09-17T09:34:00Z  |  local: 2026-09-17 15:04 IST (UTC+05:30)
TASK CLAIMED:   E-09 part b: tax rule sets per residence country and asset class (decision 45)
OWNER INPUT:    session 64 answers to questions 16 and 20

PRE-WORK VERIFICATION:
  git: 74df89f; working tree clean; type check, lint, build PASS at session 65 end.

SCOPE:
  - Versioned config area /api/v1/config/tax-rules: per residence country (India seeded): tax year
    start, cost-basis method, loss carry-forward years, per asset class holding period, short and
    long rates and long-term exemption, historical cost-basis protections, foreign asset obligations.
  - shared/tax: classify an instrument into a tax asset class for the residence country; rule lookup.
  - Remove the gains rates and holding periods from market config (keep dividend withholding),
    instrument type config (taxThresholdDays) and MarketDto (holdingPeriodTaxThresholdDays).
  - Holdings tax status, the tax report and the loss carry-forward window read the rule set.
  - /settings/tax-rules page with form, health and version history.
────────────────────────────────────────────────────────────
```

```
────────────────────────────────────────────────────────────
SESSION:        66 — END ENTRY
AGENT:          Claude Opus 5
START:          2026-09-17T09:34:00Z  |  local: 2026-09-17 15:04 IST (UTC+05:30)
END:            2026-09-17T09:46:00Z  |  local: 2026-09-17 15:16 IST (UTC+05:30)
TASK CLAIMED:   E-09 part b (tax rule sets)
END STATUS:     PARTIAL (E-09 parts a and b done; part c, employer rules, low priority per decision 43)

COMPLETED:
  - Tax rule sets (decision 45): schema config-tax-rules.ts; versioned area /api/v1/config/tax-rules
    keyed by country, no create; server check keeps exactly one residence; health compares held
    asset classes with the rules. Seed: India residence, FY from 1 April, FIFO, 8-year loss
    carry-forward; domestic equity and equity funds 20%/12.5% after 365 days with 1.25 lakh
    exemption; foreign shares 30%/12.5% after 730 days; debt 30%; gold 30%/12.5% after 730 days;
    other 30%; 2018 grandfathering protection; foreign asset disclosure, 250,000 USD remittance cap,
    foreign tax credit. Version 1 holds the pre-July-2024 rules.
  - shared/tax/taxRules.ts: tax asset class from instrument type and listing vs residence; rule lookup.
  - Removed gains rates and holding periods from market config (now "Tax at source": dividend
    withholding only; market IN history now a withholding change), from instrument types
    (taxThresholdDays) and from MarketDto (holdingPeriodTaxThresholdDays).
  - Holdings lot tax status, the tax report (per-class rates, yearly long-term exemption relief,
    asset class shown per lot, notes) and the loss carry-forward window read the residence rules.
  - /settings/tax-rules page: residence, tax year, cost basis, carry-forward, per-class rules with
    add/remove, cost basis protections, foreign assets, version history; loading/error/empty states;
    SettingsNav "Tax rules".

VERIFICATION RUN:
  type check PASS; lint PASS (repo-wide); build PASS.
  Browser: tax rules page renders "IN (residence) · 6 asset classes · v2 · Healthy"; PUT with
  isResidence false → 400 "One rule set must be the country of residence"; tax report (INR) lots show
  "AAPL (Foreign shares and funds)" 731 days Long term 12.5%, 252 days Short term 30%, note cites the
  IN residence rules; loss windows FY 2026-27 / 2029-30 / 2032-33; markets settings shows "Tax at
  source" with dividend withholding only; holdings shows "Mixed: 1 of 3 lots long term".
  Themes not re-checked (existing config components only).

NOT COMPLETED:
  - E-09 part c (employer policy rules as configuration), low priority (decision 43).
  - Remittance cap tracking against actual outward transfers and the foreign asset disclosure
    schedule belong to E-06 (tax pack).

FILES: created schemas/config-tax-rules.ts, shared/tax/taxRules.ts, generators/taxRulesConfig.ts,
  stores/taxRulesStore.ts, handlers/taxRulesConfigHandlers.ts, api/taxRulesConfigQueries.ts,
  features/settings/SettingsTaxRulesPage.tsx, features/settings/taxRules/{model/taxRulesDraft.ts,
  sections/TaxRulesView.tsx, TaxRuleSetForm.tsx, AssetClassRulesCard.tsx, ForeignAssetsCard.tsx};
  modified config-markets.ts, config-instruments.ts, markets.ts (schema and generator),
  marketConfig.ts, instrumentTypeConfig.ts, reportValuation.ts, reportTaxBuilder.ts,
  taxLossCarryForward.ts, portfolioValuation.ts, partTwoReferenceHandlers.ts, holdingRows.ts,
  useHoldingsData.ts, marketDraft.ts, MarketCalendarRules.tsx, instrumentDraft.ts,
  InstrumentTypeForm.tsx, routes, SettingsNav, index files.
────────────────────────────────────────────────────────────
```

```
────────────────────────────────────────────────────────────
SESSION:        67 — START ENTRY
AGENT:          Claude Opus 5
START:          2026-09-17T09:46:00Z  |  local: 2026-09-17 15:16 IST (UTC+05:30)
TASK CLAIMED:   E-02 Position Detail — tax category, holding-period boundary, cost of disposing today
OWNER INPUT:    "fix and complete the pending items one by one"; decision 26

PRE-WORK VERIFICATION:
  git: 307e707; working tree clean; type check, lint, build PASS at session 66 end.

SCOPE:
  - Pure disposal estimate: lots taken by the residence cost-basis method, holding period and rates
    per asset class from the tax rule set, gains in the residence currency at purchase-date and
    today's FX, market fees and transaction tax from market config, carried-forward losses offset
    by category, yearly long-term exemption, net cash.
  - Rebuild PositionDisposalEstimator on it with data hooks, loading/error states and an SCSS module;
    remove hardcoded 30%/15%/365, fee constants, inline styles and undefined colour tokens.
────────────────────────────────────────────────────────────
```

```
────────────────────────────────────────────────────────────
SESSION:        67 — END ENTRY
AGENT:          Claude Opus 5
START:          2026-09-17T09:46:00Z  |  local: 2026-09-17 15:16 IST (UTC+05:30)
END:            2026-09-17T09:53:00Z  |  local: 2026-09-17 15:23 IST (UTC+05:30)
TASK CLAIMED:   E-02 Position Detail tax and disposal
END STATUS:     DONE

COMPLETED:
  - model/disposalEstimate.ts (pure): lot tax view (short, long or no distinction; days to long term)
    from the residence rule for the instrument's asset class; disposal estimate taking lots by the
    residence cost-basis method (FIFO or average), gains in the residence currency at each lot's
    purchase-date FX and today's FX, fees from market config (commission with minimum, exchange fee,
    transaction tax), this sale's short-term loss netted against its long-term gain, carried-forward
    losses by category, yearly long-term exemption, tax and cash after costs.
  - PositionDisposalEstimator rebuilt on it: data hooks (tax rules, market configs, FX rates and
    history, losses carried forward) with loading and error states; SCSS module; no inline styles,
    no hardcoded rates, holding period or fees, no undefined colour tokens.

VERIFICATION RUN:
  type check PASS; lint PASS (repo-wide); build PASS.
  Browser, AAPL Tax & Disposal tab: "Foreign shares and funds · IN rules"; lot bought 2024-09-16
  (731 days) Long term, 252 days "478 days to long term" (730-day rule); selling 107 units: short-term
  loss -35,300 INR netted against long-term gain 89,727 INR, carried-forward losses used 54,427 INR,
  tax 0; selling 29 units (oldest lot) long-term gain 89,365 INR fully offset by losses.
  Model checked by hand in the page (domestic listed shares, no losses): gross 2000 INR, fees 3
  (5 bps + 10 bps), short gain 250 → 50 tax at 20%, long gain 500 exempt → total 50; with the
  exemption set to 0, 112.50. Themes not re-checked (tokens only, no new colours).

NOTES:
  - The long-term exemption is applied in full to one sale ("assumes no other long-term gains this tax
    year"); a year-to-date view belongs to E-06.

FILES: created position/model/disposalEstimate.ts, position/sections/DisposalEstimator.module.scss;
  rewritten position/sections/PositionDisposalEstimator.tsx.
────────────────────────────────────────────────────────────
```

```
────────────────────────────────────────────────────────────
SESSION:        68 — START ENTRY
AGENT:          Claude Opus 5
START:          2026-09-17T09:53:00Z  |  local: 2026-09-17 15:23 IST (UTC+05:30)
TASK CLAIMED:   E-06 Reports — real returns, tax pack, cost and tax as share of gross return
OWNER INPUT:    session 64 answer to question 16 (India resident, foreign stocks)

PRE-WORK VERIFICATION:
  git: f466fa8; working tree clean; type check, lint, build PASS at session 67 end.

SCOPE:
  - Performance report (server): real time-weighted return from recorded inflation or the saved
    assumption for the report currency's country, real benchmark return when comparing, and costs
    plus estimated tax as a share of gross gain.
  - Tax report (server): gains by asset class, dividends by country with withholding and foreign tax
    credit, losses carried forward with expiry, foreign holdings for annual disclosure, remittance
    used against the yearly cap; gains measured at purchase-date FX.
  - Remove the hardcoded RealReturnsComparisonSection and JurisdictionTaxPackSection; the existing
    report tables and CSV export carry the pack.
────────────────────────────────────────────────────────────
```

```
────────────────────────────────────────────────────────────
SESSION:        68 — END ENTRY
AGENT:          Claude Opus 5
START:          2026-09-17T09:53:00Z  |  local: 2026-09-17 15:23 IST (UTC+05:30)
END:            2026-09-17T10:00:00Z  |  local: 2026-09-17 15:30 IST (UTC+05:30)
TASK CLAIMED:   E-06 Reports
END STATUS:     DONE

COMPLETED:
  - Reports receive reference data (ReportReferences: inflation history, inflation assumptions,
    losses carried forward) from the handler.
  - Performance report: "Real return (after inflation)" deflating the time-weighted return by the
    recorded monthly index for the report currency's country (US/IN/GB) or the saved assumption, with
    the benchmark deflated the same way when comparing ("benchmark alternative comparison"); "Costs
    and tax as share of gross gain".
  - Tax report: gains now use purchase-date FX for cost; new "Unrealised gains by asset class" table;
    tax pack (reportTaxPack.ts) adds dividends by source country with withholding and foreign tax
    credit, losses carried forward with expiry, foreign holdings for the annual disclosure, and money
    sent abroad this tax year against the remittance cap; notes on tax year and disclosure.
  - Deleted the hardcoded RealReturnsComparisonSection and JurisdictionTaxPackSection; the report's
    own tables and CSV export carry the figures.

VERIFICATION RUN:
  type check PASS; lint PASS (repo-wide); build PASS.
  API (INR, 2025-09-17 to today, benchmark): TWR -2.80% vs benchmark -3.56%; real -6.18% vs -6.91%
  "less 3.60% inflation … recorded IN inflation"; drag "No gross gain in the period" (gain negative).
  EUR report: real return "No inflation figures". Tax report (FY from 2026-04-01): classes table
  foreign +443,903.66 LT, gold -1,240,247.83 LT, domestic -18,728.56 LT, summing to the long-term
  metric -815,072.73; losses table 3 rows (FY 2018-19 expiring soon); foreign holdings 6 rows;
  remitted 8,432.64 USD, 3.4% of 250,000 USD. /reports/tax page renders every new table.

FINDINGS:
  - Seeded gold (XAUUSD) shows a -1.24M INR long-term loss; mock price history, left as is.
  - Realised gains remain zero: the mock transaction record has no sales.

FILES: created generators/reportRealReturns.ts, generators/reportTaxPack.ts; modified reportParts.ts,
  reports.ts, reportTaxBuilder.ts, reportCashBuilders.ts (exports), portfolioPerformance.ts,
  handlers/reportHandlers.ts, features/reports/sections/ReportBody.tsx; deleted
  features/reports/sections/{RealReturnsComparisonSection,JurisdictionTaxPackSection}.tsx.
────────────────────────────────────────────────────────────
```

```
────────────────────────────────────────────────────────────
SESSION:        69 — START ENTRY
AGENT:          Claude Opus 5
START:          2026-09-17T12:57:00Z  |  local: 2026-09-17 18:27 IST (UTC+05:30)
TASK CLAIMED:   M-16 Manual-only instrument type in mock data
OWNER INPUT:    "other than polish complete the remaining items"; decision 26

PRE-WORK VERIFICATION:
  git: 2d76422; working tree clean; type check, lint, build PASS at session 68 end.

SCOPE:
  - Add instrument type `unlisted` (private placements and other holdings with no exchange),
    seeded manual-only with automation off; the private secured note moves to it; permitted in the
    US market configuration so its holding is covered.
  - Update every per-type lookup the type checker names; tax class for unlisted is debt.
────────────────────────────────────────────────────────────
```

```
────────────────────────────────────────────────────────────
SESSION:        69 — END ENTRY
AGENT:          Claude Opus 5
START:          2026-09-17T12:57:00Z  |  local: 2026-09-17 18:27 IST (UTC+05:30)
END:            2026-09-17T13:03:00Z  |  local: 2026-09-17 18:33 IST (UTC+05:30)
TASK CLAIMED:   M-16 Manual-only instrument type
END STATUS:     DONE

COMPLETED:
  - Instrument type `unlisted` added to InstrumentTypeSchema; seeded manual-only with automation
    never permitted, 10-day settlement and a 10,000 minimum order value.
  - The private secured note (PRIV-NOTE) is now `unlisted`; the private placement broker carries
    `unlisted`; the US market permits it. Price history, net worth asset class (fixed income), tax
    class (debt) and the workspace default layout treat it like a bond.

VERIFICATION RUN:
  type check PASS; lint PASS; build PASS. API: instrument types list shows unlisted enabled,
  manualOnly true, automationPermitted false, markets [US], health "1 market; 1 held"; PRIV-NOTE type
  unlisted with a holding worth 4,442.68 USD.

FILES: schemas/instruments.ts; generators/{instrumentTypeConfig,canonicalInstruments,markets,
  brokerConfig,netWorthView,priceHistory}.ts; workspace/model/workspaceLayout.ts; shared/tax/taxRules.ts.
────────────────────────────────────────────────────────────
```

```
────────────────────────────────────────────────────────────
SESSION:        70
AGENT:          Claude Opus 5
START:          2026-09-17T13:04:00Z  |  local: 2026-09-17 18:34 IST (UTC+05:30)
END:            2026-09-17T13:11:00Z  |  local: 2026-09-17 18:41 IST (UTC+05:30)
TASK CLAIMED:   E-01 Holdings — liquidity class per position (owner Q14: traded portfolio only)
END STATUS:     DONE

COMPLETED:
  - shared/liquidity/liquidityClass.ts: days (settles within 5 business days), weeks (longer
    settlement), months or longer (manual-only types, no exchange); shared so Planning (E-07) uses it.
  - Holding rows carry liquidity from the instrument type's settlement override or the market's
    settlement cycle, and the type's manual-only flag (useInstrumentTypeConfigs added to holdings).
  - Liquidity column (visible by default, in export) and a rewritten summary: value, share and count
    per class from the rows. Removed the non-market assets toggle, useNetWorth, the type assertion,
    parseFloat on money and inline styles (decision 44). Defined the missing .liquiditySub style and
    removed the unused .nonMarketCard.
  - holdingColumns.tsx (was 295 lines) split: helpers moved to columns/columnHelpers.tsx.

VERIFICATION RUN:
  type check PASS; lint PASS; build PASS. Browser: summary "Days $94,006.76 · 95.5% · 6 positions;
  Weeks $0.00; Months or longer $4,442.68 · 4.5% · 1 position" (the unlisted note); table rows show
  "Days · Settles T+1" for AAPL and SPY, "Settles T+0" for BTCUSD. Themes not re-checked (existing
  classes only).

FILES: created shared/liquidity/liquidityClass.ts, holdings/columns/columnHelpers.tsx; modified
  holdings/{columns/holdingColumns.tsx, model/holdingTypes.ts, model/holdingRows.ts,
  model/holdingsExport.ts, useHoldingsData.ts, sections/HoldingsLiquiditySummary.tsx,
  HoldingsPage.module.scss}.
────────────────────────────────────────────────────────────
```

```
────────────────────────────────────────────────────────────
SESSION:        71
AGENT:          Claude Opus 5
START:          2026-09-17T13:12:00Z  |  local: 2026-09-17 18:42 IST (UTC+05:30)
END:            2026-09-17T13:16:00Z  |  local: 2026-09-17 18:46 IST (UTC+05:30)
TASK CLAIMED:   E-04 Risk & Safety — counterparty exposure; compliance limits beside risk limits
END STATUS:     DONE

COMPLETED:
  - GET /api/v1/risk/counterparty-exposure (generators/counterpartyExposure.ts): holdings summed by
    broker into counterparty profiles, converted to the portfolio currency, share of the traded
    portfolio (decision 44), over-weight flag against the saved threshold, protection cover and the
    value above it. useCounterpartyExposure; saving the operating policy refreshes it.
  - CounterpartyExposureSection and ComplianceLimitsPanel rewritten on data hooks with loading,
    error and empty states and an SCSS module (Risk.module.scss is at 299 lines); removed fixed
    arrays (including counterparties not in the data: Chase, E*TRADE), inline styles, the undefined
    --color-warning token and the link to the wrong settings page.
  - Wording of the threshold changed from "net worth" to "portfolio" in schema comments, the
    operating policy form and its version description (decision 44).
  - Fixed a zero check in the E-02 estimator: decimal.js isPositive() is true for zero.

VERIFICATION RUN:
  type check PASS; lint PASS; build PASS. Browser /risk/limits: compliance "2 active" blackouts with
  days left, 5 restricted, 3 locks (AAPL, MSFT, RELIANCE), 4 refusals; counterparty exposure
  "Interactive Brokers LLC holds more than 25% of the $98,449.44 portfolio", IBKR 90.3% flagged,
  Hargreaves Lansdown 4.6% with FSCS cover $94,018.50, Private Placement Agent 4.5% no scheme,
  Zerodha 0.6%. After the fix no "$0.00 is above it" text.

FILES: created generators/counterpartyExposure.ts, risk/sections/RiskPanels.module.scss; modified
  schemas/counterparties.ts, schemas/config-assumptions.ts, generators/{index,counterpartyProfiles}.ts,
  handlers/partTwoReferenceHandlers.ts, api/{partTwoReferenceQueries,assumptionsConfigQueries,index}.ts,
  risk/sections/{CounterpartyExposureSection,ComplianceLimitsPanel}.tsx,
  settings/assumptions/{sections/OperatingPolicyForm.tsx, model/assumptionsDraft.ts},
  position/sections/PositionDisposalEstimator.tsx.
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
 
---
 
## 6. Decision Record (Append Only)
 
> Moved to [DECISIONS.md](./DECISIONS.md) - required reading at every session start.
 
All 38 decisions, plus decision 39 recording this restructure, now live in `DECISIONS.md`.
Append new decisions there, not here.
 