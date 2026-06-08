import type { PerspectiveAgentBriefV0 } from "@/lib/perspective-ingest/perspective-agent-brief";
import type {
  PerspectiveIngestConstellationPreviewResponse,
} from "@/types/perspective-ingest-constellation-preview";

export type PerspectiveAgentBriefReadSourceQuery =
  | "sample:chatgpt"
  | "sample:codex";

export type PerspectiveAgentBriefReadRouteId =
  "augnes.read.perspective-agent-brief.v0.1";

export type PerspectiveAgentBriefReadBoundaryClass =
  "read_only_local_perspective_agent_brief";

export interface PerspectiveAgentBriefReadResponseV0 {
  response_version: "perspective_agent_brief_read.v0.1";
  boundary_class: PerspectiveAgentBriefReadBoundaryClass;
  meta: {
    generated_at: string;
    route_id: PerspectiveAgentBriefReadRouteId;
    route_family: "perspective_agent_brief";
    workspace_scope: "project:augnes";
    project_scope: "project:augnes";
    request_scope_ref: "project:augnes";
    source_query: PerspectiveAgentBriefReadSourceQuery;
    selected_node_id: string | null;
    local_only: true;
    read_only: true;
    external_calls: false;
    persistence: false;
    graph_db: false;
    proof_evidence_readiness_writes: false;
    codex_execution: false;
  };
  brief: PerspectiveAgentBriefV0;
  source_refs: PerspectiveIngestConstellationPreviewResponse["source_refs"];
  authority_boundary: string[];
}

export interface PerspectiveAgentBriefReadErrorBodyV0 {
  response_version: "perspective_agent_brief_read.v0.1";
  error: {
    code: string;
    status: number;
  };
  authority_boundary: string[];
}
