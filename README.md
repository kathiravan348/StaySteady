# StaySteady

> Personal Algorithmic Investment & Quantitative Portfolio Management Platform

StaySteady is an institutional-grade, multi-asset algorithmic investment and portfolio tracking platform designed for individual quantitative trading. Built with React 19, TypeScript, and modern financial web engineering principles, it provides real-time market tracking, backtest analytics, strategy lifecycle automation, and execution safeguards.

---

## 🏛️ Monorepo Architecture

The repository is configured as a `pnpm` workspace:

```text
StaySteady/
├── apps/
│   └── web/                   # Main web application (React 19 + Vite 6 + React Router)
│       ├── src/
│       │   ├── data/          # MSW v2 mock infrastructure & domain generators
│       │   ├── features/      # Stage S screen implementations
│       │   ├── routes/        # Declarative client routing (including /workbench)
│       │   ├── shell/         # AppShell chrome (TopBar, Sidebar, Acrylic HUD)
│       │   └── styles/        # SCSS design token contract (142 CSS custom properties)
├── packages/
│   └── ui/                    # @staysteady/ui — Decoupled headless component library
│       ├── src/
│       │   ├── primitives/    # Button, Input, Select, Checkbox, Toggle, Badge, Icon, Spinner, Tooltip, Skeleton
│       │   ├── composites/    # FormField, DropdownMenu, Modal, Drawer, Tabs, Accordion, Toast, Popover, CommandPalette
│       │   ├── layout/        # Stack, Grid, SplitPanel, ScrollArea, Card, PageShell
│       │   ├── data-display/  # MetricDisplay, KeyValuePair, Sparkline, DataList
│       │   ├── state/         # LoadingState, EmptyState, NoResultsState, ErrorState, StaleState, SystemStatusState
│       │   ├── table/         # Virtualized financial DataTable (TanStack Table + Virtual)
│       │   ├── charts/        # TradingView Lightweight Charts & Apache ECharts wrappers
│       │   └── workbench/     # Embedded Component Workbench with live controls
└── Docs/                      # Architecture, Progress Log, UI Specifications & Rules
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js**: `>= 20.11.1`
- **pnpm**: `>= 10.0.0`

### Installation

```bash
# Install all dependencies across the monorepo workspace
pnpm install
```

### Running the Development Server

```bash
# Starts apps/web Vite dev server with MSW v2 mock API and live price ticking
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Quality & Build Verification Commands

```bash
# Run strict TypeScript typechecking across all workspaces (zero errors)
pnpm typecheck

# Run ESLint (presets: typescript-eslint, jsx-a11y) and Prettier code style checks
pnpm lint

# Format all files across the repository with Prettier
pnpm format

# Build production bundles for all workspace packages
pnpm build
```

---

## 🎨 How to Check & Test `@staysteady/ui`

`packages/ui` (`@staysteady/ui`) is completely decoupled from domain DTOs and application code. It exposes 48 headless, accessible components with SCSS modules referencing CSS custom properties.

You can inspect, interact with, and verify `packages/ui` using the following methods:

### 1. Interactive Component Workbench (Visual Testing)

An embedded storybook-style workbench is built directly into the codebase and mounted in the web app:

1. Start the dev server:
   ```bash
   pnpm dev
   ```
2. In your browser, navigate to:
   ```text
   http://localhost:5173/workbench
   ```
3. **Workbench Features & Controls**:
   - **Theme Switcher**: Toggle instantly between `Dark`, `Light`, and `High Contrast` themes. All components adapt dynamically via CSS variables.
   - **Density Switcher**: Toggle between `Comfortable` (default) and `Compact` (high information-density financial trading view).
   - **Gain/Loss Convention Switcher**: Switch between `Green-Up / Red-Down` (Western / Indian markets) and `Red-Up / Green-Down` (East Asian markets).
   - **Search & Filter**: Search through the 43 interactive component stories across 7 categories:
     - **Primitives**: Button, Input, Select, Checkbox, Toggle, Badge, Icon, Spinner, Tooltip, Skeleton.
     - **Composites**: FormField, DropdownMenu, Modal, Drawer, Tabs, Accordion, Toast, Popover, CommandPalette.
     - **Layout**: Stack, Grid, SplitPanel (with mouse/pointer drag resizing), ScrollArea, Card (acrylic elevation), PageShell.
     - **Data Display**: MetricDisplay (with tabular figures, delta badges, direction indicators), KeyValuePair, Sparkline, DataList.
     - **State Components**: LoadingState (skeletons for tables, charts, cards), EmptyState, NoResultsState, ErrorState (with retry), StaleState, SystemStatusState.
     - **Data Table**: Virtualized financial data grid with multi-column sorting, row expansion, tax lot details, and pagination.
     - **Charts**: TradingView Lightweight Charts (candlesticks + volume histograms) and Apache ECharts (equity curves, drawdown heatmaps, allocation donuts).

### 2. Typecheck & Build Testing specifically for `packages/ui`

```bash
# Typecheck only the UI library
pnpm --filter @staysteady/ui typecheck

# Build the UI library bundle
pnpm --filter @staysteady/ui build
```

### 3. Verify Decoupling & Architectural Invariants

> **Status: not currently automated.** A verification script (`verify_stage_l.ts`) was written in
> session 18 but was never committed — it lived in the authoring agent's scratch directory and is
> not in this repository. Task L-12 is reopened as PARTIAL; see `Docs/PROGRESS_LOG.md`.

The invariants it was meant to check are still the rules that matter, and can be checked by hand:

- `packages/ui` has **zero imports** from `apps/web` or domain schemas
  (`grep -r "apps/web\|data/schemas" packages/ui/src` should return nothing).
- Files stay within the length limit (300 lines, per decision 18).
- Everything intended as public is exported from `packages/ui/src/index.ts`.

---

## 🛠️ Technology Stack & Standards

- **Core**: React 19, TypeScript 5.9 (strict: `noImplicitAny`, `exactOptionalPropertyTypes`, `strictNullChecks`).
- **Accessibility**: Powered by [React Aria Components](https://react-spectrum.adobe.com/react-aria/index.html) (headless keyboard navigation, screen reader ARIA contracts).
- **Styling**: SCSS Modules consuming centralized CSS custom properties (`var(--...)`). No Tailwind.
- **Data Table**: TanStack Table v8 + TanStack Virtual v3.
- **Charts**: TradingView Lightweight Charts v5 and Apache ECharts v6 with automated root theme synchronization via `useChartTheme`.
- **Financial Precision**: `decimal.js` for all monetary arithmetic; money is never represented as raw floats.
- **Mocking**: Mock Service Worker (MSW v2) intercepting REST endpoints with stateful scenario switching.
