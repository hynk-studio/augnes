"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ROUTE = "/api/vnext/operator/host-round-trip";

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

/**
 * C5 compatibility control for deterministic local test work only.
 * Live Codex work, progress, approval, cancellation, and resume are owned by
 * the AI Workplane delegated-work surface.
 */
export function DirectHostRoundTripAction() {
  const router = useRouter();
  const [state, setState] = useState<DeterministicStateV01>({
    status: "idle",
  });

  async function runDeterministic(): Promise<void> {
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
          error_code: errorCodeV01(
            body,
            "direct_host_round_trip_failed",
          ),
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
            : "The local test work completed and its result was saved.",
      });
      router.refresh();
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
      data-direct-host-round-trip="v0.3"
      data-direct-host-round-trip-status={state.status}
      data-direct-host-round-trip-human-transport="none"
      data-live-host-controls="moved-to-ai-workplane"
    >
      <button
        type="button"
        data-direct-host-action="deterministic"
        onClick={() => void runDeterministic()}
        disabled={state.status === "running"}
      >
        {state.status === "running"
          ? "Running local test work…"
          : "Run local test work"}
      </button>
      {state.status === "completed" ? (
        <div role="status" className="direct-host-round-trip-result">
          <strong>
            {state.write_status === "exact_replay"
              ? "Existing result reused"
              : "Result saved"}
          </strong>
          <p>{state.summary}</p>
          <small>
            Host outcome {state.outcome}. No project change was accepted
            automatically.
          </small>
        </div>
      ) : null}
      {state.status === "error" ? (
        <p role="alert" className="direct-host-round-trip-error">
          Local test work unavailable: {state.error_code}
        </p>
      ) : null}
    </div>
  );
}

function errorCodeV01(
  body: Record<string, unknown>,
  fallback: string,
): string {
  return typeof body.error_code === "string" ? body.error_code : fallback;
}
