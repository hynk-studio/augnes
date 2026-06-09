# Perspective Codex Next-Handoff Draft Copy Refine

Date: 2026-06-09

## Summary

This PR refines the pure local Codex next-handoff draft copy and dogfood scope
from the merged PR #469 baseline. It makes the copyable handoff text more
direct for a human deciding whether to paste it into a future Codex task and
expands the ready-to-copy dogfood `expected_files` list so an equivalent future
handoff is not under-scoped.

## Why This Follows Merged PR #469

PR #469 was merged before ChatGPT review completed. This PR does not revert
that baseline. It treats the merged dogfood artifact as the local baseline and
adds a corrective follow-up for the dogfood finding and automated review issue.

## Review Issue Fixed

Automated review found that the PR #469 `ready_to_copy` generated handoff
`expected_files` list was under-scoped. The dogfood ready-to-copy text is the
file scope a future Codex task would receive, so omitting related docs and
smoke allowlist files could create an artificially passing artifact with a
future handoff that is too narrow.

This PR expands `dogfoodExpectedFiles` to include the dogfood script, dogfood
smoke, dogfood docs, dogfood report, dogfood artifact, package script file,
packet docs, formation/user-judgment docs, and neighboring smoke allowlist
files required by an equivalent dogfood/report/copy refinement slice. None of
the requested minimum files were omitted.

## Dogfood Finding Fixed

PR #469 dogfood recorded that the copyable draft text was safe, but the first
line could be more direct for a human deciding whether to paste it into a new
Codex task.

This PR updates the copyable text to begin with:

- this is a draft prompt for a future user-started Codex task;
- review it before pasting into Codex;
- it does not execute Codex;
- it does not authorize merge, approval, GitHub mutation, or background work.

PR-centered workflow language is preserved: Codex codes/tests/opens PR,
ChatGPT reviews, and the user decides merge.

## Files Changed

- `lib/perspective-ingest/perspective-codex-next-handoff-draft-packet.ts`
- `scripts/dogfood-perspective-codex-next-handoff-draft.mjs`
- `scripts/smoke-perspective-codex-next-handoff-draft-dogfood.mjs`
- `scripts/smoke-perspective-codex-next-handoff-draft-packet.mjs`
- `docs/PERSPECTIVE_CODEX_NEXT_HANDOFF_DRAFT_PACKET_V0_1.md`
- `docs/PERSPECTIVE_CODEX_NEXT_HANDOFF_DRAFT_DOGFOOD_V0_1.md`
- `reports/2026-06-09-perspective-codex-next-handoff-draft-dogfood.md`
- `reports/2026-06-09-perspective-codex-next-handoff-draft-copy-refine.md`
- `reports/dogfood/2026-06-09-perspective-codex-next-handoff-draft-packet.md`

## Authority Boundary

This is a pure local copy/dogfood/report/smoke slice only. It adds no runtime
route, no `app/api`, no DB schema or migrations, no persistence, no graph DB
behavior, no source ingress implementation, no OAuth implementation, no
provider/model/API calls, no ChatGPT Apps implementation, no Codex plugin
implementation, no Codex SDK execution, no actual Codex execution, no product
UI, no component/CSS/browser-facing behavior, no GitHub mutation from dogfood
scripts, no proof/evidence/readiness writes, and no Core-gated
accept/reject/supersede.

The copyable draft remains draft prompt material only. It is not committed
state, proof, evidence, readiness, approval, merge authority, GitHub mutation,
Core decision, ChatGPT Apps integration, or Codex execution.

## Validation Plan

- `npm run typecheck`
- `npm run dogfood:perspective-codex-next-handoff-draft`
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

- No actual Codex execution.
- No ChatGPT Apps integration.
- No route or UI.
- No DB schema, migrations, persistence, or graph DB behavior.
- No source ingress or OAuth implementation.
- No provider/model/API calls.
- No GitHub mutation from dogfood scripts.
- No ChatGPT Apps bridge, Codex plugin, or Codex SDK execution.
- No proof/evidence/readiness writes.
- No Core-gated accept/reject/supersede implementation.
- No merge, publish, deploy, or approval authority.

## Tests Run

- PASS: `npm run typecheck`
- PASS: `npm run dogfood:perspective-codex-next-handoff-draft`
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
- PASS: `npm run build`

## Skipped Checks

- `AUGNES_API_BASE_URL=http://localhost:3000 CODEX_SCOPE=project:augnes npm run codex:read-brief`:
  skipped because the helper returned `CODEX_READ_BRIEF_RUNTIME_UNAVAILABLE`.
- `npm run lint`: skipped because `package.json` does not define a lint script.
- `npm test`: skipped because `package.json` does not define a test script.
- Browser validation: skipped because this is a local dogfood/copy/report slice
  with no UI or route changes.
- Evidence row recording: skipped because `CODEX_WORK_ID` is missing.
- Proof-only closeout status: skipped because `CODEX_WORK_ID` is missing.

## Blockers or Risks

No known blocker. The main residual risk is over-expanding the expected file
scope until the handoff becomes noisy. The dogfood keeps the expanded list
limited to files that an equivalent dogfood/report/copy refinement slice would
realistically need.

## Dogfood Evaluation Conclusion

PASS. The regenerated dogfood artifact shows the direct draft-prompt opening,
the review-before-pasting instruction, explicit non-execution and no
merge/approval/GitHub-mutation wording, and the expanded expected file scope.
The `ready_to_copy` path remains draft-only and contrast cases remain not
copy-ready.

## Next Recommended PR Title

Evaluate Codex handoff draft in a real docs-only Codex task
