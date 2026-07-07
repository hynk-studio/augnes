import type {
  ResearchCandidateManualGlobalDogfoodLedgerReadback,
  ResearchCandidateManualGlobalDogfoodLedgerRecordsByReceipt,
} from "@/types/research-candidate-manual-global-dogfood-ledger-write";

export function ResearchCandidateManualGlobalDogfoodLedgerReadbackPanel({
  readback,
  isLoading = false,
  error,
}: {
  readback: ResearchCandidateManualGlobalDogfoodLedgerReadback | null;
  isLoading?: boolean;
  error?: string | null;
}) {
  return (
    <section
      className="perspective-inspector-section manual-global-dogfood-ledger-readback"
      aria-label="Manual global dogfood ledger readback"
      data-augnes-authority="readback-only manual-global-dogfood-ledger no-metrics no-proof no-work no-perspective no-memory"
    >
      <div className="perspective-constellation-shell-header">
        <div>
          <p className="panel-eyebrow">AUGNES / Global Dogfood Readback</p>
          <h4>Manual bridge ledger readback</h4>
          <p>
            Readback is limited to manual-to-global dogfood ledger integration
            receipts, records, and rollback metadata.
          </p>
        </div>
        <div className="perspective-constellation-shell-status">
          <span className="status-pill">
            {isLoading ? "loading" : readback ? `${readback.count} receipts` : "not loaded"}
          </span>
          <span className="status-pill">metrics false</span>
          <span className="status-pill">raw text false</span>
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
              <small>local review notes only</small>
            </div>
            <div>
              <span>non-target writes</span>
              <strong>
                {String(
                  readback.dogfood_metrics_written ||
                    readback.proof_or_evidence_rows_written ||
                    readback.work_or_perspective_rows_written ||
                    readback.perspective_memory_written ||
                    readback.product_write_executed,
                )}
              </strong>
              <small>metrics/proof/work/Perspective/memory/product</small>
            </div>
          </div>

          <section className="cockpit-surface-card">
            <h5>Receipts</h5>
            <div className="perspective-detail-stack">
              {readback.records_by_receipt.length > 0 ? (
                readback.records_by_receipt.map((recordSet) => (
                  <LedgerReceiptCard
                    key={recordSet.receipt.receipt_id}
                    recordSet={recordSet}
                  />
                ))
              ) : (
                <p>No manual global dogfood ledger receipts have been written.</p>
              )}
            </div>
          </section>

          <section className="cockpit-surface-card">
            <h5>Authority boundary</h5>
            <div className="perspective-workbench-status-row">
              <BoundaryFlag
                label="can_write_manual_global_dogfood_ledger_receipt"
                value={
                  readback.authority_boundary
                    .can_write_manual_global_dogfood_ledger_receipt
                }
              />
              <BoundaryFlag
                label="can_write_manual_global_dogfood_ledger_record"
                value={
                  readback.authority_boundary
                    .can_write_manual_global_dogfood_ledger_record
                }
              />
              <BoundaryFlag
                label="can_write_manual_global_dogfood_rollback_metadata"
                value={
                  readback.authority_boundary
                    .can_write_manual_global_dogfood_rollback_metadata
                }
              />
              <BoundaryFlag
                label="can_write_dogfood_metrics"
                value={readback.authority_boundary.can_write_dogfood_metrics}
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
          No readback has been loaded yet.
        </p>
      )}
    </section>
  );
}

function LedgerReceiptCard({
  recordSet,
}: {
  recordSet: ResearchCandidateManualGlobalDogfoodLedgerRecordsByReceipt;
}) {
  const { receipt, ledger_record: ledgerRecord, rollback } = recordSet;
  return (
    <section className="cockpit-surface-card">
      <h6>{receipt.ledger_write_status}</h6>
      <div className="perspective-workbench-status-row">
        <span>
          receipt_id <code>{receipt.receipt_id}</code>
        </span>
        <span>
          duplicate_key <code>{receipt.idempotency_key}</code>
        </span>
        <span>
          supersedes <code>{receipt.supersedes_receipt_id ?? "none"}</code>
        </span>
        <span>
          rollback <code>{rollback?.rollback_id ?? "none"}</code>
        </span>
      </div>
      <dl>
        <dt>source_manual_receipt_id</dt>
        <dd>{receipt.source_manual_receipt_id}</dd>
        <dt>source_expected_observed_delta_record_ref</dt>
        <dd>{receipt.source_expected_observed_delta_record_ref}</dd>
        <dt>source_reuse_outcome_record_ref</dt>
        <dd>{receipt.source_reuse_outcome_record_ref}</dd>
        <dt>source_handoff_seed_fingerprint</dt>
        <dd>{receipt.source_handoff_seed_fingerprint}</dd>
        <dt>source_result_text_fingerprint</dt>
        <dd>{receipt.source_result_text_fingerprint}</dd>
        <dt>outcome_label</dt>
        <dd>{ledgerRecord?.outcome_label ?? "record missing"}</dd>
        <dt>expected_summary</dt>
        <dd>{ledgerRecord?.expected_summary ?? "record missing"}</dd>
        <dt>observed_summary</dt>
        <dd>{ledgerRecord?.observed_summary ?? "none"}</dd>
        <dt>mismatch_or_gap_summary</dt>
        <dd>{ledgerRecord?.mismatch_or_gap_summary ?? "record missing"}</dd>
        <dt>manual_only_context_refs</dt>
        <dd>{ledgerRecord?.manual_only_context_refs.length ?? 0}</dd>
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
