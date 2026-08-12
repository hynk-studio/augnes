import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import {
  REPOSITORY_EXECUTION_ENVELOPE_VERSION_V01,
  type RepositoryExecutionEnvelopeV01,
} from "@/types/vnext/repository-managed-delegation";

const MAX_CHANGED_FILES = 128;
const MAX_ARTIFACTS = 128;
const MAX_COMMANDS = 128;
const MAX_CHECKS = 128;

export interface RepositoryExecutionEnvelopeCapabilityV01 {
  adapter_version: string;
  capability_version: string;
  provider_egress: "forbidden" | "native_host_managed";
  timeout_ms: number;
  stop_settle_timeout_ms: number;
}

/**
 * The single canonical materialization owner for the durable managed-run
 * envelope fingerprint. Resume uses the same owner to recover and verify the
 * platform bound into a historical run without adding a second platform field.
 */
export function buildRepositoryExecutionEnvelopeV01(
  platform: RepositoryExecutionEnvelopeV01["platform"],
  capability: RepositoryExecutionEnvelopeCapabilityV01,
  protectedUntrackedPathsFingerprint: string,
): RepositoryExecutionEnvelopeV01 {
  const material = {
    envelope_version: REPOSITORY_EXECUTION_ENVELOPE_VERSION_V01,
    platform,
    run_mode: "repository_attachment" as const,
    filesystem_scope: "exact_repository_root" as const,
    network_scope: "provider_egress_only" as const,
    provider_egress: capability.provider_egress,
    timeout_ms: capability.timeout_ms,
    stop_settle_timeout_ms: capability.stop_settle_timeout_ms,
    budgets: {
      max_changed_files: MAX_CHANGED_FILES,
      max_artifacts: MAX_ARTIFACTS,
      max_commands: MAX_COMMANDS,
      max_checks: MAX_CHECKS,
      max_correction_attempts: 1 as const,
    },
    allowed_operation_categories: [
      "repository_file_read",
      "repository_file_change_inside_exact_root",
      "bounded_local_repository_command",
      "test_typecheck_lint_format_build",
      "local_git_inspection_branch_and_commit",
      "bounded_correction_attempt",
    ],
    forbidden_operation_categories: [
      "filesystem_outside_exact_repository_root",
      "arbitrary_project_command_network_access",
      "dependency_download_or_installation",
      "git_push_or_remote_branch_creation",
      "github_api_pull_request_merge_or_settings",
      "release_deployment_publication_or_external_posting",
      "ambient_browser_companion_provider_database_runtime_or_os_credential_access",
      "outside_root_secret_material_access",
      "destructive_preexisting_untracked_data_mutation",
      "semantic_approval_decision_transition_or_work_closure",
      "another_attachment_run_project_or_automation_cycle",
    ],
    protected_untracked_paths_fingerprint: protectedUntrackedPathsFingerprint,
    adapter_version: capability.adapter_version,
    capability_version: capability.capability_version,
  };
  return {
    ...material,
    envelope_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(material),
    ),
  };
}
