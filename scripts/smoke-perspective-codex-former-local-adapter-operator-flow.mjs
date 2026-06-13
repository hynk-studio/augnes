import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import operatorFlow from "../lib/perspective-ingest/codex-former-local-adapter-operator-flow.ts";

const {
  CODEX_FORMER_LOCAL_ADAPTER_OPERATOR_FLOW_ROUTE,
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
const smokeFile =
  "scripts/smoke-perspective-codex-former-local-adapter-operator-flow.mjs";
const browserSmokeFile =
  "scripts/browser-smoke-perspective-codex-former-local-adapter-operator-flow.mjs";
const docFile =
  "docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_OPERATOR_FLOW_V0_1.md";
const reportFile =
  "reports/2026-06-12-perspective-codex-former-local-adapter-operator-flow.md";
const browserReportFile =
  "reports/browser/2026-06-12-perspective-codex-former-local-adapter-operator-flow.md";

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
const docText = readFileSync(docFile, "utf8");
const reportText = readFileSync(reportFile, "utf8");

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
}

function assertFilesExist() {
  for (const file of [
    routeFile,
    componentFile,
    cssFile,
    helperFile,
    smokeFile,
    browserSmokeFile,
    docFile,
    reportFile,
    browserReportFile,
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
    viewModel.scenarios.pass_with_follow_up.validation_result.result_state,
    "PASS with follow-up",
  );
  assert.equal(
    viewModel.scenarios.blocked.validation_result.result_state,
    "BLOCKED",
  );
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
    "Paste the returned envelope into the Returned Envelope panel, then select Validate locally / Preview validation result.",
    "This route only stages a local draft.",
  ]);
  assertNoRawPacketPayloadMarkers(viewModel.copy_packet_preview);

  const previewPass = previewOperatorFlowValidationResult(
    fixtureInput.scenarios.pass.returnedEnvelopeText,
    viewModel,
    "pass",
  );
  assert.equal(previewPass.validation_result.result_state, "PASS");
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
    }),
    viewModel,
    "2026-06-12T00:00:00.000Z",
  );
  assert.equal(savedTextDraft.returned_envelope_text, "explicit local draft");

  const storage = createMockStorage();
  const initialDraft = createInitialOperatorFlowDraft(
    viewModel,
    "2026-06-12T00:00:00.000Z",
  );
  saveOperatorFlowDraftToStorage(storage, viewModel, initialDraft);
  assert.equal(storage.values.has(viewModel.storage_namespace), true);
  const loadedDraft = loadOperatorFlowDraftFromStorage(
    storage,
    viewModel,
    "2026-06-12T00:00:01.000Z",
  );
  assert.equal(loadedDraft.draft_id, initialDraft.draft_id);
  clearOperatorFlowDraftFromStorage(storage, viewModel);
  assert.equal(storage.values.has(viewModel.storage_namespace), false);
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
    "Local Storage Boundary",
    "Load PASS envelope fixture",
    "Load PASS with follow-up envelope fixture",
    "Load BLOCKED envelope fixture",
    "Clear returned envelope draft",
    "Save draft locally",
    "Clear local draft",
    "Validate locally / Preview validation result",
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
    "data-augnes-validate-preview",
    "data-augnes-candidate-action",
  ]);
  for (const action of operatorFlowCandidateActions) {
    assert(componentText.includes(action), `component must include ${action}`);
  }
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
    ".actionGrid",
    "@media (max-width: 520px)",
    "overflow-wrap: anywhere",
  ]);
}

function assertDocsAndReports() {
  assertIncludesAll(docText, [
    "# Local Codex Adapter Operator Flow v0.1",
    CODEX_FORMER_LOCAL_ADAPTER_OPERATOR_FLOW_ROUTE,
    CODEX_FORMER_LOCAL_ADAPTER_OPERATOR_FLOW_STORAGE_NAMESPACE,
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
    "PASS / PASS with follow-up / BLOCKED",
    "no accepted Augnes state",
    "no review decision",
  ]);
}

function assertRuntimeBoundary() {
  const sourceByFile = {
    [routeFile]: routeText,
    [componentFile]: componentText,
    [helperFile]: helperText,
  };
  for (const [file, source] of Object.entries(sourceByFile)) {
    for (const forbidden of [
      "navigator.clipboard",
      "document.execCommand",
      "fetch(",
      "XMLHttpRequest",
      "new WebSocket",
      "OpenAI",
      "new Octokit",
      "PrismaClient",
      "better-sqlite3",
      "process.env.OPENAI",
      "github.rest",
    ]) {
      assert.equal(
        source.includes(forbidden),
        false,
        `${file} must not contain runtime call marker ${forbidden}`,
      );
    }
  }
}

function assertNoRawFixturePayloadsInSource() {
  for (const [file, source] of Object.entries({
    [routeFile]: routeText,
    [componentFile]: componentText,
    [helperFile]: helperText,
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
