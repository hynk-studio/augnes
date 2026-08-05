import type Database from "better-sqlite3";

import {
  readAutonomyRunLedgerRecord,
  readLatestManagedLiveAutonomyRunSummaryV01,
} from "@/lib/autonomy/runner-ledger";
import { canonicalizeProtocolValueV01, createProtocolSha256V01 } from "@/lib/vnext/protocol-primitives";
import { readCanonicalProjectWithRootV01 } from "@/lib/vnext/persistence/project-identity-registry";
import {
  consumeRepositoryExecutionAttachmentInsideTransactionV01,
  readOpenRepositoryExecutionDecisionV01,
  readPhysicalRootBaselineV01,
  readRepositoryExecutionDecisionRequestV01,
  readRepositoryExecutionAttachmentV01,
} from "@/lib/vnext/persistence/repository-execution-store";
import {
  assertGrantedRepositoryExecutionDecisionInsideTransactionV01,
  consumeRepositoryExecutionDecisionInsideTransactionV01,
  createRepositoryExecutionDecisionRequestV01,
  fingerprintProjectRootBindingV01,
  inspectPhysicalRootForExecutionV01,
  readExpectedDatabaseAdmissionStateV01,
  RepositoryExecutionErrorV01,
  type RepositoryExecutionDependenciesV01,
} from "@/lib/vnext/repository-execution/repository-execution";
import {
  inspectProtectedUntrackedPathsV01,
  inspectRepositoryWorktreeV01,
  type ProtectedUntrackedPathsV01,
} from "@/lib/vnext/repository-execution/worktree-observation";
import type { LiveNativeHostRunServiceV01 } from "@/lib/vnext/runtime/live-native-host-run-service";
import type { NativeHostRepositoryDelegationContextV01 } from "@/types/vnext/native-host-adapter";
import type { VNextLocalOperatorPilotConfigV01 } from "@/lib/vnext/runtime/local-operator-session";
import {
  REPOSITORY_EXECUTION_ENVELOPE_VERSION_V01,
  REPOSITORY_MANAGED_DELEGATION_START_VERSION_V01,
  type RepositoryExecutionEnvelopeV01,
  type RepositoryManagedDelegationAuthorityV01,
  type RepositoryManagedDelegationCancellationResultV01,
  type RepositoryManagedDelegationExpectedStateV01,
  type RepositoryManagedDelegationPreparationV01,
  type RepositoryManagedDelegationStartResultV01,
} from "@/types/vnext/repository-managed-delegation";
import type {
  PhysicalRootBaselineV01,
  PhysicalRootObservationV01,
  RepositoryExecutionAttachmentV01,
  RepositoryWorktreeObservationV01,
} from "@/types/vnext/repository-execution";

const START_DECISION_MAX_AGE_MS = 15 * 60 * 1_000;
const MAX_CHANGED_FILES = 128;
const MAX_ARTIFACTS = 128;
const MAX_COMMANDS = 128;
const MAX_CHECKS = 128;

export class RepositoryManagedDelegationErrorV01 extends Error {
  constructor(readonly code: string, readonly status = 409) {
    super(code);
    this.name = "RepositoryManagedDelegationErrorV01";
  }
}

export interface RepositoryManagedDelegationDependenciesV01
  extends RepositoryExecutionDependenciesV01 {
  inspect_protected_untracked_paths?: typeof inspectProtectedUntrackedPathsV01;
  before_start_transaction?: () => void;
  after_run_claim_admitted_inside_transaction?: () => void;
  after_attachment_consumed_inside_transaction?: () => void;
  after_decision_consumed_inside_transaction?: () => void;
  after_start_transaction_commit?: (input: {
    attachment_id: string;
    run_id: string;
  }) => void | Promise<void>;
  after_post_commit_launch_gate?: (input: {
    attachment_id: string;
    run_id: string;
  }) => void | Promise<void>;
}

const PREPARATION_AUTHORITY = Object.freeze({
  attachment_consumed: false,
  managed_run_created: false,
  worker_started: false,
  project_files_may_be_written: false,
  project_commands_may_be_executed: false,
  provider_egress_may_occur: false,
  arbitrary_network_access_granted: false,
  github_authority_granted: false,
  release_authority_granted: false,
  semantic_authority_granted: false,
  decision_created: false,
  transition_created: false,
  accepted_state_mutated: false,
  work_closed: false,
}) satisfies RepositoryManagedDelegationAuthorityV01;

export async function prepareRepositoryManagedDelegationV01(
  db: Database.Database,
  input: { workspace_id: string; project_id: string; attachment_id: string },
  service: LiveNativeHostRunServiceV01,
  dependencies: RepositoryManagedDelegationDependenciesV01 = {},
): Promise<RepositoryManagedDelegationPreparationV01> {
  const now = strictNowV01(dependencies.now);
  const material = await observeStartMaterialV01(db, input, service, dependencies, now);
  if (material.status === "blocked") return material.preparation;

  const existing = readOpenRepositoryExecutionDecisionV01(db, {
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    action: "start_repository_managed_delegation",
  });
  let requestedAt = now;
  let expiresAt = new Date(Date.parse(now) + START_DECISION_MAX_AGE_MS).toISOString();
  if (existing && Date.parse(existing.expires_at) > Date.parse(now)) {
    try {
      const expected = JSON.parse(existing.expected_state_json) as Partial<RepositoryManagedDelegationExpectedStateV01>;
      requestedAt = typeof expected.requested_at === "string" ? expected.requested_at : requestedAt;
      expiresAt = typeof expected.expires_at === "string" ? expected.expires_at : expiresAt;
    } catch {
      // A malformed canonical request cannot be replayed. The decision owner
      // will supersede it through the exact expected-state comparison below.
    }
  }
  const expectedState = buildExpectedStateV01(material, requestedAt, expiresAt);
  const decision = createRepositoryExecutionDecisionRequestV01(db, {
    action: "start_repository_managed_delegation",
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    expected_state: { ...expectedState },
  }, {
    now: () => requestedAt,
    max_age_ms: Math.max(1, Date.parse(expiresAt) - Date.parse(requestedAt)),
  });
  return {
    preparation_version: "repository_managed_delegation_preparation.v0.1",
    status: "decision_required",
    ordinary_text: decision.ordinary_text,
    project: {
      project_id: material.attachment.project_id,
      display_name: material.registration.project.display_name,
    },
    attachment_id: material.attachment.attachment_id,
    execution_envelope: material.envelope,
    decision_request: decision,
    authority: PREPARATION_AUTHORITY,
  };
}

export async function startRepositoryManagedDelegationV01(
  db: Database.Database,
  input: {
    config: VNextLocalOperatorPilotConfigV01;
    workspace_id: string;
    project_id: string;
    attachment_id: string;
    expected_attachment_binding_fingerprint: string;
    expected_execution_envelope_fingerprint: string;
    decision_request_fingerprint: string;
    decision_grant_fingerprint: string;
  },
  service: LiveNativeHostRunServiceV01,
  dependencies: RepositoryManagedDelegationDependenciesV01 = {},
): Promise<RepositoryManagedDelegationStartResultV01> {
  if (
    input.config.workspace_id !== input.workspace_id ||
    input.config.project_id !== input.project_id
  ) {
    throw new RepositoryManagedDelegationErrorV01("repository_delegation_config_scope_mismatch");
  }
  const replayAttachment = readRepositoryExecutionAttachmentV01(db, input.attachment_id);
  if (replayAttachment?.lifecycle === "consumed") {
    return exactConsumedReplayV01(db, input, replayAttachment, service);
  }

  const now = strictNowV01(dependencies.now);
  const material = await observeStartMaterialV01(db, input, service, dependencies, now);
  if (material.status === "blocked") {
    throw new RepositoryManagedDelegationErrorV01(material.reason, material.status_code);
  }
  if (
    material.attachment.binding_fingerprint !==
      input.expected_attachment_binding_fingerprint ||
    material.envelope.envelope_fingerprint !==
      input.expected_execution_envelope_fingerprint
  ) {
    throw new RepositoryManagedDelegationErrorV01("repository_delegation_expected_state_mismatch");
  }
  const request = readOpenRepositoryExecutionDecisionV01(db, {
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    action: "start_repository_managed_delegation",
  });
  if (!request || request.request_fingerprint !== input.decision_request_fingerprint) {
    throw new RepositoryManagedDelegationErrorV01("repository_delegation_decision_mismatch");
  }
  const expectedState = buildExpectedStateV01(
    material,
    request.requested_at,
    request.expires_at,
  );
  const expectedStateFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01(expectedState),
  );
  if (expectedStateFingerprint !== request.expected_state_fingerprint) {
    throw new RepositoryManagedDelegationErrorV01("repository_delegation_expected_state_changed");
  }
  const context = buildNativeHostContextV01(
    material.attachment,
    material.envelope,
    request.request_fingerprint,
    material.protected_untracked_paths,
  );
  dependencies.before_start_transaction?.();
  let prepared!: Awaited<
    ReturnType<LiveNativeHostRunServiceV01["prepareRepositoryDelegationRunClaimInsideTransactionV01"]>
  >;
  db.exec("BEGIN IMMEDIATE");
  try {
    const decision = assertGrantedRepositoryExecutionDecisionInsideTransactionV01(db, {
      action: "start_repository_managed_delegation",
      workspace_id: input.workspace_id,
      project_id: input.project_id,
      expected_state_fingerprint: expectedStateFingerprint,
      decision_request_fingerprint: input.decision_request_fingerprint,
      decision_grant_fingerprint: input.decision_grant_fingerprint,
      now,
    });
    const exactAttachment = readRepositoryExecutionAttachmentV01(db, input.attachment_id);
    if (
      !exactAttachment ||
      exactAttachment.lifecycle !== "prepared" ||
      exactAttachment.consumed_run_id !== null ||
      canonicalizeProtocolValueV01(exactAttachment) !==
        canonicalizeProtocolValueV01(material.attachment)
    ) {
      throw new RepositoryManagedDelegationErrorV01("repository_delegation_attachment_stale");
    }
    const exactDatabase = readExpectedDatabaseAdmissionStateV01(db, {
      workspace_id: input.workspace_id,
      project_id: input.project_id,
      node_scope_fingerprint: exactAttachment.node_scope_fingerprint,
    });
    if (
      exactDatabase.expected_database_state_fingerprint !==
        material.database_state.expected_database_state_fingerprint ||
      exactDatabase.managed_run_conflict
    ) {
      throw new RepositoryManagedDelegationErrorV01("repository_delegation_database_state_changed");
    }
    prepared = await service.prepareRepositoryDelegationRunClaimInsideTransactionV01(db, {
      config: input.config,
      repository_delegation_context: context,
      packet_id: exactAttachment.task_context_packet_id,
      packet_fingerprint: exactAttachment.task_context_packet_fingerprint,
      claimed_at: now,
    });
    service.admitRepositoryDelegationRunClaimInsideTransactionV01(db, {
      config: input.config,
      repository_delegation_context: context,
      prepared,
    });
    dependencies.after_run_claim_admitted_inside_transaction?.();
    consumeRepositoryExecutionAttachmentInsideTransactionV01(db, {
      attachment_id: exactAttachment.attachment_id,
      expected_binding_fingerprint: exactAttachment.binding_fingerprint,
      consumed_run_id: prepared.claim.run_id,
      consumed_at: now,
    });
    dependencies.after_attachment_consumed_inside_transaction?.();
    const resultFingerprint = startResultFingerprintV01({
      attachment_id: exactAttachment.attachment_id,
      run_id: prepared.claim.run_id,
      envelope_fingerprint: material.envelope.envelope_fingerprint,
    });
    consumeRepositoryExecutionDecisionInsideTransactionV01(db, {
      request: decision,
      consumed_at: now,
      result_fingerprint: resultFingerprint,
    });
    dependencies.after_decision_consumed_inside_transaction?.();
    db.exec("COMMIT");
  } catch (error) {
    if (db.inTransaction) db.exec("ROLLBACK");
    if (error instanceof RepositoryManagedDelegationErrorV01) throw error;
    if (error instanceof RepositoryExecutionErrorV01) {
      throw new RepositoryManagedDelegationErrorV01(error.code, error.status);
    }
    throw error;
  }

  try {
    await dependencies.after_start_transaction_commit?.({
      attachment_id: material.attachment.attachment_id,
      run_id: prepared.claim.run_id,
    });
    await assertLaunchGateV01(db, material, prepared.claim.run_id, service, dependencies);
  } catch (error) {
    const reason = errorCodeV01(error, "repository_delegation_post_commit_state_changed");
    const projection = service.blockAdmittedRepositoryDelegationV01({
      config: input.config,
      run_id: prepared.claim.run_id,
      reason,
    });
    return startResultV01(
      "blocked",
      material.attachment,
      material.envelope,
      prepared.claim.run_id,
      projection,
      false,
    );
  }

  try {
    await dependencies.after_post_commit_launch_gate?.({
      attachment_id: material.attachment.attachment_id,
      run_id: prepared.claim.run_id,
    });
    const launched = await service.startAdmittedRepositoryDelegationV01({
      config: input.config,
      repository_delegation_context: context,
      claim: prepared.claim,
      before_adapter_invoke: async () => {
        await assertLaunchGateV01(db, material, prepared.claim.run_id, service, dependencies);
      },
    });
    return startResultV01(
      launched.status === "exact_replay" ? "exact_replay" : "accepted",
      material.attachment,
      material.envelope,
      prepared.claim.run_id,
      launched.projection,
      launched.status === "accepted",
    );
  } catch (error) {
    const projection = service.read(input.config);
    return startResultV01(
      "blocked",
      material.attachment,
      material.envelope,
      prepared.claim.run_id,
      projection,
      false,
      errorCodeV01(error, "repository_delegation_worker_launch_failed"),
    );
  }
}

export async function cancelRepositoryManagedDelegationV01(
  db: Database.Database,
  input: {
    config: VNextLocalOperatorPilotConfigV01;
    attachment_id: string;
    expected_attachment_binding_fingerprint: string;
    run_id: string;
    control_revision: number;
  },
  service: LiveNativeHostRunServiceV01,
): Promise<RepositoryManagedDelegationCancellationResultV01> {
  const attachment = readRepositoryExecutionAttachmentV01(db, input.attachment_id);
  if (
    !attachment ||
    attachment.lifecycle !== "consumed" ||
    attachment.consumed_run_id !== input.run_id ||
    attachment.binding_fingerprint !== input.expected_attachment_binding_fingerprint ||
    attachment.workspace_id !== input.config.workspace_id ||
    attachment.project_id !== input.config.project_id
  ) {
    throw new RepositoryManagedDelegationErrorV01(
      "repository_delegation_cancel_binding_mismatch",
    );
  }
  const cancelled = await service.cancelRepositoryDelegationV01({
    config: input.config,
    run_ref: input.run_id,
    attachment_id: input.attachment_id,
    expected_attachment_binding_fingerprint:
      input.expected_attachment_binding_fingerprint,
    control_revision: input.control_revision,
  });
  return {
    status: cancelled.outcome,
    ordinary_text: ordinaryCancellationTextV01(
      cancelled.outcome,
      cancelled.projection,
    ),
    attachment_id: input.attachment_id,
    run_id: input.run_id,
    projection: cancelled.projection,
    semantic_authority_granted: false as const,
    decision_created: false as const,
    transition_created: false as const,
    work_closed: false as const,
  };
}

type ExactStartMaterialV01 = {
  status: "exact";
  attachment: RepositoryExecutionAttachmentV01;
  registration: NonNullable<ReturnType<typeof readCanonicalProjectWithRootV01>>;
  baseline: PhysicalRootBaselineV01;
  physical: Extract<PhysicalRootObservationV01, { status: "exact" }>;
  worktree: Extract<RepositoryWorktreeObservationV01, { status: "exact" }>;
  protected_untracked_paths: ProtectedUntrackedPathsV01 & { status: "exact" };
  database_state: ReturnType<typeof readExpectedDatabaseAdmissionStateV01>;
  envelope: RepositoryExecutionEnvelopeV01;
};

async function observeStartMaterialV01(
  db: Database.Database,
  input: { workspace_id: string; project_id: string; attachment_id: string },
  service: LiveNativeHostRunServiceV01,
  dependencies: RepositoryManagedDelegationDependenciesV01,
  now: string,
): Promise<ExactStartMaterialV01 | {
  status: "blocked";
  reason: string;
  status_code: number;
  preparation: RepositoryManagedDelegationPreparationV01;
}> {
  const blocked = (reason: string, statusCode = 409) => ({
    status: "blocked" as const,
    reason,
    status_code: statusCode,
    preparation: {
      preparation_version: "repository_managed_delegation_preparation.v0.1" as const,
      status: "blocked" as const,
      ordinary_text: ordinaryBlockedTextV01(reason),
      project: null,
      attachment_id: null,
      execution_envelope: null,
      decision_request: null,
      authority: PREPARATION_AUTHORITY,
    },
  });
  if ((dependencies.platform ?? process.platform) !== "darwin") {
    return blocked("repository_managed_delegation_platform_unsupported", 422);
  }
  const attachment = readRepositoryExecutionAttachmentV01(db, input.attachment_id);
  if (
    !attachment ||
    attachment.workspace_id !== input.workspace_id ||
    attachment.project_id !== input.project_id ||
    attachment.lifecycle !== "prepared" ||
    attachment.consumed_run_id !== null
  ) {
    return blocked("repository_delegation_attachment_not_prepared");
  }
  if (Date.parse(now) >= Date.parse(attachment.freshness_policy.expires_at)) {
    return blocked("repository_delegation_attachment_expired");
  }
  const registration = readCanonicalProjectWithRootV01(db, input);
  if (!registration) return blocked("repository_delegation_project_unavailable", 404);
  const physical = await inspectPhysicalRootForExecutionV01(
    db,
    registration.root_binding.local_root.normalized_path,
    dependencies,
  );
  if (physical.status !== "exact" || physical.platform !== "darwin") {
    return blocked(`repository_delegation_${physical.status}`);
  }
  const baseline = readPhysicalRootBaselineV01(db, {
    ...input,
    node_scope_fingerprint: physical.node_scope_fingerprint,
  });
  if (!baseline || !physicalMatchesBaselineV01(physical, baseline)) {
    return blocked("repository_delegation_physical_root_mismatch");
  }
  const inspectWorktree = dependencies.inspect_worktree ?? inspectRepositoryWorktreeV01;
  const worktree = await inspectWorktree(
    registration.root_binding.local_root.normalized_path,
    { now: () => now },
  );
  if (worktree.status !== "exact") {
    return blocked(
      worktree.status === "non_git"
        ? "repository_managed_delegation_non_git_unsupported"
        : `repository_managed_delegation_worktree_${worktree.status}`,
    );
  }
  const inspectProtected = dependencies.inspect_protected_untracked_paths ??
    inspectProtectedUntrackedPathsV01;
  const protectedPaths = await inspectProtected(
    registration.root_binding.local_root.normalized_path,
  );
  if (
    protectedPaths.status !== "exact" ||
    protectedPaths.paths_fingerprint !== worktree.relevant_untracked_paths_fingerprint
  ) {
    return blocked("repository_managed_delegation_untracked_scope_ambiguous");
  }
  const capability = service.readCapabilityContractV01();
  const databaseState = readExpectedDatabaseAdmissionStateV01(db, {
    ...input,
    node_scope_fingerprint: attachment.node_scope_fingerprint,
  });
  if (
    databaseState.managed_run_conflict ||
    attachment.node_scope_fingerprint !== physical.node_scope_fingerprint ||
    attachment.physical_root_baseline_fingerprint !== baseline.baseline_fingerprint ||
    attachment.root_binding_fingerprint !== fingerprintProjectRootBindingV01(registration.root_binding) ||
    attachment.task_context_packet_id !== databaseState.task_context_packet_id ||
    attachment.task_context_packet_fingerprint !== databaseState.task_context_packet_fingerprint ||
    attachment.current_work_fingerprint !== databaseState.current_work_fingerprint ||
    attachment.managed_run_state_fingerprint !== databaseState.managed_run_state_fingerprint ||
    attachment.worktree_observation_fingerprint !== worktree.observation_fingerprint
  ) {
    return blocked("repository_delegation_attachment_stale");
  }
  const envelope = buildExecutionEnvelopeV01(capability, protectedPaths.paths_fingerprint);
  return {
    status: "exact",
    attachment,
    registration,
    baseline,
    physical,
    worktree,
    protected_untracked_paths: protectedPaths as ProtectedUntrackedPathsV01 & { status: "exact" },
    database_state: databaseState,
    envelope,
  };
}

async function assertLaunchGateV01(
  db: Database.Database,
  expected: ExactStartMaterialV01,
  runId: string,
  service: LiveNativeHostRunServiceV01,
  dependencies: RepositoryManagedDelegationDependenciesV01,
): Promise<void> {
  const root = expected.registration.root_binding.local_root.normalized_path;
  const physical = await inspectPhysicalRootForExecutionV01(db, root, dependencies);
  if (
    physical.status !== "exact" ||
    !physicalMatchesBaselineV01(physical, expected.baseline)
  ) {
    throw new RepositoryManagedDelegationErrorV01("repository_delegation_physical_root_changed");
  }
  const worktree = await (dependencies.inspect_worktree ?? inspectRepositoryWorktreeV01)(root, {
    now: dependencies.now,
  });
  const protectedPaths = await (
    dependencies.inspect_protected_untracked_paths ?? inspectProtectedUntrackedPathsV01
  )(root);
  const capability = service.readCapabilityContractV01();
  const envelope = buildExecutionEnvelopeV01(capability, protectedPaths.paths_fingerprint);
  const databaseState = readExpectedDatabaseAdmissionStateV01(db, {
    workspace_id: expected.attachment.workspace_id,
    project_id: expected.attachment.project_id,
    node_scope_fingerprint: expected.attachment.node_scope_fingerprint,
  });
  const attachment = readRepositoryExecutionAttachmentV01(db, expected.attachment.attachment_id);
  const run = readAutonomyRunLedgerRecord(runId, { db });
  const latestRun = readLatestManagedLiveAutonomyRunSummaryV01({
    workspace_id: expected.attachment.workspace_id,
    project_id: expected.attachment.project_id,
  }, db);
  if (
    worktree.status !== "exact" ||
    worktree.observation_fingerprint !== expected.worktree.observation_fingerprint ||
    protectedPaths.status !== "exact" ||
    protectedPaths.paths_fingerprint !== expected.protected_untracked_paths.paths_fingerprint ||
    envelope.envelope_fingerprint !== expected.envelope.envelope_fingerprint ||
    !attachment ||
    attachment.lifecycle !== "consumed" ||
    attachment.consumed_run_id !== runId ||
    attachment.binding_fingerprint !== expected.attachment.binding_fingerprint ||
    databaseState.root_binding_fingerprint !== expected.attachment.root_binding_fingerprint ||
    databaseState.physical_root_baseline_fingerprint !==
      expected.attachment.physical_root_baseline_fingerprint ||
    databaseState.task_context_packet_id !== expected.attachment.task_context_packet_id ||
    databaseState.task_context_packet_fingerprint !==
      expected.attachment.task_context_packet_fingerprint ||
    databaseState.current_work_fingerprint !== expected.attachment.current_work_fingerprint ||
    !run ||
    !["queued", "starting"].includes(run.status) ||
    latestRun?.run_id !== runId ||
    run.metadata.repository_attachment_id !== expected.attachment.attachment_id ||
    run.metadata.repository_execution_envelope_fingerprint !==
      expected.envelope.envelope_fingerprint ||
    run.metadata.adapter_version !== capability.adapter_version ||
    run.metadata.capability_version !== capability.capability_version
  ) {
    throw new RepositoryManagedDelegationErrorV01("repository_delegation_launch_gate_changed");
  }
}

function buildExecutionEnvelopeV01(
  capability: ReturnType<LiveNativeHostRunServiceV01["readCapabilityContractV01"]>,
  protectedUntrackedPathsFingerprint: string,
): RepositoryExecutionEnvelopeV01 {
  const material = {
    envelope_version: REPOSITORY_EXECUTION_ENVELOPE_VERSION_V01,
    platform: "darwin" as const,
    run_mode: "repository_attachment" as const,
    filesystem_scope: "exact_repository_root" as const,
    network_scope: "provider_egress_only" as const,
    provider_egress: capability.provider_egress,
    timeout_ms: capability.timeout_ms,
    stop_settle_timeout_ms: capability.stop_settle_timeout_ms,
    budgets: {
      max_changed_files: MAX_CHANGED_FILES,
      max_artifacts: MAX_ARTIFACTS,
      max_commands: MAX_COMMANDS,
      max_checks: MAX_CHECKS,
      max_correction_attempts: 1 as const,
    },
    allowed_operation_categories: [
      "repository_file_read",
      "repository_file_change_inside_exact_root",
      "bounded_local_repository_command",
      "test_typecheck_lint_format_build",
      "local_git_inspection_branch_and_commit",
      "bounded_correction_attempt",
    ],
    forbidden_operation_categories: [
      "filesystem_outside_exact_repository_root",
      "arbitrary_project_command_network_access",
      "dependency_download_or_installation",
      "git_push_or_remote_branch_creation",
      "github_api_pull_request_merge_or_settings",
      "release_deployment_publication_or_external_posting",
      "ambient_browser_companion_provider_database_runtime_or_os_credential_access",
      "outside_root_secret_material_access",
      "destructive_preexisting_untracked_data_mutation",
      "semantic_approval_decision_transition_or_work_closure",
      "another_attachment_run_project_or_automation_cycle",
    ],
    protected_untracked_paths_fingerprint: protectedUntrackedPathsFingerprint,
    adapter_version: capability.adapter_version,
    capability_version: capability.capability_version,
  };
  return {
    ...material,
    envelope_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(material),
    ),
  };
}

function buildExpectedStateV01(
  material: ExactStartMaterialV01,
  requestedAt: string,
  expiresAt: string,
): RepositoryManagedDelegationExpectedStateV01 {
  return {
    expected_state_version: "repository_managed_delegation_expected_state.v0.1",
    action: "start_repository_managed_delegation",
    workspace_id: material.attachment.workspace_id,
    project_id: material.attachment.project_id,
    attachment_id: material.attachment.attachment_id,
    attachment_binding_fingerprint: material.attachment.binding_fingerprint,
    expected_attachment_lifecycle: "prepared",
    node_scope_fingerprint: material.attachment.node_scope_fingerprint,
    physical_root_baseline_fingerprint: material.attachment.physical_root_baseline_fingerprint,
    root_binding_fingerprint: material.attachment.root_binding_fingerprint,
    task_context_packet_id: material.attachment.task_context_packet_id,
    task_context_packet_fingerprint: material.attachment.task_context_packet_fingerprint,
    current_work_fingerprint: material.attachment.current_work_fingerprint,
    project_execution_admission_fingerprint:
      material.attachment.project_execution_admission_fingerprint,
    worktree_observation_fingerprint: material.attachment.worktree_observation_fingerprint,
    managed_run_state_fingerprint: material.attachment.managed_run_state_fingerprint,
    expected_database_state_fingerprint:
      material.database_state.expected_database_state_fingerprint,
    execution_envelope_version: material.envelope.envelope_version,
    execution_envelope_fingerprint: material.envelope.envelope_fingerprint,
    native_host_adapter_version: material.envelope.adapter_version,
    native_host_capability_version: material.envelope.capability_version,
    run_mode: "repository_attachment",
    timeout_ms: material.envelope.timeout_ms,
    stop_settle_timeout_ms: material.envelope.stop_settle_timeout_ms,
    requested_at: requestedAt,
    expires_at: expiresAt,
  };
}

function buildNativeHostContextV01(
  attachment: RepositoryExecutionAttachmentV01,
  envelope: RepositoryExecutionEnvelopeV01,
  requestFingerprint: string,
  protectedPaths: ProtectedUntrackedPathsV01 & { status: "exact" },
): NativeHostRepositoryDelegationContextV01 {
  return {
    context_version: "native_host_repository_delegation_context.v0.1",
    attachment_id: attachment.attachment_id,
    attachment_binding_fingerprint: attachment.binding_fingerprint,
    execution_envelope_fingerprint: envelope.envelope_fingerprint,
    start_decision_request_fingerprint: requestFingerprint,
    protected_untracked_paths_fingerprint: protectedPaths.paths_fingerprint,
    protected_untracked_paths: protectedPaths.paths,
  };
}

function physicalMatchesBaselineV01(
  observation: Extract<PhysicalRootObservationV01, { status: "exact" }>,
  baseline: PhysicalRootBaselineV01,
): boolean {
  return (
    observation.node_scope_fingerprint === baseline.node_scope_fingerprint &&
    observation.identity.identity_version === baseline.identity_version &&
    observation.identity.canonical_realpath_fingerprint ===
      baseline.canonical_realpath_fingerprint &&
    observation.identity.device === baseline.filesystem_volume_identity &&
    observation.identity.inode === baseline.filesystem_object_identity
  );
}

function exactConsumedReplayV01(
  db: Database.Database,
  input: {
    config: VNextLocalOperatorPilotConfigV01;
    workspace_id: string;
    project_id: string;
    attachment_id: string;
    expected_attachment_binding_fingerprint: string;
    expected_execution_envelope_fingerprint: string;
    decision_request_fingerprint: string;
    decision_grant_fingerprint: string;
  },
  attachment: RepositoryExecutionAttachmentV01,
  service: LiveNativeHostRunServiceV01,
): RepositoryManagedDelegationStartResultV01 {
  const runId = attachment.consumed_run_id;
  const run = runId ? readAutonomyRunLedgerRecord(runId, { db }) : null;
  const decision = readRepositoryExecutionDecisionRequestV01(
    db,
    input.decision_request_fingerprint,
  );
  if (
    !runId ||
    !run ||
    attachment.workspace_id !== input.workspace_id ||
    attachment.project_id !== input.project_id ||
    attachment.binding_fingerprint !== input.expected_attachment_binding_fingerprint ||
    run.metadata.repository_attachment_id !== attachment.attachment_id ||
    run.metadata.repository_execution_envelope_fingerprint !==
      input.expected_execution_envelope_fingerprint ||
    run.metadata.repository_start_decision_request_fingerprint !==
      input.decision_request_fingerprint ||
    !decision ||
    decision.action !== "start_repository_managed_delegation" ||
    decision.status !== "consumed" ||
    decision.grant_fingerprint !== input.decision_grant_fingerprint ||
    decision.result_fingerprint !== startResultFingerprintV01({
      attachment_id: attachment.attachment_id,
      run_id: runId,
      envelope_fingerprint: input.expected_execution_envelope_fingerprint,
    })
  ) {
    throw new RepositoryManagedDelegationErrorV01("repository_delegation_replay_conflict");
  }
  const projection = service.readExactRepositoryDelegationProjectionV01(
    input.config,
    runId,
  );
  return startResultV01(
    "exact_replay",
    attachment,
    {
      provider_egress:
        run.metadata.adapter_provider_egress === "forbidden"
          ? "forbidden"
          : "native_host_managed",
      envelope_fingerprint: input.expected_execution_envelope_fingerprint,
    },
    runId,
    projection,
    false,
  );
}

function startResultV01(
  status: RepositoryManagedDelegationStartResultV01["status"],
  attachment: RepositoryExecutionAttachmentV01,
  envelope: Pick<
    RepositoryExecutionEnvelopeV01,
    "envelope_fingerprint" | "provider_egress"
  >,
  runId: string,
  projection: RepositoryManagedDelegationStartResultV01["projection"],
  workerStarted: boolean,
  reason?: string,
): RepositoryManagedDelegationStartResultV01 {
  return {
    start_version: REPOSITORY_MANAGED_DELEGATION_START_VERSION_V01,
    status,
    ordinary_text:
      status === "blocked"
        ? `The managed run was created but did not start: ${reason ?? projection.public_reason ?? "the exact launch gate changed"}. Its current state is ${ordinaryRunStateV01(projection)}.`
        : status === "exact_replay"
          ? `This is the same previously admitted managed run. Its current state is ${ordinaryRunStateV01(projection)}.`
          : `One managed repository run was admitted by this request. Its current state is ${ordinaryRunStateV01(projection)}.`,
    attachment_id: attachment.attachment_id,
    run_id: runId,
    attachment_binding_fingerprint: attachment.binding_fingerprint,
    execution_envelope_fingerprint: envelope.envelope_fingerprint,
    projection,
    authority: {
      attachment_consumed: true,
      managed_run_created: true,
      worker_started: workerStarted,
      project_files_may_be_written: workerStarted,
      project_commands_may_be_executed: workerStarted,
      provider_egress_may_occur:
        workerStarted && envelope.provider_egress === "native_host_managed",
      arbitrary_network_access_granted: false,
      github_authority_granted: false,
      release_authority_granted: false,
      semantic_authority_granted: false,
      decision_created: false,
      transition_created: false,
      accepted_state_mutated: false,
      work_closed: false,
    },
  };
}

function ordinaryRunStateV01(
  projection: RepositoryManagedDelegationStartResultV01["projection"],
): string {
  if (projection.status === "paused" && projection.reconciliation_required) {
    return "paused and disconnected";
  }
  switch (projection.status) {
    case "idle":
      return "unavailable";
    case "queued":
      return "queued";
    case "starting":
      return "starting";
    case "running":
      return "running";
    case "waiting_for_approval":
      return "waiting for approval";
    case "cancelling":
      return "cancelling";
    case "paused":
      return "paused";
    case "blocked":
      return "blocked";
    case "completed":
      return "completed";
    case "failed":
      return "failed";
    case "cancelled":
      return "cancelled";
    case "timed_out":
      return "timed out";
  }
}

function ordinaryCancellationTextV01(
  outcome: RepositoryManagedDelegationCancellationResultV01["status"],
  projection: RepositoryManagedDelegationCancellationResultV01["projection"],
): string {
  const state = ordinaryRunStateV01(projection);
  if (outcome === "cancel_requested") {
    return `Cancellation was sent once to the exact managed repository worker. Its current state is ${state}.`;
  }
  if (outcome === "cancelled") {
    return "The exact queued managed repository run was cancelled before a worker started.";
  }
  if (outcome === "reconciliation_required") {
    return `Cancellation is durably recorded for the exact managed repository run, which is ${state}; provider stop is not confirmed, no owned worker was available to signal, and no worker was started.`;
  }
  return `This is the same cancellation state for the exact managed repository run. Its current state is ${state}; no new signal was sent.`;
}

function startResultFingerprintV01(input: {
  attachment_id: string;
  run_id: string;
  envelope_fingerprint: string;
}): string {
  return createProtocolSha256V01(canonicalizeProtocolValueV01({
    result_version: REPOSITORY_MANAGED_DELEGATION_START_VERSION_V01,
    ...input,
  }));
}

function strictNowV01(now: (() => string) | undefined): string {
  const value = (now ?? (() => new Date().toISOString()))();
  if (!Number.isFinite(Date.parse(value))) {
    throw new RepositoryManagedDelegationErrorV01("repository_delegation_clock_invalid", 500);
  }
  return value;
}

function errorCodeV01(error: unknown, fallback: string): string {
  return error instanceof Error && "code" in error &&
    typeof (error as Error & { code?: unknown }).code === "string"
    ? (error as Error & { code: string }).code
    : fallback;
}

function ordinaryBlockedTextV01(reason: string): string {
  if (reason === "repository_managed_delegation_platform_unsupported") {
    return "Managed repository delegation is currently available only on a verified local macOS filesystem.";
  }
  if (reason === "repository_managed_delegation_non_git_unsupported") {
    return "This folder remains available for continuity, but managed repository delegation requires an exact Git worktree.";
  }
  return "The exact repository attachment changed and cannot start a managed run.";
}
