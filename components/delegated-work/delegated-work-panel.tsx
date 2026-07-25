"use client";

import type { DelegatedWorkProjectionV01 } from "@/types/vnext/delegated-work";
import type { DelegatedWorkActionV01 } from "./use-delegated-codex-work-v0-1";
import { SEMANTIC_VISUAL_PRIORITY } from "@/lib/vnext/semantic-visual/semantic-visual-contract";

import styles from "@/components/workbench/semantic-review/semantic-review.module.css";

export function DelegatedWorkPanel({
  projection,
  status,
  error,
  requestCount,
  ownsPrimaryAction,
  onAction,
}: {
  projection: DelegatedWorkProjectionV01 | null;
  status: "idle" | "loading" | "ready" | "acting" | "unavailable";
  error: string | null;
  requestCount: number;
  ownsPrimaryAction: boolean;
  onAction: (action: DelegatedWorkActionV01) => Promise<boolean>;
}) {
  const busy = status === "acting";
  const pending = projection?.pending_approval ?? null;
  return (
    <section
      id="delegated-work"
      className={`${styles.panel} ${styles.delegatedWork}`}
      aria-labelledby="delegated-work-title"
      data-delegated-work="delegated_work_projection.v0.1"
      data-delegated-work-stage={projection?.stage ?? "checking"}
      data-delegated-work-request-count={requestCount}
      data-delegated-work-polling={
        projection &&
        (["preparing", "working", "cancelling"].includes(
          projection.stage,
        ) ||
          (projection.stage === "waiting_for_approval" &&
            pending?.decision_submitted))
          ? "true"
          : "false"
      }
      data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.situation}
      data-augnes-independent-surface="delegated-work"
    >
      <div className={styles.panelHeader}>
        <p className={styles.kicker}>Delegated Codex work</p>
        <h2 id="delegated-work-title">
          {projection?.current.stage_label ??
            (status === "loading"
              ? "Checking current Codex work"
              : "Current progress is unavailable")}
        </h2>
        <p className={styles.copy}>
          {projection?.current.situation ??
            "Augnes could not confirm the current delegated-work state."}
        </p>
      </div>

      {projection?.current.goal ? (
        <p className={styles.delegatedGoal}>
          <span>Current goal</span>
          <strong>{projection.current.goal}</strong>
        </p>
      ) : null}

      {projection?.current.latest_checkpoint ? (
        <p className={styles.notice}>
          Latest checkpoint: {projection.current.latest_checkpoint}
        </p>
      ) : null}

      <div className={styles.buttonRow}>
        {ownsPrimaryAction ? (
          <PrimaryDelegatedAction
            projection={projection}
            busy={busy}
            onAction={onAction}
          />
        ) : null}
        {!ownsPrimaryAction &&
        projection?.stage === "not_started" &&
        projection.start_eligible ? (
          <button
            type="button"
            className={styles.linkButton}
            data-delegated-work-action="start"
            disabled={busy}
            onClick={() => void onAction({ action: "start_live" })}
          >
            {busy ? "Starting Codex work…" : "Start Codex work"}
          </button>
        ) : null}
        {projection?.can_cancel && projection.run_ref ? (
          <button
            type="button"
            className={styles.secondaryDangerButton}
            data-delegated-work-action="cancel"
            disabled={busy || projection.stage === "cancelling"}
            onClick={() =>
              void onAction({
                action: "cancel",
                run_ref: projection.run_ref!,
                control_revision: projection.control_revision,
              })
            }
          >
            Stop Codex work
          </button>
        ) : null}
      </div>

      {pending ? (
        <section
          id="delegated-work-approval"
          className={styles.delegatedApproval}
          aria-labelledby="delegated-work-approval-title"
          data-delegated-work-approval="pending"
          data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.risk}
        >
          <div>
            <p className={styles.kicker}>Requested access</p>
            <h3 id="delegated-work-approval-title">{pending.title}</h3>
            <p>{pending.reason}</p>
            <p className={styles.muted}>{pending.resource_summary}</p>
            {pending.command_summary ? (
              <p className={styles.muted}>
                Requested command: {pending.command_summary}
              </p>
            ) : null}
            <p className={styles.notice}>{pending.risk}</p>
          </div>
          <div className={styles.buttonRow}>
            {pending.available_decisions.includes("approve_once") ? (
              <button
                type="button"
                className={styles.linkButton}
                data-delegated-work-action="approve-once"
                disabled={busy || pending.decision_submitted}
                onClick={() =>
                  projection?.run_ref &&
                  void onAction({
                    action: "approve_once",
                    run_ref: projection.run_ref,
                    approval_ref: pending.approval_ref,
                    control_revision: projection.control_revision,
                  })
                }
              >
                Approve once
              </button>
            ) : null}
            <button
              type="button"
              className={styles.linkButton}
              data-delegated-work-action="decline"
              disabled={busy || pending.decision_submitted}
              onClick={() =>
                projection?.run_ref &&
                void onAction({
                  action: "decline",
                  run_ref: projection.run_ref,
                  approval_ref: pending.approval_ref,
                  control_revision: projection.control_revision,
                })
              }
            >
              Decline
            </button>
          </div>
          <p className={styles.muted}>
            This operational choice does not approve a result or change the
            project.
          </p>
        </section>
      ) : null}

      {projection?.timeline.length ? (
        <div data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.aiSummary}>
          <h3>Progress</h3>
          <ol
            className={styles.delegatedTimeline}
            aria-label="Delegated Codex work progress"
          >
            {projection.timeline.map((item) => (
              <li
                key={item.item_id}
                data-delegated-work-timeline-kind={item.kind}
                data-delegated-work-current={
                  item.current ? "true" : "false"
                }
                aria-current={item.current ? "step" : undefined}
              >
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.summary}</p>
                </div>
                <time dateTime={item.occurred_at}>
                  {formatObservedTimeV01(item.occurred_at)}
                </time>
              </li>
            ))}
          </ol>
          {projection.compacted_item_count > 0 ? (
            <p className={styles.muted}>
              Earlier progress was compacted.
            </p>
          ) : null}
        </div>
      ) : null}

      {projection?.exact_detail_href ? (
        <a
          className={styles.inlineLink}
          href={projection.exact_detail_href}
          data-delegated-work-exact-details="true"
        >
          View exact details
        </a>
      ) : null}

      {error ? (
        <p className={styles.error} role="alert">
          {delegatedWorkErrorCopyV01(error)}
        </p>
      ) : null}
      <p
        className={styles.visuallyHidden}
        role="status"
        aria-live="polite"
        data-delegated-work-live-status="true"
      >
        {projection?.current.stage_label ?? ""}
      </p>
      <p className={styles.muted}>
        Leaving this page does not itself cancel admitted local work. The local
        Augnes runtime must remain running; lost runtime ownership requires an
        explicit resume.
      </p>
    </section>
  );
}

function delegatedWorkErrorCopyV01(error: string): string {
  if (error === "delegated_work_progress_refresh_unavailable") {
    return "The action was accepted, but current progress could not be refreshed. Reload this page when ready.";
  }
  if (error === "delegated_work_projection_unavailable") {
    return "Current progress could not be read. Reload this page when ready.";
  }
  return `Current Codex work unavailable: ${error.replaceAll("_", " ")}`;
}

function PrimaryDelegatedAction({
  projection,
  busy,
  onAction,
}: {
  projection: DelegatedWorkProjectionV01 | null;
  busy: boolean;
  onAction: (action: DelegatedWorkActionV01) => Promise<boolean>;
}) {
  if (!projection) return null;
  if (projection.stage === "not_started" && projection.start_eligible) {
    return (
      <button
        type="button"
        className={styles.button}
          data-ai-workplane-primary-action="start-codex-work"
          data-augnes-primary-action="start-codex-work"
          data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.primaryAction}
        data-delegated-work-action="start"
        disabled={busy}
        onClick={() => void onAction({ action: "start_live" })}
      >
        {busy ? "Starting Codex work…" : "Start Codex work"}
      </button>
    );
  }
  if (
    projection.stage === "waiting_for_approval" &&
    projection.pending_approval
  ) {
    return (
      <a
        className={styles.button}
        href="#delegated-work-approval"
        data-ai-workplane-primary-action="review-requested-access"
        data-augnes-primary-action="review-requested-access"
        data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.primaryAction}
      >
        Review requested access
      </a>
    );
  }
  if (projection.stage === "resume_required" && projection.run_ref) {
    return (
      <button
        type="button"
        className={styles.button}
        data-ai-workplane-primary-action="resume-codex-work"
        data-augnes-primary-action="resume-codex-work"
        data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.primaryAction}
        data-delegated-work-action="resume"
        disabled={busy}
        onClick={() =>
          void onAction({
            action: "resume",
            run_ref: projection.run_ref!,
            control_revision: projection.control_revision,
          })
        }
      >
        {busy ? "Resuming Codex work…" : "Resume Codex work"}
      </button>
    );
  }
  if (projection.stage === "result_ready" && projection.result) {
    return (
      <a
        className={styles.button}
        href={projection.result.review_href}
        data-ai-workplane-primary-action="review-result"
        data-augnes-primary-action="review-result"
        data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.primaryAction}
      >
        Review result
      </a>
    );
  }
  if (
    ["blocked", "failed", "cancelled", "timed_out", "unavailable"].includes(
      projection.stage,
    )
  ) {
    return (
      <a
        className={styles.button}
        href="/"
        data-ai-workplane-primary-action="return-to-blank-state"
        data-augnes-primary-action="return-to-blank-state"
        data-augnes-visual-priority={SEMANTIC_VISUAL_PRIORITY.primaryAction}
      >
        Return to Blank State
      </a>
    );
  }
  return null;
}

function formatObservedTimeV01(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Observed time unavailable"
    : date.toLocaleString();
}
