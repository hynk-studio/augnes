"use client";

import { useEffect, useState } from "react";

import { buildResearchCandidateManualGlobalDogfoodPerspectiveStateMutationContract } from "@/lib/research-candidate-review/manual-global-dogfood-perspective-state-mutation-contract";
import { buildResearchCandidateManualGlobalDogfoodPerspectiveStateMutationReview } from "@/lib/research-candidate-review/manual-global-dogfood-perspective-state-mutation-review";
import { ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationWritePanel } from "@/components/research-candidate-manual-global-dogfood-perspective-state-mutation-write-panel";
import type { ResearchCandidateManualGlobalDogfoodPerspectiveApplyReadback } from "@/types/research-candidate-manual-global-dogfood-perspective-apply-write";
import type { ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationContract } from "@/types/research-candidate-manual-global-dogfood-perspective-state-mutation-contract";
import type {
  ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationReview,
  ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationReviewDecision,
} from "@/types/research-candidate-manual-global-dogfood-perspective-state-mutation-review";

const reviewDecisions: {
  value: ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationReviewDecision;
  label: string;
}[] = [
  {
    value: "accept_contract_for_future_perspective_state_mutation_write_slice",
    label: "Accept contract for future Perspective state mutation slice",
  },
  {
    value: "needs_perspective_state_mutation_mapping_revision",
    label: "Needs Perspective state mutation mapping revision",
  },
  {
    value: "reject_perspective_state_mutation_contract",
    label: "Reject Perspective state mutation contract",
  },
  {
    value: "defer_perspective_state_mutation_contract",
    label: "Defer Perspective state mutation contract",
  },
];

export function ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationContractPanel({
  readback,
}: {
  readback: ResearchCandidateManualGlobalDogfoodPerspectiveApplyReadback;
}) {
  const [operatorDecision, setOperatorDecision] =
    useState<ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationReviewDecision>(
      "accept_contract_for_future_perspective_state_mutation_write_slice",
    );
  const [operatorNote, setOperatorNote] = useState("");
  const [review, setReview] =
    useState<ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationReview | null>(
      null,
    );
  const [reviewContractFingerprint, setReviewContractFingerprint] = useState<
    string | null
  >(null);
  const contract =
    buildResearchCandidateManualGlobalDogfoodPerspectiveStateMutationContract({
      readback,
      operator_intent_label:
        "research_candidate_manual_global_dogfood_perspective_state_mutation_contract_panel",
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
    operatorDecision ===
      "accept_contract_for_future_perspective_state_mutation_write_slice" &&
    currentReview?.operator_decision ===
      "accept_contract_for_future_perspective_state_mutation_write_slice" &&
    currentReview?.review_status ===
      "ready_for_future_perspective_state_mutation_write_slice" &&
    currentReview.source_contract_fingerprint === currentContractFingerprint &&
    currentReview.accepted_mapping_summary?.proposed_idempotency_key ===
      contract.idempotency_contract_preview.proposed_idempotency_key
      ? currentReview
      : null;

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
    nextDecision: ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationReviewDecision,
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
      buildResearchCandidateManualGlobalDogfoodPerspectiveStateMutationReview({
        perspective_state_mutation_contract: contract,
        operator_decision: operatorDecision,
        operator_note: operatorNote,
      });
    setReview(nextReview);
    setReviewContractFingerprint(currentContractFingerprint);
  }

  return (
    <section
      className="perspective-inspector-section manual-global-dogfood-perspective-state-mutation-contract"
      aria-label="Manual global dogfood Perspective state mutation contract preview"
      data-augnes-authority="preview-only read-only no-current-working-perspective no-canonical-state no-promotion no-memory no-work no-proof no-metrics"
    >
      <div className="perspective-constellation-shell-header">
        <div>
          <p className="panel-eyebrow">
            AUGNES / Perspective State Mutation Contract
          </p>
          <h4>Perspective state mutation contract preview</h4>
          <p>
            This preview derives future state mutation candidate material from
            active committed manual Perspective apply readback. It does not
            update current-working Perspective, directly write canonical
            Perspective state, promote Perspective, write Memory, mutate work,
            write proof/evidence, metrics, product state, or source records.
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
          source_apply_receipt{" "}
          <code>{contract.source_perspective_apply_receipt_id ?? "none"}</code>
        </span>
        <span>
          source_apply_record{" "}
          <code>{contract.source_perspective_apply_record_id ?? "none"}</code>
        </span>
        <span>
          source_canonical_update{" "}
          <code>
            {contract.source_canonical_perspective_update_receipt_id ?? "none"}
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
          <span>mutation scope hint</span>
          <strong>
            {contract.proposed_state_mutation_candidate.mutation_scope_hint}
          </strong>
          <small>
            {contract.proposed_state_mutation_candidate.candidate_status}
          </small>
        </div>
        <div>
          <span>future target</span>
          <strong>
            {
              contract.proposed_state_mutation_mapping
                .intended_future_mutation_target
            }
          </strong>
          <small>current-working compatibility remains review-only</small>
        </div>
        <div>
          <span>writes now</span>
          <strong>
            {String(contract.proposed_state_mutation_candidate.writes_now)}
          </strong>
          <small>current-working/state/promotion/memory false</small>
        </div>
      </div>

      <div className="perspective-constellation-workspace-grid">
        <StateMutationMappingSummary contract={contract} />
        <ExistingStateApplyCompatibilitySummary contract={contract} />
        <SourceRefsSummary contract={contract} />
      </div>

      <section className="cockpit-surface-card">
        <h5>Idempotency preview</h5>
        <dl>
          <dt>proposed_idempotency_key</dt>
          <dd>{contract.idempotency_contract_preview.proposed_idempotency_key}</dd>
          <dt>fingerprint_algorithm</dt>
          <dd>{contract.idempotency_contract_preview.fingerprint_algorithm}</dd>
          <dt>would_prevent_duplicate_perspective_state_mutation_write</dt>
          <dd>
            {String(
              contract.idempotency_contract_preview
                .would_prevent_duplicate_perspective_state_mutation_write,
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
              contract.authority_boundary
                .can_update_current_working_perspective
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
            label="can_write_work_item"
            value={contract.authority_boundary.can_write_work_item}
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
        <p>
          This review is local React state only. Operator note text is not
          persisted and is excluded from future write idempotency material.
        </p>
        <div className="manual-review-decision-list">
          {reviewDecisions.map((decision) => (
            <label key={decision.value}>
              <input
                type="radio"
                name="manual-perspective-state-mutation-review-decision"
                value={decision.value}
                checked={operatorDecision === decision.value}
                onChange={() => updateOperatorDecision(decision.value)}
              />
              <span>{decision.label}</span>
            </label>
          ))}
        </div>
        <label className="manual-note-field">
          <span>Optional local-only operator note</span>
          <textarea
            value={operatorNote}
            onChange={(event) => updateOperatorNote(event.target.value)}
            placeholder="Local preview note; not persisted"
          />
        </label>
        <div className="manual-note-action-row">
          <button type="button" onClick={previewReview}>
            Preview local state mutation review
          </button>
          <button type="button" onClick={clearReview}>
            Clear review
          </button>
        </div>
        {currentReview ? (
          <StateMutationReviewPreview review={currentReview} />
        ) : null}
      </section>
      {currentAcceptedReview ? (
        <ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationWritePanel
          perspectiveStateMutationContract={contract}
          perspectiveStateMutationReview={currentAcceptedReview}
        />
      ) : null}
    </section>
  );
}

function StateMutationMappingSummary({
  contract,
}: {
  contract: ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationContract;
}) {
  const mapping = contract.proposed_state_mutation_mapping;
  return (
    <section className="cockpit-surface-card">
      <h5>Proposed state mutation mapping</h5>
      <dl>
        <dt>mutation_label</dt>
        <dd>{mapping.mutation_label ?? "missing"}</dd>
        <dt>mutation_rationale</dt>
        <dd>{mapping.mutation_rationale ?? "missing"}</dd>
        <dt>apply_label</dt>
        <dd>{mapping.apply_label ?? "missing"}</dd>
        <dt>canonical_update_label</dt>
        <dd>{mapping.canonical_update_label ?? "missing"}</dd>
        <dt>relay_update_label</dt>
        <dd>{mapping.relay_update_label ?? "missing"}</dd>
        <dt>intended_future_mutation_target</dt>
        <dd>{mapping.intended_future_mutation_target}</dd>
        <dt>expected_summary</dt>
        <dd>{mapping.expected_summary ?? "missing"}</dd>
        <dt>observed_summary</dt>
        <dd>{mapping.observed_summary ?? "missing"}</dd>
        <dt>mismatch_or_gap_summary</dt>
        <dd>{mapping.mismatch_or_gap_summary ?? "missing"}</dd>
        <dt>source_line</dt>
        <dd>{mapping.source_line ?? "none"}</dd>
      </dl>
    </section>
  );
}

function ExistingStateApplyCompatibilitySummary({
  contract,
}: {
  contract: ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationContract;
}) {
  const compatibility = contract.proposed_existing_state_apply_compatibility;
  return (
    <section className="cockpit-surface-card">
      <h5>Existing state/apply path compatibility</h5>
      <dl>
        <dt>current_working_update_contract_preview</dt>
        <dd>
          {String(
            compatibility
              .existing_current_working_perspective_update_contract_preview_compatible,
          )}
        </dd>
        <dt>current_working_update_contract_write</dt>
        <dd>
          {String(
            compatibility
              .existing_current_working_perspective_update_contract_write_compatible,
          )}
        </dd>
        <dt>current_working_apply_preview</dt>
        <dd>
          {String(
            compatibility
              .existing_current_working_perspective_apply_preview_compatible,
          )}
        </dd>
        <dt>current_working_apply_write</dt>
        <dd>
          {String(
            compatibility
              .existing_current_working_perspective_apply_write_compatible,
          )}
        </dd>
        <dt>recommended_future_mapping_path</dt>
        <dd>{compatibility.recommended_future_mapping_path}</dd>
      </dl>
      <ReasonList title="Compatibility notes" reasons={compatibility.compatibility_notes} />
      <ReasonList title="Field gaps" reasons={compatibility.field_gaps} />
      <ReasonList title="Authority gaps" reasons={compatibility.authority_gaps} />
      <ReasonList
        title="Source lineage gaps"
        reasons={compatibility.source_lineage_gaps}
      />
    </section>
  );
}

function SourceRefsSummary({
  contract,
}: {
  contract: ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationContract;
}) {
  return (
    <section className="cockpit-surface-card">
      <h5>Manual source refs preserved</h5>
      <dl>
        <dt>source_projection_fingerprint</dt>
        <dd>{contract.source_projection_fingerprint ?? "missing"}</dd>
        <dt>source_global_dogfood_ledger_receipt_id</dt>
        <dd>{contract.source_global_dogfood_ledger_receipt_id ?? "missing"}</dd>
        <dt>source_global_dogfood_ledger_record_id</dt>
        <dd>{contract.source_global_dogfood_ledger_record_id ?? "missing"}</dd>
        <dt>source_metric_snapshot_receipt_id</dt>
        <dd>{contract.source_metric_snapshot_receipt_id ?? "missing"}</dd>
        <dt>source_metric_snapshot_record_id</dt>
        <dd>{contract.source_metric_snapshot_record_id ?? "missing"}</dd>
        <dt>source_manual_receipt_id</dt>
        <dd>{contract.source_manual_receipt_id ?? "missing"}</dd>
        <dt>source_handoff_seed_fingerprint</dt>
        <dd>{contract.source_handoff_seed_fingerprint ?? "missing"}</dd>
        <dt>source_result_text_fingerprint</dt>
        <dd>{contract.source_result_text_fingerprint ?? "missing"}</dd>
        <dt>source_expected_observed_delta_record_ref</dt>
        <dd>
          {contract.source_expected_observed_delta_record_ref ?? "missing"}
        </dd>
        <dt>source_reuse_outcome_record_ref</dt>
        <dd>{contract.source_reuse_outcome_record_ref ?? "missing"}</dd>
      </dl>
    </section>
  );
}

function StateMutationReviewPreview({
  review,
}: {
  review: ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationReview;
}) {
  return (
    <section className="cockpit-surface-card">
      <h5>State mutation review preview</h5>
      <dl>
        <dt>review_status</dt>
        <dd>{review.review_status}</dd>
        <dt>operator_decision</dt>
        <dd>{review.operator_decision}</dd>
        <dt>source_contract_fingerprint</dt>
        <dd>{review.source_contract_fingerprint}</dd>
        <dt>review_fingerprint</dt>
        <dd>{review.validation.review_fingerprint}</dd>
        <dt>operator_note_persisted</dt>
        <dd>{String(review.validation.operator_note_persisted)}</dd>
        <dt>no_write_authority</dt>
        <dd>{String(review.validation.no_write_authority)}</dd>
      </dl>
      {review.accepted_mapping_summary ? (
        <dl>
          <dt>accepted_proposed_idempotency_key</dt>
          <dd>{review.accepted_mapping_summary.proposed_idempotency_key}</dd>
          <dt>accepted_source_apply_receipt_id</dt>
          <dd>
            {review.accepted_mapping_summary
              .source_perspective_apply_receipt_id ?? "missing"}
          </dd>
          <dt>accepted_mutation_label</dt>
          <dd>{review.accepted_mapping_summary.mutation_label ?? "missing"}</dd>
          <dt>accepted_intended_future_mutation_target</dt>
          <dd>
            {review.accepted_mapping_summary.intended_future_mutation_target}
          </dd>
        </dl>
      ) : null}
      <ReasonList title="Unresolved blockers" reasons={review.unresolved_blockers} />
      <ReasonList title="Review warnings" reasons={review.warning_reasons} />
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
