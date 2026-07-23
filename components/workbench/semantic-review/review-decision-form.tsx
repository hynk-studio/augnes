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
  applyingDecision = "accept",
  primary = true,
  busy,
  onSubmit,
}: {
  proposalId: string;
  proposalFingerprint: string;
  candidateRead: SemanticReviewCandidateReadV01;
  applyingDecision?: "accept" | "supersede" | "retract";
  primary?: boolean;
  busy: boolean;
  onSubmit: (request: SemanticReviewDecisionRequestV01) => Promise<void>;
}) {
  const [decision, setDecision] = useState<SupportedDecision>("defer");
  const [rationaleSummary, setRationaleSummary] = useState("");
  const [revisitCondition, setRevisitCondition] = useState("");

  const applyAllowed = candidateRead.pilot_admission.decision_allowed.accept;
  const selectedDecisionAllowed =
    decision !== applyingDecision || applyAllowed;
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
      data-vnext-proposal-local-controls-busy={String(busy)}
      onSubmit={submitDecision}
    >
      <label htmlFor={`decision-${candidateRead.candidate.candidate_id}`}>
        Decision
      </label>
      <select
        id={`decision-${candidateRead.candidate.candidate_id}`}
        value={decision}
        disabled={busy}
        onChange={(event) => setDecision(event.target.value as SupportedDecision)}
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
        Decision note
      </label>
      <textarea
        id={`rationale-${candidateRead.candidate.candidate_id}`}
        maxLength={2000}
        required
        value={rationaleSummary}
        disabled={busy}
        onChange={(event) => setRationaleSummary(event.target.value)}
      />

      {decision === "defer" ? (
        <>
          <label htmlFor={`revisit-${candidateRead.candidate.candidate_id}`}>
            Review again when…
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
        disabled={!canSubmit}
      >
        {busy ? "Saving decision…" : "Save decision"}
      </button>
    </form>
  );
}
