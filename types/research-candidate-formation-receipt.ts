// This file is a type-only, non-authoritative preview contract for the
// Research Candidate Formation Receipt v0.1 static fixtures. It is not durable
// receipt storage, not an event log, not proof/evidence, not a DB schema, not a
// promotion record, not a work item, not a provider prompt, not Codex
// execution, and not external handoff sending.

export type ResearchCandidateFormationReceiptVersion =
  "research_candidate_formation_receipt.v0.1";

export type ResearchCandidateFormationReceiptSourceKind =
  | "research_candidate_review_packet"
  | "manual_parser_output_packet";

export type ResearchCandidateFormationReceiptArtifactKind =
  | "read_only_review_artifact"
  | "candidate_handoff_preview"
  | "operator_inspection_preview";

export interface ResearchCandidateFormationReceiptAuthority {
  read_only: true;
  preview_only: true;
  candidate_only: true;
  source_of_truth: false;
  creates_evidence: false;
  creates_proof: false;
  commits_state: false;
  promotes_perspective: false;
  creates_work_item: false;
  mutates_runtime: false;
  executes_agents: false;
  sends_handoff: false;
  calls_provider: false;
  performs_retrieval: false;
  writes_receipt: false;
  writes_event_log: false;
}

export interface ResearchCandidateFormationReceiptSourceRefContribution {
  source_ref_id: string;
  contribution_kind: "source_ref";
  contributed_to_sections: string[];
  authority_note: string;
}

export interface ResearchCandidateFormationReceiptNodeContribution {
  node_id: string;
  node_kind: string;
  source_object_id: string;
  contributed_to_sections: string[];
  review_status?: string;
  epistemic_status?: string;
  authority_note: string;
}

export interface ResearchCandidateFormationReceiptEdgeContribution {
  edge_id: string;
  relation: string;
  source_node_id: string;
  target_node_id: string;
  contributed_to_sections: string[];
  authority_note: string;
}

export interface ResearchCandidateFormationReceiptPacketSectionContribution {
  section_id: string;
  section_kind: string;
  item_count: number;
  related_node_ids: string[];
  related_source_refs: string[];
  authority_note: string;
}

export interface ResearchCandidateFormationReceiptGuardrailContribution {
  guardrail_id: string;
  text: string;
  contributed_to_sections: string[];
  authority_note: string;
}

export interface ResearchCandidateFormationReceiptArtifact {
  artifact_id: string;
  artifact_kind: ResearchCandidateFormationReceiptArtifactKind;
  title: string;
  summary: string;
  source_packet_version: string;
  source_overlay_version: string;
  review_scope: string;
}

export interface ResearchCandidateFormationReceiptDiagnostics {
  source_ref_contribution_count: number;
  candidate_node_contribution_count: number;
  typed_edge_contribution_count: number;
  packet_section_contribution_count: number;
  guardrail_contribution_count: number;
  source_packet_summary_count: number;
  source_overlay_node_count: number;
  source_overlay_edge_count: number;
  unresolved_tension_count: number;
  knowledge_gap_count: number;
  perspective_delta_count: number;
  follow_up_candidate_count: number;
  authority_guardrail_count: number;
}

export interface ResearchCandidateFormationReceipt {
  receipt_version: ResearchCandidateFormationReceiptVersion;
  scope: string;
  source_kind: ResearchCandidateFormationReceiptSourceKind;
  artifact: ResearchCandidateFormationReceiptArtifact;
  source_packet_fixture_path: string;
  source_overlay_fixture_path: string;
  source_refs: ResearchCandidateFormationReceiptSourceRefContribution[];
  candidate_nodes: ResearchCandidateFormationReceiptNodeContribution[];
  typed_edges: ResearchCandidateFormationReceiptEdgeContribution[];
  packet_sections: ResearchCandidateFormationReceiptPacketSectionContribution[];
  guardrails: ResearchCandidateFormationReceiptGuardrailContribution[];
  diagnostics: ResearchCandidateFormationReceiptDiagnostics;
  authority: ResearchCandidateFormationReceiptAuthority;
  non_authority_notice: string;
}

export type ResearchCandidateFormationReceiptFixture =
  ResearchCandidateFormationReceipt;
