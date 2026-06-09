# Perspective Codex Next-Handoff Draft Dogfood

Date: 2026-06-09

## Summary

This PR adds deterministic local dogfood for the pure local Perspective-to-Codex
manual loop. It exercises the Formation Input Bundle, Perspective Candidate,
ChatGPT briefing preview, manual ChatGPT user judgment capture packet, and
Codex next-handoff draft packet, then writes a dogfood artifact evaluating
whether the copyable handoff text is useful for a future human-started Codex
task.

## Why This Follows PR #468

PR #468 added
`buildCodexNextHandoffDraftPacketFromUserJudgment(input)`. This dogfood slice
validates that the resulting `ready_to_copy` draft text is usable without
turning it into Codex execution, GitHub mutation, committed state, proof,
evidence, readiness, approval, merge authority, or Core decision.

## Dogfood Scenarios

- `ready_to_copy`: fully scoped, `matches_direction`,
  `captured_for_review`, `prepare_codex_handoff`, explicit task goal,
  expected files, required checks, forbidden files/surfaces, and skipped-check
  policy.
- `needs_scope`: ready user judgment with missing expected files and required
  checks.
- `needs_revision_first`: user says revision is needed, so revision wins over
  handoff drafting.
- `blocked`: user judgment rejects the candidate with a blocking tension.
- `none`: user judgment is unclear and asks user/PM before any handoff draft.

## Files Changed

- `scripts/dogfood-perspective-codex-next-handoff-draft.mjs`
- `scripts/smoke-perspective-codex-next-handoff-draft-dogfood.mjs`
- `docs/PERSPECTIVE_CODEX_NEXT_HANDOFF_DRAFT_DOGFOOD_V0_1.md`
- `reports/2026-06-09-perspective-codex-next-handoff-draft-dogfood.md`
- `reports/dogfood/2026-06-09-perspective-codex-next-handoff-draft-packet.md`
- `package.json`
- `docs/PERSPECTIVE_CODEX_NEXT_HANDOFF_DRAFT_PACKET_V0_1.md`
- `docs/PERSPECTIVE_FORMATION_LANE_V0_1.md`
- `docs/PERSPECTIVE_USER_JUDGMENT_CAPTURE_PACKET_V0_1.md`
- `scripts/smoke-perspective-codex-next-handoff-draft-packet.mjs`
- `scripts/smoke-perspective-user-judgment-capture-packet.mjs`
- `scripts/smoke-perspective-candidate-briefing-preview.mjs`
- `scripts/smoke-perspective-candidate-builder-fixture.mjs`
- `scripts/smoke-perspective-formation-input-bundle-builder.mjs`
- `scripts/smoke-perspective-formation-lane-v0-1.mjs`
- `scripts/smoke-perspective-agent-brief-read-surface.mjs`
- `scripts/smoke-perspective-temporal-spatial-projection-builders.mjs`

The existing smoke edits are narrow allowlist and future-step assertion updates
so the requested validation bundle recognizes this explicit dogfood/report
slice. The dogfood smoke also relaxes one stale source assertion so the sample
handoff context may display `app/api/**` as a forbidden file pattern.

## Authority Boundary

This PR adds local dogfood/report/smoke/package coverage only. It adds no
runtime route, no `app/api`, no DB schema or migrations, no persistence, no
graph DB behavior, no source ingress implementation, no OAuth implementation,
no provider/model/API calls, no ChatGPT Apps implementation, no Codex plugin
implementation, no Codex SDK execution, no actual Codex execution, no product
UI, no component/CSS/browser-facing behavior, no GitHub mutation from the
dogfood script, no proof/evidence/readiness writes, and no Core-gated
accept/reject/supersede.

The dogfood artifact is not committed state, proof, evidence, readiness,
approval, merge authority, GitHub mutation, Core decision, ChatGPT Apps
integration, or Codex execution.

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
- No GitHub mutation from the dogfood script.
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
- Browser validation: skipped because this is a local dogfood/report slice with
  no UI or route changes.
- Evidence row recording: skipped because `CODEX_WORK_ID` is missing.
- Proof-only closeout status: skipped because `CODEX_WORK_ID` is missing.

## Blockers or Risks

No known blocker. The main risk is over-promoting copyable draft text into
execution authority. The dogfood artifact keeps the authority boundary close
to `ready_to_copy`, checks contrast cases, and recommends copy refinement
before any runtime or App integration.

## Dogfood Evaluation Conclusion

PASS. The ready path is copy-ready for a future user-approved Codex task
because the task goal, expected files, required checks, forbidden
files/surfaces, skipped-check policy, authority boundary, and PR-centered
workflow are visible. The contrast cases do not look copy-ready.

The dogfood finding is non-blocking: the copyable text is safe, but the first
line could be more direct for a human deciding whether to paste it into a new
Codex task. That finding is carried into the recommended next PR title.

## Next Recommended PR Title

Refine Codex handoff draft copy from dogfood findings
