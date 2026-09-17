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
PHASE:              Research (Stage R) in progress; Polish (Stage P) and F-22 remain
OVERALL PROGRESS:   82% (88 of 107 active tasks done; Stage F 11 of 12; Stage M 17 of 17;
                    Stage L 14 of 14; Stage S 36 of 36; Stage E 9 of 9; Stage R 1 of 14; Stage P 0 of 5)
LAST UPDATED:       2026-09-18T01:00:00Z  |  local: 2026-09-18 06:30 IST
LAST AGENT:         Claude Opus 5 (session 84)
BUILD STATE:        PASS (pnpm build, session 84)
TYPE CHECK:         PASS (pnpm typecheck, zero errors across all workspaces)
LINT:               PASS (pnpm lint: eslint . and prettier --check . over the whole repository)
BLOCKERS:           none. R-02 is next and needs no new data.
```

---

## 2. Handoff Note — Read This First

> Rewritten completely at the end of every session. Written for an agent with no memory of any previous session.

```
WHERE THINGS STAND:
  pnpm workspace monorepo, git branch main. Stages M, L, S and E are DONE; session 82 finished the
  design system; session 83 specified Stage R (requirements Part III, UI spec 20, decisions 48-54);
  session 84 built R-01, the classification and corporate structure data layer. R-02 is next.

WHAT R-01 ADDED (session 84, data layer only, no screen changes):
  - data/schemas/classification.ts: instrument classification (sector/industry for a company, asset
    class otherwise, provider mappings kept), corporate structure (parent, group, related listed
    companies), ownership points over eight quarters, and an ownership response that carries either
    the pattern or the reason there is none.
  - data/mock/generators/: classificationTaxonomy.ts (11 sectors, 30 industries, slug ids),
    classificationAssignments.ts (symbol to industry, asset classes, provider mappings, groups),
    classification.ts (generator plus sectorNameForSymbol, peerSymbolsForSymbol),
    corporateStructure.ts (parents, relatives, groupSymbolsForSymbol), ownershipPattern.ts.
  - Endpoints: GET /api/v1/classification/taxonomy, and per instrument /classification, /structure,
    /ownership. Hooks: useClassificationTaxonomy, useInstrumentClassification, useCorporateStructure,
    useInstrumentOwnership.
  - The SECTORS map in researchData.ts is now derived from the taxonomy, and the screener's rows
    take their sector from it in screenerFactors.ts. There is one sector source, as decision 49 says.

EXACT NEXT STEP (one task per session, in this order):
  1. R-02: wire the classification into the screens that need it. The data is there and verified.
     - Overview allocation: features/overview/sections/AllocationSection.tsx still says sector is
       "not in the data yet".
     - Holdings: sector, industry and group columns, and grouping by them.
     - Planning: sector targets already work through SECTORS; check nothing else needs changing.
     - Screener: apply criteria.sectors, which the engine currently ignores (see findings), and
       build the filter list from useClassificationTaxonomy instead of row values.
  2. R-03 group exposure and fund look-through, then R-04..R-06 data, then R-07..R-13 screens.
  3. R-14 is a one-line fix; fold it into any task touching ResearchSections.tsx.
  4. P-05, P-01..P-04 when the owner asks for polish; F-22 last.

WATCH OUT FOR:
  - Sector and industry have exactly one source now: classificationAssignments.ts. Do not add a
    second table. A new symbol needs an entry there, and its industry must exist in the taxonomy or
    placementForIndustry throws (deliberately).
  - Screener symbols that are not canonical instruments (MSFT, TCS, HDFCBANK and so on) have no
    instrument id, so /classification cannot be called for them. They classify by symbol through
    classificationLabelForSymbol. R-02 and R-13 need to keep using the symbol path for those.
  - Ownership percentages must add up to 100 (schema refine) and a pledge cannot exist without a
    promoter holding. Promoter fields are null where the market does not report them, which is not
    the same as zero: HDFCBANK reports zero, AAPL reports nothing.
  - Statements (R-05) must tie to price history (decision 19) and carry publication dates
    (decision 50): assets = liabilities + equity, EPS from net profit and shares.
  - Do not mark a task DONE because the UI renders. Every section fetches through data/api hooks and
    renders loading, empty, error and stale states.
  - Run the full `pnpm lint` (repo-wide), not prettier on a hand-picked list of files.
  - Strict 300 lines limit per file (decision 18). Always split before 300.
  - Library component props: check packages/ui/src/index.ts. Badge variants include positive,
    negative, neutral, critical, info. LoadingState: table, cards, chart, detail. DataTable page
    sizes 10/20/50/100. Toggle is a React Aria Switch (isSelected, onChange, isDisabled, aria-label).
  - Money in a DTO is a string amount; formatMoney needs moneyFromDto. Convert currencies through
    convertMoneyWithTable before comparing. Never Number()/parseFloat a money amount.
  - Screens fetch only through data/api hooks (decision 22); writes return the full set
    (decision 33); shared mock state lives in data/mock/stores (decision 37).
  - Shared UI lives in apps/web/src/shared (decision 25); features never import each other.
  - A generator that passes a parsed DTO back into a schema needs the z.input shape, not the output
    type: branded Percentage and IsoDate values assign to number and string, but the other way
    round does not compile. Annotate with `satisfies Omit<z.input<typeof Schema>, ...>` instead of
    asserting.
  - Browser pane: the first /api/* fetch after a page load can return the shell before MSW is
    listening; repeat the fetch rather than concluding the endpoint is broken. Typing does not reach
    native time and date inputs. Mock stores reset on a full navigation. Modal content is portalled
    outside <main>. Screenshots can come back blank; read the DOM instead.
  - Stale modules: restart the preview; if that fails, delete apps/web/node_modules/.vite.
  - The Bash tool mangles heredocs containing quotes and backticks; write files with the
    file-writing tool. Multi-line in-place edits are reliable through a small python script.
  - packages/ui must NEVER import from apps/web or domain DTOs.
  - Open findings: the screener ignores criteria.sectors (R-02); planning shows 78% "Not classified"
    because funds and commodities dominate, which R-03 look-through addresses; only one Tata company
    is held, so group exposure needs a second held group company to be visible (R-03); market cap is
    formatted with Number() in ResearchSections.tsx (R-14); configuration is not read by the rest of
    the app; the kill switch has no confirmation or record; chart theme colours hardcoded hex; single
    large JS chunk (P-04); Node 20.11 blocks ESLint 10 and Vite 7 (Q7, Q8).
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
| R-02 | Classification wired into the screens that already need it — Overview sector allocation, Holdings sector/industry/group columns and grouping, Planning sector targets, Screener shared sector list | TODO | 0 | | UI spec 20.2. Fixes AllocationSection.tsx "not in the data yet" and the Planning/Screener name mismatch |
| R-03 | Group exposure and fund look-through — group limit beside the sector limit on Risk & Safety, both counting exposure held through funds | TODO | 0 | | Requirements 36; decision 51. Makes riskLimits.ts "global-sector" measurable |
| R-04 | Company research record — profile, business description, segment and geography revenue, key people, auditor; schema, generator, endpoint | TODO | 0 | | Requirements 35 |
| R-05 | Financial statements — schema and coherent generator: five years annual, eight quarters interim, consolidated and standalone, publication and restatement dates | TODO | 0 | | Requirements 37; decision 50. Must tie to price history (decision 19) |
| R-06 | shared/fundamentals — derived measures, industry medians and warning flags as pure decimal.js functions over the stored statements | TODO | 0 | | Requirements 37; decision 53. Mirrors shared/indicators (decision 30) |
| R-07 | Company Research screen shell and Overview tab — profile, classification and group, size, headline measures against the industry median, open warning flags, next scheduled event | TODO | 0 | | UI spec 20.1 |
| R-08 | Financials tab — three statements, annual/quarterly and consolidated/standalone toggles, five periods with change per line, trend charts from existing presets | TODO | 0 | | UI spec 20.1 |
| R-09 | Ratios tab — valuation, profitability, health, growth, cash quality, each with own trend, industry median and visible inputs; peer comparison | TODO | 0 | | UI spec 20.1 |
| R-10 | Ownership tab — ownership over time, promoter pledge trend, insider transactions, group structure list with holdings marked | TODO | 0 | | UI spec 20.1; requirements 36 |
| R-11 | News, events and filings tab — instrument feed with indirect (parent/group/peer) items marked, filings, corporate actions effective vs announced, forward event strip with restriction windows | TODO | 0 | | Requirements 38; UI spec 20.1 |
| R-12 | Surfacing across existing screens — Workspace right-panel summary and link, Position Detail company card, News & Events group and sector filters | TODO | 0 | | UI spec 20.2 |
| R-13 | Screener factors from statements — debt to equity, return on capital employed, growth, cash quality | TODO | 0 | | UI spec 20.2; extends S-34 |
| R-14 | Fix: market cap formatted with Number() in features/markets/workspace/sections/ResearchSections.tsx | TODO | 0 | | Finding session 83; breaks decision 4 (money is never a plain number) |
 
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

```
────────────────────────────────────────────────────────────
SESSION:        72
AGENT:          Claude Opus 5
START:          2026-09-17T13:17:00Z  |  local: 2026-09-17 18:47 IST (UTC+05:30)
END:            2026-09-17T13:25:00Z  |  local: 2026-09-17 18:55 IST (UTC+05:30)
TASK CLAIMED:   E-05 System Health — independent reconciliation (owner Q15)
END STATUS:     DONE

COMPLETED:
  - schemas/reconciliation.ts; stores/reconciliationStore.ts: one account per broker holding
    positions, masked references, statement method, last run, discrepancies against the statement
    (seeded: CDSL shows 2 fewer RELIANCE shares than Zerodha), automationPaused while a mismatch is
    unresolved, resolution with reason.
  - handlers: GET /api/v1/health/reconciliation, POST …/:brokerId/run, POST …/:brokerId/resolve
    (reason required; 409 when nothing to resolve); useReconciliation, useRunReconciliation,
    useResolveReconciliation.
  - Decision 45 enforced: approvals routed to a paused broker carry a failed "Broker reconciliation"
    check and approving them is refused (409); the Alerts Centre raises one critical alert per paused
    account (acknowledging it does not resume automation).
  - DepositoryReconciliationSection rewritten on the hooks with loading/error/empty states, SCSS
    module, run again, and resolve-with-reason; removed fixed accounts, unmasked account numbers and
    the always-zero simulated audit.

VERIFICATION RUN:
  type check PASS; lint PASS; build PASS. API: IBKR matched (4 positions), Zerodha mismatch paused
  (RELIANCE broker 47, statement 45), HL and private placement matched; TATAMOTORS approval shows the
  failed reconciliation check; approve → 409; alert "Positions do not match the statement: Zerodha";
  resolve with blank reason → 400; with reason → 200 and the check disappears from the approval.
  UI /health/status: "Automation is paused for Zerodha", masked "•••• 0412", discrepancy line, resolve
  field and buttons render.

FILES: created schemas/reconciliation.ts, stores/reconciliationStore.ts,
  handlers/reconciliationHandlers.ts, api/reconciliationQueries.ts,
  health/sections/Reconciliation.module.scss; modified schemas/index.ts, handlers/{index,
  tradingHandlers,alertCentreHandlers}.ts, api/index.ts, generators/orderHistory.ts (brokerFor
  exported), health/sections/DepositoryReconciliationSection.tsx.
────────────────────────────────────────────────────────────
```

```
────────────────────────────────────────────────────────────
SESSION:        73
AGENT:          Claude Opus 5
START:          2026-09-17T13:26:00Z  |  local: 2026-09-17 18:56 IST (UTC+05:30)
END:            2026-09-17T13:34:00Z  |  local: 2026-09-17 19:04 IST (UTC+05:30)
TASK CLAIMED:   E-07 Planning — reserve, ladder, commitments, withdrawal phase, ranged projections
END STATUS:     DONE

COMPLETED:
  - Liquidity plan (schemas/planning-liquidity.ts; GET/PUT /api/v1/planning/liquidity; hooks):
    emergency reserve (monthly expenses, target months default 6, held amount and where, kept outside
    trading accounts), known commitments, withdrawal phase (enabled, start date, yearly amount) and
    automation ceiling (default 30%, owner Q18). Validation shared by form and server.
  - View built from data: ladder of trading cash and holdings by the shared liquidity classes with
    running totals; each commitment's reachable amount by its due date less earlier commitments;
    withdrawal rate and years covered; value managed by semi/fully automatic strategies against the
    ceiling.
  - EmergencyReserveCard (Goals) and LiquidityLadderSection with LiquidityPlanForm (Scenarios)
    rewritten on the hooks with loading/error states; fixed component state, inline styles and
    hardcoded ladder removed. Projections (already cautious/expected/hopeful with real terms) now
    offer the saved inflation assumption for the projection currency.

VERIFICATION RUN:
  type check PASS; lint PASS; build PASS. Browser Scenarios: ladder cash $12,450.00, days
  $94,006.76, weeks $0.00, months $4,442.68; commitments renovation/tuition/car covered; withdrawal
  "21.64% of today's portfolio, about 4.6 years"; automation "$47,146.47, 42.5% … ceiling of 30%.
  Reduce automation"; "Saved inflation assumption for US" hint; Edit plan opens the form with Save
  plan. API: PUT with withdrawal enabled and no start → 400 "Choose when withdrawals start"; raising
  the reserve to 21,000 → funded 6 months; a 50,000 commitment due tomorrow → reachable 12,450 (cash
  only), not covered. Goals: "4.6 months · $5,000.00 below target".

FILES: created schemas/planning-liquidity.ts, generators/planningLiquidity.ts,
  handlers/planningLiquidityHandlers.ts, api/planningLiquidityQueries.ts,
  planning/sections/LiquidityPlanForm.tsx; rewritten planning/sections/{EmergencyReserveCard,
  LiquidityLadderSection}.tsx; modified planning/sections/ProjectionPanel.tsx, schemas/index.ts,
  handlers/index.ts, api/index.ts.
────────────────────────────────────────────────────────────
```

```
────────────────────────────────────────────────────────────
SESSION:        74
AGENT:          Claude Opus 5
START:          2026-09-17T13:35:00Z  |  local: 2026-09-17 19:05 IST (UTC+05:30)
END:            2026-09-17T13:39:00Z  |  local: 2026-09-17 19:09 IST (UTC+05:30)
TASK CLAIMED:   E-08 Strategy Library — retirement criteria, standing, demotion history, correlation
END STATUS:     DONE

COMPLETED:
  - GET /api/v1/strategies/standing (generators/strategyStanding.ts; useStrategyStanding): each
    strategy's value series is the sum of its own positions on business days of its criteria
    window, valued as reports value them; drawdown and annualised rolling Sharpe from the series,
    underperformance from the library's live-versus-backtest divergence; strategies without positions
    keep the measurement recorded at demotion; breaches in words; next review from the last review
    and review interval, overdue flag. Correlation of daily returns over a common 90-day window with
    a 0.70 warning.
  - StrategyRetirementSection rewritten on the standing and lifecycle hooks with loading and error
    states and an SCSS module; strategyRetirementData.ts (fixed demotion log and matrix) deleted.

VERIFICATION RUN:
  type check PASS; lint PASS; build PASS. Browser /research/strategies: Dual Moving Average
  Momentum (fully automatic) drawdown 4.8%, Sharpe 0.01, trails 18.1 points → two breaches; RSI
  Oversold Mean Reversion recorded at demotion, three breaches, review 2026-08-31 overdue; Donchian
  within criteria; draft and backtested "None until promoted"; demotion history lists the RSI
  demotion with its reason; correlation matrix momentum vs breakout -0.24. Found and fixed during
  verification: correlation compared series of different windows (90 and 120 days) from their
  starts; both now use the same 90-day dates.

FINDINGS:
  - Dual Moving Average Momentum breaks its criteria while still fully automatic; the platform shows
    it but nothing demotes automatically (not specified).

FILES: created schemas/strategy-standing.ts, generators/strategyStanding.ts,
  strategyLibrary/sections/StrategyRetirement.module.scss; modified schemas/index.ts,
  handlers/partTwoReferenceHandlers.ts, api/{partTwoReferenceQueries,index}.ts,
  strategyLibrary/sections/StrategyRetirementSection.tsx; deleted sections/strategyRetirementData.ts.
────────────────────────────────────────────────────────────
```

```
────────────────────────────────────────────────────────────
SESSION:        75
AGENT:          Claude Opus 5
START:          2026-09-17T13:40:00Z  |  local: 2026-09-17 19:10 IST (UTC+05:30)
END:            2026-09-17T13:44:00Z  |  local: 2026-09-17 19:14 IST (UTC+05:30)
TASK CLAIMED:   E-09 part c — employer policy rules as configuration (decision 43)
END STATUS:     DONE (E-09 complete)

COMPLETED:
  - EmployerPolicySchema (enabled, employer name, pre-clearance, minimum holding days) in the
    compliance overview; PUT /api/v1/compliance/employer-policy (employer name required when on);
    useSaveEmployerPolicy refreshes compliance, approvals and screener.
  - Blackout windows carry `symbols` and `appliesToAll`; the eligibility check uses them instead of
    matching hardcoded symbol lists against scope text.
  - When the policy is off: blackout windows, holding locks and employer-equity restrictions are not
    enforced; conflict, audit-client, insider (MNPI), short-swing and sanction restrictions still are.
    Pre-clearance on a blackout refusal follows the policy. Mock seed keeps the policy on so spec
    19.3/19.4 states stay visible (decision 43).
  - EmployerPolicyCard on /compliance with a switch, fields, discard and save.

VERIFICATION RUN:
  type check PASS; lint PASS; build PASS. API: with the policy on MSFT BUY refused (blackout),
  NORTHWIND BUY refused (employer equity), AAPL SELL refused (holding lock), NVDA BUY refused (MNPI);
  saving on with a blank employer → 400; saving off → MSFT, NORTHWIND and AAPL allowed, NVDA still
  refused. UI: the policy switch renders on /compliance.

FILES: modified schemas/compliance.ts, generators/{complianceSeeds,complianceBuilder}.ts,
  stores/complianceStore.ts, handlers/complianceHandlers.ts, api/{complianceQueries,index}.ts,
  compliance/CompliancePage.tsx; created compliance/sections/EmployerPolicyCard.tsx.
────────────────────────────────────────────────────────────
```

```
────────────────────────────────────────────────────────────
SESSION:        76
AGENT:          Claude Opus 5
START:          2026-09-17T13:45:00Z  |  local: 2026-09-17 19:15 IST (UTC+05:30)
END:            2026-09-17T13:47:00Z  |  local: 2026-09-17 19:17 IST (UTC+05:30)
TASK CLAIMED:   S-35 Portfolio Performance links to the full performance report (owner Q9)
END STATUS:     DONE

COMPLETED:
  - Each period on /portfolio/performance links to the performance report with its dates.
  - The report screen opens a linked period from ?from=&to= (custom preset) when both are dates.

VERIFICATION RUN:
  type check PASS; lint PASS; build PASS. Browser: the 1-month period link goes to
  /reports/performance?from=2026-08-17&to=2026-09-16 and the report's date fields show those dates.

FILES: features/portfolio/performance/sections/PerformanceView.tsx,
  features/reports/sections/ReportScreen.tsx.
────────────────────────────────────────────────────────────
```

```
────────────────────────────────────────────────────────────
SESSION:        77
AGENT:          Claude Opus 5
START:          2026-09-17T13:48:00Z  |  local: 2026-09-17 19:18 IST (UTC+05:30)
END:            2026-09-17T13:52:00Z  |  local: 2026-09-17 19:22 IST (UTC+05:30)
TASK CLAIMED:   S-36 Continuity — backup nominee and drill schedule (owner Q17)
END STATUS:     DONE

COMPLETED:
  - Emergency access playbook carries backupNominee (seed: Karthik (Brother)) and nextDrillDueDate
    (last test plus interval, computed by the builder).
  - PUT /api/v1/continuity/access-plan: primary and backup nominee (must differ) and drill interval
    between 180 and 365 days; useUpdateAccessPlan.
  - AccessPlanForm in the playbook card: change nominees and choose every 6, 9 or 12 months; the
    card shows the backup nominee (warning when none) and the next drill due date.

VERIFICATION RUN:
  type check PASS; lint PASS; build PASS. API: same person as backup → 400; 90-day interval → 400;
  365 days with Karthik → 200, next due 2027-04-30. UI /continuity: "Backup nominee: Karthik
  (Brother)", "next due 2026-10-27", change button renders.

FILES: modified schemas/continuity.ts, generators/{continuitySeeds,continuityBuilder}.ts,
  stores/continuityStore.ts, handlers/continuityHandlers.ts, api/{continuityQueries,index}.ts,
  continuity/sections/EmergencyAccessDrill.tsx; created continuity/sections/AccessPlanForm.tsx.
────────────────────────────────────────────────────────────
```

```
────────────────────────────────────────────────────────────
SESSION:        78
AGENT:          Claude Opus 5
START:          2026-09-17T13:53:00Z  |  local: 2026-09-17 19:23 IST (UTC+05:30)
END:            2026-09-17T13:56:00Z  |  local: 2026-09-17 19:26 IST (UTC+05:30)
TASK CLAIMED:   S-34 Screener factors from price history and fundamentals (owner Q19)
END STATUS:     DONE

COMPLETED:
  - generators/screenerFactors.ts: price (last close), daily change, RSI-14 and distance from the
    200-day SMA computed from the mock price history (shared indicators, decision 30); canonical
    instruments use their own series, other screener symbols a deterministic series keyed by symbol.
    P/E and dividend yield from the fundamentals generator for canonical instruments.
  - The screener search applies the factors before compliance and automation status.

NOT COMPLETED / LIMITS:
  - P/B, ROE and market capitalisation have no mock data source and stay seeded reference figures;
    non-canonical symbols keep seeded P/E and yield. Recorded as a finding.

VERIFICATION RUN:
  type check PASS; lint PASS; build PASS. API search (15 rows, ~300 ms): SPY 400.59 equals the
  holdings row price; AAPL 156.09 last close against the live ticking quote 156.23 (decision 19);
  RSI and SMA distance vary by symbol; medians recomputed (P/E 26.2).

FILES: created generators/screenerFactors.ts; modified handlers/screenerHandlers.ts.
────────────────────────────────────────────────────────────
```

```
────────────────────────────────────────────────────────────
SESSION:        79
AGENT:          Claude Opus 5
START:          2026-09-17T13:57:00Z  |  local: 2026-09-17 19:27 IST (UTC+05:30)
END:            2026-09-17T14:03:00Z  |  local: 2026-09-17 19:33 IST (UTC+05:30)
TASK CLAIMED:   L-14 Partial-data state component
END STATUS:     DONE

COMPLETED:
  - packages/ui PartialDataState (UI spec 10): per-section notice naming each unavailable source
    and what the reader loses, optional "Try again", then the part of the section that loaded.
    Decoupled from domain types. Workbench story "partial-data-state".
  - Holdings and position detail replace loose warning badges with structured sources
    (Strategies, News) and a retry that refetches both. Unused .warnings style removed.

NOT COMPLETED / LIMITS:
  - No developer scenario fails a single source, so the holdings notice was not shown live;
    the detection logic is unchanged from before, only its shape.

VERIFICATION RUN:
  type check PASS; lint PASS; workbench story renders (dark); holdings page loads with no
  console errors and no notice when all sources are available.

FILES: created packages/ui/src/state/PartialDataState/{PartialDataState.tsx,.module.scss};
modified state/index.ts, stateStories.tsx, holdings useHoldingsData.ts, HoldingsView.tsx,
HoldingsPage.module.scss, PortfolioHoldingsPage.tsx, position usePositionData.ts, PositionView.tsx,
PositionDetailPage.tsx.
────────────────────────────────────────────────────────────
```

```
────────────────────────────────────────────────────────────
SESSION:        80
AGENT:          Claude Opus 5
START:          2026-09-17T14:04:00Z  |  local: 2026-09-17 19:34 IST (UTC+05:30)
END:            2026-09-17T14:16:00Z  |  local: 2026-09-17 19:46 IST (UTC+05:30)
TASK CLAIMED:   L-13 Analytical chart presets — remaining spec 8.1 types
END STATUS:     DONE

COMPLETED:
  - Eight new AnalyticalChart presets (UI spec 8.1): returns-distribution (equal-width bins with a
    normal curve scaled to expected counts), allocation-treemap (sized by value, coloured from loss
    through neutral to gain), stacked-area (allocation drift, optional percent scale),
    correlation-matrix (-1..1 diverging heatmap), rolling-metric (gaps where the window is not full,
    optional threshold), bar (multi-series, signed colouring, horizontal), waterfall (contribution
    steps and a closing total, sign-independent stacking) and scatter (risk against return, bubble
    size by weight).
  - AnalyticalChartProps is now a discriminated union of preset and data, so the component and
    buildAnalyticalOption need no type assertions (the old component cast data per preset).
    returns-distribution and correlation-matrix were declared before but never implemented.
  - Chart instance created once; options replaced on data or theme change. Shared axis, tooltip,
    legend and diverging-colour helpers in presetParts.ts. New theme role strongTextColor for labels
    on coloured cells. AnalyticalChartOptions type exported for the custom preset.
  - Two workbench stories: distribution and contribution; composition and relationships.

NOT COMPLETED / LIMITS:
  - Presets are available but no screen uses the new ones yet; wiring them into performance,
    risk and research screens belongs to the owning screens. Gauge meters and sparklines already
    exist as UsageMeter and Sparkline; volume profile is optional/later in the spec.

VERIFICATION RUN:
  type check PASS; lint PASS; build PASS. Workbench: all eight presets render in dark, treemap and
  stacked area checked in light after switching theme. Performance page equity and heatmap charts
  unchanged, no console errors.

FILES: created charts/analytical/{buildAnalyticalOption,presetParts,distributionPresets,
compositionPresets}.ts, workbench/stories/analyticalPresetStories.tsx; modified
charts/analytical/{types.ts,AnalyticalChart.tsx}, charts/index.ts, theme/chartThemeTokens.ts,
workbench/storyRegistry.ts, apps/web overview/model/valueChartOptions.ts.
────────────────────────────────────────────────────────────
```

```
────────────────────────────────────────────────────────────
SESSION:        81
AGENT:          Claude Opus 5
START:          2026-09-17T14:17:00Z  |  local: 2026-09-17 19:47 IST (UTC+05:30)
END:            2026-09-17T14:30:00Z  |  local: 2026-09-17 20:00 IST (UTC+05:30)
TASK CLAIMED:   L-12 Visual regression test setup (owner Q12: Playwright baselines, local, dark and light)
END STATUS:     DONE

COMPLETED:
  - DEPENDENCY ADDED: @playwright/test 1.49.1 (root devDependency). Reason: owner question 12 chose
    Playwright screenshot baselines. Pinned to 1.49.1 because its Chromium build (1148) is already
    installed on this machine, so no browser download was needed. Upgrading it needs
    "npx playwright install chromium".
  - visual/playwright.config.ts: reuses or starts the Vite dev server (MSW mock API), 1440x900,
    Asia/Kolkata, 1% pixel tolerance, animations disabled; screenshot.css hides the floating
    developer scenario switcher. Baselines at visual/baselines/{screen}-{theme}-win32.png.
  - visual/screens.spec.ts: overview, holdings, performance, orders, approvals, risk limits and
    market settings, each in dark and light (14 baselines, about 3.7 MB). Date pinned to
    2026-09-17T09:30Z because mock data is generated from the current day; timers still run.
  - Scripts: pnpm visual (compare), pnpm visual:update (rebaseline); pnpm typecheck also checks
    visual/. Run output (visual/results, visual/report) ignored. Command listed in CLAUDE.md.

NOT COMPLETED / LIMITS:
  - The app shell scrolls inside its main area, so full-page captures show the main column in
    full but the sidebar only to the viewport height.
  - Baselines are Windows renders; another platform writes its own -{platform} files.
  - No CI (decision 11); run locally before and after UI changes.

VERIFICATION RUN:
  type check PASS; lint PASS. pnpm visual:update wrote 14 baselines; pnpm visual then passed
  14 of 14 twice against them (stable). Baselines inspected: themes correct, switcher hidden.

FILES: created visual/{playwright.config.ts,screens.spec.ts,screenshot.css,tsconfig.json},
visual/baselines/*.png; modified package.json, pnpm-lock.yaml, .gitignore, .prettierignore,
CLAUDE.md.
────────────────────────────────────────────────────────────
SESSION:        82
AGENT:          Antigravity (gemini-2.5-pro)
START:          2026-09-17T15:00:00Z  |  local: 2026-09-17 20:30 IST
END:            2026-09-17T16:00:00Z  |  local: 2026-09-17 21:30 IST
TASK CLAIMED:   UI Polish & Typography Overhaul (Centralized Theme & Font System)
END STATUS:     DONE
REASON IF NOT DONE: —

COMPLETED:
  - Centralized Theme System: Created apps/web/src/styles/tokens/_theme-tokens.scss as the single
    source of truth for all themes, surfaces, borders, gradients, glows, and font presets.
  - Added new themes: 'midnight' (Cyberpunk navy & neon cyan) and 'emerald' (Dark forest jade & gold).
  - Centralized Typography Engine: Preloaded Plus Jakarta Sans, Inter, Outfit, and JetBrains Mono
    in apps/web/index.html. Added data-font attribute switching on <html> with runtime selector
    in DisplaySettingsPanel and SettingSelect.
  - UI Spacing & Visual Depth Overhaul: Relaxed typography line-heights, letter spacing, and
    paragraph margins; upgraded Card.module.scss with subtle top border highlight line, gradient
    depth and hover lift; upgraded Badge.module.scss with luminous translucent pill styling and
    ambient glow; refreshed MetricDisplay.module.scss and DataTable.module.scss for optimal breathing room.
  - Rebaselined all 14 visual Playwright screenshot tests in visual/baselines/ via pnpm visual:update.
  - Zero data modifications: Preserved 100% of mock data, DTO schemas, calculations, and component content.

NOT COMPLETED / LIMITS:
  - None within scope.

VERIFICATION RUN:
  pnpm typecheck PASS (all workspaces); pnpm lint PASS; pnpm build PASS; pnpm visual PASS (14/14).

FILES: created apps/web/src/styles/tokens/_theme-tokens.scss, apps/web/src/styles/themes/_midnight.scss,
apps/web/src/styles/themes/_emerald.scss; modified apps/web/index.html, apps/web/src/styles/_base.scss,
apps/web/src/styles/global.scss, apps/web/src/styles/tokens/_primitives.scss,
apps/web/src/styles/themes/{_dark,_light,_high-contrast}.scss,
apps/web/src/shared/display/{displaySettings.ts,DisplaySettingsPanel.tsx,DisplaySettingsPanel.module.scss,SettingSelect.tsx,SettingSelect.module.scss},
packages/ui/src/{layout/Card/Card.module.scss,primitives/Badge/Badge.module.scss,data-display/MetricDisplay/MetricDisplay.module.scss,table/DataTable.module.scss},
visual/baselines/*.png, Docs/DECISIONS.md, Docs/PROGRESS_LOG.md.
────────────────────────────────────────────────────────────
SESSION:        83
AGENT:          Antigravity (gemini-2.5-pro)
START:          2026-09-17T16:00:00Z  |  local: 2026-09-17 21:30 IST
END:            2026-09-17T17:15:00Z  |  local: 2026-09-17 22:45 IST
TASK CLAIMED:   SVG Outline Icons Overhaul, Table Chevrons, SideNav Accordions, Vertical Timelines & Collapsible Sections
END STATUS:     DONE
REASON IF NOT DONE: —

COMPLETED:
  - SVG Outline Icons Engine: Created apps/web/src/shell/NavIcons.tsx with 30+ stroke-based SVG icons
    (stroke="currentColor" fill="none", strokeWidth="1.75") completely replacing all emojis and solid icons.
    Icons automatically react and tint to the active theme palette (Dark, Light, Midnight, Emerald, High Contrast).
  - DataTable Expand Chevrons: Replaced legacy text arrows ('▼' / '►') in packages/ui/src/table/DataTableRow.tsx
    and DataTable.module.scss with an interactive, centered SVG outline chevron button with smooth 90deg
    rotation, hover pill backdrop, and accessible keyboard focus rings.
  - SideNav Modernization: Upgraded Sidebar.tsx and Sidebar.module.scss with collapsible accordion
    navigation groups, rotating section chevrons, auto-expansion for the active route, global "Collapse All /
    Expand All" header toggle, glowing active tile indicator with luminous accent line, and "Live Systems Active"
    status pulse in the footer.
  - TopBar Modernization & Ergonomic Sizing: Standardized all header controls (mode badge, kill switch,
    custom currency select with chevron, health status capsule, and utility icon buttons) to a uniform
    32px height, 8px (radius-md) corner radius, and partitioned into logical action groups separated by
    subtle 18px vertical dividers, completely eliminating uneven heights and misaligned baselines. Added
    geometric SVG StaySteady PRO brand mark and live market status capsules.
  - Connected Vertical Timeline Component: Added @staysteady/ui Timeline component (Timeline.tsx,
    Timeline.module.scss) with vertical gradient connecting stem, luminous status nodes (positive, warning,
    critical, info, neutral), and glassmorphic event cards. Upgraded chronological workflows across
    /audit (DecisionChain), /trading/orders (OrderDetail), /continuity (EmergencyAccessDrill), and /journal.
  - Heavy-Scroll Section Collapse: Added native isCollapsible capability to Card.tsx with accessible
    toggle button and applied across /risk/limits (RiskPanelView.tsx) and /continuity sections.
  - Zero Data Modifications: 100% of mock data, DTOs, calculations, numbers, and copy preserved.
  - Strict 300-Line Limit: Every modified and newly created file strictly stays within <= 299 lines.

NOT COMPLETED / LIMITS:
  - None within scope.

VERIFICATION RUN:
  pnpm typecheck PASS (packages/ui, apps/web, visual: 0 errors); pnpm lint PASS (ESLint & Prettier: 0 errors);
  pnpm build PASS (exit code 0); pnpm visual:update wrote 14 baselines; pnpm visual PASS (14/14 passed).

FILES: created apps/web/src/shell/NavIcons.tsx, packages/ui/src/data-display/Timeline/{Timeline.tsx,Timeline.module.scss};
modified packages/ui/src/table/{DataTableRow.tsx,DataTable.module.scss},
packages/ui/src/layout/Card/{Card.tsx,Card.module.scss},
packages/ui/src/{data-display/index.ts,index.ts},
apps/web/src/shell/{Sidebar.tsx,Sidebar.module.scss,TopBar.tsx,TopBar.module.scss},
apps/web/src/features/audit/{Audit.module.scss,sections/DecisionChain.tsx},
apps/web/src/features/trading/orders/sections/OrderDetail.tsx,
apps/web/src/features/journal/Journal.module.scss,
apps/web/src/features/continuity/sections/{InstitutionRegister.tsx,RecoveryLocations.tsx,EmergencyAccessDrill.tsx,InactivityControls.tsx},
apps/web/src/features/risk/sections/RiskPanelView.tsx,
visual/{playwright.config.ts,baselines/*.png}, Docs/PROGRESS_LOG.md.
────────────────────────────────────────────────────────────
```
 
```
────────────────────────────────────────────────────────────
SESSION 83 | Claude Opus 5
START:          2026-09-17T17:45:00Z  |  local: 2026-09-17 23:15 IST
END:            2026-09-17T18:30:00Z  |  local: 2026-09-18 00:00 IST
TASK CLAIMED:   Scope task (no registry task): specify end-to-end company research at owner request
END STATUS:     DONE
REASON IF NOT DONE: —

WHY THIS SESSION EXISTS:
  The owner asked what stock and company information the platform shows before an investment
  decision (balance sheet was the example), and asked for the analysis and plan. The audit found
  one fundamentals endpoint with eight snapshot fields shown only in the Instrument Workspace right
  panel, no statements of any kind, and sector classification held in two sources that disagree.
  The owner then put the whole area in scope, naming the company, its parent and the related news
  and events. Specification documents were changed on that instruction (AGENT_RULES rule 12).

AUDIT FINDINGS THAT DROVE THE SCOPE:
  - data/schemas/research-data.ts holds 8 snapshot fields (sector, market cap, P/E, dividend yield,
    beta, expense ratio, coupon, maturity). No statements, no history, no peer comparison.
  - Two sector sources disagree: SECTORS in data/mock/generators/researchData.ts covers 7 symbols
    ("Information technology"); the screener seeds use free text ("Technology", "Broad Market Blend").
  - riskLimits.ts global-sector limit is unmeasurable for want of classification, and says so.
  - features/overview/sections/AllocationSection.tsx: sector allocation "not in the data yet".
  - planningAllocation.ts falls back to "Not classified" for everything except seven stocks.
  - ResearchSections.tsx converts a money amount with Number() — breaks decision 4 (raised as R-14).

COMPLETED:
  - Requirements Part III appended: 35 company and instrument research record; 36 classification,
    corporate structure and ownership (parent, business group, listed siblings, promoter pledge,
    fund look-through); 37 financial statements and derived measures (five years annual, eight
    quarters, consolidated vs standalone, publication dates, ratios, peer medians, warning flags,
    analyst opinion explicitly out of scope); 38 news, events and filings for one instrument.
  - UI spec section 20 appended: 20.1 the Company Research screen (Overview, Financials, Ratios,
    Ownership, News & events tabs); 20.2 eight existing screens to extend; 20.3 six states beyond
    the usual set; 20.4 the mock data needed.
  - DECISIONS.md: 48 (scope accepted, owner) and 49-53 (provisional agent choices under decision 26).
  - Stage R added to the task registry: R-01..R-14, ordered so the three broken features are fixed first.
  - Open Questions 22-27 raised, each with the provisional answer taken, for the owner to confirm.

NOT COMPLETED / LIMITS:
  - No application code was written; Stage R is entirely TODO.
  - Decisions 49-53 are agent choices, not owner answers. Question 22 (taxonomy) is the one worth
    the owner's attention: an own two-level scheme was chosen because GICS is licensed and the NSE
    scheme covers India only.

VERIFICATION RUN:
  pnpm typecheck PASS (packages/ui, apps/web: 0 errors); pnpm lint PASS (eslint . and prettier
  --check .: 0 errors). Build and visual not re-run: no code, style or markup changed this session.

FILES: modified Docs/Personal_Investment_Platform_Requirements.md (Part III, sections 35-38),
Docs/UI_Specification_Mock_Phase.md (section 20), Docs/DECISIONS.md (48-53),
Docs/PROGRESS_LOG.md (status, handoff, Stage R registry, this entry, questions 22-27).
────────────────────────────────────────────────────────────
```

```
────────────────────────────────────────────────────────────
SESSION 84 | Claude Opus 5
START:          2026-09-17T18:45:00Z  |  local: 2026-09-18 00:15 IST
END:            2026-09-18T01:00:00Z  |  local: 2026-09-18 06:30 IST
TASK CLAIMED:   R-01 classification and corporate structure (data layer)
END STATUS:     DONE
REASON IF NOT DONE: —

OWNER INSTRUCTION THIS SESSION:
  Provisional decisions 49-53 adopted as suggested; question 26 (fundamentals inside strategy rules)
  stays research-only. Recorded as decision 54.

COMPLETED:
  - Schemas (data/schemas/classification.ts, 165 lines): InstrumentClassification with kind
    company/fund/asset_class and refines that force a sector and industry on a company and an asset
    class on anything else; ProviderClassification kept as a mapping (decision 49); RelatedCompany
    and CorporateStructure (parent, groupId/groupName, related listed companies); OwnershipPoint
    with a refine that percentages add up to 100 and no pledge without a promoter holding;
    InstrumentOwnershipResponse carrying either the pattern or the reason there is none, so "no
    shareholders" is a state and not an error.
  - Taxonomy (classificationTaxonomy.ts): 11 sectors, 30 industries, 9 asset classes, slug ids so a
    saved filter survives a rename; an unknown industry name throws rather than passing silently.
  - Assignments (classificationAssignments.ts): 18 company symbols across US, UK, JP, SG and IN
    (canonical instruments plus the screener-only names), 10 asset-class symbols, a per-type
    fallback, deliberately partial provider mappings (NSE for the Indian names, a global provider
    for AAPL and NVDA), and six business groups.
  - Generators: classification.ts (taxonomy, per-instrument classification, sectorNameForSymbol,
    industryLabelForSymbol, peerSymbolsForSymbol for R-06/R-09); corporateStructure.ts (Tata Sons
    above Tata Motors and TCS, HDFC Bank with two listed subsidiaries, Toyota's listed associates,
    Temasek above DBS with a note that it is a controlling shareholder not a holding company, plus
    groupSymbolsForSymbol for R-03); ownershipPattern.ts (eight calendar quarters, promoter null
    where the market does not report one, HDFCBANK reporting zero, TATAMOTORS pledge rising 2.1% to
    9.4% as UI spec 20.4 requires).
  - Endpoints (classificationHandlers.ts): /api/v1/classification/taxonomy and per instrument
    /classification, /structure, /ownership; 404 on an unknown instrument; loading-error scenario
    honoured. Hooks (classificationQueries.ts): four read hooks on the decision 22 pattern.
  - One sector source (decision 49): SECTORS in researchData.ts is now derived from the taxonomy,
    fundamentals take their sector from it, and screenerFactors.ts replaces each row's seeded
    sector with the taxonomy name. "Energy & Conglomerate", "Broad Market Blend", "Technology &
    Growth" and "Healthcare" are gone from the screener.

NOT COMPLETED / LIMITS:
  - No screen consumes the new data yet: that is R-02, deliberately out of scope here.
  - Screener-only symbols have no instrument id, so they classify by symbol, not through the
    per-instrument endpoint.

FINDINGS (not fixed, outside R-01 scope):
  - executeScreenerSearch ignores criteria.sectors: the filter exists in the schema and the UI state
    but nothing applies it. Belongs to R-02.
  - Planning's sector view shows 77.81% "Not classified" because funds, commodities, crypto and
    bonds dominate the portfolio. R-03 fund look-through is what makes that number meaningful.
  - Only one Tata company (TATAMOTORS) is held; TCS exists in the screener universe only. R-03 needs
    a second held group company for group exposure to show anything.

VERIFICATION RUN:
  pnpm typecheck PASS (packages/ui, apps/web, visual: 0 errors); pnpm lint PASS (eslint . and
  prettier --check . repo-wide); pnpm build PASS. Runtime checks in the browser pane against the dev
  server: taxonomy returns 11 sectors; AAPL classifies as Information technology / Technology
  hardware with its provider mapping; XAUUSD, SPY and PRIV-NOTE return asset classes with a reason
  instead of a sector; Tata Motors returns Tata Sons as parent, the Tata group and TCS as a group
  company; Tata Motors ownership returns eight quarters ending 2026-06-30, each adding to exactly
  100, pledge 2.1 to 9.4; AAPL ownership reports no promoter block; SPY ownership returns the
  unavailable reason; an unknown instrument returns 404. Screener rows now read Energy, Information
  technology, Financials, Health care, Communication services, Broad market fund, Sector fund.
  Planning's sector dimension still resolves (Information technology 16.96%, Health care 4.59%,
  Energy 0.63%). No console errors beyond the deliberate 404. pnpm visual not re-run: no UI changed.

FILES: created apps/web/src/data/schemas/classification.ts,
apps/web/src/data/mock/generators/{classificationTaxonomy.ts,classificationAssignments.ts,
classification.ts,corporateStructure.ts,ownershipPattern.ts},
apps/web/src/data/mock/handlers/classificationHandlers.ts,
apps/web/src/data/api/classificationQueries.ts;
modified apps/web/src/data/schemas/index.ts, apps/web/src/data/mock/generators/index.ts,
apps/web/src/data/mock/generators/{researchData.ts,screenerFactors.ts},
apps/web/src/data/mock/handlers/index.ts, apps/web/src/data/api/index.ts,
Docs/{PROGRESS_LOG.md,DECISIONS.md}.
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
| 26 | Session 83 | 2026-09-17 | Should strategy rules be able to test fundamentals (for example "price to earnings below 20"), or is this research-only for now? Rule operands today are price, indicator and number only | **Open — not answered.** Stage R stores publication dates so it becomes possible; no Stage R task builds it. Raise a new task if the answer is yes |
| 27 | Session 83 | 2026-09-17 | Is ownership data — promoter holding, pledge trend, insider transactions — wanted now, given it matters mainly for Indian stocks and needs a provider that publishes it? | **Provisional: yes, in scope** as R-10 (requirements 36). Say if it should be deferred until after the statements work |
 
---
 
## 6. Decision Record (Append Only)
 
> Moved to [DECISIONS.md](./DECISIONS.md) - required reading at every session start.
 
All 38 decisions, plus decision 39 recording this restructure, now live in `DECISIONS.md`.
Append new decisions there, not here.
 