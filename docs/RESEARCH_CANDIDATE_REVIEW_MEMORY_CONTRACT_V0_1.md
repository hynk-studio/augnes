# Research Candidate Review Memory Contract v0.1

Slice name: `research_candidate_review_memory_contract_v0_1`

## 1. Purpose

Research Candidate Review Memory Contract is contract-only. It defines a
deterministic, public-safe record shape for future local review memory of
research candidates.

The contract captures operator-reviewed metadata, bounded summaries, symbolic
candidate refs, source refs, lineage refs, privacy reports, discard semantics,
supersede semantics, and authority boundaries. It defines what may be stored
later and what must never be stored.

Review memory is not truth. Candidate memory is not Perspective state.

## 2. Relationship To The Integrated Roadmap Guide v0.2

It begins Phase 2 from the integrated development roadmap guide v0.2. The
primary planning basis is
`AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_GUIDE_V0_2_2026-06-25.md`.

Older remaining-development, Research/ROI, Temporal Perspective Overlay, and
Git Ledger proposal documents are background inputs already integrated into the
roadmap guide, not standalone ordering authority.
Those older proposal documents are background inputs already integrated into the roadmap guide.

## 3. Relationship To #762-#768 Phase 1 Derived Preview/Read-Model Slices

This contract connects the Phase 1 derived artifacts:

- #762 Research Candidate Lifecycle Read Model v0.1.
- #763 Research Candidate Calibration Diagnostic v0.1.
- #764 Logical Claim Shape Preview v0.1.
- #765 Feedback-to-Rule Candidate Contract v0.1.
- #766 Feedback-to-Rule Candidate Builder v0.1.
- #767 Temporal Handoff Diagnostic Sections v0.1.
- #768 Target-Agent AI Context Packet Profiles v0.1.

Those artifacts remain derived review context. The memory contract may preserve
bounded summaries and refs to them in future local review memory, but it does
not convert any derived artifact into truth, proof, promotion, product state, or
durable Perspective state.

## 4. Scope And Non-Goals

In scope:

- Type contract for future Research Candidate Review Memory records and
  bundles.
- Public-safe sample fixture.
- Static smoke validation for controlled vocabulary, fixture coverage, privacy
  boundaries, authority boundaries, docs, package script, and index pointer.
- Documentation and index pointer.

Non-goals:

- No review memory store implementation.
- No runtime memory storage.
- No DB migration.
- No runtime route.
- No UI.
- No background job.
- No raw source storage.
- No raw provider output storage.
- No raw conversation storage.
- No hidden reasoning storage.
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

It does not implement runtime memory storage. It does not query or write DB. It
does not create routes. It does not create UI. It does not call
provider/OpenAI. It does not fetch sources. It does not execute retrieval/RAG.
It does not create proof/evidence. It does not promote Perspective. It does not
mutate durable Perspective state. It does not mutate work. It does not execute
Codex. It does not call GitHub. It does not export Git Ledger packets. It does
not write product records.

Product-write remains parked by #686.

Required boundary phrases:

- It does not implement runtime memory storage.
- It does not query or write DB.
- It does not create routes.
- It does not create UI.
- It does not call provider/OpenAI.
- It does not fetch sources.
- It does not execute retrieval/RAG.
- It does not create proof/evidence.
- It does not promote Perspective.
- It does not mutate durable Perspective state.
- It does not mutate work.
- It does not execute Codex.
- It does not call GitHub.
- It does not export Git Ledger packets.
- It does not write product records.

## 5. Contract Shape

The fixture contract includes:

- `fixture_version`
- `contract_version`
- `record_version`
- `bundle_version`
- `scope`
- `status`
- `as_of`
- `source_fixture_refs`
- `expected_bundle`

The expected bundle includes:

- `bundle_version`
- `contract_version`
- `scope`
- `status`
- `as_of`
- `source_fixture_refs`
- `records`
- `record_kind_counts`
- `lifecycle_state_counts`
- `review_decision_counts`
- `privacy_class_counts`
- `boundary_notes`
- `authority_boundary`
- `bundle_fingerprint`

The bundle fingerprint is deterministic SHA-256 over canonical JSON for the
expected bundle without `bundle_fingerprint`.

## 6. Record Kinds

Controlled record kinds are:

- `candidate_review_snapshot`
- `operator_review_note`
- `discard_record`
- `feedback_summary`
- `handoff_summary`
- `diagnostic_summary`
- `profile_summary`

Record kind describes review-memory shape only. It is not a persistence action,
promotion action, product write, or proof/evidence action.

## 7. Lifecycle States

Controlled lifecycle states are:

- `draft`
- `active`
- `discarded`
- `superseded`
- `archived`

The lifecycle state is review-memory metadata. It does not mutate candidate
work, durable Perspective state, or product records.

## 8. Review Decision Semantics

Controlled review decisions are:

- `none`
- `keep_for_review`
- `discard`
- `supersede`
- `needs_more_evidence`
- `needs_operator_review`

Review decisions are operator-review metadata for future memory records. They
do not establish truth, do not create proof/evidence, and do not promote
Perspective.

## 9. Source Refs And Lineage

Source refs are lineage pointers, not proof. Source refs point to public-safe
symbols from Phase 1 derived artifacts, operator notes, or manual source refs.
The `source_ref` strings themselves must be public-safe symbolic refs.
`sourceRef.public_safe` false does not allow raw private values inside
`source_ref`; it only says the referenced upstream material is not public-safe.
`private_ref_only` may preserve a symbolic ref and privacy report, but not the
private content body or private URL/path/token itself.

Controlled source surfaces are:

- `research_candidate_lifecycle_read_model`
- `research_candidate_calibration_diagnostic`
- `logical_claim_shape_preview`
- `feedback_to_rule_candidate`
- `temporal_handoff_diagnostic_sections`
- `target_agent_ai_context_packet_profiles`
- `operator_note`
- `manual_source_ref`
- `unknown`

Source refs must not contain private URLs, local private paths, tokens,
secrets, provider thread/run/session IDs, raw DB rows, browser dumps, hidden
reasoning, raw source bodies, raw candidate payloads, or raw provider outputs.

## 10. Privacy And Blocked Raw Payload Rules

Controlled privacy classes are:

- `public_safe`
- `private_ref_only`
- `blocked_raw_private_payload`

Blocked raw payloads must not be stored. A blocked payload can only be
represented by privacy metadata, blocked reason codes, and a bounded public-safe
summary. The contract must not include raw conversation, hidden reasoning, raw
source body, raw candidate payload, raw provider output, provider thread or run
session IDs, private URLs, local private paths, secrets, raw DB rows, or raw
browser dumps.

`private_ref_only` means the future record may carry a symbolic ref and a
privacy report, but it still must not store the referenced content body.

## 11. Discard And Supersede Semantics

Discard is not deletion. A discard record preserves review lineage and the
reason review stopped. It does not delete upstream candidate data, does not
reject truth, and does not mutate product state.

Supersede preserves lineage. A superseded record must retain a
`supersedes_record_ref` when it replaces an earlier review memory record. It
does not rewrite history and does not create a durable Perspective state write.

## 12. Authority Boundary

The contract authority boundary keeps the slice contract-only:

- `contract_only` remains true.
- `runtime_memory_write_now` remains false.
- `db_query_or_write_now` remains false.
- `source_of_truth` remains false.
- `proof_or_evidence_record` remains false.
- `perspective_promotion` remains false.
- `durable_perspective_state` remains false.
- `work_mutation` remains false.
- `codex_execution_authority` remains false.
- `github_automation_authority` remains false.
- `provider_openai_authority` remains false.
- `source_fetch_authority` remains false.
- `retrieval_rag_authority` remains false.
- `git_ledger_export_authority` remains false.
- `product_write_authority` remains false.
- `product_id_allocation_authority` remains false.

Product-write remains parked by #686.

## 13. Deferred Work

Deferred work:

- Research Candidate Review Memory store
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

- `node --check scripts/smoke-research-candidate-review-memory-contract-v0-1.mjs`
- `npm run smoke:research-candidate-review-memory-contract-v0-1`
- Existing downstream Phase 1 smokes requested by the PR handoff.
- `npm run typecheck`
- `git diff --check`
- `git diff --cached --check`

Smoke pass is validation signal, not truth, proof/evidence, persistence, or
promotion.

## 15. Next Recommended Slices

Next recommended slices:

1. `research_candidate_review_memory_store_v0_1`
2. `research_candidate_review_memory_routes_v0_1`
3. `research_candidate_review_memory_ui_v0_1`
4. `foundation_lifecycle_review_memory_readonly_ui_v0_1`
5. `bounded_source_intake_runtime_contract_v0_1`

Do not implement those next slices in this PR.
