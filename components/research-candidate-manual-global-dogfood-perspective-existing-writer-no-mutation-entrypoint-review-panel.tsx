"use client";

import type { ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReview } from "@/types/research-candidate-manual-global-dogfood-perspective-existing-writer-no-mutation-entrypoint-review";

export function ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReviewPanel({
  review,
}: {
  review: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReview;
}) {
  const changedRows = review.row_count_summary.rows.filter(
    (row) => row.changed,
  );
  const visibleRows =
    changedRows.length > 0
      ? changedRows
      : review.row_count_summary.rows.slice(0, 10);

  return (
    <section
      className="perspective-inspector-section manual-global-dogfood-perspective-existing-writer-no-mutation-entrypoint-review"
      aria-label="Manual global dogfood Perspective existing writer no-mutation entrypoint review"
      data-augnes-authority="preview-only read-only no-review-record-write no-result-record-write no-existing-writer-call no-current-working-perspective no-existing-canonical-state no-promotion no-memory no-work no-proof no-metrics no-provider no-github no-codex no-retrieval"
    >
      <div className="perspective-constellation-shell-header">
        <div>
          <p className="panel-eyebrow">
            AUGNES / Existing Writer Entrypoint Review
          </p>
          <h4>No-mutation entrypoint review decision</h4>
          <p>
            This local review preserves the safe entrypoint proof for operator
            planning without writing a review record, result record, proof row,
            or existing-writer invocation.
          </p>
        </div>
        <div className="perspective-constellation-shell-status">
          <span className="status-pill">{review.review_status}</span>
          <span className="status-pill">
            operator_decision {review.operator_decision ?? "missing"}
          </span>
          <span className="status-pill">
            writes_now{" "}
            {String(
              review.explicit_non_write_boundary
                .no_mutation_result_record_written,
            )}
          </span>
        </div>
      </div>

      <div className="perspective-formation-summary-grid">
        <div>
          <span>source_entrypoint_status</span>
          <strong>{review.source_entrypoint_status ?? "missing"}</strong>
          <small>{review.source_entrypoint_fingerprint ?? "missing"}</small>
        </div>
        <div>
          <span>safe_adapter_target</span>
          <strong>{review.safe_adapter_target ?? "missing"}</strong>
          <small>
            lineage {String(review.validation.source_entrypoint_lineage_complete)}
          </small>
        </div>
        <div>
          <span>review_fingerprint</span>
          <strong>{review.validation.review_fingerprint}</strong>
          <small>passed {String(review.validation.passed)}</small>
        </div>
        <div>
          <span>row counts</span>
          <strong>
            {review.row_count_summary.changed_protected_table_count}/
            {review.row_count_summary.protected_table_count} changed
          </strong>
          <small>
            unchanged{" "}
            {String(
              review.row_count_summary.all_protected_row_counts_unchanged,
            )}
          </small>
        </div>
      </div>

      <div className="perspective-constellation-workspace-grid">
        <SourceBindingSummary review={review} />
        <NonMutationSummary review={review} />
        <AuthorityBoundarySummary review={review} />
        <ExplicitNonWriteBoundarySummary review={review} />
      </div>

      <section className="cockpit-surface-card">
        <h5>Protected row-count summary</h5>
        <div className="perspective-workbench-status-row">
          <span>
            all_unchanged{" "}
            <code>
              {String(
                review.row_count_summary.all_protected_row_counts_unchanged,
              )}
            </code>
          </span>
          <span>
            snapshot_recorded{" "}
            <code>
              {String(
                review.row_count_summary
                  .row_count_before_after_snapshot_recorded,
              )}
            </code>
          </span>
          <span>
            changed_tables{" "}
            <code>{review.row_count_summary.changed_protected_table_count}</code>
          </span>
        </div>
        <dl>
          {visibleRows.map((row) => (
            <RowCountDefinition key={row.table_name} row={row} />
          ))}
        </dl>
      </section>

      {review.accepted_entrypoint_summary ? (
        <section className="cockpit-surface-card">
          <h5>Accepted entrypoint summary</h5>
          <dl>
            <dt>future_planning_scope</dt>
            <dd>{review.accepted_entrypoint_summary.future_planning_scope}</dd>
            <dt>source_entrypoint_fingerprint</dt>
            <dd>
              {
                review.accepted_entrypoint_summary
                  .source_entrypoint_fingerprint
              }
            </dd>
            <dt>source_dry_run_result_fingerprint</dt>
            <dd>
              {
                review.accepted_entrypoint_summary
                  .source_dry_run_result_fingerprint
              }
            </dd>
            <dt>writes_now</dt>
            <dd>{String(review.accepted_entrypoint_summary.writes_now)}</dd>
            <dt>existing_writer_called</dt>
            <dd>
              {String(
                review.accepted_entrypoint_summary.existing_writer_called,
              )}
            </dd>
          </dl>
        </section>
      ) : null}

      <div className="perspective-constellation-workspace-grid">
        <ReasonList title="Blockers" reasons={review.blocker_reasons} />
        <ReasonList title="Warnings" reasons={review.warning_reasons} />
      </div>
    </section>
  );
}

function SourceBindingSummary({
  review,
}: {
  review: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReview;
}) {
  const binding = review.source_binding_summary;
  return (
    <section className="cockpit-surface-card">
      <h5>Source binding</h5>
      <dl>
        <dt>source_contract_fingerprint</dt>
        <dd>{binding.source_contract_fingerprint ?? "missing"}</dd>
        <dt>source_review_fingerprint</dt>
        <dd>{binding.source_review_fingerprint ?? "missing"}</dd>
        <dt>source_dry_run_result_fingerprint</dt>
        <dd>{binding.source_dry_run_result_fingerprint ?? "missing"}</dd>
        <dt>source_writer_receipt_id</dt>
        <dd>
          {binding.source_writer_compatibility_refs
            .source_perspective_writer_compatibility_receipt_id ?? "missing"}
        </dd>
        <dt>source_writer_record_id</dt>
        <dd>
          {binding.source_writer_compatibility_refs
            .source_perspective_writer_compatibility_record_id ?? "missing"}
        </dd>
        <dt>source_writer_record_fingerprint</dt>
        <dd>
          {binding.source_writer_compatibility_refs
            .source_perspective_writer_compatibility_record_fingerprint ??
            "missing"}
        </dd>
      </dl>
    </section>
  );
}

function NonMutationSummary({
  review,
}: {
  review: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReview;
}) {
  const summary = review.non_mutation_summary;
  return (
    <section className="cockpit-surface-card">
      <h5>Non-mutation summary</h5>
      <div className="perspective-workbench-status-row">
        <BoundaryFlag
          label="existing_writer_called"
          value={summary.existing_writer_called}
        />
        <BoundaryFlag
          label="current_working_perspective_updated"
          value={summary.current_working_perspective_updated}
        />
        <BoundaryFlag
          label="existing_canonical_perspective_state_table_mutated"
          value={summary.existing_canonical_perspective_state_table_mutated}
        />
        <BoundaryFlag
          label="perspective_memory_written"
          value={summary.perspective_memory_written}
        />
        <BoundaryFlag label="work_mutated" value={summary.work_mutated} />
        <BoundaryFlag
          label="proof_or_evidence_written"
          value={summary.proof_or_evidence_written}
        />
        <BoundaryFlag
          label="provider_openai_called"
          value={summary.provider_openai_called}
        />
        <BoundaryFlag label="github_called" value={summary.github_called} />
        <BoundaryFlag label="codex_executed" value={summary.codex_executed} />
      </div>
    </section>
  );
}

function AuthorityBoundarySummary({
  review,
}: {
  review: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReview;
}) {
  const boundary = review.authority_boundary;
  return (
    <section className="cockpit-surface-card">
      <h5>Authority boundary</h5>
      <div className="perspective-workbench-status-row">
        <BoundaryFlag label="preview_only" value={boundary.preview_only} />
        <BoundaryFlag label="read_only" value={boundary.read_only} />
        <BoundaryFlag
          label="can_write_no_mutation_result_record"
          value={boundary.can_write_no_mutation_result_record}
        />
        <BoundaryFlag
          label="can_write_review_record"
          value={boundary.can_write_review_record}
        />
        <BoundaryFlag
          label="can_call_existing_current_working_writer"
          value={boundary.can_call_existing_current_working_writer}
        />
        <BoundaryFlag
          label="can_call_existing_canonical_state_writer"
          value={boundary.can_call_existing_canonical_state_writer}
        />
        <BoundaryFlag
          label="can_write_proof_or_evidence"
          value={boundary.can_write_proof_or_evidence}
        />
      </div>
    </section>
  );
}

function ExplicitNonWriteBoundarySummary({
  review,
}: {
  review: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReview;
}) {
  const boundary = review.explicit_non_write_boundary;
  return (
    <section className="cockpit-surface-card">
      <h5>Explicit non-write boundary</h5>
      <div className="perspective-workbench-status-row">
        <BoundaryFlag
          label="durable_review_record_written"
          value={boundary.durable_review_record_written}
        />
        <BoundaryFlag
          label="no_mutation_result_record_written"
          value={boundary.no_mutation_result_record_written}
        />
        <BoundaryFlag
          label="source_record_mutated"
          value={boundary.source_record_mutated}
        />
        <BoundaryFlag
          label="action_button_added"
          value={boundary.action_button_added}
        />
        <BoundaryFlag
          label="server_action_added"
          value={boundary.server_action_added}
        />
        <BoundaryFlag
          label="browser_or_network_call_added"
          value={boundary.browser_or_network_call_added}
        />
      </div>
    </section>
  );
}

function RowCountDefinition({
  row,
}: {
  row: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterNoMutationEntrypointReview["row_count_summary"]["rows"][number];
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
