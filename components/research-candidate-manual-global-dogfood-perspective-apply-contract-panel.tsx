"use client";

import { useEffect, useState } from "react";

import { buildResearchCandidateManualGlobalDogfoodPerspectiveApplyContract } from "@/lib/research-candidate-review/manual-global-dogfood-perspective-apply-contract";
import { buildResearchCandidateManualGlobalDogfoodPerspectiveApplyReview } from "@/lib/research-candidate-review/manual-global-dogfood-perspective-apply-review";
import { ResearchCandidateManualGlobalDogfoodPerspectiveApplyWritePanel } from "@/components/research-candidate-manual-global-dogfood-perspective-apply-write-panel";
import type { ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReadback } from "@/types/research-candidate-manual-global-dogfood-canonical-perspective-update-write";
import type { ResearchCandidateManualGlobalDogfoodPerspectiveApplyContract } from "@/types/research-candidate-manual-global-dogfood-perspective-apply-contract";
import type {
  ResearchCandidateManualGlobalDogfoodPerspectiveApplyReview,
  ResearchCandidateManualGlobalDogfoodPerspectiveApplyReviewDecision,
} from "@/types/research-candidate-manual-global-dogfood-perspective-apply-review";

const reviewDecisions: {
  value: ResearchCandidateManualGlobalDogfoodPerspectiveApplyReviewDecision;
  label: string;
}[] = [
  {
    value: "accept_contract_for_future_perspective_apply_write_slice",
    label: "Accept contract for future Perspective apply slice",
  },
  {
    value: "needs_perspective_apply_mapping_revision",
    label: "Needs Perspective apply mapping revision",
  },
  {
    value: "reject_perspective_apply_contract",
    label: "Reject Perspective apply contract",
  },
  {
    value: "defer_perspective_apply_contract",
    label: "Defer Perspective apply contract",
  },
];

export function ResearchCandidateManualGlobalDogfoodPerspectiveApplyContractPanel({
  readback,
}: {
  readback: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReadback;
}) {
  const [operatorDecision, setOperatorDecision] =
    useState<ResearchCandidateManualGlobalDogfoodPerspectiveApplyReviewDecision>(
      "accept_contract_for_future_perspective_apply_write_slice",
    );
  const [operatorNote, setOperatorNote] = useState("");
  const [review, setReview] =
    useState<ResearchCandidateManualGlobalDogfoodPerspectiveApplyReview | null>(
      null,
    );
  const [reviewContractFingerprint, setReviewContractFingerprint] = useState<
    string | null
  >(null);
  const contract =
    buildResearchCandidateManualGlobalDogfoodPerspectiveApplyContract({
      readback,
      operator_intent_label:
        "research_candidate_manual_global_dogfood_perspective_apply_contract_panel",
    });
  const currentContractFingerprint = contract.validation.contract_fingerprint;
  const reviewAcceptedMappingIdempotencyKey =
    review?.accepted_mapping_summary?.proposed_idempotency_key ?? null;
  const currentReview =
    review &&
    review.source_contract_fingerprint === currentContractFingerprint &&
    (!review.accepted_mapping_summary ||
      reviewAcceptedMappingIdempotencyKey ===
        contract.idempotency_contract_preview.proposed_idempotency_key)
      ? review
      : null;
  const currentAcceptedReview =
    operatorDecision === "accept_contract_for_future_perspective_apply_write_slice" &&
    currentReview?.operator_decision ===
      "accept_contract_for_future_perspective_apply_write_slice" &&
    currentReview?.review_status ===
      "ready_for_future_perspective_apply_write_slice" &&
    currentReview.source_contract_fingerprint === currentContractFingerprint &&
    currentReview.accepted_mapping_summary?.proposed_idempotency_key ===
      contract.idempotency_contract_preview.proposed_idempotency_key;

  useEffect(() => {
    if (
      reviewContractFingerprint &&
      reviewContractFingerprint !== currentContractFingerprint
    ) {
      setReview(null);
      setReviewContractFingerprint(null);
    }
  }, [currentContractFingerprint, reviewContractFingerprint]);

  function clearReview() {
    setReview(null);
    setReviewContractFingerprint(null);
  }

  function updateOperatorDecision(
    nextDecision: ResearchCandidateManualGlobalDogfoodPerspectiveApplyReviewDecision,
  ) {
    setOperatorDecision(nextDecision);
    clearReview();
  }

  function updateOperatorNote(nextNote: string) {
    setOperatorNote(nextNote);
    clearReview();
  }

  function previewReview() {
    const nextReview =
      buildResearchCandidateManualGlobalDogfoodPerspectiveApplyReview({
        perspective_apply_contract: contract,
        operator_decision: operatorDecision,
        operator_note: operatorNote,
      });
    setReview(nextReview);
    setReviewContractFingerprint(currentContractFingerprint);
  }

  return (
    <section
      className="perspective-inspector-section manual-global-dogfood-perspective-apply-contract"
      aria-label="Manual global dogfood Perspective apply contract preview"
      data-augnes-authority="preview-only read-only no-current-working-perspective no-canonical-state no-promotion no-memory no-work no-proof no-metrics"
    >
      <div className="perspective-constellation-shell-header">
        <div>
          <p className="panel-eyebrow">AUGNES / Perspective Apply Contract</p>
          <h4>Perspective apply contract preview</h4>
          <p>
            This preview derives future Perspective apply candidate material
            from active committed manual canonical Perspective update readback.
            It does not update current-working Perspective, directly write
            canonical Perspective state, promote Perspective, write Memory,
            mutate work, write proof/evidence, metrics, product state, or
            source records.
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
          source_canonical_update_receipt{" "}
          <code>
            {contract.source_canonical_perspective_update_receipt_id ?? "none"}
          </code>
        </span>
        <span>
          source_canonical_update_record{" "}
          <code>
            {contract.source_canonical_perspective_update_record_id ?? "none"}
          </code>
        </span>
        <span>
          source_relay{" "}
          <code>{contract.source_perspective_relay_receipt_id ?? "none"}</code>
        </span>
        <span>
          source_signal{" "}
          <code>{contract.source_next_work_signal_receipt_id ?? "none"}</code>
        </span>
        <span>
          source_bias{" "}
          <code>{contract.source_next_work_bias_receipt_id ?? "none"}</code>
        </span>
      </div>

      <div className="perspective-formation-summary-grid">
        <div>
          <span>contract readiness</span>
          <strong>{contract.operator_authorization_mode}</strong>
          <small>blockers {contract.blocker_reasons.length}</small>
        </div>
        <div>
          <span>apply scope hint</span>
          <strong>{contract.proposed_apply_candidate.apply_scope_hint}</strong>
          <small>{contract.proposed_apply_candidate.candidate_status}</small>
        </div>
        <div>
          <span>future target</span>
          <strong>
            {
              contract.proposed_perspective_apply_mapping
                .intended_future_apply_target
            }
          </strong>
          <small>current-working compatibility remains review-only</small>
        </div>
        <div>
          <span>writes now</span>
          <strong>{String(contract.proposed_apply_candidate.writes_now)}</strong>
          <small>apply/state/promotion/memory false</small>
        </div>
      </div>

      <div className="perspective-constellation-workspace-grid">
        <ApplyMappingSummary contract={contract} />
        <ExistingApplyCompatibilitySummary contract={contract} />
        <SourceRefsSummary contract={contract} />
      </div>

      <section className="cockpit-surface-card">
        <h5>Idempotency preview</h5>
        <dl>
          <dt>proposed_idempotency_key</dt>
          <dd>{contract.idempotency_contract_preview.proposed_idempotency_key}</dd>
          <dt>fingerprint_algorithm</dt>
          <dd>{contract.idempotency_contract_preview.fingerprint_algorithm}</dd>
          <dt>would_prevent_duplicate_perspective_apply_write</dt>
          <dd>
            {String(
              contract.idempotency_contract_preview
                .would_prevent_duplicate_perspective_apply_write,
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
          <BoundaryFlag
            label="preview_only"
            value={contract.authority_boundary.preview_only}
          />
          <BoundaryFlag
            label="read_only"
            value={contract.authority_boundary.read_only}
          />
          <BoundaryFlag
            label="can_update_current_working_perspective"
            value={
              contract.authority_boundary.can_update_current_working_perspective
            }
          />
          <BoundaryFlag
            label="can_write_canonical_perspective_state"
            value={
              contract.authority_boundary.can_write_canonical_perspective_state
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
                name="manual-global-dogfood-perspective-apply-decision"
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
            onClick={previewReview}
          >
            Preview Perspective apply review
          </button>
          <button type="button" onClick={clearReview}>
            Clear Perspective apply review
          </button>
        </div>
        {currentReview ? <ApplyReviewPreview review={currentReview} /> : null}
      </section>

      {currentAcceptedReview ? (
        <ResearchCandidateManualGlobalDogfoodPerspectiveApplyWritePanel
          perspectiveApplyContract={contract}
          perspectiveApplyReview={currentReview}
        />
      ) : null}

      <p className="manual-note-runtime-hint">
        This preview does not update current-working Perspective, directly write
        canonical Perspective state, promote Perspective, write Memory, mutate
        work, write proof/evidence, dogfood metrics, product state, source
        records, or canonical project state.
      </p>
      <p className="manual-note-runtime-hint">
        next_recommended_slice <code>{contract.next_recommended_slice}</code>
      </p>
    </section>
  );
}

function ApplyMappingSummary({
  contract,
}: {
  contract: ResearchCandidateManualGlobalDogfoodPerspectiveApplyContract;
}) {
  const mapping = contract.proposed_perspective_apply_mapping;
  return (
    <section className="cockpit-surface-card">
      <h5>Proposed apply mapping</h5>
      <dl>
        <dt>apply_label</dt>
        <dd>{mapping.apply_label ?? "none"}</dd>
        <dt>apply_rationale</dt>
        <dd>{mapping.apply_rationale ?? "none"}</dd>
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

function ExistingApplyCompatibilitySummary({
  contract,
}: {
  contract: ResearchCandidateManualGlobalDogfoodPerspectiveApplyContract;
}) {
  const compatibility = contract.proposed_existing_apply_path_compatibility;
  return (
    <section className="cockpit-surface-card">
      <h5>Existing apply path compatibility</h5>
      <dl>
        <dt>existing_current_working_perspective_update_contract_preview_compatible</dt>
        <dd>
          {String(
            compatibility
              .existing_current_working_perspective_update_contract_preview_compatible,
          )}
        </dd>
        <dt>existing_current_working_perspective_update_contract_write_compatible</dt>
        <dd>
          {String(
            compatibility
              .existing_current_working_perspective_update_contract_write_compatible,
          )}
        </dd>
        <dt>existing_current_working_perspective_apply_preview_compatible</dt>
        <dd>
          {String(
            compatibility.existing_current_working_perspective_apply_preview_compatible,
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
        <dt>recommended_future_mapping_path</dt>
        <dd>{compatibility.recommended_future_mapping_path}</dd>
        <dt>manual_source_refs_preserved</dt>
        <dd>{String(compatibility.manual_source_refs_preserved)}</dd>
        <dt>field_gaps</dt>
        <dd>{compatibility.field_gaps.join(", ") || "none"}</dd>
        <dt>authority_gaps</dt>
        <dd>{compatibility.authority_gaps.join(", ") || "none"}</dd>
        <dt>source_lineage_gaps</dt>
        <dd>{compatibility.source_lineage_gaps.join(", ") || "none"}</dd>
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
  contract: ResearchCandidateManualGlobalDogfoodPerspectiveApplyContract;
}) {
  return (
    <section className="cockpit-surface-card">
      <h5>Source refs</h5>
      <dl>
        <dt>source_canonical_perspective_update_record_fingerprint</dt>
        <dd>
          {contract.source_canonical_perspective_update_record_fingerprint ??
            "none"}
        </dd>
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

function ApplyReviewPreview({
  review,
}: {
  review: ResearchCandidateManualGlobalDogfoodPerspectiveApplyReview;
}) {
  return (
    <section className="cockpit-surface-card">
      <h6>Perspective apply review preview</h6>
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
          <dt>intended_future_apply_target</dt>
          <dd>{review.accepted_mapping_summary.intended_future_apply_target}</dd>
          <dt>apply_label</dt>
          <dd>{review.accepted_mapping_summary.apply_label ?? "none"}</dd>
          <dt>apply_rationale</dt>
          <dd>{review.accepted_mapping_summary.apply_rationale ?? "none"}</dd>
        </dl>
      ) : (
        <ReasonList
          title="Unresolved blockers"
          reasons={review.unresolved_blockers}
        />
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
