import type Database from "better-sqlite3";

import {
  readAutonomyRunLedgerRecord,
} from "@/lib/autonomy/runner-ledger";
import { isTerminalRunnerStatus } from "@/lib/autonomy/runner-state";
import { readCanonicalProjectWithRootV01 } from "@/lib/vnext/persistence/project-identity-registry";
import {
  insertRepositoryRunResumeCheckpointInsideTransactionV01,
  listRepositoryRunResumeCheckpointsV01,
  readPhysicalRootBaselineV01,
  readRepositoryExecutionAttachmentV01,
  readRepositoryRunResumeCheckpointV01,
} from "@/lib/vnext/persistence/repository-execution-store";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import { validateExternalRefV01 } from "@/lib/vnext/task-context-packet";
import {
  baselineMatchesObservation,
  fingerprintProjectRootBindingV01,
  inspectPhysicalRootForExecutionV01,
  readExpectedDatabaseAdmissionStateV01,
  readRepositoryManagedPlatformCapabilityV01,
  type RepositoryExecutionDependenciesV01,
  type RepositoryManagedPlatformV01,
} from "@/lib/vnext/repository-execution/repository-execution";
import {
  buildRepositoryExecutionEnvelopeV01,
  type RepositoryExecutionEnvelopeCapabilityV01,
} from "@/lib/vnext/repository-execution/repository-execution-envelope";
import { inspectRepositoryWorktreeV01 } from "@/lib/vnext/repository-execution/worktree-observation";
import type { VNextLocalOperatorPilotConfigV01 } from "@/lib/vnext/runtime/local-operator-session";
import type { AutonomyRunRecord } from "@/types/autonomy-runner-execution";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import {
  NATIVE_HOST_RESUME_BINDING_VERSION_V01,
  REPOSITORY_RUN_RESUME_CHECKPOINT_VERSION_V01,
  REPOSITORY_RUN_RESUME_ELIGIBILITY_AUTHORITY_V01,
  REPOSITORY_RUN_RESUME_ELIGIBILITY_VERSION_V01,
  REPOSITORY_RUN_RESUME_LIMITS_V01,
  type RepositoryRunOperationCertaintyV01,
  type RepositoryRunResumeCheckpointV01,
  type RepositoryRunResumeEligibilityV01,
} from "@/types/vnext/repository-run-resume";

export interface RepositoryRunControllerObservationV01 {
  owned: boolean;
  controller_generation: number | null;
  runtime_instance_fingerprint: string | null;
  runtime_generation_fingerprint: string | null;
}

export interface RepositoryRunResumeCapabilityV01
  extends RepositoryExecutionEnvelopeCapabilityV01 {
  provider_resume_binding_version: "native_host_resume_binding.v0.1";
  resumable_after_detach: boolean;
}

export interface RepositoryRunResumeDependenciesV01
  extends RepositoryExecutionDependenciesV01 {
  read_controller?: (
    config: VNextLocalOperatorPilotConfigV01,
    runId: string,
  ) => RepositoryRunControllerObservationV01;
  read_capability?: () => RepositoryRunResumeCapabilityV01;
  before_checkpoint_transaction?: () => void;
  before_checkpoint_insert?: () => void;
  after_checkpoint_insert?: () => void;
}

export interface AdmitRepositoryRunResumeCheckpointInputV01 {
  config: VNextLocalOperatorPilotConfigV01;
  run_id: string;
  lifecycle_event_id: string;
  controller_generation: number;
  runtime_instance_fingerprint: string;
  runtime_generation_fingerprint: string;
  expected_run_control_revision: number;
  expected_step_control_revision: number;
  operation_ref: string;
  operation_class: "command_execution" | "file_change";
  checkpoint_phase: "declared_pre_start" | "post_operation";
  operation_certainty: Extract<
    RepositoryRunOperationCertaintyV01,
    "not_started" | "completed" | "failed" | "cancelled"
  >;
  observed_at: string;
}

interface EventRowV01 {
  sequence: number;
  event_id: string;
  step_id: string | null;
  event_type: string;
  payload_json: string;
  created_at: string;
}

interface CheckpointEventV01 {
  row: EventRowV01;
  lifecycle_event_id: string;
  operation_ref: string;
  operation_class: "command_execution" | "file_change";
  phase: "declared" | "started" | "completed";
  certainty: RepositoryRunOperationCertaintyV01;
  controller_generation: number;
  runtime_instance_fingerprint: string;
  runtime_generation_fingerprint: string;
}

const MAX_REPOSITORY_ATTACHMENT_RUN_CANDIDATES_V01 = 64;

export class RepositoryRunResumeErrorV01 extends Error {
  constructor(readonly code: string, readonly status = 409) {
    super(code);
    this.name = "RepositoryRunResumeErrorV01";
  }
}

export async function admitRepositoryRunResumeCheckpointV01(
  db: Database.Database,
  input: AdmitRepositoryRunResumeCheckpointInputV01,
  dependencies: RepositoryRunResumeDependenciesV01 = {},
): Promise<{ status: "inserted" | "exact_replay"; checkpoint: RepositoryRunResumeCheckpointV01 }> {
  assertAdmissionInputV01(input);
  const platformCapability = readRepositoryManagedPlatformCapabilityV01(
    dependencies,
  );
  if (platformCapability.status !== "available") {
    refuse(platformCapability.reason, 422);
  }
  const preRun = requireRepositoryRunV01(db, input.config, input.run_id);
  const capability = dependencies.read_capability?.();
  if (
    !capability ||
    readDurableExecutionEnvelopePlatformV01(preRun, capability) !==
      platformCapability.platform
  ) {
    refuse("repository_resume_checkpoint_execution_platform_mismatch");
  }
  const preAttachment = requireConsumedRepositoryRunAttachmentV01(db, preRun);
  const registration = readCanonicalProjectWithRootV01(db, input.config);
  if (!registration) refuse("repository_resume_checkpoint_project_unavailable", 404);
  const rootBindingFingerprint = fingerprintProjectRootBindingV01(
    registration.root_binding,
  );
  const root = registration.root_binding.local_root.normalized_path;
  const physical = await inspectPhysicalRootForExecutionV01(
    db,
    root,
    dependencies,
  );
  if (physical.status !== "exact") {
    refuse("repository_resume_checkpoint_post_state_unavailable");
  }
  const worktree = await (
    dependencies.inspect_worktree ?? inspectRepositoryWorktreeV01
  )(root, { now: dependencies.now });
  if (worktree.status !== "exact") {
    refuse("repository_resume_checkpoint_post_state_unavailable");
  }
  const baseline = readPhysicalRootBaselineV01(db, {
    ...input.config,
    node_scope_fingerprint: physical.node_scope_fingerprint,
  });
  if (
    !baseline ||
    baseline.baseline_fingerprint !==
      preAttachment.physical_root_baseline_fingerprint ||
    baseline.root_binding_fingerprint !== rootBindingFingerprint ||
    !baselineMatchesObservation(baseline, physical)
  ) {
    refuse("repository_resume_checkpoint_physical_root_mismatch");
  }

  dependencies.before_checkpoint_transaction?.();
  db.exec("BEGIN IMMEDIATE");
  let checkpoint!: RepositoryRunResumeCheckpointV01;
  let status!: "inserted" | "exact_replay";
  try {
    const run = requireRepositoryRunV01(db, input.config, input.run_id);
    const attachment = requireConsumedRepositoryRunAttachmentV01(db, run);
    const controllerGeneration = exactNonNegativeIntegerV01(
      run.metadata.controller_generation,
    );
    const runRevision = exactNonNegativeIntegerV01(run.metadata.control_revision);
    if (
      controllerGeneration !== input.controller_generation ||
      runRevision !== input.expected_run_control_revision ||
      run.metadata.runtime_instance_fingerprint !==
        input.runtime_instance_fingerprint ||
      run.metadata.runtime_generation_fingerprint !==
        input.runtime_generation_fingerprint ||
      attachment.attachment_id !== preAttachment.attachment_id ||
      attachment.binding_fingerprint !== preAttachment.binding_fingerprint ||
      run.metadata.repository_execution_envelope_fingerprint !==
        preRun.metadata.repository_execution_envelope_fingerprint
    ) {
      refuse("repository_resume_checkpoint_expected_state_drift");
    }
    const events = readEventRowsV01(db, run.run_id);
    const checkpoints = parseCheckpointEventsV01(events);
    const exactEvent = checkpoints.find(
      (candidate) => candidate.lifecycle_event_id === input.lifecycle_event_id,
    );
    const step = exactEvent?.row.step_id
      ? run.steps.find((candidate) => candidate.step_id === exactEvent.row.step_id)
      : null;
    const stepRevision = exactNonNegativeIntegerV01(
      step?.output.control_revision,
    );
    if (
      !exactEvent ||
      !step ||
      stepRevision !== input.expected_step_control_revision ||
      exactEvent.operation_ref !== input.operation_ref ||
      exactEvent.operation_class !== input.operation_class ||
      exactEvent.certainty !== input.operation_certainty ||
      exactEvent.controller_generation !== input.controller_generation ||
      exactEvent.runtime_instance_fingerprint !==
        input.runtime_instance_fingerprint ||
      exactEvent.runtime_generation_fingerprint !==
        input.runtime_generation_fingerprint ||
      (input.checkpoint_phase === "declared_pre_start"
        ? exactEvent.phase !== "declared"
        : exactEvent.phase !== "completed")
    ) {
      refuse("repository_resume_checkpoint_lifecycle_binding_mismatch");
    }
    assertSafeEffectBoundaryV01(checkpoints, exactEvent);
    if (run.metadata.pending_approval != null) {
      refuse("repository_resume_checkpoint_approval_ambiguous");
    }
    const eventHighWater = maxSequenceV01(events);
    const stepHighWater = maxSequenceV01(
      events.filter((event) => event.step_id === step.step_id),
    );
    const effectHighWater = maxSequenceV01(
      checkpoints.map((candidate) => candidate.row),
    );
    if (exactEvent.row.sequence !== effectHighWater) {
      refuse("repository_resume_checkpoint_later_effect_observed");
    }
    const prior = listRepositoryRunResumeCheckpointsV01(db, {
      ...input.config,
      run_id: run.run_id,
    }).at(-1);
    if (
      prior &&
      (input.controller_generation < prior.controller_generation ||
        eventHighWater < prior.event_high_water_mark ||
        stepHighWater < prior.step_high_water_mark ||
        effectHighWater < prior.effect_ledger_high_water_mark)
    ) {
      refuse("repository_resume_checkpoint_high_water_regression");
    }
    const thread = externalRefV01(run.metadata.host_thread_ref, "host_thread");
    const turn = externalRefV01(run.metadata.host_turn_ref, "host_turn");
    if (!thread || !turn) refuse("repository_resume_checkpoint_provider_binding_missing");
    const providerBindingVersion =
      capability?.provider_resume_binding_version ??
      NATIVE_HOST_RESUME_BINDING_VERSION_V01;
    const material = {
      checkpoint_version: REPOSITORY_RUN_RESUME_CHECKPOINT_VERSION_V01,
      workspace_id: input.config.workspace_id,
      project_id: input.config.project_id,
      run_id: run.run_id,
      invocation_origin: "repository_attachment" as const,
      attachment_id: attachment.attachment_id,
      attachment_binding_fingerprint: attachment.binding_fingerprint,
      node_scope_fingerprint: attachment.node_scope_fingerprint,
      execution_envelope_version: "repository_execution_envelope.v0.1" as const,
      execution_envelope_fingerprint: requiredFingerprintV01(
        run.metadata.repository_execution_envelope_fingerprint,
        "repository_resume_checkpoint_envelope_missing",
      ),
      adapter_version: requiredStringV01(
        run.metadata.adapter_version,
        "repository_resume_checkpoint_adapter_missing",
      ),
      capability_version: requiredStringV01(
        run.metadata.capability_version,
        "repository_resume_checkpoint_capability_missing",
      ),
      provider_resume_binding_version: providerBindingVersion,
      provider_thread_ref: thread,
      last_turn_ref: turn,
      controller_generation: input.controller_generation,
      runtime_instance_fingerprint: input.runtime_instance_fingerprint,
      runtime_generation_fingerprint: input.runtime_generation_fingerprint,
      run_control_revision: runRevision,
      step_id: step.step_id,
      step_control_revision: stepRevision,
      event_high_water_mark: eventHighWater,
      step_high_water_mark: stepHighWater,
      effect_ledger_high_water_mark: effectHighWater,
      operation_ref: input.operation_ref,
      operation_class: input.operation_class,
      checkpoint_phase: input.checkpoint_phase,
      operation_certainty: input.operation_certainty,
      approval_ref: null,
      approval_state: null,
      root_binding_fingerprint: rootBindingFingerprint,
      physical_root_baseline_fingerprint: baseline.baseline_fingerprint,
      worktree_observation_fingerprint: worktree.observation_fingerprint,
      observed_at: input.observed_at,
    };
    checkpoint = {
      ...material,
      checkpoint_fingerprint: createProtocolSha256V01(
        canonicalizeProtocolValueV01(material),
      ),
    };
    dependencies.before_checkpoint_insert?.();
    status = insertRepositoryRunResumeCheckpointInsideTransactionV01(
      db,
      checkpoint,
    );
    dependencies.after_checkpoint_insert?.();
    db.exec("COMMIT");
  } catch (error) {
    if (db.inTransaction) db.exec("ROLLBACK");
    throw error;
  }
  const final = readRepositoryRunResumeCheckpointV01(
    db,
    checkpoint.checkpoint_fingerprint,
  );
  const finalRun = requireRepositoryRunV01(db, input.config, input.run_id);
  const finalAttachment = requireConsumedRepositoryRunAttachmentV01(db, finalRun);
  const finalStep = finalRun.steps.find(
    (candidate) => candidate.step_id === checkpoint.step_id,
  );
  const finalEventRows = readEventRowsV01(db, input.run_id);
  const finalEffectHighWater = maxSequenceV01(
    parseCheckpointEventsV01(finalEventRows).map(
      (candidate) => candidate.row,
    ),
  );
  if (
    !final ||
    canonicalizeProtocolValueV01(final) !==
      canonicalizeProtocolValueV01(checkpoint) ||
    exactNonNegativeIntegerV01(finalRun.metadata.controller_generation) !==
      checkpoint.controller_generation ||
    finalRun.metadata.runtime_instance_fingerprint !==
      checkpoint.runtime_instance_fingerprint ||
    finalRun.metadata.runtime_generation_fingerprint !==
      checkpoint.runtime_generation_fingerprint ||
    exactNonNegativeIntegerV01(finalRun.metadata.control_revision) !==
      checkpoint.run_control_revision ||
    !finalStep ||
    exactNonNegativeIntegerV01(finalStep.output.control_revision) !==
      checkpoint.step_control_revision ||
    finalAttachment.attachment_id !== checkpoint.attachment_id ||
    finalAttachment.binding_fingerprint !==
      checkpoint.attachment_binding_fingerprint ||
    finalRun.metadata.repository_execution_envelope_fingerprint !==
      checkpoint.execution_envelope_fingerprint ||
    maxSequenceV01(finalEventRows) !== checkpoint.event_high_water_mark ||
    maxSequenceV01(
      finalEventRows.filter((event) => event.step_id === checkpoint.step_id),
    ) !== checkpoint.step_high_water_mark ||
    finalEffectHighWater !== checkpoint.effect_ledger_high_water_mark
  ) {
    refuse("repository_resume_checkpoint_final_consistency_failed");
  }
  return { status, checkpoint };
}

export async function readRepositoryRunResumeEligibilityV01(
  db: Database.Database,
  input: { config: VNextLocalOperatorPilotConfigV01; generated_at?: string },
  dependencies: RepositoryRunResumeDependenciesV01 = {},
): Promise<RepositoryRunResumeEligibilityV01> {
  const generatedAt = input.generated_at ??
    (dependencies.now ?? (() => new Date().toISOString()))();
  try {
    const run = selectCanonicalRepositoryAttachmentRunV01(db, input.config);
    if (!run) {
      return projectionV01(generatedAt, "unavailable", {
        summary: "No attachment-backed run is available for resume review.",
        gap: "attachment_backed_run_unavailable",
      });
    }
    const conflictingRun = countConflictingManagedRunsV01(
      db,
      run.run_id,
      input.config,
    );
    if (conflictingRun > 0) {
      return projectionV01(generatedAt, "stale", {
        summary: "Another managed run conflicts with this checkpoint.",
        gap: "conflicting_managed_run",
      });
    }
    if (isTerminalRunnerStatus(run.status)) {
      return projectionV01(generatedAt, "terminal", {
        summary: "This run is terminal; resume is not applicable.",
      });
    }
    const controller = dependencies.read_controller?.(
      input.config,
      run.run_id,
    );
    if (controller?.owned) {
      if (
        controller.controller_generation !==
          exactNonNegativeIntegerV01(run.metadata.controller_generation) ||
        controller.runtime_instance_fingerprint !==
          run.metadata.runtime_instance_fingerprint ||
        controller.runtime_generation_fingerprint !==
          run.metadata.runtime_generation_fingerprint
      ) {
        return projectionV01(generatedAt, "reconciliation_required", {
          summary: "The live controller and durable run generation disagree.",
          gap: "controller_generation_mismatch",
        });
      }
      return projectionV01(generatedAt, "active_owned", {
        summary: "The exact live controller still owns this run.",
        checkpoint: readLatestDisplayCheckpointV01(db, input.config, run),
      });
    }
    const pending = pendingApprovalV01(run.metadata.pending_approval, run);
    if (pending) {
      return projectionV01(generatedAt, "approval_pending", {
        summary: "One exact operation approval is waiting for review.",
        pending,
        checkpoint: readLatestDisplayCheckpointV01(db, input.config, run),
      });
    }
    if (run.metadata.pending_approval != null) {
      return projectionV01(generatedAt, "reconciliation_required", {
        summary: "The durable approval state is malformed or ambiguous.",
        gap: "approval_state_ambiguous",
      });
    }
    if (run.metadata.reconciliation_required === true) {
      return projectionV01(generatedAt, "reconciliation_required", {
        summary: "The durable run already requires lifecycle reconciliation.",
        gap: "run_reconciliation_required",
      });
    }
    if (!isPausedOrDisconnectedV01(run)) {
      return projectionV01(generatedAt, "reconciliation_required", {
        summary: "The run is not terminal, owned, or safely disconnected.",
        gap: "run_lifecycle_ambiguous",
      });
    }
    const platformCapability = readRepositoryManagedPlatformCapabilityV01(
      dependencies,
    );
    if (platformCapability.status !== "available") {
      return projectionV01(generatedAt, "unsupported", {
        summary: "Managed repository resume is unavailable on this runtime.",
        gap: platformCapability.reason,
      });
    }
    const attachment = requireConsumedRepositoryRunAttachmentV01(db, run);
    let checkpoints: RepositoryRunResumeCheckpointV01[];
    try {
      checkpoints = listRepositoryRunResumeCheckpointsV01(db, {
        ...input.config,
        run_id: run.run_id,
      });
    } catch {
      return projectionV01(generatedAt, "unavailable", {
        summary: "Checkpoint material is malformed or inaccessible.",
        gap: "checkpoint_material_unavailable",
      });
    }
    if (checkpoints.length === 0) {
      return projectionV01(generatedAt, "reconciliation_required", {
        summary: "This historical run has no exact safe resume checkpoint.",
        gap: "safe_checkpoint_missing",
      });
    }
    const latest = checkpoints.at(-1)!;
    const equallyCurrent = checkpoints.filter(
      (candidate) =>
        candidate.effect_ledger_high_water_mark ===
          latest.effect_ledger_high_water_mark &&
        candidate.event_high_water_mark === latest.event_high_water_mark,
    );
    if (
      equallyCurrent.length !== 1 ||
      !validCheckpointMaterialV01(latest)
    ) {
      return projectionV01(generatedAt, "reconciliation_required", {
        summary: "Multiple or malformed current checkpoint candidates exist.",
        gap: "checkpoint_candidate_ambiguous",
      });
    }
    const step = run.steps.find((candidate) => candidate.step_id === latest.step_id);
    if (
      exactNonNegativeIntegerV01(run.metadata.controller_generation) !==
        latest.controller_generation ||
      run.metadata.runtime_instance_fingerprint !==
        latest.runtime_instance_fingerprint ||
      run.metadata.runtime_generation_fingerprint !==
        latest.runtime_generation_fingerprint ||
      exactNonNegativeIntegerV01(run.metadata.control_revision) !==
        latest.run_control_revision ||
      !step ||
      exactNonNegativeIntegerV01(step.output.control_revision) !==
        latest.step_control_revision
    ) {
      return projectionV01(generatedAt, "reconciliation_required", {
        summary: "The run, step, and controller checkpoint revisions disagree.",
        gap: "checkpoint_control_revision_mismatch",
      });
    }
    const eventRows = readEventRowsV01(db, run.run_id);
    let events: CheckpointEventV01[];
    try {
      events = parseCheckpointEventsV01(eventRows);
    } catch (error) {
      return projectionV01(generatedAt, "reconciliation_required", {
        summary: "A durable operation lifecycle observation is malformed or ambiguous.",
        gap: error instanceof RepositoryRunResumeErrorV01
          ? error.code
          : "effect_lifecycle_malformed",
      });
    }
    const matchingEvent = events.find(
      (event) => event.row.sequence === latest.effect_ledger_high_water_mark,
    );
    if (!matchingEvent) {
      return projectionV01(generatedAt, "reconciliation_required", {
        summary: "The checkpoint no longer binds one exact lifecycle event.",
        gap: "checkpoint_effect_event_missing",
      });
    }
    if (
      matchingEvent.controller_generation !== latest.controller_generation ||
      matchingEvent.runtime_instance_fingerprint !==
        latest.runtime_instance_fingerprint ||
      matchingEvent.runtime_generation_fingerprint !==
        latest.runtime_generation_fingerprint
    ) {
      return projectionV01(generatedAt, "reconciliation_required", {
        summary: "The checkpoint lifecycle generation binding disagrees.",
        gap: "checkpoint_lifecycle_generation_mismatch",
      });
    }
    try {
      assertSafeEffectBoundaryV01(events, matchingEvent);
    } catch (error) {
      return projectionV01(generatedAt, "reconciliation_required", {
        summary: "An operation outcome remains uncertain after the last checkpoint.",
        gap: error instanceof RepositoryRunResumeErrorV01
          ? error.code
          : "effect_boundary_ambiguous",
      });
    }
    const currentEventHighWater = maxSequenceV01(eventRows);
    const currentStepHighWater = maxSequenceV01(
      eventRows.filter((event) => event.step_id === latest.step_id),
    );
    const currentEffectHighWater = maxSequenceV01(
      events.map((event) => event.row),
    );
    if (
      currentEventHighWater !== latest.event_high_water_mark ||
      currentStepHighWater !== latest.step_high_water_mark ||
      currentEffectHighWater !== latest.effect_ledger_high_water_mark
    ) {
      const highWaterGap = currentEffectHighWater !==
          latest.effect_ledger_high_water_mark
        ? "checkpoint_effect_high_water_mismatch"
        : currentStepHighWater !== latest.step_high_water_mark
          ? "checkpoint_step_high_water_mismatch"
          : "checkpoint_event_high_water_mismatch";
      return projectionV01(generatedAt, "reconciliation_required", {
        summary: "Durable event, step, and effect high-water marks disagree.",
        gap: highWaterGap,
      });
    }
    if (
      latest.run_id !== run.run_id ||
      latest.attachment_id !== attachment.attachment_id ||
      latest.attachment_binding_fingerprint !== attachment.binding_fingerprint ||
      latest.node_scope_fingerprint !== attachment.node_scope_fingerprint
    ) {
      return projectionV01(generatedAt, "unavailable", {
        summary: "The run, attachment, and checkpoint bindings disagree.",
        gap: "checkpoint_binding_mismatch",
      });
    }
    const currentThread = externalRefV01(
      run.metadata.host_thread_ref,
      "host_thread",
    );
    const currentTurn = externalRefV01(run.metadata.host_turn_ref, "host_turn");
    const connectionValid = run.metadata.host_connection_ref == null ||
      externalRefV01(run.metadata.host_connection_ref, "host_connection") !==
        null;
    const sessionValid = run.metadata.host_session_ref == null ||
      externalRefV01(run.metadata.host_session_ref, "host_session") !== null;
    const capability = dependencies.read_capability?.();
    if (
      !capability ||
      !capability.resumable_after_detach ||
      capability.provider_resume_binding_version !==
        NATIVE_HOST_RESUME_BINDING_VERSION_V01 ||
      !currentThread ||
      !currentTurn ||
      !connectionValid ||
      !sessionValid ||
      !externalRefV01(latest.provider_thread_ref, "host_thread") ||
      !externalRefV01(latest.last_turn_ref, "host_turn")
    ) {
      return projectionV01(generatedAt, "unsupported", {
        summary: "Exact provider resume support is unavailable.",
        gap: "provider_resume_binding_unsupported",
      });
    }
    if (
      canonicalizeProtocolValueV01(currentThread) !==
        canonicalizeProtocolValueV01(latest.provider_thread_ref) ||
      canonicalizeProtocolValueV01(currentTurn) !==
        canonicalizeProtocolValueV01(latest.last_turn_ref)
    ) {
      return projectionV01(generatedAt, "stale", {
        summary: "The exact provider resume binding changed after the checkpoint.",
        gap: "provider_resume_binding_drift",
      });
    }
    if (
      capability.adapter_version !== latest.adapter_version ||
      capability.capability_version !== latest.capability_version ||
      run.metadata.repository_execution_envelope_fingerprint !==
        latest.execution_envelope_fingerprint ||
      run.metadata.adapter_version !== latest.adapter_version ||
      run.metadata.capability_version !== latest.capability_version
    ) {
      return projectionV01(generatedAt, "stale", {
        summary: "The execution envelope or native-host capability changed.",
        gap: "execution_capability_drift",
      });
    }
    const durablePlatform = readDurableExecutionEnvelopePlatformV01(
      run,
      capability,
    );
    if (!durablePlatform) {
      return projectionV01(generatedAt, "stale", {
        summary: "The durable execution envelope no longer matches this capability.",
        gap: "execution_capability_drift",
      });
    }
    if (durablePlatform !== platformCapability.platform) {
      return projectionV01(generatedAt, "unsupported", {
        summary: "This run is bound to a different managed execution platform.",
        gap: "repository_resume_execution_platform_mismatch",
      });
    }
    const registration = readCanonicalProjectWithRootV01(db, input.config);
    if (!registration) {
      return projectionV01(generatedAt, "unavailable", {
        summary: "The registered repository root is unavailable.",
        gap: "project_root_unavailable",
      });
    }
    const rootFingerprint = fingerprintProjectRootBindingV01(
      registration.root_binding,
    );
    const physical = await inspectPhysicalRootForExecutionV01(
      db,
      registration.root_binding.local_root.normalized_path,
      dependencies,
    );
    if (
      physical.status !== "exact" ||
      physical.node_scope_fingerprint !== latest.node_scope_fingerprint
    ) {
      return projectionV01(generatedAt, "stale", {
        summary: "The physical repository root changed after the checkpoint.",
        gap: "physical_root_drift",
      });
    }
    const baseline = readPhysicalRootBaselineV01(db, {
      ...input.config,
      node_scope_fingerprint: physical.node_scope_fingerprint,
    });
    if (
      rootFingerprint !== latest.root_binding_fingerprint ||
      !baseline ||
      baseline.baseline_fingerprint !==
        latest.physical_root_baseline_fingerprint ||
      !baselineMatchesObservation(baseline, physical)
    ) {
      return projectionV01(generatedAt, "stale", {
        summary: "The root binding or physical baseline changed after the checkpoint.",
        gap: "root_or_baseline_drift",
      });
    }
    const state = readExpectedDatabaseAdmissionStateV01(db, {
      ...input.config,
      node_scope_fingerprint: latest.node_scope_fingerprint,
    });
    if (
      state.task_context_packet_id !== run.metadata.packet_id ||
      state.task_context_packet_fingerprint !== run.metadata.packet_fingerprint ||
      state.current_work_fingerprint !== attachment.current_work_fingerprint
    ) {
      return projectionV01(generatedAt, "stale", {
        summary: "Current work or packet meaning changed after the checkpoint.",
        gap: "packet_or_current_work_drift",
      });
    }
    const worktree = await (
      dependencies.inspect_worktree ?? inspectRepositoryWorktreeV01
    )(registration.root_binding.local_root.normalized_path, {
      now: dependencies.now,
    });
    if (
      worktree.status !== "exact" ||
      worktree.observation_fingerprint !==
        latest.worktree_observation_fingerprint
    ) {
      return projectionV01(generatedAt, "stale", {
        summary: "The repository changed after the last safe operation checkpoint.",
        gap: "checkpoint_worktree_drift",
      });
    }
    return projectionV01(generatedAt, "resume_ready", {
      summary:
        "This disconnected run has one exact safe checkpoint and can request explicit resume.",
      checkpoint: latest,
    });
  } catch (error) {
    const code = error instanceof RepositoryRunResumeErrorV01
      ? error.code
      : "repository_resume_eligibility_unavailable";
    return projectionV01(generatedAt, "unavailable", {
      summary: "Resume eligibility could not be determined from exact source state.",
      gap: code,
    });
  }
}

function readDurableExecutionEnvelopePlatformV01(
  run: AutonomyRunRecord,
  capability: RepositoryExecutionEnvelopeCapabilityV01,
): RepositoryManagedPlatformV01 | null {
  const envelopeFingerprint = run.metadata
    .repository_execution_envelope_fingerprint;
  const protectedPathsFingerprint = run.metadata
    .repository_protected_untracked_paths_fingerprint;
  if (
    !isFingerprintV01(envelopeFingerprint) ||
    !isFingerprintV01(protectedPathsFingerprint)
  ) return null;
  const matches = (["darwin", "win32"] as const).filter((platform) =>
    buildRepositoryExecutionEnvelopeV01(
      platform,
      capability,
      protectedPathsFingerprint,
    ).envelope_fingerprint === envelopeFingerprint
  );
  return matches.length === 1 ? matches[0]! : null;
}

function projectionV01(
  generatedAt: string,
  status: RepositoryRunResumeEligibilityV01["status"],
  input: {
    summary: string;
    gap?: string;
    checkpoint?: RepositoryRunResumeCheckpointV01;
    pending?: NonNullable<RepositoryRunResumeEligibilityV01["pending_approval"]>;
  },
): RepositoryRunResumeEligibilityV01 {
  const next = {
    active_owned: ["view_progress", "View progress", "The current controller remains authoritative."],
    terminal: ["review_result", "Review result", "Terminal runs are reviewed instead of resumed."],
    approval_pending: ["review_approval", "Review approval", "The existing exact approval gate remains authoritative."],
    resume_ready: ["request_explicit_resume", "Resume managed run", "An exact Browser-confirmed same-run resume may now be requested."],
    reconciliation_required: ["review_uncertain_operation", "Review uncertain operation", "Reconcile the exact operation boundary before any future resume."],
    stale: ["restore_checkpoint_state", "Restore checkpoint state", "Restore exact checkpoint bindings before considering resume."],
    unsupported: ["restore_resume_support", "Restore resume support", "A compatible exact provider resume binding is required."],
    unavailable: ["restore_continuity", "Restore continuity", "Canonical source state must be available and consistent."],
  } as const;
  const [kind, label, reason] = next[status];
  const checkpoint = input.checkpoint;
  const result: RepositoryRunResumeEligibilityV01 = {
    projection_version: REPOSITORY_RUN_RESUME_ELIGIBILITY_VERSION_V01,
    generated_at: generatedAt,
    status,
    summary: boundedTextV01(input.summary),
    run_state: status === "active_owned"
      ? "active"
      : status === "terminal"
        ? "terminal"
        : ["resume_ready", "reconciliation_required", "stale", "unsupported", "approval_pending"].includes(status)
          ? "paused_or_disconnected"
          : "not_available",
    last_confirmed_operation: checkpoint
      ? {
          operation_class: checkpoint.operation_class,
          certainty: checkpoint.operation_certainty as "not_started" | "completed" | "failed" | "cancelled",
          summary: checkpoint.operation_certainty === "not_started"
            ? `The next ${ordinaryOperationV01(checkpoint.operation_class)} was durably declared and did not start.`
            : `The last ${ordinaryOperationV01(checkpoint.operation_class)} reached a durably confirmed ${checkpoint.operation_certainty} boundary.`,
          observed_at: checkpoint.observed_at,
        }
      : null,
    pending_approval: input.pending ?? null,
    next_action: { kind, label, reason, executes: false },
    gaps: input.gap ? [input.gap] : [],
    authority: REPOSITORY_RUN_RESUME_ELIGIBILITY_AUTHORITY_V01,
  };
  if (Buffer.byteLength(JSON.stringify(result), "utf8") > REPOSITORY_RUN_RESUME_LIMITS_V01.public_serialized_bytes) {
    throw new RepositoryRunResumeErrorV01("repository_resume_projection_size_exceeded", 500);
  }
  return result;
}

function requireRepositoryRunV01(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
  runId: string,
): AutonomyRunRecord {
  const run = readAutonomyRunLedgerRecord(runId, { db });
  if (
    !run ||
    run.scope !== config.project_id ||
    run.metadata.workspace_id !== config.workspace_id ||
    run.metadata.project_id !== config.project_id ||
    run.metadata.lifecycle_mode !== "managed_live" ||
    run.metadata.invocation_origin !== "repository_attachment"
  ) {
    refuse("repository_resume_checkpoint_run_binding_mismatch");
  }
  return run;
}

export function requireConsumedRepositoryRunAttachmentV01(
  db: Database.Database,
  run: AutonomyRunRecord,
) {
  const attachmentId = requiredStringV01(
    run.metadata.repository_attachment_id,
    "repository_resume_checkpoint_attachment_missing",
  );
  const attachment = readRepositoryExecutionAttachmentV01(db, attachmentId);
  if (
    !attachment ||
    attachment.workspace_id !== run.metadata.workspace_id ||
    attachment.project_id !== run.metadata.project_id ||
    attachment.lifecycle !== "consumed" ||
    attachment.consumed_run_id !== run.run_id ||
    attachment.binding_fingerprint !==
      run.metadata.repository_attachment_binding_fingerprint
  ) {
    refuse("repository_resume_checkpoint_attachment_binding_mismatch");
  }
  return attachment;
}

function readLatestDisplayCheckpointV01(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
  run: AutonomyRunRecord,
): RepositoryRunResumeCheckpointV01 | undefined {
  try {
    const latest = listRepositoryRunResumeCheckpointsV01(db, {
      ...config,
      run_id: run.run_id,
    }).at(-1);
    return latest &&
        validCheckpointMaterialV01(latest) &&
        latest.run_id === run.run_id &&
        latest.attachment_id === run.metadata.repository_attachment_id &&
        latest.attachment_binding_fingerprint ===
          run.metadata.repository_attachment_binding_fingerprint
      ? latest
      : undefined;
  } catch {
    return undefined;
  }
}

function readEventRowsV01(db: Database.Database, runId: string): EventRowV01[] {
  return db.prepare(
    `SELECT rowid AS sequence, event_id, step_id, event_type, payload_json, created_at
       FROM autonomy_run_events WHERE run_id = ? ORDER BY rowid ASC`,
  ).all(runId) as EventRowV01[];
}

function parseCheckpointEventsV01(rows: EventRowV01[]): CheckpointEventV01[] {
  return rows.flatMap((row) => {
    if (row.event_type !== "host_event_observed") return [];
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(row.payload_json) as Record<string, unknown>;
    } catch {
      throw new RepositoryRunResumeErrorV01("repository_resume_event_malformed");
    }
    if (payload.event_kind !== "work_checkpoint") return [];
    const checkpoint = payload.checkpoint;
    if (!checkpoint || typeof checkpoint !== "object" || Array.isArray(checkpoint)) {
      throw new RepositoryRunResumeErrorV01("repository_resume_checkpoint_event_malformed");
    }
    const value = checkpoint as Record<string, unknown>;
    const controllerGeneration = exactNonNegativeIntegerV01(
      payload.controller_generation,
    );
    if (
      !boundedIdentifierV01(row.step_id) ||
      typeof payload.event_id !== "string" ||
      !boundedIdentifierV01(payload.event_id) ||
      typeof value.operation_ref !== "string" ||
      !isFingerprintV01(value.operation_ref) ||
      !["command_execution", "file_change"].includes(String(value.kind)) ||
      !["declared", "started", "completed"].includes(String(value.phase)) ||
      !["not_started", "started", "completed", "failed", "cancelled"].includes(String(value.certainty)) ||
      !(
        (value.phase === "declared" && value.certainty === "not_started") ||
        (value.phase === "started" && value.certainty === "started") ||
        (value.phase === "completed" &&
          ["completed", "failed", "cancelled"].includes(String(value.certainty)))
      ) ||
      controllerGeneration < 1 ||
      !isFingerprintV01(payload.runtime_instance_fingerprint) ||
      !isFingerprintV01(payload.runtime_generation_fingerprint)
    ) {
      throw new RepositoryRunResumeErrorV01("repository_resume_checkpoint_event_malformed");
    }
    return [{
      row,
      lifecycle_event_id: payload.event_id,
      operation_ref: value.operation_ref,
      operation_class: value.kind as CheckpointEventV01["operation_class"],
      phase: value.phase as CheckpointEventV01["phase"],
      certainty: value.certainty as CheckpointEventV01["certainty"],
      controller_generation: controllerGeneration,
      runtime_instance_fingerprint: payload.runtime_instance_fingerprint,
      runtime_generation_fingerprint: payload.runtime_generation_fingerprint,
    }];
  });
}

function assertSafeEffectBoundaryV01(
  events: CheckpointEventV01[],
  boundary: CheckpointEventV01,
  requireCurrentBoundary = true,
): void {
  if (
    !(
      (boundary.phase === "declared" && boundary.certainty === "not_started") ||
      (boundary.phase === "completed" &&
        ["completed", "failed", "cancelled"].includes(boundary.certainty))
    )
  ) {
    refuse("repository_resume_checkpoint_effect_not_certain");
  }
  const throughBoundary = events.filter(
    (event) => event.row.sequence <= boundary.row.sequence,
  );
  const later = events.filter((event) => event.row.sequence > boundary.row.sequence);
  if (requireCurrentBoundary && later.length > 0) {
    refuse("repository_resume_checkpoint_later_effect_observed");
  }
  const lifecycleEventIds = new Set<string>();
  const perOperation = new Map<string, {
    operation_class: CheckpointEventV01["operation_class"];
    step_id: string;
    controller_generation: number;
    runtime_instance_fingerprint: string;
    runtime_generation_fingerprint: string;
    phases: CheckpointEventV01["phase"][];
    certainties: RepositoryRunOperationCertaintyV01[];
  }>();
  let activeOperationRef: string | null = null;
  for (const event of throughBoundary) {
    if (lifecycleEventIds.has(event.lifecycle_event_id)) {
      refuse("repository_resume_checkpoint_lifecycle_event_repeated");
    }
    lifecycleEventIds.add(event.lifecycle_event_id);
    const existing = perOperation.get(event.operation_ref);
    const state = existing ?? {
      operation_class: event.operation_class,
      step_id: event.row.step_id!,
      controller_generation: event.controller_generation,
      runtime_instance_fingerprint: event.runtime_instance_fingerprint,
      runtime_generation_fingerprint: event.runtime_generation_fingerprint,
      phases: [],
      certainties: [],
    };
    if (
      state.operation_class !== event.operation_class ||
      state.step_id !== event.row.step_id ||
      state.controller_generation !== event.controller_generation ||
      state.runtime_instance_fingerprint !== event.runtime_instance_fingerprint ||
      state.runtime_generation_fingerprint !== event.runtime_generation_fingerprint
    ) {
      refuse("repository_resume_checkpoint_operation_binding_conflict");
    }
    if (event.phase === "started") {
      if (activeOperationRef !== null) {
        refuse("repository_resume_checkpoint_operation_overlap");
      }
      activeOperationRef = event.operation_ref;
    } else if (event.phase === "completed") {
      if (activeOperationRef !== event.operation_ref) {
        refuse("repository_resume_checkpoint_terminal_sequence_invalid");
      }
      activeOperationRef = null;
    } else if (activeOperationRef !== null) {
      refuse("repository_resume_checkpoint_operation_overlap");
    }
    state.phases.push(event.phase);
    state.certainties.push(event.certainty);
    perOperation.set(event.operation_ref, state);
  }
  for (const state of perOperation.values()) {
    const phases = state.phases.join(",");
    const certainties = state.certainties.join(",");
    const declaredOnly = phases === "declared" && certainties === "not_started";
    const startedTerminal = phases === "started,completed" &&
      ["started,completed", "started,failed", "started,cancelled"].includes(
        certainties,
      );
    const declaredStartedTerminal = phases === "declared,started,completed" &&
      [
        "not_started,started,completed",
        "not_started,started,failed",
        "not_started,started,cancelled",
      ].includes(certainties);
    if (!declaredOnly && !startedTerminal && !declaredStartedTerminal) {
      refuse(
        state.phases.includes("started") && !state.phases.includes("completed")
          ? "repository_resume_checkpoint_unterminated_operation"
          : "repository_resume_checkpoint_terminal_sequence_invalid",
      );
    }
  }
}

export function validateRepositoryRunResumeCheckpointV01(
  value: RepositoryRunResumeCheckpointV01,
): boolean {
  return validCheckpointMaterialV01(value) &&
    externalRefV01(value.provider_thread_ref, "host_thread") !== null &&
    externalRefV01(value.last_turn_ref, "host_turn") !== null;
}

export function validateRepositoryRunResumeCheckpointRelationsV01(
  db: Database.Database,
  checkpoint: RepositoryRunResumeCheckpointV01,
): boolean {
  try {
    const run = readAutonomyRunLedgerRecord(checkpoint.run_id, { db });
    const attachment = readRepositoryExecutionAttachmentV01(
      db,
      checkpoint.attachment_id,
    );
    if (
      !run ||
      !attachment ||
      run.scope !== checkpoint.project_id ||
      run.metadata.workspace_id !== checkpoint.workspace_id ||
      run.metadata.project_id !== checkpoint.project_id ||
      run.metadata.lifecycle_mode !== "managed_live" ||
      run.metadata.invocation_origin !== "repository_attachment" ||
      run.metadata.repository_attachment_id !== checkpoint.attachment_id ||
      run.metadata.repository_attachment_binding_fingerprint !==
        checkpoint.attachment_binding_fingerprint ||
      run.metadata.repository_execution_envelope_fingerprint !==
        checkpoint.execution_envelope_fingerprint ||
      attachment.lifecycle !== "consumed" ||
      attachment.consumed_run_id !== checkpoint.run_id ||
      attachment.binding_fingerprint !==
        checkpoint.attachment_binding_fingerprint ||
      attachment.node_scope_fingerprint !== checkpoint.node_scope_fingerprint
    ) return false;
    const events = parseCheckpointEventsV01(
      readEventRowsV01(db, checkpoint.run_id),
    );
    const event = events.find(
      (candidate) =>
        candidate.row.sequence === checkpoint.effect_ledger_high_water_mark,
    );
    if (!event) return false;
    assertSafeEffectBoundaryV01(events, event, false);
    return Boolean(
      event.operation_ref === checkpoint.operation_ref &&
      event.operation_class === checkpoint.operation_class &&
      event.certainty === checkpoint.operation_certainty &&
      event.controller_generation === checkpoint.controller_generation &&
      event.runtime_instance_fingerprint ===
        checkpoint.runtime_instance_fingerprint &&
      event.runtime_generation_fingerprint ===
        checkpoint.runtime_generation_fingerprint &&
      event.phase ===
        (checkpoint.checkpoint_phase === "declared_pre_start"
          ? "declared"
          : "completed"),
    );
  } catch {
    return false;
  }
}

function validCheckpointMaterialV01(
  value: RepositoryRunResumeCheckpointV01,
): boolean {
  const { checkpoint_fingerprint, ...material } = value;
  return (
    value.checkpoint_version === REPOSITORY_RUN_RESUME_CHECKPOINT_VERSION_V01 &&
    value.invocation_origin === "repository_attachment" &&
    value.execution_envelope_version === "repository_execution_envelope.v0.1" &&
    value.provider_resume_binding_version ===
      NATIVE_HOST_RESUME_BINDING_VERSION_V01 &&
    isFingerprintV01(checkpoint_fingerprint) &&
    createProtocolSha256V01(canonicalizeProtocolValueV01(material)) ===
      checkpoint_fingerprint &&
    [
      value.attachment_id,
      value.attachment_binding_fingerprint,
      value.node_scope_fingerprint,
      value.execution_envelope_fingerprint,
      value.runtime_instance_fingerprint,
      value.runtime_generation_fingerprint,
      value.root_binding_fingerprint,
      value.physical_root_baseline_fingerprint,
      value.worktree_observation_fingerprint,
    ].every(isFingerprintV01) &&
    isFingerprintV01(value.operation_ref) &&
    boundedIdentifierV01(value.workspace_id) &&
    boundedIdentifierV01(value.project_id) &&
    boundedIdentifierV01(value.run_id) &&
    boundedIdentifierV01(value.step_id) &&
    boundedIdentifierV01(value.adapter_version) &&
    boundedIdentifierV01(value.capability_version) &&
    Number.isSafeInteger(value.controller_generation) &&
    value.controller_generation >= 1 &&
    [
      value.run_control_revision,
      value.step_control_revision,
      value.event_high_water_mark,
      value.step_high_water_mark,
      value.effect_ledger_high_water_mark,
    ].every((candidate) => Number.isSafeInteger(candidate) && candidate >= 0) &&
    value.event_high_water_mark >= value.step_high_water_mark &&
    value.step_high_water_mark >= value.effect_ledger_high_water_mark &&
    ["command_execution", "file_change"].includes(value.operation_class) &&
    ["not_started", "completed", "failed", "cancelled"].includes(
      value.operation_certainty,
    ) &&
    ((value.checkpoint_phase === "declared_pre_start" &&
      value.operation_certainty === "not_started") ||
      (value.checkpoint_phase === "post_operation" &&
        ["completed", "failed", "cancelled"].includes(
          value.operation_certainty,
        ))) &&
    value.approval_ref === null &&
    value.approval_state === null &&
    strictIsoTimestampV01(value.observed_at)
  );
}

function pendingApprovalV01(
  value: unknown,
  run: AutonomyRunRecord,
): RepositoryRunResumeEligibilityV01["pending_approval"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;
  if (
    candidate.approval_version !== "native_host_approval.v0.1" ||
    typeof candidate.approval_id !== "string" ||
    candidate.approval_id.length === 0 ||
    !Number.isInteger(candidate.control_revision) ||
    candidate.control_revision !==
      exactNonNegativeIntegerV01(run.metadata.control_revision) ||
    run.status !== "waiting_for_approval" ||
    candidate.decision_submitted === true ||
    !["command_execution", "file_change", "filesystem_permission", "network_permission"].includes(String(candidate.operation_class)) ||
    !Array.isArray(candidate.available_decisions) ||
    typeof candidate.resource_summary !== "string" ||
    typeof candidate.public_reason !== "string" ||
    typeof candidate.public_risk_summary !== "string" ||
    (candidate.expires_at != null &&
      !strictIsoTimestampV01(candidate.expires_at))
  ) return null;
  const decisions = candidate.available_decisions.filter(
    (decision): decision is "approve_once" | "decline" | "cancel_run" =>
      ["approve_once", "decline", "cancel_run"].includes(String(decision)),
  );
  if (
    decisions.length === 0 ||
    decisions.length !== candidate.available_decisions.length ||
    new Set(decisions).size !== decisions.length
  ) {
    return null;
  }
  return {
    operation_class: candidate.operation_class as NonNullable<RepositoryRunResumeEligibilityV01["pending_approval"]>["operation_class"],
    title: boundedTextV01(String(candidate.resource_summary ?? "Operation approval")),
    reason: boundedTextV01(String(candidate.public_reason ?? "Review the requested bounded operation.")),
    risk: boundedTextV01(String(candidate.public_risk_summary ?? "The operation may change local repository state.")),
    resource_summary: boundedTextV01(String(candidate.resource_summary ?? "Bounded repository operation")),
    available_decisions: decisions,
    expires_at: typeof candidate.expires_at === "string" ? candidate.expires_at : null,
  };
}

function countConflictingManagedRunsV01(
  db: Database.Database,
  runId: string,
  config: VNextLocalOperatorPilotConfigV01,
): number {
  return Number((db.prepare(
    `SELECT COUNT(*) AS count FROM autonomy_runs
      WHERE run_id <> ? AND scope = ?
        AND json_extract(metadata_json, '$.workspace_id') = ?
        AND json_extract(metadata_json, '$.project_id') = ?
        AND json_extract(metadata_json, '$.lifecycle_mode') = 'managed_live'
        AND status NOT IN (
          'blocked', 'completed', 'needs_review', 'cancelled',
          'timed_out', 'failed', 'stopped'
        )`,
  ).get(runId, config.project_id, config.workspace_id, config.project_id) as { count: number }).count);
}

function isPausedOrDisconnectedV01(run: AutonomyRunRecord): boolean {
  return ["paused", "running", "starting", "queued"].includes(run.status) ||
    run.metadata.controller_disconnected === true;
}

export function selectCanonicalRepositoryAttachmentRunV01(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
): AutonomyRunRecord | null {
  const rows = db.prepare(
    `SELECT run_id FROM autonomy_runs
      WHERE scope = ?
        AND json_extract(metadata_json, '$.invocation_origin') = 'repository_attachment'
      ORDER BY updated_at DESC, run_id DESC LIMIT ?`,
  ).all(
    config.project_id,
    MAX_REPOSITORY_ATTACHMENT_RUN_CANDIDATES_V01 + 1,
  ) as Array<{ run_id: string }>;
  if (rows.length > MAX_REPOSITORY_ATTACHMENT_RUN_CANDIDATES_V01) {
    refuse("repository_resume_run_candidate_bound_exceeded");
  }
  const candidates = rows.map(({ run_id: runId }) => {
    const run = requireRepositoryRunV01(db, config, runId);
    requireConsumedRepositoryRunAttachmentV01(db, run);
    return run;
  });
  const nonterminal = candidates.filter(
    (candidate) => !isTerminalRunnerStatus(candidate.status),
  );
  if (nonterminal.length > 1) {
    refuse("repository_resume_multiple_nonterminal_candidates");
  }
  return nonterminal[0] ?? candidates[0] ?? null;
}

function externalRefV01(
  value: unknown,
  expectedType:
    | "host_connection"
    | "host_thread"
    | "host_session"
    | "host_turn",
): ExternalRefV01 | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as Partial<ExternalRefV01>;
  if (
    candidate.ref_version !== "external_ref.v0.1" ||
    validateExternalRefV01(candidate).status !== "valid" ||
    candidate.ref_type !== expectedType ||
    candidate.provider !== "codex" ||
    candidate.host !== "app_server" ||
    typeof candidate.external_id !== "string" ||
    candidate.external_id.length < 1 ||
    candidate.external_id.length > 512 ||
    typeof candidate.trust_class !== "string"
  ) return null;
  const serialized = canonicalizeProtocolValueV01(candidate);
  return Buffer.byteLength(serialized, "utf8") <=
      REPOSITORY_RUN_RESUME_LIMITS_V01.private_ref_json_bytes
    ? candidate as ExternalRefV01
    : null;
}

function assertAdmissionInputV01(input: AdmitRepositoryRunResumeCheckpointInputV01): void {
  if (
    !isFingerprintV01(input.operation_ref) ||
    !isFingerprintV01(input.runtime_instance_fingerprint) ||
    !isFingerprintV01(input.runtime_generation_fingerprint) ||
    !Number.isSafeInteger(input.controller_generation) ||
    input.controller_generation < 1 ||
    !Number.isSafeInteger(input.expected_run_control_revision) ||
    input.expected_run_control_revision < 0 ||
    !Number.isSafeInteger(input.expected_step_control_revision) ||
    input.expected_step_control_revision < 0 ||
    !strictIsoTimestampV01(input.observed_at) ||
    (input.checkpoint_phase === "declared_pre_start"
      ? input.operation_certainty !== "not_started"
      : !["completed", "failed", "cancelled"].includes(input.operation_certainty))
  ) refuse("repository_resume_checkpoint_input_invalid", 422);
}

function exactNonNegativeIntegerV01(value: unknown): number {
  return Number.isSafeInteger(value) && Number(value) >= 0 ? Number(value) : -1;
}

function requiredStringV01(value: unknown, code: string): string {
  if (typeof value !== "string" || value.length < 1 || value.length > 512) {
    refuse(code);
  }
  return value;
}

function requiredFingerprintV01(value: unknown, code: string): string {
  if (typeof value !== "string" || !isFingerprintV01(value)) refuse(code);
  return value;
}

function isFingerprintV01(value: unknown): value is string {
  return typeof value === "string" && /^sha256:[a-f0-9]{64}$/.test(value);
}

function boundedIdentifierV01(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= 512;
}

function strictIsoTimestampV01(value: unknown): value is string {
  return typeof value === "string" &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString() === value;
}

function maxSequenceV01(rows: Array<{ sequence: number }>): number {
  return rows.reduce((max, row) => Math.max(max, Number(row.sequence)), 0);
}

function boundedTextV01(value: string): string {
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(
    0,
    REPOSITORY_RUN_RESUME_LIMITS_V01.public_text_characters,
  );
}

function ordinaryOperationV01(value: "command_execution" | "file_change"): string {
  return value === "command_execution" ? "repository command" : "file change";
}

function refuse(code: string, status = 409): never {
  throw new RepositoryRunResumeErrorV01(code, status);
}
