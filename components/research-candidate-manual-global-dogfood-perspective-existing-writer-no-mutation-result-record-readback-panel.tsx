"use client";

import type { ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordReadback } from "@/types/research-candidate-manual-global-dogfood-perspective-existing-writer-no-mutation-result-record";

export function ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordReadbackPanel({
  readback = null,
  sourceReviewFingerprint = null,
}: {
  readback?: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordReadback | null;
  sourceReviewFingerprint?: string | null;
}) {
  const selectedRecord = readback?.selected_record ?? null;
  const selectionStatus =
    readback?.selection_status ??
    (sourceReviewFingerprint
      ? "source_entrypoint_review_fingerprint_not_found"
      : "no_records");
  const rowSummary = selectedRecord?.row_count_write_summary ?? null;

  return (
    <section
      className="perspective-inspector-section manual-global-dogfood-perspective-existing-writer-no-mutation-result-record-readback"
      aria-label="Manual global dogfood Perspective existing writer no-mutation result record readback"
      data-augnes-authority="readback-only passive no-existing-writer-call no-current-working-perspective no-existing-canonical-state no-promotion no-memory no-work no-proof no-metrics no-provider no-github no-codex no-retrieval"
    >
      <div className="perspective-constellation-shell-header">
        <div>
          <p className="panel-eyebrow">
            AUGNES / Existing Writer Result Record
          </p>
          <h4>No-mutation result record readback</h4>
          <p>
            This passive readback surface displays the durable result record
            selected for the accepted no-mutation entrypoint review without
            exposing a write control or invoking an existing writer.
          </p>
        </div>
        <div className="perspective-constellation-shell-status">
          <span className="status-pill">{selectionStatus}</span>
          <span className="status-pill">
            records {readback?.records.length ?? 0}
          </span>
          <span className="status-pill">
            invalid {readback?.invalid_record_count ?? 0}
          </span>
        </div>
      </div>

      <div className="perspective-formation-summary-grid">
        <div>
          <span>source_review_fingerprint</span>
          <strong>
            {selectedRecord?.source_entrypoint_review_fingerprint ??
              sourceReviewFingerprint ??
              "missing"}
          </strong>
          <small>filter {readback?.source_entrypoint_review_fingerprint_filter ?? "none"}</small>
        </div>
        <div>
          <span>record_id</span>
          <strong>{selectedRecord?.record_id ?? "not_selected"}</strong>
          <small>{selectedRecord?.record_fingerprint ?? "missing"}</small>
        </div>
        <div>
          <span>target write</span>
          <strong>
            {rowSummary
              ? `${rowSummary.target_delta} row`
              : "not_recorded"}
          </strong>
          <small>
            {rowSummary?.target_table_name ??
              "research_candidate_manual_global_dogfood_perspective_existing_writer_no_mutation_result_records"}
          </small>
        </div>
        <div>
          <span>non-target tables</span>
          <strong>
            {rowSummary
              ? `${rowSummary.non_target_changed_table_count}/${rowSummary.non_target_table_count} changed`
              : "not_recorded"}
          </strong>
          <small>
            unchanged{" "}
            {String(rowSummary?.all_non_target_row_counts_unchanged ?? false)}
          </small>
        </div>
      </div>

      {selectedRecord ? (
        <>
          <div className="perspective-constellation-workspace-grid">
            <section className="cockpit-surface-card">
              <h5>Source fingerprints</h5>
              <dl>
                <dt>source_entrypoint_fingerprint</dt>
                <dd>{selectedRecord.source_entrypoint_fingerprint}</dd>
                <dt>source_contract_fingerprint</dt>
                <dd>{selectedRecord.source_contract_fingerprint}</dd>
                <dt>source_review_fingerprint</dt>
                <dd>{selectedRecord.source_review_fingerprint}</dd>
                <dt>source_dry_run_result_fingerprint</dt>
                <dd>{selectedRecord.source_dry_run_result_fingerprint}</dd>
              </dl>
            </section>
            <section className="cockpit-surface-card">
              <h5>Boundary</h5>
              <div className="perspective-workbench-status-row">
                <BoundaryFlag
                  label="can_write_no_mutation_result_record"
                  value={
                    selectedRecord.result_record_write_boundary
                      .can_write_no_mutation_result_record
                  }
                />
                <BoundaryFlag
                  label="existing_writer_called"
                  value={readback?.existing_writer_called ?? false}
                />
                <BoundaryFlag
                  label="raw_material_persisted"
                  value={readback?.raw_material_persisted ?? false}
                />
                <BoundaryFlag
                  label="proof_or_evidence_written"
                  value={readback?.proof_or_evidence_written ?? false}
                />
              </div>
            </section>
          </div>

          <section className="cockpit-surface-card">
            <h5>Target and non-target row-count proof</h5>
            <dl>
              {rowSummary?.rows.map((row) => (
                <RowCountDefinition key={row.table_name} row={row} />
              ))}
            </dl>
          </section>
        </>
      ) : (
        <section className="cockpit-surface-card">
          <h5>Readback status</h5>
          <p>No durable no-mutation result record is selected.</p>
        </section>
      )}
    </section>
  );
}

function RowCountDefinition({
  row,
}: {
  row: NonNullable<
    ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordReadback["selected_record"]
  >["row_count_write_summary"]["rows"][number];
}) {
  return (
    <>
      <dt>{row.table_name}</dt>
      <dd>
        before {row.before_count}, after {row.after_count}, delta {row.delta},
        changed {String(row.changed)}
      </dd>
    </>
  );
}

function BoundaryFlag({ label, value }: { label: string; value: boolean }) {
  return (
    <span>
      {label} <code>{String(value)}</code>
    </span>
  );
}
