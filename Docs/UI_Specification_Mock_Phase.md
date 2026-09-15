# StaySteady
## UI Specification — Mock Data Phase

## 1. Purpose Of This Document

- Project name: StaySteady
- The system requirements document describes behaviour; it does not describe screens
- This document covers what is needed to build a complete, working, clickable interface using mock data only
- Goal of this phase:
  - Every screen exists and is navigable
  - Every interaction works against fake data
  - Every chart and metric is rendered with realistic values
  - All visual states are built (loading, empty, error, stale, offline)
  - No real backend, no real money, no real provider connections
- Value of doing UI first:
  - Forces early decisions about what data is actually needed and in what shape
  - Exposes missing requirements before backend effort is spent
  - Produces a usable reference for building the real data layer against

## 2. Assumptions Made (Change If Wrong)

- Primary target is desktop/large screen, since this is a dense data application
- Mobile is a secondary, read-only-focused experience — monitoring and approvals, not research
- Dark theme is the default, light theme available
- Single user, so no user management, team, or sharing screens
- Interface language is English for now, but currency, date and number formatting must respect market conventions
- The UI will eventually talk to a single backend of my own, not directly to brokers or providers

## 3. Branding Notes

- Name: StaySteady
- Tone the interface should carry:
  - Calm, not urgent — this is a tool for patient decisions, not a trading floor
  - Restrained use of alarm colours, so that when something does go red it actually means something
  - No gamification, no streaks, no celebratory animation on gains — those encourage exactly the behaviour the name argues against
- Where the name can reinforce the product:
  - The safety and risk screens are the clearest expression of it
  - The confirmation language on irreversible actions can lean on it without being cute
- Visual identity decisions deliberately left open for now; the mock phase needs layout and behaviour settled first, not a logo

## 4. Design Foundations

- Information density:
  - Favour dense, compact layouts over spacious marketing-style design
  - This is a working tool, not a consumer app — more visible data per screen is better
  - Provide a density toggle (comfortable / compact) since some screens need breathing room
- Colour semantics:
  - Gain and loss colours must be configurable, because conventions differ by country
  - Green-up / red-down is standard in most Western markets and India
  - Red-up / green-down is standard in China, Japan, Korea and Taiwan
  - Never rely on colour alone — always pair with sign, arrow or label for accessibility
  - Reserve a distinct alert colour (amber/orange) for system warnings, separate from loss red
  - Reserve a distinct critical colour for system-down and safety-breach states
- Typography:
  - Use a tabular/monospaced-figure font for all numbers so columns align and digits do not shift as values update
  - Clear hierarchy between headline figures, supporting figures and labels
- Number formatting rules:
  - Always show the currency explicitly when multiple currencies are in play
  - Consistent decimal precision per instrument type
  - Large values abbreviated in summary views, full precision in detail views and on hover
  - Percentages and absolute values shown together for gains and losses
- Timestamp rules:
  - Always indicate which timezone a time refers to
  - Show relative time for recent events, absolute time for older ones
  - Market-related times shown in market local time, with my local time available on hover
- Motion:
  - Price updates flash briefly, then settle — no continuous animation
  - Avoid animation on charts when data updates, as it makes reading harder

## 5. Global Interface Elements

- Persistent top bar containing:
  - Product name and mark on the left, acting as a link back to Overview
  - System mode indicator — simulation, observation, manual approval, or full automation — always visible, colour coded, impossible to miss
  - Master stop control for all automation, always reachable in one click
  - Global health status light, expanding to a summary of any degraded components
  - Base currency selector
  - Market status strip showing each configured market as open, pre-open, closed or holiday, in its own local time
  - Notification bell with unread count and severity breakdown
  - Global search across instruments, strategies, news and settings
- Persistent side navigation with the main sections
- Mock-phase requirement: a visible banner or badge indicating mock data is in use, so it can never be confused with real data
- A hidden developer panel to switch between mock scenarios (see section 15)

## 6. Navigation Map

- Overview
- Portfolio
  - Holdings
  - Position detail
  - Transactions
  - Performance
- Markets
  - Watchlists
  - Instrument workspace (chart + detail)
  - Screener
- News & Events
  - Live feed
  - Event calendar
- Research
  - Strategy library
  - Strategy editor
  - Backtest setup
  - Backtest results
  - Backtest comparison
- Trading
  - Signals feed
  - Approval queue
  - Orders
  - Positions
- Risk & Safety
  - Limits and thresholds
  - Breach history
- System Health
  - Live status
  - Incident history
  - Provider and broker reliability
- Reports
  - Performance reports
  - Cost analysis
  - Tax summaries
- Planning
  - Allocation targets
  - Goals
  - Scenario modelling
- Configuration
  - Countries and markets
  - Data providers
  - Brokers and platforms
  - Instrument types
  - Currencies
  - Alert rules
  - Credentials
- Alerts
- Audit log

## 7. Screen Specifications

### 7.1 Overview (Landing Screen)

- Purpose: answer "is everything fine, and where do I stand" in under five seconds
- Top row of headline cards:
  - Total portfolio value in base currency, with change today and change since inception
  - Today's gain/loss in both absolute and percentage terms
  - Cash available versus deployed capital
  - Number of open positions
  - Automation status with count of pending approvals
  - System health summary with count of degraded components
- Main area:
  - Portfolio value chart over a selectable period
  - Allocation breakdown, switchable between country, currency, instrument type, sector and strategy
  - Top gainers and losers today
  - Positions requiring attention — approaching an exit level, unusual movement, or news flagged
- Side area:
  - Latest high-importance news affecting current holdings
  - Upcoming calendar events for held instruments
  - Recent system alerts
- Interactions:
  - Every card links through to its detailed screen
  - Period selector affects the value chart only, not the headline cards
  - Currency toggle switches all figures on the screen

### 7.2 Holdings

- Purpose: complete list of everything currently held
- Dense sortable, filterable, groupable table
- Columns to support (user-selectable, saved as a layout):
  - Instrument name and symbol
  - Market and country flag
  - Instrument type
  - Broker or platform held at
  - Quantity or units
  - Average purchase price
  - Current price with intraday change
  - Value in local currency
  - Value in base currency
  - Unrealised gain/loss, absolute and percentage
  - Currency effect contribution, separated from price movement
  - Portfolio weight percentage
  - Days held
  - Holding period tax status indicator
  - Strategy that opened it, if any
  - Exit level set, and distance to it
  - News flag if significant news exists
- Grouping modes: by country, by currency, by instrument type, by broker, by strategy, flat
- Each group row shows aggregated totals
- Row expansion shows a small price sparkline and the individual purchase lots
- Bulk selection for comparison or export
- Inline visual cues:
  - Small bar showing position size relative to the largest holding
  - Colour-coded distance to exit level
- Empty state: guidance to add a holding manually or import

### 7.3 Position Detail

- Purpose: everything about one held instrument
- Header: instrument identity, market, currency, current price, position summary
- Tabs or panels:
  - Chart with entry and exit markers plotted on it
  - Purchase lots with dates, quantities, prices and individual holding periods
  - Transaction history for this instrument
  - Costs incurred — fees, charges, conversion costs
  - Income received — dividends and payouts
  - Related news, newest first
  - Upcoming events for this instrument
  - Which strategy holds it and why it was opened
- Actions: adjust exit level, close position, add manual transaction, add note

### 7.4 Instrument Workspace (Chart Screen)

- Purpose: the research and analysis screen; this is the most chart-heavy screen in the system
- Layout: large chart area, collapsible left instrument panel, collapsible right info panel, bottom detail strip
- Chart capabilities required:
  - Candlestick, bar, line, area and hollow candle styles
  - Volume displayed as a sub-panel
  - Timeframe selector covering intraday intervals through daily, weekly and monthly
  - Range selector for period shown, plus free zoom and pan
  - Crosshair with synchronised values across all panels
  - Logarithmic and linear price scale toggle
  - Multiple indicator sub-panels stacked below the main chart
  - Overlay indicators drawn on the price chart itself
  - Drawing tools — trend lines, horizontal levels, rectangles, text notes
  - Event markers on the time axis for earnings, dividends, splits and high-impact news
  - Ability to compare against a benchmark or another instrument, normalised to percentage
  - Extended-hours data shown distinctly from regular session data
  - Clear visual gaps for market holidays rather than compressing them away
- Indicator set to support in mock phase:
  - Moving averages, simple and exponential, multiple periods
  - Bollinger bands or similar volatility envelope
  - Relative strength index
  - Moving average convergence divergence
  - Average true range
  - Volume moving average
  - Stochastic oscillator
- Right panel contents:
  - Quote detail — open, high, low, close, previous close, volume, day range, period range
  - Key fundamentals where relevant to the instrument type
  - Position held, if any
  - Watchlist membership
  - Recent news
  - Any strategy signals currently active on this instrument
- Saved chart layouts per instrument, and a default layout per instrument type

### 7.5 Watchlists

- Multiple named watchlists, each able to mix countries and instrument types
- Compact quote table with live-updating prices
- Inline sparkline per row
- Column set similar to holdings but without position data
- Drag to reorder, drag between lists
- Quick-add search with market and instrument type filters
- Per-list summary showing how many are up, down, and the average move

### 7.6 News & Events

- Two views: live feed and calendar
- Live feed:
  - Chronological stream with newest first
  - Each item showing headline, source, timestamp, affected instruments, category tag, sentiment indicator and importance score
  - Filters by market, country, instrument, category, sentiment, importance and held-only
  - Visual emphasis for news affecting current holdings
  - Duplicate stories grouped and collapsible, showing source count
  - Expanding an item shows a summary and the price reaction chart around the publication time
- Calendar view:
  - Month, week and day layouts
  - Events colour coded by category and importance
  - Marks which events fall inside a configured trading restriction window
  - Filter to held instruments only
- Sentiment must always display its confidence level, and be visually distinguishable from confirmed facts

### 7.7 Strategy Library

- Card or table listing of all strategies
- Each entry showing:
  - Name and short description
  - Lifecycle stage badge — draft, backtested, observation, semi-automatic, fully automatic
  - Markets and instrument types it applies to
  - Capital allocated
  - Backtest headline result
  - Live result to date, where applicable
  - Divergence indicator comparing live performance against backtest expectation
  - Last run timestamp and status
- Filters by stage, market, instrument type and performance
- Stage promotion control that is deliberately multi-step, never a single click

### 7.8 Strategy Editor

- Purpose: define a strategy without writing system-level code
- Sections:
  - Scope — which markets, instrument types and specific instruments
  - Entry conditions — visual rule builder with add, group and nest
  - Exit conditions — separate from entry, including forced-exit conditions
  - Position sizing rules
  - Capital allocation limits
  - Holding period expectations
  - News and event inputs, optional per strategy
  - Risk overrides specific to this strategy
- Live validation panel showing conflicts, impossible conditions and missing settings
- Preview panel showing where these conditions would have triggered on a recent chart
- Version history with the ability to compare and revert

### 7.9 Backtest Setup

- Input sections:
  - Strategy selection
  - Date range, with presets and warnings if the range includes unusual market periods
  - Markets and instruments to include
  - Starting capital and currency
  - Cost assumptions — fees, charges, slippage, currency conversion — pre-filled from configuration but overridable
  - Data granularity
  - Benchmark selection per market
- Validation warnings before running:
  - Insufficient data history for the chosen range
  - Data gaps or estimated data points inside the range
  - Range too short to be meaningful
  - Settings that differ from live configuration
- Run control with progress indication and the ability to cancel

### 7.10 Backtest Results

- This screen carries the heaviest metric and chart load; detail in section 8
- Layout:
  - Headline metric strip across the top
  - Equity curve as the primary chart, with benchmark overlay
  - Drawdown chart aligned beneath, sharing the same time axis
  - Tabbed lower area for trades, metrics, breakdowns and validation
- Tabs:
  - Summary — headline metrics and key charts
  - Trades — full trade-by-trade table with the ability to jump to that moment on a chart
  - Metrics — full metric table, grouped by category
  - Breakdown — performance by year, market, instrument type, currency and strategy component
  - Costs — total fees, charges, slippage and conversion costs, and their effect on returns
  - Validation — out-of-sample comparison, parameter sensitivity, outlier dependency
- Always-visible warnings panel flagging:
  - Results dependent on a small number of trades
  - Very high return figures that warrant suspicion
  - Data quality issues within the tested range
  - Unrealistically low cost assumptions
- Actions: save, name, tag, compare with another run, promote strategy stage

### 7.11 Backtest Comparison

- Side-by-side comparison of two to four runs
- Overlaid equity curves, normalised
- Metric table with differences highlighted
- Settings diff showing exactly what changed between runs
- Useful for parameter sensitivity checks

### 7.12 Signals & Approval Queue

- Purpose: the screen where money decisions actually get made
- Signals feed:
  - Every signal generated, including ones the safety layer rejected
  - Showing instrument, direction, strategy, trigger reason, timestamp and outcome
  - Rejected signals show which limit blocked them
- Approval queue:
  - Pending orders awaiting my decision
  - Each showing proposed action, quantity, estimated cost, current price, the reasoning, and the risk checks it passed
  - Impact preview — what the portfolio looks like after this action, including new allocation and remaining limits
  - Countdown if the opportunity is time-sensitive
  - Approve, modify, reject, or reject with reason
  - Bulk approve deliberately restricted or requiring extra confirmation
- Clear separation between simulated and real proposed actions

### 7.13 Orders

- Full order history and live order state
- Columns: instrument, market, broker, direction, quantity, order type, status, requested price, filled price, slippage, fees, timestamps, originating strategy or manual
- Status indicators for pending, partially filled, filled, rejected, cancelled and unconfirmed
- Unconfirmed orders visually escalated — these are the dangerous ones
- Filters by broker, market, status, strategy and date
- Detail view showing the full lifecycle timeline of a single order

### 7.14 Risk & Safety Panel

- Purpose: see and adjust every limit in one place
- Grouped limit displays, each showing the configured threshold, current usage and headroom as a bar
- Grouping: global, per market, per instrument type, per strategy
- Limits to display:
  - Maximum per instrument, sector, market, country
  - Total deployed capital ceiling
  - Mandatory cash reserve
  - Daily, weekly and monthly loss limits
  - Order count limits
  - Repeat-action cooldowns
- Visual escalation as usage approaches a threshold
- Breach history log with cause, time, what was halted and how it resolved
- Emergency controls section, visually separated, with confirmation steps
- Changing any limit requires explicit confirmation and is recorded

### 7.15 System Health

- Purpose: know immediately what is broken
- Live status board:
  - One tile per monitored component — collectors, providers, brokers, cache, databases, strategy engine, execution layer, scheduled jobs, notification channels, the watchdog itself
  - Each tile showing state, last successful check, response time and current issue if any
  - Colour coded by severity, with non-colour indicators too
- Data freshness panel:
  - Per market and per provider, how old the newest data is versus expected
  - Explicit stale indicators rather than silently showing old numbers
- Provider and broker reliability:
  - Uptime history over selectable periods
  - Failure counts and failover events
  - Request usage against configured limits, with headroom bars
  - Cost usage against budget
- Incident history:
  - Every failure with start, duration, severity, affected components, automatic actions taken and resolution
  - Filterable and searchable
- Alert channel test control, with the last test result and timestamp
- This screen must remain usable and informative even when most of the system is down

### 7.16 Reports

- Report types: performance, allocation, costs, income, tax summaries, strategy attribution
- Period selector with presets and custom ranges
- Currency selector affecting the whole report
- Comparison against benchmarks and against previous periods
- Export controls
- Scheduled report configuration and history

### 7.17 Planning

- Allocation targets:
  - Define target percentages by instrument type, country, currency and sector
  - Visual comparison of target versus actual, with drift highlighted
  - Suggested corrective trades with estimated costs
- Goals:
  - Named goals with target amount, target date and linked holdings
  - Progress visualisation and projected completion
- Scenario modelling:
  - Adjust assumptions and see projected outcomes
  - Model the effect of a proposed trade before committing

### 7.18 Configuration Screens

- Shared layout pattern across all configuration areas:
  - List of configured entries with status, enabled toggle and health indicator
  - Detail form for adding or editing
  - Validation feedback shown inline before saving
  - Test connection control where applicable
  - Clear indication that new entries start in simulation mode
  - Capability flags shown as explicit switches, not hidden settings
  - Version history with diff and revert
- Countries and markets: identity, currency, timezone, trading hours, holiday calendar, settlement, fees, tax rules, permitted instrument types, automation permitted
- Data providers: coverage, granularity, history depth, rate limits, cost, priority order, credential reference, health check, freshness expectation
- Brokers: markets, instrument types, capabilities, order types, simulation availability, fees, credentials, automation toggles per instrument type
- Instrument types: enabled, automation permitted, applicable markets, granularity, minimum sizes, settlement, tax thresholds, manual-only flag
- Currencies: base currency selection, exchange rate source, conversion cost assumptions
- Alert rules: per category, per severity, channel selection, escalation rules, quiet hours with critical override
- Credentials: stored references only, never displayed, with expiry tracking and warnings
- Automation permission summary screen showing the layered result — market, broker, instrument type and strategy together — so it is obvious what can actually trade

### 7.19 Alerts Centre

- Chronological list of all alerts with severity, category, source, timestamp and acknowledgement state
- Filters by severity, category, market and acknowledged state
- Grouping of repeated alerts
- Acknowledge and resolve actions with optional notes
- Escalation state visible for unacknowledged critical alerts

### 7.20 Audit Log

- Complete record of configuration changes, approvals, orders, limit changes and stage promotions
- Each entry showing what changed, before and after values, timestamp and trigger
- Filterable and searchable
- Ability to trace a single decision chain end to end, from signal through approval to order to fill

## 8. Chart & Metrics Specification

### 8.1 Chart Types Required

- Candlestick and OHLC bar — price history, the primary chart type
- Line and area — portfolio value, simple price series, normalised comparisons
- Equity curve — strategy value over time, with benchmark overlay
- Underwater/drawdown chart — decline from peak over time, always aligned beneath the equity curve
- Monthly returns heatmap — years as rows, months as columns, colour by return
- Returns distribution histogram — frequency of return outcomes, with normal curve overlay for comparison
- Trade markers overlay — entry and exit points plotted on the price chart
- Allocation donut — simple breakdown by one dimension
- Allocation treemap — nested breakdown, sized by value, coloured by performance
- Stacked area — allocation drift over time
- Correlation matrix heatmap — relationships between holdings or markets
- Rolling metric line charts — performance measures calculated over a moving window
- Benchmark comparison — normalised percentage from a common starting point
- Bar charts — periodic returns, cost breakdowns, win/loss counts
- Waterfall — contribution to total return by component
- Scatter — risk versus return positioning of holdings or strategies
- Gauge or bar meters — limit usage and headroom
- Sparklines — inline trend indicators within tables
- Volume profile — optional, later

### 8.2 Metrics To Display

- Return metrics:
  - Total return, absolute and percentage
  - Annualised return
  - Return for standard periods and custom ranges
  - Return versus benchmark, and excess return over benchmark
  - Return split between price movement and currency movement
  - Return net of costs versus gross
- Risk metrics:
  - Maximum drawdown, its depth, its start and end dates, and recovery duration
  - Current drawdown from peak
  - Volatility over selectable windows
  - Downside deviation
  - Risk-adjusted return measures, presented with plain-language explanation of what each means
  - Value at risk estimate, with an explicit note on its limitations
  - Beta against a chosen benchmark
- Trade metrics:
  - Total number of trades
  - Win rate
  - Average gain per winning trade and average loss per losing trade
  - Ratio of average win to average loss
  - Largest single win and largest single loss
  - Average holding duration, split by winners and losers
  - Longest winning and losing streaks
  - Percentage of total profit contributed by the top few trades — the outlier dependency check
- Cost metrics:
  - Total fees, charges and duties paid
  - Total slippage cost
  - Total currency conversion cost
  - Costs as a percentage of gross return
  - Cost per trade average
- Portfolio metrics:
  - Current allocation versus target, with drift
  - Concentration measures — largest position weight, top holdings share
  - Exposure by country, currency, sector and instrument type
  - Cash percentage
  - Income yield from dividends and payouts
- Live-versus-expected metrics:
  - Live strategy performance compared to its backtest expectation
  - Divergence magnitude, flagged when it exceeds a threshold
  - Actual slippage versus modelled slippage
- Every metric must have an accessible explanation of how it is calculated and what it does and does not tell me

### 8.3 Chart Interaction Requirements

- Crosshair with values for all series at the hovered point
- Synchronised crosshair and time axis across stacked panels
- Zoom by scroll, drag-select and range presets
- Pan by drag
- Reset to default view control
- Series toggle via legend click
- Tooltip showing full precision values with currency and timestamp
- Export chart as image
- Copy underlying data
- Keyboard navigation for accessibility
- Performance target: charts with large historical datasets must remain responsive, using downsampling for wide views and full detail when zoomed in

## 9. Data Table Requirements

- Shared table behaviour across all screens:
  - Column show/hide, reorder and resize
  - Multi-column sorting
  - Per-column filtering
  - Grouping with aggregate rows
  - Row expansion for detail
  - Sticky header and sticky first column
  - Virtualised rendering for long lists
  - Saved layouts per screen
  - Export of the current view
  - Inline visual elements — sparklines, progress bars, badges
  - Keyboard navigation
- Number columns right-aligned with aligned decimal points

## 10. Interface States To Build

- Loading — skeleton placeholders matching final layout, not spinners, so layout does not jump
- Empty — first-use state with guidance on what to do
- No results — filtered state distinct from genuinely empty
- Error — what failed, why, and a retry action
- Stale data — explicit visual marker with the age of the data, applied wherever prices are shown
- Partial data — some markets or providers unavailable, others fine, shown per section not globally
- Offline — main system unreachable, but health and status information still visible
- Degraded — system running with a fallback provider or with automation paused
- Halted — automation stopped by a safety breach, with cause prominently displayed
- Unconfirmed — order state unknown, deliberately escalated visually
- Market closed — prices shown as last close, clearly labelled, not presented as live

## 11. Multi-Country Interface Considerations

- Country indicator on every instrument reference
- Market local time shown alongside any market-specific timestamp
- Currency always explicit where more than one is present
- Dual value display where useful — local currency and base currency together
- Market open/closed state reflected on every instrument row, not just the market strip
- Holiday indication rather than showing a market as simply closed
- Number and date formatting following the relevant market convention where appropriate
- Gain/loss colour convention configurable per market

## 12. Responsive Behaviour

- Large desktop: full multi-panel layouts, side panels expanded
- Small desktop and laptop: side panels collapsible, tables reduce to essential columns
- Tablet: single main panel, navigation drawer, charts simplified
- Mobile: monitoring and approval only
  - Overview summary
  - Holdings list, simplified
  - Alerts and approvals
  - Health status
  - Master stop control
  - Research, configuration and backtesting deliberately excluded

## 13. Accessibility Requirements

- Never convey gain, loss, or system state by colour alone
- Sufficient contrast in both themes, checked against standard guidelines
- Full keyboard navigation, including chart interaction
- Screen reader labels for every metric and chart, with a data table alternative available
- Respect reduced-motion preferences
- Text scaling without layout breakage

## 14. Library Recommendations

- Charting:
  - Lightweight Charts by TradingView — best fit for candlestick, financial time series, very fast, small, free. Use this for the instrument workspace and equity curves.
  - TradingView Advanced Charts — far richer drawing tools and indicators, free for non-commercial use but requires applying for access. Worth considering later for the research screen specifically.
  - Apache ECharts — strongest option for heatmaps, treemaps, correlation matrices, large scatter plots and complex dashboard charts. Handles large datasets well.
  - Recharts or Nivo — simplest for standard dashboard charts if you want React-native composition and do not need heavy customisation.
  - Visx or D3 — only where a genuinely custom visual is needed, such as the monthly returns heatmap or a custom waterfall. Higher effort.
  - Highcharts Stock and Plotly are both capable but carry commercial licensing considerations — check before adopting.
  - Suggested combination: Lightweight Charts for price and equity, ECharts for everything analytical, one lightweight library for simple dashboard charts.
- Data tables:
  - TanStack Table — headless, flexible, free, pairs with any styling. Good default.
  - AG Grid — the strongest feature set for dense financial grids, including grouping and pivoting, but advanced features are commercially licensed.
- UI components:
  - Tailwind with shadcn/ui — full control, no heavy dependency, good for a distinctive dense layout
  - Mantine — excellent built-in components including date handling, good for speed
  - Ant Design — designed for dense data-heavy enterprise interfaces, closest out-of-box fit to this use case
- State and data handling:
  - TanStack Query for server state, caching and refetching — makes swapping mock for real trivial
  - Zustand or similar lightweight store for interface state such as layout and preferences
- Mock data:
  - Mock Service Worker to intercept requests at the network level — this is the key choice, because the UI then makes real requests and swapping to a real backend requires no UI changes
  - Faker or similar for generating realistic values
  - A deterministic seed so mock data is reproducible between sessions
- Time and formatting:
  - Luxon or date-fns with timezone support — essential given multi-country requirements, do not rely on native date handling alone
  - Native internationalisation formatting for currency and numbers
- Forms and validation:
  - React Hook Form with a schema validation library, since the configuration screens are form-heavy
- Do not build custom charting from scratch — the effort is large and the result will be worse

## 15. Mock Data Requirements

- Mock data must be realistic enough to expose layout and readability problems
- Datasets needed:
  - At least three markets across different countries, currencies and timezones, including one where the market is closed while another is open
  - Several years of daily price history for a set of instruments, with realistic volatility
  - Intraday data for at least a few instruments, to exercise the fine-grained chart timeframes
  - At least one instrument with a stock split and one with dividends, to exercise corporate action display
  - A holdings set spanning every configured instrument type, including a manual-only type
  - Multiple purchase lots on the same instrument with different dates
  - Transaction history including fees, charges and currency conversions
  - Backtest results including a good result, a mediocre result and one that is good only because of two outlier trades
  - Trade lists long enough to exercise table virtualisation
  - News items across categories, sentiments, importance levels and languages, including duplicate stories from multiple sources
  - Calendar events, past and upcoming
  - Strategies at every lifecycle stage
  - Pending approvals, including one time-sensitive
  - Orders in every status including unconfirmed and partially filled
  - Alerts at every severity level
  - Health data with some components healthy, one degraded and one down
  - Exchange rate history covering the full price history period
- Scenario switcher in the developer panel to force specific states:
  - All healthy
  - Provider down with failover active
  - Broker disconnected
  - Stale data
  - Safety limit breached and automation halted
  - Empty portfolio, first use
  - Market closed, all markets
  - Loading and error states on demand
- Simulated live updates — prices should tick on a timer so update behaviour and flash animation can be evaluated

## 16. Suggested UI Build Order

- Step 1 — Foundations: design tokens, theme, typography, number and date formatting utilities, layout shell, navigation
- Step 2 — Mock infrastructure: request interception, data generators, scenario switcher, simulated ticking
- Step 3 — Shared components: data table, metric card, chart wrappers, state components for loading, empty, error and stale
- Step 4 — Overview and Holdings, since these exercise most shared components
- Step 5 — Instrument workspace and charting, the heaviest single screen
- Step 6 — System health, because it is self-contained and immediately useful
- Step 7 — Backtest setup and results, the heaviest metric screen
- Step 8 — Strategies, signals, approvals and orders
- Step 9 — Configuration screens, repetitive once the shared pattern exists
- Step 10 — News, reports and planning
- Step 11 — Responsive and accessibility passes across everything
- Step 12 — Full state review, forcing every screen through every state

## 17. Reference Software Worth Studying

- TradingView — the benchmark for chart workspace layout, timeframe controls, indicator panels and drawing tools
- Zerodha Kite and Console — clean, fast, uncluttered retail trading interface with good Indian market conventions; Console is a good model for holdings, P&L and tax reporting views
- Interactive Brokers — multi-country, multi-currency, multi-instrument handling; dense but instructive for how much information can coexist
- Ghostfolio — open-source personal multi-currency portfolio tracker; closest existing thing to the tracking half of this project and the source is available to study
- Sharesight — strong model for multi-country tax reporting and separating currency effect from price return
- Kubera — good reference for consolidated multi-asset net worth presentation
- Portfolio Visualizer — the reference for how to present backtest results, metrics and comparison
- QuantConnect — strategy development, backtest result presentation and trade drill-down
- Composer, Streak and Tradetron — visual strategy builders worth studying for the rule-builder interaction pattern
- Grafana — dashboard density and time-series panel conventions
- Uptime Kuma and public status pages — simple, effective health status board design
- Yahoo Finance and Google Finance — news and quote layout conventions, and how they pair news with price reaction
- Bloomberg Terminal, if accessible — extreme information density, worth studying even though it is not a design target

## 18. Decisions Still Needed Before Starting

- Is desktop-first with a read-only mobile view the right call, or is full mobile parity needed?
- Dark-first or light-first as the default theme?
- Which market's conventions should the interface default to when nothing is configured?
- Should the strategy editor be a visual rule builder, or is writing strategy logic directly acceptable and faster?
- How many markets and instrument types should the mock dataset cover initially — enough to prove the design, without slowing the build?
- Is chart drawing tool support needed in the first version, or can it wait?
- Should the mock phase target a genuinely swappable data layer from day one, or is throwaway mock acceptable?
