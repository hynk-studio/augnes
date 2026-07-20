import type { ProjectVerifyLineageV01 } from "./project-verify-lineage";

export const SHARED_PROJECT_INSPECTOR_VERSION_V01 =
  "shared_project_inspector.v0.1" as const;

export type SharedProjectInspectorFingerprintTargetKindV01 =
  | "task_context_packet"
  | "automation_work_item"
  | "run_receipt"
  | "evidence_record"
  | "claim_record"
  | "claim_evidence_relation"
  | "episode_delta_proposal"
  | "review_decision"
  | "semantic_commit_gate"
  | "state_transition_receipt"
  | "semantic_state"
  | "later_task_context_packet"
  | "context_use_review"
  | "capability_grant";

export type SharedProjectInspectorTargetV01 =
  | { target_kind: "project_coordination" }
  | {
      target_kind: SharedProjectInspectorFingerprintTargetKindV01;
      record_id: string;
      expected_fingerprint: string;
    }
  | {
      target_kind: "criterion";
      criterion_id: string;
      packet_id: string;
      packet_fingerprint: string;
      receipt_id: string;
      receipt_fingerprint: string;
      assessment_id: string;
      assessment_fingerprint: string;
    }
  | {
      target_kind: "claim_family" | "relation_family";
      family_id: string;
      family_origin_fingerprint: string;
      applicability_scope_fingerprint: string;
    }
  | {
      target_kind: "proposal_candidate";
      proposal_id: string;
      proposal_fingerprint: string;
      candidate_id: string;
      candidate_fingerprint: string;
    }
  | {
      target_kind: "semantic_target_head";
      target_key: string;
      revision: number;
      presence: "present" | "absent";
      transition_receipt_id: string;
      transition_receipt_fingerprint: string;
    }
  | {
      target_kind: "automation_policy";
      policy_id: string;
      policy_fingerprint: string;
    }
  | { target_kind: "automation_cycle"; cycle_id: string }
  | { target_kind: "automation_run"; run_id: string }
  | {
      target_kind: "strategic_material";
      proposal_id: string;
      proposal_fingerprint: string;
    }
  | {
      target_kind: "personal_perspective_inclusion";
      packet_id: string;
      packet_fingerprint: string;
    }
  | {
      target_kind: "integration_health" | "capability_coverage";
      receipt_id: string;
      receipt_fingerprint: string;
    };

export type SharedProjectInspectorSectionKindV01 =
  | "target_authority"
  | "timeline"
  | "selected_context_work"
  | "run_receipt"
  | "criterion_basis"
  | "evidence_claims_relations"
  | "proposal_candidate"
  | "decision_gate"
  | "transition_current_head"
  | "later_context_feedback"
  | "automation"
  | "strategic_perspective"
  | "integration_capability";

export interface SharedProjectInspectorExactRefV01 {
  record_kind: string;
  record_id: string;
  record_fingerprint: string | null;
}

export interface SharedProjectInspectorFactV01 {
  label: string;
  value: string;
  tone: "neutral" | "positive" | "attention" | "critical";
}

export interface SharedProjectInspectorItemV01 {
  item_id: string;
  title: string;
  summary: string;
  status: string;
  recorded_at: string | null;
  exact_refs: SharedProjectInspectorExactRefV01[];
}

export interface SharedProjectInspectorSectionV01 {
  section_kind: SharedProjectInspectorSectionKindV01;
  title: string;
  status:
    | "available"
    | "pending"
    | "missing"
    | "unavailable"
    | "conflict"
    | "bounded_incomplete";
  summary: string;
  facts: SharedProjectInspectorFactV01[];
  items: SharedProjectInspectorItemV01[];
  exact_refs: SharedProjectInspectorExactRefV01[];
}

export interface SharedProjectInspectorProjectionV01 {
  inspector_version: typeof SHARED_PROJECT_INSPECTOR_VERSION_V01;
  workspace_id: string;
  project_id: string;
  observed_at: string;
  target: SharedProjectInspectorTargetV01;
  target_status: "present" | "missing" | "conflict" | "bounded_incomplete";
  target_title: string;
  target_summary: string;
  target_trust: string;
  target_currentness: string;
  completeness: "complete" | "partial" | "bounded_incomplete" | "conflict";
  sections: SharedProjectInspectorSectionV01[];
  lineage: ProjectVerifyLineageV01 | null;
  authority: {
    read_only: true;
    projection_is_rebuildable: true;
    writes_database: false;
    creates_evidence: false;
    accepts_evidence: false;
    creates_claim_or_relation: false;
    creates_proposal_or_revision: false;
    creates_review_decision: false;
    authorizes_semantic_commit_gate: false;
    applies_transition: false;
    compiles_later_packet: false;
    records_context_use_review: false;
    creates_automation_cycle_or_grant: false;
    selects_current_head: false;
    establishes_claim_truth: false;
    promotes_perspective_or_memory: false;
    calls_model_or_provider: false;
    performs_network_or_external_action: false;
    mutates_filesystem: false;
  };
}
