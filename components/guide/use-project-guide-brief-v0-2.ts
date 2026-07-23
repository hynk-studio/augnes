"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  GUIDE_BRIEF_REQUEST_SCOPE_V02,
  GUIDE_BRIEF_ROUTE_MARKER_V02,
  GUIDE_BRIEF_VERSION_V02,
  type ProjectGuideBriefV02,
} from "@/types/vnext/guide-brief";

export type ProjectGuideBriefLoadStateV02 =
  | "loading"
  | "available"
  | "unavailable";

export function useProjectGuideBriefV02(initialGuide?: ProjectGuideBriefV02) {
  const [guide, setGuide] = useState<ProjectGuideBriefV02 | null>(
    initialGuide ?? null,
  );
  const [status, setStatus] = useState<ProjectGuideBriefLoadStateV02>(
    initialGuide ? "available" : "loading",
  );
  const controllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);
  const requestCountRef = useRef(0);

  const read = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    requestCountRef.current += 1;
    setStatus("loading");
    try {
      const query = new URLSearchParams({
        scope: GUIDE_BRIEF_REQUEST_SCOPE_V02,
      });
      const response = await fetch(`/api/augnes/read/guide-brief?${query}`, {
        method: "GET",
        cache: "no-store",
        credentials: "same-origin",
        headers: {
          "x-augnes-local-readonly": GUIDE_BRIEF_ROUTE_MARKER_V02,
        },
        signal: controller.signal,
      });
      const body: unknown = await response.json();
      const parsed = readProjectGuideBriefV02(body);
      if (!response.ok || !parsed) throw new Error("guide_brief_unavailable");
      if (mountedRef.current && !controller.signal.aborted) {
        setGuide(parsed);
        setStatus(
          parsed.projections.ai_workplane.status === "available"
            ? "available"
            : "unavailable",
        );
      }
    } catch {
      if (mountedRef.current && !controller.signal.aborted) {
        setGuide(null);
        setStatus("unavailable");
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (!initialGuide) void read();
    return () => {
      mountedRef.current = false;
      controllerRef.current?.abort();
    };
  }, [initialGuide, read]);

  return {
    guide,
    projection: guide?.projections.ai_workplane ?? null,
    status,
    refresh: read,
    requestCountRef,
  };
}

function readProjectGuideBriefV02(value: unknown): ProjectGuideBriefV02 | null {
  if (!isRecord(value) || value.guide_version !== GUIDE_BRIEF_VERSION_V02) {
    return null;
  }
  if (
    !isRecord(value.identity) ||
    !nullableString(value.identity.project_id) ||
    !nullableString(value.identity.project_display_name) ||
    !isRecord(value.coordinate) ||
    typeof value.coordinate.focus !== "string" ||
    typeof value.coordinate.work_status !== "string" ||
    typeof value.coordinate.result_available !== "boolean" ||
    !isRecord(value.primary_guidance) ||
    typeof value.primary_guidance.label !== "string" ||
    !nullableString(value.primary_guidance.href) ||
    !isRecord(value.projections) ||
    !isAIWorkplaneProjection(value.projections.ai_workplane) ||
    !isRecord(value.authority) ||
    value.authority.can_write_db !== false ||
    value.authority.can_transition !== false ||
    value.authority.can_approve !== false
  ) {
    return null;
  }
  return value as unknown as ProjectGuideBriefV02;
}

function isAIWorkplaneProjection(value: unknown): boolean {
  return (
    isRecord(value) &&
    (value.status === "available" || value.status === "unavailable") &&
    nullableString(value.project_name) &&
    typeof value.current_coordinate === "string" &&
    nullableString(value.current_goal) &&
    typeof value.work_or_result_status === "string" &&
    nullableString(value.material_blocker_or_judgment) &&
    typeof value.recommended_review_focus === "string" &&
    nullableString(value.exact_detail_href)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}
