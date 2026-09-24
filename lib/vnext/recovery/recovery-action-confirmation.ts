import type {
  RecoveryActionConfirmationStateV01,
  RecoveryActionControlViewV01,
  RecoverySafetyViewV01,
  RecoveryStatusV01,
} from "@/types/vnext/recovery-safety";

const REFRESH_STATUS_ACTION = {
  kind: "check_again",
  label: "Refresh status",
  mutates: false,
} as const;

export const RECOVERY_REFRESH_REQUIRED_NOTICE_V01 =
  "Augnes could not yet confirm the current recovery state. Refresh status before choosing another recovery action.";

export function recoveryActionOutcomeRequiresRefreshV01(
  outcome: string,
): boolean {
  return (
    outcome === "status_unknown" ||
    outcome === "restore_scheduled" ||
    outcome === "retry_scheduled" ||
    outcome === "operation_recorded"
  );
}

export function buildRecoveryActionControlViewV01(input: {
  view: RecoverySafetyViewV01;
  confirmation_state: RecoveryActionConfirmationStateV01;
}): RecoveryActionControlViewV01 {
  if (input.confirmation_state !== "refresh_required") {
    return {
      confirmation_state: input.confirmation_state,
      consequential_mutations_locked: false,
      primary_action: input.view.primary_action,
      secondary_actions: input.view.secondary_actions,
    };
  }
  return {
    confirmation_state: "refresh_required",
    consequential_mutations_locked: true,
    primary_action: REFRESH_STATUS_ACTION,
    secondary_actions: input.view.secondary_actions.filter(
      (action) => action.kind !== "check_again",
    ),
  };
}

// A successful HTTP read, historical backup_verified flag, or accepted operation
// never establishes a checkpoint. This is the outcome of one exact operation.
export function recoveryHasExactValidationV02(status: RecoveryStatusV01): boolean {
  const result = status.operation?.result;
  return status.operation?.state === "completed" && result !== null && result !== undefined &&
    status.backup_inventory_state === "metadata_only" && status.backups.some(backup =>
      backup.backup_id === result.backup_id && backup.backup_identity === result.backup_identity && backup.target_binding === result.target_binding);
}

export function recoveryConfirmationStateV02(status: RecoveryStatusV01): RecoveryActionConfirmationStateV01 {
  if (recoveryHasExactValidationV02(status)) return "confirmed";
  if (status.operation && ["accepted", "running", "unknown", "interrupted"].includes(status.operation.state)) return "refresh_required";
  return "unverified";
}
