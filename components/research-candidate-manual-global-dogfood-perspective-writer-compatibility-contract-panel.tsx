"use client";

import { useEffect, useState } from "react";

import { buildResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityContract } from "@/lib/research-candidate-review/manual-global-dogfood-perspective-writer-compatibility-contract";
import { buildResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityReview } from "@/lib/research-candidate-review/manual-global-dogfood-perspective-writer-compatibility-review";
import type { ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityContract } from "@/types/research-candidate-manual-global-dogfood-perspective-writer-compatibility-contract";
import type {
  ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityReview,
  ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityReviewDecision,
} from "@/types/research-candidate-manual-global-dogfood-perspective-writer-compatibility-review";
import type { ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationReadback } from "@/types/research-candidate-manual-global-dogfood-perspective-state-application-write";

const reviewDecisions: {
  value: ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityReviewDecision;
  label: string;
}[] = [
  {
    value: "accept_contract_for_future_perspective_writer_compatibility_write_slice",
    label: "Accept contract for future Perspective writer compatibility slice",
  },
  {
    value: "needs_perspective_writer_compatibility_mapping_revision",
    label: "Needs Perspective writer compatibility mapping revision",
  },
  {
    value: "reject_perspective_writer_compatibility_contract",
    label: "Reject Perspective writer compatibility contract",
  },
  {
    value: "defer_perspective_writer_compatibility_contract",
    label: "Defer Perspective writer compatibility contract",
  },
];

export function ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityContractPanel({
  readback,
}: {
  readback: ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationReadback;
}) {
  const [operatorDecision, setOperatorDecision] =
    useState<ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityReviewDecision>(
      "accept_contract_for_future_perspective_writer_compatibility_write_slice",
    );
  const [operatorNote, setOperatorNote] = useState("");
  const [review, setReview] =
    useState<ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityReview | null>(
      null,
    );
  const [reviewContractFingerprint, setReviewContractFingerprint] = useState<
    string | null
  >(null);
  const contract =
    buildResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityContract({
      readback,
      operator_intent_label:
        "research_candidate_manual_global_dogfood_perspective_writer_compatibility_contract_panel",
    });
  const currentContractFingerprint = contract.validation.contract_fingerprint;
  const currentReview =
    review &&
    review.source_contract_fingerprint === currentContractFingerprint &&
    (!review.accepted_mapping_summary ||
      (review.accepted_mapping_summary.proposed_idempotency_key ===
        contract.idempotency_contract_preview.proposed_idempotency_key &&
        review.accepted_mapping_summary
          .source_perspective_state_application_receipt_id ===
          contract.source_perspective_state_application_receipt_id &&
        review.accepted_mapping_summary
          .source_perspective_state_application_record_id ===
          contract.source_perspective_state_application_record_id &&
        review.accepted_mapping_summary
          .source_perspective_state_application_record_fingerprint ===
          contract.source_perspective_state_application_record_fingerprint &&
        review.accepted_mapping_summary.source_handoff_seed_fingerprint ===
          contract.source_handoff_seed_fingerprint &&
        review.accepted_mapping_summary.source_result_text_fingerprint ===
          contract.source_result_text_fingerprint))
      ? review
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
    nextDecision: ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityReviewDecision,
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
      buildResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityReview({
        perspective_writer_compatibility_contract: contract,
        operator_decision: operatorDecision,
        operator_note: operatorNote,
      });
    setReview(nextReview);
    setReviewContractFingerprint(currentContractFingerprint);
  }

  return (
    <section
      className="perspective-inspector-section manual-global-dogfood-perspective-writer-compatibility-contract"
      aria-label="Manual global dogfood Perspective writer compatibility contract preview"
      data-augnes-authority="preview-only read-only no-existing-writer-call no-current-working-perspective no-existing-canonical-state no-promotion no-memory no-work no-proof no-metrics"
    >
      <div className="perspective-constellation-shell-header">
        <div>
          <p className="panel-eyebrow">
            AUGNES / Perspective Writer Compatibility Contract
          </p>
          <h4>Perspective writer compatibility contract preview</h4>
          <p>
            This preview derives existing current-working/canonical writer
            compatibility material from active committed manual Perspective
            state application readback. It does not call existing writers,
            update current-working Perspective, mutate existing canonical
            Perspective state tables, promote Perspective, write Memory, mutate
            work, write proof/evidence, metrics, product state, or source
            records.
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
          source_state_application_receipt{" "}
          <code>
            {contract.source_perspective_state_application_receipt_id ?? "none"}
          </code>
        </span>
        <span>
          source_state_application_record{" "}
          <code>
            {contract.source_perspective_state_application_record_id ?? "none"}
          </code>
        </span>
        <span>
          source_adapter{" "}
          <code>{contract.source_perspective_adapter_receipt_id ?? "none"}</code>
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
      </div>

      <div className="perspective-formation-summary-grid">
        <div>
          <span>contract readiness</span>
          <strong>{contract.operator_authorization_mode}</strong>
          <small>blockers {contract.blocker_reasons.length}</small>
        </div>
        <div>
          <span>scope hint</span>
          <strong>
            {
              contract.proposed_writer_compatibility_candidate
                .writer_compatibility_scope_hint
            }
          </strong>
          <small>
            {contract.proposed_writer_compatibility_candidate.candidate_status}
          </small>
        </div>
        <div>
          <span>future target</span>
          <strong>
            {
              contract.proposed_writer_compatibility_mapping
                .intended_future_writer_target
            }
          </strong>
          <small>existing writers remain compatibility-only</small>
        </div>
        <div>
          <span>existing writer calls</span>
          <strong>
            {String(
              contract.proposed_writer_compatibility_candidate
                .would_call_existing_current_working_writer ||
                contract.proposed_writer_compatibility_candidate
                  .would_call_existing_canonical_state_writer,
            )}
          </strong>
          <small>current-working/canonical writer invocation false</small>
        </div>
      </div>

      <div className="perspective-constellation-workspace-grid">
        <WriterCompatibilityMappingSummary contract={contract} />
        <ExistingCurrentWorkingWriterCompatibility contract={contract} />
        <ExistingCanonicalStateWriterCompatibility contract={contract} />
        <ManualWriterCompatibilityPathSummary contract={contract} />
        <SourceRefsSummary contract={contract} />
      </div>

      <section className="cockpit-surface-card">
        <h5>Idempotency preview</h5>
        <dl>
          <dt>proposed_idempotency_key</dt>
          <dd>{contract.idempotency_contract_preview.proposed_idempotency_key}</dd>
          <dt>fingerprint_algorithm</dt>
          <dd>{contract.idempotency_contract_preview.fingerprint_algorithm}</dd>
          <dt>would_prevent_duplicate_perspective_writer_compatibility_write</dt>
          <dd>
            {String(
              contract.idempotency_contract_preview
                .would_prevent_duplicate_perspective_writer_compatibility_write,
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
            label="can_call_existing_current_working_writer"
            value={
              contract.authority_boundary
                .can_call_existing_current_working_writer
            }
          />
          <BoundaryFlag
            label="can_call_existing_canonical_state_writer"
            value={
              contract.authority_boundary
                .can_call_existing_canonical_state_writer
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
            label="can_mutate_perspective_state_application_record"
            value={
              contract.authority_boundary
                .can_mutate_perspective_state_application_record
            }
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
        <p>
          This review is local React state only. Operator note text is not
          persisted and is excluded from future idempotency material.
        </p>
        <div className="manual-review-decision-list">
          {reviewDecisions.map((decision) => (
            <label key={decision.value}>
              <input
                type="radio"
                name="manual-perspective-writer-compatibility-review-decision"
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
            Preview local compatibility review
          </button>
          <button type="button" onClick={clearReview}>
            Clear review
          </button>
        </div>
        {currentReview ? (
          <WriterCompatibilityReviewPreview review={currentReview} />
        ) : null}
      </section>
    </section>
  );
}

function WriterCompatibilityMappingSummary({
  contract,
}: {
  contract: ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityContract;
}) {
  const mapping = contract.proposed_writer_compatibility_mapping;
  return (
    <section className="cockpit-surface-card">
      <h5>Proposed writer compatibility mapping</h5>
      <dl>
        <dt>writer_compatibility_label</dt>
        <dd>{mapping.writer_compatibility_label ?? "missing"}</dd>
        <dt>writer_compatibility_rationale</dt>
        <dd>{mapping.writer_compatibility_rationale ?? "missing"}</dd>
        <dt>state_application_label</dt>
        <dd>{mapping.state_application_label ?? "missing"}</dd>
        <dt>state_application_rationale</dt>
        <dd>{mapping.state_application_rationale ?? "missing"}</dd>
        <dt>adapter_label</dt>
        <dd>{mapping.adapter_label ?? "missing"}</dd>
        <dt>mutation_label</dt>
        <dd>{mapping.mutation_label ?? "missing"}</dd>
        <dt>apply_label</dt>
        <dd>{mapping.apply_label ?? "missing"}</dd>
        <dt>canonical_update_label</dt>
        <dd>{mapping.canonical_update_label ?? "missing"}</dd>
        <dt>relay_update_label</dt>
        <dd>{mapping.relay_update_label ?? "missing"}</dd>
        <dt>intended_future_writer_target</dt>
        <dd>{mapping.intended_future_writer_target}</dd>
        <dt>default_future_writer_target</dt>
        <dd>{mapping.default_future_writer_target}</dd>
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

function ExistingCurrentWorkingWriterCompatibility({
  contract,
}: {
  contract: ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityContract;
}) {
  const compatibility = contract.existing_current_working_writer_compatibility;
  return (
    <section className="cockpit-surface-card">
      <h5>Existing current-working writer compatibility</h5>
      <dl>
        <dt>update_contract_preview</dt>
        <dd>
          {String(
            compatibility
              .existing_current_working_perspective_update_contract_preview_compatible,
          )}
        </dd>
        <dt>update_contract_write</dt>
        <dd>
          {String(
            compatibility
              .existing_current_working_perspective_update_contract_write_compatible,
          )}
        </dd>
        <dt>apply_preview</dt>
        <dd>
          {String(
            compatibility
              .existing_current_working_perspective_apply_preview_compatible,
          )}
        </dd>
        <dt>apply_write</dt>
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
        <dt>missing_patch_or_apply_material</dt>
        <dd>{compatibility.missing_patch_or_apply_material.join(", ")}</dd>
        <dt>missing_proof_or_evidence_refs</dt>
        <dd>{compatibility.missing_proof_or_evidence_refs.join(", ")}</dd>
        <dt>manual_source_refs_preserved</dt>
        <dd>{String(compatibility.manual_source_refs_preserved)}</dd>
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

function ExistingCanonicalStateWriterCompatibility({
  contract,
}: {
  contract: ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityContract;
}) {
  const compatibility = contract.existing_canonical_state_writer_compatibility;
  return (
    <section className="cockpit-surface-card">
      <h5>Existing canonical state writer compatibility</h5>
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
        <dt>missing_claim_evidence_tension_gap_refs</dt>
        <dd>{compatibility.missing_claim_evidence_tension_gap_refs.join(", ")}</dd>
        <dt>manual_source_refs_preserved</dt>
        <dd>{String(compatibility.manual_source_refs_preserved)}</dd>
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

function ManualWriterCompatibilityPathSummary({
  contract,
}: {
  contract: ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityContract;
}) {
  const path = contract.proposed_manual_writer_compatibility_path;
  return (
    <section className="cockpit-surface-card">
      <h5>Proposed manual writer compatibility path</h5>
      <dl>
        <dt>recommended_storage_path</dt>
        <dd>{path.recommended_storage_path}</dd>
        <dt>expected_future_write_scope</dt>
        <dd>{path.expected_future_write_scope}</dd>
        <dt>requires_existing_writer_dry_run_or_static_contract</dt>
        <dd>{String(path.requires_existing_writer_dry_run_or_static_contract)}</dd>
        <dt>requires_current_working_or_canonical_state_ref_mapping</dt>
        <dd>
          {String(path.requires_current_working_or_canonical_state_ref_mapping)}
        </dd>
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
  contract: ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityContract;
}) {
  return (
    <section className="cockpit-surface-card">
      <h5>Source chain refs</h5>
      <dl>
        <dt>source_perspective_state_application_record_fingerprint</dt>
        <dd>
          {contract.source_perspective_state_application_record_fingerprint ??
            "none"}
        </dd>
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

function WriterCompatibilityReviewPreview({
  review,
}: {
  review: ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityReview;
}) {
  return (
    <section className="cockpit-surface-card">
      <h5>Local writer compatibility review</h5>
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
          <dt>accepted_source_state_application_receipt</dt>
          <dd>
            {review.accepted_mapping_summary
              .source_perspective_state_application_receipt_id ?? "none"}
          </dd>
          <dt>accepted_source_state_application_record</dt>
          <dd>
            {review.accepted_mapping_summary
              .source_perspective_state_application_record_id ?? "none"}
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
            {review.accepted_mapping_summary.intended_future_writer_target}
          </dd>
          <dt>accepted_writer_compatibility_label</dt>
          <dd>
            {review.accepted_mapping_summary.writer_compatibility_label ??
              "missing"}
          </dd>
        </dl>
      ) : null}
      <ReasonList title="Review blockers" reasons={review.unresolved_blockers} />
      <ReasonList title="Review warnings" reasons={review.warning_reasons} />
      <ReasonList
        title="Future requirements"
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
