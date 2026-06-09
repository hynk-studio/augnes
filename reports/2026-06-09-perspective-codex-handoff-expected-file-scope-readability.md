# Perspective Codex Handoff Expected-File Scope Readability

Date: 2026-06-09

## Summary

This PR refines Codex next-handoff draft expected-file readability. It keeps
the complete canonical flat `expected_files` scope while adding a grouped
display in `copyable_codex_handoff_text`.

The grouped display makes the draft easier for a human to review before
pasting into Codex without reducing safety coverage.

## Why This Follows PR #471

PR #471 evaluated the refined Codex handoff draft in a real docs-only Codex
task and concluded PASS with follow-up. The follow-up was expected-file scope
readability: the draft was usable, but expected files could be safe and still
noisy.

## Problem Addressed

Expected files were safe but noisy. The flat list preserved scope, but it did
not help the reader distinguish primary files from docs/reports, dogfood
artifacts, smoke/validation files, package metadata, and neighboring smoke
allowlist files.

This PR groups expected files for readability while keeping the full list as
the scope. No expected files are omitted, no scope is reduced, and guardrail
files remain visible.

## Files Changed

- `lib/perspective-ingest/perspective-codex-next-handoff-draft-packet.ts`
- `docs/PERSPECTIVE_CODEX_HANDOFF_EXPECTED_FILE_SCOPE_READABILITY_V0_1.md`
- `reports/2026-06-09-perspective-codex-handoff-expected-file-scope-readability.md`
- `scripts/smoke-perspective-codex-handoff-expected-file-scope-readability.mjs`
- `docs/PERSPECTIVE_CODEX_NEXT_HANDOFF_DRAFT_PACKET_V0_1.md`
- `docs/PERSPECTIVE_CODEX_NEXT_HANDOFF_DRAFT_DOGFOOD_V0_1.md`
- `docs/PERSPECTIVE_CODEX_HANDOFF_DRAFT_REAL_DOCS_TASK_EVAL_V0_1.md`
- `docs/PERSPECTIVE_FORMATION_LANE_V0_1.md`
- `scripts/dogfood-perspective-codex-next-handoff-draft.mjs`
- `scripts/smoke-perspective-codex-next-handoff-draft-packet.mjs`
- `scripts/smoke-perspective-codex-next-handoff-draft-dogfood.mjs`
- `reports/dogfood/2026-06-09-perspective-codex-next-handoff-draft-packet.md`
- `package.json`
- neighboring Perspective smoke allowlists required by this explicit pure
  local readability slice

## Authority Boundary

This is a pure local builder/copy/docs/report/smoke/package refinement. It
does not execute Codex, does not authorize merge, does not grant approval,
does not mutate GitHub outside this scoped PR workflow, and does not create
background work.

Boundary shorthand: no merge, no approval, no GitHub mutation, and no
background work.

The copyable draft remains a draft prompt for a future user-started Codex task.
PR-centered workflow remains: Codex codes/tests/opens PR, ChatGPT reviews, and
the user decides merge.

## Validation Plan

- `npm run typecheck`
- `npm run dogfood:perspective-codex-next-handoff-draft`
- `npm run smoke:perspective-codex-handoff-expected-file-scope-readability`
- `npm run smoke:perspective-codex-handoff-draft-real-docs-task-eval`
- `npm run smoke:perspective-codex-next-handoff-draft-dogfood`
- `npm run smoke:perspective-codex-next-handoff-draft-packet`
- `npm run smoke:perspective-user-judgment-capture-packet`
- `npm run smoke:perspective-candidate-briefing-preview`
- `npm run smoke:perspective-candidate-builder-fixture`
- `npm run smoke:perspective-formation-input-bundle-builder`
- `npm run smoke:perspective-formation-lane-v0-1`
- `npm run smoke:perspective-agent-brief-read-surface`
- `npm run smoke:perspective-temporal-spatial-projection-builders`
- `npm run smoke:perspective-ingest-constellation-preview`
- `git diff --check`
- `git diff --cached --check`
- `npm run build`

## What Is Not Implemented

- No runtime route.
- No app/API change.
- No DB schema, migrations, persistence, graph DB behavior, source ingress, or
  OAuth.
- No provider/model/API calls.
- No proof/evidence/readiness writes.
- No ChatGPT Apps implementation.
- No Codex plugin implementation.
- No Codex SDK execution.
- No product UI, component, CSS, or browser-facing behavior changes.
- No Event Rail, graph topology, node id/type, edge id/type, packet section
  order, Agent Brief read route behavior, local manual preview route behavior,
  or Perspective runtime route behavior changes.
- No merge, publish, deploy, approval, retry, replay, or external posting.

## Tests Run

- PASS: `npm run typecheck`
- PASS: `npm run dogfood:perspective-codex-next-handoff-draft`
- PASS: `npm run smoke:perspective-codex-handoff-expected-file-scope-readability`
- PASS: `npm run smoke:perspective-codex-handoff-draft-real-docs-task-eval`
- PASS: `npm run smoke:perspective-codex-next-handoff-draft-dogfood`
- PASS: `npm run smoke:perspective-codex-next-handoff-draft-packet`
- PASS: `npm run smoke:perspective-user-judgment-capture-packet`
- PASS: `npm run smoke:perspective-candidate-briefing-preview`
- PASS: `npm run smoke:perspective-candidate-builder-fixture`
- PASS: `npm run smoke:perspective-formation-input-bundle-builder`
- PASS: `npm run smoke:perspective-formation-lane-v0-1`
- PASS: `npm run smoke:perspective-agent-brief-read-surface`
- PASS: `npm run smoke:perspective-temporal-spatial-projection-builders`
- PASS: `npm run smoke:perspective-ingest-constellation-preview`
- PASS: `git diff --check`
- PASS: `git diff --cached --check`
- PASS: `npm run build` (the build temporarily rewrote `next-env.d.ts`;
  that generated out-of-scope churn was restored before closeout)

## Skipped Checks

- `AUGNES_API_BASE_URL=http://localhost:3000 CODEX_SCOPE=project:augnes npm run codex:read-brief`:
  skipped because the helper returned `CODEX_READ_BRIEF_RUNTIME_UNAVAILABLE`.
- `npm run lint`: skipped because `package.json` does not define a lint script.
- `npm test`: skipped because `package.json` does not define a test script.
- Browser validation: skipped because this is a pure local
  builder/copy/docs/report/smoke/package slice with no UI or route changes.
- Evidence/proof closeout: skipped because `CODEX_WORK_ID` is missing.

## Evaluation Conclusion

PASS with follow-up. Expected files are grouped for readability, the full list
remains the scope, primary files are easier to separate from docs/reports and
smoke/validation files, neighboring smoke allowlist files remain visible, and
no expected files are omitted.

## Next Recommended PR Title

Prepare manual usage note for Codex handoff drafts
