# Bounded Source Intake Runtime v0.1

## 1. Purpose

Bounded Source Intake Runtime is bounded-runtime-only. It adds a deterministic
local helper that validates caller-provided #774 source intake requests and
bounded public-safe summaries, then emits contract-shaped result envelopes and
a runtime report.

It processes caller-provided source descriptors and bounded summaries only.
accepted_bounded_summary is not truth.
accepted_bounded_summary is not proof/evidence.
accepted_bounded_summary requires bounded_summary_ref.
bounded_summary_ref is lineage metadata, not proof.
candidate_only is not runtime execution approval.
Source refs are lineage pointers, not proof.
Source refs must be public-safe symbolic refs.
Product-write remains parked by #686.

## 2. Relationship To The Integrated Roadmap Guide v0.2

It implements the runtime follow-up to the #774 contract from the integrated development roadmap guide v0.2.
The primary planning basis is
`AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_GUIDE_V0_2_2026-06-25.md`.

Older proposal documents are background inputs already integrated into the roadmap guide, not standalone ordering authority.

## 3. Relationship To #774 Bounded Source Intake Runtime Contract

This slice follows #774 Bounded Source Intake Runtime Contract v0.1. The helper
reuses the #774 request, source descriptor, result envelope, source ref,
privacy/redaction, and authority-boundary vocabulary.

The runtime adds deterministic validation and result-envelope generation only.
It does not widen the #774 contract into route, UI, source-fetch, file-read,
provider, retrieval, proof, promotion, durable state, work, GitHub, Git Ledger,
or product-write behavior.

## 4. Scope And Non-Goals

This slice adds:

- `lib/research-candidate-review/bounded-source-intake-runtime.ts`
- runtime type additions in `types/bounded-source-intake-runtime-contract.ts`
- `fixtures/bounded-source-intake-runtime.sample.v0.1.json`
- `scripts/smoke-bounded-source-intake-runtime-v0-1.mjs`
- this documentation pointer
- package and index pointers

It does not fetch sources.
It does not read local files.
It does not read repository files.
It does not read uploaded files.
It does not store raw source bodies.
It does not call provider/OpenAI.
It does not execute retrieval/RAG.
It does not query or write DB.
It does not add routes.
It does not add UI.
It does not create proof/evidence.
It does not promote Perspective.
It does not mutate durable Perspective state.
It does not mutate work.
It does not execute Codex.
It does not call GitHub.
It does not export Git Ledger packets.
It does not write product records.

## 5. Runtime Input Shape

The runtime input is `BoundedSourceIntakeRuntimeInput`:

- `runtime_version`: `bounded_source_intake_runtime.v0.1`
- `contract_version`: `bounded_source_intake_runtime_contract.v0.1`
- `scope`: `project:augnes`
- `as_of`: caller-provided timestamp
- `source_fixture_refs`: public-safe symbolic fixture refs
- `requests`: #774 `BoundedSourceIntakeRequest` objects
- `bounded_summaries`: optional public-safe summaries keyed by `request_id` or `source_id`

The caller passes all source descriptors and summaries. The helper does not
look up, retrieve, open, fetch, or persist source material.

## 6. Runtime Report Shape

The runtime report is `BoundedSourceIntakeRuntimeReport`:

- `runtime_version`: `bounded_source_intake_runtime.v0.1`
- `contract_version`: `bounded_source_intake_runtime_contract.v0.1`
- `status`: `bounded_runtime_only`
- one #774 result envelope per request
- one runtime decision per request
- decision counts
- boundary notes
- runtime authority boundary
- `runtime_report_fingerprint`

The fingerprint is a deterministic sha256 over canonical JSON with
`runtime_report_fingerprint` excluded from the hash input.

## 7. Validation Rules

The helper validates versions, scope, timestamp shape, duplicate request IDs,
request/source descriptor vocabularies, #774 reason codes, privacy/redaction
states, public-safe symbolic refs, bounded summaries, and authority boundaries.
Every bounded summary must include a public-safe `bounded_summary_ref`. Missing
bounded_summary_ref prevents accepted_bounded_summary.

It rejects unsafe raw/private patterns in descriptors, source refs, bounded
purpose text, boundary notes, and bounded summaries. The only raw-source phrase
allowed in fixture input is the exact blocked placeholder
`raw source body blocked by contract fixture` inside blocked redaction notes.

Raw source bodies must not be stored.

## 8. Decision Rules

Decision rules are deterministic and ordered:

1. Unknown source kinds become `blocked_unsupported_source_kind`.
2. Blocked secret-like privacy or redaction becomes `blocked_secret_like_payload`.
3. Blocked raw/private privacy or redaction becomes `blocked_private_or_raw_payload`.
4. Missing source locator becomes `needs_operator_review`.
5. Blocked request status stays blocked.
6. `needs_operator_review` request status stays `needs_operator_review`.
7. Public-safe bounded summary with public-safe `bounded_summary_ref` becomes `accepted_bounded_summary`.
8. Public-safe manual operator summary becomes `accepted_bounded_summary`.
9. `accepted_for_future_runtime` without a bounded summary becomes `candidate_only`.
10. Everything else becomes `candidate_only`.

accepted_bounded_summary is not truth. accepted_bounded_summary is not
proof/evidence. candidate_only is not runtime execution approval.
Manual operator summaries accepted without a separate bounded summary entry use
a deterministic `bounded-summary-ref:<request_id>` lineage ref.

## 9. Source Kind Handling

A public URL ref is not fetched by this runtime.
A repository file ref is not read by this runtime.
An uploaded file ref is not read by this runtime.

Manual text summaries may be accepted only from public-safe bounded summaries
or public-safe operator summaries. Operator notes marked blocked remain blocked.
Review memory refs remain metadata only and may be accepted only with
public-safe symbolic refs and bounded summaries. Unknown source kinds stay
blocked.

## 10. Result Envelope Rules

Each request gets one #774 result envelope. Each envelope uses
`bounded_source_intake_result_envelope.v0.1`,
`bounded_source_intake_runtime_contract.v0.1`, `project:augnes`, and
`contract_only`.

Every envelope explicitly keeps:

- `raw_source_body_included` false
- `source_fetch_executed` false
- `local_file_read_executed` false
- `provider_call_executed` false
- `retrieval_executed` false
- `proof_or_evidence_created` false
- `product_write_executed` false

`accepted_for_future_runtime` is true only when accepted_bounded_summary has bounded summary lineage.
Accepted result envelopes must carry the same bounded_summary_ref as the
matching runtime decision. Non-accepted and blocked envelopes do not carry
bounded summary refs. Source refs remain lineage pointers, not proof.

## 11. Privacy And Redaction Rules

Private URLs and local private paths are blocked or reduced to public-safe
symbolic refs before runtime acceptance. Secret-like locator placeholders are
accepted only when the descriptor is already blocked/redacted. Bounded
summaries must be explicitly public-safe and must not contain private paths,
tokens, provider output, raw conversations, hidden reasoning, raw DB rows,
browser dumps, or raw source bodies.

## 12. Authority Boundary

The runtime authority boundary keeps:

- `bounded_runtime_only` true.
- `caller_provided_input_only` true.
- `source_fetch_now` false.
- `local_file_read_now` false.
- `repository_file_read_now` false.
- `uploaded_file_read_now` false.
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

- Source intake routes
- Source intake UI
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

- `node --check scripts/smoke-bounded-source-intake-runtime-v0-1.mjs`
- `npm run smoke:bounded-source-intake-runtime-v0-1`
- `npm run smoke:bounded-source-intake-runtime-contract-v0-1`
- downstream review-memory and roadmap smokes requested by the slice handoff
- `npm run typecheck`
- `git diff --check`
- `git diff --cached --check`

## 15. Next Recommended Slices

Next recommended slices:

1. `provider_assisted_extraction_candidate_only_contract_v0_1`
2. `provider_assisted_extraction_runtime_v0_1`
3. `retrieval_rag_runtime_contract_v0_1`
4. `retrieval_rag_runtime_v0_1`
5. `dogfooding_ingestion_route_contract_v0_1`

Do not implement those next slices in this PR.
