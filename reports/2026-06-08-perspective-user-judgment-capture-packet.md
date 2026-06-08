# Perspective User Judgment Capture Packet

Date: 2026-06-08

## Summary

This PR adds a deterministic pure local manual ChatGPT user judgment capture
packet builder. It turns a ChatGPT Perspective Candidate briefing preview plus
caller-supplied bounded user judgment material into non-committed review
material with decision effect, next handoff discussion status, preserved
prompt/tension/action refs, copyable capture text, privacy flags, and false
authority flags.

## Why This Follows PR #466

PR #466 added
`buildChatGptPerspectiveCandidateBriefingPreview(candidate)`, which turns a
non-committed Perspective Candidate into ChatGPT-facing review material. This
PR completes the manual review loop from "Augnes formed a candidate" to "the
user replied in ChatGPT" without treating that reply as committed state,
proof, evidence, readiness, approval, merge authority, Core decision, or Codex
execution.

## Files Changed

- `lib/perspective-ingest/perspective-user-judgment-capture-packet.ts`
- `docs/PERSPECTIVE_USER_JUDGMENT_CAPTURE_PACKET_V0_1.md`
- `reports/2026-06-08-perspective-user-judgment-capture-packet.md`
- `scripts/smoke-perspective-user-judgment-capture-packet.mjs`
- `package.json`
- `docs/PERSPECTIVE_CANDIDATE_BRIEFING_PREVIEW_V0_1.md`
- `docs/PERSPECTIVE_FORMATION_LANE_V0_1.md`
- `scripts/smoke-perspective-candidate-briefing-preview.mjs`
- `scripts/smoke-perspective-candidate-builder-fixture.mjs`
- `scripts/smoke-perspective-formation-input-bundle-builder.mjs`
- `scripts/smoke-perspective-formation-lane-v0-1.mjs`
- `scripts/smoke-perspective-agent-brief-read-surface.mjs`
- `scripts/smoke-perspective-temporal-spatial-projection-builders.mjs`

The existing smoke edits are narrow allowlist and ladder-awareness updates so
the requested validation bundle recognizes this explicit pure local user
judgment capture packet slice.

## Authority Boundary

This PR adds a pure local builder only. It adds no runtime route, no `app/api`,
no DB schema or migrations, no persistence, no graph DB behavior, no source
ingress implementation, no OAuth implementation, no provider/model/API calls,
no GitHub mutation outside the scoped PR workflow, no proof/evidence/readiness
writes, no ChatGPT Apps implementation, no Codex plugin implementation, no
Codex SDK execution, no product UI, no component/CSS/browser-facing behavior,
and no Event Rail, graph topology, node id/type, edge id/type, packet section
order, Agent Brief read route behavior, local manual preview route behavior,
or Perspective runtime route behavior changes.

The packet is not committed state, proof, evidence, readiness, approval, merge
authority, Core decision, ChatGPT Apps integration, or Codex execution.

## Validation Plan

- `npm run typecheck`
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

- No actual ChatGPT Apps integration.
- No route or UI.
- No DB schema, migrations, persistence, or graph DB behavior.
- No source ingress or OAuth implementation.
- No provider/model/API calls.
- No ChatGPT Apps bridge, Codex plugin, or Codex SDK execution.
- No proof/evidence/readiness writes.
- No Core-gated accept/reject/supersede implementation.
- No merge, publish, or approval authority.

## Tests Run

- `npm run typecheck`: PASS
- `npm run smoke:perspective-user-judgment-capture-packet`: PASS
- `npm run smoke:perspective-candidate-briefing-preview`: PASS
- `npm run smoke:perspective-candidate-builder-fixture`: PASS
- `npm run smoke:perspective-formation-input-bundle-builder`: PASS
- `npm run smoke:perspective-formation-lane-v0-1`: PASS
- `npm run smoke:perspective-agent-brief-read-surface`: PASS
- `npm run smoke:perspective-temporal-spatial-projection-builders`: PASS
- `npm run smoke:perspective-ingest-constellation-preview`: PASS
- `git diff --check`: PASS
- `git diff --cached --check`: PASS
- `npm run build`: PASS

## Skipped Checks

- `AUGNES_API_BASE_URL=http://localhost:3000 CODEX_SCOPE=project:augnes npm run codex:read-brief`: skipped because the helper returned `CODEX_READ_BRIEF_RUNTIME_UNAVAILABLE`.
- `npm run lint`: skipped because `package.json` does not define a lint script.
- `npm test`: skipped because `package.json` does not define a test script.
- Browser validation: skipped because this is a pure local builder with no UI or
  route changes.
- Evidence row recording: skipped because `CODEX_WORK_ID` is missing.
- Proof-only closeout status: skipped because `CODEX_WORK_ID` is missing.

## Blockers or Risks

The main risk is over-promoting a manual ChatGPT reply into committed state,
approval, proof, evidence, readiness, merge authority, Core decision, or Codex
execution. The builder keeps explicit false authority flags, raw payload
exclusion, manual-review-only semantics, decision-effect status, next-handoff
discussion status, and forbidden actions to preserve that boundary.

## Next Recommended PR Title

Add pure local Codex next-handoff draft packet from user judgment
