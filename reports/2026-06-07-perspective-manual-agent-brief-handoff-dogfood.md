# Perspective Manual Agent Brief Handoff Dogfood Validation

Date: 2026-06-08

## Branch

`codex/perspective-manual-agent-brief-handoff-dogfood-v0-1`

## Commit

Implementation commit:
`3c5837a8300ea96e547a0380936ea1c20ef24d13`.

## Preflight Result

PASS. PR #453, "Add local manual ingress admission to Agent Brief context", is
merged into `main` at merge commit
`3ffb32e312c445d07c6c2d10e4fe116c6208a052`.

`origin/main` contains optional `ingress_context` in
`PerspectiveAgentBriefV0`, `buildPerspectiveAgentBrief` adding
`ingress_context` when `preview.ingress_admission` exists, fixture Agent Brief
responses omitting `ingress_context`,
`docs/PERSPECTIVE_AGENT_BRIEF_MANUAL_INGRESS_CONTEXT_V0_1.md`, and
`scripts/smoke-perspective-agent-brief-manual-ingress-context.mjs`.

## Files Changed

- `lib/perspective-ingest/perspective-agent-brief-handoff-packet.ts`
- `docs/PERSPECTIVE_MANUAL_AGENT_BRIEF_HANDOFF_DOGFOOD_V0_1.md`
- `scripts/smoke-perspective-manual-agent-brief-handoff-dogfood.mjs`
- `reports/2026-06-07-perspective-manual-agent-brief-handoff-dogfood.md`
- `package.json`
- Existing Perspective smoke allowlists only as needed.

## Dogfood Flow

The smoke validates:

1. build a safe local manual pasted-text preview
2. confirm the preview includes `ingress_admission`
3. build an Agent Brief from the preview
4. confirm the Agent Brief includes compact `ingress_context`
5. build `chatgpt_review` and `codex_handoff` handoff packets
6. confirm a sample fixture packet says no ingress context is present
7. confirm selected-node manual brief scope is preserved in packet output

## Packet Section Summary

The dogfood packet is copy-ready and uses this section order:

1. Purpose
2. Selected Material
3. Spatial Context
4. Temporal Context
5. Ingress Context
6. Tensions
7. Next Actions
8. Handoff Constraints
9. Authority
10. Exclusions

This is a new Agent Brief handoff packet and does not change the existing
Perspective packet section order.

## Manual Ingress Context Summary

The packet includes compact ingress details only:

- manual ingress kind and local trust level
- admission, redaction, and decision status
- preview readiness
- local/read-only boundary
- pointer count
- source ref and candidate id availability booleans

It does not include source ref, candidate id, pointer ref, actor ref, consent
ref, bounded summary, raw pasted text, raw admission JSON, or raw Agent Brief
JSON values.

## Raw Value Exclusion Checks

The smoke asserts packet text does not include:

- raw manual input verbatim
- `input_text`
- raw `ingress_admission` JSON markers
- candidate id value
- source ref value
- pointer ref values
- actor ref values
- consent ref value
- bounded summary value
- existing packet bodies
- `Graph nodes:`
- `Graph edges:`
- provider host/token markers

## Tests Run

- PASS: `npm run typecheck`
- PASS: `npm run smoke:perspective-manual-agent-brief-handoff-dogfood`
- PASS: `npm run smoke:perspective-agent-brief-manual-ingress-context`
- PASS: `npm run smoke:perspective-agent-brief-read-surface`
- PASS: `npm run smoke:perspective-local-manual-ingress-admission-preview`
- PASS: `npm run smoke:cockpit-perspective-ingress-admission-observatory-summary`
- PASS: `npm run smoke:perspective-ingress-admission-model`
- PASS: `npm run smoke:perspective-temporal-spatial-projection-builders`
- PASS: `npm run smoke:cockpit-perspective-workbench-temporal-underlay`
- PASS: `npm run smoke:perspective-ingest-constellation-preview`
- PASS: `npm run build`
- PASS: `git diff --check`
- PASS: `git diff --cached --check`

## Skipped Checks

Browser validation is skipped because this is a pure builder/dogfood slice with
no UI and no route changes.

- `npm run lint`: skipped because `package.json` has no `lint` script.
- `npm test`: skipped because `package.json` has no `test` script.

## Blockers / Risks

No blockers. Risk is limited to dogfood packet contract drift; smoke coverage
checks section order, audience variants, manual ingress context inclusion,
sample no-ingress behavior, selected-node scope preservation, and raw value
exclusions.

## Next Suggested Implementation PR

Evaluate manual Agent Brief handoff packet in Codex review loop.
