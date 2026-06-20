import {
  ManualNoteDisabledPromotionWriteAdapterValidationError,
  buildManualNoteDisabledPromotionWriteAdapterBoundary,
  buildManualNoteDisabledPromotionWriteAdapterReadiness,
} from "@/lib/research-candidate-review/manual-note-disabled-promotion-write-adapter";
import { MAX_MANUAL_NOTE_BODY_BYTES } from "@/lib/research-candidate-review/manual-note-runtime-preview";
import type { ResearchCandidateReviewScope } from "@/types/research-candidate-review";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_SCOPE: ResearchCandidateReviewScope = "project:augnes";
const MAX_OPERATOR_INTENT_LABEL_LENGTH = 120;
const PREVIEW_DRAFT_ID_PATTERN =
  /^research-candidate-preview-draft:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ preview_draft_id: string }> },
) {
  const { preview_draft_id: previewDraftId } = await params;
  const route = buildDisabledPromotionWriteAdapterReadinessRoute(previewDraftId);

  try {
    validatePreviewDraftId(previewDraftId);
    const url = new URL(request.url);
    parseScope(url.searchParams.get("scope"));
    const body = await readBoundedJsonBody(request);
    if (!isRecord(body)) {
      return errorResponse({
        errorCode: "invalid_body",
        message: "Request body must be a JSON object.",
        status: 400,
        route,
      });
    }

    const requestBody = parseRequestBody(body, previewDraftId);
    return NextResponse.json(
      buildManualNoteDisabledPromotionWriteAdapterReadiness({
        previewDraftId,
        route,
        authorityDesignPacket: requestBody.authorityDesignPacket,
        candidateReviewPacketFingerprint:
          requestBody.candidateReviewPacketFingerprint,
        operatorIntentLabel: requestBody.operatorIntentLabel,
      }),
    );
  } catch (error) {
    if (error instanceof InvalidJsonError) {
      return errorResponse({
        errorCode: "invalid_json",
        message: "Request body must be valid JSON.",
        status: 400,
        route,
      });
    }

    if (error instanceof PayloadTooLargeError) {
      return errorResponse({
        errorCode: "request_body_too_large",
        message: `Request body must be ${MAX_MANUAL_NOTE_BODY_BYTES} bytes or fewer.`,
        status: 413,
        route,
      });
    }

    if (error instanceof DisabledAdapterReadinessRouteValidationError) {
      return errorResponse({
        errorCode: error.errorCode,
        message: error.message,
        status: 400,
        route,
      });
    }

    if (error instanceof ManualNoteDisabledPromotionWriteAdapterValidationError) {
      return errorResponse({
        errorCode: error.errorCode,
        message: error.message,
        status: 400,
        route,
      });
    }

    return errorResponse({
      errorCode: "runtime_unavailable",
      message:
        "Manual note disabled promotion write adapter readiness route is unavailable.",
      status: 500,
      route,
    });
  }
}

function parseRequestBody(
  body: Record<string, unknown>,
  previewDraftId: string,
) {
  const bodyPreviewDraftId = body.preview_draft_id;
  if (
    typeof bodyPreviewDraftId === "string" &&
    bodyPreviewDraftId !== previewDraftId
  ) {
    throw new DisabledAdapterReadinessRouteValidationError({
      errorCode: "preview_draft_id_mismatch",
      message: "preview_draft_id must match the route preview_draft_id.",
    });
  }

  if (!isRecord(body.authority_design_packet)) {
    throw new DisabledAdapterReadinessRouteValidationError({
      errorCode: "missing_authority_design_packet",
      message: "authority_design_packet is required.",
    });
  }

  const candidateReviewPacketFingerprint =
    typeof body.candidate_review_packet_fingerprint === "string"
      ? body.candidate_review_packet_fingerprint
      : null;
  const operatorIntentLabel =
    typeof body.operator_intent_label === "string"
      ? normalizeOperatorIntentLabel(body.operator_intent_label)
      : null;

  return {
    authorityDesignPacket: body.authority_design_packet,
    candidateReviewPacketFingerprint,
    operatorIntentLabel,
  };
}

function normalizeOperatorIntentLabel(value: string) {
  const trimmed = value.trim();
  if (trimmed.length > MAX_OPERATOR_INTENT_LABEL_LENGTH) {
    throw new DisabledAdapterReadinessRouteValidationError({
      errorCode: "operator_intent_label_too_large",
      message: `operator_intent_label must be ${MAX_OPERATOR_INTENT_LABEL_LENGTH} characters or fewer.`,
    });
  }
  return trimmed.length > 0 ? trimmed : null;
}

function parseScope(value: string | null): ResearchCandidateReviewScope {
  if (value === null || value.trim().length === 0 || value === DEFAULT_SCOPE) {
    return DEFAULT_SCOPE;
  }

  throw new DisabledAdapterReadinessRouteValidationError({
    errorCode: "unsupported_scope",
    message: "scope must be project:augnes when provided.",
  });
}

function validatePreviewDraftId(previewDraftId: string) {
  if (!PREVIEW_DRAFT_ID_PATTERN.test(previewDraftId)) {
    throw new DisabledAdapterReadinessRouteValidationError({
      errorCode: "invalid_preview_draft_id",
      message: "preview_draft_id is not a valid manual note preview draft id.",
    });
  }
}

function errorResponse({
  errorCode,
  message,
  status,
  route,
}: {
  errorCode: string;
  message: string;
  status: number;
  route: string;
}) {
  return NextResponse.json(
    {
      ok: false,
      error_code: errorCode,
      message,
      runtime_boundary:
        buildManualNoteDisabledPromotionWriteAdapterBoundary(route),
    },
    { status },
  );
}

async function readBoundedJsonBody(request: Request) {
  const text = await readBoundedText(request);
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new InvalidJsonError();
  }
}

async function readBoundedText(request: Request) {
  if (!request.body) {
    return "";
  }

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let text = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    size += value.byteLength;
    if (size > MAX_MANUAL_NOTE_BODY_BYTES) {
      throw new PayloadTooLargeError();
    }
    text += decoder.decode(value, { stream: true });
  }

  text += decoder.decode();
  return text;
}

function buildDisabledPromotionWriteAdapterReadinessRoute(
  previewDraftId: string,
) {
  return `/api/research-candidate-review/manual-note-preview-drafts/${encodeURIComponent(
    previewDraftId,
  )}/disabled-promotion-write-adapter-readiness`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

class DisabledAdapterReadinessRouteValidationError extends Error {
  readonly errorCode: string;

  constructor({ errorCode, message }: { errorCode: string; message: string }) {
    super(message);
    this.name = "DisabledAdapterReadinessRouteValidationError";
    this.errorCode = errorCode;
  }
}

class InvalidJsonError extends Error {
  constructor() {
    super("Request body must be valid JSON.");
    this.name = "InvalidJsonError";
  }
}

class PayloadTooLargeError extends Error {
  constructor() {
    super(`Request body must be ${MAX_MANUAL_NOTE_BODY_BYTES} bytes or fewer.`);
    this.name = "PayloadTooLargeError";
  }
}
