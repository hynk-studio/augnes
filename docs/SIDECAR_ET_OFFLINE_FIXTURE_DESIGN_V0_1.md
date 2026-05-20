# Sidecar e_t Offline Fixture Design v0.1

## Status

- Status: fixture-design-only.
- Authority: non-SSOT design note.
- Runtime behavior: none.
- Schema authority: none.
- Implementation authority: none.

This document defines deterministic fixture categories and expected boundaries
for a possible future offline Sidecar e_t diagnostic. It does not implement
Sidecar/e_t/QP/z_t computation. It does not change `PerspectiveSnapshot`, API
response shape, database schema, routes, Cockpit behavior, OpenAI behavior,
commit/reject behavior, GitHub publish behavior, or evidence/proof behavior.

## Baseline

The implemented baseline remains:

- `sidecar_e_t` is a structured placeholder.
- `sidecar_e_t` is not actual Sidecar state, not QP output, and not `z_t`
  regime commit.
- `loopness_hint` is the only bounded `log_only` diagnostic currently
  computed.
- `research_diagnostics` remains `log_only` and non-authoritative.

The future fixture set must prove placeholder fallback and boundary behavior
before any offline deterministic helper is implemented.

`npm run smoke:sidecar-et-fixture-boundaries` encodes these fixture categories
as placeholder-boundary checks only. It verifies fallback and authority
boundaries without computing Sidecar/e_t/QP/z_t values, creating QP output, or
committing `z_t`.

`docs/SIDECAR_ET_OFFLINE_HELPER_DESIGN_V0_1.md` defines the next
helper-design-only gate. It specifies allowed inputs, already-read ref
boundaries, fallback rules, and future smoke requirements before any offline
helper implementation.

## Fixture Cases

These fixtures are design targets only. They do not define runtime data,
database rows, final schema, or computed diagnostic values.

### Clean/minimal Fixture

Input shape:

- committed state basis exists
- no repeated trace pressure
- no unresolved tensions
- no pending proposal pressure
- only already-read source refs are available

Expected Sidecar e_t fallback:

- structured placeholder or null-equivalent fallback
- no fabricated e_t, QP, or z_t values
- no computed Sidecar e_t diagnostic output
- `loopness_hint` may remain `level=none`

### Repeated/noisy Fixture

Input shape:

- repeated action traces
- repeated work traces
- open tensions
- pending proposal pressure
- already-read source refs only

Expected Sidecar e_t fallback:

- structured placeholder or null-equivalent fallback unless a future offline
  computation PR explicitly defines bounded output
- no z_t commit
- no QP output treated as evidence
- no proposal scoring, commit/reject, Gate/SRF, or publication readiness
  influence
- noisy trace pressure remains bounded and non-authoritative

### Missing-context Fixture

Input shape:

- sparse committed-state basis
- sparse or absent evidence context
- sparse or absent work/action context
- missing source refs or missing diagnostic basis

Expected behavior:

- no fabricated e_t, QP, or z_t values
- placeholder fallback
- explicit missing-context note in future fixture output, if a future output
  shape adds notes
- no source-of-truth claim

### Conflicting-context Fixture

Input shape:

- contradictory committed-state, tension, or proposal context
- conflicting trace summaries or unresolved tensions
- already-read source refs only

Expected behavior:

- no z_t commit
- no authority
- no QP output treated as evidence
- no Evidence status or Claim confidence influence
- placeholder fallback unless a future offline computation PR defines a
  bounded non-authoritative conflict caveat

### Invalid-input Fixture

Input shape:

- malformed source refs
- unsupported source ref types
- missing required fixture fields
- malformed optional fixture sections

Expected behavior:

- placeholder fallback
- no mutation
- no external calls
- no computed values
- clear fixture failure or fallback reason in smoke output, if future smoke
  output includes reasons

### Source-ref Boundary Fixture

Input shape:

- attempted refs to ids not read by the current fixture path
- attempted refs to ids outside the fixture scope
- attempted refs to unsupported authority rows

Expected behavior:

- reject or omit non-read refs in any future computation
- do not emit computed values when source refs cannot be proven already-read
- do not read extra rows just to satisfy the diagnostic
- do not mutate Core records

## Expected Fixture Assertions

Any future fixture smoke must prove:

- no authority table mutation
- `fetch_calls=0`
- no OpenAI calls
- no GitHub calls
- no proposal status changes
- no state transition writes
- no Cockpit action buttons
- no `z_t` commit
- no QP output treated as evidence
- `source_refs` are already-read refs only
- invalid input returns placeholder fallback
- clean fixture does not fabricate diagnostic pressure
- repeated/noisy fixture remains bounded and non-authoritative

## Candidate Fixture Output

This document does not define final schema. A future offline computation PR may
describe fixture output in prose or add a smoke-only shape, but any computed
field must remain:

- `log_only`
- non-authoritative
- bounded
- derived from already-read refs only
- separately implemented in a later PR

The fixture output must not become source of truth, proof, readiness, proposal
scoring, Gate/SRF input, Claim confidence, Evidence status, publication
readiness, commit/reject input, or Cockpit action input.

## Non-Goals

This fixture design does not allow:

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

## Relationship To Existing Docs

- `docs/SIDECAR_ET_DIAGNOSTIC_DESIGN_V0_1.md`: parent design-only promotion
  gate. This fixture design is the next gate after the placeholder design.
- `docs/MODULE_SIDECAR_QP_ZT_SUMMARY.md`: module-local Sidecar/QP/z_t reference.
  This fixture design does not override it and does not promote module-local
  concepts into runtime authority.
- `docs/PERSPECTIVE_SNAPSHOT_V0_1.md`: implemented `PerspectiveSnapshot` and
  `research_diagnostics` placeholder baseline.
- `docs/SIDECAR_ET_OFFLINE_HELPER_DESIGN_V0_1.md`: future non-runtime helper
  design and read-set/fallback boundaries for the next gate.
- `docs/AUTHORITY_MATRIX.md`: provider-neutral and Perspective diagnostic
  authority boundaries.
- `docs/VERIFICATION_EVIDENCE_PACK.md`: verification evidence and smoke
  reporting boundaries.

## Merge Criteria For A Future Offline Computation PR

A future offline computation PR is not ready until:

- this fixture design has been reviewed
- fixture smoke is added
- placeholder fallback is tested
- no authority mutation is proven
- already-read refs only are proven
- docs and smoke agree
- invalid input fallback is tested
- clean and repeated/noisy fixture behavior is bounded
- no runtime route or Cockpit expansion is introduced

Until those criteria are met, `sidecar_e_t` must remain the implemented
structured placeholder in `PerspectiveSnapshot`.
