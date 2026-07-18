import { createHash } from "node:crypto";
import { lstat } from "node:fs/promises";

import type Database from "better-sqlite3";

import {
  appendAutonomyRunLedgerEvent,
  buildAutonomyRunEventRecord,
  ensureAutonomyRunnerLedgerSchemaV01,
  insertAutonomyRunLedgerRecord,
  readAutonomyRunLedgerRecord,
  updateAutonomyRunLedgerFields,
  updateAutonomyRunStepLedgerFields,
} from "@/lib/autonomy/runner-ledger";
import {
  buildDefaultRunnerAuthorityBoundary,
  buildDefaultRunnerBudgetSnapshot,
  buildDefaultRunnerSourceRefs,
  isTerminalRunnerStatus,
} from "@/lib/autonomy/runner-state";
import { inspectLocalProjectRootV01 } from "@/lib/vnext/onboarding/local-project-onboarding";
import {
  admitStructuredRunReceiptV01,
} from "@/lib/vnext/persistence/structured-run-receipt-admission";
import {
  listProjectExternalRefsV01,
  readCanonicalProjectWithRootV01,
} from "@/lib/vnext/persistence/project-identity-registry";
import {
  readActiveProjectSelectionV01,
} from "@/lib/vnext/persistence/project-lifecycle-registry";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
  parseStrictIsoTimestampV01,
} from "@/lib/vnext/protocol-primitives";
import { buildRunReceiptV01, validateRunReceiptV01 } from "@/lib/vnext/run-receipt";
import {
  validateExternalRefV01,
  validateTaskContextPacketV01,
} from "@/lib/vnext/task-context-packet";
import {
  DETERMINISTIC_CODEX_ADAPTER_VERSION_V01,
  createDeterministicCodexAdapterV01,
} from "@/lib/vnext/native-host/deterministic-codex-adapter";
import {
  NativeHostContractErrorV01,
  NativeHostReconciliationRequiredErrorV01,
  assertNativeHostResultV01,
} from "@/lib/vnext/native-host/native-host-contract";
import {
  NativeHostResultNormalizationErrorV01,
  normalizeNativeHostResultResidueV01,
} from "@/lib/vnext/native-host/native-host-result-normalization";
import {
  admitVNextLocalOperatorMutationInsideTransactionV01,
  authenticateVNextLocalOperatorSessionV01,
  type VNextLocalOperatorPilotConfigV01,
  type VNextLocalOperatorSecretSourceV01,
  type VNextLocalOperatorSessionCredentialV01,
  type VNextLocalOperatorSessionMutationAdmissionV01,
} from "@/lib/vnext/runtime/local-operator-session";
import type { VNextLocalRuntimeClockV01 } from "@/lib/vnext/runtime/local-runtime-clock";
import { VNEXT_OPERATOR_PILOT_LATER_RESULT_INTAKE_CONTRACT_V01 } from "@/lib/vnext/runtime/operator-pilot-context-use-contract";
import {
  inspectVNextOperatorPilotPacketLineageV01,
  projectVNextOperatorPilotContinuityV01,
} from "@/lib/vnext/runtime/operator-pilot-project-continuity";
import {
  NativeHostApprovalResidueErrorV01,
  readNativeHostApprovalDecisionResidueV01,
  readNativeHostApprovalRequestResidueV01,
} from "@/lib/vnext/runtime/native-host-approval-residue";
import {
  NATIVE_HOST_APPROVAL_VERSION_V01,
  NATIVE_HOST_REQUEST_VERSION_V01,
  NATIVE_HOST_RESULT_RETURN_VERSION_V01,
  NATIVE_HOST_RESULT_VERSION_V01,
  type NativeHostAdapterV01,
  type NativeHostAutomationContextV01,
  type NativeHostInvocationV01,
  type NativeHostLifecycleSinkV01,
  type NativeHostRequestV01,
  type NativeHostResultV01,
  type NativeHostResumeBindingV01,
  type NativeHostRootScopeV01,
  type NativeHostRunModeV01,
  type NativeHostTerminalOutcomeV01,
} from "@/types/vnext/native-host-adapter";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import type {
  AutonomyRunEventRecord,
  AutonomyRunRecord,
  AutonomyRunStepRecord,
  AutonomyRunSummary,
  AutonomyRunnerStatus,
} from "@/types/autonomy-runner-execution";
import type {
  RunReceiptAttestationV01,
  RunReceiptHostApprovalV01,
  RunReceiptObservationV01,
  RunReceiptV01,
} from "@/types/vnext/run-receipt";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";
import type {
  RunAssessmentProposalAdmissionDependenciesV01,
} from "@/lib/vnext/runtime/run-assessment-proposal-admission";

export const DIRECT_NATIVE_HOST_ROUND_TRIP_VERSION_V01 =
  "direct_native_host_round_trip.v0.1" as const;
export const PERSISTED_HOST_PACKET_ADMISSION_VERSION_V01 =
  "persisted_host_packet_admission.v0.1" as const;

const HOST_CAPABILITY = "project_scoped_structured_task_round_trip.v0.1";
const MAX_RESULT_BYTES = 128 * 1024;
const MAX_CHANGED_FILES = 128;
const MAX_ARTIFACTS = 128;
const MAX_COMMANDS = 128;
const MAX_CHECKS = 128;
const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_STOP_SETTLE_TIMEOUT_MS = 5_000;

export class DirectNativeHostRoundTripErrorV01 extends Error {
  readonly run_receipt: RunReceiptV01 | null;

  constructor(
    readonly code: string,
    readonly status = 400,
    runReceipt: RunReceiptV01 | null = null,
  ) {
    super(
      runReceipt
        ? `${code}:${validateRunReceiptV01(runReceipt).errors
            .map((issue) => issue.code)
            .join(",")}`
        : code,
    );
    this.name = "DirectNativeHostRoundTripErrorV01";
    this.run_receipt = runReceipt;
  }
}

export interface PersistedHostPacketAdmissionV01 {
  admission_version: typeof PERSISTED_HOST_PACKET_ADMISSION_VERSION_V01;
  packet: TaskContextPacketV01;
  packet_ref: ExternalRefV01;
  work_ref: ExternalRefV01;
  task_ref: ExternalRefV01;
  source_transition_receipt_ref: ExternalRefV01;
  root_scope: NativeHostRootScopeV01;
}

export interface DirectNativeHostRoundTripResultV01 {
  round_trip_version: typeof DIRECT_NATIVE_HOST_ROUND_TRIP_VERSION_V01;
  status: "inserted" | "exact_replay";
  mode: NativeHostRunModeV01;
  request_id: string;
  run_id: string;
  receipt: RunReceiptV01;
  host_result: NativeHostResultV01 | null;
  session_admission: VNextLocalOperatorSessionMutationAdmissionV01 | null;
  packet_copy_actions: 0;
  handoff_paste_actions: 0;
  result_paste_actions: 0;
  internal_id_entry_actions: 0;
  proposal:
    | {
        status: "available";
        proposal_id: string;
        proposal_fingerprint: string;
        proposal_status: "pending_review";
        admission_status: "inserted" | "exact_replay";
      }
    | {
        status: "failed";
        error_code: string;
        retryable: boolean;
        failure_recorded: boolean;
        failure_recording_error_code: string | null;
      };
  proposal_created: boolean;
  decision_created: false;
  transition_created: false;
  evidence_accepted: false;
  work_closed: false;
  semantic_state_changed: false;
}

export interface DirectNativeHostRoundTripDependenciesV01 {
  adapter?: NativeHostAdapterV01;
  now?: () => string;
  timeout_ms?: number;
  stop_settle_timeout_ms?: number;
  schedule_timeout?: NativeHostTimeoutSchedulerV01;
  cancellation_signal?: AbortSignal;
  lifecycle_sink?: NativeHostLifecycleSinkV01;
  lifecycle_mode?: "synchronous" | "managed_live";
  resume_binding?: NativeHostResumeBindingV01 | null;
  resume_existing_run?: boolean;
  live_host_egress_authorized?: boolean;
  proposal_admission?: RunAssessmentProposalAdmissionDependenciesV01;
  on_invocation_admitted?: (input: {
    request: NativeHostRequestV01;
    session_admission: VNextLocalOperatorSessionMutationAdmissionV01 | null;
  }) => void;
  resolve_packet_selection?: (
    db: Database.Database,
    input: { config: VNextLocalOperatorPilotConfigV01; evaluated_at: string },
  ) => { packet_id: string; packet_fingerprint: string };
}

export type NativeHostTimeoutSchedulerV01 = (input: {
  timeout_ms: number;
  on_timeout: () => void;
}) => () => void;

export async function admitPersistedHostTaskContextPacketV01(
  db: Database.Database,
  input: {
    config: VNextLocalOperatorPilotConfigV01;
    packet_id: string;
    packet_fingerprint: string;
    evaluated_at: string;
    require_active_project?: boolean;
  },
): Promise<PersistedHostPacketAdmissionV01> {
  const lineage = inspectVNextOperatorPilotPacketLineageV01(db, input);
  const packet = lineage.packet;
  const validation = validateTaskContextPacketV01(packet, {
    evaluated_at: input.evaluated_at,
  });
  if (validation.status !== "valid") {
    refuse(
      validation.errors.some((issue) => issue.code === "packet_expired")
        ? "direct_host_packet_expired"
        : "direct_host_packet_invalid",
      validation.errors.some((issue) => issue.code === "packet_expired")
        ? 409
        : 422,
    );
  }
  if (!lineage.projection_current) {
    refuse("direct_host_packet_stale", 409);
  }
  const continuity = projectVNextOperatorPilotContinuityV01(db, {
    config: input.config,
    clock: { now: () => input.evaluated_at },
  });
  if (
    !continuity.latest_compiled_packet ||
    continuity.latest_compiled_packet.packet_id !== packet.packet_id ||
    continuity.latest_compiled_packet.packet_fingerprint !==
      packet.integrity.fingerprint
  ) {
    refuse("direct_host_packet_superseded", 409);
  }
  if (continuity.packet_currentness !== "fresh") {
    refuse(
      continuity.packet_currentness === "expired"
        ? "direct_host_packet_expired"
        : "direct_host_packet_stale",
      409,
    );
  }
  if (
    packet.workspace_id !== input.config.workspace_id ||
    packet.project_id !== input.config.project_id ||
    packet.packet_id !== input.packet_id ||
    packet.integrity.fingerprint !== input.packet_fingerprint
  ) {
    refuse("direct_host_packet_scope_mismatch", 409);
  }
  const registration = readCanonicalProjectWithRootV01(db, input.config);
  if (!registration) refuse("direct_host_project_scope_missing", 409);
  if (input.require_active_project !== false) {
    const active = readActiveProjectSelectionV01(
      db,
      input.config.workspace_id,
    );
    if (active?.project_id !== input.config.project_id) {
      refuse("direct_host_project_not_active", 409);
    }
  }
  const inspection = await inspectLocalProjectRootV01(
    registration.root_binding.local_root.normalized_path,
    {
      db,
      workspace_id: input.config.workspace_id,
      now: () => input.evaluated_at,
    },
  );
  if (
    canonicalizeProtocolValueV01(inspection.local_root) !==
    canonicalizeProtocolValueV01(registration.root_binding.local_root)
  ) {
    refuse("direct_host_root_scope_mismatch", 409);
  }
  const rootFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      workspace_id: input.config.workspace_id,
      project_id: input.config.project_id,
      local_root: registration.root_binding.local_root,
      binding_version: registration.root_binding.binding_version,
      bound_at: registration.root_binding.bound_at,
    }),
  );
  const rootKind = await resolveRootKind(
    registration.root_binding.local_root.normalized_path,
    inspection.folder_kind,
  );
  const repositoryRef =
    listProjectExternalRefsV01(db, input.config)
      .map((binding) => binding.external_ref)
      .find((ref) => ref.ref_type === "repository_remote") ??
    inspection.repository_ref;
  const rootScopeRef = localRef(
    "project_root_scope",
    input.config.project_id,
    input.evaluated_at,
    rootFingerprint,
    PERSISTED_HOST_PACKET_ADMISSION_VERSION_V01,
  );
  const workRef = resolveWorkRef(packet, input.evaluated_at);
  const taskFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01(packet.task),
  );
  return {
    admission_version: PERSISTED_HOST_PACKET_ADMISSION_VERSION_V01,
    packet,
    packet_ref: localRef(
      "task_context_packet",
      packet.packet_id,
      packet.generated_at,
      packet.integrity.fingerprint,
      packet.packet_version,
    ),
    work_ref: workRef,
    task_ref: localRef(
      "task_definition",
      `${packet.packet_id}:task`,
      packet.generated_at,
      taskFingerprint,
      packet.packet_version,
    ),
    source_transition_receipt_ref: localRef(
      "state_transition_receipt",
      lineage.source_transition_receipt.transition_receipt_id,
      packet.generated_at,
      lineage.source_transition_receipt.transition_receipt_fingerprint,
      "augnes.vnext.state-transition-receipt.v0.1",
    ),
    root_scope: {
      canonical_root: registration.root_binding.local_root.normalized_path,
      path_flavor: registration.root_binding.local_root.path_flavor,
      root_kind: rootKind,
      root_fingerprint: rootFingerprint,
      root_scope_ref: rootScopeRef,
      repository_ref: repositoryRef ?? null,
      selected_worktree_ref:
        rootKind === "git_worktree"
          ? localRef(
              "repository_worktree",
              rootFingerprint,
              input.evaluated_at,
              rootFingerprint,
              PERSISTED_HOST_PACKET_ADMISSION_VERSION_V01,
            )
          : null,
    },
  };
}

export async function runDirectNativeHostRoundTripV01(
  db: Database.Database,
  input: {
    config: VNextLocalOperatorPilotConfigV01;
    mode: NativeHostRunModeV01;
    automation_context?: NativeHostAutomationContextV01 | null;
    operator_mutation?: {
      credential: VNextLocalOperatorSessionCredentialV01;
      clock?: VNextLocalRuntimeClockV01;
      secret_source?: VNextLocalOperatorSecretSourceV01;
    };
  },
  dependencies: DirectNativeHostRoundTripDependenciesV01 = {},
): Promise<DirectNativeHostRoundTripResultV01> {
  ensureAutonomyRunnerLedgerSchemaV01(db);
  const now = dependencies.now ?? (() => new Date().toISOString());
  const adapter =
    dependencies.adapter ?? createDeterministicCodexAdapterV01({ now });
  const timeoutMs = dependencies.timeout_ms ?? DEFAULT_TIMEOUT_MS;
  const stopSettleTimeoutMs =
    dependencies.stop_settle_timeout_ms ?? DEFAULT_STOP_SETTLE_TIMEOUT_MS;
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 900_000) {
    refuse("direct_host_timeout_invalid");
  }
  if (
    !Number.isSafeInteger(stopSettleTimeoutMs) ||
    stopSettleTimeoutMs < 1 ||
    stopSettleTimeoutMs > 60_000
  ) {
    refuse("direct_host_stop_settle_timeout_invalid");
  }
  if (
    input.mode === "policy_triggered" &&
    !validAutomationContext(input.automation_context)
  ) {
    refuse("direct_host_automation_context_required");
  }
  if (input.mode === "interactive" && input.automation_context) {
    refuse("direct_host_automation_context_forbidden");
  }
  const managedLive = dependencies.lifecycle_mode === "managed_live";
  if (managedLive) {
    assertLiveHostEgressAdmissionV01({
      mode: input.mode,
      packet: null,
      automation_context: input.automation_context ?? null,
      evaluated_at: null,
      interactive_authorized: dependencies.live_host_egress_authorized === true,
    });
  }
  if (input.operator_mutation) {
    authenticateVNextLocalOperatorSessionV01(db, {
      config: input.config,
      credential: input.operator_mutation.credential,
      clock: input.operator_mutation.clock,
    });
  }
  const prevalidatedAt = strictTimestamp(now());
  const selection = (
    dependencies.resolve_packet_selection ?? resolveLatestPacketSelection
  )(db, { config: input.config, evaluated_at: prevalidatedAt });
  const admitted = await admitPersistedHostTaskContextPacketV01(db, {
    config: input.config,
    ...selection,
    evaluated_at: prevalidatedAt,
  });
  if (managedLive) {
    assertLiveHostEgressAdmissionV01({
      mode: input.mode,
      packet: admitted.packet,
      automation_context: input.automation_context ?? null,
      evaluated_at: prevalidatedAt,
      interactive_authorized: dependencies.live_host_egress_authorized === true,
    });
  }
  const identity = buildRunIdentity({
    config: input.config,
    mode: input.mode,
    admission: admitted,
    adapter,
    automation_context: input.automation_context ?? null,
  });
  if (db.inTransaction) refuse("direct_host_nested_transaction", 409);
  let sessionAdmission: VNextLocalOperatorSessionMutationAdmissionV01 | null =
    null;
  const startedAt = strictTimestamp(now());
  db.exec("BEGIN IMMEDIATE");
  try {
    if (input.operator_mutation) {
      sessionAdmission = admitVNextLocalOperatorMutationInsideTransactionV01(
        db,
        {
          config: input.config,
          credential: input.operator_mutation.credential,
          clock: input.operator_mutation.clock,
          secret_source: input.operator_mutation.secret_source,
        },
      );
    }
    revalidateAdmissionInsideTransaction(db, {
      config: input.config,
      admission: admitted,
      evaluated_at: startedAt,
    });
    const existingReceipt = readReceiptForRun(db, {
      workspace_id: input.config.workspace_id,
      project_id: input.config.project_id,
      run_id: identity.run_id,
    });
    if (existingReceipt) {
      assertReceiptBindsAdmission(existingReceipt, admitted, identity.run_id);
      db.exec("COMMIT");
      return settleRoundTripResultV01(
        db,
        {
          config: input.config,
          status: "exact_replay",
          mode: input.mode,
          request_id: identity.request_id,
          run_id: identity.run_id,
          receipt: existingReceipt,
          host_result: null,
          session_admission: sessionAdmission,
        },
        dependencies.proposal_admission,
      );
    }
    const existingRun = readAutonomyRunLedgerRecord(identity.run_id, { db });
    if (existingRun) {
      if (
        dependencies.resume_existing_run === true &&
        managedLive &&
        existingRun.status === "paused" &&
        existingRun.metadata.packet_id === admitted.packet.packet_id &&
        existingRun.metadata.packet_fingerprint ===
          admitted.packet.integrity.fingerprint &&
        existingRun.metadata.root_fingerprint ===
          admitted.root_scope.root_fingerprint &&
        dependencies.resume_binding
      ) {
        resumeManagedLiveRunInsideTransactionV01(db, {
          run: existingRun,
          observed_at: startedAt,
        });
        db.exec("COMMIT");
      } else {
        refuse("direct_host_run_conflict", 409);
      }
    } else {
      createRunLedgerRecord(db, {
        input,
        admission: admitted,
        request_id: identity.request_id,
        run_id: identity.run_id,
        started_at: startedAt,
        adapter,
        lifecycle_mode: dependencies.lifecycle_mode ?? "synchronous",
      });
      db.exec("COMMIT");
    }
  } catch (error) {
    if (db.inTransaction) db.exec("ROLLBACK");
    throw error;
  }

  const request = buildNativeHostRequest({
    config: input.config,
    mode: input.mode,
    automation_context: input.automation_context ?? null,
    admission: admitted,
    request_id: identity.request_id,
    run_id: identity.run_id,
    idempotency_key: identity.idempotency_key,
    timeout_ms: timeoutMs,
    stop_settle_timeout_ms: stopSettleTimeoutMs,
    live_host: managedLive,
  });
  dependencies.on_invocation_admitted?.({
    request,
    session_admission: sessionAdmission,
  });
  let hostResult: NativeHostResultV01;
  try {
    hostResult = assertNativeHostResultV01(
      request,
      await invokeAdapterBounded(adapter, request, {
        timeout_ms: timeoutMs,
        stop_settle_timeout_ms: stopSettleTimeoutMs,
        schedule_timeout: dependencies.schedule_timeout,
        cancellation_signal: dependencies.cancellation_signal,
        lifecycle_sink: dependencies.lifecycle_sink,
        resume_binding: dependencies.resume_binding,
        now,
      }),
    );
  } catch (error) {
    if (
      error instanceof NativeHostInvocationUnsettledErrorV01 ||
      error instanceof NativeHostReconciliationRequiredErrorV01
    ) {
      markRunStopUnconfirmedV01(db, {
        run_id: identity.run_id,
        admission: admitted,
        observed_at: strictTimestamp(now()),
        reason: error.code,
      });
      throw new DirectNativeHostRoundTripErrorV01(
        error instanceof NativeHostReconciliationRequiredErrorV01
          ? "direct_host_reconciliation_required"
          : "direct_host_stop_unconfirmed",
        503,
      );
    }
    hostResult = assertNativeHostResultV01(
      request,
      buildBoundaryTerminalResult({
        request,
        adapter,
        outcome: "failed",
        reason:
          error instanceof NativeHostContractErrorV01
            ? error.code
            : "native_host_adapter_failed",
        now,
      }),
    );
  }
  let synthesizedSkippedCheckIds = new Set<string>();
  try {
    const normalized = normalizeNativeHostResultResidueV01({
      result: hostResult,
      required_check_ids: requiredCheckIdsForResultV01(
        hostResult,
        admitted.packet.constraints.required_checks,
      ),
    });
    hostResult = normalized.result;
    synthesizedSkippedCheckIds = new Set(
      normalized.synthesized_skipped_check_ids,
    );
  } catch (error) {
    const rejectedResult = hostResult;
    hostResult = assertNativeHostResultV01(
      request,
      buildBoundaryTerminalResult({
        request,
        adapter,
        outcome: "failed",
        reason:
          error instanceof NativeHostResultNormalizationErrorV01
            ? error.code
            : "native_host_result_normalization_failed",
        prior_result: rejectedResult,
        now,
      }),
    );
    const normalized = normalizeNativeHostResultResidueV01({
      result: hostResult,
      required_check_ids: requiredCheckIdsForResultV01(
        hostResult,
        admitted.packet.constraints.required_checks,
      ),
    });
    hostResult = normalized.result;
    synthesizedSkippedCheckIds = new Set(
      normalized.synthesized_skipped_check_ids,
    );
  }
  const terminal = lifecycleForOutcome(hostResult.outcome);
  const terminalStopAbandonsPendingApproval =
    hostResult.outcome === "cancelled" || hostResult.outcome === "timed_out";
  let receipt!: RunReceiptV01;
  db.exec("BEGIN IMMEDIATE");
  try {
    revalidateRunBeforeFinalization(
      db,
      identity.run_id,
      admitted,
      false,
      terminalStopAbandonsPendingApproval,
    );
    const current = readAutonomyRunLedgerRecord(identity.run_id, { db });
    const step = current?.steps[0];
    if (!current || !step || isTerminalRunnerStatus(current.status)) {
      refuse("direct_host_run_conflict", 409);
    }
    receipt = buildDirectHostRunReceipt({
      request,
      result: hostResult,
      admission: admitted,
      run: current,
      synthesized_skipped_check_ids: synthesizedSkippedCheckIds,
    });
    const write = admitStructuredRunReceiptV01(db, receipt);
    if (write.status !== "inserted") {
      refuse("direct_host_run_conflict", 409);
    }
    const pendingApprovalAbandoned =
      terminalStopAbandonsPendingApproval &&
      current.metadata.pending_approval != null;
    updateAutonomyRunStepLedgerFields(
      step.step_id,
      {
        status: terminal.step_status,
        finished_at: hostResult.finished_at,
        output: {
          outcome: hostResult.outcome,
          changed_file_count: hostResult.changed_files.length,
          artifact_count: hostResult.artifacts.length,
          command_count: hostResult.commands.length,
          check_count: hostResult.checks.length,
          model_invocation_receipt_ref_count:
            hostResult.model_invocation_receipt_refs.length,
          raw_output_persisted: false,
        },
        error_message: null,
        updated_at: hostResult.finished_at,
      },
      { db },
    );
    updateAutonomyRunLedgerFields(
      identity.run_id,
      {
        status: terminal.run_status,
        finished_at: hostResult.finished_at,
        updated_at: hostResult.finished_at,
        stop_reason: terminal.stop_reason,
        metadata: {
          ...current.metadata,
          run_receipt_id: receipt.receipt_id,
          run_receipt_fingerprint: receipt.integrity.fingerprint,
          host_outcome: hostResult.outcome,
          public_reason: hostResult.public_stop_reason,
          terminal_receipt_persisted: true,
          reconciliation_required: false,
          pending_approval: null,
          pending_approval_abandoned_by_terminal_stop:
            pendingApprovalAbandoned,
          control_revision:
            typeof current.metadata.control_revision === "number"
              ? current.metadata.control_revision + 1
              : 1,
          semantic_state_changed: false,
        },
      },
      { db },
    );
    appendAutonomyRunLedgerEvent(
      buildAutonomyRunEventRecord({
        run_id: identity.run_id,
        step_id: step.step_id,
        event_type: terminal.step_event_type,
        status: terminal.step_status,
        message: "Project-scoped host adapter reached a bounded terminal state.",
        payload: {
          outcome: hostResult.outcome,
          run_receipt_id: receipt.receipt_id,
          pending_approval_abandoned: pendingApprovalAbandoned,
          raw_output_persisted: false,
        },
        created_at: hostResult.finished_at,
      }),
      { db },
    );
    appendAutonomyRunLedgerEvent(
      buildAutonomyRunEventRecord({
        run_id: identity.run_id,
        event_type: terminal.run_event_type,
        status: terminal.run_status,
        message: "Direct native-host round trip reached a terminal state.",
        payload: {
          stop_reason: terminal.stop_reason,
          semantic_state_changed: false,
          work_closed: false,
        },
        created_at: hostResult.finished_at,
      }),
      { db },
    );
    db.exec("COMMIT");
  } catch (error) {
    if (db.inTransaction) db.exec("ROLLBACK");
    throw error;
  }
  return settleRoundTripResultV01(
    db,
    {
      config: input.config,
      status: "inserted",
      mode: input.mode,
      request_id: identity.request_id,
      run_id: identity.run_id,
      receipt,
      host_result: hostResult,
      session_admission: sessionAdmission,
    },
    dependencies.proposal_admission,
  );
}

function resolveLatestPacketSelection(
  db: Database.Database,
  input: { config: VNextLocalOperatorPilotConfigV01; evaluated_at: string },
): { packet_id: string; packet_fingerprint: string } {
  const continuity = projectVNextOperatorPilotContinuityV01(db, {
    config: input.config,
    clock: { now: () => input.evaluated_at },
  });
  if (!continuity.latest_compiled_packet) {
    refuse("direct_host_packet_missing", 404);
  }
  return {
    packet_id: continuity.latest_compiled_packet.packet_id,
    packet_fingerprint:
      continuity.latest_compiled_packet.packet_fingerprint,
  };
}

function revalidateAdmissionInsideTransaction(
  db: Database.Database,
  input: {
    config: VNextLocalOperatorPilotConfigV01;
    admission: PersistedHostPacketAdmissionV01;
    evaluated_at: string;
  },
): void {
  const registration = readCanonicalProjectWithRootV01(db, input.config);
  const active = readActiveProjectSelectionV01(
    db,
    input.config.workspace_id,
  );
  if (
    !registration ||
    active?.project_id !== input.config.project_id ||
    registration.root_binding.local_root.normalized_path !==
      input.admission.root_scope.canonical_root ||
    registration.root_binding.local_root.path_flavor !==
      input.admission.root_scope.path_flavor
  ) {
    refuse("direct_host_root_scope_mismatch", 409);
  }
  const exact = inspectVNextOperatorPilotPacketLineageV01(db, {
    config: input.config,
    packet_id: input.admission.packet.packet_id,
    packet_fingerprint: input.admission.packet.integrity.fingerprint,
  });
  if (
    !exact.projection_current ||
    validateTaskContextPacketV01(exact.packet, {
      evaluated_at: input.evaluated_at,
    }).status !== "valid" ||
    canonicalizeProtocolValueV01(exact.packet) !==
      canonicalizeProtocolValueV01(input.admission.packet)
  ) {
    refuse("direct_host_packet_stale", 409);
  }
  const continuity = projectVNextOperatorPilotContinuityV01(db, {
    config: input.config,
    clock: { now: () => input.evaluated_at },
  });
  if (
    continuity.packet_currentness !== "fresh" ||
    continuity.latest_compiled_packet?.packet_id !== exact.packet.packet_id ||
    continuity.latest_compiled_packet.packet_fingerprint !==
      exact.packet.integrity.fingerprint
  ) {
    refuse("direct_host_packet_superseded", 409);
  }
}

function revalidateRunBeforeFinalization(
  db: Database.Database,
  runId: string,
  admission: PersistedHostPacketAdmissionV01,
  allowPaused = false,
  allowPendingApproval = false,
): void {
  const run = readAutonomyRunLedgerRecord(runId, { db });
  if (
    !run ||
    ![
      "starting",
      "running",
      "waiting_for_approval",
      "cancelling",
      ...(allowPaused ? ["paused"] : []),
    ].includes(run.status) ||
    (!allowPendingApproval && run.metadata.pending_approval != null) ||
    run.metadata.packet_id !== admission.packet.packet_id ||
    run.metadata.packet_fingerprint !== admission.packet.integrity.fingerprint ||
    run.metadata.root_fingerprint !== admission.root_scope.root_fingerprint
  ) {
    refuse("direct_host_run_conflict", 409);
  }
}

function markRunStopUnconfirmedV01(
  db: Database.Database,
  input: {
    run_id: string;
    admission: PersistedHostPacketAdmissionV01;
    observed_at: string;
    reason: string;
  },
): void {
  db.exec("BEGIN IMMEDIATE");
  try {
    revalidateRunBeforeFinalization(
      db,
      input.run_id,
      input.admission,
      true,
      true,
    );
    const current = readAutonomyRunLedgerRecord(input.run_id, { db });
    const step = current?.steps[0];
    if (!current || !step || step.status !== "running") {
      refuse("direct_host_run_conflict", 409);
    }
    updateAutonomyRunStepLedgerFields(
      step.step_id,
      {
        output: {
          ...step.output,
          stop_requested: true,
          stop_settlement_confirmed: false,
          terminal_receipt_persisted: false,
        },
        error_message: null,
        updated_at: input.observed_at,
      },
      { db },
    );
    updateAutonomyRunLedgerFields(
      input.run_id,
      {
        status: "paused",
        updated_at: input.observed_at,
        stop_reason: "native_host_stop_unconfirmed",
        metadata: {
          ...current.metadata,
          stop_settlement_confirmed: false,
          terminal_receipt_persisted: false,
          reconciliation_required: true,
        },
      },
      { db },
    );
    appendAutonomyRunLedgerEvent(
      buildAutonomyRunEventRecord({
        run_id: input.run_id,
        event_type: "run_paused",
        status: "paused",
        message:
          "Native-host stop settlement was not confirmed; terminal receipt admission is withheld.",
        payload: {
          reason: input.reason,
          terminal_receipt_persisted: false,
          reconciliation_required: true,
        },
        created_at: input.observed_at,
      }),
      { db },
    );
    db.exec("COMMIT");
  } catch (error) {
    if (db.inTransaction) db.exec("ROLLBACK");
    throw error;
  }
}

function buildNativeHostRequest(input: {
  config: VNextLocalOperatorPilotConfigV01;
  mode: NativeHostRunModeV01;
  automation_context: NativeHostAutomationContextV01 | null;
  admission: PersistedHostPacketAdmissionV01;
  request_id: string;
  run_id: string;
  idempotency_key: string;
  timeout_ms: number;
  stop_settle_timeout_ms: number;
  live_host: boolean;
}): NativeHostRequestV01 {
  const packet = input.admission.packet;
  return {
    request_version: NATIVE_HOST_REQUEST_VERSION_V01,
    request_id: input.request_id,
    run_id: input.run_id,
    idempotency_key: input.idempotency_key,
    workspace_id: input.config.workspace_id,
    project_id: input.config.project_id,
    work_ref: input.admission.work_ref,
    task_ref: input.admission.task_ref,
    task_context_packet_ref: input.admission.packet_ref,
    packet,
    packet_lineage: {
      source_transition_receipt_ref:
        input.admission.source_transition_receipt_ref,
      packet_source_refs: packet.compatibility.source_refs,
      selected_context_refs: packet.selected_context.flatMap((entry) =>
        entry.external_ref ? [entry.external_ref] : [],
      ),
    },
    mode: input.mode,
    root_scope: input.admission.root_scope,
    requested_capability: HOST_CAPABILITY,
    allowed_operation_categories: [
      "read_validated_task_context",
      "return_bounded_structured_result",
      ...(input.live_host
        ? [
            "project_scoped_command_with_approval",
            "project_scoped_file_change_with_approval",
          ]
        : []),
    ],
    forbidden_operation_categories: [
      "filesystem_outside_selected_project_root",
      ...(input.live_host ? [] : ["network_egress", "provider_or_model_call"]),
      "external_state_mutation",
      "semantic_commit",
      "raw_output_return",
      ...packet.constraints.forbidden_actions,
    ],
    packet_capability_grant: packet.capability_grant,
    automation_context: input.automation_context,
    policy: {
      filesystem: "selected_project_root_only",
      network: input.live_host ? "exact_grant_only" : "forbidden",
      commands: input.live_host
        ? "approval_required"
        : "forbidden_in_deterministic_adapter",
      model: input.live_host
        ? "native_host_managed"
        : "forbidden_in_deterministic_adapter",
      host_egress: input.live_host
        ? input.mode === "interactive"
          ? "explicit_interactive_start"
          : "bounded_capability_grant"
        : "forbidden",
      max_changed_files: MAX_CHANGED_FILES,
      max_artifacts: MAX_ARTIFACTS,
      max_commands: MAX_COMMANDS,
      max_checks: MAX_CHECKS,
      timeout_ms: input.timeout_ms,
      stop_settle_timeout_ms: input.stop_settle_timeout_ms,
      stop_conditions: [
        "timeout",
        "cancellation_requested",
        "packet_or_project_scope_conflict",
        ...(packet.capability_grant?.stop_conditions ?? []),
      ],
    },
    result_return: {
      return_version: NATIVE_HOST_RESULT_RETURN_VERSION_V01,
      structured_result_required: true,
      legacy_result_text_allowed: false,
      raw_output_allowed: false,
      max_result_bytes: MAX_RESULT_BYTES,
    },
  };
}

function createRunLedgerRecord(
  db: Database.Database,
  input: {
    input: {
      config: VNextLocalOperatorPilotConfigV01;
      mode: NativeHostRunModeV01;
      automation_context?: NativeHostAutomationContextV01 | null;
    };
    admission: PersistedHostPacketAdmissionV01;
    request_id: string;
    run_id: string;
    started_at: string;
    adapter: NativeHostAdapterV01;
    lifecycle_mode: "synchronous" | "managed_live";
  },
): void {
  const packet = input.admission.packet;
  const managedLive = input.lifecycle_mode === "managed_live";
  const run: AutonomyRunSummary = {
    run_id: input.run_id,
    scope: input.input.config.project_id,
    autonomy_contract_ref: DIRECT_NATIVE_HOST_ROUND_TRIP_VERSION_V01,
    title: "Project-scoped native-host round trip",
    status: managedLive ? "starting" : "running",
    scheduled_for: null,
    started_at: input.started_at,
    finished_at: null,
    created_at: input.started_at,
    updated_at: input.started_at,
    stop_reason: null,
    source_refs: buildDefaultRunnerSourceRefs({
      runner_refs: [DIRECT_NATIVE_HOST_ROUND_TRIP_VERSION_V01],
    }),
    authority_boundary: {
      ...buildDefaultRunnerAuthorityBoundary({
        notes: [
          managedLive
            ? "One explicitly started local native host may receive the admitted packet; approvals remain separately bounded."
            : "The deterministic host adapter receives one validated packet and cannot call a provider, GitHub, or external network.",
          "The resulting receipt is operational history, not approval, proof, accepted Evidence, semantic state, or work closure.",
        ],
      }),
      can_execute_codex: managedLive,
    },
    budget_snapshot: buildDefaultRunnerBudgetSnapshot({
      budget_id: `native-host-budget:${input.run_id}`,
      max_iterations: 1,
      max_tool_calls: 0,
      max_codex_tasks: 1,
      notes: [
        managedLive
          ? "One local Codex App Server thread and turn are allowed; no automatic retry or GitHub action is granted."
          : "One deterministic in-process host task is allowed; provider calls and external actions remain zero.",
      ],
    }),
    metadata: {
      invocation_origin: input.input.mode,
      workspace_id: input.input.config.workspace_id,
      project_id: input.input.config.project_id,
      work_ref_type: input.admission.work_ref.ref_type,
      work_ref_id: input.admission.work_ref.external_id,
      task_ref_id: input.admission.task_ref.external_id,
      packet_id: packet.packet_id,
      packet_fingerprint: packet.integrity.fingerprint,
      source_transition_receipt_id:
        input.admission.source_transition_receipt_ref.external_id,
      source_transition_receipt_fingerprint:
        input.admission.source_transition_receipt_ref.source_ref,
      root_kind: input.admission.root_scope.root_kind,
      root_fingerprint: input.admission.root_scope.root_fingerprint,
      request_id: input.request_id,
      adapter_version: input.adapter.adapter_version,
      capability_version: input.adapter.capability_version,
      policy_ref_id:
        input.input.automation_context?.policy_ref.external_id ?? null,
      policy_ref: input.input.automation_context?.policy_ref ?? null,
      capability_grant_ref_id:
        input.input.automation_context?.capability_grant_ref.external_id ?? null,
      capability_grant_ref:
        input.input.automation_context?.capability_grant_ref ?? null,
      automation_control_revision:
        input.input.automation_context?.control_revision ?? null,
      automatic_retry: false,
      semantic_mutation_authorized: false,
      raw_packet_persisted_in_ledger: false,
      absolute_root_persisted_in_ledger: false,
      lifecycle_mode: input.lifecycle_mode,
      control_revision: managedLive ? 1 : 0,
      reconciliation_required: false,
      terminal_receipt_persisted: false,
      approval_requests: [],
      approval_decisions: [],
    },
  };
  const step: AutonomyRunStepRecord = {
    step_id: `${input.run_id}.step.host-adapter`,
    run_id: input.run_id,
    step_index: 1,
    action_kind: "invoke_project_scoped_host_adapter",
    status: "running",
    title: "Invoke project-scoped native-host adapter",
    summary:
      "Deliver one exact admitted packet and receive one bounded structured result.",
    started_at: input.started_at,
    finished_at: null,
    output: {},
    error_message: null,
    created_at: input.started_at,
    updated_at: input.started_at,
  };
  const events: AutonomyRunEventRecord[] = [
    buildAutonomyRunEventRecord({
      run_id: input.run_id,
      event_type: "run_created",
      status: managedLive ? "queued" : "running",
      message: "Direct native-host run record created after packet admission.",
      payload: {
        workspace_id: input.input.config.workspace_id,
        project_id: input.input.config.project_id,
        packet_id: packet.packet_id,
        root_fingerprint: input.admission.root_scope.root_fingerprint,
      },
      created_at: input.started_at,
    }),
    ...(managedLive
      ? [
          buildAutonomyRunEventRecord({
            run_id: input.run_id,
            event_type: "run_queued",
            status: "queued",
            message: "Live native-host run durably queued after packet admission.",
            payload: { control_revision: 0 },
            created_at: input.started_at,
          }),
        ]
      : []),
    buildAutonomyRunEventRecord({
      run_id: input.run_id,
      event_type: managedLive ? "run_starting" : "run_started",
      status: managedLive ? "starting" : "running",
      message: managedLive
        ? "The admitted live run is ready for registered invocation ownership."
        : "Direct native-host round trip started.",
      payload: { mode: input.input.mode, automatic_retry: false },
      created_at: input.started_at,
    }),
    buildAutonomyRunEventRecord({
      run_id: input.run_id,
      step_id: step.step_id,
      event_type: "step_started",
      status: "running",
      message: "Project-scoped host adapter step started.",
      payload: { capability: HOST_CAPABILITY },
      created_at: input.started_at,
    }),
  ];
  insertAutonomyRunLedgerRecord(run, [step], events, { db });
}

function resumeManagedLiveRunInsideTransactionV01(
  db: Database.Database,
  input: { run: AutonomyRunRecord; observed_at: string },
): void {
  const step = input.run.steps[0];
  if (!step || isTerminalRunnerStatus(input.run.status)) {
    refuse("direct_host_run_conflict", 409);
  }
  const controlRevision =
    typeof input.run.metadata.control_revision === "number"
      ? input.run.metadata.control_revision + 1
      : 1;
  updateAutonomyRunStepLedgerFields(
    step.step_id,
    {
      status: "running",
      error_message: null,
      updated_at: input.observed_at,
    },
    { db },
  );
  updateAutonomyRunLedgerFields(
    input.run.run_id,
    {
      status: "starting",
      stop_reason: null,
      updated_at: input.observed_at,
      metadata: {
        ...input.run.metadata,
        control_revision: controlRevision,
        reconciliation_required: false,
        terminal_receipt_persisted: false,
      },
    },
    { db },
  );
  appendAutonomyRunLedgerEvent(
    buildAutonomyRunEventRecord({
      run_id: input.run.run_id,
      event_type: "run_resumed",
      status: "starting",
      message: "Known live native-host run entered bounded reconnect.",
      payload: { control_revision: controlRevision, automatic_retry: false },
      created_at: input.observed_at,
    }),
    { db },
  );
}

function assertLiveHostEgressAdmissionV01(input: {
  mode: NativeHostRunModeV01;
  packet: TaskContextPacketV01 | null;
  automation_context: NativeHostAutomationContextV01 | null;
  evaluated_at: string | null;
  interactive_authorized: boolean;
}): void {
  if (input.mode === "interactive") {
    if (!input.interactive_authorized) {
      refuse("direct_host_live_egress_permission_required", 403);
    }
  } else if (!input.packet) {
    return;
  }
  if (!input.packet) return;
  if (
    input.packet.constraints.data_classification === "secret" ||
    input.packet.constraints.data_classification === "local_only"
  ) {
    refuse("direct_host_live_data_classification_refused", 403);
  }
  if (input.mode === "policy_triggered") {
    const grant = input.packet.capability_grant;
    const automationGrant = input.automation_context?.capability_grant_ref;
    if (
      !grant ||
      !automationGrant ||
      grant.coverage !== "enforced" ||
      (grant.grant_external_ref?.external_id !== automationGrant.external_id &&
        grant.grant_ref !== automationGrant.external_id) ||
      (grant.expires_at !== null &&
        input.evaluated_at !== null &&
        Date.parse(grant.expires_at) <= Date.parse(input.evaluated_at)) ||
      !grant.allowed_capabilities.some((capability) =>
        [HOST_CAPABILITY, "codex_native_host"].includes(capability),
      ) ||
      grant.forbidden_capabilities.some((capability) =>
        [HOST_CAPABILITY, "codex_native_host"].includes(capability),
      ) ||
      !grant.resource_scope.includes(input.packet.project_id)
    ) {
      refuse("direct_host_live_capability_grant_required", 403);
    }
  }
}

function buildDirectHostRunReceipt(input: {
  request: NativeHostRequestV01;
  result: NativeHostResultV01;
  admission: PersistedHostPacketAdmissionV01;
  run: AutonomyRunRecord;
  synthesized_skipped_check_ids: ReadonlySet<string>;
}): RunReceiptV01 {
  const { request, result, admission, run } = input;
  const packetDeliveryInitiated =
    result.adapter_extension.bounded_metadata.packet_delivery_initiated === true;
  const liveAppServerResult =
    result.adapter_extension.adapter_kind === "codex_app_server";
  const residueBasis = liveAppServerResult ? "attested" : "observed";
  const reporterRef = localRef(
    "native_host_orchestrator",
    DIRECT_NATIVE_HOST_ROUND_TRIP_VERSION_V01,
    result.finished_at,
    null,
    DIRECT_NATIVE_HOST_ROUND_TRIP_VERSION_V01,
  );
  const runRef = localRef(
    "automation_run",
    request.run_id,
    result.finished_at,
    null,
    DIRECT_NATIVE_HOST_ROUND_TRIP_VERSION_V01,
  );
  const adapterRef = localRef(
    "native_host_adapter_version",
    result.adapter_version,
    result.finished_at,
    null,
    DIRECT_NATIVE_HOST_ROUND_TRIP_VERSION_V01,
  );
  const capabilityRef = localRef(
    "native_host_capability_version",
    result.capability_version,
    result.finished_at,
    null,
    DIRECT_NATIVE_HOST_ROUND_TRIP_VERSION_V01,
  );
  const hostRef = result.host_refs[0] ?? null;
  const artifactRefs = result.changed_files.map((changed) =>
    repositoryArtifactRef(
      changed.repository_relative_path,
      result.finished_at,
      liveAppServerResult ? "host_attestation" : "direct_local_observation",
    ),
  );
  const hostApprovals = hostApprovalResidueForReceiptV01({
    run,
    request,
    admission,
    reporter_ref: reporterRef,
    recorded_at: result.finished_at,
  });
  const sourceRefs = uniqueRefs([
    reporterRef,
    runRef,
    adapterRef,
    capabilityRef,
    admission.packet_ref,
    admission.work_ref,
    admission.task_ref,
    admission.source_transition_receipt_ref,
    admission.root_scope.root_scope_ref,
    admission.root_scope.repository_ref,
    admission.root_scope.selected_worktree_ref,
    ...request.packet_lineage.packet_source_refs,
    ...request.packet_lineage.selected_context_refs,
    ...result.host_refs,
    ...result.model_invocation_receipt_refs,
    ...hostApprovals.flatMap((approval) => approval.source_refs),
  ]);
  const requiredCheckIds = requiredCheckIdsForResultV01(
    result,
    admission.packet.constraints.required_checks,
  );
  const verification = verificationForResult(
    result,
    requiredCheckIds,
    liveAppServerResult,
    input.synthesized_skipped_check_ids,
    reporterRef,
  );
  const mainObservationId = `observation:host-boundary:${request.request_id}`;
  const packetObservationId = `observation:packet-binding:${request.request_id}`;
  const mainAttestationId = `attestation:host-result:${request.request_id}`;
  const observations: RunReceiptObservationV01[] = [
    {
      observation_id: mainObservationId,
      observation_kind: "structured_host_result_received",
      summary:
        "The local orchestration boundary received one bounded versioned structured host result.",
      event_at: result.finished_at,
      observed_at: result.finished_at,
      observer_ref: reporterRef,
      trust_class: "direct_local_observation",
      source_refs: [runRef, admission.packet_ref, adapterRef],
      related_command_ids: liveAppServerResult
        ? []
        : result.commands.map((command) => command.command_id),
      related_check_ids: liveAppServerResult
        ? []
        : [
            ...result.checks.map((check) => check.check_id),
            ...result.skipped_checks
              .filter((check) =>
                input.synthesized_skipped_check_ids.has(check.check_id),
              )
              .map((check) => check.check_id),
          ],
      related_artifact_refs: liveAppServerResult ? [] : artifactRefs,
    },
    {
      observation_id: packetObservationId,
      observation_kind: "validated_packet_and_root_binding",
      summary:
        "Packet identity, fingerprint, current lineage, active project, and canonical root scope were validated before adapter start.",
      event_at: result.started_at,
      observed_at: result.started_at,
      observer_ref: reporterRef,
      trust_class: "direct_local_observation",
      source_refs: uniqueRefs([
        admission.packet_ref,
        admission.source_transition_receipt_ref,
        admission.root_scope.root_scope_ref,
        ...request.packet_lineage.packet_source_refs,
        ...request.packet_lineage.selected_context_refs,
      ]),
      related_command_ids: [],
      related_check_ids: result.checks
        .filter((check) =>
          ["deterministic_packet_delivery", "validated_packet_delivery"].includes(
            check.check_id,
          ),
        )
        .map((check) => check.check_id),
      related_artifact_refs: [],
    },
    ...(!liveAppServerResult
      ? result.artifacts.map(
          (artifact): RunReceiptObservationV01 => ({
            observation_id: stableResidueIdV01(
              "observation:artifact",
              artifact,
            ),
            observation_kind: "native_host_artifact_reported",
            summary: artifact.summary,
            event_at: result.finished_at,
            observed_at: result.finished_at,
            observer_ref: reporterRef,
            trust_class: "direct_local_observation",
            source_refs: [runRef, artifact.artifact_ref],
            related_command_ids: [],
            related_check_ids: [],
            related_artifact_refs: [artifact.artifact_ref],
          }),
        )
      : []),
    ...(!liveAppServerResult
      ? result.observed_actions.map(
          (action): RunReceiptObservationV01 => ({
            observation_id: stableResidueIdV01("observation:action", action),
            observation_kind: "native_host_action",
            summary: action,
            event_at: result.finished_at,
            observed_at: result.finished_at,
            observer_ref: reporterRef,
            trust_class: "direct_local_observation",
            source_refs: [runRef, adapterRef],
            related_command_ids: [],
            related_check_ids: [],
            related_artifact_refs: [],
          }),
        )
      : []),
  ];
  const attestations: RunReceiptAttestationV01[] = [
    ...(liveAppServerResult && hostRef
      ? [
          {
            attestation_id: mainAttestationId,
            attestation_kind: "bounded_native_host_result",
            summary: result.summary,
            reported_at: result.finished_at,
            reporter_ref: hostRef,
            trust_class: "host_attestation" as const,
            source_refs: result.host_refs,
            subject_refs: uniqueRefs([
              admission.packet_ref,
              runRef,
              ...artifactRefs,
              ...result.artifacts.map((artifact) => artifact.artifact_ref),
            ]),
          },
          ...result.artifacts.map(
            (artifact): RunReceiptAttestationV01 => ({
              attestation_id: stableResidueIdV01(
                "attestation:artifact",
                artifact,
              ),
              attestation_kind: "native_host_artifact_report",
              summary: artifact.summary,
              reported_at: result.finished_at,
              reporter_ref: hostRef,
              trust_class: "host_attestation",
              source_refs: uniqueRefs([hostRef, artifact.artifact_ref]),
              subject_refs: [artifact.artifact_ref],
            }),
          ),
          ...result.observed_actions.map(
            (action): RunReceiptAttestationV01 => ({
              attestation_id: stableResidueIdV01(
                "attestation:action",
                action,
              ),
              attestation_kind: "native_host_action_report",
              summary: action,
              reported_at: result.finished_at,
              reporter_ref: hostRef,
              trust_class: "host_attestation",
              source_refs: [hostRef],
              subject_refs: [runRef],
            }),
          ),
        ]
      : []),
    ...result.proposed_next_steps.map(
      (nextStep): RunReceiptAttestationV01 => ({
        attestation_id: stableResidueIdV01(
          "attestation:proposed-next-step",
          nextStep,
        ),
        attestation_kind: "proposed_next_step",
        summary: nextStep,
        reported_at: result.finished_at,
        reporter_ref: liveAppServerResult && hostRef ? hostRef : reporterRef,
        trust_class: "derived_interpretation",
        source_refs: liveAppServerResult && hostRef ? [hostRef] : [reporterRef],
        subject_refs: [runRef],
      }),
    ),
  ];
  const receipt = buildRunReceiptV01({
    workspace_id: request.workspace_id,
    project_id: request.project_id,
    run_id: request.run_id,
    work_ref: admission.work_ref,
    task_context_packet_ref: admission.packet_ref,
    recorded_at: result.finished_at,
    started_at: result.started_at,
    finished_at: result.finished_at,
    execution: {
      status: receiptExecutionStatus(result.outcome),
      basis: liveAppServerResult && hostRef ? "mixed" : "observed",
      source_refs:
        liveAppServerResult && hostRef ? [reporterRef, hostRef] : [reporterRef],
    },
    verification,
    reporter_ref: reporterRef,
    observer_refs: [reporterRef],
    verifier_refs:
      !liveAppServerResult ||
      input.synthesized_skipped_check_ids.size > 0 ||
      result.checks.some(
        (check) => check.check_id === "validated_packet_delivery",
      )
        ? [reporterRef]
        : [],
    host_ref: hostRef,
    worker_ref: null,
    model_invocations: [],
    execution_environment: {
      environment_kind: "local",
      host_ref: hostRef,
      worker_ref: null,
      operating_system: null,
      runtime_labels: [
        "native_host_adapter",
        request.mode,
        admission.root_scope.root_kind,
      ],
      source_refs: [reporterRef, admission.root_scope.root_scope_ref],
    },
    observations,
    attestations,
    changed_artifacts: result.changed_files.map((changed, index) => ({
      artifact_ref: artifactRefs[index]!,
      change_kind: changed.change_kind,
      before_hash: changed.before_hash,
      after_hash: changed.after_hash,
      basis: residueBasis,
      related_observation_ids: liveAppServerResult ? [] : [mainObservationId],
      related_attestation_ids:
        liveAppServerResult && hostRef ? [mainAttestationId] : [],
      source_refs:
        liveAppServerResult && hostRef ? [hostRef] : [reporterRef],
    })),
    commands: result.commands.map((command) => ({
      ...command,
      basis: residueBasis,
      source_refs:
        liveAppServerResult && hostRef ? [hostRef] : [reporterRef],
      raw_output_included: false as const,
    })),
    checks: result.checks.map((check) => ({
      ...check,
      basis:
        !liveAppServerResult || check.check_id === "validated_packet_delivery"
          ? ("observed" as const)
          : residueBasis,
      source_refs:
        liveAppServerResult &&
        hostRef &&
        check.check_id !== "validated_packet_delivery"
          ? [hostRef]
          : [reporterRef],
    })),
    skipped_checks: result.skipped_checks.map((check) => ({
      ...check,
      basis: input.synthesized_skipped_check_ids.has(check.check_id)
        ? ("observed" as const)
        : residueBasis,
      source_refs:
        input.synthesized_skipped_check_ids.has(check.check_id) ||
        !liveAppServerResult ||
        !hostRef
          ? [reporterRef]
          : [hostRef],
    })),
    host_approvals: hostApprovals,
    external_refs: uniqueRefs([
      ...result.host_refs,
      ...result.artifacts.map((artifact) => artifact.artifact_ref),
      ...result.model_invocation_receipt_refs,
      admission.source_transition_receipt_ref,
      admission.root_scope.repository_ref,
      admission.root_scope.selected_worktree_ref,
      adapterRef,
      capabilityRef,
      ...hostApprovals.flatMap((approval) => [
        approval.approval_ref,
        approval.host_thread_ref,
        approval.host_turn_ref,
        approval.host_item_ref,
        approval.host_request_ref,
        ...approval.resource_refs,
      ]),
    ]),
    result_summary: {
      summary: result.summary,
      outcome: result.outcome,
      limitations: [
        ...result.uncertainty,
        ...result.gaps,
        "This operational receipt is not task acceptance, semantic approval, Evidence acceptance, or work closure.",
      ],
    },
    blockers: [
      ...(result.outcome === "completed"
        ? []
        : [
            {
              code: result.public_stop_reason ?? `native_host_${result.outcome}`,
              summary:
                "The native-host adapter returned a non-success terminal outcome.",
              source_refs: result.host_refs,
            },
          ]),
      ...result.checks
        .filter((check) => check.required && check.status === "failed")
        .map((check) => ({
          code: `required_check_failed:${check.check_id}`,
          summary: check.summary,
          source_refs:
            liveAppServerResult && hostRef ? [hostRef] : [reporterRef],
        })),
    ],
    warnings: result.uncertainty.map((summary, index) => ({
      code: `native_host_uncertainty_${index + 1}`,
      summary,
      source_refs: result.host_refs,
    })),
    gaps: [
      ...result.gaps.map((summary, index) => ({
        code: `native_host_gap_${index + 1}`,
        summary,
        source_refs: result.host_refs,
      })),
      ...(result.model_invocation_receipt_refs.length
        ? [
            {
              code: "native_host_model_invocation_receipt_unresolved",
              summary:
                "The native host referenced model-invocation residue that is not resolved as an Augnes-owned R4 receipt.",
              source_refs: result.model_invocation_receipt_refs,
            },
          ]
        : []),
    ],
    privacy_egress: {
      data_classification: admission.packet.constraints.data_classification,
      egress_status: packetDeliveryInitiated ? "occurred" : "did_not_occur",
      basis: "observed",
      destination_refs:
        packetDeliveryInitiated && hostRef ? [hostRef] : [],
      redaction_status: packetDeliveryInitiated ? "unknown" : "not_needed",
      retention_class: packetDeliveryInitiated
        ? "native_host_managed_or_unknown"
        : "bounded_structured_receipt_only",
      raw_prompt_persisted: false,
      raw_output_persisted: false,
      raw_transcript_persisted: false,
      secret_material_persisted: false,
      source_refs: [reporterRef],
      notes: [
        packetDeliveryInitiated
          ? "Packet delivery to the configured native host was directly observed; native-host retention is host-managed or unknown."
          : "The packet was delivered in process and was not copied into the ledger or receipt.",
        "No prompt, transcript, hidden reasoning, environment dump, provider payload, stdout, stderr, credential, or absolute root path is persisted.",
        ...(packetDeliveryInitiated
          ? [
              "Native-host-internal model activity is outside Augnes-owned R4 Model Gateway invocation coverage.",
            ]
          : []),
      ],
    },
    cost_usage: {
      cost_basis: "unknown",
      cost_amount: null,
      currency: null,
      usage: {
        basis: "unknown",
        input_units: null,
        output_units: null,
        total_units: null,
        unit: null,
      },
      source_refs: [],
    },
    capability_coverage: result.capability_coverage.map((coverage) => ({
      capability: coverage.capability,
      coverage_level:
        coverage.coverage === "host_attested"
          ? "advisory"
          : coverage.coverage === "unsupported"
            ? "outside_coverage"
            : coverage.coverage,
      source_ref: coverage.source_ref,
      notes: [
        ...coverage.notes,
        `Native-host coverage class: ${coverage.coverage}.`,
      ],
    })),
    source_refs: sourceRefs,
    artifact_refs: uniqueRefs([
      ...artifactRefs,
      ...result.artifacts.map((artifact) => artifact.artifact_ref),
    ]),
    compatibility: {
      source_contracts: [
        DIRECT_NATIVE_HOST_ROUND_TRIP_VERSION_V01,
        NATIVE_HOST_REQUEST_VERSION_V01,
        NATIVE_HOST_RESULT_VERSION_V01,
        result.adapter_version,
        result.capability_version,
        ...(admission.source_transition_receipt_ref
          ? [VNEXT_OPERATOR_PILOT_LATER_RESULT_INTAKE_CONTRACT_V01]
          : []),
        ...(hostApprovals.length ? ["native_host_approval.v0.1"] : []),
      ],
      unmapped_fields: result.model_invocation_receipt_refs.length
        ? [
            {
              source_field: "model_invocation_receipt_refs",
              reason:
                "Refs are retained without fabricating unresolved ModelInvocationReceipt payloads.",
            },
          ]
        : [],
      warnings: [],
      external_refs: [admission.task_ref, admission.root_scope.root_scope_ref],
    },
    authority_notes: [
      "This receipt records one bounded host result and grants no execution, external side effect, semantic commit, approval, merge, publication, or work-closing authority.",
      "Host completion does not establish correctness, acceptance, or durable semantic truth.",
    ],
  });
  const validation = validateRunReceiptV01(receipt);
  if (validation.status !== "valid") {
    const issue = validation.errors[0]?.code
      ?.replace(/[^a-z0-9_]/giu, "_")
      .toLowerCase();
    refuse(
      issue
        ? `direct_host_receipt_invalid_${issue}`
        : "direct_host_receipt_invalid",
      500,
      receipt,
    );
  }
  return receipt;
}

async function invokeAdapterBounded(
  adapter: NativeHostAdapterV01,
  request: NativeHostRequestV01,
  input: {
    timeout_ms: number;
    stop_settle_timeout_ms: number;
    schedule_timeout?: NativeHostTimeoutSchedulerV01;
    cancellation_signal?: AbortSignal;
    lifecycle_sink?: NativeHostLifecycleSinkV01;
    resume_binding?: NativeHostResumeBindingV01 | null;
    now: () => string;
  },
): Promise<NativeHostResultV01> {
  const controller = new AbortController();
  let cancelTimeout: (() => void) | null = null;
  let cancelListener: (() => void) | null = null;
  let invocation: NativeHostInvocationV01;
  try {
    invocation = adapter.invoke(request, {
      cancellation_signal: controller.signal,
      timeout_ms: input.timeout_ms,
      stop_settle_timeout_ms: input.stop_settle_timeout_ms,
      lifecycle_sink: input.lifecycle_sink,
      resume_binding: input.resume_binding,
    });
  } catch {
    return buildBoundaryTerminalResult({
      request,
      adapter,
      outcome: "failed",
      reason: "native_host_adapter_failed",
      now: input.now,
    });
  }
  const observedResultOutcome: {
    value:
      | { status: "fulfilled"; result: NativeHostResultV01 }
      | { status: "rejected"; error: unknown }
      | null;
  } = { value: null };
  const resultOutcome = Promise.resolve(invocation.result).then(
    (result) => {
      observedResultOutcome.value = { status: "fulfilled", result };
      return observedResultOutcome.value;
    },
    (error: unknown) => {
      observedResultOutcome.value = { status: "rejected", error };
      return observedResultOutcome.value;
    },
  );
  const settledOutcome = Promise.resolve(invocation.settled).then(
    () => true,
    () => false,
  );
  const completion = Promise.all([resultOutcome, settledOutcome]).then(
    ([result, settled]) => ({
      kind: "completion" as const,
      result,
      settled,
    }),
  );
  let controlRequested = false;
  let stopOutcome: Promise<boolean> | null = null;
  let resolveControl!: (value: {
    kind: "control";
    outcome: "cancelled" | "timed_out";
    reason: string;
  }) => void;
  const control = new Promise<{
    kind: "control";
    outcome: "cancelled" | "timed_out";
    reason: string;
  }>((resolve) => {
    resolveControl = resolve;
  });
  const requestControl = (
    outcome: "cancelled" | "timed_out",
    reason: string,
  ) => {
    if (controlRequested) return;
    controlRequested = true;
    controller.abort(reason);
    try {
      stopOutcome = Promise.resolve(
        invocation.request_stop({
          reason: outcome === "timed_out" ? "timeout" : "cancellation_requested",
        }),
      ).then(
        () => true,
        () => false,
      );
    } catch {
      stopOutcome = Promise.resolve(false);
    }
    resolveControl({ kind: "control", outcome, reason });
  };
  try {
    cancelTimeout = (
      input.schedule_timeout ?? scheduleNativeHostTimeoutV01
    )({
      timeout_ms: input.timeout_ms,
      on_timeout: () =>
        requestControl("timed_out", "native_host_timeout"),
    });
    if (input.cancellation_signal) {
      cancelListener = () =>
        requestControl("cancelled", "native_host_cancelled");
      if (input.cancellation_signal.aborted) cancelListener();
      else
        input.cancellation_signal.addEventListener("abort", cancelListener, {
          once: true,
        });
    }
    const first = await Promise.race([completion, control]);
    if (first.kind === "completion") {
      if (!first.settled) {
        requestControl("cancelled", "native_host_settlement_unconfirmed");
        await confirmInvocationStopSettledV01({
          stop_outcome: stopOutcome ?? Promise.resolve(false),
          settled_outcome: settledOutcome,
          timeout_ms: input.stop_settle_timeout_ms,
        });
        throw new NativeHostInvocationUnsettledErrorV01(
          "native_host_settlement_unconfirmed",
        );
      }
      return first.result.status === "fulfilled"
        ? first.result.result
        : first.result.error instanceof NativeHostReconciliationRequiredErrorV01
          ? Promise.reject(first.result.error)
          : buildBoundaryTerminalResult({
              request,
              adapter,
              outcome: "failed",
              reason: "native_host_adapter_failed",
              now: input.now,
            });
    }
    const stopConfirmed = await confirmInvocationStopSettledV01({
      stop_outcome: stopOutcome ?? Promise.resolve(false),
      settled_outcome: settledOutcome,
      timeout_ms: input.stop_settle_timeout_ms,
    });
    if (!stopConfirmed) {
      throw new NativeHostInvocationUnsettledErrorV01(
        "native_host_stop_settlement_unconfirmed",
      );
    }
    await Promise.resolve();
    const stoppedResult = observedResultOutcome.value;
    if (
      stoppedResult?.status === "fulfilled" &&
      stoppedResult.result.outcome === "completed"
    ) {
      return stoppedResult.result;
    }
    if (
      stoppedResult?.status === "rejected" &&
      stoppedResult.error instanceof NativeHostReconciliationRequiredErrorV01
    ) {
      throw stoppedResult.error;
    }
    return buildBoundaryTerminalResult({
      request,
      adapter,
      outcome: first.outcome,
      reason: first.reason,
      now: input.now,
    });
  } finally {
    cancelTimeout?.();
    if (input.cancellation_signal && cancelListener) {
      input.cancellation_signal.removeEventListener("abort", cancelListener);
    }
  }
}

const scheduleNativeHostTimeoutV01: NativeHostTimeoutSchedulerV01 = ({
  timeout_ms,
  on_timeout,
}) => {
  const timeout = setTimeout(on_timeout, timeout_ms);
  return () => clearTimeout(timeout);
};

class NativeHostInvocationUnsettledErrorV01 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "NativeHostInvocationUnsettledErrorV01";
  }
}

async function confirmInvocationStopSettledV01(input: {
  stop_outcome: Promise<boolean>;
  settled_outcome: Promise<boolean>;
  timeout_ms: number;
}): Promise<boolean> {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  const confirmation = Promise.all([
    input.stop_outcome,
    input.settled_outcome,
  ]).then(([stopCompleted, settled]) => stopCompleted && settled);
  const expired = new Promise<false>((resolve) => {
    timeout = setTimeout(() => resolve(false), input.timeout_ms);
  });
  try {
    return await Promise.race([confirmation, expired]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function buildBoundaryTerminalResult(input: {
  request: NativeHostRequestV01;
  adapter: NativeHostAdapterV01;
  outcome: Exclude<NativeHostTerminalOutcomeV01, "completed" | "blocked" | "unavailable">;
  reason: string;
  prior_result?: NativeHostResultV01;
  now: () => string;
}): NativeHostResultV01 {
  const observedAt = boundedFinishedAt(
    input.request,
    input.request.packet.generated_at,
    input.now,
  );
  const hostRef = localRef(
    "native_host_adapter",
    input.adapter.adapter_version,
    observedAt,
    null,
    DIRECT_NATIVE_HOST_ROUND_TRIP_VERSION_V01,
  );
  return {
    result_version: NATIVE_HOST_RESULT_VERSION_V01,
    request_id: input.request.request_id,
    run_id: input.request.run_id,
    outcome: input.outcome,
    public_stop_reason: input.reason,
    started_at: observedAt,
    finished_at: observedAt,
    host_refs: uniqueRefs([...(input.prior_result?.host_refs ?? []), hostRef]),
    adapter_version: input.adapter.adapter_version,
    capability_version: input.adapter.capability_version,
    changed_files: [],
    artifacts: [],
    observed_actions: ["host_boundary_terminal_control_applied"],
    commands: [],
    checks: [],
    skipped_checks: input.request.packet.constraints.required_checks.map(
      (checkId) => ({
        check_id: checkId,
        required: true,
        reason: `Check was not run because ${input.reason}.`,
      }),
    ),
    model_invocation_receipt_refs: [],
    summary: "The native-host boundary returned a bounded failure result.",
    uncertainty: [],
    gaps: ["The requested deterministic host round trip did not complete."],
    proposed_next_steps: ["Review the public stop reason before retrying."],
    capability_coverage: [
      {
        capability: HOST_CAPABILITY,
        coverage: "observed",
        source_ref: hostRef,
        notes: ["The orchestration boundary observed the terminal control outcome."],
      },
      ...(input.prior_result?.adapter_extension.bounded_metadata
        .packet_delivery_initiated === true
        ? [
            {
              capability: "native_host_internal_model_activity",
              coverage: "unsupported" as const,
              source_ref: input.prior_result.host_refs[0] ?? hostRef,
              notes: [
                "Native-host-internal model activity remains outside Augnes-owned R4 Model Gateway coverage.",
              ],
            },
          ]
        : []),
    ],
    adapter_extension: {
      extension_version: "native_host_boundary_extension.v0.1",
      adapter_kind: input.adapter.adapter_version,
      bounded_metadata: {
        live_host_invoked:
          input.prior_result?.adapter_extension.bounded_metadata
            .live_host_invoked === true,
        packet_delivery_initiated:
          input.prior_result?.adapter_extension.bounded_metadata
            .packet_delivery_initiated === true,
        raw_provider_payload_included: false,
      },
    },
  };
}

function buildRunIdentity(input: {
  config: VNextLocalOperatorPilotConfigV01;
  mode: NativeHostRunModeV01;
  admission: PersistedHostPacketAdmissionV01;
  adapter: NativeHostAdapterV01;
  automation_context: NativeHostAutomationContextV01 | null;
}) {
  const material = canonicalizeProtocolValueV01({
    contract: DIRECT_NATIVE_HOST_ROUND_TRIP_VERSION_V01,
    workspace_id: input.config.workspace_id,
    project_id: input.config.project_id,
    mode: input.mode,
    packet_id: input.admission.packet.packet_id,
    packet_fingerprint: input.admission.packet.integrity.fingerprint,
    work_ref: input.admission.work_ref,
    task_ref: input.admission.task_ref,
    source_transition_receipt_ref:
      input.admission.source_transition_receipt_ref,
    root_fingerprint: input.admission.root_scope.root_fingerprint,
    root_kind: input.admission.root_scope.root_kind,
    adapter_version: input.adapter.adapter_version,
    capability_version: input.adapter.capability_version,
    automation_context: input.automation_context,
  });
  const digest = createHash("sha256").update(material).digest("hex");
  return {
    run_id: `host-run:${digest.slice(0, 24)}`,
    request_id: `host-request:${digest.slice(0, 24)}`,
    idempotency_key: `sha256:${digest}`,
  };
}

function readReceiptForRun(
  db: Database.Database,
  input: { workspace_id: string; project_id: string; run_id: string },
): RunReceiptV01 | null {
  const rows = db
    .prepare(
      `SELECT payload_json FROM vnext_core_records
       WHERE workspace_id = ? AND project_id = ?
         AND record_kind = 'run_receipt'
         AND json_extract(payload_json, '$.run_id') = ?
       ORDER BY created_at, record_id LIMIT 2`,
    )
    .all(input.workspace_id, input.project_id, input.run_id) as Array<{
    payload_json: string;
  }>;
  if (rows.length > 1) refuse("direct_host_run_conflict", 409);
  if (!rows[0]) return null;
  let receipt: unknown;
  try {
    receipt = JSON.parse(rows[0].payload_json);
  } catch {
    refuse("direct_host_run_conflict", 409);
  }
  if (validateRunReceiptV01(receipt).status !== "valid") {
    refuse("direct_host_run_conflict", 409);
  }
  return receipt as RunReceiptV01;
}

function assertReceiptBindsAdmission(
  receipt: RunReceiptV01,
  admission: PersistedHostPacketAdmissionV01,
  runId: string,
): void {
  if (
    receipt.run_id !== runId ||
    receipt.workspace_id !== admission.packet.workspace_id ||
    receipt.project_id !== admission.packet.project_id ||
    canonicalizeProtocolValueV01(receipt.work_ref) !==
      canonicalizeProtocolValueV01(admission.work_ref) ||
    receipt.task_context_packet_ref?.external_id !== admission.packet.packet_id ||
    receipt.task_context_packet_ref.source_ref !==
      admission.packet.integrity.fingerprint ||
    !receipt.source_refs.some(
      (ref) =>
        ref.ref_type === "state_transition_receipt" &&
        ref.external_id === admission.source_transition_receipt_ref.external_id &&
        ref.source_ref === admission.source_transition_receipt_ref.source_ref,
    ) ||
    !receipt.source_refs.some(
      (ref) =>
        ref.ref_type === "project_root_scope" &&
        ref.source_ref === admission.root_scope.root_fingerprint,
    )
  ) {
    refuse("direct_host_run_conflict", 409);
  }
}

function hostApprovalResidueForReceiptV01(input: {
  run: AutonomyRunRecord;
  request: NativeHostRequestV01;
  admission: PersistedHostPacketAdmissionV01;
  reporter_ref: ExternalRefV01;
  recorded_at: string;
}): RunReceiptHostApprovalV01[] {
  let requests;
  let decisions;
  try {
    requests = readNativeHostApprovalRequestResidueV01(
      input.run.metadata.approval_requests,
    );
    decisions = readNativeHostApprovalDecisionResidueV01(
      input.run.metadata.approval_decisions,
    );
  } catch (error) {
    refuse(
      error instanceof NativeHostApprovalResidueErrorV01
        ? `direct_host_receipt_${error.code}`
        : "direct_host_receipt_approval_residue_invalid",
      409,
    );
  }
  const decisionsByApproval = new Map<
    string,
    (typeof decisions)[number]
  >();
  for (const decision of decisions) {
    const prior = decisionsByApproval.get(decision.approval_id);
    if (
      prior &&
      canonicalizeProtocolValueV01(prior) !==
        canonicalizeProtocolValueV01(decision)
    ) {
      refuse("direct_host_receipt_approval_decision_conflict", 409);
    }
    decisionsByApproval.set(decision.approval_id, decision);
  }
  const runThreadRef = protocolExternalRefMetadataV01(
    input.run.metadata.host_thread_ref,
  );
  const runTurnRef = protocolExternalRefMetadataV01(
    input.run.metadata.host_turn_ref,
  );
  if (requests.length > 0 && (!runThreadRef || !runTurnRef)) {
    refuse("direct_host_receipt_approval_host_binding_missing", 409);
  }
  const recordedAt = parseStrictIsoTimestampV01(input.recorded_at);
  return requests.map((request) => {
    const issuedAt = parseStrictIsoTimestampV01(request.issued_at);
    if (
      request.workspace_id !== input.request.workspace_id ||
      request.project_id !== input.request.project_id ||
      request.run_id !== input.request.run_id ||
      request.packet_id !== input.admission.packet.packet_id ||
      request.packet_fingerprint !==
        input.admission.packet.integrity.fingerprint ||
      (runThreadRef &&
        canonicalizeProtocolValueV01(runThreadRef) !==
          canonicalizeProtocolValueV01(request.host_thread_ref)) ||
      (runTurnRef &&
        canonicalizeProtocolValueV01(runTurnRef) !==
          canonicalizeProtocolValueV01(request.host_turn_ref)) ||
      issuedAt === null ||
      recordedAt === null ||
      issuedAt > recordedAt
    ) {
      refuse("direct_host_receipt_approval_binding_conflict", 409);
    }
    const decision = decisionsByApproval.get(request.approval_id) ?? null;
    if (
      decision &&
      (decision.idempotency_fingerprint !== request.idempotency_fingerprint ||
        parseStrictIsoTimestampV01(decision.decided_at) === null ||
        parseStrictIsoTimestampV01(decision.decided_at)! > recordedAt)
    ) {
      refuse("direct_host_receipt_approval_fingerprint_conflict", 409);
    }
    const approvalRef = localRef(
      "native_host_approval",
      request.approval_id,
      request.issued_at,
      request.idempotency_fingerprint,
      NATIVE_HOST_APPROVAL_VERSION_V01,
    );
    const resourceRefs = uniqueRefs([
      ...request.repository_relative_paths.map((relativePath) =>
        repositoryArtifactRef(
          relativePath,
          request.issued_at,
          "direct_local_observation",
        ),
      ),
      ...request.network_resources.map((resource) =>
        localRef(
          "native_host_network_resource",
          resource,
          request.issued_at,
          createProtocolSha256V01(resource),
          NATIVE_HOST_APPROVAL_VERSION_V01,
        ),
      ),
      ...(request.repository_relative_paths.length === 0 &&
      request.network_resources.length === 0
        ? [input.admission.root_scope.root_scope_ref]
        : []),
    ]);
    const decisionFingerprint = decision
      ? createProtocolSha256V01(
          canonicalizeProtocolValueV01({
            approval_id: decision.approval_id,
            idempotency_fingerprint: decision.idempotency_fingerprint,
            decision: decision.decision,
            decision_source: decision.decision_source,
            decided_at: decision.decided_at,
            control_revision: decision.control_revision,
          }),
        )
      : null;
    return {
      approval_ref: approvalRef,
      host_thread_ref: request.host_thread_ref,
      host_turn_ref: request.host_turn_ref,
      host_item_ref: request.host_item_ref,
      host_request_ref: request.host_request_ref,
      operation_class: request.operation_class,
      resource_summary: request.resource_summary,
      resource_refs: resourceRefs,
      command_fingerprint: request.command_fingerprint,
      request_fingerprint: request.idempotency_fingerprint,
      decision: decision?.decision ?? null,
      decision_source: decision?.decision_source ?? null,
      decision_fingerprint: decisionFingerprint,
      issued_at: request.issued_at,
      decided_at: decision?.decided_at ?? null,
      expires_at: request.expires_at,
      coverage:
        decision?.decision_source === "bounded_capability_grant" ||
        decision?.decision_source === "run_cancellation"
          ? "enforced"
          : "observed",
      source_refs: uniqueRefs([
        input.reporter_ref,
        input.admission.packet_ref,
        input.admission.root_scope.root_scope_ref,
        approvalRef,
        request.host_thread_ref,
        request.host_turn_ref,
        request.host_item_ref,
        request.host_request_ref,
        ...resourceRefs,
      ]),
      semantic_approval_created: false,
    };
  });
}

function protocolExternalRefMetadataV01(value: unknown): ExternalRefV01 | null {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    validateExternalRefV01(value).status !== "valid"
  ) {
    return null;
  }
  return value as ExternalRefV01;
}

function requiredCheckIdsForResultV01(
  result: NativeHostResultV01,
  packetRequiredCheckIds: string[],
): string[] {
  const deliveryCheckId =
    result.adapter_extension.adapter_kind === "codex_app_server" ||
    result.adapter_extension.bounded_metadata.packet_delivery_initiated === true
      ? "validated_packet_delivery"
      : "deterministic_packet_delivery";
  return [...new Set([deliveryCheckId, ...packetRequiredCheckIds])].sort();
}

function verificationForResult(
  result: NativeHostResultV01,
  requiredCheckIds: string[],
  liveAppServerResult: boolean,
  synthesizedSkippedCheckIds: ReadonlySet<string>,
  reporterRef: ExternalRefV01,
): RunReceiptV01["verification"] {
  const hostRef = result.host_refs[0] ?? null;
  const hasHostResidue =
    liveAppServerResult &&
    Boolean(hostRef) &&
    (result.checks.some(
      (check) => check.check_id !== "validated_packet_delivery",
    ) ||
      result.skipped_checks.some(
        (check) => !synthesizedSkippedCheckIds.has(check.check_id),
      ));
  const hasObservedResidue =
    !liveAppServerResult ||
    synthesizedSkippedCheckIds.size > 0 ||
    result.checks.some(
      (check) => check.check_id === "validated_packet_delivery",
    );
  const basis =
    hasHostResidue && hasObservedResidue
      ? ("mixed" as const)
      : hasHostResidue
        ? ("attested" as const)
        : hasObservedResidue
          ? ("observed" as const)
          : ("unknown" as const);
  const sourceRefs = uniqueRefs([
    ...(hasObservedResidue ? [reporterRef] : []),
    ...(hasHostResidue ? [hostRef] : []),
  ]);
  const required = new Set(requiredCheckIds);
  const requiredChecks = result.checks.filter((check) =>
    required.has(check.check_id),
  );
  const requiredSkipped = result.skipped_checks.filter((check) =>
    required.has(check.check_id),
  );
  const anyFailed = result.checks.some((check) => check.status === "failed");
  const requiredNonpassing = requiredChecks.some(
    (check) => check.status !== "passed",
  );
  const allRequiredPassed = requiredCheckIds.every((checkId) =>
    requiredChecks.some(
      (check) => check.check_id === checkId && check.status === "passed",
    ),
  );
  let status: RunReceiptV01["verification"]["status"];
  if (anyFailed || requiredNonpassing) {
    status = "failed";
  } else if (
    result.checks.length === 0 &&
    result.skipped_checks.length === 0
  ) {
    status = result.outcome === "completed" ? "unknown" : "not_run";
  } else if (
    result.outcome === "completed" &&
    allRequiredPassed &&
    requiredSkipped.length === 0 &&
    !result.checks.some((check) =>
      ["blocked", "unknown"].includes(check.status),
    ) &&
    result.skipped_checks.length === 0
  ) {
    status = "passed";
  } else {
    status = "partial";
  }
  return {
    status,
    basis,
    required_check_ids: requiredCheckIds,
    source_refs: sourceRefs,
  };
}

function lifecycleForOutcome(outcome: NativeHostTerminalOutcomeV01): {
  run_status: AutonomyRunnerStatus;
  step_status: "completed" | "blocked" | "failed" | "cancelled";
  stop_reason: string;
  run_event_type:
    | "run_completed"
    | "run_blocked"
    | "run_failed"
    | "run_cancelled"
    | "run_timed_out";
  step_event_type:
    | "step_completed"
    | "step_blocked"
    | "step_failed"
    | "step_cancelled";
} {
  if (outcome === "completed") {
    return {
      run_status: "completed",
      step_status: "completed",
      stop_reason: "native_host_completed",
      run_event_type: "run_completed",
      step_event_type: "step_completed",
    };
  }
  if (outcome === "blocked" || outcome === "unavailable") {
    return {
      run_status: "blocked",
      step_status: "blocked",
      stop_reason: `native_host_${outcome}`,
      run_event_type: "run_blocked",
      step_event_type: "step_blocked",
    };
  }
  if (outcome === "cancelled") {
    return {
      run_status: "cancelled",
      step_status: "cancelled",
      stop_reason: "native_host_cancelled",
      run_event_type: "run_cancelled",
      step_event_type: "step_cancelled",
    };
  }
  if (outcome === "timed_out") {
    return {
      run_status: "timed_out",
      step_status: "cancelled",
      stop_reason: "native_host_timed_out",
      run_event_type: "run_timed_out",
      step_event_type: "step_cancelled",
    };
  }
  return {
    run_status: "failed",
    step_status: "failed",
    stop_reason: "native_host_failed",
    run_event_type: "run_failed",
    step_event_type: "step_failed",
  };
}

function receiptExecutionStatus(
  outcome: NativeHostTerminalOutcomeV01,
): RunReceiptV01["execution"]["status"] {
  if (outcome === "completed") return "completed";
  if (outcome === "cancelled" || outcome === "timed_out") return "cancelled";
  if (outcome === "blocked" || outcome === "unavailable") return "blocked";
  return "failed";
}

async function settleRoundTripResultV01(
  db: Database.Database,
  input: Omit<
    DirectNativeHostRoundTripResultV01,
    | "round_trip_version"
    | "packet_copy_actions"
    | "handoff_paste_actions"
    | "result_paste_actions"
    | "internal_id_entry_actions"
    | "proposal"
    | "proposal_created"
    | "decision_created"
    | "transition_created"
    | "evidence_accepted"
    | "work_closed"
    | "semantic_state_changed"
  > & {
    config: VNextLocalOperatorPilotConfigV01;
  },
  proposalAdmission: RunAssessmentProposalAdmissionDependenciesV01 | undefined,
): Promise<DirectNativeHostRoundTripResultV01> {
  const { config, ...result } = input;
  const { settleRunAssessmentProposalV01 } = await import(
    "@/lib/vnext/runtime/run-assessment-proposal-admission"
  );
  const settlement = settleRunAssessmentProposalV01(
    db,
    {
      workspace_id: config.workspace_id,
      project_id: config.project_id,
      receipt: input.receipt,
    },
    proposalAdmission,
  );
  return roundTripResult({
    ...result,
    proposal:
      settlement.status === "available"
        ? {
            status: "available",
            proposal_id: settlement.proposal.proposal_id,
            proposal_fingerprint: settlement.proposal.integrity.fingerprint,
            proposal_status: "pending_review",
            admission_status: settlement.admission_status,
          }
        : settlement,
    proposal_created:
      settlement.status === "available" &&
      settlement.admission_status === "inserted",
  });
}

function roundTripResult(
  input: Omit<
    DirectNativeHostRoundTripResultV01,
    | "round_trip_version"
    | "packet_copy_actions"
    | "handoff_paste_actions"
    | "result_paste_actions"
    | "internal_id_entry_actions"
    | "decision_created"
    | "transition_created"
    | "evidence_accepted"
    | "work_closed"
    | "semantic_state_changed"
  >,
): DirectNativeHostRoundTripResultV01 {
  return {
    round_trip_version: DIRECT_NATIVE_HOST_ROUND_TRIP_VERSION_V01,
    ...input,
    packet_copy_actions: 0,
    handoff_paste_actions: 0,
    result_paste_actions: 0,
    internal_id_entry_actions: 0,
    decision_created: false,
    transition_created: false,
    evidence_accepted: false,
    work_closed: false,
    semantic_state_changed: false,
  };
}

function resolveWorkRef(
  packet: TaskContextPacketV01,
  observedAt: string,
): ExternalRefV01 {
  if (packet.work_ref && typeof packet.work_ref === "object") {
    return packet.work_ref;
  }
  if (typeof packet.work_ref === "string" && packet.work_ref.length > 0) {
    return localRef(
      "work",
      packet.work_ref,
      observedAt,
      null,
      packet.packet_version,
      "derived_interpretation",
    );
  }
  refuse("direct_host_work_scope_missing", 409);
}

async function resolveRootKind(
  root: string,
  inspectedKind: "plain_folder" | "git_repository",
): Promise<NativeHostRootScopeV01["root_kind"]> {
  if (inspectedKind === "plain_folder") return "plain_folder";
  try {
    const gitMarker = await lstat(`${root}/.git`);
    return gitMarker.isFile() ? "git_worktree" : "git_repository";
  } catch {
    refuse("direct_host_root_scope_mismatch", 409);
  }
}

function repositoryArtifactRef(
  relativePath: string,
  observedAt: string,
  trustClass: ExternalRefV01["trust_class"] = "host_attestation",
): ExternalRefV01 {
  return {
    ref_version: "external_ref.v0.1",
    ref_type: "repository_relative_artifact",
    external_id: relativePath,
    observed_at: observedAt,
    source_ref: createProtocolSha256V01(relativePath),
    compatibility_namespace: DIRECT_NATIVE_HOST_ROUND_TRIP_VERSION_V01,
    trust_class: trustClass,
  };
}

function stableResidueIdV01(kind: string, value: unknown): string {
  return `${kind}:${createProtocolSha256V01(
    canonicalizeProtocolValueV01(value),
  )}`;
}

function localRef(
  refType: string,
  externalId: string,
  observedAt: string,
  sourceRef: string | null,
  namespace: string,
  trustClass: ExternalRefV01["trust_class"] = "direct_local_observation",
): ExternalRefV01 {
  return {
    ref_version: "external_ref.v0.1",
    ref_type: refType,
    external_id: externalId,
    observed_at: observedAt,
    source_ref: sourceRef,
    compatibility_namespace: namespace,
    trust_class: trustClass,
  };
}

function uniqueRefs(
  refs: Array<ExternalRefV01 | null | undefined>,
): ExternalRefV01[] {
  const seen = new Set<string>();
  return refs.filter((ref): ref is ExternalRefV01 => {
    if (!ref) return false;
    const key = canonicalizeProtocolValueV01({
      scope: ref.compatibility_namespace
        ? `namespace:${ref.compatibility_namespace}`
        : `provider:${ref.provider ?? ""}|host:${ref.host ?? ""}`,
      ref_type: ref.ref_type,
      external_id: ref.external_id,
    });
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function validAutomationContext(
  value: NativeHostAutomationContextV01 | null | undefined,
): value is NativeHostAutomationContextV01 {
  return Boolean(
    value &&
      value.automatic_retry_allowed === false &&
      value.scheduler_started === false &&
      value.policy_ref?.ref_version === "external_ref.v0.1" &&
      value.capability_grant_ref?.ref_version === "external_ref.v0.1" &&
      (value.control_revision === null ||
        (Number.isSafeInteger(value.control_revision) &&
          value.control_revision! >= 0)),
  );
}

function strictTimestamp(value: string): string {
  if (parseStrictIsoTimestampV01(value) === null) {
    refuse("direct_host_clock_invalid", 500);
  }
  return value;
}

function boundedFinishedAt(
  request: NativeHostRequestV01,
  fallback: string,
  now: () => string,
): string {
  const candidate = parseStrictIsoTimestampV01(now());
  if (candidate !== null) return new Date(candidate).toISOString();
  const generated = parseStrictIsoTimestampV01(fallback);
  return new Date(generated ?? 0).toISOString();
}

function refuse(
  code: string,
  status = 400,
  receipt: RunReceiptV01 | null = null,
): never {
  throw new DirectNativeHostRoundTripErrorV01(code, status, receipt);
}
