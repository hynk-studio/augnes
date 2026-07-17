"use client";

import { useEffect, useRef, useState } from "react";

const ROUTE = "/api/vnext/operator/host-round-trip";
const POLL_MS = 750;

type DeterministicStateV01 =
  | { status: "idle" }
  | { status: "running" }
  | {
      status: "completed";
      write_status: "inserted" | "exact_replay";
      outcome: string;
      summary: string;
    }
  | { status: "error"; error_code: string };

interface LiveProjectionV01 {
  status:
    | "idle"
    | "queued"
    | "starting"
    | "running"
    | "waiting_for_approval"
    | "cancelling"
    | "paused"
    | "blocked"
    | "completed"
    | "failed"
    | "cancelled"
    | "timed_out";
  run_ref: string | null;
  control_revision: number;
  reconciliation_required: boolean;
  public_reason: string | null;
  capability: {
    status: "not_checked" | "checking" | "available" | "unavailable" | "disconnected";
    cli_version: string | null;
    public_reason: string | null;
  };
  pending_approval: null | {
    approval_ref: string;
    operation_class: string;
    resource_summary: string;
    public_reason: string;
    public_risk_summary: string;
    command_summary: string | null;
    repository_relative_paths: string[];
    network_resources: string[];
    available_decisions: string[];
    expires_at: string | null;
    control_revision: number;
    decision_submitted: boolean;
  };
  receipt: null | {
    receipt_ref: string;
    receipt_fingerprint: string;
    outcome: string | null;
  };
}

export function DirectHostRoundTripAction() {
  const [hydrated, setHydrated] = useState(false);
  const [deterministic, setDeterministic] = useState<DeterministicStateV01>({
    status: "idle",
  });
  const [live, setLive] = useState<LiveProjectionV01 | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);
  const polling = useRef(false);

  useEffect(() => {
    setHydrated(true);
    void readLive();
  }, []);

  useEffect(() => {
    if (
      !live ||
      (!isPollingStateV01(live.status) &&
        !(
          live.status === "waiting_for_approval" &&
          live.pending_approval?.decision_submitted === true
        ))
    ) {
      return;
    }
    const timer = window.setTimeout(() => void readLive(), POLL_MS);
    return () => window.clearTimeout(timer);
  }, [live?.status, live?.control_revision]);

  async function runDeterministic(): Promise<void> {
    if (deterministic.status === "running") return;
    setDeterministic({ status: "running" });
    try {
      const response = await fetch(ROUTE, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const body = (await response.json()) as Record<string, unknown>;
      if (!response.ok) {
        setDeterministic({
          status: "error",
          error_code: errorCodeV01(body, "direct_host_round_trip_failed"),
        });
        return;
      }
      const receipt = body.receipt as
        | { result_summary?: { summary?: unknown; outcome?: unknown } }
        | undefined;
      setDeterministic({
        status: "completed",
        write_status:
          body.status === "exact_replay" ? "exact_replay" : "inserted",
        outcome:
          typeof body.host_outcome === "string" ? body.host_outcome : "unknown",
        summary:
          typeof receipt?.result_summary?.summary === "string"
            ? receipt.result_summary.summary
            : "The bounded host round trip returned a durable receipt.",
      });
    } catch {
      setDeterministic({
        status: "error",
        error_code: "direct_host_round_trip_failed",
      });
    }
  }

  async function readLive(): Promise<void> {
    if (polling.current) return;
    polling.current = true;
    try {
      const response = await fetch(ROUTE, {
        credentials: "same-origin",
        cache: "no-store",
      });
      const body = (await response.json()) as Record<string, unknown>;
      if (!response.ok) {
        setLiveError(errorCodeV01(body, "live_host_projection_failed"));
        return;
      }
      const projection = liveProjectionV01(body);
      if (projection) {
        setLive(projection);
        setLiveError(null);
      }
    } catch {
      setLiveError("live_host_projection_failed");
    } finally {
      polling.current = false;
    }
  }

  async function postLive(
    action: Record<string, string | number>,
  ): Promise<void> {
    setLiveError(null);
    try {
      const response = await fetch(ROUTE, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action),
      });
      const body = (await response.json()) as Record<string, unknown>;
      if (!response.ok) {
        setLiveError(errorCodeV01(body, "live_host_action_failed"));
        return;
      }
      const projection = liveProjectionV01(body);
      if (projection) setLive(projection);
    } catch {
      setLiveError("live_host_action_failed");
    }
  }

  function decide(action: "approve_once" | "decline"): void {
    if (!live?.run_ref || !live.pending_approval) return;
    void postLive({
      action,
      run_ref: live.run_ref,
      approval_ref: live.pending_approval.approval_ref,
      control_revision: live.pending_approval.control_revision,
    });
  }

  function cancel(): void {
    if (!live?.run_ref) return;
    void postLive({
      action: "cancel",
      run_ref: live.run_ref,
      control_revision: live.control_revision,
    });
  }

  function resume(): void {
    if (!live?.run_ref) return;
    void postLive({
      action: "resume",
      run_ref: live.run_ref,
      control_revision: live.control_revision,
    });
  }

  const liveBusy = Boolean(live && isPollingStateV01(live.status));
  return (
    <div
      className="direct-host-round-trip"
      data-direct-host-round-trip="v0.2"
      data-direct-host-round-trip-hydrated={hydrated ? "true" : "false"}
      data-direct-host-round-trip-status={deterministic.status}
      data-live-host-status={live?.status ?? "unread"}
      data-direct-host-round-trip-human-transport="none"
    >
      <button
        type="button"
        data-direct-host-action="deterministic"
        onClick={() => void runDeterministic()}
        disabled={!hydrated || deterministic.status === "running" || liveBusy}
      >
        {deterministic.status === "running"
          ? "Running deterministic host…"
          : "Run deterministic host round trip"}
      </button>
      {deterministic.status === "completed" ? (
        <div role="status" className="direct-host-round-trip-result">
          <strong>
            {deterministic.write_status === "exact_replay"
              ? "Existing receipt resolved"
              : "RunReceipt persisted"}
          </strong>
          <p>{deterministic.summary}</p>
          <small>
            Host outcome {deterministic.outcome}. No semantic change was approved.
          </small>
        </div>
      ) : null}
      {deterministic.status === "error" ? (
        <p role="alert" className="direct-host-round-trip-error">
          Host round trip unavailable: {deterministic.error_code}
        </p>
      ) : null}

      <div className="live-host-round-trip" data-live-host-controls="v0.1">
        <button
          type="button"
          data-live-host-action="start"
          onClick={() => void postLive({ action: "start_live" })}
          disabled={!hydrated || liveBusy || live?.status === "waiting_for_approval"}
        >
          {liveBusy ? "Codex App Server is working…" : "Start live Codex work"}
        </button>
        {live && live.status !== "idle" ? (
          <div role="status" data-live-host-projection="true">
            <strong>Live Codex: {displayStatusV01(live.status)}</strong>
            {live.public_reason ? <p>{live.public_reason}</p> : null}
            {live.capability.status === "unavailable" ? (
              <p>
                Optional capability unavailable: {live.capability.public_reason}
              </p>
            ) : null}
            {live.capability.cli_version ? (
              <small>Codex CLI {live.capability.cli_version}</small>
            ) : null}
          </div>
        ) : null}

        {live?.pending_approval ? (
          <section data-live-host-approval="pending" aria-label="Native host approval">
            <strong>{live.pending_approval.operation_class} approval</strong>
            <p>{live.pending_approval.public_reason}</p>
            <p>{live.pending_approval.resource_summary}</p>
            {live.pending_approval.command_summary ? (
              <code>{live.pending_approval.command_summary}</code>
            ) : null}
            <small>{live.pending_approval.public_risk_summary}</small>
            <div>
              {live.pending_approval.available_decisions.includes("approve_once") ? (
                <button
                  type="button"
                  data-live-host-action="approve-once"
                  onClick={() => decide("approve_once")}
                  disabled={
                    live.status !== "waiting_for_approval" ||
                    live.pending_approval.decision_submitted
                  }
                >
                  Approve once
                </button>
              ) : null}
              <button
                type="button"
                data-live-host-action="decline"
                onClick={() => decide("decline")}
                disabled={
                  live.status !== "waiting_for_approval" ||
                  live.pending_approval.decision_submitted
                }
              >
                Decline
              </button>
            </div>
          </section>
        ) : null}

        {live && ["starting", "running", "waiting_for_approval"].includes(live.status) ? (
          <button type="button" data-live-host-action="cancel" onClick={cancel}>
            Cancel live run
          </button>
        ) : null}
        {live?.status === "paused" ? (
          <button type="button" data-live-host-action="resume" onClick={resume}>
            Resume known Codex run
          </button>
        ) : null}
        {live?.receipt ? (
          <p data-live-host-receipt="persisted">
            RunReceipt persisted after App Server settlement. Outcome {live.receipt.outcome}.
          </p>
        ) : null}
        {liveError ? (
          <p role="alert" className="direct-host-round-trip-error">
            Live Codex action unavailable: {liveError}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function liveProjectionV01(body: Record<string, unknown>): LiveProjectionV01 | null {
  const projection = body.live_run;
  return projection && typeof projection === "object" && !Array.isArray(projection)
    ? (projection as LiveProjectionV01)
    : null;
}

function errorCodeV01(body: Record<string, unknown>, fallback: string): string {
  return typeof body.error_code === "string" ? body.error_code : fallback;
}

function isPollingStateV01(status: LiveProjectionV01["status"]): boolean {
  return ["queued", "starting", "running", "cancelling"].includes(status);
}

function displayStatusV01(status: LiveProjectionV01["status"]): string {
  return status.replaceAll("_", " ");
}
