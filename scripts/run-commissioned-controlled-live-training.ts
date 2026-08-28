import { execFileSync } from "node:child_process";
import { readFileSync, realpathSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  assertCommissionedLiveTrainingAuthorizationCurrentV01,
  assertValidCommissionedLiveTrainingCohortPlanV01,
  buildCommissionedLiveTrainingCohortPlanV01,
} from "@/lib/vnext/commissioned-controlled-live-training";
import { validateCommissionedLiveTrainingArtifactsV01 } from "@/lib/vnext/commissioned-controlled-live-training-artifact-store";
import { executeCommissionedLiveTrainingCohortV01 } from "@/lib/vnext/commissioned-controlled-live-training-runner";
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
    sourceIdentity.clean !== true ||
    sourceIdentity.origin !== "hynk-studio/augnes" ||
    realpathSync(input.artifact_repository_root) !== sourceIdentity.root
  ) {
    throw new Error("live_training_cli_exact_source_or_artifact_root_mismatch");
  }
  const nonce = process.env.AUGNES_CW1_L1_AUTHORIZATION_NONCE;
  if (!nonce) throw new Error("live_training_authorization_nonce_environment_missing");
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
    native_host_executable_path: input.native_host_executable_path,
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
