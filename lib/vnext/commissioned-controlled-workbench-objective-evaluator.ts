import { execFileSync, type ExecFileSyncOptionsWithStringEncoding } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  buildCommissionedWorkObjectiveObservationV01,
  createCommissionedWorkRecordRefV01,
  type BuildCommissionedWorkObjectiveObservationInputV01,
} from "@/lib/vnext/commissioned-controlled-workbench";
import {
  canonicalizeProtocolValueV01,
  compareProtocolCodeUnitsV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import type {
  CommissionedWorkCaseCommitmentV01,
  CommissionedWorkCaseSourceV01,
  CommissionedWorkConditionV01,
  CommissionedWorkFamilyManifestV01,
  CommissionedWorkHoldoutVariantV01,
  CommissionedWorkObjectiveObservationV01,
  CommissionedWorkRecordRefV01,
} from "@/types/vnext/commissioned-controlled-workbench";
import type { NativeHostResultV01 } from "@/types/vnext/native-host-adapter";

export const COMMISSIONED_WORK_OBJECTIVE_EVALUATOR_VIEW_VERSION_V01 =
  "commissioned_work_objective_evaluator_view.v0.1" as const;
export const COMMISSIONED_WORK_OBJECTIVE_EVALUATOR_DECISION_VERSION_V01 =
  "commissioned_work_objective_evaluator_decision.v0.1" as const;

export interface CommissionedWorkObjectiveEvaluatorViewV01 {
  view_version: typeof COMMISSIONED_WORK_OBJECTIVE_EVALUATOR_VIEW_VERSION_V01;
  case_commitment_ref: CommissionedWorkRecordRefV01;
  evaluator_version: string;
  evaluator_role: CommissionedWorkFamilyManifestV01["outcome_evaluator"];
  workspace_id: string;
  project_id: string;
  case_id: string;
  episode_role: "predecessor" | "successor";
  run_ref_fingerprint: string;
  run_oracles: boolean;
  required_checks: Array<{
    check_id: string;
    oracle_relative_path: string;
  }>;
  current_source_relative_paths: string[];
  source_currentness_check_id: string;
  expected_success_diff: Array<{
    repository_relative_path: string;
    content_fingerprint: string;
  }>;
  negative_space_guards: Array<{
    guard_ref: CommissionedWorkCaseCommitmentV01["negative_space_guard_refs"][number];
    repository_relative_path: string;
    forbidden_fragment: string;
  }>;
  treatment_assignment_included: false;
  candidate_assignment_included: false;
  executor_self_report_is_outcome_truth: false;
  view_fingerprint: string;
}

export interface CommissionedWorkObjectiveEvaluatorDecisionV01 {
  decision_version: typeof COMMISSIONED_WORK_OBJECTIVE_EVALUATOR_DECISION_VERSION_V01;
  evaluator_view_fingerprint: string;
  observation_material: Omit<
    BuildCommissionedWorkObjectiveObservationInputV01,
    "case_commitment" | "condition" | "holdout_variant"
  >;
  treatment_assignment_observed: false;
  candidate_assignment_observed: false;
  sealed_before_unblinding: true;
  decision_fingerprint: string;
}

export function createCommissionedWorkObjectiveEvaluatorViewV01(input: {
  source: CommissionedWorkCaseSourceV01;
  commitment: CommissionedWorkCaseCommitmentV01;
  episode_role: "predecessor" | "successor";
  run_ref_fingerprint: string;
  evaluator_role: CommissionedWorkFamilyManifestV01["outcome_evaluator"];
  evaluator_version: string;
  workspace_id: string;
  project_id: string;
  run_oracles: boolean;
}): CommissionedWorkObjectiveEvaluatorViewV01 {
  const commitmentRef = createCommissionedWorkRecordRefV01({
    record_version: input.commitment.commitment_version,
    record_id: input.commitment.case_id,
    record_fingerprint: input.commitment.integrity.fingerprint,
  });
  const withoutFingerprint = {
    view_version: COMMISSIONED_WORK_OBJECTIVE_EVALUATOR_VIEW_VERSION_V01,
    case_commitment_ref: commitmentRef,
    evaluator_version: input.evaluator_version,
    evaluator_role: input.evaluator_role,
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    case_id: input.source.case_id,
    episode_role: input.episode_role,
    run_ref_fingerprint: input.run_ref_fingerprint,
    run_oracles: input.run_oracles,
    required_checks: input.source.required_checks.map((check) => ({
      check_id: check.check_id,
      oracle_relative_path: check.oracle_relative_path,
    })),
    current_source_relative_paths: [
      ...input.source.current_source_relative_paths,
    ].sort(compareProtocolCodeUnitsV01),
    source_currentness_check_id: input.source.source_currentness_check_id,
    expected_success_diff: input.source.expected_success_writes
      .map((write) => ({
        repository_relative_path: write.repository_relative_path,
        content_fingerprint: createProtocolSha256V01(write.content),
      }))
      .sort((left, right) =>
        compareProtocolCodeUnitsV01(
          left.repository_relative_path,
          right.repository_relative_path,
        ),
      ),
    negative_space_guards: input.source.negative_space_guards.map(
      (guard, index) => ({
        guard_ref: input.commitment.negative_space_guard_refs[index]!,
        repository_relative_path: guard.repository_relative_path,
        forbidden_fragment: guard.forbidden_fragment,
      }),
    ),
    treatment_assignment_included: false as const,
    candidate_assignment_included: false as const,
    executor_self_report_is_outcome_truth: false as const,
  };
  return {
    ...withoutFingerprint,
    view_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(withoutFingerprint),
    ),
  };
}

export function evaluateCommissionedWorkRepositoryBlindV01(input: {
  view: CommissionedWorkObjectiveEvaluatorViewV01;
  repository_root: string;
  episode_start_commit: string;
  result: Pick<NativeHostResultV01, "changed_files">;
  oracle_guard_path: string;
  network_attempt_log: string | null;
}): CommissionedWorkObjectiveEvaluatorDecisionV01 {
  assertExactViewV01(input.view);
  const changedPaths = gitV01(input.repository_root, [
    "diff",
    "--name-only",
    `${input.episode_start_commit}..HEAD`,
  ])
    .split("\n")
    .filter(Boolean)
    .sort(compareProtocolCodeUnitsV01);
  const checks = input.view.required_checks.map((check) => {
    const oraclePath = path.join(input.repository_root, check.oracle_relative_path);
    const commandFingerprint = createProtocolSha256V01(
      canonicalizeProtocolValueV01({
        runtime: process.execPath,
        oracle_relative_path: check.oracle_relative_path,
        oracle_content_fingerprint: createProtocolSha256V01(
          canonicalizeProtocolValueV01(readFileSync(oraclePath, "utf8")),
        ),
      }),
    );
    if (!input.view.run_oracles) {
      return {
        check_id: check.check_id,
        disposition: "skipped" as const,
        command_fingerprint: null,
        exit_code: null,
      };
    }
    try {
      runOracleV01({
        repository_root: input.repository_root,
        oracle_relative_path: check.oracle_relative_path,
        oracle_guard_path: input.oracle_guard_path,
        network_attempt_log: input.network_attempt_log,
      });
      return {
        check_id: check.check_id,
        disposition: "passed" as const,
        command_fingerprint: commandFingerprint,
        exit_code: 0,
      };
    } catch (error) {
      const exitCode =
        typeof error === "object" &&
        error !== null &&
        "status" in error &&
        typeof error.status === "number"
          ? error.status
          : 1;
      return {
        check_id: check.check_id,
        disposition: "failed" as const,
        command_fingerprint: commandFingerprint,
        exit_code: exitCode,
      };
    }
  });
  const guardObservations = input.view.negative_space_guards.map((guard) => ({
    guard_ref: guard.guard_ref,
    status: readFileSync(
      path.join(input.repository_root, guard.repository_relative_path),
      "utf8",
    ).includes(guard.forbidden_fragment)
      ? ("revived" as const)
      : ("preserved" as const),
  }));
  const currentSourceFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01(
      input.view.current_source_relative_paths.map((repositoryRelativePath) => ({
        repository_relative_path: repositoryRelativePath,
        content_fingerprint: createProtocolSha256V01(
          canonicalizeProtocolValueV01(
            readFileSync(
              path.join(input.repository_root, repositoryRelativePath),
              "utf8",
            ),
          ),
        ),
      })),
    ),
  );
  const currentnessCheck = checks.find(
    (check) => check.check_id === input.view.source_currentness_check_id,
  );
  const actualDiff = changedPaths.map((repositoryRelativePath) => ({
    repository_relative_path: repositoryRelativePath,
    content_fingerprint: createProtocolSha256V01(
      readFileSync(
        path.join(input.repository_root, repositoryRelativePath),
        "utf8",
      ),
    ),
  }));
  const recordedDiff = input.result.changed_files
    .map((changed) => ({
      repository_relative_path: changed.repository_relative_path,
      content_fingerprint:
        changed.after_hash ??
        createProtocolSha256V01(
          readFileSync(
            path.join(
              input.repository_root,
              changed.repository_relative_path,
            ),
            "utf8",
          ),
        ),
    }))
    .sort((left, right) =>
      compareProtocolCodeUnitsV01(
        left.repository_relative_path,
        right.repository_relative_path,
      ),
    );
  const expectedDiff =
    input.view.episode_role === "predecessor"
      ? recordedDiff
      : input.view.expected_success_diff;
  const diffCorrect =
    canonicalizeProtocolValueV01(actualDiff) ===
      canonicalizeProtocolValueV01(expectedDiff) &&
    canonicalizeProtocolValueV01(actualDiff) ===
      canonicalizeProtocolValueV01(recordedDiff);
  const observationMaterial: CommissionedWorkObjectiveEvaluatorDecisionV01["observation_material"] = {
    evaluator_version: input.view.evaluator_version,
    evaluator_role: input.view.evaluator_role,
    workspace_id: input.view.workspace_id,
    project_id: input.view.project_id,
    case_id: input.view.case_id,
    episode_role: input.view.episode_role,
    run_ref_fingerprint: input.view.run_ref_fingerprint,
    oracle_executed: input.view.run_oracles,
    repository_state_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01({
        head: gitV01(input.repository_root, ["rev-parse", "HEAD"]),
        tree: gitV01(input.repository_root, ["rev-parse", "HEAD^{tree}"]),
        changed_paths: changedPaths,
      }),
    ),
    current_source_fingerprint: currentSourceFingerprint,
    changed_path_fingerprints: changedPaths.map(createProtocolSha256V01),
    required_checks: checks,
    repository_diff_correctness: diffCorrect ? "passed" : "failed",
    verification_completeness: input.view.run_oracles ? "complete" : "incomplete",
    negative_space: {
      status: guardObservations.some((guard) => guard.status === "revived")
        ? "revived"
        : "preserved",
      violated_guard_fingerprints: guardObservations
        .filter((guard) => guard.status === "revived")
        .map((guard) => guard.guard_ref.content_fingerprint),
      guard_observations: guardObservations,
    },
    source_currentness:
      input.view.episode_role === "predecessor"
        ? "unknown"
        : currentnessCheck?.disposition === "passed"
          ? "current"
          : currentnessCheck?.disposition === "failed"
            ? "failed"
            : "unknown",
    project_scope: "exact",
    unauthorized_effects: {
      provider_calls_outside_authorization: 0,
      model_calls_outside_authorization: 0,
      network_calls_outside_authorization: 0,
      outside_root_writes: 0,
      product_database_writes: 0,
      core_writes: 0,
      proposal_writes: 0,
      review_decision_writes: 0,
      transition_writes: 0,
      policy_activations: 0,
      active_pointer_writes: 0,
      github_writes: 0,
    },
  };
  const withoutFingerprint = {
    decision_version: COMMISSIONED_WORK_OBJECTIVE_EVALUATOR_DECISION_VERSION_V01,
    evaluator_view_fingerprint: input.view.view_fingerprint,
    observation_material: observationMaterial,
    treatment_assignment_observed: false as const,
    candidate_assignment_observed: false as const,
    sealed_before_unblinding: true as const,
  };
  return {
    ...withoutFingerprint,
    decision_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(withoutFingerprint),
    ),
  };
}

export function buildCommissionedWorkObjectiveObservationFromDecisionV01(input: {
  decision: CommissionedWorkObjectiveEvaluatorDecisionV01;
  commitment: CommissionedWorkCaseCommitmentV01;
  condition: CommissionedWorkConditionV01 | null;
  holdout_variant: CommissionedWorkHoldoutVariantV01 | null;
}): CommissionedWorkObjectiveObservationV01 {
  const commitmentRef = createCommissionedWorkRecordRefV01({
    record_version: input.commitment.commitment_version,
    record_id: input.commitment.case_id,
    record_fingerprint: input.commitment.integrity.fingerprint,
  });
  if (
    input.decision.decision_fingerprint !==
      createProtocolSha256V01(
        canonicalizeProtocolValueV01({
          decision_version: input.decision.decision_version,
          evaluator_view_fingerprint: input.decision.evaluator_view_fingerprint,
          observation_material: input.decision.observation_material,
          treatment_assignment_observed: false,
          candidate_assignment_observed: false,
          sealed_before_unblinding: true,
        }),
      ) ||
    input.decision.observation_material.case_id !== input.commitment.case_id ||
    commitmentRef.record_fingerprint === ""
  ) {
    throw new Error("commissioned_work_objective_decision_binding_invalid");
  }
  return buildCommissionedWorkObjectiveObservationV01({
    case_commitment: input.commitment,
    ...input.decision.observation_material,
    condition: input.condition,
    holdout_variant: input.holdout_variant,
  });
}

function assertExactViewV01(view: CommissionedWorkObjectiveEvaluatorViewV01): void {
  const { view_fingerprint: _ignored, ...withoutFingerprint } = view;
  if (
    view.treatment_assignment_included !== false ||
    view.candidate_assignment_included !== false ||
    view.executor_self_report_is_outcome_truth !== false ||
    view.view_fingerprint !==
      createProtocolSha256V01(canonicalizeProtocolValueV01(withoutFingerprint)) ||
    Object.keys(view).some((key) =>
      ["condition", "holdout_variant", "candidate", "executor_claim"].includes(
        key,
      ),
    )
  ) {
    throw new Error("commissioned_work_objective_evaluator_view_invalid");
  }
}

function runOracleV01(input: {
  repository_root: string;
  oracle_relative_path: string;
  oracle_guard_path: string;
  network_attempt_log: string | null;
}): void {
  const before =
    input.network_attempt_log && existsSync(input.network_attempt_log)
      ? readFileSync(input.network_attempt_log, "utf8")
      : "";
  const options: ExecFileSyncOptionsWithStringEncoding = {
    cwd: input.repository_root,
    env: {
      NODE_ENV: "test",
      HOME: process.env.HOME,
      PATH: process.env.PATH,
      TMPDIR: process.env.TMPDIR,
      LANG: "C",
      LC_ALL: "C",
      AUGNES_CW1_NETWORK_ATTEMPT_LOG:
        input.network_attempt_log ?? undefined,
    },
    encoding: "utf8",
    stdio: ["ignore", "ignore", "ignore"],
    timeout: 5_000,
  };
  execFileSync(
    process.execPath,
    ["--import", input.oracle_guard_path, input.oracle_relative_path],
    options,
  );
  if (input.network_attempt_log) {
    const after = existsSync(input.network_attempt_log)
      ? readFileSync(input.network_attempt_log, "utf8")
      : "";
    if (after !== before) {
      throw new Error("commissioned_work_objective_oracle_network_attempted");
    }
  }
}

function gitV01(root: string, args: string[]): string {
  return execFileSync("git", args, {
    cwd: root,
    env: {
      NODE_ENV: "test",
      HOME: process.env.HOME,
      PATH: process.env.PATH,
      TMPDIR: process.env.TMPDIR,
      LANG: "C",
      LC_ALL: "C",
      GIT_CONFIG_NOSYSTEM: "1",
      GIT_TERMINAL_PROMPT: "0",
      GIT_ALLOW_PROTOCOL: "file",
    },
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 10_000,
  }).trim();
}
