import {
  RECOVERY_SAFETY_VIEW_VERSION_V01,
  type RecoverySafetyActionV01,
  type RecoverySafetyViewV01,
  type RecoveryStatusV01,
} from "@/types/vnext/recovery-safety";

export const RECOVERY_RESTORE_RECOMMENDATION_CODES_V01 = [
  "restore_latest_verified_backup",
  "restore_a_verified_recovery_backup",
] as const;

export const RECOVERY_RETRY_RECOMMENDATION_CODES_V01 = [
  "retry_update",
  "retry_packaged_restart",
] as const;

const RESTORE_RECOMMENDATIONS = new Set<string>(
  RECOVERY_RESTORE_RECOMMENDATION_CODES_V01,
);
const RETRY_RECOMMENDATIONS = new Set<string>(
  RECOVERY_RETRY_RECOMMENDATION_CODES_V01,
);

const ACTIONS = {
  check_again: {
    kind: "check_again",
    label: "Check again",
    mutates: false,
  },
  create_backup: {
    kind: "create_backup",
    label: "Create backup",
    mutates: true,
  },
  retry_update: {
    kind: "retry_update",
    label: "Retry update",
    mutates: true,
  },
  restore_backup: {
    kind: "restore_backup",
    label: "Restore selected verified backup",
    mutates: true,
  },
  none: {
    kind: "none",
    label: "Review available recovery actions",
    mutates: false,
  },
} as const satisfies Record<string, RecoverySafetyActionV01>;

export function buildRecoverySafetyViewV01(input: {
  status: RecoveryStatusV01;
  selected_backup_id: string | null;
}): RecoverySafetyViewV01 {
  const { status } = input;
  const verified = status.backups.filter((backup) => backup.verified);
  const selectedVerified = input.selected_backup_id !== null &&
    verified.some((backup) => backup.backup_id === input.selected_backup_id);
  const recommendation = status.latest_operation?.next_action ?? null;
  const primary = selectPrimaryActionV01({
    status,
    recommendation,
    selected_verified: selectedVerified,
  });
  const secondary = availableActionsV01(status)
    .filter((action) => action.kind !== primary.kind);
  const safetyState =
    status.database.schema_classification === "unavailable"
      ? "unavailable"
      : status.database.schema_classification === "old" ||
          status.database.schema_classification === "incompatible"
        ? "incompatible"
        : status.recovery_mode
          ? "attention"
          : "ready";

  return {
    view_version: RECOVERY_SAFETY_VIEW_VERSION_V01,
    mode: status.recovery_mode ? "recovery" : "normal",
    safety_state: safetyState,
    heading: status.recovery_mode ? "Recovery mode" : "Backups and recovery",
    situation: status.recovery_mode
      ? "Augnes needs your attention before normal project work can continue."
      : safetyState === "ready"
        ? "Protect local project data with verified recovery points."
        : safetyState === "unavailable"
          ? "The current database safety state could not be confirmed."
          : "Review database compatibility before choosing a recovery action.",
    safety_status_label: safetyLabelV01(safetyState),
    latest_operation_summary: status.latest_operation === null
      ? null
      : operationSummaryV01(status.latest_operation),
    primary_action: primary,
    secondary_actions: secondary,
    backup_summary: {
      inventory_state: status.backup_inventory_state,
      verified_count: verified.length,
      selected_verified: selectedVerified,
      truncated: status.backup_inventory_truncated,
      legacy_unavailable_count: status.legacy_backup_unavailable_count,
      notice: backupNoticeV01(status, verified.length),
    },
    diagnostics_available: true,
    authority: noAuthorityV01(),
  };
}

export function buildUnavailableRecoverySafetyViewV01(): RecoverySafetyViewV01 {
  return {
    view_version: RECOVERY_SAFETY_VIEW_VERSION_V01,
    mode: "unknown",
    safety_state: "unavailable",
    heading: "Local data safety",
    situation:
      "Recovery status could not be read. No data change or automatic retry was attempted.",
    safety_status_label: "Current safety state unavailable",
    latest_operation_summary: null,
    primary_action: ACTIONS.check_again,
    secondary_actions: [],
    backup_summary: {
      inventory_state: "unknown",
      verified_count: 0,
      selected_verified: false,
      truncated: false,
      legacy_unavailable_count: 0,
      notice: "Recovery-point availability is unknown.",
    },
    diagnostics_available: false,
    authority: noAuthorityV01(),
  };
}

function selectPrimaryActionV01(input: {
  status: RecoveryStatusV01;
  recommendation: string | null;
  selected_verified: boolean;
}): RecoverySafetyActionV01 {
  const { status, recommendation, selected_verified: selectedVerified } = input;
  if (
    status.recovery_mode &&
    status.database.schema_classification === "current" &&
    recommendation !== null &&
    RESTORE_RECOMMENDATIONS.has(recommendation) &&
    status.actions.restore_backup &&
    status.backup_inventory_state === "available" &&
    selectedVerified
  ) {
    return ACTIONS.restore_backup;
  }
  if (
    status.recovery_mode &&
    status.database.schema_classification === "current" &&
    recommendation !== null &&
    RETRY_RECOMMENDATIONS.has(recommendation) &&
    status.actions.retry_update
  ) {
    return ACTIONS.retry_update;
  }
  if (
    !status.recovery_mode &&
    status.database.schema_classification === "current" &&
    status.actions.create_backup
  ) {
    return ACTIONS.create_backup;
  }
  return ACTIONS.none;
}

function availableActionsV01(
  status: RecoveryStatusV01,
): RecoverySafetyActionV01[] {
  return [
    ...(status.actions.create_backup ? [ACTIONS.create_backup] : []),
    ...(status.actions.retry_update ? [ACTIONS.retry_update] : []),
    ...(status.actions.restore_backup ? [ACTIONS.restore_backup] : []),
    {
      kind: "check_again",
      label: "Refresh status",
      mutates: false,
    } satisfies RecoverySafetyActionV01,
  ];
}

function safetyLabelV01(
  state: RecoverySafetyViewV01["safety_state"],
): string {
  if (state === "ready") return "Local data is ready";
  if (state === "attention") return "Attention is required";
  if (state === "incompatible") return "Compatibility needs review";
  return "Current safety state unavailable";
}

function operationSummaryV01(
  operation: NonNullable<RecoveryStatusV01["latest_operation"]>,
): string {
  if (operation.outcome === "backup_created" || operation.backup_verified) {
    return "The latest recorded operation preserved data with a verified recovery point.";
  }
  if (operation.outcome === "restore_scheduled") {
    return "A restore was accepted and Augnes is waiting to restart.";
  }
  if (operation.outcome === "retry_scheduled") {
    return "An update retry was accepted and Augnes is waiting to restart.";
  }
  if (operation.data_preserved) {
    return "The latest recorded operation preserved the current data.";
  }
  return "The latest operation needs review; data preservation is not confirmed.";
}

function backupNoticeV01(
  status: RecoveryStatusV01,
  verifiedCount: number,
): string | null {
  if (status.backup_inventory_state === "unavailable") {
    return "Recovery points could not be verified. This is not treated as an empty inventory.";
  }
  if (status.backup_inventory_truncated) {
    return "Additional recovery points are available on other pages.";
  }
  if (status.legacy_backup_unavailable_count > 0) {
    return "Older preserved recovery points require a compatible verified Augnes package.";
  }
  if (verifiedCount === 0) {
    return "No verified recovery point is currently available.";
  }
  return null;
}

function noAuthorityV01(): RecoverySafetyViewV01["authority"] {
  return {
    writes_database: false,
    creates_backup: false,
    restores_backup: false,
    retries_update: false,
    selects_backup: false,
    changes_recovery_mode: false,
    changes_project_state: false,
    calls_provider: false,
    calls_github: false,
    performs_external_action: false,
    retries_automatically: false,
  };
}
