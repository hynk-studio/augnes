"use client";

import { useState } from "react";

import { buildResearchCandidateManualGlobalDogfoodPerspectiveRelayContract } from "@/lib/research-candidate-review/manual-global-dogfood-perspective-relay-contract";
import { buildResearchCandidateManualGlobalDogfoodPerspectiveRelayReview } from "@/lib/research-candidate-review/manual-global-dogfood-perspective-relay-review";
import { ResearchCandidateManualGlobalDogfoodPerspectiveRelayWritePanel } from "@/components/research-candidate-manual-global-dogfood-perspective-relay-write-panel";
import type { ResearchCandidateManualGlobalDogfoodPerspectiveRelayContract } from "@/types/research-candidate-manual-global-dogfood-perspective-relay-contract";
import type {
  ResearchCandidateManualGlobalDogfoodPerspectiveRelayReview,
  ResearchCandidateManualGlobalDogfoodPerspectiveRelayReviewDecision,
} from "@/types/research-candidate-manual-global-dogfood-perspective-relay-review";
import type { ResearchCandidateManualGlobalDogfoodNextWorkSignalReadback } from "@/types/research-candidate-manual-global-dogfood-next-work-signal-write";

const relayReviewDecisions: {
  value: ResearchCandidateManualGlobalDogfoodPerspectiveRelayReviewDecision;
  label: string;
}[] = [
  {
    value: "accept_contract_for_future_perspective_relay_write_slice",
    label: "Accept contract for future relay slice",
  },
  {
    value: "needs_perspective_relay_mapping_revision",
    label: "Needs relay mapping revision",
  },
  {
    value: "reject_perspective_relay_contract",
    label: "Reject relay contract",
  },
  {
    value: "defer_perspective_relay_contract",
    label: "Defer relay contract",
  },
];

export function ResearchCandidateManualGlobalDogfoodPerspectiveRelayContractPanel({
  readback,
}: {
  readback: ResearchCandidateManualGlobalDogfoodNextWorkSignalReadback;
}) {
  const [operatorDecision, setOperatorDecision] =
    useState<ResearchCandidateManualGlobalDogfoodPerspectiveRelayReviewDecision>(
      "accept_contract_for_future_perspective_relay_write_slice",
    );
  const [operatorNote, setOperatorNote] = useState("");
  const [review, setReview] =
    useState<ResearchCandidateManualGlobalDogfoodPerspectiveRelayReview | null>(
      null,
    );
  const contract =
    buildResearchCandidateManualGlobalDogfoodPerspectiveRelayContract({
      readback,
      operator_intent_label:
        "research_candidate_manual_global_dogfood_perspective_relay_contract_panel",
    });

  return (
    <section
      className="perspective-inspector-section manual-global-dogfood-perspective-relay-contract"
      aria-label="Manual global dogfood Perspective relay contract preview"
      data-augnes-authority="preview-only read-only no-perspective-relay-write no-promotion no-memory no-bias no-work no-proof no-metrics"
    >
      <div className="perspective-constellation-shell-header">
        <div>
          <p className="panel-eyebrow">AUGNES / Perspective Relay Contract</p>
          <h4>Perspective relay update contract preview</h4>
          <p>
            This preview derives candidate Perspective relay material from the
            active committed manual next-work signal decision record. It does
            not write Perspective relay/state, promote Perspective, write
            memory, next-work bias, work status, proof/evidence, metrics,
            product state, or source records.
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
          source_next_work_signal_receipt{" "}
          <code>{contract.source_next_work_signal_receipt_id ?? "none"}</code>
        </span>
        <span>
          source_next_work_signal_record{" "}
          <code>{contract.source_next_work_signal_record_id ?? "none"}</code>
        </span>
        <span>
          source_projection_fingerprint{" "}
          <code>{contract.source_projection_fingerprint ?? "none"}</code>
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
          <span>relay candidate</span>
          <strong>
            {contract.proposed_relay_update_candidate.relay_scope_hint}
          </strong>
          <small>{contract.proposed_relay_update_candidate.candidate_status}</small>
        </div>
        <div>
          <span>candidate context refs</span>
          <strong>
            {
              contract.proposed_perspective_relay_mapping
                .selected_candidate_context_refs.length
            }
          </strong>
          <small>
            manual-only{" "}
            {
              contract.proposed_perspective_relay_mapping
                .manual_only_context_refs.length
            }
          </small>
        </div>
        <div>
          <span>writes now</span>
          <strong>
            {String(contract.proposed_relay_update_candidate.writes_now)}
          </strong>
          <small>promotion/memory false</small>
        </div>
      </div>

      <div className="perspective-constellation-workspace-grid">
        <RelayMappingSummary contract={contract} />
        <RelayCandidateSummary contract={contract} />
        <RelaySourceRefSummary contract={contract} />
      </div>

      <section className="cockpit-surface-card">
        <h5>Idempotency preview</h5>
        <dl>
          <dt>proposed_idempotency_key</dt>
          <dd>{contract.idempotency_contract_preview.proposed_idempotency_key}</dd>
          <dt>fingerprint_algorithm</dt>
          <dd>{contract.idempotency_contract_preview.fingerprint_algorithm}</dd>
          <dt>would_prevent_duplicate_perspective_relay_write</dt>
          <dd>
            {String(
              contract.idempotency_contract_preview
                .would_prevent_duplicate_perspective_relay_write,
            )}
          </dd>
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
            label="can_write_perspective_relay"
            value={contract.authority_boundary.can_write_perspective_relay}
          />
          <BoundaryFlag
            label="can_write_perspective_state"
            value={contract.authority_boundary.can_write_perspective_state}
          />
          <BoundaryFlag
            label="can_promote_perspective"
            value={contract.authority_boundary.can_promote_perspective}
          />
          <BoundaryFlag
            label="can_write_perspective_memory"
            value={contract.authority_boundary.can_write_perspective_memory}
          />
          <BoundaryFlag
            label="can_write_next_work_bias"
            value={contract.authority_boundary.can_write_next_work_bias}
          />
          <BoundaryFlag
            label="can_mutate_work"
            value={contract.authority_boundary.can_mutate_work}
          />
          <BoundaryFlag
            label="can_write_dogfood_metrics"
            value={contract.authority_boundary.can_write_dogfood_metrics}
          />
          <BoundaryFlag
            label="can_write_proof_or_evidence"
            value={contract.authority_boundary.can_write_proof_or_evidence}
          />
        </div>
      </section>

      <section className="cockpit-surface-card">
        <h5>Local operator review preview</h5>
        <fieldset className="perspective-detail-stack">
          <legend>Operator decision</legend>
          {relayReviewDecisions.map((decision) => (
            <label key={decision.value}>
              <input
                type="radio"
                name="manual-global-dogfood-perspective-relay-decision"
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
                buildResearchCandidateManualGlobalDogfoodPerspectiveRelayReview({
                  perspective_relay_contract: contract,
                  operator_decision: operatorDecision,
                  operator_note: operatorNote,
                }),
              )
            }
          >
            Preview relay review
          </button>
          <button type="button" onClick={() => setReview(null)}>
            Clear relay review
          </button>
        </div>
        {review ? <RelayReviewPreview review={review} /> : null}
      </section>

      <p className="manual-note-runtime-hint">
        This preview does not write Perspective relay/state, promote
        Perspective, write memory, next-work bias, work status, proof/evidence,
        dogfood metrics, product state, or canonical state.
      </p>
      {review?.review_status ===
      "ready_for_future_perspective_relay_write_slice" ? (
        <ResearchCandidateManualGlobalDogfoodPerspectiveRelayWritePanel
          perspectiveRelayContract={contract}
          perspectiveRelayReview={review}
        />
      ) : null}
      <p className="manual-note-runtime-hint">
        next_recommended_slice <code>{contract.next_recommended_slice}</code>
      </p>
    </section>
  );
}

function RelayMappingSummary({
  contract,
}: {
  contract: ResearchCandidateManualGlobalDogfoodPerspectiveRelayContract;
}) {
  const mapping = contract.proposed_perspective_relay_mapping;
  return (
    <section className="cockpit-surface-card">
      <h5>Proposed relay mapping</h5>
      <dl>
        <dt>relay_update_label</dt>
        <dd>{mapping.relay_update_label ?? "none"}</dd>
        <dt>relay_update_rationale</dt>
        <dd>{mapping.relay_update_rationale ?? "none"}</dd>
        <dt>recommended_next_work_label</dt>
        <dd>{mapping.recommended_next_work_label ?? "none"}</dd>
        <dt>outcome_signal</dt>
        <dd>{mapping.outcome_signal ?? "none"}</dd>
        <dt>expected_summary</dt>
        <dd>{mapping.expected_summary ?? "none"}</dd>
        <dt>observed_summary</dt>
        <dd>{mapping.observed_summary ?? "none"}</dd>
        <dt>mismatch_or_gap_summary</dt>
        <dd>{mapping.mismatch_or_gap_summary ?? "none"}</dd>
        <dt>can_feed_perspective_relay_update_candidate</dt>
        <dd>{String(mapping.can_feed_perspective_relay_update_candidate)}</dd>
      </dl>
    </section>
  );
}

function RelayCandidateSummary({
  contract,
}: {
  contract: ResearchCandidateManualGlobalDogfoodPerspectiveRelayContract;
}) {
  const candidate = contract.proposed_relay_update_candidate;
  return (
    <section className="cockpit-surface-card">
      <h5>Proposed relay candidate</h5>
      <dl>
        <dt>candidate_kind</dt>
        <dd>{candidate.candidate_kind}</dd>
        <dt>candidate_status</dt>
        <dd>{candidate.candidate_status}</dd>
        <dt>relay_scope_hint</dt>
        <dd>{candidate.relay_scope_hint}</dd>
        <dt>writes_now</dt>
        <dd>{String(candidate.writes_now)}</dd>
        <dt>would_promote_perspective</dt>
        <dd>{String(candidate.would_promote_perspective)}</dd>
        <dt>would_write_memory</dt>
        <dd>{String(candidate.would_write_memory)}</dd>
        <dt>would_write_next_work_bias</dt>
        <dd>{String(candidate.would_write_next_work_bias)}</dd>
      </dl>
    </section>
  );
}

function RelaySourceRefSummary({
  contract,
}: {
  contract: ResearchCandidateManualGlobalDogfoodPerspectiveRelayContract;
}) {
  return (
    <section className="cockpit-surface-card">
      <h5>Source refs</h5>
      <dl>
        <dt>global_dogfood_ledger_receipt</dt>
        <dd>{contract.source_global_dogfood_ledger_receipt_id ?? "none"}</dd>
        <dt>metric_snapshot_receipt</dt>
        <dd>{contract.source_metric_snapshot_receipt_id ?? "none"}</dd>
        <dt>manual_receipt</dt>
        <dd>{contract.source_manual_receipt_id ?? "none"}</dd>
        <dt>expected_observed_delta_record_ref</dt>
        <dd>{contract.source_expected_observed_delta_record_ref ?? "none"}</dd>
        <dt>reuse_outcome_record_ref</dt>
        <dd>{contract.source_reuse_outcome_record_ref ?? "none"}</dd>
      </dl>
    </section>
  );
}

function RelayReviewPreview({
  review,
}: {
  review: ResearchCandidateManualGlobalDogfoodPerspectiveRelayReview;
}) {
  return (
    <section className="cockpit-surface-card">
      <h6>Relay review preview</h6>
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
          <dt>accepted_source_contract_fingerprint</dt>
          <dd>{review.accepted_mapping_summary.source_contract_fingerprint}</dd>
          <dt>accepted_idempotency_key</dt>
          <dd>{review.accepted_mapping_summary.proposed_idempotency_key}</dd>
          <dt>relay_update_label</dt>
          <dd>{review.accepted_mapping_summary.relay_update_label ?? "none"}</dd>
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
      {reasons.length > 0 ? (
        <ul>
          {reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      ) : (
        <p>No {title.toLowerCase()}.</p>
      )}
    </section>
  );
}
