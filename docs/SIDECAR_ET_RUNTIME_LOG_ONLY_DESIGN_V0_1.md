# Sidecar e_t Runtime Log-Only Design v0.1

## Status

- Status: runtime-log-only-design-only.
- SSOT status: non-SSOT.
- Runtime behavior: no runtime behavior.
- Schema authority: no schema authority.
- Implementation authority: no implementation authority.

This document defines the promotion boundary from offline fixture-only
Sidecar e_t candidate computation to a possible future runtime `log_only`
diagnostic. It does not implement runtime computation. It does not wire
Sidecar e_t computation into `PerspectiveSnapshot`, routes, Cockpit, OpenAI,
GitHub, commit/reject, or any Core write path.

## Baseline

The implemented baseline remains:

- Runtime `PerspectiveSnapshot` still returns the structured `sidecar_e_t`
  placeholder.
- `buildSidecarEtOfflineDiagnosticCandidate` remains placeholder-only for every
  input.
- `buildSidecarEtOfflineFixtureCandidate` is fixture-only, smoke-only, and
  runtime-disabled.
- `npm run smoke:sidecar-et-fixture-boundaries` proves default placeholder
  fallback, fixture-only boundaries, category allowlist, already-read refs,
  no QP evidence, no `z_t` commit, and no authority mutation.
- `loopness_hint` remains the only bounded `log_only` diagnostic object
  computed by runtime `PerspectiveSnapshot`.

The runtime `sidecar_e_t` placeholder remains `computed=false` with empty
`source_refs`. This document does not change that output.

## Promotion Preconditions

Runtime `log_only` design may be considered only after:

- fixture-only output review/tightening has passed
- fixture-only helper remains non-runtime
- docs and smoke agree
- candidate output wording is non-authoritative and smoke-only
- source refs are already-read only
- no QP evidence
- no `z_t` commit
- no authority mutation
- no API, Cockpit, or route expansion

Meeting these preconditions does not authorize implementation. Runtime
implementation still requires a separate PR, explicit smoke updates, and review.

## Runtime Log-Only Candidate Boundary

A future runtime `sidecar_e_t` candidate must remain a read-only derived view
only:

- no writes
- no external calls
- no new DB reads beyond the existing `PerspectiveSnapshot` read-set unless
  separately designed
- no source-of-truth claim
- no proof or evidence creation
- no proposal scoring
- no commit/reject input
- no Gate/SRF input
- no Claim confidence or Evidence status input
- no publication readiness
- no Cockpit action input
- no `z_t` commit
- no QP output treated as evidence

It must not change OpenAI observe/plan/preview behavior, commit/reject
behavior, GitHub publish behavior, Cockpit behavior, route behavior, or Core
state.

## Runtime Source-Ref Policy

Runtime `sidecar_e_t` may only reference already-read `PerspectiveSnapshot`
refs. Any runtime implementation must prove:

```text
candidate_source_refs subset_of PerspectiveSnapshot source_refs
```

If refs are missing, ambiguous, unsupported, out of scope, or not already read,
runtime `sidecar_e_t` must fall back to the structured placeholder. Runtime
computation must not read extra rows solely to satisfy `sidecar_e_t`.

## Runtime Output Policy

This document does not define final schema. A future runtime output shape,
field contract, enum contract, or response-shape change requires a separate
implementation/design PR and smoke updates.

Any future runtime output must remain:

- `mode=log_only`
- non-authoritative
- bounded
- not evidence
- not proof
- not QP evidence
- not `z_t` commit
- not source of truth
- not proposal scoring
- not commit/reject input
- not Gate/SRF input
- not Claim confidence or Evidence status input
- not publication readiness
- not Cockpit action input

If output wording is ambiguous, the implementation must fall back to the
structured placeholder or block merge until docs, helper output, runtime output,
and smoke assertions agree.

## Required Future Runtime Implementation Gates

A future runtime implementation PR must:

- extend `npm run smoke:perspective-snapshot`
- extend `npm run smoke:perspective-quality`
- extend `npm run smoke:research-diagnostics-boundaries`
- keep `npm run smoke:sidecar-et-fixture-boundaries` passing

It must add assertions proving:

- runtime `PerspectiveSnapshot` `sidecar_e_t` is `log_only`
- runtime output, if any, uses already-read refs only
- no authority table mutation
- `fetch_calls=0`
- no OpenAI calls
- no GitHub calls
- no state transition writes
- no proposal status changes
- no evidence or proof creation
- no Cockpit action buttons
- no `z_t` commit
- no QP output treated as evidence
- placeholder fallback for missing or ambiguous refs
- docs and smoke wording agree

Any implementation that cannot prove these gates must keep runtime
`sidecar_e_t` as the structured placeholder.

## Explicit Non-Goals

This runtime `log_only` design does not allow:

- runtime implementation in this PR
- route changes
- DB schema changes
- Cockpit behavior changes
- source-of-truth claims
- durable state
- evidence or proof creation
- publication readiness
- proposal scoring
- commit/reject input
- Gate/SRF input
- Claim confidence influence
- Evidence status influence
- OpenAI calls
- GitHub calls
- live provider calls
- QP evidence
- `z_t` commit
- secrets, local DBs, screenshots, generated artifacts, or `.env` files

## Rollback Rules

- Fall back to placeholder on ambiguity.
- Fall back to placeholder if source refs are not already read.
- Fall back to placeholder if output wording becomes authority-like.
- Block merge if docs and smoke disagree.
- Revert implementation if runtime path mutates Core records.
- Revert implementation if runtime path creates evidence or proof.
- Revert implementation if runtime path calls external services.
- Revert implementation if runtime path emits QP evidence.
- Revert implementation if runtime path commits `z_t`.
- Revert implementation if runtime path changes Cockpit actions.

## Relationship To Existing Docs

- `docs/SIDECAR_ET_DIAGNOSTIC_DESIGN_V0_1.md`: parent design-only diagnostic
  path. This document refines the runtime `log_only` promotion gate only.
- `docs/SIDECAR_ET_OFFLINE_FIXTURE_DESIGN_V0_1.md`: deterministic offline
  fixture categories and expected boundaries.
- `docs/SIDECAR_ET_OFFLINE_HELPER_DESIGN_V0_1.md`: non-runtime helper boundary,
  allowed inputs, already-read refs rule, validation note, and placeholder
  fallback requirement.
- `docs/SIDECAR_ET_OFFLINE_COMPUTATION_DESIGN_V0_1.md`: offline fixture-only
  computation boundary, output wording constraints, required gates, and
  rollback rules.
- `docs/PERSPECTIVE_SNAPSHOT_V0_1.md`: implemented runtime placeholder
  baseline. This runtime design does not change response shape.
- `docs/AUTHORITY_MATRIX.md`: authority boundaries for provider-neutral lanes
  and Perspective diagnostics. This document does not add authority.
- `docs/VERIFICATION_EVIDENCE_PACK.md`: verification evidence and smoke
  reporting boundaries. This document is design review context only, not
  runtime proof or evidence.

## Merge Criteria For A Future Runtime PR

A future runtime PR is not ready until:

- this runtime `log_only` design has been reviewed
- the final runtime output policy is separately reviewed
- source refs are proven to be already-read `PerspectiveSnapshot` refs only
- no runtime route or Cockpit expansion is introduced
- no authority mutation is proven
- no external calls are proven
- no evidence/proof creation is proven
- no `z_t` commit or QP evidence behavior is proven
- docs and smoke agree

Until those criteria are met, runtime `sidecar_e_t` must remain the implemented
structured placeholder in `PerspectiveSnapshot`.
