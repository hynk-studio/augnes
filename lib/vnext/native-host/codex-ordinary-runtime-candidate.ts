import { createHash } from "node:crypto";
import { lstatSync, readFileSync, realpathSync, readdirSync } from "node:fs";
import path from "node:path";

import {
  CODEX_APP_SERVER_ADAPTER_VERSION_V01,
  probeCodexCredentialFreeExactProfileV01,
} from "@/lib/vnext/native-host/codex-app-server-adapter";
import { observeReviewedCandidateCodexAppServerUserAgentV01 } from "@/lib/vnext/native-host/codex-app-server-user-agent";
import {
  CODEX_QUALIFIED_RUNTIME_REGISTRY_FINGERPRINT_V01,
  getCodexReviewedRuntimeArtifactV01,
} from "@/lib/vnext/native-host/codex-qualified-runtime-registry";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";

export const CODEX_0_153_2_CANDIDATE_ENTRY_ID_V01 =
  "codex-rust-v0.153.2-darwin-arm64" as const;
export const CODEX_0_153_2_CANDIDATE_QUALIFICATION_RECEIPT_VERSION_V01 =
  "codex_ordinary_runtime_candidate_qualification.v0.1" as const;
export const CODEX_0_153_2_CANDIDATE_READY_DISPOSITION_V01 =
  "READY_FOR_SEPARATELY_AUTHORIZED_ORDINARY_CANARY" as const;

export const CANDIDATE_CONFIG_OVERRIDE_ARGS_V01 = [
  "--strict-config",
  "-c",
  'forced_login_method="chatgpt"',
  "-c",
  'cli_auth_credentials_store="file"',
  "-c",
  'model_provider="openai"',
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
] as const;

const REQUIRED_DISABLED_FEATURES_V01 = [
  "apps",
  "auth_elicitation",
  "background_paginated_rollout_migration",
  "browser_use",
  "browser_use_external",
  "browser_use_full_cdp_access",
  "computer_use",
  "content_item_kinds",
  "context_management",
  "hooks",
  "image_generation",
  "in_app_browser",
  "mcp_2026_07_28",
  "mcp_oauth_refresh_coordination",
  "memories",
  "mentions_v2",
  "multi_agent",
  "network_proxy",
  "plugins",
  "recommended_plugins",
  "remote_control",
  "remote_plugin",
  "request_permissions_tool",
  "shell_snapshot_v2",
  "sleep_tool",
  "standalone_web_search",
  "tool_suggest",
  "use_agent_identity",
  "web_search_cached",
  "web_search_request",
] as const;

export interface CodexOrdinaryRuntimeCandidateQualificationReceiptV01 {
  receipt_version: typeof CODEX_0_153_2_CANDIDATE_QUALIFICATION_RECEIPT_VERSION_V01;
  augnes_source: Readonly<{
    base_commit: string;
    head_commit: string;
    head_tree: string;
  }>;
  registry_fingerprint: string;
  compatibility_profile: Readonly<{
    profile_id: string;
    fingerprint: string;
    decision: "reuse_supported_pending_authenticated_ordinary_canary";
  }>;
  candidate_identity: Readonly<{
    entry_id: string;
    version: string;
    release_tag: string;
    tagged_source_commit: string;
    release_id: number;
    asset_id: number;
    asset_name: string;
    archive_size_bytes: number;
    archive_digest: string;
    archive_member_name: string;
    extracted_native_size_bytes: number;
    native_executable_sha256: string;
    platform: string;
    architecture: string;
    upstream_target_triple: string;
    cli_version: string;
  }>;
  source_schema_delta_fingerprint: string;
  exercised_methods: readonly string[];
  observed_notifications: readonly string[];
  user_agent_observation_fingerprint: string | null;
  credential_free_account_disposition: "unauthenticated_empty_state" | null;
  config_policy_fingerprint: string | null;
  observations: Readonly<{
    sandbox_authority_expansions: 0;
    approval_requests: 0;
    tool_calls: 0;
    command_calls: 0;
    repository_task_calls: 0;
    repository_writes: 0;
    external_effects: 0;
    provider_model_calls: 0;
    keychain_accesses: 0;
    agent_identity_attempts: 0;
    other_network_calls: number;
    official_source_api_reads: number;
    binary_archive_acquisitions: number;
  }>;
  process_settlement: Readonly<{
    natural_shutdown_requested: true;
    streams_closed: boolean;
    remaining_owned_processes: number;
    disposable_state_removed: boolean;
  }>;
  emulated_input: boolean;
  disposition:
    | typeof CODEX_0_153_2_CANDIDATE_READY_DISPOSITION_V01
    | "HOLD_TEST_EMULATED_NOT_EXACT"
    | "HOLD_CREDENTIAL_FREE_CONFORMANCE_FAILED";
  receipt_fingerprint: string;
}

export async function evaluateCodex01532CandidateCredentialFreeV01(input: {
  command: string;
  executable_identity_class:
    | "qualification_candidate_codex_0_153_2"
    | "test_emulated_candidate_0_153_2";
  state_parent: string;
  execution_root: string;
  augnes_source: {
    base_commit: string;
    head_commit: string;
    head_tree: string;
  };
  archive_observation: {
    size_bytes: number;
    digest: string;
    member_name: string;
    extracted_native_size_bytes: number;
  };
  external_call_accounting: {
    official_source_api_reads: number;
    binary_archive_acquisitions: number;
    other_network_calls: number;
  };
  base_environment?: {
    PATH?: string;
    LANG?: string;
    LC_ALL?: string;
    LC_CTYPE?: string;
    TZ?: string;
    TERM?: string;
    NO_COLOR?: string;
  };
  test_prefix_args?: string[];
  test_environment?: Record<string, string | undefined>;
  test_expected_executable_fingerprint?: string;
  observed_at?: string;
}): Promise<CodexOrdinaryRuntimeCandidateQualificationReceiptV01> {
  const reviewed = getCodexReviewedRuntimeArtifactV01({
    entry_id: CODEX_0_153_2_CANDIDATE_ENTRY_ID_V01,
  });
  const artifact = reviewed.artifact;
  const evidence = artifact.qualification_evidence;
  assertReviewedCodex01532CandidateIdentityV01(artifact);
  if (
    artifact.lanes.ordinary_chatgpt_auth.status !== "candidate" ||
    artifact.lanes.ordinary_chatgpt_auth.qualified_at !== null ||
    artifact.lanes.strict_agent_identity.status !== "hold" ||
    artifact.lanes.strict_agent_identity.qualified_at !== null ||
    evidence.kind !== "candidate_source_schema_review_v0_1" ||
    evidence.ordinary_deciding_receipt_fingerprint !== null ||
    evidence.source_schema_review.compatibility_profile_decision !==
      "reuse_supported_pending_authenticated_ordinary_canary"
  )
    throw new Error("codex_candidate_registry_state_invalid");
  assertExactCandidateInputV01(input, artifact, evidence.source_schema_review);

  const emulated =
    input.executable_identity_class === "test_emulated_candidate_0_153_2";
  let userAgentFingerprint: string | null = null;
  const probe = await probeCodexCredentialFreeExactProfileV01({
    command: input.command,
    expected_executable_fingerprint: emulated
      ? input.test_expected_executable_fingerprint ?? sha256FileV01(input.command)
      : artifact.native_executable_sha256,
    executable_identity_class: input.executable_identity_class,
    accepted_exact_identity: !emulated,
    expected_cli_version: artifact.version,
    config_override_args: CANDIDATE_CONFIG_OVERRIDE_ARGS_V01,
    run_cli_version_probe: !emulated,
    require_unauthenticated_account: true,
    allowed_notifications: [
      ...reviewed.compatibility_profile.semantics.notifications
        .bounded_observed_optional,
      ...reviewed.compatibility_profile.semantics.notifications.ignored_optional,
    ],
    observe_semantic_profile: ({ initialized, config }) => {
      const userAgent = observeReviewedCandidateCodexAppServerUserAgentV01({
        raw_user_agent: initialized.userAgent,
        expected_client_name: "augnes-semantic-preflight",
        expected_client_version: CODEX_APP_SERVER_ADAPTER_VERSION_V01,
        expected_codex_cli_version: artifact.version,
      });
      userAgentFingerprint = userAgent.fingerprint;
      return {
        observed_cli_version: userAgent.codex_cli_version,
        observed_security_policy_fingerprint:
          observeCandidateConfigPolicyV01(config),
      };
    },
    state_parent: input.state_parent,
    repository_root: input.execution_root,
    base_environment: input.base_environment,
    test_prefix_args: input.test_prefix_args,
    test_environment: input.test_environment,
    observed_at: input.observed_at,
  });

  const parentEmpty = readdirSync(realpathSync(input.state_parent)).length === 0;
  const conformancePassed =
    probe.state === "compatible_exact" &&
    probe.observed_cli_version === artifact.version &&
    probe.account_disposition === "unauthenticated_empty_state" &&
    userAgentFingerprint !== null &&
    probe.observed_policy_fingerprint !== null &&
    probe.cleanup_completed &&
    probe.process_settled &&
    parentEmpty &&
    input.external_call_accounting.other_network_calls === 0;
  const disposition: CodexOrdinaryRuntimeCandidateQualificationReceiptV01["disposition"] = !conformancePassed
    ? "HOLD_CREDENTIAL_FREE_CONFORMANCE_FAILED"
    : emulated
      ? "HOLD_TEST_EMULATED_NOT_EXACT"
      : CODEX_0_153_2_CANDIDATE_READY_DISPOSITION_V01;

  const material = {
    receipt_version:
      CODEX_0_153_2_CANDIDATE_QUALIFICATION_RECEIPT_VERSION_V01,
    augnes_source: input.augnes_source,
    registry_fingerprint: CODEX_QUALIFIED_RUNTIME_REGISTRY_FINGERPRINT_V01,
    compatibility_profile: {
      profile_id: reviewed.compatibility_profile.profile_id,
      fingerprint: reviewed.compatibility_profile.fingerprint,
      decision: "reuse_supported_pending_authenticated_ordinary_canary" as const,
    },
    candidate_identity: {
      entry_id: artifact.entry_id,
      version: artifact.version,
      release_tag: artifact.release_tag,
      tagged_source_commit: artifact.tagged_source_commit,
      release_id: artifact.official_release.release_id,
      asset_id: artifact.qualified_provenance_asset.asset_id,
      asset_name: artifact.qualified_provenance_asset.asset_name,
      archive_size_bytes: artifact.qualified_provenance_asset.size_bytes,
      archive_digest: artifact.qualified_provenance_asset.digest,
      archive_member_name:
        evidence.source_schema_review.candidate.archive_member_name,
      extracted_native_size_bytes:
        evidence.source_schema_review.candidate.extracted_native_size_bytes,
      native_executable_sha256: artifact.native_executable_sha256,
      platform: artifact.platform,
      architecture: artifact.architecture,
      upstream_target_triple: artifact.upstream_target_triple,
      cli_version: artifact.version,
    },
    source_schema_delta_fingerprint:
      evidence.source_schema_review.fingerprint,
    exercised_methods: [...probe.runtime_exercised_methods],
    observed_notifications: [...probe.observed_notifications],
    user_agent_observation_fingerprint: userAgentFingerprint,
    credential_free_account_disposition: probe.account_disposition,
    config_policy_fingerprint: probe.observed_policy_fingerprint,
    observations: {
      sandbox_authority_expansions: 0 as const,
      approval_requests: 0 as const,
      tool_calls: 0 as const,
      command_calls: 0 as const,
      repository_task_calls: 0 as const,
      repository_writes: 0 as const,
      external_effects: 0 as const,
      provider_model_calls: 0 as const,
      keychain_accesses: 0 as const,
      agent_identity_attempts: 0 as const,
      other_network_calls: input.external_call_accounting.other_network_calls,
      official_source_api_reads:
        input.external_call_accounting.official_source_api_reads,
      binary_archive_acquisitions:
        input.external_call_accounting.binary_archive_acquisitions,
    },
    process_settlement: {
      natural_shutdown_requested: true as const,
      streams_closed: probe.process_settled,
      remaining_owned_processes: probe.process_settled ? 0 : 1,
      disposable_state_removed: probe.cleanup_completed && parentEmpty,
    },
    emulated_input: emulated,
    disposition,
  };
  return Object.freeze({
    ...material,
    receipt_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(material),
    ),
  });
}

export function validateCodex01532CandidateQualificationReceiptV01(
  input: unknown,
): CodexOrdinaryRuntimeCandidateQualificationReceiptV01 {
  const receipt = JSON.parse(JSON.stringify(input)) as Record<string, unknown>;
  const expectedKeys = [
    "receipt_version",
    "augnes_source",
    "registry_fingerprint",
    "compatibility_profile",
    "candidate_identity",
    "source_schema_delta_fingerprint",
    "exercised_methods",
    "observed_notifications",
    "user_agent_observation_fingerprint",
    "credential_free_account_disposition",
    "config_policy_fingerprint",
    "observations",
    "process_settlement",
    "emulated_input",
    "disposition",
    "receipt_fingerprint",
  ].sort();
  if (
    !recordV01(receipt) ||
    canonicalizeProtocolValueV01(Object.keys(receipt).sort()) !==
      canonicalizeProtocolValueV01(expectedKeys) ||
    receipt.receipt_version !==
      CODEX_0_153_2_CANDIDATE_QUALIFICATION_RECEIPT_VERSION_V01 ||
    typeof receipt.receipt_fingerprint !== "string" ||
    !/^sha256:[a-f0-9]{64}$/u.test(receipt.receipt_fingerprint)
  )
    throw new Error("codex_candidate_receipt_invalid");
  const { receipt_fingerprint: fingerprint, ...material } = receipt;
  if (
    createProtocolSha256V01(canonicalizeProtocolValueV01(material)) !==
    fingerprint
  )
    throw new Error("codex_candidate_receipt_fingerprint_mismatch");
  const identity = recordV01(receipt.candidate_identity);
  const augnesSource = recordV01(receipt.augnes_source);
  const compatibilityProfile = recordV01(receipt.compatibility_profile);
  const observations = recordV01(receipt.observations);
  const settlement = recordV01(receipt.process_settlement);
  const exactMethodSequence = [
    "initialize",
    "initialized",
    "account/read",
    "config/read",
  ];
  const observedMethods = Array.isArray(receipt.exercised_methods)
    ? receipt.exercised_methods
    : [];
  const observedNotifications = Array.isArray(receipt.observed_notifications)
    ? receipt.observed_notifications
    : [];
  const reviewed = getCodexReviewedRuntimeArtifactV01({
    entry_id: CODEX_0_153_2_CANDIDATE_ENTRY_ID_V01,
  });
  const allowedNotifications = new Set([
    ...reviewed.compatibility_profile.semantics.notifications
      .bounded_observed_optional,
    ...reviewed.compatibility_profile.semantics.notifications.ignored_optional,
  ]);
  if (
    !identity ||
    !augnesSource ||
    !compatibilityProfile ||
    !observations ||
    !settlement ||
    !hasExactKeysV01(augnesSource, [
      "base_commit",
      "head_commit",
      "head_tree",
    ]) ||
    !hasExactKeysV01(compatibilityProfile, [
      "profile_id",
      "fingerprint",
      "decision",
    ]) ||
    !hasExactKeysV01(identity, [
      "entry_id",
      "version",
      "release_tag",
      "tagged_source_commit",
      "release_id",
      "asset_id",
      "asset_name",
      "archive_size_bytes",
      "archive_digest",
      "archive_member_name",
      "extracted_native_size_bytes",
      "native_executable_sha256",
      "platform",
      "architecture",
      "upstream_target_triple",
      "cli_version",
    ]) ||
    !hasExactKeysV01(observations, [
      "sandbox_authority_expansions",
      "approval_requests",
      "tool_calls",
      "command_calls",
      "repository_task_calls",
      "repository_writes",
      "external_effects",
      "provider_model_calls",
      "keychain_accesses",
      "agent_identity_attempts",
      "other_network_calls",
      "official_source_api_reads",
      "binary_archive_acquisitions",
    ]) ||
    !hasExactKeysV01(settlement, [
      "natural_shutdown_requested",
      "streams_closed",
      "remaining_owned_processes",
      "disposable_state_removed",
    ]) ||
    typeof augnesSource.base_commit !== "string" ||
    !/^[a-f0-9]{40}$/u.test(augnesSource.base_commit) ||
    typeof augnesSource.head_commit !== "string" ||
    !/^[a-f0-9]{40}$/u.test(augnesSource.head_commit) ||
    typeof augnesSource.head_tree !== "string" ||
    !/^[a-f0-9]{40}$/u.test(augnesSource.head_tree) ||
    receipt.registry_fingerprint !==
      CODEX_QUALIFIED_RUNTIME_REGISTRY_FINGERPRINT_V01 ||
    compatibilityProfile.profile_id !==
      "codex_app_server_augnes_operator.v0.1" ||
    compatibilityProfile.fingerprint !==
      "sha256:a4cfb0e38fd6a2af0d29a467c2c5db2579cdc784e93a820f3482fa2c8a1d663a" ||
    compatibilityProfile.decision !==
      "reuse_supported_pending_authenticated_ordinary_canary" ||
    identity.entry_id !== CODEX_0_153_2_CANDIDATE_ENTRY_ID_V01 ||
    identity.version !== "0.153.2" ||
    identity.release_tag !== "rust-v0.153.2" ||
    identity.tagged_source_commit !==
      "657a993cbee87acf52d14b758ce49dbd46d1b8eb" ||
    identity.release_id !== 382394608 ||
    identity.asset_id !== 543503024 ||
    identity.asset_name !== "codex-aarch64-apple-darwin.tar.gz" ||
    identity.archive_size_bytes !== 87_314_265 ||
    identity.archive_digest !==
      "sha256:91dfc270f0dfbaec16d814f1aa90d4f27e74dc9e3784e64006bef3b79fe9e09c" ||
    identity.archive_member_name !== "codex-aarch64-apple-darwin" ||
    identity.extracted_native_size_bytes !== 220_551_344 ||
    identity.native_executable_sha256 !==
      "sha256:195ace4100a634a9df39147f493e730e666b5bd87795f3c9f3251d8542400424" ||
    identity.platform !== "darwin" ||
    identity.architecture !== "arm64" ||
    identity.upstream_target_triple !== "aarch64-apple-darwin" ||
    identity.cli_version !== "0.153.2" ||
    receipt.source_schema_delta_fingerprint !==
      "sha256:09edf14c59a5e294254c418966336f77e27e2961caadedcd6096501cc86ccaac" ||
    observedMethods.length > exactMethodSequence.length ||
    observedMethods.some(
      (method, index) => method !== exactMethodSequence[index],
    ) ||
    observedNotifications.some(
      (method) =>
        typeof method !== "string" || !allowedNotifications.has(method),
    ) ||
    observations.sandbox_authority_expansions !== 0 ||
    observations.approval_requests !== 0 ||
    observations.tool_calls !== 0 ||
    observations.command_calls !== 0 ||
    observations.repository_task_calls !== 0 ||
    observations.repository_writes !== 0 ||
    observations.external_effects !== 0 ||
    observations.provider_model_calls !== 0 ||
    observations.keychain_accesses !== 0 ||
    observations.agent_identity_attempts !== 0 ||
    !Number.isSafeInteger(observations.other_network_calls) ||
    (observations.other_network_calls as number) < 0 ||
    !Number.isSafeInteger(observations.official_source_api_reads) ||
    (observations.official_source_api_reads as number) < 0 ||
    !Number.isSafeInteger(observations.binary_archive_acquisitions) ||
    (observations.binary_archive_acquisitions as number) < 0 ||
    settlement.natural_shutdown_requested !== true ||
    typeof settlement.streams_closed !== "boolean" ||
    !Number.isSafeInteger(settlement.remaining_owned_processes) ||
    (settlement.remaining_owned_processes as number) < 0 ||
    typeof settlement.disposable_state_removed !== "boolean" ||
    receipt.disposition === "QUALIFIED" ||
    receipt.disposition === "QUALIFIED_EXACT" ||
    ![
      CODEX_0_153_2_CANDIDATE_READY_DISPOSITION_V01,
      "HOLD_TEST_EMULATED_NOT_EXACT",
      "HOLD_CREDENTIAL_FREE_CONFORMANCE_FAILED",
    ].includes(receipt.disposition as string) ||
    (receipt.disposition === CODEX_0_153_2_CANDIDATE_READY_DISPOSITION_V01 &&
      (receipt.emulated_input !== false ||
        augnesSource.base_commit !==
          "8163fda3d5e63676138e1923f3b9c0e57d9b1e12" ||
        canonicalizeProtocolValueV01(observedMethods) !==
          canonicalizeProtocolValueV01(exactMethodSequence) ||
        typeof receipt.user_agent_observation_fingerprint !== "string" ||
        !/^sha256:[a-f0-9]{64}$/u.test(
          receipt.user_agent_observation_fingerprint,
        ) ||
        receipt.credential_free_account_disposition !==
          "unauthenticated_empty_state" ||
        typeof receipt.config_policy_fingerprint !== "string" ||
        !/^sha256:[a-f0-9]{64}$/u.test(receipt.config_policy_fingerprint) ||
        observations.provider_model_calls !== 0 ||
        observations.keychain_accesses !== 0 ||
        observations.agent_identity_attempts !== 0 ||
        observations.repository_task_calls !== 0 ||
        observations.repository_writes !== 0 ||
        observations.external_effects !== 0 ||
        observations.other_network_calls !== 0 ||
        observations.binary_archive_acquisitions !== 1 ||
        !Number.isSafeInteger(observations.official_source_api_reads) ||
        (observations.official_source_api_reads as number) < 1 ||
        settlement.streams_closed !== true ||
        settlement.remaining_owned_processes !== 0 ||
        settlement.disposable_state_removed !== true)) ||
    (receipt.emulated_input === true &&
      receipt.disposition === CODEX_0_153_2_CANDIDATE_READY_DISPOSITION_V01)
  )
    throw new Error("codex_candidate_receipt_semantics_invalid");
  const canonical = canonicalizeProtocolValueV01(receipt);
  for (const forbidden of [
    "access_token",
    "refresh_token",
    "auth.json",
    "BEGIN PRIVATE KEY",
    "response_body",
    "/Users/",
    "/private/var/",
  ])
    if (canonical.includes(forbidden))
      throw new Error("codex_candidate_receipt_private_material_forbidden");
  return Object.freeze(
    receipt as unknown as CodexOrdinaryRuntimeCandidateQualificationReceiptV01,
  );
}

function assertReviewedCodex01532CandidateIdentityV01(
  artifact: ReturnType<typeof getCodexReviewedRuntimeArtifactV01>["artifact"],
): void {
  const evidence = artifact.qualification_evidence;
  if (
    artifact.entry_id !== CODEX_0_153_2_CANDIDATE_ENTRY_ID_V01 ||
    artifact.version !== "0.153.2" ||
    artifact.release_tag !== "rust-v0.153.2" ||
    artifact.tagged_source_commit !==
      "657a993cbee87acf52d14b758ce49dbd46d1b8eb" ||
    artifact.platform !== "darwin" ||
    artifact.architecture !== "arm64" ||
    artifact.upstream_target_triple !== "aarch64-apple-darwin" ||
    artifact.official_release.repository !== "openai/codex" ||
    artifact.official_release.release_id !== 382394608 ||
    artifact.official_release.url !==
      "https://github.com/openai/codex/releases/tag/rust-v0.153.2" ||
    artifact.qualified_provenance_asset.acquisition_route !==
      "standalone_release_tarball" ||
    artifact.qualified_provenance_asset.asset_id !== 543503024 ||
    artifact.qualified_provenance_asset.asset_name !==
      "codex-aarch64-apple-darwin.tar.gz" ||
    artifact.qualified_provenance_asset.size_bytes !== 87_314_265 ||
    artifact.qualified_provenance_asset.digest !==
      "sha256:91dfc270f0dfbaec16d814f1aa90d4f27e74dc9e3784e64006bef3b79fe9e09c" ||
    artifact.native_executable_sha256 !==
      "sha256:195ace4100a634a9df39147f493e730e666b5bd87795f3c9f3251d8542400424" ||
    artifact.compatibility_profile_id !==
      "codex_app_server_augnes_operator.v0.1" ||
    artifact.compatibility_profile_fingerprint !==
      "sha256:a4cfb0e38fd6a2af0d29a467c2c5db2579cdc784e93a820f3482fa2c8a1d663a" ||
    artifact.admitted_discovery_launch_shapes.length !== 1 ||
    artifact.admitted_discovery_launch_shapes[0]?.shape !== "direct_native" ||
    artifact.unsupported_acquisition_routes.length !== 1 ||
    artifact.unsupported_acquisition_routes[0]?.route !==
      "codex_package_archive" ||
    artifact.unsupported_acquisition_routes[0]?.example_asset_name !==
      "codex-package-aarch64-apple-darwin.tar.gz" ||
    evidence.kind !== "candidate_source_schema_review_v0_1" ||
    evidence.source_schema_review.baseline.release_tag !== "rust-v0.152.1" ||
    evidence.source_schema_review.baseline.tagged_source_commit !==
      "5adb68a49933ae446bf11935662c83dba55a0804" ||
    evidence.source_schema_review.baseline.source_tree !==
      "3e643e5ef6195a3881be9f8d6b394019786155ee" ||
    evidence.source_schema_review.candidate.release_tag !== "rust-v0.153.2" ||
    evidence.source_schema_review.candidate.tagged_source_commit !==
      "657a993cbee87acf52d14b758ce49dbd46d1b8eb" ||
    evidence.source_schema_review.candidate.source_tree !==
      "8b5502927b418f0e6476f01aa331b687b27d798f" ||
    evidence.source_schema_review.candidate.release_published_at !==
      "2026-09-03T23:53:12Z" ||
    evidence.source_schema_review.candidate.archive_member_name !==
      "codex-aarch64-apple-darwin" ||
    evidence.source_schema_review.candidate.extracted_native_size_bytes !==
      220_551_344 ||
    evidence.source_schema_review.candidate.executable_format !==
      "Mach-O 64-bit arm64" ||
    evidence.source_schema_review.fingerprint !==
      "sha256:09edf14c59a5e294254c418966336f77e27e2961caadedcd6096501cc86ccaac"
  )
    throw new Error("codex_candidate_reviewed_identity_mismatch");
}

/** Test-only mutation probe; production callers cannot inject a registry. */
export function assertCodex01532CandidateReviewedIdentityForTestV01(
  registry: unknown,
): void {
  if (process.env.AUGNES_CODEX_ORDINARY_CANDIDATE_TEST_MODE !== "1")
    throw new Error("codex_candidate_test_override_refused");
  assertReviewedCodex01532CandidateIdentityV01(
    getCodexReviewedRuntimeArtifactV01({
      entry_id: CODEX_0_153_2_CANDIDATE_ENTRY_ID_V01,
      registry,
    }).artifact,
  );
}

function assertExactCandidateInputV01(
  input: Parameters<typeof evaluateCodex01532CandidateCredentialFreeV01>[0],
  artifact: ReturnType<typeof getCodexReviewedRuntimeArtifactV01>["artifact"],
  review: Extract<
    ReturnType<typeof getCodexReviewedRuntimeArtifactV01>["artifact"]["qualification_evidence"],
    { kind: "candidate_source_schema_review_v0_1" }
  >["source_schema_review"],
): void {
  for (const value of [
    input.augnes_source.base_commit,
    input.augnes_source.head_commit,
    input.augnes_source.head_tree,
  ])
    if (!/^[a-f0-9]{40}$/u.test(value))
      throw new Error("codex_candidate_augnes_source_identity_invalid");
  if (
    input.archive_observation.size_bytes !==
      artifact.qualified_provenance_asset.size_bytes ||
    input.archive_observation.digest !==
      artifact.qualified_provenance_asset.digest ||
    input.archive_observation.member_name !==
      review.candidate.archive_member_name ||
    input.archive_observation.extracted_native_size_bytes !==
      review.candidate.extracted_native_size_bytes ||
    input.external_call_accounting.official_source_api_reads < 0 ||
    input.external_call_accounting.binary_archive_acquisitions < 0 ||
    input.external_call_accounting.other_network_calls < 0 ||
    !Number.isSafeInteger(input.external_call_accounting.official_source_api_reads) ||
    !Number.isSafeInteger(input.external_call_accounting.binary_archive_acquisitions) ||
    !Number.isSafeInteger(input.external_call_accounting.other_network_calls)
  )
    throw new Error("codex_candidate_exact_identity_invalid");
  if (
    input.executable_identity_class ===
      "qualification_candidate_codex_0_153_2" &&
    (input.augnes_source.base_commit !==
      "8163fda3d5e63676138e1923f3b9c0e57d9b1e12" ||
      input.external_call_accounting.binary_archive_acquisitions !== 1 ||
      lstatSync(realpathSync(input.command)).size !==
        review.candidate.extracted_native_size_bytes)
  )
    throw new Error("codex_candidate_acquisition_accounting_invalid");
}

export function observeCandidateConfigPolicyV01(value: Record<string, unknown>): string {
  const config = recordV01(value.config);
  const features = recordV01(config?.features);
  const shell = recordV01(config?.shell_environment_policy);
  const orchestrator = recordV01(config?.orchestrator);
  const otel = recordV01(config?.otel);
  if (
    !config ||
    !features ||
    !shell ||
    !orchestrator ||
    !otel ||
    config.forced_login_method !== "chatgpt" ||
    config.cli_auth_credentials_store !== "file" ||
    config.model_provider !== "openai" ||
    config.web_search !== "disabled" ||
    config.check_for_update_on_startup !== false ||
    config.allow_login_shell !== false ||
    config.project_doc_max_bytes !== 0 ||
    !Array.isArray(config.project_doc_fallback_filenames) ||
    config.project_doc_fallback_filenames.length !== 0 ||
    shell.inherit !== "core" ||
    shell.ignore_default_excludes !== false ||
    !emptyRecordV01(config.mcp_servers) ||
    !emptyRecordV01(config.plugins) ||
    !emptyRecordV01(config.skills) ||
    hasActiveLeafV01(config.apps) ||
    recordV01(orchestrator.skills)?.enabled !== false ||
    recordV01(orchestrator.mcp)?.enabled !== false ||
    otel.exporter !== "none" ||
    otel.trace_exporter !== "none" ||
    otel.metrics_exporter !== "none" ||
    REQUIRED_DISABLED_FEATURES_V01.some((key) => features[key] !== false)
  )
    throw new Error("codex_candidate_config_policy_mismatch");
  return createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      policy_version: "codex_0_153_2_candidate_credential_free.v0.1",
      config_override_args: CANDIDATE_CONFIG_OVERRIDE_ARGS_V01,
      required_disabled_features: REQUIRED_DISABLED_FEATURES_V01,
      observed: {
        forced_login_method: config.forced_login_method,
        cli_auth_credentials_store: config.cli_auth_credentials_store,
        model_provider: config.model_provider,
        web_search: config.web_search,
        check_for_update_on_startup: config.check_for_update_on_startup,
        feature_keys: Object.keys(features).sort(),
        otel_exporters: [
          otel.exporter,
          otel.trace_exporter,
          otel.metrics_exporter,
        ],
      },
    }),
  );
}

function recordV01(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function hasExactKeysV01(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  return (
    canonicalizeProtocolValueV01(Object.keys(value).sort()) ===
    canonicalizeProtocolValueV01([...keys].sort())
  );
}

function emptyRecordV01(value: unknown): boolean {
  const record = recordV01(value);
  return record !== null && Object.keys(record).length === 0;
}

function hasActiveLeafV01(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(hasActiveLeafV01);
  const record = recordV01(value);
  if (record) return Object.values(record).some(hasActiveLeafV01);
  return value !== null && value !== undefined && value !== false;
}

function sha256FileV01(value: string): string {
  const canonical = realpathSync(value);
  const stat = lstatSync(canonical);
  if (!stat.isFile() || stat.isSymbolicLink() || path.resolve(canonical) !== canonical)
    throw new Error("codex_candidate_executable_invalid");
  return `sha256:${createHash("sha256")
    .update(readFileSync(canonical))
    .digest("hex")}`;
}
