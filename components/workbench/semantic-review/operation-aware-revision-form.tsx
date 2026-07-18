"use client";

import type { FormEvent } from "react";
import { useState } from "react";

import type {
  SemanticReviewCandidateReadV01,
  SemanticReviewRevisionRequestV01,
} from "./semantic-review-types";
import styles from "./semantic-review.module.css";

const DELTA_TYPES = [
  "validation_delta",
  "research_delta",
  "perspective_delta",
  "memory_delta",
  "artifact_delta",
  "code_delta",
  "world_state_delta",
  "agent_plan_delta",
  "user_decision_delta",
  "coordination_delta",
] as const;

export function OperationAwareRevisionForm({
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
  onSubmit: (request: SemanticReviewRevisionRequestV01) => Promise<void>;
}) {
  const targetState = candidateRead.pilot_admission.current_state_status;
  const defaultOperation = targetState === "absent" ? "add" : "revise";
  const mayResolvePresentTarget =
    targetState === "present" || targetState === "drifted";
  const [operation, setOperation] = useState<
    SemanticReviewRevisionRequestV01["operation"]
  >(defaultOperation);
  const [deltaType, setDeltaType] = useState<
    SemanticReviewRevisionRequestV01["delta_type"]
  >("validation_delta");
  const [title, setTitle] = useState(candidateRead.candidate.title);
  const [stateSummary, setStateSummary] = useState(
    candidateRead.candidate.proposed_state_summary,
  );
  const [rationale, setRationale] = useState("");
  const canSubmit =
    !busy &&
    title.trim().length > 0 &&
    stateSummary.trim().length > 0 &&
    rationale.trim().length > 0 &&
    (operation === "add" ? targetState === "absent" : mayResolvePresentTarget);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    await onSubmit({
      action: "revise",
      proposal_id: proposalId,
      proposal_fingerprint: proposalFingerprint,
      candidate_id: candidateRead.candidate.candidate_id,
      candidate_fingerprint: candidateRead.candidate_fingerprint,
      delta_type: deltaType,
      operation,
      title: title.trim(),
      proposed_state_summary: stateSummary.trim(),
      rationale_summary: rationale.trim(),
      uncertainties: [],
      limitations: [],
    });
  }

  return (
    <form
      className={styles.form}
      data-vnext-operation-revision-form="v0.1"
      onSubmit={submit}
    >
      <strong>Create immutable operation-aware revision</strong>
      <p className={styles.copy}>
        The server preserves the original proposal and all execution and assessment
        residue. Only these bounded candidate fields can be authored here.
      </p>
      <label>
        Semantic operation
        <select
          value={operation}
          onChange={(event) =>
            setOperation(
              event.target.value as SemanticReviewRevisionRequestV01["operation"],
            )
          }
        >
          <option value="add" disabled={targetState !== "absent"}>Add / create</option>
          <option value="revise" disabled={!mayResolvePresentTarget}>Revise / replace</option>
          <option value="supersede" disabled={!mayResolvePresentTarget}>Supersede</option>
          <option value="retract" disabled={!mayResolvePresentTarget}>Retract</option>
        </select>
      </label>
      <label>
        Delta lane
        <select
          value={deltaType}
          onChange={(event) =>
            setDeltaType(
              event.target.value as SemanticReviewRevisionRequestV01["delta_type"],
            )
          }
        >
          {DELTA_TYPES.map((value) => <option key={value}>{value}</option>)}
        </select>
      </label>
      <label>
        Candidate title
        <input maxLength={2000} value={title} onChange={(event) => setTitle(event.target.value)} />
      </label>
      <label>
        Proposed state summary
        <textarea maxLength={2000} value={stateSummary} onChange={(event) => setStateSummary(event.target.value)} />
      </label>
      <label>
        Bounded revision rationale
        <textarea required maxLength={2000} value={rationale} onChange={(event) => setRationale(event.target.value)} />
      </label>
      <p className={styles.notice}>
        This revision remains pending candidate material. It creates no decision,
        gate, Transition, semantic state, or later packet.
      </p>
      {targetState === "drifted" ? (
        <p className={styles.notice}>
          The source ref carries newer assessment provenance. Submission remains
          blocked unless the server resolves the same target identity to one exact,
          coherent current state already present in this proposal&apos;s packet.
        </p>
      ) : null}
      <button className={styles.secondaryButton} type="submit" disabled={!canSubmit}>
        {busy ? "Creating revision…" : "Create immutable revision"}
      </button>
    </form>
  );
}
