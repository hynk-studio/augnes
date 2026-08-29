import { execFileSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  assertCommissionedLiveTrainingExecutableIdentityV01,
  buildCommissionedLiveTrainingAnalysisJoinV01,
  buildCommissionedLiveTrainingApprovalObservationV01,
  buildCommissionedLiveTrainingAttemptAdmissionV01,
  buildCommissionedLiveTrainingAttemptStartV01,
  buildCommissionedLiveTrainingAttemptRegistryV01,
  buildCommissionedLiveTrainingAttemptTerminalV01,
  buildCommissionedLiveTrainingBlindObjectiveObservationV01,
  buildCommissionedLiveTrainingCandidateAssessmentV01,
  buildCommissionedLiveTrainingCleanupReportV01,
  buildCommissionedLiveTrainingCleanupObservationV01,
  buildCommissionedLiveTrainingCloneSealV01,
  buildCommissionedLiveTrainingCohortPlanV01,
  buildCommissionedLiveTrainingIsolationObservationV01,
  buildCommissionedLiveTrainingResultV01,
  commissionedLiveTrainingRecordRefV01,
  createCommissionedLiveTrainingAdapterBindingV01,
  createCommissionedLiveTrainingCommonRequestFingerprintV01,
  createCommissionedLiveTrainingObservedResourceLaneV01,
  createCommissionedLiveTrainingObservedSourcedResourceLaneV01,
  createCommissionedLiveTrainingRecordRefV01,
  createCommissionedLiveTrainingUnknownResourceLaneV01,
  createCommissionedLiveTrainingUnknownSourcedResourceLaneV01,
  assertCommissionedLiveTrainingNoResumeBoundaryV01,
  assertCommissionedLiveTrainingAttemptIdentitiesDistinctV01,
  assertCommissionedLiveTrainingExecutorVisibleMaterialV01,
  assertCommissionedLiveTrainingInvocationGateV01,
  assertCommissionedLiveTrainingResourceCeilingsV01,
  assertValidCommissionedLiveTrainingCohortPlanV01,
} from "@/lib/vnext/commissioned-controlled-live-training";
import {
  appendCommissionedLiveTrainingAttemptAdmissionV01,
  appendCommissionedLiveTrainingCloneSealV01,
  appendCommissionedLiveTrainingCompletedEpisodeV01,
  appendCommissionedLiveTrainingPredecessorCheckpointV01,
  appendCommissionedLiveTrainingAttemptStartV01,
  appendCommissionedLiveTrainingAttemptTerminalV01,
  consumeCommissionedLiveTrainingAuthorizationV01,
  openCommissionedLiveTrainingArtifactStoreV01,
  writeCommissionedLiveTrainingArtifactsV01,
  writeCommissionedLiveTrainingIncompleteArtifactsV01,
  type CommissionedLiveTrainingArtifactStoreInitializationV01,
  type CommissionedLiveTrainingArtifactWriteSummaryV01,
} from "@/lib/vnext/commissioned-controlled-live-training-artifact-store";
import {
  createCommissionedLiveTrainingExternalExecutionAuthorizationV01,
  createCommissionedLiveTrainingTestExecutionAuthorizationV01,
} from "@/lib/vnext/commissioned-controlled-live-training-execution-authorization";
import {
  admitCommissionedWorkExecutorResultV01,
  assertValidCommissionedWorkEpisodeArtifactV01,
  buildCommissionedWorkCommissionedAgentExecutionObservationV01,
  buildCommissionedWorkEpisodeArtifactV01,
  buildCommissionedWorkEpisodeCheckpointV01,
  buildCommissionedWorkNativeHostRequestV01,
  createCommissionedWorkCommissionedAgentHostRefBindingsV01,
  buildCommissionedWorkRunReceiptV01,
  buildCommissionedWorkTaskContextPacketV01,
  buildCommissionedWorkTrainingResultV01,
  createCommissionedWorkAuthorizationResourceCeilingV01,
  createCommissionedWorkNativeHostRefSetFingerprintV01,
  createCommissionedWorkPacketMaterialSetFingerprintV01,
  createCommissionedWorkRecordRefV01,
  createCommissionedWorkRoleRefV01,
} from "@/lib/vnext/commissioned-controlled-workbench";
import {
  buildCommissionedWorkObjectiveObservationFromDecisionV01,
  createCommissionedWorkObjectiveEvaluatorViewV01,
  evaluateCommissionedWorkRepositoryBlindV01,
} from "@/lib/vnext/commissioned-controlled-workbench-objective-evaluator";
import {
  createCodexAppServerAdapterV01,
  type CodexAppServerAdapterObservationV01,
} from "@/lib/vnext/native-host/codex-app-server-adapter";
import type { CodexIsolatedAuthenticatedExecutionOwnerV01 } from "@/lib/vnext/native-host/codex-isolated-auth-projection";
import type {
  CodexIsolatedAuthCredentialFreePreflightV01,
  CodexIsolatedAuthObservationV01,
} from "@/types/vnext/codex-isolated-auth-projection";
import { NativeHostReconciliationRequiredErrorV01 } from "@/lib/vnext/native-host/native-host-contract";
import {
  canonicalizeProtocolValueV01,
  compareProtocolCodeUnitsV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import {
  COMMISSIONED_WORK_COMMISSIONED_AGENT_CONFORMANCE_EVIDENCE_CLASS_V01,
  COMMISSIONED_WORK_COMMISSIONED_AGENT_OBSERVATION_EVIDENCE_CLASS_V01,
} from "@/types/vnext/commissioned-controlled-workbench";
import type {
  CommissionedWorkCaseCommitmentV01,
  CommissionedWorkCaseSourceV01,
  CommissionedWorkConditionV01,
  CommissionedWorkEpisodeArtifactV01,
  CommissionedWorkEpisodeCheckpointV01,
  CommissionedWorkEpisodePlanSourceV01,
  CommissionedWorkFamilyManifestV01,
  CommissionedWorkObjectiveObservationV01,
  CommissionedWorkRecordRefV01,
  CommissionedWorkRuntimeBindingV01,
  CommissionedWorkSuccessorPlanSourceV01,
} from "@/types/vnext/commissioned-controlled-workbench";
import {
  COMMISSIONED_LIVE_TRAINING_REPLACEMENT_LIMIT_V01,
  type CommissionedLiveTrainingAnalysisJoinV01,
  type CommissionedLiveTrainingArtifactsV01,
  type CommissionedLiveTrainingAttemptAdmissionV01,
  type CommissionedLiveTrainingAttemptStartV01,
  type CommissionedLiveTrainingAttemptTerminalV01,
  type CommissionedLiveTrainingAuthorizationV01,
  type CommissionedLiveTrainingBlindObjectiveObservationV01,
  type CommissionedLiveTrainingCloneSealV01,
  type CommissionedLiveTrainingCohortPlanV01,
  type CommissionedLiveTrainingSourcedResourceLaneV01,
  type CommissionedLiveTrainingExactNativeExecutionConfigurationV01,
  type CommissionedLiveTrainingExecutableIdentityV01,
  type CommissionedLiveTrainingRuntimeConsumptionWitnessV01,
  type CommissionedLiveTrainingScheduleSlotV01,
} from "@/types/vnext/commissioned-controlled-live-training";
/*
 * Types above remain explicit because this runner is the only execution owner;
 * none of these records are inferred from an open metadata bag.
 */
import type {
  NativeHostApprovalRequestV01,
  NativeHostLifecycleEventV01,
  NativeHostResultV01,
} from "@/types/vnext/native-host-adapter";

export interface CommissionedLiveTrainingTestFixtureOutputV01 {
  executor_role_id: string;
  pre_action_infrastructure_failure_on_primary?: true;
  pre_action_infrastructure_failure_on_replacement?: true;
  writes: Array<{
    repository_relative_path: string;
    content: string;
  }>;
}

export function observeCommissionedLiveTrainingExecutableIdentityV01(input: {
  executable_path: string;
  executable_kind: CommissionedLiveTrainingExecutableIdentityV01["executable_kind"];
}): CommissionedLiveTrainingExecutableIdentityV01 {
  const exactPath = realpathSync(input.executable_path);
  const stat = statSync(exactPath, { bigint: true });
  if (!stat.isFile()) failV01("live_training_executable_not_file");
  const withoutRef = {
    identity_version: "commissioned_live_training_executable_identity.v0.1" as const,
    executable_kind: input.executable_kind,
    realpath_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(exactPath),
    ),
    content_fingerprint: createProtocolSha256V01(
      readFileSync(exactPath).toString("base64"),
    ),
    physical_identity_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01({
        device: String(stat.dev),
        inode: String(stat.ino),
        size: String(stat.size),
        mode: String(stat.mode),
      }),
    ),
  };
  const identity: CommissionedLiveTrainingExecutableIdentityV01 = {
    ...withoutRef,
    executable_ref: createCommissionedWorkRecordRefV01({
      record_version: withoutRef.identity_version,
      record_id: input.executable_kind,
      record_fingerprint: createProtocolSha256V01(
        canonicalizeProtocolValueV01(withoutRef),
      ),
    }),
  };
  assertCommissionedLiveTrainingExecutableIdentityV01(identity);
  return identity;
}

export interface ExecuteCommissionedLiveTrainingCohortInputV01 {
  source_repository_root: string;
  artifact_repository_root: string;
  manifest: CommissionedWorkFamilyManifestV01;
  training_cases: [
    CommissionedWorkCaseSourceV01,
    CommissionedWorkCaseSourceV01,
    CommissionedWorkCaseSourceV01,
  ];
  plan: CommissionedLiveTrainingCohortPlanV01;
  authorization: CommissionedLiveTrainingAuthorizationV01;
  authorization_nonce: string;
  native_execution_configuration: CommissionedLiveTrainingExactNativeExecutionConfigurationV01;
  current_main_sha: string;
  current_main_tree: string;
  consumer_instance_ref: CommissionedWorkRecordRefV01;
  execution_started_at: string;
  credential_free_compatibility_observation: CodexIsolatedAuthCredentialFreePreflightV01;
  isolated_runtime_parent: string;
  test_fixture_outputs?: CommissionedLiveTrainingTestFixtureOutputV01[];
  fake_app_server_path?: string;
  native_host_executable_path?: string;
  create_isolated_authenticated_execution_owner(input: {
    attempt_id: string;
    repository_root: string;
    state_parent: string;
    test_environment: Record<string, string | undefined>;
  }):
    | CodexIsolatedAuthenticatedExecutionOwnerV01
    | Promise<CodexIsolatedAuthenticatedExecutionOwnerV01>;
  test_failure_injection_stage?:
    | "after_authorization_consumption_before_temp_root"
    | "after_first_valid_episode"
    | "after_first_valid_successor"
    | "before_completion_artifact_write"
    | "after_completion_index_before_witness";
}

export interface ExecuteCommissionedLiveTrainingCohortResultV01 {
  artifacts: CommissionedLiveTrainingArtifactsV01;
  artifact_summary: CommissionedLiveTrainingArtifactWriteSummaryV01;
  schedule_fingerprint: string;
  authorization_fingerprint: string;
  valid_predecessor_episodes: 3;
  valid_successor_episodes: 12;
  provider_calls: CommissionedLiveTrainingSourcedResourceLaneV01;
  model_calls: CommissionedLiveTrainingSourcedResourceLaneV01;
  task_external_network: CommissionedLiveTrainingSourcedResourceLaneV01;
  holdout_materialized: false;
  fake_output_is_behavioral_evidence: false;
  cleanup_complete: true;
}

interface EpisodeExecutionV01 {
  slot: CommissionedLiveTrainingScheduleSlotV01;
  source: CommissionedWorkCaseSourceV01;
  plan: CommissionedWorkEpisodePlanSourceV01 | CommissionedWorkSuccessorPlanSourceV01;
  repository_root: string;
  attempt_start: CommissionedLiveTrainingAttemptStartV01;
  episode: CommissionedWorkEpisodeArtifactV01;
  blind_observation: CommissionedLiveTrainingBlindObjectiveObservationV01;
  admission: CommissionedLiveTrainingAttemptAdmissionV01;
  terminal: CommissionedLiveTrainingAttemptTerminalV01;
  lifecycle_events: NativeHostLifecycleEventV01[];
  adapter_settlement_fingerprint: string;
}

interface EpisodeFailureV01 {
  slot: CommissionedLiveTrainingScheduleSlotV01;
  source: CommissionedWorkCaseSourceV01;
  plan: CommissionedWorkEpisodePlanSourceV01 | CommissionedWorkSuccessorPlanSourceV01;
  repository_root: string;
  attempt_start: CommissionedLiveTrainingAttemptStartV01;
  admission: CommissionedLiveTrainingAttemptAdmissionV01;
  terminal: CommissionedLiveTrainingAttemptTerminalV01;
  lifecycle_events: NativeHostLifecycleEventV01[];
  adapter_settlement_fingerprint: string;
}

type EpisodeAttemptV01 = EpisodeExecutionV01 | EpisodeFailureV01;

interface AttemptIdentityV01 {
  attempt_id: string;
  attempt_kind: "primary" | "replacement";
  replacement_of_attempt_ref: CommissionedWorkRecordRefV01 | null;
  executor_role_ref: ReturnType<typeof createCommissionedWorkRoleRefV01>;
  episode_identity: string;
}

interface InvocationReservationV01 {
  ordinal: number;
  timeout_ms: number;
}

interface PreparedCaseV01 {
  source: CommissionedWorkCaseSourceV01;
  commitment: CommissionedWorkCaseCommitmentV01;
  predecessor: EpisodeExecutionV01;
  checkpoint: CommissionedWorkEpisodeCheckpointV01;
  clone_seal: CommissionedLiveTrainingCloneSealV01;
  successor_roots: Map<CommissionedWorkConditionV01, string>;
}

export async function executeCommissionedLiveTrainingCohortV01(
  input: ExecuteCommissionedLiveTrainingCohortInputV01,
): Promise<ExecuteCommissionedLiveTrainingCohortResultV01> {
  assertValidCommissionedLiveTrainingCohortPlanV01(input.plan);
  const rebuiltPlan = buildCommissionedLiveTrainingCohortPlanV01({
    manifest: input.manifest,
    training_cases: input.training_cases,
    cohort_id: input.plan.cohort_id,
    sealed_at: input.plan.sealed_at,
  });
  if (
    canonicalizeProtocolValueV01(rebuiltPlan) !==
    canonicalizeProtocolValueV01(input.plan)
  ) {
    failV01("live_training_runner_family_case_or_plan_binding_invalid");
  }
  if (
    input.manifest.family_id !== "cw1-family-fourfold-01" ||
    input.training_cases.some((source) => source.case_role !== "training") ||
    input.training_cases.some((source) => source.case_id.includes("quartz"))
  ) {
    failV01("live_training_runner_training_only_source_invalid");
  }
  const conformance = [
    "test_conformance",
    "future_live_control_flow_conformance",
  ].includes(input.authorization.authorization_kind);
  const executionStartedAt = conformance
    ? input.execution_started_at
    : new Date().toISOString();
  if (
    conformance !== (input.test_fixture_outputs !== undefined) ||
    conformance !== (input.fake_app_server_path !== undefined) ||
    conformance === (input.native_host_executable_path !== undefined)
  ) {
    failV01("live_training_runner_fixture_mode_binding_invalid");
  }
  if (!conformance && process.env.AUGNES_CANONICAL_TEST_MODE === "1") {
    failV01("live_training_future_execution_test_adapter_refused");
  }
  assertCurrentCredentialFreeCompatibilityV01({
    observation: input.credential_free_compatibility_observation,
    authorization: input.authorization,
  });
  if (
    !conformance &&
    Math.abs(
      Date.parse(executionStartedAt) -
        Date.parse(input.credential_free_compatibility_observation.observed_at),
    ) > 5 * 60 * 1_000
  )
    failV01("live_training_runtime_compatibility_observation_stale");
  if (
    input.test_failure_injection_stage !== undefined &&
    (!conformance || process.env.AUGNES_CANONICAL_TEST_MODE !== "1")
  ) {
    failV01("live_training_test_failure_injection_refused");
  }
  const observedCliIdentity =
    observeCommissionedLiveTrainingExecutableIdentityV01({
      executable_path: conformance
        ? input.fake_app_server_path!
        : input.native_host_executable_path!,
      executable_kind: conformance
        ? "test_fake_app_server"
        : "codex_app_server_cli",
    });
  const observedRuntimeIdentity =
    observeCommissionedLiveTrainingExecutableIdentityV01({
      executable_path: process.execPath,
      executable_kind: "node_runtime",
    });
  if (
    canonicalizeProtocolValueV01(observedCliIdentity) !==
      canonicalizeProtocolValueV01(
        input.native_execution_configuration.cli_executable_identity,
      ) ||
    canonicalizeProtocolValueV01(observedRuntimeIdentity) !==
      canonicalizeProtocolValueV01(
        input.native_execution_configuration.runtime_executable_identity,
      )
  ) {
    failV01("live_training_runner_executable_identity_drift");
  }
  const fixtureOutputs = new Map(
    (input.test_fixture_outputs ?? []).map((output) => [
      output.executor_role_id,
      output,
    ] as const),
  );
  if (
    conformance &&
    (fixtureOutputs.size !== 15 ||
      input.plan.slots.some(
        (slot) => !fixtureOutputs.has(slot.executor_role_ref.role_id),
      ))
  ) {
    failV01("live_training_runner_fixture_output_set_invalid");
  }
  const sourceRoot = realpathSync(input.source_repository_root);
  const artifactRoot = realpathSync(input.artifact_repository_root);
  const checkoutRootFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01(sourceRoot),
  );
  if (!conformance) {
    assertExactRunnerSourceIdentityV01({
      source_root: sourceRoot,
      expected_main_sha: input.current_main_sha,
      expected_main_tree: input.current_main_tree,
    });
  }
  const store = openCommissionedLiveTrainingArtifactStoreV01({
    repository_root: artifactRoot,
    plan: input.plan,
    authorization: input.authorization,
    family: input.manifest,
  });
  const consumption = consumeCommissionedLiveTrainingAuthorizationV01({
    store,
    authorization: input.authorization,
    plan: input.plan,
    native_execution_configuration: input.native_execution_configuration,
    current_main_sha: input.current_main_sha,
    current_main_tree: input.current_main_tree,
    checkout_root_fingerprint: checkoutRootFingerprint,
    evaluated_at: executionStartedAt,
    authorization_nonce: input.authorization_nonce,
    consumer_instance_ref: input.consumer_instance_ref,
    allow_test_conformance: conformance,
  });
  const authorizationConsumptionRef = createCommissionedLiveTrainingRecordRefV01({
    record_version: consumption.consumption.consumption_version,
    record_id: consumption.consumption.consumption_id,
    record_fingerprint: consumption.consumption.integrity.fingerprint,
  });
  const runtimeConsumptionWitness = consumption.runtime_witness;
  const clock = deterministicOrWallClockV01(executionStartedAt, conformance);
  const cohortMonotonicStartedAt = performance.now();
  const episodes: EpisodeExecutionV01[] = [];
  const attemptStarts: CommissionedLiveTrainingAttemptStartV01[] = [];
  const attemptAdmissions: CommissionedLiveTrainingAttemptAdmissionV01[] = [];
  const attemptTerminals: CommissionedLiveTrainingAttemptTerminalV01[] = [];
  const adapterSettlementFingerprints: string[] = [];
  const prepared = new Map<string, PreparedCaseV01>();
  let nativeHostInvocationsStarted = 0;
  let replacementInvocationsStarted = 0;
  const taskExternalNetworkObservation =
    createCommissionedLiveTrainingObservedSourcedResourceLaneV01(
      0,
      input.authorization.codex_environment_binding
        .task_network_enforcement_ref,
    );
  const zeroProviderObservationRef = createCommissionedWorkRecordRefV01({
    record_version: "commissioned_live_training_zero_provider_boundary.v0.1",
    record_id: `zero-provider-${input.plan.cohort_id}`,
    record_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01({
        authorization_fingerprint: input.authorization.integrity.fingerprint,
        cli_identity:
          input.native_execution_configuration.cli_executable_identity
            .executable_ref,
        provider_bearing_native_host_invocation_limit:
          input.authorization.provider_bearing_native_host_invocation_limit,
        model_bearing_native_host_invocation_limit:
          input.authorization.model_bearing_native_host_invocation_limit,
      }),
    ),
  });
  const providerCallsObservation = conformance
    ? createCommissionedLiveTrainingObservedSourcedResourceLaneV01(
        0,
        zeroProviderObservationRef,
      )
    : createCommissionedLiveTrainingUnknownSourcedResourceLaneV01();
  const modelCallsObservation = conformance
    ? createCommissionedLiveTrainingObservedSourcedResourceLaneV01(
        0,
        zeroProviderObservationRef,
      )
    : createCommissionedLiveTrainingUnknownSourcedResourceLaneV01();
  let cleaned = false;
  let tempRoot: string | null = null;
  let ownedRoots: Record<string, string> | null = null;
  const recordSettledAttempt = (attempt: EpisodeAttemptV01): void => {
    attemptStarts.push(attempt.attempt_start);
    attemptAdmissions.push(attempt.admission);
    attemptTerminals.push(attempt.terminal);
    adapterSettlementFingerprints.push(attempt.adapter_settlement_fingerprint);
  };
  const injectTestFailureV01 = (
    stage: NonNullable<
      ExecuteCommissionedLiveTrainingCohortInputV01["test_failure_injection_stage"]
    >,
  ): void => {
    if (input.test_failure_injection_stage === stage) {
      failV01(`live_training_test_failure_${stage}`);
    }
  };
  try {
    injectTestFailureV01("after_authorization_consumption_before_temp_root");
    tempRoot = mkdtempSync(
      path.join(
        realpathSync(input.isolated_runtime_parent),
        "augnes-cw1-l1-live-training-",
      ),
    );
    const oracleGuardPath = path.join(
      tempRoot,
      "zero-network-oracle-guard.mjs",
    );
    writeOracleGuardV01(oracleGuardPath, sourceRoot);
    const roots = {
      repositories: path.join(tempRoot, "repositories"),
      home: path.join(tempRoot, "home"),
      data: path.join(tempRoot, "data"),
      config: path.join(tempRoot, "config"),
      runtime: path.join(tempRoot, "runtime"),
      database: path.join(tempRoot, "database"),
      artifacts: path.join(tempRoot, "protocol-artifacts"),
      attempt_state: path.join(tempRoot, "attempt-state"),
      temp: path.join(tempRoot, "temp"),
    };
    ownedRoots = roots;
    Object.values(roots).forEach((root) =>
      mkdirSync(root, { recursive: true, mode: 0o700 }));
    for (const source of input.training_cases) {
      const predecessorSlot = input.plan.slots.find(
        (slot) => slot.case_id === source.case_id && slot.slot_role === "predecessor",
      );
      if (!predecessorSlot) failV01("live_training_runner_predecessor_slot_missing");
      const repositoryRoot = path.join(roots.repositories, `${source.case_id}-predecessor`);
      materializeInitialRepositoryV01(repositoryRoot, source, clock.now());
      const predecessorBaseline = observeAttemptCloneBaselineV01({
        repository_root: repositoryRoot,
        source_case_id: source.case_id,
        slot_id: predecessorSlot.slot_id,
        current_source_fingerprint: currentSourceFingerprintV01(
          repositoryRoot,
          source,
        ),
        common_request_fingerprint:
          createCommissionedLiveTrainingCommonRequestFingerprintV01({
            case_id: source.case_id as CommissionedLiveTrainingCloneSealV01["case_id"],
            packet_task: source.task,
            required_checks: source.required_checks.map((check) => check.check_id),
            operation_contract: source.predecessor_plan.operation_contract,
            post_drift_head: gitV01(repositoryRoot, ["rev-parse", "HEAD"]),
            post_drift_tree: gitV01(repositoryRoot, ["rev-parse", "HEAD^{tree}"]),
            post_drift_source_fingerprint: currentSourceFingerprintV01(
              repositoryRoot,
              source,
            ),
          }),
        cohort_fingerprint: input.plan.integrity.fingerprint,
      });
      const predecessorAttempts = await executeSlotWithReplacementV01({
        slot: predecessorSlot,
        cohort_fingerprint: input.plan.integrity.fingerprint,
        primary_repository_root: repositoryRoot,
        primary_clone_baseline: predecessorBaseline,
        replacement_source_root: repositoryRoot,
        execute: (attempt, attemptRoot, cloneBaseline, forcePreActionFailure) =>
          executeEpisodeV01({
            input,
            runtime_consumption_witness: runtimeConsumptionWitness,
            roots,
            source,
            slot: predecessorSlot,
            plan: source.predecessor_plan,
            repository_root: attemptRoot,
            predecessor_checkpoint: null,
            predecessor_episode_ref: null,
            authorization_consumption_ref: authorizationConsumptionRef,
            fixture_output:
              fixtureOutputs.get(predecessorSlot.executor_role_ref.role_id) ?? null,
            attempt,
            force_pre_action_infrastructure_failure: forcePreActionFailure,
            clock,
            oracle_guard_path: oracleGuardPath,
            clone_baseline: cloneBaseline,
            store,
            before_invoke() {
              assertObservedExecutableIdentityUnchangedV01({
                executable_path: conformance
                  ? input.fake_app_server_path!
                  : input.native_host_executable_path!,
                expected: observedCliIdentity,
              });
              assertObservedExecutableIdentityUnchangedV01({
                executable_path: process.execPath,
                expected: observedRuntimeIdentity,
              });
              if (!conformance) {
                assertExactRunnerSourceIdentityV01({
                  source_root: sourceRoot,
                  expected_main_sha: input.current_main_sha,
                  expected_main_tree: input.current_main_tree,
                });
              }
              assertCommissionedLiveTrainingInvocationGateV01({
                authorization: input.authorization,
                plan: input.plan,
                slot_id: predecessorSlot.slot_id,
                native_host_invocations_started: nativeHostInvocationsStarted,
                provider_bearing_invocations_reserved: conformance
                  ? 0
                  : nativeHostInvocationsStarted,
                model_bearing_invocations_reserved: conformance
                  ? 0
                  : nativeHostInvocationsStarted,
                task_external_network_observation:
                  taskExternalNetworkObservation,
                evaluated_at: clock.now(),
                current_main_sha: input.current_main_sha,
                current_main_tree: input.current_main_tree,
                checkout_root_fingerprint: checkoutRootFingerprint,
                native_execution_configuration: input.native_execution_configuration,
                codex_environment_binding:
                  input.authorization.codex_environment_binding,
                authorization_consumed: true,
                provider_or_model_call_possible: !conformance,
              });
              const elapsed = performance.now() - cohortMonotonicStartedAt;
              const remaining =
                input.authorization.total_cohort_timeout_ms - elapsed;
              if (remaining <= 0) {
                failV01("live_training_authorization_total_timeout_reached");
              }
              nativeHostInvocationsStarted += 1;
              return {
                ordinal: nativeHostInvocationsStarted,
                timeout_ms: Math.max(
                  1,
                  Math.min(
                    input.authorization.per_episode_timeout_ms,
                    Math.floor(remaining),
                  ),
                ),
              };
            },
          }),
        fixture_output:
          fixtureOutputs.get(predecessorSlot.executor_role_ref.role_id) ?? null,
        on_attempt_settled: recordSettledAttempt,
        replacement_count: () => replacementInvocationsStarted,
        increment_replacement_count: () => {
          replacementInvocationsStarted += 1;
        },
      });
      const predecessor = predecessorAttempts.success;
      assertRunnerResourceCeilingsV01({
        authorization: input.authorization,
        conformance,
        native_host_invocations_started: nativeHostInvocationsStarted,
        execution_started_at: executionStartedAt,
        observed_at: clock.now(),
      });
      episodes.push(predecessor);
      if (episodes.length === 1) {
        injectTestFailureV01("after_first_valid_episode");
      }
      const checkpoint = buildCommissionedWorkEpisodeCheckpointV01(predecessor.episode);
      appendCommissionedLiveTrainingPredecessorCheckpointV01({
        store,
        slot_id: predecessorSlot.slot_id,
        checkpoint,
      });
      const predecessorRepositoryRoot = predecessor.repository_root;
      const predecessorHead = gitV01(predecessorRepositoryRoot, ["rev-parse", "HEAD"]);
      const predecessorTree = gitV01(predecessorRepositoryRoot, ["rev-parse", "HEAD^{tree}"]);
      for (const drift of source.source_drift_writes) {
        writeRepositoryFileV01(
          predecessorRepositoryRoot,
          drift.repository_relative_path,
          drift.content,
        );
      }
      gitV01(predecessorRepositoryRoot, ["add", "--all"]);
      gitV01(
        predecessorRepositoryRoot,
        ["commit", "-m", "apply sealed successor source drift"],
        clock.now(),
      );
      const postDriftHead = gitV01(predecessorRepositoryRoot, ["rev-parse", "HEAD"]);
      const postDriftTree = gitV01(predecessorRepositoryRoot, ["rev-parse", "HEAD^{tree}"]);
      const postDriftSourceFingerprint = currentSourceFingerprintV01(
        predecessorRepositoryRoot,
        source,
      );
      const successorRoots = new Map<CommissionedWorkConditionV01, string>();
      const baselines: CommissionedLiveTrainingCloneSealV01["clone_baselines"] = [] as unknown as
        CommissionedLiveTrainingCloneSealV01["clone_baselines"];
      for (const plan of source.successor_plans) {
        const slot = input.plan.slots.find(
          (candidate) =>
            candidate.case_id === source.case_id &&
            candidate.condition === plan.condition,
        );
        if (!slot) failV01("live_training_runner_successor_slot_missing");
        const cloneRoot = path.join(
          roots.repositories,
          `${source.case_id}-${slot.executor_visible_slot_identity}`,
        );
        gitV01(tempRoot, ["clone", "--no-hardlinks", predecessorRepositoryRoot, cloneRoot]);
        chmodSync(cloneRoot, 0o700);
        const commonRequestFingerprint = createCommissionedLiveTrainingCommonRequestFingerprintV01({
          case_id: source.case_id as CommissionedLiveTrainingCloneSealV01["case_id"],
          packet_task: source.task,
          required_checks: source.required_checks.map((check) => check.check_id),
          operation_contract: plan.operation_contract,
          post_drift_head: postDriftHead,
          post_drift_tree: postDriftTree,
          post_drift_source_fingerprint: postDriftSourceFingerprint,
        });
        baselines.push(
          observeAttemptCloneBaselineV01({
            repository_root: cloneRoot,
            source_case_id: source.case_id,
            slot_id: slot.slot_id,
            current_source_fingerprint: currentSourceFingerprintV01(
              cloneRoot,
              source,
            ),
            common_request_fingerprint: commonRequestFingerprint,
            cohort_fingerprint: input.plan.integrity.fingerprint,
          }),
        );
        successorRoots.set(plan.condition, cloneRoot);
      }
      const cloneSeal = buildCommissionedLiveTrainingCloneSealV01({
        seal_id: `clone-seal-${source.case_id}`,
        case_id: source.case_id as CommissionedLiveTrainingCloneSealV01["case_id"],
        predecessor_checkpoint_ref: createCommissionedWorkRecordRefV01({
          record_version: checkpoint.checkpoint_version,
          record_id: checkpoint.checkpoint_id,
          record_fingerprint: checkpoint.integrity.fingerprint,
        }),
        predecessor_head: predecessorHead,
        predecessor_tree: predecessorTree,
        predecessor_worktree_fingerprint:
          checkpoint.repository_state.worktree_fingerprint,
        source_drift_fingerprint: preparedSourceDriftFingerprintV01(source),
        post_drift_head: postDriftHead,
        post_drift_tree: postDriftTree,
        post_drift_parent_head: gitV01(predecessorRepositoryRoot, [
          "rev-parse",
          "HEAD^",
        ]),
        post_drift_current_source_fingerprint: postDriftSourceFingerprint,
        post_drift_parent_is_predecessor_head: true,
        clone_baselines: baselines,
        predecessor_checkpoint_source: checkpoint,
        cohort_plan_source: input.plan,
      });
      appendCommissionedLiveTrainingCloneSealV01({ store, seal: cloneSeal });
      prepared.set(source.case_id, {
        source,
        commitment: findTrainingCommitmentV01(input.manifest, source.case_id),
        predecessor,
        checkpoint,
        clone_seal: cloneSeal,
        successor_roots: successorRoots,
      });
    }

    for (const slot of input.plan.slots.filter(
      (candidate) => candidate.slot_role === "cold_successor",
    )) {
      const preparedCase = prepared.get(slot.case_id);
      if (!preparedCase || slot.condition === null) {
        failV01("live_training_runner_successor_case_missing");
      }
      const plan = preparedCase.source.successor_plans.find(
        (candidate) => candidate.condition === slot.condition,
      );
      const repositoryRoot = preparedCase.successor_roots.get(slot.condition);
      if (!plan || !repositoryRoot) failV01("live_training_runner_successor_source_missing");
      const successorBaseline = preparedCase.clone_seal.clone_baselines.find(
        (baseline) => baseline.slot_id === slot.slot_id,
      );
      if (!successorBaseline) failV01("live_training_runner_clone_baseline_missing");
      const successorAttempts = await executeSlotWithReplacementV01({
        slot,
        cohort_fingerprint: input.plan.integrity.fingerprint,
        primary_repository_root: repositoryRoot,
        primary_clone_baseline: successorBaseline,
        replacement_source_root: preparedCase.predecessor.repository_root,
        execute: (attempt, attemptRoot, cloneBaseline, forcePreActionFailure) =>
          executeEpisodeV01({
            input,
            runtime_consumption_witness: runtimeConsumptionWitness,
            roots,
            source: preparedCase.source,
            slot,
            plan,
            repository_root: attemptRoot,
            predecessor_checkpoint: preparedCase.checkpoint,
            predecessor_episode_ref: episodeRefV01(preparedCase.predecessor.episode),
            authorization_consumption_ref: authorizationConsumptionRef,
            fixture_output: fixtureOutputs.get(slot.executor_role_ref.role_id) ?? null,
            attempt,
            force_pre_action_infrastructure_failure: forcePreActionFailure,
            clock,
            oracle_guard_path: oracleGuardPath,
            clone_baseline: cloneBaseline,
            store,
            before_invoke() {
              assertObservedExecutableIdentityUnchangedV01({
                executable_path: conformance
                  ? input.fake_app_server_path!
                  : input.native_host_executable_path!,
                expected: observedCliIdentity,
              });
              assertObservedExecutableIdentityUnchangedV01({
                executable_path: process.execPath,
                expected: observedRuntimeIdentity,
              });
              if (!conformance) {
                assertExactRunnerSourceIdentityV01({
                  source_root: sourceRoot,
                  expected_main_sha: input.current_main_sha,
                  expected_main_tree: input.current_main_tree,
                });
              }
              assertCommissionedLiveTrainingInvocationGateV01({
                authorization: input.authorization,
                plan: input.plan,
                slot_id: slot.slot_id,
                native_host_invocations_started: nativeHostInvocationsStarted,
                provider_bearing_invocations_reserved: conformance
                  ? 0
                  : nativeHostInvocationsStarted,
                model_bearing_invocations_reserved: conformance
                  ? 0
                  : nativeHostInvocationsStarted,
                task_external_network_observation:
                  taskExternalNetworkObservation,
                evaluated_at: clock.now(),
                current_main_sha: input.current_main_sha,
                current_main_tree: input.current_main_tree,
                checkout_root_fingerprint: checkoutRootFingerprint,
                native_execution_configuration: input.native_execution_configuration,
                codex_environment_binding:
                  input.authorization.codex_environment_binding,
                authorization_consumed: true,
                provider_or_model_call_possible: !conformance,
              });
              const elapsed = performance.now() - cohortMonotonicStartedAt;
              const remaining =
                input.authorization.total_cohort_timeout_ms - elapsed;
              if (remaining <= 0) {
                failV01("live_training_authorization_total_timeout_reached");
              }
              nativeHostInvocationsStarted += 1;
              return {
                ordinal: nativeHostInvocationsStarted,
                timeout_ms: Math.max(
                  1,
                  Math.min(
                    input.authorization.per_episode_timeout_ms,
                    Math.floor(remaining),
                  ),
                ),
              };
            },
          }),
        fixture_output: fixtureOutputs.get(slot.executor_role_ref.role_id) ?? null,
        on_attempt_settled: recordSettledAttempt,
        replacement_count: () => replacementInvocationsStarted,
        increment_replacement_count: () => {
          replacementInvocationsStarted += 1;
        },
      });
      const successor = successorAttempts.success;
      assertRunnerResourceCeilingsV01({
        authorization: input.authorization,
        conformance,
        native_host_invocations_started: nativeHostInvocationsStarted,
        execution_started_at: executionStartedAt,
        observed_at: clock.now(),
      });
      episodes.push(successor);
      if (episodes.length === 4) {
        injectTestFailureV01("after_first_valid_successor");
      }
    }

    const admissions = attemptAdmissions;
    assertCommissionedLiveTrainingAttemptIdentitiesDistinctV01(admissions);
    const terminals = attemptTerminals;
    const registry = buildCommissionedLiveTrainingAttemptRegistryV01({
      registry_id: `attempt-registry-${input.plan.cohort_id}`,
      plan: input.plan,
      authorization: input.authorization,
      starts: attemptStarts,
      admissions,
      terminals,
    });
    const predecessorEpisodes = input.plan.slots
      .filter((slot) => slot.slot_role === "predecessor")
      .map((slot) => requireEpisodeV01(episodes, slot.slot_id).episode);
    const successorEpisodes = input.plan.slots
      .filter((slot) => slot.slot_role === "cold_successor")
      .map((slot) => requireEpisodeV01(episodes, slot.slot_id).episode);
    const trainingResult = buildCommissionedWorkTrainingResultV01({
      manifest: input.manifest,
      predecessor_episodes: predecessorEpisodes,
      successor_episodes: successorEpisodes,
    });
    const analysisJoins: CommissionedLiveTrainingAnalysisJoinV01[] = [];
    for (const slot of input.plan.slots.filter(
      (candidate) => candidate.slot_role === "cold_successor",
    )) {
      analysisJoins.push(
        buildCommissionedLiveTrainingAnalysisJoinV01({
          join_id: `analysis-join-${slot.slot_id}`,
          slot,
          blind_observation: requireEpisodeV01(episodes, slot.slot_id).blind_observation,
          joined_at: clock.nowAfter(
            requireEpisodeV01(episodes, slot.slot_id).blind_observation.sealed_at,
          ),
        }),
      );
    }
    const blindObservations = input.plan.slots.map(
      (slot) => requireEpisodeV01(episodes, slot.slot_id).blind_observation,
    );
    const checkpoints = input.training_cases.map(
      (source) => prepared.get(source.case_id)!.checkpoint,
    ) as [
      CommissionedWorkEpisodeCheckpointV01,
      CommissionedWorkEpisodeCheckpointV01,
      CommissionedWorkEpisodeCheckpointV01,
    ];
    const cloneSeals = input.training_cases.map(
      (source) => prepared.get(source.case_id)!.clone_seal,
    ) as [
      CommissionedLiveTrainingCloneSealV01,
      CommissionedLiveTrainingCloneSealV01,
      CommissionedLiveTrainingCloneSealV01,
    ];
    const liveResult = buildCommissionedLiveTrainingResultV01({
      result_id: `live-training-result-${input.plan.cohort_id}`,
      plan: input.plan,
      authorization: input.authorization,
      authorization_consumption_ref: authorizationConsumptionRef,
      attempt_registry: registry,
      training_result: trainingResult,
      predecessor_checkpoints: checkpoints,
      clone_seals: cloneSeals,
      blind_observations: blindObservations,
      analysis_joins: analysisJoins,
    });
    const candidateAssessment = buildCommissionedLiveTrainingCandidateAssessmentV01({
      assessment_id: `training-assessment-${input.plan.cohort_id}`,
      family_manifest: input.manifest,
      plan: input.plan,
      authorization: input.authorization,
      training_result: trainingResult,
      episodes: input.plan.slots.map(
        (slot) => requireEpisodeV01(episodes, slot.slot_id).episode,
      ),
      blind_observations: blindObservations,
      analysis_joins: analysisJoins,
      attempt_registry: registry,
      assessor_role_id: input.manifest.consolidation_assessor.role_id,
    });
    rmSync(tempRoot, { recursive: true, force: false });
    cleaned = true;
    const cleanupObservation = buildCommissionedLiveTrainingCleanupObservationV01({
      observation_id: `cleanup-observation-${input.plan.cohort_id}`,
      cohort_plan_ref: commissionedLiveTrainingRecordRefV01(input.plan),
      native_host_invocations_started: nativeHostInvocationsStarted,
      exact_adapter_settlement_fingerprints: [
        ...adapterSettlementFingerprints,
      ].sort(compareProtocolCodeUnitsV01),
      every_started_adapter_invocation_settled:
        adapterSettlementFingerprints.length === nativeHostInvocationsStarted,
      listener_owner_kind: "stdio_only_no_listener_created",
      repository_roots_absent: !existsSync(roots.repositories),
      runtime_roots_absent: !existsSync(roots.runtime),
      temporary_roots_absent: !existsSync(tempRoot),
      artifact_temporaries_absent: !listFilesWithSuffixV01(
        store.run_root,
        ".tmp",
      ).length,
      task_external_network_observation: taskExternalNetworkObservation,
      observed_at: clock.now(),
    });
    const cleanupReport = buildCommissionedLiveTrainingCleanupReportV01({
      cleanup_id: `cleanup-${input.plan.cohort_id}`,
      cohort_plan_ref: commissionedLiveTrainingRecordRefV01(input.plan),
      requested: true,
      completed: true,
      owned_processes_remaining: 0,
      owned_listeners_remaining: 0,
      owned_repository_roots_remaining: 0,
      owned_runtime_roots_remaining: 0,
      owned_temporary_roots_remaining: 0,
      stale_artifact_temporaries_remaining: 0,
      task_external_network_observation: taskExternalNetworkObservation,
      provider_calls_observed: providerCallsObservation,
      model_calls_observed: modelCallsObservation,
      cleanup_observation: cleanupObservation,
      cleanup_observation_ref:
        commissionedLiveTrainingRecordRefV01(cleanupObservation),
    });
    const artifacts: CommissionedLiveTrainingArtifactsV01 = {
      authorization: input.authorization,
      authorization_consumption: consumption.consumption,
      cohort_plan: input.plan,
      family_manifest: input.manifest,
      attempt_starts: attemptStarts,
      attempt_admissions: admissions,
      attempt_terminals: terminals,
      attempt_registry: registry,
      episodes: input.plan.slots.map((slot) => requireEpisodeV01(episodes, slot.slot_id).episode),
      predecessor_checkpoints: checkpoints,
      clone_seals: cloneSeals,
      blind_objective_observations: blindObservations,
      analysis_joins: analysisJoins,
      training_result: trainingResult,
      live_training_result: liveResult,
      candidate_assessment: candidateAssessment,
      cleanup_report: cleanupReport,
    };
    injectTestFailureV01("before_completion_artifact_write");
    const artifactSummary = writeCommissionedLiveTrainingArtifactsV01({
      store,
      artifacts,
      test_failure_after_index_before_witness:
        input.test_failure_injection_stage ===
        "after_completion_index_before_witness",
    });
    return {
      artifacts,
      artifact_summary: artifactSummary,
      schedule_fingerprint: input.plan.schedule_fingerprint,
      authorization_fingerprint: input.authorization.integrity.fingerprint,
      valid_predecessor_episodes: 3,
      valid_successor_episodes: 12,
      provider_calls: providerCallsObservation,
      model_calls: modelCallsObservation,
      task_external_network: taskExternalNetworkObservation,
      holdout_materialized: false,
      fake_output_is_behavioral_evidence: false,
      cleanup_complete: true,
    };
  } catch (error) {
    if (tempRoot !== null && existsSync(tempRoot)) {
      rmSync(tempRoot, { recursive: true, force: true });
    }
    cleaned = tempRoot === null || !existsSync(tempRoot);
    const everyStartedInvocationSettled =
      adapterSettlementFingerprints.length === nativeHostInvocationsStarted;
    const repositoriesAbsent =
      ownedRoots === null || !existsSync(ownedRoots.repositories!);
    const runtimeAbsent =
      ownedRoots === null || !existsSync(ownedRoots.runtime!);
    const temporaryAbsent = tempRoot === null || !existsSync(tempRoot);
    const artifactTemporariesAbsent =
      listFilesWithSuffixV01(store.run_root, ".tmp").length === 0;
    const cleanupObservation = buildCommissionedLiveTrainingCleanupObservationV01({
      observation_id: `cleanup-observation-incomplete-${input.plan.cohort_id}`,
      cohort_plan_ref: commissionedLiveTrainingRecordRefV01(input.plan),
      native_host_invocations_started: nativeHostInvocationsStarted,
      exact_adapter_settlement_fingerprints: [
        ...adapterSettlementFingerprints,
      ].sort(compareProtocolCodeUnitsV01),
      every_started_adapter_invocation_settled: everyStartedInvocationSettled,
      listener_owner_kind: "stdio_only_no_listener_created",
      repository_roots_absent: repositoriesAbsent,
      runtime_roots_absent: runtimeAbsent,
      temporary_roots_absent: temporaryAbsent,
      artifact_temporaries_absent: artifactTemporariesAbsent,
      task_external_network_observation: taskExternalNetworkObservation,
      observed_at: clock.now(),
    });
    const ownedProcessesRemaining = everyStartedInvocationSettled ? 0 : 1;
    const ownedRepositoryRootsRemaining = repositoriesAbsent ? 0 : 1;
    const ownedRuntimeRootsRemaining = runtimeAbsent ? 0 : 1;
    const ownedTemporaryRootsRemaining = temporaryAbsent ? 0 : 1;
    const staleArtifactTemporariesRemaining = artifactTemporariesAbsent ? 0 : 1;
    const cleanupCompleted = [
      ownedProcessesRemaining,
      ownedRepositoryRootsRemaining,
      ownedRuntimeRootsRemaining,
      ownedTemporaryRootsRemaining,
      staleArtifactTemporariesRemaining,
    ].every((value) => value === 0);
    const cleanupReport = buildCommissionedLiveTrainingCleanupReportV01({
      cleanup_id: `cleanup-incomplete-${input.plan.cohort_id}`,
      cohort_plan_ref: commissionedLiveTrainingRecordRefV01(input.plan),
      requested: true,
      completed: cleanupCompleted,
      owned_processes_remaining: ownedProcessesRemaining,
      owned_listeners_remaining: 0,
      owned_repository_roots_remaining: ownedRepositoryRootsRemaining,
      owned_runtime_roots_remaining: ownedRuntimeRootsRemaining,
      owned_temporary_roots_remaining: ownedTemporaryRootsRemaining,
      stale_artifact_temporaries_remaining: staleArtifactTemporariesRemaining,
      task_external_network_observation: taskExternalNetworkObservation,
      provider_calls_observed: providerCallsObservation,
      model_calls_observed: modelCallsObservation,
      cleanup_observation: cleanupObservation,
      cleanup_observation_ref:
        commissionedLiveTrainingRecordRefV01(cleanupObservation),
    });
    writeCommissionedLiveTrainingIncompleteArtifactsV01({
      store,
      authorization: input.authorization,
      authorization_consumption: consumption.consumption,
      plan: input.plan,
      family: input.manifest,
      cleanup_report: cleanupReport,
      failure_code: boundedFailureCodeV01(error),
      primary_slots_completed: episodes.length,
    });
    throw error;
  } finally {
    if (!cleaned && tempRoot !== null && existsSync(tempRoot)) {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  }
}

function assertCurrentCredentialFreeCompatibilityV01(input: {
  observation: CodexIsolatedAuthCredentialFreePreflightV01;
  authorization: CommissionedLiveTrainingAuthorizationV01;
}): void {
  const { integrity, ...material } = input.observation;
  const binding = input.authorization.codex_environment_binding;
  if (
    integrity.fingerprint !==
      createProtocolSha256V01(canonicalizeProtocolValueV01(material)) ||
    input.observation.state !== "compatible_exact" ||
    input.observation.codex_executable_fingerprint !==
      binding.codex_executable_fingerprint ||
    input.observation.executable_identity_class !==
      binding.executable_identity_class ||
    input.observation.semantic_profile_version !==
      binding.semantic_profile_version ||
    input.observation.semantic_profile_fingerprint !==
      binding.semantic_profile_fingerprint ||
    input.observation.observed_cli_version !==
      binding.compatible_codex_cli_version ||
    input.observation.observed_security_policy_fingerprint !==
      binding.config_tool_policy_fingerprint ||
    input.observation.credential_access_attempted !== false ||
    input.observation.provider_model_call_attempted !== false ||
    input.observation.repository_turn_started !== false ||
    input.observation.successful_external_network_egress_observed !== false ||
    input.observation.cleanup_completed !== true
  ) {
    failV01("live_training_runtime_credential_free_compatibility_refused");
  }
}

async function executeSlotWithReplacementV01(input: {
  slot: CommissionedLiveTrainingScheduleSlotV01;
  cohort_fingerprint: string;
  primary_repository_root: string;
  primary_clone_baseline: CommissionedLiveTrainingCloneSealV01["clone_baselines"][number];
  replacement_source_root: string;
  execute(
    attempt: AttemptIdentityV01,
    repositoryRoot: string,
    cloneBaseline: CommissionedLiveTrainingCloneSealV01["clone_baselines"][number],
    forcePreActionFailure: boolean,
  ): Promise<EpisodeAttemptV01>;
  fixture_output: CommissionedLiveTrainingTestFixtureOutputV01 | null;
  on_attempt_settled(attempt: EpisodeAttemptV01): void;
  replacement_count(): number;
  increment_replacement_count(): void;
}): Promise<{ success: EpisodeExecutionV01; attempts: EpisodeAttemptV01[] }> {
  const primaryIdentity: AttemptIdentityV01 = {
    attempt_id: input.slot.primary_attempt_id,
    attempt_kind: "primary",
    replacement_of_attempt_ref: null,
    executor_role_ref: input.slot.executor_role_ref,
    episode_identity: input.slot.executor_visible_slot_identity,
  };
  const primary = await input.execute(
    primaryIdentity,
    input.primary_repository_root,
    input.primary_clone_baseline,
    input.fixture_output?.pre_action_infrastructure_failure_on_primary === true,
  );
  input.on_attempt_settled(primary);
  if (isSuccessfulEpisodeAttemptV01(primary)) {
    return { success: primary, attempts: [primary] };
  }
  if (
    !primary.terminal.replacement_eligible ||
    !input.slot.replacement_allowed ||
    input.replacement_count() >= COMMISSIONED_LIVE_TRAINING_REPLACEMENT_LIMIT_V01
  ) {
    failV01("live_training_runner_nonreplaceable_or_exhausted_attempt");
  }
  const primaryHead = gitV01(input.primary_repository_root, ["rev-parse", "HEAD"]);
  const sourceHead = gitV01(input.replacement_source_root, ["rev-parse", "HEAD"]);
  const primaryTree = gitV01(input.primary_repository_root, ["rev-parse", "HEAD^{tree}"]);
  const sourceTree = gitV01(input.replacement_source_root, ["rev-parse", "HEAD^{tree}"]);
  if (
    primaryHead !== sourceHead ||
    primaryTree !== sourceTree ||
    gitV01(input.primary_repository_root, ["status", "--porcelain=v1"]) !== "" ||
    gitV01(input.replacement_source_root, ["status", "--porcelain=v1"]) !== ""
  ) {
    failV01("live_training_runner_replacement_source_state_changed");
  }
  const replacementRoot = `${input.primary_repository_root}-replacement-1`;
  if (existsSync(replacementRoot)) {
    failV01("live_training_runner_replacement_clone_already_exists");
  }
  gitV01(path.dirname(replacementRoot), [
    "clone",
    "--no-hardlinks",
    input.replacement_source_root,
    replacementRoot,
  ]);
  chmodSync(replacementRoot, 0o700);
  if (
    gitV01(replacementRoot, ["rev-parse", "HEAD"]) !== sourceHead ||
    gitV01(replacementRoot, ["rev-parse", "HEAD^{tree}"]) !== sourceTree ||
    gitV01(replacementRoot, ["status", "--porcelain=v1"]) !== ""
  ) {
    failV01("live_training_runner_replacement_clone_state_invalid");
  }
  input.increment_replacement_count();
  const replacementIdentity: AttemptIdentityV01 = {
    attempt_id: `${input.slot.primary_attempt_id.slice(0, -1)}r1`,
    attempt_kind: "replacement",
    replacement_of_attempt_ref: commissionedLiveTrainingRecordRefV01(
      primary.admission,
    ),
    executor_role_ref: createCommissionedWorkRoleRefV01(
      "executor",
      `executor-${createProtocolSha256V01(
        canonicalizeProtocolValueV01({
          slot_assignment: input.slot.assignment_fingerprint,
          replacement_ordinal: 1,
        }),
      ).slice("sha256:".length, "sha256:".length + 12)}`,
    ),
    episode_identity: `episode-${createProtocolSha256V01(
      canonicalizeProtocolValueV01({
        episode_assignment: input.slot.executor_visible_slot_identity,
        replacement_ordinal: 1,
      }),
    ).slice("sha256:".length, "sha256:".length + 12)}`,
  };
  const replacementBaseline = observeAttemptCloneBaselineV01({
    repository_root: replacementRoot,
    source_case_id: input.slot.case_id,
    slot_id: input.slot.slot_id,
    current_source_fingerprint:
      input.primary_clone_baseline.current_source_fingerprint,
    common_request_fingerprint:
      input.primary_clone_baseline.common_request_fingerprint,
    cohort_fingerprint: input.cohort_fingerprint,
  });
  const replacement = await input.execute(
    replacementIdentity,
    replacementRoot,
    replacementBaseline,
    input.fixture_output?.pre_action_infrastructure_failure_on_replacement === true,
  );
  input.on_attempt_settled(replacement);
  if (!isSuccessfulEpisodeAttemptV01(replacement)) {
    failV01("live_training_runner_replacement_failed_or_second_replacement_refused");
  }
  return { success: replacement, attempts: [primary, replacement] };
}

function isSuccessfulEpisodeAttemptV01(
  attempt: EpisodeAttemptV01,
): attempt is EpisodeExecutionV01 {
  return "episode" in attempt;
}

function assertRunnerResourceCeilingsV01(input: {
  authorization: CommissionedLiveTrainingAuthorizationV01;
  conformance: boolean;
  native_host_invocations_started: number;
  execution_started_at: string;
  observed_at: string;
}): void {
  const observationRef = createCommissionedWorkRecordRefV01({
    record_version: "commissioned_live_training_runner_resource_observation.v0.1",
    record_id: "runner-zero-provider-observation",
    record_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01({
        authorization_fingerprint: input.authorization.integrity.fingerprint,
        native_host_invocations_started: input.native_host_invocations_started,
        conformance: input.conformance,
      }),
    ),
  });
  assertCommissionedLiveTrainingResourceCeilingsV01({
    authorization: input.authorization,
    native_host_invocations_started: input.native_host_invocations_started,
    provider_calls: input.conformance
      ? createCommissionedLiveTrainingObservedSourcedResourceLaneV01(
          0,
          observationRef,
        )
      : createCommissionedLiveTrainingUnknownSourcedResourceLaneV01(),
    model_calls: input.conformance
      ? createCommissionedLiveTrainingObservedSourcedResourceLaneV01(
          0,
          observationRef,
        )
      : createCommissionedLiveTrainingUnknownSourcedResourceLaneV01(),
    token_units: createCommissionedLiveTrainingUnknownSourcedResourceLaneV01(),
    cost_microunits:
      createCommissionedLiveTrainingUnknownSourcedResourceLaneV01(),
    elapsed_ms: Math.max(
      0,
      Date.parse(input.observed_at) - Date.parse(input.execution_started_at),
    ),
  });
}

async function executeEpisodeV01(input: {
  input: ExecuteCommissionedLiveTrainingCohortInputV01;
  runtime_consumption_witness: CommissionedLiveTrainingRuntimeConsumptionWitnessV01;
  roots: Record<string, string>;
  source: CommissionedWorkCaseSourceV01;
  slot: CommissionedLiveTrainingScheduleSlotV01;
  plan: CommissionedWorkEpisodePlanSourceV01 | CommissionedWorkSuccessorPlanSourceV01;
  repository_root: string;
  predecessor_checkpoint: CommissionedWorkEpisodeCheckpointV01 | null;
  predecessor_episode_ref: CommissionedWorkRecordRefV01 | null;
  authorization_consumption_ref: CommissionedWorkRecordRefV01;
  fixture_output: CommissionedLiveTrainingTestFixtureOutputV01 | null;
  attempt: AttemptIdentityV01;
  force_pre_action_infrastructure_failure: boolean;
  clock: ReturnType<typeof deterministicOrWallClockV01>;
  oracle_guard_path: string;
  clone_baseline: CommissionedLiveTrainingCloneSealV01["clone_baselines"][number];
  store: CommissionedLiveTrainingArtifactStoreInitializationV01;
  before_invoke(): InvocationReservationV01;
}): Promise<EpisodeAttemptV01> {
  const conformance = [
    "test_conformance",
    "future_live_control_flow_conformance",
  ].includes(input.input.authorization.authorization_kind);
  const successorPlan = "condition" in input.plan ? input.plan : null;
  const generatedAt = input.clock.now();
  const episodeId = input.attempt.episode_identity;
  const observedHeadBeforeAction = gitV01(input.repository_root, ["rev-parse", "HEAD"]);
  const observedTreeBeforeAction = gitV01(input.repository_root, [
    "rev-parse",
    "HEAD^{tree}",
  ]);
  const observedSourceBeforeAction = currentSourceFingerprintV01(
    input.repository_root,
    input.source,
  );
  const expectedCommonRequestFingerprint =
    createCommissionedLiveTrainingCommonRequestFingerprintV01({
      case_id: input.source.case_id as CommissionedLiveTrainingCloneSealV01["case_id"],
      packet_task: input.source.task,
      required_checks: input.source.required_checks.map((check) => check.check_id),
      operation_contract: input.plan.operation_contract,
      post_drift_head: observedHeadBeforeAction,
      post_drift_tree: observedTreeBeforeAction,
      post_drift_source_fingerprint: observedSourceBeforeAction,
    });
  const observedCloneBaseline = observeAttemptCloneBaselineV01({
    repository_root: input.repository_root,
    source_case_id: input.source.case_id,
    slot_id: input.slot.slot_id,
    current_source_fingerprint: observedSourceBeforeAction,
    common_request_fingerprint: expectedCommonRequestFingerprint,
    cohort_fingerprint: input.input.plan.integrity.fingerprint,
  });
  if (
    canonicalizeProtocolValueV01(observedCloneBaseline) !==
      canonicalizeProtocolValueV01(input.clone_baseline)
  ) {
    failV01("live_training_runner_clone_admission_binding_invalid");
  }
  if (
    input.attempt.attempt_kind === "replacement" &&
    (observedCloneBaseline.initial_head !== input.clone_baseline.initial_head ||
      observedCloneBaseline.initial_tree !== input.clone_baseline.initial_tree ||
      observedCloneBaseline.clean_worktree_content_fingerprint !==
        input.clone_baseline.clean_worktree_content_fingerprint ||
      observedCloneBaseline.current_source_fingerprint !==
        input.clone_baseline.current_source_fingerprint ||
      observedCloneBaseline.common_request_fingerprint !==
        input.clone_baseline.common_request_fingerprint ||
      observedCloneBaseline.root_scope_fingerprint !==
        input.clone_baseline.root_scope_fingerprint)
  ) {
    failV01("live_training_runner_replacement_clone_admission_binding_invalid");
  }
  const packet = buildCommissionedWorkTaskContextPacketV01({
    manifest: input.input.manifest,
    source: input.source,
    plan: input.plan,
    consolidation_candidate: null,
    expected_candidate_freeze_fingerprint: null,
    generated_at: generatedAt,
    executor_role_id_override: input.attempt.executor_role_ref.role_id,
  });
  assertCommissionedLiveTrainingExecutorVisibleMaterialV01(packet);
  if (conformance) {
    if (
      input.fixture_output === null ||
      input.fixture_output.executor_role_id !==
        input.slot.executor_role_ref.role_id ||
      input.fixture_output.writes.length !== 1
    ) {
      failV01("live_training_runner_fixture_output_binding_invalid");
    }
    const output = input.fixture_output.writes[0]!;
    if (
      !input.plan.operation_contract.allowed_repository_relative_paths.includes(
        output.repository_relative_path,
      )
    ) {
      failV01("live_training_runner_fixture_output_outside_operation_contract");
    }
  }
  const cleanupMarker = path.join(
    input.roots.runtime!,
    `${input.attempt.attempt_id}.settled`,
  );
  const networkCount = path.join(
    input.roots.runtime!,
    `${input.attempt.attempt_id}.network-count`,
  );
  const tracePath = path.join(
    input.roots.runtime!,
    `${input.attempt.attempt_id}.trace.jsonl`,
  );
  const protocolRuntimeRoot = path.join(
    input.roots.runtime!,
    "protocol-runtime",
    input.attempt.attempt_id,
  );
  mkdirSync(protocolRuntimeRoot, { recursive: true, mode: 0o700 });
  const runtime: CommissionedWorkRuntimeBindingV01 = {
    report_included: false,
    case_id: input.source.case_id,
    condition: successorPlan?.condition ?? null,
    holdout_variant: null,
    workspace_id: input.input.manifest.workspace_id,
    project_id: input.source.project_id,
    repository_root: input.repository_root,
    database_path: path.join(protocolRuntimeRoot, `${input.slot.slot_id}.sqlite`),
    home_root: protocolRuntimeRoot,
    data_root: protocolRuntimeRoot,
    config_root: protocolRuntimeRoot,
    runtime_root: input.roots.runtime!,
    artifact_root: input.roots.artifacts!,
  };
  const request = buildCommissionedWorkNativeHostRequestV01({
    manifest: input.input.manifest,
    source: input.source,
    plan: input.plan,
    consolidation_candidate: null,
    expected_candidate_freeze_fingerprint: null,
    packet,
    runtime,
    episode_id: episodeId,
    requested_at: generatedAt,
    executor_role_id_override: input.attempt.executor_role_ref.role_id,
  });
  assertCommissionedLiveTrainingExecutorVisibleMaterialV01({
    request_id: request.request_id,
    run_id: request.run_id,
    workspace_id: request.workspace_id,
    project_id: request.project_id,
    task_context_packet_ref: request.task_context_packet_ref,
    packet: request.packet,
    root_scope_fingerprint: request.root_scope.root_fingerprint,
    requested_capability: request.requested_capability,
    allowed_operation_categories: request.allowed_operation_categories,
    forbidden_operation_categories: request.forbidden_operation_categories,
    policy: request.policy,
  });
  const owner =
    await input.input.create_isolated_authenticated_execution_owner({
      attempt_id: input.attempt.attempt_id,
      repository_root: input.repository_root,
      state_parent: path.join(
        input.roots.attempt_state!,
        input.attempt.attempt_id,
      ),
      test_environment: conformance
        ? {
            AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE: "1",
            FAKE_CODEX_SCENARIO: input.force_pre_action_infrastructure_failure
              ? "isolated_auth_unauthenticated"
              : "isolated_auth_cw1_live_training_repository_edit",
            FAKE_CODEX_THREAD_ID: deterministicHostIdV01(
              input.slot.ordinal,
              1,
            ),
            FAKE_CODEX_SESSION_ID: deterministicHostIdV01(
              input.slot.ordinal,
              2,
            ),
            FAKE_CODEX_TURN_ID: deterministicHostIdV01(
              input.slot.ordinal,
              3,
            ),
            FAKE_CODEX_CLEANUP_MARKER_PATH: cleanupMarker,
            FAKE_CODEX_NETWORK_COUNT_PATH: networkCount,
            FAKE_CODEX_TRACE_PATH: tracePath,
            FAKE_CODEX_ORACLE_GUARD_PATH: input.oracle_guard_path,
            FAKE_CODEX_CW1_OUTPUT_RELATIVE_PATH:
              input.fixture_output?.writes[0]?.repository_relative_path ?? "",
            FAKE_CODEX_CW1_OUTPUT_CONTENT_BASE64: Buffer.from(
              input.fixture_output?.writes[0]?.content ?? "",
              "utf8",
            ).toString("base64"),
          }
        : {},
    });
  if (
    owner.projection.integrity.fingerprint !==
      input.input.authorization.codex_environment_binding
        .codex_isolated_auth_projection_fingerprint ||
    owner.projection.semantic_profile_fingerprint !==
      input.input.authorization.codex_environment_binding
        .semantic_profile_fingerprint ||
    owner.projection.config_policy.policy_fingerprint !==
      input.input.authorization.codex_environment_binding
        .config_tool_policy_fingerprint ||
    owner.projection.config_policy.provider_route_fingerprint !==
      input.input.authorization.codex_environment_binding
        .effective_provider_route_fingerprint
  ) {
    owner.cleanupV01();
    failV01("live_training_runner_isolated_auth_owner_binding_invalid");
  }
  const episodeStartCommit = gitV01(input.repository_root, ["rev-parse", "HEAD"]);
  const episodeStartTree = gitV01(input.repository_root, ["rev-parse", "HEAD^{tree}"]);
  const initialCommit = gitV01(input.repository_root, ["rev-list", "--max-parents=0", "HEAD"]);
  const initialTree = gitV01(input.repository_root, ["rev-parse", `${initialCommit}^{tree}`]);
  const lifecycleEvents: NativeHostLifecycleEventV01[] = [];
  const adapterObservations: CodexAppServerAdapterObservationV01[] = [];
  const isolatedAuthObservations: CodexIsolatedAuthObservationV01[] = [];
  const approvalObservations = [] as ReturnType<
    typeof buildCommissionedLiveTrainingApprovalObservationV01
  >[];
  const { reservation, executionAuthorization } = (() => {
    try {
      const reservation = input.before_invoke();
      const executionAuthorization = conformance
        ? createCommissionedLiveTrainingTestExecutionAuthorizationV01({
            witness: input.runtime_consumption_witness,
            owner,
            request,
            slot: input.slot,
            attempt_id: input.attempt.attempt_id,
            attempt_kind: input.attempt.attempt_kind,
            invocation_ordinal: reservation.ordinal,
            expires_at: input.input.authorization.expires_at,
          })
        : createCommissionedLiveTrainingExternalExecutionAuthorizationV01({
            witness: input.runtime_consumption_witness,
            owner,
            request,
            slot: input.slot,
            attempt_id: input.attempt.attempt_id,
            attempt_kind: input.attempt.attempt_kind,
            invocation_ordinal: reservation.ordinal,
            native_execution_configuration:
              input.input.native_execution_configuration,
            codex_environment_binding:
              input.input.authorization.codex_environment_binding,
            expires_at: input.input.authorization.expires_at,
          });
      return { reservation, executionAuthorization };
    } catch (error) {
      owner.cleanupV01();
      throw error;
    }
  })();
  const adapter = createCodexAppServerAdapterV01({
    isolated_authenticated_execution: owner,
    isolated_authenticated_external_execution_authorization:
      executionAuthorization,
    now: input.clock.now,
    observe: (observation) => adapterObservations.push(observation),
    observe_isolated_auth: (observation) =>
      isolatedAuthObservations.push(observation),
  });
  let attemptStart: CommissionedLiveTrainingAttemptStartV01;
  try {
    attemptStart = buildCommissionedLiveTrainingAttemptStartV01({
    attempt_start_id: `${input.attempt.attempt_id}-start`,
    attempt_id: input.attempt.attempt_id,
    slot_id: input.slot.slot_id,
    attempt_kind: input.attempt.attempt_kind,
    authorization_consumption_ref: input.authorization_consumption_ref,
    cohort_plan_ref: commissionedLiveTrainingRecordRefV01(input.input.plan),
    executor_role_ref: input.attempt.executor_role_ref,
    request_ref_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(request),
    ),
    run_ref_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(request.run_id),
    ),
    native_execution_configuration_fingerprint:
      input.input.native_execution_configuration.configuration_fingerprint,
    codex_environment_binding_fingerprint:
      input.input.authorization.codex_environment_binding.integrity.fingerprint,
    attempt_state_root_fingerprint: owner.state_root_fingerprint,
    adapter_execution_binding_fingerprint:
      createCommissionedLiveTrainingAdapterBindingV01(
        input.input.native_execution_configuration,
      ).binding_fingerprint,
    clone_baseline: input.clone_baseline,
    reserved_native_host_invocation_ordinal: reservation.ordinal,
    provider_bearing_invocation_reserved: !conformance,
    model_bearing_invocation_reserved: !conformance,
    started_at: generatedAt,
    });
    appendCommissionedLiveTrainingAttemptStartV01({
      store: input.store,
      start: attemptStart,
    });
  // Reobserve the exact executable and source identity after durable attempt
  // admission and immediately before spawn; artifact persistence cannot widen
  // the sealed execution binding.
  assertObservedExecutableIdentityUnchangedV01({
    executable_path: conformance
      ? input.input.fake_app_server_path!
      : input.input.native_host_executable_path!,
    expected:
      input.input.native_execution_configuration.cli_executable_identity,
  });
  assertObservedExecutableIdentityUnchangedV01({
    executable_path: process.execPath,
    expected:
      input.input.native_execution_configuration.runtime_executable_identity,
  });
  if (!conformance) {
    assertExactRunnerSourceIdentityV01({
      source_root: realpathSync(input.input.source_repository_root),
      expected_main_sha: input.input.current_main_sha,
      expected_main_tree: input.input.current_main_tree,
    });
  }
  } catch (error) {
    owner.cleanupV01();
    throw error;
  }
  const invocation = adapter.invoke(request, {
    cancellation_signal: new AbortController().signal,
    timeout_ms: reservation.timeout_ms,
    stop_settle_timeout_ms: Math.min(
      5_000,
      input.input.authorization.per_episode_timeout_ms,
    ),
    lifecycle_sink: {
      async report_event(event) {
        lifecycleEvents.push(event);
      },
      async request_approval(request: NativeHostApprovalRequestV01) {
        const command = request.command_summary ?? "";
        const outsideRoot = request.repository_relative_paths.some(
          (candidate) =>
            path.posix.isAbsolute(candidate) ||
            path.win32.isAbsolute(candidate) ||
            candidate.split(/[\\/]/u).includes(".."),
        );
        const observation = buildCommissionedLiveTrainingApprovalObservationV01({
          observation_id: `approval-${input.attempt.attempt_id}-${approvalObservations.length + 1}`,
          approval_request_fingerprint: createProtocolSha256V01(
            canonicalizeProtocolValueV01(request),
          ),
          operation_class: request.operation_class,
          repository_relative_path_count:
            request.repository_relative_paths.length,
          network_resource_count: request.network_resources.length,
          outside_root: outsideRoot,
          github_or_publication:
            /(?:^|\s)(?:gh|git\s+push|publish|release|deploy)(?:\s|$)/iu.test(
              command,
            ),
          package_or_download:
            /(?:^|\s)(?:npm|pnpm|yarn|bun)\s+(?:install|add|ci|update|upgrade)(?:\s|$)/iu.test(
              command,
            ),
          credential_or_semantic:
            /(?:credential|secret|token|reviewdecision|transition|policy)/iu.test(
              `${command} ${request.resource_summary}`,
            ),
          available_decisions: request.available_decisions,
        });
        approvalObservations.push(observation);
        return {
          approval_id: request.approval_id,
          idempotency_fingerprint: request.idempotency_fingerprint,
          decision: observation.decision,
          decision_source: "run_cancellation" as const,
          decided_at: input.clock.now(),
          control_revision: approvalObservations.length,
        };
      },
    },
    resume_binding: null,
  });
  let rawResult: NativeHostResultV01;
  try {
    rawResult = await invocation.result;
    await invocation.settled;
  } catch (error) {
    await invocation.request_stop({ reason: "cancellation_requested" }).catch(() => undefined);
    await invocation.settled.catch(() => undefined);
    if (error instanceof NativeHostReconciliationRequiredErrorV01) {
      assertCommissionedLiveTrainingNoResumeBoundaryV01({
        boundary_kind: "reconciliation_required",
        authorization_consumed: true,
        meaningful_action_status: lifecycleEvents.some(
          (event) =>
            event.event_kind === "work_checkpoint" &&
            event.bounded_metadata.phase === "started",
        )
          ? "observed_present"
          : "observed_absent",
      });
      failV01("live_training_same_run_resume_unsupported_terminal_stop");
    }
    throw error;
  }
  if (adapterObservations.at(-1)?.kind !== "settled") {
    failV01("live_training_runner_native_host_not_settled");
  }
  const adapterSettlementFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      attempt_start_fingerprint: attemptStart.integrity.fingerprint,
      observations: adapterObservations,
      settled: true,
    }),
  );
  const exactExecutionBinding = createCommissionedLiveTrainingAdapterBindingV01(
    input.input.native_execution_configuration,
  );
  if (
    rawResult.adapter_version !==
      input.input.native_execution_configuration.adapter_ref.record_version ||
    rawResult.capability_version !==
      input.input.native_execution_configuration.capability_ref.record_version ||
    (rawResult.outcome !== "unavailable" &&
      rawResult.adapter_extension.bounded_metadata
        .isolated_auth_projection_fingerprint !==
        owner.projection.integrity.fingerprint) ||
    (rawResult.outcome !== "unavailable" &&
      rawResult.adapter_extension.bounded_metadata
        .isolated_auth_observation_fingerprint !==
        isolatedAuthObservations.at(-1)?.integrity.fingerprint)
  ) {
    failV01("live_training_runner_native_host_execution_binding_drift");
  }
  if (conformance) {
    if (
      readFileSync(cleanupMarker, "utf8") !== "settled\n" ||
      readFileSync(networkCount, "utf8") !== "0\n"
    ) {
      failV01("live_training_runner_fake_host_cleanup_or_network_invalid");
    }
  }
  if (
    rawResult.outcome === "unavailable" &&
    [
      "codex_isolated_state_home_mismatch",
      "codex_isolated_account_projection_mismatch",
      "codex_isolated_configuration_or_tool_policy_mismatch",
      "codex_isolated_unexpected_mcp_or_remote_startup",
    ].includes(rawResult.public_stop_reason ?? "")
  ) {
    failV01(
      `live_training_runner_isolated_environment_drift:${rawResult.public_stop_reason}`,
    );
  }
  const exactIsolationSource = isolatedAuthObservations.at(-1) ?? null;
  if (rawResult.outcome !== "unavailable" && !exactIsolationSource) {
    failV01("live_training_runner_isolation_observation_missing");
  }
  const isolationObservation = buildCommissionedLiveTrainingIsolationObservationV01({
    observation_id: `isolation-${input.attempt.attempt_id}`,
    attempt_id: input.attempt.attempt_id,
    environment_binding:
      input.input.authorization.codex_environment_binding,
    attempt_state_root_fingerprint: owner.state_root_fingerprint,
    home_identity_fingerprint: owner.home_identity_fingerprint,
    codex_home_identity_fingerprint: owner.codex_home_identity_fingerprint,
    codex_sqlite_home_identity_fingerprint:
      owner.codex_sqlite_home_identity_fingerprint,
    distinct_from_prior_attempt_state_roots: true,
    state_root_created_empty: true,
    shared_codex_home_fallback_used: false,
    predecessor_history_present: false,
    sibling_history_present: false,
    foreign_instruction_or_config_present: false,
    account_projection_status: exactIsolationSource
      ? "observed_exact"
      : "not_observed_pre_spawn_failure",
    account_projection_fingerprint:
      exactIsolationSource?.account_identity_fingerprint ?? null,
    codex_configuration_status: exactIsolationSource
      ? "observed_exact"
      : "not_observed_pre_spawn_failure",
    codex_configuration_fingerprint:
      exactIsolationSource?.observed_security_policy_fingerprint ?? null,
    tool_policy_status: exactIsolationSource
      ? "observed_exact"
      : "not_observed_pre_spawn_failure",
    tool_policy_fingerprint:
      exactIsolationSource?.observed_security_policy_fingerprint ?? null,
  });
  const preAdmission = buildCommissionedLiveTrainingAttemptAdmissionV01({
    attempt_id: input.attempt.attempt_id,
    slot_id: input.slot.slot_id,
    attempt_kind: input.attempt.attempt_kind,
    replacement_of_attempt_ref: input.attempt.replacement_of_attempt_ref,
    attempt_start_ref: commissionedLiveTrainingRecordRefV01(attemptStart),
    authorization_consumption_ref: input.authorization_consumption_ref,
    cohort_plan_ref: commissionedLiveTrainingRecordRefV01(input.input.plan),
    executor_role_ref: input.attempt.executor_role_ref,
    run_ref_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(rawResult.run_id),
    ),
    request_ref_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(request),
    ),
    host_ref_set:
      createCommissionedWorkCommissionedAgentHostRefBindingsV01(
        rawResult.host_refs,
      ),
    host_context_fingerprint:
      createCommissionedWorkNativeHostRefSetFingerprintV01(rawResult.host_refs),
    native_execution_configuration_fingerprint:
      input.input.native_execution_configuration.configuration_fingerprint,
    codex_environment_binding_fingerprint:
      input.input.authorization.codex_environment_binding.integrity.fingerprint,
    adapter_execution_binding_fingerprint:
      exactExecutionBinding.binding_fingerprint,
    native_host_result_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(rawResult),
    ),
    clone_identity_fingerprint:
      input.clone_baseline.clone_identity_fingerprint,
    clone_baseline: input.clone_baseline,
    isolation_observation: isolationObservation,
    approval_observations: approvalObservations,
    admitted_at: rawResult.started_at,
  });
  appendCommissionedLiveTrainingAttemptAdmissionV01({
    store: input.store,
    admission: preAdmission,
  });
  const noMeaningfulAction = !lifecycleEvents.some(
    (event) =>
      event.event_kind === "work_checkpoint" &&
      event.bounded_metadata.phase === "started",
  );
  const repositoryUnchanged =
    gitV01(input.repository_root, ["rev-parse", "HEAD"]) === episodeStartCommit &&
    gitV01(input.repository_root, ["rev-parse", "HEAD^{tree}"]) === episodeStartTree &&
    gitV01(input.repository_root, ["status", "--porcelain=v1"]) === "";
  if (approvalObservations.length > 0) {
    const terminal = buildCommissionedLiveTrainingAttemptTerminalV01({
      terminal_id: `${input.attempt.attempt_id}-terminal`,
      attempt_admission_ref: commissionedLiveTrainingRecordRefV01(preAdmission),
      slot_id: input.slot.slot_id,
      terminal_status: "non_aggregable_failure",
      failure_class: "authority_failure",
      first_meaningful_action_status: noMeaningfulAction
        ? "observed_absent"
        : "observed_present",
      repository_mutation_status: repositoryUnchanged
        ? "observed_absent"
        : "observed_present",
      native_host_settled: true,
      cleanup_complete: true,
      episode_ref: null,
      blind_observation_ref: null,
      finished_at: rawResult.finished_at,
    });
    appendCommissionedLiveTrainingAttemptTerminalV01({ store: input.store, terminal });
    return {
      slot: input.slot,
      source: input.source,
      plan: input.plan,
      repository_root: input.repository_root,
      attempt_start: attemptStart,
      admission: preAdmission,
      terminal,
      lifecycle_events: lifecycleEvents,
      adapter_settlement_fingerprint: adapterSettlementFingerprint,
    };
  }
  if (rawResult.outcome === "unavailable") {
    const terminal = buildCommissionedLiveTrainingAttemptTerminalV01({
      terminal_id: `${input.attempt.attempt_id}-terminal`,
      attempt_admission_ref: commissionedLiveTrainingRecordRefV01(preAdmission),
      slot_id: input.slot.slot_id,
      terminal_status: "non_aggregable_failure",
      failure_class: noMeaningfulAction && repositoryUnchanged
        ? "pre_action_host_infrastructure_failure"
        : "unknown_boundary",
      first_meaningful_action_status: noMeaningfulAction
        ? "observed_absent"
        : "observed_present",
      repository_mutation_status: repositoryUnchanged
        ? "observed_absent"
        : "observed_present",
      native_host_settled: true,
      cleanup_complete: true,
      episode_ref: null,
      blind_observation_ref: null,
      finished_at: rawResult.finished_at,
    });
    appendCommissionedLiveTrainingAttemptTerminalV01({
      store: input.store,
      terminal,
    });
    return {
      slot: input.slot,
      source: input.source,
      plan: input.plan,
      repository_root: input.repository_root,
      attempt_start: attemptStart,
      admission: preAdmission,
      terminal,
      lifecycle_events: lifecycleEvents,
      adapter_settlement_fingerprint: adapterSettlementFingerprint,
    };
  }
  const result = admitCommissionedWorkExecutorResultV01({
    source: input.source,
    plan: input.plan,
    request,
    result: rawResult,
  });
  if (canonicalizeProtocolValueV01(result) !== canonicalizeProtocolValueV01(rawResult)) {
    failV01("live_training_runner_native_host_result_rewritten");
  }
  gitV01(input.repository_root, ["add", "--all"]);
  gitV01(
    input.repository_root,
    ["commit", "--allow-empty", "-m", `record ${input.slot.slot_id} native-host result`],
    input.clock.now(),
  );
  const episodeEndHead = gitV01(input.repository_root, ["rev-parse", "HEAD"]);
  const episodeEndTree = gitV01(input.repository_root, ["rev-parse", "HEAD^{tree}"]);
  const commitment = findTrainingCommitmentV01(input.input.manifest, input.source.case_id);
  const evaluatorView = createCommissionedWorkObjectiveEvaluatorViewV01({
    source: input.source,
    commitment,
    episode_role: input.slot.slot_role === "predecessor" ? "predecessor" : "successor",
    run_ref_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(result.run_id),
    ),
    evaluator_role: input.input.manifest.outcome_evaluator,
    evaluator_version: input.input.manifest.evaluator_version,
    workspace_id: input.input.manifest.workspace_id,
    project_id: input.source.project_id,
    run_oracles: input.slot.slot_role === "cold_successor",
  });
  const evaluatorDecision = evaluateCommissionedWorkRepositoryBlindV01({
    view: evaluatorView,
    repository_root: input.repository_root,
    episode_start_commit: episodeStartCommit,
    result,
    oracle_guard_path: input.oracle_guard_path,
    network_attempt_log: networkCount,
  });
  const objective = buildCommissionedWorkObjectiveObservationFromDecisionV01({
    decision: evaluatorDecision,
    commitment,
    condition: null,
    holdout_variant: null,
  });
  const turnStarted = lifecycleEvents.find(
    (event) =>
      event.event_kind === "turn_started" &&
      event.bounded_metadata.packet_delivery_initiated === true,
  );
  if (!turnStarted) failV01("live_training_runner_packet_delivery_event_missing");
  const firstAction = lifecycleEvents.find(
    (event) =>
      event.event_kind === "work_checkpoint" &&
      event.bounded_metadata.phase === "started",
  );
  const testResourceObservationRef = conformance
    ? createCommissionedWorkRecordRefV01({
        record_version: "commissioned_live_training_test_resource_observation.v0.1",
        record_id: `resource-observation-${input.slot.slot_id}`,
        record_fingerprint: createProtocolSha256V01(
          canonicalizeProtocolValueV01({
            result_fingerprint: createProtocolSha256V01(
              canonicalizeProtocolValueV01(result),
            ),
            isolated_auth_projection_fingerprint:
              result.adapter_extension.bounded_metadata
                .isolated_auth_projection_fingerprint,
            external_execution_authorization_fingerprint:
              executionAuthorization.integrity.fingerprint,
            fake_process_settled: true,
            network_count: 0,
            provider_calls: 0,
            model_calls: 0,
          }),
        ),
      })
    : null;
  const liveAuthorizationRef = conformance
    ? null
    : commissionedLiveTrainingRecordRefV01(input.input.authorization);
  const executionObservation =
    buildCommissionedWorkCommissionedAgentExecutionObservationV01({
      packet,
      request,
      result,
      plan: input.plan,
      execution_evidence_class: conformance
        ? COMMISSIONED_WORK_COMMISSIONED_AGENT_CONFORMANCE_EVIDENCE_CLASS_V01
        : COMMISSIONED_WORK_COMMISSIONED_AGENT_OBSERVATION_EVIDENCE_CLASS_V01,
      resume_source: null,
      packet_presentation:
        firstAction &&
        Date.parse(turnStarted.observed_at) <= Date.parse(firstAction.observed_at)
        ? {
            status: "presented_before_first_meaningful_action",
            observed_at: turnStarted.observed_at,
            provenance: "native_host_lifecycle",
          }
        : {
            status: "delivered_action_order_unknown",
            observed_at: turnStarted.observed_at,
            provenance: "native_host_lifecycle",
          },
      continuation_materials_delivered: successorPlan?.selected_material_ids.length ?? 0,
      candidate_components_delivered: 0,
      delivered_material_set_fingerprint:
        createCommissionedWorkPacketMaterialSetFingerprintV01(packet),
      first_material_action_at: firstAction?.observed_at ?? null,
      first_material_action_timing_provenance: firstAction
        ? "native_host_lifecycle"
        : "unknown",
      executor_completion_attestation: {
        provenance: "unknown",
        claimed_complete: null,
      },
      resources: {
        provider_calls: conformance
          ? createCommissionedLiveTrainingObservedResourceLaneV01(0)
          : createCommissionedLiveTrainingUnknownResourceLaneV01(),
        model_calls: conformance
          ? createCommissionedLiveTrainingObservedResourceLaneV01(0)
          : createCommissionedLiveTrainingUnknownResourceLaneV01(),
        external_network_calls: conformance
          ? createCommissionedLiveTrainingObservedResourceLaneV01(0)
          : createCommissionedLiveTrainingUnknownResourceLaneV01(),
        tool_calls: createCommissionedLiveTrainingUnknownResourceLaneV01(),
        model_usage_units: createCommissionedLiveTrainingUnknownResourceLaneV01(),
        cost_microunits: createCommissionedLiveTrainingUnknownResourceLaneV01(),
        latency_ms: createCommissionedLiveTrainingUnknownResourceLaneV01(),
        human_review_burden: createCommissionedLiveTrainingUnknownResourceLaneV01(),
      },
      resource_binding: {
        provider_calls_observation_ref: testResourceObservationRef,
        model_calls_observation_ref: testResourceObservationRef,
        external_network_calls_observation_ref: testResourceObservationRef,
        live_authorization_ref: liveAuthorizationRef,
        authorization_resource_ceiling:
          liveAuthorizationRef &&
          input.input.authorization.provider_call_ceiling.observability ===
            "observed" &&
          input.input.authorization.model_call_ceiling.observability ===
            "observed"
          ? createCommissionedWorkAuthorizationResourceCeilingV01({
              live_authorization_ref: liveAuthorizationRef,
              provider_call_limit:
                input.input.authorization.provider_call_ceiling.limit,
              model_call_limit:
                input.input.authorization.model_call_ceiling.limit,
              external_network_call_limit: 0,
            })
          : null,
        provider_ref: conformance
          ? null
          : input.input.native_execution_configuration.provider_ref,
        model_ref: conformance
          ? null
          : input.input.native_execution_configuration.model_ref,
        route_ref: conformance
          ? null
          : input.input.native_execution_configuration.route_ref,
        network_destination_ref: null,
      },
      unauthorized_effects: zeroUnauthorizedEffectsV01(
        input.input.authorization.codex_environment_binding
          .unauthorized_effect_enforcement_ref,
      ),
    });
  const receipt = buildCommissionedWorkRunReceiptV01({
    request,
    packet,
    result,
    observation: objective,
    execution_observation: executionObservation,
  });
  const repositoryState = {
    initial_commit: initialCommit,
    initial_tree: initialTree,
    episode_start_commit: episodeStartCommit,
    episode_start_tree: episodeStartTree,
    episode_end_head: episodeEndHead,
    episode_end_tree: episodeEndTree,
    worktree_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01({
        head: episodeEndHead,
        tree: episodeEndTree,
        status: gitV01(input.repository_root, ["status", "--short"]),
      }),
    ),
  };
  const episode = buildCommissionedWorkEpisodeArtifactV01({
    manifest: input.input.manifest,
    source: input.source,
    plan: input.plan,
    packet,
    request,
    result,
    receipt,
    observation: objective,
    execution_observation: executionObservation,
    episode_id: episodeId,
    episode_role: input.slot.slot_role === "predecessor" ? "predecessor" : "successor",
    condition: successorPlan?.condition ?? null,
    holdout_variant: null,
    predecessor_episode_ref: input.predecessor_episode_ref,
    predecessor_checkpoint: input.predecessor_checkpoint,
    episode_origin_source_chain: null,
    candidate_freeze_fingerprint: null,
    repository_state: repositoryState,
    candidate_frozen_before_start: null,
    repository_action_trace_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01({
        changed_files: result.changed_files,
        observed_actions: result.observed_actions,
      }),
    ),
    executor_role_id_override: input.attempt.executor_role_ref.role_id,
  });
  assertValidCommissionedWorkEpisodeArtifactV01(episode);
  const blindObservation = buildCommissionedLiveTrainingBlindObjectiveObservationV01({
    blind_observation_id: `blind-observation-${input.slot.slot_id}`,
    slot: input.slot,
    evaluator_role_id: input.input.manifest.outcome_evaluator.role_id,
    evaluator_view_fingerprint: evaluatorView.view_fingerprint,
    case_commitment: commitment,
    observation: objective,
    sealed_at: input.clock.nowAfter(result.finished_at),
  });
  const admission = preAdmission;
  const terminal = buildCommissionedLiveTrainingAttemptTerminalV01({
    terminal_id: `${input.attempt.attempt_id}-terminal`,
    attempt_admission_ref: commissionedLiveTrainingRecordRefV01(admission),
    slot_id: input.slot.slot_id,
    terminal_status: "valid_episode",
    failure_class: "none",
    first_meaningful_action_status: firstAction ? "observed_present" : "unknown",
    repository_mutation_status:
      result.changed_files.length > 0 ? "observed_present" : "observed_absent",
    native_host_settled: true,
    cleanup_complete: true,
    episode_ref: episodeRefV01(episode),
    blind_observation_ref: commissionedLiveTrainingRecordRefV01(blindObservation),
    finished_at: result.finished_at,
  });
  appendCommissionedLiveTrainingCompletedEpisodeV01({
    store: input.store,
    slot_id: input.slot.slot_id,
    episode,
    blind_observation: blindObservation,
  });
  appendCommissionedLiveTrainingAttemptTerminalV01({
    store: input.store,
    terminal,
  });
  return {
    slot: input.slot,
    source: input.source,
    plan: input.plan,
    repository_root: input.repository_root,
    attempt_start: attemptStart,
    episode,
    blind_observation: blindObservation,
    admission,
    terminal,
    lifecycle_events: lifecycleEvents,
    adapter_settlement_fingerprint: adapterSettlementFingerprint,
  };
}

function materializeInitialRepositoryV01(
  root: string,
  source: CommissionedWorkCaseSourceV01,
  timestamp: string,
): void {
  mkdirSync(root, { recursive: true, mode: 0o700 });
  source.repository_fixture.forEach((fixture) =>
    writeRepositoryFileV01(root, fixture.repository_relative_path, fixture.content),
  );
  gitV01(root, ["init", "--initial-branch=main"]);
  gitV01(root, ["config", "user.name", "Augnes CW1 fixture"]);
  gitV01(root, ["config", "user.email", "cw1-fixture@example.invalid"]);
  gitV01(root, ["add", "--all"]);
  gitV01(root, ["commit", "-m", "initialize sealed training fixture"], timestamp);
}

function writeRepositoryFileV01(root: string, relativePath: string, content: string): void {
  const target = path.resolve(root, relativePath);
  const relative = path.relative(root, target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    failV01("live_training_runner_repository_path_escape");
  }
  mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 });
  writeFileSync(target, content, { encoding: "utf8", mode: 0o600 });
}

function currentSourceFingerprintV01(
  root: string,
  source: CommissionedWorkCaseSourceV01,
): string {
  return createProtocolSha256V01(
    canonicalizeProtocolValueV01(
      [...source.current_source_relative_paths]
        .sort(compareProtocolCodeUnitsV01)
        .map((repositoryRelativePath) => ({
          repository_relative_path: repositoryRelativePath,
          content_fingerprint: createProtocolSha256V01(
            canonicalizeProtocolValueV01(
              readFileSync(path.join(root, repositoryRelativePath), "utf8"),
            ),
          ),
        })),
    ),
  );
}

function observeAttemptCloneBaselineV01(input: {
  repository_root: string;
  source_case_id: string;
  slot_id: string;
  current_source_fingerprint: string;
  common_request_fingerprint: string;
  cohort_fingerprint: string;
}): CommissionedLiveTrainingCloneSealV01["clone_baselines"][number] {
  const head = gitV01(input.repository_root, ["rev-parse", "HEAD"]);
  const tree = gitV01(input.repository_root, ["rev-parse", "HEAD^{tree}"]);
  const status = gitV01(input.repository_root, ["status", "--porcelain=v1"]);
  if (status !== "") failV01("live_training_runner_clone_not_clean");
  const canonicalRoot = realpathSync(input.repository_root);
  return {
    slot_id: input.slot_id,
    clone_identity_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01({
        cohort_fingerprint: input.cohort_fingerprint,
        source_case_id: input.source_case_id,
        slot_id: input.slot_id,
        root_scope_fingerprint: createProtocolSha256V01(
          canonicalizeProtocolValueV01(canonicalRoot),
        ),
        head,
        tree,
      }),
    ),
    root_scope_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(canonicalRoot),
    ),
    initial_head: head,
    initial_tree: tree,
    clean_worktree_content_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01({ head, tree, status }),
    ),
    current_source_fingerprint: input.current_source_fingerprint,
    common_request_fingerprint: input.common_request_fingerprint,
  };
}

function preparedSourceDriftFingerprintV01(source: CommissionedWorkCaseSourceV01): string {
  return createProtocolSha256V01(
    canonicalizeProtocolValueV01(
      [...source.source_drift_writes]
        .sort((left, right) =>
          compareProtocolCodeUnitsV01(
            left.repository_relative_path,
            right.repository_relative_path,
          ),
        )
        .map((write) => ({
          repository_relative_path: write.repository_relative_path,
          content_fingerprint: createProtocolSha256V01(
            canonicalizeProtocolValueV01(write.content),
          ),
        })),
    ),
  );
}

function findTrainingCommitmentV01(
  manifest: CommissionedWorkFamilyManifestV01,
  caseId: string,
): CommissionedWorkCaseCommitmentV01 {
  const commitment = manifest.training_cases.find((candidate) => candidate.case_id === caseId);
  if (!commitment) failV01("live_training_runner_case_commitment_missing");
  return commitment;
}

function requireEpisodeV01(
  episodes: EpisodeExecutionV01[],
  slotId: string,
): EpisodeExecutionV01 {
  const matches = episodes.filter((episode) => episode.slot.slot_id === slotId);
  if (matches.length !== 1) failV01("live_training_runner_episode_slot_invalid");
  return matches[0]!;
}

function episodeRefV01(
  episode: CommissionedWorkEpisodeArtifactV01,
): CommissionedWorkRecordRefV01 {
  return createCommissionedWorkRecordRefV01({
    record_version: episode.episode_version,
    record_id: episode.episode_id,
    record_fingerprint: episode.integrity.fingerprint,
  });
}

function deterministicHostIdV01(ordinal: number, suffix: number): string {
  return `01910000-0000-7000-8${String(ordinal).padStart(3, "0")}-${String(
    ordinal * 10 + suffix,
  ).padStart(12, "0")}`;
}

function deterministicOrWallClockV01(startedAt: string, deterministic: boolean): {
  now(): string;
  nowAfter(timestamp: string): string;
} {
  let next = Date.parse(startedAt);
  if (!Number.isFinite(next)) failV01("live_training_runner_start_time_invalid");
  return {
    now() {
      if (!deterministic) return new Date().toISOString();
      const value = new Date(next).toISOString();
      next += 50;
      return value;
    },
    nowAfter(timestamp) {
      if (!deterministic) {
        const wall = Date.now();
        return new Date(Math.max(wall, Date.parse(timestamp) + 1)).toISOString();
      }
      next = Math.max(next, Date.parse(timestamp) + 1);
      const value = new Date(next).toISOString();
      next += 50;
      return value;
    },
  };
}

function gitV01(root: string, args: string[], timestamp?: string): string {
  const environment = {
    ...hermeticEnvironmentV01(),
    ...(timestamp
      ? { GIT_AUTHOR_DATE: timestamp, GIT_COMMITTER_DATE: timestamp }
      : {}),
  };
  return execFileSync("git", args, {
    cwd: root,
    env: environment,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 10_000,
  }).trim();
}

function assertExactRunnerSourceIdentityV01(input: {
  source_root: string;
  expected_main_sha: string;
  expected_main_tree: string;
}): void {
  const observedRoot = realpathSync(
    gitV01(input.source_root, ["rev-parse", "--show-toplevel"]),
  );
  const remote = gitV01(input.source_root, ["remote", "get-url", "origin"])
    .replace(/\.git$/u, "")
    .replace(/^git@github\.com:/u, "https://github.com/");
  if (
    observedRoot !== input.source_root ||
    gitV01(input.source_root, ["rev-parse", "HEAD"]) !== input.expected_main_sha ||
    gitV01(input.source_root, ["rev-parse", "HEAD^{tree}"]) !== input.expected_main_tree ||
    gitV01(input.source_root, ["status", "--porcelain=v1"]) !== "" ||
    remote !== "https://github.com/hynk-studio/augnes"
  ) {
    failV01("live_training_runner_exact_source_drift");
  }
}

function assertObservedExecutableIdentityUnchangedV01(input: {
  executable_path: string;
  expected: CommissionedLiveTrainingExecutableIdentityV01;
}): void {
  const observed = observeCommissionedLiveTrainingExecutableIdentityV01({
    executable_path: input.executable_path,
    executable_kind: input.expected.executable_kind,
  });
  if (
    canonicalizeProtocolValueV01(observed) !==
    canonicalizeProtocolValueV01(input.expected)
  ) {
    failV01("live_training_runner_executable_identity_drift");
  }
}

function hermeticEnvironmentV01(): NodeJS.ProcessEnv {
  return {
    NODE_ENV: "test",
    HOME: process.env.HOME,
    PATH: process.env.PATH,
    TMPDIR: process.env.TMPDIR,
    LANG: "C",
    LC_ALL: "C",
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_TERMINAL_PROMPT: "0",
    GIT_ALLOW_PROTOCOL: "file",
  };
}

function writeOracleGuardV01(target: string, sourceRoot: string): void {
  const guardUrl = pathToFileURL(
    path.join(sourceRoot, "scripts", "test-harness-zero-network-guard.mjs"),
  ).href;
  writeFileSync(
    target,
    `import { installZeroNetworkGuard } from ${JSON.stringify(guardUrl)};\ninstallZeroNetworkGuard({ allowLoopback: false, errorPrefix: "cw1_live_training_oracle_network_forbidden" });\n`,
    { encoding: "utf8", mode: 0o600 },
  );
}

function listFilesWithSuffixV01(root: string, suffix: string): string[] {
  if (!existsSync(root)) return [];
  const matches: string[] = [];
  const visit = (directory: string): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(target);
      else if (entry.isFile() && entry.name.endsWith(suffix)) matches.push(target);
    }
  };
  visit(root);
  return matches;
}

function zeroUnauthorizedEffectsV01(
  enforcementRef: CommissionedWorkRecordRefV01,
): CommissionedWorkObjectiveObservationV01["unauthorized_effects"] {
  createCommissionedWorkRecordRefV01(enforcementRef);
  return {
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
  };
}

function boundedFailureCodeV01(error: unknown): string {
  const candidate =
    error && typeof error === "object" && "code" in error &&
    typeof error.code === "string"
      ? error.code
      : error instanceof Error
        ? error.message
        : "live_training_runner_failed";
  return /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/u.test(candidate)
    ? candidate
    : "live_training_runner_failed";
}

function failV01(code: string): never {
  throw new Error(code);
}
