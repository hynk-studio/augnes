"use client";

import { useEffect, useMemo, useState } from "react";

import type { VNextOperatorPilotPacketHandoffV01 } from "@/lib/vnext/runtime/operator-pilot-project-continuity";
import type {
  ContextUseReviewActuallyUsedV01,
  ContextUseReviewAssessmentV01,
  ContextUseReviewMetricsV01,
  ContextUseReviewPresentedV01,
  ContextUseReviewV01,
} from "@/types/vnext/context-use-review";
import type { RunReceiptV01 } from "@/types/vnext/run-receipt";

import styles from "./semantic-review.module.css";

const CONTEXT_USE_REVIEW_ROUTE = "/api/vnext/operator/context-use-review";
const MAX_OPERATOR_BODY_BYTES = 16 * 1024;
const MAX_CORRECTIONS = 16;
const MAX_SUMMARY_CHARACTERS = 2000;
const MAX_METRIC_VALUE = 1_000_000;
const MAX_RESPONSE_COLLECTION_ITEMS = 128;

const FALSE_AUTHORITY_KEYS = [
  "contract_validation_authenticates_reviewer",
  "construction_proves_real_review",
  "record_is_evidence",
  "record_is_semantic_state",
  "record_is_review_decision",
  "record_is_state_transition_receipt",
  "record_is_work_closure",
  "creates_correction_proposal",
  "applies_state_transition",
  "accepts_evidence",
  "mutates_perspective",
  "promotes_reviewed_memory",
  "closes_work",
  "selects_next_context_automatically",
  "triggers_automatic_rollback",
  "authorizes_provider_calls",
  "authorizes_github_mutation",
  "authorizes_publication",
  "authorizes_external_actuation",
  "writes_database",
] as const satisfies ReadonlyArray<
  keyof ContextUseReviewV01["authority_summary"]
>;

interface ContextUseReviewRouteFieldsV01 {
  review_version: ContextUseReviewV01["review_version"];
  workspace_id: string;
  project_id: string;
  review: ContextUseReviewV01;
  relation: {
    prior_later_transition_exact: true;
    later_result_exact: true;
    reviewer_session_bound: true;
  };
  correction_proposal_created: false;
  semantic_state_mutated: false;
  transition_created: false;
  evidence_accepted: false;
  perspective_mutated: false;
  memory_promoted: false;
  work_closed: false;
  automatic_context_change: false;
  authentication_boundary: "local_secret_possession_only_not_external_identity";
  semantic_authority_granted: false;
}

interface ContextUseReviewWriteResponseV01 extends ContextUseReviewRouteFieldsV01 {
  ok: true;
  status: "inserted" | "exact_replay";
}

interface ContextUseReviewReadResponseV01 extends ContextUseReviewRouteFieldsV01 {
  ok: true;
  status: "context_use_review";
}

type ContextUseReviewDisplayV01 =
  ContextUseReviewWriteResponseV01 | ContextUseReviewReadResponseV01;

type MetricInputKeyV01 = keyof ContextUseReviewMetricsV01;
type MetricInputStateV01 = Record<MetricInputKeyV01, string>;

const EMPTY_METRICS: MetricInputStateV01 = {
  wrong_context_correction_count: "",
  repeated_explanation_estimate: "",
  missing_critical_context_count: "",
  context_refs_used_count: "",
};

export function ContextUseReviewPanel({
  handoff,
  laterTaskReceipt,
  tryBeginOperatorMutation,
  endOperatorMutation,
  onSessionInvalid,
}: {
  handoff: VNextOperatorPilotPacketHandoffV01;
  laterTaskReceipt: RunReceiptV01;
  tryBeginOperatorMutation: () => boolean;
  endOperatorMutation: () => void;
  onSessionInvalid: (errorCode: string) => void;
}) {
  const [presented, setPresented] =
    useState<ContextUseReviewPresentedV01>("unknown");
  const [actuallyUsed, setActuallyUsed] =
    useState<ContextUseReviewActuallyUsedV01>("unknown");
  const [assessment, setAssessment] =
    useState<ContextUseReviewAssessmentV01>("not_applicable");
  const [correctionSummaries, setCorrectionSummaries] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<MetricInputStateV01>(EMPTY_METRICS);
  const [notesText, setNotesText] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [readStatus, setReadStatus] = useState<
    "loading" | "none" | "loaded" | "error"
  >("loading");
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [result, setResult] = useState<ContextUseReviewDisplayV01 | null>(null);

  const normalizedCorrections = useMemo(
    () => correctionSummaries.map((summary) => summary.trim()).sort(),
    [correctionSummaries],
  );
  const correctionsValid =
    normalizedCorrections.length <= MAX_CORRECTIONS &&
    normalizedCorrections.every(
      (summary) =>
        summary.length > 0 && summary.length <= MAX_SUMMARY_CHARACTERS,
    ) &&
    new Set(normalizedCorrections).size === normalizedCorrections.length;
  const parsedMetrics = parseMetrics(metrics);
  const notes = notesText.trim().length > 0 ? [notesText.trim()] : [];
  const notesValid =
    notesText.length <= MAX_SUMMARY_CHARACTERS &&
    notes.every((note) => note.length <= MAX_SUMMARY_CHARACTERS);
  const affirmativeUse = actuallyUsed === "yes" || actuallyUsed === "partial";
  const usageCoherent =
    (!affirmativeUse || presented === "yes") &&
    (assessment !== "helpful" || affirmativeUse) &&
    (parsedMetrics?.context_refs_used_count === null ||
      parsedMetrics?.context_refs_used_count === 0 ||
      affirmativeUse);
  const ready =
    correctionsValid &&
    parsedMetrics !== null &&
    notesValid &&
    usageCoherent &&
    acknowledged &&
    !busy;

  useEffect(() => {
    const controller = new AbortController();
    async function loadPersistedReview(): Promise<void> {
      setReadStatus("loading");
      setResult(null);
      setErrorCode(null);
      try {
        const response = await fetch(
          `${CONTEXT_USE_REVIEW_ROUTE}?${new URLSearchParams({
            later_task_run_receipt_id: laterTaskReceipt.receipt_id,
            later_task_run_receipt_fingerprint:
              laterTaskReceipt.integrity.fingerprint,
          }).toString()}`,
          {
            method: "GET",
            cache: "no-store",
            credentials: "same-origin",
            signal: controller.signal,
          },
        );
        const body = (await response.json()) as
          ContextUseReviewReadResponseV01 | { error_code?: unknown };
        const code = publicErrorCode(body);
        if (
          response.status === 404 &&
          code === "operator_pilot_context_use_review_missing"
        ) {
          setReadStatus("none");
          return;
        }
        if (
          response.status === 401 ||
          response.status === 403 ||
          (response.status === 404 && code === "not_found")
        ) {
          onSessionInvalid(code ?? "operator_session_invalid");
          return;
        }
        if (!response.ok) {
          setReadStatus("error");
          setErrorCode(code ?? "context_use_review_read_failed");
          return;
        }
        if (
          !("status" in body) ||
          !("ok" in body) ||
          body.ok !== true ||
          body.status !== "context_use_review" ||
          !contextUseReviewResponseMatchesSource(
            body,
            handoff,
            laterTaskReceipt,
          )
        ) {
          setReadStatus("error");
          setErrorCode("context_use_review_read_response_invalid");
          return;
        }
        setResult(body);
        setReadStatus("loaded");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        setReadStatus("error");
        setErrorCode("context_use_review_read_failed");
      }
    }
    void loadPersistedReview();
    return () => controller.abort();
  }, [handoff, laterTaskReceipt, onSessionInvalid]);

  function addCorrection(): void {
    if (correctionSummaries.length >= MAX_CORRECTIONS || busy) return;
    setCorrectionSummaries((current) => [...current, ""]);
    setAcknowledged(false);
    setErrorCode(null);
  }

  function updateCorrection(index: number, value: string): void {
    setCorrectionSummaries((current) =>
      current.map((summary, itemIndex) =>
        itemIndex === index ? value : summary,
      ),
    );
    setAcknowledged(false);
    setErrorCode(null);
  }

  function removeCorrection(index: number): void {
    setCorrectionSummaries((current) =>
      current.filter((_, itemIndex) => itemIndex !== index),
    );
    setAcknowledged(false);
    setErrorCode(null);
  }

  async function submitReview(): Promise<void> {
    if (!ready || !parsedMetrics || !tryBeginOperatorMutation()) return;
    setBusy(true);
    setErrorCode(null);
    const requestReview = {
      usage: { presented, actually_used: actuallyUsed },
      assessment,
      corrections: {
        correction_count: normalizedCorrections.length,
        summaries: normalizedCorrections,
      },
      metrics: parsedMetrics,
      notes,
    };
    try {
      const requestText = JSON.stringify({
        later_packet_id: handoff.packet.packet_id,
        later_packet_fingerprint: handoff.packet.packet_fingerprint,
        transition_receipt_id:
          handoff.source_transition_receipt.transition_receipt_id,
        transition_receipt_fingerprint:
          handoff.source_transition_receipt.transition_receipt_fingerprint,
        later_task_run_receipt_id: laterTaskReceipt.receipt_id,
        later_task_run_receipt_fingerprint:
          laterTaskReceipt.integrity.fingerprint,
        ...requestReview,
      });
      if (
        new TextEncoder().encode(requestText).byteLength >
        MAX_OPERATOR_BODY_BYTES
      ) {
        setErrorCode("context_use_review_request_body_bound_exceeded");
        return;
      }
      const response = await fetch(CONTEXT_USE_REVIEW_ROUTE, {
        method: "POST",
        cache: "no-store",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: requestText,
      });
      const body = (await response.json()) as
        ContextUseReviewWriteResponseV01 | { error_code?: unknown };
      if (response.status === 401 || response.status === 403) {
        onSessionInvalid(publicErrorCode(body) ?? "operator_session_invalid");
        return;
      }
      if (!response.ok) {
        setErrorCode(
          publicErrorCode(body) ?? "context_use_review_write_failed",
        );
        return;
      }
      if (
        !("review" in body) ||
        body.ok !== true ||
        (body.status !== "inserted" && body.status !== "exact_replay") ||
        !contextUseReviewResponseMatchesSource(
          body,
          handoff,
          laterTaskReceipt,
        ) ||
        !sameReviewInput(body.review, requestReview)
      ) {
        setErrorCode("context_use_review_write_response_invalid");
        return;
      }
      setResult(body);
      setReadStatus("loaded");
      setCorrectionSummaries([]);
      setMetrics(EMPTY_METRICS);
      setNotesText("");
      setAcknowledged(false);
    } catch {
      setErrorCode("context_use_review_write_failed");
    } finally {
      setBusy(false);
      endOperatorMutation();
    }
  }

  return (
    <section
      className={styles.panel}
      data-vnext-context-use-review="v0.1"
      data-vnext-context-use-review-source="persisted_later_result"
      data-vnext-context-use-review-status={
        result?.status ?? (busy ? "submitting" : "idle")
      }
      data-vnext-context-use-review-persisted-read={readStatus}
      data-vnext-context-use-review-native-post="false"
      aria-labelledby="context-use-review-title"
    >
      <div className={styles.panelHeader}>
        <p className={styles.kicker}>Context usefulness review</p>
        <h2 id="context-use-review-title">Review reported context use</h2>
        <p className={styles.copy}>
          Record one bounded user declaration after the exact later-task
          RunReceipt. The local possession-authenticated session binds this
          request to the configured operator, but it does not prove external,
          legal, operating-system, or organization identity.
        </p>
      </div>

      <div className={styles.exactValue}>
        <strong>Exact source bindings</strong>
        <span className={styles.identifier}>
          Packet {handoff.packet.packet_id} /{" "}
          {handoff.packet.packet_fingerprint}
        </span>
        <span className={styles.identifier}>
          Transition {handoff.source_transition_receipt.transition_receipt_id} /{" "}
          {handoff.source_transition_receipt.transition_receipt_fingerprint}
        </span>
        <span className={styles.identifier}>
          Later result {laterTaskReceipt.receipt_id} /{" "}
          {laterTaskReceipt.integrity.fingerprint}
        </span>
      </div>

      <div className={styles.reviewFieldGrid}>
        <label className={styles.fieldLabel}>
          Packet presented
          <select
            className={styles.selectControl}
            value={presented}
            disabled={busy}
            onChange={(event) => {
              setPresented(event.target.value as ContextUseReviewPresentedV01);
              setAcknowledged(false);
            }}
          >
            <option value="unknown">Unknown</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </label>
        <label className={styles.fieldLabel}>
          Actually used
          <select
            className={styles.selectControl}
            value={actuallyUsed}
            disabled={busy}
            onChange={(event) => {
              setActuallyUsed(
                event.target.value as ContextUseReviewActuallyUsedV01,
              );
              setAcknowledged(false);
            }}
          >
            <option value="unknown">Unknown</option>
            <option value="yes">Yes</option>
            <option value="partial">Partial</option>
            <option value="no">No</option>
          </select>
        </label>
        <label className={styles.fieldLabel}>
          Assessment
          <select
            className={styles.selectControl}
            value={assessment}
            disabled={busy}
            onChange={(event) => {
              setAssessment(
                event.target.value as ContextUseReviewAssessmentV01,
              );
              setAcknowledged(false);
            }}
          >
            <option value="not_applicable">Not applicable</option>
            <option value="helpful">Helpful</option>
            <option value="stale">Stale</option>
            <option value="misleading">Misleading</option>
            <option value="missing">Missing</option>
            <option value="noisy">Noisy</option>
          </select>
        </label>
      </div>

      <section
        className={styles.materialCard}
        aria-labelledby="context-corrections-title"
      >
        <div className={styles.rowBetween}>
          <div>
            <h3 id="context-corrections-title">Bounded corrections</h3>
            <p className={styles.muted}>
              Optional review summaries only. They do not create a correction
              proposal.
            </p>
          </div>
          <button
            className={styles.secondaryButton}
            type="button"
            data-vnext-context-use-review-action="add_correction"
            disabled={busy || correctionSummaries.length >= MAX_CORRECTIONS}
            onClick={addCorrection}
          >
            Add correction
          </button>
        </div>
        {correctionSummaries.length === 0 ? (
          <p className={styles.empty}>No correction summary supplied.</p>
        ) : (
          <ol className={styles.correctionList}>
            {correctionSummaries.map((summary, index) => (
              <li key={index}>
                <label className={styles.fieldLabel}>
                  Correction {index + 1}
                  <textarea
                    maxLength={MAX_SUMMARY_CHARACTERS}
                    value={summary}
                    disabled={busy}
                    onChange={(event) =>
                      updateCorrection(index, event.target.value)
                    }
                  />
                </label>
                <button
                  className={styles.secondaryButton}
                  type="button"
                  disabled={busy}
                  onClick={() => removeCorrection(index)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section
        className={styles.materialCard}
        aria-labelledby="context-metrics-title"
      >
        <h3 id="context-metrics-title">Optional review metrics</h3>
        <div className={styles.reviewMetricGrid}>
          {(
            [
              ["wrong_context_correction_count", "Wrong-context corrections"],
              [
                "repeated_explanation_estimate",
                "Repeated explanation estimate",
              ],
              ["missing_critical_context_count", "Missing critical context"],
              ["context_refs_used_count", "Context refs used"],
            ] as const
          ).map(([key, label]) => (
            <label className={styles.fieldLabel} key={key}>
              {label}
              <input
                className={styles.numberControl}
                type="number"
                min={0}
                max={MAX_METRIC_VALUE}
                step={1}
                inputMode="numeric"
                value={metrics[key]}
                disabled={busy}
                onChange={(event) => {
                  setMetrics((current) => ({
                    ...current,
                    [key]: event.target.value,
                  }));
                  setAcknowledged(false);
                }}
              />
            </label>
          ))}
        </div>
      </section>

      <label className={styles.fieldLabel}>
        Optional bounded note
        <textarea
          className={styles.reviewNotes}
          maxLength={MAX_SUMMARY_CHARACTERS}
          value={notesText}
          disabled={busy}
          onChange={(event) => {
            setNotesText(event.target.value);
            setAcknowledged(false);
          }}
        />
      </label>

      <label className={styles.checkRow}>
        <input
          type="checkbox"
          checked={acknowledged}
          disabled={busy}
          onChange={(event) => setAcknowledged(event.target.checked)}
        />
        <span>
          This review is my user declaration. The local session is not external
          identity proof. “Helpful” is not Outcome Improvement. A stale,
          misleading, missing, noisy, or otherwise negative review does not
          retract state, mutate Perspective or memory, create a proposal or
          Evidence, close work, or change context.
        </span>
      </label>

      {!correctionsValid ||
      parsedMetrics === null ||
      !notesValid ||
      !usageCoherent ? (
        <p className={styles.error} role="alert">
          context_use_review_input_invalid
        </p>
      ) : null}
      {errorCode ? (
        <p
          className={styles.error}
          role="alert"
          data-vnext-context-use-review-error={errorCode}
        >
          {errorCode}
        </p>
      ) : null}
      {readStatus === "loading" ? (
        <p className={styles.muted} role="status">
          Checking for an existing review of this exact later result…
        </p>
      ) : readStatus === "none" ? (
        <p className={styles.empty}>
          No persisted ContextUseReview exists yet.
        </p>
      ) : null}

      <button
        className={styles.button}
        type="button"
        data-vnext-context-use-review-action="submit"
        disabled={!ready}
        onClick={() => void submitReview()}
      >
        {busy ? "Recording review…" : "Record ContextUseReview"}
      </button>

      {result ? <ContextUseReviewReadout result={result} /> : null}

      <p className={styles.notice}>
        This immutable review is evaluation material only. It is not Evidence,
        semantic state, a ReviewDecision, transition, work closure, automatic
        rollback, memory promotion, correction proposal, or provider/external
        authority.
      </p>
    </section>
  );
}

function ContextUseReviewReadout({
  result,
}: {
  result: ContextUseReviewDisplayV01;
}) {
  const review = result.review;
  return (
    <section
      className={styles.materialCard}
      data-vnext-context-use-review-record={result.status}
      data-vnext-context-use-review-helpful-is-outcome="false"
      aria-labelledby="context-use-review-record-title"
    >
      <h3 id="context-use-review-record-title">Persisted ContextUseReview</h3>
      <ExactValue label="Review ID" value={review.review_id} />
      <ExactValue
        label="Review fingerprint"
        value={review.integrity.fingerprint}
      />
      <dl className={styles.statusGrid}>
        <DataPoint label="Read/write status" value={result.status} />
        <DataPoint label="Reviewed" value={review.reviewed_at} />
        <DataPoint label="Presented" value={review.usage.presented} />
        <DataPoint label="Actually used" value={review.usage.actually_used} />
        <DataPoint label="Assessment" value={review.assessment} />
        <DataPoint
          label="Corrections"
          value={String(review.corrections.correction_count)}
        />
        <DataPoint
          label="Reviewer trust"
          value={review.reviewer_ref.trust_class}
        />
        <DataPoint
          label="Local auth basis refs"
          value={String(review.reviewer_authentication_basis_refs.length)}
        />
      </dl>
      <p className={styles.notice}>
        Reviewer material is a user declaration. Local session binding is
        separate direct-local evidence of secret possession, not authentication
        of external or legal identity. Assessment “helpful” does not establish
        Outcome Improvement.
      </p>
      {review.corrections.summaries.length > 0 ? (
        <TextList
          title="Recorded correction summaries"
          items={review.corrections.summaries}
        />
      ) : null}
      {review.notes.length > 0 ? (
        <TextList title="Recorded notes" items={review.notes} />
      ) : null}
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

function ExactValue({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.exactValue}>
      <strong>{label}</strong>
      <span className={styles.identifier}>{value}</span>
    </div>
  );
}

function TextList({ title, items }: { title: string; items: string[] }) {
  return (
    <section className={styles.materialCard} aria-label={title}>
      <h3>{title}</h3>
      <ul className={styles.plainList}>
        {items.map((item, index) => (
          <li key={`${index}:${item}`}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

function parseMetrics(
  input: MetricInputStateV01,
): ContextUseReviewMetricsV01 | null {
  const output = {} as ContextUseReviewMetricsV01;
  for (const key of Object.keys(input) as MetricInputKeyV01[]) {
    const raw = input[key];
    if (raw === "") {
      output[key] = null;
      continue;
    }
    const value = Number(raw);
    if (!Number.isSafeInteger(value) || value < 0 || value > MAX_METRIC_VALUE) {
      return null;
    }
    output[key] = value;
  }
  return output;
}

function contextUseReviewResponseMatchesSource(
  value: ContextUseReviewRouteFieldsV01,
  handoff: VNextOperatorPilotPacketHandoffV01,
  laterTaskReceipt: RunReceiptV01,
): boolean {
  const review = value.review;
  return (
    review.review_version === "context_use_review.v0.1" &&
    value.review_version === review.review_version &&
    value.workspace_id === handoff.workspace_id &&
    value.project_id === handoff.project_id &&
    review.workspace_id === handoff.workspace_id &&
    review.project_id === handoff.project_id &&
    review.prior_packet.packet_version === "task_context_packet.v0.1" &&
    review.later_packet.packet_version === "task_context_packet.v0.1" &&
    review.later_packet.packet_id === handoff.packet.packet_id &&
    review.later_packet.packet_fingerprint ===
      handoff.packet.packet_fingerprint &&
    review.source_transition_receipt.transition_receipt_id ===
      handoff.source_transition_receipt.transition_receipt_id &&
    review.source_transition_receipt.transition_receipt_version ===
      "state_transition_receipt.v0.1" &&
    review.source_transition_receipt.transition_receipt_fingerprint ===
      handoff.source_transition_receipt.transition_receipt_fingerprint &&
    review.later_task_run_receipt.receipt_id === laterTaskReceipt.receipt_id &&
    review.later_task_run_receipt.receipt_version ===
      laterTaskReceipt.receipt_version &&
    review.later_task_run_receipt.receipt_fingerprint ===
      laterTaskReceipt.integrity.fingerprint &&
    review.review_id.length > 0 &&
    /^sha256:[a-f0-9]{64}$/.test(review.integrity.fingerprint) &&
    review.prior_packet.packet_id.length > 0 &&
    /^sha256:[a-f0-9]{64}$/.test(review.prior_packet.packet_fingerprint) &&
    review.reviewer_ref.trust_class === "user_declaration" &&
    review.reviewer_authentication_basis_refs.length > 0 &&
    review.reviewer_authentication_basis_refs.every(
      (ref) => ref.trust_class === "direct_local_observation",
    ) &&
    value.relation.prior_later_transition_exact === true &&
    value.relation.later_result_exact === true &&
    value.relation.reviewer_session_bound === true &&
    value.correction_proposal_created === false &&
    value.semantic_state_mutated === false &&
    value.transition_created === false &&
    value.evidence_accepted === false &&
    value.perspective_mutated === false &&
    value.memory_promoted === false &&
    value.work_closed === false &&
    value.automatic_context_change === false &&
    value.authentication_boundary ===
      "local_secret_possession_only_not_external_identity" &&
    value.semantic_authority_granted === false &&
    contextUseReviewAuthorityIsBounded(review)
  );
}

function contextUseReviewAuthorityIsBounded(
  review: ContextUseReviewV01,
): boolean {
  const summary = review.authority_summary;
  const expectedKeys = new Set<string>([
    "record_represents_context_use_review",
    "notes",
    ...FALSE_AUTHORITY_KEYS,
  ]);
  const actualKeys = Object.keys(summary);
  return (
    actualKeys.length === expectedKeys.size &&
    actualKeys.every((key) => expectedKeys.has(key)) &&
    summary.record_represents_context_use_review === true &&
    FALSE_AUTHORITY_KEYS.every((key) => summary[key] === false) &&
    Array.isArray(summary.notes) &&
    summary.notes.length <= MAX_RESPONSE_COLLECTION_ITEMS &&
    summary.notes.every(
      (note) =>
        typeof note === "string" &&
        note.length > 0 &&
        note.length <= MAX_SUMMARY_CHARACTERS,
    )
  );
}

function sameReviewInput(
  review: ContextUseReviewV01,
  input: {
    usage: ContextUseReviewV01["usage"];
    assessment: ContextUseReviewV01["assessment"];
    corrections: ContextUseReviewV01["corrections"];
    metrics: ContextUseReviewV01["metrics"];
    notes: string[];
  },
): boolean {
  return (
    review.usage.presented === input.usage.presented &&
    review.usage.actually_used === input.usage.actually_used &&
    review.assessment === input.assessment &&
    review.corrections.correction_count ===
      input.corrections.correction_count &&
    sameStringSet(review.corrections.summaries, input.corrections.summaries) &&
    Object.keys(input.metrics).every(
      (key) =>
        review.metrics[key as MetricInputKeyV01] ===
        input.metrics[key as MetricInputKeyV01],
    ) &&
    sameStringSet(review.notes, input.notes)
  );
}

function sameStringSet(left: string[], right: string[]): boolean {
  const sortedLeft = [...left].sort();
  const sortedRight = [...right].sort();
  return (
    sortedLeft.length === sortedRight.length &&
    sortedLeft.every((value, index) => value === sortedRight[index])
  );
}

function publicErrorCode(value: unknown): string | null {
  const candidate =
    value && typeof value === "object" && "error_code" in value
      ? value.error_code
      : null;
  return typeof candidate === "string" && /^[a-z0-9_:-]{1,96}$/.test(candidate)
    ? candidate
    : null;
}
