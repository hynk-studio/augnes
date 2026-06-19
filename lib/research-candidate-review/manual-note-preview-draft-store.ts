import { randomUUID } from "node:crypto";
import { openDatabase } from "@/lib/db";
import type {
  ManualResearchNoteParserResult,
  ManualResearchNoteParserWarning,
} from "@/lib/research-candidate-review/manual-note-parser";
import {
  MAX_MANUAL_NOTE_PREVIEW_DRAFT_LABEL_LENGTH,
  MAX_MANUAL_NOTE_PREVIEW_DRAFT_LIST_LIMIT,
  type ManualNotePreviewDraftCandidateCountSummary,
  type ManualNotePreviewDraftCandidateFilter,
  type ManualNotePreviewDraftDetailMetadata,
  type ManualNotePreviewDraftDiscardMetadata,
  type ManualNotePreviewDraftLifecycleAuthority,
  type ManualNotePreviewDraftLifecycleStatus,
  type ManualNotePreviewDraftListLifecycleFilter,
  type ManualNotePreviewDraftListItem,
  type ManualNotePreviewDraftListSort,
  type ManualNotePreviewDraftWarningFilter,
  type ManualNotePreviewNoSideEffects,
  type ManualNotePreviewRuntimeAuthority,
  type ManualNotePreviewRuntimeBoundary,
} from "@/lib/research-candidate-review/manual-note-runtime-preview";
import type {
  ResearchCandidateReviewPreviewResponse,
  ResearchCandidateReviewScope,
} from "@/types/research-candidate-review";

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

export type ResearchCandidateManualNotePreviewDraftDiscardRecord = {
  discard_id: string;
  preview_draft_id: string;
  scope: ResearchCandidateReviewScope;
  discarded_at: string;
  discarded_by: string;
  discard_reason: string;
  authority_json: ManualNotePreviewDraftLifecycleAuthority;
  no_side_effects_json: ManualNotePreviewNoSideEffects;
};

type ResearchCandidateManualNotePreviewDraftDiscardRow = Omit<
  ResearchCandidateManualNotePreviewDraftDiscardRecord,
  "authority_json" | "no_side_effects_json"
> & {
  authority_json: string;
  no_side_effects_json: string;
};

type ResearchCandidateManualNotePreviewDraftJoinedRow =
  ResearchCandidateManualNotePreviewDraftRow & {
    discard_id: string | null;
    discarded_at: string | null;
    discarded_by: string | null;
    discard_reason: string | null;
    discard_authority_json: string | null;
    discard_no_side_effects_json: string | null;
  };

export type ResearchCandidateManualNotePreviewDraftDetail = {
  draft: ManualNotePreviewDraftDetailMetadata;
  preview: ResearchCandidateReviewPreviewResponse;
  warnings: ManualResearchNoteParserWarning[];
  authority: ManualNotePreviewRuntimeAuthority;
  lifecycle_status: ManualNotePreviewDraftLifecycleStatus;
  discard_metadata?: ManualNotePreviewDraftDiscardMetadata;
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

export function listResearchCandidateManualNotePreviewDrafts({
  scope,
  limit,
  lifecycle,
  sort,
  warnings,
  candidates,
}: {
  scope: ResearchCandidateReviewScope;
  limit: number;
  lifecycle: ManualNotePreviewDraftListLifecycleFilter;
  sort: ManualNotePreviewDraftListSort;
  warnings: ManualNotePreviewDraftWarningFilter;
  candidates: ManualNotePreviewDraftCandidateFilter;
}): ManualNotePreviewDraftListItem[] {
  const db = openDatabase();
  const lifecycleClause = buildLifecycleWhereClause(lifecycle);
  const sortClause = buildCreatedAtSortClause(sort);
  const rowLimit = MAX_MANUAL_NOTE_PREVIEW_DRAFT_LIST_LIMIT;

  try {
    const rows = db
      .prepare(
        `
          SELECT
            drafts.preview_draft_id,
            drafts.status,
            drafts.scope,
            drafts.source_kind,
            drafts.operator_note_label,
            drafts.parser_version,
            drafts.preview_version,
            drafts.input_fingerprint,
            drafts.manual_note_text_stored,
            drafts.preview_json,
            drafts.warnings_json,
            drafts.authority_json,
            drafts.runtime_boundary_json,
            drafts.no_side_effects_json,
            drafts.promoted_at,
            drafts.canonical_perspective_id,
            drafts.proof_id,
            drafts.evidence_id,
            drafts.work_item_id,
            drafts.created_at,
            drafts.updated_at,
            discards.discard_id,
            discards.discarded_at,
            discards.discarded_by,
            discards.discard_reason,
            discards.authority_json AS discard_authority_json,
            discards.no_side_effects_json AS discard_no_side_effects_json
          FROM research_candidate_manual_note_preview_drafts drafts
          LEFT JOIN research_candidate_manual_note_preview_draft_discards discards
            ON discards.preview_draft_id = drafts.preview_draft_id
          WHERE drafts.scope = @scope
            ${lifecycleClause}
          ORDER BY drafts.created_at ${sortClause}
          LIMIT @rowLimit
        `,
      )
      .all({ scope, rowLimit }) as ResearchCandidateManualNotePreviewDraftJoinedRow[];

    return rows
      .map(parseResearchCandidateManualNotePreviewDraftListItem)
      .filter((item) => matchesWarningFilter(item, warnings))
      .filter((item) => matchesCandidateFilter(item, candidates))
      .slice(0, limit);
  } finally {
    db.close();
  }
}

export function getResearchCandidateManualNotePreviewDraft({
  previewDraftId,
  scope,
}: {
  previewDraftId: string;
  scope: ResearchCandidateReviewScope;
}): ResearchCandidateManualNotePreviewDraftDetail | null {
  const db = openDatabase();

  try {
    const row = selectResearchCandidateManualNotePreviewDraftJoinedRow(db, {
      previewDraftId,
      scope,
    });
    return row ? parseResearchCandidateManualNotePreviewDraftDetail(row) : null;
  } finally {
    db.close();
  }
}

export function updateResearchCandidateManualNotePreviewDraftLabel({
  previewDraftId,
  scope,
  operatorNoteLabel,
  updatedAt,
}: {
  previewDraftId: string;
  scope: ResearchCandidateReviewScope;
  operatorNoteLabel: string | null;
  updatedAt: string;
}): ResearchCandidateManualNotePreviewDraftDetail | null {
  const db = openDatabase();

  try {
    const existing = selectResearchCandidateManualNotePreviewDraftJoinedRow(db, {
      previewDraftId,
      scope,
    });
    if (!existing) {
      return null;
    }

    db.prepare(
      `
        UPDATE research_candidate_manual_note_preview_drafts
        SET
          operator_note_label = @operator_note_label,
          updated_at = @updated_at
        WHERE preview_draft_id = @preview_draft_id
          AND scope = @scope
      `,
    ).run({
      preview_draft_id: previewDraftId,
      scope,
      operator_note_label: cleanOperatorNoteLabel(operatorNoteLabel),
      updated_at: updatedAt,
    });

    const updated = selectResearchCandidateManualNotePreviewDraftJoinedRow(db, {
      previewDraftId,
      scope,
    });
    return updated
      ? parseResearchCandidateManualNotePreviewDraftDetail(updated)
      : null;
  } finally {
    db.close();
  }
}

export function discardResearchCandidateManualNotePreviewDraft({
  previewDraftId,
  scope,
  discardedAt,
  discardedBy,
  discardReason,
  authority,
  noSideEffects,
}: {
  previewDraftId: string;
  scope: ResearchCandidateReviewScope;
  discardedAt: string;
  discardedBy: string;
  discardReason: string;
  authority: ManualNotePreviewDraftLifecycleAuthority;
  noSideEffects: ManualNotePreviewNoSideEffects;
}): ResearchCandidateManualNotePreviewDraftDiscardRecord | null {
  const db = openDatabase();

  try {
    const draft = selectResearchCandidateManualNotePreviewDraftJoinedRow(db, {
      previewDraftId,
      scope,
    });
    if (!draft) {
      return null;
    }

    db.prepare(
      `
        INSERT INTO research_candidate_manual_note_preview_draft_discards (
          discard_id,
          preview_draft_id,
          scope,
          discarded_at,
          discarded_by,
          discard_reason,
          authority_json,
          no_side_effects_json
        )
        VALUES (
          @discard_id,
          @preview_draft_id,
          @scope,
          @discarded_at,
          @discarded_by,
          @discard_reason,
          @authority_json,
          @no_side_effects_json
        )
        ON CONFLICT(preview_draft_id) DO NOTHING
      `,
    ).run({
      discard_id: `research-candidate-preview-draft-discard:${randomUUID()}`,
      preview_draft_id: previewDraftId,
      scope,
      discarded_at: discardedAt,
      discarded_by: cleanDiscardedBy(discardedBy),
      discard_reason: cleanDiscardReason(discardReason),
      authority_json: JSON.stringify(authority),
      no_side_effects_json: JSON.stringify(noSideEffects),
    });

    const discardRow = selectResearchCandidateManualNotePreviewDraftDiscardRow(
      db,
      previewDraftId,
    );

    return discardRow
      ? parseResearchCandidateManualNotePreviewDraftDiscardRow(discardRow)
      : null;
  } finally {
    db.close();
  }
}

function cleanOperatorNoteLabel(value?: string | null) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0
    ? trimmed.slice(0, MAX_MANUAL_NOTE_PREVIEW_DRAFT_LABEL_LENGTH)
    : null;
}

function cleanDiscardedBy(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.slice(0, 120) : "cockpit_operator";
}

function cleanDiscardReason(value: string) {
  return value.trim().slice(0, 500);
}

function buildLifecycleWhereClause(
  lifecycle: ManualNotePreviewDraftListLifecycleFilter,
) {
  switch (lifecycle) {
    case "active":
      return "AND discards.preview_draft_id IS NULL";
    case "discarded":
      return "AND discards.preview_draft_id IS NOT NULL";
    case "all":
      return "";
  }
}

function buildCreatedAtSortClause(sort: ManualNotePreviewDraftListSort) {
  switch (sort) {
    case "created_desc":
      return "DESC";
    case "created_asc":
      return "ASC";
  }
}

function matchesWarningFilter(
  item: ManualNotePreviewDraftListItem,
  warnings: ManualNotePreviewDraftWarningFilter,
) {
  switch (warnings) {
    case "all":
      return true;
    case "with_warnings":
      return item.warning_count > 0;
    case "without_warnings":
      return item.warning_count === 0;
  }
}

function matchesCandidateFilter(
  item: ManualNotePreviewDraftListItem,
  candidates: ManualNotePreviewDraftCandidateFilter,
) {
  switch (candidates) {
    case "all":
      return true;
    case "with_candidates":
      return item.candidate_count_summary.total > 0;
    case "without_candidates":
      return item.candidate_count_summary.total === 0;
  }
}

function selectResearchCandidateManualNotePreviewDraftJoinedRow(
  db: ReturnType<typeof openDatabase>,
  {
    previewDraftId,
    scope,
  }: {
    previewDraftId: string;
    scope: ResearchCandidateReviewScope;
  },
): ResearchCandidateManualNotePreviewDraftJoinedRow | undefined {
  return db
    .prepare(
      `
        SELECT
          drafts.preview_draft_id,
          drafts.status,
          drafts.scope,
          drafts.source_kind,
          drafts.operator_note_label,
          drafts.parser_version,
          drafts.preview_version,
          drafts.input_fingerprint,
          drafts.manual_note_text_stored,
          drafts.preview_json,
          drafts.warnings_json,
          drafts.authority_json,
          drafts.runtime_boundary_json,
          drafts.no_side_effects_json,
          drafts.promoted_at,
          drafts.canonical_perspective_id,
          drafts.proof_id,
          drafts.evidence_id,
          drafts.work_item_id,
          drafts.created_at,
          drafts.updated_at,
          discards.discard_id,
          discards.discarded_at,
          discards.discarded_by,
          discards.discard_reason,
          discards.authority_json AS discard_authority_json,
          discards.no_side_effects_json AS discard_no_side_effects_json
        FROM research_candidate_manual_note_preview_drafts drafts
        LEFT JOIN research_candidate_manual_note_preview_draft_discards discards
          ON discards.preview_draft_id = drafts.preview_draft_id
        WHERE drafts.preview_draft_id = ?
          AND drafts.scope = ?
      `,
    )
    .get(previewDraftId, scope) as
    | ResearchCandidateManualNotePreviewDraftJoinedRow
    | undefined;
}

function selectResearchCandidateManualNotePreviewDraftDiscardRow(
  db: ReturnType<typeof openDatabase>,
  previewDraftId: string,
): ResearchCandidateManualNotePreviewDraftDiscardRow | undefined {
  return db
    .prepare(
      `
        SELECT
          discard_id,
          preview_draft_id,
          scope,
          discarded_at,
          discarded_by,
          discard_reason,
          authority_json,
          no_side_effects_json
        FROM research_candidate_manual_note_preview_draft_discards
        WHERE preview_draft_id = ?
      `,
    )
    .get(previewDraftId) as
    | ResearchCandidateManualNotePreviewDraftDiscardRow
    | undefined;
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

function parseResearchCandidateManualNotePreviewDraftListItem(
  row: ResearchCandidateManualNotePreviewDraftJoinedRow,
): ManualNotePreviewDraftListItem {
  const draft = parseResearchCandidateManualNotePreviewDraftRow(row);
  const preview = draft.preview_json as ResearchCandidateReviewPreviewResponse;
  const warnings = draft.warnings_json as ManualResearchNoteParserWarning[];
  const discardMetadata = parseDiscardMetadataFromJoinedRow(row);

  return {
    preview_draft_id: draft.preview_draft_id,
    status: draft.status,
    lifecycle_status: discardMetadata
      ? "discarded_preview_draft"
      : "active_preview_draft",
    scope: draft.scope,
    source_kind: draft.source_kind,
    operator_note_label: draft.operator_note_label,
    parser_version: draft.parser_version,
    preview_version: draft.preview_version,
    input_fingerprint: draft.input_fingerprint,
    manual_note_text_stored: false,
    warning_count: warnings.length,
    candidate_count_summary: buildCandidateCountSummary(preview),
    created_at: draft.created_at,
    updated_at: draft.updated_at,
    ...(discardMetadata ? { discard_metadata: discardMetadata } : {}),
  };
}

function parseResearchCandidateManualNotePreviewDraftDetail(
  row: ResearchCandidateManualNotePreviewDraftJoinedRow,
): ResearchCandidateManualNotePreviewDraftDetail {
  const draft = parseResearchCandidateManualNotePreviewDraftRow(row);
  const preview = draft.preview_json as ResearchCandidateReviewPreviewResponse;
  const warnings = draft.warnings_json as ManualResearchNoteParserWarning[];
  const discardMetadata = parseDiscardMetadataFromJoinedRow(row);
  const lifecycleStatus: ManualNotePreviewDraftLifecycleStatus = discardMetadata
    ? "discarded_preview_draft"
    : "active_preview_draft";

  return {
    draft: {
      ...parseResearchCandidateManualNotePreviewDraftListItem(row),
      stored_authority: draft.authority_json,
      stored_runtime_boundary: draft.runtime_boundary_json,
      stored_no_side_effects: draft.no_side_effects_json,
    },
    preview,
    warnings,
    authority: draft.authority_json,
    lifecycle_status: lifecycleStatus,
    ...(discardMetadata ? { discard_metadata: discardMetadata } : {}),
  };
}

function parseResearchCandidateManualNotePreviewDraftDiscardRow(
  row: ResearchCandidateManualNotePreviewDraftDiscardRow,
): ResearchCandidateManualNotePreviewDraftDiscardRecord {
  return {
    ...row,
    authority_json: JSON.parse(
      row.authority_json,
    ) as ManualNotePreviewDraftLifecycleAuthority,
    no_side_effects_json: JSON.parse(
      row.no_side_effects_json,
    ) as ManualNotePreviewNoSideEffects,
  };
}

function parseDiscardMetadataFromJoinedRow(
  row: ResearchCandidateManualNotePreviewDraftJoinedRow,
): ManualNotePreviewDraftDiscardMetadata | undefined {
  if (!row.discard_id || !row.discarded_at || !row.discarded_by) {
    return undefined;
  }

  return {
    discard_id: row.discard_id,
    preview_draft_id: row.preview_draft_id,
    scope: row.scope,
    discarded_at: row.discarded_at,
    discarded_by: row.discarded_by,
    discard_reason: row.discard_reason ?? "",
  };
}

function buildCandidateCountSummary(
  preview: ResearchCandidateReviewPreviewResponse,
): ManualNotePreviewDraftCandidateCountSummary {
  const session = preview.research_session_preview;
  const claims = session.claim_candidate_count;
  const evidence = session.evidence_candidate_count;
  const tensions = session.tension_candidate_count;
  const knowledgeGaps = session.knowledge_gap_candidate_count;
  const perspectiveDeltas = session.perspective_delta_candidate_count;
  const followUpWork = session.follow_up_work_candidate_count;

  return {
    total:
      claims +
      evidence +
      tensions +
      knowledgeGaps +
      perspectiveDeltas +
      followUpWork,
    claims,
    evidence,
    tensions,
    knowledge_gaps: knowledgeGaps,
    perspective_deltas: perspectiveDeltas,
    follow_up_work: followUpWork,
  };
}
