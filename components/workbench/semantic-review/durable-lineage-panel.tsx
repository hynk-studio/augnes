import type {
  VNextOperatorPilotProposalDurableLineageChainV01,
  VNextOperatorPilotProposalDurableLineageV01,
} from "@/lib/vnext/runtime/operator-pilot-workbench-lineage";

import styles from "./semantic-review.module.css";

export function DurableLineagePanel({
  lineage,
}: {
  lineage: VNextOperatorPilotProposalDurableLineageV01;
}) {
  const latest = lineage.chains.at(-1) ?? null;

  return (
    <section
      className={styles.panel}
      aria-labelledby="durable-lineage-title"
      data-vnext-durable-lineage="v0.1"
      data-vnext-lineage-status={lineage.overall_status}
      data-vnext-lineage-packet-id={
        latest?.compiled_packet?.packet_id ?? "none"
      }
      data-vnext-lineage-later-result-id={
        latest?.later_result?.receipt_id ?? "none"
      }
      data-vnext-lineage-context-review-id={
        latest?.context_use_review?.review_id ?? "none"
      }
    >
      <div className={styles.panelHeader}>
        <div className={styles.rowBetween}>
          <p className={styles.kicker}>Read-only proposal projection</p>
          <span className={styles.badge}>{lineage.overall_status}</span>
        </div>
        <h2 id="durable-lineage-title">Durable semantic lineage</h2>
        <p className={styles.copy}>
          Exact persisted relations from this proposal through decision, gate,
          transition, packet compilation, later-result intake, and context-use
          review. This projection grants no semantic authority and performs no
          write.
        </p>
      </div>

      {lineage.chains.length === 0 ? (
        <div className={styles.twoColumnGrid}>
          <PendingStage
            title="ReviewDecision"
            message="No applied ReviewDecision lineage"
          />
          <PendingStage
            title="StateTransitionReceipt"
            message="Transition not applied"
          />
          <PendingStage
            title="compiled TaskContextPacket"
            message="Packet not compiled"
          />
          <PendingStage
            title="later-result RunReceipt"
            message="Later result not recorded"
          />
          <PendingStage
            title="ContextUseReview"
            message="Context use not reviewed"
          />
        </div>
      ) : (
        <ol className={styles.plainList}>
          {lineage.chains.map((chain) => (
            <li
              key={`${chain.transition.receipt_id}:${chain.transition.receipt_fingerprint}`}
              data-vnext-lineage-chain-status={chain.stage_status}
            >
              <div className={styles.rowBetween}>
                <strong>Persisted transition chain</strong>
                <span className={styles.badge}>{chain.stage_status}</span>
              </div>
              <div className={styles.twoColumnGrid}>
                <DecisionStage chain={chain} />
                <GateStage chain={chain} />
                <TransitionStage chain={chain} />
                <PacketStage chain={chain} />
                <LaterResultStage chain={chain} />
                <ContextReviewStage chain={chain} />
              </div>
            </li>
          ))}
        </ol>
      )}

      <dl className={styles.statusGrid}>
        <DataPoint label="Workspace" value={lineage.workspace_id} />
        <DataPoint label="Project" value={lineage.project_id} />
        <DataPoint label="Read only" value={String(lineage.read_only)} />
        <DataPoint
          label="Semantic authority granted"
          value={String(lineage.semantic_authority_granted)}
        />
      </dl>
    </section>
  );
}

function DecisionStage({
  chain,
}: {
  chain: VNextOperatorPilotProposalDurableLineageChainV01;
}) {
  return (
    <LineageStage title="ReviewDecision">
      <ExactValue label="Decision ID" value={chain.transition.decision_id} />
      <ExactValue
        label="Decision fingerprint"
        value={chain.transition.decision_fingerprint}
      />
      <ExactValue label="Candidate ID" value={chain.transition.candidate_id} />
      <ExactValue
        label="Candidate fingerprint"
        value={chain.transition.candidate_fingerprint}
      />
    </LineageStage>
  );
}

function GateStage({
  chain,
}: {
  chain: VNextOperatorPilotProposalDurableLineageChainV01;
}) {
  return (
    <LineageStage title="semantic gate">
      <ExactValue label="Gate ID" value={chain.semantic_gate.gate_id} />
      <ExactValue
        label="Gate fingerprint"
        value={chain.semantic_gate.gate_fingerprint}
      />
      <ExactValue label="Status" value={chain.semantic_gate.status} />
      <ExactValue label="Confirmed" value={chain.semantic_gate.confirmed_at} />
      <ExactValue label="Expires" value={chain.semantic_gate.expires_at} />
    </LineageStage>
  );
}

function TransitionStage({
  chain,
}: {
  chain: VNextOperatorPilotProposalDurableLineageChainV01;
}) {
  return (
    <LineageStage title="StateTransitionReceipt">
      <ExactValue label="Receipt ID" value={chain.transition.receipt_id} />
      <ExactValue
        label="Receipt fingerprint"
        value={chain.transition.receipt_fingerprint}
      />
      <ExactValue label="Applied" value={chain.transition.applied_at} />
      <ExactValue label="Recorded" value={chain.transition.recorded_at} />
    </LineageStage>
  );
}

function PacketStage({
  chain,
}: {
  chain: VNextOperatorPilotProposalDurableLineageChainV01;
}) {
  const packet = chain.compiled_packet;
  if (!packet) {
    return (
      <PendingStage
        title="compiled TaskContextPacket"
        message="Packet not compiled"
      />
    );
  }
  return (
    <LineageStage title="compiled TaskContextPacket">
      <ExactValue label="Packet ID" value={packet.packet_id} />
      <ExactValue
        label="Packet fingerprint"
        value={packet.packet_fingerprint}
      />
      <ExactValue label="Generated" value={packet.generated_at} />
      <ExactValue label="Expires" value={packet.expires_at ?? "none"} />
      <ExactValue label="Currentness" value={packet.currentness} />
      <ExactValue
        label="Projection current"
        value={String(packet.projection_current)}
      />
      <a className={styles.linkButton} href={packet.handoff_href}>
        Open exact packet handoff
      </a>
    </LineageStage>
  );
}

function LaterResultStage({
  chain,
}: {
  chain: VNextOperatorPilotProposalDurableLineageChainV01;
}) {
  const result = chain.later_result;
  if (!result) {
    return (
      <PendingStage
        title="later-result RunReceipt"
        message="Later result not recorded"
      />
    );
  }
  return (
    <LineageStage title="later-result RunReceipt">
      <ExactValue label="Receipt ID" value={result.receipt_id} />
      <ExactValue
        label="Receipt fingerprint"
        value={result.receipt_fingerprint}
      />
      <ExactValue label="Run ID" value={result.run_id} />
      <ExactValue label="Recorded" value={result.recorded_at} />
      <ExactValue
        label="Reported packet payload use"
        value={result.reported_payload_use}
      />
      <ExactValue
        label="Cited accepted-state count"
        value={result.cited_selected_state_count}
      />
      <ExactValue
        label="Actual-use review required"
        value={String(result.actual_use_review_required)}
      />
      <ExactValue
        label="Helpfulness established"
        value={String(result.helpfulness_established)}
      />
    </LineageStage>
  );
}

function ContextReviewStage({
  chain,
}: {
  chain: VNextOperatorPilotProposalDurableLineageChainV01;
}) {
  const review = chain.context_use_review;
  if (!review) {
    return (
      <PendingStage
        title="ContextUseReview"
        message="Context use not reviewed"
      />
    );
  }
  return (
    <LineageStage title="ContextUseReview">
      <ExactValue label="Review ID" value={review.review_id} />
      <ExactValue
        label="Review fingerprint"
        value={review.review_fingerprint}
      />
      <ExactValue label="Reviewed" value={review.reviewed_at} />
      <ExactValue label="Actually used" value={review.actually_used} />
      <ExactValue label="Assessment" value={review.assessment} />
      <ExactValue label="Correction count" value={review.correction_count} />
    </LineageStage>
  );
}

function PendingStage({ title, message }: { title: string; message: string }) {
  return (
    <LineageStage title={title}>
      <p className={styles.empty}>{message}</p>
    </LineageStage>
  );
}

function LineageStage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.materialCard} aria-label={title}>
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function ExactValue({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className={styles.exactValue}>
      <strong>{label}</strong>
      <span className={styles.identifier}>{value}</span>
    </div>
  );
}

function DataPoint({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
