import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import acceptedCandidateDraft from "../lib/perspective-ingest/codex-former-local-adapter-accepted-candidate-draft.ts";
import candidateDraftList from "../lib/perspective-ingest/codex-former-local-adapter-candidate-draft-list.ts";
import localValidateBridge from "../lib/perspective-ingest/codex-former-local-adapter-operator-flow-local-validate.ts";
import operatorFlow from "../lib/perspective-ingest/codex-former-local-adapter-operator-flow.ts";
import memoryReviewQueue from "../lib/perspective-ingest/perspective-memory-local-review-queue.ts";

const {
  CODEX_FORMER_LOCAL_ADAPTER_CANDIDATE_DRAFT_LIST_MAX_DRAFTS,
  CODEX_FORMER_LOCAL_ADAPTER_CANDIDATE_DRAFT_LIST_STORAGE_NAMESPACE,
  CODEX_FORMER_LOCAL_ADAPTER_CANDIDATE_DRAFT_LIST_VERSION,
  appendCodexFormerLocalAdapterCandidateDraftToList,
  clearCodexFormerLocalAdapterCandidateDraftListFromStorage,
  collectCodexFormerLocalAdapterCandidateDraftListUnsafeMarkers,
  createEmptyCodexFormerLocalAdapterCandidateDraftList,
  getCodexFormerLocalAdapterCandidateDraftCurrentStatus,
  loadCodexFormerLocalAdapterCandidateDraftListFromStorage,
  removeCodexFormerLocalAdapterCandidateDraftFromList,
  replaceCodexFormerLocalAdapterCandidateDraftInList,
  saveCodexFormerLocalAdapterCandidateDraftListToStorage,
  safeParseCodexFormerLocalAdapterCandidateDraftList,
} = candidateDraftList;
const {
  PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_ITEM_VERSION,
  PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_MAX_ITEMS,
  PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_ROUTE,
  PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_STORAGE_NAMESPACE,
  PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_VERSION,
  appendPerspectiveMemoryLocalReviewQueueItem,
  buildPerspectiveMemoryLocalReviewQueueItemFromCandidateDraft,
  canBuildPerspectiveMemoryLocalReviewQueueItemFromCandidateDraft,
  clearPerspectiveMemoryLocalReviewQueueFromStorage,
  collectPerspectiveMemoryLocalReviewQueueUnsafeMarkers,
  createEmptyPerspectiveMemoryLocalReviewQueue,
  findPerspectiveMemoryLocalReviewQueueItemBySourceDraft,
  getPerspectiveMemoryLocalReviewQueueItemSourceState,
  loadPerspectiveMemoryLocalReviewQueueFromStorage,
  removePerspectiveMemoryLocalReviewQueueItem,
  savePerspectiveMemoryLocalReviewQueueToStorage,
  safeParsePerspectiveMemoryLocalReviewQueue,
  updatePerspectiveMemoryLocalReviewQueueItemStatus,
} = memoryReviewQueue;
const {
  CODEX_FORMER_LOCAL_ADAPTER_ACCEPTED_CANDIDATE_DRAFT_STORAGE_NAMESPACE,
  CODEX_FORMER_LOCAL_ADAPTER_ACCEPTED_CANDIDATE_DRAFT_VERSION,
  buildCodexFormerLocalAdapterAcceptedCandidateDraft,
  canBuildCodexFormerLocalAdapterAcceptedCandidateDraft,
  clearCodexFormerLocalAdapterAcceptedCandidateDraftFromStorage,
  collectAcceptedCandidateDraftUnsafeMarkers,
  isCodexFormerLocalAdapterAcceptedCandidateDraftStale,
  loadCodexFormerLocalAdapterAcceptedCandidateDraftFromStorage,
  saveCodexFormerLocalAdapterAcceptedCandidateDraftToStorage,
  safeParseCodexFormerLocalAdapterAcceptedCandidateDraft,
} = acceptedCandidateDraft;
const { runOperatorFlowLocalValidationBridge } = localValidateBridge;
const {
  CODEX_FORMER_LOCAL_ADAPTER_OPERATOR_FLOW_ROUTE,
  CODEX_FORMER_LOCAL_ADAPTER_OPERATOR_FLOW_VALIDATE_ROUTE,
  CODEX_FORMER_LOCAL_ADAPTER_OPERATOR_FLOW_STORAGE_NAMESPACE,
  buildCodexFormerLocalAdapterOperatorFlowViewModel,
  clearOperatorFlowDraftFromStorage,
  createInitialOperatorFlowDraft,
  loadOperatorFlowDraftFromStorage,
  operatorFlowCandidateActions,
  operatorFlowReturnedEnvelopeFixtureKeys,
  previewOperatorFlowValidationResult,
  saveOperatorFlowDraftToStorage,
  safeParseOperatorFlowDraft,
} = operatorFlow;

const packageFile = "package.json";
const routeFile =
  "app/cockpit/perspective/codex-former/local-adapter-operator-flow/page.tsx";
const componentFile =
  "app/cockpit/perspective/codex-former/local-adapter-operator-flow/operator-flow-surface.tsx";
const cssFile =
  "app/cockpit/perspective/codex-former/local-adapter-operator-flow/operator-flow-surface.module.css";
const helperFile =
  "lib/perspective-ingest/codex-former-local-adapter-operator-flow.ts";
const localValidateBridgeFile =
  "lib/perspective-ingest/codex-former-local-adapter-operator-flow-local-validate.ts";
const acceptedCandidateDraftFile =
  "lib/perspective-ingest/codex-former-local-adapter-accepted-candidate-draft.ts";
const candidateDraftListFile =
  "lib/perspective-ingest/codex-former-local-adapter-candidate-draft-list.ts";
const memoryReviewQueueFile =
  "lib/perspective-ingest/perspective-memory-local-review-queue.ts";
const localValidateRouteFile =
  "app/api/perspective/codex-former/local-adapter-operator-flow/validate/route.ts";
const memoryReviewQueueRouteFile =
  "app/cockpit/perspective/memory-review-queue/local/page.tsx";
const memoryReviewQueueComponentFile =
  "app/cockpit/perspective/memory-review-queue/local/local-memory-review-queue-surface.tsx";
const memoryReviewQueueCssFile =
  "app/cockpit/perspective/memory-review-queue/local/local-memory-review-queue-surface.module.css";
const smokeFile =
  "scripts/smoke-perspective-codex-former-local-adapter-operator-flow.mjs";
const memoryReviewQueueSmokeFile =
  "scripts/smoke-perspective-memory-local-review-queue.mjs";
const browserSmokeFile =
  "scripts/browser-smoke-perspective-codex-former-local-adapter-operator-flow.mjs";
const memoryReviewQueueBrowserSmokeFile =
  "scripts/browser-smoke-perspective-memory-local-review-queue.mjs";
const docFile =
  "docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_OPERATOR_FLOW_V0_1.md";
const memoryReviewQueueDocFile =
  "docs/PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_V0_1.md";
const reportFile =
  "reports/2026-06-12-perspective-codex-former-local-adapter-operator-flow.md";
const memoryReviewQueueReportFile =
  "reports/2026-06-13-perspective-memory-local-review-queue.md";
const browserReportFile =
  "reports/browser/2026-06-12-perspective-codex-former-local-adapter-operator-flow.md";
const memoryReviewQueueBrowserReportFile =
  "reports/browser/2026-06-13-perspective-memory-local-review-queue.md";

const sourcePassFile =
  "reports/fixtures/2026-06-12-codex-former-local-adapter-source-input-pass.json";
const sourceFollowUpFile =
  "reports/fixtures/2026-06-11-codex-former-local-adapter-source-input.json";
const preparePassFile =
  "reports/fixtures/2026-06-12-codex-former-local-adapter-prepare-execution-summary-pass.json";
const prepareFollowUpFile =
  "reports/fixtures/2026-06-12-codex-former-local-adapter-prepare-execution-summary-pass-with-follow-up.json";
const validatePassFile =
  "reports/fixtures/2026-06-12-codex-former-local-adapter-validate-execution-summary-pass.json";
const validateFollowUpFile =
  "reports/fixtures/2026-06-12-codex-former-local-adapter-validate-execution-summary-pass-with-follow-up.json";
const validateBlockedFile =
  "reports/fixtures/2026-06-12-codex-former-local-adapter-validate-execution-summary-blocked.json";
const returnedPassFile =
  "reports/fixtures/2026-06-12-codex-former-local-adapter-returned-candidate-envelope-pass.txt";
const returnedFollowUpFile =
  "reports/fixtures/2026-06-12-codex-former-local-adapter-returned-candidate-envelope-ready.txt";
const returnedBlockedFile =
  "reports/fixtures/2026-06-12-codex-former-local-adapter-returned-candidate-envelope-blocked.txt";
const expectedTsxCommand =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json";

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const routeText = readFileSync(routeFile, "utf8");
const componentText = readFileSync(componentFile, "utf8");
const cssText = readFileSync(cssFile, "utf8");
const helperText = readFileSync(helperFile, "utf8");
const localValidateBridgeText = readFileSync(localValidateBridgeFile, "utf8");
const acceptedCandidateDraftText = readFileSync(
  acceptedCandidateDraftFile,
  "utf8",
);
const candidateDraftListText = readFileSync(candidateDraftListFile, "utf8");
const memoryReviewQueueText = readFileSync(memoryReviewQueueFile, "utf8");
const localValidateRouteText = readFileSync(localValidateRouteFile, "utf8");
const memoryReviewQueueRouteText = readFileSync(
  memoryReviewQueueRouteFile,
  "utf8",
);
const memoryReviewQueueComponentText = readFileSync(
  memoryReviewQueueComponentFile,
  "utf8",
);
const memoryReviewQueueCssText = readFileSync(
  memoryReviewQueueCssFile,
  "utf8",
);
const docText = readFileSync(docFile, "utf8");
const memoryReviewQueueDocText = readFileSync(memoryReviewQueueDocFile, "utf8");
const reportText = readFileSync(reportFile, "utf8");
const memoryReviewQueueReportText = readFileSync(
  memoryReviewQueueReportFile,
  "utf8",
);

const fixtureInput = {
  scenarios: {
    pass: {
      key: "pass",
      label: "PASS",
      sourceInput: JSON.parse(readFileSync(sourcePassFile, "utf8")),
      sourceInputPath: sourcePassFile,
      prepareSummary: JSON.parse(readFileSync(preparePassFile, "utf8")),
      prepareSummaryPath: preparePassFile,
      validateSummary: JSON.parse(readFileSync(validatePassFile, "utf8")),
      validateSummaryPath: validatePassFile,
      returnedEnvelopeText: readFileSync(returnedPassFile, "utf8"),
      returnedEnvelopePath: returnedPassFile,
    },
    pass_with_follow_up: {
      key: "pass_with_follow_up",
      label: "PASS with follow-up",
      sourceInput: JSON.parse(readFileSync(sourceFollowUpFile, "utf8")),
      sourceInputPath: sourceFollowUpFile,
      prepareSummary: JSON.parse(readFileSync(prepareFollowUpFile, "utf8")),
      prepareSummaryPath: prepareFollowUpFile,
      validateSummary: JSON.parse(readFileSync(validateFollowUpFile, "utf8")),
      validateSummaryPath: validateFollowUpFile,
      returnedEnvelopeText: readFileSync(returnedFollowUpFile, "utf8"),
      returnedEnvelopePath: returnedFollowUpFile,
    },
    blocked: {
      key: "blocked",
      label: "BLOCKED",
      sourceInput: JSON.parse(readFileSync(sourceFollowUpFile, "utf8")),
      sourceInputPath: sourceFollowUpFile,
      prepareSummary: JSON.parse(readFileSync(prepareFollowUpFile, "utf8")),
      prepareSummaryPath: prepareFollowUpFile,
      validateSummary: JSON.parse(readFileSync(validateBlockedFile, "utf8")),
      validateSummaryPath: validateBlockedFile,
      returnedEnvelopeText: readFileSync(returnedBlockedFile, "utf8"),
      returnedEnvelopePath: returnedBlockedFile,
    },
  },
};

assertPackageScripts();
assertFilesExist();
assertRouteSource();
assertHelperViewModel();
assertLocalValidationBridge();
assertAcceptedCandidateDraftModel();
assertCandidateDraftListModel();
assertMemoryReviewQueueModel();
assertComponentSource();
assertCssSource();
assertDocsAndReports();
assertRuntimeBoundary();
assertNoRawFixturePayloadsInSource();

console.log(
  "PASS smoke:perspective-codex-former-local-adapter-operator-flow",
);

function assertPackageScripts() {
  assert.equal(
    packageJson.scripts[
      "smoke:perspective-codex-former-local-adapter-operator-flow"
    ],
    `${expectedTsxCommand} ${smokeFile}`,
  );
  assert.equal(
    packageJson.scripts[
      "browser:perspective-codex-former-local-adapter-operator-flow"
    ],
    `node ${browserSmokeFile}`,
  );
  assert.equal(
    packageJson.scripts["smoke:perspective-memory-local-review-queue"],
    `${expectedTsxCommand} ${memoryReviewQueueSmokeFile}`,
  );
  assert.equal(
    packageJson.scripts["browser:perspective-memory-local-review-queue"],
    `node ${memoryReviewQueueBrowserSmokeFile}`,
  );
}

function assertFilesExist() {
  for (const file of [
    routeFile,
    componentFile,
    cssFile,
    helperFile,
    localValidateBridgeFile,
    acceptedCandidateDraftFile,
    candidateDraftListFile,
    memoryReviewQueueFile,
    localValidateRouteFile,
    memoryReviewQueueRouteFile,
    memoryReviewQueueComponentFile,
    memoryReviewQueueCssFile,
    smokeFile,
    memoryReviewQueueSmokeFile,
    browserSmokeFile,
    memoryReviewQueueBrowserSmokeFile,
    docFile,
    memoryReviewQueueDocFile,
    reportFile,
    memoryReviewQueueReportFile,
    browserReportFile,
    memoryReviewQueueBrowserReportFile,
    sourcePassFile,
    sourceFollowUpFile,
    preparePassFile,
    prepareFollowUpFile,
    validatePassFile,
    validateFollowUpFile,
    validateBlockedFile,
    returnedPassFile,
    returnedFollowUpFile,
    returnedBlockedFile,
  ]) {
    assert.equal(existsSync(file), true, `${file} must exist`);
  }
}

function assertRouteSource() {
  assertIncludesAll(routeText, [
    "CodexFormerLocalAdapterOperatorFlowSurface",
    "buildCodexFormerLocalAdapterOperatorFlowViewModel",
    "2026-06-12-codex-former-local-adapter-source-input-pass.json",
    "2026-06-11-codex-former-local-adapter-source-input.json",
    "2026-06-12-codex-former-local-adapter-prepare-execution-summary-pass.json",
    "2026-06-12-codex-former-local-adapter-prepare-execution-summary-pass-with-follow-up.json",
    "2026-06-12-codex-former-local-adapter-validate-execution-summary-pass.json",
    "2026-06-12-codex-former-local-adapter-validate-execution-summary-pass-with-follow-up.json",
    "2026-06-12-codex-former-local-adapter-validate-execution-summary-blocked.json",
    "2026-06-12-codex-former-local-adapter-returned-candidate-envelope-pass.txt",
    "2026-06-12-codex-former-local-adapter-returned-candidate-envelope-ready.txt",
    "2026-06-12-codex-former-local-adapter-returned-candidate-envelope-blocked.txt",
  ]);
  assert.equal(routeText.includes("process.env"), false);
  assert.equal(routeText.includes("fetch("), false);

  assertIncludesAll(localValidateRouteText, [
    "runOperatorFlowLocalValidationBridge",
    "NextResponse.json",
    "export const runtime = \"nodejs\"",
    "export async function POST",
  ]);
  assert.equal(localValidateRouteText.includes("process.env"), false);
}

function assertHelperViewModel() {
  const viewModel =
    buildCodexFormerLocalAdapterOperatorFlowViewModel(fixtureInput);
  assert.equal(viewModel.validation.valid, true);
  assert.equal(viewModel.route, CODEX_FORMER_LOCAL_ADAPTER_OPERATOR_FLOW_ROUTE);
  assert.equal(
    viewModel.storage_namespace,
    CODEX_FORMER_LOCAL_ADAPTER_OPERATOR_FLOW_STORAGE_NAMESPACE,
  );
  assert.deepEqual(
    Object.keys(viewModel.scenarios).sort(),
    operatorFlowReturnedEnvelopeFixtureKeys.slice().sort(),
  );
  assert.deepEqual(viewModel.candidate_actions, operatorFlowCandidateActions);
  assert.equal(viewModel.scenarios.pass.validation_result.result_state, "PASS");
  assert.equal(
    viewModel.scenarios.pass.validation_result.validation_source,
    "fixture_preview",
  );
  assert.equal(
    viewModel.scenarios.pass.validation_result.execution_result,
    "success",
  );
  assert.equal(
    viewModel.scenarios.pass_with_follow_up.validation_result.result_state,
    "PASS with follow-up",
  );
  assert.equal(
    viewModel.scenarios.blocked.validation_result.result_state,
    "BLOCKED",
  );
  assertIncludesAll(helperText, [
    CODEX_FORMER_LOCAL_ADAPTER_OPERATOR_FLOW_VALIDATE_ROUTE,
    "real_local_validate_execution",
    "blocked_before_execution",
    "validation_result_source",
    "validation_summary_hash",
    "source_input_hash",
    "prepare_execution_summary_hash",
    "returned_envelope_hash",
    "operatorFlowSourceInputRefs",
    "operatorFlowPrepareExecutionSummaryRefs",
  ]);
  assertIncludesAll(viewModel.copy_packet_preview, [
    "LOCAL_CODEX_ADAPTER_OPERATOR_PACKET_V0_1",
    "task_statement:",
    "Produce exactly one CodexPerspectiveCandidateDraft returned candidate envelope from this bounded Augnes local adapter context.",
    "source_context_summary:",
    "work_id:",
    "changed_files_summary:",
    "changed_files:",
    "source_pr_refs:",
    "readiness.status:",
    "readiness.reasons:",
    "tests_checks_run:",
    "skipped_checks_summary:",
    "unresolved_gaps_summary:",
    "prepare_provenance:",
    "source_input_ref:",
    "source_input_path:",
    "source_input_hash:",
    "prepare_summary_ref:",
    "prepare_summary_path:",
    "prepare_summary_hash:",
    "former_input_packet_ref:",
    "manual_copy_packet_ref:",
    "source_prompt_hash:",
    "output_contract:",
    "draft_version: codex_perspective_candidate_draft.v0.1",
    "draft_kind: codex_perspective_candidate_draft",
    "required_fields:",
    "source_former_input_packet",
    "thesis",
    "selected_material",
    "evidence_pointer_refs",
    "unresolved_tensions",
    "basis_quality_suggestion",
    "next_action_candidates",
    "user_core_decision_questions",
    "qualification_notes",
    "privacy_flags",
    "authority_flags",
    "forbidden_actions",
    "authority_privacy_boundary:",
    "output is review material only",
    "no accepted state",
    "no review decision",
    "no persistence",
    "no DB",
    "no provider/model API",
    "no Codex SDK",
    "no GitHub mutation",
    "no Core decision",
    "no raw private/source/provider/token/browser material",
    "Return exactly one candidate object suitable for the RETURNED_CODEX_RESPONSE section.",
    "Do not include hidden reasoning, provider logs, tokens, secrets, raw diffs, raw source packets, browser dumps, raw review payloads, or unrelated chat text.",
    "Paste the returned envelope into the Returned Envelope panel, then select Run local validation.",
    "This route only stages a local draft.",
  ]);
  assertNoRawPacketPayloadMarkers(viewModel.copy_packet_preview);

  const previewPass = previewOperatorFlowValidationResult(
    fixtureInput.scenarios.pass.returnedEnvelopeText,
    viewModel,
    "pass",
  );
  assert.equal(previewPass.validation_result.result_state, "PASS");
  assert.equal(previewPass.validation_result.validation_source, "fixture_preview");
  const previewFollowUp = previewOperatorFlowValidationResult(
    fixtureInput.scenarios.pass_with_follow_up.returnedEnvelopeText,
    viewModel,
    "pass_with_follow_up",
  );
  assert.equal(
    previewFollowUp.validation_result.result_state,
    "PASS with follow-up",
  );
  const previewBlocked = previewOperatorFlowValidationResult(
    fixtureInput.scenarios.blocked.returnedEnvelopeText,
    viewModel,
    "blocked",
  );
  assert.equal(previewBlocked.validation_result.result_state, "BLOCKED");

  const droppedTextDraft = safeParseOperatorFlowDraft(
    JSON.stringify({
      returned_envelope_draft_saved_explicitly: false,
      returned_envelope_text: "should not persist by default",
    }),
    viewModel,
    "2026-06-12T00:00:00.000Z",
  );
  assert.equal("returned_envelope_text" in droppedTextDraft, false);

  const savedTextDraft = safeParseOperatorFlowDraft(
    JSON.stringify({
      returned_envelope_draft_saved_explicitly: true,
      returned_envelope_text: "explicit local draft",
      validation_summary_hash: "hash:validation",
      source_input_hash: "hash:source",
      prepare_execution_summary_hash: "hash:prepare",
      returned_envelope_hash: "hash:returned",
    }),
    viewModel,
    "2026-06-12T00:00:00.000Z",
  );
  assert.equal(savedTextDraft.returned_envelope_text, "explicit local draft");
  assert.equal(savedTextDraft.validation_summary_hash, "hash:validation");
  assert.equal(savedTextDraft.source_input_hash, "hash:source");
  assert.equal(
    savedTextDraft.prepare_execution_summary_hash,
    "hash:prepare",
  );
  assert.equal(savedTextDraft.returned_envelope_hash, "hash:returned");

  const storage = createMockStorage();
  const initialDraft = createInitialOperatorFlowDraft(
    viewModel,
    "2026-06-12T00:00:00.000Z",
  );
  assert.equal(initialDraft.validation_result_source, "not_run");
  saveOperatorFlowDraftToStorage(storage, viewModel, initialDraft);
  assert.equal(storage.values.has(viewModel.storage_namespace), true);
  const loadedDraft = loadOperatorFlowDraftFromStorage(
    storage,
    viewModel,
    "2026-06-12T00:00:01.000Z",
  );
  assert.equal(loadedDraft.draft_id, initialDraft.draft_id);
  assert.equal(loadedDraft.validation_result_source, "not_run");
  clearOperatorFlowDraftFromStorage(storage, viewModel);
  assert.equal(storage.values.has(viewModel.storage_namespace), false);
}

function assertLocalValidationBridge() {
  assertIncludesAll(localValidateBridgeText, [
    "buildCodexFormerLocalAdapterValidateExecutionSummary",
    "direct_validate_orchestration_library_call",
    "real_local_validate_execution",
    "blocked_before_execution",
    "local-operator-flow:returned-envelope-textarea",
    "local-operator-flow:in-memory-validate-summary",
    "operatorFlowSourceInputRefs",
    "operatorFlowPrepareExecutionSummaryRefs",
  ]);

  const pass = runOperatorFlowLocalValidationBridge({
    selected_returned_envelope_fixture_key: "pass",
    source_input_ref: sourcePassFile,
    prepare_summary_ref: preparePassFile,
    returned_envelope_text: fixtureInput.scenarios.pass.returnedEnvelopeText,
  });
  assert.equal(pass.validation_source, "real_local_validate_execution");
  assert.equal(pass.validation_result.result_state, "PASS");
  assert.equal(pass.validation_result.execution_result, "success");
  assert.equal(pass.validation_result.candidate_count, 1);
  assert.match(pass.validation_result.validation_summary_hash, /^[a-f0-9]{64}$/);

  const followUp = runOperatorFlowLocalValidationBridge({
    selected_returned_envelope_fixture_key: "pass_with_follow_up",
    source_input_ref: sourceFollowUpFile,
    prepare_summary_ref: prepareFollowUpFile,
    returned_envelope_text:
      fixtureInput.scenarios.pass_with_follow_up.returnedEnvelopeText,
  });
  assert.equal(followUp.validation_source, "real_local_validate_execution");
  assert.equal(followUp.validation_result.result_state, "PASS with follow-up");
  assert.equal(followUp.validation_result.execution_result, "success");
  assert.equal(followUp.validation_result.candidate_count, 1);
  assert(followUp.validation_result.warnings.length > 0);

  const blocked = runOperatorFlowLocalValidationBridge({
    selected_returned_envelope_fixture_key: "blocked",
    source_input_ref: sourceFollowUpFile,
    prepare_summary_ref: prepareFollowUpFile,
    returned_envelope_text: fixtureInput.scenarios.blocked.returnedEnvelopeText,
  });
  assert.equal(blocked.validation_source, "real_local_validate_execution");
  assert.equal(blocked.validation_result.result_state, "BLOCKED");
  assert.equal(blocked.validation_result.execution_result, "blocked");
  assert.equal(blocked.validation_result.candidate_count, 0);
  assert(blocked.validation_result.blocked_reasons.length > 0);

  const malformed = runOperatorFlowLocalValidationBridge({
    selected_returned_envelope_fixture_key: null,
    source_input_ref: sourceFollowUpFile,
    prepare_summary_ref: prepareFollowUpFile,
    returned_envelope_text: "not a returned candidate envelope",
  });
  assert.equal(malformed.validation_source, "real_local_validate_execution");
  assert.equal(malformed.validation_result.result_state, "BLOCKED");
  assert.equal(malformed.validation_result.execution_result, "blocked");
  assert(
    malformed.validation_result.blocked_reasons.some((reason) =>
      reason.includes("RETURNED_CODEX_RESPONSE bounds missing"),
    ),
  );

  const invalidRef = runOperatorFlowLocalValidationBridge({
    selected_returned_envelope_fixture_key: null,
    source_input_ref: "reports/fixtures/not-a-real-source.json",
    prepare_summary_ref: prepareFollowUpFile,
    returned_envelope_text: "not executed",
  });
  assert.equal(invalidRef.validation_source, "blocked_before_execution");
  assert.equal(invalidRef.validation_result.result_state, "BLOCKED");
  assert.equal(invalidRef.validation_result.failure_kind, "blocked_before_execution");
}

function assertAcceptedCandidateDraftModel() {
  const viewModel =
    buildCodexFormerLocalAdapterOperatorFlowViewModel(fixtureInput);
  assertIncludesAll(acceptedCandidateDraftText, [
    "CODEX_FORMER_LOCAL_ADAPTER_ACCEPTED_CANDIDATE_DRAFT_STORAGE_NAMESPACE",
    CODEX_FORMER_LOCAL_ADAPTER_ACCEPTED_CANDIDATE_DRAFT_VERSION,
    "buildCodexFormerLocalAdapterAcceptedCandidateDraft",
    "isCodexFormerLocalAdapterAcceptedCandidateDraftStale",
    "raw_prompt",
    "raw_candidate",
    "browser_dump",
    "product_db_persistence: false",
    "accepted_augnes_state_created: false",
    "review_decision_created: false",
    "core_decision_created: false",
    "runtime_handoff_created: false",
    "automatic_promotion: false",
  ]);

  const pass = runOperatorFlowLocalValidationBridge({
    selected_returned_envelope_fixture_key: "pass",
    source_input_ref: sourcePassFile,
    prepare_summary_ref: preparePassFile,
    returned_envelope_text: fixtureInput.scenarios.pass.returnedEnvelopeText,
  });
  const followUp = runOperatorFlowLocalValidationBridge({
    selected_returned_envelope_fixture_key: "pass_with_follow_up",
    source_input_ref: sourceFollowUpFile,
    prepare_summary_ref: prepareFollowUpFile,
    returned_envelope_text:
      fixtureInput.scenarios.pass_with_follow_up.returnedEnvelopeText,
  });
  const blocked = runOperatorFlowLocalValidationBridge({
    selected_returned_envelope_fixture_key: "blocked",
    source_input_ref: sourceFollowUpFile,
    prepare_summary_ref: prepareFollowUpFile,
    returned_envelope_text: fixtureInput.scenarios.blocked.returnedEnvelopeText,
  });

  const acceptedPass = buildCandidateDraft({
    action: "accept_as_perspective_candidate",
    validation: pass.validation_result,
    scenarioKey: "pass",
  });
  assert.equal(acceptedPass.ok, true);
  assert.equal(acceptedPass.draft.draft_version, CODEX_FORMER_LOCAL_ADAPTER_ACCEPTED_CANDIDATE_DRAFT_VERSION);
  assert.equal(acceptedPass.draft.local_status, "draft_candidate");
  assert.equal(acceptedPass.draft.validation_result_state, "PASS");
  assert.equal(acceptedPass.draft.validation_source, "real_local_validate_execution");
  assert.equal(acceptedPass.draft.candidate_count, 1);
  assert.equal(acceptedPass.draft.candidate_compatible_review_material, true);
  assert.equal(acceptedPass.draft.candidate_authority, "non_committed");
  assert.equal(
    acceptedPass.draft.authority_boundary.accepted_augnes_state_created,
    false,
  );
  assert.equal("returned_envelope_text" in acceptedPass.draft, false);
  assert.equal("raw_prompt" in acceptedPass.draft, false);
  assert.equal("raw_candidate" in acceptedPass.draft, false);
  assert.deepEqual(
    collectAcceptedCandidateDraftUnsafeMarkers(acceptedPass.draft),
    [],
  );
  assertNoRawCandidateDraftMarkers(acceptedPass.draft);

  const acceptedFollowUp = buildCandidateDraft({
    action: "accept_as_perspective_candidate",
    validation: followUp.validation_result,
    scenarioKey: "pass_with_follow_up",
  });
  assert.equal(acceptedFollowUp.ok, true);
  assert.equal(
    acceptedFollowUp.draft.validation_result_state,
    "PASS with follow-up",
  );
  assert(acceptedFollowUp.draft.warnings.length > 0);

  const blockedAccepted = buildCandidateDraft({
    action: "accept_as_perspective_candidate",
    validation: blocked.validation_result,
    scenarioKey: "blocked",
  });
  assert.equal(blockedAccepted.ok, false);
  assert(
    blockedAccepted.blocked_reasons.includes(
      "candidate draft requires PASS or PASS with follow-up validation",
    ),
  );

  const fixturePreviewAccepted = buildCandidateDraft({
    action: "accept_as_perspective_candidate",
    validation: viewModel.scenarios.pass.validation_result,
    scenarioKey: "pass",
  });
  assert.equal(fixturePreviewAccepted.ok, false);
  assert(
    fixturePreviewAccepted.blocked_reasons.includes(
      "validation_source must be real_local_validate_execution",
    ),
  );

  const rejectedBlocked = buildCandidateDraft({
    action: "reject_from_memory_candidate",
    validation: blocked.validation_result,
    scenarioKey: "blocked",
  });
  assert.equal(rejectedBlocked.ok, true);
  assert.equal(rejectedBlocked.draft.local_status, "rejected_memory_candidate");
  assert.equal(rejectedBlocked.draft.validation_result_state, "BLOCKED");

  const supersedeWithoutRef = buildCandidateDraft({
    action: "supersede_previous_candidate",
    validation: pass.validation_result,
    scenarioKey: "pass",
  });
  assert.equal(supersedeWithoutRef.ok, false);
  assert(
    supersedeWithoutRef.blocked_reasons.includes(
      "supersede draft requires supersede_previous_candidate_ref",
    ),
  );

  const supersedeWithRef = buildCandidateDraft({
    action: "supersede_previous_candidate",
    validation: pass.validation_result,
    scenarioKey: "pass",
    supersedesDraftId: "local-candidate-draft:previous",
  });
  assert.equal(supersedeWithRef.ok, true);
  assert.equal(supersedeWithRef.draft.local_status, "supersedes_previous_candidate");
  assert.equal(
    supersedeWithRef.draft.supersedes_draft_id,
    "local-candidate-draft:previous",
  );

  assert.equal(
    canBuildCodexFormerLocalAdapterAcceptedCandidateDraft({
      candidateAction: "accept_as_perspective_candidate",
      validation: pass.validation_result,
    }).eligible,
    true,
  );
  assert.equal(
    canBuildCodexFormerLocalAdapterAcceptedCandidateDraft({
      candidateAction: "accept_as_perspective_candidate",
      validation: blocked.validation_result,
    }).eligible,
    false,
  );
  assert.equal(
    isCodexFormerLocalAdapterAcceptedCandidateDraftStale(
      acceptedPass.draft,
      pass.validation_result,
    ),
    false,
  );
  assert.equal(
    isCodexFormerLocalAdapterAcceptedCandidateDraftStale(
      acceptedPass.draft,
      followUp.validation_result,
    ),
    true,
  );

  const storage = createMockStorage();
  saveCodexFormerLocalAdapterAcceptedCandidateDraftToStorage(
    storage,
    acceptedPass.draft,
  );
  assert.equal(
    storage.values.has(
      CODEX_FORMER_LOCAL_ADAPTER_ACCEPTED_CANDIDATE_DRAFT_STORAGE_NAMESPACE,
    ),
    true,
  );
  assert.deepEqual(
    loadCodexFormerLocalAdapterAcceptedCandidateDraftFromStorage(storage),
    acceptedPass.draft,
  );
  clearCodexFormerLocalAdapterAcceptedCandidateDraftFromStorage(storage);
  assert.equal(
    storage.values.has(
      CODEX_FORMER_LOCAL_ADAPTER_ACCEPTED_CANDIDATE_DRAFT_STORAGE_NAMESPACE,
    ),
    false,
  );
  assert.equal(
    safeParseCodexFormerLocalAdapterAcceptedCandidateDraft(
      JSON.stringify({
        ...acceptedPass.draft,
        review_summary: "TOKEN=unsafe",
      }),
    ),
    null,
  );
}

function assertCandidateDraftListModel() {
  const viewModel =
    buildCodexFormerLocalAdapterOperatorFlowViewModel(fixtureInput);
  assertIncludesAll(candidateDraftListText, [
    CODEX_FORMER_LOCAL_ADAPTER_CANDIDATE_DRAFT_LIST_STORAGE_NAMESPACE,
    CODEX_FORMER_LOCAL_ADAPTER_CANDIDATE_DRAFT_LIST_VERSION,
    "CODEX_FORMER_LOCAL_ADAPTER_CANDIDATE_DRAFT_LIST_MAX_DRAFTS = 20",
    "loadCodexFormerLocalAdapterCandidateDraftListFromStorage",
    "appendCodexFormerLocalAdapterCandidateDraftToList",
    "replaceCodexFormerLocalAdapterCandidateDraftInList",
    "removeCodexFormerLocalAdapterCandidateDraftFromList",
    "clearCodexFormerLocalAdapterCandidateDraftListFromStorage",
    "migrated_single_draft",
    "ignored_invalid_single_draft",
    "current_local_candidate_draft",
    "stale_local_candidate_draft",
    "no_current_validation",
  ]);

  const pass = runOperatorFlowLocalValidationBridge({
    selected_returned_envelope_fixture_key: "pass",
    source_input_ref: sourcePassFile,
    prepare_summary_ref: preparePassFile,
    returned_envelope_text: fixtureInput.scenarios.pass.returnedEnvelopeText,
  });
  const followUp = runOperatorFlowLocalValidationBridge({
    selected_returned_envelope_fixture_key: "pass_with_follow_up",
    source_input_ref: sourceFollowUpFile,
    prepare_summary_ref: prepareFollowUpFile,
    returned_envelope_text:
      fixtureInput.scenarios.pass_with_follow_up.returnedEnvelopeText,
  });
  const blocked = runOperatorFlowLocalValidationBridge({
    selected_returned_envelope_fixture_key: "blocked",
    source_input_ref: sourceFollowUpFile,
    prepare_summary_ref: prepareFollowUpFile,
    returned_envelope_text: fixtureInput.scenarios.blocked.returnedEnvelopeText,
  });

  const acceptedPass = buildCandidateDraft({
    action: "accept_as_perspective_candidate",
    validation: pass.validation_result,
    scenarioKey: "pass",
    draftId: "local-candidate-draft:accepted-pass",
  });
  const acceptedFollowUp = buildCandidateDraft({
    action: "accept_as_perspective_candidate",
    validation: followUp.validation_result,
    scenarioKey: "pass_with_follow_up",
    draftId: "local-candidate-draft:accepted-follow-up",
  });
  const rejectedBlocked = buildCandidateDraft({
    action: "reject_from_memory_candidate",
    validation: blocked.validation_result,
    scenarioKey: "blocked",
    draftId: "local-candidate-draft:rejected-blocked",
  });
  const supersedeDraft = buildCandidateDraft({
    action: "supersede_previous_candidate",
    validation: pass.validation_result,
    scenarioKey: "pass",
    draftId: "local-candidate-draft:supersede-pass",
    supersedesDraftId: "local-candidate-draft:accepted-pass",
  });
  assert.equal(acceptedPass.ok, true);
  assert.equal(acceptedFollowUp.ok, true);
  assert.equal(rejectedBlocked.ok, true);
  assert.equal(supersedeDraft.ok, true);

  let list = createEmptyCodexFormerLocalAdapterCandidateDraftList(
    "2026-06-12T00:00:00.000Z",
  );
  list = appendCodexFormerLocalAdapterCandidateDraftToList(
    list,
    acceptedPass.draft,
    "2026-06-12T00:00:01.000Z",
  );
  list = appendCodexFormerLocalAdapterCandidateDraftToList(
    list,
    acceptedFollowUp.draft,
    "2026-06-12T00:00:02.000Z",
  );
  list = appendCodexFormerLocalAdapterCandidateDraftToList(
    list,
    rejectedBlocked.draft,
    "2026-06-12T00:00:03.000Z",
  );
  list = appendCodexFormerLocalAdapterCandidateDraftToList(
    list,
    supersedeDraft.draft,
    "2026-06-12T00:00:04.000Z",
  );
  assert.equal(list.list_version, CODEX_FORMER_LOCAL_ADAPTER_CANDIDATE_DRAFT_LIST_VERSION);
  assert.equal(list.drafts.length, 4);
  assert(list.drafts.some((draft) => draft.local_status === "draft_candidate"));
  assert(
    list.drafts.some(
      (draft) => draft.local_status === "rejected_memory_candidate",
    ),
  );
  assert(
    list.drafts.some(
      (draft) => draft.local_status === "supersedes_previous_candidate",
    ),
  );
  assert(
    list.drafts.some(
      (draft) =>
        draft.supersedes_draft_id === "local-candidate-draft:accepted-pass",
    ),
  );
  assert.deepEqual(
    collectCodexFormerLocalAdapterCandidateDraftListUnsafeMarkers(list),
    [],
  );

  const deduped = appendCodexFormerLocalAdapterCandidateDraftToList(
    list,
    acceptedPass.draft,
    "2026-06-12T00:00:05.000Z",
  );
  assert.equal(deduped.drafts.length, 4);

  let bounded = createEmptyCodexFormerLocalAdapterCandidateDraftList(
    "2026-06-12T00:00:00.000Z",
  );
  for (let index = 0; index < CODEX_FORMER_LOCAL_ADAPTER_CANDIDATE_DRAFT_LIST_MAX_DRAFTS + 5; index += 1) {
    bounded = appendCodexFormerLocalAdapterCandidateDraftToList(
      bounded,
      {
        ...acceptedPass.draft,
        draft_id: `local-candidate-draft:bounded-${index}`,
        created_at: `2026-06-12T00:${String(index).padStart(2, "0")}:00.000Z`,
        updated_at: `2026-06-12T00:${String(index).padStart(2, "0")}:30.000Z`,
      },
      `2026-06-12T01:${String(index).padStart(2, "0")}:00.000Z`,
    );
  }
  assert.equal(
    bounded.drafts.length,
    CODEX_FORMER_LOCAL_ADAPTER_CANDIDATE_DRAFT_LIST_MAX_DRAFTS,
  );

  const replacedDraft = {
    ...acceptedPass.draft,
    local_status: rejectedBlocked.draft.local_status,
    candidate_action: rejectedBlocked.draft.candidate_action,
    validation_result_state: rejectedBlocked.draft.validation_result_state,
    updated_at: "2026-06-12T00:00:06.000Z",
  };
  const replaced = replaceCodexFormerLocalAdapterCandidateDraftInList(
    list,
    replacedDraft,
    "2026-06-12T00:00:06.000Z",
  );
  assert.equal(replaced.drafts.length, 4);
  assert.equal(
    replaced.drafts.find(
      (draft) => draft.draft_id === acceptedPass.draft.draft_id,
    )?.local_status,
    "rejected_memory_candidate",
  );

  const removed = removeCodexFormerLocalAdapterCandidateDraftFromList(
    list,
    acceptedPass.draft.draft_id,
    "2026-06-12T00:00:07.000Z",
  );
  assert.equal(removed.drafts.length, 3);
  assert.equal(
    removed.drafts.some(
      (draft) => draft.draft_id === acceptedPass.draft.draft_id,
    ),
    false,
  );

  assert.equal(
    getCodexFormerLocalAdapterCandidateDraftCurrentStatus(
      acceptedPass.draft,
      pass.validation_result,
    ),
    "current_local_candidate_draft",
  );
  assert.equal(
    getCodexFormerLocalAdapterCandidateDraftCurrentStatus(
      acceptedPass.draft,
      followUp.validation_result,
    ),
    "stale_local_candidate_draft",
  );
  assert.equal(
    getCodexFormerLocalAdapterCandidateDraftCurrentStatus(
      acceptedPass.draft,
      viewModel.scenarios.pass.validation_result,
    ),
    "no_current_validation",
  );

  const storage = createMockStorage();
  saveCodexFormerLocalAdapterCandidateDraftListToStorage(storage, list);
  assert.equal(
    storage.values.has(
      CODEX_FORMER_LOCAL_ADAPTER_CANDIDATE_DRAFT_LIST_STORAGE_NAMESPACE,
    ),
    true,
  );
  assert.equal(
    loadCodexFormerLocalAdapterCandidateDraftListFromStorage(
      storage,
      "2026-06-12T00:00:08.000Z",
    ).list.drafts.length,
    4,
  );

  const migrationStorage = createMockStorage();
  migrationStorage.setItem(
    CODEX_FORMER_LOCAL_ADAPTER_ACCEPTED_CANDIDATE_DRAFT_STORAGE_NAMESPACE,
    JSON.stringify(acceptedPass.draft),
  );
  const migrated = loadCodexFormerLocalAdapterCandidateDraftListFromStorage(
    migrationStorage,
    "2026-06-12T00:00:09.000Z",
  );
  assert.equal(migrated.migrated_single_draft, true);
  assert.equal(migrated.list.drafts.length, 1);

  const invalidMigrationStorage = createMockStorage();
  invalidMigrationStorage.setItem(
    CODEX_FORMER_LOCAL_ADAPTER_ACCEPTED_CANDIDATE_DRAFT_STORAGE_NAMESPACE,
    JSON.stringify({ ...acceptedPass.draft, review_summary: "TOKEN=unsafe" }),
  );
  const invalidMigration = loadCodexFormerLocalAdapterCandidateDraftListFromStorage(
    invalidMigrationStorage,
    "2026-06-12T00:00:10.000Z",
  );
  assert.equal(invalidMigration.ignored_invalid_single_draft, true);
  assert.equal(invalidMigration.list.drafts.length, 0);

  const unsafeParsedList = safeParseCodexFormerLocalAdapterCandidateDraftList(
    JSON.stringify({
      list_version: CODEX_FORMER_LOCAL_ADAPTER_CANDIDATE_DRAFT_LIST_VERSION,
      updated_at: "2026-06-12T00:00:11.000Z",
      drafts: [
        acceptedPass.draft,
        { ...acceptedPass.draft, draft_id: "unsafe", review_summary: "TOKEN=unsafe" },
      ],
    }),
    "2026-06-12T00:00:11.000Z",
  );
  assert.equal(unsafeParsedList.drafts.length, 1);

  clearCodexFormerLocalAdapterCandidateDraftListFromStorage(storage);
  assert.equal(
    storage.values.has(
      CODEX_FORMER_LOCAL_ADAPTER_CANDIDATE_DRAFT_LIST_STORAGE_NAMESPACE,
    ),
    false,
  );
  assert.equal(
    storage.values.has(
      CODEX_FORMER_LOCAL_ADAPTER_ACCEPTED_CANDIDATE_DRAFT_STORAGE_NAMESPACE,
    ),
    false,
  );
}

function assertMemoryReviewQueueModel() {
  assertIncludesAll(memoryReviewQueueText, [
    PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_STORAGE_NAMESPACE,
    PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_VERSION,
    PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_ITEM_VERSION,
    "PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_MAX_ITEMS = 50",
    "buildPerspectiveMemoryLocalReviewQueueItemFromCandidateDraft",
    "appendPerspectiveMemoryLocalReviewQueueItem",
    "removePerspectiveMemoryLocalReviewQueueItem",
    "updatePerspectiveMemoryLocalReviewQueueItemStatus",
    "findPerspectiveMemoryLocalReviewQueueItemBySourceDraft",
    "getPerspectiveMemoryLocalReviewQueueItemSourceState",
    "current_with_source_candidate_draft",
    "source_candidate_draft_stale",
    "source_candidate_draft_missing",
    "memory_candidate_preview",
    "can_create_memory_write: false",
    "accepted_augnes_memory_created: false",
    "review_decision_created: false",
    "product_db_persistence: false",
    "core_decision_created: false",
    "runtime_handoff_created: false",
    "automatic_promotion: false",
    "raw_prompt",
    "raw_candidate",
    "browser_dump",
  ]);
  assertIncludesAll(memoryReviewQueueRouteText, [
    "LocalMemoryReviewQueueSurface",
  ]);
  assertIncludesAll(memoryReviewQueueComponentText, [
    "Local Memory Review Queue",
    "PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_ROUTE",
    "PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_STORAGE_NAMESPACE",
    "Queued Items",
    "Queue Item Detail",
    "Bounded Memory Candidate Preview",
    "queued_for_memory_review",
    "reviewing_locally",
    "kept_for_later",
    "removed_from_queue",
    "stale_or_missing_source",
    "Mark reviewing locally",
    "Keep for later",
    "Remove from queue",
    "Return to candidate drafts, local note only",
    "Clear queue",
    "can_create_memory_write",
    "not accepted Augnes memory",
    "not review decision",
    "local review state until explicit boundary record",
    "boundary record is product persistence only",
    "not Core decision",
    "data-augnes-local-memory-review-queue-list",
    "data-augnes-memory-candidate-preview",
  ]);

  const pass = runOperatorFlowLocalValidationBridge({
    selected_returned_envelope_fixture_key: "pass",
    source_input_ref: sourcePassFile,
    prepare_summary_ref: preparePassFile,
    returned_envelope_text: fixtureInput.scenarios.pass.returnedEnvelopeText,
  });
  const followUp = runOperatorFlowLocalValidationBridge({
    selected_returned_envelope_fixture_key: "pass_with_follow_up",
    source_input_ref: sourceFollowUpFile,
    prepare_summary_ref: prepareFollowUpFile,
    returned_envelope_text:
      fixtureInput.scenarios.pass_with_follow_up.returnedEnvelopeText,
  });
  const blocked = runOperatorFlowLocalValidationBridge({
    selected_returned_envelope_fixture_key: "blocked",
    source_input_ref: sourceFollowUpFile,
    prepare_summary_ref: prepareFollowUpFile,
    returned_envelope_text: fixtureInput.scenarios.blocked.returnedEnvelopeText,
  });

  const acceptedPass = buildCandidateDraft({
    action: "accept_as_perspective_candidate",
    validation: pass.validation_result,
    scenarioKey: "pass",
    draftId: "local-candidate-draft:queue-pass",
  });
  const acceptedFollowUp = buildCandidateDraft({
    action: "accept_as_perspective_candidate",
    validation: followUp.validation_result,
    scenarioKey: "pass_with_follow_up",
    draftId: "local-candidate-draft:queue-follow-up",
  });
  const rejectedBlocked = buildCandidateDraft({
    action: "reject_from_memory_candidate",
    validation: blocked.validation_result,
    scenarioKey: "blocked",
    draftId: "local-candidate-draft:queue-rejected-blocked",
  });
  const supersedeDraft = buildCandidateDraft({
    action: "supersede_previous_candidate",
    validation: pass.validation_result,
    scenarioKey: "pass",
    draftId: "local-candidate-draft:queue-supersede",
    supersedesDraftId: "local-candidate-draft:queue-pass",
  });
  assert.equal(acceptedPass.ok, true);
  assert.equal(acceptedFollowUp.ok, true);
  assert.equal(rejectedBlocked.ok, true);
  assert.equal(supersedeDraft.ok, true);

  const queuePass = buildQueueItem({
    draft: acceptedPass.draft,
    queueItemId: "local-memory-review-queue-item:pass",
  });
  assert.equal(queuePass.ok, true);
  assert.equal(queuePass.item.item_version, PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_ITEM_VERSION);
  assert.equal(queuePass.item.source_candidate_local_status, "draft_candidate");
  assert.equal(queuePass.item.source_validation_result_state, "PASS");
  assert.equal(queuePass.item.queue_status, "queued_for_memory_review");
  assert.equal(queuePass.item.review_only_actions.can_create_memory_write, false);
  assert.equal(
    queuePass.item.authority_boundary.accepted_augnes_memory_created,
    false,
  );
  assert.equal("returned_envelope_text" in queuePass.item, false);
  assert.equal("raw_prompt" in queuePass.item, false);
  assert.equal("raw_candidate" in queuePass.item, false);
  assert.deepEqual(
    collectPerspectiveMemoryLocalReviewQueueUnsafeMarkers({
      queue_version: PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_VERSION,
      updated_at: "2026-06-13T00:00:00.000Z",
      items: [queuePass.item],
    }),
    [],
  );
  assertNoRawQueueItemMarkers(queuePass.item);

  const queueFollowUp = buildQueueItem({
    draft: acceptedFollowUp.draft,
    queueItemId: "local-memory-review-queue-item:follow-up",
  });
  assert.equal(queueFollowUp.ok, true);
  assert.equal(
    queueFollowUp.item.source_validation_result_state,
    "PASS with follow-up",
  );
  assert(
    queueFollowUp.item.memory_candidate_preview.risk_notes.some((note) =>
      note.includes("PASS with follow-up"),
    ),
  );

  const queueSupersede = buildQueueItem({
    draft: supersedeDraft.draft,
    queueItemId: "local-memory-review-queue-item:supersede",
  });
  assert.equal(queueSupersede.ok, true);
  assert.equal(
    queueSupersede.item.source_candidate_local_status,
    "supersedes_previous_candidate",
  );

  const queueRejected = buildQueueItem({
    draft: rejectedBlocked.draft,
    queueItemId: "local-memory-review-queue-item:rejected",
  });
  assert.equal(queueRejected.ok, false);
  assert(
    queueRejected.blocked_reasons.includes(
      "only draft_candidate or supersedes_previous_candidate can be queued for memory review",
    ),
  );

  const queueFixturePreview = buildQueueItem({
    draft: {
      ...acceptedPass.draft,
      validation_source: "fixture_preview",
    },
    queueItemId: "local-memory-review-queue-item:fixture-preview",
  });
  assert.equal(queueFixturePreview.ok, false);
  assert(
    queueFixturePreview.blocked_reasons.includes(
      "queue item requires real_local_validate_execution",
    ),
  );

  const queueBlocked = buildQueueItem({
    draft: {
      ...acceptedPass.draft,
      validation_result_state: "BLOCKED",
    },
    queueItemId: "local-memory-review-queue-item:blocked",
  });
  assert.equal(queueBlocked.ok, false);
  assert(queueBlocked.blocked_reasons.includes("queue item requires PASS or PASS with follow-up"));

  assert.equal(
    canBuildPerspectiveMemoryLocalReviewQueueItemFromCandidateDraft({
      draft: acceptedPass.draft,
      sourceDraftCurrentStatus: "current_local_candidate_draft",
    }).eligible,
    true,
  );
  assert.equal(
    canBuildPerspectiveMemoryLocalReviewQueueItemFromCandidateDraft({
      draft: acceptedPass.draft,
      sourceDraftCurrentStatus: "stale_local_candidate_draft",
    }).eligible,
    false,
  );

  let queue = createEmptyPerspectiveMemoryLocalReviewQueue(
    "2026-06-13T00:00:00.000Z",
  );
  queue = appendPerspectiveMemoryLocalReviewQueueItem(
    queue,
    queuePass.item,
    "2026-06-13T00:00:01.000Z",
  );
  queue = appendPerspectiveMemoryLocalReviewQueueItem(
    queue,
    queueFollowUp.item,
    "2026-06-13T00:00:02.000Z",
  );
  queue = appendPerspectiveMemoryLocalReviewQueueItem(
    queue,
    queueSupersede.item,
    "2026-06-13T00:00:03.000Z",
  );
  assert.equal(queue.queue_version, PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_VERSION);
  assert.equal(queue.items.length, 3);
  const deduped = appendPerspectiveMemoryLocalReviewQueueItem(
    queue,
    queuePass.item,
    "2026-06-13T00:00:04.000Z",
  );
  assert.equal(deduped.items.length, 3);

  let bounded = createEmptyPerspectiveMemoryLocalReviewQueue(
    "2026-06-13T00:00:00.000Z",
  );
  for (let index = 0; index < PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_MAX_ITEMS + 4; index += 1) {
    bounded = appendPerspectiveMemoryLocalReviewQueueItem(
      bounded,
      {
        ...queuePass.item,
        queue_item_id: `local-memory-review-queue-item:bounded-${index}`,
        created_at: `2026-06-13T00:${String(index).padStart(2, "0")}:00.000Z`,
        updated_at: `2026-06-13T00:${String(index).padStart(2, "0")}:30.000Z`,
      },
      `2026-06-13T01:${String(index).padStart(2, "0")}:00.000Z`,
    );
  }
  assert.equal(bounded.items.length, PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_MAX_ITEMS);

  const reviewing = updatePerspectiveMemoryLocalReviewQueueItemStatus(
    queue,
    queuePass.item.queue_item_id,
    "reviewing_locally",
    "2026-06-13T00:00:05.000Z",
  );
  assert.equal(
    reviewing.items.find((item) => item.queue_item_id === queuePass.item.queue_item_id)
      ?.queue_status,
    "reviewing_locally",
  );
  const removedStatus = updatePerspectiveMemoryLocalReviewQueueItemStatus(
    queue,
    queuePass.item.queue_item_id,
    "removed_from_queue",
    "2026-06-13T00:00:06.000Z",
  );
  assert.equal(
    findPerspectiveMemoryLocalReviewQueueItemBySourceDraft(
      removedStatus,
      acceptedPass.draft.draft_id,
    ),
    null,
  );
  const removed = removePerspectiveMemoryLocalReviewQueueItem(
    queue,
    queuePass.item.queue_item_id,
    "2026-06-13T00:00:07.000Z",
  );
  assert.equal(removed.items.length, 2);

  let draftList = createEmptyCodexFormerLocalAdapterCandidateDraftList(
    "2026-06-13T00:00:00.000Z",
  );
  draftList = appendCodexFormerLocalAdapterCandidateDraftToList(
    draftList,
    acceptedPass.draft,
    "2026-06-13T00:00:01.000Z",
  );
  assert.equal(
    getPerspectiveMemoryLocalReviewQueueItemSourceState(queuePass.item, draftList),
    "current_with_source_candidate_draft",
  );
  const staleDraftList = replaceCodexFormerLocalAdapterCandidateDraftInList(
    draftList,
    { ...acceptedPass.draft, returned_envelope_hash: "different-returned-hash" },
    "2026-06-13T00:00:02.000Z",
  );
  assert.equal(
    getPerspectiveMemoryLocalReviewQueueItemSourceState(
      queuePass.item,
      staleDraftList,
    ),
    "source_candidate_draft_stale",
  );
  assert.equal(
    getPerspectiveMemoryLocalReviewQueueItemSourceState(
      queuePass.item,
      createEmptyCodexFormerLocalAdapterCandidateDraftList(
        "2026-06-13T00:00:03.000Z",
      ),
    ),
    "source_candidate_draft_missing",
  );

  const storage = createMockStorage();
  savePerspectiveMemoryLocalReviewQueueToStorage(storage, queue);
  assert.equal(
    storage.values.has(PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_STORAGE_NAMESPACE),
    true,
  );
  assert.equal(
    loadPerspectiveMemoryLocalReviewQueueFromStorage(
      storage,
      "2026-06-13T00:00:08.000Z",
    ).items.length,
    3,
  );
  clearPerspectiveMemoryLocalReviewQueueFromStorage(storage);
  assert.equal(
    storage.values.has(PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_STORAGE_NAMESPACE),
    false,
  );

  const unsafeParsedQueue = safeParsePerspectiveMemoryLocalReviewQueue(
    JSON.stringify({
      queue_version: PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_VERSION,
      updated_at: "2026-06-13T00:00:09.000Z",
      items: [
        queuePass.item,
        { ...queuePass.item, queue_item_id: "unsafe", review_summary: "TOKEN=unsafe" },
      ],
    }),
    "2026-06-13T00:00:09.000Z",
  );
  assert.equal(unsafeParsedQueue.items.length, 1);
}

function assertComponentSource() {
  assertIncludesAll(componentText, [
    "Local Codex Adapter Operator Flow",
    "Source / Prepare",
    "Copy For Codex",
    "External Codex Work",
    "Returned Envelope",
    "Validate Result",
    "Candidate Review Material",
    "Next Action",
    "Local Candidate Draft List",
    "Perspective-Memory Review Queue",
    "Local Storage Boundary",
    "Load PASS envelope fixture",
    "Load PASS with follow-up envelope fixture",
    "Load BLOCKED envelope fixture",
    "Clear returned envelope draft",
    "Save draft locally",
    "Clear local draft",
    "Run local validation",
    "Preview fixture result",
    "Create local perspective candidate draft",
    "Create local memory rejection draft",
    "Create local supersede draft",
    "Replace selected draft with current candidate draft",
    "Clear selected local candidate draft",
    "Clear all local candidate drafts",
    "Queue for perspective-memory review",
    "Open local memory review queue",
    "Remove queue item for selected draft",
    "Select draft",
    "getCodexFormerLocalAdapterCandidateDraftCurrentStatus",
    "CODEX_FORMER_LOCAL_ADAPTER_CANDIDATE_DRAFT_LIST_STORAGE_NAMESPACE",
    "PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_STORAGE_NAMESPACE",
    "PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_ROUTE",
    "buildPerspectiveMemoryLocalReviewQueueItemFromCandidateDraft",
    "findPerspectiveMemoryLocalReviewQueueItemBySourceDraft",
    "selected_draft_already_queued",
    "memory_review_queue_blocked_reasons",
    "real_local_validate_execution",
    "validation_result_source",
    "validation_summary_hash",
    "source_input_hash",
    "prepare_execution_summary_hash",
    "returned_envelope_hash",
    "authority_flags",
    "defaultCandidateActionChoice",
    "resetCandidateActionPatch",
    "resetValidationHashPatch",
    "localValidationHashPatch",
    "currentValidationForCandidateDrafts",
    "candidate_action_choice: defaultCandidateActionChoice",
    "supersede_previous_candidate_ref: undefined",
    "shouldResetCandidateAction",
    "result.validation_source === \"blocked_before_execution\"",
    "result.validation_result.result_state === \"BLOCKED\"",
    "actionEligibility",
    "reject_from_memory_candidate: rejectDraftEligibility.eligible",
    "requires real validation",
    "disabled={!actionCanBeSelected}",
    "BLOCKED validation can only create",
    "Keep review-only",
    "Mark as perspective candidate",
    "Reject as memory candidate",
    "Supersede previous candidate",
    "local draft only",
    "not accepted state",
    "not review decision",
    "not product DB persistence",
    "not Core decision",
    "not runtime handoff",
    "data-augnes-load-envelope",
    "data-augnes-run-local-validation",
    "data-augnes-validate-preview",
    "data-augnes-candidate-action",
    "data-augnes-create-accepted-candidate-draft",
    "data-augnes-create-rejection-candidate-draft",
    "data-augnes-create-supersede-candidate-draft",
    "data-augnes-replace-selected-candidate-draft",
    "data-augnes-clear-selected-candidate-draft",
    "data-augnes-clear-all-candidate-drafts",
    "data-augnes-memory-review-queue-panel",
    "data-augnes-queue-selected-candidate-draft",
    "data-augnes-remove-selected-queue-item",
    "data-augnes-open-local-memory-review-queue",
    "data-augnes-candidate-draft-list",
    "data-augnes-select-candidate-draft",
    "data-augnes-local-candidate-draft-list-status",
    "CODEX_FORMER_LOCAL_ADAPTER_OPERATOR_FLOW_VALIDATE_ROUTE",
  ]);
  assert(componentText.includes("fetch("), "component must call local bridge");
  assert.equal(
    componentText.includes("navigator.clipboard"),
    false,
    "component must not use automatic clipboard behavior",
  );
  for (const action of operatorFlowCandidateActions) {
    assert(componentText.includes(action), `component must include ${action}`);
  }
  assert(
    countOccurrences(componentText, "...resetCandidateActionPatch()") >= 5,
    "candidate_action_choice resets on edit/load/clear/preview/error paths",
  );
  assert(
    componentText.includes(
      "shouldResetCandidateAction ? resetCandidateActionPatch() : {}",
    ),
    "BLOCKED local validation must reset candidate_action_choice",
  );
  assert(
    componentText.includes("supersede_previous_candidate_ref:") &&
      componentText.includes(
        "action === \"supersede_previous_candidate\"",
      ),
    "supersede_previous_candidate_ref must be cleared when the action resets away from supersede",
  );
  assert(
    componentText.includes("const nextDraft = createInitialOperatorFlowDraft("),
    "Clear local draft must restore the initial keep_review_only action",
  );
  assert(
    componentText.includes("setLocalValidationRun(null)") &&
      componentText.includes("setValidationPreview(null)"),
    "stale validation runs must be cleared when context is not actionable",
  );
}

function assertCssSource() {
  assertIncludesAll(cssText, [
    ".shell",
    ".surface",
    ".grid",
    ".panel",
    ".statusStrip",
    ".copyArea",
    ".envelopeArea",
    ".draftDetailGrid",
    ".draftList",
    ".draftListItem",
    ".selectedDraftListItem",
    ".queuePanel",
    ".actionGrid",
    ".linkButton",
    ".errorText",
    ":disabled",
    "@media (max-width: 520px)",
    "overflow-wrap: anywhere",
  ]);
}

function assertDocsAndReports() {
  assertIncludesAll(docText, [
    "# Local Codex Adapter Operator Flow v0.1",
    CODEX_FORMER_LOCAL_ADAPTER_OPERATOR_FLOW_ROUTE,
    CODEX_FORMER_LOCAL_ADAPTER_OPERATOR_FLOW_VALIDATE_ROUTE,
    CODEX_FORMER_LOCAL_ADAPTER_OPERATOR_FLOW_STORAGE_NAMESPACE,
    CODEX_FORMER_LOCAL_ADAPTER_CANDIDATE_DRAFT_LIST_STORAGE_NAMESPACE,
    CODEX_FORMER_LOCAL_ADAPTER_CANDIDATE_DRAFT_LIST_VERSION,
    CODEX_FORMER_LOCAL_ADAPTER_ACCEPTED_CANDIDATE_DRAFT_STORAGE_NAMESPACE,
    CODEX_FORMER_LOCAL_ADAPTER_ACCEPTED_CANDIDATE_DRAFT_VERSION,
    PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_ROUTE,
    PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_STORAGE_NAMESPACE,
    PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_VERSION,
    "Run local validation",
    "real_local_validate_execution",
    "fixture_preview",
    "blocked_before_execution",
    "Create local perspective candidate draft",
    "Create local memory rejection draft",
    "Create local supersede draft",
    "Clear selected local candidate draft",
    "Clear all local candidate drafts",
    "Local Candidate Draft List",
    "Queue for perspective-memory review",
    "Open local memory review queue",
    "local memory review queue",
    "current_local_candidate_draft",
    "stale_local_candidate_draft",
    "no_current_validation",
    "keep_review_only",
    "accept_as_perspective_candidate",
    "reject_from_memory_candidate",
    "supersede_previous_candidate",
    "local draft only",
  ]);
  assertIncludesAll(reportText, [
    "# Local Codex Adapter Operator Flow Report",
    routeFile,
    helperFile,
    localValidateBridgeFile,
    acceptedCandidateDraftFile,
    candidateDraftListFile,
    memoryReviewQueueFile,
    localValidateRouteFile,
    memoryReviewQueueRouteFile,
    "Run local validation",
    "real_local_validate_execution",
    "local candidate draft list",
    "perspective-memory review queue",
    "Queue for perspective-memory review",
    PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_STORAGE_NAMESPACE,
    CODEX_FORMER_LOCAL_ADAPTER_CANDIDATE_DRAFT_LIST_STORAGE_NAMESPACE,
    "migrate",
    "Clear selected",
    "Clear all",
    "BLOCKED rejection-only",
    "stale_local_candidate_draft",
    "fixture_preview",
    "PASS / PASS with follow-up / BLOCKED",
    "no accepted Augnes state",
    "no review decision",
  ]);
  assertIncludesAll(memoryReviewQueueDocText, [
    "# Perspective Memory Local Review Queue v0.1",
    PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_ROUTE,
    PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_STORAGE_NAMESPACE,
    PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_VERSION,
    PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_ITEM_VERSION,
    "selected local candidate draft",
    "Queue for perspective-memory review",
    "memory_candidate_preview",
    "current_with_source_candidate_draft",
    "source_candidate_draft_stale",
    "source_candidate_draft_missing",
    "can_create_memory_write: false",
    "not accepted Augnes memory",
    "not review decision",
    "Product Persistence Boundary",
    "sqlite:lib/db.ts",
    "not Core decision",
  ]);
  assertIncludesAll(memoryReviewQueueReportText, [
    "# Perspective Memory Local Review Queue Report",
    memoryReviewQueueFile,
    memoryReviewQueueRouteFile,
    memoryReviewQueueComponentFile,
    PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_STORAGE_NAMESPACE,
    "selected local candidate draft",
    "visible local review queue",
    "bounded memory candidate preview",
    "queued_for_memory_review",
    "reviewing_locally",
    "kept_for_later",
    "removed_from_queue",
    "stale/missing source",
    "no accepted Augnes memory",
  ]);
}

function assertRuntimeBoundary() {
  const sourceByFile = {
    [routeFile]: routeText,
    [componentFile]: componentText,
    [helperFile]: helperText,
    [localValidateBridgeFile]: localValidateBridgeText,
    [acceptedCandidateDraftFile]: acceptedCandidateDraftText,
    [candidateDraftListFile]: candidateDraftListText,
    [memoryReviewQueueFile]: memoryReviewQueueText,
    [localValidateRouteFile]: localValidateRouteText,
    [memoryReviewQueueRouteFile]: memoryReviewQueueRouteText,
    [memoryReviewQueueComponentFile]: memoryReviewQueueComponentText,
  };
  for (const [file, source] of Object.entries(sourceByFile)) {
    for (const forbidden of [
      "navigator.clipboard",
      "document.execCommand",
      "XMLHttpRequest",
      "new WebSocket",
      "OpenAI",
      "new Octokit",
      "PrismaClient",
      "better-sqlite3",
      "process.env.OPENAI",
      "github.rest",
      "createAcceptedState",
      "reviewDecision",
      "coreDecision",
    ]) {
      assert.equal(
        source.includes(forbidden),
        false,
        `${file} must not contain runtime call marker ${forbidden}`,
      );
    }
    if (file !== componentFile && file !== memoryReviewQueueComponentFile) {
      assert.equal(
        source.includes("fetch("),
        false,
        `${file} must not contain browser fetch`,
      );
    }
    assert.equal(source.includes("https://"), false, `${file} must not call external URLs`);
  }
  assertIncludesAll(componentText, [
    "fetch(",
    "CODEX_FORMER_LOCAL_ADAPTER_OPERATOR_FLOW_VALIDATE_ROUTE",
  ]);
  assertIncludesAll(memoryReviewQueueComponentText, [
    "fetch(",
    "PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_API_ROUTE",
  ]);
}

function assertNoRawFixturePayloadsInSource() {
  for (const [file, source] of Object.entries({
    [routeFile]: routeText,
    [componentFile]: componentText,
    [helperFile]: helperText,
    [localValidateBridgeFile]: localValidateBridgeText,
    [localValidateRouteFile]: localValidateRouteText,
  })) {
    for (const marker of [
      "REAL TRANSCRIPT CAPTURE AFTER MANUAL COPY PACKET",
      "\nRETURNED_CODEX_RESPONSE:\n",
      "END RETURNED_CODEX_RESPONSE",
      "\"draft_version\": \"codex_perspective_candidate_draft.v0.1\"",
    ]) {
      assert.equal(
        source.includes(marker),
        false,
        `${file} must not inline raw returned envelope marker ${marker}`,
      );
    }
  }
}

function assertNoRawPacketPayloadMarkers(packet) {
  for (const marker of [
    "REAL TRANSCRIPT CAPTURE AFTER MANUAL COPY PACKET",
    "\nRETURNED_CODEX_RESPONSE:\n",
    "\nEND RETURNED_CODEX_RESPONSE",
    "BEGIN_HIDDEN_REASONING",
    "HIDDEN_REASONING:",
    "PROVIDER_LOG:",
    "PROVIDER_LOGS:",
    "TOKEN=",
    "sk-",
    "raw_source_packet:",
  ]) {
    assert.equal(
      packet.includes(marker),
      false,
      `copy packet must not inline raw marker ${marker}`,
    );
  }
}

function assertIncludesAll(source, phrases) {
  for (const phrase of phrases) {
    assert(source.includes(phrase), `expected source to include: ${phrase}`);
  }
}

function countOccurrences(source, phrase) {
  return source.split(phrase).length - 1;
}

function buildCandidateDraft({
  action,
  validation,
  scenarioKey,
  draftId,
  supersedesDraftId,
}) {
  const viewModel =
    buildCodexFormerLocalAdapterOperatorFlowViewModel(fixtureInput);
  const scenario = viewModel.scenarios[scenarioKey];
  return buildCodexFormerLocalAdapterAcceptedCandidateDraft({
    nowIso: "2026-06-12T00:00:00.000Z",
    draftId: draftId ?? `local-candidate-draft:${action}:${scenarioKey}`,
    operatorFlowDraftId: "local-adapter-operator-flow-draft:v0.1",
    candidateAction: action,
    validation,
    sourceInputRef: scenario.source_input_ref.path,
    prepareSummaryRef: scenario.prepare_summary_ref.path,
    reviewSummary: scenario.candidate_review_material.review_summary,
    changedFilesCount: scenario.candidate_review_material.changed_files_count,
    sourcePrRefs: scenario.candidate_review_material.source_pr_refs,
    supersedesDraftId,
  });
}

function buildQueueItem({ draft, queueItemId }) {
  return buildPerspectiveMemoryLocalReviewQueueItemFromCandidateDraft({
    nowIso: "2026-06-13T00:00:00.000Z",
    queueItemId,
    draft,
    sourceDraftCurrentStatus: "current_local_candidate_draft",
  });
}

function assertNoRawCandidateDraftMarkers(draft) {
  const serialized = JSON.stringify(draft);
  for (const marker of [
    "REAL TRANSCRIPT CAPTURE AFTER MANUAL COPY PACKET",
    "RETURNED_CODEX_RESPONSE",
    "END RETURNED_CODEX_RESPONSE",
    "draft_kind: codex_perspective_candidate_draft",
    "raw_source_packet",
    "raw_prompt",
    "raw_candidate",
    "raw private",
    "PROVIDER_LOG",
    "PROVIDER_LOGS",
    "TOKEN=",
    "browser_dump",
    "raw_diff",
    "raw_review_payload",
  ]) {
    assert.equal(
      serialized.includes(marker),
      false,
      `candidate draft must not persist raw marker ${marker}`,
    );
  }
}

function assertNoRawQueueItemMarkers(item) {
  const serialized = JSON.stringify(item);
  for (const marker of [
    "REAL TRANSCRIPT CAPTURE AFTER MANUAL COPY PACKET",
    "RETURNED_CODEX_RESPONSE",
    "END RETURNED_CODEX_RESPONSE",
    "draft_kind: codex_perspective_candidate_draft",
    "raw_source_packet",
    "raw_prompt",
    "raw_candidate",
    "raw private",
    "PROVIDER_LOG",
    "PROVIDER_LOGS",
    "TOKEN=",
    "browser_dump",
    "raw_diff",
    "raw_review_payload",
  ]) {
    assert.equal(
      serialized.includes(marker),
      false,
      `queue item must not persist raw marker ${marker}`,
    );
  }
}

function createMockStorage() {
  const values = new Map();
  return {
    values,
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}
