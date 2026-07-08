"use client";

import { useEffect, useState } from "react";

import { buildResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationContract } from "@/lib/research-candidate-review/manual-global-dogfood-perspective-state-application-contract";
import { buildResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationReview } from "@/lib/research-candidate-review/manual-global-dogfood-perspective-state-application-review";
import { ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationWritePanel } from "@/components/research-candidate-manual-global-dogfood-perspective-state-application-write-panel";
import type { ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationContract } from "@/types/research-candidate-manual-global-dogfood-perspective-state-application-contract";
import type {
  ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationReview,
  ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationReviewDecision,
} from "@/types/research-candidate-manual-global-dogfood-perspective-state-application-review";
import type { ResearchCandidateManualGlobalDogfoodPerspectiveAdapterReadback } from "@/types/research-candidate-manual-global-dogfood-perspective-adapter-write";

const reviewDecisions: {
  value: ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationReviewDecision;
  label: string;
}[] = [
  {
    value: "accept_contract_for_future_perspective_state_application_write_slice",
    label: "Accept contract for future Perspective state application slice",
  },
  {
    value: "needs_perspective_state_application_mapping_revision",
    label: "Needs Perspective state application mapping revision",
  },
  {
    value: "reject_perspective_state_application_contract",
    label: "Reject Perspective state application contract",
  },
  {
    value: "defer_perspective_state_application_contract",
    label: "Defer Perspective state application contract",
  },
];

export function ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationContractPanel({
  readback,
}: {
  readback: ResearchCandidateManualGlobalDogfoodPerspectiveAdapterReadback;
}) {
  const [operatorDecision, setOperatorDecision] =
    useState<ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationReviewDecision>(
      "accept_contract_for_future_perspective_state_application_write_slice",
    );
  const [operatorNote, setOperatorNote] = useState("");
  const [review, setReview] =
    useState<ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationReview | null>(
      null,
    );
  const [reviewContractFingerprint, setReviewContractFingerprint] = useState<
    string | null
  >(null);
  const contract =
    buildResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationContract({
      readback,
      operator_intent_label:
        "research_candidate_manual_global_dogfood_perspective_state_application_contract_panel",
    });
  const currentContractFingerprint = contract.validation.contract_fingerprint;
  const currentReview =
    review &&
    review.source_contract_fingerprint === currentContractFingerprint &&
    (!review.accepted_mapping_summary ||
      (review.accepted_mapping_summary.proposed_idempotency_key ===
        contract.idempotency_contract_preview.proposed_idempotency_key &&
        review.accepted_mapping_summary.source_perspective_adapter_receipt_id ===
          contract.source_perspective_adapter_receipt_id &&
        review.accepted_mapping_summary.source_perspective_adapter_record_id ===
          contract.source_perspective_adapter_record_id &&
        review.accepted_mapping_summary
          .source_perspective_adapter_record_fingerprint ===
          contract.source_perspective_adapter_record_fingerprint &&
        review.accepted_mapping_summary.source_handoff_seed_fingerprint ===
          contract.source_handoff_seed_fingerprint &&
        review.accepted_mapping_summary.source_result_text_fingerprint ===
          contract.source_result_text_fingerprint))
      ? review
      : null;
  const currentAcceptedReview =
    operatorDecision ===
      "accept_contract_for_future_perspective_state_application_write_slice" &&
    currentReview?.operator_decision ===
      "accept_contract_for_future_perspective_state_application_write_slice" &&
    currentReview.review_status ===
      "ready_for_future_perspective_state_application_write_slice"
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
    nextDecision: ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationReviewDecision,
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
      buildResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationReview({
        perspective_state_application_contract: contract,
        operator_decision: operatorDecision,
        operator_note: operatorNote,
      });
    setReview(nextReview);
    setReviewContractFingerprint(currentContractFingerprint);
  }

  return (
    <section
      className="perspective-inspector-section manual-global-dogfood-perspective-state-application-contract"
      aria-label="Manual global dogfood Perspective state application contract preview"
      data-augnes-authority="preview-only read-only no-current-working-perspective no-existing-canonical-state no-promotion no-memory no-work no-proof no-metrics"
    >
      <div className="perspective-constellation-shell-header">
        <div>
          <p className="panel-eyebrow">
            AUGNES / Perspective State Application Contract
          </p>
          <h4>Perspective state application contract preview</h4>
          <p>
            This preview derives future existing current-working/canonical
            Perspective state application candidate material from active
            committed manual Perspective adapter readback. It does not update
            current-working Perspective, mutate existing canonical Perspective
            state tables, promote Perspective, write Memory, mutate work, write
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
          source_adapter_receipt{" "}
          <code>{contract.source_perspective_adapter_receipt_id ?? "none"}</code>
        </span>
        <span>
          source_adapter_record{" "}
          <code>{contract.source_perspective_adapter_record_id ?? "none"}</code>
        </span>
        <span>
          source_state_mutation{" "}
          <code>
            {contract.source_perspective_state_mutation_receipt_id ?? "none"}
          </code>
        </span>
        <span>
          source_apply{" "}
          <code>{contract.source_perspective_apply_receipt_id ?? "none"}</code>
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
          <span>state application scope hint</span>
          <strong>
            {
              contract.proposed_state_application_candidate
                .state_application_scope_hint
            }
          </strong>
          <small>
            {contract.proposed_state_application_candidate.candidate_status}
          </small>
        </div>
        <div>
          <span>future target</span>
          <strong>
            {
              contract.proposed_state_application_mapping
                .intended_future_state_application_target
            }
          </strong>
          <small>existing state paths remain compatibility-only</small>
        </div>
        <div>
          <span>writes now</span>
          <strong>
            {String(contract.proposed_state_application_candidate.writes_now)}
          </strong>
          <small>current-working/existing state/promotion/memory false</small>
        </div>
      </div>

      <div className="perspective-constellation-workspace-grid">
        <StateApplicationMappingSummary contract={contract} />
        <ExistingCurrentWorkingApplicationCompatibility contract={contract} />
        <ExistingCanonicalStateApplicationCompatibility contract={contract} />
        <ManualStateApplicationWritePathSummary contract={contract} />
        <SourceRefsSummary contract={contract} />
      </div>

      <section className="cockpit-surface-card">
        <h5>Idempotency preview</h5>
        <dl>
          <dt>proposed_idempotency_key</dt>
          <dd>{contract.idempotency_contract_preview.proposed_idempotency_key}</dd>
          <dt>fingerprint_algorithm</dt>
          <dd>{contract.idempotency_contract_preview.fingerprint_algorithm}</dd>
          <dt>would_prevent_duplicate_perspective_state_application_write</dt>
          <dd>
            {String(
              contract.idempotency_contract_preview
                .would_prevent_duplicate_perspective_state_application_write,
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
        <ReasonList
          title="Required future checks"
          reasons={contract.required_future_checks}
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
            label="can_write_perspective_state_application_record"
            value={
              contract.authority_boundary
                .can_write_perspective_state_application_record
            }
          />
          <BoundaryFlag
            label="can_update_current_working_perspective"
            value={
              contract.authority_boundary
                .can_update_current_working_perspective
            }
          />
          <BoundaryFlag
            label="can_mutate_existing_canonical_perspective_state"
            value={
              contract.authority_boundary
                .can_mutate_existing_canonical_perspective_state
            }
          />
          <BoundaryFlag
            label="can_write_existing_canonical_perspective_state"
            value={
              contract.authority_boundary
                .can_write_existing_canonical_perspective_state
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
            label="can_mutate_perspective_adapter_record"
            value={
              contract.authority_boundary
                .can_mutate_perspective_adapter_record
            }
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
                name="manual-perspective-state-application-review-decision"
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
            Preview local state application review
          </button>
          <button type="button" onClick={clearReview}>
            Clear review
          </button>
        </div>
        {currentReview ? (
          <StateApplicationReviewPreview review={currentReview} />
        ) : null}
      </section>
      {currentAcceptedReview ? (
        <ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationWritePanel
          perspectiveStateApplicationContract={contract}
          perspectiveStateApplicationReview={currentAcceptedReview}
        />
      ) : null}
    </section>
  );
}

function StateApplicationMappingSummary({
  contract,
}: {
  contract: ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationContract;
}) {
  const mapping = contract.proposed_state_application_mapping;
  return (
    <section className="cockpit-surface-card">
      <h5>Proposed state application mapping</h5>
      <dl>
        <dt>state_application_label</dt>
        <dd>{mapping.state_application_label ?? "missing"}</dd>
        <dt>state_application_rationale</dt>
        <dd>{mapping.state_application_rationale ?? "missing"}</dd>
        <dt>adapter_label</dt>
        <dd>{mapping.adapter_label ?? "missing"}</dd>
        <dt>adapter_rationale</dt>
        <dd>{mapping.adapter_rationale ?? "missing"}</dd>
        <dt>mutation_label</dt>
        <dd>{mapping.mutation_label ?? "missing"}</dd>
        <dt>apply_label</dt>
        <dd>{mapping.apply_label ?? "missing"}</dd>
        <dt>canonical_update_label</dt>
        <dd>{mapping.canonical_update_label ?? "missing"}</dd>
        <dt>relay_update_label</dt>
        <dd>{mapping.relay_update_label ?? "missing"}</dd>
        <dt>intended_future_state_application_target</dt>
        <dd>{mapping.intended_future_state_application_target}</dd>
        <dt>default_future_state_application_target</dt>
        <dd>{mapping.default_future_state_application_target}</dd>
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

function ExistingCurrentWorkingApplicationCompatibility({
  contract,
}: {
  contract: ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationContract;
}) {
  const compatibility =
    contract.proposed_existing_current_working_application_compatibility;
  return (
    <section className="cockpit-surface-card">
      <h5>Existing current-working application compatibility</h5>
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
        <dt>missing_current_working_refs</dt>
        <dd>{compatibility.missing_current_working_refs.join(", ")}</dd>
      </dl>
      <ReasonList title="Current-working field gaps" reasons={compatibility.field_gaps} />
      <ReasonList
        title="Current-working authority gaps"
        reasons={compatibility.authority_gaps}
      />
      <ReasonList
        title="Current-working lineage gaps"
        reasons={compatibility.source_lineage_gaps}
      />
    </section>
  );
}

function ExistingCanonicalStateApplicationCompatibility({
  contract,
}: {
  contract: ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationContract;
}) {
  const compatibility =
    contract.proposed_existing_canonical_state_application_compatibility;
  return (
    <section className="cockpit-surface-card">
      <h5>Existing canonical state application compatibility</h5>
      <dl>
        <dt>canonical_state_writer</dt>
        <dd>
          {String(
            compatibility.existing_canonical_perspective_state_writer_compatible,
          )}
        </dd>
        <dt>canonical_state_read_model</dt>
        <dd>
          {String(
            compatibility
              .existing_canonical_perspective_state_read_model_compatible,
          )}
        </dd>
        <dt>canonical_state_route</dt>
        <dd>
          {String(
            compatibility.existing_canonical_perspective_state_route_compatible,
          )}
        </dd>
        <dt>recommended_future_mapping_path</dt>
        <dd>{compatibility.recommended_future_mapping_path}</dd>
        <dt>missing_canonical_state_refs</dt>
        <dd>{compatibility.missing_canonical_state_refs.join(", ")}</dd>
        <dt>missing_structured_state_material</dt>
        <dd>{compatibility.missing_structured_state_material.join(", ")}</dd>
      </dl>
      <ReasonList title="Canonical state field gaps" reasons={compatibility.field_gaps} />
      <ReasonList
        title="Canonical state authority gaps"
        reasons={compatibility.authority_gaps}
      />
      <ReasonList
        title="Canonical state lineage gaps"
        reasons={compatibility.source_lineage_gaps}
      />
    </section>
  );
}

function ManualStateApplicationWritePathSummary({
  contract,
}: {
  contract: ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationContract;
}) {
  const path = contract.proposed_manual_state_application_write_path;
  return (
    <section className="cockpit-surface-card">
      <h5>Proposed manual state application write path</h5>
      <dl>
        <dt>recommended_storage_path</dt>
        <dd>{path.recommended_storage_path}</dd>
        <dt>expected_future_write_scope</dt>
        <dd>{path.expected_future_write_scope}</dd>
        <dt>requires_explicit_future_confirmation</dt>
        <dd>{String(path.requires_explicit_future_confirmation)}</dd>
        <dt>requires_source_revalidation</dt>
        <dd>{String(path.requires_source_revalidation)}</dd>
        <dt>requires_idempotency</dt>
        <dd>{String(path.requires_idempotency)}</dd>
        <dt>requires_duplicate_replay</dt>
        <dd>{String(path.requires_duplicate_replay)}</dd>
        <dt>requires_rollback_supersede</dt>
        <dd>{String(path.requires_rollback_supersede)}</dd>
        <dt>requires_row_count_validation</dt>
        <dd>{String(path.requires_row_count_validation)}</dd>
        <dt>requires_no_proof_evidence_fabrication</dt>
        <dd>{String(path.requires_no_proof_evidence_fabrication)}</dd>
        <dt>requires_manual_source_chain_binding</dt>
        <dd>{String(path.requires_manual_source_chain_binding)}</dd>
      </dl>
    </section>
  );
}

function SourceRefsSummary({
  contract,
}: {
  contract: ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationContract;
}) {
  return (
    <section className="cockpit-surface-card">
      <h5>Source chain refs</h5>
      <dl>
        <dt>source_perspective_adapter_record_fingerprint</dt>
        <dd>{contract.source_perspective_adapter_record_fingerprint ?? "none"}</dd>
        <dt>source_perspective_state_mutation_record_fingerprint</dt>
        <dd>
          {contract.source_perspective_state_mutation_record_fingerprint ??
            "none"}
        </dd>
        <dt>source_perspective_apply_record_fingerprint</dt>
        <dd>{contract.source_perspective_apply_record_fingerprint ?? "none"}</dd>
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
        <dt>source_handoff_seed_fingerprint</dt>
        <dd>{contract.source_handoff_seed_fingerprint ?? "none"}</dd>
        <dt>source_result_text_fingerprint</dt>
        <dd>{contract.source_result_text_fingerprint ?? "none"}</dd>
        <dt>source_expected_observed_delta_record_ref</dt>
        <dd>
          {contract.source_expected_observed_delta_record_ref ?? "none"}
        </dd>
        <dt>source_reuse_outcome_record_ref</dt>
        <dd>{contract.source_reuse_outcome_record_ref ?? "none"}</dd>
      </dl>
    </section>
  );
}

function StateApplicationReviewPreview({
  review,
}: {
  review: ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationReview;
}) {
  return (
    <section className="cockpit-surface-card">
      <h5>Local state application review</h5>
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
          <dt>accepted_source_adapter_receipt</dt>
          <dd>
            {review.accepted_mapping_summary
              .source_perspective_adapter_receipt_id ?? "none"}
          </dd>
          <dt>accepted_source_adapter_record</dt>
          <dd>
            {review.accepted_mapping_summary
              .source_perspective_adapter_record_id ?? "none"}
          </dd>
          <dt>accepted_source_handoff_seed_fingerprint</dt>
          <dd>
            {review.accepted_mapping_summary
              .source_handoff_seed_fingerprint ?? "none"}
          </dd>
          <dt>accepted_source_result_text_fingerprint</dt>
          <dd>
            {review.accepted_mapping_summary.source_result_text_fingerprint ??
              "none"}
          </dd>
          <dt>accepted_idempotency_key</dt>
          <dd>{review.accepted_mapping_summary.proposed_idempotency_key}</dd>
          <dt>accepted_future_target</dt>
          <dd>
            {
              review.accepted_mapping_summary
                .intended_future_state_application_target
            }
          </dd>
          <dt>accepted_state_application_label</dt>
          <dd>
            {review.accepted_mapping_summary.state_application_label ??
              "missing"}
          </dd>
        </dl>
      ) : null}
      <ReasonList title="Review blockers" reasons={review.unresolved_blockers} />
      <ReasonList title="Review warnings" reasons={review.warning_reasons} />
      <ReasonList
        title="Future write requirements"
        reasons={review.future_write_requirements}
      />
    </section>
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
