"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { ReviewDecisionV01 } from "@/types/vnext/review-decision";
import type { StateTransitionReceiptV01 } from "@/types/vnext/state-transition-receipt";

import type {
  SemanticTransitionCommitRouteResponseV01,
  SemanticTransitionCompileRouteResponseV01,
  SemanticTransitionConfirmationRouteResponseV01,
  SemanticTransitionPreviewRouteResponseV01,
  SemanticTransitionRouteErrorV01,
} from "./semantic-review-types";
import styles from "./semantic-review.module.css";

const SEMANTIC_TRANSITION_ROUTE =
  "/api/vnext/operator/semantic-transition";

type TransitionStepV01 = "preview" | "confirm" | "commit" | "compile";

export interface SemanticTransitionPriorPacketBindingV01 {
  packet_id: string;
  packet_fingerprint: string;
}

export function SemanticTransitionActions({
  proposalId,
  proposalFingerprint,
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
  decisions: ReviewDecisionV01[];
  persistedReceipts: StateTransitionReceiptV01[];
  priorPacket: SemanticTransitionPriorPacketBindingV01 | null;
  onSessionInvalid: (errorCode: string) => void;
  onPrivateMaterialChanged: () => Promise<void>;
  tryBeginOperatorMutation: () => boolean;
  endOperatorMutation: () => void;
}) {
  const acceptDecisions = useMemo(
    () =>
      decisions.filter(
        (decision) =>
          decision.decision === "accept" &&
          decision.requested_transition_intent !== null &&
          decision.requested_transition_intent.applied === false,
      ),
    [decisions],
  );
  const [selectedDecisionId, setSelectedDecisionId] = useState(
    acceptDecisions.at(-1)?.decision_id ?? "",
  );
  const selectedDecision =
    acceptDecisions.find(
      (decision) => decision.decision_id === selectedDecisionId,
    ) ?? acceptDecisions.at(-1) ?? null;
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
  const [commitResponse, setCommitResponse] =
    useState<SemanticTransitionCommitRouteResponseV01 | null>(null);
  const [compileResponse, setCompileResponse] =
    useState<SemanticTransitionCompileRouteResponseV01 | null>(null);
  const [previewReviewed, setPreviewReviewed] = useState(false);
  const [gateReviewed, setGateReviewed] = useState(false);
  const [receiptReviewed, setReceiptReviewed] = useState(false);
  const [busyStep, setBusyStep] = useState<TransitionStepV01 | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const requestInFlight = useRef(false);

  useEffect(() => {
    if (!selectedDecision && acceptDecisions.length > 0) {
      setSelectedDecisionId(acceptDecisions.at(-1)?.decision_id ?? "");
    }
  }, [acceptDecisions, selectedDecision]);

  function resetDerivedSteps(): void {
    setPreviewResponse(null);
    setConfirmationResponse(null);
    setCommitResponse(null);
    setCompileResponse(null);
    setPreviewReviewed(false);
    setGateReviewed(false);
    setReceiptReviewed(false);
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
    setCommitResponse(null);
    setCompileResponse(null);
    setGateReviewed(false);
    setReceiptReviewed(false);
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
        body.pilot_policy.single_target !== true ||
        body.pilot_policy.accept_create_only !== true ||
        body.pilot_policy.current_state_required !== "absent" ||
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
    setCommitResponse(null);
    setCompileResponse(null);
    setGateReviewed(false);
    setReceiptReviewed(false);
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

  async function commitTransition(): Promise<void> {
    if (
      !selectedDecision ||
      !confirmationResponse ||
      !gateReviewed ||
      requestInFlight.current ||
      !tryBeginOperatorMutation()
    ) {
      return;
    }
    requestInFlight.current = true;
    setBusyStep("commit");
    setErrorCode(null);
    setStatusMessage(null);
    setCommitResponse(null);
    setCompileResponse(null);
    setReceiptReviewed(false);
    try {
      const gate = confirmationResponse.gate_record;
      const response = await fetch(SEMANTIC_TRANSITION_ROUTE, {
        method: "POST",
        cache: "no-store",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "commit",
          proposal_id: proposalId,
          proposal_fingerprint: proposalFingerprint,
          decision_id: selectedDecision.decision_id,
          decision_fingerprint: selectedDecision.integrity.fingerprint,
          gate_record_id: gate.gate_record_id,
          gate_record_fingerprint: gate.integrity.fingerprint,
        }),
      });
      const body = (await response.json()) as
        | SemanticTransitionCommitRouteResponseV01
        | SemanticTransitionRouteErrorV01;
      if (!response.ok) {
        handleRouteError(response.status, body);
        return;
      }
      if (
        !("transition_receipt" in body) ||
        !("eligibility_status" in body) ||
        !("eligibility" in body) ||
        body.packet_compiled !== false ||
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
        setErrorCode("semantic_transition_commit_response_invalid");
        return;
      }
      setCommitResponse(body);
      setStatusMessage(
        body.status === "exact_replay"
          ? "Exact transition replay returned the persisted receipt. No packet was compiled."
          : "Durable local semantic state and its receipt were persisted. No packet was compiled.",
      );
      await onPrivateMaterialChanged();
    } catch {
      setErrorCode("semantic_transition_commit_request_failed");
    } finally {
      requestInFlight.current = false;
      endOperatorMutation();
      setBusyStep(null);
    }
  }

  async function compileLaterPacket(): Promise<void> {
    const receipt =
      commitResponse?.transition_receipt ?? persistedReceiptForSelectedDecision;
    if (
      !receipt ||
      !priorPacket ||
      !receiptReviewed ||
      requestInFlight.current ||
      !tryBeginOperatorMutation()
    ) {
      return;
    }
    requestInFlight.current = true;
    setBusyStep("compile");
    setErrorCode(null);
    setStatusMessage(null);
    setCompileResponse(null);
    try {
      const response = await fetch(SEMANTIC_TRANSITION_ROUTE, {
        method: "POST",
        cache: "no-store",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "compile",
          transition_receipt_id: receipt.transition_receipt_id,
          transition_receipt_fingerprint: receipt.integrity.fingerprint,
          prior_packet_id: priorPacket.packet_id,
          prior_packet_fingerprint: priorPacket.packet_fingerprint,
        }),
      });
      const body = (await response.json()) as
        | SemanticTransitionCompileRouteResponseV01
        | SemanticTransitionRouteErrorV01;
      if (!response.ok) {
        handleRouteError(response.status, body);
        return;
      }
      if (
        !("later_packet" in body) ||
        body.transition_applied !== false ||
        body.transition_receipt_id !== receipt.transition_receipt_id ||
        body.transition_receipt_fingerprint !== receipt.integrity.fingerprint
      ) {
        setErrorCode("semantic_transition_compile_response_invalid");
        return;
      }
      setCompileResponse(body);
      setStatusMessage(
        body.status === "exact_replay"
          ? "Exact packet replay returned the persisted later packet. No transition was applied."
          : "Later context was compiled explicitly and persisted. Packet compilation applied no transition.",
      );
      await onPrivateMaterialChanged();
    } catch {
      setErrorCode("semantic_transition_compile_request_failed");
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
    commitResponse?.transition_receipt ?? persistedReceiptForSelectedDecision;
  const laterPacket = compileResponse?.later_packet ?? null;
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
          Preview, confirm, commit, then compile context
        </h2>
        <p className={styles.copy}>
          Each step is a separate authenticated local action. Local secret possession
          binds this browser session to the configured operator scope; it does not prove
          legal, operating-system, organization, or external-provider identity.
        </p>
      </div>

      <p
        className={styles.notice}
        data-vnext-transition-pilot-policy="single_target_accept_create_absent"
      >
        This opt-in product pilot admits exactly one target, an accept decision, a
        create operation, and an absent current state. The server rechecks that policy
        at preview, confirmation, and commit; this UI does not broaden the Core writer.
      </p>

      {acceptDecisions.length === 0 ? (
        <p className={styles.empty} data-vnext-transition-actions-status="awaiting_accept">
          Record an eligible accept ReviewDecision before preparing a transition preview.
          Reject and defer decisions do not enter this commit path.
        </p>
      ) : (
        <label className={styles.fieldLabel}>
          Exact accepted decision
          <select
            className={styles.selectControl}
            value={selectedDecision?.decision_id ?? ""}
            disabled={allBusy}
            onChange={(event) => {
              setSelectedDecisionId(event.target.value);
              resetDerivedSteps();
            }}
          >
            {acceptDecisions.map((decision) => (
              <option
                key={`${decision.decision_id}:${decision.integrity.fingerprint}`}
                value={decision.decision_id}
              >
                {decision.decision_id} / {decision.candidate.candidate_id}
              </option>
            ))}
          </select>
        </label>
      )}

      {selectedDecision ? (
        <div className={styles.identifierStack}>
          <span className={styles.identifier}>{selectedDecision.decision_id}</span>
          <span className={styles.identifier}>
            {selectedDecision.integrity.fingerprint}
          </span>
          <span className={styles.muted}>
            Intent {selectedDecision.requested_transition_intent?.intent_id}; exact target
            count {selectedDecision.requested_transition_intent?.target_refs.length ?? 0}
          </span>
        </div>
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
            The server reloads the persisted proposal, decision, target head, and state.
            It derives the exact operation, after-state fingerprint, applier, TTL, and
            digest. This action writes nothing.
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
                  label="Authorized applier"
                  value={`${preview.authorized_applier_identity.ref_type}:${preview.authorized_applier_identity.external_id}`}
                />
                <DataPoint
                  label="Preview validity"
                  value={`${previewResponse?.pilot_policy.preview_max_age_ms ?? 0} ms (${previewResponse?.pilot_policy.preview_source ?? "unknown"})`}
                />
                <DataPoint
                  label="Preview binding expires"
                  value={
                    previewResponse?.pilot_policy.preview_binding_expires_at ??
                    "unknown"
                  }
                />
                <DataPoint label="Gate TTL" value={`${preview.gate_ttl_ms} ms`} />
                <DataPoint
                  label="Gate TTL source"
                  value={previewResponse?.pilot_policy.gate_source ?? "unknown"}
                />
              </dl>
              <ExactValue label="Confirmation digest" value={preview.confirmation_digest} />
              <EffectList effects={preview.intended_effects} />
              <label className={styles.checkRow}>
                <input
                  type="checkbox"
                  checked={previewReviewed}
                  disabled={allBusy}
                  onChange={(event) => setPreviewReviewed(event.target.checked)}
                />
                <span>
                  I inspected the exact target, operation, before and after fingerprints,
                  expected revision, authorized applier, TTL, and confirmation digest.
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
            Confirmation submits only the exact proposal, decision, and digest bindings.
            The server supplies the applier, TTL, clock, state observations, and effects.
            A successful confirmation persists a gate; it does not apply semantic state.
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
              <ExactValue label="Gate record ID" value={gate.gate_record_id} />
              <ExactValue label="Gate fingerprint" value={gate.integrity.fingerprint} />
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
                  label="Precondition"
                  value={gate.eligibility_precondition_fingerprint}
                />
              </dl>
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
          data-vnext-transition-step="commit"
          data-vnext-transition-step-status={receipt ? "applied" : "not_applied"}
          data-vnext-transition-commit-packet-compiled="false"
        >
          <StepHeader number="3" title="Commit durable state" />
          <p className={styles.copy}>
            Commit submits only the exact proposal, decision, and persisted gate
            bindings. The writer reloads current state in its transaction and generates
            application times and proof bindings. Success applies durable local semantic
            state and records a StateTransitionReceipt; it does not compile a packet.
          </p>
          <button
            className={styles.button}
            type="button"
            data-vnext-transition-action="commit"
            disabled={!gate || !gateReviewed || allBusy}
            onClick={() => void commitTransition()}
          >
            {busyStep === "commit" ? "Applying…" : "Apply durable semantic state"}
          </button>
          {receipt ? (
            <>
              <ExactValue
                label="StateTransitionReceipt ID"
                value={receipt.transition_receipt_id}
              />
              <ExactValue
                label="Receipt fingerprint"
                value={receipt.integrity.fingerprint}
              />
              <ExactValue label="Idempotency key" value={receipt.idempotency_key} />
              <dl className={styles.statusGrid}>
                <DataPoint label="Status" value={receipt.receipt_status} />
                <DataPoint label="Applied" value={receipt.applied_at} />
                <DataPoint label="Recorded" value={receipt.recorded_at} />
                <DataPoint label="Effects" value={String(receipt.effects.length)} />
              </dl>
              <ReceiptEffectList receipt={receipt} />
              <label className={styles.checkRow}>
                <input
                  type="checkbox"
                  checked={receiptReviewed}
                  disabled={allBusy}
                  onChange={(event) => setReceiptReviewed(event.target.checked)}
                />
                <span>
                  I reviewed the applied receipt and want to compile a separate later
                  TaskContextPacket from the persisted state.
                </span>
              </label>
            </>
          ) : null}
        </section>

        <section
          className={styles.transitionStep}
          data-vnext-transition-step="compile"
          data-vnext-transition-step-status={laterPacket ? "compiled" : "not_compiled"}
          data-vnext-transition-compile-transition-applied="false"
        >
          <StepHeader number="4" title="Compile later context" />
          <p className={styles.copy}>
            Packet compilation is a separate explicit action after receipt review. It
            changes bounded context selection and persists the new packet; it performs no
            semantic transition and launches no provider or native host.
          </p>
          {!priorPacket ? (
            <p className={styles.empty}>
              This proposal has no exact prior TaskContextPacket ID/fingerprint binding,
              so the compiler action is unavailable.
            </p>
          ) : (
            <div className={styles.identifierStack}>
              <span className={styles.identifier}>{priorPacket.packet_id}</span>
              <span className={styles.identifier}>{priorPacket.packet_fingerprint}</span>
            </div>
          )}
          <button
            className={styles.button}
            type="button"
            data-vnext-transition-action="compile"
            disabled={!receipt || !priorPacket || !receiptReviewed || allBusy}
            onClick={() => void compileLaterPacket()}
          >
            {busyStep === "compile" ? "Compiling…" : "Compile later packet explicitly"}
          </button>
          {laterPacket ? (
            <>
              <ExactValue label="Later packet ID" value={laterPacket.packet_id} />
              <ExactValue
                label="Later packet fingerprint"
                value={laterPacket.integrity.fingerprint}
              />
              <ExactValue
                label="Receipt lineage ID"
                value={compileResponse?.transition_receipt_id ?? "missing"}
              />
              <ExactValue
                label="Receipt lineage fingerprint"
                value={compileResponse?.transition_receipt_fingerprint ?? "missing"}
              />
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
                <DataPoint label="Transition applied" value="false" />
              </dl>
              <AcceptedStateSelectionList packet={laterPacket} />
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
            {effect.operation} / expected revision {effect.expected_revision}
          </strong>
          <span className={styles.identifier}>{effect.target_ref.external_id}</span>
          <span>
            Target type {effect.target_ref.ref_type}; trust {effect.target_ref.trust_class}
          </span>
          <span>
            Target source fingerprint {effect.target_ref.source_ref ?? "none"}
          </span>
          <span>Before presence {effect.before_presence}</span>
          <span>
            Before fingerprint {effect.before_state_fingerprint ?? "absent"}
          </span>
          <span>
            Authorized after fingerprint {effect.expected_after_state_fingerprint ?? "absent"}
          </span>
        </li>
      ))}
    </ol>
  );
}

function AcceptedStateSelectionList({
  packet,
}: {
  packet: SemanticTransitionCompileRouteResponseV01["later_packet"];
}) {
  const entries = packet.selected_context.filter(
    (entry) => entry.entry_kind === "accepted_state_ref",
  );
  return (
    <ol className={styles.plainList} aria-label="Selected accepted semantic state">
      {entries.map((entry) => (
        <li key={entry.entry_id}>
          <strong>{entry.entry_kind}</strong>
          <span className={styles.identifier}>{entry.entry_id}</span>
          <span className={styles.identifier}>
            {entry.external_ref?.external_id ?? "missing external ref"}
          </span>
          <span>
            State fingerprint {entry.source_ref ?? "missing"}; trust {entry.trust_class}
          </span>
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
          <strong>{effect.operation}</strong>
          <span className={styles.identifier}>{effect.effect_id}</span>
          <span className={styles.identifier}>{effect.target_ref.external_id}</span>
          <span>
            Before {effect.before_state.presence} / {effect.before_state.state_fingerprint ?? "absent"}
          </span>
          <span>
            After {effect.after_state.presence} / {effect.after_state.state_fingerprint ?? "absent"}
          </span>
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
