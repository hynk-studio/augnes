"use client";

import { useMemo, useState } from "react";

import { CandidateOverlayToggle } from "@/components/perspective/candidate-overlay-toggle";
import { ConstellationEdge } from "@/components/perspective/constellation-edge";
import { ConstellationInspector } from "@/components/perspective/constellation-inspector";
import { ConstellationNode } from "@/components/perspective/constellation-node";
import type { SeededConstellationLayoutResult } from "@/lib/perspective/layout/seeded-layout";
import type {
  ProjectConstellationLayoutEdge,
  ProjectConstellationLayoutNode,
  ProjectConstellationRuntimeLayoutContract,
} from "@/types/project-constellation-runtime-layout-contract";

type ConstellationRuntimeViewProps = {
  layoutResult?: SeededConstellationLayoutResult | null;
  layout?: ProjectConstellationRuntimeLayoutContract | null;
  showCandidateOverlay?: boolean;
  selectedRef?: string | null;
  onSelectedRefChange?: (ref: string | null) => void;
  className?: string;
};

export function ConstellationRuntimeView({
  layoutResult,
  layout: layoutProp,
  showCandidateOverlay,
  selectedRef,
  onSelectedRefChange,
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
          <svg className="constellation-edge-layer" role="img" aria-label="Read-only edge layer">
            {layout.edge_routes.map((edge) => {
              const fromNode = nodeByRef.get(edge.from_node_ref);
              const toNode = nodeByRef.get(edge.to_node_ref);
              if (!fromNode || !toNode) return null;
              return (
                <ConstellationEdge
                  key={edge.edge_ref}
                  edge={edge}
                  fromPosition={fromNode.position}
                  toPosition={toNode.position}
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
                  fromPosition={nodeByRef.get(edge.from_node_ref)?.position}
                  toPosition={nodeByRef.get(edge.to_node_ref)?.position}
                />
              ))}
          </div>
        </div>

        <ConstellationInspector
          selectedNode={selectedNode}
          selectedEdge={selectedEdge}
          layout={layout}
          diagnostics={diagnostics}
        />
      </div>

      <MarkerSummary layout={layout} />
    </section>
  );
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

export type {
  ConstellationRuntimeViewProps,
  ProjectConstellationLayoutEdge,
  ProjectConstellationLayoutNode,
};
