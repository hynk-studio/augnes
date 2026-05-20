# Sidecar e_t Offline Helper Design v0.1

## Status

- Status: helper-design-only.
- Authority: non-SSOT design note.
- Runtime behavior: none.
- Schema authority: none.
- Implementation authority: none.

This document defines a possible future non-runtime helper boundary for
deterministic offline Sidecar e_t diagnostics. It does not implement a helper.
It does not compute Sidecar/e_t/QP/z_t values. It does not change
`PerspectiveSnapshot`, API response shape, database schema, routes, Cockpit
behavior, OpenAI behavior, commit/reject behavior, GitHub publish behavior, or
evidence/proof behavior.

## Baseline

The implemented baseline remains:

- `sidecar_e_t` is a structured placeholder.
- `npm run smoke:sidecar-et-fixture-boundaries` verifies fixture placeholder
  fallback and authority boundaries.
- `loopness_hint` remains the only bounded `log_only` diagnostic object
  currently computed.
- `research_diagnostics` remains `log_only` and non-authoritative.
- `sidecar_e_t` is not actual Sidecar state, not QP output, and not `z_t`
  regime commit.

## Proposed Future Helper Boundary

Design name suggestion only:

```text
buildSidecarEtOfflineDiagnosticCandidate
```

This helper is not implemented in this PR. A future PR may implement it only as
a non-runtime helper that runs against deterministic local fixture inputs. It
must not be called by production routes, Cockpit rendering, OpenAI
observe/plan/preview paths, commit/reject paths, GitHub publish paths, or any
Core write path.

The helper must return the structured placeholder fallback if inputs are
missing, malformed, unsupported, out of scope, not already read, or ambiguous.
Placeholder fallback remains valid and preferred when uncertainty exists.

## Implementation Skeleton Note

`lib/perspective/sidecar-et-offline-helper.ts` implements the helper skeleton
only. It exports `buildSidecarEtOfflineDiagnosticCandidate`, accepts the
bounded input shape described here, and always returns the structured
placeholder fallback. It does not compute Sidecar/e_t/QP/z_t values, does not
emit source refs, does not set `computed=true`, does not create QP output, and
does not commit or hint an actual `z_t` regime. Future computation requires a
separate gated PR with smoke coverage.

## Validation Hardening Note

`validateSidecarEtOfflineInputBoundary` is a pure boundary validator for the
helper skeleton. It returns a bounded validation object only. The validation
result is not authority, not diagnostic output, not source of truth, and not a
permission to compute. Invalid input returns placeholder fallback. Valid input
also returns placeholder fallback in this skeleton phase.

## Allowed Future Inputs

Future helper inputs may be design-limited to:

- already-read state entry refs
- already-read action record refs
- already-read work event refs
- already-read tension refs
- optional bounded fixture metadata

Allowed inputs must be deterministic, local, and fixture-scoped. They must not
create schema authority or imply that fixture metadata is Core state.

The helper must not accept as canonical inputs:

- external provider ids
- raw tokens or secrets
- hidden chain-of-thought
- model internals
- live provider data
- unreviewed local artifacts

## Disallowed Inputs

The helper design excludes:

- non-read ids
- out-of-scope ids
- raw provider run, thread, or session ids as canonical state
- GitHub live data
- OpenAI live data
- QP output as evidence
- `z_t` commit state
- Cockpit action input
- any durable state mutation request
- mailbox, publication, delivery, or temporal review artifact mutation requests
- route request bodies or UI controls as diagnostic authority

## Allowed Read-Set

The future helper may inspect only refs already read by the deterministic
fixture path. It must not perform extra DB reads solely to satisfy
`sidecar_e_t`. It must not call external services. It must not access hidden
state. It must not write new persistence.

Allowed read-set rule:

```text
candidate_source_refs subset_of already_read_fixture_refs
```

If that subset relationship cannot be proven, the helper must return the
placeholder fallback and emit no computed candidate values.

## Candidate Output Boundary

This section is prose-only design, not schema authority. A future computed
output must remain:

- `mode=log_only`
- non-authoritative
- bounded
- derived from already-read refs
- not evidence
- not proof
- not `z_t` commit
- not QP output treated as evidence
- not source of truth
- not proposal scoring
- not commit/reject input
- not Gate/SRF input
- not Claim confidence or Evidence status input
- not publication readiness
- not Cockpit action input

A future helper may return a bounded no-pressure result for clean fixtures only
if that result is explicitly defined in a later implementation PR and guarded
by smoke tests. Otherwise, and whenever uncertainty exists, it must return the
structured placeholder fallback.

## Required Future Smoke Additions

`npm run smoke:sidecar-et-fixture-boundaries` must be extended, not bypassed.
A future helper PR must prove:

- clean fixture returns placeholder fallback or a bounded no-pressure result
- repeated/noisy fixture remains bounded and non-authoritative
- missing-context fixture returns placeholder fallback
- conflicting-context fixture returns placeholder fallback or a
  non-authoritative caveat only
- invalid-input fixture returns placeholder fallback
- source-ref boundary fixture rejects or omits non-read refs
- no authority table mutation
- `fetch_calls=0`
- no OpenAI calls
- no GitHub calls
- no proposal status changes
- no state transition writes
- no evidence/proof creation
- no Cockpit action buttons
- no `z_t` commit
- no QP output treated as evidence

The future smoke must continue to cover every fixture scope from
`docs/SIDECAR_ET_OFFLINE_FIXTURE_DESIGN_V0_1.md`.

## Non-Goals

This helper design does not allow:

- runtime computation
- route changes
- DB schema changes
- Cockpit behavior changes
- source-of-truth claims
- durable state mutation
- evidence or proof creation
- publication readiness
- proposal scoring
- commit/reject input
- Gate/SRF input
- Claim confidence influence
- Evidence status influence
- OpenAI, GitHub, or external calls
- secrets, local DBs, screenshots, generated artifacts, or `.env` files

## Rollback Rules

- If helper output is ambiguous, return the placeholder fallback.
- If source refs are not proven already-read, return the placeholder fallback.
- If inputs are missing, malformed, unsupported, or out of scope, return the
  placeholder fallback.
- If docs and smoke disagree, block merge until they are reconciled.
- If a future implementation mutates authority tables, writes Core records, or
  calls external services, revert to the placeholder fallback.
- If a future implementation affects route behavior, Cockpit actions,
  commit/reject, proposal scoring, Gate/SRF, Claim confidence, Evidence status,
  publication readiness, mailbox, delivery, temporal review artifacts, OpenAI,
  or GitHub behavior, revert the helper path and keep `sidecar_e_t` as the
  structured placeholder.

## Relationship To Existing Docs

- `docs/SIDECAR_ET_DIAGNOSTIC_DESIGN_V0_1.md`: parent design-only promotion
  path for a possible future Sidecar e_t diagnostic.
- `docs/SIDECAR_ET_OFFLINE_FIXTURE_DESIGN_V0_1.md`: deterministic offline
  fixture categories and expected boundary assertions.
- `docs/PERSPECTIVE_SNAPSHOT_V0_1.md`: implemented `PerspectiveSnapshot` and
  `research_diagnostics` placeholder baseline.
- `docs/AUTHORITY_MATRIX.md`: authority boundaries for provider-neutral lanes
  and Perspective diagnostics.
- `docs/VERIFICATION_EVIDENCE_PACK.md`: verification evidence and smoke
  reporting boundaries.
- `docs/MODULE_SIDECAR_QP_ZT_SUMMARY.md`: module-local Sidecar/QP/z_t
  reference. This helper design does not override it and does not promote
  module-local concepts into runtime authority.

## Merge Criteria For A Future Helper Implementation PR

A future helper implementation PR is not ready until:

- this helper design has been reviewed
- `smoke:sidecar-et-fixture-boundaries` is extended
- placeholder fallback is tested for missing, malformed, unsupported,
  out-of-scope, and ambiguous inputs
- already-read refs only are proven
- no authority mutation is proven
- no external calls are proven
- docs and smoke agree
- no runtime route or Cockpit expansion is introduced
- no `PerspectiveSnapshot` response shape change is introduced without a
  separately scoped schema/design PR

Until those criteria are met, `sidecar_e_t` must remain the implemented
structured placeholder in `PerspectiveSnapshot`.
