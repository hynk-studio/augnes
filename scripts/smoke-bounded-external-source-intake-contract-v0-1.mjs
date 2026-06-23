import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const stateTrajectoryImplementationBuilderPath =
  "lib/research-candidate-review/durable-perspective-state-trajectory.ts";
const stateTrajectoryImplementationFixturePath =
  "fixtures/research-candidate-review.durable-perspective-state-trajectory-implementation.sample.v0.1.json";
const stateTrajectoryImplementationSmokePath =
  "scripts/smoke-durable-perspective-state-trajectory-implementation-v0-1.mjs";
const stateTrajectoryImplementationContractSmokePath =
  "scripts/smoke-durable-perspective-state-trajectory-contract-v0-1.mjs";
const stateTrajectoryImplementationPackageScriptName =
  "smoke:durable-perspective-state-trajectory-implementation-v0-1";
const stateTrajectoryImplementationPackageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-durable-perspective-state-trajectory-implementation-v0-1.mjs";
const stateTrajectoryImplementationVersion =
  "durable_perspective_state_trajectory_implementation.v0.1";
const stateTrajectoryImplementationRecommendationStatus =
  "ready_for_durable_perspective_state_trajectory_browser_validation_v0_1";
const stateTrajectoryImplementationNextRecommendedSlice =
  "durable_perspective_state_trajectory_browser_validation_v0_1";
const stateTrajectoryBrowserValidationFixturePath =
  "fixtures/research-candidate-review.durable-perspective-state-trajectory-browser-validation.sample.v0.1.json";
const stateTrajectoryBrowserValidationSmokePath =
  "scripts/smoke-durable-perspective-state-trajectory-browser-validation-v0-1.mjs";
const stateTrajectoryBrowserValidationPackageScriptName =
  "smoke:durable-perspective-state-trajectory-browser-validation-v0-1";
const stateTrajectoryBrowserValidationPackageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-durable-perspective-state-trajectory-browser-validation-v0-1.mjs";
const stateTrajectoryBrowserValidationVersion =
  "durable_perspective_state_trajectory_browser_validation.v0.1";
const stateTrajectoryBrowserValidationRecommendationStatus =
  "ready_for_project_constellation_runtime_layout_contract_v0_1";
const stateTrajectoryBrowserValidationNextRecommendedSlice =
  "project_constellation_runtime_layout_contract_v0_1";
const stateTrajectoryImplementationDownstreamSmokePaths = [
  "scripts/smoke-human-reviewed-durable-perspective-promotion-browser-validation-v0-1.mjs",
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
  "scripts/smoke-feedback-event-store-minimal-v0-1.mjs"
];

const typePath = "types/bounded-external-source-intake-contract.ts";
const fixturePath =
  "fixtures/research-candidate-review.bounded-external-source-intake-contract.sample.v0.1.json";
const smokePath =
  "scripts/smoke-bounded-external-source-intake-contract-v0-1.mjs";
const sourceValidationFixturePath =
  "fixtures/research-candidate-review.salience-governor-browser-validation.sample.v0.1.json";
const sourceValidationSmokePath =
  "scripts/smoke-salience-governor-browser-validation-v0-1.mjs";
const implementationBuilderPath =
  "lib/research-candidate-review/bounded-external-source-intake.ts";
const implementationFixturePath =
  "fixtures/research-candidate-review.bounded-external-source-intake-implementation.sample.v0.1.json";
const implementationSmokePath =
  "scripts/smoke-bounded-external-source-intake-implementation-v0-1.mjs";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const substrateDocPath = "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md";
const surfaceDocPath = "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md";
const gateDocPath =
  "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md";

const packageScriptName =
  "smoke:bounded-external-source-intake-contract-v0-1";
const packageScriptValue =
  "node scripts/smoke-bounded-external-source-intake-contract-v0-1.mjs";
const contractKind = "bounded_external_source_intake_contract";
const contractVersion = "bounded_external_source_intake_contract.v0.1";
const intakeVersion = "bounded_external_source_intake.v0.1";
const recommendationStatus =
  "ready_for_bounded_external_source_intake_implementation_v0_1";
const nextRecommendedSlice =
  "bounded_external_source_intake_implementation_v0_1";
const implementationPackageScriptName =
  "smoke:bounded-external-source-intake-implementation-v0-1";
const implementationPackageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-bounded-external-source-intake-implementation-v0-1.mjs";
const implementationVersion =
  "bounded_external_source_intake_implementation.v0.1";
const implementationRecommendationStatus =
  "ready_for_bounded_external_source_intake_browser_validation_v0_1";
const implementationNextRecommendedSlice =
  "bounded_external_source_intake_browser_validation_v0_1";
const writeFixture = process.argv.includes("--write-fixture");
let cachedMergeBaseRef = null;

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

assertTypeContract();
assertPackageScript();
assertStaticBoundary();
assertNoForbiddenRuntimePatterns();
assertContractShape(fixture);
assertIntakeScope(fixture.intake_scope);
assertAllowedSourceInputs(fixture.allowed_source_inputs);
assertDisallowedSourceInputs(fixture.disallowed_source_inputs);
assertSourceReferencePolicy(fixture.source_reference_policy);
assertCandidateGenerationPolicy(fixture.candidate_generation_policy);
assertProvenancePolicy(fixture.provenance_policy);
assertPrivacyPolicy(fixture.privacy_policy);
assertNonAuthorityPolicy(fixture.non_authority_policy);
assertSampleSourceIntakeReferenceBundle(
  fixture.sample_source_intake_reference_bundle,
);
assertAuthorityBoundary(fixture.authority_boundary);
assertValidationPolicy(fixture.validation_policy);
assertDocsPointers();
assertSourceValidationDownstreamPointer();
assertImplementationDownstreamPointer();
assertPortableMergeBaseFallback();
assert.deepEqual(
  fixture,
  rebuiltFixture,
  "rebuilt Bounded External Source Intake contract fixture must match committed fixture",
);

console.log(
  JSON.stringify(
    {
      smoke: "bounded-external-source-intake-contract-v0-1",
      final_status: "pass",
      contract_kind: fixture.contract_kind,
      contract_version: fixture.contract_version,
      source_salience_governor_validation_ref:
        fixture.source_salience_governor_validation_ref,
      allowed_source_input_count: fixture.allowed_source_inputs.length,
      disallowed_source_input_count: fixture.disallowed_source_inputs.length,
      runtime_source_fetch_implemented_now:
        fixture.authority_boundary.runtime_source_fetch_implemented_now,
      crawler_implemented_now: fixture.authority_boundary.crawler_implemented_now,
      provider_extraction_implemented_now:
        fixture.authority_boundary.provider_extraction_implemented_now,
      retrieval_rag_implemented_now:
        fixture.authority_boundary.retrieval_rag_implemented_now,
      durable_source_record_write_now:
        fixture.authority_boundary.durable_source_record_write_now,
      source_index_write_now: fixture.authority_boundary.source_index_write_now,
      product_write_lane_parked_by_686:
        fixture.authority_boundary.product_write_lane_parked_by_686,
      next_recommended_slice: fixture.next_recommended_slice,
    },
    null,
    2,
  ),
);

function buildContractFixture() {
  const sourceValidationRef =
    `${sourceValidationFixture.validation_version}:${sourceValidationFixturePath}#720`;
  const allowedSourceInputs = buildAllowedSourceInputs();
  const disallowedSourceInputs = buildDisallowedSourceInputs();
  const sourceReferencePolicy = buildSourceReferencePolicy();
  const candidateGenerationPolicy = buildCandidateGenerationPolicy();
  const provenancePolicy = buildProvenancePolicy();
  const privacyPolicy = buildPrivacyPolicy();
  const nonAuthorityPolicy = buildNonAuthorityPolicy();
  const authorityBoundary = buildAuthorityBoundary();
  const validationPolicy = buildValidationPolicy();
  const sourceRefs = buildSampleSourceRefs();
  const contract = {
    contract_kind: contractKind,
    contract_version: contractVersion,
    source_salience_governor_validation_ref: sourceValidationRef,
    intake_scope: {
      operator_provided_source_intake_contract: true,
      candidate_generation_input_only: true,
      contract_only_now: true,
      runtime_source_fetch_implemented_now: false,
      crawler_implemented_now: false,
      provider_extraction_implemented_now: false,
      retrieval_rag_implemented_now: false,
      db_schema_implemented_now: false,
      route_implemented_now: false,
      ui_implemented_now: false,
    },
    allowed_source_inputs: allowedSourceInputs,
    disallowed_source_inputs: disallowedSourceInputs,
    source_reference_policy: sourceReferencePolicy,
    candidate_generation_policy: candidateGenerationPolicy,
    provenance_policy: provenancePolicy,
    privacy_policy: privacyPolicy,
    non_authority_policy: nonAuthorityPolicy,
    sample_source_intake_reference_bundle: {
      source_intake_bundle_id:
        "bounded_external_source_intake_contract_sample_v0_1_001",
      intake_version: intakeVersion,
      generated_at: "2026-06-23T00:00:00.000Z",
      scope: "research_candidate_review:bounded_external_source_intake_contract_sample",
      source_refs: sourceRefs,
      disallowed_source_inputs: disallowedSourceInputs,
      source_reference_policy_ref:
        "bounded_external_source_intake_source_reference_policy.v0.1",
      candidate_generation_policy_ref:
        "bounded_external_source_intake_candidate_generation_policy.v0.1",
      provenance_policy_ref:
        "bounded_external_source_intake_provenance_policy.v0.1",
      privacy_policy_ref: "bounded_external_source_intake_privacy_policy.v0.1",
      non_authority_policy_ref:
        "bounded_external_source_intake_non_authority_policy.v0.1",
      authority_boundary: authorityBoundary,
      validation: validationPolicy,
    },
    authority_boundary: authorityBoundary,
    validation_policy: validationPolicy,
    recommendation_status: recommendationStatus,
    next_recommended_slice: nextRecommendedSlice,
    contract_fingerprint: "",
    fingerprint_algorithm: "fnv1a32_canonical_json",
  };
  contract.contract_fingerprint = createFingerprint(contract);
  return contract;
}

function buildAllowedSourceInputs() {
  return [
    "operator_provided_url_reference",
    "uploaded_pdf_metadata",
    "uploaded_notes_reference",
    "browser_capture_reference",
    "oauth_document_pointer",
    "repo_backed_doc_ref",
    "manual_bibliographic_reference",
  ].map((inputKind) => ({
    input_kind: inputKind,
    accepted_as_reference_only_now: true,
    source_fetch_now: false,
    provider_extraction_now: false,
    candidate_generation_later_only: true,
    requires_source_refs: true,
    requires_operator_context: true,
    public_safe_fixture_only_now: true,
  }));
}

function buildDisallowedSourceInputs() {
  return [
    ["crawler_seed", "Crawler seeds are outside this reference-only contract."],
    ["unbounded_domain_crawl", "Unbounded domain crawl is explicitly out of scope."],
    ["automatic_web_search", "Automatic search would fetch sources at runtime."],
    [
      "provider_generated_source_without_operator_ref",
      "Provider output without an operator source reference is not accepted.",
    ],
    [
      "raw_private_url_as_canonical_id",
      "Raw private URLs must not become canonical IDs.",
    ],
    ["raw_oauth_token", "OAuth tokens are secrets and never fixture content."],
    [
      "raw_thread_or_run_id",
      "Thread or run IDs are not stable public-safe source labels.",
    ],
    [
      "arbitrary_user_string_as_stable_id",
      "Arbitrary text is not a stable source identifier.",
    ],
  ].map(([inputKind, reason]) => ({
    input_kind: inputKind,
    disallowed_now: true,
    reason,
  }));
}

function buildSampleSourceRefs() {
  return [
    sourceRef(
      "source_ref_operator_url_reference",
      "operator_provided_url_reference",
      "operator_supplied",
      "Operator-provided public documentation URL reference",
      "source:operator_public_doc_reference",
      ["source:operator_public_doc_reference"],
      "operator_context:review_question_source_reference",
    ),
    sourceRef(
      "source_ref_uploaded_pdf_metadata",
      "uploaded_pdf_metadata",
      "uploaded_metadata_only",
      "Uploaded PDF metadata reference without file content",
      "source:uploaded_pdf_metadata_only",
      ["source:uploaded_pdf_metadata_only"],
      "operator_context:uploaded_metadata_review",
    ),
    sourceRef(
      "source_ref_uploaded_notes_reference",
      "uploaded_notes_reference",
      "reference_only",
      "Uploaded notes reference without durable memory write",
      "source:uploaded_notes_reference_only",
      ["source:uploaded_notes_reference_only"],
      "operator_context:notes_reference_review",
    ),
    sourceRef(
      "source_ref_browser_capture_reference",
      "browser_capture_reference",
      "reference_only",
      "Browser capture reference without browser request execution",
      "source:browser_capture_reference_only",
      ["source:browser_capture_reference_only"],
      "operator_context:browser_capture_reference_review",
    ),
    sourceRef(
      "source_ref_oauth_document_pointer",
      "oauth_document_pointer",
      "oauth_pointer_only",
      "OAuth document pointer without token or provider ID",
      "source:oauth_document_pointer_public_safe",
      ["source:oauth_document_pointer_public_safe"],
      "operator_context:oauth_pointer_review",
    ),
    sourceRef(
      "source_ref_repo_backed_doc",
      "repo_backed_doc_ref",
      "repo_backed",
      "Repository-backed document reference",
      "source:repo_backed_doc_reference",
      ["source:repo_backed_doc_reference"],
      "operator_context:repo_doc_review",
    ),
    sourceRef(
      "source_ref_manual_bibliographic",
      "manual_bibliographic_reference",
      "reference_only",
      "Manual bibliographic reference",
      "source:manual_bibliographic_reference",
      ["source:manual_bibliographic_reference"],
      "operator_context:bibliographic_review",
    ),
  ];
}

function sourceRef(
  sourceRefId,
  sourceInputKind,
  sourceStatus,
  referenceLabel,
  publicSafeRef,
  sourceRefs,
  operatorContextRef,
) {
  return {
    source_ref_id: sourceRefId,
    source_input_kind: sourceInputKind,
    source_status: sourceStatus,
    reference_label: referenceLabel,
    public_safe_ref: publicSafeRef,
    source_refs: sourceRefs,
    operator_context_ref: operatorContextRef,
    public_safe: true,
    accepted_as_reference_only_now: true,
    source_fetch_now: false,
    provider_extraction_now: false,
    candidate_generation_later_only: true,
  };
}

function buildSourceReferencePolicy() {
  return {
    references_only_now: true,
    no_fetch_now: true,
    no_crawl_now: true,
    no_provider_call_now: true,
    no_retrieval_rag_now: true,
    no_embedding_now: true,
    no_index_write_now: true,
    source_ref_required: true,
    source_ref_must_be_public_safe: true,
    raw_url_not_canonical_id: true,
    raw_provider_id_not_canonical_id: true,
    private_identifier_not_canonical_id: true,
  };
}

function buildCandidateGenerationPolicy() {
  return {
    source_intake_may_prepare_candidates_later: true,
    candidate_generation_not_implemented_now: true,
    generated_candidate_is_not_proof_or_evidence: true,
    generated_candidate_is_not_source_of_truth: true,
    generated_candidate_does_not_promote_perspective: true,
    generated_candidate_does_not_mutate_work: true,
    generated_candidate_does_not_write_product: true,
    human_review_required_later: true,
  };
}

function buildProvenancePolicy() {
  return {
    source_refs_required: true,
    operator_context_required: true,
    provenance_visible_to_review_surface_later: true,
    unresolved_source_status_allowed: true,
    source_status_values: [
      "reference_only",
      "operator_supplied",
      "repo_backed",
      "uploaded_metadata_only",
      "oauth_pointer_only",
      "unresolved",
      "rejected_for_now",
    ],
  };
}

function buildPrivacyPolicy() {
  return {
    public_safe_fixture_only_now: true,
    no_secrets_in_fixture: true,
    no_raw_oauth_tokens: true,
    no_private_urls_in_fixture: true,
    no_provider_ids_as_canonical_labels: true,
    no_thread_run_session_ids_as_canonical_labels: true,
  };
}

function buildNonAuthorityPolicy() {
  return {
    not_source_of_truth: true,
    not_proof_or_evidence: true,
    not_perspective_state: true,
    not_work_status: true,
    not_promotion_basis: true,
    not_retrieval_rag_result: true,
    not_salience_authority: true,
    not_product_write: true,
    source_reference_not_evidence_record: true,
    provider_summary_not_evidence_record: true,
    retrieval_result_not_authority: true,
  };
}

function buildAuthorityBoundary() {
  return {
    contract_only: true,
    bounded_external_source_intake_contract_defined_now: true,
    runtime_source_fetch_implemented_now: false,
    crawler_implemented_now: false,
    provider_extraction_implemented_now: false,
    retrieval_rag_implemented_now: false,
    source_index_write_now: false,
    durable_source_record_write_now: false,
    candidate_generation_now: false,
    candidate_mutation_now: false,
    db_schema_implemented_now: false,
    route_changed_now: false,
    component_changed_now: false,
    browser_request_now: false,
    runtime_db_query_now: false,
    runtime_db_write_now: false,
    production_db_used_now: false,
    durable_memory_write_now: false,
    durable_salience_write_now: false,
    recent_rehearsal_buffer_written_now: false,
    formation_receipt_written_now: false,
    feedback_events_written_now: false,
    feedback_events_mutated_now: false,
    proof_or_evidence_record: false,
    perspective_promotion: false,
    durable_perspective_state_write: false,
    promotion_decision_record: false,
    work_mutation: false,
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

function buildValidationPolicy() {
  return {
    static_source_validation_only: true,
    fixture_backed_only: true,
    app_server_started_now: false,
    production_db_used_now: false,
    runtime_browser_request_now: false,
    runtime_db_query_now: false,
    runtime_db_write_now: false,
    runtime_source_fetch_now: false,
    runtime_provider_call_now: false,
    runtime_retrieval_rag_now: false,
  };
}

function assertTypeContract() {
  for (const exportName of [
    "BoundedExternalSourceIntakeContract",
    "BoundedExternalSourceIntakeScope",
    "BoundedExternalAllowedSourceInputPolicy",
    "BoundedExternalDisallowedSourceInputPolicy",
    "BoundedExternalSourceReferencePolicy",
    "BoundedExternalCandidateGenerationPolicy",
    "BoundedExternalProvenancePolicy",
    "BoundedExternalPrivacyPolicy",
    "BoundedExternalNonAuthorityPolicy",
    "BoundedExternalAuthorityBoundary",
    "BoundedExternalValidationPolicy",
    "BoundedExternalSourceIntakeReferenceBundle",
  ]) {
    assert.match(
      typeSource,
      new RegExp(`export\\s+(type|interface)\\s+${escapeRegExp(exportName)}\\b`),
      `${typePath} must export ${exportName}`,
    );
  }
  for (const requiredText of [
    contractKind,
    contractVersion,
    "source_salience_governor_validation_ref",
    "intake_scope",
    "allowed_source_inputs",
    "disallowed_source_inputs",
    "source_reference_policy",
    "candidate_generation_policy",
    "provenance_policy",
    "privacy_policy",
    "non_authority_policy",
    "sample_source_intake_reference_bundle",
    "authority_boundary",
    "validation_policy",
    recommendationStatus,
    nextRecommendedSlice,
    "contract_fingerprint",
    "fnv1a32_canonical_json",
  ]) {
    assert.ok(typeSource.includes(requiredText), `${typePath} must include ${requiredText}`);
  }
}

function assertPackageScript() {
  if (durablePerspectiveStateTrajectoryBrowserValidationSliceActive()) {
    assertDurablePerspectiveStateTrajectoryBrowserValidationPackageScript();
    return;
  }
  if (durablePerspectiveStateTrajectoryImplementationSliceActive()) {
    assertDurablePerspectiveStateTrajectoryImplementationPackageScript();
    return;
  }
  if (durablePerspectiveStateTrajectoryContractSliceActive()) {
    assertDurablePerspectiveStateTrajectoryContractPackageScript();
    return;
  }
  if (humanReviewedDurablePerspectivePromotionBrowserValidationSliceActive()) {
    assertHumanReviewedDurablePerspectivePromotionBrowserValidationPackageScript();
    return;
  }
  if (humanReviewedDurablePerspectivePromotionImplementationSliceActive()) {
    assertHumanReviewedDurablePerspectivePromotionImplementationPackageScript();
    return;
  }
  if (humanReviewedDurablePerspectivePromotionContractSliceActive()) {
    assertHumanReviewedDurablePerspectivePromotionContractPackageScript();
    return;
  }
  if (nonAuthoritativeRetrievalRagBrowserValidationSliceActive()) {
    assertNonAuthoritativeRetrievalRagBrowserValidationPackageScript();
    return;
  }
  if (nonAuthoritativeRetrievalRagImplementationSliceActive()) {
    assertNonAuthoritativeRetrievalRagImplementationPackageScript();
    return;
  }
  if (nonAuthoritativeRetrievalRagContractSliceActive()) {
    assertNonAuthoritativeRetrievalRagContractPackageScript();
    return;
  }
  if (operatorSourceCandidateGenerationBrowserValidationSliceActive()) {
    assertOperatorSourceCandidateGenerationBrowserValidationPackageScript();
    return;
  }
  if (operatorSourceCandidateGenerationImplementationSliceActive()) {
    assertOperatorSourceCandidateGenerationImplementationPackageScript();
    return;
  }
  if (operatorSourceCandidateGenerationContractSliceActive()) {
    assertOperatorSourceCandidateGenerationContractPackageScript();
    return;
  }
  if (browserValidationSliceActive()) {
    assertBrowserValidationPackageScript();
    return;
  }
  if (implementationSliceActive()) {
    assertImplementationPackageScript();
    return;
  }
  assert.equal(packageJson.scripts[packageScriptName], packageScriptValue);
  const addedScripts = Object.keys(packageJson.scripts)
    .filter((scriptName) => !basePackageJson.scripts[scriptName])
    .sort();
  assert.deepEqual(
    addedScripts,
    [packageScriptName],
    "package.json must add only the Bounded External Source Intake contract smoke script",
  );
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
  if (durablePerspectiveStateTrajectoryBrowserValidationSliceActive()) {
    assertDurablePerspectiveStateTrajectoryBrowserValidationChangedFiles(changedFiles);
    return;
  }
  if (durablePerspectiveStateTrajectoryImplementationSliceActive()) {
    assertDurablePerspectiveStateTrajectoryImplementationChangedFiles(changedFiles);
    return;
  }
  if (durablePerspectiveStateTrajectoryContractSliceActive()) {
    assertDurablePerspectiveStateTrajectoryContractChangedFiles(changedFiles);
    return;
  }
  if (humanReviewedDurablePerspectivePromotionBrowserValidationSliceActive()) {
    assertHumanReviewedDurablePerspectivePromotionBrowserValidationChangedFiles(changedFiles);
    return;
  }
  if (humanReviewedDurablePerspectivePromotionImplementationSliceActive()) {
    assertHumanReviewedDurablePerspectivePromotionImplementationChangedFiles(changedFiles);
    return;
  }
  if (humanReviewedDurablePerspectivePromotionContractSliceActive()) {
    assertHumanReviewedDurablePerspectivePromotionContractChangedFiles(changedFiles);
    return;
  }
  if (nonAuthoritativeRetrievalRagBrowserValidationSliceActive()) {
    assertNonAuthoritativeRetrievalRagBrowserValidationChangedFiles(changedFiles);
    return;
  }
  if (nonAuthoritativeRetrievalRagImplementationSliceActive()) {
    assertNonAuthoritativeRetrievalRagImplementationChangedFiles(changedFiles);
    return;
  }
  if (nonAuthoritativeRetrievalRagContractSliceActive()) {
    assertNonAuthoritativeRetrievalRagContractChangedFiles(changedFiles);
    return;
  }
  if (operatorSourceCandidateGenerationBrowserValidationSliceActive()) {
    assertOperatorSourceCandidateGenerationBrowserValidationChangedFiles(changedFiles);
    return;
  }
  if (operatorSourceCandidateGenerationImplementationSliceActive()) {
    assertOperatorSourceCandidateGenerationImplementationChangedFiles(changedFiles);
    return;
  }
  if (operatorSourceCandidateGenerationContractSliceActive()) {
    assertOperatorSourceCandidateGenerationContractChangedFiles(changedFiles);
    return;
  }
  if (browserValidationSliceActive()) {
    assertBrowserValidationChangedFiles(changedFiles);
    return;
  }
  if (implementationSliceActive()) {
    assertImplementationChangedFiles(changedFiles);
    return;
  }
  for (const unchangedPath of [
    "lib/research-candidate-review/salience-governor.ts",
    "fixtures/research-candidate-review.salience-governor-implementation.sample.v0.1.json",
    "lib/research-candidate-review/recent-rehearsal-buffer.ts",
    "fixtures/research-candidate-review.recent-rehearsal-buffer-implementation.sample.v0.1.json",
  ]) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      `Bounded External Source Intake contract slice must not change ${unchangedPath}`,
    );
  }
  for (const expectedFile of expectedChangedFiles) {
    assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedChangedFiles.includes(changedFile),
      `unexpected changed file in Bounded External Source Intake contract slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /(^|\/)(provider|retrieval|source-fetch)\b/i);
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
}


function durablePerspectiveStateTrajectoryContractSliceActive() {
  return readChangedFiles().includes(
    "scripts/smoke-durable-perspective-state-trajectory-contract-v0-1.mjs",
  );
}

function assertDurablePerspectiveStateTrajectoryContractPackageScript() {
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
    packageJson.scripts["smoke:durable-perspective-state-trajectory-contract-v0-1"],
    "node scripts/smoke-durable-perspective-state-trajectory-contract-v0-1.mjs",
  );
  assert.deepEqual(
    addedScriptNames,
    ["smoke:durable-perspective-state-trajectory-contract-v0-1"],
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

function assertDurablePerspectiveStateTrajectoryContractChangedFiles(changedFiles) {
  const expectedFiles = [
    "types/durable-perspective-state-trajectory-contract.ts",
    "fixtures/research-candidate-review.durable-perspective-state-trajectory-contract.sample.v0.1.json",
    "scripts/smoke-durable-perspective-state-trajectory-contract-v0-1.mjs",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
    "scripts/smoke-human-reviewed-durable-perspective-promotion-browser-validation-v0-1.mjs",
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
    "scripts/smoke-feedback-event-store-minimal-v0-1.mjs"
];
  const protectedUnchangedPaths = [
    "fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-browser-validation.sample.v0.1.json",
    "types/human-reviewed-durable-perspective-promotion-contract.ts",
    "fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-contract.sample.v0.1.json",
    "lib/research-candidate-review/human-reviewed-durable-perspective-promotion.ts",
    "fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-implementation.sample.v0.1.json",
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
  for (const unchangedPath of protectedUnchangedPaths) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      "Durable Perspective State / Trajectory contract slice must not change " + unchangedPath,
    );
  }
  for (const expectedFile of [
    "types/durable-perspective-state-trajectory-contract.ts",
    "fixtures/research-candidate-review.durable-perspective-state-trajectory-contract.sample.v0.1.json",
    "scripts/smoke-durable-perspective-state-trajectory-contract-v0-1.mjs",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
    "scripts/smoke-human-reviewed-durable-perspective-promotion-browser-validation-v0-1.mjs",
  ]) {
    assert.ok(changedFiles.includes(expectedFile), "changed files must include " + expectedFile);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      "unexpected changed file in Durable Perspective State / Trajectory contract downstream slice: " + changedFile,
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
  const durablePerspectiveStateTrajectoryContractSmokeSource =
    typeof smokeSource === "string" ? smokeSource : readFileSync(smokePath, "utf8");
  for (const requiredText of [
    "durable_perspective_state_trajectory_contract.v0.1",
    "types/durable-perspective-state-trajectory-contract.ts",
    "fixtures/research-candidate-review.durable-perspective-state-trajectory-contract.sample.v0.1.json",
    "scripts/smoke-durable-perspective-state-trajectory-contract-v0-1.mjs",
    "smoke:durable-perspective-state-trajectory-contract-v0-1",
    "ready_for_durable_perspective_state_trajectory_implementation_v0_1",
    "durable_perspective_state_trajectory_implementation_v0_1",
    "future durable Perspective state shape and trajectory grammar",
    "current thesis has lineage",
    "prior thesis is not overwritten silently",
    "product-write remains parked by #686",
  ]) {
    assert.ok(
      durablePerspectiveStateTrajectoryContractSmokeSource.includes(requiredText),
      "smoke must allow Durable Perspective State / Trajectory contract downstream pointer: " + requiredText,
    );
  }
}



function durablePerspectiveStateTrajectoryBrowserValidationSliceActive() {
  return readChangedFiles().includes(stateTrajectoryBrowserValidationSmokePath);
}

function assertDurablePerspectiveStateTrajectoryBrowserValidationPackageScript() {
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
    packageJson.scripts[stateTrajectoryBrowserValidationPackageScriptName],
    stateTrajectoryBrowserValidationPackageScriptValue,
  );
  assert.deepEqual(
    addedScriptNames,
    [stateTrajectoryBrowserValidationPackageScriptName],
    "package.json must add only the Durable Perspective State / Trajectory browser validation smoke script",
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

function assertDurablePerspectiveStateTrajectoryBrowserValidationChangedFiles(changedFiles) {
  const expectedFiles = [
    stateTrajectoryBrowserValidationFixturePath,
    stateTrajectoryBrowserValidationSmokePath,
    stateTrajectoryImplementationSmokePath,
    stateTrajectoryImplementationContractSmokePath,
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
    ...stateTrajectoryImplementationDownstreamSmokePaths,
  ];
  for (const unchangedPath of [
    "types/durable-perspective-state-trajectory-contract.ts",
    "fixtures/research-candidate-review.durable-perspective-state-trajectory-contract.sample.v0.1.json",
    stateTrajectoryImplementationBuilderPath,
    stateTrajectoryImplementationFixturePath,
    "fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-browser-validation.sample.v0.1.json",
    "types/human-reviewed-durable-perspective-promotion-contract.ts",
    "fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-contract.sample.v0.1.json",
    "lib/research-candidate-review/human-reviewed-durable-perspective-promotion.ts",
    "fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-implementation.sample.v0.1.json",
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
    assert.ok(!changedFiles.includes(unchangedPath), "Durable Perspective State / Trajectory browser validation slice must not change " + unchangedPath);
  }
  for (const expectedFile of [
    stateTrajectoryBrowserValidationFixturePath,
    stateTrajectoryBrowserValidationSmokePath,
    stateTrajectoryImplementationSmokePath,
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
  ]) {
    assert.ok(changedFiles.includes(expectedFile), "changed files must include " + expectedFile);
  }
  for (const changedFile of changedFiles) {
    assert.ok(expectedFiles.includes(changedFile), "unexpected changed file in Durable Perspective State / Trajectory browser validation downstream slice: " + changedFile);
    assert.ok(!changedFile.startsWith("app/api/"), "must not change app/api routes");
    assert.ok(!changedFile.endsWith("route.ts"), "must not change route handlers");
    assert.ok(!changedFile.startsWith("components/"), "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.ok(!changedFile.startsWith("migrations/"), "must not change migrations");
    assert.ok(!changedFile.startsWith("lib/research-retrieval/"), "must not add retrieval implementation files");
    assert.ok(!changedFile.startsWith("lib/research-rag/"), "must not add RAG implementation files");
    assert.equal(new RegExp("^lib/.*perspective.*state", "i").test(changedFile), false, "must not add runtime Perspective state files");
    assert.equal(new RegExp("^lib/.*perspective.*snapshot", "i").test(changedFile), false, "must not add runtime PerspectiveSnapshot files");
    assert.equal(new RegExp("^lib/.*trajectory", "i").test(changedFile), false, "must not add runtime trajectory builder files");
    assert.equal(new RegExp("^lib/.*promotion", "i").test(changedFile), false, "must not add runtime promotion implementation files");
    assert.equal(new RegExp("^lib/.*(proof|evidence).*write", "i").test(changedFile), false, "must not add proof/evidence write files");
    assert.equal(new RegExp("(^|/)(provider|openai|source-fetch|crawler)\b", "i").test(changedFile), false, "must not change provider/OpenAI/source-fetch/crawler files");
    assert.equal(new RegExp("product.*write", "i").test(changedFile), false, "must not change product write files");
  }
  const stateTrajectoryImplementationSmokeSource = readFileSync(stateTrajectoryImplementationSmokePath, "utf8");
  for (const requiredText of [
    stateTrajectoryBrowserValidationVersion,
    stateTrajectoryBrowserValidationFixturePath,
    stateTrajectoryBrowserValidationSmokePath,
    stateTrajectoryBrowserValidationPackageScriptName,
    stateTrajectoryBrowserValidationRecommendationStatus,
    stateTrajectoryBrowserValidationNextRecommendedSlice,
    "validates deterministic fixture-backed implementation from #734",
    "current thesis has lineage",
    "PerspectiveSnapshot runtime not implemented",
    "product-write remains parked by #686",
  ]) {
    assert.ok(stateTrajectoryImplementationSmokeSource.includes(requiredText), "smoke must allow Durable Perspective State / Trajectory browser validation downstream pointer: " + requiredText);
  }
}

function durablePerspectiveStateTrajectoryImplementationSliceActive() {
  return readChangedFiles().includes(stateTrajectoryImplementationSmokePath);
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
    packageJson.scripts[stateTrajectoryImplementationPackageScriptName],
    stateTrajectoryImplementationPackageScriptValue,
  );
  assert.deepEqual(
    addedScriptNames,
    [stateTrajectoryImplementationPackageScriptName],
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

function assertDurablePerspectiveStateTrajectoryImplementationChangedFiles(changedFiles) {
  const expectedFiles = [
    stateTrajectoryImplementationBuilderPath,
    stateTrajectoryImplementationFixturePath,
    stateTrajectoryImplementationSmokePath,
    stateTrajectoryImplementationContractSmokePath,
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
    ...stateTrajectoryImplementationDownstreamSmokePaths,
  ];
  for (const unchangedPath of [
    "types/durable-perspective-state-trajectory-contract.ts",
    "fixtures/research-candidate-review.durable-perspective-state-trajectory-contract.sample.v0.1.json",
    "fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-browser-validation.sample.v0.1.json",
    "types/human-reviewed-durable-perspective-promotion-contract.ts",
    "fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-contract.sample.v0.1.json",
    "lib/research-candidate-review/human-reviewed-durable-perspective-promotion.ts",
    "fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-implementation.sample.v0.1.json",
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
    assert.ok(!changedFiles.includes(unchangedPath), "Durable Perspective State / Trajectory implementation slice must not change " + unchangedPath);
  }
  for (const expectedFile of [
    stateTrajectoryImplementationBuilderPath,
    stateTrajectoryImplementationFixturePath,
    stateTrajectoryImplementationSmokePath,
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
    stateTrajectoryImplementationContractSmokePath,
  ]) {
    assert.ok(changedFiles.includes(expectedFile), "changed files must include " + expectedFile);
  }
  for (const changedFile of changedFiles) {
    assert.ok(expectedFiles.includes(changedFile), "unexpected changed file in Durable Perspective State / Trajectory implementation downstream slice: " + changedFile);
    assert.ok(!changedFile.startsWith("app/api/"), "must not change app/api routes");
    assert.ok(!changedFile.endsWith("route.ts"), "must not change route handlers");
    assert.ok(!changedFile.startsWith("components/"), "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.ok(!changedFile.startsWith("migrations/"), "must not change migrations");
    assert.ok(!changedFile.startsWith("lib/research-retrieval/"), "must not add retrieval implementation files");
    assert.ok(!changedFile.startsWith("lib/research-rag/"), "must not add RAG implementation files");
    if (changedFile !== stateTrajectoryImplementationBuilderPath) {
      assert.equal(new RegExp("^lib/.*perspective.*state", "i").test(changedFile), false, "must not add runtime Perspective state files");
      assert.equal(new RegExp("^lib/.*perspective.*snapshot", "i").test(changedFile), false, "must not add runtime PerspectiveSnapshot files");
      assert.equal(new RegExp("^lib/.*trajectory", "i").test(changedFile), false, "must not add runtime trajectory builder files");
    }
    assert.equal(new RegExp("^lib/.*promotion", "i").test(changedFile), false, "must not add runtime promotion implementation files");
    assert.equal(new RegExp("^lib/.*(proof|evidence).*write", "i").test(changedFile), false, "must not add proof/evidence write files");
    assert.equal(new RegExp("(^|/)(provider|openai|source-fetch|crawler)\\b", "i").test(changedFile), false, "must not change provider/OpenAI/source-fetch/crawler files");
    assert.equal(new RegExp("product.*write", "i").test(changedFile), false, "must not change product write files");
  }
  const stateTrajectoryImplementationSmokeSource = readFileSync(stateTrajectoryImplementationSmokePath, "utf8");
  for (const requiredText of [
    stateTrajectoryImplementationVersion,
    stateTrajectoryImplementationBuilderPath,
    stateTrajectoryImplementationFixturePath,
    stateTrajectoryImplementationSmokePath,
    stateTrajectoryImplementationPackageScriptName,
    stateTrajectoryImplementationRecommendationStatus,
    stateTrajectoryImplementationNextRecommendedSlice,
    "deterministic fixture-backed implementation only",
    "current thesis has lineage",
    "product-write remains parked by #686",
  ]) {
    assert.ok(stateTrajectoryImplementationSmokeSource.includes(requiredText), "smoke must allow Durable Perspective State / Trajectory implementation downstream pointer: " + requiredText);
  }
}

function assertNoForbiddenRuntimePatterns() {
  const changedSourceFiles = readChangedFiles().filter((filePath) =>
    filePath !== "types/non-authoritative-retrieval-rag-contract.ts" &&
    (filePath.endsWith(".ts") || filePath.endsWith(".tsx") || filePath.endsWith(".mjs")) &&
    !filePath.startsWith("scripts/smoke-"),
  );
  for (const filePath of changedSourceFiles) {
    const source = stripValidationText(readFile(filePath));
    for (const { label, regex } of [
      { label: "route handler", regex: /\bexport\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\b/ },
      { label: "server action", regex: /["']use server["']/ },
      { label: "browser fetch", regex: /\bfetch\s*\(/ },
      { label: "localStorage", regex: /\blocalStorage\b/ },
      { label: "sessionStorage", regex: /\bsessionStorage\b/ },
      { label: "indexedDB", regex: /\bindexedDB\b/ },
      { label: "document.cookie", regex: /document\.cookie/ },
      { label: "DB open", regex: /\bnew\s+Database\b|\bopenDatabase\b|better-sqlite3/i },
      { label: "runtime SQL", regex: /\bdb\.(prepare|query|exec)\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b/ },
      { label: "DB write", regex: /\bdb\.(insert|update|delete|transaction)\b|\bruntimeDbWrite\b|\bproductionDbWrite\b/i },
      { label: "durable memory write", regex: /\b(write|insert|persist)DurableMemory\b|\bdurableMemoryWrite\b/i },
      { label: "durable source record write", regex: /\b(write|insert|persist)DurableSource\b|\bdurableSourceRecordWrite\b/i },
      { label: "source index write", regex: /\bwriteSourceIndex\b|\bsourceIndexWrite\b/i },
      { label: "source fetch call", regex: /\bfetchSource\b|\bsourceFetch\b/ },
      { label: "crawler execution", regex: /\brunCrawler\b|\bcrawlDomain\b|\bcrawlerSeed\b/i },
      { label: "external HTTP request", regex: /\bhttps?\.request\b|\bXMLHttpRequest\b/ },
      { label: "provider extraction", regex: /\bproviderExtract\b|\brunProviderExtraction\b/i },
      { label: "OpenAI import", regex: /from\s+["'][^"']*openai["']/i },
      { label: "OpenAI constructor", regex: /new\s+OpenAI\b/i },
      { label: "retrieval execution", regex: /\brunRetrieval\b|\brunRag\b|\brunRAG\b/ },
      { label: "embedding/vector/FTS implementation", regex: /\bcreateEmbedding\b|\bvectorIndex\b|\bFTS5\b/i },
      { label: "candidate mutation", regex: /\bmutateCandidate\b|\bupdateCandidate\b|\bdeleteCandidate\b/ },
      { label: "candidate generation implementation", regex: /\bgenerateCandidate\b|\bcreateCandidateFromSource\b/i },
      { label: "Codex product execution", regex: /\bcodex\s+(exec|run)\b/i },
      { label: "GitHub automation", regex: /\bgh\s+pr\b|Octokit|api\.github\.com/i },
      { label: "external handoff send", regex: /\bsendExternalHandoff\b/ },
      { label: "agent execution", regex: /\bexecuteAgent\b|\brouteAgent\b/ },
      { label: "proof write", regex: /\bcreateProof\b|\binsertProof\b/ },
      { label: "evidence write", regex: /\bcreateEvidence\b|\binsertEvidence\b/ },
      { label: "Perspective promotion", regex: /\bpromotePerspective\b/ },
      { label: "Perspective durable state write", regex: /\bwritePerspective\b|\bupsertPerspective\b/ },
      { label: "promotion decision", regex: /\bcreatePromotionDecision\b|\brecordPromotionDecision\b/ },
      { label: "work mutation", regex: /\bcreateWork\b|\bmutateWork\b|\bupdateWork\b/ },
      { label: "salience authority true flag", regex: /\bsalience_authority:\s*true\b/ },
      { label: "product write", regex: /\bexecuteProductWrite\b|\bproductDbWrite\b/i },
      { label: "product ID allocation", regex: /\ballocateProductId\b/i },
    ]) {
      assert.doesNotMatch(source, regex, `${filePath} must not include ${label}`);
    }
  }
}

function assertContractShape(value) {
  assert.equal(value.contract_kind, contractKind);
  assert.equal(value.contract_version, contractVersion);
  assert.equal(
    value.source_salience_governor_validation_ref,
    `${sourceValidationFixture.validation_version}:${sourceValidationFixturePath}#720`,
  );
  assert.equal(value.recommendation_status, recommendationStatus);
  assert.equal(value.next_recommended_slice, nextRecommendedSlice);
  assert.match(value.contract_fingerprint, /^fnv1a32:[0-9a-f]{8}$/);
  assert.equal(value.fingerprint_algorithm, "fnv1a32_canonical_json");
}

function assertIntakeScope(value) {
  assert.deepEqual(value, {
    operator_provided_source_intake_contract: true,
    candidate_generation_input_only: true,
    contract_only_now: true,
    runtime_source_fetch_implemented_now: false,
    crawler_implemented_now: false,
    provider_extraction_implemented_now: false,
    retrieval_rag_implemented_now: false,
    db_schema_implemented_now: false,
    route_implemented_now: false,
    ui_implemented_now: false,
  });
}

function assertAllowedSourceInputs(value) {
  assert.deepEqual(
    value.map((entry) => entry.input_kind),
    [
      "operator_provided_url_reference",
      "uploaded_pdf_metadata",
      "uploaded_notes_reference",
      "browser_capture_reference",
      "oauth_document_pointer",
      "repo_backed_doc_ref",
      "manual_bibliographic_reference",
    ],
  );
  for (const entry of value) {
    assert.equal(entry.accepted_as_reference_only_now, true);
    assert.equal(entry.source_fetch_now, false);
    assert.equal(entry.provider_extraction_now, false);
    assert.equal(entry.candidate_generation_later_only, true);
    assert.equal(entry.requires_source_refs, true);
    assert.equal(entry.requires_operator_context, true);
    assert.equal(entry.public_safe_fixture_only_now, true);
  }
}

function assertDisallowedSourceInputs(value) {
  const kinds = value.map((entry) => entry.input_kind);
  for (const requiredKind of [
    "crawler_seed",
    "unbounded_domain_crawl",
    "automatic_web_search",
    "raw_oauth_token",
    "raw_private_url_as_canonical_id",
  ]) {
    assert.ok(kinds.includes(requiredKind), `disallowed inputs must include ${requiredKind}`);
  }
  for (const entry of value) {
    assert.equal(entry.disallowed_now, true);
    assert.equal(typeof entry.reason, "string");
    assert.ok(entry.reason.length > 0);
  }
}

function assertSourceReferencePolicy(value) {
  assert.deepEqual(value, buildSourceReferencePolicy());
}

function assertCandidateGenerationPolicy(value) {
  assert.equal(value.source_intake_may_prepare_candidates_later, true);
  assert.equal(value.candidate_generation_not_implemented_now, true);
  assert.equal(value.generated_candidate_is_not_proof_or_evidence, true);
  assert.equal(value.generated_candidate_is_not_source_of_truth, true);
  assert.equal(value.generated_candidate_does_not_promote_perspective, true);
  assert.equal(value.generated_candidate_does_not_mutate_work, true);
  assert.equal(value.generated_candidate_does_not_write_product, true);
  assert.equal(value.human_review_required_later, true);
}

function assertProvenancePolicy(value) {
  assert.equal(value.source_refs_required, true);
  assert.equal(value.operator_context_required, true);
  assert.equal(value.provenance_visible_to_review_surface_later, true);
  assert.equal(value.unresolved_source_status_allowed, true);
  assert.deepEqual(value.source_status_values, [
    "reference_only",
    "operator_supplied",
    "repo_backed",
    "uploaded_metadata_only",
    "oauth_pointer_only",
    "unresolved",
    "rejected_for_now",
  ]);
}

function assertPrivacyPolicy(value) {
  assert.equal(value.public_safe_fixture_only_now, true);
  assert.equal(value.no_secrets_in_fixture, true);
  assert.equal(value.no_raw_oauth_tokens, true);
  assert.equal(value.no_private_urls_in_fixture, true);
  assert.equal(value.no_provider_ids_as_canonical_labels, true);
  assert.equal(value.no_thread_run_session_ids_as_canonical_labels, true);
}

function assertNonAuthorityPolicy(value) {
  assert.equal(value.not_source_of_truth, true);
  assert.equal(value.not_proof_or_evidence, true);
  assert.equal(value.not_perspective_state, true);
  assert.equal(value.not_work_status, true);
  assert.equal(value.not_promotion_basis, true);
  assert.equal(value.not_retrieval_rag_result, true);
  assert.equal(value.not_salience_authority, true);
  assert.equal(value.not_product_write, true);
  assert.equal(value.source_reference_not_evidence_record, true);
  assert.equal(value.provider_summary_not_evidence_record, true);
  assert.equal(value.retrieval_result_not_authority, true);
}

function assertSampleSourceIntakeReferenceBundle(value) {
  assert.equal(value.intake_version, intakeVersion);
  assert.ok(Array.isArray(value.source_refs));
  assert.equal(
    value.source_refs.length,
    fixture.allowed_source_inputs.length,
    "sample bundle must include examples for allowed source input kinds",
  );
  const sampleKinds = value.source_refs.map((entry) => entry.source_input_kind);
  assert.deepEqual(
    sampleKinds,
    fixture.allowed_source_inputs.map((entry) => entry.input_kind),
  );
  for (const sourceRefValue of value.source_refs) {
    assert.equal(sourceRefValue.public_safe, true);
    assert.ok(sourceRefValue.source_refs.length > 0);
    assert.equal(typeof sourceRefValue.operator_context_ref, "string");
    assert.ok(sourceRefValue.operator_context_ref.length > 0);
    assert.equal(sourceRefValue.accepted_as_reference_only_now, true);
    assert.equal(sourceRefValue.source_fetch_now, false);
    assert.equal(sourceRefValue.provider_extraction_now, false);
    assert.equal(sourceRefValue.candidate_generation_later_only, true);
    assert.doesNotMatch(sourceRefValue.public_safe_ref, /^https?:\/\//);
    assert.doesNotMatch(sourceRefValue.public_safe_ref, /raw_oauth|token|secret|private/i);
    assert.doesNotMatch(sourceRefValue.public_safe_ref, /thread|run|session/i);
  }
  assert.deepEqual(value.disallowed_source_inputs, fixture.disallowed_source_inputs);
  assert.deepEqual(value.authority_boundary, fixture.authority_boundary);
  assert.deepEqual(value.validation, fixture.validation_policy);
}

function assertAuthorityBoundary(value) {
  assert.equal(value.product_write_lane_parked_by_686, true);
  for (const [key, flag] of Object.entries(value)) {
    if (
      key === "contract_only" ||
      key === "bounded_external_source_intake_contract_defined_now" ||
      key === "product_write_lane_parked_by_686"
    ) {
      assert.equal(flag, true, `${key} must be true`);
    } else {
      assert.equal(flag, false, `${key} must be false`);
    }
  }
}

function assertValidationPolicy(value) {
  assert.deepEqual(value, buildValidationPolicy());
}

function assertDocsPointers() {
  for (const requiredText of [
    "Bounded External Source Intake contract v0.1",
    typePath,
    fixturePath,
    smokePath,
    packageScriptName,
    "contract-only operator-provided source intake reference policy",
    "allowed reference-only source input kinds",
    "disallowed crawler/search/provider/raw private ID inputs",
    "no runtime source fetch",
    "no crawler",
    "no provider/OpenAI call",
    "no retrieval/RAG execution",
    "no source index write",
    "no durable source record write",
    "no runtime persistence",
    "no durable memory write",
    "no runtime DB write/query",
    "no schema/migration",
    "no route or UI",
    "no browser request",
    "no proof/evidence/Perspective promotion/candidate mutation/work mutation",
    "no product write/product IDs",
    "product-write remains parked by #686",
    nextRecommendedSlice,
  ]) {
    assert.ok(indexDoc.includes(requiredText), `index doc must include ${requiredText}`);
  }
  for (const doc of [substrateDoc, surfaceDoc, gateDoc]) {
    assert.match(doc, /Bounded External Source Intake contract v0\.1/i);
    assert.match(doc, /reference-only/i);
    assert.match(doc, /operator-provided/i);
    assert.match(doc, /not source fetch|no runtime DB|runtime DB/i);
    assert.match(doc, /crawler/i);
    assert.match(doc, /provider/i);
    assert.match(doc, /retrieval\/RAG/i);
    assert.match(doc, /not proof\/evidence/i);
    assert.match(doc, /Perspective state|durable Perspective promotion/i);
    assert.match(doc, /work status|work mutation/i);
    assert.match(doc, /promotion authority|promotion/i);
    assert.match(doc, /salience authority/i);
    assert.match(doc, /product write/i);
    assert.match(doc, new RegExp(nextRecommendedSlice));
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
    "operator-provided source intake reference policy",
    "product-write remains parked by #686",
  ]) {
    assert.ok(
      sourceValidationSmoke.includes(requiredText),
      `#720 Salience Governor browser validation smoke must allow Bounded External Source Intake downstream pointer: ${requiredText}`,
    );
  }
}

function assertImplementationDownstreamPointer() {
  for (const requiredText of [
    implementationVersion,
    implementationBuilderPath,
    implementationFixturePath,
    implementationSmokePath,
    implementationPackageScriptName,
    implementationRecommendationStatus,
    implementationNextRecommendedSlice,
    "reference-only source intake bundles",
    "product-write remains parked by #686",
  ]) {
    assert.ok(
      smokeSource().includes(requiredText),
      `#721 Bounded External Source Intake contract smoke must allow implementation downstream pointer: ${requiredText}`,
    );
  }
}

function assertPortableMergeBaseFallback() {
  for (const requiredText of [
    "gitRefExists",
    "tryGitOutput",
    "origin/main",
    "main",
    "HEAD^",
    "Unable to determine a base ref for static changed-file validation",
  ]) {
    assert.ok(smokeSource().includes(requiredText), `smoke must include portable mergeBaseRef text: ${requiredText}`);
  }
}

function createFingerprint(value) {
  const normalized = JSON.parse(JSON.stringify(value));
  delete normalized.contract_fingerprint;
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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function readFile(filePath) {
  return readFileSync(filePath, "utf8");
}

function smokeSource() {
  return readFile(smokePath);
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

function implementationSliceActive() {
  return readChangedFiles().includes(implementationSmokePath);
}

function operatorSourceCandidateGenerationImplementationSliceActive() {
  return readChangedFiles().includes(
    "scripts/smoke-operator-source-candidate-generation-implementation-v0-1.mjs",
  );
}

function nonAuthoritativeRetrievalRagBrowserValidationSliceActive() {
  return (
    !humanReviewedDurablePerspectivePromotionContractSliceActive() &&
    readChangedFiles().includes(
      "scripts/smoke-non-authoritative-retrieval-rag-browser-validation-v0-1.mjs",
    )
  );
}

function nonAuthoritativeRetrievalRagImplementationSliceActive() {
  return (
    !humanReviewedDurablePerspectivePromotionContractSliceActive() &&
    !nonAuthoritativeRetrievalRagBrowserValidationSliceActive() &&
    readChangedFiles().includes(
      "scripts/smoke-non-authoritative-retrieval-rag-implementation-v0-1.mjs",
    )
  );
}

function nonAuthoritativeRetrievalRagContractSliceActive() {
  return (
    !humanReviewedDurablePerspectivePromotionContractSliceActive() &&
    !nonAuthoritativeRetrievalRagBrowserValidationSliceActive() &&
    !nonAuthoritativeRetrievalRagImplementationSliceActive() &&
    readChangedFiles().includes(
      "scripts/smoke-non-authoritative-retrieval-rag-contract-v0-1.mjs",
    )
  );
}



function humanReviewedDurablePerspectivePromotionBrowserValidationSliceActive() {
  return readChangedFiles().includes(
    "scripts/smoke-human-reviewed-durable-perspective-promotion-browser-validation-v0-1.mjs",
  );
}

function assertHumanReviewedDurablePerspectivePromotionBrowserValidationPackageScript() {
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
    packageJson.scripts["smoke:human-reviewed-durable-perspective-promotion-browser-validation-v0-1"],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-human-reviewed-durable-perspective-promotion-browser-validation-v0-1.mjs",
  );
  assert.deepEqual(
    addedScriptNames,
    ["smoke:human-reviewed-durable-perspective-promotion-browser-validation-v0-1"],
    "package.json must add only the Human-reviewed Durable Perspective Promotion browser validation smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"s*:/);
  if (typeof basePackageJson !== "undefined") {
    assert.deepEqual(packageJson.dependencies, basePackageJson.dependencies);
    assert.deepEqual(packageJson.devDependencies, basePackageJson.devDependencies);
    assert.deepEqual(
      packageJson.optionalDependencies ?? {},
      basePackageJson.optionalDependencies ?? {},
    );
  }
}

function assertHumanReviewedDurablePerspectivePromotionBrowserValidationChangedFiles(changedFiles) {
  const browserValidationAllowedSmokePaths = [
    "scripts/smoke-human-reviewed-durable-perspective-promotion-browser-validation-v0-1.mjs",
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
  const expectedFiles = [
    "fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-browser-validation.sample.v0.1.json",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
    ...browserValidationAllowedSmokePaths,
  ];
  for (const unchangedPath of [
    "types/human-reviewed-durable-perspective-promotion-contract.ts",
    "fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-contract.sample.v0.1.json",
    "lib/research-candidate-review/human-reviewed-durable-perspective-promotion.ts",
    "fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-implementation.sample.v0.1.json",
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-browser-validation.sample.v0.1.json",
    "lib/research-candidate-review/non-authoritative-retrieval-rag.ts",
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-implementation.sample.v0.1.json",
    "types/non-authoritative-retrieval-rag-contract.ts",
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-contract.sample.v0.1.json",
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
      "Human-reviewed Durable Perspective Promotion browser validation slice must not change " + unchangedPath,
    );
  }
  for (const expectedFile of [
    "fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-browser-validation.sample.v0.1.json",
    "scripts/smoke-human-reviewed-durable-perspective-promotion-browser-validation-v0-1.mjs",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
    "scripts/smoke-human-reviewed-durable-perspective-promotion-implementation-v0-1.mjs",
  ]) {
    assert.ok(changedFiles.includes(expectedFile), "changed files must include " + expectedFile);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      "unexpected changed file in Human-reviewed Durable Perspective Promotion browser validation downstream slice: " + changedFile,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /^lib\/research-retrieval\//, "must not add retrieval implementation files");
    assert.doesNotMatch(changedFile, /^lib\/research-rag\//, "must not add RAG implementation files");
    assert.doesNotMatch(changedFile, /^lib\/.*promotion/i, "must not add runtime promotion implementation files");
    assert.doesNotMatch(changedFile, /^lib\/.*perspective.*state/i, "must not add runtime Perspective state files");
    assert.doesNotMatch(changedFile, /^lib\/.*(proof|evidence).*write/i, "must not add proof/evidence write files");
    assert.doesNotMatch(changedFile, /(^|\/)(provider|openai|source-fetch|crawler)\b/i);
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
  for (const requiredText of [
    "human_reviewed_durable_perspective_promotion_browser_validation.v0.1",
    "fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-browser-validation.sample.v0.1.json",
    "scripts/smoke-human-reviewed-durable-perspective-promotion-browser-validation-v0-1.mjs",
    "smoke:human-reviewed-durable-perspective-promotion-browser-validation-v0-1",
    "ready_for_durable_perspective_state_trajectory_contract_v0_1",
    "durable_perspective_state_trajectory_contract_v0_1",
    "validates deterministic fixture-backed implementation from #731",
    "explicit human review required",
    "source_refs required",
    "product-write remains parked by #686",
  ]) {
    assert.ok(
      readFileSync("scripts/smoke-human-reviewed-durable-perspective-promotion-implementation-v0-1.mjs", "utf8").includes(requiredText),
      "downstream smoke must allow Human-reviewed Durable Perspective Promotion browser validation pointer: " + requiredText,
    );
  }
}

function humanReviewedDurablePerspectivePromotionImplementationSliceActive() {
  return readChangedFiles().includes(
    "scripts/smoke-human-reviewed-durable-perspective-promotion-implementation-v0-1.mjs",
  );
}

function assertHumanReviewedDurablePerspectivePromotionImplementationPackageScript() {
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
    packageJson.scripts["smoke:human-reviewed-durable-perspective-promotion-implementation-v0-1"],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-human-reviewed-durable-perspective-promotion-implementation-v0-1.mjs",
  );
  assert.deepEqual(
    addedScriptNames,
    ["smoke:human-reviewed-durable-perspective-promotion-implementation-v0-1"],
    "package.json must add only the Human-reviewed Durable Perspective Promotion implementation smoke script",
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

function assertHumanReviewedDurablePerspectivePromotionImplementationChangedFiles(changedFiles) {
  const implementationAllowedSmokePaths = [
    "scripts/smoke-human-reviewed-durable-perspective-promotion-contract-v0-1.mjs",
    "scripts/smoke-human-reviewed-durable-perspective-promotion-implementation-v0-1.mjs",
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
  const implementationBuilderPath =
    "lib/research-candidate-review/human-reviewed-durable-perspective-promotion.ts";
  const implementationFixturePath =
    "fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-implementation.sample.v0.1.json";
  const implementationSmokePath =
    "scripts/smoke-human-reviewed-durable-perspective-promotion-implementation-v0-1.mjs";
  const implementationContractSmokePath =
    "scripts/smoke-human-reviewed-durable-perspective-promotion-contract-v0-1.mjs";
  const expectedFiles = [
    implementationBuilderPath,
    implementationFixturePath,
    implementationSmokePath,
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
    implementationContractSmokePath,
    "scripts/smoke-non-authoritative-retrieval-rag-browser-validation-v0-1.mjs",
    "scripts/smoke-non-authoritative-retrieval-rag-contract-v0-1.mjs",
    "scripts/smoke-non-authoritative-retrieval-rag-implementation-v0-1.mjs",
    smokePath,
    ...implementationAllowedSmokePaths,
    ...(typeof downstreamSmokePaths === "undefined" ? [] : downstreamSmokePaths),
  ];
  for (const unchangedPath of [
    "types/human-reviewed-durable-perspective-promotion-contract.ts",
    "fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-contract.sample.v0.1.json",
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-browser-validation.sample.v0.1.json",
    "types/non-authoritative-retrieval-rag-contract.ts",
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-contract.sample.v0.1.json",
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
  ]) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      "Human-reviewed Durable Perspective Promotion implementation slice must not change " + unchangedPath,
    );
  }
  for (const expectedFile of [
    implementationBuilderPath,
    implementationFixturePath,
    implementationSmokePath,
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
    implementationContractSmokePath,
  ]) {
    assert.ok(changedFiles.includes(expectedFile), "changed files must include " + expectedFile);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      "unexpected changed file in Human-reviewed Durable Perspective Promotion implementation downstream slice: " + changedFile,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /^lib\/research-retrieval\//, "must not add retrieval implementation files");
    assert.doesNotMatch(changedFile, /^lib\/research-rag\//, "must not add RAG implementation files");
    if (changedFile !== implementationBuilderPath) {
      assert.doesNotMatch(changedFile, /^lib\/.*promotion/i, "must not add runtime promotion implementation files");
    }
    assert.doesNotMatch(changedFile, /^lib\/.*perspective.*state/i, "must not add runtime Perspective state files");
    assert.doesNotMatch(changedFile, /^lib\/.*(proof|evidence).*write/i, "must not add proof/evidence write files");
    assert.doesNotMatch(changedFile, /(^|\/)(provider|openai|source-fetch|crawler)\b/i);
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
  for (const requiredText of [
    "human_reviewed_durable_perspective_promotion_implementation.v0.1",
    implementationBuilderPath,
    implementationFixturePath,
    implementationSmokePath,
    "smoke:human-reviewed-durable-perspective-promotion-implementation-v0-1",
    "ready_for_human_reviewed_durable_perspective_promotion_browser_validation_v0_1",
    "human_reviewed_durable_perspective_promotion_browser_validation_v0_1",
    "deterministic fixture-backed implementation only",
    "explicit human review required",
    "source_refs required",
    "product-write remains parked by #686",
  ]) {
    assert.ok(
      readFileSync(implementationSmokePath, "utf8").includes(requiredText),
      "downstream smoke must allow Human-reviewed Durable Perspective Promotion implementation pointer: " + requiredText,
    );
  }
}

function humanReviewedDurablePerspectivePromotionContractSliceActive() {
  return readChangedFiles().includes(
    "scripts/smoke-human-reviewed-durable-perspective-promotion-contract-v0-1.mjs",
  );
}

function assertHumanReviewedDurablePerspectivePromotionContractPackageScript() {
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
    packageJson.scripts["smoke:human-reviewed-durable-perspective-promotion-contract-v0-1"],
    "node scripts/smoke-human-reviewed-durable-perspective-promotion-contract-v0-1.mjs",
  );
  assert.deepEqual(
    addedScriptNames,
    ["smoke:human-reviewed-durable-perspective-promotion-contract-v0-1"],
    "package.json must add only the Human-reviewed Durable Perspective Promotion contract smoke script",
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

function assertHumanReviewedDurablePerspectivePromotionContractChangedFiles(changedFiles) {
  const expectedFiles = [
    "types/human-reviewed-durable-perspective-promotion-contract.ts",
    "fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-contract.sample.v0.1.json",
    "scripts/smoke-human-reviewed-durable-perspective-promotion-contract-v0-1.mjs",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
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
  for (const unchangedPath of [
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-browser-validation.sample.v0.1.json",
    "lib/research-candidate-review/non-authoritative-retrieval-rag.ts",
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-implementation.sample.v0.1.json",
    "types/non-authoritative-retrieval-rag-contract.ts",
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-contract.sample.v0.1.json",
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
      "Human-reviewed Durable Perspective Promotion contract slice must not change " + unchangedPath,
    );
  }
  for (const expectedFile of [
    "types/human-reviewed-durable-perspective-promotion-contract.ts",
    "fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-contract.sample.v0.1.json",
    "scripts/smoke-human-reviewed-durable-perspective-promotion-contract-v0-1.mjs",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
    "scripts/smoke-non-authoritative-retrieval-rag-browser-validation-v0-1.mjs",
  ]) {
    assert.ok(changedFiles.includes(expectedFile), "changed files must include " + expectedFile);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      "unexpected changed file in Human-reviewed Durable Perspective Promotion contract downstream slice: " + changedFile,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /^lib\/research-retrieval\//, "must not add retrieval implementation files");
    assert.doesNotMatch(changedFile, /^lib\/research-rag\//, "must not add RAG implementation files");
    assert.doesNotMatch(changedFile, /^lib\/.*promotion/i, "must not add runtime promotion implementation files");
    assert.doesNotMatch(changedFile, /^lib\/.*perspective.*state/i, "must not add runtime Perspective state files");
    assert.doesNotMatch(changedFile, /^lib\/.*(proof|evidence).*write/i, "must not add proof/evidence write files");
    assert.doesNotMatch(changedFile, /(^|\/)(provider|openai|source-fetch|crawler)\b/i);
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
  for (const requiredText of [
    "human_reviewed_durable_perspective_promotion_contract.v0.1",
    "types/human-reviewed-durable-perspective-promotion-contract.ts",
    "fixtures/research-candidate-review.human-reviewed-durable-perspective-promotion-contract.sample.v0.1.json",
    "scripts/smoke-human-reviewed-durable-perspective-promotion-contract-v0-1.mjs",
    "smoke:human-reviewed-durable-perspective-promotion-contract-v0-1",
    "ready_for_human_reviewed_durable_perspective_promotion_implementation_v0_1",
    "human_reviewed_durable_perspective_promotion_implementation_v0_1",
    "future human/Core promotion gate only",
    "explicit human review required",
    "product-write remains parked by #686",
  ]) {
    assert.ok(
      readFileSync(smokePath, "utf8").includes(requiredText),
      "downstream smoke must allow Human-reviewed Durable Perspective Promotion contract pointer: " + requiredText,
    );
  }
}

function assertNonAuthoritativeRetrievalRagBrowserValidationPackageScript() {
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
    packageJson.scripts["smoke:non-authoritative-retrieval-rag-browser-validation-v0-1"],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-non-authoritative-retrieval-rag-browser-validation-v0-1.mjs",
  );
  assert.deepEqual(
    addedScriptNames,
    ["smoke:non-authoritative-retrieval-rag-browser-validation-v0-1"],
    "package.json must add only the Non-authoritative Retrieval/RAG browser validation smoke script",
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

function assertNonAuthoritativeRetrievalRagBrowserValidationChangedFiles(changedFiles) {
  const expectedFiles = [
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-browser-validation.sample.v0.1.json",
    "scripts/smoke-non-authoritative-retrieval-rag-browser-validation-v0-1.mjs",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
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
  for (const unchangedPath of [
    "lib/research-candidate-review/non-authoritative-retrieval-rag.ts",
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-implementation.sample.v0.1.json",
    "types/non-authoritative-retrieval-rag-contract.ts",
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-contract.sample.v0.1.json",
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
      "Non-authoritative Retrieval/RAG browser validation slice must not change " + unchangedPath,
    );
  }
  for (const expectedFile of [
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-browser-validation.sample.v0.1.json",
    "scripts/smoke-non-authoritative-retrieval-rag-browser-validation-v0-1.mjs",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
    "scripts/smoke-non-authoritative-retrieval-rag-implementation-v0-1.mjs",
    "scripts/smoke-non-authoritative-retrieval-rag-contract-v0-1.mjs",
  ]) {
    assert.ok(changedFiles.includes(expectedFile), "changed files must include " + expectedFile);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      "unexpected changed file in Non-authoritative Retrieval/RAG browser validation downstream slice: " + changedFile,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /^lib\/research-retrieval\//, "must not add retrieval implementation files");
    assert.doesNotMatch(changedFile, /^lib\/research-rag\//, "must not add RAG implementation files");
    assert.doesNotMatch(changedFile, /(^|\/)(provider|openai|source-fetch|crawler)\b/i);
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
  for (const requiredText of [
    "non_authoritative_retrieval_rag_browser_validation.v0.1",
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-browser-validation.sample.v0.1.json",
    "scripts/smoke-non-authoritative-retrieval-rag-browser-validation-v0-1.mjs",
    "smoke:non-authoritative-retrieval-rag-browser-validation-v0-1",
    "ready_for_human_reviewed_durable_perspective_promotion_contract_v0_1",
    "human_reviewed_durable_perspective_promotion_contract_v0_1",
    "validates deterministic fixture-backed implementation from #728",
    "validates #727 contract boundary and #728 top-level implementation boundary separation",
    "retrieval result is recall, not authority",
    "RAG answer is context preview, not evidence/proof",
    "product-write remains parked by #686",
  ]) {
    assert.ok(
      readFileSync(smokePath, "utf8").includes(requiredText),
      "downstream smoke must allow Non-authoritative Retrieval/RAG browser validation pointer: " + requiredText,
    );
  }
}

function assertNonAuthoritativeRetrievalRagImplementationPackageScript() {
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
    packageJson.scripts["smoke:non-authoritative-retrieval-rag-implementation-v0-1"],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-non-authoritative-retrieval-rag-implementation-v0-1.mjs",
  );
  assert.deepEqual(
    addedScriptNames,
    ["smoke:non-authoritative-retrieval-rag-implementation-v0-1"],
    "package.json must add only the Non-authoritative Retrieval/RAG implementation smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"\s*:/);
}

function assertNonAuthoritativeRetrievalRagImplementationChangedFiles(changedFiles) {
  const expectedFiles = [
    "lib/research-candidate-review/non-authoritative-retrieval-rag.ts",
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-implementation.sample.v0.1.json",
    "scripts/smoke-non-authoritative-retrieval-rag-implementation-v0-1.mjs",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
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
  for (const unchangedPath of [
    "types/non-authoritative-retrieval-rag-contract.ts",
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-contract.sample.v0.1.json",
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
      "Non-authoritative Retrieval/RAG implementation slice must not change " + unchangedPath,
    );
  }
  for (const expectedFile of [
    "lib/research-candidate-review/non-authoritative-retrieval-rag.ts",
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-implementation.sample.v0.1.json",
    "scripts/smoke-non-authoritative-retrieval-rag-implementation-v0-1.mjs",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
    "scripts/smoke-non-authoritative-retrieval-rag-contract-v0-1.mjs",
  ]) {
    assert.ok(changedFiles.includes(expectedFile), "changed files must include " + expectedFile);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      "unexpected changed file in Non-authoritative Retrieval/RAG implementation downstream slice: " + changedFile,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /^lib\/research-retrieval\//, "must not add retrieval implementation files");
    assert.doesNotMatch(changedFile, /^lib\/research-rag\//, "must not add RAG implementation files");
    assert.doesNotMatch(changedFile, /(^|\/)(provider|openai|source-fetch|crawler)\b/i);
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
}

function assertNonAuthoritativeRetrievalRagContractPackageScript() {
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
    packageJson.scripts["smoke:non-authoritative-retrieval-rag-contract-v0-1"],
    "node scripts/smoke-non-authoritative-retrieval-rag-contract-v0-1.mjs",
  );
  assert.deepEqual(
    addedScriptNames,
    ["smoke:non-authoritative-retrieval-rag-contract-v0-1"],
    "package.json must add only the Non-authoritative Retrieval/RAG contract smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"\s*:/);
}

function assertNonAuthoritativeRetrievalRagContractChangedFiles(changedFiles) {
  const expectedFiles = [
    "types/non-authoritative-retrieval-rag-contract.ts",
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-contract.sample.v0.1.json",
    "scripts/smoke-non-authoritative-retrieval-rag-contract-v0-1.mjs",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
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
  for (const unchangedPath of [
    "lib/research-candidate-review/operator-source-candidate-generation.ts",
    "fixtures/research-candidate-review.operator-source-candidate-generation-implementation.sample.v0.1.json",
    "types/operator-source-candidate-generation-contract.ts",
    "fixtures/research-candidate-review.operator-source-candidate-generation-contract.sample.v0.1.json",
    "lib/research-candidate-review/bounded-external-source-intake.ts",
    "fixtures/research-candidate-review.bounded-external-source-intake-implementation.sample.v0.1.json",
    "lib/research-candidate-review/salience-governor.ts",
    "fixtures/research-candidate-review.salience-governor-implementation.sample.v0.1.json",
    "lib/research-candidate-review/recent-rehearsal-buffer.ts",
    "fixtures/research-candidate-review.recent-rehearsal-buffer-implementation.sample.v0.1.json",
  ]) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      "Non-authoritative Retrieval/RAG contract slice must not change " + unchangedPath,
    );
  }
  for (const expectedFile of [
    "types/non-authoritative-retrieval-rag-contract.ts",
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-contract.sample.v0.1.json",
    "scripts/smoke-non-authoritative-retrieval-rag-contract-v0-1.mjs",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
    "scripts/smoke-operator-source-candidate-generation-browser-validation-v0-1.mjs",
  ]) {
    assert.ok(changedFiles.includes(expectedFile), "changed files must include " + expectedFile);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      "unexpected changed file in Non-authoritative Retrieval/RAG contract downstream slice: " + changedFile,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /^lib\/research-retrieval\//, "must not add retrieval implementation files");
    assert.doesNotMatch(changedFile, /^lib\/research-rag\//, "must not add RAG implementation files");
    assert.doesNotMatch(changedFile, /(^|\/)(provider|source-fetch|crawler)\b/i);
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
}

function operatorSourceCandidateGenerationBrowserValidationSliceActive() {
  return readChangedFiles().includes(
    "scripts/smoke-operator-source-candidate-generation-browser-validation-v0-1.mjs",
  );
}

function assertOperatorSourceCandidateGenerationBrowserValidationPackageScript() {
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
    packageJson.scripts[
      "smoke:operator-source-candidate-generation-browser-validation-v0-1"
    ],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-operator-source-candidate-generation-browser-validation-v0-1.mjs",
  );
  assert.deepEqual(
    addedScriptNames,
    ["smoke:operator-source-candidate-generation-browser-validation-v0-1"],
    "package.json must add only the Operator Source Candidate Generation browser validation smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"\s*:/);
}

function assertOperatorSourceCandidateGenerationBrowserValidationChangedFiles(changedFiles) {
  const expectedFiles = [
    "fixtures/research-candidate-review.operator-source-candidate-generation-browser-validation.sample.v0.1.json",
    "scripts/smoke-operator-source-candidate-generation-browser-validation-v0-1.mjs",
    packagePath,
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
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
  for (const unchangedPath of [
    "lib/research-candidate-review/operator-source-candidate-generation.ts",
    "fixtures/research-candidate-review.operator-source-candidate-generation-implementation.sample.v0.1.json",
    "types/operator-source-candidate-generation-contract.ts",
    "fixtures/research-candidate-review.operator-source-candidate-generation-contract.sample.v0.1.json",
    implementationBuilderPath,
    implementationFixturePath,
    typePath,
    fixturePath,
    "lib/research-candidate-review/salience-governor.ts",
    "fixtures/research-candidate-review.salience-governor-implementation.sample.v0.1.json",
    "lib/research-candidate-review/recent-rehearsal-buffer.ts",
    "fixtures/research-candidate-review.recent-rehearsal-buffer-implementation.sample.v0.1.json",
  ]) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      "Operator Source Candidate Generation browser validation slice must not change " + unchangedPath,
    );
  }
  for (const expectedFile of [
    "fixtures/research-candidate-review.operator-source-candidate-generation-browser-validation.sample.v0.1.json",
    "scripts/smoke-operator-source-candidate-generation-browser-validation-v0-1.mjs",
    packagePath,
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
    "scripts/smoke-operator-source-candidate-generation-implementation-v0-1.mjs",
  ]) {
    assert.ok(changedFiles.includes(expectedFile), "changed files must include " + expectedFile);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      "unexpected changed file in Operator Source Candidate Generation browser validation downstream slice: " + changedFile,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /(^|\/)(provider|retrieval|source-fetch)\b/i);
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
}

function assertOperatorSourceCandidateGenerationImplementationPackageScript() {
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
    packageJson.scripts[
      "smoke:operator-source-candidate-generation-implementation-v0-1"
    ],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-operator-source-candidate-generation-implementation-v0-1.mjs",
  );
  assert.deepEqual(
    addedScriptNames,
    ["smoke:operator-source-candidate-generation-implementation-v0-1"],
    "package.json must add only the Operator Source Candidate Generation implementation smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"\s*:/);
}

function assertOperatorSourceCandidateGenerationImplementationChangedFiles(changedFiles) {
  const expectedFiles = [
    "lib/research-candidate-review/operator-source-candidate-generation.ts",
    "fixtures/research-candidate-review.operator-source-candidate-generation-implementation.sample.v0.1.json",
    "scripts/smoke-operator-source-candidate-generation-implementation-v0-1.mjs",
    packagePath,
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
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
  for (const unchangedPath of [
    "types/operator-source-candidate-generation-contract.ts",
    "fixtures/research-candidate-review.operator-source-candidate-generation-contract.sample.v0.1.json",
    "lib/research-candidate-review/bounded-external-source-intake.ts",
    "fixtures/research-candidate-review.bounded-external-source-intake-implementation.sample.v0.1.json",
    "lib/research-candidate-review/salience-governor.ts",
    "fixtures/research-candidate-review.salience-governor-implementation.sample.v0.1.json",
    "lib/research-candidate-review/recent-rehearsal-buffer.ts",
    "fixtures/research-candidate-review.recent-rehearsal-buffer-implementation.sample.v0.1.json",
  ]) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      "Operator Source Candidate Generation implementation slice must not change " + unchangedPath,
    );
  }
  for (const expectedFile of expectedFiles) {
    assert.ok(changedFiles.includes(expectedFile), "changed files must include " + expectedFile);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      "unexpected changed file in Operator Source Candidate Generation implementation downstream slice: " + changedFile,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /(^|\/)(provider|retrieval|source-fetch)\b/i);
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
}

function operatorSourceCandidateGenerationContractSliceActive() {
  return readChangedFiles().includes(
    "scripts/smoke-operator-source-candidate-generation-contract-v0-1.mjs",
  );
}

function assertOperatorSourceCandidateGenerationContractPackageScript() {
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
    packageJson.scripts[
      "smoke:operator-source-candidate-generation-contract-v0-1"
    ],
    "node scripts/smoke-operator-source-candidate-generation-contract-v0-1.mjs",
  );
  assert.deepEqual(
    addedScriptNames,
    ["smoke:operator-source-candidate-generation-contract-v0-1"],
    "package.json must add only the Operator Source Candidate Generation contract smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"\s*:/);
}

function assertOperatorSourceCandidateGenerationContractChangedFiles(changedFiles) {
  const expectedFiles = [
    "types/operator-source-candidate-generation-contract.ts",
    "fixtures/research-candidate-review.operator-source-candidate-generation-contract.sample.v0.1.json",
    "scripts/smoke-operator-source-candidate-generation-contract-v0-1.mjs",
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
    "scripts/smoke-bounded-external-source-intake-browser-validation-v0-1.mjs",
    implementationSmokePath,
    smokePath,
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
  for (const expectedFile of expectedFiles) {
    assert.ok(changedFiles.includes(expectedFile), "changed files must include " + expectedFile);
  }
  for (const unchangedPath of [
    "lib/research-candidate-review/bounded-external-source-intake.ts",
    "fixtures/research-candidate-review.bounded-external-source-intake-implementation.sample.v0.1.json",
  ]) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      "Operator Source Candidate Generation contract slice must not change " + unchangedPath,
    );
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      "unexpected changed file in Operator Source Candidate Generation contract downstream slice: " + changedFile,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /(^|\/)(provider|retrieval|source-fetch)\b/i);
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
}

function browserValidationSliceActive() {
  return readChangedFiles().includes(
    "scripts/smoke-bounded-external-source-intake-browser-validation-v0-1.mjs",
  );
}

function assertBrowserValidationPackageScript() {
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
    packageJson.scripts[
      "smoke:bounded-external-source-intake-browser-validation-v0-1"
    ],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-bounded-external-source-intake-browser-validation-v0-1.mjs",
  );
  assert.deepEqual(
    addedScriptNames,
    ["smoke:bounded-external-source-intake-browser-validation-v0-1"],
    "package.json must add only the Bounded External Source Intake browser validation smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"\s*:/);
}

function assertBrowserValidationChangedFiles(changedFiles) {
  const expectedFiles = [
    "fixtures/research-candidate-review.bounded-external-source-intake-browser-validation.sample.v0.1.json",
    "scripts/smoke-bounded-external-source-intake-browser-validation-v0-1.mjs",
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
    implementationSmokePath,
    smokePath,
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
  for (const expectedFile of expectedFiles) {
    assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
  }
  for (const unchangedPath of [implementationBuilderPath, implementationFixturePath]) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      `Bounded External Source Intake browser validation slice must not change ${unchangedPath}`,
    );
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      `unexpected changed file in Bounded External Source Intake browser validation slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /(^|\/)(provider|retrieval|source-fetch)\b/i);
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
}

function assertImplementationPackageScript() {
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
    "package.json must add only the Bounded External Source Intake implementation smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"\s*:/);
}

function assertImplementationChangedFiles(changedFiles) {
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
    sourceValidationSmokePath,
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
  for (const expectedFile of expectedFiles) {
    assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
  }
  for (const unchangedPath of [
    typePath,
    fixturePath,
    "lib/research-candidate-review/salience-governor.ts",
    "fixtures/research-candidate-review.salience-governor-implementation.sample.v0.1.json",
    "lib/research-candidate-review/recent-rehearsal-buffer.ts",
    "fixtures/research-candidate-review.recent-rehearsal-buffer-implementation.sample.v0.1.json",
  ]) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      `Bounded External Source Intake implementation slice must not change ${unchangedPath}`,
    );
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      `unexpected changed file in Bounded External Source Intake implementation downstream slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /(^|\/)(provider|retrieval|source-fetch)\b/i);
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
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
  for (const ref of ["origin/main", "main"]) {
    if (!gitRefExists(ref)) {
      continue;
    }
    const mergeBase = tryGitOutput(["merge-base", "HEAD", ref])?.trim();
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
