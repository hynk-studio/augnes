import type Database from "better-sqlite3";

import {
  createBoundedAutomationCapabilityGrantFingerprintV01,
  deriveBoundedAutomationCycleIdV01,
  validateBoundedAutomationCapabilityGrantV01,
} from "@/lib/vnext/bounded-automation-cycle";
import {
  autonomyRunnerLedgerSchemaExistsV01,
  listAutonomyRunLedgerRecords,
} from "@/lib/autonomy/runner-ledger";
import { isTerminalRunnerStatus } from "@/lib/autonomy/runner-state";
import {
  admitBoundedAutomationCapabilityGrantV01,
  admitQueuedVNextAutomationWorkV01,
  createAutomationWorkRefV01,
  createBoundedAutomationGrantRefV01,
  createVNextAutomationWorkSourceV01,
  listCurrentVNextAutomationWorkSnapshotsV01,
  readBoundedAutomationCapabilityGrantV01,
  readCurrentVNextAutomationWorkSnapshotV01,
  transitionVNextAutomationWorkV01,
} from "@/lib/vnext/persistence/bounded-automation-authority";
import {
  listVNextCoreRecordsV01,
  readVNextCoreRecordV01,
} from "@/lib/vnext/persistence/durable-semantic-store";
import { readCanonicalProjectWithRootV01 } from "@/lib/vnext/persistence/project-identity-registry";
import {
  readProjectAutomationControlV01,
  readProjectAutomationEffectiveStatusV01,
} from "@/lib/vnext/persistence/project-control-store";
import {
  evaluateProjectAutomationAdmissionV01,
  validateProjectAutomationPolicyV01,
} from "@/lib/vnext/project-controls/project-controls";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
  parseStrictIsoTimestampV01,
} from "@/lib/vnext/protocol-primitives";
import {
  compileBoundedAutomationTaskContextPacketV01,
} from "@/lib/vnext/runtime/persisted-semantic-context-compiler";
import {
  inspectVNextOperatorPilotPacketLineageV01,
  projectVNextOperatorPilotContinuityV01,
} from "@/lib/vnext/runtime/operator-pilot-project-continuity";
import {
  type LiveNativeHostRunServiceV01,
  getLiveNativeHostRunServiceV01,
} from "@/lib/vnext/runtime/live-native-host-run-service";
import {
  admitVNextLocalOperatorMutationInsideTransactionV01,
  authenticateVNextLocalOperatorSessionV01,
  openVNextLocalOperatorDatabaseV01,
  type VNextLocalOperatorPilotConfigV01,
  type VNextLocalOperatorSecretSourceV01,
  type VNextLocalOperatorSessionCredentialV01,
  type VNextLocalOperatorSessionMutationAdmissionV01,
} from "@/lib/vnext/runtime/local-operator-session";
import type { VNextLocalRuntimeClockV01 } from "@/lib/vnext/runtime/local-runtime-clock";
import { validateTaskContextPacketV01 } from "@/lib/vnext/task-context-packet";
import {
  BOUNDED_AUTOMATION_CAPABILITY_GRANT_VERSION_V01,
  BOUNDED_AUTOMATION_CYCLE_PROFILE_V01,
  BOUNDED_AUTOMATION_CYCLE_PROJECTION_VERSION_V01,
  type BoundedAutomationBudgetV01,
  type BoundedAutomationCapabilityGrantV01,
  type BoundedAutomationCycleProjectionV01,
} from "@/types/vnext/bounded-automation-cycle";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";
import type {
  VNextAutomationWorkSnapshotV01,
  VNextAutomationWorkSourceV01,
} from "@/types/vnext/automation-work-item";
import type { AutonomyRunSummary } from "@/types/autonomy-runner-execution";
import type { NativeHostAutomationContextV01 } from "@/types/vnext/native-host-adapter";

export const BOUNDED_AUTOMATION_CYCLE_SERVICE_VERSION_V01 =
  "bounded_automation_cycle_service.v0.1" as const;

type ProjectScopeV01 = Pick<VNextLocalOperatorPilotConfigV01, "workspace_id" | "project_id">;
export type BoundedAutomationHostContractV01 = {
  adapter_version: string;
  capability_version: string;
  timeout_ms: number;
  execution_profile: "deterministic_zero_model" | "native_host_managed_model";
  provider_egress: "forbidden" | "native_host_managed";
};
type HostContractV01 = BoundedAutomationHostContractV01;
const MAX_COMMANDS_V01 = 128;
const REQUIRED_HOST_CAPABILITY_V01 =
  "project_scoped_structured_task_round_trip.v0.1";
const PROFILE_FORBIDDEN_CAPABILITIES_V01 = [
  "authority_expansion",
  "credential_access",
  "deploy",
  "external_post",
  "merge",
  "model_invocation",
  "native_host_approval:command_execution",
  "native_host_approval:file_change",
  "native_host_approval:filesystem_permission",
  "native_host_approval:network_permission",
  "network_access",
  "publish",
  "semantic_commit",
  "strategic_analysis",
] as const;

export class BoundedAutomationCycleErrorV01 extends Error {
  constructor(readonly code: string, readonly status = 409) {
    super(code);
    this.name = "BoundedAutomationCycleErrorV01";
  }
}

export interface BoundedAutomationCycleServiceOptionsV01 {
  open_database?: (config: VNextLocalOperatorPilotConfigV01) => Database.Database;
  live_service?: LiveNativeHostRunServiceV01;
  now?: () => string;
}

type MutationInputV01 = {
  config: VNextLocalOperatorPilotConfigV01;
  credential: VNextLocalOperatorSessionCredentialV01;
  clock?: VNextLocalRuntimeClockV01;
  secret_source?: VNextLocalOperatorSecretSourceV01;
};

export class BoundedAutomationCycleServiceV01 {
  private readonly liveService: LiveNativeHostRunServiceV01;
  private readonly now: () => string;
  private readonly openDatabase: (config: VNextLocalOperatorPilotConfigV01) => Database.Database;

  constructor(options: BoundedAutomationCycleServiceOptionsV01 = {}) {
    this.liveService = options.live_service ?? getLiveNativeHostRunServiceV01();
    this.now = options.now ?? (() => new Date().toISOString());
    this.openDatabase = options.open_database ?? openVNextLocalOperatorDatabaseV01;
  }

  read(config: VNextLocalOperatorPilotConfigV01): BoundedAutomationCycleProjectionV01 {
    const db = this.openDatabase(config);
    try {
      return readBoundedAutomationCycleProjectionV01(db, {
        config,
        observed_at: this.now(),
        host: this.liveService.readCapabilityContractV01(),
      });
    } finally {
      db.close();
    }
  }

  queueCurrentTask(input: MutationInputV01): {
    status: "inserted" | "exact_replay";
    projection: BoundedAutomationCycleProjectionV01;
    session_admission: VNextLocalOperatorSessionMutationAdmissionV01;
  } {
    const db = this.openDatabase(input.config);
    let sessionAdmission: VNextLocalOperatorSessionMutationAdmissionV01;
    try {
      authenticateVNextLocalOperatorSessionV01(db, input);
      const observedAt = this.now();
      const packet = resolveQueueableCurrentPacketV01(db, input.config, observedAt);
      const sourceGrant = packet.capability_grant;
      if (!sourceGrant?.grant_external_ref || sourceGrant.coverage !== "enforced") {
        refuseV01("bounded_automation_source_grant_required", 409);
      }
      const budget = budgetV01(this.liveService.readCapabilityContractV01().timeout_ms);
      const sourceGrantFingerprint = createProtocolSha256V01(
        canonicalizeProtocolValueV01(sourceGrant),
      );
      const sourceGrantRecord = readVNextCoreRecordV01(db, {
        record_kind: "capability_grant",
        record_id: sourceGrant.grant_external_ref.external_id,
        workspace_id: input.config.workspace_id,
        project_id: input.config.project_id,
      });
      if (
        sourceGrantRecord &&
        (sourceGrantRecord.fingerprint !== sourceGrant.grant_external_ref.source_ref ||
          !validateBoundedAutomationCapabilityGrantV01(sourceGrantRecord.payload) ||
          sourceGrantRecord.payload.workspace_id !== input.config.workspace_id ||
          sourceGrantRecord.payload.project_id !== input.config.project_id ||
          sourceGrantRecord.payload.grant_id !==
            sourceGrant.grant_external_ref.external_id ||
          sourceGrantRecord.payload.grant_fingerprint !==
            sourceGrant.grant_external_ref.source_ref ||
          sourceGrantRecord.payload.allowed_capabilities.some(
            (capability) => !sourceGrant.allowed_capabilities.includes(capability),
          ) ||
          sourceGrantRecord.payload.forbidden_capabilities.some(
            (capability) => !sourceGrant.forbidden_capabilities.includes(capability),
          ) ||
          Date.parse(sourceGrantRecord.payload.expires_at) <= Date.parse(observedAt))
      ) {
        refuseV01("bounded_automation_source_grant_record_conflict", 409);
      }
      if (
        !sourceGrant.expires_at ||
        Date.parse(sourceGrant.expires_at) <= Date.parse(observedAt)
      ) {
        refuseV01("bounded_automation_source_grant_expired", 409);
      }
      const source = createVNextAutomationWorkSourceV01({
        workspace_id: input.config.workspace_id,
        project_id: input.config.project_id,
        work_class: "bounded_project_task",
        title: packet.task.goal,
        task: structuredClone(packet.task),
        source_packet: {
          packet_id: packet.packet_id,
          packet_fingerprint: packet.integrity.fingerprint,
        },
        source_capability_grant: structuredClone(sourceGrant),
        source_capability_grant_fingerprint: sourceGrantFingerprint,
        source_grant_record_status: sourceGrantRecord ? "exact_record" : "packet_bound_summary",
        required_context_refs: packet.selected_context.flatMap((entry) =>
          entry.external_ref ? [entry.external_ref] : [],
        ),
        proposed_files: [],
        required_checks: [...packet.constraints.required_checks],
        expected_outputs: [...packet.return_contract.expected_artifacts],
        blocked_actions: [...new Set([
          ...packet.constraints.forbidden_actions,
          ...PROFILE_FORBIDDEN_CAPABILITIES_V01,
        ])].sort(),
        stop_conditions: ["budget_exhausted", "cancellation_requested", "review_needed", "timeout"],
        budget_projection: {
          max_work_items: 1,
          max_active_runs: 1,
          max_attempts: 1,
          max_commands: budget.max_commands,
          max_runtime_ms: budget.max_runtime_ms,
          augnes_model_invocations: 0,
          augnes_model_tokens: 0,
          augnes_model_cost_units: 0,
          native_host_model_scope: "none",
          network_access: "denied",
        },
        created_at: observedAt,
      });
      db.exec("BEGIN IMMEDIATE");
      sessionAdmission = admitVNextLocalOperatorMutationInsideTransactionV01(db, input);
      const write = admitQueuedVNextAutomationWorkV01(db, {
        source,
        observed_at: observedAt,
      });
      db.exec("COMMIT");
      return {
        status: write.status,
        projection: this.read(input.config),
        session_admission: sessionAdmission,
      };
    } catch (error) {
      if (db.inTransaction) db.exec("ROLLBACK");
      throw error;
    } finally {
      db.close();
    }
  }

  async runOne(input: MutationInputV01 & { expected_control_revision: number }) {
    const authDb = this.openDatabase(input.config);
    try {
      authenticateVNextLocalOperatorSessionV01(authDb, input);
    } finally {
      authDb.close();
    }
    const before = this.read(input.config);
    if (before.control_revision !== input.expected_control_revision) {
      refuseV01("bounded_automation_control_revision_conflict", 409);
    }
    if (before.status === "review_needed") {
      return {
        status: "exact_replay" as const,
        projection: before,
        session_admission: null,
      };
    }
    if (["starting", "running", "reconciliation_required"].includes(before.status)) {
      const context = this.readStoredAutomationContextV01(input.config);
      const replay = await this.liveService.start({
        config: input.config,
        mode: "policy_triggered",
        automation_context: context,
        operator_mutation: input,
      });
      return {
        status: "exact_replay" as const,
        projection: this.read(input.config),
        session_admission: replay.session_admission,
      };
    }
    if (before.status !== "eligible" || !before.work_source || !before.grant) {
      refuseV01(`bounded_automation_${before.stop_reason}`, 409);
    }
    const db = this.openDatabase(input.config);
    let context: NativeHostAutomationContextV01;
    try {
      authenticateVNextLocalOperatorSessionV01(db, input);
      const observedAt = this.now();
      const resolved = resolveBoundedAutomationAdmissionV01(db, {
        config: input.config,
        observed_at: observedAt,
        host: this.liveService.readCapabilityContractV01(),
      });
      if (resolved.status !== "eligible" || !resolved.work || !resolved.source_packet || !resolved.grant || !resolved.policy_ref) {
        refuseV01(`bounded_automation_${resolved.reason}`, 409);
      }
      db.exec("BEGIN IMMEDIATE");
      const grantWrite = admitBoundedAutomationCapabilityGrantV01(db, resolved.grant);
      const persistedGrant = grantWrite.record.payload as BoundedAutomationCapabilityGrantV01;
      const workRef = createAutomationWorkRefV01(resolved.work.source);
      const grantRef = createBoundedAutomationGrantRefV01(persistedGrant);
      const compiled = compileBoundedAutomationTaskContextPacketV01(db, {
        workspace_id: input.config.workspace_id,
        project_id: input.config.project_id,
        source_packet: resolved.source_packet,
        work: resolved.work.source,
        grant: persistedGrant,
        work_ref: workRef,
        grant_ref: grantRef,
        generated_at: observedAt,
      });
      const cycleId = deriveBoundedAutomationCycleIdV01({
        grant: persistedGrant,
        packet: compiled.packet,
      });
      const triggerRef = triggerRefV01(input.config, cycleId, observedAt);
      context = {
        policy_ref: resolved.policy_ref,
        capability_grant_ref: grantRef,
        control_revision: persistedGrant.control_revision,
        automatic_retry_allowed: false,
        scheduler_started: false,
        bounded_cycle: {
          profile: BOUNDED_AUTOMATION_CYCLE_PROFILE_V01,
          cycle_id: cycleId,
          attempt: 1,
          trigger_ref: triggerRef,
          grant: persistedGrant,
        },
      };
      transitionVNextAutomationWorkV01(db, {
        workspace_id: input.config.workspace_id,
        project_id: input.config.project_id,
        work_id: resolved.work.source.work_id,
        expected_work_fingerprint: resolved.work.source.work_fingerprint,
        expected_status: "queued",
        status: "claimed",
        cycle_binding: {
          cycle_id: cycleId,
          policy_ref: resolved.policy_ref,
          control_revision: persistedGrant.control_revision,
          final_grant_ref: grantRef,
          packet_ref: packetRefV01(compiled.packet),
          trigger_ref: triggerRef,
          attempt: 1,
          run_id: `pending:${cycleId}`,
          receipt_ref: null,
          proposal_ref: null,
        },
        status_reason: "bounded_cycle_claimed_before_host_start",
        observed_at: observedAt,
      });
      db.exec("COMMIT");
    } catch (error) {
      if (db.inTransaction) db.exec("ROLLBACK");
      throw error;
    } finally {
      db.close();
    }
    const result = await this.liveService.start({
      config: input.config,
      mode: "policy_triggered",
      automation_context: context,
      operator_mutation: input,
    });
    return {
      status: result.status,
      projection: this.read(input.config),
      session_admission: result.session_admission,
    };
  }

  async cancel(input: MutationInputV01) {
    const projection = this.read(input.config);
    if (!projection.run) refuseV01("bounded_automation_active_run_missing", 409);
    const result = await this.liveService.cancel({
      config: input.config,
      run_ref: projection.run.run_id,
      control_revision: projection.run.control_revision,
      credential: input.credential,
      clock: input.clock,
      secret_source: input.secret_source,
    });
    return { status: "cancellation_admitted" as const, projection: this.read(input.config), session_admission: result.session_admission };
  }

  async retry(input: MutationInputV01) {
    const projection = this.read(input.config);
    if (!projection.retryable) refuseV01("bounded_automation_retry_not_allowed", 409);
    const result = await this.liveService.start({
      config: input.config,
      mode: "policy_triggered",
      automation_context: this.readStoredAutomationContextV01(input.config),
      operator_mutation: input,
    });
    return { status: "exact_replay" as const, projection: this.read(input.config), session_admission: result.session_admission };
  }

  private readStoredAutomationContextV01(config: VNextLocalOperatorPilotConfigV01): NativeHostAutomationContextV01 {
    const db = this.openDatabase(config);
    try {
      const run = latestPolicyRunV01(db, config);
      const stored = run?.metadata.automation_context;
      if (isNativeHostAutomationContextV01(stored)) return structuredClone(stored);
      const snapshot = listCurrentVNextAutomationWorkSnapshotsV01(db, config)
        .find((candidate) => ["claimed", "running"].includes(candidate.status));
      const binding = snapshot?.cycle_binding;
      if (!snapshot || !binding) refuseV01("bounded_automation_reconciliation_binding_missing", 409);
      const grant = readBoundedAutomationCapabilityGrantV01(db, {
        ...config,
        grant_id: binding.final_grant_ref.external_id,
        grant_fingerprint: binding.final_grant_ref.source_ref ?? "",
      });
      const context: NativeHostAutomationContextV01 = {
        policy_ref: binding.policy_ref,
        capability_grant_ref: binding.final_grant_ref,
        control_revision: binding.control_revision,
        automatic_retry_allowed: false,
        scheduler_started: false,
        bounded_cycle: {
          profile: BOUNDED_AUTOMATION_CYCLE_PROFILE_V01,
          cycle_id: binding.cycle_id,
          attempt: 1,
          trigger_ref: binding.trigger_ref,
          grant,
        },
      };
      if (!isNativeHostAutomationContextV01(context)) {
        refuseV01("bounded_automation_reconciliation_binding_conflict", 409);
      }
      return context;
    } finally {
      db.close();
    }
  }
}

export function createBoundedAutomationCycleServiceV01(options: BoundedAutomationCycleServiceOptionsV01 = {}) {
  return new BoundedAutomationCycleServiceV01(options);
}

export function readBoundedAutomationCycleProjectionV01(
  db: Database.Database,
  input: { config: VNextLocalOperatorPilotConfigV01; observed_at: string; host: HostContractV01 },
): BoundedAutomationCycleProjectionV01 {
  const resolved = resolveBoundedAutomationAdmissionV01(db, input);
  const continuity = projectVNextOperatorPilotContinuityV01(db, {
    config: input.config,
    clock: { now: () => input.observed_at },
  });
  const run = latestPolicyRunV01(db, input.config);
  const work = resolved.work ?? latestBoundAutomationWorkV01(db, input.config);
  const proposalPending = run ? exactRunProposalPendingV01(db, input.config, run) : false;
  let historicalGrant: BoundedAutomationCapabilityGrantV01 | null = null;
  let historicalGrantConflict = false;
  if (!resolved.grant && work?.cycle_binding) {
    try {
      historicalGrant = readBoundedAutomationCapabilityGrantV01(db, {
        ...input.config,
        grant_id: work.cycle_binding.final_grant_ref.external_id,
        grant_fingerprint: work.cycle_binding.final_grant_ref.source_ref ?? "",
      });
    } catch {
      historicalGrantConflict = true;
    }
  }
  const projectedGrant = resolved.grant ?? historicalGrant;
  let status = resolved.status;
  let stopReason = resolved.reason;
  let retryable = false;
  if (work?.status === "review_needed" || (run && proposalPending)) {
    status = "review_needed";
    stopReason = "review_needed";
  } else if (run && !isTerminalRunnerStatus(run.status)) {
    status = run.status === "cancelling" ? "cancellation_requested" :
      run.status === "starting" || run.status === "queued" ? "starting" :
      run.status === "paused" ? "reconciliation_required" : "running";
    stopReason = run.stop_reason ?? status;
  } else if (run?.metadata.run_assessment_proposal_status === "failed") {
    status = "proposal_settlement_failed";
    stopReason = stringMetadataV01(run.metadata.run_assessment_proposal_error_code) ?? status;
    retryable = run.metadata.run_assessment_proposal_retry_required === true;
  } else if (work?.status === "claimed" || work?.status === "running" || work?.status === "reconciliation_required") {
    status = "reconciliation_required";
    stopReason = "claimed_work_requires_exact_start_reconciliation";
  } else if (run && ["cancelled", "timed_out", "failed"].includes(run.status)) {
    status = run.status as "cancelled" | "timed_out" | "failed";
    stopReason = run.stop_reason ?? status;
  }
  if (historicalGrantConflict) {
    status = "reconciliation_required";
    stopReason = "final_grant_readback_conflict";
    retryable = false;
  }
  const runReceiptId = stringMetadataV01(run?.metadata.run_receipt_id);
  const feedbackNeeded = Boolean(
    runReceiptId &&
      continuity.latest_context_use_receipt?.receipt_id === runReceiptId &&
      continuity.latest_context_use_review_status?.later_task_run_receipt_id !== runReceiptId,
  );
  const nextAction = status === "review_needed" ? "open_review" :
    feedbackNeeded ? "provide_context_use_feedback" :
    status === "not_configured" || status === "disabled" ? "enable" :
    status === "paused" ? "resume" :
    status === "no_eligible_work" && queueablePacketAvailableV01(db, input.config, input.observed_at) ? "queue_current_task" :
    status === "eligible" ? "run_one_bounded_cycle" :
    status === "running" || status === "starting" ? "cancel" :
    status === "proposal_settlement_failed" && retryable ? "retry_proposal_settlement" : "none";
  return {
    projection_version: BOUNDED_AUTOMATION_CYCLE_PROJECTION_VERSION_V01,
    workspace_id: input.config.workspace_id,
    project_id: input.config.project_id,
    status,
    stop_reason: stopReason,
    retryable,
    control_revision: resolved.control_revision,
    work_source: work ? {
      label: work.source.title,
      work_id: work.source.work_id,
      work_fingerprint: work.source.work_fingerprint,
      lifecycle_status: work.status,
      source_packet_id: work.source.source_packet.packet_id,
      source_packet_fingerprint: work.source.source_packet.packet_fingerprint,
    } : null,
    grant: projectedGrant ? {
      grant_id: projectedGrant.grant_id,
      grant_fingerprint: projectedGrant.grant_fingerprint,
      expires_at: projectedGrant.expires_at,
      host_adapter_version: projectedGrant.host_adapter_version,
      host_capability_version: projectedGrant.host_capability_version,
      host_execution_profile: projectedGrant.host_execution_profile,
    } : null,
    budget: resolved.budget,
    run: run ? cycleRunProjectionV01(run) : null,
    feedback_needed: feedbackNeeded,
    feedback_href: feedbackNeeded && continuity.latest_applied_transition
      ? `/workbench/semantic-review/${continuity.latest_applied_transition.proposal_id.replace(":", "~")}`
      : null,
    next_action: nextAction,
    model_calls_allowed: 0,
    semantic_authority_granted: false,
    decision_created: false,
    transition_created: false,
  };
}

function resolveBoundedAutomationAdmissionV01(
  db: Database.Database,
  input: { config: VNextLocalOperatorPilotConfigV01; observed_at: string; host: HostContractV01 },
): {
  status: BoundedAutomationCycleProjectionV01["status"];
  reason: string;
  control_revision: number | null;
  work: VNextAutomationWorkSnapshotV01 | null;
  source_packet: TaskContextPacketV01 | null;
  policy_ref: ExternalRefV01 | null;
  grant: BoundedAutomationCapabilityGrantV01 | null;
  budget: BoundedAutomationBudgetV01;
} {
  const budget = budgetV01(input.host.timeout_ms);
  const controlStatus = readProjectAutomationEffectiveStatusV01(db, input.config);
  const control = readProjectAutomationControlV01(db, input.config);
  if (!control) return emptyAdmissionV01("not_configured", "automation_not_configured", budget);
  if (controlStatus.status === "disabled") return emptyAdmissionV01("disabled", "automation_disabled", budget, control.revision);
  if (controlStatus.status === "paused") return emptyAdmissionV01("paused", "automation_paused", budget, control.revision);
  if (!validateProjectAutomationPolicyV01(control.policy, input.config).valid) {
    return emptyAdmissionV01("policy_denied", "automation_policy_invalid", budget, control.revision);
  }
  const selection = selectBoundedAutomationWorkSourceV01(
    listCurrentVNextAutomationWorkSnapshotsV01(db, input.config),
  );
  if (selection.status === "none") return emptyAdmissionV01("no_eligible_work", "no_eligible_work", budget, control.revision);
  if (selection.status === "ambiguous") return emptyAdmissionV01("work_ambiguous", "work_ambiguous", budget, control.revision);
  const work = selection.work;
  let packet: TaskContextPacketV01;
  try {
    const lineage = inspectVNextOperatorPilotPacketLineageV01(db, {
      config: input.config,
      packet_id: work.source.source_packet.packet_id,
      packet_fingerprint: work.source.source_packet.packet_fingerprint,
    });
    packet = lineage.packet;
    if (!lineage.projection_current || validateTaskContextPacketV01(packet, { evaluated_at: input.observed_at }).status !== "valid") {
      return { ...emptyAdmissionV01("policy_denied", "work_source_stale", budget, control.revision), work };
    }
  } catch {
    return { ...emptyAdmissionV01("policy_denied", "work_source_stale", budget, control.revision), work };
  }
  if (input.host.execution_profile !== "deterministic_zero_model" || input.host.provider_egress !== "forbidden") {
    return { ...emptyAdmissionV01("capability_unavailable", "zero_model_host_required", budget, control.revision), work, source_packet: packet };
  }
  const registration = readCanonicalProjectWithRootV01(db, input.config);
  if (!registration) return { ...emptyAdmissionV01("policy_denied", "project_scope_conflict", budget, control.revision), work };
  const policyFingerprint = createProtocolSha256V01(canonicalizeProtocolValueV01(control.policy));
  const policyRef = externalRefV01("automation_policy", `${input.config.project_id}:${control.revision}`, control.updated_at, policyFingerprint);
  const rootFingerprint = createProtocolSha256V01(canonicalizeProtocolValueV01({
    workspace_id: input.config.workspace_id,
    project_id: input.config.project_id,
    local_root: registration.root_binding.local_root,
    binding_version: registration.root_binding.binding_version,
    bound_at: registration.root_binding.bound_at,
  }));
  let grant: BoundedAutomationCapabilityGrantV01;
  try {
    grant = buildBoundedAutomationCapabilityGrantV01({
      config: input.config,
      work: work.source,
      source_packet: packet,
      policy_ref: policyRef,
      policy_fingerprint: policyFingerprint,
      control_revision: control.revision,
      host: input.host,
      root_fingerprint: rootFingerprint,
      issued_at: work.source.created_at,
      expires_at: work.source.source_capability_grant.expires_at ?? "",
      budget,
    });
  } catch (error) {
    return {
      ...emptyAdmissionV01(
        "capability_unavailable",
        error instanceof BoundedAutomationCycleErrorV01
          ? error.code
          : "final_grant_denied",
        budget,
        control.revision,
      ),
      work,
      source_packet: packet,
    };
  }
  const active = latestPolicyRunV01(db, input.config);
  const admission = evaluateProjectAutomationAdmissionV01({
    ...input.config,
    control: controlStatus,
    candidate: input.config,
    grant_readiness: { ...input.config, status: "ready" },
    active_run_readiness: {
      ...input.config,
      active_automated_run_count: active && !isTerminalRunnerStatus(active.status) ? 1 : 0,
    },
  });
  return {
    status: admission.status === "eligible" ? "eligible" : admission.status === "active_run_limit" ? "running" : "policy_denied",
    reason: admission.status === "eligible" ? "eligible" : admission.status,
    control_revision: control.revision,
    work,
    source_packet: packet,
    policy_ref: policyRef,
    grant,
    budget,
  };
}

export function selectBoundedAutomationWorkSourceV01(
  candidates: readonly VNextAutomationWorkSnapshotV01[],
): { status: "none" } | { status: "ambiguous"; candidate_count: number } | { status: "selected"; work: VNextAutomationWorkSnapshotV01 } {
  const queued = new Map<string, VNextAutomationWorkSnapshotV01>();
  for (const candidate of candidates) {
    if (candidate.status !== "queued") continue;
    const key = `${candidate.source.work_id}\0${candidate.source.work_fingerprint}`;
    const prior = queued.get(key);
    if (!prior || candidate.revision > prior.revision) queued.set(key, candidate);
  }
  const normalized = [...queued.values()].sort((left, right) =>
    left.source.work_id.localeCompare(right.source.work_id),
  );
  if (normalized.length === 0) return { status: "none" };
  if (normalized.length > 1) return { status: "ambiguous", candidate_count: normalized.length };
  return { status: "selected", work: normalized[0]! };
}

export function buildBoundedAutomationCapabilityGrantV01(input: {
  config: ProjectScopeV01;
  work: VNextAutomationWorkSourceV01;
  source_packet: TaskContextPacketV01;
  policy_ref: ExternalRefV01;
  policy_fingerprint: string;
  control_revision: number;
  host: HostContractV01;
  root_fingerprint: string;
  issued_at: string;
  expires_at: string;
  budget: BoundedAutomationBudgetV01;
}): BoundedAutomationCapabilityGrantV01 {
  const sourceGrant = input.source_packet.capability_grant;
  if (
    input.host.execution_profile !== "deterministic_zero_model" ||
    input.host.provider_egress !== "forbidden" ||
    !sourceGrant?.grant_external_ref ||
    sourceGrant.coverage !== "enforced" ||
    input.work.source_packet.packet_id !== input.source_packet.packet_id ||
    input.work.source_packet.packet_fingerprint !== input.source_packet.integrity.fingerprint ||
    canonicalizeProtocolValueV01(sourceGrant) !== canonicalizeProtocolValueV01(input.work.source_capability_grant) ||
    input.work.source_capability_grant_fingerprint !== createProtocolSha256V01(canonicalizeProtocolValueV01(sourceGrant)) ||
    !sourceGrant.allowed_capabilities.includes(REQUIRED_HOST_CAPABILITY_V01) ||
    sourceGrant.forbidden_capabilities.includes(REQUIRED_HOST_CAPABILITY_V01) ||
    !sourceGrant.resource_scope.includes(input.config.project_id)
  ) {
    refuseV01("bounded_automation_final_grant_source_conflict", 409);
  }
  const allowed = [REQUIRED_HOST_CAPABILITY_V01];
  const forbidden = [...new Set([
    ...sourceGrant.forbidden_capabilities,
    ...input.work.blocked_actions,
    ...PROFILE_FORBIDDEN_CAPABILITIES_V01,
  ])].sort();
  if (allowed.some((capability) => forbidden.includes(capability))) {
    refuseV01("bounded_automation_final_grant_capability_overlap", 409);
  }
  const packetIntentFingerprint = createProtocolSha256V01(canonicalizeProtocolValueV01({
    workspace_id: input.config.workspace_id,
    project_id: input.config.project_id,
    work_id: input.work.work_id,
    work_fingerprint: input.work.work_fingerprint,
    source_packet: input.work.source_packet,
    task: input.work.task,
    required_checks: input.work.required_checks,
    expected_outputs: input.work.expected_outputs,
    blocked_actions: input.work.blocked_actions,
    source_grant_record_fingerprint:
      sourceGrant.grant_external_ref.source_ref ??
      input.work.source_capability_grant_fingerprint,
    source_capability_grant_fingerprint:
      input.work.source_capability_grant_fingerprint,
  }));
  const material = {
    grant_version: BOUNDED_AUTOMATION_CAPABILITY_GRANT_VERSION_V01,
    profile: BOUNDED_AUTOMATION_CYCLE_PROFILE_V01,
    workspace_id: input.config.workspace_id,
    project_id: input.config.project_id,
    policy_ref: input.policy_ref,
    policy_fingerprint: input.policy_fingerprint,
    control_revision: input.control_revision,
    source_grant_ref: sourceGrant.grant_external_ref,
    source_grant_fingerprint:
      sourceGrant.grant_external_ref.source_ref ??
      input.work.source_capability_grant_fingerprint,
    work_source_ref: createAutomationWorkRefV01(input.work),
    work_source_fingerprint: input.work.work_fingerprint,
    packet_intent_fingerprint: packetIntentFingerprint,
    host_adapter_version: input.host.adapter_version,
    host_capability_version: input.host.capability_version,
    host_execution_profile: "deterministic_zero_model" as const,
    host_provider_egress: "forbidden" as const,
    root_fingerprint: input.root_fingerprint,
    allowed_capabilities: allowed,
    forbidden_capabilities: forbidden,
    resource_scope: [...new Set([
      ...sourceGrant.resource_scope.filter((value) => value === input.config.project_id),
      input.config.project_id,
      `project_root:${input.root_fingerprint}`,
    ])].sort(),
    stop_conditions: [...new Set([
      ...sourceGrant.stop_conditions,
      ...input.work.stop_conditions,
      "budget_exhausted",
      "cancellation_requested",
      "review_needed",
      "timeout",
    ])].sort(),
    budget: input.budget,
    issued_at: input.issued_at,
    expires_at: input.expires_at,
    grants_semantic_authority: false as const,
    grants_external_action_authority: false as const,
    grants_credential_access: false as const,
    can_merge: false as const,
    can_publish: false as const,
    can_deploy: false as const,
    can_expand_authority: false as const,
  };
  const fingerprint = createBoundedAutomationCapabilityGrantFingerprintV01(material);
  const grant = { ...material, grant_id: `bounded-grant:${fingerprint.slice(0, 24)}`, grant_fingerprint: fingerprint };
  if (!validateBoundedAutomationCapabilityGrantV01(grant)) {
    refuseV01("bounded_automation_final_grant_invalid", 422);
  }
  return grant;
}

function resolveQueueableCurrentPacketV01(db: Database.Database, config: VNextLocalOperatorPilotConfigV01, observedAt: string): TaskContextPacketV01 {
  const continuity = projectVNextOperatorPilotContinuityV01(db, { config, clock: { now: () => observedAt } });
  const latest = continuity.latest_compiled_packet;
  if (!latest || continuity.packet_currentness !== "fresh") refuseV01("bounded_automation_queue_packet_unavailable", 409);
  const lineage = inspectVNextOperatorPilotPacketLineageV01(db, {
    config,
    packet_id: latest.packet_id,
    packet_fingerprint: latest.packet_fingerprint,
  });
  if (!lineage.projection_current) refuseV01("bounded_automation_queue_packet_stale", 409);
  const receiptRecords = listVNextCoreRecordsV01(db, {
    ...config,
    record_kinds: ["run_receipt"],
    limit: 129,
  });
  if (receiptRecords.length > 128) {
    refuseV01("bounded_automation_receipt_history_bound_exceeded", 422);
  }
  const alreadyExecuted = receiptRecords
    .some((record) => {
      const payload = record.payload as { task_context_packet_ref?: { external_id?: unknown; source_ref?: unknown } };
      return payload.task_context_packet_ref?.external_id === latest.packet_id && payload.task_context_packet_ref.source_ref === latest.packet_fingerprint;
    });
  if (alreadyExecuted) refuseV01("bounded_automation_queue_packet_already_executed", 409);
  return lineage.packet;
}

function queueablePacketAvailableV01(db: Database.Database, config: VNextLocalOperatorPilotConfigV01, observedAt: string): boolean {
  try { resolveQueueableCurrentPacketV01(db, config, observedAt); return true; } catch { return false; }
}

function budgetV01(timeoutMs: number): BoundedAutomationBudgetV01 {
  return {
    budget_version: "bounded_automation_budget.v0.1",
    max_work_items: 1,
    max_active_runs: 1,
    max_attempts: 1,
    max_runtime_ms: timeoutMs,
    max_commands: MAX_COMMANDS_V01,
    max_augnes_model_invocations: 0,
    max_augnes_model_tokens: 0,
    max_augnes_model_cost_units: 0,
    native_host_model_scope: "none",
    host_egress: "local_in_process_only",
    network_access: "denied",
    automatic_retry: false,
  };
}

function latestPolicyRunV01(db: Database.Database, config: ProjectScopeV01): AutonomyRunSummary | null {
  if (!autonomyRunnerLedgerSchemaExistsV01(db)) return null;
  return listAutonomyRunLedgerRecords({ db, scope: config.project_id, limit: 128 })
    .find((run) => run.metadata.workspace_id === config.workspace_id && run.metadata.project_id === config.project_id && run.metadata.invocation_origin === "policy_triggered" && run.metadata.bounded_automation_cycle_id != null) ?? null;
}

function latestBoundAutomationWorkV01(db: Database.Database, config: ProjectScopeV01): VNextAutomationWorkSnapshotV01 | null {
  return listCurrentVNextAutomationWorkSnapshotsV01(db, config)
    .sort((left, right) => right.revision - left.revision || right.observed_at.localeCompare(left.observed_at))[0] ?? null;
}

function exactRunProposalPendingV01(db: Database.Database, config: ProjectScopeV01, run: AutonomyRunSummary): boolean {
  const proposalId = stringMetadataV01(run.metadata.run_assessment_proposal_id);
  if (!proposalId) return false;
  return !listVNextCoreRecordsV01(db, { ...config, record_kinds: ["review_decision"], limit: 128 }).some((record) => {
    const payload = record.payload as { source_proposal?: { proposal_id?: unknown } };
    return payload.source_proposal?.proposal_id === proposalId;
  });
}

function cycleRunProjectionV01(run: AutonomyRunSummary): NonNullable<BoundedAutomationCycleProjectionV01["run"]> {
  const receiptId = stringMetadataV01(run.metadata.run_receipt_id);
  const proposalId = stringMetadataV01(run.metadata.run_assessment_proposal_id);
  return {
    run_id: run.run_id,
    status: run.status,
    attempt: numberMetadataV01(run.metadata.bounded_automation_attempt) ?? 1,
    control_revision: numberMetadataV01(run.metadata.control_revision) ?? 0,
    cancellation_requested: run.metadata.cancellation_requested === true,
    reconciliation_required: run.metadata.reconciliation_required === true,
    receipt_id: receiptId,
    proposal_id: proposalId,
    result_href: receiptId ? `/workbench/results/${receiptId.replace(":", "~")}` : null,
    proposal_href: proposalId ? `/workbench/semantic-review/${proposalId.replace(":", "~")}` : null,
  };
}

function emptyAdmissionV01(status: BoundedAutomationCycleProjectionV01["status"], reason: string, budget: BoundedAutomationBudgetV01, controlRevision: number | null = null) {
  return { status, reason, control_revision: controlRevision, work: null, source_packet: null, policy_ref: null, grant: null, budget };
}

function externalRefV01(refType: string, externalId: string, observedAt: string, sourceRef: string): ExternalRefV01 {
  return { ref_version: "external_ref.v0.1", ref_type: refType, external_id: externalId, observed_at: observedAt, source_ref: sourceRef, compatibility_namespace: BOUNDED_AUTOMATION_CYCLE_PROFILE_V01, trust_class: "direct_local_observation" };
}
function triggerRefV01(config: ProjectScopeV01, cycleId: string, observedAt: string): ExternalRefV01 {
  return externalRefV01("bounded_automation_trigger", `${config.project_id}:${cycleId}`, observedAt, createProtocolSha256V01(cycleId));
}
function packetRefV01(packet: TaskContextPacketV01): ExternalRefV01 {
  return externalRefV01("task_context_packet", packet.packet_id, packet.generated_at, packet.integrity.fingerprint);
}
function stringMetadataV01(value: unknown): string | null { return typeof value === "string" && value.length > 0 ? value : null; }
function numberMetadataV01(value: unknown): number | null { return Number.isSafeInteger(value) ? Number(value) : null; }

function isNativeHostAutomationContextV01(value: unknown): value is NativeHostAutomationContextV01 {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Partial<NativeHostAutomationContextV01>;
  const cycle = candidate.bounded_cycle;
  if (
    candidate.automatic_retry_allowed !== false ||
    candidate.scheduler_started !== false ||
    candidate.policy_ref?.ref_version !== "external_ref.v0.1" ||
    candidate.capability_grant_ref?.ref_version !== "external_ref.v0.1" ||
    cycle?.profile !== BOUNDED_AUTOMATION_CYCLE_PROFILE_V01 ||
    !validateBoundedAutomationCapabilityGrantV01(cycle.grant) ||
    candidate.capability_grant_ref.external_id !== cycle.grant.grant_id ||
    candidate.capability_grant_ref.source_ref !== cycle.grant.grant_fingerprint
  ) return false;
  const packetId = readPacketIdentityFromCycleBindingV01(cycle.cycle_id, cycle.grant);
  return packetId !== null;
}

function readPacketIdentityFromCycleBindingV01(cycleId: string, grant: BoundedAutomationCapabilityGrantV01): string | null {
  return cycleId.startsWith("bounded-cycle:") && grant.grant_id.startsWith("bounded-grant:") ? cycleId : null;
}

function refuseV01(code: string, status = 409): never {
  throw new BoundedAutomationCycleErrorV01(code, status);
}
