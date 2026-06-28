# Project Constellation Manual Anchors Runtime Completion v0.1

## Purpose

This slice implements `layout_persistence_manual_anchors_runtime_completion_v0_1` as the runtime completion for original Phase 5.4 manual anchor persistence requirements in `docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md`.

This slice closes the original Phase 5.4 manual anchor persistence gap if the earlier implementation was partial.

Manual anchors are display hints only.

Layout coordinates are not truth.

Manual anchors are not truth.

Manual anchors are not promotion readiness.

Manual anchors are not evidence strength.

Manual anchors are not source authority.

## Relationship to Earlier Manual Anchors v0.1

`docs/PROJECT_CONSTELLATION_MANUAL_ANCHORS_V0_1.md` remains compatible. The earlier slice established a bounded DB-backed manual-anchor store and route, but this runtime completion makes the original Phase 5.4 behavior explicit with caller-injected SQLite helper aliases, `upsert_anchor` / `discard_anchor` route actions, idempotent upsert coverage, update coverage, lifecycle discard coverage, and runtime-completion fixture/smoke/docs.

## Relationship to Constellation Runtime UI Completion

`docs/PROJECT_CONSTELLATION_RUNTIME_UI_COMPLETION_V0_1.md` binds the constellation UI to bounded runtime read/preview sources while remaining read-only. This slice supplies the bounded manual-anchor persistence runtime that the UI may read later. It does not add UI write controls.

## Schema

The runtime uses `project_constellation_manual_anchors` and `project_constellation_manual_anchor_activity`.

Manual anchor records store `anchor_id`, `scope`, `layout_id`, `perspective_id`, `state_version_ref`, `node_ref`, `anchor_position_json`, `anchor_reason`, `created_by_ref`, `applies_to_layout_scope`, explicit operator/display flags, reason codes, boundary notes, authority boundary JSON, timestamps, and lifecycle discard metadata.

This slice may write only manual anchor records and lifecycle/discard metadata.

## Store Helper API

The store exposes caller-injected SQLite helpers:

- `ensureProjectConstellationManualAnchorSchemaV01(db)`
- `projectConstellationManualAnchorSchemaExistsV01(db)`
- `createOrUpdateProjectConstellationManualAnchorV01(input, db)`
- `readProjectConstellationManualAnchorV01(anchorId, db)`
- `listProjectConstellationManualAnchorsV01(filters, db)`
- `discardProjectConstellationManualAnchorV01(anchorId, reason, db)`
- `createProjectConstellationManualAnchorAuthorityBoundaryV01(options)`
- `isSafeProjectConstellationManualAnchorDbPathV01(path)`

The legacy helper names remain available for compatibility.

## Route Policy

The route is `GET /api/perspective/layout/manual-anchors` and `POST /api/perspective/layout/manual-anchors`.

GET is read-only. GET requires a safe allowlisted `db_path`, does not create DB files, does not create schema, and returns bounded `db_missing` or `schema_missing` errors when needed.

POST requires same-origin, JSON object body, a safe allowlisted `db_path`, and explicit `action`.

POST supports:

- `upsert_anchor`
- `discard_anchor`

Legacy `create` and `discard` remain compatibility aliases. POST may ensure schema and write only manual anchor records plus lifecycle/activity rows.

## DB Path Policy

Only relative DB paths under these prefixes are allowed:

- `tmp/project-constellation-manual-anchors/`
- `.tmp/project-constellation-manual-anchors/`

Paths must end with `.sqlite` or `.db`. Absolute paths, `..`, backslashes, null bytes, URLs, private/local user paths, and token/secret-looking paths are rejected. Error responses do not echo unsafe `db_path` values.

## Upsert Policy

`upsert_anchor` validates the full anchor input before opening a write transaction. New anchors create one anchor row and one created activity row atomically.

Repeating the same `anchor_id` and same public-safe payload is idempotent and does not duplicate anchor or activity rows.

Using the same `anchor_id` with a different valid position, reason, or bounded public-safe metadata updates the existing anchor row through explicit `upsert_anchor`, preserves lineage, and appends a bounded update activity row.

## Discard Lifecycle Policy

`discard_anchor` is lifecycle transition only. It sets `discarded_at` and `discard_reason`, appends bounded discard activity, and preserves the anchor row. Discard is not hard delete.

## Idempotency and Conflict Policy

The legacy `createManualAnchorRecordV01` helper still rejects duplicate creates for compatibility. The runtime completion uses `createOrUpdateProjectConstellationManualAnchorV01` for explicit upsert semantics.

Invalid input, forbidden authority, private/raw markers, and invalid DB paths write no partial rows.

## Display-Hint-Only Policy

Manual anchors are display hints only. Layout coordinates are not truth. Manual anchors are not truth, promotion readiness, evidence strength, or source authority.

The store rejects fields such as `truth_score`, `promotion_readiness`, `evidence_strength`, and `source_authority`.

## Forbidden Authority Policy

Known forbidden authority fields fail closed for any non-false value. A forbidden field is allowed only when absent, `false`, `null`, or `undefined`.

Forbidden authorities include proof/evidence writes, claim/evidence writes, work item writes, promotion, durable state write/apply, Formation Receipt writes, provider calls, prompt sending, source fetch, retrieval/RAG execution, retrieval index writes, product-write, product ID allocation, Git/GitHub execution, Codex execution, and product-write authority.

## Privacy and Redaction Policy

Records store bounded public-safe symbolic refs, display positions, bounded anchor reasons, reason codes, and lifecycle metadata only.

This slice does not store raw private payloads, raw source bodies, raw provider outputs, raw retrieval outputs, raw DB rows, raw conversations, hidden reasoning, private URLs, local private paths, secrets, telemetry dumps, real GitHub payloads, real PR payloads, raw diffs, or terminal logs.

## Authority Boundary

Allowed true fields:

- `manual_anchor_persistence_runtime_now`
- `explicit_operator_anchor_action_only`
- `same_origin_route_now`
- `caller_injected_db_only`
- `db_query_or_write_now`
- `manual_anchor_write_now` for POST upsert/discard
- `manual_anchor_read_now` for GET/list/read
- `display_hint_only`

Forbidden fields remain false, including `coordinate_is_truth`, `manual_anchor_is_truth`, `anchor_is_promotion_readiness`, `anchor_is_evidence_strength`, `anchor_is_source_authority`, `proof_or_evidence_record_now`, `claim_or_evidence_write_now`, `work_item_write_now`, `promotion_execution_now`, `durable_state_write_now`, `durable_state_apply_now`, `formation_receipt_write_now`, `provider_openai_call_now`, `prompt_sent_now`, `source_fetch_now`, `retrieval_execution_now`, `retrieval_index_write_now`, `rag_answer_generation_now`, `product_write_now`, `product_write_runtime_now`, `product_write_adapter_enabled_now`, `product_id_allocation_now`, `product_persistence_now`, `git_ledger_export_runtime_now`, `git_write_now`, `github_api_call_now`, `repository_file_write_now`, `local_file_export_now`, `local_file_import_now`, `codex_execution_now`, `codex_execution_authority`, `github_automation_authority`, `product_write_authority`, `smoke_pass_is_truth`, and `ci_pass_is_truth`.

## Explicit Non-Goals

This slice does not create proof/evidence.

This slice does not write claim/evidence records.

This slice does not create work items.

This slice does not promote Perspective.

This slice does not write/apply durable Perspective state.

This slice does not write Formation Receipts.

This slice does not call providers.

This slice does not send prompts.

This slice does not fetch sources.

This slice does not execute retrieval/RAG.

This slice does not write retrieval indexes.

This slice does not generate RAG answers.

This slice does not execute Git/GitHub.

This slice does not execute Codex.

This slice does not product-write.

This slice does not allocate product IDs.

Product-write remains parked by #686.

Smoke/CI pass is not truth.

The roadmap guide is not SSOT.

## Fixture Policy

`fixtures/project-constellation-manual-anchors-runtime-completion.sample.v0.1.json` uses public-safe symbolic refs only. SAFE_MARKER placeholders appear only inside blocked/error examples.

## Verification Expectations

Run:

- `node --check scripts/smoke-project-constellation-manual-anchors-runtime-completion-v0-1.mjs`
- `npm run smoke:project-constellation-manual-anchors-runtime-completion-v0-1`
- `npm run smoke:project-constellation-manual-anchors-v0-1`
- `npm run smoke:project-constellation-runtime-ui-completion-v0-1`
- `npm run smoke:project-constellation-runtime-ui-v0-1`
- `npm run smoke:rag-context-preview-runtime-completion-v0-1`
- `npm run smoke:durable-perspective-state-apply-v0-1`
- `npm run smoke:perspective-trajectory-v0-1`
- `npm run smoke:authority-boundary-regression-v0-1`
- `npm run smoke:privacy-redaction-guard-v0-1`
- `npm run smoke:formal-invariant-checks-narrow-scope-v0-1`
- `npm run smoke:product-write-target-contract-v0-1`
- `npm run typecheck`
- `git diff --check`
- `git diff --cached --check`
- `npm run smoke:release-postmerge-observer-notes-v0-1`
- `npm run smoke:release-readiness-matrix-v0-1`

## Deferred UI Write Binding

Manual anchor UI write controls remain deferred unless a later UI slice explicitly requires them. This runtime completion is store/route persistence only.
