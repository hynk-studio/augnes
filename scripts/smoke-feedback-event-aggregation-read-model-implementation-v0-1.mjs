import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const builderPath =
  "lib/research-candidate-review/feedback-event-aggregation-read-model.ts";
const fixturePath =
  "fixtures/research-candidate-review.feedback-event-aggregation-read-model-implementation.sample.v0.1.json";
const smokePath =
  "scripts/smoke-feedback-event-aggregation-read-model-implementation-v0-1.mjs";
const browserValidationFixturePath =
  "fixtures/research-candidate-review.feedback-event-aggregation-read-model-browser-validation.sample.v0.1.json";
const browserValidationSmokePath =
  "scripts/smoke-feedback-event-aggregation-read-model-browser-validation-v0-1.mjs";
const formationReceiptDurableEventContractTypePath =
  "types/formation-receipt-durable-event-contract.ts";
const formationReceiptDurableEventContractFixturePath =
  "fixtures/research-candidate-review.formation-receipt-durable-event-contract.sample.v0.1.json";
const formationReceiptDurableEventContractSmokePath =
  "scripts/smoke-formation-receipt-durable-event-contract-v0-1.mjs";
const contractFixturePath =
  "fixtures/research-candidate-review.feedback-event-aggregation-read-model-contract.sample.v0.1.json";
const contractSmokePath =
  "scripts/smoke-feedback-event-aggregation-read-model-contract-v0-1.mjs";
const listUiBrowserValidationSmokePath =
  "scripts/smoke-feedback-event-store-list-ui-browser-validation-v0-1.mjs";
const listUiImplementationSmokePath =
  "scripts/smoke-feedback-event-store-list-ui-implementation-v0-1.mjs";
const listUiContractSmokePath =
  "scripts/smoke-feedback-event-store-list-ui-contract-v0-1.mjs";
const listRouteBrowserValidationSmokePath =
  "scripts/smoke-feedback-event-store-list-route-browser-validation-v0-1.mjs";
const listRouteImplementationSmokePath =
  "scripts/smoke-feedback-event-store-list-route-implementation-v0-1.mjs";
const listRouteContractSmokePath =
  "scripts/smoke-feedback-event-store-list-route-contract-v0-1.mjs";
const controlsUiBrowserValidationSmokePath =
  "scripts/smoke-feedback-event-controls-ui-browser-validation-v0-1.mjs";
const controlsUiImplementationSmokePath =
  "scripts/smoke-feedback-event-controls-ui-implementation-v0-1.mjs";
const controlsUiContractSmokePath =
  "scripts/smoke-feedback-event-controls-ui-contract-v0-1.mjs";
const writeRouteBrowserValidationSmokePath =
  "scripts/smoke-feedback-event-write-route-browser-validation-v0-1.mjs";
const writeRouteImplementationSmokePath =
  "scripts/smoke-feedback-event-write-route-implementation-v0-1.mjs";
const writeRouteContractSmokePath =
  "scripts/smoke-feedback-event-write-route-contract-v0-1.mjs";
const reviewControlsSmokePath =
  "scripts/smoke-feedback-event-store-review-controls-preview-v0-1.mjs";
const feedbackEventStoreMinimalSmokePath =
  "scripts/smoke-feedback-event-store-minimal-v0-1.mjs";
const feedbackStoreFixturePath =
  "fixtures/research-candidate-review.feedback-event-store.sample.v0.1.json";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const substrateDocPath = "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md";
const surfaceDocPath = "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md";
const gateDocPath =
  "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md";

const packageScriptName =
  "smoke:feedback-event-aggregation-read-model-implementation-v0-1";
const packageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-feedback-event-aggregation-read-model-implementation-v0-1.mjs";
const browserValidationPackageScriptName =
  "smoke:feedback-event-aggregation-read-model-browser-validation-v0-1";
const browserValidationPackageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-feedback-event-aggregation-read-model-browser-validation-v0-1.mjs";
const formationReceiptDurableEventContractPackageScriptName =
  "smoke:formation-receipt-durable-event-contract-v0-1";
const formationReceiptDurableEventContractPackageScriptValue =
  "node scripts/smoke-formation-receipt-durable-event-contract-v0-1.mjs";
const formationReceiptDurableEventImplementationPackageScriptName =
  "smoke:formation-receipt-durable-event-implementation-v0-1";
const formationReceiptDurableEventImplementationPackageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-formation-receipt-durable-event-implementation-v0-1.mjs";
const implementationKind = "feedback_event_aggregation_read_model_implementation";
const implementationVersion =
  "feedback_event_aggregation_read_model_implementation.v0.1";
const browserValidationVersion =
  "feedback_event_aggregation_read_model_browser_validation.v0.1";
const recommendationStatus =
  "ready_for_feedback_event_aggregation_read_model_browser_validation_v0_1";
const nextRecommendedSlice =
  "feedback_event_aggregation_read_model_browser_validation_v0_1";
const browserValidationRecommendationStatus =
  "ready_for_formation_receipt_durable_event_contract_v0_1";
const browserValidationNextRecommendedSlice =
  "formation_receipt_durable_event_contract_v0_1";
const contractNextRecommendedSlice =
  "feedback_event_aggregation_read_model_implementation_v0_1";
const writeFixture = process.argv.includes("--write-fixture");

const expectedViewIds = [
  "feedback_event_counts_by_event_type",
  "feedback_event_counts_by_target_kind",
  "feedback_event_counts_by_target",
  "duplicate_feedback_groups",
  "recent_feedback_event_window_preview",
  "pinned_or_dismissed_target_summary",
  "operator_note_presence_summary",
  "source_ref_feedback_summary",
  "authority_boundary_summary",
];

const expectedChangedFiles = [
  builderPath,
  fixturePath,
  smokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  contractSmokePath,
  listUiBrowserValidationSmokePath,
  listUiImplementationSmokePath,
  listUiContractSmokePath,
  listRouteBrowserValidationSmokePath,
  listRouteImplementationSmokePath,
  listRouteContractSmokePath,
  controlsUiBrowserValidationSmokePath,
  controlsUiImplementationSmokePath,
  controlsUiContractSmokePath,
  writeRouteBrowserValidationSmokePath,
  writeRouteImplementationSmokePath,
  writeRouteContractSmokePath,
  reviewControlsSmokePath,
  feedbackEventStoreMinimalSmokePath,
];
const browserValidationChangedFiles = [
  "fixtures/research-candidate-review.feedback-event-aggregation-read-model-browser-validation.sample.v0.1.json",
  "scripts/smoke-feedback-event-aggregation-read-model-browser-validation-v0-1.mjs",
  "package.json",
  "docs/00_INDEX_LATEST.md",
  "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
  "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
  "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
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
const formationReceiptDurableEventContractChangedFiles = [
  "types/formation-receipt-durable-event-contract.ts",
  "fixtures/research-candidate-review.formation-receipt-durable-event-contract.sample.v0.1.json",
  "scripts/smoke-formation-receipt-durable-event-contract-v0-1.mjs",
  "package.json",
  "docs/00_INDEX_LATEST.md",
  "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
  "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
  "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
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
const formationReceiptDurableEventImplementationChangedFiles = [
  "lib/research-candidate-review/formation-receipt-durable-event.ts",
  "fixtures/research-candidate-review.formation-receipt-durable-event-implementation.sample.v0.1.json",
  "scripts/smoke-formation-receipt-durable-event-implementation-v0-1.mjs",
  "package.json",
  "docs/00_INDEX_LATEST.md",
  "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
  "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
  "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
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
  smokePath,
  contractFixturePath,
  contractSmokePath,
  feedbackStoreFixturePath,
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
const smokeSource = readFile(smokePath);
const contractSmokeSource = readFile(contractSmokePath);
const packageJson = readJson(packagePath);
const basePackageJson = readJsonFromGit(packagePath);
const contractFixture = readJson(contractFixturePath);
const feedbackStoreFixture = readJson(feedbackStoreFixturePath);
const indexDoc = readFile(indexPath);
const substrateDoc = readFile(substrateDocPath);
const surfaceDoc = readFile(surfaceDocPath);
const gateDoc = readFile(gateDocPath);

const { buildFeedbackEventAggregationReadModelImplementation } = await import(
  "../lib/research-candidate-review/feedback-event-aggregation-read-model.ts"
);

const rebuiltFixture = buildImplementationFixture();

if (writeFixture) {
  writeFileSync(fixturePath, `${JSON.stringify(rebuiltFixture, null, 2)}\n`);
  process.exit(0);
}

const implementationFixture = readJson(fixturePath);

assertBuilderShape();
assertPackageScript();
assertStaticBoundary();
assertNoForbiddenRuntimePatterns();
assertImplementationFixture(implementationFixture);
assertReadModelViews(implementationFixture);
assertImplementationViewsHonorPolicies(implementationFixture, contractFixture);
assertSyntheticPolicyApplication();
assertDuplicateFeedbackSummary(implementationFixture.duplicate_feedback_summary);
assertRecentFeedbackEventWindowPreview(
  implementationFixture.recent_feedback_event_window_preview,
);
assertAuthorityBoundary(implementationFixture.authority_boundary);
assertValidationPolicy(implementationFixture.validation_policy);
assertDocsPointers();
assertContractSmokeDownstreamPointer();
assertBrowserValidationDownstreamPointer();
assert.deepEqual(
  implementationFixture,
  rebuiltFixture,
  "rebuilt feedback event aggregation read model implementation fixture must match committed fixture",
);

console.log(
  JSON.stringify(
    {
      smoke: "feedback-event-aggregation-read-model-implementation-v0-1",
      final_status: "pass",
      implementation_kind: implementationFixture.implementation_kind,
      implementation_version: implementationFixture.implementation_version,
      implemented_view_count: implementationFixture.read_model_views.length,
      fixture_backed_only: implementationFixture.authority_boundary.fixture_backed_only,
      runtime_db_query_now: implementationFixture.authority_boundary.runtime_db_query_now,
      browser_request_now: implementationFixture.authority_boundary.browser_request_now,
      salience_authority: implementationFixture.authority_boundary.salience_authority,
      product_write_lane_parked_by_686:
        implementationFixture.authority_boundary.product_write_lane_parked_by_686,
      next_recommended_slice: implementationFixture.next_recommended_slice,
    },
    null,
    2,
  ),
);

function buildImplementationFixture() {
  return buildFeedbackEventAggregationReadModelImplementation({
    feedback_events: feedbackStoreFixture.events,
    aggregation_read_model_contract: contractFixture,
    source_contract_ref: `${contractFixture.contract_version}:${contractFixturePath}`,
    source_feedback_event_store_ref: `${feedbackStoreFixture.fixture_version}:${feedbackStoreFixturePath}`,
  });
}

function assertBuilderShape() {
  for (const requiredText of [
    "buildFeedbackEventAggregationReadModelImplementation",
    "feedback_event_aggregation_read_model_implementation",
    "feedback_event_aggregation_read_model_implementation.v0.1",
    "source_contract_ref",
    "source_contract_fingerprint",
    "source_feedback_event_store_ref",
    "read_model_views",
    "duplicate_feedback_summary",
    "recent_feedback_event_window_preview",
    "authority_boundary",
    "validation_policy",
    "recommendation_status",
    "next_recommended_slice",
    "implementation_fingerprint",
    "fingerprint_algorithm",
  ]) {
    assert.ok(builderSource.includes(requiredText), `${builderPath} must include ${requiredText}`);
  }
}

function assertPackageScript() {
  assert.equal(packageJson.scripts[packageScriptName], packageScriptValue);
  const addedScripts = Object.keys(packageJson.scripts)
    .filter((scriptName) => !basePackageJson.scripts[scriptName])
    .sort();
  if (formationReceiptDurableEventImplementationSliceActive()) {
    assert.equal(
      packageJson.scripts[formationReceiptDurableEventImplementationPackageScriptName],
      formationReceiptDurableEventImplementationPackageScriptValue,
    );
    assert.deepEqual(
      addedScripts,
      [formationReceiptDurableEventImplementationPackageScriptName],
      "package.json must add only the Formation Receipt durable event implementation smoke script",
    );
    assert.deepEqual(packageJson.dependencies, basePackageJson.dependencies);
    assert.deepEqual(packageJson.devDependencies, basePackageJson.devDependencies);
    assert.deepEqual(
      packageJson.optionalDependencies ?? {},
      basePackageJson.optionalDependencies ?? {},
    );
    return;
  }
  if (formationReceiptDurableEventContractSliceActive()) {
    assert.equal(
      packageJson.scripts[formationReceiptDurableEventContractPackageScriptName],
      formationReceiptDurableEventContractPackageScriptValue,
    );
  } else if (browserValidationSliceActive()) {
    assert.equal(
      packageJson.scripts[browserValidationPackageScriptName],
      browserValidationPackageScriptValue,
    );
  }
  if (formationReceiptDurableEventContractSliceActive()) {
    assert.equal(
      packageJson.scripts[formationReceiptDurableEventContractPackageScriptName],
      formationReceiptDurableEventContractPackageScriptValue,
    );
    assert.deepEqual(
      addedScripts,
      [formationReceiptDurableEventContractPackageScriptName],
      "package.json must add only the Formation Receipt durable event contract smoke script",
    );
    assert.deepEqual(packageJson.dependencies, basePackageJson.dependencies);
    assert.deepEqual(packageJson.devDependencies, basePackageJson.devDependencies);
    assert.deepEqual(
      packageJson.optionalDependencies ?? {},
      basePackageJson.optionalDependencies ?? {},
    );
    return;
  }
  assert.deepEqual(
    addedScripts,
    formationReceiptDurableEventContractSliceActive()
      ? [formationReceiptDurableEventContractPackageScriptName]
      : browserValidationSliceActive()
      ? [browserValidationPackageScriptName]
      : [packageScriptName],
    "package.json must add only the active aggregation read model smoke script",
  );
  assert.deepEqual(
    packageJson.dependencies,
    basePackageJson.dependencies,
    "package dependencies must not change",
  );
  assert.deepEqual(
    packageJson.devDependencies,
    basePackageJson.devDependencies,
    "package devDependencies must not change",
  );
  assert.deepEqual(
    packageJson.optionalDependencies ?? {},
    basePackageJson.optionalDependencies ?? {},
    "package optionalDependencies must not change",
  );
}

function assertStaticBoundary() {
  const changedFiles = readChangedFiles();
  if (formationReceiptDurableEventImplementationSliceActive()) {
    for (const expectedFile of formationReceiptDurableEventImplementationChangedFiles) {
      assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
    }
    for (const changedFile of changedFiles) {
      assert.ok(
        formationReceiptDurableEventImplementationChangedFiles.includes(changedFile),
        `unexpected changed file in Formation Receipt durable event implementation downstream slice: ${changedFile}`,
      );
      assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
      assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
      assert.doesNotMatch(changedFile, /^components\//, "must not change components");
      assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
      assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
      assert.doesNotMatch(changedFile, /(^|\/)(provider|retrieval|source-fetch)\b/i);
      assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
    }
    return;
  }

  if (formationReceiptDurableEventContractSliceActive()) {
    for (const expectedFile of formationReceiptDurableEventContractChangedFiles) {
      assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
    }
    for (const changedFile of changedFiles) {
      assert.ok(
        formationReceiptDurableEventContractChangedFiles.includes(changedFile),
        `unexpected changed file in Formation Receipt durable event contract downstream slice: ${changedFile}`,
      );
      assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
      assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
      assert.doesNotMatch(changedFile, /^components\//, "must not change components");
      assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
      assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
      assert.doesNotMatch(changedFile, /(^|\/)(provider|retrieval|source-fetch)\b/i);
      assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
    }
    return;
  }
  const activeExpectedChangedFiles = formationReceiptDurableEventContractSliceActive()
    ? formationReceiptDurableEventContractChangedFiles
    : browserValidationSliceActive()
    ? browserValidationChangedFiles
    : expectedChangedFiles;
  for (const expectedFile of activeExpectedChangedFiles) {
    assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      activeExpectedChangedFiles.includes(changedFile),
      `unexpected changed file in aggregation read model implementation slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /(^|\/)(provider|retrieval|source-fetch)\b/i);
    if (
      changedFile !==
      "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs"
    ) {
      assert.doesNotMatch(
        changedFile,
        /product.*write/i,
        "must not change product write files",
      );
    }
  }
}

function assertNoForbiddenRuntimePatterns() {
  assert.doesNotMatch(smokeSource, /\bnext\s+(dev|start)\b/i);
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
      { label: "polling", regex: /\bsetInterval\b|\bsetTimeout\b/ },
      { label: "DB open", regex: /\bnew\s+Database\b|\bopenDatabase\b|better-sqlite3/i },
      { label: "runtime SQL", regex: /\bdb\.(prepare|query|exec)\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b/ },
      { label: "feedback write", regex: /\bwriteFeedbackEvent\b|\binsertFeedbackEvent\b|\bmutateFeedbackEvent\b/ },
      { label: "OpenAI import", regex: /from\s+["'][^"']*openai["']/i },
      { label: "OpenAI constructor", regex: /new\s+OpenAI\b/i },
      { label: "source fetch call", regex: /\bfetchSource\b|\bsourceFetch\b/ },
      { label: "retrieval execution", regex: /\brunRetrieval\b|\brunRag\b|\brunRAG\b/ },
      { label: "embedding/vector/FTS implementation", regex: /\bcreateEmbedding\b|\bvectorIndex\b|\bFTS5\b/i },
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
      { label: "salience score", regex: /\bsalience_score\b|\bsalienceScore\b/ },
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
    value.source_feedback_event_store_ref,
    `${feedbackStoreFixture.fixture_version}:${feedbackStoreFixturePath}`,
  );
  assert.equal(value.recommendation_status, recommendationStatus);
  assert.equal(value.next_recommended_slice, nextRecommendedSlice);
  assert.equal(value.fingerprint_algorithm, "fnv1a32_canonical_json");
  assert.match(value.implementation_fingerprint, /^fnv1a32:[0-9a-f]{8}$/);
  assert.deepEqual(value.validation, {
    passed: true,
    failure_codes: [],
    implemented_view_count: expectedViewIds.length,
    contract_view_count: contractFixture.read_model_views.length,
    fixture_event_count: feedbackStoreFixture.events.length,
    recent_window_rows_match_created_at_days: true,
  });
}

function assertReadModelViews(value) {
  assert.deepEqual(
    value.read_model_views.map((viewValue) => viewValue.view_id),
    expectedViewIds,
  );
  for (const contractView of contractFixture.read_model_views) {
    const implementationView = value.read_model_views.find(
      (candidate) => candidate.view_id === contractView.view_id,
    );
    assert.ok(implementationView, `${contractView.view_id} must be implemented`);
    assert.equal(implementationView.view_version, contractView.view_version);
    assert.equal(
      implementationView.source_contract_view_version,
      contractView.view_version,
    );
    assert.deepEqual(implementationView.grouping_keys, contractView.grouping_keys);
    assert.deepEqual(implementationView.output_fields, contractView.output_fields);
    assert.equal(implementationView.row_count, implementationView.rows.length);
    assert.deepEqual(
      implementationView.rows,
      contractView.sample_grouped_outputs,
      `${contractView.view_id} implementation rows must match contract fixture sample outputs`,
    );
    assert.deepEqual(implementationView.authority_boundary, contractView.authority_boundary);
    assert.equal(implementationView.authority_boundary.read_model_only, true);
    assert.equal(implementationView.authority_boundary.not_source_of_truth, true);
    assert.equal(implementationView.authority_boundary.not_proof_or_evidence, true);
    assert.equal(implementationView.authority_boundary.not_perspective_state, true);
    assert.equal(implementationView.authority_boundary.not_work_status, true);
    assert.equal(implementationView.authority_boundary.not_promotion_decision, true);
    assert.equal(implementationView.authority_boundary.not_retrieval_rag_result, true);
    assert.equal(implementationView.authority_boundary.not_product_write, true);
  }
}

function assertImplementationViewsHonorPolicies(implementation, contract) {
  for (const contractView of contract.read_model_views) {
    const implementationView = implementation.read_model_views.find(
      (candidate) => candidate.view_id === contractView.view_id,
    );
    assert.ok(implementationView, `${contractView.view_id} must be implemented`);
    assert.equal(
      implementationView.row_count,
      implementationView.rows.length,
      `${contractView.view_id} row_count must match final sorted/limited rows`,
    );
    const limit = appliedLimit(contractView.limit_policy);
    if (typeof limit === "number") {
      assert.ok(
        implementationView.row_count <= limit,
        `${contractView.view_id} row_count must be <= applied limit`,
      );
    }
    assertRowsSortedByPolicy(
      implementationView.rows,
      contractView.sort_policy,
      contractView.view_id,
    );
  }
}

function assertRowsSortedByPolicy(rows, sortPolicy, viewId) {
  for (let index = 1; index < rows.length; index += 1) {
    assert.ok(
      compareRowsBySortPolicy(sortPolicy, rows[index - 1], rows[index]) <= 0,
      `${viewId} rows must be sorted by contract sort_policy`,
    );
  }
}

function assertSyntheticPolicyApplication() {
  const syntheticContract = cloneJson(contractFixture);
  const targetKindView = syntheticContract.read_model_views.find(
    (view) => view.view_id === "feedback_event_counts_by_target_kind",
  );
  assert.ok(targetKindView, "synthetic contract must include target-kind count view");
  targetKindView.limit_policy = {
    ...targetKindView.limit_policy,
    default_limit: 2,
    max_limit: 2,
  };

  const syntheticImplementation = buildFeedbackEventAggregationReadModelImplementation({
    feedback_events: buildSyntheticFeedbackEvents(),
    aggregation_read_model_contract: syntheticContract,
    source_contract_ref: "synthetic:feedback_event_aggregation_read_model_contract.v0.1",
    source_feedback_event_store_ref: "synthetic:feedback_event_store.v0.1",
  });

  assertImplementationViewsHonorPolicies(syntheticImplementation, syntheticContract);

  const targetKindImplementationView = syntheticImplementation.read_model_views.find(
    (view) => view.view_id === "feedback_event_counts_by_target_kind",
  );
  assert.ok(targetKindImplementationView, "synthetic target-kind view must be implemented");
  assert.equal(targetKindImplementationView.row_count, 2);
  assert.deepEqual(
    targetKindImplementationView.rows.map((row) => row.event_count),
    [2, 2],
    "event_count DESC must keep higher counts first",
  );
  assert.deepEqual(
    targetKindImplementationView.rows.map((row) => row.target_kind),
    [
      "agent_perspective_substrate_folded_section",
      "agent_perspective_substrate_surfacing_card",
    ],
    "secondary target_kind ASC ordering must break equal event_count ties",
  );

  const recentImplementationView = syntheticImplementation.read_model_views.find(
    (view) => view.view_id === "recent_feedback_event_window_preview",
  );
  assert.ok(recentImplementationView, "synthetic recent window view must be implemented");
  assert.deepEqual(
    recentImplementationView.rows.map((row) => row.created_at_day),
    ["2026-06-24", "2026-06-23", "2026-06-22"],
    "created_at_day DESC must order the recent window preview",
  );
  assert.equal(
    recentImplementationView.row_count,
    recentImplementationView.rows.length,
    "recent window row_count must reflect final rows",
  );
}

function assertDuplicateFeedbackSummary(value) {
  assert.deepEqual(value.duplicate_detection_keys, [
    "event_type",
    "target_kind",
    "target_id",
  ]);
  assert.equal(value.idempotency_key_duplicates_grouped_separately, true);
  assert.equal(value.display_read_model_indicators_only, true);
  assert.ok(Array.isArray(value.duplicate_groups) && value.duplicate_groups.length >= 1);
  assert.ok(
    Array.isArray(value.idempotency_key_duplicate_groups) &&
      value.idempotency_key_duplicate_groups.length >= 1,
  );
  for (const group of [...value.duplicate_groups, ...value.idempotency_key_duplicate_groups]) {
    assert.equal(group.display_indicator_only, true);
    assert.equal(group.mutates_feedback_events, false);
  }
  for (const falseField of [
    "delete_feedback_events",
    "rewrite_feedback_events",
    "suppress_feedback_events",
    "mutate_feedback_events",
    "decides_promotion",
    "decides_proof_or_evidence",
    "decides_work_status",
    "decides_product_write",
  ]) {
    assert.equal(value[falseField], false, `duplicate summary ${falseField} must be false`);
  }
}

function assertRecentFeedbackEventWindowPreview(value) {
  assert.deepEqual(value.grouping_keys, ["created_at_day"]);
  assert.deepEqual(value.output_fields, [
    "created_at_day",
    "event_count",
    "event_ids",
    "event_types",
    "target_kinds",
    "target_ids",
    "latest_created_at",
    "read_model_only",
  ]);
  assert.equal(value.read_model_only, true);
  assert.equal(value.not_source_of_truth, true);
  const uniqueCreatedAtDays = uniqueSorted(
    feedbackStoreFixture.events.map((event) => String(event.created_at).slice(0, 10)),
  );
  assert.equal(
    value.rows.length,
    uniqueCreatedAtDays.length,
    "recent feedback event window preview must have one row per created_at_day",
  );
  for (const row of value.rows) {
    for (const requiredField of value.output_fields) {
      assert.ok(Object.hasOwn(row, requiredField), `recent row must include ${requiredField}`);
    }
    assert.equal(row.read_model_only, true);
    assert.ok(Array.isArray(row.event_ids) && row.event_ids.length === row.event_count);
    assert.ok(Array.isArray(row.event_types) && row.event_types.length >= 1);
    assert.ok(Array.isArray(row.target_kinds) && row.target_kinds.length >= 1);
    assert.ok(Array.isArray(row.target_ids) && row.target_ids.length >= 1);
    for (const forbiddenStandaloneField of [
      "event_id",
      "event_type",
      "target_kind",
      "target_id",
      "created_at",
    ]) {
      assert.ok(
        !Object.hasOwn(row, forbiddenStandaloneField),
        `recent row must not include standalone ${forbiddenStandaloneField}`,
      );
    }
  }
}

function assertAuthorityBoundary(value) {
  assert.deepEqual(value, {
    implementation_added_now: true,
    contract_followed_now: true,
    fixture_backed_only: true,
    runtime_read_model_implemented_now: false,
    runtime_db_query_now: false,
    production_db_used_now: false,
    route_changed_now: false,
    component_changed_now: false,
    browser_request_now: false,
    feedback_events_read_from_fixture_now: true,
    feedback_events_read_from_runtime_db_now: false,
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
  });
}

function assertValidationPolicy(value) {
  assert.deepEqual(value, {
    static_source_validation_only: true,
    fixture_backed_only: true,
    app_server_started_now: false,
    production_db_used_now: false,
    runtime_browser_request_now: false,
    runtime_db_query_now: false,
  });
}

function assertDocsPointers() {
  for (const requiredText of [
    "Feedback Event aggregation read model implementation v0.1",
    builderPath,
    fixturePath,
    smokePath,
    packageScriptName,
    "deterministic fixture-backed implementation",
    "no runtime DB query",
    "no route or UI",
    "no browser request",
    "no feedback write/mutation",
    "no proof/evidence/Perspective promotion/work mutation",
    "no provider/OpenAI/source-fetch/retrieval/RAG execution",
    "no salience authority",
    "no product write/product IDs",
    "product-write remains parked by #686",
    nextRecommendedSlice,
  ]) {
    assert.ok(indexDoc.includes(requiredText), `index must include ${requiredText}`);
  }
  for (const doc of [substrateDoc, surfaceDoc, gateDoc]) {
    assert.match(doc, /Feedback event aggregation read model implementation/i);
    assert.match(doc, /deterministic/i);
    assert.match(doc, /fixture-backed/i);
    assert.match(doc, /advisory|read-only/i);
    assert.match(doc, /not proof\/evidence/i);
    assert.match(doc, /not Perspective state|separated from durable Perspective promotion/i);
    assert.match(doc, /not work status|work mutation/i);
    assert.match(doc, /not promotion authority|promotion authority/i);
    assert.match(doc, /not salience authority|no salience authority/i);
    assert.match(doc, /not retrieval\/RAG result|retrieval\/RAG/i);
    assert.match(doc, /not product write|no product write/i);
    assert.match(doc, /no runtime DB|no runtime DB query/i);
    assert.match(doc, /#686/);
    assert.match(doc, new RegExp(nextRecommendedSlice));
  }
}

function assertContractSmokeDownstreamPointer() {
  for (const requiredText of [
    packageScriptName,
    builderPath,
    fixturePath,
    smokePath,
    recommendationStatus,
    nextRecommendedSlice,
  ]) {
    assert.ok(
      contractSmokeSource.includes(requiredText),
      `#709 contract smoke must allow implementation text: ${requiredText}`,
    );
  }
  assert.equal(
    contractFixture.next_recommended_slice,
    contractNextRecommendedSlice,
    "#709 contract fixture output must remain unchanged",
  );
}

function assertBrowserValidationDownstreamPointer() {
  if (!browserValidationSliceActive()) return;
  for (const requiredText of [
    browserValidationVersion,
    browserValidationFixturePath,
    browserValidationSmokePath,
    browserValidationPackageScriptName,
    browserValidationRecommendationStatus,
    browserValidationNextRecommendedSlice,
  ]) {
    assert.ok(
      smokeSource.includes(requiredText),
      `implementation smoke must allow browser validation text: ${requiredText}`,
    );
  }
}

function buildSyntheticFeedbackEvents() {
  const template = feedbackStoreFixture.events[0];
  const syntheticRows = [
    {
      event_id: "feedback_event:synthetic:001",
      event_type: "pin_preview",
      target_kind: "agent_perspective_substrate_folded_section",
      target_id: "synthetic:folded",
      created_at: "2026-06-22T00:00:00.000Z",
    },
    {
      event_id: "feedback_event:synthetic:002",
      event_type: "dismiss_preview",
      target_kind: "agent_perspective_substrate_folded_section",
      target_id: "synthetic:folded",
      created_at: "2026-06-23T00:00:00.000Z",
    },
    {
      event_id: "feedback_event:synthetic:003",
      event_type: "correct_preview",
      target_kind: "agent_perspective_substrate_surfacing_card",
      target_id: "synthetic:surfacing",
      created_at: "2026-06-24T00:00:00.000Z",
    },
    {
      event_id: "feedback_event:synthetic:004",
      event_type: "invalidate_preview",
      target_kind: "agent_perspective_substrate_surfacing_card",
      target_id: "synthetic:surfacing",
      created_at: "2026-06-23T00:01:00.000Z",
    },
    {
      event_id: "feedback_event:synthetic:005",
      event_type: "pin_preview",
      target_kind: "candidate_to_codex_handoff_draft_review",
      target_id: "synthetic:draft",
      created_at: "2026-06-22T00:01:00.000Z",
    },
    {
      event_id: "feedback_event:synthetic:006",
      event_type: "dismiss_preview",
      target_kind: "candidate_to_codex_handoff_operator_decision_preview",
      target_id: "synthetic:operator-decision",
      created_at: "2026-06-24T00:01:00.000Z",
    },
  ];
  return syntheticRows.map((row, index) => ({
    ...template,
    ...row,
    source_ref_ids: [`synthetic:source:${row.target_id}`],
    idempotency_key: `feedback_event_store_idempotency:synthetic:${index + 1}`,
    operator_note: index % 2 === 0 ? "synthetic fixture-backed note" : "",
    reason: index % 2 === 0 ? "synthetic_fixture_reason" : "",
  }));
}

function compareRowsBySortPolicy(sortPolicy, a, b) {
  const orderBy = Array.isArray(sortPolicy.order_by) ? sortPolicy.order_by : [];
  const clauses = orderBy
    .map((clause) => (typeof clause === "string" ? parseSortClause(clause) : null))
    .filter(Boolean);
  for (const clause of clauses) {
    const compared = compareSortValues(a[clause.field], b[clause.field]);
    if (compared !== 0) {
      return clause.direction === "DESC" ? -compared : compared;
    }
  }
  return canonicalJson(a).localeCompare(canonicalJson(b));
}

function parseSortClause(clause) {
  const match = clause.match(/^([A-Za-z0-9_]+)\s+(ASC|DESC)$/);
  return match ? { field: match[1], direction: match[2] } : null;
}

function compareSortValues(a, b) {
  if (typeof a === "number" && typeof b === "number") {
    return a - b;
  }
  if (typeof a === "boolean" && typeof b === "boolean") {
    return Number(a) - Number(b);
  }
  return stableSortString(a).localeCompare(stableSortString(b));
}

function stableSortString(value) {
  if (Array.isArray(value) || (value && typeof value === "object")) {
    return canonicalJson(value);
  }
  return String(value);
}

function appliedLimit(limitPolicy) {
  const defaultLimit = numericLimit(limitPolicy.default_limit);
  const maxLimit = numericLimit(limitPolicy.max_limit);
  if (typeof defaultLimit === "number" && typeof maxLimit === "number") {
    return Math.min(defaultLimit, maxLimit);
  }
  return defaultLimit ?? maxLimit;
}

function numericLimit(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.trunc(value)
    : undefined;
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
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

function uniqueSorted(values) {
  return [...new Set(values)].sort();
}

function mergeBaseRef() {
  return readGitOutput(["merge-base", "HEAD", "origin/main"]).trim();
}

function browserValidationSliceActive() {
  return readChangedFiles().includes(browserValidationSmokePath);
}

function formationReceiptDurableEventImplementationSliceActive() {
  return readChangedFiles().includes("scripts/smoke-formation-receipt-durable-event-implementation-v0-1.mjs");
}

function formationReceiptDurableEventContractSliceActive() {
  return readChangedFiles().includes(formationReceiptDurableEventContractSmokePath);
}

function readGitOutput(args) {
  return execFileSync("git", args, { encoding: "utf8" });
}
