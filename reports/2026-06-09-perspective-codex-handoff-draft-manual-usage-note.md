# Perspective Codex Handoff Draft Manual Usage Note

Date: 2026-06-09

## Summary

This PR adds a concise human-facing manual usage note for Codex next-handoff
drafts. It explains when a draft is safe to paste, how to read grouped
`expected_file_scope`, and what authority boundaries must remain visible.

## Why This Follows PR #472

PR #472 refined expected-file scope readability by adding grouped
`expected_file_scope` display while preserving the full canonical
`codex_task.expected_files` list as scope.

This PR adds the next usability layer: a practical note for humans reviewing a
copyable draft before starting a Codex task.

## Usage Problem Addressed

The handoff draft can be technically safe and still require human
interpretation. A user needs a short review path for draft status, omitted
files, expected-file grouping, concrete checks, skipped-check policy, and the
PR-centered workflow.

This note clarifies that `ready_to_copy` means copyable after review, not
approval, execution, evidence, readiness, merge authority, or a Core decision.

## Files Changed

- `docs/PERSPECTIVE_CODEX_HANDOFF_DRAFT_MANUAL_USAGE_NOTE_V0_1.md`
- `reports/2026-06-09-perspective-codex-handoff-draft-manual-usage-note.md`
- `scripts/smoke-perspective-codex-handoff-draft-manual-usage-note.mjs`
- `package.json`
- `docs/PERSPECTIVE_CODEX_HANDOFF_EXPECTED_FILE_SCOPE_READABILITY_V0_1.md`
- `docs/PERSPECTIVE_CODEX_NEXT_HANDOFF_DRAFT_PACKET_V0_1.md`
- `docs/PERSPECTIVE_CODEX_NEXT_HANDOFF_DRAFT_DOGFOOD_V0_1.md`
- `docs/PERSPECTIVE_CODEX_HANDOFF_DRAFT_REAL_DOCS_TASK_EVAL_V0_1.md`
- `docs/PERSPECTIVE_FORMATION_LANE_V0_1.md`
- neighboring Perspective smoke allowlists required by this explicit
  docs/report/smoke/package usage-note slice

## Authority Boundary

This is a docs/report/smoke/package-only usage note PR. It does not execute
Codex, authorize merge, grant approval, mutate GitHub outside this scoped PR
workflow, or start background work.

The usage note keeps the PR-centered workflow explicit: Codex
codes/tests/opens PR, ChatGPT reviews, and the user decides merge.

## Validation Plan

- `npm run typecheck`
- `npm run smoke:perspective-codex-handoff-draft-manual-usage-note`
- `npm run smoke:perspective-codex-handoff-expected-file-scope-readability`
- `npm run dogfood:perspective-codex-next-handoff-draft`
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
- PASS: `npm run smoke:perspective-codex-handoff-draft-manual-usage-note`
- PASS: `npm run smoke:perspective-codex-handoff-expected-file-scope-readability`
- PASS: `npm run dogfood:perspective-codex-next-handoff-draft`
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
- Browser validation: skipped because this is a docs/report/smoke/package-only
  usage-note slice with no UI or route changes.
- Evidence/proof closeout: skipped because `CODEX_WORK_ID` is missing.

## Evaluation Conclusion

PASS. The manual usage note is ready as the next docs/report/smoke/package
usability step after PR #472. It explains the human review path for
`ready_to_copy`, grouped `expected_file_scope`, omitted-file coverage,
concrete checks, skipped-check policy, and PR-centered workflow without
changing runtime behavior or authority.

## Next Recommended PR Title

Add copy-ready checklist to Codex handoff draft text
