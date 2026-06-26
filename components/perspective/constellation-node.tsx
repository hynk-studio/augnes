"use client";

import type { ProjectConstellationLayoutNode } from "@/types/project-constellation-runtime-layout-contract";

type ConstellationNodeProps = {
  node: ProjectConstellationLayoutNode;
  selected?: boolean;
  onSelect?: (nodeRef: string) => void;
};

const markerLabels: Record<string, string> = {
  stale: "stale display warning",
  tension: "tension review aid",
  gap: "gap review aid",
  bridge: "bridge review aid",
  retired: "retired claim visible",
  prior_thesis: "prior thesis visible",
};

export function ConstellationNode({
  node,
  selected = false,
  onSelect,
}: ConstellationNodeProps) {
  const markerHints = node.marker_refs.map((markerRef) => markerLabels[markerRef] ?? markerRef);
  const layerLabel =
    node.layer === "candidate_overlay"
      ? "candidate overlay, not durable graph"
      : node.layer === "durable_graph"
        ? "durable graph layer"
        : `${node.layer} layer`;

  return (
    <div
      className={`constellation-node constellation-node--${node.layer} ${
        selected ? "is-selected" : ""
      }`}
      role={onSelect ? "button" : "group"}
      tabIndex={onSelect ? 0 : undefined}
      aria-pressed={onSelect ? selected : undefined}
      style={{
        left: `${node.position.x}px`,
        top: `${node.position.y}px`,
      }}
      onClick={() => onSelect?.(node.node_ref)}
      onKeyDown={(event) => {
        if (!onSelect) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(node.node_ref);
        }
      }}
      data-node-ref={node.node_ref}
      data-layer={node.layer}
    >
      <span className="constellation-node__kind">{node.node_kind}</span>
      <strong>{node.bounded_label}</strong>
      <small>{layerLabel}</small>
      <p>{node.bounded_summary}</p>
      {markerHints.length > 0 ? (
        <ul aria-label="marker hints">
          {markerHints.map((markerHint) => (
            <li key={markerHint}>{markerHint}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
