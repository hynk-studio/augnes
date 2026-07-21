import { randomUUID } from "node:crypto";
import {
  chmodSync,
  closeSync,
  existsSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeSync,
} from "node:fs";
import path from "node:path";

export const CONTINUITY_OPERATION_CONTRACT =
  "augnes.continuity-operations.v1";
export const CONTINUITY_OPERATION_SCHEMA_VERSION = 1;
export const CONTINUITY_OPERATION_FILE =
  "augnes-continuity-operations.json";

const MAX_STATUS_BYTES = 64 * 1024;
const WRITE_BASENAME = /^augnes-continuity-operations\.json\.write-\d+-[0-9a-f-]{36}$/iu;

/** @param {{databasePath: string}} [options] @returns {any} */
export function readContinuityOperationalStatus({ databasePath } = {}) {
  const statusPath = statusPathForDatabase(databasePath);
  if (!existsSync(statusPath)) return emptyStatus();
  try {
    const stat = lstatSync(statusPath);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > MAX_STATUS_BYTES) {
      throw new Error("continuity_status_invalid");
    }
    return normalizeStatus(JSON.parse(readFileSync(statusPath, "utf8")));
  } catch {
    return {
      ...emptyStatus(),
      status_available: false,
      public_reason_code: "continuity_status_unavailable",
    };
  }
}

/** @param {{databasePath: string, event: any}} [options] @returns {any} */
export function recordPortableOperationResult({ databasePath, event } = {}) {
  const normalized = normalizePortabilityEvent(event);
  return writeStatus(databasePath, (current) => ({
    ...current,
    updated_at: normalized.observed_at,
    portability: normalized,
  }));
}

/** @param {{databasePath: string, result: any}} [options] @returns {any} */
export function recordRunReconciliationResult({ databasePath, result } = {}) {
  const normalized = normalizeReconciliationResult(result);
  return writeStatus(databasePath, (current) => ({
    ...current,
    updated_at: normalized.observed_at,
    reconciliation: normalized,
  }));
}

/**
 * @param {{recoveryStatus: any, continuityStatus: any, generatedAt?: string}} [options]
 * @returns {any}
 */
export function buildRedactedSupportReport({
  recoveryStatus,
  continuityStatus,
  generatedAt = new Date().toISOString(),
} = {}) {
  if (!validTimestamp(generatedAt)) throw new Error("support_report_timestamp_invalid");
  const continuity = normalizeStatus(continuityStatus ?? emptyStatus());
  const recovery = normalizeRecoveryPublicStatus(recoveryStatus);
  return {
    contract: "augnes.redacted-support-report.v1",
    schema_version: 1,
    generated_at: generatedAt,
    redacted: true,
    read_only: true,
    authoritative: false,
    application: recovery.application,
    database: recovery.database,
    runtime: recovery.runtime,
    recovery: recovery.recovery,
    portability: continuity.portability,
    run_reconciliation: continuity.reconciliation,
    exclusions: [
      "database_contents",
      "prompts_transcripts_and_hidden_reasoning",
      "provider_payloads",
      "credentials_tokens_and_secrets",
      "private_unrelated_paths",
      "cross_project_record_details",
      "raw_logs_and_terminal_output",
    ],
    actions_created: {
      recovery: false,
      semantic: false,
      host: false,
      external: false,
    },
  };
}

function writeStatus(databasePath, update) {
  const statusPath = statusPathForDatabase(databasePath);
  const directory = path.dirname(statusPath);
  ensureRestrictedDirectory(directory);
  const current = readContinuityOperationalStatus({ databasePath });
  const next = normalizeStatus(update({
    ...emptyStatus(),
    ...(current.status_available === false ? {} : current),
  }));
  const bytes = Buffer.from(`${JSON.stringify(next)}\n`, "utf8");
  if (bytes.byteLength > MAX_STATUS_BYTES) throw new Error("continuity_status_too_large");
  const temporary = path.join(
    directory,
    `${CONTINUITY_OPERATION_FILE}.write-${process.pid}-${randomUUID()}`,
  );
  if (!WRITE_BASENAME.test(path.basename(temporary))) {
    throw new Error("continuity_status_write_invalid");
  }
  let descriptor = null;
  try {
    descriptor = openSync(temporary, "wx", 0o600);
    writeSync(descriptor, bytes);
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = null;
    chmodSync(temporary, 0o600);
    renameSync(temporary, statusPath);
    chmodSync(statusPath, 0o600);
    return next;
  } catch (error) {
    if (descriptor !== null) {
      try { closeSync(descriptor); } catch { /* bounded cleanup */ }
    }
    try { unlinkSync(temporary); } catch { /* bounded cleanup */ }
    throw error;
  }
}

function emptyStatus() {
  return {
    contract: CONTINUITY_OPERATION_CONTRACT,
    schema_version: CONTINUITY_OPERATION_SCHEMA_VERSION,
    status_available: true,
    public_reason_code: "continuity_status_available",
    updated_at: null,
    portability: null,
    reconciliation: null,
  };
}

function normalizeStatus(value) {
  exactKeys(value, [
    "contract",
    "schema_version",
    "status_available",
    "public_reason_code",
    "updated_at",
    "portability",
    "reconciliation",
  ]);
  if (
    value.contract !== CONTINUITY_OPERATION_CONTRACT ||
    value.schema_version !== CONTINUITY_OPERATION_SCHEMA_VERSION ||
    typeof value.status_available !== "boolean" ||
    !validCode(value.public_reason_code) ||
    (value.updated_at !== null && !validTimestamp(value.updated_at))
  ) {
    throw new Error("continuity_status_invalid");
  }
  return {
    contract: CONTINUITY_OPERATION_CONTRACT,
    schema_version: CONTINUITY_OPERATION_SCHEMA_VERSION,
    status_available: value.status_available,
    public_reason_code: value.public_reason_code,
    updated_at: value.updated_at,
    portability:
      value.portability === null
        ? null
        : normalizePortabilityEvent(value.portability),
    reconciliation:
      value.reconciliation === null
        ? null
        : normalizeReconciliationResult(value.reconciliation),
  };
}

function normalizePortabilityEvent(value) {
  exactKeys(value, [
    "contract",
    "observed_at",
    "operation",
    "outcome",
    "reason_code",
    "record_count",
    "personal_perspective_included",
    "reader_verification",
    "data_preserved",
    "next_safe_action",
  ]);
  if (
    value.contract !== "augnes.portable-operation-result.v1" ||
    !validTimestamp(value.observed_at) ||
    !["preview", "export", "import"].includes(value.operation) ||
    !["available", "completed", "exact_replay", "refused"].includes(value.outcome) ||
    !validCode(value.reason_code) ||
    !Number.isSafeInteger(value.record_count) ||
    value.record_count < 0 ||
    value.record_count > 4_096 ||
    typeof value.personal_perspective_included !== "boolean" ||
    !["not_applicable", "verified", "refused"].includes(value.reader_verification) ||
    typeof value.data_preserved !== "boolean" ||
    !validCode(value.next_safe_action)
  ) {
    throw new Error("continuity_portability_invalid");
  }
  return { ...value };
}

function normalizeReconciliationResult(value) {
  exactKeys(value, [
    "contract",
    "schema_version",
    "observed_at",
    "outcome",
    "total_runs_available",
    "total_runs_considered",
    "counts",
    "exact_replays_reused",
    "conflicts_refused",
    "waiting_for_approval_count",
    "orphaned_review_needed_count",
    "unsupported_host_coverage_count",
    "no_retry_count",
    "reconciliation_events_created",
    "reason_codes",
    "next_safe_action",
    "automatic_retry_started",
    "semantic_authority_created",
    "external_action_created",
  ]);
  exactKeys(value.counts, [
    "queued",
    "starting",
    "running",
    "waiting_for_approval",
    "cancelling",
    "completed",
    "failed",
    "timed_out",
    "cancelled",
    "orphaned_or_indeterminate",
  ]);
  const numeric = [
    value.total_runs_available,
    value.total_runs_considered,
    value.exact_replays_reused,
    value.conflicts_refused,
    value.waiting_for_approval_count,
    value.orphaned_review_needed_count,
    value.unsupported_host_coverage_count,
    value.no_retry_count,
    value.reconciliation_events_created,
    ...Object.values(value.counts),
  ];
  if (
    value.contract !== "augnes.run-reconciliation-result.v1" ||
    value.schema_version !== 1 ||
    !validTimestamp(value.observed_at) ||
    !["reconciled", "review_needed", "conflict_refused"].includes(value.outcome) ||
    numeric.some((item) => !Number.isSafeInteger(item) || item < 0 || item > 100_000) ||
    !Array.isArray(value.reason_codes) ||
    value.reason_codes.length > 16 ||
    value.reason_codes.some((item) => !validCode(item)) ||
    !validCode(value.next_safe_action) ||
    value.automatic_retry_started !== false ||
    value.semantic_authority_created !== false ||
    value.external_action_created !== false
  ) {
    throw new Error("continuity_reconciliation_invalid");
  }
  return {
    ...value,
    counts: { ...value.counts },
    reason_codes: [...new Set(value.reason_codes)].sort(),
  };
}

function normalizeRecoveryPublicStatus(value) {
  if (!value || typeof value !== "object") throw new Error("support_report_recovery_invalid");
  const application = value.application ?? {};
  const database = value.database ?? {};
  return {
    application: {
      version: publicString(application.version),
      build_identity: publicString(application.build_identity),
      compatibility: publicString(application.compatibility),
      package_contract: publicNullableString(application.package_contract),
      package_contract_version: Number.isSafeInteger(application.package_contract_version)
        ? application.package_contract_version
        : null,
    },
    database: {
      state: publicString(database.state),
      schema_contract: publicNullableString(database.schema_contract),
      schema_classification: publicString(database.schema_classification),
      migration_state: publicString(database.migration_state),
    },
    runtime: {
      runtime_contract: publicNullableString(value.runtime?.runtime_contract ?? null),
      bridge_health: publicNullableString(value.runtime?.bridge_health ?? null),
      capability_availability: publicNullableString(
        value.runtime?.capability_availability ?? null,
      ),
    },
    recovery: value.latest_operation === null || value.latest_operation === undefined
      ? null
      : {
          outcome: publicString(value.latest_operation.outcome),
          reason_code: publicString(value.latest_operation.reason_code),
          data_preserved: value.latest_operation.data_preserved === true,
          backup_verified: value.latest_operation.backup_verified === true,
          safety_backup_created: value.latest_operation.safety_backup_created === true,
          next_action: publicString(value.latest_operation.next_action),
        },
  };
}

function statusPathForDatabase(databasePath) {
  if (typeof databasePath !== "string" || !path.isAbsolute(databasePath)) {
    throw new Error("continuity_database_path_invalid");
  }
  return path.join(path.dirname(databasePath), CONTINUITY_OPERATION_FILE);
}

function ensureRestrictedDirectory(directory) {
  const existed = existsSync(directory);
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const stat = lstatSync(directory);
  if (!stat.isDirectory() || stat.isSymbolicLink()) {
    throw new Error("continuity_directory_invalid");
  }
  if (!existed) chmodSync(directory, 0o700);
}

function exactKeys(value, keys) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("continuity_status_invalid");
  }
  if (JSON.stringify(Object.keys(value).sort()) !== JSON.stringify([...keys].sort())) {
    throw new Error("continuity_status_invalid");
  }
}

function validCode(value) {
  return typeof value === "string" && /^[a-z][a-z0-9_]{0,127}$/u.test(value);
}

function validTimestamp(value) {
  return typeof value === "string" && value.length <= 64 &&
    Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
}

function publicString(value) {
  if (typeof value !== "string" || value.length < 1 || value.length > 256) {
    throw new Error("support_report_public_value_invalid");
  }
  return value;
}

function publicNullableString(value) {
  return value === null || value === undefined ? null : publicString(value);
}
