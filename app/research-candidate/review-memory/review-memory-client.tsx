"use client";

import type { CSSProperties, FormEvent } from "react";
import { useMemo, useState } from "react";

import {
  getDefaultReviewMemoryUiStorePath,
  getReviewMemoryUiAuthorityBoundary,
  getReviewMemoryUiBoundaryNotes,
  isSafeReviewMemoryUiDisplayText,
  type ReviewMemoryUiAction,
  type ReviewMemoryUiPanelState,
} from "@/lib/research-candidate-review/review-memory-ui-contract";

type RoutePostAction = Exclude<ReviewMemoryUiAction, "load_snapshot">;

type SnapshotRecord = {
  record_id?: unknown;
  record_kind?: unknown;
  lifecycle_state?: unknown;
  review_decision?: unknown;
  candidate_ref?: unknown;
  source_refs?: unknown;
  related_record_refs?: unknown;
  privacy_report?: Record<string, unknown>;
  updated_at?: unknown;
};

type SnapshotSummary = {
  store_version: string;
  record_count: number;
  active_count: number;
  discarded_count: number;
  superseded_count: number;
};

type ReviewMemorySnapshot = {
  store_version?: unknown;
  record_count?: unknown;
  active_record_refs?: unknown;
  discarded_record_refs?: unknown;
  superseded_record_refs?: unknown;
  records?: unknown;
};

type ReviewMemoryRouteResponse = {
  route_version?: unknown;
  scope?: unknown;
  status?: "ok" | "error";
  action?: unknown;
  snapshot?: ReviewMemorySnapshot;
  error_code?: unknown;
  boundary_notes?: unknown;
};

const reviewMemoryRoutePath = "/api/research-candidate/review-memory";
const routeVersion = "research_candidate_review_memory_routes.v0.1";
const uiVersion = "research_candidate_review_memory_ui.v0.1";
const uiStatus = "ui_route_client_only";
const routeScope = "project:augnes";
const maxJsonInputLength = 16000;
const defaultAsOf = "2026-06-25T00:00:00.000Z";
const requiredUiBoundaryLabels = [
  "Review memory is not truth.",
  "Candidate memory is not Perspective state.",
  "Discard is not deletion.",
  "Supersede preserves lineage.",
  "Source refs are lineage pointers, not proof.",
  "Source refs must be public-safe symbolic refs.",
  "Product-write remains parked by #686.",
] as const;

const sampleRecordJson = JSON.stringify(
  {
    record_version: "research_candidate_review_memory_record.v0.1",
    scope: "project:augnes",
    status: "contract_only",
    record_id: "ui-record-active-001",
    record_kind: "operator_review_note",
    lifecycle_state: "active",
    candidate_ref: "claim-ui-active-001",
    candidate_family: "claim",
    source_refs: [
      {
        source_surface: "manual_source_ref",
        source_ref: "manual-source-ref:ui-preview-001",
        public_safe: true,
      },
    ],
    related_record_refs: [],
    review_decision: "keep_for_review",
    bounded_summary: "UI sample record stores bounded review metadata only.",
    operator_note_summary: "Operator-visible summary is public-safe.",
    created_at: defaultAsOf,
    updated_at: defaultAsOf,
    privacy_report: {
      privacy_class: "public_safe",
      public_safe: true,
      raw_conversation_included: false,
      hidden_reasoning_included: false,
      raw_source_body_included: false,
      raw_candidate_payload_included: false,
      raw_provider_output_included: false,
      provider_thread_run_session_ids_included: false,
      private_urls_included: false,
      local_private_paths_included: false,
      secrets_included: false,
      raw_db_rows_included: false,
      raw_browser_dump_included: false,
      blocked_reason_codes: [],
    },
    reason_codes: [
      "candidate_ref_present",
      "source_ref_present",
      "privacy_boundary_preserved",
      "contract_only_not_runtime_memory",
      "candidate_memory_not_truth",
      "review_memory_not_promotion",
      "product_write_denied",
    ],
    authority_boundary: {
      contract_only: true,
      runtime_memory_write_now: false,
      db_query_or_write_now: false,
      source_of_truth: false,
      proof_or_evidence_record: false,
      perspective_promotion: false,
      durable_perspective_state: false,
      work_mutation: false,
      codex_execution_authority: false,
      github_automation_authority: false,
      provider_openai_authority: false,
      source_fetch_authority: false,
      retrieval_rag_authority: false,
      git_ledger_export_authority: false,
      product_write_authority: false,
      product_id_allocation_authority: false,
    },
  },
  null,
  2,
);

const sampleSupersedingRecordJson = JSON.stringify(
  {
    record_version: "research_candidate_review_memory_record.v0.1",
    scope: "project:augnes",
    status: "contract_only",
    record_id: "ui-record-superseding-001",
    record_kind: "diagnostic_summary",
    lifecycle_state: "active",
    candidate_ref: "claim-ui-superseding-001",
    source_refs: [
      {
        source_surface: "manual_source_ref",
        source_ref: "manual-source-ref:ui-superseding-001",
        public_safe: true,
      },
    ],
    related_record_refs: ["ui-record-active-001"],
    review_decision: "keep_for_review",
    bounded_summary: "Superseding UI sample record preserves bounded lineage.",
    created_at: defaultAsOf,
    updated_at: "2026-06-25T00:00:01.000Z",
    privacy_report: {
      privacy_class: "public_safe",
      public_safe: true,
      raw_conversation_included: false,
      hidden_reasoning_included: false,
      raw_source_body_included: false,
      raw_candidate_payload_included: false,
      raw_provider_output_included: false,
      provider_thread_run_session_ids_included: false,
      private_urls_included: false,
      local_private_paths_included: false,
      secrets_included: false,
      raw_db_rows_included: false,
      raw_browser_dump_included: false,
      blocked_reason_codes: [],
    },
    reason_codes: [
      "candidate_ref_present",
      "source_ref_present",
      "supersede_preserves_lineage",
      "privacy_boundary_preserved",
      "contract_only_not_runtime_memory",
      "candidate_memory_not_truth",
      "review_memory_not_promotion",
      "product_write_denied",
    ],
    authority_boundary: {
      contract_only: true,
      runtime_memory_write_now: false,
      db_query_or_write_now: false,
      source_of_truth: false,
      proof_or_evidence_record: false,
      perspective_promotion: false,
      durable_perspective_state: false,
      work_mutation: false,
      codex_execution_authority: false,
      github_automation_authority: false,
      provider_openai_authority: false,
      source_fetch_authority: false,
      retrieval_rag_authority: false,
      git_ledger_export_authority: false,
      product_write_authority: false,
      product_id_allocation_authority: false,
    },
  },
  null,
  2,
);

export function ReviewMemoryClient() {
  const [storeFilePath, setStoreFilePath] = useState(getDefaultReviewMemoryUiStorePath());
  const [asOf, setAsOf] = useState(defaultAsOf);
  const [selectedAction, setSelectedAction] = useState<ReviewMemoryUiAction>("load_snapshot");
  const [lastResponse, setLastResponse] = useState<ReviewMemoryRouteResponse | null>(null);
  const [uiError, setUiError] = useState<string | null>(null);
  const [recordJson, setRecordJson] = useState(sampleRecordJson);
  const [discardRecordId, setDiscardRecordId] = useState("ui-record-active-001");
  const [discardReason, setDiscardReason] = useState("Operator discarded this review metadata record.");
  const [supersedeRecordId, setSupersedeRecordId] = useState("ui-record-active-001");
  const [supersedingRecordJson, setSupersedingRecordJson] = useState(sampleSupersedingRecordJson);
  const authorityBoundary = useMemo(() => getReviewMemoryUiAuthorityBoundary(), []);
  const contractBoundaryNotes = useMemo(() => getReviewMemoryUiBoundaryNotes(), []);

  const snapshot = lastResponse?.snapshot ?? null;
  const summary = useMemo(() => buildSnapshotSummary(snapshot), [snapshot]);
  const records = useMemo(() => extractRecords(snapshot), [snapshot]);
  const routeBoundaryNotes = getSafeStringList(lastResponse?.boundary_notes);
  const displayedBoundaryNotes =
    routeBoundaryNotes.length > 0 ? routeBoundaryNotes : contractBoundaryNotes;
  const storePathAdvisory = storePathLooksAllowed(storeFilePath)
    ? "matches #771 allowlist shape"
    : "route will validate and may return unsafe_store_file_path";
  const panelState: ReviewMemoryUiPanelState = {
    ui_version: uiVersion,
    status: uiStatus,
    store_file_path: storeFilePath,
    as_of: asOf,
    selected_action: selectedAction,
    last_error_code: safeDisplayText(lastResponse?.error_code ?? uiError ?? undefined),
    last_route_status: lastResponse?.status,
    record_count: summary.record_count,
    boundary_notes: displayedBoundaryNotes,
    authority_boundary: authorityBoundary,
  };

  async function loadSnapshot() {
    setSelectedAction("load_snapshot");
    setUiError(null);
    const query = new URLSearchParams({
      store_file_path: storeFilePath,
      allow_empty: "1",
      as_of: asOf,
    });
    await requestRoute(`${reviewMemoryRoutePath}?${query.toString()}`, { method: "GET" });
  }

  async function createEmptySnapshot() {
    await postRouteAction("create_empty_snapshot", {});
  }

  async function upsertRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const record = parseJsonInput(recordJson, "upsert record");
    if (!record) return;
    await postRouteAction("upsert_record", { record });
  }

  async function discardRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!discardRecordId.trim()) {
      setUiError("discard_record requires a public-safe record_id");
      return;
    }
    await postRouteAction("discard_record", {
      discard: {
        record_id: discardRecordId.trim(),
        discard_reason: discardReason.trim() || "Operator discarded this review metadata record.",
        updated_at: asOf,
      },
    });
  }

  async function supersedeRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supersedeRecordId.trim()) {
      setUiError("supersede_record requires a public-safe record_id");
      return;
    }
    const supersedingRecord = parseJsonInput(supersedingRecordJson, "superseding record");
    if (!supersedingRecord) return;
    await postRouteAction("supersede_record", {
      supersede: {
        record_id: supersedeRecordId.trim(),
        superseding_record: supersedingRecord,
      },
    });
  }

  async function postRouteAction(action: RoutePostAction, payload: Record<string, unknown>) {
    setSelectedAction(action);
    setUiError(null);
    await requestRoute(reviewMemoryRoutePath, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        route_version: routeVersion,
        scope: routeScope,
        action,
        store_file_path: storeFilePath,
        as_of: asOf,
        ...payload,
      }),
    });
  }

  async function requestRoute(input: string, init: RequestInit) {
    try {
      const response = await fetch(input, init);
      const body = (await response.json()) as ReviewMemoryRouteResponse;
      setLastResponse({
        ...body,
        status: body.status === "ok" ? "ok" : "error",
      });
      if (!response.ok || body.status !== "ok") {
        setUiError(safeDisplayText(body.error_code ?? "route_error"));
      }
    } catch {
      setLastResponse({
        route_version: routeVersion,
        scope: routeScope,
        status: "error",
        error_code: "route_request_failed",
        boundary_notes: contractBoundaryNotes,
      });
      setUiError("route_request_failed");
    }
  }

  function parseJsonInput(value: string, label: string): unknown | null {
    try {
      return JSON.parse(value);
    } catch {
      setUiError(`${label} JSON is invalid`);
      return null;
    }
  }

  function handleStoreFilePathChange(value: string) {
    if (!isSafeReviewMemoryUiDisplayText(value)) {
      setUiError("store_file_path input blocked by UI display safety");
      return;
    }
    setStoreFilePath(value);
  }

  function handleBoundedJsonChange(value: string, setter: (nextValue: string) => void) {
    if (value.length > maxJsonInputLength) {
      setUiError("JSON input exceeds bounded UI length");
      return;
    }
    if (!isSafeReviewMemoryUiDisplayText(value)) {
      setUiError("JSON input blocked by UI display safety");
      return;
    }
    setter(value);
  }

  return (
    <section
      style={surfaceStyle}
      data-augnes-surface="research-candidate-review-memory-ui"
      data-augnes-review-memory-ui-route-client-only="true"
    >
      <section style={boundaryBandStyle} aria-label="Review memory boundary">
        {requiredUiBoundaryLabels.map((note) => (
          <span key={note} style={boundaryPillStyle}>
            {note}
          </span>
        ))}
      </section>

      <section style={gridStyle}>
        <section style={panelStyle} aria-label="Store path controls">
          <h2 style={sectionHeadingStyle}>Route Controls</h2>
          <label style={labelStyle} htmlFor="review-memory-store-path">
            store_file_path
          </label>
          <input
            id="review-memory-store-path"
            value={storeFilePath}
            onChange={(event) => handleStoreFilePathChange(event.target.value)}
            style={inputStyle}
            spellCheck={false}
          />
          <p style={hintStyle}>
            Synthetic/local default: tmp/research-candidate-review-memory/ui-preview-store.json.
            Review before use. Allowlist: tmp/research-candidate-review-memory/*.json and
            .tmp/research-candidate-review-memory/*.json. Advisory: {storePathAdvisory}.
          </p>

          <label style={labelStyle} htmlFor="review-memory-as-of">
            as_of
          </label>
          <input
            id="review-memory-as-of"
            value={asOf}
            onChange={(event) => setAsOf(event.target.value)}
            style={inputStyle}
            spellCheck={false}
          />

          <div style={buttonRowStyle}>
            <button type="button" onClick={loadSnapshot} style={buttonStyle}>
              Load snapshot
            </button>
            <button type="button" onClick={createEmptySnapshot} style={buttonStyle}>
              Create empty snapshot
            </button>
          </div>
        </section>

        <section style={panelStyle} aria-label="Route response status">
          <h2 style={sectionHeadingStyle}>Route Status</h2>
          <dl style={statusGridStyle}>
            <StatusItem label="ui_version" value={panelState.ui_version} />
            <StatusItem label="status" value={panelState.status} />
            <StatusItem label="selected_action" value={panelState.selected_action ?? "none"} />
            <StatusItem label="route_status" value={panelState.last_route_status ?? "not_loaded"} />
            <StatusItem label="error_code" value={panelState.last_error_code ?? "none"} />
            <StatusItem label="record_count" value={String(panelState.record_count ?? 0)} />
          </dl>
          <div style={boundaryFlagGridStyle} aria-label="UI authority flags">
            <BoundaryFlag label="route_backed_only" value={authorityBoundary.route_backed_only} />
            <BoundaryFlag
              label="automatic_write_on_load"
              value={authorityBoundary.automatic_write_on_load}
            />
            <BoundaryFlag
              label="direct_store_helper_write_now"
              value={authorityBoundary.direct_store_helper_write_now}
            />
            <BoundaryFlag
              label="product_write_authority"
              value={authorityBoundary.product_write_authority}
            />
          </div>
          {uiError ? <p style={errorStyle}>UI status: {safeDisplayText(uiError)}</p> : null}
        </section>
      </section>

      <section style={gridStyle}>
        <form style={panelStyle} onSubmit={upsertRecord} aria-label="Upsert record form">
          <h2 style={sectionHeadingStyle}>Upsert record</h2>
          <label style={labelStyle} htmlFor="review-memory-record-json">
            Bounded record JSON
          </label>
          <textarea
            id="review-memory-record-json"
            value={recordJson}
            onChange={(event) => handleBoundedJsonChange(event.target.value, setRecordJson)}
            style={textareaStyle}
            spellCheck={false}
          />
          <button type="submit" style={buttonStyle}>
            Upsert record
          </button>
        </form>

        <form style={panelStyle} onSubmit={discardRecord} aria-label="Discard record form">
          <h2 style={sectionHeadingStyle}>Discard record</h2>
          <p style={hintStyle}>Discard is not deletion.</p>
          <label style={labelStyle} htmlFor="review-memory-discard-record-id">
            record_id
          </label>
          <input
            id="review-memory-discard-record-id"
            value={discardRecordId}
            onChange={(event) => {
              if (isSafeReviewMemoryUiDisplayText(event.target.value)) {
                setDiscardRecordId(event.target.value);
              }
            }}
            style={inputStyle}
            spellCheck={false}
          />
          <label style={labelStyle} htmlFor="review-memory-discard-reason">
            discard_reason
          </label>
          <textarea
            id="review-memory-discard-reason"
            value={discardReason}
            onChange={(event) => handleBoundedJsonChange(event.target.value, setDiscardReason)}
            style={smallTextareaStyle}
            spellCheck={false}
          />
          <button type="submit" style={buttonStyle}>
            Discard record
          </button>
        </form>
      </section>

      <form style={panelStyle} onSubmit={supersedeRecord} aria-label="Supersede record form">
        <h2 style={sectionHeadingStyle}>Supersede record</h2>
        <p style={hintStyle}>Supersede preserves lineage.</p>
        <label style={labelStyle} htmlFor="review-memory-supersede-record-id">
          record_id
        </label>
        <input
          id="review-memory-supersede-record-id"
          value={supersedeRecordId}
          onChange={(event) => {
            if (isSafeReviewMemoryUiDisplayText(event.target.value)) {
              setSupersedeRecordId(event.target.value);
            }
          }}
          style={inputStyle}
          spellCheck={false}
        />
        <label style={labelStyle} htmlFor="review-memory-superseding-record-json">
          Bounded superseding_record JSON
        </label>
        <textarea
          id="review-memory-superseding-record-json"
          value={supersedingRecordJson}
          onChange={(event) => handleBoundedJsonChange(event.target.value, setSupersedingRecordJson)}
          style={textareaStyle}
          spellCheck={false}
        />
        <button type="submit" style={buttonStyle}>
          Supersede record
        </button>
      </form>

      <section style={gridStyle}>
        <section style={panelStyle} aria-label="Snapshot summary">
          <h2 style={sectionHeadingStyle}>Snapshot Summary</h2>
          <dl style={statusGridStyle}>
            <StatusItem label="store_version" value={summary.store_version} />
            <StatusItem label="record_count" value={String(summary.record_count)} />
            <StatusItem label="active_count" value={String(summary.active_count)} />
            <StatusItem label="discarded_count" value={String(summary.discarded_count)} />
            <StatusItem label="superseded_count" value={String(summary.superseded_count)} />
          </dl>
        </section>

        <section style={panelStyle} aria-label="Boundary notes">
          <h2 style={sectionHeadingStyle}>Boundary Notes</h2>
          <ul style={listStyle}>
            {displayedBoundaryNotes.map((note) => (
              <li key={note}>{safeDisplayText(note)}</li>
            ))}
          </ul>
        </section>
      </section>

      <section style={panelStyle} aria-label="Review memory records">
        <h2 style={sectionHeadingStyle}>Review Records</h2>
        <div style={tableWrapStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                {[
                  "record_id",
                  "record_kind",
                  "lifecycle_state",
                  "review_decision",
                  "candidate_ref",
                  "source_refs count",
                  "related_record_refs count",
                  "privacy_class",
                  "updated_at",
                  "privacy_report flags",
                ].map((heading) => (
                  <th key={heading} style={tableHeaderStyle}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td style={tableCellStyle} colSpan={10}>
                    No loaded review memory records.
                  </td>
                </tr>
              ) : (
                records.map((record, index) => (
                  <tr key={`${safeDisplayText(record.record_id)}-${index}`}>
                    <td style={tableCellStyle}>{safeDisplayText(record.record_id)}</td>
                    <td style={tableCellStyle}>{safeDisplayText(record.record_kind)}</td>
                    <td style={tableCellStyle}>{safeDisplayText(record.lifecycle_state)}</td>
                    <td style={tableCellStyle}>{safeDisplayText(record.review_decision)}</td>
                    <td style={tableCellStyle}>{safeDisplayText(record.candidate_ref)}</td>
                    <td style={tableCellStyle}>{String(countArray(record.source_refs))}</td>
                    <td style={tableCellStyle}>{String(countArray(record.related_record_refs))}</td>
                    <td style={tableCellStyle}>
                      {safeDisplayText(record.privacy_report?.privacy_class)}
                    </td>
                    <td style={tableCellStyle}>{safeDisplayText(record.updated_at)}</td>
                    <td style={tableCellStyle}>{formatPrivacyFlags(record.privacy_report)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

function StatusItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={statusItemStyle}>
      <dt style={statusLabelStyle}>{label}</dt>
      <dd style={statusValueStyle}>{safeDisplayText(value)}</dd>
    </div>
  );
}

function BoundaryFlag({ label, value }: { label: string; value: boolean }) {
  return (
    <span style={boundaryFlagStyle}>
      {label}: {String(value)}
    </span>
  );
}

function buildSnapshotSummary(snapshot: ReviewMemorySnapshot | null): SnapshotSummary {
  return {
    store_version: safeDisplayText(snapshot?.store_version ?? "not_loaded"),
    record_count: numberOrArrayLength(snapshot?.record_count, snapshot?.records),
    active_count: countArray(snapshot?.active_record_refs),
    discarded_count: countArray(snapshot?.discarded_record_refs),
    superseded_count: countArray(snapshot?.superseded_record_refs),
  };
}

function extractRecords(snapshot: ReviewMemorySnapshot | null): SnapshotRecord[] {
  if (!Array.isArray(snapshot?.records)) return [];
  return snapshot.records.filter(isRecordObject).map((record) => record as SnapshotRecord);
}

function isRecordObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function countArray(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

function numberOrArrayLength(value: unknown, fallbackArray: unknown): number {
  return typeof value === "number" ? value : countArray(fallbackArray);
}

function getSafeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string").filter(isSafeReviewMemoryUiDisplayText);
}

function safeDisplayText(value: unknown, fallback = "blocked_unsafe_display_text"): string {
  if (value === undefined || value === null || value === "") return "none";
  const text = typeof value === "string" ? value : String(value);
  return isSafeReviewMemoryUiDisplayText(text) ? text : fallback;
}

function formatPrivacyFlags(report: Record<string, unknown> | undefined): string {
  if (!report) return "none";
  const flags = [
    "public_safe",
    "raw_conversation_included",
    "hidden_reasoning_included",
    "raw_source_body_included",
    "raw_candidate_payload_included",
    "raw_provider_output_included",
    "private_urls_included",
    "local_private_paths_included",
    "secrets_included",
    "raw_db_rows_included",
    "raw_browser_dump_included",
  ];
  return flags.map((flag) => `${flag}=${String(Boolean(report[flag]))}`).join("; ");
}

function storePathLooksAllowed(value: string): boolean {
  if (!value.endsWith(".json")) return false;
  if (value.startsWith("/") || value.includes("\\") || value.includes("..") || value.includes("//")) {
    return false;
  }
  return (
    value.startsWith("tmp/research-candidate-review-memory/") ||
    value.startsWith(".tmp/research-candidate-review-memory/")
  );
}

const surfaceStyle: CSSProperties = {
  maxWidth: "1180px",
  margin: "0 auto",
  display: "grid",
  gap: "16px",
};

const boundaryBandStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  padding: "12px",
  border: "1px solid #d7dde6",
  borderRadius: "8px",
  background: "#ffffff",
};

const boundaryPillStyle: CSSProperties = {
  padding: "6px 8px",
  borderRadius: "6px",
  background: "#eef3f8",
  color: "#26384f",
  fontSize: "12px",
  fontWeight: 700,
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: "16px",
};

const panelStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
  alignContent: "start",
  padding: "16px",
  border: "1px solid #d7dde6",
  borderRadius: "8px",
  background: "#ffffff",
};

const sectionHeadingStyle: CSSProperties = {
  margin: 0,
  fontSize: "18px",
  lineHeight: 1.25,
  letterSpacing: "0",
};

const labelStyle: CSSProperties = {
  fontSize: "12px",
  fontWeight: 700,
  color: "#45566e",
};

const inputStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #c8d1dc",
  borderRadius: "6px",
  padding: "9px 10px",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  fontSize: "13px",
  color: "#18212f",
};

const textareaStyle: CSSProperties = {
  ...inputStyle,
  minHeight: "260px",
  resize: "vertical",
};

const smallTextareaStyle: CSSProperties = {
  ...inputStyle,
  minHeight: "82px",
  resize: "vertical",
};

const hintStyle: CSSProperties = {
  margin: 0,
  color: "#56667c",
  fontSize: "13px",
  lineHeight: 1.5,
};

const buttonRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
};

const buttonStyle: CSSProperties = {
  minHeight: "36px",
  border: "1px solid #274568",
  borderRadius: "6px",
  padding: "8px 12px",
  background: "#274568",
  color: "#ffffff",
  fontWeight: 700,
  cursor: "pointer",
};

const statusGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: "8px",
  margin: 0,
};

const statusItemStyle: CSSProperties = {
  minWidth: 0,
  padding: "8px",
  border: "1px solid #e0e5ec",
  borderRadius: "6px",
  background: "#f9fbfd",
};

const statusLabelStyle: CSSProperties = {
  margin: "0 0 4px",
  color: "#627086",
  fontSize: "11px",
  fontWeight: 700,
};

const statusValueStyle: CSSProperties = {
  margin: 0,
  overflowWrap: "anywhere",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  fontSize: "12px",
};

const boundaryFlagGridStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
};

const boundaryFlagStyle: CSSProperties = {
  padding: "6px 8px",
  border: "1px solid #d7dde6",
  borderRadius: "6px",
  color: "#31445f",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  fontSize: "12px",
};

const errorStyle: CSSProperties = {
  margin: 0,
  color: "#9a3412",
  fontSize: "13px",
  fontWeight: 700,
};

const listStyle: CSSProperties = {
  margin: 0,
  paddingLeft: "18px",
  color: "#334155",
  lineHeight: 1.55,
};

const tableWrapStyle: CSSProperties = {
  overflowX: "auto",
};

const tableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: "980px",
};

const tableHeaderStyle: CSSProperties = {
  padding: "8px",
  borderBottom: "1px solid #ccd5df",
  textAlign: "left",
  color: "#45566e",
  fontSize: "12px",
};

const tableCellStyle: CSSProperties = {
  padding: "8px",
  borderBottom: "1px solid #e5eaf0",
  verticalAlign: "top",
  overflowWrap: "anywhere",
  fontSize: "12px",
};
