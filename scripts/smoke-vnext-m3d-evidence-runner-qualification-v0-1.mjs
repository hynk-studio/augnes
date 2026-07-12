#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  M3D_EVIDENCE_RUNNER_QUALIFICATION_VERSION_V01,
  isLoopbackReleaseRefusalV01,
  listChromeExecutableCandidatesV01,
  qualifyM3dEvidenceRunnerV01,
  writeQualificationReceiptV01,
} from "./lib/m3d-evidence-runner-qualification-v0-1.mjs";
import {
  canonicalizeExistingPathV01,
  canonicalizeProspectivePathV01,
  classifyPathScopeV01,
  doCanonicalPathsOverlapV01,
  isPathWithinCanonicalRootV01,
  validateAbsolutePathInputV01,
} from "./lib/m3d-evidence-runner-path-policy-v0-1.mjs";

const repositoryRoot = realpathSync(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."),
);
const qualificationCli = path.join(
  repositoryRoot,
  "scripts",
  "qualify-vnext-m3d-evidence-runner-v0-1.mjs",
);
const temporaryRoot = mkdtempSync(
  path.join(tmpdir(), "augnes-m3d-qualification-smoke-"),
);
const result = {
  smoke: "vnext_m3d_evidence_runner_qualification.v0.1",
  status: "failed",
  platform: process.platform,
  mac_tmp_alias_regression: "not_applicable",
  generated_symlink_alias_regression: false,
  dangling_symlink_rejected: false,
  symlink_escape_rejected: false,
  prospective_path_qualified: false,
  sibling_prefix_rejected: false,
  execution_repository_overlap_matrix_rejected: false,
  dirty_execution_repository_rejected: false,
  partial_root_dependencies_rejected: false,
  qualification_output_scope_enforced: false,
  qualification_output_owner_only: false,
  browser_candidate_order_aligned: false,
  portable_qualification_qualified: false,
  qualification_created_database: null,
  semantic_execution_started: false,
  default_database_inspected: false,
  temporary_fixtures_removed: false,
};

try {
  runPathPolicyMatrix();

  const executionRepo = path.join(temporaryRoot, "execution-repo");
  cloneExecutionRepository(executionRepo, { withDependencies: true });
  const qualificationRoot = path.join(temporaryRoot, "qualified-run");
  const input = buildQualificationInput(executionRepo, qualificationRoot);

  await assertExecutionRepositoryOverlapMatrix(input);
  await assertDependencyAndCleanlinessMatrix(executionRepo, input);

  const receipt = await qualifyM3dEvidenceRunnerV01(input);
  assertQualifiedPortableReceipt(receipt, input.workingDbPath);
  result.portable_qualification_qualified = true;
  result.qualification_created_database = existsSync(input.workingDbPath);

  assertQualificationOutputMatrix(input);
  assertBrowserCandidateOrder();
  assert.equal(isLoopbackReleaseRefusalV01({ code: "ECONNREFUSED" }), true);
  assert.equal(isLoopbackReleaseRefusalV01({ code: "EHOSTUNREACH" }), false);
  assertMalformedInvocation();

  result.status = "passed";
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
  result.temporary_fixtures_removed = !existsSync(temporaryRoot);
}

assert.equal(result.temporary_fixtures_removed, true);
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);

function runPathPolicyMatrix() {
  const fixtureRoot = path.join(temporaryRoot, "path-matrix");
  const allowedRoot = path.join(fixtureRoot, "run");
  const siblingRoot = path.join(fixtureRoot, "run-evil");
  const outsideRoot = path.join(fixtureRoot, "outside");
  const deepChild = path.join(allowedRoot, "one", "two", "three");
  mkdirSync(deepChild, { recursive: true, mode: 0o700 });
  mkdirSync(siblingRoot, { recursive: true, mode: 0o700 });
  mkdirSync(outsideRoot, { recursive: true, mode: 0o700 });

  const canonicalAllowedRoot = canonicalizeExistingPathV01(allowedRoot);
  assert.equal(
    isPathWithinCanonicalRootV01(canonicalAllowedRoot, canonicalAllowedRoot),
    true,
  );
  assert.equal(classifyExisting(allowedRoot, path.join(allowedRoot, "one")).status, "pass");
  assert.equal(classifyExisting(allowedRoot, deepChild).status, "pass");

  const prospectiveChild = path.join(allowedRoot, "future", "child");
  const prospectiveCanonical = canonicalizeProspectivePathV01(prospectiveChild);
  assert.equal(classifyProspective(allowedRoot, prospectiveChild).status, "pass");
  mkdirSync(prospectiveChild, { recursive: true, mode: 0o700 });
  assert.equal(canonicalizeExistingPathV01(prospectiveChild), prospectiveCanonical);
  result.prospective_path_qualified = true;

  const aliasPath = path.join(fixtureRoot, "generated-run-alias");
  symlinkSync(allowedRoot, aliasPath, "dir");
  assert.equal(canonicalizeExistingPathV01(aliasPath), canonicalAllowedRoot);
  assert.equal(
    canonicalizeExistingPathV01(`${allowedRoot}${path.sep}`),
    canonicalAllowedRoot,
  );
  assert.equal(
    classifyExisting(aliasPath, path.join(aliasPath, "one")).status,
    "pass",
  );
  result.generated_symlink_alias_regression = true;

  assert.equal(
    classifyProspective(canonicalAllowedRoot, path.join(canonicalAllowedRoot, "derived")).status,
    "pass",
  );
  assert.equal(classifyExisting(allowedRoot, siblingRoot).reason_code, "path_scope_escape");
  assert.equal(
    classifyExisting(allowedRoot, path.join(allowedRoot, "..", "outside")).reason_code,
    "path_scope_escape",
  );
  result.sibling_prefix_rejected = true;

  const escapeLink = path.join(allowedRoot, "escape-link");
  symlinkSync(outsideRoot, escapeLink, "dir");
  assert.equal(classifyExisting(allowedRoot, escapeLink).reason_code, "symlink_escape");
  assert.equal(
    classifyProspective(allowedRoot, path.join(escapeLink, "future")).reason_code,
    "symlink_escape",
  );
  result.symlink_escape_rejected = true;

  const danglingLeaf = path.join(allowedRoot, "dangling-leaf");
  symlinkSync(path.join(outsideRoot, "missing-target"), danglingLeaf);
  assert.throws(
    () => canonicalizeProspectivePathV01(danglingLeaf),
    (error) => error?.reasonCode === "dangling_symlink",
  );
  const danglingIntermediate = path.join(allowedRoot, "dangling-parent");
  symlinkSync(path.join(outsideRoot, "missing-parent"), danglingIntermediate);
  assert.throws(
    () => canonicalizeProspectivePathV01(path.join(danglingIntermediate, "child")),
    (error) => error?.reasonCode === "dangling_symlink",
  );
  result.dangling_symlink_rejected = true;

  for (const invalidPath of ["relative/path", "", "bad\0path", "bad\npath"]) {
    assert.throws(() => validateAbsolutePathInputV01(invalidPath), /Path input/u);
  }

  const changingParent = path.join(allowedRoot, "changing-parent");
  const changingChild = path.join(changingParent, "child");
  const beforeIdentity = canonicalizeProspectivePathV01(changingChild);
  symlinkSync(outsideRoot, changingParent, "dir");
  mkdirSync(path.join(outsideRoot, "child"), { mode: 0o700 });
  const afterIdentity = canonicalizeExistingPathV01(changingChild);
  assert.notEqual(beforeIdentity, afterIdentity);
  assert.equal(isPathWithinCanonicalRootV01(canonicalAllowedRoot, afterIdentity), false);

  if (process.platform === "darwin") {
    const lexicalTmpFixture = mkdtempSync(
      path.join("/tmp", "augnes-m3d-tmp-alias-smoke-"),
    );
    try {
      const canonicalTmpFixture = realpathSync.native(lexicalTmpFixture);
      assert.equal(
        canonicalizeExistingPathV01(lexicalTmpFixture),
        canonicalizeExistingPathV01(canonicalTmpFixture),
      );
      result.mac_tmp_alias_regression = "passed";
    } finally {
      rmSync(lexicalTmpFixture, { recursive: true, force: true });
    }
  }
}

async function assertExecutionRepositoryOverlapMatrix(baseInput) {
  const equalReceipt = await qualifyM3dEvidenceRunnerV01({
    ...baseInput,
    canonicalCheckoutRoot: baseInput.repoRoot,
  });
  assertReason(equalReceipt, "execution_repository_checkout_overlap");

  const parentCheckout = path.join(temporaryRoot, "parent-checkout");
  const childRepo = path.join(parentCheckout, "execution-repo");
  mkdirSync(parentCheckout, { recursive: true, mode: 0o700 });
  cloneExecutionRepository(childRepo, { withDependencies: false });
  const childReceipt = await qualifyM3dEvidenceRunnerV01({
    ...baseInput,
    repoRoot: childRepo,
    canonicalCheckoutRoot: parentCheckout,
  });
  assertReason(childReceipt, "execution_repository_checkout_overlap");

  const parentRepo = path.join(temporaryRoot, "parent-execution-repo");
  cloneExecutionRepository(parentRepo, { withDependencies: false });
  const childCheckout = path.join(parentRepo, "canonical-checkout-fixture");
  mkdirSync(childCheckout, { mode: 0o700 });
  const parentReceipt = await qualifyM3dEvidenceRunnerV01({
    ...baseInput,
    repoRoot: parentRepo,
    canonicalCheckoutRoot: childCheckout,
  });
  assertReason(parentReceipt, "execution_repository_checkout_overlap");

  if (process.platform === "darwin") {
    const lexicalRoot = mkdtempSync(
      path.join("/tmp", "augnes-m3d-repo-alias-smoke-"),
    );
    try {
      const lexicalRepo = path.join(lexicalRoot, "execution-repo");
      cloneExecutionRepository(lexicalRepo, { withDependencies: false });
      const aliasReceipt = await qualifyM3dEvidenceRunnerV01({
        ...baseInput,
        repoRoot: lexicalRepo,
        canonicalCheckoutRoot: realpathSync.native(lexicalRepo),
      });
      assertReason(aliasReceipt, "execution_repository_checkout_overlap");
    } finally {
      rmSync(lexicalRoot, { recursive: true, force: true });
    }
  }

  const separatedReceipt = await qualifyM3dEvidenceRunnerV01(baseInput);
  assert.equal(
    separatedReceipt.reason_codes.includes("execution_repository_checkout_overlap"),
    false,
  );
  result.execution_repository_overlap_matrix_rejected = true;
}

async function assertDependencyAndCleanlinessMatrix(executionRepo, baseInput) {
  const partialRepo = path.join(temporaryRoot, "partial-execution-repo");
  cloneExecutionRepository(partialRepo, { withDependencies: false });
  mkdirSync(path.join(partialRepo, "node_modules"), { mode: 0o700 });
  const partialReceipt = await qualifyM3dEvidenceRunnerV01({
    ...baseInput,
    repoRoot: partialRepo,
  });
  for (const reasonCode of [
    "root_tsx_missing",
    "root_tsc_missing",
    "root_next_missing",
    "root_native_dependency_unavailable",
  ]) {
    assertReason(partialReceipt, reasonCode);
  }
  result.partial_root_dependencies_rejected = true;

  const rootTsx = path.join(executionRepo, "node_modules", ".bin", "tsx");
  unlinkSync(rootTsx);
  assertReason(
    await qualifyM3dEvidenceRunnerV01(baseInput),
    "root_tsx_missing",
  );
  restoreRootDependencies(executionRepo);

  const rootNext = path.join(executionRepo, "node_modules", ".bin", "next");
  unlinkSync(rootNext);
  assertReason(
    await qualifyM3dEvidenceRunnerV01(baseInput),
    "root_next_missing",
  );
  restoreRootDependencies(executionRepo);

  const readmePath = path.join(executionRepo, "README.md");
  const readmeBefore = readFileSync(readmePath);
  writeFileSync(
    readmePath,
    Buffer.concat([readmeBefore, Buffer.from("\ntracked-dirty-fixture\n")]),
  );
  assertReason(
    await qualifyM3dEvidenceRunnerV01(baseInput),
    "execution_repository_dirty",
  );
  writeFileSync(readmePath, readmeBefore);

  const untrackedPath = path.join(executionRepo, "untracked-application-file.js");
  writeFileSync(untrackedPath, "export const dirty = true;\n");
  assertReason(
    await qualifyM3dEvidenceRunnerV01(baseInput),
    "execution_repository_dirty",
  );
  unlinkSync(untrackedPath);

  const danglingWorkingDb = path.join(baseInput.runtimeRoot, "dangling.db");
  mkdirSync(baseInput.runtimeRoot, { recursive: true, mode: 0o700 });
  symlinkSync(path.join(temporaryRoot, "missing-database-target"), danglingWorkingDb);
  assertReason(
    await qualifyM3dEvidenceRunnerV01({
      ...baseInput,
      workingDbPath: danglingWorkingDb,
    }),
    "dangling_symlink",
  );
  unlinkSync(danglingWorkingDb);

  const cleanReceipt = await qualifyM3dEvidenceRunnerV01(baseInput);
  assert.equal(cleanReceipt.status, "qualified", JSON.stringify(cleanReceipt));
  result.dirty_execution_repository_rejected = true;
}

function assertQualificationOutputMatrix(input) {
  const directOutput = path.join(input.evidenceRoot, "receipt.json");
  const direct = runQualificationCli(input, directOutput);
  assert.equal(direct.status, 0, direct.stderr);
  const directFile = readFileSync(directOutput, "utf8");
  assert.equal(direct.stdout, directFile);
  assert.equal(statSync(directOutput).mode & 0o777, 0o600);

  const nestedOutput = path.join(input.evidenceRoot, "nested", "receipt.json");
  const nested = runQualificationCli(input, nestedOutput);
  assert.equal(nested.status, 0, nested.stderr);
  assert.equal(nested.stdout, readFileSync(nestedOutput, "utf8"));
  assert.equal(statSync(nestedOutput).mode & 0o777, 0o600);
  result.qualification_output_owner_only = true;

  assertCliOutputFailure(
    input,
    path.join(temporaryRoot, "outside-evidence.json"),
    "qualification_output_outside_evidence",
  );
  assertCliOutputFailure(
    input,
    path.join(repositoryRoot, ".qualification-output-must-not-exist.json"),
    "qualification_output_outside_evidence",
  );
  assert.equal(
    existsSync(path.join(repositoryRoot, ".qualification-output-must-not-exist.json")),
    false,
  );
  assertCliOutputFailure(
    input,
    input.workingDbPath,
    "qualification_output_conflicts_with_working_db",
  );
  assertCliOutputFailure(
    input,
    path.join(input.runtimeRoot, "runtime-output.json"),
    "qualification_output_outside_evidence",
  );

  const existingOutput = path.join(input.evidenceRoot, "existing.json");
  writeFileSync(existingOutput, "must-not-change\n");
  assertCliOutputFailure(input, existingOutput, "qualification_output_exists");
  assert.equal(readFileSync(existingOutput, "utf8"), "must-not-change\n");

  const outsideTarget = path.join(temporaryRoot, "outside-target.json");
  writeFileSync(outsideTarget, "outside\n");
  const symlinkOutput = path.join(input.evidenceRoot, "symlink-output.json");
  symlinkSync(outsideTarget, symlinkOutput);
  assertCliOutputFailure(input, symlinkOutput, "qualification_output_symlink");

  const danglingOutput = path.join(input.evidenceRoot, "dangling-output.json");
  symlinkSync(path.join(temporaryRoot, "missing-output-target"), danglingOutput);
  assertCliOutputFailure(input, danglingOutput, "qualification_output_symlink");

  const outsideParent = path.join(temporaryRoot, "outside-output-parent");
  mkdirSync(outsideParent, { mode: 0o700 });
  const escapedParent = path.join(input.evidenceRoot, "escaped-parent");
  symlinkSync(outsideParent, escapedParent, "dir");
  assertCliOutputFailure(
    input,
    path.join(escapedParent, "receipt.json"),
    "qualification_output_outside_evidence",
  );

  const partialOutput = path.join(input.evidenceRoot, "partial-output.json");
  assert.throws(() =>
    writeQualificationReceiptV01({
      receipt: {},
      serializedReceipt: Symbol("injected-write-failure"),
      outputPath: partialOutput,
      runtimeRoot: input.runtimeRoot,
      evidenceRoot: input.evidenceRoot,
      workingDbPath: input.workingDbPath,
      canonicalCheckoutRoot: input.canonicalCheckoutRoot,
    }),
  );
  assert.equal(existsSync(partialOutput), false);
  result.qualification_output_scope_enforced = true;
}

function assertBrowserCandidateOrder() {
  const override = path.join(temporaryRoot, "browser-override");
  const expected = [
    override,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ];
  assert.deepEqual(
    listChromeExecutableCandidatesV01({
      environment: { AUGNES_BROWSER_EXECUTABLE_PATH: override },
    }),
    expected,
  );
  const harness = readFileSync(
    path.join(
      repositoryRoot,
      "scripts",
      "browser-validate-vnext-task-context-packet-handoff-v0-1.mjs",
    ),
    "utf8",
  );
  const anchors = ["AUGNES_BROWSER_EXECUTABLE_PATH", ...expected.slice(1)];
  let previousIndex = -1;
  for (const anchor of anchors) {
    const nextIndex = harness.indexOf(anchor);
    assert(nextIndex > previousIndex, `browser candidate order drifted at ${anchor}`);
    previousIndex = nextIndex;
  }
  result.browser_candidate_order_aligned = true;
}

function assertMalformedInvocation() {
  const malformed = spawnSync(process.execPath, [qualificationCli], {
    encoding: "utf8",
    timeout: 5_000,
  });
  assert.equal(malformed.status, 2);
  assert.equal(JSON.parse(malformed.stdout).reason_code, "malformed_invocation");
}

function cloneExecutionRepository(destination, { withDependencies }) {
  const clone = spawnSync(
    "git",
    ["clone", "--local", "--no-hardlinks", "--quiet", repositoryRoot, destination],
    { encoding: "utf8", timeout: 30_000, maxBuffer: 256 * 1024 },
  );
  assert.equal(clone.status, 0, clone.stderr);
  if (!withDependencies) return;
  copyDependencies(repositoryRoot, destination);
}

function copyDependencies(sourceRepo, destinationRepo) {
  cpSync(
    path.join(sourceRepo, "node_modules"),
    path.join(destinationRepo, "node_modules"),
    { recursive: true, preserveTimestamps: true, verbatimSymlinks: true },
  );
  cpSync(
    path.join(sourceRepo, "apps", "augnes_apps", "node_modules"),
    path.join(destinationRepo, "apps", "augnes_apps", "node_modules"),
    { recursive: true, preserveTimestamps: true, verbatimSymlinks: true },
  );
}

function restoreRootDependencies(executionRepo) {
  rmSync(path.join(executionRepo, "node_modules"), {
    recursive: true,
    force: true,
  });
  cpSync(
    path.join(repositoryRoot, "node_modules"),
    path.join(executionRepo, "node_modules"),
    { recursive: true, preserveTimestamps: true, verbatimSymlinks: true },
  );
}

function buildQualificationInput(executionRepo, qualificationRoot) {
  return {
    mode: "portable",
    repoRoot: executionRepo,
    runtimeRoot: path.join(qualificationRoot, "runtime"),
    evidenceRoot: path.join(qualificationRoot, "evidence"),
    workingDbPath: path.join(qualificationRoot, "runtime", "rehearsal.db"),
    canonicalCheckoutRoot: repositoryRoot,
  };
}

function runQualificationCli(input, outputPath) {
  return spawnSync(
    process.execPath,
    [
      qualificationCli,
      "--mode",
      input.mode,
      "--repo-root",
      input.repoRoot,
      "--runtime-root",
      input.runtimeRoot,
      "--evidence-root",
      input.evidenceRoot,
      "--working-db-path",
      input.workingDbPath,
      "--canonical-checkout-root",
      input.canonicalCheckoutRoot,
      "--output",
      outputPath,
      "--json",
    ],
    { encoding: "utf8", timeout: 20_000, maxBuffer: 256 * 1024 },
  );
}

function assertCliOutputFailure(input, outputPath, reasonCode) {
  const completed = runQualificationCli(input, outputPath);
  assert.equal(completed.status, 2, completed.stderr);
  assert.equal(JSON.parse(completed.stdout).reason_code, reasonCode);
}

function assertQualifiedPortableReceipt(receipt, workingDbPath) {
  assert.equal(
    receipt.qualification_version,
    M3D_EVIDENCE_RUNNER_QUALIFICATION_VERSION_V01,
  );
  assert.equal(receipt.status, "qualified");
  assert.equal(receipt.dependencies_complete, true);
  assert.equal(receipt.path_policy_qualified, true);
  assert.equal(receipt.loopback_qualified, true);
  assert.equal(receipt.browser_qualified, null);
  assert.equal(receipt.semantic_execution_started, false);
  assert.equal(receipt.database_opened, false);
  assert.equal(receipt.default_database_inspected, false);
  assert.equal(receipt.credential_material_included, false);
  assert.equal(existsSync(workingDbPath), false);
  assert.equal(JSON.stringify(receipt).includes(path.dirname(temporaryRoot)), false);
}

function assertReason(receipt, reasonCode) {
  assert.equal(receipt.status, "unqualified");
  assert.equal(
    receipt.reason_codes.includes(reasonCode),
    true,
    `expected reason code ${reasonCode}: ${JSON.stringify(receipt.reason_codes)}`,
  );
}

function classifyExisting(rootPath, candidatePath) {
  return classifyPathScopeV01({
    rootPath,
    candidatePath,
    rootKind: "existing",
    candidateKind: "existing",
  });
}

function classifyProspective(rootPath, candidatePath) {
  return classifyPathScopeV01({
    rootPath,
    candidatePath,
    rootKind: "existing",
    candidateKind: "prospective",
  });
}
