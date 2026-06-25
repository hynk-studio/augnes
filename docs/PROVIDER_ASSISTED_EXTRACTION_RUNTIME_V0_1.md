# Provider-Assisted Extraction Runtime v0.1

## 1. Purpose

Provider-Assisted Extraction Runtime is bounded-runtime-only. It is a
deterministic local helper that validates #776 candidate requests and shapes
candidate outputs from caller-provided public-safe candidate previews.

It processes caller-provided candidate previews and bounded inputs only.
Candidate output is not truth.
Candidate output is not proof/evidence.
accepted_for_future_provider_run is not provider execution.
accepted_for_future_runtime is not runtime execution.
bounded prompt summary is not prompt execution.
prompt descriptor is not prompt text.
candidate preview is caller-provided bounded input, not provider output.
Source refs are lineage pointers, not proof.
Source refs must be public-safe symbolic refs.
Bounded summary refs are lineage metadata, not proof.
Raw provider outputs must not be stored.
Product-write remains parked by #686.

## 2. Relationship To The Integrated Roadmap Guide v0.2

It implements the runtime follow-up to #776 from the integrated development roadmap guide v0.2.
The primary planning basis is
`AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_GUIDE_V0_2_2026-06-25.md`.

Older proposal documents are background inputs already integrated into the roadmap guide, not standalone ordering authority.

## 3. Relationship To #776 Provider-Assisted Extraction Candidate-Only Contract

This runtime follows #776 Provider-Assisted Extraction Candidate-Only Contract
v0.1. It reuses the #776 request, prompt descriptor, candidate output,
input-ref, source-ref, bounded-summary-ref, privacy/redaction, review status,
and authority-boundary shapes.

The helper adds deterministic validation, decisioning, candidate-output shaping,
counts, and report fingerprinting only. It does not widen #776 into provider
calls, prompt sending, provider output storage, source fetching, file reads,
retrieval, proof/evidence creation, claim/evidence writes, Perspective
promotion, durable state, work mutation, GitHub automation, Git Ledger export,
or product write.

## 4. Scope And Non-Goals

This slice adds:

- `lib/research-candidate-review/provider-assisted-extraction-runtime.ts`
- runtime type additions in `types/provider-assisted-extraction-candidate-only-contract.ts`
- `fixtures/provider-assisted-extraction-runtime.sample.v0.1.json`
- `scripts/smoke-provider-assisted-extraction-runtime-v0-1.mjs`
- this documentation pointer
- package and index pointers

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

## 5. Runtime Input Shape

The runtime input is `ProviderAssistedExtractionRuntimeInput`:

- `runtime_version`: `provider_assisted_extraction_runtime.v0.1`
- `contract_version`: `provider_assisted_extraction_candidate_only_contract.v0.1`
- `scope`: `project:augnes`
- `as_of`: caller-provided timestamp
- `source_fixture_refs`: public-safe symbolic fixture refs
- `requests`: #776 `ProviderAssistedExtractionCandidateRequest` objects
- `candidate_previews`: optional public-safe caller-provided candidate previews

The caller passes all candidate request and preview data. The helper does not
look up, retrieve, open, fetch, send, or persist source or provider material.

## 6. Candidate Preview Rules

Candidate previews are caller-provided bounded inputs. A preview must identify
the matching request, output kind, bounded output summary, public-safe flag,
and optional candidate ref, source refs, bounded summary refs, confidence
preview, and review status.

Candidate previews must match the request target_kinds.
Candidate preview output_kind unknown is rejected.
candidate preview is caller-provided bounded input, not provider output.
Preview summaries, refs, and review metadata must be public-safe. Unsafe
private paths, private URLs, token-like strings, provider responses, raw
conversation text, hidden reasoning, raw DB rows, browser dumps, raw source
bodies, prompt text, and provider transcript material are rejected.

## 7. Runtime Decision Rules

The helper applies deterministic ordered decisions:

1. `rejected` request status stays `rejected`.
2. Secret-like blocked input becomes `blocked_secret_like_payload`.
3. Raw/private blocked input becomes `blocked_private_or_raw_payload`.
4. `blocked_private_or_raw_payload` request status stays blocked.
5. `blocked_missing_bounded_source` request status stays blocked.
6. `blocked_unsupported_target` request status stays blocked.
7. Unknown target kinds become `blocked_unsupported_target`.
8. Missing bounded source lineage becomes `blocked_missing_bounded_source`.
9. `needs_operator_review` request status stays `needs_operator_review`.
10. Public-safe candidate preview creates `candidate_output_created`.
11. `accepted_for_future_provider_run` without preview becomes `candidate_only`.
12. Everything else becomes `candidate_only`.

blocked_private_location redaction blocks candidate output creation.
Preview output kinds that are not requested by the matching request are not
eligible for candidate output creation.
accepted_for_future_provider_run is not provider execution.
candidate_only is not runtime execution approval.

## 8. Candidate Output Generation Rules

When the decision is `candidate_output_created`, the helper creates one #776
`ProviderAssistedExtractionCandidateOutput` from the caller-provided preview.
The output id is deterministic and based on request id, output kind, and a
stable hash prefix. Source refs and bounded summary refs are merged from safe
request input refs and safe preview refs.

Every candidate output keeps:

- `provider_output_included` false.
- `prompt_sent` false.
- `provider_call_executed` false.
- `claim_or_evidence_written` false.
- `proof_or_evidence_created` false.
- `perspective_promoted` false.
- `product_write_executed` false.

Candidate output is not truth.
Candidate output is not proof/evidence.
Runtime decisions preserve output lineage through output_refs.
Every output_ref must resolve to an output for the same request.

## 9. Validation Rules

The helper validates runtime version, contract version, scope, timestamp shape,
duplicate request ids, #776 request vocabularies, prompt descriptors, input
refs, reason codes, candidate previews, public-safe refs, public-safe text, and
authority boundaries.

The report validator rejects duplicate decisions, duplicate output ids,
duplicate candidate refs, candidate outputs for blocked/rejected decisions,
candidate outputs outside the matching decision target kinds, dangling decision
output refs, cross-request decision output refs,
candidate outputs with execution/write flags set true, count mismatches,
fingerprint mismatches, unsafe text, and authority boundaries that grant
provider, prompt, source, retrieval, DB, proof, claim/evidence, promotion,
GitHub, Git Ledger, product-write, or product-ID authority.

## 10. Provider Boundary

It does not call provider/OpenAI.
It does not send prompts.
It does not store provider outputs.
bounded prompt summary is not prompt execution.
prompt descriptor is not prompt text.
Raw provider outputs must not be stored.

Future provider integration requires a separate runtime slice with explicit
prompt sending, provider output redaction, provider output storage policy,
review controls, and verification boundaries.

## 11. Privacy And Redaction Rules

The runtime blocks or rejects raw/private/provider-like material before
candidate-output shaping. Private URLs and local private paths are not accepted.
Secret-like strings are not accepted. Raw source bodies, provider responses,
raw conversations, hidden reasoning, raw DB rows, browser dumps, and provider
transcripts are not accepted.

blocked_private_location redaction blocks candidate output creation.

Source refs are lineage pointers, not proof.
Source refs must be public-safe symbolic refs.
Bounded summary refs are lineage metadata, not proof.

## 12. Authority Boundary

The runtime authority boundary keeps:

- `bounded_runtime_only` true.
- `caller_provided_input_only` true.
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

- Actual provider/OpenAI call integration
- Prompt sending
- Provider output storage
- Provider output redaction pipeline
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

- `node --check scripts/smoke-provider-assisted-extraction-runtime-v0-1.mjs`
- `npm run smoke:provider-assisted-extraction-runtime-v0-1`
- `npm run smoke:provider-assisted-extraction-candidate-only-contract-v0-1`
- downstream source-intake, review-memory, and roadmap smokes requested by the slice handoff
- `npm run typecheck`
- `git diff --check`
- `git diff --cached --check`

## 15. Next Recommended Slices

Next recommended slices:

1. `retrieval_rag_runtime_contract_v0_1`
2. `retrieval_rag_runtime_v0_1`
3. `dogfooding_ingestion_route_contract_v0_1`
4. `dogfooding_ingestion_route_v0_1`
5. `provider_output_redaction_contract_v0_1`

Do not implement those next slices in this PR.
