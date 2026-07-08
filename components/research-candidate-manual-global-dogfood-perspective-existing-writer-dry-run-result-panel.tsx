"use client";

import { buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunResult } from "@/lib/research-candidate-review/manual-global-dogfood-perspective-existing-writer-dry-run-result";
import type { ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunContract } from "@/types/research-candidate-manual-global-dogfood-perspective-existing-writer-dry-run-contract";
import type { ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunReview } from "@/types/research-candidate-manual-global-dogfood-perspective-existing-writer-dry-run-review";
import type { ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunResult } from "@/types/research-candidate-manual-global-dogfood-perspective-existing-writer-dry-run-result";

export function ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunResultPanel({
  existingWriterDryRunContract,
  existingWriterDryRunReview,
}: {
  existingWriterDryRunContract: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunContract;
  existingWriterDryRunReview: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunReview;
}) {
  const result =
    buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunResult({
      existing_writer_dry_run_contract: existingWriterDryRunContract,
      existing_writer_dry_run_review: existingWriterDryRunReview,
    });

  return <ExistingWriterDryRunResultView result={result} />;
}

function ExistingWriterDryRunResultView({
  result,
}: {
  result: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunResult;
}) {
  const changedRows =
    result.non_mutation_proof.protected_table_row_counts.filter(
      (row) => row.changed,
    );
  const visibleRows =
    changedRows.length > 0
      ? changedRows
      : result.non_mutation_proof.protected_table_row_counts.slice(0, 12);

  return (
    <section
      className="perspective-inspector-section manual-global-dogfood-perspective-existing-writer-dry-run-result"
      aria-label="Manual global dogfood Perspective existing writer no-mutation dry-run result"
      data-augnes-authority="preview-only read-only no-existing-writer-call no-current-working-perspective no-existing-canonical-state no-promotion no-memory no-work no-proof no-metrics no-provider no-github no-codex no-retrieval"
    >
      <div className="perspective-constellation-shell-header">
        <div>
          <p className="panel-eyebrow">
            AUGNES / Existing Writer No-Mutation Result
          </p>
          <h4>Existing writer no-mutation dry-run result</h4>
          <p>
            This deterministic result validates the accepted dry-run contract
            chain and reports row-count proof without calling an existing writer
            or writing a dry-run result record.
          </p>
        </div>
        <div className="perspective-constellation-shell-status">
          <span className="status-pill">{result.result_status}</span>
          <span className="status-pill">
            writer_called {String(result.execution_decision.existing_writer_called)}
          </span>
          <span className="status-pill">
            row_delta{" "}
            {String(
              result.non_mutation_proof.changed_protected_table_count > 0,
            )}
          </span>
        </div>
      </div>

      <div className="perspective-formation-summary-grid">
        <div>
          <span>adapter_runnable_today</span>
          <strong>
            {String(result.execution_decision.adapter_runnable_today)}
          </strong>
          <small>{result.execution_decision.existing_writer_support_status}</small>
        </div>
        <div>
          <span>skip_reason</span>
          <strong>{result.execution_decision.skip_reason}</strong>
          <small>existing_writer_skipped true</small>
        </div>
        <div>
          <span>validation</span>
          <strong>{String(result.validation.passed)}</strong>
          <small>{result.validation.result_fingerprint}</small>
        </div>
        <div>
          <span>protected row counts</span>
          <strong>
            {result.non_mutation_proof.changed_protected_table_count}/
            {result.non_mutation_proof.protected_table_count} changed
          </strong>
          <small>{result.non_mutation_proof.snapshot_source}</small>
        </div>
      </div>

      <div className="perspective-constellation-workspace-grid">
        <SourceBindingSummary result={result} />
        <ExecutionSummary result={result} />
        <NonMutationFlagSummary result={result} />
        <AuthorityBoundarySummary result={result} />
      </div>

      <section className="cockpit-surface-card">
        <h5>Protected row-count proof</h5>
        <div className="perspective-workbench-status-row">
          <span>
            all_unchanged{" "}
            <code>
              {String(
                result.non_mutation_proof.all_protected_row_counts_unchanged,
              )}
            </code>
          </span>
          <span>
            row_count_before_after_snapshot_recorded{" "}
            <code>
              {String(
                result.non_mutation_proof
                  .row_count_before_after_snapshot_recorded,
              )}
            </code>
          </span>
          <span>
            changed_tables{" "}
            <code>
              {result.non_mutation_proof.changed_protected_table_count}
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
        <ReasonList title="Blockers" reasons={result.blocker_reasons} />
        <ReasonList title="Warnings" reasons={result.warning_reasons} />
        <ReasonList
          title="Runnable-today blockers"
          reasons={result.execution_decision.runnable_today_blockers}
        />
        <section className="cockpit-surface-card">
          <h5>Next slice</h5>
          <p>{result.next_recommended_slice}</p>
        </section>
      </div>
    </section>
  );
}

function SourceBindingSummary({
  result,
}: {
  result: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunResult;
}) {
  const binding = result.source_binding;
  return (
    <section className="cockpit-surface-card">
      <h5>Accepted source binding</h5>
      <dl>
        <dt>source_contract_fingerprint</dt>
        <dd>{binding.source_contract_fingerprint ?? "missing"}</dd>
        <dt>source_review_fingerprint</dt>
        <dd>{binding.source_review_fingerprint ?? "missing"}</dd>
        <dt>accepted_mapping_summary_present</dt>
        <dd>{String(binding.accepted_mapping_summary_present)}</dd>
        <dt>source_writer_compatibility_receipt_id</dt>
        <dd>
          {binding.source_perspective_writer_compatibility_receipt_id ??
            "missing"}
        </dd>
        <dt>source_writer_compatibility_record_fingerprint</dt>
        <dd>
          {binding.source_perspective_writer_compatibility_record_fingerprint ??
            "missing"}
        </dd>
        <dt>source_handoff_seed_fingerprint</dt>
        <dd>{binding.source_handoff_seed_fingerprint ?? "missing"}</dd>
        <dt>source_result_text_fingerprint</dt>
        <dd>{binding.source_result_text_fingerprint ?? "missing"}</dd>
        <dt>accepted_future_dry_run_target</dt>
        <dd>{binding.accepted_future_dry_run_target ?? "missing"}</dd>
      </dl>
    </section>
  );
}

function ExecutionSummary({
  result,
}: {
  result: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunResult;
}) {
  return (
    <section className="cockpit-surface-card">
      <h5>Execution decision</h5>
      <dl>
        <dt>existing_writer_support_status</dt>
        <dd>{result.execution_decision.existing_writer_support_status}</dd>
        <dt>existing_writer_called</dt>
        <dd>{String(result.execution_decision.existing_writer_called)}</dd>
        <dt>existing_writer_skipped</dt>
        <dd>{String(result.execution_decision.existing_writer_skipped)}</dd>
        <dt>safe_entrypoint_detected</dt>
        <dd>
          {String(
            result.validation
              .safe_existing_writer_no_mutation_entrypoint_detected,
          )}
        </dd>
        <dt>current_working_dry_run_entrypoint_detected</dt>
        <dd>
          {String(
            result.validation
              .existing_current_working_writer_dry_run_entrypoint_detected,
          )}
        </dd>
        <dt>canonical_state_dry_run_entrypoint_detected</dt>
        <dd>
          {String(
            result.validation
              .existing_canonical_state_writer_dry_run_entrypoint_detected,
          )}
        </dd>
      </dl>
    </section>
  );
}

function NonMutationFlagSummary({
  result,
}: {
  result: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunResult;
}) {
  const proof = result.non_mutation_proof;
  return (
    <section className="cockpit-surface-card">
      <h5>Non-mutation proof flags</h5>
      <div className="perspective-workbench-status-row">
        <BoundaryFlag label="existing_writer_called" value={proof.existing_writer_called} />
        <BoundaryFlag
          label="current_working_perspective_updated"
          value={proof.current_working_perspective_updated}
        />
        <BoundaryFlag
          label="existing_canonical_perspective_state_table_mutated"
          value={proof.existing_canonical_perspective_state_table_mutated}
        />
        <BoundaryFlag
          label="perspective_promoted"
          value={proof.perspective_promoted}
        />
        <BoundaryFlag
          label="perspective_memory_written"
          value={proof.perspective_memory_written}
        />
        <BoundaryFlag label="work_mutated" value={proof.work_mutated} />
        <BoundaryFlag
          label="proof_or_evidence_written"
          value={proof.proof_or_evidence_written}
        />
        <BoundaryFlag
          label="dogfood_metrics_written"
          value={proof.dogfood_metrics_written}
        />
        <BoundaryFlag
          label="provider_openai_called"
          value={proof.provider_openai_called}
        />
        <BoundaryFlag label="github_called" value={proof.github_called} />
        <BoundaryFlag label="codex_executed" value={proof.codex_executed} />
      </div>
    </section>
  );
}

function AuthorityBoundarySummary({
  result,
}: {
  result: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunResult;
}) {
  const boundary = result.authority_boundary;
  return (
    <section className="cockpit-surface-card">
      <h5>Authority boundary</h5>
      <div className="perspective-workbench-status-row">
        <BoundaryFlag label="preview_only" value={boundary.preview_only} />
        <BoundaryFlag label="read_only" value={boundary.read_only} />
        <BoundaryFlag
          label="can_write_existing_writer_dry_run_result_record"
          value={boundary.can_write_existing_writer_dry_run_result_record}
        />
        <BoundaryFlag
          label="can_run_existing_writer_dry_run"
          value={boundary.can_run_existing_writer_dry_run}
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
          label="can_update_current_working_perspective"
          value={boundary.can_update_current_working_perspective}
        />
        <BoundaryFlag
          label="can_mutate_existing_canonical_perspective_state"
          value={boundary.can_mutate_existing_canonical_perspective_state}
        />
        <BoundaryFlag
          label="can_write_perspective_memory"
          value={boundary.can_write_perspective_memory}
        />
        <BoundaryFlag
          label="can_write_proof_or_evidence"
          value={boundary.can_write_proof_or_evidence}
        />
      </div>
    </section>
  );
}

function RowCountDefinition({
  row,
}: {
  row: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunResult["non_mutation_proof"]["protected_table_row_counts"][number];
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
