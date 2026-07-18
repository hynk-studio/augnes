"use client";

import type { FormEvent } from "react";
import { useState } from "react";

import type {
  SemanticReviewCandidateReadV01,
  SemanticReviewDecisionRequestV01,
} from "./semantic-review-types";
import styles from "./semantic-review.module.css";

type SupportedDecision = SemanticReviewDecisionRequestV01["decision"];

export function ReviewDecisionForm({
  proposalId,
  proposalFingerprint,
  candidateRead,
  busy,
  onSubmit,
}: {
  proposalId: string;
  proposalFingerprint: string;
  candidateRead: SemanticReviewCandidateReadV01;
  busy: boolean;
  onSubmit: (request: SemanticReviewDecisionRequestV01) => Promise<void>;
}) {
  const [decision, setDecision] = useState<SupportedDecision>("defer");
  const [rationaleSummary, setRationaleSummary] = useState("");
  const [revisitCondition, setRevisitCondition] = useState("");

  const acceptAllowed = candidateRead.pilot_admission.decision_allowed.accept;
  const selectedDecisionAllowed = decision !== "accept" || acceptAllowed;
  const canSubmit =
    !busy &&
    selectedDecisionAllowed &&
    rationaleSummary.trim().length > 0 &&
    (decision !== "defer" || revisitCondition.trim().length > 0);

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
      onSubmit={submitDecision}
    >
      <label htmlFor={`decision-${candidateRead.candidate.candidate_id}`}>
        Explicit ReviewDecision
      </label>
      <select
        id={`decision-${candidateRead.candidate.candidate_id}`}
        value={decision}
        onChange={(event) => setDecision(event.target.value as SupportedDecision)}
      >
        <option value="defer">Defer for later review</option>
        <option value="reject">Reject this candidate</option>
        <option value="accept" disabled={!acceptAllowed}>
          Accept for {candidateRead.pilot_admission.accept_operation ?? "eligible operation"} intent
        </option>
      </select>

      <label htmlFor={`rationale-${candidateRead.candidate.candidate_id}`}>
        Bounded rationale
      </label>
      <textarea
        id={`rationale-${candidateRead.candidate.candidate_id}`}
        maxLength={2000}
        required
        value={rationaleSummary}
        onChange={(event) => setRationaleSummary(event.target.value)}
      />

      {decision === "defer" ? (
        <>
          <label htmlFor={`revisit-${candidateRead.candidate.candidate_id}`}>
            Required revisit condition
          </label>
          <textarea
            id={`revisit-${candidateRead.candidate.candidate_id}`}
            maxLength={2000}
            required
            value={revisitCondition}
            onChange={(event) => setRevisitCondition(event.target.value)}
            placeholder="Describe what new information should trigger another review."
          />
          <p className={styles.muted}>
            This form submits only the explicit bounded revisit condition. It does not
            submit caller-controlled timestamps.
          </p>
        </>
      ) : null}

      {decision === "accept" ? (
        <p className={styles.notice}>
          Accept records a ReviewDecision and an exact transition intent. It does not
          confirm a gate, apply semantic state, create a StateTransitionReceipt, or
          compile later context.
        </p>
      ) : (
        <p className={styles.copy}>
          Reject and defer record no transition intent and apply no state.
        </p>
      )}

      {!acceptAllowed ? (
        <p className={styles.muted}>
          Accept is unavailable under the real-pilot policy: this selected candidate
          must declare an explicit add, revise, supersede, or retract operation whose
          exact target state satisfies its current-state precondition. Unknown and
          no-change candidates require a separate immutable operation-aware revision.
          Reject and defer remain available.
        </p>
      ) : null}

      <p className={styles.muted}>
        The server binds the actor, authorization and decision basis, target set, and
        decision time from the authenticated session and persisted proposal. This form
        does not submit those authority-shaped fields.
      </p>

      <button className={styles.button} type="submit" disabled={!canSubmit}>
        {busy ? "Recording decision…" : `Record ${decision} decision`}
      </button>
    </form>
  );
}
