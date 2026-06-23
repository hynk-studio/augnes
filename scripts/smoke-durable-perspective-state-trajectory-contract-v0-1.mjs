import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const typePath = "types/durable-perspective-state-trajectory-contract.ts";
const fixturePath =
  "fixtures/research-candidate-review.durable-perspective-state-trajectory-contract.sample.v0.1.json";
const smokePath =
  "scripts/smoke-durable-perspective-state-trajectory-contract-v0-1.mjs";
const sourceValidationFixturePath =
  "fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-browser-validation.sample.v0.1.json";
const sourceValidationSmokePath =
  "scripts/smoke-human-reviewed-durable-perspective-promotion-browser-validation-v0-1.mjs";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const substrateDocPath = "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md";
const surfaceDocPath = "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md";
const gateDocPath =
  "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md";

const packageScriptName =
  "smoke:durable-perspective-state-trajectory-contract-v0-1";
const packageScriptValue =
  "node scripts/smoke-durable-perspective-state-trajectory-contract-v0-1.mjs";
const contractKind = "durable_perspective_state_trajectory_contract";
const contractVersion = "durable_perspective_state_trajectory_contract.v0.1";
const previewVersion = "durable_perspective_state_trajectory_preview.v0.1";
const recommendationStatus =
  "ready_for_durable_perspective_state_trajectory_implementation_v0_1";
const nextRecommendedSlice =
  "durable_perspective_state_trajectory_implementation_v0_1";
const implementationBuilderPath =
  "lib/research-candidate-review/durable-perspective-state-trajectory.ts";
const implementationFixturePath =
  "fixtures/research-candidate-review.durable-perspective-state-trajectory-implementation.sample.v0.1.json";
const implementationSmokePath =
  "scripts/smoke-durable-perspective-state-trajectory-implementation-v0-1.mjs";
const implementationPackageScriptName =
  "smoke:durable-perspective-state-trajectory-implementation-v0-1";
const implementationPackageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-durable-perspective-state-trajectory-implementation-v0-1.mjs";
const implementationVersion =
  "durable_perspective_state_trajectory_implementation.v0.1";
const implementationRecommendationStatus =
  "ready_for_durable_perspective_state_trajectory_browser_validation_v0_1";
const implementationNextRecommendedSlice =
  "durable_perspective_state_trajectory_browser_validation_v0_1";
const writeFixture = process.argv.includes("--write-fixture");
let cachedMergeBaseRef = null;

const protectedUnchangedPaths = [
  sourceValidationFixturePath,
  "types/human-reviewed-durable-perspective-promotion-contract.ts",
  "fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-contract.sample.v0.1.json",
  "lib/research-candidate-review/human-reviewed-durable-perspective-promotion.ts",
  "fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-implementation.sample.v0.1.json",
  "fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-browser-validation.sample.v0.1.json",
  "lib/research-candidate-review/non-authoritative-retrieval-rag.ts",
  "fixtures/research-candidate-review.non-authoritative-retrieval-rag-implementation.sample.v0.1.json",
  "fixtures/research-candidate-review.non-authoritative-retrieval-rag-browser-validation.sample.v0.1.json",
  "lib/research-candidate-review/operator-source-candidate-generation.ts",
  "fixtures/research-candidate-review.operator-source-candidate-generation-implementation.sample.v0.1.json",
  "lib/research-candidate-review/bounded-external-source-intake.ts",
  "fixtures/research-candidate-review.bounded-external-source-intake-implementation.sample.v0.1.json",
  "lib/research-candidate-review/salience-governor.ts",
  "fixtures/research-candidate-review.salience-governor-implementation.sample.v0.1.json",
  "lib/research-candidate-review/recent-rehearsal-buffer.ts",
  "fixtures/research-candidate-review.recent-rehearsal-buffer-implementation.sample.v0.1.json",
  "lib/db/schema.sql",
];

const downstreamSmokePaths = [
  sourceValidationSmokePath,
  "scripts/smoke-human-reviewed-durable-perspective-promotion-implementation-v0-1.mjs",
  "scripts/smoke-human-reviewed-durable-perspective-promotion-contract-v0-1.mjs",
  "scripts/smoke-non-authoritative-retrieval-rag-browser-validation-v0-1.mjs",
  "scripts/smoke-non-authoritative-retrieval-rag-implementation-v0-1.mjs",
  "scripts/smoke-non-authoritative-retrieval-rag-contract-v0-1.mjs",
  "scripts/smoke-operator-source-candidate-generation-browser-validation-v0-1.mjs",
  "scripts/smoke-operator-source-candidate-generation-implementation-v0-1.mjs",
  "scripts/smoke-operator-source-candidate-generation-contract-v0-1.mjs",
  "scripts/smoke-bounded-external-source-intake-browser-validation-v0-1.mjs",
  "scripts/smoke-bounded-external-source-intake-implementation-v0-1.mjs",
  "scripts/smoke-bounded-external-source-intake-contract-v0-1.mjs",
  "scripts/smoke-salience-governor-browser-validation-v0-1.mjs",
  "scripts/smoke-salience-governor-implementation-v0-1.mjs",
  "scripts/smoke-salience-governor-contract-v0-1.mjs",
  "scripts/smoke-recent-rehearsal-buffer-browser-validation-v0-1.mjs",
  "scripts/smoke-recent-rehearsal-buffer-implementation-v0-1.mjs",
  "scripts/smoke-recent-rehearsal-buffer-contract-v0-1.mjs",
  "scripts/smoke-formation-receipt-durable-event-browser-validation-v0-1.mjs",
  "scripts/smoke-formation-receipt-durable-event-implementation-v0-1.mjs",
  "scripts/smoke-formation-receipt-durable-event-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-aggregation-read-model-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-aggregation-read-model-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-aggregation-read-model-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-ui-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-ui-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-ui-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-route-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-route-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-route-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-controls-ui-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-controls-ui-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-controls-ui-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-write-route-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-write-route-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-write-route-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-store-review-controls-preview-v0-1.mjs",
  "scripts/smoke-feedback-event-store-minimal-v0-1.mjs",
];

const expectedChangedFiles = [
  typePath,
  fixturePath,
  smokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  ...downstreamSmokePaths,
];

for (const filePath of [
  typePath,
  smokePath,
  sourceValidationFixturePath,
  sourceValidationSmokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}
if (!writeFixture) {
  assert.ok(existsSync(fixturePath), `${fixturePath} must exist`);
}

const typeSource = readFile(typePath);
const smokeSource = readFile(smokePath);
const sourceValidationFixture = readJson(sourceValidationFixturePath);
const sourceValidationSmoke = readFile(sourceValidationSmokePath);
const packageJson = readJson(packagePath);
const basePackageJson = readJsonFromGit(packagePath);
const indexDoc = readFile(indexPath);
const substrateDoc = readFile(substrateDocPath);
const surfaceDoc = readFile(surfaceDocPath);
const gateDoc = readFile(gateDocPath);
const rebuiltFixture = buildContractFixture();

if (writeFixture) {
  writeFileSync(fixturePath, `${JSON.stringify(rebuiltFixture, null, 2)}\n`);
  process.exit(0);
}

const fixture = readJson(fixturePath);

assertRequiredFiles();
assertUpstreamValidationUnchanged();
assertTypeContract();
assertPackageScript();
assertStaticBoundary();
assertNoForbiddenRuntimePatterns();
assertContractShape(fixture);
assertContractScope(fixture.contract_scope);
assertStateFields(fixture.state_fields);
assertTrajectoryEventFamilies(fixture.trajectory_event_families);
assertLineagePolicy(fixture.lineage_policy);
assertEvidencePolicy(fixture.evidence_policy);
assertSnapshotPolicy(fixture.snapshot_policy);
assertSaliencePolicy(fixture.salience_policy);
assertSamplePreview(fixture.sample_durable_perspective_state_preview);
assertAuthorityBoundary(fixture.authority_boundary);
assertValidationPolicy(fixture.validation_policy);
assertPrivacyPolicy(fixture.privacy_policy);
assertDocsPointers();
assertSourceValidationDownstreamPointer();
assertPortableMergeBaseFallback();
assert.deepEqual(
  fixture,
  rebuiltFixture,
  "rebuilt Durable Perspective State / Trajectory contract fixture must match committed fixture",
);

console.log(
  JSON.stringify(
    {
      smoke: "durable-perspective-state-trajectory-contract-v0-1",
      final_status: "pass",
      contract_kind: fixture.contract_kind,
      contract_version: fixture.contract_version,
      source_promotion_validation_fingerprint:
        fixture.source_promotion_validation_fingerprint,
      state_field_count: fixture.state_fields.length,
      trajectory_event_family_count: fixture.trajectory_event_families.length,
      current_thesis_has_lineage:
        fixture.lineage_policy.current_thesis_has_lineage,
      perspective_snapshot_runtime_now:
        fixture.snapshot_policy.perspective_snapshot_runtime_now,
      runtime_state_write_implemented_now:
        fixture.authority_boundary.runtime_state_write_implemented_now,
      runtime_state_read_implemented_now:
        fixture.authority_boundary.runtime_state_read_implemented_now,
      durable_perspective_delta_apply_now:
        fixture.authority_boundary.durable_perspective_delta_apply_now,
      proof_or_evidence_record_write_now:
        fixture.authority_boundary.proof_or_evidence_record_write_now,
      accepted_evidence_write_now:
        fixture.authority_boundary.accepted_evidence_write_now,
      formation_receipt_write_now:
        fixture.authority_boundary.formation_receipt_write_now,
      runtime_db_write_now: fixture.authority_boundary.runtime_db_write_now,
      runtime_db_query_now: fixture.authority_boundary.runtime_db_query_now,
      provider_openai_call_now:
        fixture.authority_boundary.provider_openai_call_now,
      retrieval_rag_authority:
        fixture.authority_boundary.retrieval_rag_authority,
      product_write_lane_parked_by_686:
        fixture.authority_boundary.product_write_lane_parked_by_686,
      next_recommended_slice: fixture.next_recommended_slice,
    },
    null,
    2,
  ),
);

function buildContractFixture() {
  const authorityBoundary = buildAuthorityBoundary();
  const validationPolicy = buildValidationPolicy();
  const contract = {
    contract_kind: contractKind,
    contract_version: contractVersion,
    source_promotion_validation_ref:
      `${sourceValidationFixture.validation_version}:${sourceValidationFixturePath}#732`,
    source_promotion_validation_fingerprint:
      sourceValidationFixture.validation_fingerprint,
    contract_scope: buildContractScope(),
    state_fields: buildStateFields(),
    trajectory_event_families: buildTrajectoryEventFamilies(),
    lineage_policy: buildLineagePolicy(),
    evidence_policy: buildEvidencePolicy(),
    snapshot_policy: buildSnapshotPolicy(),
    salience_policy: buildSaliencePolicy(),
    sample_durable_perspective_state_preview: buildSamplePreview(
      authorityBoundary,
      validationPolicy,
    ),
    authority_boundary: authorityBoundary,
    validation_policy: validationPolicy,
    privacy_policy: buildPrivacyPolicy(),
    recommendation_status: recommendationStatus,
    next_recommended_slice: nextRecommendedSlice,
    contract_fingerprint: "",
    fingerprint_algorithm: "fnv1a32_canonical_json",
  };
  contract.contract_fingerprint = createContractFingerprint(contract);
  return contract;
}

function buildContractScope() {
  return {
    durable_perspective_state_contract_only: true,
    runtime_state_write_now: false,
    runtime_state_read_now: false,
    durable_perspective_delta_apply_now: false,
    perspective_snapshot_runtime_now: false,
    trajectory_runtime_build_now: false,
    promotion_history_write_now: false,
    retirement_history_write_now: false,
    proof_evidence_write_now: false,
    accepted_evidence_write_now: false,
    formation_receipt_write_now: false,
    work_mutation_now: false,
    runtime_db_query_now: false,
    runtime_db_write_now: false,
    schema_migration_now: false,
    route_ui_now: false,
    provider_openai_call_now: false,
    retrieval_rag_execution_now: false,
    source_fetch_now: false,
    crawler_now: false,
    product_write_now: false,
  };
}

function buildStateFields() {
  return [
    "perspective_id",
    "current_thesis",
    "prior_theses",
    "active_claims",
    "supporting_evidence_refs",
    "contradicting_evidence_refs",
    "open_tensions",
    "knowledge_gaps",
    "salience_state",
    "promotion_history",
    "retirement_history",
    "reuse_conditions",
  ];
}

function buildTrajectoryEventFamilies() {
  return [
    {
      event_kind: "initial_perspective_state",
      lineage_required: true,
      source_refs_required: true,
      promotion_record_ref_required: true,
      runtime_write_now: false,
    },
    {
      event_kind: "thesis_refined",
      prior_thesis_ref_required: true,
      next_thesis_ref_required: true,
      promotion_record_ref_required: true,
      retired_claim_refs_allowed: true,
      contradicted_evidence_refs_preserved: true,
      runtime_write_now: false,
    },
    {
      event_kind: "claim_added",
      active_claim_ref_required: true,
      source_refs_required: true,
      supporting_or_contradicting_evidence_refs_required: true,
      runtime_write_now: false,
    },
    {
      event_kind: "claim_retired",
      retired_claim_ref_required: true,
      retirement_reason_required: true,
      retirement_history_required: true,
      prior_claim_remains_auditable: true,
      runtime_write_now: false,
    },
    {
      event_kind: "tension_preserved",
      open_tension_ref_required: true,
      tension_reason_required: true,
      runtime_write_now: false,
    },
    {
      event_kind: "tension_resolved",
      prior_tension_ref_required: true,
      resolution_reason_required: true,
      promotion_record_ref_required: true,
      runtime_write_now: false,
    },
    {
      event_kind: "knowledge_gap_deferred",
      knowledge_gap_ref_required: true,
      defer_reason_required: true,
      runtime_write_now: false,
    },
    {
      event_kind: "knowledge_gap_closed",
      knowledge_gap_ref_required: true,
      accepted_evidence_ref_required: true,
      promotion_record_ref_required: true,
      runtime_write_now: false,
    },
    {
      event_kind: "salience_reweighted",
      salience_state_ref_required: true,
      salience_is_display_context_only: true,
      salience_not_authority: true,
      runtime_write_now: false,
    },
    {
      event_kind: "reuse_condition_updated",
      reuse_condition_ref_required: true,
      prior_condition_ref_required: true,
      runtime_write_now: false,
    },
  ];
}

function buildLineagePolicy() {
  return {
    current_thesis_has_lineage: true,
    prior_thesis_not_overwritten_silently: true,
    prior_theses_preserved: true,
    retired_claims_remain_auditable: true,
    contradicted_evidence_not_deleted: true,
    open_tensions_preserved_or_explicitly_resolved: true,
    knowledge_gaps_preserved_or_explicitly_deferred_or_closed: true,
    promotion_history_append_only_later: true,
    retirement_history_append_only_later: true,
    trajectory_events_source_ref_backed: true,
    trajectory_events_promotion_record_ref_backed_later: true,
  };
}

function buildEvidencePolicy() {
  return {
    supporting_evidence_refs_required_for_supported_claims: true,
    contradicting_evidence_refs_preserved: true,
    candidate_evidence_is_not_accepted_evidence: true,
    accepted_evidence_refs_required_for_accepted_evidence_claims: true,
    evidence_refs_are_refs_not_raw_body: true,
    proof_evidence_write_not_implemented_now: true,
    accepted_evidence_write_not_implemented_now: true,
  };
}

function buildSnapshotPolicy() {
  return {
    perspective_snapshot_shape_defined: true,
    perspective_snapshot_runtime_now: false,
    snapshot_is_derived_view: true,
    snapshot_not_source_of_truth_independent_of_state: true,
    snapshot_must_include_lineage_refs: true,
    snapshot_must_include_open_tensions_and_knowledge_gaps: true,
    snapshot_must_include_authority_boundary: true,
  };
}

function buildSaliencePolicy() {
  return {
    salience_state_allowed_as_display_context: true,
    salience_state_not_truth: true,
    salience_state_not_promotion_authority: true,
    salience_state_not_evidence_strength: true,
    durable_salience_write_now: false,
  };
}

function buildValidationPolicy() {
  return {
    current_thesis_has_lineage: true,
    prior_thesis_not_overwritten_silently: true,
    prior_theses_preserved: true,
    retired_claims_remain_auditable: true,
    contradicted_evidence_not_deleted: true,
    open_tensions_preserved_or_explicitly_resolved: true,
    knowledge_gaps_preserved_or_explicitly_deferred_or_closed: true,
    supporting_and_contradicting_evidence_refs_distinct: true,
    candidate_evidence_not_accepted_evidence: true,
    accepted_evidence_refs_required_for_accepted_evidence_claims: true,
    trajectory_events_source_ref_backed: true,
    trajectory_events_promotion_record_ref_backed_later: true,
    trajectory_events_runtime_write_now_false: true,
    promotion_history_append_only_later: true,
    retirement_history_append_only_later: true,
    perspective_snapshot_shape_defined: true,
    perspective_snapshot_runtime_now_false: true,
    snapshot_is_derived_view: true,
    snapshot_not_independent_source_of_truth: true,
    snapshot_includes_lineage_refs: true,
    snapshot_includes_open_tensions_and_knowledge_gaps: true,
    salience_state_not_authority: true,
    no_runtime_state_read_or_write: true,
    no_durable_perspective_delta_apply: true,
    no_proof_or_evidence_write: true,
    no_accepted_evidence_write: true,
    no_formation_receipt_write: true,
    no_work_mutation: true,
    no_runtime_db_write_or_query: true,
    no_schema_or_migration: true,
    no_route_or_ui: true,
    no_browser_request: true,
    no_provider_openai_call: true,
    no_retrieval_rag_execution: true,
    no_product_write_or_ids: true,
  };
}

function buildPrivacyPolicy() {
  return {
    no_secrets_in_fixture: true,
    no_private_urls: true,
    no_raw_provider_thread_run_session_ids: true,
    no_raw_source_body: true,
    public_safe_perspective_refs_only: true,
    public_safe_thesis_refs_only: true,
    public_safe_claim_refs_only: true,
    public_safe_evidence_refs_only: true,
    public_safe_tension_refs_only: true,
    public_safe_knowledge_gap_refs_only: true,
    public_safe_promotion_record_refs_only: true,
    public_safe_retirement_record_refs_only: true,
    public_safe_reuse_condition_refs_only: true,
  };
}

function buildAuthorityBoundary() {
  return {
    contract_added_now: true,
    implementation_added_now: false,
    runtime_state_write_implemented_now: false,
    runtime_state_read_implemented_now: false,
    durable_perspective_state_write_now: false,
    durable_perspective_delta_apply_now: false,
    perspective_snapshot_runtime_implemented_now: false,
    trajectory_runtime_build_implemented_now: false,
    promotion_history_write_now: false,
    retirement_history_write_now: false,
    proof_or_evidence_record_write_now: false,
    accepted_evidence_write_now: false,
    formation_receipt_write_now: false,
    work_mutation_now: false,
    candidate_mutation_now: false,
    candidate_record_write_now: false,
    runtime_promotion_implemented_now: false,
    promotion_decision_record_implemented_now: false,
    promotion_decision_record_write_now: false,
    runtime_retrieval_rag_implemented_now: false,
    runtime_index_build_implemented_now: false,
    runtime_index_write_now: false,
    embedding_generation_implemented_now: false,
    vector_db_implemented_now: false,
    fts_implemented_now: false,
    provider_openai_call_now: false,
    provider_extraction_now: false,
    source_fetch_now: false,
    crawler_now: false,
    source_index_write_now: false,
    durable_source_record_write_now: false,
    runtime_persistence_implemented_now: false,
    durable_memory_write_now: false,
    runtime_db_write_now: false,
    runtime_db_query_now: false,
    production_db_used_now: false,
    db_schema_implemented_now: false,
    route_changed_now: false,
    component_changed_now: false,
    browser_request_now: false,
    durable_salience_write_now: false,
    recent_rehearsal_buffer_written_now: false,
    feedback_events_written_now: false,
    feedback_events_mutated_now: false,
    execution_authority: false,
    codex_execution_authority: false,
    github_automation_authority: false,
    external_handoff_authority: false,
    provider_openai_authority: false,
    retrieval_rag_authority: false,
    source_fetch_authority: false,
    salience_authority: false,
    product_write_authority: false,
    product_id_allocation_authority: false,
    product_write_lane_parked_by_686: true,
  };
}

function buildSamplePreview(authorityBoundary, validationPolicy) {
  const previewAuthorityBoundary = clone(authorityBoundary);
  delete previewAuthorityBoundary.implementation_added_now;
  const sourceRefs = [
    "source_ref:public:promotion_validation_fixture",
    "source_ref:public:future_perspective_state_contract",
  ];
  return {
    preview_version: previewVersion,
    operator_context_ref:
      "operator_context:public:durable_perspective_state_trajectory_contract",
    perspective_state_preview: {
      perspective_id: "perspective_ref:public:example_state_trajectory_contract",
      current_thesis: {
        thesis_ref: "thesis_ref:public:current_lineaged_preview",
        summary: "Public-safe future current thesis preview with lineage refs.",
        lineage_refs: [
          "lineage_ref:public:initial_state",
          "lineage_ref:public:thesis_refined",
        ],
        promotion_record_refs: [
          "promotion_record_ref:public:future_required",
        ],
        source_refs: sourceRefs,
        not_written_now: true,
      },
      prior_theses: [
        {
          thesis_ref: "thesis_ref:public:prior_preserved_preview",
          summary: "Prior thesis preview preserved for audit.",
          retired_or_superseded_by_ref:
            "thesis_ref:public:current_lineaged_preview",
          lineage_refs: ["lineage_ref:public:prior_state"],
          preserved_for_audit: true,
          not_deleted: true,
        },
      ],
      active_claims: [
        {
          claim_ref: "claim_ref:public:active_claim_preview",
          summary: "Durable claim preview only; no state write now.",
          supporting_evidence_refs: [
            "accepted_evidence_ref:public:future_required",
          ],
          contradicting_evidence_refs: [
            "accepted_evidence_ref:public:contradiction_preserved",
          ],
          source_refs: sourceRefs,
          claim_is_durable_state_preview_only: true,
          not_written_now: true,
        },
      ],
      supporting_evidence_refs: [
        "accepted_evidence_ref:public:future_required",
      ],
      contradicting_evidence_refs: [
        "accepted_evidence_ref:public:contradiction_preserved",
      ],
      open_tensions: [
        {
          tension_ref: "tension_ref:public:open_tension_preserved",
          summary: "Open tension remains visible until explicitly resolved.",
          source_refs: sourceRefs,
          preserved: true,
        },
      ],
      knowledge_gaps: [
        {
          knowledge_gap_ref: "knowledge_gap_ref:public:gap_deferred_or_open",
          summary: "Knowledge gap remains visible until deferred or closed.",
          source_refs: sourceRefs,
          deferred_or_open: true,
        },
      ],
      salience_state: {
        salience_state_ref: "salience_state_ref:public:display_context_only",
        display_context_only: true,
        not_authority: true,
        not_written_now: true,
      },
      promotion_history: [
        {
          promotion_record_ref: "promotion_record_ref:public:future_required",
          decision_kind: "promote",
          source_refs: sourceRefs,
          append_only_later: true,
          not_written_now: true,
        },
      ],
      retirement_history: [
        {
          retirement_record_ref:
            "retirement_record_ref:public:future_auditable",
          retired_claim_ref: "claim_ref:public:retired_claim_auditable",
          reason_summary: "Public-safe future retirement reason preview.",
          append_only_later: true,
          not_written_now: true,
        },
      ],
      reuse_conditions: [
        {
          reuse_condition_ref:
            "reuse_condition_ref:public:lineaged_reuse_condition",
          condition_summary: "Future reuse condition preview with lineage.",
          lineage_refs: ["lineage_ref:public:reuse_condition_updated"],
          not_written_now: true,
        },
      ],
    },
    trajectory_preview: {
      trajectory_version: "durable_perspective_trajectory_preview.v0.1",
      trajectory_events: buildTrajectoryEventFamilies().map((family) => ({
        event_kind: family.event_kind,
        event_ref: `trajectory_event_ref:public:${family.event_kind}`,
        source_refs: sourceRefs,
        promotion_record_refs:
          family.promotion_record_ref_required ||
          family.event_kind === "initial_perspective_state"
            ? ["promotion_record_ref:public:future_required"]
            : [],
        lineage_refs: [`lineage_ref:public:${family.event_kind}`],
        runtime_write_now: false,
        public_safe: true,
      })),
      all_events_public_safe: true,
      all_events_runtime_write_now_false: true,
      all_events_source_ref_backed: true,
      all_events_preserve_lineage: true,
    },
    perspective_snapshot_preview: {
      snapshot_version: "perspective_snapshot_preview.v0.1",
      snapshot_is_derived_view: true,
      snapshot_runtime_now: false,
      includes_lineage_refs: true,
      includes_current_thesis: true,
      includes_prior_theses: true,
      includes_active_claims: true,
      includes_supporting_and_contradicting_evidence_refs: true,
      includes_open_tensions: true,
      includes_knowledge_gaps: true,
      includes_authority_boundary: true,
    },
    authority_boundary: previewAuthorityBoundary,
    validation_policy: validationPolicy,
  };
}

function assertRequiredFiles() {
  for (const filePath of [typePath, fixturePath, smokePath]) {
    assert.ok(existsSync(filePath), `${filePath} must exist`);
  }
}

function assertUpstreamValidationUnchanged() {
  assert.deepEqual(
    readJsonFromGit(sourceValidationFixturePath),
    sourceValidationFixture,
    "#732 validation fixture must not be changed by this contract slice",
  );
}

function assertTypeContract() {
  for (const requiredText of [
    "DurablePerspectiveStateTrajectoryContract",
    contractKind,
    contractVersion,
    "DurablePerspectiveStateField",
    "current_thesis",
    "prior_theses",
    "DurablePerspectiveTrajectoryEventKind",
    "initial_perspective_state",
    "reuse_condition_updated",
    "current_thesis_has_lineage",
    "prior_thesis_not_overwritten_silently",
    "candidate_evidence_is_not_accepted_evidence",
    "perspective_snapshot_shape_defined",
    "salience_state_not_promotion_authority",
    "no_runtime_state_read_or_write",
    "accepted_evidence_write_now",
    recommendationStatus,
    nextRecommendedSlice,
    "fnv1a32_canonical_json",
  ]) {
    assert.ok(typeSource.includes(requiredText), `${typePath} must include ${requiredText}`);
  }
}

function assertPackageScript() {
  if (durablePerspectiveStateTrajectoryImplementationSliceActive()) {
    assertDurablePerspectiveStateTrajectoryImplementationPackageScript();
    return;
  }
  assert.equal(packageJson.scripts[packageScriptName], packageScriptValue);
  const packageAddedLines = readGitOutput([
    "diff",
    "--unified=0",
    mergeBaseRef(),
    "--",
    packagePath,
  ])
    .split("\n")
    .filter((line) => line.startsWith("+") && !line.startsWith("+++"));
  const addedScriptNames = packageAddedLines
    .map((line) => line.match(/^\+\s+"([^"]+)"\s*:/)?.[1] ?? null)
    .filter(Boolean)
    .sort();
  assert.deepEqual(
    addedScriptNames,
    [packageScriptName],
    "package.json must add only the Durable Perspective State / Trajectory contract smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"\s*:/);
  if (typeof basePackageJson !== "undefined") {
    assert.deepEqual(packageJson.dependencies, basePackageJson.dependencies);
    assert.deepEqual(packageJson.devDependencies, basePackageJson.devDependencies);
    assert.deepEqual(
      packageJson.optionalDependencies ?? {},
      basePackageJson.optionalDependencies ?? {},
    );
  }
}

function assertStaticBoundary() {
  const changedFiles = readChangedFiles();
  if (durablePerspectiveStateTrajectoryImplementationSliceActive()) {
    assertDurablePerspectiveStateTrajectoryImplementationChangedFiles(changedFiles);
    return;
  }
  for (const unchangedPath of protectedUnchangedPaths) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      `Durable Perspective State / Trajectory contract slice must not change ${unchangedPath}`,
    );
  }
  for (const expectedFile of expectedChangedFiles) {
    assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedChangedFiles.includes(changedFile),
      `unexpected changed file in Durable Perspective State / Trajectory contract slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /^lib\/research-retrieval\//, "must not add retrieval implementation files");
    assert.doesNotMatch(changedFile, /^lib\/research-rag\//, "must not add RAG implementation files");
    assert.doesNotMatch(changedFile, /^lib\/.*perspective.*state/i, "must not add runtime Perspective state files");
    assert.doesNotMatch(changedFile, /^lib\/.*perspective.*snapshot/i, "must not add runtime PerspectiveSnapshot files");
    assert.doesNotMatch(changedFile, /^lib\/.*trajectory/i, "must not add runtime trajectory builder files");
    assert.doesNotMatch(changedFile, /^lib\/.*promotion/i, "must not add runtime promotion implementation files");
    assert.doesNotMatch(changedFile, /^lib\/.*(proof|evidence).*write/i, "must not add proof/evidence write files");
    assert.doesNotMatch(changedFile, /(^|\/)(provider|openai|source-fetch|crawler)\b/i);
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
}

function durablePerspectiveStateTrajectoryImplementationSliceActive() {
  return readChangedFiles().includes(implementationSmokePath);
}

function assertDurablePerspectiveStateTrajectoryImplementationPackageScript() {
  const packageAddedLines = readGitOutput([
    "diff",
    "--unified=0",
    mergeBaseRef(),
    "--",
    packagePath,
  ])
    .split("\n")
    .filter((line) => line.startsWith("+") && !line.startsWith("+++"));
  const addedScriptNames = packageAddedLines
    .map((line) => line.match(/^\+\s+"([^"]+)"\s*:/)?.[1] ?? null)
    .filter(Boolean)
    .sort();
  assert.equal(
    packageJson.scripts[implementationPackageScriptName],
    implementationPackageScriptValue,
  );
  assert.deepEqual(
    addedScriptNames,
    [implementationPackageScriptName],
    "package.json must add only the Durable Perspective State / Trajectory implementation smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"\s*:/);
  if (typeof basePackageJson !== "undefined") {
    assert.deepEqual(packageJson.dependencies, basePackageJson.dependencies);
    assert.deepEqual(packageJson.devDependencies, basePackageJson.devDependencies);
    assert.deepEqual(
      packageJson.optionalDependencies ?? {},
      basePackageJson.optionalDependencies ?? {},
    );
  }
}

function assertDurablePerspectiveStateTrajectoryImplementationChangedFiles(
  changedFiles,
) {
  const expectedFiles = [
    implementationBuilderPath,
    implementationFixturePath,
    implementationSmokePath,
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
    smokePath,
    ...downstreamSmokePaths,
  ];
  for (const unchangedPath of [
    typePath,
    fixturePath,
    sourceValidationFixturePath,
    "types/human-reviewed-durable-perspective-promotion-contract.ts",
    "fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-contract.sample.v0.1.json",
    "lib/research-candidate-review/human-reviewed-durable-perspective-promotion.ts",
    "fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-implementation.sample.v0.1.json",
    "fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-browser-validation.sample.v0.1.json",
    "lib/research-candidate-review/non-authoritative-retrieval-rag.ts",
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-implementation.sample.v0.1.json",
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-browser-validation.sample.v0.1.json",
    "lib/research-candidate-review/operator-source-candidate-generation.ts",
    "fixtures/research-candidate-review.operator-source-candidate-generation-implementation.sample.v0.1.json",
    "lib/research-candidate-review/bounded-external-source-intake.ts",
    "fixtures/research-candidate-review.bounded-external-source-intake-implementation.sample.v0.1.json",
    "lib/research-candidate-review/salience-governor.ts",
    "fixtures/research-candidate-review.salience-governor-implementation.sample.v0.1.json",
    "lib/research-candidate-review/recent-rehearsal-buffer.ts",
    "fixtures/research-candidate-review.recent-rehearsal-buffer-implementation.sample.v0.1.json",
    "lib/db/schema.sql",
  ]) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      "Durable Perspective State / Trajectory implementation slice must not change " +
        unchangedPath,
    );
  }
  for (const expectedFile of [
    implementationBuilderPath,
    implementationFixturePath,
    implementationSmokePath,
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
    smokePath,
  ]) {
    assert.ok(changedFiles.includes(expectedFile), "changed files must include " + expectedFile);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      "unexpected changed file in Durable Perspective State / Trajectory implementation downstream slice: " +
        changedFile,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /^lib\/research-retrieval\//, "must not add retrieval implementation files");
    assert.doesNotMatch(changedFile, /^lib\/research-rag\//, "must not add RAG implementation files");
    if (changedFile !== implementationBuilderPath) {
      assert.doesNotMatch(changedFile, /^lib\/.*perspective.*state/i, "must not add runtime Perspective state files");
      assert.doesNotMatch(changedFile, /^lib\/.*perspective.*snapshot/i, "must not add runtime PerspectiveSnapshot files");
      assert.doesNotMatch(changedFile, /^lib\/.*trajectory/i, "must not add runtime trajectory builder files");
    }
    assert.doesNotMatch(changedFile, /^lib\/.*promotion/i, "must not add runtime promotion implementation files");
    assert.doesNotMatch(changedFile, /^lib\/.*(proof|evidence).*write/i, "must not add proof/evidence write files");
    assert.doesNotMatch(changedFile, /(^|\/)(provider|openai|source-fetch|crawler)\b/i);
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
  for (const requiredText of [
    implementationVersion,
    implementationBuilderPath,
    implementationFixturePath,
    implementationSmokePath,
    implementationPackageScriptName,
    implementationRecommendationStatus,
    implementationNextRecommendedSlice,
    "deterministic fixture-backed implementation only",
    "current thesis has lineage",
    "product-write remains parked by #686",
  ]) {
    assert.ok(
      smokeSource.includes(requiredText),
      "#733 contract smoke must allow Durable Perspective State / Trajectory implementation downstream pointer: " +
        requiredText,
    );
  }
}

function assertNoForbiddenRuntimePatterns() {
  const changedSourceFiles = readChangedFiles().filter((filePath) =>
    filePath !== typePath &&
    (filePath.endsWith(".ts") || filePath.endsWith(".tsx") || filePath.endsWith(".mjs")) &&
    !filePath.startsWith("scripts/smoke-") &&
    !filePath.startsWith("types/"),
  );
  for (const filePath of changedSourceFiles) {
    const source = stripValidationText(readFile(filePath));
    for (const { label, regex } of [
      { label: "route handler", regex: /\bexport\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\b/ },
      { label: "server action", regex: /["']use server["']/ },
      { label: "browser request", regex: /\bfetch\s*\(|\bXMLHttpRequest\b|navigator\.sendBeacon/ },
      { label: "browser persistence", regex: /\blocalStorage\b|\bsessionStorage\b|\bindexedDB\b|document\.cookie/ },
      { label: "DB open", regex: /\bnew\s+Database\b|\bopenDatabase\b|better-sqlite3/i },
      { label: "runtime DB query", regex: /\bdb\.(prepare|query|exec)\b|\bSELECT\b/i },
      { label: "production DB read", regex: /\bproductionDb\b|\bAUGNES_DB_PATH\b/i },
      { label: "DB write", regex: /\bdb\.(insert|update|delete|transaction)\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b/i },
      { label: "durable memory write", regex: /\b(write|insert|persist)DurableMemory\b|\bdurableMemoryWrite\b/i },
      { label: "source fetch", regex: /\bfetchSource\b|\bsourceFetch\b|\bfetch\s*\(/ },
      { label: "crawler execution", regex: /\brunCrawler\b|\bcrawlDomain\b|\bcrawlerSeed\b/i },
      { label: "external HTTP request", regex: /\bhttps?\.request\b|\bXMLHttpRequest\b/ },
      { label: "provider extraction", regex: /\bproviderExtract\b|\brunProviderExtraction\b/i },
      { label: "OpenAI import", regex: /from\s+["'][^"']*openai["']/i },
      { label: "OpenAI constructor", regex: /new\s+OpenAI\b/i },
      { label: "retrieval/RAG execution", regex: /\brunRetrieval\b|\brunRag\b|\brunRAG\b|\bexecuteRetrieval\b/i },
      { label: "search runtime execution", regex: /\bsearchIndex\b|\bexecuteSearch\b|\brunSearch\b/i },
      { label: "index build/write", regex: /\bbuildIndex\b|\bwriteIndex\b|\bsourceIndexWrite\b|\bwriteSourceIndex\b/i },
      { label: "embedding/vector/FTS implementation", regex: /\bcreateEmbedding\b|\bgenerateEmbedding\b|\bvectorIndex\b|\bvectorDb\b|\bFTS5\b|\bfullTextSearch\b/i },
      { label: "durable source record write", regex: /\bwriteDurableSourceRecord\b|\binsertDurableSourceRecord\b|\bpersistDurableSourceRecord\b|\bdurableSourceRecordWrite\b/i },
      { label: "candidate record write", regex: /\bwriteCandidateRecord\b|\binsertCandidateRecord\b|\bpersistCandidateRecord\b/i },
      { label: "candidate mutation", regex: /\bmutateCandidate\b|\bupdateCandidate\b|\bdeleteCandidate\b/ },
      { label: "proof/evidence write", regex: /\b(write|insert|persist)(Proof|Evidence)\b|\bproof_or_evidence_record_write_now:\s*true\b/i },
      { label: "accepted evidence write", regex: /\b(write|insert|persist)AcceptedEvidence\b|\baccepted_evidence_write_now:\s*true\b/i },
      { label: "runtime promotion", regex: /\bpromotePerspective\b|\brunPerspectivePromotion\b|\bruntime_promotion_implemented_now:\s*true\b/i },
      { label: "durable Perspective state write/read", regex: /\bwriteDurablePerspective\b|\breadDurablePerspective\b|\bdurable_perspective_state_write_now:\s*true\b/i },
      { label: "durable Perspective delta apply", regex: /\bapplyDurablePerspectiveDelta\b|\bdurable_perspective_delta_apply_now:\s*true\b/i },
      { label: "PerspectiveSnapshot runtime", regex: /\bcreatePerspectiveSnapshot\b|\bloadPerspectiveSnapshot\b|\bperspective_snapshot_runtime_implemented_now:\s*true\b/i },
      { label: "trajectory runtime build", regex: /\bbuildPerspectiveTrajectory\b|\btrajectory_runtime_build_implemented_now:\s*true\b/i },
      { label: "promotion decision record", regex: /\bpromotionDecisionRecord\b|\bwritePromotionDecision\b|\bpromotion_decision_record_write_now:\s*true\b/i },
      { label: "Formation Receipt write", regex: /\bwriteFormationReceipt\b|\bformation_receipt_write_now:\s*true\b/i },
      { label: "promotion history write", regex: /\bwritePromotionHistory\b|\bpromotion_history_write_now:\s*true\b/i },
      { label: "retirement history write", regex: /\bwriteRetirementHistory\b|\bretirement_history_write_now:\s*true\b/i },
      { label: "work mutation", regex: /\bmutateWork\b|\bupdateWork\b|\bwork_mutation_now:\s*true\b/i },
      { label: "salience authority true", regex: /\bsalience_authority:\s*true\b|\bsalience_score_used_as_authority_now:\s*true\b/i },
      { label: "Codex product execution", regex: /\bcodex\s+(exec|run)\b/i },
      { label: "GitHub automation", regex: /\bgh\s+pr\b|Octokit|api\.github\.com/i },
      { label: "external handoff send", regex: /\bsendExternalHandoff\b/ },
      { label: "agent execution", regex: /\bexecuteAgent\b|\brouteAgent\b/ },
      { label: "product write", regex: /\bproductWrite\b|\bwriteProduct\b|\bproduct_write_authority:\s*true\b/i },
      { label: "product ID allocation", regex: /\ballocateProductId\b|\bproduct_id_allocation_authority:\s*true\b/i },
    ]) {
      assert.doesNotMatch(source, regex, `${filePath} must not include ${label}`);
    }
  }
}

function assertContractShape(value) {
  assert.equal(value.contract_kind, contractKind);
  assert.equal(value.contract_version, contractVersion);
  assert.equal(
    value.source_promotion_validation_ref,
    `${sourceValidationFixture.validation_version}:${sourceValidationFixturePath}#732`,
  );
  assert.equal(
    value.source_promotion_validation_fingerprint,
    sourceValidationFixture.validation_fingerprint,
  );
  assert.equal(value.recommendation_status, recommendationStatus);
  assert.equal(value.next_recommended_slice, nextRecommendedSlice);
  assert.equal(value.fingerprint_algorithm, "fnv1a32_canonical_json");
  assert.equal(value.contract_fingerprint, createContractFingerprint(value));
}

function assertContractScope(scope) {
  assert.equal(scope.durable_perspective_state_contract_only, true);
  for (const [key, value] of Object.entries(scope)) {
    if (key === "durable_perspective_state_contract_only") {
      assert.equal(value, true);
    } else {
      assert.equal(value, false, `contract_scope.${key} must be false`);
    }
  }
}

function assertStateFields(fields) {
  assert.deepEqual(fields, buildStateFields());
}

function assertTrajectoryEventFamilies(families) {
  assert.deepEqual(
    families.map((family) => family.event_kind),
    buildTrajectoryEventFamilies().map((family) => family.event_kind),
  );
  for (const family of families) {
    assert.equal(family.runtime_write_now, false);
  }
  assert.equal(
    families.find((family) => family.event_kind === "initial_perspective_state")
      .lineage_required,
    true,
  );
  assert.equal(
    families.find((family) => family.event_kind === "claim_retired")
      .prior_claim_remains_auditable,
    true,
  );
  assert.equal(
    families.find((family) => family.event_kind === "salience_reweighted")
      .salience_not_authority,
    true,
  );
}

function assertLineagePolicy(policy) {
  assert.deepEqual(policy, buildLineagePolicy());
}

function assertEvidencePolicy(policy) {
  assert.deepEqual(policy, buildEvidencePolicy());
}

function assertSnapshotPolicy(policy) {
  assert.deepEqual(policy, buildSnapshotPolicy());
}

function assertSaliencePolicy(policy) {
  assert.deepEqual(policy, buildSaliencePolicy());
}

function assertSamplePreview(preview) {
  assert.equal(preview.preview_version, previewVersion);
  assert.ok(preview.operator_context_ref.startsWith("operator_context:public:"));
  const state = preview.perspective_state_preview;
  assert.equal(state.perspective_id, "perspective_ref:public:example_state_trajectory_contract");
  for (const field of buildStateFields()) {
    assert.ok(Object.hasOwn(state, field), `sample state preview must include ${field}`);
  }
  assert.equal(state.current_thesis.not_written_now, true);
  assert.ok(state.current_thesis.lineage_refs.length > 0);
  assert.ok(state.current_thesis.promotion_record_refs.length > 0);
  assert.equal(state.prior_theses[0].preserved_for_audit, true);
  assert.equal(state.prior_theses[0].not_deleted, true);
  assert.equal(state.active_claims[0].claim_is_durable_state_preview_only, true);
  assert.equal(state.active_claims[0].not_written_now, true);
  assert.notDeepEqual(
    state.supporting_evidence_refs,
    state.contradicting_evidence_refs,
  );
  assert.ok(state.supporting_evidence_refs[0].startsWith("accepted_evidence_ref:public:"));
  assert.ok(state.contradicting_evidence_refs[0].startsWith("accepted_evidence_ref:public:"));
  assert.equal(state.open_tensions[0].preserved, true);
  assert.equal(state.knowledge_gaps[0].deferred_or_open, true);
  assert.equal(state.salience_state.display_context_only, true);
  assert.equal(state.salience_state.not_authority, true);
  assert.equal(state.promotion_history[0].append_only_later, true);
  assert.equal(state.promotion_history[0].not_written_now, true);
  assert.equal(state.retirement_history[0].append_only_later, true);
  assert.equal(state.retirement_history[0].not_written_now, true);
  assert.equal(state.reuse_conditions[0].not_written_now, true);
  const trajectory = preview.trajectory_preview;
  assert.equal(
    trajectory.trajectory_version,
    "durable_perspective_trajectory_preview.v0.1",
  );
  assert.equal(
    trajectory.trajectory_events.length,
    buildTrajectoryEventFamilies().length,
  );
  assert.deepEqual(
    trajectory.trajectory_events.map((event) => event.event_kind),
    buildTrajectoryEventFamilies().map((family) => family.event_kind),
  );
  assert.equal(trajectory.all_events_public_safe, true);
  assert.equal(trajectory.all_events_runtime_write_now_false, true);
  assert.equal(trajectory.all_events_source_ref_backed, true);
  assert.equal(trajectory.all_events_preserve_lineage, true);
  for (const event of trajectory.trajectory_events) {
    assert.equal(event.runtime_write_now, false);
    assert.equal(event.public_safe, true);
    assert.ok(event.source_refs.length > 0);
    assert.ok(event.lineage_refs.length > 0);
  }
  const snapshot = preview.perspective_snapshot_preview;
  assert.equal(snapshot.snapshot_version, "perspective_snapshot_preview.v0.1");
  assert.equal(snapshot.snapshot_is_derived_view, true);
  assert.equal(snapshot.snapshot_runtime_now, false);
  assert.equal(snapshot.includes_lineage_refs, true);
  assert.equal(snapshot.includes_current_thesis, true);
  assert.equal(snapshot.includes_prior_theses, true);
  assert.equal(snapshot.includes_active_claims, true);
  assert.equal(snapshot.includes_supporting_and_contradicting_evidence_refs, true);
  assert.equal(snapshot.includes_open_tensions, true);
  assert.equal(snapshot.includes_knowledge_gaps, true);
  assert.equal(snapshot.includes_authority_boundary, true);
  assert.deepEqual(preview.validation_policy, buildValidationPolicy());
  assert.equal(Object.hasOwn(preview.authority_boundary, "implementation_added_now"), false);
}

function assertAuthorityBoundary(boundary) {
  assert.equal(boundary.contract_added_now, true);
  assert.equal(boundary.implementation_added_now, false);
  assert.equal(boundary.product_write_lane_parked_by_686, true);
  for (const [key, value] of Object.entries(boundary)) {
    if (key === "contract_added_now" || key === "product_write_lane_parked_by_686") {
      assert.equal(value, true, `${key} must be true`);
    } else {
      assert.equal(value, false, `${key} must be false`);
    }
  }
}

function assertValidationPolicy(policy) {
  assert.deepEqual(policy, buildValidationPolicy());
}

function assertPrivacyPolicy(policy) {
  assert.deepEqual(policy, buildPrivacyPolicy());
}

function assertDocsPointers() {
  for (const requiredText of [
    "Durable Perspective State / Trajectory contract v0.1",
    typePath,
    fixturePath,
    smokePath,
    "contract-only, fixture-only, smoke-only",
    "defines future durable Perspective state shape and trajectory grammar",
    "current thesis has lineage",
    "prior thesis is not overwritten silently",
    "prior theses are preserved",
    "retired claims remain auditable",
    "contradicted evidence is not deleted",
    "open tensions are preserved or explicitly resolved",
    "knowledge gaps are preserved, explicitly deferred, or closed",
    "supporting evidence refs and contradicting evidence refs are distinct",
    "candidate evidence is not accepted evidence",
    "accepted evidence refs required for accepted evidence claims",
    "promotion history append-only later",
    "retirement history append-only later",
    "PerspectiveSnapshot shape defined only",
    "PerspectiveSnapshot is derived view, not independent source of truth",
    "salience state is display/reuse context only",
    "salience state is not authority",
    "no runtime state read/write",
    "no durable Perspective delta apply",
    "no PerspectiveSnapshot runtime",
    "no trajectory runtime build",
    "no proof/evidence write",
    "no accepted evidence write",
    "no Formation Receipt write",
    "no work mutation",
    "no DB write/query",
    "no schema/migration",
    "no route or UI",
    "no browser request",
    "no provider/OpenAI call",
    "no retrieval/RAG execution",
    "no product write/product IDs",
    "product-write remains parked by #686",
    nextRecommendedSlice,
  ]) {
    assert.ok(indexDoc.includes(requiredText), `index doc must include ${requiredText}`);
  }
  for (const requiredText of [
    "Durable Perspective State / Trajectory contract defines future committed Perspective state shape and trajectory grammar only.",
    "Agent Substrate remains advisory-only and cannot read/write durable Perspective state.",
    "PerspectiveSnapshot is a future derived view, not independent source of truth.",
    "Salience state is display/reuse context only and not authority.",
    "This slice does not implement runtime state read/write, durable Perspective delta apply, proof/evidence writes, Formation Receipt writes, DB writes, route/UI, provider/OpenAI, retrieval/RAG, or product write.",
    "Next recommended slice is Durable Perspective State / Trajectory implementation v0.1.",
  ]) {
    assert.ok(substrateDoc.includes(requiredText), `substrate doc must include ${requiredText}`);
  }
  for (const requiredText of [
    "Durable Perspective State / Trajectory remains separated from candidate preview and promotion preview.",
    "PerspectiveDeltaCandidate is not committed state.",
    "Only future human/Core promotion can create durable Perspective state changes.",
    "Current thesis must have lineage.",
    "Prior thesis must not be overwritten silently.",
    "Retired claims remain auditable.",
    "Contradicted evidence is not deleted.",
    "Open tensions and knowledge gaps must remain visible unless explicitly handled.",
    "This slice does not implement runtime DB/browser/provider/source-fetch/retrieval/promotion/state behavior.",
  ]) {
    assert.ok(surfaceDoc.includes(requiredText), `surface doc must include ${requiredText}`);
    assert.ok(gateDoc.includes(requiredText), `gate doc must include ${requiredText}`);
  }
}

function assertSourceValidationDownstreamPointer() {
  for (const requiredText of [
    contractVersion,
    typePath,
    fixturePath,
    smokePath,
    packageScriptName,
    recommendationStatus,
    nextRecommendedSlice,
    "future durable Perspective state shape and trajectory grammar",
    "current thesis has lineage",
    "prior thesis is not overwritten silently",
    "product-write remains parked by #686",
  ]) {
    assert.ok(
      sourceValidationSmoke.includes(requiredText),
      `#732 browser validation smoke must allow Durable Perspective State / Trajectory contract downstream pointer: ${requiredText}`,
    );
  }
}

function assertPortableMergeBaseFallback() {
  for (const requiredText of [
    "cachedMergeBaseRef",
    "gitRefExists(\"origin/main\")",
    "gitRefExists(\"main\")",
    "rev-parse",
    "HEAD^",
    "Unable to determine a base ref for static changed-file validation",
  ]) {
    assert.ok(smokeSource.includes(requiredText), `smoke must include portable merge base fallback: ${requiredText}`);
  }
}

function readFile(filePath) {
  return readFileSync(filePath, "utf8");
}

function readJson(filePath) {
  return JSON.parse(readFile(filePath));
}

function readJsonFromGit(filePath) {
  return JSON.parse(readGitOutput(["show", `${mergeBaseRef()}:${filePath}`]));
}

function readChangedFiles() {
  const changed = [
    ...readGitOutput(["diff", "--name-only", mergeBaseRef()]).split("\n"),
    ...readGitOutput(["diff", "--cached", "--name-only"]).split("\n"),
    ...readGitOutput(["ls-files", "--others", "--exclude-standard"]).split("\n"),
  ]
    .map((line) => line.trim())
    .filter(Boolean);
  return [...new Set(changed)].sort();
}

function stripValidationText(source) {
  return source
    .replace(/\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(["'`])(?:\\.|(?!\1)[\s\S])*\1/g, "\"\"");
}

function mergeBaseRef() {
  if (cachedMergeBaseRef) {
    return cachedMergeBaseRef;
  }
  if (gitRefExists("origin/main")) {
    const mergeBase = tryGitOutput(["merge-base", "HEAD", "origin/main"])?.trim();
    if (mergeBase) {
      cachedMergeBaseRef = mergeBase;
      return cachedMergeBaseRef;
    }
  }
  if (gitRefExists("main")) {
    const mergeBase = tryGitOutput(["merge-base", "HEAD", "main"])?.trim();
    if (mergeBase) {
      cachedMergeBaseRef = mergeBase;
      return cachedMergeBaseRef;
    }
  }
  const parentRef = tryGitOutput(["rev-parse", "--verify", "HEAD^"])?.trim();
  if (parentRef) {
    cachedMergeBaseRef = parentRef;
    return cachedMergeBaseRef;
  }
  throw new Error(
    "Unable to determine a base ref for static changed-file validation. " +
      "Expected origin/main, local main, or HEAD^ to resolve.",
  );
}

function gitRefExists(ref) {
  return tryGitOutput(["rev-parse", "--verify", ref]) !== null;
}

function tryGitOutput(args) {
  try {
    return readGitOutput(args);
  } catch {
    return null;
  }
}

function readGitOutput(args) {
  return execFileSync("git", args, { encoding: "utf8" });
}

function createContractFingerprint(value) {
  const normalized = clone(value);
  normalized.contract_fingerprint = "";
  return `fnv1a32:${fnv1a32(canonicalJson(normalized))}`;
}

function canonicalJson(value) {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value) {
  if (Array.isArray(value)) {
    return value.map(sortKeys);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, nested]) => [key, sortKeys(nested)]),
    );
  }
  return value;
}

function fnv1a32(input) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
