import type {
  ResearchCandidateManualGlobalDogfoodLedgerWorkbenchProjection,
  ResearchCandidateManualGlobalDogfoodNextWorkSignalCard,
} from "@/types/research-candidate-manual-global-dogfood-ledger-workbench-projection";
import { ResearchCandidateManualGlobalDogfoodMetricSnapshotContractPanel } from "@/components/research-candidate-manual-global-dogfood-metric-snapshot-contract-panel";
import { ResearchCandidateManualGlobalDogfoodNextWorkSignalContractPanel } from "@/components/research-candidate-manual-global-dogfood-next-work-signal-contract-panel";

export function ResearchCandidateManualGlobalDogfoodLedgerWorkbenchProjectionPanel({
  projection,
}: {
  projection: ResearchCandidateManualGlobalDogfoodLedgerWorkbenchProjection;
}) {
  return (
    <section
      className="perspective-inspector-section manual-global-dogfood-workbench-projection"
      aria-label="Manual global dogfood ledger workbench projection"
      data-augnes-authority="read-only manual-global-dogfood-workbench-projection no-metrics no-next-work-bias no-proof no-work no-perspective no-memory"
    >
      <div className="perspective-constellation-shell-header">
        <div>
          <p className="panel-eyebrow">AUGNES / Workbench Projection</p>
          <h4>Manual ledger loop-spine projection</h4>
          <p>
            This projection does not write dogfood metrics, next-work bias,
            Perspective, proof/evidence, work status, memory, or product state.
          </p>
        </div>
        <div className="perspective-constellation-shell-status">
          <span className="status-pill">{projection.projection_readiness}</span>
          <span className="status-pill">read_only true</span>
          <span className="status-pill">metrics false</span>
        </div>
      </div>

      <div className="perspective-formation-summary-grid">
        <div>
          <span>latest_active_committed_receipt_id</span>
          <strong>
            {projection.latest_active_committed_receipt_id ?? "none"}
          </strong>
          <small>{projection.source_receipt_ids.length} source receipts</small>
        </div>
        <div>
          <span>projection_fingerprint</span>
          <strong>{projection.projection_fingerprint}</strong>
          <small>{projection.source_readback_ref}</small>
        </div>
        <div>
          <span>context_only_count</span>
          <strong>
            {projection.ledger_status_summary.context_only_count}
          </strong>
          <small>
            rolled_back {projection.ledger_status_summary.rolled_back_count} /
            superseded {projection.ledger_status_summary.superseded_count}
          </small>
        </div>
        <div>
          <span>next_work_signal_candidates</span>
          <strong>{projection.next_work_signal_candidates.length}</strong>
          <small>all write flags false</small>
        </div>
      </div>

      <section className="cockpit-surface-card">
        <h5>Ledger status summary</h5>
        <div className="perspective-workbench-status-row">
          <span>
            total <code>{projection.ledger_status_summary.total_receipts}</code>
          </span>
          <span>
            committed{" "}
            <code>{projection.ledger_status_summary.committed_count}</code>
          </span>
          <span>
            active committed{" "}
            <code>{projection.ledger_status_summary.active_committed_count}</code>
          </span>
          <span>
            rolled_back{" "}
            <code>{projection.ledger_status_summary.rolled_back_count}</code>
          </span>
          <span>
            superseded{" "}
            <code>{projection.ledger_status_summary.superseded_count}</code>
          </span>
        </div>
      </section>

      <section className="cockpit-surface-card">
        <h5>Latest ledger record summary</h5>
        <dl>
          <dt>source_manual_receipt_id</dt>
          <dd>
            {projection.latest_ledger_record_summary.source_manual_receipt_id ??
              "none"}
          </dd>
          <dt>source_contract_fingerprint</dt>
          <dd>
            {projection.latest_ledger_record_summary
              .source_contract_fingerprint ?? "none"}
          </dd>
          <dt>source_authorization_review_fingerprint</dt>
          <dd>
            {projection.latest_ledger_record_summary
              .source_authorization_review_fingerprint ?? "none"}
          </dd>
          <dt>source_handoff_seed_fingerprint</dt>
          <dd>
            {projection.latest_ledger_record_summary
              .source_handoff_seed_fingerprint ?? "none"}
          </dd>
          <dt>source_result_text_fingerprint</dt>
          <dd>
            {projection.latest_ledger_record_summary
              .source_result_text_fingerprint ?? "none"}
          </dd>
          <dt>source_expected_observed_delta_record_ref</dt>
          <dd>
            {projection.latest_ledger_record_summary
              .source_expected_observed_delta_record_ref ?? "none"}
          </dd>
          <dt>source_reuse_outcome_record_ref</dt>
          <dd>
            {projection.latest_ledger_record_summary
              .source_reuse_outcome_record_ref ?? "none"}
          </dd>
          <dt>outcome_label</dt>
          <dd>
            {projection.latest_ledger_record_summary.outcome_label ?? "none"}
          </dd>
          <dt>selected_candidate_context_ref_count</dt>
          <dd>
            {
              projection.latest_ledger_record_summary
                .selected_candidate_context_ref_count
            }
          </dd>
          <dt>source_line</dt>
          <dd>
            {projection.latest_ledger_record_summary.source_line ?? "none"}
          </dd>
        </dl>
      </section>

      <section className="cockpit-surface-card">
        <h5>Outcome signal summary</h5>
        <div className="perspective-workbench-status-row">
          <span>
            helpful{" "}
            <code>
              {projection.outcome_signal_summary.outcome_label_counts.helpful}
            </code>
          </span>
          <span>
            stale{" "}
            <code>
              {projection.outcome_signal_summary.outcome_label_counts.stale}
            </code>
          </span>
          <span>
            missing{" "}
            <code>
              {projection.outcome_signal_summary.outcome_label_counts.missing}
            </code>
          </span>
          <span>
            noisy{" "}
            <code>
              {projection.outcome_signal_summary.outcome_label_counts.noisy}
            </code>
          </span>
          <span>
            misleading{" "}
            <code>
              {
                projection.outcome_signal_summary.outcome_label_counts
                  .misleading
              }
            </code>
          </span>
          <span>
            signal{" "}
            <code>{projection.outcome_signal_summary.latest_outcome_signal}</code>
          </span>
          <span>
            no_salience_update{" "}
            <code>{String(projection.outcome_signal_summary.no_salience_update)}</code>
          </span>
          <span>
            no_metric_write{" "}
            <code>{String(projection.outcome_signal_summary.no_metric_write)}</code>
          </span>
        </div>
      </section>

      <section className="cockpit-surface-card">
        <h5>Expected/observed signal summary</h5>
        <dl>
          <dt>expected_summary</dt>
          <dd>
            {projection.expected_observed_signal_summary.expected_summary ??
              "none"}
          </dd>
          <dt>observed_summary</dt>
          <dd>
            {projection.expected_observed_signal_summary.observed_summary ??
              "none"}
          </dd>
          <dt>mismatch_or_gap_summary</dt>
          <dd>
            {projection.expected_observed_signal_summary
              .mismatch_or_gap_summary ?? "none"}
          </dd>
          <dt>mismatch_or_gap_implies_follow_up</dt>
          <dd>
            {String(
              projection.expected_observed_signal_summary
                .mismatch_or_gap_implies_follow_up,
            )}
          </dd>
          <dt>no_perspective_promotion</dt>
          <dd>
            {String(
              projection.expected_observed_signal_summary
                .no_perspective_promotion,
            )}
          </dd>
          <dt>no_proof_or_evidence</dt>
          <dd>
            {String(
              projection.expected_observed_signal_summary.no_proof_or_evidence,
            )}
          </dd>
        </dl>
      </section>

      <section className="cockpit-surface-card">
        <h5>Next-work signal candidates</h5>
        <div className="perspective-detail-stack">
          {projection.next_work_signal_candidates.length > 0 ? (
            projection.next_work_signal_candidates.map((card) => (
              <ProjectionCandidateCard card={card} key={card.card_id} />
            ))
          ) : (
            <p>No candidate cards are available.</p>
          )}
        </div>
      </section>

      <section className="cockpit-surface-card">
        <h5>Dogfood loop spine alignment</h5>
        <div className="perspective-workbench-status-row">
          <BoundaryFlag
            label="workbench_loop_spine_read_model"
            value={
              projection.dogfood_loop_spine_alignment
                .can_feed_workbench_dogfood_loop_spine_overview_read_model
            }
          />
          <BoundaryFlag
            label="metric_snapshot_preview_read_model"
            value={
              projection.dogfood_loop_spine_alignment
                .can_feed_dogfood_metric_snapshot_preview_read_model
            }
          />
          <BoundaryFlag
            label="next_work_signal_decision_preview_read_model"
            value={
              projection.dogfood_loop_spine_alignment
                .can_feed_next_work_signal_decision_preview_read_model
            }
          />
        </div>
        <p>{projection.dogfood_loop_spine_alignment.read_only_alignment_note}</p>
      </section>

      <section className="cockpit-surface-card">
        <h5>Blockers and future authorization</h5>
        <ListOrFallback
          items={projection.blocked_reasons}
          fallback="No projection blockers."
        />
        <ListOrFallback
          items={projection.warning_reasons}
          fallback="No projection warnings."
        />
        <ListOrFallback
          items={projection.required_future_authorization}
          fallback="No future authorization listed."
        />
      </section>

      <section className="cockpit-surface-card">
        <h5>Authority boundary</h5>
        <div className="perspective-workbench-status-row">
          <BoundaryFlag
            label="read_only"
            value={projection.authority_boundary.read_only}
          />
          <BoundaryFlag
            label="preview_only"
            value={projection.authority_boundary.preview_only}
          />
          <BoundaryFlag
            label="can_write_dogfood_metrics"
            value={projection.authority_boundary.can_write_dogfood_metrics}
          />
          <BoundaryFlag
            label="can_write_dogfood_ledger"
            value={projection.authority_boundary.can_write_dogfood_ledger}
          />
          <BoundaryFlag
            label="can_write_next_work_bias"
            value={projection.authority_boundary.can_write_next_work_bias}
          />
          <BoundaryFlag
            label="can_write_perspective_state"
            value={projection.authority_boundary.can_write_perspective_state}
          />
          <BoundaryFlag
            label="can_write_perspective_memory"
            value={projection.authority_boundary.can_write_perspective_memory}
          />
          <BoundaryFlag
            label="can_write_proof_or_evidence"
            value={projection.authority_boundary.can_write_proof_or_evidence}
          />
          <BoundaryFlag
            label="can_mutate_work"
            value={projection.authority_boundary.can_mutate_work}
          />
          <BoundaryFlag
            label="can_execute_product_write"
            value={projection.authority_boundary.can_execute_product_write}
          />
        </div>
      </section>

      <ResearchCandidateManualGlobalDogfoodMetricSnapshotContractPanel
        projection={projection}
      />
      <ResearchCandidateManualGlobalDogfoodNextWorkSignalContractPanel
        projection={projection}
      />
    </section>
  );
}

function ProjectionCandidateCard({
  card,
}: {
  card: ResearchCandidateManualGlobalDogfoodNextWorkSignalCard;
}) {
  return (
    <section className="cockpit-surface-card">
      <h6>{card.card_kind}</h6>
      <div className="perspective-workbench-status-row">
        <span>
          status <code>{card.card_status}</code>
        </span>
        <span>
          receipt <code>{card.source_receipt_id ?? "none"}</code>
        </span>
        <span>
          record <code>{card.source_record_id ?? "none"}</code>
        </span>
        <span>
          would_write_next_work_bias{" "}
          <code>{String(card.would_write_next_work_bias)}</code>
        </span>
        <span>
          would_write_perspective{" "}
          <code>{String(card.would_write_perspective)}</code>
        </span>
        <span>
          would_write_metrics <code>{String(card.would_write_metrics)}</code>
        </span>
      </div>
      <p>{card.recommended_next_work_label}</p>
      <p>{card.rationale}</p>
      <dl>
        <dt>source_contract_fingerprint</dt>
        <dd>{card.source_fingerprints.source_contract_fingerprint ?? "none"}</dd>
        <dt>source_authorization_review_fingerprint</dt>
        <dd>
          {card.source_fingerprints
            .source_authorization_review_fingerprint ?? "none"}
        </dd>
        <dt>source_handoff_seed_fingerprint</dt>
        <dd>
          {card.source_fingerprints.source_handoff_seed_fingerprint ?? "none"}
        </dd>
        <dt>source_result_text_fingerprint</dt>
        <dd>
          {card.source_fingerprints.source_result_text_fingerprint ?? "none"}
        </dd>
      </dl>
    </section>
  );
}

function BoundaryFlag({ label, value }: { label: string; value: boolean }) {
  return (
    <span>
      {label} <code>{String(value)}</code>
    </span>
  );
}

function ListOrFallback({
  items,
  fallback,
}: {
  items: string[];
  fallback: string;
}) {
  if (items.length === 0) {
    return <p>{fallback}</p>;
  }

  return (
    <ul>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
