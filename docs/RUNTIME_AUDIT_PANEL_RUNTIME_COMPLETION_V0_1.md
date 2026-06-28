# Runtime Audit Panel Runtime Completion v0.1

## Purpose

`runtime_audit_panel_runtime_completion_v0_1` closes the runtime audit panel gap by adding DB-backed bounded audit events and read-only panel binding.

The earlier Runtime Audit Panel v0.1 remains compatible but was caller-provided audit-items only. This completion adds a caller-injected SQLite audit event store, a same-origin audit route, an audit model builder over persisted events, and a read-only panel mode that reads bounded audit events.

## Relationship to the roadmap

This slice implements the original v0.2.1 FULL roadmap audit-panel runtime behavior for bounded audit review surfaces. The roadmap guide is not SSOT.

## Relationship to recent DB-backed runtime completions

Recent runtime slices added bounded DB-backed review memory, source intake, provider extraction, retrieval, RAG context preview, manual anchors, feedback event write, feedback aggregation, and feedback surfacing preview paths. This slice does not instrument every runtime route; it creates the bounded audit substrate and panel binding those surfaces can use in follow-up instrumentation.

## Audit event schema

The audit store uses `runtime_audit_events` with public-safe bounded fields:

- `audit_event_id`
- `scope`
- `event_kind`
- `event_surface`
- `event_action`
- `event_status`
- `subject_ref`
- `related_refs_json`
- `route_ref`
- `runtime_slice_ref`
- `created_by`
- `created_at`
- `bounded_summary`
- `bounded_error_code`
- `authority_boundary_json`
- `privacy_report_json`
- `reason_codes_json`
- `event_fingerprint`
- `event_json`

Audit events are bounded review records only. Audit event is not truth. Audit event is not proof. Audit event is not approval. Audit event is not durable state. Audit event is not product-write authority.

## Store helper API

`lib/runtime-audit/audit-event-store.ts` exports:

- `ensureRuntimeAuditEventSchemaV01`
- `runtimeAuditEventSchemaExistsV01`
- `createRuntimeAuditEventV01`
- `readRuntimeAuditEventV01`
- `listRuntimeAuditEventsV01`
- `createRuntimeAuditEventAuthorityBoundaryV01`
- `createRuntimeAuditEventFingerprintV01`
- `isSafeRuntimeAuditDbPathV01`

Duplicate `audit_event_id` with the same fingerprint is idempotent. Duplicate `audit_event_id` with a different payload is a conflict with no partial write.

## Route policy

`app/api/runtime-audit/events/route.ts` exposes:

- `GET` for read-only audit event listing and audit model summary.
- `POST` for explicit `create_audit_event` persistence only.

GET does not create a DB file or schema. Missing DB returns `db_missing`; missing schema returns `schema_missing`. POST may ensure the audit event schema for the allowlisted audit DB path.

The route is same-origin bounded and returns no raw unsafe values.

## DB path policy

Audit DB paths must be relative and under:

- `tmp/runtime-audit/`
- `.tmp/runtime-audit/`

Paths must end with `.sqlite` or `.db`. Absolute paths, parent traversal, backslashes, null bytes, URLs, private/local user paths, and token/secret-looking paths are rejected without echoing the unsafe value.

## Audit model policy

`buildRuntimeAuditPanelModelV01` builds a read-only model from persisted audit events. The model summarizes statuses, kinds, surfaces, latest event time, bounded errors, and grouped surface rows. It does not call providers, fetch sources, execute retrieval/RAG, write DB, or mutate state.

## Read-only panel policy

`components/runtime-audit-panel.tsx` preserves the caller-provided props mode and adds a route-backed read mode. The route-backed panel calls `GET /api/runtime-audit/events` only. It does not create audit events, write DB, write files, mutate product state, or expose product-write controls.

## Raw payload exclusion policy

This slice does not store raw request bodies. This slice does not store raw response bodies. This slice does not store raw terminal logs. This slice does not ingest browser dumps. This slice does not store hidden reasoning. This slice does not store raw provider output. This slice does not store raw retrieval output.

## Authority boundary

Allowed runtime fields are limited to bounded audit event persistence on POST, audit event read on GET, caller-injected DB use, same-origin audit route use, read-only audit model building, and bounded summaries only.

Forbidden fields remain false: provider/OpenAI calls, prompt sending, source fetch, retrieval/RAG execution, retrieval index writes, RAG answer generation, proof/evidence writes, claim/evidence writes, work item creation, Perspective promotion, durable Perspective state write/apply, Formation Receipt writes, Git/GitHub execution, Codex execution, product-write, product-write runtime, product ID allocation, product persistence, raw request/response/terminal/browser/provider/retrieval payload storage, and hidden reasoning storage.

This slice does not call providers. This slice does not send prompts. This slice does not fetch sources. This slice does not execute retrieval/RAG. This slice does not write retrieval indexes. This slice does not generate RAG answers. This slice does not create proof/evidence. This slice does not write claim/evidence records. This slice does not create work items. This slice does not promote Perspective. This slice does not write/apply durable Perspective state. This slice does not write Formation Receipts. This slice does not execute Git/GitHub. This slice does not execute Codex. This slice does not product-write. This slice does not allocate product IDs. Product-write remains parked by #686.

Smoke/CI pass is not truth.

## Fixture policy

The fixture uses public-safe symbolic refs only. Blocked examples use safe markers only to prove raw/private payload rejection.

## Verification expectations

The runtime completion smoke verifies schema creation, idempotency, conflict behavior, GET missing DB/schema behavior, blocked raw/private payloads, recursive forbidden authority scanning, model grouping, panel route-backed read support, and no forbidden controls.

## Deferred instrumentation work

Follow-up work can instrument individual runtime routes to create audit events. That is intentionally deferred so this PR stays focused on audit substrate and read-only panel binding.
