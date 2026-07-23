import type { GuideBriefAIWorkplaneProjectionV02 } from "@/types/vnext/guide-brief";

import styles from "./project-guide-brief-rail.module.css";

export function ProjectGuideBriefRail({ guide }: { guide: GuideBriefAIWorkplaneProjectionV02 }) {
  return (
    <aside
      className={styles.rail}
      aria-label="Current project guidance"
      data-ai-workplane-guide="guide_brief.v0.2"
      data-ai-workplane-guide-status={guide.status}
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
