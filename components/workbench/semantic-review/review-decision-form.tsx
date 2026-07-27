"use client";

import type { FormEvent } from "react";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

import type { BrowserOwnerCurrentFocusCapabilityV01 } from "@/types/vnext/guide-brief-interaction";

import type {
  SemanticReviewCandidateReadV01,
  SemanticReviewDecisionRequestV01,
} from "./semantic-review-types";
import {
  applyReviewDecisionSelectionV01,
  canSubmitReviewDecisionFormV01,
  DEFAULT_DEFER_RATIONALE_V01,
  type ReviewDecisionFormOwnerStateV01,
} from "./review-decision-form-state";
import styles from "./semantic-review.module.css";

type SupportedDecision = SemanticReviewDecisionRequestV01["decision"];
const DEFAULT_REVISIT_CONDITION =
  "Review again when the missing verification or current project information is available.";

export interface ReviewDecisionPreparationHandleV01 {
  prepareApplying: (
    applyingDecision: "accept" | "supersede" | "retract",
  ) => boolean;
  getCurrentFocusCapability: () => BrowserOwnerCurrentFocusCapabilityV01;
  focusOwner: () => boolean;
}

export const ReviewDecisionForm = forwardRef<
  ReviewDecisionPreparationHandleV01,
  {
    proposalId: string;
    proposalFingerprint: string;
    candidateRead: SemanticReviewCandidateReadV01;
    applyingDecision?: "accept" | "supersede" | "retract";
    primary?: boolean;
    busy: boolean;
    onSubmit: (request: SemanticReviewDecisionRequestV01) => Promise<void>;
    onCurrentFocusCapabilityChange?: (
      capability: BrowserOwnerCurrentFocusCapabilityV01,
    ) => void;
  }
>(function ReviewDecisionForm({
  proposalId,
  proposalFingerprint,
  candidateRead,
  applyingDecision = "accept",
  primary = true,
  busy,
  onSubmit,
  onCurrentFocusCapabilityChange,
}, ref) {
  const [decision, setDecision] = useState<SupportedDecision>("defer");
  const [rationaleSummary, setRationaleSummary] = useState(
    DEFAULT_DEFER_RATIONALE_V01,
  );
  const [rationaleBoundDecision, setRationaleBoundDecision] =
    useState<SupportedDecision | null>("defer");
  const [revisitCondition, setRevisitCondition] = useState(
    DEFAULT_REVISIT_CONDITION,
  );
  const decisionControlRef = useRef<HTMLSelectElement | null>(null);

  const applyAllowed = candidateRead.pilot_admission.decision_allowed.accept;
  const selectedDecisionAllowed =
    decision !== applyingDecision || applyAllowed;
  const ownerState: ReviewDecisionFormOwnerStateV01 = {
    decision,
    rationale_summary: rationaleSummary,
    rationale_bound_decision: rationaleBoundDecision,
    revisit_condition: revisitCondition,
  };
  const canSubmit = canSubmitReviewDecisionFormV01(ownerState, {
    busy,
    selected_decision_allowed: selectedDecisionAllowed,
  });
  const currentFocusCapability: BrowserOwnerCurrentFocusCapabilityV01 = {
    available: !busy,
    owner_focus_identity: [
      "decision-control",
      candidateRead.candidate.candidate_id,
      candidateRead.candidate_fingerprint,
      applyingDecision,
      busy ? "busy" : "available",
    ].join(":"),
    unavailable_reason: busy
      ? "The current decision control is busy."
      : null,
  };

  useEffect(() => {
    onCurrentFocusCapabilityChange?.(currentFocusCapability);
  }, [
    currentFocusCapability.available,
    currentFocusCapability.owner_focus_identity,
    currentFocusCapability.unavailable_reason,
    onCurrentFocusCapabilityChange,
  ]);

  function selectDecision(nextDecision: SupportedDecision): void {
    const nextState = applyReviewDecisionSelectionV01(
      ownerState,
      nextDecision,
    );
    setDecision(nextState.decision);
    setRationaleSummary(nextState.rationale_summary);
    setRationaleBoundDecision(nextState.rationale_bound_decision);
    setRevisitCondition(nextState.revisit_condition);
  }

  useImperativeHandle(
    ref,
    () => ({
      prepareApplying: (requestedDecision) => {
        if (
          busy ||
          !applyAllowed ||
          requestedDecision !== applyingDecision
        ) {
          return false;
        }
        selectDecision(applyingDecision);
        decisionControlRef.current?.focus();
        return true;
      },
      getCurrentFocusCapability: () => currentFocusCapability,
      focusOwner: () => {
        if (
          !currentFocusCapability.available ||
          !decisionControlRef.current
        ) {
          return false;
        }
        decisionControlRef.current.focus();
        return true;
      },
    }),
    [
      applyAllowed,
      applyingDecision,
      currentFocusCapability,
      ownerState,
    ],
  );

  async function submitDecision(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    const rationale = rationaleSummary.trim();
    const revisit = revisitCondition.trim();
    await onSubmit({
      proposal_id: proposalId,
      proposal_fingerprint: proposalFingerprint,
      candidate_id: candidateRead.candidate.candidate_id,
      candidate_fingerprint: candidateRead.candidate_fingerprint,
      decision,
      rationale_summary: rationale,
      ...(decision === "defer" && revisit
        ? { revisit: { condition_summary: revisit } }
        : {}),
    });
  }

  return (
    <form
      className={styles.form}
      data-vnext-operator-decision-form="v0.1"
      data-vnext-operator-decision-candidate={candidateRead.candidate.candidate_id}
      data-vnext-proposal-local-controls-busy={String(busy)}
      data-vnext-default-decision-path-interactions="2"
      onSubmit={submitDecision}
    >
      <label htmlFor={`decision-${candidateRead.candidate.candidate_id}`}>
        Decision
      </label>
      <select
        ref={decisionControlRef}
        id={`decision-${candidateRead.candidate.candidate_id}`}
        value={decision}
        disabled={busy}
        onChange={(event) =>
          selectDecision(event.target.value as SupportedDecision)
        }
      >
        <option value="defer">Decide later</option>
        <option value="reject">Reject this change</option>
        <option value={applyingDecision} disabled={!applyAllowed}>
          {applyingDecision === "accept"
            ? "Accept this change"
            : applyingDecision === "supersede"
              ? "Replace the current saved state"
              : "Remove the current saved state"}
        </option>
      </select>

      <label htmlFor={`rationale-${candidateRead.candidate.candidate_id}`}>
        Decision note (editable suggested wording)
      </label>
      <textarea
        id={`rationale-${candidateRead.candidate.candidate_id}`}
        maxLength={2000}
        required
        value={rationaleSummary}
        disabled={busy}
        onChange={(event) => {
          setRationaleSummary(event.target.value);
          setRationaleBoundDecision(decision);
        }}
      />
      {rationaleBoundDecision !== decision ? (
        <p className={styles.notice}>
          Edit this decision note for the selected choice before saving.
        </p>
      ) : null}

      {decision === "defer" ? (
        <>
          <label htmlFor={`revisit-${candidateRead.candidate.candidate_id}`}>
            Review again when… (editable suggested wording)
          </label>
          <textarea
            id={`revisit-${candidateRead.candidate.candidate_id}`}
            maxLength={2000}
            required
            value={revisitCondition}
            disabled={busy}
            onChange={(event) => setRevisitCondition(event.target.value)}
            placeholder="Describe what new information should trigger another review."
          />
          <p className={styles.muted}>
            Describe what would make another review useful. The system records no
            caller-provided decision time.
          </p>
        </>
      ) : null}

      {decision === applyingDecision ? (
        <p className={styles.notice}>
          Saving this decision does not change the project yet. Applying the
          reviewed change remains a separate confirmed action.
        </p>
      ) : (
        <p className={styles.copy}>
          Rejecting or deciding later does not change the project.
        </p>
      )}

      {!applyAllowed ? (
        <p className={styles.muted}>
          This suggested change needs clearer change semantics or current project
          information before it can be accepted. Reject and Decide later remain
          available.
        </p>
      ) : null}

      <p className={styles.muted}>
        Augnes binds this decision to the protected current review. This form does
        not ask you to enter internal identifiers or authority fields.
      </p>

      <button
        className={primary ? styles.button : styles.secondaryButton}
        type="submit"
        data-ai-workplane-primary-action={primary ? "save-decision" : undefined}
        data-augnes-primary-action={primary ? "save-decision" : undefined}
        disabled={!canSubmit}
      >
        {busy ? "Saving decision…" : "Save decision"}
      </button>
    </form>
  );
});
