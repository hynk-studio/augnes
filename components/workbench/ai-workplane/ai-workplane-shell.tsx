import type { ReactNode } from "react";

import { ProjectGuideBriefRail } from "@/components/guide/project-guide-brief-rail";
import {
  SEMANTIC_SURFACE_ROLE,
  SEMANTIC_VISUAL_PRIORITY,
} from "@/lib/vnext/semantic-visual/semantic-visual-contract";
import type { GuideBriefAIWorkplaneProjectionV02 } from "@/types/vnext/guide-brief";

import styles from "../semantic-review/semantic-review.module.css";

export type AIWorkplaneShellStateV01 =
  | "loading"
  | "access_required"
  | "no_project"
  | "guidance_unavailable"
  | "first_work_definition"
  | "work_instructions_unavailable"
  | "no_current_decision"
  | "work_in_progress"
  | "delegated_approval"
  | "delegated_resume"
  | "delegated_cancelling"
  | "delegated_ready"
  | "result_ready"
  | "change_decision"
  | "change_completion"
  | "other_attention"
  | "change_applied"
  | "blocked";

export function AIWorkplaneShell({
  title,
  description,
  state,
  stateLabel,
  projectHref,
  exactDetailsHref,
  guide,
  guideLoading = false,
  guideRequestCount,
  priorityContent,
  children,
}: {
  title: string;
  description: string;
  state: AIWorkplaneShellStateV01;
  stateLabel: string;
  projectHref: string;
  exactDetailsHref?: string;
  guide: GuideBriefAIWorkplaneProjectionV02 | null;
  guideLoading?: boolean;
  guideRequestCount?: number;
  priorityContent?: ReactNode;
  children: ReactNode;
}) {
  const guideFollowsConsequentialWork = [
    "result_ready",
    "change_decision",
    "change_completion",
    "change_applied",
  ].includes(state);
  const guideRail = (
    <ProjectGuideBriefRail guide={guide ?? undefined} loading={guideLoading} />
  );
  const decisionBoundary = (
    <details
      className={styles.boundaryDisclosure}
      data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.supporting}
    >
      <summary>
        <strong
          className={styles.entryState}
          data-augnes-state-badge="workplane-state"
        >
          {stateLabel}
        </strong>
        <span>How decisions are protected</span>
      </summary>
      <ul
        className={styles.boundaryBand}
        aria-label="How AI Workplane decisions are protected"
      >
        <li>Results are not accepted automatically.</li>
        <li>Saving a decision does not change the project.</li>
        <li>Applying a change requires a separate confirmation.</li>
        <li>Exact sources remain available in View exact details.</li>
      </ul>
    </details>
  );

  return (
    <div
      className={styles.shell}
      data-ai-workplane-shell="v0.1"
      data-ai-workplane-state={state}
      data-ai-workplane-guide-request-count={guideRequestCount}
      data-augnes-surface-role={SEMANTIC_SURFACE_ROLE.aiWorkplane}
    >
      <header
        className={styles.header}
        data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.situation}
      >
        <div>
          <p className={styles.eyebrow}>AI Workplane</p>
          <h1>{title}</h1>
          <p className={styles.headerCopy}>{description}</p>
        </div>
        <nav className={styles.nav} aria-label="AI Workplane destinations">
          <a href={projectHref}>Continuities</a>
          <a href="/workbench/semantic-review" aria-current="page">
            AI Workplane home
          </a>
          {exactDetailsHref ? (
            <a href={exactDetailsHref} data-ai-workplane-exact-details="true">
              View exact details
            </a>
          ) : null}
        </nav>
      </header>

      {priorityContent}

      {!guideFollowsConsequentialWork ? guideRail : null}
      {!guideFollowsConsequentialWork ? decisionBoundary : null}

      {children}

      {guideFollowsConsequentialWork ? guideRail : null}
      {guideFollowsConsequentialWork ? decisionBoundary : null}
    </div>
  );
}
