"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { CodexResultReportInputV01 } from "@/lib/dogfooding/codex-result-report-normalizer";
import type { VNextOperatorPilotPacketHandoffV01 } from "@/lib/vnext/runtime/operator-pilot-project-continuity";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import type { RunReceiptV01 } from "@/types/vnext/run-receipt";

import { ContextUseReviewPanel } from "./context-use-review-panel";
import styles from "./semantic-review.module.css";

const LATER_RESULT_ROUTE = "/api/vnext/operator/later-result";
const CODEX_RESULT_REPORT_INPUT_VERSION = "codex_result_report_input.v0.1";
const MAX_OPERATOR_BODY_BYTES = 16 * 1024;

type ReportedPayloadUseV01 = "yes" | "partial" | "no" | "unknown";

interface LaterResultReadModelFieldsV01 {
  workspace_id: string;
  project_id: string;
  receipt: RunReceiptV01;
  source_transition_receipt: {
    transition_receipt_id: string;
    transition_receipt_fingerprint: string;
  };
  packet_consumption: {
    reported_payload_use: ReportedPayloadUseV01;
    cited_selected_context: Array<{
      entry_id: string;
      state_ref: ExternalRefV01;
      state_fingerprint: string;
    }>;
  };
  relation: {
    packet_referenced: true;
    payload_use_reported: true;
    selected_state_refs_cited: boolean;
    local_integrity_verified: true;
    actual_use_review_required: true;
    helpfulness_established: false;
  };
  proposal_created: false;
  decision_created: false;
  transition_created: false;
  evidence_accepted: false;
  work_closed: false;
}

interface LaterResultResponseV01 extends LaterResultReadModelFieldsV01 {
  ok: true;
  status: "inserted" | "exact_replay";
  semantic_authority_granted: false;
}

interface LaterResultGetResponseV01 extends LaterResultReadModelFieldsV01 {
  ok: true;
  status: "later_result";
  semantic_authority_granted: false;
}

type LaterResultDisplayV01 =
  | LaterResultResponseV01
  | LaterResultGetResponseV01;

interface SelectedReportV01 {
  file_name: string;
  file_size: number;
  report: CodexResultReportInputV01;
}

export function LaterResultIntakePanel({
  handoff,
  tryBeginOperatorMutation,
  endOperatorMutation,
  onSessionInvalid,
}: {
  handoff: VNextOperatorPilotPacketHandoffV01;
  tryBeginOperatorMutation: () => boolean;
  endOperatorMutation: () => void;
  onSessionInvalid: (errorCode: string) => void;
}) {
  const [runId, setRunId] = useState("");
  const [selectedReport, setSelectedReport] =
    useState<SelectedReportV01 | null>(null);
  const [reportedUse, setReportedUse] =
    useState<ReportedPayloadUseV01>("unknown");
  const [citedEntryIds, setCitedEntryIds] = useState<Set<string>>(new Set());
  const [acknowledged, setAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [result, setResult] = useState<LaterResultDisplayV01 | null>(null);
  const [persistedReadStatus, setPersistedReadStatus] = useState<
    "loading" | "none" | "loaded" | "error"
  >("loading");
  const reportFileInputRef = useRef<HTMLInputElement>(null);

  const acceptedById = useMemo(
    () => new Map(handoff.accepted_state_refs.map((entry) => [entry.entry_id, entry])),
    [handoff.accepted_state_refs],
  );
  const runIdValid =
    runId.length >= 1 && runId.length <= 256 && runId === runId.trim();
  const citationSemanticsValid =
    reportedUse === "yes" || reportedUse === "partial"
      ? citedEntryIds.size > 0
      : citedEntryIds.size === 0;
  const ready =
    runIdValid &&
    selectedReport !== null &&
    citationSemanticsValid &&
    acknowledged &&
    !busy;

  useEffect(() => {
    const controller = new AbortController();
    async function loadPersistedResult(): Promise<void> {
      setPersistedReadStatus("loading");
      setResult(null);
      try {
        const response = await fetch(
          `${LATER_RESULT_ROUTE}?${new URLSearchParams({
            packet_id: handoff.packet.packet_id,
            packet_fingerprint: handoff.packet.packet_fingerprint,
          }).toString()}`,
          {
            method: "GET",
            cache: "no-store",
            credentials: "same-origin",
            signal: controller.signal,
          },
        );
        const body = (await response.json()) as
          | LaterResultGetResponseV01
          | { error_code?: unknown };
        const code = publicErrorCode(body);
        if (
          response.status === 404 &&
          code === "operator_pilot_later_result_missing"
        ) {
          setPersistedReadStatus("none");
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
          setPersistedReadStatus("error");
          setErrorCode(code ?? "later_result_read_failed");
          return;
        }
        if (
          !("status" in body) ||
          body.status !== "later_result" ||
          body.semantic_authority_granted !== false ||
          !laterResultReadModelMatchesHandoff(body, handoff)
        ) {
          setPersistedReadStatus("error");
          setErrorCode("later_result_read_response_invalid");
          return;
        }
        setResult(body);
        setPersistedReadStatus("loaded");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setPersistedReadStatus("error");
        setErrorCode("later_result_read_failed");
      }
    }
    void loadPersistedResult();
    return () => controller.abort();
  }, [handoff, onSessionInvalid]);

  async function selectReportFile(file: File | null): Promise<void> {
    setSelectedReport(null);
    setErrorCode(null);
    setAcknowledged(false);
    if (!file) return;
    if (
      !file.name.toLowerCase().endsWith(".json") ||
      (file.type !== "" && file.type !== "application/json")
    ) {
      setErrorCode("later_result_file_must_be_json");
      return;
    }
    if (file.size <= 0 || file.size > MAX_OPERATOR_BODY_BYTES) {
      setErrorCode("later_result_file_size_invalid");
      return;
    }
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      if (!isCodexResultReportInput(parsed)) {
        setErrorCode("later_result_report_contract_invalid");
        return;
      }
      setSelectedReport({
        file_name: file.name,
        file_size: file.size,
        report: parsed,
      });
    } catch {
      setErrorCode("later_result_report_json_invalid");
    }
  }

  function changeReportedUse(value: ReportedPayloadUseV01): void {
    setReportedUse(value);
    setErrorCode(null);
    setAcknowledged(false);
    if (value === "no" || value === "unknown") {
      setCitedEntryIds(new Set());
    }
  }

  function toggleCitation(entryId: string, checked: boolean): void {
    if (!acceptedById.has(entryId)) return;
    setCitedEntryIds((current) => {
      const next = new Set(current);
      if (checked) next.add(entryId);
      else next.delete(entryId);
      return next;
    });
    setErrorCode(null);
    setAcknowledged(false);
  }

  async function submitLaterResult(): Promise<void> {
    if (!ready || !selectedReport || !tryBeginOperatorMutation()) return;
    setBusy(true);
    setErrorCode(null);
    try {
      const citedIds = [...citedEntryIds].sort();
      const requestText = JSON.stringify({
        packet_id: handoff.packet.packet_id,
        packet_fingerprint: handoff.packet.packet_fingerprint,
        transition_receipt_id:
          handoff.source_transition_receipt.transition_receipt_id,
        transition_receipt_fingerprint:
          handoff.source_transition_receipt.transition_receipt_fingerprint,
        run_id: runId,
        result_report: selectedReport.report,
        packet_consumption: {
          reported_payload_use: reportedUse,
          cited_selected_context_entry_ids: citedIds,
        },
      });
      if (
        new TextEncoder().encode(requestText).byteLength > MAX_OPERATOR_BODY_BYTES
      ) {
        setErrorCode("later_result_request_body_bound_exceeded");
        return;
      }
      const response = await fetch(LATER_RESULT_ROUTE, {
        method: "POST",
        cache: "no-store",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: requestText,
      });
      const body = (await response.json()) as
        | LaterResultResponseV01
        | { error_code?: unknown };
      if (response.status === 401 || response.status === 403) {
        onSessionInvalid(publicErrorCode(body) ?? "operator_session_invalid");
        return;
      }
      if (!response.ok) {
        setErrorCode(publicErrorCode(body) ?? "later_result_intake_failed");
        return;
      }
      if (
        !("receipt" in body) ||
        body.semantic_authority_granted !== false ||
        !laterResultReadModelMatchesHandoff(body, handoff) ||
        body.receipt.run_id !== runId ||
        body.packet_consumption.reported_payload_use !== reportedUse ||
        !sameStringSet(
          body.packet_consumption.cited_selected_context.map(
            (entry) => entry.entry_id,
          ),
          citedIds,
        ) ||
        body.relation.selected_state_refs_cited !== (citedIds.length > 0) ||
        !relationIsConservative(body)
      ) {
        setErrorCode("later_result_response_invalid");
        return;
      }
      for (const cited of body.packet_consumption.cited_selected_context) {
        const expected = acceptedById.get(cited.entry_id);
        if (
          !expected ||
          cited.state_fingerprint !== expected.state_fingerprint ||
          !sameExternalRef(cited.state_ref, expected.state_ref)
        ) {
          setErrorCode("later_result_cited_state_binding_mismatch");
          return;
        }
      }
      setResult(body);
      setPersistedReadStatus("loaded");
      setSelectedReport(null);
      if (reportFileInputRef.current) reportFileInputRef.current.value = "";
    } catch {
      setErrorCode("later_result_intake_failed");
    } finally {
      setBusy(false);
      endOperatorMutation();
    }
  }

  return (
    <section
      className={styles.panel}
      data-vnext-later-result-intake="v0.1"
      data-vnext-later-result-input="structured_json_file_only"
      data-vnext-later-result-native-post="false"
      data-vnext-later-result-status={result?.status ?? (busy ? "submitting" : "idle")}
      data-vnext-later-result-persisted-read={persistedReadStatus}
      data-vnext-later-result-reported-use={reportedUse}
      data-vnext-later-result-citation-count={citedEntryIds.size}
      data-vnext-later-result-report-selected={String(selectedReport !== null)}
      aria-labelledby="later-result-intake-title"
    >
      <div className={styles.panelHeader}>
        <p className={styles.kicker}>Later-task result intake</p>
        <h2 id="later-result-intake-title">Return one structured Codex result</h2>
        <p className={styles.copy}>
          Select an existing CodexResultReport JSON object. This surface accepts no raw
          transcript, prompt, terminal dump, hidden reasoning, credential, free-form
          report editor, or provider invocation.
        </p>
      </div>

      <div className={styles.form}>
        <label>
          Canonical run ID
          <input
            type="text"
            required
            maxLength={256}
            autoComplete="off"
            spellCheck={false}
            value={runId}
            onChange={(event) => {
              setRunId(event.target.value);
              setErrorCode(null);
              setAcknowledged(false);
            }}
            placeholder="run-local-later-task-v0-1"
          />
          <span className={styles.muted}>
            Public-safe opaque identifier only; do not enter a path, token, credential,
            transcript, or prompt.
          </span>
        </label>
        <label>
          Structured CodexResultReport JSON
          <input
            ref={reportFileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={(event) =>
              void selectReportFile(event.target.files?.item(0) ?? null)
            }
          />
        </label>
      </div>

      {selectedReport ? (
        <dl className={styles.statusGrid}>
          <DataPoint label="File" value={selectedReport.file_name} />
          <DataPoint label="Bytes" value={String(selectedReport.file_size)} />
          <DataPoint label="Report ID" value={selectedReport.report.report_id} />
          <DataPoint label="Report kind" value={selectedReport.report.report_kind} />
        </dl>
      ) : null}

      <label className={styles.fieldLabel}>
        Reported packet-payload use
        <select
          className={styles.selectControl}
          value={reportedUse}
          onChange={(event) =>
            changeReportedUse(event.target.value as ReportedPayloadUseV01)
          }
        >
          <option value="unknown">Unknown</option>
          <option value="yes">Yes</option>
          <option value="partial">Partial</option>
          <option value="no">No</option>
        </select>
      </label>

      <section className={styles.materialCard} aria-labelledby="result-citations-title">
        <h3 id="result-citations-title">Accepted-state entries cited by the report</h3>
        <p className={styles.copy}>
          Yes or partial requires at least one exact citation. No or unknown requires
          none. The report source_refs must independently contain the exact packet and
          every cited entry/fingerprint; the UI does not rewrite the report.
        </p>
        {handoff.accepted_state_refs.length === 0 ? (
          <p className={styles.empty}>No accepted-state entry is available to cite.</p>
        ) : (
          <div className={styles.citationGrid}>
            {handoff.accepted_state_refs.map((entry) => (
              <label className={styles.checkRow} key={entry.entry_id}>
                <input
                  type="checkbox"
                  data-vnext-later-result-citation-id={entry.entry_id}
                  checked={citedEntryIds.has(entry.entry_id)}
                  disabled={reportedUse === "no" || reportedUse === "unknown" || busy}
                  onChange={(event) =>
                    toggleCitation(entry.entry_id, event.target.checked)
                  }
                />
                <span>
                  <strong>{entry.entry_id}</strong>
                  <span className={styles.identifier}>{entry.state_fingerprint}</span>
                </span>
              </label>
            ))}
          </div>
        )}
      </section>

      <div className={styles.exactValue}>
        <strong>Required packet / transition bindings</strong>
        <span className={styles.identifier}>
          {handoff.packet.packet_id} / {handoff.packet.packet_fingerprint}
        </span>
        <span className={styles.identifier}>
          {handoff.source_transition_receipt.transition_receipt_id} / {handoff.source_transition_receipt.transition_receipt_fingerprint}
        </span>
      </div>

      <label className={styles.checkRow}>
        <input
          type="checkbox"
          checked={acknowledged}
          disabled={busy}
          onChange={(event) => setAcknowledged(event.target.checked)}
        />
        <span>
          I am submitting only the structured report and explicit reported-use metadata.
          Packet reference or citation does not prove actual use, helpfulness, approval,
          Evidence, work closure, or semantic correctness.
        </span>
      </label>

      {!citationSemanticsValid ? (
        <p className={styles.error} role="alert">
          reported_use_citation_relation_invalid
        </p>
      ) : null}
      {errorCode ? (
        <p className={styles.error} role="alert" data-vnext-later-result-error={errorCode}>
          {errorCode}
        </p>
      ) : null}

      {persistedReadStatus === "loading" ? (
        <p className={styles.muted} role="status">
          Checking for an already persisted later-result RunReceipt…
        </p>
      ) : persistedReadStatus === "none" ? (
        <p className={styles.empty}>
          No persisted later-result RunReceipt is bound to this exact packet yet.
        </p>
      ) : null}

      <button
        className={styles.button}
        type="button"
        data-vnext-later-result-action="submit"
        disabled={!ready}
        onClick={() => void submitLaterResult()}
      >
        {busy ? "Recording bounded result…" : "Record later-task RunReceipt"}
      </button>

      {result ? <LaterResultReceiptReadout result={result} /> : null}

      {result && persistedReadStatus === "loaded" ? (
        <ContextUseReviewPanel
          key={`${result.receipt.receipt_id}:${result.receipt.integrity.fingerprint}`}
          handoff={handoff}
          laterTaskReceipt={result.receipt}
          tryBeginOperatorMutation={tryBeginOperatorMutation}
          endOperatorMutation={endOperatorMutation}
          onSessionInvalid={onSessionInvalid}
        />
      ) : null}

      <p className={styles.notice}>
        The result-intake action persists one conservative RunReceipt only. The separate
        review action may persist one ContextUseReview; neither action creates a proposal,
        ReviewDecision, gate, transition, Evidence, work closure, Perspective or memory
        mutation, or an automatic next-context change.
      </p>
    </section>
  );
}

function LaterResultReceiptReadout({ result }: { result: LaterResultDisplayV01 }) {
  const receipt = result.receipt;
  return (
    <section
      className={styles.materialCard}
      data-vnext-later-result-receipt={result.status}
      data-vnext-later-result-actual-use-review-required="true"
      aria-labelledby="later-result-receipt-title"
    >
      <h3 id="later-result-receipt-title">Persisted conservative RunReceipt</h3>
      <ExactValue label="Receipt ID" value={receipt.receipt_id} />
      <ExactValue label="Receipt fingerprint" value={receipt.integrity.fingerprint} />
      <ExactValue label="Idempotency key" value={receipt.idempotency_key} />
      <ExactValue
        label="TaskContextPacket binding"
        value={`${receipt.task_context_packet_ref?.external_id ?? "missing"} / ${receipt.task_context_packet_ref?.source_ref ?? "missing"}`}
      />
      <ExactValue
        label="Source transition receipt"
        value={`${result.source_transition_receipt.transition_receipt_id} / ${result.source_transition_receipt.transition_receipt_fingerprint}`}
      />
      <dl className={styles.statusGrid}>
        <DataPoint label="Read/write status" value={result.status} />
        <DataPoint label="Recorded" value={receipt.recorded_at} />
        <DataPoint
          label="Direct local observations"
          value={String(receipt.trust_summary.direct_observations)}
        />
        <DataPoint
          label="Imported unverified"
          value={String(receipt.trust_summary.imported_unverified_items)}
        />
      </dl>
      <p className={styles.notice}>
        Direct-local trust covers only local packet, transition, state-reference, and
        report-validation reads performed by intake. Codex-reported work and packet use
        remain imported or attested; validation does not upgrade them to observation.
      </p>

      <div className={styles.twoColumnGrid}>
        <section className={styles.materialCard} aria-label="Packet-use relation">
          <h3>Packet-use relation</h3>
          <ul className={styles.plainList}>
            <li>Packet referenced: {String(result.relation.packet_referenced)}</li>
            <li>Payload use reportedly supplied: {String(result.relation.payload_use_reported)}</li>
            <li>Selected state refs cited: {String(result.relation.selected_state_refs_cited)}</li>
            <li>Local packet/ref integrity verified: {String(result.relation.local_integrity_verified)}</li>
            <li>Actual use remains reviewable: {String(result.relation.actual_use_review_required)}</li>
            <li>Helpfulness established: {String(result.relation.helpfulness_established)}</li>
          </ul>
        </section>

        <section className={styles.materialCard} aria-label="Reported citations">
          <h3>Reported use and exact citations</h3>
          <p className={styles.copy}>
            Reported payload use: {result.packet_consumption.reported_payload_use}
          </p>
          {result.packet_consumption.cited_selected_context.length === 0 ? (
            <p className={styles.empty}>No accepted-state citation was reported.</p>
          ) : (
            <ol className={styles.plainList}>
              {result.packet_consumption.cited_selected_context.map((entry) => (
                <li key={entry.entry_id}>
                  <strong>{entry.entry_id}</strong>
                  <span className={styles.identifier}>{entry.state_ref.external_id}</span>
                  <span className={styles.identifier}>{entry.state_fingerprint}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
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

function isCodexResultReportInput(value: unknown): value is CodexResultReportInputV01 {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const report = value as Record<string, unknown>;
  return (
    report.input_version === CODEX_RESULT_REPORT_INPUT_VERSION &&
    typeof report.report_id === "string" &&
    report.report_id.length > 0 &&
    typeof report.report_kind === "string" &&
    Array.isArray(report.source_refs) &&
    report.source_refs.every((item) => typeof item === "string")
  );
}

function laterResultReadModelMatchesHandoff(
  value: LaterResultReadModelFieldsV01,
  handoff: VNextOperatorPilotPacketHandoffV01,
): boolean {
  if (
    value.workspace_id !== handoff.workspace_id ||
    value.project_id !== handoff.project_id ||
    value.source_transition_receipt.transition_receipt_id !==
      handoff.source_transition_receipt.transition_receipt_id ||
    value.source_transition_receipt.transition_receipt_fingerprint !==
      handoff.source_transition_receipt.transition_receipt_fingerprint ||
    value.receipt.workspace_id !== handoff.workspace_id ||
    value.receipt.project_id !== handoff.project_id ||
    value.receipt.task_context_packet_ref?.external_id !== handoff.packet.packet_id ||
    value.receipt.task_context_packet_ref.source_ref !==
      handoff.packet.packet_fingerprint ||
    value.relation.selected_state_refs_cited !==
      (value.packet_consumption.cited_selected_context.length > 0) ||
    !relationIsConservative(value) ||
    value.proposal_created !== false ||
    value.decision_created !== false ||
    value.transition_created !== false ||
    value.evidence_accepted !== false ||
    value.work_closed !== false ||
    !runReceiptAuthorityIsBounded(value.receipt)
  ) {
    return false;
  }
  const acceptedById = new Map(
    handoff.accepted_state_refs.map((entry) => [entry.entry_id, entry]),
  );
  return value.packet_consumption.cited_selected_context.every((cited) => {
    const expected = acceptedById.get(cited.entry_id);
    return (
      expected !== undefined &&
      cited.state_fingerprint === expected.state_fingerprint &&
      sameExternalRef(cited.state_ref, expected.state_ref)
    );
  });
}

function relationIsConservative(value: LaterResultReadModelFieldsV01): boolean {
  return (
    value.relation.packet_referenced === true &&
    value.relation.payload_use_reported === true &&
    value.relation.local_integrity_verified === true &&
    value.relation.actual_use_review_required === true &&
    value.relation.helpfulness_established === false
  );
}

function sameStringSet(left: string[], right: string[]): boolean {
  const sortedLeft = [...left].sort();
  const sortedRight = [...right].sort();
  return (
    sortedLeft.length === sortedRight.length &&
    sortedLeft.every((item, index) => item === sortedRight[index])
  );
}

function sameExternalRef(left: ExternalRefV01, right: ExternalRefV01): boolean {
  return (
    left.ref_version === right.ref_version &&
    left.ref_type === right.ref_type &&
    left.external_id === right.external_id &&
    (left.provider ?? null) === (right.provider ?? null) &&
    (left.host ?? null) === (right.host ?? null) &&
    (left.observed_at ?? null) === (right.observed_at ?? null) &&
    (left.source_ref ?? null) === (right.source_ref ?? null) &&
    (left.compatibility_namespace ?? null) ===
      (right.compatibility_namespace ?? null) &&
    left.trust_class === right.trust_class
  );
}

function runReceiptAuthorityIsBounded(receipt: RunReceiptV01): boolean {
  return Object.entries(receipt.authority_summary).every(
    ([key, value]) => key === "notes" || value === false,
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
