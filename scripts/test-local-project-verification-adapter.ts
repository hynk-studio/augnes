import assert from "node:assert/strict";
import {
  mkdir,
  mkdtemp,
  realpath,
  rm,
  stat,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { genericCliBuilderInputFixture } from "@/fixtures/vnext/protocol/task-context-packet-v0-1";
import {
  LOCAL_PROJECT_ROOT_VERIFICATION_EXPECTED_OUTPUTS_V01,
  LOCAL_PROJECT_ROOT_VERIFICATION_REQUIRED_CHECKS_V01,
  LOCAL_PROJECT_ROOT_VERIFICATION_TASK_V01,
} from "@/lib/vnext/automation/local-project-root-verification-profile";
import {
  MAX_ROOT_ENTRIES_V01,
  createLocalProjectVerificationAdapterV01,
  enumerateBoundedProjectRootManifestV01,
  fingerprintProjectRootManifestV01,
  normalizeProjectRootManifestV01,
  type BoundedProjectRootDirectoryEntryV01,
  type BoundedProjectRootDirectoryHandleV01,
  type LocalProjectVerificationFilesystemV01,
  type ProjectRootManifestEntryV01,
} from "@/lib/vnext/native-host/local-project-verification-adapter";
import { inspectNativeHostPhysicalRootIdentityV01 } from "@/lib/vnext/native-host/project-root-identity";
import { assertNativeHostResultV01 } from "@/lib/vnext/native-host/native-host-contract";
import { projectDirectNativeHostActionObservationsV01 } from "@/lib/vnext/runtime/direct-native-host-round-trip";
import { buildTaskContextPacketV01 } from "@/lib/vnext/task-context-packet";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import type {
  NativeHostPhysicalRootIdentityV01,
  NativeHostRequestV01,
  NativeHostResultV01,
} from "@/types/vnext/native-host-adapter";

const TEST_AT = "2026-07-19T08:00:00.000Z";
let root = "";

async function main(): Promise<void> {
  root = await mkdtemp(path.join(tmpdir(), "augnes-local-verify-"));
  try {
    await assertBoundedEnumerationV01();
    assertCanonicalManifestV01();
    await assertRootAndResidueOutcomesV01();
    process.stdout.write(
      `${JSON.stringify({
        suite: "local-project-verification-adapter.v0.1",
        status: "passed",
        max_root_entries: MAX_ROOT_ENTRIES_V01,
        incremental_bound_checked: true,
        canonical_manifest_checked: true,
        exact_root_identity_checked: true,
        truthful_terminal_residue_checked: true,
      }, null, 2)}\n`,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function assertBoundedEnumerationV01(): Promise<void> {
  for (const count of [0, 1, MAX_ROOT_ENTRIES_V01]) {
    const fixture = directoryFixtureV01(count);
    const result = await enumerateBoundedProjectRootManifestV01({
      open_directory: async () => fixture.handle,
      cancellation_signal: new AbortController().signal,
    });
    assert.equal(result.status, "completed");
    assert.equal(result.status === "completed" ? result.entries.length : -1, count);
    assert.equal(fixture.closed(), true);
  }

  const overflow = directoryFixtureV01(10_000);
  const overflowResult = await enumerateBoundedProjectRootManifestV01({
    open_directory: async () => overflow.handle,
    cancellation_signal: new AbortController().signal,
  });
  assert.equal(overflowResult.status, "bound_exceeded");
  assert.equal(overflow.reads(), MAX_ROOT_ENTRIES_V01 + 1);
  assert.equal(overflow.closed(), true);

  const cancellation = new AbortController();
  const cancelled = directoryFixtureV01(10, {
    after_read: (reads) => {
      if (reads === 1) cancellation.abort();
    },
  });
  const cancelledResult = await enumerateBoundedProjectRootManifestV01({
    open_directory: async () => cancelled.handle,
    cancellation_signal: cancellation.signal,
  });
  assert.equal(cancelledResult.status, "cancelled");
  assert.equal(cancelled.closed(), true);

  const failed = directoryFixtureV01(10, { fail_at_read: 2 });
  await assert.rejects(
    enumerateBoundedProjectRootManifestV01({
      open_directory: async () => failed.handle,
      cancellation_signal: new AbortController().signal,
    }),
    /injected_directory_read_failure/u,
  );
  assert.equal(failed.closed(), true);
}

function assertCanonicalManifestV01(): void {
  const material: ProjectRootManifestEntryV01[] = [
    { name: "z", kind: "file" },
    { name: "A", kind: "directory" },
    { name: "ä", kind: "symbolic_link" },
    { name: "a", kind: "other" },
  ];
  const expected = normalizeProjectRootManifestV01(material);
  assert.deepEqual(
    expected.map((entry) => entry.name),
    ["A", "a", "z", "ä"],
  );
  assert.equal(
    fingerprintProjectRootManifestV01(material),
    fingerprintProjectRootManifestV01([...material].reverse()),
  );
  const originalLocaleCompare = String.prototype.localeCompare;
  try {
    String.prototype.localeCompare = () => {
      throw new Error("locale_compare_must_not_be_used");
    };
    assert.equal(
      fingerprintProjectRootManifestV01(material),
      fingerprintProjectRootManifestV01([...material].reverse()),
    );
  } finally {
    String.prototype.localeCompare = originalLocaleCompare;
  }
  assert.notEqual(
    fingerprintProjectRootManifestV01(material),
    fingerprintProjectRootManifestV01([
      ...material.slice(0, 3),
      { name: "b", kind: "other" },
    ]),
  );
  assert.notEqual(
    fingerprintProjectRootManifestV01(material),
    fingerprintProjectRootManifestV01([
      { name: "z", kind: "directory" },
      ...material.slice(1),
    ]),
  );
  assert.throws(
    () =>
      fingerprintProjectRootManifestV01([
        { name: "duplicate", kind: "file" },
        { name: "duplicate", kind: "directory" },
      ]),
    /duplicate_name/u,
  );
}

async function assertRootAndResidueOutcomesV01(): Promise<void> {
  const projectRoot = path.join(root, "project");
  await mkdir(projectRoot);
  await writeFile(path.join(projectRoot, "package.json"), "{}\n", "utf8");
  await mkdir(path.join(projectRoot, "src"));
  const identity = await inspectNativeHostPhysicalRootIdentityV01(projectRoot);

  const completed = await invokeV01(requestV01(projectRoot, identity));
  assert.equal(completed.outcome, "completed");
  assert.deepEqual(
    completed.checks.map((check) => check.check_id).sort(),
    [...LOCAL_PROJECT_ROOT_VERIFICATION_REQUIRED_CHECKS_V01],
  );
  assert.equal(completed.artifacts.length, 1);
  assert.equal(completed.skipped_checks.length, 0);
  assert.deepEqual(completed.observed_actions, [
    "project_root_inspection_started",
    "verified_exact_project_root_binding",
    "enumerated_bounded_project_root_manifest",
    "fingerprinted_bounded_project_root_manifest",
  ]);
  assert.equal(
    actionReceiptObservationsV01(completed).filter(
      (observation) =>
        observation.summary === "fingerprinted_bounded_project_root_manifest",
    ).length,
    1,
  );
  assert.equal(
    completed.observed_actions.includes(
      "fingerprinted_bounded_project_root_manifest",
    ),
    true,
  );
  assert.equal(JSON.stringify(completed).includes(projectRoot), false);
  assert.equal(JSON.stringify(completed).includes("package.json"), false);

  const preCancelledController = new AbortController();
  preCancelledController.abort();
  const preCancelled = await invokeV01(
    requestV01(projectRoot, identity),
    undefined,
    preCancelledController.signal,
  );
  assertNegativeResidueV01(preCancelled, "cancelled");
  assert.deepEqual(preCancelled.observed_actions, []);
  assert.deepEqual(preCancelled.checks, []);
  assert.deepEqual(
    preCancelled.skipped_checks.map((check) => check.check_id).sort(),
    [...LOCAL_PROJECT_ROOT_VERIFICATION_REQUIRED_CHECKS_V01],
  );

  const duringController = new AbortController();
  const duringFixture = directoryFixtureV01(10, {
    after_read: () => duringController.abort(),
  });
  const duringFilesystem = filesystemV01(async () => duringFixture.handle);
  const duringCancelled = await invokeV01(
    requestV01(projectRoot, identity),
    duringFilesystem,
    duringController.signal,
  );
  assertNegativeResidueV01(duringCancelled, "cancelled");
  assert.deepEqual(duringCancelled.observed_actions, [
    "project_root_inspection_started",
    "verified_exact_project_root_binding",
  ]);
  assert.deepEqual(
    duringCancelled.checks.map(({ check_id, status }) => ({ check_id, status })),
    [{ check_id: "project_root_scope_verified", status: "passed" }],
  );
  assert.equal(duringFixture.closed(), true);

  const conflictingIdentity: NativeHostPhysicalRootIdentityV01 = {
    ...identity,
    inode: `${identity.inode}-changed`,
  };
  const conflict = await invokeV01(requestV01(projectRoot, conflictingIdentity));
  assertNegativeResidueV01(conflict, "blocked");
  assert.deepEqual(conflict.observed_actions, [
    "project_root_inspection_started",
  ]);
  assert.equal(
    conflict.checks.find((check) => check.check_id === "project_root_scope_verified")
      ?.status,
    "blocked",
  );

  const overflow = directoryFixtureV01(MAX_ROOT_ENTRIES_V01 + 1);
  const overflowResult = await invokeV01(
    requestV01(projectRoot, identity),
    filesystemV01(async () => overflow.handle),
  );
  assertNegativeResidueV01(overflowResult, "blocked");
  assert.equal(overflow.closed(), true);
  assert.equal(
    overflowResult.observed_actions.includes(
      "project_root_manifest_bound_exceeded",
    ),
    true,
  );
  assert.deepEqual(
    overflowResult.checks.map(({ check_id, status }) => ({ check_id, status })),
    [
      { check_id: "project_root_scope_verified", status: "passed" },
      { check_id: "project_root_manifest_bound", status: "blocked" },
    ],
  );

  const filesystemFailure = await invokeV01(
    requestV01(projectRoot, identity),
    filesystemV01(async () => {
      throw new Error("injected_open_failure");
    }),
  );
  assertNegativeResidueV01(filesystemFailure, "failed");
  assert.equal(
    filesystemFailure.observed_actions.includes(
      "verified_exact_project_root_binding",
    ),
    true,
  );
  assert.deepEqual(
    filesystemFailure.checks.map(({ check_id, status }) => ({ check_id, status })),
    [
      { check_id: "project_root_scope_verified", status: "passed" },
      { check_id: "project_root_manifest_verified", status: "failed" },
    ],
  );

  const replaced = path.join(root, "replaced");
  const replacedPrior = path.join(root, "replaced-prior");
  await mkdir(replaced);
  const replacedIdentity = await inspectNativeHostPhysicalRootIdentityV01(replaced);
  await import("node:fs/promises").then(({ rename }) => rename(replaced, replacedPrior));
  await mkdir(replaced);
  assertNegativeResidueV01(
    await invokeV01(requestV01(replaced, replacedIdentity)),
    "blocked",
  );

  const linkTargetA = path.join(root, "link-target-a");
  const linkTargetB = path.join(root, "link-target-b");
  const linkedRoot = path.join(root, "linked-root");
  await mkdir(linkTargetA);
  await mkdir(linkTargetB);
  await symlink(linkTargetA, linkedRoot);
  const linkedIdentity = await inspectNativeHostPhysicalRootIdentityV01(linkedRoot);
  await rm(linkedRoot);
  await symlink(linkTargetB, linkedRoot);
  assertNegativeResidueV01(
    await invokeV01(requestV01(linkedRoot, linkedIdentity)),
    "blocked",
  );

  const notDirectory = path.join(root, "not-directory");
  await writeFile(notDirectory, "not a directory\n", "utf8");
  assertNegativeResidueV01(
    await invokeV01(requestV01(notDirectory, identity)),
    "blocked",
  );
}

function assertNegativeResidueV01(
  result: NativeHostResultV01,
  outcome: NativeHostResultV01["outcome"],
): void {
  assert.equal(result.outcome, outcome);
  assert.equal(result.artifacts.length, 0);
  assert.equal(
    result.observed_actions.includes(
      "fingerprinted_bounded_project_root_manifest",
    ),
    false,
  );
  assert.equal(
    result.checks.some(
      (check) =>
        check.check_id === "project_root_manifest_verified" &&
        check.status === "passed",
    ),
    false,
  );
  assert.equal(
    actionReceiptObservationsV01(result).some(
      (observation) =>
        observation.summary === "fingerprinted_bounded_project_root_manifest",
    ),
    false,
  );
  assert.equal(
    result.capability_coverage.some(
      (entry) =>
        entry.capability === "provider_or_model_egress" &&
        entry.coverage === "enforced",
    ),
    true,
  );
}

function actionReceiptObservationsV01(result: NativeHostResultV01) {
  const sourceFingerprint = `sha256:${"c".repeat(64)}`;
  return projectDirectNativeHostActionObservationsV01({
    result,
    run_ref: refV01("automation_run", result.run_id, sourceFingerprint),
    adapter_ref: refV01(
      "native_host_adapter_version",
      result.adapter_version,
      sourceFingerprint,
    ),
    reporter_ref: refV01(
      "native_host_orchestrator",
      "direct_native_host_round_trip.v0.1",
      sourceFingerprint,
    ),
  });
}

async function invokeV01(
  request: NativeHostRequestV01,
  filesystem?: LocalProjectVerificationFilesystemV01,
  cancellationSignal = new AbortController().signal,
): Promise<NativeHostResultV01> {
  let tick = 0;
  const adapter = createLocalProjectVerificationAdapterV01({
    filesystem,
    now: () => new Date(Date.parse(TEST_AT) + tick++).toISOString(),
  });
  const result = await adapter.invoke(request, {
    cancellation_signal: cancellationSignal,
    timeout_ms: 30_000,
    stop_settle_timeout_ms: 1_000,
  }).result;
  return assertNativeHostResultV01(request, result);
}

function filesystemV01(
  openDirectory: LocalProjectVerificationFilesystemV01["openDirectory"],
): LocalProjectVerificationFilesystemV01 {
  return { realpath, stat, openDirectory };
}

function requestV01(
  canonicalRoot: string,
  physicalIdentity: NativeHostPhysicalRootIdentityV01,
): NativeHostRequestV01 {
  const packet = buildTaskContextPacketV01({
    ...structuredClone(genericCliBuilderInputFixture),
    task: structuredClone(LOCAL_PROJECT_ROOT_VERIFICATION_TASK_V01),
    constraints: {
      ...structuredClone(genericCliBuilderInputFixture.constraints),
      required_checks: [...LOCAL_PROJECT_ROOT_VERIFICATION_REQUIRED_CHECKS_V01],
    },
    return_contract: {
      ...structuredClone(genericCliBuilderInputFixture.return_contract),
      required_checks: [...LOCAL_PROJECT_ROOT_VERIFICATION_REQUIRED_CHECKS_V01],
      expected_artifacts: [...LOCAL_PROJECT_ROOT_VERIFICATION_EXPECTED_OUTPUTS_V01],
    },
  });
  const scopeFingerprint = `sha256:${"a".repeat(64)}`;
  const workRef = refV01("automation_work_item", "work:local-verification", scopeFingerprint);
  const packetRef = refV01(
    "task_context_packet",
    packet.packet_id,
    packet.integrity.fingerprint,
  );
  return {
    request_version: "native_host_request.v0.1",
    request_id: "host-request:local-verification",
    run_id: "host-run:local-verification",
    idempotency_key: `sha256:${"b".repeat(64)}`,
    workspace_id: packet.workspace_id,
    project_id: packet.project_id,
    work_ref: workRef,
    task_ref: refV01("task_definition", "task:local-verification", scopeFingerprint),
    task_context_packet_ref: packetRef,
    packet,
    packet_lineage: {
      source_transition_receipt_ref: refV01(
        "state_transition_receipt",
        "transition:fixture",
        scopeFingerprint,
      ),
      packet_source_refs: [],
      selected_context_refs: [],
    },
    mode: "policy_triggered",
    root_scope: {
      canonical_root: canonicalRoot,
      path_flavor: "posix",
      root_kind: "plain_folder",
      root_fingerprint: scopeFingerprint,
      physical_root_identity: physicalIdentity,
      root_scope_ref: refV01("project_root_scope", packet.project_id, scopeFingerprint),
      repository_ref: null,
      selected_worktree_ref: null,
    },
    requested_capability: "project_scoped_structured_task_round_trip.v0.1",
    allowed_operation_categories: [
      "read_validated_task_context",
      "return_bounded_structured_result",
    ],
    forbidden_operation_categories: [
      "network_egress",
      "provider_or_model_call",
      "external_state_mutation",
    ],
    packet_capability_grant: packet.capability_grant,
    execution_grant_ref: null,
    automation_context: null,
    policy: {
      filesystem: "selected_project_root_only",
      network: "forbidden",
      commands: "forbidden_in_deterministic_adapter",
      model: "forbidden_in_deterministic_adapter",
      host_egress: "forbidden",
      max_changed_files: 0,
      max_artifacts: 1,
      max_commands: 0,
      max_checks: 16,
      timeout_ms: 30_000,
      stop_settle_timeout_ms: 1_000,
      stop_conditions: ["timeout", "cancellation_requested"],
    },
    result_return: {
      return_version: "native_host_result_return.v0.1",
      structured_result_required: true,
      legacy_result_text_allowed: false,
      raw_output_allowed: false,
      max_result_bytes: 128 * 1024,
    },
  };
}

function directoryFixtureV01(
  count: number,
  options: {
    after_read?: (reads: number) => void;
    fail_at_read?: number;
  } = {},
): {
  handle: BoundedProjectRootDirectoryHandleV01;
  reads(): number;
  closed(): boolean;
} {
  let index = 0;
  let reads = 0;
  let closed = false;
  const handle: BoundedProjectRootDirectoryHandleV01 = {
    async read() {
      reads += 1;
      if (options.fail_at_read === reads) {
        throw new Error("injected_directory_read_failure");
      }
      if (index >= count) return null;
      const entry = directoryEntryV01(`entry-${String(index).padStart(5, "0")}`);
      index += 1;
      options.after_read?.(reads);
      return entry;
    },
    async close() {
      assert.equal(closed, false, "directory handle closed more than once");
      closed = true;
    },
  };
  return {
    handle,
    reads: () => reads,
    closed: () => closed,
  };
}

function directoryEntryV01(name: string): BoundedProjectRootDirectoryEntryV01 {
  return {
    name,
    isDirectory: () => false,
    isFile: () => true,
    isSymbolicLink: () => false,
  };
}

function refV01(
  refType: string,
  externalId: string,
  sourceRef: string,
): ExternalRefV01 {
  return {
    ref_version: "external_ref.v0.1",
    ref_type: refType,
    external_id: externalId,
    observed_at: TEST_AT,
    source_ref: sourceRef,
    compatibility_namespace: "local_project_verification_adapter.v0.1",
    trust_class: "direct_local_observation",
  };
}
