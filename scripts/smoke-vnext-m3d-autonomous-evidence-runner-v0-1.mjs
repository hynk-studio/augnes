#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readdirSync,
  readlinkSync,
  closeSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  M3dAutonomousEvidenceRunnerErrorV01,
  allocateChainV01,
  buildM3dAutonomousEvidencePlanV01,
  runM3dAutonomousEvidenceV01,
} from "./lib/m3d-autonomous-evidence-runner-v0-1.mjs";

const temporaryRoot = mkdtempSync(
  path.join(tmpdir(), "augnes-m3d-autonomous-runner-smoke-"),
);
const result = {
  smoke_version: "vnext_m3d_autonomous_evidence_runner_smoke.v0.1",
  status: "failed",
  positive_cases: [],
  negative_cases: [],
  dry_run_created_resources: null,
  allocator_call_count_on_failures: null,
  successful_allocator_call_count: null,
  real_chain_6_allocated: false,
  real_chain_6_executed: false,
  default_database_inspected: false,
  temporary_fixtures_removed: false,
};

try {
  await assertDryRun();
  await assertQualifiedContextCannotBeForged();
  await assertQualificationFailureMatrix();
  await assertPathAndWorkingDatabaseMatrix();
  await assertPostAllocationHoldMatrix();
  await assertSuccessfulSyntheticOrchestration();
  result.status = "passed";
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
  result.temporary_fixtures_removed = !existsSync(temporaryRoot);
}

assert.equal(result.temporary_fixtures_removed, true);
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);

async function assertDryRun() {
  const fixture = createFixture("dry-run");
  const before = snapshotTree(fixture.root);
  const dryRun = await runM3dAutonomousEvidenceV01({
    ...fixture.input,
    mode: "dry-run",
  });
  assert.equal(dryRun.verdict, "DRY_RUN_VALID");
  assert.equal(dryRun.chain_allocated, false);
  assert.equal(dryRun.database_created, false);
  assert.equal(dryRun.session_created, false);
  assert.equal(dryRun.app_started, false);
  assert.equal(dryRun.browser_started, false);
  assert.deepEqual(snapshotTree(fixture.root), before);
  result.dry_run_created_resources = false;
  pass("dry_run_validates_without_resources_or_chain");
}

async function assertQualifiedContextCannotBeForged() {
  let calls = 0;
  await assert.rejects(
    () => allocateChainV01(Object.freeze({}), async () => {
      calls += 1;
      return { chain_id: "synthetic:forged" };
    }),
    (error) => error?.reasonCode === "qualified_context_required",
  );
  assert.equal(calls, 0);
  reject("allocator_rejects_forged_qualified_context");
}

async function assertQualificationFailureMatrix() {
  const scenarios = [
    ["portable_qualification_failure", { portableExitCode: 1 }, "portable_qualification_failed"],
    ["local_full_qualification_failure", { localFullExitCode: 1 }, "local_full_qualification_failed"],
    ["application_commit_mismatch", { localMutator: (r) => { r.application_commit = "b".repeat(40); } }, "qualification_identity_mismatch"],
    ["lockfile_hash_mismatch", { localMutator: (r) => { r.root_package_lock_sha256 = sha("drift"); } }, "qualification_identity_mismatch"],
    ["node_identity_mismatch", { localMutator: (r) => { r.node_major_version += 1; } }, "qualification_identity_mismatch"],
    ["platform_identity_mismatch", { localMutator: (r) => { r.platform = r.platform === "darwin" ? "linux" : "darwin"; } }, "qualification_identity_mismatch"],
    ["architecture_identity_mismatch", { localMutator: (r) => { r.architecture = "drift-arch"; } }, "qualification_identity_mismatch"],
    ["receipt_byte_mismatch", { receiptMismatchMode: "portable" }, "qualification_stdout_receipt_mismatch"],
    ["unsafe_receipt_boolean", { localMutator: (r) => { r.database_opened = true; } }, "qualification_safety_field_unsafe"],
    ["browser_identity_drift", { recheckReason: "browser_identity_drift" }, "browser_identity_drift"],
    ["dirty_execution_repository", { recheckReason: "dirty_execution_repository" }, "dirty_execution_repository"],
  ];
  let allocatorCalls = 0;
  for (const [name, behavior, reason] of scenarios) {
    const fixture = createFixture(name);
    const scenario = createInjectedOperations(fixture, behavior, () => {
      allocatorCalls += 1;
    });
    const outcome = await runM3dAutonomousEvidenceV01(fixture.input, scenario);
    assert.equal(outcome.verdict, "ABORTED", name);
    assert.equal(outcome.phase, "RUNNER_QUALIFICATION", name);
    assert.equal(outcome.chain_id, null, name);
    assert(outcome.reason_codes.includes(reason), `${name} reason code`);
    reject(name);
  }
  assert.equal(allocatorCalls, 0);
  result.allocator_call_count_on_failures = allocatorCalls;
}

async function assertPathAndWorkingDatabaseMatrix() {
  const overlap = createFixture("checkout-overlap");
  assert.throws(
    () => buildM3dAutonomousEvidencePlanV01({
      ...overlap.input,
      runRoot: path.join(overlap.canonicalCheckout, "run"),
    }),
    (error) =>
      error?.reasonCode === "canonical_checkout_storage_overlap" ||
      error?.reasonCode === "runner_layout_outside_run_root" ||
      error?.reasonCode === "execution_repository_checkout_overlap",
  );
  reject("canonical_checkout_overlap_rejected");

  const pathOverlapCases = [
    ["execution_runtime_overlap", (fixture) => ({ executionRepo: path.join(fixture.runRoot, "runtime") })],
    ["execution_evidence_overlap", (fixture) => ({ executionRepo: path.join(fixture.runRoot, "evidence") })],
    ["database_outside_runtime", (fixture) => ({ workingDbPath: path.join(fixture.runRoot, "outside.db") })],
    ["output_inside_execution_repo", (fixture) => ({ portableReceiptPath: path.join(fixture.runRoot, "execution-repo", "qualification.json") })],
  ];
  for (const [name, override] of pathOverlapCases) {
    const fixture = createFixture(name);
    assert.throws(() => buildM3dAutonomousEvidencePlanV01({ ...fixture.input, ...override(fixture) }));
    reject(name);
  }

  const kinds = ["directory", "file", "sqlite_file", "symlink", "dangling_symlink", "fifo"];
  for (const kind of kinds) {
    const fixture = createFixture(`db-${kind}`);
    const dbPath = path.join(fixture.runRoot, "runtime", "m3d-autonomous-rehearsal.db");
    mkdirSync(path.dirname(dbPath), { recursive: true, mode: 0o700 });
    createFilesystemObject(kind, dbPath, fixture.root);
    const before = describeObject(dbPath);
    assert.throws(
      () => buildM3dAutonomousEvidencePlanV01(fixture.input),
      (error) =>
        error?.reasonCode === "working_db_path_exists" ||
        error?.reasonCode === "working_db_outside_runtime" ||
        error?.reasonCode === "dangling_symlink",
      kind,
    );
    let allocatorCalls = 0;
    const outcome = await runM3dAutonomousEvidenceV01(fixture.input, {
      allocateChain: async () => {
        allocatorCalls += 1;
        return { chain_id: "synthetic:unsafe-db" };
      },
    });
    assert.equal(outcome.verdict, "ABORTED");
    assert.equal(outcome.phase, "RUNNER_QUALIFICATION");
    assert.equal(outcome.chain_id, null);
    assert.equal(allocatorCalls, 0);
    assert.deepEqual(describeObject(dbPath), before, `${kind} object remains unchanged`);
    reject(`working_db_existing_${kind}_rejected_without_mutation`);
  }

  const defaultTrap = createFixture("default-db-trap");
  const defaultLeaf = path.join(defaultTrap.canonicalCheckout, "data", "augnes.db");
  mkdirSync(path.dirname(defaultLeaf), { recursive: true, mode: 0o700 });
  writeFileSync(defaultLeaf, "DEFAULT_DB_TRAP_UNTOUCHED", { mode: 0o000 });
  const beforeBytes = readFileWithTemporaryMode(defaultLeaf);
  buildM3dAutonomousEvidencePlanV01(defaultTrap.input);
  const afterBytes = readFileWithTemporaryMode(defaultLeaf);
  assert.deepEqual(afterBytes, beforeBytes);
  result.default_database_inspected = false;
  pass("default_database_leaf_excluded_structurally");
}

async function assertPostAllocationHoldMatrix() {
  const scenarios = [
    ["exact_replay_duplicate_injection", {
      mechanicalFailurePhase: "EXACT_REPLAY",
      mechanicalFailureReason: "exact_replay_duplicate",
    }],
    ["credential_marker_injection", {
      mechanicalFailurePhase: "CREDENTIAL_AUDIT",
      mechanicalFailureReason: "credential_material_detected",
      credentialMarker: "bootstrap_token=fixture-secret-marker-1234567890",
    }],
  ];
  for (const [name, behavior] of scenarios) {
    const fixture = createFixture(name);
    let allocatorCalls = 0;
    const operations = createInjectedOperations(
      fixture,
      behavior,
      () => { allocatorCalls += 1; },
    );
    const outcome = await runM3dAutonomousEvidenceV01(fixture.input, operations);
    assert.equal(outcome.verdict, "HOLD");
    assert.equal(outcome.phase, behavior.mechanicalFailurePhase);
    assert.equal(allocatorCalls, 1);
    if (behavior.credentialMarker) {
      assert.equal(JSON.stringify(outcome).includes(behavior.credentialMarker), false);
      assert.equal(
        existsSync(
          path.join(
            fixture.runRoot,
            "evidence",
            "m3d-autonomous-evidence-report-v0-1.json",
          ),
        ),
        false,
      );
    }
    reject(name);
  }

  const cleanupFixture = createFixture("cleanup-failure");
  let cleanupAllocatorCalls = 0;
  const cleanupOperations = createInjectedOperations(
    cleanupFixture,
    { cleanupFailure: true },
    () => { cleanupAllocatorCalls += 1; },
  );
  const cleanupOutcome = await runM3dAutonomousEvidenceV01(
    cleanupFixture.input,
    cleanupOperations,
  );
  assert.equal(cleanupOutcome.verdict, "HOLD");
  assert.equal(cleanupOutcome.phase, "CLEANUP");
  assert.equal(cleanupAllocatorCalls, 1);
  reject("cleanup_failure_refuses_completion");
}

async function assertSuccessfulSyntheticOrchestration() {
  const fixture = createFixture("success");
  let allocatorCalls = 0;
  const operations = createInjectedOperations(fixture, {}, () => {
    allocatorCalls += 1;
  });
  const outcome = await runM3dAutonomousEvidenceV01(fixture.input, operations);
  assert.equal(outcome.verdict, "COMPLETE_AUTONOMOUS_REHEARSAL");
  assert.equal(outcome.fixture_only, true);
  assert.equal(outcome.chain_id, "synthetic:opaque-runner-smoke");
  assert.equal(allocatorCalls, 1);
  assert.equal(outcome.authority_boundary.real_user_authorization_created, false);
  assert.equal(outcome.authority_boundary.m3_completion_claimed, false);
  result.successful_allocator_call_count = allocatorCalls;
  pass("fully_locked_synthetic_orchestration_completes_mechanical_verdict_only");
}

function createInjectedOperations(fixture, behavior, onAllocate) {
  return {
    checkpoint: async () => ({ status: "pass" }),
    clone: async (plan) => {
      mkdirSync(plan.executionRepo, { recursive: true, mode: 0o700 });
      return { status: "pass" };
    },
    provisionRoot: async () => ({ status: "pass" }),
    provisionNested: async () => ({ status: "pass" }),
    qualify: async (plan, mode) => {
      const exitCode = mode === "portable"
        ? behavior.portableExitCode ?? 0
        : behavior.localFullExitCode ?? 0;
      const receipt = qualificationReceipt(mode);
      if (mode === "local_full" && behavior.localMutator) behavior.localMutator(receipt);
      if (mode === "portable" && behavior.portableMutator) behavior.portableMutator(receipt);
      const serialized = Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`, "utf8");
      const receiptPath = mode === "portable" ? plan.portableReceiptPath : plan.localFullReceiptPath;
      mkdirSync(path.dirname(receiptPath), { recursive: true, mode: 0o700 });
      const fileBytes = behavior.receiptMismatchMode === mode
        ? Buffer.from(`${JSON.stringify({ ...receipt, status: "unqualified" }, null, 2)}\n`, "utf8")
        : serialized;
      const fd = openSync(receiptPath, "wx", 0o600);
      try { writeFileSync(fd, fileBytes); } finally { closeSync(fd); }
      chmodSync(receiptPath, 0o600);
      return { exitCode, stdout: serialized, receiptBytes: fileBytes };
    },
    recheckQualification: async () => {
      if (behavior.recheckReason) {
        throw new M3dAutonomousEvidenceRunnerErrorV01(
          behavior.recheckReason,
          "Injected qualification identity drift.",
        );
      }
      return { status: "pass" };
    },
    allocateChain: async () => {
      onAllocate();
      return { chain_id: "synthetic:opaque-runner-smoke", fixture_only: true };
    },
    mechanicalPhase: async (phase, state) => {
      if (phase === behavior.mechanicalFailurePhase) {
        if (behavior.credentialMarker) state.injectedCredentialMaterial = behavior.credentialMarker;
        throw new M3dAutonomousEvidenceRunnerErrorV01(
          behavior.mechanicalFailureReason,
          "Injected post-allocation stop.",
          phase,
        );
      }
      if (phase === "FINAL_DATABASE_AUDIT") state.databaseIntegrity = "ok";
      if (phase === "BACKUP") state.backupSha256 = sha("synthetic-backup");
      if (phase === "CREDENTIAL_AUDIT" && behavior.injectedCredential) {
        state.credential = "bootstrap_token=fixture-secret-marker";
      }
      return { status: "pass", fixture_only: true };
    },
    writeReport: async () => ({ status: "pass" }),
    cleanup: async () => behavior.cleanupFailure
      ? { status: "fail", reason_code: "runner_cleanup_failed" }
      : { status: "pass", database_side_files_removed: true },
  };
}

function qualificationReceipt(mode) {
  return {
    qualification_version: "vnext_m3d_evidence_runner_qualification.v0.1",
    status: "qualified",
    mode,
    application_commit: "a".repeat(40),
    platform: process.platform,
    architecture: process.arch,
    node_version: process.version,
    node_major_version: Number.parseInt(process.versions.node.split(".")[0], 10),
    root_package_lock_sha256: sha("root-lock"),
    nested_package_lock_sha256: sha("nested-lock"),
    checks: [{ check_id: "fixture", status: "pass", reason_code: null }],
    reason_codes: [],
    dependencies_complete: true,
    path_policy_qualified: true,
    loopback_qualified: true,
    browser_qualified: mode === "portable" ? null : true,
    browser_identity: mode === "portable" ? null : {
      executable_name: "Synthetic Browser",
      executable_sha256: sha("browser"),
      version_summary: "Synthetic Browser 1.0",
    },
    semantic_execution_started: false,
    database_opened: false,
    default_database_inspected: false,
    credential_material_included: false,
  };
}

function createFixture(name) {
  const root = path.join(temporaryRoot, name);
  const canonicalCheckout = path.join(root, "canonical-checkout");
  const runRoot = path.join(root, "run");
  mkdirSync(canonicalCheckout, { recursive: true, mode: 0o700 });
  return {
    root,
    canonicalCheckout,
    runRoot,
    input: {
      mode: "full",
      canonicalCheckoutRoot: canonicalCheckout,
      runRoot,
    },
  };
}

function createFilesystemObject(kind, target, root) {
  if (kind === "directory") return mkdirSync(target, { mode: 0o700 });
  if (kind === "file") return writeFileSync(target, "ordinary", { mode: 0o600 });
  if (kind === "sqlite_file") return writeFileSync(target, "SQLite format 3\0fixture", { mode: 0o600 });
  if (kind === "symlink") {
    const destination = path.join(root, "existing-symlink-target");
    writeFileSync(destination, "target", { mode: 0o600 });
    return symlinkSync(destination, target);
  }
  if (kind === "dangling_symlink") return symlinkSync(path.join(root, "missing-target"), target);
  if (kind === "fifo") {
    const child = spawnSync("mkfifo", [target], { stdio: "ignore" });
    assert.equal(child.status, 0);
  }
}

function describeObject(target) {
  const entry = lstatSync(target);
  return {
    kind: entry.isSymbolicLink()
      ? "symlink"
      : entry.isDirectory()
        ? "directory"
        : entry.isFile()
          ? "file"
          : "other",
    mode: entry.mode,
    size: entry.size,
    link: entry.isSymbolicLink() ? readFileSafeLink(target) : null,
  };
}

function readFileSafeLink(target) {
  return readlinkSync(target);
}

function readFileWithTemporaryMode(filePath) {
  chmodSync(filePath, 0o600);
  const bytes = readFileSync(filePath);
  chmodSync(filePath, 0o000);
  return bytes;
}

function snapshotTree(root) {
  if (!existsSync(root)) return [];
  const entries = [];
  const walk = (directory) => {
    for (const name of readDirectory(directory)) {
      const current = path.join(directory, name);
      const relative = path.relative(root, current);
      const stat = lstatSync(current);
      entries.push([relative, stat.isDirectory() ? "directory" : stat.isSymbolicLink() ? "symlink" : "file"]);
      if (stat.isDirectory()) walk(current);
    }
  };
  walk(root);
  return entries.sort((a, b) => a[0].localeCompare(b[0]));
}

function readDirectory(directory) {
  return readdirSync(directory);
}

function sha(value) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function pass(caseId) {
  result.positive_cases.push(caseId);
}

function reject(caseId) {
  result.negative_cases.push(caseId);
}
