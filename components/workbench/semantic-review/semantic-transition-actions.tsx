"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { ReviewDecisionV01 } from "@/types/vnext/review-decision";
import type { StateTransitionReceiptV01 } from "@/types/vnext/state-transition-receipt";

import type {
  SemanticTransitionApplyRouteResponseV01,
  SemanticTransitionConfirmationRouteResponseV01,
  SemanticTransitionPreviewRouteResponseV01,
  SemanticTransitionRouteErrorV01,
} from "./semantic-review-types";
import styles from "./semantic-review.module.css";

const SEMANTIC_TRANSITION_ROUTE =
  "/api/vnext/operator/semantic-transition";

type TransitionStepV01 = "preview" | "confirm" | "apply";

export interface SemanticTransitionPriorPacketBindingV01 {
  packet_id: string;
  packet_fingerprint: string;
}

export function SemanticTransitionActions({
  proposalId,
  proposalFingerprint,
  selectedCandidateId,
  decisions,
  persistedReceipts,
  priorPacket,
  onSessionInvalid,
  onPrivateMaterialChanged,
  tryBeginOperatorMutation,
  endOperatorMutation,
}: {
  proposalId: string;
  proposalFingerprint: string;
  selectedCandidateId?: string;
  decisions: ReviewDecisionV01[];
  persistedReceipts: StateTransitionReceiptV01[];
  priorPacket: SemanticTransitionPriorPacketBindingV01 | null;
  onSessionInvalid: (errorCode: string) => void;
  onPrivateMaterialChanged: () => Promise<void>;
  tryBeginOperatorMutation: () => boolean;
  endOperatorMutation: () => void;
}) {
  const applyingDecisions = useMemo(
    () =>
      decisions.filter(
        (decision) =>
          (!selectedCandidateId ||
            decision.candidate.candidate_id === selectedCandidateId) &&
          (decision.decision === "accept" ||
            decision.decision === "supersede" ||
            decision.decision === "retract") &&
          decision.requested_transition_intent !== null &&
          decision.requested_transition_intent.applied === false,
      ),
    [decisions, selectedCandidateId],
  );
  const [selectedDecisionId, setSelectedDecisionId] = useState(
    applyingDecisions.at(-1)?.decision_id ?? "",
  );
  const selectedDecision =
    applyingDecisions.find(
      (decision) => decision.decision_id === selectedDecisionId,
    ) ?? applyingDecisions.at(-1) ?? null;
  const persistedReceiptForSelectedDecision = selectedDecision
    ? persistedReceipts
        .filter(
          (receipt) =>
            receipt.source_decision.decision_id === selectedDecision.decision_id &&
            receipt.source_decision.decision_fingerprint ===
              selectedDecision.integrity.fingerprint,
        )
        .at(-1) ?? null
    : null;
  const [previewResponse, setPreviewResponse] =
    useState<SemanticTransitionPreviewRouteResponseV01 | null>(null);
  const [confirmationResponse, setConfirmationResponse] =
    useState<SemanticTransitionConfirmationRouteResponseV01 | null>(null);
  const [applyResponse, setApplyResponse] =
    useState<SemanticTransitionApplyRouteResponseV01 | null>(null);
  const [previewReviewed, setPreviewReviewed] = useState(false);
  const [gateReviewed, setGateReviewed] = useState(false);
  const [busyStep, setBusyStep] = useState<TransitionStepV01 | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const requestInFlight = useRef(false);

  useEffect(() => {
    if (!selectedDecision && applyingDecisions.length > 0) {
      setSelectedDecisionId(applyingDecisions.at(-1)?.decision_id ?? "");
    }
  }, [applyingDecisions, selectedDecision]);

  function resetDerivedSteps(): void {
    setPreviewResponse(null);
    setConfirmationResponse(null);
    setApplyResponse(null);
    setPreviewReviewed(false);
    setGateReviewed(false);
    setErrorCode(null);
    setStatusMessage(null);
  }

  async function preparePreview(): Promise<void> {
    if (!selectedDecision || requestInFlight.current) return;
    requestInFlight.current = true;
    setBusyStep("preview");
    setErrorCode(null);
    setStatusMessage(null);
    setPreviewReviewed(false);
    setConfirmationResponse(null);
    setApplyResponse(null);
    setGateReviewed(false);
    try {
      const query = new URLSearchParams({
        proposal_id: proposalId,
        proposal_fingerprint: proposalFingerprint,
        decision_id: selectedDecision.decision_id,
        decision_fingerprint: selectedDecision.integrity.fingerprint,
      });
      const response = await fetch(`${SEMANTIC_TRANSITION_ROUTE}?${query}`, {
        method: "GET",
        cache: "no-store",
        credentials: "same-origin",
      });
      const body = (await response.json()) as
        | SemanticTransitionPreviewRouteResponseV01
        | SemanticTransitionRouteErrorV01;
      if (!response.ok) {
        handleRouteError(response.status, body);
        return;
      }
      if (
        body.status !== "preview" ||
        !("preview" in body) ||
        body.preview_is_write !== false ||
        body.preview.proposal_id !== proposalId ||
        body.preview.proposal_fingerprint !== proposalFingerprint ||
        body.preview.decision_id !== selectedDecision.decision_id ||
        body.preview.decision_fingerprint !==
          selectedDecision.integrity.fingerprint ||
        body.preview.candidate_id !== selectedDecision.candidate.candidate_id ||
        body.preview.candidate_fingerprint !==
          selectedDecision.candidate.candidate_fingerprint ||
        body.preview.intent_id !==
          selectedDecision.requested_transition_intent?.intent_id ||
        body.pilot_policy.operation_aware !== true ||
        body.pilot_policy.atomic_transition_and_packet_supported !== true ||
        !(["create", "replace", "supersede", "retract"] as const).includes(
          body.pilot_policy.candidate_operation,
        ) ||
        body.pilot_policy.current_state_required !==
          (body.pilot_policy.candidate_operation === "create"
            ? "absent"
            : "present") ||
        body.pilot_policy.authorized_applier_derived_by_server !== true ||
        body.pilot_policy.review_window_config_version !==
          "vnext_operator_pilot_review_window_config.v0.1" ||
        !Number.isSafeInteger(body.pilot_policy.preview_max_age_ms) ||
        !(["default", "explicit_environment"] as const).includes(
          body.pilot_policy.preview_source,
        ) ||
        !(["default", "explicit_environment"] as const).includes(
          body.pilot_policy.gate_source,
        ) ||
        body.pilot_policy.gate_ttl_ms !== body.preview.gate_ttl_ms ||
        Date.parse(body.pilot_policy.preview_binding_expires_at) !==
          Date.parse(body.preview.previewed_at) +
            body.pilot_policy.preview_max_age_ms ||
        !isSha256Fingerprint(body.preview.confirmation_digest)
      ) {
        setErrorCode("semantic_transition_preview_response_invalid");
        return;
      }
      setPreviewResponse(body);
      setStatusMessage(
        "Fresh preview prepared from persisted state. The preview wrote nothing.",
      );
    } catch {
      setErrorCode("semantic_transition_preview_request_failed");
    } finally {
      requestInFlight.current = false;
      setBusyStep(null);
    }
  }

  async function confirmGate(): Promise<void> {
    if (
      !selectedDecision ||
      !previewResponse ||
      !previewReviewed ||
      requestInFlight.current ||
      !tryBeginOperatorMutation()
    ) {
      return;
    }
    requestInFlight.current = true;
    setBusyStep("confirm");
    setErrorCode(null);
    setStatusMessage(null);
    setConfirmationResponse(null);
    setApplyResponse(null);
    setGateReviewed(false);
    try {
      const response = await fetch(SEMANTIC_TRANSITION_ROUTE, {
        method: "POST",
        cache: "no-store",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "confirm",
          proposal_id: proposalId,
          proposal_fingerprint: proposalFingerprint,
          decision_id: selectedDecision.decision_id,
          decision_fingerprint: selectedDecision.integrity.fingerprint,
          confirmation_digest: previewResponse.preview.confirmation_digest,
        }),
      });
      const body = (await response.json()) as
        | SemanticTransitionConfirmationRouteResponseV01
        | SemanticTransitionRouteErrorV01;
      if (!response.ok) {
        handleRouteError(response.status, body);
        return;
      }
      if (
        !("gate_record" in body) ||
        !("eligibility_status" in body) ||
        !("eligibility" in body) ||
        body.state_applied !== false ||
        body.eligibility_status !== "eligible" ||
        body.eligibility.status !== "eligible" ||
        body.gate_record.proposal_id !== proposalId ||
        body.gate_record.proposal_fingerprint !== proposalFingerprint ||
        body.gate_record.decision_id !== selectedDecision.decision_id ||
        body.gate_record.decision_fingerprint !==
          selectedDecision.integrity.fingerprint ||
        body.gate_record.candidate_id !== selectedDecision.candidate.candidate_id ||
        body.gate_record.candidate_fingerprint !==
          selectedDecision.candidate.candidate_fingerprint ||
        body.gate_record.confirmation_digest !==
          previewResponse.preview.confirmation_digest
      ) {
        setErrorCode("semantic_transition_confirmation_response_invalid");
        return;
      }
      setConfirmationResponse(body);
      setStatusMessage(
        body.status === "exact_replay"
          ? "Exact gate replay returned the existing gate. No semantic state was applied."
          : "Confirmation persisted the semantic gate only. No semantic state was applied.",
      );
      await onPrivateMaterialChanged();
    } catch {
      setErrorCode("semantic_transition_confirmation_request_failed");
    } finally {
      requestInFlight.current = false;
      endOperatorMutation();
      setBusyStep(null);
    }
  }

  async function applyTransitionAndCompile(): Promise<void> {
    if (
      !selectedDecision ||
      !confirmationResponse ||
      !priorPacket ||
      !gateReviewed ||
      requestInFlight.current ||
      !tryBeginOperatorMutation()
    ) {
      return;
    }
    requestInFlight.current = true;
    setBusyStep("apply");
    setErrorCode(null);
    setStatusMessage(null);
    setApplyResponse(null);
    try {
      const gate = confirmationResponse.gate_record;
      const response = await fetch(SEMANTIC_TRANSITION_ROUTE, {
        method: "POST",
        cache: "no-store",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "apply",
          proposal_id: proposalId,
          proposal_fingerprint: proposalFingerprint,
          decision_id: selectedDecision.decision_id,
          decision_fingerprint: selectedDecision.integrity.fingerprint,
          gate_record_id: gate.gate_record_id,
          gate_record_fingerprint: gate.integrity.fingerprint,
          prior_packet_id: priorPacket.packet_id,
          prior_packet_fingerprint: priorPacket.packet_fingerprint,
        }),
      });
      const body = (await response.json()) as
        | SemanticTransitionApplyRouteResponseV01
        | SemanticTransitionRouteErrorV01;
      if (!response.ok) {
        handleRouteError(response.status, body);
        return;
      }
      if (
        !("transition_receipt" in body) ||
        !("later_packet" in body) ||
        !("eligibility_status" in body) ||
        !("eligibility" in body) ||
        body.packet_compiled !== true ||
        body.eligibility_status !== "eligible" ||
        body.eligibility.status !== "eligible" ||
        body.transition_receipt.source_proposal.proposal_id !== proposalId ||
        body.transition_receipt.source_proposal.proposal_fingerprint !==
          proposalFingerprint ||
        body.transition_receipt.source_decision.decision_id !==
          selectedDecision.decision_id ||
        body.transition_receipt.source_decision.decision_fingerprint !==
          selectedDecision.integrity.fingerprint ||
        body.transition_receipt.source_candidate.candidate_id !==
          selectedDecision.candidate.candidate_id ||
        body.transition_receipt.source_candidate.candidate_fingerprint !==
          selectedDecision.candidate.candidate_fingerprint ||
        body.transition_receipt.requested_transition_intent.intent_id !==
          selectedDecision.requested_transition_intent?.intent_id
      ) {
        setErrorCode("semantic_transition_apply_response_invalid");
        return;
      }
      setApplyResponse(body);
      setStatusMessage(
        body.status === "exact_replay"
          ? "Exact replay returned the persisted Transition receipt and later packet."
          : "The exact semantic effects, StateTransitionReceipt, and later packet were committed atomically.",
      );
      await onPrivateMaterialChanged();
    } catch {
      setErrorCode("semantic_transition_apply_request_failed");
    } finally {
      requestInFlight.current = false;
      endOperatorMutation();
      setBusyStep(null);
    }
  }

  function handleRouteError(
    responseStatus: number,
    body: unknown,
  ): void {
    const code = publicErrorCode(
      body && typeof body === "object" && "error_code" in body
        ? body.error_code
        : null,
    );
    if (responseStatus === 401 || responseStatus === 403) {
      onSessionInvalid(code);
      return;
    }
    setErrorCode(code);
  }

  const preview = previewResponse?.preview ?? null;
  const gate = confirmationResponse?.gate_record ?? null;
  const receipt =
    applyResponse?.transition_receipt ?? persistedReceiptForSelectedDecision;
  const laterPacket = applyResponse?.later_packet ?? null;
  const allBusy = busyStep !== null;

  return (
    <section
      className={styles.panel}
      data-vnext-semantic-transition-actions="v0.1"
      data-vnext-local-authentication="secret-possession-not-external-identity"
      aria-labelledby="semantic-transition-actions-title"
    >
      <div className={styles.panelHeader}>
        <p className={styles.kicker}>Explicit semantic transition boundary</p>
        <h2 id="semantic-transition-actions-title">
          Preview consequence, authorize the gate, then apply
        </h2>
        <p className={styles.copy}>
          These controls act only on the selected candidate and its exact accepted
          decision. Preview writes nothing. Gate authorization still applies no state.
          Only the final successful Transition changes durable semantic state and
          compiles later context.
        </p>
      </div>

      <p
        className={styles.notice}
        data-vnext-transition-pilot-policy="operation_aware_atomic_transition_packet"
      >
        Add, revise, supersede, and retract candidates map to bounded existing
        effects. Unknown and no-change remain blocked. The server rechecks current
        head, lineage, authorization, and consequence inside the write transaction.
      </p>

      {applyingDecisions.length === 0 ? (
        <p className={styles.empty} data-vnext-transition-actions-status="awaiting_accept">
          Record the eligible applying ReviewDecision before preparing a transition preview.
          Reject and defer decisions do not enter this commit path.
        </p>
      ) : (
        <label className={styles.fieldLabel}>
          Applying decision for the selected candidate
          <select
            className={styles.selectControl}
            value={selectedDecision?.decision_id ?? ""}
            disabled={allBusy}
            onChange={(event) => {
              setSelectedDecisionId(event.target.value);
              resetDerivedSteps();
            }}
          >
            {applyingDecisions.map((decision) => (
              <option
                key={`${decision.decision_id}:${decision.integrity.fingerprint}`}
                value={decision.decision_id}
              >
                {decision.decision.replaceAll("_", " ")} recorded {decision.decided_at}
              </option>
            ))}
          </select>
        </label>
      )}

      {selectedDecision ? (
        <details className={styles.disclosure}>
          <summary>Exact accepted decision and intent binding</summary>
          <span className={styles.identifier}>{selectedDecision.decision_id}</span>
          <span className={styles.identifier}>{selectedDecision.integrity.fingerprint}</span>
          <span className={styles.identifier}>
            {selectedDecision.requested_transition_intent?.intent_id}
          </span>
          <span className={styles.muted}>
            Exact target count {selectedDecision.requested_transition_intent?.target_refs.length ?? 0}
          </span>
        </details>
      ) : null}

      {errorCode ? (
        <p className={styles.error} role="alert" data-vnext-transition-error={errorCode}>
          {errorCode}
        </p>
      ) : null}
      {statusMessage ? (
        <p className={styles.success} role="status">
          {statusMessage}
        </p>
      ) : null}

      <div className={styles.transitionSteps}>
        <section
          className={styles.transitionStep}
          data-vnext-transition-step="preview"
          data-vnext-transition-step-status={preview ? "prepared" : "not_prepared"}
          data-vnext-transition-preview-write="false"
        >
          <StepHeader number="1" title="Read-only preview" />
          <p className={styles.copy}>
            The server reloads the selected proposal, decision, current head, and
            state to describe the intended consequence and any blockers. This
            action writes nothing.
          </p>
          <button
            className={styles.secondaryButton}
            type="button"
            data-vnext-transition-action="preview"
            disabled={!selectedDecision || allBusy}
            onClick={() => void preparePreview()}
          >
            {busyStep === "preview" ? "Preparing…" : "Prepare fresh preview"}
          </button>
          {preview ? (
            <>
              <dl className={styles.statusGrid}>
                <DataPoint label="Previewed" value={preview.previewed_at} />
                <DataPoint label="Transition kind" value={preview.transition_kind} />
                <DataPoint
                  label="Preview valid until"
                  value={
                    previewResponse?.pilot_policy.preview_binding_expires_at ??
                    "unknown"
                  }
                />
                <DataPoint label="State changed" value="no" />
              </dl>
              <EffectList effects={preview.intended_effects} />
              <details className={styles.disclosure}>
                <summary>Exact preview authorization binding</summary>
                <ExactValue label="Confirmation digest" value={preview.confirmation_digest} />
                <ExactValue
                  label="Authorized applier"
                  value={`${preview.authorized_applier_identity.ref_type}:${preview.authorized_applier_identity.external_id}`}
                />
                <ExactValue label="Gate TTL" value={`${preview.gate_ttl_ms} ms`} />
              </details>
              <label className={styles.checkRow}>
                <input
                  type="checkbox"
                  checked={previewReviewed}
                  disabled={allBusy}
                  onChange={(event) => setPreviewReviewed(event.target.checked)}
                />
                <span>
                  I reviewed the selected target, current-state expectation,
                  intended operation, and user-visible consequence. I understand
                  this preview changed nothing.
                </span>
              </label>
            </>
          ) : null}
        </section>

        <section
          className={styles.transitionStep}
          data-vnext-transition-step="confirmation"
          data-vnext-transition-step-status={gate ? "recorded" : "not_recorded"}
          data-vnext-transition-confirm-state-applied="false"
        >
          <StepHeader number="2" title="Confirm gate only" />
          <p className={styles.copy}>
            Confirmation authorizes only the exact previewed consequence. A
            successful confirmation persists a bounded gate; it does not apply
            semantic state or later context.
          </p>
          <button
            className={styles.button}
            type="button"
            data-vnext-transition-action="confirm"
            disabled={!preview || !previewReviewed || allBusy}
            onClick={() => void confirmGate()}
          >
            {busyStep === "confirm" ? "Confirming…" : "Confirm exact gate"}
          </button>
          {gate ? (
            <>
              <dl className={styles.statusGrid}>
                <DataPoint label="Confirmed" value={gate.confirmed_at} />
                <DataPoint
                  label="Gate expires"
                  value={gate.semantic_commit_gate_evaluation.expires_at}
                />
                <DataPoint
                  label="Eligibility"
                  value={confirmationResponse?.eligibility_status ?? "unknown"}
                />
                <DataPoint
                  label="State changed"
                  value="no"
                />
              </dl>
              <details className={styles.disclosure}>
                <summary>Exact gate and precondition binding</summary>
                <ExactValue label="Gate record ID" value={gate.gate_record_id} />
                <ExactValue label="Gate fingerprint" value={gate.integrity.fingerprint} />
                <ExactValue
                  label="Eligibility precondition"
                  value={gate.eligibility_precondition_fingerprint}
                />
              </details>
              <label className={styles.checkRow}>
                <input
                  type="checkbox"
                  checked={gateReviewed}
                  disabled={allBusy}
                  onChange={(event) => setGateReviewed(event.target.checked)}
                />
                <span>
                  I reviewed the persisted authorized gate and understand the next action
                  applies durable local semantic state.
                </span>
              </label>
            </>
          ) : null}
        </section>

        <section
          className={styles.transitionStep}
          data-vnext-transition-step="apply"
          data-vnext-transition-step-status={receipt ? "applied" : "not_applied"}
          data-vnext-transition-commit-packet-compiled={String(Boolean(laterPacket))}
        >
          <StepHeader number="3" title="Apply Transition and compile later context" />
          <p className={styles.copy}>
            The server reloads current state and authorization, applies the
            bounded effect, records the immutable Transition receipt, and compiles
            later context atomically. Failure leaves the decision and gate visible
            but does not partially apply state.
          </p>
          {!priorPacket ? (
            <p className={styles.empty}>
              The exact prior TaskContextPacket binding is unavailable, so atomic
              Transition closure is blocked.
            </p>
          ) : null}
          <button
            className={styles.button}
            type="button"
            data-vnext-transition-action="apply"
            disabled={!gate || !gateReviewed || !priorPacket || allBusy}
            onClick={() => void applyTransitionAndCompile()}
          >
            {busyStep === "apply" ? "Applying…" : "Apply Transition and compile packet"}
          </button>
          {receipt ? (
            <>
              <dl className={styles.statusGrid}>
                <DataPoint label="Status" value={receipt.receipt_status} />
                <DataPoint label="Applied" value={receipt.applied_at} />
                <DataPoint label="Recorded" value={receipt.recorded_at} />
                <DataPoint label="Effects" value={String(receipt.effects.length)} />
              </dl>
              <ReceiptEffectList receipt={receipt} />
              <details className={styles.disclosure}>
                <summary>Exact applied Transition receipt</summary>
                <ExactValue
                  label="StateTransitionReceipt ID"
                  value={receipt.transition_receipt_id}
                />
                <ExactValue label="Receipt fingerprint" value={receipt.integrity.fingerprint} />
                <ExactValue label="Idempotency key" value={receipt.idempotency_key} />
              </details>
            </>
          ) : null}
        </section>

        <section
          className={styles.transitionStep}
          data-vnext-transition-step="later-packet"
          data-vnext-transition-step-status={laterPacket ? "compiled" : "not_compiled"}
          data-vnext-transition-compile-transition-applied={String(Boolean(receipt))}
        >
          <StepHeader number="4" title="Persisted later context" />
          <p className={styles.copy}>
            The later packet is selected working context from the normal persisted-state
            compiler. It launches no provider or native host and remains distinct from
            canonical semantic state.
          </p>
          {!priorPacket ? (
            <p className={styles.empty}>
              This proposal has no exact prior TaskContextPacket ID/fingerprint binding,
              so Transition closure is unavailable.
            </p>
          ) : null}
          {laterPacket ? (
            <>
              <dl className={styles.statusGrid}>
                <DataPoint label="Generated" value={laterPacket.generated_at} />
                <DataPoint
                  label="Accepted state refs"
                  value={String(
                    laterPacket.selected_context.filter(
                      (entry) => entry.entry_kind === "accepted_state_ref",
                    ).length,
                  )}
                />
                <DataPoint
                  label="Selected entries"
                  value={String(laterPacket.selected_context.length)}
                />
                <DataPoint label="Transition applied" value="true" />
              </dl>
              <AcceptedStateSelectionList packet={laterPacket} />
              <details className={styles.disclosure}>
                <summary>Exact prior packet, later packet, and Transition lineage</summary>
                <ExactValue label="Prior packet ID" value={priorPacket?.packet_id ?? "missing"} />
                <ExactValue label="Prior packet fingerprint" value={priorPacket?.packet_fingerprint ?? "missing"} />
                <ExactValue label="Later packet ID" value={laterPacket.packet_id} />
                <ExactValue label="Later packet fingerprint" value={laterPacket.integrity.fingerprint} />
                <ExactValue label="Receipt lineage ID" value={receipt?.transition_receipt_id ?? "missing"} />
                <ExactValue label="Receipt lineage fingerprint" value={receipt?.integrity.fingerprint ?? "missing"} />
              </details>
            </>
          ) : null}
        </section>
      </div>

      <p className={styles.muted}>
        These controls use client-side fetch with an in-flight mutex. Browser refresh,
        back navigation, or resubmission cannot repeat a native form POST; server-side
        nonce rotation, exact replay, expiry, current-head, and idempotency checks remain
        authoritative.
      </p>
    </section>
  );
}

function StepHeader({ number, title }: { number: string; title: string }) {
  return (
    <div className={styles.stepHeader}>
      <span className={styles.stepNumber}>{number}</span>
      <h3>{title}</h3>
    </div>
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

function EffectList({
  effects,
}: {
  effects: SemanticTransitionPreviewRouteResponseV01["preview"]["intended_effects"];
}) {
  return (
    <ol className={styles.plainList} aria-label="Exact intended transition effects">
      {effects.map((effect) => (
        <li key={`${effect.target_key}:${effect.operation}`}>
          <strong>
            {effect.operation} · current {effect.before_presence} → intended {effect.expected_after_state_fingerprint ? "present" : "absent"}
          </strong>
          <span>
            Target {effect.target_ref.ref_type.replaceAll("_", " ")} · expected revision {effect.expected_revision}
          </span>
          <details className={styles.disclosure}>
            <summary>Exact target and before/after binding</summary>
            <span className={styles.identifier}>{effect.target_ref.external_id}</span>
            <span className={styles.identifier}>{effect.target_ref.source_ref ?? "no source fingerprint"}</span>
            <span className={styles.identifier}>{effect.before_state_fingerprint ?? "absent"}</span>
            <span className={styles.identifier}>{effect.expected_after_state_fingerprint ?? "absent"}</span>
          </details>
        </li>
      ))}
    </ol>
  );
}

function AcceptedStateSelectionList({
  packet,
}: {
  packet: SemanticTransitionApplyRouteResponseV01["later_packet"];
}) {
  const entries = packet.selected_context.filter(
    (entry) => entry.entry_kind === "accepted_state_ref",
  );
  return (
    <ol className={styles.plainList} aria-label="Selected accepted semantic state">
      {entries.map((entry) => (
        <li key={entry.entry_id}>
          <strong>Accepted state included in later working context</strong>
          <span>{entry.external_ref?.ref_type.replaceAll("_", " ") ?? "unknown target"} · trust {entry.trust_class.replaceAll("_", " ")}</span>
          <details className={styles.disclosure}>
            <summary>Exact accepted-state selection</summary>
            <span className={styles.identifier}>{entry.entry_id}</span>
            <span className={styles.identifier}>{entry.external_ref?.external_id ?? "missing external ref"}</span>
            <span className={styles.identifier}>{entry.source_ref ?? "missing"}</span>
          </details>
        </li>
      ))}
    </ol>
  );
}

function ReceiptEffectList({ receipt }: { receipt: StateTransitionReceiptV01 }) {
  return (
    <ol className={styles.plainList} aria-label="Applied receipt effects">
      {receipt.effects.map((effect) => (
        <li key={effect.effect_id}>
          <strong>{effect.operation} applied</strong>
          <span>Before {effect.before_state.presence} · After {effect.after_state.presence}</span>
          <details className={styles.disclosure}>
            <summary>Exact applied effect</summary>
            <span className={styles.identifier}>{effect.effect_id}</span>
            <span className={styles.identifier}>{effect.target_ref.external_id}</span>
            <span className={styles.identifier}>{effect.before_state.state_fingerprint ?? "absent"}</span>
            <span className={styles.identifier}>{effect.after_state.state_fingerprint ?? "absent"}</span>
          </details>
        </li>
      ))}
    </ol>
  );
}

function publicErrorCode(value: unknown): string {
  if (typeof value !== "string" || value.length === 0 || value.length > 96) {
    return "semantic_transition_request_failed";
  }
  return /^[a-z0-9_:-]+$/.test(value)
    ? value
    : "semantic_transition_request_failed";
}

function isSha256Fingerprint(value: unknown): value is string {
  return typeof value === "string" && /^sha256:[a-f0-9]{64}$/.test(value);
}
