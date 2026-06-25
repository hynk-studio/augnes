# Provider-Assisted Extraction Candidate-Only Contract v0.1

## 1. Purpose

Provider-Assisted Extraction Candidate-Only Contract is candidate-contract-only.
It defines public-safe shapes for future provider-assisted extraction requests,
prompt descriptors, bounded source inputs, candidate outputs, privacy/redaction
reports, validation expectations, and authority boundaries.

It does not implement provider-assisted extraction runtime.
It does not call provider/OpenAI.
It does not send prompts.
It does not store provider outputs.
It does not fetch sources.
It does not read local files.
It does not read repository files.
It does not read uploaded files.
It does not execute retrieval/RAG.
It does not query or write DB.
It does not add routes.
It does not add UI.
It does not create proof/evidence.
It does not write claim/evidence records.
It does not promote Perspective.
It does not mutate durable Perspective state.
It does not mutate work.
It does not execute Codex.
It does not call GitHub.
It does not export Git Ledger packets.
It does not write product records.
Product-write remains parked by #686.

Candidate output is not truth.
Candidate output is not proof/evidence.
accepted_for_future_provider_run is not provider execution.
accepted_for_future_runtime is not runtime execution.
bounded prompt summary is not prompt execution.
Source refs are lineage pointers, not proof.
Source refs must be public-safe symbolic refs.
Bounded summary refs are lineage metadata, not proof.
Raw provider outputs must not be stored.

## 2. Relationship To The Integrated Roadmap Guide v0.2

It implements the provider-assisted extraction preparation slice from the integrated development roadmap guide v0.2.
The primary planning basis is
`AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_GUIDE_V0_2_2026-06-25.md`.

Older proposal documents are background inputs already integrated into the roadmap guide, not standalone ordering authority.

## 3. Relationship To #774 Bounded Source Intake Contract And #775 Bounded Source Intake Runtime

It follows #774 and #775.

#774 defines the Bounded Source Intake Runtime Contract, including request,
source descriptor, result envelope, public-safe source refs, privacy/redaction,
and authority boundary vocabulary. #775 adds a deterministic bounded source
intake runtime that produces caller-provided-input-only result envelopes and
runtime reports.

This contract defines the next candidate-only boundary for future
provider-assisted extraction over those bounded source intake outputs. It does
not widen #774 or #775 into provider calls, prompt execution, provider output
storage, retrieval, proof/evidence, Perspective promotion, durable state, or
product write.

## 4. Scope And Non-Goals

This slice adds:

- `types/provider-assisted-extraction-candidate-only-contract.ts`
- `fixtures/provider-assisted-extraction-candidate-only-contract.sample.v0.1.json`
- `scripts/smoke-provider-assisted-extraction-candidate-only-contract-v0-1.mjs`
- this documentation pointer
- package and index pointers

It does not add provider-assisted extraction runtime implementation, provider
calls, prompt sending, provider output storage, runtime routes, UI, DB
migrations, DB reads, DB writes, external URL fetch, local file reads,
repository file reads, uploaded file reads, retrieval/RAG execution,
embeddings, vector search, proof/evidence writes, claim/evidence writes,
Perspective promotion, durable Perspective state writes, work mutation,
Codex/GitHub automation, Git Ledger export, product write, product ID
allocation, package dependencies, GitHub Actions, CI runtime changes,
background jobs, raw source storage, raw provider output storage, raw
conversation storage, hidden reasoning storage, private URL persistence, or
local private path persistence.

## 5. Contract Shape

The type contract defines:

- `ProviderAssistedExtractionInputRef`
- `ProviderAssistedExtractionPromptDescriptor`
- `ProviderAssistedExtractionCandidateRequest`
- `ProviderAssistedExtractionCandidateOutput`
- `ProviderAssistedExtractionContractBundle`
- `ProviderAssistedExtractionValidationResult`
- authority, input-kind, target-kind, extraction-mode, status, privacy, redaction, confidence, and reason-code vocabularies

The fixture contains a deterministic public-safe bundle covering supported,
blocked, rejected, private-ref-only, and unknown provider-assisted extraction
candidate cases.

## 6. Input Refs And Bounded Summary Lineage

Input refs may point to bounded source intake result envelopes, bounded source
intake runtime reports, bounded summary refs, source refs, review memory refs,
manual bounded context, or unknown input kinds.

Input refs are lineage metadata only. They do not fetch sources, read files,
retrieve context, create claims, create evidence, or grant provider execution.
Source refs must be public-safe symbolic refs.
Bounded summary refs are lineage metadata, not proof.

Unknown input kinds and missing bounded source lineage remain blocked or
operator-review candidates until a future runtime defines explicit behavior.

## 7. Prompt Descriptor Rules

Prompt descriptors are bounded summaries of future prompt intent. They are not
provider prompts and are not sent to any provider.

bounded prompt summary is not prompt execution.
Every prompt descriptor must state the future mode, allowed input refs,
forbidden input classes, redaction status, public-safe flag, reason codes, and
authority boundary. Prompt descriptors must include `prompt_not_sent`,
`provider_call_not_executed`, and `provider_output_not_stored` reason codes.

## 8. Request Status Semantics

Request status values are:

- `candidate_only`: shaped for future review, not provider execution.
- `needs_operator_review`: review is required before any future runtime.
- `blocked_private_or_raw_payload`: private or raw material blocks future provider use.
- `blocked_missing_bounded_source`: missing bounded source lineage blocks future provider use.
- `blocked_unsupported_target`: unsupported target kinds are blocked.
- `accepted_for_future_provider_run`: accepted_for_future_provider_run is not provider execution.
- `rejected`: not eligible for future provider runtime without new review.

## 9. Candidate Output Rules

Candidate outputs define future output shapes for claim candidates, evidence
candidates, source summary candidates, knowledge gap signals, contradiction
signals, calibration signals, logical shape hints, handoff hints, and unknown
target placeholders.

Candidate output is not truth.
Candidate output is not proof/evidence.
accepted_for_future_runtime is not runtime execution.

Every candidate output must explicitly keep provider output inclusion, prompt
sending, provider call execution, claim/evidence writing, proof/evidence
creation, Perspective promotion, and product write execution false.

## 10. Privacy And Redaction Rules

Privacy classes distinguish public-safe bounded inputs, private-ref-only
inputs, blocked raw private payloads, and blocked secret-like payloads.
Redaction statuses distinguish not-needed, redacted, secret-like blocked,
raw-payload blocked, and private-location blocked cases.

Raw provider outputs must not be stored.
Raw source bodies, raw provider outputs, raw conversations, hidden reasoning,
private URLs, local private paths, token-like strings, secret-like strings, raw
DB rows, and browser dumps are outside this contract.

## 11. Provider Boundary

This contract does not call provider/OpenAI.
This contract does not send prompts.
This contract does not store provider outputs.

Future provider-assisted extraction may only be considered after a separate
runtime slice defines explicit execution rules, prompt handling, provider
output redaction, review status transitions, and verification boundaries.

## 12. Authority Boundary

The authority boundary keeps:

- `candidate_contract_only` true.
- `provider_call_now` false.
- `prompt_sent_now` false.
- `provider_output_stored_now` false.
- `source_fetch_now` false.
- `local_file_read_now` false.
- `repository_file_read_now` false.
- `uploaded_file_read_now` false.
- `raw_source_body_storage_now` false.
- `retrieval_rag_execution_now` false.
- `db_query_or_write_now` false.
- `source_of_truth` false.
- `proof_or_evidence_record` false.
- `claim_or_evidence_write_now` false.
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

- Provider-Assisted Extraction runtime
- Retrieval/RAG runtime contract
- Retrieval/RAG runtime
- Dogfooding ingestion route contract
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

- `node --check scripts/smoke-provider-assisted-extraction-candidate-only-contract-v0-1.mjs`
- `npm run smoke:provider-assisted-extraction-candidate-only-contract-v0-1`
- downstream bounded source intake, review memory, and roadmap smokes requested by the slice handoff
- `npm run typecheck`
- `git diff --check`
- `git diff --cached --check`

## 15. Next Recommended Slices

Next recommended slices:

1. `provider_assisted_extraction_runtime_v0_1`
2. `retrieval_rag_runtime_contract_v0_1`
3. `retrieval_rag_runtime_v0_1`
4. `dogfooding_ingestion_route_contract_v0_1`
5. `dogfooding_ingestion_route_v0_1`

Do not implement those next slices in this PR.
