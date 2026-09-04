import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  statSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";

import { ensurePinnedCodexManagedRuntimeForTestV01 } from "@/lib/vnext/native-host/codex-managed-runtime-store";
import {
  CODEX_0_153_2_ORDINARY_CANARY_CAPABILITY_VERSION_V01,
  CODEX_0_153_2_ORDINARY_CANARY_TOKEN_V01,
  CodexOrdinaryAuthenticatedCandidateErrorV01,
  assertCodex01532CandidateCapabilitySourceV01,
  codex01532CandidateCapabilityConsumedV01,
  consumeCodex01532OrdinaryAuthenticatedCandidateCapabilityV01,
  createCodex01532OrdinaryAuthenticatedCanaryReceiptV01,
  createCodex01532OrdinaryAuthenticatedCandidateCapabilityForTestV01,
  inspectCodex01532OrdinaryAuthenticatedCandidateCapabilityV01,
  codex01532OrdinaryCanaryConfigOverrideArgsForDiagnosticV01,
  validateCodex01532OrdinaryAuthenticatedCanaryReceiptV01,
  type CodexOrdinaryAuthenticatedCandidateCapabilityV01,
} from "@/lib/vnext/native-host/codex-ordinary-authenticated-candidate";
import { createCodexAppServerAdapterV01 } from "@/lib/vnext/native-host/codex-app-server-adapter";
import {
  CODEX_0_153_2_CANDIDATE_ENTRY_ID_V01,
  assertCodex01532CandidateReviewedIdentityForTestV01,
  evaluateCodex01532CandidateCredentialFreeV01,
  validateCodex01532CandidateQualificationReceiptV01,
} from "@/lib/vnext/native-host/codex-ordinary-runtime-candidate";
import {
  CODEX_0_153_2_INITIALIZE_DIAGNOSTIC_TIMEOUT_MS_V01,
  runCodex01532InitializeDiagnosticSequenceV01,
  runCodex01532InitializeOnlyProbeV01,
  type Codex01532InitializeDiagnosticProbeLabelV01,
  type Codex01532InitializeDiagnosticProbeResultV01,
} from "@/lib/vnext/native-host/codex-ordinary-initialize-diagnostic";
import {
  CODEX_QUALIFIED_RUNTIME_REGISTRY_V01,
  CodexQualifiedRuntimeRegistryErrorV01,
  codexRuntimeCandidateSourceSchemaReviewFingerprintV01,
  codexRuntimeCompatibilityProfileFingerprintV01,
  getCodexReviewedRuntimeArtifactV01,
  selectCodexQualifiedRuntimeEntryV01,
  selectPinnedCodexQualifiedRuntimeV01,
  validateCodexQualifiedRuntimeRegistryV01,
} from "@/lib/vnext/native-host/codex-qualified-runtime-registry";
import { genericCliBuilderInputFixture } from "@/fixtures/vnext/protocol/task-context-packet-v0-1";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import { buildTaskContextPacketV01 } from "@/lib/vnext/task-context-packet";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import type {
  NativeHostInvocationV01,
  NativeHostRequestV01,
  NativeHostResultV01,
} from "@/types/vnext/native-host-adapter";

const previousCandidateTestMode =
  process.env.AUGNES_CODEX_ORDINARY_CANDIDATE_TEST_MODE;
const previousProductionTestMode =
  process.env.AUGNES_CODEX_PRODUCTION_RUNTIME_TEST_MODE;
const previousAuthenticatedCandidateTestMode =
  process.env.AUGNES_CODEX_ORDINARY_AUTHENTICATED_CANDIDATE_TEST_MODE;
const previousInitializeDiagnosticTestMode =
  process.env.AUGNES_CODEX_INITIALIZE_DIAGNOSTIC_TEST_MODE;
process.env.AUGNES_CODEX_ORDINARY_CANDIDATE_TEST_MODE = "1";
process.env.AUGNES_CODEX_PRODUCTION_RUNTIME_TEST_MODE = "1";
process.env.AUGNES_CODEX_ORDINARY_AUTHENTICATED_CANDIDATE_TEST_MODE = "1";
process.env.AUGNES_CODEX_INITIALIZE_DIAGNOSTIC_TEST_MODE = "1";

const root = realpathSync.native(
  mkdtempSync(path.join(os.tmpdir(), "augnes-codex-candidate-test-")),
);
chmodSync(root, 0o700);

async function mainV01(): Promise<void> {
  let report: Record<string, unknown> | null = null;
  try {
    exactCandidateMetadataV01();
    exactIdentityMutationsFailClosedV01();
    evidenceAndLaneConflictsFailClosedV01();
    await candidateNeverBecomesProductionAuthorityV01();
    await emulatedCredentialFreeConformanceRemainsHoldV01();
    await authenticatedCandidateCapabilityAndLifecycleV01();
    await initializeOnlyDiagnosticContractV01();
    report = {
      status: "passed",
      contract: "codex_ordinary_runtime_candidate_qualification.v0.1",
      candidate_entry_id: CODEX_0_153_2_CANDIDATE_ENTRY_ID_V01,
      ordinary_lane: "candidate",
      strict_lane: "hold",
      production_selected_version: "0.152.1",
      emulated_exact_evidence_available: false,
      directly_observed: {
        fixture_external_network_attempts: 0,
        disposable_roots_removed: true,
      },
      contract_bounded: {
        real_provider_model_routes_enabled: false,
        augnes_direct_credential_store_accesses: 0,
        agent_identity_routes_enabled: false,
        repository_task_routes_enabled: false,
        repository_write_routes_enabled: false,
        owned_processes_settled: true,
        initialize_diagnostic_post_initialize_requests: 0,
      },
      not_observed: {
        os_keychain_access_count: "not_observed",
        os_network_destination_count: "not_observed",
      },
    };
  } finally {
    makeWritableV01(root);
    rmSync(root, { recursive: true, force: false });
    assert.equal(existsSync(root), false);
    restoreEnvironmentV01(
      "AUGNES_CODEX_ORDINARY_CANDIDATE_TEST_MODE",
      previousCandidateTestMode,
    );
    restoreEnvironmentV01(
      "AUGNES_CODEX_PRODUCTION_RUNTIME_TEST_MODE",
      previousProductionTestMode,
    );
    restoreEnvironmentV01(
      "AUGNES_CODEX_ORDINARY_AUTHENTICATED_CANDIDATE_TEST_MODE",
      previousAuthenticatedCandidateTestMode,
    );
    restoreEnvironmentV01(
      "AUGNES_CODEX_INITIALIZE_DIAGNOSTIC_TEST_MODE",
      previousInitializeDiagnosticTestMode,
    );
  }
  console.log(JSON.stringify(report));
}

function exactCandidateMetadataV01(): void {
  const registry = CODEX_QUALIFIED_RUNTIME_REGISTRY_V01;
  assert.equal(registry.artifacts.length, 2);
  const production = registry.artifacts.find(
    ({ entry_id }) => entry_id === "codex-rust-v0.152.1-darwin-arm64",
  )!;
  const candidate = registry.artifacts.find(
    ({ entry_id }) => entry_id === CODEX_0_153_2_CANDIDATE_ENTRY_ID_V01,
  )!;
  assert.equal(registry.production_selection.entry_id, production.entry_id);
  assert.equal(production.version, "0.152.1");
  assert.equal(candidate.version, "0.153.2");
  assert.equal(candidate.release_tag, "rust-v0.153.2");
  assert.equal(
    candidate.tagged_source_commit,
    "657a993cbee87acf52d14b758ce49dbd46d1b8eb",
  );
  assert.deepEqual(candidate.official_release, {
    repository: "openai/codex",
    release_id: 382394608,
    url: "https://github.com/openai/codex/releases/tag/rust-v0.153.2",
  });
  assert.deepEqual(candidate.qualified_provenance_asset, {
    acquisition_route: "standalone_release_tarball",
    asset_id: 543503024,
    asset_name: "codex-aarch64-apple-darwin.tar.gz",
    size_bytes: 87_314_265,
    digest:
      "sha256:91dfc270f0dfbaec16d814f1aa90d4f27e74dc9e3784e64006bef3b79fe9e09c",
    digest_mechanism: "official_github_release_asset_digest_sha256",
  });
  assert.equal(
    candidate.native_executable_sha256,
    "sha256:195ace4100a634a9df39147f493e730e666b5bd87795f3c9f3251d8542400424",
  );
  assert.equal(candidate.platform, "darwin");
  assert.equal(candidate.architecture, "arm64");
  assert.equal(candidate.upstream_target_triple, "aarch64-apple-darwin");
  assert.deepEqual(
    candidate.admitted_discovery_launch_shapes.map(({ shape }) => shape),
    ["direct_native"],
  );
  assert.equal(
    candidate.unsupported_acquisition_routes[0]?.example_asset_name,
    "codex-package-aarch64-apple-darwin.tar.gz",
  );
  assert.equal(candidate.lanes.ordinary_chatgpt_auth.status, "candidate");
  assert.equal(candidate.lanes.ordinary_chatgpt_auth.qualified_at, null);
  assert.equal(candidate.lanes.strict_agent_identity.status, "hold");
  assert.equal(candidate.lanes.strict_agent_identity.qualified_at, null);
  assert.equal(
    candidate.lanes.strict_agent_identity.reason,
    "not_evaluated_no_documented_restart_trigger",
  );
  assert.equal(
    candidate.qualification_evidence.kind,
    "candidate_source_schema_review_v0_1",
  );
  if (
    candidate.qualification_evidence.kind !==
    "candidate_source_schema_review_v0_1"
  )
    assert.fail("candidate evidence kind mismatch");
  assert.equal(
    candidate.qualification_evidence.ordinary_deciding_receipt_fingerprint,
    null,
  );
  assert.equal(
    candidate.qualification_evidence.source_schema_review.fingerprint,
    "sha256:09edf14c59a5e294254c418966336f77e27e2961caadedcd6096501cc86ccaac",
  );
  assert.equal(
    candidate.qualification_evidence.source_schema_review
      .compatibility_profile_decision,
    "reuse_supported_pending_authenticated_ordinary_canary",
  );
  assert.equal(
    candidate.qualification_evidence.source_schema_review.deltas.some(
      ({ classification }) =>
        classification === "changed_profile_required" ||
        classification === "incompatible_or_unresolved",
    ),
    false,
  );
  assert.equal(
    candidate.compatibility_profile_fingerprint,
    "sha256:a4cfb0e38fd6a2af0d29a467c2c5db2579cdc784e93a820f3482fa2c8a1d663a",
  );
  assertCodex01532CandidateReviewedIdentityForTestV01(registry);
}

function exactIdentityMutationsFailClosedV01(): void {
  const mutations: Array<(registry: MutableRegistryV01) => void> = [
    (registry) => {
      candidateV01(registry).version = "0.153.3";
      candidateV01(registry).release_tag = "rust-v0.153.3";
      candidateV01(registry).official_release.url =
        "https://github.com/openai/codex/releases/tag/rust-v0.153.3";
    },
    (registry) => {
      candidateV01(registry).tagged_source_commit = "0".repeat(40);
    },
    (registry) => {
      candidateV01(registry).official_release.release_id += 1;
    },
    (registry) => {
      candidateV01(registry).qualified_provenance_asset.asset_id += 1;
    },
    (registry) => {
      candidateV01(registry).qualified_provenance_asset.size_bytes += 1;
    },
    (registry) => {
      candidateV01(registry).qualified_provenance_asset.digest =
        `sha256:${"0".repeat(64)}`;
    },
    (registry) => {
      candidateV01(registry).native_executable_sha256 =
        `sha256:${"1".repeat(64)}`;
    },
    (registry) => {
      const candidate = candidateV01(registry);
      candidate.platform = "linux";
      candidate.architecture = "x64";
      candidate.upstream_target_triple = "x86_64-unknown-linux-gnu";
      candidate.qualified_provenance_asset.asset_name =
        "codex-x86_64-unknown-linux-gnu.tar.gz";
    },
    (registry) => {
      const review = sourceReviewV01(registry);
      review.candidate.archive_member_name = "codex-other-member";
      recomputeSourceReviewFingerprintV01(review);
    },
    (registry) => {
      const review = sourceReviewV01(registry);
      review.candidate.extracted_native_size_bytes += 1;
      recomputeSourceReviewFingerprintV01(review);
    },
    (registry) => {
      const review = sourceReviewV01(registry);
      review.candidate.executable_format = "ELF 64-bit arm64";
      recomputeSourceReviewFingerprintV01(review);
    },
    (registry) => {
      const candidate = candidateV01(registry);
      candidate.version = "0.153.1";
      candidate.release_tag = "rust-v0.153.1";
      candidate.official_release.url =
        "https://github.com/openai/codex/releases/tag/rust-v0.153.1";
    },
  ];
  for (const mutate of mutations) {
    const registry = mutableRegistryV01();
    mutate(registry);
    assert.throws(
      () => assertCodex01532CandidateReviewedIdentityForTestV01(registry),
      /codex_candidate_reviewed_identity_mismatch/u,
    );
  }

  const profileDrift = mutableRegistryV01();
  const profile = profileDrift.compatibility_profiles[0]!;
  profile.semantics.notifications.ignored_optional.push("future/notification");
  profile.fingerprint = codexRuntimeCompatibilityProfileFingerprintV01({
    profile_id: profile.profile_id,
    profile_schema_version: profile.profile_schema_version,
    semantics: profile.semantics,
  });
  for (const artifact of profileDrift.artifacts)
    artifact.compatibility_profile_fingerprint = profile.fingerprint;
  assert.throws(
    () => assertCodex01532CandidateReviewedIdentityForTestV01(profileDrift),
    /codex_candidate_reviewed_identity_mismatch/u,
  );
  const incompatibleReuse = mutableRegistryV01();
  const sourceReview = sourceReviewV01(incompatibleReuse);
  sourceReview.deltas[0].classification = "incompatible_or_unresolved";
  recomputeSourceReviewFingerprintV01(sourceReview);
  assert.throws(
    () => validateCodexQualifiedRuntimeRegistryV01(incompatibleReuse),
    (error: unknown) =>
      error instanceof CodexQualifiedRuntimeRegistryErrorV01 &&
      error.code === "codex_qualified_runtime_registry_source_review_conflict",
  );
  assert.throws(
    () =>
      selectCodexQualifiedRuntimeEntryV01({
        entry_id: CODEX_0_153_2_CANDIDATE_ENTRY_ID_V01,
        lane: "ordinary_chatgpt_auth",
        selection_mode: "latest_qualified",
      }),
    (error: unknown) =>
      error instanceof CodexQualifiedRuntimeRegistryErrorV01 &&
      error.code === "codex_qualified_runtime_registry_lane_not_qualified",
  );
}

function evidenceAndLaneConflictsFailClosedV01(): void {
  const conflictCases: Array<(registry: MutableRegistryV01) => void> = [
    (registry) => {
      candidateV01(registry).lanes.ordinary_chatgpt_auth.status = "qualified";
      candidateV01(registry).lanes.ordinary_chatgpt_auth.qualified_at =
        "2026-09-04T00:00:00Z";
    },
    (registry) => {
      candidateV01(
        registry,
      ).qualification_evidence.ordinary_deciding_receipt_fingerprint =
        "0".repeat(64);
    },
    (registry) => {
      candidateV01(registry).lanes.ordinary_chatgpt_auth.qualified_at =
        "2026-09-04T00:00:00Z";
    },
  ];
  for (const mutate of conflictCases) {
    const registry = mutableRegistryV01();
    mutate(registry);
    assert.throws(
      () => validateCodexQualifiedRuntimeRegistryV01(registry),
      (error: unknown) =>
        error instanceof CodexQualifiedRuntimeRegistryErrorV01,
    );
  }
  const selected = selectPinnedCodexQualifiedRuntimeV01({
    lane: "ordinary_chatgpt_auth",
  });
  assert.equal(selected.artifact.version, "0.152.1");
  assert.throws(
    () =>
      selectPinnedCodexQualifiedRuntimeV01({
        lane: "strict_agent_identity",
      }),
    (error: unknown) =>
      error instanceof CodexQualifiedRuntimeRegistryErrorV01 &&
      error.code === "codex_qualified_runtime_registry_lane_not_qualified",
  );
}

async function candidateNeverBecomesProductionAuthorityV01(): Promise<void> {
  const registry = mutableRegistryV01();
  registry.production_selection.entry_id = CODEX_0_153_2_CANDIDATE_ENTRY_ID_V01;
  let downloaderCalls = 0;
  await assert.rejects(
    () =>
      ensurePinnedCodexManagedRuntimeForTestV01({
        root: path.join(root, "must-not-exist-managed-root"),
        dependencies: {
          registry,
          platform: "darwin",
          architecture: "arm64",
          inspect_native: () => true,
          read_cli_version: () => "0.153.2",
        },
        download_reviewed_archive: async () => {
          downloaderCalls += 1;
          return Buffer.alloc(0);
        },
      }),
    (error: unknown) =>
      error instanceof CodexQualifiedRuntimeRegistryErrorV01 &&
      error.code === "codex_qualified_runtime_registry_lane_not_qualified",
  );
  assert.equal(downloaderCalls, 0);
  assert.equal(
    existsSync(path.join(root, "must-not-exist-managed-root")),
    false,
  );

  const semverOnly = mutableRegistryV01();
  const candidate = candidateV01(semverOnly);
  candidate.version = "9.9.9";
  candidate.release_tag = "rust-v9.9.9";
  candidate.official_release.url =
    "https://github.com/openai/codex/releases/tag/rust-v9.9.9";
  semverOnly.production_selection.entry_id = candidate.entry_id;
  await assert.rejects(
    () =>
      ensurePinnedCodexManagedRuntimeForTestV01({
        root: path.join(root, "semver-must-not-exist"),
        dependencies: {
          registry: semverOnly,
          platform: "darwin",
          architecture: "arm64",
          inspect_native: () => true,
          read_cli_version: () => "9.9.9",
        },
        download_reviewed_archive: async () => {
          downloaderCalls += 1;
          return Buffer.alloc(0);
        },
      }),
    (error: unknown) =>
      error instanceof CodexQualifiedRuntimeRegistryErrorV01 &&
      error.code === "codex_qualified_runtime_registry_lane_not_qualified",
  );
  assert.equal(downloaderCalls, 0);
}

async function emulatedCredentialFreeConformanceRemainsHoldV01(): Promise<void> {
  const stateParent = path.join(root, "candidate-state");
  const executionRoot = path.join(root, "candidate-execution");
  mkdirSync(stateParent, { mode: 0o700 });
  mkdirSync(executionRoot, { mode: 0o700 });
  const networkCount = path.join(root, "candidate-network-count.txt");
  const fixture = realpathSync.native(
    path.join(process.cwd(), "scripts/fixtures/fake-codex-app-server.mjs"),
  );
  const expectedNodeFingerprint = `sha256:${createHash("sha256")
    .update(readFileSync(process.execPath))
    .digest("hex")}`;
  const receipt = await evaluateCodex01532CandidateCredentialFreeV01({
    command: process.execPath,
    executable_identity_class: "test_emulated_candidate_0_153_2",
    state_parent: realpathSync.native(stateParent),
    execution_root: realpathSync.native(executionRoot),
    augnes_source: {
      base_commit: "0".repeat(40),
      head_commit: "1".repeat(40),
      head_tree: "2".repeat(40),
    },
    archive_observation: {
      size_bytes: 87_314_265,
      digest:
        "sha256:91dfc270f0dfbaec16d814f1aa90d4f27e74dc9e3784e64006bef3b79fe9e09c",
      member_name: "codex-aarch64-apple-darwin",
      extracted_native_size_bytes: 220_551_344,
    },
    external_call_accounting: {
      official_source_api_reads: 0,
      binary_archive_acquisitions: 0,
      other_network_calls: 0,
    },
    base_environment: {
      PATH: path.dirname(process.execPath),
      LANG: "C",
      LC_ALL: "C",
      TZ: "UTC",
      NO_COLOR: "1",
    },
    test_prefix_args: [fixture],
    test_environment: {
      FAKE_CODEX_SCENARIO: "candidate_0_153_2_credential_free",
      FAKE_CODEX_NETWORK_COUNT_PATH: networkCount,
    },
    test_expected_executable_fingerprint: expectedNodeFingerprint,
    observed_at: "2026-09-04T00:00:00Z",
  });
  assert.equal(receipt.disposition, "HOLD_TEST_EMULATED_NOT_EXACT");
  assert.equal(receipt.emulated_input, true);
  assert.deepEqual(receipt.exercised_methods, [
    "initialize",
    "initialized",
    "account/read",
    "config/read",
  ]);
  assert.equal(
    receipt.credential_free_account_disposition,
    "unauthenticated_empty_state",
  );
  assert.equal(receipt.process_settlement.remaining_owned_processes, 0);
  assert.equal(receipt.process_settlement.streams_closed, true);
  assert.equal(receipt.process_settlement.disposable_state_removed, true);
  assert.deepEqual(
    validateCodex01532CandidateQualificationReceiptV01(receipt),
    receipt,
  );
  const promoted = structuredClone(receipt) as any;
  promoted.disposition = "QUALIFIED";
  const { receipt_fingerprint: _fingerprint, ...promotedMaterial } = promoted;
  promoted.receipt_fingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01(promotedMaterial),
  );
  assert.throws(
    () => validateCodex01532CandidateQualificationReceiptV01(promoted),
    /codex_candidate_receipt_semantics_invalid/u,
  );
  assert.deepEqual(readdirSync(stateParent), []);
  assert.equal(readFileSync(networkCount, "utf8"), "0\n");

  const wrongUserAgent = await evaluateCodex01532CandidateCredentialFreeV01({
    command: process.execPath,
    executable_identity_class: "test_emulated_candidate_0_153_2",
    state_parent: realpathSync.native(stateParent),
    execution_root: realpathSync.native(executionRoot),
    augnes_source: {
      base_commit: "0".repeat(40),
      head_commit: "1".repeat(40),
      head_tree: "2".repeat(40),
    },
    archive_observation: {
      size_bytes: 87_314_265,
      digest:
        "sha256:91dfc270f0dfbaec16d814f1aa90d4f27e74dc9e3784e64006bef3b79fe9e09c",
      member_name: "codex-aarch64-apple-darwin",
      extracted_native_size_bytes: 220_551_344,
    },
    external_call_accounting: {
      official_source_api_reads: 0,
      binary_archive_acquisitions: 0,
      other_network_calls: 0,
    },
    test_prefix_args: [fixture],
    test_environment: {
      FAKE_CODEX_SCENARIO: "candidate_0_153_2_wrong_user_agent",
    },
    test_expected_executable_fingerprint: expectedNodeFingerprint,
  });
  assert.equal(
    wrongUserAgent.disposition,
    "HOLD_CREDENTIAL_FREE_CONFORMANCE_FAILED",
  );
  assert.deepEqual(
    validateCodex01532CandidateQualificationReceiptV01(wrongUserAgent),
    wrongUserAgent,
  );
}

async function authenticatedCandidateCapabilityAndLifecycleV01(): Promise<void> {
  await ordinaryProductionAdapterRejectsCandidateV01();
  const success = await runAuthenticatedCandidateFixtureV01("success");
  assert.equal(
    success.result?.outcome,
    "completed",
    JSON.stringify(success.result),
  );
  assert.equal(
    success.result?.summary,
    CODEX_0_153_2_ORDINARY_CANARY_TOKEN_V01,
  );
  assert.equal(success.receipt.disposition, "HOLD_TEST_EMULATED_NOT_EXACT");
  assert.equal(success.receipt.capability_consumed, true);
  assert.equal(
    success.receipt.observed_public_token,
    CODEX_0_153_2_ORDINARY_CANARY_TOKEN_V01,
  );
  assert.deepEqual([...success.receipt.exercised_methods].sort(), [
    "account/read",
    "config/read",
    "initialize",
    "item/completed",
    "thread/start",
    "thread/status/changed",
    "turn/completed",
    "turn/start",
    "turn/started",
  ]);
  assert.deepEqual(success.receipt.protocol_progress, {
    stages: [
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
    ],
    last_completed_stage: "settled",
    pending_or_failed_stage: null,
  });
  assert.equal(
    success.receipt.evidence.contract_bounded
      .provider_model_bearing_turn_capabilities_consumed,
    1,
  );
  assert.equal(
    success.receipt.evidence.directly_observed.protocol_approvals,
    0,
  );
  assert.equal(success.receipt.evidence.directly_observed.protocol_tools, 0);
  assert.equal(success.receipt.evidence.directly_observed.protocol_commands, 0);
  assert.equal(success.receipt.evidence.directly_observed.protocol_writes, 0);
  assert.equal(
    success.receipt.evidence.directly_observed.protocol_external_effects,
    0,
  );
  assert.deepEqual(
    validateCodex01532OrdinaryAuthenticatedCanaryReceiptV01(
      success.receipt,
      authenticatedCandidateSourceV01(),
    ),
    success.receipt,
  );

  const inertUnknownConfig = await runAuthenticatedCandidateFixtureV01(
    "inert_unknown_config",
  );
  assert.equal(inertUnknownConfig.result?.outcome, "completed");
  assert.equal(
    inertUnknownConfig.receipt.disposition,
    "HOLD_TEST_EMULATED_NOT_EXACT",
  );

  for (const [scenario, expectedFailureCode] of [
    ["exit_before_initialize_response", "codex_app_server_exited_unexpectedly"],
    ["initialize_no_response", "codex_app_server_exited_unexpectedly"],
    ["initialize_rpc_failure", "codex_initialization_failed"],
  ] as const) {
    const beforeInitialize =
      await runAuthenticatedCandidateFixtureV01(scenario);
    assert.equal(beforeInitialize.result?.outcome, "failed", scenario);
    assert.equal(
      beforeInitialize.receipt.public_failure_code,
      expectedFailureCode,
      scenario,
    );
    assert.deepEqual(beforeInitialize.receipt.exercised_methods, [], scenario);
    assert.deepEqual(
      beforeInitialize.receipt.protocol_progress.stages,
      ["transport_spawned", "initialize_request_sent", "settled"],
      scenario,
    );
    assert.equal(
      beforeInitialize.receipt.protocol_progress.pending_or_failed_stage,
      "initialize_response_received",
      scenario,
    );
    assert.equal(beforeInitialize.receipt.capability_consumed, false, scenario);
    assert.equal(
      JSON.stringify(beforeInitialize.receipt).includes("sk-never-retained"),
      false,
      scenario,
    );
    assert.equal(
      JSON.stringify(beforeInitialize.result).includes("sk-never-retained"),
      false,
      scenario,
    );
    assert.equal(
      JSON.stringify(beforeInitialize.receipt).includes("/Users/private"),
      false,
      scenario,
    );
    assert.equal(
      JSON.stringify(beforeInitialize.result).includes("/Users/private"),
      false,
      scenario,
    );
  }

  const effectiveConfigDrift = await runAuthenticatedCandidateFixtureV01(
    "effective_config_drift",
  );
  assert.equal(effectiveConfigDrift.result?.outcome, "failed");
  assert.equal(
    effectiveConfigDrift.receipt.public_failure_code,
    "codex_candidate_config_policy_mismatch",
  );
  assert.equal(effectiveConfigDrift.receipt.capability_consumed, false);
  assert.equal(
    effectiveConfigDrift.receipt.protocol_progress.stages.includes(
      "thread_request_sent",
    ),
    false,
  );

  const behaviorBearingConfigWarning =
    await runAuthenticatedCandidateFixtureV01("config_warning");
  assert.equal(behaviorBearingConfigWarning.result?.outcome, "failed");
  assert.equal(
    behaviorBearingConfigWarning.receipt.public_failure_code,
    "codex_candidate_runtime_policy_drift",
  );
  assert.equal(behaviorBearingConfigWarning.receipt.capability_consumed, false);
  assert.equal(
    JSON.stringify(behaviorBearingConfigWarning.receipt).includes(
      "/Users/private",
    ),
    false,
  );

  const turnStartFailure = await runAuthenticatedCandidateFixtureV01(
    "turn_start_rpc_failure",
  );
  assert.equal(turnStartFailure.result?.outcome, "failed");
  assert.equal(turnStartFailure.receipt.capability_consumed, true);
  assert.equal(
    turnStartFailure.receipt.evidence.directly_observed
      .turn_start_response_received,
    false,
  );
  assert.equal(
    turnStartFailure.receipt.evidence.not_observed
      .provider_backend_request_count,
    "not_observed",
  );
  assert.equal(
    turnStartFailure.receipt.exercised_methods.includes("turn/start"),
    false,
  );

  const replayRoot = createAuthenticatedFixtureRootsV01("capability-replay");
  try {
    const request = authenticatedCandidateRequestV01(
      replayRoot.executionRoot,
      "capability-replay",
    );
    const capability = authenticatedCandidateCapabilityV01({
      roots: replayRoot,
      request,
      scenario: "success",
    });
    const binding =
      inspectCodex01532OrdinaryAuthenticatedCandidateCapabilityV01({
        capability,
        request,
        now: new Date().toISOString(),
      });
    assert.equal(
      binding.config_override_args.includes("--strict-config"),
      false,
    );
    assert.equal(
      binding.config_override_args.includes('forced_login_method="chatgpt"'),
      true,
    );
    assert.equal(
      binding.config_override_args.includes('model_provider="openai"'),
      true,
    );
    assert.equal(
      binding.config_override_args.includes("model_providers={}"),
      true,
    );
    const wrongRequest = structuredClone(request);
    wrongRequest.run_id = "host-run:wrong";
    assert.throws(
      () =>
        inspectCodex01532OrdinaryAuthenticatedCandidateCapabilityV01({
          capability,
          request: wrongRequest,
          now: new Date().toISOString(),
        }),
      (error: unknown) =>
        error instanceof CodexOrdinaryAuthenticatedCandidateErrorV01 &&
        error.code === "codex_candidate_capability_binding_mismatch",
    );
    const wrongRootRequest = structuredClone(request);
    wrongRootRequest.root_scope.canonical_root = replayRoot.home;
    assert.throws(
      () =>
        inspectCodex01532OrdinaryAuthenticatedCandidateCapabilityV01({
          capability,
          request: wrongRootRequest,
          now: new Date().toISOString(),
        }),
      /codex_candidate_capability_binding_mismatch/u,
    );
    assert.throws(
      () =>
        assertCodex01532CandidateCapabilitySourceV01({
          capability,
          augnes_source: {
            ...authenticatedCandidateSourceV01(),
            head_tree: "9".repeat(40),
          },
        }),
      /codex_candidate_capability_source_mismatch/u,
    );
    consumeCodex01532OrdinaryAuthenticatedCandidateCapabilityV01({
      capability,
      request,
      now: new Date().toISOString(),
    });
    assert.equal(codex01532CandidateCapabilityConsumedV01(capability), true);
    assert.throws(
      () =>
        consumeCodex01532OrdinaryAuthenticatedCandidateCapabilityV01({
          capability,
          request,
          now: new Date().toISOString(),
        }),
      /codex_candidate_capability_already_consumed/u,
    );
    const forged = Object.freeze({
      capability_version: CODEX_0_153_2_ORDINARY_CANARY_CAPABILITY_VERSION_V01,
      candidate_entry_id: CODEX_0_153_2_CANDIDATE_ENTRY_ID_V01,
      capability_fingerprint: `sha256:${"0".repeat(64)}`,
    }) as CodexOrdinaryAuthenticatedCandidateCapabilityV01;
    assert.throws(
      () =>
        inspectCodex01532OrdinaryAuthenticatedCandidateCapabilityV01({
          capability: forged,
          request,
          now: new Date().toISOString(),
        }),
      /codex_candidate_capability_unrecognized/u,
    );
    assert.throws(
      () =>
        createCodex01532OrdinaryAuthenticatedCandidateCapabilityForTestV01({
          command: process.execPath,
          prefix_args: [fixturePathV01()],
          environment: authenticatedCandidateEnvironmentV01(
            replayRoot,
            "success",
          ),
          private_root: replayRoot.privateRoot,
          execution_root: replayRoot.executionRoot,
          request,
          augnes_source: authenticatedCandidateSourceV01(),
          expires_at: new Date(Date.now() - 1_000).toISOString(),
          expected_executable_sha256: expectedNodeFingerprintV01(),
        }),
      /codex_candidate_capability_expiry_invalid/u,
    );
    const wrongProfile = mutableRegistryV01();
    candidateV01(wrongProfile).compatibility_profile_fingerprint =
      `sha256:${"1".repeat(64)}`;
    assert.throws(
      () =>
        createCodex01532OrdinaryAuthenticatedCandidateCapabilityForTestV01({
          command: process.execPath,
          prefix_args: [fixturePathV01()],
          environment: authenticatedCandidateEnvironmentV01(
            replayRoot,
            "success",
          ),
          private_root: replayRoot.privateRoot,
          execution_root: replayRoot.executionRoot,
          request,
          augnes_source: authenticatedCandidateSourceV01(),
          expires_at: new Date(Date.now() + 60_000).toISOString(),
          registry: wrongProfile,
          expected_executable_sha256: expectedNodeFingerprintV01(),
        }),
      /codex_qualified_runtime_registry_profile_reference_mismatch/u,
    );
  } finally {
    removeAuthenticatedFixtureRootsV01(replayRoot.privateRoot);
  }

  const authUnavailable =
    await runAuthenticatedCandidateFixtureV01("auth_unavailable");
  assert.equal(
    authUnavailable.receipt.disposition,
    "HOLD_AUTHENTICATION_UNAVAILABLE",
  );
  assert.equal(authUnavailable.receipt.capability_consumed, false);
  assert.equal(
    authUnavailable.receipt.evidence.contract_bounded
      .provider_model_bearing_turn_capabilities_consumed,
    0,
  );

  for (const scenario of [
    "malformed_terminal",
    "failure",
    "interrupted",
    "reroute",
    "auth_recovery",
    "approval",
    "command",
    "write",
    "tool",
    "unexpected_notification",
    "timeout",
  ]) {
    const observed = await runAuthenticatedCandidateFixtureV01(scenario);
    assert.equal(
      observed.receipt.disposition,
      "HOLD_CANARY_CONTRACT_FAILED",
      scenario,
    );
    assert.equal(observed.receipt.capability_consumed, true, scenario);
    assert.equal(
      observed.receipt.evidence.contract_bounded
        .provider_model_bearing_turn_capabilities_consumed,
      1,
      scenario,
    );
    if (scenario === "approval") {
      assert.equal(
        observed.receipt.evidence.directly_observed.protocol_approvals,
        1,
      );
      assert.equal(
        observed.receipt.evidence.directly_observed.protocol_external_effects,
        1,
      );
    }
    if (scenario === "command")
      assert.equal(
        observed.receipt.evidence.directly_observed.protocol_commands,
        1,
      );
    if (scenario === "write")
      assert.equal(
        observed.receipt.evidence.directly_observed.protocol_writes,
        1,
      );
    if (scenario === "tool")
      assert.equal(
        observed.receipt.evidence.directly_observed.protocol_tools,
        1,
      );
    if (scenario === "reroute")
      assert.equal(
        observed.receipt.evidence.directly_observed.protocol_reroutes,
        1,
      );
    if (scenario === "auth_recovery")
      assert.equal(
        observed.receipt.evidence.directly_observed.protocol_fallbacks,
        1,
      );
  }

  const unsafe = structuredClone(success.receipt) as any;
  unsafe.disposition = "QUALIFIED";
  refingerprintAuthenticatedReceiptV01(unsafe);
  assert.throws(
    () =>
      validateCodex01532OrdinaryAuthenticatedCanaryReceiptV01(
        unsafe,
        authenticatedCandidateSourceV01(),
      ),
    /codex_candidate_authenticated_receipt_invalid/u,
  );
  const promotion = structuredClone(success.receipt) as any;
  promotion.qualified_at = "2026-09-04T00:00:00Z";
  refingerprintAuthenticatedReceiptV01(promotion);
  assert.throws(
    () =>
      validateCodex01532OrdinaryAuthenticatedCanaryReceiptV01(
        promotion,
        authenticatedCandidateSourceV01(),
      ),
    /codex_candidate_authenticated_receipt_invalid/u,
  );
  const secret = structuredClone(success.receipt) as any;
  secret.observed_public_token = "/Users/private/auth.json";
  refingerprintAuthenticatedReceiptV01(secret);
  assert.throws(
    () =>
      validateCodex01532OrdinaryAuthenticatedCanaryReceiptV01(
        secret,
        authenticatedCandidateSourceV01(),
      ),
    /codex_candidate_authenticated_receipt_private_material_forbidden/u,
  );
  const invalidCount = structuredClone(success.receipt) as any;
  invalidCount.evidence.directly_observed.protocol_tools = -1;
  refingerprintAuthenticatedReceiptV01(invalidCount);
  assert.throws(
    () =>
      validateCodex01532OrdinaryAuthenticatedCanaryReceiptV01(
        invalidCount,
        authenticatedCandidateSourceV01(),
      ),
    /codex_candidate_authenticated_receipt_semantics_invalid/u,
  );
  const mismatchedSource = structuredClone(success.receipt) as any;
  mismatchedSource.augnes_source.head_tree = "8".repeat(40);
  refingerprintAuthenticatedReceiptV01(mismatchedSource);
  assert.throws(
    () =>
      validateCodex01532OrdinaryAuthenticatedCanaryReceiptV01(
        mismatchedSource,
        authenticatedCandidateSourceV01(),
      ),
    /codex_candidate_authenticated_receipt_semantics_invalid/u,
  );
}

async function initializeOnlyDiagnosticContractV01(): Promise<void> {
  assert.equal(CODEX_0_153_2_INITIALIZE_DIAGNOSTIC_TIMEOUT_MS_V01, 10_000);
  const sharedOverrides =
    codex01532OrdinaryCanaryConfigOverrideArgsForDiagnosticV01();
  assert.equal(Object.isFrozen(sharedOverrides), true);
  assert.equal(sharedOverrides.includes("--strict-config"), false);
  assert.equal(sharedOverrides.includes('model_provider="openai"'), true);
  assert.equal(sharedOverrides.includes("features.use_agent_identity=false"), true);

  const passed = await runInitializeDiagnosticFixtureV01(
    "candidate_0_153_2_initialize_diagnostic_pass",
    500,
  );
  assert.equal(passed.result.valid_initialize_response_received, true);
  assert.equal(passed.result.initialize_user_agent_validated, true);
  assert.equal(passed.result.returned_codex_home_validated_locally, true);
  assert.equal(passed.result.public_error_class, null);
  assert.equal(passed.result.process_settled, true);
  assert.equal(passed.result.streams_closed, true);
  assert.equal(passed.result.remaining_owned_processes, 0);
  assert.deepEqual(passed.receivedMethods, ["initialize"]);

  const exited = await runInitializeDiagnosticFixtureV01(
    "candidate_0_153_2_authenticated_exit_before_initialize_response",
    500,
  );
  assert.equal(exited.result.initialize_request_sent, true);
  assert.equal(exited.result.valid_initialize_response_received, false);
  assert.equal(exited.result.public_error_class, "initialize_process_exited");
  assert.deepEqual(exited.receivedMethods, ["initialize"]);
  assert.equal(JSON.stringify(exited.result).includes("sk-never-retained"), false);
  assert.equal(JSON.stringify(exited.result).includes("/Users/private"), false);

  const timedOut = await runInitializeDiagnosticFixtureV01(
    "candidate_0_153_2_initialize_diagnostic_timeout",
    100,
  );
  assert.equal(timedOut.result.initialize_request_sent, true);
  assert.equal(timedOut.result.valid_initialize_response_received, false);
  assert.equal(timedOut.result.public_error_class, "initialize_timeout");
  assert.equal(timedOut.result.process_settled, true);
  assert.equal(timedOut.result.remaining_owned_processes, 0);
  assert.deepEqual(timedOut.receivedMethods, ["initialize"]);

  const rpcFailure = await runInitializeDiagnosticFixtureV01(
    "candidate_0_153_2_authenticated_initialize_rpc_failure",
    500,
  );
  assert.equal(rpcFailure.result.public_error_class, "initialize_rpc_failure");
  assert.deepEqual(rpcFailure.receivedMethods, ["initialize"]);

  const unexpected = await runInitializeDiagnosticFixtureV01(
    "candidate_0_153_2_initialize_diagnostic_unexpected_notification",
    500,
  );
  assert.equal(
    unexpected.result.public_error_class,
    "initialize_unexpected_protocol_message",
  );
  assert.equal(JSON.stringify(unexpected.result).includes("secret-looking"), false);
  assert.equal(JSON.stringify(unexpected.result).includes("/Users/private"), false);
  assert.deepEqual(unexpected.receivedMethods, ["initialize"]);

  const callsA: Codex01532InitializeDiagnosticProbeLabelV01[] = [];
  const baselineFailure = await runCodex01532InitializeDiagnosticSequenceV01({
    run_probe: async (probe) => {
      callsA.push(probe);
      return syntheticDiagnosticProbeV01(probe, "timeout");
    },
  });
  assert.equal(baselineFailure.disposition, "BASELINE_INITIALIZE_FAILURE");
  assert.deepEqual(callsA, ["A_private_control"]);
  assert.deepEqual(baselineFailure.skipped_probes, [
    "B_split_home_real_codex_home",
    "C_real_home_real_codex_home",
  ]);

  const callsB: Codex01532InitializeDiagnosticProbeLabelV01[] = [];
  const notReproduced = await runCodex01532InitializeDiagnosticSequenceV01({
    run_probe: async (probe) => {
      callsB.push(probe);
      return syntheticDiagnosticProbeV01(probe, "pass");
    },
  });
  assert.equal(
    notReproduced.disposition,
    "FAILED_CANARY_ENVIRONMENT_TIMEOUT_NOT_REPRODUCED",
  );
  assert.deepEqual(callsB, [
    "A_private_control",
    "B_split_home_real_codex_home",
  ]);
  assert.deepEqual(notReproduced.skipped_probes, [
    "C_real_home_real_codex_home",
  ]);
  assert.equal(notReproduced.post_initialize_requests_sent, 0);

  const callsC: Codex01532InitializeDiagnosticProbeLabelV01[] = [];
  const splitCause = await runCodex01532InitializeDiagnosticSequenceV01({
    run_probe: async (probe) => {
      callsC.push(probe);
      return syntheticDiagnosticProbeV01(
        probe,
        probe === "B_split_home_real_codex_home" ? "timeout" : "pass",
      );
    },
  });
  assert.equal(
    splitCause.disposition,
    "SPLIT_HOME_CODEX_HOME_STARTUP_CAUSE_STRONG_EVIDENCE",
  );
  assert.deepEqual(callsC, [
    "A_private_control",
    "B_split_home_real_codex_home",
    "C_real_home_real_codex_home",
  ]);

  const unresolved = await runCodex01532InitializeDiagnosticSequenceV01({
    run_probe: async (probe) =>
      syntheticDiagnosticProbeV01(
        probe,
        probe === "A_private_control" ? "pass" : "timeout",
      ),
  });
  assert.equal(
    unresolved.disposition,
    "REAL_CODEX_HOME_STARTUP_PATH_UNRESOLVED",
  );

  const unexpectedCalls: Codex01532InitializeDiagnosticProbeLabelV01[] = [];
  const unexpectedSequence =
    await runCodex01532InitializeDiagnosticSequenceV01({
      run_probe: async (probe) => {
        unexpectedCalls.push(probe);
        return syntheticDiagnosticProbeV01(
          probe,
          probe === "A_private_control" ? "pass" : "rpc_failure",
        );
      },
    });
  assert.equal(
    unexpectedSequence.disposition,
    "UNEXPECTED_DIAGNOSTIC_FAILURE",
  );
  assert.deepEqual(unexpectedCalls, [
    "A_private_control",
    "B_split_home_real_codex_home",
  ]);

  await assert.rejects(
    () =>
      runCodex01532InitializeDiagnosticSequenceV01({
        run_probe: async (probe) =>
          ({
            ...syntheticDiagnosticProbeV01(probe, "pass"),
            raw_private_path: "/Users/private/auth.json",
          }) as Codex01532InitializeDiagnosticProbeResultV01,
      }),
    /codex_initialize_diagnostic_private_material_forbidden/u,
  );
}

async function runInitializeDiagnosticFixtureV01(
  scenario: string,
  responseBoundMs: number,
): Promise<{
  result: Codex01532InitializeDiagnosticProbeResultV01;
  receivedMethods: string[];
}> {
  const fixtureRoot = realpathSync.native(
    mkdtempSync(path.join(root, "initialize-diagnostic-")),
  );
  chmodSync(fixtureRoot, 0o700);
  const directories = Object.fromEntries(
    ["execution", "home", "codex-home", "sqlite-home", "tmp", "path"].map(
      (name) => {
        const target = path.join(fixtureRoot, name);
        mkdirSync(target, { mode: 0o700 });
        chmodSync(target, 0o700);
        return [name, realpathSync.native(target)];
      },
    ),
  );
  const tracePath = path.join(fixtureRoot, "trace.jsonl");
  try {
    const result = await runCodex01532InitializeOnlyProbeV01({
      probe: "A_private_control",
      command: process.execPath,
      expected_native_sha256: expectedNodeFingerprintV01(),
      private_root: fixtureRoot,
      execution_root: directories.execution!,
      environment: {
        NODE_ENV: "test",
        HOME: directories.home,
        CODEX_HOME: directories["codex-home"],
        CODEX_SQLITE_HOME: directories["sqlite-home"],
        TMPDIR: directories.tmp,
        PATH: directories.path,
        LANG: "C",
        LC_ALL: "C",
        TZ: "UTC",
        NO_COLOR: "1",
        FAKE_CODEX_SCENARIO: scenario,
        FAKE_CODEX_TRACE_PATH: tracePath,
      },
      protected_surfaces_unchanged: true,
      test_only: {
        fixture_path: fixturePathV01(),
        response_bound_ms: responseBoundMs,
      },
    });
    const traces = existsSync(tracePath)
      ? readFileSync(tracePath, "utf8")
          .trim()
          .split("\n")
          .filter(Boolean)
          .map((line) => JSON.parse(line) as Record<string, any>)
      : [];
    const receivedMethods = traces
      .filter(({ kind }) => kind === "received")
      .map(({ value }) => String(value?.method ?? ""));
    return { result, receivedMethods };
  } finally {
    removeAuthenticatedFixtureRootsV01(fixtureRoot);
  }
}

function syntheticDiagnosticProbeV01(
  probe: Codex01532InitializeDiagnosticProbeLabelV01,
  outcome: "pass" | "timeout" | "rpc_failure",
): Codex01532InitializeDiagnosticProbeResultV01 {
  const passed = outcome === "pass";
  return {
    diagnostic_version: "codex_0_153_2_initialize_only_diagnostic.v0.1",
    probe,
    environment_shape:
      probe === "A_private_control"
        ? "private_home_private_codex_home"
        : probe === "B_split_home_real_codex_home"
          ? "private_home_real_codex_home"
          : "real_home_real_codex_home",
    native_sha256: `sha256:${"a".repeat(64)}`,
    initialize_request_sent: true,
    valid_initialize_response_received: passed,
    initialize_user_agent_validated: passed,
    returned_codex_home_validated_locally: passed,
    elapsed_ms: passed ? 25 : 10_000,
    response_bound_ms: 10_000,
    response_bound_met: passed,
    public_error_class:
      outcome === "timeout"
        ? "initialize_timeout"
        : outcome === "rpc_failure"
          ? "initialize_rpc_failure"
          : null,
    process_settled: true,
    streams_closed: true,
    remaining_owned_processes: 0,
    protected_surfaces_unchanged: true,
  };
}

async function ordinaryProductionAdapterRejectsCandidateV01(): Promise<void> {
  const roots = createAuthenticatedFixtureRootsV01("production-refusal");
  try {
    const request = authenticatedCandidateRequestV01(
      roots.executionRoot,
      "production-refusal",
    );
    const reviewed = getCodexReviewedRuntimeArtifactV01({
      entry_id: CODEX_0_153_2_CANDIDATE_ENTRY_ID_V01,
    });
    const observations: string[] = [];
    const adapter = createCodexAppServerAdapterV01({
      launch: {
        command: process.execPath,
        prefix_args: [fixturePathV01()],
        environment: authenticatedCandidateEnvironmentV01(roots, "success"),
        qualified_runtime_selection: {
          selection_mode: "pinned_exact",
          lane: "ordinary_chatgpt_auth",
          artifact: reviewed.artifact,
          compatibility_profile: reviewed.compatibility_profile,
        },
      },
      observe: ({ kind }) => observations.push(kind),
    });
    const invocation = adapter.invoke(request, {
      cancellation_signal: new AbortController().signal,
      timeout_ms: 2_000,
      stop_settle_timeout_ms: 1_000,
    });
    const result = await invocation.result;
    await invocation.settled;
    assert.equal(result.outcome, "failed");
    assert.equal(observations.includes("spawned"), false);
    assert.equal(existsSync(roots.networkCountPath), false);
  } finally {
    removeAuthenticatedFixtureRootsV01(roots.privateRoot);
  }
}

interface AuthenticatedFixtureRootsV01 {
  privateRoot: string;
  executionRoot: string;
  home: string;
  codexHome: string;
  sqliteHome: string;
  tmp: string;
  poisonPath: string;
  networkCountPath: string;
}

async function runAuthenticatedCandidateFixtureV01(scenario: string): Promise<{
  result: NativeHostResultV01 | null;
  receipt: ReturnType<
    typeof createCodex01532OrdinaryAuthenticatedCanaryReceiptV01
  >;
}> {
  const roots = createAuthenticatedFixtureRootsV01(`run-${scenario}`);
  const request = authenticatedCandidateRequestV01(
    roots.executionRoot,
    `authenticated-${scenario}`,
  );
  const capability = authenticatedCandidateCapabilityV01({
    roots,
    request,
    scenario,
  });
  let timeout: NodeJS.Timeout | null = null;
  let invocation: NativeHostInvocationV01;
  const adapter = createCodexAppServerAdapterV01({
    ordinary_authenticated_candidate_execution: capability,
    observe(observation) {
      if (scenario === "timeout" && observation.kind === "turn_started") {
        timeout = setTimeout(() => {
          void invocation
            .request_stop({ reason: "timeout" })
            .catch(() => undefined);
        }, 100);
        timeout.unref();
      }
    },
  });
  invocation = adapter.invoke(request, {
    cancellation_signal: new AbortController().signal,
    timeout_ms: 2_000,
    stop_settle_timeout_ms: 1_000,
  });
  let result: NativeHostResultV01 | null = null;
  let failureCode: string | null = null;
  let streamsClosed = false;
  if (scenario !== "timeout") {
    timeout = setTimeout(() => {
      void invocation
        .request_stop({ reason: "timeout" })
        .catch(() => undefined);
    }, 2_000);
    timeout.unref();
  }
  try {
    result = await invocation.result;
  } catch (error) {
    failureCode = error instanceof Error ? error.message : "unknown_failure";
  } finally {
    if (timeout) clearTimeout(timeout);
    try {
      await invocation.settled;
      streamsClosed = true;
    } catch (error) {
      failureCode ??=
        error instanceof Error ? error.message : "settlement_failure";
    }
  }
  assert.equal(readFileSync(roots.networkCountPath, "utf8"), "0\n");
  removeAuthenticatedFixtureRootsV01(roots.privateRoot);
  const stableIntegrity = `sha256:${"7".repeat(64)}`;
  const receipt = createCodex01532OrdinaryAuthenticatedCanaryReceiptV01({
    capability,
    augnes_source: authenticatedCandidateSourceV01(),
    request,
    result,
    failure_code: failureCode,
    integrity_before_fingerprint: stableIntegrity,
    integrity_after_fingerprint: stableIntegrity,
    streams_and_owned_processes_settled: streamsClosed,
    disposable_roots_removed: !existsSync(roots.privateRoot),
    observed_at: "2026-09-04T00:00:00.000Z",
  });
  assert.equal(existsSync(roots.privateRoot), false);
  return { result, receipt };
}

function authenticatedCandidateCapabilityV01(input: {
  roots: AuthenticatedFixtureRootsV01;
  request: NativeHostRequestV01;
  scenario: string;
}): CodexOrdinaryAuthenticatedCandidateCapabilityV01 {
  return createCodex01532OrdinaryAuthenticatedCandidateCapabilityForTestV01({
    command: process.execPath,
    prefix_args: [fixturePathV01()],
    environment: authenticatedCandidateEnvironmentV01(
      input.roots,
      input.scenario,
    ),
    private_root: input.roots.privateRoot,
    execution_root: input.roots.executionRoot,
    request: input.request,
    augnes_source: authenticatedCandidateSourceV01(),
    expires_at: new Date(Date.now() + 5 * 60_000).toISOString(),
    expected_executable_sha256: expectedNodeFingerprintV01(),
  });
}

function authenticatedCandidateSourceV01() {
  return {
    base_commit: "8eb6b7af220fe8d7e244bb616205c797d7965142" as const,
    head_commit: "1".repeat(40),
    head_tree: "2".repeat(40),
  };
}

function createAuthenticatedFixtureRootsV01(
  id: string,
): AuthenticatedFixtureRootsV01 {
  const privateRoot = realpathSync.native(
    mkdtempSync(path.join(root, `authenticated-${id}-`)),
  );
  chmodSync(privateRoot, 0o700);
  const executionRoot = path.join(privateRoot, "execution");
  const home = path.join(privateRoot, "home");
  const codexHome = path.join(privateRoot, "codex-home");
  const sqliteHome = path.join(privateRoot, "sqlite-home");
  const tmp = path.join(privateRoot, "tmp");
  const poisonPath = path.join(privateRoot, "poison-path");
  for (const directory of [
    executionRoot,
    home,
    codexHome,
    sqliteHome,
    tmp,
    poisonPath,
  ]) {
    mkdirSync(directory, { mode: 0o700 });
    chmodSync(directory, 0o700);
  }
  return {
    privateRoot,
    executionRoot: realpathSync.native(executionRoot),
    home: realpathSync.native(home),
    codexHome: realpathSync.native(codexHome),
    sqliteHome: realpathSync.native(sqliteHome),
    tmp: realpathSync.native(tmp),
    poisonPath: realpathSync.native(poisonPath),
    networkCountPath: path.join(privateRoot, "network-count.txt"),
  };
}

function authenticatedCandidateEnvironmentV01(
  roots: AuthenticatedFixtureRootsV01,
  scenario: string,
): NodeJS.ProcessEnv {
  return {
    NODE_ENV: "test",
    HOME: roots.home,
    CODEX_HOME: roots.codexHome,
    CODEX_SQLITE_HOME: roots.sqliteHome,
    TMPDIR: roots.tmp,
    PATH: roots.poisonPath,
    LANG: "C",
    LC_ALL: "C",
    TZ: "UTC",
    NO_COLOR: "1",
    FAKE_CODEX_SCENARIO: `candidate_0_153_2_authenticated_${scenario}`,
    FAKE_CODEX_NETWORK_COUNT_PATH: roots.networkCountPath,
  };
}

function authenticatedCandidateRequestV01(
  executionRoot: string,
  id: string,
): NativeHostRequestV01 {
  const packet = buildTaskContextPacketV01(
    structuredClone(genericCliBuilderInputFixture),
  );
  const stat = statSync(executionRoot, { bigint: true });
  const rootFingerprint = createProtocolSha256V01(`root:${id}`);
  return {
    request_version: "native_host_request.v0.1",
    request_id: `candidate-request:${id}`,
    run_id: `candidate-run:${id}`,
    idempotency_key: createProtocolSha256V01(`idempotency:${id}`),
    workspace_id: packet.workspace_id,
    project_id: packet.project_id,
    work_ref: refV01("work", `candidate-work:${id}`),
    task_ref: refV01("task", `candidate-task:${id}`),
    task_context_packet_ref: refV01("task_context_packet", packet.packet_id),
    packet,
    packet_lineage: {
      source_transition_receipt_ref: refV01(
        "state_transition_receipt",
        `candidate-transition:${id}`,
      ),
      packet_source_refs: [],
      selected_context_refs: [],
    },
    mode: "policy_triggered",
    root_scope: {
      canonical_root: executionRoot,
      path_flavor: "posix",
      root_kind: "plain_folder",
      root_fingerprint: rootFingerprint,
      physical_root_identity: {
        identity_version: "native_host_physical_root_identity.v0.1",
        canonical_realpath_fingerprint: rootFingerprint,
        device: String(stat.dev),
        inode: String(stat.ino),
      },
      root_scope_ref: refV01("project_root_scope", `candidate-scope:${id}`),
      repository_ref: null,
      selected_worktree_ref: null,
    },
    requested_capability: CODEX_0_153_2_ORDINARY_CANARY_CAPABILITY_VERSION_V01,
    allowed_operation_categories: [
      "read_validated_task_context",
      "return_bounded_public_token",
    ],
    forbidden_operation_categories: [
      "all_external_effects",
      "network_egress",
      "tool_use",
      "command_execution",
      "file_change",
      "repository_task",
    ],
    packet_capability_grant: packet.capability_grant,
    execution_grant_ref: null,
    automation_context: null,
    repository_delegation_context: null,
    repository_resume_context: null,
    policy: {
      filesystem: "selected_project_root_only",
      network: "forbidden",
      commands: "approval_required",
      model: "native_host_managed",
      host_egress: "bounded_capability_grant",
      max_changed_files: 0,
      max_artifacts: 0,
      max_commands: 0,
      max_checks: 8,
      timeout_ms: 2_000,
      stop_settle_timeout_ms: 1_000,
      stop_conditions: ["timeout", "cancellation_requested"],
    },
    result_return: {
      return_version: "native_host_result_return.v0.1",
      structured_result_required: true,
      legacy_result_text_allowed: false,
      raw_output_allowed: false,
      max_result_bytes: 8 * 1024,
    },
  };
}

function refV01(refType: string, externalId: string): ExternalRefV01 {
  return {
    ref_version: "external_ref.v0.1",
    ref_type: refType,
    external_id: externalId,
    observed_at: "2026-09-04T00:00:00.000Z",
    trust_class: "direct_local_observation",
  };
}

function fixturePathV01(): string {
  return realpathSync.native(
    path.join(process.cwd(), "scripts/fixtures/fake-codex-app-server.mjs"),
  );
}

let cachedNodeFingerprintV01: string | null = null;
function expectedNodeFingerprintV01(): string {
  cachedNodeFingerprintV01 ??= `sha256:${createHash("sha256")
    .update(readFileSync(process.execPath))
    .digest("hex")}`;
  return cachedNodeFingerprintV01;
}

function removeAuthenticatedFixtureRootsV01(privateRoot: string): void {
  if (!existsSync(privateRoot)) return;
  makeWritableV01(privateRoot);
  rmSync(privateRoot, { recursive: true, force: false });
  assert.equal(existsSync(privateRoot), false);
}

function refingerprintAuthenticatedReceiptV01(value: any): void {
  const { receipt_fingerprint: _fingerprint, ...material } = value;
  value.receipt_fingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01(material),
  );
}

type MutableRegistryV01 = ReturnType<typeof mutableRegistryV01>;

function mutableRegistryV01(): any {
  return JSON.parse(JSON.stringify(CODEX_QUALIFIED_RUNTIME_REGISTRY_V01));
}

function candidateV01(registry: MutableRegistryV01): any {
  return registry.artifacts.find(
    (artifact: any) =>
      artifact.entry_id === CODEX_0_153_2_CANDIDATE_ENTRY_ID_V01,
  );
}

function sourceReviewV01(registry: MutableRegistryV01): any {
  return candidateV01(registry).qualification_evidence.source_schema_review;
}

function recomputeSourceReviewFingerprintV01(review: any): void {
  const { fingerprint: _fingerprint, ...material } = review;
  review.fingerprint =
    codexRuntimeCandidateSourceSchemaReviewFingerprintV01(material);
}

function makeWritableV01(target: string): void {
  if (!existsSync(target)) return;
  const stat = lstatSync(target);
  if (stat.isSymbolicLink()) return;
  if (stat.isDirectory()) {
    chmodSync(target, 0o700);
    for (const name of readdirSync(target))
      makeWritableV01(path.join(target, name));
  } else if (stat.isFile()) chmodSync(target, 0o600);
}

function restoreEnvironmentV01(key: string, value: string | undefined): void {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}

void mainV01();
