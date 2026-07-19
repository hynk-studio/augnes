import {
  SEMANTIC_WORKBENCH_ENTRY_VERSION_V01,
  type SemanticWorkbenchEntryOriginV01,
  type SemanticWorkbenchEntryStateV01,
  type SemanticWorkbenchEntryV01,
} from "@/types/vnext/semantic-workbench";

const RUN_RECEIPT_ID = /^run-receipt:[a-f0-9]{24}$/u;
const PROPOSAL_ID = /^episode-delta-proposal:[a-f0-9]{24}$/u;

export function createRunResultWorkbenchEntryV01(input: {
  workspace_id: string;
  project_id: string;
  receipt_id: string;
  entry_state: Extract<
    SemanticWorkbenchEntryStateV01,
    "result_only" | "assessment"
  >;
  origin: SemanticWorkbenchEntryOriginV01;
  reason: string;
}): SemanticWorkbenchEntryV01 {
  assertScope(input.workspace_id, input.project_id);
  if (!RUN_RECEIPT_ID.test(input.receipt_id)) {
    throw new Error("semantic_workbench_receipt_id_invalid");
  }
  return {
    entry_version: SEMANTIC_WORKBENCH_ENTRY_VERSION_V01,
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    entry_state: input.entry_state,
    origin: input.origin,
    source: {
      record_kind: "run_receipt",
      record_id: input.receipt_id,
    },
    href: `/workbench/results/${input.receipt_id.replace(":", "~")}`,
    action_label:
      input.entry_state === "assessment" ? "Verify result" : "Open result",
    reason: boundedReason(input.reason),
    review_required: true,
    server_scope_validation_required: true,
    projection_only: true,
    semantic_authority_granted: false,
  };
}

export function createProposalWorkbenchEntryV01(input: {
  workspace_id: string;
  project_id: string;
  proposal_id: string;
  entry_state: Extract<
    SemanticWorkbenchEntryStateV01,
    | "pending_proposal"
    | "decided_proposal"
    | "transition_blocked"
    | "transition_applied"
    | "feedback_needed"
  >;
  origin: SemanticWorkbenchEntryOriginV01;
  reason: string;
}): SemanticWorkbenchEntryV01 {
  assertScope(input.workspace_id, input.project_id);
  if (!PROPOSAL_ID.test(input.proposal_id)) {
    throw new Error("semantic_workbench_proposal_id_invalid");
  }
  const actionLabel: Record<typeof input.entry_state, string> = {
    pending_proposal: "Review candidate",
    decided_proposal: "Review decision consequence",
    transition_blocked: "Inspect Transition blockers",
    transition_applied: "Review applied consequence",
    feedback_needed: "Review later-context feedback",
  };
  return {
    entry_version: SEMANTIC_WORKBENCH_ENTRY_VERSION_V01,
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    entry_state: input.entry_state,
    origin: input.origin,
    source: {
      record_kind: "episode_delta_proposal",
      record_id: input.proposal_id,
    },
    href: `/workbench/semantic-review/${input.proposal_id.replace(":", "~")}`,
    action_label: actionLabel[input.entry_state],
    reason: boundedReason(input.reason),
    review_required: input.entry_state !== "transition_applied",
    server_scope_validation_required: true,
    projection_only: true,
    semantic_authority_granted: false,
  };
}

export function createProjectReviewWorkbenchEntryV01(input: {
  workspace_id: string;
  project_id: string;
  reason: string;
  review_required: boolean;
}): SemanticWorkbenchEntryV01 {
  assertScope(input.workspace_id, input.project_id);
  return {
    entry_version: SEMANTIC_WORKBENCH_ENTRY_VERSION_V01,
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    entry_state: "project_review",
    origin: "unknown",
    source: { record_kind: "project_review", record_id: null },
    href: "/workbench/semantic-review",
    action_label: input.review_required
      ? "Review project context"
      : "Open Semantic Workbench",
    reason: boundedReason(input.reason),
    review_required: input.review_required,
    server_scope_validation_required: true,
    projection_only: true,
    semantic_authority_granted: false,
  };
}

function assertScope(workspaceId: string, projectId: string): void {
  if (!workspaceId.trim() || !projectId.trim()) {
    throw new Error("semantic_workbench_scope_invalid");
  }
}

function boundedReason(value: string): string {
  const normalized = value.trim().replace(/\s+/gu, " ");
  if (!normalized || normalized.length > 320) {
    throw new Error("semantic_workbench_reason_invalid");
  }
  return normalized;
}
