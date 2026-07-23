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

const ignoreApplyingMutationBusyChange = (_busy: boolean): void => undefined;

export interface SemanticTransitionPriorPacketBindingV01 {
  packet_id: string;
  packet_fingerprint: string;
}

export function SemanticTransitionActions({
  proposalId,
  proposalFingerprint,
  selectedCandidateId,
  selectedCandidateFingerprint,
  decisions,
  persistedReceipts,
  priorPacket,
  onSessionInvalid,
  onExactReviewMaterialChanged,
  onProjectApplicationCompleted,
  tryBeginOperatorMutation,
  endOperatorMutation,
  onApplyingMutationBusyChange = ignoreApplyingMutationBusyChange,
}: {
  proposalId: string;
  proposalFingerprint: string;
  selectedCandidateId?: string;
  selectedCandidateFingerprint?: string;
  decisions: ReviewDecisionV01[];
  persistedReceipts: StateTransitionReceiptV01[];
  priorPacket: SemanticTransitionPriorPacketBindingV01 | null;
  onSessionInvalid: (errorCode: string) => void;
  onExactReviewMaterialChanged: () => Promise<void>;
  onProjectApplicationCompleted: () => Promise<void>;
  tryBeginOperatorMutation: () => boolean;
  endOperatorMutation: () => void;
  onApplyingMutationBusyChange?: (busy: boolean) => void;
}) {
  const applyingDecisions = useMemo(
    () =>
      decisions.filter(
        (decision) =>
          (!selectedCandidateId ||
            (decision.candidate.candidate_id === selectedCandidateId &&
              (!selectedCandidateFingerprint ||
                decision.candidate.candidate_fingerprint ===
                  selectedCandidateFingerprint))) &&
          (decision.decision === "accept" ||
            decision.decision === "supersede" ||
            decision.decision === "retract") &&
          decision.requested_transition_intent !== null &&
          decision.requested_transition_intent.applied === false,
      ),
    [decisions, selectedCandidateFingerprint, selectedCandidateId],
  );
  const candidatePersistedReceipts = useMemo(
    () =>
      persistedReceipts.filter(
        (receipt) =>
          !selectedCandidateId ||
          (receipt.source_candidate.candidate_id === selectedCandidateId &&
            (!selectedCandidateFingerprint ||
              receipt.source_candidate.candidate_fingerprint ===
                selectedCandidateFingerprint)),
      ),
    [
      persistedReceipts,
      selectedCandidateFingerprint,
      selectedCandidateId,
    ],
  );
  const [selectedDecisionId, setSelectedDecisionId] = useState(
    applyingDecisions.at(-1)?.decision_id ?? "",
  );
  const selectedDecision =
    applyingDecisions.find(
      (decision) => decision.decision_id === selectedDecisionId,
    ) ?? applyingDecisions.at(-1) ?? null;
  const persistedReceiptForSelectedDecision = selectedDecision
    ? candidatePersistedReceipts
        .filter(
          (receipt) =>
            receipt.source_decision.decision_id === selectedDecision.decision_id &&
            receipt.source_decision.decision_fingerprint ===
              selectedDecision.integrity.fingerprint,
        )
        .at(-1) ?? null
    : null;
  const persistedReceiptForSelectedCandidate =
    candidatePersistedReceipts.at(-1) ?? null;
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
  const mounted = useRef(true);
  const requestGeneration = useRef(0);
  const selectedDecisionScope = selectedDecision
    ? [
        proposalId,
        proposalFingerprint,
        selectedDecision.candidate.candidate_id,
        selectedDecision.candidate.candidate_fingerprint,
        selectedDecision.decision_id,
        selectedDecision.integrity.fingerprint,
      ].join("|")
    : [
        proposalId,
        proposalFingerprint,
        selectedCandidateId ?? "all-candidates",
        selectedCandidateFingerprint ?? "unknown-candidate-fingerprint",
        "no-applying-decision",
      ].join("|");
  const previousSelectedDecisionScope = useRef(selectedDecisionScope);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      requestGeneration.current += 1;
      onApplyingMutationBusyChange(false);
    };
  }, [onApplyingMutationBusyChange]);

  useEffect(() => {
    if (previousSelectedDecisionScope.current === selectedDecisionScope) return;
    previousSelectedDecisionScope.current = selectedDecisionScope;
    resetDerivedSteps();
  }, [selectedDecisionScope]);

  useEffect(() => {
    if (!selectedDecision && applyingDecisions.length > 0) {
      setSelectedDecisionId(applyingDecisions.at(-1)?.decision_id ?? "");
    }
  }, [applyingDecisions, selectedDecision]);

  function resetDerivedSteps(): void {
    requestGeneration.current += 1;
    requestInFlight.current = false;
    setPreviewResponse(null);
    setConfirmationResponse(null);
    setApplyResponse(null);
    setPreviewReviewed(false);
    setGateReviewed(false);
    setBusyStep(null);
    setErrorCode(null);
    setStatusMessage(null);
  }

  function beginRequest(step: TransitionStepV01): number {
    const generation = requestGeneration.current + 1;
    requestGeneration.current = generation;
    requestInFlight.current = true;
    setBusyStep(step);
    if (step === "confirm" || step === "apply") {
      onApplyingMutationBusyChange(true);
    }
    return generation;
  }

  function requestIsCurrent(generation: number): boolean {
    return mounted.current && requestGeneration.current === generation;
  }

  function finishRequest(
    generation: number,
    step: TransitionStepV01,
  ): void {
    requestInFlight.current = false;
    if (step === "confirm" || step === "apply") {
      onApplyingMutationBusyChange(false);
    }
    if (requestIsCurrent(generation)) {
      setBusyStep(null);
    }
  }

  async function preparePreview(): Promise<void> {
    if (!selectedDecision || requestInFlight.current) return;
    const requestGeneration = beginRequest("preview");
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
      if (!requestIsCurrent(requestGeneration)) return;
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
      setStatusMessage("Impact is ready. Reviewing it changed nothing.");
    } catch {
      if (requestIsCurrent(requestGeneration)) {
        setErrorCode("semantic_transition_preview_request_failed");
      }
    } finally {
      finishRequest(requestGeneration, "preview");
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
    const requestGeneration = beginRequest("confirm");
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
      if (!requestIsCurrent(requestGeneration)) return;
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
          ? "Existing confirmation reused. The project has not changed."
          : "Change confirmed. The project has not changed yet.",
      );
      await onExactReviewMaterialChanged();
    } catch {
      if (requestIsCurrent(requestGeneration)) {
        setErrorCode("semantic_transition_confirmation_request_failed");
      }
    } finally {
      endOperatorMutation();
      finishRequest(requestGeneration, "confirm");
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
    const requestGeneration = beginRequest("apply");
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
      if (!requestIsCurrent(requestGeneration)) return;
      if (!response.ok) {
        handleRouteError(response.status, body);
        return;
      }
      if (
        (body.status !== "applied" &&
          body.status !== "exact_replay") ||
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
          ? "Existing project update reused; no duplicate change was made."
          : "Project updated. Future work can use the updated project context.",
      );
      await onProjectApplicationCompleted();
    } catch {
      if (requestIsCurrent(requestGeneration)) {
        setErrorCode("semantic_transition_apply_request_failed");
      }
    } finally {
      endOperatorMutation();
      finishRequest(requestGeneration, "apply");
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
    applyResponse?.transition_receipt ??
    persistedReceiptForSelectedDecision ??
    (selectedDecision ? null : persistedReceiptForSelectedCandidate);
  const laterPacket = applyResponse?.later_packet ?? null;
  const allBusy = busyStep !== null;

  return (
    <section
      className={styles.panel}
      aria-labelledby="apply-approved-change-title"
      data-vnext-semantic-transition-actions="v0.1"
      data-vnext-transition-applying-decision-count={applyingDecisions.length}
      data-vnext-transition-persisted-receipt-count={candidatePersistedReceipts.length}
      data-vnext-transition-selected-decision-kind={selectedDecision?.decision ?? "none"}
      data-vnext-local-authentication="secret-possession-not-external-identity"
      data-ai-workplane-change-stage={
        receipt
          ? "project_updated"
          : gate
            ? "apply_ready"
            : preview
              ? "confirmation_ready"
              : selectedDecision
                ? "impact_review_ready"
                : "decision_required"
      }
    >
      <div className={styles.panelHeader}>
        <p className={styles.kicker}>Apply an approved change</p>
        <h2 id="apply-approved-change-title">
          {receipt
            ? "Project updated"
            : gate
              ? "Apply to project"
              : preview
                ? "Confirm change"
                : "Review impact"}
        </h2>
        <p className={styles.copy}>
          {receipt
            ? "The reviewed change is now reflected in saved project state."
            : gate
              ? "This is the step that changes saved project state."
              : preview
                ? "Confirmation authorizes only this reviewed change. The project remains unchanged."
                : selectedDecision
                  ? "Review what the saved decision would affect. Reviewing impact changes nothing."
                  : "Save an applying decision before reviewing its project impact."}
        </p>
      </div>

      {applyingDecisions.length === 0 && !receipt ? (
        <p
          className={styles.empty}
          data-vnext-transition-actions-status="awaiting_applying_decision"
        >
          No approved project change is waiting to be completed.
        </p>
      ) : null}

      {applyingDecisions.length > 1 ? (
        <label className={styles.fieldLabel}>
          Saved decision to complete
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
                {humanDecisionLabel(decision.decision)} · saved {decision.decided_at}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {errorCode ? (
        <p className={styles.error} role="alert" data-vnext-transition-error={errorCode}>
          {errorCode}
        </p>
      ) : null}
      {statusMessage ? <p className={styles.success} role="status">{statusMessage}</p> : null}

      {selectedDecision && !preview && !receipt ? (
        <section
          className={styles.transitionStep}
          data-vnext-transition-step="preview"
          data-vnext-transition-step-status="not_prepared"
          data-vnext-transition-preview-write="false"
        >
          <p className={styles.copy}>
            Augnes will reload the exact saved decision and current project state,
            then describe the bounded effect and any blocker. This writes nothing.
          </p>
          <button
            className={styles.button}
            type="button"
            data-vnext-transition-action="preview"
            data-ai-workplane-primary-action="review-impact"
            disabled={allBusy}
            onClick={() => void preparePreview()}
          >
            {busyStep === "preview" ? "Reviewing…" : "Review impact"}
          </button>
        </section>
      ) : null}

      {preview ? (
        <section
          className={styles.transitionStep}
          data-vnext-transition-step="preview"
          data-vnext-transition-step-status="prepared"
          data-vnext-transition-preview-write="false"
        >
          <h3>What the change would affect</h3>
          <EffectList effects={preview.intended_effects} />
          <p className={styles.muted}>
            This impact review is current until {previewResponse?.pilot_policy.preview_binding_expires_at ?? "the displayed review expires"}.
          </p>
          {!gate ? (
            <label className={styles.checkRow}>
              <input
                type="checkbox"
                checked={previewReviewed}
                disabled={allBusy}
                onChange={(event) => setPreviewReviewed(event.target.checked)}
              />
              <span>I reviewed what this exact change would affect and understand that the project has not changed.</span>
            </label>
          ) : null}
        </section>
      ) : null}

      {preview && !gate && !receipt ? (
        <section
          className={styles.transitionStep}
          data-vnext-transition-step="confirmation"
          data-vnext-transition-step-status="not_recorded"
          data-vnext-transition-confirm-state-applied="false"
        >
          <button
            className={styles.button}
            type="button"
            data-vnext-transition-action="confirm"
            data-ai-workplane-primary-action="confirm-change"
            disabled={!previewReviewed || allBusy}
            onClick={() => void confirmGate()}
          >
            {busyStep === "confirm" ? "Confirming…" : "Confirm this change"}
          </button>
        </section>
      ) : null}

      {gate ? (
        <section
          className={styles.transitionStep}
          data-vnext-transition-step="confirmation"
          data-vnext-transition-step-status="recorded"
          data-vnext-transition-confirm-state-applied="false"
        >
          <p className={styles.copy}>This reviewed change is confirmed. Saved project state is still unchanged.</p>
          {!receipt ? (
            <label className={styles.checkRow}>
              <input
                type="checkbox"
                checked={gateReviewed}
                disabled={allBusy}
                onChange={(event) => setGateReviewed(event.target.checked)}
              />
              <span>I understand the next action changes saved project state.</span>
            </label>
          ) : null}
        </section>
      ) : null}

      {gate && !receipt ? (
        <section
          className={styles.transitionStep}
          data-vnext-transition-step="apply"
          data-vnext-transition-step-status="not_applied"
          data-vnext-transition-commit-packet-compiled="false"
        >
          {!priorPacket ? (
            <p className={styles.notice}>Exact prior work context is unavailable, so this change cannot be applied safely.</p>
          ) : null}
          <button
            className={styles.button}
            type="button"
            data-vnext-transition-action="apply"
            data-ai-workplane-primary-action="apply-to-project"
            disabled={!gateReviewed || !priorPacket || allBusy}
            onClick={() => void applyTransitionAndCompile()}
          >
            {busyStep === "apply" ? "Applying…" : "Apply to project"}
          </button>
        </section>
      ) : null}

      {receipt ? (
        <>
          <section
            className={styles.transitionStep}
            data-vnext-transition-step="apply"
            data-vnext-transition-step-status="applied"
            data-vnext-transition-commit-packet-compiled={String(Boolean(laterPacket))}
          >
            <p className={styles.success}>Project updated</p>
            <p className={styles.copy}>Future work can use the updated project context.</p>
          </section>
          <section
            className={styles.transitionStep}
            data-vnext-transition-step="later-packet"
            data-vnext-transition-step-status={laterPacket ? "compiled" : "not_compiled"}
            data-vnext-transition-compile-transition-applied="true"
          >
            <a
              className={styles.button}
              href="/workbench/semantic-review"
              data-ai-workplane-primary-action="return-home"
            >
              Return to AI Workplane
            </a>
          </section>
        </>
      ) : null}

      <details
        className={styles.advancedDisclosure}
        data-vnext-transition-safeguards="exact"
      >
        <summary>Exact project-change safeguards</summary>
        <p className={styles.muted}>
          Exact replay, expiry, saved-version, decision, source, and idempotency checks remain server-owned.
        </p>
        {selectedDecision ? (
          <>
            <ExactValue label="ReviewDecision ID" value={selectedDecision.decision_id} />
            <ExactValue label="Decision fingerprint" value={selectedDecision.integrity.fingerprint} />
          </>
        ) : null}
        {preview ? <ExactValue label="Confirmation digest" value={preview.confirmation_digest} /> : null}
        {gate ? <ExactValue label="Gate record ID" value={gate.gate_record_id} /> : null}
        {receipt ? (
          <>
            <ExactValue label="StateTransitionReceipt ID" value={receipt.transition_receipt_id} />
            <ReceiptEffectList receipt={receipt} />
          </>
        ) : null}
        {laterPacket ? (
          <>
            <ExactValue label="Later TaskContextPacket ID" value={laterPacket.packet_id} />
            <AcceptedStateSelectionList packet={laterPacket} />
          </>
        ) : null}
      </details>
    </section>
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

function humanDecisionLabel(value: ReviewDecisionV01["decision"]): string {
  return value === "accept"
    ? "Accept this change"
    : value === "reject"
      ? "Reject this change"
      : value === "defer"
        ? "Decide later"
        : value === "supersede"
          ? "Replace the current saved state"
          : "Remove the current saved state";
}

function isSha256Fingerprint(value: unknown): value is string {
  return typeof value === "string" && /^sha256:[a-f0-9]{64}$/.test(value);
}
