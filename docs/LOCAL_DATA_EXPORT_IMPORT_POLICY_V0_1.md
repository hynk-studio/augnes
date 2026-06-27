# Local Data Export/Import Policy v0.1

## Purpose

`local_data_export_import_policy_v0_1` defines a deterministic, public-safe
policy and contract boundary for future Augnes local data export/import work.
This slice is policy-only and contract-only.

It describes which local-first runtime data classes may appear in future export
manifests, which values must be redacted or encoded as reference-only, and what
imports must never do automatically.

## Relationship to docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md

This slice implements the operational-hardening roadmap item
`local_data_export_import_policy_v0_1` from
`docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md`.

The roadmap guide is not SSOT. Repo-local type contracts, runtime slices, and
explicit authority boundaries remain authoritative for field names, status
vocabularies, and runtime behavior.

## Relationship to Privacy Redaction Runtime Guard v0.1

Privacy Redaction Runtime Guard v0.1 is required before any future
export/import runtime. Future export/import operators must run the
`privacy_redaction_runtime_guard_v0_1` boundary before private identifiers,
provider/runtime refs, raw payload markers, private URLs, local paths, or
secret-like values can enter a public-safe export manifest or import preview.

This policy does not replace the guard. It records that the guard is required
for future runtime work and that public-safe summaries, symbolic refs, redacted
fields, and reference-only encodings are the only acceptable export/import
surface shapes.

## Relationship to Review Memory, Promotion Decision, Formation Receipt, Durable Perspective State, Trajectory, Feedback, Layout, Dogfooding, Runtime Audit, Retrieval, Provider Extraction, Git Ledger, and Product Write

Review memory records, source refs, candidate bundles, promotion decisions,
Formation Receipts, durable Perspective state, trajectory events, feedback
events, layout preferences/manual anchors, dogfooding records, runtime audit
events, retrieval index metadata, and provider-assisted extraction candidates
may be represented only as future public-safe export/import contract entries.

Review records are not durable state. Source refs are lineage pointers, not
proof. Candidates are not facts. Feedback is not truth. Retrieval index
metadata is derived. Provider-assisted extraction outputs are candidates only.
Promotion decisions and Formation Receipts remain required before durable
Perspective state can be applied by any future approved runtime.

Git Ledger export packet refs are future/deferred refs only. This slice does
not execute Git Ledger export runtime. Product-write refs are parked/blocked
refs only. Product-write remains parked by #686.

## Export Scope

Future exports may include public-safe summaries and symbolic refs for:

- review records
- source refs
- candidate bundles
- promotion decisions
- Formation Receipts
- durable Perspective state
- trajectory events
- feedback events
- layout preferences/manual anchors
- dogfooding records
- runtime audit events
- retrieval index metadata
- provider-assisted extraction candidate outputs
- Git Ledger export packet refs, as future/deferred refs only
- product-write refs, as parked/blocked refs only

Exports must not include raw private payloads, raw source bodies, provider
thread/run/session identifiers, private URLs, local private paths, secrets,
tokens, raw DB rows, raw provider output, raw retrieval output, raw
conversations, browser dumps, or hidden reasoning. Export manifests are
candidate manifests only until a future explicit operator-gated runtime slice is
approved.

## Import Preview Policy

Imports are preview/validate only unless a future explicit operator-gated
runtime slice is approved.

Import must never auto-promote, auto-write product state, auto-create
proof/evidence, auto-apply durable state, auto-call provider, auto-run
retrieval, or auto-run Git/GitHub.

Allowed import policy actions are limited to previewing, validating, and
constructing candidate refs for review memory, source-ref metadata,
candidate-bundle candidates, feedback candidates, layout preference candidates,
dogfooding candidates, and runtime audit references.

## Privacy/Redaction Policy

Future export/import payloads must prefer:

- `public_safe_summary_only`
- `symbolic_refs_only`
- `reference_only`
- `redacted`

The following classes are blocked:

- `blocked_raw_private_payload`
- `blocked_raw_source_body`
- `blocked_provider_thread_run_session_id`
- `blocked_private_url`
- `blocked_local_private_path`
- `blocked_secret_like_pattern`

The fixture uses safe placeholder markers only where blocked examples are
required. No real secrets, provider IDs, connector IDs, uploaded-file IDs,
private URLs, local paths, raw source bodies, raw DB rows, raw conversations, or
hidden reasoning are needed to test this policy.

## Authority Boundary

Allowed true fields:

- `local_data_export_import_policy_now`
- `contract_only`
- `caller_provided_policy_only`
- `privacy_guard_required_for_future_runtime`

Forbidden false fields:

- `local_export_runtime_now`
- `local_import_runtime_now`
- `file_write_now`
- `file_read_now`
- `db_query_or_write_now`
- `route_now`
- `ui_now`
- `source_fetch_now`
- `provider_openai_call_now`
- `prompt_sent_now`
- `retrieval_execution_now`
- `rag_answer_generation_now`
- `proof_or_evidence_record_now`
- `claim_or_evidence_write_now`
- `promotion_execution_now`
- `durable_state_write_now`
- `durable_state_apply_now`
- `formation_receipt_write_now`
- `git_ledger_export_runtime_now`
- `git_write_now`
- `github_api_call_now`
- `repository_file_write_now`
- `codex_execution_authority`
- `github_automation_authority`
- `product_write_authority`
- `product_id_allocation_authority`
- `import_auto_promote_now`
- `import_auto_product_write_now`
- `import_auto_proof_evidence_write_now`
- `import_auto_durable_state_apply_now`
- `export_contains_raw_private_payload`
- `export_contains_raw_source_body`
- `export_contains_provider_thread_run_session_id`
- `export_contains_private_url`
- `export_contains_local_private_path`
- `smoke_pass_is_truth`
- `ci_pass_is_truth`

This slice does not implement export/import runtime. It does not write files. It
does not read files as export/import input. It does not query or write DB. It
does not add routes or UI. It does not call providers. It does not execute
retrieval/RAG. It does not create proof/evidence. It does not promote
Perspective. It does not write or apply durable Perspective state. It does not
write Formation Receipts. It does not execute Git Ledger export runtime. It does
not call GitHub or execute Git. It does not execute Codex. It does not allocate
product IDs or write products.

Smoke/CI pass is not truth.

## Data Class Matrix

| Data class | Export posture | Import posture |
| --- | --- | --- |
| `review_records` | public-safe summaries and symbolic refs | candidate restoration only |
| `source_refs` | lineage refs only | metadata candidate only |
| `candidate_bundles` | candidate refs only | candidate restoration only |
| `promotion_decisions` | reviewed decision refs only | preview only |
| `formation_receipts` | receipt refs only | preview only |
| `durable_perspective_state` | public-safe state refs only | preview only; no apply |
| `trajectory_events` | public-safe event summaries | preview only |
| `feedback_events` | feedback refs and summaries | candidate restoration only |
| `layout_preferences` | manual-anchor/layout refs | candidate restoration only |
| `dogfooding_records` | public-safe dogfooding refs | candidate restoration only |
| `runtime_audit_events` | public-safe audit refs | reference restoration only |
| `retrieval_index_metadata` | derived metadata only | preview only; no retrieval |
| `provider_extraction_candidates` | candidate outputs only | preview only; no provider call |
| `git_ledger_export_refs` | future/deferred refs only | no Git/GitHub execution |
| `product_write_parked_refs` | parked/blocked refs only | blocked product-write |

## Import Action Matrix

| Import action | Policy |
| --- | --- |
| `preview_only` | allowed |
| `validate_only` | allowed |
| `restore_review_memory_candidate` | candidate-only |
| `restore_source_ref_metadata` | candidate-only |
| `restore_candidate_bundle_candidate` | candidate-only |
| `restore_feedback_candidate` | candidate-only |
| `restore_layout_preference_candidate` | candidate-only |
| `restore_dogfooding_candidate` | candidate-only |
| `restore_runtime_audit_reference` | reference-only |
| `blocked_auto_promote` | blocked |
| `blocked_auto_product_write` | blocked |
| `blocked_auto_proof_evidence_write` | blocked |
| `blocked_auto_durable_state_apply` | blocked |
| `blocked_auto_provider_call` | blocked |
| `blocked_auto_retrieval_execution` | blocked |
| `blocked_auto_git_github_execution` | blocked |

## Fixture Policy

`fixtures/local-data-export.sample.v0.1.json` is a public-safe contract fixture.
It contains a safe export manifest example, an import preview example, a
blocked raw/private example using safe placeholders only, a blocked auto-action
example, a product-write parked/blocked example, and an authority boundary
sample.

The fixture must not include real provider IDs, real connector IDs, real
uploaded-file IDs, real private URLs, real local paths, real secrets, raw DB
rows, raw source bodies, raw provider outputs, raw retrieval outputs, raw
conversations, or hidden reasoning.

## Verification Expectations

Expected checks:

- `node --check scripts/smoke-local-data-export-policy-v0-1.mjs`
- `npm run smoke:local-data-export-policy-v0-1`
- `npm run smoke:privacy-redaction-guard-v0-1`
- `npm run typecheck`
- `git diff --check`
- `git diff --cached --check`

The smoke verifies docs, types, fixture, package, index pointers, authority
boundary fields, product-write parked wording, privacy guard dependency, safe
placeholder usage, and static no-runtime scope.

## Deferred Work

Deferred work requires a future explicit roadmap slice and operator gate:

- actual local export runtime
- actual local import runtime
- file export/import implementation
- DB read/write integration
- route or UI surfaces
- Git Ledger export runtime
- provider calls
- retrieval/RAG execution
- durable Perspective state apply
- proof/evidence writes
- Formation Receipt writes
- Git/GitHub execution
- Codex execution
- product-write or product ID allocation
