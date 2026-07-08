"use client";

import type {
  ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityReadback,
  ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityRecordsByReceipt,
} from "@/types/research-candidate-manual-global-dogfood-perspective-writer-compatibility-write";
import { ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunContractPanel } from "@/components/research-candidate-manual-global-dogfood-perspective-existing-writer-dry-run-contract-panel";

export function ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityReadbackPanel({
  readback,
  isLoading = false,
  error,
}: {
  readback: ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityReadback | null;
  isLoading?: boolean;
  error?: string | null;
}) {
  return (
    <section
      className="perspective-inspector-section manual-global-dogfood-perspective-state-application-readback"
      aria-label="Manual global dogfood Perspective writer compatibility readback"
      data-augnes-authority="manual-perspective-state-application-readback no-current-working-perspective no-existing-canonical-state no-promotion no-memory no-work no-proof no-metrics"
    >
      <div className="perspective-constellation-shell-header">
        <div>
          <p className="panel-eyebrow">AUGNES / Perspective Writer Compatibility Readback</p>
          <h4>Manual Perspective writer compatibility record readback</h4>
          <p>
            Readback is limited to manual-derived Perspective writer compatibility receipts,
            writer_compatibility records, and rollback metadata. It does not update
            current-working Perspective, mutate existing canonical Perspective
            state tables, promote Perspective, write Perspective Memory, mutate
            work, write proof/evidence, dogfood metrics, product state, or
            source records.
          </p>
        </div>
        <div className="perspective-constellation-shell-status">
          <span className="status-pill">
            {isLoading ? "loading" : readback ? `${readback.count} receipts` : "not loaded"}
          </span>
          <span className="status-pill">manual-specific storage</span>
          <span className="status-pill">work false</span>
          <span className="status-pill">existing canonical state false</span>
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
              <span>storage_path</span>
              <strong>{readback.storage_path}</strong>
              <small>source refs preserved in manual Perspective writer compatibility tables</small>
            </div>
            <div>
              <span>latest_active_committed</span>
              <strong>
                {readback.latest_active_committed?.receipt.receipt_id ?? "none"}
              </strong>
              <small>rolled_back and superseded remain context</small>
            </div>
            <div>
              <span>operator_notes_persisted</span>
              <strong>{String(readback.operator_notes_persisted)}</strong>
              <small>raw_text {String(readback.raw_manual_note_text_present)}</small>
            </div>
            <div>
              <span>non-target writes</span>
              <strong>
                {String(
                  readback.work_mutated ||
                    readback.canonical_perspective_state_written ||
                    readback.existing_canonical_perspective_state_table_mutated ||
                    readback.current_working_perspective_updated ||
                    readback.perspective_promoted ||
                    readback.perspective_memory_written ||
                    readback.dogfood_metrics_written ||
                    readback.proof_or_evidence_rows_written ||
                    readback.product_write_executed,
                )}
              </strong>
              <small>work/canonical Perspective/metrics/proof/memory/product</small>
            </div>
          </div>

          <section className="cockpit-surface-card">
            <h5>Receipts</h5>
            <div className="perspective-detail-stack">
              {readback.records_by_receipt.length > 0 ? (
                readback.records_by_receipt.map((recordSet) => (
                  <PerspectiveWriterCompatibilityReceiptCard
                    key={recordSet.receipt.receipt_id}
                    recordSet={recordSet}
                  />
                ))
              ) : (
                <p>No manual Perspective writer compatibility receipts have been written.</p>
              )}
            </div>
          </section>

          <section className="cockpit-surface-card">
            <h5>Authority boundary</h5>
            <div className="perspective-workbench-status-row">
              <BoundaryFlag
                label="can_write_perspective_writer_compatibility_record"
                value={readback.authority_boundary.can_write_perspective_writer_compatibility_record}
              />
              <BoundaryFlag
                label="can_write_perspective_writer_compatibility_receipt"
                value={readback.authority_boundary.can_write_perspective_writer_compatibility_receipt}
              />
              <BoundaryFlag
                label="can_write_perspective_writer_compatibility_rollback_metadata"
                value={
                  readback.authority_boundary
                    .can_write_perspective_writer_compatibility_rollback_metadata
                }
              />
              <BoundaryFlag
                label="can_update_current_working_perspective"
                value={
                  readback.authority_boundary
                    .can_update_current_working_perspective
                }
              />
              <BoundaryFlag
                label="can_write_existing_canonical_perspective_state"
                value={
                  readback.authority_boundary
                    .can_write_existing_canonical_perspective_state
                }
              />
              <BoundaryFlag
                label="can_mutate_existing_canonical_perspective_state"
                value={
                  readback.authority_boundary
                    .can_mutate_existing_canonical_perspective_state
                }
              />
              <BoundaryFlag
                label="can_promote_perspective"
                value={readback.authority_boundary.can_promote_perspective}
              />
              <BoundaryFlag
                label="can_write_perspective_memory"
                value={readback.authority_boundary.can_write_perspective_memory}
              />
              <BoundaryFlag
                label="can_mutate_perspective_adapter_record"
                value={
                  readback.authority_boundary
                    .can_mutate_perspective_adapter_record
                }
              />
              <BoundaryFlag
                label="can_mutate_perspective_state_mutation_record"
                value={
                  readback.authority_boundary
                    .can_mutate_perspective_state_mutation_record
                }
              />
              <BoundaryFlag
                label="can_write_work_item"
                value={readback.authority_boundary.can_write_work_item}
              />
              <BoundaryFlag
                label="can_mutate_work"
                value={readback.authority_boundary.can_mutate_work}
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
                label="can_execute_product_write"
                value={readback.authority_boundary.can_execute_product_write}
              />
            </div>
          </section>

          <ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunContractPanel
            readback={readback}
          />
        </>
      ) : (
        <p className="manual-note-runtime-hint">
          No Perspective writer compatibility readback has been loaded yet.
        </p>
      )}
    </section>
  );
}

function PerspectiveWriterCompatibilityReceiptCard({
  recordSet,
}: {
  recordSet: ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityRecordsByReceipt;
}) {
  const { receipt, perspective_writer_compatibility_record: record, rollback } = recordSet;
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
        <dt>source_perspective_writer_compatibility_contract_fingerprint</dt>
        <dd>{receipt.source_perspective_writer_compatibility_contract_fingerprint}</dd>
        <dt>source_perspective_writer_compatibility_review_fingerprint</dt>
        <dd>{receipt.source_perspective_writer_compatibility_review_fingerprint}</dd>
        <dt>source_perspective_adapter_receipt_id</dt>
        <dd>{receipt.source_perspective_adapter_receipt_id}</dd>
        <dt>source_perspective_adapter_record_id</dt>
        <dd>{receipt.source_perspective_adapter_record_id}</dd>
        <dt>source_perspective_adapter_record_fingerprint</dt>
        <dd>{receipt.source_perspective_adapter_record_fingerprint}</dd>
        <dt>source_perspective_state_mutation_receipt_id</dt>
        <dd>{receipt.source_perspective_state_mutation_receipt_id}</dd>
        <dt>source_perspective_state_mutation_record_id</dt>
        <dd>{receipt.source_perspective_state_mutation_record_id}</dd>
        <dt>source_perspective_state_mutation_record_fingerprint</dt>
        <dd>{receipt.source_perspective_state_mutation_record_fingerprint}</dd>
        <dt>source_perspective_apply_receipt_id</dt>
        <dd>{receipt.source_perspective_apply_receipt_id}</dd>
        <dt>source_perspective_apply_record_id</dt>
        <dd>{receipt.source_perspective_apply_record_id}</dd>
        <dt>source_perspective_apply_record_fingerprint</dt>
        <dd>{receipt.source_perspective_apply_record_fingerprint}</dd>
        <dt>source_canonical_perspective_update_receipt_id</dt>
        <dd>{receipt.source_canonical_perspective_update_receipt_id}</dd>
        <dt>source_canonical_perspective_update_record_id</dt>
        <dd>{receipt.source_canonical_perspective_update_record_id}</dd>
        <dt>source_canonical_perspective_update_record_fingerprint</dt>
        <dd>{receipt.source_canonical_perspective_update_record_fingerprint}</dd>
        <dt>source_perspective_relay_receipt_id</dt>
        <dd>{receipt.source_perspective_relay_receipt_id}</dd>
        <dt>source_next_work_signal_receipt_id</dt>
        <dd>{receipt.source_next_work_signal_receipt_id}</dd>
        <dt>source_next_work_bias_receipt_id</dt>
        <dd>{receipt.source_next_work_bias_receipt_id}</dd>
        <dt>source_projection_fingerprint</dt>
        <dd>{receipt.source_projection_fingerprint}</dd>
        <dt>source_global_dogfood_ledger_receipt_id</dt>
        <dd>{receipt.source_global_dogfood_ledger_receipt_id}</dd>
        <dt>source_metric_snapshot_receipt_id</dt>
        <dd>{receipt.source_metric_snapshot_receipt_id}</dd>
        <dt>source_manual_receipt_id</dt>
        <dd>{receipt.source_manual_receipt_id}</dd>
        <dt>source_handoff_seed_fingerprint</dt>
        <dd>{receipt.source_handoff_seed_fingerprint}</dd>
        <dt>source_result_text_fingerprint</dt>
        <dd>{receipt.source_result_text_fingerprint}</dd>
        <dt>source_expected_observed_delta_record_ref</dt>
        <dd>{receipt.source_expected_observed_delta_record_ref}</dd>
        <dt>source_reuse_outcome_record_ref</dt>
        <dd>{receipt.source_reuse_outcome_record_ref}</dd>
        <dt>writer_compatibility_label</dt>
        <dd>{record?.writer_compatibility_label ?? "record missing"}</dd>
        <dt>writer_compatibility_rationale</dt>
        <dd>{record?.writer_compatibility_rationale ?? "record missing"}</dd>
        <dt>adapter_label</dt>
        <dd>{record?.adapter_label ?? "record missing"}</dd>
        <dt>adapter_rationale</dt>
        <dd>{record?.adapter_rationale ?? "record missing"}</dd>
        <dt>mutation_label</dt>
        <dd>{record?.mutation_label ?? "record missing"}</dd>
        <dt>apply_label</dt>
        <dd>{record?.apply_label ?? "record missing"}</dd>
        <dt>canonical_update_label</dt>
        <dd>{record?.canonical_update_label ?? "record missing"}</dd>
        <dt>relay_update_label</dt>
        <dd>{record?.relay_update_label ?? "record missing"}</dd>
        <dt>intended_future_writer_target</dt>
        <dd>{record?.intended_future_writer_target ?? "record missing"}</dd>
        <dt>default_future_writer_target</dt>
        <dd>{record?.default_future_writer_target ?? "record missing"}</dd>
        <dt>writer_compatibility_scope_hint</dt>
        <dd>{record?.writer_compatibility_scope_hint ?? "record missing"}</dd>
        <dt>expected_future_write_scope</dt>
        <dd>{record?.expected_future_write_scope ?? "record missing"}</dd>
        <dt>recommended_storage_path</dt>
        <dd>{record?.recommended_storage_path ?? "record missing"}</dd>
        <dt>manual_only_context_refs</dt>
        <dd>{record?.manual_only_context_refs.length ?? 0}</dd>
        <dt>source_next_work_candidate_card_ids</dt>
        <dd>{record?.source_next_work_candidate_card_ids.length ?? 0}</dd>
        <dt>selected_candidate_context_refs</dt>
        <dd>{record?.selected_candidate_context_refs.length ?? 0}</dd>
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
