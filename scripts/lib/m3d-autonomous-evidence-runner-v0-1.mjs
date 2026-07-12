import { spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import {
  chmodSync,
  copyFileSync,
  constants as fsConstants,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
} from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import {
  qualifyBrowserExecutableV01,
  M3D_EVIDENCE_RUNNER_QUALIFICATION_VERSION_V01,
} from "./m3d-evidence-runner-qualification-v0-1.mjs";
import {
  canonicalizeExistingPathV01,
  canonicalizeProspectivePathV01,
  doCanonicalPathsOverlapV01,
  getLexicalPathEntryKindV01,
  isPathWithinCanonicalRootV01,
  validateAbsolutePathInputV01,
} from "./m3d-evidence-runner-path-policy-v0-1.mjs";
import {
  assertPublicSafeRunnerMaterialV01,
  buildPublicRunnerReportV01,
  writePublicRunnerJsonV01,
} from "./m3d-evidence-report-v0-1.mjs";

export const M3D_AUTONOMOUS_EVIDENCE_RUNNER_VERSION_V01 =
  "vnext_m3d_autonomous_evidence_runner.v0.1";

export const M3D_AUTONOMOUS_EVIDENCE_RUNNER_PHASES_V01 = Object.freeze([
  "CHECKPOINT",
  "PLAN",
  "CLONE",
  "PROVISION_ROOT",
  "PROVISION_NESTED",
  "QUALIFY_PORTABLE",
  "QUALIFY_LOCAL_FULL",
  "LOCK_QUALIFICATION_IDENTITY",
  "ALLOCATE_CHAIN",
  "CREATE_WORKING_DATABASE",
  "MIGRATE",
  "BASELINE",
  "MECHANICAL_REHEARSAL",
  "EXACT_REPLAY",
  "BROWSER_REHEARSAL",
  "FINAL_DATABASE_AUDIT",
  "BACKUP",
  "CREDENTIAL_AUDIT",
  "REPORT",
  "CLEANUP",
]);

const QUALIFICATION_PHASES = new Set([
  "CHECKPOINT",
  "PLAN",
  "CLONE",
  "PROVISION_ROOT",
  "PROVISION_NESTED",
  "QUALIFY_PORTABLE",
  "QUALIFY_LOCAL_FULL",
  "LOCK_QUALIFICATION_IDENTITY",
  "ALLOCATE_CHAIN",
]);
const REQUIRED_FALSE_FIELDS = [
  "semantic_execution_started",
  "database_opened",
  "default_database_inspected",
  "credential_material_included",
];
const MAX_JSON_BYTES = 256 * 1024;
const qualifiedContexts = new WeakSet();

export class M3dAutonomousEvidenceRunnerErrorV01 extends Error {
  constructor(reasonCode, message, phase = "RUNNER_QUALIFICATION") {
    super(message);
    this.name = "M3dAutonomousEvidenceRunnerErrorV01";
    this.reasonCode = reasonCode;
    this.phase = phase;
  }
}

export function buildM3dAutonomousEvidencePlanV01(input) {
  const mode = input.mode ?? "full";
  if (!new Set(["dry-run", "qualify-only", "full"]).has(mode)) {
    throw runnerError("runner_mode_invalid", "Runner mode is invalid.", "PLAN");
  }
  const canonicalCheckout = canonicalizeExistingPathV01(
    validateAbsolutePathInputV01(input.canonicalCheckoutRoot),
  );
  const runRoot = canonicalizeProspectivePathV01(
    validateAbsolutePathInputV01(input.runRoot),
  );
  const executionRepo = canonicalizeProspectivePathV01(
    input.executionRepo ?? path.join(runRoot, "execution-repo"),
  );
  const runtimeRoot = canonicalizeProspectivePathV01(
    input.runtimeRoot ?? path.join(runRoot, "runtime"),
  );
  const evidenceRoot = canonicalizeProspectivePathV01(
    input.evidenceRoot ?? path.join(runRoot, "evidence"),
  );
  const workingDbPath = canonicalizeProspectivePathV01(
    input.workingDbPath ?? path.join(runtimeRoot, "m3d-autonomous-rehearsal.db"),
  );
  const portableReceiptPath = canonicalizeProspectivePathV01(
    input.portableReceiptPath ??
      path.join(evidenceRoot, "qualification-portable-v0-1.json"),
  );
  const localFullReceiptPath = canonicalizeProspectivePathV01(
    input.localFullReceiptPath ??
      path.join(evidenceRoot, "qualification-local-full-v0-1.json"),
  );
  const reportPath = canonicalizeProspectivePathV01(
    input.reportPath ??
      path.join(evidenceRoot, "m3d-autonomous-evidence-report-v0-1.json"),
  );
  const manifestPath = canonicalizeProspectivePathV01(
    input.manifestPath ??
      path.join(evidenceRoot, "m3d-autonomous-evidence-manifest-v0-1.json"),
  );
  const privateBackupPath = canonicalizeProspectivePathV01(
    input.privateBackupPath ??
      path.join(evidenceRoot, "private", "m3d-autonomous-rehearsal-backup.db"),
  );

  const siblingRoots = [executionRepo, runtimeRoot, evidenceRoot];
  if (siblingRoots.some((candidate) => !strictlyWithin(runRoot, candidate))) {
    throw runnerError("runner_layout_outside_run_root", "Runner roots must be inside the run root.", "PLAN");
  }
  if (path.dirname(runtimeRoot) !== runRoot || path.dirname(evidenceRoot) !== runRoot) {
    throw runnerError("runner_layout_not_canonical", "Runtime and evidence must be canonical sibling roots.", "PLAN");
  }
  assertNoOverlap("execution_repository_checkout_overlap", executionRepo, canonicalCheckout);
  assertNoOverlap("execution_repository_runtime_overlap", executionRepo, runtimeRoot);
  assertNoOverlap("execution_repository_evidence_overlap", executionRepo, evidenceRoot);
  assertNoOverlap("runtime_evidence_overlap", runtimeRoot, evidenceRoot);
  for (const candidate of [runRoot, executionRepo, runtimeRoot, evidenceRoot, workingDbPath, reportPath, manifestPath, privateBackupPath]) {
    if (doCanonicalPathsOverlapV01(canonicalCheckout, candidate)) {
      throw runnerError("canonical_checkout_storage_overlap", "Canonical checkout overlaps runner storage.", "PLAN");
    }
  }
  if (!strictlyWithin(runtimeRoot, workingDbPath)) {
    throw runnerError("working_db_outside_runtime", "Working DB must be strictly inside runtime.", "PLAN");
  }
  if (getLexicalPathEntryKindV01(workingDbPath) !== "missing") {
    throw runnerError("working_db_path_exists", "Working DB must be an absent prospective leaf.", "PLAN");
  }
  for (const output of [portableReceiptPath, localFullReceiptPath, reportPath, manifestPath, privateBackupPath]) {
    if (!strictlyWithin(evidenceRoot, output)) {
      throw runnerError("runner_output_outside_evidence", "Runner outputs must be strictly inside evidence.", "PLAN");
    }
    if (doCanonicalPathsOverlapV01(workingDbPath, output)) {
      throw runnerError("runner_output_database_overlap", "Runner output overlaps the working DB.", "PLAN");
    }
    if (doCanonicalPathsOverlapV01(executionRepo, output)) {
      throw runnerError("runner_output_execution_repository_overlap", "Runner output overlaps the execution repository.", "PLAN");
    }
    if (getLexicalPathEntryKindV01(output) !== "missing") {
      throw runnerError("runner_output_exists", "Runner outputs must be absent prospective leaves.", "PLAN");
    }
  }

  return Object.freeze({
    runner_version: M3D_AUTONOMOUS_EVIDENCE_RUNNER_VERSION_V01,
    mode,
    canonicalCheckout,
    runRoot,
    executionRepo,
    runtimeRoot,
    evidenceRoot,
    workingDbPath,
    portableReceiptPath,
    localFullReceiptPath,
    reportPath,
    manifestPath,
    privateBackupPath,
    browserExecutable: input.browserExecutable ?? null,
    intended_commands: Object.freeze([
      "git checkpoint",
      "git clone --local --no-hardlinks",
      "npm ci (root)",
      "npm ci (apps/augnes_apps)",
      "portable qualification",
      "local_full qualification",
      "isolated operator rehearsal",
      "exact replay validation",
      "loopback browser rehearsal",
      "database integrity and private backup",
    ]),
  });
}

export function buildDryRunResultV01(plan) {
  return {
    runner_version: M3D_AUTONOMOUS_EVIDENCE_RUNNER_VERSION_V01,
    mode: "dry-run",
    verdict: "DRY_RUN_VALID",
    phase: "PLAN",
    chain_id: null,
    layout: {
      run_root: path.basename(plan.runRoot),
      execution_repository: path.basename(plan.executionRepo),
      runtime_root: path.basename(plan.runtimeRoot),
      evidence_root: path.basename(plan.evidenceRoot),
      working_database: path.basename(plan.workingDbPath),
    },
    intended_commands: plan.intended_commands,
    resources_created: false,
    database_created: false,
    session_created: false,
    app_started: false,
    browser_started: false,
    chain_allocated: false,
    authority_boundary: {
      semantic_execution_started: false,
      database_opened: false,
      default_database_inspected: false,
      credential_material_included: false,
    },
  };
}

export async function runM3dAutonomousEvidenceV01(input, injected = {}) {
  let plan;
  try {
    plan = buildM3dAutonomousEvidencePlanV01(input);
  } catch (error) {
    return {
      runner_version: M3D_AUTONOMOUS_EVIDENCE_RUNNER_VERSION_V01,
      mode: input.mode ?? "full",
      verdict: "ABORTED",
      phase: "RUNNER_QUALIFICATION",
      chain_id: null,
      reason_codes: [publicReasonCode(error)],
      phases: [],
      cleanup: { status: "not_started" },
      authority_boundary: baseAuthorityBoundary(),
    };
  }
  if (plan.mode === "dry-run") return buildDryRunResultV01(plan);

  const operations = { ...defaultOperationsV01(), ...injected };
  const state = {
    plan,
    phases: [],
    chain: null,
    qualification: null,
    mechanical: {},
    cleanup: { status: "pending" },
  };
  let currentPhase = "CHECKPOINT";
  try {
    await executePhase(state, "CHECKPOINT", () => operations.checkpoint(plan));
    currentPhase = "PLAN";
    await executePhase(state, "PLAN", async () => ({ status: "pass" }));
    prepareRunnerDirectories(plan);
    currentPhase = "CLONE";
    await executePhase(state, "CLONE", () => operations.clone(plan));
    currentPhase = "PROVISION_ROOT";
    await executePhase(state, "PROVISION_ROOT", () => operations.provisionRoot(plan));
    currentPhase = "PROVISION_NESTED";
    await executePhase(state, "PROVISION_NESTED", () => operations.provisionNested(plan));

    currentPhase = "QUALIFY_PORTABLE";
    const portableInvocation = await executePhase(state, "QUALIFY_PORTABLE", () =>
      operations.qualify(plan, "portable"),
    );
    currentPhase = "QUALIFY_LOCAL_FULL";
    const localFullInvocation = await executePhase(state, "QUALIFY_LOCAL_FULL", () =>
      operations.qualify(plan, "local_full"),
    );
    currentPhase = "LOCK_QUALIFICATION_IDENTITY";
    const qualifiedContext = await executePhase(
      state,
      "LOCK_QUALIFICATION_IDENTITY",
      async () => qualifyAndLockEnvironmentV01(plan, portableInvocation, localFullInvocation),
    );
    state.qualification = publicQualificationSummary(qualifiedContext);

    if (plan.mode === "qualify-only") {
      state.cleanup = await cleanupBeforeReturn(state, operations, false);
      if (state.cleanup.status !== "pass") {
        return {
          runner_version: M3D_AUTONOMOUS_EVIDENCE_RUNNER_VERSION_V01,
          mode: plan.mode,
          verdict: "ABORTED",
          phase: "RUNNER_QUALIFICATION",
          chain_id: null,
          reason_codes: ["runner_cleanup_failed"],
          qualification: state.qualification,
          phases: state.phases,
          cleanup: state.cleanup,
          authority_boundary: baseAuthorityBoundary(),
        };
      }
      return {
        runner_version: M3D_AUTONOMOUS_EVIDENCE_RUNNER_VERSION_V01,
        mode: plan.mode,
        verdict: "QUALIFIED_ONLY",
        phase: "CLEANUP",
        chain_id: null,
        qualification: state.qualification,
        phases: state.phases,
        cleanup: state.cleanup,
        authority_boundary: baseAuthorityBoundary(),
      };
    }

    await operations.afterQualificationLocked(plan, qualifiedContext, state);
    await operations.recheckQualification(plan, qualifiedContext);
    currentPhase = "ALLOCATE_CHAIN";
    state.chain = await executePhase(state, "ALLOCATE_CHAIN", () =>
      allocateChainV01(qualifiedContext, operations.allocateChain),
    );

    for (const phase of M3D_AUTONOMOUS_EVIDENCE_RUNNER_PHASES_V01.slice(9, 18)) {
      currentPhase = phase;
      const outcome = await executePhase(state, phase, () =>
        operations.mechanicalPhase(phase, state),
      );
      state.mechanical[phase] = outcome;
    }

    currentPhase = "REPORT";
    const report = buildCompletionReport(state);
    await executePhase(state, "REPORT", () => operations.writeReport(plan, report));
    currentPhase = "CLEANUP";
    state.cleanup = await cleanupBeforeReturn(state, operations, true);
    if (state.cleanup.status !== "pass") {
      throw runnerError("runner_cleanup_failed", "Runner cleanup could not establish a safe result.", "CLEANUP");
    }
    report.cleanup = state.cleanup;
    report.phases = [...state.phases];
    await operations.finalizeReport(plan, report);
    return report;
  } catch (error) {
    const afterAllocation = state.chain !== null;
    const reasonCode = publicReasonCode(error);
    const failurePhase = afterAllocation
      ? error?.phase ?? currentPhase
      : "RUNNER_QUALIFICATION";
    try {
      state.cleanup = await cleanupBeforeReturn(state, operations, afterAllocation);
    } catch {
      state.cleanup = { status: "fail", reason_code: "runner_cleanup_failed" };
    }
    return {
      runner_version: M3D_AUTONOMOUS_EVIDENCE_RUNNER_VERSION_V01,
      mode: plan.mode,
      verdict: afterAllocation ? "HOLD" : "ABORTED",
      phase: failurePhase,
      chain_id: afterAllocation ? state.chain?.chain_id ?? null : null,
      fixture_only: state.chain?.fixture_only === true,
      reason_codes: [reasonCode],
      qualification: state.qualification,
      phases: state.phases,
      cleanup: state.cleanup,
      authority_boundary: baseAuthorityBoundary(),
    };
  }
}

export function qualifyAndLockEnvironmentV01(plan, portableInvocation, localFullInvocation) {
  const portable = validateQualificationInvocationV01(
    plan,
    "portable",
    portableInvocation,
  );
  const localFull = validateQualificationInvocationV01(
    plan,
    "local_full",
    localFullInvocation,
  );
  for (const key of [
    "qualification_version",
    "application_commit",
    "node_major_version",
    "platform",
    "architecture",
    "root_package_lock_sha256",
    "nested_package_lock_sha256",
  ]) {
    if (!portable[key] || portable[key] !== localFull[key]) {
      throw runnerError("qualification_identity_mismatch", `Qualification identity ${key} does not match.`);
    }
  }
  if (localFull.browser_qualified !== true || !validBrowserIdentity(localFull.browser_identity)) {
    throw runnerError("browser_identity_missing", "Local-full browser identity is missing.");
  }
  const context = Object.freeze({
    plan,
    portable,
    localFull,
    locked_receipts: Object.freeze({
      portable_base64: boundedBuffer(
        portableInvocation.stdout,
        "portable_qualification_stdout_invalid",
      ).toString("base64"),
      local_full_base64: boundedBuffer(
        localFullInvocation.stdout,
        "local_full_qualification_stdout_invalid",
      ).toString("base64"),
      portable_sha256: hashBuffer(
        boundedBuffer(
          portableInvocation.stdout,
          "portable_qualification_stdout_invalid",
        ),
      ),
      local_full_sha256: hashBuffer(
        boundedBuffer(
          localFullInvocation.stdout,
          "local_full_qualification_stdout_invalid",
        ),
      ),
    }),
    locked_identity: Object.freeze({
      qualification_version: portable.qualification_version,
      application_commit: portable.application_commit,
      node_major_version: portable.node_major_version,
      platform: portable.platform,
      architecture: portable.architecture,
      root_package_lock_sha256: portable.root_package_lock_sha256,
      nested_package_lock_sha256: portable.nested_package_lock_sha256,
      browser_identity: Object.freeze({ ...localFull.browser_identity }),
    }),
  });
  qualifiedContexts.add(context);
  return context;
}

export function validateQualificationInvocationV01(plan, mode, invocation) {
  if (!invocation || invocation.exitCode !== 0) {
    throw runnerError(`${mode}_qualification_failed`, `${mode} qualification process failed.`);
  }
  const stdout = boundedBuffer(invocation.stdout, `${mode}_qualification_stdout_invalid`);
  const receiptPath = mode === "portable" ? plan.portableReceiptPath : plan.localFullReceiptPath;
  const receiptBytes = boundedBuffer(
    invocation.receiptBytes ?? readFileSync(receiptPath),
    `${mode}_qualification_receipt_invalid`,
  );
  if (!stdout.equals(receiptBytes)) {
    throw runnerError("qualification_stdout_receipt_mismatch", "Qualification stdout and receipt differ.");
  }
  const fileMode = statSync(receiptPath).mode & 0o777;
  if ((fileMode & 0o077) !== 0) {
    throw runnerError("qualification_receipt_mode_unsafe", "Qualification receipt is not owner-only.");
  }
  if (!strictlyWithin(plan.evidenceRoot, canonicalizeExistingPathV01(receiptPath))) {
    throw runnerError("qualification_receipt_outside_evidence", "Qualification receipt escaped evidence.");
  }
  const receipt = parseBoundedJson(stdout, `${mode}_qualification_json_invalid`);
  if (
    receipt.qualification_version !== M3D_EVIDENCE_RUNNER_QUALIFICATION_VERSION_V01 ||
    receipt.mode !== mode ||
    receipt.status !== "qualified"
  ) {
    throw runnerError(`${mode}_qualification_unqualified`, `${mode} receipt is not qualified.`);
  }
  for (const field of REQUIRED_FALSE_FIELDS) {
    if (receipt[field] !== false) {
      throw runnerError("qualification_safety_field_unsafe", `Qualification safety field ${field} is unsafe.`);
    }
  }
  if (
    receipt.dependencies_complete !== true ||
    receipt.path_policy_qualified !== true ||
    receipt.loopback_qualified !== true
  ) {
    throw runnerError("qualification_required_check_missing", "Qualification required checks are incomplete.");
  }
  return receipt;
}

function recheckQualificationReceiptV01(plan, mode, lockedBytes) {
  const receiptPath =
    mode === "portable"
      ? plan.portableReceiptPath
      : plan.localFullReceiptPath;
  const kind = getLexicalPathEntryKindV01(receiptPath);
  if (kind !== "file") {
    throw runnerError(
      kind === "symlink"
        ? "qualification_receipt_symlink"
        : "qualification_receipt_missing",
      "Qualification receipt stopped being a regular file before allocation.",
    );
  }
  const actualReceiptPath = canonicalizeExistingPathV01(receiptPath);
  if (
    actualReceiptPath !== receiptPath ||
    !strictlyWithin(plan.evidenceRoot, actualReceiptPath)
  ) {
    throw runnerError(
      "qualification_receipt_identity_drift",
      "Qualification receipt canonical identity changed before allocation.",
    );
  }
  return validateQualificationInvocationV01(plan, mode, {
    exitCode: 0,
    stdout: lockedBytes,
    receiptBytes: readFileSync(receiptPath),
  });
}

export async function allocateChainV01(qualifiedContext, allocator) {
  if (!qualifiedContexts.has(qualifiedContext)) {
    throw runnerError("qualified_context_required", "Allocator requires a locked qualified context.");
  }
  const chain = await allocator(qualifiedContext);
  if (!chain || typeof chain.chain_id !== "string" || !chain.chain_id.trim()) {
    throw runnerError("chain_allocator_invalid", "Chain allocator returned no opaque chain ID.", "ALLOCATE_CHAIN");
  }
  return Object.freeze({ ...chain, chain_id: chain.chain_id.trim() });
}

export async function recheckLockedQualificationIdentityV01(plan, context) {
  if (!qualifiedContexts.has(context)) {
    throw runnerError("qualified_context_required", "Qualification recheck requires a locked context.");
  }
  const current = {
    qualification_version: M3D_EVIDENCE_RUNNER_QUALIFICATION_VERSION_V01,
    application_commit: runCapture("git", ["rev-parse", "HEAD"], plan.executionRepo).stdout.trim(),
    node_major_version: Number.parseInt(process.versions.node.split(".")[0], 10),
    platform: process.platform,
    architecture: process.arch,
    root_package_lock_sha256: hashFile(path.join(plan.executionRepo, "package-lock.json")),
    nested_package_lock_sha256: hashFile(path.join(plan.executionRepo, "apps", "augnes_apps", "package-lock.json")),
    browser_identity: qualifyBrowserExecutableV01({
      explicitPath: plan.browserExecutable,
      environment: process.env,
    }).identity,
  };
  const status = runCapture("git", ["status", "--porcelain", "--untracked-files=all"], plan.executionRepo).stdout;
  if (status !== "") throw runnerError("dirty_execution_repository", "Execution repository became dirty.");
  for (const key of Object.keys(current)) {
    const expected = context.locked_identity[key];
    const actual = current[key];
    if (JSON.stringify(expected) !== JSON.stringify(actual)) {
      throw runnerError(
        key === "browser_identity" ? "browser_identity_drift" : "qualification_identity_drift",
        `Locked qualification identity ${key} drifted.`,
      );
    }
  }
  return { status: "pass" };
}

export function recheckPreAllocationStorageAndReceiptsV01(plan, context) {
  if (!qualifiedContexts.has(context)) {
    throw runnerError(
      "qualified_context_required",
      "Pre-allocation storage recheck requires a locked context.",
    );
  }
  for (const [label, expected] of [
    ["run_root", plan.runRoot],
    ["execution_repository", plan.executionRepo],
    ["runtime_root", plan.runtimeRoot],
    ["evidence_root", plan.evidenceRoot],
  ]) {
    const actual = canonicalizeExistingPathV01(expected);
    if (actual !== expected) {
      throw runnerError(
        "runner_path_identity_drift",
        `Pre-allocation ${label} canonical identity changed.`,
      );
    }
  }
  if (
    path.dirname(plan.runtimeRoot) !== plan.runRoot ||
    path.dirname(plan.evidenceRoot) !== plan.runRoot
  ) {
    throw runnerError(
      "runner_layout_not_canonical",
      "Runtime and evidence are no longer canonical siblings.",
    );
  }
  assertNoOverlap(
    "execution_repository_checkout_overlap",
    plan.executionRepo,
    plan.canonicalCheckout,
  );
  assertNoOverlap(
    "execution_repository_runtime_overlap",
    plan.executionRepo,
    plan.runtimeRoot,
  );
  assertNoOverlap(
    "execution_repository_evidence_overlap",
    plan.executionRepo,
    plan.evidenceRoot,
  );
  assertNoOverlap(
    "runtime_evidence_overlap",
    plan.runtimeRoot,
    plan.evidenceRoot,
  );
  const workingDatabaseKind = getLexicalPathEntryKindV01(plan.workingDbPath);
  if (workingDatabaseKind !== "missing") {
    throw runnerError(
      workingDatabaseKind === "symlink"
        ? "working_db_path_symlink"
        : "working_db_path_exists",
      "Working DB stopped being an absent prospective leaf before allocation.",
    );
  }
  const currentWorkingDatabase = canonicalizeProspectivePathV01(
    plan.workingDbPath,
  );
  if (
    currentWorkingDatabase !== plan.workingDbPath ||
    !strictlyWithin(plan.runtimeRoot, currentWorkingDatabase)
  ) {
    throw runnerError(
      "working_db_path_identity_drift",
      "Working DB prospective identity changed before allocation.",
    );
  }

  for (const outputPath of [
    plan.reportPath,
    plan.manifestPath,
    plan.privateBackupPath,
  ]) {
    const kind = getLexicalPathEntryKindV01(outputPath);
    if (kind !== "missing") {
      throw runnerError(
        kind === "symlink"
          ? "runner_output_symlink"
          : "runner_output_exists",
        "A post-qualification runner output appeared before allocation.",
      );
    }
    const actual = canonicalizeProspectivePathV01(outputPath);
    if (
      actual !== outputPath ||
      !strictlyWithin(plan.evidenceRoot, actual) ||
      doCanonicalPathsOverlapV01(plan.executionRepo, actual) ||
      doCanonicalPathsOverlapV01(plan.runtimeRoot, actual) ||
      doCanonicalPathsOverlapV01(plan.workingDbPath, actual)
    ) {
      throw runnerError(
        "runner_output_identity_drift",
        "A runner output canonical identity changed before allocation.",
      );
    }
  }

  const portableBytes = Buffer.from(
    context.locked_receipts.portable_base64,
    "base64",
  );
  const localFullBytes = Buffer.from(
    context.locked_receipts.local_full_base64,
    "base64",
  );
  const portable = recheckQualificationReceiptV01(
    plan,
    "portable",
    portableBytes,
  );
  const localFull = recheckQualificationReceiptV01(
    plan,
    "local_full",
    localFullBytes,
  );
  if (
    hashBuffer(portableBytes) !== context.locked_receipts.portable_sha256 ||
    hashBuffer(localFullBytes) !== context.locked_receipts.local_full_sha256 ||
    hashFile(plan.portableReceiptPath) !==
      context.locked_receipts.portable_sha256 ||
    hashFile(plan.localFullReceiptPath) !==
      context.locked_receipts.local_full_sha256
  ) {
    throw runnerError(
      "qualification_receipt_hash_drift",
      "Qualification receipt hash changed before allocation.",
    );
  }
  if (
    JSON.stringify(portable) !== JSON.stringify(context.portable) ||
    JSON.stringify(localFull) !== JSON.stringify(context.localFull)
  ) {
    throw runnerError(
      "qualification_receipt_identity_drift",
      "Qualification receipt content changed before allocation.",
    );
  }
  return { status: "pass" };
}

function defaultOperationsV01() {
  return {
    checkpoint: async (plan) => {
      const commit = runCapture("git", ["rev-parse", "HEAD"], plan.canonicalCheckout).stdout.trim();
      const status = runCapture("git", ["status", "--porcelain", "--untracked-files=all"], plan.canonicalCheckout).stdout;
      return { status: "pass", application_commit: commit, dirty_entry_count: status ? status.trimEnd().split("\n").length : 0 };
    },
    clone: async (plan) => {
      runCapture("git", ["clone", "--local", "--no-hardlinks", plan.canonicalCheckout, plan.executionRepo], plan.runRoot, 120_000);
      return { status: "pass", no_hardlinks: true };
    },
    provisionRoot: async (plan) => {
      runCapture("npm", ["ci"], plan.executionRepo, 600_000);
      return { status: "pass" };
    },
    provisionNested: async (plan) => {
      runCapture("npm", ["ci"], path.join(plan.executionRepo, "apps", "augnes_apps"), 600_000);
      return { status: "pass" };
    },
    qualify: async (plan, mode) => invokeQualificationCliV01(plan, mode),
    afterQualificationLocked: async () => ({ status: "pass" }),
    recheckQualification: async (plan, context) => {
      recheckPreAllocationStorageAndReceiptsV01(plan, context);
      return await recheckLockedQualificationIdentityV01(plan, context);
    },
    allocateChain: async () => ({ chain_id: `chain:${randomUUID()}`, fixture_only: true }),
    mechanicalPhase: defaultMechanicalPhaseV01,
    writeReport: async () => ({ status: "pass", persistence: "deferred_until_cleanup" }),
    finalizeReport: async (plan, report) => {
      const manifest = {
        manifest_version: "vnext_m3d_autonomous_evidence_manifest.v0.1",
        runner_version: report.runner_version,
        verdict: report.verdict,
        phase: report.phase,
        chain_id: report.chain_id,
        fixture_only: report.fixture_only,
        report_file: path.basename(plan.reportPath),
        private_backup_file: report.backup_sha256 ? path.basename(plan.privateBackupPath) : null,
        authority_boundary: report.authority_boundary,
      };
      writePublicRunnerJsonV01({ evidenceRoot: plan.evidenceRoot, outputPath: plan.reportPath, value: report });
      writePublicRunnerJsonV01({ evidenceRoot: plan.evidenceRoot, outputPath: plan.manifestPath, value: manifest });
      return { status: "pass" };
    },
    cleanup: async (plan) => cleanupOwnedResourcesV01(plan),
  };
}

async function defaultMechanicalPhaseV01(phase, state) {
  const { plan } = state;
  if (phase === "CREATE_WORKING_DATABASE") {
    if (getLexicalPathEntryKindV01(plan.workingDbPath) !== "missing") {
      throw runnerError("working_db_path_exists", "Working DB is no longer fresh.", phase);
    }
    runCapture(
      "npm",
      ["run", "db:reset"],
      plan.executionRepo,
      120_000,
      {
        AUGNES_DB_PATH: plan.workingDbPath,
      },
      phase,
    );
    return { status: "pass", isolated_database_created: existsSync(plan.workingDbPath) };
  }
  if (phase === "MIGRATE") {
    runCapture(
      "npm",
      ["run", "db:migrate"],
      plan.executionRepo,
      120_000,
      { AUGNES_DB_PATH: plan.workingDbPath },
      phase,
    );
    runCapture(
      "npm",
      ["run", "db:migrate"],
      plan.executionRepo,
      120_000,
      { AUGNES_DB_PATH: plan.workingDbPath },
      phase,
    );
    return { status: "pass", repeated_migration: "no_op" };
  }
  if (phase === "BASELINE") {
    state.databaseBaseline = snapshotRunnerDatabaseV01(plan);
    return {
      status: "pass",
      integrity_check: state.databaseBaseline.integrity_check,
      protected_table_count: state.databaseBaseline.protected_table_count,
    };
  }
  if (phase === "MECHANICAL_REHEARSAL") {
    const protocolPath = path.join(
      plan.runtimeRoot,
      "operator-phase-protocol-v0-1.json",
    );
    const manifestPath = path.join(
      plan.runtimeRoot,
      "operator-browser-manifest-v0-1.json",
    );
    const result = runBoundedPhaseProtocolCommandV01({
      command: "npm",
      args: ["run", "smoke:vnext-operator-pilot-v0-1"],
      cwd: plan.executionRepo,
      timeout: 600_000,
      protocolPath,
      fallbackPhase: phase,
      environment: {
        ...isolatedChildEnvironment(),
        AUGNES_M3D_RUNNER_RUNTIME_ROOT: plan.runtimeRoot,
        AUGNES_M3D_RUNNER_WORKING_DB_PATH: plan.workingDbPath,
        AUGNES_M3D_RUNNER_DB_PREINITIALIZED: "1",
        AUGNES_M3D_RUNNER_PHASE_PROTOCOL_PATH: protocolPath,
        AUGNES_M3D_RUNNER_BROWSER_MANIFEST_PATH: manifestPath,
      },
    });
    const summary = parseTrailingJson(
      result.stdout,
      "operator_smoke_output_invalid",
    );
    if (
      result.protocol.status !== "pass" ||
      !result.protocol.completed_phases.includes("MECHANICAL_REHEARSAL")
    ) {
      throw runnerError(
        "mechanical_phase_protocol_invalid",
        "Operator phase protocol did not complete mechanical rehearsal.",
        phase,
      );
    }
    if (summary.status !== "pass" || summary.full_loop_fixture_only !== true || summary.external_network_calls !== 0) {
      throw runnerError("mechanical_rehearsal_failed", "Isolated operator rehearsal failed.", phase);
    }
    if (
      summary.browser_fixture_export?.database_mode !==
      "runner_managed_exact_working_db"
    ) {
      throw runnerError(
        "runner_browser_manifest_invalid",
        "Operator rehearsal did not bind the exact runner-managed database.",
        phase,
      );
    }
    state.operatorSmoke = summary;
    state.operatorPhaseProtocol = result.protocol;
    state.browserManifestPath = manifestPath;
    return { status: "pass", fixture_only: true, external_network_calls: 0 };
  }
  const summary = state.operatorSmoke;
  if (!summary) throw runnerError("operator_smoke_missing", "Operator smoke result is missing.", phase);
  if (phase === "EXACT_REPLAY") {
    if (
      state.operatorPhaseProtocol?.status !== "pass" ||
      !state.operatorPhaseProtocol.completed_phases.includes("EXACT_REPLAY")
    ) {
      throw runnerError(
        "exact_replay_phase_protocol_invalid",
        "Operator phase protocol did not complete exact replay.",
        phase,
      );
    }
    for (const caseId of ["semantic_transition_exact_replay", "later_packet_compile_exact_replay", "later_result_exact_replay", "context_use_review_exact_replay"]) {
      requireCase(summary, caseId, phase);
    }
    return { status: "pass", immutable_duplicate_count: 0 };
  }
  if (phase === "BROWSER_REHEARSAL") {
    const identity = qualifyBrowserExecutableV01({ explicitPath: plan.browserExecutable, environment: process.env }).identity;
    if (JSON.stringify(identity) !== JSON.stringify(state.qualification.browser_identity)) {
      throw runnerError("browser_identity_drift", "Browser identity drifted before spawn.", phase);
    }
    const browser = runCapture(
      "npm",
      ["run", "browser:vnext-task-context-packet-handoff-v0-1"],
      plan.executionRepo,
      600_000,
      {
        ...(plan.browserExecutable
          ? { AUGNES_BROWSER_EXECUTABLE_PATH: plan.browserExecutable }
          : {}),
        AUGNES_BROWSER_EXISTING_DB_PATH: plan.workingDbPath,
        AUGNES_BROWSER_EXISTING_MANIFEST_PATH: state.browserManifestPath,
      },
      phase,
    );
    const browserSummary = parseTrailingJson(browser.stdout, "browser_rehearsal_output_invalid");
    if (browserSummary.ok !== true || browserSummary.temporary_profile_removed !== true || browserSummary.temporary_fixture_removed !== true) {
      throw runnerError("browser_rehearsal_failed", "Browser rehearsal did not cleanly pass.", phase);
    }
    state.browserSummary = browserSummary;
    if (
      browserSummary.fixture_source !== "existing_runner_managed_material" ||
      browserSummary.runner_managed_database_preserved !== true
    ) {
      throw runnerError(
        "browser_runner_material_mismatch",
        "Browser rehearsal did not consume the exact runner-managed material.",
        phase,
      );
    }
    return { status: "pass", viewports: [390, 768, 1440], loopback_only: true };
  }
  if (phase === "FINAL_DATABASE_AUDIT") {
    const Database = loadExecutionDatabaseConstructor(plan.executionRepo);
    const database = new Database(plan.workingDbPath, { readonly: true, fileMustExist: true });
    try {
      const integrity = database.pragma("integrity_check");
      if (JSON.stringify(integrity) !== JSON.stringify([{ integrity_check: "ok" }])) {
        throw runnerError("database_integrity_failed", "Final database integrity check failed.", phase);
      }
    } finally {
      database.close();
    }
    state.databaseIntegrity = "ok";
    return { status: "pass", integrity_check: "ok" };
  }
  if (phase === "BACKUP") {
    mkdirSync(path.dirname(plan.privateBackupPath), { recursive: true, mode: 0o700 });
    copyFileSync(
      plan.workingDbPath,
      plan.privateBackupPath,
      fsConstants.COPYFILE_EXCL,
    );
    chmodSync(plan.privateBackupPath, 0o600);
    state.backupSha256 = hashFile(plan.privateBackupPath);
    return { status: "pass", backup_sha256: state.backupSha256, private_artifact: true };
  }
  if (phase === "CREDENTIAL_AUDIT") {
    assertPublicSafeRunnerMaterialV01({
      qualification: state.qualification,
      phases: state.phases,
      operator_summary: {
        status: summary.status,
        plaintext_credential_occurrences: summary.plaintext_credential_occurrences,
        external_network_calls: summary.external_network_calls,
        full_loop_fixture_only: summary.full_loop_fixture_only,
      },
      browser_summary: state.browserSummary
        ? {
            ok: state.browserSummary.ok,
            temporary_profile_removed: state.browserSummary.temporary_profile_removed,
            temporary_fixture_removed: state.browserSummary.temporary_fixture_removed,
          }
        : null,
    });
    if (summary.plaintext_credential_occurrences !== 0) {
      throw runnerError("credential_material_detected", "Credential audit found plaintext material.", phase);
    }
    return { status: "pass", credential_material_occurrences: 0 };
  }
  throw runnerError("mechanical_phase_unsupported", `Unsupported mechanical phase ${phase}.`, phase);
}

function invokeQualificationCliV01(plan, mode) {
  const output = mode === "portable" ? plan.portableReceiptPath : plan.localFullReceiptPath;
  const args = [
    path.join(plan.executionRepo, "scripts", "qualify-vnext-m3d-evidence-runner-v0-1.mjs"),
    "--mode", mode,
    "--repo-root", plan.executionRepo,
    "--runtime-root", plan.runtimeRoot,
    "--evidence-root", plan.evidenceRoot,
    "--working-db-path", plan.workingDbPath,
    "--canonical-checkout-root", plan.canonicalCheckout,
    "--output", output,
    "--json",
  ];
  if (mode === "local_full" && plan.browserExecutable) args.push("--browser-executable", plan.browserExecutable);
  const child = spawnSync(process.execPath, args, {
    cwd: plan.executionRepo,
    encoding: null,
    timeout: 120_000,
    maxBuffer: MAX_JSON_BYTES,
    env: isolatedChildEnvironment(),
    stdio: ["ignore", "pipe", "pipe"],
  });
  return {
    exitCode: child.status,
    stdout: child.stdout,
    receiptBytes: existsSync(output) ? readFileSync(output) : null,
  };
}

function prepareRunnerDirectories(plan) {
  mkdirSync(plan.runRoot, { recursive: true, mode: 0o700 });
  mkdirSync(plan.runtimeRoot, { recursive: true, mode: 0o700 });
  mkdirSync(plan.evidenceRoot, { recursive: true, mode: 0o700 });
  for (const root of [plan.runRoot, plan.runtimeRoot, plan.evidenceRoot]) chmodSync(root, 0o700);
}

async function executePhase(state, phase, action) {
  const outcome = await action();
  if (outcome?.status && outcome.status !== "pass") {
    throw runnerError(outcome.reason_code ?? "runner_phase_failed", `Runner phase ${phase} failed.`, phase);
  }
  state.phases.push({ phase, status: "pass" });
  return outcome;
}

async function cleanupBeforeReturn(state, operations, afterAllocation) {
  let outcome;
  try {
    outcome = await operations.cleanup(state.plan, state);
  } catch {
    outcome = { status: "fail", reason_code: "runner_cleanup_failed" };
  }
  const normalized = outcome?.status ? outcome : { status: "pass" };
  state.phases.push({ phase: "CLEANUP", status: normalized.status });
  if (afterAllocation && normalized.status !== "pass") return normalized;
  return normalized;
}

function cleanupOwnedResourcesV01(plan) {
  rmSync(plan.executionRepo, { recursive: true, force: true });
  rmSync(plan.runtimeRoot, { recursive: true, force: true });
  const leaked = [plan.executionRepo, plan.runtimeRoot, plan.workingDbPath, `${plan.workingDbPath}-wal`, `${plan.workingDbPath}-shm`].filter(existsSync);
  return leaked.length === 0
    ? { status: "pass", execution_repository_removed: true, runtime_removed: true, database_side_files_removed: true }
    : { status: "fail", reason_code: "runner_cleanup_failed", leaked_resource_count: leaked.length };
}

function buildCompletionReport(state) {
  return buildPublicRunnerReportV01({
    runner_version: M3D_AUTONOMOUS_EVIDENCE_RUNNER_VERSION_V01,
    mode: state.plan.mode,
    verdict: "COMPLETE_AUTONOMOUS_REHEARSAL",
    phase: "REPORT",
    chain_id: state.chain.chain_id,
    fixture_only: state.chain.fixture_only === true,
    application_commit: state.qualification.application_commit,
    qualification: state.qualification,
    phases: [...state.phases, { phase: "REPORT", status: "pass" }],
    database_integrity: state.databaseIntegrity,
    backup_sha256: state.backupSha256,
    cleanup: { status: "pending" },
  });
}

function publicQualificationSummary(context) {
  return {
    qualification_version: context.locked_identity.qualification_version,
    application_commit: context.locked_identity.application_commit,
    node_major_version: context.locked_identity.node_major_version,
    platform: context.locked_identity.platform,
    architecture: context.locked_identity.architecture,
    root_package_lock_sha256: context.locked_identity.root_package_lock_sha256,
    nested_package_lock_sha256: context.locked_identity.nested_package_lock_sha256,
    portable_receipt_sha256: hashFile(context.plan.portableReceiptPath),
    local_full_receipt_sha256: hashFile(context.plan.localFullReceiptPath),
    browser_identity: context.locked_identity.browser_identity,
    identities_locked: true,
  };
}

function baseAuthorityBoundary() {
  return buildPublicRunnerReportV01({
    runner_version: M3D_AUTONOMOUS_EVIDENCE_RUNNER_VERSION_V01,
    mode: "boundary",
    verdict: "BOUNDARY_ONLY",
    phase: "BOUNDARY",
  }).authority_boundary;
}

function requireCase(summary, caseId, phase) {
  if (!Array.isArray(summary.positive_cases) || !summary.positive_cases.includes(caseId)) {
    throw runnerError("mechanical_assertion_missing", `Required assertion ${caseId} is missing.`, phase);
  }
}

function parseTrailingJson(stdout, reasonCode) {
  const text = String(stdout ?? "").trim();
  const start = text.lastIndexOf("\n{");
  const candidate = start >= 0 ? text.slice(start + 1) : text;
  return parseBoundedJson(Buffer.from(candidate, "utf8"), reasonCode);
}

function loadExecutionDatabaseConstructor(executionRepo) {
  const require = createRequire(path.join(executionRepo, "package.json"));
  return require("better-sqlite3");
}

function runCapture(
  command,
  args,
  cwd,
  timeout = 120_000,
  extraEnvironment = {},
  failurePhase = "RUNNER_QUALIFICATION",
) {
  const child = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    timeout,
    maxBuffer: 4 * 1024 * 1024,
    env: { ...isolatedChildEnvironment(), ...extraEnvironment },
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (child.error || child.signal || child.status !== 0) {
    const error = runnerError(
      "runner_command_failed",
      `Bounded command failed: ${command}.`,
      failurePhase,
    );
    error.command = command;
    error.exitCode = child.status;
    throw error;
  }
  return { stdout: child.stdout ?? "", stderr: child.stderr ?? "" };
}

export function runBoundedPhaseProtocolCommandV01({
  command,
  args,
  cwd,
  environment,
  protocolPath,
  timeout,
  fallbackPhase,
}) {
  const child = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    timeout,
    maxBuffer: 4 * 1024 * 1024,
    env: environment,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let protocol = null;
  let protocolInvalid = false;
  if (existsSync(protocolPath)) {
    try {
      protocol = parseBoundedJson(
        boundedBuffer(
          readFileSync(protocolPath),
          "runner_phase_protocol_invalid",
        ),
        "runner_phase_protocol_invalid",
      );
      protocolInvalid = !validRunnerPhaseProtocolV01(protocol);
    } catch {
      protocolInvalid = true;
      protocol = null;
    }
  }
  if (child.error || child.signal || child.status !== 0) {
    const failurePhase =
      !protocolInvalid && validOperatorProtocolPhase(protocol?.failure_phase)
      ? protocol.failure_phase
      : fallbackPhase;
    const error = runnerError(
      !protocolInvalid && protocol?.status === "fail"
        ? protocol.reason_code
        : "runner_subprocess_failed",
      `Bounded subprocess failed: ${command}.`,
      failurePhase,
    );
    error.exitCode = child.status;
    throw error;
  }
  if (
    protocolInvalid ||
    !protocol ||
    protocol.status !== "pass"
  ) {
    throw runnerError(
      "runner_phase_protocol_invalid",
      "Bounded subprocess returned no valid runner phase protocol.",
      fallbackPhase,
    );
  }
  return {
    stdout: child.stdout ?? "",
    stderr: child.stderr ?? "",
    protocol,
  };
}

function snapshotRunnerDatabaseV01(plan) {
  const Database = loadExecutionDatabaseConstructor(plan.executionRepo);
  const database = new Database(plan.workingDbPath, {
    readonly: true,
    fileMustExist: true,
  });
  try {
    const integrity = database.pragma("integrity_check", { simple: true });
    if (integrity !== "ok") {
      throw runnerError(
        "database_baseline_integrity_failed",
        "Runner database baseline integrity failed.",
        "BASELINE",
      );
    }
    const protectedTables = database
      .prepare(
        `SELECT name FROM sqlite_master
         WHERE type = 'table'
           AND name NOT LIKE 'sqlite_%'
           AND name <> 'vnext_local_operator_sessions'
         ORDER BY name`,
      )
      .all()
      .map((row) => row.name);
    const protectedRows = protectedTables.map((tableName) => ({
      table_name: tableName,
      rows: database
        .prepare(`SELECT * FROM ${quoteIdentifierV01(tableName)}`)
        .all()
        .map((row) => JSON.stringify(row))
        .sort(),
    }));
    return {
      integrity_check: "ok",
      protected_table_count: protectedTables.length,
      protected_rows_sha256: hashBuffer(
        Buffer.from(JSON.stringify(protectedRows), "utf8"),
      ),
      database_sha256: hashFile(plan.workingDbPath),
    };
  } finally {
    database.close();
  }
}

function quoteIdentifierV01(value) {
  return `"${value.replaceAll('"', '""')}"`;
}

function validOperatorProtocolPhase(value) {
  return value === "MECHANICAL_REHEARSAL" || value === "EXACT_REPLAY";
}

function validRunnerPhaseProtocolV01(protocol) {
  if (
    !protocol ||
    protocol.protocol_version !==
      "vnext_m3d_runner_phase_protocol.v0.1" ||
    (protocol.status !== "pass" && protocol.status !== "fail") ||
    !Array.isArray(protocol.completed_phases) ||
    protocol.completed_phases.some(
      (phase) => !validOperatorProtocolPhase(phase),
    ) ||
    new Set(protocol.completed_phases).size !==
      protocol.completed_phases.length ||
    protocol.fixture_only !== true ||
    protocol.real_user_authorization_created !== false ||
    protocol.m3_completion_claimed !== false
  ) {
    return false;
  }
  if (protocol.status === "pass") {
    return (
      protocol.failure_phase === null &&
      protocol.reason_code === null &&
      protocol.completed_phases.includes("MECHANICAL_REHEARSAL") &&
      protocol.completed_phases.includes("EXACT_REPLAY")
    );
  }
  return (
    validOperatorProtocolPhase(protocol.failure_phase) &&
    typeof protocol.reason_code === "string" &&
    /^[a-z0-9_]{1,80}$/u.test(protocol.reason_code)
  );
}

function isolatedChildEnvironment() {
  const environment = { ...process.env };
  for (const key of ["OPENAI_API_KEY", "ANTHROPIC_API_KEY", "GEMINI_API_KEY", "GOOGLE_API_KEY", "GITHUB_TOKEN", "NODE_PATH", "NODE_OPTIONS"]) {
    delete environment[key];
  }
  return environment;
}

function boundedBuffer(value, reasonCode) {
  if (value === null || value === undefined) throw runnerError(reasonCode, "Bounded JSON material is missing.");
  const buffer = Buffer.isBuffer(value) ? value : Buffer.from(String(value), "utf8");
  if (buffer.byteLength === 0 || buffer.byteLength > MAX_JSON_BYTES) {
    throw runnerError(reasonCode, "Bounded JSON material has an invalid size.");
  }
  return buffer;
}

function parseBoundedJson(buffer, reasonCode) {
  try {
    return JSON.parse(buffer.toString("utf8"));
  } catch {
    throw runnerError(reasonCode, "Bounded JSON material is invalid.");
  }
}

function validBrowserIdentity(value) {
  return value && typeof value.executable_name === "string" && typeof value.executable_sha256 === "string" && /^sha256:[a-f0-9]{64}$/u.test(value.executable_sha256) && typeof value.version_summary === "string" && value.version_summary.length > 0;
}

function hashFile(filePath) {
  return `sha256:${createHash("sha256").update(readFileSync(filePath)).digest("hex")}`;
}

function hashBuffer(value) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function strictlyWithin(root, candidate) {
  return root !== candidate && isPathWithinCanonicalRootV01(root, candidate);
}

function assertNoOverlap(reasonCode, left, right) {
  if (doCanonicalPathsOverlapV01(left, right)) {
    throw runnerError(reasonCode, "Runner path overlap is forbidden.", "PLAN");
  }
}

function publicReasonCode(error) {
  return typeof error?.reasonCode === "string" ? error.reasonCode : "runner_internal_failure";
}

function runnerError(reasonCode, message, phase = "RUNNER_QUALIFICATION") {
  return new M3dAutonomousEvidenceRunnerErrorV01(reasonCode, message, phase);
}
