import {
  constants,
  closeSync,
  existsSync,
  fstatSync,
  lstatSync,
  openSync,
  realpathSync,
} from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

import {
  assertCommissionedLiveTrainingArtifactsCompleteV01,
  assertCommissionedLiveTrainingAttemptIdentitiesDistinctV01,
  assertCommissionedLiveTrainingAttemptStartReservationV01,
  assertCommissionedLiveTrainingAuthorizationCurrentV01,
  assertCommissionedLiveTrainingCaseObservationsSealedBeforeUnblindingV01,
  assertSafeCommissionedLiveTrainingOutputV01,
  assertValidCommissionedLiveTrainingAuthorizationV01,
  assertValidCommissionedLiveTrainingCohortPlanV01,
  buildCommissionedLiveTrainingAnalysisJoinV01,
  buildCommissionedLiveTrainingAttemptAdmissionV01,
  buildCommissionedLiveTrainingAttemptRegistryV01,
  buildCommissionedLiveTrainingAttemptStartV01,
  buildCommissionedLiveTrainingAttemptTerminalV01,
  buildCommissionedLiveTrainingBlindObjectiveObservationV01,
  buildCommissionedLiveTrainingCandidateAssessmentV01,
  buildCommissionedLiveTrainingCleanupObservationV01,
  buildCommissionedLiveTrainingCleanupReportV01,
  buildCommissionedLiveTrainingCloneSealV01,
  buildCommissionedLiveTrainingIncompleteCloseoutV01,
  buildCommissionedLiveTrainingResultV01,
  commissionedLiveTrainingRecordRefV01,
  commissionedWorkManifestRecordRefV01,
  createCommissionedLiveTrainingAdapterBindingV01,
  COMMISSIONED_LIVE_TRAINING_ARTIFACT_NAMESPACE_V01,
  CommissionedControlledLiveTrainingErrorV01,
} from "@/lib/vnext/commissioned-controlled-live-training";
import {
  assertValidCommissionedWorkEpisodeArtifactV01,
  assertValidCommissionedWorkObjectiveObservationV01,
  buildCommissionedWorkEpisodeCheckpointV01,
  buildCommissionedWorkTrainingResultV01,
  createCommissionedWorkIntegrityV01,
  createCommissionedWorkRecordRefV01,
} from "@/lib/vnext/commissioned-controlled-workbench";
import { resolveCommissionedWorkArtifactNamespaceV01 } from "@/lib/vnext/commissioned-controlled-workbench-artifact-store";
import {
  canonicalizeProtocolValueV01,
  compareProtocolCodeUnitsV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import {
  COMMISSIONED_LIVE_TRAINING_ARTIFACT_INDEX_VERSION_V01,
  COMMISSIONED_LIVE_TRAINING_COMPLETION_WITNESS_VERSION_V01,
  COMMISSIONED_LIVE_TRAINING_CONSUMPTION_VERSION_V01,
  type CommissionedLiveTrainingArtifactIndexEntryV01,
  type CommissionedLiveTrainingArtifactIndexV01,
  type CommissionedLiveTrainingArtifactsV01,
  type CommissionedLiveTrainingAttemptAdmissionV01,
  type CommissionedLiveTrainingAttemptStartV01,
  type CommissionedLiveTrainingAttemptTerminalV01,
  type CommissionedLiveTrainingAuthorizationConsumptionV01,
  type CommissionedLiveTrainingAuthorizationV01,
  type CommissionedLiveTrainingAttemptRegistryV01,
  type CommissionedLiveTrainingAnalysisJoinV01,
  type CommissionedLiveTrainingBlindObjectiveObservationV01,
  type CommissionedLiveTrainingCandidateAssessmentV01,
  type CommissionedLiveTrainingCloneSealV01,
  type CommissionedLiveTrainingCleanupObservationV01,
  type CommissionedLiveTrainingCleanupReportV01,
  type CommissionedLiveTrainingCompletionWitnessV01,
  type CommissionedLiveTrainingCohortPlanV01,
  type CommissionedLiveTrainingExactNativeExecutionConfigurationV01,
  type CommissionedLiveTrainingIncompleteCloseoutV01,
  type CommissionedLiveTrainingResultV01,
} from "@/types/vnext/commissioned-controlled-live-training";
import type {
  CommissionedWorkEpisodeArtifactV01,
  CommissionedWorkEpisodeCheckpointV01,
  CommissionedWorkFamilyManifestV01,
  CommissionedWorkRecordRefV01,
  CommissionedWorkTrainingResultV01,
} from "@/types/vnext/commissioned-controlled-workbench";

const SAFE_SEGMENT_V01 = /^[A-Za-z0-9._-]{1,200}$/u;
const CONSUMPTION_DIRECTORY_V01 = "authorization-consumptions";
const COMPLETION_WITNESS_DIRECTORY_V01 = "completion-witnesses";
const INDEX_FILE_V01 = "artifact-index.json";
const INCOMPLETE_INDEX_FILE_V01 = "incomplete-artifact-index.json";
const INCOMPLETE_CLEANUP_FILE_V01 = "incomplete-cleanup-report.json";
const MAX_SECURE_IO_BYTES_V01 = 4_194_304;
const SECURE_ARTIFACT_IO_HELPER_V01 = [
  "import json, os, stat, sys",
  "operation, encoded_segments, expected_dev, expected_ino, encoded_pins = sys.argv[1:]",
  "segments = json.loads(encoded_segments)",
  "pins = json.loads(encoded_pins)",
  "root_fd = 3",
  "root = os.fstat(root_fd)",
  "assert stat.S_ISDIR(root.st_mode)",
  "assert str(root.st_dev) == expected_dev and str(root.st_ino) == expected_ino",
  "assert isinstance(segments, list) and len(segments) > 0",
  "assert isinstance(pins, dict)",
  "assert all(isinstance(s, str) and s not in ('', '.', '..') and '/' not in s and '\\\\' not in s for s in segments)",
  "current_fd = os.dup(root_fd)",
  "current_segments = []",
  "def assert_pin(fd, relative_path):",
  "    expected = pins.get(relative_path)",
  "    if expected is None: return",
  "    observed = os.fstat(fd)",
  "    assert str(observed.st_dev) == expected['device'] and str(observed.st_ino) == expected['inode']",
  "try:",
  "    for segment in segments[:-1]:",
  "        try:",
  "            next_fd = os.open(segment, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW, dir_fd=current_fd)",
  "        except FileNotFoundError:",
  "            if operation not in ('ensure_dir', 'write'): raise",
  "            try: os.mkdir(segment, 0o700, dir_fd=current_fd)",
  "            except FileExistsError: pass",
  "            next_fd = os.open(segment, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW, dir_fd=current_fd)",
  "        opened = os.fstat(next_fd)",
  "        linked = os.stat(segment, dir_fd=current_fd, follow_symlinks=False)",
  "        assert stat.S_ISDIR(opened.st_mode) and stat.S_ISDIR(linked.st_mode)",
  "        assert opened.st_dev == linked.st_dev and opened.st_ino == linked.st_ino",
  "        current_segments.append(segment)",
  "        assert_pin(next_fd, '/'.join(current_segments))",
  "        os.close(current_fd)",
  "        current_fd = next_fd",
  "    leaf = segments[-1]",
  "    if operation == 'ensure_dir':",
  "        try:",
  "            leaf_fd = os.open(leaf, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW, dir_fd=current_fd)",
  "        except FileNotFoundError:",
  "            try: os.mkdir(leaf, 0o700, dir_fd=current_fd)",
  "            except FileExistsError: pass",
  "            leaf_fd = os.open(leaf, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW, dir_fd=current_fd)",
  "        opened = os.fstat(leaf_fd)",
  "        linked = os.stat(leaf, dir_fd=current_fd, follow_symlinks=False)",
  "        assert stat.S_ISDIR(opened.st_mode) and opened.st_dev == linked.st_dev and opened.st_ino == linked.st_ino",
  "        assert_pin(leaf_fd, '/'.join(current_segments + [leaf]))",
  "        os.close(leaf_fd)",
  "        os.fsync(current_fd)",
  "    elif operation == 'ensure_dir_exclusive':",
  "        os.mkdir(leaf, 0o700, dir_fd=current_fd)",
  "        leaf_fd = os.open(leaf, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW, dir_fd=current_fd)",
  "        opened = os.fstat(leaf_fd)",
  "        linked = os.stat(leaf, dir_fd=current_fd, follow_symlinks=False)",
  "        assert stat.S_ISDIR(opened.st_mode) and opened.st_dev == linked.st_dev and opened.st_ino == linked.st_ino",
  "        os.close(leaf_fd)",
  "        os.fsync(current_fd)",
  "    elif operation == 'directory_identity':",
  "        leaf_fd = os.open(leaf, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW, dir_fd=current_fd)",
  "        opened = os.fstat(leaf_fd)",
  "        linked = os.stat(leaf, dir_fd=current_fd, follow_symlinks=False)",
  "        assert stat.S_ISDIR(opened.st_mode) and opened.st_dev == linked.st_dev and opened.st_ino == linked.st_ino",
  "        assert_pin(leaf_fd, '/'.join(current_segments + [leaf]))",
  "        sys.stdout.write(json.dumps({'device': str(opened.st_dev), 'inode': str(opened.st_ino)}, separators=(',', ':')))",
  "        os.close(leaf_fd)",
  "    elif operation == 'list_directory':",
  "        leaf_fd = os.open(leaf, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW, dir_fd=current_fd)",
  "        opened = os.fstat(leaf_fd)",
  "        linked = os.stat(leaf, dir_fd=current_fd, follow_symlinks=False)",
  "        assert stat.S_ISDIR(opened.st_mode) and opened.st_dev == linked.st_dev and opened.st_ino == linked.st_ino",
  "        assert_pin(leaf_fd, '/'.join(current_segments + [leaf]))",
  "        entries = []",
  "        for name in sorted(os.listdir(leaf_fd)):",
  "            child = os.stat(name, dir_fd=leaf_fd, follow_symlinks=False)",
  "            kind = 'directory' if stat.S_ISDIR(child.st_mode) else ('file' if stat.S_ISREG(child.st_mode) else 'other')",
  "            entries.append({'name': name, 'kind': kind})",
  "        sys.stdout.write(json.dumps(entries, separators=(',', ':')))",
  "        os.close(leaf_fd)",
  "    elif operation == 'write':",
  `        data = sys.stdin.buffer.read(${MAX_SECURE_IO_BYTES_V01 + 1})`,
  `        assert len(data) <= ${MAX_SECURE_IO_BYTES_V01}`,
  "        file_fd = os.open(leaf, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600, dir_fd=current_fd)",
  "        try:",
  "            offset = 0",
  "            while offset < len(data): offset += os.write(file_fd, data[offset:])",
  "            os.fsync(file_fd)",
  "            opened = os.fstat(file_fd)",
  "            linked = os.stat(leaf, dir_fd=current_fd, follow_symlinks=False)",
  "            assert stat.S_ISREG(opened.st_mode) and stat.S_ISREG(linked.st_mode)",
  "            assert opened.st_dev == linked.st_dev and opened.st_ino == linked.st_ino",
  "        finally:",
  "            os.close(file_fd)",
  "        os.fsync(current_fd)",
  "    elif operation == 'read':",
  "        file_fd = os.open(leaf, os.O_RDONLY | os.O_NOFOLLOW, dir_fd=current_fd)",
  "        try:",
  "            opened = os.fstat(file_fd)",
  "            linked = os.stat(leaf, dir_fd=current_fd, follow_symlinks=False)",
  `            assert stat.S_ISREG(opened.st_mode) and opened.st_size <= ${MAX_SECURE_IO_BYTES_V01}`,
  "            assert opened.st_dev == linked.st_dev and opened.st_ino == linked.st_ino",
  "            remaining = opened.st_size",
  "            while remaining > 0:",
  "                chunk = os.read(file_fd, min(65536, remaining))",
  "                if not chunk: break",
  "                sys.stdout.buffer.write(chunk)",
  "                remaining -= len(chunk)",
  "            assert remaining == 0",
  "        finally:",
  "            os.close(file_fd)",
  "    else: raise AssertionError('unknown operation')",
  "finally:",
  "    os.close(current_fd)",
].join("\n");

interface CommissionedLiveTrainingArtifactAnchorV01 {
  root: string;
  device: string;
  inode: string;
  pinned_directories: Record<string, { device: string; inode: string }>;
}

let artifactIoOneShotTestHookV01:
  | ((observation: {
      operation:
        | "ensure_dir"
        | "ensure_dir_exclusive"
        | "directory_identity"
        | "list_directory"
        | "write"
        | "read";
      repository_relative_path: string;
    }) => void)
  | null = null;

export function setCommissionedLiveTrainingArtifactIoOneShotTestHookV01(
  hook: typeof artifactIoOneShotTestHookV01,
): void {
  if (process.env.AUGNES_CANONICAL_TEST_MODE !== "1") {
    failV01("live_training_artifact_io_test_hook_refused");
  }
  if (hook !== null && artifactIoOneShotTestHookV01 !== null) {
    failV01("live_training_artifact_io_test_hook_already_set");
  }
  artifactIoOneShotTestHookV01 = hook;
}

export interface CommissionedLiveTrainingArtifactStoreInitializationV01 {
  repository_root: string;
  namespace_root: string;
  live_training_root: string;
  run_root: string;
  relative_run_root: string;
  authorization_relative_path: string;
  plan_relative_path: string;
  family_relative_path: string;
  append_only: true;
  artifact_anchor: CommissionedLiveTrainingArtifactAnchorV01;
}

export interface CommissionedLiveTrainingAuthorizationConsumptionSummaryV01 {
  consumption: CommissionedLiveTrainingAuthorizationConsumptionV01;
  primary_marker_relative_path: string;
  witness_marker_relative_path: string;
  exclusive_before_first_native_host_invocation: true;
}

export interface CommissionedLiveTrainingArtifactWriteSummaryV01 {
  relative_run_root: string;
  artifact_count: number;
  index_fingerprint: string;
  completion_witness_fingerprint: string;
  authorization_fingerprint: string;
  plan_fingerprint: string;
  append_only: true;
  holdout_artifact_count: 0;
  product_database_writes: 0;
  core_writes: 0;
  semantic_writes: 0;
  github_writes: 0;
  publication_writes: 0;
}

export interface CommissionedLiveTrainingIncompleteArtifactWriteSummaryV01 {
  relative_run_root: string;
  artifact_count: number;
  index_fingerprint: string;
  incomplete_closeout_fingerprint: string;
  authorization_fingerprint: string;
  plan_fingerprint: string;
  completion_state: "incomplete";
  cohort_aggregable: false;
  append_only: true;
}

export class CommissionedLiveTrainingArtifactStoreErrorV01 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "CommissionedLiveTrainingArtifactStoreErrorV01";
  }
}

export function initializeCommissionedLiveTrainingArtifactStoreV01(input: {
  repository_root: string;
  plan: CommissionedLiveTrainingCohortPlanV01;
  authorization: CommissionedLiveTrainingAuthorizationV01;
  family: CommissionedWorkFamilyManifestV01;
}): CommissionedLiveTrainingArtifactStoreInitializationV01 {
  assertValidCommissionedLiveTrainingCohortPlanV01(input.plan);
  assertValidCommissionedLiveTrainingAuthorizationV01(
    input.authorization,
    input.plan,
  );
  if (
    canonicalizeProtocolValueV01(
      input.authorization.source_binding.cohort_plan_ref,
    ) !== canonicalizeProtocolValueV01(
      commissionedLiveTrainingRecordRefV01(input.plan),
    ) ||
    canonicalizeProtocolValueV01(input.authorization.source_binding.family_ref) !==
      canonicalizeProtocolValueV01(commissionedWorkManifestRecordRefV01(input.family))
  ) {
    failV01("live_training_artifact_store_source_binding_invalid");
  }
  assertSafeCommissionedLiveTrainingOutputV01(input.family);
  assertSafeCommissionedLiveTrainingOutputV01(input.authorization);
  const repositoryRoot = realpathSync(input.repository_root);
  const artifactAnchor = createArtifactAnchorV01(repositoryRoot);
  const baseNamespace = resolveCommissionedWorkArtifactNamespaceV01(repositoryRoot);
  const liveTrainingRoot = path.join(
    baseNamespace,
    ...COMMISSIONED_LIVE_TRAINING_ARTIFACT_NAMESPACE_V01
      .replace(".augnes-lab/commissioned-controlled-workbench/", "")
      .split("/"),
  );
  ensureDirectoryChainWithoutSymlinksV01(artifactAnchor, liveTrainingRoot);
  const runRoot = path.join(
    liveTrainingRoot,
    safeSegmentV01(input.plan.cohort_id),
  );
  if (existsSync(runRoot)) {
    const stat = lstatSync(runRoot);
    if (stat.isSymbolicLink() || !stat.isDirectory()) {
      failV01("live_training_artifact_run_root_not_clean");
    }
    pinDirectoryChainV01(artifactAnchor, runRoot);
    if (listDirectoryEntriesV01(artifactAnchor, runRoot).length > 0) {
      failV01("live_training_artifact_run_root_not_clean");
    }
  } else {
    ensureDirectoryChainWithoutSymlinksV01(artifactAnchor, runRoot);
  }
  const familyPath = "family-manifest.json";
  const planPath = "cohort-plan.json";
  const authorizationPath = "authorization.json";
  writeCanonicalExclusiveV01(artifactAnchor, runRoot, [familyPath], input.family);
  writeCanonicalExclusiveV01(artifactAnchor, runRoot, [planPath], input.plan);
  writeCanonicalExclusiveV01(artifactAnchor, runRoot, [authorizationPath], input.authorization);
  return {
    repository_root: repositoryRoot,
    namespace_root: baseNamespace,
    live_training_root: liveTrainingRoot,
    run_root: runRoot,
    relative_run_root: path.relative(repositoryRoot, runRoot),
    authorization_relative_path: authorizationPath,
    plan_relative_path: planPath,
    family_relative_path: familyPath,
    append_only: true,
    artifact_anchor: artifactAnchor,
  };
}

export function openCommissionedLiveTrainingArtifactStoreV01(input: {
  repository_root: string;
  plan: CommissionedLiveTrainingCohortPlanV01;
  authorization: CommissionedLiveTrainingAuthorizationV01;
  family: CommissionedWorkFamilyManifestV01;
}): CommissionedLiveTrainingArtifactStoreInitializationV01 {
  assertValidCommissionedLiveTrainingCohortPlanV01(input.plan);
  assertValidCommissionedLiveTrainingAuthorizationV01(
    input.authorization,
    input.plan,
  );
  const repositoryRoot = realpathSync(input.repository_root);
  const artifactAnchor = createArtifactAnchorV01(repositoryRoot);
  const baseNamespace = resolveCommissionedWorkArtifactNamespaceV01(repositoryRoot);
  const liveTrainingRoot = path.join(
    baseNamespace,
    ...COMMISSIONED_LIVE_TRAINING_ARTIFACT_NAMESPACE_V01
      .replace(".augnes-lab/commissioned-controlled-workbench/", "")
      .split("/"),
  );
  const runRoot = path.join(liveTrainingRoot, safeSegmentV01(input.plan.cohort_id));
  assertExistingAncestorsNotSymlinksV01(baseNamespace, runRoot);
  if (!existsSync(runRoot) || !lstatSync(runRoot).isDirectory()) {
    failV01("live_training_artifact_run_root_missing");
  }
  pinDirectoryChainV01(artifactAnchor, runRoot);
  const familyPath = "family-manifest.json";
  const planPath = "cohort-plan.json";
  const authorizationPath = "authorization.json";
  if (
    readFileExactV01(artifactAnchor, resolveWithinV01(runRoot, familyPath)) !==
      canonicalizeProtocolValueV01(input.family) ||
    readFileExactV01(artifactAnchor, resolveWithinV01(runRoot, planPath)) !==
      canonicalizeProtocolValueV01(input.plan) ||
    readFileExactV01(artifactAnchor, resolveWithinV01(runRoot, authorizationPath)) !==
      canonicalizeProtocolValueV01(input.authorization)
  ) {
    failV01("live_training_artifact_preregistration_binding_invalid");
  }
  return {
    repository_root: repositoryRoot,
    namespace_root: baseNamespace,
    live_training_root: liveTrainingRoot,
    run_root: runRoot,
    relative_run_root: path.relative(repositoryRoot, runRoot),
    authorization_relative_path: authorizationPath,
    plan_relative_path: planPath,
    family_relative_path: familyPath,
    append_only: true,
    artifact_anchor: artifactAnchor,
  };
}

export function consumeCommissionedLiveTrainingAuthorizationV01(input: {
  store: CommissionedLiveTrainingArtifactStoreInitializationV01;
  authorization: CommissionedLiveTrainingAuthorizationV01;
  plan: CommissionedLiveTrainingCohortPlanV01;
  native_execution_configuration: CommissionedLiveTrainingExactNativeExecutionConfigurationV01;
  current_main_sha: string;
  current_main_tree: string;
  checkout_root_fingerprint: string;
  evaluated_at: string;
  authorization_nonce: string;
  consumer_instance_ref: CommissionedWorkRecordRefV01;
  allow_test_conformance: boolean;
  test_fail_after_primary_before_witness?: boolean;
}): CommissionedLiveTrainingAuthorizationConsumptionSummaryV01 {
  if (
    input.test_fail_after_primary_before_witness === true &&
    process.env.AUGNES_CANONICAL_TEST_MODE !== "1"
  ) {
    failV01("live_training_test_consumption_failure_injection_refused");
  }
  assertCommissionedLiveTrainingAuthorizationCurrentV01({
    authorization: input.authorization,
    plan: input.plan,
    current_main_sha: input.current_main_sha,
    current_main_tree: input.current_main_tree,
    checkout_root_fingerprint: input.checkout_root_fingerprint,
    evaluated_at: input.evaluated_at,
    native_execution_configuration: input.native_execution_configuration,
    allow_test_conformance: input.allow_test_conformance,
  });
  createCommissionedWorkRecordRefV01(input.consumer_instance_ref);
  if (
    createProtocolSha256V01(
      canonicalizeProtocolValueV01(input.authorization_nonce),
    ) !== input.authorization.authorization_nonce_fingerprint
  ) {
    failV01("live_training_authorization_nonce_mismatch");
  }
  const nonceMarkerId = input.authorization.authorization_nonce_fingerprint.slice(
    "sha256:".length,
  );
  const primaryRelativePath = path.posix.join(
    "..",
    CONSUMPTION_DIRECTORY_V01,
    safeSegmentV01(nonceMarkerId),
    "consumption.json",
  );
  const witnessRelativePath = path.posix.join(
    "authorization-consumption",
    "witness.json",
  );
  const consumptionTombstoneRoot = resolveWithinV01(
    input.store.live_training_root,
    CONSUMPTION_DIRECTORY_V01,
    safeSegmentV01(nonceMarkerId),
  );
  const primaryAbsolutePath = resolveWithinV01(
    consumptionTombstoneRoot,
    "consumption.json",
  );
  const witnessAbsolutePath = resolveWithinV01(
    input.store.run_root,
    ...witnessRelativePath.split("/"),
  );
  ensureDirectoryChainWithoutSymlinksV01(
    input.store.artifact_anchor,
    path.dirname(witnessAbsolutePath),
  );
  if (existsSync(consumptionTombstoneRoot) || existsSync(witnessAbsolutePath)) {
    failV01("live_training_authorization_replay_refused");
  }
  // The first durable effect is an exclusive non-empty-directory tombstone.
  // Deleting either ordinary marker file cannot make the nonce reusable.
  createExclusivePinnedDirectoryV01(
    input.store.artifact_anchor,
    consumptionTombstoneRoot,
  );
  const withoutIntegrity = {
    consumption_version: COMMISSIONED_LIVE_TRAINING_CONSUMPTION_VERSION_V01,
    consumption_id: `consume-${input.authorization.authorization_id}`,
    authorization_ref: commissionedLiveTrainingRecordRefV01(input.authorization),
    cohort_plan_ref: commissionedLiveTrainingRecordRefV01(input.plan),
    authorization_nonce_fingerprint:
      input.authorization.authorization_nonce_fingerprint,
    consumer_instance_ref: input.consumer_instance_ref,
    consumed_at: input.evaluated_at,
    source_revalidation_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01({
        main_sha: input.current_main_sha,
        main_tree: input.current_main_tree,
        checkout_root_fingerprint: input.checkout_root_fingerprint,
        plan_fingerprint: input.plan.integrity.fingerprint,
        family_fingerprint:
          input.authorization.source_binding.family_ref.record_fingerprint,
        native_execution_configuration_fingerprint:
          input.native_execution_configuration.configuration_fingerprint,
        evaluated_at: input.evaluated_at,
      }),
    ),
    native_execution_configuration_fingerprint:
      input.native_execution_configuration.configuration_fingerprint,
    primary_marker_relative_path: primaryRelativePath,
    witness_marker_relative_path: witnessRelativePath,
    exclusive_before_first_native_host_invocation: true as const,
    marker_created_before_first_native_host_invocation: true as const,
    replay_allowed: false as const,
  };
  const consumption: CommissionedLiveTrainingAuthorizationConsumptionV01 = {
    ...withoutIntegrity,
    integrity: createCommissionedWorkIntegrityV01(
      withoutIntegrity,
      "commissioned_live_training_authorization_consumption_without_integrity_fingerprint",
    ),
  };
  assertSafeCommissionedLiveTrainingOutputV01(consumption);
  // Primary marker is deliberately first. If the witness write fails, the
  // durable primary marker remains and the nonce can never be reused.
  try {
    writeCanonicalExclusiveAbsoluteV01(
      input.store.artifact_anchor,
      primaryAbsolutePath,
      consumption,
    );
  } catch (error) {
    if (
      error instanceof CommissionedLiveTrainingArtifactStoreErrorV01 &&
      error.code === "live_training_artifact_exclusive_write_exists"
    ) {
      failV01("live_training_authorization_replay_refused");
    }
    throw error;
  }
  if (input.test_fail_after_primary_before_witness === true) {
    failV01("live_training_test_consumption_witness_write_failed");
  }
  try {
    writeCanonicalExclusiveAbsoluteV01(
      input.store.artifact_anchor,
      witnessAbsolutePath,
      consumption,
    );
  } catch (error) {
    throw error;
  }
  return {
    consumption,
    primary_marker_relative_path: primaryRelativePath,
    witness_marker_relative_path: witnessRelativePath,
    exclusive_before_first_native_host_invocation: true,
  };
}

export function appendCommissionedLiveTrainingAttemptStartV01(input: {
  store: CommissionedLiveTrainingArtifactStoreInitializationV01;
  start: CommissionedLiveTrainingAttemptStartV01;
}): string {
  const relativePath = path.posix.join(
    "attempts",
    `${safeSegmentV01(input.start.attempt_id)}-start.json`,
  );
  assertSafeCommissionedLiveTrainingOutputV01(input.start);
  writeCanonicalExclusiveV01(
    input.store.artifact_anchor,
    input.store.run_root,
    relativePath.split("/"),
    input.start,
  );
  return relativePath;
}

export function appendCommissionedLiveTrainingAttemptAdmissionV01(input: {
  store: CommissionedLiveTrainingArtifactStoreInitializationV01;
  admission: CommissionedLiveTrainingAttemptAdmissionV01;
}): string {
  const relativePath = path.posix.join(
    "attempts",
    `${safeSegmentV01(input.admission.attempt_id)}-admission.json`,
  );
  assertSafeCommissionedLiveTrainingOutputV01(input.admission);
  writeCanonicalExclusiveV01(
    input.store.artifact_anchor,
    input.store.run_root,
    relativePath.split("/"),
    input.admission,
  );
  return relativePath;
}

export function appendCommissionedLiveTrainingAttemptTerminalV01(input: {
  store: CommissionedLiveTrainingArtifactStoreInitializationV01;
  terminal: CommissionedLiveTrainingAttemptTerminalV01;
}): string {
  const relativePath = path.posix.join(
    "attempts",
    `${safeSegmentV01(input.terminal.terminal_id)}.json`,
  );
  assertSafeCommissionedLiveTrainingOutputV01(input.terminal);
  writeCanonicalExclusiveV01(
    input.store.artifact_anchor,
    input.store.run_root,
    relativePath.split("/"),
    input.terminal,
  );
  return relativePath;
}

export function appendCommissionedLiveTrainingCompletedEpisodeV01(input: {
  store: CommissionedLiveTrainingArtifactStoreInitializationV01;
  slot_id: string;
  episode: CommissionedWorkEpisodeArtifactV01;
  blind_observation: CommissionedLiveTrainingBlindObjectiveObservationV01;
}): { episode_relative_path: string; blind_observation_relative_path: string } {
  safeSegmentV01(input.slot_id);
  assertValidCommissionedWorkEpisodeArtifactV01(input.episode);
  if (
    input.blind_observation.slot_id !== input.slot_id ||
    input.blind_observation.observation.case_id !== input.episode.case_id ||
    input.blind_observation.observation.integrity.fingerprint !==
      input.episode.objective_observation_ref.record_fingerprint
  ) {
    failV01("live_training_completed_episode_observation_binding_invalid");
  }
  assertRecordIntegrityForSlotV01(
    "blind_objective_observation",
    input.blind_observation,
  );
  const episodeRelativePath = path.posix.join(
    "episodes",
    `${input.slot_id}.json`,
  );
  const blindRelativePath = path.posix.join(
    "blind-observations",
    `${input.slot_id}.json`,
  );
  // Both source records are durable before the terminal that references them.
  writeCanonicalExclusiveV01(
    input.store.artifact_anchor,
    input.store.run_root,
    blindRelativePath.split("/"),
    input.blind_observation,
  );
  writeCanonicalExclusiveV01(
    input.store.artifact_anchor,
    input.store.run_root,
    episodeRelativePath.split("/"),
    input.episode,
  );
  return {
    episode_relative_path: episodeRelativePath,
    blind_observation_relative_path: blindRelativePath,
  };
}

export function appendCommissionedLiveTrainingPredecessorCheckpointV01(input: {
  store: CommissionedLiveTrainingArtifactStoreInitializationV01;
  slot_id: string;
  checkpoint: CommissionedWorkEpisodeCheckpointV01;
}): string {
  safeSegmentV01(input.slot_id);
  assertRecordIntegrityForSlotV01("predecessor_checkpoint", input.checkpoint);
  const relativePath = path.posix.join(
    "predecessor-checkpoints",
    `${input.slot_id}.json`,
  );
  writeCanonicalExclusiveV01(
    input.store.artifact_anchor,
    input.store.run_root,
    relativePath.split("/"),
    input.checkpoint,
  );
  return relativePath;
}

export function appendCommissionedLiveTrainingCloneSealV01(input: {
  store: CommissionedLiveTrainingArtifactStoreInitializationV01;
  seal: CommissionedLiveTrainingCloneSealV01;
}): string {
  assertRecordIntegrityForSlotV01("clone_seal", input.seal);
  const relativePath = path.posix.join(
    "clone-seals",
    `${safeSegmentV01(input.seal.case_id)}.json`,
  );
  writeCanonicalExclusiveV01(
    input.store.artifact_anchor,
    input.store.run_root,
    relativePath.split("/"),
    input.seal,
  );
  return relativePath;
}

export function writeCommissionedLiveTrainingArtifactsV01(input: {
  store: CommissionedLiveTrainingArtifactStoreInitializationV01;
  artifacts: CommissionedLiveTrainingArtifactsV01;
  test_failure_after_index_before_witness?: boolean;
}): CommissionedLiveTrainingArtifactWriteSummaryV01 {
  if (
    input.test_failure_after_index_before_witness === true &&
    process.env.AUGNES_CANONICAL_TEST_MODE !== "1"
  ) {
    failV01("live_training_test_finalization_failure_injection_refused");
  }
  assertBundleSourceBindingsV01(input.artifacts);
  assertInMemoryArtifactGraphV01(input.artifacts);
  const entries: CommissionedLiveTrainingArtifactIndexEntryV01[] = [];
  addExistingEntryV01(
    input.store,
    entries,
    "family_manifest",
    input.artifacts.family_manifest,
    "family-manifest.json",
    commissionedWorkManifestRecordRefV01(input.artifacts.family_manifest),
    null,
    null,
    null,
  );
  addExistingEntryV01(
    input.store,
    entries,
    "cohort_plan",
    input.artifacts.cohort_plan,
    "cohort-plan.json",
    commissionedLiveTrainingRecordRefV01(input.artifacts.cohort_plan),
    null,
    null,
    null,
  );
  addExistingEntryV01(
    input.store,
    entries,
    "authorization",
    input.artifacts.authorization,
    "authorization.json",
    commissionedLiveTrainingRecordRefV01(input.artifacts.authorization),
    null,
    null,
    null,
  );
  const consumptionRef = createCommissionedWorkRecordRefV01({
    record_version: input.artifacts.authorization_consumption.consumption_version,
    record_id: input.artifacts.authorization_consumption.consumption_id,
    record_fingerprint:
      input.artifacts.authorization_consumption.integrity.fingerprint,
  });
  addExistingExternalEntryV01(
    input.store,
    entries,
    "authorization_consumption_primary",
    input.artifacts.authorization_consumption,
    input.artifacts.authorization_consumption.primary_marker_relative_path,
    consumptionRef,
  );
  addExistingEntryV01(
    input.store,
    entries,
    "authorization_consumption_witness",
    input.artifacts.authorization_consumption,
    input.artifacts.authorization_consumption.witness_marker_relative_path,
    consumptionRef,
    null,
    null,
    null,
  );
  const admissionByFingerprint = new Map(
    input.artifacts.attempt_admissions.map((admission) => [
      admission.integrity.fingerprint,
      admission,
    ] as const),
  );
  const episodeSlotByFingerprint = new Map<string, string>();
  for (const terminal of input.artifacts.attempt_terminals) {
    if (terminal.episode_ref === null) continue;
    const admission = admissionByFingerprint.get(
      terminal.attempt_admission_ref.record_fingerprint,
    );
    if (!admission || admission.slot_id !== terminal.slot_id) {
      failV01("live_training_artifact_attempt_episode_binding_invalid");
    }
    episodeSlotByFingerprint.set(
      terminal.episode_ref.record_fingerprint,
      terminal.slot_id,
    );
  }
  for (const start of input.artifacts.attempt_starts) {
    addExistingEntryV01(
      input.store,
      entries,
      "attempt_start",
      start,
      path.posix.join("attempts", `${safeSegmentV01(start.attempt_id)}-start.json`),
      commissionedLiveTrainingRecordRefV01(start),
      start.slot_id,
      start.attempt_id,
      null,
    );
  }
  for (const admission of input.artifacts.attempt_admissions) {
    addExistingEntryV01(
      input.store,
      entries,
      "attempt_admission",
      admission,
      path.posix.join("attempts", `${safeSegmentV01(admission.attempt_id)}-admission.json`),
      commissionedLiveTrainingRecordRefV01(admission),
      admission.slot_id,
      admission.attempt_id,
      null,
    );
  }
  for (const terminal of input.artifacts.attempt_terminals) {
    const attemptId = terminal.terminal_id.replace(/-terminal$/u, "");
    addExistingEntryV01(
      input.store,
      entries,
      "attempt_terminal",
      terminal,
      path.posix.join("attempts", `${safeSegmentV01(terminal.terminal_id)}.json`),
      commissionedLiveTrainingRecordRefV01(terminal),
      terminal.slot_id,
      attemptId,
      null,
    );
  }
  writeIndexedV01(
    input.store,
    entries,
    "attempt_registry",
    input.artifacts.attempt_registry,
    "attempt-registry.json",
    commissionedLiveTrainingRecordRefV01(input.artifacts.attempt_registry),
    null,
    null,
    null,
  );
  for (const episode of input.artifacts.episodes) {
    const slotId = episodeSlotByFingerprint.get(episode.integrity.fingerprint);
    if (!slotId) failV01("live_training_episode_slot_identity_missing");
    addExistingEntryV01(
      input.store,
      entries,
      "episode",
      episode,
      path.posix.join("episodes", `${safeSegmentV01(slotId)}.json`),
      createCommissionedWorkRecordRefV01({
        record_version: episode.episode_version,
        record_id: episode.episode_id,
        record_fingerprint: episode.integrity.fingerprint,
      }),
      slotId,
      null,
      episode.case_id,
    );
  }
  for (const checkpoint of input.artifacts.predecessor_checkpoints) {
    const slotId = episodeSlotByFingerprint.get(
      checkpoint.predecessor_episode_ref.record_fingerprint,
    );
    if (!slotId) failV01("live_training_checkpoint_slot_identity_missing");
    addExistingEntryV01(
      input.store,
      entries,
      "predecessor_checkpoint",
      checkpoint,
      path.posix.join(
        "predecessor-checkpoints",
        `${safeSegmentV01(slotId)}.json`,
      ),
      createCommissionedWorkRecordRefV01({
        record_version: checkpoint.checkpoint_version,
        record_id: checkpoint.checkpoint_id,
        record_fingerprint: checkpoint.integrity.fingerprint,
      }),
      slotId,
      null,
      checkpoint.case_id,
    );
  }
  for (const seal of input.artifacts.clone_seals) {
    addExistingEntryV01(
      input.store,
      entries,
      "clone_seal",
      seal,
      path.posix.join("clone-seals", `${safeSegmentV01(seal.case_id)}.json`),
      commissionedLiveTrainingRecordRefV01(seal),
      null,
      null,
      seal.case_id,
    );
  }
  for (const observation of input.artifacts.blind_objective_observations) {
    addExistingEntryV01(
      input.store,
      entries,
      "blind_objective_observation",
      observation,
      path.posix.join(
        "blind-observations",
        `${safeSegmentV01(observation.slot_id)}.json`,
      ),
      commissionedLiveTrainingRecordRefV01(observation),
      observation.slot_id,
      null,
      observation.observation.case_id,
    );
  }
  for (const join of input.artifacts.analysis_joins) {
    writeIndexedV01(
      input.store,
      entries,
      "analysis_join",
      join,
      path.posix.join("analysis-joins", `${safeSegmentV01(join.slot_id)}.json`),
      commissionedLiveTrainingRecordRefV01(join),
      join.slot_id,
      null,
      null,
    );
  }
  writeIndexedV01(
    input.store,
    entries,
    "training_result",
    input.artifacts.training_result,
    "training-result.json",
    createCommissionedWorkRecordRefV01({
      record_version: input.artifacts.training_result.result_version,
      record_id: `training-${input.artifacts.cohort_plan.cohort_id}`,
      record_fingerprint: input.artifacts.training_result.integrity.fingerprint,
    }),
    null,
    null,
    null,
  );
  writeIndexedV01(
    input.store,
    entries,
    "live_training_result",
    input.artifacts.live_training_result,
    "live-training-result.json",
    commissionedLiveTrainingRecordRefV01(input.artifacts.live_training_result),
    null,
    null,
    null,
  );
  writeIndexedV01(
    input.store,
    entries,
    "candidate_assessment",
    input.artifacts.candidate_assessment,
    "training-only-candidate-assessment.json",
    commissionedLiveTrainingRecordRefV01(input.artifacts.candidate_assessment),
    null,
    null,
    null,
  );
  writeIndexedV01(
    input.store,
    entries,
    "cleanup_report",
    input.artifacts.cleanup_report,
    "cleanup-report.json",
    commissionedLiveTrainingRecordRefV01(input.artifacts.cleanup_report),
    null,
    null,
    null,
  );
  const sortedEntries = [...entries].sort((left, right) =>
    compareProtocolCodeUnitsV01(left.relative_path, right.relative_path),
  );
  if (new Set(sortedEntries.map((entry) => entry.relative_path)).size !== sortedEntries.length) {
    failV01("live_training_artifact_slot_duplicate");
  }
  const indexWithoutIntegrity = {
    index_version: COMMISSIONED_LIVE_TRAINING_ARTIFACT_INDEX_VERSION_V01,
    cohort_id: input.artifacts.cohort_plan.cohort_id,
    authorization_fingerprint: input.artifacts.authorization.integrity.fingerprint,
    cohort_plan_fingerprint: input.artifacts.cohort_plan.integrity.fingerprint,
    family_fingerprint: input.artifacts.family_manifest.integrity.fingerprint,
    append_only: true as const,
    completion_state: "complete" as const,
    complete_expected_slots: true as const,
    cohort_aggregable: true,
    expected_primary_episode_count: 15 as const,
    expected_predecessor_checkpoint_count: 3 as const,
    expected_holdout_episode_count: 0 as const,
    artifacts: sortedEntries,
    raw_prompt_persisted: false as const,
    raw_transcript_persisted: false as const,
    hidden_reasoning_persisted: false as const,
    raw_terminal_output_persisted: false as const,
    raw_provider_payload_persisted: false as const,
    credential_or_secret_persisted: false as const,
    absolute_local_path_persisted: false as const,
    production_project_content_persisted: false as const,
    synthetic_expected_write_persisted_as_executor_evidence: false as const,
    holdout_materialized: false as const,
    github_writes: 0 as const,
    product_database_writes: 0 as const,
    core_writes: 0 as const,
    semantic_writes: 0 as const,
    review_decision_writes: 0 as const,
    transition_writes: 0 as const,
    policy_activations: 0 as const,
    publication_writes: 0 as const,
  };
  const index: CommissionedLiveTrainingArtifactIndexV01 = {
    ...indexWithoutIntegrity,
    integrity: createCommissionedWorkIntegrityV01(
      indexWithoutIntegrity,
      "commissioned_live_training_artifact_index_without_integrity_fingerprint",
    ),
  };
  assertCommissionedLiveTrainingArtifactsCompleteV01({
    index,
    plan: input.artifacts.cohort_plan,
    authorization: input.artifacts.authorization,
    family: input.artifacts.family_manifest,
  });
  writeCanonicalExclusiveV01(
    input.store.artifact_anchor,
    input.store.run_root,
    [INDEX_FILE_V01],
    index,
  );
  if (input.test_failure_after_index_before_witness === true) {
    failV01("live_training_test_failure_after_completion_index_before_witness");
  }
  const completionWitnessWithoutIntegrity = {
    witness_version: COMMISSIONED_LIVE_TRAINING_COMPLETION_WITNESS_VERSION_V01,
    witness_id: `complete-${input.artifacts.cohort_plan.cohort_id}`,
    authorization_ref: commissionedLiveTrainingRecordRefV01(
      input.artifacts.authorization,
    ),
    cohort_plan_ref: commissionedLiveTrainingRecordRefV01(
      input.artifacts.cohort_plan,
    ),
    authorization_nonce_fingerprint:
      input.artifacts.authorization.authorization_nonce_fingerprint,
    artifact_index_fingerprint: index.integrity.fingerprint,
    artifact_index_content_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(index),
    ),
    completion_state: "complete" as const,
    append_only: true as const,
  };
  const completionWitness: CommissionedLiveTrainingCompletionWitnessV01 = {
    ...completionWitnessWithoutIntegrity,
    integrity: createCommissionedWorkIntegrityV01(
      completionWitnessWithoutIntegrity,
      "commissioned_live_training_completion_witness_without_integrity_fingerprint",
    ),
  };
  const completionWitnessPath = resolveWithinV01(
    input.store.live_training_root,
    COMPLETION_WITNESS_DIRECTORY_V01,
    `${safeSegmentV01(
      input.artifacts.authorization.authorization_nonce_fingerprint.slice(
        "sha256:".length,
      ),
    )}.json`,
  );
  ensureDirectoryChainWithoutSymlinksV01(
    input.store.artifact_anchor,
    path.dirname(completionWitnessPath),
  );
  writeCanonicalExclusiveAbsoluteV01(
    input.store.artifact_anchor,
    completionWitnessPath,
    completionWitness,
  );
  const validated = validateCommissionedLiveTrainingArtifactsV01({
    repository_root: input.store.repository_root,
    relative_run_root: input.store.relative_run_root,
    expected_authorization_fingerprint:
      input.artifacts.authorization.integrity.fingerprint,
    expected_plan_fingerprint: input.artifacts.cohort_plan.integrity.fingerprint,
    expected_completion_witness_fingerprint:
      completionWitness.integrity.fingerprint,
  });
  return {
    relative_run_root: input.store.relative_run_root,
    artifact_count: validated.artifacts.length + 2,
    index_fingerprint: validated.integrity.fingerprint,
    completion_witness_fingerprint:
      completionWitness.integrity.fingerprint,
    authorization_fingerprint: input.artifacts.authorization.integrity.fingerprint,
    plan_fingerprint: input.artifacts.cohort_plan.integrity.fingerprint,
    append_only: true,
    holdout_artifact_count: 0,
    product_database_writes: 0,
    core_writes: 0,
    semantic_writes: 0,
    github_writes: 0,
    publication_writes: 0,
  };
}

function assertInMemoryArtifactGraphV01(
  artifacts: CommissionedLiveTrainingArtifactsV01,
): void {
  const valuesByKind = new Map<string, unknown[]>([
    ["family_manifest", [artifacts.family_manifest]],
    ["cohort_plan", [artifacts.cohort_plan]],
    ["authorization", [artifacts.authorization]],
    ["authorization_consumption_primary", [artifacts.authorization_consumption]],
    ["authorization_consumption_witness", [artifacts.authorization_consumption]],
    ["attempt_start", artifacts.attempt_starts],
    ["attempt_admission", artifacts.attempt_admissions],
    ["attempt_terminal", artifacts.attempt_terminals],
    ["attempt_registry", [artifacts.attempt_registry]],
    ["episode", artifacts.episodes],
    ["predecessor_checkpoint", artifacts.predecessor_checkpoints],
    ["clone_seal", artifacts.clone_seals],
    ["blind_objective_observation", artifacts.blind_objective_observations],
    ["analysis_join", artifacts.analysis_joins],
    ["training_result", [artifacts.training_result]],
    ["live_training_result", [artifacts.live_training_result]],
    ["candidate_assessment", [artifacts.candidate_assessment]],
    ["cleanup_report", [artifacts.cleanup_report]],
  ]);
  assertSerializedArtifactGraphV01({
    plan: artifacts.cohort_plan,
    authorization: artifacts.authorization,
    family: artifacts.family_manifest,
    values_by_kind: valuesByKind,
  });
}

export function writeCommissionedLiveTrainingIncompleteArtifactsV01(input: {
  store: CommissionedLiveTrainingArtifactStoreInitializationV01;
  authorization: CommissionedLiveTrainingAuthorizationV01;
  authorization_consumption: CommissionedLiveTrainingAuthorizationConsumptionV01;
  plan: CommissionedLiveTrainingCohortPlanV01;
  family: CommissionedWorkFamilyManifestV01;
  cleanup_report: CommissionedLiveTrainingCleanupReportV01;
  failure_code: string;
  primary_slots_completed: number;
}): CommissionedLiveTrainingIncompleteArtifactWriteSummaryV01 {
  const persisted = readPersistedAttemptArtifactsV01(input.store);
  const completed = readPersistedCompletedEpisodeArtifactsV01(input.store);
  const completedEpisodeSlotByFingerprint = new Map<string, string>();
  for (const terminal of persisted.terminals) {
    if (terminal.episode_ref === null) continue;
    if (
      completedEpisodeSlotByFingerprint.has(
        terminal.episode_ref.record_fingerprint,
      )
    ) {
      failV01("live_training_incomplete_episode_slot_duplicate");
    }
    completedEpisodeSlotByFingerprint.set(
      terminal.episode_ref.record_fingerprint,
      terminal.slot_id,
    );
  }
  const consumptionRef = createCommissionedWorkRecordRefV01({
    record_version: input.authorization_consumption.consumption_version,
    record_id: input.authorization_consumption.consumption_id,
    record_fingerprint: input.authorization_consumption.integrity.fingerprint,
  });
  const closeout = buildCommissionedLiveTrainingIncompleteCloseoutV01({
    closeout_id: `incomplete-${input.plan.cohort_id}`,
    plan: input.plan,
    authorization: input.authorization,
    authorization_consumption_ref: consumptionRef,
    failure_code: input.failure_code,
    attempt_starts: persisted.starts,
    attempt_admissions: persisted.admissions,
    attempt_terminals: persisted.terminals,
    primary_slots_completed: input.primary_slots_completed,
    cleanup_report: input.cleanup_report,
  });
  const entries: CommissionedLiveTrainingArtifactIndexEntryV01[] = [];
  addExistingEntryV01(
    input.store,
    entries,
    "family_manifest",
    input.family,
    "family-manifest.json",
    commissionedWorkManifestRecordRefV01(input.family),
    null,
    null,
    null,
  );
  addExistingEntryV01(
    input.store,
    entries,
    "cohort_plan",
    input.plan,
    "cohort-plan.json",
    commissionedLiveTrainingRecordRefV01(input.plan),
    null,
    null,
    null,
  );
  addExistingEntryV01(
    input.store,
    entries,
    "authorization",
    input.authorization,
    "authorization.json",
    commissionedLiveTrainingRecordRefV01(input.authorization),
    null,
    null,
    null,
  );
  addExistingExternalEntryV01(
    input.store,
    entries,
    "authorization_consumption_primary",
    input.authorization_consumption,
    input.authorization_consumption.primary_marker_relative_path,
    consumptionRef,
  );
  addExistingEntryV01(
    input.store,
    entries,
    "authorization_consumption_witness",
    input.authorization_consumption,
    input.authorization_consumption.witness_marker_relative_path,
    consumptionRef,
    null,
    null,
    null,
  );
  for (const start of persisted.starts) {
    addExistingEntryV01(
      input.store,
      entries,
      "attempt_start",
      start,
      path.posix.join("attempts", `${safeSegmentV01(start.attempt_id)}-start.json`),
      commissionedLiveTrainingRecordRefV01(start),
      start.slot_id,
      start.attempt_id,
      null,
    );
  }
  for (const admission of persisted.admissions) {
    addExistingEntryV01(
      input.store,
      entries,
      "attempt_admission",
      admission,
      path.posix.join("attempts", `${safeSegmentV01(admission.attempt_id)}-admission.json`),
      commissionedLiveTrainingRecordRefV01(admission),
      admission.slot_id,
      admission.attempt_id,
      null,
    );
  }
  for (const terminal of persisted.terminals) {
    addExistingEntryV01(
      input.store,
      entries,
      "attempt_terminal",
      terminal,
      path.posix.join("attempts", `${safeSegmentV01(terminal.terminal_id)}.json`),
      commissionedLiveTrainingRecordRefV01(terminal),
      terminal.slot_id,
      terminal.terminal_id.replace(/-terminal$/u, ""),
      null,
    );
  }
  for (const episode of completed.episodes) {
    const slotId = completedEpisodeSlotByFingerprint.get(
      episode.integrity.fingerprint,
    );
    if (!slotId) failV01("live_training_episode_slot_identity_missing");
    addExistingEntryV01(
      input.store,
      entries,
      "episode",
      episode,
      path.posix.join("episodes", `${safeSegmentV01(slotId)}.json`),
      createCommissionedWorkRecordRefV01({
        record_version: episode.episode_version,
        record_id: episode.episode_id,
        record_fingerprint: episode.integrity.fingerprint,
      }),
      slotId,
      null,
      episode.case_id,
    );
  }
  for (const observation of completed.blind_observations) {
    addExistingEntryV01(
      input.store,
      entries,
      "blind_objective_observation",
      observation,
      path.posix.join(
        "blind-observations",
        `${safeSegmentV01(observation.slot_id)}.json`,
      ),
      commissionedLiveTrainingRecordRefV01(observation),
      observation.slot_id,
      null,
      observation.observation.case_id,
    );
  }
  addPersistedPartialFinalizationArtifactsV01({
    store: input.store,
    entries,
    plan: input.plan,
  });
  writeIndexedV01(
    input.store,
    entries,
    "incomplete_cleanup_report",
    input.cleanup_report,
    INCOMPLETE_CLEANUP_FILE_V01,
    commissionedLiveTrainingRecordRefV01(input.cleanup_report),
    null,
    null,
    null,
  );
  writeIndexedV01(
    input.store,
    entries,
    "incomplete_closeout",
    closeout,
    "incomplete-closeout.json",
    commissionedLiveTrainingRecordRefV01(closeout),
    null,
    null,
    null,
  );
  const sortedEntries = [...entries].sort((left, right) =>
    compareProtocolCodeUnitsV01(left.relative_path, right.relative_path),
  );
  const indexWithoutIntegrity = {
    index_version: COMMISSIONED_LIVE_TRAINING_ARTIFACT_INDEX_VERSION_V01,
    cohort_id: input.plan.cohort_id,
    authorization_fingerprint: input.authorization.integrity.fingerprint,
    cohort_plan_fingerprint: input.plan.integrity.fingerprint,
    family_fingerprint: input.family.integrity.fingerprint,
    append_only: true as const,
    completion_state: "incomplete" as const,
    complete_expected_slots: false as const,
    cohort_aggregable: false,
    expected_primary_episode_count: 15 as const,
    expected_predecessor_checkpoint_count: 3 as const,
    expected_holdout_episode_count: 0 as const,
    artifacts: sortedEntries,
    raw_prompt_persisted: false as const,
    raw_transcript_persisted: false as const,
    hidden_reasoning_persisted: false as const,
    raw_terminal_output_persisted: false as const,
    raw_provider_payload_persisted: false as const,
    credential_or_secret_persisted: false as const,
    absolute_local_path_persisted: false as const,
    production_project_content_persisted: false as const,
    synthetic_expected_write_persisted_as_executor_evidence: false as const,
    holdout_materialized: false as const,
    github_writes: 0 as const,
    product_database_writes: 0 as const,
    core_writes: 0 as const,
    semantic_writes: 0 as const,
    review_decision_writes: 0 as const,
    transition_writes: 0 as const,
    policy_activations: 0 as const,
    publication_writes: 0 as const,
  };
  const index: CommissionedLiveTrainingArtifactIndexV01 = {
    ...indexWithoutIntegrity,
    integrity: createCommissionedWorkIntegrityV01(
      indexWithoutIntegrity,
      "commissioned_live_training_artifact_index_without_integrity_fingerprint",
    ),
  };
  writeCanonicalExclusiveV01(
    input.store.artifact_anchor,
    input.store.run_root,
    [INCOMPLETE_INDEX_FILE_V01],
    index,
  );
  const validated = validateCommissionedLiveTrainingIncompleteArtifactsV01({
    repository_root: input.store.repository_root,
    relative_run_root: input.store.relative_run_root,
    expected_authorization_fingerprint: input.authorization.integrity.fingerprint,
    expected_plan_fingerprint: input.plan.integrity.fingerprint,
  });
  return {
    relative_run_root: input.store.relative_run_root,
    artifact_count: validated.artifacts.length + 1,
    index_fingerprint: validated.integrity.fingerprint,
    incomplete_closeout_fingerprint: closeout.integrity.fingerprint,
    authorization_fingerprint: input.authorization.integrity.fingerprint,
    plan_fingerprint: input.plan.integrity.fingerprint,
    completion_state: "incomplete",
    cohort_aggregable: false,
    append_only: true,
  };
}

function addPersistedPartialFinalizationArtifactsV01(input: {
  store: CommissionedLiveTrainingArtifactStoreInitializationV01;
  entries: CommissionedLiveTrainingArtifactIndexEntryV01[];
  plan: CommissionedLiveTrainingCohortPlanV01;
}): void {
  const readOptional = <T>(
    relativePath: string,
    slotKind: CommissionedLiveTrainingArtifactIndexEntryV01["slot_kind"],
    recordRef: (value: T) => CommissionedWorkRecordRefV01,
    slotId: (value: T) => string | null = () => null,
    attemptId: (value: T) => string | null = () => null,
    caseId: (value: T) => string | null = () => null,
  ): void => {
    const target = resolveWithinV01(
      input.store.run_root,
      ...relativePath.split("/"),
    );
    if (!existsSync(target)) return;
    const value = readJsonFileV01<T>(
      input.store.artifact_anchor,
      target,
      "live_training_partial_finalization_artifact_invalid",
    );
    assertRecordIntegrityForSlotV01(slotKind, value);
    addExistingEntryV01(
      input.store,
      input.entries,
      slotKind,
      value,
      relativePath,
      recordRef(value),
      slotId(value),
      attemptId(value),
      caseId(value),
    );
  };
  const readDirectory = <T>(inputDirectory: {
    directory: string;
    slot_kind: CommissionedLiveTrainingArtifactIndexEntryV01["slot_kind"];
    record_ref(value: T): CommissionedWorkRecordRefV01;
    slot_id(value: T): string | null;
    case_id(value: T): string | null;
  }): void => {
    const directory = resolveWithinV01(input.store.run_root, inputDirectory.directory);
    if (!existsSync(directory)) return;
    const stat = lstatSync(directory);
    if (stat.isSymbolicLink() || !stat.isDirectory()) {
      failV01("live_training_partial_finalization_directory_invalid");
    }
    for (const entry of listDirectoryEntriesV01(input.store.artifact_anchor, directory)) {
      const file = entry.name;
      if (entry.kind !== "file") {
        failV01("live_training_partial_finalization_file_kind_invalid");
      }
      if (!SAFE_SEGMENT_V01.test(file) || !file.endsWith(".json")) {
        failV01("live_training_partial_finalization_file_name_invalid");
      }
      readOptional<T>(
        path.posix.join(inputDirectory.directory, file),
        inputDirectory.slot_kind,
        inputDirectory.record_ref,
        inputDirectory.slot_id,
        () => null,
        inputDirectory.case_id,
      );
    }
  };
  readOptional<CommissionedLiveTrainingAttemptRegistryV01>(
    "attempt-registry.json",
    "attempt_registry",
    commissionedLiveTrainingRecordRefV01,
  );
  readDirectory<CommissionedWorkEpisodeCheckpointV01>({
    directory: "predecessor-checkpoints",
    slot_kind: "predecessor_checkpoint",
    record_ref: (checkpoint) => createCommissionedWorkRecordRefV01({
      record_version: checkpoint.checkpoint_version,
      record_id: checkpoint.checkpoint_id,
      record_fingerprint: checkpoint.integrity.fingerprint,
    }),
    slot_id: (checkpoint) =>
      input.plan.slots.find(
        (slot) =>
          slot.slot_role === "predecessor" && slot.case_id === checkpoint.case_id,
      )?.slot_id ?? null,
    case_id: (checkpoint) => checkpoint.case_id,
  });
  readDirectory<CommissionedLiveTrainingCloneSealV01>({
    directory: "clone-seals",
    slot_kind: "clone_seal",
    record_ref: commissionedLiveTrainingRecordRefV01,
    slot_id: () => null,
    case_id: (seal) => seal.case_id,
  });
  readDirectory<CommissionedLiveTrainingAnalysisJoinV01>({
    directory: "analysis-joins",
    slot_kind: "analysis_join",
    record_ref: commissionedLiveTrainingRecordRefV01,
    slot_id: (join) => join.slot_id,
    case_id: () => null,
  });
  readOptional<CommissionedWorkTrainingResultV01>(
    "training-result.json",
    "training_result",
    (result) => createCommissionedWorkRecordRefV01({
      record_version: result.result_version,
      record_id: `training-${input.plan.cohort_id}`,
      record_fingerprint: result.integrity.fingerprint,
    }),
  );
  readOptional<CommissionedLiveTrainingResultV01>(
    "live-training-result.json",
    "live_training_result",
    commissionedLiveTrainingRecordRefV01,
  );
  readOptional<CommissionedLiveTrainingCandidateAssessmentV01>(
    "training-only-candidate-assessment.json",
    "candidate_assessment",
    commissionedLiveTrainingRecordRefV01,
  );
  readOptional<CommissionedLiveTrainingCleanupReportV01>(
    "cleanup-report.json",
    "cleanup_report",
    commissionedLiveTrainingRecordRefV01,
  );
}

export function validateCommissionedLiveTrainingArtifactsV01(input: {
  repository_root: string;
  relative_run_root: string;
  expected_authorization_fingerprint: string;
  expected_plan_fingerprint: string;
  expected_completion_witness_fingerprint: string;
}): CommissionedLiveTrainingArtifactIndexV01 {
  const repositoryRoot = realpathSync(input.repository_root);
  const artifactAnchor = createArtifactAnchorV01(repositoryRoot);
  const runRoot = path.resolve(repositoryRoot, input.relative_run_root);
  assertContainedV01(repositoryRoot, runRoot);
  assertExistingAncestorsNotSymlinksV01(repositoryRoot, runRoot);
  const expectedPrefix = `${COMMISSIONED_LIVE_TRAINING_ARTIFACT_NAMESPACE_V01}/`;
  if (!path.relative(repositoryRoot, runRoot).replaceAll(path.sep, "/").startsWith(expectedPrefix)) {
    failV01("live_training_artifact_namespace_invalid");
  }
  pinDirectoryChainV01(artifactAnchor, runRoot);
  const index = readJsonFileV01<CommissionedLiveTrainingArtifactIndexV01>(
    artifactAnchor,
    resolveWithinV01(runRoot, INDEX_FILE_V01),
    "live_training_artifact_index_missing_or_invalid",
  );
  const family = readJsonFileV01<CommissionedWorkFamilyManifestV01>(
    artifactAnchor,
    resolveWithinV01(runRoot, "family-manifest.json"),
    "live_training_family_artifact_missing_or_invalid",
  );
  const plan = readJsonFileV01<CommissionedLiveTrainingCohortPlanV01>(
    artifactAnchor,
    resolveWithinV01(runRoot, "cohort-plan.json"),
    "live_training_plan_artifact_missing_or_invalid",
  );
  const authorization = readJsonFileV01<CommissionedLiveTrainingAuthorizationV01>(
    artifactAnchor,
    resolveWithinV01(runRoot, "authorization.json"),
    "live_training_authorization_artifact_missing_or_invalid",
  );
  assertRecordIntegrityForSlotV01("family_manifest", family);
  assertRecordIntegrityForSlotV01("cohort_plan", plan);
  assertRecordIntegrityForSlotV01("authorization", authorization);
  assertRecordIntegrityForSlotV01("artifact_index", index);
  const completionWitnessPath = resolveWithinV01(
    path.dirname(runRoot),
    COMPLETION_WITNESS_DIRECTORY_V01,
    `${safeSegmentV01(
      authorization.authorization_nonce_fingerprint.slice("sha256:".length),
    )}.json`,
  );
  pinDirectoryChainV01(artifactAnchor, path.dirname(completionWitnessPath));
  const completionWitness =
    readJsonFileV01<CommissionedLiveTrainingCompletionWitnessV01>(
      artifactAnchor,
      completionWitnessPath,
      "live_training_completion_witness_missing_or_invalid",
    );
  const { integrity: witnessIntegrity, ...witnessWithoutIntegrity } =
    completionWitness;
  const expectedWitnessIntegrity = createCommissionedWorkIntegrityV01(
    witnessWithoutIntegrity,
    "commissioned_live_training_completion_witness_without_integrity_fingerprint",
  );
  if (
    authorization.integrity.fingerprint !== input.expected_authorization_fingerprint ||
    plan.integrity.fingerprint !== input.expected_plan_fingerprint ||
    canonicalizeProtocolValueV01(witnessIntegrity) !==
      canonicalizeProtocolValueV01(expectedWitnessIntegrity) ||
    completionWitness.integrity.fingerprint !==
      input.expected_completion_witness_fingerprint ||
    canonicalizeProtocolValueV01(completionWitness.authorization_ref) !==
      canonicalizeProtocolValueV01(
        commissionedLiveTrainingRecordRefV01(authorization),
      ) ||
    canonicalizeProtocolValueV01(completionWitness.cohort_plan_ref) !==
      canonicalizeProtocolValueV01(
        commissionedLiveTrainingRecordRefV01(plan),
      ) ||
    completionWitness.authorization_nonce_fingerprint !==
      authorization.authorization_nonce_fingerprint ||
    completionWitness.artifact_index_fingerprint !==
      index.integrity.fingerprint ||
    completionWitness.artifact_index_content_fingerprint !==
      createProtocolSha256V01(canonicalizeProtocolValueV01(index)) ||
    completionWitness.completion_state !== "complete" ||
    completionWitness.append_only !== true
  ) {
    failV01("live_training_artifact_external_source_binding_invalid");
  }
  assertCommissionedLiveTrainingArtifactsCompleteV01({
    index,
    plan,
    authorization,
    family,
  });
  const expectedLocalFiles = [INDEX_FILE_V01];
  const valuesByKind = new Map<string, unknown[]>();
  for (const entry of index.artifacts) {
    const externalPrimary = entry.relative_path.startsWith("../");
    const target = externalPrimary
      ? resolveWithinV01(
          path.dirname(runRoot),
          ...entry.relative_path.replace(/^\.\.\//u, "").split("/"),
        )
      : resolveWithinV01(runRoot, ...entry.relative_path.split("/"));
    assertExistingAncestorsNotSymlinksV01(repositoryRoot, target);
    pinDirectoryChainV01(artifactAnchor, path.dirname(target));
    const text = readFileExactV01(artifactAnchor, target);
    if (
      createProtocolSha256V01(text) !== entry.content_fingerprint ||
      canonicalizeProtocolValueV01(JSON.parse(text)) !== text
    ) {
      failV01("live_training_artifact_content_fingerprint_invalid");
    }
    const value = JSON.parse(text) as unknown;
    assertArtifactIndexEntryCoordinatesV01({
      entry,
      value,
      plan,
      authorization,
    });
    const values = valuesByKind.get(entry.slot_kind) ?? [];
    values.push(value);
    valuesByKind.set(entry.slot_kind, values);
    assertSafeCommissionedLiveTrainingOutputV01(value);
    if (
      !value ||
      typeof value !== "object" ||
      !("integrity" in value) ||
      !value.integrity ||
      typeof value.integrity !== "object" ||
      !("fingerprint" in value.integrity) ||
      value.integrity.fingerprint !== entry.record_ref.record_fingerprint
    ) {
      failV01("live_training_artifact_record_ref_binding_invalid");
    }
    assertRecordIntegrityForSlotV01(entry.slot_kind, value);
    if (!externalPrimary) expectedLocalFiles.push(entry.relative_path);
    if (entry.slot_kind === "episode") {
      assertValidCommissionedWorkEpisodeArtifactV01(
        value as CommissionedWorkEpisodeArtifactV01,
      );
    }
  }
  assertSerializedArtifactGraphV01({
    plan,
    authorization,
    family,
    values_by_kind: valuesByKind,
  });
  const files = listFilesRecursivelyV01(artifactAnchor, runRoot).sort(compareProtocolCodeUnitsV01);
  const expectedFiles = [...new Set(expectedLocalFiles)].sort(compareProtocolCodeUnitsV01);
  if (canonicalizeProtocolValueV01(files) !== canonicalizeProtocolValueV01(expectedFiles)) {
    failV01("live_training_artifact_file_set_invalid");
  }
  return index;
}

export function validateCommissionedLiveTrainingIncompleteArtifactsV01(input: {
  repository_root: string;
  relative_run_root: string;
  expected_authorization_fingerprint: string;
  expected_plan_fingerprint: string;
}): CommissionedLiveTrainingArtifactIndexV01 {
  const repositoryRoot = realpathSync(input.repository_root);
  const artifactAnchor = createArtifactAnchorV01(repositoryRoot);
  const runRoot = path.resolve(repositoryRoot, input.relative_run_root);
  assertContainedV01(repositoryRoot, runRoot);
  assertExistingAncestorsNotSymlinksV01(repositoryRoot, runRoot);
  const expectedPrefix = `${COMMISSIONED_LIVE_TRAINING_ARTIFACT_NAMESPACE_V01}/`;
  if (!path.relative(repositoryRoot, runRoot).replaceAll(path.sep, "/").startsWith(expectedPrefix)) {
    failV01("live_training_incomplete_artifact_namespace_invalid");
  }
  pinDirectoryChainV01(artifactAnchor, runRoot);
  const index = readJsonFileV01<CommissionedLiveTrainingArtifactIndexV01>(
    artifactAnchor,
    resolveWithinV01(runRoot, INCOMPLETE_INDEX_FILE_V01),
    "live_training_incomplete_index_missing_or_invalid",
  );
  const plan = readJsonFileV01<CommissionedLiveTrainingCohortPlanV01>(
    artifactAnchor,
    resolveWithinV01(runRoot, "cohort-plan.json"),
    "live_training_incomplete_plan_missing_or_invalid",
  );
  const authorization = readJsonFileV01<CommissionedLiveTrainingAuthorizationV01>(
    artifactAnchor,
    resolveWithinV01(runRoot, "authorization.json"),
    "live_training_incomplete_authorization_missing_or_invalid",
  );
  const family = readJsonFileV01<CommissionedWorkFamilyManifestV01>(
    artifactAnchor,
    resolveWithinV01(runRoot, "family-manifest.json"),
    "live_training_incomplete_family_missing_or_invalid",
  );
  assertRecordIntegrityForSlotV01("artifact_index", index);
  assertRecordIntegrityForSlotV01("cohort_plan", plan);
  assertRecordIntegrityForSlotV01("authorization", authorization);
  assertRecordIntegrityForSlotV01("family_manifest", family);
  assertValidCommissionedLiveTrainingCohortPlanV01(plan);
  assertValidCommissionedLiveTrainingAuthorizationV01(authorization, plan);
  if (
    index.completion_state !== "incomplete" ||
    index.complete_expected_slots !== false ||
    index.cohort_aggregable !== false ||
    index.authorization_fingerprint !== input.expected_authorization_fingerprint ||
    index.cohort_plan_fingerprint !== input.expected_plan_fingerprint ||
    index.family_fingerprint !== family.integrity.fingerprint ||
    authorization.integrity.fingerprint !== input.expected_authorization_fingerprint ||
    plan.integrity.fingerprint !== input.expected_plan_fingerprint ||
    canonicalizeProtocolValueV01(plan.family_ref) !==
      canonicalizeProtocolValueV01(commissionedWorkManifestRecordRefV01(family)) ||
    canonicalizeProtocolValueV01(authorization.source_binding.family_ref) !==
      canonicalizeProtocolValueV01(commissionedWorkManifestRecordRefV01(family))
  ) {
    failV01("live_training_incomplete_index_source_binding_invalid");
  }
  const completionWitnessPath = resolveWithinV01(
    path.dirname(runRoot),
    COMPLETION_WITNESS_DIRECTORY_V01,
    `${safeSegmentV01(
      authorization.authorization_nonce_fingerprint.slice("sha256:".length),
    )}.json`,
  );
  if (existsSync(completionWitnessPath)) {
    failV01("live_training_incomplete_completion_witness_forbidden");
  }
  const expectedLocalFiles = [INCOMPLETE_INDEX_FILE_V01];
  const valuesByKind = new Map<string, unknown[]>();
  for (const entry of index.artifacts) {
    const externalPrimary = entry.relative_path.startsWith("../");
    const target = externalPrimary
      ? resolveWithinV01(
          path.dirname(runRoot),
          ...entry.relative_path.replace(/^\.\.\//u, "").split("/"),
        )
      : resolveWithinV01(runRoot, ...entry.relative_path.split("/"));
    pinDirectoryChainV01(artifactAnchor, path.dirname(target));
    const text = readFileExactV01(artifactAnchor, target);
    if (
      createProtocolSha256V01(text) !== entry.content_fingerprint ||
      canonicalizeProtocolValueV01(JSON.parse(text)) !== text
    ) {
      failV01("live_training_incomplete_artifact_content_invalid");
    }
    const value = JSON.parse(text) as unknown;
    assertArtifactIndexEntryCoordinatesV01({
      entry,
      value,
      plan,
      authorization,
    });
    assertSafeCommissionedLiveTrainingOutputV01(value);
    assertRecordIntegrityForSlotV01(entry.slot_kind, value);
    if (
      !value ||
      typeof value !== "object" ||
      !("integrity" in value) ||
      !value.integrity ||
      typeof value.integrity !== "object" ||
      !("fingerprint" in value.integrity) ||
      value.integrity.fingerprint !== entry.record_ref.record_fingerprint
    ) {
      failV01("live_training_incomplete_artifact_ref_invalid");
    }
    const values = valuesByKind.get(entry.slot_kind) ?? [];
    values.push(value);
    valuesByKind.set(entry.slot_kind, values);
    if (!externalPrimary) expectedLocalFiles.push(entry.relative_path);
  }
  assertSerializedIncompleteArtifactGraphV01({
    plan,
    authorization,
    family,
    values_by_kind: valuesByKind,
  });
  const partialCompletionIndexPath = resolveWithinV01(runRoot, INDEX_FILE_V01);
  if (existsSync(partialCompletionIndexPath)) {
    const partialCompletionIndex =
      readJsonFileV01<CommissionedLiveTrainingArtifactIndexV01>(
        artifactAnchor,
        partialCompletionIndexPath,
        "live_training_partial_completion_index_invalid",
      );
    assertRecordIntegrityForSlotV01("artifact_index", partialCompletionIndex);
    assertCommissionedLiveTrainingArtifactsCompleteV01({
      index: partialCompletionIndex,
      plan,
      authorization,
      family,
    });
    const indexedCompletionEntries = index.artifacts.filter(
      (entry) =>
        entry.slot_kind !== "incomplete_cleanup_report" &&
        entry.slot_kind !== "incomplete_closeout",
    );
    if (
      canonicalizeProtocolValueV01(partialCompletionIndex.artifacts) !==
        canonicalizeProtocolValueV01(indexedCompletionEntries)
    ) {
      failV01("live_training_partial_completion_index_graph_invalid");
    }
    assertSerializedArtifactGraphV01({
      plan,
      authorization,
      family,
      values_by_kind: valuesByKind,
    });
    expectedLocalFiles.push(INDEX_FILE_V01);
  } else {
    assertPartialSerializedArtifactGraphV01({
      plan,
      authorization,
      family,
      values_by_kind: valuesByKind,
    });
  }
  const files = listFilesRecursivelyV01(artifactAnchor, runRoot).sort(compareProtocolCodeUnitsV01);
  const expectedFiles = [...new Set(expectedLocalFiles)].sort(compareProtocolCodeUnitsV01);
  if (canonicalizeProtocolValueV01(files) !== canonicalizeProtocolValueV01(expectedFiles)) {
    failV01("live_training_incomplete_artifact_file_set_invalid");
  }
  return index;
}

function assertSerializedAttemptSourceRelationsV01(input: {
  plan: CommissionedLiveTrainingCohortPlanV01;
  authorization: CommissionedLiveTrainingAuthorizationV01;
  consumption: CommissionedLiveTrainingAuthorizationConsumptionV01;
  starts: readonly CommissionedLiveTrainingAttemptStartV01[];
  admissions: readonly CommissionedLiveTrainingAttemptAdmissionV01[];
  terminals: readonly CommissionedLiveTrainingAttemptTerminalV01[];
  episodes: readonly CommissionedWorkEpisodeArtifactV01[];
  blinds: readonly CommissionedLiveTrainingBlindObjectiveObservationV01[];
  checkpoints: readonly CommissionedWorkEpisodeCheckpointV01[];
  clone_seals: readonly CommissionedLiveTrainingCloneSealV01[];
}): void {
  const sameRef = (
    left: CommissionedWorkRecordRefV01 | null,
    right: CommissionedWorkRecordRefV01 | null,
  ): boolean =>
    canonicalizeProtocolValueV01(left) === canonicalizeProtocolValueV01(right);
  const planRef = commissionedLiveTrainingRecordRefV01(input.plan);
  const consumptionRef = createCommissionedWorkRecordRefV01({
    record_version: input.consumption.consumption_version,
    record_id: input.consumption.consumption_id,
    record_fingerprint: input.consumption.integrity.fingerprint,
  });
  const orderedStarts = [...input.starts].sort(
    (left, right) =>
      left.reserved_native_host_invocation_ordinal -
      right.reserved_native_host_invocation_ordinal,
  );
  let nextPrimaryIndex = 0;
  const primaryStartBySlot = new Map<string, CommissionedLiveTrainingAttemptStartV01>();
  const replacementStartBySlot = new Map<string, CommissionedLiveTrainingAttemptStartV01>();
  for (const [index, start] of orderedStarts.entries()) {
    if (start.reserved_native_host_invocation_ordinal !== index + 1) {
      failV01("live_training_artifact_attempt_order_invalid");
    }
    const slot = input.plan.slots.find((candidate) => candidate.slot_id === start.slot_id);
    if (!slot || start.clone_baseline.slot_id !== slot.slot_id) {
      failV01("live_training_artifact_attempt_slot_source_invalid");
    }
    assertCommissionedLiveTrainingAttemptStartReservationV01({
      authorization: input.authorization,
      start,
    });
    if (
      !sameRef(start.authorization_consumption_ref, consumptionRef) ||
      !sameRef(start.cohort_plan_ref, planRef) ||
      start.native_execution_configuration_fingerprint !==
        input.authorization.native_execution_configuration.configuration_fingerprint ||
      start.adapter_execution_binding_fingerprint !==
        createCommissionedLiveTrainingAdapterBindingV01(
          input.authorization.native_execution_configuration,
        ).binding_fingerprint
    ) {
      failV01("live_training_artifact_attempt_authorization_source_invalid");
    }
    if (start.attempt_kind === "primary") {
      const expectedSlot = input.plan.slots[nextPrimaryIndex];
      if (
        !expectedSlot ||
        expectedSlot.slot_id !== slot.slot_id ||
        start.attempt_id !== slot.primary_attempt_id ||
        canonicalizeProtocolValueV01(start.executor_role_ref) !==
          canonicalizeProtocolValueV01(slot.executor_role_ref) ||
        primaryStartBySlot.has(slot.slot_id)
      ) {
        failV01("live_training_artifact_primary_attempt_schedule_invalid");
      }
      primaryStartBySlot.set(slot.slot_id, start);
      nextPrimaryIndex += 1;
    } else {
      const previous = orderedStarts[index - 1];
      if (
        !slot.replacement_allowed ||
        !previous ||
        previous.slot_id !== slot.slot_id ||
        previous.attempt_kind !== "primary" ||
        replacementStartBySlot.has(slot.slot_id) ||
        canonicalizeProtocolValueV01(start.executor_role_ref) ===
          canonicalizeProtocolValueV01(slot.executor_role_ref)
      ) {
        failV01("live_training_artifact_replacement_attempt_schedule_invalid");
      }
      replacementStartBySlot.set(slot.slot_id, start);
    }
  }
  const startByFingerprint = new Map(
    input.starts.map((start) => [start.integrity.fingerprint, start] as const),
  );
  const admissionByFingerprint = new Map(
    input.admissions.map((admission) => [admission.integrity.fingerprint, admission] as const),
  );
  const terminalByAdmission = new Map(
    input.terminals.map((terminal) => [
      terminal.attempt_admission_ref.record_fingerprint,
      terminal,
    ] as const),
  );
  const episodeByFingerprint = new Map(
    input.episodes.map((episode) => [episode.integrity.fingerprint, episode] as const),
  );
  const blindByFingerprint = new Map(
    input.blinds.map((blind) => [blind.integrity.fingerprint, blind] as const),
  );
  if (
    startByFingerprint.size !== input.starts.length ||
    admissionByFingerprint.size !== input.admissions.length ||
    terminalByAdmission.size !== input.terminals.length
  ) {
    failV01("live_training_artifact_attempt_source_duplicate");
  }
  if (input.admissions.length > 1) {
    assertCommissionedLiveTrainingAttemptIdentitiesDistinctV01(input.admissions);
  }
  for (const admission of input.admissions) {
    const start = startByFingerprint.get(admission.attempt_start_ref.record_fingerprint);
    const slot = input.plan.slots.find((candidate) => candidate.slot_id === admission.slot_id);
    if (
      !start ||
      !slot ||
      start.attempt_id !== admission.attempt_id ||
      start.slot_id !== admission.slot_id ||
      start.attempt_kind !== admission.attempt_kind ||
      canonicalizeProtocolValueV01(start.executor_role_ref) !==
        canonicalizeProtocolValueV01(admission.executor_role_ref) ||
      canonicalizeProtocolValueV01(start.clone_baseline) !==
        canonicalizeProtocolValueV01(admission.clone_baseline) ||
      start.request_ref_fingerprint !== admission.request_ref_fingerprint ||
      start.run_ref_fingerprint !== admission.run_ref_fingerprint ||
      start.native_execution_configuration_fingerprint !==
        admission.native_execution_configuration_fingerprint ||
      start.adapter_execution_binding_fingerprint !==
        admission.adapter_execution_binding_fingerprint ||
      !sameRef(
        admission.attempt_start_ref,
        commissionedLiveTrainingRecordRefV01(start),
      ) ||
      !sameRef(admission.authorization_consumption_ref, consumptionRef) ||
      !sameRef(admission.cohort_plan_ref, planRef) ||
      createProtocolSha256V01(
        canonicalizeProtocolValueV01(admission.host_ref_set),
      ) !== admission.host_context_fingerprint ||
      admission.clone_identity_fingerprint !==
        admission.clone_baseline.clone_identity_fingerprint
    ) {
      failV01("live_training_artifact_attempt_admission_source_invalid");
    }
    if (admission.attempt_kind === "primary") {
      if (
        admission.replacement_of_attempt_ref !== null ||
        admission.attempt_id !== slot.primary_attempt_id ||
        canonicalizeProtocolValueV01(admission.executor_role_ref) !==
          canonicalizeProtocolValueV01(slot.executor_role_ref)
      ) {
        failV01("live_training_artifact_primary_admission_source_invalid");
      }
    } else {
      const original = admission.replacement_of_attempt_ref === null
        ? undefined
        : admissionByFingerprint.get(
            admission.replacement_of_attempt_ref.record_fingerprint,
          );
      const originalTerminal = original
        ? terminalByAdmission.get(original.integrity.fingerprint)
        : undefined;
      if (
        !original ||
        !sameRef(
          admission.replacement_of_attempt_ref,
          commissionedLiveTrainingRecordRefV01(original),
        ) ||
        original.slot_id !== admission.slot_id ||
        original.attempt_kind !== "primary" ||
        !originalTerminal ||
        !originalTerminal.replacement_eligible ||
        canonicalizeProtocolValueV01(original.executor_role_ref) ===
          canonicalizeProtocolValueV01(admission.executor_role_ref) ||
        original.clone_baseline.slot_id !== admission.clone_baseline.slot_id ||
        original.clone_baseline.initial_head !==
          admission.clone_baseline.initial_head ||
        original.clone_baseline.initial_tree !==
          admission.clone_baseline.initial_tree ||
        original.clone_baseline.clean_worktree_content_fingerprint !==
          admission.clone_baseline.clean_worktree_content_fingerprint ||
        original.clone_baseline.current_source_fingerprint !==
          admission.clone_baseline.current_source_fingerprint ||
        original.clone_baseline.common_request_fingerprint !==
          admission.clone_baseline.common_request_fingerprint ||
        original.clone_baseline.clone_identity_fingerprint ===
          admission.clone_baseline.clone_identity_fingerprint ||
        original.clone_baseline.root_scope_fingerprint ===
          admission.clone_baseline.root_scope_fingerprint
      ) {
        failV01("live_training_artifact_replacement_admission_source_invalid");
      }
    }
  }
  const cloneSealByCase = new Map(
    input.clone_seals.map((seal) => [seal.case_id, seal] as const),
  );
  const predecessorEpisodes = input.episodes.filter(
    (episode) => episode.episode_role === "predecessor",
  );
  const predecessorByCase = new Map(
    predecessorEpisodes.map((episode) => [episode.case_id, episode] as const),
  );
  const checkpointByCase = new Map(
    input.checkpoints.map((checkpoint) => [checkpoint.case_id, checkpoint] as const),
  );
  if (
    predecessorByCase.size !== predecessorEpisodes.length ||
    checkpointByCase.size !== input.checkpoints.length ||
    cloneSealByCase.size !== input.clone_seals.length
  ) {
    failV01("live_training_artifact_case_source_duplicate");
  }
  for (const checkpoint of input.checkpoints) {
    const predecessor = predecessorByCase.get(checkpoint.case_id);
    if (
      !predecessor ||
      !sameRef(
        checkpoint.predecessor_episode_ref,
        createCommissionedWorkRecordRefV01({
          record_version: predecessor.episode_version,
          record_id: predecessor.episode_id,
          record_fingerprint: predecessor.integrity.fingerprint,
        }),
      )
    ) {
      failV01("live_training_artifact_checkpoint_predecessor_source_invalid");
    }
  }
  for (const seal of input.clone_seals) {
    const checkpoint = checkpointByCase.get(seal.case_id);
    if (
      !checkpoint ||
      !sameRef(
        seal.predecessor_checkpoint_ref,
        createCommissionedWorkRecordRefV01({
          record_version: checkpoint.checkpoint_version,
          record_id: checkpoint.checkpoint_id,
          record_fingerprint: checkpoint.integrity.fingerprint,
        }),
      )
    ) {
      failV01("live_training_artifact_clone_checkpoint_source_invalid");
    }
  }
  for (const terminal of input.terminals) {
    const admission = admissionByFingerprint.get(
      terminal.attempt_admission_ref.record_fingerprint,
    );
    if (
      !admission ||
      !sameRef(
        terminal.attempt_admission_ref,
        commissionedLiveTrainingRecordRefV01(admission),
      ) ||
      terminal.slot_id !== admission.slot_id ||
      terminal.terminal_id !== `${admission.attempt_id}-terminal`
    ) {
      failV01("live_training_artifact_terminal_admission_source_invalid");
    }
    if (!terminal.aggregable) continue;
    const slot = input.plan.slots.find((candidate) => candidate.slot_id === terminal.slot_id);
    const episode = terminal.episode_ref === null
      ? undefined
      : episodeByFingerprint.get(terminal.episode_ref.record_fingerprint);
    const blind = terminal.blind_observation_ref === null
      ? undefined
      : blindByFingerprint.get(terminal.blind_observation_ref.record_fingerprint);
    if (
      !slot ||
      !episode ||
      !blind ||
      !sameRef(
        terminal.episode_ref,
        createCommissionedWorkRecordRefV01({
          record_version: episode.episode_version,
          record_id: episode.episode_id,
          record_fingerprint: episode.integrity.fingerprint,
        }),
      ) ||
      !sameRef(
        terminal.blind_observation_ref,
        commissionedLiveTrainingRecordRefV01(blind),
      ) ||
      canonicalizeProtocolValueV01(episode.evaluation.executor_role) !==
        canonicalizeProtocolValueV01(admission.executor_role_ref) ||
      episode.execution_binding.run_ref_fingerprint !== admission.run_ref_fingerprint ||
      episode.execution_binding.native_host_request_fingerprint !==
        admission.request_ref_fingerprint ||
      episode.execution_binding.native_host_result_fingerprint !==
        admission.native_host_result_fingerprint ||
      episode.execution_binding.host_ref_set_fingerprint !==
        admission.host_context_fingerprint ||
      canonicalizeProtocolValueV01(episode.execution_binding.host_ref_set) !==
        canonicalizeProtocolValueV01(admission.host_ref_set) ||
      episode.evaluation.host_ref_set_fingerprint !== admission.host_context_fingerprint ||
      episode.repository_state.episode_start_commit !==
        admission.clone_baseline.initial_head ||
      episode.repository_state.episode_start_tree !==
        admission.clone_baseline.initial_tree ||
      blind.slot_id !== slot.slot_id ||
      blind.observation.integrity.fingerprint !==
        episode.objective_observation_ref.record_fingerprint
    ) {
      failV01("live_training_artifact_episode_native_or_clone_source_invalid");
    }
    if (slot.slot_role === "cold_successor") {
      const seal = cloneSealByCase.get(slot.case_id);
      const baseline = seal?.clone_baselines.find(
        (candidate) => candidate.slot_id === slot.slot_id,
      );
      const predecessor = predecessorByCase.get(slot.case_id);
      const checkpoint = checkpointByCase.get(slot.case_id);
      if (
        !seal ||
        !baseline ||
        !predecessor ||
        !checkpoint ||
        (admission.attempt_kind === "primary" &&
          canonicalizeProtocolValueV01(baseline) !==
            canonicalizeProtocolValueV01(admission.clone_baseline)) ||
        !sameRef(
          episode.predecessor_episode_ref,
          createCommissionedWorkRecordRefV01({
            record_version: predecessor.episode_version,
            record_id: predecessor.episode_id,
            record_fingerprint: predecessor.integrity.fingerprint,
          }),
        ) ||
        !sameRef(
          episode.episode_checkpoint_ref,
          createCommissionedWorkRecordRefV01({
            record_version: checkpoint.checkpoint_version,
            record_id: checkpoint.checkpoint_id,
            record_fingerprint: checkpoint.integrity.fingerprint,
          }),
        ) ||
        episode.episode_origin.origin_kind !== "cold_successor" ||
        !sameRef(
          episode.episode_origin.predecessor_episode_ref,
          episode.predecessor_episode_ref,
        ) ||
        !sameRef(
          episode.episode_origin.predecessor_checkpoint_ref,
          episode.episode_checkpoint_ref,
        )
      ) {
        failV01("live_training_artifact_clone_seal_admission_source_invalid");
      }
    }
    const resourceBinding = episode.execution_binding.binding_kind === "commissioned_agent"
      ? episode.execution_binding.resource_binding
      : null;
    if (resourceBinding === null) {
      failV01("live_training_artifact_episode_resource_source_invalid");
    }
    if (input.authorization.authorization_kind === "test_conformance") {
      if (
        resourceBinding.live_authorization_ref !== null ||
        resourceBinding.authorization_resource_ceiling !== null ||
        resourceBinding.provider_ref !== null ||
        resourceBinding.model_ref !== null ||
        resourceBinding.route_ref !== null ||
        resourceBinding.network_destination_ref !== null
      ) {
        failV01("live_training_artifact_episode_resource_source_invalid");
      }
    } else {
      const ceiling = resourceBinding.authorization_resource_ceiling;
      if (
        canonicalizeProtocolValueV01(resourceBinding.live_authorization_ref) !==
          canonicalizeProtocolValueV01(
            commissionedLiveTrainingRecordRefV01(input.authorization),
          ) ||
        !ceiling ||
        ceiling.provider_call_limit !== input.authorization.provider_call_limit ||
        ceiling.model_call_limit !== input.authorization.model_call_limit ||
        ceiling.external_network_call_limit !== 0 ||
        !sameRef(
          resourceBinding.provider_ref,
          input.authorization.native_execution_configuration.provider_ref,
        ) ||
        !sameRef(
          resourceBinding.model_ref,
          input.authorization.native_execution_configuration.model_ref,
        ) ||
        !sameRef(
          resourceBinding.route_ref,
          input.authorization.native_execution_configuration.route_ref,
        ) ||
        resourceBinding.network_destination_ref !== null
      ) {
        failV01("live_training_artifact_episode_resource_source_invalid");
      }
    }
  }
}

function assertSerializedIncompleteArtifactGraphV01(input: {
  plan: CommissionedLiveTrainingCohortPlanV01;
  authorization: CommissionedLiveTrainingAuthorizationV01;
  family: CommissionedWorkFamilyManifestV01;
  values_by_kind: Map<string, unknown[]>;
}): void {
  const starts = (input.values_by_kind.get("attempt_start") ?? []) as
    CommissionedLiveTrainingAttemptStartV01[];
  const admissions = (input.values_by_kind.get("attempt_admission") ?? []) as
    CommissionedLiveTrainingAttemptAdmissionV01[];
  const terminals = (input.values_by_kind.get("attempt_terminal") ?? []) as
    CommissionedLiveTrainingAttemptTerminalV01[];
  const closeouts = (input.values_by_kind.get("incomplete_closeout") ?? []) as
    CommissionedLiveTrainingIncompleteCloseoutV01[];
  const cleanups = (input.values_by_kind.get("incomplete_cleanup_report") ?? []) as
    CommissionedLiveTrainingCleanupReportV01[];
  const consumptions = (
    input.values_by_kind.get("authorization_consumption_primary") ?? []
  ) as CommissionedLiveTrainingAuthorizationConsumptionV01[];
  const consumptionWitnesses = (
    input.values_by_kind.get("authorization_consumption_witness") ?? []
  ) as CommissionedLiveTrainingAuthorizationConsumptionV01[];
  const episodes = (input.values_by_kind.get("episode") ?? []) as
    CommissionedWorkEpisodeArtifactV01[];
  const blinds = (input.values_by_kind.get("blind_objective_observation") ?? []) as
    CommissionedLiveTrainingBlindObjectiveObservationV01[];
  const checkpoints = (input.values_by_kind.get("predecessor_checkpoint") ?? []) as
    CommissionedWorkEpisodeCheckpointV01[];
  const cloneSeals = (input.values_by_kind.get("clone_seal") ?? []) as
    CommissionedLiveTrainingCloneSealV01[];
  if (
    closeouts.length !== 1 ||
    cleanups.length !== 1 ||
    consumptions.length !== 1 ||
    consumptionWitnesses.length !== 1
  ) {
    failV01("live_training_incomplete_artifact_graph_count_invalid");
  }
  const closeout = closeouts[0]!;
  const cleanup = cleanups[0]!;
  const consumption = consumptions[0]!;
  const sortRefs = (refs: CommissionedWorkRecordRefV01[]): CommissionedWorkRecordRefV01[] =>
    [...refs].sort((left, right) =>
      compareProtocolCodeUnitsV01(
        canonicalizeProtocolValueV01(left),
        canonicalizeProtocolValueV01(right),
      ),
    );
  const exactRefSet = (
    values: Parameters<typeof commissionedLiveTrainingRecordRefV01>[0][],
  ): CommissionedWorkRecordRefV01[] =>
    sortRefs(values.map((value) => commissionedLiveTrainingRecordRefV01(value)));
  const recorded = (refs: CommissionedWorkRecordRefV01[]): CommissionedWorkRecordRefV01[] =>
    sortRefs(refs);
  const startByFingerprint = new Map(
    starts.map((start) => [start.integrity.fingerprint, start] as const),
  );
  const admissionByFingerprint = new Map(
    admissions.map((admission) => [admission.integrity.fingerprint, admission] as const),
  );
  const episodeByFingerprint = new Map(
    episodes.map((episode) => [episode.integrity.fingerprint, episode] as const),
  );
  const blindByFingerprint = new Map(
    blinds.map((blind) => [blind.integrity.fingerprint, blind] as const),
  );
  if (
    startByFingerprint.size !== starts.length ||
    admissionByFingerprint.size !== admissions.length ||
    episodeByFingerprint.size !== episodes.length ||
    blindByFingerprint.size !== blinds.length ||
    canonicalizeProtocolValueV01(consumptionWitnesses[0]) !==
      canonicalizeProtocolValueV01(consumption) ||
    canonicalizeProtocolValueV01(consumption.authorization_ref) !==
      canonicalizeProtocolValueV01(
        commissionedLiveTrainingRecordRefV01(input.authorization),
      ) ||
    canonicalizeProtocolValueV01(consumption.cohort_plan_ref) !==
      canonicalizeProtocolValueV01(
        commissionedLiveTrainingRecordRefV01(input.plan),
      ) ||
    consumption.native_execution_configuration_fingerprint !==
      input.authorization.native_execution_configuration.configuration_fingerprint ||
    consumption.authorization_nonce_fingerprint !==
      input.authorization.authorization_nonce_fingerprint
  ) {
    failV01("live_training_incomplete_source_graph_invalid");
  }
  assertSerializedAttemptSourceRelationsV01({
    plan: input.plan,
    authorization: input.authorization,
    consumption,
    starts,
    admissions,
    terminals,
    episodes,
    blinds,
    checkpoints,
    clone_seals: cloneSeals,
  });
  const terminalByAdmission = new Map(
    terminals.map((terminal) => [
      terminal.attempt_admission_ref.record_fingerprint,
      terminal,
    ] as const),
  );
  if (terminalByAdmission.size !== terminals.length) {
    failV01("live_training_incomplete_terminal_duplicate");
  }
  for (const start of starts) {
    const rebuilt = buildCommissionedLiveTrainingAttemptStartV01({
      attempt_start_id: start.attempt_start_id,
      attempt_id: start.attempt_id,
      slot_id: start.slot_id,
      attempt_kind: start.attempt_kind,
      authorization_consumption_ref: start.authorization_consumption_ref,
      cohort_plan_ref: start.cohort_plan_ref,
      executor_role_ref: start.executor_role_ref,
      request_ref_fingerprint: start.request_ref_fingerprint,
      run_ref_fingerprint: start.run_ref_fingerprint,
      native_execution_configuration_fingerprint:
        start.native_execution_configuration_fingerprint,
      adapter_execution_binding_fingerprint:
        start.adapter_execution_binding_fingerprint,
      clone_baseline: start.clone_baseline,
      reserved_native_host_invocation_ordinal:
        start.reserved_native_host_invocation_ordinal,
      provider_bearing_invocation_reserved:
        start.provider_bearing_invocation_reserved,
      model_bearing_invocation_reserved: start.model_bearing_invocation_reserved,
      started_at: start.started_at,
    });
    if (
      canonicalizeProtocolValueV01(rebuilt) !== canonicalizeProtocolValueV01(start) ||
      start.authorization_consumption_ref.record_fingerprint !==
        consumption.integrity.fingerprint ||
      start.cohort_plan_ref.record_fingerprint !== input.plan.integrity.fingerprint ||
      start.native_execution_configuration_fingerprint !==
        input.authorization.native_execution_configuration.configuration_fingerprint ||
      start.adapter_execution_binding_fingerprint !==
        createCommissionedLiveTrainingAdapterBindingV01(
          input.authorization.native_execution_configuration,
        ).binding_fingerprint
    ) {
      failV01("live_training_incomplete_attempt_start_graph_invalid");
    }
  }
  for (const admission of admissions) {
    const start = startByFingerprint.get(
      admission.attempt_start_ref.record_fingerprint,
    );
    const rebuilt = buildCommissionedLiveTrainingAttemptAdmissionV01({
      attempt_id: admission.attempt_id,
      slot_id: admission.slot_id,
      attempt_kind: admission.attempt_kind,
      replacement_of_attempt_ref: admission.replacement_of_attempt_ref,
      attempt_start_ref: admission.attempt_start_ref,
      authorization_consumption_ref: admission.authorization_consumption_ref,
      cohort_plan_ref: admission.cohort_plan_ref,
      executor_role_ref: admission.executor_role_ref,
      run_ref_fingerprint: admission.run_ref_fingerprint,
      request_ref_fingerprint: admission.request_ref_fingerprint,
      host_ref_set: admission.host_ref_set,
      host_context_fingerprint: admission.host_context_fingerprint,
      native_execution_configuration_fingerprint:
        admission.native_execution_configuration_fingerprint,
      adapter_execution_binding_fingerprint:
        admission.adapter_execution_binding_fingerprint,
      native_host_result_fingerprint: admission.native_host_result_fingerprint,
      clone_identity_fingerprint: admission.clone_identity_fingerprint,
      clone_baseline: admission.clone_baseline,
      admitted_at: admission.admitted_at,
    });
    if (
      !start ||
      canonicalizeProtocolValueV01(rebuilt) !== canonicalizeProtocolValueV01(admission) ||
      start.attempt_id !== admission.attempt_id ||
      start.slot_id !== admission.slot_id ||
      start.request_ref_fingerprint !== admission.request_ref_fingerprint ||
      start.run_ref_fingerprint !== admission.run_ref_fingerprint ||
      start.native_execution_configuration_fingerprint !==
        admission.native_execution_configuration_fingerprint ||
      start.adapter_execution_binding_fingerprint !==
        admission.adapter_execution_binding_fingerprint ||
      start.clone_baseline.clone_identity_fingerprint !==
        admission.clone_identity_fingerprint
    ) {
      failV01("live_training_incomplete_attempt_admission_graph_invalid");
    }
  }
  for (const terminal of terminals) {
    const rebuilt = buildCommissionedLiveTrainingAttemptTerminalV01({
      terminal_id: terminal.terminal_id,
      attempt_admission_ref: terminal.attempt_admission_ref,
      slot_id: terminal.slot_id,
      terminal_status: terminal.terminal_status,
      failure_class: terminal.failure_class,
      first_meaningful_action_status: terminal.first_meaningful_action_status,
      repository_mutation_status: terminal.repository_mutation_status,
      native_host_settled: terminal.native_host_settled,
      cleanup_complete: terminal.cleanup_complete,
      episode_ref: terminal.episode_ref,
      blind_observation_ref: terminal.blind_observation_ref,
      finished_at: terminal.finished_at,
    });
    if (
      !admissionByFingerprint.has(
        terminal.attempt_admission_ref.record_fingerprint,
      ) ||
      canonicalizeProtocolValueV01(rebuilt) !== canonicalizeProtocolValueV01(terminal)
    ) {
      failV01("live_training_incomplete_attempt_terminal_graph_invalid");
    }
    if (terminal.aggregable) {
      const episode = terminal.episode_ref === null
        ? undefined
        : episodeByFingerprint.get(terminal.episode_ref.record_fingerprint);
      const blind = terminal.blind_observation_ref === null
        ? undefined
        : blindByFingerprint.get(terminal.blind_observation_ref.record_fingerprint);
      const slot = input.plan.slots.find((candidate) => candidate.slot_id === terminal.slot_id);
      if (
        !episode ||
        !blind ||
        !slot ||
        episode.case_id !== slot.case_id ||
        blind.slot_id !== slot.slot_id ||
        blind.observation.case_id !== slot.case_id ||
        episode.objective_observation_ref.record_fingerprint !==
          blind.observation.integrity.fingerprint
      ) {
        failV01("live_training_incomplete_terminal_source_material_missing");
      }
      assertValidCommissionedWorkEpisodeArtifactV01(episode);
      const commitment = input.family.training_cases.find(
        (candidate) => candidate.case_id === slot.case_id,
      );
      if (!commitment) failV01("live_training_incomplete_case_commitment_missing");
      assertValidCommissionedWorkObjectiveObservationV01(
        blind.observation,
        commitment,
      );
    }
  }
  const cleanupObservation = cleanup.cleanup_observation;
  const rebuiltCleanupObservation = buildCommissionedLiveTrainingCleanupObservationV01({
    observation_id: cleanupObservation.observation_id,
    cohort_plan_ref: cleanupObservation.cohort_plan_ref,
    native_host_invocations_started:
      cleanupObservation.native_host_invocations_started,
    exact_adapter_settlement_fingerprints:
      cleanupObservation.exact_adapter_settlement_fingerprints,
    every_started_adapter_invocation_settled:
      cleanupObservation.every_started_adapter_invocation_settled,
    listener_owner_kind: cleanupObservation.listener_owner_kind,
    repository_roots_absent: cleanupObservation.repository_roots_absent,
    runtime_roots_absent: cleanupObservation.runtime_roots_absent,
    temporary_roots_absent: cleanupObservation.temporary_roots_absent,
    artifact_temporaries_absent: cleanupObservation.artifact_temporaries_absent,
    task_external_network_attempts:
      cleanupObservation.task_external_network_attempts,
    observed_at: cleanupObservation.observed_at,
  });
  const rebuiltCleanup = buildCommissionedLiveTrainingCleanupReportV01({
    cleanup_id: cleanup.cleanup_id,
    cohort_plan_ref: cleanup.cohort_plan_ref,
    requested: cleanup.requested,
    completed: cleanup.completed,
    owned_processes_remaining: cleanup.owned_processes_remaining,
    owned_listeners_remaining: cleanup.owned_listeners_remaining,
    owned_repository_roots_remaining: cleanup.owned_repository_roots_remaining,
    owned_runtime_roots_remaining: cleanup.owned_runtime_roots_remaining,
    owned_temporary_roots_remaining: cleanup.owned_temporary_roots_remaining,
    stale_artifact_temporaries_remaining:
      cleanup.stale_artifact_temporaries_remaining,
    task_external_network_attempts: cleanup.task_external_network_attempts,
    provider_calls_observed: cleanup.provider_calls_observed,
    model_calls_observed: cleanup.model_calls_observed,
    cleanup_observation: rebuiltCleanupObservation,
    cleanup_observation_ref:
      commissionedLiveTrainingRecordRefV01(rebuiltCleanupObservation),
  });
  const rebuiltCloseout = buildCommissionedLiveTrainingIncompleteCloseoutV01({
    closeout_id: closeout.closeout_id,
    plan: input.plan,
    authorization: input.authorization,
    authorization_consumption_ref: createCommissionedWorkRecordRefV01({
      record_version: consumption.consumption_version,
      record_id: consumption.consumption_id,
      record_fingerprint: consumption.integrity.fingerprint,
    }),
    failure_code: closeout.failure_code,
    attempt_starts: starts,
    attempt_admissions: admissions,
    attempt_terminals: terminals,
    primary_slots_completed: terminals.filter((terminal) => terminal.aggregable).length,
    cleanup_report: rebuiltCleanup,
  });
  const maximumStartedOrdinal = starts.reduce(
    (maximum, start) =>
      Math.max(maximum, start.reserved_native_host_invocation_ordinal),
    0,
  );
  if (
    canonicalizeProtocolValueV01(rebuiltCleanupObservation) !==
      canonicalizeProtocolValueV01(cleanupObservation) ||
    canonicalizeProtocolValueV01(rebuiltCleanup) !==
      canonicalizeProtocolValueV01(cleanup) ||
    canonicalizeProtocolValueV01(rebuiltCloseout) !==
      canonicalizeProtocolValueV01(closeout) ||
    canonicalizeProtocolValueV01(cleanupObservation.cohort_plan_ref) !==
      canonicalizeProtocolValueV01(
        commissionedLiveTrainingRecordRefV01(input.plan),
      ) ||
    canonicalizeProtocolValueV01(cleanup.cohort_plan_ref) !==
      canonicalizeProtocolValueV01(
        commissionedLiveTrainingRecordRefV01(input.plan),
      ) ||
    cleanupObservation.native_host_invocations_started < maximumStartedOrdinal ||
    cleanupObservation.native_host_invocations_started > starts.length + 1 ||
    canonicalizeProtocolValueV01(closeout.cohort_plan_ref) !==
      canonicalizeProtocolValueV01(
        commissionedLiveTrainingRecordRefV01(input.plan),
      ) ||
    canonicalizeProtocolValueV01(closeout.authorization_ref) !==
      canonicalizeProtocolValueV01(
        commissionedLiveTrainingRecordRefV01(input.authorization),
      ) ||
    canonicalizeProtocolValueV01(closeout.authorization_consumption_ref) !==
      canonicalizeProtocolValueV01(
        createCommissionedWorkRecordRefV01({
          record_version: consumption.consumption_version,
          record_id: consumption.consumption_id,
          record_fingerprint: consumption.integrity.fingerprint,
        }),
      ) ||
    canonicalizeProtocolValueV01(closeout.cleanup_report_ref) !==
      canonicalizeProtocolValueV01(
        commissionedLiveTrainingRecordRefV01(cleanup),
      ) ||
    closeout.cohort_aggregable !== false ||
    closeout.nonce_reusable !== false ||
    closeout.primary_slots_completed !==
      terminals.filter((terminal) => terminal.aggregable).length ||
    episodes.length !== closeout.primary_slots_completed ||
    blinds.length !== closeout.primary_slots_completed ||
    canonicalizeProtocolValueV01(recorded(closeout.attempt_start_refs)) !==
      canonicalizeProtocolValueV01(exactRefSet(starts)) ||
    canonicalizeProtocolValueV01(recorded(closeout.attempt_admission_refs)) !==
      canonicalizeProtocolValueV01(exactRefSet(admissions)) ||
    canonicalizeProtocolValueV01(recorded(closeout.attempt_terminal_refs)) !==
      canonicalizeProtocolValueV01(exactRefSet(terminals))
  ) {
    failV01("live_training_incomplete_closeout_graph_invalid");
  }
}

function assertPartialSerializedArtifactGraphV01(input: {
  plan: CommissionedLiveTrainingCohortPlanV01;
  authorization: CommissionedLiveTrainingAuthorizationV01;
  family: CommissionedWorkFamilyManifestV01;
  values_by_kind: Map<string, unknown[]>;
}): void {
  const registries = (input.values_by_kind.get("attempt_registry") ?? []) as
    CommissionedLiveTrainingAttemptRegistryV01[];
  const checkpoints = (input.values_by_kind.get("predecessor_checkpoint") ?? []) as
    CommissionedWorkEpisodeCheckpointV01[];
  const cloneSeals = (input.values_by_kind.get("clone_seal") ?? []) as
    CommissionedLiveTrainingCloneSealV01[];
  const joins = (input.values_by_kind.get("analysis_join") ?? []) as
    CommissionedLiveTrainingAnalysisJoinV01[];
  const trainingResults = (input.values_by_kind.get("training_result") ?? []) as
    CommissionedWorkTrainingResultV01[];
  const liveResults = (input.values_by_kind.get("live_training_result") ?? []) as
    CommissionedLiveTrainingResultV01[];
  const assessments = (input.values_by_kind.get("candidate_assessment") ?? []) as
    CommissionedLiveTrainingCandidateAssessmentV01[];
  const cleanupReports = (input.values_by_kind.get("cleanup_report") ?? []) as
    CommissionedLiveTrainingCleanupReportV01[];
  const starts = (input.values_by_kind.get("attempt_start") ?? []) as
    CommissionedLiveTrainingAttemptStartV01[];
  const admissions = (input.values_by_kind.get("attempt_admission") ?? []) as
    CommissionedLiveTrainingAttemptAdmissionV01[];
  const terminals = (input.values_by_kind.get("attempt_terminal") ?? []) as
    CommissionedLiveTrainingAttemptTerminalV01[];
  const episodes = (input.values_by_kind.get("episode") ?? []) as
    CommissionedWorkEpisodeArtifactV01[];
  const blinds = (input.values_by_kind.get("blind_objective_observation") ?? []) as
    CommissionedLiveTrainingBlindObjectiveObservationV01[];
  const consumption = (
    input.values_by_kind.get("authorization_consumption_primary") ?? []
  )[0] as CommissionedLiveTrainingAuthorizationConsumptionV01 | undefined;
  if (
    registries.length > 1 ||
    checkpoints.length > 3 ||
    cloneSeals.length > 3 ||
    joins.length > 12 ||
    trainingResults.length > 1 ||
    liveResults.length > 1 ||
    assessments.length > 1 ||
    cleanupReports.length > 1
  ) {
    failV01("live_training_partial_finalization_count_invalid");
  }
  const registry = registries[0];
  if (registry) {
    const rebuilt = buildCommissionedLiveTrainingAttemptRegistryV01({
      registry_id: registry.registry_id,
      plan: input.plan,
      authorization: input.authorization,
      starts,
      admissions,
      terminals,
    });
    if (canonicalizeProtocolValueV01(rebuilt) !== canonicalizeProtocolValueV01(registry)) {
      failV01("live_training_partial_registry_graph_invalid");
    }
  }
  const episodeByFingerprint = new Map(
    episodes.map((episode) => [episode.integrity.fingerprint, episode] as const),
  );
  const checkpointByFingerprint = new Map(
    checkpoints.map((checkpoint) => [checkpoint.integrity.fingerprint, checkpoint] as const),
  );
  for (const checkpoint of checkpoints) {
    const predecessor = episodeByFingerprint.get(
      checkpoint.predecessor_episode_ref.record_fingerprint,
    );
    if (
      !predecessor ||
      canonicalizeProtocolValueV01(buildCommissionedWorkEpisodeCheckpointV01(predecessor)) !==
        canonicalizeProtocolValueV01(checkpoint)
    ) {
      failV01("live_training_partial_checkpoint_graph_invalid");
    }
  }
  for (const seal of cloneSeals) {
    const checkpoint = checkpointByFingerprint.get(
      seal.predecessor_checkpoint_ref.record_fingerprint,
    );
    if (!checkpoint) failV01("live_training_partial_clone_checkpoint_missing");
    const rebuilt = buildCommissionedLiveTrainingCloneSealV01({
      seal_id: seal.seal_id,
      case_id: seal.case_id,
      predecessor_checkpoint_ref: seal.predecessor_checkpoint_ref,
      predecessor_head: seal.predecessor_head,
      predecessor_tree: seal.predecessor_tree,
      predecessor_worktree_fingerprint: seal.predecessor_worktree_fingerprint,
      source_drift_fingerprint: seal.source_drift_fingerprint,
      post_drift_head: seal.post_drift_head,
      post_drift_tree: seal.post_drift_tree,
      post_drift_parent_head: seal.post_drift_parent_head,
      post_drift_current_source_fingerprint:
        seal.post_drift_current_source_fingerprint,
      post_drift_parent_is_predecessor_head: true,
      clone_baselines: seal.clone_baselines,
      predecessor_checkpoint_source: checkpoint,
      cohort_plan_source: input.plan,
    });
    if (canonicalizeProtocolValueV01(rebuilt) !== canonicalizeProtocolValueV01(seal)) {
      failV01("live_training_partial_clone_seal_graph_invalid");
    }
  }
  const blindBySlot = new Map(blinds.map((blind) => [blind.slot_id, blind] as const));
  if (joins.length > 0) {
    assertCommissionedLiveTrainingCaseObservationsSealedBeforeUnblindingV01({
      plan: input.plan,
      blind_observations: blinds,
      analysis_joins: joins,
      require_complete_join_set: false,
    });
  }
  for (const join of joins) {
    const slot = input.plan.slots.find((candidate) => candidate.slot_id === join.slot_id);
    const blind = blindBySlot.get(join.slot_id);
    if (!slot || !blind) failV01("live_training_partial_join_source_missing");
    const rebuilt = buildCommissionedLiveTrainingAnalysisJoinV01({
      join_id: join.join_id,
      slot,
      blind_observation: blind,
      joined_at: join.joined_at,
    });
    if (canonicalizeProtocolValueV01(rebuilt) !== canonicalizeProtocolValueV01(join)) {
      failV01("live_training_partial_join_graph_invalid");
    }
  }
  const orderedEpisodes = input.plan.slots.map((slot) => {
    const terminal = terminals.find(
      (candidate) => candidate.slot_id === slot.slot_id && candidate.aggregable,
    );
    const episode = terminal?.episode_ref
      ? episodeByFingerprint.get(terminal.episode_ref.record_fingerprint)
      : undefined;
    return episode ?? null;
  });
  const allEpisodesPresent = orderedEpisodes.every(
    (episode): episode is CommissionedWorkEpisodeArtifactV01 => episode !== null,
  );
  const trainingResult = trainingResults[0];
  if (trainingResult) {
    if (!allEpisodesPresent) failV01("live_training_partial_training_source_missing");
    const predecessorEpisodes = input.plan.slots
      .map((slot, index) => ({ slot, episode: orderedEpisodes[index]! }))
      .filter(({ slot }) => slot.slot_role === "predecessor")
      .map(({ episode }) => episode);
    const successorEpisodes = input.plan.slots
      .map((slot, index) => ({ slot, episode: orderedEpisodes[index]! }))
      .filter(({ slot }) => slot.slot_role === "cold_successor")
      .map(({ episode }) => episode);
    const rebuilt = buildCommissionedWorkTrainingResultV01({
      manifest: input.family,
      predecessor_episodes: predecessorEpisodes,
      successor_episodes: successorEpisodes,
    });
    if (canonicalizeProtocolValueV01(rebuilt) !== canonicalizeProtocolValueV01(trainingResult)) {
      failV01("live_training_partial_training_result_graph_invalid");
    }
  }
  const liveResult = liveResults[0];
  if (liveResult) {
    if (
      !registry ||
      !trainingResult ||
      !consumption ||
      !allEpisodesPresent ||
      checkpoints.length !== 3 ||
      cloneSeals.length !== 3 ||
      blinds.length !== 15 ||
      joins.length !== 12
    ) {
      failV01("live_training_partial_live_result_source_missing");
    }
    const checkpointByCase = new Map(
      checkpoints.map((checkpoint) => [checkpoint.case_id, checkpoint] as const),
    );
    const sealByCase = new Map(
      cloneSeals.map((seal) => [seal.case_id, seal] as const),
    );
    const predecessorCases = input.plan.slots
      .filter((slot) => slot.slot_role === "predecessor")
      .map((slot) => slot.case_id);
    const rebuilt = buildCommissionedLiveTrainingResultV01({
      result_id: liveResult.result_id,
      plan: input.plan,
      authorization: input.authorization,
      authorization_consumption_ref: createCommissionedWorkRecordRefV01({
        record_version: consumption.consumption_version,
        record_id: consumption.consumption_id,
        record_fingerprint: consumption.integrity.fingerprint,
      }),
      attempt_registry: registry,
      training_result: trainingResult,
      predecessor_checkpoints: predecessorCases.map((caseId) => checkpointByCase.get(caseId)!) as [
        CommissionedWorkEpisodeCheckpointV01,
        CommissionedWorkEpisodeCheckpointV01,
        CommissionedWorkEpisodeCheckpointV01,
      ],
      clone_seals: predecessorCases.map((caseId) => sealByCase.get(
        caseId as CommissionedLiveTrainingCloneSealV01["case_id"],
      )!) as [
        CommissionedLiveTrainingCloneSealV01,
        CommissionedLiveTrainingCloneSealV01,
        CommissionedLiveTrainingCloneSealV01,
      ],
      blind_observations: blinds,
      analysis_joins: joins,
    });
    if (canonicalizeProtocolValueV01(rebuilt) !== canonicalizeProtocolValueV01(liveResult)) {
      failV01("live_training_partial_live_result_graph_invalid");
    }
  }
  const assessment = assessments[0];
  if (assessment) {
    if (!registry || !trainingResult || !allEpisodesPresent || blinds.length !== 15) {
      failV01("live_training_partial_assessment_source_missing");
    }
    const rebuilt = buildCommissionedLiveTrainingCandidateAssessmentV01({
      assessment_id: assessment.assessment_id,
      family_manifest: input.family,
      plan: input.plan,
      authorization: input.authorization,
      training_result: trainingResult,
      episodes: orderedEpisodes,
      blind_observations: blinds,
      attempt_registry: registry,
      assessor_role_id: assessment.assessor_role_ref.role_id,
    });
    if (canonicalizeProtocolValueV01(rebuilt) !== canonicalizeProtocolValueV01(assessment)) {
      failV01("live_training_partial_assessment_graph_invalid");
    }
  }
  const cleanup = cleanupReports[0];
  if (cleanup) {
    const observation = cleanup.cleanup_observation;
    const rebuiltObservation = buildCommissionedLiveTrainingCleanupObservationV01({
      observation_id: observation.observation_id,
      cohort_plan_ref: observation.cohort_plan_ref,
      native_host_invocations_started: observation.native_host_invocations_started,
      exact_adapter_settlement_fingerprints:
        observation.exact_adapter_settlement_fingerprints,
      every_started_adapter_invocation_settled:
        observation.every_started_adapter_invocation_settled,
      listener_owner_kind: observation.listener_owner_kind,
      repository_roots_absent: observation.repository_roots_absent,
      runtime_roots_absent: observation.runtime_roots_absent,
      temporary_roots_absent: observation.temporary_roots_absent,
      artifact_temporaries_absent: observation.artifact_temporaries_absent,
      task_external_network_attempts: observation.task_external_network_attempts,
      observed_at: observation.observed_at,
    });
    const rebuilt = buildCommissionedLiveTrainingCleanupReportV01({
      cleanup_id: cleanup.cleanup_id,
      cohort_plan_ref: cleanup.cohort_plan_ref,
      requested: cleanup.requested,
      completed: cleanup.completed,
      owned_processes_remaining: cleanup.owned_processes_remaining,
      owned_listeners_remaining: cleanup.owned_listeners_remaining,
      owned_repository_roots_remaining: cleanup.owned_repository_roots_remaining,
      owned_runtime_roots_remaining: cleanup.owned_runtime_roots_remaining,
      owned_temporary_roots_remaining: cleanup.owned_temporary_roots_remaining,
      stale_artifact_temporaries_remaining:
        cleanup.stale_artifact_temporaries_remaining,
      task_external_network_attempts: cleanup.task_external_network_attempts,
      provider_calls_observed: cleanup.provider_calls_observed,
      model_calls_observed: cleanup.model_calls_observed,
      cleanup_observation: rebuiltObservation,
      cleanup_observation_ref:
        commissionedLiveTrainingRecordRefV01(rebuiltObservation),
    });
    if (canonicalizeProtocolValueV01(rebuilt) !== canonicalizeProtocolValueV01(cleanup)) {
      failV01("live_training_partial_cleanup_graph_invalid");
    }
  }
}

function assertRecordIntegrityForSlotV01(
  slotKind: CommissionedLiveTrainingArtifactIndexEntryV01["slot_kind"] | "artifact_index",
  value: unknown,
): void {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    failV01("live_training_artifact_integrity_material_invalid");
  }
  const material = value as Record<string, unknown>;
  const integrity = material.integrity;
  if (!integrity || typeof integrity !== "object" || Array.isArray(integrity)) {
    failV01("live_training_artifact_integrity_material_invalid");
  }
  const scopeByKind: Record<string, string> = {
    family_manifest: "commissioned_work_family_manifest_without_integrity_fingerprint",
    cohort_plan: "commissioned_live_training_plan_without_integrity_fingerprint",
    authorization: "commissioned_live_training_authorization_without_integrity_fingerprint",
    authorization_consumption_primary:
      "commissioned_live_training_authorization_consumption_without_integrity_fingerprint",
    authorization_consumption_witness:
      "commissioned_live_training_authorization_consumption_without_integrity_fingerprint",
    attempt_start: "commissioned_live_training_attempt_start_without_integrity_fingerprint",
    attempt_admission:
      "commissioned_live_training_attempt_admission_without_integrity_fingerprint",
    attempt_terminal:
      "commissioned_live_training_attempt_terminal_without_integrity_fingerprint",
    attempt_registry:
      "commissioned_live_training_attempt_registry_without_integrity_fingerprint",
    episode: "commissioned_work_episode_without_integrity_fingerprint",
    predecessor_checkpoint:
      "commissioned_work_episode_checkpoint_without_integrity_fingerprint",
    clone_seal: "commissioned_live_training_clone_seal_without_integrity_fingerprint",
    blind_objective_observation:
      "commissioned_live_training_blind_observation_without_integrity_fingerprint",
    analysis_join:
      "commissioned_live_training_analysis_join_without_integrity_fingerprint",
    training_result: "commissioned_work_training_result_without_integrity_fingerprint",
    live_training_result:
      "commissioned_live_training_result_without_integrity_fingerprint",
    candidate_assessment:
      "commissioned_live_training_candidate_assessment_without_integrity_fingerprint",
    cleanup_report: "commissioned_live_training_cleanup_without_integrity_fingerprint",
    incomplete_cleanup_report:
      "commissioned_live_training_cleanup_without_integrity_fingerprint",
    incomplete_closeout:
      "commissioned_live_training_incomplete_closeout_without_integrity_fingerprint",
    artifact_index:
      "commissioned_live_training_artifact_index_without_integrity_fingerprint",
  };
  const scope = scopeByKind[slotKind];
  if (!scope) failV01("live_training_artifact_integrity_scope_missing");
  const { integrity: _ignored, ...withoutIntegrity } = material;
  const expected = createCommissionedWorkIntegrityV01(withoutIntegrity, scope);
  if (canonicalizeProtocolValueV01(integrity) !== canonicalizeProtocolValueV01(expected)) {
    failV01("live_training_artifact_integrity_recomputation_failed");
  }
}

function assertArtifactIndexEntryCoordinatesV01(input: {
  entry: CommissionedLiveTrainingArtifactIndexEntryV01;
  value: unknown;
  plan: CommissionedLiveTrainingCohortPlanV01;
  authorization: CommissionedLiveTrainingAuthorizationV01;
}): void {
  const material = input.value as Record<string, unknown>;
  let expected: Pick<
    CommissionedLiveTrainingArtifactIndexEntryV01,
    "relative_path" | "slot_id" | "attempt_id" | "case_id"
  >;
  const empty = (relativePath: string) => ({
    relative_path: relativePath,
    slot_id: null,
    attempt_id: null,
    case_id: null,
  });
  switch (input.entry.slot_kind) {
    case "family_manifest":
      expected = empty("family-manifest.json");
      break;
    case "cohort_plan":
      expected = empty("cohort-plan.json");
      break;
    case "authorization":
      expected = empty("authorization.json");
      break;
    case "authorization_consumption_primary":
      expected = empty(path.posix.join(
        "..",
        CONSUMPTION_DIRECTORY_V01,
        safeSegmentV01(
          input.authorization.authorization_nonce_fingerprint.slice("sha256:".length),
        ),
        "consumption.json",
      ));
      break;
    case "authorization_consumption_witness":
      expected = empty("authorization-consumption/witness.json");
      break;
    case "attempt_start": {
      const value = material as unknown as CommissionedLiveTrainingAttemptStartV01;
      expected = {
        relative_path: path.posix.join("attempts", `${safeSegmentV01(value.attempt_id)}-start.json`),
        slot_id: value.slot_id,
        attempt_id: value.attempt_id,
        case_id: null,
      };
      break;
    }
    case "attempt_admission": {
      const value = material as unknown as CommissionedLiveTrainingAttemptAdmissionV01;
      expected = {
        relative_path: path.posix.join("attempts", `${safeSegmentV01(value.attempt_id)}-admission.json`),
        slot_id: value.slot_id,
        attempt_id: value.attempt_id,
        case_id: null,
      };
      break;
    }
    case "attempt_terminal": {
      const value = material as unknown as CommissionedLiveTrainingAttemptTerminalV01;
      if (!value.terminal_id.endsWith("-terminal")) {
        failV01("live_training_artifact_index_coordinate_invalid");
      }
      expected = {
        relative_path: path.posix.join("attempts", `${safeSegmentV01(value.terminal_id)}.json`),
        slot_id: value.slot_id,
        attempt_id: value.terminal_id.replace(/-terminal$/u, ""),
        case_id: null,
      };
      break;
    }
    case "attempt_registry":
      expected = empty("attempt-registry.json");
      break;
    case "episode": {
      const value = material as unknown as CommissionedWorkEpisodeArtifactV01;
      if (input.entry.slot_id === null) {
        failV01("live_training_artifact_index_coordinate_invalid");
      }
      expected = {
        relative_path: path.posix.join("episodes", `${safeSegmentV01(input.entry.slot_id)}.json`),
        slot_id: input.entry.slot_id,
        attempt_id: null,
        case_id: value.case_id,
      };
      break;
    }
    case "predecessor_checkpoint": {
      const value = material as unknown as CommissionedWorkEpisodeCheckpointV01;
      const slot = input.plan.slots.find(
        (candidate) =>
          candidate.slot_role === "predecessor" && candidate.case_id === value.case_id,
      );
      if (!slot) failV01("live_training_artifact_index_coordinate_invalid");
      expected = {
        relative_path: path.posix.join("predecessor-checkpoints", `${slot.slot_id}.json`),
        slot_id: slot.slot_id,
        attempt_id: null,
        case_id: value.case_id,
      };
      break;
    }
    case "clone_seal": {
      const value = material as unknown as CommissionedLiveTrainingCloneSealV01;
      expected = {
        relative_path: path.posix.join("clone-seals", `${safeSegmentV01(value.case_id)}.json`),
        slot_id: null,
        attempt_id: null,
        case_id: value.case_id,
      };
      break;
    }
    case "blind_objective_observation": {
      const value = material as unknown as CommissionedLiveTrainingBlindObjectiveObservationV01;
      expected = {
        relative_path: path.posix.join("blind-observations", `${safeSegmentV01(value.slot_id)}.json`),
        slot_id: value.slot_id,
        attempt_id: null,
        case_id: value.observation.case_id,
      };
      break;
    }
    case "analysis_join": {
      const value = material as unknown as CommissionedLiveTrainingAnalysisJoinV01;
      expected = {
        relative_path: path.posix.join("analysis-joins", `${safeSegmentV01(value.slot_id)}.json`),
        slot_id: value.slot_id,
        attempt_id: null,
        case_id: null,
      };
      break;
    }
    case "training_result":
      expected = empty("training-result.json");
      break;
    case "live_training_result":
      expected = empty("live-training-result.json");
      break;
    case "candidate_assessment":
      expected = empty("training-only-candidate-assessment.json");
      break;
    case "cleanup_report":
      expected = empty("cleanup-report.json");
      break;
    case "incomplete_cleanup_report":
      expected = empty(INCOMPLETE_CLEANUP_FILE_V01);
      break;
    case "incomplete_closeout":
      expected = empty("incomplete-closeout.json");
      break;
    default:
      failV01("live_training_artifact_index_coordinate_invalid");
  }
  if (
    canonicalizeProtocolValueV01({
      relative_path: input.entry.relative_path,
      slot_id: input.entry.slot_id,
      attempt_id: input.entry.attempt_id,
      case_id: input.entry.case_id,
    }) !== canonicalizeProtocolValueV01(expected) ||
    canonicalizeProtocolValueV01(input.entry.record_ref) !==
      canonicalizeProtocolValueV01(
        indexedMaterialRecordRefV01(
          input.entry.slot_kind,
          input.value,
          input.plan,
        ),
      )
  ) {
    failV01("live_training_artifact_index_coordinate_invalid");
  }
}

function indexedMaterialRecordRefV01(
  slotKind: CommissionedLiveTrainingArtifactIndexEntryV01["slot_kind"],
  value: unknown,
  plan: CommissionedLiveTrainingCohortPlanV01,
): CommissionedWorkRecordRefV01 {
  switch (slotKind) {
    case "family_manifest":
      return commissionedWorkManifestRecordRefV01(
        value as CommissionedWorkFamilyManifestV01,
      );
    case "cohort_plan":
    case "authorization":
    case "attempt_start":
    case "attempt_admission":
    case "attempt_terminal":
    case "attempt_registry":
    case "clone_seal":
    case "blind_objective_observation":
    case "analysis_join":
    case "live_training_result":
    case "candidate_assessment":
    case "cleanup_report":
    case "incomplete_cleanup_report":
    case "incomplete_closeout":
      return commissionedLiveTrainingRecordRefV01(
        value as Parameters<typeof commissionedLiveTrainingRecordRefV01>[0],
      );
    case "authorization_consumption_primary":
    case "authorization_consumption_witness": {
      const consumption = value as CommissionedLiveTrainingAuthorizationConsumptionV01;
      return createCommissionedWorkRecordRefV01({
        record_version: consumption.consumption_version,
        record_id: consumption.consumption_id,
        record_fingerprint: consumption.integrity.fingerprint,
      });
    }
    case "episode": {
      const episode = value as CommissionedWorkEpisodeArtifactV01;
      return createCommissionedWorkRecordRefV01({
        record_version: episode.episode_version,
        record_id: episode.episode_id,
        record_fingerprint: episode.integrity.fingerprint,
      });
    }
    case "predecessor_checkpoint": {
      const checkpoint = value as CommissionedWorkEpisodeCheckpointV01;
      return createCommissionedWorkRecordRefV01({
        record_version: checkpoint.checkpoint_version,
        record_id: checkpoint.checkpoint_id,
        record_fingerprint: checkpoint.integrity.fingerprint,
      });
    }
    case "training_result": {
      const result = value as CommissionedWorkTrainingResultV01;
      return createCommissionedWorkRecordRefV01({
        record_version: result.result_version,
        record_id: `training-${plan.cohort_id}`,
        record_fingerprint: result.integrity.fingerprint,
      });
    }
    default:
      failV01("live_training_artifact_index_record_ref_invalid");
  }
}

function assertBundleSourceBindingsV01(
  artifacts: CommissionedLiveTrainingArtifactsV01,
): void {
  assertValidCommissionedLiveTrainingCohortPlanV01(artifacts.cohort_plan);
  if (
    canonicalizeProtocolValueV01(
      artifacts.authorization.source_binding.cohort_plan_ref,
    ) !== canonicalizeProtocolValueV01(
      commissionedLiveTrainingRecordRefV01(artifacts.cohort_plan),
    ) ||
    canonicalizeProtocolValueV01(
      artifacts.authorization.source_binding.family_ref,
    ) !== canonicalizeProtocolValueV01(
      commissionedWorkManifestRecordRefV01(artifacts.family_manifest),
    ) ||
    canonicalizeProtocolValueV01(
      artifacts.authorization_consumption.authorization_ref,
    ) !== canonicalizeProtocolValueV01(
      commissionedLiveTrainingRecordRefV01(artifacts.authorization),
    ) ||
    canonicalizeProtocolValueV01(
      artifacts.authorization_consumption.cohort_plan_ref,
    ) !== canonicalizeProtocolValueV01(
      commissionedLiveTrainingRecordRefV01(artifacts.cohort_plan),
    ) ||
    artifacts.attempt_starts.length !== artifacts.attempt_admissions.length ||
    artifacts.episodes.length !== 15 ||
    artifacts.predecessor_checkpoints.length !== 3 ||
    artifacts.clone_seals.length !== 3 ||
    artifacts.blind_objective_observations.length !== 15 ||
    artifacts.analysis_joins.length !== 12
  ) {
    failV01("live_training_artifact_bundle_source_binding_invalid");
  }
  artifacts.episodes.forEach(assertValidCommissionedWorkEpisodeArtifactV01);
  const slotIds = artifacts.attempt_terminals
    .filter((terminal) => terminal.episode_ref !== null)
    .map((terminal) => terminal.slot_id);
  if (
    new Set(slotIds).size !== 15 ||
    artifacts.cohort_plan.slots.some((slot) => !slotIds.includes(slot.slot_id))
  ) {
    failV01("live_training_artifact_episode_slot_invalid");
  }
  assertSafeCommissionedLiveTrainingOutputV01(artifacts);
}

function assertSerializedArtifactGraphV01(input: {
  plan: CommissionedLiveTrainingCohortPlanV01;
  authorization: CommissionedLiveTrainingAuthorizationV01;
  family: CommissionedWorkFamilyManifestV01;
  values_by_kind: Map<string, unknown[]>;
}): void {
  const starts = (input.values_by_kind.get("attempt_start") ?? []) as
    CommissionedLiveTrainingAttemptStartV01[];
  const admissions = (input.values_by_kind.get("attempt_admission") ?? []) as
    CommissionedLiveTrainingAttemptAdmissionV01[];
  const terminals = (input.values_by_kind.get("attempt_terminal") ?? []) as
    CommissionedLiveTrainingAttemptTerminalV01[];
  const registries = (input.values_by_kind.get("attempt_registry") ?? []) as
    CommissionedLiveTrainingAttemptRegistryV01[];
  const episodes = (input.values_by_kind.get("episode") ?? []) as
    CommissionedWorkEpisodeArtifactV01[];
  const checkpoints = (input.values_by_kind.get("predecessor_checkpoint") ?? []) as
    CommissionedWorkEpisodeCheckpointV01[];
  const cloneSeals = (input.values_by_kind.get("clone_seal") ?? []) as
    CommissionedLiveTrainingCloneSealV01[];
  const joins = (input.values_by_kind.get("analysis_join") ?? []) as
    CommissionedLiveTrainingAnalysisJoinV01[];
  const trainingResults = (input.values_by_kind.get("training_result") ?? []) as
    CommissionedWorkTrainingResultV01[];
  const liveResults = (input.values_by_kind.get("live_training_result") ?? []) as
    CommissionedLiveTrainingResultV01[];
  const assessments = (input.values_by_kind.get("candidate_assessment") ?? []) as
    CommissionedLiveTrainingCandidateAssessmentV01[];
  const cleanupReports = (input.values_by_kind.get("cleanup_report") ?? []) as
    CommissionedLiveTrainingCleanupReportV01[];
  const blindObservations = (
    input.values_by_kind.get("blind_objective_observation") ?? []
  ) as CommissionedLiveTrainingBlindObjectiveObservationV01[];
  const consumptions = (
    input.values_by_kind.get("authorization_consumption_primary") ?? []
  ) as CommissionedLiveTrainingAuthorizationConsumptionV01[];
  const consumptionWitnesses = (
    input.values_by_kind.get("authorization_consumption_witness") ?? []
  ) as CommissionedLiveTrainingAuthorizationConsumptionV01[];
  if (
    starts.length !== admissions.length ||
    admissions.length !== terminals.length ||
    registries.length !== 1 ||
    episodes.length !== 15 ||
    checkpoints.length !== 3 ||
    cloneSeals.length !== 3 ||
    blindObservations.length !== 15 ||
    joins.length !== 12 ||
    trainingResults.length !== 1 ||
    liveResults.length !== 1 ||
    assessments.length !== 1 ||
    cleanupReports.length !== 1 ||
    consumptions.length !== 1 ||
    consumptionWitnesses.length !== 1
  ) {
    failV01("live_training_artifact_serialized_graph_count_invalid");
  }
  const consumption = consumptions[0]!;
  if (
    canonicalizeProtocolValueV01(consumptionWitnesses[0]) !==
      canonicalizeProtocolValueV01(consumption) ||
    canonicalizeProtocolValueV01(consumption.authorization_ref) !==
      canonicalizeProtocolValueV01(
        commissionedLiveTrainingRecordRefV01(input.authorization),
      ) ||
    canonicalizeProtocolValueV01(consumption.cohort_plan_ref) !==
      canonicalizeProtocolValueV01(
        commissionedLiveTrainingRecordRefV01(input.plan),
      ) ||
    consumption.native_execution_configuration_fingerprint !==
      input.authorization.native_execution_configuration.configuration_fingerprint ||
    consumption.authorization_nonce_fingerprint !==
      input.authorization.authorization_nonce_fingerprint
  ) {
    failV01("live_training_artifact_consumption_graph_invalid");
  }
  const startByRef = new Map(
    starts.map((start) => [start.integrity.fingerprint, start] as const),
  );
  const admissionByRef = new Map(
    admissions.map((admission) => [admission.integrity.fingerprint, admission] as const),
  );
  const terminalByAdmission = new Map(
    terminals.map((terminal) => [
      terminal.attempt_admission_ref.record_fingerprint,
      terminal,
    ] as const),
  );
  const episodeByRef = new Map(
    episodes.map((episode) => [episode.integrity.fingerprint, episode] as const),
  );
  const blindByRef = new Map(
    blindObservations.map((blind) => [blind.integrity.fingerprint, blind] as const),
  );
  if (
    startByRef.size !== starts.length ||
    admissionByRef.size !== admissions.length ||
    terminalByAdmission.size !== terminals.length ||
    episodeByRef.size !== episodes.length ||
    blindByRef.size !== blindObservations.length
  ) {
    failV01("live_training_artifact_serialized_graph_duplicate_ref");
  }
  assertSerializedAttemptSourceRelationsV01({
    plan: input.plan,
    authorization: input.authorization,
    consumption,
    starts,
    admissions,
    terminals,
    episodes,
    blinds: blindObservations,
    checkpoints,
    clone_seals: cloneSeals,
  });
  for (const start of starts) {
    const rebuilt = buildCommissionedLiveTrainingAttemptStartV01({
      attempt_start_id: start.attempt_start_id,
      attempt_id: start.attempt_id,
      slot_id: start.slot_id,
      attempt_kind: start.attempt_kind,
      authorization_consumption_ref: start.authorization_consumption_ref,
      cohort_plan_ref: start.cohort_plan_ref,
      executor_role_ref: start.executor_role_ref,
      request_ref_fingerprint: start.request_ref_fingerprint,
      run_ref_fingerprint: start.run_ref_fingerprint,
      native_execution_configuration_fingerprint:
        start.native_execution_configuration_fingerprint,
      adapter_execution_binding_fingerprint:
        start.adapter_execution_binding_fingerprint,
      clone_baseline: start.clone_baseline,
      reserved_native_host_invocation_ordinal:
        start.reserved_native_host_invocation_ordinal,
      provider_bearing_invocation_reserved:
        start.provider_bearing_invocation_reserved,
      model_bearing_invocation_reserved: start.model_bearing_invocation_reserved,
      started_at: start.started_at,
    });
    if (
      canonicalizeProtocolValueV01(rebuilt) !== canonicalizeProtocolValueV01(start) ||
      start.authorization_consumption_ref.record_fingerprint !==
        consumption.integrity.fingerprint ||
      start.cohort_plan_ref.record_fingerprint !== input.plan.integrity.fingerprint ||
      start.native_execution_configuration_fingerprint !==
        input.authorization.native_execution_configuration.configuration_fingerprint ||
      start.adapter_execution_binding_fingerprint !==
        createCommissionedLiveTrainingAdapterBindingV01(
          input.authorization.native_execution_configuration,
        ).binding_fingerprint
    ) {
      failV01("live_training_artifact_attempt_start_graph_invalid");
    }
  }
  for (const admission of admissions) {
    const start = startByRef.get(admission.attempt_start_ref.record_fingerprint);
    const rebuilt = buildCommissionedLiveTrainingAttemptAdmissionV01({
      attempt_id: admission.attempt_id,
      slot_id: admission.slot_id,
      attempt_kind: admission.attempt_kind,
      replacement_of_attempt_ref: admission.replacement_of_attempt_ref,
      attempt_start_ref: admission.attempt_start_ref,
      authorization_consumption_ref: admission.authorization_consumption_ref,
      cohort_plan_ref: admission.cohort_plan_ref,
      executor_role_ref: admission.executor_role_ref,
      run_ref_fingerprint: admission.run_ref_fingerprint,
      request_ref_fingerprint: admission.request_ref_fingerprint,
      host_ref_set: admission.host_ref_set,
      host_context_fingerprint: admission.host_context_fingerprint,
      native_execution_configuration_fingerprint:
        admission.native_execution_configuration_fingerprint,
      adapter_execution_binding_fingerprint:
        admission.adapter_execution_binding_fingerprint,
      native_host_result_fingerprint: admission.native_host_result_fingerprint,
      clone_identity_fingerprint: admission.clone_identity_fingerprint,
      clone_baseline: admission.clone_baseline,
      admitted_at: admission.admitted_at,
    });
    if (
      !start ||
      canonicalizeProtocolValueV01(rebuilt) !== canonicalizeProtocolValueV01(admission) ||
      start.attempt_id !== admission.attempt_id ||
      start.slot_id !== admission.slot_id ||
      start.request_ref_fingerprint !== admission.request_ref_fingerprint ||
      start.run_ref_fingerprint !== admission.run_ref_fingerprint ||
      start.native_execution_configuration_fingerprint !==
        admission.native_execution_configuration_fingerprint ||
      start.adapter_execution_binding_fingerprint !==
        admission.adapter_execution_binding_fingerprint ||
      start.clone_baseline.clone_identity_fingerprint !==
        admission.clone_identity_fingerprint ||
      !terminalByAdmission.has(admission.integrity.fingerprint)
    ) {
      failV01("live_training_artifact_attempt_graph_invalid");
    }
  }
  for (const terminal of terminals) {
    const rebuilt = buildCommissionedLiveTrainingAttemptTerminalV01({
      terminal_id: terminal.terminal_id,
      attempt_admission_ref: terminal.attempt_admission_ref,
      slot_id: terminal.slot_id,
      terminal_status: terminal.terminal_status,
      failure_class: terminal.failure_class,
      first_meaningful_action_status: terminal.first_meaningful_action_status,
      repository_mutation_status: terminal.repository_mutation_status,
      native_host_settled: terminal.native_host_settled,
      cleanup_complete: terminal.cleanup_complete,
      episode_ref: terminal.episode_ref,
      blind_observation_ref: terminal.blind_observation_ref,
      finished_at: terminal.finished_at,
    });
    if (canonicalizeProtocolValueV01(rebuilt) !== canonicalizeProtocolValueV01(terminal)) {
      failV01("live_training_artifact_attempt_terminal_semantics_invalid");
    }
  }
  const registry = registries[0]!;
  const rebuiltRegistry = buildCommissionedLiveTrainingAttemptRegistryV01({
    registry_id: registry.registry_id,
    plan: input.plan,
    authorization: input.authorization,
    starts,
    admissions,
    terminals,
  });
  if (canonicalizeProtocolValueV01(rebuiltRegistry) !== canonicalizeProtocolValueV01(registry)) {
    failV01("live_training_artifact_registry_graph_invalid");
  }

  const orderedEpisodes: CommissionedWorkEpisodeArtifactV01[] = [];
  const orderedBlinds: CommissionedLiveTrainingBlindObjectiveObservationV01[] = [];
  for (const slot of input.plan.slots) {
    const aggregableTerminals = terminals.filter(
      (terminal) => terminal.slot_id === slot.slot_id && terminal.aggregable,
    );
    if (aggregableTerminals.length !== 1) {
      failV01("live_training_artifact_slot_terminal_invalid");
    }
    const terminal = aggregableTerminals[0]!;
    const admission = admissionByRef.get(
      terminal.attempt_admission_ref.record_fingerprint,
    );
    const episode = terminal.episode_ref === null
      ? undefined
      : episodeByRef.get(terminal.episode_ref.record_fingerprint);
    const blind = terminal.blind_observation_ref === null
      ? undefined
      : blindByRef.get(terminal.blind_observation_ref.record_fingerprint);
    const commitment = input.family.training_cases.find(
      (candidate) => candidate.case_id === slot.case_id,
    );
    const trainingCaseRef = input.plan.training_case_refs.find(
      (candidate) => candidate.record_id === slot.case_id,
    );
    if (!admission || !episode || !blind || !commitment || !trainingCaseRef) {
      failV01("live_training_artifact_slot_episode_observation_graph_invalid");
    }
    if (
      episode.case_id !== slot.case_id ||
      episode.episode_role !==
        (slot.slot_role === "predecessor" ? "predecessor" : "successor") ||
      episode.condition !== slot.condition ||
      blind.slot_id !== slot.slot_id ||
      blind.observation.case_id !== slot.case_id ||
      canonicalizeProtocolValueV01(blind.case_commitment_ref) !==
        canonicalizeProtocolValueV01(trainingCaseRef) ||
      episode.objective_observation_ref.record_fingerprint !==
        blind.observation.integrity.fingerprint
    ) {
      failV01("live_training_artifact_slot_case_or_observation_binding_invalid");
    }
    if (
      canonicalizeProtocolValueV01(episode.evaluation.executor_role) !==
        canonicalizeProtocolValueV01(admission.executor_role_ref) ||
      episode.execution_binding.run_ref_fingerprint !==
        admission.run_ref_fingerprint ||
      episode.execution_binding.native_host_request_fingerprint !==
        admission.request_ref_fingerprint ||
      episode.execution_binding.native_host_result_fingerprint !==
        admission.native_host_result_fingerprint
    ) {
      failV01("live_training_artifact_slot_native_execution_binding_invalid");
    }
    assertValidCommissionedWorkEpisodeArtifactV01(episode);
    assertValidCommissionedWorkObjectiveObservationV01(
      blind.observation,
      commitment,
    );
    const rebuiltBlind = buildCommissionedLiveTrainingBlindObjectiveObservationV01({
      blind_observation_id: blind.blind_observation_id,
      slot,
      evaluator_role_id: blind.evaluator_role_ref.role_id,
      evaluator_view_fingerprint: blind.evaluator_view_fingerprint,
      case_commitment: commitment,
      observation: blind.observation,
      sealed_at: blind.sealed_at,
    });
    if (canonicalizeProtocolValueV01(rebuiltBlind) !== canonicalizeProtocolValueV01(blind)) {
      failV01("live_training_artifact_blind_observation_rebuild_invalid");
    }
    const resourceBinding = episode.execution_binding.binding_kind === "commissioned_agent"
      ? episode.execution_binding.resource_binding
      : null;
    const liveAuthorizationRef = commissionedLiveTrainingRecordRefV01(input.authorization);
    if (
      resourceBinding === null ||
      (input.authorization.authorization_kind === "test_conformance"
        ? resourceBinding.live_authorization_ref !== null ||
          resourceBinding.provider_ref !== null ||
          resourceBinding.model_ref !== null ||
          resourceBinding.route_ref !== null
        : canonicalizeProtocolValueV01(resourceBinding.live_authorization_ref) !==
            canonicalizeProtocolValueV01(liveAuthorizationRef) ||
          canonicalizeProtocolValueV01(resourceBinding.provider_ref) !==
            canonicalizeProtocolValueV01(
              input.authorization.native_execution_configuration.provider_ref,
            ) ||
          canonicalizeProtocolValueV01(resourceBinding.model_ref) !==
            canonicalizeProtocolValueV01(
              input.authorization.native_execution_configuration.model_ref,
            ) ||
          canonicalizeProtocolValueV01(resourceBinding.route_ref) !==
            canonicalizeProtocolValueV01(
              input.authorization.native_execution_configuration.route_ref,
            ))
    ) {
      failV01("live_training_artifact_episode_authorization_binding_invalid");
    }
    orderedEpisodes.push(episode);
    orderedBlinds.push(blind);
  }
  if (episodeByRef.size !== orderedEpisodes.length || blindByRef.size !== orderedBlinds.length) {
    failV01("live_training_artifact_unreferenced_episode_or_observation");
  }

  const predecessorEpisodes = input.plan.slots
    .map((slot, index) => ({ slot, episode: orderedEpisodes[index]! }))
    .filter(({ slot }) => slot.slot_role === "predecessor")
    .map(({ episode }) => episode);
  const successorEpisodes = input.plan.slots
    .map((slot, index) => ({ slot, episode: orderedEpisodes[index]! }))
    .filter(({ slot }) => slot.slot_role === "cold_successor")
    .map(({ episode }) => episode);
  const checkpointByCase = new Map(
    checkpoints.map((checkpoint) => [checkpoint.case_id, checkpoint] as const),
  );
  const cloneSealByCase = new Map(
    cloneSeals.map((seal) => [seal.case_id, seal] as const),
  );
  if (checkpointByCase.size !== 3 || cloneSealByCase.size !== 3) {
    failV01("live_training_artifact_checkpoint_or_clone_duplicate");
  }
  for (const predecessor of predecessorEpisodes) {
    const checkpoint = checkpointByCase.get(predecessor.case_id);
    const seal = cloneSealByCase.get(predecessor.case_id as CommissionedLiveTrainingCloneSealV01["case_id"]);
    if (!checkpoint || !seal) {
      failV01("live_training_artifact_checkpoint_or_clone_missing");
    }
    const rebuiltCheckpoint = buildCommissionedWorkEpisodeCheckpointV01(predecessor);
    if (canonicalizeProtocolValueV01(rebuiltCheckpoint) !== canonicalizeProtocolValueV01(checkpoint)) {
      failV01("live_training_artifact_checkpoint_rebuild_invalid");
    }
    const rebuiltSeal = buildCommissionedLiveTrainingCloneSealV01({
      seal_id: seal.seal_id,
      case_id: seal.case_id,
      predecessor_checkpoint_ref: seal.predecessor_checkpoint_ref,
      predecessor_head: seal.predecessor_head,
      predecessor_tree: seal.predecessor_tree,
      predecessor_worktree_fingerprint: seal.predecessor_worktree_fingerprint,
      source_drift_fingerprint: seal.source_drift_fingerprint,
      post_drift_head: seal.post_drift_head,
      post_drift_tree: seal.post_drift_tree,
      post_drift_parent_head: seal.post_drift_parent_head,
      post_drift_current_source_fingerprint: seal.post_drift_current_source_fingerprint,
      post_drift_parent_is_predecessor_head: true,
      clone_baselines: seal.clone_baselines,
      predecessor_checkpoint_source: checkpoint,
      cohort_plan_source: input.plan,
    });
    if (canonicalizeProtocolValueV01(rebuiltSeal) !== canonicalizeProtocolValueV01(seal)) {
      failV01("live_training_artifact_clone_seal_rebuild_invalid");
    }
  }

  const joinBySlot = new Map(joins.map((join) => [join.slot_id, join] as const));
  if (joinBySlot.size !== 12) failV01("live_training_artifact_analysis_join_duplicate");
  for (const slot of input.plan.slots.filter((candidate) => candidate.slot_role === "cold_successor")) {
    const join = joinBySlot.get(slot.slot_id);
    const blind = orderedBlinds[input.plan.slots.findIndex((candidate) => candidate.slot_id === slot.slot_id)];
    if (!join || !blind) failV01("live_training_artifact_analysis_join_missing");
    const rebuiltJoin = buildCommissionedLiveTrainingAnalysisJoinV01({
      join_id: join.join_id,
      slot,
      blind_observation: blind,
      joined_at: join.joined_at,
    });
    if (canonicalizeProtocolValueV01(rebuiltJoin) !== canonicalizeProtocolValueV01(join)) {
      failV01("live_training_artifact_analysis_join_rebuild_invalid");
    }
  }

  const trainingResult = trainingResults[0]!;
  const rebuiltTraining = buildCommissionedWorkTrainingResultV01({
    manifest: input.family,
    predecessor_episodes: predecessorEpisodes,
    successor_episodes: successorEpisodes,
  });
  if (canonicalizeProtocolValueV01(rebuiltTraining) !== canonicalizeProtocolValueV01(trainingResult)) {
    failV01("live_training_artifact_training_result_rebuild_invalid");
  }
  const checkpointTuple = predecessorEpisodes.map((episode) => checkpointByCase.get(episode.case_id)!) as [
    CommissionedWorkEpisodeCheckpointV01,
    CommissionedWorkEpisodeCheckpointV01,
    CommissionedWorkEpisodeCheckpointV01,
  ];
  const cloneTuple = predecessorEpisodes.map((episode) => cloneSealByCase.get(
    episode.case_id as CommissionedLiveTrainingCloneSealV01["case_id"],
  )!) as [CommissionedLiveTrainingCloneSealV01, CommissionedLiveTrainingCloneSealV01, CommissionedLiveTrainingCloneSealV01];
  const liveResult = liveResults[0]!;
  const rebuiltLiveResult = buildCommissionedLiveTrainingResultV01({
    result_id: liveResult.result_id,
    plan: input.plan,
    authorization: input.authorization,
    authorization_consumption_ref: createCommissionedWorkRecordRefV01({
      record_version: consumption.consumption_version,
      record_id: consumption.consumption_id,
      record_fingerprint: consumption.integrity.fingerprint,
    }),
    attempt_registry: registry,
    training_result: trainingResult,
    predecessor_checkpoints: checkpointTuple,
    clone_seals: cloneTuple,
    blind_observations: orderedBlinds,
    analysis_joins: joins,
  });
  if (canonicalizeProtocolValueV01(rebuiltLiveResult) !== canonicalizeProtocolValueV01(liveResult)) {
    failV01("live_training_artifact_live_result_rebuild_invalid");
  }
  const assessment = assessments[0]!;
  const rebuiltAssessment = buildCommissionedLiveTrainingCandidateAssessmentV01({
    assessment_id: assessment.assessment_id,
    family_manifest: input.family,
    plan: input.plan,
    authorization: input.authorization,
    training_result: trainingResult,
    episodes: orderedEpisodes,
    blind_observations: orderedBlinds,
    attempt_registry: registry,
    assessor_role_id: assessment.assessor_role_ref.role_id,
  });
  if (canonicalizeProtocolValueV01(rebuiltAssessment) !== canonicalizeProtocolValueV01(assessment)) {
    failV01("live_training_artifact_candidate_assessment_rebuild_invalid");
  }
  const cleanup = cleanupReports[0]!;
  const observation = cleanup.cleanup_observation;
  const rebuiltCleanupObservation = buildCommissionedLiveTrainingCleanupObservationV01({
    observation_id: observation.observation_id,
    cohort_plan_ref: observation.cohort_plan_ref,
    native_host_invocations_started: observation.native_host_invocations_started,
    exact_adapter_settlement_fingerprints: observation.exact_adapter_settlement_fingerprints,
    every_started_adapter_invocation_settled:
      observation.every_started_adapter_invocation_settled,
    listener_owner_kind: observation.listener_owner_kind,
    repository_roots_absent: observation.repository_roots_absent,
    runtime_roots_absent: observation.runtime_roots_absent,
    temporary_roots_absent: observation.temporary_roots_absent,
    artifact_temporaries_absent: observation.artifact_temporaries_absent,
    task_external_network_attempts: observation.task_external_network_attempts,
    observed_at: observation.observed_at,
  });
  const rebuiltCleanup = buildCommissionedLiveTrainingCleanupReportV01({
    cleanup_id: cleanup.cleanup_id,
    cohort_plan_ref: cleanup.cohort_plan_ref,
    requested: cleanup.requested,
    completed: cleanup.completed,
    owned_processes_remaining: cleanup.owned_processes_remaining,
    owned_listeners_remaining: cleanup.owned_listeners_remaining,
    owned_repository_roots_remaining: cleanup.owned_repository_roots_remaining,
    owned_runtime_roots_remaining: cleanup.owned_runtime_roots_remaining,
    owned_temporary_roots_remaining: cleanup.owned_temporary_roots_remaining,
    stale_artifact_temporaries_remaining: cleanup.stale_artifact_temporaries_remaining,
    task_external_network_attempts: cleanup.task_external_network_attempts,
    provider_calls_observed: cleanup.provider_calls_observed,
    model_calls_observed: cleanup.model_calls_observed,
    cleanup_observation: rebuiltCleanupObservation,
    cleanup_observation_ref: commissionedLiveTrainingRecordRefV01(rebuiltCleanupObservation),
  });
  if (
    canonicalizeProtocolValueV01(rebuiltCleanupObservation) !== canonicalizeProtocolValueV01(observation) ||
    canonicalizeProtocolValueV01(rebuiltCleanup) !== canonicalizeProtocolValueV01(cleanup) ||
    canonicalizeProtocolValueV01(observation.cohort_plan_ref) !==
      canonicalizeProtocolValueV01(
        commissionedLiveTrainingRecordRefV01(input.plan),
      ) ||
    canonicalizeProtocolValueV01(cleanup.cohort_plan_ref) !==
      canonicalizeProtocolValueV01(
        commissionedLiveTrainingRecordRefV01(input.plan),
      ) ||
    observation.native_host_invocations_started !== starts.length ||
    observation.exact_adapter_settlement_fingerprints.length !== starts.length
  ) {
    failV01("live_training_artifact_cleanup_graph_invalid");
  }
}

function readPersistedAttemptArtifactsV01(
  store: CommissionedLiveTrainingArtifactStoreInitializationV01,
): {
  starts: CommissionedLiveTrainingAttemptStartV01[];
  admissions: CommissionedLiveTrainingAttemptAdmissionV01[];
  terminals: CommissionedLiveTrainingAttemptTerminalV01[];
} {
  const attemptsRoot = resolveWithinV01(store.run_root, "attempts");
  if (!existsSync(attemptsRoot)) {
    return { starts: [], admissions: [], terminals: [] };
  }
  const starts: CommissionedLiveTrainingAttemptStartV01[] = [];
  const admissions: CommissionedLiveTrainingAttemptAdmissionV01[] = [];
  const terminals: CommissionedLiveTrainingAttemptTerminalV01[] = [];
  for (const entry of listDirectoryEntriesV01(store.artifact_anchor, attemptsRoot)) {
    const file = entry.name;
    if (entry.kind !== "file") {
      failV01("live_training_attempt_artifact_kind_invalid");
    }
    if (!SAFE_SEGMENT_V01.test(file)) {
      failV01("live_training_attempt_artifact_file_name_invalid");
    }
    const target = resolveWithinV01(attemptsRoot, file);
    if (file.endsWith("-start.json")) {
      const value = readJsonFileV01<CommissionedLiveTrainingAttemptStartV01>(
        store.artifact_anchor,
        target,
        "live_training_attempt_start_artifact_invalid",
      );
      assertRecordIntegrityForSlotV01("attempt_start", value);
      starts.push(value);
    } else if (file.endsWith("-admission.json")) {
      const value = readJsonFileV01<CommissionedLiveTrainingAttemptAdmissionV01>(
        store.artifact_anchor,
        target,
        "live_training_attempt_admission_artifact_invalid",
      );
      assertRecordIntegrityForSlotV01("attempt_admission", value);
      admissions.push(value);
    } else if (file.endsWith("-terminal.json")) {
      const value = readJsonFileV01<CommissionedLiveTrainingAttemptTerminalV01>(
        store.artifact_anchor,
        target,
        "live_training_attempt_terminal_artifact_invalid",
      );
      assertRecordIntegrityForSlotV01("attempt_terminal", value);
      terminals.push(value);
    } else {
      failV01("live_training_attempt_artifact_kind_invalid");
    }
  }
  return { starts, admissions, terminals };
}

function readPersistedCompletedEpisodeArtifactsV01(
  store: CommissionedLiveTrainingArtifactStoreInitializationV01,
): {
  episodes: CommissionedWorkEpisodeArtifactV01[];
  blind_observations: CommissionedLiveTrainingBlindObjectiveObservationV01[];
} {
  const episodes: CommissionedWorkEpisodeArtifactV01[] = [];
  const blindObservations: CommissionedLiveTrainingBlindObjectiveObservationV01[] = [];
  const readDirectory = <T>(
    directoryName: "episodes" | "blind-observations",
    slotKind: "episode" | "blind_objective_observation",
  ): T[] => {
    const directory = resolveWithinV01(store.run_root, directoryName);
    if (!existsSync(directory)) return [];
    return listDirectoryEntriesV01(store.artifact_anchor, directory)
      .map((entry) => {
        const file = entry.name;
        if (entry.kind !== "file") {
          failV01("live_training_completed_episode_file_kind_invalid");
        }
        if (!SAFE_SEGMENT_V01.test(file) || !file.endsWith(".json")) {
          failV01("live_training_completed_episode_file_name_invalid");
        }
        const value = readJsonFileV01<T>(
          store.artifact_anchor,
          resolveWithinV01(directory, file),
          "live_training_completed_episode_artifact_invalid",
        );
        assertRecordIntegrityForSlotV01(slotKind, value);
        return value;
      });
  };
  episodes.push(...readDirectory<CommissionedWorkEpisodeArtifactV01>(
    "episodes",
    "episode",
  ));
  blindObservations.push(
    ...readDirectory<CommissionedLiveTrainingBlindObjectiveObservationV01>(
      "blind-observations",
      "blind_objective_observation",
    ),
  );
  return { episodes, blind_observations: blindObservations };
}

function addExistingExternalEntryV01(
  store: CommissionedLiveTrainingArtifactStoreInitializationV01,
  entries: CommissionedLiveTrainingArtifactIndexEntryV01[],
  slotKind: CommissionedLiveTrainingArtifactIndexEntryV01["slot_kind"],
  value: unknown,
  relativePath: string,
  recordRef: CommissionedWorkRecordRefV01,
): void {
  const target = resolveWithinV01(
    store.live_training_root,
    ...relativePath.replace(/^\.\.\//u, "").split("/"),
  );
  const text = readFileExactV01(store.artifact_anchor, target);
  if (text !== canonicalizeProtocolValueV01(value)) {
    failV01("live_training_artifact_existing_content_changed");
  }
  entries.push({
    slot_kind: slotKind,
    record_ref: recordRef,
    slot_id: null,
    attempt_id: null,
    case_id: null,
    relative_path: relativePath,
    content_fingerprint: createProtocolSha256V01(text),
  });
  assertContainedV01(store.live_training_root, target);
  assertContainedV01(path.dirname(store.run_root), target);
}

function addExistingEntryV01(
  store: CommissionedLiveTrainingArtifactStoreInitializationV01,
  entries: CommissionedLiveTrainingArtifactIndexEntryV01[],
  slotKind: CommissionedLiveTrainingArtifactIndexEntryV01["slot_kind"],
  value: unknown,
  relativePath: string,
  recordRef: CommissionedWorkRecordRefV01,
  slotId: string | null,
  attemptId: string | null,
  caseId: string | null,
): void {
  const target = resolveWithinV01(store.run_root, ...relativePath.split("/"));
  const text = readFileExactV01(store.artifact_anchor, target);
  if (text !== canonicalizeProtocolValueV01(value)) {
    failV01("live_training_artifact_existing_content_changed");
  }
  entries.push({
    slot_kind: slotKind,
    record_ref: recordRef,
    slot_id: slotId,
    attempt_id: attemptId,
    case_id: caseId,
    relative_path: relativePath,
    content_fingerprint: createProtocolSha256V01(text),
  });
}

function writeIndexedV01(
  store: CommissionedLiveTrainingArtifactStoreInitializationV01,
  entries: CommissionedLiveTrainingArtifactIndexEntryV01[],
  slotKind: CommissionedLiveTrainingArtifactIndexEntryV01["slot_kind"],
  value: unknown,
  relativePath: string,
  recordRef: CommissionedWorkRecordRefV01,
  slotId: string | null,
  attemptId: string | null,
  caseId: string | null,
): void {
  assertSafeCommissionedLiveTrainingOutputV01(value);
  writeCanonicalExclusiveV01(
    store.artifact_anchor,
    store.run_root,
    relativePath.split("/"),
    value,
  );
  entries.push({
    slot_kind: slotKind,
    record_ref: recordRef,
    slot_id: slotId,
    attempt_id: attemptId,
    case_id: caseId,
    relative_path: relativePath,
    content_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(value),
    ),
  });
}

function slotIdFromEpisodeV01(episode: CommissionedWorkEpisodeArtifactV01): string {
  const match = /(?:^|:)commissioned-episode-(\d{3})(?:-replacement-1)?$/u.exec(
    episode.episode_id,
  );
  if (match) return `cw1l1-slot-${match[1]}`;
  const direct = /cw1l1-slot-\d{3}/u.exec(episode.episode_id)?.[0];
  if (direct) return direct;
  failV01("live_training_episode_slot_identity_missing");
}

function predecessorSlotIdFromCheckpointV01(
  plan: CommissionedLiveTrainingCohortPlanV01,
  predecessorEpisodeId: string,
): string {
  const match = /(?:^|:)commissioned-episode-(\d{3})(?:-replacement-1)?$/u.exec(
    predecessorEpisodeId,
  );
  const slotId = match ? `cw1l1-slot-${match[1]}` : null;
  if (!slotId || !plan.slots.some((slot) => slot.slot_id === slotId)) {
    failV01("live_training_checkpoint_slot_identity_missing");
  }
  return slotId;
}

function writeCanonicalExclusiveV01(
  anchor: CommissionedLiveTrainingArtifactAnchorV01,
  root: string,
  segments: string[],
  value: unknown,
): void {
  const target = resolveWithinV01(root, ...segments);
  ensureDirectoryChainWithoutSymlinksV01(anchor, path.dirname(target));
  writeCanonicalExclusiveAbsoluteV01(anchor, target, value);
}

function writeCanonicalExclusiveAbsoluteV01(
  anchor: CommissionedLiveTrainingArtifactAnchorV01,
  target: string,
  value: unknown,
): void {
  const text = canonicalizeProtocolValueV01(value);
  const result = secureArtifactIoV01(anchor, "write", target, text);
  if (result.status !== 0) {
    if (result.stderr.includes("FileExistsError")) {
      failV01("live_training_artifact_exclusive_write_exists");
    }
    failV01("live_training_artifact_exclusive_write_refused");
  }
}

function readJsonFileV01<T>(
  anchor: CommissionedLiveTrainingArtifactAnchorV01,
  target: string,
  code: string,
): T {
  const text = readFileExactV01(anchor, target);
  try {
    return JSON.parse(text) as T;
  } catch {
    failV01(code);
  }
}

function readFileExactV01(
  anchor: CommissionedLiveTrainingArtifactAnchorV01,
  target: string,
): string {
  const result = secureArtifactIoV01(anchor, "read", target, null);
  if (result.status !== 0) {
    if (result.stderr.includes("FileNotFoundError")) {
      failV01("live_training_artifact_missing");
    }
    failV01("live_training_artifact_not_exact_file");
  }
  return result.stdout;
}

function resolveWithinV01(root: string, ...segments: string[]): string {
  segments.forEach((segment) => {
    if (!SAFE_SEGMENT_V01.test(segment) || segment === "." || segment === "..") {
      failV01("live_training_artifact_path_segment_invalid");
    }
  });
  const target = path.resolve(root, ...segments);
  assertContainedV01(root, target);
  return target;
}

function ensureDirectoryChainWithoutSymlinksV01(
  anchor: CommissionedLiveTrainingArtifactAnchorV01,
  target: string,
): void {
  if (target === anchor.root) return;
  const result = secureArtifactIoV01(anchor, "ensure_dir", target, null);
  if (result.status !== 0) {
    failV01("live_training_artifact_directory_identity_invalid");
  }
  pinDirectoryChainV01(anchor, target);
}

function createArtifactAnchorV01(
  repositoryRoot: string,
): CommissionedLiveTrainingArtifactAnchorV01 {
  const root = realpathSync(repositoryRoot);
  const stat = lstatSync(root, { bigint: true });
  if (!stat.isDirectory() || stat.isSymbolicLink()) {
    failV01("live_training_artifact_repository_anchor_invalid");
  }
  return {
    root,
    device: String(stat.dev),
    inode: String(stat.ino),
    pinned_directories: {},
  };
}

function secureArtifactIoV01(
  anchor: CommissionedLiveTrainingArtifactAnchorV01,
  operation:
    | "ensure_dir"
    | "ensure_dir_exclusive"
    | "directory_identity"
    | "list_directory"
    | "write"
    | "read",
  target: string,
  input: string | null,
): { status: number | null; stdout: string; stderr: string } {
  assertContainedV01(anchor.root, target);
  const relative = path.relative(anchor.root, target);
  const segments = relative.split(path.sep).filter(Boolean);
  if (
    segments.length === 0 ||
    segments.some(
      (segment) =>
        !SAFE_SEGMENT_V01.test(segment) || segment === "." || segment === "..",
    )
  ) {
    failV01("live_training_artifact_path_segment_invalid");
  }
  assertTrustedArtifactIoHelperV01();
  let rootDescriptor: number;
  try {
    rootDescriptor = openSync(
      anchor.root,
      constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW,
    );
  } catch {
    failV01("live_training_artifact_repository_anchor_invalid");
  }
  try {
    const descriptorStat = fstatSync(rootDescriptor, { bigint: true });
    const linkedStat = lstatSync(anchor.root, { bigint: true });
    if (
      !descriptorStat.isDirectory() ||
      linkedStat.isSymbolicLink() ||
      !linkedStat.isDirectory() ||
      String(descriptorStat.dev) !== anchor.device ||
      String(descriptorStat.ino) !== anchor.inode ||
      descriptorStat.dev !== linkedStat.dev ||
      descriptorStat.ino !== linkedStat.ino
    ) {
      failV01("live_training_artifact_repository_anchor_changed");
    }
    const testHook = artifactIoOneShotTestHookV01;
    artifactIoOneShotTestHookV01 = null;
    testHook?.({
      operation,
      repository_relative_path: segments.join("/"),
    });
    const result = spawnSync(
      "/usr/bin/python3",
      [
        "-I",
        "-S",
        "-c",
        SECURE_ARTIFACT_IO_HELPER_V01,
        operation,
        JSON.stringify(segments),
        anchor.device,
        anchor.inode,
        JSON.stringify(anchor.pinned_directories),
      ],
      {
        input: input ?? undefined,
        encoding: "utf8",
        timeout: 5_000,
        maxBuffer: MAX_SECURE_IO_BYTES_V01 + 65_536,
        env: { PATH: "/usr/bin:/bin", NODE_ENV: "production" },
        stdio: ["pipe", "pipe", "pipe", rootDescriptor],
      },
    );
    const linkedAfter = lstatSync(anchor.root, { bigint: true });
    if (
      linkedAfter.isSymbolicLink() ||
      String(linkedAfter.dev) !== anchor.device ||
      String(linkedAfter.ino) !== anchor.inode
    ) {
      failV01("live_training_artifact_repository_anchor_changed");
    }
    return {
      status: result.status,
      stdout: result.stdout ?? "",
      stderr: result.stderr ?? "",
    };
  } finally {
    closeSync(rootDescriptor);
  }
}

function pinDirectoryChainV01(
  anchor: CommissionedLiveTrainingArtifactAnchorV01,
  target: string,
): void {
  assertContainedV01(anchor.root, target);
  const segments = path.relative(anchor.root, target).split(path.sep).filter(Boolean);
  for (let index = 1; index <= segments.length; index += 1) {
    const relativePath = segments.slice(0, index).join("/");
    if (anchor.pinned_directories[relativePath] !== undefined) {
      continue;
    }
    const directory = path.join(anchor.root, ...segments.slice(0, index));
    const result = secureArtifactIoV01(
      anchor,
      "directory_identity",
      directory,
      null,
    );
    if (result.status !== 0) {
      failV01("live_training_artifact_directory_identity_invalid");
    }
    let identity: { device: string; inode: string };
    try {
      identity = JSON.parse(result.stdout) as { device: string; inode: string };
    } catch {
      failV01("live_training_artifact_directory_identity_invalid");
    }
    if (
      !/^\d+$/u.test(identity.device) ||
      !/^[1-9]\d*$/u.test(identity.inode)
    ) {
      failV01("live_training_artifact_directory_identity_changed");
    }
    anchor.pinned_directories[relativePath] = identity;
  }
}

function createExclusivePinnedDirectoryV01(
  anchor: CommissionedLiveTrainingArtifactAnchorV01,
  target: string,
): void {
  ensureDirectoryChainWithoutSymlinksV01(anchor, path.dirname(target));
  const result = secureArtifactIoV01(
    anchor,
    "ensure_dir_exclusive",
    target,
    null,
  );
  if (result.status !== 0) {
    if (result.stderr.includes("FileExistsError")) {
      failV01("live_training_authorization_replay_refused");
    }
    failV01("live_training_artifact_directory_identity_invalid");
  }
  pinDirectoryChainV01(anchor, target);
}

function listDirectoryEntriesV01(
  anchor: CommissionedLiveTrainingArtifactAnchorV01,
  target: string,
): Array<{ name: string; kind: "directory" | "file" | "other" }> {
  const result = secureArtifactIoV01(anchor, "list_directory", target, null);
  if (result.status !== 0) {
    failV01("live_training_artifact_directory_identity_invalid");
  }
  try {
    const entries = JSON.parse(result.stdout) as Array<{
      name: string;
      kind: "directory" | "file" | "other";
    }>;
    if (
      !Array.isArray(entries) ||
      entries.some(
        (entry) =>
          !entry ||
          typeof entry.name !== "string" ||
          !["directory", "file", "other"].includes(entry.kind),
      )
    ) {
      failV01("live_training_artifact_directory_listing_invalid");
    }
    return entries;
  } catch (error) {
    if (error instanceof CommissionedLiveTrainingArtifactStoreErrorV01) throw error;
    failV01("live_training_artifact_directory_listing_invalid");
  }
}

function assertTrustedArtifactIoHelperV01(): void {
  try {
    const stats = lstatSync("/usr/bin/python3");
    if (
      !stats.isFile() ||
      stats.isSymbolicLink() ||
      stats.uid !== 0 ||
      (stats.mode & 0o022) !== 0
    ) {
      failV01("live_training_artifact_io_helper_untrusted");
    }
  } catch (error) {
    if (error instanceof CommissionedLiveTrainingArtifactStoreErrorV01) throw error;
    failV01("live_training_artifact_io_helper_untrusted");
  }
}

function assertExistingAncestorsNotSymlinksV01(root: string, target: string): void {
  assertContainedV01(root, target);
  const relative = path.relative(root, target);
  let cursor = root;
  for (const segment of relative.split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, segment);
    if (!existsSync(cursor)) continue;
    if (lstatSync(cursor).isSymbolicLink()) {
      failV01("live_training_artifact_symlink_refused");
    }
  }
}

function assertContainedV01(root: string, target: string): void {
  const relative = path.relative(root, target);
  if (relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative))) {
    return;
  }
  failV01("live_training_artifact_path_escape_refused");
}

function safeSegmentV01(value: string): string {
  if (!SAFE_SEGMENT_V01.test(value) || value === "." || value === "..") {
    failV01("live_training_artifact_identifier_invalid");
  }
  return value;
}

function listFilesRecursivelyV01(
  anchor: CommissionedLiveTrainingArtifactAnchorV01,
  root: string,
): string[] {
  const files: string[] = [];
  const visit = (directory: string): void => {
    pinDirectoryChainV01(anchor, directory);
    for (const entry of listDirectoryEntriesV01(anchor, directory)) {
      const target = path.join(directory, entry.name);
      if (entry.kind === "directory") visit(target);
      else if (entry.kind === "file") files.push(path.relative(root, target).replaceAll(path.sep, "/"));
      else failV01("live_training_artifact_special_file_refused");
    }
  };
  visit(root);
  return files;
}

function failV01(code: string): never {
  // Preserve a separate store owner while allowing callers to catch one exact
  // live-training contract family.
  if (code.startsWith("live_training_authorization_") || code.startsWith("live_training_artifact_")) {
    throw new CommissionedLiveTrainingArtifactStoreErrorV01(code);
  }
  throw new CommissionedControlledLiveTrainingErrorV01(code);
}
