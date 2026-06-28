# Runtime Audit Selected Route Instrumentation v0.2

## Purpose

`runtime_audit_selected_route_instrumentation_v0_2` is a second narrow instrumentation pass after Runtime Audit Selected Route Instrumentation v0.1. It adds optional bounded audit events for additional DB-backed runtime routes without instrumenting every route in the repo.

This slice instruments only a second selected route subset.

## Relationship to Runtime Audit Selected Route Instrumentation v0.1

v0.1 added the reusable route audit helper and wired the first explicit runtime routes. v0.2 reuses that helper and preserves the v0.1 audit event ID policy: route results use `primary_result_ref` where available, and exact repeats remain idempotent.

## Selected Route List

- `app/api/research-retrieval/rebuild/route.ts`
- `app/api/research-retrieval/search/route.ts`
- `app/api/perspective/layout/manual-anchors/route.ts`
- `app/api/runtime-audit/events/route.ts`

Review memory routes are deferred from this pass. This PR remains narrow.

## Audit DB Path Policy

POST routes read optional `audit_db_path` from the top-level route body, not from domain input. Missing `audit_db_path` leaves primary route behavior unchanged. Invalid `audit_db_path` skips audit and does not echo unsafe values.

## GET Query Audit Path Policy

GET routes read optional `audit_db_path` from the query string. The domain route `db_path` remains separate from the audit destination. Invalid audit paths do not fail the primary GET result.

## Audit Event Shape

Audit events contain bounded route metadata only: route ref, runtime slice ref, event surface, event kind, event action, event status, subject ref, related refs, primary result ref/status, bounded summary, and bounded error code.

Audit events are bounded review records only. Audit events are not truth, proof, approval, durable state, or product-write authority.

## No-Op Policy

Missing `audit_db_path` returns `audit_not_requested` and leaves the primary route behavior unchanged.

## Audit Failure Isolation Policy

Audit write failure does not fail the primary route. The helper returns a bounded audit status such as `audit_write_failed_bounded`.

## Self-Audit Recursion Policy

The runtime audit route instruments GET list only in this pass. POST audit event creation is not self-instrumented, so audit event creation does not recursively audit itself forever. Runtime audit GET list may emit one bounded audit event about the list response when `audit_db_path` is supplied.

## Raw Payload Exclusion Policy

This slice does not store raw request bodies. This slice does not store raw response bodies. This slice does not store raw terminal logs. This slice does not ingest browser dumps. This slice does not store hidden reasoning. This slice does not store raw provider output. This slice does not store raw retrieval output.

## Authority Boundary

This slice does not create proof/evidence. This slice does not write claim/evidence records. This slice does not create work items. This slice does not promote Perspective. This slice does not write/apply durable Perspective state. This slice does not write Formation Receipts. This slice does not execute Git/GitHub. This slice does not execute Codex. This slice does not product-write. This slice does not allocate product IDs. Product-write remains parked by #686.

Smoke/CI pass is not truth. The roadmap guide is not SSOT.

## Fixture Policy

The fixture uses public-safe symbolic refs only. It contains no real secrets, provider IDs, connector IDs, uploaded-file IDs, private URLs, local paths, raw source bodies, raw provider outputs, raw retrieval outputs, raw DB rows, raw conversations, hidden reasoning, telemetry dumps, browser dumps, real GitHub payloads, raw request bodies, raw response bodies, raw diffs, or real terminal logs.

## Verification Expectations

Smoke verifies v0.1 helper reuse, selected route instrumentation calls, no-op behavior without `audit_db_path`, invalid audit path isolation, retrieval rebuild/search audit emission, manual anchor list/upsert/discard audit emission, runtime audit GET list self-audit without recursion, audit panel store listing, raw payload exclusion, non-authoritative audit event boundaries, and compatibility with relevant v0.1 runtime smokes.

## Deferred Broader Instrumentation

Broader all-route instrumentation remains deferred. Optional review memory route instrumentation is deferred from this pass.
