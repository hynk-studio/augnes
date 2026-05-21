# Sidecar e_t Runtime Implementation Checklist v0.1

## Status

- Status: implementation-checklist-only.
- SSOT status: non-SSOT.
- Runtime behavior: no runtime behavior.
- Schema authority: no schema authority.
- Implementation authority: no implementation authority.

This checklist is the final design/review gate that must be satisfied before
any runtime `log_only` Sidecar e_t computation can be implemented in
`PerspectiveSnapshot`. It does not implement runtime computation, change
`PerspectiveSnapshot` response shape, add routes, add Cockpit actions, call
external services, or write Core state.

## Baseline

The implemented baseline remains:

- Runtime `PerspectiveSnapshot` still returns the structured `sidecar_e_t`
  placeholder.
- `npm run smoke:sidecar-et-runtime-boundaries` exists and checks
  placeholder-only runtime behavior.
- The fixture-only candidate helper remains smoke-only and runtime-disabled.
- `loopness_hint` remains the only bounded `log_only` runtime diagnostic.

Until every checklist item below is approved and proven in a future PR, runtime
`sidecar_e_t` must remain the placeholder with `computed=false` and
`source_refs=[]`.

## Required Approval Gates Before Implementation

Before any runtime implementation PR starts, reviewers must confirm:

- user/PM explicit approval
- final runtime output policy reviewed
- source-ref policy reviewed
- smoke update plan reviewed
- rollback plan reviewed
- Cockpit display/non-action plan reviewed if UI display is touched
- no schema or API route expansion unless separately approved

Approval to review this checklist does not approve runtime implementation.

## Required Code Constraints For Any Future Runtime PR

Any future runtime PR must keep Sidecar e_t as:

- read-only derived view only
- already-read `PerspectiveSnapshot` refs only
- no DB reads beyond the existing `PerspectiveSnapshot` read-set unless
  separately designed
- no writes
- no external calls
- no route changes
- no Cockpit action controls
- no evidence or proof creation
- no `z_t` commit
- no QP output treated as evidence
- no proposal scoring
- no commit/reject input
- no Gate/SRF input
- no Claim confidence or Evidence status input
- no publication readiness

Any deviation requires a separate design and explicit approval before code is
merged.

## Required Smoke Updates For Any Future Runtime PR

Any future runtime PR must update or keep passing:

- `npm run smoke:perspective-snapshot`
- `npm run smoke:perspective-quality`
- `npm run smoke:research-diagnostics-boundaries`
- `npm run smoke:sidecar-et-runtime-boundaries`
- `npm run smoke:sidecar-et-fixture-boundaries`
- any new focused smoke if the existing smoke families cannot express the
  boundary clearly

The fixture-only smoke must remain passing and must remain separate from
runtime computation.

## Required Assertions

Future implementation smoke must assert:

- runtime `sidecar_e_t` is `log_only`
- runtime output `source_refs subset_of PerspectiveSnapshot.source_refs`
- placeholder fallback for missing refs
- placeholder fallback for ambiguous refs
- placeholder fallback for malformed refs
- placeholder fallback for non-read refs
- no authority table mutation
- no state transition writes
- no proposal status changes
- no evidence or proof creation
- no work mutation
- no action mutation
- no mailbox mutation
- no publication mutation
- no delivery mutation
- no temporal review artifact mutation
- `fetch_calls=0`
- no OpenAI calls
- no GitHub calls
- no live calls
- no Cockpit action buttons
- no QP evidence
- no `z_t` commit
- docs and smoke wording agree

Assertions must cover helper-level and route-level `PerspectiveSnapshot`
generation where route behavior is affected. Direct route handler calls are
preferred unless a future integration PR separately justifies starting a Next
server.

## Runtime Output Wording Checklist

Any future runtime output wording must include or preserve:

- `log_only`
- non-authoritative
- not source of truth
- not evidence
- not proof
- not QP evidence
- not `z_t` commit
- not proposal scoring
- not commit/reject input
- not Gate/SRF input
- not Claim confidence or Evidence status input
- not publication readiness
- not Cockpit action input

If wording can be read as authority, proof, readiness, recommendation,
production signal, QP measurement, `z_t` update, or Cockpit actionability, the
runtime output must fall back to the structured placeholder or the PR must not
merge.

## Blocking Conditions

Block implementation or merge if:

- source refs cannot be proven already-read
- wording is authority-like
- output shape changes without separate design
- Cockpit action controls appear
- any mutation appears
- any external call appears
- docs and smoke disagree
- user/PM approval is absent

These blockers are independent. Passing one blocker does not waive another.

## Rollback Requirements

If runtime implementation fails any boundary, rollback must:

- fall back to placeholder
- remove the runtime computation path
- restore `computed=false` and `source_refs=[]`
- revert any smoke/doc mismatch
- keep the fixture-only helper unaffected

Rollback must not create schema changes, route changes, Cockpit actions,
evidence/proof records, `z_t` commits, QP evidence behavior, or Core writes.

## Relationship To Existing Docs

- `docs/SIDECAR_ET_RUNTIME_SMOKE_DESIGN_V0_1.md`: runtime smoke and regression
  test plan, including the focused runtime boundary smoke skeleton.
- `docs/SIDECAR_ET_RUNTIME_LOG_ONLY_DESIGN_V0_1.md`: runtime `log_only`
  promotion boundary and required future implementation gates.
- `docs/SIDECAR_ET_OFFLINE_COMPUTATION_DESIGN_V0_1.md`: offline fixture-only
  computation boundary and rollback rules.
- `docs/PERSPECTIVE_SNAPSHOT_V0_1.md`: implemented runtime placeholder
  baseline and response-shape documentation.
- `docs/AUTHORITY_MATRIX.md`: provider-neutral authority boundaries. This
  checklist does not add authority.
- `docs/VERIFICATION_EVIDENCE_PACK.md`: verification evidence and smoke
  reporting boundaries. This checklist is review context only, not runtime
  proof or evidence.

## Completion Criteria For A Future Runtime PR

A future runtime implementation PR is not ready until:

- user/PM approval is recorded in the PR
- this checklist is referenced and every applicable item is satisfied
- source refs are proven already-read only
- output wording is reviewed as non-authoritative
- required smoke updates are implemented
- mutation and external-call absence is proven
- Cockpit non-action boundaries are proven
- fallback and rollback behavior is proven
- docs and smoke agree

Until then, runtime `sidecar_e_t` must remain the structured placeholder.
