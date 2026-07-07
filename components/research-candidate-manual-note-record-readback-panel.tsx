"use client";

import { ResearchCandidateManualResultDogfoodBridgePreviewPanel } from "@/components/research-candidate-manual-result-dogfood-bridge-preview-panel";
import type {
  ResearchCandidateManualResultReadback,
  ResearchCandidateManualResultRecordsByReceipt,
} from "@/types/research-candidate-manual-result-authorized-record-write";

export function ResearchCandidateManualNoteRecordReadbackPanel({
  readback,
}: {
  readback: ResearchCandidateManualResultReadback | null;
}) {
  if (!readback) return null;

  return (
    <section className="perspective-inspector-section manual-note-authorized-record-readback">
      <div className="perspective-constellation-shell-header">
        <div>
          <p className="panel-eyebrow">AUGNES / Authorized Record Readback</p>
          <h3>Manual result records readback</h3>
          <p>
            Readback for the authorized manual ExpectedObservedDelta and Reuse
            Outcome records. Raw manual note and raw result report text are not
            included.
          </p>
        </div>
        <div className="perspective-constellation-shell-status">
          <span className="status-pill">records {readback.count}</span>
          <span className="status-pill">raw text absent</span>
          <span className="status-pill">no proof/evidence</span>
        </div>
      </div>

      <div className="perspective-workbench-status-row">
        <span>
          raw_manual_note_text_present{" "}
          <code>{String(readback.raw_manual_note_text_present)}</code>
        </span>
        <span>
          raw_result_report_text_present{" "}
          <code>{String(readback.raw_result_report_text_present)}</code>
        </span>
        <span>
          proof_or_evidence_rows_written{" "}
          <code>{String(readback.proof_or_evidence_rows_written)}</code>
        </span>
        <span>
          work_or_perspective_rows_written{" "}
          <code>{String(readback.work_or_perspective_rows_written)}</code>
        </span>
      </div>

      <div className="perspective-detail-stack">
        {readback.records_by_receipt.map((recordSet) => (
          <ReadbackRecordSet
            key={recordSet.receipt.receipt_id}
            recordSet={recordSet}
          />
        ))}
        {readback.records_by_receipt.length === 0 ? (
          <p>No manual result records have been written yet.</p>
        ) : null}
      </div>

      <ResearchCandidateManualResultDogfoodBridgePreviewPanel readback={readback} />
    </section>
  );
}

function ReadbackRecordSet({
  recordSet,
}: {
  recordSet: ResearchCandidateManualResultRecordsByReceipt;
}) {
  return (
    <section className="cockpit-surface-card">
      <h4>{recordSet.receipt.receipt_id}</h4>
      <div className="perspective-workbench-status-row">
        <span>
          status <code>{recordSet.receipt.write_status}</code>
        </span>
        <span>
          duplicate_key <code>{recordSet.receipt.idempotency_key}</code>
        </span>
        <span>
          superseded <code>{String(recordSet.superseded)}</code>
        </span>
        <span>
          rolled_back <code>{String(recordSet.rolled_back)}</code>
        </span>
      </div>

      <div className="perspective-constellation-workspace-grid">
        <section className="cockpit-surface-card">
          <h5>ExpectedObservedDelta record</h5>
          {recordSet.expected_observed_delta_record ? (
            <dl>
              <dt>record_id</dt>
              <dd>{recordSet.expected_observed_delta_record.record_id}</dd>
              <dt>expected_summary</dt>
              <dd>{recordSet.expected_observed_delta_record.expected_summary}</dd>
              <dt>observed_summary</dt>
              <dd>
                {recordSet.expected_observed_delta_record.observed_summary ??
                  "not reported"}
              </dd>
              <dt>source_refs</dt>
              <dd>{recordSet.expected_observed_delta_record.source_refs.length}</dd>
            </dl>
          ) : (
            <p>No ExpectedObservedDelta record found for this receipt.</p>
          )}
        </section>

        <section className="cockpit-surface-card">
          <h5>Reuse Outcome record</h5>
          {recordSet.reuse_outcome_record ? (
            <dl>
              <dt>record_id</dt>
              <dd>{recordSet.reuse_outcome_record.record_id}</dd>
              <dt>outcome_label</dt>
              <dd>{recordSet.reuse_outcome_record.outcome_label}</dd>
              <dt>writes_ledger</dt>
              <dd>{String(recordSet.reuse_outcome_record.writes_ledger)}</dd>
              <dt>selected_candidate_context_refs</dt>
              <dd>
                {
                  recordSet.reuse_outcome_record
                    .selected_candidate_context_refs.length
                }
              </dd>
            </dl>
          ) : (
            <p>No Reuse Outcome record found for this receipt.</p>
          )}
        </section>

        <section className="cockpit-surface-card">
          <h5>Rollback metadata</h5>
          {recordSet.rollback ? (
            <dl>
              <dt>rollback_id</dt>
              <dd>{recordSet.rollback.rollback_id}</dd>
              <dt>rollback_reason</dt>
              <dd>{recordSet.rollback.rollback_reason}</dd>
            </dl>
          ) : (
            <p>No rollback metadata recorded.</p>
          )}
        </section>
      </div>
    </section>
  );
}
