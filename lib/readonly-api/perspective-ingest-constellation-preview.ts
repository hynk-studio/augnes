import { buildChatGptSampleSessionEpisode } from "@/lib/perspective-ingest/chatgpt-record-adapter";
import { buildCodexSampleSessionEpisode } from "@/lib/perspective-ingest/codex-record-adapter";
import {
  buildPerspectiveIngestConstellationPreviewResponse,
} from "@/lib/perspective-ingest/episode-to-constellation-packet";
import {
  READONLY_LOCAL_HOSTS,
  validateReadonlyApiLocalAccess,
  type ReadonlyApiAccessErrorCode,
  type ReadonlyApiAccessErrorStatus,
  type ReadonlyApiAccessPolicy,
} from "@/lib/readonly-api/access-guard";
import {
  shouldUseReadonlyApiLocalDevAuthStrictMode,
  validateReadonlyApiLocalDevAuthAdapter,
} from "@/lib/readonly-api/local-dev-auth-adapter";
import type {
  ReadonlyApiAuthScopeErrorCodeV0,
  ReadonlyApiAuthScopeFailureV0,
} from "@/types/readonly-api-auth-scope";
import type {
  PerspectiveIngestConstellationPreviewErrorBody,
  PerspectiveIngestConstellationPreviewResponse,
  PerspectiveIngestSourceQuery,
} from "@/types/perspective-ingest-constellation-preview";

export const PERSPECTIVE_INGEST_CONSTELLATION_PREVIEW_SCOPE =
  "project:augnes";
export const PERSPECTIVE_INGEST_CONSTELLATION_PREVIEW_BOUNDARY_CLASS =
  "read_only_local_ingest_constellation_preview";
export const PERSPECTIVE_INGEST_CONSTELLATION_PREVIEW_LOCAL_READ_HEADER =
  "x-augnes-local-readonly";
export const PERSPECTIVE_INGEST_CONSTELLATION_PREVIEW_LOCAL_READ_MARKER =
  "perspective-ingest-constellation-preview-v0.1";
export const PERSPECTIVE_INGEST_CONSTELLATION_PREVIEW_ROUTE_FAMILY =
  "perspective_ingest_constellation";
export const PERSPECTIVE_INGEST_CONSTELLATION_PREVIEW_ROUTE_ID =
  "augnes.read.perspective-ingest-constellation-preview.v0.1";
export const PERSPECTIVE_INGEST_CONSTELLATION_PREVIEW_ACCESS_POLICY: ReadonlyApiAccessPolicy =
  {
    route_id: PERSPECTIVE_INGEST_CONSTELLATION_PREVIEW_ROUTE_ID,
    required_scope: PERSPECTIVE_INGEST_CONSTELLATION_PREVIEW_SCOPE,
    required_marker_header:
      PERSPECTIVE_INGEST_CONSTELLATION_PREVIEW_LOCAL_READ_HEADER,
    required_marker_value:
      PERSPECTIVE_INGEST_CONSTELLATION_PREVIEW_LOCAL_READ_MARKER,
    allowed_hosts: READONLY_LOCAL_HOSTS,
    route_family: PERSPECTIVE_INGEST_CONSTELLATION_PREVIEW_ROUTE_FAMILY,
  };

export type PerspectiveIngestConstellationPreviewErrorCode =
  | ReadonlyApiAccessErrorCode
  | ReadonlyApiAuthScopeErrorCodeV0
  | "unsupported_source"
  | "unavailable";

export type PerspectiveIngestConstellationPreviewErrorStatus =
  | ReadonlyApiAccessErrorStatus
  | ReadonlyApiAuthScopeFailureV0["status"]
  | 400
  | 500;

export type PerspectiveIngestConstellationPreviewValidationResult =
  | {
      ok: true;
      scope: typeof PERSPECTIVE_INGEST_CONSTELLATION_PREVIEW_SCOPE;
      source: PerspectiveIngestSourceQuery;
      route_id: typeof PERSPECTIVE_INGEST_CONSTELLATION_PREVIEW_ROUTE_ID;
      route_family: typeof PERSPECTIVE_INGEST_CONSTELLATION_PREVIEW_ROUTE_FAMILY;
      local_authorized: true;
    }
  | {
      ok: false;
      code: PerspectiveIngestConstellationPreviewErrorCode;
      status: PerspectiveIngestConstellationPreviewErrorStatus;
      authority_boundary: string[];
    };

export function validatePerspectiveIngestConstellationPreviewRequest(
  request: Request,
): PerspectiveIngestConstellationPreviewValidationResult {
  const result = validateReadonlyApiLocalAccess(
    request,
    PERSPECTIVE_INGEST_CONSTELLATION_PREVIEW_ACCESS_POLICY,
  );

  if (!result.ok) {
    return result;
  }

  if (shouldUseReadonlyApiLocalDevAuthStrictMode(request)) {
    const localDevAuthResult = validateReadonlyApiLocalDevAuthAdapter({
      request,
      localGuardResult: result,
    });

    if (!localDevAuthResult.ok) {
      return {
        ok: false,
        code: localDevAuthResult.code,
        status: localDevAuthResult.status,
        authority_boundary: [...localDevAuthResult.authority_boundary.notes],
      };
    }
  }

  const source = getRequestedSource(request);
  if (source !== "sample:chatgpt" && source !== "sample:codex") {
    return {
      ok: false,
      code: "unsupported_source",
      status: 400,
      authority_boundary: [
        "minimal fail-closed error",
        "source must be sample:chatgpt or sample:codex",
        "no private source details",
        "no route-provided text grants authority",
      ],
    };
  }

  return {
    ok: true,
    scope: PERSPECTIVE_INGEST_CONSTELLATION_PREVIEW_SCOPE,
    source,
    route_id: PERSPECTIVE_INGEST_CONSTELLATION_PREVIEW_ROUTE_ID,
    route_family: PERSPECTIVE_INGEST_CONSTELLATION_PREVIEW_ROUTE_FAMILY,
    local_authorized: true,
  };
}

export function buildPerspectiveIngestConstellationPreviewReadResponse({
  source,
}: {
  source: PerspectiveIngestSourceQuery;
}): PerspectiveIngestConstellationPreviewResponse {
  const episode =
    source === "sample:chatgpt"
      ? buildChatGptSampleSessionEpisode()
      : buildCodexSampleSessionEpisode();

  return buildPerspectiveIngestConstellationPreviewResponse({
    episodes: [episode],
    source,
  });
}

export function buildPerspectiveIngestConstellationPreviewError({
  code,
  status,
  authorityBoundary,
}: {
  code: PerspectiveIngestConstellationPreviewErrorCode;
  status: PerspectiveIngestConstellationPreviewErrorStatus;
  authorityBoundary?: string[];
}): PerspectiveIngestConstellationPreviewErrorBody {
  return {
    response_version: "perspective_ingest_constellation_preview.v0.1",
    error: {
      code,
      status,
    },
    authority_boundary: authorityBoundary ?? [
      "minimal fail-closed error",
      "no private source details",
      "no route-provided text grants authority",
    ],
  };
}

function getRequestedSource(request: Request): string | null {
  try {
    return new URL(request.url).searchParams.get("source");
  } catch {
    return null;
  }
}
