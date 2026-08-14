"use client";

import {
  type RefObject,
  useRef,
  useState,
} from "react";

import {
  GuideBriefConversation,
  type GuideBriefInteractionHostV01,
} from "@/components/guide/guide-brief-conversation";
import {
  buildAIWorkplaneChangeReviewViewV01,
  selectAIWorkplaneChangeCandidateV01,
} from "@/lib/vnext/ai-workplane/ai-workplane-view";
import {
  buildSelectedWorkTimelineV01,
  selectNextSelectedWorkCandidateV01,
  selectSelectedCandidateActionableApplyingDecisionV01,
  selectSelectedWorkLifecycleV01,
} from "@/lib/vnext/ai-workplane/selected-work-timeline";
import {
  createOpaqueGuideBriefInteractionTargetHandleV01,
} from "@/lib/vnext/guide-brief/guide-brief-interaction-plan";
import {
  buildGuideBriefConversationScopeKeyV01,
} from "@/lib/vnext/guide-brief/guide-brief-conversation-plan";
import { buildSelectedWorkGuideBriefCapabilitySetV01 } from "@/lib/vnext/guide-brief/guide-brief-pc5-capabilities";
import {
  buildSelectedWorkRelationshipsV01,
} from "@/lib/vnext/ai-workplane/selected-work-relationships";
import { createSharedInspectorHrefV01 } from "@/lib/vnext/shared-project-inspector-href";
import { SEMANTIC_VISUAL_PRIORITY } from "@/lib/vnext/semantic-visual/semantic-visual-contract";
import type { ProjectGuideBriefV02 } from "@/types/vnext/guide-brief";
import type {
  BrowserActionCapabilityV01,
  BrowserActionRouteKeyV01,
  BrowserOwnerCurrentFocusCapabilityV01,
  GuideBriefInteractionAdapterV01,
} from "@/types/vnext/guide-brief-interaction";
import type { ProjectVerifyRevisionLifecycleV01 } from "@/types/vnext/project-verify-reconciliation";
import type {
  SelectedWorkConnectionStatementV01,
  SelectedWorkRelationshipBasisV01,
  SelectedWorkRelationshipQuestionKeyV01,
  SelectedWorkRelationshipsV01,
} from "@/types/vnext/selected-work-relationships";
import type {
  SelectedWorkTimelineItemV01,
  SelectedWorkTimelineV01,
} from "@/types/vnext/selected-work-timeline";

import { ContextUseReviewForm } from "./context-use-review-form";
import { OperationAwareRevisionForm } from "./operation-aware-revision-form";
import { ProjectVerificationWorkbench } from "./project-verification-workbench";
import {
  ReviewDecisionForm,
  type ReviewDecisionPreparationHandleV01,
} from "./review-decision-form";
import {
  SemanticTransitionActions,
  type SemanticTransitionPreparationHandleV01,
} from "./semantic-transition-actions";
import { StrategicAdvantageTransferPanel } from "./strategic-advantage-transfer-panel";
import {
  effectiveSelectedWorkRelationshipQuestionV01,
  selectedWorkRelationshipScopeKeyV01,
  type SelectedWorkRelationshipQuestionSelectionV01,
} from "./selected-work-relationship-selection";
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
  guide,
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
  guide: ProjectGuideBriefV02 | null;
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
  const [
    transitionPreviewAvailability,
    setTransitionPreviewAvailability,
  ] = useState<{
    scope_key: string;
    available: boolean;
  } | null>(null);
  const [decisionCurrentFocus, setDecisionCurrentFocus] = useState<{
    scope_key: string;
    capability: BrowserOwnerCurrentFocusCapabilityV01;
  } | null>(null);
  const [transitionCurrentFocus, setTransitionCurrentFocus] = useState<{
    scope_key: string;
    capability: BrowserOwnerCurrentFocusCapabilityV01;
  } | null>(null);
  const decisionPreparationRef =
    useRef<ReviewDecisionPreparationHandleV01 | null>(null);
  const transitionPreparationRef =
    useRef<SemanticTransitionPreparationHandleV01 | null>(null);
  const nextCandidateActionRef = useRef<HTMLButtonElement | null>(null);
  const advancedReviewRef = useRef<HTMLDetailsElement | null>(null);
  const advancedReviewSummaryRef = useRef<HTMLElement | null>(null);
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
    ? selectSelectedWorkLifecycleV01(
        read,
        selected.candidate.candidate_id,
        selected.candidate_fingerprint,
      )
    : null;
  const timeline = selected
    ? buildSelectedWorkTimelineV01({
        read,
        selected_candidate: selected,
      })
    : null;
  const relationshipScopeKey = selected
    ? selectedWorkRelationshipScopeKeyV01({
        workspace_id: proposal.workspace_id,
        project_id: proposal.project_id,
        proposal_id: proposal.proposal_id,
        proposal_fingerprint: proposal.integrity.fingerprint,
        candidate_id: selected.candidate.candidate_id,
        candidate_fingerprint: selected.candidate_fingerprint,
      })
    : null;
  const selectedActionableApplyingDecision = selected
    ? selectSelectedCandidateActionableApplyingDecisionV01({
        read,
        selected_candidate: selected,
      })
    : null;
  const transitionPreviewOwnerScopeKey =
    selected && selectedActionableApplyingDecision
      ? [
          proposal.proposal_id,
          proposal.integrity.fingerprint,
          selected.candidate.candidate_id,
          selected.candidate_fingerprint,
          selectedActionableApplyingDecision.decision_id,
          selectedActionableApplyingDecision.integrity.fingerprint,
        ].join("|")
      : null;
  const transitionPreviewAvailable =
    transitionPreviewOwnerScopeKey !== null &&
    transitionPreviewAvailability?.scope_key ===
      transitionPreviewOwnerScopeKey &&
    transitionPreviewAvailability.available;
  const applyingDecision = selected
    ? selectedApplyingDecisionV01(read, selected.candidate.candidate_id)
    : "accept";
  const operationalBinding = selected
    ? proposal.operational_friction_proposal?.candidate_bindings.find(
        (binding) =>
          binding.candidate_id === selected.candidate.candidate_id &&
          binding.candidate_fingerprint === selected.candidate_fingerprint,
      ) ?? null
    : null;
  const proposalLocalBusy = busyCandidateId !== null || transitionMutationBusy;
  const strategicActionsAvailable =
    !proposal.strategic_advantage_transfer || read.strategic_analysis.status === "available";
  const decisionFocusOwnerScopeKey =
    selected &&
    timeline?.current_position.primary_action_owner === "decision" &&
    strategicActionsAvailable
      ? [
          proposal.proposal_id,
          proposal.integrity.fingerprint,
          selected.candidate.candidate_id,
          selected.candidate_fingerprint,
          applyingDecision,
        ].join("|")
      : null;
  const decisionCurrentFocusCapability =
    decisionFocusOwnerScopeKey !== null &&
    decisionCurrentFocus?.scope_key === decisionFocusOwnerScopeKey
      ? decisionCurrentFocus.capability
      : null;
  const transitionCurrentFocusCapability =
    transitionPreviewOwnerScopeKey !== null &&
    transitionCurrentFocus?.scope_key === transitionPreviewOwnerScopeKey
      ? transitionCurrentFocus.capability
      : null;
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
    timeline?.current_position.primary_action_owner ===
      "candidate_selection" &&
    selected
      ? selectNextSelectedWorkCandidateV01({
          read,
          selected_candidate: selected,
        })
      : null;
  if (
    timeline?.current_position.primary_action_owner ===
      "candidate_selection" &&
    !nextDecisionCandidate
  ) {
    throw new Error(
      "selected_work_candidate_selection_owner_without_candidate",
    );
  }

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
      data-vnext-operational-review={
        read.operational_friction_review?.status ?? "not_applicable"
      }
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
            data-selected-candidate-review-mode={selected.pilot_admission.review_mode}
          >
            <div className={styles.candidateHeader}>
              <div>
                <p className={styles.kicker}>{view.operation_label}</p>
                <h3>{view.title}</h3>
              </div>
            </div>
            <p className={styles.copy}>{view.effect_summary}</p>
            {operationalBinding ? (
              <div data-vnext-operational-proposal-only="true">
                <DataPoint
                  label="Operation domain"
                  value={humanize(operationalBinding.operation_domain)}
                />
                <DataPoint
                  label="Target class"
                  value={humanize(operationalBinding.target_class)}
                />
                <p className={styles.notice}>
                  This is a proposal-only operational hypothesis. It has no
                  activation owner, leaves project state unchanged, and preserves
                  its bounded uncertainty and limitations.
                </p>
              </div>
            ) : null}
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
              ref={decisionPreparationRef}
              key={selected.candidate.candidate_id}
              proposalId={proposal.proposal_id}
              proposalFingerprint={proposal.integrity.fingerprint}
              candidateRead={selected}
              applyingDecision={applyingDecision}
              primary
              busy={proposalLocalBusy}
              onSubmit={onDecision}
              onCurrentFocusCapabilityChange={(capability) => {
                if (!decisionFocusOwnerScopeKey) return;
                setDecisionCurrentFocus((current) =>
                  current?.scope_key === decisionFocusOwnerScopeKey &&
                  current.capability.owner_focus_identity ===
                    capability.owner_focus_identity &&
                  current.capability.available === capability.available &&
                  current.capability.unavailable_reason ===
                    capability.unavailable_reason
                    ? current
                    : {
                        scope_key: decisionFocusOwnerScopeKey,
                        capability,
                      }
                );
              }}
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
            ref={nextCandidateActionRef}
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
            ref={transitionPreparationRef}
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
            decisions={
              selectedActionableApplyingDecision
                ? [selectedActionableApplyingDecision]
                : []
            }
            persistedReceipts={read.transition_receipts}
            priorPacket={priorPacket}
            onSessionInvalid={onSessionInvalid}
            onExactReviewMaterialChanged={onExactReviewMaterialChanged}
            onProjectApplicationCompleted={onProjectApplicationCompleted}
            tryBeginOperatorMutation={tryBeginOperatorMutation}
            endOperatorMutation={endOperatorMutation}
            onApplyingMutationBusyChange={setTransitionMutationBusy}
            onPreviewAvailabilityChange={(available) => {
              if (!transitionPreviewOwnerScopeKey) return;
              setTransitionPreviewAvailability((current) =>
                current?.scope_key ===
                    transitionPreviewOwnerScopeKey &&
                  current.available === available
                  ? current
                  : {
                      scope_key: transitionPreviewOwnerScopeKey,
                      available,
                    }
              );
            }}
            onCurrentFocusCapabilityChange={(capability) => {
              if (!transitionPreviewOwnerScopeKey) return;
              setTransitionCurrentFocus((current) =>
                current?.scope_key === transitionPreviewOwnerScopeKey &&
                current.capability.owner_focus_identity ===
                  capability.owner_focus_identity &&
                current.capability.available === capability.available &&
                current.capability.unavailable_reason ===
                  capability.unavailable_reason
                  ? current
                  : {
                      scope_key: transitionPreviewOwnerScopeKey,
                      capability,
                    }
              );
            }}
          />
        </div>
      ) : null}

      {selected && timeline && relationshipScopeKey ? (
        <SelectedWorkRelationshipExploration
          key={relationshipScopeKey}
          read={read}
          selected={selected}
          timeline={timeline}
          relationshipScopeKey={relationshipScopeKey}
          guide={guide}
          nextDecisionCandidate={nextDecisionCandidate}
          applyingDecision={applyingDecision}
          decisionEligible={Boolean(
            timeline.current_position.primary_action_owner === "decision" &&
              strategicActionsAvailable &&
              selected.pilot_admission.decision_allowed.accept &&
              !proposalLocalBusy,
          )}
          transitionPreviewAvailable={
            timeline.current_position.primary_action_owner === "transition" &&
            transitionPreviewAvailable &&
            !proposalLocalBusy
          }
          decisionCurrentFocusCapability={
            decisionPreparationRef.current
              ? decisionCurrentFocusCapability
              : null
          }
          transitionCurrentFocusCapability={
            transitionPreparationRef.current
              ? transitionCurrentFocusCapability
              : null
          }
          ownerBusy={proposalLocalBusy}
          proposalInspectorHref={proposalInspectorHref}
          onSelectedCandidateChange={onSelectedCandidateChange}
          decisionPreparationRef={decisionPreparationRef}
          transitionPreparationRef={transitionPreparationRef}
          nextCandidateActionRef={nextCandidateActionRef}
          advancedReviewRef={advancedReviewRef}
          advancedReviewSummaryRef={advancedReviewSummaryRef}
        />
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
        ref={advancedReviewRef}
        id="selected-work-advanced"
        className={styles.advancedDisclosure}
        data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.rawRecord}
      >
        <summary ref={advancedReviewSummaryRef}>Advanced review</summary>
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
        selected.pilot_admission.review_mode !== "proposal_only_no_activation" &&
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
        {!proposal.operational_friction_proposal ? (
          <StrategicAdvantageTransferPanel
            proposal={proposal}
            readback={read.strategic_analysis}
            inspectorHref={proposalInspectorHref}
            busy={strategicAnalysisBusy || transitionMutationBusy}
            onRequest={onStrategicAnalysis}
          />
        ) : null}
        {selected &&
        strategicActionsAvailable &&
        !proposal.operational_friction_proposal &&
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

function SelectedWorkRelationshipExploration({
  read,
  selected,
  timeline,
  relationshipScopeKey,
  guide,
  nextDecisionCandidate,
  applyingDecision,
  decisionEligible,
  transitionPreviewAvailable,
  decisionCurrentFocusCapability,
  transitionCurrentFocusCapability,
  ownerBusy,
  proposalInspectorHref,
  onSelectedCandidateChange,
  decisionPreparationRef,
  transitionPreparationRef,
  nextCandidateActionRef,
  advancedReviewRef,
  advancedReviewSummaryRef,
}: {
  read: SemanticReviewProposalDetailV01;
  selected: SemanticReviewProposalDetailV01["candidates"][number];
  timeline: SelectedWorkTimelineV01;
  relationshipScopeKey: string;
  guide: ProjectGuideBriefV02 | null;
  nextDecisionCandidate:
    | SemanticReviewProposalDetailV01["candidates"][number]
    | null;
  applyingDecision: "accept" | "supersede" | "retract";
  decisionEligible: boolean;
  transitionPreviewAvailable: boolean;
  decisionCurrentFocusCapability:
    | BrowserOwnerCurrentFocusCapabilityV01
    | null;
  transitionCurrentFocusCapability:
    | BrowserOwnerCurrentFocusCapabilityV01
    | null;
  ownerBusy: boolean;
  proposalInspectorHref: string;
  onSelectedCandidateChange: (candidateId: string) => void;
  decisionPreparationRef: RefObject<
    ReviewDecisionPreparationHandleV01 | null
  >;
  transitionPreparationRef: RefObject<
    SemanticTransitionPreparationHandleV01 | null
  >;
  nextCandidateActionRef: RefObject<HTMLButtonElement | null>;
  advancedReviewRef: RefObject<HTMLDetailsElement | null>;
  advancedReviewSummaryRef: RefObject<HTMLElement | null>;
}) {
  const [relationshipSelection, setRelationshipSelection] =
    useState<SelectedWorkRelationshipQuestionSelectionV01 | null>(null);
  const defaultRelationships = buildSelectedWorkRelationshipsV01({
    read,
    selected_candidate: selected,
    timeline,
    selected_question_key: null,
  });
  const effectiveQuestionKey =
    effectiveSelectedWorkRelationshipQuestionV01({
      scope_key: relationshipScopeKey,
      selection: relationshipSelection,
      available_questions: defaultRelationships.questions,
      default_question_key: defaultRelationships.selected_question_key,
    });
  const relationships =
    effectiveQuestionKey === defaultRelationships.selected_question_key
      ? defaultRelationships
      : buildSelectedWorkRelationshipsV01({
          read,
          selected_candidate: selected,
          timeline,
          selected_question_key: effectiveQuestionKey,
        });
  const relationshipsByQuestion = Object.fromEntries(
    defaultRelationships.questions.map(({ question_key }) => [
      question_key,
      question_key === relationships.selected_question_key
        ? relationships
        : buildSelectedWorkRelationshipsV01({
            read,
            selected_candidate: selected,
            timeline,
            selected_question_key: question_key,
          }),
    ]),
  ) as Partial<
    Record<
      SelectedWorkRelationshipQuestionKeyV01,
      SelectedWorkRelationshipsV01
    >
  >;
  const interaction = guide
    ? selectedWorkInteractionHostV01({
        guide,
        read,
        selected,
        timeline,
        relationships,
        relationshipsByQuestion,
        relationshipScopeKey,
        nextDecisionCandidate,
        applyingDecision,
        decisionEligible,
        transitionPreviewAvailable,
        decisionCurrentFocusCapability,
        transitionCurrentFocusCapability,
        ownerBusy,
        proposalInspectorHref,
        onSelectedCandidateChange,
        onRelationshipQuestionChange: (questionKey) =>
          setRelationshipSelection({
            scope_key: relationshipScopeKey,
            question_key: questionKey,
          }),
        decisionPreparationRef,
        transitionPreparationRef,
        nextCandidateActionRef,
        advancedReviewRef,
        advancedReviewSummaryRef,
      })
    : null;

  return (
    <>
      <SelectedWorkRelationships
        relationships={relationships}
        onQuestionChange={(questionKey) =>
          setRelationshipSelection({
            scope_key: relationshipScopeKey,
            question_key: questionKey,
          })
        }
      />
      {guide ? (
        <GuideBriefConversation
          guide={guide}
          surface="ai_workplane"
          selected_work_scope={{
            workspace_id: read.proposal.workspace_id,
            project_id: read.proposal.project_id,
            proposal_id: read.proposal.proposal_id,
            proposal_fingerprint: read.proposal.integrity.fingerprint,
            candidate_id: selected.candidate.candidate_id,
            candidate_fingerprint: selected.candidate_fingerprint,
          }}
          timeline={timeline}
          relationships={relationshipsByQuestion}
          selected_relationship_question_key={
            relationships.selected_question_key
          }
          interaction={interaction}
        />
      ) : null}
    </>
  );
}

function selectedWorkInteractionHostV01(input: {
  guide: ProjectGuideBriefV02;
  read: SemanticReviewProposalDetailV01;
  selected: SemanticReviewProposalDetailV01["candidates"][number];
  timeline: SelectedWorkTimelineV01;
  relationships: SelectedWorkRelationshipsV01;
  relationshipsByQuestion: Partial<
    Record<
      SelectedWorkRelationshipQuestionKeyV01,
      SelectedWorkRelationshipsV01
    >
  >;
  relationshipScopeKey: string;
  nextDecisionCandidate:
    | SemanticReviewProposalDetailV01["candidates"][number]
    | null;
  applyingDecision: "accept" | "supersede" | "retract";
  decisionEligible: boolean;
  transitionPreviewAvailable: boolean;
  decisionCurrentFocusCapability:
    | BrowserOwnerCurrentFocusCapabilityV01
    | null;
  transitionCurrentFocusCapability:
    | BrowserOwnerCurrentFocusCapabilityV01
    | null;
  ownerBusy: boolean;
  proposalInspectorHref: string;
  onSelectedCandidateChange: (candidateId: string) => void;
  onRelationshipQuestionChange: (
    questionKey: SelectedWorkRelationshipQuestionKeyV01,
  ) => void;
  decisionPreparationRef: RefObject<
    ReviewDecisionPreparationHandleV01 | null
  >;
  transitionPreparationRef: RefObject<
    SemanticTransitionPreparationHandleV01 | null
  >;
  nextCandidateActionRef: RefObject<HTMLButtonElement | null>;
  advancedReviewRef: RefObject<HTMLDetailsElement | null>;
  advancedReviewSummaryRef: RefObject<HTMLElement | null>;
}): GuideBriefInteractionHostV01 {
  const {
    guide,
    read,
    selected,
    timeline,
    relationships,
  } = input;
  const sharedCapabilitySet = buildSelectedWorkGuideBriefCapabilitySetV01({
    guide,
    read,
    selected,
    timeline,
    relationships,
    relationships_by_question: input.relationshipsByQuestion,
    relationship_scope_key: input.relationshipScopeKey,
    next_decision_candidate: input.nextDecisionCandidate,
    applying_decision: input.applyingDecision,
    decision_eligible: input.decisionEligible,
    transition_preview_available: input.transitionPreviewAvailable,
    decision_current_focus_capability:
      input.decisionCurrentFocusCapability,
    transition_current_focus_capability:
      input.transitionCurrentFocusCapability,
    owner_busy: input.ownerBusy,
  });
  const selectedWorkScope = {
    workspace_id: read.proposal.workspace_id,
    project_id: read.proposal.project_id,
    proposal_id: read.proposal.proposal_id,
    proposal_fingerprint: read.proposal.integrity.fingerprint,
    candidate_id: selected.candidate.candidate_id,
    candidate_fingerprint: selected.candidate_fingerprint,
  };
  const scopeKey = buildGuideBriefConversationScopeKeyV01({
    guide,
    question: "",
    selected_work_scope: selectedWorkScope,
    timeline,
    relationships: input.relationshipsByQuestion,
    selected_relationship_question_key:
      relationships.selected_question_key,
    conversation_context: null,
  });
  const context: GuideBriefInteractionHostV01["context"] = {
    pc4_scope_key: scopeKey,
    workspace_id: selectedWorkScope.workspace_id,
    project_id: selectedWorkScope.project_id,
    project_context: guide.identity.project_context,
    active_project_id: guide.identity.active_project_id,
    proposal_id: selectedWorkScope.proposal_id,
    proposal_fingerprint: selectedWorkScope.proposal_fingerprint,
    candidate_id: selectedWorkScope.candidate_id,
    candidate_fingerprint: selectedWorkScope.candidate_fingerprint,
    pc2: {
      current_item_id: timeline.current_item_id,
      stage: timeline.current_position.stage,
      primary_action_owner:
        timeline.current_position.primary_action_owner,
      material_identity: `${scopeKey}:pc2`,
    },
    pc3: {
      selected_question_key: relationships.selected_question_key,
      highlighted_connection_id:
        relationships.highlighted_connection_id,
      material_identity: `${scopeKey}:pc3`,
    },
    owner_state: {
      busy: input.ownerBusy,
      decision_applying_kind:
        timeline.current_position.primary_action_owner === "decision"
          ? input.applyingDecision
          : null,
      decision_eligible: input.decisionEligible,
      transition_preview_available:
        input.transitionPreviewAvailable,
    },
  };
  const capabilities: BrowserActionCapabilityV01[] = [];
  const adapters: GuideBriefInteractionAdapterV01[] = [];
  const targetScope = {
    workspace_id: selectedWorkScope.workspace_id,
    project_id: selectedWorkScope.project_id,
    proposal_id: selectedWorkScope.proposal_id,
    proposal_fingerprint: selectedWorkScope.proposal_fingerprint,
    candidate_id: selectedWorkScope.candidate_id,
    candidate_fingerprint: selectedWorkScope.candidate_fingerprint,
  };
  const register = (
    capability: BrowserActionCapabilityV01,
    adapter: GuideBriefInteractionAdapterV01,
  ) => {
    capabilities.push(capability);
    adapters.push(adapter);
  };
  const targetHandle = (
    actionKey: BrowserActionCapabilityV01["action_key"],
    routeKey: BrowserActionRouteKeyV01,
    targetCandidateId = selectedWorkScope.candidate_id,
    targetCandidateFingerprint =
      selectedWorkScope.candidate_fingerprint,
  ) =>
    createOpaqueGuideBriefInteractionTargetHandleV01([
      scopeKey,
      actionKey,
      routeKey,
      targetCandidateId,
      targetCandidateFingerprint,
    ]);

  if (
    timeline.current_position.primary_action_owner ===
      "candidate_selection" &&
    input.nextDecisionCandidate &&
    !input.ownerBusy
  ) {
    const next = input.nextDecisionCandidate;
    const handle = targetHandle(
      "selected_work.select_next_candidate",
      "next_candidate",
      next.candidate.candidate_id,
      next.candidate_fingerprint,
    );
    register(
      capabilityV01({
        actionKey: "selected_work.select_next_candidate",
        handle,
        label: "Show the next change",
        preview: "Select the exact next unresolved change.",
        owner: "selected_candidate_surface",
        effectClass: "ui_selection",
        routeKey: "next_candidate",
        scopeKey,
        ownerIdentity: [
          "candidate-selection",
          next.candidate.candidate_id,
          next.candidate_fingerprint,
        ].join(":"),
        destination: "#selected-work-next-candidate",
        targetScope: {
          ...targetScope,
          candidate_id: next.candidate.candidate_id,
          candidate_fingerprint: next.candidate_fingerprint,
        },
      }),
      {
        action_key: "selected_work.select_next_candidate",
        target_handle: handle,
        owner: "selected_candidate_surface",
        effect_class: "ui_selection",
        invoke: async () => {
          input.onSelectedCandidateChange(
            next.candidate.candidate_id,
          );
          return {
            status: "completed",
            public_observed_effect:
              "The next unresolved change is now selected. No decision or project update was made.",
            durable_state_changed: false,
            exact_result_ref: null,
          };
        },
      },
    );
  }

  if (!input.ownerBusy) {
    for (const question of relationships.questions) {
      const routeKey = relationshipRouteKeyV01(question.question_key);
      const handle = targetHandle(
        "relationship.select_question",
        routeKey,
      );
      register(
        capabilityV01({
          actionKey: "relationship.select_question",
          handle,
          label: relationshipCommandLabelV01(question.question_key),
          preview:
            "Show the exact currently advertised relationship question.",
          owner: "pc3_relationship_surface",
          effectClass: "ui_selection",
          routeKey,
          scopeKey,
          ownerIdentity: `${input.relationshipScopeKey}:${question.question_key}`,
          destination: "#selected-work-relationships",
          targetScope,
        }),
        {
          action_key: "relationship.select_question",
          target_handle: handle,
          owner: "pc3_relationship_surface",
          effect_class: "ui_selection",
          invoke: async () => {
            input.onRelationshipQuestionChange(question.question_key);
            return {
              status: "completed",
              public_observed_effect:
                "The requested source-supported relationship is now shown. The existing relationship surface remains the owner.",
              durable_state_changed: false,
              exact_result_ref: null,
            };
          },
        },
      );
    }
  }

  const currentActionOwner =
    timeline.current_position.primary_action_owner;
  const ownerFocusCapability:
    | BrowserOwnerCurrentFocusCapabilityV01
    | null =
    currentActionOwner === "candidate_selection"
      ? {
          available:
            Boolean(input.nextDecisionCandidate) && !input.ownerBusy,
          owner_focus_identity: [
            "candidate-selection-control",
            input.nextDecisionCandidate?.candidate.candidate_id ??
              "unavailable",
            input.nextDecisionCandidate?.candidate_fingerprint ??
              "unavailable",
            input.ownerBusy ? "busy" : "available",
          ].join(":"),
          unavailable_reason: input.ownerBusy
            ? "The candidate-selection control is busy."
            : input.nextDecisionCandidate
              ? null
              : "No exact next candidate can be focused.",
        }
      : currentActionOwner === "decision"
        ? input.decisionCurrentFocusCapability
        : currentActionOwner === "transition"
          ? input.transitionCurrentFocusCapability
          : null;

  if (ownerFocusCapability?.available && !input.ownerBusy) {
    const handle = targetHandle(
      "surface.open_current_action",
      "current_action",
    );
    register(
      capabilityV01({
        actionKey: "surface.open_current_action",
        handle,
        label: "Take me to the current action",
        preview:
          "Focus the existing current action without activating it.",
        owner: "pc2_current_action_surface",
        effectClass: "navigation",
        routeKey: "current_action",
        scopeKey,
        ownerIdentity: [
          timeline.current_item_id,
          currentActionOwner,
          timeline.current_position.destination ?? "local-owner",
          ownerFocusCapability.owner_focus_identity,
        ].join(":"),
        destination: timeline.current_position.destination,
        targetScope,
      }),
      {
        action_key: "surface.open_current_action",
        target_handle: handle,
        owner: "pc2_current_action_surface",
        effect_class: "navigation",
        invoke: async () => {
          const owner = currentActionOwner;
          const focused =
            owner === "candidate_selection"
              ? focusElementV01(input.nextCandidateActionRef.current)
              : owner === "decision"
                ? input.decisionPreparationRef.current
                    ?.getCurrentFocusCapability()
                    .owner_focus_identity ===
                    ownerFocusCapability.owner_focus_identity &&
                  (input.decisionPreparationRef.current?.focusOwner() ??
                    false)
                : owner === "transition"
                  ? input.transitionPreparationRef.current
                      ?.getCurrentFocusCapability()
                      .owner_focus_identity ===
                      ownerFocusCapability.owner_focus_identity &&
                    (input.transitionPreparationRef.current
                      ?.focusOwner() ?? false)
                  : false;
          return {
            status: focused ? "handed_off" : "failed",
            public_observed_effect: focused
              ? "The existing current action now has focus. It was not activated."
              : "The current action owner could not be focused.",
            durable_state_changed: false,
            exact_result_ref: null,
          };
        },
      },
    );
  }

  {
    const handle = targetHandle(
      "panel.open_advanced_review",
      "advanced_review",
    );
    register(
      capabilityV01({
        actionKey: "panel.open_advanced_review",
        handle,
        label: "Open advanced review",
        preview:
          "Open the existing Advanced review disclosure and focus it.",
        owner: "advanced_review_surface",
        effectClass: "navigation",
        routeKey: "advanced_review",
        scopeKey,
        ownerIdentity: `${scopeKey}:advanced-review`,
        destination: "#selected-work-advanced",
        targetScope,
      }),
      {
        action_key: "panel.open_advanced_review",
        target_handle: handle,
        owner: "advanced_review_surface",
        effect_class: "navigation",
        invoke: async () => {
          if (
            !input.advancedReviewRef.current ||
            !input.advancedReviewSummaryRef.current
          ) {
            return failedAdapterResultV01(
              "Advanced review is unavailable.",
            );
          }
          input.advancedReviewRef.current.open = true;
          input.advancedReviewSummaryRef.current.focus();
          return {
            status: "completed",
            public_observed_effect:
              "The existing Advanced review is open. No project state changed.",
            durable_state_changed: false,
            exact_result_ref: null,
          };
        },
      },
    );
  }

  {
    const handle = targetHandle(
      "inspector.open_selected_work",
      "selected_work_inspector",
    );
    register(
      capabilityV01({
        actionKey: "inspector.open_selected_work",
        handle,
        label: "Open exact details",
        preview:
          "Open the exact registered Inspector destination.",
        owner: "inspector_surface",
        effectClass: "navigation",
        routeKey: "selected_work_inspector",
        scopeKey,
        ownerIdentity: input.proposalInspectorHref,
        destination: input.proposalInspectorHref,
        targetScope,
      }),
      {
        action_key: "inspector.open_selected_work",
        target_handle: handle,
        owner: "inspector_surface",
        effect_class: "navigation",
        invoke: async () => {
          window.location.assign(input.proposalInspectorHref);
          return {
            status: "completed",
            public_observed_effect:
              "The exact registered details are now open. Inspector remains read-only.",
            durable_state_changed: false,
            exact_result_ref: null,
          };
        },
      },
    );
  }

  if (input.decisionEligible && !input.ownerBusy) {
    const routeKey =
      input.applyingDecision === "accept"
        ? "decision_accept"
        : input.applyingDecision === "supersede"
          ? "decision_supersede"
          : "decision_retract";
    const handle = targetHandle(
      "decision.prepare_applying",
      routeKey,
    );
    register(
      capabilityV01({
        actionKey: "decision.prepare_applying",
        handle,
        label:
          input.applyingDecision === "accept"
            ? "Prepare an accept decision"
            : input.applyingDecision === "supersede"
              ? "Prepare a replace decision"
              : "Prepare a remove decision",
        preview:
          "Prepare the currently valid applying choice in the existing decision form. Nothing will be saved.",
        owner: "review_decision_form",
        effectClass: "prepare",
        routeKey,
        scopeKey,
        ownerIdentity: [
          selectedWorkScope.candidate_id,
          selectedWorkScope.candidate_fingerprint,
          input.applyingDecision,
          "eligible",
        ].join(":"),
        destination: "#selected-work-decision",
        targetScope,
        confirmationPolicy: "owner_preparation_only",
      }),
      {
        action_key: "decision.prepare_applying",
        target_handle: handle,
        owner: "review_decision_form",
        effect_class: "prepare",
        invoke: async () => {
          const prepared =
            input.decisionPreparationRef.current?.prepareApplying(
              input.applyingDecision,
            ) ?? false;
          return prepared
            ? {
                status: "handed_off",
                public_observed_effect:
                  "The applying choice is prepared in the existing decision form. Review or enter its decision note before saving. Nothing has been saved.",
                durable_state_changed: false,
                exact_result_ref: null,
              }
            : failedAdapterResultV01(
                "The current decision owner could not be prepared.",
              );
        },
      },
    );
  }

  if (input.transitionPreviewAvailable && !input.ownerBusy) {
    const handle = targetHandle(
      "transition.prepare_preview",
      "transition_preview",
    );
    register(
      capabilityV01({
        actionKey: "transition.prepare_preview",
        handle,
        label: "Show what would change before applying",
        preview:
          "Ask the existing project-change owner for one read-only impact preview.",
        owner: "semantic_transition_actions",
        effectClass: "read",
        routeKey: "transition_preview",
        scopeKey,
        ownerIdentity: `${scopeKey}:transition-preview:available`,
        destination: "#selected-work-transition",
        targetScope,
        confirmationPolicy: "read_only_owner_preview",
      }),
      {
        action_key: "transition.prepare_preview",
        target_handle: handle,
        owner: "semantic_transition_actions",
        effect_class: "read",
        invoke: async () => {
          const result =
            await input.transitionPreparationRef.current?.preparePreview();
          if (!result || result.status !== "prepared") {
            return failedAdapterResultV01(
              result?.public_observed_effect ??
                "Impact review is unavailable.",
            );
          }
          return {
            status: "preview_prepared",
            public_observed_effect: result.public_observed_effect,
            durable_state_changed: false,
            exact_result_ref: null,
          };
        },
      },
    );
  }

  if (
    JSON.stringify({ context, capabilities }) !==
    JSON.stringify({
      context: sharedCapabilitySet.context,
      capabilities: sharedCapabilitySet.capabilities,
    })
  ) {
    throw new Error("guidebrief_pc5_shared_capability_owner_mismatch");
  }
  return {
    context: sharedCapabilitySet.context,
    capabilities: sharedCapabilitySet.capabilities,
    adapters,
  };
}

function capabilityV01(input: {
  actionKey: BrowserActionCapabilityV01["action_key"];
  handle: string;
  label: string;
  preview: string;
  owner: BrowserActionCapabilityV01["owner"];
  effectClass: BrowserActionCapabilityV01["effect_class"];
  routeKey: BrowserActionRouteKeyV01;
  scopeKey: string;
  ownerIdentity: string;
  destination: string | null;
  targetScope: BrowserActionCapabilityV01["target_scope"];
  confirmationPolicy?: BrowserActionCapabilityV01["confirmation_policy"];
}): BrowserActionCapabilityV01 {
  return {
    capability_version: "browser_action_capability.v0.1",
    action_key: input.actionKey,
    target_handle: input.handle,
    public_label: input.label,
    public_effect_preview: input.preview,
    owner: input.owner,
    effect_class: input.effectClass,
    availability: "available",
    unavailable_reason: null,
    interaction_scope_key: input.scopeKey,
    owner_actionability_identity: input.ownerIdentity,
    confirmation_policy:
      input.confirmationPolicy ?? "immediate_current_scope",
    destination: input.destination,
    may_propose: true,
    may_execute_immediately: true,
    route_key: input.routeKey,
    target_scope: input.targetScope,
    authority: {
      projection_only: true,
      durable: false,
      semantic_authority: false,
      transition_authority: false,
      execution_authority: false,
      external_action_authority: false,
    },
  };
}

function relationshipRouteKeyV01(
  questionKey: SelectedWorkRelationshipQuestionKeyV01,
): BrowserActionRouteKeyV01 {
  return questionKey === "support_and_source"
    ? "relationship_support_and_source"
    : questionKey === "candidate_and_decision"
      ? "relationship_candidate_and_decision"
      : questionKey === "blocker_and_conflict"
        ? "relationship_blocker_and_conflict"
        : questionKey === "decision_and_project_change"
          ? "relationship_decision_and_project_change"
          : "relationship_project_change_and_later_outcome";
}

function relationshipCommandLabelV01(
  questionKey: SelectedWorkRelationshipQuestionKeyV01,
): string {
  return questionKey === "support_and_source"
    ? "Show the source connection"
    : questionKey === "candidate_and_decision"
      ? "Show the decision connection"
      : questionKey === "blocker_and_conflict"
        ? "Show the blocker"
        : questionKey === "decision_and_project_change"
          ? "Show the project change connection"
          : "Show the later outcome";
}

function focusElementV01(
  element: HTMLElement | null,
): boolean {
  if (!element) return false;
  element.focus();
  return true;
}

function failedAdapterResultV01(
  message: string,
): Awaited<
  ReturnType<GuideBriefInteractionAdapterV01["invoke"]>
> {
  return {
    status: "failed",
    public_observed_effect: message,
    durable_state_changed: false,
    exact_result_ref: null,
  };
}

function SelectedWorkRelationships({
  relationships,
  onQuestionChange,
}: {
  relationships: SelectedWorkRelationshipsV01;
  onQuestionChange: (
    questionKey: SelectedWorkRelationshipQuestionKeyV01,
  ) => void;
}) {
  const highlighted = relationships.connections.find(
    (connection) =>
      connection.connection_id === relationships.highlighted_connection_id,
  ) ?? null;
  const remaining = relationships.connections.filter(
    (connection) =>
      connection.connection_id !== relationships.highlighted_connection_id,
  );
  return (
    <section
      id="selected-work-relationships"
      className={`${styles.panel} ${styles.selectedWorkRelationships}`}
      aria-labelledby="selected-work-relationships-title"
      data-selected-work-relationships={relationships.relationships_version}
      data-selected-work-relationship-question={
        relationships.selected_question_key ?? "unavailable"
      }
      data-selected-work-relationship-answer={
        relationships.answer_availability
      }
      data-selected-work-relationship-visible-count={
        relationships.visible_connection_count
      }
      data-selected-work-relationship-known-count={
        relationships.known_connection_count
      }
      data-selected-work-relationship-omitted-count={
        relationships.locally_omitted_connection_count
      }
      data-selected-work-relationship-completeness={
        relationships.completeness.status
      }
      data-selected-work-relationship-highlight={
        relationships.highlighted_connection_id ?? "none"
      }
      data-selected-work-relationship-projection-only={String(
        relationships.authority.projection_only,
      )}
      data-selected-work-relationship-semantic-authority="false"
      data-selected-work-relationship-timeline-owner={String(
        relationships.selected_work_anchor
          .timeline_remains_current_position_owner,
      )}
      data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.supporting}
    >
      <div className={styles.panelHeader}>
        <p className={styles.kicker}>Why this work is connected</p>
        <h2 id="selected-work-relationships-title">
          Relationship exploration
        </h2>
        <p className={styles.copy}>
          Ask one source-supported connection question about the selected
          change. The timeline still explains sequence and the current
          position.
        </p>
      </div>

      {relationships.questions.length > 0 &&
      relationships.selected_question_key ? (
        <label className={styles.fieldLabel}>
          Connection question
          <select
            className={styles.selectControl}
            data-selected-work-relationship-question-selector="true"
            value={relationships.selected_question_key}
            onChange={(event) =>
              onQuestionChange(
                event.target.value as SelectedWorkRelationshipQuestionKeyV01,
              )
            }
          >
            {relationships.questions.map((question) => (
              <option
                key={question.question_key}
                value={question.question_key}
              >
                {question.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <section
        className={styles.relationshipAnswer}
        aria-labelledby="selected-work-relationship-answer-title"
        data-selected-work-relationship-answer-region="true"
      >
        <div>
          <p className={styles.kicker}>Selected question</p>
          <h3 id="selected-work-relationship-answer-title">
            {relationships.selected_question_label}
          </h3>
        </div>
        {highlighted ? (
          <SelectedWorkConnection
            connection={highlighted}
            highlighted
          />
        ) : (
          <p
            className={styles.empty}
            data-selected-work-relationship-unavailable="true"
          >
            No exact source-supported connection is available for this
            question. Missing material remains unknown rather than inferred.
          </p>
        )}
        {remaining.length > 0 ? (
          <ol
            className={styles.relationshipConnectionList}
            aria-label="Additional bounded connections"
          >
            {remaining.map((connection) => (
              <li key={connection.connection_id}>
                <SelectedWorkConnection
                  connection={connection}
                  highlighted={false}
                />
              </li>
            ))}
          </ol>
        ) : null}
      </section>

      {relationships.completeness.status !== "complete" ? (
        <p
          className={styles.notice}
          data-selected-work-relationship-incomplete="true"
        >
          {relationships.completeness.summary}
        </p>
      ) : null}
      {relationships.suggested_destinations.length > 0 ? (
        <nav
          className={styles.relationshipDestinations}
          aria-label="Related exact and supporting detail"
        >
          {relationships.suggested_destinations.map((destination) => (
            <a
              key={destination.href}
              className={styles.inlineLink}
              href={destination.href}
              data-selected-work-relationship-secondary-destination="true"
            >
              {destination.label}
            </a>
          ))}
        </nav>
      ) : null}
      <p className={styles.muted}>
        This projection explains a bounded connection. It does not establish
        truth, accept evidence, make a decision, authorize or apply a project
        update, or change later context.
      </p>
    </section>
  );
}

function SelectedWorkConnection({
  connection,
  highlighted,
}: {
  connection: SelectedWorkConnectionStatementV01;
  highlighted: boolean;
}) {
  return (
    <article
      className={
        highlighted
          ? styles.relationshipHighlight
          : styles.relationshipConnection
      }
      data-selected-work-relationship-connection={connection.connection_id}
      data-selected-work-relationship-kind={connection.relation_kind}
      data-selected-work-relationship-basis={connection.basis}
      data-selected-work-relationship-support={connection.support_status}
      data-selected-work-relationship-highlighted={String(highlighted)}
      data-selected-work-relationship-authority="false"
    >
      <div className={styles.relationshipConnectionHeader}>
        <div>
          <span className={styles.timelineBasis}>
            {relationshipBasisLabel(connection.basis)}
          </span>
          <h3>{connection.title}</h3>
        </div>
        <span className={styles.timelineStatus}>
          {highlighted
            ? "Matters most now"
            : relationshipSupportLabel(connection.support_status)}
        </span>
      </div>
      <p className={styles.copy}>{connection.explanation}</p>
      <div className={styles.relationshipWhy}>
        <strong>Why it matters now</strong>
        <p className={styles.copy}>{connection.why_it_matters_now}</p>
      </div>
      {connection.uncertainty_or_conflict ? (
        <p className={styles.notice}>
          {connection.uncertainty_or_conflict}
        </p>
      ) : null}
    </article>
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

function relationshipBasisLabel(
  basis: SelectedWorkRelationshipBasisV01,
): string {
  return basis === "observed_source"
    ? "Observed source"
    : basis === "reported_source"
      ? "Reported source"
      : basis === "exact_recorded_relation"
        ? "Exact recorded connection"
        : basis === "bounded_interpretation"
          ? "Bounded interpretation"
          : basis === "user_decision"
            ? "User decision"
            : basis === "authorized_project_change"
              ? "Authorized project change"
              : basis === "blocker_or_conflict"
                ? "Blocker or conflict"
                : "Later outcome";
}

function relationshipSupportLabel(
  support: SelectedWorkConnectionStatementV01["support_status"],
): string {
  return support === "exact"
    ? "Exact"
    : support === "partial"
      ? "Partial"
      : "Conflicting";
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
