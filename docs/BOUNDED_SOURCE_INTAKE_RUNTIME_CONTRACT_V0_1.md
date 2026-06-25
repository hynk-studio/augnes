# Bounded Source Intake Runtime Contract v0.1

## 1. Purpose

Bounded Source Intake Runtime Contract is contract-only. It defines the
public-safe request, source descriptor, result envelope, privacy/redaction,
source ref, and authority boundary shapes for a future source intake runtime.

It does not implement source intake runtime.
It does not fetch sources.
It does not read local files.
It does not store raw source bodies.
It does not call provider/OpenAI.
It does not execute retrieval/RAG.
It does not query or write DB.
It does not create proof/evidence.
It does not promote Perspective.
It does not mutate durable Perspective state.
It does not mutate work.
It does not execute Codex.
It does not call GitHub.
It does not export Git Ledger packets.
It does not write product records.
Product-write remains parked by #686.

## 2. Relationship To The Integrated Roadmap Guide v0.2

It implements the next source-intake preparation slice from the integrated development roadmap guide v0.2.
The primary planning basis is
`AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_GUIDE_V0_2_2026-06-25.md`.

Older proposal documents are background inputs already integrated into the roadmap guide, not standalone ordering authority.

## 3. Relationship To #769-#773 Review Memory And Read-only UI Slices

This contract follows the bounded review-memory and read-only UI sequence:

- #769 defines Review Memory Contract v0.1.
- #770 defines Review Memory Store v0.1.
- #771 defines Review Memory Routes v0.1.
- #772 defines Research Candidate Review Memory UI v0.1.
- #773 defines Foundation/Lifecycle/Review Memory Read-only UI v0.1.

The source intake contract treats review memory refs as lineage inputs for
future operator review only. Review memory remains review metadata only.
Source refs are lineage pointers, not proof.

## 4. Scope And Non-Goals

This slice adds:

- `types/bounded-source-intake-runtime-contract.ts`
- `fixtures/bounded-source-intake-runtime-contract.sample.v0.1.json`
- `scripts/smoke-bounded-source-intake-runtime-contract-v0-1.mjs`
- this documentation pointer
- package and index pointers

It does not add routes or UI. It does not add DB migrations, DB reads, DB
writes, package dependencies, GitHub Actions, CI runtime changes, background
jobs, source fetching, local source file reads, provider calls, retrieval/RAG,
embeddings, vector search, proof/evidence writes, Perspective promotion,
durable Perspective state writes, work mutation, Codex/GitHub automation, Git
Ledger export, product write, or product ID allocation.

## 5. Contract Shape

The type contract defines:

- `BoundedSourceIntakeSourceDescriptor`
- `BoundedSourceIntakeRequest`
- `BoundedSourceIntakeResultEnvelope`
- `BoundedSourceIntakeContractBundle`
- `BoundedSourceIntakeValidationResult`
- authority, source-kind, request-status, privacy, redaction, locator, and reason-code vocabularies

The fixture contains a deterministic public-safe bundle covering supported,
blocked, private-ref-only, and unknown source-intake candidates.

## 6. Source Kinds

The contract source kinds are:

- `manual_text_summary`
- `public_url_ref`
- `repository_file_ref`
- `uploaded_file_ref`
- `operator_note_ref`
- `review_memory_ref`
- `unknown`

A public URL ref is not fetched in this contract.
A repository file ref is not read in this contract.
An uploaded file ref is not read in this contract.

## 7. Source Descriptor Rules

Each source descriptor carries a source kind, locator kind, public-safe symbolic
source ref, optional bounded summary fields, privacy class, redaction status,
redaction notes, public-safe flag, and reason codes.

Source refs must be public-safe symbolic refs.
Private URLs and local private paths are blocked or reduced to public-safe symbolic refs.
Secret-like source locators are blocked or redacted.

## 8. Request Status Semantics

Request status values are:

- `candidate_only`: shaped for future review, not accepted as runtime execution.
- `needs_operator_review`: allowed only as a review candidate.
- `blocked_private_or_raw_payload`: raw or private material is blocked by contract.
- `blocked_unsupported_source_kind`: unsupported or unknown source kind is blocked.
- `accepted_for_future_runtime`: accepted_for_future_runtime is not runtime execution.

## 9. Privacy And Redaction Rules

Privacy classes distinguish public-safe refs, private-ref-only material, blocked
raw private payloads, and blocked secret-like payloads. Redaction statuses
distinguish not-needed, redacted, secret-like blocked, raw-payload blocked, and
private-location blocked cases.

Raw source bodies must not be stored. Raw provider output, raw conversation,
hidden reasoning, private URLs, local private paths, token-like strings,
secret-like strings, raw DB rows, and browser dumps are outside this contract.

## 10. Result Envelope Rules

Every result envelope remains `contract_only`. It may name public-safe source
refs and a bounded summary ref, but it must explicitly state that raw source
body inclusion, source fetch, local file read, provider call, retrieval,
proof/evidence creation, and product write did not execute.

## 11. Source Locator And Symbolic Ref Rules

Source locators are descriptors, not fetch instructions. Public URL locator
examples are placeholders only. Repository and uploaded-file locator examples
are refs only. Local private paths must not be persisted. Private source
locations must be blocked or reduced to symbolic refs.

## 12. Authority Boundary

The authority boundary keeps:

- `contract_only` true.
- `source_intake_runtime_now` false.
- `source_fetch_now` false.
- `local_file_read_now` false.
- `raw_source_body_storage_now` false.
- `provider_openai_call_now` false.
- `retrieval_rag_execution_now` false.
- `db_query_or_write_now` false.
- `source_of_truth` false.
- `proof_or_evidence_record` false.
- `perspective_promotion` false.
- `durable_perspective_state` false.
- `work_mutation` false.
- `codex_execution_authority` false.
- `github_automation_authority` false.
- `git_ledger_export_authority` false.
- `product_write_authority` false.
- `product_id_allocation_authority` false.

## 13. Deferred Work

Deferred work:

- Bounded Source Intake Runtime
- Provider-Assisted Extraction candidate-only contract
- Provider-Assisted Extraction runtime
- Retrieval/RAG runtime contract
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

Verification should include:

- `node --check scripts/smoke-bounded-source-intake-runtime-contract-v0-1.mjs`
- `npm run smoke:bounded-source-intake-runtime-contract-v0-1`
- downstream review-memory and roadmap smokes requested by the slice handoff
- `npm run typecheck`
- `git diff --check`
- `git diff --cached --check`

## 15. Next Recommended Slices

Next recommended slices:

1. `bounded_source_intake_runtime_v0_1`
2. `provider_assisted_extraction_candidate_only_contract_v0_1`
3. `provider_assisted_extraction_runtime_v0_1`
4. `retrieval_rag_runtime_contract_v0_1`
5. `retrieval_rag_runtime_v0_1`

Do not implement those next slices in this PR.
