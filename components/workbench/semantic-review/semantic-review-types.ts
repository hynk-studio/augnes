import type {
  VNextOperatorPilotReviewDetailV01,
  VNextOperatorPilotReviewListItemV01,
} from "@/lib/vnext/runtime/operator-pilot-review-material";
import type { VNextOperatorPilotCandidateAdmissionV01 } from "@/lib/vnext/runtime/operator-pilot-policy";
import type { EpisodeDeltaProposalV01 } from "@/types/vnext/episode-delta-proposal";

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
