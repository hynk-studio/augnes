"use client";

import { useState } from "react";

import { buildResearchCandidateManualGlobalDogfoodMetricSnapshotContract } from "@/lib/research-candidate-review/manual-global-dogfood-metric-snapshot-contract";
import { buildResearchCandidateManualGlobalDogfoodMetricSnapshotReview } from "@/lib/research-candidate-review/manual-global-dogfood-metric-snapshot-review";
import { ResearchCandidateManualGlobalDogfoodMetricSnapshotWritePanel } from "@/components/research-candidate-manual-global-dogfood-metric-snapshot-write-panel";
import type { ResearchCandidateManualGlobalDogfoodLedgerWorkbenchProjection } from "@/types/research-candidate-manual-global-dogfood-ledger-workbench-projection";
import type { ResearchCandidateManualGlobalDogfoodMetricSnapshotContract } from "@/types/research-candidate-manual-global-dogfood-metric-snapshot-contract";
import type {
  ResearchCandidateManualGlobalDogfoodMetricSnapshotReview,
  ResearchCandidateManualGlobalDogfoodMetricSnapshotReviewDecision,
} from "@/types/research-candidate-manual-global-dogfood-metric-snapshot-review";

const metricReviewDecisions: {
  value: ResearchCandidateManualGlobalDogfoodMetricSnapshotReviewDecision;
  label: string;
}[] = [
  {
    value: "accept_contract_for_future_metric_snapshot_write_slice",
    label: "Accept contract for future metric slice",
  },
  {
    value: "needs_metric_mapping_revision",
    label: "Needs metric mapping revision",
  },
  {
    value: "reject_metric_contract",
    label: "Reject metric contract",
  },
  {
    value: "defer_metric_contract",
    label: "Defer metric contract",
  },
];

export function ResearchCandidateManualGlobalDogfoodMetricSnapshotContractPanel({
  projection,
}: {
  projection: ResearchCandidateManualGlobalDogfoodLedgerWorkbenchProjection;
}) {
  const [operatorDecision, setOperatorDecision] =
    useState<ResearchCandidateManualGlobalDogfoodMetricSnapshotReviewDecision>(
      "accept_contract_for_future_metric_snapshot_write_slice",
    );
  const [operatorNote, setOperatorNote] = useState("");
  const [review, setReview] =
    useState<ResearchCandidateManualGlobalDogfoodMetricSnapshotReview | null>(
      null,
    );
  const contract =
    buildResearchCandidateManualGlobalDogfoodMetricSnapshotContract({
      projection,
      operator_intent_label:
        "research_candidate_manual_global_dogfood_metric_snapshot_contract_panel",
    });

  return (
    <section
      className="perspective-inspector-section manual-global-dogfood-metric-snapshot-contract"
      aria-label="Manual global dogfood metric snapshot contract preview"
      data-augnes-authority="preview-only read-only no-metric-write no-next-work-bias no-perspective no-proof no-work no-memory"
    >
      <div className="perspective-constellation-shell-header">
        <div>
          <p className="panel-eyebrow">AUGNES / Metric Contract</p>
          <h4>Dogfood metric snapshot contract preview</h4>
          <p>
            This contract preview derives candidate counters and labels from
            the manual global dogfood projection. It does not write dogfood
            metrics, next-work bias, Perspective, proof/evidence, work status,
            memory, product state, or ledger rows.
          </p>
        </div>
        <div className="perspective-constellation-shell-status">
          <span className="status-pill">
            {contract.operator_authorization_mode}
          </span>
          <span className="status-pill">local review only</span>
          <span className="status-pill">writes_now false</span>
        </div>
      </div>

      <div className="perspective-workbench-status-row">
        <span>
          source_projection_fingerprint{" "}
          <code>{contract.source_projection_fingerprint}</code>
        </span>
        <span>
          latest_active_committed_receipt{" "}
          <code>
            {contract.source_latest_active_committed_receipt_id ?? "none"}
          </code>
        </span>
        <span>
          proposed_idempotency_key{" "}
          <code>
            {contract.idempotency_contract_preview.proposed_idempotency_key}
          </code>
        </span>
      </div>

      <div className="perspective-formation-summary-grid">
        <div>
          <span>contract readiness</span>
          <strong>{contract.operator_authorization_mode}</strong>
          <small>blockers {contract.blocker_reasons.length}</small>
        </div>
        <div>
          <span>outcome signal</span>
          <strong>
            {contract.proposed_metric_snapshot_mapping.outcome_signal ?? "none"}
          </strong>
          <small>
            label{" "}
            {contract.proposed_metric_snapshot_mapping.outcome_label ?? "none"}
          </small>
        </div>
        <div>
          <span>preview counters</span>
          <strong>
            {
              contract.proposed_metric_counters
                .manual_global_dogfood_ledger_active_candidate_count
            }
          </strong>
          <small>
            writes_now {String(contract.proposed_metric_counters.writes_now)}
          </small>
        </div>
        <div>
          <span>metric write now</span>
          <strong>
            {String(
              contract.proposed_metric_snapshot_mapping.can_write_metric_now,
            )}
          </strong>
          <small>future authorization required</small>
        </div>
      </div>

      <div className="perspective-constellation-workspace-grid">
        <MetricMappingSummary contract={contract} />
        <MetricCounterSummary contract={contract} />
        <MetricLabelSummary contract={contract} />
      </div>

      <section className="cockpit-surface-card">
        <h5>Idempotency contract preview</h5>
        <dl>
          <dt>proposed_idempotency_key</dt>
          <dd>{contract.idempotency_contract_preview.proposed_idempotency_key}</dd>
          <dt>fingerprint_algorithm</dt>
          <dd>{contract.idempotency_contract_preview.fingerprint_algorithm}</dd>
          <dt>would_prevent_duplicate_metric_snapshot_write</dt>
          <dd>
            {String(
              contract.idempotency_contract_preview
                .would_prevent_duplicate_metric_snapshot_write,
            )}
          </dd>
          <dt>durable_id_allocated</dt>
          <dd>{String(contract.idempotency_contract_preview.durable_id_allocated)}</dd>
          <dt>writes_now</dt>
          <dd>{String(contract.idempotency_contract_preview.writes_now)}</dd>
        </dl>
      </section>

      <section className="cockpit-surface-card">
        <h5>Compatibility findings</h5>
        <div className="perspective-detail-stack">
          {contract.compatibility_findings.map((finding) => (
            <section key={finding.finding_code}>
              <h6>{finding.finding_code}</h6>
              <div className="perspective-workbench-status-row">
                <span>
                  severity <code>{finding.severity}</code>
                </span>
                <span>
                  applies_to <code>{finding.applies_to}</code>
                </span>
              </div>
              <p>{finding.summary}</p>
            </section>
          ))}
        </div>
      </section>

      <div className="perspective-constellation-workspace-grid">
        <ReasonList title="Blockers" reasons={contract.blocker_reasons} />
        <ReasonList title="Warnings" reasons={contract.warning_reasons} />
        <ReasonList
          title="Required future authorization"
          reasons={contract.required_future_authorization}
        />
      </div>

      <section className="cockpit-surface-card">
        <h5>Authority boundary</h5>
        <div className="perspective-workbench-status-row">
          <BoundaryFlag label="preview_only" value={contract.authority_boundary.preview_only} />
          <BoundaryFlag label="read_only" value={contract.authority_boundary.read_only} />
          <BoundaryFlag
            label="can_write_dogfood_metrics"
            value={contract.authority_boundary.can_write_dogfood_metrics}
          />
          <BoundaryFlag
            label="can_write_metric_snapshot"
            value={contract.authority_boundary.can_write_metric_snapshot}
          />
          <BoundaryFlag
            label="can_write_next_work_bias"
            value={contract.authority_boundary.can_write_next_work_bias}
          />
          <BoundaryFlag
            label="can_write_perspective_state"
            value={contract.authority_boundary.can_write_perspective_state}
          />
          <BoundaryFlag
            label="can_write_perspective_memory"
            value={contract.authority_boundary.can_write_perspective_memory}
          />
          <BoundaryFlag
            label="can_write_proof_or_evidence"
            value={contract.authority_boundary.can_write_proof_or_evidence}
          />
          <BoundaryFlag
            label="can_mutate_work"
            value={contract.authority_boundary.can_mutate_work}
          />
          <BoundaryFlag
            label="can_execute_product_write"
            value={contract.authority_boundary.can_execute_product_write}
          />
        </div>
      </section>

      <section className="cockpit-surface-card">
        <h5>Local operator review preview</h5>
        <fieldset className="perspective-detail-stack">
          <legend>Operator decision</legend>
          {metricReviewDecisions.map((decision) => (
            <label key={decision.value}>
              <input
                type="radio"
                name="manual-global-dogfood-metric-contract-decision"
                value={decision.value}
                checked={operatorDecision === decision.value}
                onChange={() => setOperatorDecision(decision.value)}
              />{" "}
              {decision.label}
            </label>
          ))}
        </fieldset>
        <label>
          Local-only operator note
          <textarea
            value={operatorNote}
            onChange={(event) => setOperatorNote(event.target.value)}
            rows={3}
            placeholder="Optional local note; not persisted or sent."
          />
        </label>
        <div className="perspective-workbench-status-row">
          <button
            type="button"
            onClick={() =>
              setReview(
                buildResearchCandidateManualGlobalDogfoodMetricSnapshotReview({
                  metric_snapshot_contract: contract,
                  operator_decision: operatorDecision,
                  operator_note: operatorNote,
                }),
              )
            }
          >
            Preview metric review
          </button>
          <button type="button" onClick={() => setReview(null)}>
            Clear metric review
          </button>
        </div>
        {review ? <MetricReviewPreview review={review} /> : null}
      </section>

      {review?.review_status === "ready_for_future_metric_snapshot_write_slice" ? (
        <ResearchCandidateManualGlobalDogfoodMetricSnapshotWritePanel
          metricSnapshotContract={contract}
          metricSnapshotReview={review}
        />
      ) : null}

      <p className="manual-note-runtime-hint">
        next_recommended_slice <code>{contract.next_recommended_slice}</code>
      </p>
    </section>
  );
}

function MetricMappingSummary({
  contract,
}: {
  contract: ResearchCandidateManualGlobalDogfoodMetricSnapshotContract;
}) {
  const mapping = contract.proposed_metric_snapshot_mapping;
  return (
    <section className="cockpit-surface-card">
      <h5>Proposed metric snapshot mapping</h5>
      <dl>
        <dt>outcome_label</dt>
        <dd>{mapping.outcome_label ?? "none"}</dd>
        <dt>outcome_signal</dt>
        <dd>{mapping.outcome_signal ?? "none"}</dd>
        <dt>expected_summary_present</dt>
        <dd>{String(mapping.expected_summary_present)}</dd>
        <dt>observed_summary_present</dt>
        <dd>{String(mapping.observed_summary_present)}</dd>
        <dt>mismatch_or_gap_present</dt>
        <dd>{String(mapping.mismatch_or_gap_present)}</dd>
        <dt>selected_candidate_context_ref_count</dt>
        <dd>{mapping.selected_candidate_context_ref_count}</dd>
        <dt>can_feed_metric_snapshot_refresh_candidate</dt>
        <dd>{String(mapping.can_feed_metric_snapshot_refresh_candidate)}</dd>
        <dt>can_write_metric_now</dt>
        <dd>{String(mapping.can_write_metric_now)}</dd>
      </dl>
    </section>
  );
}

function MetricCounterSummary({
  contract,
}: {
  contract: ResearchCandidateManualGlobalDogfoodMetricSnapshotContract;
}) {
  const counters = contract.proposed_metric_counters;
  return (
    <section className="cockpit-surface-card">
      <h5>Proposed preview counters</h5>
      <dl>
        <dt>manual_global_dogfood_ledger_active_candidate_count</dt>
        <dd>{counters.manual_global_dogfood_ledger_active_candidate_count}</dd>
        <dt>manual_global_dogfood_positive_signal_count</dt>
        <dd>{counters.manual_global_dogfood_positive_signal_count}</dd>
        <dt>manual_global_dogfood_negative_signal_count</dt>
        <dd>{counters.manual_global_dogfood_negative_signal_count}</dd>
        <dt>manual_global_dogfood_ambiguous_signal_count</dt>
        <dd>{counters.manual_global_dogfood_ambiguous_signal_count}</dd>
        <dt>manual_global_dogfood_follow_up_candidate_count</dt>
        <dd>{counters.manual_global_dogfood_follow_up_candidate_count}</dd>
        <dt>writes_now</dt>
        <dd>{String(counters.writes_now)}</dd>
      </dl>
    </section>
  );
}

function MetricLabelSummary({
  contract,
}: {
  contract: ResearchCandidateManualGlobalDogfoodMetricSnapshotContract;
}) {
  const labels = contract.proposed_metric_labels;
  return (
    <section className="cockpit-surface-card">
      <h5>Proposed metric labels</h5>
      <dl>
        <dt>source_family</dt>
        <dd>{labels.source_family}</dd>
        <dt>projection_ready_label</dt>
        <dd>{labels.projection_ready_label}</dd>
        <dt>expected_observed_follow_up_label</dt>
        <dd>{labels.expected_observed_follow_up_label}</dd>
        <dt>writes_now</dt>
        <dd>{String(labels.writes_now)}</dd>
      </dl>
      <ListOrFallback items={labels.labels} fallback="No labels." />
    </section>
  );
}

function MetricReviewPreview({
  review,
}: {
  review: ResearchCandidateManualGlobalDogfoodMetricSnapshotReview;
}) {
  return (
    <section className="cockpit-surface-card">
      <h6>Metric review preview</h6>
      <div className="perspective-workbench-status-row">
        <span>
          review_status <code>{review.review_status}</code>
        </span>
        <span>
          review_fingerprint <code>{review.validation.review_fingerprint}</code>
        </span>
        <span>
          operator_note_persisted{" "}
          <code>{String(review.validation.operator_note_persisted)}</code>
        </span>
        <span>
          no_write_authority{" "}
          <code>{String(review.validation.no_write_authority)}</code>
        </span>
      </div>
      {review.accepted_mapping_summary ? (
        <dl>
          <dt>accepted_source_projection_fingerprint</dt>
          <dd>{review.accepted_mapping_summary.source_projection_fingerprint}</dd>
          <dt>accepted_idempotency_key</dt>
          <dd>{review.accepted_mapping_summary.proposed_idempotency_key}</dd>
          <dt>writes_now</dt>
          <dd>{String(review.accepted_mapping_summary.writes_now)}</dd>
        </dl>
      ) : null}
      <ReasonList title="Unresolved blockers" reasons={review.unresolved_blockers} />
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

function ReasonList({ title, reasons }: { title: string; reasons: string[] }) {
  return (
    <section className="cockpit-surface-card">
      <h5>{title}</h5>
      <ListOrFallback items={reasons} fallback={`No ${title.toLowerCase()}.`} />
    </section>
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
