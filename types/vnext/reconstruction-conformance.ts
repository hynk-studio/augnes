import type { CodexCurrentContinuityV01 } from "./codex-current-continuity";
import type { ProjectVerifyLineageV01 } from "./project-verify-lineage";
import type { ProjectVerifyReconciliationV01 } from "./project-verify-reconciliation";
import type { TaskContextPacketV01 } from "./task-context-packet";

export const RECONSTRUCTION_CONFORMANCE_REPORT_VERSION_V01 =
  "reconstruction_conformance_report.v0.1" as const;
export const RECONSTRUCTION_CONFORMANCE_NORMALIZATION_VERSION_V01 =
  "reconstruction_conformance_normalization.v0.1" as const;
export const RECONSTRUCTION_CONFORMANCE_PORTABLE_REBUILD_BINDING_VERSION_V01 =
  "reconstruction_conformance_portable_rebuild_binding.v0.1" as const;

export type ReconstructionConformanceLaneStatusV01 =
  | "conformant"
  | "non_conformant"
  | "incomplete";

export interface ReconstructionConformanceSourceRecordV01 {
  record_kind: string;
  record_id: string;
  record_fingerprint: string;
}

/**
 * Exact source material and identity metadata admitted across the rebuild
 * boundary. It deliberately contains no baseline projection or rendered
 * product material.
 */
export interface ReconstructionConformanceSourceBoundaryV01 {
  portable_contract: string;
  portable_contract_version: number;
  reconstruction_input_content_fingerprint: string;
  reconstruction_input_integrity_fingerprint: string;
  workspace_id: string;
  project_id: string;
  work_id: string | null;
  current_packet_ref: ReconstructionConformanceSourceRecordV01 | null;
  root_binding_fingerprint: string;
  portable_rebuild_binding_version: string;
  criterion_evaluator_version: string;
  semantic_context_compiler_version: string;
  source_records: ReconstructionConformanceSourceRecordV01[];
}

export interface ReconstructionConformanceEnvironmentV01 {
  source_boundary: ReconstructionConformanceSourceBoundaryV01;
  decision_time_cutoff: string;
  environmental_observation: {
    root_availability: CodexCurrentContinuityV01["project"]["root_availability"];
    operator_config_available: boolean;
    managed_start_available: boolean;
    managed_run_projection_reads: number;
    operator_provenance_state: "source_authenticated" | "imported_inert";
  };
  current_packet: TaskContextPacketV01;
  continuity: CodexCurrentContinuityV01;
  reconciliation: ProjectVerifyReconciliationV01;
  lineages: ProjectVerifyLineageV01[];
  feedback_state: {
    status: "feedback_pending" | "feedback_recorded" | "not_applicable";
    later_run_receipt_id: string | null;
    later_run_receipt_fingerprint: string | null;
    packet_id: string | null;
    packet_fingerprint: string | null;
    transition_receipt_id: string | null;
    transition_receipt_fingerprint: string | null;
    proposal_id: string | null;
    proposal_fingerprint: string | null;
  };
}

export interface ReconstructionConformanceInputV01 {
  baseline: ReconstructionConformanceEnvironmentV01;
  reconstructed: ReconstructionConformanceEnvironmentV01;
}

export interface ReconstructionConformanceBoundaryClassificationV01 {
  material: string;
  classification:
    | "canonical_source"
    | "exact_identity_source_metadata"
    | "versioned_rebuild_rule"
    | "allowed_environmental_observation";
  crosses_boundary: true;
}

export interface ReconstructionConformanceNonCrossingMaterialV01 {
  material: string;
  classification:
    | "independently_observed_exact_identity"
    | "required_importer_safety_effect";
  crosses_boundary: false;
}

export interface ReconstructionConformanceExcludedMaterialV01 {
  material: string;
  classification: "excluded_derived_material";
  crosses_boundary: false;
}

export interface ReconstructionConformanceExactCheckV01 {
  check: string;
  status: "match" | "mismatch" | "incomplete";
  non_compensable: true;
  baseline_fingerprint: string;
  reconstructed_fingerprint: string;
}

export interface ReconstructionConformanceSemanticRelationV01 {
  relation_kind: string;
  identity: string;
  dimensions: Record<string, string | number | boolean | null>;
}

export interface ReconstructionConformanceSemanticDifferenceV01 {
  difference_kind: "missing_from_reconstruction" | "added_by_reconstruction";
  relation_fingerprint: string;
  relation: ReconstructionConformanceSemanticRelationV01;
  non_compensable: true;
}

export interface ReconstructionConformanceReportV01 {
  report_version: typeof RECONSTRUCTION_CONFORMANCE_REPORT_VERSION_V01;
  normalization_version:
    typeof RECONSTRUCTION_CONFORMANCE_NORMALIZATION_VERSION_V01;
  generated_at: string;
  scope: {
    workspace_id: string;
    project_id: string;
    decision_time_cutoff: string;
  };
  reconstruction_boundary: {
    crossing_material: ReconstructionConformanceBoundaryClassificationV01[];
    non_crossing_material: ReconstructionConformanceNonCrossingMaterialV01[];
    excluded_derived_material: ReconstructionConformanceExcludedMaterialV01[];
    baseline_source_record_count: number;
    reconstructed_source_record_count: number;
  };
  exact_integrity: {
    status: ReconstructionConformanceLaneStatusV01;
    checks: ReconstructionConformanceExactCheckV01[];
  };
  relational_semantic: {
    status: ReconstructionConformanceLaneStatusV01;
    incomplete_reasons: string[];
    baseline_relations: ReconstructionConformanceSemanticRelationV01[];
    reconstructed_relations: ReconstructionConformanceSemanticRelationV01[];
    differences: ReconstructionConformanceSemanticDifferenceV01[];
  };
  authority: {
    read_only_report: true;
    durable_core_record_created: false;
    writes_database: false;
    writes_project_files: false;
    calls_model_or_provider: false;
    performs_network_or_external_action: false;
    creates_proposal_or_candidate: false;
    creates_review_decision: false;
    creates_or_applies_transition: false;
    creates_execution_grant_or_policy: false;
    repairs_or_promotes_semantics: false;
    scores_ranks_or_selects_winner: false;
  };
  material_boundary: {
    raw_prompts_persisted: false;
    transcripts_persisted: false;
    hidden_reasoning_persisted: false;
    provider_payloads_persisted: false;
    credentials_persisted: false;
    operator_session_credentials_copied: false;
    private_paths_persisted: false;
    projection_or_rendering_copied: false;
  };
  method_boundary: {
    exact_and_relational_lanes_separate: true;
    hard_failures_non_compensable: true;
    deterministic_replay_required: true;
    model_as_judge_calls: 0;
    real_provider_calls: 0;
    external_network_calls: 0;
    automatic_repair_or_rollback: false;
    semantic_promotion_or_context_injection: false;
  };
  limitations: string[];
  integrity: {
    algorithm: "sha256";
    canonicalization: "augnes-json-c14n-v0_1";
    fingerprint_scope: "reconstruction_conformance_report_without_integrity";
    fingerprint: string;
  };
}
