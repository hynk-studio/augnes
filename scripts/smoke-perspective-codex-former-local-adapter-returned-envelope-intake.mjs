import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

const expectedTsxCommand =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json";
const packageFile = "package.json";
const helperFile =
  "lib/perspective-ingest/codex-former-local-adapter-returned-envelope-intake.ts";
const operatorFlowFile =
  "lib/perspective-ingest/codex-former-local-adapter-operator-flow.ts";
const localValidateBridgeFile =
  "lib/perspective-ingest/codex-former-local-adapter-operator-flow-local-validate.ts";
const getRouteFile =
  "app/api/perspective/codex-former/local-adapter-operator-flow/returned-envelope-intake/route.ts";
const postRouteFile =
  "app/api/perspective/codex-former/local-adapter-operator-flow/returned-envelope-intake/validate/route.ts";
const componentFile =
  "app/cockpit/perspective/codex-former/local-adapter-operator-flow/operator-flow-surface.tsx";
const docFile =
  "docs/PERSPECTIVE_CODEX_FORMER_RETURNED_ENVELOPE_INTAKE_V0_1.md";
const reportFile =
  "reports/2026-06-14-perspective-codex-former-returned-envelope-intake.md";
const smokeFile =
  "scripts/smoke-perspective-codex-former-local-adapter-returned-envelope-intake.mjs";
const committedIntakeFixtureFile =
  "reports/intake/codex-former-returned-envelopes/2026-06-14-codex-former-local-adapter-returned-envelope-ready.txt";
const sourceFollowUpFile =
  "reports/fixtures/2026-06-11-codex-former-local-adapter-source-input.json";
const prepareFollowUpFile =
  "reports/fixtures/2026-06-12-codex-former-local-adapter-prepare-execution-summary-pass-with-follow-up.json";
const tmpRoot =
  "/tmp/augnes-codex-former-returned-envelope-intake-smoke";

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const helperText = readFileSync(helperFile, "utf8");
const operatorFlowText = readFileSync(operatorFlowFile, "utf8");
const localValidateBridgeText = readFileSync(localValidateBridgeFile, "utf8");
const getRouteText = readFileSync(getRouteFile, "utf8");
const postRouteText = readFileSync(postRouteFile, "utf8");
const componentText = readFileSync(componentFile, "utf8");
const docText = readFileSync(docFile, "utf8");
const reportText = readFileSync(reportFile, "utf8");
const readyEnvelopeText = readFileSync(committedIntakeFixtureFile, "utf8");

const {
  CODEX_FORMER_LOCAL_ADAPTER_RETURNED_ENVELOPE_MAX_BYTES,
  listCodexFormerLocalAdapterReturnedEnvelopeIntakeRefs,
  validateCodexFormerLocalAdapterReturnedEnvelopeIntake,
} = await import(
  "../lib/perspective-ingest/codex-former-local-adapter-returned-envelope-intake.ts"
);
const {
  CODEX_FORMER_LOCAL_ADAPTER_OPERATOR_FLOW_RETURNED_ENVELOPE_INTAKE_ROUTE,
  CODEX_FORMER_LOCAL_ADAPTER_OPERATOR_FLOW_RETURNED_ENVELOPE_INTAKE_VALIDATE_ROUTE,
  CODEX_FORMER_LOCAL_ADAPTER_RETURNED_ENVELOPE_INTAKE_DIR,
} = await import(
  "../lib/perspective-ingest/codex-former-local-adapter-operator-flow.ts"
);
const {
  hashCodexFormerLocalAdapterContent,
} = await import(
  "../lib/perspective-ingest/codex-former-local-adapter-manifest-to-source-input.ts"
);

rmSync(tmpRoot, { recursive: true, force: true });
const tmpIntakeDir = join(
  tmpRoot,
  CODEX_FORMER_LOCAL_ADAPTER_RETURNED_ENVELOPE_INTAKE_DIR,
);
mkdirSync(tmpIntakeDir, { recursive: true });

const olderRef = `${CODEX_FORMER_LOCAL_ADAPTER_RETURNED_ENVELOPE_INTAKE_DIR}/2026-06-14-older-ready.txt`;
const latestRef = `${CODEX_FORMER_LOCAL_ADAPTER_RETURNED_ENVELOPE_INTAKE_DIR}/2026-06-14-latest-ready.txt`;
const oversizedRef = `${CODEX_FORMER_LOCAL_ADAPTER_RETURNED_ENVELOPE_INTAKE_DIR}/2026-06-14-oversized.txt`;
writeFileSync(join(tmpRoot, olderRef), readyEnvelopeText, "utf8");
writeFileSync(join(tmpRoot, latestRef), readyEnvelopeText, "utf8");
writeFileSync(
  join(tmpRoot, oversizedRef),
  "x".repeat(CODEX_FORMER_LOCAL_ADAPTER_RETURNED_ENVELOPE_MAX_BYTES + 1),
  "utf8",
);
utimesSync(
  join(tmpRoot, olderRef),
  new Date("2026-06-14T00:00:00.000Z"),
  new Date("2026-06-14T00:00:00.000Z"),
);
utimesSync(
  join(tmpRoot, latestRef),
  new Date("2026-06-14T01:00:00.000Z"),
  new Date("2026-06-14T01:00:00.000Z"),
);
utimesSync(
  join(tmpRoot, oversizedRef),
  new Date("2026-06-14T02:00:00.000Z"),
  new Date("2026-06-14T02:00:00.000Z"),
);

assertPackageScripts();
assertFilesExist();
assertHelperContracts();
assertCommittedIntakeList();
assertTempIntakeList();
assertValidIntakeValidation();
assertBlockedIntakeValidation();
assertRoutesAndSurface();
assertDocsAndReport();
assertNoForbiddenMutationPaths();

console.log(
  "PASS smoke:perspective-codex-former-local-adapter-returned-envelope-intake",
);

function assertPackageScripts() {
  assert.equal(
    packageJson.scripts[
      "smoke:perspective-codex-former-local-adapter-returned-envelope-intake"
    ],
    `${expectedTsxCommand} ${smokeFile}`,
  );
}

function assertFilesExist() {
  for (const file of [
    helperFile,
    operatorFlowFile,
    localValidateBridgeFile,
    getRouteFile,
    postRouteFile,
    componentFile,
    docFile,
    reportFile,
    smokeFile,
    committedIntakeFixtureFile,
    sourceFollowUpFile,
    prepareFollowUpFile,
  ]) {
    assert.equal(existsSync(file), true, `${file} must exist`);
  }
}

function assertHelperContracts() {
  assertIncludesAll(helperText, [
    "CODEX_FORMER_LOCAL_ADAPTER_RETURNED_ENVELOPE_INTAKE_DIR",
    "CODEX_FORMER_LOCAL_ADAPTER_RETURNED_ENVELOPE_MAX_BYTES = 20000",
    "listCodexFormerLocalAdapterReturnedEnvelopeIntakeRefs",
    "validateCodexFormerLocalAdapterReturnedEnvelopeIntake",
    "resolveReturnedEnvelopeIntakeRef",
    "returned_envelope_ref must stay under",
    "returned_envelope_ref must be normalized",
    "returned_envelope_ref must not be a symlink",
    "returned_envelope_ref exceeds",
    "runOperatorFlowLocalValidationBridge",
    "buildOperatorFlowBlockedBeforeExecutionResponse",
  ]);
  assertIncludesAll(operatorFlowText, [
    "CODEX_FORMER_LOCAL_ADAPTER_RETURNED_ENVELOPE_INTAKE_DIR",
    "reports/intake/codex-former-returned-envelopes",
    "CODEX_FORMER_LOCAL_ADAPTER_OPERATOR_FLOW_RETURNED_ENVELOPE_INTAKE_ROUTE",
    "CODEX_FORMER_LOCAL_ADAPTER_OPERATOR_FLOW_RETURNED_ENVELOPE_INTAKE_VALIDATE_ROUTE",
    "OperatorFlowReturnedEnvelopeIntakeEntry",
    "OperatorFlowReturnedEnvelopeIntakeListResponse",
    "OperatorFlowReturnedEnvelopeIntakeValidationResponse",
  ]);
  assertIncludesAll(localValidateBridgeText, [
    "buildOperatorFlowBlockedBeforeExecutionResponse",
    "blocked_before_execution",
  ]);
}

function assertCommittedIntakeList() {
  const list = listCodexFormerLocalAdapterReturnedEnvelopeIntakeRefs();
  const committed = list.entries.find(
    (entry) => entry.ref === committedIntakeFixtureFile,
  );
  assert(committed, "committed intake fixture must be listed");
  assert.equal(committed.valid, true);
  assert.equal(committed.blocked_reasons.length, 0);
  assert.equal(
    committed.content_hash,
    hashCodexFormerLocalAdapterContent(readyEnvelopeText),
  );
  assert.equal(list.boundary, "review-only local-only non-authorizing");
}

function assertTempIntakeList() {
  const list = listCodexFormerLocalAdapterReturnedEnvelopeIntakeRefs({
    cwd: tmpRoot,
  });
  assert.equal(list.latest_ref, latestRef);
  assert.equal(list.latest?.ref, latestRef);
  assert.equal(list.latest?.file_size_bytes, Buffer.byteLength(readyEnvelopeText));
  assert.equal(
    list.latest?.content_hash,
    hashCodexFormerLocalAdapterContent(readyEnvelopeText),
  );
  assert.equal(list.latest?.modified_at, "2026-06-14T01:00:00.000Z");
  const oversized = list.entries.find((entry) => entry.ref === oversizedRef);
  assert(oversized, "oversized temp intake file must be listed");
  assert.equal(oversized.valid, false);
  assert(
    oversized.blocked_reasons.some((reason) =>
      reason.includes("exceeds 20000 bytes"),
    ),
  );
}

function assertValidIntakeValidation() {
  const result = validateCodexFormerLocalAdapterReturnedEnvelopeIntake(
    {
      returned_envelope_ref: latestRef,
      source_input_ref: sourceFollowUpFile,
      prepare_summary_ref: prepareFollowUpFile,
    },
    { cwd: tmpRoot },
  );
  assert.equal(result.validation_source, "real_local_validate_execution");
  assert.equal(result.validation_result.result_state, "PASS with follow-up");
  assert.equal(result.validation_result.execution_result, "success");
  assert.equal(result.validation_result.candidate_count, 1);
  assert.equal(result.returned_envelope_intake?.ref, latestRef);
  assert.equal(result.returned_envelope_text, readyEnvelopeText);
  assert.equal(
    result.returned_envelope_intake?.content_hash,
    result.validation_result.returned_envelope_hash,
  );
  assert.match(result.validation_result.validation_summary_hash, /^[a-f0-9]{64}$/);
}

function assertBlockedIntakeValidation() {
  const oversized = validateCodexFormerLocalAdapterReturnedEnvelopeIntake(
    {
      returned_envelope_ref: oversizedRef,
      source_input_ref: sourceFollowUpFile,
      prepare_summary_ref: prepareFollowUpFile,
    },
    { cwd: tmpRoot },
  );
  assert.equal(oversized.validation_source, "blocked_before_execution");
  assert.equal(oversized.validation_result.result_state, "BLOCKED");
  assert.equal(oversized.returned_envelope_text, null);
  assert(
    oversized.validation_result.blocked_reasons.some((reason) =>
      reason.includes("exceeds 20000 bytes"),
    ),
  );

  const traversal = validateCodexFormerLocalAdapterReturnedEnvelopeIntake(
    {
      returned_envelope_ref:
        "reports/intake/codex-former-returned-envelopes/../escape.txt",
      source_input_ref: sourceFollowUpFile,
      prepare_summary_ref: prepareFollowUpFile,
    },
    { cwd: tmpRoot },
  );
  assert.equal(traversal.validation_source, "blocked_before_execution");
  assert.equal(traversal.returned_envelope_text, null);
  assert(
    traversal.validation_result.blocked_reasons.some((reason) =>
      reason.includes("must be normalized"),
    ),
  );

  const arbitraryPath = validateCodexFormerLocalAdapterReturnedEnvelopeIntake(
    {
      returned_envelope_ref:
        "reports/fixtures/2026-06-12-codex-former-local-adapter-returned-candidate-envelope-ready.txt",
      source_input_ref: sourceFollowUpFile,
      prepare_summary_ref: prepareFollowUpFile,
    },
    { cwd: tmpRoot },
  );
  assert.equal(arbitraryPath.validation_source, "blocked_before_execution");
  assert(
    arbitraryPath.validation_result.blocked_reasons.some((reason) =>
      reason.includes("must stay under"),
    ),
  );

  const missingBody = validateCodexFormerLocalAdapterReturnedEnvelopeIntake(null, {
    cwd: tmpRoot,
  });
  assert.equal(missingBody.validation_source, "blocked_before_execution");
  assert(
    missingBody.validation_result.blocked_reasons.includes(
      "request body must be a JSON object",
    ),
  );
}

function assertRoutesAndSurface() {
  assertIncludesAll(getRouteText, [
    "listCodexFormerLocalAdapterReturnedEnvelopeIntakeRefs",
    "export async function GET",
    "NextResponse.json",
    "export const runtime = \"nodejs\"",
  ]);
  assertIncludesAll(postRouteText, [
    "validateCodexFormerLocalAdapterReturnedEnvelopeIntake",
    "export async function POST",
    "NextResponse.json",
    "export const runtime = \"nodejs\"",
  ]);
  assertIncludesAll(componentText, [
    "Codex Returned Envelope Intake",
    "Refresh intake list",
    "Load latest Codex return + validate",
    "Load selected Codex return + validate",
    "CODEX_FORMER_LOCAL_ADAPTER_OPERATOR_FLOW_RETURNED_ENVELOPE_INTAKE_ROUTE",
    "CODEX_FORMER_LOCAL_ADAPTER_OPERATOR_FLOW_RETURNED_ENVELOPE_INTAKE_VALIDATE_ROUTE",
    "data-augnes-returned-envelope-intake-panel",
    "data-augnes-refresh-intake-list",
    "data-augnes-load-latest-returned-envelope-intake",
    "data-augnes-intake-ref-select",
    "latest_returned_envelope_ref",
    "latest_hash",
    "latest_size",
    "latest_modified_at",
    "invalid_intake_refs",
    "This automation only loads one returned envelope",
    "It does not create candidate drafts",
  ]);
  assert.equal(
    getRouteText.includes("fetch(") || postRouteText.includes("fetch("),
    false,
    "server routes must not call external services",
  );
  assert.equal(
    componentText.includes("navigator.clipboard"),
    false,
    "intake panel must not use clipboard automation",
  );
  assert.equal(
    CODEX_FORMER_LOCAL_ADAPTER_OPERATOR_FLOW_RETURNED_ENVELOPE_INTAKE_ROUTE,
    "/api/perspective/codex-former/local-adapter-operator-flow/returned-envelope-intake",
  );
  assert.equal(
    CODEX_FORMER_LOCAL_ADAPTER_OPERATOR_FLOW_RETURNED_ENVELOPE_INTAKE_VALIDATE_ROUTE,
    "/api/perspective/codex-former/local-adapter-operator-flow/returned-envelope-intake/validate",
  );
}

function assertDocsAndReport() {
  for (const text of [docText, reportText]) {
    assertIncludesAll(text, [
      "manual paste + manual local validation",
      "candidate draft creation remains user-controlled",
      "no DB write",
      "no memory write",
      "no Core/runtime/provider/GitHub mutation",
      "reports/intake/codex-former-returned-envelopes/",
      "path safety",
      "not candidate acceptance",
      "not memory persistence",
    ]);
  }
}

function assertNoForbiddenMutationPaths() {
  const sourceByFile = {
    [helperFile]: helperText,
    [getRouteFile]: getRouteText,
    [postRouteFile]: postRouteText,
  };
  for (const [file, source] of Object.entries(sourceByFile)) {
    for (const forbidden of [
      "appendCodexFormerLocalAdapterCandidateDraftToList",
      "appendPerspectiveMemoryLocalReviewQueueItem",
      "perspective-memory-local-write-proposal",
      "perspective-memory-local-write-proposal-review-checklist",
      "perspective-memory-product-persistence-boundary",
      "perspective-memory-item-store",
      "PrismaClient",
      "better-sqlite3",
      "process.env.OPENAI",
      "OpenAI",
      "new Octokit",
      "github.rest",
      "createCore",
      "createAcceptedState",
      "reviewDecision",
      "vector",
      "embedding",
    ]) {
      assert.equal(
        source.includes(forbidden),
        false,
        `${file} must not contain forbidden mutation marker ${forbidden}`,
      );
    }
    assert.equal(source.includes("https://"), false, `${file} must not call URLs`);
  }
}

function assertIncludesAll(text, needles) {
  for (const needle of needles) {
    assert(text.includes(needle), `expected source to include: ${needle}`);
  }
}
