import type {
  VNextOperatorPilotReviewDetailV01,
  VNextOperatorPilotReviewListItemV01,
} from "@/lib/vnext/runtime/operator-pilot-review-material";
import type { VNextOperatorPilotProposalDurableLineageV01 } from "@/lib/vnext/runtime/operator-pilot-workbench-lineage";
import type { VNextOperatorPilotProjectContinuityV01 } from "@/lib/vnext/runtime/operator-pilot-project-continuity";
import type { VNextOperatorPilotCandidateAdmissionV01 } from "@/lib/vnext/runtime/operator-pilot-policy";
import type {
  VNextSemanticCommitGateRecordV01,
  VNextSemanticCommitPreviewV01,
} from "@/lib/vnext/runtime/durable-semantic-transition";
import type { EpisodeDeltaProposalV01 } from "@/types/vnext/episode-delta-proposal";
import type {
  StateTransitionEligibilityResultV01,
  StateTransitionReceiptV01,
} from "@/types/vnext/state-transition-receipt";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";

export type SemanticReviewProposalListItemV01 =
  VNextOperatorPilotReviewListItemV01;

export interface SemanticReviewCandidateReadV01 {
  candidate: EpisodeDeltaProposalV01["proposed_deltas"][number];
  candidate_fingerprint: string;
  pilot_admission: VNextOperatorPilotCandidateAdmissionV01;
}

export type SemanticReviewProposalDetailV01 =
  VNextOperatorPilotReviewDetailV01 & {
    durable_lineage: VNextOperatorPilotProposalDurableLineageV01;
    project_continuity: VNextOperatorPilotProjectContinuityV01;
  };

export interface SemanticReviewProjectV01 {
  workspace_id: string;
  project_id: string;
}

export interface SemanticReviewListRouteResponseV01 {
  ok: boolean;
  status: "proposal_list";
  project: SemanticReviewProjectV01;
  proposals: SemanticReviewProposalListItemV01[];
}

export interface SemanticReviewDetailRouteResponseV01 {
  ok: boolean;
  status: "proposal_detail";
  project: SemanticReviewProjectV01;
  proposal: SemanticReviewProposalDetailV01;
}

export interface SemanticReviewDecisionRequestV01 {
  proposal_id: string;
  proposal_fingerprint: string;
  candidate_id: string;
  candidate_fingerprint: string;
  decision: "accept" | "reject" | "defer";
  rationale_summary: string;
  revisit?: {
    condition_summary: string;
  };
}

export interface SemanticReviewRevisionRequestV01 {
  action: "revise";
  proposal_id: string;
  proposal_fingerprint: string;
  candidate_id: string;
  candidate_fingerprint: string;
  delta_type: EpisodeDeltaProposalV01["proposed_deltas"][number]["delta_type"];
  operation: "add" | "revise" | "supersede" | "retract" | "remove";
  title: string;
  proposed_state_summary: string;
  rationale_summary: string;
  uncertainties: string[];
  limitations: string[];
}

export interface SemanticContextUseReviewRequestV01 {
  action: "record_context_use_review";
  later_run_receipt_id: string;
  later_run_receipt_fingerprint: string;
  actually_used: "yes" | "partial" | "no" | "unknown";
  assessment:
    | "helpful"
    | "stale"
    | "misleading"
    | "missing"
    | "noisy"
    | "not_applicable";
  correction_summaries: string[];
  notes: string[];
  metrics: {
    wrong_context_correction_count: number | null;
    repeated_explanation_estimate: number | null;
    missing_critical_context_count: number | null;
    context_refs_used_count: number | null;
  };
}

export interface SemanticTransitionPreviewRouteResponseV01 {
  ok: true;
  status: "preview";
  preview: VNextSemanticCommitPreviewV01;
  pilot_policy: {
    operation_aware: true;
    candidate_operation: "create" | "replace" | "supersede" | "retract";
    current_state_required: "absent" | "present";
    atomic_transition_and_packet_supported: true;
    authorized_applier_derived_by_server: true;
    review_window_config_version: "vnext_operator_pilot_review_window_config.v0.1";
    preview_max_age_ms: number;
    preview_source: "default" | "explicit_environment";
    gate_ttl_ms: number;
    gate_source: "default" | "explicit_environment";
    preview_binding_expires_at: string;
  };
  preview_is_write: false;
}

export interface SemanticTransitionApplyRouteResponseV01 {
  ok: true;
  status: "applied" | "exact_replay";
  packet_status: "inserted" | "exact_replay";
  gate_record: VNextSemanticCommitGateRecordV01;
  transition_receipt: StateTransitionReceiptV01;
  later_packet: TaskContextPacketV01;
  eligibility_status: "eligible";
  eligibility: StateTransitionEligibilityResultV01;
  packet_compiled: true;
}

export interface SemanticTransitionConfirmationRouteResponseV01 {
  ok: true;
  status: "inserted" | "exact_replay";
  gate_record: VNextSemanticCommitGateRecordV01;
  eligibility_status: StateTransitionEligibilityResultV01["status"];
  eligibility: StateTransitionEligibilityResultV01;
  state_applied: false;
}

export interface SemanticTransitionRouteErrorV01 {
  ok?: false;
  status?: "error" | "not_found";
  error_code?: string | null;
}
