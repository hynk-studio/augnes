import type { ReactNode } from "react";

import { ProjectGuideBriefRail } from "@/components/guide/project-guide-brief-rail";
import type { GuideBriefAIWorkplaneProjectionV02 } from "@/types/vnext/guide-brief";
import type { SemanticWorkbenchEntryStateV01 } from "@/types/vnext/semantic-workbench";

import styles from "./semantic-review/semantic-review.module.css";

export type SemanticWorkbenchShellStateV01 =
  | SemanticWorkbenchEntryStateV01
  | "loading"
  | "locked"
  | "proposal_queue";

interface SemanticWorkbenchNavigationItemV01 {
  href: string;
  label: string;
}

export function SemanticWorkbenchShell({
  title,
  description,
  entryState,
  entryLabel,
  projectHref,
  inspectorHref,
  navigation = [],
  guide,
  children,
}: {
  title: string;
  description: string;
  entryState: SemanticWorkbenchShellStateV01;
  entryLabel: string;
  projectHref: string;
  inspectorHref?: string;
  navigation?: SemanticWorkbenchNavigationItemV01[];
  guide: GuideBriefAIWorkplaneProjectionV02;
  children: ReactNode;
}) {
  return (
    <div
      className={styles.shell}
      data-semantic-workbench-shell="v0.1"
      data-semantic-workbench-entry-state={entryState}
    >
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Semantic Workbench · Verify and decide</p>
          <h1>{title}</h1>
          <p className={styles.headerCopy}>{description}</p>
        </div>
        <nav className={styles.nav} aria-label="Current review destinations">
          <a href={projectHref}>Blank State</a>
          <a href="/workbench/semantic-review">Proposal queue</a>
          {inspectorHref ? (
            <a href={inspectorHref} data-semantic-workbench-inspector="true">
              Open Inspector
            </a>
          ) : null}
        </nav>
      </header>

      <ProjectGuideBriefRail guide={guide} />

      <details className={styles.boundaryDisclosure}>
        <summary>
          <strong className={styles.entryState}>{entryLabel}</strong>
          <span>Review authority boundary</span>
        </summary>
        <div
          className={styles.boundaryBand}
          aria-label="Semantic Workbench authority boundary"
        >
          <span>Receipt is not accepted Evidence</span>
          <span>Assessment and proposal are not project truth</span>
          <span>Decision is not Transition</span>
          <span>Only an applied authorized Transition changes later context</span>
        </div>
      </details>

      {children}

      {navigation.length > 0 ? (
        <details className={styles.compatibilityDisclosure}>
          <summary>Compatibility surfaces</summary>
          <nav aria-label="Compatibility destinations">
            {navigation.map((item) => (
              <a href={item.href} key={`${item.href}:${item.label}`}>
                {item.label}
              </a>
            ))}
          </nav>
        </details>
      ) : null}
    </div>
  );
}
