"use client";

import { useEffect, useMemo, useState } from "react";

import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { ProductShell } from "@/components/product-shell";
import {
  RECOVERY_REFRESH_REQUIRED_NOTICE_V01,
  buildRecoveryActionControlViewV01,
  recoveryActionOutcomeRequiresRefreshV01,
} from "@/lib/vnext/recovery/recovery-action-confirmation";
import {
  buildRecoverySafetyViewV01,
  buildUnavailableRecoverySafetyViewV01,
} from "@/lib/vnext/recovery/recovery-safety-view";
import type {
  RecoveryActionConfirmationStateV01,
  RecoverySafetyActionV01,
  RecoverySafetyViewV01,
  RecoveryStatusV01,
} from "@/types/vnext/recovery-safety";
import styles from "./recovery.module.css";

interface SupportReportPreview {
  contract: "augnes.support-report-preview.v1";
  previewed: true;
  byte_count: number;
  report: Record<string, unknown> & {
    contract: "augnes.redacted-support-report.v1";
    generated_at: string;
    redacted: true;
    read_only: true;
    authoritative: false;
    exclusions: string[];
  };
}

interface RecoveryActionResult {
  accepted?: boolean;
  outcome:
    | "restore_scheduled"
    | "retry_scheduled"
    | "backup_created"
    | "refused"
    | "status_unknown";
  reason_code?: string;
  next_action?: string;
}

export default function RecoveryPage() {
  const [status, setStatus] = useState<RecoveryStatusV01 | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<
    | "create_backup"
    | "restore_backup"
    | "retry_update"
    | "preview_support_report"
    | null
  >(null);
  const [selectedBackupId, setSelectedBackupId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [supportPreview, setSupportPreview] =
    useState<SupportReportPreview | null>(null);
  const [restoreConfirmationOpen, setRestoreConfirmationOpen] = useState(false);
  const [actionConfirmationState, setActionConfirmationState] =
    useState<RecoveryActionConfirmationStateV01>("confirmed");

  const backups = useMemo(
    () => sortBackups(status?.backups ?? []),
    [status?.backups],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadStatus(controller.signal);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    setSelectedBackupId((current) => {
      if (
        current !== null &&
        backups.some(
          (backup) => backup.backup_id === current && backup.verified,
        )
      ) {
        return current;
      }
      return backups.find((backup) => backup.verified)?.backup_id ?? null;
    });
  }, [backups]);

  async function loadStatus(
    signal?: AbortSignal,
    page = 1,
    options: {
      confirm_current_state?: boolean;
    } = {},
  ): Promise<boolean> {
    setLoading(true);
    setUnavailable(false);
    try {
      const response = await fetch(`/api/recovery?page=${page}`, {
        method: "GET",
        cache: "no-store",
        signal,
      });
      if (!response.ok) throw new Error("recovery_unavailable");
      const value = (await response.json()) as RecoveryStatusV01;
      if (value.contract !== "augnes.recovery-product.v1") {
        throw new Error("recovery_unavailable");
      }
      setStatus(value);
      if (options.confirm_current_state) {
        setActionConfirmationState("confirmed");
      }
      return true;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return false;
      }
      setUnavailable(true);
      if (status !== null) {
        setNotice(
          "Recovery status could not be refreshed. The last confirmed status remains on screen.",
        );
      }
      return false;
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }

  function requireStatusRefresh(message = RECOVERY_REFRESH_REQUIRED_NOTICE_V01) {
    setActionConfirmationState("refresh_required");
    setRestoreConfirmationOpen(false);
    setNotice(message);
  }

  async function refreshCurrentStatus() {
    const refreshed = await loadStatus(
      undefined,
      status?.backup_page ?? 1,
      { confirm_current_state: true },
    );
    setNotice(
      refreshed
        ? "Recovery status refreshed. Available actions now use the current confirmed state."
        : `${RECOVERY_REFRESH_REQUIRED_NOTICE_V01} The refresh did not succeed.`,
    );
  }

  async function runAction(
    action: "create_backup" | "restore_backup" | "retry_update",
    backupId?: string,
  ) {
    if (actionConfirmationState === "refresh_required") return;
    setBusyAction(action);
    setNotice(null);
    try {
      const response = await fetch("/api/recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          ...(backupId === undefined ? {} : { backup_id: backupId }),
        }),
      });
      const value = (await response.json()) as RecoveryActionResult;
      if (!response.ok || !value.accepted) {
        if (value.outcome === "status_unknown") {
          requireStatusRefresh();
        } else if (value.outcome === "refused") {
          setNotice(
            `The recovery action was not scheduled. ${humanize(
              value.reason_code ?? "review_the_current_status",
            )}.`,
          );
        } else {
          requireStatusRefresh();
        }
        return;
      }
      if (recoveryActionOutcomeRequiresRefreshV01(value.outcome)) {
        requireStatusRefresh(
          value.outcome === "restore_scheduled"
            ? `The restore was accepted. ${RECOVERY_REFRESH_REQUIRED_NOTICE_V01}`
            : value.outcome === "retry_scheduled"
              ? `The update retry was accepted. ${RECOVERY_REFRESH_REQUIRED_NOTICE_V01}`
              : RECOVERY_REFRESH_REQUIRED_NOTICE_V01,
        );
      }
      if (value.outcome === "backup_created") {
        const refreshed = await loadStatus(
          undefined,
          status?.backup_page ?? 1,
          { confirm_current_state: true },
        );
        setNotice(
          refreshed
            ? "Backup created. Current recovery status was refreshed."
            : `${RECOVERY_REFRESH_REQUIRED_NOTICE_V01} The follow-up status read did not succeed.`,
        );
      }
    } catch {
      requireStatusRefresh();
    } finally {
      setBusyAction(null);
    }
  }

  function restoreBackup() {
    if (actionConfirmationState === "refresh_required") return;
    if (selectedBackup === null || !selectedBackup.verified) return;
    setRestoreConfirmationOpen(true);
  }

  function confirmRestoreBackup() {
    if (actionConfirmationState === "refresh_required") {
      setRestoreConfirmationOpen(false);
      return;
    }
    if (!selectedBackup?.verified) return;
    setRestoreConfirmationOpen(false);
    void runAction("restore_backup", selectedBackup.backup_id);
  }

  async function previewSupportReport() {
    setBusyAction("preview_support_report");
    setSupportPreview(null);
    setNotice(null);
    try {
      const response = await fetch("/api/recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "preview_support_report" }),
      });
      const value = (await response.json()) as SupportReportPreview;
      if (
        !response.ok ||
        value.contract !== "augnes.support-report-preview.v1" ||
        value.previewed !== true ||
        value.report?.contract !== "augnes.redacted-support-report.v1"
      ) {
        throw new Error("support_report_preview_unavailable");
      }
      setSupportPreview(value);
      setNotice(
        "Redacted support report preview is ready. No database contents or private provider material were collected.",
      );
    } catch {
      setNotice(
        "The redacted support report could not be previewed. No report was created.",
      );
    } finally {
      setBusyAction(null);
    }
  }

  function exportSupportReport() {
    if (supportPreview === null) return;
    const blob = new Blob(
      [`${JSON.stringify(supportPreview.report, null, 2)}\n`],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "augnes-redacted-support-report.json";
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice(
      "Redacted support report exported locally from the reviewed preview.",
    );
  }

  const selectedBackup =
    selectedBackupId === null
      ? null
      : backups.find((backup) => backup.backup_id === selectedBackupId) ?? null;
  const confirmedView = status
    ? buildRecoverySafetyViewV01({
        status,
        selected_backup_id: selectedBackup?.backup_id ?? null,
      })
    : null;
  const view = unavailable && status === null
    ? buildUnavailableRecoverySafetyViewV01()
    : confirmedView;
  const actionControl = view
    ? buildRecoveryActionControlViewV01({
        view,
        confirmation_state: actionConfirmationState,
      })
    : null;

  return (
    <ProductShell primaryZone={null}>
      <main
        className={styles.shell}
        data-recovery-product-surface="v0.1"
        data-recovery-safety-view={view?.view_version ?? "checking"}
        data-recovery-mode={view?.mode ?? "checking"}
        data-recovery-action-confirmation={actionConfirmationState}
      >
        {status && !status.recovery_mode ? (
          <a className={styles.returnLink} href="/">
            Back to Blank State
          </a>
        ) : null}
        <header className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>
              {status?.recovery_mode
                ? "Recovery mode"
                : status
                  ? "Manage and protect"
                  : "Application safety"}
            </p>
            <h1>{view?.heading ?? "Checking local data safety"}</h1>
            <p>
              {view?.situation ??
                "Augnes is checking the runtime, local data, and recovery points."}
            </p>
          </div>
          <span className={styles.localBadge}>Local data protection</span>
        </header>

        {notice ? (
          <p className={styles.notice} role="status">
            {notice}
          </p>
        ) : null}

        {loading && status === null ? (
          <section className={styles.panel} aria-live="polite">
            <p className={styles.kicker}>Current safety state</p>
            <h2>Checking local data safety</h2>
            <p>No recovery action is available until the current state is read.</p>
          </section>
        ) : view && status === null ? (
          <section
            className={`${styles.safetySummary} ${styles.safetyAttention}`}
            role="alert"
            data-recovery-primary-action={
              actionControl?.primary_action.kind ?? view.primary_action.kind
            }
          >
            <p className={styles.kicker}>Current safety state</p>
            <h2>{view.safety_status_label}</h2>
            <p>{view.situation}</p>
            <RecoveryPrimaryAction
              action={actionControl?.primary_action ?? view.primary_action}
              busyAction={busyAction}
              loading={loading}
              consequentialMutationsLocked={
                actionControl?.consequential_mutations_locked ?? false
              }
              onCreateBackup={() => void runAction("create_backup")}
              onRetryUpdate={() => void runAction("retry_update")}
              onRestore={restoreBackup}
              onRefresh={() => void refreshCurrentStatus()}
            />
          </section>
        ) : view && status ? (
          <>
            <section
              className={`${styles.safetySummary} ${
                view.safety_state === "ready"
                  ? styles.safetyReady
                  : styles.safetyAttention
              }`}
              role={
                view.safety_state === "attention" ||
                view.safety_state === "incompatible" ||
                view.safety_state === "unavailable"
                  ? "alert"
                  : "status"
              }
              data-recovery-safety-state={view.safety_state}
              data-recovery-primary-action={
                actionControl?.primary_action.kind ?? view.primary_action.kind
              }
            >
              <p className={styles.kicker}>Current safety state</p>
              <h2>{view.safety_status_label}</h2>
              <p>{view.situation}</p>
              {view.latest_operation_summary ? (
                <p className={styles.latestOperation}>
                  {view.latest_operation_summary}
                </p>
              ) : null}
              <div className={styles.primaryAction}>
                <p className={styles.kicker}>Next safe action</p>
                <RecoveryPrimaryAction
                  action={actionControl?.primary_action ?? view.primary_action}
                  busyAction={busyAction}
                  loading={loading}
                  consequentialMutationsLocked={
                    actionControl?.consequential_mutations_locked ?? false
                  }
                  onCreateBackup={() => void runAction("create_backup")}
                  onRetryUpdate={() => void runAction("retry_update")}
                  onRestore={restoreBackup}
                  onRefresh={() => void refreshCurrentStatus()}
                />
              </div>
            </section>

            <RecoveryPoints
              status={status}
              view={confirmedView ?? view}
              backups={backups}
              selectedBackupId={selectedBackupId}
              loading={loading}
              busyAction={busyAction}
              consequentialMutationsLocked={
                actionControl?.consequential_mutations_locked ?? false
              }
              onSelect={setSelectedBackupId}
              onPage={(page) => void loadStatus(undefined, page)}
            />

            <details
              className={styles.otherActions}
              data-recovery-secondary-actions="closed"
            >
              <summary>Other recovery actions</summary>
              <div className={styles.actions}>
                {(actionControl?.secondary_actions ?? view.secondary_actions).map((action) => (
                  <RecoverySecondaryAction
                    action={action}
                    key={action.kind}
                    status={status}
                    selectedBackup={selectedBackup}
                    busyAction={busyAction}
                    loading={loading}
                    consequentialMutationsLocked={
                      actionControl?.consequential_mutations_locked ?? false
                    }
                    onCreateBackup={() => void runAction("create_backup")}
                    onRetryUpdate={() => void runAction("retry_update")}
                    onRestore={restoreBackup}
                    onRefresh={() => void refreshCurrentStatus()}
                  />
                ))}
              </div>
            </details>

            <AdvancedDiagnostics
              status={status}
              supportPreview={supportPreview}
              busyAction={busyAction}
              onPreviewSupport={() => void previewSupportReport()}
              onExportSupport={exportSupportReport}
            />

            <p className={styles.boundary}>
              These controls protect application or database copies only. They
              do not accept project changes or grant work authority.
            </p>
          </>
        ) : null}
      </main>
      <ConfirmationDialog
        open={
          restoreConfirmationOpen &&
          actionConfirmationState === "confirmed"
        }
        title={`Restore ${selectedBackup?.label ?? "the selected backup"}?`}
        description="Augnes will protect the current state before replacing the database. Continuing explicitly authorizes this restore action."
        confirmLabel="Restore this verified backup"
        tone="danger"
        busy={busyAction === "restore_backup"}
        onCancel={() => setRestoreConfirmationOpen(false)}
        onConfirm={confirmRestoreBackup}
      >
        {selectedBackup ? (
          <dl>
            <div>
              <dt>Verified backup</dt>
              <dd>{selectedBackup.label}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{formatTimestamp(selectedBackup.created_at)}</dd>
            </div>
            <div>
              <dt>Protection</dt>
              <dd>Current state protected before replacement</dd>
            </div>
          </dl>
        ) : null}
      </ConfirmationDialog>
    </ProductShell>
  );
}

function RecoveryPrimaryAction({
  action,
  busyAction,
  loading,
  consequentialMutationsLocked,
  onCreateBackup,
  onRetryUpdate,
  onRestore,
  onRefresh,
}: {
  action: RecoverySafetyActionV01;
  busyAction: string | null;
  loading: boolean;
  consequentialMutationsLocked: boolean;
  onCreateBackup: () => void;
  onRetryUpdate: () => void;
  onRestore: () => void;
  onRefresh: () => void;
}) {
  if (action.kind === "none") {
    return (
      <p className={styles.noPrimaryAction}>
        Review the available actions below. Augnes will not guess between
        consequential choices.
      </p>
    );
  }
  const callback =
    action.kind === "create_backup"
      ? onCreateBackup
      : action.kind === "retry_update"
        ? onRetryUpdate
        : action.kind === "restore_backup"
          ? onRestore
          : onRefresh;
  return (
    <button
      type="button"
      className={styles.primaryButton}
      onClick={callback}
      disabled={
        busyAction !== null ||
        loading ||
        (consequentialMutationsLocked && action.mutates)
      }
    >
      {action.kind === busyAction
        ? action.kind === "create_backup"
          ? "Creating verified backup…"
          : action.kind === "retry_update"
            ? "Scheduling retry…"
            : "Scheduling restore…"
        : loading && action.kind === "check_again"
          ? "Checking…"
          : action.label}
    </button>
  );
}

function RecoverySecondaryAction({
  action,
  status,
  selectedBackup,
  busyAction,
  loading,
  consequentialMutationsLocked,
  onCreateBackup,
  onRetryUpdate,
  onRestore,
  onRefresh,
}: {
  action: RecoverySafetyActionV01;
  status: RecoveryStatusV01;
  selectedBackup: RecoveryStatusV01["backups"][number] | null;
  busyAction: string | null;
  loading: boolean;
  consequentialMutationsLocked: boolean;
  onCreateBackup: () => void;
  onRetryUpdate: () => void;
  onRestore: () => void;
  onRefresh: () => void;
}) {
  if (action.kind === "none") return null;
  const callback =
    action.kind === "create_backup"
      ? onCreateBackup
      : action.kind === "retry_update"
        ? onRetryUpdate
        : action.kind === "restore_backup"
          ? onRestore
          : onRefresh;
  const available =
    action.kind === "create_backup"
      ? status.actions.create_backup
      : action.kind === "retry_update"
        ? status.actions.retry_update
        : action.kind === "restore_backup"
          ? status.actions.restore_backup && selectedBackup?.verified === true
          : true;
  return (
    <button
      type="button"
      className={styles.secondaryButton}
      onClick={callback}
      disabled={
        !available ||
        busyAction !== null ||
        loading ||
        (consequentialMutationsLocked && action.mutates)
      }
    >
      {action.label}
    </button>
  );
}

function RecoveryPoints({
  status,
  view,
  backups,
  selectedBackupId,
  loading,
  busyAction,
  consequentialMutationsLocked,
  onSelect,
  onPage,
}: {
  status: RecoveryStatusV01;
  view: RecoverySafetyViewV01;
  backups: RecoveryStatusV01["backups"];
  selectedBackupId: string | null;
  loading: boolean;
  busyAction: string | null;
  consequentialMutationsLocked: boolean;
  onSelect: (backupId: string) => void;
  onPage: (page: number) => void;
}) {
  return (
    <section className={styles.panel} aria-labelledby="recovery-backups-title">
      <div className={styles.sectionHeading}>
        <div>
          <p className={styles.kicker}>Recovery points</p>
          <h2 id="recovery-backups-title">Verified local backups</h2>
        </div>
        <span className={styles.count}>
          {status.backup_inventory_state === "available"
            ? `${view.backup_summary.verified_count} verified`
            : "Inventory unavailable"}
        </span>
      </div>
      {view.backup_summary.notice ? (
        <p
          className={styles.inventoryNotice}
          role={
            status.backup_inventory_state === "unavailable" ? "alert" : "status"
          }
        >
          {view.backup_summary.notice}
        </p>
      ) : null}
      {backups.length === 0 ? (
        <p>
          {status.backup_inventory_state === "available"
            ? "No recovery points are currently shown."
            : "Recovery points could not be verified. No restore action is available."}
        </p>
      ) : (
        <fieldset className={styles.backupList}>
          <legend className="sr-only">Recovery point</legend>
          {backups.map((backup, index) => (
            <label
              className={styles.backupOption}
              data-verified={backup.verified ? "true" : "false"}
              key={`${backup.created_at}:${index}`}
              htmlFor={`recovery-backup-${index}`}
            >
              <input
                id={`recovery-backup-${index}`}
                type="radio"
                name="recovery-backup"
                checked={selectedBackupId === backup.backup_id}
                onChange={() => onSelect(backup.backup_id)}
                disabled={
                  !backup.verified ||
                  busyAction !== null ||
                  consequentialMutationsLocked
                }
              />
              <span>
                <strong>{backup.label}</strong>
                <span className={styles.backupMeta}>
                  <time dateTime={backup.created_at}>
                    {formatTimestamp(backup.created_at)}
                  </time>
                  {" · "}
                  {humanize(backup.reason)}
                  {" · "}
                  {backup.verified ? "Verified" : "Not verified"}
                </span>
              </span>
            </label>
          ))}
        </fieldset>
      )}
      {status.backup_inventory_truncated ? (
        <div className={styles.actions} aria-label="Recovery point pages">
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => onPage(status.backup_page - 1)}
            disabled={
              status.backup_page <= 1 || loading || busyAction !== null
            }
          >
            Newer recovery points
          </button>
          <span className={styles.count}>
            Page {status.backup_page} of {status.backup_page_count}
          </span>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => onPage(status.backup_page + 1)}
            disabled={
              status.backup_page >= status.backup_page_count ||
              loading ||
              busyAction !== null
            }
          >
            Older recovery points
          </button>
        </div>
      ) : null}
    </section>
  );
}

function AdvancedDiagnostics({
  status,
  supportPreview,
  busyAction,
  onPreviewSupport,
  onExportSupport,
}: {
  status: RecoveryStatusV01;
  supportPreview: SupportReportPreview | null;
  busyAction: string | null;
  onPreviewSupport: () => void;
  onExportSupport: () => void;
}) {
  const latest = status.latest_operation;
  const reconciliationCounts = status.continuity.reconciliation?.counts;
  const activeRunCount = reconciliationCounts
    ? reconciliationCounts.queued +
      reconciliationCounts.starting +
      reconciliationCounts.running +
      reconciliationCounts.cancelling
    : 0;
  const terminalRunCount = reconciliationCounts
    ? reconciliationCounts.completed +
      reconciliationCounts.failed +
      reconciliationCounts.timed_out +
      reconciliationCounts.cancelled
    : 0;

  return (
    <details className={styles.advancedDiagnostics}>
      <summary>
        <span>
          <strong>Advanced diagnostics</strong>
          <small>Build, database, continuity, and redacted support</small>
        </span>
        <span>Inspect</span>
      </summary>
      <div
        className={styles.advancedBody}
        data-continuity-diagnostics="v1"
      >
        <section className={styles.summaryGrid} aria-label="Recovery diagnostics">
          <article className={styles.panel}>
            <p className={styles.kicker}>Application and database</p>
            <h2>{status.application.version}</h2>
            <dl className={styles.facts}>
              <div>
                <dt>Build</dt>
                <dd>{status.application.build_identity}</dd>
              </div>
              <div>
                <dt>Package</dt>
                <dd>{status.application.package_contract ?? "Source runtime"}</dd>
              </div>
              <div>
                <dt>Database</dt>
                <dd>{humanize(status.database.state)}</dd>
              </div>
              <div>
                <dt>Schema</dt>
                <dd>{humanize(status.database.schema_classification)}</dd>
              </div>
              <div>
                <dt>Migration</dt>
                <dd>{humanize(status.database.migration_state)}</dd>
              </div>
            </dl>
          </article>

          <article className={styles.panel}>
            <p className={styles.kicker}>Runtime and protection</p>
            <h2>{humanize(status.runtime.lifecycle_state)}</h2>
            <dl className={styles.facts}>
              <div>
                <dt>Bridge</dt>
                <dd>{humanize(status.runtime.bridge_health)}</dd>
              </div>
              <div>
                <dt>Capabilities</dt>
                <dd>{humanize(status.runtime.capability_availability)}</dd>
              </div>
              <div>
                <dt>Data</dt>
                <dd>
                  {latest?.data_preserved
                    ? "Preserved"
                    : "Preservation not confirmed"}
                </dd>
              </div>
              <div>
                <dt>Safety backup</dt>
                <dd>
                  {latest?.safety_backup_created
                    ? "Created"
                    : "No additional safety backup reported"}
                </dd>
              </div>
            </dl>
          </article>

          <article className={styles.panel} data-run-reconciliation-status="v1">
            <p className={styles.kicker}>Restart reconciliation</p>
            <h2>
              {humanize(
                status.continuity.reconciliation?.outcome ??
                  "no_reconciliation_result",
              )}
            </h2>
            <dl className={styles.facts}>
              <div>
                <dt>Runs reviewed</dt>
                <dd>
                  {status.continuity.reconciliation
                    ?.total_runs_considered ?? 0}
                </dd>
              </div>
              <div>
                <dt>Active</dt>
                <dd>{activeRunCount}</dd>
              </div>
              <div>
                <dt>Terminal</dt>
                <dd>{terminalRunCount}</dd>
              </div>
              <div>
                <dt>Waiting</dt>
                <dd>
                  {status.continuity.reconciliation
                    ?.waiting_for_approval_count ?? 0}
                </dd>
              </div>
              <div>
                <dt>Review needed</dt>
                <dd>
                  {status.continuity.reconciliation
                    ?.orphaned_review_needed_count ?? 0}
                </dd>
              </div>
              <div>
                <dt>Unsupported host</dt>
                <dd>
                  {status.continuity.reconciliation
                    ?.unsupported_host_coverage_count ?? 0}
                </dd>
              </div>
              <div>
                <dt>Exact replay</dt>
                <dd>
                  {status.continuity.reconciliation
                    ?.exact_replays_reused ?? 0}
                </dd>
              </div>
              <div>
                <dt>Conflicts</dt>
                <dd>
                  {status.continuity.reconciliation
                    ?.conflicts_refused ?? 0}
                </dd>
              </div>
              <div>
                <dt>Automatic retry</dt>
                <dd>Not started</dd>
              </div>
            </dl>
          </article>
        </section>

        <section className={styles.panel}>
          <p className={styles.kicker}>Project transfer history</p>
          <h2>
            {humanize(
              status.continuity.portability?.outcome ??
                "no_project_transfer_recorded",
            )}
          </h2>
          <p>
            {status.continuity.portability?.outcome === "refused"
              ? `The latest ${humanize(
                  status.continuity.portability.operation,
                ).toLowerCase()} attempt was refused: ${humanize(
                  status.continuity.portability.reason_code,
                )}. No transfer authority was created.`
              : "Review the latest bounded local transfer result without treating it as recovery authority."}
          </p>
          <a href="/portability">Review project transfer history</a>
        </section>

        <section className={styles.panel} data-support-report-surface="v1">
          <p className={styles.kicker}>Redacted support report</p>
          <h2>{supportPreview ? "Preview reviewed" : "Preview before export"}</h2>
          <p>
            The report stays local and excludes database contents and private
            provider material.
          </p>
          {supportPreview ? (
            <div
              className={styles.reportPreview}
              data-support-report-preview="ready"
            >
              <p>
                {supportPreview.byte_count} bytes · redacted · read-only ·
                non-authoritative
              </p>
              <p>
                Excludes {supportPreview.report.exclusions.map(humanize).join(", ")}.
              </p>
            </div>
          ) : null}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={onPreviewSupport}
              disabled={busyAction !== null}
            >
              {busyAction === "preview_support_report"
                ? "Building preview…"
                : "Preview support report"}
            </button>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={onExportSupport}
              disabled={supportPreview === null || busyAction !== null}
            >
              Export redacted report
            </button>
          </div>
        </section>
      </div>
    </details>
  );
}

function sortBackups(
  backups: RecoveryStatusV01["backups"],
): RecoveryStatusV01["backups"] {
  return [...backups].sort(
    (left, right) => Date.parse(right.created_at) - Date.parse(left.created_at),
  );
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function humanize(value: string): string {
  const text = value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length === 0) return "Unavailable";
  return text[0].toUpperCase() + text.slice(1);
}
