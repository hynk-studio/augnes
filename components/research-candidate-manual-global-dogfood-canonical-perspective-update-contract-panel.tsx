"use client";

import { useState } from "react";

import { ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateWritePanel } from "@/components/research-candidate-manual-global-dogfood-canonical-perspective-update-write-panel";
import { buildResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateContract } from "@/lib/research-candidate-review/manual-global-dogfood-canonical-perspective-update-contract";
import { buildResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReview } from "@/lib/research-candidate-review/manual-global-dogfood-canonical-perspective-update-review";
import type { ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateContract } from "@/types/research-candidate-manual-global-dogfood-canonical-perspective-update-contract";
import type {
  ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReview,
  ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReviewDecision,
} from "@/types/research-candidate-manual-global-dogfood-canonical-perspective-update-review";
import type { ResearchCandidateManualGlobalDogfoodPerspectiveRelayReadback } from "@/types/research-candidate-manual-global-dogfood-perspective-relay-write";

const reviewDecisions: {
  value: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReviewDecision;
  label: string;
}[] = [
  {
    value: "accept_contract_for_future_canonical_perspective_update_write_slice",
    label: "Accept contract for future canonical update slice",
  },
  {
    value: "needs_canonical_perspective_mapping_revision",
    label: "Needs canonical mapping revision",
  },
  {
    value: "reject_canonical_perspective_update_contract",
    label: "Reject canonical update contract",
  },
  {
    value: "defer_canonical_perspective_update_contract",
    label: "Defer canonical update contract",
  },
];

const acceptedReviewDecision: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReviewDecision =
  "accept_contract_for_future_canonical_perspective_update_write_slice";

export function ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateContractPanel({
  readback,
}: {
  readback: ResearchCandidateManualGlobalDogfoodPerspectiveRelayReadback;
}) {
  const [operatorDecision, setOperatorDecision] =
    useState<ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReviewDecision>(
      "accept_contract_for_future_canonical_perspective_update_write_slice",
    );
  const [operatorNote, setOperatorNote] = useState("");
  const [review, setReview] =
    useState<ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReview | null>(
      null,
    );
  const contract =
    buildResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateContract({
      readback,
      operator_intent_label:
        "research_candidate_manual_global_dogfood_canonical_perspective_update_contract_panel",
    });
  const currentAcceptedReview =
    operatorDecision === acceptedReviewDecision &&
    review?.operator_decision === acceptedReviewDecision &&
    review?.review_status ===
      "ready_for_future_canonical_perspective_update_write_slice" &&
    review?.source_contract_fingerprint ===
      contract.validation.contract_fingerprint &&
    review?.accepted_mapping_summary?.source_contract_fingerprint ===
      contract.validation.contract_fingerprint &&
    review?.accepted_mapping_summary?.proposed_idempotency_key ===
      contract.idempotency_contract_preview.proposed_idempotency_key;

  function updateOperatorDecision(
    nextDecision: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReviewDecision,
  ) {
    setOperatorDecision(nextDecision);
    setReview(null);
  }

  function updateOperatorNote(nextNote: string) {
    setOperatorNote(nextNote);
    setReview(null);
  }

  return (
    <section
      className="perspective-inspector-section manual-global-dogfood-canonical-perspective-update-contract"
      aria-label="Manual global dogfood canonical Perspective update contract preview"
      data-augnes-authority="preview-only read-only no-canonical-perspective-write no-promotion no-memory no-work no-proof no-metrics"
    >
      <div className="perspective-constellation-shell-header">
        <div>
          <p className="panel-eyebrow">AUGNES / Canonical Perspective Contract</p>
          <h4>Canonical Perspective update contract preview</h4>
          <p>
            This preview derives canonical Perspective update candidate material
            from active committed manual Perspective relay readback. It does not
            write canonical Perspective state, update current working
            Perspective, promote Perspective, write Memory, mutate work, write
            proof/evidence, metrics, product state, or source records.
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
          source_relay_receipt{" "}
          <code>{contract.source_perspective_relay_receipt_id ?? "none"}</code>
        </span>
        <span>
          source_relay_record{" "}
          <code>{contract.source_perspective_relay_record_id ?? "none"}</code>
        </span>
        <span>
          source_signal{" "}
          <code>{contract.source_next_work_signal_receipt_id ?? "none"}</code>
        </span>
        <span>
          source_bias{" "}
          <code>{contract.source_next_work_bias_receipt_id ?? "none"}</code>
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
          <span>candidate status</span>
          <strong>
            {contract.proposed_perspective_update_candidate.update_scope_hint}
          </strong>
          <small>
            {contract.proposed_perspective_update_candidate.candidate_status}
          </small>
        </div>
        <div>
          <span>context refs</span>
          <strong>
            {
              contract.proposed_canonical_perspective_update_mapping
                .selected_candidate_context_refs.length
            }
          </strong>
          <small>
            cards{" "}
            {
              contract.proposed_canonical_perspective_update_mapping
                .source_next_work_candidate_card_ids.length
            }
          </small>
        </div>
        <div>
          <span>writes now</span>
          <strong>
            {String(contract.proposed_perspective_update_candidate.writes_now)}
          </strong>
          <small>canonical/promotion/memory false</small>
        </div>
      </div>

      <div className="perspective-constellation-workspace-grid">
        <CanonicalMappingSummary contract={contract} />
        <ExistingCompatibilitySummary contract={contract} />
        <SourceRefsSummary contract={contract} />
      </div>

      <section className="cockpit-surface-card">
        <h5>Idempotency preview</h5>
        <dl>
          <dt>proposed_idempotency_key</dt>
          <dd>{contract.idempotency_contract_preview.proposed_idempotency_key}</dd>
          <dt>fingerprint_algorithm</dt>
          <dd>{contract.idempotency_contract_preview.fingerprint_algorithm}</dd>
          <dt>would_prevent_duplicate_canonical_perspective_update_write</dt>
          <dd>
            {String(
              contract.idempotency_contract_preview
                .would_prevent_duplicate_canonical_perspective_update_write,
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
            label="can_write_canonical_perspective_state"
            value={
              contract.authority_boundary
                .can_write_canonical_perspective_state
            }
          />
          <BoundaryFlag
            label="can_update_current_working_perspective"
            value={
              contract.authority_boundary.can_update_current_working_perspective
            }
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
            label="can_mutate_work"
            value={contract.authority_boundary.can_mutate_work}
          />
          <BoundaryFlag
            label="can_write_proof_or_evidence"
            value={contract.authority_boundary.can_write_proof_or_evidence}
          />
          <BoundaryFlag
            label="can_write_dogfood_metrics"
            value={contract.authority_boundary.can_write_dogfood_metrics}
          />
        </div>
      </section>

      <section className="cockpit-surface-card">
        <h5>Local operator review preview</h5>
        <fieldset className="perspective-detail-stack">
          <legend>Operator decision</legend>
          {reviewDecisions.map((decision) => (
            <label key={decision.value}>
              <input
                type="radio"
                name="manual-global-dogfood-canonical-perspective-update-decision"
                value={decision.value}
                checked={operatorDecision === decision.value}
                onChange={() => updateOperatorDecision(decision.value)}
              />{" "}
              {decision.label}
            </label>
          ))}
        </fieldset>
        <label>
          Local-only operator note
          <textarea
            value={operatorNote}
            onChange={(event) => updateOperatorNote(event.target.value)}
            rows={3}
            placeholder="Optional local note; not persisted or sent."
          />
        </label>
        <div className="perspective-workbench-status-row">
          <button
            type="button"
            onClick={() =>
              setReview(
                buildResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReview({
                  canonical_perspective_update_contract: contract,
                  operator_decision: operatorDecision,
                  operator_note: operatorNote,
                }),
              )
            }
          >
            Preview canonical Perspective review
          </button>
          <button type="button" onClick={() => setReview(null)}>
            Clear canonical Perspective review
          </button>
        </div>
        {review ? <CanonicalReviewPreview review={review} /> : null}
      </section>

      {currentAcceptedReview ? (
        <ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateWritePanel
          canonicalPerspectiveUpdateContract={contract}
          canonicalPerspectiveUpdateReview={review}
        />
      ) : null}

      <p className="manual-note-runtime-hint">
        This preview does not write canonical Perspective state, update current
        working Perspective, promote Perspective, write Memory, mutate work,
        write proof/evidence, dogfood metrics, product state, source records, or
        canonical state.
      </p>
      <p className="manual-note-runtime-hint">
        next_recommended_slice <code>{contract.next_recommended_slice}</code>
      </p>
    </section>
  );
}

function CanonicalMappingSummary({
  contract,
}: {
  contract: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateContract;
}) {
  const mapping = contract.proposed_canonical_perspective_update_mapping;
  return (
    <section className="cockpit-surface-card">
      <h5>Proposed canonical update mapping</h5>
      <dl>
        <dt>canonical_update_label</dt>
        <dd>{mapping.canonical_update_label ?? "none"}</dd>
        <dt>canonical_update_rationale</dt>
        <dd>{mapping.canonical_update_rationale ?? "none"}</dd>
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
      </dl>
    </section>
  );
}

function ExistingCompatibilitySummary({
  contract,
}: {
  contract: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateContract;
}) {
  const compatibility =
    contract.proposed_existing_perspective_update_compatibility;
  return (
    <section className="cockpit-surface-card">
      <h5>Existing Perspective update compatibility</h5>
      <dl>
        <dt>existing_current_working_perspective_update_contract_compatible</dt>
        <dd>
          {String(
            compatibility
              .existing_current_working_perspective_update_contract_compatible,
          )}
        </dd>
        <dt>existing_current_working_perspective_apply_write_compatible</dt>
        <dd>
          {String(
            compatibility.existing_current_working_perspective_apply_write_compatible,
          )}
        </dd>
        <dt>existing_route_integration_contract_compatible</dt>
        <dd>{String(compatibility.existing_route_integration_contract_compatible)}</dd>
        <dt>manual_source_refs_preserved</dt>
        <dd>{String(compatibility.manual_source_refs_preserved)}</dd>
        <dt>field_gaps</dt>
        <dd>{compatibility.field_gaps.join(", ") || "none"}</dd>
        <dt>authority_gaps</dt>
        <dd>{compatibility.authority_gaps.join(", ") || "none"}</dd>
      </dl>
      <ReasonList
        title="Compatibility notes"
        reasons={compatibility.compatibility_notes}
      />
    </section>
  );
}

function SourceRefsSummary({
  contract,
}: {
  contract: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateContract;
}) {
  return (
    <section className="cockpit-surface-card">
      <h5>Source refs</h5>
      <dl>
        <dt>source_perspective_relay_record_fingerprint</dt>
        <dd>{contract.source_perspective_relay_record_fingerprint ?? "none"}</dd>
        <dt>source_next_work_signal_record_fingerprint</dt>
        <dd>{contract.source_next_work_signal_record_fingerprint ?? "none"}</dd>
        <dt>source_next_work_bias_record_fingerprint</dt>
        <dd>{contract.source_next_work_bias_record_fingerprint ?? "none"}</dd>
        <dt>source_projection_fingerprint</dt>
        <dd>{contract.source_projection_fingerprint ?? "none"}</dd>
        <dt>source_global_dogfood_ledger_receipt_id</dt>
        <dd>{contract.source_global_dogfood_ledger_receipt_id ?? "none"}</dd>
        <dt>source_global_dogfood_ledger_record_id</dt>
        <dd>{contract.source_global_dogfood_ledger_record_id ?? "none"}</dd>
        <dt>source_metric_snapshot_receipt_id</dt>
        <dd>{contract.source_metric_snapshot_receipt_id ?? "none"}</dd>
        <dt>source_metric_snapshot_record_id</dt>
        <dd>{contract.source_metric_snapshot_record_id ?? "none"}</dd>
        <dt>source_manual_receipt_id</dt>
        <dd>{contract.source_manual_receipt_id ?? "none"}</dd>
        <dt>source_expected_observed_delta_record_ref</dt>
        <dd>{contract.source_expected_observed_delta_record_ref ?? "none"}</dd>
        <dt>source_reuse_outcome_record_ref</dt>
        <dd>{contract.source_reuse_outcome_record_ref ?? "none"}</dd>
      </dl>
    </section>
  );
}

function CanonicalReviewPreview({
  review,
}: {
  review: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReview;
}) {
  return (
    <section className="cockpit-surface-card">
      <h6>Canonical Perspective review preview</h6>
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
          <dt>canonical_update_label</dt>
          <dd>
            {review.accepted_mapping_summary.canonical_update_label ?? "none"}
          </dd>
          <dt>canonical_update_rationale</dt>
          <dd>
            {review.accepted_mapping_summary.canonical_update_rationale ??
              "none"}
          </dd>
        </dl>
      ) : (
        <ReasonList title="Unresolved blockers" reasons={review.unresolved_blockers} />
      )}
    </section>
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
        <p>None.</p>
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
