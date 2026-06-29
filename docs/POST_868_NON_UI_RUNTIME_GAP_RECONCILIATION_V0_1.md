# Post-#868 Non-UI Runtime Gap Reconciliation v0.1

Slice name: `post_868_non_ui_runtime_gap_reconciliation_v0_1`

## Purpose

This is a repo-grounded reconciliation packet for post-#868 Augnes runtime
planning.

It records the frozen web baseline, classifies the superseded v0.2.1 roadmap
slice anchors, marks completed runtime/store/helper surfaces as no-repeat, and
selects exactly one next non-UI implementation slice:

```text
dogfooding_record_runtime_store_route_v0_1
```

This document is not a roadmap, not SSOT, not PR sequencing authority, and not
approval to mine the old v0.2.1 roadmap for new work. It exists to prevent
Codex from repeating completed slices or drifting back into UI, Cockpit,
browser validation, public-surface polish, route IA polish, mobile viewport
polish, or read/display-only UI expansion.

## Post-#868 Frozen Web Baseline

PR #868 is the frozen web baseline.

The route model baseline is frozen as:

```text
/ = public Augnes surface
/perspective = Perspective detail
/workbench = cockpit/workbench
```

PR #868 is merged into `main`. PR #869 then added the post-#868 posture guard:
Core first, Handoff first, Conversation first, Web last.

For this reconciliation, the public route model, public home surface,
Perspective public detail surface, Cockpit workbench route, public-surface
smokes, and route IA polish are baseline evidence, not current work targets.

## Development Direction

What changes the development direction:

- Old v0.2.1 roadmap tables remain historical compatibility references only.
- Post-#868 work is Core first, Handoff first, Conversation first, Web last.
- Current selection does not come from roadmap mining. It comes from the
  operator-provided task.
- UI, Cockpit, browser-validation-only, public-surface, route IA polish, mobile
  viewport polish, and read/display-only UI expansion are Web-last backlog.

Repo-grounded evidence:

- `docs/POST_868_DEVELOPMENT_POSTURE.md`
- `docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md`
- `docs/archive/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL_SUPERSEDED_2026_06_30.md`
- `scripts/smoke-post-868-roadmap-supersession-cleanup-v0-1.mjs`
- `scripts/smoke-augnes-public-surface-workflow-preservation-ia-v0-1.mjs`
- `scripts/smoke-perspective-public-surface-visual-reset-v0-1.mjs`
- `docs/V0_2_1_REMAINING_RUNTIME_GAP_AUDIT_V0_6.md`
- `fixtures/v0-2-1-remaining-runtime-gap-audit.sample.v0.6.json`
- `docs/DOGFOODING_RECORD_RUNTIME_CONTRACT_V0_1.md`
- `docs/DOGFOODING_INGESTION_RUNTIME_V0_1.md`
- `lib/dogfooding/dogfooding-ingestion-runtime.ts`
- `lib/dogfooding/dogfooding-record-store.ts`
- `app/api/dogfooding/records/route.ts`

Deliberately excluded:

- UI implementation or polish.
- Cockpit changes.
- Public surface changes.
- Route model changes.
- Browser-validation-only work.
- API route changes.
- DB schema or migrations.
- Provider/OpenAI calls.
- Retrieval expansion.
- Source fetch.
- Proof/evidence creation.
- Claim/evidence writes.
- Promotion execution.
- Formation Receipt writes.
- Durable Perspective state apply.
- Product-write.
- Product ID allocation.
- Codex, Git, GitHub, release, deploy, or publish actuation from Augnes runtime.

## Classification Categories

Each historical v0.2.1 roadmap slice anchor is classified into one of:

- `done`: repo evidence exists and the slice must not be repeated.
- `done_but_ui_excluded`: repo evidence exists, but the surface is UI,
  Cockpit, route IA, browser validation, public-surface, mobile viewport, or
  read/display-only expansion and is Web-last backlog now.
- `still_valid`: still valid only as an explicitly approved, non-UI,
  non-authority future slice.
- `blocked`: would open a forbidden capability if treated as implementation
  authority now.
- `superseded`: replaced by the post-#868 baseline or by a narrower completed
  repo slice.

## v0.2.1 Slice Classification

| historical slice anchor | classification | current note |
| --- | --- | --- |
| `foundation_status_review_and_next_runtime_slice_selection_v0_1` | `superseded` | The old selected-next decision is superseded by post-#868 operator selection. |
| `research_candidate_lifecycle_read_model_v0_1` | `done` | Completed read-model surface; do not repeat. |
| `research_candidate_calibration_diagnostic_v0_1` | `done` | Completed diagnostic surface; do not repeat. |
| `logical_claim_shape_preview_v0_1` | `done` | Completed logical-shape review aid; do not repeat. |
| `feedback_to_rule_candidate_contract_v0_1` | `done` | Completed contract surface; do not repeat. |
| `temporal_handoff_diagnostic_sections_v0_1` | `done` | Completed handoff diagnostic sections; do not repeat. |
| `research_candidate_review_memory_contract_v0_1` | `done` | Completed Review Memory contract; do not repeat. |
| `research_candidate_review_memory_store_v0_1` | `done` | Completed Review Memory store contract; do not repeat. |
| `research_candidate_review_memory_routes_v0_1` | `done` | Completed Review Memory route contract; do not repeat. |
| `research_candidate_review_memory_ui_v0_1` | `done_but_ui_excluded` | UI/read surface is Web-last backlog for any further work. |
| `foundation_lifecycle_review_memory_readonly_ui_v0_1` | `done_but_ui_excluded` | Read/display UI expansion is Web-last backlog. |
| `bounded_source_intake_runtime_contract_v0_1` | `done` | Completed bounded source contract; do not repeat. |
| `bounded_source_intake_runtime_v0_1` | `done` | Completed bounded source runtime; source-fetch expansion remains blocked. |
| `provider_assisted_extraction_candidate_only_contract_v0_1` | `done` | Completed candidate-only provider contract; do not repeat. |
| `provider_assisted_extraction_runtime_v0_1` | `done` | Completed bounded provider-assisted runtime surface; live-provider authority remains blocked. |
| `research_retrieval_runtime_contract_v0_1` | `done` | Completed retrieval contract; do not repeat. |
| `rebuildable_retrieval_index_runtime_v0_1` | `done` | Completed rebuildable index surface; retrieval expansion remains blocked. |
| `rag_context_preview_v0_1` | `done` | Completed preview/read surface; do not repeat as runtime authority. |
| `perspective_promotion_runtime_contract_v0_1` | `done` | Completed promotion contract; promotion execution remains blocked. |
| `promotion_decision_store_route_v0_1` | `done` | Completed decision-store route surface; promotion execution remains blocked. |
| `formation_receipt_durable_write_v0_1` | `done` | Completed bounded Formation Receipt surface; this slice opens no writes. |
| `durable_perspective_state_apply_v0_1` | `done` | Completed bounded durable-state apply surface; this slice opens no state mutation. |
| `perspective_trajectory_builder_v0_1` | `done` | Completed trajectory builder surface; do not repeat. |
| `project_constellation_runtime_layout_contract_v0_1` | `done_but_ui_excluded` | Layout/route IA follow-up is Web-last backlog. |
| `seeded_constellation_layout_runtime_v0_1` | `done_but_ui_excluded` | Layout runtime follow-up is Web-last backlog. |
| `constellation_runtime_ui_v0_1` | `done_but_ui_excluded` | Runtime UI follow-up is Web-last backlog. |
| `layout_persistence_manual_anchors_v0_1` | `done_but_ui_excluded` | Layout/manual-anchor display follow-up is Web-last backlog. |
| `feedback_event_aggregation_runtime_v0_1` | `done` | Completed feedback aggregation runtime; feedback is not truth. |
| `feedback_controls_expansion_v0_1` | `done_but_ui_excluded` | Controls/UI expansion is Web-last backlog. |
| `feedback_influenced_surfacing_preview_v0_1` | `done_but_ui_excluded` | Surfacing preview and browser/static polish are Web-last backlog. |
| `dogfooding_record_runtime_contract_v0_1` | `done` | Completed contract-only surface; do not repeat. |
| `dogfooding_ingestion_runtime_v0_1` | `done` | Completed helper/store/route surface; do not repeat existing parts. |
| `authority_boundary_regression_ci_v0_1` | `done` | Completed static boundary regression surface; do not treat pass as truth. |
| `codex_result_report_ingestion_v0_1` | `done` | Completed bounded ingestion surface; Codex reports are not authority. |
| `temporal_handoff_usefulness_experiment_v0_1` | `done` | Completed experiment-plan surface; no runtime execution authority. |
| `local_data_export_import_policy_v0_1` | `done` | Completed local export policy surface; no broad import/export authority opened. |
| `privacy_redaction_runtime_guard_v0_1` | `done` | Completed privacy guard surface; do not repeat. |
| `runtime_audit_panel_v0_1` | `done_but_ui_excluded` | Audit panel/browser/display expansion is Web-last backlog. |
| `release_readiness_matrix_v0_1` | `done` | Completed readiness matrix; release execution remains blocked. |
| `git_ledger_export_contract_v0_1` | `done` | Completed contract; Git/GitHub actuation remains blocked. |
| `git_ledger_export_deterministic_builder_v0_1` | `done` | Completed deterministic builder; Git/GitHub actuation remains blocked. |
| `git_ledger_export_readonly_preview_v0_1` | `done` | Completed read-only preview; no actuation authority. |
| `local_git_ledger_export_v0_1` | `done` | Completed local export surface; GitHub actuation remains blocked. |
| `github_actuation_contract_v0_1` | `done` | Contract evidence exists; actual GitHub/Git actuation remains blocked. |
| `product_write_reentry_review_v0_1` | `done` | Completed review surface; product-write remains blocked. |
| `product_write_target_contract_v0_1` | `done` | Completed target contract; product-write remains blocked. |
| `disabled_product_write_adapter_reentry_harness_v0_1` | `done` | Completed disabled harness; adapter enablement remains blocked. |
| `product_write_minimal_runtime_v0_1` | `superseded` | Superseded by the narrower accepted-evidence-ref first-target path; broad product-write remains blocked. |
| `deterministic_crpf_variant_review_v0_1` | `done` | Completed deterministic review surface; no runtime randomness authority. |
| `empirical_calibration_dataset_v0_1` | `done` | Completed offline dataset surface; no training/mutation authority. |
| `target_agent_ai_context_packet_profiles_v0_1` | `done` | Completed packet profile surface; no execution approval. |
| `formal_invariant_checks_narrow_scope_v0_1` | `done` | Completed narrow invariant checks; no proof/evidence creation. |

## Still Valid Non-UI Selection

The only selected next non-UI implementation slice is:

```text
dogfooding_record_runtime_store_route_v0_1
```

Selection constraints:

- It must start from the existing dogfooding contract, ingestion helper, store,
  and route evidence.
- It must not recreate `dogfooding_record_runtime_contract_v0_1`.
- It must not recreate `dogfooding_ingestion_runtime_v0_1`.
- It must remain non-UI.
- It must not add provider/OpenAI calls, retrieval expansion, source fetch,
  proof/evidence creation, product-write, Git/GitHub actuation, release
  execution, or public-surface polish.
- It must not treat dogfooding records, CI pass, smoke pass, PR body, Codex
  report, Git ref, GitHub PR, retrieval score, provider output, feedback,
  layout coordinate, or salience score as truth, proof, approval, or authority.

## Completed No-Repeat Runtime/Store/Helper Surfaces

These completed surfaces must not be repeated:

- `research_candidate_review_memory_store_v0_1`
- `research_candidate_review_memory_routes_v0_1`
- `research_candidate_review_memory_db_store_runtime_v0_1`
- `research_candidate_review_memory_db_routes_runtime_v0_1`
- `bounded_source_intake_runtime_v0_1`
- `provider_assisted_extraction_runtime_v0_1`
- `research_retrieval_runtime_contract_v0_1`
- `rebuildable_retrieval_index_runtime_v0_1`
- `rag_context_preview_v0_1`
- `final_rag_answer_generation_candidate_review_v0_1`
- `final_rag_answer_candidate_review_memory_binding_v0_1`
- `promotion_readiness_packet_from_review_memory_v0_1`
- `perspective_promotion_runtime_contract_v0_1`
- `perspective_promotion_decision_store_v0_1`
- `formation_receipt_durable_write_v0_1`
- `durable_perspective_state_apply_v0_1`
- `perspective_trajectory_builder_v0_1`
- `feedback_event_aggregation_runtime_v0_1`
- `dogfooding_record_runtime_contract_v0_1`
- `dogfooding_ingestion_runtime_v0_1`
- `codex_result_report_ingestion_v0_1`
- `privacy_redaction_runtime_guard_v0_1`
- `runtime_audit_selected_route_instrumentation_v0_1`
- `runtime_audit_panel_runtime_completion_v0_1`
- `product_write_accepted_evidence_ref_runtime_v0_1`

## Web-Last Backlog

These categories are Web-last backlog unless separately approved later:

- UI implementation or UI polish.
- Cockpit changes.
- Browser-validation-only work.
- Public-surface work.
- Route IA polish.
- Mobile viewport polish.
- Read/display-only UI expansion.
- Public home surface adjustments.
- Perspective public detail adjustments.
- Workbench/Cockpit entrypoint adjustments.
- Promotion readiness UI/read-display/hub polish.
- Project Constellation layout/display polish.
- Feedback controls UI expansion.
- Surfacing preview UI expansion.
- Runtime audit panel UI/browser display work.

## Forbidden Capabilities That Remain Blocked

The following capabilities remain blocked unless separately approved:

- `product_write_execution`
- `accepted_evidence_ref_write_execution`
- `product_id_allocation_execution`
- `github_actuation_execution`
- `product_write`
- `accepted_evidence_ref_write`
- `product_id_allocation`
- `github_actuation`
- `github_api_call_from_augnes_runtime`
- `git_branch_commit_pr_from_augnes_runtime`
- `release_execution`
- `release_deploy_publish`
- `live_provider_validation`
- `provider_openai_call`
- `source_fetch`
- `retrieval_expansion`
- `retrieval_execution`
- `proof_evidence_creation`
- `claim_evidence_write`
- `promotion_execution`
- `formation_receipt_write`
- `durable_perspective_state_apply`
- `durable_state_mutation`
- `product_authority`
- `provider_output_as_truth`
- `retrieval_score_as_truth`
- `feedback_as_truth`
- `layout_coordinate_as_authority`
- `salience_score_as_truth`
- `ci_pass_as_truth`
- `smoke_pass_as_truth`
- `validation_pass_as_proof`
- `pr_body_as_authority`
- `git_ref_as_authority`
- `github_pr_as_core_decision`

The fixture also preserves `v0_2_1_roadmap_as_current_pr_sequencing_authority`
as a `superseded` classification entry so the old roadmap cannot regain
current sequencing authority by omission.

## Authority Boundary

This reconciliation changes only docs, a fixture, a smoke script, a package
script pointer, and the latest-index pointer.

It does not change UI files, components, Cockpit, public surfaces, route model,
API routes, DB schema, DB migrations, provider behavior, retrieval behavior,
source-fetch behavior, proof/evidence behavior, claim/evidence writes,
promotion execution, Formation Receipt writes, durable Perspective state apply,
product-write, product ID allocation, Codex execution from Augnes runtime, Git
actuation from Augnes runtime, GitHub actuation from Augnes runtime, release,
deploy, or publish behavior.

Codex itself may create the branch, commit, push, and draft PR for this
development workflow. Augnes runtime must not gain that capability.

## Fixture and Smoke

The matching fixture is:

```text
fixtures/post-868-non-ui-runtime-gap-reconciliation.sample.v0.1.json
```

The matching smoke is:

```text
scripts/smoke-post-868-non-ui-runtime-gap-reconciliation-v0-1.mjs
```

The smoke verifies:

- required top-level classification categories exist;
- required blocked capabilities exist;
- `selected_next_slice` is exactly
  `dogfooding_record_runtime_store_route_v0_1`;
- Web-last backlog entries exist;
- web priority inversion wording is absent;
- product-write, GitHub, live-provider, and release capability are not opened;
- changed files stay within this docs/fixture/smoke/package/index slice.

## Validation Expectations

Expected validation:

- `node --check scripts/smoke-post-868-non-ui-runtime-gap-reconciliation-v0-1.mjs`
- `npm run smoke:post-868-non-ui-runtime-gap-reconciliation-v0-1`
- `npm run typecheck`
- `git diff --check`
- `git diff --cached --check`
