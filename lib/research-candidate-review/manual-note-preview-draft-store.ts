import { randomUUID } from "node:crypto";
import { openDatabase } from "@/lib/db";
import type { ManualResearchNoteParserResult } from "@/lib/research-candidate-review/manual-note-parser";
import type {
  ManualNotePreviewNoSideEffects,
  ManualNotePreviewRuntimeAuthority,
  ManualNotePreviewRuntimeBoundary,
} from "@/lib/research-candidate-review/manual-note-runtime-preview";
import type { ResearchCandidateReviewScope } from "@/types/research-candidate-review";

export type ResearchCandidateManualNotePreviewDraftRecord = {
  preview_draft_id: string;
  status: "preview_draft";
  scope: ResearchCandidateReviewScope;
  source_kind: "manual_paste";
  operator_note_label: string | null;
  parser_version: string;
  preview_version: string;
  input_fingerprint: string;
  manual_note_text_stored: false;
  preview_json: unknown;
  warnings_json: unknown[];
  authority_json: ManualNotePreviewRuntimeAuthority;
  runtime_boundary_json: ManualNotePreviewRuntimeBoundary;
  no_side_effects_json: ManualNotePreviewNoSideEffects;
  promoted_at: null;
  canonical_perspective_id: null;
  proof_id: null;
  evidence_id: null;
  work_item_id: null;
  created_at: string;
  updated_at: string;
};

type ResearchCandidateManualNotePreviewDraftRow = Omit<
  ResearchCandidateManualNotePreviewDraftRecord,
  | "manual_note_text_stored"
  | "preview_json"
  | "warnings_json"
  | "authority_json"
  | "runtime_boundary_json"
  | "no_side_effects_json"
> & {
  manual_note_text_stored: 0 | 1;
  preview_json: string;
  warnings_json: string;
  authority_json: string;
  runtime_boundary_json: string;
  no_side_effects_json: string;
};

export function insertResearchCandidateManualNotePreviewDraft({
  scope,
  operatorNoteLabel,
  inputFingerprint,
  parserResult,
  authority,
  runtimeBoundary,
  noSideEffects,
  createdAt,
}: {
  scope: ResearchCandidateReviewScope;
  operatorNoteLabel?: string | null;
  inputFingerprint: string;
  parserResult: ManualResearchNoteParserResult;
  authority: ManualNotePreviewRuntimeAuthority;
  runtimeBoundary: ManualNotePreviewRuntimeBoundary;
  noSideEffects: ManualNotePreviewNoSideEffects;
  createdAt: string;
}): ResearchCandidateManualNotePreviewDraftRecord {
  const db = openDatabase();
  const previewDraftId = `research-candidate-preview-draft:${randomUUID()}`;
  const row = {
    preview_draft_id: previewDraftId,
    status: "preview_draft",
    scope,
    source_kind: "manual_paste",
    operator_note_label: cleanOperatorNoteLabel(operatorNoteLabel),
    parser_version: parserResult.parser_version,
    preview_version: parserResult.preview.preview_version ?? "research_candidate_review.v0.1",
    input_fingerprint: inputFingerprint,
    manual_note_text_stored: 0,
    preview_json: JSON.stringify(parserResult.preview),
    warnings_json: JSON.stringify(parserResult.warnings),
    authority_json: JSON.stringify(authority),
    runtime_boundary_json: JSON.stringify(runtimeBoundary),
    no_side_effects_json: JSON.stringify(noSideEffects),
    promoted_at: null,
    canonical_perspective_id: null,
    proof_id: null,
    evidence_id: null,
    work_item_id: null,
    created_at: createdAt,
    updated_at: createdAt,
  };

  try {
    db.prepare(
      `
        INSERT INTO research_candidate_manual_note_preview_drafts (
          preview_draft_id,
          status,
          scope,
          source_kind,
          operator_note_label,
          parser_version,
          preview_version,
          input_fingerprint,
          manual_note_text_stored,
          preview_json,
          warnings_json,
          authority_json,
          runtime_boundary_json,
          no_side_effects_json,
          promoted_at,
          canonical_perspective_id,
          proof_id,
          evidence_id,
          work_item_id,
          created_at,
          updated_at
        )
        VALUES (
          @preview_draft_id,
          @status,
          @scope,
          @source_kind,
          @operator_note_label,
          @parser_version,
          @preview_version,
          @input_fingerprint,
          @manual_note_text_stored,
          @preview_json,
          @warnings_json,
          @authority_json,
          @runtime_boundary_json,
          @no_side_effects_json,
          @promoted_at,
          @canonical_perspective_id,
          @proof_id,
          @evidence_id,
          @work_item_id,
          @created_at,
          @updated_at
        )
      `,
    ).run(row);

    const inserted = db
      .prepare(
        `
          SELECT
            preview_draft_id,
            status,
            scope,
            source_kind,
            operator_note_label,
            parser_version,
            preview_version,
            input_fingerprint,
            manual_note_text_stored,
            preview_json,
            warnings_json,
            authority_json,
            runtime_boundary_json,
            no_side_effects_json,
            promoted_at,
            canonical_perspective_id,
            proof_id,
            evidence_id,
            work_item_id,
            created_at,
            updated_at
          FROM research_candidate_manual_note_preview_drafts
          WHERE preview_draft_id = ?
        `,
      )
      .get(previewDraftId) as ResearchCandidateManualNotePreviewDraftRow;

    return parseResearchCandidateManualNotePreviewDraftRow(inserted);
  } finally {
    db.close();
  }
}

function cleanOperatorNoteLabel(value?: string | null) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.slice(0, 160) : null;
}

function parseResearchCandidateManualNotePreviewDraftRow(
  row: ResearchCandidateManualNotePreviewDraftRow,
): ResearchCandidateManualNotePreviewDraftRecord {
  return {
    ...row,
    manual_note_text_stored: false,
    preview_json: JSON.parse(row.preview_json) as unknown,
    warnings_json: JSON.parse(row.warnings_json) as unknown[],
    authority_json: JSON.parse(row.authority_json) as ManualNotePreviewRuntimeAuthority,
    runtime_boundary_json: JSON.parse(
      row.runtime_boundary_json,
    ) as ManualNotePreviewRuntimeBoundary,
    no_side_effects_json: JSON.parse(
      row.no_side_effects_json,
    ) as ManualNotePreviewNoSideEffects,
  };
}
