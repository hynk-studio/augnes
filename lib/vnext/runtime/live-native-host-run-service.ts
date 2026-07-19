import type Database from "better-sqlite3";

import {
  appendAutonomyRunLedgerEvent,
  buildAutonomyRunEventRecord,
  ensureAutonomyRunnerLedgerSchemaV01,
  readAutonomyRunLedgerRecord,
  updateAutonomyRunLedgerFields,
  updateAutonomyRunStepLedgerFields,
} from "@/lib/autonomy/runner-ledger";
import { isTerminalRunnerStatus } from "@/lib/autonomy/runner-state";
import { assertNativeHostPublicTextV01 } from "@/lib/vnext/native-host/native-host-contract";
import { createCodexAppServerAdapterV01 } from "@/lib/vnext/native-host/codex-app-server-adapter";
import { canonicalizeRepositoryRelativePathV01 } from "@/lib/vnext/repository-relative-path";
import { validateExternalRefV01 } from "@/lib/vnext/task-context-packet";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
  parseStrictIsoTimestampV01,
} from "@/lib/vnext/protocol-primitives";
import {
  readActiveProjectSelectionV01,
} from "@/lib/vnext/persistence/project-lifecycle-registry";
import { readCanonicalProjectWithRootV01 } from "@/lib/vnext/persistence/project-identity-registry";
import {
  admitPersistedHostTaskContextPacketV01,
  DirectNativeHostRoundTripErrorV01,
  runDirectNativeHostRoundTripV01,
  type NativeHostTimeoutSchedulerV01,
  type PersistedHostPacketAdmissionV01,
} from "@/lib/vnext/runtime/direct-native-host-round-trip";
import {
  admitVNextLocalOperatorMutationV01,
  admitVNextLocalOperatorMutationInsideTransactionV01,
  authenticateVNextLocalOperatorSessionV01,
  openVNextLocalOperatorDatabaseV01,
  type VNextLocalOperatorPilotConfigV01,
  type VNextLocalOperatorSecretSourceV01,
  type VNextLocalOperatorSessionCredentialV01,
  type VNextLocalOperatorSessionMutationAdmissionV01,
} from "@/lib/vnext/runtime/local-operator-session";
import type { VNextLocalRuntimeClockV01 } from "@/lib/vnext/runtime/local-runtime-clock";
import { projectVNextOperatorPilotContinuityV01 } from "@/lib/vnext/runtime/operator-pilot-project-continuity";
import {
  appendNativeHostApprovalDecisionResidueV01,
  appendNativeHostApprovalRequestResidueV01,
} from "@/lib/vnext/runtime/native-host-approval-residue";
import type { AutonomyRunRecord } from "@/types/autonomy-runner-execution";
import {
  NATIVE_HOST_APPROVAL_VERSION_V01,
  type NativeHostAdapterV01,
  type NativeHostApprovalDecisionKindV01,
  type NativeHostApprovalDecisionV01,
  type NativeHostApprovalRequestV01,
  type NativeHostAutomationContextV01,
  type NativeHostLifecycleEventV01,
  type NativeHostLifecycleSinkV01,
  type NativeHostRequestV01,
  type NativeHostResumeBindingV01,
  type NativeHostRunModeV01,
} from "@/types/vnext/native-host-adapter";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import { validateBoundedAutomationCapabilityGrantV01 } from "@/lib/vnext/bounded-automation-cycle";
import { readBoundedAutomationCapabilityGrantV01 } from "@/lib/vnext/persistence/bounded-automation-authority";

export const LIVE_NATIVE_HOST_RUN_SERVICE_VERSION_V01 =
  "live_native_host_run_service.v0.1" as const;

export const DEFAULT_LIVE_TIMEOUT_MS = 15 * 60 * 1_000;
const DEFAULT_STOP_SETTLE_TIMEOUT_MS = 10_000;
const MAX_EVENT_FINGERPRINTS = 128;

type PendingApprovalProjectionV01 = NativeHostApprovalRequestV01 & {
  control_revision: number;
  decision_submitted: boolean;
};

export interface LiveNativeHostRunProjectionV01 {
  service_version: typeof LIVE_NATIVE_HOST_RUN_SERVICE_VERSION_V01;
  status:
    | "idle"
    | "queued"
    | "starting"
    | "running"
    | "waiting_for_approval"
    | "cancelling"
    | "paused"
    | "blocked"
    | "completed"
    | "failed"
    | "cancelled"
    | "timed_out";
  run_ref: string | null;
  mode: NativeHostRunModeV01 | null;
  control_revision: number;
  reconciliation_required: boolean;
  public_reason: string | null;
  capability: {
    status:
      | "not_checked"
      | "checking"
      | "available"
      | "unavailable"
      | "disconnected";
    adapter_version: string | null;
    capability_version: string | null;
    cli_version: string | null;
    public_reason: string | null;
  };
  pending_approval: null | {
    approval_ref: string;
    operation_class: NativeHostApprovalRequestV01["operation_class"];
    resource_summary: string;
    public_reason: string;
    public_risk_summary: string;
    command_summary: string | null;
    repository_relative_paths: string[];
    network_resources: string[];
    available_decisions: NativeHostApprovalDecisionKindV01[];
    expires_at: string | null;
    control_revision: number;
    decision_submitted: boolean;
  };
  receipt: null | {
    receipt_ref: string;
    receipt_fingerprint: string;
    outcome: string | null;
  };
  packet_copy_actions: 0;
  handoff_paste_actions: 0;
  result_paste_actions: 0;
  internal_id_entry_actions: 0;
  semantic_authority_granted: false;
}

export interface LiveNativeHostStartResultV01 {
  status: "accepted" | "exact_replay";
  projection: LiveNativeHostRunProjectionV01;
  session_admission: VNextLocalOperatorSessionMutationAdmissionV01 | null;
}

export interface LiveNativeHostRunServiceOptionsV01 {
  open_database?: (
    config: VNextLocalOperatorPilotConfigV01,
  ) => Database.Database;
  adapter_factory?: () => NativeHostAdapterV01;
  now?: () => string;
  timeout_ms?: number;
  stop_settle_timeout_ms?: number;
  schedule_timeout?: NativeHostTimeoutSchedulerV01;
  test_only_allow_unauthenticated_interactive?: boolean;
}

export class LiveNativeHostRunServiceErrorV01 extends Error {
  constructor(readonly code: string, readonly status = 400) {
    super(code);
    this.name = "LiveNativeHostRunServiceErrorV01";
  }
}

export class LiveNativeHostRunServiceV01 {
  private readonly controllers = new Map<string, LiveRunControllerV01>();
  private readonly openDatabase: NonNullable<
    LiveNativeHostRunServiceOptionsV01["open_database"]
  >;
  private readonly now: () => string;

  constructor(private readonly options: LiveNativeHostRunServiceOptionsV01 = {}) {
    this.openDatabase = options.open_database ?? openVNextLocalOperatorDatabaseV01;
    this.now = options.now ?? (() => new Date().toISOString());
  }

  readCapabilityContractV01(): {
    adapter_version: string;
    capability_version: string;
    timeout_ms: number;
    execution_profile: NativeHostAdapterV01["execution_profile"];
    provider_egress: NativeHostAdapterV01["provider_egress"];
  } {
    const adapter = this.currentAdapterContract();
    return {
      adapter_version: adapter.adapter_version,
      capability_version: adapter.capability_version,
      timeout_ms: this.options.timeout_ms ?? DEFAULT_LIVE_TIMEOUT_MS,
      execution_profile: adapter.execution_profile,
      provider_egress: adapter.provider_egress,
    };
  }

  async start(input: {
    config: VNextLocalOperatorPilotConfigV01;
    mode: NativeHostRunModeV01;
    automation_context?: NativeHostAutomationContextV01 | null;
    operator_mutation?: {
      credential: VNextLocalOperatorSessionCredentialV01;
      clock?: VNextLocalRuntimeClockV01;
      secret_source?: VNextLocalOperatorSecretSourceV01;
    };
  }): Promise<LiveNativeHostStartResultV01> {
    if (
      input.mode === "interactive" &&
      !input.operator_mutation &&
      this.options.test_only_allow_unauthenticated_interactive !== true
    ) {
      refuseV01("live_host_operator_authority_required", 401);
    }
    const key = projectKeyV01(input.config);
    const active = this.controllers.get(key);
    if (active && !active.completionSettled) {
      const activeRun = this.readLatestManagedRun(input.config);
      if (
        !activeRun ||
        activeRun.run_id !== active.runId ||
        activeRun.metadata.adapter_version !== active.adapter.adapter_version ||
        activeRun.metadata.capability_version !== active.adapter.capability_version ||
        !active.matchesStart(input.mode, input.automation_context ?? null)
      ) {
        refuseV01("live_host_start_conflict", 409);
      }
      await this.assertRunStillBindsCurrentSelection(input.config, activeRun);
      return {
        status: "exact_replay",
        projection: this.read(input.config),
        session_admission: this.admitReplayMutation(
          input.config,
          input.operator_mutation,
        ),
      };
    }

    const existing = this.readLatestManagedRun(input.config);
    if (existing && !isTerminalRunnerStatus(existing.status)) {
      if (
        !startMaterialMatchesRunV01(
          existing,
          input.mode,
          input.automation_context ?? null,
          this.currentAdapterContract(),
        )
      ) {
        refuseV01("live_host_start_conflict", 409);
      }
      await this.assertRunStillBindsCurrentSelection(input.config, existing);
      if (existing.status !== "paused") {
        this.pauseUnownedRun(input.config, existing);
      }
      return {
        status: "exact_replay",
        projection: this.read(input.config),
        session_admission: this.admitReplayMutation(
          input.config,
          input.operator_mutation,
        ),
      };
    }
    if (
      existing &&
      isTerminalRunnerStatus(existing.status) &&
      (await this.isExactCurrentStartReplay(
        input.config,
        existing,
        input.mode,
        input.automation_context ?? null,
      ))
    ) {
      await this.retryTerminalProposalAdmissionV01(input.config, existing);
      const refreshed = this.readLatestManagedRun(input.config) ?? existing;
      return {
        status: "exact_replay",
        projection: projectionFromRunV01(refreshed),
        session_admission: this.admitReplayMutation(
          input.config,
          input.operator_mutation,
        ),
      };
    }
    if (existing && isTerminalRunnerStatus(existing.status)) {
      const currentPacket = this.currentPacketIdentity(input.config);
      if (
        !currentPacket ||
        (currentPacket.packet_id === existing.metadata.packet_id &&
          currentPacket.packet_fingerprint ===
            existing.metadata.packet_fingerprint)
      ) {
        refuseV01("live_host_start_conflict", 409);
      }
    }

    return this.launch({ ...input, resume_binding: null, resume_existing: false });
  }

  read(config: VNextLocalOperatorPilotConfigV01): LiveNativeHostRunProjectionV01 {
    const run = this.readLatestManagedRun(config);
    if (!run) return idleProjectionV01();
    const controller = this.controllers.get(projectKeyV01(config));
    if (
      !controller &&
      !isTerminalRunnerStatus(run.status) &&
      run.status !== "paused"
    ) {
      this.pauseUnownedRun(config, run);
      const paused = this.readLatestManagedRun(config);
      return paused ? projectionFromRunV01(paused) : idleProjectionV01();
    }
    return projectionFromRunV01(run);
  }

  private async retryTerminalProposalAdmissionV01(
    config: VNextLocalOperatorPilotConfigV01,
    run: AutonomyRunRecord,
  ): Promise<void> {
    if (run.metadata.run_assessment_proposal_status === "available") return;
    if (
      run.metadata.run_assessment_proposal_status === "failed" &&
      run.metadata.run_assessment_proposal_retry_required !== true
    ) {
      return;
    }
    const receiptId = stringMetadataV01(run.metadata.run_receipt_id);
    if (!receiptId) return;
    const db = this.openDatabase(config);
    try {
      const { settleRunAssessmentProposalV01 } = await import(
        "@/lib/vnext/runtime/run-assessment-proposal-admission"
      );
      const { readProjectRunResultSourceBindingV01 } = await import(
        "@/lib/vnext/runtime/project-run-result-read-model"
      );
      const binding = readProjectRunResultSourceBindingV01(db, {
        workspace_id: config.workspace_id,
        project_id: config.project_id,
        receipt_id: receiptId,
      });
      settleRunAssessmentProposalV01(db, {
        workspace_id: config.workspace_id,
        project_id: config.project_id,
        receipt: binding.receipt,
      });
    } catch {
      // Host terminal replay remains truthful even when proposal retry fails.
    } finally {
      db.close();
    }
  }

  async decide(input: {
    config: VNextLocalOperatorPilotConfigV01;
    run_ref: string;
    approval_ref: string;
    control_revision: number;
    decision: "approve_once" | "decline";
    credential: VNextLocalOperatorSessionCredentialV01;
    clock?: VNextLocalRuntimeClockV01;
    secret_source?: VNextLocalOperatorSecretSourceV01;
  }): Promise<{
    projection: LiveNativeHostRunProjectionV01;
    session_admission: VNextLocalOperatorSessionMutationAdmissionV01;
  }> {
    const db = this.openDatabase(input.config);
    let admission: VNextLocalOperatorSessionMutationAdmissionV01;
    try {
      authenticateVNextLocalOperatorSessionV01(db, {
        config: input.config,
        credential: input.credential,
        clock: input.clock,
      });
      const prevalidatedRun = this.requireRunV01(
        db,
        input.config,
        input.run_ref,
      );
      const scopeAdmission = await this.revalidateRunScopeV01(
        db,
        input.config,
        prevalidatedRun,
      );
      db.exec("BEGIN IMMEDIATE");
      admission = admitVNextLocalOperatorMutationInsideTransactionV01(db, {
        config: input.config,
        credential: input.credential,
        clock: input.clock,
        secret_source: input.secret_source,
      });
      const run = this.requireRunV01(db, input.config, input.run_ref);
      this.assertPrevalidatedScopeCurrentInsideTransactionV01(
        db,
        input.config,
        run,
        scopeAdmission,
      );
      persistApprovalDecisionInsideTransactionV01(db, input.config, run, {
        approval_ref: input.approval_ref,
        expected_revision: input.control_revision,
        decision: input.decision,
        decision_source: "explicit_local_operator",
        decided_at: this.now(),
      });
      db.exec("COMMIT");
    } catch (error) {
      if (db.inTransaction) db.exec("ROLLBACK");
      throw error;
    } finally {
      db.close();
    }
    const controller = this.controllers.get(projectKeyV01(input.config));
    controller?.resolveApproval(input.approval_ref, input.decision, admission);
    return { projection: this.read(input.config), session_admission: admission };
  }

  async cancel(input: {
    config: VNextLocalOperatorPilotConfigV01;
    run_ref: string;
    control_revision: number;
    credential: VNextLocalOperatorSessionCredentialV01;
    clock?: VNextLocalRuntimeClockV01;
    secret_source?: VNextLocalOperatorSecretSourceV01;
  }): Promise<{
    projection: LiveNativeHostRunProjectionV01;
    session_admission: VNextLocalOperatorSessionMutationAdmissionV01;
  }> {
    const controller = this.controllers.get(projectKeyV01(input.config));
    const db = this.openDatabase(input.config);
    let admission: VNextLocalOperatorSessionMutationAdmissionV01;
    let repeated = false;
    try {
      authenticateVNextLocalOperatorSessionV01(db, {
        config: input.config,
        credential: input.credential,
        clock: input.clock,
      });
      const prevalidatedRun = this.requireRunV01(
        db,
        input.config,
        input.run_ref,
      );
      const scopeAdmission = await this.revalidateRunScopeV01(
        db,
        input.config,
        prevalidatedRun,
      );
      db.exec("BEGIN IMMEDIATE");
      admission = admitVNextLocalOperatorMutationInsideTransactionV01(db, {
        config: input.config,
        credential: input.credential,
        clock: input.clock,
        secret_source: input.secret_source,
      });
      const run = this.requireRunV01(db, input.config, input.run_ref);
      this.assertPrevalidatedScopeCurrentInsideTransactionV01(
        db,
        input.config,
        run,
        scopeAdmission,
      );
      if (isTerminalRunnerStatus(run.status)) {
        repeated = true;
      } else if (run.status === "cancelling") {
        if (
          numberMetadataV01(run.metadata.cancellation_request_revision) !==
          input.control_revision
        ) {
          refuseV01("live_host_control_revision_conflict", 409);
        }
        repeated = true;
      } else if (run.status === "paused") {
        // A disconnected run has no confirmed host observation channel. It
        // must be resumed/reconciled before an interrupt can be claimed.
        refuseV01("live_host_cancel_owner_unavailable", 409);
      } else {
        if (
          !controller ||
          controller.completionSettled ||
          controller.runId !== run.run_id
        ) {
          refuseV01("live_host_cancel_owner_unavailable", 409);
        }
        const revision = numberMetadataV01(run.metadata.control_revision);
        if (revision !== input.control_revision) {
          refuseV01("live_host_control_revision_conflict", 409);
        }
        this.transitionRunV01(db, run, {
          status: "cancelling",
          event_type: "run_cancelling",
          message: "Cancellation was requested for the exact active native-host turn.",
          observed_at: this.now(),
          metadata: {
            cancellation_requested: true,
            cancellation_request_revision: input.control_revision,
          },
        });
      }
      db.exec("COMMIT");
    } catch (error) {
      if (db.inTransaction) db.exec("ROLLBACK");
      throw error;
    } finally {
      db.close();
    }
    if (!repeated) {
      controller!.cancel();
    }
    return { projection: this.read(input.config), session_admission: admission };
  }

  async resume(input: {
    config: VNextLocalOperatorPilotConfigV01;
    run_ref: string;
    control_revision: number;
    credential: VNextLocalOperatorSessionCredentialV01;
    clock?: VNextLocalRuntimeClockV01;
    secret_source?: VNextLocalOperatorSecretSourceV01;
  }): Promise<LiveNativeHostStartResultV01> {
    const db = this.openDatabase(input.config);
    let run: AutonomyRunRecord;
    let binding: NativeHostResumeBindingV01;
    let mode: NativeHostRunModeV01;
    try {
      authenticateVNextLocalOperatorSessionV01(db, {
        config: input.config,
        credential: input.credential,
        clock: input.clock,
      });
      run = this.requireRunV01(db, input.config, input.run_ref);
      await this.revalidateRunScopeV01(db, input.config, run);
      if (run.status !== "paused") refuseV01("live_host_resume_state_invalid", 409);
      if (numberMetadataV01(run.metadata.control_revision) !== input.control_revision) {
        refuseV01("live_host_control_revision_conflict", 409);
      }
      binding = resumeBindingFromRunV01(run);
      mode = run.metadata.invocation_origin === "policy_triggered"
        ? "policy_triggered"
        : "interactive";
    } finally {
      db.close();
    }
    const active = this.controllers.get(projectKeyV01(input.config));
    if (active && !active.completionSettled) {
      return {
        status: "exact_replay",
        projection: this.read(input.config),
        session_admission: this.admitReplayMutation(input.config, {
          credential: input.credential,
          clock: input.clock,
          secret_source: input.secret_source,
        }),
      };
    }
    return this.launch({
      config: input.config,
      mode,
      automation_context:
        mode === "policy_triggered" ? automationContextFromRunV01(run) : null,
      operator_mutation: {
        credential: input.credential,
        clock: input.clock,
        secret_source: input.secret_source,
      },
      resume_binding: binding,
      resume_existing: true,
    });
  }

  async shutdown(): Promise<void> {
    const controllers = [...this.controllers.values()].filter(
      (controller) => !controller.completionSettled,
    );
    controllers.forEach((controller) => controller.cancel());
    await Promise.allSettled(controllers.map((controller) => controller.completion));
  }

  private async launch(input: {
    config: VNextLocalOperatorPilotConfigV01;
    mode: NativeHostRunModeV01;
    automation_context?: NativeHostAutomationContextV01 | null;
    operator_mutation?: {
      credential: VNextLocalOperatorSessionCredentialV01;
      clock?: VNextLocalRuntimeClockV01;
      secret_source?: VNextLocalOperatorSecretSourceV01;
    };
    resume_binding: NativeHostResumeBindingV01 | null;
    resume_existing: boolean;
  }): Promise<LiveNativeHostStartResultV01> {
    const db = this.openDatabase(input.config);
    const delegate =
      this.options.adapter_factory?.() ?? createCodexAppServerAdapterV01();
    const controller = new LiveRunControllerV01({
      config: input.config,
      mode: input.mode,
      db,
      now: this.now,
      delegate,
    });
    const key = projectKeyV01(input.config);
    this.controllers.set(key, controller);
    controller.completion = runDirectNativeHostRoundTripV01(
      db,
      {
        config: input.config,
        mode: input.mode,
        automation_context: input.automation_context ?? null,
        operator_mutation: input.operator_mutation,
      },
      {
        adapter: controller.adapter,
        now: this.now,
        timeout_ms: this.options.timeout_ms ?? DEFAULT_LIVE_TIMEOUT_MS,
        stop_settle_timeout_ms:
          this.options.stop_settle_timeout_ms ?? DEFAULT_STOP_SETTLE_TIMEOUT_MS,
        schedule_timeout: this.options.schedule_timeout,
        cancellation_signal: controller.abortController.signal,
        lifecycle_sink: controller,
        lifecycle_mode: "managed_live",
        resume_binding: input.resume_binding,
        resume_existing_run: input.resume_existing,
        live_host_egress_authorized: input.mode === "interactive",
        on_invocation_admitted: ({ request, session_admission }) =>
          controller.admit(request, session_admission),
      },
    )
      .then((result) => {
        controller.complete(result.run_id);
      })
      .catch((error: unknown) => {
        controller.fail(error);
      })
      .finally(() => {
        controller.completionSettled = true;
        try {
          controller.releaseInvocationMaterial();
          db.close();
        } finally {
          if (this.controllers.get(key) === controller) {
            this.controllers.delete(key);
          }
        }
      });

    let sessionAdmission: VNextLocalOperatorSessionMutationAdmissionV01 | null;
    try {
      await Promise.race([
        Promise.all([controller.admitted.promise, controller.owned.promise]),
        controller.failedBeforeOwnership.promise.then((error) => Promise.reject(error)),
      ]);
      sessionAdmission = controller.sessionAdmission;
    } catch (error) {
      if (this.controllers.get(key) === controller) this.controllers.delete(key);
      throw error;
    }
    return {
      status: "accepted",
      projection: this.read(input.config),
      session_admission: sessionAdmission,
    };
  }

  private readLatestManagedRun(
    config: VNextLocalOperatorPilotConfigV01,
  ): AutonomyRunRecord | null {
    const db = this.openDatabase(config);
    try {
      ensureAutonomyRunnerLedgerSchemaV01(db);
      const row = db
        .prepare(
          `SELECT run_id FROM autonomy_runs
           WHERE scope = ?
             AND json_extract(metadata_json, '$.workspace_id') = ?
             AND json_extract(metadata_json, '$.project_id') = ?
             AND json_extract(metadata_json, '$.lifecycle_mode') = 'managed_live'
           ORDER BY updated_at DESC, run_id DESC
           LIMIT 1`,
        )
        .get(config.project_id, config.workspace_id, config.project_id) as
        | { run_id: string }
        | undefined;
      return row ? readAutonomyRunLedgerRecord(row.run_id, { db }) : null;
    } finally {
      db.close();
    }
  }

  private admitReplayMutation(
    config: VNextLocalOperatorPilotConfigV01,
    mutation:
      | {
          credential: VNextLocalOperatorSessionCredentialV01;
          clock?: VNextLocalRuntimeClockV01;
          secret_source?: VNextLocalOperatorSecretSourceV01;
        }
      | undefined,
  ): VNextLocalOperatorSessionMutationAdmissionV01 | null {
    if (!mutation) return null;
    const db = this.openDatabase(config);
    try {
      return admitVNextLocalOperatorMutationV01(db, {
        config,
        ...mutation,
      });
    } finally {
      db.close();
    }
  }

  private async isExactCurrentStartReplay(
    config: VNextLocalOperatorPilotConfigV01,
    run: AutonomyRunRecord,
    mode: NativeHostRunModeV01,
    automationContext: NativeHostAutomationContextV01 | null,
  ): Promise<boolean> {
    if (
      !startMaterialMatchesRunV01(
        run,
        mode,
        automationContext,
        this.currentAdapterContract(),
      )
    ) {
      return false;
    }
    try {
      await this.assertRunStillBindsCurrentSelection(config, run);
      return true;
    } catch {
      return false;
    }
  }

  private currentAdapterContract(): NativeHostAdapterV01 {
    return this.options.adapter_factory?.() ?? createCodexAppServerAdapterV01();
  }

  private currentPacketIdentity(config: VNextLocalOperatorPilotConfigV01): {
    packet_id: string;
    packet_fingerprint: string;
  } | null {
    const db = this.openDatabase(config);
    try {
      const continuity = projectVNextOperatorPilotContinuityV01(db, {
        config,
        clock: { now: this.now },
      });
      return continuity.packet_currentness === "fresh" &&
        continuity.latest_compiled_packet
        ? {
            packet_id: continuity.latest_compiled_packet.packet_id,
            packet_fingerprint:
              continuity.latest_compiled_packet.packet_fingerprint,
          }
        : null;
    } catch {
      return null;
    } finally {
      db.close();
    }
  }

  private requireRunV01(
    db: Database.Database,
    config: VNextLocalOperatorPilotConfigV01,
    runRef: string,
  ): AutonomyRunRecord {
    const run = readAutonomyRunLedgerRecord(runRef, { db });
    if (
      !run ||
      run.scope !== config.project_id ||
      run.metadata.workspace_id !== config.workspace_id ||
      run.metadata.project_id !== config.project_id ||
      run.metadata.lifecycle_mode !== "managed_live"
    ) {
      refuseV01("live_host_run_scope_mismatch", 409);
    }
    return run;
  }

  private async assertRunStillBindsCurrentSelection(
    config: VNextLocalOperatorPilotConfigV01,
    run: AutonomyRunRecord,
  ): Promise<void> {
    const db = this.openDatabase(config);
    try {
      await this.revalidateRunScopeV01(db, config, run);
    } finally {
      db.close();
    }
  }

  private async revalidateRunScopeV01(
    db: Database.Database,
    config: VNextLocalOperatorPilotConfigV01,
    run: AutonomyRunRecord,
  ): Promise<PersistedHostPacketAdmissionV01> {
    const active = readActiveProjectSelectionV01(db, config.workspace_id);
    if (active?.project_id !== config.project_id) {
      refuseV01("live_host_project_not_active", 409);
    }
    const packetId = stringMetadataV01(run.metadata.packet_id);
    const packetFingerprint = stringMetadataV01(run.metadata.packet_fingerprint);
    if (!packetId || !packetFingerprint) refuseV01("live_host_packet_binding_missing", 409);
    const admitted = await admitPersistedHostTaskContextPacketV01(db, {
      config,
      packet_id: packetId,
      packet_fingerprint: packetFingerprint,
      evaluated_at: this.now(),
    });
    if (admitted.root_scope.root_fingerprint !== run.metadata.root_fingerprint) {
      refuseV01("live_host_root_binding_mismatch", 409);
    }
    return admitted;
  }

  private assertPrevalidatedScopeCurrentInsideTransactionV01(
    db: Database.Database,
    config: VNextLocalOperatorPilotConfigV01,
    run: AutonomyRunRecord,
    admitted: PersistedHostPacketAdmissionV01,
  ): void {
    if (!db.inTransaction) refuseV01("live_host_transaction_required", 500);
    const active = readActiveProjectSelectionV01(db, config.workspace_id);
    const continuity = projectVNextOperatorPilotContinuityV01(db, {
      config,
      clock: { now: this.now },
    });
    const registration = readCanonicalProjectWithRootV01(db, config);
    const rootFingerprint = registration
      ? createProtocolSha256V01(
          canonicalizeProtocolValueV01({
            workspace_id: config.workspace_id,
            project_id: config.project_id,
            local_root: registration.root_binding.local_root,
            binding_version: registration.root_binding.binding_version,
            bound_at: registration.root_binding.bound_at,
          }),
        )
      : null;
    if (
      active?.project_id !== config.project_id ||
      continuity.packet_currentness !== "fresh" ||
      continuity.latest_compiled_packet?.packet_id !== admitted.packet.packet_id ||
      continuity.latest_compiled_packet.packet_fingerprint !==
        admitted.packet.integrity.fingerprint ||
      run.metadata.packet_id !== admitted.packet.packet_id ||
      run.metadata.packet_fingerprint !== admitted.packet.integrity.fingerprint ||
      run.metadata.root_fingerprint !== admitted.root_scope.root_fingerprint ||
      rootFingerprint !== admitted.root_scope.root_fingerprint
    ) {
      refuseV01("live_host_scope_changed_during_control", 409);
    }
  }

  private transitionRunV01(
    db: Database.Database,
    run: AutonomyRunRecord,
    input: {
      status: AutonomyRunRecord["status"];
      event_type: Parameters<typeof buildAutonomyRunEventRecord>[0]["event_type"];
      message: string;
      observed_at: string;
      metadata: Record<string, unknown>;
    },
  ): void {
    const revision = numberMetadataV01(run.metadata.control_revision) + 1;
    const ownsTransaction = !db.inTransaction;
    if (ownsTransaction) db.exec("BEGIN IMMEDIATE");
    try {
      updateAutonomyRunLedgerFields(
        run.run_id,
        {
          status: input.status,
          updated_at: input.observed_at,
          metadata: {
            ...run.metadata,
            ...input.metadata,
            control_revision: revision,
          },
        },
        { db },
      );
      appendAutonomyRunLedgerEvent(
        buildAutonomyRunEventRecord({
          run_id: run.run_id,
          event_type: input.event_type,
          status: input.status,
          message: input.message,
          payload: { ...input.metadata, control_revision: revision },
          created_at: input.observed_at,
        }),
        { db },
      );
      if (ownsTransaction) db.exec("COMMIT");
    } catch (error) {
      if (ownsTransaction && db.inTransaction) db.exec("ROLLBACK");
      throw error;
    }
  }

  private pauseUnownedRun(
    config: VNextLocalOperatorPilotConfigV01,
    run: AutonomyRunRecord,
  ): void {
    const db = this.openDatabase(config);
    try {
      this.transitionRunV01(db, run, {
        status: "paused",
        event_type: "run_reconciliation_required",
        message:
          "No registered invocation controller owns this nonterminal run; explicit resume is required.",
        observed_at: this.now(),
        metadata: {
          reconciliation_required: true,
          terminal_receipt_persisted: false,
          public_reason: "live_host_controller_disconnected",
        },
      });
    } finally {
      db.close();
    }
  }
}

class LiveRunControllerV01 implements NativeHostLifecycleSinkV01 {
  readonly abortController = new AbortController();
  readonly admitted = deferredV01<void>();
  readonly owned = deferredV01<void>();
  readonly failedBeforeOwnership = deferredV01<Error>();
  readonly adapter: NativeHostAdapterV01;
  completion: Promise<void> = Promise.resolve();
  completionSettled = false;
  sessionAdmission: VNextLocalOperatorSessionMutationAdmissionV01 | null = null;
  request: NativeHostRequestV01 | null = null;
  private ownershipAccepted = false;
  private readonly pending = new Map<
    string,
    DeferredV01<NativeHostApprovalDecisionV01>
  >();

  constructor(
    private readonly input: {
      config: VNextLocalOperatorPilotConfigV01;
      mode: NativeHostRunModeV01;
      db: Database.Database;
      now: () => string;
      delegate: NativeHostAdapterV01;
    },
  ) {
    this.adapter = {
      adapter_version: input.delegate.adapter_version,
      capability_version: input.delegate.capability_version,
      execution_profile: input.delegate.execution_profile,
      provider_egress: input.delegate.provider_egress,
      invoke: (request, control) => {
        if (!this.request) this.request = request;
        else if (canonicalizeProtocolValueV01(this.request) !== canonicalizeProtocolValueV01(request)) {
          throw new LiveNativeHostRunServiceErrorV01(
            "live_host_invocation_binding_conflict",
            409,
          );
        }
        try {
          const invocation = input.delegate.invoke(request, control);
          this.ownershipAccepted = true;
          this.owned.resolve();
          return invocation;
        } catch (error) {
          const normalized = error instanceof Error ? error : new Error("live_host_failed");
          this.failedBeforeOwnership.resolve(normalized);
          throw error;
        }
      },
    };
  }

  get mode(): NativeHostRunModeV01 {
    return this.input.mode;
  }

  get runId(): string | null {
    return this.request?.run_id ?? null;
  }

  matchesStart(
    mode: NativeHostRunModeV01,
    automationContext: NativeHostAutomationContextV01 | null,
  ): boolean {
    return Boolean(
      this.request &&
        this.mode === mode &&
        canonicalizeProtocolValueV01(this.request.automation_context) ===
          canonicalizeProtocolValueV01(automationContext),
    );
  }

  admit(
    request: NativeHostRequestV01,
    sessionAdmission: VNextLocalOperatorSessionMutationAdmissionV01 | null,
  ): void {
    this.request = request;
    this.sessionAdmission = sessionAdmission;
    this.admitted.resolve();
  }

  complete(_runId: string): void {
    // Durable finalization is performed by the shared PR A orchestrator.
  }

  fail(error: unknown): void {
    const normalized = error instanceof Error ? error : new Error("live_host_failed");
    if (!this.ownershipAccepted) {
      this.failedBeforeOwnership.resolve(normalized);
      return;
    }
    try {
      if (!this.request) return;
      const run = readAutonomyRunLedgerRecord(this.request.run_id, {
        db: this.input.db,
      });
      if (!run || isTerminalRunnerStatus(run.status) || run.status === "paused") {
        return;
      }
      const reason =
        "code" in normalized && typeof normalized.code === "string"
          ? normalized.code
          : "live_host_orchestration_failed";
      const observedAt = this.input.now();
      const revision = numberMetadataV01(run.metadata.control_revision) + 1;
      this.input.db.exec("BEGIN IMMEDIATE");
      updateAutonomyRunLedgerFields(
        run.run_id,
        {
          status: "paused",
          updated_at: observedAt,
          stop_reason: "native_host_reconciliation_required",
          metadata: {
            ...run.metadata,
            control_revision: revision,
            reconciliation_required: true,
            terminal_receipt_persisted: false,
            public_reason: reason,
          },
        },
        { db: this.input.db },
      );
      appendAutonomyRunLedgerEvent(
        buildAutonomyRunEventRecord({
          run_id: run.run_id,
          event_type: "run_reconciliation_required",
          status: "paused",
          message:
            "Live native-host orchestration stopped before terminal receipt admission.",
          payload: { reason, terminal_receipt_persisted: false },
          created_at: observedAt,
        }),
        { db: this.input.db },
      );
      this.input.db.exec("COMMIT");
    } catch {
      if (this.input.db.inTransaction) {
        try {
          this.input.db.exec("ROLLBACK");
        } catch {
          // The controller must never surface a second failure while handling
          // the original adapter/orchestration rejection. Once it is removed,
          // the next read projects any still-nonterminal run as reconciliation
          // required through the normal unowned-run path.
        }
      }
    }
  }

  cancel(): void {
    if (this.abortController.signal.aborted) return;
    if (this.request) {
      const run = readAutonomyRunLedgerRecord(this.request.run_id, {
        db: this.input.db,
      });
      if (
        run &&
        !isTerminalRunnerStatus(run.status) &&
        run.status !== "cancelling" &&
        run.status !== "paused"
      ) {
        const observedAt = this.input.now();
        const revision = numberMetadataV01(run.metadata.control_revision) + 1;
        this.input.db.exec("BEGIN IMMEDIATE");
        try {
          updateAutonomyRunLedgerFields(
            run.run_id,
            {
              status: "cancelling",
              updated_at: observedAt,
              metadata: {
                ...run.metadata,
                control_revision: revision,
                cancellation_requested: true,
              },
            },
            { db: this.input.db },
          );
          appendAutonomyRunLedgerEvent(
            buildAutonomyRunEventRecord({
              run_id: run.run_id,
              event_type: "run_cancelling",
              status: "cancelling",
              message:
                "The registered runtime owner requested cancellation before interrupting the native host.",
              payload: { control_revision: revision },
              created_at: observedAt,
            }),
            { db: this.input.db },
          );
          this.input.db.exec("COMMIT");
        } catch (error) {
          if (this.input.db.inTransaction) this.input.db.exec("ROLLBACK");
          throw error;
        }
      }
    }
    // Dispatch the shared stop boundary first so approval abandonment cannot
    // race ahead of the exact turn/interrupt request.
    this.abortController.abort("live_host_cancelled");
    for (const [approvalId, pending] of this.pending) {
      const approval = pendingApprovalFromMetadataV01(
        readAutonomyRunLedgerRecord(this.request?.run_id ?? "", {
          db: this.input.db,
        })?.metadata.pending_approval,
      );
      pending.resolve({
        approval_id: approvalId,
        idempotency_fingerprint:
          approval?.idempotency_fingerprint ?? `sha256:${"0".repeat(64)}`,
        decision: "cancel_run",
        decision_source: "run_cancellation",
        decided_at: this.input.now(),
        control_revision: approval?.control_revision ?? 0,
      });
    }
  }

  releaseInvocationMaterial(): void {
    this.pending.clear();
    this.request = null;
    this.sessionAdmission = null;
  }

  resolveApproval(
    approvalId: string,
    decision: "approve_once" | "decline",
    _sessionAdmission: VNextLocalOperatorSessionMutationAdmissionV01,
  ): void {
    const pending = this.pending.get(approvalId);
    if (!pending || !this.request) return;
    const run = readAutonomyRunLedgerRecord(this.request.run_id, {
      db: this.input.db,
    });
    const persisted = approvalDecisionsFromMetadataV01(
      run?.metadata.approval_decisions,
    ).find((candidate) => candidate.approval_id === approvalId);
    if (!persisted || persisted.decision !== decision) return;
    pending.resolve(persisted);
  }

  async report_event(event: NativeHostLifecycleEventV01): Promise<void> {
    const request = this.requireRequestV01(event.run_id);
    validateLifecycleEventV01(request, event);
    const db = this.input.db;
    db.exec("BEGIN IMMEDIATE");
    try {
      const run = requireBoundRunV01(db, request);
      const hostBindingConflict = hostRefBindingConflictV01(
        run,
        event.host_refs,
      );
      if (hostBindingConflict) {
        pauseRunForReconciliationInsideTransactionV01(db, run, {
          observed_at: event.observed_at,
          reason: hostBindingConflict,
          message: "A cross-thread or cross-turn native-host event was refused.",
          payload: { event_id: event.event_id },
        });
        db.exec("COMMIT");
        refuseV01(hostBindingConflict, 409);
      }
      const eventFingerprint = createProtocolSha256V01(
        canonicalizeProtocolValueV01({
          event_id: event.event_id,
          run_id: event.run_id,
          event_kind: event.event_kind,
          state: event.state,
          coverage: event.coverage,
          host_refs: event.host_refs,
          bounded_metadata: event.bounded_metadata,
        }),
      );
      const fingerprints = eventFingerprintsFromMetadataV01(
        run.metadata.host_event_fingerprints,
      );
      const existing = fingerprints[event.event_id];
      if (existing === eventFingerprint) {
        db.exec("COMMIT");
        return;
      }
      if (existing && existing !== eventFingerprint) {
        pauseRunForReconciliationInsideTransactionV01(db, run, {
          observed_at: event.observed_at,
          reason: "live_host_event_conflict",
          message: "A conflicting duplicate native-host event was refused.",
          payload: { event_id: event.event_id },
        });
        db.exec("COMMIT");
        refuseV01("live_host_event_conflict", 409);
      }
      if (event.event_kind === "approval_resolved") {
        const pending = pendingApprovalFromMetadataV01(
          run.metadata.pending_approval,
        );
        const approvalId = stringMetadataV01(
          event.bounded_metadata.approval_id,
        );
        const approvalFingerprint = stringMetadataV01(
          event.bounded_metadata.approval_fingerprint,
        );
        const cancellationDecision = approvalDecisionsFromMetadataV01(
          run.metadata.approval_decisions,
        ).find(
          (decision) =>
            decision.approval_id === approvalId &&
            decision.idempotency_fingerprint === approvalFingerprint &&
            decision.decision === "cancel_run" &&
            decision.decision_source === "run_cancellation",
        );
        const cancellationResolutionBound =
          run.status === "cancelling" && Boolean(cancellationDecision);
        if (
          (!pending && !cancellationResolutionBound) ||
          (pending &&
            (pending.approval_id !== approvalId ||
              pending.idempotency_fingerprint !== approvalFingerprint)) ||
          (!cancellationResolutionBound &&
            run.status !== "cancelling" &&
            pending?.decision_submitted !== true)
        ) {
          pauseRunForReconciliationInsideTransactionV01(db, run, {
            observed_at: event.observed_at,
            reason: "live_host_approval_resolution_mismatch",
            message:
              "A native-host approval resolution did not bind the exact pending gate.",
            payload: { event_id: event.event_id },
          });
          db.exec("COMMIT");
          refuseV01("live_host_approval_resolution_mismatch", 409);
        }
      }
      const nextFingerprints = {
        ...fingerprints,
        [event.event_id]: eventFingerprint,
      };
      const fingerprintEntries = Object.entries(nextFingerprints).slice(
        -MAX_EVENT_FINGERPRINTS,
      );
      const nextStatus = lifecycleStatusV01(run, event);
      const revision =
        numberMetadataV01(run.metadata.control_revision) +
        (nextStatus === run.status ? 0 : 1);
      const hostBindings = hostBindingsFromRefsV01(event.host_refs);
      const capabilityMetadata =
        event.event_kind === "capability_confirmed"
          ? {
              host_cli_version: boundedVersionMetadataV01(
                event.bounded_metadata.cli_version,
              ),
            }
          : {};
      updateAutonomyRunLedgerFields(
        run.run_id,
        {
          status: nextStatus,
          updated_at: event.observed_at,
          stop_reason:
            nextStatus === "paused" ? "native_host_reconciliation_required" : null,
          metadata: {
            ...run.metadata,
            ...hostBindings,
            ...capabilityMetadata,
            control_revision: revision,
            host_event_fingerprints: Object.fromEntries(fingerprintEntries),
            reconciliation_required: nextStatus === "paused",
            public_reason:
              nextStatus === "paused"
                ? stringMetadataV01(event.bounded_metadata.reason) ??
                  "live_host_reconciliation_required"
                : null,
            pending_approval:
              event.event_kind === "approval_resolved"
                ? null
                : run.metadata.pending_approval,
          },
        },
        { db },
      );
      const step = run.steps[0];
      if (step) {
        updateAutonomyRunStepLedgerFields(
          step.step_id,
          {
            status: "running",
            updated_at: event.observed_at,
            output: {
              ...step.output,
              latest_lifecycle_event: event.event_kind,
              raw_protocol_persisted: false,
            },
          },
          { db },
        );
      }
      appendAutonomyRunLedgerEvent(
        buildAutonomyRunEventRecord({
          run_id: run.run_id,
          event_type:
            nextStatus === "paused"
              ? "run_reconciliation_required"
              : "host_event_observed",
          status: nextStatus,
          message: "A bounded native-host lifecycle event was admitted.",
          payload: {
            event_id: event.event_id,
            event_kind: event.event_kind,
            coverage: event.coverage,
            host_refs: event.host_refs,
            control_revision: revision,
            raw_protocol_persisted: false,
          },
          created_at: event.observed_at,
        }),
        { db },
      );
      db.exec("COMMIT");
    } catch (error) {
      if (db.inTransaction) db.exec("ROLLBACK");
      throw error;
    }
  }

  async request_approval(
    approval: NativeHostApprovalRequestV01,
  ): Promise<NativeHostApprovalDecisionV01> {
    const request = this.requireRequestV01(approval.run_id);
    validateApprovalV01(request, approval);
    const db = this.input.db;
    const existingDeferred = this.pending.get(approval.approval_id);
    const deferred = existingDeferred ??
      deferredV01<NativeHostApprovalDecisionV01>();
    // Register the waiter before the durable pending projection is committed.
    // An operator decision can otherwise land in the narrow interval between
    // the commit and waiter registration, leaving the exact host request stuck.
    this.pending.set(approval.approval_id, deferred);
    let pending: PendingApprovalProjectionV01;
    let automatic = false;
    try {
      db.exec("BEGIN IMMEDIATE");
      const run = requireBoundRunV01(db, request);
      assertApprovalHostBindingV01(run, approval);
      const approvalRequests = appendNativeHostApprovalRequestResidueV01(
        run.metadata.approval_requests,
        approval,
      );
      const priorDecision = approvalDecisionsFromMetadataV01(
        run.metadata.approval_decisions,
      ).find((candidate) => candidate.approval_id === approval.approval_id);
      if (priorDecision) {
        if (
          priorDecision.idempotency_fingerprint !==
          approval.idempotency_fingerprint
        ) {
          refuseV01("live_host_approval_decision_conflict", 409);
        }
        db.exec("COMMIT");
        if (!existingDeferred) this.pending.delete(approval.approval_id);
        return priorDecision;
      }
      if (run.status === "cancelling") {
        const decision: NativeHostApprovalDecisionV01 = {
          approval_id: approval.approval_id,
          idempotency_fingerprint: approval.idempotency_fingerprint,
          decision: "cancel_run",
          decision_source: "run_cancellation",
          decided_at: this.input.now(),
          control_revision: numberMetadataV01(run.metadata.control_revision),
        };
        updateAutonomyRunLedgerFields(
          run.run_id,
          {
            updated_at: decision.decided_at,
            metadata: {
              ...run.metadata,
              approval_decisions: appendNativeHostApprovalDecisionResidueV01(
                run.metadata.approval_decisions,
                decision,
              ),
              approval_requests: approvalRequests,
            },
          },
          { db },
        );
        appendAutonomyRunLedgerEvent(
          buildAutonomyRunEventRecord({
            run_id: run.run_id,
            event_type: "approval_decided",
            status: "cancelling",
            message:
              "A bounded native-host approval request was abandoned by the active cancellation.",
            payload: {
              approval_id: decision.approval_id,
              decision: decision.decision,
              decision_source: decision.decision_source,
              control_revision: decision.control_revision,
              semantic_approval_created: false,
            },
            created_at: decision.decided_at,
          }),
          { db },
        );
        db.exec("COMMIT");
        if (!existingDeferred) this.pending.delete(approval.approval_id);
        return decision;
      }
      if (!["running", "waiting_for_approval"].includes(run.status)) {
        refuseV01("live_host_approval_state_invalid", 409);
      }
      const existing = pendingApprovalFromMetadataV01(
        run.metadata.pending_approval,
      );
      if (existing) {
        if (
          existing.approval_id !== approval.approval_id ||
          existing.idempotency_fingerprint !== approval.idempotency_fingerprint
        ) {
          refuseV01("live_host_approval_conflict", 409);
        }
        pending = existing;
        automatic = exactPolicyGrantCoversV01(db, request, approval);
        db.exec("COMMIT");
      } else {
        const revision = numberMetadataV01(run.metadata.control_revision) + 1;
        pending = {
          ...approval,
          control_revision: revision,
          decision_submitted: false,
        };
        automatic = exactPolicyGrantCoversV01(db, request, approval);
        updateAutonomyRunLedgerFields(
          run.run_id,
          {
            status: "waiting_for_approval",
            updated_at: approval.issued_at,
            metadata: {
              ...run.metadata,
              pending_approval: pending,
              approval_requests: approvalRequests,
              control_revision: revision,
              reconciliation_required: false,
            },
          },
          { db },
        );
        appendAutonomyRunLedgerEvent(
          buildAutonomyRunEventRecord({
            run_id: run.run_id,
            event_type: "approval_requested",
            status: "waiting_for_approval",
            message: "A bounded native-host approval request is waiting.",
            payload: {
              approval_id: pending.approval_id,
              operation_class: pending.operation_class,
              control_revision: revision,
              automatic_grant_covered: automatic,
              semantic_approval_created: false,
            },
            created_at: approval.issued_at,
          }),
          { db },
        );
        db.exec("COMMIT");
      }
    } catch (error) {
      if (db.inTransaction) db.exec("ROLLBACK");
      if (!existingDeferred) this.pending.delete(approval.approval_id);
      throw error;
    }

    const boundedPolicyDenial =
      request.mode === "policy_triggered" &&
      request.automation_context?.bounded_cycle != null &&
      !automatic;
    if (automatic || boundedPolicyDenial) {
      const run = requireBoundRunV01(db, request);
      db.exec("BEGIN IMMEDIATE");
      try {
        const decision = persistApprovalDecisionInsideTransactionV01(
          db,
          this.input.config,
          run,
          {
            approval_ref: pending.approval_id,
            expected_revision: pending.control_revision,
            decision: boundedPolicyDenial ? "decline" : "approve_once",
            decision_source: "bounded_capability_grant",
            decided_at: this.input.now(),
          },
        );
        db.exec("COMMIT");
        if (!existingDeferred) this.pending.delete(approval.approval_id);
        return decision;
      } catch (error) {
        if (db.inTransaction) db.exec("ROLLBACK");
        if (!existingDeferred) this.pending.delete(approval.approval_id);
        throw error;
      }
    }
    return deferred.promise;
  }

  private requireRequestV01(runId: string): NativeHostRequestV01 {
    if (!this.request || this.request.run_id !== runId) {
      refuseV01("live_host_request_binding_mismatch", 409);
    }
    return this.request;
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __augnesLiveNativeHostRunServiceV01:
    | LiveNativeHostRunServiceV01
    | undefined;
}

export function getLiveNativeHostRunServiceV01(): LiveNativeHostRunServiceV01 {
  globalThis.__augnesLiveNativeHostRunServiceV01 ??=
    new LiveNativeHostRunServiceV01();
  return globalThis.__augnesLiveNativeHostRunServiceV01;
}

function persistApprovalDecisionInsideTransactionV01(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
  run: AutonomyRunRecord,
  input: {
    approval_ref: string;
    expected_revision: number;
    decision: NativeHostApprovalDecisionKindV01;
    decision_source: NativeHostApprovalDecisionV01["decision_source"];
    decided_at: string;
  },
): NativeHostApprovalDecisionV01 {
  if (!db.inTransaction) refuseV01("live_host_transaction_required", 500);
  const current = readAutonomyRunLedgerRecord(run.run_id, { db });
  if (
    !current ||
    current.scope !== config.project_id ||
    current.metadata.workspace_id !== config.workspace_id ||
    current.metadata.project_id !== config.project_id ||
    current.metadata.lifecycle_mode !== "managed_live"
  ) {
    refuseV01("live_host_run_scope_mismatch", 409);
  }
  const pending = pendingApprovalFromMetadataV01(current.metadata.pending_approval);
  const decisions = approvalDecisionsFromMetadataV01(
    current.metadata.approval_decisions,
  );
  const existing = decisions.find(
    (decision) => decision.approval_id === input.approval_ref,
  );
  if (existing) {
    if (
      existing.decision === input.decision &&
      existing.decision_source === input.decision_source
    ) {
      return existing;
    }
    refuseV01("live_host_approval_decision_conflict", 409);
  }
  if (
    current.status !== "waiting_for_approval" ||
    current.metadata.reconciliation_required === true
  ) {
    refuseV01("live_host_approval_state_invalid", 409);
  }
  if (!pending || pending.approval_id !== input.approval_ref) {
    refuseV01("live_host_approval_missing", 409);
  }
  if (
    pending.control_revision !== input.expected_revision ||
    numberMetadataV01(current.metadata.control_revision) !== input.expected_revision
  ) {
    refuseV01("live_host_control_revision_conflict", 409);
  }
  if (
    pending.expires_at &&
    Date.parse(pending.expires_at) <= Date.parse(input.decided_at)
  ) {
    refuseV01("live_host_approval_expired", 409);
  }
  if (!pending.available_decisions.includes(input.decision)) {
    refuseV01("live_host_approval_decision_unsupported", 409);
  }
  const nextRevision = input.expected_revision + 1;
  const decision: NativeHostApprovalDecisionV01 = {
    approval_id: pending.approval_id,
    idempotency_fingerprint: pending.idempotency_fingerprint,
    decision: input.decision,
    decision_source: input.decision_source,
    decided_at: input.decided_at,
    control_revision: nextRevision,
  };
  updateAutonomyRunLedgerFields(
    current.run_id,
    {
      updated_at: input.decided_at,
      metadata: {
        ...current.metadata,
        control_revision: nextRevision,
        pending_approval: { ...pending, decision_submitted: true },
        approval_decisions: appendNativeHostApprovalDecisionResidueV01(
          decisions,
          decision,
        ),
      },
    },
    { db },
  );
  appendAutonomyRunLedgerEvent(
    buildAutonomyRunEventRecord({
      run_id: current.run_id,
      event_type: "approval_decided",
      status: "waiting_for_approval",
      message: "A bounded native-host approval decision was recorded.",
      payload: {
        approval_id: decision.approval_id,
        decision: decision.decision,
        decision_source: decision.decision_source,
        control_revision: nextRevision,
        semantic_approval_created: false,
      },
      created_at: input.decided_at,
    }),
    { db },
  );
  return decision;
}

function requireBoundRunV01(
  db: Database.Database,
  request: NativeHostRequestV01,
): AutonomyRunRecord {
  const run = readAutonomyRunLedgerRecord(request.run_id, { db });
  if (
    !run ||
    run.metadata.workspace_id !== request.workspace_id ||
    run.metadata.project_id !== request.project_id ||
    run.metadata.packet_id !== request.packet.packet_id ||
    run.metadata.packet_fingerprint !== request.packet.integrity.fingerprint ||
    run.metadata.root_fingerprint !== request.root_scope.root_fingerprint
  ) {
    refuseV01("live_host_run_binding_mismatch", 409);
  }
  return run;
}

function validateLifecycleEventV01(
  request: NativeHostRequestV01,
  event: NativeHostLifecycleEventV01,
): void {
  if (
    event.run_id !== request.run_id ||
    !event.event_id.startsWith("native-host-event:") ||
    parseStrictIsoTimestampV01(event.observed_at) === null ||
    event.host_refs.length > 16
  ) {
    refuseV01("live_host_event_invalid", 422);
  }
  const refTypes = new Set<string>();
  for (const ref of event.host_refs) {
    validateHostRefV01(ref);
    if (refTypes.has(ref.ref_type)) {
      refuseV01("live_host_event_ref_duplicate", 422);
    }
    refTypes.add(ref.ref_type);
  }
  const serialized = canonicalizeProtocolValueV01(event.bounded_metadata);
  if (serialized.length > 4096 || containsForbiddenMaterialV01(event.bounded_metadata)) {
    refuseV01("live_host_event_material_forbidden", 422);
  }
  assertPublicTextMaterialV01(event.bounded_metadata, "live_host_event_material_forbidden");
}

function lifecycleStatusV01(
  run: AutonomyRunRecord,
  event: NativeHostLifecycleEventV01,
): AutonomyRunRecord["status"] {
  if (isTerminalRunnerStatus(run.status)) {
    refuseV01("live_host_terminal_event_conflict", 409);
  }
  if (event.state === "paused") return "paused";
  if (event.state === "cancelling") return "cancelling";
  if (event.state === "waiting_for_approval") return "waiting_for_approval";
  if (event.state === "running") {
    if (run.status === "cancelling") {
      // Approval resolution during cancellation abandons the gate; it never
      // revives the exact turn to running.
      return "cancelling";
    }
    if (!["starting", "running", "waiting_for_approval"].includes(run.status)) {
      refuseV01("live_host_event_order_invalid", 409);
    }
    if (
      run.status === "waiting_for_approval" &&
      event.event_kind !== "approval_resolved"
    ) {
      // A late/duplicate turn-start observation cannot erase a pending gate.
      return "waiting_for_approval";
    }
    return "running";
  }
  if (event.state === "starting") {
    if (!["queued", "starting"].includes(run.status)) {
      refuseV01("live_host_event_order_invalid", 409);
    }
    return "starting";
  }
  return event.state;
}

function validateApprovalV01(
  request: NativeHostRequestV01,
  approval: NativeHostApprovalRequestV01,
): void {
  const issuedAt = parseStrictIsoTimestampV01(approval.issued_at);
  const expiresAt = approval.expires_at
    ? parseStrictIsoTimestampV01(approval.expires_at)
    : null;
  const decisions = new Set(approval.available_decisions);
  if (
    approval.approval_version !== NATIVE_HOST_APPROVAL_VERSION_V01 ||
    !approval.approval_id.startsWith("native-host-approval:") ||
    approval.approval_id.length > 512 ||
    approval.workspace_id !== request.workspace_id ||
    approval.project_id !== request.project_id ||
    approval.run_id !== request.run_id ||
    approval.packet_id !== request.packet.packet_id ||
    approval.packet_fingerprint !== request.packet.integrity.fingerprint ||
    !/^sha256:[a-f0-9]{64}$/u.test(approval.idempotency_fingerprint) ||
    approval.repository_relative_paths.length > 128 ||
    approval.network_resources.length > 32 ||
    ![
      "command_execution",
      "file_change",
      "filesystem_permission",
      "network_permission",
    ].includes(approval.operation_class) ||
    issuedAt === null ||
    (approval.expires_at !== null &&
      (expiresAt === null || expiresAt <= issuedAt)) ||
    decisions.size !== approval.available_decisions.length ||
    decisions.size === 0 ||
    [...decisions].some(
      (decision) =>
        !["approve_once", "decline", "cancel_run"].includes(decision),
    ) ||
    (approval.command_fingerprint !== null &&
      !/^sha256:[a-f0-9]{64}$/u.test(approval.command_fingerprint))
  ) {
    refuseV01("live_host_approval_binding_invalid", 422);
  }
  for (const value of approval.repository_relative_paths) {
    if (canonicalizeRepositoryRelativePathV01(value) !== value) {
      refuseV01("live_host_approval_path_invalid", 422);
    }
  }
  if (
    approval.network_resources.some(
      (resource) => !isCanonicalNetworkResourceV01(resource),
    )
  ) {
    refuseV01("live_host_approval_network_scope_invalid", 422);
  }
  for (const ref of [
    approval.host_thread_ref,
    approval.host_turn_ref,
    approval.host_item_ref,
    approval.host_request_ref,
  ]) {
    validateHostRefV01(ref);
  }
  if (
    approval.host_thread_ref.ref_type !== "host_thread" ||
    approval.host_turn_ref.ref_type !== "host_turn" ||
    approval.host_item_ref.ref_type !== "host_item" ||
    approval.host_request_ref.ref_type !== "host_approval_request"
  ) {
    refuseV01("live_host_approval_ref_type_invalid", 422);
  }
  if (
    containsForbiddenMaterialV01(approval) ||
    canonicalizeProtocolValueV01(approval).length > 32 * 1024
  ) {
    refuseV01("live_host_approval_material_forbidden", 422);
  }
  assertPublicTextMaterialV01(
    {
      command_summary: approval.command_summary,
      resource_summary: approval.resource_summary,
      public_reason: approval.public_reason,
      public_risk_summary: approval.public_risk_summary,
      budget_impact: approval.budget_impact,
    },
    "live_host_approval_material_forbidden",
  );
}

function validateHostRefV01(ref: ExternalRefV01): void {
  if (
    validateExternalRefV01(ref).status !== "valid" ||
    ref.ref_version !== "external_ref.v0.1" ||
    ref.provider !== "codex" ||
    ref.host !== "app_server" ||
    typeof ref.external_id !== "string" ||
    ref.external_id.length === 0 ||
    ref.external_id.length > 512
  ) {
    refuseV01("live_host_ref_invalid", 422);
  }
}

function isCanonicalNetworkResourceV01(value: string): boolean {
  if (value.length === 0 || value.length > 512) return false;
  try {
    const parsed = new URL(value);
    return (
      ["http:", "https:"].includes(parsed.protocol) &&
      parsed.username === "" &&
      parsed.password === "" &&
      parsed.pathname === "/" &&
      parsed.search === "" &&
      parsed.hash === "" &&
      value === `${parsed.protocol}//${parsed.host.toLowerCase()}`
    );
  } catch {
    return false;
  }
}

function assertPublicTextMaterialV01(value: unknown, code: string): void {
  try {
    walkV01(value, (_key, candidate) => {
      if (typeof candidate === "string") {
        assertNativeHostPublicTextV01(candidate);
      }
    });
  } catch {
    refuseV01(code, 422);
  }
}

function hostBindingsFromRefsV01(
  refs: ExternalRefV01[],
): Record<string, ExternalRefV01> {
  const result: Record<string, ExternalRefV01> = {};
  for (const ref of refs) {
    if (ref.ref_type === "host_connection") result.host_connection_ref = ref;
    if (ref.ref_type === "host_thread") result.host_thread_ref = ref;
    if (ref.ref_type === "host_session") result.host_session_ref = ref;
    if (ref.ref_type === "host_turn") result.host_turn_ref = ref;
  }
  return result;
}

function hostRefBindingConflictV01(
  run: AutonomyRunRecord,
  refs: ExternalRefV01[],
): string | null {
  const bindings = [
    ["host_thread", "host_thread_ref", "live_host_thread_event_mismatch"],
    ["host_session", "host_session_ref", "live_host_session_event_mismatch"],
    ["host_turn", "host_turn_ref", "live_host_turn_event_mismatch"],
  ] as const;
  for (const [refType, metadataKey, reason] of bindings) {
    const incoming = refs.find((ref) => ref.ref_type === refType);
    const current = externalRefMetadataV01(run.metadata[metadataKey]);
    if (incoming && current && incoming.external_id !== current.external_id) {
      return reason;
    }
  }
  return null;
}

function assertApprovalHostBindingV01(
  run: AutonomyRunRecord,
  approval: NativeHostApprovalRequestV01,
): void {
  const thread = externalRefMetadataV01(run.metadata.host_thread_ref);
  const turn = externalRefMetadataV01(run.metadata.host_turn_ref);
  if (
    !thread ||
    !turn ||
    thread.external_id !== approval.host_thread_ref.external_id ||
    turn.external_id !== approval.host_turn_ref.external_id
  ) {
    refuseV01("live_host_approval_host_binding_mismatch", 409);
  }
}

function pauseRunForReconciliationInsideTransactionV01(
  db: Database.Database,
  run: AutonomyRunRecord,
  input: {
    observed_at: string;
    reason: string;
    message: string;
    payload: Record<string, unknown>;
  },
): void {
  if (!db.inTransaction) refuseV01("live_host_transaction_required", 500);
  const revision = numberMetadataV01(run.metadata.control_revision) + 1;
  updateAutonomyRunLedgerFields(
    run.run_id,
    {
      status: "paused",
      updated_at: input.observed_at,
      stop_reason: "native_host_reconciliation_required",
      metadata: {
        ...run.metadata,
        control_revision: revision,
        reconciliation_required: true,
        terminal_receipt_persisted: false,
        public_reason: input.reason,
      },
    },
    { db },
  );
  appendAutonomyRunLedgerEvent(
    buildAutonomyRunEventRecord({
      run_id: run.run_id,
      event_type: "run_reconciliation_required",
      status: "paused",
      message: input.message,
      payload: { ...input.payload, reason: input.reason, control_revision: revision },
      created_at: input.observed_at,
    }),
    { db },
  );
}

function resumeBindingFromRunV01(run: AutonomyRunRecord): NativeHostResumeBindingV01 {
  const thread = externalRefMetadataV01(run.metadata.host_thread_ref);
  const turn = externalRefMetadataV01(run.metadata.host_turn_ref);
  if (!thread || !turn) refuseV01("live_host_resume_binding_missing", 409);
  return {
    host_connection_ref: externalRefMetadataV01(run.metadata.host_connection_ref),
    host_thread_ref: thread,
    host_session_ref: externalRefMetadataV01(run.metadata.host_session_ref),
    host_turn_ref: turn,
    control_revision: numberMetadataV01(run.metadata.control_revision),
  };
}

function automationContextFromRunV01(
  run: AutonomyRunRecord,
): NativeHostAutomationContextV01 {
  const exact = nativeHostAutomationContextMetadataV01(
    run.metadata.automation_context,
  );
  if (exact) return exact;
  const policyRef = genericExternalRefMetadataV01(run.metadata.policy_ref);
  const grantRef = genericExternalRefMetadataV01(
    run.metadata.capability_grant_ref,
  );
  if (!policyRef || !grantRef) {
    refuseV01("live_host_automation_context_missing", 409);
  }
  const storedRevision = run.metadata.automation_control_revision;
  return {
    policy_ref: policyRef,
    capability_grant_ref: grantRef,
    control_revision:
      storedRevision === null
        ? null
        : Number.isSafeInteger(storedRevision)
          ? Number(storedRevision)
          : null,
    automatic_retry_allowed: false,
    scheduler_started: false,
  };
}

function nativeHostAutomationContextMetadataV01(
  value: unknown,
): NativeHostAutomationContextV01 | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as Partial<NativeHostAutomationContextV01>;
  if (
    candidate.automatic_retry_allowed !== false ||
    candidate.scheduler_started !== false ||
    !genericExternalRefMetadataV01(candidate.policy_ref) ||
    !genericExternalRefMetadataV01(candidate.capability_grant_ref) ||
    !(
      candidate.control_revision === null ||
      (Number.isSafeInteger(candidate.control_revision) &&
        Number(candidate.control_revision) >= 0)
    )
  ) {
    return null;
  }
  if (
    candidate.bounded_cycle &&
    (candidate.bounded_cycle.profile !==
      "bounded_autohunt_review_needed.v0.1" ||
      candidate.bounded_cycle.attempt !== 1 ||
      typeof candidate.bounded_cycle.cycle_id !== "string" ||
      candidate.bounded_cycle.grant?.grant_version !==
        "bounded_automation_capability_grant.v0.1" ||
      !validateBoundedAutomationCapabilityGrantV01(
        candidate.bounded_cycle.grant,
      ) ||
      !candidate.bounded_cycle.cycle_id.startsWith("bounded-cycle:") ||
      candidate.capability_grant_ref?.external_id !==
        candidate.bounded_cycle.grant.grant_id ||
      candidate.capability_grant_ref.source_ref !==
        candidate.bounded_cycle.grant.grant_fingerprint)
  ) {
    return null;
  }
  return candidate as NativeHostAutomationContextV01;
}

function automationContextMatchesRunV01(
  run: AutonomyRunRecord,
  mode: NativeHostRunModeV01,
  automationContext: NativeHostAutomationContextV01 | null,
): boolean {
  if (mode === "interactive") return automationContext === null;
  if (!automationContext) return false;
  try {
    return (
      canonicalizeProtocolValueV01(automationContextFromRunV01(run)) ===
      canonicalizeProtocolValueV01(automationContext)
    );
  } catch {
    return false;
  }
}

function startMaterialMatchesRunV01(
  run: AutonomyRunRecord,
  mode: NativeHostRunModeV01,
  automationContext: NativeHostAutomationContextV01 | null,
  adapter: NativeHostAdapterV01,
): boolean {
  return (
    (run.metadata.invocation_origin === "policy_triggered"
      ? "policy_triggered"
      : "interactive") === mode &&
    automationContextMatchesRunV01(run, mode, automationContext) &&
    run.metadata.adapter_version === adapter.adapter_version &&
    run.metadata.capability_version === adapter.capability_version
  );
}

function exactPolicyGrantCoversV01(
  db: Database.Database,
  request: NativeHostRequestV01,
  approval: NativeHostApprovalRequestV01,
): boolean {
  if (request.mode !== "policy_triggered" || !request.automation_context) return false;
  const grant = request.packet_capability_grant;
  if (!grant || grant.coverage !== "enforced") return false;
  const automationGrant = request.automation_context.capability_grant_ref;
  const grantIdentityMatches =
    grant.grant_external_ref?.external_id === automationGrant.external_id ||
    grant.grant_ref === automationGrant.external_id;
  if (!grantIdentityMatches) return false;
  const boundedGrant = request.automation_context.bounded_cycle?.grant;
  if (boundedGrant) {
    const persisted = readBoundedAutomationCapabilityGrantV01(db, {
      workspace_id: request.workspace_id,
      project_id: request.project_id,
      grant_id: boundedGrant.grant_id,
      grant_fingerprint: boundedGrant.grant_fingerprint,
    });
    if (
      canonicalizeProtocolValueV01(persisted) !==
        canonicalizeProtocolValueV01(boundedGrant) ||
      request.execution_grant_ref?.external_id !== boundedGrant.grant_id ||
      request.execution_grant_ref.source_ref !== boundedGrant.grant_fingerprint ||
      grant.grant_external_ref?.external_id !== boundedGrant.grant_id ||
      grant.grant_external_ref.source_ref !== boundedGrant.grant_fingerprint ||
      boundedGrant.host_execution_profile !== "deterministic_zero_model" ||
      boundedGrant.host_provider_egress !== "forbidden" ||
      boundedGrant.forbidden_capabilities.includes(
        `native_host_approval:${approval.operation_class}`,
      )
    ) {
      return false;
    }
    // The conservative v0.1 profile admits no approval-bearing native-host
    // operation. Generic command text cannot prove that external effects are
    // absent, and network permission is always denied.
    return false;
  }
  if (
    grant.expires_at &&
    Date.parse(grant.expires_at) <= Date.parse(approval.issued_at)
  ) {
    return false;
  }
  const capability = `native_host_approval:${approval.operation_class}`;
  if (
    !grant.allowed_capabilities.includes(capability) ||
    grant.forbidden_capabilities.includes(capability) ||
    !grant.resource_scope.includes(request.project_id)
  ) {
    return false;
  }
  const exactResources = [
    `project_root:${request.root_scope.root_fingerprint}`,
    ...approval.repository_relative_paths,
    ...approval.network_resources,
    ...(approval.command_fingerprint
      ? [`command:${approval.command_fingerprint}`]
      : approval.operation_class === "command_execution"
        ? ["command:unbound"]
        : []),
  ];
  return (
    approval.available_decisions.includes("approve_once") &&
    exactResources.every((resource) => grant.resource_scope.includes(resource))
  );
}

function projectionFromRunV01(run: AutonomyRunRecord): LiveNativeHostRunProjectionV01 {
  const pending = pendingApprovalFromMetadataV01(run.metadata.pending_approval);
  const reason = stringMetadataV01(run.metadata.public_reason) ?? run.stop_reason;
  const explicitlyUnavailable =
    run.status === "blocked" &&
    typeof run.metadata.host_outcome === "string" &&
    run.metadata.host_outcome === "unavailable";
  const capabilityConfirmed =
    typeof run.metadata.host_cli_version === "string";
  const unavailable =
    explicitlyUnavailable ||
    ((!capabilityConfirmed && run.status === "failed") ||
      (!capabilityConfirmed && run.status === "blocked"));
  return {
    service_version: LIVE_NATIVE_HOST_RUN_SERVICE_VERSION_V01,
    status: publicStatusV01(run.status),
    run_ref: run.run_id,
    mode:
      run.metadata.invocation_origin === "policy_triggered"
        ? "policy_triggered"
        : "interactive",
    control_revision: numberMetadataV01(run.metadata.control_revision),
    reconciliation_required: run.metadata.reconciliation_required === true,
    public_reason: reason,
    capability: {
      status: unavailable
        ? "unavailable"
        : run.status === "paused"
          ? "disconnected"
          : ["queued", "starting"].includes(run.status)
            ? "checking"
            : "available",
      adapter_version: stringMetadataV01(run.metadata.adapter_version),
      capability_version: stringMetadataV01(run.metadata.capability_version),
      cli_version: stringMetadataV01(run.metadata.host_cli_version),
      public_reason: unavailable ? reason ?? "codex_capability_unavailable" : null,
    },
    pending_approval: pending
      ? {
          approval_ref: pending.approval_id,
          operation_class: pending.operation_class,
          resource_summary: pending.resource_summary,
          public_reason: pending.public_reason,
          public_risk_summary: pending.public_risk_summary,
          command_summary: pending.command_summary,
          repository_relative_paths: pending.repository_relative_paths,
          network_resources: pending.network_resources,
          available_decisions: pending.available_decisions,
          expires_at: pending.expires_at,
          control_revision: pending.control_revision,
          decision_submitted: pending.decision_submitted,
        }
      : null,
    receipt:
      typeof run.metadata.run_receipt_id === "string" &&
      typeof run.metadata.run_receipt_fingerprint === "string"
        ? {
            receipt_ref: run.metadata.run_receipt_id,
            receipt_fingerprint: run.metadata.run_receipt_fingerprint,
            outcome: stringMetadataV01(run.metadata.host_outcome),
          }
        : null,
    packet_copy_actions: 0,
    handoff_paste_actions: 0,
    result_paste_actions: 0,
    internal_id_entry_actions: 0,
    semantic_authority_granted: false,
  };
}

function idleProjectionV01(): LiveNativeHostRunProjectionV01 {
  return {
    service_version: LIVE_NATIVE_HOST_RUN_SERVICE_VERSION_V01,
    status: "idle",
    run_ref: null,
    mode: null,
    control_revision: 0,
    reconciliation_required: false,
    public_reason: null,
    capability: {
      status: "not_checked",
      adapter_version: null,
      capability_version: null,
      cli_version: null,
      public_reason: null,
    },
    pending_approval: null,
    receipt: null,
    packet_copy_actions: 0,
    handoff_paste_actions: 0,
    result_paste_actions: 0,
    internal_id_entry_actions: 0,
    semantic_authority_granted: false,
  };
}

function publicStatusV01(
  status: AutonomyRunRecord["status"],
): LiveNativeHostRunProjectionV01["status"] {
  if (
    [
      "queued",
      "starting",
      "running",
      "waiting_for_approval",
      "cancelling",
      "paused",
      "blocked",
      "completed",
      "failed",
      "cancelled",
      "timed_out",
    ].includes(status)
  ) {
    return status as LiveNativeHostRunProjectionV01["status"];
  }
  return status === "needs_review" ? "completed" : "failed";
}

function pendingApprovalFromMetadataV01(
  value: unknown,
): PendingApprovalProjectionV01 | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as PendingApprovalProjectionV01;
  return (
    candidate.approval_version === "native_host_approval.v0.1" &&
    typeof candidate.approval_id === "string" &&
    typeof candidate.control_revision === "number" &&
    Array.isArray(candidate.available_decisions)
  )
    ? candidate
    : null;
}

function approvalDecisionsFromMetadataV01(
  value: unknown,
): NativeHostApprovalDecisionV01[] {
  return Array.isArray(value)
    ? value.filter(
        (entry): entry is NativeHostApprovalDecisionV01 =>
          Boolean(entry) &&
          typeof entry === "object" &&
          typeof entry.approval_id === "string" &&
          typeof entry.idempotency_fingerprint === "string" &&
          typeof entry.decision === "string",
      )
    : [];
}

function eventFingerprintsFromMetadataV01(
  value: unknown,
): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(
      ([key, fingerprint]) =>
        key.startsWith("native-host-event:") &&
        typeof fingerprint === "string" &&
        /^sha256:[a-f0-9]{64}$/u.test(fingerprint),
    ),
  );
}

function externalRefMetadataV01(value: unknown): ExternalRefV01 | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const ref = value as ExternalRefV01;
  try {
    validateHostRefV01(ref);
    return ref;
  } catch {
    return null;
  }
}

function genericExternalRefMetadataV01(value: unknown): ExternalRefV01 | null {
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

function numberMetadataV01(value: unknown): number {
  return Number.isSafeInteger(value) && Number(value) >= 0 ? Number(value) : 0;
}

function stringMetadataV01(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function boundedVersionMetadataV01(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > 160 ||
    !/^[a-zA-Z0-9._+ /-]+$/u.test(value) ||
    /(?:^|\s)\//u.test(value) ||
    value.includes("//")
  ) {
    refuseV01("live_host_capability_version_invalid", 422);
  }
  return value;
}

function containsForbiddenMaterialV01(value: unknown): boolean {
  let forbidden = false;
  walkV01(value, (key, candidate) => {
    if (
      /^(?:raw_)?(?:prompt|transcript|hidden_reasoning|reasoning|provider_payload|stdout|stderr|environment|credential|token|secret|api_key)$/iu.test(
        key,
      ) &&
      candidate !== false &&
      candidate !== null
    ) {
      forbidden = true;
    }
  });
  return forbidden;
}

function walkV01(
  value: unknown,
  visit: (key: string, value: unknown) => void,
  key = "",
): void {
  visit(key, value);
  if (Array.isArray(value)) {
    for (const entry of value) walkV01(entry, visit, key);
  } else if (value && typeof value === "object") {
    for (const [childKey, child] of Object.entries(value)) {
      walkV01(child, visit, childKey);
    }
  }
}

function projectKeyV01(config: VNextLocalOperatorPilotConfigV01): string {
  return `${config.workspace_id}\u0000${config.project_id}`;
}

interface DeferredV01<T> {
  promise: Promise<T>;
  resolve(value: T): void;
  reject(error: unknown): void;
}

function deferredV01<T>(): DeferredV01<T> {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function refuseV01(code: string, status = 400): never {
  throw new LiveNativeHostRunServiceErrorV01(code, status);
}
