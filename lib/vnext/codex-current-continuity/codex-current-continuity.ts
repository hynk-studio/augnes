import Database from "better-sqlite3";
import { existsSync, statSync } from "node:fs";

import { getDatabasePath } from "@/lib/db";
import { readLatestManagedLiveDelegatedWorkLedgerSliceV01 } from "@/lib/autonomy/runner-ledger";
import { isTerminalRunnerStatus } from "@/lib/autonomy/runner-state";
import { readRootAvailabilityV01 } from "@/lib/vnext/onboarding/local-project-onboarding";
import {
  readCanonicalProjectWithRootV01,
  readDefaultWorkspaceIdentityV01,
} from "@/lib/vnext/persistence/project-identity-registry";
import { readActiveProjectSelectionV01 } from "@/lib/vnext/persistence/project-lifecycle-registry";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
  parseStrictIsoTimestampV01,
} from "@/lib/vnext/protocol-primitives";
import {
  externalRefUsesRepositoryRelativePathV01,
  canonicalizeRepositoryRelativePathV01,
} from "@/lib/vnext/repository-relative-path";
import { readRepositoryManagedPlatformCapabilityV01 } from "@/lib/vnext/repository-execution/repository-execution";
import {
  LIVE_NATIVE_HOST_RUN_SERVICE_VERSION_V01,
  getLiveNativeHostRunServiceV01,
  type LiveNativeHostRunProjectionV01,
} from "@/lib/vnext/runtime/live-native-host-run-service";
import {
  readVNextLocalOperatorPilotConfigV01,
  type VNextLocalOperatorPilotConfigV01,
} from "@/lib/vnext/runtime/local-operator-session";
import { projectVNextOperatorPilotContinuityV01 } from "@/lib/vnext/runtime/operator-pilot-project-continuity";
import {
  listVNextOperatorPilotSemanticReviewsV01,
  readVNextOperatorPilotSemanticReviewV01,
} from "@/lib/vnext/runtime/operator-pilot-review-material";
import {
  readProjectRunResultDetailV01,
  readProjectRunResultOverviewV01,
} from "@/lib/vnext/runtime/project-run-result-read-model";
import { readProjectWorkInitializationV01 } from "@/lib/vnext/runtime/project-work-initialization";
import type { ManagedLiveDelegatedWorkLedgerSliceV01 } from "@/lib/autonomy/runner-ledger";
import type { AutonomyRunSummary } from "@/types/autonomy-runner-execution";
import type { ProjectRunResultDetailV01 } from "@/types/vnext/project-run-result";
import type { ProjectRootAvailabilityV01 } from "@/types/vnext/project-onboarding";
import type { ProjectWorkInitializationV01 } from "@/types/vnext/project-work-initialization";
import {
  CODEX_CURRENT_CONTINUITY_LIMITS_V01,
  CODEX_CURRENT_CONTINUITY_SNAPSHOT_VERSION_V01,
  CODEX_CURRENT_CONTINUITY_VERSION_V01,
  type CodexCurrentContinuityExecutionStageV01,
  type CodexCurrentContinuityNextActionKindV01,
  type CodexCurrentContinuityResultCurrentnessV01,
  type CodexCurrentContinuityReviewStateV01,
  type CodexCurrentContinuityV01,
} from "@/types/vnext/codex-current-continuity";

export const CODEX_CURRENT_CONTINUITY_AUTHORITY_V01 = Object.freeze({
  writes_database: false,
  writes_project_files: false,
  changes_project_selection: false,
  changes_operator_session: false,
  creates_run: false,
  starts_codex_or_native_host: false,
  calls_provider: false,
  approves_host_action: false,
  cancels_or_resumes_run: false,
  creates_or_admits_result: false,
  creates_proof_or_evidence: false,
  creates_proposal: false,
  creates_review_decision: false,
  creates_or_applies_transition: false,
  mutates_accepted_state: false,
  retries_or_replays: false,
  calls_github: false,
  creates_branch_or_pr: false,
  merges_releases_or_deploys: false,
  starts_background_work: false,
} as const);

const AUTHORITY_V01 = CODEX_CURRENT_CONTINUITY_AUTHORITY_V01;

type ContinuityProjectScopeV01 = {
  workspace_id: string;
  project_id: string;
};

export interface CodexCurrentContinuityReadInputV01 {
  /** Internal read-only support for an explicitly viewed project. Public adapters omit it. */
  viewed_project_id?: string | null;
  generated_at?: string;
}

export interface CodexCurrentContinuityLiveObservationV01 {
  workspace_id: string;
  project_id: string;
  projection: LiveNativeHostRunProjectionV01;
}

export interface CodexCurrentContinuityDependenciesV01 {
  open_database: () => Database.Database;
  now: () => string;
  managed_start_available: () => boolean;
  read_root_availability: (root: string) => Promise<ProjectRootAvailabilityV01>;
  read_operator_config: () => VNextLocalOperatorPilotConfigV01 | null;
  read_live_projection: (
    config: VNextLocalOperatorPilotConfigV01,
    durable_run: AutonomyRunSummary,
  ) => CodexCurrentContinuityLiveObservationV01;
}

export async function loadCodexCurrentContinuityV01(
  input: CodexCurrentContinuityReadInputV01 = {},
  dependencies: Partial<CodexCurrentContinuityDependenciesV01> = {},
): Promise<CodexCurrentContinuityV01> {
  const db = (dependencies.open_database ?? openCurrentContinuityDatabaseV01)();
  try {
    return await readCodexCurrentContinuityV01(db, input, dependencies);
  } finally {
    db.close();
  }
}

/**
 * Thin explicit-project adapter over the CDX2A owner. Repository attachment
 * resolves the canonical project before this call; CDX2A keeps ownership of
 * the work/run/result/review projection and deterministic snapshot.
 */
export async function readCodexProjectContinuityV01(
  db: Database.Database,
  input: { project_id: string; generated_at?: string },
  dependencies: Partial<Omit<CodexCurrentContinuityDependenciesV01, "open_database">> = {},
): Promise<CodexCurrentContinuityV01> {
  return readCodexCurrentContinuityV01(db, {
    viewed_project_id: input.project_id,
    generated_at: input.generated_at,
  }, dependencies);
}

export async function readCodexCurrentContinuityV01(
  db: Database.Database,
  input: CodexCurrentContinuityReadInputV01 = {},
  dependencies: Partial<Omit<CodexCurrentContinuityDependenciesV01, "open_database">> = {},
): Promise<CodexCurrentContinuityV01> {
  const generatedAt = input.generated_at ?? (dependencies.now ?? (() => new Date().toISOString()))();
  requireTimestampV01(generatedAt);
  let workspace: ReturnType<typeof readDefaultWorkspaceIdentityV01>;
  try {
    workspace = readDefaultWorkspaceIdentityV01(db);
  } catch {
    return finalizeV01(unavailableProjectV01(generatedAt, "Canonical workspace state could not be read."), null);
  }
  if (!workspace) {
    const projection = emptyProjectionV01(generatedAt, "no_workspace");
    return finalizeV01(projection, { project_state: "no_workspace" });
  }

  let active: ReturnType<typeof readActiveProjectSelectionV01>;
  try {
    active = readActiveProjectSelectionV01(db, workspace.workspace_id);
  } catch {
    return finalizeV01(unavailableProjectV01(generatedAt, "Active project selection could not be read."), null);
  }
  const targetProjectId = input.viewed_project_id ?? active?.project_id ?? null;
  if (!targetProjectId) {
    const projection = emptyProjectionV01(generatedAt, "no_active_project");
    return finalizeV01(projection, {
      workspace_id: workspace.workspace_id,
      active_project: null,
      selection_revision: null,
    });
  }

  let registration: ReturnType<typeof readCanonicalProjectWithRootV01>;
  try {
    registration = readCanonicalProjectWithRootV01(db, {
      workspace_id: workspace.workspace_id,
      project_id: targetProjectId,
    });
  } catch {
    registration = null;
  }
  if (!registration) {
    return finalizeV01(unavailableProjectV01(generatedAt, "The selected project identity or root binding is unavailable."), null);
  }

  const scope = { workspace_id: workspace.workspace_id, project_id: targetProjectId };
  let rootAvailability: ProjectRootAvailabilityV01;
  try {
    rootAvailability = await (dependencies.read_root_availability ?? readRootAvailabilityV01)(
      registration.root_binding.local_root.normalized_path,
    );
  } catch {
    rootAvailability = "inspection_error";
  }
  const isActive = active?.project_id === targetProjectId;
  const projectStatus = !isActive
    ? "inactive_project" as const
    : rootAvailability === "available"
      ? "active_project" as const
      : "active_project_root_unavailable" as const;
  const projectKey = createProtocolSha256V01(canonicalizeProtocolValueV01({
    purpose: "codex-current-continuity-public-project-key.v0.1",
    workspace_id: workspace.workspace_id,
    project_id: targetProjectId,
  }));

  const workInitialization = readProjectWorkInitializationV01(db, scope, {
    root_available: () => rootAvailability === "available",
  });
  const configuredOperator = readMatchingOperatorConfigV01(
    scope,
    dependencies.read_operator_config,
  );
  const lineageConfig = configuredOperator ?? syntheticReadConfigV01(scope);
  const work = readCurrentWorkV01(db, workInitialization, lineageConfig, generatedAt, {
    is_active: isActive,
    root_available: rootAvailability === "available",
    operator_config_available: configuredOperator !== null,
  });

  let ledger: ManagedLiveDelegatedWorkLedgerSliceV01 | null = null;
  let liveObservation: CodexCurrentContinuityLiveObservationV01 | null = null;
  try {
    ledger = readLatestManagedLiveDelegatedWorkLedgerSliceV01(scope, db);
  } catch {
    ledger = null;
  }
  if (
    ledger?.run &&
    !isTerminalRunnerStatus(ledger.run.status) &&
    configuredOperator
  ) {
    try {
      liveObservation = (dependencies.read_live_projection ?? ((config, durableRun) => ({
        workspace_id: config.workspace_id,
        project_id: config.project_id,
        projection: getLiveNativeHostRunServiceV01().readProjectionOnlyV01(
          config,
          durableRun,
        ),
      })))(configuredOperator, ledger.run);
    } catch {
      liveObservation = null;
    }
  }
  const executionDraft = readManagedExecutionV01(
    ledger,
    liveObservation,
    work.internal_packet_binding,
    scope,
  );

  let overview: ReturnType<typeof readProjectRunResultOverviewV01> | null = null;
  let resultDetail: ProjectRunResultDetailV01 | null = null;
  let resultReadError = false;
  try {
    overview = readProjectRunResultOverviewV01(db, scope);
    if (overview.latest_result) {
      resultDetail = readProjectRunResultDetailV01(db, {
        ...scope,
        receipt_id: overview.latest_result.receipt_ref,
      });
    }
  } catch {
    resultReadError = true;
  }
  const result = readLatestResultV01(overview, resultDetail, resultReadError, work.internal_packet_binding);
  const execution = reconcileManagedExecutionWithResultV01(
    executionDraft,
    result,
  );
  if (
    execution.public.stage !== "no_run" &&
    work.public.start_eligible
  ) {
    work.public.start_eligible = false;
    work.public.start_blocker =
      "Existing managed work must settle before another run starts.";
    work.snapshot_state.start_eligible = false;
    work.snapshot_state.start_blocker_code = "managed_execution_present";
  }
  const managedStartAvailable =
    dependencies.managed_start_available?.() ??
    readRepositoryManagedPlatformCapabilityV01().status === "available";
  if (!managedStartAvailable && work.public.start_eligible) {
    work.public.start_eligible = false;
    work.public.start_blocker =
      "Managed Start is unavailable on this platform.";
    work.snapshot_state.start_eligible = false;
    work.snapshot_state.start_blocker_code = "managed_start_unavailable";
  }
  const review = readReviewContinuityV01(db, configuredOperator, resultDetail, result.currentness);

  const gaps = boundedStringsV01([
    ...work.gaps,
    ...execution.gaps,
    ...result.gaps_for_projection,
    ...review.gaps,
  ], CODEX_CURRENT_CONTINUITY_LIMITS_V01.gaps, CODEX_CURRENT_CONTINUITY_LIMITS_V01.result_item_characters);
  const sourceUnavailable =
    work.public.status === "current_work_unavailable" ||
    work.public.status === "current_work_ambiguous" ||
    execution.public.stage === "unavailable_or_inconsistent" ||
    result.public.state === "result_unavailable" ||
    result.public.currentness === "unavailable_or_ambiguous" ||
    review.public.state === "review_source_unavailable_or_inconsistent";
  const nextAction = chooseCodexCurrentContinuityNextActionV01({
    project_status: projectStatus,
    work: work.public,
    execution: execution.public,
    result: result.public,
    review: review.public,
    source_unavailable: sourceUnavailable,
  });
  const projection: CodexCurrentContinuityV01 = {
    projection_version: CODEX_CURRENT_CONTINUITY_VERSION_V01,
    generated_at: generatedAt,
    source_status: sourceUnavailable ? "partial" : "exact",
    snapshot: unavailableSnapshotV01(),
    project: {
      status: projectStatus,
      project_key: projectKey,
      display_name: boundedTextV01(registration.project.display_name, 256),
      active: isActive,
      selection_revision: active?.selection_revision ?? null,
      root_availability: rootAvailability,
    },
    current_work: work.public,
    managed_execution: execution.public,
    latest_result: result.public,
    review_continuity: review.public,
    next_action: nextAction,
    authority: AUTHORITY_V01,
    gaps,
  };
  const bindingMaterial = sourceUnavailable
    ? null
    : {
        workspace_id: workspace.workspace_id,
        active_project_id: active?.project_id ?? null,
        selection_revision: active?.selection_revision ?? null,
        viewed_project_id: input.viewed_project_id ?? null,
        project_id: targetProjectId,
        project_fingerprint: createProtocolSha256V01(canonicalizeProtocolValueV01(registration.project)),
        root_binding_fingerprint: createProtocolSha256V01(canonicalizeProtocolValueV01(registration.root_binding)),
        root_availability: rootAvailability,
        current_packet: work.internal_packet_binding,
        current_work: work.snapshot_state,
        managed_run: {
          owner_binding: execution.internal_binding,
          public_projection: execution.public,
        },
        result: result.internal_binding,
        review: review.internal_binding,
        next_action_kind: nextAction.kind,
        source_status: projection.source_status,
      };
  return finalizeV01(projection, bindingMaterial);
}

function openCurrentContinuityDatabaseV01(): Database.Database {
  const databasePath = getDatabasePath();
  if (!existsSync(databasePath) || !statSync(databasePath).isFile()) {
    throw new Error("codex_current_continuity_database_unavailable");
  }
  const db = new Database(databasePath, { readonly: true, fileMustExist: true });
  db.pragma("query_only = ON");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");
  return db;
}

function readMatchingOperatorConfigV01(
  scope: ContinuityProjectScopeV01,
  reader?: () => VNextLocalOperatorPilotConfigV01 | null,
): VNextLocalOperatorPilotConfigV01 | null {
  try {
    const config = reader ? reader() : readVNextLocalOperatorPilotConfigV01(process.env);
    return config?.workspace_id === scope.workspace_id && config.project_id === scope.project_id
      ? config
      : null;
  } catch {
    return null;
  }
}

function syntheticReadConfigV01(scope: ContinuityProjectScopeV01): VNextLocalOperatorPilotConfigV01 {
  return {
    enabled: true,
    ...scope,
    operator_id: "operator:codex-current-continuity-read",
    database_path: ":read-only:",
  };
}

function readCurrentWorkV01(
  db: Database.Database,
  initialization: ProjectWorkInitializationV01,
  config: VNextLocalOperatorPilotConfigV01,
  generatedAt: string,
  eligibility: { is_active: boolean; root_available: boolean; operator_config_available: boolean },
) {
  let continuity: ReturnType<typeof projectVNextOperatorPilotContinuityV01> | null = null;
  try {
    continuity = projectVNextOperatorPilotContinuityV01(db, {
      config,
      clock: { now: () => generatedAt },
    });
  } catch {
    continuity = null;
  }
  const packet = initialization.current_packet;
  const exactBinding =
    packet &&
    continuity?.latest_compiled_packet?.packet_id === packet.packet_id &&
    continuity.latest_compiled_packet.packet_fingerprint === packet.packet_fingerprint;
  const ambiguous = Boolean(packet && continuity && !exactBinding);
  const packetCurrentness = !packet
    ? "not_available" as const
    : !continuity || ambiguous
      ? "unavailable_or_ambiguous" as const
      : continuity.packet_currentness === "fresh"
        ? "fresh" as const
        : continuity.packet_currentness === "stale"
          ? "stale" as const
          : "unavailable_or_ambiguous" as const;
  const unresolvedHistory = initialization.state === "existing_history_without_current_packet";
  const provenStale =
    initialization.reason === "superseded_work_without_current_packet";
  const historyAmbiguous =
    initialization.reason === "multiple_current_packet_candidates";
  const status = ambiguous || historyAmbiguous
    ? "current_work_ambiguous" as const
    : initialization.state === "not_defined"
      ? "no_current_work" as const
      : unresolvedHistory
        ? provenStale
          ? "stale_current_work" as const
          : "current_work_unavailable" as const
        : initialization.state === "unavailable"
          ? "current_work_unavailable" as const
          : packetCurrentness === "stale"
            ? "stale_current_work" as const
            : packetCurrentness === "unavailable_or_ambiguous"
              ? "current_work_unavailable" as const
              : "current_work" as const;
  const currentness = status === "stale_current_work"
    ? "stale" as const
    : status === "current_work_ambiguous" || status === "current_work_unavailable"
      ? "unavailable_or_ambiguous" as const
      : packetCurrentness;
  const startBlockerCode = !eligibility.is_active
    ? "project_inactive"
    : !eligibility.root_available
      ? "root_unavailable"
      : !eligibility.operator_config_available
        ? "operator_configuration_unavailable"
        : status === "no_current_work"
          ? "no_current_work"
          : status !== "current_work"
            ? "current_work_not_exact"
            : currentness !== "fresh"
              ? "current_work_not_fresh"
              : null;
  const startBlocker = startBlockerCopyV01(startBlockerCode);
  const revisionEligibility = initialization.revision_eligibility;
  return {
    public: {
      status,
      goal: boundedTextV01(initialization.current_work?.goal ?? null, CODEX_CURRENT_CONTINUITY_LIMITS_V01.goal_characters),
      success_criteria: boundedStringsV01(
        initialization.current_work?.success_criteria ?? [],
        CODEX_CURRENT_CONTINUITY_LIMITS_V01.detail_items,
        CODEX_CURRENT_CONTINUITY_LIMITS_V01.detail_characters,
      ),
      non_goals: boundedStringsV01(
        initialization.current_work?.non_goals ?? [],
        CODEX_CURRENT_CONTINUITY_LIMITS_V01.detail_items,
        CODEX_CURRENT_CONTINUITY_LIMITS_V01.detail_characters,
      ),
      lineage_kind: packet?.lineage_kind ?? null,
      currentness,
      start_eligible: startBlocker === null,
      start_blocker: startBlocker,
      revision_eligible: revisionEligibility.eligible,
      revision_blocker: revisionEligibility.eligible
        ? null
        : boundedTextV01(revisionReasonV01(revisionEligibility.reason), CODEX_CURRENT_CONTINUITY_LIMITS_V01.result_item_characters),
    },
    internal_packet_binding: exactBinding && packet
      ? {
          packet_id: packet.packet_id,
          packet_fingerprint: packet.packet_fingerprint,
          lineage_kind: packet.lineage_kind,
          currentness,
        }
      : null,
    snapshot_state: {
      status,
      lineage_kind: packet?.lineage_kind ?? null,
      currentness,
      operator_configuration_available: eligibility.operator_config_available,
      start_eligible: startBlockerCode === null,
      start_blocker_code: startBlockerCode,
      revision_eligible: revisionEligibility.eligible,
      revision_reason: revisionEligibility.reason,
    },
    gaps: [
      ...(!continuity && packet ? ["Exact current packet lineage could not be read."] : []),
      ...(ambiguous ? ["More than one current packet interpretation was observed."] : []),
      ...(unresolvedHistory
        ? [workResolutionGapV01(initialization.reason)]
        : []),
    ],
  };
}

interface ManagedExecutionReadV01 {
  public: CodexCurrentContinuityV01["managed_execution"];
  internal_binding: unknown | null;
  run_relation: null | {
    run_id: string;
    terminal: boolean;
    packet_id: string;
    packet_fingerprint: string;
    receipt_expectation: null | {
      receipt_id: string | null;
      receipt_fingerprint: string | null;
    };
  };
  gaps: string[];
}

function readManagedExecutionV01(
  ledger: ManagedLiveDelegatedWorkLedgerSliceV01 | null,
  liveObservation: CodexCurrentContinuityLiveObservationV01 | null,
  currentPacket: { packet_id: string; packet_fingerprint: string } | null,
  scope: ContinuityProjectScopeV01,
): ManagedExecutionReadV01 {
  if (!ledger) {
    return {
      public: emptyExecutionV01("unavailable_or_inconsistent", "Managed execution state could not be read."),
      internal_binding: null,
      run_relation: null,
      gaps: ["Managed execution state is unavailable or inconsistent."],
    };
  }
  const run = ledger.run;
  if (!run) {
    return { public: emptyExecutionV01("no_run", null), internal_binding: { state: "no_run" }, run_relation: null, gaps: [] as string[] };
  }
  const runPacketId = stringValueV01(run.metadata.packet_id);
  const runPacketFingerprint = stringValueV01(
    run.metadata.packet_fingerprint,
  );
  const runTerminal = isTerminalRunnerStatus(run.status);
  if (
    runTerminal &&
    currentPacket &&
    runPacketId &&
    runPacketFingerprint &&
    (runPacketId !== currentPacket.packet_id ||
      runPacketFingerprint !== currentPacket.packet_fingerprint)
  ) {
    return {
      public: emptyExecutionV01("no_run", null),
      internal_binding: { state: "no_run_for_current_packet" },
      run_relation: null,
      gaps: [] as string[],
    };
  }
  const exactCurrentPacketBinding = Boolean(
    currentPacket &&
      runPacketId &&
      runPacketFingerprint &&
      runPacketId === currentPacket.packet_id &&
      runPacketFingerprint === currentPacket.packet_fingerprint,
  );
  if (!exactCurrentPacketBinding) {
    return unavailableManagedExecutionV01(
      "The managed run cannot be bound to one exact current work packet.",
    );
  }
  const durableMode = run.metadata.invocation_origin === "policy_triggered"
    ? "policy_triggered" as const
    : run.metadata.invocation_origin === "interactive"
      ? "interactive" as const
      : run.metadata.invocation_origin === "repository_attachment"
        ? "repository_attachment" as const
      : null;
  const durableControlRevision = integerValueV01(run.metadata.control_revision);
  const live = liveObservation?.projection ?? null;
  const liveStage = live
    ? classifyCodexCurrentContinuityExecutionStageV01(
        live.status,
        live.reconciliation_required,
        false,
      )
    : "unavailable_or_inconsistent";
  if (
    !runTerminal &&
    (!liveObservation ||
      liveObservation.workspace_id !== scope.workspace_id ||
      liveObservation.project_id !== scope.project_id ||
      !live ||
      live.service_version !== LIVE_NATIVE_HOST_RUN_SERVICE_VERSION_V01 ||
      live.status === "idle" ||
      live.run_ref !== run.run_id ||
      durableMode === null ||
      live.mode !== durableMode ||
      durableControlRevision === null ||
      integerValueV01(live.control_revision) !== durableControlRevision ||
      liveStage === "unavailable_or_inconsistent")
  ) {
    return unavailableManagedExecutionV01(
      "Live managed execution cannot be bound to the exact durable run.",
    );
  }
  const effectiveStatus = runTerminal ? run.status : live!.status;
  const reconciliation = runTerminal
    ? run.metadata.reconciliation_required === true
    : live!.reconciliation_required;
  const receiptExpectation = run.metadata.terminal_receipt_persisted === true
    ? {
        receipt_id: stringValueV01(run.metadata.run_receipt_id),
        receipt_fingerprint: stringValueV01(run.metadata.run_receipt_fingerprint),
      }
    : null;
  const stage = classifyCodexCurrentContinuityExecutionStageV01(
    effectiveStatus,
    reconciliation,
    false,
  );
  const reason = boundedTextV01(
    (runTerminal ? null : live!.pending_approval?.public_reason) ??
      (runTerminal ? null : live!.public_reason) ??
      stringValueV01(run.metadata.public_reason) ??
      run.stop_reason,
    CODEX_CURRENT_CONTINUITY_LIMITS_V01.result_item_characters,
  );
  const checkpoint = ledger.events
    .filter((event) => event.event_type === "host_event_observed" && event.payload.event_kind === "work_checkpoint")
    .at(-1);
  const latestCheckpoint = checkpoint
    ? boundedTextV01(checkpoint.message || "A bounded work checkpoint was recorded.", CODEX_CURRENT_CONTINUITY_LIMITS_V01.result_item_characters)
    : null;
  const mode = durableMode ?? "unknown" as const;
  return {
    public: {
      stage,
      mode,
      latest_checkpoint: latestCheckpoint,
      blocker_or_attention: reason,
      attention_required: [
        "waiting_for_approval",
        "reconciliation_required",
        "terminal_result_ready",
        "blocked",
        "failed",
        "cancelled",
        "timed_out",
      ].includes(stage),
      reconciliation_required: stage === "reconciliation_required",
      result_available: false,
      updated_at: run.updated_at,
    },
    internal_binding: {
      run_id: run.run_id,
      status: effectiveStatus,
      updated_at: run.updated_at,
      control_revision: durableControlRevision,
      reconciliation_required: reconciliation,
      packet_id: runPacketId,
      packet_fingerprint: runPacketFingerprint,
      receipt_id: stringValueV01(run.metadata.run_receipt_id),
      receipt_fingerprint: stringValueV01(run.metadata.run_receipt_fingerprint),
    },
    run_relation: {
      run_id: run.run_id,
      terminal: runTerminal,
      packet_id: runPacketId!,
      packet_fingerprint: runPacketFingerprint!,
      receipt_expectation: receiptExpectation,
    },
    gaps: [] as string[],
  };
}

function unavailableManagedExecutionV01(reason: string): ManagedExecutionReadV01 {
  return {
    public: emptyExecutionV01(
      "unavailable_or_inconsistent",
      reason,
    ),
    internal_binding: null,
    run_relation: null,
    gaps: [reason],
  };
}

function reconcileManagedExecutionWithResultV01(
  execution: ManagedExecutionReadV01,
  result: ReturnType<typeof readLatestResultV01>,
): ManagedExecutionReadV01 {
  const relation = execution.run_relation;
  if (!relation || !relation.terminal) return execution;
  const resultBinding = result.public.state === "result_present"
    ? result.internal_binding
    : null;
  const expected = relation.receipt_expectation;
  const exactReceiptRelation = Boolean(
    resultBinding &&
      resultBinding.run_id === relation.run_id &&
      resultBinding.packet_id === relation.packet_id &&
      resultBinding.packet_fingerprint === relation.packet_fingerprint &&
      (!expected ||
        (expected.receipt_id !== null &&
          expected.receipt_fingerprint !== null &&
          expected.receipt_id === resultBinding.receipt_id &&
          expected.receipt_fingerprint === resultBinding.receipt_fingerprint)),
  );
  if (exactReceiptRelation) {
    return {
      ...execution,
      public: {
        ...execution.public,
        stage: "terminal_result_ready",
        attention_required: true,
        reconciliation_required: false,
        result_available: true,
      },
    };
  }
  if (expected || (resultBinding && resultBinding.run_id === relation.run_id)) {
    return {
      ...execution,
      public: emptyExecutionV01(
        "unavailable_or_inconsistent",
        "The managed run's expected canonical result could not be validated.",
      ),
      internal_binding: null,
      gaps: boundedStringsV01([
        ...execution.gaps,
        "The managed run's expected canonical result or exact run/packet relation is unavailable.",
      ], CODEX_CURRENT_CONTINUITY_LIMITS_V01.gaps, CODEX_CURRENT_CONTINUITY_LIMITS_V01.result_item_characters),
    };
  }
  return execution;
}

export function classifyCodexCurrentContinuityExecutionStageV01(
  status: string,
  reconciliation: boolean,
  receiptAvailable: boolean,
): CodexCurrentContinuityExecutionStageV01 {
  if (receiptAvailable) return "terminal_result_ready";
  if (reconciliation || status === "paused") return "reconciliation_required";
  if (["created", "scheduled", "queued", "starting", "planned"].includes(status)) return "preparing";
  if (status === "running") return "running";
  if (status === "waiting_for_approval") return "waiting_for_approval";
  if (["cancelling", "cancel_requested"].includes(status)) return "cancellation_requested";
  if (["blocked", "needs_review", "completed"].includes(status)) return "blocked";
  if (["failed", "stopped"].includes(status)) return "failed";
  if (status === "cancelled") return "cancelled";
  if (status === "timed_out") return "timed_out";
  return "unavailable_or_inconsistent";
}

function readLatestResultV01(
  overview: ReturnType<typeof readProjectRunResultOverviewV01> | null,
  detail: ProjectRunResultDetailV01 | null,
  readError: boolean,
  currentPacket: { packet_id: string; packet_fingerprint: string } | null,
) {
  if (readError || !overview) {
    return {
      public: emptyResultV01("result_unavailable", "unavailable_or_ambiguous"),
      currentness: "unavailable_or_ambiguous" as const,
      internal_binding: null,
      gaps_for_projection: ["Canonical result state could not be validated."],
    };
  }
  if (overview.latest_result_state === "receipt_unavailable") {
    return {
      public: emptyResultV01("result_unavailable", "unavailable_or_ambiguous"),
      currentness: "unavailable_or_ambiguous" as const,
      internal_binding: null,
      gaps_for_projection: ["A managed run references a canonical result that is unavailable."],
    };
  }
  if (!overview.latest_result || !detail) {
    return {
      public: emptyResultV01("no_result", "not_available"),
      currentness: "not_available" as const,
      internal_binding: { state: "no_result" },
      gaps_for_projection: [] as string[],
    };
  }
  const packetRef = detail.identity.packet_ref;
  const currentness = classifyCodexCurrentContinuityResultCurrentnessV01(
    packetRef &&
      detail.packet.status === "available" &&
      detail.packet.packet_fingerprint === packetRef.source_ref
      ? { packet_id: packetRef.external_id, packet_fingerprint: packetRef.source_ref ?? null }
      : null,
    currentPacket,
  );
  const incomplete = boundedStringsV01([
    ...(detail.packet.status !== "available" ? [`packet_relation:${detail.packet.status}`] : []),
    ...detail.compatibility.unmapped_fields.map((item) => `${item.source_field}: ${item.reason}`),
    ...detail.compatibility.warnings,
  ], CODEX_CURRENT_CONTINUITY_LIMITS_V01.result_items, CODEX_CURRENT_CONTINUITY_LIMITS_V01.result_item_characters);
  const publicResult: CodexCurrentContinuityV01["latest_result"] = {
    state: "result_present",
    currentness,
    outcome: boundedTextV01(detail.summary.outcome, 160),
    execution_status: boundedTextV01(detail.summary.execution_status, 160),
    verification_status: boundedTextV01(detail.summary.verification_status, 160),
    summary: boundedTextV01(detail.summary.summary, CODEX_CURRENT_CONTINUITY_LIMITS_V01.result_summary_characters),
    recorded_at: detail.summary.recorded_at,
    artifacts: detail.artifacts.slice(0, CODEX_CURRENT_CONTINUITY_LIMITS_V01.result_items).map((artifact) => ({
      kind: boundedTextV01(artifact.artifact_ref.ref_type, 160) ?? "artifact",
      repository_relative_path: repositoryRelativeArtifactPathV01(artifact.artifact_ref),
      summary: boundedTextV01(artifact.summary, CODEX_CURRENT_CONTINUITY_LIMITS_V01.result_item_characters),
      change_kind: artifact.change_kind,
      basis: artifact.basis,
    })),
    checks: detail.checks.slice(0, CODEX_CURRENT_CONTINUITY_LIMITS_V01.result_items).map((check) => ({
      check: boundedTextV01(check.check_id, 240) ?? "check",
      status: check.status,
      required: check.required,
      summary: boundedTextV01(check.summary, CODEX_CURRENT_CONTINUITY_LIMITS_V01.result_item_characters) ?? "No bounded summary was recorded.",
    })),
    skipped_checks: detail.skipped_checks.slice(0, CODEX_CURRENT_CONTINUITY_LIMITS_V01.result_items).map((check) => ({
      check: boundedTextV01(check.check_id, 240) ?? "check",
      required: check.required,
      reason: boundedTextV01(check.reason, CODEX_CURRENT_CONTINUITY_LIMITS_V01.result_item_characters) ?? "No bounded reason was recorded.",
    })),
    blockers: issueSummariesV01(detail.blockers),
    warnings: issueSummariesV01(detail.warnings),
    gaps: issueSummariesV01(detail.gaps),
    incomplete_historical_fields: incomplete,
    review_attention: detail.summary.review_attention,
    proposed_next_steps: boundedStringsV01(
      detail.proposed_next_steps.map((item) => item.summary),
      CODEX_CURRENT_CONTINUITY_LIMITS_V01.result_items,
      CODEX_CURRENT_CONTINUITY_LIMITS_V01.result_item_characters,
    ),
  };
  return {
    public: publicResult,
    currentness,
    internal_binding: {
      receipt_id: detail.identity.receipt_ref,
      receipt_fingerprint: detail.identity.receipt_fingerprint,
      run_id: detail.identity.run_ref,
      packet_id: detail.packet.status === "available"
        ? packetRef?.external_id ?? null
        : null,
      packet_fingerprint: detail.packet.status === "available"
        ? packetRef?.source_ref ?? null
        : null,
      currentness,
    },
    gaps_for_projection: currentness === "unavailable_or_ambiguous"
      ? ["The latest result cannot be bound to one exact current work packet."]
      : [] as string[],
  };
}

export function classifyCodexCurrentContinuityResultCurrentnessV01(
  resultPacket: {
    packet_id: string;
    packet_fingerprint: string | null;
  } | null,
  currentPacket: {
    packet_id: string;
    packet_fingerprint: string;
  } | null,
): CodexCurrentContinuityResultCurrentnessV01 {
  if (!resultPacket?.packet_fingerprint || !currentPacket) {
    return "unavailable_or_ambiguous";
  }
  return resultPacket.packet_id === currentPacket.packet_id &&
    resultPacket.packet_fingerprint === currentPacket.packet_fingerprint
    ? "current"
    : "stale";
}

export interface CodexCurrentContinuityReviewClassificationInputV01 {
  application_status:
    | "needs_decision"
    | "ready_to_complete"
    | "project_updated"
    | "rejected"
    | "deferred"
    | "needs_more_information"
    | "continue_review";
  decision_kind: string | null;
  requested_project_change: boolean;
  matching_transition_receipt_present: boolean;
  result_currentness: CodexCurrentContinuityResultCurrentnessV01;
}

export function classifyCodexCurrentContinuityReviewV01(
  input: CodexCurrentContinuityReviewClassificationInputV01,
): CodexCurrentContinuityV01["review_continuity"] {
  if (
    input.application_status === "needs_decision" ||
    input.application_status === "needs_more_information"
  ) {
    return {
      state: "proposal_present_decision_pending",
      summary: input.application_status === "needs_decision"
        ? "A source-bound proposal is ready for a user Decision."
        : "A source-bound proposal needs more information before a user Decision.",
      decision_kind: input.decision_kind,
      transition_currentness: "not_available",
    };
  }
  if (input.application_status === "ready_to_complete") {
    const current = input.result_currentness === "current";
    return {
      state: current
        ? "accepted_decision_awaiting_transition"
        : "transition_blocked",
      summary: current
        ? "An accepted Decision is recorded; its separately authorized Transition is not yet applied."
        : "An accepted Decision exists, but exact currentness blocks Transition completion.",
      decision_kind: input.decision_kind,
      transition_currentness: current ? "current" : "blocked",
    };
  }
  if (input.application_status === "project_updated") {
    return {
      state: "transition_applied",
      summary: "An exact StateTransitionReceipt changed project meaning and later context.",
      decision_kind: input.decision_kind,
      transition_currentness: "applied",
    };
  }
  if (
    input.application_status === "continue_review" &&
    input.requested_project_change &&
    !input.matching_transition_receipt_present
  ) {
    const current = input.result_currentness === "current";
    return {
      state: current
        ? "accepted_decision_awaiting_transition"
        : "transition_blocked",
      summary: current
        ? "An accepted Decision is recorded; Transition completion still requires its exact user-authority path."
        : "A Decision requested project change, but exact currentness blocks Transition completion.",
      decision_kind: input.decision_kind,
      transition_currentness: current ? "current" : "blocked",
    };
  }
  return {
    state: "decision_recorded",
    summary: "A user Decision is recorded; it did not itself apply a Transition.",
    decision_kind: input.decision_kind,
    transition_currentness: "not_available",
  };
}

function readReviewContinuityV01(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01 | null,
  detail: ProjectRunResultDetailV01 | null,
  resultCurrentness: "current" | "stale" | "unavailable_or_ambiguous" | "not_available",
) {
  const resultProposal = detail?.proposal ?? null;
  let proposalBinding = resultProposal?.status === "available"
    ? {
        proposal_id: resultProposal.proposal_id,
        proposal_fingerprint: resultProposal.proposal_fingerprint,
      }
    : null;
  if (
    detail &&
    config &&
    (!resultProposal ||
      (resultProposal.status === "unavailable" &&
        resultProposal.reason === "not_created"))
  ) {
    try {
      const exact = listVNextOperatorPilotSemanticReviewsV01(db, {
        config,
        authenticated_session_id: null,
      }).filter((candidate) =>
        candidate.source_receipts.some((receipt) =>
          receipt.receipt_id === detail.identity.receipt_ref &&
          receipt.receipt_fingerprint === detail.identity.receipt_fingerprint));
      if (exact.length > 1) {
        throw new Error("codex_current_continuity_review_attention_ambiguous");
      }
      if (exact[0]) {
        proposalBinding = {
          proposal_id: exact[0].proposal_id,
          proposal_fingerprint: exact[0].proposal_fingerprint,
        };
      }
    } catch {
      return reviewResultV01(
        "review_source_unavailable_or_inconsistent",
        "Exact proposal, Decision, or Transition continuity could not be validated.",
        null,
        "not_available",
        null,
        ["Review continuity is unavailable or inconsistent."],
      );
    }
  }
  if (
    !proposalBinding &&
    (!resultProposal ||
      (resultProposal.status === "unavailable" &&
        resultProposal.reason === "not_created"))
  ) {
    return reviewResultV01("no_proposal", "No exact proposal is bound to the latest result.", null, "not_available", { state: "no_proposal" });
  }
  if (!proposalBinding || !config) {
    return reviewResultV01(
      "review_source_unavailable_or_inconsistent",
      "Exact proposal, Decision, or Transition continuity could not be validated.",
      null,
      "not_available",
      null,
      ["Review continuity is unavailable or inconsistent."],
    );
  }
  try {
    const review = readVNextOperatorPilotSemanticReviewV01(db, {
      config,
      proposal_id: proposalBinding.proposal_id,
      authenticated_session_id: null,
    });
    if (
      review.proposal_fingerprint !== proposalBinding.proposal_fingerprint ||
      !review.source_receipts.some((receipt) =>
        receipt.receipt_id === detail?.identity.receipt_ref &&
        receipt.receipt_fingerprint === detail.identity.receipt_fingerprint)
    ) {
      throw new Error("codex_current_continuity_review_result_binding_conflict");
    }
    const application = review.decision_application_summary;
    const classification = classifyCodexCurrentContinuityReviewV01({
      application_status: application.status,
      decision_kind: application.effective_decision?.decision ?? null,
      requested_project_change:
        application.effective_decision?.requested_project_change === true,
      matching_transition_receipt_present:
        application.matching_transition_receipt_present,
      result_currentness: resultCurrentness,
    });
    return reviewResultV01(
      classification.state,
      classification.summary,
      classification.decision_kind,
      classification.transition_currentness,
      {
        proposal_id: review.proposal_id,
        proposal_fingerprint: review.proposal_fingerprint,
        application_status: application.status,
        decision_id: application.effective_decision?.decision_id ?? null,
        decision_fingerprint: application.effective_decision?.decision_fingerprint ?? null,
        transition_receipt_id: application.effective_decision?.matching_transition_receipt_id ?? null,
        transition_receipt_fingerprint: application.effective_decision?.matching_transition_receipt_fingerprint ?? null,
      },
    );
  } catch {
    return reviewResultV01(
      "review_source_unavailable_or_inconsistent",
      "Exact proposal, Decision, or Transition continuity could not be validated.",
      null,
      "not_available",
      null,
      ["Review continuity is unavailable or inconsistent."],
    );
  }
}

function reviewResultV01(
  state: CodexCurrentContinuityReviewStateV01,
  summary: string,
  decisionKind: string | null,
  transitionCurrentness: "current" | "blocked" | "applied" | "not_available",
  internalBinding: unknown,
  gaps: string[] = [],
) {
  return {
    public: { state, summary, decision_kind: decisionKind, transition_currentness: transitionCurrentness },
    internal_binding: internalBinding,
    gaps,
  };
}

export function chooseCodexCurrentContinuityNextActionV01(input: {
  project_status: CodexCurrentContinuityV01["project"]["status"];
  work: CodexCurrentContinuityV01["current_work"];
  execution: CodexCurrentContinuityV01["managed_execution"];
  result: CodexCurrentContinuityV01["latest_result"];
  review: CodexCurrentContinuityV01["review_continuity"];
  source_unavailable: boolean;
}): CodexCurrentContinuityV01["next_action"] {
  if (input.project_status === "inactive_project") return actionV01("make_project_active", "Make this project active", "Only the active project can own current managed work.", true);
  if (["no_workspace", "no_active_project"].includes(input.project_status)) return actionV01("choose_project", "Choose a project", "Current continuity begins with one explicitly active project.", true);
  if (input.project_status === "project_source_unavailable") return actionV01("unavailable", "Current project is unavailable", "Canonical project state must be restored before choosing another action.", false);
  if (input.project_status === "active_project_root_unavailable") return actionV01("restore_project_root", "Restore the project folder", "Recovery reconnects the existing project without rewriting history.", true);
  if (input.source_unavailable) return actionV01("unavailable", "Current continuity is unavailable", "Resolve the reported canonical source gap before acting.", false);
  if (input.execution.stage === "waiting_for_approval") return actionV01("review_host_approval", "Review requested access", "Approval permits only the displayed bounded host action; it does not accept the result.", true);
  if (input.execution.stage === "reconciliation_required") return actionV01("resume_or_reconcile_work", "Resume or reconcile Codex work", "The same admitted run needs explicit recovery before progress can continue.", true);
  if (["preparing", "running", "cancellation_requested"].includes(input.execution.stage)) return actionV01("view_progress", "View current progress", "The managed run is still active; reading it changes nothing.", false);
  if (input.review.state === "proposal_present_decision_pending") return actionV01("record_decision", "Review the proposal and record a Decision", "A proposal is not a Decision and changes no project state by itself.", true);
  if (input.review.state === "accepted_decision_awaiting_transition") return actionV01("complete_authorized_transition", "Complete the authorized Transition", "The accepted Decision is recorded, but project meaning has not changed yet.", true);
  if (input.review.state === "transition_blocked") return actionV01("review_proposal", "Review the blocked Transition", "Exact admission or currentness must be restored before Transition completion.", true);
  if (input.review.state === "transition_applied") return actionV01("understand_updated_project", "Review the resulting project state", "The completed Transition changed later project context.", false);
  if (input.result.state === "result_present") return actionV01("review_result", "Review the result", "Execution completion is not result acceptance or a project Decision.", true);
  if (input.work.status === "no_current_work") return actionV01("define_work", "Define current work", "Defining work creates instructions but does not start execution.", true);
  if (["stale_current_work", "current_work_unavailable", "current_work_ambiguous"].includes(input.work.status)) return actionV01("revise_or_refresh_work", "Restore exact current work", "Start remains blocked until one fresh current packet is validated.", true);
  if (input.work.start_eligible) return actionV01("start_current_work", "Start current work", "Starting creates managed execution; this read does not start it.", true);
  return actionV01("no_available_action", "No consequential action is available", "The current exact state does not expose another action.", false);
}

function actionV01(
  kind: CodexCurrentContinuityNextActionKindV01,
  label: string,
  reason: string,
  userActionRequired: boolean,
): CodexCurrentContinuityV01["next_action"] {
  return { kind, label, reason, user_action_required: userActionRequired, executes: false };
}

function emptyProjectionV01(
  generatedAt: string,
  status: "no_workspace" | "no_active_project",
): CodexCurrentContinuityV01 {
  return {
    projection_version: CODEX_CURRENT_CONTINUITY_VERSION_V01,
    generated_at: generatedAt,
    source_status: "exact",
    snapshot: unavailableSnapshotV01(),
    project: {
      status,
      project_key: null,
      display_name: null,
      active: false,
      selection_revision: null,
      root_availability: "not_available",
    },
    current_work: emptyWorkV01("no_current_work"),
    managed_execution: emptyExecutionV01("no_run", null),
    latest_result: emptyResultV01("no_result", "not_available"),
    review_continuity: {
      state: "no_proposal",
      summary: "No exact proposal is bound to current work.",
      decision_kind: null,
      transition_currentness: "not_available",
    },
    next_action: actionV01("choose_project", "Choose a project", "Current continuity begins with one explicitly active project.", true),
    authority: AUTHORITY_V01,
    gaps: [],
  };
}

function unavailableProjectV01(generatedAt: string, reason: string): CodexCurrentContinuityV01 {
  return {
    ...emptyProjectionV01(generatedAt, "no_active_project"),
    source_status: "unavailable",
    project: {
      status: "project_source_unavailable",
      project_key: null,
      display_name: null,
      active: false,
      selection_revision: null,
      root_availability: "not_available",
    },
    current_work: emptyWorkV01("current_work_unavailable"),
    managed_execution: emptyExecutionV01("unavailable_or_inconsistent", reason),
    latest_result: emptyResultV01("result_unavailable", "unavailable_or_ambiguous"),
    review_continuity: {
      state: "review_source_unavailable_or_inconsistent",
      summary: "Review continuity is unavailable because the current project source is unavailable.",
      decision_kind: null,
      transition_currentness: "not_available",
    },
    next_action: actionV01("unavailable", "Current project is unavailable", reason, false),
    gaps: [reason],
  };
}

function emptyWorkV01(status: "no_current_work" | "current_work_unavailable"): CodexCurrentContinuityV01["current_work"] {
  return {
    status,
    goal: null,
    success_criteria: [],
    non_goals: [],
    lineage_kind: null,
    currentness: status === "no_current_work" ? "not_available" : "unavailable_or_ambiguous",
    start_eligible: false,
    start_blocker: status === "no_current_work" ? "Current work has not been defined." : "Current work is unavailable.",
    revision_eligible: false,
    revision_blocker: status === "no_current_work" ? "There is no current work to revise." : "Current work is unavailable.",
  };
}

function emptyExecutionV01(
  stage: CodexCurrentContinuityExecutionStageV01,
  reason: string | null,
): CodexCurrentContinuityV01["managed_execution"] {
  return {
    stage,
    mode: null,
    latest_checkpoint: null,
    blocker_or_attention: reason,
    attention_required: stage === "unavailable_or_inconsistent",
    reconciliation_required: false,
    result_available: false,
    updated_at: null,
  };
}

function emptyResultV01(
  state: "no_result" | "result_unavailable",
  currentness: "not_available" | "unavailable_or_ambiguous",
): CodexCurrentContinuityV01["latest_result"] {
  return {
    state,
    currentness,
    outcome: null,
    execution_status: null,
    verification_status: null,
    summary: null,
    recorded_at: null,
    artifacts: [],
    checks: [],
    skipped_checks: [],
    blockers: [],
    warnings: [],
    gaps: [],
    incomplete_historical_fields: [],
    review_attention: null,
    proposed_next_steps: [],
  };
}

function unavailableSnapshotV01(): CodexCurrentContinuityV01["snapshot"] {
  return {
    binding_version: CODEX_CURRENT_CONTINUITY_SNAPSHOT_VERSION_V01,
    algorithm: "sha256",
    status: "unavailable",
    binding: null,
  };
}

function finalizeV01(
  projection: CodexCurrentContinuityV01,
  bindingMaterial: unknown | null,
): CodexCurrentContinuityV01 {
  const withBinding: CodexCurrentContinuityV01 = bindingMaterial === null
    ? { ...projection, snapshot: unavailableSnapshotV01() }
    : {
        ...projection,
        snapshot: {
          binding_version: CODEX_CURRENT_CONTINUITY_SNAPSHOT_VERSION_V01,
          algorithm: "sha256",
          status: "exact",
          binding: createCodexCurrentContinuitySnapshotBindingV01(bindingMaterial),
        },
      };
  assertCodexCurrentContinuityV01(withBinding);
  return withBinding;
}

export function createCodexCurrentContinuitySnapshotBindingV01(
  bindingMaterial: unknown,
): string {
  return createProtocolSha256V01(canonicalizeProtocolValueV01({
    binding_version: CODEX_CURRENT_CONTINUITY_SNAPSHOT_VERSION_V01,
    material: bindingMaterial,
  }));
}

export function assertCodexCurrentContinuityV01(
  projection: CodexCurrentContinuityV01,
): CodexCurrentContinuityV01 {
  requireTimestampV01(projection.generated_at);
  assertExactKeysV01(projection, [
    "projection_version", "generated_at", "source_status", "snapshot", "project",
    "current_work", "managed_execution", "latest_result", "review_continuity",
    "next_action", "authority", "gaps",
  ]);
  assertExactKeysV01(projection.snapshot, ["binding_version", "algorithm", "status", "binding"]);
  assertExactKeysV01(projection.project, ["status", "project_key", "display_name", "active", "selection_revision", "root_availability"]);
  assertExactKeysV01(projection.current_work, ["status", "goal", "success_criteria", "non_goals", "lineage_kind", "currentness", "start_eligible", "start_blocker", "revision_eligible", "revision_blocker"]);
  assertExactKeysV01(projection.managed_execution, ["stage", "mode", "latest_checkpoint", "blocker_or_attention", "attention_required", "reconciliation_required", "result_available", "updated_at"]);
  assertExactKeysV01(projection.latest_result, ["state", "currentness", "outcome", "execution_status", "verification_status", "summary", "recorded_at", "artifacts", "checks", "skipped_checks", "blockers", "warnings", "gaps", "incomplete_historical_fields", "review_attention", "proposed_next_steps"]);
  assertExactKeysV01(projection.review_continuity, ["state", "summary", "decision_kind", "transition_currentness"]);
  assertExactKeysV01(projection.next_action, ["kind", "label", "reason", "user_action_required", "executes"]);
  assertExactKeysV01(projection.authority, [
    "writes_database", "writes_project_files", "changes_project_selection",
    "changes_operator_session", "creates_run", "starts_codex_or_native_host",
    "calls_provider", "approves_host_action", "cancels_or_resumes_run",
    "creates_or_admits_result", "creates_proof_or_evidence", "creates_proposal",
    "creates_review_decision", "creates_or_applies_transition",
    "mutates_accepted_state", "retries_or_replays", "calls_github",
    "creates_branch_or_pr", "merges_releases_or_deploys",
    "starts_background_work",
  ]);
  if (projection.projection_version !== CODEX_CURRENT_CONTINUITY_VERSION_V01) throw new Error("codex_current_continuity_version_invalid");
  assertEnumV01(projection.source_status, ["exact", "partial", "unavailable"], "source_status");
  assertEnumV01(projection.project.status, ["no_workspace", "no_active_project", "inactive_project", "active_project", "active_project_root_unavailable", "project_source_unavailable"], "project_status");
  assertEnumV01(projection.project.root_availability, ["available", "missing", "inaccessible", "not_directory", "inspection_error", "not_available"], "root_availability");
  assertEnumV01(projection.current_work.status, ["no_current_work", "current_work", "stale_current_work", "current_work_unavailable", "current_work_ambiguous"], "work_status");
  assertEnumV01(projection.current_work.currentness, ["fresh", "stale", "unavailable_or_ambiguous", "not_available"], "work_currentness");
  assertEnumV01(projection.managed_execution.stage, ["no_run", "preparing", "running", "waiting_for_approval", "cancellation_requested", "reconciliation_required", "terminal_result_ready", "blocked", "failed", "cancelled", "timed_out", "unavailable_or_inconsistent"], "execution_stage");
  assertEnumV01(projection.latest_result.state, ["no_result", "result_unavailable", "result_present"], "result_state");
  assertEnumV01(projection.latest_result.currentness, ["current", "stale", "unavailable_or_ambiguous", "not_available"], "result_currentness");
  assertEnumV01(projection.review_continuity.state, ["no_proposal", "proposal_present_decision_pending", "decision_recorded", "accepted_decision_awaiting_transition", "transition_blocked", "transition_applied", "review_source_unavailable_or_inconsistent"], "review_state");
  if (projection.snapshot.binding_version !== CODEX_CURRENT_CONTINUITY_SNAPSHOT_VERSION_V01 || projection.snapshot.algorithm !== "sha256") throw new Error("codex_current_continuity_snapshot_contract_invalid");
  if (projection.snapshot.status === "exact" ? !/^sha256:[a-f0-9]{64}$/u.test(projection.snapshot.binding ?? "") : projection.snapshot.binding !== null) throw new Error("codex_current_continuity_snapshot_invalid");
  if ((projection.source_status === "exact") !== (projection.snapshot.status === "exact")) throw new Error("codex_current_continuity_source_snapshot_mismatch");
  if (projection.project.project_key !== null && !/^sha256:[a-f0-9]{64}$/u.test(projection.project.project_key)) throw new Error("codex_current_continuity_project_key_invalid");
  if (projection.project.selection_revision !== null && (!Number.isSafeInteger(projection.project.selection_revision) || projection.project.selection_revision < 0)) throw new Error("codex_current_continuity_selection_revision_invalid");
  assertBoundedNullableTextV01(projection.project.display_name, 256, "project_display_name");
  assertBoundedNullableTextV01(projection.current_work.goal, CODEX_CURRENT_CONTINUITY_LIMITS_V01.goal_characters, "goal");
  assertBoundedStringsV01(projection.current_work.success_criteria, CODEX_CURRENT_CONTINUITY_LIMITS_V01.detail_items, CODEX_CURRENT_CONTINUITY_LIMITS_V01.detail_characters, "success_criteria");
  assertBoundedStringsV01(projection.current_work.non_goals, CODEX_CURRENT_CONTINUITY_LIMITS_V01.detail_items, CODEX_CURRENT_CONTINUITY_LIMITS_V01.detail_characters, "non_goals");
  assertBoundedNullableTextV01(projection.current_work.start_blocker, CODEX_CURRENT_CONTINUITY_LIMITS_V01.result_item_characters, "start_blocker");
  assertBoundedNullableTextV01(projection.current_work.revision_blocker, CODEX_CURRENT_CONTINUITY_LIMITS_V01.result_item_characters, "revision_blocker");
  assertBoundedNullableTextV01(projection.managed_execution.latest_checkpoint, CODEX_CURRENT_CONTINUITY_LIMITS_V01.result_item_characters, "latest_checkpoint");
  assertBoundedNullableTextV01(projection.managed_execution.blocker_or_attention, CODEX_CURRENT_CONTINUITY_LIMITS_V01.result_item_characters, "execution_attention");
  if (projection.managed_execution.updated_at !== null) requireTimestampV01(projection.managed_execution.updated_at);
  if (projection.latest_result.recorded_at !== null) requireTimestampV01(projection.latest_result.recorded_at);
  assertBoundedNullableTextV01(projection.latest_result.summary, CODEX_CURRENT_CONTINUITY_LIMITS_V01.result_summary_characters, "result_summary");
  for (const value of [projection.latest_result.outcome, projection.latest_result.execution_status, projection.latest_result.verification_status]) assertBoundedNullableTextV01(value, 160, "result_status");
  for (const artifact of projection.latest_result.artifacts) {
    assertExactKeysV01(artifact, ["kind", "repository_relative_path", "summary", "change_kind", "basis"]);
    assertBoundedNullableTextV01(artifact.kind, 160, "artifact_kind");
    assertBoundedNullableTextV01(artifact.summary, CODEX_CURRENT_CONTINUITY_LIMITS_V01.result_item_characters, "artifact_summary");
  }
  for (const check of projection.latest_result.checks) {
    assertExactKeysV01(check, ["check", "status", "required", "summary"]);
    assertBoundedNullableTextV01(check.check, 240, "check_id");
    assertBoundedNullableTextV01(check.summary, CODEX_CURRENT_CONTINUITY_LIMITS_V01.result_item_characters, "check_summary");
  }
  for (const check of projection.latest_result.skipped_checks) {
    assertExactKeysV01(check, ["check", "required", "reason"]);
    assertBoundedNullableTextV01(check.check, 240, "skipped_check_id");
    assertBoundedNullableTextV01(check.reason, CODEX_CURRENT_CONTINUITY_LIMITS_V01.result_item_characters, "skipped_check_reason");
  }
  for (const [name, values] of Object.entries({
    blockers: projection.latest_result.blockers,
    warnings: projection.latest_result.warnings,
    result_gaps: projection.latest_result.gaps,
    incomplete_historical_fields: projection.latest_result.incomplete_historical_fields,
    proposed_next_steps: projection.latest_result.proposed_next_steps,
  })) assertBoundedStringsV01(values, CODEX_CURRENT_CONTINUITY_LIMITS_V01.result_items, CODEX_CURRENT_CONTINUITY_LIMITS_V01.result_item_characters, name);
  assertBoundedStringsV01(projection.gaps, CODEX_CURRENT_CONTINUITY_LIMITS_V01.gaps, CODEX_CURRENT_CONTINUITY_LIMITS_V01.result_item_characters, "gaps");
  assertBoundedNullableTextV01(projection.review_continuity.summary, CODEX_CURRENT_CONTINUITY_LIMITS_V01.result_item_characters, "review_summary");
  assertBoundedNullableTextV01(projection.next_action.label, CODEX_CURRENT_CONTINUITY_LIMITS_V01.result_item_characters, "next_action_label");
  assertBoundedNullableTextV01(projection.next_action.reason, CODEX_CURRENT_CONTINUITY_LIMITS_V01.result_item_characters, "next_action_reason");
  if (Object.values(projection.authority).some((value) => value !== false)) throw new Error("codex_current_continuity_authority_invalid");
  if (projection.next_action.executes !== false) throw new Error("codex_current_continuity_action_authority_invalid");
  if (projection.current_work.start_eligible && (projection.current_work.status !== "current_work" || projection.current_work.currentness !== "fresh" || !projection.project.active || projection.project.root_availability !== "available")) throw new Error("codex_current_continuity_start_eligibility_invalid");
  if (projection.latest_result.currentness === "current" && projection.latest_result.state !== "result_present") throw new Error("codex_current_continuity_result_currentness_invalid");
  if (projection.gaps.length > CODEX_CURRENT_CONTINUITY_LIMITS_V01.gaps) throw new Error("codex_current_continuity_gap_bound_exceeded");
  if (Buffer.byteLength(JSON.stringify(projection), "utf8") > CODEX_CURRENT_CONTINUITY_LIMITS_V01.serialized_bytes) throw new Error("codex_current_continuity_size_bound_exceeded");
  return projection;
}

function assertExactKeysV01(value: object, keys: readonly string[]): void {
  if (canonicalizeProtocolValueV01(Object.keys(value).sort()) !== canonicalizeProtocolValueV01([...keys].sort())) {
    throw new Error("codex_current_continuity_keys_invalid");
  }
}

function assertEnumV01(value: string, allowed: readonly string[], name: string): void {
  if (!allowed.includes(value)) throw new Error(`codex_current_continuity_${name}_invalid`);
}

function assertBoundedNullableTextV01(
  value: string | null,
  maximum: number,
  name: string,
): void {
  if (value === null) return;
  if (!value.trim() || [...value].length > maximum || value !== value.trim() || /\s{2,}/u.test(value)) {
    throw new Error(`codex_current_continuity_${name}_invalid`);
  }
}

function assertBoundedStringsV01(
  values: string[],
  maximumItems: number,
  maximumCharacters: number,
  name: string,
): void {
  if (values.length > maximumItems || new Set(values).size !== values.length) {
    throw new Error(`codex_current_continuity_${name}_invalid`);
  }
  for (const value of values) assertBoundedNullableTextV01(value, maximumCharacters, name);
}

function repositoryRelativeArtifactPathV01(ref: ProjectRunResultDetailV01["artifacts"][number]["artifact_ref"]): string | null {
  if (!externalRefUsesRepositoryRelativePathV01(ref)) return null;
  try {
    const value = canonicalizeRepositoryRelativePathV01(ref.external_id);
    return value === ref.external_id ? value : null;
  } catch {
    return null;
  }
}

function issueSummariesV01(values: Array<{ summary: string }>): string[] {
  return boundedStringsV01(
    values.map((value) => value.summary),
    CODEX_CURRENT_CONTINUITY_LIMITS_V01.result_items,
    CODEX_CURRENT_CONTINUITY_LIMITS_V01.result_item_characters,
  );
}

function boundedStringsV01(values: string[], maximum: number, characters: number): string[] {
  const result: string[] = [];
  for (const value of values) {
    const bounded = boundedTextV01(value, characters);
    if (bounded && !result.includes(bounded)) result.push(bounded);
    if (result.length >= maximum) break;
  }
  return result;
}

function boundedTextV01(
  value: unknown,
  maximum: number = CODEX_CURRENT_CONTINUITY_LIMITS_V01.result_item_characters,
): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(/\s+/gu, " ");
  if (!normalized) return null;
  return [...normalized].slice(0, maximum).join("").trimEnd();
}

function stringValueV01(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function integerValueV01(value: unknown): number | null {
  return Number.isSafeInteger(value) && Number(value) >= 0 ? Number(value) : null;
}

function requireTimestampV01(value: string): void {
  if (parseStrictIsoTimestampV01(value) === null) throw new Error("codex_current_continuity_timestamp_invalid");
}

function revisionReasonV01(reason: ProjectWorkInitializationV01["revision_eligibility"]["reason"]): string {
  const copy: Record<typeof reason, string> = {
    current_initial_packet_zero_history: "Current initial work may be revised before execution.",
    current_revision_packet_zero_history: "Current revised work may be revised again before execution.",
    managed_run_history_present: "Work revision closes after managed execution history exists.",
    durable_work_history_present: "Work revision closes after durable work history exists.",
    current_packet_stale_or_unavailable: "The current work packet is stale or unavailable.",
    project_inactive: "The project is not active.",
    project_unavailable: "The canonical project is unavailable.",
    root_unavailable: "The project folder is unavailable.",
    revision_chain_invalid: "The append-only revision chain is invalid.",
    revision_limit_reached: "The bounded revision limit was reached.",
    source_unavailable: "Revision eligibility could not be read.",
  };
  return copy[reason];
}

function startBlockerCopyV01(code: string | null): string | null {
  if (code === null) return null;
  const copy: Record<string, string> = {
    project_inactive: "The project is not active.",
    root_unavailable: "The project folder is unavailable.",
    operator_configuration_unavailable:
      "The local managed-work configuration is unavailable for this project.",
    no_current_work: "Current work has not been defined.",
    current_work_not_exact: "Current work cannot be proven fresh.",
    current_work_not_fresh: "Current work must be refreshed before it can start.",
  };
  return copy[code] ?? "Current work cannot start from this exact state.";
}

function workResolutionGapV01(
  reason: ProjectWorkInitializationV01["reason"],
): string {
  const copy: Partial<Record<ProjectWorkInitializationV01["reason"], string>> = {
    multiple_current_packet_candidates:
      "More than one current work packet candidate exists.",
    malformed_packet_record:
      "A durable work packet record is malformed.",
    invalid_revision_lineage:
      "The append-only work revision lineage is invalid.",
    invalid_semantic_transition_lineage:
      "The semantic-transition work lineage is invalid.",
    invalid_packet_lineage:
      "A durable work packet lineage cannot be validated.",
    superseded_work_without_current_packet:
      "Durable work is provably superseded without a current packet.",
    durable_history_without_current_packet:
      "Durable work history exists without one provable current packet.",
  };
  return copy[reason] ?? "Current work cannot be resolved from canonical history.";
}
