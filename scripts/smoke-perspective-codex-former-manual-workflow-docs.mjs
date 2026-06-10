import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const packageFile = "package.json";
const docFile =
  "docs/PERSPECTIVE_CODEX_FORMER_MANUAL_WORKFLOW_V0_1.md";
const reportFile =
  "reports/2026-06-10-perspective-codex-former-manual-workflow-docs.md";
const smokeFile =
  "scripts/smoke-perspective-codex-former-manual-workflow-docs.mjs";
const separateSessionCaptureSmokeFile =
  "scripts/smoke-perspective-codex-former-separate-session-provenance-clean-capture.mjs";
const separateSessionPrepSmokeFile =
  "scripts/smoke-perspective-codex-former-separate-session-capture-packet-prep.mjs";
const manualCopyPacketSmokeFile =
  "scripts/smoke-perspective-codex-former-manual-copy-packet.mjs";
const captureHelperFile =
  "scripts/perspective-codex-former-capture-helper.mjs";
const captureHelperSmokeFile =
  "scripts/smoke-perspective-codex-former-capture-helper.mjs";
const captureHelperReportFile =
  "reports/2026-06-10-perspective-codex-former-capture-helper.md";
const parameterizedCaptureHelperReportFile =
  "reports/2026-06-10-perspective-codex-former-capture-helper-parameterized-input.md";
const sourceInputTemplateDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_CAPTURE_SOURCE_INPUT_TEMPLATE_V0_1.md";
const sourceInputHardeningReportFile =
  "reports/2026-06-10-perspective-codex-former-source-input-hardening.md";
const workflowCloseoutDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_WORKFLOW_CLOSEOUT_V0_1.md";
const workflowCloseoutReportFile =
  "reports/2026-06-10-perspective-codex-former-workflow-closeout.md";
const workflowCloseoutSmokeFile =
  "scripts/smoke-perspective-codex-former-workflow-closeout.mjs";
const productSurfaceDesignDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_PRODUCT_SURFACE_DESIGN_V0_1.md";
const productSurfaceDesignReportFile =
  "reports/2026-06-10-perspective-codex-former-product-surface-design.md";
const productSurfaceDesignSmokeFile =
  "scripts/smoke-perspective-codex-former-product-surface-design.mjs";
const constellationProjectionModuleFile =
  "lib/perspective-ingest/perspective-codex-former-constellation-projection.ts";
const constellationProjectionDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_CONSTELLATION_PROJECTION_V0_1.md";
const constellationProjectionReportFile =
  "reports/2026-06-10-perspective-codex-former-constellation-projection.md";
const constellationProjectionSmokeFile =
  "scripts/smoke-perspective-codex-former-constellation-projection.mjs";
const fixturePreviewDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_CONSTELLATION_FIXTURE_PREVIEW_V0_1.md";
const fixturePreviewReportFile =
  "reports/2026-06-10-perspective-codex-former-constellation-fixture-preview.md";
const fixturePreviewPassFixtureFile =
  "reports/fixtures/2026-06-10-codex-former-constellation-pass-with-follow-up.json";
const fixturePreviewBlockedFixtureFile =
  "reports/fixtures/2026-06-10-codex-former-constellation-blocked.json";
const fixturePreviewDogfoodFile =
  "scripts/dogfood-perspective-codex-former-constellation-fixture-preview.mjs";
const fixturePreviewSmokeFile =
  "scripts/smoke-perspective-codex-former-constellation-fixture-preview.mjs";
const previewDataAdapterModuleFile =
  "lib/perspective-ingest/perspective-codex-former-constellation-preview-data-adapter.ts";
const previewDataAdapterDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_CONSTELLATION_PREVIEW_DATA_ADAPTER_V0_1.md";
const previewDataAdapterReportFile =
  "reports/2026-06-10-perspective-codex-former-constellation-preview-data-adapter.md";
const previewDataAdapterPassFixtureFile =
  "reports/fixtures/2026-06-10-codex-former-constellation-preview-data-pass-with-follow-up.json";
const previewDataAdapterBlockedFixtureFile =
  "reports/fixtures/2026-06-10-codex-former-constellation-preview-data-blocked.json";
const previewDataAdapterDogfoodFile =
  "scripts/dogfood-perspective-codex-former-constellation-preview-data-adapter.mjs";
const previewDataAdapterSmokeFile =
  "scripts/smoke-perspective-codex-former-constellation-preview-data-adapter.mjs";

const expectedTsxCommand =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json";
const allowedChangedFiles = new Set([
  packageFile,
  docFile,
  reportFile,
  smokeFile,
  separateSessionCaptureSmokeFile,
  separateSessionPrepSmokeFile,
  manualCopyPacketSmokeFile,
  captureHelperFile,
  captureHelperSmokeFile,
  captureHelperReportFile,
  parameterizedCaptureHelperReportFile,
  sourceInputTemplateDocFile,
  sourceInputHardeningReportFile,
  workflowCloseoutDocFile,
  workflowCloseoutReportFile,
  workflowCloseoutSmokeFile,
  productSurfaceDesignDocFile,
  productSurfaceDesignReportFile,
  productSurfaceDesignSmokeFile,
  constellationProjectionModuleFile,
  constellationProjectionDocFile,
  constellationProjectionReportFile,
  constellationProjectionSmokeFile,
  fixturePreviewDocFile,
  fixturePreviewReportFile,
  fixturePreviewPassFixtureFile,
  fixturePreviewBlockedFixtureFile,
  fixturePreviewDogfoodFile,
  fixturePreviewSmokeFile,
  previewDataAdapterModuleFile,
  previewDataAdapterDocFile,
  previewDataAdapterReportFile,
  previewDataAdapterPassFixtureFile,
  previewDataAdapterBlockedFixtureFile,
  previewDataAdapterDogfoodFile,
  previewDataAdapterSmokeFile,
]);

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const docText = `${readFileSync(docFile, "utf8")}\n${readFileSync(
  sourceInputTemplateDocFile,
  "utf8",
)}`;
const reportText = `${readFileSync(reportFile, "utf8")}\n${readFileSync(
  sourceInputHardeningReportFile,
  "utf8",
)}`;
const smokeText = readFileSync(smokeFile, "utf8");

assert.equal(existsSync(docFile), true, `${docFile} must exist`);
assert.equal(existsSync(reportFile), true, `${reportFile} must exist`);
assert.equal(existsSync(smokeFile), true, `${smokeFile} must exist`);

assert.equal(
  packageJson.scripts["smoke:perspective-codex-former-manual-workflow-docs"],
  `${expectedTsxCommand} ${smokeFile}`,
  "package.json must register manual workflow docs smoke",
);

assertManualWorkflowDoc();
assertReport();
assertNoRawUnsafeMarkersInPublicArtifacts();
assertNoForbiddenSurfaces();
assertChangedFileBoundary();

console.log("PASS smoke:perspective-codex-former-manual-workflow-docs");

function assertManualWorkflowDoc() {
  assertContainsAll(docText, [
    "Perspective Codex Former Manual Workflow v0.1",
    "Manual Codex Former Draft Copy Packet",
    "separate user-started Codex session",
    "CodexPerspectiveCandidateDraft JSON object",
    "source_manual_copy_packet_id",
    "source_former_input_packet_id",
    "source_prompt_hash",
    "not_supplied_in_chat",
    "CodexPerspectiveFormerDraftPromptContract v0.1",
    "No stale PR #479 wording",
    "REAL TRANSCRIPT CAPTURE AFTER MANUAL COPY PACKET",
    "RETURNED_CODEX_RESPONSE:",
    "END RETURNED_CODEX_RESPONSE",
    "evaluateCodexPerspectiveCandidateDraftPromptContractFit",
    "validateAndNormalizeCodexPerspectiveCandidateDraft",
    "alignment only as a safety-net comparison",
    "Worker-Facing Guidance only after direct validation",
    "Operator Capture Helper",
    "npm run perspective:codex-former:capture-packet",
    "npm run perspective:codex-former:validate-capture",
    "copyable prompt file",
    "capture return envelope template file",
    "metadata file",
    "The helper does not paste into Codex",
    "--source-input",
    "capture_source_kind",
    "source_input_hash",
    "PERSPECTIVE_CODEX_FORMER_CAPTURE_SOURCE_INPUT_TEMPLATE_V0_1.md",
    "exactly one returned candidate draft JSON object",
    "Perspective Codex Former Capture Source Input Template v0.1",
    "generated Formation Input Bundle path",
    "PASS with follow-up",
    "BLOCKED with useful findings",
    "pointer_ref:draft.evidence_pointer_refs[0]",
    "pointer_ref:draft.evidence_pointer_refs[1]",
    "unknown_pointer_ref",
    "non_committed",
    "needs_review",
    "authority flags are all false",
    "Privacy And Redaction",
    "Operator Checklist",
    "When Not To Use",
    "PR #492",
    "Add operator-facing capture helper or CLI wrapper",
  ]);
  assertContainsAll(docText, [
    "- [ ] Packet id recorded",
    "- [ ] Former input packet id recorded",
    "- [ ] Prompt hash recorded",
    "- [ ] Stable contract label present",
    "- [ ] ids/hash match generated packet",
    "- [ ] pointer warnings reviewed",
    "- [ ] Worker-Facing Guidance advisory-only if run",
  ]);
  assert.equal(
    docText.includes("This workflow creates accepted Augnes state"),
    false,
  );
  assert.equal(docText.includes("This workflow creates proof"), false);
  assert.equal(docText.includes("This workflow creates readiness"), false);
}

function assertReport() {
  assertContainsAll(reportText, [
    "Perspective Codex Former Manual Workflow Docs",
    "Conclusion: PASS with follow-up",
    "Why Follows PR #492",
    "What Is Promoted To Manual Workflow",
    "What Remains Needs Review",
    "Pointer Warning Note",
    "Authority Boundary",
    "Privacy/Redaction Policy",
    "Verification",
    "Skipped Checks With Reasons",
    "Add operator-facing capture helper or CLI wrapper",
  ]);
}

function assertNoForbiddenSurfaces() {
  for (const snippet of [
    "await" + " fetch(",
    "globalThis" + ".fetch(",
    "XML" + "HttpRequest",
    "responses" + ".create",
    "openai" + ".chat",
    "app" + "/api/",
    "clip" + "board",
  ]) {
    assert.equal(smokeText.includes(snippet), false);
  }
}

function assertChangedFileBoundary() {
  for (const changedFile of collectChangedFiles()) {
    assert(
      allowedChangedFiles.has(changedFile),
      `Perspective Codex former manual workflow docs changed an out-of-scope file: ${changedFile}`,
    );
    assert(
      !changedFile.startsWith("app" + "/api/") &&
        !changedFile.startsWith("components/") &&
        changedFile !== "app/globals.css" &&
        (!changedFile.startsWith("lib/") ||
          changedFile === constellationProjectionModuleFile ||
          changedFile === previewDataAdapterModuleFile),
      `Perspective Codex former manual workflow docs must not change forbidden surfaces: ${changedFile}`,
    );
  }
}

function collectChangedFiles() {
  const workingTreeFiles = execFileSync(
    "git",
    ["diff", "--name-only", "--diff-filter=ACMR"],
    { encoding: "utf8" },
  )
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const stagedFiles = execFileSync(
    "git",
    ["diff", "--cached", "--name-only", "--diff-filter=ACMR"],
    { encoding: "utf8" },
  )
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  let branchFiles = [];
  try {
    branchFiles = execFileSync(
      "git",
      ["diff", "--name-only", "--diff-filter=ACMR", "origin/main...HEAD"],
      { encoding: "utf8" },
    )
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    throw new Error(
      "Unable to collect base diff for Perspective Codex former manual workflow docs smoke",
    );
  }
  const untrackedFiles = execFileSync(
    "git",
    ["ls-files", "--others", "--exclude-standard"],
    { encoding: "utf8" },
  )
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return [
    ...new Set([
      ...workingTreeFiles,
      ...stagedFiles,
      ...branchFiles,
      ...untrackedFiles,
    ]),
  ].sort();
}

function assertContainsAll(value, expectedSnippets) {
  for (const snippet of expectedSnippets) {
    assert(
      value.includes(snippet),
      `expected text to include ${JSON.stringify(snippet)}`,
    );
  }
}

function assertNoRawUnsafeMarkersInPublicArtifacts() {
  const publicText = `${docText}\n${reportText}`;
  for (const marker of [
    "hidden" + "_reasoning",
    "raw_page" + "_dump",
    "raw_pr" + "_diff",
    "raw_review" + "_payload",
    "access" + "_token",
    "refresh" + "_token",
    "api" + "_key",
    "oauth" + "_token",
    "sk-proj" + "-",
    "ghp" + "_",
  ]) {
    assert.equal(
      publicText.includes(marker),
      false,
      `public docs/report must not echo raw unsafe marker ${marker}`,
    );
  }
}
