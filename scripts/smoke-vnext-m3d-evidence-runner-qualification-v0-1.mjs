#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  M3D_EVIDENCE_RUNNER_QUALIFICATION_VERSION_V01,
  qualifyM3dEvidenceRunnerV01,
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
const temporaryRoot = mkdtempSync(
  path.join(tmpdir(), "augnes-m3d-qualification-smoke-"),
);
let macTmpAliasQualified = null;
let generatedSymlinkAliasQualified = false;
let symlinkEscapeRejected = false;
let prospectivePathQualified = false;
let siblingPrefixRejected = false;
let portableQualificationQualified = false;
let qualificationCreatedDatabase = null;

try {
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
    "canonical root itself must be contained",
  );
  assert.equal(
    classifyExisting(allowedRoot, path.join(allowedRoot, "one")).status,
    "pass",
    "normal existing child must pass",
  );
  assert.equal(
    classifyExisting(allowedRoot, deepChild).status,
    "pass",
    "deeply nested existing child must pass",
  );

  const prospectiveChild = path.join(allowedRoot, "future", "child");
  const prospectiveCanonical = canonicalizeProspectivePathV01(prospectiveChild);
  assert.equal(
    classifyPathScopeV01({
      rootPath: allowedRoot,
      candidatePath: prospectiveChild,
      rootKind: "existing",
      candidateKind: "prospective",
    }).status,
    "pass",
    "nonexistent prospective child must pass",
  );
  mkdirSync(prospectiveChild, { recursive: true, mode: 0o700 });
  assert.equal(
    canonicalizeExistingPathV01(prospectiveChild),
    prospectiveCanonical,
    "prospective identity must survive creation",
  );
  prospectivePathQualified = true;

  const aliasPath = path.join(fixtureRoot, "generated-run-alias");
  symlinkSync(allowedRoot, aliasPath, "dir");
  assert.equal(
    canonicalizeExistingPathV01(aliasPath),
    canonicalAllowedRoot,
    "generated alias must canonicalize to the same identity",
  );
  assert.equal(
    canonicalizeExistingPathV01(`${allowedRoot}${path.sep}`),
    canonicalAllowedRoot,
    "trailing separators must normalize",
  );
  assert.equal(
    classifyPathScopeV01({
      rootPath: aliasPath,
      candidatePath: path.join(aliasPath, "one"),
      rootKind: "existing",
      candidateKind: "existing",
    }).status,
    "pass",
    "lexical alias and canonical path must classify identically",
  );
  generatedSymlinkAliasQualified = true;

  const derivedCandidate = path.join(canonicalAllowedRoot, "derived");
  assert.equal(
    classifyPathScopeV01({
      rootPath: canonicalAllowedRoot,
      candidatePath: derivedCandidate,
      rootKind: "existing",
      candidateKind: "prospective",
    }).status,
    "pass",
    "candidate derived from the canonical root must pass",
  );

  assert.equal(
    classifyExisting(allowedRoot, siblingRoot).reason_code,
    "path_scope_escape",
    "sibling prefix must be rejected",
  );
  siblingPrefixRejected = true;
  assert.equal(
    classifyExisting(allowedRoot, path.join(allowedRoot, "..", "outside"))
      .reason_code,
    "path_scope_escape",
    "explicit parent escape must be rejected",
  );

  const escapeLink = path.join(allowedRoot, "escape-link");
  symlinkSync(outsideRoot, escapeLink, "dir");
  assert.equal(
    classifyPathScopeV01({
      rootPath: allowedRoot,
      candidatePath: escapeLink,
      rootKind: "existing",
      candidateKind: "existing",
    }).reason_code,
    "path_scope_escape",
    "root-internal symlink to outside must be rejected",
  );
  assert.equal(
    classifyPathScopeV01({
      rootPath: allowedRoot,
      candidatePath: path.join(escapeLink, "future"),
      rootKind: "existing",
      candidateKind: "prospective",
    }).reason_code,
    "path_scope_escape",
    "prospective child below an escaping symlink must be rejected",
  );
  symlinkEscapeRejected = true;

  for (const invalidPath of ["relative/path", "", "bad\0path", "bad\npath"]) {
    assert.throws(
      () => validateAbsolutePathInputV01(invalidPath),
      /Path input/u,
      "relative, empty, NUL, and control-character inputs must fail",
    );
  }

  const checkoutRoot = path.join(fixtureRoot, "checkout");
  mkdirSync(checkoutRoot, { mode: 0o700 });
  assert.equal(
    doCanonicalPathsOverlapV01(
      canonicalizeExistingPathV01(checkoutRoot),
      canonicalizeProspectivePathV01(path.join(checkoutRoot, "runtime")),
    ),
    true,
    "runtime inside canonical checkout must overlap",
  );
  assert.equal(
    doCanonicalPathsOverlapV01(
      canonicalizeExistingPathV01(checkoutRoot),
      canonicalizeProspectivePathV01(path.join(checkoutRoot, "evidence")),
    ),
    true,
    "evidence inside canonical checkout must overlap",
  );
  assert.equal(
    classifyPathScopeV01({
      rootPath: allowedRoot,
      candidatePath: path.join(outsideRoot, "working.db"),
      rootKind: "existing",
      candidateKind: "prospective",
    }).reason_code,
    "path_scope_escape",
    "working DB outside runtime root must be rejected",
  );

  const forbiddenRuntimeRoot = path.join(checkoutRoot, "runtime");
  const forbiddenReceipt = await qualifyM3dEvidenceRunnerV01({
    mode: "portable",
    repoRoot: repositoryRoot,
    runtimeRoot: forbiddenRuntimeRoot,
    evidenceRoot: path.join(fixtureRoot, "isolated-evidence"),
    workingDbPath: path.join(forbiddenRuntimeRoot, "rehearsal.db"),
    canonicalCheckoutRoot: checkoutRoot,
  });
  assert.equal(forbiddenReceipt.status, "unqualified");
  assert.equal(
    forbiddenReceipt.reason_codes.includes("canonical_checkout_overlap"),
    true,
    "canonical checkout overlap must produce a stable reason code",
  );
  assert.equal(
    existsSync(forbiddenRuntimeRoot),
    false,
    "unsafe runtime roots must be rejected before fixture creation",
  );

  const changingParent = path.join(allowedRoot, "changing-parent");
  const changingChild = path.join(changingParent, "child");
  const beforeIdentity = canonicalizeProspectivePathV01(changingChild);
  symlinkSync(outsideRoot, changingParent, "dir");
  mkdirSync(path.join(outsideRoot, "child"), { mode: 0o700 });
  const afterIdentity = canonicalizeExistingPathV01(changingChild);
  assert.notEqual(
    beforeIdentity,
    afterIdentity,
    "path identity change after symlink creation must be observable",
  );
  assert.equal(
    isPathWithinCanonicalRootV01(canonicalAllowedRoot, afterIdentity),
    false,
    "changed child identity must be outside the allowed root",
  );

  if (process.platform === "darwin") {
    const lexicalTmpFixture = mkdtempSync(
      path.join("/tmp", "augnes-m3d-tmp-alias-smoke-"),
    );
    try {
      const canonicalTmpFixture = realpathSync.native(lexicalTmpFixture);
      assert.equal(
        canonicalizeExistingPathV01(lexicalTmpFixture),
        canonicalizeExistingPathV01(canonicalTmpFixture),
        "/tmp and its canonical macOS identity must classify identically",
      );
      macTmpAliasQualified = true;
    } finally {
      rmSync(lexicalTmpFixture, { recursive: true, force: true });
    }
  }

  const qualificationRoot = path.join(temporaryRoot, "portable");
  const runtimeRoot = path.join(qualificationRoot, "runtime");
  const evidenceRoot = path.join(qualificationRoot, "evidence");
  const workingDbPath = path.join(runtimeRoot, "rehearsal.db");
  const receipt = await qualifyM3dEvidenceRunnerV01({
    mode: "portable",
    repoRoot: repositoryRoot,
    runtimeRoot,
    evidenceRoot,
    workingDbPath,
    canonicalCheckoutRoot: repositoryRoot,
  });
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
  assert.equal(
    JSON.stringify(receipt).includes(path.dirname(temporaryRoot)),
    false,
    "public receipt must not contain private temp parent paths",
  );
  portableQualificationQualified = true;
  qualificationCreatedDatabase = existsSync(workingDbPath);

  const cliOutputPath = path.join(qualificationRoot, "receipt.json");
  const cliResult = spawnSync(
    process.execPath,
    [
      path.join(repositoryRoot, "scripts", "qualify-vnext-m3d-evidence-runner-v0-1.mjs"),
      "--mode",
      "portable",
      "--repo-root",
      repositoryRoot,
      "--runtime-root",
      runtimeRoot,
      "--evidence-root",
      evidenceRoot,
      "--working-db-path",
      workingDbPath,
      "--canonical-checkout-root",
      repositoryRoot,
      "--output",
      cliOutputPath,
      "--json",
    ],
    { encoding: "utf8", timeout: 20_000, maxBuffer: 256 * 1024 },
  );
  assert.equal(cliResult.status, 0, cliResult.stderr);
  assert.equal(JSON.parse(cliResult.stdout).status, "qualified");
  assert.equal(existsSync(cliOutputPath), true);
  assert.equal(existsSync(workingDbPath), false);

  const malformedResult = spawnSync(
    process.execPath,
    [path.join(repositoryRoot, "scripts", "qualify-vnext-m3d-evidence-runner-v0-1.mjs")],
    { encoding: "utf8", timeout: 5_000 },
  );
  assert.equal(malformedResult.status, 2);
  assert.equal(JSON.parse(malformedResult.stdout).reason_code, "malformed_invocation");

  writeFileSync(path.join(temporaryRoot, "cleanup-sentinel"), "bounded fixture\n");
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}

assert.equal(existsSync(temporaryRoot), false, "all smoke fixtures must be removed");

process.stdout.write(
  `${JSON.stringify(
    {
      smoke: "vnext_m3d_evidence_runner_qualification.v0.1",
      status: "passed",
      platform: process.platform,
      mac_tmp_alias_regression:
        macTmpAliasQualified === null ? "not_applicable" : "passed",
      generated_symlink_alias_regression: generatedSymlinkAliasQualified,
      symlink_escape_rejected: symlinkEscapeRejected,
      prospective_path_qualified: prospectivePathQualified,
      sibling_prefix_rejected: siblingPrefixRejected,
      portable_qualification_qualified: portableQualificationQualified,
      qualification_created_database: qualificationCreatedDatabase,
      semantic_execution_started: false,
      default_database_inspected: false,
      temporary_fixtures_removed: true,
    },
    null,
    2,
  )}\n`,
);

function classifyExisting(rootPath, candidatePath) {
  return classifyPathScopeV01({
    rootPath,
    candidatePath,
    rootKind: "existing",
    candidateKind: "existing",
  });
}
