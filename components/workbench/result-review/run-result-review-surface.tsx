import type { ProjectRunResultDetailV01 } from "@/types/vnext/project-run-result";
import { SemanticWorkbenchShell } from "@/components/workbench/semantic-workbench-shell";
import { ProductShell } from "@/components/product-shell";

import styles from "@/components/workbench/semantic-review/semantic-review.module.css";

export function RunResultReviewSurface({
  result,
  accessBoundary,
}: {
  result: ProjectRunResultDetailV01;
  accessBoundary?: React.ReactNode;
}) {
  const summary = result.summary;
  const entryPresentation = resultEntryPresentation(result);
  return (
    <ProductShell surface="workbench">
      <main
        className={styles.page}
        data-run-result-review="v0.1"
        data-result-review-read-only="true"
        data-semantic-mutation="false"
      >
      <SemanticWorkbenchShell
        title="Verify run result"
        description="Compare one immutable, project-scoped RunReceipt with its selected context, verification residue, criterion assessment, and admitted candidate material. Opening this entry performs no semantic write."
        entryState={entryPresentation.state}
        entryLabel={entryPresentation.label}
        projectHref={`/projects/${encodeURIComponent(result.project_id)}`}
        inspectorHref={summary.inspector_href}
      >
        {accessBoundary}

        <section className={styles.panel} aria-labelledby="result-summary-title">
          <div className={styles.panelHeader}>
            <p className={styles.kicker}>Terminal result</p>
            <h2 id="result-summary-title">{humanize(summary.outcome ?? summary.execution_status)}</h2>
          </div>
          <p className={styles.copy}>{summary.summary}</p>
          <dl className={styles.statusGrid}>
            <Metric label="Execution" value={summary.execution_status} />
            <Metric label="Verification" value={summary.verification_status} />
            <Metric label="Trust" value={summary.trust_label} />
            <Metric label="Run mode" value={summary.mode} />
          </dl>
          <p className={styles.muted}>
            Finished {formatTimestamp(summary.finished_at ?? summary.recorded_at)} ·{" "}
            {summary.changed_file_count} changed files · {summary.check_counts.passed} checks passed ·{" "}
            {summary.check_counts.failed} failed · {summary.check_counts.skipped} skipped
          </p>
        </section>

        {result.automation ? (
          <section
            className={styles.panel}
            aria-labelledby="automation-boundary-title"
            data-policy-triggered-result="true"
          >
            <div className={styles.panelHeader}>
              <p className={styles.kicker}>Bounded automation</p>
              <h2 id="automation-boundary-title">
                {result.automation.stopped_at_review_needed
                  ? "Stopped for human review"
                  : "Bounded automation settlement"}
              </h2>
            </div>
            <p className={styles.copy}>
              This policy-triggered run used one bounded CapabilityGrant and the
              normal native-host and immutable receipt path. A review-needed
              stop is shown only after the assessment proposal is durably
              available. The policy and grant create no ReviewDecision or
              semantic authority.
            </p>
            <dl className={styles.statusGrid}>
              <Metric label="Attempt" value={String(result.automation.attempt)} />
              <Metric label="Stop reason" value={result.automation.stop_reason ?? "unknown"} />
              <Metric label="Augnes model calls" value={String(result.automation.budget.max_augnes_model_invocations)} />
              <Metric label="Native-host model scope" value={result.automation.budget.native_host_model_scope} />
              <Metric label="Network" value={result.automation.budget.network_access} />
            </dl>
          </section>
        ) : null}

        <TaskSuccessCriteria result={result} />
        <ReviewableProposal result={result} />

        <section
          id="run-result-inspector"
          className={styles.panel}
          data-run-result-inspector-forwarding="v0.1"
        >
          <div className={styles.panelHeader}>
            <p className={styles.kicker}>Exact read-heavy drill-down</p>
            <h2>Shared Inspector</h2>
          </div>
          <p className={styles.copy}>
            Provenance, approvals, artifacts, commands, checks, trust, privacy,
            model-invocation state, capability coverage, and packet/receipt
            lineage now share one authenticated Inspector destination.
          </p>
          <div className={styles.buttonRow}>
            <a
              className={styles.linkButton}
              href={summary.inspector_href}
              data-result-to-shared-inspector="true"
            >
              Inspect exact RunReceipt lineage
            </a>
          </div>
        </section>

        <section className={styles.notice} data-result-authority-boundary="true">
          No EpisodeDeltaProposal, ReviewDecision, semantic transition, Evidence acceptance,
          semantic state change, or work closure was created by opening this result.
        </section>
      </SemanticWorkbenchShell>
      </main>
    </ProductShell>
  );
}

function resultEntryPresentation(
  result: ProjectRunResultDetailV01,
): {
  state: "result_only" | "assessment";
  label: string;
} {
  if (result.proposal.status === "available") {
    return {
      state: "assessment",
      label: "Assessment · source-bound proposal available",
    };
  }
  if (result.criterion_assessment.status === "available") {
    return { state: "assessment", label: "Assessment available" };
  }
  return { state: "result_only", label: "Result only" };
}

function TaskSuccessCriteria({
  result,
}: {
  result: ProjectRunResultDetailV01;
}) {
  const readback = result.criterion_assessment;
  if (readback.status === "unavailable") {
    return (
      <section
        className={styles.panel}
        aria-labelledby="task-success-criteria-title"
        data-task-success-criteria="unavailable"
      >
        <div className={styles.panelHeader}>
          <p className={styles.kicker}>Derived criterion assessment</p>
          <h2 id="task-success-criteria-title">Task success criteria</h2>
        </div>
        <p className={styles.copy} data-execution-task-success="unavailable">
          Execution {humanize(result.summary.execution_status)} / task success unavailable
        </p>
        <p className={styles.muted}>
          Criterion assessment is unavailable for this historical result: {humanize(readback.reason)}.
          The receipt remains execution residue and no success status was inferred.
        </p>
      </section>
    );
  }

  const assessment = readback.assessment;
  const taskSuccess = readback.task_success_status;
  return (
    <section
      className={styles.panel}
      aria-labelledby="task-success-criteria-title"
      data-task-success-criteria="available"
      data-task-success-status={taskSuccess}
      data-assessment-authoritative="false"
    >
      <div className={styles.panelHeader}>
        <p className={styles.kicker}>Derived criterion assessment</p>
        <h2 id="task-success-criteria-title">Task success criteria</h2>
      </div>
      <p
        className={styles.copy}
        data-execution-task-success={`${result.summary.execution_status}:${taskSuccess}`}
      >
        Execution {humanize(result.summary.execution_status)} / task success {humanize(taskSuccess)}
      </p>
      <dl className={styles.statusGrid}>
        <Metric label="Satisfied" value={String(assessment.summary.satisfied)} />
        <Metric label="Unsatisfied" value={String(assessment.summary.unsatisfied)} />
        <Metric label="Unknown" value={String(assessment.summary.unknown)} />
        <Metric label="Not applicable" value={String(assessment.summary.not_applicable)} />
      </dl>
      <p className={styles.muted} data-result-criterion-summary="compact">
        {assessment.criteria.length} exact criteria are available in the Semantic
        Workbench for Verify and in the shared Inspector for source lineage.
      </p>
      <p className={styles.muted} data-criterion-authority-boundary="true">
        This assessment is derived and non-authoritative. It creates no Evidence,
        validates no Claim, creates no proposal or decision, applies no Transition,
        and changes neither semantic state nor later context.
      </p>
    </section>
  );
}

function ReviewableProposal({
  result,
}: {
  result: ProjectRunResultDetailV01;
}) {
  const proposal = result.proposal;
  return (
    <section
      className={styles.panel}
      aria-labelledby="run-result-proposal-title"
      data-run-result-proposal={proposal.status}
    >
      <div className={styles.panelHeader}>
        <p className={styles.kicker}>Post-receipt candidate material</p>
        <h2 id="run-result-proposal-title">Reviewable proposal</h2>
      </div>
      {proposal.status === "available" ? (
        <>
          <p className={styles.copy}>
            One exact pending-review EpisodeDeltaProposal was admitted from this
            persisted result and its criterion assessment. Opening this read-only
            result did not create or replay it.
          </p>
          <dl className={styles.statusGrid}>
            <Metric label="Proposal status" value={proposal.proposal_status} />
            <Metric label="ReviewDecision" value="none inferred" />
            <Metric label="Transition" value="not applied" />
            <Metric label="Semantic state" value="unchanged" />
          </dl>
          <div className={styles.buttonRow}>
            <a
              className={styles.linkButton}
              href={proposal.review_href}
              data-result-to-proposal-link="true"
            >
              Review exact proposal
            </a>
          </div>
        </>
      ) : proposal.status === "failed" ? (
        <>
          <p className={styles.copy}>
            The immutable receipt remains available and execution status is
            unchanged, but proposal admission needs a bounded retry.
          </p>
          <p className={styles.muted}>
            {proposal.error_code} · retryable {String(proposal.retryable)}
          </p>
        </>
      ) : (
        <p className={styles.muted}>
          No reviewable proposal is available: {humanize(proposal.reason)}. This
          read does not repair or create one. For a newly admitted receipt, the
          result loader performs bounded read-only refreshes while the separate
          proposal transaction settles.
        </p>
      )}
      <p className={styles.muted} data-proposal-authority-boundary="true">
        A pending proposal is candidate material, not accepted Evidence, a
        validated Claim, a ReviewDecision, a Transition, semantic state, or later
        context.
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

function formatTimestamp(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Time unavailable";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(parsed);
}
