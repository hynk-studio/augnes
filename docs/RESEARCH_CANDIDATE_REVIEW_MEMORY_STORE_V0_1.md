# Research Candidate Review Memory Store v0.1

Slice name: `research_candidate_review_memory_store_v0_1`

## 1. Purpose

Research Candidate Review Memory Store is local-store-only. It provides a
deterministic helper for validating and storing bounded Research Candidate
Review Memory records in a caller-provided local JSON file.

Review memory is not truth. Candidate memory is not Perspective state. The
store preserves public-safe symbolic refs, bounded summaries, privacy reports,
lineage refs, lifecycle states, and review decisions. It does not store raw
private payloads and does not create proof/evidence, promotion, work mutation,
or product writes.

## 2. Relationship To The Integrated Roadmap Guide v0.2

It implements Phase 2.2 from the integrated development roadmap guide v0.2.
The primary planning basis is
`AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_GUIDE_V0_2_2026-06-25.md`.

Older remaining-development, Research/ROI, Temporal Perspective Overlay, and
Git Ledger proposal documents are background inputs already integrated into the
roadmap guide, not standalone ordering authority.
Those older proposal documents are background inputs already integrated into the roadmap guide.

## 3. Relationship To #769 Review Memory Contract

It follows the #769 Review Memory Contract. The helper accepts only records
that conform to `research_candidate_review_memory_record.v0.1` and rejects
records that violate privacy, lineage, reason-code, or authority boundaries.

The store implementation does not change the contract. It provides local
validation, deterministic snapshot derivation, idempotent upsert, discard,
supersede, and caller-provided file read/write helpers.

## 4. Scope And Non-Goals

In scope:

- Local JSON store helper.
- Store snapshot validation.
- Record validation before store writes.
- Deterministic snapshot fingerprinting.
- Idempotent upsert.
- Discard and supersede helpers that preserve lineage.
- Caller-provided file read/write helpers.
- Public-safe fixture, smoke, docs, package script, and index pointer.

Non-goals:

- No runtime route.
- No UI.
- No app/api route.
- No DB migration.
- No DB query/write.
- No background job.
- No provider/OpenAI call.
- No source fetch.
- No retrieval/RAG execution.
- No embedding, vector search, or index runtime.
- No proof/evidence write.
- No Perspective promotion.
- No durable Perspective state write.
- No work mutation.
- No Codex execution.
- No GitHub automation.
- No Git Ledger export.
- No product write.
- No product ID allocation.

It does not add runtime routes. It does not add UI. It does not add DB migrations.
It does not query or write DB. It writes only to caller-provided local JSON file paths.
It does not choose a default private path.
It does not store raw private payloads.
It does not store raw source bodies.
It does not store raw provider outputs.
It does not store raw conversations.
It does not store hidden reasoning.
It does not call provider/OpenAI.
It does not fetch sources.
It does not execute retrieval/RAG.
It does not create proof/evidence.
It does not promote Perspective.
It does not mutate durable Perspective state.
It does not mutate work.
It does not execute Codex.
It does not call GitHub.
It does not export Git Ledger packets.
It does not write product records.

Product-write remains parked by #686.

## 5. Store Snapshot Shape

The local store snapshot shape is:

- `store_version`
- `contract_version`
- `scope`
- `status`
- `as_of`
- `records`
- `record_order`
- `record_count`
- `discarded_record_refs`
- `superseded_record_refs`
- `active_record_refs`
- `boundary_notes`
- `authority_boundary`
- `store_fingerprint`

The store fingerprint is deterministic SHA-256 over canonical JSON for the
snapshot without `store_fingerprint`.

## 6. Record Validation Rules

The helper rejects records with:

- Wrong record version, scope, or status.
- Missing `record_id`, `candidate_ref`, timestamps, or `bounded_summary`.
- Invalid record kind, lifecycle state, review decision, privacy class, or
  source surface.
- Invalid privacy reports.
- Source refs that are not public-safe symbolic refs.
- Summaries containing raw/private markers.
- `blocked_raw_private_payload` without blocked reason codes.
- `discarded` lifecycle without `discard_reason`.
- `superseded` lifecycle without `supersedes_record_ref`.
- Authority boundary grants.
- Source-ref reason-code mismatches.
- Missing or non-array `reason_codes`.
- Unknown `reason_codes`; reason_codes are controlled vocabulary and unknown reason codes are rejected.
- Missing `privacy_boundary_preserved`,
  `contract_only_not_runtime_memory`, `candidate_memory_not_truth`,
  `review_memory_not_promotion`, or `product_write_denied`.

## 7. Source Ref Privacy Rules

Source refs are lineage pointers, not proof. Source refs must be public-safe symbolic refs.
`sourceRef.public_safe` false does not allow raw private values
inside `source_ref`; it only means the referenced upstream material is not
public-safe.

The helper rejects source refs containing private URLs, local private paths,
tokens, secrets, provider thread/run/session IDs, raw DB rows, browser dumps,
hidden reasoning, raw source bodies, raw candidate payloads, or raw provider
outputs.

## 8. Idempotent Upsert Rules

Upsert validates the record first. If `record_id` is new, the record is added
and the snapshot is rebuilt deterministically. If the record already exists and
canonical content is identical, the snapshot is unchanged. If the record exists
with different content, the helper replaces it only when `updated_at` is
greater than or equal to the existing value. Older updates are rejected.

## 9. Discard Semantics

Discard is not deletion. The discard helper updates a record to
`lifecycle_state: discarded`, sets `review_decision: discard`, requires
`discard_reason`, preserves source refs and related refs, adds
`discard_is_not_deletion` when missing, and recomputes the snapshot. It never
deletes the record.

## 10. Supersede Semantics

Supersede preserves lineage. The supersede helper keeps the old record,
updates it to `lifecycle_state: superseded`, sets `review_decision: supersede`,
links it to the superseding record, validates the superseding record, keeps or
adds reciprocal lineage, and recomputes the snapshot.

`related_record_refs` must point to records in the same store snapshot.
`supersedes_record_ref` must point to a record in the same store snapshot.
Self-referential lineage refs are rejected. Supersede preserves lineage by
keeping both old and new records in the snapshot.

## 11. File Read/Write Boundaries

The file helpers read and write JSON only at caller-provided file paths. They
do not choose a default private path and do not scan directories. Write validates
the snapshot before writing deterministic pretty JSON with a trailing newline.

The helper uses Node built-ins only. It does not open a DB, call network,
execute providers, fetch sources, run retrieval/RAG, call GitHub, run Codex, or
export Git Ledger packets.

## 12. Authority Boundary

The store authority boundary keeps the slice local-store-only:

- `local_store_only` remains true.
- `explicit_file_write_only` remains true.
- `runtime_route_added_now` remains false.
- `ui_added_now` remains false.
- `db_migration_added_now` remains false.
- `db_query_or_write_now` remains false.
- `provider_openai_call_now` remains false.
- `source_fetch_now` remains false.
- `retrieval_rag_execution_now` remains false.
- `source_of_truth` remains false.
- `proof_or_evidence_record` remains false.
- `perspective_promotion` remains false.
- `durable_perspective_state` remains false.
- `work_mutation` remains false.
- `codex_execution_authority` remains false.
- `github_automation_authority` remains false.
- `git_ledger_export_authority` remains false.
- `product_write_authority` remains false.
- `product_id_allocation_authority` remains false.

Product-write remains parked by #686.

## 13. Deferred Work

Deferred work:

- Research Candidate Review Memory routes
- Research Candidate Review Memory UI
- Foundation/Lifecycle/Memory read-only UI
- Source intake runtime
- Provider extraction runtime
- Retrieval/RAG runtime
- Dogfooding ingestion route
- Codex result report ingestion
- Feedback aggregation runtime
- Feedback controls expansion
- Human-reviewed promotion
- Formation Receipt durable write
- Durable Perspective state apply
- Git Ledger export
- Product write reentry

## 14. Verification Expectations

Expected verification:

- `node --check scripts/smoke-research-candidate-review-memory-store-v0-1.mjs`
- `npm run smoke:research-candidate-review-memory-store-v0-1`
- `npm run smoke:research-candidate-review-memory-contract-v0-1`
- Existing downstream Phase 1 smokes requested by the PR handoff.
- `npm run typecheck`
- `git diff --check`
- `git diff --cached --check`

Smoke pass is validation signal, not truth, proof/evidence, persistence,
promotion, or product-write authority.

## 15. Next Recommended Slices

Next recommended slices:

1. `research_candidate_review_memory_routes_v0_1`
2. `research_candidate_review_memory_ui_v0_1`
3. `foundation_lifecycle_review_memory_readonly_ui_v0_1`
4. `bounded_source_intake_runtime_contract_v0_1`
5. `bounded_source_intake_runtime_v0_1`

Do not implement those next slices in this PR.
