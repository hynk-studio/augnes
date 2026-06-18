import type {
  ResearchCandidateFormationReceipt,
  ResearchCandidateFormationReceiptEdgeContribution,
  ResearchCandidateFormationReceiptNodeContribution,
  ResearchCandidateFormationReceiptPacketSectionContribution,
  ResearchCandidateFormationReceiptSourceRefContribution,
} from "@/types/research-candidate-formation-receipt";

type ResearchCandidateFormationReceiptPreviewProps = {
  title: string;
  description: string;
  receipt: ResearchCandidateFormationReceipt;
  fixturePath: string;
};

export function ResearchCandidateFormationReceiptPreview({
  title,
  description,
  receipt,
  fixturePath,
}: ResearchCandidateFormationReceiptPreviewProps) {
  return (
    <section
      className="perspective-inspector-section"
      data-augnes-authority="read-only preview-only candidate-only formation-receipt"
    >
      <div className="perspective-constellation-shell-header">
        <div>
          <p className="panel-eyebrow">Research Candidate Formation Receipt</p>
          <h3>{title}</h3>
          <p>{description}</p>
          <p>
            Formation Receipt preview is read-only preview material, not durable
            receipt storage, not an event log, not proof/evidence, not a work
            item, and not promotion authority.
          </p>
        </div>
        <div className="perspective-constellation-shell-status">
          <span className="status-pill">{receipt.source_kind}</span>
          <span className="status-pill">{receipt.artifact.artifact_kind}</span>
          <span className="status-pill">candidate-only</span>
        </div>
      </div>

      <div className="perspective-workbench-status-row">
        <span>
          receipt_version <code>{receipt.receipt_version}</code>
        </span>
        <span>
          fixture path <code>{fixturePath}</code>
        </span>
        <span>
          source packet fixture{" "}
          <code>{receipt.source_packet_fixture_path}</code>
        </span>
        <span>
          source overlay fixture{" "}
          <code>{receipt.source_overlay_fixture_path}</code>
        </span>
      </div>

      <section className="perspective-inspector-section">
        <h4>Artifact</h4>
        <p>
          <code>{receipt.artifact.artifact_id}</code>{" "}
          {receipt.artifact.title}
        </p>
        <p>{receipt.artifact.summary}</p>
        <p>{receipt.non_authority_notice}</p>
      </section>

      <div className="perspective-workbench-status-row">
        {Object.entries(receipt.authority).map(([key, value]) => (
          <span key={key}>
            {key} <code>{String(value)}</code>
          </span>
        ))}
      </div>

      <div className="tab-stat-row" aria-label={`${title} diagnostics`}>
        <div>
          <span>source refs</span>
          <strong>{receipt.diagnostics.source_ref_contribution_count}</strong>
        </div>
        <div>
          <span>candidate nodes</span>
          <strong>{receipt.diagnostics.candidate_node_contribution_count}</strong>
        </div>
        <div>
          <span>typed edges</span>
          <strong>{receipt.diagnostics.typed_edge_contribution_count}</strong>
        </div>
        <div>
          <span>packet sections</span>
          <strong>{receipt.diagnostics.packet_section_contribution_count}</strong>
        </div>
        <div>
          <span>guardrails</span>
          <strong>{receipt.diagnostics.guardrail_contribution_count}</strong>
        </div>
        <div>
          <span>unresolved tensions</span>
          <strong>{receipt.diagnostics.unresolved_tension_count}</strong>
        </div>
        <div>
          <span>knowledge gaps</span>
          <strong>{receipt.diagnostics.knowledge_gap_count}</strong>
        </div>
        <div>
          <span>perspective deltas</span>
          <strong>{receipt.diagnostics.perspective_delta_count}</strong>
        </div>
      </div>

      <div className="perspective-constellation-workspace-grid">
        <SourceRefContributionList contributions={receipt.source_refs} />
        <CandidateNodeContributionList contributions={receipt.candidate_nodes} />
        <TypedEdgeContributionList contributions={receipt.typed_edges} />
        <PacketSectionContributionList contributions={receipt.packet_sections} />

        <section className="perspective-inspector-section">
          <h4>Guardrail contributions</h4>
          <ul>
            {receipt.guardrails.map((guardrail) => (
              <li key={guardrail.guardrail_id}>
                <code>{guardrail.guardrail_id}</code> {guardrail.text}
                <small>
                  {" "}
                  contributed_to_sections{" "}
                  <code>{formatList(guardrail.contributed_to_sections)}</code>
                </small>
                <small> {guardrail.authority_note}</small>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </section>
  );
}

function SourceRefContributionList({
  contributions,
}: {
  contributions: ResearchCandidateFormationReceiptSourceRefContribution[];
}) {
  return (
    <section className="perspective-inspector-section">
      <h4>Source ref contributions</h4>
      <ul>
        {contributions.map((contribution) => (
          <li key={contribution.source_ref_id}>
            <code>{contribution.source_ref_id}</code>{" "}
            {contribution.contribution_kind}
            <small>
              {" "}
              contributed_to_sections{" "}
              <code>{formatList(contribution.contributed_to_sections)}</code>
            </small>
            <small> {contribution.authority_note}</small>
          </li>
        ))}
      </ul>
    </section>
  );
}

function CandidateNodeContributionList({
  contributions,
}: {
  contributions: ResearchCandidateFormationReceiptNodeContribution[];
}) {
  return (
    <section className="perspective-inspector-section">
      <h4>Candidate node contributions</h4>
      <ul>
        {contributions.map((contribution) => (
          <li key={contribution.node_id}>
            <code>{contribution.node_id}</code> {contribution.node_kind}
            <small>
              {" "}
              source_object_id <code>{contribution.source_object_id}</code>
            </small>
            <small>
              {" "}
              review_status <code>{contribution.review_status ?? "none"}</code>{" "}
              epistemic_status{" "}
              <code>{contribution.epistemic_status ?? "none"}</code>
            </small>
            <small>
              {" "}
              contributed_to_sections{" "}
              <code>{formatList(contribution.contributed_to_sections)}</code>
            </small>
            <small> {contribution.authority_note}</small>
          </li>
        ))}
      </ul>
    </section>
  );
}

function TypedEdgeContributionList({
  contributions,
}: {
  contributions: ResearchCandidateFormationReceiptEdgeContribution[];
}) {
  return (
    <section className="perspective-inspector-section">
      <h4>Typed edge contributions</h4>
      <ul>
        {contributions.map((contribution) => (
          <li key={contribution.edge_id}>
            <code>{contribution.edge_id}</code> {contribution.relation}
            <small>
              {" "}
              source_node_id <code>{contribution.source_node_id}</code>
            </small>
            <small>
              {" "}
              target_node_id <code>{contribution.target_node_id}</code>
            </small>
            <small>
              {" "}
              contributed_to_sections{" "}
              <code>{formatList(contribution.contributed_to_sections)}</code>
            </small>
            <small> {contribution.authority_note}</small>
          </li>
        ))}
      </ul>
    </section>
  );
}

function PacketSectionContributionList({
  contributions,
}: {
  contributions: ResearchCandidateFormationReceiptPacketSectionContribution[];
}) {
  return (
    <section className="perspective-inspector-section">
      <h4>Packet section contributions</h4>
      <ul>
        {contributions.map((contribution) => (
          <li key={contribution.section_id}>
            <code>{contribution.section_id}</code> {contribution.section_kind}
            <small>
              {" "}
              item_count <code>{contribution.item_count}</code>
            </small>
            <small>
              {" "}
              related_node_ids <code>{formatList(contribution.related_node_ids)}</code>
            </small>
            <small>
              {" "}
              related_source_refs{" "}
              <code>{formatList(contribution.related_source_refs)}</code>
            </small>
            <small> {contribution.authority_note}</small>
          </li>
        ))}
      </ul>
    </section>
  );
}

function formatList(values: string[]) {
  return values.join(", ") || "none";
}
