# Sidecar e_t Runtime Smoke Design v0.1

## Status

- Status: runtime-smoke-design-only.
- SSOT status: non-SSOT.
- Runtime behavior: no runtime behavior.
- Schema authority: no schema authority.
- Implementation authority: no implementation authority.

This document defines the smoke and regression-test plan required before any
future runtime `log_only` Sidecar e_t diagnostic can be wired into
`PerspectiveSnapshot`. It does not implement runtime computation. It does not
change `PerspectiveSnapshot` response shape, routes, Cockpit, OpenAI, GitHub,
commit/reject, or any Core write path.

## Baseline

The implemented baseline remains:

- Runtime `PerspectiveSnapshot` currently returns the structured
  `sidecar_e_t` placeholder with `computed=false` and `source_refs=[]`.
- The fixture-only Sidecar e_t candidate helper is smoke-only and
  runtime-disabled.
- `docs/SIDECAR_ET_RUNTIME_LOG_ONLY_DESIGN_V0_1.md` exists but does not
  implement runtime computation.
- `loopness_hint` remains the only bounded `log_only` diagnostic object
  computed by runtime `PerspectiveSnapshot`.

This runtime smoke skeleton PR does not change runtime `sidecar_e_t` output.
`npm run smoke:sidecar-et-runtime-boundaries` now exists as a focused
placeholder-only runtime boundary smoke. It checks current runtime behavior and
does not enable runtime computation.
`docs/SIDECAR_ET_RUNTIME_IMPLEMENTATION_CHECKLIST_V0_1.md` is the final
review checklist that must be satisfied before any runtime implementation PR.
It is docs-only and does not enable runtime computation.

## Required Smoke Families

Any future runtime implementation must update or add coverage in these smoke
families:

- `npm run smoke:perspective-snapshot`
- `npm run smoke:perspective-quality`
- `npm run smoke:research-diagnostics-boundaries`
- `npm run smoke:sidecar-et-fixture-boundaries`
- `npm run smoke:sidecar-et-runtime-boundaries`

The focused runtime smoke currently asserts placeholder-only behavior,
source-ref fallback boundaries, mutation/external-call absence, static Cockpit
non-action boundaries, and static `PerspectiveSnapshot` non-wiring boundaries.
It is a skeleton for future regression checks, not permission to implement
runtime computation.

## Runtime Smoke Assertions

Future runtime smoke must assert:

- runtime `sidecar_e_t` remains `log_only`
- if runtime computed output exists, `computed=true` is allowed only after a
  separate implementation PR
- runtime output uses already-read `PerspectiveSnapshot` refs only
- `candidate_source_refs subset_of PerspectiveSnapshot source_refs`
- missing refs fall back to placeholder
- ambiguous refs fall back to placeholder
- non-read refs fall back to placeholder
- output wording remains non-authoritative
- output is not evidence
- output is not proof
- output is not QP evidence
- output is not `z_t` commit
- output is not source of truth
- output is not proposal scoring
- output is not commit/reject input
- output is not Gate/SRF input
- output is not Claim confidence or Evidence status input
- output is not publication readiness
- output is not Cockpit action input

Smoke wording must distinguish explicit negative boundary phrases from
authority-like claims. Ambiguous wording must fail smoke or force placeholder
fallback.

## Mutation And External-Call Assertions

Future runtime smoke must prove:

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
- no live external calls
- no DB reads beyond the existing `PerspectiveSnapshot` read-set unless
  separately designed

If any mutation or external call appears, runtime `sidecar_e_t` must remain
placeholder-only and the implementation must not merge.

## UI And Cockpit Assertions

Future runtime smoke or static checks must prove:

- no new action buttons
- no approve controls
- no publish controls
- no retry controls
- no commit/reject controls
- no proof controls
- no evidence controls
- no work controls
- no mailbox controls
- no publication controls
- no Cockpit action input from `sidecar_e_t`

If `sidecar_e_t` is displayed later, UI copy must say `log_only`,
non-authoritative, not source of truth, not evidence/proof, not QP evidence,
and not `z_t` commit.

This PR must not change Cockpit.

## Source-Ref Policy

Runtime smoke must compare runtime `sidecar_e_t.source_refs` against
`PerspectiveSnapshot.source_refs`.

Source refs may only be emitted if the already-read relationship is proven:

```text
runtime_sidecar_e_t.source_refs subset_of PerspectiveSnapshot.source_refs
```

Unsupported source-ref kinds must fall back to placeholder. Source-ref errors
must not create evidence/proof, state transitions, proposal status changes, or
other Core writes.

## Placeholder Fallback Matrix

Future runtime smoke must include fallback cases for:

- missing refs
- empty refs
- ambiguous refs
- unsupported refs
- non-read refs
- malformed runtime candidate data
- wording ambiguity
- any authority boundary failure

Every fallback case must preserve the structured placeholder, keep
`computed=false`, keep runtime `sidecar_e_t.source_refs=[]`, and avoid Core
writes and external calls unless a separately approved runtime design changes
that contract.

## Test Isolation

Runtime smoke should use:

- temp DB fixtures
- cleared `OPENAI_API_KEY`
- cleared GitHub tokens
- stubbed `fetch`
- no Next server unless a future integration PR explicitly justifies it
- direct helper calls where applicable
- direct route handler calls where route behavior must be observed

Smoke output must not include secrets, local DB files, screenshots, generated
artifacts, or `.env` files.

## Non-Goals

This runtime smoke design does not allow:

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

## Rollback And Blocking Rules

- Block merge if docs and smoke disagree.
- Fall back to placeholder if source refs are not already read.
- Fall back to placeholder if wording becomes authority-like.
- Fall back to placeholder if output cannot be proven bounded.
- Revert implementation if runtime path mutates Core records.
- Revert implementation if runtime path creates evidence or proof.
- Revert implementation if runtime path calls external services.
- Revert implementation if runtime path emits QP evidence.
- Revert implementation if runtime path commits `z_t`.
- Revert implementation if runtime path changes Cockpit actions.

## Relationship To Existing Docs

- `docs/SIDECAR_ET_RUNTIME_LOG_ONLY_DESIGN_V0_1.md`: runtime `log_only`
  promotion boundary. This smoke design expands the required test plan for
  that future promotion.
- `docs/SIDECAR_ET_RUNTIME_IMPLEMENTATION_CHECKLIST_V0_1.md`: final
  implementation review checklist for a future runtime PR. It does not add
  implementation authority.
- `docs/SIDECAR_ET_OFFLINE_COMPUTATION_DESIGN_V0_1.md`: offline fixture-only
  computation boundary, output wording constraints, required gates, and
  rollback rules.
- `docs/SIDECAR_ET_OFFLINE_HELPER_DESIGN_V0_1.md`: non-runtime helper
  boundary, allowed inputs, already-read refs rule, validation note, and
  placeholder fallback requirement.
- `docs/SIDECAR_ET_OFFLINE_FIXTURE_DESIGN_V0_1.md`: deterministic offline
  fixture categories and expected boundaries.
- `docs/PERSPECTIVE_SNAPSHOT_V0_1.md`: implemented runtime placeholder
  baseline. This smoke design does not change response shape.
- `docs/AUTHORITY_MATRIX.md`: authority boundaries for provider-neutral lanes
  and Perspective diagnostics. This document does not add authority.
- `docs/VERIFICATION_EVIDENCE_PACK.md`: verification evidence and smoke
  reporting boundaries. This document is design review context only, not
  runtime proof or evidence.

## Merge Criteria For A Future Runtime Smoke PR

A future runtime smoke PR is not ready until:

- the smoke family placement is explicit
- temp DB fixture isolation is documented
- source-ref subset assertions are implemented
- mutation and external-call assertions are implemented
- UI/Cockpit non-action assertions are implemented
- placeholder fallback cases are implemented
- docs and smoke wording agree

Until those criteria are met, runtime `sidecar_e_t` must remain the implemented
structured placeholder in `PerspectiveSnapshot`.
