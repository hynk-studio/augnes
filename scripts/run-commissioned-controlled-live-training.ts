import { execFileSync } from "node:child_process";
import {
  chmodSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  assertCommissionedLiveTrainingAuthorizationCurrentV01,
  assertValidCommissionedLiveTrainingCohortPlanV01,
  buildCommissionedLiveTrainingCohortPlanV01,
} from "@/lib/vnext/commissioned-controlled-live-training";
import { validateCommissionedLiveTrainingArtifactsV01 } from "@/lib/vnext/commissioned-controlled-live-training-artifact-store";
import { executeCommissionedLiveTrainingCohortV01 } from "@/lib/vnext/commissioned-controlled-live-training-runner";
import {
  createCommissionedLiveTrainingProductionOwnerFactoryV01,
  parseCommissionedLiveTrainingProductionRuntimeAuthBindingV01,
} from "@/lib/vnext/commissioned-controlled-live-training-production-owner";
import { probeCodexIsolatedAuthCredentialFreeCompatibilityV01 } from "@/lib/vnext/native-host/codex-app-server-adapter";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import type {
  CommissionedWorkCaseSourceV01,
  CommissionedWorkFamilyManifestV01,
  CommissionedWorkRecordRefV01,
} from "@/types/vnext/commissioned-controlled-workbench";
import type {
  CommissionedLiveTrainingAuthorizationV01,
  CommissionedLiveTrainingCohortPlanV01,
  CommissionedLiveTrainingExactNativeExecutionConfigurationV01,
} from "@/types/vnext/commissioned-controlled-live-training";

type ModeV01 =
  | "plan-seal"
  | "validate-authorization"
  | "execute-training"
  | "validate-artifacts";

interface PlanInputV01 {
  family_manifest: CommissionedWorkFamilyManifestV01;
  training_cases: [
    CommissionedWorkCaseSourceV01,
    CommissionedWorkCaseSourceV01,
    CommissionedWorkCaseSourceV01,
  ];
  cohort_id: string;
  sealed_at: string;
}

interface AuthorizationValidationInputV01 {
  source_repository_root: string;
  authorization: CommissionedLiveTrainingAuthorizationV01;
  plan: CommissionedLiveTrainingCohortPlanV01;
  native_execution_configuration: CommissionedLiveTrainingExactNativeExecutionConfigurationV01;
  current_main_sha: string;
  current_main_tree: string;
  evaluated_at: string;
}

interface ExecutionInputV01 extends AuthorizationValidationInputV01 {
  source_repository_root: string;
  artifact_repository_root: string;
  family_manifest: CommissionedWorkFamilyManifestV01;
  training_cases: PlanInputV01["training_cases"];
  consumer_instance_ref: CommissionedWorkRecordRefV01;
  native_host_executable_path: string;
}

interface ArtifactValidationInputV01 {
  repository_root: string;
  relative_run_root: string;
  expected_authorization_fingerprint: string;
  expected_plan_fingerprint: string;
  expected_completion_witness_fingerprint: string;
}

async function main(): Promise<void> {
  const mode = process.argv[2] as ModeV01 | undefined;
  const inputPath = process.argv[3];
  if (!mode || !inputPath || ![
    "plan-seal",
    "validate-authorization",
    "execute-training",
    "validate-artifacts",
  ].includes(mode)) {
    throw new Error("live_training_runner_explicit_mode_and_input_required");
  }
  const resolvedInput = path.resolve(inputPath);
  const value = JSON.parse(readFileSync(resolvedInput, "utf8")) as unknown;
  if (mode === "plan-seal") {
    assertExactInputKeysV01(value, [
      "family_manifest",
      "training_cases",
      "cohort_id",
      "sealed_at",
    ]);
    const input = value as unknown as PlanInputV01;
    const plan = buildCommissionedLiveTrainingCohortPlanV01({
      manifest: input.family_manifest,
      training_cases: input.training_cases,
      cohort_id: input.cohort_id,
      sealed_at: input.sealed_at,
    });
    const outputPath = process.argv[4];
    if (!outputPath) throw new Error("live_training_plan_output_path_required");
    writeFileSync(path.resolve(outputPath), canonicalizeProtocolValueV01(plan), {
      encoding: "utf8",
      mode: 0o600,
      flag: "wx",
    });
    process.stdout.write(`${JSON.stringify({
      mode,
      plan_fingerprint: plan.integrity.fingerprint,
      schedule_fingerprint: plan.schedule_fingerprint,
      primary_episode_slots: plan.slots.length,
      holdout_materialized: false,
    })}\n`);
    return;
  }
  if (mode === "validate-authorization") {
    assertExactInputKeysV01(value, [
      "source_repository_root",
      "authorization",
      "plan",
      "native_execution_configuration",
      "current_main_sha",
      "current_main_tree",
      "evaluated_at",
    ]);
    const input = value as unknown as AuthorizationValidationInputV01;
    const sourceIdentity = observeExactExecutionSourceV01(
      input.source_repository_root,
    );
    assertCommissionedLiveTrainingAuthorizationCurrentV01({
      authorization: input.authorization,
      plan: input.plan,
      current_main_sha: input.current_main_sha,
      current_main_tree: input.current_main_tree,
      checkout_root_fingerprint: createProtocolSha256V01(
        canonicalizeProtocolValueV01(sourceIdentity.root),
      ),
      evaluated_at: input.evaluated_at,
      native_execution_configuration: input.native_execution_configuration,
      codex_environment_binding: input.authorization.codex_environment_binding,
      allow_test_conformance: false,
    });
    process.stdout.write(`${JSON.stringify({
      mode,
      status: "valid",
      authorization_fingerprint: input.authorization.integrity.fingerprint,
      plan_fingerprint: input.plan.integrity.fingerprint,
      live_execution_started: false,
    })}\n`);
    return;
  }
  if (mode === "validate-artifacts") {
    assertExactInputKeysV01(value, [
      "repository_root",
      "relative_run_root",
      "expected_authorization_fingerprint",
      "expected_plan_fingerprint",
      "expected_completion_witness_fingerprint",
    ]);
    const input = value as unknown as ArtifactValidationInputV01;
    const index = validateCommissionedLiveTrainingArtifactsV01(input);
    process.stdout.write(`${JSON.stringify({
      mode,
      status: "valid",
      index_fingerprint: index.integrity.fingerprint,
      artifact_slots: index.artifacts.length,
      holdout_materialized: index.holdout_materialized,
    })}\n`);
    return;
  }
  assertExactInputKeysV01(value, [
    "source_repository_root",
    "artifact_repository_root",
    "family_manifest",
    "training_cases",
    "authorization",
    "plan",
    "native_execution_configuration",
    "current_main_sha",
    "current_main_tree",
    "evaluated_at",
    "consumer_instance_ref",
    "native_host_executable_path",
  ]);
  const input = value as unknown as ExecutionInputV01;
  assertValidCommissionedLiveTrainingCohortPlanV01(input.plan);
  if (input.authorization.authorization_kind !== "future_live_execution") {
    throw new Error("live_training_cli_test_authorization_execution_refused");
  }
  const sourceIdentity = observeExactExecutionSourceV01(
    input.source_repository_root,
  );
  if (
    sourceIdentity.head !== input.current_main_sha ||
    sourceIdentity.tree !== input.current_main_tree ||
    sourceIdentity.head !== input.authorization.source_binding.main_sha ||
    sourceIdentity.tree !== input.authorization.source_binding.main_tree ||
    sourceIdentity.branch !== "main" ||
    sourceIdentity.origin_main !== sourceIdentity.head ||
    sourceIdentity.clean !== true ||
    sourceIdentity.origin !== "hynk-studio/augnes" ||
    realpathSync(input.artifact_repository_root) !== sourceIdentity.root
  ) {
    throw new Error("live_training_cli_exact_source_or_artifact_root_mismatch");
  }
  const nonce = takePrivateEnvironmentValueV01(
    "AUGNES_CW1_L1_AUTHORIZATION_NONCE",
    "live_training_authorization_nonce_environment_missing",
  );
  const runtimeAuthBinding =
    parseCommissionedLiveTrainingProductionRuntimeAuthBindingV01(
      JSON.parse(
        takePrivateEnvironmentValueV01(
          "AUGNES_CW1_L1_RUNTIME_AUTH_BINDING_JSON",
          "live_training_runtime_auth_binding_environment_missing",
        ),
      ) as unknown,
    );
  const sourceCodexHome = takePrivateEnvironmentValueV01(
    "AUGNES_CW1_L1_CODEX_AUTH_SOURCE_HOME",
    "live_training_codex_auth_source_home_environment_missing",
  );
  const isolatedRuntimeParent = realpathSync(
    takePrivateEnvironmentValueV01(
      "AUGNES_CW1_L1_ISOLATED_RUNTIME_PARENT",
      "live_training_isolated_runtime_parent_environment_missing",
    ),
  );
  const compatibilityParent = mkdtempSync(
    path.join(os.tmpdir(), "augnes-cw1-l1-compatibility-"),
  );
  chmodSync(compatibilityParent, 0o700);
  let currentCompatibility;
  try {
    currentCompatibility =
      await probeCodexIsolatedAuthCredentialFreeCompatibilityV01({
        command: input.native_host_executable_path,
        expected_executable_fingerprint:
          input.authorization.codex_environment_binding
            .codex_executable_fingerprint,
        executable_identity_class: "production_pinned_codex",
        state_parent: realpathSync(compatibilityParent),
        repository_root: sourceIdentity.root,
        base_environment: {
          PATH: process.env.PATH,
          LANG: "C",
          TZ: "UTC",
          NO_COLOR: "1",
        },
      });
  } finally {
    rmSync(compatibilityParent, { recursive: true, force: false });
  }
  const createOwner =
    createCommissionedLiveTrainingProductionOwnerFactoryV01({
      authorization: input.authorization,
      native_execution_configuration: input.native_execution_configuration,
      runtime_auth_binding: runtimeAuthBinding,
      executable_path: input.native_host_executable_path,
      source_codex_home: sourceCodexHome,
    });
  const result = await executeCommissionedLiveTrainingCohortV01({
    source_repository_root: input.source_repository_root,
    artifact_repository_root: input.artifact_repository_root,
    manifest: input.family_manifest,
    training_cases: input.training_cases,
    plan: input.plan,
    authorization: input.authorization,
    authorization_nonce: nonce,
    native_execution_configuration: input.native_execution_configuration,
    current_main_sha: input.current_main_sha,
    current_main_tree: input.current_main_tree,
    consumer_instance_ref: input.consumer_instance_ref,
    execution_started_at: new Date().toISOString(),
    credential_free_compatibility_observation: currentCompatibility,
    isolated_runtime_parent: isolatedRuntimeParent,
    native_host_executable_path: input.native_host_executable_path,
    create_isolated_authenticated_execution_owner: createOwner,
  });
  process.stdout.write(`${JSON.stringify({
    mode,
    status: "completed",
    authorization_fingerprint: result.authorization_fingerprint,
    schedule_fingerprint: result.schedule_fingerprint,
    artifact_index_fingerprint: result.artifact_summary.index_fingerprint,
    valid_primary_episodes:
      result.valid_predecessor_episodes + result.valid_successor_episodes,
    holdout_materialized: result.holdout_materialized,
    fake_output_is_behavioral_evidence: result.fake_output_is_behavioral_evidence,
    cleanup_complete: result.cleanup_complete,
  })}\n`);
}

function takePrivateEnvironmentValueV01(name: string, errorCode: string): string {
  const value = process.env[name];
  delete process.env[name];
  if (!value) throw new Error(errorCode);
  return value;
}

function assertExactInputKeysV01(
  value: unknown,
  expectedKeys: string[],
): asserts value is Record<string, unknown> {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    throw new Error("live_training_cli_input_schema_invalid");
  }
  const actual = Object.keys(value).sort();
  const expected = [...expectedKeys].sort();
  if (canonicalizeProtocolValueV01(actual) !== canonicalizeProtocolValueV01(expected)) {
    throw new Error("live_training_cli_input_schema_invalid");
  }
}

function observeExactExecutionSourceV01(root: string): {
  root: string;
  head: string;
  tree: string;
  branch: string;
  origin_main: string;
  clean: boolean;
  origin: "hynk-studio/augnes" | "foreign";
} {
  const canonicalRoot = realpathSync(root);
  const git = (args: string[]): string =>
    execFileSync("git", ["-C", canonicalRoot, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  const observedRoot = realpathSync(git(["rev-parse", "--show-toplevel"]));
  if (observedRoot !== canonicalRoot) {
    throw new Error("live_training_cli_repository_root_mismatch");
  }
  const remote = git(["remote", "get-url", "origin"])
    .replace(/\.git$/u, "")
    .replace(/^git@github\.com:/u, "https://github.com/");
  return {
    root: canonicalRoot,
    head: git(["rev-parse", "HEAD"]),
    tree: git(["rev-parse", "HEAD^{tree}"]),
    branch: git(["symbolic-ref", "--short", "HEAD"]),
    origin_main: git(["rev-parse", "origin/main"]),
    clean: git(["status", "--porcelain=v1"]) === "",
    origin:
      remote === "https://github.com/hynk-studio/augnes"
        ? "hynk-studio/augnes"
        : "foreign",
  };
}

void main().catch((error: unknown) => {
  const code =
    error instanceof Error && /^[a-z0-9_:.-]{1,240}$/u.test(error.message)
      ? error.message
      : "live_training_runner_failed";
  process.stderr.write(`${code}\n`);
  process.exitCode = 1;
});
