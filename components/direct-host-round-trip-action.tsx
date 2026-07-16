"use client";

import { useEffect, useState } from "react";

const ROUTE = "/api/vnext/operator/host-round-trip";

type HostRoundTripStateV01 =
  | { status: "idle" }
  | { status: "running" }
  | {
      status: "completed";
      write_status: "inserted" | "exact_replay";
      outcome: string;
      summary: string;
    }
  | { status: "error"; error_code: string };

export function DirectHostRoundTripAction() {
  const [hydrated, setHydrated] = useState(false);
  const [state, setState] = useState<HostRoundTripStateV01>({ status: "idle" });

  useEffect(() => setHydrated(true), []);

  async function run(): Promise<void> {
    if (state.status === "running") return;
    setState({ status: "running" });
    try {
      const response = await fetch(ROUTE, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const body = (await response.json()) as Record<string, unknown>;
      if (!response.ok) {
        setState({
          status: "error",
          error_code:
            typeof body.error_code === "string"
              ? body.error_code
              : "direct_host_round_trip_failed",
        });
        return;
      }
      const receipt = body.receipt as
        | { result_summary?: { summary?: unknown; outcome?: unknown } }
        | undefined;
      setState({
        status: "completed",
        write_status:
          body.status === "exact_replay" ? "exact_replay" : "inserted",
        outcome:
          typeof body.host_outcome === "string"
            ? body.host_outcome
            : "unknown",
        summary:
          typeof receipt?.result_summary?.summary === "string"
            ? receipt.result_summary.summary
            : "The bounded host round trip returned a durable receipt.",
      });
    } catch {
      setState({
        status: "error",
        error_code: "direct_host_round_trip_failed",
      });
    }
  }

  return (
    <div
      className="direct-host-round-trip"
      data-direct-host-round-trip="v0.1"
      data-direct-host-round-trip-hydrated={hydrated ? "true" : "false"}
      data-direct-host-round-trip-status={state.status}
      data-direct-host-round-trip-human-transport="none"
    >
      <button
        type="button"
        onClick={() => void run()}
        disabled={!hydrated || state.status === "running"}
      >
        {state.status === "running"
          ? "Running deterministic host…"
          : "Run deterministic host round trip"}
      </button>
      {state.status === "completed" ? (
        <div role="status" className="direct-host-round-trip-result">
          <strong>
            {state.write_status === "exact_replay"
              ? "Existing receipt resolved"
              : "RunReceipt persisted"}
          </strong>
          <p>{state.summary}</p>
          <small>Host outcome {state.outcome}. No semantic change was approved.</small>
        </div>
      ) : null}
      {state.status === "error" ? (
        <p role="alert" className="direct-host-round-trip-error">
          Host round trip unavailable: {state.error_code}
        </p>
      ) : null}
    </div>
  );
}
