"use client";

import { useEffect, useMemo, useState } from "react";

import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { ProductShell } from "@/components/product-shell";
import styles from "./recovery.module.css";

interface RecoveryStatus {
  contract: "augnes.recovery-product.v1";
  schema_version: 1;
  recovery_mode: boolean;
  application: {
    version: string;
    build_identity: string;
    package_contract: string | null;
    package_contract_version: number | null;
    compatibility: "verified_package" | "source_runtime";
  };
  database: {
    state: string;
    schema_contract: string | null;
    schema_classification: "current" | "old" | "incompatible" | "unavailable";
    migration_state: string;
  };
  runtime: {
    runtime_contract: string | null;
    runtime_schema_version: number | null;
    lifecycle_state: string;
    bridge_health: string;
    capability_availability: string;
  };
  continuity: ContinuityStatus;
  latest_operation: {
    outcome: string;
    reason_code: string;
    application_version: string | null;
    target_application_version: string | null;
    target_build_identity: string | null;
    database_state: string | null;
    data_preserved: boolean;
    backup_verified: boolean;
    safety_backup_created: boolean;
    next_action: string;
  } | null;
  backup_inventory_state: "available" | "unavailable";
  backup_count: number;
  legacy_backup_count: number;
  legacy_backup_unavailable_count: number;
  backup_inventory_truncated: boolean;
  backup_page: number;
  backup_page_count: number;
  backups: Array<{
    backup_id: string;
    label: string;
    created_at: string;
    reason: string;
    source_application_version: string;
    verified: boolean;
  }>;
  actions: {
    create_backup: boolean;
    retry_update: boolean;
    restore_backup: boolean;
  };
}

interface ContinuityStatus {
  contract: "augnes.continuity-operations.v1";
  status_available: boolean;
  public_reason_code: string;
  portability: null | {
    operation: "preview" | "export" | "import";
    outcome: "available" | "completed" | "exact_replay" | "refused";
    reason_code: string;
    record_count: number;
    reader_verification: "not_applicable" | "verified" | "refused";
    next_safe_action: string;
  };
  reconciliation: null | {
    outcome: "reconciled" | "review_needed" | "conflict_refused";
    total_runs_considered: number;
    counts: Record<string, number>;
    exact_replays_reused: number;
    conflicts_refused: number;
    waiting_for_approval_count: number;
    orphaned_review_needed_count: number;
    unsupported_host_coverage_count: number;
    no_retry_count: number;
    reason_codes: string[];
    next_safe_action: string;
    automatic_retry_started: false;
    semantic_authority_created: false;
    external_action_created: false;
  };
}

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
  const [status, setStatus] = useState<RecoveryStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<
    "create_backup" | "restore_backup" | "retry_update" | "preview_support_report" | null
  >(null);
  const [selectedBackupId, setSelectedBackupId] = useState<string | null>(
    null,
  );
  const [notice, setNotice] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [supportPreview, setSupportPreview] =
    useState<SupportReportPreview | null>(null);
  const [restoreConfirmationOpen, setRestoreConfirmationOpen] = useState(false);

  const backups = useMemo(
    () => sortBackups(status?.backups ?? []),
    [status?.backups],
  );
  const reconciliationCounts = status?.continuity.reconciliation?.counts;
  const activeRunCount = reconciliationCounts
    ? reconciliationCounts.queued + reconciliationCounts.starting +
      reconciliationCounts.running + reconciliationCounts.cancelling
    : 0;
  const terminalRunCount = reconciliationCounts
    ? reconciliationCounts.completed + reconciliationCounts.failed +
      reconciliationCounts.timed_out + reconciliationCounts.cancelled
    : 0;

  useEffect(() => {
    const controller = new AbortController();
    void loadStatus(controller.signal);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    setSelectedBackupId((current) => {
      if (current !== null && backups.some(
        (backup) => backup.backup_id === current && backup.verified,
      )) {
        return current;
      }
      return backups.find((backup) => backup.verified)?.backup_id ?? null;
    });
  }, [backups]);

  async function loadStatus(signal?: AbortSignal, page = 1) {
    setLoading(true);
    setUnavailable(false);
    try {
      const response = await fetch(`/api/recovery?page=${page}`, {
        method: "GET",
        cache: "no-store",
        signal,
      });
      if (!response.ok) throw new Error("recovery_unavailable");
      const value = (await response.json()) as RecoveryStatus;
      if (value.contract !== "augnes.recovery-product.v1") {
        throw new Error("recovery_unavailable");
      }
      setStatus(value);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setUnavailable(true);
      if (status !== null) {
        setNotice(
          "Recovery status could not be refreshed. The last confirmed status remains on screen.",
        );
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }

  async function runAction(
    action: "create_backup" | "restore_backup" | "retry_update",
    backupId?: string,
  ) {
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
        setNotice(
          value.outcome === "status_unknown"
            ? "Augnes could not confirm whether the action was accepted. Refresh recovery status before choosing another action."
            : value.outcome === "refused"
            ? `The recovery action was not scheduled. ${humanize(value.reason_code ?? "review_the_current_status")}.`
            : "The recovery action could not be confirmed. Refresh recovery status before choosing another action.",
        );
        return;
      }
      setNotice(
        `${humanize(value.outcome)}. ${humanize(value.next_action ?? "wait_for_the_operation_to_finish")}.`,
      );
      if (value.outcome === "backup_created") {
        await loadStatus(undefined, status?.backup_page ?? 1);
      }
    } catch {
      setNotice(
        "The recovery action could not be confirmed. Refresh recovery status before choosing another action.",
      );
    } finally {
      setBusyAction(null);
    }
  }

  function retryUpdate() {
    void runAction("retry_update");
  }

  function createBackup() {
    void runAction("create_backup");
  }

  function restoreBackup() {
    if (selectedBackupId === null) return;
    const selected = backups.find(
      (backup) => backup.backup_id === selectedBackupId,
    );
    if (!selected?.verified) return;
    setRestoreConfirmationOpen(true);
  }

  function confirmRestoreBackup() {
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
      setNotice("Redacted support report preview is ready. No database contents or private provider material were collected.");
    } catch {
      setNotice("The redacted support report could not be previewed. No report was created.");
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
    setNotice("Redacted support report exported locally from the reviewed preview.");
  }

  const latest = status?.latest_operation ?? null;
  const selectedBackup =
    selectedBackupId === null
      ? null
      : backups.find((backup) => backup.backup_id === selectedBackupId) ?? null;

  return (
    <ProductShell surface="recovery">
      <main className={styles.shell}>
        <header className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>Application safety</p>
            <h1>Update and data recovery</h1>
            <p>
              Check local application and data health, create verified recovery
              points, or take an explicitly authorized recovery action.
            </p>
          </div>
          <span className={styles.localBadge}>Local data protection</span>
        </header>

      {notice && (
        <p className={styles.notice} role="status">
          {notice}
        </p>
      )}

      {loading && status === null ? (
        <section className={styles.panel} aria-live="polite">
          <h2>Reading recovery status</h2>
          <p>The local runtime is checking the application and database.</p>
        </section>
      ) : unavailable && status === null ? (
        <section className={`${styles.panel} ${styles.attention}`} role="alert">
          <p className={styles.kicker}>Status unavailable</p>
          <h2>Recovery status could not be read</h2>
          <p>
            This read did not change your data. Keep Augnes open and try the
            status check again.
          </p>
          <button
            type="button"
            onClick={() => void loadStatus()}
            disabled={loading}
          >
            {loading ? "Checking…" : "Check again"}
          </button>
        </section>
      ) : status ? (
        <>
          <section
            className={`${styles.safetySummary} ${status.recovery_mode ? styles.safetyAttention : styles.safetyReady}`}
            aria-labelledby="recovery-safety-title"
          >
            <div>
              <p className={styles.kicker}>Overall safety state</p>
              <h2 id="recovery-safety-title">
                {status.recovery_mode
                  ? "Recovery mode needs your attention"
                  : status.database.schema_classification === "current"
                    ? "Local data is ready"
                    : "Review database compatibility"}
              </h2>
              <p>{humanize(latest?.next_action ?? "review_the_available_recovery_actions")}</p>
              <a href="#recovery-actions">Review available recovery actions</a>
            </div>
            <dl className={styles.safetyFacts}>
              <div><dt>Application</dt><dd>{status.application.version} · {humanize(status.application.compatibility)}</dd></div>
              <div><dt>Database</dt><dd>{humanize(status.database.state)} · schema {humanize(status.database.schema_classification)}</dd></div>
              <div><dt>Runtime</dt><dd>{humanize(status.runtime.bridge_health)} bridge · {humanize(status.runtime.capability_availability)}</dd></div>
              <div><dt>Verified backups</dt><dd>{backups.filter((backup) => backup.verified).length} shown</dd></div>
            </dl>
          </section>

          <details className={styles.advancedDiagnostics}>
            <summary>
              <span><strong>Health, continuity, and support diagnostics</strong><small>Exact build, database, bridge, portability, reconciliation, and report details</small></span>
              <span>Inspect details</span>
            </summary>
            <div className={styles.advancedBody}>
          <section className={styles.summaryGrid} aria-label="Recovery summary">
            <article className={styles.panel}>
              <p className={styles.kicker}>Application</p>
              <h2>Build {status.application.version}</h2>
              <dl className={styles.facts}>
                <div><dt>Version</dt><dd>{status.application.version}</dd></div>
                <div><dt>Build</dt><dd>{status.application.build_identity}</dd></div>
                <div><dt>Package contract</dt><dd>{status.application.package_contract ?? "Source runtime"}</dd></div>
                <div><dt>Compatibility</dt><dd>{humanize(status.application.compatibility)}</dd></div>
                <div><dt>Runtime</dt><dd>{status.runtime.runtime_contract ?? "Unavailable"}</dd></div>
                <div><dt>Bridge</dt><dd>{humanize(status.runtime.bridge_health)}</dd></div>
                <div><dt>Capabilities</dt><dd>{humanize(status.runtime.capability_availability)}</dd></div>
              </dl>
            </article>

            <article className={styles.panel}>
              <p className={styles.kicker}>Database and update</p>
              <h2>{humanize(latest?.outcome ?? status.database.state)}</h2>
              <dl className={styles.facts}>
                <div><dt>Database</dt><dd>{humanize(status.database.state)}</dd></div>
                <div><dt>Schema</dt><dd>{humanize(status.database.schema_classification)}</dd></div>
                <div><dt>Schema contract</dt><dd>{status.database.schema_contract ?? "Unavailable"}</dd></div>
                <div><dt>Migration</dt><dd>{humanize(status.database.migration_state)}</dd></div>
                {latest && <div><dt>Outcome</dt><dd>{humanize(latest.reason_code)}</dd></div>}
                {latest && <div><dt>Source version</dt><dd>{latest.application_version ?? "Unknown (offline data)"}</dd></div>}
                {latest?.target_application_version && <div><dt>Target version</dt><dd>{latest.target_application_version}</dd></div>}
              </dl>
            </article>

            <article className={styles.panel}>
              <p className={styles.kicker}>Data protection</p>
              <h2>
                {latest === null
                  ? "No recovery operation"
                  : latest.data_preserved
                    ? "Data preserved"
                    : "Needs attention"}
              </h2>
              {latest ? (
                <ul className={styles.checks}>
                  <li data-state={latest.data_preserved ? "good" : "attention"}>
                    {latest.data_preserved ? "Application data was preserved" : "Data preservation is not confirmed"}
                  </li>
                  <li data-state={latest.backup_verified ? "good" : "attention"}>
                    {latest.backup_verified ? "Recovery backup verified" : "No verified recovery backup reported"}
                  </li>
                  <li data-state={latest.safety_backup_created ? "good" : "neutral"}>
                    {latest.safety_backup_created ? "Safety backup created" : "No additional safety backup was needed"}
                  </li>
                </ul>
              ) : (
                <p>No update or restore operation has been recorded.</p>
              )}
            </article>
          </section>

          <section
            className={styles.summaryGrid}
            aria-label="Portable continuity and run reconciliation"
            data-continuity-diagnostics="v1"
          >
            <article className={styles.panel}>
              <p className={styles.kicker}>Portable continuity</p>
              <h2>{humanize(status.continuity.portability?.outcome ?? "no_portable_operation")}</h2>
              <dl className={styles.facts}>
                <div><dt>Operation</dt><dd>{humanize(status.continuity.portability?.operation ?? "none")}</dd></div>
                <div><dt>Reason</dt><dd>{humanize(status.continuity.portability?.reason_code ?? status.continuity.public_reason_code)}</dd></div>
                <div><dt>Records</dt><dd>{status.continuity.portability?.record_count ?? 0}</dd></div>
                <div><dt>Readers</dt><dd>{humanize(status.continuity.portability?.reader_verification ?? "not_verified")}</dd></div>
              </dl>
              <p><a href="/portability">Open project portability</a></p>
            </article>

            <article className={styles.panel} data-run-reconciliation-status="v1">
              <p className={styles.kicker}>Restart reconciliation</p>
              <h2>{humanize(status.continuity.reconciliation?.outcome ?? "no_reconciliation_result")}</h2>
              <dl className={styles.facts}>
                <div><dt>Runs reviewed</dt><dd>{status.continuity.reconciliation?.total_runs_considered ?? 0}</dd></div>
                <div><dt>Active</dt><dd>{activeRunCount}</dd></div>
                <div><dt>Terminal</dt><dd>{terminalRunCount}</dd></div>
                <div><dt>Waiting approval</dt><dd>{status.continuity.reconciliation?.waiting_for_approval_count ?? 0}</dd></div>
                <div><dt>Review needed</dt><dd>{status.continuity.reconciliation?.orphaned_review_needed_count ?? 0}</dd></div>
                <div><dt>Unsupported host</dt><dd>{status.continuity.reconciliation?.unsupported_host_coverage_count ?? 0}</dd></div>
                <div><dt>Exact replay</dt><dd>{status.continuity.reconciliation?.exact_replays_reused ?? 0}</dd></div>
                <div><dt>Conflicts</dt><dd>{status.continuity.reconciliation?.conflicts_refused ?? 0}</dd></div>
                <div><dt>Automatic retry</dt><dd>{status.continuity.reconciliation?.automatic_retry_started === false ? "Not started" : "Unavailable"}</dd></div>
              </dl>
            </article>

            <article className={styles.panel} data-support-report-surface="v1">
              <p className={styles.kicker}>Public-safe support report</p>
              <h2>{supportPreview ? "Preview reviewed" : "Preview before export"}</h2>
              <p>Uses only the bounded recovery, portability, runtime, and reconciliation status shown here.</p>
              {supportPreview ? (
                <div className={styles.reportPreview} data-support-report-preview="ready">
                  <p>{supportPreview.byte_count} bytes · redacted · read-only · non-authoritative</p>
                  <p>Excludes {supportPreview.report.exclusions.map(humanize).join(", ")}.</p>
                </div>
              ) : null}
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => void previewSupportReport()}
                  disabled={busyAction !== null}
                >
                  {busyAction === "preview_support_report" ? "Building preview…" : "Preview support report"}
                </button>
                <button
                  type="button"
                  onClick={exportSupportReport}
                  disabled={supportPreview === null || busyAction !== null}
                >
                  Export redacted report
                </button>
              </div>
            </article>
          </section>

            </div>
          </details>

          <section className={styles.panel} aria-labelledby="recovery-backups-title">
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.kicker}>Recovery points</p>
                <h2 id="recovery-backups-title">Choose a backup</h2>
              </div>
              <span className={styles.count}>
                {status.backup_inventory_state === "available"
                  ? `${status.backup_count} available`
                  : "Inventory unavailable"}
              </span>
            </div>

            {backups.length === 0 ? (
              <p>
                {status.backup_inventory_state === "available"
                  ? "No recovery backups are currently available."
                  : "Recovery backups could not be verified. No restore action is available."}
              </p>
            ) : (
              <fieldset className={styles.backupList}>
                <legend className="sr-only">Recovery backup</legend>
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
                      onChange={() => setSelectedBackupId(backup.backup_id)}
                      disabled={!backup.verified || busyAction !== null}
                    />
                    <span>
                      <strong>{backup.label}</strong>
                      <span className={styles.backupMeta}>
                        <time dateTime={backup.created_at}>{formatTimestamp(backup.created_at)}</time>
                        {" · "}{humanize(backup.reason)}
                        {" · "}{backup.verified ? "Verified" : "Not verified"}
                      </span>
                    </span>
                  </label>
                ))}
              </fieldset>
            )}
            {status.backup_inventory_truncated ? (
              <div className={styles.actions} aria-label="Recovery backup pages">
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() =>
                    void loadStatus(undefined, status.backup_page - 1)
                  }
                  disabled={
                    status.backup_page <= 1 || loading || busyAction !== null
                  }
                >
                  Newer backups
                </button>
                <span className={styles.count}>
                  Page {status.backup_page} of {status.backup_page_count}
                </span>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() =>
                    void loadStatus(undefined, status.backup_page + 1)
                  }
                  disabled={
                    status.backup_page >= status.backup_page_count ||
                    loading ||
                    busyAction !== null
                  }
                >
                  Older backups
                </button>
              </div>
            ) : null}
            {status.legacy_backup_unavailable_count > 0 ? (
              <p className={styles.notice} role="status">
                {status.legacy_backup_unavailable_count} older recovery backup
                {status.legacy_backup_unavailable_count === 1 ? " is" : "s are"}{" "}
                preserved but cannot be restored by this build. Relaunch a
                compatible verified Augnes package to review it.
              </p>
            ) : null}
          </section>

          <section id="recovery-actions" className={`${styles.panel} ${styles.nextAction}`} aria-labelledby="recovery-next-action-title">
            <div>
              <p className={styles.kicker}>Next safe action</p>
              <h2 id="recovery-next-action-title">
                {humanize(latest?.next_action ?? "review_the_available_recovery_actions")}
              </h2>
              <p>
                Create backup makes a verified full recovery copy. Retry
                continues the verified update path. Restore replaces the
                database only with the backup selected above and protects the
                current copy first.
              </p>
            </div>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={createBackup}
                disabled={!status.actions.create_backup || busyAction !== null}
              >
                {busyAction === "create_backup"
                  ? "Creating verified backup…"
                  : "Create recovery backup"}
              </button>
              <button
                type="button"
                onClick={retryUpdate}
                disabled={!status.actions.retry_update || busyAction !== null}
              >
                {busyAction === "retry_update" ? "Scheduling retry…" : "Retry update"}
              </button>
              <button
                type="button"
                className={styles.restoreAction}
                onClick={restoreBackup}
                disabled={
                  !status.actions.restore_backup ||
                  selectedBackup === null ||
                  !selectedBackup.verified ||
                  busyAction !== null
                }
              >
                {busyAction === "restore_backup"
                  ? "Scheduling restore…"
                  : selectedBackup?.backup_id === backups[0]?.backup_id
                    ? "Restore latest backup"
                    : "Restore selected backup"}
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => void loadStatus(undefined, status.backup_page)}
                disabled={loading || busyAction !== null}
              >
                {loading ? "Refreshing…" : "Refresh status"}
              </button>
            </div>
          </section>

          <p className={styles.boundary}>
            Recovery changes application or database copies only. It does not
            accept project proposals, create review decisions, or authorize a
            semantic transition.
          </p>
        </>
      ) : null}
      </main>
      <ConfirmationDialog
        open={restoreConfirmationOpen}
        title={`Restore ${selectedBackup?.label ?? "the selected backup"}?`}
        description="Augnes will protect the current state before replacing the database. Continuing explicitly authorizes this restore action."
        confirmLabel="Authorize restore"
        tone="danger"
        busy={busyAction === "restore_backup"}
        onCancel={() => setRestoreConfirmationOpen(false)}
        onConfirm={confirmRestoreBackup}
      >
        {selectedBackup ? <dl><div><dt>Verified backup</dt><dd>{selectedBackup.label}</dd></div><div><dt>Created</dt><dd>{formatTimestamp(selectedBackup.created_at)}</dd></div><div><dt>Protection</dt><dd>Current state protected before replacement</dd></div></dl> : null}
      </ConfirmationDialog>
    </ProductShell>
  );
}

function sortBackups(backups: RecoveryStatus["backups"]): RecoveryStatus["backups"] {
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
