import type { GuideBriefAIWorkplaneProjectionV02 } from "@/types/vnext/guide-brief";

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
  delegated_work: null,
};

const UNAVAILABLE_GUIDE: GuideBriefAIWorkplaneProjectionV02 = {
  ...PENDING_GUIDE,
  current_coordinate: "Current project guidance is unavailable",
  work_or_result_status: "Use the existing work surface without inferring missing project state.",
  material_blocker_or_judgment: "Current read sources could not be resolved.",
};

export function ProjectGuideBriefRail({
  guide,
  loading = false,
}: {
  guide?: GuideBriefAIWorkplaneProjectionV02;
  loading?: boolean;
}) {
  const visibleGuide = guide ?? (loading ? PENDING_GUIDE : UNAVAILABLE_GUIDE);

  return (
    <aside
      className={styles.rail}
      aria-label="Current project guidance"
      data-ai-workplane-guide="guide_brief.v0.2"
      data-ai-workplane-guide-status={visibleGuide.status}
      data-ai-workplane-guide-loading={loading ? "true" : "false"}
    >
      <div>
        <p className={styles.label}>Current project</p>
        <strong>{visibleGuide.project_name ?? "No current project"}</strong>
      </div>
      <div>
        <p className={styles.label}>Current coordinate</p>
        <p>{visibleGuide.current_coordinate}</p>
        {visibleGuide.current_goal ? <p className={styles.muted}>{visibleGuide.current_goal}</p> : null}
      </div>
      <div>
        <p className={styles.label}>Work status</p>
        <p>{visibleGuide.work_or_result_status}</p>
        {visibleGuide.material_blocker_or_judgment ? <p className={styles.note}>{visibleGuide.material_blocker_or_judgment}</p> : null}
      </div>
      <div>
        <p className={styles.label}>Review focus</p>
        <p>{visibleGuide.recommended_review_focus}</p>
        {visibleGuide.exact_detail_href ? <a href={visibleGuide.exact_detail_href}>View exact details</a> : null}
      </div>
      <p className={styles.boundary}>Guidance only. Decisions and project changes remain separately authorized.</p>
    </aside>
  );
}
