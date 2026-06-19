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

export const MANUAL_NOTE_RUNTIME_VERSION =
  "manual_research_candidate_runtime_preview.v0.1";

export const MAX_MANUAL_NOTE_TEXT_LENGTH = 20_000;
export const MAX_MANUAL_NOTE_BODY_BYTES = 64 * 1024;

export type ManualNotePreviewPersistenceMode =
  | "persisted_preview_draft"
  | "route_only_no_persistence";

export type ManualNotePreviewDraftStatus = "preview_draft";

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
