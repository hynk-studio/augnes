# Runtime Audit Selected Route Instrumentation v0.3

## Purpose

`runtime_audit_selected_route_instrumentation_v0_3` is a third narrow instrumentation pass after Runtime Audit Selected Route Instrumentation v0.1 and v0.2. It adds optional bounded audit events for the Review Memory DB route surface without instrumenting every route in the repo.

This slice instruments only a third selected route subset: Review Memory DB routes.

## Relationship to Runtime Audit Selected Route Instrumentation v0.1 and v0.2

v0.1 added the reusable route audit helper and the first explicit runtime route instrumentation. v0.2 reused that helper for retrieval, manual anchors, and runtime audit list routes. v0.3 reuses the same helper and preserves the audit event ID policy: route results use `primary_result_ref` where available, and exact repeats remain idempotent.

## Selected Route List

- `app/api/research-candidate-review/review-records/route.ts`
- `app/api/research-candidate-review/review-records/[review_record_id]/route.ts`
- `app/api/research-candidate-review/review-records/[review_record_id]/activity/route.ts`
- `app/api/research-candidate-review/review-records/[review_record_id]/discard/route.ts`

This PR remains narrow and does not instrument every route.

## Audit DB Path Policy

POST routes read optional `audit_db_path` from the top-level route body, not from domain input. Missing `audit_db_path` leaves primary route behavior unchanged. Invalid `audit_db_path` skips audit and does not echo unsafe values.

## GET Query Audit Path Policy

GET routes read optional `audit_db_path` from the query string. The Review Memory route `db_path` remains separate from the audit destination. Invalid audit paths do not fail the primary GET result.

## Audit Event Shape

Audit events contain bounded route metadata only: route ref, runtime slice ref, event surface, event kind, event action, event status, subject ref, related refs, primary result ref/status, bounded summary, and bounded error code.

Audit events are bounded review records only. Audit events are not truth, proof, approval, durable state, or product-write authority.

## No-Op Policy

Missing `audit_db_path` returns `audit_not_requested` and leaves the primary route behavior unchanged.

## Audit Failure Isolation Policy

Audit write failure does not fail the primary route. The helper returns a bounded audit status such as `audit_write_failed_bounded`.

## Raw Payload Exclusion Policy

This slice does not store raw request bodies. This slice does not store raw response bodies. This slice does not store raw terminal logs. This slice does not ingest browser dumps. This slice does not store hidden reasoning. This slice does not store raw provider output. This slice does not store raw retrieval output.

## Review Memory Route Action Mapping

- Review record collection GET emits `review_memory_records_listed`.
- Review record collection POST emits `review_memory_record_created`.
- Review record detail GET emits `review_memory_record_read`.
- Review record activity GET emits `review_memory_activity_listed`.
- Review record activity POST emits `review_memory_activity_appended`.
- Review record discard POST emits `review_memory_record_discarded`.

All events use `event_surface: review_memory_db_routes` and `event_kind: route_response`.

## Authority Boundary

Review memory is not truth. Review memory is not proof. Review memory is not accepted evidence. Review memory is not durable Perspective state. Candidate refs are not facts. Source refs are lineage pointers, not proof.

This slice does not create proof/evidence. This slice does not write claim/evidence records. This slice does not create work items. This slice does not promote Perspective. This slice does not write/apply durable Perspective state. This slice does not write Formation Receipts. This slice does not execute Git/GitHub. This slice does not execute Codex. This slice does not product-write. This slice does not allocate product IDs. Product-write remains parked by #686.

Smoke/CI pass is not truth. The roadmap guide is not SSOT.

## Fixture Policy

The fixture uses public-safe symbolic refs only. It contains no real secrets, provider IDs, connector IDs, uploaded-file IDs, private URLs, local paths, raw source bodies, raw provider outputs, raw retrieval outputs, raw DB rows, raw conversations, hidden reasoning, telemetry dumps, browser dumps, real GitHub payloads, raw request bodies, raw response bodies, raw diffs, or real terminal logs.

## Verification Expectations

Smoke verifies v0.1/v0.2 helper and docs presence, selected route instrumentation calls, no-op behavior without `audit_db_path`, invalid audit path isolation, Review Memory create/list/detail/activity/discard audit emission, audit panel store listing, raw payload exclusion, non-authoritative audit event boundaries, idempotent exact repeats where applicable, and compatibility with relevant v0.1/v0.2 runtime smokes.

## Deferred Broader Instrumentation

Broader all-route instrumentation remains deferred. This pass covers only the Review Memory DB route subset named above.
