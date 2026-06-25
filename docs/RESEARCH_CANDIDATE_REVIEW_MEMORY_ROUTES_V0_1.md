# Research Candidate Review Memory Routes v0.1

## 1. Purpose

Research Candidate Review Memory Routes are route-boundary-only. They expose the
#770 local store helper through same-origin, explicit operator actions for
creating an empty snapshot, upserting a validated record, discarding a record,
and superseding a record.

The routes do not create a new persistence layer. It uses only the local store helper.
They keep the #769 Review Memory Contract as the record boundary.

## 2. Relationship To The Integrated Roadmap Guide v0.2

It implements Phase 2.3 from the integrated development roadmap guide v0.2.
The primary planning basis is
`AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_GUIDE_V0_2_2026-06-25.md`.

Older proposal documents are background inputs already integrated into the roadmap guide, not standalone ordering authority.

## 3. Relationship To #769 And #770

It follows the #769 Review Memory Contract and #770 Review Memory Store.

- #769 defines the bounded record contract and privacy boundary.
- #770 defines the local-store-only helper and deterministic snapshot behavior.
- This slice adds a same-origin route boundary over that helper.

Review memory is not truth. Candidate memory is not Perspective state.

## 4. Scope And Non-Goals

This slice adds the route module, route contract helper, fixture, smoke, docs,
package script, and index pointer.

It does not add UI.
It does not add DB migrations.
It does not query or write DB.
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

It does not store raw private payloads.
It does not store raw source bodies.
It does not store raw provider outputs.
It does not store raw conversations.
It does not store hidden reasoning.

## 5. Route Shape

The route is:

- `app/api/research-candidate/review-memory/route.ts`

Supported methods:

- `GET`
- `POST`

The route version is `research_candidate_review_memory_routes.v0.1`. The status
is `route_boundary_only`.

## 6. Same-Origin Boundary

It requires same-origin or local/test-safe requests. If `Origin` is present, it
must match `Host`. If `Sec-Fetch-Site` is present, only `same-origin`,
`same-site`, or `none` are accepted. Cross-site requests receive the public-safe
error code `same_origin_required`.

No auth/session framework is added in this PR.

## 7. Request Validation

The request contract rejects:

- Wrong route version.
- Wrong scope.
- Unknown action.
- Missing store file path.
- Unsafe store file path.
- `create_empty_snapshot` without `as_of`.
- `upsert_record` without `record`.
- `discard_record` without `discard`.
- `supersede_record` without `supersede`.
- Top-level raw/private markers.
- Action strings that imply product write, proof/evidence, promotion, work
  mutation, provider calls, retrieval, GitHub automation, or Codex execution.

Requests remain explicit operator actions. They do not grant execution
authority.

## 8. Store File Path Boundary

The routes require a caller-provided store file path. It does not choose a default private path.
It does not expose private local paths in responses.

The route contract rejects private or dangerous path strings including local
private paths, private URLs, path traversal, null bytes, token-like strings,
secret-like strings, raw source body markers, raw provider output markers,
hidden reasoning markers, raw DB row markers, and browser dump markers.

Source refs are lineage pointers, not proof. Source refs must be public-safe symbolic refs.

## 9. Supported Actions

`create_empty_snapshot` creates and writes an empty validated local store
snapshot for the explicit store path and `as_of`.

`upsert_record` reads the existing snapshot, or creates an empty snapshot only
when the caller supplies `as_of`, then delegates to the store helper.

`discard_record` reads an existing snapshot, delegates discard behavior to the
store helper, and preserves the record. Discard is not deletion.

`supersede_record` reads an existing snapshot, delegates supersede behavior to
the store helper, and preserves old/new lineage. Supersede preserves lineage.

## 10. Response Safety

Responses include:

- `route_version`
- `scope`
- `status`
- optional `action`
- optional validated `snapshot`
- public-safe `error_code`
- `boundary_notes`
- `authority_boundary`

Responses do not include raw stack traces, raw Error objects, or private local
paths. Error responses use public-safe error codes only.

## 11. Authority Boundary

The route authority boundary is:

- `route_boundary_only` remains true.
- `same_origin_required` remains true.
- `local_store_helper_only` remains true.
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

## 12. Deferred Work

Deferred work:

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

## 13. Verification Expectations

Verification should include:

- `node --check scripts/smoke-research-candidate-review-memory-routes-v0-1.mjs`
- `npm run smoke:research-candidate-review-memory-routes-v0-1`
- Review Memory Store and Review Memory Contract smokes
- Downstream Phase 1 preview/read-model smokes
- `npm run typecheck`
- `git diff --check`
- `git diff --cached --check`

## 14. Next Recommended Slices

Next recommended slices:

1. `research_candidate_review_memory_ui_v0_1`
2. `foundation_lifecycle_review_memory_readonly_ui_v0_1`
3. `bounded_source_intake_runtime_contract_v0_1`
4. `bounded_source_intake_runtime_v0_1`
5. `provider_assisted_extraction_candidate_only_contract_v0_1`

These follow-up slices are not implemented here.
