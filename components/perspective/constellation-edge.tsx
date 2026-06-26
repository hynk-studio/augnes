"use client";

import type {
  ProjectConstellationLayoutEdge,
  ProjectConstellationLayoutPosition,
} from "@/types/project-constellation-runtime-layout-contract";

type ConstellationEdgeProps = {
  edge: ProjectConstellationLayoutEdge;
  fromPosition?: ProjectConstellationLayoutPosition | null;
  toPosition?: ProjectConstellationLayoutPosition | null;
  selected?: boolean;
  onSelect?: (edgeRef: string) => void;
};

export function ConstellationEdge({
  edge,
  fromPosition,
  toPosition,
  selected = false,
  onSelect,
}: ConstellationEdgeProps) {
  if (!fromPosition || !toPosition) {
    return (
      <div className="constellation-edge-warning" role="note">
        Missing endpoint warning: edge <code>{edge.edge_ref}</code> references
        bounded endpoint refs that are not present in this visible node set.
        Missing edge endpoints render bounded warnings rather than crashing or
        inventing nodes.
      </div>
    );
  }

  const x1 = fromPosition.x + 50;
  const y1 = fromPosition.y + 24;
  const x2 = toPosition.x + 50;
  const y2 = toPosition.y + 24;

  return (
    <g
      className={`constellation-edge ${selected ? "is-selected" : ""}`}
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(edge.edge_ref)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect?.(edge.edge_ref);
        }
      }}
      data-edge-ref={edge.edge_ref}
    >
      <line x1={x1} y1={y1} x2={x2} y2={y2} />
      <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 4}>
        {edge.edge_kind}
      </text>
      <title>
        {edge.bounded_label}: {edge.bounded_summary}
      </title>
    </g>
  );
}
