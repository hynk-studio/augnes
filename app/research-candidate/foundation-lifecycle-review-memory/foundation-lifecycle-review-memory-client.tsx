"use client";

import type { CSSProperties } from "react";
import { useMemo, useState } from "react";

import {
  getDefaultFoundationLifecycleReviewMemoryStorePath,
  getFoundationLifecycleReviewMemoryReadonlySections,
  getFoundationLifecycleReviewMemoryReadonlySectionKinds,
  getFoundationLifecycleReviewMemoryReadonlyUiAuthorityBoundary,
  getFoundationLifecycleReviewMemoryReadonlyUiBoundaryNotes,
  isSafeFoundationLifecycleReviewMemoryDisplayText,
  type FoundationLifecycleReviewMemoryReadonlyUiPanelState,
} from "@/lib/research-candidate-review/foundation-lifecycle-review-memory-ui-contract";

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

type ReviewMemorySnapshot = {
  store_version?: unknown;
  record_count?: unknown;
  active_record_refs?: unknown;
  discarded_record_refs?: unknown;
  superseded_record_refs?: unknown;
  records?: unknown;
};

type ReviewMemoryRouteResponse = {
  status?: "ok" | "error";
  snapshot?: ReviewMemorySnapshot;
  error_code?: unknown;
  boundary_notes?: unknown;
};

const routePath = "/api/research-candidate/review-memory";
const uiVersion = "foundation_lifecycle_review_memory_readonly_ui.v0.1";
const uiStatus = "readonly_ui_only";
const defaultAsOf = "2026-06-25T00:00:00.000Z";

const sectionLabels = [
  "Foundation Status",
  "Lifecycle Summary",
  "Calibration Summary",
  "Logical Claim Shape Summary",
  "Feedback-to-Rule Summary",
  "Temporal Handoff Summary",
  "Target-Agent Packet Profile Summary",
  "Review Memory Snapshot Summary",
  "Authority Boundary",
  "Deferred Work",
] as const;

const requiredBoundaryLabels = [
  "Review memory is not truth.",
  "Candidate memory is not Perspective state.",
  "Lifecycle status is derived review context, not source of truth.",
  "Calibration context is diagnostic, not readiness authority.",
  "Logical shape context is structure-only, not proof.",
  "Feedback-to-Rule context is candidate-only, not rule mutation.",
  "Temporal handoff context is diagnostic, not authority.",
  "Target-agent packet profile is advisory, not prompt execution.",
  "Discard is not deletion.",
  "Supersede preserves lineage.",
  "Source refs are lineage pointers, not proof.",
  "Source refs must be public-safe symbolic refs.",
  "Product-write remains parked by #686.",
] as const;

const sampleRows: SnapshotRecord[] = [
  {
    record_id: "ui-readonly-active-001",
    record_kind: "candidate_review_snapshot",
    lifecycle_state: "active",
    review_decision: "keep_for_review",
    candidate_ref: "claim-readonly-active-001",
    source_refs: ["source:readonly-active-001"],
    related_record_refs: [],
    privacy_report: { privacy_class: "public_safe" },
    updated_at: defaultAsOf,
  },
  {
    record_id: "ui-readonly-discarded-001",
    record_kind: "operator_review_note",
    lifecycle_state: "discarded",
    review_decision: "discard",
    candidate_ref: "claim-readonly-discarded-001",
    source_refs: ["source:readonly-discarded-001"],
    related_record_refs: ["ui-readonly-active-001"],
    privacy_report: { privacy_class: "public_safe" },
    updated_at: "2026-06-25T00:00:01.000Z",
  },
  {
    record_id: "ui-readonly-superseded-001",
    record_kind: "diagnostic_summary",
    lifecycle_state: "superseded",
    review_decision: "supersede",
    candidate_ref: "claim-readonly-superseded-001",
    source_refs: ["source:readonly-superseded-001"],
    related_record_refs: ["ui-readonly-active-001", "ui-readonly-discarded-001"],
    privacy_report: { privacy_class: "public_safe" },
    updated_at: "2026-06-25T00:00:02.000Z",
  },
];

export function FoundationLifecycleReviewMemoryClient() {
  const [storeFilePath, setStoreFilePath] = useState(
    getDefaultFoundationLifecycleReviewMemoryStorePath(),
  );
  const [asOf, setAsOf] = useState(defaultAsOf);
  const [lastResponse, setLastResponse] = useState<ReviewMemoryRouteResponse | null>(null);
  const [loadStatus, setLoadStatus] = useState<"not_loaded" | "ok" | "error">("not_loaded");
  const [safeErrorCode, setSafeErrorCode] = useState("none");
  const sections = useMemo(() => getFoundationLifecycleReviewMemoryReadonlySections(), []);
  const sectionKinds = useMemo(() => getFoundationLifecycleReviewMemoryReadonlySectionKinds(), []);
  const authorityBoundary = useMemo(
    () => getFoundationLifecycleReviewMemoryReadonlyUiAuthorityBoundary(),
    [],
  );
  const contractBoundaryNotes = useMemo(
    () => getFoundationLifecycleReviewMemoryReadonlyUiBoundaryNotes(),
    [],
  );
  const snapshot = lastResponse?.snapshot ?? null;
  const loadedRows = useMemo(() => extractRows(snapshot), [snapshot]);
  const displayRows = loadedRows.length > 0 ? loadedRows : sampleRows;
  const recordCount = loadedRows.length > 0 ? loadedRows.length : sampleRows.length;
  const routeBoundaryNotes = getSafeStringList(lastResponse?.boundary_notes);
  const boundaryNotes = routeBoundaryNotes.length > 0 ? routeBoundaryNotes : contractBoundaryNotes;
  const panelState: FoundationLifecycleReviewMemoryReadonlyUiPanelState = {
    ui_version: uiVersion,
    status: uiStatus,
    store_file_path: storeFilePath,
    as_of: asOf,
    loaded_route_status: loadStatus,
    loaded_record_count: recordCount,
    section_kinds: sectionKinds,
    boundary_notes: boundaryNotes,
    authority_boundary: authorityBoundary,
  };

  async function loadReviewMemorySnapshot() {
    setLoadStatus("not_loaded");
    setSafeErrorCode("none");
    const query = new URLSearchParams({
      store_file_path: storeFilePath,
      allow_empty: "1",
      as_of: asOf,
    });
    try {
      const response = await fetch(`${routePath}?${query.toString()}`, { method: "GET" });
      const body = (await response.json()) as ReviewMemoryRouteResponse;
      setLastResponse({
        ...body,
        status: body.status === "ok" ? "ok" : "error",
      });
      if (!response.ok || body.status !== "ok") {
        setLoadStatus("error");
        setSafeErrorCode(safeText(body.error_code ?? "route_error"));
        return;
      }
      setLoadStatus("ok");
    } catch {
      setLastResponse(null);
      setLoadStatus("error");
      setSafeErrorCode("route_request_failed");
    }
  }

  return (
    <section
      style={surfaceStyle}
      data-augnes-surface="foundation-lifecycle-review-memory-readonly-ui"
      data-augnes-readonly-ui-only="true"
    >
      <section style={boundaryBandStyle} aria-label="Read-only UI boundary">
        {requiredBoundaryLabels.map((label) => (
          <span key={label} style={boundaryPillStyle}>
            {label}
          </span>
        ))}
      </section>

      <section style={panelStyle} aria-label="Read-only route controls">
        <div>
          <h2 style={sectionHeadingStyle}>Review Memory Snapshot Summary</h2>
          <p style={hintStyle}>
            Read-only UI. Load review memory snapshot uses GET only against the #771 route.
            Store paths remain constrained by the #771 route allowlist.
          </p>
        </div>
        <div style={controlGridStyle}>
          <label style={labelStyle} htmlFor="foundation-lifecycle-store-path">
            store_file_path
          </label>
          <input
            id="foundation-lifecycle-store-path"
            value={storeFilePath}
            onChange={(event) => {
              if (isSafeFoundationLifecycleReviewMemoryDisplayText(event.target.value)) {
                setStoreFilePath(event.target.value);
              }
            }}
            style={inputStyle}
            spellCheck={false}
          />
          <label style={labelStyle} htmlFor="foundation-lifecycle-as-of">
            as_of
          </label>
          <input
            id="foundation-lifecycle-as-of"
            value={asOf}
            onChange={(event) => setAsOf(event.target.value)}
            style={inputStyle}
            spellCheck={false}
          />
        </div>
        <button type="button" onClick={loadReviewMemorySnapshot} style={buttonStyle}>
          Load review memory snapshot
        </button>
        <dl style={statusGridStyle}>
          <StatusItem label="ui_version" value={panelState.ui_version} />
          <StatusItem label="status" value={panelState.status} />
          <StatusItem label="loaded_route_status" value={panelState.loaded_route_status ?? "not_loaded"} />
          <StatusItem label="loaded_record_count" value={String(panelState.loaded_record_count ?? 0)} />
          <StatusItem label="error_code" value={safeErrorCode} />
        </dl>
      </section>

      <section style={sectionsGridStyle} aria-label="Read-only section summaries">
        {sectionLabels.map((label) => {
          const section = sections.find((item) => item.title === label);
          return (
            <article key={label} style={summaryPanelStyle}>
              <h2 style={sectionHeadingStyle}>{label}</h2>
              <p style={statusTextStyle}>{safeText(section?.status ?? "not_configured")}</p>
              <p style={summaryTextStyle}>{safeText(section?.summary ?? "No summary configured.")}</p>
              <dl style={metricGridStyle}>
                {Object.entries(section?.metrics ?? {}).map(([key, value]) => (
                  <StatusItem key={key} label={key} value={safeText(value)} />
                ))}
              </dl>
              <p style={boundaryTextStyle}>{safeText(section?.boundary_note ?? "Read-only UI.")}</p>
            </article>
          );
        })}
      </section>

      <section style={panelStyle} aria-label="Review memory bounded rows">
        <h2 style={sectionHeadingStyle}>Review Memory Snapshot Summary</h2>
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
                ].map((heading) => (
                  <th key={heading} style={tableHeaderStyle}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayRows.map((row, index) => (
                <tr key={`${safeText(row.record_id)}-${index}`}>
                  <td style={tableCellStyle}>{safeText(row.record_id)}</td>
                  <td style={tableCellStyle}>{safeText(row.record_kind)}</td>
                  <td style={tableCellStyle}>{safeText(row.lifecycle_state)}</td>
                  <td style={tableCellStyle}>{safeText(row.review_decision)}</td>
                  <td style={tableCellStyle}>{safeText(row.candidate_ref)}</td>
                  <td style={tableCellStyle}>{String(countArray(row.source_refs))}</td>
                  <td style={tableCellStyle}>{String(countArray(row.related_record_refs))}</td>
                  <td style={tableCellStyle}>{safeText(row.privacy_report?.privacy_class)}</td>
                  <td style={tableCellStyle}>{safeText(row.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section style={panelStyle} aria-label="Authority Boundary">
        <h2 style={sectionHeadingStyle}>Authority Boundary</h2>
        <div style={boundaryFlagGridStyle}>
          {Object.entries(authorityBoundary).map(([key, value]) => (
            <span key={key} style={boundaryFlagStyle}>
              {key}: {String(value)}
            </span>
          ))}
        </div>
        <ul style={listStyle}>
          {boundaryNotes.map((note) => (
            <li key={note}>{safeText(note)}</li>
          ))}
        </ul>
      </section>

      <section style={panelStyle} aria-label="Deferred Work">
        <h2 style={sectionHeadingStyle}>Deferred Work</h2>
        <ul style={listStyle}>
          {[
            "Bounded Source Intake Runtime Contract",
            "Bounded Source Intake Runtime",
            "Provider-Assisted Extraction candidate-only contract",
            "Provider-Assisted Extraction runtime",
            "Retrieval/RAG runtime",
            "Dogfooding ingestion route",
            "Codex result report ingestion",
            "Feedback aggregation runtime",
            "Feedback controls expansion",
            "Human-reviewed promotion",
            "Formation Receipt durable write",
            "Durable Perspective state apply",
            "Git Ledger export",
            "Product write reentry",
          ].map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </section>
  );
}

function StatusItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={statusItemStyle}>
      <dt style={statusLabelStyle}>{label}</dt>
      <dd style={statusValueStyle}>{safeText(value)}</dd>
    </div>
  );
}

function extractRows(snapshot: ReviewMemorySnapshot | null): SnapshotRecord[] {
  if (!Array.isArray(snapshot?.records)) return [];
  return snapshot.records.filter(isRecordObject).map((record) => record as SnapshotRecord);
}

function isRecordObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function countArray(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

function getSafeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .filter(isSafeFoundationLifecycleReviewMemoryDisplayText);
}

function safeText(value: unknown, fallback = "blocked_unsafe_display_text"): string {
  if (value === undefined || value === null || value === "") return "none";
  const text = typeof value === "string" ? value : String(value);
  return isSafeFoundationLifecycleReviewMemoryDisplayText(text) ? text : fallback;
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

const panelStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
  alignContent: "start",
  padding: "16px",
  border: "1px solid #d7dde6",
  borderRadius: "8px",
  background: "#ffffff",
};

const summaryPanelStyle: CSSProperties = {
  ...panelStyle,
  minHeight: "210px",
};

const sectionsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: "16px",
};

const sectionHeadingStyle: CSSProperties = {
  margin: 0,
  fontSize: "18px",
  lineHeight: 1.25,
  letterSpacing: "0",
};

const hintStyle: CSSProperties = {
  margin: 0,
  color: "#56667c",
  fontSize: "13px",
  lineHeight: 1.5,
};

const controlGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "140px minmax(0, 1fr)",
  gap: "8px",
  alignItems: "center",
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

const buttonStyle: CSSProperties = {
  minHeight: "36px",
  justifySelf: "start",
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
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
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

const statusTextStyle: CSSProperties = {
  margin: 0,
  color: "#526073",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  fontSize: "12px",
};

const summaryTextStyle: CSSProperties = {
  margin: 0,
  color: "#243447",
  fontSize: "13px",
  lineHeight: 1.5,
};

const boundaryTextStyle: CSSProperties = {
  margin: 0,
  color: "#45566e",
  fontSize: "12px",
  fontWeight: 700,
};

const metricGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
  gap: "8px",
  margin: 0,
};

const tableWrapStyle: CSSProperties = {
  overflowX: "auto",
};

const tableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: "900px",
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

const listStyle: CSSProperties = {
  margin: 0,
  paddingLeft: "18px",
  color: "#334155",
  lineHeight: 1.55,
};
