import type { CodexResultReportIntakeOperatorDecisionPreview } from "./codex-result-report-intake-decision";

export const CODEX_RESULT_REPORT_INTAKE_RECORD_VERSION =
  "codex_result_report_intake_record.v0.1" as const;
export const CODEX_RESULT_REPORT_INTAKE_RECEIPT_VERSION =
  "codex_result_report_intake_receipt.v0.1" as const;
export const CODEX_RESULT_REPORT_INTAKE_STORE_VERSION =
  "codex_result_report_intake_store.v0.1" as const;
export const CODEX_RESULT_REPORT_INTAKE_SCOPE = "project:augnes" as const;

export interface CodexResultReportIntakeWriteInput {
  decision_preview: CodexResultReportIntakeOperatorDecisionPreview;
  operator_approval: CodexResultReportIntakeOperatorApproval;
  idempotency_key: string;
  requested_side_effects?: Record<string, unknown>;
  notes?: string[];
}

export interface CodexResultReportIntakeOperatorApproval {
  operator_decision: "approve_for_codex_result_report_candidate_ingest";
  approved_by: string;
  operator_ref: string;
  approved_at: string;
  approval_statement: string;
  checklist_confirmations: string[];
}

export interface CodexResultReportIntakeAuthorityProfile {
  durable_local_codex_result_report_candidate_record: true;
  source_of_truth: false;
  candidate_record_only: true;
  persistence_horizon: "local_project_candidate_record";
  dogfood_outcome_approval_performed: false;
  memory_promotion_performed: false;
  perspective_promotion_performed: false;
}

export interface CodexResultReportIntakeRawMaterialPolicy {
  raw_report_material_stored: false;
  raw_text_material_stored: false;
  raw_excerpt_material_stored: false;
  sanitized_candidate_summaries_only: true;
  private_or_secret_markers_allowed: false;
}

export interface CodexResultReportIntakeNoPromotionPerformed {
  work_episode_written: false;
  expected_observed_delta_written: false;
  reuse_outcome_ledger_written: false;
  dogfood_metrics_written: false;
  memory_promoted: false;
  current_working_perspective_updated: false;
  perspective_unit_written: false;
  next_work_bias_written: false;
  continuity_relay_written: false;
  handoff_context_mutated: false;
  selected_refs_written_to_live_handoff: false;
  handoff_sent: false;
}

export interface CodexResultReportIntakeWriteValidation {
  validation_version: "codex_result_report_intake_write_validation.v0.1";
  decision_preview_revalidated: true;
  selected_candidate_refs_revalidated: true;
  refused_sample_fixture_default_or_smoke_material: false;
  refused_unrequested_side_effects: false;
  refused_memory_perspective_handoff_promotion: false;
  refused_dogfood_metric_reuse_or_work_episode_write: false;
  validation_hash: string;
}

export interface CodexResultReportIntakeWriteAuthorityBoundary {
  durable_local_codex_result_report_candidate_record: true;
  source_of_truth: false;
  candidate_record_only: true;
  can_write_db: boolean;
  can_create_ingest_record: boolean;
  can_create_ingest_receipt: boolean;
  can_write_codex_result_report_candidate_record: boolean;
  can_write_work_episode: false;
  can_write_expected_observed_delta: false;
  can_write_reuse_outcome_ledger: false;
  can_write_dogfood_metrics: false;
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

export interface CodexResultReportIntakeNoSideEffects {
  codex_result_report_intake_record_written: boolean;
  codex_result_report_intake_receipt_written: boolean;
  codex_result_report_persisted_as_candidate_record: boolean;
  work_episode_residue_written: false;
  expected_observed_delta_written: false;
  reuse_outcome_ledger_written: false;
  dogfood_metrics_written: false;
  memory_mutated: false;
  current_working_perspective_updated: false;
  perspective_unit_written: false;
  next_work_bias_written: false;
  continuity_relay_written: false;
  handoff_context_mutated: false;
  selected_refs_written_to_live_handoff: false;
  handoff_sent: false;
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

export interface CodexResultReportIntakeRecord {
  record_version: typeof CODEX_RESULT_REPORT_INTAKE_RECORD_VERSION;
  record_id: string;
  idempotency_key: string;
  created_at: string;
  scope: typeof CODEX_RESULT_REPORT_INTAKE_SCOPE;
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
  project_ref: string | null;
  work_ref: string | null;
  result_ref: string | null;
  pr_ref: string | null;
  commit_ref: string | null;
  selected_candidate_refs: string[];
  candidate_counts_by_kind: Record<string, number>;
  sanitized_candidate_summaries: Array<{
    candidate_ref: string;
    candidate_kind: string;
    label: string;
    summary: string;
  }>;
  result_status_summary: string[];
  changed_files_summary: string[];
  checks_summary: string[];
  skipped_checks_summary: string[];
  not_done_summary: string[];
  requirement_progress_summary: string[];
  expected_observed_signal_summary: string[];
  context_reuse_signal_summary: string[];
  risk_or_regression_summary: string[];
  followup_summary: string[];
  privacy_review_confirmation_ref: string;
  authority_profile: CodexResultReportIntakeAuthorityProfile;
  review_status: "ingested_as_candidate_record";
  persistence_horizon: "local_project_candidate_record";
  raw_material_policy: CodexResultReportIntakeRawMaterialPolicy;
  carry_forward_review_only_material: CodexResultReportIntakeOperatorDecisionPreview["candidate_carry_forward"];
  no_promotion_performed: CodexResultReportIntakeNoPromotionPerformed;
  write_validation: CodexResultReportIntakeWriteValidation;
  authority_boundary: CodexResultReportIntakeWriteAuthorityBoundary;
  notes: string[];
  record_fingerprint: string;
}

export interface CodexResultReportIntakeReceipt {
  receipt_version: typeof CODEX_RESULT_REPORT_INTAKE_RECEIPT_VERSION;
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
  no_side_effects: CodexResultReportIntakeNoSideEffects;
}

export type CodexResultReportIntakeWriteStatus =
  | "written"
  | "idempotent_existing"
  | "read"
  | "listed"
  | "refused"
  | "not_found"
  | "schema_missing";

export interface CodexResultReportIntakeStoreResult {
  store_version: typeof CODEX_RESULT_REPORT_INTAKE_STORE_VERSION;
  scope: typeof CODEX_RESULT_REPORT_INTAKE_SCOPE;
  status: CodexResultReportIntakeWriteStatus;
  ok: boolean;
  record: CodexResultReportIntakeRecord | null;
  records: CodexResultReportIntakeRecord[];
  receipt: CodexResultReportIntakeReceipt;
  error_code: CodexResultReportIntakeWriteStatus | null;
  no_side_effects: CodexResultReportIntakeNoSideEffects;
}
