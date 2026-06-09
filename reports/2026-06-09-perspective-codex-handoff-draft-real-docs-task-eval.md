# Perspective Codex Handoff Draft Real Docs Task Evaluation

Date: 2026-06-09

## Summary

This PR evaluates the refined Codex next-handoff draft from PR #470 in a real
docs/report/smoke/package-only Codex task.

Evaluation conclusion: PASS with follow-up. The draft is usable for future
explicitly user-started docs-only Codex tasks. The main follow-up is to make
expected-file scope easier to read without removing guardrails.

## Why This Follows PR #470

PR #470 made the copyable Codex handoff draft more direct and fixed an
under-scoped expected files issue found after PR #469. This PR uses that
refined draft as source context for an actual docs-only PR workflow and records
whether it is usable in practice.

## Real Docs-Only Task Evaluated

The evaluated task was to create a short evaluation document explaining
whether the refined Codex next-handoff draft is usable for a real
docs/report/smoke/package-only Codex PR.

The evaluation specifically checked whether the draft prompt for a future
user-started Codex task made review before pasting visible, kept no-execution
and no-authority boundaries visible, scoped expected files and required checks,
preserved forbidden files and forbidden surfaces, and made the PR-centered
workflow clear.

## Source Material Reviewed

- `reports/dogfood/2026-06-09-perspective-codex-next-handoff-draft-packet.md`
- `docs/PERSPECTIVE_CODEX_NEXT_HANDOFF_DRAFT_PACKET_V0_1.md`
- `docs/PERSPECTIVE_CODEX_NEXT_HANDOFF_DRAFT_DOGFOOD_V0_1.md`
- `reports/2026-06-09-perspective-codex-next-handoff-draft-copy-refine.md`

## Files Changed

- `docs/PERSPECTIVE_CODEX_HANDOFF_DRAFT_REAL_DOCS_TASK_EVAL_V0_1.md`
- `reports/2026-06-09-perspective-codex-handoff-draft-real-docs-task-eval.md`
- `scripts/smoke-perspective-codex-handoff-draft-real-docs-task-eval.mjs`
- `package.json`
- `docs/PERSPECTIVE_CODEX_NEXT_HANDOFF_DRAFT_DOGFOOD_V0_1.md`
- `docs/PERSPECTIVE_FORMATION_LANE_V0_1.md`
- neighboring Perspective smoke allowlists required by this explicit
  docs-only evaluation slice

## Authority Boundary

This PR is docs/report/smoke/package-only. It does not execute Codex, does not
authorize merge, does not grant approval, does not mutate GitHub outside the
scoped PR workflow, and does not add background work.

PR-centered workflow remains: Codex codes/tests/opens PR, ChatGPT reviews, and
the user decides merge.

## Validation Plan

- `npm run typecheck`
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
  slice with no UI or route changes.
- Evidence/proof closeout: skipped because `CODEX_WORK_ID` is missing.

## Blockers or Risks

No current blocker. The main risk is that expected-file scope can become hard
to scan even when the file list is safer and appropriately scoped.

Operational note: `npm run build` can locally rewrite `next-env.d.ts` from dev
route types to build route types. That generated change was not included
because this PR is docs/report/smoke/package-only.

## Evaluation Conclusion

PASS with follow-up. The refined copyable handoff draft is usable for future
explicitly user-started docs-only Codex tasks.

The first line is clear, the review before pasting instruction is visible, the
draft keeps no-execution / no-merge / no-approval / no-GitHub-mutation
boundaries visible, required checks are concrete, forbidden files and
forbidden surfaces are visible, and the PR-centered workflow is clear.

The main caveat is expected-file readability. Expected files are safer after
PR #470 and appropriate for this task, but they may be verbose.

## Next Recommended PR Title

Refine expected-file scope readability for Codex handoff drafts
