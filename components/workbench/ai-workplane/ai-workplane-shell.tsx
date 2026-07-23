import type { ReactNode } from "react";

import { ProjectGuideBriefRail } from "@/components/guide/project-guide-brief-rail";
import type { GuideBriefAIWorkplaneProjectionV02 } from "@/types/vnext/guide-brief";

import styles from "../semantic-review/semantic-review.module.css";

export type AIWorkplaneShellStateV01 =
  | "loading"
  | "access_required"
  | "no_project"
  | "guidance_unavailable"
  | "no_current_decision"
  | "work_in_progress"
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
  children: ReactNode;
}) {
  return (
    <div
      className={styles.shell}
      data-ai-workplane-shell="v0.1"
      data-ai-workplane-state={state}
      data-ai-workplane-guide-request-count={guideRequestCount}
    >
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>AI Workplane</p>
          <h1>{title}</h1>
          <p className={styles.headerCopy}>{description}</p>
        </div>
        <nav className={styles.nav} aria-label="AI Workplane destinations">
          <a href={projectHref}>Blank State</a>
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

      <ProjectGuideBriefRail guide={guide ?? undefined} loading={guideLoading} />

      <details className={styles.boundaryDisclosure}>
        <summary>
          <strong className={styles.entryState}>{stateLabel}</strong>
          <span>How decisions are protected</span>
        </summary>
        <div
          className={styles.boundaryBand}
          aria-label="How AI Workplane decisions are protected"
        >
          <span>Results are not accepted automatically.</span>
          <span>Saving a decision does not change the project.</span>
          <span>Applying a change requires a separate confirmation.</span>
          <span>Exact sources remain available in View exact details.</span>
        </div>
      </details>

      {children}
    </div>
  );
}
