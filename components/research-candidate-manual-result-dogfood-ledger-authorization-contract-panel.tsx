"use client";

import { useState } from "react";

import { ResearchCandidateManualGlobalDogfoodLedgerWritePanel } from "@/components/research-candidate-manual-global-dogfood-ledger-write-panel";
import { buildResearchCandidateManualResultDogfoodLedgerAuthorizationContract } from "@/lib/research-candidate-review/manual-result-dogfood-ledger-authorization-contract";
import { buildResearchCandidateManualResultDogfoodLedgerAuthorizationReview } from "@/lib/research-candidate-review/manual-result-dogfood-ledger-authorization-review";
import type { ResearchCandidateManualResultDogfoodBridgePreview } from "@/types/research-candidate-manual-result-dogfood-bridge-preview";
import type {
  ResearchCandidateManualResultDogfoodLedgerAuthorizationContract,
} from "@/types/research-candidate-manual-result-dogfood-ledger-authorization-contract";
import type {
  ResearchCandidateManualResultDogfoodLedgerAuthorizationReview,
  ResearchCandidateManualResultDogfoodLedgerAuthorizationReviewDecision,
} from "@/types/research-candidate-manual-result-dogfood-ledger-authorization-review";

const operatorDecisions: {
  value: ResearchCandidateManualResultDogfoodLedgerAuthorizationReviewDecision;
  label: string;
}[] = [
  {
    value: "accept_contract_for_future_write_slice",
    label: "Accept contract for future write slice",
  },
  {
    value: "needs_mapping_revision",
    label: "Needs mapping revision",
  },
  {
    value: "reject_contract",
    label: "Reject contract",
  },
  {
    value: "defer_contract",
    label: "Defer contract",
  },
];

export function ResearchCandidateManualResultDogfoodLedgerAuthorizationContractPanel({
  bridgePreview,
}: {
  bridgePreview: ResearchCandidateManualResultDogfoodBridgePreview;
}) {
  const [operatorDecision, setOperatorDecision] =
    useState<ResearchCandidateManualResultDogfoodLedgerAuthorizationReviewDecision>(
      "accept_contract_for_future_write_slice",
    );
  const [operatorNote, setOperatorNote] = useState("");
  const [review, setReview] =
    useState<ResearchCandidateManualResultDogfoodLedgerAuthorizationReview | null>(
      null,
    );
  const contract =
    buildResearchCandidateManualResultDogfoodLedgerAuthorizationContract({
      bridge_preview: bridgePreview,
      operator_intent_label:
        "research_candidate_review_manual_result_dogfood_ledger_authorization_contract_panel",
    });

  return (
    <section
      className="perspective-inspector-section manual-note-authorized-record-readback manual-result-dogfood-ledger-authorization-contract"
      aria-label="Manual result dogfood ledger authorization contract preview"
      data-augnes-authority="preview-only read-only no-ledger-write no-dogfood-metrics no-perspective no-proof no-work no-memory"
    >
      <div className="perspective-constellation-shell-header">
        <div>
          <p className="panel-eyebrow">AUGNES / Ledger Authorization Contract</p>
          <h3>Manual result dogfood ledger contract preview</h3>
          <p>
            This contract preview prepares future authorization only. It does
            not write global dogfood ledger records, dogfood metrics,
            Perspective, proof/evidence, work status, manual result records, or
            memory.
          </p>
        </div>
        <div className="perspective-constellation-shell-status">
          <span className="status-pill">{contract.operator_authorization_mode}</span>
          <span className="status-pill">local review only</span>
          <span className="status-pill">writes_now false</span>
        </div>
      </div>

      <div className="perspective-workbench-status-row">
        <span>
          source_bridge_preview_fingerprint{" "}
          <code>{contract.source_bridge_preview_fingerprint}</code>
        </span>
        <span>
          latest_committed_receipt{" "}
          <code>{contract.source_latest_committed_receipt_id ?? "none"}</code>
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
          <span>selected outcome</span>
          <strong>
            {
              contract.proposed_global_dogfood_mapping
                .selected_context_outcome_label
            }
          </strong>
          <small>
            refs{" "}
            {
              contract.proposed_global_dogfood_mapping
                .selected_candidate_context_refs.length
            }
          </small>
        </div>
        <div>
          <span>ledger candidate</span>
          <strong>
            {String(
              contract.proposed_global_dogfood_mapping
                .global_ledger_candidate_allowed,
            )}
          </strong>
          <small>metrics false</small>
        </div>
        <div>
          <span>durable ID</span>
          <strong>
            {String(contract.idempotency_contract_preview.durable_id_allocated)}
          </strong>
          <small>writes_now false</small>
        </div>
      </div>

      <div className="perspective-constellation-workspace-grid">
        <MappingSummary contract={contract} />
        <ReuseMappingSummary contract={contract} />
        <ExpectedObservedMappingSummary contract={contract} />
      </div>

      <section className="cockpit-surface-card">
        <h4>Idempotency contract preview</h4>
        <dl>
          <dt>proposed_idempotency_key</dt>
          <dd>{contract.idempotency_contract_preview.proposed_idempotency_key}</dd>
          <dt>fingerprint_algorithm</dt>
          <dd>{contract.idempotency_contract_preview.fingerprint_algorithm}</dd>
          <dt>would_prevent_duplicate_ledger_write</dt>
          <dd>
            {String(
              contract.idempotency_contract_preview
                .would_prevent_duplicate_ledger_write,
            )}
          </dd>
          <dt>durable_id_allocated</dt>
          <dd>{String(contract.idempotency_contract_preview.durable_id_allocated)}</dd>
          <dt>writes_now</dt>
          <dd>{String(contract.idempotency_contract_preview.writes_now)}</dd>
        </dl>
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
        <h4>Compatibility findings</h4>
        <div className="perspective-detail-stack">
          {contract.compatibility_findings.map((finding) => (
            <section key={finding.finding_code}>
              <h5>{finding.finding_code}</h5>
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

      <section className="cockpit-surface-card">
        <h4>Authority boundary</h4>
        <div className="perspective-workbench-status-row">
          <BoundaryFlag label="preview_only" value={contract.authority_boundary.preview_only} />
          <BoundaryFlag label="read_only" value={contract.authority_boundary.read_only} />
          <BoundaryFlag
            label="can_write_global_dogfood_ledger"
            value={contract.authority_boundary.can_write_global_dogfood_ledger}
          />
          <BoundaryFlag
            label="can_write_dogfood_metrics"
            value={contract.authority_boundary.can_write_dogfood_metrics}
          />
          <BoundaryFlag
            label="can_write_expected_observed_delta_global_record"
            value={
              contract.authority_boundary
                .can_write_expected_observed_delta_global_record
            }
          />
          <BoundaryFlag
            label="can_write_reuse_outcome_global_record"
            value={
              contract.authority_boundary.can_write_reuse_outcome_global_record
            }
          />
          <BoundaryFlag
            label="can_write_manual_result_records"
            value={contract.authority_boundary.can_write_manual_result_records}
          />
          <BoundaryFlag
            label="can_mutate_manual_result_records"
            value={contract.authority_boundary.can_mutate_manual_result_records}
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
            label="can_promote_perspective"
            value={contract.authority_boundary.can_promote_perspective}
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
            label="can_execute_codex"
            value={contract.authority_boundary.can_execute_codex}
          />
          <BoundaryFlag
            label="can_call_github"
            value={contract.authority_boundary.can_call_github}
          />
          <BoundaryFlag
            label="can_call_providers_or_openai"
            value={contract.authority_boundary.can_call_providers_or_openai}
          />
          <BoundaryFlag
            label="can_fetch_sources"
            value={contract.authority_boundary.can_fetch_sources}
          />
          <BoundaryFlag
            label="can_run_retrieval_rag_embeddings_vector_fts_or_crawler"
            value={
              contract.authority_boundary
                .can_run_retrieval_rag_embeddings_vector_fts_or_crawler
            }
          />
          <BoundaryFlag
            label="can_allocate_product_ids"
            value={contract.authority_boundary.can_allocate_product_ids}
          />
          <BoundaryFlag
            label="can_execute_product_write"
            value={contract.authority_boundary.can_execute_product_write}
          />
        </div>
      </section>

      <section className="cockpit-surface-card">
        <h4>Local operator review preview</h4>
        <fieldset className="perspective-detail-stack">
          <legend>Operator decision</legend>
          {operatorDecisions.map((decision) => (
            <label key={decision.value}>
              <input
                type="radio"
                name="manual-result-dogfood-ledger-auth-decision"
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
                buildResearchCandidateManualResultDogfoodLedgerAuthorizationReview({
                  authorization_contract: contract,
                  operator_decision: operatorDecision,
                  operator_note: operatorNote,
                }),
              )
            }
          >
            Preview authorization review
          </button>
          <button type="button" onClick={() => setReview(null)}>
            Clear review
          </button>
        </div>
        {review ? <ReviewPreview review={review} /> : null}
      </section>

      {review?.review_status === "ready_for_future_ledger_write_slice" ? (
        <ResearchCandidateManualGlobalDogfoodLedgerWritePanel
          authorizationContract={contract}
          authorizationReview={review}
        />
      ) : null}

      <p className="manual-note-runtime-hint">
        next_recommended_slice <code>{contract.next_recommended_slice}</code>
      </p>
    </section>
  );
}

function MappingSummary({
  contract,
}: {
  contract: ResearchCandidateManualResultDogfoodLedgerAuthorizationContract;
}) {
  const mapping = contract.proposed_global_dogfood_mapping;
  return (
    <section className="cockpit-surface-card">
      <h4>Proposed global dogfood mapping</h4>
      <dl>
        <dt>source_manual_receipt_id</dt>
        <dd>{mapping.source_manual_receipt_id ?? "none"}</dd>
        <dt>source_handoff_seed_fingerprint</dt>
        <dd>{mapping.source_handoff_seed_fingerprint ?? "missing"}</dd>
        <dt>source_result_text_fingerprint</dt>
        <dd>{mapping.source_result_text_fingerprint ?? "missing"}</dd>
        <dt>bridge_readiness</dt>
        <dd>{mapping.bridge_readiness ?? "missing"}</dd>
        <dt>expected_summary</dt>
        <dd>{mapping.expected_summary ?? "missing"}</dd>
        <dt>observed_summary</dt>
        <dd>{mapping.observed_summary ?? "missing"}</dd>
        <dt>mismatch_or_gap_summary</dt>
        <dd>{mapping.mismatch_or_gap_summary ?? "missing"}</dd>
        <dt>source_line</dt>
        <dd>{mapping.source_line ?? "missing"}</dd>
        <dt>manual_only_context_refs</dt>
        <dd>{mapping.manual_only_context_refs.length}</dd>
        <dt>field_gaps</dt>
        <dd>{mapping.field_gaps.length > 0 ? mapping.field_gaps.join(", ") : "none"}</dd>
      </dl>
    </section>
  );
}

function ReuseMappingSummary({
  contract,
}: {
  contract: ResearchCandidateManualResultDogfoodLedgerAuthorizationContract;
}) {
  const mapping = contract.proposed_reuse_outcome_ledger_mapping;
  return (
    <section className="cockpit-surface-card">
      <h4>Proposed reuse outcome ledger mapping</h4>
      <dl>
        <dt>source_reuse_outcome_record_ref</dt>
        <dd>{mapping.source_reuse_outcome_record_ref ?? "missing"}</dd>
        <dt>outcome_label</dt>
        <dd>{mapping.outcome_label}</dd>
        <dt>selected_reuse_candidate_refs</dt>
        <dd>{mapping.selected_reuse_candidate_refs.length}</dd>
        <dt>existing_writer_compatible</dt>
        <dd>
          {String(mapping.existing_handoff_reuse_outcome_ledger_writer_compatible)}
        </dd>
        <dt>compatibility_blockers_for_existing_writer</dt>
        <dd>
          {mapping.compatibility_blockers_for_existing_writer.length > 0
            ? mapping.compatibility_blockers_for_existing_writer.join(", ")
            : "none"}
        </dd>
        <dt>writes_now</dt>
        <dd>{String(mapping.writes_now)}</dd>
      </dl>
    </section>
  );
}

function ExpectedObservedMappingSummary({
  contract,
}: {
  contract: ResearchCandidateManualResultDogfoodLedgerAuthorizationContract;
}) {
  const mapping = contract.proposed_expected_observed_delta_mapping;
  return (
    <section className="cockpit-surface-card">
      <h4>Proposed expected/observed mapping</h4>
      <dl>
        <dt>source_expected_observed_delta_record_ref</dt>
        <dd>{mapping.source_expected_observed_delta_record_ref ?? "missing"}</dd>
        <dt>expected_summary</dt>
        <dd>{mapping.expected_summary ?? "missing"}</dd>
        <dt>observed_summary</dt>
        <dd>{mapping.observed_summary ?? "missing"}</dd>
        <dt>mismatch_or_gap_summary</dt>
        <dd>{mapping.mismatch_or_gap_summary ?? "missing"}</dd>
        <dt>writes_now</dt>
        <dd>{String(mapping.writes_now)}</dd>
      </dl>
    </section>
  );
}

function ReasonList({ title, reasons }: { title: string; reasons: string[] }) {
  return (
    <section className="cockpit-surface-card">
      <h4>{title}</h4>
      <ul>
        {(reasons.length > 0 ? reasons : ["none"]).map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
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

function ReviewPreview({
  review,
}: {
  review: ResearchCandidateManualResultDogfoodLedgerAuthorizationReview;
}) {
  return (
    <section className="cockpit-surface-card">
      <h5>Authorization review preview</h5>
      <div className="perspective-workbench-status-row">
        <span>
          review_status <code>{review.review_status}</code>
        </span>
        <span>
          operator_note_persisted{" "}
          <code>{String(review.validation.operator_note_persisted)}</code>
        </span>
        <span>
          no_write_authority <code>{String(review.validation.no_write_authority)}</code>
        </span>
      </div>
      <dl>
        <dt>review_fingerprint</dt>
        <dd>{review.validation.review_fingerprint}</dd>
        <dt>accepted_mapping_summary</dt>
        <dd>
          {review.accepted_mapping_summary
            ? `${review.accepted_mapping_summary.source_manual_receipt_id} / ${review.accepted_mapping_summary.proposed_idempotency_key}`
            : "not accepted"}
        </dd>
        <dt>unresolved_blockers</dt>
        <dd>
          {review.unresolved_blockers.length > 0
            ? review.unresolved_blockers.join(", ")
            : "none"}
        </dd>
        <dt>future_write_requirements</dt>
        <dd>{review.future_write_requirements.length}</dd>
      </dl>
    </section>
  );
}
