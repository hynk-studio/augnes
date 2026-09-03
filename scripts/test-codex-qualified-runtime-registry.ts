import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  CODEX_QUALIFIED_RUNTIME_REGISTRY_FINGERPRINT_V01,
  CODEX_QUALIFIED_RUNTIME_REGISTRY_V01,
  CodexQualifiedRuntimeRegistryErrorV01,
  codexRuntimeCompatibilityProfileFingerprintV01,
  selectPinnedCodexQualifiedRuntimeV01,
  validateCodexQualifiedRuntimeRegistryV01,
} from "@/lib/vnext/native-host/codex-qualified-runtime-registry";
import {
  CODEX_ISOLATED_AUTH_PRODUCTION_SELECTION_V01,
  CODEX_ISOLATED_AUTH_SEMANTIC_PROFILE_V01,
} from "@/lib/vnext/native-host/codex-isolated-auth-projection";
import { canonicalizeProtocolValueV01 } from "@/lib/vnext/protocol-primitives";
import { CODEX_ISOLATED_AUTH_PINNED_PRODUCTION_SEMANTIC_PROFILE_FINGERPRINT_V01 } from "@/types/vnext/codex-isolated-auth-projection";

const registry = CODEX_QUALIFIED_RUNTIME_REGISTRY_V01;
const selected = selectPinnedCodexQualifiedRuntimeV01({
  lane: "ordinary_chatgpt_auth",
  observed_at: "2026-09-03T01:17:35.000Z",
});

exactSeedIdentityV01();
profileSemanticsAreReusableAndDeterministicV01();
invalidRegistryMutationsFailClosedV01();
laneSelectionIsIndependentV01();
revocationExpiryAndSecurityFloorFailClosedV01();
manifestIsReviewControlledAndRuntimeImmutableV01();

console.log(
  JSON.stringify({
    status: "passed",
    contract: "codex_qualified_runtime_registry.v0.1",
    registry_fingerprint: CODEX_QUALIFIED_RUNTIME_REGISTRY_FINGERPRINT_V01,
    compatibility_profile_id: selected.compatibility_profile.profile_id,
    compatibility_profile_fingerprint:
      selected.compatibility_profile.fingerprint,
    selected_entry_id: selected.artifact.entry_id,
    selected_version: selected.artifact.version,
    ordinary_lane: selected.artifact.lanes.ordinary_chatgpt_auth.status,
    strict_lane: selected.artifact.lanes.strict_agent_identity.status,
    production_entry_count: registry.artifacts.length,
    runtime_manifest_mutation_available: false,
    provider_model_calls: 0,
    strict_agent_identity_registration_attempts: 0,
  }),
);

function exactSeedIdentityV01(): void {
  assert.equal(registry.registry_schema_version, "codex_qualified_runtime_registry.v0.1");
  assert.deepEqual(registry.authority, {
    authority_kind: "checked_in_human_reviewed_manifest",
    runtime_mutation: "forbidden",
    qualification_receipts: "evidence_only",
    production_promotion: "checked_in_reviewed_manifest_change_required",
  });
  assert.equal(registry.compatibility_profiles.length, 1);
  assert.equal(registry.artifacts.length, 1);
  assert.deepEqual(registry.production_selection, {
    mode: "pinned_exact",
    lane: "ordinary_chatgpt_auth",
    entry_id: "codex-rust-v0.152.1-darwin-arm64",
  });
  const artifact = registry.artifacts[0]!;
  assert.equal(artifact.version, "0.152.1");
  assert.equal(artifact.release_tag, "rust-v0.152.1");
  assert.equal(
    artifact.tagged_source_commit,
    "5adb68a49933ae446bf11935662c83dba55a0804",
  );
  assert.equal(artifact.platform, "darwin");
  assert.equal(artifact.architecture, "arm64");
  assert.equal(artifact.upstream_target_triple, "aarch64-apple-darwin");
  assert.deepEqual(artifact.official_release, {
    repository: "openai/codex",
    release_id: 380862087,
    url: "https://github.com/openai/codex/releases/tag/rust-v0.152.1",
  });
  assert.deepEqual(artifact.qualified_provenance_asset, {
    acquisition_route: "standalone_release_tarball",
    asset_id: 540234445,
    asset_name: "codex-aarch64-apple-darwin.tar.gz",
    size_bytes: 86499260,
    digest:
      "sha256:8ddde1fcf5c9842e9baa09c7c108088bb22a39feb86e4344e45dc0986764b9d7",
    digest_mechanism: "official_github_release_asset_digest_sha256",
  });
  assert.equal(
    artifact.native_executable_sha256,
    "sha256:8194ea3181f330e63023b234b0b231855e5874e0331c5ef7cbc490591497a7bf",
  );
  assert.deepEqual(
    artifact.admitted_discovery_launch_shapes.map((shape) => shape.shape),
    ["direct_native", "symlink_to_native", "official_openai_node_launcher"],
  );
  assert.equal(
    artifact.admitted_discovery_launch_shapes[2]!.launcher_sha256,
    "sha256:134063e133f0b4244fa3b251acf973d4fe4b4aeeacbdc135211bf480f59f1477",
  );
  assert.deepEqual(artifact.unsupported_acquisition_routes, [
    {
      route: "codex_package_archive",
      example_asset_name: "codex-package-aarch64-apple-darwin.tar.gz",
      status: "unsupported",
    },
  ]);
  assert.equal(artifact.revocation, null);
  assert.equal(artifact.not_after, null);
  assert.equal(artifact.security_floor, null);
  assert.equal(
    artifact.legacy_exact_qualification_evidence.semantic_profile_fingerprint,
    CODEX_ISOLATED_AUTH_PINNED_PRODUCTION_SEMANTIC_PROFILE_FINGERPRINT_V01,
  );
  assert.equal(
    artifact.legacy_exact_qualification_evidence
      .ordinary_deciding_receipt_fingerprint,
    "6382188b98b4cf9388861428adc1219962f586c5e47ecd6c0ab09a9ae4fc1178",
  );
  assert.equal(
    artifact.lanes.ordinary_chatgpt_auth.qualified_at,
    "2026-09-03T01:17:35.000Z",
  );
  assert.equal(
    artifact.lanes.strict_agent_identity.reason,
    "official_agent_identity_registration_non_retryable_http_403",
  );
}

function profileSemanticsAreReusableAndDeterministicV01(): void {
  const profile = selected.compatibility_profile;
  assert.equal(profile.profile_id, "codex_app_server_augnes_operator.v0.1");
  assert.equal(
    profile.fingerprint,
    "sha256:a4cfb0e38fd6a2af0d29a467c2c5db2579cdc784e93a820f3482fa2c8a1d663a",
  );
  assert.notEqual(
    profile.fingerprint,
    CODEX_ISOLATED_AUTH_PINNED_PRODUCTION_SEMANTIC_PROFILE_FINGERPRINT_V01,
  );
  assert.equal(
    CODEX_ISOLATED_AUTH_SEMANTIC_PROFILE_V01.integrity.fingerprint,
    "sha256:795aefcda75d4b169dec3df4db3b3b30fc583c7202f1be7fc9eb6b809a694529",
  );
  assert.equal(
    codexRuntimeCompatibilityProfileFingerprintV01({
      profile_id: profile.profile_id,
      profile_schema_version: profile.profile_schema_version,
      semantics: reverseObjectInsertionOrderV01(profile.semantics),
    }),
    profile.fingerprint,
  );
  const serialized = canonicalizeProtocolValueV01(profile.semantics);
  for (const artifactSpecificValue of [
    "0.152.1",
    "rust-v0.152.1",
    "5adb68a49933ae446bf11935662c83dba55a0804",
    "8194ea3181f330e63023b234b0b231855e5874e0331c5ef7cbc490591497a7bf",
    "codex-aarch64-apple-darwin.tar.gz",
  ])
    assert.equal(serialized.includes(artifactSpecificValue), false);
  assert.deepEqual(
    profile.semantics.initialization.ordering,
    [
      "initialize_request",
      "initialize_response",
      "selected_runtime_user_agent_validation",
      "initialized_notification",
      "lane_account_projection",
    ],
  );
  assert.deepEqual(
    profile.semantics.server_requests.approval_methods,
    [
      "item/commandExecution/requestApproval",
      "item/fileChange/requestApproval",
      "item/permissions/requestApproval",
    ],
  );
  assert.equal(profile.semantics.notifications.unknown_method, "fail_closed");
  assert.deepEqual(profile.semantics.notifications.required, ["turn/completed"]);
  assert.equal(profile.semantics.server_requests.unknown_method, "fail_closed");
  assert.equal(
    profile.semantics.sandbox_tool_effect_contract.danger_full_access,
    "forbidden",
  );
  assert.equal(
    profile.semantics.post_spawn_user_agent_validation.cli_version_binding,
    "selected_artifact_exact_version",
  );
}

function invalidRegistryMutationsFailClosedV01(): void {
  expectRegistryFailureV01((value) => {
    value.artifacts.push(structuredClone(value.artifacts[0]!));
  }, "codex_qualified_runtime_registry_duplicate_entry_id");
  expectRegistryFailureV01((value) => {
    const duplicate = structuredClone(value.artifacts[0]!);
    duplicate.entry_id = "codex-rust-v0.152.1-darwin-arm64-duplicate";
    value.artifacts.push(duplicate);
  }, "codex_qualified_runtime_registry_duplicate_artifact_tuple");
  expectRegistryFailureV01((value) => {
    value.artifacts[0]!.compatibility_profile_id = "missing-profile";
  }, "codex_qualified_runtime_registry_profile_missing");
  expectRegistryFailureV01((value) => {
    value.artifacts[0]!.compatibility_profile_fingerprint = `sha256:${"0".repeat(64)}`;
  }, "codex_qualified_runtime_registry_profile_reference_mismatch");
  expectRegistryFailureV01((value) => {
    value.compatibility_profiles[0]!.semantics.notifications.unknown_method =
      "accept";
  }, "codex_runtime_compatibility_profile_notification_invalid");
  expectRegistryFailureV01((value) => {
    value.compatibility_profiles[0]!.semantics.required_app_server_methods[0]
      .response_contract = "object_with_changed_runtime_user_agent";
  }, "codex_runtime_compatibility_profile_fingerprint_mismatch");
  expectRegistryFailureV01((value) => {
    const profile = value.compatibility_profiles[0]!;
    profile.semantics.required_app_server_methods[0].response_contract =
      "object_for_artifact_version_0.153.0";
    profile.fingerprint = codexRuntimeCompatibilityProfileFingerprintV01({
      profile_id: profile.profile_id,
      profile_schema_version: profile.profile_schema_version,
      semantics: profile.semantics,
    });
  }, "codex_runtime_compatibility_profile_artifact_identity_forbidden");
  expectRegistryFailureV01((value) => {
    value.compatibility_profiles[0]!.semantics.response_decoding.required_fields =
      "accept_missing";
  }, "codex_runtime_compatibility_profile_response_decoding_invalid");
  expectRegistryFailureV01((value) => {
    value.artifacts[0]!.native_executable_sha256 = "sha256:not-a-digest";
  }, "codex_qualified_runtime_registry_artifact_invalid");
  expectRegistryFailureV01((value) => {
    value.artifacts[0]!.qualified_provenance_asset.asset_id = 0;
  }, "codex_qualified_runtime_registry_asset_invalid");
  expectRegistryFailureV01((value) => {
    value.artifacts[0]!.official_release.repository = "example/codex";
    value.artifacts[0]!.official_release.url =
      "https://github.com/example/codex/releases/tag/rust-v0.152.1";
  }, "codex_qualified_runtime_registry_release_invalid");
  expectRegistryFailureV01((value) => {
    value.artifacts[0]!.qualified_provenance_asset.asset_name =
      "codex-package-aarch64-apple-darwin.tar.gz";
  }, "codex_qualified_runtime_registry_asset_invalid");
  expectRegistryFailureV01((value) => {
    value.artifacts[0]!.qualified_provenance_asset.acquisition_route =
      "unreviewed_package_archive";
  }, "codex_qualified_runtime_registry_asset_invalid");
  expectRegistryFailureV01((value) => {
    value.artifacts[0]!.provenance_method.method = "invented_signature";
  }, "codex_qualified_runtime_registry_provenance_invalid");
  expectRegistryFailureV01((value) => {
    value.artifacts[0]!.upstream_target_triple = "x86_64-apple-darwin";
  }, "codex_qualified_runtime_registry_platform_invalid");
  expectRegistryFailureV01((value) => {
    value.artifacts[0]!.lanes.ordinary_chatgpt_auth.status = "accepted";
  }, "codex_qualified_runtime_registry_lane_invalid");
  expectRegistryFailureV01((value) => {
    value.production_selection.entry_id = "missing-entry";
  }, "codex_qualified_runtime_registry_selection_missing");
}

function laneSelectionIsIndependentV01(): void {
  assert.equal(selected.artifact.version, "0.152.1");
  assert.equal(selected.artifact.lanes.ordinary_chatgpt_auth.status, "qualified");
  assert.equal(selected.artifact.lanes.strict_agent_identity.status, "hold");
  expectSelectionFailureV01(
    () =>
      selectPinnedCodexQualifiedRuntimeV01({
        lane: "strict_agent_identity",
        observed_at: "2026-09-03T01:17:35.000Z",
      }),
    "codex_qualified_runtime_registry_lane_not_qualified",
  );
  assert.equal(
    CODEX_ISOLATED_AUTH_PRODUCTION_SELECTION_V01.selected_registry_entry_id,
    selected.artifact.entry_id,
  );
  assert.equal(
    CODEX_ISOLATED_AUTH_PRODUCTION_SELECTION_V01
      .selected_compatibility_profile_fingerprint,
    selected.compatibility_profile.fingerprint,
  );
  assert.equal(
    registry.artifacts.some((artifact) => artifact.version === "0.153.0"),
    false,
  );
}

function revocationExpiryAndSecurityFloorFailClosedV01(): void {
  const revoked = mutableRegistryV01();
  revoked.artifacts[0]!.revocation = {
    revoked_at: "2026-09-03T02:00:00.000Z",
    reason: "synthetic_registry_test_revocation",
    evidence_refs: ["test:synthetic-revocation"],
  };
  expectSelectionFailureV01(
    () =>
      selectPinnedCodexQualifiedRuntimeV01({
        registry: revoked,
        observed_at: "2026-09-03T02:00:00.000Z",
      }),
    "codex_qualified_runtime_registry_selection_revoked",
  );

  const expired = mutableRegistryV01();
  expired.artifacts[0]!.not_after = "2026-09-03T01:17:35.000Z";
  expectSelectionFailureV01(
    () =>
      selectPinnedCodexQualifiedRuntimeV01({
        registry: expired,
        observed_at: "2026-09-03T01:17:35.000Z",
      }),
    "codex_qualified_runtime_registry_selection_expired",
  );

  const belowFloor = mutableRegistryV01();
  belowFloor.artifacts[0]!.security_floor = {
    floor_id: "synthetic-floor",
    evaluation: "unsatisfied",
    evidence_refs: ["test:synthetic-floor"],
  };
  expectSelectionFailureV01(
    () =>
      selectPinnedCodexQualifiedRuntimeV01({
        registry: belowFloor,
        observed_at: "2026-09-03T01:17:35.000Z",
      }),
    "codex_qualified_runtime_registry_security_floor_unsatisfied",
  );

  const ordinaryHold = mutableRegistryV01();
  ordinaryHold.artifacts[0]!.lanes.ordinary_chatgpt_auth = {
    ...ordinaryHold.artifacts[0]!.lanes.ordinary_chatgpt_auth,
    status: "hold",
    qualified_at: null,
  };
  expectSelectionFailureV01(
    () => selectPinnedCodexQualifiedRuntimeV01({ registry: ordinaryHold }),
    "codex_qualified_runtime_registry_lane_not_qualified",
  );
}

function manifestIsReviewControlledAndRuntimeImmutableV01(): void {
  assert.equal(Object.isFrozen(registry), true);
  assert.equal(Object.isFrozen(registry.artifacts), true);
  assert.equal(Object.isFrozen(registry.artifacts[0]!.lanes), true);
  assert.equal(Object.isFrozen(registry.compatibility_profiles[0]!.semantics), true);
  const before = canonicalizeProtocolValueV01(registry);
  assert.throws(() => {
    (registry.artifacts[0] as { version: string }).version = "0.153.0";
  }, TypeError);
  const qualificationOutput = mutableRegistryV01();
  qualificationOutput.artifacts[0]!.version = "0.153.0";
  assert.equal(canonicalizeProtocolValueV01(registry), before);
  assert.equal(selected.artifact.version, "0.152.1");
  const ownerSource = readFileSync(
    path.join(
      process.cwd(),
      "lib/vnext/native-host/codex-qualified-runtime-registry.ts",
    ),
    "utf8",
  );
  assert.equal(ownerSource.includes("writeFile"), false);
  assert.equal(ownerSource.includes("appendFile"), false);
  assert.equal(
    registry.authority.qualification_receipts,
    "evidence_only",
  );
}

type MutableRegistryV01 = ReturnType<typeof mutableRegistryV01>;

function mutableRegistryV01(): {
  registry_schema_version: string;
  authority: Record<string, unknown>;
  compatibility_profiles: Array<{
    profile_id: string;
    profile_schema_version: string;
    fingerprint: string;
    semantics: Record<string, any>;
  }>;
  artifacts: Array<Record<string, any>>;
  production_selection: Record<string, any>;
} {
  return JSON.parse(JSON.stringify(registry));
}

function expectRegistryFailureV01(
  mutate: (registry: MutableRegistryV01) => void,
  code: string,
): void {
  const value = mutableRegistryV01();
  mutate(value);
  assert.throws(
    () => validateCodexQualifiedRuntimeRegistryV01(value),
    (error: unknown) =>
      error instanceof CodexQualifiedRuntimeRegistryErrorV01 &&
      error.code === code,
  );
}

function expectSelectionFailureV01(action: () => unknown, code: string): void {
  assert.throws(
    action,
    (error: unknown) =>
      error instanceof CodexQualifiedRuntimeRegistryErrorV01 &&
      error.code === code,
  );
}

function reverseObjectInsertionOrderV01(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(reverseObjectInsertionOrderV01);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .reverse()
      .map(([key, child]) => [key, reverseObjectInsertionOrderV01(child)]),
  );
}
