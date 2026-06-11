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
import { join } from "node:path";
import localAdapter from "../lib/perspective-ingest/codex-former-local-adapter-manifest-to-source-input.ts";

const {
  buildCodexFormerSourceInputFromLocalAdapterManifest,
  hashCodexFormerLocalAdapterContent,
  stableStringifyCodexFormerLocalAdapterJson,
  validateCodexFormerLocalAdapterManifest,
} = localAdapter;

const packageFile = "package.json";
const libFile =
  "lib/perspective-ingest/codex-former-local-adapter-manifest-to-source-input.ts";
const cliFile =
  "scripts/perspective-codex-former-local-adapter-manifest-to-source-input.mjs";
const smokeFile =
  "scripts/smoke-perspective-codex-former-local-adapter-manifest-to-source-input.mjs";
const docFile =
  "docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_MANIFEST_TO_SOURCE_INPUT_V0_1.md";
const reportFile =
  "reports/2026-06-11-perspective-codex-former-local-adapter-manifest-to-source-input.md";
const designDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_LOCAL_CODEX_INTEGRATION_ADAPTER_DESIGN_V0_1.md";
const validManifestFixtureFile =
  "reports/fixtures/2026-06-11-codex-former-local-adapter-manifest-valid.json";
const expectedSourceInputFixtureFile =
  "reports/fixtures/2026-06-11-codex-former-local-adapter-source-input.json";
const captureHelperFile = "scripts/perspective-codex-former-capture-helper.mjs";
const expectedTsxCommand =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json";

const tmpRoot = "/tmp/augnes-codex-former-local-adapter-smoke";
const outDir = join(tmpRoot, "out");
const repeatDir = join(tmpRoot, "repeat");
const rejectionDir = join(tmpRoot, "rejections");
const captureHelperOutDir = join(tmpRoot, "capture-helper");
const generatedAt = "2026-06-11T00:00:00.000Z";

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const libText = readFileSync(libFile, "utf8");
const cliText = readFileSync(cliFile, "utf8");
const docText = readFileSync(docFile, "utf8");
const reportText = readFileSync(reportFile, "utf8");
const smokeText = readFileSync(smokeFile, "utf8");
const validManifestText = readFileSync(validManifestFixtureFile, "utf8");
const validManifest = JSON.parse(validManifestText);
const expectedSourceInputText = readFileSync(
  expectedSourceInputFixtureFile,
  "utf8",
);

assertPackageScripts();
assertFilesExist();
assertSourceBoundaries();
runValidConversion();
runCaptureHelperCompatibility();
runValidationCases();
assertDocsAndReport();
assertNoRawUnsafeMarkersInPublicArtifacts();
assertNoForbiddenImplementationSurfaces();
assertChangedFileBoundary();

console.log(
  "PASS smoke:perspective-codex-former-local-adapter-manifest-to-source-input",
);

function assertPackageScripts() {
  assert.equal(
    packageJson.scripts["perspective:codex-former:local-adapter:source-input"],
    `${expectedTsxCommand} ${cliFile}`,
    "package.json must register the local adapter CLI",
  );
  assert.equal(
    packageJson.scripts[
      "smoke:perspective-codex-former-local-adapter-manifest-to-source-input"
    ],
    `${expectedTsxCommand} ${smokeFile}`,
    "package.json must register the local adapter smoke",
  );
}

function assertFilesExist() {
  for (const file of [
    libFile,
    cliFile,
    smokeFile,
    docFile,
    reportFile,
    designDocFile,
    validManifestFixtureFile,
    expectedSourceInputFixtureFile,
    captureHelperFile,
  ]) {
    assert.equal(existsSync(file), true, `${file} must exist`);
  }
}

function assertSourceBoundaries() {
  assertIncludesAll(libText, [
    "buildCodexFormerSourceInputFromLocalAdapterManifest",
    "validateCodexFormerLocalAdapterManifest",
    "collectUnsafeCodexFormerLocalAdapterManifestMarkers",
    "stableStringifyCodexFormerLocalAdapterJson",
    "hashCodexFormerLocalAdapterContent",
    "codex_former_local_adapter_manifest.v0.1",
    "local_bounded_manifest",
    "codex_former_local_adapter_metadata.v0.1",
  ]);
  assertIncludesAll(cliText, [
    "--manifest <path>",
    "--out-dir <path>",
    "manifest-to-source-input",
    "source_input_path=",
    "metadata_path=",
    "manifest_hash=",
    "source_input_hash=",
    "review-only local-only non-authorizing",
  ]);
}

function runValidConversion() {
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
    "manifest_hash=",
    "source_input_hash=",
    "work_id=AG-codex-former-local-adapter-manifest-to-source-input",
    "readiness_status=needs_review",
    "authority_boundary=review-only local-only non-authorizing",
  ]);
  assert.equal(existsSync(sourceInputPath), true);
  assert.equal(existsSync(metadataPath), true);

  const sourceInputText = readFileSync(sourceInputPath, "utf8");
  const sourceInput = JSON.parse(sourceInputText);
  const metadataText = readFileSync(metadataPath, "utf8");
  const metadata = JSON.parse(metadataText);
  const manifestHash = hashText(validManifestText);
  const sourceInputHash = hashText(sourceInputText);

  assert.equal(
    sourceInputText,
    expectedSourceInputText,
    "CLI output must match committed expected source input fixture",
  );
  assert.equal(sourceInput.generated_at, generatedAt);
  assert.equal(sourceInput.scope, "project:augnes");
  assert.equal(
    sourceInput.work_id,
    "AG-codex-former-local-adapter-manifest-to-source-input",
  );
  assert.deepEqual(sourceInput.source_pr_refs, ["pr:hynk-studio/augnes#508"]);
  assert(sourceInput.changed_files.length > 0);
  assert(sourceInput.tests_checks_run.length > 0);
  assert(sourceInput.skipped_checks.length > 0);
  assert(sourceInput.unresolved_gaps.length > 0);
  assert.equal(sourceInput.readiness.status, "needs_review");

  assert.equal(metadata.manifest_hash, manifestHash);
  assert.equal(metadata.source_input_hash, sourceInputHash);
  assert.equal(metadata.manifest_work_id, validManifest.work_id);
  assert.equal(metadata.manifest_scope, validManifest.scope);
  assert.equal(metadata.source_input_work_id, sourceInput.work_id);
  assert.equal(metadata.source_input_scope, sourceInput.scope);
  assert.equal(metadata.source_input_path, sourceInputPath);
  assert.equal(metadata.manifest_path.endsWith(validManifestFixtureFile), true);
  for (const [key, value] of Object.entries(metadata.authority_flags)) {
    assert.equal(value, false, `${key} must be false`);
  }
  assert.equal(
    metadata.manifest_hash,
    hashCodexFormerLocalAdapterContent(validManifestText),
  );
  assert.equal(
    metadata.source_input_hash,
    hashCodexFormerLocalAdapterContent(sourceInputText),
  );

  rmSync(repeatDir, { recursive: true, force: true });
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
    sourceInputText,
    "repeated deterministic source input output must match",
  );
  const repeatMetadata = JSON.parse(
    readFileSync(join(repeatDir, "codex-former-local-adapter-metadata.json"), "utf8"),
  );
  const comparableMetadata = (value) => ({
    ...value,
    manifest_path: "<manifest>",
    source_input_path: "<source-input>",
  });
  assert.deepEqual(
    comparableMetadata(repeatMetadata),
    comparableMetadata(metadata),
    "repeated deterministic metadata output must match apart from output paths",
  );
}

function runCaptureHelperCompatibility() {
  const sourceInputPath = join(outDir, "codex-former-local-adapter-source-input.json");
  rmSync(captureHelperOutDir, { recursive: true, force: true });
  const stdout = execFileSync(
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
  assertIncludesAll(stdout, [
    "mode=prepare",
    "capture_source_kind=bounded_source_input_file",
    `source_input_hash=${hashText(readFileSync(sourceInputPath, "utf8"))}`,
    "source_manual_copy_packet_id=",
    "source_former_input_packet_id=",
    "source_prompt_hash=",
  ]);
}

function runValidationCases() {
  mkdirSync(rejectionDir, { recursive: true });

  assertIncludesAll(expectCliFailure(["--manifest", join(rejectionDir, "missing.json"), "--out-dir", rejectionDir]), [
    "manifest file does not exist",
  ]);
  writeFileSync(join(rejectionDir, "invalid-json.json"), "{ nope", "utf8");
  assertIncludesAll(
    expectManifestFailure("invalid-json.json"),
    ["manifest file is not valid JSON"],
  );
  writeFileSync(join(rejectionDir, "non-object.json"), "[]\n", "utf8");
  assertIncludesAll(
    expectManifestFailure("non-object.json"),
    ["manifest JSON must be an object"],
  );

  writeRejectedManifestCase({
    fileName: "unsupported-version.json",
    mutate: (manifest) => {
      manifest.adapter_manifest_version = "unsupported";
    },
    expectedSnippets: ["adapter_manifest_version"],
  });
  writeRejectedManifestCase({
    fileName: "unsupported-source-kind.json",
    mutate: (manifest) => {
      manifest.adapter_source_kind = "unsupported";
    },
    expectedSnippets: ["adapter_source_kind"],
  });
  writeRejectedManifestCase({
    fileName: "missing-scope.json",
    mutate: (manifest) => {
      delete manifest.scope;
    },
    expectedSnippets: ["manifest scope must be a string"],
  });
  writeRejectedManifestCase({
    fileName: "missing-work-id.json",
    mutate: (manifest) => {
      delete manifest.work_id;
    },
    expectedSnippets: ["manifest work_id must be a string"],
  });
  writeRejectedManifestCase({
    fileName: "missing-changed-files.json",
    mutate: (manifest) => {
      delete manifest.changed_files;
    },
    expectedSnippets: ["manifest changed_files must be an array"],
  });
  writeRejectedManifestCase({
    fileName: "empty-changed-files.json",
    mutate: (manifest) => {
      manifest.changed_files = [];
    },
    expectedSnippets: ["manifest changed_files must include at least one file"],
  });
  writeRejectedManifestCase({
    fileName: "empty-source-pr-refs.json",
    mutate: (manifest) => {
      manifest.source_pr_refs = [];
    },
    expectedSnippets: ["manifest source_pr_refs must include at least one"],
  });
  writeRejectedManifestCase({
    fileName: "no-verification-material.json",
    mutate: (manifest) => {
      manifest.tests_checks_run = [];
      manifest.skipped_checks = [];
      manifest.unresolved_gaps = [];
      manifest.readiness.reasons = [];
    },
    expectedSnippets: ["manifest requires verification material"],
  });
  writeRejectedManifestCase({
    fileName: "unsupported-check-status.json",
    mutate: (manifest) => {
      manifest.tests_checks_run[0].status = "unknown";
    },
    expectedSnippets: ["tests_checks_run[0].status is unsupported"],
  });
  writeRejectedManifestCase({
    fileName: "missing-check-field.json",
    mutate: (manifest) => {
      delete manifest.tests_checks_run[0].command;
    },
    expectedSnippets: ["tests_checks_run[0].command must be a string"],
  });
  writeRejectedManifestCase({
    fileName: "missing-skipped-reason.json",
    mutate: (manifest) => {
      delete manifest.skipped_checks[0].skipped_reason;
    },
    expectedSnippets: ["skipped_checks[0].skipped_reason must be a string"],
  });
  writeRejectedManifestCase({
    fileName: "missing-gap-summary.json",
    mutate: (manifest) => {
      delete manifest.unresolved_gaps[0].summary;
    },
    expectedSnippets: ["unresolved_gaps[0].summary must be a string"],
  });
  writeRejectedManifestCase({
    fileName: "unsupported-readiness-status.json",
    mutate: (manifest) => {
      manifest.readiness.status = "ready";
    },
    expectedSnippets: ["readiness.status is unsupported"],
  });
  writeRejectedManifestCase({
    fileName: "unsafe-marker.json",
    mutate: (manifest) => {
      manifest.changed_files_summary = [
        ["access", "token"].join("_"),
        ["raw", "pr", "diff"].join("_"),
        "provider log",
      ].join(" ");
    },
    expectedSnippets: [
      "unsafe/private/provider material marker",
      "manifest.changed_files_summary",
    ],
  });
  writeRejectedManifestCase({
    fileName: "absolute-path.json",
    mutate: (manifest) => {
      manifest.changed_files = ["/tmp/nope"];
    },
    expectedSnippets: ["safe relative file path"],
  });
  writeRejectedManifestCase({
    fileName: "parent-traversal.json",
    mutate: (manifest) => {
      manifest.changed_files = ["../nope"];
    },
    expectedSnippets: ["safe relative file path"],
  });

  const benignManifest = buildValidManifest();
  benignManifest.changed_files_summary = [
    "tokenizer",
    "tokenization",
    "secretariat",
    "check:browser-computer-use",
    "no browser-visible surface",
    "local docs report smoke work",
  ].join(" ");
  assert.deepEqual(validateCodexFormerLocalAdapterManifest(benignManifest), {
    valid: true,
    errors: [],
  });

  const mixedStatusManifest = buildValidManifest();
  mixedStatusManifest.tests_checks_run.push({
    check_id: "check:blocked-example",
    command: "npm run example",
    status: "blocked",
    result_summary: "Blocked local check is represented as skipped in helper-compatible source input.",
  });
  const mixedResult = buildCodexFormerSourceInputFromLocalAdapterManifest({
    manifest: mixedStatusManifest,
    manifestHash: hashText(stableStringifyCodexFormerLocalAdapterJson(mixedStatusManifest)),
    manifestPath: "manifest.json",
    sourceInputPath: "source-input.json",
    generatedAtOverride: generatedAt,
  });
  assert.equal(mixedResult.sourceInput.tests_checks_run.some((check) => check.status === "blocked"), false);
  assert.equal(
    mixedResult.metadata.normalized_check_statuses[0].emitted_as,
    "skipped_checks",
  );
}

function assertDocsAndReport() {
  assertIncludesAll(docText, [
    "Purpose",
    "Why Follows PR #508",
    "Implementation Scope",
    "Manifest-to-source-input only",
    "Manifest Shape",
    "Source Input Output",
    "Adapter Metadata Output",
    "CLI Usage",
    "generated_at and hash behavior",
    "Validation and Rejection Behavior",
    "Privacy / Redaction Boundary",
    "Authority Boundary",
    "What This Does Not Do",
    "Source-input preflight mode",
    "Prepare orchestration mode",
    "Validate orchestration mode",
    "Surface export mode",
    "Add local Codex adapter source-input preflight hardening",
    "Conclusion",
    "PASS with follow-up",
    "does not call Codex",
    "does not integrate Codex SDK",
    "does not call provider/model APIs",
    "does not call GitHub APIs",
    "does not write DB",
    "does not persist accepted state",
    "does not create review decisions",
    "does not run prepare or validate helpers",
    "does not add UI/routes/browser surface",
    "does not automate clipboard",
  ]);
  assertIncludesAll(reportText, [
    "Summary",
    "Why Follows PR #508",
    "Implementation Scope",
    "Manifest-to-source-input Behavior",
    "Fixture Manifest",
    "Source Input Output",
    "Adapter Metadata",
    "generated_at / Hash Behavior",
    "Validation and Rejection Coverage",
    "Privacy/Redaction Handling",
    "Authority Boundary",
    "Verification",
    "Skipped Checks With Reasons",
    "Recommended Next PR",
    "What Codex Did Not Do",
  ]);
}

function assertNoRawUnsafeMarkersInPublicArtifacts() {
  const publicText = `${docText}\n${reportText}`;
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
  const boundaryText = `${docText}\n${reportText}\n${smokeText}`;
  assertIncludesAll(boundaryText, [
    "no UI",
    "no route",
    "no accepted Augnes state",
    "no provider/model",
    "no Codex SDK",
    "no GitHub",
    "no DB",
    "no clipboard",
  ]);
}

function assertChangedFileBoundary() {
  const allowedChangedFiles = new Set([
    packageFile,
    libFile,
    cliFile,
    smokeFile,
    docFile,
    reportFile,
    validManifestFixtureFile,
    expectedSourceInputFixtureFile,
  ]);
  for (const changedFile of collectChangedFiles()) {
    assert(
      allowedChangedFiles.has(changedFile),
      `local adapter manifest-to-source-input changed an out-of-scope file: ${changedFile}`,
    );
    assert(
      changedFile === packageFile ||
        changedFile.startsWith("lib/perspective-ingest/") ||
        changedFile.startsWith("scripts/") ||
        changedFile.startsWith("docs/") ||
        changedFile.startsWith("reports/"),
      `local adapter implementation must stay lib/scripts/docs/report/fixtures/package only: ${changedFile}`,
    );
    assert(
      !changedFile.startsWith("app/") &&
        !changedFile.startsWith("components/") &&
        !changedFile.startsWith("db/") &&
        !changedFile.startsWith("migrations/") &&
        !changedFile.startsWith("apps/augnes_apps/"),
      `local adapter implementation must not touch UI, DB, app, component, or schema surfaces: ${changedFile}`,
    );
  }
}

function runCli(args) {
  return execFileSync(
    "npm",
    ["run", "perspective:codex-former:local-adapter:source-input", "--", ...args],
    { encoding: "utf8" },
  );
}

function expectManifestFailure(fileName) {
  return expectCliFailure([
    "--manifest",
    join(rejectionDir, fileName),
    "--out-dir",
    join(rejectionDir, `out-${fileName.replace(/\\.json$/, "")}`),
    "--generated-at",
    generatedAt,
  ]);
}

function writeRejectedManifestCase({ fileName, mutate, expectedSnippets }) {
  const manifest = buildValidManifest();
  mutate(manifest);
  writeFileSync(
    join(rejectionDir, fileName),
    stableStringifyCodexFormerLocalAdapterJson(manifest),
    "utf8",
  );
  assertIncludesAll(expectManifestFailure(fileName), expectedSnippets);
}

function expectCliFailure(args) {
  try {
    runCli(args);
  } catch (error) {
    return `${error.stdout ?? ""}${error.stderr ?? ""}`;
  }
  assert.fail(`expected CLI failure for ${args.join(" ")}`);
}

function buildValidManifest() {
  return JSON.parse(JSON.stringify(validManifest));
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
