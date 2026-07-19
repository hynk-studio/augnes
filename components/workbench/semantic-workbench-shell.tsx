import type { ReactNode } from "react";

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
  children,
}: {
  title: string;
  description: string;
  entryState: SemanticWorkbenchShellStateV01;
  entryLabel: string;
  projectHref: string;
  inspectorHref?: string;
  navigation?: SemanticWorkbenchNavigationItemV01[];
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
        <nav className={styles.nav} aria-label="Semantic Workbench navigation">
          <a href={projectHref}>Project Home</a>
          <a href="/workbench/semantic-review">Proposal queue</a>
          {inspectorHref ? <a href={inspectorHref}>Open Inspector</a> : null}
          {navigation.map((item) => (
            <a href={item.href} key={`${item.href}:${item.label}`}>
              {item.label}
            </a>
          ))}
        </nav>
      </header>

      <div
        className={styles.boundaryBand}
        aria-label="Semantic Workbench authority boundary"
      >
        <strong className={styles.entryState}>{entryLabel}</strong>
        <span>Receipt is not accepted Evidence</span>
        <span>Assessment and proposal are not project truth</span>
        <span>Decision is not Transition</span>
        <span>Only an applied authorized Transition changes later context</span>
      </div>

      {children}
    </div>
  );
}
