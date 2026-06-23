import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const builderPath =
  "lib/research-candidate-review/bounded-external-source-intake.ts";
const contractFixturePath =
  "fixtures/research-candidate-review.bounded-external-source-intake-contract.sample.v0.1.json";
const implementationFixturePath =
  "fixtures/research-candidate-review.bounded-external-source-intake-implementation.sample.v0.1.json";
const smokePath =
  "scripts/smoke-bounded-external-source-intake-implementation-v0-1.mjs";
const contractSmokePath =
  "scripts/smoke-bounded-external-source-intake-contract-v0-1.mjs";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const substrateDocPath = "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md";
const surfaceDocPath = "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md";
const gateDocPath =
  "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md";

const packageScriptName =
  "smoke:bounded-external-source-intake-implementation-v0-1";
const packageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-bounded-external-source-intake-implementation-v0-1.mjs";
const implementationKind = "bounded_external_source_intake_implementation";
const implementationVersion =
  "bounded_external_source_intake_implementation.v0.1";
const intakeVersion = "bounded_external_source_intake.v0.1";
const recommendationStatus =
  "ready_for_bounded_external_source_intake_browser_validation_v0_1";
const nextRecommendedSlice =
  "bounded_external_source_intake_browser_validation_v0_1";
const browserValidationPackageScriptName =
  "smoke:bounded-external-source-intake-browser-validation-v0-1";
const browserValidationPackageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-bounded-external-source-intake-browser-validation-v0-1.mjs";
const browserValidationFixturePath =
  "fixtures/research-candidate-review.bounded-external-source-intake-browser-validation.sample.v0.1.json";
const browserValidationSmokePath =
  "scripts/smoke-bounded-external-source-intake-browser-validation-v0-1.mjs";
const browserValidationVersion =
  "bounded_external_source_intake_browser_validation.v0.1";
const browserValidationRecommendationStatus =
  "ready_for_operator_source_candidate_generation_contract_v0_1";
const browserValidationNextRecommendedSlice =
  "operator_source_candidate_generation_contract_v0_1";
const writeFixture = process.argv.includes("--write-fixture");
let cachedMergeBaseRef = null;

const expectedChangedFiles = [
  builderPath,
  implementationFixturePath,
  smokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  contractSmokePath,
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

for (const filePath of [
  builderPath,
  contractFixturePath,
  smokePath,
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
  assert.ok(existsSync(implementationFixturePath), `${implementationFixturePath} must exist`);
}

const builderSource = readFile(builderPath);
const smokeSource = readFile(smokePath);
const contractSmokeSource = readFile(contractSmokePath);
const contractFixture = readJson(contractFixturePath);
const packageJson = readJson(packagePath);
const basePackageJson = readJsonFromGit(packagePath);
const indexDoc = readFile(indexPath);
const substrateDoc = readFile(substrateDocPath);
const surfaceDoc = readFile(surfaceDocPath);
const gateDoc = readFile(gateDocPath);

const { buildBoundedExternalSourceIntakeImplementation } = await import(
  "../lib/research-candidate-review/bounded-external-source-intake.ts"
);

const rebuiltImplementationFixture =
  buildBoundedExternalSourceIntakeImplementation({
    bounded_external_source_intake_contract: contractFixture,
    source_contract_ref: `${contractFixture.contract_version}:${contractFixturePath}`,
  });

if (writeFixture) {
  writeFileSync(
    implementationFixturePath,
    `${JSON.stringify(rebuiltImplementationFixture, null, 2)}\n`,
  );
  process.exit(0);
}

const fixture = readJson(implementationFixturePath);

assertBuilderFile();
assertPackageScript();
assertStaticBoundary();
assertNoForbiddenRuntimePatterns();
assert.deepEqual(
  fixture,
  rebuiltImplementationFixture,
  "rebuilt Bounded External Source Intake implementation fixture must match committed fixture",
);
assertImplementationFixture(fixture);
assertGeneratedSourceIntakeReferenceBundle(
  fixture.generated_source_intake_reference_bundle,
);
assertAllowedSourceInputSummary(fixture.allowed_source_input_summary);
assertDisallowedSourceInputSummary(fixture.disallowed_source_input_summary);
assertSourceReferenceSummary(fixture.source_reference_summary);
assertCandidateGenerationSummary(fixture.candidate_generation_summary);
assertProvenanceSummary(fixture.provenance_summary);
assertPrivacySummary(fixture.privacy_summary);
assertNonAuthoritySummary(fixture.non_authority_summary);
assertAuthorityBoundary(fixture.authority_boundary);
assertValidationPolicy(fixture.validation_policy);
assertValidation(fixture.validation);
assertDocsPointers();
assertContractSmokeDownstreamPointer();
assertPortableMergeBaseFallback();

console.log(
  JSON.stringify(
    {
      smoke: "bounded-external-source-intake-implementation-v0-1",
      final_status: "pass",
      implementation_kind: fixture.implementation_kind,
      implementation_version: fixture.implementation_version,
      source_contract_fingerprint: fixture.source_contract_fingerprint,
      generated_bundle_boundary_matches_contract:
        fixture.validation.generated_bundle_boundary_matches_contract,
      generated_bundle_validation_matches_contract:
        fixture.validation.generated_bundle_validation_matches_contract,
      source_fetch_not_implemented:
        fixture.validation.source_fetch_not_implemented,
      provider_extraction_not_implemented:
        fixture.validation.provider_extraction_not_implemented,
      retrieval_rag_not_implemented:
        fixture.validation.retrieval_rag_not_implemented,
      durable_source_record_write_not_implemented:
        fixture.validation.durable_source_record_write_not_implemented,
      product_write_lane_parked_by_686:
        fixture.authority_boundary.product_write_lane_parked_by_686,
      next_recommended_slice: fixture.next_recommended_slice,
    },
    null,
    2,
  ),
);

function assertBuilderFile() {
  for (const requiredText of [
    "buildBoundedExternalSourceIntakeImplementation",
    implementationKind,
    implementationVersion,
    "source_contract_ref",
    "source_contract_fingerprint",
    "source_salience_governor_validation_ref",
    "generated_source_intake_reference_bundle",
    "allowed_source_input_summary",
    "disallowed_source_input_summary",
    "source_reference_summary",
    "candidate_generation_summary",
    "provenance_summary",
    "privacy_summary",
    "non_authority_summary",
    "authority_boundary",
    "validation_policy",
    "recommendation_status",
    "next_recommended_slice",
    "implementation_fingerprint",
    "fnv1a32_canonical_json",
  ]) {
    assert.ok(builderSource.includes(requiredText), `${builderPath} must include ${requiredText}`);
  }
  assert.match(
    builderSource,
    /export function buildBoundedExternalSourceIntakeImplementation\b/,
    "builder must export buildBoundedExternalSourceIntakeImplementation",
  );
}

function assertPackageScript() {
  if (browserValidationSliceActive()) {
    assertBrowserValidationPackageScript();
    return;
  }
  assert.equal(packageJson.scripts[packageScriptName], packageScriptValue);
  const addedScripts = Object.keys(packageJson.scripts)
    .filter((scriptName) => !basePackageJson.scripts[scriptName])
    .sort();
  assert.deepEqual(
    addedScripts,
    [packageScriptName],
    "package.json must add only the Bounded External Source Intake implementation smoke script",
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
  if (browserValidationSliceActive()) {
    assertBrowserValidationChangedFiles(changedFiles);
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
      `Bounded External Source Intake implementation slice must not change ${unchangedPath}`,
    );
  }
  for (const expectedFile of expectedChangedFiles) {
    assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedChangedFiles.includes(changedFile),
      `unexpected changed file in Bounded External Source Intake implementation slice: ${changedFile}`,
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

function assertNoForbiddenRuntimePatterns() {
  const changedSourceFiles = readChangedFiles().filter((filePath) =>
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
      { label: "durable source record write", regex: /\bwriteDurableSourceRecord\b|\binsertDurableSourceRecord\b|\bpersistDurableSourceRecord\b|\bdurableSourceRecordWrite\b/i },
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
      { label: "candidate generation runtime", regex: /\bgenerateCandidate\b|\bcreateCandidateFromSource\b/i },
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

function assertImplementationFixture(value) {
  assert.equal(value.implementation_kind, implementationKind);
  assert.equal(value.implementation_version, implementationVersion);
  assert.equal(
    value.source_contract_ref,
    `${contractFixture.contract_version}:${contractFixturePath}`,
  );
  assert.equal(value.source_contract_fingerprint, contractFixture.contract_fingerprint);
  assert.equal(
    value.source_salience_governor_validation_ref,
    contractFixture.source_salience_governor_validation_ref,
  );
  assert.equal(value.recommendation_status, recommendationStatus);
  assert.equal(value.next_recommended_slice, nextRecommendedSlice);
  assert.match(value.implementation_fingerprint, /^fnv1a32:[0-9a-f]{8}$/);
  assert.equal(value.fingerprint_algorithm, "fnv1a32_canonical_json");
}

function assertGeneratedSourceIntakeReferenceBundle(bundle) {
  for (const field of Object.keys(contractFixture.sample_source_intake_reference_bundle)) {
    assert.ok(Object.hasOwn(bundle, field), `generated source intake bundle must include ${field}`);
  }
  assert.equal(bundle.intake_version, intakeVersion);
  assert.ok(Array.isArray(bundle.source_refs));
  assert.ok(bundle.source_refs.length > 0);
  assert.ok(Array.isArray(bundle.disallowed_source_inputs));
  assert.deepEqual(bundle.authority_boundary, contractFixture.authority_boundary);
  assert.deepEqual(bundle.validation, contractFixture.validation_policy);
  assert.equal(Object.hasOwn(bundle.authority_boundary, "implementation_added_now"), false);
  assert.equal(
    Object.hasOwn(bundle.authority_boundary, "deterministic_builder_added_now"),
    false,
  );
  assert.equal(bundle.source_reference_policy_ref.length > 0, true);
  assert.equal(bundle.candidate_generation_policy_ref.length > 0, true);
  assert.equal(bundle.provenance_policy_ref.length > 0, true);
  assert.equal(bundle.privacy_policy_ref.length > 0, true);
  assert.equal(bundle.non_authority_policy_ref.length > 0, true);
  for (const sourceRef of bundle.source_refs) {
    assert.equal(typeof sourceRef.source_ref_id, "string");
    assert.ok(sourceRef.source_ref_id.length > 0);
    assert.ok(Array.isArray(sourceRef.source_refs));
    assert.ok(sourceRef.source_refs.length > 0);
    assert.equal(typeof sourceRef.operator_context_ref, "string");
    assert.ok(sourceRef.operator_context_ref.length > 0);
    assert.equal(sourceRef.public_safe, true);
    assert.equal(sourceRef.accepted_as_reference_only_now, true);
    assert.equal(sourceRef.source_fetch_now, false);
    assert.equal(sourceRef.provider_extraction_now, false);
    assert.equal(sourceRef.candidate_generation_later_only, true);
  }
}

function assertAllowedSourceInputSummary(value) {
  assert.equal(value.allowed_input_count, contractFixture.allowed_source_inputs.length);
  assert.deepEqual(
    value.allowed_input_kinds,
    contractFixture.allowed_source_inputs.map((input) => input.input_kind),
  );
  assert.equal(value.all_inputs_reference_only_now, true);
  assert.equal(value.all_source_fetch_now_false, true);
  assert.equal(value.all_provider_extraction_now_false, true);
  assert.equal(value.all_candidate_generation_later_only, true);
  assert.equal(value.all_require_source_refs, true);
  assert.equal(value.all_require_operator_context, true);
  assert.equal(value.all_public_safe_fixture_only_now, true);
}

function assertDisallowedSourceInputSummary(value) {
  assert.equal(value.disallowed_input_count, contractFixture.disallowed_source_inputs.length);
  assert.deepEqual(
    value.disallowed_input_kinds,
    contractFixture.disallowed_source_inputs.map((input) => input.input_kind),
  );
  assert.equal(value.includes_crawler_seed, true);
  assert.equal(value.includes_unbounded_domain_crawl, true);
  assert.equal(value.includes_automatic_web_search, true);
  assert.equal(value.includes_raw_oauth_token, true);
  assert.equal(value.includes_raw_private_url_as_canonical_id, true);
  assert.equal(value.all_disallowed_now, true);
  assert.equal(value.all_have_reasons, true);
}

function assertSourceReferenceSummary(value) {
  const bundle = fixture.generated_source_intake_reference_bundle;
  assert.equal(value.source_ref_count, bundle.source_refs.length);
  assert.deepEqual(
    value.source_ref_ids,
    bundle.source_refs.map((sourceRef) => sourceRef.source_ref_id),
  );
  assert.equal(value.all_public_safe, true);
  assert.equal(value.all_have_source_refs, true);
  assert.equal(value.all_have_operator_context, true);
  assert.equal(value.all_reference_only_now, true);
  assert.equal(value.all_source_fetch_now_false, true);
  assert.equal(value.all_provider_extraction_now_false, true);
  assert.equal(value.raw_url_not_canonical_id, true);
  assert.equal(value.raw_provider_id_not_canonical_id, true);
  assert.equal(value.private_identifier_not_canonical_id, true);
  assert.equal(value.no_fetch_now, true);
  assert.equal(value.no_crawl_now, true);
  assert.equal(value.no_provider_call_now, true);
  assert.equal(value.no_retrieval_rag_now, true);
  assert.equal(value.no_embedding_now, true);
  assert.equal(value.no_index_write_now, true);
}

function assertCandidateGenerationSummary(value) {
  assert.equal(value.source_intake_may_prepare_candidates_later, true);
  assert.equal(value.candidate_generation_not_implemented_now, true);
  assert.equal(value.generated_candidate_is_not_proof_or_evidence, true);
  assert.equal(value.generated_candidate_is_not_source_of_truth, true);
  assert.equal(value.generated_candidate_does_not_promote_perspective, true);
  assert.equal(value.generated_candidate_does_not_mutate_work, true);
  assert.equal(value.generated_candidate_does_not_write_product, true);
  assert.equal(value.human_review_required_later, true);
}

function assertProvenanceSummary(value) {
  assert.equal(value.source_refs_required, true);
  assert.equal(value.operator_context_required, true);
  assert.equal(value.provenance_visible_to_review_surface_later, true);
  assert.equal(value.unresolved_source_status_allowed, true);
  assert.deepEqual(
    value.source_status_values,
    contractFixture.provenance_policy.source_status_values,
  );
  assert.equal(value.all_source_refs_have_valid_status, true);
}

function assertPrivacySummary(value) {
  assert.equal(value.public_safe_fixture_only_now, true);
  assert.equal(value.no_secrets_in_fixture, true);
  assert.equal(value.no_raw_oauth_tokens, true);
  assert.equal(value.no_private_urls_in_fixture, true);
  assert.equal(value.no_provider_ids_as_canonical_labels, true);
  assert.equal(value.no_thread_run_session_ids_as_canonical_labels, true);
}

function assertNonAuthoritySummary(value) {
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

function assertAuthorityBoundary(value) {
  assert.equal(value.implementation_added_now, true);
  assert.equal(value.deterministic_builder_added_now, true);
  assert.equal(value.product_write_lane_parked_by_686, true);
  assert.equal(value.runtime_source_fetch_implemented_now, false);
  assert.equal(value.crawler_implemented_now, false);
  assert.equal(value.provider_extraction_implemented_now, false);
  assert.equal(value.retrieval_rag_implemented_now, false);
  assert.equal(value.source_index_write_now, false);
  assert.equal(value.durable_source_record_write_now, false);
  assert.equal(value.candidate_generation_now, false);
  assert.equal(value.candidate_mutation_now, false);
  assert.equal(value.work_mutation, false);
  assert.equal(value.product_write_authority, false);
  for (const [key, flag] of Object.entries(value)) {
    if (
      key === "implementation_added_now" ||
      key === "contract_followed_now" ||
      key === "fixture_backed_only" ||
      key === "deterministic_builder_added_now" ||
      key === "product_write_lane_parked_by_686"
    ) {
      assert.equal(flag, true, `${key} must be true`);
    } else {
      assert.equal(flag, false, `${key} must be false`);
    }
  }
}

function assertValidationPolicy(value) {
  assert.deepEqual(value, {
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
  });
}

function assertValidation(value) {
  assert.equal(value.passed, true);
  assert.deepEqual(value.failure_codes, []);
  assert.equal(value.generated_bundle_follows_contract, true);
  assert.equal(value.generated_bundle_boundary_matches_contract, true);
  assert.equal(value.generated_bundle_validation_matches_contract, true);
  assert.equal(value.top_level_implementation_boundary_is_separate, true);
  assert.equal(value.allowed_inputs_reference_only, true);
  assert.equal(value.source_fetch_not_implemented, true);
  assert.equal(value.provider_extraction_not_implemented, true);
  assert.equal(value.retrieval_rag_not_implemented, true);
  assert.equal(value.source_index_write_not_implemented, true);
  assert.equal(value.durable_source_record_write_not_implemented, true);
  assert.equal(value.candidate_generation_not_implemented, true);
  assert.equal(value.source_refs_have_operator_context, true);
  assert.equal(value.privacy_policy_preserved, true);
  assert.equal(value.non_authority_policy_preserved, true);
  assert.equal(value.authority_boundary_preserved, true);
  assert.equal(value.deterministic_rebuild_matches_fixture, true);
}

function assertDocsPointers() {
  for (const requiredText of [
    "Bounded External Source Intake implementation v0.1",
    builderPath,
    implementationFixturePath,
    smokePath,
    packageScriptName,
    "deterministic fixture-backed implementation",
    "generated reference-only source intake bundle from #721 contract",
    "allowed source input summary",
    "disallowed source input summary",
    "source reference summary",
    "candidate generation summary",
    "provenance summary",
    "privacy summary",
    "non-authority summary",
    "no runtime source fetch",
    "no crawler behavior",
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
    assert.match(doc, /Bounded External Source Intake implementation v0\.1/i);
    assert.match(doc, /deterministic/i);
    assert.match(doc, /fixture-backed/i);
    assert.match(doc, /reference-only source intake/i);
    assert.match(doc, /not source fetch|no source fetch/i);
    assert.match(doc, /crawler/i);
    assert.match(doc, /provider extraction|providers?/i);
    assert.match(doc, /retrieval\/RAG/i);
    assert.match(doc, /not proof\/evidence/i);
    assert.match(doc, /not Perspective state|durable Perspective promotion/i);
    assert.match(doc, /candidate\/work mutation|candidate mutation|work mutation/i);
    assert.match(doc, /product write/i);
    assert.match(doc, /runtime DB|no runtime DB/i);
    assert.match(doc, new RegExp(nextRecommendedSlice));
  }
}

function assertContractSmokeDownstreamPointer() {
  for (const requiredText of [
    implementationVersion,
    builderPath,
    implementationFixturePath,
    smokePath,
    packageScriptName,
    recommendationStatus,
    nextRecommendedSlice,
    "reference-only source intake bundles",
    "product-write remains parked by #686",
  ]) {
    assert.ok(
      contractSmokeSource.includes(requiredText),
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
    assert.ok(smokeSource.includes(requiredText), `smoke must include portable mergeBaseRef text: ${requiredText}`);
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

function browserValidationSliceActive() {
  return readChangedFiles().includes(browserValidationSmokePath);
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
    packageJson.scripts[browserValidationPackageScriptName],
    browserValidationPackageScriptValue,
  );
  assert.deepEqual(
    addedScriptNames,
    [browserValidationPackageScriptName],
    "package.json must add only the Bounded External Source Intake browser validation smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"\s*:/);
}

function assertBrowserValidationChangedFiles(changedFiles) {
  const expectedFiles = [
    browserValidationFixturePath,
    browserValidationSmokePath,
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
    smokePath,
    contractSmokePath,
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
  for (const unchangedPath of [builderPath, implementationFixturePath]) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      `Bounded External Source Intake browser validation slice must not change ${unchangedPath}`,
    );
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      `unexpected changed file in Bounded External Source Intake browser validation downstream slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /(^|\/)(provider|retrieval|source-fetch)\b/i);
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
  for (const requiredText of [
    browserValidationVersion,
    browserValidationFixturePath,
    browserValidationSmokePath,
    browserValidationPackageScriptName,
    browserValidationRecommendationStatus,
    browserValidationNextRecommendedSlice,
    "reference-only source intake bundle",
    "product-write remains parked by #686",
  ]) {
    assert.ok(
      smokeSource.includes(requiredText),
      `implementation smoke must allow browser validation downstream pointer: ${requiredText}`,
    );
  }
}
