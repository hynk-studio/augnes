import { buildChatGptSampleSessionEpisode } from "@/lib/perspective-ingest/chatgpt-record-adapter";
import { buildCodexSampleSessionEpisode } from "@/lib/perspective-ingest/codex-record-adapter";
import {
  buildPerspectiveIngestConstellationPreviewResponse,
} from "@/lib/perspective-ingest/episode-to-constellation-packet";
import {
  buildPerspectiveAgentBrief,
} from "@/lib/perspective-ingest/perspective-agent-brief";
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
  PerspectiveIngestConstellationPreviewResponse,
} from "@/types/perspective-ingest-constellation-preview";
import type {
  PerspectiveAgentBriefReadErrorBodyV0,
  PerspectiveAgentBriefReadResponseV0,
  PerspectiveAgentBriefReadSourceQuery,
} from "@/types/perspective-agent-brief";

export const PERSPECTIVE_AGENT_BRIEF_SCOPE = "project:augnes";
export const PERSPECTIVE_AGENT_BRIEF_BOUNDARY_CLASS =
  "read_only_local_perspective_agent_brief";
export const PERSPECTIVE_AGENT_BRIEF_LOCAL_READ_HEADER =
  "x-augnes-local-readonly";
export const PERSPECTIVE_AGENT_BRIEF_LOCAL_READ_MARKER =
  "perspective-agent-brief-v0.1";
export const PERSPECTIVE_AGENT_BRIEF_ROUTE_FAMILY =
  "perspective_agent_brief";
export const PERSPECTIVE_AGENT_BRIEF_ROUTE_ID =
  "augnes.read.perspective-agent-brief.v0.1";
export const PERSPECTIVE_AGENT_BRIEF_ACCESS_POLICY: ReadonlyApiAccessPolicy =
  {
    route_id: PERSPECTIVE_AGENT_BRIEF_ROUTE_ID,
    required_scope: PERSPECTIVE_AGENT_BRIEF_SCOPE,
    required_marker_header: PERSPECTIVE_AGENT_BRIEF_LOCAL_READ_HEADER,
    required_marker_value: PERSPECTIVE_AGENT_BRIEF_LOCAL_READ_MARKER,
    allowed_hosts: READONLY_LOCAL_HOSTS,
    route_family: PERSPECTIVE_AGENT_BRIEF_ROUTE_FAMILY,
  };

export const PERSPECTIVE_AGENT_BRIEF_AUTHORITY_BOUNDARY = [
  "local-only read surface",
  "advisory Perspective brief",
  "no external calls",
  "no persistence",
  "no graph DB",
  "no proof/evidence/readiness writes",
  "no Codex execution",
  "no GitHub mutation",
  "no provider/model/API calls",
  "no OAuth/import source ingress",
  "no route-provided text grants authority",
];

export type PerspectiveAgentBriefReadErrorCode =
  | ReadonlyApiAccessErrorCode
  | ReadonlyApiAuthScopeErrorCodeV0
  | "unsupported_source"
  | "unknown_selected_node"
  | "unavailable";

export type PerspectiveAgentBriefReadErrorStatus =
  | ReadonlyApiAccessErrorStatus
  | ReadonlyApiAuthScopeFailureV0["status"]
  | 400
  | 500;

export type PerspectiveAgentBriefReadValidationResult =
  | {
      ok: true;
      scope: typeof PERSPECTIVE_AGENT_BRIEF_SCOPE;
      source: PerspectiveAgentBriefReadSourceQuery;
      selected_node_id: string | null;
      route_id: typeof PERSPECTIVE_AGENT_BRIEF_ROUTE_ID;
      route_family: typeof PERSPECTIVE_AGENT_BRIEF_ROUTE_FAMILY;
      local_authorized: true;
    }
  | {
      ok: false;
      code: PerspectiveAgentBriefReadErrorCode;
      status: PerspectiveAgentBriefReadErrorStatus;
      authority_boundary: string[];
    };

export function validatePerspectiveAgentBriefReadRequest(
  request: Request,
): PerspectiveAgentBriefReadValidationResult {
  const result = validateReadonlyApiLocalAccess(
    request,
    PERSPECTIVE_AGENT_BRIEF_ACCESS_POLICY,
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
  if (!isPerspectiveAgentBriefReadSourceQuery(source)) {
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

  const selectedNodeId = getRequestedSelectedNodeId(request);
  if (
    selectedNodeId &&
    !previewContainsNode(
      buildPerspectiveAgentBriefSourcePreview({ source }),
      selectedNodeId,
    )
  ) {
    return {
      ok: false,
      code: "unknown_selected_node",
      status: 400,
      authority_boundary: [
        "minimal fail-closed error",
        "selected_node_id must match an existing preview node",
        "no private source details",
        "no route-provided text grants authority",
      ],
    };
  }

  return {
    ok: true,
    scope: PERSPECTIVE_AGENT_BRIEF_SCOPE,
    source,
    selected_node_id: selectedNodeId,
    route_id: PERSPECTIVE_AGENT_BRIEF_ROUTE_ID,
    route_family: PERSPECTIVE_AGENT_BRIEF_ROUTE_FAMILY,
    local_authorized: true,
  };
}

export function buildPerspectiveAgentBriefReadResponse({
  source,
  selectedNodeId = null,
  generatedAt = new Date().toISOString(),
}: {
  source: PerspectiveAgentBriefReadSourceQuery;
  selectedNodeId?: string | null;
  generatedAt?: string;
}): PerspectiveAgentBriefReadResponseV0 {
  const preview = buildPerspectiveAgentBriefSourcePreview({ source });

  return {
    response_version: "perspective_agent_brief_read.v0.1",
    boundary_class: PERSPECTIVE_AGENT_BRIEF_BOUNDARY_CLASS,
    meta: {
      generated_at: generatedAt,
      route_id: PERSPECTIVE_AGENT_BRIEF_ROUTE_ID,
      route_family: PERSPECTIVE_AGENT_BRIEF_ROUTE_FAMILY,
      workspace_scope: PERSPECTIVE_AGENT_BRIEF_SCOPE,
      project_scope: PERSPECTIVE_AGENT_BRIEF_SCOPE,
      request_scope_ref: PERSPECTIVE_AGENT_BRIEF_SCOPE,
      source_query: source,
      selected_node_id: selectedNodeId,
      local_only: true,
      read_only: true,
      external_calls: false,
      persistence: false,
      graph_db: false,
      proof_evidence_readiness_writes: false,
      codex_execution: false,
    },
    brief: buildPerspectiveAgentBrief({
      preview,
      selected_node_id: selectedNodeId,
      scope_mode: selectedNodeId ? "selected_node" : "whole_constellation",
      scope_label: selectedNodeId ? "Selected node" : "Whole Constellation",
    }),
    source_refs: preview.source_refs,
    authority_boundary: [...PERSPECTIVE_AGENT_BRIEF_AUTHORITY_BOUNDARY],
  };
}

export function buildPerspectiveAgentBriefSourcePreview({
  source,
}: {
  source: PerspectiveAgentBriefReadSourceQuery;
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

export function buildPerspectiveAgentBriefReadError({
  code,
  status,
  authorityBoundary,
}: {
  code: PerspectiveAgentBriefReadErrorCode;
  status: PerspectiveAgentBriefReadErrorStatus;
  authorityBoundary?: string[];
}): PerspectiveAgentBriefReadErrorBodyV0 {
  return {
    response_version: "perspective_agent_brief_read.v0.1",
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

function getRequestedSelectedNodeId(request: Request): string | null {
  try {
    const selectedNodeId = new URL(request.url).searchParams.get(
      "selected_node_id",
    );
    const trimmed = selectedNodeId?.trim();
    return trimmed ? trimmed : null;
  } catch {
    return null;
  }
}

function isPerspectiveAgentBriefReadSourceQuery(
  source: string | null,
): source is PerspectiveAgentBriefReadSourceQuery {
  return source === "sample:chatgpt" || source === "sample:codex";
}

function previewContainsNode(
  preview: PerspectiveIngestConstellationPreviewResponse,
  nodeId: string,
): boolean {
  return preview.constellation.nodes.some((node) => node.id === nodeId);
}
