import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import path from "node:path";

import {
  CODEX_QUALIFIED_RUNTIME_REGISTRY_FINGERPRINT_V01,
  CODEX_QUALIFIED_RUNTIME_REGISTRY_V01,
  getCodexReviewedRuntimeArtifactV01,
  type CodexQualifiedRuntimeRegistryV01,
  type CodexReviewedRuntimeArtifactV01,
} from "@/lib/vnext/native-host/codex-qualified-runtime-registry";
import {
  CODEX_APP_SERVER_IMPLEMENTED_COMPATIBILITY_PROFILE_FINGERPRINT_V01,
  CODEX_APP_SERVER_IMPLEMENTED_COMPATIBILITY_PROFILE_ID_V01,
} from "@/lib/vnext/native-host/codex-runtime-implementation-binding";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import type {
  NativeHostRequestV01,
  NativeHostResultV01,
} from "@/types/vnext/native-host-adapter";

export const CODEX_0_153_2_ORDINARY_CANARY_ENTRY_ID_V01 =
  "codex-rust-v0.153.2-darwin-arm64" as const;
export const CODEX_0_153_2_ORDINARY_CANARY_CAPABILITY_VERSION_V01 =
  "codex_ordinary_authenticated_candidate_execution.v0.1" as const;
export const CODEX_0_153_2_ORDINARY_CANARY_RECEIPT_VERSION_V01 =
  "codex_ordinary_authenticated_candidate_canary.v0.2" as const;
export const CODEX_0_153_2_ORDINARY_CANARY_INSTRUCTION_V01 =
  "Return exactly AUGNES_CODEX_01532_ORDINARY_CANARY_OK and do not use tools, run commands, read or write files, or add any explanation." as const;
export const CODEX_0_153_2_ORDINARY_CANARY_TOKEN_V01 =
  "AUGNES_CODEX_01532_ORDINARY_CANARY_OK" as const;
export const CODEX_0_153_2_PHASE4A_RECEIPT_FINGERPRINT_V01 =
  "sha256:67115bfdbf13fca5c146fb2fbda063c9a406b683b7f5b17d1f5a903362af0680" as const;
export const CODEX_0_153_2_SOURCE_SCHEMA_REVIEW_FINGERPRINT_V01 =
  "sha256:09edf14c59a5e294254c418966336f77e27e2961caadedcd6096501cc86ccaac" as const;
export const CODEX_0_153_2_PHASE4A_CANDIDATE_REGISTRY_FINGERPRINT_V01 =
  "sha256:29ce95f5825d192034979dd0aee7429b5a564d759d3cd4fd98d14c8418e0428b" as const;

const PHASE4B_BASE_COMMIT_V01 =
  "8eb6b7af220fe8d7e244bb616205c797d7965142" as const;
const MAX_CAPABILITY_LIFETIME_MS_V01 = 15 * 60 * 1_000;
const HASH_PATTERN_V01 = /^sha256:[a-f0-9]{64}$/u;
const GIT_HASH_PATTERN_V01 = /^[a-f0-9]{40}$/u;
const FORBIDDEN_ENVIRONMENT_NAME_V01 =
  /(?:TOKEN|SECRET|PASSWORD|COOKIE|CREDENTIAL|OPENAI_API_KEY|CODEX_ACCESS_TOKEN)/iu;

// Exact rust-v0.153.2 app-server supports --strict-config but does not support
// exec's --ignore-user-config. Non-strict loading preserves the same ordered
// session-flag (-c) layer after ambient user/project layers; the adapter then
// requires config/read to equal this reviewed effective policy before it may
// create a thread or consume the one-turn capability. Any emitted configWarning
// remains fail-closed because it can indicate behavior-bearing fallback.
const AUTHENTICATED_CANARY_CONFIG_OVERRIDE_ARGS_V01 = Object.freeze([
  "-c",
  'forced_login_method="chatgpt"',
  "-c",
  'model_provider="openai"',
  "-c",
  "model_providers={}",
  "-c",
  'web_search="disabled"',
  "-c",
  "mcp_servers={}",
  "-c",
  "plugins={}",
  "-c",
  "skills={}",
  "-c",
  "apps={}",
  "-c",
  "notify=[]",
  "-c",
  "features.auth_elicitation=false",
  "-c",
  "features.use_agent_identity=false",
  "-c",
  "features.apps=false",
  "-c",
  "features.plugins=false",
  "-c",
  "features.remote_plugin=false",
  "-c",
  "features.network_proxy=false",
  "-c",
  "features.request_permissions_tool=false",
  "-c",
  "features.hooks=false",
  "-c",
  "features.multi_agent=false",
  "-c",
  "features.in_app_browser=false",
  "-c",
  "features.mcp_2026_07_28=false",
  "-c",
  "features.mcp_oauth_refresh_coordination=false",
  "-c",
  "features.memories=false",
  "-c",
  "features.mentions_v2=false",
  "-c",
  "features.browser_use=false",
  "-c",
  "features.browser_use_full_cdp_access=false",
  "-c",
  "features.browser_use_external=false",
  "-c",
  "features.computer_use=false",
  "-c",
  "features.image_generation=false",
  "-c",
  "features.tool_suggest=false",
  "-c",
  "features.recommended_plugins=false",
  "-c",
  "features.web_search_request=false",
  "-c",
  "features.web_search_cached=false",
  "-c",
  "features.standalone_web_search=false",
  "-c",
  "features.shell_snapshot_v2=false",
  "-c",
  "features.context_management=false",
  "-c",
  "features.remote_control=false",
  "-c",
  "features.background_paginated_rollout_migration=false",
  "-c",
  "orchestrator.skills.enabled=false",
  "-c",
  "orchestrator.mcp.enabled=false",
  "-c",
  "check_for_update_on_startup=false",
  "-c",
  "allow_login_shell=false",
  "-c",
  'shell_environment_policy.inherit="core"',
  "-c",
  "shell_environment_policy.ignore_default_excludes=false",
  "-c",
  "project_doc_max_bytes=0",
  "-c",
  "project_doc_fallback_filenames=[]",
  "-c",
  "features.sleep_tool=false",
  "-c",
  "features.content_item_kinds=false",
  "-c",
  'otel.exporter="none"',
  "-c",
  'otel.trace_exporter="none"',
  "-c",
  'otel.metrics_exporter="none"',
  "-c",
  "analytics.enabled=false",
] as const);

export const CODEX_0_153_2_ORDINARY_CANARY_PROTOCOL_STAGES_V01 = Object.freeze([
  "transport_spawned",
  "initialize_request_sent",
  "initialize_response_received",
  "initialized_notification_sent",
  "account_request_sent",
  "account_response_received",
  "config_request_sent",
  "config_response_received",
  "thread_request_sent",
  "thread_response_received",
  "turn_request_sent",
  "turn_response_received",
  "terminal_observed",
  "settled",
] as const);

export type CodexOrdinaryAuthenticatedCandidateProtocolStageV01 =
  (typeof CODEX_0_153_2_ORDINARY_CANARY_PROTOCOL_STAGES_V01)[number];

export interface CodexOrdinaryAuthenticatedCandidateProtocolProgressV01 {
  stages: readonly CodexOrdinaryAuthenticatedCandidateProtocolStageV01[];
  last_completed_stage: CodexOrdinaryAuthenticatedCandidateProtocolStageV01 | null;
  pending_or_failed_stage: CodexOrdinaryAuthenticatedCandidateProtocolStageV01 | null;
}

export class CodexOrdinaryAuthenticatedCandidateErrorV01 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "CodexOrdinaryAuthenticatedCandidateErrorV01";
  }
}

export interface CodexOrdinaryAuthenticatedCandidateCapabilityV01 {
  readonly capability_version: typeof CODEX_0_153_2_ORDINARY_CANARY_CAPABILITY_VERSION_V01;
  readonly candidate_entry_id: typeof CODEX_0_153_2_ORDINARY_CANARY_ENTRY_ID_V01;
  readonly capability_fingerprint: string;
}

export interface CodexOrdinaryAuthenticatedCandidateSourceV01 {
  base_commit: typeof PHASE4B_BASE_COMMIT_V01;
  head_commit: string;
  head_tree: string;
}

interface CandidateCapabilityPrivateStateV01 {
  command: string;
  prefix_args: readonly string[];
  environment: NodeJS.ProcessEnv;
  execution_root: string;
  private_root: string;
  request_fingerprint: string;
  root_scope_fingerprint: string;
  source: CodexOrdinaryAuthenticatedCandidateSourceV01;
  source_fingerprint: string;
  expected_executable_sha256: string;
  reviewed: CodexReviewedRuntimeArtifactV01;
  expires_at: string;
  consumed: boolean;
  emulated: boolean;
}

export interface CodexOrdinaryAuthenticatedCandidateAdapterBindingV01 {
  command: string;
  prefix_args: readonly string[];
  config_override_args: readonly string[];
  environment: NodeJS.ProcessEnv;
  reviewed: CodexReviewedRuntimeArtifactV01;
  exact_instruction: typeof CODEX_0_153_2_ORDINARY_CANARY_INSTRUCTION_V01;
  expected_token: typeof CODEX_0_153_2_ORDINARY_CANARY_TOKEN_V01;
  capability_fingerprint: string;
  emulated: boolean;
}

const PRIVATE_CANDIDATE_CAPABILITIES_V01 = new WeakMap<
  CodexOrdinaryAuthenticatedCandidateCapabilityV01,
  CandidateCapabilityPrivateStateV01
>();

export function createCodex01532OrdinaryAuthenticatedCandidateCapabilityV01(input: {
  command: string;
  environment: NodeJS.ProcessEnv;
  private_root: string;
  execution_root: string;
  request: NativeHostRequestV01;
  augnes_source: CodexOrdinaryAuthenticatedCandidateSourceV01;
  expires_at: string;
}): CodexOrdinaryAuthenticatedCandidateCapabilityV01 {
  if (
    CODEX_QUALIFIED_RUNTIME_REGISTRY_FINGERPRINT_V01 !==
    CODEX_0_153_2_PHASE4A_CANDIDATE_REGISTRY_FINGERPRINT_V01
  )
    failV01("codex_candidate_registry_fingerprint_mismatch");
  return createCapabilityV01({
    ...input,
    registry: CODEX_QUALIFIED_RUNTIME_REGISTRY_V01,
    emulated: false,
    prefix_args: [],
    expected_executable_sha256:
      "sha256:195ace4100a634a9df39147f493e730e666b5bd87795f3c9f3251d8542400424",
  });
}

/** Test-only constructor. Arbitrary registry, executable, and prefix controls never reach production callers. */
export function createCodex01532OrdinaryAuthenticatedCandidateCapabilityForTestV01(input: {
  command: string;
  prefix_args: readonly string[];
  environment: NodeJS.ProcessEnv;
  private_root: string;
  execution_root: string;
  request: NativeHostRequestV01;
  augnes_source: CodexOrdinaryAuthenticatedCandidateSourceV01;
  expires_at: string;
  registry?: unknown;
  expected_executable_sha256: string;
}): CodexOrdinaryAuthenticatedCandidateCapabilityV01 {
  if (
    process.env.AUGNES_CODEX_ORDINARY_AUTHENTICATED_CANDIDATE_TEST_MODE !== "1"
  )
    failV01("codex_candidate_authenticated_test_override_refused");
  return createCapabilityV01({
    ...input,
    registry:
      (input.registry as CodexQualifiedRuntimeRegistryV01 | undefined) ??
      CODEX_QUALIFIED_RUNTIME_REGISTRY_V01,
    emulated: true,
  });
}

function createCapabilityV01(input: {
  command: string;
  prefix_args: readonly string[];
  environment: NodeJS.ProcessEnv;
  private_root: string;
  execution_root: string;
  request: NativeHostRequestV01;
  augnes_source: CodexOrdinaryAuthenticatedCandidateSourceV01;
  expires_at: string;
  registry: CodexQualifiedRuntimeRegistryV01;
  emulated: boolean;
  expected_executable_sha256: string;
}): CodexOrdinaryAuthenticatedCandidateCapabilityV01 {
  const reviewed = getCodexReviewedRuntimeArtifactV01({
    entry_id: CODEX_0_153_2_ORDINARY_CANARY_ENTRY_ID_V01,
    registry: input.registry,
  });
  assertExactCandidateV01(reviewed);
  assertCandidateRegistryAuthorityV01(input.registry, reviewed);
  assertNonMutatingRequestV01(input.request);
  const privateRoot = exactPrivateDirectoryV01(input.private_root);
  const executionRoot = exactContainedDirectoryV01(
    input.execution_root,
    privateRoot,
    "codex_candidate_execution_root_invalid",
  );
  if (realpathSync(input.request.root_scope.canonical_root) !== executionRoot)
    failV01("codex_candidate_execution_root_mismatch");
  const requestedCommand = path.resolve(input.command);
  const requestedCommandStat = lstatSync(requestedCommand);
  const command = realpathSync(input.command);
  const commandStat = lstatSync(command);
  if (
    requestedCommand !== input.command ||
    requestedCommand !== command ||
    requestedCommandStat.isSymbolicLink() ||
    !commandStat.isFile() ||
    commandStat.isSymbolicLink() ||
    path.resolve(command) !== command ||
    (!input.emulated && !physicallyContainedV01(command, privateRoot)) ||
    (commandStat.mode & 0o111) === 0 ||
    sha256FileV01(command) !== input.expected_executable_sha256
  )
    failV01("codex_candidate_executable_identity_mismatch");
  if (
    !input.emulated &&
    (input.expected_executable_sha256 !==
      reviewed.artifact.native_executable_sha256 ||
      commandStat.size !== 220_551_344 ||
      readCliVersionV01(command, input.environment) !== "0.153.2")
  )
    failV01("codex_candidate_executable_identity_mismatch");
  assertCandidateEnvironmentV01(input.environment, privateRoot, input.emulated);
  if (
    !GIT_HASH_PATTERN_V01.test(input.augnes_source.head_commit) ||
    !GIT_HASH_PATTERN_V01.test(input.augnes_source.head_tree) ||
    input.augnes_source.base_commit !== PHASE4B_BASE_COMMIT_V01
  )
    failV01("codex_candidate_augnes_source_identity_invalid");
  const issuedAt = Date.now();
  const expiresAt = Date.parse(input.expires_at);
  if (
    !Number.isFinite(expiresAt) ||
    expiresAt <= issuedAt ||
    expiresAt - issuedAt > MAX_CAPABILITY_LIFETIME_MS_V01
  )
    failV01("codex_candidate_capability_expiry_invalid");
  if (input.prefix_args.length > 0 && !input.emulated)
    failV01("codex_candidate_arbitrary_prefix_refused");
  const requestFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01(input.request),
  );
  const rootScopeFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01(input.request.root_scope),
  );
  const sourceFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01(input.augnes_source),
  );
  const material = {
    capability_version: CODEX_0_153_2_ORDINARY_CANARY_CAPABILITY_VERSION_V01,
    candidate_entry_id: CODEX_0_153_2_ORDINARY_CANARY_ENTRY_ID_V01,
    candidate_identity_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(reviewed.artifact),
    ),
    registry_fingerprint: CODEX_QUALIFIED_RUNTIME_REGISTRY_FINGERPRINT_V01,
    compatibility_profile_id: reviewed.compatibility_profile.profile_id,
    compatibility_profile_fingerprint:
      reviewed.compatibility_profile.fingerprint,
    source_fingerprint: sourceFingerprint,
    expected_executable_sha256: input.expected_executable_sha256,
    request_id: input.request.request_id,
    run_id: input.request.run_id,
    request_fingerprint: requestFingerprint,
    root_scope_fingerprint: rootScopeFingerprint,
    execution_root_fingerprint: createProtocolSha256V01(executionRoot),
    executable_fingerprint: input.expected_executable_sha256,
    operation_shape: "single_non_mutating_exact_public_token",
    sandbox: "read_only_no_tool_network",
    provider_route: "openai_chatgpt_auth_manager",
    provider_model_bearing_invocation_ceiling: 1,
    no_fallback: true,
    single_use: true,
    expires_at: input.expires_at,
    emulated: input.emulated,
  } as const;
  const handle = Object.freeze({
    capability_version: CODEX_0_153_2_ORDINARY_CANARY_CAPABILITY_VERSION_V01,
    candidate_entry_id: CODEX_0_153_2_ORDINARY_CANARY_ENTRY_ID_V01,
    capability_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(material),
    ),
  });
  PRIVATE_CANDIDATE_CAPABILITIES_V01.set(handle, {
    command,
    prefix_args: Object.freeze([...input.prefix_args]),
    environment: Object.freeze({ ...input.environment }),
    execution_root: executionRoot,
    private_root: privateRoot,
    request_fingerprint: requestFingerprint,
    root_scope_fingerprint: rootScopeFingerprint,
    source: Object.freeze({ ...input.augnes_source }),
    source_fingerprint: sourceFingerprint,
    expected_executable_sha256: input.expected_executable_sha256,
    reviewed,
    expires_at: input.expires_at,
    consumed: false,
    emulated: input.emulated,
  });
  return handle;
}

export function inspectCodex01532OrdinaryAuthenticatedCandidateCapabilityV01(input: {
  capability: CodexOrdinaryAuthenticatedCandidateCapabilityV01;
  request: NativeHostRequestV01;
  now: string;
}): CodexOrdinaryAuthenticatedCandidateAdapterBindingV01 {
  const state = requireCapabilityStateV01(input.capability);
  assertCapabilityRequestAndTimeV01(state, input.request, input.now);
  revalidateCapabilityFilesystemV01(state);
  return Object.freeze({
    command: state.command,
    prefix_args: state.prefix_args,
    config_override_args: AUTHENTICATED_CANARY_CONFIG_OVERRIDE_ARGS_V01,
    environment: state.environment,
    reviewed: state.reviewed,
    exact_instruction: CODEX_0_153_2_ORDINARY_CANARY_INSTRUCTION_V01,
    expected_token: CODEX_0_153_2_ORDINARY_CANARY_TOKEN_V01,
    capability_fingerprint: input.capability.capability_fingerprint,
    emulated: state.emulated,
  });
}

export function consumeCodex01532OrdinaryAuthenticatedCandidateCapabilityV01(input: {
  capability: CodexOrdinaryAuthenticatedCandidateCapabilityV01;
  request: NativeHostRequestV01;
  now: string;
}): void {
  const state = requireCapabilityStateV01(input.capability);
  assertCapabilityRequestAndTimeV01(state, input.request, input.now);
  revalidateCapabilityFilesystemV01(state);
  if (state.consumed) failV01("codex_candidate_capability_already_consumed");
  state.consumed = true;
}

export function assertCodex01532CandidateCapabilitySourceV01(input: {
  capability: CodexOrdinaryAuthenticatedCandidateCapabilityV01;
  augnes_source: CodexOrdinaryAuthenticatedCandidateSourceV01;
}): void {
  const state = requireCapabilityStateV01(input.capability);
  if (
    canonicalizeProtocolValueV01(state.source) !==
    canonicalizeProtocolValueV01(input.augnes_source)
  )
    failV01("codex_candidate_capability_source_mismatch");
}

export function codex01532CandidateCapabilityConsumedV01(
  capability: CodexOrdinaryAuthenticatedCandidateCapabilityV01,
): boolean {
  return requireCapabilityStateV01(capability).consumed;
}

export interface CodexOrdinaryAuthenticatedCandidateCanaryReceiptV01 {
  receipt_version: typeof CODEX_0_153_2_ORDINARY_CANARY_RECEIPT_VERSION_V01;
  observed_at: string;
  augnes_source: CodexOrdinaryAuthenticatedCandidateSourceV01;
  registry_fingerprint: string;
  compatibility_profile: Readonly<{
    profile_id: string;
    fingerprint: string;
    decision: "reuse_confirmed_by_exact_authenticated_candidate_canary";
  }>;
  phase4a_receipt_fingerprint: typeof CODEX_0_153_2_PHASE4A_RECEIPT_FINGERPRINT_V01;
  source_schema_review_fingerprint: typeof CODEX_0_153_2_SOURCE_SCHEMA_REVIEW_FINGERPRINT_V01;
  candidate_identity: Readonly<{
    entry_id: typeof CODEX_0_153_2_ORDINARY_CANARY_ENTRY_ID_V01;
    version: "0.153.2";
    release_tag: "rust-v0.153.2";
    release_id: 382394608;
    source_commit: "657a993cbee87acf52d14b758ce49dbd46d1b8eb";
    asset_id: 543503024;
    archive_sha256: "sha256:91dfc270f0dfbaec16d814f1aa90d4f27e74dc9e3784e64006bef3b79fe9e09c";
    native_sha256: "sha256:195ace4100a634a9df39147f493e730e666b5bd87795f3c9f3251d8542400424";
    platform: "darwin";
    architecture: "arm64";
  }>;
  capability_fingerprint: string;
  request_fingerprint: string;
  root_scope_fingerprint: string;
  sandbox_fingerprint: string;
  user_agent_observation_fingerprint: string | null;
  protocol_progress: CodexOrdinaryAuthenticatedCandidateProtocolProgressV01;
  exercised_methods_semantics: "successful_response_or_observed_notification";
  exercised_methods: readonly string[];
  public_failure_code: string | null;
  expected_public_token: typeof CODEX_0_153_2_ORDINARY_CANARY_TOKEN_V01;
  observed_public_token: typeof CODEX_0_153_2_ORDINARY_CANARY_TOKEN_V01 | null;
  terminal_status: "completed" | null;
  evidence: Readonly<{
    directly_observed: Readonly<{
      ordinary_account_available: boolean;
      turn_start_response_received: boolean;
      successful_terminal_result_observed: boolean;
      protocol_approvals: number;
      protocol_tools: number;
      protocol_commands: number;
      protocol_writes: number;
      protocol_external_effects: number;
      protocol_fallbacks: number;
      protocol_reroutes: number;
      protocol_agent_identity_attempts: number;
    }>;
    contract_bounded: Readonly<{
      authentication_owner: "official_codex_auth_manager";
      augnes_direct_credential_store_accesses: 0;
      provider_model_bearing_turn_capabilities_consumed: 0 | 1;
      provider_model_bearing_invocation_ceiling: 1;
      repository_task_routes_enabled: false;
      non_provider_external_routes_enabled: false;
      global_path_fallback_available: false;
    }>;
    not_observed: Readonly<{
      auth_manager_internal_keychain_access_count: "not_observed";
      os_network_destination_count: "not_observed";
      provider_backend_request_count: "not_observed";
    }>;
  }>;
  protected_configuration_integrity: Readonly<{
    before_fingerprint: string;
    after_fingerprint: string;
    unchanged: boolean;
    credential_material_integrity: "not_observed_auth_manager_owned";
  }>;
  settlement: Readonly<{
    streams_and_owned_processes_settled: boolean;
    disposable_roots_removed: boolean;
  }>;
  capability_consumed: boolean;
  emulated_input: boolean;
  disposition:
    | "ORDINARY_AUTHENTICATED_CANARY_PASS_CANDIDATE_EVIDENCE"
    | "HOLD_TEST_EMULATED_NOT_EXACT"
    | "HOLD_AUTHENTICATION_UNAVAILABLE"
    | "HOLD_CANARY_CONTRACT_FAILED";
  receipt_fingerprint: string;
}

export function createCodex01532OrdinaryAuthenticatedCanaryReceiptV01(input: {
  capability: CodexOrdinaryAuthenticatedCandidateCapabilityV01;
  augnes_source: CodexOrdinaryAuthenticatedCandidateSourceV01;
  request: NativeHostRequestV01;
  result: NativeHostResultV01 | null;
  failure_code: string | null;
  integrity_before_fingerprint: string;
  integrity_after_fingerprint: string;
  streams_and_owned_processes_settled: boolean;
  disposable_roots_removed: boolean;
  observed_at: string;
}): CodexOrdinaryAuthenticatedCandidateCanaryReceiptV01 {
  assertCodex01532CandidateCapabilitySourceV01({
    capability: input.capability,
    augnes_source: input.augnes_source,
  });
  const state = requireCapabilityStateV01(input.capability);
  const metadata = recordV01(input.result?.adapter_extension?.bounded_metadata);
  const exercisedMethods = Array.isArray(metadata?.candidate_exercised_methods)
    ? metadata.candidate_exercised_methods.filter(
        (value): value is string => typeof value === "string",
      )
    : [];
  const progressMetadata = recordV01(metadata?.candidate_protocol_progress);
  const progressStages = Array.isArray(progressMetadata?.stages)
    ? progressMetadata.stages.filter(
        (value): value is CodexOrdinaryAuthenticatedCandidateProtocolStageV01 =>
          typeof value === "string" &&
          CODEX_0_153_2_ORDINARY_CANARY_PROTOCOL_STAGES_V01.includes(
            value as CodexOrdinaryAuthenticatedCandidateProtocolStageV01,
          ),
      )
    : [];
  if (
    input.streams_and_owned_processes_settled &&
    !progressStages.includes("settled")
  )
    progressStages.push("settled");
  const protocolProgress: CodexOrdinaryAuthenticatedCandidateProtocolProgressV01 =
    {
      stages: progressStages,
      last_completed_stage: input.streams_and_owned_processes_settled
        ? "settled"
        : candidateProtocolStageV01(progressMetadata?.last_completed_stage),
      pending_or_failed_stage:
        input.failure_code !== null || input.result?.outcome !== "completed"
          ? candidateProtocolStageV01(progressMetadata?.pending_or_failed_stage)
          : null,
    };
  const expectedMethods = [
    "initialize",
    "account/read",
    "config/read",
    "thread/start",
    "turn/start",
    "turn/completed",
  ];
  const observedToken =
    input.result?.summary === CODEX_0_153_2_ORDINARY_CANARY_TOKEN_V01
      ? CODEX_0_153_2_ORDINARY_CANARY_TOKEN_V01
      : null;
  const publicFailureCode =
    input.failure_code ?? input.result?.public_stop_reason ?? null;
  const directlyObserved = {
    ordinary_account_available:
      metadata?.candidate_ordinary_account_available === true,
    turn_start_response_received: progressStages.includes(
      "turn_response_received",
    ),
    successful_terminal_result_observed:
      input.result?.outcome === "completed" &&
      observedToken !== null &&
      metadata?.candidate_terminal_status === "completed" &&
      progressStages.includes("terminal_observed"),
    protocol_approvals: safeCountV01(metadata?.candidate_approval_requests),
    protocol_tools: safeCountV01(metadata?.candidate_tool_items),
    protocol_commands: safeCountV01(metadata?.candidate_command_items),
    protocol_writes: safeCountV01(metadata?.candidate_write_items),
    protocol_external_effects: safeCountV01(
      metadata?.candidate_external_effects,
    ),
    protocol_fallbacks: safeCountV01(metadata?.candidate_fallbacks),
    protocol_reroutes: safeCountV01(metadata?.candidate_reroutes),
    protocol_agent_identity_attempts: safeCountV01(
      metadata?.candidate_agent_identity_attempts,
    ),
  };
  const observedCounts = Object.entries(directlyObserved)
    .filter(([, value]) => typeof value === "number")
    .map(([, value]) => value as number);
  const invariantPass =
    publicFailureCode === null &&
    input.result?.outcome === "completed" &&
    observedToken !== null &&
    metadata?.candidate_terminal_status === "completed" &&
    metadata?.candidate_exercised_methods_semantics ===
      "successful_response_or_observed_notification" &&
    metadata?.candidate_user_agent_observation_fingerprint !== null &&
    HASH_PATTERN_V01.test(
      String(metadata?.candidate_user_agent_observation_fingerprint ?? ""),
    ) &&
    methodsContainOrderedSubsequenceV01(exercisedMethods, expectedMethods) &&
    exercisedMethods.length <= 64 &&
    exercisedMethods.every(
      (method) =>
        method.length > 0 &&
        method.length <= 160 &&
        /^[A-Za-z0-9._/-]+$/u.test(method),
    ) &&
    candidatePassProgressValidV01(protocolProgress) &&
    directlyObserved.ordinary_account_available &&
    directlyObserved.turn_start_response_received &&
    directlyObserved.successful_terminal_result_observed &&
    observedCounts.every((value) => value === 0) &&
    state.consumed &&
    input.integrity_before_fingerprint === input.integrity_after_fingerprint &&
    HASH_PATTERN_V01.test(input.integrity_before_fingerprint) &&
    input.streams_and_owned_processes_settled &&
    input.disposable_roots_removed;
  const disposition: CodexOrdinaryAuthenticatedCandidateCanaryReceiptV01["disposition"] =
    !invariantPass
      ? !state.consumed &&
        (publicFailureCode === "codex_not_authenticated" ||
          input.result?.public_stop_reason === "codex_not_authenticated")
        ? "HOLD_AUTHENTICATION_UNAVAILABLE"
        : "HOLD_CANARY_CONTRACT_FAILED"
      : state.emulated
        ? "HOLD_TEST_EMULATED_NOT_EXACT"
        : "ORDINARY_AUTHENTICATED_CANARY_PASS_CANDIDATE_EVIDENCE";
  const material = {
    receipt_version: CODEX_0_153_2_ORDINARY_CANARY_RECEIPT_VERSION_V01,
    observed_at: input.observed_at,
    augnes_source: Object.freeze({ ...input.augnes_source }),
    registry_fingerprint:
      CODEX_0_153_2_PHASE4A_CANDIDATE_REGISTRY_FINGERPRINT_V01,
    compatibility_profile: {
      profile_id: state.reviewed.compatibility_profile.profile_id,
      fingerprint: state.reviewed.compatibility_profile.fingerprint,
      decision:
        "reuse_confirmed_by_exact_authenticated_candidate_canary" as const,
    },
    phase4a_receipt_fingerprint: CODEX_0_153_2_PHASE4A_RECEIPT_FINGERPRINT_V01,
    source_schema_review_fingerprint:
      CODEX_0_153_2_SOURCE_SCHEMA_REVIEW_FINGERPRINT_V01,
    candidate_identity: {
      entry_id: CODEX_0_153_2_ORDINARY_CANARY_ENTRY_ID_V01,
      version: "0.153.2" as const,
      release_tag: "rust-v0.153.2" as const,
      release_id: 382394608 as const,
      source_commit: "657a993cbee87acf52d14b758ce49dbd46d1b8eb" as const,
      asset_id: 543503024 as const,
      archive_sha256:
        "sha256:91dfc270f0dfbaec16d814f1aa90d4f27e74dc9e3784e64006bef3b79fe9e09c" as const,
      native_sha256:
        "sha256:195ace4100a634a9df39147f493e730e666b5bd87795f3c9f3251d8542400424" as const,
      platform: "darwin" as const,
      architecture: "arm64" as const,
    },
    capability_fingerprint: input.capability.capability_fingerprint,
    request_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(input.request),
    ),
    root_scope_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(input.request.root_scope),
    ),
    sandbox_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01({
        thread_sandbox: "read-only",
        turn_sandbox_policy: { type: "readOnly", networkAccess: false },
      }),
    ),
    user_agent_observation_fingerprint:
      typeof metadata?.candidate_user_agent_observation_fingerprint === "string"
        ? metadata.candidate_user_agent_observation_fingerprint
        : null,
    protocol_progress: protocolProgress,
    exercised_methods_semantics:
      "successful_response_or_observed_notification" as const,
    exercised_methods: exercisedMethods,
    public_failure_code: publicFailureCode,
    expected_public_token: CODEX_0_153_2_ORDINARY_CANARY_TOKEN_V01,
    observed_public_token: observedToken,
    terminal_status:
      metadata?.candidate_terminal_status === "completed" ? "completed" : null,
    evidence: {
      directly_observed: directlyObserved,
      contract_bounded: {
        authentication_owner: "official_codex_auth_manager" as const,
        augnes_direct_credential_store_accesses: 0 as const,
        provider_model_bearing_turn_capabilities_consumed: state.consumed
          ? (1 as const)
          : (0 as const),
        provider_model_bearing_invocation_ceiling: 1 as const,
        repository_task_routes_enabled: false as const,
        non_provider_external_routes_enabled: false as const,
        global_path_fallback_available: false as const,
      },
      not_observed: {
        auth_manager_internal_keychain_access_count: "not_observed" as const,
        os_network_destination_count: "not_observed" as const,
        provider_backend_request_count: "not_observed" as const,
      },
    },
    protected_configuration_integrity: {
      before_fingerprint: input.integrity_before_fingerprint,
      after_fingerprint: input.integrity_after_fingerprint,
      unchanged:
        input.integrity_before_fingerprint ===
        input.integrity_after_fingerprint,
      credential_material_integrity: "not_observed_auth_manager_owned" as const,
    },
    settlement: {
      streams_and_owned_processes_settled:
        input.streams_and_owned_processes_settled,
      disposable_roots_removed: input.disposable_roots_removed,
    },
    capability_consumed: state.consumed,
    emulated_input: state.emulated,
    disposition,
  };
  const candidateReceipt = {
    ...material,
    receipt_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(material),
    ),
  };
  return validateCodex01532OrdinaryAuthenticatedCanaryReceiptV01(
    candidateReceipt,
    input.augnes_source,
  );
}

export function validateCodex01532OrdinaryAuthenticatedCanaryReceiptV01(
  input: unknown,
  expectedAugnesSource: CodexOrdinaryAuthenticatedCandidateSourceV01,
): CodexOrdinaryAuthenticatedCandidateCanaryReceiptV01 {
  const receipt = JSON.parse(JSON.stringify(input)) as Record<string, unknown>;
  const expectedKeys = [
    "receipt_version",
    "observed_at",
    "augnes_source",
    "registry_fingerprint",
    "compatibility_profile",
    "phase4a_receipt_fingerprint",
    "source_schema_review_fingerprint",
    "candidate_identity",
    "capability_fingerprint",
    "request_fingerprint",
    "root_scope_fingerprint",
    "sandbox_fingerprint",
    "user_agent_observation_fingerprint",
    "protocol_progress",
    "exercised_methods_semantics",
    "exercised_methods",
    "public_failure_code",
    "expected_public_token",
    "observed_public_token",
    "terminal_status",
    "evidence",
    "protected_configuration_integrity",
    "settlement",
    "capability_consumed",
    "emulated_input",
    "disposition",
    "receipt_fingerprint",
  ].sort();
  if (
    !recordV01(receipt) ||
    canonicalizeProtocolValueV01(Object.keys(receipt).sort()) !==
      canonicalizeProtocolValueV01(expectedKeys) ||
    receipt.receipt_version !==
      CODEX_0_153_2_ORDINARY_CANARY_RECEIPT_VERSION_V01 ||
    !HASH_PATTERN_V01.test(String(receipt.receipt_fingerprint ?? "")) ||
    Object.hasOwn(receipt, "qualified_at") ||
    Object.hasOwn(receipt, "production_selection") ||
    receipt.disposition === "QUALIFIED" ||
    receipt.disposition === "QUALIFIED_EXACT"
  )
    failV01("codex_candidate_authenticated_receipt_invalid");
  const { receipt_fingerprint: fingerprint, ...material } = receipt;
  if (
    createProtocolSha256V01(canonicalizeProtocolValueV01(material)) !==
    fingerprint
  )
    failV01("codex_candidate_authenticated_receipt_fingerprint_mismatch");
  const canonical = canonicalizeProtocolValueV01(receipt);
  for (const forbidden of [
    "access_token",
    "refresh_token",
    "auth.json",
    "BEGIN PRIVATE KEY",
    "@example",
    "/Users/",
    "/private/var/",
    "prompt_transcript",
    "provider_payload",
  ])
    if (canonical.includes(forbidden))
      failV01(
        "codex_candidate_authenticated_receipt_private_material_forbidden",
      );
  if (containsPrivateMaterialV01(receipt))
    failV01("codex_candidate_authenticated_receipt_private_material_forbidden");
  const source = recordV01(receipt.augnes_source);
  const candidate = recordV01(receipt.candidate_identity);
  const profile = recordV01(receipt.compatibility_profile);
  const progress = recordV01(receipt.protocol_progress);
  const evidence = recordV01(receipt.evidence);
  const directlyObserved = recordV01(evidence?.directly_observed);
  const contractBounded = recordV01(evidence?.contract_bounded);
  const notObserved = recordV01(evidence?.not_observed);
  const integrity = recordV01(receipt.protected_configuration_integrity);
  const settlement = recordV01(receipt.settlement);
  const counts = directlyObserved
    ? [
        directlyObserved.protocol_approvals,
        directlyObserved.protocol_tools,
        directlyObserved.protocol_commands,
        directlyObserved.protocol_writes,
        directlyObserved.protocol_external_effects,
        directlyObserved.protocol_fallbacks,
        directlyObserved.protocol_reroutes,
        directlyObserved.protocol_agent_identity_attempts,
      ]
    : [];
  if (
    !source ||
    !candidate ||
    !profile ||
    !progress ||
    !evidence ||
    !directlyObserved ||
    !contractBounded ||
    !notObserved ||
    !integrity ||
    !settlement ||
    !recordHasExactKeysV01(source, [
      "base_commit",
      "head_commit",
      "head_tree",
    ]) ||
    !recordHasExactKeysV01(profile, [
      "profile_id",
      "fingerprint",
      "decision",
    ]) ||
    !recordHasExactKeysV01(progress, [
      "stages",
      "last_completed_stage",
      "pending_or_failed_stage",
    ]) ||
    !recordHasExactKeysV01(evidence, [
      "directly_observed",
      "contract_bounded",
      "not_observed",
    ]) ||
    !recordHasExactKeysV01(directlyObserved, [
      "ordinary_account_available",
      "turn_start_response_received",
      "successful_terminal_result_observed",
      "protocol_approvals",
      "protocol_tools",
      "protocol_commands",
      "protocol_writes",
      "protocol_external_effects",
      "protocol_fallbacks",
      "protocol_reroutes",
      "protocol_agent_identity_attempts",
    ]) ||
    !recordHasExactKeysV01(contractBounded, [
      "authentication_owner",
      "augnes_direct_credential_store_accesses",
      "provider_model_bearing_turn_capabilities_consumed",
      "provider_model_bearing_invocation_ceiling",
      "repository_task_routes_enabled",
      "non_provider_external_routes_enabled",
      "global_path_fallback_available",
    ]) ||
    !recordHasExactKeysV01(notObserved, [
      "auth_manager_internal_keychain_access_count",
      "os_network_destination_count",
      "provider_backend_request_count",
    ]) ||
    !recordHasExactKeysV01(integrity, [
      "before_fingerprint",
      "after_fingerprint",
      "unchanged",
      "credential_material_integrity",
    ]) ||
    !recordHasExactKeysV01(settlement, [
      "streams_and_owned_processes_settled",
      "disposable_roots_removed",
    ]) ||
    source.base_commit !== PHASE4B_BASE_COMMIT_V01 ||
    !GIT_HASH_PATTERN_V01.test(String(source.head_commit ?? "")) ||
    !GIT_HASH_PATTERN_V01.test(String(source.head_tree ?? "")) ||
    canonicalizeProtocolValueV01(source) !==
      canonicalizeProtocolValueV01(expectedAugnesSource) ||
    !isExactIsoTimestampV01(receipt.observed_at) ||
    receipt.registry_fingerprint !==
      CODEX_0_153_2_PHASE4A_CANDIDATE_REGISTRY_FINGERPRINT_V01 ||
    profile.profile_id !==
      CODEX_APP_SERVER_IMPLEMENTED_COMPATIBILITY_PROFILE_ID_V01 ||
    profile.fingerprint !==
      CODEX_APP_SERVER_IMPLEMENTED_COMPATIBILITY_PROFILE_FINGERPRINT_V01 ||
    profile.decision !==
      "reuse_confirmed_by_exact_authenticated_candidate_canary" ||
    receipt.phase4a_receipt_fingerprint !==
      CODEX_0_153_2_PHASE4A_RECEIPT_FINGERPRINT_V01 ||
    receipt.source_schema_review_fingerprint !==
      CODEX_0_153_2_SOURCE_SCHEMA_REVIEW_FINGERPRINT_V01 ||
    candidate.entry_id !== CODEX_0_153_2_ORDINARY_CANARY_ENTRY_ID_V01 ||
    candidate.version !== "0.153.2" ||
    candidate.release_tag !== "rust-v0.153.2" ||
    candidate.release_id !== 382394608 ||
    candidate.source_commit !== "657a993cbee87acf52d14b758ce49dbd46d1b8eb" ||
    candidate.asset_id !== 543503024 ||
    candidate.archive_sha256 !==
      "sha256:91dfc270f0dfbaec16d814f1aa90d4f27e74dc9e3784e64006bef3b79fe9e09c" ||
    candidate.native_sha256 !==
      "sha256:195ace4100a634a9df39147f493e730e666b5bd87795f3c9f3251d8542400424" ||
    candidate.platform !== "darwin" ||
    candidate.architecture !== "arm64" ||
    !recordHasExactKeysV01(candidate, [
      "entry_id",
      "version",
      "release_tag",
      "release_id",
      "source_commit",
      "asset_id",
      "archive_sha256",
      "native_sha256",
      "platform",
      "architecture",
    ]) ||
    !HASH_PATTERN_V01.test(String(receipt.capability_fingerprint ?? "")) ||
    !HASH_PATTERN_V01.test(String(receipt.request_fingerprint ?? "")) ||
    !HASH_PATTERN_V01.test(String(receipt.root_scope_fingerprint ?? "")) ||
    !HASH_PATTERN_V01.test(String(receipt.sandbox_fingerprint ?? "")) ||
    !counts.every(
      (value) => Number.isSafeInteger(value) && Number(value) >= 0,
    ) ||
    receipt.exercised_methods_semantics !==
      "successful_response_or_observed_notification" ||
    !Array.isArray(receipt.exercised_methods) ||
    receipt.exercised_methods.length > 64 ||
    receipt.exercised_methods.some(
      (method) =>
        typeof method !== "string" ||
        method.length === 0 ||
        method.length > 160 ||
        !/^[A-Za-z0-9._/-]+$/u.test(method),
    ) ||
    !candidateProgressValidV01(progress) ||
    (receipt.public_failure_code !== null &&
      (typeof receipt.public_failure_code !== "string" ||
        !/^[a-z0-9_.:-]{1,160}$/u.test(receipt.public_failure_code))) ||
    typeof directlyObserved.ordinary_account_available !== "boolean" ||
    typeof directlyObserved.turn_start_response_received !== "boolean" ||
    typeof directlyObserved.successful_terminal_result_observed !== "boolean" ||
    typeof receipt.capability_consumed !== "boolean" ||
    typeof receipt.emulated_input !== "boolean" ||
    contractBounded.provider_model_bearing_turn_capabilities_consumed !==
      (receipt.capability_consumed ? 1 : 0) ||
    contractBounded.authentication_owner !== "official_codex_auth_manager" ||
    contractBounded.augnes_direct_credential_store_accesses !== 0 ||
    ![0, 1].includes(
      Number(contractBounded.provider_model_bearing_turn_capabilities_consumed),
    ) ||
    contractBounded.provider_model_bearing_invocation_ceiling !== 1 ||
    contractBounded.repository_task_routes_enabled !== false ||
    contractBounded.non_provider_external_routes_enabled !== false ||
    contractBounded.global_path_fallback_available !== false ||
    notObserved.auth_manager_internal_keychain_access_count !==
      "not_observed" ||
    notObserved.os_network_destination_count !== "not_observed" ||
    notObserved.provider_backend_request_count !== "not_observed" ||
    typeof integrity.unchanged !== "boolean" ||
    !HASH_PATTERN_V01.test(String(integrity.before_fingerprint ?? "")) ||
    !HASH_PATTERN_V01.test(String(integrity.after_fingerprint ?? "")) ||
    integrity.unchanged !==
      (integrity.before_fingerprint === integrity.after_fingerprint) ||
    integrity.credential_material_integrity !==
      "not_observed_auth_manager_owned" ||
    typeof settlement.streams_and_owned_processes_settled !== "boolean" ||
    typeof settlement.disposable_roots_removed !== "boolean" ||
    ![
      "ORDINARY_AUTHENTICATED_CANARY_PASS_CANDIDATE_EVIDENCE",
      "HOLD_TEST_EMULATED_NOT_EXACT",
      "HOLD_AUTHENTICATION_UNAVAILABLE",
      "HOLD_CANARY_CONTRACT_FAILED",
    ].includes(String(receipt.disposition)) ||
    receipt.expected_public_token !== CODEX_0_153_2_ORDINARY_CANARY_TOKEN_V01 ||
    (receipt.observed_public_token !== null &&
      receipt.observed_public_token !==
        CODEX_0_153_2_ORDINARY_CANARY_TOKEN_V01) ||
    (receipt.terminal_status !== null &&
      receipt.terminal_status !== "completed") ||
    (receipt.user_agent_observation_fingerprint !== null &&
      !HASH_PATTERN_V01.test(
        String(receipt.user_agent_observation_fingerprint),
      ))
  )
    failV01("codex_candidate_authenticated_receipt_semantics_invalid");
  if (
    receipt.disposition ===
      "ORDINARY_AUTHENTICATED_CANARY_PASS_CANDIDATE_EVIDENCE" &&
    (receipt.emulated_input !== false ||
      receipt.capability_consumed !== true ||
      receipt.observed_public_token !==
        CODEX_0_153_2_ORDINARY_CANARY_TOKEN_V01 ||
      receipt.terminal_status !== "completed" ||
      receipt.public_failure_code !== null ||
      directlyObserved.ordinary_account_available !== true ||
      directlyObserved.turn_start_response_received !== true ||
      directlyObserved.successful_terminal_result_observed !== true ||
      counts.some((value) => value !== 0) ||
      contractBounded.provider_model_bearing_turn_capabilities_consumed !== 1 ||
      integrity.unchanged !== true ||
      settlement.streams_and_owned_processes_settled !== true ||
      settlement.disposable_roots_removed !== true ||
      !candidatePassProgressValidV01(receipt.protocol_progress) ||
      !candidatePassMethodsValidV01(receipt.exercised_methods))
  )
    failV01("codex_candidate_authenticated_receipt_pass_invalid");
  return Object.freeze(
    receipt as unknown as CodexOrdinaryAuthenticatedCandidateCanaryReceiptV01,
  );
}

function assertExactCandidateV01(
  reviewed: CodexReviewedRuntimeArtifactV01,
): void {
  const artifact = reviewed.artifact;
  const evidence = artifact.qualification_evidence;
  if (
    artifact.entry_id !== CODEX_0_153_2_ORDINARY_CANARY_ENTRY_ID_V01 ||
    artifact.version !== "0.153.2" ||
    artifact.release_tag !== "rust-v0.153.2" ||
    artifact.tagged_source_commit !==
      "657a993cbee87acf52d14b758ce49dbd46d1b8eb" ||
    artifact.platform !== "darwin" ||
    artifact.architecture !== "arm64" ||
    artifact.upstream_target_triple !== "aarch64-apple-darwin" ||
    artifact.official_release.release_id !== 382394608 ||
    artifact.qualified_provenance_asset.asset_id !== 543503024 ||
    artifact.qualified_provenance_asset.asset_name !==
      "codex-aarch64-apple-darwin.tar.gz" ||
    artifact.qualified_provenance_asset.size_bytes !== 87_314_265 ||
    artifact.qualified_provenance_asset.digest !==
      "sha256:91dfc270f0dfbaec16d814f1aa90d4f27e74dc9e3784e64006bef3b79fe9e09c" ||
    artifact.native_executable_sha256 !==
      "sha256:195ace4100a634a9df39147f493e730e666b5bd87795f3c9f3251d8542400424" ||
    artifact.compatibility_profile_id !==
      CODEX_APP_SERVER_IMPLEMENTED_COMPATIBILITY_PROFILE_ID_V01 ||
    artifact.compatibility_profile_fingerprint !==
      CODEX_APP_SERVER_IMPLEMENTED_COMPATIBILITY_PROFILE_FINGERPRINT_V01 ||
    artifact.admitted_discovery_launch_shapes.length !== 1 ||
    artifact.admitted_discovery_launch_shapes[0]?.shape !== "direct_native" ||
    evidence.kind !== "candidate_source_schema_review_v0_1" ||
    evidence.ordinary_deciding_receipt_fingerprint !== null ||
    evidence.source_schema_review.fingerprint !==
      CODEX_0_153_2_SOURCE_SCHEMA_REVIEW_FINGERPRINT_V01 ||
    reviewed.compatibility_profile.profile_id !==
      CODEX_APP_SERVER_IMPLEMENTED_COMPATIBILITY_PROFILE_ID_V01 ||
    reviewed.compatibility_profile.fingerprint !==
      CODEX_APP_SERVER_IMPLEMENTED_COMPATIBILITY_PROFILE_FINGERPRINT_V01
  )
    failV01("codex_candidate_reviewed_identity_mismatch");
}

function assertCandidateRegistryAuthorityV01(
  registry: CodexQualifiedRuntimeRegistryV01,
  reviewed: CodexReviewedRuntimeArtifactV01,
): void {
  if (
    reviewed.artifact.lanes.ordinary_chatgpt_auth.status !== "candidate" ||
    reviewed.artifact.lanes.ordinary_chatgpt_auth.qualified_at !== null ||
    reviewed.artifact.lanes.strict_agent_identity.status !== "hold" ||
    reviewed.artifact.lanes.strict_agent_identity.qualified_at !== null ||
    registry.production_selection.mode !== "pinned_exact" ||
    registry.production_selection.lane !== "ordinary_chatgpt_auth" ||
    registry.production_selection.entry_id !==
      "codex-rust-v0.152.1-darwin-arm64"
  )
    failV01("codex_candidate_qualification_authority_refused");
}

function assertNonMutatingRequestV01(request: NativeHostRequestV01): void {
  const sandbox = request.policy;
  if (
    request.mode !== "policy_triggered" ||
    request.requested_capability !==
      CODEX_0_153_2_ORDINARY_CANARY_CAPABILITY_VERSION_V01 ||
    request.root_scope.root_kind !== "plain_folder" ||
    request.root_scope.repository_ref !== null ||
    request.root_scope.selected_worktree_ref !== null ||
    request.allowed_operation_categories.some((value) =>
      /(?:write|command|tool|network|approval|repository)/u.test(value),
    ) ||
    !request.forbidden_operation_categories.includes("all_external_effects") ||
    sandbox.network !== "forbidden" ||
    sandbox.model !== "native_host_managed" ||
    sandbox.host_egress !== "bounded_capability_grant" ||
    sandbox.max_changed_files !== 0 ||
    sandbox.max_artifacts !== 0 ||
    sandbox.max_commands !== 0 ||
    request.execution_grant_ref !== null ||
    request.automation_context !== null ||
    request.repository_delegation_context != null ||
    request.repository_resume_context != null
  )
    failV01("codex_candidate_non_mutating_request_required");
}

function assertCandidateEnvironmentV01(
  environment: NodeJS.ProcessEnv,
  privateRoot: string,
  emulated: boolean,
): void {
  const allowed = new Set([
    "NODE_ENV",
    "HOME",
    "CODEX_HOME",
    "CODEX_SQLITE_HOME",
    "TMPDIR",
    "PATH",
    "LANG",
    "LC_ALL",
    "LC_CTYPE",
    "TZ",
    "TERM",
    "NO_COLOR",
    "FAKE_CODEX_SCENARIO",
    "FAKE_CODEX_NETWORK_COUNT_PATH",
  ]);
  const entries = Object.entries(environment).filter(
    ([, value]) => value !== undefined,
  );
  if (
    entries.some(
      ([key]) => !allowed.has(key) || FORBIDDEN_ENVIRONMENT_NAME_V01.test(key),
    ) ||
    environment.NODE_ENV !== (emulated ? "test" : "production") ||
    !environment.HOME ||
    !environment.CODEX_HOME ||
    !environment.CODEX_SQLITE_HOME ||
    !environment.TMPDIR ||
    !environment.PATH ||
    !physicallyContainedV01(realpathSync(environment.HOME), privateRoot) ||
    !physicallyContainedV01(
      realpathSync(environment.CODEX_SQLITE_HOME),
      privateRoot,
    ) ||
    !physicallyContainedV01(realpathSync(environment.TMPDIR), privateRoot) ||
    !physicallyContainedV01(realpathSync(environment.PATH), privateRoot) ||
    (!emulated &&
      physicallyContainedV01(realpathSync(environment.CODEX_HOME), privateRoot))
  )
    failV01("codex_candidate_private_environment_invalid");
}

function requireCapabilityStateV01(
  capability: CodexOrdinaryAuthenticatedCandidateCapabilityV01,
): CandidateCapabilityPrivateStateV01 {
  const state = PRIVATE_CANDIDATE_CAPABILITIES_V01.get(capability);
  if (
    !state ||
    capability.capability_version !==
      CODEX_0_153_2_ORDINARY_CANARY_CAPABILITY_VERSION_V01 ||
    capability.candidate_entry_id !==
      CODEX_0_153_2_ORDINARY_CANARY_ENTRY_ID_V01 ||
    !HASH_PATTERN_V01.test(capability.capability_fingerprint)
  )
    failV01("codex_candidate_capability_unrecognized");
  return state;
}

function assertCapabilityRequestAndTimeV01(
  state: CandidateCapabilityPrivateStateV01,
  request: NativeHostRequestV01,
  now: string,
): void {
  if (
    createProtocolSha256V01(canonicalizeProtocolValueV01(request)) !==
      state.request_fingerprint ||
    createProtocolSha256V01(
      canonicalizeProtocolValueV01(request.root_scope),
    ) !== state.root_scope_fingerprint ||
    realpathSync(request.root_scope.canonical_root) !== state.execution_root ||
    Date.parse(now) >= Date.parse(state.expires_at)
  )
    failV01("codex_candidate_capability_binding_mismatch");
}

function revalidateCapabilityFilesystemV01(
  state: CandidateCapabilityPrivateStateV01,
): void {
  const command = realpathSync(state.command);
  if (
    command !== state.command ||
    realpathSync(state.execution_root) !== state.execution_root ||
    realpathSync(state.private_root) !== state.private_root ||
    (!state.emulated && !physicallyContainedV01(command, state.private_root)) ||
    !physicallyContainedV01(state.execution_root, state.private_root) ||
    sha256FileV01(command) !== state.expected_executable_sha256
  )
    failV01("codex_candidate_capability_identity_changed");
}

function exactPrivateDirectoryV01(value: string): string {
  const resolved = realpathSync(value);
  const stat = lstatSync(resolved);
  if (
    resolved !== path.resolve(value) ||
    !stat.isDirectory() ||
    stat.isSymbolicLink() ||
    (stat.mode & 0o077) !== 0
  )
    failV01("codex_candidate_private_root_invalid");
  return resolved;
}

function exactContainedDirectoryV01(
  value: string,
  root: string,
  code: string,
): string {
  const resolved = realpathSync(value);
  const stat = lstatSync(resolved);
  if (
    resolved !== path.resolve(value) ||
    !stat.isDirectory() ||
    stat.isSymbolicLink() ||
    !physicallyContainedV01(resolved, root)
  )
    failV01(code);
  return resolved;
}

function physicallyContainedV01(value: string, root: string): boolean {
  const relative = path.relative(root, value);
  return (
    relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative))
  );
}

function isExactIsoTimestampV01(value: unknown): value is string {
  return (
    typeof value === "string" &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString() === value
  );
}

function sha256FileV01(value: string): string {
  return `sha256:${createHash("sha256")
    .update(readFileSync(value))
    .digest("hex")}`;
}

function readCliVersionV01(
  command: string,
  environment: NodeJS.ProcessEnv,
): string | null {
  const result = spawnSync(command, ["--version"], {
    cwd: path.dirname(command),
    env: environment,
    encoding: "utf8",
    shell: false,
    timeout: 10_000,
    maxBuffer: 64 * 1024,
  });
  const match = /^codex-cli ([0-9]+\.[0-9]+\.[0-9]+)\s*$/u.exec(result.stdout);
  return result.status === 0 && !result.signal && !result.error
    ? (match?.[1] ?? null)
    : null;
}

function safeCountV01(value: unknown): number {
  return Number.isSafeInteger(value) && Number(value) >= 0 ? Number(value) : 0;
}

function candidateProtocolStageV01(
  value: unknown,
): CodexOrdinaryAuthenticatedCandidateProtocolStageV01 | null {
  return typeof value === "string" &&
    CODEX_0_153_2_ORDINARY_CANARY_PROTOCOL_STAGES_V01.includes(
      value as CodexOrdinaryAuthenticatedCandidateProtocolStageV01,
    )
    ? (value as CodexOrdinaryAuthenticatedCandidateProtocolStageV01)
    : null;
}

function candidateProgressValidV01(value: Record<string, unknown>): boolean {
  if (
    !Array.isArray(value.stages) ||
    value.stages.length >
      CODEX_0_153_2_ORDINARY_CANARY_PROTOCOL_STAGES_V01.length ||
    value.stages.some((stage) => candidateProtocolStageV01(stage) === null) ||
    new Set(value.stages).size !== value.stages.length ||
    candidateProtocolStageV01(value.last_completed_stage) !==
      value.last_completed_stage ||
    (value.pending_or_failed_stage !== null &&
      candidateProtocolStageV01(value.pending_or_failed_stage) !==
        value.pending_or_failed_stage)
  )
    return false;
  const indexes = value.stages.map((stage) =>
    CODEX_0_153_2_ORDINARY_CANARY_PROTOCOL_STAGES_V01.indexOf(
      stage as CodexOrdinaryAuthenticatedCandidateProtocolStageV01,
    ),
  );
  return indexes.every(
    (index, position) => position === 0 || index > indexes[position - 1]!,
  );
}

function candidatePassProgressValidV01(value: unknown): boolean {
  const progress = recordV01(value);
  return (
    progress !== null &&
    candidateProgressValidV01(progress) &&
    canonicalizeProtocolValueV01(progress.stages) ===
      canonicalizeProtocolValueV01(
        CODEX_0_153_2_ORDINARY_CANARY_PROTOCOL_STAGES_V01,
      ) &&
    progress.last_completed_stage === "settled" &&
    progress.pending_or_failed_stage === null
  );
}

function methodsContainOrderedSubsequenceV01(
  observed: readonly string[],
  required: readonly string[],
): boolean {
  let requiredIndex = 0;
  for (const method of observed)
    if (method === required[requiredIndex]) requiredIndex += 1;
  return requiredIndex === required.length;
}

function candidatePassMethodsValidV01(value: unknown): boolean {
  if (!Array.isArray(value) || value.length > 64) return false;
  const methods = value.filter(
    (method): method is string => typeof method === "string",
  );
  if (methods.length !== value.length) return false;
  const profile =
    CODEX_QUALIFIED_RUNTIME_REGISTRY_V01.compatibility_profiles.find(
      ({ profile_id }) =>
        profile_id ===
        CODEX_APP_SERVER_IMPLEMENTED_COMPATIBILITY_PROFILE_ID_V01,
    );
  if (!profile) return false;
  const allowed = new Set([
    "initialize",
    "initialized",
    "account/read",
    "config/read",
    "thread/start",
    "turn/start",
    ...profile.semantics.notifications.lifecycle_supported,
    ...profile.semantics.notifications.ignored_optional,
  ]);
  if (methods.some((method) => !allowed.has(method))) return false;
  return methodsContainOrderedSubsequenceV01(methods, [
    "initialize",
    "account/read",
    "config/read",
    "thread/start",
    "turn/start",
    "turn/completed",
  ]);
}

function containsPrivateMaterialV01(value: unknown): boolean {
  if (typeof value === "string")
    return (
      value.startsWith("/") ||
      /^[A-Za-z]:[\\/]/u.test(value) ||
      /^file:\/\//iu.test(value) ||
      /\b(?:sk|sess|refresh|access)[-_][A-Za-z0-9._-]{12,}\b/iu.test(value)
    );
  if (Array.isArray(value)) return value.some(containsPrivateMaterialV01);
  if (value && typeof value === "object")
    return Object.values(value).some(containsPrivateMaterialV01);
  return false;
}

function recordV01(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function recordHasExactKeysV01(
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean {
  return (
    canonicalizeProtocolValueV01(Object.keys(value).sort()) ===
    canonicalizeProtocolValueV01([...expected].sort())
  );
}

function failV01(code: string): never {
  throw new CodexOrdinaryAuthenticatedCandidateErrorV01(code);
}
