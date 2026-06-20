"use client";

import { useEffect, useMemo, useState } from "react";

type StartupReadinessStatus =
  | "initialized"
  | "empty_runtime"
  | "validation_bounded"
  | "unavailable";

type StartupReadinessExpectedShape =
  | "state_brief"
  | "state_snapshot"
  | "state_trajectory"
  | "work_list"
  | "proposal_list"
  | "publication_summary"
  | "approval_gate_summary"
  | "manual_note_preview_drafts";

type StartupReadinessSurface = {
  id: string;
  label: string;
  route: string;
  expectedShape: StartupReadinessExpectedShape;
  initializedNote: string;
};

type StartupReadinessItem = {
  id: string;
  label: string;
  route: string;
  status: StartupReadinessStatus;
  http_status: number | null;
  fallback_reason: string | null;
  missing_tables: string[];
  note: string;
};

type StartupReadinessCounts = Record<StartupReadinessStatus, number>;

const STARTUP_READINESS_SURFACES: StartupReadinessSurface[] = [
  {
    id: "state_brief",
    label: "State brief",
    route: "/api/state/brief?scope=project:augnes",
    expectedShape: "state_brief",
    initializedNote: "State brief returned a route-compatible handoff shape.",
  },
  {
    id: "state_snapshot",
    label: "State snapshot",
    route: "/api/state/snapshot?scope=project:augnes",
    expectedShape: "state_snapshot",
    initializedNote: "State snapshot returned route-compatible state buckets.",
  },
  {
    id: "state_trajectory",
    label: "State trajectory",
    route: "/api/state/trajectory?scope=project:augnes",
    expectedShape: "state_trajectory",
    initializedNote: "State trajectory returned a route-compatible trajectory map.",
  },
  {
    id: "work_list",
    label: "Work list",
    route: "/api/work?scope=project:augnes",
    expectedShape: "work_list",
    initializedNote: "Work list returned a route-compatible work_items array.",
  },
  {
    id: "proposal_list",
    label: "Proposal list",
    route: "/api/proposals?scope=project:augnes",
    expectedShape: "proposal_list",
    initializedNote: "Proposal list returned a route-compatible proposals array.",
  },
  {
    id: "publication_summary",
    label: "Publication summary",
    route: "/api/publications/summary?scope=project:augnes",
    expectedShape: "publication_summary",
    initializedNote: "Publication summary returned route-compatible summary buckets.",
  },
  {
    id: "approval_gate_summary",
    label: "Approval gate summary",
    route: "/api/approval-gate-state/summary?scope=project:augnes",
    expectedShape: "approval_gate_summary",
    initializedNote:
      "Approval gate summary returned route-compatible summary and count buckets.",
  },
  {
    id: "manual_note_preview_drafts",
    label: "Manual note preview drafts",
    route:
      "/api/research-candidate-review/manual-note-preview-drafts?limit=10&lifecycle=active&sort=created_desc&warnings=all&candidates=all",
    expectedShape: "manual_note_preview_drafts",
    initializedNote:
      "Manual note preview draft list returned a route-compatible bounded list.",
  },
];

const EMPTY_READINESS_COUNTS: StartupReadinessCounts = {
  initialized: 0,
  empty_runtime: 0,
  validation_bounded: 0,
  unavailable: 0,
};

const STATUS_COPY: Record<StartupReadinessStatus, string> = {
  initialized: "Initialized",
  empty_runtime: "Empty runtime",
  validation_bounded: "Validation bounded",
  unavailable: "Unavailable",
};

const STARTUP_READINESS_BOUNDARY_COPY = [
  "Readiness is informational only.",
  "No setup, migration, seed, proof/evidence, work item, or promotion action is run from this panel.",
  "Controlled empty-runtime means the local DB may not be initialized for that surface.",
];

export function CockpitStartupReadinessReadout() {
  const [items, setItems] = useState<StartupReadinessItem[]>([]);
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [readinessError, setReadinessError] = useState<string | null>(null);

  const counts = useMemo(() => summarizeReadinessItems(items), [items]);

  async function refreshStartupReadiness() {
    setIsLoading(true);
    setReadinessError(null);

    try {
      const nextItems = await Promise.all(
        STARTUP_READINESS_SURFACES.map(checkStartupReadinessSurface),
      );
      setItems(nextItems);
      setLastCheckedAt(new Date().toISOString());
    } catch {
      setReadinessError("Startup readiness checks could not complete.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refreshStartupReadiness();
  }, []);

  return (
    <section
      className="perspective-inspector-section cockpit-startup-readiness"
      aria-label="Cockpit startup readiness"
      data-augnes-authority="read-only startup-readiness informational-only no-setup-no-migration-no-seed"
    >
      <div className="cockpit-startup-readiness-header">
        <div>
          <p className="panel-eyebrow">AUGNES / Startup</p>
          <h3>Startup readiness</h3>
          <p>
            Read-only route checks for initialized, empty-runtime, bounded
            validation, and unavailable startup surfaces.
          </p>
        </div>
        <button
          type="button"
          className="secondary-button"
          onClick={() => void refreshStartupReadiness()}
          disabled={isLoading}
        >
          {isLoading ? "Refreshing readiness..." : "Refresh readiness"}
        </button>
      </div>

      <ul className="manual-note-label-boundary-copy">
        {STARTUP_READINESS_BOUNDARY_COPY.map((boundary) => (
          <li key={boundary}>{boundary}</li>
        ))}
      </ul>

      <div
        className="cockpit-startup-readiness-counts"
        aria-label="Startup readiness counts"
      >
        <span>Initialized: {counts.initialized}</span>
        <span>Empty runtime: {counts.empty_runtime}</span>
        <span>Validation bounded: {counts.validation_bounded}</span>
        <span>Unavailable: {counts.unavailable}</span>
      </div>

      <p className="manual-note-runtime-hint">
        last_checked_at <code>{lastCheckedAt ?? "not checked yet"}</code>
      </p>

      {readinessError ? (
        <p className="manual-note-runtime-error" role="alert">
          {readinessError}
        </p>
      ) : null}

      <div className="cockpit-startup-readiness-grid">
        {STARTUP_READINESS_SURFACES.map((surface) => {
          const item = items.find((candidate) => candidate.id === surface.id);
          const status = item?.status ?? "unavailable";

          return (
            <article
              key={surface.id}
              className="cockpit-surface-card cockpit-startup-readiness-card"
            >
              <div className="cockpit-startup-readiness-card-header">
                <div>
                  <strong>{surface.label}</strong>
                  <code>{surface.route}</code>
                </div>
                <span
                  className={`status-pill startup-readiness-status startup-readiness-status-${status}`}
                >
                  {STATUS_COPY[status]}
                </span>
              </div>
              <div className="manual-note-preview-draft-grid">
                <span>
                  status <code>{item?.status ?? "unavailable"}</code>
                </span>
                <span>
                  http_status <code>{item?.http_status ?? "not checked"}</code>
                </span>
                <span>
                  fallback_reason{" "}
                  <code>{item?.fallback_reason ?? "none"}</code>
                </span>
                <span>
                  missing_tables{" "}
                  <code>
                    {item?.missing_tables.length
                      ? item.missing_tables.join(", ")
                      : "none"}
                  </code>
                </span>
              </div>
              <p className="manual-note-runtime-hint">
                {item?.note ??
                  "Readiness check has not completed for this surface yet."}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

async function checkStartupReadinessSurface(
  surface: StartupReadinessSurface,
): Promise<StartupReadinessItem> {
  try {
    const response = await fetch(surface.route, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });
    const payload = await readJsonPayload(response);

    return classifyStartupReadinessSurface({
      surface,
      httpStatus: response.status,
      payload,
    });
  } catch {
    return buildStartupReadinessItem({
      surface,
      status: "unavailable",
      httpStatus: null,
      payload: null,
      note:
        "Network, JSON parsing, or unexpected runtime failure made this surface unavailable.",
    });
  }
}

async function readJsonPayload(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new Error("Startup readiness response was not valid JSON.");
  }
}

function classifyStartupReadinessSurface({
  surface,
  httpStatus,
  payload,
}: {
  surface: StartupReadinessSurface;
  httpStatus: number;
  payload: unknown;
}): StartupReadinessItem {
  if (
    httpStatus === 200 &&
    isRecord(payload) &&
    payload.empty_runtime === true &&
    payload.fallback_reason === "missing_optional_runtime_table"
  ) {
    return buildStartupReadinessItem({
      surface,
      status: "empty_runtime",
      httpStatus,
      payload,
      note:
        "Controlled empty-runtime fallback returned a route-compatible empty envelope.",
    });
  }

  if (
    httpStatus === 200 &&
    isRecord(payload) &&
    hasExpectedStartupReadinessShape(surface.expectedShape, payload)
  ) {
    return buildStartupReadinessItem({
      surface,
      status: "initialized",
      httpStatus,
      payload,
      note: surface.initializedNote,
    });
  }

  if (httpStatus === 400 && isControlledJsonError(payload)) {
    return buildStartupReadinessItem({
      surface,
      status: "validation_bounded",
      httpStatus,
      payload,
      note: "Route returned a controlled validation error envelope.",
    });
  }

  return buildStartupReadinessItem({
    surface,
    status: "unavailable",
    httpStatus,
    payload,
    note:
      "Surface did not return a route-compatible initialized shape, controlled empty-runtime fallback, or bounded validation error.",
  });
}

function buildStartupReadinessItem({
  surface,
  status,
  httpStatus,
  payload,
  note,
}: {
  surface: StartupReadinessSurface;
  status: StartupReadinessStatus;
  httpStatus: number | null;
  payload: unknown;
  note: string;
}): StartupReadinessItem {
  const payloadRecord = isRecord(payload) ? payload : {};

  return {
    id: surface.id,
    label: surface.label,
    route: surface.route,
    status,
    http_status: httpStatus,
    fallback_reason:
      typeof payloadRecord.fallback_reason === "string"
        ? payloadRecord.fallback_reason
        : null,
    missing_tables: Array.isArray(payloadRecord.missing_tables)
      ? payloadRecord.missing_tables.filter(
          (tableName): tableName is string => typeof tableName === "string",
        )
      : [],
    note,
  };
}

function hasExpectedStartupReadinessShape(
  expectedShape: StartupReadinessExpectedShape,
  payload: Record<string, unknown>,
) {
  switch (expectedShape) {
    case "state_brief":
      return (
        Array.isArray(payload.active_state) &&
        Array.isArray(payload.pending_proposals) &&
        isRecord(payload.agent_handoff)
      );
    case "state_snapshot":
      return (
        Array.isArray(payload.active_state) &&
        Array.isArray(payload.future_state) &&
        Array.isArray(payload.completed_state) &&
        Array.isArray(payload.deprecated_state) &&
        Array.isArray(payload.open_tensions)
      );
    case "state_trajectory":
      return isRecord(payload.trajectories);
    case "work_list":
      return Array.isArray(payload.work_items);
    case "proposal_list":
      return Array.isArray(payload.proposals);
    case "publication_summary":
      return isRecord(payload.summary) && isRecord(payload.limits);
    case "approval_gate_summary":
      return isRecord(payload.summary) && isRecord(payload.counts);
    case "manual_note_preview_drafts":
      return (
        payload.ok === true &&
        Array.isArray(payload.items) &&
        isRecord(payload.summary) &&
        typeof payload.count === "number" &&
        typeof payload.limit === "number"
      );
  }
}

function isControlledJsonError(payload: unknown) {
  if (!isRecord(payload)) return false;

  return (
    typeof payload.error === "string" ||
    typeof payload.message === "string" ||
    typeof payload.error_code === "string"
  );
}

function summarizeReadinessItems(
  items: StartupReadinessItem[],
): StartupReadinessCounts {
  return items.reduce(
    (counts, item) => ({
      ...counts,
      [item.status]: counts[item.status] + 1,
    }),
    { ...EMPTY_READINESS_COUNTS },
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
