"use client";

import type { FormEvent } from "react";
import { useState } from "react";

import type { SemanticContextUseReviewRequestV01 } from "./semantic-review-types";
import styles from "./semantic-review.module.css";

export function ContextUseReviewForm({
  receiptId,
  receiptFingerprint,
  busy,
  onSubmit,
}: {
  receiptId: string;
  receiptFingerprint: string;
  busy: boolean;
  onSubmit: (request: SemanticContextUseReviewRequestV01) => Promise<void>;
}) {
  const [actuallyUsed, setActuallyUsed] = useState<
    SemanticContextUseReviewRequestV01["actually_used"]
  >("unknown");
  const [assessment, setAssessment] = useState<
    SemanticContextUseReviewRequestV01["assessment"]
  >("not_applicable");
  const [notes, setNotes] = useState("");
  const [correction, setCorrection] = useState("");
  const semanticallyAllowed =
    assessment !== "helpful" || actuallyUsed === "yes" || actuallyUsed === "partial";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !semanticallyAllowed) return;
    await onSubmit({
      action: "record_context_use_review",
      later_run_receipt_id: receiptId,
      later_run_receipt_fingerprint: receiptFingerprint,
      actually_used: actuallyUsed,
      assessment,
      correction_summaries: correction.trim() ? [correction.trim()] : [],
      notes: notes.trim() ? [notes.trim()] : [],
      metrics: {
        wrong_context_correction_count: correction.trim() ? 1 : 0,
        repeated_explanation_estimate: null,
        missing_critical_context_count: assessment === "missing" ? 1 : 0,
        context_refs_used_count:
          actuallyUsed === "yes" || actuallyUsed === "partial" ? 1 : null,
      },
    });
  }

  return (
    <form className={styles.form} data-vnext-context-use-review-form="v0.1" onSubmit={submit}>
      <label>
        Did this project context help?
        <select value={actuallyUsed} onChange={(event) => setActuallyUsed(event.target.value as typeof actuallyUsed)}>
          <option value="unknown">Not sure</option>
          <option value="yes">Helpful</option>
          <option value="partial">Partly helpful</option>
          <option value="no">Not helpful</option>
        </select>
      </label>
      <label>
        What should Augnes know?
        <select value={assessment} onChange={(event) => setAssessment(event.target.value as typeof assessment)}>
          <option value="not_applicable">Not applicable</option>
          <option value="helpful">Helpful</option>
          <option value="stale">Stale</option>
          <option value="misleading">Misleading</option>
          <option value="missing">Missing</option>
          <option value="noisy">Noisy</option>
        </select>
      </label>
      <label>
        What should be corrected?
        <textarea maxLength={2000} value={correction} onChange={(event) => setCorrection(event.target.value)} />
      </label>
      <label>
        Optional note
        <textarea maxLength={2000} value={notes} onChange={(event) => setNotes(event.target.value)} />
      </label>
      {!semanticallyAllowed ? (
        <p className={styles.error}>Helpful requires actual use yes or partial.</p>
      ) : null}
      <p className={styles.notice}>
        Feedback is recorded separately. It does not immediately change saved
        project context or approve another action.
      </p>
      <button className={styles.button} type="submit" disabled={busy || !semanticallyAllowed}>
        {busy ? "Saving feedback…" : "Save feedback"}
      </button>
    </form>
  );
}
