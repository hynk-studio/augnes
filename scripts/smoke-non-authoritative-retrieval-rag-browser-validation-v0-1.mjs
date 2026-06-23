import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const builderPath =
  "lib/research-candidate-review/non-authoritative-retrieval-rag.ts";
const contractTypePath = "types/non-authoritative-retrieval-rag-contract.ts";
const contractFixturePath =
  "fixtures/research-candidate-review.non-authoritative-retrieval-rag-contract.sample.v0.1.json";
const implementationFixturePath =
  "fixtures/research-candidate-review.non-authoritative-retrieval-rag-implementation.sample.v0.1.json";
const fixturePath =
  "fixtures/research-candidate-review.non-authoritative-retrieval-rag-browser-validation.sample.v0.1.json";
const smokePath =
  "scripts/smoke-non-authoritative-retrieval-rag-browser-validation-v0-1.mjs";
const implementationSmokePath =
  "scripts/smoke-non-authoritative-retrieval-rag-implementation-v0-1.mjs";
const contractSmokePath =
  "scripts/smoke-non-authoritative-retrieval-rag-contract-v0-1.mjs";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const substrateDocPath = "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md";
const surfaceDocPath = "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md";
const gateDocPath =
  "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md";

const packageScriptName =
  "smoke:non-authoritative-retrieval-rag-browser-validation-v0-1";
const packageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-non-authoritative-retrieval-rag-browser-validation-v0-1.mjs";
const validationKind = "non_authoritative_retrieval_rag_browser_validation";
const validationVersion =
  "non_authoritative_retrieval_rag_browser_validation.v0.1";
const recommendationStatus =
  "ready_for_human_reviewed_durable_perspective_promotion_contract_v0_1";
const nextRecommendedSlice =
  "human_reviewed_durable_perspective_promotion_contract_v0_1";
const writeFixture = process.argv.includes("--write-fixture");
let cachedMergeBaseRef = null;

const downstreamSmokePaths = [
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
  fixturePath,
  smokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  implementationSmokePath,
  contractSmokePath,
  ...downstreamSmokePaths,
];

for (const filePath of [
  builderPath,
  contractTypePath,
  contractFixturePath,
  implementationFixturePath,
  smokePath,
  implementationSmokePath,
  contractSmokePath,
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

const builderSource = readFile(builderPath);
const contractTypeSource = readFile(contractTypePath);
const smokeSource = readFile(smokePath);
const implementationSmokeSource = readFile(implementationSmokePath);
const contractSmokeSource = readFile(contractSmokePath);
const contractFixture = readJson(contractFixturePath);
const implementationFixture = readJson(implementationFixturePath);
const packageJson = readJson(packagePath);
const basePackageJson = readJsonFromGit(packagePath);
const indexDoc = readFile(indexPath);
const substrateDoc = readFile(substrateDocPath);
const surfaceDoc = readFile(surfaceDocPath);
const gateDoc = readFile(gateDocPath);

const {
  buildNonAuthoritativeRetrievalRagImplementationFixture,
  buildNonAuthoritativeRetrievalRagPreviewBundle,
  validateNonAuthoritativeRetrievalRagPreviewBundle,
  createNonAuthoritativeRetrievalRagFingerprint,
} = await import(
  "../lib/research-candidate-review/non-authoritative-retrieval-rag.ts"
);

const rebuiltImplementationFixture =
  buildNonAuthoritativeRetrievalRagImplementationFixture({
    non_authoritative_retrieval_rag_contract: contractFixture,
    source_contract_ref: `${contractFixture.contract_version}:${contractFixturePath}`,
  });
const invalidRetrievalResultOverride = buildInvalidRetrievalResultOverride();
const invalidRagContextPreviewOverride = buildInvalidRagContextPreviewOverride();
const invalidSourceRefsOverride = buildInvalidSourceRefsOverride();
const invalidAuthorityBoundaryOverride = buildInvalidAuthorityBoundaryOverride();
const rebuiltFixture = buildValidationFixture();

if (writeFixture) {
  writeFileSync(fixturePath, `${JSON.stringify(rebuiltFixture, null, 2)}\n`);
  process.exit(0);
}

const fixture = readJson(fixturePath);

assertUpstreamArtifactsUnchanged();
assertBuilderFile();
assertPackageScript();
assertStaticBoundary();
assertNoForbiddenRuntimePatterns();
assertImplementationRebuild();
assert.deepEqual(
  fixture,
  rebuiltFixture,
  "rebuilt Non-authoritative Retrieval/RAG browser validation fixture must match committed fixture",
);
assertValidationFixture(fixture);
assertValidatedBuilder(fixture.validated_builder);
assertValidatedRetrievalRag(fixture.validated_retrieval_rag);
assertAuthorityBoundary(fixture.authority_boundary);
assertImplementationFixtureReferencesContract();
assertBuiltPreviewBundle(implementationFixture.built_preview_bundle);
assertInvalidRetrievalResultOverrideCoverage();
assertInvalidRagContextPreviewOverrideCoverage();
assertInvalidSourceRefsOverrideCoverage();
assertInvalidAuthorityOverrideCoverage();
assertDocsPointers();
assertImplementationSmokeDownstreamPointer();
assertPortableMergeBaseFallback();

console.log(
  JSON.stringify(
    {
      smoke: "non-authoritative-retrieval-rag-browser-validation-v0-1",
      final_status: "pass",
      validation_kind: fixture.validation_kind,
      validation_version: fixture.validation_version,
      source_implementation_fingerprint:
        fixture.source_implementation_fingerprint,
      source_contract_fingerprint: fixture.source_contract_fingerprint,
      implementation_fixture_matches_rebuilt_output:
        fixture.validated_retrieval_rag
          .implementation_fixture_matches_rebuilt_output,
      preview_bundle_follows_contract:
        fixture.validated_retrieval_rag.preview_bundle_follows_contract,
      invalid_retrieval_result_override_rejected:
        fixture.validated_retrieval_rag
          .invalid_retrieval_result_override_rejected,
      invalid_rag_context_preview_override_rejected:
        fixture.validated_retrieval_rag
          .invalid_rag_context_preview_override_rejected,
      invalid_source_refs_override_rejected:
        fixture.validated_retrieval_rag.invalid_source_refs_override_rejected,
      invalid_authority_boundary_override_rejected:
        fixture.validated_retrieval_rag
          .invalid_authority_boundary_override_rejected,
      browser_request_now: fixture.authority_boundary.browser_request_now,
      runtime_retrieval_rag_implemented_now:
        fixture.authority_boundary.runtime_retrieval_rag_implemented_now,
      product_write_lane_parked_by_686:
        fixture.authority_boundary.product_write_lane_parked_by_686,
      next_recommended_slice: fixture.next_recommended_slice,
    },
    null,
    2,
  ),
);

function buildValidationFixture() {
  const validatedRetrievalRag = {
    implementation_fixture_matches_rebuilt_output: deepEqual(
      implementationFixture,
      rebuiltImplementationFixture,
    ),
    preview_bundle_follows_contract:
      implementationFixture.validated_implementation
        .preview_bundle_follows_contract,
    preview_bundle_authority_boundary_matches_contract:
      implementationFixture.validated_implementation
        .preview_bundle_authority_boundary_matches_contract,
    preview_bundle_validation_policy_matches_contract:
      implementationFixture.validated_implementation
        .preview_bundle_validation_policy_matches_contract,
    preview_bundle_non_authority_policy_matches_contract:
      implementationFixture.validated_implementation
        .preview_bundle_non_authority_policy_matches_contract,
    top_level_implementation_boundary_is_separate:
      implementationFixture.validated_implementation
        .top_level_implementation_boundary_is_separate,
    retrieval_result_families_preserved:
      implementationFixture.validated_implementation
        .retrieval_result_families_preserved,
    retrieval_inputs_preserved:
      implementationFixture.validated_implementation.retrieval_inputs_preserved,
    all_results_source_ref_backed_or_explicit_gap:
      implementationFixture.validated_implementation
        .all_results_source_ref_backed_or_explicit_gap,
    all_results_preserve_candidate_durable_distinction:
      implementationFixture.validated_implementation
        .all_results_preserve_candidate_durable_distinction,
    all_results_recall_only:
      implementationFixture.validated_implementation.all_results_recall_only,
    all_results_non_authoritative:
      implementationFixture.validated_implementation.all_results_non_authoritative,
    no_result_is_evidence:
      implementationFixture.validated_implementation.no_result_is_evidence,
    no_result_is_proof:
      implementationFixture.validated_implementation.no_result_is_proof,
    no_result_is_source_of_truth:
      implementationFixture.validated_implementation.no_result_is_source_of_truth,
    no_result_is_promotion_basis:
      implementationFixture.validated_implementation.no_result_is_promotion_basis,
    rag_context_preview_not_evidence_or_proof:
      implementationFixture.validated_implementation
        .rag_context_preview_not_evidence_or_proof,
    rag_context_preview_not_source_of_truth:
      implementationFixture.validated_implementation
        .rag_context_preview_not_source_of_truth,
    rag_context_preview_not_perspective_state:
      implementationFixture.validated_implementation
        .rag_context_preview_not_perspective_state,
    rag_context_preview_not_work_status:
      implementationFixture.validated_implementation
        .rag_context_preview_not_work_status,
    rag_context_preview_not_product_write:
      implementationFixture.validated_implementation
        .rag_context_preview_not_product_write,
    retrieval_scores_not_truth_or_promotion_scores:
      implementationFixture.validated_implementation
        .retrieval_scores_not_truth_or_promotion_scores,
    retrieval_scores_not_evidence_strength:
      implementationFixture.validated_implementation
        .retrieval_scores_not_evidence_strength,
    embedding_similarity_not_truth_or_salience_or_promotion_readiness:
      implementationFixture.validated_implementation
        .embedding_similarity_not_truth_or_salience_or_promotion_readiness,
    index_rebuildable_derived_non_authoritative:
      implementationFixture.validated_implementation
        .index_rebuildable_derived_non_authoritative,
    stale_index_cannot_override_current_state:
      implementationFixture.validated_implementation
        .stale_index_cannot_override_current_state,
    vector_db_not_source_of_truth:
      implementationFixture.validated_implementation.vector_db_not_source_of_truth,
    hidden_permanent_memory_not_allowed:
      implementationFixture.validated_implementation
        .hidden_permanent_memory_not_allowed,
    public_safe_source_refs_only:
      implementationFixture.validated_implementation.public_safe_source_refs_only,
    no_raw_private_source_body:
      implementationFixture.validated_implementation.no_raw_private_source_body,
    no_raw_provider_thread_run_session_ids:
      implementationFixture.validated_implementation
        .no_raw_provider_thread_run_session_ids,
    no_private_urls:
      implementationFixture.validated_implementation.no_private_urls,
    no_secrets: implementationFixture.validated_implementation.no_secrets,
    invalid_retrieval_result_override_rejected:
      invalidRetrievalResultOverride.rejected,
    invalid_rag_context_preview_override_rejected:
      invalidRagContextPreviewOverride.rejected,
    invalid_source_refs_override_rejected: invalidSourceRefsOverride.rejected,
    invalid_authority_boundary_override_rejected:
      invalidAuthorityBoundaryOverride.rejected,
    browser_validation_added_now: true,
    implementation_changed_now: false,
    contract_changed_now: false,
  };
  const validation = {
    validation_kind: validationKind,
    validation_version: validationVersion,
    source_implementation_ref:
      `${implementationFixture.implementation_version}:${implementationFixturePath}#728`,
    source_implementation_fingerprint:
      implementationFixture.implementation_fingerprint,
    source_contract_ref: implementationFixture.source_contract_ref,
    source_contract_fingerprint: implementationFixture.source_contract_fingerprint,
    validated_builder: {
      builder_path: builderPath,
      implementation_fixture_path: implementationFixturePath,
      contract_fixture_path: contractFixturePath,
      deterministic_fixture_backed_only: true,
      runtime_retrieval_rag_now: false,
      runtime_index_build_now: false,
      runtime_index_write_now: false,
      embedding_generation_now: false,
      vector_db_now: false,
      fts_now: false,
      provider_openai_call_now: false,
      provider_extraction_now: false,
      source_fetch_now: false,
      crawler_now: false,
      browser_request_now: false,
      runtime_db_query_now: false,
      runtime_db_write_now: false,
      production_db_used_now: false,
      durable_memory_write_now: false,
    },
    validated_retrieval_rag: validatedRetrievalRag,
    authority_boundary: buildAuthorityBoundary(),
    recommendation_status: recommendationStatus,
    next_recommended_slice: nextRecommendedSlice,
    validation: {
      passed: validatedRetrievalRagPasses(validatedRetrievalRag),
      failure_codes: [],
      deterministic_rebuild_matches_fixture: true,
    },
    validation_fingerprint: "",
    fingerprint_algorithm: "fnv1a32_canonical_json",
  };
  validation.validation_fingerprint = createValidationFingerprint(validation);
  return validation;
}

function validatedRetrievalRagPasses(value) {
  return Object.entries(value).every(([key, flag]) =>
    key === "implementation_changed_now" || key === "contract_changed_now"
      ? flag === false
      : flag === true,
  );
}

function buildAuthorityBoundary() {
  return {
    browser_validation_added_now: true,
    implementation_changed_now: false,
    contract_changed_now: false,
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
    candidate_record_write_now: false,
    candidate_mutation_now: false,
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

function buildInvalidRetrievalResultOverride() {
  const cases = [
    ["retrieval_result_unknown_family_kind", { family_kind: "unknown_family" }],
    ["retrieval_result_missing_source_refs_or_gap_reason", { source_refs: [] }],
    ["retrieval_result_authority_enabled", { authority: true }],
    ["retrieval_result_not_recall_only", { recall_only: false }],
    ["retrieval_result_evidence_enabled", { not_evidence: false }],
    ["retrieval_result_proof_enabled", { not_proof: false }],
    ["retrieval_result_source_of_truth_enabled", { not_source_of_truth: false }],
    ["retrieval_result_promotion_basis_enabled", { not_promotion_basis: false }],
    [
      "retrieval_result_missing_candidate_durable_distinction",
      { candidate_durable_distinction_preserved: false },
    ],
    [
      "retrieval_score_truth_or_promotion_label_enabled",
      { retrieval_score_label: "truth_score" },
    ],
  ];
  return buildInvalidPreviewOverride(cases, "retrieval_results");
}

function buildInvalidRagContextPreviewOverride() {
  const cases = [
    ["rag_context_preview_missing_source_refs", { source_refs: [] }],
    ["rag_context_preview_authority_enabled", { authority: true }],
    ["rag_context_preview_not_recall_only", { recall_only: false }],
    ["rag_context_preview_evidence_enabled", { not_evidence: false }],
    ["rag_context_preview_proof_enabled", { not_proof: false }],
    ["rag_context_preview_source_of_truth_enabled", { not_source_of_truth: false }],
    ["rag_context_preview_perspective_state_enabled", { not_perspective_state: false }],
    ["rag_context_preview_work_status_enabled", { not_work_status: false }],
    ["rag_context_preview_product_write_enabled", { not_product_write: false }],
    [
      "rag_context_preview_missing_human_review_required_later",
      { human_review_required_later: false },
    ],
  ];
  const failureCodes = [];
  for (const [expectedCode, override] of cases) {
    const ragContextPreview = {
      ...clone(contractFixture.sample_retrieval_rag_contract_preview.rag_context_preview),
      ...override,
    };
    const validation = buildNonAuthoritativeRetrievalRagPreviewBundle({
      contract: contractFixture,
      rag_context_preview: ragContextPreview,
    }).validation;
    assert.equal(validation.passed, false);
    assert.ok(validation.failure_codes.includes(expectedCode));
    failureCodes.push(expectedCode);
  }
  return { rejected: true, failure_codes: failureCodes };
}

function buildInvalidSourceRefsOverride() {
  const cases = [
    ["source_ref_missing_id", { source_ref_id: "" }],
    ["source_ref_missing_public_safe_ref", { public_safe_ref: "" }],
    ["source_ref_missing_refs", { source_refs: [] }],
    ["source_ref_missing_operator_context", { operator_context_ref: "" }],
    ["source_ref_not_public_safe", { public_safe: false }],
    [
      "source_ref_private_or_unstable_public_safe_ref",
      { public_safe_ref: "https://private.example/source" },
    ],
  ];
  const failureCodes = [];
  for (const [expectedCode, override] of cases) {
    const sourceRefs = clone(
      contractFixture.sample_retrieval_rag_contract_preview.source_refs,
    );
    sourceRefs[0] = { ...sourceRefs[0], ...override };
    const previewBundle = buildNonAuthoritativeRetrievalRagPreviewBundle({
      contract: contractFixture,
      source_refs: sourceRefs,
    });
    const validation = validateNonAuthoritativeRetrievalRagPreviewBundle(
      {
        ...previewBundle,
        validation: undefined,
      },
      contractFixture,
    );
    assert.equal(validation.passed, false);
    assert.ok(validation.failure_codes.includes(expectedCode));
    failureCodes.push(expectedCode);
  }
  return { rejected: true, failure_codes: failureCodes };
}

function buildInvalidAuthorityBoundaryOverride() {
  const cases = [
    ["runtime_retrieval_rag_enabled", "runtime_retrieval_rag_implemented_now"],
    ["runtime_index_build_enabled", "runtime_index_build_implemented_now"],
    ["runtime_index_write_enabled", "runtime_index_write_now"],
    ["embedding_generation_enabled", "embedding_generation_implemented_now"],
    ["vector_db_enabled", "vector_db_implemented_now"],
    ["fts_enabled", "fts_implemented_now"],
    ["provider_openai_call_enabled", "provider_openai_call_now"],
    ["source_fetch_enabled", "source_fetch_now"],
    ["crawler_enabled", "crawler_now"],
    ["source_index_write_enabled", "source_index_write_now"],
    ["durable_source_record_write_enabled", "durable_source_record_write_now"],
    ["candidate_record_write_enabled", "candidate_record_write_now"],
    ["runtime_db_query_enabled", "runtime_db_query_now"],
    ["runtime_db_write_enabled", "runtime_db_write_now"],
    ["proof_or_evidence_enabled", "proof_or_evidence_record"],
    ["perspective_promotion_enabled", "perspective_promotion"],
    ["work_mutation_enabled", "work_mutation"],
    ["product_write_enabled", "product_write_authority"],
    ["product_id_allocation_enabled", "product_id_allocation_authority"],
  ];
  const failureCodes = [];
  for (const [expectedCode, fieldName] of cases) {
    const implementation = buildNonAuthoritativeRetrievalRagImplementationFixture({
      non_authoritative_retrieval_rag_contract: contractFixture,
      source_contract_ref: `${contractFixture.contract_version}:${contractFixturePath}`,
      authority_boundary_overrides: { [fieldName]: true },
    });
    assert.equal(implementation.validated_implementation.passed, false);
    assert.ok(
      implementation.validated_implementation.failure_codes.includes(expectedCode),
    );
    failureCodes.push(expectedCode);
  }
  return { rejected: true, failure_codes: failureCodes };
}

function buildInvalidPreviewOverride(cases, target) {
  const failureCodes = [];
  for (const [expectedCode, override] of cases) {
    const retrievalResults = clone(
      contractFixture.sample_retrieval_rag_contract_preview.retrieval_results,
    );
    retrievalResults[0] = { ...retrievalResults[0], ...override };
    const validation = buildNonAuthoritativeRetrievalRagPreviewBundle({
      contract: contractFixture,
      [target]: retrievalResults,
    }).validation;
    assert.equal(validation.passed, false);
    assert.ok(validation.failure_codes.includes(expectedCode));
    failureCodes.push(expectedCode);
  }
  return { rejected: true, failure_codes: failureCodes };
}

function assertUpstreamArtifactsUnchanged() {
  assert.equal(
    readGitOutput(["show", `${mergeBaseRef()}:${builderPath}`]),
    builderSource,
    "#728 builder file must not change in browser validation slice",
  );
  assert.deepEqual(
    readJsonFromGit(implementationFixturePath),
    implementationFixture,
    "#728 implementation fixture must not change in browser validation slice",
  );
  assert.deepEqual(
    readJsonFromGit(contractFixturePath),
    contractFixture,
    "#727 contract fixture must not change in browser validation slice",
  );
  assert.equal(
    readGitOutput(["show", `${mergeBaseRef()}:${contractTypePath}`]),
    contractTypeSource,
    "#727 type contract must not change in browser validation slice",
  );
}

function assertBuilderFile() {
  for (const requiredText of [
    "buildNonAuthoritativeRetrievalRagImplementationFixture",
    "buildNonAuthoritativeRetrievalRagPreviewBundle",
    "validateNonAuthoritativeRetrievalRagPreviewBundle",
    "createNonAuthoritativeRetrievalRagFingerprint",
    "retrieval_result_unknown_family_kind",
    "retrieval_result_missing_source_refs_or_gap_reason",
    "rag_context_preview_missing_source_refs",
    "source_ref_private_or_unstable_public_safe_ref",
    "runtime_retrieval_rag_enabled",
    "product_id_allocation_enabled",
  ]) {
    assert.ok(builderSource.includes(requiredText), `${builderPath} must include ${requiredText}`);
  }
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
    "package.json must add only the Non-authoritative Retrieval/RAG browser validation smoke script",
  );
  assert.deepEqual(packageJson.dependencies, basePackageJson.dependencies);
  assert.deepEqual(packageJson.devDependencies, basePackageJson.devDependencies);
  assert.deepEqual(
    packageJson.optionalDependencies ?? {},
    basePackageJson.optionalDependencies ?? {},
  );
}

function assertStaticBoundary() {
  const changedFiles = readChangedFiles();
  for (const unchangedPath of [
    builderPath,
    implementationFixturePath,
    contractTypePath,
    contractFixturePath,
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
      `Non-authoritative Retrieval/RAG browser validation slice must not change ${unchangedPath}`,
    );
  }
  for (const expectedFile of expectedChangedFiles) {
    assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedChangedFiles.includes(changedFile),
      `unexpected changed file in Non-authoritative Retrieval/RAG browser validation slice: ${changedFile}`,
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

function assertNoForbiddenRuntimePatterns() {
  const changedSourceFiles = readChangedFiles().filter((filePath) =>
    filePath !== contractTypePath &&
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
      { label: "DB write", regex: /\bdb\.(insert|update|delete|transaction)\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b/i },
      { label: "durable memory write", regex: /\b(write|insert|persist)DurableMemory\b|\bdurableMemoryWrite\b/i },
      { label: "source fetch", regex: /\bfetchSource\b|\bsourceFetch\b|\bfetch\s*\(/ },
      { label: "crawler execution", regex: /\brunCrawler\b|\bcrawlDomain\b|\bcrawlerSeed\b/i },
      { label: "external HTTP request", regex: /\bhttps?\.request\b|\bXMLHttpRequest\b/ },
      { label: "provider extraction", regex: /\bproviderExtract\b|\brunProviderExtraction\b/i },
      { label: "OpenAI import", regex: /from\s+["'][^"']*openai["']/i },
      { label: "OpenAI constructor", regex: /new\s+OpenAI\b/i },
      { label: "retrieval execution", regex: /\brunRetrieval\b|\brunRag\b|\brunRAG\b|\bexecuteRetrieval\b/i },
      { label: "search runtime execution", regex: /\bsearchIndex\b|\bexecuteSearch\b|\brunSearch\b/i },
      { label: "index build/write", regex: /\bbuildIndex\b|\bwriteIndex\b|\bsourceIndexWrite\b|\bwriteSourceIndex\b/i },
      { label: "embedding/vector/FTS implementation", regex: /\bcreateEmbedding\b|\bgenerateEmbedding\b|\bvectorIndex\b|\bvectorDb\b|\bFTS5\b|\bfullTextSearch\b/i },
      { label: "durable source record write", regex: /\bwriteDurableSourceRecord\b|\binsertDurableSourceRecord\b|\bpersistDurableSourceRecord\b|\bdurableSourceRecordWrite\b/i },
      { label: "candidate runtime generation", regex: /\brunCandidateGeneration\b|\bgenerateCandidate\b|\bcreateCandidateFromSource\b/i },
      { label: "candidate record write", regex: /\bwriteCandidateRecord\b|\binsertCandidateRecord\b|\bpersistCandidateRecord\b/i },
      { label: "candidate mutation", regex: /\bmutateCandidate\b|\bupdateCandidate\b|\bdeleteCandidate\b/ },
      { label: "proof/evidence write", regex: /\b(write|insert|persist)(Proof|Evidence)\b|\bproof_or_evidence_record:\s*true\b/i },
      { label: "Perspective promotion", regex: /\bpromotePerspective\b|\bperspective_promotion:\s*true\b/i },
      { label: "promotion decision implementation", regex: /\bpromotionDecision\b|\bpromotion_decision_record:\s*true\b/i },
      { label: "work mutation", regex: /\bmutateWork\b|\bupdateWork\b|\bwork_mutation:\s*true\b/i },
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

function assertImplementationRebuild() {
  assert.deepEqual(
    implementationFixture,
    rebuiltImplementationFixture,
    "#728 implementation fixture must match rebuilt deterministic output",
  );
  assert.equal(
    implementationFixture.implementation_fingerprint,
    createNonAuthoritativeRetrievalRagFingerprint(implementationFixture),
  );
}

function assertValidationFixture(value) {
  assert.equal(value.validation_kind, validationKind);
  assert.equal(value.validation_version, validationVersion);
  assert.equal(
    value.source_implementation_ref,
    `${implementationFixture.implementation_version}:${implementationFixturePath}#728`,
  );
  assert.equal(
    value.source_implementation_fingerprint,
    implementationFixture.implementation_fingerprint,
  );
  assert.equal(value.source_contract_ref, implementationFixture.source_contract_ref);
  assert.equal(
    value.source_contract_fingerprint,
    implementationFixture.source_contract_fingerprint,
  );
  assert.equal(value.recommendation_status, recommendationStatus);
  assert.equal(value.next_recommended_slice, nextRecommendedSlice);
  assert.equal(value.validation.passed, true);
  assert.deepEqual(value.validation.failure_codes, []);
  assert.equal(value.validation.deterministic_rebuild_matches_fixture, true);
  assert.equal(value.fingerprint_algorithm, "fnv1a32_canonical_json");
  assert.equal(value.validation_fingerprint, createValidationFingerprint(value));
}

function assertValidatedBuilder(value) {
  assert.equal(value.builder_path, builderPath);
  assert.equal(value.implementation_fixture_path, implementationFixturePath);
  assert.equal(value.contract_fixture_path, contractFixturePath);
  assert.equal(value.deterministic_fixture_backed_only, true);
  for (const [key, flag] of Object.entries(value)) {
    if (
      key === "builder_path" ||
      key === "implementation_fixture_path" ||
      key === "contract_fixture_path" ||
      key === "deterministic_fixture_backed_only"
    ) {
      continue;
    }
    assert.equal(flag, false, `validated_builder.${key} must be false`);
  }
}

function assertValidatedRetrievalRag(value) {
  for (const [key, flag] of Object.entries(value)) {
    if (key === "implementation_changed_now" || key === "contract_changed_now") {
      assert.equal(flag, false, `validated_retrieval_rag.${key} must be false`);
    } else {
      assert.equal(flag, true, `validated_retrieval_rag.${key} must be true`);
    }
  }
}

function assertAuthorityBoundary(boundary) {
  assert.equal(boundary.browser_validation_added_now, true);
  assert.equal(boundary.implementation_changed_now, false);
  assert.equal(boundary.contract_changed_now, false);
  assert.equal(boundary.product_write_lane_parked_by_686, true);
  for (const [key, flag] of Object.entries(boundary)) {
    if (key === "browser_validation_added_now" || key === "product_write_lane_parked_by_686") {
      assert.equal(flag, true, `${key} must be true`);
    } else {
      assert.equal(flag, false, `${key} must be false`);
    }
  }
}

function assertImplementationFixtureReferencesContract() {
  assert.equal(
    implementationFixture.source_contract_ref,
    `${contractFixture.contract_version}:${contractFixturePath}`,
  );
  assert.equal(
    implementationFixture.source_contract_fingerprint,
    contractFixture.contract_fingerprint,
  );
}

function assertBuiltPreviewBundle(bundle) {
  const sample = contractFixture.sample_retrieval_rag_contract_preview;
  assert.equal(bundle.preview_version, "non_authoritative_retrieval_rag_preview.v0.1");
  assert.deepEqual(bundle.source_refs, sample.source_refs);
  assert.deepEqual(bundle.retrieval_results, sample.retrieval_results);
  assert.deepEqual(bundle.rag_context_preview, sample.rag_context_preview);
  assert.deepEqual(bundle.authority_boundary, sample.authority_boundary);
  assert.deepEqual(bundle.validation_policy, contractFixture.validation_policy);
  assert.deepEqual(bundle.non_authority_policy, contractFixture.non_authority_policy);
  assert.equal(Object.hasOwn(bundle.authority_boundary, "implementation_added_now"), false);
  assert.equal(Object.hasOwn(bundle.authority_boundary, "deterministic_builder_added_now"), false);
  assert.equal(implementationFixture.authority_boundary.implementation_added_now, true);
  assert.equal(
    implementationFixture.authority_boundary.deterministic_builder_added_now,
    true,
  );
  const expectedFamilyKinds = contractFixture.retrieval_result_families.map(
    (family) => family.family_kind,
  );
  assert.deepEqual(bundle.retrieval_result_family_summary.family_kinds, expectedFamilyKinds);
  assert.equal(bundle.source_reference_summary.public_safe_source_refs_only, true);
  assert.equal(bundle.source_reference_summary.no_raw_private_source_body, true);
  assert.equal(bundle.source_reference_summary.no_raw_provider_thread_run_session_ids, true);
  assert.equal(bundle.source_reference_summary.no_private_urls, true);
  assert.equal(bundle.source_reference_summary.no_secrets, true);
  for (const result of bundle.retrieval_results) {
    assert.equal(result.recall_only, true);
    assert.equal(result.authority, false);
    assert.equal(result.not_evidence, true);
    assert.equal(result.not_proof, true);
    assert.equal(result.not_source_of_truth, true);
    assert.equal(result.not_promotion_basis, true);
    assert.ok(result.retrieval_score_label.includes("not_truth_score"));
    assert.doesNotMatch(result.retrieval_score_label, /promotion_score|evidence_strength/);
    if (result.family_kind === "retrieval_gap_or_tension_candidate") {
      assert.ok(result.gap_reason?.startsWith("public_safe_gap_reason:"));
    } else {
      assert.ok(
        (result.source_refs ?? []).length > 0 ||
          Boolean(result.review_record_ref) ||
          Boolean(result.formation_receipt_ref),
      );
    }
  }
  assert.equal(bundle.rag_context_preview.recall_only, true);
  assert.equal(bundle.rag_context_preview.authority, false);
  assert.equal(bundle.rag_context_preview.not_evidence, true);
  assert.equal(bundle.rag_context_preview.not_proof, true);
  assert.equal(bundle.rag_context_preview.not_source_of_truth, true);
  assert.equal(bundle.rag_context_preview.not_perspective_state, true);
  assert.equal(bundle.rag_context_preview.not_work_status, true);
  assert.equal(bundle.rag_context_preview.not_product_write, true);
  assert.equal(bundle.rag_context_preview.human_review_required_later, true);
}

function assertInvalidRetrievalResultOverrideCoverage() {
  const requiredCodes = [
    "retrieval_result_unknown_family_kind",
    "retrieval_result_missing_source_refs_or_gap_reason",
    "retrieval_result_authority_enabled",
    "retrieval_result_not_recall_only",
    "retrieval_result_evidence_enabled",
    "retrieval_result_proof_enabled",
    "retrieval_result_source_of_truth_enabled",
    "retrieval_result_promotion_basis_enabled",
    "retrieval_result_missing_candidate_durable_distinction",
    "retrieval_score_truth_or_promotion_label_enabled",
  ];
  assert.deepEqual(invalidRetrievalResultOverride.failure_codes, requiredCodes);
}

function assertInvalidRagContextPreviewOverrideCoverage() {
  const requiredCodes = [
    "rag_context_preview_missing_source_refs",
    "rag_context_preview_authority_enabled",
    "rag_context_preview_not_recall_only",
    "rag_context_preview_evidence_enabled",
    "rag_context_preview_proof_enabled",
    "rag_context_preview_source_of_truth_enabled",
    "rag_context_preview_perspective_state_enabled",
    "rag_context_preview_work_status_enabled",
    "rag_context_preview_product_write_enabled",
    "rag_context_preview_missing_human_review_required_later",
  ];
  assert.deepEqual(invalidRagContextPreviewOverride.failure_codes, requiredCodes);
}

function assertInvalidSourceRefsOverrideCoverage() {
  const requiredCodes = [
    "source_ref_missing_id",
    "source_ref_missing_public_safe_ref",
    "source_ref_missing_refs",
    "source_ref_missing_operator_context",
    "source_ref_not_public_safe",
    "source_ref_private_or_unstable_public_safe_ref",
  ];
  assert.deepEqual(invalidSourceRefsOverride.failure_codes, requiredCodes);
}

function assertInvalidAuthorityOverrideCoverage() {
  const requiredCodes = [
    "runtime_retrieval_rag_enabled",
    "runtime_index_build_enabled",
    "runtime_index_write_enabled",
    "embedding_generation_enabled",
    "vector_db_enabled",
    "fts_enabled",
    "provider_openai_call_enabled",
    "source_fetch_enabled",
    "crawler_enabled",
    "source_index_write_enabled",
    "durable_source_record_write_enabled",
    "candidate_record_write_enabled",
    "runtime_db_query_enabled",
    "runtime_db_write_enabled",
    "proof_or_evidence_enabled",
    "perspective_promotion_enabled",
    "work_mutation_enabled",
    "product_write_enabled",
    "product_id_allocation_enabled",
  ];
  assert.deepEqual(invalidAuthorityBoundaryOverride.failure_codes, requiredCodes);
}

function assertDocsPointers() {
  for (const requiredText of [
    "Non-authoritative Retrieval/RAG browser validation v0.1",
    fixturePath,
    smokePath,
    "validates deterministic fixture-backed implementation from #728",
    "validates #727 contract boundary and #728 top-level implementation boundary separation",
    "validates built preview bundle",
    "validates retrieval result family summary",
    "validates source reference summary",
    "validates invalid retrieval result override rejection",
    "validates invalid RAG context preview override rejection",
    "validates invalid source_refs override rejection",
    "validates invalid authority boundary override rejection",
    "retrieval result is recall, not authority",
    "RAG answer is context preview, not evidence/proof",
    "embedding similarity is not truth, salience authority, or promotion readiness",
    "retrieval score is not truth score, promotion score, or evidence strength",
    "index is rebuildable, derived, and non-authoritative",
    "stale index cannot override current state",
    "vector DB is not source of truth",
    "no hidden permanent memory",
    "no runtime retrieval/RAG execution",
    "no runtime index build",
    "no index write",
    "no embedding generation",
    "no vector DB",
    "no FTS",
    "no provider/OpenAI call",
    "no source fetch",
    "no crawler",
    "no DB write/query",
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
  for (const requiredText of [
    "Non-authoritative Retrieval/RAG browser validation validates the deterministic fixture-backed #728 implementation.",
    "It validates recall/context preview bundles against the #727 contract.",
    "It is not runtime retrieval/RAG, source fetch, provider extraction, index build/write, embedding generation, vector DB, FTS, proof/evidence, Perspective state, work status, promotion authority, salience authority, candidate/work mutation, or product write.",
    "Next recommended slice is Human-reviewed Durable Perspective Promotion contract v0.1.",
  ]) {
    assert.ok(substrateDoc.includes(requiredText), `substrate doc must include ${requiredText}`);
  }
  for (const requiredText of [
    "Non-authoritative Retrieval/RAG validation remains separated from durable Perspective promotion.",
    "Retrieval results preserve candidate/durable distinction.",
    "Search/retrieval results must link back to source_refs or explicit public-safe gap reason.",
    "RAG context preview is not proof/evidence/source of truth.",
    "Stale index cannot override current state.",
    "This slice does not implement runtime DB/browser/provider/source-fetch/retrieval behavior.",
  ]) {
    assert.ok(surfaceDoc.includes(requiredText), `surface doc must include ${requiredText}`);
    assert.ok(gateDoc.includes(requiredText), `gate doc must include ${requiredText}`);
  }
}

function assertImplementationSmokeDownstreamPointer() {
  for (const requiredText of [
    validationVersion,
    fixturePath,
    smokePath,
    packageScriptName,
    recommendationStatus,
    nextRecommendedSlice,
    "validates deterministic fixture-backed implementation from #728",
    "retrieval result is recall, not authority",
    "RAG answer is context preview, not evidence/proof",
    "product-write remains parked by #686",
  ]) {
    assert.ok(
      implementationSmokeSource.includes(requiredText),
      `#728 implementation smoke must allow browser validation downstream pointer: ${requiredText}`,
    );
  }
  assert.ok(
    contractSmokeSource.includes("non_authoritative_retrieval_rag_implementation.v0.1"),
    "#727 contract smoke must keep #728 implementation downstream pointer",
  );
}

function assertPortableMergeBaseFallback() {
  for (const requiredText of [
    "cachedMergeBaseRef",
    "gitRefExists(\"origin/main\")",
    "gitRefExists(\"main\")",
    "rev-parse",
    "HEAD^",
    "Unable to determine a base ref for static changed-file validation. Expected origin/main, local main, or HEAD^ to resolve.",
  ]) {
    assert.ok(smokeSource.includes(requiredText), `smoke must keep portable merge base fallback: ${requiredText}`);
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

function createValidationFingerprint(value) {
  const normalized = clone(value);
  normalized.validation_fingerprint = "";
  return `fnv1a32:${fnv1a32(canonicalJson(normalized))}`;
}

function deepEqual(left, right) {
  return canonicalJson(left) === canonicalJson(right);
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
