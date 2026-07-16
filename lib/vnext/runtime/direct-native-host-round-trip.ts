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
import { validateTaskContextPacketV01 } from "@/lib/vnext/task-context-packet";
import {
  DETERMINISTIC_CODEX_ADAPTER_VERSION_V01,
  createDeterministicCodexAdapterV01,
} from "@/lib/vnext/native-host/deterministic-codex-adapter";
import {
  NativeHostContractErrorV01,
  assertNativeHostResultV01,
} from "@/lib/vnext/native-host/native-host-contract";
import {
  admitVNextLocalOperatorMutationInsideTransactionV01,
  authenticateVNextLocalOperatorSessionV01,
  type VNextLocalOperatorPilotConfigV01,
  type VNextLocalOperatorSecretSourceV01,
  type VNextLocalOperatorSessionCredentialV01,
  type VNextLocalOperatorSessionMutationAdmissionV01,
} from "@/lib/vnext/runtime/local-operator-session";
import type { VNextLocalRuntimeClockV01 } from "@/lib/vnext/runtime/local-runtime-clock";
import {
  inspectVNextOperatorPilotPacketLineageV01,
  projectVNextOperatorPilotContinuityV01,
} from "@/lib/vnext/runtime/operator-pilot-project-continuity";
import {
  NATIVE_HOST_REQUEST_VERSION_V01,
  NATIVE_HOST_RESULT_RETURN_VERSION_V01,
  NATIVE_HOST_RESULT_VERSION_V01,
  type NativeHostAdapterV01,
  type NativeHostAutomationContextV01,
  type NativeHostRequestV01,
  type NativeHostResultV01,
  type NativeHostRootScopeV01,
  type NativeHostRunModeV01,
  type NativeHostTerminalOutcomeV01,
} from "@/types/vnext/native-host-adapter";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import type {
  AutonomyRunEventRecord,
  AutonomyRunStepRecord,
  AutonomyRunSummary,
  AutonomyRunnerStatus,
} from "@/types/autonomy-runner-execution";
import type { RunReceiptV01 } from "@/types/vnext/run-receipt";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";

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
  proposal_created: false;
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
  cancellation_signal?: AbortSignal;
  resolve_packet_selection?: (
    db: Database.Database,
    input: { config: VNextLocalOperatorPilotConfigV01; evaluated_at: string },
  ) => { packet_id: string; packet_fingerprint: string };
}

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
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 60_000) {
    refuse("direct_host_timeout_invalid");
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
      return roundTripResult({
        status: "exact_replay",
        mode: input.mode,
        request_id: identity.request_id,
        run_id: identity.run_id,
        receipt: existingReceipt,
        host_result: null,
        session_admission: sessionAdmission,
      });
    }
    if (readAutonomyRunLedgerRecord(identity.run_id, { db })) {
      refuse("direct_host_run_conflict", 409);
    }
    createRunLedgerRecord(db, {
      input,
      admission: admitted,
      request_id: identity.request_id,
      run_id: identity.run_id,
      started_at: startedAt,
      adapter,
    });
    db.exec("COMMIT");
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
  });
  let hostResult: NativeHostResultV01;
  try {
    hostResult = assertNativeHostResultV01(
      request,
      await invokeAdapterBounded(adapter, request, {
        timeout_ms: timeoutMs,
        cancellation_signal: dependencies.cancellation_signal,
        now,
      }),
    );
  } catch (error) {
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
  const receipt = buildDirectHostRunReceipt({
    request,
    result: hostResult,
    admission: admitted,
  });
  const terminal = lifecycleForOutcome(hostResult.outcome);
  db.exec("BEGIN IMMEDIATE");
  try {
    revalidateRunBeforeFinalization(db, identity.run_id, admitted);
    const write = admitStructuredRunReceiptV01(db, receipt);
    if (write.status !== "inserted") {
      refuse("direct_host_run_conflict", 409);
    }
    const current = readAutonomyRunLedgerRecord(identity.run_id, { db });
    const step = current?.steps[0];
    if (!current || !step || isTerminalRunnerStatus(current.status)) {
      refuse("direct_host_run_conflict", 409);
    }
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
  return roundTripResult({
    status: "inserted",
    mode: input.mode,
    request_id: identity.request_id,
    run_id: identity.run_id,
    receipt,
    host_result: hostResult,
    session_admission: sessionAdmission,
  });
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
): void {
  const run = readAutonomyRunLedgerRecord(runId, { db });
  if (
    !run ||
    run.status !== "running" ||
    run.metadata.packet_id !== admission.packet.packet_id ||
    run.metadata.packet_fingerprint !== admission.packet.integrity.fingerprint ||
    run.metadata.root_fingerprint !== admission.root_scope.root_fingerprint
  ) {
    refuse("direct_host_run_conflict", 409);
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
    ],
    forbidden_operation_categories: [
      "filesystem_outside_selected_project_root",
      "network_egress",
      "provider_or_model_call",
      "external_state_mutation",
      "semantic_commit",
      "raw_output_return",
      ...packet.constraints.forbidden_actions,
    ],
    packet_capability_grant: packet.capability_grant,
    automation_context: input.automation_context,
    policy: {
      filesystem: "selected_project_root_only",
      network: "forbidden",
      commands: "forbidden_in_deterministic_adapter",
      model: "forbidden_in_deterministic_adapter",
      max_changed_files: MAX_CHANGED_FILES,
      max_artifacts: MAX_ARTIFACTS,
      max_commands: MAX_COMMANDS,
      max_checks: MAX_CHECKS,
      timeout_ms: input.timeout_ms,
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
  },
): void {
  const packet = input.admission.packet;
  const run: AutonomyRunSummary = {
    run_id: input.run_id,
    scope: input.input.config.project_id,
    autonomy_contract_ref: DIRECT_NATIVE_HOST_ROUND_TRIP_VERSION_V01,
    title: "Project-scoped native-host round trip",
    status: "running",
    scheduled_for: null,
    started_at: input.started_at,
    finished_at: null,
    created_at: input.started_at,
    updated_at: input.started_at,
    stop_reason: null,
    source_refs: buildDefaultRunnerSourceRefs({
      runner_refs: [DIRECT_NATIVE_HOST_ROUND_TRIP_VERSION_V01],
    }),
    authority_boundary: buildDefaultRunnerAuthorityBoundary({
      notes: [
        "The deterministic host adapter receives one validated packet and cannot call a provider, GitHub, or external network.",
        "The resulting receipt is operational history, not approval, proof, accepted Evidence, semantic state, or work closure.",
      ],
    }),
    budget_snapshot: buildDefaultRunnerBudgetSnapshot({
      budget_id: `native-host-budget:${input.run_id}`,
      max_iterations: 1,
      max_tool_calls: 0,
      max_codex_tasks: 1,
      notes: [
        "One deterministic in-process host task is allowed; provider calls and external actions remain zero.",
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
      capability_grant_ref_id:
        input.input.automation_context?.capability_grant_ref.external_id ?? null,
      automatic_retry: false,
      semantic_mutation_authorized: false,
      raw_packet_persisted_in_ledger: false,
      absolute_root_persisted_in_ledger: false,
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
      status: "running",
      message: "Direct native-host run record created after packet admission.",
      payload: {
        workspace_id: input.input.config.workspace_id,
        project_id: input.input.config.project_id,
        packet_id: packet.packet_id,
        root_fingerprint: input.admission.root_scope.root_fingerprint,
      },
      created_at: input.started_at,
    }),
    buildAutonomyRunEventRecord({
      run_id: input.run_id,
      event_type: "run_started",
      status: "running",
      message: "Direct native-host round trip started.",
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

function buildDirectHostRunReceipt(input: {
  request: NativeHostRequestV01;
  result: NativeHostResultV01;
  admission: PersistedHostPacketAdmissionV01;
}): RunReceiptV01 {
  const { request, result, admission } = input;
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
  const hostRef = result.host_refs[0] ?? null;
  const artifactRefs = result.changed_files.map((changed) =>
    repositoryArtifactRef(changed.repository_relative_path, result.finished_at),
  );
  const sourceRefs = uniqueRefs([
    reporterRef,
    runRef,
    admission.packet_ref,
    admission.work_ref,
    admission.task_ref,
    admission.source_transition_receipt_ref,
    admission.root_scope.root_scope_ref,
    ...result.host_refs,
    ...result.model_invocation_receipt_refs,
  ]);
  const requiredCheckIds = [
    "deterministic_packet_delivery",
    ...admission.packet.constraints.required_checks,
  ];
  const verification = verificationForResult(result, requiredCheckIds);
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
      basis: "mixed",
      source_refs: hostRef ? [reporterRef, hostRef] : [reporterRef],
    },
    verification,
    reporter_ref: reporterRef,
    observer_refs: [reporterRef],
    verifier_refs: result.host_refs,
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
    observations: [
      {
        observation_id: `observation:host-boundary:${request.request_id}`,
        observation_kind: "structured_host_result_received",
        summary:
          "The local orchestration boundary received one bounded versioned structured host result.",
        event_at: result.finished_at,
        observed_at: result.finished_at,
        observer_ref: reporterRef,
        trust_class: "direct_local_observation",
        source_refs: [runRef, admission.packet_ref],
        related_command_ids: result.commands.map((command) => command.command_id),
        related_check_ids: result.checks.map((check) => check.check_id),
        related_artifact_refs: artifactRefs,
      },
      {
        observation_id: `observation:packet-binding:${request.request_id}`,
        observation_kind: "validated_packet_and_root_binding",
        summary:
          "Packet identity, fingerprint, current lineage, active project, and canonical root scope were validated before adapter start.",
        event_at: result.started_at,
        observed_at: result.started_at,
        observer_ref: reporterRef,
        trust_class: "direct_local_observation",
        source_refs: [
          admission.packet_ref,
          admission.source_transition_receipt_ref,
          admission.root_scope.root_scope_ref,
        ],
        related_command_ids: [],
        related_check_ids: result.checks.some(
          (check) => check.check_id === "deterministic_packet_delivery",
        )
          ? ["deterministic_packet_delivery"]
          : [],
        related_artifact_refs: [],
      },
    ],
    attestations: result.host_refs.length
      ? [
          {
            attestation_id: `attestation:host-result:${request.request_id}`,
            attestation_kind: "bounded_native_host_result",
            summary: result.summary,
            reported_at: result.finished_at,
            reporter_ref: result.host_refs[0]!,
            trust_class: "host_attestation",
            source_refs: result.host_refs,
            subject_refs: [admission.packet_ref, runRef],
          },
        ]
      : [],
    changed_artifacts: result.changed_files.map((changed, index) => ({
      artifact_ref: artifactRefs[index]!,
      change_kind: changed.change_kind,
      before_hash: changed.before_hash,
      after_hash: changed.after_hash,
      basis: "attested",
      related_observation_ids: [],
      related_attestation_ids: [`attestation:host-result:${request.request_id}`],
      source_refs: hostRef ? [hostRef] : [],
    })),
    commands: result.commands.map((command) => ({
      ...command,
      basis: "attested" as const,
      source_refs: hostRef ? [hostRef] : [],
      raw_output_included: false as const,
    })),
    checks: result.checks.map((check) => ({
      ...check,
      basis: "attested" as const,
      source_refs: hostRef ? [hostRef] : [],
    })),
    skipped_checks: result.skipped_checks.map((check) => ({
      ...check,
      basis: "attested" as const,
      source_refs: hostRef ? [hostRef] : [],
    })),
    external_refs: uniqueRefs([
      ...result.host_refs,
      ...result.artifacts.map((artifact) => artifact.artifact_ref),
      ...result.model_invocation_receipt_refs,
      admission.root_scope.repository_ref,
      admission.root_scope.selected_worktree_ref,
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
    blockers:
      result.outcome === "completed"
        ? []
        : [
            {
              code: result.public_stop_reason ?? `native_host_${result.outcome}`,
              summary: "The native-host adapter returned a non-success terminal outcome.",
              source_refs: result.host_refs,
            },
          ],
    warnings: result.uncertainty.map((summary, index) => ({
      code: `native_host_uncertainty_${index + 1}`,
      summary,
      source_refs: result.host_refs,
    })),
    gaps: result.gaps.map((summary, index) => ({
      code: `native_host_gap_${index + 1}`,
      summary,
      source_refs: result.host_refs,
    })),
    privacy_egress: {
      data_classification: admission.packet.constraints.data_classification,
      egress_status: "did_not_occur",
      basis: "observed",
      destination_refs: [],
      redaction_status: "not_needed",
      retention_class: "bounded_structured_receipt_only",
      raw_prompt_persisted: false,
      raw_output_persisted: false,
      raw_transcript_persisted: false,
      secret_material_persisted: false,
      source_refs: [reporterRef],
      notes: [
        "The packet was delivered in process and was not copied into the ledger or receipt.",
        "No prompt, transcript, hidden reasoning, environment dump, provider payload, stdout, stderr, credential, or absolute root path is persisted.",
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
  if (validateRunReceiptV01(receipt).status !== "valid") {
    refuse("direct_host_receipt_invalid", 500, receipt);
  }
  return receipt;
}

async function invokeAdapterBounded(
  adapter: NativeHostAdapterV01,
  request: NativeHostRequestV01,
  input: {
    timeout_ms: number;
    cancellation_signal?: AbortSignal;
    now: () => string;
  },
): Promise<NativeHostResultV01> {
  const controller = new AbortController();
  let settled = false;
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let cancelListener: (() => void) | null = null;
  const terminal = new Promise<NativeHostResultV01>((resolve) => {
    const finish = (outcome: "cancelled" | "timed_out", reason: string) => {
      if (settled) return;
      settled = true;
      controller.abort(reason);
      resolve(
        buildBoundaryTerminalResult({
          request,
          adapter,
          outcome,
          reason,
          now: input.now,
        }),
      );
    };
    timeout = setTimeout(
      () => finish("timed_out", "native_host_timeout"),
      input.timeout_ms,
    );
    if (input.cancellation_signal) {
      cancelListener = () => finish("cancelled", "native_host_cancelled");
      if (input.cancellation_signal.aborted) cancelListener();
      else
        input.cancellation_signal.addEventListener("abort", cancelListener, {
          once: true,
        });
    }
  });
  const invocation = Promise.resolve(
    adapter.invoke(request, {
      cancellation_signal: controller.signal,
      timeout_ms: input.timeout_ms,
    }),
  ).then(
    (result) => {
      settled = true;
      return result;
    },
    () => {
      settled = true;
      return buildBoundaryTerminalResult({
        request,
        adapter,
        outcome: "failed",
        reason: "native_host_adapter_failed",
        now: input.now,
      });
    },
  );
  try {
    return await Promise.race([invocation, terminal]);
  } finally {
    if (timeout) clearTimeout(timeout);
    if (input.cancellation_signal && cancelListener) {
      input.cancellation_signal.removeEventListener("abort", cancelListener);
    }
  }
}

function buildBoundaryTerminalResult(input: {
  request: NativeHostRequestV01;
  adapter: NativeHostAdapterV01;
  outcome: Exclude<NativeHostTerminalOutcomeV01, "completed" | "blocked" | "unavailable">;
  reason: string;
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
    host_refs: [hostRef],
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
    ],
    adapter_extension: {
      extension_version: "native_host_boundary_extension.v0.1",
      adapter_kind: input.adapter.adapter_version,
      bounded_metadata: {
        live_host_invoked: false,
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

function verificationForResult(
  result: NativeHostResultV01,
  requiredCheckIds: string[],
): RunReceiptV01["verification"] {
  const attestationSource = result.host_refs[0]
    ? [result.host_refs[0]]
    : [];
  if (result.checks.some((check) => check.status === "failed")) {
    return {
      status: "failed",
      basis: "attested",
      required_check_ids: requiredCheckIds,
      source_refs: attestationSource,
    };
  }
  if (result.outcome !== "completed") {
    return {
      status: "not_run",
      basis: result.host_refs.length ? "attested" : "unknown",
      required_check_ids: requiredCheckIds,
      source_refs: attestationSource,
    };
  }
  return {
    status: result.skipped_checks.length ? "partial" : "passed",
    basis: "attested",
    required_check_ids: requiredCheckIds,
    source_refs: attestationSource,
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
    | "run_cancelled";
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
  if (outcome === "cancelled" || outcome === "timed_out") {
    return {
      run_status: "cancelled",
      step_status: "cancelled",
      stop_reason: `native_host_${outcome}`,
      run_event_type: "run_cancelled",
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

function roundTripResult(
  input: Omit<
    DirectNativeHostRoundTripResultV01,
    | "round_trip_version"
    | "packet_copy_actions"
    | "handoff_paste_actions"
    | "result_paste_actions"
    | "internal_id_entry_actions"
    | "proposal_created"
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
    proposal_created: false,
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
): ExternalRefV01 {
  return {
    ref_version: "external_ref.v0.1",
    ref_type: "repository_relative_artifact",
    external_id: relativePath,
    observed_at: observedAt,
    source_ref: createProtocolSha256V01(relativePath),
    compatibility_namespace: DIRECT_NATIVE_HOST_ROUND_TRIP_VERSION_V01,
    trust_class: "host_attestation",
  };
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
    const key = canonicalizeProtocolValueV01(ref);
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
