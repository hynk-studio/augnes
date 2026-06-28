# Bounded Source Intake Runtime Completion v0.1

## Purpose

This slice implements `bounded_source_intake_runtime_completion_v0_1`.
It closes the original Phase 3.2 bounded source intake runtime gap by adding
bounded runtime behavior for explicit user-provided source inputs.
This slice closes the original Phase 3.2 bounded source intake runtime gap.

The earlier deterministic envelope helper remains compatible but was not the
full runtime completion. That helper accepted caller-provided descriptors and
bounded summaries only. This slice adds the missing runtime route, source
locator sanitization, bounded fetch abstraction, strict size/type/timeout
limits, source ref metadata output, and failure-to-gap metadata.
The earlier deterministic envelope helper remains compatible but was not the full runtime completion.

## Relationship To The Roadmap

`docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md` Phase 3.2 calls
for:

- explicit POST only
- user-provided URL/DOI/file/note only
- max size enforcement
- timeout enforcement
- content-type allowlist
- redacted `source_ref_id` generation
- no automatic follow-up crawling
- no provider extraction by default
- no retrieval indexing by default

This document is repo-local implementation documentation. The roadmap guide is
not SSOT.
The roadmap guide is not SSOT.

## Relationship To The Contract

`docs/BOUNDED_SOURCE_INTAKE_RUNTIME_CONTRACT_V0_1.md` defined the
public-safe source intake vocabulary and authority boundary. This completion
keeps the same privacy posture: source refs are lineage pointers, not proof;
bounded source summary is not truth; failed fetch creates gap metadata, not
hallucinated summary.

## Relationship To The Earlier Bounded-runtime-only Implementation

`docs/BOUNDED_SOURCE_INTAKE_RUNTIME_V0_1.md` and
`lib/research-candidate-review/bounded-source-intake-runtime.ts` remain as the
compatibility helper for deterministic caller-provided descriptor envelopes.
They still do not fetch, expose a route, or process user source locators.

This completion adds:

- `lib/research-source/sanitize-source-ref.ts`
- `lib/research-source/fetch-bounded-source.ts`
- `lib/research-source/intake-runtime.ts`
- `app/api/research-source/intake/route.ts`

## Runtime Request Shape

The runtime request is a JSON object under route body `input`:

- `request_version`
- `runtime_version`
- `scope`
- `source_intake_request_id`
- `requested_by`
- `requested_at`
- `input_kind`
- `user_provided: true`
- `source_locator`
- `source_label`
- `fetch_policy`
- `size_limit_bytes`
- `timeout_ms`
- `content_type_allowlist`
- `raw_body_storage_policy: "non_persistent"`
- `redaction_policy`
- `failure_to_gap_policy`
- `authority_boundary`
- `reason_codes`

## Input Kind Policy

Allowed `input_kind` values:

- `url`
- `doi`
- `file_ref`
- `note_ref`
- `manual_text_summary`

This slice accepts only `user_provided` sources. `user_provided=false` is
blocked.

## URL/DOI Bounded Fetch Policy

URL/DOI intake may use the bounded fetch abstraction. The smoke uses a
deterministic mock fetcher only and requires no live network. Live fetch remains
behind explicit caller options and is not required for validation.

The fetch abstraction enforces:

- content-type allowlist
- byte size limit
- timeout limit
- bounded result metadata only

This slice does not crawl. This slice does not perform background fetch. This
slice does not perform automatic web discovery.

## File/Note Ref Symbolic-only Policy

`file_ref` intake does not read arbitrary local files in this PR. It accepts
public-safe symbolic file refs only and returns source ref metadata or
candidate-only review metadata.

`note_ref` intake accepts public-safe symbolic note refs only. It does not
accept raw private note text.

## Manual Text Summary Policy

`manual_text_summary` may accept a small bounded public-safe summary supplied by
the operator. It rejects raw/private markers, secret-like strings, provider
IDs, private URLs, local paths, raw source bodies, raw provider outputs, raw
retrieval outputs, raw DB rows, raw conversations, hidden reasoning, telemetry
dumps, real GitHub payloads, real PR payloads, and raw diffs.

## Fetch Limits

The default size limit is bounded, and callers may only request limits up to
the hard maximum. The current hard maximum is 65,536 bytes.

## Content-type Allowlist

Allowed content types are:

- `text/plain`
- `text/html`
- `application/json`

Unsupported content types return `unsupported_content_type`.

## Timeout Policy

Timeouts return `timeout`. A timeout creates bounded failure metadata only.
It does not create a hallucinated summary.

## Source Ref ID Policy

`source_ref_id` is deterministic from the public-safe input kind and sanitized
source locator fingerprint. Display values use redacted locator refs rather
than raw private paths or private URLs.

## Failure-to-gap Policy

Fetch failures produce `gap_candidate_ref` metadata. The gap metadata says a
source was unavailable or blocked for bounded intake. It is not a fact, not
truth, not proof, and not accepted evidence.

## Privacy And Redaction Policy

Raw source body is non-persistent by default. Route responses include bounded
summary and metadata only. They do not echo full raw bodies or unsafe raw
values. Source locator display values are redacted/fingerprinted.
Source refs are lineage pointers, not proof.
Bounded source summary is not truth.
Failed fetch creates gap metadata, not hallucinated summary.

## Route Policy

`app/api/research-source/intake/route.ts` exposes explicit same-origin POST
runtime only.

The route:

- requires same-origin requests
- requires JSON object bodies
- requires `route_version`, `scope`, and `input`
- calls `runBoundedSourceIntakeRuntimeV01`
- returns bounded JSON envelopes
- maps unsupported content type to 415
- maps content too large to 413
- maps timeout to 504
- maps forbidden authority to 403

This slice implements explicit POST runtime only.

## Authority Boundary

Allowed true fields:

- `bounded_source_intake_runtime_now`
- `explicit_user_provided_source_only`
- `same_origin_post_route_now`
- `bounded_fetch_abstraction_now`
- `source_ref_metadata_now`
- `raw_body_non_persistent_by_default`
- `failure_to_gap_candidate_metadata_now`

Forbidden false fields:

- `automatic_crawling_now`
- `background_fetch_now`
- `automatic_web_discovery_now`
- `provider_extraction_now`
- `retrieval_index_write_now`
- `proof_or_evidence_record_now`
- `claim_or_evidence_write_now`
- `promotion_execution_now`
- `durable_state_write_now`
- `durable_state_apply_now`
- `formation_receipt_write_now`
- `product_write_now`
- `product_write_runtime_now`
- `product_write_adapter_enabled_now`
- `product_id_allocation_now`
- `product_persistence_now`
- `git_ledger_export_runtime_now`
- `git_write_now`
- `github_api_call_now`
- `repository_file_write_now`
- `codex_execution_now`
- `codex_execution_authority`
- `github_automation_authority`
- `product_write_authority`
- `raw_source_body_persisted_now`
- `raw_private_payload_persisted_now`
- `raw_provider_output_stored_now`
- `raw_retrieval_output_stored_now`
- `source_ref_is_proof`
- `source_summary_is_truth`
- `failure_gap_is_fact`
- `smoke_pass_is_truth`
- `ci_pass_is_truth`

This slice does not perform provider extraction. This slice does not write
retrieval indexes. This slice does not create proof/evidence. This slice does
not write claim/evidence records. This slice does not promote Perspective. This
slice does not write/apply durable Perspective state. This slice does not write
Formation Receipts. This slice does not execute Git Ledger export runtime. This
slice does not execute Git or call GitHub. This slice does not execute Codex.
This slice does not product-write. This slice does not allocate product IDs.
Product-write remains parked by #686.

This slice does not crawl. This slice does not perform background fetch. This slice does not perform automatic web discovery. This slice does not perform provider extraction. This slice does not write retrieval indexes. This slice does not create proof/evidence. This slice does not write claim/evidence records. This slice does not promote Perspective. This slice does not write/apply durable Perspective state. This slice does not write Formation Receipts. This slice does not execute Git Ledger export runtime. This slice does not execute Git or call GitHub. This slice does not execute Codex. This slice does not product-write. This slice does not allocate product IDs.

## Fixture Policy

`fixtures/bounded-source-intake-runtime-completion.sample.v0.1.json` uses
public-safe symbolic refs only. Safe markers appear only inside blocked
examples.

## Verification Expectations

Expected validation:

- `node --check scripts/smoke-bounded-source-intake-runtime-completion-v0-1.mjs`
- `npm run smoke:bounded-source-intake-runtime-completion-v0-1`
- `npm run smoke:bounded-source-intake-runtime-v0-1`
- `npm run smoke:bounded-source-intake-runtime-contract-v0-1`
- downstream review memory DB UI/routes/store smokes
- authority boundary and privacy redaction smokes
- `npm run typecheck`
- `git diff --check`
- `git diff --cached --check`

Smoke/CI pass is not truth.

## Deferred Work

Deferred work includes UI binding, provider-assisted extraction runtime,
retrieval/RAG runtime, durable evidence/proof decisions, promotion, Formation
Receipt writes, durable Perspective state apply, Git Ledger export runtime,
product-write, and product ID allocation.
