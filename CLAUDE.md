# StaySteady

Personal algorithmic investment platform. pnpm monorepo: `apps/web` (React 19 + Vite) and
`packages/ui` (`@staysteady/ui`, headless component library). **Mock data phase — no backend.**

## Read this first, in this order

1. `Docs/AGENT_RULES.md` — the working protocol, in full
2. `Docs/PROGRESS_LOG.md` **sections 1–3 only** — status, handoff note, task registry
3. `Docs/DECISIONS.md` — binding decisions
4. Only the spec sections relevant to the claimed task
   Do **not** read `Docs/PROGRESS_ARCHIVE.md` or `PROGRESS_LOG.md` section 4 at session start.
   They are history. Open a single entry only if you need that specific session.

Specs, read by section not in full: `Personal_Investment_Platform_Requirements.md` (what it
does), `UI_Specification_Mock_Phase.md` (screens), `Frontend_Engineering_Standards.md` (how).

## Commands

```bash
pnpm dev         # Vite dev server + MSW mock API on :5173
pnpm typecheck   # tsc --noEmit, all workspaces
pnpm lint        # eslint + prettier --check
pnpm build       # typecheck + vite build
```

## Hard constraints

- **Mock phase only.** Never connect to a real broker or data provider. Never add credentials.
  No code path may place a real order, even disabled.
- **Money is never a plain number.** Use `Money` (decimal.js) from `apps/web/src/shared/money`.
  DTO amounts are strings — convert with `moneyFromDto` before formatting.
- **`packages/ui` must never import from `apps/web` or any domain DTO.** It is fully decoupled.
- **Features never import each other.** Shared UI goes in `apps/web/src/shared`.
- **Screens fetch only through `data/api` hooks.** No raw `fetch` in a component.
- No `any`. No type assertions to silence errors. No raw colour/spacing values outside tokens.
- Every screen needs loading, empty, error and stale states — not just the happy path.

## Copy these patterns instead of inventing new ones

| Need                              | Reference implementation                                    |
| --------------------------------- | ----------------------------------------------------------- |
| Configuration screen              | `features/settings/markets` + `shared/config` (decision 38) |
| List + filters + row detail       | `features/trading/orders`                                   |
| Data fetching + schema validation | `data/api/apiClient.ts`, `data/api/*Queries.ts`             |
| Mock endpoint + seeded data       | `data/mock/handlers`, `data/mock/generators`                |

Read a component's props before using it. Check `packages/ui/src/index.ts` for what exists.

## Context discipline

Work one registry task at a time. Clear context between tasks. Name exact file paths rather
than searching broadly — a repo-wide grep can cost more than the edit.
