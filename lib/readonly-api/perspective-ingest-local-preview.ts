import { buildManualPastedTextSessionEpisode } from "@/lib/perspective-ingest/manual-pasted-text-adapter";
import {
  PERSPECTIVE_INGRESS_DEFAULT_AUTHORITY_BOUNDARY,
  buildPerspectiveIngressAdmissionDecision,
  buildPerspectiveIngressSourceArtifactCandidate,
  getPerspectiveIngressFormationReadiness,
  summarizePerspectiveIngressCandidateForFormation,
} from "@/lib/perspective-ingest/perspective-ingress-admission-model";
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
  PerspectiveIngestAdmissionPreviewV0,
  PerspectiveIngestConstellationPreviewResponse,
  PerspectiveIngestLocalPastedTextPreviewRequest,
  PerspectiveIngestLocalPreviewErrorBody,
  PerspectiveIngestSessionEpisode,
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
  | "ingress_not_preview_ready"
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

export type PerspectiveIngestLocalPreviewReadResult =
  | {
      ok: true;
      response: PerspectiveIngestConstellationPreviewResponse;
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
  const result = buildPerspectiveIngestLocalPreviewReadResult({
    generatedAt,
    request,
  });

  if (!result.ok) {
    throw new Error(result.summary);
  }

  return result.response;
}

export function buildPerspectiveIngestLocalPreviewReadResult({
  generatedAt,
  request,
}: {
  request: PerspectiveIngestLocalPastedTextPreviewRequest;
  generatedAt: string;
}): PerspectiveIngestLocalPreviewReadResult {
  const episode = buildManualPastedTextSessionEpisode({
    generatedAt,
    request,
  });
  const ingressAdmission = buildPerspectiveManualPastedTextIngressAdmission({
    episode,
    generatedAt,
    request,
  });

  if (
    !ingressAdmission.readiness.eligible_for_preview ||
    !ingressAdmission.decision.allowed
  ) {
    return {
      ok: false,
      code: "ingress_not_preview_ready",
      status: 400,
      summary: "Manual pasted text ingress candidate is not ready for preview.",
      authority_boundary: [
        "local-only ingress candidate",
        "read-only candidate projection",
        "no raw pasted text echo",
        "no persistence",
        "no graph DB",
        "no proof/evidence/readiness writes",
        "no Codex execution",
        "no route-provided text grants authority",
      ],
    };
  }

  const response = buildPerspectiveIngestConstellationPreviewResponse({
    episodes: [episode],
    routeId: PERSPECTIVE_INGEST_LOCAL_PREVIEW_ROUTE_ID,
    source: "manual:pasted_text",
  });

  return {
    ok: true,
    response: {
      ...response,
      ingress_admission: ingressAdmission,
    },
  };
}

export function buildPerspectiveManualPastedTextIngressAdmission({
  episode,
  generatedAt,
  request,
}: {
  request: PerspectiveIngestLocalPastedTextPreviewRequest;
  episode: PerspectiveIngestSessionEpisode;
  generatedAt: string;
}): PerspectiveIngestAdmissionPreviewV0 {
  const candidate = buildPerspectiveIngressSourceArtifactCandidate({
    ingress_kind: "manual_pasted_text",
    created_at: generatedAt,
    source_label: request.source_label ?? "Manual pasted text",
    source_ref: episode.source_ref,
    provenance_note:
      "manual pasted text bounded by local validation and episode extraction",
    bounded_summary: episode.summary,
    pointer_refs: episode.evidence_refs.length
      ? episode.evidence_refs
      : [episode.source_ref],
    actor_refs: episode.actors,
    requested_by: "operator:local",
    consent_ref: "manual_pasted_text:user_submitted",
    retention_hint: "candidate_pointer_only",
    admission_state: "episode_candidate",
    redaction_state: "not_applicable",
    authority_boundary: PERSPECTIVE_INGRESS_DEFAULT_AUTHORITY_BOUNDARY,
  });
  const readiness = getPerspectiveIngressFormationReadiness(candidate);
  const decision = buildPerspectiveIngressAdmissionDecision({
    candidate,
    to_state: "accepted_for_preview",
    reason: "manual pasted text passed local bounded preview readiness",
  });

  return {
    admission_version: "perspective_ingress_admission_preview.v0.1",
    candidate: summarizePerspectiveIngressCandidateForFormation(candidate),
    readiness,
    decision,
    source: {
      ingress_kind: "manual_pasted_text",
      trust_level: "user_provided_local",
      admission_state: candidate.admission_state,
      redaction_state: candidate.redaction_state,
    },
  };
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
