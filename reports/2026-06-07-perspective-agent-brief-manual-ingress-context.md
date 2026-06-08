# Perspective Agent Brief Manual Ingress Context Validation

Date: 2026-06-08

## Branch

`codex/perspective-agent-brief-manual-ingress-context-v0-1`

## Commit

Implementation commit:
`c351413fce200a6ba382ee4184538d1ea9c90827`.

## Preflight Result

PASS. PR #452, "Add compact ingress admission summary to Observatory details",
is merged into `main` at merge commit
`b3e1d860627e0a907c81d69ae3c2a0946befe6cd`.

`origin/main` contains the compact ingress admission Observatory summary,
optional `ingress_admission` metadata on
`PerspectiveIngestConstellationPreviewResponse`, local manual pasted-text
preview responses attaching `ingress_admission`, the Agent Brief read surface
from PR #449, and the ingress admission model from PR #450.

## Files Changed

- `lib/perspective-ingest/perspective-agent-brief.ts`
- `docs/PERSPECTIVE_AGENT_BRIEF_MANUAL_INGRESS_CONTEXT_V0_1.md`
- `scripts/smoke-perspective-agent-brief-manual-ingress-context.mjs`
- `reports/2026-06-07-perspective-agent-brief-manual-ingress-context.md`
- `package.json`
- Existing Perspective smoke allowlists/assertions as needed.

## Model Summary

`buildPerspectiveAgentBrief` now attaches optional `ingress_context` only when
the input preview includes `ingress_admission`. Fixture previews omit the field.

The context is compact and machine-readable:

- ingress kind and trust level
- admission and redaction states
- decision target and allowed flag
- readiness booleans and reason count
- local read-only authority boundary flags
- pointer count plus source-ref and candidate-id availability booleans

The context does not include candidate id values, source ref values, pointer ref
values, actor ref values, consent ref, bounded summary, raw pasted text, packet
text, FormationReceipt body, raw admission JSON, or provider/model/API/GitHub/
Codex/OAuth/token/billing data.

## Manual Preview to Agent Brief Builder Validation

The smoke builds a local manual pasted-text preview through the existing local
preview helper, confirms it has `ingress_admission`, then passes that preview to
`buildPerspectiveAgentBrief`.

Expected result:

- whole manual brief includes `ingress_context`
- selected-node manual brief keeps `scope.mode = selected_node`
- selected-node manual brief still includes the preview-level `ingress_context`
- sample ChatGPT and Codex fixture briefs omit `ingress_context`
- serialized manual brief omits raw manual input and raw ingress values

## Route Behavior Confirmation

The Agent Brief GET read route remains sample-only:

- `source=sample:chatgpt`
- `source=sample:codex`
- optional valid `selected_node_id`

No manual pasted-text Agent Brief route or POST Agent Brief route is added. The
existing local manual preview route remains the only route in this slice that
accepts raw manual input.

## Tests Run

- PASS: `npm run typecheck`
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

Browser validation is skipped because this is a builder/context slice with no UI
changes and no route changes. The existing Observatory details UI remains
unchanged.

- `npm run lint`: skipped because `package.json` has no `lint` script.
- `npm test`: skipped because `package.json` has no `test` script.

## Blockers / Risks

No blockers. Risk is limited to Agent Brief contract drift; the smoke asserts
fixture omission, manual context inclusion, selected-node scope preservation,
sample-only route behavior, and exclusion of raw ingress values.

## Next Suggested Implementation PR

Prototype manual Agent Brief handoff packet dogfood.
