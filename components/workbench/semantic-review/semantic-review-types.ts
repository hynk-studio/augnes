import type {
  VNextOperatorPilotReviewDetailV01,
  VNextOperatorPilotReviewListItemV01,
} from "@/lib/vnext/runtime/operator-pilot-review-material";
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
  VNextOperatorPilotReviewDetailV01;

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

export interface SemanticTransitionPreviewRouteResponseV01 {
  ok: true;
  status: "preview";
  preview: VNextSemanticCommitPreviewV01;
  pilot_policy: {
    single_target: true;
    accept_create_only: true;
    current_state_required: "absent";
    authorized_applier_derived_by_server: true;
    gate_ttl_ms: number;
  };
  preview_is_write: false;
}

export interface SemanticTransitionConfirmationRouteResponseV01 {
  ok: true;
  status: "inserted" | "exact_replay";
  gate_record: VNextSemanticCommitGateRecordV01;
  eligibility_status: StateTransitionEligibilityResultV01["status"];
  eligibility: StateTransitionEligibilityResultV01;
  state_applied: false;
}

export interface SemanticTransitionCommitRouteResponseV01 {
  ok: true;
  status: "applied" | "exact_replay";
  transition_receipt: StateTransitionReceiptV01;
  eligibility_status: StateTransitionEligibilityResultV01["status"];
  eligibility: StateTransitionEligibilityResultV01;
  packet_compiled: false;
}

export interface SemanticTransitionCompileRouteResponseV01 {
  ok: true;
  status: "inserted" | "exact_replay";
  later_packet: TaskContextPacketV01;
  transition_receipt_id: string;
  transition_receipt_fingerprint: string;
  transition_applied: false;
}

export interface SemanticTransitionRouteErrorV01 {
  ok?: false;
  status?: "error" | "not_found";
  error_code?: string | null;
}
