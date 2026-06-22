import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire, stripTypeScriptTypes } from "node:module";

const require = createRequire(import.meta.url);

const typePath = "types/feedback-event-store.ts";
const helperPath = "lib/research-candidate-review/feedback-event-store.ts";
const fixturePath =
  "fixtures/research-candidate-review.feedback-event-store.sample.v0.1.json";
const operatorDecisionFixturePath =
  "fixtures/research-candidate-review.candidate-to-codex-handoff-operator-decision.sample.v0.1.json";
const draftReviewFixturePath =
  "fixtures/research-candidate-review.candidate-to-codex-handoff-draft-review.sample.v0.1.json";
const packagePath = "package.json";
const schemaPath = "lib/db/schema.sql";
const indexPath = "docs/00_INDEX_LATEST.md";
const substrateDocPath = "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md";
const surfaceDocPath = "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md";
const gateDocPath =
  "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md";
const operatorDecisionSmokePath =
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-operator-decision-v0-1.mjs";
const smokePath = "scripts/smoke-feedback-event-store-minimal-v0-1.mjs";
const reviewControlsTypePath =
  "types/feedback-event-store-review-controls-preview.ts";
const reviewControlsBuilderPath =
  "lib/research-candidate-review/feedback-event-store-review-controls-preview.ts";
const reviewControlsFixturePath =
  "fixtures/research-candidate-review.feedback-event-store-review-controls-preview.sample.v0.1.json";
const reviewControlsSmokePath =
  "scripts/smoke-feedback-event-store-review-controls-preview-v0-1.mjs";
const routeContractTypePath = "types/feedback-event-write-route-contract.ts";
const routeContractBuilderPath =
  "lib/research-candidate-review/feedback-event-write-route-contract.ts";
const routeContractFixturePath =
  "fixtures/research-candidate-review.feedback-event-write-route-contract.sample.v0.1.json";
const routeContractSmokePath =
  "scripts/smoke-feedback-event-write-route-contract-v0-1.mjs";
const routeImplementationRouteFilePath =
  "app/api/research-candidate/feedback-events/route.ts";
const routeImplementationFixturePath =
  "fixtures/research-candidate-review.feedback-event-write-route-implementation.sample.v0.1.json";
const routeImplementationSmokePath =
  "scripts/smoke-feedback-event-write-route-implementation-v0-1.mjs";
const browserValidationFixturePath =
  "fixtures/research-candidate-review.feedback-event-write-route-browser-validation.sample.v0.1.json";
const browserValidationSmokePath =
  "scripts/smoke-feedback-event-write-route-browser-validation-v0-1.mjs";
const uiContractTypePath = "types/feedback-event-controls-ui-contract.ts";
const uiContractBuilderPath =
  "lib/research-candidate-review/feedback-event-controls-ui-contract.ts";
const uiContractFixturePath =
  "fixtures/research-candidate-review.feedback-event-controls-ui-contract.sample.v0.1.json";
const uiContractSmokePath =
  "scripts/smoke-feedback-event-controls-ui-contract-v0-1.mjs";
const uiImplementationComponentPath = "components/feedback-event-controls.tsx";
const foldedAuditPanelComponentPath =
  "components/agent-perspective-substrate-folded-audit-panel.tsx";
const uiImplementationFixturePath =
  "fixtures/research-candidate-review.feedback-event-controls-ui-implementation.sample.v0.1.json";
const uiImplementationSmokePath =
  "scripts/smoke-feedback-event-controls-ui-implementation-v0-1.mjs";

const packageScriptName = "smoke:feedback-event-store-minimal-v0-1";
const packageScriptValue = `node ${smokePath}`;
const reviewControlsPackageScriptName =
  "smoke:feedback-event-store-review-controls-preview-v0-1";
const reviewControlsPackageScriptValue = `node ${reviewControlsSmokePath}`;
const routeContractPackageScriptName =
  "smoke:feedback-event-write-route-contract-v0-1";
const routeContractPackageScriptValue = `node ${routeContractSmokePath}`;
const routeImplementationPackageScriptName =
  "smoke:feedback-event-write-route-implementation-v0-1";
const routeImplementationPackageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-feedback-event-write-route-implementation-v0-1.mjs";
const browserValidationPackageScriptName =
  "smoke:feedback-event-write-route-browser-validation-v0-1";
const browserValidationPackageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-feedback-event-write-route-browser-validation-v0-1.mjs";
const uiContractPackageScriptName = "smoke:feedback-event-controls-ui-contract-v0-1";
const uiContractPackageScriptValue =
  "node scripts/smoke-feedback-event-controls-ui-contract-v0-1.mjs";
const uiImplementationPackageScriptName =
  "smoke:feedback-event-controls-ui-implementation-v0-1";
const uiImplementationPackageScriptValue =
  "node scripts/smoke-feedback-event-controls-ui-implementation-v0-1.mjs";
const previousSlice = "feedback_event_store_minimal_v0_1";
const nextRecommendedSlice =
  "feedback_event_store_review_controls_preview_v0_1";
const reviewControlsNextRecommendedSlice =
  "feedback_event_write_route_contract_v0_1";
const reviewControlsRecommendationStatus =
  "ready_for_feedback_event_write_route_contract_v0_1";
const routeContractNextRecommendedSlice =
  "feedback_event_write_route_implementation_v0_1";
const routeContractRecommendationStatus =
  "ready_for_feedback_event_write_route_implementation_v0_1";
const routeImplementationNextRecommendedSlice =
  "feedback_event_write_route_browser_validation_v0_1";
const routeImplementationRecommendationStatus =
  "ready_for_feedback_event_write_route_browser_validation_v0_1";
const browserValidationNextRecommendedSlice =
  "feedback_event_controls_ui_contract_v0_1";
const browserValidationRecommendationStatus =
  "ready_for_feedback_event_controls_ui_contract_v0_1";
const uiContractNextRecommendedSlice =
  "feedback_event_controls_ui_implementation_v0_1";
const uiContractRecommendationStatus =
  "ready_for_feedback_event_controls_ui_implementation_v0_1";
const uiImplementationNextRecommendedSlice =
  "feedback_event_controls_ui_browser_validation_v0_1";
const uiImplementationRecommendationStatus =
  "ready_for_feedback_event_controls_ui_browser_validation_v0_1";
const requiredEventTypes = [
  "dismiss_preview",
  "pin_preview",
  "correct_preview",
  "invalidate_preview",
];
const requiredTargetKinds = [
  "agent_perspective_substrate_surfacing_card",
  "agent_perspective_substrate_folded_section",
  "candidate_to_codex_handoff_draft",
  "candidate_to_codex_handoff_draft_review",
  "candidate_to_codex_handoff_operator_decision_preview",
  "research_candidate_review_object",
  "research_candidate_ai_context_packet",
  "perspective_geometry_digest",
];
const repoLocalSourceRefPrefixes = [
  "fixtures/",
  "components/",
  "docs/",
  "types/",
  "lib/",
  "scripts/",
];
const allowedExternalLineageSourceRefs = new Set(["pr:686"]);
const expectedChangedFiles = [
  typePath,
  helperPath,
  fixturePath,
  smokePath,
  packagePath,
  schemaPath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  operatorDecisionSmokePath,
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1.mjs",
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1.mjs",
  "scripts/smoke-research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-folded-audit-panel-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-preview-builder-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-v0-1.mjs",
  "scripts/smoke-research-candidate-review-perspective-geometry-digest-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
];
const downstreamReviewControlsRequiredChangedFiles = [
  reviewControlsTypePath,
  reviewControlsBuilderPath,
  reviewControlsFixturePath,
  reviewControlsSmokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  smokePath,
];
const downstreamReviewControlsAllowedChangedFiles = [
  ...downstreamReviewControlsRequiredChangedFiles,
  operatorDecisionSmokePath,
  "scripts/smoke-agent-perspective-substrate-folded-audit-panel-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-preview-builder-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-v0-1.mjs",
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1.mjs",
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1.mjs",
  "scripts/smoke-research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1.mjs",
  "scripts/smoke-research-candidate-review-perspective-geometry-digest-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
];
const downstreamRouteContractRequiredChangedFiles = [
  routeContractTypePath,
  routeContractBuilderPath,
  routeContractFixturePath,
  routeContractSmokePath,
  reviewControlsSmokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  smokePath,
];
const downstreamRouteContractAllowedChangedFiles = [
  ...downstreamRouteContractRequiredChangedFiles,
  operatorDecisionSmokePath,
  "scripts/smoke-agent-perspective-substrate-folded-audit-panel-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-preview-builder-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-v0-1.mjs",
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1.mjs",
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1.mjs",
  "scripts/smoke-research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1.mjs",
  "scripts/smoke-research-candidate-review-perspective-geometry-digest-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
];
const downstreamRouteImplementationRequiredChangedFiles = [
  routeImplementationRouteFilePath,
  routeImplementationFixturePath,
  routeImplementationSmokePath,
  routeContractSmokePath,
  reviewControlsSmokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  smokePath,
];
const downstreamRouteImplementationAllowedChangedFiles = [
  ...downstreamRouteImplementationRequiredChangedFiles,
  operatorDecisionSmokePath,
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1.mjs",
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1.mjs",
  "scripts/smoke-research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-folded-audit-panel-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-preview-builder-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-v0-1.mjs",
  "scripts/smoke-research-candidate-review-perspective-geometry-digest-v0-1.mjs",
  "scripts/smoke-research-candidate-review-ai-context-packet-v0-1.mjs",
  "scripts/smoke-research-candidate-canonical-promotion-gates-v0-1.mjs",
  "scripts/smoke-research-candidate-review-types-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
];
const downstreamBrowserValidationRequiredChangedFiles = [
  browserValidationFixturePath,
  browserValidationSmokePath,
  routeImplementationSmokePath,
  routeContractSmokePath,
  reviewControlsSmokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  smokePath,
];
const downstreamBrowserValidationAllowedChangedFiles = [
  ...downstreamBrowserValidationRequiredChangedFiles,
  operatorDecisionSmokePath,
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1.mjs",
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1.mjs",
  "scripts/smoke-research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1.mjs",
  "scripts/smoke-research-candidate-review-manual-parser-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-folded-audit-panel-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-preview-builder-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-v0-1.mjs",
  "scripts/smoke-research-candidate-review-perspective-geometry-digest-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
];
const downstreamUiContractRequiredChangedFiles = [
  uiContractTypePath,
  uiContractBuilderPath,
  uiContractFixturePath,
  uiContractSmokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  browserValidationSmokePath,
  routeImplementationSmokePath,
  routeContractSmokePath,
  reviewControlsSmokePath,
  smokePath,
];
const downstreamUiContractAllowedChangedFiles = [
  ...downstreamUiContractRequiredChangedFiles,
  operatorDecisionSmokePath,
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1.mjs",
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1.mjs",
  "scripts/smoke-research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-folded-audit-panel-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-preview-builder-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-v0-1.mjs",
  "scripts/smoke-research-candidate-review-perspective-geometry-digest-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
];
const downstreamUiImplementationRequiredChangedFiles = [
  uiImplementationComponentPath,
  foldedAuditPanelComponentPath,
  uiImplementationFixturePath,
  uiImplementationSmokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  uiContractSmokePath,
  browserValidationSmokePath,
  routeImplementationSmokePath,
  routeContractSmokePath,
  reviewControlsSmokePath,
  smokePath,
];
const downstreamUiImplementationAllowedChangedFiles = [
  ...downstreamUiImplementationRequiredChangedFiles,
  operatorDecisionSmokePath,
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1.mjs",
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1.mjs",
  "scripts/smoke-research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-folded-audit-panel-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-preview-builder-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-v0-1.mjs",
  "scripts/smoke-research-candidate-review-perspective-geometry-digest-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
];

for (const filePath of [
  typePath,
  helperPath,
  fixturePath,
  operatorDecisionFixturePath,
  draftReviewFixturePath,
  packagePath,
  schemaPath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  operatorDecisionSmokePath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const typeSource = readFileSync(typePath, "utf8");
const helperSource = readFileSync(helperPath, "utf8");
const smokeSource = readFileSync(smokePath, "utf8");
const fixture = readJson(fixturePath);
const operatorDecisionFixture = readJson(operatorDecisionFixturePath);
const draftReviewFixture = readJson(draftReviewFixturePath);
const packageJson = readJson(packagePath);
const schemaSql = readFileSync(schemaPath, "utf8");
const indexDoc = readFileSync(indexPath, "utf8");
const substrateDoc = readFileSync(substrateDocPath, "utf8");
const surfaceDoc = readFileSync(surfaceDocPath, "utf8");
const gateDoc = readFileSync(gateDocPath, "utf8");
const operatorDecisionSmoke = readFileSync(operatorDecisionSmokePath, "utf8");

assertTypeAndHelperContracts();
assertPackageScript();
assertStaticBoundary();
assertNoForbiddenImplementationPatterns();
assertDocsPointers();
assertSchemaAddition();
assertPreviousSmokePointer();
assertReviewControlsDownstreamPointer();
assertRouteContractDownstreamPointer();
assertRouteImplementationDownstreamPointer();
assertBrowserValidationDownstreamPointer();
assertUiContractDownstreamPointer();
assertUiImplementationDownstreamPointer();

const helper = await importHelperModule();
const fixtureInputs = buildFixtureInputs();
const rebuiltEvents = fixtureInputs.map((input) =>
  helper.buildFeedbackEventStoreEvent(input),
);
const rebuiltEventsAgain = fixtureInputs.map((input) =>
  helper.buildFeedbackEventStoreEvent(input),
);

assert.deepEqual(
  rebuiltEvents,
  fixture.events,
  "rebuilt feedback events must match committed fixture events",
);
assert.deepEqual(
  rebuiltEvents.map((event) => event.event_id),
  rebuiltEventsAgain.map((event) => event.event_id),
  "event ids must be stable across repeated builds",
);
assert.deepEqual(
  rebuiltEvents.map((event) => event.idempotency_key),
  rebuiltEventsAgain.map((event) => event.idempotency_key),
  "idempotency keys must be stable across repeated builds",
);

assertFixtureAndEvents(helper);
assertValidationFailures(helper);
assertTempDbBehavior(helper);

console.log(
  JSON.stringify(
    {
      smoke: "feedback-event-store-minimal-v0-1",
      final_status: "pass",
      event_count: fixture.events.length,
      table_name: helper.feedbackEventStoreTableName,
      next_recommended_slice: fixture.next_recommended_slice,
      checked_duplicate_idempotency_insert: true,
      checked_no_product_proof_evidence_perspective_or_work_tables: true,
      checked_product_write_lane_parked: true,
    },
    null,
    2,
  ),
);

function assertTypeAndHelperContracts() {
  for (const exportName of [
    "FeedbackEventStoreEvent",
    "FeedbackEventStoreInput",
    "FeedbackEventStoreEventType",
    "FeedbackEventStoreTargetKind",
    "FeedbackEventStoreAuthorityBoundary",
    "FeedbackEventStoreValidationResult",
    "FeedbackEventStoreWriteResult",
    "FeedbackEventStoreListResult",
  ]) {
    assert.match(
      typeSource,
      new RegExp(`export\\s+(interface|type)\\s+${escapeRegExp(exportName)}\\b`),
      `type file must export ${exportName}`,
    );
  }
  for (const exportName of [
    "normalizeFeedbackEventStoreInput",
    "buildFeedbackEventStoreEvent",
    "validateFeedbackEventStoreEvent",
    "createFeedbackEventStoreEventId",
    "createFeedbackEventStoreIdempotencyKey",
    "insertFeedbackEvent",
    "listFeedbackEvents",
  ]) {
    assert.match(
      helperSource,
      new RegExp(`export\\s+function\\s+${escapeRegExp(exportName)}\\b`),
      `helper must export ${exportName}`,
    );
  }
  for (const requiredText of [
    "feedback_event_store.v0.1",
    "durable_feedback_event",
    "proof_or_evidence_record",
    "perspective_promotion",
    "work_mutation",
    "codex_execution_authority",
    "github_automation_authority",
    "retrieval_rag_authority",
    "source_fetch_authority",
    "product_write_authority",
    "product_id_allocation_authority",
  ]) {
    assert.ok(typeSource.includes(requiredText), `type source must include ${requiredText}`);
    assert.ok(
      helperSource.includes(requiredText),
      `helper source must include ${requiredText}`,
    );
  }
  assert.ok(
    helperSource.includes("research_candidate_feedback_events"),
    "helper source must include research_candidate_feedback_events",
  );
  for (const eventType of requiredEventTypes) {
    assert.ok(typeSource.includes(eventType), `type source must include ${eventType}`);
    assert.ok(helperSource.includes(eventType), `helper source must include ${eventType}`);
  }
  for (const targetKind of requiredTargetKinds) {
    assert.ok(typeSource.includes(targetKind), `type source must include ${targetKind}`);
    assert.ok(helperSource.includes(targetKind), `helper source must include ${targetKind}`);
  }
  assert.doesNotMatch(
    helperSource,
    /^import\s+(?!type\b)/m,
    "helper must keep runtime imports out",
  );
}

function assertPackageScript() {
  assert.equal(packageJson.scripts[packageScriptName], packageScriptValue);
  if (downstreamRouteImplementationSliceActive()) {
    assert.equal(
      packageJson.scripts[routeImplementationPackageScriptName],
      routeImplementationPackageScriptValue,
    );
  }
  if (downstreamBrowserValidationSliceActive()) {
    assert.equal(
      packageJson.scripts[browserValidationPackageScriptName],
      browserValidationPackageScriptValue,
    );
  }
  if (downstreamUiContractSliceActive()) {
    assert.equal(
      packageJson.scripts[uiContractPackageScriptName],
      uiContractPackageScriptValue,
    );
  }
  if (downstreamUiImplementationSliceActive()) {
    assert.equal(
      packageJson.scripts[uiImplementationPackageScriptName],
      uiImplementationPackageScriptValue,
    );
  }
  if (downstreamRouteContractSliceActive()) {
    assert.equal(
      packageJson.scripts[routeContractPackageScriptName],
      routeContractPackageScriptValue,
    );
  }
  if (downstreamReviewControlsSliceActive()) {
    assert.equal(
      packageJson.scripts[reviewControlsPackageScriptName],
      reviewControlsPackageScriptValue,
    );
  }
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
    .map(extractScriptName)
    .filter(Boolean)
    .sort();
  const expectedAddedScriptNames = downstreamUiImplementationSliceActive()
    ? [uiImplementationPackageScriptName]
    : downstreamUiContractSliceActive()
    ? [uiContractPackageScriptName]
    : downstreamRouteImplementationSliceActive()
    ? [routeImplementationPackageScriptName]
    : downstreamBrowserValidationSliceActive()
    ? [browserValidationPackageScriptName]
    : downstreamRouteContractSliceActive()
    ? [routeContractPackageScriptName]
    : downstreamReviewControlsSliceActive()
    ? [reviewControlsPackageScriptName]
    : [packageScriptName];
  assert.deepEqual(
    addedScriptNames,
    expectedAddedScriptNames,
    "package additions must only include the active Feedback Event Store smoke script",
  );
  assert.doesNotMatch(
    packageAddedLines.join("\n"),
    /"dependencies"\s*:/,
    "dependencies must not be added",
  );
  assert.doesNotMatch(
    packageAddedLines.join("\n"),
    /"devDependencies"\s*:/,
    "dev dependencies must not be added",
  );
}

function assertStaticBoundary() {
  const changedFiles = readChangedFiles();
  const requiredFiles = downstreamUiImplementationSliceActive()
    ? downstreamUiImplementationRequiredChangedFiles
    : downstreamUiContractSliceActive()
    ? downstreamUiContractRequiredChangedFiles
    : downstreamRouteImplementationSliceActive()
    ? downstreamRouteImplementationRequiredChangedFiles
    : downstreamBrowserValidationSliceActive()
    ? downstreamBrowserValidationRequiredChangedFiles
    : downstreamRouteContractSliceActive()
    ? downstreamRouteContractRequiredChangedFiles
    : downstreamReviewControlsSliceActive()
    ? downstreamReviewControlsRequiredChangedFiles
    : expectedChangedFiles;
  const allowedFiles = downstreamUiImplementationSliceActive()
    ? downstreamUiImplementationAllowedChangedFiles
    : downstreamUiContractSliceActive()
    ? downstreamUiContractAllowedChangedFiles
    : downstreamRouteImplementationSliceActive()
    ? downstreamRouteImplementationAllowedChangedFiles
    : downstreamBrowserValidationSliceActive()
    ? downstreamBrowserValidationAllowedChangedFiles
    : downstreamRouteContractSliceActive()
    ? downstreamRouteContractAllowedChangedFiles
    : downstreamReviewControlsSliceActive()
    ? downstreamReviewControlsAllowedChangedFiles
    : expectedChangedFiles;
  for (const expectedFile of requiredFiles) {
    assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      allowedFiles.includes(changedFile),
      `unexpected changed file in feedback event store slice: ${changedFile}`,
    );
    if (
      !downstreamRouteImplementationSliceActive() ||
      changedFile !== routeImplementationRouteFilePath
    ) {
      assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api files");
    }
    if (
      downstreamUiImplementationSliceActive() &&
      [uiImplementationComponentPath, foldedAuditPanelComponentPath].includes(changedFile)
    ) {
      // This downstream slice is the first bounded UI implementation.
    } else {
      assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    }
    assert.notEqual(changedFile, "lib/db.ts", "must not change lib/db.ts");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
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

function assertNoForbiddenImplementationPatterns() {
  const scannedSources = [
    [typePath, typeSource],
    [helperPath, helperSource],
    [schemaPath, schemaSql],
    [smokePath, stripForbiddenPatternDefinitions(smokeSource)],
  ];
  const forbiddenPatterns = [
    pattern(["from ", '"openai"']),
    pattern(["new ", "OpenAI"]),
    pattern(["fetch", "("]),
    pattern(["XMLHttpRequest"]),
    pattern(["WebSocket"]),
    pattern(["EventSource"]),
    pattern(["sendBeacon"]),
    pattern(["localStorage"]),
    pattern(["sessionStorage"]),
    pattern(["indexedDB"]),
    pattern(["document", ".", "cookie"]),
    pattern(["createServer", "("]),
    pattern(["app", ".", "listen", "("]),
    pattern(["next", " ", "dev"]),
    pattern(["api", ".", "github", ".", "com"]),
    pattern(["Octokit"]),
    { label: "gh-pr-command", regex: /\bgh\s+pr\b/i },
    { label: "git-push-command", regex: /\bgit\s+push\b/i },
    { label: "codex-exec-command", regex: /\bcodex\s+exec\b/i },
    { label: "codex-run-command", regex: /\bcodex\s+run\b/i },
    { label: "npm-run-codex-command", regex: /\bnpm\s+run\s+codex\b/i },
    pattern(["executeProductWrite", "("]),
    pattern(["productDbWrite", "("]),
  ];
  for (const [filePath, source] of scannedSources) {
    for (const { label, regex } of forbiddenPatterns) {
      assert.doesNotMatch(source, regex, `${filePath} must not include ${label}`);
    }
  }
}

function assertDocsPointers() {
  for (const requiredText of [
    "Feedback Event Store minimal v0.1",
    typePath,
    helperPath,
    fixturePath,
    smokePath,
    packageScriptName,
    "dismiss_preview",
    "pin_preview",
    "correct_preview",
    "invalidate_preview",
    "durable feedback event",
    "no proof/evidence/Perspective promotion/work mutation",
    "no Codex/GitHub automation/external handoff",
    "no provider/OpenAI/source-fetch/retrieval/RAG execution",
    "no product write/product IDs",
    nextRecommendedSlice,
  ]) {
    assert.ok(indexDoc.includes(requiredText), `index must include ${requiredText}`);
  }
  for (const doc of [substrateDoc, surfaceDoc, gateDoc]) {
    assert.match(doc, /Feedback Event Store minimal v0\.1/i);
    assert.match(doc, /dismiss_preview|dismiss/i);
    assert.match(doc, /pin_preview|pin/i);
    assert.match(doc, /correct_preview|correct/i);
    assert.match(doc, /invalidate_preview|invalidate/i);
    assert.match(doc, /durable operator input|durable feedback/i);
    assert.match(doc, /not Perspective\s+promotion|do not mutate substrate/i);
    assert.match(doc, /not proof\/evidence|proof\/evidence/i);
    assert.match(doc, /not work mutation|work mutation/i);
    assert.match(doc, /no provider\/OpenAI/i);
    assert.match(doc, /no source fetch|source-fetch/i);
    assert.match(doc, /no retrieval\/RAG execution/i);
    assert.match(doc, /no Codex execution/i);
    assert.match(doc, /no GitHub automation|no branch\/PR\/GitHub automation/i);
    assert.match(doc, /no product write/i);
    assert.match(doc, /#686/);
    assert.match(doc, new RegExp(nextRecommendedSlice));
  }
}

function assertSchemaAddition() {
  for (const requiredText of [
    "CREATE TABLE IF NOT EXISTS research_candidate_feedback_events",
    "event_id TEXT PRIMARY KEY",
    "event_version TEXT NOT NULL",
    "event_type TEXT NOT NULL",
    "target_kind TEXT NOT NULL",
    "target_id TEXT NOT NULL",
    "source_ref_ids_json TEXT NOT NULL",
    "idempotency_key TEXT NOT NULL UNIQUE",
    "authority_boundary_json TEXT NOT NULL",
    "event_json TEXT NOT NULL",
    "idx_research_candidate_feedback_events_event_type",
    "idx_research_candidate_feedback_events_target",
    "idx_research_candidate_feedback_events_created_at",
    "idx_research_candidate_feedback_events_idempotency",
  ]) {
    assert.ok(schemaSql.includes(requiredText), `schema must include ${requiredText}`);
  }
  const addedSchemaLines = readGitOutput([
    "diff",
    "--unified=0",
    mergeBaseRef(),
    "--",
    schemaPath,
  ]);
  if (
    downstreamReviewControlsSliceActive() ||
    downstreamRouteContractSliceActive() ||
    downstreamRouteImplementationSliceActive() ||
    downstreamBrowserValidationSliceActive() ||
    downstreamUiContractSliceActive() ||
    downstreamUiImplementationSliceActive()
  ) {
    assert.equal(
      addedSchemaLines.trim(),
      "",
      "downstream review controls preview or route contract must not change schema.sql",
    );
    return;
  }
  const addedCreateTableLines = addedSchemaLines
    .split("\n")
    .filter((line) => /^\+CREATE TABLE/i.test(line));
  assert.deepEqual(
    addedCreateTableLines,
    ["+CREATE TABLE IF NOT EXISTS research_candidate_feedback_events ("],
    "schema must only add the feedback event table",
  );
}

function assertPreviousSmokePointer() {
  for (const requiredText of [
    packageScriptName,
    nextRecommendedSlice,
    typePath,
    helperPath,
    fixturePath,
    smokePath,
    schemaPath,
  ]) {
    assert.ok(
      operatorDecisionSmoke.includes(requiredText),
      `#694 operator decision smoke must allow ${requiredText}`,
    );
  }
  assert.ok(
    operatorDecisionFixture.next_recommended_slice === previousSlice,
    "source #694 operator decision fixture output must remain unchanged",
  );
}

function assertReviewControlsDownstreamPointer() {
  if (!downstreamReviewControlsSliceActive()) return;
  for (const requiredText of [
    reviewControlsPackageScriptName,
    reviewControlsNextRecommendedSlice,
    reviewControlsTypePath,
    reviewControlsBuilderPath,
    reviewControlsFixturePath,
    reviewControlsSmokePath,
    reviewControlsRecommendationStatus,
  ]) {
    assert.ok(
      smokeSource.includes(requiredText),
      `#695 feedback event store smoke must allow downstream review controls text: ${requiredText}`,
    );
  }
  assert.equal(
    fixture.next_recommended_slice,
    nextRecommendedSlice,
    "#695 feedback event fixture output must remain unchanged",
  );
  assert.ok(
    JSON.stringify(fixture).includes("feedback_event_store_review_controls_preview_v0_1"),
    "#695 fixture must keep the review controls next pointer",
  );
}

function assertRouteContractDownstreamPointer() {
  if (!downstreamRouteContractSliceActive()) return;
  for (const requiredText of [
    routeContractPackageScriptName,
    routeContractNextRecommendedSlice,
    routeContractTypePath,
    routeContractBuilderPath,
    routeContractFixturePath,
    routeContractSmokePath,
    routeContractRecommendationStatus,
  ]) {
    assert.ok(
      smokeSource.includes(requiredText),
      `#695 feedback event store smoke must allow downstream route contract text: ${requiredText}`,
    );
  }
  assert.equal(
    fixture.next_recommended_slice,
    nextRecommendedSlice,
    "#695 feedback event fixture output must remain unchanged",
  );
}

function assertRouteImplementationDownstreamPointer() {
  if (!downstreamRouteImplementationSliceActive()) return;
  for (const requiredText of [
    routeImplementationPackageScriptName,
    routeImplementationNextRecommendedSlice,
    routeImplementationRouteFilePath,
    routeImplementationFixturePath,
    routeImplementationSmokePath,
    routeImplementationRecommendationStatus,
  ]) {
    assert.ok(
      smokeSource.includes(requiredText),
      `#695 feedback event store smoke must allow downstream route implementation text: ${requiredText}`,
    );
  }
  assert.equal(
    fixture.next_recommended_slice,
    nextRecommendedSlice,
    "#695 feedback event fixture output must remain unchanged",
  );
}

function assertBrowserValidationDownstreamPointer() {
  if (!downstreamBrowserValidationSliceActive()) return;
  for (const requiredText of [
    browserValidationPackageScriptName,
    browserValidationNextRecommendedSlice,
    browserValidationFixturePath,
    browserValidationSmokePath,
    browserValidationRecommendationStatus,
  ]) {
    assert.ok(
      smokeSource.includes(requiredText),
      `#695 feedback event store smoke must allow downstream browser validation text: ${requiredText}`,
    );
  }
  assert.equal(
    fixture.next_recommended_slice,
    nextRecommendedSlice,
    "#695 feedback event fixture output must remain unchanged",
  );
}

function assertUiContractDownstreamPointer() {
  if (!downstreamUiContractSliceActive()) return;
  for (const requiredText of [
    uiContractPackageScriptName,
    uiContractNextRecommendedSlice,
    uiContractFixturePath,
    uiContractSmokePath,
    uiContractRecommendationStatus,
  ]) {
    assert.ok(
      smokeSource.includes(requiredText),
      `#695 feedback event store smoke must allow downstream UI contract text: ${requiredText}`,
    );
  }
  assert.equal(
    fixture.next_recommended_slice,
    nextRecommendedSlice,
    "#695 feedback event fixture output must remain unchanged",
  );
}

function assertUiImplementationDownstreamPointer() {
  if (!downstreamUiImplementationSliceActive()) return;
  for (const requiredText of [
    uiImplementationPackageScriptName,
    uiImplementationNextRecommendedSlice,
    uiImplementationFixturePath,
    uiImplementationSmokePath,
    uiImplementationRecommendationStatus,
  ]) {
    assert.ok(
      smokeSource.includes(requiredText),
      `#695 feedback event store smoke must allow downstream UI implementation text: ${requiredText}`,
    );
  }
  assert.equal(
    fixture.next_recommended_slice,
    nextRecommendedSlice,
    "#695 feedback event fixture output must remain unchanged",
  );
}

function assertFixtureAndEvents(helper) {
  assert.equal(fixture.fixture_kind, "research_candidate_feedback_event_store_minimal_fixture");
  assert.equal(fixture.fixture_version, "feedback_event_store.v0.1");
  assert.equal(fixture.product_write_stopline_ref, "pr:686");
  assert.equal(fixture.next_recommended_slice, nextRecommendedSlice);
  assert.equal(
    fixture.recommendation_status,
    "ready_for_feedback_event_store_review_controls_preview_v0_1",
  );
  assert.deepEqual(fixture.supported_event_types.sort(), requiredEventTypes.sort());
  assert.deepEqual(
    fixture.future_docs_only_event_types.sort(),
    [
      "add_to_capsule_preview",
      "downgrade_preview",
      "exclude_from_capsule_preview",
    ].sort(),
  );
  assert.equal(fixture.validation.passed, true);
  assert.deepEqual(fixture.validation.failure_codes, []);
  assert.equal(fixture.events.length, 4);
  assert.deepEqual(
    fixture.events.map((event) => event.event_type).sort(),
    requiredEventTypes.sort(),
  );
  assert.ok(
    existsSync("fixtures/agent-perspective-substrate-preview.sample.v0.1.json"),
    "source #689 substrate preview fixture must exist",
  );
  assert.ok(
    existsSync("components/agent-perspective-substrate-folded-audit-panel.tsx"),
    "source #690 folded audit panel component must exist",
  );
  assert.doesNotMatch(
    JSON.stringify(fixture.events),
    /research-candidate-review\.agent-perspective-substrate-preview/,
    "fixture source refs must not use nonexistent research-candidate-review substrate preview paths",
  );
  assert.doesNotMatch(
    JSON.stringify(fixture.events),
    /research-candidate-review\.agent-perspective-substrate-folded-audit-panel/,
    "fixture source refs must not use nonexistent research-candidate-review folded audit panel fixture paths",
  );
  for (const event of fixture.events) {
    const validation = helper.validateFeedbackEventStoreEvent(event);
    assert.equal(validation.passed, true, `${event.event_id} must validate`);
    assert.deepEqual(validation.failure_codes, []);
    assert.match(event.event_id, /^feedback_event:fnv1a32:[0-9a-f]{8}$/);
    assert.match(
      event.idempotency_key,
      /^feedback_event_store_idempotency:fnv1a32:[0-9a-f]{8}$/,
    );
    assert.ok(
      Array.isArray(event.source_ref_ids),
      `${event.event_id} must preserve source_ref_ids`,
    );
    assertSourceRefsResolve(event);
    assertAuthorityBoundary(event.authority_boundary);
    assert.match(
      `${event.operator_note ?? ""} ${event.reason ?? ""}`,
      /#686|product-write lane remains parked/i,
      `${event.event_id} must preserve product-write parked note`,
    );
    assert.doesNotMatch(
      JSON.stringify(event),
      /sk-[A-Za-z0-9_-]{8,}|ghp_[A-Za-z0-9_]+|OPENAI_API_KEY|GITHUB_TOKEN|password\s*[:=]|secret\s*[:=]/i,
      `${event.event_id} must not contain secrets`,
    );
  }
  const correctionEvent = fixture.events.find(
    (event) => event.event_type === "correct_preview",
  );
  assert.ok(correctionEvent?.correction_text, "correct_preview must include correction_text");
  const invalidateEvent = fixture.events.find(
    (event) => event.event_type === "invalidate_preview",
  );
  assert.equal(
    invalidateEvent?.target_kind,
    "candidate_to_codex_handoff_operator_decision_preview",
  );
}

function assertValidationFailures(helper) {
  const validEvent = fixture.events[0];
  assert.deepEqual(
    helper.validateFeedbackEventStoreEvent({
      ...fixture.events.find((event) => event.event_type === "correct_preview"),
      correction_text: "",
    }).failure_codes,
    ["correction_text_required_for_correct_preview"],
    "correct_preview must require correction_text",
  );
  assert.ok(
    helper
      .validateFeedbackEventStoreEvent({
        ...validEvent,
        event_type: "downgrade_preview",
      })
      .failure_codes.includes("event_type_invalid"),
    "invalid event_type must block",
  );
  assert.ok(
    helper
      .validateFeedbackEventStoreEvent({
        ...validEvent,
        target_kind: "unknown_preview_surface",
      })
      .failure_codes.includes("target_kind_invalid"),
    "invalid target_kind must block",
  );
  assert.ok(
    helper
      .validateFeedbackEventStoreEvent({
        ...validEvent,
        target_id: "",
      })
      .failure_codes.includes("target_id_missing"),
    "missing target_id must block",
  );
  assert.ok(
    helper
      .validateFeedbackEventStoreEvent({
        ...validEvent,
        source_ref_ids: [],
        reason: "",
      })
      .failure_codes.includes("source_ref_ids_empty_without_reason"),
    "empty source_ref_ids must require explicit reason",
  );
  assert.ok(
    helper
      .validateFeedbackEventStoreEvent({
        ...validEvent,
        operator_note: "do not store OPENAI_API_KEY here",
      })
      .failure_codes.includes("operator_note_contains_secret_like_pattern"),
    "secret-like operator_note must block",
  );
  assert.ok(
    helper
      .validateFeedbackEventStoreEvent({
        ...validEvent,
        authority_boundary: {
          ...validEvent.authority_boundary,
          product_write_authority: true,
        },
      })
      .failure_codes.includes("authority_boundary_forbidden_capability_enabled"),
    "authority boundary cannot grant forbidden capabilities",
  );
}

function assertTempDbBehavior(helper) {
  const Database = require("better-sqlite3");
  const tempDir = join(tmpdir(), "augnes-feedback-event-store-minimal-v0-1");
  const tempDbPath = join(tempDir, "feedback-events.sqlite");
  assert.ok(
    tempDbPath.startsWith(tmpdir()),
    "feedback event store smoke must use a temp DB under /tmp",
  );
  rmSync(tempDir, { recursive: true, force: true });
  mkdirSync(tempDir, { recursive: true });
  const db = new Database(tempDbPath);
  try {
    db.exec(helper.feedbackEventStoreSchemaSql);
    for (const event of fixture.events) {
      const result = helper.insertFeedbackEvent(db, event);
      assert.equal(result.validation.passed, true);
      assert.equal(result.inserted, true);
      assert.equal(result.duplicate, false);
    }
    const duplicateResult = helper.insertFeedbackEvent(db, fixture.events[0]);
    assert.equal(duplicateResult.validation.passed, true);
    assert.equal(duplicateResult.inserted, false);
    assert.equal(duplicateResult.duplicate, true);
    assert.equal(duplicateResult.row_count, fixture.events.length);

    const byTarget = helper.listFeedbackEvents(db, {
      target_kind: "candidate_to_codex_handoff_operator_decision_preview",
      target_id: fixture.events[3].target_id,
    });
    assert.equal(byTarget.row_count, 1);
    assert.equal(byTarget.events[0].event_type, "invalidate_preview");

    const byType = helper.listFeedbackEvents(db, {
      event_type: "correct_preview",
    });
    assert.equal(byType.row_count, 1);
    assert.equal(byType.events[0].correction_text, fixture.events[2].correction_text);

    const tableRows = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
      .all();
    assert.deepEqual(
      tableRows.map((row) => row.name),
      ["research_candidate_feedback_events"],
      "temp smoke must create only the feedback event table",
    );
  } finally {
    db.close();
    rmSync(tempDir, { recursive: true, force: true });
  }
}

function assertAuthorityBoundary(boundary) {
  assert.equal(boundary.durable_feedback_event, true);
  for (const forbiddenKey of [
    "proof_or_evidence_record",
    "perspective_promotion",
    "work_mutation",
    "execution_authority",
    "codex_execution_authority",
    "github_automation_authority",
    "external_handoff_authority",
    "provider_openai_authority",
    "retrieval_rag_authority",
    "source_fetch_authority",
    "product_write_authority",
    "product_id_allocation_authority",
  ]) {
    assert.equal(boundary[forbiddenKey], false, `${forbiddenKey} must be false`);
  }
}

function assertSourceRefsResolve(event) {
  assert.ok(
    Array.isArray(event.source_ref_ids),
    `${event.event_id} source_ref_ids must be an array`,
  );
  for (const sourceRefId of event.source_ref_ids) {
    if (repoLocalSourceRefPrefixes.some((prefix) => sourceRefId.startsWith(prefix))) {
      const [repoLocalPath] = sourceRefId.split("#");
      assert.ok(
        existsSync(repoLocalPath),
        `${event.event_id} source_ref_id must resolve to a committed repo artifact: ${sourceRefId}`,
      );
      continue;
    }
    if (sourceRefId.startsWith("pr:")) {
      assert.ok(
        allowedExternalLineageSourceRefs.has(sourceRefId),
        `${event.event_id} external lineage source_ref_id must be allowlisted: ${sourceRefId}`,
      );
      continue;
    }
    assert.ok(
      typeof event.reason === "string" && event.reason.trim().length > 0,
      `${event.event_id} non-file source_ref_id requires explicit reason: ${sourceRefId}`,
    );
  }
}

function buildFixtureInputs() {
  return [
    {
      event_type: "dismiss_preview",
      target_kind: "agent_perspective_substrate_surfacing_card",
      target_id: "substrate_card:reviewed_non_authoritative_context",
      source_ref_ids: [
        "fixtures/agent-perspective-substrate-preview.sample.v0.1.json#surfacing_cards",
      ],
      operator_note:
        "Dismissed after review; product-write lane remains parked by #686.",
      reason: "preview_card_already_reviewed",
      created_at: "2026-06-22T00:00:00.000Z",
    },
    {
      event_type: "pin_preview",
      target_kind: "agent_perspective_substrate_folded_section",
      target_id: "folded_section:source_coverage",
      source_ref_ids: [
        "fixtures/agent-perspective-substrate-preview.sample.v0.1.json#source_coverage",
        "components/agent-perspective-substrate-folded-audit-panel.tsx#agent-perspective-substrate-folded-audit-panel",
      ],
      operator_note:
        "Pinned source coverage for later human review; product-write lane remains parked by #686.",
      reason: "keep_source_coverage_visible",
      created_at: "2026-06-22T00:01:00.000Z",
    },
    {
      event_type: "correct_preview",
      target_kind: "candidate_to_codex_handoff_draft_review",
      target_id: `candidate_to_codex_handoff_draft_review:${draftReviewFixture.review_fingerprint}`,
      target_fingerprint: draftReviewFixture.review_fingerprint,
      source_ref_ids: [
        "fixtures/research-candidate-review.candidate-to-codex-handoff-draft-review.sample.v0.1.json",
      ],
      correction_text:
        "Clarify that the review remains non-executing and does not satisfy the human operator decision.",
      operator_note:
        "Correction is feedback only; product-write lane remains parked by #686.",
      reason: "boundary_wording_correction",
      created_at: "2026-06-22T00:02:00.000Z",
    },
    {
      event_type: "invalidate_preview",
      target_kind: "candidate_to_codex_handoff_operator_decision_preview",
      target_id: `candidate_to_codex_handoff_operator_decision_preview:${operatorDecisionFixture.decision_preview_fingerprint}`,
      target_fingerprint: operatorDecisionFixture.decision_preview_fingerprint,
      source_ref_ids: [
        "fixtures/research-candidate-review.candidate-to-codex-handoff-operator-decision.sample.v0.1.json",
      ],
      operator_note:
        "Invalidated for future review-control exploration only; product-write lane remains parked by #686.",
      reason: "operator_decision_preview_superseded_for_review_controls",
      created_at: "2026-06-22T00:03:00.000Z",
    },
  ];
}

async function importHelperModule() {
  const transformedSource = stripTypeScriptTypes(helperSource, {
    mode: "transform",
  });
  return import(
    `data:text/javascript;charset=utf-8,${encodeURIComponent(transformedSource)}`
  );
}

function readChangedFiles() {
  const baseRef = mergeBaseRef();
  return [
    ...readGitOutput(["diff", "--name-only", baseRef, "--"]).split("\n"),
    ...readGitOutput(["ls-files", "--others", "--exclude-standard"]).split("\n"),
  ]
    .map((line) => line.trim())
    .filter(Boolean)
    .sort();
}

function downstreamReviewControlsSliceActive() {
  const changedFiles = readChangedFiles();
  return downstreamReviewControlsRequiredChangedFiles.every((filePath) =>
    changedFiles.includes(filePath),
  );
}

function downstreamRouteContractSliceActive() {
  const changedFiles = readChangedFiles();
  return downstreamRouteContractRequiredChangedFiles.every((filePath) =>
    changedFiles.includes(filePath),
  );
}

function downstreamRouteImplementationSliceActive() {
  const changedFiles = readChangedFiles();
  return downstreamRouteImplementationRequiredChangedFiles.every((filePath) =>
    changedFiles.includes(filePath),
  );
}

function downstreamBrowserValidationSliceActive() {
  const changedFiles = readChangedFiles();
  return [browserValidationFixturePath, browserValidationSmokePath].every((filePath) =>
    changedFiles.includes(filePath),
  );
}

function downstreamUiContractSliceActive() {
  const changedFiles = readChangedFiles();
  return [uiContractFixturePath, uiContractSmokePath].every((filePath) =>
    changedFiles.includes(filePath),
  );
}

function downstreamUiImplementationSliceActive() {
  const changedFiles = readChangedFiles();
  return downstreamUiImplementationRequiredChangedFiles.every((filePath) =>
    changedFiles.includes(filePath),
  );
}

function mergeBaseRef() {
  return readGitOutput(["merge-base", "origin/main", "HEAD"]).trim() || "origin/main";
}

function readGitOutput(args) {
  try {
    return execFileSync("git", args, { encoding: "utf8" });
  } catch {
    return "";
  }
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function extractScriptName(line) {
  return line.replace(/^\+\s*/, "").trim().match(/^"([^"]+)"/)?.[1] ?? null;
}

function stripForbiddenPatternDefinitions(source) {
  return source
    .split("\n")
    .filter((line) => !line.includes("pattern(["))
    .join("\n");
}

function pattern(parts) {
  const label = parts.join("");
  return {
    label,
    regex: new RegExp(parts.map(escapeRegExp).join("\\s*"), "i"),
  };
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
