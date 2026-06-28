# Provider-Assisted Extraction Runtime Completion v0.1

## Purpose

This slice implements `provider_assisted_extraction_runtime_completion_v0_1`.
This slice closes the original Phase 3.4 provider-assisted extraction runtime gap.
It follows
`docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md`.

The earlier deterministic provider runtime helper remains compatible but was
not full runtime completion. It shaped caller-provided previews without a
runtime route or provider adapter invocation boundary. This completion adds an
explicit same-origin POST route, provider adapter boundary, mock-provider
runtime smoke, configured-provider missing-key refusal, output normalization,
public-safe fixture, smoke, package script, and latest-index pointer.

Provider output is a candidate factory, not truth.

## Relationship To The Roadmap

The roadmap Phase 3.4 runtime requirements call for provider key missing
graceful refusal, explicit user action for provider calls, required
`source_ref_id`, bounded source excerpt length, raw source body
non-persistence by default, normalized candidate bundle output, warnings for
unsupported or low-grounding extraction, and no promotion/write authority.

This slice implements those requirements as runtime completion while preserving
the roadmap guide as planning context. The roadmap guide is not SSOT.

## Relationship To Provider-Assisted Extraction Candidate-Only Contract v0.1

This completion follows
`docs/PROVIDER_ASSISTED_EXTRACTION_CANDIDATE_ONLY_CONTRACT_V0_1.md`.
The contract remains the candidate-only shape and boundary vocabulary for
provider-assisted extraction. This runtime adds explicit execution mechanics
for bounded provider adapter invocation and normalized candidate bundle output.

Normalized provider output is candidate-only.
Provider output is not truth.
Provider output is not proof/evidence.
Provider confidence is not promotion readiness.

## Relationship To Earlier Provider-Assisted Extraction Runtime v0.1

`docs/PROVIDER_ASSISTED_EXTRACTION_RUNTIME_V0_1.md` and
`lib/research-candidate-review/provider-assisted-extraction-runtime.ts` remain
compatible deterministic bounded helpers. They do not call providers or expose
a route.

This slice closes the gap left by that earlier deterministic/bounded provider
runtime helper. The earlier helper remains useful for compatibility and
historical smoke lineage, but it was not the full Phase 3.4 runtime completion.

## Relationship To Bounded Source Intake Runtime Completion

This runtime consumes bounded source refs, bounded source excerpts, and bounded
source summaries. It does not fetch sources and does not read local files.
`source_ref_id` is required. A bounded source excerpt or bounded source summary
is required. Raw source body is non-persistent by default.

## Runtime Request Shape

Requests use:

- `request_version`
- `runtime_version`
- `scope: project:augnes`
- `extraction_request_id`
- `requested_by`
- `requested_at`
- `provider_mode`
- `provider_ref`
- `model_or_tool_ref`
- `source_ref_id`
- `source_locator_ref`
- `bounded_source_excerpt`
- `bounded_source_summary`
- `extraction_goal`
- `candidate_family_allowlist`
- `max_candidates`
- `max_source_excerpt_chars`
- `max_output_chars`
- `quote_limit_policy`
- `copyright_boundary`
- `no_chain_of_thought_storage: true`
- `raw_source_body_storage_policy: non_persistent`
- `raw_provider_output_storage_policy: non_persistent`
- `authority_boundary`
- `reason_codes`

Provider execution requires explicit same-origin POST operator action.
There is no GET provider execution route.
There are no hidden/background provider calls.
There is no provider call on load.

## Provider Modes

Supported modes:

- `mock_provider`
- `configured_provider`

`mock_provider` uses an injected deterministic adapter in smoke. It does not
use network and still runs normalization/redaction before returning
candidate-only output.

`configured_provider` is the real configured-provider boundary. When no safe
provider key/config adapter is available, it returns a graceful bounded refusal
with `provider_missing_key` or `provider_unavailable`. Provider key/config
missing is a graceful bounded refusal. No raw stack trace, key name, or key
value is returned.

Live provider validation is optional and skipped if no safe key/config is
available. This slice does not fake live provider validation. No safe existing
repo live provider client convention was available for this slice, so the live
provider path remains deferred behind the adapter boundary and the configured
missing-key refusal.

## Mock Provider Policy

Mock provider smoke is deterministic and requires no live provider.
The mock adapter receives only:

- `provider_ref`
- `model_or_tool_ref`
- `source_ref_id`
- `bounded_source_excerpt`
- `bounded_prompt_descriptor`
- `extraction_goal`
- `candidate_family_allowlist`
- `max_candidates`
- `max_output_chars`

The adapter does not receive a raw prompt, raw source body, raw provider
response, hidden reasoning, chain-of-thought, token logs, provider internal
thread/run/session IDs, private URLs, local paths, or secrets.

## Configured Provider / Missing-Key Policy

Configured provider execution is explicit and bounded. In this completion, the
default route has no secret-bound live adapter. A configured-provider request
without an injected safe adapter returns `provider_missing_key` with bounded
metadata.

The result is a review cue, not a provider success claim. It does not create
proof/evidence, promote Perspective, write durable state, write Formation
Receipts, write review memory automatically, product-write, or allocate product
IDs.

## Optional Live Provider Validation Policy

Live provider validation is optional and skipped when no safe local key/config
is available. Required smoke coverage uses deterministic mock provider
execution and configured-provider missing-key refusal. Required validation does
not need live provider network access.

## Source Ref And Bounded Excerpt Policy

`source_ref_id` is required.
A bounded source excerpt or bounded source summary is required.
Source excerpt length is bounded by `max_source_excerpt_chars` and a hard
maximum.
Source refs are lineage pointers, not proof.

## Prompt Descriptor Policy

The runtime builds a bounded prompt descriptor for the provider adapter. The
descriptor is not stored as a raw prompt and is not a hidden prompt log.
Raw prompt storage is forbidden.
Prompt sending without explicit operator action is forbidden.

## Output Normalization Policy

Provider output is normalized into a candidate bundle with:

- candidate refs
- candidate family
- bounded claim/support summaries
- source refs
- bounded quote refs
- confidence labels
- warnings
- reason codes
- candidate-only false flags for truth/proof/evidence/state claims

Raw provider output is non-persistent by default.
No chain-of-thought or hidden reasoning is stored.
Provider thread/run/session IDs are not canonicalized.

## Candidate-Only Policy

Normalized provider output is candidate-only.
Provider output is not truth.
Provider output is not proof/evidence.
Provider confidence is not promotion readiness.
Candidate output is not fact.
Candidate output is not accepted evidence.
Every candidate needs operator review.

There is no automatic review memory write.
There is no retrieval index write.
There is no proof/evidence write.
There is no Perspective promotion.
There is no durable Perspective state apply.
There is no Formation Receipt write.

## Confidence And Warning Policy

Confidence labels are display/review cues only. Provider confidence is not
truth. Provider confidence is not promotion readiness.

Unsupported extraction returns `unsupported_extraction`.
Low-grounding output remains candidate-only and carries
`low_grounding_warning`.

## Privacy And Redaction Policy

The runtime rejects private/raw markers, secret-like material, raw source body
storage requests, raw provider output storage requests, chain-of-thought
storage requests, provider internal IDs, token logs, private URLs, local paths,
raw retrieval outputs, raw DB rows, raw conversations, hidden reasoning,
telemetry dumps, real GitHub payloads, raw diffs, and terminal logs.

Route responses do not echo raw unsafe values.
Raw source body is non-persistent by default.
Raw provider output is non-persistent by default.
No chain-of-thought or hidden reasoning is stored.

## Route Policy

The route is:

- `POST /api/research-candidate-review/provider-extraction`

The route requires same-origin POST, a JSON object body, `route_version`,
`scope`, and `input`. It returns bounded JSON envelopes and includes the
authority boundary. It does not export `GET`.

Status mapping:

- `200`: `candidate_bundle_created`
- `200`: `provider_unavailable` or `provider_missing_key` graceful refusal
- `400`: invalid/private/raw/unsupported extraction
- `403`: forbidden authority or same-origin violation

## Authority Boundary

Allowed true fields:

- `provider_assisted_extraction_runtime_now`
- `explicit_operator_provider_action_only`
- `same_origin_post_route_now`
- `provider_adapter_invocation_now` only when the adapter is invoked
- `mock_provider_adapter_now` only in mock provider mode
- `configured_provider_missing_key_refusal_now` only in the configured missing-key path
- `normalized_candidate_bundle_now`
- `candidate_only_output_now`
- `source_ref_required`
- `bounded_source_excerpt_required`
- `raw_source_body_non_persistent_by_default`
- `raw_provider_output_non_persistent_by_default`

Forbidden fields remain false:

- `provider_call_on_load_now`
- `background_provider_call_now`
- `hidden_provider_call_now`
- `raw_prompt_stored_now`
- `prompt_sent_without_operator_action_now`
- `hidden_reasoning_stored_now`
- `chain_of_thought_stored_now`
- `raw_source_body_stored_now`
- `raw_provider_output_stored_now`
- `provider_thread_run_session_id_canonicalized_now`
- `retrieval_index_write_now`
- `retrieval_execution_now`
- `rag_answer_generation_now`
- `db_query_or_write_now`
- `route_get_provider_execution_now`
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
- `local_file_export_now`
- `local_file_import_now`
- `codex_execution_now`
- `codex_execution_authority`
- `github_automation_authority`
- `product_write_authority`
- `provider_output_is_truth`
- `provider_output_is_proof`
- `provider_output_is_accepted_evidence`
- `provider_confidence_is_truth`
- `provider_confidence_is_promotion_readiness`
- `candidate_is_fact`
- `candidate_is_proof`
- `candidate_is_accepted_evidence`
- `source_ref_is_proof`
- `smoke_pass_is_truth`
- `ci_pass_is_truth`

## Fixture Policy

The fixture is public-safe and symbolic. It contains no real provider keys,
real secrets, real provider IDs, real connector IDs, real uploaded-file IDs,
real private URLs, real local paths, raw source bodies, raw provider outputs,
raw retrieval outputs, raw DB rows, raw conversations, hidden reasoning,
telemetry dumps, real GitHub API payloads, real PR payloads, raw diffs, real
terminal logs, token logs, or chain-of-thought.

Safe markers appear only inside blocked examples.

## Verification Expectations

Expected checks include:

- `node --check scripts/smoke-provider-assisted-extraction-runtime-completion-v0-1.mjs`
- `npm run smoke:provider-assisted-extraction-runtime-completion-v0-1`
- `npm run smoke:provider-assisted-extraction-runtime-v0-1`
- `npm run smoke:provider-assisted-extraction-candidate-only-contract-v0-1`
- `npm run smoke:bounded-source-intake-runtime-completion-v0-1`
- `npm run smoke:bounded-source-intake-runtime-v0-1`
- `npm run smoke:bounded-source-intake-runtime-contract-v0-1`
- downstream review-memory/foundation, authority, privacy, formal-invariant,
  product-write, typecheck, diff, and release smokes requested by the PR body

## Deferred Work

Deferred work:

- Optional live provider adapter once a safe repo convention and local config are available
- Provider output redaction contract if a future slice needs persisted provider traces
- Retrieval index runtime
- Retrieval/RAG runtime
- Review-memory UI binding to provider candidates
- Human-reviewed promotion
- Durable Perspective state apply
- Formation Receipt writes
- Git/GitHub execution
- Codex execution
- Product-write
- Product ID allocation

This slice does not execute Git or call GitHub from Augnes runtime.
This slice does not execute Codex.
This slice does not product-write.
This slice does not allocate product IDs.
Product-write remains parked by #686.
Smoke/CI pass is not truth.
