# `@staysteady/ui`

Decoupled, institutional-grade financial component library for StaySteady.

---

## Features

- **Decoupled Architecture**: 100% independent package in a pnpm monorepo. Zero domain imports or coupling to `apps/web`.
- **Accessibility Layer**: Built on top of **React Aria Components (RAC)** for WCAG-compliant keyboard navigation and screen-reader support.
- **Design Tokens & Themes**: Styled with CSS Modules referencing centralized CSS custom properties (`var(--...)`). Supports runtime dynamic switching across:
  - **Themes**: `Dark`, `Light`, `High Contrast`
  - **Densities**: `Comfortable`, `Compact`
  - **Gain/Loss Conventions**: `Green-Up` (Western/IN), `Red-Up` (East Asia)
- **Financial Components**:
  - **DataTable**: Virtualized grid (`@tanstack/react-table` + `@tanstack/react-virtual`) supporting multi-column sorting, row expansion, sticky headers, and pagination.
  - **Charts**: Wrappers for **TradingView Lightweight Charts v5** (candlesticks, bars, volumes) and **Apache ECharts v6** (equity curves, drawdowns, heatmaps, donuts).
  - **Theme Synchronization**: `useChartTheme` automatically updates chart instances via `MutationObserver` on root theme attributes without unmounting.

---

## Directory Structure

```text
packages/ui/src/
├── primitives/     # Button, Input, Select, Checkbox, Toggle, Badge, Icon, Spinner, Tooltip, Skeleton
├── composites/     # FormField, DropdownMenu, Modal, Drawer, Tabs, Accordion, Toast, Popover, CommandPalette
├── layout/         # Stack, Grid, SplitPanel, ScrollArea, Card, PageShell
├── data-display/   # MetricDisplay, KeyValuePair, Sparkline, DataList
├── state/          # LoadingState, EmptyState, NoResultsState, ErrorState, StaleState, SystemStatusState
├── table/          # DataTable, TablePagination, types
├── charts/         # PriceChart, AnalyticalChart, useChartTheme
├── workbench/      # WorkbenchShell & 38 interactive component stories
└── utils/          # cx classnames helper
```

---

## Development & Testing

```bash
# Typecheck packages/ui
pnpm --filter @staysteady/ui typecheck

# Build packages/ui bundle
pnpm --filter @staysteady/ui build

# Launch the interactive Component Workbench
pnpm dev
# Then open http://localhost:5173/workbench in your browser
```
