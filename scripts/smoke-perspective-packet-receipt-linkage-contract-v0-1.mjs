import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const typePath = "types/perspective-packet-receipt-linkage-contract.ts";
const fixturePath =
  "fixtures/research-candidate-review.perspective-packet-receipt-linkage-contract.sample.v0.1.json";
const smokePath =
  "scripts/smoke-perspective-packet-receipt-linkage-contract-v0-1.mjs";
const sourceValidationFixturePath =
  "fixtures/research-candidate-review.codex-handoff-draft-browser-validation.sample.v0.1.json";
const sourceValidationSmokePath =
  "scripts/smoke-codex-handoff-draft-browser-validation-v0-1.mjs";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const substrateDocPath = "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md";
const surfaceDocPath = "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md";
const gateDocPath =
  "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md";

const packageScriptName =
  "smoke:perspective-packet-receipt-linkage-contract-v0-1";
const packageScriptValue =
  "node scripts/smoke-perspective-packet-receipt-linkage-contract-v0-1.mjs";
const contractKind = "perspective_packet_receipt_linkage_contract";
const contractVersion = "perspective_packet_receipt_linkage_contract.v0.1";
const previewVersion = "perspective_packet_receipt_linkage_preview.v0.1";
const linkageVersion = "perspective_packet_receipt_linkage.v0.1";
const recommendationStatus =
  "ready_for_perspective_packet_receipt_linkage_implementation_v0_1";
const nextRecommendedSlice =
  "perspective_packet_receipt_linkage_implementation_v0_1";
const implementationBuilderPath =
  "lib/research-candidate-review/perspective-packet-receipt-linkage.ts";
const implementationFixturePath =
  "fixtures/research-candidate-review.perspective-packet-receipt-linkage-implementation.sample.v0.1.json";
const implementationSmokePath =
  "scripts/smoke-perspective-packet-receipt-linkage-implementation-v0-1.mjs";
const implementationPackageScriptName =
  "smoke:perspective-packet-receipt-linkage-implementation-v0-1";
const implementationPackageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-perspective-packet-receipt-linkage-implementation-v0-1.mjs";
const implementationVersion =
  "perspective_packet_receipt_linkage_implementation.v0.1";
const implementationRecommendationStatus =
  "ready_for_perspective_packet_receipt_linkage_browser_validation_v0_1";
const implementationNextRecommendedSlice =
  "perspective_packet_receipt_linkage_browser_validation_v0_1";
const writeFixture = process.argv.includes("--write-fixture");
let cachedMergeBaseRef = null;

const downstreamSmokePaths = [
  "scripts/smoke-ai-context-packet-browser-validation-v0-1.mjs",
  "scripts/smoke-ai-context-packet-contract-v0-1.mjs",
  "scripts/smoke-ai-context-packet-implementation-v0-1.mjs",
  "scripts/smoke-bounded-external-source-intake-browser-validation-v0-1.mjs",
  "scripts/smoke-bounded-external-source-intake-contract-v0-1.mjs",
  "scripts/smoke-bounded-external-source-intake-implementation-v0-1.mjs",
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
  "fixtures/research-candidate-review.project-constellation-runtime-layout-browser-validation.sample.v0.1.json",
  "lib/research-candidate-review/project-constellation-runtime-layout.ts",
  "fixtures/research-candidate-review.project-constellation-runtime-layout-implementation.sample.v0.1.json",
  "lib/research-candidate-review/durable-perspective-state-trajectory.ts",
  "fixtures/research-candidate-review.durable-perspective-state-trajectory-implementation.sample.v0.1.json",
  "fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-implementation.sample.v0.1.json",
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
assertLinkagePrinciples(fixture.linkage_principles);
assertInputFields(fixture.linkage_input_fields);
assertOutputFields(fixture.linkage_output_fields);
assertSectionFamilies(fixture.linkage_section_families);
assertForbiddenActionsPolicy(fixture.forbidden_actions_policy);
assertSamplePreview(fixture.sample_perspective_packet_receipt_linkage_preview);
assertAuthorityBoundary(fixture.authority_boundary);
assertValidationPolicy(fixture.validation_policy);
assertPrivacyPolicy(fixture.privacy_policy);
assertDocsPointers();
assertSourceValidationDownstreamPointer();
assertImplementationDownstreamPointer();
assertPortableMergeBaseFallback();
assert.deepEqual(
  fixture,
  rebuiltFixture,
  "rebuilt Perspective Packet Receipt Linkage contract fixture must match committed fixture",
);

console.log(
  JSON.stringify(
    {
      smoke: "perspective-packet-receipt-linkage-contract-v0-1",
      final_status: "pass",
      contract_kind: fixture.contract_kind,
      contract_version: fixture.contract_version,
      source_codex_handoff_draft_validation_fingerprint:
        fixture.source_codex_handoff_draft_validation_fingerprint,
      section_family_count: fixture.linkage_section_families.length,
      linkage_is_provenance_not_execution_authority:
        fixture.linkage_principles
          .linkage_is_provenance_not_execution_authority,
      linkage_not_completion_proof:
        fixture.linkage_principles.linkage_not_completion_proof,
      linkage_runtime_build_implemented_now:
        fixture.authority_boundary.linkage_runtime_build_implemented_now,
      linkage_record_write_now:
        fixture.authority_boundary.linkage_record_write_now,
      formation_receipt_write_now:
        fixture.authority_boundary.formation_receipt_write_now,
      codex_execution_now: fixture.authority_boundary.codex_execution_now,
      github_pr_creation_now:
        fixture.authority_boundary.github_pr_creation_now,
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
    source_codex_handoff_draft_validation_ref:
      `${sourceValidationFixture.validation_version}:${sourceValidationFixturePath}#747`,
    source_codex_handoff_draft_validation_fingerprint:
      sourceValidationFixture.validation_fingerprint,
    contract_scope: buildContractScope(),
    linkage_principles: buildLinkagePrinciples(),
    linkage_input_fields: buildInputFields(),
    linkage_output_fields: buildOutputFields(),
    linkage_section_families: buildSectionFamilies(),
    forbidden_actions_policy: buildForbiddenActionsPolicy(),
    sample_perspective_packet_receipt_linkage_preview: buildSamplePreview(
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
    perspective_packet_receipt_linkage_contract_only: true,
    linkage_runtime_build_now: false,
    linkage_record_write_now: false,
    durable_audit_log_write_now: false,
    formation_receipt_write_now: false,
    formation_receipt_runtime_mutation_now: false,
    codex_handoff_draft_runtime_build_now: false,
    codex_handoff_draft_write_now: false,
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
    durable_memory_write_now: false,
    schema_migration_now: false,
    route_ui_now: false,
    browser_request_now: false,
    product_write_now: false,
  };
}

function buildLinkagePrinciples() {
  return {
    linkage_is_provenance_not_execution_authority: true,
    linkage_is_derived_public_safe_advisory_only: true,
    linkage_not_source_of_truth: true,
    linkage_not_proof_or_evidence: true,
    linkage_not_completion_proof: true,
    linkage_not_durable_perspective_state: true,
    linkage_not_work_status: true,
    linkage_not_product_write: true,
    linkage_does_not_prove_codex_ran: true,
    linkage_does_not_prove_pr_created: true,
    linkage_does_not_prove_validation_passed: true,
    linkage_does_not_create_formation_receipt_now: true,
    formation_receipt_ref_future_only: true,
    decision_or_handoff_ref_future_only: true,
    source_refs_required: true,
    authority_boundary_required: true,
    forbidden_actions_required: true,
    stop_conditions_required: true,
    selected_candidates_remain_candidates: true,
    omitted_candidates_remain_visible: true,
    deferred_candidates_remain_visible: true,
    unresolved_tensions_preserved: true,
    knowledge_gaps_preserved: true,
    candidate_durable_distinction_preserved: true,
    ai_context_packet_context_not_execution_authority: true,
    codex_handoff_draft_not_execution_approval: true,
    perspective_geometry_digest_interpretation_not_truth: true,
    expected_files_hints_not_write_authority: true,
    expected_checks_hints_not_execution_authority: true,
    final_report_template_not_completion_proof: true,
    product_write_lane_parked_by_686: true,
  };
}

function buildInputFields() {
  return [
    "linkage_scope_ref",
    "ai_context_packet_ref",
    "codex_handoff_draft_ref",
    "perspective_geometry_digest_ref",
    "selected_candidate_refs",
    "omitted_candidate_refs",
    "deferred_candidate_refs",
    "unresolved_tension_refs",
    "knowledge_gap_refs",
    "source_refs",
    "authority_boundary_ref",
    "forbidden_actions_ref",
    "stop_conditions_ref",
    "expected_files_ref",
    "expected_checks_ref",
    "future_formation_receipt_ref",
    "future_decision_or_handoff_ref",
    "operator_context_ref",
  ];
}

function buildOutputFields() {
  return [
    "linkage_id",
    "linkage_version",
    "ai_context_packet_ref",
    "codex_handoff_draft_ref",
    "perspective_geometry_digest_ref",
    "selected_candidates",
    "omitted_candidates",
    "deferred_candidates",
    "unresolved_tensions",
    "knowledge_gaps",
    "source_refs",
    "authority_boundary",
    "forbidden_actions",
    "stop_conditions",
    "expected_files",
    "expected_checks",
    "future_formation_receipt_ref",
    "future_decision_or_handoff_ref",
    "linkage_notes",
    "validation_policy",
    "privacy_policy",
  ];
}

function buildSectionFamilies() {
  return [
    {
      section_kind: "ai_context_packet_link",
      ai_context_packet_ref_required: true,
      context_not_execution_authority: true,
      runtime_write_now: false,
    },
    {
      section_kind: "codex_handoff_draft_link",
      codex_handoff_draft_ref_required: true,
      draft_not_execution_approval: true,
      runtime_write_now: false,
    },
    {
      section_kind: "perspective_geometry_digest_link",
      geometry_digest_ref_required: true,
      interpretation_not_truth: true,
      runtime_write_now: false,
    },
    {
      section_kind: "selected_candidates",
      candidate_refs_required: true,
      candidates_remain_candidates: true,
      not_proof_or_evidence: true,
      not_durable_state: true,
      source_refs_required: true,
      runtime_write_now: false,
    },
    {
      section_kind: "omitted_candidates",
      omitted_candidate_refs_required: true,
      omitted_candidates_remain_visible: true,
      omission_not_rejection: true,
      runtime_write_now: false,
    },
    {
      section_kind: "deferred_candidates",
      deferred_candidate_refs_required: true,
      deferred_candidates_remain_visible: true,
      deferral_not_rejection: true,
      runtime_write_now: false,
    },
    {
      section_kind: "unresolved_tensions",
      tension_refs_required: true,
      must_remain_visible: true,
      resolution_not_implied: true,
      runtime_write_now: false,
    },
    {
      section_kind: "knowledge_gaps",
      knowledge_gap_refs_required: true,
      must_remain_visible: true,
      closure_not_implied: true,
      source_refs_or_gap_reason_required: true,
      runtime_write_now: false,
    },
    {
      section_kind: "future_formation_receipt_ref",
      future_formation_receipt_ref_required: true,
      receipt_not_written_now: true,
      not_completion_proof: true,
      runtime_write_now: false,
    },
    {
      section_kind: "future_decision_or_handoff_ref",
      future_decision_or_handoff_ref_required: true,
      decision_not_made_now: true,
      handoff_not_sent_now: true,
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
      must_include_execution_bans: true,
      must_include_state_mutation_bans: true,
      must_include_provider_retrieval_bans: true,
      must_include_product_write_ban: true,
      runtime_write_now: false,
    },
    {
      section_kind: "expected_files",
      expected_files_are_hints_only: true,
      not_file_write_authority: true,
      runtime_write_now: false,
    },
    {
      section_kind: "expected_checks",
      expected_checks_are_validation_hints_only: true,
      not_execution_authority: true,
      runtime_write_now: false,
    },
    {
      section_kind: "linkage_notes",
      notes_are_explanatory_only: true,
      not_truth_source: true,
      runtime_write_now: false,
    },
  ];
}

function buildForbiddenActionsPolicy() {
  return {
    no_linkage_runtime_build: true,
    no_linkage_record_write: true,
    no_durable_audit_log_write: true,
    no_formation_receipt_write: true,
    no_codex_execution_from_linkage: true,
    no_github_automation_from_linkage: true,
    no_github_pr_creation_from_linkage: true,
    no_git_branch_creation_from_linkage: true,
    no_git_commit_creation_from_linkage: true,
    no_external_handoff_sending_from_linkage: true,
    no_agent_routing_from_linkage: true,
    no_agent_execution_from_linkage: true,
    no_provider_openai_call_from_linkage: true,
    no_retrieval_rag_execution_from_linkage: true,
    no_source_fetch_from_linkage: true,
    no_crawler_from_linkage: true,
    no_db_write_or_query_from_linkage: true,
    no_durable_memory_write_from_linkage: true,
    no_perspective_promotion_from_linkage: true,
    no_durable_perspective_state_write_from_linkage: true,
    no_proof_or_evidence_write_from_linkage: true,
    no_accepted_evidence_write_from_linkage: true,
    no_work_mutation_from_linkage: true,
    no_product_write_from_linkage: true,
  };
}

function buildSamplePreview(authorityBoundary, validationPolicy) {
  const previewAuthorityBoundary = { ...authorityBoundary };
  delete previewAuthorityBoundary.contract_added_now;
  return {
    preview_version: previewVersion,
    operator_context_ref:
      "operator_context:public:perspective_packet_receipt_linkage_contract",
    linkage_input_preview: {
      linkage_scope_ref: "packet_receipt_linkage_scope_ref:public:example",
      ai_context_packet_ref: "ai_context_packet_ref:public:contract_preview",
      codex_handoff_draft_ref:
        "codex_handoff_draft_ref:public:contract_preview",
      perspective_geometry_digest_ref:
        "geometry_digest_ref:public:contract_preview",
      selected_candidate_refs: ["candidate_ref:public:selected_claim_candidate"],
      omitted_candidate_refs: ["candidate_ref:public:omitted_candidate_visible"],
      deferred_candidate_refs: ["candidate_ref:public:deferred_candidate_visible"],
      unresolved_tension_refs: ["tension_ref:public:visible_tension"],
      knowledge_gap_refs: ["knowledge_gap_ref:public:visible_gap"],
      source_refs: [
        "source_ref:public:codex_handoff_draft_validation",
        "source_ref:public:perspective_packet_receipt_linkage_contract",
      ],
      authority_boundary_ref:
        "authority_boundary_ref:public:perspective_packet_receipt_linkage_contract",
      forbidden_actions_ref:
        "forbidden_actions_ref:public:perspective_packet_receipt_linkage_contract",
      stop_conditions_ref:
        "stop_conditions_ref:public:perspective_packet_receipt_linkage_contract",
      expected_files_ref:
        "expected_files_ref:public:perspective_packet_receipt_linkage_contract",
      expected_checks_ref:
        "expected_checks_ref:public:perspective_packet_receipt_linkage_contract",
      future_formation_receipt_ref:
        "formation_receipt_ref:public:future_required",
      future_decision_or_handoff_ref:
        "decision_or_handoff_ref:public:future_required",
      operator_context_ref:
        "operator_context:public:perspective_packet_receipt_linkage_contract",
      not_executed_now: true,
      not_written_now: true,
    },
    linkage_preview: {
      linkage_id: "packet_receipt_linkage_ref:public:contract_preview",
      linkage_version: linkageVersion,
      ai_context_packet_ref: "ai_context_packet_ref:public:contract_preview",
      codex_handoff_draft_ref:
        "codex_handoff_draft_ref:public:contract_preview",
      perspective_geometry_digest_ref:
        "geometry_digest_ref:public:contract_preview",
      selected_candidates: [
        {
          candidate_ref: "candidate_ref:public:selected_claim_candidate",
          selected_for_context: true,
          candidate_only: true,
          not_proof_or_evidence: true,
          not_durable_state: true,
          source_refs: [
            "source_ref:public:perspective_packet_receipt_linkage_contract",
          ],
        },
      ],
      omitted_candidates: [
        {
          candidate_ref: "candidate_ref:public:omitted_candidate_visible",
          omission_reason_summary: "Public-safe omission reason preview.",
          omission_not_rejection: true,
          remains_visible: true,
        },
      ],
      deferred_candidates: [
        {
          candidate_ref: "candidate_ref:public:deferred_candidate_visible",
          defer_reason_summary: "Public-safe defer reason preview.",
          deferral_not_rejection: true,
          remains_visible: true,
        },
      ],
      unresolved_tensions: [
        {
          tension_ref: "tension_ref:public:visible_tension",
          must_remain_visible: true,
          resolution_not_implied: true,
        },
      ],
      knowledge_gaps: [
        {
          knowledge_gap_ref: "knowledge_gap_ref:public:visible_gap",
          must_remain_visible: true,
          closure_not_implied: true,
          source_refs_or_gap_reason_required: true,
        },
      ],
      source_refs: [
        "source_ref:public:codex_handoff_draft_validation",
        "source_ref:public:perspective_packet_receipt_linkage_contract",
      ],
      authority_boundary: previewAuthorityBoundary,
      forbidden_actions: [
        "no_linkage_record_write",
        "no_formation_receipt_write",
        "no_codex_execution_from_linkage",
        "no_github_automation_from_linkage",
        "no_provider_openai_call_from_linkage",
        "no_retrieval_rag_execution_from_linkage",
        "no_db_write_or_query_from_linkage",
        "no_perspective_promotion_from_linkage",
        "no_product_write_from_linkage",
      ],
      stop_conditions: [
        {
          condition_ref:
            "stop_condition_ref:public:authority_boundary_violation",
          summary: "Stop if runtime authority would be added.",
          safety_constraint: true,
        },
      ],
      expected_files: [
        {
          file_path: "types/perspective-packet-receipt-linkage-contract.ts",
          handoff_hint_only: true,
          not_file_write_authority: true,
        },
      ],
      expected_checks: [
        {
          check_ref:
            "node --check scripts/smoke-perspective-packet-receipt-linkage-contract-v0-1.mjs",
          validation_hint_only: true,
          not_execution_authority: true,
        },
      ],
      future_formation_receipt_ref:
        "formation_receipt_ref:public:future_required",
      future_decision_or_handoff_ref:
        "decision_or_handoff_ref:public:future_required",
      linkage_notes: {
        summary: "Public-safe explanatory linkage preview.",
        notes_are_explanatory_only: true,
        not_truth_source: true,
      },
      all_sections_public_safe: true,
      all_sections_source_ref_backed_or_explicit_gap: true,
      all_runtime_write_now_false: true,
      not_completion_proof: true,
    },
    authority_boundary: previewAuthorityBoundary,
    validation_policy: validationPolicy,
  };
}

function buildAuthorityBoundary() {
  return {
    contract_added_now: true,
    implementation_added_now: false,
    browser_validation_added_now: false,
    linkage_runtime_build_implemented_now: false,
    linkage_record_write_now: false,
    durable_audit_log_write_now: false,
    formation_receipt_write_now: false,
    codex_handoff_draft_runtime_build_implemented_now: false,
    codex_handoff_draft_write_now: false,
    codex_handoff_implemented_now: false,
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
    durable_salience_write_now: false,
    recent_rehearsal_buffer_written_now: false,
    feedback_events_written_now: false,
    feedback_events_mutated_now: false,
    execution_authority: false,
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

function buildValidationPolicy() {
  return {
    ...buildLinkagePrinciples(),
    no_runtime_linkage_build: true,
    no_linkage_record_write: true,
    no_durable_audit_log_write: true,
    no_formation_receipt_write: true,
    no_codex_execution: true,
    no_github_automation: true,
    no_github_pr_creation: true,
    no_git_branch_or_commit_creation: true,
    no_external_handoff_sending: true,
    no_agent_routing_or_execution: true,
    no_provider_openai_call: true,
    no_retrieval_rag_execution: true,
    no_source_fetch_or_crawler: true,
    no_ai_context_packet_runtime_build: true,
    no_codex_handoff_draft_runtime_build: true,
    no_runtime_geometry_digest_build: true,
    no_runtime_layout_execution: true,
    no_graph_mutation: true,
    no_runtime_state_read_or_write: true,
    no_durable_perspective_delta_apply: true,
    no_perspective_snapshot_runtime: true,
    no_proof_or_evidence_write: true,
    no_accepted_evidence_write: true,
    no_work_mutation: true,
    no_runtime_db_write_or_query: true,
    no_durable_memory_write: true,
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
    public_safe_linkage_refs_only: true,
    public_safe_packet_refs_only: true,
    public_safe_handoff_refs_only: true,
    public_safe_receipt_refs_only: true,
    public_safe_candidate_refs_only: true,
    public_safe_tension_refs_only: true,
    public_safe_knowledge_gap_refs_only: true,
    public_safe_source_refs_only: true,
    public_safe_file_paths_only: true,
    public_safe_check_refs_only: true,
    public_safe_stop_condition_refs_only: true,
  };
}

function assertRequiredFiles() {
  for (const filePath of [
    typePath,
    fixturePath,
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
}

function assertSourceValidationUnchanged() {
  assert.deepEqual(
    sourceValidationFixture,
    readJsonFromGit(sourceValidationFixturePath),
    "#747 Codex Handoff Draft browser validation fixture must not change",
  );
}

function assertTypeContract() {
  for (const requiredText of [
    "PerspectivePacketReceiptLinkageContractKind",
    "PerspectivePacketReceiptLinkageContractVersion",
    "PerspectivePacketReceiptLinkageInputField",
    "PerspectivePacketReceiptLinkageOutputField",
    "PerspectivePacketReceiptLinkageSectionKind",
    "PerspectivePacketReceiptLinkageContractScope",
    "PerspectivePacketReceiptLinkagePrinciples",
    "PerspectivePacketReceiptLinkageSectionFamily",
    "PerspectivePacketReceiptLinkageForbiddenActionsPolicy",
    "PerspectivePacketReceiptLinkageAuthorityBoundary",
    "PerspectivePacketReceiptLinkageValidationPolicy",
    "PerspectivePacketReceiptLinkagePrivacyPolicy",
    "PerspectivePacketReceiptLinkageContractFixture",
    "perspective_packet_receipt_linkage_contract",
    "perspective_packet_receipt_linkage_contract.v0.1",
    "linkage_not_completion_proof",
    "linkage_authority: false",
    "receipt_completion_authority: false",
    "product_write_lane_parked_by_686",
  ]) {
    assert.ok(typeSource.includes(requiredText), `${typePath} must include ${requiredText}`);
  }
  assert.doesNotMatch(typeSource, /\bimport\b|\bexport\s+function\b/);
}

function assertPackageScript() {
  if (implementationSliceActive()) {
    assertImplementationPackageScript();
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
    "package.json must add only the Perspective Packet Receipt Linkage contract smoke script",
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
  if (implementationSliceActive()) {
    assertImplementationChangedFiles(changedFiles);
    return;
  }
  for (const unchangedPath of protectedUnchangedPaths) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      `Perspective Packet Receipt Linkage contract slice must not change ${unchangedPath}`,
    );
  }
  for (const expectedFile of expectedChangedFiles) {
    assert.ok(
      changedFiles.includes(expectedFile),
      `changed files must include ${expectedFile}`,
    );
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedChangedFiles.includes(changedFile),
      `unexpected changed file in Perspective Packet Receipt Linkage contract slice: ${changedFile}`,
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
      filePath !== implementationBuilderPath &&
      filePath !== implementationSmokePath &&
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
    assert.doesNotMatch(stripped, /\bdb\.\w+\s*\(|\bprisma\b|\bsql`|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bUPSERT\b/i, `${filePath} must not query or write DB`);
    assert.doesNotMatch(stripped, /\bcreateEmbedding\b|\bupsertVector\b|\bwriteIndex\b|\bbuildIndex\b|\bfts5?\b/i, `${filePath} must not implement index/embedding/vector/FTS behavior`);
    assert.doesNotMatch(stripped, /\bwriteProduct\b|\ballocateProductId\b|\bcreateProduct\b/i, `${filePath} must not implement product write`);
    assert.doesNotMatch(stripped, /\blinkage.*write|\bwrite.*linkage|\bdurableAuditLog|\bwriteAuditLog/i, `${filePath} must not implement linkage or audit log writes`);
    assert.doesNotMatch(stripped, /\bwriteFormationReceipt\b|\bformationReceipt.*write/i, `${filePath} must not implement Formation Receipt writes`);
  }
}

function implementationSliceActive() {
  return readChangedFiles().includes(implementationSmokePath);
}

function assertImplementationPackageScript() {
  assert.equal(
    packageJson.scripts[implementationPackageScriptName],
    implementationPackageScriptValue,
  );
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
    [implementationPackageScriptName],
    "package.json must add only the Perspective Packet Receipt Linkage implementation smoke script",
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

function assertImplementationChangedFiles(changedFiles) {
  const expectedImplementationChangedFiles = [
    implementationBuilderPath,
    implementationFixturePath,
    implementationSmokePath,
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
    smokePath,
    sourceValidationSmokePath,
    ...downstreamSmokePaths,
  ];
  for (const unchangedPath of [
    typePath,
    fixturePath,
    sourceValidationFixturePath,
    ...protectedUnchangedPaths,
  ]) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      `Perspective Packet Receipt Linkage implementation slice must not change ${unchangedPath}`,
    );
  }
  for (const expectedFile of expectedImplementationChangedFiles) {
    assert.ok(
      changedFiles.includes(expectedFile),
      `changed files must include ${expectedFile}`,
    );
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedImplementationChangedFiles.includes(changedFile),
      `unexpected changed file in Perspective Packet Receipt Linkage implementation slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    if (changedFile !== implementationBuilderPath) {
      assert.doesNotMatch(changedFile, /^lib\//, "must not add runtime implementation files outside deterministic builder");
    }
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
}

function assertContractShape(value) {
  assert.equal(value.contract_kind, contractKind);
  assert.equal(value.contract_version, contractVersion);
  assert.equal(
    value.source_codex_handoff_draft_validation_ref,
    `${sourceValidationFixture.validation_version}:${sourceValidationFixturePath}#747`,
  );
  assert.equal(
    value.source_codex_handoff_draft_validation_fingerprint,
    sourceValidationFixture.validation_fingerprint,
  );
  assert.equal(value.recommendation_status, recommendationStatus);
  assert.equal(value.next_recommended_slice, nextRecommendedSlice);
  assert.equal(value.fingerprint_algorithm, "fnv1a32_canonical_json");
  assert.equal(value.contract_fingerprint, createContractFingerprint(value));
}

function assertContractScope(value) {
  assert.equal(value.perspective_packet_receipt_linkage_contract_only, true);
  for (const [key, flag] of Object.entries(value)) {
    if (key === "perspective_packet_receipt_linkage_contract_only") {
      assert.equal(flag, true);
    } else {
      assert.equal(flag, false, `${key} must remain false`);
    }
  }
}

function assertLinkagePrinciples(value) {
  for (const key of Object.keys(buildLinkagePrinciples())) {
    assert.equal(value[key], true, `${key} must be true`);
  }
}

function assertInputFields(value) {
  assert.deepEqual(value, buildInputFields());
}

function assertOutputFields(value) {
  assert.deepEqual(value, buildOutputFields());
}

function assertSectionFamilies(value) {
  const expectedKinds = buildSectionFamilies().map((family) => family.section_kind);
  assert.deepEqual(
    value.map((family) => family.section_kind),
    expectedKinds,
  );
  for (const family of value) {
    assert.equal(family.runtime_write_now, false);
  }
  assert.equal(
    value.find((family) => family.section_kind === "selected_candidates")
      .candidates_remain_candidates,
    true,
  );
  assert.equal(
    value.find((family) => family.section_kind === "selected_candidates")
      .not_proof_or_evidence,
    true,
  );
  assert.equal(
    value.find((family) => family.section_kind === "omitted_candidates")
      .omission_not_rejection,
    true,
  );
  assert.equal(
    value.find((family) => family.section_kind === "deferred_candidates")
      .deferral_not_rejection,
    true,
  );
  assert.equal(
    value.find((family) => family.section_kind === "unresolved_tensions")
      .resolution_not_implied,
    true,
  );
  assert.equal(
    value.find((family) => family.section_kind === "knowledge_gaps")
      .closure_not_implied,
    true,
  );
  assert.equal(
    value.find((family) => family.section_kind === "future_formation_receipt_ref")
      .receipt_not_written_now,
    true,
  );
  assert.equal(
    value.find((family) => family.section_kind === "future_formation_receipt_ref")
      .not_completion_proof,
    true,
  );
  assert.equal(
    value.find((family) => family.section_kind === "future_decision_or_handoff_ref")
      .decision_not_made_now,
    true,
  );
  assert.equal(
    value.find((family) => family.section_kind === "future_decision_or_handoff_ref")
      .handoff_not_sent_now,
    true,
  );
  assert.equal(
    value.find((family) => family.section_kind === "expected_files")
      .not_file_write_authority,
    true,
  );
  assert.equal(
    value.find((family) => family.section_kind === "expected_checks")
      .not_execution_authority,
    true,
  );
  assert.equal(
    value.find((family) => family.section_kind === "linkage_notes")
      .not_truth_source,
    true,
  );
}

function assertForbiddenActionsPolicy(value) {
  assert.deepEqual(value, buildForbiddenActionsPolicy());
}

function assertSamplePreview(value) {
  assert.equal(value.preview_version, previewVersion);
  assert.equal(
    value.operator_context_ref,
    "operator_context:public:perspective_packet_receipt_linkage_contract",
  );
  assert.equal(value.linkage_input_preview.not_executed_now, true);
  assert.equal(value.linkage_input_preview.not_written_now, true);
  assert.equal(
    value.linkage_preview.linkage_id,
    "packet_receipt_linkage_ref:public:contract_preview",
  );
  assert.equal(value.linkage_preview.linkage_version, linkageVersion);
  assert.equal(value.linkage_preview.selected_candidates[0].candidate_only, true);
  assert.equal(
    value.linkage_preview.selected_candidates[0].not_proof_or_evidence,
    true,
  );
  assert.equal(
    value.linkage_preview.selected_candidates[0].not_durable_state,
    true,
  );
  assert.equal(value.linkage_preview.omitted_candidates[0].remains_visible, true);
  assert.equal(
    value.linkage_preview.omitted_candidates[0].omission_not_rejection,
    true,
  );
  assert.equal(value.linkage_preview.deferred_candidates[0].remains_visible, true);
  assert.equal(
    value.linkage_preview.deferred_candidates[0].deferral_not_rejection,
    true,
  );
  assert.equal(value.linkage_preview.unresolved_tensions[0].must_remain_visible, true);
  assert.equal(value.linkage_preview.knowledge_gaps[0].must_remain_visible, true);
  assert.equal(
    value.linkage_preview.future_formation_receipt_ref,
    "formation_receipt_ref:public:future_required",
  );
  assert.equal(
    value.linkage_preview.future_decision_or_handoff_ref,
    "decision_or_handoff_ref:public:future_required",
  );
  assert.equal(value.linkage_preview.linkage_notes.not_truth_source, true);
  assert.equal(value.linkage_preview.all_sections_public_safe, true);
  assert.equal(
    value.linkage_preview.all_sections_source_ref_backed_or_explicit_gap,
    true,
  );
  assert.equal(value.linkage_preview.all_runtime_write_now_false, true);
  assert.equal(value.linkage_preview.not_completion_proof, true);
  for (const requiredAction of [
    "no_linkage_record_write",
    "no_formation_receipt_write",
    "no_codex_execution_from_linkage",
    "no_github_automation_from_linkage",
    "no_provider_openai_call_from_linkage",
    "no_retrieval_rag_execution_from_linkage",
    "no_db_write_or_query_from_linkage",
    "no_perspective_promotion_from_linkage",
    "no_product_write_from_linkage",
  ]) {
    assert.ok(value.linkage_preview.forbidden_actions.includes(requiredAction));
  }
  assert.equal(value.linkage_preview.expected_files[0].not_file_write_authority, true);
  assert.equal(value.linkage_preview.expected_checks[0].not_execution_authority, true);
  assert.equal(value.authority_boundary.contract_added_now, undefined);
  assert.equal(value.authority_boundary.product_write_lane_parked_by_686, true);
  assert.deepEqual(value.validation_policy, buildValidationPolicy());
}

function assertAuthorityBoundary(value) {
  assert.equal(value.contract_added_now, true);
  assert.equal(value.product_write_lane_parked_by_686, true);
  for (const [key, flag] of Object.entries(value)) {
    if (key === "contract_added_now" || key === "product_write_lane_parked_by_686") {
      assert.equal(flag, true, `${key} must be true`);
    } else {
      assert.equal(flag, false, `${key} must remain false`);
    }
  }
}

function assertValidationPolicy(value) {
  for (const key of Object.keys(buildValidationPolicy())) {
    assert.equal(value[key], true, `${key} must be true`);
  }
}

function assertPrivacyPolicy(value) {
  for (const key of Object.keys(buildPrivacyPolicy())) {
    assert.equal(value[key], true, `${key} must be true`);
  }
}

function assertDocsPointers() {
  for (const requiredText of [
    "Perspective Packet Receipt Linkage contract v0.1",
    typePath,
    fixturePath,
    smokePath,
    "contract-only, fixture-only, smoke-only",
    "defines future provenance linkage grammar connecting AI Context Packet, Codex Handoff Draft, Geometry Digest, candidates, source_refs, stop_conditions, and future Formation Receipt refs",
    "linkage is provenance, not execution authority",
    "linkage is derived, public-safe, advisory-only",
    "linkage is not source of truth",
    "linkage is not proof/evidence",
    "linkage is not completion proof",
    "linkage is not durable Perspective state",
    "linkage is not work status",
    "linkage is not product write",
    "linkage does not prove Codex ran",
    "linkage does not prove PR created",
    "linkage does not prove validation passed",
    "linkage does not create Formation Receipt now",
    "future Formation Receipt ref only",
    "future decision/handoff ref only",
    "selected candidates remain candidates",
    "omitted candidates remain visible and omission is not rejection",
    "deferred candidates remain visible and deferral is not rejection",
    "unresolved tensions preserved",
    "knowledge gaps preserved",
    "candidate/durable distinction preserved",
    "AI Context Packet remains context, not execution authority",
    "Codex Handoff Draft remains draft, not execution approval",
    "Perspective Geometry Digest remains interpretation, not truth",
    "expected_files are hints only, not write authority",
    "expected_checks are validation hints only, not execution authority",
    "final_report_template is not completion proof",
    "no runtime linkage build",
    "no linkage record write",
    "no durable audit log write",
    "no Formation Receipt write",
    "no Codex execution",
    "no GitHub automation",
    "no GitHub PR creation",
    "no git branch/commit creation",
    "no external handoff sending",
    "no agent routing/execution",
    "no provider/OpenAI call",
    "no retrieval/RAG execution",
    "no DB write/query",
    "no durable memory write",
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
    "Perspective Packet Receipt Linkage contract defines future public-safe provenance linkage grammar only.",
    "Agent Substrate remains advisory-only",
    "Linkage is provenance, not execution authority.",
    "Future Formation Receipt refs and future decision/handoff refs are references only and are not written now.",
    "Selected, omitted, and deferred candidates remain visible and retain candidate/durable distinction.",
    "This slice does not implement runtime linkage build, linkage write, Formation Receipt write, durable audit log write, Codex execution, GitHub automation, branch/commit/PR creation, external handoff sending, agent routing/execution, provider/OpenAI, retrieval/RAG, DB writes, route/UI, proof/evidence writes, work mutation, or product write.",
    "Next recommended slice is Perspective Packet Receipt Linkage implementation v0.1.",
  ]) {
    assert.ok(substrateDoc.includes(requiredText), `${substrateDocPath} must include ${requiredText}`);
  }
  for (const doc of [surfaceDoc, gateDoc]) {
    for (const requiredText of [
      "Perspective Packet Receipt Linkage remains separated from candidate preview, AI Context Packet runtime, Codex Handoff runtime, digest runtime, layout runtime, durable Perspective state, promotion runtime, Formation Receipt write, and execution.",
      "Selected candidates remain candidates, not proof/evidence or durable state.",
      "Omitted candidates remain visible and omission is not rejection.",
      "Deferred candidates remain visible and deferral is not rejection.",
      "Unresolved tensions and knowledge gaps must remain visible.",
      "Codex Handoff Draft remains draft, not execution approval.",
      "Linkage cannot execute Codex, create branches, create commits, create PRs, call providers, run retrieval/RAG, mutate state/work, write Formation Receipt, write audit logs, or write product data.",
      "This slice does not implement runtime DB/browser/provider/source-fetch/retrieval/promotion/state/layout/digest/packet/handoff/linkage behavior.",
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

function assertImplementationDownstreamPointer() {
  if (!implementationSliceActive()) return;
  for (const requiredText of [
    implementationVersion,
    implementationFixturePath,
    implementationSmokePath,
    implementationPackageScriptName,
    implementationRecommendationStatus,
    implementationNextRecommendedSlice,
  ]) {
    assert.ok(
      smokeSource.includes(requiredText),
      `${smokePath} must include ${requiredText}`,
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

function readJson(filePath) {
  return JSON.parse(readFile(filePath));
}

function readFile(filePath) {
  return readFileSync(filePath, "utf8");
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
  const normalized = JSON.parse(JSON.stringify(value));
  const { contract_fingerprint: _contractFingerprint, ...rest } = normalized;
  return `fnv1a32:${fnv1a32(canonicalJson(rest))}`;
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
