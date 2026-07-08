"use client";

import { useEffect, useState } from "react";

import { buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunContract } from "@/lib/research-candidate-review/manual-global-dogfood-perspective-existing-writer-dry-run-contract";
import { buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunReview } from "@/lib/research-candidate-review/manual-global-dogfood-perspective-existing-writer-dry-run-review";
import { ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunResultPanel } from "@/components/research-candidate-manual-global-dogfood-perspective-existing-writer-dry-run-result-panel";
import type { ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunContract } from "@/types/research-candidate-manual-global-dogfood-perspective-existing-writer-dry-run-contract";
import type {
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunReview,
  ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunReviewDecision,
} from "@/types/research-candidate-manual-global-dogfood-perspective-existing-writer-dry-run-review";
import type { ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityReadback } from "@/types/research-candidate-manual-global-dogfood-perspective-writer-compatibility-write";

const reviewDecisions: {
  value: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunReviewDecision;
  label: string;
}[] = [
  {
    value: "accept_contract_for_future_existing_writer_dry_run_adapter_write_slice",
    label: "Accept contract for future adapter slice",
  },
  {
    value: "needs_existing_writer_dry_run_adapter_mapping_revision",
    label: "Needs adapter mapping revision",
  },
  {
    value: "reject_existing_writer_dry_run_contract",
    label: "Reject contract",
  },
  {
    value: "defer_existing_writer_dry_run_contract",
    label: "Defer contract",
  },
];

export function ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunContractPanel({
  readback,
}: {
  readback: ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityReadback;
}) {
  const [operatorDecision, setOperatorDecision] =
    useState<ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunReviewDecision>(
      "accept_contract_for_future_existing_writer_dry_run_adapter_write_slice",
    );
  const [operatorNote, setOperatorNote] = useState("");
  const [review, setReview] =
    useState<ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunReview | null>(
      null,
    );
  const [reviewContractFingerprint, setReviewContractFingerprint] = useState<
    string | null
  >(null);
  const contract =
    buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunContract({
      readback,
      operator_intent_label:
        "research_candidate_manual_global_dogfood_perspective_existing_writer_dry_run_contract_panel",
    });
  const acceptedResultHarnessReview =
    buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunReview({
      existing_writer_dry_run_contract: contract,
      operator_decision:
        "accept_contract_for_future_existing_writer_dry_run_adapter_write_slice",
    });
  const currentContractFingerprint = contract.validation.contract_fingerprint;
  const currentReview =
    review &&
    review.source_contract_fingerprint === currentContractFingerprint &&
    (!review.accepted_mapping_summary ||
      (review.accepted_mapping_summary.proposed_idempotency_key ===
        contract.idempotency_contract_preview.proposed_idempotency_key &&
        review.accepted_mapping_summary
          .source_perspective_writer_compatibility_receipt_id ===
          contract.source_perspective_writer_compatibility_receipt_id &&
        review.accepted_mapping_summary
          .source_perspective_writer_compatibility_record_id ===
          contract.source_perspective_writer_compatibility_record_id &&
        review.accepted_mapping_summary
          .source_perspective_writer_compatibility_record_fingerprint ===
          contract.source_perspective_writer_compatibility_record_fingerprint &&
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
    nextDecision: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunReviewDecision,
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
      buildResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunReview({
        existing_writer_dry_run_contract: contract,
        operator_decision: operatorDecision,
        operator_note: operatorNote,
      });
    setReview(nextReview);
    setReviewContractFingerprint(currentContractFingerprint);
  }

  return (
    <section
      className="perspective-inspector-section manual-global-dogfood-perspective-existing-writer-dry-run-contract"
      aria-label="Manual global dogfood Perspective existing writer dry-run adapter contract preview"
      data-augnes-authority="preview-only read-only no-existing-writer-dry-run no-existing-writer-call no-current-working-perspective no-existing-canonical-state no-promotion no-memory no-work no-proof no-metrics"
    >
      <div className="perspective-constellation-shell-header">
        <div>
          <p className="panel-eyebrow">
            AUGNES / Existing Writer Dry-Run Adapter Contract
          </p>
          <h4>Existing writer dry-run adapter contract preview</h4>
          <p>
            This local preview derives adapter requirements from active
            committed manual Perspective writer compatibility readback. It has
            no write authority, no dry-run authority, and no existing writer
            call authority.
          </p>
        </div>
        <div className="perspective-constellation-shell-status">
          <span className="status-pill">
            {contract.operator_authorization_mode}
          </span>
          <span className="status-pill">local review only</span>
          <span className="status-pill">dry-run false</span>
        </div>
      </div>

      <div className="perspective-workbench-status-row">
        <span>
          source_writer_compatibility_receipt{" "}
          <code>
            {contract.source_perspective_writer_compatibility_receipt_id ??
              "none"}
          </code>
        </span>
        <span>
          source_writer_compatibility_record{" "}
          <code>
            {contract.source_perspective_writer_compatibility_record_id ??
              "none"}
          </code>
        </span>
        <span>
          source_state_application{" "}
          <code>
            {contract.source_perspective_state_application_receipt_id ?? "none"}
          </code>
        </span>
        <span>
          source_adapter{" "}
          <code>{contract.source_perspective_adapter_receipt_id ?? "none"}</code>
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
            {contract.proposed_existing_writer_dry_run_candidate.dry_run_scope_hint}
          </strong>
          <small>
            {contract.proposed_existing_writer_dry_run_candidate.candidate_status}
          </small>
        </div>
        <div>
          <span>future target</span>
          <strong>
            {
              contract.proposed_existing_writer_dry_run_mapping
                .intended_future_dry_run_target
            }
          </strong>
          <small>existing writers remain compatibility-only</small>
        </div>
        <div>
          <span>runtime authority</span>
          <strong>
            {String(
              contract.proposed_existing_writer_dry_run_candidate
                .would_run_existing_writer_dry_run ||
                contract.proposed_existing_writer_dry_run_candidate
                  .would_call_existing_current_working_writer ||
                contract.proposed_existing_writer_dry_run_candidate
                  .would_call_existing_canonical_state_writer,
            )}
          </strong>
          <small>dry-run and writer invocation false</small>
        </div>
      </div>

      <div className="perspective-constellation-workspace-grid">
        <DryRunMappingSummary contract={contract} />
        <ExistingCurrentWorkingDryRunCompatibility contract={contract} />
        <ExistingCanonicalStateDryRunCompatibility contract={contract} />
        <ManualExistingWriterAdapterPathSummary contract={contract} />
        <ProposedDryRunInputContractSummary contract={contract} />
        <SourceRefsSummary contract={contract} />
      </div>

      <section className="cockpit-surface-card">
        <h5>Idempotency preview</h5>
        <dl>
          <dt>proposed_idempotency_key</dt>
          <dd>{contract.idempotency_contract_preview.proposed_idempotency_key}</dd>
          <dt>fingerprint_algorithm</dt>
          <dd>{contract.idempotency_contract_preview.fingerprint_algorithm}</dd>
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
            label="can_run_existing_writer_dry_run"
            value={contract.authority_boundary.can_run_existing_writer_dry_run}
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
        <p>
          This review is local React state only. Operator note text is not
          persisted and is excluded from future idempotency material.
        </p>
        <div className="manual-review-decision-list">
          {reviewDecisions.map((decision) => (
            <label key={decision.value}>
              <input
                type="radio"
                name="manual-perspective-existing-writer-dry-run-review-decision"
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
        {currentReview ? <DryRunReviewPreview review={currentReview} /> : null}
      </section>

      <ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunResultPanel
        existingWriterDryRunContract={contract}
        existingWriterDryRunReview={acceptedResultHarnessReview}
      />
    </section>
  );
}

function DryRunMappingSummary({
  contract,
}: {
  contract: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunContract;
}) {
  const mapping = contract.proposed_existing_writer_dry_run_mapping;
  return (
    <section className="cockpit-surface-card">
      <h5>Proposed existing writer dry-run mapping</h5>
      <dl>
        <dt>dry_run_label</dt>
        <dd>{mapping.dry_run_label ?? "missing"}</dd>
        <dt>dry_run_rationale</dt>
        <dd>{mapping.dry_run_rationale ?? "missing"}</dd>
        <dt>writer_compatibility_label</dt>
        <dd>{mapping.writer_compatibility_label ?? "missing"}</dd>
        <dt>writer_compatibility_rationale</dt>
        <dd>{mapping.writer_compatibility_rationale ?? "missing"}</dd>
        <dt>state_application_label</dt>
        <dd>{mapping.state_application_label ?? "missing"}</dd>
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
        <dt>intended_future_dry_run_target</dt>
        <dd>{mapping.intended_future_dry_run_target}</dd>
        <dt>default_future_dry_run_target</dt>
        <dd>{mapping.default_future_dry_run_target}</dd>
        <dt>expected_summary</dt>
        <dd>{mapping.expected_summary ?? "missing"}</dd>
        <dt>observed_summary</dt>
        <dd>{mapping.observed_summary ?? "missing"}</dd>
        <dt>mismatch_or_gap_summary</dt>
        <dd>{mapping.mismatch_or_gap_summary ?? "missing"}</dd>
      </dl>
    </section>
  );
}

function ExistingCurrentWorkingDryRunCompatibility({
  contract,
}: {
  contract: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunContract;
}) {
  const compatibility =
    contract.existing_current_working_writer_dry_run_compatibility;
  return (
    <section className="cockpit-surface-card">
      <h5>Existing current-working writer dry-run compatibility</h5>
      <dl>
        <dt>dry_run_entrypoint_detected</dt>
        <dd>{String(compatibility.dry_run_entrypoint_detected)}</dd>
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
        <dt>dry_run_gaps</dt>
        <dd>{compatibility.dry_run_gaps.join(", ")}</dd>
        <dt>manual_source_refs_preserved</dt>
        <dd>{String(compatibility.manual_source_refs_preserved)}</dd>
      </dl>
      <ReasonList
        title="Current-working dry-run missing fields"
        reasons={compatibility.dry_run_missing_fields}
      />
    </section>
  );
}

function ExistingCanonicalStateDryRunCompatibility({
  contract,
}: {
  contract: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunContract;
}) {
  const compatibility =
    contract.existing_canonical_state_writer_dry_run_compatibility;
  return (
    <section className="cockpit-surface-card">
      <h5>Existing canonical state writer dry-run compatibility</h5>
      <dl>
        <dt>dry_run_entrypoint_detected</dt>
        <dd>{String(compatibility.dry_run_entrypoint_detected)}</dd>
        <dt>canonical_state_writer</dt>
        <dd>
          {String(
            compatibility.existing_canonical_perspective_state_writer_compatible,
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
        <dt>dry_run_gaps</dt>
        <dd>{compatibility.dry_run_gaps.join(", ")}</dd>
      </dl>
      <ReasonList
        title="Canonical dry-run missing fields"
        reasons={compatibility.dry_run_missing_fields}
      />
    </section>
  );
}

function ManualExistingWriterAdapterPathSummary({
  contract,
}: {
  contract: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunContract;
}) {
  const path = contract.proposed_manual_existing_writer_adapter_path;
  return (
    <section className="cockpit-surface-card">
      <h5>Proposed manual existing-writer adapter path</h5>
      <dl>
        <dt>recommended_storage_path</dt>
        <dd>{path.recommended_storage_path}</dd>
        <dt>expected_future_write_scope</dt>
        <dd>{path.expected_future_write_scope}</dd>
        <dt>requires_existing_writer_dry_run_contract</dt>
        <dd>{String(path.requires_existing_writer_dry_run_contract)}</dd>
        <dt>requires_existing_writer_dry_run_result_readback</dt>
        <dd>{String(path.requires_existing_writer_dry_run_result_readback)}</dd>
        <dt>requires_existing_writer_non_mutation_proof</dt>
        <dd>{String(path.requires_existing_writer_non_mutation_proof)}</dd>
        <dt>requires_strict_dry_run_side_effect_boundary</dt>
        <dd>{String(path.requires_strict_dry_run_side_effect_boundary)}</dd>
      </dl>
    </section>
  );
}

function ProposedDryRunInputContractSummary({
  contract,
}: {
  contract: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunContract;
}) {
  const input = contract.proposed_dry_run_input_contract;
  return (
    <section className="cockpit-surface-card">
      <h5>Proposed dry-run input contract</h5>
      <dl>
        <dt>can_construct_existing_current_working_writer_input_now</dt>
        <dd>
          {String(input.can_construct_existing_current_working_writer_input_now)}
        </dd>
        <dt>can_construct_existing_canonical_state_writer_input_now</dt>
        <dd>
          {String(input.can_construct_existing_canonical_state_writer_input_now)}
        </dd>
        <dt>would_require_manual_adapter_record</dt>
        <dd>{String(input.would_require_manual_adapter_record)}</dd>
        <dt>would_require_existing_writer_dry_run_route</dt>
        <dd>{String(input.would_require_existing_writer_dry_run_route)}</dd>
        <dt>would_require_row_count_before_after_snapshot</dt>
        <dd>
          {String(input.would_require_row_count_before_after_snapshot)}
        </dd>
      </dl>
      <ReasonList
        title="Current-working missing fields"
        reasons={input.missing_fields_for_existing_current_working_writer}
      />
      <ReasonList
        title="Canonical missing fields"
        reasons={input.missing_fields_for_existing_canonical_state_writer}
      />
      <ReasonList title="Non-fabrication rules" reasons={input.non_fabrication_rules} />
    </section>
  );
}

function SourceRefsSummary({
  contract,
}: {
  contract: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunContract;
}) {
  return (
    <section className="cockpit-surface-card">
      <h5>Source chain refs</h5>
      <dl>
        <dt>source_perspective_writer_compatibility_record_fingerprint</dt>
        <dd>
          {contract.source_perspective_writer_compatibility_record_fingerprint ??
            "none"}
        </dd>
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
        <dt>source_metric_snapshot_receipt_id</dt>
        <dd>{contract.source_metric_snapshot_receipt_id ?? "none"}</dd>
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

function DryRunReviewPreview({
  review,
}: {
  review: ResearchCandidateManualGlobalDogfoodPerspectiveExistingWriterDryRunReview;
}) {
  return (
    <section className="cockpit-surface-card">
      <h5>Local dry-run adapter review</h5>
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
        <dt>no_dry_run_authority</dt>
        <dd>{String(review.validation.no_dry_run_authority)}</dd>
      </dl>
      {review.accepted_mapping_summary ? (
        <dl>
          <dt>accepted_source_writer_compatibility_receipt</dt>
          <dd>
            {review.accepted_mapping_summary
              .source_perspective_writer_compatibility_receipt_id ?? "none"}
          </dd>
          <dt>accepted_source_writer_compatibility_record_fingerprint</dt>
          <dd>
            {review.accepted_mapping_summary
              .source_perspective_writer_compatibility_record_fingerprint ??
              "none"}
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
            {review.accepted_mapping_summary.intended_future_dry_run_target}
          </dd>
          <dt>accepted_dry_run_label</dt>
          <dd>{review.accepted_mapping_summary.dry_run_label ?? "missing"}</dd>
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
