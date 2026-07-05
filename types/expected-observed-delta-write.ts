import type { ExpectedObservedDeltaOperatorDecisionPreview } from "./expected-observed-delta-decision";

export const EXPECTED_OBSERVED_DELTA_RECORD_VERSION =
  "expected_observed_delta_record.v0.1" as const;
export const EXPECTED_OBSERVED_DELTA_RECEIPT_VERSION =
  "expected_observed_delta_receipt.v0.1" as const;
export const EXPECTED_OBSERVED_DELTA_STORE_VERSION =
  "expected_observed_delta_store.v0.1" as const;
export const EXPECTED_OBSERVED_DELTA_SCOPE = "project:augnes" as const;

export interface ExpectedObservedDeltaWriteInput {
  decision_preview: ExpectedObservedDeltaOperatorDecisionPreview;
  operator_approval: ExpectedObservedDeltaOperatorApproval;
  idempotency_key: string;
  requested_side_effects?: Record<string, unknown>;
  notes?: string[];
}

export interface ExpectedObservedDeltaOperatorApproval {
  operator_decision: "approve_for_expected_observed_delta_record";
  approved_by: string;
  operator_ref: string;
  approved_at: string;
  approval_statement: string;
  checklist_confirmations: string[];
}

export interface ExpectedObservedDeltaRecordAuthorityProfile {
  durable_local_expected_observed_delta_signal_record: true;
  source_of_truth: false;
  dogfood_signal_record_only: true;
  persistence_horizon: "local_project_dogfood_signal_record";
  validation_approval_performed: false;
  reuse_outcome_approval_performed: false;
  memory_promotion_performed: false;
  perspective_promotion_performed: false;
}

export interface ExpectedObservedDeltaNoPromotionPerformed {
  reuse_outcome_ledger_written: false;
  dogfood_metrics_written: false;
  work_episode_written: false;
  memory_mutated: false;
  current_working_perspective_updated: false;
  perspective_unit_written: false;
  next_work_bias_written: false;
  continuity_relay_written: false;
  handoff_context_mutated: false;
  selected_refs_written_to_live_handoff: false;
  handoff_sent: false;
}

export interface ExpectedObservedDeltaWriteValidation {
  validation_version: "expected_observed_delta_write_validation.v0.1";
  decision_preview_revalidated: true;
  selected_delta_candidate_refs_revalidated: true;
  refused_sample_fixture_default_or_smoke_material: false;
  refused_unrequested_side_effects: false;
  refused_memory_perspective_handoff_promotion: false;
  refused_reuse_metric_or_work_episode_write: false;
  validation_hash: string;
}

export interface ExpectedObservedDeltaWriteAuthorityBoundary {
  durable_local_expected_observed_delta_signal_record: true;
  source_of_truth: false;
  dogfood_signal_record_only: true;
  can_write_db: boolean;
  can_create_expected_observed_delta_record: boolean;
  can_create_expected_observed_delta_receipt: boolean;
  can_write_expected_observed_delta: boolean;
  can_write_reuse_outcome_ledger: false;
  can_write_dogfood_metrics: false;
  can_write_work_episode: false;
  can_write_memory: false;
  can_mutate_current_working_perspective: false;
  can_write_perspective_unit: false;
  can_write_next_work_bias: false;
  can_update_continuity_relay: false;
  can_mutate_handoff_context: false;
  can_apply_handoff_context: false;
  can_write_selected_refs_to_live_handoff: false;
  can_send_handoff: false;
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

export interface ExpectedObservedDeltaNoSideEffects {
  expected_observed_delta_record_written: boolean;
  expected_observed_delta_receipt_written: boolean;
  expected_observed_delta_persisted_as_dogfood_signal_record: boolean;
  reuse_outcome_ledger_written: false;
  dogfood_metrics_written: false;
  work_episode_written: false;
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

export interface ExpectedObservedDeltaRecord {
  record_version: typeof EXPECTED_OBSERVED_DELTA_RECORD_VERSION;
  record_id: string;
  idempotency_key: string;
  created_at: string;
  scope: typeof EXPECTED_OBSERVED_DELTA_SCOPE;
  operator_ref: string;
  source_refs: string[];
  evidence_refs: string[];
  work_ref: string | null;
  result_ref: string | null;
  handoff_ref: string | null;
  codex_result_report_intake_record_refs: string[];
  work_episode_residue_preview_ref: string | null;
  selected_delta_candidate_refs: string[];
  expected_summary: ExpectedObservedDeltaOperatorDecisionPreview["would_write_delta_record_preview"]["expected_summary"];
  observed_summary: ExpectedObservedDeltaOperatorDecisionPreview["would_write_delta_record_preview"]["observed_summary"];
  mismatch_summary: ExpectedObservedDeltaOperatorDecisionPreview["would_write_delta_record_preview"]["mismatch_summary"];
  matched_expectations: string[];
  missing_expectations: string[];
  unexpected_observations: string[];
  skipped_or_unverified_checks: string[];
  not_done_items: string[];
  changed_file_deltas: string[];
  requirement_progress_deltas: string[];
  non_goal_risks: string[];
  followups: string[];
  context_reuse_signals: string[];
  authority_profile: ExpectedObservedDeltaRecordAuthorityProfile;
  review_status: "recorded_as_expected_observed_delta";
  persistence_horizon: "local_project_dogfood_signal_record";
  no_promotion_performed: ExpectedObservedDeltaNoPromotionPerformed;
  write_validation: ExpectedObservedDeltaWriteValidation;
  authority_boundary: ExpectedObservedDeltaWriteAuthorityBoundary;
  notes: string[];
  record_fingerprint: string;
}

export interface ExpectedObservedDeltaReceipt {
  receipt_version: typeof EXPECTED_OBSERVED_DELTA_RECEIPT_VERSION;
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
  no_side_effects: ExpectedObservedDeltaNoSideEffects;
}

export type ExpectedObservedDeltaWriteStatus =
  | "written"
  | "idempotent_existing"
  | "read"
  | "listed"
  | "refused"
  | "not_found"
  | "schema_missing";

export interface ExpectedObservedDeltaStoreResult {
  store_version: typeof EXPECTED_OBSERVED_DELTA_STORE_VERSION;
  scope: typeof EXPECTED_OBSERVED_DELTA_SCOPE;
  status: ExpectedObservedDeltaWriteStatus;
  ok: boolean;
  record: ExpectedObservedDeltaRecord | null;
  records: ExpectedObservedDeltaRecord[];
  receipt: ExpectedObservedDeltaReceipt;
  error_code: ExpectedObservedDeltaWriteStatus | null;
  no_side_effects: ExpectedObservedDeltaNoSideEffects;
}
