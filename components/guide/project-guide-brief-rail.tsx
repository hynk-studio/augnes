"use client";

import { useEffect, useState } from "react";

import {
  GUIDE_BRIEF_REQUEST_SCOPE_V02,
  GUIDE_BRIEF_ROUTE_MARKER_V02,
  GUIDE_BRIEF_VERSION_V02,
  type GuideBriefAIWorkplaneProjectionV02,
} from "@/types/vnext/guide-brief";

import styles from "./project-guide-brief-rail.module.css";

const PENDING_GUIDE: GuideBriefAIWorkplaneProjectionV02 = {
  status: "unavailable",
  project_name: null,
  current_coordinate: "Loading current project guidance",
  current_goal: null,
  work_or_result_status: "Current project state is being read.",
  material_blocker_or_judgment: null,
  recommended_review_focus: "Continue only from verified current project information",
  exact_detail_href: null,
};

const UNAVAILABLE_GUIDE: GuideBriefAIWorkplaneProjectionV02 = {
  ...PENDING_GUIDE,
  current_coordinate: "Current project guidance is unavailable",
  work_or_result_status: "Use the existing work surface without inferring missing project state.",
  material_blocker_or_judgment: "Current read sources could not be resolved.",
};

export function ProjectGuideBriefRail({
  guide: initialGuide,
}: {
  guide?: GuideBriefAIWorkplaneProjectionV02;
}) {
  const [guide, setGuide] = useState(initialGuide ?? PENDING_GUIDE);

  useEffect(() => {
    if (initialGuide) return;
    const controller = new AbortController();
    let active = true;
    void (async () => {
      try {
        const query = new URLSearchParams({ scope: GUIDE_BRIEF_REQUEST_SCOPE_V02 });
        const response = await fetch(`/api/augnes/read/guide-brief?${query}`, {
          method: "GET",
          cache: "no-store",
          credentials: "same-origin",
          headers: { "x-augnes-local-readonly": GUIDE_BRIEF_ROUTE_MARKER_V02 },
          signal: controller.signal,
        });
        const body: unknown = await response.json();
        const projection = readAIWorkplaneProjection(body);
        if (!response.ok || !projection) throw new Error("guide_brief_unavailable");
        if (active) setGuide(projection);
      } catch {
        if (active && !controller.signal.aborted) setGuide(UNAVAILABLE_GUIDE);
      }
    })();
    return () => {
      active = false;
      controller.abort();
    };
  }, [initialGuide]);

  return (
    <aside
      className={styles.rail}
      aria-label="Current project guidance"
      data-ai-workplane-guide="guide_brief.v0.2"
      data-ai-workplane-guide-status={guide.status}
      data-ai-workplane-guide-loading={!initialGuide && guide === PENDING_GUIDE ? "true" : "false"}
    >
      <div>
        <p className={styles.label}>Current project</p>
        <strong>{guide.project_name ?? "No current project"}</strong>
      </div>
      <div>
        <p className={styles.label}>Current coordinate</p>
        <p>{guide.current_coordinate}</p>
        {guide.current_goal ? <p className={styles.muted}>{guide.current_goal}</p> : null}
      </div>
      <div>
        <p className={styles.label}>Work status</p>
        <p>{guide.work_or_result_status}</p>
        {guide.material_blocker_or_judgment ? <p className={styles.note}>{guide.material_blocker_or_judgment}</p> : null}
      </div>
      <div>
        <p className={styles.label}>Review focus</p>
        <p>{guide.recommended_review_focus}</p>
        {guide.exact_detail_href ? <a href={guide.exact_detail_href}>View exact details</a> : null}
      </div>
      <p className={styles.boundary}>Guidance only. Decisions and project changes remain separately authorized.</p>
    </aside>
  );
}

function readAIWorkplaneProjection(
  value: unknown,
): GuideBriefAIWorkplaneProjectionV02 | null {
  if (!isRecord(value) || value.guide_version !== GUIDE_BRIEF_VERSION_V02) return null;
  const projections = value.projections;
  if (!isRecord(projections)) return null;
  const guide = projections.ai_workplane;
  if (!isRecord(guide) || (guide.status !== "available" && guide.status !== "unavailable")) {
    return null;
  }
  if (
    !nullableString(guide.project_name) ||
    typeof guide.current_coordinate !== "string" ||
    !nullableString(guide.current_goal) ||
    typeof guide.work_or_result_status !== "string" ||
    !nullableString(guide.material_blocker_or_judgment) ||
    typeof guide.recommended_review_focus !== "string" ||
    !nullableString(guide.exact_detail_href)
  ) {
    return null;
  }
  return guide as unknown as GuideBriefAIWorkplaneProjectionV02;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}
