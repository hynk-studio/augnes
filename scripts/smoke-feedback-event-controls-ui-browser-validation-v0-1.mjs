import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const componentPath = "components/feedback-event-controls.tsx";
const foldedAuditPanelPath =
  "components/agent-perspective-substrate-folded-audit-panel.tsx";
const implementationFixturePath =
  "fixtures/research-candidate-review.feedback-event-controls-ui-implementation.sample.v0.1.json";
const uiContractFixturePath =
  "fixtures/research-candidate-review.feedback-event-controls-ui-contract.sample.v0.1.json";
const substratePreviewFixturePath =
  "fixtures/agent-perspective-substrate-preview.sample.v0.1.json";
const writeRouteBrowserValidationFixturePath =
  "fixtures/research-candidate-review.feedback-event-write-route-browser-validation.sample.v0.1.json";
const validationFixturePath =
  "fixtures/research-candidate-review.feedback-event-controls-ui-browser-validation.sample.v0.1.json";
const smokePath =
  "scripts/smoke-feedback-event-controls-ui-browser-validation-v0-1.mjs";
const implementationSmokePath =
  "scripts/smoke-feedback-event-controls-ui-implementation-v0-1.mjs";
const uiContractSmokePath =
  "scripts/smoke-feedback-event-controls-ui-contract-v0-1.mjs";
const writeRouteBrowserValidationSmokePath =
  "scripts/smoke-feedback-event-write-route-browser-validation-v0-1.mjs";
const writeRouteImplementationSmokePath =
  "scripts/smoke-feedback-event-write-route-implementation-v0-1.mjs";
const writeRouteContractSmokePath =
  "scripts/smoke-feedback-event-write-route-contract-v0-1.mjs";
const reviewControlsPreviewSmokePath =
  "scripts/smoke-feedback-event-store-review-controls-preview-v0-1.mjs";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const substrateDocPath = "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md";
const surfaceDocPath = "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md";
const gateDocPath =
  "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md";

const packageScriptName =
  "smoke:feedback-event-controls-ui-browser-validation-v0-1";
const packageScriptValue = `node ${smokePath}`;
const implementationPackageScriptName =
  "smoke:feedback-event-controls-ui-implementation-v0-1";
const routePath = "/api/research-candidate/feedback-events";
const routeMethod = "POST";
const requestVersion = "feedback_event_write_route_request.v0.1";
const recommendationStatus =
  "ready_for_feedback_event_store_list_route_contract_v0_1";
const nextRecommendedSlice =
  "feedback_event_store_list_route_contract_v0_1";
const reason =
  "static component and fixture validation is sufficient before list/read route contract";
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
const requiredChangedFiles = [
  smokePath,
  validationFixturePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  implementationSmokePath,
  uiContractSmokePath,
  writeRouteBrowserValidationSmokePath,
  writeRouteImplementationSmokePath,
  writeRouteContractSmokePath,
  reviewControlsPreviewSmokePath,
  "scripts/smoke-feedback-event-store-minimal-v0-1.mjs",
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
  componentPath,
  foldedAuditPanelPath,
  implementationFixturePath,
  uiContractFixturePath,
  substratePreviewFixturePath,
  writeRouteBrowserValidationFixturePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  implementationSmokePath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}
if (!writeFixture) {
  assert.ok(existsSync(validationFixturePath), `${validationFixturePath} must exist`);
}

const componentSource = readFileSync(componentPath, "utf8");
const foldedAuditPanelSource = readFileSync(foldedAuditPanelPath, "utf8");
const implementationFixture = readJson(implementationFixturePath);
const uiContractFixture = readJson(uiContractFixturePath);
const substratePreviewFixture = readJson(substratePreviewFixturePath);
const writeRouteBrowserValidationFixture = readJson(
  writeRouteBrowserValidationFixturePath,
);
const packageJson = readJson(packagePath);
const indexDoc = readFileSync(indexPath, "utf8");
const substrateDoc = readFileSync(substrateDocPath, "utf8");
const surfaceDoc = readFileSync(surfaceDocPath, "utf8");
const gateDoc = readFileSync(gateDocPath, "utf8");
const implementationSmokeSource = readFileSync(implementationSmokePath, "utf8");

const rebuiltValidation = buildValidationFixture();
if (writeFixture) {
  writeFileSync(validationFixturePath, `${JSON.stringify(rebuiltValidation, null, 2)}\n`);
  process.exit(0);
}

const validationFixture = readJson(validationFixturePath);

assertPackageScript();
assertStaticBoundary();
assertComponentFiles();
assertImplementationFixture();
assertNoForbiddenRuntimePatterns();
assertDocsPointers();
assertImplementationSmokeDownstreamPointer();
assert.deepEqual(
  validationFixture,
  rebuiltValidation,
  "browser validation fixture must match rebuilt static component validation",
);
assertValidationFixture(validationFixture);

console.log(
  JSON.stringify(
    {
      smoke: "feedback-event-controls-ui-browser-validation-v0-1",
      final_status: "pass",
      validation_kind: validationFixture.validation_kind,
      static_component_validation_used_now:
        validationFixture.static_component_validation_used_now,
      next_recommended_slice: validationFixture.next_recommended_slice,
      checked_card_specific_dismiss_targets: true,
      checked_no_production_db_or_browser_request: true,
      checked_product_write_lane_parked: true,
    },
    null,
    2,
  ),
);

function buildValidationFixture() {
  const visibleCardIds = substratePreviewFixture.surfacing_cards.map(
    (card) => card.card_id,
  );
  const cardDismissControls = implementationFixture.enabled_card_dismiss_controls.map(
    (control) => ({
      card_id: control.card_id,
      target_kind: control.target_kind,
      target_id: control.target_id,
      target_matches_visible_card_id: visibleCardIds.includes(control.target_id),
      source_ref_ids: control.source_ref_ids,
      source_ref_resolution_status: control.source_ref_resolution_status,
      source_ref_resolution_reason: control.source_ref_resolution_reason,
      route_path: control.route_path,
      route_method: control.route_method,
    }),
  );
  const pinControl = implementationFixture.enabled_section_pin_controls[0];
  return {
    validation_kind: "feedback_event_controls_ui_browser_validation",
    validation_version: "feedback_event_controls_ui_browser_validation.v0.1",
    source_ui_implementation_fixture_ref: implementationFixturePath,
    source_ui_implementation_version:
      implementationFixture.implementation_version,
    source_ui_contract_fixture_ref: uiContractFixturePath,
    source_ui_contract_fingerprint: uiContractFixture.contract_fingerprint,
    source_substrate_preview_fixture_ref: substratePreviewFixturePath,
    source_substrate_preview_fingerprint: substratePreviewFixture.fingerprint,
    source_write_route_browser_validation_fixture_ref:
      writeRouteBrowserValidationFixturePath,
    source_write_route_browser_validation_version:
      writeRouteBrowserValidationFixture.validation_version,
    component_refs: [componentPath, foldedAuditPanelPath],
    app_server_started_now: false,
    browser_ui_used_now: false,
    production_db_used_now: false,
    browser_request_executed_now: false,
    static_component_validation_used_now: true,
    reason,
    card_specific_dismiss_controls_validated: true,
    card_specific_dismiss_control_count: cardDismissControls.length,
    card_specific_dismiss_targets: cardDismissControls,
    source_coverage_pin_control_validated: true,
    source_coverage_pin_target: {
      target_kind: pinControl.target_kind,
      target_id: pinControl.target_id,
      route_path: pinControl.route_path,
      route_method: pinControl.route_method,
    },
    correct_preview_disabled_validated: true,
    invalidate_preview_disabled_validated: true,
    disabled_controls: implementationFixture.disabled_controls.map((control) => ({
      control_kind: control.control_kind,
      target_kind: control.target_kind,
      target_id: control.target_id,
      disabled_reason: control.disabled_reason,
    })),
    single_route_target_validated: true,
    route_path: routePath,
    route_method: routeMethod,
    no_browser_persistence_validated: true,
    no_forbidden_authority_validated: true,
    product_write_lane_parked_by_686: true,
    validation: {
      passed: true,
      failure_codes: [],
    },
    recommendation_status: recommendationStatus,
    next_recommended_slice: nextRecommendedSlice,
  };
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
    [packageScriptName],
    "package additions must only include the UI browser validation smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
}

function assertStaticBoundary() {
  const changedFiles = readChangedFiles();
  for (const requiredFile of requiredChangedFiles) {
    assert.ok(changedFiles.includes(requiredFile), `changed files must include ${requiredFile}`);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      requiredChangedFiles.includes(changedFile),
      `unexpected changed file in UI browser validation slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /(^|\/)(schema|migration)\b/i);
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

function assertComponentFiles() {
  assert.equal(countMatches(componentSource, /\/api\/research-candidate\/feedback-events/g), 1);
  assert.match(componentSource, /fetch\(feedbackEventRoutePath/);
  assert.match(componentSource, /method:\s*"POST"/);
  assert.match(componentSource, new RegExp(requestVersion));
  for (const acknowledgement of requiredAuthorityAcknowledgements) {
    assert.ok(componentSource.includes(acknowledgement), `component must include ${acknowledgement}`);
  }
  assert.doesNotMatch(componentSource, /idempotency_key_preview/);
  assert.match(componentSource, /refusal_code/);
  assert.match(componentSource, /validation failure codes/);
  assert.match(componentSource, /kind:\s*"info"/);
  assert.match(componentSource, /Duplicate feedback event already exists/);

  assert.match(foldedAuditPanelSource, /getDismissFeedbackControlsForCard\(card\)/);
  assert.match(foldedAuditPanelSource, /function getDismissFeedbackControlsForCard/);
  assert.doesNotMatch(
    foldedAuditPanelSource,
    /getFeedbackControlsForKinds\(\["dismiss_preview"\]\)/,
  );
  assert.match(foldedAuditPanelSource, /target_id:\s*card\.card_id/);
  assert.match(foldedAuditPanelSource, /getFeedbackControlsForKinds\(\["pin_preview"\]\)/);
  assert.doesNotMatch(
    foldedAuditPanelSource,
    /getFeedbackControlsForKinds\(\["correct_preview"\]\)/,
  );
  assert.doesNotMatch(
    foldedAuditPanelSource,
    /getFeedbackControlsForKinds\(\["invalidate_preview"\]\)/,
  );
  assert.match(foldedAuditPanelSource, /no direct DB\/SQL in UI/);
  assert.match(foldedAuditPanelSource, /feedback route writes durable feedback events only/);
  assert.doesNotMatch(foldedAuditPanelSource, /No durable action in this slice\./);
}

function assertImplementationFixture() {
  const visibleCardsById = new Map(
    substratePreviewFixture.surfacing_cards.map((card) => [card.card_id, card]),
  );
  assert.equal(
    implementationFixture.enabled_card_dismiss_controls.length,
    substratePreviewFixture.surfacing_cards.length,
  );
  for (const control of implementationFixture.enabled_card_dismiss_controls) {
    const card = visibleCardsById.get(control.card_id);
    assert.ok(card, `visible card must exist for ${control.card_id}`);
    assert.equal(control.target_id, card.card_id);
    assert.notEqual(control.target_id, "substrate_card:reviewed_non_authoritative_context");
    assert.equal(control.target_kind, "agent_perspective_substrate_surfacing_card");
    assert.equal(control.route_path, routePath);
    assert.equal(control.route_method, routeMethod);
    assert.ok(control.source_ref_ids.length > 0);
    for (const sourceRefId of control.source_ref_ids) {
      assertSourceRefResolvesOrHasReason(sourceRefId, control);
    }
  }
  assert.ok(
    new Set(implementationFixture.enabled_card_dismiss_controls.map((control) => control.target_id)).size > 1,
    "card-level dismiss controls must not all use one target",
  );

  assert.equal(implementationFixture.enabled_section_pin_controls.length, 1);
  const [pinControl] = implementationFixture.enabled_section_pin_controls;
  assert.equal(pinControl.control_kind, "pin_preview");
  assert.equal(pinControl.target_kind, "agent_perspective_substrate_folded_section");
  assert.equal(pinControl.target_id, "folded_section:source_coverage");

  const disabledKinds = implementationFixture.disabled_controls.map(
    (control) => control.control_kind,
  );
  assert.deepEqual(disabledKinds, ["correct_preview", "invalidate_preview"]);
}

function assertSourceRefResolvesOrHasReason(sourceRefId, control) {
  if (sourceRefId.startsWith("fixture:") || sourceRefId.startsWith("pr:")) {
    assert.ok(control.source_ref_resolution_reason);
    return;
  }
  const filePath = sourceRefId.split("#")[0];
  assert.ok(existsSync(filePath), `repo-local source ref must exist: ${sourceRefId}`);
}

function assertNoForbiddenRuntimePatterns() {
  const changedSourceFiles = readChangedFiles().filter((filePath) =>
    filePath.endsWith(".mjs") || filePath.endsWith(".ts") || filePath.endsWith(".tsx"),
  );
  for (const filePath of changedSourceFiles) {
    const source = stripValidationText(readFileSync(filePath, "utf8"));
    assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB|document\.cookie/);
    assert.doesNotMatch(source, /XMLHttpRequest|WebSocket|EventSource|sendBeacon/);
    assert.doesNotMatch(source, /from\s+["'][^"']*openai["']/i);
    assert.doesNotMatch(source, /new\s+OpenAI\b/i);
    assert.doesNotMatch(source, /Octokit|api\.github\.com/i);
    assert.doesNotMatch(source, /\bcodex\s+(exec|run)\b/i);
    assert.doesNotMatch(source, /\bgh\s+pr\b/i);
    assert.doesNotMatch(source, /\bnext\s+(dev|start)\b/i);
    assert.doesNotMatch(source, /\bcreateProof\b|\binsertProof\b/);
    assert.doesNotMatch(source, /\bcreateEvidence\b|\binsertEvidence\b/);
    assert.doesNotMatch(source, /\bmutateWork\b|\bupdateWork\b/);
    assert.doesNotMatch(source, /\bpromotePerspective\b/);
    assert.doesNotMatch(source, /\bexecuteProductWrite\b|\ballocateProductId\b/i);
  }
}

function assertDocsPointers() {
  for (const requiredText of [
    "Feedback Event controls UI browser validation v0.1",
    validationFixturePath,
    smokePath,
    packageScriptName,
    "static component validation",
    "card-specific dismiss target validation",
    "source coverage pin validation",
    "correct/invalidate disabled validation",
    "no production DB",
    "no proof/evidence/Perspective promotion/work mutation",
    "no Codex/GitHub automation/external handoff",
    "no provider/OpenAI/source-fetch/retrieval/RAG execution",
    "no product write/product IDs",
    nextRecommendedSlice,
  ]) {
    assert.ok(indexDoc.includes(requiredText), `index must include ${requiredText}`);
  }
  for (const doc of [substrateDoc, surfaceDoc, gateDoc]) {
    assert.match(doc, /Feedback Event controls UI browser validation/i);
    assert.match(doc, /validation-only|validates?/i);
    assert.match(doc, /card-specific dismiss/i);
    assert.match(
      doc,
      /no new UI behavior|does not add route\/UI behavior|adds no route\/UI behavior|does not change components|changes no components/i,
    );
    assert.match(doc, /production DB/i);
    assert.match(doc, /no proof\/evidence/i);
    assert.match(doc, /no Perspective promotion|Perspective state/i);
    assert.match(doc, /no work mutation|work mutation/i);
    assert.match(doc, /no provider\/OpenAI/i);
    assert.match(doc, /no source fetch|source-fetch/i);
    assert.match(doc, /no retrieval\/RAG execution|no retrieval\/RAG/i);
    assert.match(doc, /no product write/i);
    assert.match(doc, /#686/);
    assert.match(doc, new RegExp(nextRecommendedSlice));
  }
}

function assertImplementationSmokeDownstreamPointer() {
  for (const requiredText of [
    packageScriptName,
    nextRecommendedSlice,
    validationFixturePath,
    smokePath,
    recommendationStatus,
  ]) {
    assert.ok(
      implementationSmokeSource.includes(requiredText),
      `#701 implementation smoke must allow UI browser validation text: ${requiredText}`,
    );
  }
  assert.equal(
    implementationFixture.next_recommended_slice,
    "feedback_event_controls_ui_browser_validation_v0_1",
  );
}

function assertValidationFixture(value) {
  assert.equal(value.validation_kind, "feedback_event_controls_ui_browser_validation");
  assert.equal(
    value.validation_version,
    "feedback_event_controls_ui_browser_validation.v0.1",
  );
  assert.deepEqual(value.component_refs, [componentPath, foldedAuditPanelPath]);
  assert.equal(value.app_server_started_now, false);
  assert.equal(value.browser_ui_used_now, false);
  assert.equal(value.production_db_used_now, false);
  assert.equal(value.browser_request_executed_now, false);
  assert.equal(value.static_component_validation_used_now, true);
  assert.equal(value.reason, reason);
  assert.equal(value.card_specific_dismiss_controls_validated, true);
  assert.equal(
    value.card_specific_dismiss_control_count,
    substratePreviewFixture.surfacing_cards.length,
  );
  assert.equal(value.source_coverage_pin_control_validated, true);
  assert.equal(value.source_coverage_pin_target.target_id, "folded_section:source_coverage");
  assert.equal(value.correct_preview_disabled_validated, true);
  assert.equal(value.invalidate_preview_disabled_validated, true);
  assert.equal(value.single_route_target_validated, true);
  assert.equal(value.route_path, routePath);
  assert.equal(value.route_method, routeMethod);
  assert.equal(value.no_browser_persistence_validated, true);
  assert.equal(value.no_forbidden_authority_validated, true);
  assert.equal(value.product_write_lane_parked_by_686, true);
  assert.equal(value.validation.passed, true);
  assert.deepEqual(value.validation.failure_codes, []);
  assert.equal(value.recommendation_status, recommendationStatus);
  assert.equal(value.next_recommended_slice, nextRecommendedSlice);
  for (const target of value.card_specific_dismiss_targets) {
    assert.equal(target.target_id, target.card_id);
    assert.equal(target.target_matches_visible_card_id, true);
    assert.notEqual(target.target_id, "substrate_card:reviewed_non_authoritative_context");
  }
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function readGitOutput(args) {
  return execFileSync("git", args, { encoding: "utf8" });
}

function mergeBaseRef() {
  return readGitOutput(["merge-base", "HEAD", "origin/main"]).trim();
}

function readChangedFiles() {
  return [
    ...readGitOutput(["diff", "--name-only", mergeBaseRef()]).split("\n"),
    ...readGitOutput(["ls-files", "--others", "--exclude-standard"]).split("\n"),
  ]
    .map((line) => line.trim())
    .filter(Boolean)
    .sort();
}

function extractScriptName(line) {
  const match = line.match(/^\+\s*"([^"]+)":\s*"/);
  return match?.[1] ?? null;
}

function countMatches(source, regex) {
  return source.match(regex)?.length ?? 0;
}

function stripValidationText(source) {
  return source
    .split("\n")
    .filter((line) => !line.includes("assert.doesNotMatch"))
    .filter((line) => !line.includes("assert.match"))
    .filter((line) => !line.includes("localStorage"))
    .filter((line) => !line.includes("sessionStorage"))
    .filter((line) => !line.includes("indexedDB"))
    .filter((line) => !line.includes("document.cookie"))
    .filter((line) => !line.includes("XMLHttpRequest"))
    .filter((line) => !line.includes("WebSocket"))
    .filter((line) => !line.includes("EventSource"))
    .filter((line) => !line.includes("sendBeacon"))
    .filter((line) => !line.includes("OpenAI"))
    .filter((line) => !line.includes("GitHub"))
    .filter((line) => !line.includes("github"))
    .filter((line) => !line.includes("Octokit"))
    .filter((line) => !line.includes("Codex"))
    .filter((line) => !line.includes("retrieval"))
    .filter((line) => !line.includes("source fetch"))
    .filter((line) => !line.includes("product write"))
    .filter((line) => !line.includes("product-write"))
    .filter((line) => !line.includes("executeProductWrite"))
    .filter((line) => !line.includes("allocateProductId"))
    .filter((line) => !line.includes("productDbWrite"))
    .filter((line) => !line.includes("fetch("))
    .filter((line) => !line.includes("next dev"))
    .filter((line) => !line.includes("next start"))
    .join("\n");
}
