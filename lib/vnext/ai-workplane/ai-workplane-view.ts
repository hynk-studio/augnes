import type { VNextOperatorPilotProjectContinuityV01 } from "@/lib/vnext/runtime/operator-pilot-project-continuity";
import type { VNextOperatorPilotReviewListItemV01 } from "@/lib/vnext/runtime/operator-pilot-review-material";
import type { ProjectRunResultDetailV01 } from "@/types/vnext/project-run-result";
import type { ProjectGuideBriefV02 } from "@/types/vnext/guide-brief";
import {
  buildSelectedWorkTimelineV01,
  selectedWorkTimelineDecisionStatusV01,
} from "@/lib/vnext/ai-workplane/selected-work-timeline";
import type { ReviewDecisionV01 } from "@/types/vnext/review-decision";
import type { StateTransitionReceiptV01 } from "@/types/vnext/state-transition-receipt";
import type {
  AIWorkplaneChangeReviewViewV01,
  AIWorkplaneGuideConsistencyV01,
  AIWorkplaneHomeStateV01,
  AIWorkplaneHomeViewV01,
  AIWorkplanePresentationAuthorityV01,
  AIWorkplaneQueueItemV01,
  AIWorkplaneResultViewV01,
  AIWorkplaneVerificationViewV01,
} from "@/types/vnext/ai-workplane";
import { AI_WORKPLANE_PRESENTATION_VERSION_V01 } from "@/types/vnext/ai-workplane";
import type { SemanticReviewProposalDetailV01 } from "@/components/workbench/semantic-review/semantic-review-types";
import type { DelegatedWorkProjectionV01 } from "@/types/vnext/delegated-work";
import type { ProjectWorkInitializationV01 } from "@/types/vnext/project-work-initialization";

const MAX_QUEUE_ITEMS = 5;
const MAX_UNCERTAINTIES = 6;
const MAX_TEXT = 320;

const PRESENTATION_AUTHORITY: AIWorkplanePresentationAuthorityV01 = {
  writes_database: false,
  creates_record: false,
  establishes_truth: false,
  grants_execution_authority: false,
  grants_semantic_authority: false,
  calls_model_or_provider: false,
  performs_external_action: false,
};

export function buildAIWorkplaneHomeViewV01(input: {
  access: "checking" | "locked" | "disabled" | "authenticated";
  loading: boolean;
  guide: ProjectGuideBriefV02 | null;
  proposals: VNextOperatorPilotReviewListItemV01[];
  continuity: VNextOperatorPilotProjectContinuityV01 | null;
  delegated_work?: DelegatedWorkProjectionV01 | null;
  work_initialization?: ProjectWorkInitializationV01 | null;
}): AIWorkplaneHomeViewV01 {
  const guide = input.guide;
  const projectName = guide?.identity.project_display_name ?? null;
  const queue = buildAIWorkplaneQueueV01(input.proposals);
  const base = {
    presentation_version: AI_WORKPLANE_PRESENTATION_VERSION_V01,
    project_name: projectName,
    goal:
      input.work_initialization?.current_work?.goal ??
      guide?.coordinate.goal ??
      null,
    focused_item: queue[0] ?? null,
    additional_items: queue.slice(1, MAX_QUEUE_ITEMS),
    authority: PRESENTATION_AUTHORITY,
  } as const;

  if (input.access === "checking" || (input.access === "authenticated" && input.loading)) {
    return state(base, "loading", "Reading current work", "Augnes is loading the protected project review.", null, null);
  }
  if (input.access !== "authenticated") {
    return state(
      base,
      "access_required",
      "Unlock protected project review",
      "Project decisions are protected by local review access.",
      "Unlocking review does not approve or apply any project change.",
      { kind: "unlock", label: "Unlock project review", href: null },
    );
  }
  if (!guide || guide.projections.ai_workplane.status === "unavailable") {
    return state(
      base,
      "guidance_unavailable",
      "Current guidance is unavailable",
      "Augnes cannot verify the current project coordinate, so no work or decision is inferred.",
      "Return to Continuities to check the current project.",
      { kind: "link", label: "Open Continuities", href: "/" },
    );
  }
  if (!guide.identity.project_id || guide.source_status === "project_choice") {
    return state(
      base,
      "no_project",
      "Choose a project before reviewing work",
      "AI Workplane needs a current project from Continuities.",
      null,
      { kind: "link", label: "Open Continuities", href: "/" },
    );
  }
  if (input.work_initialization?.state === "not_defined") {
    return state(
      base,
      "first_work_definition",
      "Define the first work",
      "Set one goal, what success should look like, and any optional boundaries before delegated work starts.",
      "Saving this definition will not start Codex or change project files.",
      { kind: "save_first_work", label: "Save first work", href: null },
    );
  }
  if (
    input.work_initialization?.state ===
    "existing_history_without_current_packet"
  ) {
    return state(
      base,
      "work_instructions_unavailable",
      "Current work instructions are unavailable",
      "This project already has durable work history, so a new first-work definition cannot replace it.",
      "Refresh or recover the current work context before starting delegated work.",
      { kind: "link", label: "Return to Continuities", href: "/" },
    );
  }
  const delegated = input.delegated_work;
  if (delegated?.stage === "waiting_for_approval") {
    return state(
      base,
      "delegated_approval",
      "Codex needs your decision",
      delegated.current.situation,
      delegated.current.material_blocker_or_request,
      {
        kind: "delegated_work",
        label: "Review requested access",
        href: null,
      },
    );
  }
  if (delegated?.stage === "resume_required") {
    return state(
      base,
      "delegated_resume",
      "Codex work was interrupted",
      delegated.current.situation,
      delegated.current.material_blocker_or_request,
      {
        kind: "delegated_work",
        label: "Resume Codex work",
        href: null,
      },
    );
  }
  if (delegated?.stage === "cancelling") {
    return state(
      base,
      "delegated_cancelling",
      "Codex is stopping",
      delegated.current.situation,
      delegated.current.latest_checkpoint,
      null,
    );
  }
  if (["preparing", "working"].includes(delegated?.stage ?? "")) {
    return state(
      base,
      "work_in_progress",
      "Codex is working",
      delegated?.current.situation ??
        "Codex is continuing the admitted local work.",
      delegated?.current.latest_checkpoint ?? null,
      null,
    );
  }
  if (delegated?.stage === "result_ready") {
    return state(
      base,
      "result_ready",
      "A result is ready",
      delegated.current.situation,
      delegated.current.latest_checkpoint,
      {
        kind: "delegated_work",
        label: "Review result",
        href: null,
      },
    );
  }
  if (
    delegated &&
    ["blocked", "failed", "cancelled", "timed_out", "unavailable"].includes(
      delegated.stage,
    )
  ) {
    return state(
      base,
      "other_attention",
      delegated.current.stage_label,
      delegated.current.situation,
      delegated.current.material_blocker_or_request,
      {
        kind: "delegated_work",
        label: "Review what happened",
        href: null,
      },
    );
  }

  const completionCount =
    input.continuity?.pending_accepted_decision_count ?? 0;
  const completionItem = queue.find(
    (item) => item.status === "ready_to_complete",
  );
  if (completionItem) {
    return {
      ...state(
        base,
        "change_completion",
        "A saved decision still needs completion",
        "Your decision is saved, but the project has not changed yet.",
        guide.projections.ai_workplane.material_blocker_or_judgment,
        {
          kind: "link",
          label: "Continue change review",
          href: completionItem.href,
        },
      ),
      focused_item: completionItem,
      additional_items: queue
        .filter((item) => item.proposal_id !== completionItem.proposal_id)
        .slice(0, 4),
    };
  }
  if (completionCount > 0) {
    const conservativeItem = queue.find(
      (item) =>
        item.status === "needs_more_information" ||
        item.status === "continue_review",
    );
    if (conservativeItem) {
      return {
        ...state(
          base,
          "other_attention",
          conservativeItem.status_label,
          conservativeItem.title,
          "A saved applying decision was reported, but its exact change binding could not be verified.",
          {
            kind: "link",
            label: "Continue review",
            href: conservativeItem.href,
          },
        ),
        focused_item: conservativeItem,
        additional_items: queue
          .filter((item) => item.proposal_id !== conservativeItem.proposal_id)
          .slice(0, 4),
      };
    }
  }

  const decisionItem = queue.find((item) => item.status === "needs_decision");
  if (decisionItem) {
    return {
      ...state(
        base,
        "change_decision",
        "A suggested change needs your decision",
        decisionItem.title,
        guide.projections.ai_workplane.material_blocker_or_judgment ?? decisionItem.reason,
        { kind: "link", label: "Review suggested change", href: decisionItem.href },
      ),
      focused_item: decisionItem,
      additional_items: queue.filter((item) => item.proposal_id !== decisionItem.proposal_id).slice(0, 4),
    };
  }

  if (guide.coordinate.result_available) {
    const href = guide.primary_guidance.href?.startsWith("/workbench/")
      ? guide.primary_guidance.href
      : "/workbench/semantic-review";
    return state(
      base,
      "result_ready",
      "A result is ready to review",
      guide.coordinate.result_summary ?? guide.coordinate.work_status,
      guide.coordinate.material_blocker_or_uncertainty,
      { kind: "link", label: queue.length > 0 ? "Review suggested change" : "Review result", href },
    );
  }
  if (guide.coordinate.focus === "work_in_progress") {
    return state(
      base,
      "work_in_progress",
      "Current work is in progress",
      guide.coordinate.work_status,
      guide.coordinate.material_blocker_or_uncertainty,
      guide.primary_guidance.href
        ? { kind: "link", label: bounded(guide.primary_guidance.label), href: guide.primary_guidance.href }
        : null,
    );
  }
  if (queue.length > 0) {
    return state(
      base,
      "other_attention",
      "Other work is ready to review",
      queue[0]!.title,
      queue[0]!.reason,
      { kind: "link", label: "Continue review", href: queue[0]!.href },
    );
  }
  if (delegated?.stage === "not_started" && delegated.start_eligible) {
    return state(
      base,
      "delegated_ready",
      "Current work is ready for Codex",
      "Delegate the exact current work and return later to follow durable progress.",
      null,
      {
        kind: "delegated_work",
        label: "Start Codex work",
        href: null,
      },
    );
  }
  return state(
    base,
    "no_current_decision",
    "No project decision needs you now",
    guide.coordinate.work_status,
    guide.coordinate.material_blocker_or_uncertainty,
    { kind: "link", label: "Return to Continuities", href: "/" },
  );
}

export function buildAIWorkplaneQueueV01(
  proposals: VNextOperatorPilotReviewListItemV01[],
): AIWorkplaneQueueItemV01[] {
  return [...proposals]
    .sort((left, right) => {
      const leftPriority = queuePriority(left);
      const rightPriority = queuePriority(right);
      return leftPriority - rightPriority ||
        Date.parse(right.created_at) - Date.parse(left.created_at) ||
        compareCodeUnits(left.proposal_id, right.proposal_id);
    })
    .slice(0, MAX_QUEUE_ITEMS)
    .map((proposal) => {
      const status = queueStatus(proposal);
      return {
        proposal_id: proposal.proposal_id,
        title: bounded(proposal.bounded_summary),
        status,
        status_label: queueStatusLabel(status),
        reason: queueReason(proposal, status),
        href: semanticReviewHref(proposal.proposal_id),
        source_current: proposal.source_currentness === "fresh",
      };
    });
}

export function buildAIWorkplaneChangeReviewViewV01(input: {
  read: SemanticReviewProposalDetailV01;
  selected_candidate_id: string | null;
}): AIWorkplaneChangeReviewViewV01 {
  const read = input.read;
  const selected = selectAIWorkplaneChangeCandidateV01(
    read,
    input.selected_candidate_id,
  );
  if (!selected) {
    return {
      presentation_version: AI_WORKPLANE_PRESENTATION_VERSION_V01,
      title: bounded(read.proposal.bounded_summary),
      operation_label: "Unable to determine the change",
      effect_summary: "No exact change option is available for review.",
      reason: bounded(read.proposal.bounded_summary),
      verification: verificationFromChange(read),
      uncertainties: ["The suggested change has no exact reviewable option."],
      decision_status: "blocked",
      decision_status_label: "Needs more information",
      primary_action: null,
      authority: PRESENTATION_AUTHORITY,
    };
  }
  const decisionStatus = changeReviewDecisionStatusV01(read, selected);
  const uncertainties = boundedUnique([
    ...selected.candidate.uncertainties,
    ...selected.candidate.limitations,
    ...selected.pilot_admission.blocking_reasons.map(humanize),
    ...read.project_verify_reconciliation.conflicts.map((entry) => humanize(entry.code)),
  ], MAX_UNCERTAINTIES);
  return {
    presentation_version: AI_WORKPLANE_PRESENTATION_VERSION_V01,
    title: bounded(selected.candidate.title),
    operation_label: operationLabel(selected.candidate.operation),
    effect_summary: bounded(selected.candidate.proposed_state_summary),
    reason: bounded(read.proposal.bounded_summary),
    verification: verificationFromChange(read),
    uncertainties,
    decision_status: decisionStatus,
    decision_status_label: decisionStatusLabel(decisionStatus),
    primary_action: decisionStatus === "needs_decision"
      ? { kind: "save_decision", label: "Save decision", href: null }
      : decisionStatus === "decision_saved"
        ? { kind: "review_impact", label: "Review impact", href: null }
        : decisionStatus === "project_updated"
          ? { kind: "link", label: "Return to AI Workplane", href: "/workbench/semantic-review" }
          : null,
    authority: PRESENTATION_AUTHORITY,
  };
}

function changeReviewDecisionStatusV01(
  read: SemanticReviewProposalDetailV01,
  selected: SemanticReviewProposalDetailV01["candidates"][number],
): AIWorkplaneChangeReviewViewV01["decision_status"] {
  return selectedWorkTimelineDecisionStatusV01(
    buildSelectedWorkTimelineV01({
      read,
      selected_candidate: selected,
    }),
  );
}

export function selectAIWorkplaneChangeCandidateV01(
  read: SemanticReviewProposalDetailV01,
  selectedCandidateId: string | null,
): SemanticReviewProposalDetailV01["candidates"][number] | null {
  const explicit = read.candidates.find(
    (entry) => entry.candidate.candidate_id === selectedCandidateId,
  );
  if (explicit) return explicit;
  const preferred = read.candidates.find(
    (entry) =>
      entry.candidate.candidate_id ===
        read.decision_application_summary.preferred_candidate_id &&
      entry.candidate_fingerprint ===
        read.decision_application_summary.preferred_candidate_fingerprint,
  );
  if (read.decision_application_summary.applying_decision_pending && preferred) {
    return preferred;
  }
  const decisionNeeded = read.candidates.find((entry) => {
    const status = changeReviewDecisionStatusV01(read, entry);
    return status === "needs_decision" || status === "blocked";
  });
  return (
    decisionNeeded ??
    preferred ??
    read.candidates[0] ??
    null
  );
}

export function buildAIWorkplaneResultViewV01(
  result: ProjectRunResultDetailV01,
): AIWorkplaneResultViewV01 {
  const summary = result.summary;
  const verification = verificationFromResult(result);
  return {
    presentation_version: AI_WORKPLANE_PRESENTATION_VERSION_V01,
    heading: summary.execution_status === "completed" ? "Result ready" : "Result needs attention",
    outcome: bounded(summary.summary),
    verification,
    unresolved: boundedUnique([
      ...result.blockers.map((item) => item.summary),
      ...result.gaps.map((item) => item.summary),
      ...result.uncertainty,
    ], MAX_UNCERTAINTIES),
    primary_action: result.proposal.status === "available"
      ? { kind: "link", label: "Review suggested change", href: result.proposal.review_href }
      : { kind: "link", label: "Return to AI Workplane", href: "/workbench/semantic-review" },
    authority: PRESENTATION_AUTHORITY,
  };
}

function verificationFromChange(
  read: SemanticReviewProposalDetailV01,
): AIWorkplaneVerificationViewV01 {
  const criteria = read.project_verify_reconciliation.criteria.map((entry) => entry.criterion);
  const passed = read.source_run_receipts.reduce(
    (count, receipt) => count + receipt.checks.filter((check) => check.status === "passed").length,
    0,
  );
  const failed = read.source_run_receipts.reduce(
    (count, receipt) => count + receipt.checks.filter((check) => check.status === "failed").length,
    0,
  );
  const skipped = read.source_run_receipts.reduce(
    (count, receipt) => count + receipt.skipped_checks.length,
    0,
  );
  const satisfied = criteria.filter((entry) => entry.status === "satisfied").length;
  const unsatisfied = criteria.filter((entry) => entry.status === "unsatisfied").length;
  const unknown = criteria.filter((entry) => entry.status === "unknown").length;
  const complete =
    read.project_verify_reconciliation.completeness.status === "complete" &&
    read.proposal.source_status.currentness === "fresh" &&
    failed === 0 && unsatisfied === 0 && unknown === 0;
  const unavailable = read.source_run_receipts.length === 0 && criteria.length === 0;
  return {
    status: unavailable ? "unavailable" : complete ? "complete" : "partial",
    label: unavailable ? "Verification unavailable" : complete ? "Verification complete" : "Verification is partial",
    passed,
    failed,
    skipped,
    satisfied,
    unsatisfied,
    unknown,
    source_current: read.proposal.source_status.currentness === "fresh",
    blockers: boundedUnique([
      ...(failed > 0 ? [`${failed} checks failed`] : []),
      ...(unsatisfied > 0 ? [`${unsatisfied} requirements were not satisfied`] : []),
      ...(unknown > 0 ? [`${unknown} requirements are not confirmed`] : []),
      ...(read.project_verify_reconciliation.completeness.status !== "complete"
        ? ["The bounded verification read is incomplete"]
        : []),
      ...(read.proposal.source_status.currentness !== "fresh"
        ? ["The source is not current"]
        : []),
    ], 5),
  };
}

function verificationFromResult(result: ProjectRunResultDetailV01): AIWorkplaneVerificationViewV01 {
  const assessment = result.criterion_assessment.status === "available"
    ? result.criterion_assessment.assessment.summary
    : null;
  const complete =
    result.summary.verification_status === "passed" &&
    result.summary.check_counts.failed === 0 &&
    (assessment?.unsatisfied ?? 0) === 0 &&
    (assessment?.unknown ?? 0) === 0;
  const unavailable = result.criterion_assessment.status === "unavailable";
  return {
    status: unavailable ? "unavailable" : complete ? "complete" : "partial",
    label: unavailable ? "Verification unavailable" : complete ? "Verification complete" : "Verification needs attention",
    passed: result.summary.check_counts.passed,
    failed: result.summary.check_counts.failed,
    skipped: result.summary.check_counts.skipped,
    satisfied: assessment?.satisfied ?? 0,
    unsatisfied: assessment?.unsatisfied ?? 0,
    unknown: assessment?.unknown ?? 0,
    source_current: true,
    blockers: boundedUnique([
      ...(result.summary.check_counts.failed > 0 ? [`${result.summary.check_counts.failed} checks failed`] : []),
      ...(result.summary.check_counts.skipped > 0 ? [`${result.summary.check_counts.skipped} checks were skipped`] : []),
      ...result.blockers.map((item) => item.summary),
    ], 5),
  };
}

function state(
  base: Omit<AIWorkplaneHomeViewV01, "state" | "heading" | "situation" | "material_note" | "primary_action">,
  value: AIWorkplaneHomeStateV01,
  heading: string,
  situation: string,
  materialNote: string | null,
  primaryAction: AIWorkplaneHomeViewV01["primary_action"],
): AIWorkplaneHomeViewV01 {
  return {
    ...base,
    state: value,
    heading: bounded(heading),
    situation: bounded(situation),
    material_note: materialNote ? bounded(materialNote) : null,
    primary_action: primaryAction,
  };
}

function queueStatus(proposal: VNextOperatorPilotReviewListItemV01): AIWorkplaneQueueItemV01["status"] {
  return proposal.decision_application_summary.status;
}

function queuePriority(proposal: VNextOperatorPilotReviewListItemV01): number {
  const status = queueStatus(proposal);
  return status === "ready_to_complete"
    ? 0
    : status === "needs_decision"
      ? 1
      : status === "needs_more_information"
        ? 2
        : status === "continue_review"
          ? 3
          : status === "deferred"
            ? 4
            : status === "rejected"
              ? 5
              : 6;
}

function queueStatusLabel(status: AIWorkplaneQueueItemV01["status"]): string {
  return status === "needs_decision"
    ? "Needs your decision"
    : status === "ready_to_complete"
      ? "Ready to complete"
      : status === "project_updated"
        ? "Project updated"
        : status === "deferred"
          ? "Review later"
          : status === "rejected"
            ? "Rejected"
        : status === "needs_more_information"
          ? "Needs more information"
          : "Continue review";
}

function queueReason(
  proposal: VNextOperatorPilotReviewListItemV01,
  status: AIWorkplaneQueueItemV01["status"],
): string {
  if (proposal.source_currentness !== "fresh") return "The supporting source may no longer be current.";
  if (status === "needs_decision") return "Augnes has prepared a bounded suggested change for your review.";
  if (status === "project_updated") return "The reviewed change is already reflected in saved project state.";
  if (status === "ready_to_complete") return "Your saved decision is ready for the separate project-change steps.";
  if (status === "deferred") return "This review is waiting for the saved revisit condition.";
  if (status === "rejected") return "The suggested change was rejected and did not change the project.";
  if (status === "needs_more_information") return "The current change cannot be completed from the verified material.";
  return "Open the review to see the exact current decision and project-change status.";
}

function decisionStatusLabel(status: AIWorkplaneChangeReviewViewV01["decision_status"]): string {
  return status === "needs_decision"
    ? "Needs your decision"
    : status === "decision_saved"
      ? "Decision saved · project unchanged"
      : status === "project_updated"
        ? "Project updated"
        : status === "rejected"
          ? "Rejected · project unchanged"
          : status === "deferred"
            ? "Decide later · project unchanged"
            : "Needs more information";
}

function operationLabel(operation: string): string {
  return operation === "add"
    ? "Add to the project"
    : operation === "revise"
      ? "Update saved project context"
      : operation === "supersede"
        ? "Replace the current saved state"
        : operation === "retract" || operation === "remove"
          ? "Remove the current saved state"
          : "Clarify how this change should apply";
}

function semanticReviewHref(proposalId: string): string {
  return /^episode-delta-proposal:[a-f0-9]{24}$/u.test(proposalId)
    ? `/workbench/semantic-review/${proposalId.replace(":", "~")}`
    : "/workbench/semantic-review";
}

function boundedUnique(values: string[], limit: number): string[] {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const value of values) {
    const normalized = bounded(humanize(value));
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    output.push(normalized);
    if (output.length === limit) break;
  }
  return output;
}

function bounded(value: string): string {
  const compact = humanize(value).replace(/\s+/gu, " ").trim();
  return compact.length <= MAX_TEXT ? compact : `${compact.slice(0, MAX_TEXT - 1)}…`;
}

function humanize(value: string): string {
  return value
    .replaceAll("EpisodeDeltaProposal", "suggested change")
    .replaceAll("ReviewDecision", "saved decision")
    .replaceAll("StateTransitionReceipt", "project update record")
    .replaceAll("CriterionAssessment", "requirement assessment")
    .replaceAll("RunReceipt", "source result")
    .replaceAll("TaskContextPacket", "work context")
    .replaceAll("semantic commit gate", "project-change safeguard")
    .replaceAll("semantic gate", "project-change safeguard")
    .replaceAll("packet fingerprint", "exact source match")
    .replaceAll("_", " ");
}

function compareCodeUnits(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

export function aiWorkplanePresentationAuthorityV01(): AIWorkplanePresentationAuthorityV01 {
  return { ...PRESENTATION_AUTHORITY };
}

export function compareAIWorkplaneGuideProjectV01(
  guide: ProjectGuideBriefV02 | null,
  exactProjectId: string | null,
): AIWorkplaneGuideConsistencyV01 {
  const guideProjectId = guide?.identity.project_id ?? null;
  if (!guideProjectId || !exactProjectId) {
    return {
      status: "advisory_unavailable",
      blocks_actions: false,
      message: null,
    };
  }
  if (guideProjectId !== exactProjectId) {
    return {
      status: "source_mismatch",
      blocks_actions: true,
      message:
        "Current guidance and exact review state do not fully agree. Return to Continuities before changing the project.",
    };
  }
  return { status: "consistent", blocks_actions: false, message: null };
}

export function transitionReceiptMatchesDecisionV01(
  receipt: StateTransitionReceiptV01,
  decision: ReviewDecisionV01,
): boolean {
  return receipt.source_decision.decision_id === decision.decision_id &&
    receipt.source_decision.decision_fingerprint === decision.integrity.fingerprint;
}
