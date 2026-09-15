# StaySteady — Agent Rules

**Every agent must read this file in full before doing any work. No exceptions.**

Read order at the start of every session:
1. This file
2. `PROGRESS_LOG.md` — current status, handoff note, task registry
3. Only the spec sections relevant to the claimed task

---

## 1. Session Start Procedure

- Read this file completely
- Read `PROGRESS_LOG.md` — specifically the Current Status and Handoff Note sections
- Get the real current date and time from the system, never guess or assume it
- Verify the codebase state matches what the log claims:
  - Run the type check
  - Run the lint check
  - Run the build
  - If any of these fail and the log says the previous session ended clean, record the discrepancy before doing anything else
- Claim exactly one task from the task registry by writing a session-start entry in the log
- Do not begin work before the session-start entry is written

## 2. Scope Discipline

- Do only the task you claimed — nothing else
- Do not refactor code outside the claimed task, even when it looks wrong
  - If something outside scope is broken, log it as a finding, do not fix it
- Do not rename, move or reorganise files outside the claimed task
- Do not upgrade dependencies unless that is the claimed task
- Do not add a dependency without recording it in the log with a reason
- Do not change a decision made in an earlier session without writing a decision-change entry explaining why
- Scope creep across multiple agents is the single fastest way to make this codebase incoherent

## 3. Never Guess At Requirements

- The specification documents are authoritative:
  - `Personal_Investment_Platform_Requirements.md` — what the system does
  - `UI_Specification_Mock_Phase.md` — screens, charts, states
  - `Frontend_Engineering_Standards.md` — how code must be written
- If a spec is silent on something you need:
  - Do not invent a requirement and proceed as if it were decided
  - Log it in the Open Questions section
  - Choose the most reversible option available, mark it clearly as a provisional choice in the log
- If a spec contradicts itself or contradicts existing code, log the conflict and stop; do not pick a side silently

## 4. Engineering Standards Are Not Optional

- Every standard in `Frontend_Engineering_Standards.md` applies to every line you write
- The ones most often broken, listed explicitly:
  - No file over 250 lines
  - No `any` type, in any form
  - No type assertions used to silence errors
  - No raw colour, spacing, radius or font-size values outside token files
  - No hardcoded breakpoints
  - Every component works in every theme
  - Explicit return types on exported functions
  - Money never represented as a plain number
  - Branded types for currency amounts, timestamps and identifiers
- If following a standard makes the task impossible, log it as a conflict rather than breaking the standard quietly

## 5. Mock Phase Restrictions

- This phase is mock data only
- Never write code that connects to a real broker, a real data provider or any live financial service
- Never add real credentials, API keys or account identifiers to any file
- Never add anything that could place a real order, in any code path, even disabled
- All data access goes through the mock layer so the real layer can be swapped in later without UI changes

## 6. Definition Of Done

A task is only complete when every one of these is true:

- Type check passes with zero errors
- Lint passes with zero errors
- Build succeeds
- The feature works in every theme
- Loading, empty, error and stale states are built, not just the happy path
- No file exceeds the line limit
- Component stories exist for any new library component
- The log entry is written

- Do not mark a task complete because it looks finished. Verify it.
- Partial completion is fine and expected. Mark it partial and describe precisely what remains.

## 7. Honest Reporting

- Never claim work you did not do
- Never claim a check passed without running it
- If you ran out of context mid-task, say so plainly in the log
- If you made a mistake in an earlier part of this session, record it rather than quietly fixing it
- An inaccurate log is worse than no log, because the next agent will trust it and build on a false foundation

## 8. Session End Procedure

**Always leave the codebase in a working state. Never end mid-file.**

- If approaching a context or usage limit, stop early and hand off cleanly rather than pushing on
  - Better to hand off at 70% with clean code than at 95% with a half-written file
- Before ending:
  - Finish or revert any partially written file — never leave a file that does not parse
  - Run type check, lint and build
  - Record the results honestly, including failures
  - Update the task registry status
  - Write the session-end entry in the log
  - Rewrite the Handoff Note section completely, for the next agent
  - Update Current Status
- The handoff note must let a fresh agent with no memory of this session continue without guessing

## 9. Conflict Resolution Order

When two sources disagree, follow this order:

1. This rules file
2. `Frontend_Engineering_Standards.md`
3. The specification documents
4. Existing code patterns in the repository
5. Your own preference — last, and only when the above are all silent

- Never override an earlier agent's decision on preference alone
- If existing code contradicts a standard, log it; do not replicate the violation and do not fix it outside scope

## 10. Cross-Agent Consistency

- Match the patterns already present in the codebase, even if you would have done it differently
- Consistency across the codebase matters more than any individual agent's preferred style
- Before creating a new utility, hook or component, check whether one already exists
- Before creating a new pattern, check how the same problem was solved elsewhere in the repository
- Different agents solving the same problem three different ways is the main failure mode of multi-agent work

## 11. Log Hygiene

- Never delete or edit a past log entry — the history is append-only
- Corrections are made by adding a new entry that references the earlier one
- Current Status and Handoff Note are the only mutable sections
- Keep entries factual and short; the log is read by every future agent and wastes their context if it rambles
- When the log exceeds roughly 500 lines, move entries older than the last three sessions into an archive file and leave a pointer

## 12. Forbidden Actions

- Deleting or rewriting log history
- Marking a task complete without verification
- Adding real credentials or live service connections
- Disabling lint rules, type checks or build checks to make something pass
- Suppressing type errors with comments to ship
- Large unrequested refactors
- Changing the engineering standards documents
- Changing the specification documents without being asked to
- Starting work without a session-start log entry
- Ending a session without a session-end log entry and an updated handoff note
