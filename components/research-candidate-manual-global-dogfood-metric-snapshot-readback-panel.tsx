import type {
  ResearchCandidateManualGlobalDogfoodMetricSnapshotReadback,
  ResearchCandidateManualGlobalDogfoodMetricSnapshotRecordsByReceipt,
} from "@/types/research-candidate-manual-global-dogfood-metric-snapshot-write";

export function ResearchCandidateManualGlobalDogfoodMetricSnapshotReadbackPanel({
  readback,
  isLoading = false,
  error,
}: {
  readback: ResearchCandidateManualGlobalDogfoodMetricSnapshotReadback | null;
  isLoading?: boolean;
  error?: string | null;
}) {
  return (
    <section
      className="perspective-inspector-section manual-global-dogfood-metric-snapshot-readback"
      aria-label="Manual global dogfood metric snapshot readback"
      data-augnes-authority="manual-metric-snapshot-readback no-global-metrics no-next-work-bias no-perspective no-proof no-work no-memory"
    >
      <div className="perspective-constellation-shell-header">
        <div>
          <p className="panel-eyebrow">AUGNES / Metric Snapshot Readback</p>
          <h4>Manual dogfood metric snapshot readback</h4>
          <p>
            Readback is limited to manual-derived dogfood metric snapshot
            receipts, records, and rollback metadata.
          </p>
        </div>
        <div className="perspective-constellation-shell-status">
          <span className="status-pill">
            {isLoading ? "loading" : readback ? `${readback.count} receipts` : "not loaded"}
          </span>
          <span className="status-pill">global metrics false</span>
          <span className="status-pill">next-work false</span>
        </div>
      </div>

      {error ? (
        <p className="manual-note-runtime-error" role="alert">
          {error}
        </p>
      ) : null}

      {readback ? (
        <>
          <div className="perspective-formation-summary-grid">
            <div>
              <span>latest_active_committed</span>
              <strong>
                {readback.latest_active_committed?.receipt.receipt_id ?? "none"}
              </strong>
              <small>rolled_back and superseded remain context</small>
            </div>
            <div>
              <span>raw_manual_note_text_present</span>
              <strong>{String(readback.raw_manual_note_text_present)}</strong>
              <small>raw_result {String(readback.raw_result_report_text_present)}</small>
            </div>
            <div>
              <span>operator_notes_persisted</span>
              <strong>{String(readback.operator_notes_persisted)}</strong>
              <small>operator notes remain local only</small>
            </div>
            <div>
              <span>non-target writes</span>
              <strong>
                {String(
                  readback.global_dogfood_metrics_written ||
                    readback.next_work_bias_written ||
                    readback.proof_or_evidence_rows_written ||
                    readback.work_or_perspective_rows_written ||
                    readback.perspective_memory_written ||
                    readback.product_write_executed,
                )}
              </strong>
              <small>metrics/next-work/proof/work/Perspective/memory/product</small>
            </div>
          </div>

          <section className="cockpit-surface-card">
            <h5>Receipts</h5>
            <div className="perspective-detail-stack">
              {readback.records_by_receipt.length > 0 ? (
                readback.records_by_receipt.map((recordSet) => (
                  <MetricSnapshotReceiptCard
                    key={recordSet.receipt.receipt_id}
                    recordSet={recordSet}
                  />
                ))
              ) : (
                <p>No manual dogfood metric snapshot receipts have been written.</p>
              )}
            </div>
          </section>

          <section className="cockpit-surface-card">
            <h5>Authority boundary</h5>
            <div className="perspective-workbench-status-row">
              <BoundaryFlag
                label="can_write_dogfood_metric_snapshot_record"
                value={
                  readback.authority_boundary
                    .can_write_dogfood_metric_snapshot_record
                }
              />
              <BoundaryFlag
                label="can_write_dogfood_metric_snapshot_receipt"
                value={
                  readback.authority_boundary
                    .can_write_dogfood_metric_snapshot_receipt
                }
              />
              <BoundaryFlag
                label="can_write_global_dogfood_metrics"
                value={
                  readback.authority_boundary.can_write_global_dogfood_metrics
                }
              />
              <BoundaryFlag
                label="can_write_next_work_bias"
                value={readback.authority_boundary.can_write_next_work_bias}
              />
              <BoundaryFlag
                label="can_write_proof_or_evidence"
                value={readback.authority_boundary.can_write_proof_or_evidence}
              />
              <BoundaryFlag
                label="can_mutate_work"
                value={readback.authority_boundary.can_mutate_work}
              />
              <BoundaryFlag
                label="can_write_perspective_state"
                value={readback.authority_boundary.can_write_perspective_state}
              />
              <BoundaryFlag
                label="can_write_perspective_memory"
                value={readback.authority_boundary.can_write_perspective_memory}
              />
              <BoundaryFlag
                label="can_execute_product_write"
                value={readback.authority_boundary.can_execute_product_write}
              />
            </div>
          </section>
        </>
      ) : (
        <p className="manual-note-runtime-hint">
          No metric snapshot readback has been loaded yet.
        </p>
      )}
    </section>
  );
}

function MetricSnapshotReceiptCard({
  recordSet,
}: {
  recordSet: ResearchCandidateManualGlobalDogfoodMetricSnapshotRecordsByReceipt;
}) {
  const { receipt, metric_snapshot_record: record, rollback } = recordSet;
  return (
    <section className="cockpit-surface-card">
      <h6>{receipt.write_status}</h6>
      <div className="perspective-workbench-status-row">
        <span>
          receipt_id <code>{receipt.receipt_id}</code>
        </span>
        <span>
          idempotency_key <code>{receipt.idempotency_key}</code>
        </span>
        <span>
          supersedes <code>{receipt.supersedes_receipt_id ?? "none"}</code>
        </span>
        <span>
          rollback <code>{rollback?.rollback_id ?? "none"}</code>
        </span>
      </div>
      <dl>
        <dt>source_projection_fingerprint</dt>
        <dd>{receipt.source_projection_fingerprint}</dd>
        <dt>source_global_dogfood_ledger_receipt_id</dt>
        <dd>{receipt.source_global_dogfood_ledger_receipt_id}</dd>
        <dt>source_global_dogfood_ledger_record_id</dt>
        <dd>{receipt.source_global_dogfood_ledger_record_id}</dd>
        <dt>source_manual_receipt_id</dt>
        <dd>{receipt.source_manual_receipt_id}</dd>
        <dt>source_expected_observed_delta_record_ref</dt>
        <dd>{receipt.source_expected_observed_delta_record_ref}</dd>
        <dt>source_reuse_outcome_record_ref</dt>
        <dd>{receipt.source_reuse_outcome_record_ref}</dd>
        <dt>outcome_label</dt>
        <dd>{record?.outcome_label ?? "record missing"}</dd>
        <dt>outcome_signal</dt>
        <dd>{record?.outcome_signal ?? "record missing"}</dd>
        <dt>selected_candidate_context_refs</dt>
        <dd>{record?.selected_candidate_context_refs.length ?? 0}</dd>
        <dt>proposed counters</dt>
        <dd>
          <code>
            {record ? JSON.stringify(record.proposed_metric_counters) : "record missing"}
          </code>
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
