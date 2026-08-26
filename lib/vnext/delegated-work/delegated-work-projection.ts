import { createHash } from "node:crypto";

import { isTerminalRunnerStatus } from "@/lib/autonomy/runner-state";
import { createSharedInspectorHrefV01 } from "@/lib/vnext/shared-project-inspector-href";
import type {
  AutonomyRunEventRecord,
  AutonomyRunSummary,
} from "@/types/autonomy-runner-execution";
import type {
  DelegatedWorkNextActionV01,
  DelegatedWorkProjectionV01,
  DelegatedWorkStageV01,
  DelegatedWorkTimelineItemV01,
  DelegatedWorkTimelineKindV01,
} from "@/types/vnext/delegated-work";
import { createRunResultReviewHrefV01 } from "@/lib/vnext/ai-workplane-review-href";
import {
  DELEGATED_WORK_LIMITS_V01,
  DELEGATED_WORK_PROJECTION_VERSION_V01,
} from "@/types/vnext/delegated-work";
import type { LiveNativeHostRunProjectionV01 } from "@/lib/vnext/runtime/live-native-host-run-service";
import type { RepositoryRunResumeEligibilityV01 } from "@/types/vnext/repository-run-resume";

export interface BuildDelegatedWorkProjectionInputV01 {
  workspace_id: string;
  project_id: string;
  run: AutonomyRunSummary | null;
  events: AutonomyRunEventRecord[];
  source_omitted_event_count: number;
  live_run: LiveNativeHostRunProjectionV01;
  current_goal: string | null;
  start_eligible: boolean;
  start_blocker: string | null;
  source_status?: DelegatedWorkProjectionV01["source_status"];
  resume_eligibility?: RepositoryRunResumeEligibilityV01 | null;
}

const AUTHORITY_V01 = {
  writes_database: false,
  creates_run: false,
  starts_codex: false,
  approves_host_action: false,
  cancels_run: false,
  resumes_run: false,
  creates_result: false,
  establishes_task_success: false,
  creates_evidence: false,
  changes_project_state: false,
  calls_provider: false,
  calls_github: false,
  retries: false,
} as const;

const CHECKPOINT_KINDS = new Set<DelegatedWorkTimelineKindV01>([
  "checkpoint_started",
  "checkpoint_completed",
]);

const MANDATORY_KINDS = new Set<DelegatedWorkTimelineKindV01>([
  "delegated",
  "approval_requested",
  "approval_approved",
  "approval_declined",
  "cancellation_requested",
  "connection_interrupted",
  "resumed",
  "result_saved",
  "blocked",
  "failed",
  "cancelled",
  "timed_out",
]);

export function buildUnavailableDelegatedWorkProjectionV01(input: {
  workspace_id: string;
  project_id: string;
  live_run: LiveNativeHostRunProjectionV01;
  context: "read" | "accepted_action";
}): DelegatedWorkProjectionV01 {
  const accepted = input.context === "accepted_action";
  const situation = accepted
    ? "The operational action was accepted, but current progress could not be refreshed."
    : "Current progress could not be read.";
  return assertProjectionBoundsV01({
    projection_version: DELEGATED_WORK_PROJECTION_VERSION_V01,
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    run_ref: input.live_run.run_ref,
    mode: input.live_run.mode,
    source_status: "unavailable",
    stage: "unavailable",
    started_at: null,
    updated_at: null,
    finished_at: null,
    current: {
      goal: null,
      stage_label: "Current progress is unavailable",
      situation,
      latest_checkpoint: null,
      material_blocker_or_request: situation,
      reconciliation_required: false,
      last_observed_at: null,
      trusted_result_available: false,
      needs_user: false,
    },
    timeline: [],
    compacted_item_count: 0,
    gap_notes: [situation],
    next_action: nextActionV01("none"),
    pending_approval: null,
    resume_eligibility: null,
    result: null,
    exact_detail_href: null,
    start_eligible: false,
    start_blocker: situation,
    control_revision: input.live_run.control_revision,
    can_cancel: false,
    authority: AUTHORITY_V01,
  });
}

export function buildDelegatedWorkProjectionV01(
  input: BuildDelegatedWorkProjectionInputV01,
): DelegatedWorkProjectionV01 {
  const sourceStatus = input.source_status ?? "available";
  const run = input.run;
  if (!run || !input.live_run.run_ref) {
    return assertProjectionBoundsV01({
      projection_version: DELEGATED_WORK_PROJECTION_VERSION_V01,
      workspace_id: input.workspace_id,
      project_id: input.project_id,
      run_ref: null,
      mode: null,
      source_status: sourceStatus,
      stage: sourceStatus === "unavailable" ? "unavailable" : "not_started",
      started_at: null,
      updated_at: null,
      finished_at: null,
      current: {
        goal: boundedTextV01(
          input.current_goal,
          DELEGATED_WORK_LIMITS_V01.goal_characters,
        ),
        stage_label:
          sourceStatus === "unavailable"
            ? "Current progress is unavailable"
            : "No delegated work is active",
        situation:
          sourceStatus === "unavailable"
            ? "Augnes could not confirm the current Codex work state."
            : input.start_eligible
              ? "The current work is ready to delegate to Codex."
              : boundedTextV01(input.start_blocker) ??
                "There is no current Codex work to follow.",
        latest_checkpoint: null,
        material_blocker_or_request:
          sourceStatus === "unavailable"
            ? "Current progress could not be read."
            : boundedTextV01(input.start_blocker),
        reconciliation_required: false,
        last_observed_at: null,
        trusted_result_available: false,
        needs_user: input.start_eligible,
      },
      timeline: [],
      compacted_item_count: 0,
      gap_notes:
        sourceStatus === "unavailable"
          ? ["The delegated-work source could not be read."]
          : [],
      next_action:
        sourceStatus === "unavailable"
          ? nextActionV01("return_to_blank_state")
          : input.start_eligible
            ? nextActionV01("start_codex_work")
            : nextActionV01("none"),
      pending_approval: null,
      resume_eligibility: input.resume_eligibility ?? null,
      result: null,
      exact_detail_href: null,
      start_eligible: input.start_eligible,
      start_blocker: boundedTextV01(input.start_blocker),
      control_revision: input.live_run.control_revision,
      can_cancel: false,
      authority: AUTHORITY_V01,
    });
  }

  const trustedResult =
    run.metadata.terminal_receipt_persisted === true &&
    input.live_run.receipt != null &&
    input.live_run.run_ref === run.run_id;
  const stage = stageV01(
    input.live_run,
    trustedResult,
    input.resume_eligibility ?? null,
  );
  const mapped = input.events
    .map((event) => timelineItemV01(event))
    .filter((item): item is DelegatedWorkTimelineItemV01 => item != null);
  if (trustedResult && input.live_run.receipt) {
    mapped.push({
      item_id: stableIdV01(
        "result",
        run.run_id,
        input.live_run.receipt.receipt_ref,
      ),
      kind: "result_saved",
      title: "Result saved",
      summary: "A trusted result is ready to review.",
      occurred_at: run.finished_at ?? run.updated_at,
      basis: "enforced",
      tone: "success",
      current: false,
      source_event_ref: null,
    });
  }
  const deduplicated = deduplicateTimelineV01(mapped);
  const { items, omitted: presentationOmitted } =
    compactTimelineV01(deduplicated);
  const sourceOmitted = Math.max(
    0,
    Math.floor(input.source_omitted_event_count),
  );
  const omitted = sourceOmitted + presentationOmitted;
  const currentKind = currentTimelineKindV01(stage);
  const currentIndex = findCurrentIndexV01(items, currentKind);
  const timeline = items.map((item, index) => ({
    ...item,
    current: index === currentIndex,
  }));
  const latestCheckpoint =
    [...timeline]
      .reverse()
      .find((item) => CHECKPOINT_KINDS.has(item.kind))?.summary ?? null;
  const pending = input.live_run.pending_approval;
  const stageCopy = stageCopyV01(
    stage,
    input.live_run,
    trustedResult,
    input.resume_eligibility ?? null,
  );
  const result = trustedResult && input.live_run.receipt
    ? {
        receipt_ref: input.live_run.receipt.receipt_ref,
        outcome: input.live_run.receipt.outcome,
        review_href: createRunResultReviewHrefV01(
          input.live_run.receipt.receipt_ref,
        ),
      }
    : null;

  return assertProjectionBoundsV01({
    projection_version: DELEGATED_WORK_PROJECTION_VERSION_V01,
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    run_ref: run.run_id,
    mode: input.live_run.mode,
    source_status: sourceStatus,
    stage,
    started_at: run.started_at,
    updated_at: run.updated_at,
    finished_at: run.finished_at,
    current: {
      goal:
        boundedTextV01(
          input.current_goal,
          DELEGATED_WORK_LIMITS_V01.goal_characters,
        ) ??
        boundedTextV01(stringValueV01(run.metadata.task_goal)) ??
        boundedTextV01(run.title),
      stage_label: stageCopy.label,
      situation: stageCopy.situation,
      latest_checkpoint: boundedTextV01(latestCheckpoint),
      material_blocker_or_request:
        stage === "waiting_for_approval"
          ? boundedTextV01(pending?.public_reason) ??
            "Codex needs your decision before it can continue."
          : boundedTextV01(input.live_run.public_reason),
      reconciliation_required:
        input.live_run.reconciliation_required || stage === "resume_required",
      last_observed_at: run.updated_at,
      trusted_result_available: trustedResult,
      needs_user: [
        "waiting_for_approval",
        "resume_required",
        "result_ready",
        "blocked",
        "failed",
        "cancelled",
        "timed_out",
      ].includes(stage),
    },
    timeline,
    compacted_item_count: omitted,
    gap_notes: [
      ...(omitted > 0
        ? ["Earlier progress was compacted."]
        : []),
      ...(isTerminalRunnerStatus(run.status) && !trustedResult
        ? ["The host reached a terminal state without a trusted saved result."]
        : []),
      ...(sourceStatus === "partial"
        ? ["Some current runtime ownership information is unavailable."]
        : []),
    ],
    next_action: nextActionForStageV01(
      stage,
      result?.review_href ?? null,
      input.live_run.mode,
    ),
    pending_approval: pending
      ? {
          approval_ref: pending.approval_ref,
          operation_class: pending.operation_class,
          title: approvalTitleV01(pending.operation_class),
          reason: boundedTextV01(pending.public_reason) ?? "Codex needs permission to continue.",
          risk: boundedTextV01(pending.public_risk_summary) ?? "Review the requested access before deciding.",
          resource_summary:
            boundedTextV01(pending.resource_summary) ?? "Requested project access",
          repository_relative_paths: pending.repository_relative_paths.slice(0, 12),
          network_resources: pending.network_resources.slice(0, 8),
          command_summary: boundedTextV01(pending.command_summary),
          available_decisions: [...pending.available_decisions],
          expires_at: pending.expires_at,
          decision_submitted: pending.decision_submitted,
        }
      : null,
    resume_eligibility: input.resume_eligibility ?? null,
    result,
    exact_detail_href: createSharedInspectorHrefV01({
      target_kind: "automation_run",
      run_id: run.run_id,
    }),
    start_eligible: false,
    start_blocker: "Existing delegated work must settle before another run starts.",
    control_revision: input.live_run.control_revision,
    can_cancel: ["preparing", "working", "waiting_for_approval"].includes(stage),
    authority: AUTHORITY_V01,
  });
}

function stageV01(
  live: LiveNativeHostRunProjectionV01,
  trustedResult: boolean,
  eligibility: RepositoryRunResumeEligibilityV01 | null,
): DelegatedWorkStageV01 {
  if (trustedResult) return "result_ready";
  if (eligibility?.status === "active_owned") return "working";
  if (eligibility?.status === "approval_pending") return "waiting_for_approval";
  if (
    eligibility &&
    ["resume_ready", "reconciliation_required", "stale", "unsupported", "unavailable"].includes(
      eligibility.status,
    )
  ) return "resume_required";
  if (live.reconciliation_required || live.status === "paused") {
    return "resume_required";
  }
  switch (live.status) {
    case "idle":
      return "not_started";
    case "queued":
    case "starting":
      return "preparing";
    case "running":
      return "working";
    case "waiting_for_approval":
      return "waiting_for_approval";
    case "cancelling":
      return "cancelling";
    case "blocked":
    case "completed":
      return "blocked";
    case "failed":
      return "failed";
    case "cancelled":
      return "cancelled";
    case "timed_out":
      return "timed_out";
  }
}

function timelineItemV01(
  event: AutonomyRunEventRecord,
): DelegatedWorkTimelineItemV01 | null {
  const common = {
    item_id: stableIdV01("event", event.event_id),
    occurred_at: event.created_at,
    current: false,
    source_event_ref: event.event_id,
  };
  switch (event.event_type) {
    case "run_created":
    case "run_queued":
      return {
        ...common,
        kind: "delegated",
        title: "Work delegated",
        summary: "Augnes admitted the current work for local Codex execution.",
        basis: "enforced",
        tone: "neutral",
      };
    case "run_starting":
      return {
        ...common,
        kind: "preparing",
        title: "Preparing Codex work",
        summary: "Augnes is checking the exact project and work context.",
        basis: "enforced",
        tone: "active",
      };
    case "approval_requested":
      return {
        ...common,
        kind: "approval_requested",
        title: "Waiting for your approval",
        summary: "Codex requested bounded access before continuing.",
        basis: "enforced",
        tone: "attention",
      };
    case "approval_decided": {
      const decision = stringValueV01(event.payload.decision);
      if (decision === "cancel_run") {
        return {
          ...common,
          kind: "cancellation_requested",
          title: "Stopping was requested",
          summary: "Augnes recorded the exact cancellation request.",
          basis: "enforced",
          tone: "attention",
        };
      }
      const approved = decision === "approve_once";
      return {
        ...common,
        kind: approved ? "approval_approved" : "approval_declined",
        title: approved ? "Access approved once" : "Access declined",
        summary: approved
          ? "Codex may use only the reviewed access for this request."
          : "Codex will continue without the declined access or stop truthfully.",
        basis: "enforced",
        tone: approved ? "neutral" : "attention",
      };
    }
    case "run_cancelling":
      return {
        ...common,
        kind: "cancellation_requested",
        title: "Stopping Codex work",
        summary: "Augnes is waiting for the admitted work to settle.",
        basis: "enforced",
        tone: "attention",
      };
    case "run_reconciliation_required":
    case "run_paused":
      return {
        ...common,
        kind: "connection_interrupted",
        title: "Codex work was interrupted",
        summary: "The local runtime lost ownership and requires an explicit resume.",
        basis: "enforced",
        tone: "attention",
      };
    case "run_resumed":
      return {
        ...common,
        kind: "resumed",
        title: "Codex work resumed",
        summary: "Augnes resumed the same admitted work.",
        basis: "enforced",
        tone: "active",
      };
    case "run_blocked":
    case "run_needs_review":
      return terminalItemV01(common, "blocked", "Work is blocked", "The admitted work needs review before it can continue.");
    case "run_failed":
      return terminalItemV01(common, "failed", "Codex work failed", "The local run ended without a trusted result.");
    case "run_cancelled":
      return terminalItemV01(common, "cancelled", "Codex work stopped", "The cancellation settled without claiming success.");
    case "run_timed_out":
      return terminalItemV01(common, "timed_out", "Codex work timed out", "The local time bound ended without a trusted result.");
    case "host_event_observed":
      return hostTimelineItemV01(event, common);
    default:
      return null;
  }
}

function hostTimelineItemV01(
  event: AutonomyRunEventRecord,
  common: Pick<
    DelegatedWorkTimelineItemV01,
    "item_id" | "occurred_at" | "current" | "source_event_ref"
  >,
): DelegatedWorkTimelineItemV01 | null {
  const kind = stringValueV01(event.payload.event_kind);
  if (kind === "turn_started") {
    return {
      ...common,
      kind: "codex_started",
      title: "Codex started",
      summary: "Codex began the exact admitted work.",
      basis: "host_attested",
      tone: "active",
    };
  }
  if (kind !== "work_checkpoint") return null;
  const checkpoint = objectValueV01(event.payload.checkpoint);
  if (!checkpoint) return null;
  const checkpointKind = stringValueV01(checkpoint.kind);
  const phase = stringValueV01(checkpoint.phase);
  const status = stringValueV01(checkpoint.status);
  const fileCount = numberValueV01(checkpoint.change_count);
  const started = phase === "started";
  if (!["command_execution", "file_change"].includes(checkpointKind ?? "")) {
    return null;
  }
  const failed = status === "failed" || status === "blocked";
  const command = checkpointKind === "command_execution";
  const title = command
    ? started
      ? "Running a project command"
      : failed
        ? "Project command did not complete"
        : "Project command completed"
    : started
      ? "Preparing project file changes"
      : failed
        ? "Project file changes did not complete"
        : "Project files were updated";
  const countCopy =
    !command && fileCount != null
      ? ` ${fileCount} project file${fileCount === 1 ? " was" : "s were"} observed.`
      : "";
  return {
    ...common,
    kind: started ? "checkpoint_started" : "checkpoint_completed",
    title,
    summary: `${title}.${countCopy}`.trim(),
    basis: "observed",
    tone: failed ? "danger" : started ? "active" : "neutral",
  };
}

function terminalItemV01(
  common: Pick<
    DelegatedWorkTimelineItemV01,
    "item_id" | "occurred_at" | "current" | "source_event_ref"
  >,
  kind: Extract<
    DelegatedWorkTimelineKindV01,
    "blocked" | "failed" | "cancelled" | "timed_out"
  >,
  title: string,
  summary: string,
): DelegatedWorkTimelineItemV01 {
  return {
    ...common,
    kind,
    title,
    summary,
    basis: "enforced",
    tone: kind === "cancelled" ? "attention" : "danger",
  };
}

function deduplicateTimelineV01(
  items: DelegatedWorkTimelineItemV01[],
): DelegatedWorkTimelineItemV01[] {
  const sorted = [...items].sort(compareTimelineV01);
  const result: DelegatedWorkTimelineItemV01[] = [];
  const semanticKeys = new Set<string>();
  for (const item of sorted) {
    const semanticKey =
      item.kind === "delegated" || item.kind === "codex_started"
        ? item.kind
        : `${item.kind}\u0000${item.item_id}`;
    if (semanticKeys.has(semanticKey)) continue;
    semanticKeys.add(semanticKey);
    result.push(item);
  }
  return result;
}

function compactTimelineV01(items: DelegatedWorkTimelineItemV01[]): {
  items: DelegatedWorkTimelineItemV01[];
  omitted: number;
} {
  const checkpointIds = new Set(
    items
      .filter((item) => CHECKPOINT_KINDS.has(item.kind))
      .slice(-DELEGATED_WORK_LIMITS_V01.checkpoint_items)
      .map((item) => item.item_id),
  );
  const latestId = items.at(-1)?.item_id ?? null;
  const candidates = items.filter(
    (item) =>
      !CHECKPOINT_KINDS.has(item.kind) ||
      checkpointIds.has(item.item_id),
  );
  if (candidates.length <= DELEGATED_WORK_LIMITS_V01.timeline_items) {
    return {
      items: candidates,
      omitted: items.length - candidates.length,
    };
  }
  const mandatoryIds = new Set(
    candidates
      .filter(
        (item) =>
          MANDATORY_KINDS.has(item.kind) || item.item_id === latestId,
      )
      .map((item) => item.item_id),
  );
  const kept = candidates
    .filter((item) => mandatoryIds.has(item.item_id))
    .slice(-DELEGATED_WORK_LIMITS_V01.timeline_items);
  for (const item of [...candidates].reverse()) {
    if (kept.length >= DELEGATED_WORK_LIMITS_V01.timeline_items) break;
    if (!kept.some((candidate) => candidate.item_id === item.item_id)) {
      kept.push(item);
    }
  }
  kept.sort(compareTimelineV01);
  return {
    items: kept,
    omitted: items.length - kept.length,
  };
}

function compareTimelineV01(
  left: DelegatedWorkTimelineItemV01,
  right: DelegatedWorkTimelineItemV01,
): number {
  return (
    left.occurred_at.localeCompare(right.occurred_at) ||
    (left.source_event_ref ?? left.item_id).localeCompare(
      right.source_event_ref ?? right.item_id,
    )
  );
}

function findCurrentIndexV01(
  items: DelegatedWorkTimelineItemV01[],
  kind: DelegatedWorkTimelineKindV01 | null,
): number {
  if (items.length === 0) return -1;
  if (kind) {
    for (let index = items.length - 1; index >= 0; index -= 1) {
      if (items[index]?.kind === kind) return index;
    }
  }
  return items.length - 1;
}

function currentTimelineKindV01(
  stage: DelegatedWorkStageV01,
): DelegatedWorkTimelineKindV01 | null {
  switch (stage) {
    case "preparing":
      return "preparing";
    case "working":
      return null;
    case "waiting_for_approval":
      return "approval_requested";
    case "cancelling":
      return "cancellation_requested";
    case "resume_required":
      return "connection_interrupted";
    case "result_ready":
      return "result_saved";
    case "blocked":
      return "blocked";
    case "failed":
      return "failed";
    case "cancelled":
      return "cancelled";
    case "timed_out":
      return "timed_out";
    default:
      return null;
  }
}

function stageCopyV01(
  stage: DelegatedWorkStageV01,
  live: LiveNativeHostRunProjectionV01,
  trustedResult: boolean,
  eligibility: RepositoryRunResumeEligibilityV01 | null,
): { label: string; situation: string } {
  switch (stage) {
    case "preparing":
      return {
        label: "Preparing",
        situation: "Augnes is checking the exact project context before Codex starts.",
      };
    case "working":
      return {
        label: "Working",
        situation: "Codex is working through the admitted local Augnes runtime.",
      };
    case "waiting_for_approval":
      return {
        label: "Waiting for your approval",
        situation: live.pending_approval?.decision_submitted
          ? "Your decision was recorded; Augnes is waiting for Codex to resolve it."
          : "Codex needs your decision before it can continue.",
      };
    case "cancelling":
      return {
        label: "Stopping",
        situation: "Augnes is waiting for the admitted Codex work to stop cleanly.",
      };
    case "resume_required":
      return {
        label: "Interrupted",
        situation: eligibility?.summary ??
          "The local runtime lost ownership of this work. Resume is explicit.",
      };
    case "result_ready":
      return {
        label: "Result ready",
        situation: trustedResult
          ? "A trusted saved result is ready to review."
          : "The result could not be confirmed.",
      };
    case "blocked":
      return {
        label: "Result could not be confirmed",
        situation: "The host settled without a trusted saved result.",
      };
    case "failed":
      return {
        label: "Failed",
        situation: "Codex work ended without a trusted result.",
      };
    case "cancelled":
      return {
        label: "Stopped",
        situation: "The cancellation settled without claiming success.",
      };
    case "timed_out":
      return {
        label: "Timed out",
        situation: "The local time bound ended without a trusted result.",
      };
    case "unavailable":
      return {
        label: "Current progress is unavailable",
        situation: "Augnes could not confirm the current Codex work state.",
      };
    case "not_started":
      return {
        label: "No delegated work is active",
        situation: "The current work has not been delegated to Codex.",
      };
  }
}

function nextActionForStageV01(
  stage: DelegatedWorkStageV01,
  resultHref: string | null,
  mode: LiveNativeHostRunProjectionV01["mode"],
): DelegatedWorkNextActionV01 {
  switch (stage) {
    case "waiting_for_approval":
      return nextActionV01("review_requested_access");
    case "resume_required":
      return nextActionV01(
        mode === "repository_attachment"
          ? "review_resume_status"
          : "resume_codex_work",
      );
    case "result_ready":
      return {
        kind: "review_result",
        label: "Review result",
        href: resultHref,
        executes: false,
      };
    case "preparing":
    case "working":
    case "cancelling":
      return nextActionV01("view_progress");
    case "blocked":
    case "failed":
    case "cancelled":
    case "timed_out":
    case "unavailable":
      return nextActionV01("return_to_blank_state");
    default:
      return nextActionV01("none");
  }
}

function nextActionV01(
  kind: DelegatedWorkNextActionV01["kind"],
): DelegatedWorkNextActionV01 {
  const values: Record<
    DelegatedWorkNextActionV01["kind"],
    Pick<DelegatedWorkNextActionV01, "label" | "href">
  > = {
    open_ai_workplane: {
      label: "Open AI Workplane",
      href: "/workbench/semantic-review#delegated-work",
    },
    start_codex_work: { label: "Start Codex work", href: null },
    review_requested_access: {
      label: "Review requested access",
      href: "/workbench/semantic-review#delegated-work-approval",
    },
    resume_codex_work: { label: "Resume Codex work", href: null },
    review_resume_status: { label: "Review resume status", href: null },
    view_progress: {
      label: "View progress",
      href: "/workbench/semantic-review#delegated-work",
    },
    review_result: { label: "Review result", href: null },
    return_to_blank_state: { label: "Return to Continuities", href: "/" },
    none: { label: null, href: null },
  };
  return { kind, ...values[kind], executes: false };
}

function approvalTitleV01(
  operation: NonNullable<
    LiveNativeHostRunProjectionV01["pending_approval"]
  >["operation_class"],
): string {
  switch (operation) {
    case "command_execution":
      return "Review command access";
    case "file_change":
      return "Review project file access";
    case "filesystem_permission":
      return "Review folder access";
    case "network_permission":
      return "Review network access";
  }
}

function stableIdV01(...parts: string[]): string {
  return `delegated:${createHash("sha256").update(parts.join("\u0000")).digest("hex").slice(0, 24)}`;
}

function boundedTextV01(
  value: string | null | undefined,
  limit: number = DELEGATED_WORK_LIMITS_V01.text_characters,
): string | null {
  if (!value) return null;
  const normalized = value.replace(/\s+/gu, " ").trim();
  if (!normalized) return null;
  return normalized.slice(0, limit);
}

function stringValueV01(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function numberValueV01(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0
    ? value
    : null;
}

function objectValueV01(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function assertProjectionBoundsV01(
  projection: DelegatedWorkProjectionV01,
): DelegatedWorkProjectionV01 {
  if (
    projection.timeline.length > DELEGATED_WORK_LIMITS_V01.timeline_items ||
    Buffer.byteLength(JSON.stringify(projection), "utf8") >
      DELEGATED_WORK_LIMITS_V01.serialized_bytes
  ) {
    throw new Error("delegated_work_projection_bounds_exceeded");
  }
  return projection;
}
