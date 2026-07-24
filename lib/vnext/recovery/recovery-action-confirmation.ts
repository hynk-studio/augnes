import type {
  RecoveryActionConfirmationStateV01,
  RecoveryActionControlViewV01,
  RecoverySafetyViewV01,
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
    outcome === "backup_created"
  );
}

export function buildRecoveryActionControlViewV01(input: {
  view: RecoverySafetyViewV01;
  confirmation_state: RecoveryActionConfirmationStateV01;
}): RecoveryActionControlViewV01 {
  if (input.confirmation_state === "confirmed") {
    return {
      confirmation_state: "confirmed",
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
