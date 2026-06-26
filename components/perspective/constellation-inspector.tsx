import type {
  ProjectConstellationLayoutDiagnostic,
  ProjectConstellationLayoutEdge,
  ProjectConstellationLayoutNode,
  ProjectConstellationRuntimeLayoutContract,
} from "@/types/project-constellation-runtime-layout-contract";

type ConstellationInspectorProps = {
  selectedNode?: ProjectConstellationLayoutNode | null;
  selectedEdge?: ProjectConstellationLayoutEdge | null;
  layout?: ProjectConstellationRuntimeLayoutContract | null;
  diagnostics?: ProjectConstellationLayoutDiagnostic[];
};

export function ConstellationInspector({
  selectedNode,
  selectedEdge,
  layout,
  diagnostics = [],
}: ConstellationInspectorProps) {
  const selectedLabel =
    selectedNode?.bounded_label ?? selectedEdge?.bounded_label ?? "No selection";

  return (
    <aside className="constellation-inspector" aria-label="Constellation inspector">
      <p className="panel-eyebrow">Inspector is read-only</p>
      <h3>{selectedLabel}</h3>
      <p>Source refs are lineage pointers, not proof</p>
      <p>Markers are review aids</p>

      {selectedNode ? <NodeDetails node={selectedNode} /> : null}
      {selectedEdge ? <EdgeDetails edge={selectedEdge} /> : null}
      {layout ? <LayoutDetails layout={layout} /> : null}
      <DiagnosticsDetails diagnostics={diagnostics} />
      {layout ? <AuthorityBoundaryDetails layout={layout} /> : null}
    </aside>
  );
}

function NodeDetails({ node }: { node: ProjectConstellationLayoutNode }) {
  return (
    <section>
      <h4>Selected node</h4>
      <dl>
        <dt>Node ref</dt>
        <dd>
          <code>{node.node_ref}</code>
        </dd>
        <dt>Layer</dt>
        <dd>{node.layer}</dd>
        <dt>Source refs</dt>
        <dd>{formatList(node.source_refs)}</dd>
        <dt>Candidate refs</dt>
        <dd>{formatList(node.candidate_refs)}</dd>
        <dt>Review records</dt>
        <dd>{formatList(node.review_record_refs)}</dd>
        <dt>Promotion decisions</dt>
        <dd>{formatList(node.promotion_decision_refs)}</dd>
        <dt>Formation Receipts</dt>
        <dd>{formatList(node.formation_receipt_refs)}</dd>
        <dt>Apply events</dt>
        <dd>{formatList(node.apply_event_refs)}</dd>
        <dt>Feedback refs</dt>
        <dd>{formatList(node.feedback_refs)}</dd>
        <dt>Reason codes</dt>
        <dd>{formatList(node.reason_codes)}</dd>
      </dl>
    </section>
  );
}

function EdgeDetails({ edge }: { edge: ProjectConstellationLayoutEdge }) {
  return (
    <section>
      <h4>Selected edge</h4>
      <dl>
        <dt>Edge ref</dt>
        <dd>
          <code>{edge.edge_ref}</code>
        </dd>
        <dt>Kind</dt>
        <dd>{edge.edge_kind}</dd>
        <dt>From</dt>
        <dd>{edge.from_node_ref}</dd>
        <dt>To</dt>
        <dd>{edge.to_node_ref}</dd>
        <dt>Source refs</dt>
        <dd>{formatList(edge.source_refs)}</dd>
        <dt>Reason codes</dt>
        <dd>{formatList(edge.reason_codes)}</dd>
      </dl>
    </section>
  );
}

function LayoutDetails({ layout }: { layout: ProjectConstellationRuntimeLayoutContract }) {
  return (
    <section>
      <h4>Layout</h4>
      <dl>
        <dt>Layout id</dt>
        <dd>
          <code>{layout.layout_id}</code>
        </dd>
        <dt>Perspective</dt>
        <dd>{layout.perspective_id}</dd>
        <dt>Seed</dt>
        <dd>{layout.layout_seed}</dd>
        <dt>Fingerprint</dt>
        <dd>{layout.layout_fingerprint}</dd>
      </dl>
    </section>
  );
}

function DiagnosticsDetails({
  diagnostics,
}: {
  diagnostics: ProjectConstellationLayoutDiagnostic[];
}) {
  return (
    <section>
      <h4>Read-only diagnostics</h4>
      <ul>
        {diagnostics.map((diagnostic) => (
          <li key={diagnostic.diagnostic_id}>
            <strong>{diagnostic.diagnostic_kind}</strong>
            <p>{diagnostic.bounded_summary}</p>
            <small>{formatList(diagnostic.reason_codes)}</small>
          </li>
        ))}
      </ul>
    </section>
  );
}

function AuthorityBoundaryDetails({
  layout,
}: {
  layout: ProjectConstellationRuntimeLayoutContract;
}) {
  return (
    <section>
      <h4>Authority boundary</h4>
      <dl>
        {Object.entries(layout.authority_boundary).map(([key, value]) => (
          <div key={key}>
            <dt>{key}</dt>
            <dd>{String(value)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function formatList(values: readonly string[]) {
  return values.length > 0 ? values.join(", ") : "none";
}
