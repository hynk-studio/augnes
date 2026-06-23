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
const smokePath =
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
  "smoke:non-authoritative-retrieval-rag-implementation-v0-1";
const packageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-non-authoritative-retrieval-rag-implementation-v0-1.mjs";
const browserValidationFixturePath =
  "fixtures/research-candidate-review.non-authoritative-retrieval-rag-browser-validation.sample.v0.1.json";
const browserValidationSmokePath =
  "scripts/smoke-non-authoritative-retrieval-rag-browser-validation-v0-1.mjs";
const browserValidationPackageScriptName =
  "smoke:non-authoritative-retrieval-rag-browser-validation-v0-1";
const browserValidationPackageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-non-authoritative-retrieval-rag-browser-validation-v0-1.mjs";
const browserValidationVersion =
  "non_authoritative_retrieval_rag_browser_validation.v0.1";
const browserValidationRecommendationStatus =
  "ready_for_human_reviewed_durable_perspective_promotion_contract_v0_1";
const browserValidationNextRecommendedSlice =
  "human_reviewed_durable_perspective_promotion_contract_v0_1";
const implementationKind = "non_authoritative_retrieval_rag_implementation";
const implementationVersion =
  "non_authoritative_retrieval_rag_implementation.v0.1";
const previewVersion = "non_authoritative_retrieval_rag_preview.v0.1";
const recommendationStatus =
  "ready_for_non_authoritative_retrieval_rag_browser_validation_v0_1";
const nextRecommendedSlice =
  "non_authoritative_retrieval_rag_browser_validation_v0_1";
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
  builderPath,
  implementationFixturePath,
  smokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  contractSmokePath,
  ...downstreamSmokePaths,
];

for (const filePath of [
  builderPath,
  contractTypePath,
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
  assert.ok(
    existsSync(implementationFixturePath),
    `${implementationFixturePath} must exist`,
  );
}

const builderSource = readFile(builderPath);
const smokeSource = readFile(smokePath);
const contractSmokeSource = readFile(contractSmokePath);
const contractTypeSource = readFile(contractTypePath);
const contractFixture = readJson(contractFixturePath);
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

if (writeFixture) {
  writeFileSync(
    implementationFixturePath,
    `${JSON.stringify(rebuiltImplementationFixture, null, 2)}\n`,
  );
  process.exit(0);
}

const fixture = readJson(implementationFixturePath);

assertContractArtifactsUnchanged();
assertBuilderFile();
assertPackageScript();
assertStaticBoundary();
assertNoForbiddenRuntimePatterns();
assert.deepEqual(
  fixture,
  rebuiltImplementationFixture,
  "rebuilt Non-authoritative Retrieval/RAG implementation fixture must match committed fixture",
);
assertImplementationFixture(fixture);
assertBuiltPreviewBundle(fixture.built_preview_bundle);
assertAuthorityBoundary(fixture.authority_boundary);
assertValidation(fixture.validated_implementation);
assertInvalidRetrievalResultOverrideCoverage();
assertInvalidRagContextPreviewOverrideCoverage();
assertInvalidSourceRefsOverrideCoverage();
assertInvalidAuthorityOverrideCoverage();
assertDocsPointers();
assertContractSmokeDownstreamPointer();
assertPortableMergeBaseFallback();

console.log(
  JSON.stringify(
    {
      smoke: "non-authoritative-retrieval-rag-implementation-v0-1",
      final_status: "pass",
      implementation_kind: fixture.implementation_kind,
      implementation_version: fixture.implementation_version,
      source_contract_fingerprint: fixture.source_contract_fingerprint,
      preview_bundle_follows_contract:
        fixture.validated_implementation.preview_bundle_follows_contract,
      all_results_recall_only:
        fixture.validated_implementation.all_results_recall_only,
      all_results_non_authoritative:
        fixture.validated_implementation.all_results_non_authoritative,
      rag_context_preview_not_evidence_or_proof:
        fixture.validated_implementation
          .rag_context_preview_not_evidence_or_proof,
      runtime_retrieval_rag_implemented_now:
        fixture.authority_boundary.runtime_retrieval_rag_implemented_now,
      runtime_index_build_implemented_now:
        fixture.authority_boundary.runtime_index_build_implemented_now,
      runtime_index_write_now: fixture.authority_boundary.runtime_index_write_now,
      embedding_generation_implemented_now:
        fixture.authority_boundary.embedding_generation_implemented_now,
      vector_db_implemented_now:
        fixture.authority_boundary.vector_db_implemented_now,
      fts_implemented_now: fixture.authority_boundary.fts_implemented_now,
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

function assertContractArtifactsUnchanged() {
  assert.deepEqual(
    readJsonFromGit(contractFixturePath),
    contractFixture,
    "#727 contract fixture must not change in implementation slice",
  );
  assert.equal(
    readGitOutput(["show", `${mergeBaseRef()}:${contractTypePath}`]),
    contractTypeSource,
    "#727 type contract must not change in implementation slice",
  );
}

function assertBuilderFile() {
  for (const requiredText of [
    "buildNonAuthoritativeRetrievalRagImplementationFixture",
    "buildNonAuthoritativeRetrievalRagPreviewBundle",
    "validateNonAuthoritativeRetrievalRagPreviewBundle",
    "createNonAuthoritativeRetrievalRagFingerprint",
    implementationKind,
    implementationVersion,
    "source_contract_ref",
    "source_contract_fingerprint",
    "implemented_contract",
    "deterministic_builder",
    "built_preview_bundle",
    "retrieval_result_family_summary",
    "source_reference_summary",
    "validation",
    "authority_boundary",
    "invalid_retrieval_result_override_rejected",
    "invalid_rag_context_preview_override_rejected",
    "invalid_source_refs_override_rejected",
    "invalid_authority_boundary_override_rejected",
    "retrieval_result_unknown_family_kind",
    "retrieval_result_missing_source_refs_or_gap_reason",
    "rag_context_preview_missing_source_refs",
    "source_ref_private_or_unstable_public_safe_ref",
    "runtime_retrieval_rag_enabled",
    "product_id_allocation_enabled",
    "fnv1a32_canonical_json",
  ]) {
    assert.ok(builderSource.includes(requiredText), `${builderPath} must include ${requiredText}`);
  }
  for (const exportedHelper of [
    "buildNonAuthoritativeRetrievalRagImplementationFixture",
    "buildNonAuthoritativeRetrievalRagPreviewBundle",
    "validateNonAuthoritativeRetrievalRagPreviewBundle",
    "createNonAuthoritativeRetrievalRagFingerprint",
  ]) {
    assert.match(
      builderSource,
      new RegExp(`export function ${exportedHelper}\\b`),
      `${builderPath} must export ${exportedHelper}`,
    );
  }
}

function assertPackageScript() {
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
  if (browserValidationSliceActive()) {
    assertBrowserValidationPackageScript();
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
    "package.json must add only the Non-authoritative Retrieval/RAG implementation smoke script",
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
  if (browserValidationSliceActive()) {
    assertBrowserValidationChangedFiles(changedFiles);
    return;
  }
  for (const unchangedPath of [
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
      `Non-authoritative Retrieval/RAG implementation slice must not change ${unchangedPath}`,
    );
  }
  for (const expectedFile of expectedChangedFiles) {
    assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedChangedFiles.includes(changedFile),
      `unexpected changed file in Non-authoritative Retrieval/RAG implementation slice: ${changedFile}`,
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

function browserValidationSliceActive() {
  return (
    !humanReviewedDurablePerspectivePromotionContractSliceActive() &&
    readChangedFiles().includes(browserValidationSmokePath)
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
    ...(typeof downstreamSmokePaths === "undefined" ? [] : downstreamSmokePaths),
  ];
  for (const unchangedPath of [
    "fixtures/research-candidate-review.non-authoritative-retrieval-rag-browser-validation.sample.v0.1.json",
    "lib/research-candidate-review/non-authoritative-retrieval-rag.ts",
    implementationFixturePath,
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
    ...(typeof downstreamSmokePaths === "undefined" ? [] : downstreamSmokePaths),
  ];
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
  for (const expectedFile of [
    browserValidationFixturePath,
    browserValidationSmokePath,
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
      `unexpected changed file in Non-authoritative Retrieval/RAG browser validation downstream slice: ${changedFile}`,
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
    browserValidationVersion,
    browserValidationFixturePath,
    browserValidationSmokePath,
    browserValidationPackageScriptName,
    browserValidationRecommendationStatus,
    browserValidationNextRecommendedSlice,
    "validates deterministic fixture-backed implementation from #728",
    "retrieval result is recall, not authority",
    "RAG answer is context preview, not evidence/proof",
    "product-write remains parked by #686",
  ]) {
    assert.ok(
      smokeSource.includes(requiredText),
      `#728 implementation smoke must allow browser validation downstream pointer: ${requiredText}`,
    );
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

function assertImplementationFixture(implementation) {
  assert.equal(implementation.implementation_kind, implementationKind);
  assert.equal(implementation.implementation_version, implementationVersion);
  assert.equal(
    implementation.source_contract_ref,
    `${contractFixture.contract_version}:${contractFixturePath}`,
  );
  assert.equal(
    implementation.source_contract_fingerprint,
    contractFixture.contract_fingerprint,
  );
  assert.equal(
    implementation.implemented_contract.contract_fixture_path,
    contractFixturePath,
  );
  assert.equal(
    implementation.implemented_contract.type_contract_path,
    contractTypePath,
  );
  assert.equal(
    implementation.implemented_contract.contract_authority_boundary_preserved,
    true,
  );
  assert.equal(
    implementation.implemented_contract.contract_validation_policy_preserved,
    true,
  );
  assert.equal(
    implementation.implemented_contract.contract_non_authority_policy_preserved,
    true,
  );
  assert.equal(implementation.deterministic_builder.builder_path, builderPath);
  for (const [key, value] of Object.entries(implementation.deterministic_builder)) {
    if (key === "builder_path" || key === "deterministic_fixture_backed_only") {
      continue;
    }
    assert.equal(value, false, `deterministic_builder.${key} must be false`);
  }
  assert.equal(implementation.recommendation_status, recommendationStatus);
  assert.equal(implementation.next_recommended_slice, nextRecommendedSlice);
  assert.equal(implementation.fingerprint_algorithm, "fnv1a32_canonical_json");
  assert.equal(
    implementation.implementation_fingerprint,
    createNonAuthoritativeRetrievalRagFingerprint(implementation),
  );
}

function assertBuiltPreviewBundle(bundle) {
  const sample = contractFixture.sample_retrieval_rag_contract_preview;
  assert.equal(bundle.preview_version, previewVersion);
  assert.equal(
    bundle.source_contract_ref,
    `${contractFixture.contract_version}:${contractFixturePath}`,
  );
  assert.equal(bundle.operator_context_ref, sample.operator_context_ref);
  assert.deepEqual(bundle.source_refs, sample.source_refs);
  assert.deepEqual(bundle.retrieval_results, sample.retrieval_results);
  assert.deepEqual(bundle.rag_context_preview, sample.rag_context_preview);
  assert.deepEqual(bundle.authority_boundary, sample.authority_boundary);
  assert.deepEqual(bundle.validation_policy, contractFixture.validation_policy);
  assert.deepEqual(bundle.non_authority_policy, contractFixture.non_authority_policy);
  assert.equal(Object.hasOwn(bundle.authority_boundary, "implementation_added_now"), false);
  assert.equal(Object.hasOwn(bundle.authority_boundary, "deterministic_builder_added_now"), false);
  assert.equal(bundle.retrieval_result_family_summary.family_count, contractFixture.retrieval_result_families.length);
  assert.deepEqual(
    bundle.retrieval_result_family_summary.family_kinds,
    contractFixture.retrieval_result_families.map((family) => family.family_kind),
  );
  assert.equal(bundle.source_reference_summary.public_safe_source_refs_only, true);
  assert.equal(bundle.source_reference_summary.no_raw_private_source_body, true);
  assert.equal(bundle.source_reference_summary.no_raw_provider_thread_run_session_ids, true);
  assert.equal(bundle.source_reference_summary.no_private_urls, true);
  assert.equal(bundle.source_reference_summary.no_secrets, true);
  assert.equal(bundle.validation.passed, true);
  assert.equal(bundle.validation.preview_bundle_follows_contract, true);
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
        `${result.family_kind} must be source-ref-backed or record-ref-backed`,
      );
    }
  }
  assert.equal(bundle.rag_context_preview.source_refs.length > 0, true);
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

function assertAuthorityBoundary(boundary) {
  assert.equal(boundary.implementation_added_now, true);
  assert.equal(boundary.deterministic_builder_added_now, true);
  assert.equal(boundary.product_write_lane_parked_by_686, true);
  for (const [key, value] of Object.entries(boundary)) {
    if (
      key === "implementation_added_now" ||
      key === "deterministic_builder_added_now" ||
      key === "product_write_lane_parked_by_686"
    ) {
      assert.equal(value, true, `${key} must be true`);
    } else {
      assert.equal(value, false, `${key} must be false`);
    }
  }
}

function assertValidation(validation) {
  assert.equal(validation.passed, true);
  assert.deepEqual(validation.failure_codes, []);
  for (const [key, value] of Object.entries(validation)) {
    if (key === "passed") {
      assert.equal(value, true);
    } else if (key === "failure_codes") {
      assert.deepEqual(value, []);
    } else {
      assert.equal(value, true, `validated_implementation.${key} must be true`);
    }
  }
}

function assertInvalidRetrievalResultOverrideCoverage() {
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
  for (const [expectedCode, override] of cases) {
    const retrievalResults = clone(
      contractFixture.sample_retrieval_rag_contract_preview.retrieval_results,
    );
    retrievalResults[0] = { ...retrievalResults[0], ...override };
    const validation = buildNonAuthoritativeRetrievalRagPreviewBundle({
      contract: contractFixture,
      retrieval_results: retrievalResults,
    }).validation;
    assert.equal(validation.passed, false);
    assert.ok(
      validation.failure_codes.includes(expectedCode),
      `invalid retrieval result override must fail with ${expectedCode}`,
    );
  }
}

function assertInvalidRagContextPreviewOverrideCoverage() {
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
    assert.ok(
      validation.failure_codes.includes(expectedCode),
      `invalid RAG context preview override must fail with ${expectedCode}`,
    );
  }
}

function assertInvalidSourceRefsOverrideCoverage() {
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
    assert.ok(
      validation.failure_codes.includes(expectedCode),
      `invalid source_refs override must fail with ${expectedCode}`,
    );
  }
}

function assertInvalidAuthorityOverrideCoverage() {
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
  for (const [expectedCode, fieldName] of cases) {
    const implementation = buildNonAuthoritativeRetrievalRagImplementationFixture({
      non_authoritative_retrieval_rag_contract: contractFixture,
      source_contract_ref: `${contractFixture.contract_version}:${contractFixturePath}`,
      authority_boundary_overrides: { [fieldName]: true },
    });
    assert.equal(implementation.validated_implementation.passed, false);
    assert.ok(
      implementation.validated_implementation.failure_codes.includes(expectedCode),
      `invalid authority override must fail with ${expectedCode}`,
    );
  }
}

function assertDocsPointers() {
  for (const requiredText of [
    "Non-authoritative Retrieval/RAG implementation v0.1",
    builderPath,
    implementationFixturePath,
    smokePath,
    "deterministic fixture-backed implementation only",
    "validates and materializes #727 contract preview bundle",
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
    "Non-authoritative Retrieval/RAG implementation is deterministic fixture-backed only.",
    "It materializes recall/context preview bundles from #727 contract.",
    "It is not runtime retrieval/RAG, source fetch, provider extraction, index build/write, embedding generation, vector DB, FTS, proof/evidence, Perspective state, work status, promotion authority, salience authority, candidate/work mutation, or product write.",
    "Next recommended slice is Non-authoritative Retrieval/RAG browser validation v0.1.",
  ]) {
    assert.ok(substrateDoc.includes(requiredText), `substrate doc must include ${requiredText}`);
  }
  for (const requiredText of [
    "Non-authoritative Retrieval/RAG implementation remains separated from durable Perspective promotion.",
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

function assertContractSmokeDownstreamPointer() {
  for (const requiredText of [
    implementationVersion,
    builderPath,
    implementationFixturePath,
    smokePath,
    packageScriptName,
    recommendationStatus,
    nextRecommendedSlice,
    "deterministic fixture-backed implementation only",
    "retrieval result is recall, not authority",
    "RAG answer is context preview, not evidence/proof",
    "product-write remains parked by #686",
  ]) {
    assert.ok(
      contractSmokeSource.includes(requiredText),
      `#727 contract smoke must allow Non-authoritative Retrieval/RAG implementation downstream pointer: ${requiredText}`,
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

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
