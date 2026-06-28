"use client";

import { useMemo, useState } from "react";

import { CandidateOverlayToggle } from "@/components/perspective/candidate-overlay-toggle";
import { ConstellationEdge } from "@/components/perspective/constellation-edge";
import { ConstellationInspector } from "@/components/perspective/constellation-inspector";
import { ConstellationNode } from "@/components/perspective/constellation-node";
import type { ConstellationRuntimeUiCompletionViewModelV01 } from "@/lib/perspective/layout/build-runtime-constellation-view-model";
import type { SeededConstellationLayoutResult } from "@/lib/perspective/layout/seeded-layout";
import type {
  ProjectConstellationLayoutEdge,
  ProjectConstellationLayoutNode,
  ProjectConstellationLayoutPosition,
  ProjectConstellationRuntimeLayoutContract,
} from "@/types/project-constellation-runtime-layout-contract";

const CONSTELLATION_RENDER_PADDING_V01 = 64;
const CONSTELLATION_NODE_RENDER_WIDTH_V01 = 140;
const CONSTELLATION_NODE_RENDER_HEIGHT_V01 = 100;
const CONSTELLATION_MIN_RENDER_WIDTH_V01 = 720;
const CONSTELLATION_MIN_RENDER_HEIGHT_V01 = 520;

type ConstellationRuntimeViewProps = {
  layoutResult?: SeededConstellationLayoutResult | null;
  layout?: ProjectConstellationRuntimeLayoutContract | null;
  showCandidateOverlay?: boolean;
  selectedRef?: string | null;
  onSelectedRefChange?: (ref: string | null) => void;
  runtimeViewModel?: ConstellationRuntimeUiCompletionViewModelV01 | null;
  className?: string;
};

type ConstellationRenderFrameV01 = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  padding: number;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
};

export function createConstellationRenderFrameV01(
  nodes: ProjectConstellationLayoutNode[],
  padding = CONSTELLATION_RENDER_PADDING_V01,
): ConstellationRenderFrameV01 {
  const xValues = nodes.map((node) => finitePositionValue(node.position.x));
  const yValues = nodes.map((node) => finitePositionValue(node.position.y));
  const minX = xValues.length > 0 ? Math.min(...xValues) : 0;
  const minY = yValues.length > 0 ? Math.min(...yValues) : 0;
  const maxX = xValues.length > 0 ? Math.max(...xValues) : 0;
  const maxY = yValues.length > 0 ? Math.max(...yValues) : 0;
  const offsetX = minX < padding ? padding - minX : padding;
  const offsetY = minY < padding ? padding - minY : padding;

  return {
    minX,
    minY,
    maxX,
    maxY,
    padding,
    offsetX,
    offsetY,
    width: Math.max(
      CONSTELLATION_MIN_RENDER_WIDTH_V01,
      Math.ceil(maxX + offsetX + padding + CONSTELLATION_NODE_RENDER_WIDTH_V01),
    ),
    height: Math.max(
      CONSTELLATION_MIN_RENDER_HEIGHT_V01,
      Math.ceil(maxY + offsetY + padding + CONSTELLATION_NODE_RENDER_HEIGHT_V01),
    ),
  };
}

export function normalizeConstellationNodePositionV01(
  position: ProjectConstellationLayoutPosition,
  frame: ConstellationRenderFrameV01,
): ProjectConstellationLayoutPosition {
  return {
    ...position,
    x: finitePositionValue(position.x) + frame.offsetX,
    y: finitePositionValue(position.y) + frame.offsetY,
  };
}

export function ConstellationRuntimeView({
  layoutResult,
  layout: layoutProp,
  showCandidateOverlay,
  selectedRef,
  onSelectedRefChange,
  runtimeViewModel,
  className,
}: ConstellationRuntimeViewProps) {
  const layout = layoutProp ?? layoutResult?.layout ?? null;
  const diagnostics = layoutResult?.diagnostics ?? layout?.source_balance_diagnostics ?? [];
  const [localOverlayVisible, setLocalOverlayVisible] = useState(
    showCandidateOverlay ?? true,
  );
  const [localSelectedRef, setLocalSelectedRef] = useState<string | null>(
    selectedRef ?? null,
  );
  const overlayVisible = showCandidateOverlay ?? localOverlayVisible;
  const activeSelectedRef = selectedRef ?? localSelectedRef;

  const visibleNodes = useMemo(
    () =>
      (layout?.node_positions ?? []).filter(
        (node) => overlayVisible || node.layer !== "candidate_overlay",
      ),
    [layout, overlayVisible],
  );
  const visibleNodeRefs = useMemo(
    () => new Set(visibleNodes.map((node) => node.node_ref)),
    [visibleNodes],
  );
  const nodeByRef = useMemo(
    () => new Map(visibleNodes.map((node) => [node.node_ref, node])),
    [visibleNodes],
  );
  const renderFrame = useMemo(
    () => createConstellationRenderFrameV01(visibleNodes),
    [visibleNodes],
  );
  const normalizedNodePositionsByRef = useMemo(
    () =>
      new Map(
        visibleNodes.map((node) => [
          node.node_ref,
          normalizeConstellationNodePositionV01(node.position, renderFrame),
        ]),
      ),
    [visibleNodes, renderFrame],
  );
  const selectedNode =
    visibleNodes.find((node) => node.node_ref === activeSelectedRef) ?? null;
  const selectedEdge =
    layout?.edge_routes.find((edge) => edge.edge_ref === activeSelectedRef) ?? null;

  function setSelected(ref: string | null) {
    if (selectedRef === undefined) setLocalSelectedRef(ref);
    onSelectedRefChange?.(ref);
  }

  function setOverlay(checked: boolean) {
    if (showCandidateOverlay === undefined) setLocalOverlayVisible(checked);
  }

  if (!layout) {
    return (
      <section className={`constellation-runtime-view ${className ?? ""}`}>
        <p className="panel-eyebrow">Read-only constellation view</p>
        <h2>No layout available</h2>
        <p>Coordinates are display hints</p>
        <p>Candidate overlay is not durable graph</p>
        <p>Runtime read model is read-only</p>
        <p>No state mutation</p>
        <p>Product-write remains parked</p>
      </section>
    );
  }

  return (
    <section
      className={`constellation-runtime-view ${className ?? ""}`}
      data-augnes-authority="read-only constellation runtime ui"
    >
      <header className="constellation-runtime-view__header">
        <div>
          <p className="panel-eyebrow">Read-only constellation view</p>
          <h2>Project constellation</h2>
          <p>Coordinates are display hints</p>
          <p>Candidate overlay is not durable graph</p>
          <p>Runtime read model is read-only</p>
          <p>No state mutation</p>
          <p>Product-write remains parked</p>
        </div>
        <CandidateOverlayToggle
          checked={overlayVisible}
          onChange={setOverlay}
        />
      </header>

      <div className="constellation-runtime-view__meta">
        <span>
          layout <code>{layout.layout_id}</code>
        </span>
        <span>
          perspective <code>{layout.perspective_id}</code>
        </span>
        <span>
          seed <code>{layout.layout_seed}</code>
        </span>
      </div>

      <div className="constellation-runtime-view__workspace">
        <div className="constellation-canvas" aria-label="Read-only constellation canvas">
          <svg
            className="constellation-edge-layer"
            role="img"
            aria-label="Read-only edge layer"
            viewBox={`0 0 ${renderFrame.width} ${renderFrame.height}`}
            style={{
              width: `${renderFrame.width}px`,
              height: `${renderFrame.height}px`,
            }}
          >
            {layout.edge_routes.map((edge) => {
              const fromNode = nodeByRef.get(edge.from_node_ref);
              const toNode = nodeByRef.get(edge.to_node_ref);
              if (!fromNode || !toNode) return null;
              return (
                <ConstellationEdge
                  key={edge.edge_ref}
                  edge={edge}
                  fromPosition={normalizedNodePositionsByRef.get(fromNode.node_ref)}
                  toPosition={normalizedNodePositionsByRef.get(toNode.node_ref)}
                  selected={activeSelectedRef === edge.edge_ref}
                  onSelect={setSelected}
                />
              );
            })}
          </svg>

          {visibleNodes.map((node) => (
            <ConstellationNode
              key={node.node_ref}
              node={node}
              renderPosition={normalizedNodePositionsByRef.get(node.node_ref)}
              selected={activeSelectedRef === node.node_ref}
              onSelect={setSelected}
            />
          ))}

          <div className="constellation-edge-warnings">
            {layout.edge_routes
              .filter(
                (edge) =>
                  !visibleNodeRefs.has(edge.from_node_ref) ||
                  !visibleNodeRefs.has(edge.to_node_ref),
              )
              .map((edge) => (
                <ConstellationEdge
                  key={`warning:${edge.edge_ref}`}
                  edge={edge}
                  fromPosition={normalizedNodePositionsByRef.get(edge.from_node_ref)}
                  toPosition={normalizedNodePositionsByRef.get(edge.to_node_ref)}
                />
              ))}
          </div>
        </div>

        <ConstellationInspector
          selectedNode={selectedNode}
          selectedEdge={selectedEdge}
          layout={layout}
          diagnostics={diagnostics}
          runtimeViewModel={runtimeViewModel}
        />
      </div>

      <MarkerSummary layout={layout} />
      {runtimeViewModel ? <RuntimeViewModelSummary viewModel={runtimeViewModel} /> : null}
    </section>
  );
}

function finitePositionValue(value: number) {
  return Number.isFinite(value) ? value : 0;
}

function MarkerSummary({
  layout,
}: {
  layout: ProjectConstellationRuntimeLayoutContract;
}) {
  const markerGroups = [
    ["stale markers", layout.stale_markers.length],
    ["tension markers", layout.tension_markers.length],
    ["gap markers", layout.gap_markers.length],
    ["bridge markers", layout.bridge_node_markers.length],
  ];

  return (
    <footer className="constellation-runtime-view__markers">
      {markerGroups.map(([label, count]) => (
        <span key={label}>
          {label} <strong>{count}</strong>
        </span>
      ))}
      <span>Source balance is advisory</span>
    </footer>
  );
}

function RuntimeViewModelSummary({
  viewModel,
}: {
  viewModel: ConstellationRuntimeUiCompletionViewModelV01;
}) {
  return (
    <section className="constellation-runtime-view__runtime-summary">
      <p className="panel-eyebrow">Runtime read-only layers</p>
      <div className="constellation-runtime-view__markers">
        <span>durable graph layer {viewModel.durable_nodes.length}</span>
        <span>candidate overlay layer {viewModel.candidate_overlay_nodes.length}</span>
        <span>source provenance inspector {viewModel.source_provenance_refs.length}</span>
        <span>tension/gap/stale/bridge markers visible</span>
        <span>manual anchor preview {viewModel.manual_anchor_previews.length}</span>
        <span>layout diagnostics {viewModel.layout_diagnostics.length}</span>
        <span>
          selected node trajectory preview{" "}
          {viewModel.selected_node_trajectory_preview.event_count}
        </span>
        <span>
          selected node context preview{" "}
          {viewModel.selected_node_rag_context_preview.context_item_count}
        </span>
      </div>
    </section>
  );
}

export type {
  ConstellationRuntimeViewProps,
  ConstellationRenderFrameV01,
  ProjectConstellationLayoutEdge,
  ProjectConstellationLayoutNode,
};
