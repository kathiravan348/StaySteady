# StaySteady
## Frontend Engineering Standards

## 1. The One Decision That Shapes Everything Else

- SCSS variables are resolved at build time, not at runtime
- This means a theme built purely from SCSS variables cannot be switched without reloading a different stylesheet
- Recommended approach — use both, each for what it is good at:
  - SCSS authors and generates the token sets, handles maths, loops and validation at build time
  - CSS custom properties carry the actual values at runtime, so switching a theme is a single attribute change on the root element
  - Components only ever reference CSS custom properties, never raw SCSS variables
- Result:
  - Instant theme switching with no flash, no reload, no duplicate stylesheet downloads
  - Themes still authored in SCSS, so they stay organised and maintainable
  - A new theme is a new token map, not new component code
- Consequence to accept: components must never hardcode a colour, spacing value or radius; every visual value comes from a token

## 2. Conflict With Earlier Recommendation

- The UI specification suggested Tailwind with a component kit
- Tailwind and an SCSS token system overlap heavily — running both means two sources of truth for spacing, colour and typography
- Given the SCSS requirement, revised recommendation:
  - CSS Modules with SCSS for all styling
  - A headless or unstyled component library for behaviour, so accessibility and keyboard handling are not rebuilt by hand
  - Style those headless components with the SCSS token system
- Alternative if speed matters more than control:
  - A component kit with first-class CSS variable theming, styled through the same token layer
- Avoid: mixing Tailwind utility classes and SCSS modules in the same codebase

## 3. Theme Architecture

### 3.1 Token Layers

- Layer 1 — Primitive tokens:
  - Raw values with no meaning attached
  - Colour scales, spacing scale, radius scale, font sizes, shadow definitions, z-index scale, duration scale
  - Never referenced directly by components
- Layer 2 — Semantic tokens:
  - Meaning applied to primitives
  - Surface levels, text emphasis levels, border weights, interactive states, focus rings
  - This is the layer components consume
- Layer 3 — Domain tokens:
  - Meaning specific to this product
  - Gain and loss colours, alert severity colours, market open and closed states, data freshness states, automation mode colours, chart series palette
  - Also consumed directly by components
- Layer 4 — Component tokens:
  - Only where a component genuinely needs its own variation
  - Always derived from semantic or domain tokens, never from primitives
- Rule: a component may reference layers 2, 3 and 4 only

### 3.2 Themes To Support

- Dark — the default
- Light
- High contrast — accessibility, not a stylistic variant
- Reserve the structure for additional themes without code changes

### 3.3 Keep Colour Convention Separate From Theme

- Gain and loss direction convention differs by market — green-up in most Western markets and India, red-up in China, Japan, Korea and Taiwan
- Do not create a theme for each combination, which multiplies themes unnecessarily
- Treat it as an independent axis:
  - Theme controls surfaces, text and chrome
  - Directional convention controls only which colour maps to positive and which to negative
  - Both applied as separate attributes on the root element
- Same principle for density — comfortable and compact are a separate axis, not separate themes

### 3.4 Theme Versioning

- Each theme carries a version identifier
- A theme version records:
  - Which token contract version it satisfies
  - What changed from the previous version
- Token contract:
  - The full list of semantic and domain tokens every theme must define
  - Enforced at build time — a theme missing a required token fails the build rather than silently falling back
- When a new token is added to the contract:
  - Contract version increments
  - Every theme must supply the new token before the build passes
- Deprecated tokens are marked, warned on, and removed only on a contract version bump
- Themes stored so that an older theme version can be restored without archaeology

### 3.5 Theme Runtime Requirements

- Theme applied via an attribute on the root element, not by swapping stylesheet links
- Theme preference persisted, with a system-preference option that follows the operating system
- No flash of wrong theme on load — resolve before first paint
- Switching theme must not remount the application or reset interface state
- Charts must re-read their colours on theme change, since most chart libraries capture colours at initialisation
- Respect reduced-motion and increased-contrast system preferences independently of theme choice

## 4. Component Library Structure

### 4.1 Separation

- The component library is a separate package from the application
- The library knows nothing about the domain:
  - No references to holdings, strategies, orders or markets
  - No data fetching
  - No routing
- Domain components live in the application and are composed from library primitives
- Test of whether something belongs in the library: could it be used in an unrelated project without modification

### 4.2 Layering

- Primitives — button, input, select, checkbox, toggle, badge, icon, spinner, tooltip, skeleton
- Composites — form field, dropdown menu, modal, drawer, tabs, accordion, toast, popover, command palette
- Layout — stack, grid, split panel, resizable panel, scroll area, page shell
- Data display — table, list, key-value pair, metric display, sparkline, empty state, error state
- Chart wrappers — thin adapters over the chosen chart libraries that apply tokens and handle theme changes
- A component may only import from its own layer or below — no upward imports

### 4.3 Library Rules

- Every component:
  - Fully typed with explicit prop types
  - No required props without sensible behaviour when omitted where reasonable
  - Forwards refs where the underlying element would accept one
  - Passes through standard element attributes
  - Keyboard accessible and screen-reader labelled
  - Works in every theme, verified not assumed
  - Has a documented example
- No component reaches outside itself to style a parent or sibling
- No component fetches data or reads global application state
- Exports are explicit and named; avoid deep import paths into internals

### 4.4 Documentation

- A component workbench such as Storybook, with a story per component showing:
  - Every variant
  - Every state including loading, disabled, error and empty
  - Every theme, switchable in the workbench
  - Both density settings
- The workbench doubles as the visual regression test target
- A component without a story is treated as incomplete

## 5. File Size Standard

### 5.1 The Rule

- Target: no file exceeds 250 lines
- Applied to all source files, not only pages
- Enforced as a lint warning at 200 lines and an error at 250
- Documented exceptions allowed with an inline justification comment, reviewed rather than silently accumulated
- Generated files, token definitions and type definition files are exempt

### 5.2 Why A Line Limit Alone Is Not Enough

- A hard limit without a decomposition pattern produces artificially split files that are harder to follow than one longer file
- The limit should be the symptom that triggers extraction, not the goal itself
- If splitting a file requires passing six arguments between the halves, the split is wrong and the structure needs rethinking instead

### 5.3 Decomposition Pattern

- A page file contains composition only:
  - Layout arrangement
  - Which sections appear
  - Wiring between sections
  - Typically well under 100 lines
- Everything else is extracted:
  - Data access and caching into dedicated data hooks
  - Interaction state and side effects into behaviour hooks
  - Calculations and transformations into pure functions
  - Visual sections into section components
  - Repeated visual pieces into library components
  - Configuration such as column definitions into their own files
- Rule of thumb: if a page file contains a calculation, it is in the wrong place

### 5.4 Complexity Limits Alongside Line Count

- Maximum nesting depth of four
- Maximum function length of fifty lines
- Maximum parameters of four, beyond which use an options object
- Maximum cyclomatic complexity threshold enforced by lint
- One component per file, with the file named after it

## 6. TypeScript Standards

### 6.1 Compiler Configuration

- Strict mode fully enabled, no individual strict flags disabled
- Additional flags to enable:
  - Unchecked index access, so array and record lookups are treated as possibly undefined
  - Exact optional property types
  - No unused locals and no unused parameters
  - No implicit returns
  - No fallthrough in switch statements
  - No implicit override
  - Force consistent file name casing
- Isolated modules enabled
- Build fails on any type error; type errors are never suppressed to ship

### 6.2 Prohibited

- The any type, in any form, including implicit
- Type assertions used to silence errors rather than to narrow a genuinely known type
- Non-null assertions, except where a preceding guard makes it provably safe and a comment explains why
- Suppression comments without a linked reason and an expiry expectation
- Function types without declared return types on exported functions
- Object types declared as a bare object, index signature without a value type, or similar escape hatches
- Enums — use constant objects with derived union types instead, for better runtime behaviour and narrowing
- Default exports, except where a framework requires them

### 6.3 Required Patterns

- Explicit return types on all exported functions and hooks
- Discriminated unions for anything with mutually exclusive states — loading, error, success, stale, empty
- Never model state as multiple independent booleans where only one can be true
- Exhaustive switch handling, enforced by an unreachable check so a new case becomes a compile error
- Readonly on arrays and object properties that should not be mutated
- Unknown rather than any at every boundary, narrowed by validation
- All external data validated at runtime with a schema, with the type derived from the schema rather than declared separately
- This applies to mock data too, so the mock and real layers share one contract

### 6.4 Domain Type Rules — Important For This Project

- Never represent money as a plain number
  - Floating point arithmetic produces rounding errors that accumulate across thousands of simulated trades
  - Use integer minor units or a decimal library, consistently, everywhere
- Use branded types so different quantities cannot be accidentally mixed:
  - An amount in one currency must not be assignable to an amount in another
  - A local-currency value must not be assignable to a base-currency value
  - A percentage must not be assignable to a ratio
  - A market-local timestamp must not be assignable to a universal timestamp
  - A quantity of units must not be assignable to a monetary amount
- Conversion between branded types only through explicit named functions, never by assertion
- This is the single highest-value typing decision in the project — currency and timezone mixups are the most likely source of silently wrong numbers
- Identifiers for instruments, strategies, orders and markets are branded, not bare strings
- Dates and times are never plain strings in application code; parse at the boundary, format at the edge

## 7. SCSS Standards

### 7.1 Organisation

- Separate directories for tokens, themes, mixins, functions and global styles
- Component styles live beside their component as a module file, never in a global stylesheet
- Global styles limited to reset, root variables, font loading and base element defaults
- No component may add a global style

### 7.2 Rules

- No raw colour values outside the token files — enforced by lint
- No raw spacing, radius, font size or duration values outside token files
- Maximum nesting depth of three
- No element selectors in component styles, only class selectors
- No id selectors
- Avoid deep descendant selectors that couple to another component's internals
- No important declarations, except in a documented utility with a justification
- Media query breakpoints only from named mixins, never hardcoded
- Focus visible styling never removed, only restyled

### 7.3 Naming

- Consistent convention across the codebase, chosen once
- CSS Modules already scopes class names, so overly long block-element names are unnecessary
- Class names describe purpose, not appearance — avoid names referring to a colour or position that may change

### 7.4 Shared Mixins To Provide

- Responsive breakpoint helpers
- Focus ring
- Truncation, single line and multi line
- Visually hidden for screen reader only content
- Scrollbar styling consistent with theme
- Numeric alignment for tabular figures
- Elevation and shadow levels
- Reduced motion guard

## 8. Folder Structure

- Feature-based rather than type-based — group by what it does, not what kind of file it is
- Each feature folder contains its pages, sections, hooks, logic and types together
- Shared code promoted out of features only once genuinely used by more than one
- Suggested top-level areas:
  - Application shell, routing and providers
  - Features, one folder per area of the navigation map
  - Shared domain logic and types used across features
  - Data layer, including the mock implementation
  - Styles, tokens and themes
  - The component library as a separate package
- Import rules enforced by lint:
  - Features may not import from each other directly
  - Anything shared between features moves to the shared layer
  - The library never imports from the application

## 9. Enforcement

- Standards that are not enforced automatically will drift
- Lint configuration covering:
  - TypeScript rules from the strict rule set
  - Import ordering and restricted import paths
  - File length and complexity limits
  - Accessibility rules on markup
  - SCSS rules including forbidden raw values and nesting depth
- Formatting handled by a formatter, not by review comments, with no per-file overrides
- Pre-commit hooks running lint and type checking on changed files only, to stay fast
- Full type check, lint and test run in the build pipeline
- Build fails on any violation; warnings that are never fixed become errors
- No standard is added without a way to enforce it

## 10. Testing Standards

- Type checking is the first line of defence and covers more than tests do
- Unit tests for pure logic, especially any calculation involving money, currency conversion, percentage returns or date handling
- Component tests for behaviour and accessibility, not for visual appearance
- Visual regression tests against the component workbench, covering every theme
- Do not chase a coverage percentage; cover the calculations that produce numbers shown to the user, since those are the ones that can be silently wrong

## 11. Performance Standards

- Route-level code splitting from the start
- Chart libraries loaded lazily, since they are the largest dependency
- Long lists and tables virtualised, always
- Memoise expensive calculations, but only after measuring
- Avoid re-rendering the whole page on a price tick — scope updates to the values that changed
- A bundle size budget defined and checked in the build, with failures rather than warnings

## 12. Decisions Needed

- Which headless component library or component kit will the library be built on?
- CSS Modules with SCSS, or SCSS with a naming convention and no modules?
- Which decimal representation for money — integer minor units, or a decimal library?
- Is the component library a separate repository, or a workspace package in the same repository?
- Should the 250-line limit apply to test files and story files, or exempt them?
- How many themes at launch — is high contrast needed in the first version, or planned for later?
