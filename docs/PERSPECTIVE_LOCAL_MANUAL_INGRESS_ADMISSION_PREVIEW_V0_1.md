# Perspective Local Manual Ingress Admission Preview v0.1

## Purpose and Scope

This PR prototypes the first runtime use of the Perspective ingress admission
model. It applies only to the existing local manual pasted-text preview route.

Manual pasted text now enters Augnes as a bounded local ingress candidate before
it becomes a local preview episode. The candidate is advisory admission metadata;
it is not Formation authority, not persistence, not proof/evidence/readiness
authority, and not execution authority.

## Why This Follows the Ingress Admission Model

The previous ingress admission model PR defined the boundary between raw or
source-adjacent material and Augnes-formed Perspective state. This slice uses
that model for the narrowest existing ingress path: local manual pasted text.

The flow is:

1. Manual pasted-text request.
2. Bounded ingress source artifact candidate.
3. Admission and readiness check.
4. Local preview episode candidate.
5. Existing Perspective ingest constellation preview response.
6. Existing Human Workbench, Agent Brief, and Research Substrate projections.

Ingress remains separate from Formation. Augnes Formation still builds the
actual constellation, Event Rail placement, temporal/spatial projections,
tensions, next actions, packets, and research perspective.

## Manual Ingress Candidate

The manual pasted-text candidate uses:

| Field | Value |
| --- | --- |
| `ingress_kind` | `manual_pasted_text` |
| `trust_level` | `user_provided_local` |
| `admission_state` | `episode_candidate` |
| `redaction_state` | `not_applicable` |
| `requested_by` | `operator:local` |
| `consent_ref` | `manual_pasted_text:user_submitted` |
| `retention_hint` | `candidate_pointer_only` |

Candidate metadata is bounded summary plus pointers only. The bounded summary
comes from the already-bounded manual episode summary. Pointer refs come from
episode evidence refs or the episode source ref.

Raw pasted text is not stored in `ingress_admission`. Rejected raw pasted text is
not echoed in errors. OAuth tokens, credentials, provider/model data, prompt
payloads, API keys, billing data, and raw private content are not represented by
this model.

## Response Shape

Successful manual local preview responses keep the existing response version and
preview shape:

- `response_version: "perspective_ingest_constellation_preview.v0.1"`
- `source_query: "manual:pasted_text"`
- `source_kind: "manual_pasted_text"`
- existing constellation nodes and edges
- existing evidence, tensions, next actions, ChatGPT review packet, and Codex
  handoff packet behavior

They add optional manual-only metadata:

```ts
ingress_admission?: {
  admission_version: "perspective_ingress_admission_preview.v0.1";
  candidate: PerspectiveIngressCandidateProjectionV0;
  readiness: PerspectiveIngressFormationReadinessV0;
  decision: PerspectiveIngressAdmissionDecisionV0;
  source: {
    ingress_kind: "manual_pasted_text";
    trust_level: "user_provided_local";
    admission_state: PerspectiveIngressAdmissionStateV0;
    redaction_state: PerspectiveIngressRedactionStateV0;
  };
}
```

Fixture sample preview responses are unchanged and are not required to include
`ingress_admission`.

## Readiness and Decision

The local manual candidate is built as an `episode_candidate`. It can be admitted
to `accepted_for_preview` only when `getPerspectiveIngressFormationReadiness`
reports preview readiness and the admission transition is allowed.

Readiness requires:

- bounded summary present
- redaction complete or not applicable
- `local_only: true`
- `read_only: true`
- no external calls
- no persistence
- no graph DB writes
- no proof/evidence/readiness writes
- no Codex execution
- no GitHub mutation
- no OAuth token storage
- no raw private content storage

The admission decision reason is:

`manual pasted text passed local bounded preview readiness`

## Fail-Closed Behavior

If an ingress candidate is not preview-ready, the local preview route returns:

- `code: "ingress_not_preview_ready"`
- `status: 400`
- summary: `Manual pasted text ingress candidate is not ready for preview.`

The fail-closed authority boundary states:

- local-only ingress candidate
- read-only candidate projection
- no raw pasted text echo
- no persistence
- no graph DB
- no proof/evidence/readiness writes
- no Codex execution
- no route-provided text grants authority

Existing validation failures remain unchanged. Empty pasted text still fails
closed as `missing_input_text`. Credential-shaped input still fails closed as
`secret_like_input` when it matches the existing validation helper. Rejected
payloads are not echoed.

## What Remains Unchanged

- Manual preview graph behavior.
- Existing node ids, node types, edge ids, edge types, and graph topology.
- Existing packet section order.
- Existing local-only/read-only/no-persistence/no-graph-DB/no-Codex behavior.
- Existing Human Workbench UI.
- Existing Agent Brief read surface.
- Existing Research Substrate and projection builders.

## Intentionally Not Implemented

No OAuth is implemented here. There is no external API ingress, no
provider/model calls, no GitHub calls or mutation, no Codex execution, no
ChatGPT Apps integration, no Codex plugin integration, no browser connector
ingestion, no DB schema or migrations, no persistence, no graph DB behavior, no
proof/evidence/readiness writes, no UI redesign, no hidden raw JSON dumps, and
no product DOM exposure of ingress candidates.

## Next Suggested Slice

Add compact ingress admission summary to Observatory details.
