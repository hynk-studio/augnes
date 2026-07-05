import type { ProjectHistoryIntakeOperatorDecisionPreview } from "./project-history-intake-decision";

export const PROJECT_HISTORY_INTAKE_RECORD_VERSION =
  "project_history_intake_record.v0.1" as const;
export const PROJECT_HISTORY_INTAKE_RECEIPT_VERSION =
  "project_history_intake_receipt.v0.1" as const;
export const PROJECT_HISTORY_INTAKE_STORE_VERSION =
  "project_history_intake_store.v0.1" as const;
export const PROJECT_HISTORY_INTAKE_SCOPE = "project:augnes" as const;

export interface ProjectHistoryIntakeWriteInput {
  decision_preview: ProjectHistoryIntakeOperatorDecisionPreview;
  operator_approval: ProjectHistoryIntakeOperatorApproval;
  idempotency_key: string;
  requested_side_effects?: Record<string, unknown>;
  notes?: string[];
}

export interface ProjectHistoryIntakeOperatorApproval {
  operator_decision: "approve_for_project_history_candidate_ingest";
  approved_by: string;
  operator_ref: string;
  approved_at: string;
  approval_statement: string;
  checklist_confirmations: string[];
}

export interface ProjectHistoryIntakeAuthorityProfile {
  durable_local_project_history_candidate_record: true;
  source_of_truth: false;
  candidate_record_only: true;
  persistence_horizon: "local_project_candidate_record";
  memory_promotion_performed: false;
  perspective_promotion_performed: false;
}

export interface ProjectHistoryIntakeRawMaterialPolicy {
  raw_history_material_stored: false;
  raw_text_material_stored: false;
  raw_excerpt_material_stored: false;
  sanitized_candidate_summaries_only: true;
  private_or_secret_markers_allowed: false;
}

export interface ProjectHistoryIntakeNoPromotionPerformed {
  memory_promoted: false;
  current_working_perspective_updated: false;
  perspective_unit_written: false;
  next_work_bias_written: false;
  continuity_relay_written: false;
  handoff_context_mutated: false;
  selected_refs_written_to_live_handoff: false;
  handoff_sent: false;
}

export interface ProjectHistoryIntakeWriteValidation {
  validation_version: "project_history_intake_write_validation.v0.1";
  decision_preview_revalidated: true;
  selected_candidate_refs_revalidated: true;
  refused_sample_fixture_default_or_smoke_material: false;
  refused_unrequested_side_effects: false;
  refused_memory_perspective_handoff_promotion: false;
  validation_hash: string;
}

export interface ProjectHistoryIntakeWriteAuthorityBoundary {
  durable_local_project_history_candidate_record: true;
  source_of_truth: false;
  candidate_record_only: true;
  can_write_db: boolean;
  can_create_ingest_record: boolean;
  can_create_ingest_receipt: boolean;
  can_write_project_history_candidate_record: boolean;
  can_write_memory: false;
  can_mutate_memory: false;
  can_promote_memory: false;
  can_mutate_current_working_perspective: false;
  can_write_perspective_unit: false;
  can_write_next_work_bias: false;
  can_update_continuity_relay: false;
  can_mutate_handoff_context: false;
  can_apply_handoff_context: false;
  can_write_selected_refs_to_live_handoff: false;
  can_send_handoff: false;
  can_write_dogfood_metrics: false;
  can_write_reuse_ledger: false;
  can_call_provider_openai: false;
  can_call_github: false;
  can_execute_codex: false;
  can_create_pr: false;
  can_merge_pr: false;
  can_run_autonomous_action: false;
  can_create_graph_or_vector_store: false;
  can_create_rag_stack: false;
  can_crawl_or_observe_browser: false;
  notes: string[];
}

export interface ProjectHistoryIntakeNoSideEffects {
  project_history_intake_record_written: boolean;
  project_history_intake_receipt_written: boolean;
  project_history_persisted_as_candidate_record: boolean;
  memory_mutated: false;
  current_working_perspective_updated: false;
  perspective_unit_written: false;
  next_work_bias_written: false;
  continuity_relay_written: false;
  handoff_context_mutated: false;
  selected_refs_written_to_live_handoff: false;
  handoff_sent: false;
  dogfood_metrics_written: false;
  reuse_ledger_written: false;
  provider_called: false;
  github_called: false;
  codex_executed: false;
  pr_created: false;
  pr_merged: false;
  autonomous_action_run: false;
  graph_or_vector_store_created: false;
  rag_stack_created: false;
  crawler_or_browser_observer_created: false;
}

export interface ProjectHistoryIntakeRecord {
  record_version: typeof PROJECT_HISTORY_INTAKE_RECORD_VERSION;
  record_id: string;
  idempotency_key: string;
  created_at: string;
  scope: typeof PROJECT_HISTORY_INTAKE_SCOPE;
  source_refs: string[];
  evidence_refs: string[];
  decision_preview_refs: {
    decision_preview_version: string;
    decision_preview_status: string;
    recommended_operator_decision: string;
  };
  intake_preview_refs: string[];
  source_kind: string;
  source_ref: string;
  operator_ref: string;
  project_ref: string;
  work_ref: string | null;
  selected_candidate_refs: string[];
  candidate_counts_by_kind: Record<string, number>;
  sanitized_candidate_summaries: Array<{
    candidate_ref: string;
    candidate_kind: string;
    label: string;
    summary: string;
  }>;
  privacy_review_confirmation_ref: string;
  authority_profile: ProjectHistoryIntakeAuthorityProfile;
  review_status: "ingested_as_project_history_candidate_record";
  persistence_horizon: "local_project_candidate_record";
  raw_material_policy: ProjectHistoryIntakeRawMaterialPolicy;
  carry_forward_review_only_material: ProjectHistoryIntakeOperatorDecisionPreview["candidate_carry_forward"];
  no_promotion_performed: ProjectHistoryIntakeNoPromotionPerformed;
  write_validation: ProjectHistoryIntakeWriteValidation;
  authority_boundary: ProjectHistoryIntakeWriteAuthorityBoundary;
  notes: string[];
  record_fingerprint: string;
}

export interface ProjectHistoryIntakeReceipt {
  receipt_version: typeof PROJECT_HISTORY_INTAKE_RECEIPT_VERSION;
  record_id: string | null;
  idempotency_key: string | null;
  wrote: boolean;
  idempotent_replay: boolean;
  created_at: string;
  refused: boolean;
  refusal_reasons: string[];
  validation_hash: string | null;
  record_fingerprint: string | null;
  store_ref: string | null;
  source_refs: string[];
  no_side_effects: ProjectHistoryIntakeNoSideEffects;
}

export type ProjectHistoryIntakeWriteStatus =
  | "written"
  | "idempotent_existing"
  | "read"
  | "listed"
  | "refused"
  | "not_found"
  | "schema_missing";

export interface ProjectHistoryIntakeStoreResult {
  store_version: typeof PROJECT_HISTORY_INTAKE_STORE_VERSION;
  scope: typeof PROJECT_HISTORY_INTAKE_SCOPE;
  status: ProjectHistoryIntakeWriteStatus;
  ok: boolean;
  record: ProjectHistoryIntakeRecord | null;
  records: ProjectHistoryIntakeRecord[];
  receipt: ProjectHistoryIntakeReceipt;
  error_code: ProjectHistoryIntakeWriteStatus | null;
  no_side_effects: ProjectHistoryIntakeNoSideEffects;
}
