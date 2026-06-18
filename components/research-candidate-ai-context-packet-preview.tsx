import type {
  ResearchCandidateAIContextPacket,
  ResearchCandidateAIContextPacketClaimSummary,
  ResearchCandidateAIContextPacketEvidenceSummary,
  ResearchCandidateAIContextPacketFollowUpSummary,
  ResearchCandidateAIContextPacketKnowledgeGapSummary,
  ResearchCandidateAIContextPacketPerspectiveDeltaSummary,
  ResearchCandidateAIContextPacketSourceSummary,
  ResearchCandidateAIContextPacketTensionSummary,
} from "@/types/research-candidate-ai-context-packet";

type ResearchCandidateAIContextPacketPreviewProps = {
  title: string;
  description: string;
  packet: ResearchCandidateAIContextPacket;
  fixturePath: string;
};

export function ResearchCandidateAIContextPacketPreview({
  title,
  description,
  packet,
  fixturePath,
}: ResearchCandidateAIContextPacketPreviewProps) {
  return (
    <section
      className="perspective-inspector-section"
      data-augnes-authority="read-only preview-only candidate-only ai-context-packet"
    >
      <div className="perspective-constellation-shell-header">
        <div>
          <p className="panel-eyebrow">Research Candidate AI Context Packet</p>
          <h3>{title}</h3>
          <p>{description}</p>
          <p>
            AI context packet preview is read-only preview material, not provider
            prompt execution, not Codex execution, not retrieval, not durable
            memory, and not promotion authority.
          </p>
        </div>
        <div className="perspective-constellation-shell-status">
          <span className="status-pill">{packet.source_kind}</span>
          <span className="status-pill">{packet.audience}</span>
          <span className="status-pill">candidate-only</span>
        </div>
      </div>

      <div className="perspective-workbench-status-row">
        <span>
          packet_version <code>{packet.packet_version}</code>
        </span>
        <span>
          fixture path <code>{fixturePath}</code>
        </span>
        <span>
          source overlay fixture{" "}
          <code>{packet.source_overlay.overlay_fixture_path}</code>
        </span>
        <span>
          scope <code>{packet.scope}</code>
        </span>
      </div>

      <div className="perspective-inspector-section">
        <h4>Mission and notice</h4>
        <p>{packet.mission_brief}</p>
        <p>{packet.non_authority_notice}</p>
      </div>

      <div className="perspective-workbench-status-row">
        {Object.entries(packet.authority).map(([key, value]) => (
          <span key={key}>
            {key} <code>{String(value)}</code>
          </span>
        ))}
      </div>

      <div className="tab-stat-row" aria-label={`${title} diagnostics`}>
        <div>
          <span>overlay nodes</span>
          <strong>{packet.diagnostics.source_overlay_node_count}</strong>
        </div>
        <div>
          <span>overlay edges</span>
          <strong>{packet.diagnostics.source_overlay_edge_count}</strong>
        </div>
        <div>
          <span>claims</span>
          <strong>{packet.diagnostics.claim_summary_count}</strong>
        </div>
        <div>
          <span>evidence</span>
          <strong>{packet.diagnostics.evidence_summary_count}</strong>
        </div>
        <div>
          <span>tensions</span>
          <strong>{packet.diagnostics.tension_summary_count}</strong>
        </div>
        <div>
          <span>gaps</span>
          <strong>{packet.diagnostics.knowledge_gap_summary_count}</strong>
        </div>
        <div>
          <span>deltas</span>
          <strong>{packet.diagnostics.perspective_delta_summary_count}</strong>
        </div>
        <div>
          <span>guardrails</span>
          <strong>{packet.diagnostics.final_guardrail_count}</strong>
        </div>
      </div>

      <div className="perspective-formation-summary-grid">
        <div>
          <span>source summaries</span>
          <strong>{packet.diagnostics.source_summary_count}</strong>
          <small>source pointer display material</small>
        </div>
        <div>
          <span>follow-up summaries</span>
          <strong>{packet.diagnostics.follow_up_summary_count}</strong>
          <small>not work items</small>
        </div>
        <div>
          <span>target perspectives</span>
          <strong>{packet.diagnostics.target_perspective_summary_count}</strong>
          <small>read-only anchors</small>
        </div>
        <div>
          <span>unresolved tensions</span>
          <strong>{packet.diagnostics.unresolved_tension_count}</strong>
          <small>preserved for review</small>
        </div>
        <div>
          <span>source ref coverage</span>
          <strong>{packet.diagnostics.source_ref_coverage_ratio}</strong>
          <small>from overlay diagnostics</small>
        </div>
      </div>

      <div className="perspective-constellation-workspace-grid">
        <PacketSummaryList
          title="Source summaries"
          summaries={packet.source_summaries}
        />
        <ClaimSummaryList summaries={packet.claim_summaries} />
        <EvidenceSummaryList summaries={packet.evidence_summaries} />
        <TensionSummaryList summaries={packet.tension_summaries} />
        <KnowledgeGapSummaryList summaries={packet.knowledge_gap_summaries} />
        <PerspectiveDeltaSummaryList summaries={packet.perspective_delta_summaries} />
        <FollowUpSummaryList summaries={packet.follow_up_summaries} />

        <section className="perspective-inspector-section">
          <h4>Target perspective summaries</h4>
          <ul>
            {packet.target_perspective_summaries.map((summary) => (
              <li key={summary.anchor_node_id}>
                <code>{summary.anchor_node_id}</code>{" "}
                <code>{summary.target_perspective_key}</code>
                <small>
                  {" "}
                  delta_node_ids <code>{formatList(summary.delta_node_ids)}</code>
                </small>
                <small> {summary.authority_note}</small>
              </li>
            ))}
          </ul>
        </section>

        <section className="perspective-inspector-section">
          <h4>Final guardrails</h4>
          <ul>
            {packet.final_guardrails.map((guardrail) => (
              <li key={guardrail}>{guardrail}</li>
            ))}
          </ul>
        </section>
      </div>
    </section>
  );
}

function PacketSummaryList({
  title,
  summaries,
}: {
  title: string;
  summaries: ResearchCandidateAIContextPacketSourceSummary[];
}) {
  return (
    <section className="perspective-inspector-section">
      <h4>{title}</h4>
      <ul>
        {summaries.map((summary) => (
          <li key={summary.id}>
            <code>{summary.id}</code> {summary.summary}
            <BaseSummaryMeta summary={summary} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function ClaimSummaryList({
  summaries,
}: {
  summaries: ResearchCandidateAIContextPacketClaimSummary[];
}) {
  return (
    <section className="perspective-inspector-section">
      <h4>Claim summaries</h4>
      <ul>
        {summaries.map((summary) => (
          <li key={summary.id}>
            <code>{summary.id}</code> {summary.summary}
            <StatusMeta summary={summary} />
            <small>
              {" "}
              supporting_evidence_node_ids{" "}
              <code>{formatList(summary.supporting_evidence_node_ids)}</code>
            </small>
            <small>
              {" "}
              contradicting_evidence_node_ids{" "}
              <code>{formatList(summary.contradicting_evidence_node_ids)}</code>
            </small>
            <BaseSummaryMeta summary={summary} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function EvidenceSummaryList({
  summaries,
}: {
  summaries: ResearchCandidateAIContextPacketEvidenceSummary[];
}) {
  return (
    <section className="perspective-inspector-section">
      <h4>Evidence summaries</h4>
      <ul>
        {summaries.map((summary) => (
          <li key={summary.id}>
            <code>{summary.id}</code> {summary.summary}
            <StatusMeta summary={summary} />
            <small>
              {" "}
              evidence_relation_labels{" "}
              <code>{formatList(summary.evidence_relation_labels)}</code>
            </small>
            <small>
              {" "}
              related_claim_node_ids{" "}
              <code>{formatList(summary.related_claim_node_ids)}</code>
            </small>
            <BaseSummaryMeta summary={summary} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function TensionSummaryList({
  summaries,
}: {
  summaries: ResearchCandidateAIContextPacketTensionSummary[];
}) {
  return (
    <section className="perspective-inspector-section">
      <h4>Tension summaries</h4>
      <ul>
        {summaries.map((summary) => (
          <li key={summary.id}>
            <code>{summary.id}</code> {summary.summary}
            <StatusMeta summary={summary} />
            <small>
              {" "}
              related_claim_node_ids{" "}
              <code>{formatList(summary.related_claim_node_ids)}</code>
            </small>
            <small>
              {" "}
              related_evidence_node_ids{" "}
              <code>{formatList(summary.related_evidence_node_ids)}</code>
            </small>
            <small>
              {" "}
              preserved_by_delta_node_ids{" "}
              <code>{formatList(summary.preserved_by_delta_node_ids)}</code>
            </small>
            <BaseSummaryMeta summary={summary} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function KnowledgeGapSummaryList({
  summaries,
}: {
  summaries: ResearchCandidateAIContextPacketKnowledgeGapSummary[];
}) {
  return (
    <section className="perspective-inspector-section">
      <h4>Knowledge gap summaries</h4>
      <ul>
        {summaries.map((summary) => (
          <li key={summary.id}>
            <code>{summary.id}</code> {summary.summary}
            <StatusMeta summary={summary} />
            <small>
              {" "}
              related_claim_node_ids{" "}
              <code>{formatList(summary.related_claim_node_ids)}</code>
            </small>
            <small>
              {" "}
              related_tension_node_ids{" "}
              <code>{formatList(summary.related_tension_node_ids)}</code>
            </small>
            <small>
              {" "}
              tracked_by_delta_node_ids{" "}
              <code>{formatList(summary.tracked_by_delta_node_ids)}</code>
            </small>
            <BaseSummaryMeta summary={summary} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function PerspectiveDeltaSummaryList({
  summaries,
}: {
  summaries: ResearchCandidateAIContextPacketPerspectiveDeltaSummary[];
}) {
  return (
    <section className="perspective-inspector-section">
      <h4>Perspective delta summaries</h4>
      <ul>
        {summaries.map((summary) => (
          <li key={summary.id}>
            <code>{summary.id}</code> {summary.summary}
            <StatusMeta summary={summary} />
            <small>
              {" "}
              target_perspective_key <code>{summary.target_perspective_key}</code>
            </small>
            <small>
              {" "}
              basis_claim_node_ids{" "}
              <code>{formatList(summary.basis_claim_node_ids)}</code>
            </small>
            <small>
              {" "}
              basis_evidence_node_ids{" "}
              <code>{formatList(summary.basis_evidence_node_ids)}</code>
            </small>
            <small>
              {" "}
              related_tension_node_ids{" "}
              <code>{formatList(summary.related_tension_node_ids)}</code>
            </small>
            <small>
              {" "}
              related_gap_node_ids{" "}
              <code>{formatList(summary.related_gap_node_ids)}</code>
            </small>
            <BaseSummaryMeta summary={summary} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function FollowUpSummaryList({
  summaries,
}: {
  summaries: ResearchCandidateAIContextPacketFollowUpSummary[];
}) {
  return (
    <section className="perspective-inspector-section">
      <h4>Follow-up summaries</h4>
      <ul>
        {summaries.map((summary) => (
          <li key={summary.id}>
            <code>{summary.id}</code> {summary.summary}
            <StatusMeta summary={summary} />
            <small>
              {" "}
              derived_from_session_node_ids{" "}
              <code>{formatList(summary.derived_from_session_node_ids)}</code>
            </small>
            <small>
              {" "}
              derived_from_source_node_ids{" "}
              <code>{formatList(summary.derived_from_source_node_ids)}</code>
            </small>
            <small>
              {" "}
              is_work_item <code>{String(summary.is_work_item)}</code>
            </small>
            <BaseSummaryMeta summary={summary} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function StatusMeta({
  summary,
}: {
  summary: {
    review_status?: string;
    epistemic_status?: string;
  };
}) {
  return (
    <small>
      {" "}
      review_status <code>{summary.review_status ?? "none"}</code>{" "}
      epistemic_status <code>{summary.epistemic_status ?? "none"}</code>
    </small>
  );
}

function BaseSummaryMeta({
  summary,
}: {
  summary: {
    node_id: string;
    source_refs: string[];
    related_node_ids: string[];
    authority_note: string;
  };
}) {
  return (
    <>
      <small>
        {" "}
        node_id <code>{summary.node_id}</code>
      </small>
      <small>
        {" "}
        source_refs <code>{formatList(summary.source_refs)}</code>
      </small>
      <small>
        {" "}
        related_node_ids <code>{formatList(summary.related_node_ids)}</code>
      </small>
      <small> {summary.authority_note}</small>
    </>
  );
}

function formatList(values: string[]) {
  return values.join(", ") || "none";
}
