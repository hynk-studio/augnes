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
  evaluateProjectAutomationAdmissionV01,
  isPersonalPerspectiveSelectedEntryV01,
} from "@/lib/vnext/project-controls/project-controls";
import {
  canonicalizeProtocolValueV01,
  compareProtocolCodeUnitsV01,
  parseStrictIsoTimestampV01,
} from "@/lib/vnext/protocol-primitives";
import { validateEpisodeDeltaProposalV01 } from "@/lib/vnext/episode-delta-proposal";
import { readDefaultModelGatewayLocalCapabilityV01 } from "@/lib/vnext/model-gateway/model-gateway";
import { validateReviewDecisionAgainstEpisodeDeltaProposalV01, validateReviewDecisionV01 } from "@/lib/vnext/review-decision";
import { validateRunReceiptV01 } from "@/lib/vnext/run-receipt";
import { loadValidatedVNextSemanticTransitionRelationV01 } from "@/lib/vnext/runtime/durable-semantic-transition";
import { readProjectRunResultOverviewV01 } from "@/lib/vnext/runtime/project-run-result-read-model";
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
  type ProjectHomePendingAttentionV01,
  type ProjectHomeProjectionV01,
  type ProjectHomeRecentActivityV01,
  type ProjectHomeRunResultsV01,
  type ProjectHomeSectionStateV01,
  type ProjectHomeWorkingProjectionSummaryV01,
} from "@/types/vnext/project-home";
import type { ProjectRootAvailabilityV01 } from "@/types/vnext/project-onboarding";

const ACCEPTED_STATE_LIMIT = 5;
const ATTENTION_LIMIT = 5;
const ACTIVITY_LIMIT = 5;
const NEXT_MOVE_LIMIT = 3;
const PROPOSAL_SCAN_LIMIT = 64;
const DECISION_SCAN_LIMIT = 128;
const ACTIVITY_SCAN_LIMIT = 24;
const SUMMARY_LIMIT = 320;

const DEFAULT_CAPABILITY_SUMMARIES: Record<ProjectHomeCapabilityV01, string> = {
  openai: "No trusted local OpenAI readiness status is available.",
  codex_native_host: "No trusted local Codex or native-host readiness status is available.",
  github: "No trusted local GitHub readiness status is available.",
  mcp: "No trusted local MCP readiness status is available.",
  scheduler: "No trusted local scheduler readiness status is available.",
};

export type ProjectHomeCapabilityStatusReaderV01 = () =>
  | readonly ProjectHomeCapabilityStatusV01[]
  | Promise<readonly ProjectHomeCapabilityStatusV01[]>;

export interface ProjectHomeProjectionDependenciesV01 {
  now?: () => string;
  read_root_availability?: (root: string) => Promise<ProjectRootAvailabilityV01>;
  read_capability_statuses?: ProjectHomeCapabilityStatusReaderV01;
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
  const attention = readSectionSafely(
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
  const automationAdmission = evaluateProjectAutomationAdmissionV01({
    ...input,
    control: effectiveAutomation,
    candidate: input,
    grant_readiness: { ...input, status: "required" },
    active_run_readiness: {
      ...input,
      active_automated_run_count: 0,
    },
  });
  const automation = {
    state: sectionState(
      effectiveAutomation.status === "not_configured"
        ? "not_configured"
        : effectiveAutomation.status === "enabled"
          ? "available"
          : "action_required",
      automationAdmission.reason,
    ),
    status: effectiveAutomation.status,
    control_revision: effectiveAutomation.control_revision,
    updated_at: effectiveAutomation.updated_at,
    policy_summary: effectiveAutomation.policy_summary,
    policy_control_eligible:
      effectiveAutomation.policy_triggered_work_allowed_at_control_layer,
    admission_status: automationAdmission.status,
    admission_reason: automationAdmission.reason,
    current_run_summary: null,
  } satisfies ProjectHomeProjectionV01["automation"];
  const effectivePersonalPerspective =
    readPersonalPerspectiveEffectiveScopeV01(db, input);
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
    eligible_selected_count: readPersonalPerspectiveSelectedCount(
      db,
      input,
      evaluation.timestamp,
      effectivePersonalPerspective.effectively_included,
      effectivePersonalPerspective.scope_revision,
    ),
  } satisfies ProjectHomeProjectionV01["personal_perspective"];

  return {
    project_home_projection_version: PROJECT_HOME_PROJECTION_VERSION_V01,
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    generated_at: evaluation.timestamp,
    project_summary: projectSummary,
    accepted_state: acceptedState,
    working_projection: workingProjection,
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
      const candidateStates = proposal.proposed_deltas.map((candidate) =>
        resolveCandidateAttention(
          proposalDecisions.filter(
            (decision) => decision.candidate.candidate_id === candidate.candidate_id,
          ),
          evaluation,
        ),
      );
      const requiringAttention = candidateStates.filter(
        (candidate) => candidate.state === "requires_attention",
      );
      return {
        proposal,
        pendingCandidateCount: requiringAttention.length,
        deferredCandidateCount: candidateStates.filter(
          (candidate) => candidate.state === "deferred",
        ).length,
        attentionReason: summarizeAttentionReasons(requiringAttention),
      };
    });
  const pending = evaluated.filter((item) => item.pendingCandidateCount > 0);
  const deferredCandidateCount = evaluated.reduce(
    (total, item) => total + item.deferredCandidateCount,
    0,
  );
  const items = pending.slice(0, ATTENTION_LIMIT).map(({ proposal, pendingCandidateCount, attentionReason }) => ({
    proposal_id: proposal.proposal_id,
    summary: safeSummary(proposal.bounded_summary),
    created_at: proposal.created_at,
    pending_candidate_count: pendingCandidateCount,
    reason: attentionReason,
    lineage: [
      lineage(
        "episode_delta_proposal",
        proposal.proposal_id,
        "source_proposal",
        proposal.created_at,
      ),
    ],
  }));
  return {
    state: sectionState(
      pending.length
        ? "action_required"
        : deferredCandidateCount > 0
          ? "available"
          : "empty",
      pending.length
        ? `${pending.length} proposal ${pending.length === 1 ? "needs" : "need"} a decision.${deferredCandidateCount > 0 ? ` ${deferredCandidateCount} ${deferredCandidateCount === 1 ? "candidate remains" : "candidates remain"} deferred.` : ""}`
        : deferredCandidateCount > 0
          ? `No immediate decisions need attention. ${deferredCandidateCount} ${deferredCandidateCount === 1 ? "candidate remains" : "candidates remain"} deferred under recorded revisit semantics.`
          : "No project-scoped decisions currently need attention.",
    ),
    total_count: pending.length,
    items,
  };
}

type CandidateAttentionResolutionV01 = {
  state: "requires_attention" | "deferred" | "terminal";
  reason:
    | "undecided"
    | "revisit_due"
    | "expiry_due"
    | "retracted"
    | "deferred"
    | "terminal";
};

function resolveCandidateAttention(
  decisions: ReviewDecisionV01[],
  evaluation: { timestamp: string; milliseconds: number },
): CandidateAttentionResolutionV01 {
  if (decisions.length === 0) {
    return { state: "requires_attention", reason: "undecided" };
  }
  const effective = [...decisions].sort(compareEffectiveDecisions)[0]!;
  if (["accept", "reject", "supersede"].includes(effective.decision)) {
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
      lineage: [
        lineage("run_receipt", receipt.receipt_id, "run_result", receipt.recorded_at),
      ],
    };
  });
  items.sort((left, right) =>
    right.occurred_at.localeCompare(left.occurred_at) ||
    left.activity_kind.localeCompare(right.activity_kind) ||
    left.lineage[0]!.record_id.localeCompare(right.lineage[0]!.record_id),
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
  if (input.attention.total_count > 0) {
    moves.push({
      move_id: "review_attention",
      label: "Review pending decisions",
      reason: `${input.attention.total_count} project-scoped proposal ${input.attention.total_count === 1 ? "needs" : "need"} attention.`,
      href: "#attention",
      caused_by: [`pending_attention:${input.attention.total_count}`],
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

function readPersonalPerspectiveSelectedCount(
  db: Database.Database,
  input: { workspace_id: string; project_id: string },
  evaluationTimestamp: string,
  effectivelyIncluded: boolean,
  scopeRevision: number | null,
): number {
  if (!effectivelyIncluded || scopeRevision === null) return 0;
  const record = listVNextCoreRecordsV01(db, {
    ...input,
    record_kinds: ["task_context_packet"],
    limit: 1,
  })[0];
  if (!record) return 0;
  const packetResult = validatedPacket(record, input, evaluationTimestamp);
  if (packetResult.status === "expired") return 0;
  const expectedExternalId =
    `${input.project_id}:personal-perspective-scope:${scopeRevision}`;
  return packetResult.packet.selected_context.filter(
    (entry) =>
      isPersonalPerspectiveSelectedEntryV01(entry) &&
      entry.compatibility_source_ref?.external_id === expectedExternalId,
  ).length;
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
  | { status: "expired" } {
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
  return expiredOnly ? { status: "expired" } : { status: "available", packet };
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

function attentionError(): ProjectHomePendingAttentionV01 {
  return {
    state: sectionState(
      "error",
      "Pending decision records could not be validated safely.",
    ),
    total_count: 0,
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
  };
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
