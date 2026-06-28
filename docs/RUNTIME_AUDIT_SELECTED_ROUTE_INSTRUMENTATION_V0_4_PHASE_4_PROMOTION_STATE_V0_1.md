# Runtime Audit Selected Route Instrumentation v0.4: Phase 4 Promotion/State

## Purpose

`runtime_audit_selected_route_instrumentation_v0_4_phase_4_promotion_state_v0_1`
implements the next ungated implementation slice identified by the remaining
runtime gap audit. It adds optional bounded audit events to selected Phase 4
promotion decision, Formation Receipt, durable Perspective state, and
trajectory routes so the Runtime Audit Panel can observe those route results.

This slice instruments only the selected Phase 4 promotion/state route subset.
It does not instrument every route in the repo.

## Relationship to Remaining Runtime Gap Audit v0.1

`docs/V0_2_1_REMAINING_RUNTIME_GAP_AUDIT_V0_1.md` and
`fixtures/v0-2-1-remaining-runtime-gap-audit.sample.v0.1.json` name
`runtime_audit_selected_route_instrumentation_v0_4_phase_4_promotion_state_v0_1`
as the next recommended ungated implementation slice. That audit found the
Phase 4 promotion/durable-state chain has runtime routes, but selected runtime
audit instrumentation v0.1-v0.3 did not yet cover those routes.

## Relationship to Runtime Audit Selected Route Instrumentation v0.1-v0.3

v0.1 added the reusable route audit helper and first selected runtime route
instrumentation. v0.2 reused the helper for retrieval, manual anchors, and the
runtime audit list route. v0.3 reused it for Review Memory DB routes. v0.4
reuses the same helper and event ID policy: route results use
`primary_result_ref` where available, and exact repeated audit writes for the
same route result remain idempotent.

## Selected Phase 4 Route List

- `app/api/perspective/promotion-decisions/route.ts`
- `app/api/perspective/promotion-decisions/[promotion_decision_id]/route.ts`
- `app/api/perspective/formation-receipts/route.ts`
- `app/api/perspective/state/apply-delta/route.ts`
- `app/api/perspective/state/[perspective_id]/route.ts`
- `app/api/perspective/state/[perspective_id]/trajectory/route.ts`

## Audit DB Path Policy

POST routes read optional `audit_db_path` from the top-level route body, not
from domain input. Missing audit_db_path leaves primary route behavior
unchanged. Invalid `audit_db_path` skips audit and does not echo unsafe values.

## GET Query Audit Path Policy

GET routes read optional `audit_db_path` from the query string. The domain
`db_path` remains separate from the audit destination. Invalid audit paths do
not fail the primary GET result.

## Audit Event Shape

Audit events contain bounded route metadata only: route ref, runtime slice ref,
event surface, event kind, event action, event status, subject ref, related
refs, primary result ref/status, bounded summary, and bounded error code.

Audit events are bounded review records only.

Audit events are not truth, proof, approval, durable state, promotion authority,
Formation Receipt authority, or product-write authority.

Audit events are not truth, proof, approval, durable state, promotion authority, Formation Receipt authority, or product-write authority.

## No-Op Policy

Missing `audit_db_path` returns `audit_not_requested` from the helper and leaves
the primary route behavior unchanged.

Missing audit_db_path leaves primary route behavior unchanged.

## Audit Failure Isolation Policy

Audit write failure does not fail the primary route. The helper returns a
bounded audit status such as `audit_write_failed_bounded`, and primary route
status remains based on the Phase 4 domain result.

## Raw Payload Exclusion Policy

This slice does not store raw request bodies.

This slice does not store raw response bodies.

This slice does not store raw terminal logs.

This slice does not ingest browser dumps.

This slice does not store hidden reasoning.

This slice does not store raw provider output.

This slice does not store raw retrieval output.

## Phase 4 Route Action Mapping

Promotion decisions collection route:

- GET emits `event_surface: promotion_decision_store`,
  `event_kind: route_response`, and `event_action:
  promotion_decisions_listed`.
- POST emits `event_surface: promotion_decision_store`,
  `event_kind: route_response`, and `event_action:
  promotion_decision_created`.
- GET uses `subject_ref: promotion-decision:list` and
  `primary_result_ref: promotion-decision:list:<count>:<first-id-or-empty>`.
- POST uses the `promotion_decision_id` as subject and primary result ref.

Promotion decision detail route:

- GET emits `event_surface: promotion_decision_store`,
  `event_kind: route_response`, and `event_action:
  promotion_decision_read`.
- The `promotion_decision_id` is the subject and primary result ref.

Formation Receipt route:

- GET emits `event_surface: formation_receipt_runtime`,
  `event_kind: route_response`, and `event_action:
  formation_receipts_listed`.
- POST create emits `event_surface: formation_receipt_runtime`,
  `event_kind: route_response`, and `event_action:
  formation_receipt_created`.
- List results use `subject_ref: formation-receipt:list` and a bounded list
  primary result ref.
- Create results use the `receipt_id` as subject and primary result ref.

Durable Perspective state apply route:

- POST emits `event_surface: durable_perspective_state_runtime`,
  `event_kind: route_response`, and `event_action:
  durable_perspective_state_delta_applied`.
- The `perspective_id` is the subject ref.
- The primary result ref uses the apply event id, state fingerprint, Formation
  Receipt id, or perspective id according to the bounded route result.

Durable Perspective state read route:

- GET emits `event_surface: durable_perspective_state_runtime`,
  `event_kind: route_response`, and `event_action:
  durable_perspective_state_read`.
- The `perspective_id` is the subject ref.
- The primary result ref uses the state fingerprint or perspective id.

Perspective trajectory route:

- GET emits `event_surface: perspective_trajectory_runtime`,
  `event_kind: route_response`, and `event_action:
  perspective_trajectory_read`.
- The `perspective_id` is the subject ref.
- The primary result ref uses the trajectory fingerprint, state fingerprint, or
  perspective id according to the bounded route result.

## Authority Boundary

Promotion decision remains a human-reviewed decision record, not proof.

Formation Receipt remains a receipt, not product-write.

Durable Perspective state apply remains receipt-backed state mutation only;
audit does not mutate state.

Durable Perspective state apply remains receipt-backed state mutation only; audit does not mutate state.

Trajectory remains read-only reconstruction, not authority.

This slice does not create proof/evidence.

This slice does not write claim/evidence records.

This slice does not create work items.

This slice does not promote Perspective.

This slice does not write/apply durable Perspective state beyond the existing
selected route behavior.

This slice does not write/apply durable Perspective state beyond the existing selected route behavior.

This slice does not write Formation Receipts beyond the existing selected route
behavior.

This slice does not write Formation Receipts beyond the existing selected route behavior.

This slice does not execute Git/GitHub.

This slice does not execute Codex.

This slice does not product-write.

This slice does not allocate product IDs.

Product-write remains parked by #686.

Smoke/CI pass is not truth.

The roadmap guide is not SSOT.

## Fixture Policy

The fixture uses public-safe symbolic refs only. It does not include real
secrets, provider IDs, connector IDs, uploaded-file IDs, private URLs, local
paths, raw source bodies, raw provider outputs, raw retrieval outputs, raw DB
rows, raw conversations, hidden reasoning, telemetry dumps, browser dumps, real
GitHub payloads, raw request bodies, raw response bodies, raw diffs, or real
terminal logs.

Safe markers may appear only inside skipped, blocked, or invalid examples.

## Verification Expectations

Smoke verifies docs and fixture presence, remaining runtime gap audit linkage,
v0.1-v0.3 instrumentation docs and smokes, selected Phase 4 route
instrumentation calls, new audit event surfaces, event emission for selected
Phase 4 create/list/read/apply/trajectory routes, no-op behavior without
`audit_db_path`, invalid audit path isolation, audit panel store listing, raw
payload exclusion, non-authoritative audit boundaries, repeated audit
idempotency, and compatibility with the existing selected Phase 4 domain smokes.

## Deferred Broader Instrumentation

Broader all-route instrumentation remains deferred. This pass covers only the
selected Phase 4 promotion/state route subset named above.
