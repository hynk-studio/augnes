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
  created_at: string;
  updated_at: string;
  discard_metadata?: ManualNotePreviewDraftDiscardMetadata;
};

export type ManualNotePreviewDraftDetailMetadata =
  ManualNotePreviewDraftListItem & {
    stored_authority: ManualNotePreviewRuntimeAuthority;
    stored_runtime_boundary: ManualNotePreviewRuntimeBoundary;
    stored_no_side_effects: ManualNotePreviewNoSideEffects;
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
    | "preview_draft_not_found"
    | "discard_reason_too_large"
    | "runtime_unavailable";
  message: string;
  runtime_boundary: ManualNotePreviewDraftLifecycleRuntimeBoundary;
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
