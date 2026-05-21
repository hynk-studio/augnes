# Sidecar e_t Offline Computation Design v0.1

## Status

- Status: computation-design-only.
- SSOT status: non-SSOT.
- Runtime behavior: no runtime behavior.
- Schema authority: no schema authority.
- Implementation authority: no implementation authority.

This document defines the design boundary for a possible future offline
deterministic Sidecar e_t computation step after the placeholder-only helper
skeleton and validation hardening. It does not implement computation. It does
not change `PerspectiveSnapshot`, API response shape, database schema, routes,
Cockpit behavior, OpenAI behavior, commit/reject behavior, GitHub publish
behavior, or evidence/proof behavior.

## Baseline

The implemented baseline remains:

- `sidecar_e_t` remains a structured placeholder.
- `buildSidecarEtOfflineDiagnosticCandidate` currently returns placeholder
  fallback for every input.
- `buildSidecarEtOfflineFixtureCandidate` exists as a separate smoke/fixture
  only candidate path.
- `validateSidecarEtOfflineInputBoundary` returns bounded validation only and
  is not authority.
- `npm run smoke:sidecar-et-fixture-boundaries` verifies placeholder fallback,
  validation boundaries, fixture-only candidate boundaries, and no authority
  mutation.
- `loopness_hint` remains the only bounded `log_only` diagnostic object
  currently computed by runtime `PerspectiveSnapshot` generation.

The helper skeleton does not compute Sidecar/e_t/QP/z_t values, does not emit
`sidecar_e_t.source_refs`, does not set `computed=true`, does not create QP
output, and does not commit or hint an actual `z_t` regime.
The fixture-only candidate helper may return a bounded smoke-only candidate,
but it is not wired into `PerspectiveSnapshot` runtime generation, routes,
Cockpit, OpenAI, GitHub, commit/reject, or any Core write path.

## Implementation Skeleton Note

`lib/perspective/sidecar-et-offline-helper.ts` now has two separate paths:

- `buildSidecarEtOfflineDiagnosticCandidate(input?)`: the default helper path.
  It returns the structured placeholder fallback for every input and remains
  the only default diagnostic helper behavior.
- `buildSidecarEtOfflineFixtureCandidate(input?)`: the smoke/fixture-only
  candidate path. It is pure, deterministic, non-runtime, and can compute only
  bounded candidate labels from supplied already-read fixture refs and known
  deterministic fixture metadata.

The fixture-only candidate path does not perform DB reads, fetches, OpenAI
calls, GitHub calls, filesystem writes, env mutation, time-dependent output, or
persistence writes. It returns placeholder fallback when validation fails, when
`candidate_source_refs` are missing or not already read, or when the fixture
category is missing, unknown, unsupported, invalid-input, or
source-ref-boundary.

Fixture-only candidate computation is allowed only for known deterministic
fixture categories:

- `clean/minimal`
- `repeated/noisy`
- `missing-context`
- `conflicting-context`

Unknown or unsupported categories return placeholder fallback. This does not
permit runtime computation.

Fixture-only output text is smoke-only review text. Candidate summaries and
notes must use explicit boundary language: fixture-only, `log_only`,
smoke-only/non-runtime, non-authoritative, not actual Sidecar state, not
evidence, not proof, not QP evidence, not `z_t` commit, not source of truth,
not proposal scoring, not commit/reject input, not Gate/SRF input, not Claim
confidence or Evidence status input, not publication readiness, and not
Cockpit action input.

Fixture-only output text must avoid ambiguous proof, evidence, readiness,
authority, recommendation, actionability, regime-assignment, QP-measurement,
`z_t` update, or production/runtime signal language. Any wording ambiguity
forces placeholder fallback or blocks merge until docs, helper output, and
smoke assertions agree.

`PerspectiveSnapshot` still returns the structured `sidecar_e_t` placeholder.
Future runtime `log_only` computation still requires a separate PR, separate
review, and smoke coverage proving no route, Cockpit, API response shape,
authority, evidence/proof, `z_t`, QP-evidence, or Core-write leakage.
`docs/SIDECAR_ET_RUNTIME_LOG_ONLY_DESIGN_V0_1.md` defines the next
runtime-log-only design gate without implementing runtime computation.

## Proposed Future Computation Boundary

The first implemented computation skeleton is an offline deterministic
fixture-only helper path, not runtime computation.

The future computation boundary is:

- offline deterministic helper only
- fixture-only computation first and only in this skeleton
- no runtime routes
- no Cockpit rendering or action path
- no OpenAI calls
- no GitHub calls
- no live external calls
- no DB reads beyond already-read refs
- no persistence writes
- no evidence or proof creation
- no `z_t` commit
- no QP output treated as evidence

The computation, if ever implemented, must remain a diagnostic candidate only.
It must not become authority, source of truth, proposal scoring, commit/reject
input, Gate/SRF input, Claim confidence input, Evidence status input,
publication readiness input, or Cockpit action input.

## Candidate Computation Inputs

Candidate inputs are design-limited to deterministic data already available to
the offline fixture path:

- already-read state refs
- already-read action refs
- already-read work refs
- already-read tension refs
- fixture metadata
- validated `candidate_source_refs` subset

The input boundary must exclude:

- raw provider ids as canonical state
- raw session ids as canonical state
- raw thread ids as canonical state
- raw run ids as canonical state
- hidden model internals
- hidden chain-of-thought
- live provider data
- unreviewed local artifacts
- secrets, tokens, private keys, or `.env` files

The read-set rule remains:

```text
candidate_source_refs subset_of already_read_fixture_refs
```

If that subset relationship cannot be proven, the future helper must return
the placeholder fallback and emit no computed values.

## Candidate Computation Outputs

This section is prose-only design, not schema authority. It does not define a
final output shape, field contract, enum contract, or response-shape change.

A future implementation may consider:

- a bounded no-pressure result for clean fixtures
- a bounded caveat result for repeated, noisy, or conflicting fixtures
- placeholder fallback for missing, invalid, unsupported, ambiguous, or
  out-of-boundary source refs

Any computed output, if ever implemented, must stay:

- `mode=log_only`
- non-authoritative
- bounded
- derived from already-read refs only
- not evidence
- not proof
- not `z_t` commit
- not QP output treated as evidence
- not proposal scoring
- not commit/reject input
- not Gate/SRF input
- not Claim confidence or Evidence status input
- not publication readiness
- not Cockpit action input

The structured placeholder remains the required fallback whenever output cannot
be proven bounded, deterministic, fixture-scoped, and non-authoritative.
It also remains the required fallback whenever fixture-only output wording
cannot be kept clearly smoke-only, non-runtime, non-authoritative, not
evidence, not proof, not QP evidence, and not `z_t` commit.

## Deterministic Scoring And Labeling Constraints

This design does not define a final scoring formula. It only allows discussion
of deterministic signal families that a separate implementation PR might later
make concrete with smoke coverage.

Allowed deterministic signal families include:

- missing basis
- repeated trace pressure
- unresolved tension pressure
- source-ref completeness

Any formula, threshold, label mapping, or output vocabulary beyond the bounded
fixture-only skeleton requires a separate implementation PR and smoke updates.
No score, label, or caveat may be used outside `log_only` fixture diagnostics.
No score may influence proposal scoring, commit/reject, Gate/SRF, Claim
confidence, Evidence status, publication readiness, Cockpit actions,
evidence/proof creation, or authority boundaries.

## Required Future Implementation Gates

The first fixture-only skeleton extends
`npm run smoke:sidecar-et-fixture-boundaries` and keeps validation coverage.
Any future expansion must continue to prove:

- validator true cases are accepted only as bounded input validation
- validator false cases return placeholder fallback
- helper computation only runs in offline fixture context
- default helper still returns placeholder fallback for every input
- fixture-only helper is not used by `buildPerspectiveSnapshot`
- placeholder fallback for invalid inputs
- placeholder fallback for ambiguous inputs
- clean fixture does not fabricate pressure
- repeated/noisy fixture output is bounded and non-authoritative
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

The future smoke must fail if computation leaks into runtime routes, Cockpit
rendering/action paths, OpenAI observe/plan/preview behavior, commit/reject
behavior, GitHub publish behavior, or Core writes.

## Rollback Rules

- Fall back to placeholder on ambiguity.
- Fall back to placeholder if source refs are not already-read.
- Fall back to placeholder if input validation fails.
- Fall back to placeholder if output cannot be bounded.
- Block merge if docs and smoke disagree.
- Revert any implementation that leaks into runtime behavior.
- Revert any implementation that leaks into Cockpit rendering or action paths.
- Revert any implementation that leaks into routes or API response shape.
- Revert any implementation that leaks into Core writes.
- Revert any implementation that creates evidence/proof, commits `z_t`, or
  treats QP output as evidence.

## Explicit Non-Goals

This computation design does not allow:

- runtime computation
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
- source refs that were not already read
- raw provider/session/thread/run ids as canonical state
- hidden model internals
- unreviewed local artifacts
- secrets, local DBs, screenshots, generated artifacts, or `.env` files

## Relationship To Existing Docs

- `docs/SIDECAR_ET_DIAGNOSTIC_DESIGN_V0_1.md`: parent design-only diagnostic
  path. This computation design does not promote diagnostics into runtime
  behavior or authority.
- `docs/SIDECAR_ET_OFFLINE_FIXTURE_DESIGN_V0_1.md`: deterministic fixture
  categories and expected boundary assertions. A future computation PR must
  extend those fixture boundaries before computing values.
- `docs/SIDECAR_ET_OFFLINE_HELPER_DESIGN_V0_1.md`: non-runtime helper
  boundary, allowed inputs, already-read refs rule, validation note, and
  placeholder fallback requirement.
- `docs/PERSPECTIVE_SNAPSHOT_V0_1.md`: implemented `PerspectiveSnapshot`
  placeholder baseline. This document does not change response shape.
- `docs/SIDECAR_ET_RUNTIME_LOG_ONLY_DESIGN_V0_1.md`: future runtime
  `log_only` promotion boundary after fixture-only output review. It does not
  wire computation into runtime.
- `docs/AUTHORITY_MATRIX.md`: authority boundaries for provider-neutral lanes
  and Perspective diagnostics. This document does not add authority.
- `docs/VERIFICATION_EVIDENCE_PACK.md`: verification evidence and smoke
  reporting boundaries. This document is design review context only, not
  runtime proof or evidence.

## Merge Criteria For A Future Offline Computation PR

A future offline computation PR is not ready until:

- this computation design has been reviewed
- fixture-only computation is the only implemented path
- `smoke:sidecar-et-fixture-boundaries` is extended
- validator true/false cases are tested
- placeholder fallback is tested for missing, invalid, unsupported,
  out-of-boundary, and ambiguous inputs
- clean, repeated/noisy, missing-context, conflicting-context, invalid-input,
  and source-ref boundary fixtures are covered
- no runtime route or Cockpit expansion is introduced
- no `PerspectiveSnapshot` response shape change is introduced
- no authority mutation is proven
- no external calls are proven
- docs and smoke agree

Until those criteria are met, `sidecar_e_t` must remain the implemented
structured placeholder in `PerspectiveSnapshot`.
