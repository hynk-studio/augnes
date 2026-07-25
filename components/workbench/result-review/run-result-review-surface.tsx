import type { ReactNode } from "react";

import { AIWorkplaneShell } from "@/components/workbench/ai-workplane/ai-workplane-shell";
import { ProductShell } from "@/components/product-shell";
import {
  buildAIWorkplaneResultViewV01,
  compareAIWorkplaneGuideProjectV01,
} from "@/lib/vnext/ai-workplane/ai-workplane-view";
import type { ProjectRunResultDetailV01 } from "@/types/vnext/project-run-result";
import type { ProjectGuideBriefV02 } from "@/types/vnext/guide-brief";
import { SEMANTIC_VISUAL_PRIORITY } from "@/lib/vnext/semantic-visual/semantic-visual-contract";

import styles from "@/components/workbench/semantic-review/semantic-review.module.css";

export function RunResultReviewSurface({
  result,
  accessBoundary,
  guidePacket,
  guideLoading = false,
  guideRequestCount,
}: {
  result: ProjectRunResultDetailV01;
  accessBoundary?: ReactNode;
  guidePacket: ProjectGuideBriefV02 | null;
  guideLoading?: boolean;
  guideRequestCount?: number;
}) {
  const view = buildAIWorkplaneResultViewV01(result);
  const guideConsistency = compareAIWorkplaneGuideProjectV01(
    guidePacket,
    result.project_id,
  );
  if (guideConsistency.blocks_actions) {
    return (
      <ProductShell primaryZone="ai-workplane">
        <main
          className={styles.page}
          data-run-result-review="v0.1"
          data-ai-workplane-result-review="v0.1"
          data-result-review-read-only="true"
          data-semantic-mutation="false"
        >
          <AIWorkplaneShell
            guide={guidePacket?.projections.ai_workplane ?? null}
            guideLoading={guideLoading}
            guideRequestCount={guideRequestCount}
            title="Check the current project before continuing"
            description={guideConsistency.message ?? "Current project sources do not agree."}
            state="blocked"
            stateLabel="Current project sources do not agree"
            projectHref={`/projects/${encodeURIComponent(result.project_id)}`}
            exactDetailsHref={result.summary.inspector_href}
          >
            {accessBoundary}
            <section
              className={`${styles.panel} ${styles.workplaneFocus}`}
              role="alert"
              data-ai-workplane-guide-consistency={guideConsistency.status}
              data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.risk}
            >
              <p className={styles.copy}>{guideConsistency.message}</p>
              <a
                className={styles.button}
                href="/"
                data-ai-workplane-primary-action="open-blank-state"
                data-augnes-primary-action="open-blank-state"
                data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.primaryAction}
              >
                Open Blank State
              </a>
            </section>
          </AIWorkplaneShell>
        </main>
      </ProductShell>
    );
  }
  return (
    <ProductShell primaryZone="ai-workplane">
      <main
        className={styles.page}
        data-run-result-review="v0.1"
        data-ai-workplane-result-review="v0.1"
        data-result-review-read-only="true"
        data-semantic-mutation="false"
        data-ai-workplane-presentation={view.presentation_version}
      >
        <AIWorkplaneShell
          guide={guidePacket?.projections.ai_workplane ?? null}
          guideLoading={guideLoading}
          guideRequestCount={guideRequestCount}
          title={view.heading}
          description="Review the outcome, verification, remaining uncertainty, and the next meaningful action."
          state="result_ready"
          stateLabel={view.verification.label}
          projectHref={`/projects/${encodeURIComponent(result.project_id)}`}
          exactDetailsHref={result.summary.inspector_href}
        >
          {accessBoundary}

          <section
            className={`${styles.panel} ${styles.workplaneFocus}`}
            aria-labelledby="result-outcome-title"
            data-ai-workplane-result-section="outcome"
            data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.situation}
            data-augnes-independent-surface="result"
          >
            <div className={styles.panelHeader}>
              <p className={styles.kicker}>Outcome</p>
              <h2 id="result-outcome-title">{humanize(result.summary.outcome ?? result.summary.execution_status)}</h2>
            </div>
            <p className={styles.copy}>{view.outcome}</p>
          </section>

          <section
            className={styles.panel}
            aria-labelledby="result-next-step-title"
            data-ai-workplane-result-section="next-step"
            data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.primaryAction}
          >
            <div className={styles.panelHeader}>
              <p className={styles.kicker}>Next meaningful action</p>
              <h2 id="result-next-step-title">Continue from this result</h2>
            </div>
            <a
              className={styles.button}
              href={view.primary_action.href ?? "/workbench/semantic-review"}
              data-ai-workplane-primary-action={view.primary_action.kind}
              data-augnes-primary-action={view.primary_action.kind}
              data-result-to-proposal-link={result.proposal.status === "available" ? "true" : undefined}
            >
              {view.primary_action.label}
            </a>
          </section>

          <section
            className={styles.panel}
            aria-labelledby="result-verification-title"
            data-ai-workplane-verification={view.verification.status}
            data-ai-workplane-result-section="verification"
            data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.aiSummary}
          >
            <div className={styles.panelHeader}>
              <p className={styles.kicker}>AI summary</p>
              <h2 id="result-verification-title">{view.verification.label}</h2>
            </div>
            <dl className={styles.statusGrid}>
              <Metric label="Checks passed" value={String(view.verification.passed)} />
              <Metric label="Checks failed" value={String(view.verification.failed)} />
              <Metric label="Checks skipped" value={String(view.verification.skipped)} />
              <Metric label="Requirements satisfied" value={String(view.verification.satisfied)} />
              <Metric label="Requirements not satisfied" value={String(view.verification.unsatisfied)} />
              <Metric label="Requirements not confirmed" value={String(view.verification.unknown)} />
            </dl>
            {view.verification.blockers.length > 0 ? (
              <ul className={styles.plainList}>
                {view.verification.blockers.map((item) => <li key={item}>{item}</li>)}
              </ul>
            ) : null}
          </section>

          <section
            className={styles.panel}
            aria-labelledby="result-unresolved-title"
            data-ai-workplane-result-section="unresolved"
            data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.risk}
          >
            <div className={styles.panelHeader}>
              <p className={styles.kicker}>Risk and open questions</p>
              <h2 id="result-unresolved-title">What remains unresolved</h2>
            </div>
            {view.unresolved.length > 0 ? (
              <ul className={styles.plainList}>
                {view.unresolved.map((item) => <li key={item}>{item}</li>)}
              </ul>
            ) : (
              <p className={styles.copy}>No additional blocker or open question is reported.</p>
            )}
          </section>

          <details
            className={styles.advancedDisclosure}
            data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.rawRecord}
          >
            <summary>Advanced result details</summary>
            <TaskSuccessCriteria result={result} />
            <ReviewableProposal result={result} />
            {result.automation ? (
              <section className={styles.panel} data-policy-triggered-result="true">
                <h2>Automation boundary</h2>
                <dl className={styles.statusGrid}>
                  <Metric label="Attempt" value={String(result.automation.attempt)} />
                  <Metric label="Stop reason" value={result.automation.stop_reason ?? "unknown"} />
                  <Metric label="Automatic retry" value="false" />
                  <Metric label="Project authority granted" value="false" />
                </dl>
              </section>
            ) : null}
            <section
              id="run-result-inspector"
              className={styles.panel}
              data-run-result-inspector-forwarding="v0.1"
            >
              <h2>Exact result sources</h2>
              <a
                className={styles.linkButton}
                href={result.summary.inspector_href}
                data-result-to-shared-inspector="true"
              >
                View exact details
              </a>
            </section>
          </details>

          <p
            className={styles.notice}
            data-result-authority-boundary="true"
            data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.supporting}
          >
            Opening this result is read-only. It saved no decision, accepted no
            project change, and closed no work.
          </p>
        </AIWorkplaneShell>
      </main>
    </ProductShell>
  );
}

function TaskSuccessCriteria({ result }: { result: ProjectRunResultDetailV01 }) {
  const readback = result.criterion_assessment;
  if (readback.status === "unavailable") {
    return (
      <section className={styles.panel} data-task-success-criteria="unavailable">
        <h2>Exact requirement checks</h2>
        <p className={styles.copy} data-execution-task-success="unavailable">
          Execution {humanize(result.summary.execution_status)} / task success unavailable
        </p>
      </section>
    );
  }
  const assessment = readback.assessment;
  const taskSuccess = readback.task_success_status;
  return (
    <section
      className={styles.panel}
      data-task-success-criteria="available"
      data-task-success-status={taskSuccess}
      data-assessment-authoritative="false"
    >
      <h2>Exact requirement checks</h2>
      <p className={styles.copy} data-execution-task-success={`${result.summary.execution_status}:${taskSuccess}`}>
        Execution {humanize(result.summary.execution_status)} / task success {humanize(taskSuccess)}
      </p>
      <dl className={styles.statusGrid}>
        <Metric label="Satisfied" value={String(assessment.summary.satisfied)} />
        <Metric label="Unsatisfied" value={String(assessment.summary.unsatisfied)} />
        <Metric label="Unknown" value={String(assessment.summary.unknown)} />
        <Metric label="Not applicable" value={String(assessment.summary.not_applicable)} />
      </dl>
      <p className={styles.muted} data-result-criterion-summary="compact">
        {assessment.criteria.length} exact requirement checks are available here.
      </p>
      <p className={styles.muted} data-criterion-authority-boundary="true">
        This derived assessment is non-authoritative and changes neither saved
        project state nor later work context.
      </p>
    </section>
  );
}

function ReviewableProposal({ result }: { result: ProjectRunResultDetailV01 }) {
  const proposal = result.proposal;
  return (
    <section className={styles.panel} data-run-result-proposal={proposal.status}>
      <h2>Exact suggested-change admission</h2>
      {proposal.status === "available" ? (
        <>
          <p className={styles.copy}>A source-bound suggested change is available for separate review.</p>
          <a
            className={styles.linkButton}
            href={proposal.review_href}
            data-result-to-proposal-link="true"
          >
            Open exact suggested-change review
          </a>
        </>
      ) : proposal.status === "failed" ? (
        <p className={styles.copy}>Suggested-change admission failed: {proposal.error_code}.</p>
      ) : (
        <p className={styles.copy}>No suggested change is available: {humanize(proposal.reason)}.</p>
      )}
      <p className={styles.muted} data-proposal-authority-boundary="true">
        Candidate material is not a decision or applied project state.
      </p>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div><dt>{label}</dt><dd>{humanize(value)}</dd></div>;
}

function humanize(value: string): string {
  return value.replaceAll("_", " ");
}
