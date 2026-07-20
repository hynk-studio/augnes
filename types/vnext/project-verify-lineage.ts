import type { ExternalRefTrustClassV01, ExternalRefV01 } from "./external-ref";
import type {
  ProjectVerifyConflictV01,
  ProjectVerifyExactProtocolKindV01,
  ProjectVerifyExactProtocolRefV01,
  ProjectVerifyReadAuthorityV01,
  ProjectVerifyReadCompletenessV01,
} from "./project-verify-reconciliation";

export const PROJECT_VERIFY_LINEAGE_VERSION_V01 =
  "project_verify_lineage.v0.1" as const;
export const PROJECT_VERIFY_LINEAGE_MAX_NODES_V01 = 256 as const;
export const PROJECT_VERIFY_LINEAGE_MAX_EDGES_V01 = 512 as const;

export interface ProjectVerifyLineageBoundsV01 {
  max_nodes: typeof PROJECT_VERIFY_LINEAGE_MAX_NODES_V01;
  max_edges: typeof PROJECT_VERIFY_LINEAGE_MAX_EDGES_V01;
}

export type ProjectVerifyLineageLookupV01 =
  | {
      lookup_kind: "criterion";
      criterion_id: string;
      packet_ref: ProjectVerifyExactProtocolRefV01;
      receipt_ref: ProjectVerifyExactProtocolRefV01;
    }
  | {
      lookup_kind: "evidence";
      evidence_id: string;
      expected_fingerprint: string | null;
    }
  | {
      lookup_kind: "claim";
      claim_id: string;
      expected_fingerprint: string | null;
    }
  | {
      lookup_kind: "claim_family";
      claim_family_id: string;
    }
  | {
      lookup_kind: "claim_evidence_relation";
      relation_id: string;
      expected_fingerprint: string | null;
    }
  | {
      lookup_kind: "claim_evidence_relation_family";
      relation_family_id: string;
    }
  | {
      lookup_kind: "proposal";
      proposal_id: string;
      expected_fingerprint: string | null;
    }
  | {
      lookup_kind: "transition_receipt";
      transition_receipt_id: string;
      expected_fingerprint: string | null;
    };

export type ProjectVerifyLineageNodeKindV01 =
  | "criterion"
  | "criterion_relation_residue"
  | "evidence_record"
  | "claim_record"
  | "claim_evidence_relation"
  | "episode_delta_proposal_candidate"
  | "review_decision"
  | "semantic_commit_gate"
  | "state_transition_receipt_effect"
  | "semantic_state"
  | "semantic_target_head"
  | "later_task_context_packet"
  | "context_use_review";

export type ProjectVerifyLineageNodeStatusV01 =
  | "present"
  | "pending"
  | "rejected"
  | "deferred"
  | "gate_authorized"
  | "expired"
  | "applied"
  | "superseded"
  | "retracted"
  | "missing"
  | "conflict";

export interface ProjectVerifyLineageNodeV01 {
  node_id: string;
  node_kind: ProjectVerifyLineageNodeKindV01;
  status: ProjectVerifyLineageNodeStatusV01;
  exact_ref: ProjectVerifyExactProtocolRefV01 | null;
  record_id: string | null;
  record_fingerprint: string | null;
  source_refs: ExternalRefV01[];
  trust_class: ExternalRefTrustClassV01 | "mixed" | "not_applicable";
  recorded_at: string | null;
  workspace_id: string;
  project_id: string;
  authority_boundary:
    | "support_not_truth"
    | "candidate_not_command"
    | "decision_not_transition"
    | "gate_authorized_not_applied"
    | "expired_gate_not_applied"
    | "applied_transition"
    | "state_projection_not_truth"
    | "context_selection_not_truth"
    | "feedback_not_truth"
    | "missing_or_conflict";
}

export type ProjectVerifyLineageEdgeKindV01 =
  | "criterion_has_exact_residue"
  | "residue_materialized_as_evidence"
  | "evidence_related_to_claim"
  | "claim_or_relation_selected_by_candidate"
  | "candidate_reviewed_by_decision"
  | "decision_authorized_by_gate"
  | "gate_applied_by_transition"
  | "transition_wrote_semantic_state"
  | "transition_updated_target_head"
  | "semantic_state_compiled_into_later_packet"
  | "transition_context_compiled_into_later_packet"
  | "later_packet_reviewed_by_context_use_review"
  | "prior_revision"
  | "supersedes"
  | "retracts";

export interface ProjectVerifyLineageEdgeV01 {
  edge_id: string;
  edge_kind: ProjectVerifyLineageEdgeKindV01;
  from_node_id: string;
  to_node_id: string;
  status: "present" | "pending" | "missing" | "conflict";
  source_refs: ExternalRefV01[];
}

export interface ProjectVerifyLineageStopV01 {
  stopped_at: ProjectVerifyLineageNodeKindV01 | "lookup";
  reason:
    | "chain_complete"
    | "candidate_recorded_no_proposal"
    | "proposal_pending_review"
    | "review_rejected"
    | "review_deferred"
    | "decision_recorded_gate_pending"
    | "gate_authorized_transition_pending"
    | "gate_expired_transition_not_applied"
    | "transition_applied_packet_pending"
    | "later_packet_feedback_pending"
    | "source_missing"
    | "source_conflict"
    | "bounded_incomplete";
  exact_ref: ProjectVerifyExactProtocolRefV01 | null;
}

export interface ProjectVerifyLineageV01 {
  lineage_version: typeof PROJECT_VERIFY_LINEAGE_VERSION_V01;
  workspace_id: string;
  project_id: string;
  observed_at: string;
  lookup: ProjectVerifyLineageLookupV01;
  nodes: ProjectVerifyLineageNodeV01[];
  edges: ProjectVerifyLineageEdgeV01[];
  stop: ProjectVerifyLineageStopV01;
  conflicts: ProjectVerifyConflictV01[];
  bounds: ProjectVerifyLineageBoundsV01;
  completeness: ProjectVerifyReadCompletenessV01;
  projection_fingerprint: string;
  authority: ProjectVerifyReadAuthorityV01;
}

/** Keep the allowed persisted source kinds visible to lookup validators. */
export const PROJECT_VERIFY_LINEAGE_EXACT_SOURCE_KINDS_V01 = [
  "task_context_packet",
  "run_receipt",
  "criterion_assessment",
  "evidence_record",
  "claim_record",
  "claim_evidence_relation",
  "episode_delta_proposal",
  "episode_delta_proposal_candidate",
  "review_decision",
  "semantic_commit_gate",
  "state_transition_receipt",
  "semantic_state",
  "semantic_target_head",
  "context_use_review",
] as const satisfies readonly ProjectVerifyExactProtocolKindV01[];
