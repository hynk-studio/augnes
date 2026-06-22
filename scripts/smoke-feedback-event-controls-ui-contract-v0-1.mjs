import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";

const typePath = "types/feedback-event-controls-ui-contract.ts";
const builderPath =
  "lib/research-candidate-review/feedback-event-controls-ui-contract.ts";
const reviewControlsFixturePath =
  "fixtures/research-candidate-review.feedback-event-store-review-controls-preview.sample.v0.1.json";
const writeRouteContractFixturePath =
  "fixtures/research-candidate-review.feedback-event-write-route-contract.sample.v0.1.json";
const writeRouteImplementationFixturePath =
  "fixtures/research-candidate-review.feedback-event-write-route-implementation.sample.v0.1.json";
const writeRouteValidationFixturePath =
  "fixtures/research-candidate-review.feedback-event-write-route-browser-validation.sample.v0.1.json";
const feedbackEventStoreFixturePath =
  "fixtures/research-candidate-review.feedback-event-store.sample.v0.1.json";
const uiContractFixturePath =
  "fixtures/research-candidate-review.feedback-event-controls-ui-contract.sample.v0.1.json";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const substrateDocPath = "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md";
const surfaceDocPath = "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md";
const gateDocPath =
  "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md";
const browserValidationSmokePath =
  "scripts/smoke-feedback-event-write-route-browser-validation-v0-1.mjs";
const routeImplementationSmokePath =
  "scripts/smoke-feedback-event-write-route-implementation-v0-1.mjs";
const routeContractSmokePath =
  "scripts/smoke-feedback-event-write-route-contract-v0-1.mjs";
const reviewControlsSmokePath =
  "scripts/smoke-feedback-event-store-review-controls-preview-v0-1.mjs";
const feedbackStoreSmokePath = "scripts/smoke-feedback-event-store-minimal-v0-1.mjs";
const smokePath = "scripts/smoke-feedback-event-controls-ui-contract-v0-1.mjs";
const uiImplementationComponentPath = "components/feedback-event-controls.tsx";
const foldedAuditPanelComponentPath =
  "components/agent-perspective-substrate-folded-audit-panel.tsx";
const uiImplementationFixturePath =
  "fixtures/research-candidate-review.feedback-event-controls-ui-implementation.sample.v0.1.json";
const uiImplementationSmokePath =
  "scripts/smoke-feedback-event-controls-ui-implementation-v0-1.mjs";

const packageScriptName = "smoke:feedback-event-controls-ui-contract-v0-1";
const packageScriptValue = `node ${smokePath}`;
const uiImplementationPackageScriptName =
  "smoke:feedback-event-controls-ui-implementation-v0-1";
const routePath = "/api/research-candidate/feedback-events";
const routeMethod = "POST";
const recommendationStatus =
  "ready_for_feedback_event_controls_ui_implementation_v0_1";
const nextRecommendedSlice = "feedback_event_controls_ui_implementation_v0_1";
const uiImplementationRecommendationStatus =
  "ready_for_feedback_event_controls_ui_browser_validation_v0_1";
const uiImplementationNextRecommendedSlice =
  "feedback_event_controls_ui_browser_validation_v0_1";
const browserValidationRecommendationStatus =
  "ready_for_feedback_event_controls_ui_contract_v0_1";
const browserValidationNextRecommendedSlice =
  "feedback_event_controls_ui_contract_v0_1";
const writeFixture = process.argv.includes("--write-fixture");

const requiredAuthorityAcknowledgements = [
  "durable_feedback_event_only",
  "not_proof_or_evidence",
  "not_perspective_promotion",
  "not_work_mutation",
  "not_execution_authority",
  "not_codex_execution",
  "not_github_automation",
  "not_external_handoff",
  "not_provider_openai_call",
  "not_source_fetch",
  "not_retrieval_rag_execution",
  "not_product_write",
  "product_write_lane_parked_by_686",
];
const requiredControlKinds = [
  "dismiss_preview",
  "pin_preview",
  "correct_preview",
  "invalidate_preview",
];
const allowedExternalLineageSourceRefs = new Set(["pr:686"]);
const repoLocalSourceRefPrefixes = [
  "fixtures/",
  "components/",
  "docs/",
  "types/",
  "lib/",
  "scripts/",
];
const expectedChangedFiles = [
  typePath,
  builderPath,
  uiContractFixturePath,
  smokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  browserValidationSmokePath,
  routeImplementationSmokePath,
  routeContractSmokePath,
  reviewControlsSmokePath,
  feedbackStoreSmokePath,
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-operator-decision-v0-1.mjs",
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
  smokePath,
];
const downstreamUiImplementationAllowedChangedFiles = [
  ...downstreamUiImplementationRequiredChangedFiles,
  browserValidationSmokePath,
  routeImplementationSmokePath,
  routeContractSmokePath,
  reviewControlsSmokePath,
  feedbackStoreSmokePath,
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-operator-decision-v0-1.mjs",
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
  builderPath,
  reviewControlsFixturePath,
  writeRouteContractFixturePath,
  writeRouteImplementationFixturePath,
  writeRouteValidationFixturePath,
  feedbackEventStoreFixturePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  browserValidationSmokePath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}
if (!writeFixture) {
  assert.ok(existsSync(uiContractFixturePath), `${uiContractFixturePath} must exist`);
}

const typeSource = readFileSync(typePath, "utf8");
const builderSource = readFileSync(builderPath, "utf8");
const smokeSource = readFileSync(smokePath, "utf8");
const browserValidationSmokeSource = readFileSync(browserValidationSmokePath, "utf8");
const reviewControlsFixture = readJson(reviewControlsFixturePath);
const writeRouteContractFixture = readJson(writeRouteContractFixturePath);
const writeRouteImplementationFixture = readJson(writeRouteImplementationFixturePath);
const writeRouteValidationFixture = readJson(writeRouteValidationFixturePath);
const feedbackEventStoreFixture = readJson(feedbackEventStoreFixturePath);
const packageJson = readJson(packagePath);
const indexDoc = readFileSync(indexPath, "utf8");
const substrateDoc = readFileSync(substrateDocPath, "utf8");
const surfaceDoc = readFileSync(surfaceDocPath, "utf8");
const gateDoc = readFileSync(gateDocPath, "utf8");

const builderModule = await importBuilderModule();
const rebuiltContract = builderModule.buildFeedbackEventControlsUiContract(
  buildContractInput(),
);
const rebuiltContractAgain = builderModule.buildFeedbackEventControlsUiContract(
  buildContractInput(),
);

if (writeFixture) {
  writeFileSync(uiContractFixturePath, `${JSON.stringify(rebuiltContract, null, 2)}\n`);
  process.exit(0);
}

const uiContractFixture = readJson(uiContractFixturePath);

assertTypeAndBuilderContracts();
assertPackageScript();
assertStaticBoundary();
assertNoForbiddenImplementationPatterns();
assertNoRouteOrDbRuntimeInNewFiles();
assertDocsPointers();
assertBrowserValidationDownstreamPointer();
assertUiImplementationDownstreamPointer();

assert.deepEqual(
  rebuiltContract,
  uiContractFixture,
  "rebuilt Feedback Event controls UI contract fixture must match committed fixture",
);
assert.equal(
  rebuiltContract.contract_fingerprint,
  rebuiltContractAgain.contract_fingerprint,
  "UI contract fingerprint must be stable across repeated builds",
);
assertUiContract(uiContractFixture, builderModule);

console.log(
  JSON.stringify(
    {
      smoke: "feedback-event-controls-ui-contract-v0-1",
      final_status: "pass",
      contract_fingerprint: uiContractFixture.contract_fingerprint,
      route_path: uiContractFixture.route_path,
      route_method: uiContractFixture.route_method,
      control_binding_count: uiContractFixture.control_bindings.length,
      request_preview_count: uiContractFixture.request_previews.length,
      next_recommended_slice: uiContractFixture.next_recommended_slice,
      checked_no_component_or_route_change: true,
      checked_no_browser_request_or_feedback_persistence: true,
      checked_product_write_lane_parked: true,
    },
    null,
    2,
  ),
);

function assertTypeAndBuilderContracts() {
  for (const exportName of [
    "FeedbackEventControlsUiContract",
    "FeedbackEventControlsUiContractInput",
    "FeedbackEventControlUiBinding",
    "FeedbackEventControlUiRequestPreview",
    "FeedbackEventControlUiDisabledState",
    "FeedbackEventControlUiAuthorityBoundary",
    "FeedbackEventControlsUiValidationResult",
  ]) {
    assert.match(
      typeSource,
      new RegExp(`export\\s+(interface|type)\\s+${escapeRegExp(exportName)}\\b`),
      `type file must export ${exportName}`,
    );
  }
  for (const exportName of [
    "buildFeedbackEventControlsUiContract",
    "validateFeedbackEventControlsUiContract",
    "createFeedbackEventControlsUiContractFingerprint",
  ]) {
    assert.match(
      builderSource,
      new RegExp(`export\\s+function\\s+${escapeRegExp(exportName)}\\b`),
      `builder must export ${exportName}`,
    );
  }
  for (const requiredText of [
    "feedback_event_controls_ui_contract.v0.1",
    routePath,
    "feedback_event_write_route_request.v0.1",
    "ui_implemented_now",
    "components_changed_now",
    "route_changed_now",
    "browser_request_executed_now",
    "feedback_event_persisted_now",
    "request_sent_now",
    "route_response_observed_now",
    "feedback_event_written_now",
    "contract_only_no_ui_implementation",
    "retrieval_rag_authority",
    "source_fetch_authority",
    "product_write_authority",
    "product_id_allocation_authority",
    "product_write_lane_parked_by_686",
    recommendationStatus,
    nextRecommendedSlice,
  ]) {
    assert.ok(typeSource.includes(requiredText), `type source must include ${requiredText}`);
    assert.ok(
      builderSource.includes(requiredText),
      `builder source must include ${requiredText}`,
    );
  }
  assert.doesNotMatch(
    builderSource,
    /^import\s+(?!type\b)/m,
    "builder must keep runtime imports out",
  );
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
    .map(extractScriptName)
    .filter(Boolean)
    .sort();
  assert.deepEqual(
    addedScriptNames,
    downstreamUiImplementationSliceActive()
      ? [uiImplementationPackageScriptName]
      : [packageScriptName],
    "package additions must only include the active UI controls smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
}

function assertStaticBoundary() {
  const changedFiles = readChangedFiles();
  const requiredFiles = downstreamUiImplementationSliceActive()
    ? downstreamUiImplementationRequiredChangedFiles
    : expectedChangedFiles;
  const allowedFiles = downstreamUiImplementationSliceActive()
    ? downstreamUiImplementationAllowedChangedFiles
    : expectedChangedFiles;
  for (const expectedFile of requiredFiles) {
    assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      allowedFiles.includes(changedFile),
      `unexpected changed file in UI contract slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api files");
    if (!downstreamUiImplementationSliceActive()) {
      assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    } else if (changedFile.startsWith("components/")) {
      assert.ok(
        [uiImplementationComponentPath, foldedAuditPanelComponentPath].includes(changedFile),
        `downstream UI implementation may only change allowed component files: ${changedFile}`,
      );
    }
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /(^|\/)(schema|migration)\b/i);
    if (changedFile !== "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs") {
      assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
    }
  }
}

function assertNoForbiddenImplementationPatterns() {
  const changedSourceFiles = readChangedFiles().filter((filePath) =>
    filePath.endsWith(".mjs") || filePath.endsWith(".ts") || filePath.endsWith(".tsx"),
  );
  for (const filePath of changedSourceFiles) {
    if (
      downstreamUiImplementationSliceActive() &&
      [uiImplementationComponentPath, foldedAuditPanelComponentPath, uiImplementationSmokePath].includes(filePath)
    ) {
      continue;
    }
    const source = stripValidationText(readFileSync(filePath, "utf8"));
    for (const { label, regex } of [
      pattern(["from ", '"openai"']),
      pattern(["new ", "OpenAI"]),
      pattern(["fet", "ch", "("]),
      pattern(["XMLHttpRequest"]),
      pattern(["WebSocket"]),
      pattern(["EventSource"]),
      pattern(["sendBeacon"]),
      pattern(["localStorage"]),
      pattern(["sessionStorage"]),
      pattern(["indexedDB"]),
      pattern(["document", ".", "cookie"]),
      pattern(["api", ".", "github", ".", "com"]),
      pattern(["Octokit"]),
      { label: "codex-exec-command", regex: /\bcodex\s+exec\b/i },
      { label: "codex-run-command", regex: /\bcodex\s+run\b/i },
      { label: "gh-pr-command", regex: /\bgh\s+pr\b/i },
      { label: "next-dev-command", regex: /\bnext\s+dev\b/i },
      { label: "next-start-command", regex: /\bnext\s+start\b/i },
      { label: "proof-create", regex: /\bcreateProof\b|\binsertProof\b/ },
      { label: "evidence-create", regex: /\bcreateEvidence\b|\binsertEvidence\b/ },
      { label: "work-mutation", regex: /\bmutateWork\b|\bupdateWork\b/ },
      { label: "perspective-promotion", regex: /\bpromotePerspective\b/ },
    ]) {
      assert.doesNotMatch(source, regex, `${filePath} must not include ${label}`);
    }
  }
}

function assertNoRouteOrDbRuntimeInNewFiles() {
  for (const filePath of [typePath, builderPath, smokePath]) {
    const source = stripValidationText(readFileSync(filePath, "utf8"));
    for (const { label, regex } of [
      pattern(["better-sqlite3"]),
      pattern(["handleFeedbackEventWriteRouteRequest"]),
      pattern(["insertFeedbackEvent"]),
      pattern(["listFeedbackEvents"]),
      pattern(["feedbackEventStoreSchemaSql"]),
      pattern(["new ", "Database"]),
      { label: "route-module-import", regex: /import\([^)]*app\/api/i },
      { label: "component-import", regex: /from\s+["'].*components\//i },
    ]) {
      assert.doesNotMatch(source, regex, `${filePath} must not include ${label}`);
    }
  }
}

function assertDocsPointers() {
  for (const requiredText of [
    "Feedback Event controls UI contract v0.1",
    typePath,
    builderPath,
    uiContractFixturePath,
    smokePath,
    packageScriptName,
    "UI contract only",
    "no component change yet",
    "no browser request yet",
    "no feedback persisted now",
    "no proof/evidence/Perspective promotion/work mutation",
    "no Codex/GitHub automation/external handoff",
    "no provider/OpenAI/source-fetch/retrieval/RAG execution",
    "no product write/product IDs",
    nextRecommendedSlice,
  ]) {
    assert.ok(indexDoc.includes(requiredText), `index must include ${requiredText}`);
  }
  for (const doc of [substrateDoc, surfaceDoc, gateDoc]) {
    assert.match(doc, /Feedback Event controls UI contract/i);
    assert.match(doc, /request previews|future route requests|maps preview controls/i);
    assert.match(doc, /No UI control|No UI component|no UI component/i);
    assert.match(doc, /No browser request|no browser request/i);
    assert.match(doc, /No feedback|does not write feedback|non-persisting/i);
    assert.match(doc, /no provider\/OpenAI/i);
    assert.match(doc, /no source fetch|source-fetch/i);
    assert.match(doc, /no retrieval\/RAG execution/i);
    assert.match(doc, /no product write/i);
    assert.match(doc, /#686/);
    assert.match(doc, new RegExp(nextRecommendedSlice));
  }
}

function assertBrowserValidationDownstreamPointer() {
  for (const requiredText of [
    packageScriptName,
    nextRecommendedSlice,
    uiContractFixturePath,
    smokePath,
    recommendationStatus,
  ]) {
    assert.ok(
      browserValidationSmokeSource.includes(requiredText),
      `#699 browser validation smoke must allow UI contract text: ${requiredText}`,
    );
  }
  assert.equal(
    writeRouteValidationFixture.next_recommended_slice,
    browserValidationNextRecommendedSlice,
  );
  assert.equal(
    writeRouteValidationFixture.recommendation_status,
    browserValidationRecommendationStatus,
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
      `#700 UI contract smoke must allow UI implementation text: ${requiredText}`,
    );
  }
  assert.equal(
    uiContractFixture.next_recommended_slice,
    nextRecommendedSlice,
    "#700 UI contract output must remain unchanged",
  );
}

function assertUiContract(value, builderModule) {
  assert.equal(value.contract_kind, "feedback_event_controls_ui_contract");
  assert.equal(value.contract_version, "feedback_event_controls_ui_contract.v0.1");
  assert.equal(value.route_path, routePath);
  assert.equal(value.route_method, routeMethod);
  assert.equal(value.ui_implemented_now, false);
  assert.equal(value.components_changed_now, false);
  assert.equal(value.route_changed_now, false);
  assert.equal(value.browser_request_executed_now, false);
  assert.equal(value.feedback_event_persisted_now, false);
  assert.equal(value.control_bindings.length, 4);
  assert.equal(value.request_previews.length, 4);
  assert.deepEqual(
    value.control_bindings.map((binding) => binding.control_kind).sort(),
    [...requiredControlKinds].sort(),
  );
  assert.deepEqual(
    value.request_previews.map((preview) => preview.event_type).sort(),
    [...requiredControlKinds].sort(),
  );
  for (const binding of value.control_bindings) {
    assert.equal(binding.disabled_now, true);
    assert.equal(binding.preview_only_now, true);
    assert.equal(binding.ui_component_added_now, false);
    assert.equal(binding.browser_request_sent_now, false);
    assert.equal(binding.feedback_event_persisted_now, false);
    assert.equal(binding.requires_operator_click, true);
    assert.equal(binding.requires_authority_acknowledgements, true);
    assert.equal(binding.route_path, routePath);
    assert.equal(binding.route_method, routeMethod);
  }
  for (const requestPreview of value.request_previews) {
    assert.equal(requestPreview.request_sent_now, false);
    assert.equal(requestPreview.route_response_observed_now, false);
    assert.equal(requestPreview.feedback_event_written_now, false);
    assert.equal(requestPreview.request_valid_for_route_contract, true);
    assertAuthorityAcknowledgements(requestPreview.authority_acknowledgements);
    assertSourceRefsResolve(requestPreview.source_ref_ids, requestPreview.reason_placeholder);
  }
  const correctRequest = value.request_previews.find(
    (requestPreview) => requestPreview.event_type === "correct_preview",
  );
  assert.ok(correctRequest?.correction_text_placeholder);
  assert.equal(value.disabled_state_policy.all_controls_disabled_now, true);
  assert.equal(value.disabled_state_policy.reason, "contract_only_no_ui_implementation");
  assert.deepEqual(value.disabled_state_policy.future_enablement_requires, [
    "feedback_event_controls_ui_implementation_v0_1",
    "route_validation_passed",
    "explicit_operator_click",
    "no_forbidden_authority_requested",
  ]);
  assertAuthorityAcknowledgements(
    value.authority_acknowledgement_policy.required_acknowledgements,
  );
  assert.equal(
    value.authority_acknowledgement_policy.every_request_preview_requires_all_acknowledgements,
    true,
  );
  assert.equal(
    value.authority_acknowledgement_policy.missing_acknowledgement_refusal_code,
    "missing_authority_acknowledgement",
  );
  assert.equal(value.error_display_policy.no_error_display_component_added_now, true);
  assert.equal(
    value.source_ref_policy.repo_local_source_refs_required_or_explicitly_justified,
    true,
  );
  assertAuthorityBoundary(value.authority_boundary);
  assert.equal(value.validation.passed, true);
  assert.deepEqual(value.validation.failure_codes, []);
  assert.equal(
    builderModule.validateFeedbackEventControlsUiContract(value).passed,
    true,
  );
  assert.equal(value.recommendation_status, recommendationStatus);
  assert.equal(value.next_recommended_slice, nextRecommendedSlice);
  assert.equal(value.fingerprint_algorithm, "fnv1a32_canonical_json");
  assert.equal(
    value.contract_fingerprint,
    builderModule.createFeedbackEventControlsUiContractFingerprint(value),
  );
  assertSourceRefsResolve(
    value.control_bindings.flatMap((binding) => {
      const requestPreview = value.request_previews.find(
        (preview) => preview.request_preview_id === binding.request_preview_id,
      );
      return requestPreview?.source_ref_ids ?? [];
    }),
    "control binding source refs must resolve",
  );
}

function assertAuthorityAcknowledgements(acknowledgements) {
  for (const acknowledgement of requiredAuthorityAcknowledgements) {
    assert.ok(
      acknowledgements.includes(acknowledgement),
      `request preview must include ${acknowledgement}`,
    );
  }
}

function assertAuthorityBoundary(boundary) {
  assert.equal(boundary.contract_only, true);
  assert.equal(boundary.product_write_lane_parked_by_686, true);
  for (const forbiddenKey of [
    "ui_implemented_now",
    "components_changed_now",
    "route_changed_now",
    "browser_request_executed_now",
    "feedback_event_persisted_now",
    "production_db_used_now",
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

function assertSourceRefsResolve(sourceRefIds, reason) {
  if (sourceRefIds.length === 0) {
    assert.ok(reason && reason.trim(), "empty source refs require an explicit reason");
    return;
  }
  for (const sourceRefId of sourceRefIds) {
    if (
      repoLocalSourceRefPrefixes.some((prefix) => sourceRefId.startsWith(prefix))
    ) {
      const filePath = sourceRefId.split("#")[0];
      assert.ok(existsSync(filePath), `repo-local source_ref_id must exist: ${sourceRefId}`);
      continue;
    }
    if (sourceRefId.startsWith("pr:")) {
      assert.ok(
        allowedExternalLineageSourceRefs.has(sourceRefId),
        `external lineage source_ref_id must be allowlisted: ${sourceRefId}`,
      );
      continue;
    }
    assert.fail(`unresolved source_ref_id without allowlist: ${sourceRefId}`);
  }
}

function buildContractInput() {
  return {
    reviewControlsPreview: reviewControlsFixture,
    writeRouteContract: writeRouteContractFixture,
    writeRouteImplementationFixture,
    writeRouteBrowserValidation: writeRouteValidationFixture,
    feedbackEventStoreFixture,
    scope: "project:augnes",
    as_of:
      "fixture:research-candidate-review.feedback-event-controls-ui-contract.sample.v0.1",
  };
}

async function importBuilderModule() {
  const transformedSource = stripTypeScriptTypes(builderSource, {
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

function stripValidationText(source) {
  return source
    .split("\n")
    .filter((line) => !line.includes("authority_boundary"))
    .filter((line) => !line.includes("source_fetch"))
    .filter((line) => !line.includes("retrieval"))
    .filter((line) => !line.includes("provider"))
    .filter((line) => !line.includes("OpenAI"))
    .filter((line) => !line.includes("Codex"))
    .filter((line) => !line.includes("GitHub"))
    .filter((line) => !line.includes("external"))
    .filter((line) => !line.includes("product"))
    .filter((line) => !line.includes("proof"))
    .filter((line) => !line.includes("evidence"))
    .filter((line) => !line.includes("Perspective"))
    .filter((line) => !line.includes("browser_request"))
    .filter((line) => !line.includes("browser persistence"))
    .filter((line) => !line.includes("app_server"))
    .filter((line) => !line.includes("doesNotMatch"))
    .filter((line) => !line.includes("pattern(["))
    .join("\n");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function pattern(parts, prefix = "", suffix = "", flags = "") {
  const label = parts.join("");
  return {
    label,
    regex: new RegExp(`${prefix}${parts.map(escapeRegExp).join("")}${suffix}`, flags),
  };
}

function downstreamUiImplementationSliceActive() {
  const changedFiles = readChangedFiles();
  return downstreamUiImplementationRequiredChangedFiles.every((filePath) =>
    changedFiles.includes(filePath),
  );
}
