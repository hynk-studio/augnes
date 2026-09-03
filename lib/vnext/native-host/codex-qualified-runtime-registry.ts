import rawRegistryManifest from "./codex-qualified-runtime-registry.v1.json";

import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
  parseStrictIsoTimestampV01,
} from "@/lib/vnext/protocol-primitives";

export const CODEX_QUALIFIED_RUNTIME_REGISTRY_SCHEMA_VERSION_V01 =
  "codex_qualified_runtime_registry.v0.1" as const;
export const CODEX_RUNTIME_COMPATIBILITY_PROFILE_SCHEMA_VERSION_V01 =
  "codex_runtime_compatibility_profile.v0.1" as const;

export type CodexRuntimeLaneV01 =
  | "ordinary_chatgpt_auth"
  | "strict_agent_identity";
export type CodexRuntimeLaneStatusV01 =
  | "candidate"
  | "qualified"
  | "hold"
  | "revoked"
  | "unsupported";
export type CodexRuntimeLaunchShapeV01 =
  | "direct_native"
  | "symlink_to_native"
  | "official_openai_node_launcher";

export interface CodexRuntimeCompatibilityProfileV01 {
  profile_id: string;
  profile_schema_version: typeof CODEX_RUNTIME_COMPATIBILITY_PROFILE_SCHEMA_VERSION_V01;
  fingerprint: string;
  semantics: {
    required_app_server_methods: readonly Readonly<{
      method: string;
      request_contract: string;
      response_contract: string;
    }>[];
    initialization: Readonly<{
      ordering: readonly string[];
      initialized_before_account_projection: true;
      unknown_capabilities_are_not_authority: true;
    }>;
    lane_auth_contracts: Readonly<
      Record<CodexRuntimeLaneV01, Readonly<Record<string, unknown>>>
    >;
    thread_turn_contract: Readonly<Record<string, unknown>>;
    server_requests: Readonly<{
      approval_methods: readonly string[];
      approval_policy: "on-request";
      approvals_reviewer: "user";
      resolution_notification: "serverRequest/resolved";
      duplicate_or_conflicting_identity: "fail_closed";
      unknown_method: "fail_closed";
      active_request_bound: number;
    }>;
    notifications: Readonly<{
      required: readonly string[];
      lifecycle_supported: readonly string[];
      bounded_observed_optional: readonly string[];
      ignored_optional: readonly string[];
      unknown_method: "fail_closed";
    }>;
    response_decoding: Readonly<Record<string, unknown>>;
    sandbox_tool_effect_contract: Readonly<Record<string, unknown>>;
    lifecycle_cleanup_contract: Readonly<{
      transport: "stdio_jsonl";
      max_jsonl_line_bytes: number;
      max_jsonl_buffer_bytes: number;
      rpc_timeout_ms: number;
      graceful_stop_ms: number;
      forced_stop_ms: number;
      owned_process_tree_settlement_required: true;
      streams_closed_required: true;
      temporary_state_removed_required: true;
      remaining_owned_processes_required: 0;
    }>;
    post_spawn_user_agent_validation: Readonly<{
      cli_version_binding: "selected_artifact_exact_version";
      originator_binding: "exact_initialize_client_info_name";
      client_version_binding: "exact_augnes_adapter_version";
      platform_shape: "macos_semver_supported_arch";
      printable_ascii_only: true;
      max_length: number;
      unexpected_suffix: "fail_closed";
    }>;
  };
}

export interface CodexQualifiedRuntimeArtifactV01 {
  entry_id: string;
  version: string;
  release_tag: string;
  tagged_source_commit: string;
  platform: "darwin" | "linux" | "win32";
  architecture: "arm64" | "x64";
  upstream_target_triple: string;
  official_release: Readonly<{
    repository: string;
    release_id: number;
    url: string;
  }>;
  qualified_provenance_asset: Readonly<{
    acquisition_route: string;
    asset_id: number;
    asset_name: string;
    size_bytes: number;
    digest: string;
    digest_mechanism: string;
  }>;
  native_executable_sha256: string;
  provenance_method: Readonly<{
    method: string;
    post_extraction_native_sha256_required: true;
    upstream_macos_signature_claimed: false;
  }>;
  admitted_discovery_launch_shapes: readonly Readonly<{
    shape: CodexRuntimeLaunchShapeV01;
    contract: string;
    launcher_sha256?: string;
    supported_package_layouts?: readonly string[];
  }>[];
  unsupported_acquisition_routes: readonly Readonly<{
    route: string;
    example_asset_name: string;
    status: "unsupported";
  }>[];
  compatibility_profile_id: string;
  compatibility_profile_fingerprint: string;
  lanes: Readonly<
    Record<
      CodexRuntimeLaneV01,
      Readonly<{
        status: CodexRuntimeLaneStatusV01;
        qualified_at: string | null;
        reason: string;
        evidence_refs: readonly string[];
        review_refs: readonly string[];
      }>
    >
  >;
  legacy_exact_qualification_evidence: Readonly<{
    semantic_profile_fingerprint: string;
    ordinary_deciding_receipt_fingerprint: string;
  }>;
  revocation: null | Readonly<{
    revoked_at: string;
    reason: string;
    evidence_refs: readonly string[];
  }>;
  not_after: string | null;
  security_floor: null | Readonly<{
    floor_id: string;
    evaluation: "satisfied" | "unsatisfied";
    evidence_refs: readonly string[];
  }>;
}

export interface CodexQualifiedRuntimeRegistryV01 {
  registry_schema_version: typeof CODEX_QUALIFIED_RUNTIME_REGISTRY_SCHEMA_VERSION_V01;
  authority: Readonly<{
    authority_kind: "checked_in_human_reviewed_manifest";
    runtime_mutation: "forbidden";
    qualification_receipts: "evidence_only";
    production_promotion: "checked_in_reviewed_manifest_change_required";
  }>;
  compatibility_profiles: readonly CodexRuntimeCompatibilityProfileV01[];
  artifacts: readonly CodexQualifiedRuntimeArtifactV01[];
  production_selection: Readonly<{
    mode: "pinned_exact";
    lane: CodexRuntimeLaneV01;
    entry_id: string;
  }>;
}

export interface CodexQualifiedRuntimeSelectionV01 {
  selection_mode: "pinned_exact";
  lane: CodexRuntimeLaneV01;
  artifact: CodexQualifiedRuntimeArtifactV01;
  compatibility_profile: CodexRuntimeCompatibilityProfileV01;
}

export class CodexQualifiedRuntimeRegistryErrorV01 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "CodexQualifiedRuntimeRegistryErrorV01";
  }
}

const SHA256_PATTERN_V01 = /^sha256:[a-f0-9]{64}$/u;
const BARE_SHA256_PATTERN_V01 = /^[a-f0-9]{64}$/u;
const SOURCE_COMMIT_PATTERN_V01 = /^[a-f0-9]{40}$/u;
const ID_PATTERN_V01 = /^[a-z0-9][a-z0-9._-]{0,127}$/u;
const SEMVER_PATTERN_V01 = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/u;
const LANE_STATUSES_V01 = new Set<CodexRuntimeLaneStatusV01>([
  "candidate",
  "qualified",
  "hold",
  "revoked",
  "unsupported",
]);
const TARGET_TRIPLES_BY_PLATFORM_ARCH_V01 = new Map<string, Set<string>>([
  ["darwin:arm64", new Set(["aarch64-apple-darwin"])],
  ["darwin:x64", new Set(["x86_64-apple-darwin"])],
  [
    "linux:arm64",
    new Set(["aarch64-unknown-linux-gnu", "aarch64-unknown-linux-musl"]),
  ],
  [
    "linux:x64",
    new Set(["x86_64-unknown-linux-gnu", "x86_64-unknown-linux-musl"]),
  ],
  ["win32:arm64", new Set(["aarch64-pc-windows-msvc"])],
  ["win32:x64", new Set(["x86_64-pc-windows-msvc"])],
]);

export function codexRuntimeCompatibilityProfileFingerprintV01(input: {
  profile_id: string;
  profile_schema_version: string;
  semantics: unknown;
}): string {
  return createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      profile_id: input.profile_id,
      profile_schema_version: input.profile_schema_version,
      semantics: input.semantics,
    }),
  );
}

export function validateCodexQualifiedRuntimeRegistryV01(
  input: unknown,
): CodexQualifiedRuntimeRegistryV01 {
  const registry = cloneJsonValueV01(input);
  const root = exactRecordV01(
    registry,
    [
      "registry_schema_version",
      "authority",
      "compatibility_profiles",
      "artifacts",
      "production_selection",
    ],
    "codex_qualified_runtime_registry_schema_invalid",
  );
  if (
    root.registry_schema_version !==
    CODEX_QUALIFIED_RUNTIME_REGISTRY_SCHEMA_VERSION_V01
  )
    failV01("codex_qualified_runtime_registry_schema_invalid");
  validateAuthorityV01(root.authority);

  const rawProfiles = arrayV01(
    root.compatibility_profiles,
    "codex_qualified_runtime_registry_profiles_invalid",
  );
  if (rawProfiles.length === 0)
    failV01("codex_qualified_runtime_registry_profiles_invalid");
  const profiles = rawProfiles.map(validateCompatibilityProfileV01);
  const profileIds = new Set<string>();
  for (const profile of profiles) {
    if (profileIds.has(profile.profile_id))
      failV01("codex_qualified_runtime_registry_duplicate_profile_id");
    profileIds.add(profile.profile_id);
  }

  const rawArtifacts = arrayV01(
    root.artifacts,
    "codex_qualified_runtime_registry_artifacts_invalid",
  );
  if (rawArtifacts.length === 0)
    failV01("codex_qualified_runtime_registry_artifacts_invalid");
  const artifacts = rawArtifacts.map(validateArtifactV01);
  const entryIds = new Set<string>();
  const artifactTuples = new Set<string>();
  const releaseAssets = new Set<string>();
  for (const artifact of artifacts) {
    if (entryIds.has(artifact.entry_id))
      failV01("codex_qualified_runtime_registry_duplicate_entry_id");
    entryIds.add(artifact.entry_id);
    const tuple = canonicalizeProtocolValueV01({
      version: artifact.version,
      release_tag: artifact.release_tag,
      tagged_source_commit: artifact.tagged_source_commit,
      platform: artifact.platform,
      architecture: artifact.architecture,
      upstream_target_triple: artifact.upstream_target_triple,
      native_executable_sha256: artifact.native_executable_sha256,
      release_repository: artifact.official_release.repository,
      release_id: artifact.official_release.release_id,
      asset_id: artifact.qualified_provenance_asset.asset_id,
    });
    if (artifactTuples.has(tuple))
      failV01("codex_qualified_runtime_registry_duplicate_artifact_tuple");
    artifactTuples.add(tuple);
    const assetIdentity = `${artifact.official_release.repository}:${artifact.qualified_provenance_asset.asset_id}`;
    if (releaseAssets.has(assetIdentity))
      failV01("codex_qualified_runtime_registry_ambiguous_asset_identity");
    releaseAssets.add(assetIdentity);
    const profile = profiles.find(
      (candidate) => candidate.profile_id === artifact.compatibility_profile_id,
    );
    if (!profile)
      failV01("codex_qualified_runtime_registry_profile_missing");
    if (profile.fingerprint !== artifact.compatibility_profile_fingerprint)
      failV01("codex_qualified_runtime_registry_profile_reference_mismatch");
  }

  const productionSelection = validateProductionSelectionV01(
    root.production_selection,
  );
  if (!artifacts.some((entry) => entry.entry_id === productionSelection.entry_id))
    failV01("codex_qualified_runtime_registry_selection_missing");

  return deepFreezeV01({
    registry_schema_version:
      CODEX_QUALIFIED_RUNTIME_REGISTRY_SCHEMA_VERSION_V01,
    authority: root.authority,
    compatibility_profiles: profiles,
    artifacts,
    production_selection: productionSelection,
  } as CodexQualifiedRuntimeRegistryV01);
}

export const CODEX_QUALIFIED_RUNTIME_REGISTRY_V01 =
  validateCodexQualifiedRuntimeRegistryV01(rawRegistryManifest);

export const CODEX_QUALIFIED_RUNTIME_REGISTRY_FINGERPRINT_V01 =
  createProtocolSha256V01(
    canonicalizeProtocolValueV01(CODEX_QUALIFIED_RUNTIME_REGISTRY_V01),
  );

export function selectPinnedCodexQualifiedRuntimeV01(input: {
  lane?: CodexRuntimeLaneV01;
  observed_at?: string;
  registry?: unknown;
} = {}): CodexQualifiedRuntimeSelectionV01 {
  const registry = input.registry !== undefined
    ? validateCodexQualifiedRuntimeRegistryV01(input.registry)
    : CODEX_QUALIFIED_RUNTIME_REGISTRY_V01;
  const lane = input.lane ?? registry.production_selection.lane;
  if (!(["ordinary_chatgpt_auth", "strict_agent_identity"] as const).includes(lane))
    failV01("codex_qualified_runtime_registry_lane_invalid");
  const artifact = registry.artifacts.find(
    (entry) => entry.entry_id === registry.production_selection.entry_id,
  );
  if (!artifact)
    failV01("codex_qualified_runtime_registry_selection_missing");
  const laneState = artifact.lanes[lane];
  if (artifact.revocation !== null || laneState.status === "revoked")
    failV01("codex_qualified_runtime_registry_selection_revoked");
  if (laneState.status !== "qualified")
    failV01("codex_qualified_runtime_registry_lane_not_qualified");
  const observedAt = input.observed_at ?? new Date().toISOString();
  const observedMs = strictTimestampMsV01(observedAt);
  if (
    artifact.not_after !== null &&
    observedMs >= strictTimestampMsV01(artifact.not_after)
  )
    failV01("codex_qualified_runtime_registry_selection_expired");
  if (
    artifact.security_floor !== null &&
    artifact.security_floor.evaluation !== "satisfied"
  )
    failV01("codex_qualified_runtime_registry_security_floor_unsatisfied");
  const compatibilityProfile = registry.compatibility_profiles.find(
    (profile) => profile.profile_id === artifact.compatibility_profile_id,
  );
  if (
    !compatibilityProfile ||
    compatibilityProfile.fingerprint !==
      artifact.compatibility_profile_fingerprint
  )
    failV01("codex_qualified_runtime_registry_profile_reference_mismatch");
  return deepFreezeV01({
    selection_mode: "pinned_exact",
    lane,
    artifact,
    compatibility_profile: compatibilityProfile,
  });
}

export function assertCurrentCodexQualifiedRuntimeSelectionV01(
  selection: CodexQualifiedRuntimeSelectionV01,
): void {
  const current = selectPinnedCodexQualifiedRuntimeV01({ lane: selection.lane });
  if (
    selection.selection_mode !== current.selection_mode ||
    canonicalizeProtocolValueV01(selection.artifact) !==
      canonicalizeProtocolValueV01(current.artifact) ||
    canonicalizeProtocolValueV01(selection.compatibility_profile) !==
      canonicalizeProtocolValueV01(current.compatibility_profile)
  )
    failV01("codex_qualified_runtime_registry_selection_mismatch");
}

function validateAuthorityV01(value: unknown): void {
  const authority = exactRecordV01(
    value,
    [
      "authority_kind",
      "runtime_mutation",
      "qualification_receipts",
      "production_promotion",
    ],
    "codex_qualified_runtime_registry_authority_invalid",
  );
  if (
    authority.authority_kind !== "checked_in_human_reviewed_manifest" ||
    authority.runtime_mutation !== "forbidden" ||
    authority.qualification_receipts !== "evidence_only" ||
    authority.production_promotion !==
      "checked_in_reviewed_manifest_change_required"
  )
    failV01("codex_qualified_runtime_registry_authority_invalid");
}

function validateCompatibilityProfileV01(
  value: unknown,
): CodexRuntimeCompatibilityProfileV01 {
  const profile = exactRecordV01(
    value,
    ["profile_id", "profile_schema_version", "fingerprint", "semantics"],
    "codex_runtime_compatibility_profile_invalid",
  );
  const profileId = idV01(
    profile.profile_id,
    "codex_runtime_compatibility_profile_invalid",
  );
  if (
    profile.profile_schema_version !==
    CODEX_RUNTIME_COMPATIBILITY_PROFILE_SCHEMA_VERSION_V01
  )
    failV01("codex_runtime_compatibility_profile_invalid");
  const fingerprint = sha256V01(
    profile.fingerprint,
    "codex_runtime_compatibility_profile_fingerprint_invalid",
  );
  const semantics = exactRecordV01(
    profile.semantics,
    [
      "required_app_server_methods",
      "initialization",
      "lane_auth_contracts",
      "thread_turn_contract",
      "server_requests",
      "notifications",
      "response_decoding",
      "sandbox_tool_effect_contract",
      "lifecycle_cleanup_contract",
      "post_spawn_user_agent_validation",
    ],
    "codex_runtime_compatibility_profile_invalid",
  );
  validateProfileSemanticsV01(semantics);
  const computed = codexRuntimeCompatibilityProfileFingerprintV01({
    profile_id: profileId,
    profile_schema_version: profile.profile_schema_version,
    semantics,
  });
  if (fingerprint !== computed)
    failV01("codex_runtime_compatibility_profile_fingerprint_mismatch");
  const canonicalSemantics = canonicalizeProtocolValueV01(semantics);
  if (
    /rust-v[0-9]|(?:^|[^0-9])(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)(?:[^0-9]|$)|[a-f0-9]{40}|sha256:|\.tar\.gz/u.test(
      canonicalSemantics,
    )
  )
    failV01("codex_runtime_compatibility_profile_artifact_identity_forbidden");
  return {
    profile_id: profileId,
    profile_schema_version:
      CODEX_RUNTIME_COMPATIBILITY_PROFILE_SCHEMA_VERSION_V01,
    fingerprint,
    semantics: semantics as unknown as CodexRuntimeCompatibilityProfileV01["semantics"],
  };
}

function validateProfileSemanticsV01(
  semantics: Record<string, unknown>,
): void {
  const methods = arrayV01(
    semantics.required_app_server_methods,
    "codex_runtime_compatibility_profile_methods_invalid",
  ).map((value) =>
    exactRecordV01(
      value,
      ["method", "request_contract", "response_contract"],
      "codex_runtime_compatibility_profile_methods_invalid",
    ),
  );
  if (methods.length === 0)
    failV01("codex_runtime_compatibility_profile_methods_invalid");
  uniqueStringsV01(
    methods.map((method) => method.method),
    "codex_runtime_compatibility_profile_methods_invalid",
  );
  for (const method of methods) {
    boundedStringV01(method.method, 128, "codex_runtime_compatibility_profile_methods_invalid");
    boundedStringV01(method.request_contract, 160, "codex_runtime_compatibility_profile_methods_invalid");
    boundedStringV01(method.response_contract, 160, "codex_runtime_compatibility_profile_methods_invalid");
  }
  const initialization = exactRecordV01(
    semantics.initialization,
    [
      "ordering",
      "initialized_before_account_projection",
      "unknown_capabilities_are_not_authority",
    ],
    "codex_runtime_compatibility_profile_initialize_invalid",
  );
  const ordering = stringArrayV01(
    initialization.ordering,
    "codex_runtime_compatibility_profile_initialize_invalid",
  );
  if (
    canonicalizeProtocolValueV01(ordering) !==
      canonicalizeProtocolValueV01([
        "initialize_request",
        "initialize_response",
        "selected_runtime_user_agent_validation",
        "initialized_notification",
        "lane_account_projection",
      ]) ||
    initialization.initialized_before_account_projection !== true ||
    initialization.unknown_capabilities_are_not_authority !== true
  )
    failV01("codex_runtime_compatibility_profile_initialize_invalid");
  const lanes = exactRecordV01(
    semantics.lane_auth_contracts,
    ["ordinary_chatgpt_auth", "strict_agent_identity"],
    "codex_runtime_compatibility_profile_lane_contract_invalid",
  );
  const ordinaryLane = exactRecordV01(
    lanes.ordinary_chatgpt_auth,
    [
      "required_methods_after_initialized",
      "account_contract",
      "refresh_token_requests",
      "ordinary_user_state_copy",
    ],
    "codex_runtime_compatibility_profile_lane_contract_invalid",
  );
  if (
    canonicalizeProtocolValueV01(ordinaryLane.required_methods_after_initialized) !==
      canonicalizeProtocolValueV01(["account/read"]) ||
    ordinaryLane.account_contract !== "non_null_account_object" ||
    ordinaryLane.refresh_token_requests !== false ||
    ordinaryLane.ordinary_user_state_copy !== "not_performed"
  )
    failV01("codex_runtime_compatibility_profile_lane_contract_invalid");
  const strictLane = exactRecordV01(
    lanes.strict_agent_identity,
    [
      "required_preflight_methods_after_initialized",
      "account_contract",
      "auth_status_contract",
      "configuration_contract",
      "mcp_contract",
      "credential_bootstrap_authority",
    ],
    "codex_runtime_compatibility_profile_lane_contract_invalid",
  );
  uniqueStringsV01(
    stringArrayV01(
      strictLane.required_preflight_methods_after_initialized,
      "codex_runtime_compatibility_profile_lane_contract_invalid",
    ),
    "codex_runtime_compatibility_profile_lane_contract_invalid",
  );
  for (const key of [
    "account_contract",
    "auth_status_contract",
    "configuration_contract",
    "mcp_contract",
    "credential_bootstrap_authority",
  ])
    boundedStringV01(
      strictLane[key],
      160,
      "codex_runtime_compatibility_profile_lane_contract_invalid",
    );
  const requests = exactRecordV01(
    semantics.server_requests,
    [
      "approval_methods",
      "approval_policy",
      "approvals_reviewer",
      "resolution_notification",
      "duplicate_or_conflicting_identity",
      "unknown_method",
      "active_request_bound",
    ],
    "codex_runtime_compatibility_profile_server_request_invalid",
  );
  uniqueStringsV01(
    stringArrayV01(requests.approval_methods, "codex_runtime_compatibility_profile_server_request_invalid"),
    "codex_runtime_compatibility_profile_server_request_invalid",
  );
  if (
    requests.approval_policy !== "on-request" ||
    requests.approvals_reviewer !== "user" ||
    requests.resolution_notification !== "serverRequest/resolved" ||
    requests.duplicate_or_conflicting_identity !== "fail_closed" ||
    requests.unknown_method !== "fail_closed" ||
    !Number.isInteger(requests.active_request_bound) ||
    (requests.active_request_bound as number) <= 0
  )
    failV01("codex_runtime_compatibility_profile_server_request_invalid");
  const notifications = exactRecordV01(
    semantics.notifications,
    [
      "required",
      "lifecycle_supported",
      "bounded_observed_optional",
      "ignored_optional",
      "unknown_method",
    ],
    "codex_runtime_compatibility_profile_notification_invalid",
  );
  const requiredNotifications = stringArrayV01(
    notifications.required,
    "codex_runtime_compatibility_profile_notification_invalid",
  );
  const notificationGroups = [
    stringArrayV01(notifications.lifecycle_supported, "codex_runtime_compatibility_profile_notification_invalid"),
    stringArrayV01(notifications.bounded_observed_optional, "codex_runtime_compatibility_profile_notification_invalid"),
    stringArrayV01(notifications.ignored_optional, "codex_runtime_compatibility_profile_notification_invalid"),
  ];
  for (const group of [requiredNotifications, ...notificationGroups])
    uniqueStringsV01(group, "codex_runtime_compatibility_profile_notification_invalid");
  const supportedNotifications = new Set([
    ...notificationGroups[0]!,
    ...notificationGroups[1]!,
  ]);
  if (
    requiredNotifications.length === 0 ||
    requiredNotifications.some((method) => !supportedNotifications.has(method)) ||
    notificationGroups[2]!.some((method) => supportedNotifications.has(method)) ||
    notifications.unknown_method !== "fail_closed"
  )
    failV01("codex_runtime_compatibility_profile_notification_invalid");
  const threadTurn = exactRecordV01(
    semantics.thread_turn_contract,
    [
      "new_thread_method",
      "resume_read_method",
      "resume_method",
      "turn_method",
      "terminal_owner",
      "terminal_statuses",
      "nonterminal_status",
      "root_identity_must_match",
      "thread_turn_session_identity_must_match",
    ],
    "codex_runtime_compatibility_profile_thread_turn_invalid",
  );
  for (const key of [
    "new_thread_method",
    "resume_read_method",
    "resume_method",
    "turn_method",
    "terminal_owner",
    "nonterminal_status",
  ])
    boundedStringV01(
      threadTurn[key],
      128,
      "codex_runtime_compatibility_profile_thread_turn_invalid",
    );
  const terminalStatuses = stringArrayV01(
    threadTurn.terminal_statuses,
    "codex_runtime_compatibility_profile_thread_turn_invalid",
  );
  uniqueStringsV01(
    terminalStatuses,
    "codex_runtime_compatibility_profile_thread_turn_invalid",
  );
  if (
    terminalStatuses.length === 0 ||
    threadTurn.root_identity_must_match !== true ||
    threadTurn.thread_turn_session_identity_must_match !== true
  )
    failV01("codex_runtime_compatibility_profile_thread_turn_invalid");
  const responseDecoding = exactRecordV01(
    semantics.response_decoding,
    [
      "required_fields",
      "required_semantics",
      "additive_object_fields",
      "optional_capabilities",
    ],
    "codex_runtime_compatibility_profile_response_decoding_invalid",
  );
  if (
    responseDecoding.required_fields !==
      "fail_closed_when_missing_or_invalid" ||
    responseDecoding.required_semantics !== "fail_closed_when_changed" ||
    responseDecoding.additive_object_fields !==
      "tolerated_only_when_unused_and_non_authoritative" ||
    responseDecoding.optional_capabilities !==
      "ignored_unless_explicitly_profiled"
  )
    failV01("codex_runtime_compatibility_profile_response_decoding_invalid");
  const effects = exactRecordV01(
    semantics.sandbox_tool_effect_contract,
    [
      "sandbox_source",
      "read_only_default",
      "workspace_write_requires_exact_admitted_operation",
      "network_access",
      "danger_full_access",
      "prompt_or_model_authority_expansion",
      "command_file_and_permission_effects",
      "repository_write_outside_selected_root",
      "unexpected_external_effect",
    ],
    "codex_runtime_compatibility_profile_effect_invalid",
  );
  if (
    effects.sandbox_source !==
      "already_admitted_structured_augnes_authority_only" ||
    effects.read_only_default !== true ||
    effects.workspace_write_requires_exact_admitted_operation !== true ||
    effects.network_access !== false ||
    effects.danger_full_access !== "forbidden" ||
    effects.prompt_or_model_authority_expansion !== "forbidden" ||
    effects.command_file_and_permission_effects !==
      "approval_and_exact_scope_required" ||
    effects.repository_write_outside_selected_root !== "forbidden" ||
    effects.unexpected_external_effect !== "fail_closed"
  )
    failV01("codex_runtime_compatibility_profile_effect_invalid");
  const lifecycle = exactRecordV01(
    semantics.lifecycle_cleanup_contract,
    [
      "transport",
      "max_jsonl_line_bytes",
      "max_jsonl_buffer_bytes",
      "rpc_timeout_ms",
      "graceful_stop_ms",
      "forced_stop_ms",
      "owned_process_tree_settlement_required",
      "streams_closed_required",
      "temporary_state_removed_required",
      "remaining_owned_processes_required",
    ],
    "codex_runtime_compatibility_profile_lifecycle_invalid",
  );
  for (const key of [
    "max_jsonl_line_bytes",
    "max_jsonl_buffer_bytes",
    "rpc_timeout_ms",
    "graceful_stop_ms",
    "forced_stop_ms",
  ]) {
    positiveSafeIntegerV01(
      lifecycle[key],
      "codex_runtime_compatibility_profile_lifecycle_invalid",
    );
  }
  if (
    lifecycle.transport !== "stdio_jsonl" ||
    (lifecycle.max_jsonl_buffer_bytes as number) <
      (lifecycle.max_jsonl_line_bytes as number) ||
    lifecycle.owned_process_tree_settlement_required !== true ||
    lifecycle.streams_closed_required !== true ||
    lifecycle.temporary_state_removed_required !== true ||
    lifecycle.remaining_owned_processes_required !== 0
  )
    failV01("codex_runtime_compatibility_profile_lifecycle_invalid");
  const userAgent = exactRecordV01(
    semantics.post_spawn_user_agent_validation,
    [
      "cli_version_binding",
      "originator_binding",
      "client_version_binding",
      "platform_shape",
      "printable_ascii_only",
      "max_length",
      "unexpected_suffix",
    ],
    "codex_runtime_compatibility_profile_user_agent_invalid",
  );
  if (
    userAgent.cli_version_binding !== "selected_artifact_exact_version" ||
    userAgent.originator_binding !== "exact_initialize_client_info_name" ||
    userAgent.client_version_binding !== "exact_augnes_adapter_version" ||
    userAgent.platform_shape !== "macos_semver_supported_arch" ||
    userAgent.printable_ascii_only !== true ||
    userAgent.max_length !== 512 ||
    userAgent.unexpected_suffix !== "fail_closed"
  )
    failV01("codex_runtime_compatibility_profile_user_agent_invalid");
}

function validateArtifactV01(value: unknown): CodexQualifiedRuntimeArtifactV01 {
  const artifact = exactRecordV01(
    value,
    [
      "entry_id",
      "version",
      "release_tag",
      "tagged_source_commit",
      "platform",
      "architecture",
      "upstream_target_triple",
      "official_release",
      "qualified_provenance_asset",
      "native_executable_sha256",
      "provenance_method",
      "admitted_discovery_launch_shapes",
      "unsupported_acquisition_routes",
      "compatibility_profile_id",
      "compatibility_profile_fingerprint",
      "lanes",
      "legacy_exact_qualification_evidence",
      "revocation",
      "not_after",
      "security_floor",
    ],
    "codex_qualified_runtime_registry_artifact_invalid",
  );
  const entryId = idV01(artifact.entry_id, "codex_qualified_runtime_registry_artifact_invalid");
  const version = boundedStringV01(artifact.version, 64, "codex_qualified_runtime_registry_artifact_invalid");
  if (!SEMVER_PATTERN_V01.test(version))
    failV01("codex_qualified_runtime_registry_artifact_invalid");
  const releaseTag = boundedStringV01(artifact.release_tag, 96, "codex_qualified_runtime_registry_artifact_invalid");
  if (releaseTag !== `rust-v${version}`)
    failV01("codex_qualified_runtime_registry_artifact_invalid");
  const taggedSourceCommit = boundedStringV01(artifact.tagged_source_commit, 40, "codex_qualified_runtime_registry_artifact_invalid");
  if (!SOURCE_COMMIT_PATTERN_V01.test(taggedSourceCommit))
    failV01("codex_qualified_runtime_registry_artifact_invalid");
  if (!(["darwin", "linux", "win32"] as const).includes(artifact.platform as never))
    failV01("codex_qualified_runtime_registry_platform_invalid");
  if (!(["arm64", "x64"] as const).includes(artifact.architecture as never))
    failV01("codex_qualified_runtime_registry_platform_invalid");
  const triple = boundedStringV01(artifact.upstream_target_triple, 96, "codex_qualified_runtime_registry_platform_invalid");
  if (!TARGET_TRIPLES_BY_PLATFORM_ARCH_V01.get(`${artifact.platform}:${artifact.architecture}`)?.has(triple))
    failV01("codex_qualified_runtime_registry_platform_invalid");
  const release = exactRecordV01(
    artifact.official_release,
    ["repository", "release_id", "url"],
    "codex_qualified_runtime_registry_release_invalid",
  );
  const repository = boundedStringV01(release.repository, 128, "codex_qualified_runtime_registry_release_invalid");
  positiveSafeIntegerV01(release.release_id, "codex_qualified_runtime_registry_release_invalid");
  if (
    repository !== "openai/codex" ||
    release.url !== `https://github.com/${repository}/releases/tag/${releaseTag}`
  )
    failV01("codex_qualified_runtime_registry_release_invalid");
  const asset = exactRecordV01(
    artifact.qualified_provenance_asset,
    [
      "acquisition_route",
      "asset_id",
      "asset_name",
      "size_bytes",
      "digest",
      "digest_mechanism",
    ],
    "codex_qualified_runtime_registry_asset_invalid",
  );
  if (asset.acquisition_route !== "standalone_release_tarball")
    failV01("codex_qualified_runtime_registry_asset_invalid");
  positiveSafeIntegerV01(asset.asset_id, "codex_qualified_runtime_registry_asset_invalid");
  const assetName = boundedStringV01(asset.asset_name, 256, "codex_qualified_runtime_registry_asset_invalid");
  if (assetName !== `codex-${triple}.tar.gz`)
    failV01("codex_qualified_runtime_registry_asset_invalid");
  positiveSafeIntegerV01(asset.size_bytes, "codex_qualified_runtime_registry_asset_invalid");
  sha256V01(asset.digest, "codex_qualified_runtime_registry_asset_invalid");
  if (asset.digest_mechanism !== "official_github_release_asset_digest_sha256")
    failV01("codex_qualified_runtime_registry_asset_invalid");
  sha256V01(artifact.native_executable_sha256, "codex_qualified_runtime_registry_artifact_invalid");
  validateProvenanceV01(artifact.provenance_method);
  validateLaunchShapesV01(artifact.admitted_discovery_launch_shapes);
  validateUnsupportedAcquisitionRoutesV01(artifact.unsupported_acquisition_routes);
  idV01(artifact.compatibility_profile_id, "codex_qualified_runtime_registry_profile_reference_invalid");
  sha256V01(artifact.compatibility_profile_fingerprint, "codex_qualified_runtime_registry_profile_reference_invalid");
  validateLanesV01(artifact.lanes);
  validateLegacyEvidenceV01(artifact.legacy_exact_qualification_evidence);
  validateRevocationV01(artifact.revocation);
  if (artifact.not_after !== null) strictTimestampMsV01(artifact.not_after);
  validateSecurityFloorV01(artifact.security_floor);
  return artifact as unknown as CodexQualifiedRuntimeArtifactV01;
}

function validateLanesV01(value: unknown): void {
  const lanes = exactRecordV01(
    value,
    ["ordinary_chatgpt_auth", "strict_agent_identity"],
    "codex_qualified_runtime_registry_lanes_invalid",
  );
  for (const laneName of ["ordinary_chatgpt_auth", "strict_agent_identity"] as const) {
    const lane = exactRecordV01(
      lanes[laneName],
      ["status", "qualified_at", "reason", "evidence_refs", "review_refs"],
      "codex_qualified_runtime_registry_lane_invalid",
    );
    if (!LANE_STATUSES_V01.has(lane.status as CodexRuntimeLaneStatusV01))
      failV01("codex_qualified_runtime_registry_lane_invalid");
    boundedStringV01(lane.reason, 256, "codex_qualified_runtime_registry_lane_invalid");
    nonemptyStringArrayV01(lane.evidence_refs, "codex_qualified_runtime_registry_lane_invalid");
    nonemptyStringArrayV01(lane.review_refs, "codex_qualified_runtime_registry_lane_invalid");
    if (lane.status === "qualified") {
      if (typeof lane.qualified_at !== "string")
        failV01("codex_qualified_runtime_registry_lane_invalid");
      strictTimestampMsV01(lane.qualified_at);
    } else if (lane.qualified_at !== null) {
      failV01("codex_qualified_runtime_registry_lane_invalid");
    }
  }
}

function validateLaunchShapesV01(value: unknown): void {
  const shapes = arrayV01(value, "codex_qualified_runtime_registry_launch_shape_invalid");
  if (shapes.length === 0)
    failV01("codex_qualified_runtime_registry_launch_shape_invalid");
  const seen = new Set<string>();
  for (const rawShape of shapes) {
    const record = recordV01(rawShape, "codex_qualified_runtime_registry_launch_shape_invalid");
    const shape = record.shape;
    if (!(["direct_native", "symlink_to_native", "official_openai_node_launcher"] as const).includes(shape as never) || seen.has(shape as string))
      failV01("codex_qualified_runtime_registry_launch_shape_invalid");
    seen.add(shape as string);
    boundedStringV01(record.contract, 256, "codex_qualified_runtime_registry_launch_shape_invalid");
    if (shape === "official_openai_node_launcher") {
      exactKeysV01(record, ["shape", "contract", "launcher_sha256", "supported_package_layouts"], "codex_qualified_runtime_registry_launch_shape_invalid");
      sha256V01(record.launcher_sha256, "codex_qualified_runtime_registry_launch_shape_invalid");
      const layouts = stringArrayV01(record.supported_package_layouts, "codex_qualified_runtime_registry_launch_shape_invalid");
      if (canonicalizeProtocolValueV01(layouts) !== canonicalizeProtocolValueV01(["nested_platform_package", "bundled_vendor"]))
        failV01("codex_qualified_runtime_registry_launch_shape_invalid");
    } else {
      exactKeysV01(record, ["shape", "contract"], "codex_qualified_runtime_registry_launch_shape_invalid");
    }
  }
}

function validateUnsupportedAcquisitionRoutesV01(value: unknown): void {
  const routes = arrayV01(value, "codex_qualified_runtime_registry_acquisition_route_invalid");
  for (const route of routes) {
    const record = exactRecordV01(route, ["route", "example_asset_name", "status"], "codex_qualified_runtime_registry_acquisition_route_invalid");
    boundedStringV01(record.route, 128, "codex_qualified_runtime_registry_acquisition_route_invalid");
    boundedStringV01(record.example_asset_name, 256, "codex_qualified_runtime_registry_acquisition_route_invalid");
    if (record.status !== "unsupported")
      failV01("codex_qualified_runtime_registry_acquisition_route_invalid");
  }
}

function validateProvenanceV01(value: unknown): void {
  const provenance = exactRecordV01(
    value,
    ["method", "post_extraction_native_sha256_required", "upstream_macos_signature_claimed"],
    "codex_qualified_runtime_registry_provenance_invalid",
  );
  if (
    provenance.method !==
      "official_github_release_metadata_and_asset_digest" ||
    provenance.post_extraction_native_sha256_required !== true ||
    provenance.upstream_macos_signature_claimed !== false
  )
    failV01("codex_qualified_runtime_registry_provenance_invalid");
}

function validateLegacyEvidenceV01(value: unknown): void {
  const evidence = exactRecordV01(
    value,
    ["semantic_profile_fingerprint", "ordinary_deciding_receipt_fingerprint"],
    "codex_qualified_runtime_registry_legacy_evidence_invalid",
  );
  sha256V01(evidence.semantic_profile_fingerprint, "codex_qualified_runtime_registry_legacy_evidence_invalid");
  if (typeof evidence.ordinary_deciding_receipt_fingerprint !== "string" || !BARE_SHA256_PATTERN_V01.test(evidence.ordinary_deciding_receipt_fingerprint))
    failV01("codex_qualified_runtime_registry_legacy_evidence_invalid");
}

function validateRevocationV01(value: unknown): void {
  if (value === null) return;
  const revocation = exactRecordV01(value, ["revoked_at", "reason", "evidence_refs"], "codex_qualified_runtime_registry_revocation_invalid");
  strictTimestampMsV01(revocation.revoked_at);
  boundedStringV01(revocation.reason, 256, "codex_qualified_runtime_registry_revocation_invalid");
  nonemptyStringArrayV01(revocation.evidence_refs, "codex_qualified_runtime_registry_revocation_invalid");
}

function validateSecurityFloorV01(value: unknown): void {
  if (value === null) return;
  const floor = exactRecordV01(value, ["floor_id", "evaluation", "evidence_refs"], "codex_qualified_runtime_registry_security_floor_invalid");
  idV01(floor.floor_id, "codex_qualified_runtime_registry_security_floor_invalid");
  if (floor.evaluation !== "satisfied" && floor.evaluation !== "unsatisfied")
    failV01("codex_qualified_runtime_registry_security_floor_invalid");
  nonemptyStringArrayV01(floor.evidence_refs, "codex_qualified_runtime_registry_security_floor_invalid");
}

function validateProductionSelectionV01(value: unknown): CodexQualifiedRuntimeRegistryV01["production_selection"] {
  const selection = exactRecordV01(value, ["mode", "lane", "entry_id"], "codex_qualified_runtime_registry_selection_invalid");
  if (selection.mode !== "pinned_exact" || selection.lane !== "ordinary_chatgpt_auth")
    failV01("codex_qualified_runtime_registry_selection_invalid");
  return {
    mode: "pinned_exact",
    lane: "ordinary_chatgpt_auth",
    entry_id: idV01(selection.entry_id, "codex_qualified_runtime_registry_selection_invalid"),
  };
}

function exactRecordV01(value: unknown, keys: readonly string[], code: string): Record<string, unknown> {
  const record = recordV01(value, code);
  exactKeysV01(record, keys, code);
  return record;
}

function exactKeysV01(record: Record<string, unknown>, keys: readonly string[], code: string): void {
  if (canonicalizeProtocolValueV01(Object.keys(record).sort()) !== canonicalizeProtocolValueV01([...keys].sort()))
    failV01(code);
}

function recordV01(value: unknown, code: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) failV01(code);
  return value as Record<string, unknown>;
}

function arrayV01(value: unknown, code: string): unknown[] {
  if (!Array.isArray(value)) failV01(code);
  return value;
}

function stringArrayV01(value: unknown, code: string): string[] {
  const values = arrayV01(value, code);
  if (!values.every((entry) => typeof entry === "string" && entry.length > 0 && entry.length <= 256)) failV01(code);
  return values as string[];
}

function nonemptyStringArrayV01(value: unknown, code: string): string[] {
  const values = stringArrayV01(value, code);
  if (values.length === 0) failV01(code);
  uniqueStringsV01(values, code);
  return values;
}

function uniqueStringsV01(values: unknown[], code: string): void {
  if (!values.every((entry) => typeof entry === "string") || new Set(values).size !== values.length) failV01(code);
}

function boundedStringV01(value: unknown, maxLength: number, code: string): string {
  if (typeof value !== "string" || value.length === 0 || value.length > maxLength || !/^[\x20-\x7e]+$/u.test(value)) failV01(code);
  return value;
}

function idV01(value: unknown, code: string): string {
  const result = boundedStringV01(value, 128, code);
  if (!ID_PATTERN_V01.test(result)) failV01(code);
  return result;
}

function sha256V01(value: unknown, code: string): string {
  if (typeof value !== "string" || !SHA256_PATTERN_V01.test(value)) failV01(code);
  return value;
}

function positiveSafeIntegerV01(value: unknown, code: string): number {
  if (!Number.isSafeInteger(value) || (value as number) <= 0) failV01(code);
  return value as number;
}

function strictTimestampMsV01(value: unknown): number {
  if (typeof value !== "string") failV01("codex_qualified_runtime_registry_timestamp_invalid");
  const parsed = parseStrictIsoTimestampV01(value);
  if (parsed === null)
    failV01("codex_qualified_runtime_registry_timestamp_invalid");
  return parsed;
}

function cloneJsonValueV01(value: unknown): unknown {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    failV01("codex_qualified_runtime_registry_schema_invalid");
  }
}

function deepFreezeV01<T>(value: T): T {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value as Record<string, unknown>)) deepFreezeV01(child);
  return value;
}

function failV01(code: string): never {
  throw new CodexQualifiedRuntimeRegistryErrorV01(code);
}
