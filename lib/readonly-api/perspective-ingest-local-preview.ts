import { buildManualPastedTextSessionEpisode } from "@/lib/perspective-ingest/manual-pasted-text-adapter";
import {
  validatePerspectiveIngestLocalPastedTextPreviewBody,
  type PerspectiveIngestLocalPastedTextValidationErrorCode,
  type PerspectiveIngestLocalPastedTextValidationErrorStatus,
} from "@/lib/perspective-ingest/manual-pasted-text-validation";
import {
  buildPerspectiveIngestConstellationPreviewResponse,
} from "@/lib/perspective-ingest/episode-to-constellation-packet";
import {
  LOCAL_PREVIEW_POST_LOCAL_HOSTS,
  validateLocalPreviewPostAccess,
  type LocalPreviewPostAccessErrorCode,
  type LocalPreviewPostAccessErrorStatus,
  type LocalPreviewPostAccessPolicy,
} from "@/lib/readonly-api/local-preview-post-guard";
import type {
  PerspectiveIngestConstellationPreviewResponse,
  PerspectiveIngestLocalPastedTextPreviewRequest,
  PerspectiveIngestLocalPreviewErrorBody,
} from "@/types/perspective-ingest-constellation-preview";

export const PERSPECTIVE_INGEST_LOCAL_PREVIEW_SCOPE = "project:augnes";
export const PERSPECTIVE_INGEST_LOCAL_PREVIEW_BOUNDARY_CLASS =
  "read_only_local_ingest_constellation_preview";
export const PERSPECTIVE_INGEST_LOCAL_PREVIEW_LOCAL_READ_HEADER =
  "x-augnes-local-readonly";
export const PERSPECTIVE_INGEST_LOCAL_PREVIEW_LOCAL_READ_MARKER =
  "perspective-ingest-local-preview-v0.1";
export const PERSPECTIVE_INGEST_LOCAL_PREVIEW_ROUTE_FAMILY =
  "perspective_ingest_constellation";
export const PERSPECTIVE_INGEST_LOCAL_PREVIEW_ROUTE_ID =
  "augnes.read.perspective-ingest-local-preview.v0.1";
export const PERSPECTIVE_INGEST_LOCAL_PREVIEW_ACCESS_POLICY: LocalPreviewPostAccessPolicy =
  {
    route_id: PERSPECTIVE_INGEST_LOCAL_PREVIEW_ROUTE_ID,
    required_scope: PERSPECTIVE_INGEST_LOCAL_PREVIEW_SCOPE,
    required_marker_header: PERSPECTIVE_INGEST_LOCAL_PREVIEW_LOCAL_READ_HEADER,
    required_marker_value: PERSPECTIVE_INGEST_LOCAL_PREVIEW_LOCAL_READ_MARKER,
    allowed_hosts: LOCAL_PREVIEW_POST_LOCAL_HOSTS,
    route_family: PERSPECTIVE_INGEST_LOCAL_PREVIEW_ROUTE_FAMILY,
  };

export type PerspectiveIngestLocalPreviewErrorCode =
  | LocalPreviewPostAccessErrorCode
  | PerspectiveIngestLocalPastedTextValidationErrorCode
  | "invalid_json"
  | "unavailable";

export type PerspectiveIngestLocalPreviewErrorStatus =
  | LocalPreviewPostAccessErrorStatus
  | PerspectiveIngestLocalPastedTextValidationErrorStatus
  | 400
  | 500;

export type PerspectiveIngestLocalPreviewAccessValidationResult =
  | {
      ok: true;
      scope: typeof PERSPECTIVE_INGEST_LOCAL_PREVIEW_SCOPE;
      route_id: typeof PERSPECTIVE_INGEST_LOCAL_PREVIEW_ROUTE_ID;
      route_family: typeof PERSPECTIVE_INGEST_LOCAL_PREVIEW_ROUTE_FAMILY;
      local_authorized: true;
    }
  | {
      ok: false;
      code: PerspectiveIngestLocalPreviewErrorCode;
      status: PerspectiveIngestLocalPreviewErrorStatus;
      summary: string;
      authority_boundary: string[];
    };

export type PerspectiveIngestLocalPreviewBodyValidationResult =
  | {
      ok: true;
      request: PerspectiveIngestLocalPastedTextPreviewRequest;
    }
  | {
      ok: false;
      code: PerspectiveIngestLocalPreviewErrorCode;
      status: PerspectiveIngestLocalPreviewErrorStatus;
      summary: string;
      authority_boundary: string[];
    };

export function validatePerspectiveIngestLocalPreviewAccess(
  request: Request,
): PerspectiveIngestLocalPreviewAccessValidationResult {
  const result = validateLocalPreviewPostAccess(
    request,
    PERSPECTIVE_INGEST_LOCAL_PREVIEW_ACCESS_POLICY,
  );

  if (!result.ok) {
    return {
      ...result,
      summary: "Local preview access was rejected by the POST-only guard.",
    };
  }

  return {
    ok: true,
    scope: PERSPECTIVE_INGEST_LOCAL_PREVIEW_SCOPE,
    route_id: PERSPECTIVE_INGEST_LOCAL_PREVIEW_ROUTE_ID,
    route_family: PERSPECTIVE_INGEST_LOCAL_PREVIEW_ROUTE_FAMILY,
    local_authorized: true,
  };
}

export function validatePerspectiveIngestLocalPreviewBody(
  body: unknown,
): PerspectiveIngestLocalPreviewBodyValidationResult {
  const result = validatePerspectiveIngestLocalPastedTextPreviewBody(body);

  if (!result.ok) {
    return result;
  }

  return result;
}

export function buildPerspectiveIngestLocalPreviewReadResponse({
  generatedAt,
  request,
}: {
  request: PerspectiveIngestLocalPastedTextPreviewRequest;
  generatedAt: string;
}): PerspectiveIngestConstellationPreviewResponse {
  const episode = buildManualPastedTextSessionEpisode({
    generatedAt,
    request,
  });

  return buildPerspectiveIngestConstellationPreviewResponse({
    episodes: [episode],
    routeId: PERSPECTIVE_INGEST_LOCAL_PREVIEW_ROUTE_ID,
    source: "manual:pasted_text",
  });
}

export function buildPerspectiveIngestLocalPreviewError({
  authorityBoundary,
  code,
  status,
  summary,
}: {
  code: PerspectiveIngestLocalPreviewErrorCode;
  status: PerspectiveIngestLocalPreviewErrorStatus;
  summary?: string;
  authorityBoundary?: string[];
}): PerspectiveIngestLocalPreviewErrorBody {
  return {
    response_version: "perspective_ingest_constellation_preview.v0.1",
    error: {
      code,
      status,
      summary: summary ?? "Local preview request failed closed.",
    },
    authority_boundary: authorityBoundary ?? [
      "minimal fail-closed error",
      "no private source details",
      "no rejected payload echo",
      "no route-provided text grants authority",
    ],
  };
}
