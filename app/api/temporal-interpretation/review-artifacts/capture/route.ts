import { buildTemporalPreviewReviewArtifactInputFromRouteCapture } from "@/lib/temporal-review-artifact-capture";
import {
  TEMPORAL_INTERPRETATION_WORK_ID,
  TemporalPreviewReviewArtifactDuplicateConflictError,
  TemporalPreviewReviewArtifactIdempotencyConflictError,
  TemporalPreviewReviewArtifactValidationError,
  insertTemporalPreviewReviewArtifactWithIdempotency,
  normalizeTemporalReviewArtifactScope,
} from "@/lib/temporal-review-artifacts";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_CAPTURE_PAYLOAD_BYTES = 128 * 1024;
const DEFAULT_SOURCE_ROUTE = "/api/temporal-interpretation/preview";
const ALLOWED_PUBLIC_REVIEWER_VERDICTS = [
  "pass",
  "pass_with_notes",
  "fail",
] as const;
const FORBIDDEN_PUBLIC_CAPTURE_FIELDS = [
  "approval_status",
  "publish_status",
  "replay_status",
  "commit_status",
  "memory_admission_status",
  "durable_perspective_snapshot_id",
  "raw_openai_response",
  "secret_material",
  "cockpit_dom_as_truth",
  "safe_next_step_instruction",
  "user_preference_as_readiness",
  "summary_only_ref_as_evidence",
] as const;

export async function POST(request: Request) {
  let scope = "project:augnes";

  try {
    const body = await readBoundedJsonBody(request);
    rejectForbiddenPublicCaptureFieldsDeep(body, "request");
    const payload = requireRecord(body, "request body");
    scope = normalizeTemporalReviewArtifactScope(cleanString(payload.scope) ?? scope);
    const manualReview = requireRecord(payload.manual_review, "manual_review");
    const capture = optionalRecord(payload.capture, "capture");
    const links = optionalRecord(payload.links, "links");
    const reviewerVerdict = requirePublicReviewerVerdict(
      manualReview.reviewer_verdict,
    );
    const createdBy = requireString(capture?.created_by, "capture.created_by");
    const idempotencyKey = requireString(
      payload.idempotency_key,
      "idempotency_key",
    );

    if (capture && Object.hasOwn(capture, "artifact_id")) {
      throw new TemporalPreviewReviewArtifactValidationError(
        "capture.artifact_id is forbidden on the public capture route.",
      );
    }
    if (Object.hasOwn(payload, "artifact_id")) {
      throw new TemporalPreviewReviewArtifactValidationError(
        "artifact_id is forbidden on the public capture route.",
      );
    }
    if (!Object.hasOwn(payload, "preview_response")) {
      throw new TemporalPreviewReviewArtifactValidationError(
        "preview_response is required.",
      );
    }

    const sourceRef =
      cleanString(capture?.source_ref) ?? requireString(payload.source_ref, "source_ref");
    const input = buildTemporalPreviewReviewArtifactInputFromRouteCapture(
      payload.preview_response,
      {
        scope,
        work_id:
          cleanString(payload.work_id) ?? TEMPORAL_INTERPRETATION_WORK_ID,
        source_route: cleanString(payload.source_route) ?? DEFAULT_SOURCE_ROUTE,
        source_surface: requireString(payload.source_surface, "source_surface"),
        source_ref: sourceRef,
        capture_mode: cleanString(capture?.capture_mode) ?? "route_capture",
        reviewer_verdict: reviewerVerdict,
        reviewer_notes: cleanString(manualReview.reviewer_notes),
        manual_review_report_path: cleanString(
          manualReview.manual_review_report_path,
        ),
        linked_evidence_record_ids: readLinkedEvidenceRecordIds(links),
        linked_session_id: links ? cleanString(links.linked_session_id) : null,
        linked_pr_url: links ? cleanString(links.linked_pr_url) : null,
        redaction_status: cleanString(capture?.redaction_status) ?? "bounded",
        created_by: createdBy,
      },
    );

    const result = insertTemporalPreviewReviewArtifactWithIdempotency(input, {
      idempotency_key: idempotencyKey,
      created_by: createdBy,
    });

    return NextResponse.json(
      {
        runtime: "augnes",
        scope: result.artifact.scope,
        created: result.created,
        idempotent_replay: result.idempotent_replay,
        artifact: result.artifact,
        boundaries: temporalReviewArtifactCaptureBoundaries(),
        gaps: [],
      },
      { status: result.created ? 201 : 200 },
    );
  } catch (error) {
    if (error instanceof PayloadTooLargeError) {
      return errorResponse({
        scope,
        status: 413,
        error: "payload_too_large",
        message: error.message,
      });
    }
    if (error instanceof InvalidJsonError) {
      return errorResponse({
        scope,
        status: 400,
        error: "invalid_json",
        message: error.message,
      });
    }
    if (error instanceof TemporalPreviewReviewArtifactIdempotencyConflictError) {
      return errorResponse({
        scope,
        status: 409,
        error: "idempotency_conflict",
        message: error.message,
      });
    }
    if (error instanceof TemporalPreviewReviewArtifactDuplicateConflictError) {
      return errorResponse({
        scope,
        status: 409,
        error: "duplicate_source_hash_conflict",
        message: error.message,
      });
    }
    if (error instanceof TemporalPreviewReviewArtifactValidationError) {
      return errorResponse({
        scope,
        status: 400,
        error: "validation_error",
        message: error.message,
      });
    }

    return errorResponse({
      scope,
      status: 500,
      error: "internal_error",
      message: "Failed to capture TemporalPreviewReviewArtifact.",
    });
  }
}

function temporalReviewArtifactCaptureBoundaries() {
  return [
    "Creates bounded TemporalPreviewReviewArtifact only.",
    "Does not call OpenAI.",
    "Does not call GitHub or GitHub publication adapter.",
    "Does not approve, publish, replay, or commit state.",
    "Does not create PerspectiveSnapshot or RawEpisodeBundle runtime.",
    "Does not update Evidence Pack directly.",
  ];
}

function errorResponse({
  scope,
  status,
  error,
  message,
}: {
  scope: string;
  status: number;
  error: string;
  message: string;
}) {
  return NextResponse.json(
    {
      runtime: "augnes",
      scope,
      error,
      message,
      boundaries: temporalReviewArtifactCaptureBoundaries(),
      gaps: [],
    },
    { status },
  );
}

async function readBoundedJsonBody(request: Request) {
  const text = await readBoundedText(request);
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new InvalidJsonError("Request body must be valid JSON.");
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
    if (done) {
      break;
    }

    size += value.byteLength;
    if (size > MAX_CAPTURE_PAYLOAD_BYTES) {
      throw new PayloadTooLargeError(
        `Request body must be ${MAX_CAPTURE_PAYLOAD_BYTES} bytes or smaller.`,
      );
    }
    text += decoder.decode(value, { stream: true });
  }

  text += decoder.decode();
  return text;
}

function rejectForbiddenPublicCaptureFieldsDeep(value: unknown, path: string) {
  if (!value || typeof value !== "object") {
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      rejectForbiddenPublicCaptureFieldsDeep(item, `${path}[${index}]`),
    );
    return;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    if (
      FORBIDDEN_PUBLIC_CAPTURE_FIELDS.includes(
        key as (typeof FORBIDDEN_PUBLIC_CAPTURE_FIELDS)[number],
      )
    ) {
      throw new TemporalPreviewReviewArtifactValidationError(
        `${key} is forbidden on TemporalPreviewReviewArtifact capture input.`,
      );
    }
    rejectForbiddenPublicCaptureFieldsDeep(nestedValue, `${path}.${key}`);
  }
}

function requirePublicReviewerVerdict(value: unknown) {
  const verdict = requireString(value, "manual_review.reviewer_verdict");
  if (
    !ALLOWED_PUBLIC_REVIEWER_VERDICTS.includes(
      verdict as (typeof ALLOWED_PUBLIC_REVIEWER_VERDICTS)[number],
    )
  ) {
    throw new TemporalPreviewReviewArtifactValidationError(
      "manual_review.reviewer_verdict must be one of pass, pass_with_notes, or fail.",
    );
  }

  return verdict;
}

function requireRecord(value: unknown, fieldName: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TemporalPreviewReviewArtifactValidationError(
      `${fieldName} must be an object.`,
    );
  }

  return value as Record<string, unknown>;
}

function optionalRecord(value: unknown, fieldName: string) {
  if (value === null || value === undefined) {
    return null;
  }

  return requireRecord(value, fieldName);
}

function requireString(value: unknown, fieldName: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TemporalPreviewReviewArtifactValidationError(
      `${fieldName} is required.`,
    );
  }

  return value.trim();
}

function cleanString(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== "string") {
    throw new TemporalPreviewReviewArtifactValidationError(
      "Expected a string value.",
    );
  }

  return value.trim() || null;
}

function readLinkedEvidenceRecordIds(links: Record<string, unknown> | null) {
  if (!links || !Object.hasOwn(links, "linked_evidence_record_ids")) {
    return [];
  }
  const value = links.linked_evidence_record_ids;
  if (value === null || typeof value === "string" || Array.isArray(value)) {
    return value;
  }

  throw new TemporalPreviewReviewArtifactValidationError(
    "links.linked_evidence_record_ids must be a JSON array.",
  );
}

class InvalidJsonError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidJsonError";
  }
}

class PayloadTooLargeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PayloadTooLargeError";
  }
}
