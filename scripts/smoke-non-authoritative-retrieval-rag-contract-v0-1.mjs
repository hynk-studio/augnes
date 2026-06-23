import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const typePath = "types/non-authoritative-retrieval-rag-contract.ts";
const fixturePath =
  "fixtures/research-candidate-review.non-authoritative-retrieval-rag-contract.sample.v0.1.json";
const smokePath =
  "scripts/smoke-non-authoritative-retrieval-rag-contract-v0-1.mjs";
const sourceValidationFixturePath =
  "fixtures/research-candidate-review.operator-source-candidate-generation-browser-validation.sample.v0.1.json";
const sourceValidationSmokePath =
  "scripts/smoke-operator-source-candidate-generation-browser-validation-v0-1.mjs";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const substrateDocPath = "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md";
const surfaceDocPath = "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md";
const gateDocPath =
  "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md";

const packageScriptName =
  "smoke:non-authoritative-retrieval-rag-contract-v0-1";
const packageScriptValue =
  "node scripts/smoke-non-authoritative-retrieval-rag-contract-v0-1.mjs";
const implementationBuilderPath =
  "lib/research-candidate-review/non-authoritative-retrieval-rag.ts";
const implementationFixturePath =
  "fixtures/research-candidate-review.non-authoritative-retrieval-rag-implementation.sample.v0.1.json";
const implementationSmokePath =
  "scripts/smoke-non-authoritative-retrieval-rag-implementation-v0-1.mjs";
const implementationPackageScriptName =
  "smoke:non-authoritative-retrieval-rag-implementation-v0-1";
const implementationPackageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-non-authoritative-retrieval-rag-implementation-v0-1.mjs";
const implementationVersion =
  "non_authoritative_retrieval_rag_implementation.v0.1";
const implementationRecommendationStatus =
  "ready_for_non_authoritative_retrieval_rag_browser_validation_v0_1";
const implementationNextRecommendedSlice =
  "non_authoritative_retrieval_rag_browser_validation_v0_1";
const contractKind = "non_authoritative_retrieval_rag_contract";
const contractVersion = "non_authoritative_retrieval_rag_contract.v0.1";
const previewVersion = "non_authoritative_retrieval_rag_preview.v0.1";
const recommendationStatus =
  "ready_for_non_authoritative_retrieval_rag_implementation_v0_1";
const nextRecommendedSlice =
  "non_authoritative_retrieval_rag_implementation_v0_1";
const writeFixture = process.argv.includes("--write-fixture");
let cachedMergeBaseRef = null;

const downstreamSmokePaths = [
  sourceValidationSmokePath,
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

assertTypeContract();
assertPackageScript();
assertStaticBoundary();
assertNoForbiddenRuntimePatterns();
assertContractShape(fixture);
assertContractScope(fixture.contract_scope);
assertRetrievalInputs(fixture.retrieval_inputs);
assertInputPolicy(fixture.input_policy);
assertRetrievalResultFamilies(fixture.retrieval_result_families);
assertNonAuthorityPolicy(fixture.non_authority_policy);
assertAuthorityBoundary(fixture.authority_boundary);
assertPreview(fixture.sample_retrieval_rag_contract_preview);
assertValidationPolicy(fixture.validation_policy);
assertPrivacyPolicy(fixture.privacy_policy);
assertDocsPointers();
assertSourceValidationDownstreamPointer();
assertPortableMergeBaseFallback();
assert.deepEqual(
  fixture,
  rebuiltFixture,
  "rebuilt Non-authoritative Retrieval/RAG contract fixture must match committed fixture",
);

console.log(
  JSON.stringify(
    {
      smoke: "non-authoritative-retrieval-rag-contract-v0-1",
      final_status: "pass",
      contract_kind: fixture.contract_kind,
      contract_version: fixture.contract_version,
      retrieval_result_family_count: fixture.retrieval_result_families.length,
      preview_result_count:
        fixture.sample_retrieval_rag_contract_preview.retrieval_results.length,
      runtime_retrieval_rag_implemented_now:
        fixture.authority_boundary.runtime_retrieval_rag_implemented_now,
      runtime_index_build_implemented_now:
        fixture.authority_boundary.runtime_index_build_implemented_now,
      runtime_index_write_now: fixture.authority_boundary.runtime_index_write_now,
      embedding_generation_implemented_now:
        fixture.authority_boundary.embedding_generation_implemented_now,
      vector_db_implemented_now:
        fixture.authority_boundary.vector_db_implemented_now,
      provider_openai_call_now:
        fixture.authority_boundary.provider_openai_call_now,
      source_fetch_now: fixture.authority_boundary.source_fetch_now,
      crawler_now: fixture.authority_boundary.crawler_now,
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
    `${sourceValidationFixture.validation_version}:${sourceValidationFixturePath}#726`;
  const authorityBoundary = buildAuthorityBoundary();
  const validationPolicy = buildValidationPolicy();
  const contract = {
    contract_kind: contractKind,
    contract_version: contractVersion,
    source_operator_source_candidate_generation_validation_ref:
      sourceValidationRef,
    contract_scope: buildContractScope(),
    retrieval_inputs: buildRetrievalInputs(),
    input_policy: buildInputPolicy(),
    retrieval_result_families: buildRetrievalResultFamilies(),
    non_authority_policy: buildNonAuthorityPolicy(),
    authority_boundary: authorityBoundary,
    sample_retrieval_rag_contract_preview: {
      preview_version: previewVersion,
      operator_context_ref:
        "operator_context:non_authoritative_retrieval_rag_contract_review",
      source_refs: buildSampleSourceRefs(),
      retrieval_results: buildSampleRetrievalResults(),
      rag_context_preview: {
        answer_summary:
          "Public-safe context preview assembled from recall references; it is not evidence, proof, source of truth, or promotion basis.",
        source_refs: [
          "source_ref_browser_capture_reference",
          "source_ref_manual_bibliographic",
        ],
        recall_only: true,
        authority: false,
        not_evidence: true,
        not_proof: true,
        not_source_of_truth: true,
        not_perspective_state: true,
        not_work_status: true,
        not_product_write: true,
        human_review_required_later: true,
      },
      authority_boundary: buildPreviewAuthorityBoundary(authorityBoundary),
      validation_policy: validationPolicy,
    },
    validation_policy: validationPolicy,
    privacy_policy: buildPrivacyPolicy(),
    recommendation_status: recommendationStatus,
    next_recommended_slice: nextRecommendedSlice,
    contract_fingerprint: "",
    fingerprint_algorithm: "fnv1a32_canonical_json",
  };
  contract.contract_fingerprint = createFingerprint(contract);
  return contract;
}

function buildContractScope() {
  return {
    retrieval_rag_contract_only: true,
    runtime_retrieval_rag_now: false,
    runtime_index_build_now: false,
    runtime_index_write_now: false,
    embedding_generation_now: false,
    vector_db_now: false,
    fts_now: false,
    provider_openai_call_now: false,
    source_fetch_now: false,
    crawler_now: false,
  };
}

function buildRetrievalInputs() {
  return [
    "source_ref_metadata",
    "candidate_summaries",
    "review_notes",
    "perspective_delta_summaries",
    "formation_receipt_summaries",
  ];
}

function buildInputPolicy() {
  return {
    source_ref_metadata_allowed: true,
    candidate_summaries_allowed: true,
    review_notes_allowed: true,
    perspective_delta_summaries_allowed: true,
    formation_receipt_summaries_allowed: true,
    raw_private_source_body_allowed: false,
    raw_provider_ids_allowed: false,
    raw_thread_run_session_ids_allowed: false,
    private_or_unstable_urls_allowed: false,
    secrets_allowed: false,
  };
}

function buildRetrievalResultFamilies() {
  return [
    {
      family_kind: "source_ref_recall_result",
      source_refs_required: true,
      candidate_durable_distinction_required: true,
      recall_only: true,
      authority: false,
      not_evidence: true,
      not_proof: true,
      not_source_of_truth: true,
      not_promotion_basis: true,
    },
    {
      family_kind: "candidate_recall_result",
      source_refs_required: true,
      candidate_durable_distinction_required: true,
      recall_only: true,
      authority: false,
      not_evidence: true,
      not_proof: true,
      not_source_of_truth: true,
      not_promotion_basis: true,
    },
    {
      family_kind: "review_note_recall_result",
      source_refs_or_review_record_ref_required: true,
      candidate_durable_distinction_required: true,
      recall_only: true,
      authority: false,
      not_evidence: true,
      not_proof: true,
      not_source_of_truth: true,
      not_promotion_basis: true,
    },
    {
      family_kind: "perspective_delta_recall_result",
      source_refs_required: true,
      candidate_durable_distinction_required: true,
      recall_only: true,
      authority: false,
      not_evidence: true,
      not_proof: true,
      not_source_of_truth: true,
      not_promotion_basis: true,
    },
    {
      family_kind: "formation_receipt_recall_result",
      formation_receipt_ref_required: true,
      selected_source_refs_visible: true,
      recall_only: true,
      authority: false,
      not_evidence: true,
      not_proof: true,
      not_source_of_truth: true,
      not_promotion_basis: true,
    },
    {
      family_kind: "rag_context_preview",
      source_refs_required: true,
      generated_answer_authority: false,
      answer_is_context_preview_only: true,
      not_evidence: true,
      not_proof: true,
      not_source_of_truth: true,
      not_perspective_state: true,
      not_work_status: true,
      not_product_write: true,
      human_review_required_later: true,
    },
    {
      family_kind: "retrieval_gap_or_tension_candidate",
      source_refs_or_gap_reason_required: true,
      candidate_only: true,
      preview_only: true,
      not_evidence: true,
      not_proof: true,
      not_source_of_truth: true,
      not_promotion_basis: true,
    },
  ];
}

function buildNonAuthorityPolicy() {
  return {
    retrieval_result_is_recall_not_authority: true,
    rag_answer_is_context_preview_not_evidence_or_proof: true,
    embedding_similarity_is_not_truth_score: true,
    embedding_similarity_is_not_salience_authority: true,
    embedding_similarity_is_not_promotion_readiness: true,
    retrieval_score_is_not_truth_score: true,
    retrieval_score_is_not_promotion_score: true,
    retrieval_score_is_not_evidence_strength: true,
    index_is_rebuildable: true,
    index_is_derived: true,
    index_is_non_authoritative: true,
    stale_index_cannot_override_current_state: true,
    vector_db_is_not_source_of_truth: true,
    hidden_permanent_memory_not_allowed: true,
  };
}

function buildAuthorityBoundary() {
  return {
    contract_added_now: true,
    implementation_added_now: false,
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

function buildPreviewAuthorityBoundary(authorityBoundary) {
  const previewBoundary = clone(authorityBoundary);
  delete previewBoundary.implementation_added_now;
  return previewBoundary;
}

function buildValidationPolicy() {
  return {
    all_results_source_ref_backed_or_explicit_gap: true,
    all_results_preserve_candidate_durable_distinction: true,
    all_results_recall_only: true,
    no_result_is_evidence: true,
    no_result_is_proof: true,
    no_result_is_source_of_truth: true,
    no_result_is_promotion_basis: true,
    rag_context_preview_not_evidence_or_proof: true,
    retrieval_scores_not_truth_or_promotion_scores: true,
    stale_index_cannot_override_current_state: true,
    no_runtime_retrieval_rag_execution: true,
    no_runtime_index_build: true,
    no_index_write: true,
    no_embedding_generation: true,
    no_vector_db: true,
    no_provider_openai_call: true,
    no_source_fetch: true,
    no_crawler: true,
    no_db_write_or_query: true,
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
    public_safe_source_refs_only: true,
  };
}

function buildSampleSourceRefs() {
  return [
    {
      source_ref_id: "source_ref_browser_capture_reference",
      public_safe_ref: "source:browser_capture_reference_only",
      source_refs: ["source:browser_capture_reference_only"],
      operator_context_ref: "operator_context:browser_capture_reference_review",
      public_safe: true,
    },
    {
      source_ref_id: "source_ref_manual_bibliographic",
      public_safe_ref: "source:manual_bibliographic_reference",
      source_refs: ["source:manual_bibliographic_reference"],
      operator_context_ref: "operator_context:bibliographic_review",
      public_safe: true,
    },
    {
      source_ref_id: "source_ref_oauth_document_pointer",
      public_safe_ref: "source:oauth_document_pointer_public_safe",
      source_refs: ["source:oauth_document_pointer_public_safe"],
      operator_context_ref: "operator_context:oauth_pointer_review",
      public_safe: true,
    },
  ];
}

function buildSampleRetrievalResults() {
  return [
    recallResult({
      id: "retrieval_result_source_ref_recall_001",
      family: "source_ref_recall_result",
      title: "Source reference recall result",
      summary: "Recall-only source reference metadata surfaced for review context.",
      sourceRefs: ["source_ref_browser_capture_reference"],
    }),
    recallResult({
      id: "retrieval_result_candidate_recall_001",
      family: "candidate_recall_result",
      title: "Candidate recall result",
      summary: "Candidate summary recall with durable candidate distinction preserved.",
      sourceRefs: ["source_ref_manual_bibliographic"],
    }),
    {
      ...recallResult({
        id: "retrieval_result_review_note_recall_001",
        family: "review_note_recall_result",
        title: "Review note recall result",
        summary: "Review note recall connected to a public-safe review record reference.",
        sourceRefs: ["source_ref_browser_capture_reference"],
      }),
      review_record_ref: "review_record_ref:operator_review_note_public_safe",
    },
    recallResult({
      id: "retrieval_result_perspective_delta_recall_001",
      family: "perspective_delta_recall_result",
      title: "Perspective delta recall result",
      summary: "Perspective delta summary recall, not durable Perspective state.",
      sourceRefs: ["source_ref_oauth_document_pointer"],
    }),
    {
      ...recallResult({
        id: "retrieval_result_formation_receipt_recall_001",
        family: "formation_receipt_recall_result",
        title: "Formation receipt recall result",
        summary: "Formation receipt summary recall with selected source refs visible.",
        sourceRefs: ["source_ref_browser_capture_reference"],
      }),
      formation_receipt_ref: "formation_receipt_ref:public_safe_summary",
      selected_source_refs: ["source_ref_browser_capture_reference"],
    },
    recallResult({
      id: "retrieval_result_rag_context_preview_001",
      family: "rag_context_preview",
      title: "RAG context preview recall",
      summary: "Context preview only, not evidence, proof, source of truth, or work status.",
      sourceRefs: [
        "source_ref_browser_capture_reference",
        "source_ref_manual_bibliographic",
      ],
    }),
    {
      ...recallResult({
        id: "retrieval_result_gap_or_tension_candidate_001",
        family: "retrieval_gap_or_tension_candidate",
        title: "Retrieval gap or tension candidate",
        summary: "Candidate-only preview of a possible retrieval gap for later review.",
        sourceRefs: [],
      }),
      gap_reason: "public_safe_gap_reason:insufficient_context_for_review",
    },
  ];
}

function recallResult({ id, family, title, summary, sourceRefs }) {
  return {
    retrieval_result_id: id,
    family_kind: family,
    title,
    summary,
    source_refs: sourceRefs,
    retrieval_score_label: "relative_recall_rank_not_truth_score",
    candidate_durable_distinction_preserved: true,
    recall_only: true,
    authority: false,
    not_evidence: true,
    not_proof: true,
    not_source_of_truth: true,
    not_promotion_basis: true,
  };
}

function assertTypeContract() {
  for (const requiredText of [
    "NonAuthoritativeRetrievalRagContract",
    contractKind,
    contractVersion,
    "retrieval_rag_contract_only",
    "NonAuthoritativeRetrievalResultFamilyKind",
    "source_ref_recall_result",
    "candidate_recall_result",
    "review_note_recall_result",
    "perspective_delta_recall_result",
    "formation_receipt_recall_result",
    "rag_context_preview",
    "retrieval_gap_or_tension_candidate",
    "retrieval_result_is_recall_not_authority",
    "rag_answer_is_context_preview_not_evidence_or_proof",
    "embedding_similarity_is_not_truth_score",
    "stale_index_cannot_override_current_state",
    "vector_db_is_not_source_of_truth",
    "hidden_permanent_memory_not_allowed",
    recommendationStatus,
    nextRecommendedSlice,
    "fnv1a32_canonical_json",
  ]) {
    assert.ok(typeSource.includes(requiredText), `${typePath} must include ${requiredText}`);
  }
}

function assertPackageScript() {
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
    "package.json must add only the Non-authoritative Retrieval/RAG contract smoke script",
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
  if (implementationSliceActive()) {
    assertImplementationChangedFiles(changedFiles);
    return;
  }
  for (const expectedFile of expectedChangedFiles) {
    assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedChangedFiles.includes(changedFile),
      `unexpected changed file in Non-authoritative Retrieval/RAG contract slice: ${changedFile}`,
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

function implementationSliceActive() {
  return readChangedFiles().includes(implementationSmokePath);
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
    "package.json must add only the Non-authoritative Retrieval/RAG implementation smoke script",
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
    "lib/research-candidate-review/operator-source-candidate-generation.ts",
    "fixtures/research-candidate-review.operator-source-candidate-generation-implementation.sample.v0.1.json",
    "lib/research-candidate-review/bounded-external-source-intake.ts",
    "fixtures/research-candidate-review.bounded-external-source-intake-implementation.sample.v0.1.json",
    "lib/research-candidate-review/salience-governor.ts",
    "fixtures/research-candidate-review.salience-governor-implementation.sample.v0.1.json",
    "lib/research-candidate-review/recent-rehearsal-buffer.ts",
    "fixtures/research-candidate-review.recent-rehearsal-buffer-implementation.sample.v0.1.json",
  ]) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      `Non-authoritative Retrieval/RAG implementation slice must not change ${unchangedPath}`,
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
    assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      `unexpected changed file in Non-authoritative Retrieval/RAG implementation downstream slice: ${changedFile}`,
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
    implementationVersion,
    implementationBuilderPath,
    implementationFixturePath,
    implementationSmokePath,
    implementationPackageScriptName,
    implementationRecommendationStatus,
    implementationNextRecommendedSlice,
    "deterministic fixture-backed implementation only",
    "retrieval result is recall, not authority",
    "RAG answer is context preview, not evidence/proof",
    "product-write remains parked by #686",
  ]) {
    assert.ok(
      smokeSource.includes(requiredText),
      `#727 contract smoke must allow implementation downstream pointer: ${requiredText}`,
    );
  }
}

function assertNoForbiddenRuntimePatterns() {
  const changedSourceFiles = readChangedFiles().filter((filePath) =>
    filePath !== "types/non-authoritative-retrieval-rag-contract.ts" &&
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
      { label: "search runtime", regex: /\bsearchIndex\b|\bexecuteSearch\b|\brunSearch\b/i },
      { label: "index build/write", regex: /\bbuildIndex\b|\bwriteIndex\b|\bsourceIndexWrite\b|\bwriteSourceIndex\b/i },
      { label: "embedding/vector/FTS implementation", regex: /\bcreateEmbedding\b|\bgenerateEmbedding\b|\bvectorIndex\b|\bvectorDb\b|\bFTS5\b|\bfullTextSearch\b/i },
      { label: "durable source record write", regex: /\bwriteDurableSourceRecord\b|\binsertDurableSourceRecord\b|\bpersistDurableSourceRecord\b|\bdurableSourceRecordWrite\b/i },
      { label: "candidate runtime generation", regex: /\brunCandidateGeneration\b|\bgenerateCandidate\b|\bcreateCandidateFromSource\b/i },
      { label: "candidate record write", regex: /\bwriteCandidateRecord\b|\binsertCandidateRecord\b|\bpersistCandidateRecord\b/i },
      { label: "candidate mutation", regex: /\bmutateCandidate\b|\bupdateCandidate\b|\bdeleteCandidate\b/ },
      { label: "proof/evidence write", regex: /\b(write|insert|persist)(Proof|Evidence)\b|\bproof_or_evidence_record:\s*true\b/i },
      { label: "Perspective promotion", regex: /\bpromotePerspective\b|\bperspective_promotion:\s*true\b/i },
      { label: "promotion decision", regex: /\bpromotionDecision\b|\bpromotion_decision_record:\s*true\b/i },
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

function assertContractShape(value) {
  assert.equal(value.contract_kind, contractKind);
  assert.equal(value.contract_version, contractVersion);
  assert.equal(
    value.source_operator_source_candidate_generation_validation_ref,
    `${sourceValidationFixture.validation_version}:${sourceValidationFixturePath}#726`,
  );
  assert.equal(value.recommendation_status, recommendationStatus);
  assert.equal(value.next_recommended_slice, nextRecommendedSlice);
  assert.equal(value.fingerprint_algorithm, "fnv1a32_canonical_json");
  assert.equal(value.contract_fingerprint, createFingerprint(value));
}

function assertContractScope(value) {
  assert.deepEqual(value, buildContractScope());
}

function assertRetrievalInputs(value) {
  assert.deepEqual(value, buildRetrievalInputs());
}

function assertInputPolicy(value) {
  assert.deepEqual(value, buildInputPolicy());
  assert.equal(value.raw_private_source_body_allowed, false);
  assert.equal(value.raw_provider_ids_allowed, false);
  assert.equal(value.raw_thread_run_session_ids_allowed, false);
  assert.equal(value.private_or_unstable_urls_allowed, false);
  assert.equal(value.secrets_allowed, false);
}

function assertRetrievalResultFamilies(value) {
  const expectedKinds = [
    "source_ref_recall_result",
    "candidate_recall_result",
    "review_note_recall_result",
    "perspective_delta_recall_result",
    "formation_receipt_recall_result",
    "rag_context_preview",
    "retrieval_gap_or_tension_candidate",
  ];
  assert.deepEqual(
    value.map((family) => family.family_kind),
    expectedKinds,
  );
  for (const family of value) {
    if (family.family_kind === "rag_context_preview") {
      assert.equal(family.generated_answer_authority, false);
      assert.equal(family.answer_is_context_preview_only, true);
      assert.equal(family.not_perspective_state, true);
      assert.equal(family.not_work_status, true);
      assert.equal(family.not_product_write, true);
      assert.equal(family.human_review_required_later, true);
    } else if (family.family_kind === "retrieval_gap_or_tension_candidate") {
      assert.equal(family.candidate_only, true);
      assert.equal(family.preview_only, true);
    } else {
      assert.equal(family.recall_only, true);
      assert.equal(family.authority, false);
    }
    assert.equal(family.not_evidence, true);
    assert.equal(family.not_proof, true);
    assert.equal(family.not_source_of_truth, true);
    assert.equal(family.not_promotion_basis ?? true, true);
  }
}

function assertNonAuthorityPolicy(value) {
  assert.deepEqual(value, buildNonAuthorityPolicy());
  for (const [key, flag] of Object.entries(value)) {
    assert.equal(flag, true, `non_authority_policy.${key} must be true`);
  }
}

function assertAuthorityBoundary(value) {
  assert.equal(value.contract_added_now, true);
  assert.equal(value.product_write_lane_parked_by_686, true);
  for (const [key, flag] of Object.entries(value)) {
    if (key === "contract_added_now" || key === "product_write_lane_parked_by_686") {
      assert.equal(flag, true, `${key} must be true`);
    } else {
      assert.equal(flag, false, `${key} must be false`);
    }
  }
}

function assertPreview(value) {
  assert.equal(value.preview_version, previewVersion);
  assert.equal(
    value.operator_context_ref,
    "operator_context:non_authoritative_retrieval_rag_contract_review",
  );
  assert.ok(value.source_refs.length >= 3);
  for (const sourceRef of value.source_refs) {
    assert.ok(sourceRef.source_ref_id);
    assert.ok(sourceRef.public_safe_ref);
    assert.ok(sourceRef.source_refs.length > 0);
    assert.ok(sourceRef.operator_context_ref);
    assert.equal(sourceRef.public_safe, true);
  }
  const resultKinds = value.retrieval_results.map((result) => result.family_kind);
  for (const family of fixture.retrieval_result_families) {
    assert.ok(
      resultKinds.includes(family.family_kind),
      `preview retrieval results must include ${family.family_kind}`,
    );
  }
  for (const result of value.retrieval_results) {
    assert.equal(result.recall_only, true);
    assert.equal(result.authority, false);
    assert.equal(result.not_evidence, true);
    assert.equal(result.not_proof, true);
    assert.equal(result.not_source_of_truth, true);
    assert.equal(result.not_promotion_basis, true);
    assert.ok(result.retrieval_score_label.includes("not_truth_score"));
    if (result.family_kind !== "retrieval_gap_or_tension_candidate") {
      assert.ok(
        (result.source_refs ?? []).length > 0 ||
          Boolean(result.review_record_ref) ||
          Boolean(result.formation_receipt_ref),
        `${result.family_kind} must be source-ref-backed or record-ref-backed`,
      );
    } else {
      assert.ok(result.gap_reason);
    }
  }
  assert.equal(value.rag_context_preview.source_refs.length > 0, true);
  assert.equal(value.rag_context_preview.recall_only, true);
  assert.equal(value.rag_context_preview.authority, false);
  assert.equal(value.rag_context_preview.not_evidence, true);
  assert.equal(value.rag_context_preview.not_proof, true);
  assert.equal(value.rag_context_preview.not_source_of_truth, true);
  assert.equal(value.rag_context_preview.not_perspective_state, true);
  assert.equal(value.rag_context_preview.not_work_status, true);
  assert.equal(value.rag_context_preview.not_product_write, true);
  assert.equal(value.rag_context_preview.human_review_required_later, true);
  assert.equal(Object.hasOwn(value.authority_boundary, "implementation_added_now"), false);
  assert.equal(value.authority_boundary.contract_added_now, true);
  assert.equal(value.authority_boundary.product_write_lane_parked_by_686, true);
  for (const [key, flag] of Object.entries(value.authority_boundary)) {
    if (key === "contract_added_now" || key === "product_write_lane_parked_by_686") {
      assert.equal(flag, true, `${key} must be true`);
    } else {
      assert.equal(flag, false, `${key} must be false`);
    }
  }
  assert.deepEqual(value.validation_policy, fixture.validation_policy);
}

function assertValidationPolicy(value) {
  assert.deepEqual(value, buildValidationPolicy());
  for (const [key, flag] of Object.entries(value)) {
    assert.equal(flag, true, `validation_policy.${key} must be true`);
  }
}

function assertPrivacyPolicy(value) {
  assert.deepEqual(value, buildPrivacyPolicy());
}

function assertDocsPointers() {
  for (const requiredText of [
    "Non-authoritative Retrieval/RAG contract v0.1",
    typePath,
    fixturePath,
    smokePath,
    "retrieval result is recall, not authority",
    "RAG answer is context preview, not evidence/proof",
    "embedding similarity is not truth, salience authority, or promotion readiness",
    "index is rebuildable, derived, and non-authoritative",
    "retrieval score is not truth score, promotion score, or evidence strength",
    "stale index cannot override current state",
    "vector DB is not source of truth",
    "no hidden permanent memory",
    "no runtime retrieval/RAG execution",
    "no runtime index build",
    "no index write",
    "no embedding generation",
    "no vector DB",
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
    "Non-authoritative Retrieval/RAG contract defines recall/context expansion only.",
    "Retrieval/RAG results are advisory and folded context, not authority.",
    "RAG answer is not proof/evidence/source of truth.",
    "Embedding similarity and retrieval scores are not promotion readiness, truth, salience authority, or evidence strength.",
    "No runtime retrieval/RAG execution is added in this slice.",
    "Next recommended slice is Non-authoritative Retrieval/RAG implementation v0.1.",
  ]) {
    assert.ok(substrateDoc.includes(requiredText), `substrate doc must include ${requiredText}`);
  }
  for (const requiredText of [
    "Retrieval/RAG remains separated from durable Perspective promotion.",
    "Retrieval results preserve candidate/durable distinction.",
    "Search results must link back to source_refs.",
    "Stale index cannot override current state.",
    "This slice does not implement runtime DB/browser/provider/source-fetch/retrieval behavior.",
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
    "retrieval result is recall, not authority",
    "RAG answer is context preview, not evidence/proof",
    "product-write remains parked by #686",
  ]) {
    assert.ok(
      sourceValidationSmoke.includes(requiredText),
      `#726 browser validation smoke must allow Non-authoritative Retrieval/RAG downstream pointer: ${requiredText}`,
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

function createFingerprint(value) {
  const normalized = clone(value);
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

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
