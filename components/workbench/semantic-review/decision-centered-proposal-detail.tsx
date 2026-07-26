"use client";

import { useState } from "react";

import {
  buildAIWorkplaneChangeReviewViewV01,
  selectAIWorkplaneChangeCandidateV01,
} from "@/lib/vnext/ai-workplane/ai-workplane-view";
import {
  buildSelectedWorkTimelineV01,
  selectSelectedWorkLifecycleV01,
} from "@/lib/vnext/ai-workplane/selected-work-timeline";
import { createSharedInspectorHrefV01 } from "@/lib/vnext/shared-project-inspector-href";
import { SEMANTIC_VISUAL_PRIORITY } from "@/lib/vnext/semantic-visual/semantic-visual-contract";
import type { ProjectVerifyRevisionLifecycleV01 } from "@/types/vnext/project-verify-reconciliation";
import type {
  SelectedWorkTimelineItemV01,
  SelectedWorkTimelineV01,
} from "@/types/vnext/selected-work-timeline";

import { ContextUseReviewForm } from "./context-use-review-form";
import { OperationAwareRevisionForm } from "./operation-aware-revision-form";
import { ProjectVerificationWorkbench } from "./project-verification-workbench";
import { ReviewDecisionForm } from "./review-decision-form";
import { SemanticTransitionActions } from "./semantic-transition-actions";
import { StrategicAdvantageTransferPanel } from "./strategic-advantage-transfer-panel";
import type {
  SemanticContextUseReviewRequestV01,
  SemanticReviewDecisionRequestV01,
  SemanticReviewProposalDetailV01,
  SemanticReviewRevisionRequestV01,
  SemanticReviewStrategicAnalysisRequestV01,
} from "./semantic-review-types";
import styles from "./semantic-review.module.css";

export function DecisionCenteredProposalDetail({
  read,
  selectedCandidateId,
  onSelectedCandidateChange,
  busyCandidateId,
  onDecision,
  onRevision,
  onStrategicAnalysis,
  strategicAnalysisBusy,
  onContextUseReview,
  onSessionInvalid,
  onExactReviewMaterialChanged,
  onProjectApplicationCompleted,
  tryBeginOperatorMutation,
  endOperatorMutation,
}: {
  read: SemanticReviewProposalDetailV01;
  selectedCandidateId: string | null;
  onSelectedCandidateChange: (candidateId: string) => void;
  busyCandidateId: string | null;
  onDecision: (request: SemanticReviewDecisionRequestV01) => Promise<void>;
  onRevision: (request: SemanticReviewRevisionRequestV01) => Promise<void>;
  onStrategicAnalysis: (request: SemanticReviewStrategicAnalysisRequestV01) => Promise<void>;
  strategicAnalysisBusy: boolean;
  onContextUseReview: (request: SemanticContextUseReviewRequestV01) => Promise<void>;
  onSessionInvalid: (errorCode: string) => void;
  onExactReviewMaterialChanged: () => Promise<void>;
  onProjectApplicationCompleted: () => Promise<void>;
  tryBeginOperatorMutation: () => boolean;
  endOperatorMutation: () => void;
}) {
  const proposal = read.proposal;
  const [transitionMutationBusy, setTransitionMutationBusy] = useState(false);
  const selected = selectAIWorkplaneChangeCandidateV01(
    read,
    selectedCandidateId,
  );
  const view = buildAIWorkplaneChangeReviewViewV01({
    read,
    selected_candidate_id: selected?.candidate.candidate_id ?? null,
  });
  const selectedDecisions = selected
    ? read.decision_history.filter(
        (entry) => entry.decision.candidate.candidate_id === selected.candidate.candidate_id,
      )
    : [];
  const lifecycle = selected
    ? selectSelectedWorkLifecycleV01(read, selected.candidate.candidate_id)
    : null;
  const timeline = selected
    ? buildSelectedWorkTimelineV01({
        read,
        selected_candidate: selected,
      })
    : null;
  const applyingDecision = selected
    ? selectedApplyingDecisionV01(read, selected.candidate.candidate_id)
    : "accept";
  const proposalLocalBusy = busyCandidateId !== null || transitionMutationBusy;
  const strategicActionsAvailable =
    !proposal.strategic_advantage_transfer || read.strategic_analysis.status === "available";
  const packetRef = proposal.task_context_packet_ref;
  const priorPacket =
    packetRef?.ref_type === "task_context_packet" &&
    typeof packetRef.source_ref === "string" &&
    /^sha256:[a-f0-9]{64}$/u.test(packetRef.source_ref)
      ? { packet_id: packetRef.external_id, packet_fingerprint: packetRef.source_ref }
      : null;
  const proposalInspectorHref = createSharedInspectorHrefV01({
    target_kind: "episode_delta_proposal",
    record_id: proposal.proposal_id,
    expected_fingerprint: proposal.integrity.fingerprint,
  });
  const nextDecisionCandidate =
    timeline?.current_position.primary_action_owner === "candidate_selection"
      ? read.candidates.find((candidate) => {
          if (
            candidate.candidate.candidate_id ===
            selected?.candidate.candidate_id
          ) {
            return false;
          }
          const candidateView = buildAIWorkplaneChangeReviewViewV01({
            read,
            selected_candidate_id: candidate.candidate.candidate_id,
          });
          return (
            candidateView.decision_status === "needs_decision" ||
            candidateView.decision_status === "blocked"
          );
        }) ?? null
      : null;

  return (
    <section
      className={styles.workbenchSequence}
      data-vnext-semantic-review-detail="v0.1"
      data-vnext-decision-workbench-detail="v0.1"
      data-ai-workplane-change-review="v0.1"
      data-ai-workplane-change-state={view.decision_status}
      data-ai-workplane-presentation={view.presentation_version}
      data-ai-workplane-semantic-authority="false"
      data-vnext-proposal-status={proposal.status}
      data-vnext-selected-decision-count={selectedDecisions.length}
      data-vnext-transition-status={read.transition.status}
      data-vnext-selected-candidate={selected ? "present" : "none"}
      data-selected-work-timeline={timeline?.timeline_version ?? "unavailable"}
      data-selected-work-current-stage={
        timeline?.current_position.stage ?? "unavailable"
      }
      data-selected-work-primary-action-owner={
        timeline?.current_position.primary_action_owner ?? "none"
      }
    >
      <section
        className={`${styles.panel} ${styles.workplaneFocus}`}
        aria-labelledby="what-would-change-title"
        data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.situation}
      >
        <div className={styles.panelHeader}>
          <p className={styles.kicker}>Suggested change</p>
          <h2 id="what-would-change-title">What would change</h2>
        </div>

        {read.candidates.length > 1 ? (
          <label className={styles.fieldLabel}>
            Change to review
            <select
              className={styles.selectControl}
              data-vnext-candidate-selector="v0.1"
              data-vnext-transition-mutation-busy={String(transitionMutationBusy)}
              value={selected?.candidate.candidate_id ?? ""}
              disabled={proposalLocalBusy}
              onChange={(event) => onSelectedCandidateChange(event.target.value)}
            >
              {read.candidates.map((candidate) => (
                <option key={candidate.candidate.candidate_id} value={candidate.candidate.candidate_id}>
                  {buildAIWorkplaneChangeReviewViewV01({
                    read,
                    selected_candidate_id: candidate.candidate.candidate_id,
                  }).title}{" "}
                  · {operationLabel(candidate.candidate.operation)}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {selected ? (
          <section
            className={styles.candidate}
            data-vnext-candidate-id="selected"
            data-vnext-candidate-accept-eligible={String(selected.pilot_admission.decision_allowed.accept)}
            data-selected-candidate-operation={selected.candidate.operation}
            data-selected-candidate-current-state={selected.pilot_admission.current_state_status}
          >
            <div className={styles.candidateHeader}>
              <div>
                <p className={styles.kicker}>{view.operation_label}</p>
                <h3>{view.title}</h3>
              </div>
            </div>
            <p className={styles.copy}>{view.effect_summary}</p>
          </section>
        ) : (
          <p className={styles.empty}>No reviewable change is available.</p>
        )}
      </section>

      {timeline ? <SelectedWorkTimeline timeline={timeline} /> : null}

      {selected &&
      timeline?.current_position.primary_action_owner === "decision" ? (
        <section
          id="selected-work-decision"
          className={styles.panel}
          aria-labelledby="your-decision-title"
          data-vnext-candidate-id="selected-decision"
          data-vnext-candidate-accept-eligible={String(
            selected.pilot_admission.decision_allowed.accept,
          )}
          data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.primaryAction}
        >
          <div className={styles.panelHeader}>
            <p className={styles.kicker}>Needs your decision</p>
            <h2 id="your-decision-title">Your decision</h2>
          </div>
          <p className={styles.copy}>
            {timeline.current_position.next_meaningful_step}
          </p>
          {strategicActionsAvailable ? (
            <ReviewDecisionForm
              key={selected.candidate.candidate_id}
              proposalId={proposal.proposal_id}
              proposalFingerprint={proposal.integrity.fingerprint}
              candidateRead={selected}
              applyingDecision={applyingDecision}
              primary
              busy={proposalLocalBusy}
              onSubmit={onDecision}
            />
          ) : (
            <p className={styles.notice} data-vnext-strategic-candidate-actions="blocked">
              This change remains readable, but a decision is blocked until its
              current source can be verified.
            </p>
          )}
        </section>
      ) : null}

      {nextDecisionCandidate &&
      timeline?.current_position.primary_action_owner ===
        "candidate_selection" ? (
        <section
          id="selected-work-next-candidate"
          className={styles.panel}
          data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.primaryAction}
        >
          <div className={styles.panelHeader}>
            <p className={styles.kicker}>Next meaningful step</p>
            <h2>Another change still needs review</h2>
          </div>
          <p className={styles.copy}>
            The current selected change is settled. Move to the next unresolved
            candidate without mixing its history into this timeline.
          </p>
          <button
            className={styles.button}
            type="button"
            data-vnext-review-next-change="true"
            data-ai-workplane-primary-action="review-next-change"
            data-augnes-primary-action="review-next-change"
            onClick={() =>
              onSelectedCandidateChange(
                nextDecisionCandidate.candidate.candidate_id,
              )
            }
          >
            Review next change
          </button>
        </section>
      ) : null}

      {selected &&
      timeline?.current_position.primary_action_owner === "transition" ? (
        <div id="selected-work-transition">
          <SemanticTransitionActions
            key={[
              proposal.proposal_id,
              proposal.integrity.fingerprint,
              selected.candidate.candidate_id,
              selected.candidate_fingerprint,
            ].join("|")}
            proposalId={proposal.proposal_id}
            proposalFingerprint={proposal.integrity.fingerprint}
            selectedCandidateId={selected.candidate.candidate_id}
            selectedCandidateFingerprint={selected.candidate_fingerprint}
            decisions={read.decision_history.filter((item) => item.pilot_actionable).map((item) => item.decision)}
            persistedReceipts={read.transition_receipts}
            priorPacket={priorPacket}
            onSessionInvalid={onSessionInvalid}
            onExactReviewMaterialChanged={onExactReviewMaterialChanged}
            onProjectApplicationCompleted={onProjectApplicationCompleted}
            tryBeginOperatorMutation={tryBeginOperatorMutation}
            endOperatorMutation={endOperatorMutation}
            onApplyingMutationBusyChange={setTransitionMutationBusy}
          />
        </div>
      ) : null}

      <SelectedWorkSupport view={view} />

      <div
        id="selected-work-later-feedback"
        data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.supporting}
      >
        <LaterContextFeedback
          read={read}
          proposalId={proposal.proposal_id}
          busy={proposalLocalBusy}
          onContextUseReview={onContextUseReview}
        />
      </div>

      <details
        className={styles.advancedDisclosure}
        data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.rawRecord}
      >
        <summary>Advanced review</summary>
        <p className={styles.muted}>
          Exact verification, decision history, project-change safeguards, and source
          history are available here. They are not required for the normal review.
        </p>
        <ProjectVerificationWorkbench
          reconciliation={read.project_verify_reconciliation}
          lineage={read.project_verify_lineage}
          sourceAssessment={proposal.source_assessment}
          sourceReceipts={read.source_run_receipts}
          sourceCurrentness={proposal.source_status.currentness}
          packetRef={proposal.task_context_packet_ref}
        />
        <SelectedLifecycle lifecycle={lifecycle} />
        <DecisionHistory decisions={selectedDecisions} />
        <section className={styles.panel} data-shared-inspector-handoff="true">
          <div className={styles.panelHeader}>
            <p className={styles.kicker}>Exact detail</p>
            <h2>Source and project-change history</h2>
          </div>
          <a
            className={styles.linkButton}
            href={proposalInspectorHref}
            data-proposal-to-shared-inspector="true"
            data-workbench-to-shared-inspector="true"
          >
            View exact details
          </a>
        </section>
      </details>

      <details className={styles.advancedDisclosure}>
        <summary>Other review options</summary>
        {selected &&
        timeline?.current_position.primary_action_owner !== "decision" &&
        strategicActionsAvailable ? (
          <section className={styles.materialCard}>
            <h3>Change the saved decision</h3>
            <p className={styles.muted}>
              This remains available as a secondary review option. It is not
              the current timeline step.
            </p>
            <ReviewDecisionForm
              key={`secondary:${selected.candidate.candidate_id}`}
              proposalId={proposal.proposal_id}
              proposalFingerprint={proposal.integrity.fingerprint}
              candidateRead={selected}
              applyingDecision={applyingDecision}
              primary={false}
              busy={proposalLocalBusy}
              onSubmit={onDecision}
            />
          </section>
        ) : null}
        <StrategicAdvantageTransferPanel
          proposal={proposal}
          readback={read.strategic_analysis}
          inspectorHref={proposalInspectorHref}
          busy={strategicAnalysisBusy || transitionMutationBusy}
          onRequest={onStrategicAnalysis}
        />
        {selected &&
        strategicActionsAvailable &&
        !proposal.operation_revision &&
        (selected.candidate.operation === "unknown" || selected.candidate.operation === "no_change") &&
        (!proposal.strategic_advantage_transfer ||
          proposal.strategic_advantage_transfer.transfer_items.some(
            (transfer) =>
              selected.candidate.candidate_id ===
              `strategic-candidate:${transfer.transfer_id.slice("strategic-transfer:".length)}`,
          )) ? (
          <div
            data-vnext-candidate-id="selected-options"
            data-vnext-candidate-accept-eligible={String(
              selected.pilot_admission.decision_allowed.accept,
            )}
          >
            <OperationAwareRevisionForm
              proposalId={proposal.proposal_id}
              proposalFingerprint={proposal.integrity.fingerprint}
              sourceAssessment={proposal.source_assessment}
              strategicAdvantageTransfer={proposal.strategic_advantage_transfer}
              candidateRead={selected}
              busy={proposalLocalBusy}
              onSubmit={onRevision}
            />
          </div>
        ) : null}
        {proposal.operation_revision ? (
          <section className={styles.materialCard} data-vnext-operation-revision="v0.1">
            <h3>Clarified change</h3>
            <p className={styles.copy}>{proposal.operation_revision.rationale_summary}</p>
            <p className={styles.muted}>The original suggested change remains unchanged.</p>
          </section>
        ) : null}
      </details>
    </section>
  );
}

function SelectedWorkTimeline({
  timeline,
}: {
  timeline: SelectedWorkTimelineV01;
}) {
  return (
    <section
      className={`${styles.panel} ${styles.selectedWorkTimeline}`}
      aria-labelledby="selected-work-timeline-title"
      data-selected-work-timeline-items={timeline.items.length}
      data-selected-work-current-item={timeline.current_item_id}
      data-selected-work-current-stage={timeline.current_position.stage}
      data-selected-work-primary-action-owner={
        timeline.current_position.primary_action_owner
      }
      data-selected-work-projection-only={String(
        timeline.authority.projection_only,
      )}
      data-selected-work-semantic-authority="false"
      data-augnes-independent-surface="selected-work-timeline"
      data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.situation}
    >
      <div className={styles.panelHeader}>
        <p className={styles.kicker}>How this work reached here</p>
        <h2 id="selected-work-timeline-title">Meaningful timeline</h2>
        <p className={styles.copy}>
          One source-bound sequence for the selected change. Exact records
          remain available under Advanced review.
        </p>
      </div>
      <ol
        className={styles.selectedWorkTimelineList}
        aria-label="Selected work meaningful timeline"
      >
        {timeline.items.map((item) => (
          <SelectedWorkTimelineItem
            key={item.item_id}
            item={item}
            current={item.item_id === timeline.current_item_id}
          />
        ))}
      </ol>
      <section
        className={styles.selectedWorkNextStep}
        aria-labelledby="selected-work-next-step-title"
        data-selected-work-next-step={timeline.current_position.stage}
      >
        <p className={styles.kicker}>Current position</p>
        <h3 id="selected-work-next-step-title">
          {timeline.current_position.title}
        </h3>
        <p className={styles.copy}>{timeline.current_position.summary}</p>
        <strong>What happens next</strong>
        <p className={styles.copy}>
          {timeline.current_position.next_meaningful_step}
        </p>
      </section>
      <p className={styles.muted}>
        This timeline explains current meaning. It does not decide, approve,
        apply, or establish verified success.
      </p>
    </section>
  );
}

function SelectedWorkTimelineItem({
  item,
  current,
}: {
  item: SelectedWorkTimelineItemV01;
  current: boolean;
}) {
  return (
    <li
      aria-current={current ? "step" : undefined}
      data-selected-work-timeline-item={item.item_id}
      data-selected-work-timeline-stage={item.stage}
      data-selected-work-timeline-status={item.status}
      data-selected-work-timeline-current={String(current)}
      data-selected-work-timeline-time={item.time_status}
      data-selected-work-timeline-basis={item.basis}
      data-selected-work-timeline-authority="false"
    >
      <div className={styles.selectedWorkTimelineItemHeader}>
        <div>
          <span className={styles.timelineBasis}>{basisLabel(item)}</span>
          <h3>{item.title}</h3>
        </div>
        <span className={styles.timelineStatus}>
          {statusLabel(item.status, current)}
        </span>
      </div>
      <p className={styles.copy}>{item.summary}</p>
      <p className={styles.muted}>{item.meaning_change}</p>
      {item.occurred_at ? (
        <time dateTime={item.occurred_at}>
          {formatTimelineTimestamp(item.occurred_at)}
        </time>
      ) : (
        <span className={styles.timelineTime}>Time not established</span>
      )}
    </li>
  );
}

function SelectedWorkSupport({
  view,
}: {
  view: ReturnType<typeof buildAIWorkplaneChangeReviewViewV01>;
}) {
  const checks =
    view.verification.passed +
    view.verification.failed +
    view.verification.skipped;
  const requirements =
    view.verification.satisfied +
    view.verification.unsatisfied +
    view.verification.unknown;
  const support = [...view.verification.blockers, ...view.uncertainties];
  return (
    <section
      id="selected-work-support"
      className={styles.panel}
      aria-labelledby="selected-work-support-title"
      data-selected-work-support="verification-and-uncertainty"
      data-ai-workplane-verification={view.verification.status}
      data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.aiSummary}
    >
      <div className={styles.panelHeader}>
        <p className={styles.kicker}>Support for this timeline</p>
        <h2 id="selected-work-support-title">
          Verification and uncertainty
        </h2>
      </div>
      <p className={styles.copy}>{view.reason}</p>
      <p className={styles.humanStatus}>{view.verification.label}</p>
      <p className={styles.copy}>
        {checks === 0
          ? "No exact checks are available in this bounded review."
          : `${view.verification.passed} of ${checks} checks passed.`}{" "}
        {requirements === 0
          ? "No requirement assessment is available."
          : `${view.verification.satisfied} of ${requirements} requirements are satisfied.`}
      </p>
      {support.length > 0 ? (
        <TextList title="What remains unresolved" items={support} />
      ) : (
        <p className={styles.copy}>
          No material uncertainty is reported in the bounded current review.
        </p>
      )}
      <details className={styles.disclosure}>
        <summary>Exact verification counts</summary>
        <dl className={styles.statusGrid}>
          <DataPoint
            label="Checks passed"
            value={String(view.verification.passed)}
          />
          <DataPoint
            label="Checks failed"
            value={String(view.verification.failed)}
          />
          <DataPoint
            label="Checks skipped"
            value={String(view.verification.skipped)}
          />
          <DataPoint
            label="Requirements satisfied"
            value={String(view.verification.satisfied)}
          />
          <DataPoint
            label="Requirements not satisfied"
            value={String(view.verification.unsatisfied)}
          />
          <DataPoint
            label="Requirements not confirmed"
            value={String(view.verification.unknown)}
          />
        </dl>
      </details>
      <p className={styles.muted}>
        This bounded interpretation supports review; it is not an accepted
        project change.
      </p>
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
  onContextUseReview: (request: SemanticContextUseReviewRequestV01) => Promise<void>;
}) {
  const receipt = read.project_continuity.latest_context_use_receipt;
  const review = read.project_continuity.latest_context_use_review_status;
  const belongsToProposal = read.project_continuity.latest_applied_transition?.proposal_id === proposalId;
  if (!belongsToProposal || !receipt) {
    return (
      <details className={styles.advancedDisclosure} data-vnext-context-use-feedback="not_yet_available">
        <summary>Optional later feedback</summary>
        <p className={styles.muted}>
          Feedback becomes available only after a project change is applied and later work actually uses the updated context.
        </p>
      </details>
    );
  }
  const exactReview =
    review?.later_task_run_receipt_id === receipt.receipt_id &&
    review.later_task_run_receipt_fingerprint === receipt.receipt_fingerprint
      ? review
      : null;
  return (
    <details className={styles.advancedDisclosure} data-vnext-context-use-feedback="available">
      <summary>Optional context feedback</summary>
      <h2>Did this project context help?</h2>
      {exactReview ? (
        <p
          className={styles.copy}
          data-context-use-review-actually-used-basis={exactReview.actually_used_basis ?? "unknown"}
          data-context-use-review-presentation-basis={exactReview.presentation_basis ?? "unknown"}
        >
          Feedback saved: {humanize(exactReview.actually_used)} · {humanize(exactReview.assessment)}
        </p>
      ) : (
        <ContextUseReviewForm
          receiptId={receipt.receipt_id}
          receiptFingerprint={receipt.receipt_fingerprint}
          busy={busy}
          onSubmit={onContextUseReview}
        />
      )}
    </details>
  );
}

function SelectedLifecycle({ lifecycle }: { lifecycle: ProjectVerifyRevisionLifecycleV01 | null }) {
  if (!lifecycle) {
    return (
      <p className={styles.empty} data-selected-core-lifecycle="historical_generic">
        Exact lifecycle detail is unavailable for this historical review.
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
      <h3>Exact project-change lifecycle</h3>
      <dl className={styles.statusGrid}>
        <DataPoint label="Proposal review" value={humanize(lifecycle.review.status)} />
        <DataPoint label="ReviewDecision" value={humanize(lifecycle.decision.status)} />
        <DataPoint label="Gate" value={humanize(lifecycle.gate.status)} />
        <DataPoint label="Transition" value={humanize(lifecycle.transition.status)} />
      </dl>
    </section>
  );
}

function DecisionHistory({ decisions }: { decisions: SemanticReviewProposalDetailV01["decision_history"] }) {
  return (
    <section className={styles.materialCard} data-selected-decision-history="true" data-vnext-decision-history="v0.1">
      <h3>Exact ReviewDecision history</h3>
      {decisions.length === 0 ? (
        <p className={styles.empty}>No exact decision is saved for this change option.</p>
      ) : (
        <ol className={styles.plainList}>
          {decisions.map((entry) => (
            <li key={entry.decision.decision_id}>
              <strong>{humanize(entry.decision.decision)}</strong>
              <span>{entry.decision.rationale_summary}</span>
              <details className={styles.disclosure}>
                <summary>Exact decision binding</summary>
                <span className={styles.identifier}>{entry.decision.decision_id}</span>
                <span className={styles.identifier}>{entry.decision.integrity.fingerprint}</span>
              </details>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function selectedApplyingDecisionV01(
  read: SemanticReviewProposalDetailV01,
  candidateId: string,
): "accept" | "supersede" | "retract" {
  const binding = read.proposal.project_verify_lifecycle?.lifecycle_binding;
  if (binding?.selected_candidate.candidate_id !== candidateId) return "accept";
  return binding.selected_record_operation_intent === "supersede"
    ? "supersede"
    : binding.selected_record_operation_intent === "retract"
      ? "retract"
      : "accept";
}

function TextList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section>
      <strong>{title}</strong>
      <ul className={styles.plainList}>
        {items.map((item, index) => <li key={`${title}:${index}:${item}`}>{item}</li>)}
      </ul>
    </section>
  );
}

function DataPoint({ label, value }: { label: string; value: string }) {
  return <div><dt>{label}</dt><dd>{value}</dd></div>;
}

function operationLabel(value: string): string {
  return value === "add"
    ? "add"
    : value === "revise"
      ? "update"
      : value === "supersede"
        ? "replace"
        : value === "retract" || value === "remove"
          ? "remove"
          : "clarify";
}

function humanize(value: string): string {
  return value.replaceAll("_", " ");
}

function basisLabel(item: SelectedWorkTimelineItemV01): string {
  return item.basis === "observed"
    ? "Observed source"
    : item.basis === "bounded_interpretation"
      ? "Bounded interpretation"
      : item.basis === "user_decision"
        ? "User decision"
        : item.basis === "authorized_change"
          ? "Authorized change"
          : "Later outcome";
}

function statusLabel(
  status: SelectedWorkTimelineItemV01["status"],
  current: boolean,
): string {
  if (current) return status === "blocked" ? "Current · blocked" : "Current";
  return status === "completed"
    ? "Completed"
    : status === "pending"
      ? "Pending"
      : status === "superseded"
        ? "Superseded"
        : status === "blocked"
          ? "Blocked"
          : "Current";
}

function formatTimelineTimestamp(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value));
}
