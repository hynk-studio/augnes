"use client";

import { buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReview } from "@/lib/research-candidate-review/manual-global-dogfood-perspective-existing-writer-no-mutation-entrypoint-review";
import { ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReviewPanel } from "@/components/research-candidate-manual-global-dogfood-perspective-existing-writer-no-mutation-entrypoint-review-panel";
import { ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordReadbackPanel } from "@/components/research-candidate-manual-global-dogfood-perspective-existing-writer-no-mutation-result-record-readback-panel";
import type { ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointResult } from "@/types/research-candidate-manual-global-dogfood-perspective-existing-writer-no-mutation-entrypoint";

export function ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointPanel({
  entrypointResult,
}: {
  entrypointResult: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointResult;
}) {
  const changedRows =
    entrypointResult.non_mutation_assertions.protected_table_row_counts.filter(
      (row) => row.changed,
    );
  const visibleRows =
    changedRows.length > 0
      ? changedRows
      : entrypointResult.non_mutation_assertions.protected_table_row_counts.slice(
          0,
          10,
        );
  const reviewPreview =
    buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReview(
      {
        source_entrypoint_result: entrypointResult,
      },
    );

  return (
    <>
      <section
        className="perspective-inspector-section manual-global-dogfood-perspective-existing-writer-no-mutation-entrypoint"
        aria-label="Manual global dogfood Perspective safe existing writer no-mutation entrypoint"
        data-augnes-authority="preview-only read-only safe-adapter-noop no-existing-writer-call no-current-working-perspective no-existing-canonical-state no-promotion no-memory no-work no-proof no-metrics no-provider no-github no-codex no-retrieval"
      >
        <div className="perspective-constellation-shell-header">
          <div>
            <p className="panel-eyebrow">
              AUGNES / Existing Writer No-Mutation Entrypoint
            </p>
            <h4>Safe no-mutation entrypoint</h4>
            <p>
              This local entrypoint binds the accepted dry-run contract, review,
              and result artifact to a safe adapter-only no-op result. It
              refuses direct existing-writer targets and raw operator or
              credential-like inputs.
            </p>
          </div>
          <div className="perspective-constellation-shell-status">
            <span className="status-pill">
              {entrypointResult.entrypoint_status}
            </span>
            <span className="status-pill">
              writer_called{" "}
              {String(
                entrypointResult.execution_decision.existing_writer_called,
              )}
            </span>
            <span className="status-pill">
              adapter_noop{" "}
              {String(
                entrypointResult.execution_decision.safe_adapter_noop_executed,
              )}
            </span>
          </div>
        </div>

        <div className="perspective-formation-summary-grid">
          <div>
            <span>safe_adapter_target</span>
            <strong>{entrypointResult.safe_adapter_target}</strong>
            <small>
              runnable{" "}
              {String(entrypointResult.execution_decision.adapter_runnable_today)}
            </small>
          </div>
          <div>
            <span>validation</span>
            <strong>{String(entrypointResult.validation.passed)}</strong>
            <small>{entrypointResult.validation.entrypoint_fingerprint}</small>
          </div>
          <div>
            <span>source result</span>
            <strong>
              {entrypointResult.source_dry_run_result_fingerprint ?? "missing"}
            </strong>
            <small>
              {String(
                entrypointResult.validation
                  .source_dry_run_result_matches_contract_review,
              )}
            </small>
          </div>
          <div>
            <span>protected row counts</span>
            <strong>
              {entrypointResult.non_mutation_assertions
                .changed_protected_table_count}
              /
              {
                entrypointResult.non_mutation_assertions
                  .protected_table_count
              }{" "}
              changed
            </strong>
            <small>
              {entrypointResult.non_mutation_assertions.snapshot_source}
            </small>
          </div>
        </div>

        <div className="perspective-constellation-workspace-grid">
          <section className="cockpit-surface-card">
            <h5>Capabilities</h5>
            <div className="perspective-workbench-status-row">
              <BoundaryFlag
                label="supports_row_count_snapshot"
                value={
                  entrypointResult.supported_capabilities
                    .supports_row_count_snapshot
                }
              />
              <BoundaryFlag
                label="supports_transaction_rollback"
                value={
                  entrypointResult.supported_capabilities
                    .supports_transaction_rollback
                }
              />
              <BoundaryFlag
                label="supports_no_mutation_assertions"
                value={
                  entrypointResult.supported_capabilities
                    .supports_no_mutation_assertions
                }
              />
              <BoundaryFlag
                label="supports_existing_writer_call"
                value={
                  entrypointResult.supported_capabilities
                    .supports_existing_writer_call
                }
              />
            </div>
          </section>
          <section className="cockpit-surface-card">
            <h5>Authority boundary</h5>
            <div className="perspective-workbench-status-row">
              <BoundaryFlag
                label="preview_only"
                value={entrypointResult.authority_boundary.preview_only}
              />
              <BoundaryFlag
                label="read_only"
                value={entrypointResult.authority_boundary.read_only}
              />
              <BoundaryFlag
                label="can_run_safe_adapter_noop"
                value={
                  entrypointResult.authority_boundary.can_run_safe_adapter_noop
                }
              />
              <BoundaryFlag
                label="can_call_existing_current_working_writer"
                value={
                  entrypointResult.authority_boundary
                    .can_call_existing_current_working_writer
                }
              />
              <BoundaryFlag
                label="can_call_existing_canonical_state_writer"
                value={
                  entrypointResult.authority_boundary
                    .can_call_existing_canonical_state_writer
                }
              />
              <BoundaryFlag
                label="can_write_proof_or_evidence"
                value={
                  entrypointResult.authority_boundary
                    .can_write_proof_or_evidence
                }
              />
            </div>
          </section>
        </div>

        <section className="cockpit-surface-card">
          <h5>Protected row-count assertion</h5>
          <div className="perspective-workbench-status-row">
            <span>
              all_unchanged{" "}
              <code>
                {String(
                  entrypointResult.non_mutation_assertions
                    .all_protected_row_counts_unchanged,
                )}
              </code>
            </span>
            <span>
              changed_tables{" "}
              <code>
                {
                  entrypointResult.non_mutation_assertions
                    .changed_protected_table_count
                }
              </code>
            </span>
            <span>
              raw_payload_absent{" "}
              <code>
                {String(entrypointResult.validation.raw_payload_absent)}
              </code>
            </span>
          </div>
          <dl>
            {visibleRows.map((row) => (
              <RowCountDefinition key={row.table_name} row={row} />
            ))}
          </dl>
        </section>

        <div className="perspective-constellation-workspace-grid">
          <ReasonList
            title="Blockers"
            reasons={entrypointResult.blocker_reasons}
          />
          <ReasonList
            title="Warnings"
            reasons={entrypointResult.warning_reasons}
          />
          <section className="cockpit-surface-card">
            <h5>Execution trace</h5>
            <ul>
              {entrypointResult.execution_decision.execution_trace.map(
                (entry) => (
                  <li key={entry}>{entry}</li>
                ),
              )}
            </ul>
          </section>
          <section className="cockpit-surface-card">
            <h5>Next slice</h5>
            <p>{entrypointResult.next_recommended_slice}</p>
          </section>
        </div>
      </section>
      <ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReviewPanel
        review={reviewPreview}
      />
      <ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationResultRecordReadbackPanel
        sourceReviewFingerprint={reviewPreview.validation.review_fingerprint}
      />
    </>
  );
}

function RowCountDefinition({
  row,
}: {
  row: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointResult["non_mutation_assertions"]["protected_table_row_counts"][number];
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

function ReasonList({
  title,
  reasons,
}: {
  title: string;
  reasons: string[];
}) {
  return (
    <section className="cockpit-surface-card">
      <h5>{title}</h5>
      {reasons.length > 0 ? (
        <ul>
          {reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      ) : (
        <p>none</p>
      )}
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
