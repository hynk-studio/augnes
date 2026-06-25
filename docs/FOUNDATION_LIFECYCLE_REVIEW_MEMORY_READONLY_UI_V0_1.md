# Foundation/Lifecycle/Review Memory Read-only UI v0.1

## 1. Purpose

Foundation/Lifecycle/Review Memory Read-only UI is readonly-ui-only. It adds a
bounded operator-facing page for inspecting foundation, lifecycle,
calibration, logical shape, feedback-to-rule, temporal handoff, target-agent
profile, and review-memory summaries.

Read-only UI.
Review memory is not truth.
Candidate memory is not Perspective state.
Lifecycle status is derived review context, not source of truth.
Calibration context is diagnostic, not readiness authority.
Logical shape context is structure-only, not proof.
Feedback-to-Rule context is candidate-only, not rule mutation.
Temporal handoff context is diagnostic, not authority.
Target-agent packet profile is advisory, not prompt execution.
Discard is not deletion.
Supersede preserves lineage.
Source refs are lineage pointers, not proof.
Source refs must be public-safe symbolic refs.
Product-write remains parked by #686.

## 2. Relationship To The Integrated Roadmap Guide v0.2

It implements the next Phase 2 UI consolidation slice from the integrated development roadmap guide v0.2.
The primary planning basis is
`AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_GUIDE_V0_2_2026-06-25.md`.

Older proposal documents are background inputs already integrated into the roadmap guide, not standalone ordering authority.

## 3. Relationship To #762-#772

It follows #762 Lifecycle, #763 Calibration, #764 Logical Shape, #765/#766
Feedback-to-Rule, #767 Temporal Handoff, #768 Target-Agent Packet Profiles,
#769 Contract, #770 Store, #771 Routes, and #772 Review Memory UI.

- #762 provides derived lifecycle read-model context.
- #763 provides calibration diagnostic context.
- #764 provides logical claim shape preview context.
- #765/#766 provide feedback-to-rule candidate context.
- #767 provides temporal handoff diagnostic context.
- #768 provides target-agent packet profile context.
- #769, #770, and #771 provide the review-memory contract, store, and route boundary.
- #772 provides the route-backed Review Memory UI predecessor.

## 4. Scope And Non-Goals

This slice adds:

- `app/research-candidate/foundation-lifecycle-review-memory/page.tsx`
- `app/research-candidate/foundation-lifecycle-review-memory/foundation-lifecycle-review-memory-client.tsx`
- `lib/research-candidate-review/foundation-lifecycle-review-memory-ui-contract.ts`
- `fixtures/research-candidate-review.foundation-lifecycle-review-memory-readonly-ui.sample.v0.1.json`
- `scripts/smoke-foundation-lifecycle-review-memory-readonly-ui-v0-1.mjs`
- this documentation pointer
- package and index pointers

It does not add new API routes.
It does not POST.
It does not perform create/upsert/discard/supersede.
It does not directly write files.
It does not import or call the store helper from UI components.
It does not add DB migrations.
It does not query or write DB.
It does not call provider/OpenAI.
It does not fetch external URLs.
It does not execute retrieval/RAG.
It does not create proof/evidence.
It does not promote Perspective.
It does not mutate durable Perspective state.
It does not mutate work.
It does not execute Codex.
It does not call GitHub.
It does not export Git Ledger packets.
It does not write product records.
It does not allocate product IDs.
Product-write remains parked by #686.

## 5. UI Route/Page Shape

The selected UI route is:

- `app/research-candidate/foundation-lifecycle-review-memory/page.tsx`

The client component is:

- `app/research-candidate/foundation-lifecycle-review-memory/foundation-lifecycle-review-memory-client.tsx`

The page renders a static heading and the route-backed read-only client
component. The page does not read files, write files, import filesystem
modules, import the store helper, call provider/OpenAI, call GitHub, query DB,
mutate work, execute work, or execute Codex.

## 6. Read-only Route Use

The client may call the existing #771 route with GET only:

- `/api/research-candidate/review-memory`

The client uses only:

- `GET /api/research-candidate/review-memory?store_file_path=<encoded>&allow_empty=1&as_of=<as_of>`

The default store path is:

- `tmp/research-candidate-review-memory/ui-preview-store.json`

Store paths remain constrained by the #771 route allowlist.

Visible allowlist guidance remains:

- `tmp/research-candidate-review-memory/*.json`
- `.tmp/research-candidate-review-memory/*.json`

The UI is read-only and does not perform automatic background writes. It does
not choose a private path. It does not create, upsert, discard, supersede,
write, mutate, promote, execute, fetch external sources, call providers, or
create product records.

## 7. Section Model

The read-only page displays these sections:

1. Foundation status summary
2. Lifecycle review queue summary
3. Calibration risk summary
4. Logical claim shape summary
5. Feedback-to-rule candidate summary
6. Temporal handoff diagnostic summary
7. Target-agent packet profile summary
8. Review memory snapshot summary
9. Authority boundary
10. Deferred work

Phase 1 and Phase 2 artifact summaries are fixture-backed, deterministic, and
public-safe. The optional loaded route snapshot is used only for the review
memory snapshot summary.

## 8. Display Safety Rules

The UI displays bounded summary fields only. It does not display raw private
payloads. It does not display raw source bodies. It does not display raw
provider outputs. It does not display raw conversations. It does not display
hidden reasoning. It does not display raw DB rows. It does not display browser
dumps. It does not display local private paths, private URLs, token-like
strings, or secret-like strings.

## 9. Review Memory Snapshot Summary Rules

If no route snapshot is loaded, the page shows fixture-backed sample rows and
`not_loaded` status. If a route snapshot is loaded, the page displays only
bounded row fields:

- `record_id`
- `record_kind`
- `lifecycle_state`
- `review_decision`
- `candidate_ref`
- source refs count
- related record refs count
- `privacy_class`
- `updated_at`

Unknown route snapshot fields are not rendered directly. Review memory is not
truth. Discard is not deletion. Supersede preserves lineage. Source refs are
lineage pointers, not proof.

## 10. Authority Boundary

The authority boundary is:

- `readonly_ui_only` remains true.
- `route_get_only` remains true.
- `route_post_now` remains false.
- `automatic_write_on_load` remains false.
- `direct_file_write_now` remains false.
- `direct_store_helper_write_now` remains false.
- `new_api_route_added_now` remains false.
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

## 11. Deferred Work

Deferred work:

- Bounded Source Intake Runtime Contract
- Bounded Source Intake Runtime
- Provider-Assisted Extraction candidate-only contract
- Provider-Assisted Extraction runtime
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

## 12. Verification Expectations

Verification should include:

- `node --check scripts/smoke-foundation-lifecycle-review-memory-readonly-ui-v0-1.mjs`
- `npm run smoke:foundation-lifecycle-review-memory-readonly-ui-v0-1`
- `npm run smoke:research-candidate-review-memory-ui-v0-1`
- `npm run smoke:research-candidate-review-memory-routes-v0-1`
- `npm run smoke:research-candidate-review-memory-store-v0-1`
- `npm run smoke:research-candidate-review-memory-contract-v0-1`
- downstream Phase 1 and foundation smokes
- `npm run typecheck`
- `git diff --check`
- `git diff --cached --check`

## 13. Next Recommended Slices

Next recommended slices:

1. `bounded_source_intake_runtime_contract_v0_1`
2. `bounded_source_intake_runtime_v0_1`
3. `provider_assisted_extraction_candidate_only_contract_v0_1`
4. `provider_assisted_extraction_runtime_v0_1`
5. `retrieval_rag_runtime_contract_v0_1`

Do not implement those next slices in this PR.
