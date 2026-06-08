# Perspective Codex Next-Handoff Draft Packet

Date: 2026-06-09

## Summary

This PR adds a deterministic pure local Codex next-handoff draft packet
builder. It turns a manual ChatGPT user judgment capture packet plus
caller-supplied bounded handoff context into a non-executing Codex handoff
draft with explicit readiness, visible scope gaps, preserved user judgment
refs, copyable handoff text, privacy flags, and false authority flags.

## Why This Follows PR #467

PR #467 added
`buildManualChatGptUserJudgmentCapturePacket(input)`, which captures a bounded
manual ChatGPT user reply as non-committed review material. This PR completes
the next pure local usability step: turning that manual user judgment into a
bounded Codex handoff draft without executing Codex, mutating GitHub, adding
routes, adding UI, writing proof/evidence/readiness, or claiming approval.

## Files Changed

- `lib/perspective-ingest/perspective-codex-next-handoff-draft-packet.ts`
- `docs/PERSPECTIVE_CODEX_NEXT_HANDOFF_DRAFT_PACKET_V0_1.md`
- `reports/2026-06-09-perspective-codex-next-handoff-draft-packet.md`
- `scripts/smoke-perspective-codex-next-handoff-draft-packet.mjs`
- `package.json`
- `docs/PERSPECTIVE_USER_JUDGMENT_CAPTURE_PACKET_V0_1.md`
- `docs/PERSPECTIVE_CANDIDATE_BRIEFING_PREVIEW_V0_1.md`
- `docs/PERSPECTIVE_FORMATION_LANE_V0_1.md`
- `scripts/smoke-perspective-user-judgment-capture-packet.mjs`
- `scripts/smoke-perspective-candidate-briefing-preview.mjs`
- `scripts/smoke-perspective-candidate-builder-fixture.mjs`
- `scripts/smoke-perspective-formation-input-bundle-builder.mjs`
- `scripts/smoke-perspective-formation-lane-v0-1.mjs`
- `scripts/smoke-perspective-agent-brief-read-surface.mjs`
- `scripts/smoke-perspective-temporal-spatial-projection-builders.mjs`

The existing smoke edits are narrow allowlist and ladder-awareness updates so
the requested validation bundle recognizes this explicit pure local Codex
next-handoff draft packet slice.

## Authority Boundary

This PR adds a pure local builder only. It adds no runtime route, no `app/api`,
no DB schema or migrations, no persistence, no graph DB behavior, no source
ingress implementation, no OAuth implementation, no provider/model/API calls,
no GitHub mutation, no proof/evidence/readiness writes, no ChatGPT Apps
implementation, no Codex plugin implementation, no Codex SDK execution, no
actual Codex execution, no product UI, no component/CSS/browser-facing
behavior, and no Event Rail, graph topology, node id/type, edge id/type,
packet section order, Agent Brief read route behavior, local manual preview
route behavior, or Perspective runtime route behavior changes.

The draft packet is not committed state, proof, evidence, readiness, approval,
merge authority, Core decision, GitHub mutation, ChatGPT Apps integration, or
Codex execution.

## Validation Plan

- `npm run typecheck`
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
- No GitHub mutation.
- No ChatGPT Apps bridge, Codex plugin, or Codex SDK execution.
- No proof/evidence/readiness writes.
- No Core-gated accept/reject/supersede implementation.
- No merge, publish, or approval authority.

## Tests Run

- PASS: `npm run typecheck`
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
- Browser validation: skipped because this is a pure local builder with no UI
  or route changes.
- Evidence row recording: skipped because `CODEX_WORK_ID` is missing.
- Proof-only closeout status: skipped because `CODEX_WORK_ID` is missing.

## Blockers or Risks

The main risk is over-promoting a copyable handoff draft into Codex execution,
GitHub mutation, committed state, approval, proof, evidence, readiness, merge
authority, or Core decision. The builder keeps explicit false authority flags,
raw payload exclusion, non-executing draft text, visible scope gaps, and
PR-centered workflow language to preserve that boundary.

## Next Recommended PR Title

Add local Codex handoff draft dogfood report
