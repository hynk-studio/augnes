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
import { readCanonicalProjectWithRootV01 } from "@/lib/vnext/persistence/project-identity-registry";
import {
  readProjectAutomationControlV01,
  readProjectAutomationEffectiveStatusV01,
} from "@/lib/vnext/persistence/project-control-store";
import { listVNextCoreRecordsV01 } from "@/lib/vnext/persistence/durable-semantic-store";
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
  inspectVNextOperatorPilotPacketLineageV01,
  projectVNextOperatorPilotContinuityV01,
} from "@/lib/vnext/runtime/operator-pilot-project-continuity";
import { validateTaskContextPacketV01 } from "@/lib/vnext/task-context-packet";
import { VNEXT_PERSISTED_SEMANTIC_CONTEXT_COMPILER_VERSION_V01 } from "@/lib/vnext/runtime/persisted-semantic-context-compiler";
import {
  type LiveNativeHostRunServiceV01,
  getLiveNativeHostRunServiceV01,
} from "@/lib/vnext/runtime/live-native-host-run-service";
import type {
  VNextLocalOperatorPilotConfigV01,
  VNextLocalOperatorSecretSourceV01,
  VNextLocalOperatorSessionCredentialV01,
} from "@/lib/vnext/runtime/local-operator-session";
import { openVNextLocalOperatorDatabaseV01 } from "@/lib/vnext/runtime/local-operator-session";
import type { VNextLocalRuntimeClockV01 } from "@/lib/vnext/runtime/local-runtime-clock";
import type { AutonomyRunSummary } from "@/types/autonomy-runner-execution";
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
import type { NativeHostAutomationContextV01 } from "@/types/vnext/native-host-adapter";

export const BOUNDED_AUTOMATION_CYCLE_SERVICE_VERSION_V01 =
  "bounded_automation_cycle_service.v0.1" as const;
type ProjectScopeV01 = Pick<
  VNextLocalOperatorPilotConfigV01,
  "workspace_id" | "project_id"
>;
const MAX_COMMANDS_V01 = 128;

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

  async runOne(input: {
    config: VNextLocalOperatorPilotConfigV01;
    expected_control_revision: number;
    credential: VNextLocalOperatorSessionCredentialV01;
    clock?: VNextLocalRuntimeClockV01;
    secret_source?: VNextLocalOperatorSecretSourceV01;
  }) {
    const before = this.read(input.config);
    if (before.control_revision !== input.expected_control_revision) {
      refuseV01("bounded_automation_control_revision_conflict", 409);
    }
    if (before.status === "review_needed") {
      const context = this.readStoredAutomationContextV01(input.config);
      const replay = await this.liveService.start({
        config: input.config,
        mode: "policy_triggered",
        automation_context: context,
        operator_mutation: {
          credential: input.credential,
          clock: input.clock,
          secret_source: input.secret_source,
        },
      });
      return {
        status: "exact_replay" as const,
        projection: this.read(input.config),
        session_admission: replay.session_admission,
      };
    }
    if (before.status !== "eligible" || !before.grant || !before.work_source) {
      refuseV01(`bounded_automation_${before.stop_reason}`, 409);
    }
    const db = this.openDatabase(input.config);
    let context;
    try {
      const resolved = resolveBoundedAutomationAdmissionV01(db, {
        config: input.config,
        observed_at: this.now(),
        host: this.liveService.readCapabilityContractV01(),
      });
      if (!resolved.grant || !resolved.packet || !resolved.policy_ref) {
        refuseV01("bounded_automation_admission_conflict", 409);
      }
      const cycleId = deriveBoundedAutomationCycleIdV01({
        grant: resolved.grant,
        packet: resolved.packet,
      });
      context = {
        policy_ref: resolved.policy_ref,
        capability_grant_ref: resolved.packet.capability_grant!.grant_external_ref!,
        control_revision: resolved.grant.control_revision,
        automatic_retry_allowed: false as const,
        scheduler_started: false as const,
        bounded_cycle: {
          profile: BOUNDED_AUTOMATION_CYCLE_PROFILE_V01,
          cycle_id: cycleId,
          attempt: 1 as const,
          trigger_ref: triggerRefV01(input.config, cycleId, resolved.grant.issued_at),
          grant: resolved.grant,
        },
      };
    } finally {
      db.close();
    }
    const result = await this.liveService.start({
      config: input.config,
      mode: "policy_triggered",
      automation_context: context,
      operator_mutation: {
        credential: input.credential,
        clock: input.clock,
        secret_source: input.secret_source,
      },
    });
    return {
      status: result.status,
      projection: this.read(input.config),
      session_admission: result.session_admission,
    };
  }

  async cancel(input: {
    config: VNextLocalOperatorPilotConfigV01;
    credential: VNextLocalOperatorSessionCredentialV01;
    clock?: VNextLocalRuntimeClockV01;
    secret_source?: VNextLocalOperatorSecretSourceV01;
  }) {
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
    return {
      status: "cancellation_admitted" as const,
      projection: this.read(input.config),
      session_admission: result.session_admission,
    };
  }

  async retry(input: {
    config: VNextLocalOperatorPilotConfigV01;
    credential: VNextLocalOperatorSessionCredentialV01;
    clock?: VNextLocalRuntimeClockV01;
    secret_source?: VNextLocalOperatorSecretSourceV01;
  }) {
    const projection = this.read(input.config);
    if (!projection.retryable) refuseV01("bounded_automation_retry_not_allowed", 409);
    const automationContext = this.readStoredAutomationContextV01(input.config);
    const result = await this.liveService.start({
      config: input.config,
      mode: "policy_triggered",
      automation_context: automationContext,
      operator_mutation: {
        credential: input.credential,
        clock: input.clock,
        secret_source: input.secret_source,
      },
    });
    return {
      status: "exact_replay" as const,
      projection: this.read(input.config),
      session_admission: result.session_admission,
    };
  }

  private readStoredAutomationContextV01(
    config: VNextLocalOperatorPilotConfigV01,
  ): NativeHostAutomationContextV01 {
    const db = this.openDatabase(config);
    try {
      const run = latestPolicyRunV01(db, config);
      const stored = run?.metadata.automation_context;
      if (!isNativeHostAutomationContextV01(stored)) {
        refuseV01("bounded_automation_reconciliation_binding_missing", 409);
      }
      return structuredClone(stored);
    } finally {
      db.close();
    }
  }
}

export function createBoundedAutomationCycleServiceV01(
  options: BoundedAutomationCycleServiceOptionsV01 = {},
): BoundedAutomationCycleServiceV01 {
  return new BoundedAutomationCycleServiceV01(options);
}

export function readBoundedAutomationCycleProjectionV01(
  db: Database.Database,
  input: {
    config: VNextLocalOperatorPilotConfigV01;
    observed_at: string;
    host: { adapter_version: string; capability_version: string; timeout_ms: number };
  },
): BoundedAutomationCycleProjectionV01 {
  const resolved = resolveBoundedAutomationAdmissionV01(db, input);
  const continuity = projectVNextOperatorPilotContinuityV01(db, {
    config: input.config,
    clock: { now: () => input.observed_at },
  });
  const run = latestPolicyRunV01(db, input.config);
  const runProjection = run ? cycleRunProjectionV01(run) : null;
  const proposalPending = run ? exactRunProposalPendingV01(db, input.config, run) : false;
  let status = resolved.status;
  let stopReason = resolved.reason;
  let retryable = false;
  if (run && !isTerminalRunnerStatus(run.status)) {
    status = run.status === "cancelling" ? "cancellation_requested" :
      run.status === "starting" || run.status === "queued" ? "starting" :
      run.status === "paused" ? "reconciliation_required" : "running";
    stopReason = typeof run.stop_reason === "string" ? run.stop_reason : status;
  } else if (run && proposalPending) {
    status = "review_needed";
    stopReason = "review_needed";
  } else if (run?.metadata.run_assessment_proposal_status === "failed") {
    status = "proposal_settlement_failed";
    stopReason = stringMetadataV01(run.metadata.run_assessment_proposal_error_code) ?? status;
    retryable = run.metadata.run_assessment_proposal_retry_required === true;
  } else if (run && ["cancelled", "timed_out", "failed"].includes(run.status)) {
    status = run.status as "cancelled" | "timed_out" | "failed";
    stopReason = run.stop_reason ?? status;
  } else if (run?.metadata.run_assessment_proposal_status === "available") {
    status = "no_eligible_work";
    stopReason = "completed_work_reviewed";
  } else if (run && run.metadata.run_receipt_id) {
    status = "proposal_settlement_pending";
    stopReason = "proposal_settlement_pending";
  }
  const runReceiptId = stringMetadataV01(run?.metadata.run_receipt_id);
  const feedbackNeeded = Boolean(
    runReceiptId &&
      continuity.latest_context_use_receipt?.receipt_id === runReceiptId &&
      continuity.latest_context_use_review_status?.later_task_run_receipt_id !==
        runReceiptId,
  );
  return {
    projection_version: BOUNDED_AUTOMATION_CYCLE_PROJECTION_VERSION_V01,
    workspace_id: input.config.workspace_id,
    project_id: input.config.project_id,
    status,
    stop_reason: stopReason,
    retryable,
    control_revision: resolved.control_revision,
    work_source: resolved.packet ? {
      label: resolved.packet.task.goal,
      packet_id: resolved.packet.packet_id,
      packet_fingerprint: resolved.packet.integrity.fingerprint,
    } : null,
    grant: resolved.grant ? {
      grant_id: resolved.grant.grant_id,
      grant_fingerprint: resolved.grant.grant_fingerprint,
      expires_at: resolved.grant.expires_at,
      host_adapter_version: resolved.grant.host_adapter_version,
      host_capability_version: resolved.grant.host_capability_version,
    } : null,
    budget: resolved.budget,
    run: runProjection,
    feedback_needed: feedbackNeeded,
    feedback_href:
      feedbackNeeded && continuity.latest_applied_transition
        ? `/workbench/semantic-review/${continuity.latest_applied_transition.proposal_id.replace(":", "~")}`
        : null,
    next_action: status === "review_needed" ? "open_review" :
      feedbackNeeded ? "provide_context_use_feedback" :
      status === "not_configured" || status === "disabled" ? "enable" :
      status === "paused" ? "resume" :
      status === "eligible" ? "run_one_bounded_cycle" :
      status === "running" || status === "starting" ? "cancel" :
      status === "proposal_settlement_failed" && retryable ? "retry_proposal_settlement" :
      "none",
    model_calls_allowed: 0,
    semantic_authority_granted: false,
    decision_created: false,
    transition_created: false,
  };
}

function resolveBoundedAutomationAdmissionV01(
  db: Database.Database,
  input: {
    config: VNextLocalOperatorPilotConfigV01;
    observed_at: string;
    host: { adapter_version: string; capability_version: string; timeout_ms: number };
  },
): {
  status: BoundedAutomationCycleProjectionV01["status"];
  reason: string;
  control_revision: number | null;
  packet: TaskContextPacketV01 | null;
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
  const workSelection = selectPersistedBoundedAutomationWorkV01(db, input);
  if (workSelection.status === "none") {
    return emptyAdmissionV01("no_eligible_work", "no_eligible_work", budget, control.revision);
  }
  if (workSelection.status === "ambiguous") {
    return emptyAdmissionV01("work_ambiguous", "work_ambiguous", budget, control.revision);
  }
  const packet = workSelection.packet;
  const summary = packet.capability_grant;
  const nowMs = parseStrictIsoTimestampV01(input.observed_at);
  const expiresMs = summary?.expires_at ? parseStrictIsoTimestampV01(summary.expires_at) : null;
  if (!summary || summary.coverage !== "enforced" || !summary.grant_external_ref) {
    return { ...emptyAdmissionV01("grant_required", "capability_grant_required", budget, control.revision), packet };
  }
  if (nowMs === null || expiresMs === null || expiresMs <= nowMs) {
    return { ...emptyAdmissionV01("grant_expired", "capability_grant_expired", budget, control.revision), packet };
  }
  const supported = summary.allowed_capabilities.some((value) =>
    [
      "codex_native_host",
      "native_host.execute_project_task",
      "project_scoped_structured_task_round_trip.v0.1",
    ].includes(value),
  );
  const forbidden = summary.forbidden_capabilities.some((value) =>
    [
      "codex_native_host",
      "native_host.execute_project_task",
      "project_scoped_structured_task_round_trip.v0.1",
    ].includes(value),
  );
  if (!supported || forbidden || !summary.resource_scope.includes(input.config.project_id)) {
    return { ...emptyAdmissionV01("capability_unavailable", "unsupported_capability", budget, control.revision), packet };
  }
  const registration = readCanonicalProjectWithRootV01(db, input.config);
  if (!registration) return emptyAdmissionV01("policy_denied", "project_scope_conflict", budget, control.revision);
  const policyFingerprint = createProtocolSha256V01(canonicalizeProtocolValueV01(control.policy));
  const policyRef = externalRefV01("automation_policy", `${input.config.project_id}:${control.revision}`, control.updated_at, policyFingerprint);
  const rootFingerprint = createProtocolSha256V01(canonicalizeProtocolValueV01({
    workspace_id: input.config.workspace_id,
    project_id: input.config.project_id,
    local_root: registration.root_binding.local_root,
    binding_version: registration.root_binding.binding_version,
    bound_at: registration.root_binding.bound_at,
  }));
  const grant = buildBoundedAutomationCapabilityGrantV01({
    config: input.config,
    packet,
    policy_ref: policyRef,
    policy_fingerprint: policyFingerprint,
    control_revision: control.revision,
    host: input.host,
    root_fingerprint: rootFingerprint,
    issued_at: control.updated_at,
    expires_at: summary.expires_at!,
    budget,
  });
  const activeCount = latestPolicyRunV01(db, input.config);
  const admission = evaluateProjectAutomationAdmissionV01({
    ...input.config,
    control: controlStatus,
    candidate: input.config,
    grant_readiness: { ...input.config, status: "ready" },
    active_run_readiness: {
      ...input.config,
      active_automated_run_count:
        activeCount && !isTerminalRunnerStatus(activeCount.status) ? 1 : 0,
    },
  });
  return {
    status: admission.status === "eligible" ? "eligible" :
      admission.status === "active_run_limit" ? "running" : "policy_denied",
    reason: admission.status === "eligible" ? "eligible" : admission.status,
    control_revision: control.revision,
    packet,
    policy_ref: policyRef,
    grant,
    budget,
  };
}

export function selectBoundedAutomationWorkSourceV01(
  candidates: readonly TaskContextPacketV01[],
):
  | { status: "none" }
  | { status: "ambiguous"; candidate_count: number }
  | { status: "selected"; packet: TaskContextPacketV01 } {
  const byIdentity = new Map<string, TaskContextPacketV01>();
  for (const packet of candidates) {
    byIdentity.set(
      `${packet.packet_id}\0${packet.integrity.fingerprint}`,
      packet,
    );
  }
  const normalized = [...byIdentity.values()].sort((left, right) =>
    left.packet_id === right.packet_id
      ? left.integrity.fingerprint.localeCompare(right.integrity.fingerprint)
      : left.packet_id.localeCompare(right.packet_id),
  );
  if (normalized.length === 0) return { status: "none" };
  if (normalized.length > 1) {
    return { status: "ambiguous", candidate_count: normalized.length };
  }
  return { status: "selected", packet: normalized[0]! };
}

function selectPersistedBoundedAutomationWorkV01(
  db: Database.Database,
  input: {
    config: VNextLocalOperatorPilotConfigV01;
    observed_at: string;
  },
) {
  const records = listVNextCoreRecordsV01(db, {
    workspace_id: input.config.workspace_id,
    project_id: input.config.project_id,
    record_kinds: ["task_context_packet"],
    limit: 65,
  });
  if (records.length > 64) {
    return { status: "ambiguous" as const, candidate_count: records.length };
  }
  const candidates: TaskContextPacketV01[] = [];
  for (const record of records) {
    const packet = record.payload as TaskContextPacketV01;
    if (
      !packet.compatibility?.source_contracts?.includes(
        VNEXT_PERSISTED_SEMANTIC_CONTEXT_COMPILER_VERSION_V01,
      )
    ) {
      continue;
    }
    const inspection = inspectVNextOperatorPilotPacketLineageV01(db, {
      config: input.config,
      packet_id: packet.packet_id,
      packet_fingerprint: packet.integrity.fingerprint,
    });
    if (
      inspection.projection_current &&
      packet.capability_grant?.coverage === "enforced" &&
      packet.capability_grant.grant_external_ref !== null &&
      validateTaskContextPacketV01(packet, {
        evaluated_at: input.observed_at,
      }).status === "valid"
    ) {
      candidates.push(packet);
    }
  }
  return selectBoundedAutomationWorkSourceV01(candidates);
}

export function buildBoundedAutomationCapabilityGrantV01(input: {
  config: ProjectScopeV01;
  packet: TaskContextPacketV01;
  policy_ref: ExternalRefV01;
  policy_fingerprint: string;
  control_revision: number;
  host: { adapter_version: string; capability_version: string; timeout_ms: number };
  root_fingerprint: string;
  issued_at: string;
  expires_at: string;
  budget: BoundedAutomationBudgetV01;
}): BoundedAutomationCapabilityGrantV01 {
  const summary = input.packet.capability_grant;
  if (!summary?.grant_external_ref) refuseV01("bounded_automation_grant_required", 409);
  const material = {
    grant_version: BOUNDED_AUTOMATION_CAPABILITY_GRANT_VERSION_V01,
    profile: BOUNDED_AUTOMATION_CYCLE_PROFILE_V01,
    workspace_id: input.config.workspace_id,
    project_id: input.config.project_id,
    policy_ref: input.policy_ref,
    policy_fingerprint: input.policy_fingerprint,
    control_revision: input.control_revision,
    work_source_ref: externalRefV01("task_context_packet", input.packet.packet_id, input.packet.generated_at, input.packet.integrity.fingerprint),
    packet_id: input.packet.packet_id,
    packet_fingerprint: input.packet.integrity.fingerprint,
    host_adapter_version: input.host.adapter_version,
    host_capability_version: input.host.capability_version,
    root_fingerprint: input.root_fingerprint,
    allowed_capabilities: [...summary.allowed_capabilities].sort(),
    forbidden_capabilities: [...new Set([...summary.forbidden_capabilities, "credential_access", "merge", "publish", "deploy", "external_post", "model_invocation", "network_access"])].sort(),
    resource_scope: [...summary.resource_scope].sort(),
    stop_conditions: [...new Set([...summary.stop_conditions, "review_needed", "manual_pause", "cancellation_requested", "timeout", "budget_exhausted"])].sort(),
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
  const fingerprint =
    createBoundedAutomationCapabilityGrantFingerprintV01(material);
  return { ...material, grant_id: `bounded-grant:${fingerprint.slice(0, 24)}`, grant_fingerprint: fingerprint };
}

function budgetV01(timeoutMs: number): BoundedAutomationBudgetV01 {
  return {
    budget_version: "bounded_automation_budget.v0.1",
    max_work_items: 1,
    max_active_runs: 1,
    max_attempts: 1,
    max_runtime_ms: timeoutMs,
    max_commands: MAX_COMMANDS_V01,
    max_model_invocations: 0,
    max_model_tokens: 0,
    max_model_cost_units: 0,
    network_access: "denied",
    automatic_retry: false,
  };
}

function latestPolicyRunV01(db: Database.Database, config: ProjectScopeV01): AutonomyRunSummary | null {
  if (!autonomyRunnerLedgerSchemaExistsV01(db)) return null;
  return listAutonomyRunLedgerRecords({ db, scope: config.project_id, limit: 128 })
    .find((run) => run.metadata.workspace_id === config.workspace_id &&
      run.metadata.project_id === config.project_id &&
      run.metadata.invocation_origin === "policy_triggered" &&
      run.metadata.bounded_automation_cycle_id != null) ?? null;
}

function exactRunProposalPendingV01(db: Database.Database, config: ProjectScopeV01, run: AutonomyRunSummary): boolean {
  const proposalId = stringMetadataV01(run.metadata.run_assessment_proposal_id);
  if (!proposalId) return false;
  return !listVNextCoreRecordsV01(db, { ...config, record_kinds: ["review_decision"], limit: 128 })
    .some((record) => {
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
    result_href: receiptId
      ? `/workbench/results/${receiptId.replace(":", "~")}`
      : null,
    proposal_href: proposalId ? `/workbench/semantic-review/${proposalId.replace(":", "~")}` : null,
  };
}

function emptyAdmissionV01(status: BoundedAutomationCycleProjectionV01["status"], reason: string, budget: BoundedAutomationBudgetV01, controlRevision: number | null = null) {
  return { status, reason, control_revision: controlRevision, packet: null, policy_ref: null, grant: null, budget };
}

function externalRefV01(refType: string, externalId: string, observedAt: string, sourceRef: string): ExternalRefV01 {
  return { ref_version: "external_ref.v0.1", ref_type: refType, external_id: externalId, observed_at: observedAt, source_ref: sourceRef, compatibility_namespace: BOUNDED_AUTOMATION_CYCLE_PROFILE_V01, trust_class: "direct_local_observation" };
}

function triggerRefV01(config: VNextLocalOperatorPilotConfigV01, cycleId: string, observedAt: string): ExternalRefV01 {
  return externalRefV01("bounded_automation_trigger", `${config.project_id}:${cycleId}`, observedAt, createProtocolSha256V01(cycleId));
}

function stringMetadataV01(value: unknown): string | null { return typeof value === "string" && value.length > 0 ? value : null; }
function numberMetadataV01(value: unknown): number | null { return Number.isSafeInteger(value) ? Number(value) : null; }
function isNativeHostAutomationContextV01(
  value: unknown,
): value is NativeHostAutomationContextV01 {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Partial<NativeHostAutomationContextV01>;
  const grant = candidate.bounded_cycle?.grant;
  return Boolean(
    candidate.automatic_retry_allowed === false &&
      candidate.scheduler_started === false &&
      candidate.policy_ref?.ref_version === "external_ref.v0.1" &&
      candidate.capability_grant_ref?.ref_version === "external_ref.v0.1" &&
      candidate.bounded_cycle?.profile ===
        BOUNDED_AUTOMATION_CYCLE_PROFILE_V01 &&
      candidate.bounded_cycle.grant?.grant_version ===
        BOUNDED_AUTOMATION_CAPABILITY_GRANT_VERSION_V01 &&
      validateBoundedAutomationCapabilityGrantV01(grant) &&
      candidate.bounded_cycle.cycle_id ===
        deriveBoundedAutomationCycleIdV01({
          grant: candidate.bounded_cycle.grant,
          packet: {
            packet_id: candidate.bounded_cycle.grant.packet_id,
            integrity: {
              fingerprint:
                candidate.bounded_cycle.grant.packet_fingerprint,
            },
          },
        }),
  );
}
function refuseV01(code: string, status: number): never { throw new BoundedAutomationCycleErrorV01(code, status); }
