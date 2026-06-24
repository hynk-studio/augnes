import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const typePath = "types/agent-perspective-substrate-feedback-loop-contract.ts";
const fixturePath =
  "fixtures/research-candidate-review.agent-perspective-substrate-feedback-loop-contract.sample.v0.1.json";
const smokePath =
  "scripts/smoke-agent-perspective-substrate-feedback-loop-contract-v0-1.mjs";
const sourceValidationFixturePath =
  "fixtures/research-candidate-review.perspective-packet-receipt-linkage-browser-validation.sample.v0.1.json";
const sourceValidationSmokePath =
  "scripts/smoke-perspective-packet-receipt-linkage-browser-validation-v0-1.mjs";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const substrateDocPath = "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md";
const surfaceDocPath = "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md";
const gateDocPath =
  "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md";

const packageScriptName =
  "smoke:agent-perspective-substrate-feedback-loop-contract-v0-1";
const packageScriptValue =
  "node scripts/smoke-agent-perspective-substrate-feedback-loop-contract-v0-1.mjs";
const contractKind = "agent_perspective_substrate_feedback_loop_contract";
const contractVersion =
  "agent_perspective_substrate_feedback_loop_contract.v0.1";
const previewVersion =
  "agent_perspective_substrate_feedback_loop_preview.v0.1";
const feedbackVersion = "agent_perspective_substrate_feedback_loop.v0.1";
const recommendationStatus =
  "ready_for_agent_perspective_substrate_feedback_loop_implementation_v0_1";
const nextRecommendedSlice =
  "agent_perspective_substrate_feedback_loop_implementation_v0_1";
const writeFixture = process.argv.includes("--write-fixture");
let cachedMergeBaseRef = null;

const downstreamSmokePaths = [
  "scripts/smoke-ai-context-packet-browser-validation-v0-1.mjs",
  "scripts/smoke-ai-context-packet-contract-v0-1.mjs",
  "scripts/smoke-ai-context-packet-implementation-v0-1.mjs",
  "scripts/smoke-bounded-external-source-intake-browser-validation-v0-1.mjs",
  "scripts/smoke-bounded-external-source-intake-contract-v0-1.mjs",
  "scripts/smoke-bounded-external-source-intake-implementation-v0-1.mjs",
  "scripts/smoke-codex-handoff-draft-browser-validation-v0-1.mjs",
  "scripts/smoke-codex-handoff-draft-contract-v0-1.mjs",
  "scripts/smoke-codex-handoff-draft-implementation-v0-1.mjs",
  "scripts/smoke-durable-perspective-state-trajectory-browser-validation-v0-1.mjs",
  "scripts/smoke-durable-perspective-state-trajectory-contract-v0-1.mjs",
  "scripts/smoke-durable-perspective-state-trajectory-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-aggregation-read-model-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-aggregation-read-model-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-aggregation-read-model-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-controls-ui-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-controls-ui-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-controls-ui-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-route-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-route-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-route-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-ui-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-ui-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-ui-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-minimal-v0-1.mjs",
  "scripts/smoke-feedback-event-store-review-controls-preview-v0-1.mjs",
  "scripts/smoke-feedback-event-write-route-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-write-route-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-write-route-implementation-v0-1.mjs",
  "scripts/smoke-formation-receipt-durable-event-browser-validation-v0-1.mjs",
  "scripts/smoke-formation-receipt-durable-event-contract-v0-1.mjs",
  "scripts/smoke-formation-receipt-durable-event-implementation-v0-1.mjs",
  "scripts/smoke-human-reviewed-durable-perspective-promotion-browser-validation-v0-1.mjs",
  "scripts/smoke-human-reviewed-durable-perspective-promotion-contract-v0-1.mjs",
  "scripts/smoke-human-reviewed-durable-perspective-promotion-implementation-v0-1.mjs",
  "scripts/smoke-non-authoritative-retrieval-rag-browser-validation-v0-1.mjs",
  "scripts/smoke-non-authoritative-retrieval-rag-contract-v0-1.mjs",
  "scripts/smoke-non-authoritative-retrieval-rag-implementation-v0-1.mjs",
  "scripts/smoke-operator-source-candidate-generation-browser-validation-v0-1.mjs",
  "scripts/smoke-operator-source-candidate-generation-contract-v0-1.mjs",
  "scripts/smoke-operator-source-candidate-generation-implementation-v0-1.mjs",
  "scripts/smoke-perspective-geometry-digest-browser-validation-v0-1.mjs",
  "scripts/smoke-perspective-geometry-digest-contract-v0-1.mjs",
  "scripts/smoke-perspective-geometry-digest-implementation-v0-1.mjs",
  "scripts/smoke-perspective-packet-receipt-linkage-browser-validation-v0-1.mjs",
  "scripts/smoke-perspective-packet-receipt-linkage-contract-v0-1.mjs",
  "scripts/smoke-perspective-packet-receipt-linkage-implementation-v0-1.mjs",
  "scripts/smoke-project-constellation-runtime-layout-browser-validation-v0-1.mjs",
  "scripts/smoke-project-constellation-runtime-layout-contract-v0-1.mjs",
  "scripts/smoke-project-constellation-runtime-layout-implementation-v0-1.mjs",
  "scripts/smoke-recent-rehearsal-buffer-browser-validation-v0-1.mjs",
  "scripts/smoke-recent-rehearsal-buffer-contract-v0-1.mjs",
  "scripts/smoke-recent-rehearsal-buffer-implementation-v0-1.mjs",
  "scripts/smoke-salience-governor-browser-validation-v0-1.mjs",
  "scripts/smoke-salience-governor-contract-v0-1.mjs",
  "scripts/smoke-salience-governor-implementation-v0-1.mjs",
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
  sourceValidationSmokePath,
  ...downstreamSmokePaths,
];

const protectedUnchangedPaths = [
  sourceValidationFixturePath,
  "types/perspective-packet-receipt-linkage-contract.ts",
  "fixtures/research-candidate-review.perspective-packet-receipt-linkage-contract.sample.v0.1.json",
  "lib/research-candidate-review/perspective-packet-receipt-linkage.ts",
  "fixtures/research-candidate-review.perspective-packet-receipt-linkage-implementation.sample.v0.1.json",
  "types/codex-handoff-draft-contract.ts",
  "fixtures/research-candidate-review.codex-handoff-draft-contract.sample.v0.1.json",
  "lib/research-candidate-review/codex-handoff-draft.ts",
  "fixtures/research-candidate-review.codex-handoff-draft-implementation.sample.v0.1.json",
  "types/ai-context-packet-contract.ts",
  "fixtures/research-candidate-review.ai-context-packet-contract.sample.v0.1.json",
  "lib/research-candidate-review/ai-context-packet.ts",
  "fixtures/research-candidate-review.ai-context-packet-implementation.sample.v0.1.json",
  "types/perspective-geometry-digest-contract.ts",
  "fixtures/research-candidate-review.perspective-geometry-digest-contract.sample.v0.1.json",
  "lib/research-candidate-review/perspective-geometry-digest.ts",
  "fixtures/research-candidate-review.perspective-geometry-digest-implementation.sample.v0.1.json",
  "lib/research-candidate-review/project-constellation-runtime-layout.ts",
  "fixtures/research-candidate-review.project-constellation-runtime-layout-implementation.sample.v0.1.json",
  "lib/research-candidate-review/durable-perspective-state-trajectory.ts",
  "fixtures/research-candidate-review.durable-perspective-state-trajectory-implementation.sample.v0.1.json",
  "lib/research-candidate-review/non-authoritative-retrieval-rag.ts",
  "fixtures/research-candidate-review.non-authoritative-retrieval-rag-implementation.sample.v0.1.json",
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
assertSourceValidationUnchanged();
assertTypeContract();
assertPackageScript();
assertStaticBoundary();
assertNoForbiddenRuntimePatterns();
assertContractShape(fixture);
assertContractScope(fixture.contract_scope);
assertFeedbackPrinciples(fixture.feedback_principles);
assertFeedbackKinds(fixture.feedback_kinds);
assertInputFields(fixture.feedback_input_fields);
assertOutputFields(fixture.feedback_output_fields);
assertTargetKinds(fixture.feedback_target_kinds);
assertSectionFamilies(fixture.feedback_section_families);
assertForbiddenActionsPolicy(fixture.forbidden_actions_policy);
assertSamplePreview(
  fixture.sample_agent_perspective_substrate_feedback_loop_preview,
);
assertAuthorityBoundary(fixture.authority_boundary);
assertValidationPolicy(fixture.validation_policy);
assertPrivacyPolicy(fixture.privacy_policy);
assertDocsPointers();
assertSourceValidationDownstreamPointer();
assertPortableMergeBaseFallback();
assert.deepEqual(
  fixture,
  rebuiltFixture,
  "rebuilt Agent Perspective Substrate Feedback Loop contract fixture must match committed fixture",
);

console.log(
  JSON.stringify(
    {
      smoke: "agent-perspective-substrate-feedback-loop-contract-v0-1",
      final_status: "pass",
      contract_kind: fixture.contract_kind,
      contract_version: fixture.contract_version,
      source_packet_receipt_linkage_validation_fingerprint:
        fixture.source_packet_receipt_linkage_validation_fingerprint,
      feedback_kind_count: fixture.feedback_kinds.length,
      feedback_target_kind_count: fixture.feedback_target_kinds.length,
      feedback_is_operator_signal_not_truth:
        fixture.feedback_principles.feedback_is_operator_signal_not_truth,
      dismiss_is_not_deletion:
        fixture.feedback_principles.dismiss_is_not_deletion,
      pin_is_not_promotion: fixture.feedback_principles.pin_is_not_promotion,
      feedback_loop_runtime_build_implemented_now:
        fixture.authority_boundary.feedback_loop_runtime_build_implemented_now,
      feedback_event_write_now:
        fixture.authority_boundary.feedback_event_write_now,
      agent_substrate_mutation_now:
        fixture.authority_boundary.agent_substrate_mutation_now,
      product_write_lane_parked_by_686:
        fixture.authority_boundary.product_write_lane_parked_by_686,
      next_recommended_slice: fixture.next_recommended_slice,
    },
    null,
    2,
  ),
);

function buildContractFixture() {
  const contract = {
    contract_kind: contractKind,
    contract_version: contractVersion,
    source_packet_receipt_linkage_validation_ref:
      `${sourceValidationFixture.validation_version}:${sourceValidationFixturePath}#750`,
    source_packet_receipt_linkage_validation_fingerprint:
      sourceValidationFixture.validation_fingerprint,
    contract_scope: buildContractScope(),
    feedback_principles: buildFeedbackPrinciples(),
    feedback_kinds: buildFeedbackKinds(),
    feedback_input_fields: expectedInputFields(),
    feedback_output_fields: expectedOutputFields(),
    feedback_target_kinds: expectedTargetKinds(),
    feedback_section_families: buildFeedbackSectionFamilies(),
    forbidden_actions_policy: buildForbiddenActionsPolicy(),
    sample_agent_perspective_substrate_feedback_loop_preview: buildSamplePreview(),
    authority_boundary: buildAuthorityBoundary(),
    validation_policy: buildValidationPolicy(),
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
    agent_perspective_substrate_feedback_loop_contract_only: true,
    feedback_loop_runtime_build_now: false,
    feedback_event_write_now: false,
    feedback_event_mutation_now: false,
    feedback_event_store_write_now: false,
    agent_substrate_mutation_now: false,
    agent_substrate_execution_now: false,
    salience_write_now: false,
    durable_salience_write_now: false,
    recent_rehearsal_buffer_write_now: false,
    durable_memory_write_now: false,
    linkage_runtime_build_now: false,
    linkage_record_write_now: false,
    durable_audit_log_write_now: false,
    formation_receipt_write_now: false,
    formation_receipt_runtime_mutation_now: false,
    codex_execution_now: false,
    github_automation_now: false,
    github_pr_creation_now: false,
    git_branch_creation_now: false,
    git_commit_creation_now: false,
    external_handoff_sending_now: false,
    agent_routing_now: false,
    agent_execution_now: false,
    ai_context_packet_runtime_build_now: false,
    ai_context_packet_write_now: false,
    provider_openai_call_now: false,
    retrieval_rag_execution_now: false,
    source_fetch_now: false,
    crawler_now: false,
    runtime_geometry_digest_build_now: false,
    geometry_digest_write_now: false,
    runtime_layout_execution_now: false,
    graph_mutation_now: false,
    durable_perspective_state_read_now: false,
    durable_perspective_state_write_now: false,
    durable_perspective_delta_apply_now: false,
    perspective_snapshot_runtime_now: false,
    proof_evidence_write_now: false,
    accepted_evidence_write_now: false,
    work_mutation_now: false,
    runtime_db_query_now: false,
    runtime_db_write_now: false,
    schema_migration_now: false,
    route_ui_now: false,
    browser_request_now: false,
    product_write_now: false,
  };
}

function buildFeedbackPrinciples() {
  return {
    feedback_is_operator_signal_not_truth: true,
    feedback_is_advisory_input_not_execution_authority: true,
    feedback_not_proof_or_evidence: true,
    feedback_not_durable_perspective_state: true,
    feedback_not_work_status: true,
    feedback_not_product_write: true,
    feedback_does_not_automatically_promote_candidates: true,
    feedback_does_not_automatically_suppress_or_delete_candidates: true,
    dismiss_is_not_deletion: true,
    pin_is_not_promotion: true,
    mark_useful_is_not_truth: true,
    mark_wrong_is_not_proof_of_falsity: true,
    needs_more_evidence_is_review_cue_not_retrieval_execution: true,
    scope_overreach_is_constraint_signal_not_state_mutation: true,
    not_relevant_now_is_temporal_context_not_rejection: true,
    user_correction_can_mark_rule_failure_later: true,
    user_correction_does_not_mutate_core_state_now: true,
    source_refs_required_for_grounded_targets: true,
    feedback_target_refs_public_safe: true,
    target_kind_preserves_candidate_durable_distinction: true,
    unresolved_tensions_preserved: true,
    knowledge_gaps_preserved: true,
    agent_substrate_folded_derived_advisory_only: true,
    ai_context_packet_context_not_execution_authority: true,
    codex_handoff_draft_not_execution_approval: true,
    packet_receipt_linkage_provenance_not_completion_proof: true,
    product_write_lane_parked_by_686: true,
  };
}

function buildFeedbackKinds() {
  return [
    {
      feedback_kind: "dismiss",
      dismiss_is_not_deletion: true,
      future_surfacing_priority_only: true,
      runtime_write_now: false,
    },
    {
      feedback_kind: "pin",
      pin_is_not_promotion: true,
      future_surfacing_priority_only: true,
      runtime_write_now: false,
    },
    {
      feedback_kind: "mark_wrong",
      mark_wrong_is_not_proof_of_falsity: true,
      rule_failure_candidate_allowed_later: true,
      runtime_write_now: false,
    },
    {
      feedback_kind: "mark_useful",
      mark_useful_is_not_truth: true,
      future_surfacing_priority_only: true,
      runtime_write_now: false,
    },
    {
      feedback_kind: "needs_more_evidence",
      review_cue_not_retrieval_execution: true,
      follow_up_candidate_allowed_later: true,
      runtime_write_now: false,
    },
    {
      feedback_kind: "scope_overreach",
      constraint_signal_not_state_mutation: true,
      rule_failure_candidate_allowed_later: true,
      runtime_write_now: false,
    },
    {
      feedback_kind: "not_relevant_now",
      temporal_context_not_rejection: true,
      future_surfacing_priority_only: true,
      runtime_write_now: false,
    },
    {
      feedback_kind: "correct",
      correction_preview_only: true,
      can_lower_confidence_later: true,
      does_not_mutate_core_state_now: true,
      runtime_write_now: false,
    },
  ];
}

function expectedInputFields() {
  return [
    "feedback_scope_ref",
    "substrate_warning_ref",
    "surfaced_item_ref",
    "target_kind",
    "target_ref",
    "feedback_kind",
    "operator_feedback_ref",
    "source_refs",
    "authority_boundary_ref",
    "forbidden_actions_ref",
    "stop_conditions_ref",
    "operator_context_ref",
  ];
}

function expectedOutputFields() {
  return [
    "feedback_preview_id",
    "feedback_version",
    "target_kind",
    "target_ref",
    "feedback_kind",
    "feedback_summary",
    "future_surfacing_effect_preview",
    "rule_failure_candidate_preview",
    "follow_up_candidate_preview",
    "source_refs",
    "authority_boundary",
    "forbidden_actions",
    "stop_conditions",
    "validation_policy",
    "privacy_policy",
  ];
}

function expectedTargetKinds() {
  return [
    "substrate_warning",
    "digest_diagnostic",
    "context_packet_section",
    "codex_handoff_draft_section",
    "packet_receipt_linkage_section",
    "research_candidate",
    "perspective_delta_candidate",
    "unresolved_tension",
    "knowledge_gap",
    "source_reference",
    "work_context",
  ];
}

function buildFeedbackSectionFamilies() {
  return [
    {
      section_kind: "feedback_target",
      target_ref_required: true,
      target_kind_required: true,
      target_ref_public_safe: true,
      preserves_candidate_durable_distinction: true,
      runtime_write_now: false,
    },
    {
      section_kind: "operator_feedback",
      feedback_kind_required: true,
      operator_feedback_ref_required: true,
      public_safe_summary_required: true,
      runtime_write_now: false,
    },
    {
      section_kind: "future_surfacing_effect_preview",
      display_priority_effect_only: true,
      not_truth: true,
      not_promotion_authority: true,
      runtime_write_now: false,
    },
    {
      section_kind: "rule_failure_candidate_preview",
      candidate_only: true,
      not_proof_or_evidence: true,
      not_durable_state: true,
      allowed_for_mark_wrong_or_scope_overreach_later: true,
      runtime_write_now: false,
    },
    {
      section_kind: "follow_up_candidate_preview",
      candidate_only: true,
      not_work_item: true,
      not_retrieval_execution: true,
      allowed_for_needs_more_evidence_later: true,
      runtime_write_now: false,
    },
    {
      section_kind: "authority_boundary",
      authority_boundary_required: true,
      execution_authority_false: true,
      state_mutation_authority_false: true,
      external_call_authority_false: true,
      product_write_authority_false: true,
      runtime_write_now: false,
    },
    {
      section_kind: "forbidden_actions",
      forbidden_actions_required: true,
      must_include_feedback_write_ban: true,
      must_include_state_mutation_bans: true,
      must_include_provider_retrieval_bans: true,
      must_include_product_write_ban: true,
      runtime_write_now: false,
    },
    {
      section_kind: "stop_conditions",
      stop_conditions_required: true,
      stop_conditions_are_safety_constraints: true,
      runtime_write_now: false,
    },
  ];
}

function buildForbiddenActionsPolicy() {
  return {
    no_feedback_loop_runtime_build: true,
    no_feedback_event_write: true,
    no_feedback_event_mutation: true,
    no_feedback_event_store_write: true,
    no_agent_substrate_mutation: true,
    no_agent_substrate_execution: true,
    no_salience_write: true,
    no_durable_salience_write: true,
    no_recent_rehearsal_buffer_write: true,
    no_durable_memory_write: true,
    no_linkage_record_write: true,
    no_formation_receipt_write: true,
    no_codex_execution_from_feedback: true,
    no_github_automation_from_feedback: true,
    no_agent_routing_from_feedback: true,
    no_agent_execution_from_feedback: true,
    no_provider_openai_call_from_feedback: true,
    no_retrieval_rag_execution_from_feedback: true,
    no_source_fetch_from_feedback: true,
    no_crawler_from_feedback: true,
    no_db_write_or_query_from_feedback: true,
    no_perspective_promotion_from_feedback: true,
    no_durable_perspective_state_write_from_feedback: true,
    no_proof_or_evidence_write_from_feedback: true,
    no_accepted_evidence_write_from_feedback: true,
    no_work_mutation_from_feedback: true,
    no_product_write_from_feedback: true,
  };
}

function buildSamplePreview() {
  return {
    preview_version: previewVersion,
    operator_context_ref:
      "operator_context:public:agent_perspective_substrate_feedback_loop_contract",
    feedback_input_preview: {
      feedback_scope_ref: "feedback_loop_scope_ref:public:example",
      substrate_warning_ref:
        "substrate_warning_ref:public:stale_high_gravity_context",
      surfaced_item_ref: "surfaced_item_ref:public:geometry_digest_warning",
      target_kind: "digest_diagnostic",
      target_ref: "diagnostic_ref:public:source_dominance_warning",
      feedback_kind: "needs_more_evidence",
      operator_feedback_ref:
        "operator_feedback_ref:public:needs_more_evidence_preview",
      source_refs: [
        "source_ref:public:packet_receipt_linkage_validation",
        "source_ref:public:agent_perspective_substrate_feedback_loop_contract",
      ],
      authority_boundary_ref:
        "authority_boundary_ref:public:agent_perspective_substrate_feedback_loop_contract",
      forbidden_actions_ref:
        "forbidden_actions_ref:public:agent_perspective_substrate_feedback_loop_contract",
      stop_conditions_ref:
        "stop_condition_ref:public:feedback_boundary_violation",
      operator_context_ref:
        "operator_context:public:agent_perspective_substrate_feedback_loop_contract",
      not_executed_now: true,
      not_written_now: true,
    },
    feedback_preview: {
      feedback_preview_id: "feedback_preview_ref:public:contract_preview",
      feedback_version: feedbackVersion,
      target_kind: "digest_diagnostic",
      target_ref: "diagnostic_ref:public:source_dominance_warning",
      feedback_kind: "needs_more_evidence",
      feedback_summary: {
        public_safe_summary: "Operator requests more evidence before reuse.",
        feedback_is_operator_signal_not_truth: true,
        feedback_is_advisory_input_not_execution_authority: true,
      },
      future_surfacing_effect_preview: {
        display_priority_effect_only: true,
        not_truth: true,
        not_promotion_authority: true,
        runtime_write_now: false,
      },
      rule_failure_candidate_preview: {
        candidate_only: true,
        not_proof_or_evidence: true,
        not_durable_state: true,
        runtime_write_now: false,
      },
      follow_up_candidate_preview: {
        candidate_only: true,
        not_work_item: true,
        not_retrieval_execution: true,
        runtime_write_now: false,
      },
      source_refs: [
        "source_ref:public:packet_receipt_linkage_validation",
        "source_ref:public:agent_perspective_substrate_feedback_loop_contract",
      ],
      authority_boundary: previewAuthorityBoundary(),
      forbidden_actions: [
        "no_feedback_event_write",
        "no_agent_substrate_mutation",
        "no_salience_write",
        "no_durable_memory_write",
        "no_provider_openai_call_from_feedback",
        "no_retrieval_rag_execution_from_feedback",
        "no_db_write_or_query_from_feedback",
        "no_perspective_promotion_from_feedback",
        "no_product_write_from_feedback",
      ],
      stop_conditions: [
        {
          condition_ref: "stop_condition_ref:public:feedback_boundary_violation",
          summary: "Stop if feedback would gain runtime authority.",
          safety_constraint: true,
        },
      ],
      all_sections_public_safe: true,
      all_sections_source_ref_backed_or_explicit_gap: true,
      all_runtime_write_now_false: true,
    },
    authority_boundary: previewAuthorityBoundary(),
    validation_policy: buildValidationPolicy(),
  };
}

function buildAuthorityBoundary() {
  return {
    contract_added_now: true,
    implementation_added_now: false,
    browser_validation_added_now: false,
    feedback_loop_runtime_build_implemented_now: false,
    feedback_event_write_now: false,
    feedback_event_mutation_now: false,
    feedback_event_store_write_now: false,
    agent_substrate_mutation_now: false,
    agent_substrate_execution_now: false,
    salience_write_now: false,
    durable_salience_write_now: false,
    recent_rehearsal_buffer_write_now: false,
    linkage_runtime_build_implemented_now: false,
    linkage_record_write_now: false,
    durable_audit_log_write_now: false,
    formation_receipt_write_now: false,
    formation_receipt_runtime_mutation_now: false,
    codex_execution_now: false,
    github_automation_now: false,
    github_pr_creation_now: false,
    git_branch_creation_now: false,
    git_commit_creation_now: false,
    external_handoff_sending_now: false,
    agent_routing_now: false,
    agent_execution_now: false,
    ai_context_packet_runtime_build_implemented_now: false,
    ai_context_packet_write_now: false,
    provider_openai_call_now: false,
    provider_extraction_now: false,
    retrieval_rag_execution_now: false,
    source_fetch_now: false,
    crawler_now: false,
    runtime_geometry_digest_build_implemented_now: false,
    geometry_digest_write_now: false,
    geometry_calculation_runtime_now: false,
    raw_coordinate_authority: false,
    raw_coordinate_only_digest_now: false,
    runtime_layout_implemented_now: false,
    runtime_layout_execution_now: false,
    graph_db_implemented_now: false,
    graph_mutation_now: false,
    browser_request_now: false,
    browser_persistence_now: false,
    durable_perspective_state_read_now: false,
    durable_perspective_state_write_now: false,
    durable_perspective_delta_apply_now: false,
    perspective_snapshot_runtime_implemented_now: false,
    trajectory_runtime_build_implemented_now: false,
    proof_or_evidence_record_write_now: false,
    accepted_evidence_write_now: false,
    work_mutation_now: false,
    candidate_mutation_now: false,
    candidate_record_write_now: false,
    runtime_promotion_implemented_now: false,
    promotion_decision_record_implemented_now: false,
    promotion_decision_record_write_now: false,
    runtime_index_build_implemented_now: false,
    runtime_index_write_now: false,
    embedding_generation_implemented_now: false,
    vector_db_implemented_now: false,
    fts_implemented_now: false,
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
    recent_rehearsal_buffer_written_now: false,
    feedback_events_written_now: false,
    feedback_events_mutated_now: false,
    execution_authority: false,
    feedback_authority: false,
    feedback_truth_authority: false,
    feedback_promotion_authority: false,
    feedback_suppression_authority: false,
    feedback_deletion_authority: false,
    mark_useful_truth_authority: false,
    mark_wrong_falsity_authority: false,
    pin_promotion_authority: false,
    dismiss_deletion_authority: false,
    scope_overreach_state_mutation_authority: false,
    needs_more_evidence_retrieval_authority: false,
    codex_execution_authority: false,
    github_automation_authority: false,
    github_pr_creation_authority: false,
    git_branch_creation_authority: false,
    git_commit_authority: false,
    external_handoff_authority: false,
    agent_routing_authority: false,
    agent_execution_authority: false,
    provider_openai_authority: false,
    retrieval_rag_authority: false,
    source_fetch_authority: false,
    salience_authority: false,
    layout_coordinate_authority: false,
    geometry_digest_authority: false,
    diagnostic_authority: false,
    recommendation_authority: false,
    ai_context_packet_authority: false,
    codex_handoff_draft_authority: false,
    linkage_authority: false,
    receipt_completion_authority: false,
    final_report_completion_authority: false,
    expected_files_write_authority: false,
    expected_checks_execution_authority: false,
    branch_name_git_authority: false,
    pr_title_body_github_authority: false,
    product_write_authority: false,
    product_id_allocation_authority: false,
    product_write_lane_parked_by_686: true,
  };
}

function previewAuthorityBoundary() {
  const {
    contract_added_now: _contractAddedNow,
    implementation_added_now: _implementationAddedNow,
    browser_validation_added_now: _browserValidationAddedNow,
    ...previewBoundary
  } = buildAuthorityBoundary();
  return previewBoundary;
}

function buildValidationPolicy() {
  return {
    feedback_is_operator_signal_not_truth: true,
    feedback_is_advisory_input_not_execution_authority: true,
    feedback_not_proof_or_evidence: true,
    feedback_not_durable_perspective_state: true,
    feedback_not_work_status: true,
    feedback_not_product_write: true,
    feedback_does_not_automatically_promote_candidates: true,
    feedback_does_not_automatically_suppress_or_delete_candidates: true,
    dismiss_is_not_deletion: true,
    pin_is_not_promotion: true,
    mark_useful_is_not_truth: true,
    mark_wrong_is_not_proof_of_falsity: true,
    needs_more_evidence_is_review_cue_not_retrieval_execution: true,
    scope_overreach_is_constraint_signal_not_state_mutation: true,
    not_relevant_now_is_temporal_context_not_rejection: true,
    user_correction_does_not_mutate_core_state_now: true,
    source_refs_required_for_grounded_targets: true,
    feedback_target_refs_public_safe: true,
    target_kind_preserves_candidate_durable_distinction: true,
    unresolved_tensions_preserved: true,
    knowledge_gaps_preserved: true,
    future_surfacing_priority_only: true,
    rule_failure_candidate_preview_only: true,
    follow_up_candidate_preview_only: true,
    agent_substrate_folded_derived_advisory_only: true,
    ai_context_packet_context_not_execution_authority: true,
    codex_handoff_draft_not_execution_approval: true,
    packet_receipt_linkage_provenance_not_completion_proof: true,
    no_runtime_feedback_loop_build: true,
    no_feedback_event_write: true,
    no_feedback_event_mutation: true,
    no_agent_substrate_mutation: true,
    no_agent_substrate_execution: true,
    no_salience_write: true,
    no_durable_salience_write: true,
    no_recent_rehearsal_buffer_write: true,
    no_durable_memory_write: true,
    no_linkage_record_write: true,
    no_formation_receipt_write: true,
    no_codex_execution: true,
    no_github_automation: true,
    no_agent_routing_or_execution: true,
    no_provider_openai_call: true,
    no_retrieval_rag_execution: true,
    no_source_fetch_or_crawler: true,
    no_runtime_state_read_or_write: true,
    no_durable_perspective_delta_apply: true,
    no_perspective_snapshot_runtime: true,
    no_proof_or_evidence_write: true,
    no_accepted_evidence_write: true,
    no_work_mutation: true,
    no_runtime_db_write_or_query: true,
    no_schema_or_migration: true,
    no_route_or_ui: true,
    no_browser_request: true,
    no_product_write_or_ids: true,
  };
}

function buildPrivacyPolicy() {
  return {
    no_secrets_in_fixture: true,
    no_private_urls: true,
    no_raw_provider_thread_run_session_ids: true,
    no_raw_source_body: true,
    no_access_tokens: true,
    no_ssh_keys: true,
    public_safe_feedback_refs_only: true,
    public_safe_target_refs_only: true,
    public_safe_substrate_warning_refs_only: true,
    public_safe_surfaced_item_refs_only: true,
    public_safe_source_refs_only: true,
    public_safe_stop_condition_refs_only: true,
  };
}

function assertRequiredFiles() {
  for (const filePath of [
    typePath,
    fixturePath,
    smokePath,
    sourceValidationFixturePath,
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
  ]) {
    assert.ok(existsSync(filePath), `${filePath} must exist`);
  }
}

function assertSourceValidationUnchanged() {
  assert.deepEqual(
    sourceValidationFixture,
    readJsonFromGit(sourceValidationFixturePath),
    "#750 Perspective Packet Receipt Linkage browser validation fixture must not change",
  );
}

function assertTypeContract() {
  for (const requiredText of [
    "AgentPerspectiveSubstrateFeedbackLoopContractKind",
    "AgentPerspectiveSubstrateFeedbackKind",
    "AgentPerspectiveSubstrateFeedbackTargetKind",
    "AgentPerspectiveSubstrateFeedbackAuthorityBoundary",
    "AgentPerspectiveSubstrateFeedbackValidationPolicy",
    contractKind,
    contractVersion,
    "feedback_is_operator_signal_not_truth",
    "dismiss_deletion_authority: false",
    "pin_promotion_authority: false",
    "needs_more_evidence_retrieval_authority: false",
    "product_write_lane_parked_by_686",
  ]) {
    assert.ok(typeSource.includes(requiredText), `${typePath} must include ${requiredText}`);
  }
  assert.doesNotMatch(typeSource, /\bimport\b|\bexport\s+function\b/);
}

function assertPackageScript() {
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
    "package.json must add only the Agent Perspective Substrate Feedback Loop contract smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"\s*:/);
  assert.deepEqual(packageJson.dependencies, basePackageJson.dependencies);
  assert.deepEqual(packageJson.devDependencies, basePackageJson.devDependencies);
  assert.deepEqual(
    packageJson.optionalDependencies ?? {},
    basePackageJson.optionalDependencies ?? {},
  );
}

function assertStaticBoundary() {
  const changedFiles = readChangedFiles();
  for (const unchangedPath of protectedUnchangedPaths) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      `Agent Perspective Substrate Feedback Loop contract slice must not change ${unchangedPath}`,
    );
  }
  for (const expectedFile of expectedChangedFiles) {
    assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedChangedFiles.includes(changedFile),
      `unexpected changed file in Agent Perspective Substrate Feedback Loop contract slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /^lib\//, "must not add runtime implementation files");
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
}

function assertNoForbiddenRuntimePatterns() {
  const changedCodeFiles = readChangedFiles().filter(
    (filePath) =>
      (filePath.endsWith(".ts") || filePath.endsWith(".mjs")) &&
      filePath !== typePath &&
      filePath !== smokePath &&
      filePath !== sourceValidationSmokePath &&
      !downstreamSmokePaths.includes(filePath),
  );
  for (const filePath of changedCodeFiles) {
    const stripped = stripNonCode(readFile(filePath));
    assert.doesNotMatch(stripped, /\bfetch\s*\(/, `${filePath} must not call fetch`);
    assert.doesNotMatch(stripped, /\bXMLHttpRequest\b|\bEventSource\b|\bWebSocket\b/, `${filePath} must not call browser request APIs`);
    assert.doesNotMatch(stripped, /\blocalStorage\b|\bsessionStorage\b|\bindexedDB\b|\bdocument\.cookie\b/, `${filePath} must not use browser persistence`);
    assert.doesNotMatch(stripped, /\brequestAnimationFrame\s*\(/, `${filePath} must not use requestAnimationFrame`);
    assert.doesNotMatch(stripped, /from\s+["'][^"']*openai[^"']*["']|\bnew\s+OpenAI\b/i, `${filePath} must not import OpenAI`);
    assert.doesNotMatch(stripped, /from\s+["'][^"']*(?:octokit|github)[^"']*["']|\bcreatePullRequest\b|\bgh\s+pr\b/i, `${filePath} must not implement GitHub automation`);
    assert.doesNotMatch(stripped, /\bexecuteCodex\b|\bspawnCodex\b|\brunCodex\b/i, `${filePath} must not execute Codex`);
    assert.doesNotMatch(stripped, /\bgit\s+(?:branch|checkout|switch|commit)\b|\bcreateBranch\b|\bcreateCommit\b/i, `${filePath} must not implement git branch or commit creation`);
    assert.doesNotMatch(stripped, /\brouteAgent\b|\bexecuteAgent\b|\bagentRouter\b/i, `${filePath} must not route or execute agents`);
    assert.doesNotMatch(stripped, /\bfeedback.*(?:insert|write|mutate|store)|\bwriteFeedback\b/i, `${filePath} must not implement feedback writes`);
    assert.doesNotMatch(stripped, /\bagentSubstrate.*(?:mutate|execute)|\bmutateAgentSubstrate\b/i, `${filePath} must not mutate or execute Agent Substrate`);
    assert.doesNotMatch(stripped, /\bsalience.*(?:insert|write|mutate)\b|\brecentRehearsal.*write\b/i, `${filePath} must not write salience or rehearsal buffers`);
    assert.doesNotMatch(stripped, /\blinkage.*write|\bwrite.*linkage|\bdurableAuditLog|\bwriteAuditLog/i, `${filePath} must not implement linkage or audit log writes`);
    assert.doesNotMatch(stripped, /\bformationReceipt.*(?:insert|write|mutate|update)\b/i, `${filePath} must not write Formation Receipt`);
    assert.doesNotMatch(stripped, /\bdb\.(?:query|insert|update|delete|execute)|\bprisma\.|\bsql`|\bproductionDb\b/i, `${filePath} must not query or write DB`);
    assert.doesNotMatch(stripped, /\bcreateEvidence\b|\bwriteEvidence\b|\bacceptedEvidence\b/i, `${filePath} must not write proof/evidence`);
    assert.doesNotMatch(stripped, /\bpromotePerspective\b|\bpromotionDecision\b/i, `${filePath} must not implement Perspective promotion`);
    assert.doesNotMatch(stripped, /\bproductId\b|\bproduct_id\b|\bwriteProduct\b/i, `${filePath} must not implement product writes or IDs`);
  }
}

function assertContractShape(value) {
  assert.equal(value.contract_kind, contractKind);
  assert.equal(value.contract_version, contractVersion);
  assert.equal(
    value.source_packet_receipt_linkage_validation_ref,
    `${sourceValidationFixture.validation_version}:${sourceValidationFixturePath}#750`,
  );
  assert.equal(
    value.source_packet_receipt_linkage_validation_fingerprint,
    sourceValidationFixture.validation_fingerprint,
  );
  assert.equal(value.recommendation_status, recommendationStatus);
  assert.equal(value.next_recommended_slice, nextRecommendedSlice);
  assert.equal(value.fingerprint_algorithm, "fnv1a32_canonical_json");
  assert.equal(value.contract_fingerprint, createContractFingerprint(value));
}

function assertContractScope(scope) {
  assert.equal(scope.agent_perspective_substrate_feedback_loop_contract_only, true);
  for (const [key, value] of Object.entries(scope)) {
    if (key === "agent_perspective_substrate_feedback_loop_contract_only") {
      assert.equal(value, true);
    } else {
      assert.equal(value, false, `${key} must remain false`);
    }
  }
}

function assertFeedbackPrinciples(principles) {
  for (const [key, value] of Object.entries(buildFeedbackPrinciples())) {
    assert.equal(principles[key], value, `${key} principle must be preserved`);
  }
}

function assertFeedbackKinds(kinds) {
  assert.deepEqual(kinds.map((kind) => kind.feedback_kind), [
    "dismiss",
    "pin",
    "mark_wrong",
    "mark_useful",
    "needs_more_evidence",
    "scope_overreach",
    "not_relevant_now",
    "correct",
  ]);
  for (const kind of kinds) {
    assert.equal(kind.runtime_write_now, false, `${kind.feedback_kind} must not write now`);
  }
  const byKind = Object.fromEntries(kinds.map((kind) => [kind.feedback_kind, kind]));
  assert.equal(byKind.dismiss.dismiss_is_not_deletion, true);
  assert.equal(byKind.pin.pin_is_not_promotion, true);
  assert.equal(byKind.mark_wrong.mark_wrong_is_not_proof_of_falsity, true);
  assert.equal(byKind.mark_useful.mark_useful_is_not_truth, true);
  assert.equal(byKind.needs_more_evidence.review_cue_not_retrieval_execution, true);
  assert.equal(byKind.scope_overreach.constraint_signal_not_state_mutation, true);
  assert.equal(byKind.not_relevant_now.temporal_context_not_rejection, true);
  assert.equal(byKind.correct.does_not_mutate_core_state_now, true);
}

function assertInputFields(fields) {
  assert.deepEqual(fields, expectedInputFields());
}

function assertOutputFields(fields) {
  assert.deepEqual(fields, expectedOutputFields());
}

function assertTargetKinds(kinds) {
  assert.deepEqual(kinds, expectedTargetKinds());
}

function assertSectionFamilies(families) {
  assert.deepEqual(
    families.map((family) => family.section_kind),
    [
      "feedback_target",
      "operator_feedback",
      "future_surfacing_effect_preview",
      "rule_failure_candidate_preview",
      "follow_up_candidate_preview",
      "authority_boundary",
      "forbidden_actions",
      "stop_conditions",
    ],
  );
  for (const family of families) {
    assert.equal(family.runtime_write_now, false, `${family.section_kind} runtime write must be false`);
  }
  const byKind = Object.fromEntries(families.map((family) => [family.section_kind, family]));
  assert.equal(byKind.feedback_target.target_ref_required, true);
  assert.equal(byKind.feedback_target.target_kind_required, true);
  assert.equal(byKind.feedback_target.target_ref_public_safe, true);
  assert.equal(byKind.feedback_target.preserves_candidate_durable_distinction, true);
  assert.equal(byKind.operator_feedback.feedback_kind_required, true);
  assert.equal(byKind.future_surfacing_effect_preview.display_priority_effect_only, true);
  assert.equal(byKind.future_surfacing_effect_preview.not_truth, true);
  assert.equal(byKind.future_surfacing_effect_preview.not_promotion_authority, true);
  assert.equal(byKind.rule_failure_candidate_preview.candidate_only, true);
  assert.equal(byKind.rule_failure_candidate_preview.not_proof_or_evidence, true);
  assert.equal(byKind.rule_failure_candidate_preview.not_durable_state, true);
  assert.equal(byKind.follow_up_candidate_preview.candidate_only, true);
  assert.equal(byKind.follow_up_candidate_preview.not_work_item, true);
  assert.equal(byKind.follow_up_candidate_preview.not_retrieval_execution, true);
  assert.equal(byKind.authority_boundary.execution_authority_false, true);
  assert.equal(byKind.authority_boundary.state_mutation_authority_false, true);
  assert.equal(byKind.authority_boundary.product_write_authority_false, true);
  assert.equal(byKind.forbidden_actions.must_include_feedback_write_ban, true);
  assert.equal(byKind.forbidden_actions.must_include_product_write_ban, true);
  assert.equal(byKind.stop_conditions.stop_conditions_are_safety_constraints, true);
}

function assertForbiddenActionsPolicy(policy) {
  for (const [key, value] of Object.entries(buildForbiddenActionsPolicy())) {
    assert.equal(policy[key], value, `${key} forbidden action policy must be preserved`);
  }
}

function assertSamplePreview(preview) {
  assert.equal(preview.preview_version, previewVersion);
  assert.equal(
    preview.operator_context_ref,
    "operator_context:public:agent_perspective_substrate_feedback_loop_contract",
  );
  assert.equal(preview.feedback_input_preview.not_executed_now, true);
  assert.equal(preview.feedback_input_preview.not_written_now, true);
  assert.equal(preview.feedback_preview.feedback_preview_id, "feedback_preview_ref:public:contract_preview");
  assert.equal(preview.feedback_preview.feedback_version, feedbackVersion);
  assert.equal(preview.feedback_preview.feedback_kind, "needs_more_evidence");
  assert.equal(preview.feedback_preview.feedback_summary.feedback_is_operator_signal_not_truth, true);
  assert.equal(preview.feedback_preview.future_surfacing_effect_preview.display_priority_effect_only, true);
  assert.equal(preview.feedback_preview.future_surfacing_effect_preview.not_truth, true);
  assert.equal(preview.feedback_preview.rule_failure_candidate_preview.candidate_only, true);
  assert.equal(preview.feedback_preview.rule_failure_candidate_preview.not_proof_or_evidence, true);
  assert.equal(preview.feedback_preview.follow_up_candidate_preview.candidate_only, true);
  assert.equal(preview.feedback_preview.follow_up_candidate_preview.not_work_item, true);
  assert.equal(preview.feedback_preview.follow_up_candidate_preview.not_retrieval_execution, true);
  for (const requiredAction of [
    "no_feedback_event_write",
    "no_agent_substrate_mutation",
    "no_salience_write",
    "no_durable_memory_write",
    "no_provider_openai_call_from_feedback",
    "no_retrieval_rag_execution_from_feedback",
    "no_db_write_or_query_from_feedback",
    "no_perspective_promotion_from_feedback",
    "no_product_write_from_feedback",
  ]) {
    assert.ok(preview.feedback_preview.forbidden_actions.includes(requiredAction));
  }
  assert.equal(preview.feedback_preview.all_sections_public_safe, true);
  assert.equal(preview.feedback_preview.all_sections_source_ref_backed_or_explicit_gap, true);
  assert.equal(preview.feedback_preview.all_runtime_write_now_false, true);
  assert.ok(!("contract_added_now" in preview.authority_boundary));
  assert.deepEqual(preview.authority_boundary, preview.feedback_preview.authority_boundary);
  assert.deepEqual(preview.validation_policy, buildValidationPolicy());
}

function assertAuthorityBoundary(boundary) {
  assert.equal(boundary.contract_added_now, true);
  assert.equal(boundary.product_write_lane_parked_by_686, true);
  for (const [key, value] of Object.entries(boundary)) {
    if (key === "contract_added_now" || key === "product_write_lane_parked_by_686") {
      assert.equal(value, true, `${key} must be true`);
    } else {
      assert.equal(value, false, `${key} must remain false`);
    }
  }
}

function assertValidationPolicy(policy) {
  for (const [key, value] of Object.entries(buildValidationPolicy())) {
    assert.equal(policy[key], value, `${key} validation policy must be preserved`);
  }
}

function assertPrivacyPolicy(policy) {
  for (const [key, value] of Object.entries(buildPrivacyPolicy())) {
    assert.equal(policy[key], value, `${key} privacy policy must be preserved`);
  }
}

function assertDocsPointers() {
  for (const requiredText of [
    "Agent Perspective Substrate Feedback Loop contract v0.1",
    typePath,
    fixturePath,
    smokePath,
    "contract-only, fixture-only, smoke-only",
    "defines future feedback grammar for operator responses to Agent Substrate surfaced warnings/suggestions/context packets/digests/linkages/handoff drafts",
    "feedback is operator signal, not truth",
    "feedback is advisory input, not execution authority",
    "feedback is not proof/evidence",
    "feedback is not durable Perspective state",
    "feedback is not work status",
    "feedback is not product write",
    "feedback does not automatically promote candidates",
    "feedback does not automatically suppress or delete candidates",
    "dismiss is not deletion",
    "pin is not promotion",
    "mark_useful is not truth",
    "mark_wrong is not proof of falsity",
    "needs_more_evidence is review cue, not retrieval execution",
    "scope_overreach is constraint signal, not state mutation",
    "not_relevant_now is temporal context, not rejection",
    "user correction does not mutate Core state now",
    "source_refs required for grounded targets",
    "target refs public-safe",
    "target kind preserves candidate/durable distinction",
    "unresolved tensions preserved",
    "knowledge gaps preserved",
    "future surfacing effect preview is display-priority only",
    "rule failure candidate preview is candidate-only",
    "follow-up candidate preview is candidate-only, not work item or retrieval execution",
    "no runtime feedback loop build",
    "no feedback event write",
    "no feedback event mutation",
    "no Agent Substrate mutation/execution",
    "no salience write",
    "no durable salience write",
    "no recent rehearsal buffer write",
    "no durable memory write",
    "no linkage record write",
    "no Formation Receipt write",
    "no Codex/GitHub automation",
    "no agent routing/execution",
    "no provider/OpenAI call",
    "no retrieval/RAG execution",
    "no DB write/query",
    "no perspective promotion",
    "no proof/evidence write",
    "no accepted evidence write",
    "no work mutation",
    "no schema/migration",
    "no route or UI",
    "no browser request",
    "no product write/product IDs",
    "product-write remains parked by #686",
    nextRecommendedSlice,
  ]) {
    assert.ok(indexDoc.includes(requiredText), `${indexPath} must include ${requiredText}`);
  }
  for (const requiredText of [
    "Agent Perspective Substrate Feedback Loop contract defines future feedback grammar only.",
    "Agent Substrate remains folded, derived, advisory-only.",
    "Feedback is operator signal, not truth or execution authority.",
    "Dismiss/pin/mark_useful/mark_wrong/needs_more_evidence/scope_overreach/not_relevant_now/correct do not mutate Core state or automatically promote/suppress/delete candidates.",
    "Future surfacing effect preview is display-priority only.",
    "Rule failure and follow-up previews remain candidate-only.",
    "This slice does not implement feedback writes, Agent Substrate mutation/execution, salience writes, recent rehearsal writes, durable memory writes, linkage/receipt writes, Codex/GitHub automation, agent routing/execution, provider/OpenAI, retrieval/RAG, DB writes, route/UI, proof/evidence writes, work mutation, or product write.",
    "Next recommended slice is Agent Perspective Substrate Feedback Loop implementation v0.1.",
  ]) {
    assert.ok(substrateDoc.includes(requiredText), `${substrateDocPath} must include ${requiredText}`);
  }
  for (const doc of [surfaceDoc, gateDoc]) {
    for (const requiredText of [
      "Agent Perspective Substrate Feedback Loop remains separated from candidate preview, AI Context Packet runtime, Codex Handoff runtime, digest runtime, layout runtime, linkage runtime, durable Perspective state, promotion runtime, Formation Receipt write, and execution.",
      "Feedback-selected targets remain refs/signals, not proof/evidence or durable state.",
      "Dismiss is not deletion.",
      "Pin is not promotion.",
      "mark_useful is not truth.",
      "mark_wrong is not proof of falsity.",
      "needs_more_evidence does not execute retrieval.",
      "scope_overreach does not mutate state.",
      "not_relevant_now is not rejection.",
      "Corrections do not mutate Core state in this slice.",
      "This slice does not implement runtime DB/browser/provider/source-fetch/retrieval/promotion/state/layout/digest/packet/handoff/linkage/feedback behavior.",
    ]) {
      assert.ok(doc.includes(requiredText), `Research Candidate docs must include ${requiredText}`);
    }
  }
}

function assertSourceValidationDownstreamPointer() {
  for (const requiredText of [
    contractVersion,
    fixturePath,
    smokePath,
    packageScriptName,
    recommendationStatus,
    nextRecommendedSlice,
  ]) {
    assert.ok(
      sourceValidationSmoke.includes(requiredText),
      `${sourceValidationSmokePath} must include ${requiredText}`,
    );
  }
}

function assertPortableMergeBaseFallback() {
  assert.ok(mergeBaseRef(), "mergeBaseRef must resolve");
  for (const requiredText of ["origin/main", "main", "HEAD^", "Unable to resolve merge base"]) {
    assert.ok(smokeSource.includes(requiredText), `${smokePath} must include ${requiredText}`);
  }
}

function readChangedFiles() {
  const diffFiles = readGitOutput([
    "diff",
    "--name-only",
    mergeBaseRef(),
    "--",
  ])
    .split("\n")
    .filter(Boolean);
  const untrackedFiles = readGitOutput([
    "ls-files",
    "--others",
    "--exclude-standard",
  ])
    .split("\n")
    .filter(Boolean);
  return Array.from(new Set([...diffFiles, ...untrackedFiles])).sort();
}

function mergeBaseRef() {
  if (cachedMergeBaseRef) return cachedMergeBaseRef;
  for (const ref of ["origin/main", "main", "HEAD^"]) {
    try {
      readGitOutput(["rev-parse", "--verify", ref]);
      cachedMergeBaseRef = ref;
      return cachedMergeBaseRef;
    } catch {
      // Try the next portable fallback.
    }
  }
  throw new Error("Unable to resolve merge base ref from origin/main, main, or HEAD^");
}

function readFile(filePath) {
  return readFileSync(filePath, "utf8");
}

function readJson(filePath) {
  return JSON.parse(readFile(filePath));
}

function readJsonFromGit(filePath) {
  return JSON.parse(readTextFromGit(filePath));
}

function readTextFromGit(filePath) {
  return execFileSync("git", ["show", `${mergeBaseRef()}:${filePath}`], {
    encoding: "utf8",
  });
}

function readGitOutput(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function stripNonCode(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "")
    .replace(/`(?:\\.|[^`])*`/g, "\"\"")
    .replace(/"(?:\\.|[^"\\])*"/g, "\"\"")
    .replace(/'(?:\\.|[^'\\])*'/g, "''");
}

function createContractFingerprint(value) {
  return `fnv1a32:${fnv1a32(canonicalJson({ ...value, contract_fingerprint: "" }))}`;
}

function canonicalJson(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function fnv1a32(input) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
