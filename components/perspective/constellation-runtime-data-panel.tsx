"use client";

import { useMemo, useState } from "react";

import { ConstellationRuntimeView } from "@/components/perspective/constellation-runtime-view";
import {
  buildRuntimeConstellationViewModelV01,
  createConstellationRuntimeUiCompletionAuthorityBoundaryV01,
  type ConstellationRuntimeUiCompletionBoundedErrorV01,
  type ConstellationRuntimeUiCompletionViewModelV01,
} from "@/lib/perspective/layout/build-runtime-constellation-view-model";
import type { SeededConstellationLayoutResult } from "@/lib/perspective/layout/seeded-layout";

const scope = "project:augnes" as const;
const defaultPerspectiveId = "perspective:runtime-ui:001";
const defaultStateDbPath = ".tmp/perspective-state/constellation-runtime-ui/state.sqlite";
const defaultManualAnchorDbPath =
  ".tmp/project-constellation-manual-anchors/constellation-runtime-ui/manual-anchors.sqlite";
const defaultRetrievalDbPath = ".tmp/research-retrieval/constellation-runtime-ui/retrieval.sqlite";
const ragPreviewRouteVersion = "rag_context_preview_runtime_completion_route.v0.1";
const ragPreviewRequestVersion = "rag_context_preview_runtime_completion_request.v0.1";
const ragPreviewVersion = "rag_context_preview_runtime_completion.v0.1";
const retrievalSearchVersion = "research_retrieval_index_runtime_completion_search.v0.1";

type RuntimeResponses = {
  durable_state_read_response?: unknown;
  trajectory_response?: unknown;
  manual_anchor_response?: unknown;
  rag_context_preview_response?: unknown;
};

type ConstellationRuntimeDataPanelProps = {
  layoutResult?: SeededConstellationLayoutResult | null;
  initialPerspectiveId?: string;
  initialSelectedNodeRef?: string | null;
  className?: string;
};

export function ConstellationRuntimeDataPanel({
  layoutResult,
  initialPerspectiveId = defaultPerspectiveId,
  initialSelectedNodeRef = null,
  className,
}: ConstellationRuntimeDataPanelProps) {
  const [perspectiveId, setPerspectiveId] = useState(initialPerspectiveId);
  const [selectedNodeRef, setSelectedNodeRef] = useState<string | null>(
    initialSelectedNodeRef ?? layoutResult?.layout?.node_positions[0]?.node_ref ?? null,
  );
  const [stateDbPath, setStateDbPath] = useState(defaultStateDbPath);
  const [manualAnchorDbPath, setManualAnchorDbPath] = useState(defaultManualAnchorDbPath);
  const [retrievalDbPath, setRetrievalDbPath] = useState(defaultRetrievalDbPath);
  const [query, setQuery] = useState("tension gap durable candidate source bridge");
  const [runtimeResponses, setRuntimeResponses] = useState<RuntimeResponses>({});
  const [boundedErrors, setBoundedErrors] = useState<ConstellationRuntimeUiCompletionBoundedErrorV01[]>([]);
  const [pending, setPending] = useState(false);

  const runtimeViewModel = useMemo(
    () =>
      buildRuntimeConstellationViewModelV01({
        layout_result: layoutResult ?? null,
        selected_node_ref: selectedNodeRef,
        bounded_errors: boundedErrors,
        ...runtimeResponses,
      }),
    [boundedErrors, layoutResult, runtimeResponses, selectedNodeRef],
  );

  async function loadRuntimeReadModel() {
    setPending(true);
    setBoundedErrors([]);
    try {
      const [stateResponse, trajectoryResponse, manualAnchorResponse, ragResponse] =
        await Promise.all([
          fetchBoundedJson(buildPerspectiveStateRoute(perspectiveId, stateDbPath), "durable_state"),
          fetchBoundedJson(buildPerspectiveTrajectoryRoute(perspectiveId, stateDbPath), "trajectory"),
          fetchBoundedJson(buildManualAnchorsRoute(perspectiveId, manualAnchorDbPath), "manual_anchors"),
          fetchBoundedJson(
            "/api/research-retrieval/rag-context-preview",
            "rag_context_preview",
            {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(buildRagPreviewRequest(retrievalDbPath, query)),
            },
          ),
        ]);
      setRuntimeResponses({
        durable_state_read_response: stateResponse.payload,
        trajectory_response: trajectoryResponse.payload,
        manual_anchor_response: manualAnchorResponse.payload,
        rag_context_preview_response: ragResponse.payload,
      });
      setBoundedErrors([
        ...stateResponse.errors,
        ...trajectoryResponse.errors,
        ...manualAnchorResponse.errors,
        ...ragResponse.errors,
      ]);
    } finally {
      setPending(false);
    }
  }

  return (
    <section
      className={`constellation-runtime-data-panel ${className ?? ""}`}
      data-augnes-authority="read-only runtime ui bounded route reads only"
    >
      <header className="constellation-runtime-view__header">
        <div>
          <p className="panel-eyebrow">Constellation runtime UI completion</p>
          <h2>Runtime constellation read model</h2>
          <p>This UI is read-only and uses bounded same-origin runtime routes.</p>
          <p>Layout coordinates and manual anchors are display hints, not truth.</p>
          <p>Product-write remains parked by #686.</p>
        </div>
        <button type="button" onClick={loadRuntimeReadModel} disabled={pending}>
          {pending ? "Loading runtime reads" : "Load runtime read model"}
        </button>
      </header>

      <div className="constellation-runtime-view__meta" aria-label="Runtime data source policy">
        <span>GET /api/perspective/state/[perspective_id]</span>
        <span>GET /api/perspective/state/[perspective_id]/trajectory</span>
        <span>GET /api/perspective/layout/manual-anchors</span>
        <span>POST /api/research-retrieval/rag-context-preview</span>
      </div>

      <div className="constellation-runtime-form" aria-label="Runtime read controls">
        <label>
          <span>Perspective ID</span>
          <input value={perspectiveId} onChange={(event) => setPerspectiveId(event.currentTarget.value)} />
        </label>
        <label>
          <span>State DB path</span>
          <input value={stateDbPath} onChange={(event) => setStateDbPath(event.currentTarget.value)} />
        </label>
        <label>
          <span>Manual anchor DB path</span>
          <input value={manualAnchorDbPath} onChange={(event) => setManualAnchorDbPath(event.currentTarget.value)} />
        </label>
        <label>
          <span>Retrieval DB path</span>
          <input value={retrievalDbPath} onChange={(event) => setRetrievalDbPath(event.currentTarget.value)} />
        </label>
        <label>
          <span>Selected node ref</span>
          <input
            value={selectedNodeRef ?? ""}
            onChange={(event) => setSelectedNodeRef(event.currentTarget.value || null)}
          />
        </label>
        <label>
          <span>Context preview query</span>
          <input value={query} onChange={(event) => setQuery(event.currentTarget.value)} />
        </label>
      </div>

      <ConstellationRuntimeView
        layoutResult={layoutResult ?? null}
        selectedRef={selectedNodeRef}
        onSelectedRefChange={setSelectedNodeRef}
        runtimeViewModel={runtimeViewModel}
      />

      <RuntimeCompletionReadout viewModel={runtimeViewModel} />
    </section>
  );
}

function RuntimeCompletionReadout({
  viewModel,
}: {
  viewModel: ConstellationRuntimeUiCompletionViewModelV01;
}) {
  return (
    <section className="constellation-runtime-readout" aria-label="Runtime completion readout">
      <p className="panel-eyebrow">Read-only runtime source summary</p>
      <div className="constellation-runtime-view__markers">
        <span>durable graph layer {viewModel.durable_nodes.length}</span>
        <span>candidate overlay layer {viewModel.candidate_overlay_nodes.length}</span>
        <span>source provenance inspector {viewModel.source_provenance_refs.length}</span>
        <span>manual anchor preview {viewModel.manual_anchor_previews.length}</span>
        <span>selected node trajectory preview {viewModel.selected_node_trajectory_preview.event_count}</span>
        <span>selected node context preview {viewModel.selected_node_rag_context_preview.context_item_count}</span>
      </div>

      <section>
        <h3>Bounded route errors</h3>
        {viewModel.bounded_errors.length > 0 ? (
          <ul>
            {viewModel.bounded_errors.map((error) => (
              <li key={`${error.source}:${error.error_code}`}>
                <code>{error.source}</code> returned <code>{error.error_code}</code>
                <p>{error.bounded_summary}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No bounded runtime route errors loaded.</p>
        )}
      </section>

      <section>
        <h3>Authority boundary</h3>
        <dl>
          {Object.entries(viewModel.authority_boundary).map(([key, value]) => (
            <div key={key}>
              <dt>{key}</dt>
              <dd>{String(value)}</dd>
            </div>
          ))}
        </dl>
      </section>
    </section>
  );
}

function buildPerspectiveStateRoute(perspectiveId: string, dbPath: string) {
  return `/api/perspective/state/${encodeURIComponent(perspectiveId)}?db_path=${encodeURIComponent(dbPath)}`;
}

function buildPerspectiveTrajectoryRoute(perspectiveId: string, dbPath: string) {
  return `/api/perspective/state/${encodeURIComponent(perspectiveId)}/trajectory?db_path=${encodeURIComponent(dbPath)}`;
}

function buildManualAnchorsRoute(perspectiveId: string, dbPath: string) {
  return `/api/perspective/layout/manual-anchors?db_path=${encodeURIComponent(dbPath)}&perspective_id=${encodeURIComponent(
    perspectiveId,
  )}`;
}

function buildRagPreviewRequest(dbPath: string, query: string) {
  return {
    route_version: ragPreviewRouteVersion,
    scope,
    input: {
      request_version: ragPreviewRequestVersion,
      preview_version: ragPreviewVersion,
      search_version: retrievalSearchVersion,
      scope,
      preview_request_id: "rag-context-preview-request:constellation-runtime-ui",
      requested_by: "operator:constellation-runtime-ui",
      requested_at: new Date().toISOString(),
      db_path: dbPath,
      query,
      search_filters: {},
      include_stale: true,
      max_search_results: 10,
      max_context_items: 6,
      max_context_chars: 1800,
      include_candidate_context: true,
      include_durable_context: true,
      include_tension_markers: true,
      include_gap_markers: true,
      authority_boundary: {
        rag_context_preview_runtime_now: true,
        db_backed_retrieval_search_now: true,
        explicit_operator_preview_only: true,
        same_origin_post_route_now: true,
        read_only_db_search_now: true,
        context_preview_created_now: true,
        candidate_vs_durable_markers_visible: true,
        staleness_warnings_visible: true,
        unresolved_tension_markers_visible: true,
        knowledge_gap_markers_visible: true,
      },
      reason_codes: [
        "rag_context_preview_runtime_completion",
        "db_backed_retrieval_search_now",
      ],
    },
  };
}

async function fetchBoundedJson(
  input: RequestInfo | URL,
  source: ConstellationRuntimeUiCompletionBoundedErrorV01["source"],
  init?: RequestInit,
): Promise<{ payload: unknown; errors: ConstellationRuntimeUiCompletionBoundedErrorV01[] }> {
  try {
    const response = await fetch(input, init);
    const payload = await response.json().catch(() => ({
      status: "error",
      error_code: "invalid_json_response",
    }));
    const errorCode = extractErrorCode(payload);
    return {
      payload,
      errors: errorCode
        ? [
            {
              source,
              error_code: errorCode,
              bounded_summary: `${source} returned bounded route error ${errorCode}.`,
            },
          ]
        : [],
    };
  } catch {
    return {
      payload: {
        status: "error",
        error_code: "runtime_read_failed",
        authority_boundary: createConstellationRuntimeUiCompletionAuthorityBoundaryV01(),
      },
      errors: [
        {
          source,
          error_code: "runtime_read_failed",
          bounded_summary: `${source} runtime read failed without exposing raw request details.`,
        },
      ],
    };
  }
}

function extractErrorCode(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return "invalid_json_response";
  const errorCode = (payload as { error_code?: unknown }).error_code;
  return typeof errorCode === "string" && errorCode.length > 0 ? errorCode : null;
}

export type { ConstellationRuntimeDataPanelProps };
