import {
  listResearchCandidateManualNotePreviewDrafts,
  summarizeResearchCandidateManualNotePreviewDraftList,
} from "@/lib/research-candidate-review/manual-note-preview-draft-store";
import {
  DEFAULT_MANUAL_NOTE_PREVIEW_DRAFT_LIST_LIMIT,
  MANUAL_NOTE_PREVIEW_DRAFTS_ROUTE,
  MANUAL_NOTE_RUNTIME_VERSION,
  MAX_MANUAL_NOTE_PREVIEW_DRAFT_LIST_LIMIT,
  buildManualNotePreviewDraftLifecycleBoundary,
  buildManualNotePreviewNoSideEffects,
} from "@/lib/research-candidate-review/manual-note-runtime-preview";
import type {
  ManualNotePreviewDraftCandidateFilter,
  ManualNotePreviewDraftListLifecycleFilter,
  ManualNotePreviewDraftListQuery,
  ManualNotePreviewDraftListResponse,
  ManualNotePreviewDraftRuntimeErrorResponse,
  ManualNotePreviewDraftListSort,
  ManualNotePreviewDraftWarningFilter,
} from "@/lib/research-candidate-review/manual-note-runtime-preview";
import type { ResearchCandidateReviewScope } from "@/types/research-candidate-review";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_SCOPE: ResearchCandidateReviewScope = "project:augnes";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limit = parsePreviewDraftListLimit(url.searchParams.get("limit"));
    const requestedIncludeDiscarded = parseIncludeDiscarded(
      url.searchParams.get("include_discarded"),
    );
    const lifecycle = parseLifecycle(
      url.searchParams.get("lifecycle"),
      requestedIncludeDiscarded,
    );
    const sort = parseSort(url.searchParams.get("sort"));
    const warnings = parseWarnings(url.searchParams.get("warnings"));
    const candidates = parseCandidates(url.searchParams.get("candidates"));
    const includeDiscarded = lifecycle !== "active";
    const query = {
      limit,
      lifecycle,
      sort,
      warnings,
      candidates,
      include_discarded: includeDiscarded,
    } satisfies ManualNotePreviewDraftListQuery;
    const runtimeBoundary = buildManualNotePreviewDraftLifecycleBoundary({
      route: MANUAL_NOTE_PREVIEW_DRAFTS_ROUTE,
    });
    const noSideEffects = buildManualNotePreviewNoSideEffects();
    const items = listResearchCandidateManualNotePreviewDrafts({
      scope: DEFAULT_SCOPE,
      limit: query.limit,
      lifecycle: query.lifecycle,
      sort: query.sort,
      warnings: query.warnings,
      candidates: query.candidates,
    });
    const summary = summarizeResearchCandidateManualNotePreviewDraftList(items);

    return NextResponse.json(
      {
        ok: true,
        runtime_version: MANUAL_NOTE_RUNTIME_VERSION,
        items,
        count: items.length,
        limit: query.limit,
        lifecycle: query.lifecycle,
        sort: query.sort,
        warnings: query.warnings,
        candidates: query.candidates,
        include_discarded: query.include_discarded,
        summary,
        no_side_effects: noSideEffects,
        runtime_boundary: runtimeBoundary,
      } satisfies ManualNotePreviewDraftListResponse,
    );
  } catch (error) {
    if (error instanceof PreviewDraftListValidationError) {
      return errorResponse({
        errorCode: error.errorCode,
        message: error.message,
        status: 400,
      });
    }

    return errorResponse({
      errorCode: "runtime_unavailable",
      message: "Manual note preview draft list route is unavailable.",
      status: 500,
    });
  }
}

function parsePreviewDraftListLimit(value: string | null) {
  if (value === null || value.trim().length === 0) {
    return DEFAULT_MANUAL_NOTE_PREVIEW_DRAFT_LIST_LIMIT;
  }

  const limit = Number(value);
  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > MAX_MANUAL_NOTE_PREVIEW_DRAFT_LIST_LIMIT
  ) {
    throw new PreviewDraftListValidationError({
      errorCode: "invalid_limit",
      message: `limit must be an integer from 1 to ${MAX_MANUAL_NOTE_PREVIEW_DRAFT_LIST_LIMIT}.`,
    });
  }

  return limit;
}

function parseIncludeDiscarded(value: string | null) {
  if (value === null || value.trim().length === 0) {
    return false;
  }

  if (value === "true") return true;
  if (value === "false") return false;

  throw new PreviewDraftListValidationError({
    errorCode: "invalid_include_discarded",
    message: "include_discarded must be true or false when provided.",
  });
}

function parseLifecycle(
  value: string | null,
  includeDiscarded: boolean,
): ManualNotePreviewDraftListLifecycleFilter {
  if (value === null || value.trim().length === 0) {
    return includeDiscarded ? "all" : "active";
  }

  if (value === "active" || value === "discarded" || value === "all") {
    return value;
  }

  throw new PreviewDraftListValidationError({
    errorCode: "invalid_lifecycle",
    message: "lifecycle must be active, discarded, or all when provided.",
  });
}

function parseSort(value: string | null): ManualNotePreviewDraftListSort {
  if (value === null || value.trim().length === 0) {
    return "created_desc";
  }

  if (value === "created_desc" || value === "created_asc") {
    return value;
  }

  throw new PreviewDraftListValidationError({
    errorCode: "invalid_sort",
    message: "sort must be created_desc or created_asc when provided.",
  });
}

function parseWarnings(value: string | null): ManualNotePreviewDraftWarningFilter {
  if (value === null || value.trim().length === 0) {
    return "all";
  }

  if (
    value === "all" ||
    value === "with_warnings" ||
    value === "without_warnings"
  ) {
    return value;
  }

  throw new PreviewDraftListValidationError({
    errorCode: "invalid_warnings",
    message:
      "warnings must be all, with_warnings, or without_warnings when provided.",
  });
}

function parseCandidates(
  value: string | null,
): ManualNotePreviewDraftCandidateFilter {
  if (value === null || value.trim().length === 0) {
    return "all";
  }

  if (
    value === "all" ||
    value === "with_candidates" ||
    value === "without_candidates"
  ) {
    return value;
  }

  throw new PreviewDraftListValidationError({
    errorCode: "invalid_candidates",
    message:
      "candidates must be all, with_candidates, or without_candidates when provided.",
  });
}

function errorResponse({
  errorCode,
  message,
  status,
}: {
  errorCode: ManualNotePreviewDraftRuntimeErrorResponse["error_code"];
  message: string;
  status: number;
}) {
  return NextResponse.json(
    {
      ok: false,
      error_code: errorCode,
      message,
      runtime_boundary: buildManualNotePreviewDraftLifecycleBoundary({
        route: MANUAL_NOTE_PREVIEW_DRAFTS_ROUTE,
      }),
    } satisfies ManualNotePreviewDraftRuntimeErrorResponse,
    { status },
  );
}

class PreviewDraftListValidationError extends Error {
  readonly errorCode: ManualNotePreviewDraftRuntimeErrorResponse["error_code"];

  constructor({
    errorCode,
    message,
  }: {
    errorCode: ManualNotePreviewDraftRuntimeErrorResponse["error_code"];
    message: string;
  }) {
    super(message);
    this.name = "PreviewDraftListValidationError";
    this.errorCode = errorCode;
  }
}
