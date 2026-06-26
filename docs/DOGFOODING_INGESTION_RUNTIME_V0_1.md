# Dogfooding Ingestion Runtime v0.1

## 1. Purpose

Dogfooding Ingestion Runtime ingests bounded summaries only.

Dogfooding Ingestion Runtime requires explicit operator action.

This slice converts caller-provided public-safe dogfooding summaries and symbolic refs into bounded DogfoodingRecord objects compatible with the Dogfooding Record Runtime Contract v0.1.

## 2. Relationship to the integrated roadmap guide v0.2.1 FULL

This implements the Phase 6.2 dogfooding_ingestion_runtime_v0_1 slice. The roadmap guide is not SSOT. It is an operational roadmap, PR sequencing guide, and authority-boundary checklist.

Actual field and type authority remains with the local dogfooding contract and this runtime helper.

## 3. Relationship to PR #795 Dogfooding Record Runtime Contract

PR #795 defined DogfoodingRecord, DogfoodingSignal, DogfoodingReviewCue, and authority-boundary contracts. This slice follows that contract and creates bounded records only from explicit public-safe input.

Dogfooding records are not truth.
Dogfooding records are not proof.
Dogfooding records are not promotion readiness.

## 4. Scope and non-goals

Dogfooding Ingestion Runtime does not ingest raw conversations.
Dogfooding Ingestion Runtime does not ingest hidden reasoning.
Dogfooding Ingestion Runtime does not ingest telemetry dumps.
Dogfooding Ingestion Runtime does not read browser logs.
Dogfooding Ingestion Runtime does not read session logs.
Dogfooding Ingestion Runtime does not read private files.
Dogfooding Ingestion Runtime does not fetch sources.
Dogfooding Ingestion Runtime does not call providers.
Dogfooding Ingestion Runtime does not execute retrieval or RAG.

This PR does not add UI controls, background jobs, external analytics ingestion, source fetch, provider calls, retrieval, or RAG generation.

## 5. Ingestion input shape

Inputs use `dogfooding_ingestion_input.v0.1`, `dogfooding_ingestion_runtime.v0.1`, and `dogfooding_record_runtime_contract.v0.1` with `scope: project:augnes`.

The input must include a stable ingestion id, record id, operator actor ref, timestamp, bounded context summary, `explicit_operator_action_required: true`, `public_safe: true`, boundary notes, reason codes, and an array of public-safe signal inputs.

Signal inputs must include public-safe symbolic refs and bounded summaries. Empty signal arrays return `empty` and write no record.

## 6. Record creation rules

Record creation is deterministic. The same input produces the same DogfoodingRecord and the same record fingerprint.

Dogfooding ingestion does not mutate candidates.
Dogfooding ingestion does not mutate durable Perspective state.
Dogfooding ingestion does not write Formation Receipts.
Dogfooding ingestion does not promote Perspective.
Dogfooding ingestion does not create proof/evidence.
Dogfooding ingestion does not write claim/evidence records.
Dogfooding ingestion does not product-write.

Created records remain bounded review records and carry contract authority fields that keep truth, proof, promotion readiness, raw conversation, hidden reasoning, telemetry dump, and product-write authority false.

## 7. Review cue rules

Signals can request candidate-only review cues. Product-write requests are review cues only. Product-write requests do not execute product-write.

Review cues are candidate-only and do not create proof, evidence, promotion, durable state, or product-write authority.

## 8. Store and route rules

The store uses caller-injected SQLite handles only. Schema creation is explicit and bounded to the dogfooding tables. Create operations write record, signal, and review-cue rows atomically or roll back together.

Duplicate record ids are rejected with a bounded error and no partial rows.

The same-origin records route accepts POST ingestion and read-only GET listing/reading. POST validates same-origin, JSON object shape, action, db_path, and ingestion input before opening a write DB. GET opens read-only with file-must-exist behavior, does not mkdir, does not ensure schema, and returns bounded `db_missing` or `schema_missing` responses.

## 9. Privacy and redaction rules

Raw conversations are blocked.
Hidden reasoning is blocked.
Telemetry dumps are blocked.
Private file paths are blocked.
Private URLs are blocked.
Secret-like values are blocked.

Source refs are lineage pointers, not proof.
Source refs must be public-safe symbolic refs.

The runtime stores bounded summaries and symbolic refs only. It does not store raw source bodies, raw provider output, raw retrieval output, raw feedback payload, raw surfacing payload, raw dogfooding payload, raw conversations, hidden reasoning, or telemetry dumps.

## 10. Authority boundary

Dogfooding ingestion can write bounded dogfooding records and only bounded dogfooding records.

Product-write remains parked by #686.

No durable Perspective state is mutated. No Formation Receipt is written. No promotion is executed. No proof/evidence is created. No claim/evidence record is written. No product-write is executed. No product id is allocated. No provider call, prompt sending, retrieval, RAG generation, source fetch, private file read, Git Ledger export, Codex execution, or GitHub automation is authorized.

## 11. Deferred work

- Runtime audit panel integration
- Git Ledger export
- Product write reentry
- Release readiness matrix

## 12. Verification expectations

Verification should run the dogfooding ingestion runtime smoke, the dogfooding record runtime contract smoke, feedback/surfacing downstream smokes, typecheck, and diff whitespace checks.

The smoke must prove bounded ingestion, empty input behavior, product-write request review cues, store read/list behavior, duplicate rejection, no partial rows on failed write, route read/write boundaries, privacy marker rejection, deterministic fingerprints, and package/index pointers.

## 13. Next recommended slices

1. runtime_audit_panel_v0_1
2. git_ledger_export_contract_v0_1 only after audit/readiness review
3. product_write_reentry_review_v0_1 only after explicit reentry approval
4. release_readiness_matrix_v0_1
5. disabled_product_write_adapter_reentry_harness_v0_1 only after explicit reentry approval
