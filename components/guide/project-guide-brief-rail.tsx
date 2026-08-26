import type { GuideBriefAIWorkplaneProjectionV02 } from "@/types/vnext/guide-brief";
import {
  SEMANTIC_SURFACE_ROLE,
  SEMANTIC_VISUAL_PRIORITY,
} from "@/lib/vnext/semantic-visual/semantic-visual-contract";

import styles from "./project-guide-brief-rail.module.css";

const PENDING_GUIDE: GuideBriefAIWorkplaneProjectionV02 = {
  status: "unavailable",
  project_name: null,
  current_coordinate: "Loading current project guidance",
  current_goal: null,
  important_constraints: [],
  work_or_result_status: "Current project state is being read.",
  material_blocker_or_judgment: null,
  unresolved_user_judgments: [],
  recommended_review_focus: "Continue only from verified current project information",
  exact_detail_href: null,
  human_attention: {
    required: false,
    category: null,
    blocked_or_awaiting: null,
    recommended_next_step: null,
    projection_only: true,
    authority_granted: false,
  },
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
      data-augnes-surface-role={SEMANTIC_SURFACE_ROLE.guideBrief}
      data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.supporting}
    >
      <div className={styles.voice}>
        <p className={styles.label}>GuideBrief</p>
        <strong>{visibleGuide.current_coordinate}</strong>
        <p>{visibleGuide.work_or_result_status}</p>
      </div>
      <div className={styles.context}>
        <p>
          <span>Current project</span>
          <strong data-guide-brief-project-name="true">
            {visibleGuide.project_name ?? "No current project"}
          </strong>
        </p>
        {visibleGuide.current_goal ? (
          <p data-guide-brief-core-goal="true">
            <span>Goal</span>
            {visibleGuide.current_goal}
          </p>
        ) : null}
        {visibleGuide.important_constraints[0] ? (
          <p data-guide-brief-core-constraint="true">
            <span>Important constraint</span>
            {visibleGuide.important_constraints[0]}
          </p>
        ) : null}
        {visibleGuide.unresolved_user_judgments[0] ||
        visibleGuide.material_blocker_or_judgment ? (
          <p
            className={styles.note}
            data-guide-brief-core-judgment="true"
          >
            <span>Needs judgment</span>
            {visibleGuide.unresolved_user_judgments[0] ??
              visibleGuide.material_blocker_or_judgment}
          </p>
        ) : null}
        <p
          className={styles.focus}
          data-guide-brief-review-focus="true"
        >
          <span>Review focus</span>
          {visibleGuide.recommended_review_focus}
        </p>
        {visibleGuide.exact_detail_href ? <a href={visibleGuide.exact_detail_href}>View exact details</a> : null}
      </div>
      <p className={styles.boundary}>Guidance only. Decisions and project changes remain separately authorized.</p>
    </aside>
  );
}
