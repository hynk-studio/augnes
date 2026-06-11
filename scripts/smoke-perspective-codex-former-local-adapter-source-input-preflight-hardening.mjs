import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import localAdapter from "../lib/perspective-ingest/codex-former-local-adapter-manifest-to-source-input.ts";

const {
  buildCodexFormerLocalAdapterSourceInputPreflightSummary,
  hashCodexFormerLocalAdapterContent,
  stableStringifyCodexFormerLocalAdapterJson,
  validateCodexFormerLocalAdapterManifest,
  validateCodexFormerLocalAdapterSourceInput,
} = localAdapter;

const packageFile = "package.json";
const libFile =
  "lib/perspective-ingest/codex-former-local-adapter-manifest-to-source-input.ts";
const cliFile =
  "scripts/perspective-codex-former-local-adapter-manifest-to-source-input.mjs";
const manifestSmokeFile =
  "scripts/smoke-perspective-codex-former-local-adapter-manifest-to-source-input.mjs";
const smokeFile =
  "scripts/smoke-perspective-codex-former-local-adapter-source-input-preflight-hardening.mjs";
const implementationDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_MANIFEST_TO_SOURCE_INPUT_V0_1.md";
const docFile =
  "docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_SOURCE_INPUT_PREFLIGHT_HARDENING_V0_1.md";
const designDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_LOCAL_CODEX_INTEGRATION_ADAPTER_DESIGN_V0_1.md";
const implementationReportFile =
  "reports/2026-06-11-perspective-codex-former-local-adapter-manifest-to-source-input.md";
const reportFile =
  "reports/2026-06-11-perspective-codex-former-local-adapter-source-input-preflight-hardening.md";
const snapshotLibFile =
  "lib/perspective-ingest/codex-former-local-adapter-surface-snapshots.ts";
const snapshotCliFile =
  "scripts/perspective-codex-former-local-adapter-surface-snapshots.mjs";
const snapshotSmokeFile =
  "scripts/smoke-perspective-codex-former-local-adapter-surface-snapshots.mjs";
const snapshotDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_SURFACE_SNAPSHOTS_V0_1.md";
const snapshotReportFile =
  "reports/2026-06-11-perspective-codex-former-local-adapter-surface-snapshots.md";
const preflightSummaryFixtureFile =
  "reports/fixtures/2026-06-11-codex-former-local-adapter-source-input-preflight-summary.json";
const sessionNotReadySnapshotFixtureFile =
  "reports/fixtures/2026-06-11-codex-former-local-adapter-session-panel-snapshot-not-ready.json";
const sessionWaitingSnapshotFixtureFile =
  "reports/fixtures/2026-06-11-codex-former-local-adapter-session-panel-snapshot-waiting.json";
const inboxNotReadySnapshotFixtureFile =
  "reports/fixtures/2026-06-11-codex-former-local-adapter-inbox-item-not-ready.json";
const inboxWaitingSnapshotFixtureFile =
  "reports/fixtures/2026-06-11-codex-former-local-adapter-inbox-item-waiting.json";
const validManifestFixtureFile =
  "reports/fixtures/2026-06-11-codex-former-local-adapter-manifest-valid.json";
const expectedSourceInputFixtureFile =
  "reports/fixtures/2026-06-11-codex-former-local-adapter-source-input.json";
const captureHelperFile = "scripts/perspective-codex-former-capture-helper.mjs";
const expectedTsxCommand =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json";

const tmpRoot = "/tmp/augnes-codex-former-local-adapter-preflight-smoke";
const outDir = join(tmpRoot, "out");
const preflightDir = join(tmpRoot, "preflight");
const rejectionDir = join(tmpRoot, "rejections");
const captureHelperOutDir = join(tmpRoot, "capture-helper");
const generatedAt = "2026-06-11T00:00:00.000Z";

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const libText = readFileSync(libFile, "utf8");
const cliText = readFileSync(cliFile, "utf8");
const docText = readFileSync(docFile, "utf8");
const reportText = readFileSync(reportFile, "utf8");
const implementationDocText = readFileSync(implementationDocFile, "utf8");
const implementationReportText = readFileSync(implementationReportFile, "utf8");
const smokeText = readFileSync(smokeFile, "utf8");
const manifestSmokeText = readFileSync(manifestSmokeFile, "utf8");
const validManifestText = readFileSync(validManifestFixtureFile, "utf8");
const validManifest = JSON.parse(validManifestText);
const expectedSourceInputText = readFileSync(
  expectedSourceInputFixtureFile,
  "utf8",
);
const expectedSourceInput = JSON.parse(expectedSourceInputText);

assertPackageScripts();
assertFilesExist();
assertSourceExportsAndCliHelp();
runConversionCompatibility();
runPreflightSuccess();
runCliOptionRejections();
runSourceInputPreflightRejections();
runManifestUnknownFieldRejections();
runUnsafeAndBenignMarkerCases();
assertDocsAndReport();
assertNoRawUnsafeMarkersInPublicArtifacts();
assertNoForbiddenImplementationSurfaces();
assertChangedFileBoundary();

console.log(
  "PASS smoke:perspective-codex-former-local-adapter-source-input-preflight-hardening",
);

function assertPackageScripts() {
  assert.equal(
    packageJson.scripts["perspective:codex-former:local-adapter:source-input"],
    `${expectedTsxCommand} ${cliFile}`,
    "package.json must keep the local adapter CLI script",
  );
  assert.equal(
    packageJson.scripts[
      "smoke:perspective-codex-former-local-adapter-manifest-to-source-input"
    ],
    `${expectedTsxCommand} ${manifestSmokeFile}`,
    "package.json must keep the manifest-to-source-input smoke",
  );
  assert.equal(
    packageJson.scripts[
      "smoke:perspective-codex-former-local-adapter-source-input-preflight-hardening"
    ],
    `${expectedTsxCommand} ${smokeFile}`,
    "package.json must register the source-input preflight hardening smoke",
  );
}

function assertFilesExist() {
  for (const file of [
    libFile,
    cliFile,
    manifestSmokeFile,
    smokeFile,
    implementationDocFile,
    docFile,
    designDocFile,
    implementationReportFile,
    reportFile,
    validManifestFixtureFile,
    expectedSourceInputFixtureFile,
    captureHelperFile,
  ]) {
    assert.equal(existsSync(file), true, `${file} must exist`);
  }
}

function assertSourceExportsAndCliHelp() {
  assertIncludesAll(libText, [
    "validateCodexFormerLocalAdapterSourceInput",
    "assertCodexFormerLocalAdapterSourceInput",
    "buildCodexFormerLocalAdapterSourceInputPreflightSummary",
    "collectUnsafeCodexFormerLocalAdapterSourceInputMarkers",
    "codex_former_local_adapter_source_input_preflight_summary.v0.1",
    "is not allowed in v0.1",
  ]);
  assertIncludesAll(cliText, [
    "--preflight-source-input",
    "unknown option: --",
    "duplicate option: --",
    "preflight_status=",
    "output paths must be distinct",
    "review-only local-only non-authorizing",
  ]);
}

function runConversionCompatibility() {
  rmSync(tmpRoot, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  const stdout = runCli([
    "--manifest",
    validManifestFixtureFile,
    "--out-dir",
    outDir,
    "--generated-at",
    generatedAt,
  ]);
  const sourceInputPath = join(outDir, "codex-former-local-adapter-source-input.json");
  const metadataPath = join(outDir, "codex-former-local-adapter-metadata.json");
  assertIncludesAll(stdout, [
    "mode=manifest-to-source-input",
    `source_input_path=${sourceInputPath}`,
    `metadata_path=${metadataPath}`,
    "source_input_hash=",
  ]);
  const emittedSourceInputText = readFileSync(sourceInputPath, "utf8");
  assert.equal(
    emittedSourceInputText,
    expectedSourceInputText,
    "hardening must not change the committed expected source input fixture",
  );
  const metadata = JSON.parse(readFileSync(metadataPath, "utf8"));
  assert.equal(metadata.manifest_hash, hashText(validManifestText));
  assert.equal(metadata.source_input_hash, hashText(emittedSourceInputText));
  for (const [key, value] of Object.entries(metadata.authority_flags)) {
    assert.equal(value, false, `${key} must remain false`);
  }

  const repeatDir = join(tmpRoot, "repeat");
  mkdirSync(repeatDir, { recursive: true });
  runCli([
    "--manifest",
    validManifestFixtureFile,
    "--out-dir",
    repeatDir,
    "--generated-at",
    generatedAt,
  ]);
  assert.equal(
    readFileSync(join(repeatDir, "codex-former-local-adapter-source-input.json"), "utf8"),
    emittedSourceInputText,
    "repeated deterministic conversion must remain stable",
  );

  rmSync(captureHelperOutDir, { recursive: true, force: true });
  const captureStdout = execFileSync(
    "npm",
    [
      "run",
      "perspective:codex-former:capture-packet",
      "--",
      "--out-dir",
      captureHelperOutDir,
      "--source-input",
      sourceInputPath,
      "--generated-at",
      generatedAt,
    ],
    { encoding: "utf8" },
  );
  assertIncludesAll(captureStdout, [
    "mode=prepare",
    "capture_source_kind=bounded_source_input_file",
    `source_input_hash=${hashText(emittedSourceInputText)}`,
  ]);
}

function runPreflightSuccess() {
  mkdirSync(preflightDir, { recursive: true });
  const summaryPath = join(preflightDir, "preflight-summary.json");
  const stdout = runCli([
    "--preflight-source-input",
    expectedSourceInputFixtureFile,
    "--summary-out",
    summaryPath,
  ]);
  assertIncludesAll(stdout, [
    "mode=source-input-preflight",
    `source_input_path=${resolveFromRepo(expectedSourceInputFixtureFile)}`,
    `summary_path=${summaryPath}`,
    `source_input_hash=${hashText(expectedSourceInputText)}`,
    "preflight_status=passed",
    "authority_boundary=review-only local-only non-authorizing",
  ]);
  assert.equal(existsSync(summaryPath), true);
  assert.equal(
    existsSync(join(preflightDir, "codex-former-local-adapter-source-input.json")),
    false,
    "preflight-only mode must not write source input",
  );
  assert.equal(
    existsSync(join(preflightDir, "codex-former-local-adapter-metadata.json")),
    false,
    "preflight-only mode must not write metadata",
  );

  const summaryText = readFileSync(summaryPath, "utf8");
  const summary = JSON.parse(summaryText);
  assert.equal(
    summary.preflight_summary_version,
    "codex_former_local_adapter_source_input_preflight_summary.v0.1",
  );
  assert.equal(summary.mode, "source-input-preflight");
  assert.equal(summary.generated_at, generatedAt);
  assert.equal(summary.source_input_hash, hashText(expectedSourceInputText));
  assert.equal(summary.status, "passed");
  assert.deepEqual(summary.errors, []);
  assert.equal(summary.warning_count, 0);
  for (const [key, value] of Object.entries(summary.authority_flags)) {
    assert.equal(value, false, `${key} must remain false`);
  }

  const repeatSummaryPath = join(preflightDir, "preflight-summary-repeat.json");
  runCli([
    "--preflight-source-input",
    expectedSourceInputFixtureFile,
    "--summary-out",
    repeatSummaryPath,
  ]);
  assert.equal(
    readFileSync(repeatSummaryPath, "utf8"),
    summaryText,
    "preflight summary must be deterministic for the same source input",
  );

  const pureSummary = buildCodexFormerLocalAdapterSourceInputPreflightSummary({
    sourceInput: expectedSourceInput,
    sourceInputPath: resolveFromRepo(expectedSourceInputFixtureFile),
    sourceInputHash: hashCodexFormerLocalAdapterContent(expectedSourceInputText),
    errors: [],
  });
  assert.equal(pureSummary.status, "passed");
  assert.equal(
    pureSummary.source_input_hash,
    hashCodexFormerLocalAdapterContent(expectedSourceInputText),
  );
}

function runCliOptionRejections() {
  for (const option of [
    "--manifest",
    "--out-dir",
    "--generated-at",
    "--source-input-out",
    "--metadata-out",
    "--summary-out",
    "--preflight-source-input",
  ]) {
    assertIncludesAll(expectCliFailure([option]), [
      `option ${option} requires a value`,
    ]);
    assertIncludesAll(expectCliFailure([option, ""]), [
      `option ${option} requires a value`,
    ]);
  }
  assertIncludesAll(expectCliFailure(["--banana", "value"]), [
    "unknown option: --banana",
  ]);
  assertIncludesAll(expectCliFailure(["unexpected"]), [
    "unexpected positional argument",
  ]);
  assertIncludesAll(
    expectCliFailure([
      "--manifest",
      validManifestFixtureFile,
      "--manifest",
      validManifestFixtureFile,
      "--out-dir",
      outDir,
    ]),
    ["duplicate option: --manifest"],
  );

  const collisionPath = join(tmpRoot, "collision.json");
  assertIncludesAll(
    expectCliFailure([
      "--manifest",
      validManifestFixtureFile,
      "--out-dir",
      outDir,
      "--source-input-out",
      collisionPath,
      "--metadata-out",
      collisionPath,
    ]),
    ["output paths must be distinct"],
  );
  assertIncludesAll(
    expectCliFailure([
      "--manifest",
      validManifestFixtureFile,
      "--out-dir",
      outDir,
      "--metadata-out",
      collisionPath,
      "--summary-out",
      collisionPath,
    ]),
    ["output paths must be distinct"],
  );
  assertIncludesAll(
    expectCliFailure([
      "--preflight-source-input",
      expectedSourceInputFixtureFile,
      "--summary-out",
      expectedSourceInputFixtureFile,
    ]),
    ["output paths must be distinct"],
  );
}

function runSourceInputPreflightRejections() {
  mkdirSync(rejectionDir, { recursive: true });

  writeFileSync(join(rejectionDir, "invalid-source-input.json"), "{ nope", "utf8");
  assertIncludesAll(
    expectPreflightFailure("invalid-source-input.json"),
    ["source input file is not valid JSON"],
  );
  writeFileSync(join(rejectionDir, "non-object-source-input.json"), "[]\n", "utf8");
  assertIncludesAll(
    expectPreflightFailure("non-object-source-input.json"),
    ["source input JSON must be an object"],
  );
  writeRejectedSourceInputCase({
    fileName: "missing-generated-at.json",
    mutate: (sourceInput) => {
      delete sourceInput.generated_at;
    },
    expectedSnippets: ["source_input.generated_at must be a string"],
  });
  writeRejectedSourceInputCase({
    fileName: "missing-scope.json",
    mutate: (sourceInput) => {
      delete sourceInput.scope;
    },
    expectedSnippets: ["source_input.scope must be a string"],
  });
  writeRejectedSourceInputCase({
    fileName: "missing-work-id.json",
    mutate: (sourceInput) => {
      delete sourceInput.work_id;
    },
    expectedSnippets: ["source_input.work_id must be a string"],
  });
  writeRejectedSourceInputCase({
    fileName: "empty-source-pr-refs.json",
    mutate: (sourceInput) => {
      sourceInput.source_pr_refs = [];
    },
    expectedSnippets: ["source_input source_pr_refs must include at least one"],
  });
  writeRejectedSourceInputCase({
    fileName: "empty-changed-files.json",
    mutate: (sourceInput) => {
      sourceInput.changed_files = [];
    },
    expectedSnippets: ["source_input changed_files must include at least one"],
  });
  writeRejectedSourceInputCase({
    fileName: "unsafe-changed-file-path.json",
    mutate: (sourceInput) => {
      sourceInput.changed_files = ["../nope"];
    },
    expectedSnippets: [
      "source_input.changed_files[0] must be a safe relative file path",
    ],
  });
  writeRejectedSourceInputCase({
    fileName: "unsupported-check-status.json",
    mutate: (sourceInput) => {
      sourceInput.tests_checks_run[0].status = "skipped";
    },
    expectedSnippets: [
      "source_input.tests_checks_run[0].status must be passed or failed",
    ],
  });
  writeRejectedSourceInputCase({
    fileName: "unknown-top-level-field.json",
    mutate: (sourceInput) => {
      sourceInput.extra_field = "bounded but unsupported";
    },
    expectedSnippets: ["source_input.extra_field is not allowed in v0.1"],
  });
}

function runManifestUnknownFieldRejections() {
  writeRejectedManifestCase({
    fileName: "manifest-unknown-top-level.json",
    mutate: (manifest) => {
      manifest.extra_field = "bounded but unsupported";
    },
    expectedSnippets: ["manifest.extra_field is not allowed in v0.1"],
  });
  writeRejectedManifestCase({
    fileName: "manifest-unknown-check-field.json",
    mutate: (manifest) => {
      manifest.tests_checks_run[0].extra_field = "bounded but unsupported";
    },
    expectedSnippets: [
      "manifest.tests_checks_run[0].extra_field is not allowed in v0.1",
    ],
  });
  writeRejectedManifestCase({
    fileName: "manifest-unknown-skipped-field.json",
    mutate: (manifest) => {
      manifest.skipped_checks[0].extra_field = "bounded but unsupported";
    },
    expectedSnippets: [
      "manifest.skipped_checks[0].extra_field is not allowed in v0.1",
    ],
  });
  writeRejectedManifestCase({
    fileName: "manifest-unknown-gap-field.json",
    mutate: (manifest) => {
      manifest.unresolved_gaps[0].extra_field = "bounded but unsupported";
    },
    expectedSnippets: [
      "manifest.unresolved_gaps[0].extra_field is not allowed in v0.1",
    ],
  });
  writeRejectedManifestCase({
    fileName: "manifest-unknown-readiness-field.json",
    mutate: (manifest) => {
      manifest.readiness.extra_field = "bounded but unsupported";
    },
    expectedSnippets: ["manifest.readiness.extra_field is not allowed in v0.1"],
  });
}

function runUnsafeAndBenignMarkerCases() {
  const unsafeMarker = ["access", "token"].join("_");
  const unsafePhrase = ["raw", "pr", "diff"].join("_");

  const unsafeManifest = buildValidManifest();
  unsafeManifest.operator_notes_bounded = `${unsafeMarker} ${unsafePhrase}`;
  const manifestValidation =
    validateCodexFormerLocalAdapterManifest(unsafeManifest);
  assert.equal(manifestValidation.valid, false);
  assertIncludesAll(manifestValidation.errors.join("; "), [
    "manifest.operator_notes_bounded",
    "unsafe/private/provider material marker",
  ]);
  assert.equal(
    manifestValidation.errors.join("; ").includes(unsafeMarker),
    false,
    "manifest unsafe diagnostic must not echo full unsafe value",
  );

  const unsafeSourceInput = buildValidSourceInput();
  unsafeSourceInput.changed_files_summary = `${unsafeMarker} ${unsafePhrase}`;
  const sourceInputValidation =
    validateCodexFormerLocalAdapterSourceInput(unsafeSourceInput);
  assert.equal(sourceInputValidation.valid, false);
  assertIncludesAll(sourceInputValidation.errors.join("; "), [
    "source_input.changed_files_summary",
    "unsafe marker category",
  ]);
  assert.equal(
    sourceInputValidation.errors.join("; ").includes(unsafeMarker),
    false,
    "source input unsafe diagnostic must not echo full unsafe value",
  );

  const benignText = [
    "tokenizer",
    "tokenization",
    "secretariat",
    "check:browser-computer-use",
    "no browser-visible surface",
    "local docs report smoke work",
  ].join(" ");
  const benignManifest = buildValidManifest();
  benignManifest.changed_files_summary = benignText;
  assert.deepEqual(validateCodexFormerLocalAdapterManifest(benignManifest), {
    valid: true,
    errors: [],
  });
  const benignSourceInput = buildValidSourceInput();
  benignSourceInput.changed_files_summary = benignText;
  assert.deepEqual(validateCodexFormerLocalAdapterSourceInput(benignSourceInput), {
    valid: true,
    errors: [],
  });
}

function assertDocsAndReport() {
  assertIncludesAll(docText, [
    "Purpose",
    "Why Follows PR #509",
    "Hardening Scope",
    "CLI Option Value Hardening",
    "Unknown Manifest Field Policy",
    "Source Input Preflight Validation",
    "Preflight CLI Usage",
    "Preflight Summary",
    "Diagnostics",
    "Path Handling",
    "generated_at / Hash Behavior",
    "Fixture Impact",
    "Capture Helper Compatibility",
    "Privacy / Redaction Boundary",
    "Authority Boundary",
    "What This Does Not Do",
    "Adapter fixture snapshots for Session Panel and Inbox states",
    "Prepare orchestration mode",
    "Validate orchestration mode",
    "Surface export mode",
    "Add local Codex adapter fixture snapshots for Session Panel and Inbox states",
    "Conclusion",
    "PASS with follow-up",
    "does not call Codex",
    "does not integrate Codex SDK",
    "does not call provider/model APIs",
    "does not call GitHub APIs",
    "does not write DB",
    "does not persist accepted state",
    "does not create review decisions",
    "does not run prepare or validate helpers as normal CLI behavior",
    "does not add UI/routes/browser surface",
    "does not automate clipboard",
    "does not add prepare orchestration",
    "does not add validate orchestration",
    "does not add surface export",
  ]);
  assertIncludesAll(reportText, [
    "Summary",
    "Why Follows PR #509",
    "Hardening Scope",
    "CLI Option Value Hardening",
    "Unknown Manifest Field Policy",
    "Source Input Preflight",
    "Preflight Summary",
    "Diagnostics",
    "Path Handling",
    "generated_at / Hash Behavior",
    "Fixture Impact",
    "Capture Helper Compatibility",
    "Privacy/Redaction Handling",
    "Authority Boundary",
    "Verification",
    "Skipped Checks With Reasons",
    "Recommended Next PR",
    "What Codex Did Not Do",
  ]);
}

function assertNoRawUnsafeMarkersInPublicArtifacts() {
  const publicText = [
    docText,
    reportText,
    implementationDocText,
    implementationReportText,
  ].join("\n");
  for (const marker of [
    ["hidden", "reasoning"].join("_"),
    ["raw", "page", "dump"].join("_"),
    ["raw", "pr", "diff"].join("_"),
    ["raw", "review", "payload"].join("_"),
    ["access", "token"].join("_"),
    ["refresh", "token"].join("_"),
    ["api", "key"].join("_"),
    ["oauth", "token"].join("_"),
    ["sk", "proj"].join("-") + "-",
    ["gh", "p_"].join(""),
  ]) {
    assert.equal(
      publicText.includes(marker),
      false,
      `public docs/reports must not echo raw unsafe marker ${marker}`,
    );
  }
}

function assertNoForbiddenImplementationSurfaces() {
  const runtimeText = `${libText}\n${cliText}`;
  for (const snippet of [
    ["fetch", "("].join(""),
    "XMLHttpRequest",
    ["responses", "create"].join("."),
    ["openai", "chat"].join("."),
    ["navigator", "clipboard"].join("."),
    ["better", "sqlite3"].join("-"),
    "sqlite",
    ["createClient", "("].join(""),
    ["graphql", "("].join(""),
    "recordProof",
    "createEvidence",
    "commitStateUpdate",
    "perspective:codex-former:capture-packet",
    "perspective:codex-former:validate-capture",
  ]) {
    assert.equal(
      runtimeText.includes(snippet),
      false,
      `runtime implementation must not introduce forbidden surface ${snippet}`,
    );
  }
  const boundaryText = [
    docText,
    reportText,
    smokeText,
    manifestSmokeText,
  ].join("\n");
  assertIncludesAll(boundaryText, [
    "no UI",
    "no route",
    "no accepted Augnes state",
    "no provider/model",
    "no Codex SDK",
    "no GitHub",
    "no DB",
    "no clipboard",
    "no prepare/validate orchestration",
  ]);
}

function assertChangedFileBoundary() {
  const allowedChangedFiles = new Set([
    packageFile,
    libFile,
    snapshotLibFile,
    cliFile,
    snapshotCliFile,
    manifestSmokeFile,
    smokeFile,
    snapshotSmokeFile,
    docFile,
    snapshotDocFile,
    reportFile,
    snapshotReportFile,
    validManifestFixtureFile,
    expectedSourceInputFixtureFile,
    preflightSummaryFixtureFile,
    sessionNotReadySnapshotFixtureFile,
    sessionWaitingSnapshotFixtureFile,
    inboxNotReadySnapshotFixtureFile,
    inboxWaitingSnapshotFixtureFile,
  ]);
  for (const changedFile of collectChangedFiles()) {
    assert(
      allowedChangedFiles.has(changedFile),
      `source-input preflight hardening changed an out-of-scope file: ${changedFile}`,
    );
    assert(
      changedFile === packageFile ||
        changedFile.startsWith("lib/perspective-ingest/") ||
        changedFile.startsWith("scripts/") ||
        changedFile.startsWith("docs/") ||
        changedFile.startsWith("reports/"),
      `source-input preflight hardening must stay lib/scripts/docs/report/fixtures/package only: ${changedFile}`,
    );
    assert(
      !changedFile.startsWith("app/") &&
        !changedFile.startsWith("components/") &&
        !changedFile.startsWith("db/") &&
        !changedFile.startsWith("migrations/") &&
        !changedFile.startsWith("apps/augnes_apps/"),
      `source-input preflight hardening must not touch UI, DB, app, component, or schema surfaces: ${changedFile}`,
    );
  }
}

function writeRejectedSourceInputCase({
  fileName,
  mutate,
  expectedSnippets,
}) {
  const sourceInput = buildValidSourceInput();
  mutate(sourceInput);
  writeFileSync(
    join(rejectionDir, fileName),
    stableStringifyCodexFormerLocalAdapterJson(sourceInput),
    "utf8",
  );
  assertIncludesAll(expectPreflightFailure(fileName), expectedSnippets);
}

function writeRejectedManifestCase({ fileName, mutate, expectedSnippets }) {
  const manifest = buildValidManifest();
  mutate(manifest);
  writeFileSync(
    join(rejectionDir, fileName),
    stableStringifyCodexFormerLocalAdapterJson(manifest),
    "utf8",
  );
  const result = validateCodexFormerLocalAdapterManifest(manifest);
  assert.equal(result.valid, false);
  assertIncludesAll(result.errors.join("; "), expectedSnippets);
}

function expectPreflightFailure(fileName) {
  return expectCliFailure([
    "--preflight-source-input",
    join(rejectionDir, fileName),
    "--summary-out",
    join(rejectionDir, `${fileName}.summary.json`),
  ]);
}

function expectCliFailure(args) {
  try {
    runCli(args);
  } catch (error) {
    return `${error.stdout ?? ""}${error.stderr ?? ""}`;
  }
  assert.fail(`expected CLI failure for ${args.join(" ")}`);
}

function runCli(args) {
  return execFileSync(
    "npm",
    ["run", "perspective:codex-former:local-adapter:source-input", "--", ...args],
    { encoding: "utf8" },
  );
}

function buildValidManifest() {
  return JSON.parse(JSON.stringify(validManifest));
}

function buildValidSourceInput() {
  return JSON.parse(JSON.stringify(expectedSourceInput));
}

function collectChangedFiles() {
  return [
    ...new Set([
      ...gitLines(["diff", "--name-only", "--diff-filter=ACMR", "HEAD"]),
      ...gitLines(["diff", "--cached", "--name-only", "--diff-filter=ACMR"]),
      ...gitLines(["diff", "--name-only", "--diff-filter=ACMR", "origin/main...HEAD"]),
      ...gitLines(["ls-files", "--others", "--exclude-standard"]),
    ]),
  ].sort();
}

function gitLines(args) {
  return execFileSync("git", args, { encoding: "utf8" })
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function assertIncludesAll(text, snippets) {
  const normalizedText = normalizeText(text);
  for (const snippet of snippets) {
    assert(
      normalizedText.includes(normalizeText(snippet)),
      `expected text to include: ${snippet}`,
    );
  }
}

function normalizeText(value) {
  return String(value).replace(/\s+/g, " ").trim();
}

function hashText(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function resolveFromRepo(path) {
  return resolve(path);
}
