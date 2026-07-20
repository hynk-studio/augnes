"use client";

import { useState } from "react";

import type { ProjectVerifyRevisionLifecycleV01 } from "@/types/vnext/project-verify-reconciliation";

import { ContextUseReviewForm } from "./context-use-review-form";
import { DurableLineagePanel } from "./durable-lineage-panel";
import { OperationAwareRevisionForm } from "./operation-aware-revision-form";
import { ProjectVerificationWorkbench } from "./project-verification-workbench";
import { RunAssessmentSnapshot } from "./proposal-detail";
import { ReviewDecisionForm } from "./review-decision-form";
import { SemanticTransitionActions } from "./semantic-transition-actions";
import { StrategicAdvantageTransferPanel } from "./strategic-advantage-transfer-panel";
import type {
  SemanticContextUseReviewRequestV01,
  SemanticReviewDecisionRequestV01,
  SemanticReviewProposalDetailV01,
  SemanticReviewProjectV01,
  SemanticReviewRevisionRequestV01,
  SemanticReviewStrategicAnalysisRequestV01,
} from "./semantic-review-types";
import styles from "./semantic-review.module.css";

export function DecisionCenteredProposalDetail({
  project,
  read,
  busyCandidateId,
  onDecision,
  onRevision,
  onStrategicAnalysis,
  strategicAnalysisBusy,
  onContextUseReview,
  onSessionInvalid,
  onPrivateMaterialChanged,
  tryBeginOperatorMutation,
  endOperatorMutation,
}: {
  project: SemanticReviewProjectV01;
  read: SemanticReviewProposalDetailV01;
  busyCandidateId: string | null;
  onDecision: (request: SemanticReviewDecisionRequestV01) => Promise<void>;
  onRevision: (request: SemanticReviewRevisionRequestV01) => Promise<void>;
  onStrategicAnalysis: (
    request: SemanticReviewStrategicAnalysisRequestV01,
  ) => Promise<void>;
  strategicAnalysisBusy: boolean;
  onContextUseReview: (
    request: SemanticContextUseReviewRequestV01,
  ) => Promise<void>;
  onSessionInvalid: (errorCode: string) => void;
  onPrivateMaterialChanged: () => Promise<void>;
  tryBeginOperatorMutation: () => boolean;
  endOperatorMutation: () => void;
}) {
  const proposal = read.proposal;
  const [selectedCandidateId, setSelectedCandidateId] = useState(
    read.candidates[0]?.candidate.candidate_id ?? "",
  );
  const selected =
    read.candidates.find(
      (candidate) => candidate.candidate.candidate_id === selectedCandidateId,
    ) ?? read.candidates[0] ?? null;
  const selectedDecisions = selected
    ? read.decision_history.filter(
        (entry) =>
          entry.decision.candidate.candidate_id ===
          selected.candidate.candidate_id,
      )
    : [];
  const lifecycle = selected
    ? selectedProjectVerifyLifecycleV01(read, selected.candidate.candidate_id)
    : null;
  const applyingDecision = selected
    ? selectedApplyingDecisionV01(read, selected.candidate.candidate_id)
    : "accept";
  const strategicActionsAvailable =
    !proposal.strategic_advantage_transfer ||
    read.strategic_analysis.status === "available";
  const packetRef = proposal.task_context_packet_ref;
  const priorPacket =
    packetRef?.ref_type === "task_context_packet" &&
    typeof packetRef.source_ref === "string" &&
    /^sha256:[a-f0-9]{64}$/.test(packetRef.source_ref)
      ? {
          packet_id: packetRef.external_id,
          packet_fingerprint: packetRef.source_ref,
        }
      : null;

  return (
    <section
      className={styles.workbenchSequence}
      data-vnext-semantic-review-detail="v0.1"
      data-vnext-decision-workbench-detail="v0.1"
      data-vnext-selected-candidate={selected ? "present" : "none"}
    >
      <section className={styles.panel} aria-labelledby="selected-review-title">
        <div className={styles.panelHeader}>
          <div className={styles.rowBetween}>
            <p className={styles.kicker}>Selected review</p>
            <span className={styles.badge}>{proposal.status}</span>
          </div>
          <h2 id="selected-review-title">{proposal.bounded_summary}</h2>
          <p className={styles.copy}>
            Verify the exact source chain first, then review one selected
            candidate. Proposal presence and recording order do not make it
            current or true.
          </p>
        </div>
        <dl className={styles.statusGrid}>
          <DataPoint label="Project scope" value="selected and server-validated" />
          <DataPoint
            label="Source currentness"
            value={humanize(proposal.source_status.currentness)}
          />
          <DataPoint
            label="Candidates"
            value={String(read.candidates.length)}
          />
          <div data-vnext-transition-status={read.transition.status}>
            <dt>Transition</dt>
            <dd>{read.transition.status}</dd>
          </div>
          <DataPoint
            label="Pending project reviews"
            value={String(read.project_continuity.pending_proposal_count)}
          />
          <DataPoint
            label="Accepted decisions awaiting Transition"
            value={String(
              read.project_continuity.pending_accepted_decision_count,
            )}
          />
          <DataPoint
            label="Later packet"
            value={humanize(read.project_continuity.packet_currentness)}
          />
          <DataPoint
            label="Applied current entries"
            value={String(read.project_continuity.current_accepted_state_count)}
          />
        </dl>
        <details className={styles.disclosure}>
          <summary>Exact proposal identity and compatibility lineage</summary>
          <span className={styles.identifier}>{project.workspace_id}</span>
          <span className={styles.identifier}>{project.project_id}</span>
          <span className={styles.identifier}>{proposal.proposal_id}</span>
          <span className={styles.identifier}>{proposal.integrity.fingerprint}</span>
          <span className={styles.muted}>Created {proposal.created_at}</span>
        </details>
      </section>

      <ProjectVerificationWorkbench
        project={project}
        reconciliation={read.project_verify_reconciliation}
        lineage={read.project_verify_lineage}
        sourceAssessment={proposal.source_assessment}
        sourceReceipts={read.source_run_receipts}
        sourceCurrentness={proposal.source_status.currentness}
        packetRef={proposal.task_context_packet_ref}
      />

      {proposal.source_assessment ? (
        <details className={styles.inspectionDisclosure}>
          <summary>Retained exact assessment compatibility detail</summary>
          <p className={styles.muted}>
            The canonical reasoning sequence above is the active Verify view.
            This exact historical assessment read remains available until PR C
            completes the shared Inspector audit.
          </p>
          <RunAssessmentSnapshot
            source={proposal.source_assessment}
            criterionRelationsSourceBound={
              read.criterion_specific_relations_source_bound
            }
          />
        </details>
      ) : null}

      <StrategicAdvantageTransferPanel
        proposal={proposal}
        readback={read.strategic_analysis}
        busy={strategicAnalysisBusy}
        onRequest={onStrategicAnalysis}
      />

      <section
        className={styles.panel}
        data-vnext-operator-step="candidate"
        aria-labelledby="candidate-decision-title"
      >
        <div className={styles.panelHeader}>
          <p className={styles.kicker}>Reasoning steps 7–10</p>
          <h2 id="candidate-decision-title">
            Proposed change, uncertainty, revision, and ReviewDecision
          </h2>
          <p className={styles.copy}>
            Select one immutable candidate. Editing creates a separate revision;
            it is never a ReviewDecision. The decision form sends only the
            selected candidate and supported canonical decision value.
          </p>
        </div>

        {read.candidates.length > 1 ? (
          <label className={styles.fieldLabel}>
            Candidate to review
            <select
              className={styles.selectControl}
              value={selected?.candidate.candidate_id ?? ""}
              disabled={busyCandidateId !== null}
              onChange={(event) => setSelectedCandidateId(event.target.value)}
            >
              {read.candidates.map((candidate) => (
                <option
                  key={candidate.candidate.candidate_id}
                  value={candidate.candidate.candidate_id}
                >
                  {candidate.candidate.title} · {humanize(candidate.candidate.operation)}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {selected ? (
          <section
            className={styles.candidate}
            data-vnext-candidate-id="selected"
            data-vnext-candidate-accept-eligible={String(
              selected.pilot_admission.decision_allowed.accept,
            )}
            data-selected-candidate-operation={selected.candidate.operation}
            data-selected-candidate-current-state={
              selected.pilot_admission.current_state_status
            }
          >
            <div className={styles.candidateHeader}>
              <div>
                <p className={styles.kicker}>{humanize(selected.candidate.delta_type)}</p>
                <h3>{selected.candidate.title}</h3>
              </div>
              <span className={styles.badge}>
                {humanize(selected.candidate.operation)}
              </span>
            </div>
            <p className={styles.copy}>{selected.candidate.proposed_state_summary}</p>
            <dl className={styles.statusGrid}>
              <DataPoint
                label="Target family"
                value={targetFamilyLabelV01(
                  read,
                  selected.candidate.candidate_id,
                  selected.candidate.target_refs.length,
                )}
              />
              <DataPoint
                label="Current-head expectation"
                value={currentHeadExpectationV01(
                  read,
                  selected.candidate.candidate_id,
                  selected.pilot_admission.current_state_status,
                )}
              />
              <DataPoint
                label="Transition effect"
                value={
                  selected.pilot_admission.mapped_operation
                    ? humanize(selected.pilot_admission.mapped_operation)
                    : "not transitionable"
                }
              />
              <DataPoint
                label={`${humanize(applyingDecision)} eligibility`}
                value={
                  selected.pilot_admission.decision_allowed.accept
                    ? "eligible"
                    : "blocked"
                }
              />
            </dl>
            <TextList title="Uncertainty" items={selected.candidate.uncertainties} />
            <TextList title="Limitations" items={selected.candidate.limitations} />
            <TextList
              title="Transition blockers"
              items={selected.pilot_admission.blocking_reasons.map(humanize)}
            />
            <details className={styles.disclosure}>
              <summary>Exact selected candidate and target bindings</summary>
              <span className={styles.identifier}>{selected.candidate.candidate_id}</span>
              <span className={styles.identifier}>{selected.candidate_fingerprint}</span>
              {selected.candidate.target_refs.map((ref) => (
                <span className={styles.identifier} key={externalRefKey(ref)}>
                  {ref.ref_type} · {ref.external_id} · {ref.source_ref ?? "no source fingerprint"}
                </span>
              ))}
            </details>

            {proposal.operation_revision ? (
              <section
                className={styles.materialCard}
                data-vnext-operation-revision="v0.1"
              >
                <h3>Immutable operation-aware revision</h3>
                <span>
                  {humanize(proposal.operation_revision.selected_operation)} · {humanize(proposal.operation_revision.selected_delta_type)}
                </span>
                <p className={styles.copy}>
                  {proposal.operation_revision.rationale_summary}
                </p>
                <p className={styles.muted}>
                  The source proposal and candidate remain unchanged. This
                  revision is still candidate material.
                </p>
              </section>
            ) : null}

            <SelectedLifecycle lifecycle={lifecycle} />
            <DecisionHistory decisions={selectedDecisions} />

            {strategicActionsAvailable ? (
              <ReviewDecisionForm
                key={selected.candidate.candidate_id}
                proposalId={proposal.proposal_id}
                proposalFingerprint={proposal.integrity.fingerprint}
                candidateRead={selected}
                applyingDecision={applyingDecision}
                busy={busyCandidateId !== null}
                onSubmit={onDecision}
              />
            ) : (
              <p className={styles.notice} data-vnext-strategic-candidate-actions="blocked">
                This strategic candidate remains readable, but action is blocked
                until its exact source lineage is current and available.
              </p>
            )}

            {strategicActionsAvailable &&
            !proposal.operation_revision &&
            (selected.candidate.operation === "unknown" ||
              selected.candidate.operation === "no_change") &&
            (!proposal.strategic_advantage_transfer ||
              proposal.strategic_advantage_transfer.transfer_items.some(
                (transfer) =>
                  selected.candidate.candidate_id ===
                  `strategic-candidate:${transfer.transfer_id.slice(
                    "strategic-transfer:".length,
                  )}`,
              )) ? (
              <OperationAwareRevisionForm
                proposalId={proposal.proposal_id}
                proposalFingerprint={proposal.integrity.fingerprint}
                sourceAssessment={proposal.source_assessment}
                strategicAdvantageTransfer={proposal.strategic_advantage_transfer}
                candidateRead={selected}
                busy={busyCandidateId !== null}
                onSubmit={onRevision}
              />
            ) : null}
          </section>
        ) : (
          <p className={styles.empty}>
            No exact candidate exists in this proposal. No decision is available.
          </p>
        )}
      </section>

      {selected ? (
        <SemanticTransitionActions
          proposalId={proposal.proposal_id}
          proposalFingerprint={proposal.integrity.fingerprint}
          selectedCandidateId={selected.candidate.candidate_id}
          decisions={read.decision_history
            .filter((item) => item.pilot_actionable)
            .map((item) => item.decision)}
          persistedReceipts={read.transition_receipts}
          priorPacket={priorPacket}
          onSessionInvalid={onSessionInvalid}
          onPrivateMaterialChanged={onPrivateMaterialChanged}
          tryBeginOperatorMutation={tryBeginOperatorMutation}
          endOperatorMutation={endOperatorMutation}
        />
      ) : null}

      <LaterContextFeedback
        read={read}
        proposalId={proposal.proposal_id}
        busy={busyCandidateId !== null}
        onContextUseReview={onContextUseReview}
      />

      <details className={styles.inspectionDisclosure}>
        <summary>Retained exact R6 lineage inspection</summary>
        <p className={styles.muted}>
          This read-only compatibility detail remains available until PR C
          attaches the shared Inspector. It contains no mutation controls.
        </p>
        <DurableLineagePanel lineage={read.durable_lineage} />
      </details>
    </section>
  );
}

function SelectedLifecycle({
  lifecycle,
}: {
  lifecycle: ProjectVerifyRevisionLifecycleV01 | null;
}) {
  if (!lifecycle) {
    return (
      <p className={styles.empty} data-selected-core-lifecycle="historical_generic">
        This historical or generic semantic candidate has no SR-3 Verify
        lifecycle profile. Existing R6 decision and Transition lineage below
        remains authoritative; no Verify lifecycle is reconstructed locally.
      </p>
    );
  }
  return (
    <section
      className={styles.materialCard}
      data-selected-core-lifecycle={lifecycle.application.status}
      data-selected-gate-status={lifecycle.gate.status}
      data-selected-transition-status={lifecycle.transition.status}
    >
      <div className={styles.rowBetween}>
        <h3>Canonical lifecycle for the selected Verify record</h3>
        <span className={styles.badge}>{humanize(lifecycle.application.status)}</span>
      </div>
      <dl className={styles.statusGrid}>
        <DataPoint label="Proposal review" value={humanize(lifecycle.review.status)} />
        <DataPoint label="ReviewDecision" value={humanize(lifecycle.decision.status)} />
        <DataPoint label="Gate" value={humanize(lifecycle.gate.status)} />
        <DataPoint label="Transition" value={humanize(lifecycle.transition.status)} />
      </dl>
      <p className={styles.copy}>
        Recorded, reviewed, gate-authorized, applied, current, superseded, and
        retracted are separate states. Claim truth remains not established.
      </p>
      {lifecycle.conflicts.length > 0 ? (
        <TextList
          title="Exact lifecycle conflicts"
          items={lifecycle.conflicts.map(
            (conflict) =>
              `${humanize(conflict.conflict_kind)}: ${humanize(conflict.code)}`,
          )}
        />
      ) : null}
    </section>
  );
}

function DecisionHistory({
  decisions,
}: {
  decisions: SemanticReviewProposalDetailV01["decision_history"];
}) {
  return (
    <section
      className={styles.materialCard}
      data-selected-decision-history="true"
      data-vnext-decision-history="v0.1"
    >
      <h3>ReviewDecision history for this exact candidate</h3>
      {decisions.length === 0 ? (
        <p className={styles.empty}>
          No ReviewDecision is persisted for this proposal and selected
          candidate. Candidate presence is not a decision.
        </p>
      ) : (
        <ol className={styles.plainList}>
          {decisions.map((entry) => (
            <li key={entry.decision.decision_id}>
              <strong>{humanize(entry.decision.decision)}</strong>
              <span>{entry.decision.rationale_summary}</span>
              <span>
                Transition requested: {entry.decision.requested_transition_intent ? "yes, intent only" : "no"} · applied by decision: no
              </span>
              <details className={styles.disclosure}>
                <summary>Exact decision binding</summary>
                <span className={styles.identifier}>{entry.decision.decision_id}</span>
                <span className={styles.identifier}>
                  {entry.decision.integrity.fingerprint}
                </span>
              </details>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function LaterContextFeedback({
  read,
  proposalId,
  busy,
  onContextUseReview,
}: {
  read: SemanticReviewProposalDetailV01;
  proposalId: string;
  busy: boolean;
  onContextUseReview: (
    request: SemanticContextUseReviewRequestV01,
  ) => Promise<void>;
}) {
  const receipt = read.project_continuity.latest_context_use_receipt;
  const review = read.project_continuity.latest_context_use_review_status;
  const belongsToProposal =
    read.project_continuity.latest_applied_transition?.proposal_id === proposalId;

  if (!belongsToProposal || !receipt) {
    return (
      <section className={styles.panel} data-vnext-context-use-feedback="not_yet_available">
        <div className={styles.panelHeader}>
          <p className={styles.kicker}>Reasoning step 13</p>
          <h2>Later ContextUseReview is not yet available</h2>
        </div>
        <p className={styles.empty}>
          Feedback requires a successful Transition, its compiler-produced later
          packet, and a real later RunReceipt. Rendering this page creates none
          of those stages.
        </p>
      </section>
    );
  }

  const exactReview =
    review?.later_task_run_receipt_id === receipt.receipt_id &&
    review.later_task_run_receipt_fingerprint === receipt.receipt_fingerprint
      ? review
      : null;
  return (
    <section className={styles.panel} data-vnext-context-use-feedback="available">
      <div className={styles.panelHeader}>
        <p className={styles.kicker}>Reasoning step 13</p>
        <h2>Actual later-context use and feedback</h2>
      </div>
      <p className={styles.copy}>
        Packet presentation, user-declared actual use, and usefulness remain
        separate classifications. Task-wide receipt trust counts do not upgrade
        the feedback declaration into observation or attestation.
      </p>
      <dl className={styles.statusGrid}>
        <DataPoint
          label="Task-wide direct observations"
          value={String(receipt.trust_summary.direct_observations)}
        />
        <DataPoint
          label="Task-wide verified external observations"
          value={String(receipt.trust_summary.verified_external_observations)}
        />
        <DataPoint
          label="Task-wide host attestations"
          value={String(receipt.trust_summary.host_attestations)}
        />
        <DataPoint
          label="Task-wide provider reports"
          value={String(receipt.trust_summary.provider_reports)}
        />
      </dl>
      {exactReview ? (
        <dl className={styles.statusGrid}>
          <DataPoint label="Presented" value={humanize(exactReview.presented)} />
          <DataPoint
            label="Presentation basis"
            value={
              exactReview.presentation_basis ??
              "not recorded (historical)"
            }
          />
          <DataPoint
            label="Actually used"
            value={humanize(exactReview.actually_used)}
          />
          <DataPoint
            label="Actual-use basis"
            value={
              exactReview.actually_used_basis ??
              "not recorded (historical)"
            }
          />
          <DataPoint label="Assessment" value={humanize(exactReview.assessment)} />
          <DataPoint
            label="Assessment basis"
            value={
              exactReview.assessment_basis ??
              "not recorded (historical)"
            }
          />
          <DataPoint label="Reviewed" value={exactReview.reviewed_at} />
          <DataPoint label="Authority" value="non-authoritative feedback" />
        </dl>
      ) : (
        <ContextUseReviewForm
          receiptId={receipt.receipt_id}
          receiptFingerprint={receipt.receipt_fingerprint}
          busy={busy}
          onSubmit={onContextUseReview}
        />
      )}
    </section>
  );
}

function selectedProjectVerifyLifecycleV01(
  read: SemanticReviewProposalDetailV01,
  candidateId: string,
): ProjectVerifyRevisionLifecycleV01 | null {
  const profile = read.proposal.project_verify_lifecycle;
  if (
    !profile ||
    profile.lifecycle_binding.selected_candidate.candidate_id !== candidateId
  ) {
    return null;
  }
  const selectedRef = profile.lifecycle_binding.selected_record_ref;
  if (selectedRef.record_kind === "claim_record") {
    const family = read.project_verify_reconciliation.claim_families.find(
      (entry) =>
        entry.claim_family_id === profile.lifecycle_binding.family_id,
    );
    return (
      family?.revisions.find(
        (entry) =>
          entry.claim_ref.record_id === selectedRef.record_id &&
          entry.claim_ref.record_fingerprint === selectedRef.record_fingerprint,
      )?.lifecycle ?? null
    );
  }
  const family = read.project_verify_reconciliation.relation_families.find(
    (entry) =>
      entry.relation_family_id === profile.lifecycle_binding.family_id,
  );
  return (
    family?.revisions.find(
      (entry) =>
        entry.relation_ref.record_id === selectedRef.record_id &&
        entry.relation_ref.record_fingerprint === selectedRef.record_fingerprint,
    )?.lifecycle ?? null
  );
}

function selectedApplyingDecisionV01(
  read: SemanticReviewProposalDetailV01,
  candidateId: string,
): "accept" | "supersede" | "retract" {
  const binding = read.proposal.project_verify_lifecycle?.lifecycle_binding;
  if (binding?.selected_candidate.candidate_id !== candidateId) {
    return "accept";
  }
  return binding.selected_record_operation_intent === "supersede"
    ? "supersede"
    : binding.selected_record_operation_intent === "retract"
      ? "retract"
      : "accept";
}

function targetFamilyLabelV01(
  read: SemanticReviewProposalDetailV01,
  candidateId: string,
  targetCount: number,
): string {
  const profile = read.proposal.project_verify_lifecycle;
  return profile?.lifecycle_binding.selected_candidate.candidate_id === candidateId
    ? `${humanize(profile.lifecycle_binding.entity_kind)} family`
    : `${targetCount} exact target(s)`;
}

function currentHeadExpectationV01(
  read: SemanticReviewProposalDetailV01,
  candidateId: string,
  currentStateStatus: string,
): string {
  const profile = read.proposal.project_verify_lifecycle;
  const expectation =
    profile?.lifecycle_binding.selected_candidate.candidate_id === candidateId
      ? profile.current_head_expectation
      : null;
  if (!expectation) return humanize(currentStateStatus);
  return `${expectation.presence} at revision ${expectation.revision}`;
}

function TextList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section>
      <strong>{title}</strong>
      <ul className={styles.plainList}>
        {items.map((item, index) => (
          <li key={`${title}:${index}:${item}`}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

function DataPoint({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function externalRefKey(ref: {
  compatibility_namespace?: string | null;
  ref_type: string;
  external_id: string;
  trust_class: string;
  source_ref?: string | null;
}): string {
  return [
    ref.compatibility_namespace ?? "",
    ref.ref_type,
    ref.external_id,
    ref.trust_class,
    ref.source_ref ?? "",
  ].join("|");
}

function humanize(value: string): string {
  return value.replaceAll("_", " ");
}
