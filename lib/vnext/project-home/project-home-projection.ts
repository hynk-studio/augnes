import type Database from "better-sqlite3";

import { sanitizeRepositoryRemoteV01 } from "@/lib/vnext/onboarding/local-project-onboarding";
import {
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01,
  countVNextSemanticStateEntriesV01,
  deriveVNextSemanticTargetKeyV01,
  listRecentVNextSemanticStateEntriesV01,
  listVNextCoreRecordsV01,
  readVNextCoreRecordV01,
  rebuildVNextPersistedSemanticStateV01,
  type VNextCoreRecordEnvelopeV01,
  type VNextSemanticStateProjectionEntryV01,
} from "@/lib/vnext/persistence/durable-semantic-store";
import {
  listProjectExternalRefsV01,
  readCanonicalProjectIdentityV01,
  readCanonicalProjectWithRootV01,
  readDefaultWorkspaceIdentityV01,
} from "@/lib/vnext/persistence/project-identity-registry";
import { readActiveProjectSelectionV01 } from "@/lib/vnext/persistence/project-lifecycle-registry";
import {
  readPersonalPerspectiveEffectiveScopeV01,
  readProjectAutomationEffectiveStatusV01,
} from "@/lib/vnext/persistence/project-control-store";
import {
  isPersonalPerspectiveSelectedEntryV01,
} from "@/lib/vnext/project-controls/project-controls";
import {
  readBoundedAutomationCycleProjectionV01,
  type BoundedAutomationHostContractV01,
} from "@/lib/vnext/runtime/bounded-automation-cycle";
import {
  CODEX_APP_SERVER_ADAPTER_VERSION_V01,
  CODEX_APP_SERVER_CAPABILITY_VERSION_V01,
} from "@/lib/vnext/native-host/codex-app-server-adapter";
import { DEFAULT_LIVE_TIMEOUT_MS } from "@/lib/vnext/runtime/live-native-host-run-service";
import type { VNextLocalOperatorPilotConfigV01 } from "@/lib/vnext/runtime/local-operator-session";
import {
  canonicalizeProtocolValueV01,
  compareProtocolCodeUnitsV01,
  parseStrictIsoTimestampV01,
} from "@/lib/vnext/protocol-primitives";
import { validateEpisodeDeltaProposalV01 } from "@/lib/vnext/episode-delta-proposal";
import { readDefaultModelGatewayLocalCapabilityV01 } from "@/lib/vnext/model-gateway/model-gateway";
import {
  createEpisodeDeltaCandidateFingerprintV01,
  validateReviewDecisionAgainstEpisodeDeltaProposalV01,
  validateReviewDecisionV01,
} from "@/lib/vnext/review-decision";
import { validateRunReceiptV01 } from "@/lib/vnext/run-receipt";
import { loadValidatedVNextSemanticTransitionRelationV01 } from "@/lib/vnext/runtime/durable-semantic-transition";
import { inspectVNextOperatorPilotCandidateAdmissionV01 } from "@/lib/vnext/runtime/operator-pilot-policy";
import {
  projectVNextOperatorPilotContinuityV01,
  resolveVNextOperatorPilotPendingContextUseReviewV01,
} from "@/lib/vnext/runtime/operator-pilot-project-continuity";
import {
  readProjectRunResultDetailV01,
  readProjectRunResultOverviewV01,
} from "@/lib/vnext/runtime/project-run-result-read-model";
import {
  createProjectReviewWorkbenchEntryV01,
  createProposalWorkbenchEntryV01,
  createRunResultWorkbenchEntryV01,
} from "@/lib/vnext/runtime/semantic-workbench-entry";
import { validateTaskContextPacketV01 } from "@/lib/vnext/task-context-packet";
import { readRootAvailabilityV01 } from "@/lib/vnext/onboarding/local-project-onboarding";
import type { EpisodeDeltaProposalV01 } from "@/types/vnext/episode-delta-proposal";
import type { ReviewDecisionV01 } from "@/types/vnext/review-decision";
import type { RunReceiptV01 } from "@/types/vnext/run-receipt";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";
import {
  PROJECT_HOME_CAPABILITIES_V01,
  PROJECT_HOME_PROJECTION_VERSION_V01,
  PROJECT_HOME_SECTION_STATE_VERSION_V01,
  type ProjectHomeAcceptedStateSummaryV01,
  type ProjectHomeActivityItemV01,
  type ProjectHomeCapabilitiesSummaryV01,
  type ProjectHomeCapabilityStatusV01,
  type ProjectHomeCapabilityV01,
  type ProjectHomeLineageAnchorV01,
  type ProjectHomeLineageKindV01,
  type ProjectHomeNextMoveV01,
  type ProjectHomePendingAttentionItemV01,
  type ProjectHomePendingAttentionV01,
  type ProjectHomeProjectionV01,
  type ProjectHomeRecentActivityV01,
  type ProjectHomeRunResultsV01,
  type ProjectHomeSectionStateV01,
  type ProjectHomeWorkingProjectionSummaryV01,
} from "@/types/vnext/project-home";
import type { ProjectRootAvailabilityV01 } from "@/types/vnext/project-onboarding";
import type { BoundedAutomationCycleProjectionV01 } from "@/types/vnext/bounded-automation-cycle";
import type { SemanticWorkbenchEntryOriginV01 } from "@/types/vnext/semantic-workbench";

const ACCEPTED_STATE_LIMIT = 5;
const ATTENTION_LIMIT = 5;
const ACTIVITY_LIMIT = 5;
const NEXT_MOVE_LIMIT = 3;
const PROPOSAL_SCAN_LIMIT = 64;
const DECISION_SCAN_LIMIT = 128;
const TRANSITION_SCAN_LIMIT = 128;
const ACTIVITY_SCAN_LIMIT = 24;
const SUMMARY_LIMIT = 320;
const TASK_DETAIL_LIMIT = 6;
const PERSONAL_BASIS_LIMIT = 3;

const DEFAULT_CAPABILITY_SUMMARIES: Record<ProjectHomeCapabilityV01, string> = {
  openai: "No trusted local OpenAI readiness status is available.",
  codex_native_host: "No trusted local Codex or native-host readiness status is available.",
  github: "No trusted local GitHub readiness status is available.",
  mcp: "No trusted local MCP readiness status is available.",
  scheduler: "No trusted local scheduler readiness status is available.",
};

function automationAdmissionFromCycle(
  cycle: BoundedAutomationCycleProjectionV01,
): {
  status: import("@/types/vnext/project-controls").ProjectAutomationAdmissionStatusV01;
  reason: string;
} {
  const status =
    cycle.status === "eligible"
      ? "eligible"
      : cycle.status === "not_configured"
        ? "not_configured"
        : cycle.status === "disabled"
          ? "disabled"
          : cycle.status === "paused"
            ? "paused"
            : cycle.status === "grant_required" ||
                cycle.status === "grant_expired"
              ? "grant_required"
              : cycle.status === "capability_unavailable"
                ? "capability_unavailable"
                : [
                      "starting",
                      "running",
                      "cancellation_requested",
                      "reconciliation_required",
                      "review_needed",
                    ].includes(cycle.status)
                  ? "active_run_limit"
                  : cycle.status === "policy_denied"
                    ? "policy_denied"
                    : "unsupported";
  return { status, reason: cycle.stop_reason };
}

function automationSectionStateV01(
  control: import("@/types/vnext/project-controls").ProjectAutomationEffectiveStatusV01,
  cycle: BoundedAutomationCycleProjectionV01,
): ProjectHomeSectionStateV01 {
  if (control.status === "not_configured") {
    return sectionState(
      "not_configured",
      "Project automation is not configured.",
    );
  }
  if (control.status === "disabled") {
    return sectionState("action_required", "Project automation is disabled.");
  }
  if (control.status === "paused") {
    return sectionState(
      "action_required",
      "Project automation is paused for new policy-triggered work.",
    );
  }
  const requiresAttention = [
    "work_ambiguous",
    "grant_required",
    "grant_expired",
    "capability_unavailable",
    "policy_denied",
    "cancellation_requested",
    "cancelled",
    "timed_out",
    "failed",
    "proposal_settlement_pending",
    "proposal_settlement_failed",
    "reconciliation_required",
    "review_needed",
  ].includes(cycle.status);
  return sectionState(
    requiresAttention ? "action_required" : "available",
    requiresAttention
      ? `Bounded automation requires attention: ${cycle.stop_reason.replaceAll("_", " ")}.`
      : cycle.status === "no_eligible_work"
        ? "Bounded automation is enabled; no eligible work is currently queued."
        : cycle.status === "eligible"
          ? "One bounded automation cycle is eligible to run."
          : "Bounded automation is active within the current project policy.",
  );
}

function boundedAutomationUnavailableV01(
  input: { workspace_id: string; project_id: string },
  control: import("@/types/vnext/project-controls").ProjectAutomationEffectiveStatusV01,
): BoundedAutomationCycleProjectionV01 {
  const status =
    control.status === "not_configured"
      ? "not_configured"
      : control.status === "disabled"
        ? "disabled"
      : control.status === "paused"
          ? "paused"
          : "grant_required";
  return {
    projection_version: "bounded_automation_cycle_projection.v0.1",
    ...input,
    status,
    stop_reason:
      status === "grant_required"
        ? "local_operator_runtime_unavailable"
        : `automation_${status}`,
    retryable: false,
    control_revision: control.control_revision,
    work_source: null,
    grant: null,
    budget: {
      budget_version: "bounded_automation_budget.v0.1",
      max_work_items: 1,
      max_active_runs: 1,
      max_attempts: 1,
      max_runtime_ms: DEFAULT_LIVE_TIMEOUT_MS,
      max_commands: 128,
      max_augnes_model_invocations: 0,
      max_augnes_model_tokens: 0,
      max_augnes_model_cost_units: 0,
      native_host_model_scope: "none",
      host_egress: "local_in_process_only",
      network_access: "denied",
      automatic_retry: false,
    },
    run: null,
    review_proposal_id: null,
    feedback_needed: false,
    feedback_proposal_id: null,
    feedback_href: null,
    next_action:
      status === "not_configured" || status === "disabled"
        ? "enable"
        : status === "paused"
          ? "resume"
          : "none",
    model_calls_allowed: 0,
    semantic_authority_granted: false,
    decision_created: false,
    transition_created: false,
  };
}

export type ProjectHomeCapabilityStatusReaderV01 = () =>
  | readonly ProjectHomeCapabilityStatusV01[]
  | Promise<readonly ProjectHomeCapabilityStatusV01[]>;

export interface ProjectHomeProjectionDependenciesV01 {
  now?: () => string;
  read_root_availability?: (root: string) => Promise<ProjectRootAvailabilityV01>;
  read_capability_statuses?: ProjectHomeCapabilityStatusReaderV01;
  operator_config?: VNextLocalOperatorPilotConfigV01 | null;
  automation_host_contract?: BoundedAutomationHostContractV01;
}

export class ProjectHomeProjectionErrorV01 extends Error {
  constructor(readonly code: "project_not_found" | "project_scope_conflict") {
    super(code);
    this.name = "ProjectHomeProjectionErrorV01";
  }
}

export function readProjectHomeEntryDestinationV01(
  db: Database.Database,
): string {
  const workspace = readDefaultWorkspaceIdentityV01(db);
  if (!workspace) return "/projects";
  const active = readActiveProjectSelectionV01(db, workspace.workspace_id);
  if (!active) return "/projects";
  const project = readCanonicalProjectIdentityV01(db, {
    workspace_id: workspace.workspace_id,
    project_id: active.project_id,
  });
  return project ? projectDestination(project.project_id) : "/projects";
}

export async function readProjectHomeProjectionV01(
  db: Database.Database,
  input: { workspace_id: string; project_id: string },
  dependencies: ProjectHomeProjectionDependenciesV01 = {},
): Promise<ProjectHomeProjectionV01> {
  const evaluationTimestamp = (
    dependencies.now ?? (() => new Date().toISOString())
  )();
  const evaluationMilliseconds = parseStrictIsoTimestampV01(
    evaluationTimestamp,
  );
  if (evaluationMilliseconds === null) {
    throw new Error("project_home_evaluation_timestamp_invalid");
  }
  const evaluation = {
    timestamp: evaluationTimestamp,
    milliseconds: evaluationMilliseconds,
  };

  const registration = readCanonicalProjectWithRootV01(db, input);
  if (!registration) throw new ProjectHomeProjectionErrorV01("project_not_found");
  if (registration.project.workspace_id !== input.workspace_id) {
    throw new ProjectHomeProjectionErrorV01("project_scope_conflict");
  }

  const activeSelection = readActiveProjectSelectionV01(db, input.workspace_id);
  const rootAvailability = await (
    dependencies.read_root_availability ?? readRootAvailabilityV01
  )(registration.root_binding.local_root.normalized_path);
  const repository = readRepositorySummary(db, input);
  const acceptedState = readSectionSafely(
    () => readAcceptedState(db, input),
    acceptedStateError,
  );
  const workingProjection = readSectionSafely(
    () => readWorkingProjection(db, input, evaluation.timestamp),
    workingProjectionError,
  );
  const taskFrame = readSectionSafely(
    () => readTaskFrame(db, input, evaluation.timestamp),
    taskFrameError,
  );
  const proposalAttention = readSectionSafely(
    () => readPendingAttention(db, input, evaluation),
    attentionError,
  );
  const recentActivity = readSectionSafely(
    () => readRecentActivity(db, input),
    activityError,
  );
  const runResults = readSectionSafely(
    () => projectHomeRunResultsV01(db, input),
    runResultsError,
  );
  const capabilities = await readCapabilitiesSafely(
    dependencies.read_capability_statuses,
  );
  const projectSummary = {
    project: registration.project,
    root_binding: registration.root_binding,
    root_availability: rootAvailability,
    repository,
    is_active: activeSelection?.project_id === input.project_id,
    active_selection: activeSelection,
  } satisfies ProjectHomeProjectionV01["project_summary"];
  const effectiveAutomation = readProjectAutomationEffectiveStatusV01(
    db,
    input,
  );
  const automationCycle =
    dependencies.operator_config?.workspace_id === input.workspace_id &&
    dependencies.operator_config.project_id === input.project_id
      ? readBoundedAutomationCycleProjectionV01(db, {
          config: dependencies.operator_config,
          observed_at: evaluation.timestamp,
          host: dependencies.automation_host_contract ?? {
            adapter_version: CODEX_APP_SERVER_ADAPTER_VERSION_V01,
            capability_version: CODEX_APP_SERVER_CAPABILITY_VERSION_V01,
            timeout_ms: DEFAULT_LIVE_TIMEOUT_MS,
            execution_profile: "native_host_managed_model",
            provider_egress: "native_host_managed",
          },
        })
      : boundedAutomationUnavailableV01(input, effectiveAutomation);
  const automationAdmission = automationAdmissionFromCycle(automationCycle);
  const automation = {
    state: automationSectionStateV01(effectiveAutomation, automationCycle),
    status: effectiveAutomation.status,
    control_revision: effectiveAutomation.control_revision,
    updated_at: effectiveAutomation.updated_at,
    policy_summary: effectiveAutomation.policy_summary,
    policy_control_eligible:
      effectiveAutomation.policy_triggered_work_allowed_at_control_layer,
    admission_status: automationAdmission.status,
    admission_reason: automationAdmission.reason,
    current_run_summary: automationCycle.run,
    cycle: automationCycle,
  } satisfies ProjectHomeProjectionV01["automation"];
  const effectivePersonalPerspective =
    readPersonalPerspectiveEffectiveScopeV01(db, input);
  const personalPerspectiveTaskBasis = readSectionSafely(
    () =>
      readPersonalPerspectiveTaskBasis(
        db,
        input,
        evaluation.timestamp,
      ),
    () => null,
  );
  const personalPerspective = {
    state: sectionState(
      effectivePersonalPerspective.status === "not_configured"
        ? "not_configured"
        : effectivePersonalPerspective.status === "included"
          ? "available"
          : "action_required",
      effectivePersonalPerspective.explanation,
    ),
    status: effectivePersonalPerspective.status,
    scope_revision: effectivePersonalPerspective.scope_revision,
    updated_at: effectivePersonalPerspective.updated_at,
    effectively_included: effectivePersonalPerspective.effectively_included,
    effective_context_behavior:
      effectivePersonalPerspective.effective_context_behavior,
    explanation: effectivePersonalPerspective.explanation,
    task_selected_count: personalPerspectiveTaskBasis?.selected_count ?? 0,
    task_basis: personalPerspectiveTaskBasis,
  } satisfies ProjectHomeProjectionV01["personal_perspective"];
  const attention = readSectionSafely(
    () =>
      composeProjectAttentionV01({
        db,
        input,
        operator_config:
          dependencies.operator_config?.workspace_id === input.workspace_id &&
          dependencies.operator_config.project_id === input.project_id
            ? dependencies.operator_config
            : null,
        proposal_attention: proposalAttention,
        run_results: runResults,
        automation,
        working_projection: workingProjection,
        evaluation_timestamp: evaluation.timestamp,
      }),
    attentionError,
  );
  const primaryAction = projectSummary.is_active
    ? attention.items.find((item) => item.workbench_entry)?.workbench_entry ??
      runResults.workbench_entry ??
      createProjectReviewWorkbenchEntryV01({
        ...input,
        reason: "Open the project-scoped semantic review queue.",
        review_required: false,
      })
    : null;
  const coordinationState = projectCoordinationStateV01({
    accepted_state: acceptedState.state,
    working_projection: workingProjection.state,
    task_frame: taskFrame.state,
    attention: attention.state,
    recent_activity: recentActivity.state,
    run_results: runResults.state,
    automation: automation.state,
    attention_count: attention.total_count,
  });
  const coordination = {
    state: coordinationState,
    task_frame: taskFrame,
    active_work: {
      current_run_active: runResults.current_run !== null,
      current_run_mode: runResults.current_run?.mode ?? null,
      automation_status: automation.cycle.status,
      automation_work_label: automation.cycle.work_source?.label ?? null,
      latest_result_available: runResults.latest_result !== null,
    },
    attention_count: attention.total_count,
    decision_debt_count:
      attention.decision_debt.pending_candidate_count +
      attention.decision_debt.accepted_awaiting_transition_count +
      attention.decision_debt.deferred_candidate_count,
    tension_count: taskFrame.tensions.length + taskFrame.risks.length,
    gap_count: taskFrame.gaps.length,
    personal_perspective_affected_task: personalPerspective.task_basis !== null,
    primary_action: primaryAction,
    projection_only: true,
    semantic_authority_granted: false,
  } satisfies ProjectHomeProjectionV01["coordination"];

  return {
    project_home_projection_version: PROJECT_HOME_PROJECTION_VERSION_V01,
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    generated_at: evaluation.timestamp,
    project_summary: projectSummary,
    accepted_state: acceptedState,
    working_projection: workingProjection,
    coordination,
    attention,
    recent_activity: recentActivity,
    run_results: runResults,
    automation,
    personal_perspective: personalPerspective,
    capabilities,
    next_moves: buildNextMoves({
      project_id: input.project_id,
      root_availability: rootAvailability,
      is_active: projectSummary.is_active,
      accepted_state: acceptedState,
      attention,
      primary_action: primaryAction,
      automation_status: automation.status,
      personal_perspective_status: personalPerspective.status,
    }),
    limits: {
      accepted_state_items: ACCEPTED_STATE_LIMIT,
      attention_items: ATTENTION_LIMIT,
      recent_activity_items: ACTIVITY_LIMIT,
      next_moves: NEXT_MOVE_LIMIT,
    },
  };
}

export async function readProjectHomeCapabilityStatusesV01(
  reader?: ProjectHomeCapabilityStatusReaderV01,
): Promise<ProjectHomeCapabilitiesSummaryV01> {
  const supplied = reader
    ? await reader()
    : [
        {
          capability: "openai" as const,
          ...readDefaultModelGatewayLocalCapabilityV01(),
        },
      ];
  const byCapability = new Map<ProjectHomeCapabilityV01, ProjectHomeCapabilityStatusV01>();
  for (const item of supplied) {
    if (!PROJECT_HOME_CAPABILITIES_V01.includes(item.capability)) continue;
    if (byCapability.has(item.capability)) continue;
    byCapability.set(item.capability, normalizeCapability(item));
  }
  const items = PROJECT_HOME_CAPABILITIES_V01.map(
    (capability): ProjectHomeCapabilityStatusV01 =>
      byCapability.get(capability) ?? {
        capability,
        status: "unavailable",
        summary: DEFAULT_CAPABILITY_SUMMARIES[capability],
        verification: "not_remotely_verified",
      },
  );
  return {
    state: sectionState(
      "available",
      "Capability status is local-only and does not contact external services.",
    ),
    items,
  };
}

function readRepositorySummary(
  db: Database.Database,
  input: { workspace_id: string; project_id: string },
) {
  const binding = listProjectExternalRefsV01(db, input).find(
    (item) => item.external_ref.ref_type === "repository_remote",
  );
  if (!binding) return null;
  const display = sanitizeRepositoryRemoteV01(binding.external_ref.external_id);
  if (!display) return null;
  return { display, host: safeRepositoryHost(display) };
}

function readAcceptedState(
  db: Database.Database,
  input: { workspace_id: string; project_id: string },
): ProjectHomeAcceptedStateSummaryV01 {
  const totalCount = countVNextSemanticStateEntriesV01(db, input);
  if (totalCount === 0) {
    return {
      state: sectionState(
        "empty",
        "No approved project state has been committed for this project.",
      ),
      total_count: 0,
      items: [],
    };
  }
  const entries = listRecentVNextSemanticStateEntriesV01(db, {
    ...input,
    limit: ACCEPTED_STATE_LIMIT,
  });
  const items = entries.map((entry) => readAcceptedStateItem(db, input, entry));
  return {
    state: sectionState(
      "available",
      totalCount > items.length
        ? `Showing ${items.length} of ${totalCount} approved state entries.`
        : `${totalCount} approved state ${totalCount === 1 ? "entry" : "entries"}.`,
    ),
    total_count: totalCount,
    items,
  };
}

function readAcceptedStateItem(
  db: Database.Database,
  input: { workspace_id: string; project_id: string },
  entry: VNextSemanticStateProjectionEntryV01,
) {
  const stateRecord = readVNextCoreRecordV01(db, {
    record_kind: "semantic_state",
    record_id: entry.state_ref.external_id,
    ...input,
  });
  if (!stateRecord) throw new Error("project_home_semantic_state_record_missing");
  const state = rebuildVNextPersistedSemanticStateV01(stateRecord.payload);
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01(stateRecord, {
    workspace_id: state.workspace_id,
    project_id: state.project_id,
    fingerprint: state.integrity.fingerprint,
  });
  const transition = loadValidatedVNextSemanticTransitionRelationV01(db, {
    ...input,
    transition_receipt_id: entry.source_transition_receipt_id,
    transition_receipt_fingerprint: entry.source_transition_receipt_fingerprint,
  });
  const effect = transition.receipt.effects.find(
    (item) => deriveVNextSemanticTargetKeyV01(item.target_ref) === entry.target_key,
  );
  if (
    !effect ||
    effect.after_state.presence !== "present" ||
    !effect.after_state.state_ref ||
    canonicalizeProtocolValueV01(effect.after_state.state_ref) !==
      canonicalizeProtocolValueV01(entry.state_ref) ||
    state.semantic_state_record_id !== stateRecord.record_id ||
    state.created_at !== stateRecord.created_at ||
    state.workspace_id !== input.workspace_id ||
    state.project_id !== input.project_id ||
    state.target_key !== entry.target_key ||
    state.state_content_fingerprint !== entry.state_fingerprint ||
    state.bounded_state_summary !== entry.bounded_state_summary ||
    state.source_proposal_id !== transition.proposal.proposal_id ||
    state.source_proposal_fingerprint !== transition.proposal.integrity.fingerprint ||
    state.source_decision_id !== transition.decision.decision_id ||
    state.source_decision_fingerprint !== transition.decision.integrity.fingerprint ||
    entry.updated_at !== transition.receipt.recorded_at
  ) {
    throw new Error("project_home_semantic_state_lineage_mismatch");
  }
  return {
    summary: safeSummary(entry.bounded_state_summary),
    updated_at: entry.updated_at,
    revision: entry.revision,
    lineage: [
      lineage("episode_delta_proposal", transition.proposal.proposal_id, "source_proposal", transition.proposal.created_at),
      lineage("review_decision", transition.decision.decision_id, "decision", transition.decision.decided_at),
      lineage("state_transition_receipt", transition.receipt.transition_receipt_id, "durable_transition", transition.receipt.recorded_at),
      lineage("semantic_state", state.semantic_state_record_id, "accepted_state", state.created_at),
    ],
  };
}

function readWorkingProjection(
  db: Database.Database,
  input: { workspace_id: string; project_id: string },
  evaluationTimestamp: string,
): ProjectHomeWorkingProjectionSummaryV01 {
  const record = listVNextCoreRecordsV01(db, {
    ...input,
    record_kinds: ["task_context_packet"],
    limit: 1,
  })[0];
  if (!record) return emptyWorkingProjection();
  const packetResult = validatedPacket(record, input, evaluationTimestamp);
  if (packetResult.status === "expired") return expiredWorkingProjection();
  const packet = packetResult.packet;
  if (!packet.current_projection) return emptyWorkingProjection();
  return {
    state: sectionState(
      "available",
      "This is selected working context, not approved project state.",
    ),
    projection_kind: "selected_working_context",
    summary: safeSummary(packet.current_projection.bounded_summary),
    generated_at: packet.generated_at,
    source_currentness: packet.current_projection.currentness.status,
    source_perspective_ref: safeOptionalReference(
      packet.current_projection.perspective_ref,
    ),
    source_revision: null,
    lineage: [
      lineage(
        "task_context_packet",
        packet.packet_id,
        "selected_working_context",
        packet.generated_at,
      ),
    ],
  };
}

function readTaskFrame(
  db: Database.Database,
  input: { workspace_id: string; project_id: string },
  evaluationTimestamp: string,
): ProjectHomeProjectionV01["coordination"]["task_frame"] {
  const record = listVNextCoreRecordsV01(db, {
    ...input,
    record_kinds: ["task_context_packet"],
    limit: 1,
  })[0];
  if (!record) {
    return {
      state: sectionState(
        "empty",
        "No current TaskContextPacket is available for this project.",
      ),
      goal: null,
      success_criteria: [],
      non_goals: [],
      required_checks: [],
      forbidden_actions: [],
      tensions: [],
      risks: [],
      gaps: [],
      selected_context_count: 0,
      excluded_context_count: 0,
      packet_generated_at: null,
      packet_currentness: null,
    };
  }
  const packetResult = validatedPacket(record, input, evaluationTimestamp);
  const packet = packetResult.packet;
  return {
    state: sectionState(
      packetResult.status === "expired" ||
        packet.source_status.currentness.status === "stale"
        ? "action_required"
        : "available",
      packetResult.status === "expired"
        ? "The latest selected working context is expired and must not be treated as current."
        : "Task intent and selected working context are available from the latest exact packet.",
    ),
    goal: safeSummary(packet.task.goal),
    success_criteria: packet.task.success_criteria
      .slice(0, TASK_DETAIL_LIMIT)
      .map(safeSummary),
    non_goals: packet.task.non_goals
      .slice(0, TASK_DETAIL_LIMIT)
      .map(safeSummary),
    required_checks: packet.constraints.required_checks
      .slice(0, TASK_DETAIL_LIMIT)
      .map(safeSummary),
    forbidden_actions: packet.constraints.forbidden_actions
      .slice(0, TASK_DETAIL_LIMIT)
      .map(safeSummary),
    tensions: packet.tensions
      .slice(0, TASK_DETAIL_LIMIT)
      .map((item) => safeSummary(item.summary)),
    risks: packet.risks
      .slice(0, TASK_DETAIL_LIMIT)
      .map((item) => safeSummary(item.summary)),
    gaps: packet.gaps
      .slice(0, TASK_DETAIL_LIMIT)
      .map((item) => safeSummary(item.summary)),
    selected_context_count: packet.selected_context.length,
    excluded_context_count: packet.excluded_context.length,
    packet_generated_at: packet.generated_at,
    packet_currentness:
      packetResult.status === "expired"
        ? "stale"
        : packet.source_status.currentness.status,
  };
}

function readPendingAttention(
  db: Database.Database,
  input: { workspace_id: string; project_id: string },
  evaluation: { timestamp: string; milliseconds: number },
): ProjectHomePendingAttentionV01 {
  const proposalRecords = listVNextCoreRecordsV01(db, {
    ...input,
    record_kinds: ["episode_delta_proposal"],
    limit: PROPOSAL_SCAN_LIMIT + 1,
  });
  if (proposalRecords.length > PROPOSAL_SCAN_LIMIT) {
    throw new Error("project_home_proposal_scan_bound_exceeded");
  }
  const decisionRecords = listVNextCoreRecordsV01(db, {
    ...input,
    record_kinds: ["review_decision"],
    limit: DECISION_SCAN_LIMIT + 1,
  });
  if (decisionRecords.length > DECISION_SCAN_LIMIT) {
    throw new Error("project_home_decision_scan_bound_exceeded");
  }
  const decisions = decisionRecords.map((record) => validatedDecision(record, input));
  validateDecisionLineageForProjection(decisions);
  const transitionRecords = listVNextCoreRecordsV01(db, {
    ...input,
    record_kinds: ["state_transition_receipt"],
    limit: TRANSITION_SCAN_LIMIT + 1,
  });
  if (transitionRecords.length > TRANSITION_SCAN_LIMIT) {
    throw new Error("project_home_transition_scan_bound_exceeded");
  }
  const appliedDecisionKeys = new Set(
    transitionRecords.map((record) => {
      const transition = loadValidatedVNextSemanticTransitionRelationV01(db, {
        ...input,
        transition_receipt_id: record.record_id,
        transition_receipt_fingerprint: record.fingerprint,
      });
      return decisionIdentity(
        transition.decision.decision_id,
        transition.decision.integrity.fingerprint,
      );
    }),
  );
  const evaluated = proposalRecords
    .map((record) => validatedProposal(record, input))
    .filter((proposal) => proposal.status === "pending_review")
    .map((proposal) => {
      const proposalDecisions = decisions.filter(
        (decision) =>
          decision.source_proposal.proposal_id === proposal.proposal_id,
      );
      for (const decision of proposalDecisions) {
        if (
          validateReviewDecisionAgainstEpisodeDeltaProposalV01(decision, proposal)
            .status !== "valid"
        ) {
          throw new Error("project_home_decision_relation_invalid");
        }
      }
      const candidateEvaluations = proposal.proposed_deltas.map((candidate) => {
        const attention = resolveCandidateAttention(
          proposalDecisions.filter(
            (decision) => decision.candidate.candidate_id === candidate.candidate_id,
          ),
          evaluation,
          appliedDecisionKeys,
        );
        const admission = inspectVNextOperatorPilotCandidateAdmissionV01(db, {
          config: input,
          proposal,
          candidate,
          candidate_fingerprint:
            createEpisodeDeltaCandidateFingerprintV01(candidate),
        });
        return { attention, admission };
      });
      const requiringAttention = candidateEvaluations.filter(
        ({ attention }) =>
          attention.state === "requires_attention" ||
          attention.state === "accepted_awaiting_transition",
      );
      const acceptedAwaitingTransition = candidateEvaluations.filter(
        ({ attention }) =>
          attention.state === "accepted_awaiting_transition",
      );
      const transitionBlocked = acceptedAwaitingTransition.filter(
        ({ admission }) => !admission.decision_allowed.accept,
      );
      return {
        proposal,
        origin: proposalWorkbenchOriginV01(db, input, proposal),
        pendingCandidateCount: requiringAttention.length,
        acceptedAwaitingTransitionCount: acceptedAwaitingTransition.length,
        transitionBlockedCount: transitionBlocked.length,
        transitionBlockedByDrift: transitionBlocked.some(
          ({ admission }) => admission.current_state_status === "drifted",
        ),
        deferredCandidateCount: candidateEvaluations.filter(
          ({ attention }) => attention.state === "deferred",
        ).length,
        attentionReason: summarizeAttentionReasons(
          requiringAttention.map(({ attention }) => attention),
        ),
      };
    });
  const pending = evaluated.filter((item) => item.pendingCandidateCount > 0);
  const deferredCandidateCount = evaluated.reduce(
    (total, item) => total + item.deferredCandidateCount,
    0,
  );
  const acceptedAwaitingTransitionCount = evaluated.reduce(
    (total, item) => total + item.acceptedAwaitingTransitionCount,
    0,
  );
  const pendingDecisionCount = evaluated.reduce(
    (total, item) =>
      total + item.pendingCandidateCount - item.acceptedAwaitingTransitionCount,
    0,
  );
  const items = pending.map(
    ({
      proposal,
      origin,
      pendingCandidateCount,
      acceptedAwaitingTransitionCount: proposalTransitionDebt,
      transitionBlockedCount,
      transitionBlockedByDrift,
      attentionReason,
    }) => {
      const strategic = Boolean(proposal.strategic_advantage_transfer);
      const unresolvedDecisionCount =
        pendingCandidateCount - proposalTransitionDebt;
      const entryState = unresolvedDecisionCount > 0
        ? "pending_proposal" as const
        : transitionBlockedCount > 0
          ? "transition_blocked" as const
          : "decided_proposal" as const;
      const reason = unresolvedDecisionCount > 0
        ? `${attentionReason}${proposalTransitionDebt > 0 ? ` ${proposalTransitionDebt} accepted ${proposalTransitionDebt === 1 ? "decision is" : "decisions are"} also awaiting explicit Transition review.` : ""}`
        : transitionBlockedCount > 0
          ? `${transitionBlockedCount} accepted ${transitionBlockedCount === 1 ? "candidate is" : "candidates are"} currently blocked from Transition eligibility by exact server-side admission checks.`
        : `${proposalTransitionDebt} accepted ${proposalTransitionDebt === 1 ? "decision is" : "decisions are"} awaiting an explicit Transition review.`;
      return {
        attention_id: `proposal:${proposal.proposal_id}`,
        proposal_id: proposal.proposal_id,
        summary: safeSummary(proposal.bounded_summary),
        created_at: proposal.created_at,
        pending_candidate_count: pendingCandidateCount,
        priority: transitionBlockedCount > 0
          ? 15
          : proposalTransitionDebt > 0
            ? 20
            : strategic
              ? 30
              : 40,
        signals: [
          ...(origin === "interactive" || origin === "policy_triggered"
            ? [origin]
            : []),
          ...(strategic ? ["strategic" as const] : []),
          ...(proposalTransitionDebt > 0
            ? ["decision_debt" as const]
            : []),
          ...(transitionBlockedCount > 0 ? ["blocked" as const] : []),
          ...(transitionBlockedByDrift ? ["conflict" as const] : []),
        ],
        reason,
        workbench_entry: createProposalWorkbenchEntryV01({
          ...input,
          proposal_id: proposal.proposal_id,
          entry_state: entryState,
          origin,
          reason,
        }),
        action_href: null,
        action_label: transitionBlockedCount > 0
          ? "Inspect Transition blockers"
          : unresolvedDecisionCount === 0 && proposalTransitionDebt > 0
            ? "Review consequence"
          : strategic
            ? "Review strategic candidate"
            : "Review candidate",
        lineage: [
          lineage(
            "episode_delta_proposal",
            proposal.proposal_id,
            "source_proposal",
            proposal.created_at,
          ),
        ],
      };
    },
  );
  items.sort(
    (left, right) =>
      left.priority - right.priority ||
      requireStrictTimestamp(
        right.created_at,
        "project_home_attention_timestamp_invalid",
      ) -
        requireStrictTimestamp(
          left.created_at,
          "project_home_attention_timestamp_invalid",
        ) ||
      compareProtocolCodeUnitsV01(left.attention_id, right.attention_id),
  );
  return {
    state: sectionState(
      pending.length
        ? "action_required"
        : deferredCandidateCount > 0
          ? "available"
          : "empty",
      pending.length
        ? `${pending.length} proposal ${pending.length === 1 ? "needs" : "need"} review attention.${acceptedAwaitingTransitionCount > 0 ? ` ${acceptedAwaitingTransitionCount} accepted ${acceptedAwaitingTransitionCount === 1 ? "decision is" : "decisions are"} awaiting Transition review.` : ""}${deferredCandidateCount > 0 ? ` ${deferredCandidateCount} ${deferredCandidateCount === 1 ? "candidate remains" : "candidates remain"} deferred.` : ""}`
        : deferredCandidateCount > 0
          ? `No immediate decisions need attention. ${deferredCandidateCount} ${deferredCandidateCount === 1 ? "candidate remains" : "candidates remain"} deferred under recorded revisit semantics.`
          : "No project-scoped decisions currently need attention.",
    ),
    total_count: pending.length,
    decision_debt: {
      pending_candidate_count: pendingDecisionCount,
      accepted_awaiting_transition_count: acceptedAwaitingTransitionCount,
      deferred_candidate_count: deferredCandidateCount,
    },
    items: items.slice(0, ATTENTION_LIMIT),
  };
}

type CandidateAttentionResolutionV01 = {
  state:
    | "requires_attention"
    | "accepted_awaiting_transition"
    | "deferred"
    | "terminal";
  reason:
    | "undecided"
    | "revisit_due"
    | "expiry_due"
    | "retracted"
    | "transition_pending"
    | "deferred"
    | "terminal";
};

function resolveCandidateAttention(
  decisions: ReviewDecisionV01[],
  evaluation: { timestamp: string; milliseconds: number },
  appliedDecisionKeys: ReadonlySet<string>,
): CandidateAttentionResolutionV01 {
  if (decisions.length === 0) {
    return { state: "requires_attention", reason: "undecided" };
  }
  const effective = [...decisions].sort(compareEffectiveDecisions)[0]!;
  if (effective.decision === "accept") {
    return appliedDecisionKeys.has(
      decisionIdentity(effective.decision_id, effective.integrity.fingerprint),
    )
      ? { state: "terminal", reason: "terminal" }
      : {
          state: "accepted_awaiting_transition",
          reason: "transition_pending",
        };
  }
  if (["reject", "supersede"].includes(effective.decision)) {
    return { state: "terminal", reason: "terminal" };
  }
  if (effective.decision === "retract") {
    return { state: "requires_attention", reason: "retracted" };
  }
  if (effective.decision !== "defer" || !effective.revisit) {
    throw new Error("project_home_effective_decision_invalid");
  }
  const revisitAt = optionalStrictTimestamp(
    effective.revisit.revisit_at,
    "project_home_defer_revisit_timestamp_invalid",
  );
  const expiresAt = optionalStrictTimestamp(
    effective.revisit.expires_at,
    "project_home_defer_expiry_timestamp_invalid",
  );
  if (expiresAt !== null && evaluation.milliseconds >= expiresAt) {
    return { state: "requires_attention", reason: "expiry_due" };
  }
  if (revisitAt !== null && evaluation.milliseconds >= revisitAt) {
    return { state: "requires_attention", reason: "revisit_due" };
  }
  return { state: "deferred", reason: "deferred" };
}

function compareEffectiveDecisions(
  left: ReviewDecisionV01,
  right: ReviewDecisionV01,
): number {
  const leftReferencesRight = decisionReferences(left, right);
  const rightReferencesLeft = decisionReferences(right, left);
  if (leftReferencesRight !== rightReferencesLeft) {
    return leftReferencesRight ? -1 : 1;
  }
  const timeDifference =
    requireStrictTimestamp(right.decided_at, "project_home_decision_timestamp_invalid") -
    requireStrictTimestamp(left.decided_at, "project_home_decision_timestamp_invalid");
  return timeDifference || compareProtocolCodeUnitsV01(right.decision_id, left.decision_id);
}

function validateDecisionLineageForProjection(
  decisions: ReviewDecisionV01[],
): void {
  const byId = new Map(decisions.map((decision) => [decision.decision_id, decision]));
  for (const decision of decisions) {
    const decidedAt = requireStrictTimestamp(
      decision.decided_at,
      "project_home_decision_timestamp_invalid",
    );
    for (const binding of decision.lineage.prior_decisions) {
      const prior = byId.get(binding.decision_id);
      if (
        !prior ||
        prior.integrity.fingerprint !== binding.decision_fingerprint ||
        prior.source_proposal.proposal_id !== decision.source_proposal.proposal_id ||
        prior.candidate.candidate_id !== decision.candidate.candidate_id ||
        requireStrictTimestamp(
          prior.decided_at,
          "project_home_prior_decision_timestamp_invalid",
        ) > decidedAt
      ) {
        throw new Error("project_home_decision_lineage_invalid");
      }
    }
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (decision: ReviewDecisionV01) => {
    if (visiting.has(decision.decision_id)) {
      throw new Error("project_home_decision_lineage_cycle");
    }
    if (visited.has(decision.decision_id)) return;
    visiting.add(decision.decision_id);
    for (const binding of decision.lineage.prior_decisions) {
      visit(byId.get(binding.decision_id)!);
    }
    visiting.delete(decision.decision_id);
    visited.add(decision.decision_id);
  };
  decisions.forEach(visit);
}

function decisionReferences(
  decision: ReviewDecisionV01,
  possiblePrior: ReviewDecisionV01,
): boolean {
  return decision.lineage.prior_decisions.some(
    (binding) =>
      binding.decision_id === possiblePrior.decision_id &&
      binding.decision_fingerprint === possiblePrior.integrity.fingerprint,
  );
}

function decisionIdentity(decisionId: string, fingerprint: string): string {
  return canonicalizeProtocolValueV01([decisionId, fingerprint]);
}

function summarizeAttentionReasons(
  candidates: CandidateAttentionResolutionV01[],
): string {
  const reasons = new Set(candidates.map((candidate) => candidate.reason));
  if (reasons.has("expiry_due") && reasons.has("revisit_due")) {
    return "Deferred review times or expiries have arrived.";
  }
  if (reasons.has("expiry_due")) {
    return "A deferred review expiry has arrived.";
  }
  if (reasons.has("revisit_due")) {
    return "A deferred review time has arrived.";
  }
  if (reasons.has("retracted")) {
    return "A prior decision was retracted and requires review.";
  }
  const count = candidates.length;
  return `${count} ${count === 1 ? "decision still requires" : "decisions still require"} review.`;
}

function optionalStrictTimestamp(value: string | null, errorCode: string): number | null {
  return value === null ? null : requireStrictTimestamp(value, errorCode);
}

function requireStrictTimestamp(value: string, errorCode: string): number {
  const parsed = parseStrictIsoTimestampV01(value);
  if (parsed === null) throw new Error(errorCode);
  return parsed;
}

function composeProjectAttentionV01(input: {
  db: Database.Database;
  input: { workspace_id: string; project_id: string };
  operator_config: VNextLocalOperatorPilotConfigV01 | null;
  proposal_attention: ProjectHomePendingAttentionV01;
  run_results: ProjectHomeRunResultsV01;
  automation: ProjectHomeProjectionV01["automation"];
  working_projection: ProjectHomeWorkingProjectionSummaryV01;
  evaluation_timestamp: string;
}): ProjectHomePendingAttentionV01 {
  const items = input.proposal_attention.items.map((item) => ({
    ...item,
    signals: [...item.signals],
  }));
  const baseAttentionIds = new Set(items.map((item) => item.attention_id));
  const extraAttentionIds = new Set<string>();
  const automationReviewProposalId =
    input.automation.cycle.review_proposal_id;

  const append = (
    item: ProjectHomePendingAttentionItemV01,
    countAsExtra = true,
  ): void => {
    if (
      baseAttentionIds.has(item.attention_id) ||
      extraAttentionIds.has(item.attention_id)
    ) {
      return;
    }
    if (countAsExtra) extraAttentionIds.add(item.attention_id);
    else baseAttentionIds.add(item.attention_id);
    items.push(item);
  };

  if (automationReviewProposalId) {
    let automationProposal = items.find(
      (item) => item.proposal_id === automationReviewProposalId,
    );
    if (!automationProposal) {
      const record = readVNextCoreRecordV01(input.db, {
        ...input.input,
        record_kind: "episode_delta_proposal",
        record_id: automationReviewProposalId,
      });
      if (!record) {
        throw new Error("project_home_automation_review_proposal_missing");
      }
      const proposal = validatedProposal(record, input.input);
      const reason =
        "Bounded automation stopped at review-needed; no ReviewDecision or Transition was created automatically.";
      const item = {
        attention_id: `proposal:${proposal.proposal_id}`,
        proposal_id: proposal.proposal_id,
        summary: safeSummary(proposal.bounded_summary),
        created_at: proposal.created_at,
        pending_candidate_count: proposal.proposed_deltas.length,
        priority: 25,
        signals: [
          "policy_triggered" as const,
          ...(proposal.strategic_advantage_transfer
            ? (["strategic"] as const)
            : []),
        ],
        reason,
        workbench_entry: createProposalWorkbenchEntryV01({
          ...input.input,
          proposal_id: proposal.proposal_id,
          entry_state: "pending_proposal",
          origin: "policy_triggered",
          reason,
        }),
        action_href: null,
        action_label: "Review automated candidate",
        lineage: [
          lineage(
            "episode_delta_proposal",
            proposal.proposal_id,
            "source_proposal",
            proposal.created_at,
          ),
        ],
      } satisfies ProjectHomePendingAttentionItemV01;
      append(item, false);
      automationProposal = item;
    }
    if (automationProposal) {
      const reason =
        "Bounded automation stopped at review-needed; no ReviewDecision or Transition was created automatically.";
      automationProposal.priority = 25;
      automationProposal.signals = [
        "policy_triggered",
        ...automationProposal.signals.filter(
          (signal) =>
            signal !== "interactive" &&
            signal !== "policy_triggered" &&
            signal !== "feedback",
        ),
      ];
      automationProposal.reason = reason;
      automationProposal.workbench_entry = createProposalWorkbenchEntryV01({
        ...input.input,
        proposal_id: automationReviewProposalId,
        entry_state: "pending_proposal",
        origin: "policy_triggered",
        reason,
      });
      automationProposal.action_label = "Review automated candidate";
    }
  }

  const pendingContextUseReview = input.operator_config
    ? resolveVNextOperatorPilotPendingContextUseReviewV01(input.db, {
        config: input.operator_config,
        continuity: projectVNextOperatorPilotContinuityV01(input.db, {
          config: input.operator_config,
          clock: { now: () => input.evaluation_timestamp },
        }),
      })
    : null;
  if (pendingContextUseReview) {
    const record = readVNextCoreRecordV01(input.db, {
      ...input.input,
      record_kind: "episode_delta_proposal",
      record_id: pendingContextUseReview.proposal_id,
    });
    if (!record) {
      throw new Error("project_home_context_feedback_proposal_missing");
    }
    const proposal = validatedProposal(record, input.input);
    if (
      proposal.integrity.fingerprint !==
      pendingContextUseReview.proposal_fingerprint
    ) {
      throw new Error("project_home_context_feedback_proposal_conflict");
    }
    const laterResult = readProjectRunResultDetailV01(input.db, {
      ...input.input,
      receipt_id: pendingContextUseReview.later_run_receipt_id,
    });
    if (
      laterResult.identity.receipt_fingerprint !==
      pendingContextUseReview.later_run_receipt_fingerprint
    ) {
      throw new Error("project_home_context_feedback_receipt_conflict");
    }
    const origin = laterResult.summary.mode;
    const reason =
      "The applied candidate has exact later-context feedback waiting for explicit review.";
    const workbenchEntry = createProposalWorkbenchEntryV01({
      ...input.input,
      proposal_id: proposal.proposal_id,
      entry_state: "feedback_needed",
      origin,
      reason,
    });
    if (
      input.automation.cycle.feedback_needed &&
      (input.automation.cycle.feedback_proposal_id !== proposal.proposal_id ||
        input.automation.cycle.feedback_href !== workbenchEntry.href)
    ) {
      throw new Error("project_home_automation_feedback_binding_conflict");
    }
    append({
      attention_id: `feedback:${proposal.proposal_id}`,
      proposal_id: proposal.proposal_id,
      summary: safeSummary(proposal.bounded_summary),
      created_at: laterResult.summary.recorded_at,
      pending_candidate_count: 0,
      priority: 10,
      signals: [
        ...(origin === "unknown" ? [] : [origin]),
        "feedback",
      ],
      reason,
      workbench_entry: workbenchEntry,
      action_href: null,
      action_label: "Review later-context feedback",
      lineage: [
        lineage(
          "episode_delta_proposal",
          proposal.proposal_id,
          "source_proposal",
          proposal.created_at,
        ),
        lineage(
          "run_receipt",
          pendingContextUseReview.later_run_receipt_id,
          "run_result",
          laterResult.summary.recorded_at,
        ),
      ],
    });
  }

  const latestResult = input.run_results.latest_result;
  const resultEntry = input.run_results.workbench_entry;
  if (
    latestResult &&
    resultEntry &&
    !items.some((item) => item.workbench_entry?.href === resultEntry.href)
  ) {
    const blocked = [
      "blocked",
      "verification_failed",
      "receipt_unavailable",
      "reconciliation_required",
    ].includes(latestResult.review_attention);
    const conflict = latestResult.review_attention === "reconciliation_required";
    append({
      attention_id: `result:${latestResult.receipt_ref}`,
      proposal_id:
        resultEntry.source.record_kind === "episode_delta_proposal"
          ? resultEntry.source.record_id
          : null,
      summary: safeSummary(latestResult.summary),
      created_at: latestResult.recorded_at,
      pending_candidate_count: 0,
      priority: blocked ? 35 : 55,
      signals: [
        ...(latestResult.mode === "unknown" ? [] : [latestResult.mode]),
        ...(blocked ? (["blocked"] as const) : []),
        ...(conflict ? (["conflict"] as const) : []),
      ],
      reason: safeSummary(resultEntry.reason),
      workbench_entry: resultEntry,
      action_href: null,
      action_label: resultEntry.action_label,
      lineage: [
        lineage(
          "run_receipt",
          latestResult.receipt_ref,
          "run_result",
          latestResult.recorded_at,
        ),
      ],
    });
  }

  if (input.run_results.current_run?.reconciliation_required) {
    append({
      attention_id: `run-reconciliation:${input.run_results.current_run.run_ref}`,
      proposal_id: null,
      summary: "The current native-host run requires bounded reconciliation.",
      created_at: input.run_results.current_run.updated_at,
      pending_candidate_count: 0,
      priority: 12,
      signals: [
        ...(input.run_results.current_run.mode === "unknown"
          ? []
          : [input.run_results.current_run.mode]),
        "blocked",
        "conflict",
      ],
      reason:
        "The recorded host lifecycle and durable run state disagree; review bounded controls before continuing.",
      workbench_entry: null,
      action_href: "#project-controls",
      action_label: "Review run controls",
      lineage: [],
    });
  }

  const automationStatus = input.automation.cycle.status;
  if (
    [
      "proposal_settlement_pending",
      "proposal_settlement_failed",
      "reconciliation_required",
      "grant_required",
      "grant_expired",
      "capability_unavailable",
      "policy_denied",
      "failed",
      "timed_out",
      "cancelled",
    ].includes(automationStatus)
  ) {
    const conflict = automationStatus === "reconciliation_required";
    append({
      attention_id: `automation:${automationStatus}`,
      proposal_id: input.automation.cycle.run?.proposal_id ?? null,
      summary: input.automation.cycle.work_source?.label
        ? safeSummary(input.automation.cycle.work_source.label)
        : "Bounded automation requires attention.",
      created_at: input.evaluation_timestamp,
      pending_candidate_count: 0,
      priority: 18,
      signals: [
        "policy_triggered",
        "blocked",
        ...(conflict ? (["conflict"] as const) : []),
      ],
      reason: safeSummary(input.automation.cycle.stop_reason),
      workbench_entry: null,
      action_href: "#project-controls",
      action_label: input.automation.cycle.retryable
        ? "Review retry eligibility"
        : "Review automation state",
      lineage: [],
    });
  }

  if (
    ["stale", "partial"].includes(
      input.working_projection.source_currentness ?? "",
    )
  ) {
    const reason =
      input.working_projection.source_currentness === "stale"
        ? "Selected working context is stale and should be verified before the next semantic decision."
        : "Selected working context is partial; review its known gaps before deciding.";
    append({
      attention_id: `working-context:${input.working_projection.source_currentness}`,
      proposal_id: null,
      summary: input.working_projection.summary ?? "Selected working context",
      created_at:
        input.working_projection.generated_at ?? input.evaluation_timestamp,
      pending_candidate_count: 0,
      priority: 60,
      signals: ["stale"],
      reason,
      workbench_entry: createProjectReviewWorkbenchEntryV01({
        ...input.input,
        reason,
        review_required: true,
      }),
      action_href: null,
      action_label: "Verify selected context",
      lineage: input.working_projection.lineage,
    });
  }

  items.sort(
    (left, right) =>
      left.priority - right.priority ||
      requireStrictTimestamp(
        right.created_at,
        "project_home_attention_timestamp_invalid",
      ) -
        requireStrictTimestamp(
          left.created_at,
          "project_home_attention_timestamp_invalid",
        ) ||
      compareProtocolCodeUnitsV01(left.attention_id, right.attention_id),
  );
  const totalCount = input.proposal_attention.total_count + extraAttentionIds.size;
  const attentionReadFailed = input.proposal_attention.state.status === "error";
  return {
    state: sectionState(
      attentionReadFailed
        ? "error"
        : totalCount > 0
          ? "action_required"
          : input.proposal_attention.state.status,
      attentionReadFailed
        ? "Some project attention could not be validated safely; independently verified items remain available."
        : totalCount > 0
        ? `${totalCount} project-scoped ${totalCount === 1 ? "item requires" : "items require"} attention, ordered by consequence and currentness.`
        : input.proposal_attention.state.message,
    ),
    total_count: totalCount,
    decision_debt: input.proposal_attention.decision_debt,
    items: items.slice(0, ATTENTION_LIMIT),
  };
}

function projectCoordinationStateV01(input: {
  accepted_state: ProjectHomeSectionStateV01;
  working_projection: ProjectHomeSectionStateV01;
  task_frame: ProjectHomeSectionStateV01;
  attention: ProjectHomeSectionStateV01;
  recent_activity: ProjectHomeSectionStateV01;
  run_results: ProjectHomeSectionStateV01;
  automation: ProjectHomeSectionStateV01;
  attention_count: number;
}): ProjectHomeSectionStateV01 {
  const sections = [
    input.accepted_state,
    input.working_projection,
    input.task_frame,
    input.attention,
    input.recent_activity,
    input.run_results,
    input.automation,
  ];
  if (sections.some((state) => state.status === "error")) {
    return sectionState(
      "error",
      "Some current project coordinates could not be validated safely; verified sections remain read-only.",
    );
  }
  if (
    input.attention_count > 0 ||
    sections.some(
      (state) =>
        state.status === "action_required" || state.status === "unavailable",
    )
  ) {
    return sectionState(
      "action_required",
      "Current project coordinates include attention, stale context, or unavailable material that should be reviewed.",
    );
  }
  return sectionState(
    "available",
    "Current project coordinates are available; no immediate review debt is recorded.",
  );
}

function readRecentActivity(
  db: Database.Database,
  input: { workspace_id: string; project_id: string },
): ProjectHomeRecentActivityV01 {
  const records = listVNextCoreRecordsV01(db, {
    ...input,
    record_kinds: ["state_transition_receipt", "review_decision", "run_receipt"],
    limit: ACTIVITY_SCAN_LIMIT,
  });
  const items = records.map((record): ProjectHomeActivityItemV01 => {
    if (record.record_kind === "state_transition_receipt") {
      const transition = loadValidatedVNextSemanticTransitionRelationV01(db, {
        ...input,
        transition_receipt_id: record.record_id,
        transition_receipt_fingerprint: record.fingerprint,
      });
      const operations = [...new Set(transition.receipt.effects.map((effect) => effect.operation))].join(", ");
      return {
        activity_kind: "accepted_transition",
        summary: safeSummary(`Accepted-state ${operations}: ${transition.proposal.bounded_summary}`),
        occurred_at: transition.receipt.recorded_at,
        outcome: "Applied durable transition",
        workbench_entry: createProposalWorkbenchEntryV01({
          ...input,
          proposal_id: transition.proposal.proposal_id,
          entry_state: "transition_applied",
          origin: "unknown",
          reason:
            "Review the immutable applied Transition and its later-context consequence.",
        }),
        lineage: [
          lineage("episode_delta_proposal", transition.proposal.proposal_id, "source_proposal", transition.proposal.created_at),
          lineage("review_decision", transition.decision.decision_id, "decision", transition.decision.decided_at),
          lineage("state_transition_receipt", transition.receipt.transition_receipt_id, "durable_transition", transition.receipt.recorded_at),
        ],
      };
    }
    if (record.record_kind === "review_decision") {
      const decision = validatedDecision(record, input);
      const proposalRecord = readVNextCoreRecordV01(db, {
        ...input,
        record_kind: "episode_delta_proposal",
        record_id: decision.source_proposal.proposal_id,
      });
      if (!proposalRecord) throw new Error("project_home_decision_proposal_missing");
      const proposal = validatedProposal(proposalRecord, input);
      if (
        validateReviewDecisionAgainstEpisodeDeltaProposalV01(decision, proposal).status !==
        "valid"
      ) {
        throw new Error("project_home_decision_relation_invalid");
      }
      return {
        activity_kind: "review_decision",
        summary: safeSummary(`${decisionLabel(decision.decision)}: ${proposal.bounded_summary}`),
        occurred_at: decision.decided_at,
        outcome: decisionLabel(decision.decision),
        workbench_entry: createProposalWorkbenchEntryV01({
          ...input,
          proposal_id: proposal.proposal_id,
          entry_state: "decided_proposal",
          origin: "unknown",
          reason:
            "Review the recorded decision separately from Transition eligibility and application.",
        }),
        lineage: [
          lineage("episode_delta_proposal", proposal.proposal_id, "source_proposal", proposal.created_at),
          lineage("review_decision", decision.decision_id, "decision", decision.decided_at),
        ],
      };
    }
    const receipt = validatedRunReceipt(record, input);
    return {
      activity_kind: "run_receipt",
      summary: safeSummary(receipt.result_summary.summary),
      occurred_at: receipt.finished_at ?? receipt.recorded_at,
      outcome: `Run ${receipt.execution.status}; verification ${receipt.verification.status}`,
      workbench_entry: createRunResultWorkbenchEntryV01({
        ...input,
        receipt_id: receipt.receipt_id,
        entry_state: "result_only",
        origin: "unknown",
        reason:
          "Open the immutable result and verify its available assessment or candidate state.",
      }),
      lineage: [
        lineage("run_receipt", receipt.receipt_id, "run_result", receipt.recorded_at),
      ],
    };
  });
  items.sort((left, right) =>
    requireStrictTimestamp(
      right.occurred_at,
      "project_home_activity_timestamp_invalid",
    ) -
      requireStrictTimestamp(
        left.occurred_at,
        "project_home_activity_timestamp_invalid",
      ) ||
    compareProtocolCodeUnitsV01(left.activity_kind, right.activity_kind) ||
    compareProtocolCodeUnitsV01(
      left.lineage[0]!.record_id,
      right.lineage[0]!.record_id,
    ),
  );
  const bounded = items.slice(0, ACTIVITY_LIMIT);
  return {
    state: sectionState(
      bounded.length ? "available" : "empty",
      bounded.length
        ? "Recent decisions, durable transitions, and run results for this project."
        : "No meaningful project activity has been recorded yet.",
    ),
    items: bounded,
  };
}

function buildNextMoves(input: {
  project_id: string;
  root_availability: ProjectRootAvailabilityV01;
  is_active: boolean;
  accepted_state: ProjectHomeAcceptedStateSummaryV01;
  attention: ProjectHomePendingAttentionV01;
  primary_action: ProjectHomeProjectionV01["coordination"]["primary_action"];
  automation_status: ProjectHomeProjectionV01["automation"]["status"];
  personal_perspective_status: ProjectHomeProjectionV01["personal_perspective"]["status"];
}): ProjectHomeNextMoveV01[] {
  const moves: ProjectHomeNextMoveV01[] = [];
  if (input.root_availability !== "available") {
    moves.push({
      move_id: "recover_root",
      label: "Locate the project folder",
      reason: "The saved project root is not currently available.",
      href: "/projects#recent-projects",
      caused_by: [`root_availability:${input.root_availability}`],
    });
  }
  if (input.is_active && input.primary_action) {
    moves.push({
      move_id: "open_workbench",
      label: input.primary_action.action_label,
      reason: input.primary_action.reason,
      href: input.primary_action.href,
      caused_by: [
        `workbench_entry:${input.primary_action.entry_state}`,
        `pending_attention:${input.attention.total_count}`,
      ],
    });
  }
  if (!input.is_active) {
    moves.push({
      move_id: "make_active",
      label: "Make this project active",
      reason: "This deep link is read-only until you explicitly switch projects.",
      href: null,
      caused_by: ["active_project:mismatch"],
    });
  }
  if (input.is_active && input.automation_status === "not_configured") {
    moves.push({
      move_id: "configure_automation",
      label: "Configure project automation",
      reason: "Choose whether this project may reach bounded policy-triggered admission checks.",
      href: "#project-controls",
      caused_by: ["automation:not_configured"],
    });
  }
  if (input.is_active && input.automation_status === "paused") {
    moves.push({
      move_id: "review_paused_automation",
      label: "Review paused automation",
      reason: "New policy-triggered work remains blocked until you explicitly resume or disable it.",
      href: "#project-controls",
      caused_by: ["automation:paused"],
    });
  }
  if (
    input.is_active &&
    input.personal_perspective_status === "not_configured"
  ) {
    moves.push({
      move_id: "choose_personal_perspective_scope",
      label: "Choose Personal Perspective scope",
      reason: "Nothing personal is included until you make an explicit project choice.",
      href: "#project-controls",
      caused_by: ["personal_perspective:not_configured"],
    });
  }
  if (input.accepted_state.total_count > 0) {
    moves.push({
      move_id: "review_current_state",
      label: "Review accepted project state",
      reason: "Resume from the latest approved state and its decision lineage.",
      href: "#accepted-state",
      caused_by: [`accepted_state:${input.accepted_state.total_count}`],
    });
  }
  if (moves.length < NEXT_MOVE_LIMIT) {
    moves.push({
      move_id: "return_to_projects",
      label: "Open project selection",
      reason: "Add, recover, remove, or explicitly switch local projects.",
      href: "/projects",
      caused_by: ["project_lifecycle:available"],
    });
  }
  return moves.slice(0, NEXT_MOVE_LIMIT);
}

function readPersonalPerspectiveTaskBasis(
  db: Database.Database,
  input: { workspace_id: string; project_id: string },
  evaluationTimestamp: string,
): ProjectHomeProjectionV01["personal_perspective"]["task_basis"] {
  const record = listVNextCoreRecordsV01(db, {
    ...input,
    record_kinds: ["task_context_packet"],
    limit: 1,
  })[0];
  if (!record) return null;
  const packetResult = validatedPacket(record, input, evaluationTimestamp);
  if (packetResult.status === "expired") return null;
  const selected = packetResult.packet.selected_context.filter(
    isPersonalPerspectiveSelectedEntryV01,
  );
  if (selected.length === 0) return null;
  return {
    packet_generated_at: packetResult.packet.generated_at,
    selected_count: selected.length,
    items: selected.slice(0, PERSONAL_BASIS_LIMIT).map((entry) => ({
      summary:
        entry.bounded_summary === null
          ? null
          : safeSummary(entry.bounded_summary),
      why_included: safeSummary(entry.why_included),
      currentness: entry.currentness.status,
      trust_class: entry.trust_class,
    })),
  };
}

function validatedProposal(
  record: VNextCoreRecordEnvelopeV01,
  input: { workspace_id: string; project_id: string },
): EpisodeDeltaProposalV01 {
  if (record.record_kind !== "episode_delta_proposal" || validateEpisodeDeltaProposalV01(record.payload).status !== "valid") {
    throw new Error("project_home_proposal_invalid");
  }
  const proposal = record.payload as EpisodeDeltaProposalV01;
  assertRecordBinding(record, input, proposal.integrity.fingerprint);
  if (record.record_id !== proposal.proposal_id || record.created_at !== proposal.created_at) {
    throw new Error("project_home_proposal_envelope_mismatch");
  }
  return proposal;
}

function validatedDecision(
  record: VNextCoreRecordEnvelopeV01,
  input: { workspace_id: string; project_id: string },
): ReviewDecisionV01 {
  if (record.record_kind !== "review_decision" || validateReviewDecisionV01(record.payload).status !== "valid") {
    throw new Error("project_home_decision_invalid");
  }
  const decision = record.payload as ReviewDecisionV01;
  assertRecordBinding(record, input, decision.integrity.fingerprint);
  if (record.record_id !== decision.decision_id || record.created_at !== decision.decided_at) {
    throw new Error("project_home_decision_envelope_mismatch");
  }
  return decision;
}

function validatedRunReceipt(
  record: VNextCoreRecordEnvelopeV01,
  input: { workspace_id: string; project_id: string },
): RunReceiptV01 {
  if (record.record_kind !== "run_receipt" || validateRunReceiptV01(record.payload).status !== "valid") {
    throw new Error("project_home_run_receipt_invalid");
  }
  const receipt = record.payload as RunReceiptV01;
  assertRecordBinding(record, input, receipt.integrity.fingerprint);
  if (
    record.record_id !== receipt.receipt_id ||
    record.created_at !== receipt.recorded_at ||
    record.idempotency_key !== receipt.idempotency_key
  ) {
    throw new Error("project_home_run_receipt_envelope_mismatch");
  }
  return receipt;
}

function validatedPacket(
  record: VNextCoreRecordEnvelopeV01,
  input: { workspace_id: string; project_id: string },
  evaluationTimestamp: string,
):
  | { status: "available"; packet: TaskContextPacketV01 }
  | { status: "expired"; packet: TaskContextPacketV01 } {
  if (record.record_kind !== "task_context_packet") {
    throw new Error("project_home_task_context_packet_invalid");
  }
  const validation = validateTaskContextPacketV01(record.payload, {
    evaluated_at: evaluationTimestamp,
  });
  const expiredOnly =
    validation.errors.length === 1 &&
    validation.errors[0]?.code === "packet_expired";
  if (validation.status !== "valid" && !expiredOnly) {
    throw new Error("project_home_task_context_packet_invalid");
  }
  const packet = record.payload as TaskContextPacketV01;
  assertRecordBinding(record, input, packet.integrity.fingerprint);
  if (record.record_id !== packet.packet_id || record.created_at !== packet.generated_at) {
    throw new Error("project_home_task_context_packet_envelope_mismatch");
  }
  return expiredOnly
    ? { status: "expired", packet }
    : { status: "available", packet };
}

function assertRecordBinding(
  record: VNextCoreRecordEnvelopeV01,
  input: { workspace_id: string; project_id: string },
  fingerprint: string,
) {
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01(record, {
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    fingerprint,
  });
}

function emptyWorkingProjection(): ProjectHomeWorkingProjectionSummaryV01 {
  return {
    state: sectionState(
      "empty",
      "No canonical project-scoped Perspective or selected working projection exists yet.",
    ),
    projection_kind: null,
    summary: null,
    generated_at: null,
    source_currentness: null,
    source_perspective_ref: null,
    source_revision: null,
    lineage: [],
  };
}

function expiredWorkingProjection(): ProjectHomeWorkingProjectionSummaryV01 {
  return {
    state: sectionState(
      "unavailable",
      "The latest selected working context has expired.",
    ),
    projection_kind: null,
    summary: null,
    generated_at: null,
    source_currentness: null,
    source_perspective_ref: null,
    source_revision: null,
    lineage: [],
  };
}

function readSectionSafely<T>(reader: () => T, fallback: () => T): T {
  try {
    return reader();
  } catch {
    return fallback();
  }
}

async function readCapabilitiesSafely(
  reader?: ProjectHomeCapabilityStatusReaderV01,
): Promise<ProjectHomeCapabilitiesSummaryV01> {
  try {
    return await readProjectHomeCapabilityStatusesV01(reader);
  } catch {
    return {
      state: sectionState(
        "error",
        "Capability status could not be read safely. Project continuity is still available.",
      ),
      items: PROJECT_HOME_CAPABILITIES_V01.map((capability) => ({
        capability,
        status: "unavailable",
        summary: DEFAULT_CAPABILITY_SUMMARIES[capability],
        verification: "not_remotely_verified",
      })),
    };
  }
}

function acceptedStateError(): ProjectHomeAcceptedStateSummaryV01 {
  return {
    state: sectionState(
      "error",
      "Approved state could not be verified from its durable lineage.",
    ),
    total_count: 0,
    items: [],
  };
}

function workingProjectionError(): ProjectHomeWorkingProjectionSummaryV01 {
  return {
    ...emptyWorkingProjection(),
    state: sectionState(
      "error",
      "Selected working context could not be validated safely.",
    ),
  };
}

function taskFrameError(): ProjectHomeProjectionV01["coordination"]["task_frame"] {
  return {
    state: sectionState(
      "error",
      "Task intent and selected working context could not be validated safely.",
    ),
    goal: null,
    success_criteria: [],
    non_goals: [],
    required_checks: [],
    forbidden_actions: [],
    tensions: [],
    risks: [],
    gaps: [],
    selected_context_count: 0,
    excluded_context_count: 0,
    packet_generated_at: null,
    packet_currentness: null,
  };
}

function attentionError(): ProjectHomePendingAttentionV01 {
  return {
    state: sectionState(
      "error",
      "Pending decision records could not be validated safely.",
    ),
    total_count: 0,
    decision_debt: {
      pending_candidate_count: 0,
      accepted_awaiting_transition_count: 0,
      deferred_candidate_count: 0,
    },
    items: [],
  };
}

function activityError(): ProjectHomeRecentActivityV01 {
  return {
    state: sectionState(
      "error",
      "Recent project activity could not be validated safely.",
    ),
    items: [],
  };
}

function projectHomeRunResultsV01(
  db: Database.Database,
  input: { workspace_id: string; project_id: string },
): ProjectHomeRunResultsV01 {
  const overview = readProjectRunResultOverviewV01(db, input);
  const workbenchEntry = overview.latest_result
    ? (() => {
        const detail = readProjectRunResultDetailV01(db, {
          ...input,
          receipt_id: overview.latest_result.receipt_ref,
        });
        const origin = workbenchOrigin(detail.summary.mode);
        return createRunResultWorkbenchEntryV01({
          ...input,
          receipt_id: overview.latest_result.receipt_ref,
          entry_state:
            detail.criterion_assessment.status === "available"
              ? "assessment"
              : "result_only",
          origin,
          reason:
            detail.automation?.stopped_at_review_needed === true
              ? "Verify the automated result before opening its source-bound candidate; no automatic decision or Transition occurred."
              : detail.criterion_assessment.status === "available"
              ? "Verify the result and its non-authoritative criterion assessment."
              : "Inspect the immutable result before any semantic review is possible.",
        });
      })()
    : null;
  const state = overview.current_run
    ? sectionState(
        overview.current_run.reconciliation_required
          ? "action_required"
          : "available",
        overview.current_run.reconciliation_required
          ? "The current native-host run is paused and requires bounded reconciliation."
          : "The current native-host run is nonterminal; any latest terminal result remains separately reviewable.",
      )
    : overview.latest_result_state === "available"
      ? sectionState(
          "available",
          "The latest immutable terminal RunReceipt is available for review.",
        )
      : overview.latest_result_state === "receipt_unavailable"
        ? sectionState(
            "error",
            "A terminal run references a receipt that could not be read safely.",
          )
        : sectionState(
            "empty",
            "No current native-host run or terminal result is recorded for this project.",
          );
  return {
    state,
    current_run: overview.current_run,
    latest_result: overview.latest_result,
    latest_result_state: overview.latest_result_state,
    workbench_entry: workbenchEntry,
  };
}

function runResultsError(): ProjectHomeRunResultsV01 {
  return {
    state: sectionState(
      "error",
      "Run and result records could not be validated safely.",
    ),
    current_run: null,
    latest_result: null,
    latest_result_state: "error",
    workbench_entry: null,
  };
}

function workbenchOrigin(
  mode: "interactive" | "policy_triggered" | "unknown",
): SemanticWorkbenchEntryOriginV01 {
  return mode;
}

function proposalWorkbenchOriginV01(
  db: Database.Database,
  input: { workspace_id: string; project_id: string },
  proposal: EpisodeDeltaProposalV01,
): SemanticWorkbenchEntryOriginV01 {
  const refs = proposal.source_assessment
    ? [proposal.source_assessment.receipt_ref]
    : proposal.run_receipt_refs;
  if (refs.length === 0) return "unknown";
  const receipts = refs.map((ref) => {
    if (ref.ref_type !== "run_receipt" || !ref.source_ref) {
      throw new Error("project_home_proposal_receipt_binding_invalid");
    }
    const record = readVNextCoreRecordV01(db, {
      ...input,
      record_kind: "run_receipt",
      record_id: ref.external_id,
    });
    if (!record) return null;
    const receipt = validatedRunReceipt(record, input);
    if (receipt.integrity.fingerprint !== ref.source_ref) {
      throw new Error("project_home_proposal_receipt_binding_conflict");
    }
    return receipt;
  });
  if (receipts.some((receipt) => receipt === null)) return "unknown";
  const exactReceipts = receipts.filter(
    (receipt): receipt is RunReceiptV01 => receipt !== null,
  );
  const knownModes = new Set(
    exactReceipts
      .map((receipt) => receiptModeV01(receipt))
      .filter((mode) => mode !== "unknown"),
  );
  if (
    knownModes.size === 1 &&
    exactReceipts.every((receipt) => receiptModeV01(receipt) !== "unknown")
  ) {
    return [...knownModes][0]!;
  }
  const hosts = new Set(
    exactReceipts
      .map((receipt) => receipt.host_ref?.external_id ?? null)
      .filter((value): value is string => value !== null),
  );
  return hosts.size > 1 ? "cross_host" : "unknown";
}

function receiptModeV01(
  receipt: RunReceiptV01,
): "interactive" | "policy_triggered" | "unknown" {
  const label = receipt.execution_environment.runtime_labels.find((value) =>
    value === "interactive" || value === "policy_triggered",
  );
  return label === "interactive" || label === "policy_triggered"
    ? label
    : "unknown";
}

function normalizeCapability(
  value: ProjectHomeCapabilityStatusV01,
): ProjectHomeCapabilityStatusV01 {
  const status = ["available", "action_required", "misconfigured", "unavailable"].includes(value.status)
    ? value.status
    : "unavailable";
  const verification = value.verification === "trusted_local_status"
    ? "trusted_local_status"
    : "not_remotely_verified";
  return {
    capability: value.capability,
    status,
    summary: safeSummary(value.summary),
    verification,
  };
}

function sectionState(
  status: ProjectHomeSectionStateV01["status"],
  message: string,
): ProjectHomeSectionStateV01 {
  return {
    section_state_version: PROJECT_HOME_SECTION_STATE_VERSION_V01,
    status,
    message: safeSummary(message),
  };
}

function lineage(
  recordKind: ProjectHomeLineageKindV01,
  recordId: string,
  role: ProjectHomeLineageAnchorV01["role"],
  occurredAt: string,
): ProjectHomeLineageAnchorV01 {
  return {
    record_kind: recordKind,
    record_id: recordId,
    role,
    occurred_at: occurredAt,
  };
}

function decisionLabel(value: ReviewDecisionV01["decision"]): string {
  return ({
    accept: "Accepted",
    reject: "Rejected",
    defer: "Deferred",
    supersede: "Superseded",
    retract: "Retracted",
  } as const)[value];
}

function safeSummary(value: string): string {
  const normalized = typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
  if (!normalized) return "No safe summary is available.";
  if (
    /(?:OPENAI_API_KEY|GITHUB_TOKEN|GH_TOKEN|MCP_CONFIG|SCHEDULER_CONFIG)\s*[:=]/i.test(normalized) ||
    /\b(?:sk-(?:proj-)?|ghp_|github_pat_)[A-Za-z0-9_-]{4,}/i.test(normalized) ||
    /\b(?:password|secret|token|credential|api[_-]?key)\s*[:=]\s*\S+/i.test(normalized) ||
    /(?:file:\/\/|\/Users\/|\/home\/|[A-Za-z]:\\Users\\|https?:\/\/)/i.test(normalized)
  ) {
    return "Summary withheld because it contains private or credential-like material.";
  }
  return normalized.slice(0, SUMMARY_LIMIT);
}

function safeOptionalReference(value: string | null): string | null {
  if (value === null) return null;
  const normalized = value.trim();
  if (!normalized || normalized.length > 256) return null;
  const safe = safeSummary(normalized);
  return safe.startsWith("Summary withheld") ? null : safe;
}

function safeRepositoryHost(value: string): string | null {
  try {
    return new URL(value).hostname || null;
  } catch {
    return /^([^:]+):/.exec(value)?.[1] ?? null;
  }
}

function projectDestination(projectId: string): string {
  return `/projects/${encodeURIComponent(projectId)}`;
}
