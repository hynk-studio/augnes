"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { DelegatedWorkProjectionV01 } from "@/types/vnext/delegated-work";

const ROUTE = "/api/vnext/operator/host-round-trip";
const POLL_MS = 750;

export type DelegatedWorkActionV01 =
  | { action: "start_live" }
  | {
      action: "approve_once" | "decline";
      run_ref: string;
      approval_ref: string;
      control_revision: number;
    }
  | {
      action: "cancel" | "resume";
      run_ref: string;
      control_revision: number;
    };

export function useDelegatedCodexWorkV01(enabled: boolean) {
  const [projection, setProjection] =
    useState<DelegatedWorkProjectionV01 | null>(null);
  const [status, setStatus] = useState<
    "idle" | "loading" | "ready" | "acting" | "unavailable"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [pollGeneration, setPollGeneration] = useState(0);
  const requestCountRef = useRef(0);
  const inFlightRef = useRef(false);
  const initialReadRef = useRef(false);
  const mountedRef = useRef(true);
  const abortRef = useRef<AbortController | null>(null);

  const read = useCallback(async (): Promise<void> => {
    if (!enabled || inFlightRef.current) return;
    inFlightRef.current = true;
    const abort = new AbortController();
    abortRef.current = abort;
    requestCountRef.current += 1;
    try {
      const response = await fetch(ROUTE, {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
        signal: abort.signal,
      });
      const body = (await response.json()) as Record<string, unknown>;
      if (!response.ok) {
        if (!mountedRef.current) return;
        setStatus("unavailable");
        setError(errorCodeV01(body, "delegated_work_read_failed"));
        return;
      }
      const next = delegatedWorkSuccessProjectionV01(body, "read");
      if (!next) {
        if (!mountedRef.current) return;
        setStatus("unavailable");
        setError("delegated_work_projection_invalid");
        return;
      }
      if (!mountedRef.current) return;
      setProjection(next.projection);
      if (next.status === "unavailable") {
        setStatus(next.status);
        setError(next.error);
      } else {
        setStatus("ready");
        setError(null);
        setPollGeneration((value) => value + 1);
      }
    } catch (caught) {
      if (!mountedRef.current || abort.signal.aborted) return;
      setStatus("unavailable");
      setError(
        caught instanceof Error && caught.message
          ? "delegated_work_read_failed"
          : "delegated_work_read_failed",
      );
    } finally {
      if (abortRef.current === abort) abortRef.current = null;
      inFlightRef.current = false;
    }
  }, [enabled]);

  const act = useCallback(
    async (action: DelegatedWorkActionV01): Promise<boolean> => {
      if (!enabled || inFlightRef.current) return false;
      inFlightRef.current = true;
      const abort = new AbortController();
      abortRef.current = abort;
      requestCountRef.current += 1;
      setStatus("acting");
      setError(null);
      try {
        const response = await fetch(ROUTE, {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(action),
          signal: abort.signal,
        });
        const body = (await response.json()) as Record<string, unknown>;
        if (!response.ok) {
          if (!mountedRef.current) return false;
          setStatus("ready");
          setError(errorCodeV01(body, "delegated_work_action_failed"));
          return false;
        }
        const next = delegatedWorkSuccessProjectionV01(
          body,
          "accepted_action",
        );
        if (!next) {
          if (!mountedRef.current) return false;
          setStatus("unavailable");
          setError("delegated_work_projection_invalid");
          return false;
        }
        if (!mountedRef.current) return false;
        setProjection(next.projection);
        if (next.status === "unavailable") {
          setStatus(next.status);
          setError(next.error);
        } else {
          setStatus("ready");
          setError(null);
          setPollGeneration((value) => value + 1);
        }
        return true;
      } catch {
        if (!mountedRef.current || abort.signal.aborted) return false;
        setStatus("ready");
        setError("delegated_work_action_failed");
        return false;
      } finally {
        if (abortRef.current === abort) abortRef.current = null;
        inFlightRef.current = false;
      }
    },
    [enabled],
  );

  useEffect(() => {
    mountedRef.current = true;
    if (!enabled) {
      initialReadRef.current = false;
    }
    if (enabled && !initialReadRef.current) {
      initialReadRef.current = true;
      setStatus("loading");
      void read();
    }
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, [enabled, read]);

  useEffect(() => {
    if (!enabled || !shouldPollDelegatedWorkV01(projection)) return;
    const timer = window.setTimeout(() => void read(), POLL_MS);
    return () => window.clearTimeout(timer);
  }, [enabled, pollGeneration, projection, read]);

  return {
    projection,
    status,
    error,
    requestCountRef,
    refresh: read,
    act,
  };
}

export function shouldPollDelegatedWorkV01(
  projection: DelegatedWorkProjectionV01 | null,
): boolean {
  if (!projection) return false;
  if (
    ["preparing", "working", "cancelling"].includes(projection.stage)
  ) {
    return true;
  }
  return (
    projection.stage === "waiting_for_approval" &&
    projection.pending_approval?.decision_submitted === true
  );
}

function delegatedProjectionV01(
  body: Record<string, unknown>,
): DelegatedWorkProjectionV01 | null {
  const value = body.delegated_work;
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    (value as { projection_version?: unknown }).projection_version !==
      "delegated_work_projection.v0.1"
  ) {
    return null;
  }
  return value as DelegatedWorkProjectionV01;
}

export function delegatedProjectionUnavailableV01(
  body: Record<string, unknown>,
): boolean {
  return (
    body.delegated_work_projection_status === "unavailable" &&
    body.delegated_work_error_code ===
      "delegated_work_projection_unavailable"
  );
}

export function delegatedWorkSuccessProjectionV01(
  body: Record<string, unknown>,
  context: "read" | "accepted_action",
): {
  projection: DelegatedWorkProjectionV01;
  status: "ready" | "unavailable";
  error: string | null;
} | null {
  const projection = delegatedProjectionV01(body);
  if (!projection) return null;
  if (delegatedProjectionUnavailableV01(body)) {
    return {
      projection,
      status: "unavailable",
      error:
        context === "accepted_action"
          ? "delegated_work_progress_refresh_unavailable"
          : "delegated_work_projection_unavailable",
    };
  }
  return {
    projection,
    status: "ready",
    error: null,
  };
}

function errorCodeV01(
  body: Record<string, unknown>,
  fallback: string,
): string {
  const value = body.error_code;
  return typeof value === "string" &&
    /^[a-z0-9_:-]{1,96}$/u.test(value)
    ? value
    : fallback;
}
