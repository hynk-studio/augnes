import type {
  ManualResearchNoteParserResult,
  ManualResearchNoteParserVersion,
  ManualResearchNoteParserWarning,
} from "@/lib/research-candidate-review/manual-note-parser";
import type {
  ResearchCandidateReviewPreviewResponse,
  ResearchCandidateReviewScope,
} from "@/types/research-candidate-review";

export const MANUAL_NOTE_PREVIEW_ROUTE =
  "/api/research-candidate-review/manual-note-preview";

export const MANUAL_NOTE_PREVIEW_DRAFTS_ROUTE =
  "/api/research-candidate-review/manual-note-preview-drafts";

export const MANUAL_NOTE_RUNTIME_VERSION =
  "manual_research_candidate_runtime_preview.v0.1";

export const MAX_MANUAL_NOTE_TEXT_LENGTH = 20_000;
export const MAX_MANUAL_NOTE_BODY_BYTES = 64 * 1024;
export const MAX_MANUAL_NOTE_PREVIEW_DRAFT_LIST_LIMIT = 50;
export const DEFAULT_MANUAL_NOTE_PREVIEW_DRAFT_LIST_LIMIT = 10;
export const MAX_MANUAL_NOTE_PREVIEW_DRAFT_DISCARD_REASON_LENGTH = 500;
export const MAX_MANUAL_NOTE_PREVIEW_DRAFT_LABEL_LENGTH = 160;
export const MAX_MANUAL_NOTE_PREVIEW_DRAFT_ACTIVITY_LIST_LIMIT = 50;
export const DEFAULT_MANUAL_NOTE_PREVIEW_DRAFT_ACTIVITY_LIST_LIMIT = 20;
export const MANUAL_NOTE_PREVIEW_DRAFT_READINESS_COPY_PACKET_KIND =
  "research_candidate_preview_draft_readiness_copy_packet";
export const MANUAL_NOTE_PREVIEW_DRAFT_READINESS_COPY_PACKET_VERSION =
  "research_candidate_preview_draft_readiness_copy_packet.v0.1";

export type ManualNotePreviewPersistenceMode =
  | "persisted_preview_draft"
  | "route_only_no_persistence";

export type ManualNotePreviewDraftStatus = "preview_draft";

export type ManualNotePreviewDraftLifecycleStatus =
  | "active_preview_draft"
  | "discarded_preview_draft";

export type ManualNotePreviewDraftListLifecycleFilter =
  | "active"
  | "discarded"
  | "all";

export type ManualNotePreviewDraftListSort =
  | "created_desc"
  | "created_asc";

export type ManualNotePreviewDraftWarningFilter =
  | "all"
  | "with_warnings"
  | "without_warnings";

export type ManualNotePreviewDraftCandidateFilter =
  | "all"
  | "with_candidates"
  | "without_candidates";

export type ManualNotePreviewDraftActivityType =
  | "preview_draft_created"
  | "label_updated"
  | "label_cleared"
  | "preview_draft_discarded";

export type ManualNotePreviewDraftLabelState = "labeled" | "untitled";

export type ManualNotePreviewDraftDiscardState = "active" | "discarded";

export type ManualNotePreviewDraftLifecycleSummary = {
  label_state: ManualNotePreviewDraftLabelState;
  discard_state: ManualNotePreviewDraftDiscardState;
  activity_count: number;
  last_activity_type: ManualNotePreviewDraftActivityType | null;
  last_activity_at: string | null;
};

export type ManualNotePreviewDraftListSummary = {
  returned_count: number;
  active_count: number;
  discarded_count: number;
  with_warnings_count: number;
  without_warnings_count: number;
  with_candidates_count: number;
  without_candidates_count: number;
  activity_recorded_count: number;
  label_present_count: number;
  label_missing_count: number;
  summary_scope: "returned_bounded_list";
};

export type ManualNotePreviewDraftListQuery = {
  limit: number;
  lifecycle: ManualNotePreviewDraftListLifecycleFilter;
  sort: ManualNotePreviewDraftListSort;
  warnings: ManualNotePreviewDraftWarningFilter;
  candidates: ManualNotePreviewDraftCandidateFilter;
  include_discarded: boolean;
};

export type ManualNotePreviewRuntimeAuthority = {
  preview_only: true;
  read_only_preview_material: true;
  candidate_only: true;
  runtime_route_only: true;
  non_canonical_preview_draft: true;
  canonical_perspective_created: false;
  proof_created: false;
  evidence_created: false;
  work_item_created: false;
  provider_calls: false;
  retrieval: false;
  source_fetching: false;
  promotion_workflow: false;
};

export type ManualNotePreviewRuntimeBoundary = {
  route: typeof MANUAL_NOTE_PREVIEW_ROUTE;
  runtime_version: typeof MANUAL_NOTE_RUNTIME_VERSION;
  source_kind: "manual_paste";
  parser_execution: "same_origin_route_local_parser_only";
  manual_note_text_max_chars: typeof MAX_MANUAL_NOTE_TEXT_LENGTH;
  optional_preview_draft_persistence: boolean;
  raw_manual_note_text_persisted: false;
  preview_draft_status: ManualNotePreviewDraftStatus;
  durable_candidate_storage: false;
  durable_review_storage: false;
  durable_receipt_storage: false;
  canonical_perspective_write: false;
  proof_or_evidence_writes: false;
  work_item_creation: false;
  provider_or_openai_calls: false;
  retrieval_or_rag: false;
  source_fetching: false;
  codex_execution: false;
  external_handoff_sending: false;
};

export type ManualNotePreviewNoSideEffects = {
  provider_or_openai_calls_absent: true;
  retrieval_or_source_fetching_absent: true;
  proof_or_evidence_writes_absent: true;
  work_item_creation_absent: true;
  promotion_workflow_absent: true;
  codex_execution_absent: true;
  external_handoff_absent: true;
  canonical_perspective_write_absent: true;
};

export type ManualNotePreviewDraftCandidateCountSummary = {
  total: number;
  claims: number;
  evidence: number;
  tensions: number;
  knowledge_gaps: number;
  perspective_deltas: number;
  follow_up_work: number;
};

export type ManualNotePreviewDraftLifecycleAuthority = {
  preview_only: true;
  lifecycle_hygiene_only: true;
  non_canonical_preview_draft: true;
  discard_marker_only: true;
  discard_is_not_reject_defer_or_promote: true;
  raw_manual_note_text_available: false;
  canonical_perspective_created: false;
  proof_created: false;
  evidence_created: false;
  work_item_created: false;
  provider_calls: false;
  retrieval: false;
  source_fetching: false;
  promotion_workflow: false;
};

export type ManualNotePreviewDraftLifecycleRuntimeBoundary = {
  route: string;
  runtime_version: typeof MANUAL_NOTE_RUNTIME_VERSION;
  source_kind: "stored_manual_paste_preview_draft";
  lifecycle_actions: "list_open_discard_only";
  lifecycle_status_source: "discard_marker_table";
  lifecycle_summary_source: "returned_bounded_list";
  lifecycle_summary_is_preview_metadata_only: true;
  lifecycle_summary_is_not_approval_history: true;
  counts_do_not_promote_or_canonize: true;
  raw_manual_note_text_persisted: false;
  raw_manual_note_text_returned: false;
  preview_draft_records_are_non_canonical: true;
  discard_deletes_canonical_state: false;
  durable_candidate_storage: false;
  durable_review_storage: false;
  durable_receipt_storage: false;
  canonical_perspective_write: false;
  proof_or_evidence_writes: false;
  work_item_creation: false;
  provider_or_openai_calls: false;
  retrieval_or_rag: false;
  source_fetching: false;
  codex_execution: false;
  external_handoff_sending: false;
};

export type ManualNotePreviewDraftLabelRuntimeBoundary = {
  route: string;
  runtime_version: typeof MANUAL_NOTE_RUNTIME_VERSION;
  source_kind: "stored_manual_paste_preview_draft";
  lifecycle_actions: "label_update_only";
  lifecycle_status_source: "discard_marker_table";
  raw_manual_note_text_persisted: false;
  raw_manual_note_text_returned: false;
  preview_draft_records_are_non_canonical: true;
  label_is_operator_preview_metadata_only: true;
  label_promotes_perspective: false;
  label_creates_proof_or_evidence: false;
  label_creates_work_item: false;
  discard_deletes_canonical_state: false;
  durable_candidate_storage: false;
  durable_review_storage: false;
  durable_receipt_storage: false;
  canonical_perspective_write: false;
  proof_or_evidence_writes: false;
  work_item_creation: false;
  provider_or_openai_calls: false;
  retrieval_or_rag: false;
  source_fetching: false;
  codex_execution: false;
  external_handoff_sending: false;
};

export type ManualNotePreviewDraftActivityAuthority = {
  preview_only: true;
  lifecycle_metadata_only: true;
  activity_is_preview_metadata_only: true;
  activity_is_not_approval_history: true;
  approval_workflow_created: false;
  reject_defer_promote_workflow_created: false;
  raw_manual_note_text_persisted: false;
  raw_manual_note_text_returned: false;
  preview_json_snapshot_stored: false;
  canonical_perspective_write: false;
  proof_or_evidence_writes: false;
  work_item_creation: false;
  provider_or_openai_calls: false;
  retrieval_or_rag: false;
  source_fetching: false;
  codex_execution: false;
  external_handoff_sending: false;
};

export type ManualNotePreviewDraftActivityRuntimeBoundary = {
  route: string;
  runtime_version: typeof MANUAL_NOTE_RUNTIME_VERSION;
  source_kind: "stored_manual_paste_preview_draft";
  activity_actions: "read_lifecycle_metadata_only";
  lifecycle_status_source: "discard_marker_table";
  activity_is_preview_metadata_only: true;
  approval_workflow_created: false;
  reject_defer_promote_workflow_created: false;
  raw_manual_note_text_persisted: false;
  raw_manual_note_text_returned: false;
  preview_json_snapshot_returned: false;
  canonical_perspective_write: false;
  proof_or_evidence_writes: false;
  work_item_creation: false;
  provider_or_openai_calls: false;
  retrieval_or_rag: false;
  source_fetching: false;
  codex_execution: false;
  external_handoff_sending: false;
};

export type ManualNotePreviewDraftPromotionReadinessStatus =
  | "blocked"
  | "needs_operator_review"
  | "ready_for_promotion_discussion";

export type ManualNotePreviewDraftPromotionReadinessGateStatus =
  | "pass"
  | "warn"
  | "block";

export type ManualNotePreviewDraftPromotionReadinessGateId =
  | "lifecycle_gate"
  | "storage_boundary_gate"
  | "authority_boundary_gate"
  | "parser_warning_gate"
  | "source_reference_gate"
  | "claim_candidate_gate"
  | "evidence_candidate_gate"
  | "tension_gap_gate"
  | "follow_up_work_gate"
  | "label_metadata_gate"
  | "activity_metadata_gate"
  | "canonical_link_guard_gate";

export type ManualNotePreviewDraftPromotionReadinessResolutionBoundary = {
  preview_metadata_only: true;
  does_not_promote: true;
  does_not_write_proof_or_evidence: true;
  does_not_create_work_item: true;
  does_not_fetch_sources: true;
  does_not_run_retrieval: true;
  does_not_call_provider: true;
  does_not_update_perspective: true;
};

export type ManualNotePreviewDraftPromotionReadinessResolutionHint = {
  safe_action: string;
  action_scope: "existing_preview_surface" | "new_preview_draft" | "separate_future_lane" | "stop_and_inspect";
};

export type ManualNotePreviewDraftPromotionReadinessGateExplanation = {
  explanation_title: string;
  operator_explanation: string;
  why_it_matters: string;
  current_signal: string;
  suggested_safe_actions: ManualNotePreviewDraftPromotionReadinessResolutionHint[];
  related_ui_surfaces: string[];
  related_evidence_fields: string[];
  can_be_resolved_in_current_preview_lane: boolean;
  resolution_boundary: ManualNotePreviewDraftPromotionReadinessResolutionBoundary;
};

export type ManualNotePreviewDraftPromotionReadinessGateResult = {
  gate_id: ManualNotePreviewDraftPromotionReadinessGateId;
  label: string;
  status: ManualNotePreviewDraftPromotionReadinessGateStatus;
  summary: string;
  detail: string;
  evidence_fields: string[];
  gate_explanation: ManualNotePreviewDraftPromotionReadinessGateExplanation;
  no_side_effects: true;
};

export type ManualNotePreviewDraftPromotionSourceSummary = {
  source_ref_count: number;
  source_titles: string[];
  source_identifiers: string[];
  source_statuses: string[];
  source_boundary_notes: string[];
};

export type ManualNotePreviewDraftPromotionCandidateSummary =
  ManualNotePreviewDraftCandidateCountSummary;

export type ManualNotePreviewDraftPromotionReadinessAuthority = {
  preflight_only: true;
  readiness_is_not_promotion_authority: true;
  preview_draft_metadata_only: true;
  canonical_perspective_created: false;
  proof_created: false;
  evidence_created: false;
  work_item_created: false;
  approval_workflow_created: false;
  publication_workflow_created: false;
  promotion_workflow_created: false;
  provider_calls: false;
  retrieval: false;
  source_fetching: false;
  codex_execution: false;
  external_handoff_sending: false;
};

export type ManualNotePreviewDraftPromotionReadinessRuntimeBoundary = {
  route: string;
  runtime_version: typeof MANUAL_NOTE_RUNTIME_VERSION;
  source_kind: "stored_manual_paste_preview_draft";
  preflight_actions: "read_promotion_readiness_only";
  preflight_only: true;
  readiness_is_not_promotion_authority: true;
  raw_manual_note_text_persisted: false;
  raw_manual_note_text_returned: false;
  preview_draft_records_are_non_canonical: true;
  canonical_perspective_write: false;
  proof_or_evidence_writes: false;
  work_item_creation: false;
  approval_workflow_created: false;
  publication_workflow_created: false;
  promotion_workflow_created: false;
  provider_or_openai_calls: false;
  retrieval_or_rag: false;
  source_fetching: false;
  codex_execution: false;
  external_handoff_sending: false;
  browser_persistence: false;
};

export type ManualNotePreviewDraftReadinessCopyPacketKind =
  typeof MANUAL_NOTE_PREVIEW_DRAFT_READINESS_COPY_PACKET_KIND;

export type ManualNotePreviewDraftReadinessCopyPacketVersion =
  typeof MANUAL_NOTE_PREVIEW_DRAFT_READINESS_COPY_PACKET_VERSION;

export type ManualNotePreviewDraftReadinessCopyPacketBoundary = {
  preview_only: true;
  local_clipboard_only: true;
  external_handoff_sent: false;
  proof_or_evidence_writes: false;
  perspective_promotion: false;
  canonical_graph_write: false;
  work_item_creation: false;
  provider_or_openai_calls: false;
  retrieval_or_rag: false;
  source_fetching: false;
  codex_execution: false;
  browser_persistence: false;
  raw_manual_note_text_included: false;
  promotion_authority_granted: false;
};

export type ManualNotePreviewDraftReadinessCopyPacket = {
  packet_version: ManualNotePreviewDraftReadinessCopyPacketVersion;
  packet_kind: ManualNotePreviewDraftReadinessCopyPacketKind;
  generated_at: string;
  preview_draft_id: string;
  operator_note_label: string | null;
  display_label: string;
  lifecycle_status: ManualNotePreviewDraftLifecycleStatus;
  draft_metadata: {
    parser_version: string;
    preview_version: string;
    input_fingerprint: string;
    warning_count: number;
    candidate_count_summary: ManualNotePreviewDraftCandidateCountSummary;
    created_at: string;
    updated_at: string;
  };
  readiness_status: ManualNotePreviewDraftPromotionReadinessStatus;
  readiness_score: number;
  blockers: string[];
  warnings: string[];
  next_review_steps: string[];
  source_summary: ManualNotePreviewDraftPromotionSourceSummary;
  candidate_summary: ManualNotePreviewDraftPromotionCandidateSummary;
  lifecycle_summary: ManualNotePreviewDraftLifecycleSummary;
  gate_results: ManualNotePreviewDraftPromotionReadinessGateResult[];
  activity_summary: {
    included: boolean;
    count: number;
    lifecycle_status: ManualNotePreviewDraftLifecycleStatus | null;
    activity_types: ManualNotePreviewDraftActivityType[];
  };
  runtime_boundary: ManualNotePreviewDraftPromotionReadinessRuntimeBoundary;
  no_side_effects: ManualNotePreviewNoSideEffects;
  authority: ManualNotePreviewDraftPromotionReadinessAuthority;
  copy_packet_boundary: ManualNotePreviewDraftReadinessCopyPacketBoundary;
};

export type ManualNotePreviewDraftDiscardMetadata = {
  discard_id: string;
  preview_draft_id: string;
  scope: ResearchCandidateReviewScope;
  discarded_at: string;
  discarded_by: string;
  discard_reason: string;
};

export type ManualNotePreviewDraftListItem = {
  preview_draft_id: string;
  status: ManualNotePreviewDraftStatus;
  lifecycle_status: ManualNotePreviewDraftLifecycleStatus;
  scope: ResearchCandidateReviewScope;
  source_kind: "manual_paste";
  operator_note_label: string | null;
  parser_version: string;
  preview_version: string;
  input_fingerprint: string;
  manual_note_text_stored: false;
  warning_count: number;
  candidate_count_summary: ManualNotePreviewDraftCandidateCountSummary;
  lifecycle_summary: ManualNotePreviewDraftLifecycleSummary;
  created_at: string;
  updated_at: string;
  discard_metadata?: ManualNotePreviewDraftDiscardMetadata;
};

export type ManualNotePreviewDraftDetailMetadata =
  ManualNotePreviewDraftListItem & {
    promoted_at: string | null;
    canonical_perspective_id: string | null;
    proof_id: string | null;
    evidence_id: string | null;
    work_item_id: string | null;
    stored_authority: ManualNotePreviewRuntimeAuthority;
    stored_runtime_boundary: ManualNotePreviewRuntimeBoundary;
    stored_no_side_effects: ManualNotePreviewNoSideEffects;
  };

export type ManualNotePreviewDraftActivityItem = {
  activity_id: string;
  preview_draft_id: string;
  activity_type: ManualNotePreviewDraftActivityType;
  activity_at: string;
  activity_by: string;
  summary: string;
  before_json: Record<string, unknown>;
  after_json: Record<string, unknown>;
  authority: ManualNotePreviewDraftActivityAuthority;
  no_side_effects: ManualNotePreviewNoSideEffects;
};

export type ManualNotePreviewDraftListOkResponse = {
  ok: true;
  runtime_version: typeof MANUAL_NOTE_RUNTIME_VERSION;
  items: ManualNotePreviewDraftListItem[];
  count: number;
  limit: number;
  lifecycle: ManualNotePreviewDraftListLifecycleFilter;
  sort: ManualNotePreviewDraftListSort;
  warnings: ManualNotePreviewDraftWarningFilter;
  candidates: ManualNotePreviewDraftCandidateFilter;
  include_discarded: boolean;
  summary: ManualNotePreviewDraftListSummary;
  no_side_effects: ManualNotePreviewNoSideEffects;
  runtime_boundary: ManualNotePreviewDraftLifecycleRuntimeBoundary;
};

export type ManualNotePreviewDraftDetailOkResponse = {
  ok: true;
  runtime_version: typeof MANUAL_NOTE_RUNTIME_VERSION;
  draft: ManualNotePreviewDraftDetailMetadata;
  preview: ResearchCandidateReviewPreviewResponse;
  warnings: ManualResearchNoteParserWarning[];
  authority: ManualNotePreviewRuntimeAuthority;
  runtime_boundary: ManualNotePreviewDraftLifecycleRuntimeBoundary;
  no_side_effects: ManualNotePreviewNoSideEffects;
  lifecycle_status: ManualNotePreviewDraftLifecycleStatus;
  discard_metadata?: ManualNotePreviewDraftDiscardMetadata;
};

export type ManualNotePreviewDraftDiscardOkResponse = {
  ok: true;
  runtime_version: typeof MANUAL_NOTE_RUNTIME_VERSION;
  preview_draft_id: string;
  lifecycle_status: "discarded_preview_draft";
  discarded_at: string;
  discard_metadata: ManualNotePreviewDraftDiscardMetadata;
  no_side_effects: ManualNotePreviewNoSideEffects;
  runtime_boundary: ManualNotePreviewDraftLifecycleRuntimeBoundary;
};

export type ManualNotePreviewDraftLabelUpdateRequest = {
  operator_note_label: string | null;
};

export type ManualNotePreviewDraftLabelUpdateOkResponse = {
  ok: true;
  runtime_version: typeof MANUAL_NOTE_RUNTIME_VERSION;
  preview_draft_id: string;
  operator_note_label: string | null;
  updated_at: string;
  lifecycle_status: ManualNotePreviewDraftLifecycleStatus;
  runtime_boundary: ManualNotePreviewDraftLabelRuntimeBoundary;
  no_side_effects: ManualNotePreviewNoSideEffects;
};

export type ManualNotePreviewDraftActivityOkResponse = {
  ok: true;
  runtime_version: typeof MANUAL_NOTE_RUNTIME_VERSION;
  preview_draft_id: string;
  lifecycle_status: ManualNotePreviewDraftLifecycleStatus;
  items: ManualNotePreviewDraftActivityItem[];
  count: number;
  limit: number;
  runtime_boundary: ManualNotePreviewDraftActivityRuntimeBoundary;
  no_side_effects: ManualNotePreviewNoSideEffects;
};

export type ManualNotePreviewDraftPromotionReadinessOkResponse = {
  ok: true;
  runtime_version: typeof MANUAL_NOTE_RUNTIME_VERSION;
  preview_draft_id: string;
  lifecycle_status: ManualNotePreviewDraftLifecycleStatus;
  readiness_status: ManualNotePreviewDraftPromotionReadinessStatus;
  readiness_score: number;
  gate_results: ManualNotePreviewDraftPromotionReadinessGateResult[];
  blockers: string[];
  warnings: string[];
  next_review_steps: string[];
  source_summary: ManualNotePreviewDraftPromotionSourceSummary;
  candidate_summary: ManualNotePreviewDraftPromotionCandidateSummary;
  lifecycle_summary: ManualNotePreviewDraftLifecycleSummary;
  authority: ManualNotePreviewDraftPromotionReadinessAuthority;
  runtime_boundary: ManualNotePreviewDraftPromotionReadinessRuntimeBoundary;
  no_side_effects: ManualNotePreviewNoSideEffects;
  created_at: string;
};

export type ManualNotePreviewDraftRuntimeErrorResponse = {
  ok: false;
  error_code:
    | "invalid_limit"
    | "invalid_include_discarded"
    | "invalid_json"
    | "invalid_body"
    | "invalid_lifecycle"
    | "invalid_sort"
    | "invalid_warnings"
    | "invalid_candidates"
    | "invalid_preview_draft_id"
    | "unsupported_scope"
    | "preview_draft_not_found"
    | "discard_reason_too_large"
    | "operator_note_label_too_large"
    | "runtime_unavailable";
  message: string;
  runtime_boundary:
    | ManualNotePreviewDraftLifecycleRuntimeBoundary
    | ManualNotePreviewDraftLabelRuntimeBoundary
    | ManualNotePreviewDraftActivityRuntimeBoundary
    | ManualNotePreviewDraftPromotionReadinessRuntimeBoundary;
};

export type ManualNotePreviewDraftListResponse =
  | ManualNotePreviewDraftListOkResponse
  | ManualNotePreviewDraftRuntimeErrorResponse;

export type ManualNotePreviewDraftDetailResponse =
  | ManualNotePreviewDraftDetailOkResponse
  | ManualNotePreviewDraftRuntimeErrorResponse;

export type ManualNotePreviewDraftDiscardResponse =
  | ManualNotePreviewDraftDiscardOkResponse
  | ManualNotePreviewDraftRuntimeErrorResponse;

export type ManualNotePreviewDraftLabelUpdateResponse =
  | ManualNotePreviewDraftLabelUpdateOkResponse
  | ManualNotePreviewDraftRuntimeErrorResponse;

export type ManualNotePreviewDraftActivityResponse =
  | ManualNotePreviewDraftActivityOkResponse
  | ManualNotePreviewDraftRuntimeErrorResponse;

export type ManualNotePreviewDraftPromotionReadinessResponse =
  | ManualNotePreviewDraftPromotionReadinessOkResponse
  | ManualNotePreviewDraftRuntimeErrorResponse;

export type ManualNotePreviewRuntimeRequest = {
  manual_note_text: string;
  scope?: ResearchCandidateReviewScope;
  persist_preview_draft?: boolean;
  operator_note_label?: string;
};

export type ManualNotePreviewRuntimeDraftMetadata = {
  preview_draft_id?: string;
  persisted_preview_draft: boolean;
  persistence_mode: ManualNotePreviewPersistenceMode;
};

export type ManualNotePreviewRuntimeOkResponse =
  ManualNotePreviewRuntimeDraftMetadata & {
    ok: true;
    runtime_version: typeof MANUAL_NOTE_RUNTIME_VERSION;
    parser_version: ManualResearchNoteParserVersion;
    preview: ResearchCandidateReviewPreviewResponse;
    warnings: ManualResearchNoteParserWarning[];
    authority: ManualNotePreviewRuntimeAuthority;
    runtime_boundary: ManualNotePreviewRuntimeBoundary;
    input_fingerprint: string;
    created_at: string;
    no_side_effects: ManualNotePreviewNoSideEffects;
  };

export type ManualNotePreviewRuntimeErrorResponse = {
  ok: false;
  error_code:
    | "invalid_json"
    | "invalid_body"
    | "empty_manual_note_text"
    | "manual_note_text_too_large"
    | "unsupported_scope"
    | "runtime_unavailable";
  message: string;
  runtime_boundary: ManualNotePreviewRuntimeBoundary;
};

export type ManualNotePreviewRuntimeResponse =
  | ManualNotePreviewRuntimeOkResponse
  | ManualNotePreviewRuntimeErrorResponse;

export function buildManualNotePreviewRuntimeAuthority(): ManualNotePreviewRuntimeAuthority {
  return {
    preview_only: true,
    read_only_preview_material: true,
    candidate_only: true,
    runtime_route_only: true,
    non_canonical_preview_draft: true,
    canonical_perspective_created: false,
    proof_created: false,
    evidence_created: false,
    work_item_created: false,
    provider_calls: false,
    retrieval: false,
    source_fetching: false,
    promotion_workflow: false,
  };
}

export function buildManualNotePreviewDraftDetailRoute(previewDraftId: string) {
  return `${MANUAL_NOTE_PREVIEW_DRAFTS_ROUTE}/${encodeURIComponent(previewDraftId)}`;
}

export function buildManualNotePreviewDraftDiscardRoute(previewDraftId: string) {
  return `${buildManualNotePreviewDraftDetailRoute(previewDraftId)}/discard`;
}

export function buildManualNotePreviewDraftLabelRoute(previewDraftId: string) {
  return `${buildManualNotePreviewDraftDetailRoute(previewDraftId)}/label`;
}

export function buildManualNotePreviewDraftActivityRoute(previewDraftId: string) {
  return `${buildManualNotePreviewDraftDetailRoute(previewDraftId)}/activity`;
}

export function buildManualNotePreviewDraftPromotionReadinessRoute(
  previewDraftId: string,
) {
  return `${buildManualNotePreviewDraftDetailRoute(previewDraftId)}/promotion-readiness`;
}

export function buildManualNotePreviewRuntimeBoundary({
  persistPreviewDraft,
}: {
  persistPreviewDraft: boolean;
}): ManualNotePreviewRuntimeBoundary {
  return {
    route: MANUAL_NOTE_PREVIEW_ROUTE,
    runtime_version: MANUAL_NOTE_RUNTIME_VERSION,
    source_kind: "manual_paste",
    parser_execution: "same_origin_route_local_parser_only",
    manual_note_text_max_chars: MAX_MANUAL_NOTE_TEXT_LENGTH,
    optional_preview_draft_persistence: persistPreviewDraft,
    raw_manual_note_text_persisted: false,
    preview_draft_status: "preview_draft",
    durable_candidate_storage: false,
    durable_review_storage: false,
    durable_receipt_storage: false,
    canonical_perspective_write: false,
    proof_or_evidence_writes: false,
    work_item_creation: false,
    provider_or_openai_calls: false,
    retrieval_or_rag: false,
    source_fetching: false,
    codex_execution: false,
    external_handoff_sending: false,
  };
}

export function buildManualNotePreviewNoSideEffects(): ManualNotePreviewNoSideEffects {
  return {
    provider_or_openai_calls_absent: true,
    retrieval_or_source_fetching_absent: true,
    proof_or_evidence_writes_absent: true,
    work_item_creation_absent: true,
    promotion_workflow_absent: true,
    codex_execution_absent: true,
    external_handoff_absent: true,
    canonical_perspective_write_absent: true,
  };
}

export function buildManualNotePreviewDraftLifecycleAuthority(): ManualNotePreviewDraftLifecycleAuthority {
  return {
    preview_only: true,
    lifecycle_hygiene_only: true,
    non_canonical_preview_draft: true,
    discard_marker_only: true,
    discard_is_not_reject_defer_or_promote: true,
    raw_manual_note_text_available: false,
    canonical_perspective_created: false,
    proof_created: false,
    evidence_created: false,
    work_item_created: false,
    provider_calls: false,
    retrieval: false,
    source_fetching: false,
    promotion_workflow: false,
  };
}

export function buildManualNotePreviewDraftActivityAuthority(): ManualNotePreviewDraftActivityAuthority {
  return {
    preview_only: true,
    lifecycle_metadata_only: true,
    activity_is_preview_metadata_only: true,
    activity_is_not_approval_history: true,
    approval_workflow_created: false,
    reject_defer_promote_workflow_created: false,
    raw_manual_note_text_persisted: false,
    raw_manual_note_text_returned: false,
    preview_json_snapshot_stored: false,
    canonical_perspective_write: false,
    proof_or_evidence_writes: false,
    work_item_creation: false,
    provider_or_openai_calls: false,
    retrieval_or_rag: false,
    source_fetching: false,
    codex_execution: false,
    external_handoff_sending: false,
  };
}

export function buildManualNotePreviewDraftLifecycleBoundary({
  route,
}: {
  route: string;
}): ManualNotePreviewDraftLifecycleRuntimeBoundary {
  return {
    route,
    runtime_version: MANUAL_NOTE_RUNTIME_VERSION,
    source_kind: "stored_manual_paste_preview_draft",
    lifecycle_actions: "list_open_discard_only",
    lifecycle_status_source: "discard_marker_table",
    lifecycle_summary_source: "returned_bounded_list",
    lifecycle_summary_is_preview_metadata_only: true,
    lifecycle_summary_is_not_approval_history: true,
    counts_do_not_promote_or_canonize: true,
    raw_manual_note_text_persisted: false,
    raw_manual_note_text_returned: false,
    preview_draft_records_are_non_canonical: true,
    discard_deletes_canonical_state: false,
    durable_candidate_storage: false,
    durable_review_storage: false,
    durable_receipt_storage: false,
    canonical_perspective_write: false,
    proof_or_evidence_writes: false,
    work_item_creation: false,
    provider_or_openai_calls: false,
    retrieval_or_rag: false,
    source_fetching: false,
    codex_execution: false,
    external_handoff_sending: false,
  };
}

export function buildManualNotePreviewDraftLabelBoundary({
  route,
}: {
  route: string;
}): ManualNotePreviewDraftLabelRuntimeBoundary {
  return {
    route,
    runtime_version: MANUAL_NOTE_RUNTIME_VERSION,
    source_kind: "stored_manual_paste_preview_draft",
    lifecycle_actions: "label_update_only",
    lifecycle_status_source: "discard_marker_table",
    raw_manual_note_text_persisted: false,
    raw_manual_note_text_returned: false,
    preview_draft_records_are_non_canonical: true,
    label_is_operator_preview_metadata_only: true,
    label_promotes_perspective: false,
    label_creates_proof_or_evidence: false,
    label_creates_work_item: false,
    discard_deletes_canonical_state: false,
    durable_candidate_storage: false,
    durable_review_storage: false,
    durable_receipt_storage: false,
    canonical_perspective_write: false,
    proof_or_evidence_writes: false,
    work_item_creation: false,
    provider_or_openai_calls: false,
    retrieval_or_rag: false,
    source_fetching: false,
    codex_execution: false,
    external_handoff_sending: false,
  };
}

export function buildManualNotePreviewDraftActivityBoundary({
  route,
}: {
  route: string;
}): ManualNotePreviewDraftActivityRuntimeBoundary {
  return {
    route,
    runtime_version: MANUAL_NOTE_RUNTIME_VERSION,
    source_kind: "stored_manual_paste_preview_draft",
    activity_actions: "read_lifecycle_metadata_only",
    lifecycle_status_source: "discard_marker_table",
    activity_is_preview_metadata_only: true,
    approval_workflow_created: false,
    reject_defer_promote_workflow_created: false,
    raw_manual_note_text_persisted: false,
    raw_manual_note_text_returned: false,
    preview_json_snapshot_returned: false,
    canonical_perspective_write: false,
    proof_or_evidence_writes: false,
    work_item_creation: false,
    provider_or_openai_calls: false,
    retrieval_or_rag: false,
    source_fetching: false,
    codex_execution: false,
    external_handoff_sending: false,
  };
}

export function buildManualNotePreviewDraftPromotionReadinessAuthority(): ManualNotePreviewDraftPromotionReadinessAuthority {
  return {
    preflight_only: true,
    readiness_is_not_promotion_authority: true,
    preview_draft_metadata_only: true,
    canonical_perspective_created: false,
    proof_created: false,
    evidence_created: false,
    work_item_created: false,
    approval_workflow_created: false,
    publication_workflow_created: false,
    promotion_workflow_created: false,
    provider_calls: false,
    retrieval: false,
    source_fetching: false,
    codex_execution: false,
    external_handoff_sending: false,
  };
}

export function buildManualNotePreviewDraftPromotionReadinessBoundary({
  route,
}: {
  route: string;
}): ManualNotePreviewDraftPromotionReadinessRuntimeBoundary {
  return {
    route,
    runtime_version: MANUAL_NOTE_RUNTIME_VERSION,
    source_kind: "stored_manual_paste_preview_draft",
    preflight_actions: "read_promotion_readiness_only",
    preflight_only: true,
    readiness_is_not_promotion_authority: true,
    raw_manual_note_text_persisted: false,
    raw_manual_note_text_returned: false,
    preview_draft_records_are_non_canonical: true,
    canonical_perspective_write: false,
    proof_or_evidence_writes: false,
    work_item_creation: false,
    approval_workflow_created: false,
    publication_workflow_created: false,
    promotion_workflow_created: false,
    provider_or_openai_calls: false,
    retrieval_or_rag: false,
    source_fetching: false,
    codex_execution: false,
    external_handoff_sending: false,
    browser_persistence: false,
  };
}

export function buildManualNotePreviewRuntimeOkResponse({
  parserResult,
  inputFingerprint,
  createdAt,
  draftMetadata,
  persistPreviewDraft,
}: {
  parserResult: ManualResearchNoteParserResult;
  inputFingerprint: string;
  createdAt: string;
  draftMetadata: ManualNotePreviewRuntimeDraftMetadata;
  persistPreviewDraft: boolean;
}): ManualNotePreviewRuntimeOkResponse {
  return {
    ok: true,
    runtime_version: MANUAL_NOTE_RUNTIME_VERSION,
    parser_version: parserResult.parser_version,
    preview: parserResult.preview,
    warnings: parserResult.warnings,
    authority: buildManualNotePreviewRuntimeAuthority(),
    runtime_boundary: buildManualNotePreviewRuntimeBoundary({
      persistPreviewDraft,
    }),
    input_fingerprint: inputFingerprint,
    created_at: createdAt,
    no_side_effects: buildManualNotePreviewNoSideEffects(),
    ...draftMetadata,
  };
}
