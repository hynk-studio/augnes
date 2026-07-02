# Active Development Completion Posture v0.1

## Purpose

Augnes development should default to functional goal completion, measurable
capability improvement, performance improvement, and behavior-focused tests.

Planning-only, approval-gate-only, smoke-only, and boundary-only PRs are not the
default. Use them only when an explicit operator task asks for that narrow
artifact and there is no useful implementation or behavior test to complete in
the same slice.

## Active Defaults

- Prefer working routes, helpers, types, UI, stores, and operator-visible
  workflows over planning artifacts.
- Prefer measurable performance, reliability, and workflow improvements over
  preserving historical process notes.
- Prefer real unit, integration, smoke, and browser tests that exercise behavior
  over tests that only assert forbidden capabilities.
- Use docs and smokes to support implementation, not replace it.
- Treat older read-only, preview-only, no-run, approval-gate, and planning
  documents as historical context only. They must not be used as current PR
  sequencing authority.
- Keep current docs short and tied to implemented behavior, live contracts,
  current routes/helpers/types/UI, or real regression tests.
- Delete obsolete planning residue instead of preserving it for possible future
  reference.

## Reporting

Final reports should begin with:

1. What now works.
2. What workflow or capability improved.
3. What tests passed.

Only after that should reports mention deleted residue, retained historical
compatibility notes, skipped checks, or remaining limitations.
