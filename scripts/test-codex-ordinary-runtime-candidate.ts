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
} from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  ensurePinnedCodexManagedRuntimeForTestV01,
} from "@/lib/vnext/native-host/codex-managed-runtime-store";
import {
  CODEX_0_153_2_CANDIDATE_ENTRY_ID_V01,
  assertCodex01532CandidateReviewedIdentityForTestV01,
  evaluateCodex01532CandidateCredentialFreeV01,
  validateCodex01532CandidateQualificationReceiptV01,
} from "@/lib/vnext/native-host/codex-ordinary-runtime-candidate";
import {
  CODEX_QUALIFIED_RUNTIME_REGISTRY_V01,
  CodexQualifiedRuntimeRegistryErrorV01,
  codexRuntimeCandidateSourceSchemaReviewFingerprintV01,
  codexRuntimeCompatibilityProfileFingerprintV01,
  selectCodexQualifiedRuntimeEntryV01,
  selectPinnedCodexQualifiedRuntimeV01,
  validateCodexQualifiedRuntimeRegistryV01,
} from "@/lib/vnext/native-host/codex-qualified-runtime-registry";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";

const previousCandidateTestMode =
  process.env.AUGNES_CODEX_ORDINARY_CANDIDATE_TEST_MODE;
const previousProductionTestMode =
  process.env.AUGNES_CODEX_PRODUCTION_RUNTIME_TEST_MODE;
process.env.AUGNES_CODEX_ORDINARY_CANDIDATE_TEST_MODE = "1";
process.env.AUGNES_CODEX_PRODUCTION_RUNTIME_TEST_MODE = "1";

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
    report = {
        status: "passed",
        contract: "codex_ordinary_runtime_candidate_qualification.v0.1",
        candidate_entry_id: CODEX_0_153_2_CANDIDATE_ENTRY_ID_V01,
        ordinary_lane: "candidate",
        strict_lane: "hold",
        production_selected_version: "0.152.1",
        emulated_exact_evidence_available: false,
        provider_model_calls: 0,
        keychain_accesses: 0,
        agent_identity_attempts: 0,
        repository_task_calls: 0,
        repository_writes: 0,
        external_network_calls: 0,
        remaining_owned_processes: 0,
        disposable_roots_removed: true,
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
  assert.equal(candidate.qualification_evidence.kind, "candidate_source_schema_review_v0_1");
  if (candidate.qualification_evidence.kind !== "candidate_source_schema_review_v0_1")
    assert.fail("candidate evidence kind mismatch");
  assert.equal(candidate.qualification_evidence.ordinary_deciding_receipt_fingerprint, null);
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
      candidateV01(registry).qualification_evidence.ordinary_deciding_receipt_fingerprint =
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
  assert.equal(existsSync(path.join(root, "must-not-exist-managed-root")), false);

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
  assert.equal(receipt.credential_free_account_disposition, "unauthenticated_empty_state");
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
  assert.equal(wrongUserAgent.disposition, "HOLD_CREDENTIAL_FREE_CONFORMANCE_FAILED");
  assert.deepEqual(
    validateCodex01532CandidateQualificationReceiptV01(wrongUserAgent),
    wrongUserAgent,
  );
}

type MutableRegistryV01 = ReturnType<typeof mutableRegistryV01>;

function mutableRegistryV01(): any {
  return JSON.parse(JSON.stringify(CODEX_QUALIFIED_RUNTIME_REGISTRY_V01));
}

function candidateV01(registry: MutableRegistryV01): any {
  return registry.artifacts.find(
    (artifact: any) => artifact.entry_id === CODEX_0_153_2_CANDIDATE_ENTRY_ID_V01,
  );
}

function sourceReviewV01(registry: MutableRegistryV01): any {
  return candidateV01(registry).qualification_evidence.source_schema_review;
}

function recomputeSourceReviewFingerprintV01(review: any): void {
  const { fingerprint: _fingerprint, ...material } = review;
  review.fingerprint = codexRuntimeCandidateSourceSchemaReviewFingerprintV01(material);
}

function makeWritableV01(target: string): void {
  if (!existsSync(target)) return;
  const stat = lstatSync(target);
  if (stat.isSymbolicLink()) return;
  if (stat.isDirectory()) {
    chmodSync(target, 0o700);
    for (const name of readdirSync(target)) makeWritableV01(path.join(target, name));
  } else if (stat.isFile()) chmodSync(target, 0o600);
}

function restoreEnvironmentV01(key: string, value: string | undefined): void {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}

void mainV01();
