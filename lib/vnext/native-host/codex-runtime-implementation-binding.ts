import type { CodexQualifiedRuntimeSelectionV01 } from "@/lib/vnext/native-host/codex-qualified-runtime-registry";

export const CODEX_APP_SERVER_IMPLEMENTED_COMPATIBILITY_PROFILE_ID_V01 =
  "codex_app_server_augnes_operator.v0.1" as const;
export const CODEX_APP_SERVER_IMPLEMENTED_COMPATIBILITY_PROFILE_FINGERPRINT_V01 =
  "sha256:a4cfb0e38fd6a2af0d29a467c2c5db2579cdc784e93a820f3482fa2c8a1d663a" as const;

export function codexRuntimeSelectionHasImplementedCompatibilityV01(
  selection: CodexQualifiedRuntimeSelectionV01,
): boolean {
  return (
    selection.compatibility_profile.profile_id ===
      CODEX_APP_SERVER_IMPLEMENTED_COMPATIBILITY_PROFILE_ID_V01 &&
    selection.compatibility_profile.fingerprint ===
      CODEX_APP_SERVER_IMPLEMENTED_COMPATIBILITY_PROFILE_FINGERPRINT_V01 &&
    selection.artifact.compatibility_profile_id ===
      selection.compatibility_profile.profile_id &&
    selection.artifact.compatibility_profile_fingerprint ===
      selection.compatibility_profile.fingerprint
  );
}
