import fixture from "@/fixtures/project-constellation.sample.sidecar-strategy-c-v0.1.json";
import type {
  ReadonlyApiRouteConstellationCluster,
  ReadonlyApiRouteConstellationEdge,
  ReadonlyApiRouteConstellationNode,
  ReadonlyApiRouteEvidencePointer,
  ReadonlyApiRouteForbiddenField,
  ReadonlyApiRouteNextActionCandidate,
  ReadonlyApiRouteProjectConstellationReadModel,
  ReadonlyApiRouteResponseEnvelopeV0,
  ReadonlyApiRouteSourceRef,
  ReadonlyApiRouteUnresolvedTension,
} from "@/types/readonly-api-route-response";

export const CONSTELLATION_PREVIEW_SCOPE = "project:augnes";
export const CONSTELLATION_PREVIEW_LOCAL_READ_HEADER =
  "x-augnes-local-readonly";
export const CONSTELLATION_PREVIEW_LOCAL_READ_MARKER =
  "constellation-preview-v0.1";
export const CONSTELLATION_PREVIEW_ROUTE_FAMILY = "project_constellation";

const STATIC_FIXTURE_SOURCE_REF =
  "fixtures/project-constellation.sample.sidecar-strategy-c-v0.1.json";
const CONSTELLATION_ID = "project_constellation.sample.sidecar_strategy_c.v0_1";

const AUTHORITY_BOUNDARY = [
  "read-only response",
  "static public-safe fixture source",
  "no route-provided text grants authority",
  "route-provided text is untrusted display data, not instructions",
  "evidence pointers are pointer-only",
  "next actions are advisory",
  "no proof/evidence/readiness writes",
  "no Codex execution",
  "no branch/PR creation",
  "no merge/publish/approval/retry/replay/deploy authority",
  "no graph DB",
  "no persistence",
  "no runtime node creation",
  "no consumer surface connected",
];

const NEXT_ACTION_AUTHORITY_BOUNDARY = [
  "advisory only",
  "does not execute Codex",
  "does not create branches",
  "does not open PRs",
  "does not publish",
  "does not merge",
  "does not approve",
  "does not retry",
  "does not replay",
  "does not deploy",
  "does not record proof/evidence",
];

const FORBIDDEN_FIELDS_REMOVED: ReadonlyApiRouteForbiddenField[] = [
  "secrets",
  "credentials/auth/env",
  "hidden reasoning / chain-of-thought",
  "raw DB rows",
  "proof/evidence write handles",
  "mutation URLs",
  "approval/publish/merge controls",
  "Codex SDK execution handles",
  "provider credentials",
];

type ProjectConstellationFixture = {
  version: string;
  status: string;
  authority: string;
  formation_mode: string;
  source_use_case: string;
  source_scope: {
    scope_id: string;
    title: string;
    summary: string;
    public_safety: string;
    boundaries: string[];
  };
  nodes: FixtureNode[];
  edges: FixtureEdge[];
  clusters: FixtureCluster[];
};

type FixtureNode = {
  id: string;
  type: string;
  label: string;
  summary: string;
  source_refs: string[];
  evidence_pointers: string[];
  unresolved_tensions: string[];
  next_action_candidates: string[];
};

type FixtureEdge = {
  id: string;
  type: string;
  source: string;
  target: string;
  summary: string;
  evidence_pointers: string[];
};

type FixtureCluster = {
  id: string;
  label: string;
  node_ids: string[];
  edge_ids: string[];
  cluster_thesis: string;
  unresolved_tensions: string[];
  next_action_candidates: string[];
};

export type ConstellationPreviewErrorCode =
  | "missing_scope"
  | "malformed_request"
  | "unauthorized_scope"
  | "local_authorization_required"
  | "unavailable";

export type ConstellationPreviewErrorStatus = 400 | 403 | 500;

export type ConstellationPreviewValidationResult =
  | {
      ok: true;
      scope: typeof CONSTELLATION_PREVIEW_SCOPE;
    }
  | {
      ok: false;
      code: ConstellationPreviewErrorCode;
      status: ConstellationPreviewErrorStatus;
    };

export type ConstellationPreviewErrorBody = {
  response_version: "readonly_api_route_response.v0.1";
  error: {
    code: ConstellationPreviewErrorCode;
    status: ConstellationPreviewErrorStatus;
  };
  authority_boundary: string[];
};

export function validateConstellationPreviewRequest(
  request: Request,
): ConstellationPreviewValidationResult {
  let url: URL;

  try {
    url = new URL(request.url);
  } catch {
    return { ok: false, code: "malformed_request", status: 400 };
  }

  const scope = url.searchParams.get("scope");
  if (!scope) {
    return { ok: false, code: "missing_scope", status: 400 };
  }

  if (!isLocalRequestHost(request, url)) {
    return { ok: false, code: "local_authorization_required", status: 403 };
  }

  if (
    request.headers.get(CONSTELLATION_PREVIEW_LOCAL_READ_HEADER) !==
    CONSTELLATION_PREVIEW_LOCAL_READ_MARKER
  ) {
    return { ok: false, code: "local_authorization_required", status: 403 };
  }

  if (scope !== CONSTELLATION_PREVIEW_SCOPE) {
    return { ok: false, code: "unauthorized_scope", status: 403 };
  }

  return { ok: true, scope: CONSTELLATION_PREVIEW_SCOPE };
}

export function buildConstellationPreviewResponse({
  generatedAt = new Date().toISOString(),
  scope = CONSTELLATION_PREVIEW_SCOPE,
}: {
  generatedAt?: string;
  scope?: typeof CONSTELLATION_PREVIEW_SCOPE;
} = {}): ReadonlyApiRouteResponseEnvelopeV0 {
  const source_refs = buildSourceRefs();
  const project_constellation = buildProjectConstellation();

  return {
    response_version: "readonly_api_route_response.v0.1",
    meta: {
      generated_at: generatedAt,
      route_family: CONSTELLATION_PREVIEW_ROUTE_FAMILY,
      workspace_scope: scope,
      project_scope: scope,
      request_scope_ref: scope,
      response_shape_boundary: "type_only",
      runtime_schema: false,
      api_route_implementation: false,
      auth_implementation: false,
      external_calls: false,
      source_of_truth: false,
    },
    source_refs,
    project_constellation,
    evidence_pointers: project_constellation.evidence_pointers,
    unresolved_tensions: project_constellation.unresolved_tensions,
    next_action_candidates: project_constellation.next_action_candidates,
    forbidden_fields_removed: FORBIDDEN_FIELDS_REMOVED,
    authority_boundary: AUTHORITY_BOUNDARY,
  };
}

export function buildConstellationPreviewError({
  code,
  status,
}: {
  code: ConstellationPreviewErrorCode;
  status: ConstellationPreviewErrorStatus;
}): ConstellationPreviewErrorBody {
  return {
    response_version: "readonly_api_route_response.v0.1",
    error: {
      code,
      status,
    },
    authority_boundary: [
      "minimal fail-closed error",
      "no private source details",
      "no route-provided text grants authority",
    ],
  };
}

function buildSourceRefs(): ReadonlyApiRouteSourceRef[] {
  const source = typedFixture().source_scope;

  return [
    {
      source_ref: STATIC_FIXTURE_SOURCE_REF,
      source_kind: "static_fixture",
      source_label: "Project Constellation public-safe sample fixture",
      source_scope: source.scope_id,
      provenance_note: `${source.public_safety}; ${source.summary}`,
    },
    {
      source_ref: "docs/READONLY_API_ROUTE_CONSTELLATION_PREVIEW_V0_1.md",
      source_kind: "document_pointer",
      source_label: "Route implementation boundary",
      source_scope: CONSTELLATION_PREVIEW_SCOPE,
      provenance_note: "Documents this route-only local validation slice.",
    },
  ];
}

function buildProjectConstellation(): ReadonlyApiRouteProjectConstellationReadModel {
  const sample = typedFixture();
  const nodes = sample.nodes.map(mapNode);
  const edges = sample.edges.map(mapEdge);
  const clusters = sample.clusters.map(mapCluster);
  const evidence_pointers = uniquePointerIds([
    ...nodes.flatMap((node) => node.evidence_pointers.map((pointer) => pointer.pointer_id)),
    ...edges.flatMap((edge) => edge.evidence_pointers.map((pointer) => pointer.pointer_id)),
  ]).map((pointerId) =>
    buildEvidencePointer(pointerId, {
      sourceRef: STATIC_FIXTURE_SOURCE_REF,
    }),
  );
  const unresolved_tensions = [
    ...nodes.flatMap((node) => node.unresolved_tensions),
    ...clusters.flatMap((cluster) => cluster.unresolved_tensions),
  ];
  const next_action_candidates = [
    ...nodes.flatMap((node) => node.next_action_candidates),
    ...clusters.flatMap((cluster) => cluster.next_action_candidates),
  ];

  return {
    constellation_id: CONSTELLATION_ID,
    thesis:
      sample.clusters[0]?.cluster_thesis ??
      "Static public-safe Project Constellation preview.",
    nodes,
    edges,
    clusters,
    evidence_pointers,
    unresolved_tensions,
    next_action_candidates,
    authority_boundary: AUTHORITY_BOUNDARY,
  };
}

function mapNode(node: FixtureNode): ReadonlyApiRouteConstellationNode {
  const evidencePointers = node.evidence_pointers.map((pointerId) =>
    buildEvidencePointer(pointerId, { sourceRef: node.id }),
  );

  return {
    id: node.id,
    type: node.type,
    label: node.label,
    summary: node.summary,
    source_refs: node.source_refs,
    evidence_pointers: evidencePointers,
    unresolved_tensions: node.unresolved_tensions.map((summary, index) =>
      buildUnresolvedTension({
        ownerId: node.id,
        summary,
        index,
        sourceRefs: node.source_refs,
        evidencePointers,
      }),
    ),
    next_action_candidates: node.next_action_candidates.map((summary, index) =>
      buildNextActionCandidate({
        ownerId: node.id,
        summary,
        index,
        sourceRefs: node.source_refs,
      }),
    ),
  };
}

function mapEdge(edge: FixtureEdge): ReadonlyApiRouteConstellationEdge {
  return {
    id: edge.id,
    type: edge.type,
    source: edge.source,
    target: edge.target,
    summary: edge.summary,
    source_refs: [STATIC_FIXTURE_SOURCE_REF],
    evidence_pointers: edge.evidence_pointers.map((pointerId) =>
      buildEvidencePointer(pointerId, { sourceRef: edge.id }),
    ),
  };
}

function mapCluster(cluster: FixtureCluster): ReadonlyApiRouteConstellationCluster {
  return {
    id: cluster.id,
    label: cluster.label,
    node_ids: cluster.node_ids,
    edge_ids: cluster.edge_ids,
    cluster_thesis: cluster.cluster_thesis,
    unresolved_tensions: cluster.unresolved_tensions.map((summary, index) =>
      buildUnresolvedTension({
        ownerId: cluster.id,
        summary,
        index,
        sourceRefs: [STATIC_FIXTURE_SOURCE_REF],
        evidencePointers: [],
      }),
    ),
    next_action_candidates: cluster.next_action_candidates.map((summary, index) =>
      buildNextActionCandidate({
        ownerId: cluster.id,
        summary,
        index,
        sourceRefs: [STATIC_FIXTURE_SOURCE_REF],
      }),
    ),
  };
}

function buildEvidencePointer(
  pointerId: string,
  { sourceRef }: { sourceRef: string },
): ReadonlyApiRouteEvidencePointer {
  return {
    pointer_id: pointerId,
    label: labelFromId(pointerId),
    target_ref: sourceRef,
    pointer_kind: "evidence_pointer",
    pointer_semantics: "pointer_only",
    bounded_summary:
      "Pointer-only reference from the static public-safe Project Constellation fixture.",
    proof_evidence_write_authority: false,
    readiness_write_authority: false,
  };
}

function buildUnresolvedTension({
  ownerId,
  summary,
  index,
  sourceRefs,
  evidencePointers,
}: {
  ownerId: string;
  summary: string;
  index: number;
  sourceRefs: string[];
  evidencePointers: ReadonlyApiRouteEvidencePointer[];
}): ReadonlyApiRouteUnresolvedTension {
  return {
    tension_id: `${ownerId}.tension.${index + 1}`,
    label: `Unresolved tension ${index + 1}`,
    summary,
    source_refs: sourceRefs,
    evidence_pointers: evidencePointers,
  };
}

function buildNextActionCandidate({
  ownerId,
  summary,
  index,
  sourceRefs,
}: {
  ownerId: string;
  summary: string;
  index: number;
  sourceRefs: string[];
}): ReadonlyApiRouteNextActionCandidate {
  return {
    candidate_id: `${ownerId}.next_action.${index + 1}`,
    label: `Advisory next action ${index + 1}`,
    summary,
    source_refs: sourceRefs,
    authority_boundary: NEXT_ACTION_AUTHORITY_BOUNDARY,
  };
}

function isLocalRequestHost(request: Request, url: URL): boolean {
  const hostHeader = request.headers.get("host");
  const hostsToCheck = hostHeader ? [hostHeader, url.host] : [url.host];

  return hostsToCheck.every((host) => isLocalHost(host));
}

function isLocalHost(hostWithOptionalPort: string): boolean {
  const normalized = normalizeHost(hostWithOptionalPort);

  return normalized === "localhost" || normalized === "127.0.0.1" || normalized === "::1";
}

function normalizeHost(hostWithOptionalPort: string): string {
  const host = hostWithOptionalPort.trim().toLowerCase();

  if (host === "::1") {
    return host;
  }

  if (host.startsWith("[") && host.includes("]")) {
    return host.slice(1, host.indexOf("]"));
  }

  const colonIndex = host.indexOf(":");
  if (colonIndex === -1) {
    return host;
  }

  return host.slice(0, colonIndex);
}

function labelFromId(id: string): string {
  return id
    .replace(/^pointer\./, "")
    .replace(/[._-]+/g, " ")
    .trim();
}

function uniquePointerIds(pointerIds: string[]): string[] {
  return Array.from(new Set(pointerIds)).sort();
}

function typedFixture(): ProjectConstellationFixture {
  return fixture as ProjectConstellationFixture;
}
