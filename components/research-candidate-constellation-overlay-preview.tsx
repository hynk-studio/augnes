import type {
  ResearchCandidateConstellationEdge,
  ResearchCandidateConstellationNode,
  ResearchCandidateConstellationOverlay,
} from "@/types/research-candidate-constellation-overlay";

type ResearchCandidateConstellationOverlayPreviewProps = {
  title: string;
  description: string;
  overlay: ResearchCandidateConstellationOverlay;
  fixturePath: string;
};

export function ResearchCandidateConstellationOverlayPreview({
  title,
  description,
  overlay,
  fixturePath,
}: ResearchCandidateConstellationOverlayPreviewProps) {
  const nodesByKind = groupBy(overlay.nodes, (node) => node.kind);
  const edgesByRelation = groupBy(overlay.edges, (edge) => edge.relation);
  const targetPerspectiveAnchors = overlay.nodes.filter(
    (node) => node.kind === "target_perspective_anchor",
  );

  return (
    <section
      className="perspective-inspector-section"
      data-augnes-authority="read-only candidate-only non-authoritative overlay-preview"
    >
      <div className="perspective-constellation-shell-header">
        <div>
          <p className="panel-eyebrow">Candidate Constellation Overlay</p>
          <h3>{title}</h3>
          <p>{description}</p>
          <p>
            Candidate constellation overlay is read-only preview material, not graph DB,
            not layout, not promotion authority.
          </p>
        </div>
        <div className="perspective-constellation-shell-status">
          <span className="status-pill">{overlay.source_kind}</span>
          <span className="status-pill">read-only</span>
          <span className="status-pill">candidate-only</span>
        </div>
      </div>

      <div className="perspective-workbench-status-row">
        <span>
          overlay_version <code>{overlay.overlay_version}</code>
        </span>
        <span>
          fixture path <code>{fixturePath}</code>
        </span>
        <span>
          source_fixture_path <code>{overlay.source_fixture_path}</code>
        </span>
        <span>
          scope <code>{overlay.scope}</code>
        </span>
      </div>

      <div className="perspective-workbench-status-row">
        {Object.entries(overlay.authority).map(([key, value]) => (
          <span key={key}>
            {key} <code>{String(value)}</code>
          </span>
        ))}
      </div>

      <div className="tab-stat-row" aria-label={`${title} diagnostics`}>
        <div>
          <span>nodes</span>
          <strong>{overlay.diagnostics.node_count}</strong>
        </div>
        <div>
          <span>edges</span>
          <strong>{overlay.diagnostics.edge_count}</strong>
        </div>
        <div>
          <span>claims</span>
          <strong>{overlay.diagnostics.claim_node_count}</strong>
        </div>
        <div>
          <span>evidence</span>
          <strong>{overlay.diagnostics.evidence_node_count}</strong>
        </div>
        <div>
          <span>tensions</span>
          <strong>{overlay.diagnostics.tension_node_count}</strong>
        </div>
        <div>
          <span>gaps</span>
          <strong>{overlay.diagnostics.knowledge_gap_node_count}</strong>
        </div>
        <div>
          <span>deltas</span>
          <strong>{overlay.diagnostics.perspective_delta_node_count}</strong>
        </div>
        <div>
          <span>anchors</span>
          <strong>{overlay.diagnostics.target_perspective_anchor_count}</strong>
        </div>
      </div>

      <div className="perspective-formation-summary-grid">
        <div>
          <span>source references</span>
          <strong>{overlay.diagnostics.source_reference_node_count}</strong>
          <small>read-only source pointer nodes</small>
        </div>
        <div>
          <span>unresolved tensions</span>
          <strong>{overlay.diagnostics.unresolved_tension_count}</strong>
          <small>blocks_or_qualifies_promotion true</small>
        </div>
        <div>
          <span>promotion ready deltas</span>
          <strong>{overlay.diagnostics.promotion_ready_count}</strong>
          <small>still candidate-only</small>
        </div>
        <div>
          <span>blocked or not ready deltas</span>
          <strong>{overlay.diagnostics.blocked_or_not_ready_delta_count}</strong>
          <small>not promotion authority</small>
        </div>
        <div>
          <span>source ref coverage</span>
          <strong>{overlay.diagnostics.source_ref_coverage_ratio}</strong>
          <small>grounded candidate nodes</small>
        </div>
      </div>

      <div className="perspective-inspector-section">
        <h4>Target perspective anchors</h4>
        {targetPerspectiveAnchors.length === 0 ? (
          <p>No target_perspective_key anchors in this overlay.</p>
        ) : (
          <ul>
            {targetPerspectiveAnchors.map((node) => (
              <li key={node.id}>
                <code>{node.id}</code> target_perspective_key{" "}
                <code>{node.target_perspective_key}</code> read-only and
                non-authoritative
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="perspective-constellation-workspace-grid">
        <section className="perspective-inspector-section">
          <h4>Nodes by kind</h4>
          {Object.entries(nodesByKind).map(([kind, nodes]) => (
            <div key={kind} className="cockpit-surface-card">
              <div className="meta-row">
                <span>
                  kind <code>{kind}</code>
                </span>
                <span>
                  count <code>{nodes.length}</code>
                </span>
              </div>
              <ul>
                {nodes.map((node) => (
                  <li key={node.id}>
                    <code>{node.id}</code> {node.label}
                    <small>
                      {" "}
                      source_family <code>{node.source_family}</code>{" "}
                      source_object_id <code>{node.source_object_id}</code>
                    </small>
                    <small>
                      {" "}
                      review_status <code>{node.review_status ?? "none"}</code>{" "}
                      epistemic_status{" "}
                      <code>{node.epistemic_status ?? "none"}</code>
                    </small>
                    <small>
                      {" "}
                      source_refs{" "}
                      <code>
                        {formatOverlaySourceRefs(node.source_refs)}
                      </code>
                    </small>
                    {node.target_perspective_key ? (
                      <small>
                        {" "}
                        target_perspective_key{" "}
                        <code>{node.target_perspective_key}</code>
                      </small>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section className="perspective-inspector-section">
          <h4>Typed edges by relation</h4>
          {Object.entries(edgesByRelation).map(([relation, edges]) => (
            <div key={relation} className="cockpit-surface-card">
              <div className="meta-row">
                <span>
                  relation <code>{relation}</code>
                </span>
                <span>
                  count <code>{edges.length}</code>
                </span>
              </div>
              <ul>
                {edges.map((edge) => (
                  <li key={edge.id}>
                    <code>{edge.id}</code>
                    <small>
                      {" "}
                      {edge.source_node_id} -&gt; {edge.target_node_id}
                    </small>
                    <small>
                      {" "}
                      label <code>{edge.label}</code> source_object_id{" "}
                      <code>{edge.source_object_id}</code>
                    </small>
                    <small>
                      {" "}
                      source_refs{" "}
                      <code>
                        {formatOverlaySourceRefs(edge.source_refs)}
                      </code>
                    </small>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      </div>
    </section>
  );
}

function groupBy<T>(
  items: T[],
  getKey: (item: T) => string,
): Record<string, T[]> {
  return items.reduce<Record<string, T[]>>((groups, item) => {
    const key = getKey(item);
    groups[key] = groups[key] ?? [];
    groups[key].push(item);
    return groups;
  }, {});
}

function formatOverlaySourceRefs(
  sourceRefs:
    | ResearchCandidateConstellationNode["source_refs"]
    | ResearchCandidateConstellationEdge["source_refs"],
) {
  return sourceRefs.map((sourceRef) => sourceRef.source_ref_id).join(", ") || "none";
}
