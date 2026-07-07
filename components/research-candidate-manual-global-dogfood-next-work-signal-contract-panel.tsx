"use client";

import { useState } from "react";

import { ResearchCandidateManualGlobalDogfoodNextWorkSignalWritePanel } from "@/components/research-candidate-manual-global-dogfood-next-work-signal-write-panel";
import { buildResearchCandidateManualGlobalDogfoodNextWorkSignalContract } from "@/lib/research-candidate-review/manual-global-dogfood-next-work-signal-contract";
import { buildResearchCandidateManualGlobalDogfoodNextWorkSignalReview } from "@/lib/research-candidate-review/manual-global-dogfood-next-work-signal-review";
import type { ResearchCandidateManualGlobalDogfoodLedgerWorkbenchProjection } from "@/types/research-candidate-manual-global-dogfood-ledger-workbench-projection";
import type { ResearchCandidateManualGlobalDogfoodNextWorkSignalContract } from "@/types/research-candidate-manual-global-dogfood-next-work-signal-contract";
import type {
  ResearchCandidateManualGlobalDogfoodNextWorkSignalReview,
  ResearchCandidateManualGlobalDogfoodNextWorkSignalReviewDecision,
} from "@/types/research-candidate-manual-global-dogfood-next-work-signal-review";

const nextWorkReviewDecisions: {
  value: ResearchCandidateManualGlobalDogfoodNextWorkSignalReviewDecision;
  label: string;
}[] = [
  {
    value: "accept_contract_for_future_next_work_signal_write_slice",
    label: "Accept contract for future next-work slice",
  },
  {
    value: "needs_next_work_mapping_revision",
    label: "Needs next-work mapping revision",
  },
  {
    value: "reject_next_work_contract",
    label: "Reject next-work contract",
  },
  {
    value: "defer_next_work_contract",
    label: "Defer next-work contract",
  },
];

export function ResearchCandidateManualGlobalDogfoodNextWorkSignalContractPanel({
  projection,
}: {
  projection: ResearchCandidateManualGlobalDogfoodLedgerWorkbenchProjection;
}) {
  const [operatorDecision, setOperatorDecision] =
    useState<ResearchCandidateManualGlobalDogfoodNextWorkSignalReviewDecision>(
      "accept_contract_for_future_next_work_signal_write_slice",
    );
  const [operatorNote, setOperatorNote] = useState("");
  const [review, setReview] =
    useState<ResearchCandidateManualGlobalDogfoodNextWorkSignalReview | null>(
      null,
    );
  const contract =
    buildResearchCandidateManualGlobalDogfoodNextWorkSignalContract({
      projection,
      operator_intent_label:
        "research_candidate_manual_global_dogfood_next_work_signal_contract_panel",
    });

  return (
    <section
      className="perspective-inspector-section manual-global-dogfood-next-work-signal-contract"
      aria-label="Manual global dogfood next-work signal contract preview"
      data-augnes-authority="preview-only read-only no-next-work-bias no-perspective no-proof no-work no-memory no-metrics"
    >
      <div className="perspective-constellation-shell-header">
        <div>
          <p className="panel-eyebrow">AUGNES / Next-Work Contract</p>
          <h4>Next-work signal decision contract preview</h4>
          <p>
            This contract preview maps manual global dogfood projection cards
            into candidate next-work signal decision material. It does not write
            next-work bias, Perspective, dogfood metrics, proof/evidence, work
            status, memory, product state, or ledger rows.
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
          <span>candidate priority</span>
          <strong>
            {contract.proposed_decision_candidate.candidate_priority_hint}
          </strong>
          <small>{contract.proposed_decision_candidate.decision_status}</small>
        </div>
        <div>
          <span>candidate cards</span>
          <strong>{contract.source_next_work_candidate_card_ids.length}</strong>
          <small>
            flags false{" "}
            {String(
              contract.proposed_decision_inputs
                .selected_card_write_flags_all_false,
            )}
          </small>
        </div>
        <div>
          <span>next-work bias now</span>
          <strong>
            {String(
              contract.proposed_next_work_signal_mapping
                .can_write_next_work_bias_now,
            )}
          </strong>
          <small>Perspective false</small>
        </div>
      </div>

      <div className="perspective-constellation-workspace-grid">
        <NextWorkMappingSummary contract={contract} />
        <DecisionInputSummary contract={contract} />
        <DecisionCandidateSummary contract={contract} />
      </div>

      <section className="cockpit-surface-card">
        <h5>Idempotency contract preview</h5>
        <dl>
          <dt>proposed_idempotency_key</dt>
          <dd>{contract.idempotency_contract_preview.proposed_idempotency_key}</dd>
          <dt>fingerprint_algorithm</dt>
          <dd>{contract.idempotency_contract_preview.fingerprint_algorithm}</dd>
          <dt>would_prevent_duplicate_next_work_signal_write</dt>
          <dd>
            {String(
              contract.idempotency_contract_preview
                .would_prevent_duplicate_next_work_signal_write,
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
            label="can_write_next_work_bias"
            value={contract.authority_boundary.can_write_next_work_bias}
          />
          <BoundaryFlag
            label="can_write_work_item"
            value={contract.authority_boundary.can_write_work_item}
          />
          <BoundaryFlag
            label="can_mutate_work"
            value={contract.authority_boundary.can_mutate_work}
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
            label="can_write_dogfood_metrics"
            value={contract.authority_boundary.can_write_dogfood_metrics}
          />
          <BoundaryFlag
            label="can_write_global_dogfood_ledger"
            value={contract.authority_boundary.can_write_global_dogfood_ledger}
          />
          <BoundaryFlag
            label="can_write_proof_or_evidence"
            value={contract.authority_boundary.can_write_proof_or_evidence}
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
          {nextWorkReviewDecisions.map((decision) => (
            <label key={decision.value}>
              <input
                type="radio"
                name="manual-global-dogfood-next-work-contract-decision"
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
                buildResearchCandidateManualGlobalDogfoodNextWorkSignalReview({
                  next_work_signal_contract: contract,
                  operator_decision: operatorDecision,
                  operator_note: operatorNote,
                }),
              )
            }
          >
            Preview next-work review
          </button>
          <button type="button" onClick={() => setReview(null)}>
            Clear next-work review
          </button>
        </div>
        {review ? <NextWorkReviewPreview review={review} /> : null}
      </section>

      {review?.review_status ===
      "ready_for_future_next_work_signal_write_slice" ? (
        <ResearchCandidateManualGlobalDogfoodNextWorkSignalWritePanel
          nextWorkSignalContract={contract}
          nextWorkSignalReview={review}
        />
      ) : null}

      <p className="manual-note-runtime-hint">
        next_recommended_slice <code>{contract.next_recommended_slice}</code>
      </p>
    </section>
  );
}

function NextWorkMappingSummary({
  contract,
}: {
  contract: ResearchCandidateManualGlobalDogfoodNextWorkSignalContract;
}) {
  const mapping = contract.proposed_next_work_signal_mapping;
  return (
    <section className="cockpit-surface-card">
      <h5>Proposed next-work signal mapping</h5>
      <dl>
        <dt>recommended_next_work_label</dt>
        <dd>{mapping.recommended_next_work_label ?? "none"}</dd>
        <dt>rationale</dt>
        <dd>{mapping.rationale ?? "none"}</dd>
        <dt>outcome_label</dt>
        <dd>{mapping.outcome_label ?? "none"}</dd>
        <dt>outcome_signal</dt>
        <dd>{mapping.outcome_signal ?? "none"}</dd>
        <dt>mismatch_or_gap_summary</dt>
        <dd>{mapping.mismatch_or_gap_summary ?? "none"}</dd>
        <dt>selected_candidate_context_refs</dt>
        <dd>{mapping.selected_candidate_context_refs.length}</dd>
        <dt>can_feed_next_work_signal_decision_candidate</dt>
        <dd>{String(mapping.can_feed_next_work_signal_decision_candidate)}</dd>
        <dt>would_write_next_work_bias</dt>
        <dd>{String(mapping.can_write_next_work_bias_now)}</dd>
      </dl>
    </section>
  );
}

function DecisionInputSummary({
  contract,
}: {
  contract: ResearchCandidateManualGlobalDogfoodNextWorkSignalContract;
}) {
  const inputs = contract.proposed_decision_inputs;
  return (
    <section className="cockpit-surface-card">
      <h5>Proposed decision inputs</h5>
      <dl>
        <dt>source_next_work_candidate_card_ids</dt>
        <dd>{inputs.source_next_work_candidate_card_ids.length}</dd>
        <dt>primary_candidate_card_count</dt>
        <dd>{inputs.primary_candidate_card_count}</dd>
        <dt>selected_card_write_flags_all_false</dt>
        <dd>{String(inputs.selected_card_write_flags_all_false)}</dd>
        <dt>expected_observed_follow_up_candidate</dt>
        <dd>{String(inputs.expected_observed_follow_up_candidate)}</dd>
        <dt>source_fingerprints_present</dt>
        <dd>{String(inputs.source_fingerprints_present)}</dd>
        <dt>writes_now</dt>
        <dd>{String(inputs.writes_now)}</dd>
      </dl>
    </section>
  );
}

function DecisionCandidateSummary({
  contract,
}: {
  contract: ResearchCandidateManualGlobalDogfoodNextWorkSignalContract;
}) {
  const candidate = contract.proposed_decision_candidate;
  return (
    <section className="cockpit-surface-card">
      <h5>Proposed decision candidate</h5>
      <dl>
        <dt>decision_kind</dt>
        <dd>{candidate.decision_kind}</dd>
        <dt>decision_status</dt>
        <dd>{candidate.decision_status}</dd>
        <dt>candidate_priority_hint</dt>
        <dd>{candidate.candidate_priority_hint}</dd>
        <dt>reason</dt>
        <dd>{candidate.reason}</dd>
        <dt>writes_now</dt>
        <dd>{String(candidate.writes_now)}</dd>
      </dl>
    </section>
  );
}

function NextWorkReviewPreview({
  review,
}: {
  review: ResearchCandidateManualGlobalDogfoodNextWorkSignalReview;
}) {
  return (
    <section className="cockpit-surface-card">
      <h6>Next-work review preview</h6>
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
          <dt>recommended_next_work_label</dt>
          <dd>
            {review.accepted_mapping_summary.recommended_next_work_label ??
              "none"}
          </dd>
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
