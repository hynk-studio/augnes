"use client";

import { useEffect, useState } from "react";

import { ResearchCandidateManualGlobalDogfoodPerspectiveAdapterWritePanel } from "@/components/research-candidate-manual-global-dogfood-perspective-adapter-write-panel";
import { buildResearchCandidateManualGlobalDogfoodPerspectiveAdapterContract } from "@/lib/research-candidate-review/manual-global-dogfood-perspective-adapter-contract";
import { buildResearchCandidateManualGlobalDogfoodPerspectiveAdapterReview } from "@/lib/research-candidate-review/manual-global-dogfood-perspective-adapter-review";
import type { ResearchCandidateManualGlobalDogfoodPerspectiveAdapterContract } from "@/types/research-candidate-manual-global-dogfood-perspective-adapter-contract";
import type {
  ResearchCandidateManualGlobalDogfoodPerspectiveAdapterReview,
  ResearchCandidateManualGlobalDogfoodPerspectiveAdapterReviewDecision,
} from "@/types/research-candidate-manual-global-dogfood-perspective-adapter-review";
import type { ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationReadback } from "@/types/research-candidate-manual-global-dogfood-perspective-state-mutation-write";

const reviewDecisions: {
  value: ResearchCandidateManualGlobalDogfoodPerspectiveAdapterReviewDecision;
  label: string;
}[] = [
  {
    value: "accept_contract_for_future_perspective_adapter_write_slice",
    label: "Accept contract for future Perspective adapter slice",
  },
  {
    value: "needs_perspective_adapter_mapping_revision",
    label: "Needs Perspective adapter mapping revision",
  },
  {
    value: "reject_perspective_adapter_contract",
    label: "Reject Perspective adapter contract",
  },
  {
    value: "defer_perspective_adapter_contract",
    label: "Defer Perspective adapter contract",
  },
];

export function ResearchCandidateManualGlobalDogfoodPerspectiveAdapterContractPanel({
  readback,
}: {
  readback: ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationReadback;
}) {
  const [operatorDecision, setOperatorDecision] =
    useState<ResearchCandidateManualGlobalDogfoodPerspectiveAdapterReviewDecision>(
      "accept_contract_for_future_perspective_adapter_write_slice",
    );
  const [operatorNote, setOperatorNote] = useState("");
  const [review, setReview] =
    useState<ResearchCandidateManualGlobalDogfoodPerspectiveAdapterReview | null>(
      null,
    );
  const [reviewContractFingerprint, setReviewContractFingerprint] = useState<
    string | null
  >(null);
  const contract =
    buildResearchCandidateManualGlobalDogfoodPerspectiveAdapterContract({
      readback,
      operator_intent_label:
        "research_candidate_manual_global_dogfood_perspective_adapter_contract_panel",
    });
  const currentContractFingerprint = contract.validation.contract_fingerprint;
  const currentReview =
    review &&
    review.source_contract_fingerprint === currentContractFingerprint &&
    (!review.accepted_mapping_summary ||
      (review.accepted_mapping_summary.proposed_idempotency_key ===
        contract.idempotency_contract_preview.proposed_idempotency_key &&
        review.accepted_mapping_summary.source_handoff_seed_fingerprint ===
          contract.source_handoff_seed_fingerprint &&
        review.accepted_mapping_summary.source_result_text_fingerprint ===
          contract.source_result_text_fingerprint))
      ? review
      : null;
  const currentAcceptedReview =
    operatorDecision ===
      "accept_contract_for_future_perspective_adapter_write_slice" &&
    currentReview?.operator_decision ===
      "accept_contract_for_future_perspective_adapter_write_slice" &&
    currentReview.review_status ===
      "ready_for_future_perspective_adapter_write_slice" &&
    currentReview.accepted_mapping_summary?.proposed_idempotency_key ===
      contract.idempotency_contract_preview.proposed_idempotency_key &&
    currentReview.accepted_mapping_summary.source_handoff_seed_fingerprint ===
      contract.source_handoff_seed_fingerprint &&
    currentReview.accepted_mapping_summary.source_result_text_fingerprint ===
      contract.source_result_text_fingerprint
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
    nextDecision: ResearchCandidateManualGlobalDogfoodPerspectiveAdapterReviewDecision,
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
      buildResearchCandidateManualGlobalDogfoodPerspectiveAdapterReview({
        perspective_adapter_contract: contract,
        operator_decision: operatorDecision,
        operator_note: operatorNote,
      });
    setReview(nextReview);
    setReviewContractFingerprint(currentContractFingerprint);
  }

  return (
    <section
      className="perspective-inspector-section manual-global-dogfood-perspective-adapter-contract"
      aria-label="Manual global dogfood Perspective adapter contract preview"
      data-augnes-authority="preview-only read-only no-current-working-perspective no-existing-canonical-state no-promotion no-memory no-work no-proof no-metrics"
    >
      <div className="perspective-constellation-shell-header">
        <div>
          <p className="panel-eyebrow">AUGNES / Perspective Adapter Contract</p>
          <h4>Perspective adapter contract preview</h4>
          <p>
            This preview derives future current-working/canonical Perspective
            adapter candidate material from active committed manual Perspective
            state mutation readback. It does not update current-working
            Perspective, mutate existing canonical Perspective state tables,
            promote Perspective, write Memory, mutate work, write
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
          source_state_mutation_receipt{" "}
          <code>
            {contract.source_perspective_state_mutation_receipt_id ?? "none"}
          </code>
        </span>
        <span>
          source_state_mutation_record{" "}
          <code>
            {contract.source_perspective_state_mutation_record_id ?? "none"}
          </code>
        </span>
        <span>
          source_apply <code>{contract.source_perspective_apply_receipt_id ?? "none"}</code>
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
          <span>adapter scope hint</span>
          <strong>{contract.proposed_adapter_candidate.adapter_scope_hint}</strong>
          <small>{contract.proposed_adapter_candidate.candidate_status}</small>
        </div>
        <div>
          <span>future target</span>
          <strong>
            {
              contract.proposed_adapter_mapping
                .intended_future_adapter_target
            }
          </strong>
          <small>existing adapters remain compatibility-only</small>
        </div>
        <div>
          <span>writes now</span>
          <strong>{String(contract.proposed_adapter_candidate.writes_now)}</strong>
          <small>current-working/existing state/promotion/memory false</small>
        </div>
      </div>

      <div className="perspective-constellation-workspace-grid">
        <AdapterMappingSummary contract={contract} />
        <ExistingCurrentWorkingAdapterCompatibility contract={contract} />
        <ExistingCanonicalStateAdapterCompatibility contract={contract} />
        <ManualAdapterWritePathSummary contract={contract} />
        <SourceRefsSummary contract={contract} />
      </div>

      <section className="cockpit-surface-card">
        <h5>Idempotency preview</h5>
        <dl>
          <dt>proposed_idempotency_key</dt>
          <dd>{contract.idempotency_contract_preview.proposed_idempotency_key}</dd>
          <dt>fingerprint_algorithm</dt>
          <dd>{contract.idempotency_contract_preview.fingerprint_algorithm}</dd>
          <dt>would_prevent_duplicate_perspective_adapter_write</dt>
          <dd>
            {String(
              contract.idempotency_contract_preview
                .would_prevent_duplicate_perspective_adapter_write,
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
            label="can_write_perspective_adapter_record"
            value={
              contract.authority_boundary.can_write_perspective_adapter_record
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
                name="manual-perspective-adapter-review-decision"
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
            Preview local adapter review
          </button>
          <button type="button" onClick={clearReview}>
            Clear review
          </button>
        </div>
        {currentReview ? <AdapterReviewPreview review={currentReview} /> : null}
      </section>

      {currentAcceptedReview ? (
        <ResearchCandidateManualGlobalDogfoodPerspectiveAdapterWritePanel
          perspectiveAdapterContract={contract}
          perspectiveAdapterReview={currentAcceptedReview}
        />
      ) : null}
    </section>
  );
}

function AdapterMappingSummary({
  contract,
}: {
  contract: ResearchCandidateManualGlobalDogfoodPerspectiveAdapterContract;
}) {
  const mapping = contract.proposed_adapter_mapping;
  return (
    <section className="cockpit-surface-card">
      <h5>Proposed adapter mapping</h5>
      <dl>
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
        <dt>intended_future_adapter_target</dt>
        <dd>{mapping.intended_future_adapter_target}</dd>
        <dt>default_future_adapter_target</dt>
        <dd>{mapping.default_future_adapter_target}</dd>
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

function ExistingCurrentWorkingAdapterCompatibility({
  contract,
}: {
  contract: ResearchCandidateManualGlobalDogfoodPerspectiveAdapterContract;
}) {
  const compatibility =
    contract.proposed_existing_current_working_adapter_compatibility;
  return (
    <section className="cockpit-surface-card">
      <h5>Existing current-working adapter compatibility</h5>
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
      <ReasonList
        title="Compatibility notes"
        reasons={compatibility.compatibility_notes}
      />
      <ReasonList title="Field gaps" reasons={compatibility.field_gaps} />
      <ReasonList title="Authority gaps" reasons={compatibility.authority_gaps} />
      <ReasonList
        title="Source lineage gaps"
        reasons={compatibility.source_lineage_gaps}
      />
      <ReasonList
        title="Missing current-working refs"
        reasons={compatibility.missing_current_working_refs}
      />
    </section>
  );
}

function ExistingCanonicalStateAdapterCompatibility({
  contract,
}: {
  contract: ResearchCandidateManualGlobalDogfoodPerspectiveAdapterContract;
}) {
  const compatibility =
    contract.proposed_existing_canonical_state_adapter_compatibility;
  return (
    <section className="cockpit-surface-card">
      <h5>Existing canonical state adapter compatibility</h5>
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
      </dl>
      <ReasonList
        title="Compatibility notes"
        reasons={compatibility.compatibility_notes}
      />
      <ReasonList title="Field gaps" reasons={compatibility.field_gaps} />
      <ReasonList title="Authority gaps" reasons={compatibility.authority_gaps} />
      <ReasonList
        title="Source lineage gaps"
        reasons={compatibility.source_lineage_gaps}
      />
      <ReasonList
        title="Missing canonical state refs"
        reasons={compatibility.missing_canonical_state_refs}
      />
    </section>
  );
}

function ManualAdapterWritePathSummary({
  contract,
}: {
  contract: ResearchCandidateManualGlobalDogfoodPerspectiveAdapterContract;
}) {
  const path = contract.proposed_manual_adapter_write_path;
  return (
    <section className="cockpit-surface-card">
      <h5>Proposed manual adapter write path</h5>
      <dl>
        <dt>recommended_storage_path</dt>
        <dd>{path.recommended_storage_path}</dd>
        <dt>expected_future_write_scope</dt>
        <dd>{path.expected_future_write_scope}</dd>
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
      </dl>
    </section>
  );
}

function SourceRefsSummary({
  contract,
}: {
  contract: ResearchCandidateManualGlobalDogfoodPerspectiveAdapterContract;
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

function AdapterReviewPreview({
  review,
}: {
  review: ResearchCandidateManualGlobalDogfoodPerspectiveAdapterReview;
}) {
  return (
    <section className="cockpit-surface-card">
      <h5>Adapter review preview</h5>
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
          <dt>accepted_state_mutation_receipt_id</dt>
          <dd>
            {review.accepted_mapping_summary
              .source_perspective_state_mutation_receipt_id ?? "missing"}
          </dd>
          <dt>accepted_adapter_label</dt>
          <dd>{review.accepted_mapping_summary.adapter_label ?? "missing"}</dd>
          <dt>accepted_intended_future_adapter_target</dt>
          <dd>
            {review.accepted_mapping_summary.intended_future_adapter_target}
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
