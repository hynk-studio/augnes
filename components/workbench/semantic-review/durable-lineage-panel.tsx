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
    >
      <div className={styles.panelHeader}>
        <div className={styles.rowBetween}>
          <p className={styles.kicker}>Read-only proposal projection</p>
          <span className={styles.badge}>{lineage.overall_status}</span>
        </div>
        <h2 id="durable-lineage-title">Durable semantic lineage</h2>
        <p className={styles.copy}>
          Exact persisted relations from this proposal through decision, gate,
          transition and packet compilation. Native-host execution results are
          reviewed through the project-scoped result surface and Inspector. This
          projection grants no semantic authority and performs no write.
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
