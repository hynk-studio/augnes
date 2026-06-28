# Runtime Audit Selected Route Instrumentation v0.1

## Purpose

`runtime_audit_selected_route_instrumentation_v0_1` is a narrow first instrumentation pass after Runtime Audit Panel Runtime Completion v0.1. It lets selected explicit runtime routes optionally emit bounded audit events when the operator supplies `audit_db_path`.

This slice instruments only a selected route subset. It does not instrument every route in the repo.

## Relationship to Runtime Audit Panel Runtime Completion v0.1

Runtime Audit Panel Runtime Completion v0.1 added the DB-backed audit event store, same-origin audit route, read-only audit model builder, and panel binding. This slice uses that store through a small route instrumentation helper so the panel can read audit events emitted by selected runtime routes.

## Selected route list

The first pass covers:

- `app/api/research-source/intake/route.ts`
- `app/api/research-candidate-review/provider-extraction/route.ts`
- `app/api/research-retrieval/rag-context-preview/route.ts`
- `app/api/research-candidate/feedback-events/route.ts`
- `app/api/research-candidate/feedback-events/surfacing-preview/route.ts`

## Audit DB path policy

POST routes read optional `audit_db_path` from the top-level route body, not from the domain input. Missing `audit_db_path` keeps primary route behavior unchanged. If `audit_db_path` is present but invalid, the audit write is skipped and the unsafe path is not echoed.

The audit DB path uses the same safe policy as the runtime audit event store:

- `tmp/runtime-audit/`
- `.tmp/runtime-audit/`

## Audit event shape

The instrumentation helper builds audit events with bounded metadata only:

- route ref
- runtime slice ref
- event surface
- event kind
- event action
- event status
- subject ref
- related refs
- bounded summary
- bounded error code
- primary result status/ref

Audit events are bounded review records only. Audit events are not truth. Audit events are not proof. Audit events are not approval. Audit events are not durable state. Audit events are not product-write authority.

## No-op policy

Missing `audit_db_path` returns `audit_not_requested` from the helper. Routes may include this bounded audit result, but the primary route behavior and status remain unchanged.

## Audit failure isolation policy

Audit write failure does not fail the primary route. Unexpected audit write errors return `audit_write_failed_bounded` and never throw into the primary route.

## Raw payload exclusion policy

This slice does not store raw request bodies. This slice does not store raw response bodies. This slice does not store raw terminal logs. This slice does not ingest browser dumps. This slice does not store hidden reasoning. This slice does not store raw provider output. This slice does not store raw retrieval output.

## Route response policy

Instrumented routes include bounded `audit_event_result` metadata after the primary route result is computed. The audit result contains status, audit event ref, persistence flag, and reason codes only.

## Authority boundary

This slice does not create proof/evidence. This slice does not write claim/evidence records. This slice does not create work items. This slice does not promote Perspective. This slice does not write/apply durable Perspective state. This slice does not write Formation Receipts. This slice does not execute Git/GitHub. This slice does not execute Codex. This slice does not product-write. This slice does not allocate product IDs. Product-write remains parked by #686.

Provider/source/retrieval behavior is limited to whatever the selected route already explicitly performs. Audit instrumentation does not add provider calls, source fetches, retrieval index writes, or audit-derived enforcement.

Smoke/CI pass is not truth. The roadmap guide is not SSOT.

## Fixture policy

The fixture uses public-safe symbolic refs only. Safe markers appear only inside blocked/skipped examples.

## Verification expectations

Smoke verifies helper exports, no-op behavior, invalid path skip, private/raw skip, forbidden authority skip, successful audit writes, idempotency, bounded write failure, selected route instrumentation, route behavior without audit path, and audit panel store listing of emitted events.

## Deferred broader instrumentation

Broader route instrumentation is deferred. This PR intentionally covers only the selected route subset.
