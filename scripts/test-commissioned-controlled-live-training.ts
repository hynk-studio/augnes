import assert from "node:assert/strict";
import { execFileSync, spawn, spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  readdirSync,
  renameSync,
  rmSync,
  rmdirSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  assertCommissionedLiveTrainingAuthorizationCurrentV01,
  assertCommissionedLiveTrainingAttemptIdentitiesDistinctV01,
  assertCommissionedLiveTrainingAttemptStartReservationV01,
  assertCommissionedLiveTrainingExecutorVisibleMaterialV01,
  assertCommissionedLiveTrainingInvocationGateV01,
  assertCommissionedLiveTrainingNoResumeBoundaryV01,
  assertCommissionedLiveTrainingResourceCeilingsV01,
  assertSafeCommissionedLiveTrainingOutputV01,
  assertValidCommissionedLiveTrainingCohortPlanV01,
  buildCommissionedLiveTrainingAnalysisJoinV01,
  buildCommissionedLiveTrainingApprovalObservationV01,
  buildCommissionedLiveTrainingAttemptStartV01,
  buildCommissionedLiveTrainingAttemptAdmissionV01,
  buildCommissionedLiveTrainingAttemptRegistryV01,
  buildCommissionedLiveTrainingAttemptTerminalV01,
  buildCommissionedLiveTrainingAuthorizationV01,
  buildCommissionedLiveTrainingBlindObjectiveObservationV01,
  buildCommissionedLiveTrainingCandidateAssessmentV01,
  buildCommissionedLiveTrainingCleanupReportV01,
  buildCommissionedLiveTrainingCleanupObservationV01,
  buildCommissionedLiveTrainingCloneSealV01,
  buildCommissionedLiveTrainingCohortPlanV01,
  buildCommissionedLiveTrainingCodexEnvironmentBindingV01,
  buildCommissionedLiveTrainingExactNativeExecutionConfigurationV01,
  buildCommissionedLiveTrainingIsolationObservationV01,
  buildCommissionedLiveTrainingResultV01,
  commissionedLiveTrainingDefaultAdapterRefV01,
  commissionedLiveTrainingDefaultCapabilityRefV01,
  commissionedLiveTrainingRecordRefV01,
  commissionedWorkManifestRecordRefV01,
  createCommissionedLiveTrainingAdapterBindingV01,
  createCommissionedLiveTrainingObservedSourcedResourceLaneV01,
  createCommissionedLiveTrainingRecordRefV01,
  createCommissionedLiveTrainingUnknownSourcedResourceLaneV01,
  commissionedLiveTrainingCandidateRuleTableV01,
  evaluateCommissionedLiveTrainingComponentRuleV01,
  COMMISSIONED_LIVE_TRAINING_ARTIFACT_NAMESPACE_V01,
} from "@/lib/vnext/commissioned-controlled-live-training";
import {
  consumeCommissionedLiveTrainingAuthorizationV01,
  assertSourceOwnedCommissionedLiveTrainingRuntimeConsumptionWitnessV01,
  initializeCommissionedLiveTrainingArtifactStoreV01,
  setCommissionedLiveTrainingArtifactIoOneShotTestHookV01,
  validateCommissionedLiveTrainingArtifactsV01,
  validateCommissionedLiveTrainingIncompleteArtifactsV01,
} from "@/lib/vnext/commissioned-controlled-live-training-artifact-store";
import {
  assertCommissionedLiveTrainingExternalExecutionAuthorizationPublicMaterialV01,
  assertCommissionedLiveTrainingExternalExecutionAuthorizationSourceOwnedV01,
  consumeCommissionedLiveTrainingProductionAuthorizationSourceOwnershipContractFixtureV01,
  createCommissionedLiveTrainingProductionAuthorizationSourceOwnershipContractFixtureV01,
} from "@/lib/vnext/commissioned-controlled-live-training-execution-authorization";
import { createCommissionedLiveTrainingTestExecutionAuthorizationV01 } from "@/lib/vnext/commissioned-controlled-live-training-test-execution-authorization";
import {
  executeCommissionedLiveTrainingCohortV01,
  observeCommissionedLiveTrainingExecutableIdentityV01,
  type CommissionedLiveTrainingTestFixtureOutputV01,
} from "@/lib/vnext/commissioned-controlled-live-training-runner";
import {
  buildCommissionedWorkNativeHostRequestV01,
  buildCommissionedWorkTaskContextPacketV01,
  assertValidCommissionedWorkEpisodeArtifactV01,
  createCommissionedWorkIntegrityV01,
  createCommissionedWorkRecordRefV01,
  createCommissionedWorkRoleRefV01,
} from "@/lib/vnext/commissioned-controlled-workbench";
import { createCommissionedLiveTrainingIsolatedAuthTestHarnessV01 } from "@/scripts/fixtures/commissioned-live-training-isolated-auth-test-harness";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import {
  createCommissionedControlledWorkTrainingOnlyFamilyV01,
} from "@/fixtures/vnext/research/commissioned-controlled-workbench-v0-1";
import type {
  CommissionedWorkEpisodeArtifactV01,
  CommissionedWorkRecordRefV01,
} from "@/types/vnext/commissioned-controlled-workbench";
import type {
  CommissionedLiveTrainingAuthorizationV01,
  CommissionedLiveTrainingCodexEnvironmentBindingV01,
  CommissionedLiveTrainingCohortPlanV01,
} from "@/types/vnext/commissioned-controlled-live-training";

const FOUNDATION_SHA = "53381b1aead57554e1c5b7978050b6a3a550f78c";
const FOUNDATION_TREE = "a19354842a6eea028a5e8a669c8f4ec98e3da498";
const COHORT_ID = "cw1-l1-training-cohort-01";
const AUTHORIZATION_NONCE = "cw1l1_test_conformance_nonce_000000000001";
const CHECKOUT_ROOT_FINGERPRINT = createProtocolSha256V01(
  canonicalizeProtocolValueV01(realpathSync(process.cwd())),
);
const TEST_RESOURCE_SOURCE_REF = testRecordRefV01(
  "credential-free-zero-provider-enforcement",
);
let TEST_CODEX_ENVIRONMENT_BINDING: CommissionedLiveTrainingCodexEnvironmentBindingV01;
let TEST_ISOLATED_AUTH_HARNESS: Awaited<
  ReturnType<typeof createCommissionedLiveTrainingIsolatedAuthTestHarnessV01>
>;

async function main(): Promise<void> {
  const root = mkdtempSync(path.join(os.tmpdir(), "augnes-cw1-l1-test-"));
  const priorCanonicalTestMode = process.env.AUGNES_CANONICAL_TEST_MODE;
  const priorIsolatedAuthTestMode =
    process.env.AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE;
  const priorTmpDir = process.env.TMPDIR;
  process.env.AUGNES_CANONICAL_TEST_MODE = "1";
  process.env.AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE = "1";
  const artifactRepository = path.join(root, "artifact-repository");
  const isolatedRuntimeParent = path.join(root, "isolated-runtime-parent");
  const sharedTmpDir = path.join(root, "shared-tmp");
  mkdirSync(artifactRepository, { recursive: true, mode: 0o700 });
  mkdirSync(isolatedRuntimeParent, { recursive: true, mode: 0o700 });
  mkdirSync(sharedTmpDir, { recursive: true, mode: 0o700 });
  process.env.TMPDIR = sharedTmpDir;
  writeFileSync(path.join(artifactRepository, ".gitignore"), ".augnes-lab/\n", {
    encoding: "utf8",
    mode: 0o600,
  });
  try {
    const fakeAppServerPath = path.join(
      process.cwd(),
      "scripts",
      "fixtures",
      "fake-codex-app-server.mjs",
    );
    TEST_ISOLATED_AUTH_HARNESS =
      await createCommissionedLiveTrainingIsolatedAuthTestHarnessV01({
        repository_root: process.cwd(),
        lease_root: path.join(root, "isolated-auth-leases"),
        state_root: path.join(root, "isolated-auth-harness"),
        fake_app_server_path: fakeAppServerPath,
      });
    TEST_CODEX_ENVIRONMENT_BINDING =
      buildCommissionedLiveTrainingCodexEnvironmentBindingV01({
        binding_id: "cw1-l1-test-isolated-codex-environment",
        binding_class: "zero_provider_control_flow_conformance",
        isolated_auth_projection: TEST_ISOLATED_AUTH_HARNESS.projection,
        credential_free_preflight:
          TEST_ISOLATED_AUTH_HARNESS.credential_free_preflight,
        task_network_enforcement_ref: TEST_RESOURCE_SOURCE_REF,
        unauthorized_effect_enforcement_ref: TEST_RESOURCE_SOURCE_REF,
      });
    const trainingFamily = createCommissionedControlledWorkTrainingOnlyFamilyV01();
    const manifest = trainingFamily.manifest;
    const trainingCases = trainingFamily.training_cases;
    const plan = buildCommissionedLiveTrainingCohortPlanV01({
      manifest,
      training_cases: trainingCases,
      cohort_id: COHORT_ID,
      sealed_at: "2026-08-28T06:00:00.000Z",
    });
    assertValidCommissionedLiveTrainingCohortPlanV01(plan);
    assert.equal(plan.slots.length, 15);
    assert.deepEqual(
      plan.slots.map((slot) => [slot.case_id, slot.condition]),
      [
        ["case-amber-17", null],
        ["case-cobalt-29", null],
        ["case-cedar-41", null],
        ["case-amber-17", "exact_current_continuity"],
        ["case-cobalt-29", "matched_ablation"],
        ["case-cedar-41", "stale_or_regime_shift_continuity"],
        ["case-amber-17", "matched_ablation"],
        ["case-cobalt-29", "stale_or_regime_shift_continuity"],
        ["case-cedar-41", "zero_continuation_control"],
        ["case-amber-17", "stale_or_regime_shift_continuity"],
        ["case-cobalt-29", "zero_continuation_control"],
        ["case-cedar-41", "exact_current_continuity"],
        ["case-amber-17", "zero_continuation_control"],
        ["case-cobalt-29", "exact_current_continuity"],
        ["case-cedar-41", "matched_ablation"],
      ],
    );
    assert.equal(plan.holdout_source_materialized, false);
    assert.equal(plan.holdout_execution_authorized, false);
    const nativeConfiguration = buildTestNativeConfigurationV01();
    const authorization = buildCommissionedLiveTrainingAuthorizationV01({
      authorization_id: "cw1-l1-test-authorization-01",
      authorization_kind: "future_live_control_flow_conformance",
      issued_at: "2026-08-28T06:01:00.000Z",
      expires_at: "2026-08-29T06:01:00.000Z",
      current_main_sha: FOUNDATION_SHA,
      current_main_tree: FOUNDATION_TREE,
      checkout_root_fingerprint: CHECKOUT_ROOT_FINGERPRINT,
      plan,
      native_execution_configuration: nativeConfiguration,
      codex_environment_binding: TEST_CODEX_ENVIRONMENT_BINDING,
      authorization_nonce: AUTHORIZATION_NONCE,
      artifact_relative_root: `${COMMISSIONED_LIVE_TRAINING_ARTIFACT_NAMESPACE_V01}/${COHORT_ID}`,
      replacement_invocation_limit: 3,
      native_host_invocation_limit: 18,
      provider_bearing_native_host_invocation_limit: 0,
      model_bearing_native_host_invocation_limit: 0,
      provider_call_ceiling: {
        observability: "observed",
        limit: 0,
        source_ref: TEST_RESOURCE_SOURCE_REF,
      },
      model_call_ceiling: {
        observability: "observed",
        limit: 0,
        source_ref: TEST_RESOURCE_SOURCE_REF,
      },
      usage_unit_ceiling: { observability: "unknown", limit: null, source_ref: null },
      cost_microunit_ceiling: { observability: "unknown", limit: null, source_ref: null },
      per_episode_timeout_ms: 10_000,
      total_cohort_timeout_ms: 180_000,
    });
    await runRuntimeConsumptionWitnessNegativeMatrixV01({
      root,
      manifest,
      trainingCases,
      plan,
      authorization,
      nativeConfiguration,
    });
    const fixtureOutputs = trainingFixtureOutputsV01(trainingCases, plan);
    assert.equal(fixtureOutputs.length, 15);
    initializeCommissionedLiveTrainingArtifactStoreV01({
      repository_root: artifactRepository,
      plan,
      authorization,
      family: manifest,
    });
    const sharedCodexHome = path.join(root, "seeded-shared-codex-home");
    const sharedSqliteHome = path.join(root, "seeded-shared-sqlite-home");
    mkdirSync(sharedCodexHome, { recursive: true, mode: 0o700 });
    mkdirSync(sharedSqliteHome, { recursive: true, mode: 0o700 });
    writeFileSync(
      path.join(sharedCodexHome, "foreign-instruction.txt"),
      "SEEDED_FOREIGN_INSTRUCTION_MUST_NOT_CROSS",
      { encoding: "utf8", mode: 0o600 },
    );
    writeFileSync(
      path.join(sharedSqliteHome, "sibling-history.txt"),
      "SEEDED_SIBLING_TRANSCRIPT_MUST_NOT_CROSS",
      { encoding: "utf8", mode: 0o600 },
    );
    const priorCodexHome = process.env.CODEX_HOME;
    const priorCodexSqliteHome = process.env.CODEX_SQLITE_HOME;
    let result: Awaited<ReturnType<typeof executeCommissionedLiveTrainingCohortV01>>;
    try {
      process.env.CODEX_HOME = sharedCodexHome;
      process.env.CODEX_SQLITE_HOME = sharedSqliteHome;
      result = await executeCommissionedLiveTrainingCohortV01({
        source_repository_root: process.cwd(),
        artifact_repository_root: artifactRepository,
        manifest,
        training_cases: trainingCases,
        plan,
        authorization,
        authorization_nonce: AUTHORIZATION_NONCE,
        native_execution_configuration: nativeConfiguration,
        current_main_sha: FOUNDATION_SHA,
        current_main_tree: FOUNDATION_TREE,
        consumer_instance_ref: testRecordRefV01("consumer-instance-01"),
        execution_started_at: "2026-08-28T06:02:00.000Z",
        credential_free_compatibility_observation:
          TEST_ISOLATED_AUTH_HARNESS.credential_free_preflight,
        isolated_runtime_parent: isolatedRuntimeParent,
        test_fixture_outputs: fixtureOutputs,
        fake_app_server_path: path.join(
          process.cwd(),
          "scripts",
          "fixtures",
          "fake-codex-app-server.mjs",
        ),
        create_isolated_authenticated_execution_owner:
          createTestIsolatedAuthenticatedExecutionOwnerV01,
      });
    } finally {
      if (priorCodexHome === undefined) delete process.env.CODEX_HOME;
      else process.env.CODEX_HOME = priorCodexHome;
      if (priorCodexSqliteHome === undefined) delete process.env.CODEX_SQLITE_HOME;
      else process.env.CODEX_SQLITE_HOME = priorCodexSqliteHome;
    }
    assert.equal(result.valid_predecessor_episodes, 3);
    assert.equal(result.valid_successor_episodes, 12);
    assert.deepEqual(result.provider_calls, {
      provenance: "observed",
      value: 0,
      source_ref: result.provider_calls.source_ref,
    });
    assert.deepEqual(result.model_calls, {
      provenance: "observed",
      value: 0,
      source_ref: result.model_calls.source_ref,
    });
    assert.equal(result.task_external_network.provenance, "observed");
    assert.equal(result.task_external_network.value, 0);
    assert.equal(result.holdout_materialized, false);
    assert.equal(result.fake_output_is_behavioral_evidence, false);
    assert.equal(result.cleanup_complete, true);
    assert.equal(result.artifacts.episodes.length, 15);
    assert.equal(result.artifacts.attempt_admissions.length, 16);
    assert.equal(result.artifacts.attempt_starts.length, 16);
    assert.equal(result.artifacts.attempt_terminals.length, 16);
    assert.equal(
      new Set(
        result.artifacts.attempt_starts.map(
          (attempt) => attempt.attempt_state_root_fingerprint,
        ),
      ).size,
      16,
    );
    const aggregableAdmissionFingerprints = new Set(
      result.artifacts.attempt_terminals
        .filter((terminal) => terminal.aggregable)
        .map((terminal) => terminal.attempt_admission_ref.record_fingerprint),
    );
    assert.equal(
      result.artifacts.attempt_admissions.every(
        (admission) => {
          const isolationStatus = aggregableAdmissionFingerprints.has(
            admission.integrity.fingerprint,
          )
            ? "observed_exact"
            : "not_observed_pre_spawn_failure";
          return (
          admission.codex_environment_binding_fingerprint ===
            authorization.codex_environment_binding.integrity.fingerprint &&
          admission.isolation_observation.distinct_from_prior_attempt_state_roots &&
          admission.isolation_observation.state_root_created_empty &&
          !admission.isolation_observation.shared_codex_home_fallback_used &&
          !admission.isolation_observation.predecessor_history_present &&
          !admission.isolation_observation.sibling_history_present &&
          !admission.isolation_observation.foreign_instruction_or_config_present &&
          admission.isolation_observation.account_projection_status ===
            isolationStatus &&
          admission.isolation_observation.codex_configuration_status ===
            isolationStatus &&
          admission.isolation_observation.tool_policy_status ===
            isolationStatus &&
          admission.isolation_observation.raw_auth_config_or_history_persisted ===
            false
          );
        },
      ),
      true,
    );
    assert.equal(result.artifacts.attempt_registry.replacement_invocation_count, 1);
    assert.equal(
      result.artifacts.attempt_terminals.filter(
        (terminal) => terminal.terminal_status === "non_aggregable_failure",
      ).length,
      1,
    );
    assert.equal(result.artifacts.predecessor_checkpoints.length, 3);
    assert.equal(result.artifacts.clone_seals.length, 3);
    assert.equal(result.artifacts.blind_objective_observations.length, 15);
    assert.equal(result.artifacts.analysis_joins.length, 12);
    assert.equal(
      result.artifacts.clone_seals.every(
        (seal) =>
          seal.identical_initial_source_state && seal.distinct_clone_identities,
      ),
      true,
    );
    assert.equal(
      result.artifacts.blind_objective_observations.every(
        (observation) =>
          observation.observation.condition === null &&
          observation.condition_assignment_visible === false &&
          observation.mutable_after_seal === false,
      ),
      true,
    );
    assert.equal(
      result.artifacts.analysis_joins.every(
        (join) => join.joined_after_observation_seal && !join.observation_mutated,
      ),
      true,
    );
    assert.equal(
      result.artifacts.episodes
        .filter((episode) => episode.episode_role === "successor")
        .every(
          (episode) =>
            episode.episode_origin.origin_kind === "cold_successor" &&
            episode.execution_binding.new_run_for_cold_episode &&
            !episode.execution_binding.predecessor_run_reused &&
            !episode.execution_binding.predecessor_execution_grant_inherited &&
            !episode.execution_binding.predecessor_transcript_inherited &&
            !episode.execution_binding.hidden_reasoning_inherited,
        ),
      true,
    );
    const upperStages = new Set([
      "referenced",
      "behaviorally_conditioned",
      "support_validated",
      "outcome_associated",
      "intervention_sensitive",
      "repeatable",
      "held_out_transfer",
    ]);
    assert.equal(
      result.artifacts.episodes.every((episode) =>
        episode.evidence_ladder
          .filter((row) => upperStages.has(row.stage))
          .every((row) => row.status !== "established"),
      ),
      true,
    );
    assert.deepEqual(
      result.artifacts.candidate_assessment.components.map((component) => component.status),
      ["incomplete", "incomplete", "incomplete"],
    );
    assert.equal(
      result.artifacts.candidate_assessment.learned_procedural_knowledge_claimed,
      false,
    );
    assert.equal(result.artifacts.candidate_assessment.transfer_claimed, false);
    const persistedRoot = path.join(
      artifactRepository,
      result.artifact_summary.relative_run_root,
    );
    const persistedText = readFilesRecursivelyV01(persistedRoot);
    for (const output of fixtureOutputs) {
      for (const write of output.writes) {
        assert.equal(persistedText.includes(write.content), false);
      }
    }
    assert.equal(persistedText.includes("modules/ledger/"), false);
    assert.equal(
      persistedText.includes("SEEDED_FOREIGN_INSTRUCTION_MUST_NOT_CROSS"),
      false,
    );
    assert.equal(
      persistedText.includes("SEEDED_SIBLING_TRANSCRIPT_MUST_NOT_CROSS"),
      false,
    );
    for (const forbidden of [
      "commissioned_live_training_runtime_consumption_witness.v0.1",
      "fixture-agent-private-key-material-never-public",
      "acct-fixture-stable-private",
      "user-fixture-stable-private",
      "not-returned-to-augnes@example.invalid",
      "AUGNES_CW1_L1_KEYCHAIN_SERVICE_NAME",
      "AUGNES_CW1_L1_KEYCHAIN_ACCOUNT_NAME",
      "AUGNES_CW1_L1_KEYCHAIN_PATH",
    ])
      assert.equal(persistedText.includes(forbidden), false);
    assertCandidateRuleMatrixV01({ plan, result });
    const index = validateCommissionedLiveTrainingArtifactsV01({
      repository_root: artifactRepository,
      relative_run_root: result.artifact_summary.relative_run_root,
      expected_authorization_fingerprint: authorization.integrity.fingerprint,
      expected_plan_fingerprint: plan.integrity.fingerprint,
      expected_completion_witness_fingerprint:
        result.artifact_summary.completion_witness_fingerprint,
    });
    assert.equal(index.expected_primary_episode_count, 15);
    assert.equal(index.expected_holdout_episode_count, 0);
    assert.equal(index.holdout_materialized, false);
    assert.equal(index.raw_prompt_persisted, false);
    assert.equal(index.raw_transcript_persisted, false);
    assert.equal(index.hidden_reasoning_persisted, false);
    assert.equal(index.raw_provider_payload_persisted, false);
    assert.equal(index.github_writes, 0);
    assert.equal(index.core_writes, 0);
    assert.equal(index.semantic_writes, 0);
    runCliContractV01({
      root,
      artifactRepository,
      manifest,
      trainingCases,
      plan,
      authorization,
      nativeConfiguration,
      attemptStart: result.artifacts.attempt_starts[0]!,
      relativeRunRoot: result.artifact_summary.relative_run_root,
      completionWitnessFingerprint:
        result.artifact_summary.completion_witness_fingerprint,
    });
    await assertIncompleteFailureArtifactsV01({
      root,
      manifest,
      trainingCases,
      nativeConfiguration,
    });
    await assertInjectedIncompleteCloseoutV01({
      root,
      manifest,
      trainingCases,
      nativeConfiguration,
      cohortSuffix: "after-consumption",
      failureStage: "after_authorization_consumption_before_temp_root",
      expectedCompletedEpisodes: 0,
      completeIndexExpected: false,
    });
    await assertInjectedIncompleteCloseoutV01({
      root,
      manifest,
      trainingCases,
      nativeConfiguration,
      cohortSuffix: "after-one-valid-episode",
      failureStage: "after_first_valid_episode",
      expectedCompletedEpisodes: 1,
      completeIndexExpected: false,
    });
    await assertInjectedIncompleteCloseoutV01({
      root,
      manifest,
      trainingCases,
      nativeConfiguration,
      cohortSuffix: "after-one-valid-successor",
      failureStage: "after_first_valid_successor",
      expectedCompletedEpisodes: 4,
      completeIndexExpected: false,
    });
    await assertInjectedIncompleteCloseoutV01({
      root,
      manifest,
      trainingCases,
      nativeConfiguration,
      cohortSuffix: "after-completion-index",
      failureStage: "after_completion_index_before_witness",
      expectedCompletedEpisodes: 15,
      completeIndexExpected: true,
    });
    await runNegativeProofMatrixV01({
      root,
      artifactRepository,
      trainingCases,
      manifest,
      plan,
      authorization,
      nativeConfiguration,
      result,
    });
    process.stdout.write(`${JSON.stringify({
      status: "passed",
      family_id: manifest.family_id,
      cohort_id: plan.cohort_id,
      primary_episode_slots: plan.slots.length,
      predecessor_episode_count: 3,
      cold_successor_episode_count: 12,
      schedule_fingerprint: plan.schedule_fingerprint,
      authorization_version: authorization.authorization_version,
      authorization_fingerprint: authorization.integrity.fingerprint,
      authorization_consumption_single_use: true,
      concurrent_consumption_winners: 1,
      artifact_namespace: COMMISSIONED_LIVE_TRAINING_ARTIFACT_NAMESPACE_V01,
      artifact_slot_count: index.artifacts.length,
      candidate_component_statuses:
        result.artifacts.candidate_assessment.components.map((component) => component.status),
      holdout_materialized: false,
      holdout_candidate_frozen: false,
      fake_output_is_behavioral_evidence: false,
      real_provider_calls: 0,
      model_calls: 0,
      task_external_network_calls: 0,
      cleanup_complete: true,
      owned_processes_remaining: 0,
      owned_listeners_remaining: 0,
      owned_repository_roots_remaining: 0,
    })}\n`);
  } finally {
    if (priorCanonicalTestMode === undefined) {
      delete process.env.AUGNES_CANONICAL_TEST_MODE;
    } else {
      process.env.AUGNES_CANONICAL_TEST_MODE = priorCanonicalTestMode;
    }
    if (priorIsolatedAuthTestMode === undefined) {
      delete process.env.AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE;
    } else {
      process.env.AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE =
        priorIsolatedAuthTestMode;
    }
    if (priorTmpDir === undefined) delete process.env.TMPDIR;
    else process.env.TMPDIR = priorTmpDir;
    rmSync(root, { recursive: true, force: true });
  }
}

function assertCandidateRuleMatrixV01(input: {
  plan: CommissionedLiveTrainingCohortPlanV01;
  result: Awaited<ReturnType<typeof executeCommissionedLiveTrainingCohortV01>>;
}): void {
  const ruleTable = commissionedLiveTrainingCandidateRuleTableV01();
  const rules = ruleTable.rules;
  assert.equal(rules.length, 3);
  const buildEpisodes = (
    rule: (typeof rules)[number],
    originCount: 0 | 1 | 2,
  ): CommissionedWorkEpisodeArtifactV01[] => {
    const episodes = structuredClone(input.result.artifacts.episodes);
    const successors = episodes.filter(
      (episode) => episode.episode_role === "successor",
    );
    for (const episode of successors) {
      episode.execution_binding.execution_evidence_class =
        "commissioned_agent_observation";
      episode.evaluation.deterministic_repository_task_success = false;
      episode.evaluation.source_currentness_failure = false;
      episode.evaluation.negative_space_status = "preserved";
      episode.evaluation.verification_completeness = "complete";
      episode.evaluation.hard_failures = [];
      episode.evaluation.harmful_transfer = "not_observed";
    }
    for (const caseId of ["case-amber-17", "case-cobalt-29"].slice(
      0,
      originCount,
    )) {
      const target = successors.find(
        (episode) =>
          episode.case_id === caseId &&
          episode.condition === "exact_current_continuity",
      )!;
      const comparator = successors.find(
        (episode) =>
          episode.case_id === caseId &&
          episode.condition !== null &&
          episode.condition !== "exact_current_continuity" &&
          rule.comparable_conditions.includes(episode.condition),
      )!;
      switch (rule.component_id) {
        case "reobserve_current_source_before_action":
          target.evaluation.deterministic_repository_task_success = true;
          target.evaluation.source_currentness_failure = false;
          comparator.evaluation.source_currentness_failure = true;
          break;
        case "preserve_negative_status_without_new_support":
          target.evaluation.negative_space_status = "preserved";
          comparator.evaluation.negative_space_status = "revived";
          break;
        case "separate_execution_completion_from_verified_success":
          target.evaluation.deterministic_repository_task_success = true;
          target.evaluation.verification_completeness = "complete";
          comparator.evaluation.verification_completeness = "incomplete";
          break;
      }
    }
    return episodes;
  };
  for (const rule of rules) {
    const eligible = evaluateCommissionedLiveTrainingComponentRuleV01({
      rule,
      episodes: buildEpisodes(rule, 2),
      plan: input.plan,
      analysis_joins: input.result.artifacts.analysis_joins,
    });
    assert.equal(eligible.status, "mechanically_eligible_for_holdout");
    assert.equal(eligible.independent_origin_count, 2);
    assert.equal(eligible.actual_reference_status, "unknown");
    assert.equal(eligible.actual_use_status, "unknown");
    assert.equal(eligible.support_validated_status, "unknown");
    assert.equal(eligible.outcome_associated_status, "unknown");

    const oneOrigin = evaluateCommissionedLiveTrainingComponentRuleV01({
      rule,
      episodes: buildEpisodes(rule, 1),
      plan: input.plan,
      analysis_joins: input.result.artifacts.analysis_joins,
    });
    assert.equal(oneOrigin.status, "incomplete");
    assert.equal(oneOrigin.independent_origin_count, 1);

    const contradictoryEpisodes = buildEpisodes(rule, 2);
    contradictoryEpisodes.find(
      (episode) =>
        episode.case_id === "case-amber-17" &&
        episode.condition === "exact_current_continuity",
    )!.evaluation.hard_failures = [
      rule.contradictory_hard_failure_codes[0]!,
    ] as never;
    assert.equal(
      evaluateCommissionedLiveTrainingComponentRuleV01({
        rule,
        episodes: contradictoryEpisodes,
        plan: input.plan,
        analysis_joins: input.result.artifacts.analysis_joins,
      }).status,
      "not_eligible",
    );

    const harmfulEpisodes = buildEpisodes(rule, 2);
    harmfulEpisodes.find(
      (episode) =>
        episode.case_id === "case-amber-17" &&
        episode.condition === "exact_current_continuity",
    )!.evaluation.harmful_transfer = "observed";
    assert.equal(
      evaluateCommissionedLiveTrainingComponentRuleV01({
        rule,
        episodes: harmfulEpisodes,
        plan: input.plan,
        analysis_joins: input.result.artifacts.analysis_joins,
      }).status,
      "not_eligible",
    );

    const unequalEvidenceEpisodes = buildEpisodes(rule, 2);
    unequalEvidenceEpisodes.find(
      (episode) =>
        episode.case_id === "case-cobalt-29" &&
        episode.condition === "exact_current_continuity",
    )!.common_evidence_fingerprint = createProtocolSha256V01(
      `unequal-${rule.component_id}`,
    );
    const unequalEvidence = evaluateCommissionedLiveTrainingComponentRuleV01({
      rule,
      episodes: unequalEvidenceEpisodes,
      plan: input.plan,
      analysis_joins: input.result.artifacts.analysis_joins,
    });
    assert.equal(unequalEvidence.status, "incomplete");
    assert.equal(
      unequalEvidence.missing_evidence_codes.includes("common_evidence_not_equal"),
      true,
    );

    const allArmsEqual = evaluateCommissionedLiveTrainingComponentRuleV01({
      rule,
      episodes: buildEpisodes(rule, 0),
      plan: input.plan,
      analysis_joins: input.result.artifacts.analysis_joins,
    });
    assert.equal(allArmsEqual.status, "incomplete");
    assert.equal(allArmsEqual.independent_origin_count, 0);
  }
  assert.equal(
    input.result.artifacts.attempt_registry.non_aggregable_failure_refs.length,
    1,
  );
  assert.equal(
    input.result.artifacts.candidate_assessment.components.every(
      (component) => component.objective_supporting_episode_refs.length === 0,
    ),
    true,
  );
}

async function assertInjectedIncompleteCloseoutV01(input: {
  root: string;
  manifest: ReturnType<
    typeof createCommissionedControlledWorkTrainingOnlyFamilyV01
  >["manifest"];
  trainingCases: ReturnType<
    typeof createCommissionedControlledWorkTrainingOnlyFamilyV01
  >["training_cases"];
  nativeConfiguration: ReturnType<typeof buildTestNativeConfigurationV01>;
  cohortSuffix: string;
  failureStage:
    | "after_authorization_consumption_before_temp_root"
    | "after_first_valid_episode"
    | "after_first_valid_successor"
    | "after_completion_index_before_witness";
  expectedCompletedEpisodes: 0 | 1 | 4 | 15;
  completeIndexExpected: boolean;
}): Promise<void> {
  const cohortId = `cw1-l1-incomplete-${input.cohortSuffix}`;
  const repository = path.join(input.root, `${cohortId}-repository`);
  mkdirSync(repository, { recursive: true, mode: 0o700 });
  writeFileSync(path.join(repository, ".gitignore"), ".augnes-lab/\n", "utf8");
  const plan = buildCommissionedLiveTrainingCohortPlanV01({
    manifest: input.manifest,
    training_cases: input.trainingCases,
    cohort_id: cohortId,
    sealed_at: "2026-08-28T06:30:00.000Z",
  });
  const nonce = `cw1l1_${input.cohortSuffix.replaceAll("-", "_")}_nonce_000001`;
  const authorization = buildCommissionedLiveTrainingAuthorizationV01({
    authorization_id: `${cohortId}-authorization`,
    authorization_kind: "test_conformance",
    issued_at: "2026-08-28T06:31:00.000Z",
    expires_at: "2026-08-29T06:31:00.000Z",
    current_main_sha: FOUNDATION_SHA,
    current_main_tree: FOUNDATION_TREE,
    checkout_root_fingerprint: CHECKOUT_ROOT_FINGERPRINT,
    plan,
    native_execution_configuration: input.nativeConfiguration,
    codex_environment_binding: TEST_CODEX_ENVIRONMENT_BINDING,
    authorization_nonce: nonce,
    artifact_relative_root: `${COMMISSIONED_LIVE_TRAINING_ARTIFACT_NAMESPACE_V01}/${cohortId}`,
    replacement_invocation_limit: 3,
    native_host_invocation_limit: 18,
    provider_bearing_native_host_invocation_limit: 0,
    model_bearing_native_host_invocation_limit: 0,
    provider_call_ceiling: {
      observability: "observed",
      limit: 0,
      source_ref: TEST_RESOURCE_SOURCE_REF,
    },
    model_call_ceiling: {
      observability: "observed",
      limit: 0,
      source_ref: TEST_RESOURCE_SOURCE_REF,
    },
    usage_unit_ceiling: { observability: "unknown", limit: null, source_ref: null },
    cost_microunit_ceiling: { observability: "unknown", limit: null, source_ref: null },
    per_episode_timeout_ms: 10_000,
    total_cohort_timeout_ms: 180_000,
  });
  const store = initializeCommissionedLiveTrainingArtifactStoreV01({
    repository_root: repository,
    plan,
    authorization,
    family: input.manifest,
  });
  const previousCanonicalTestMode = process.env.AUGNES_CANONICAL_TEST_MODE;
  process.env.AUGNES_CANONICAL_TEST_MODE = "1";
  try {
    await assert.rejects(
      executeCommissionedLiveTrainingCohortV01({
      source_repository_root: process.cwd(),
      artifact_repository_root: repository,
      manifest: input.manifest,
      training_cases: input.trainingCases,
      plan,
      authorization,
      authorization_nonce: nonce,
      native_execution_configuration: input.nativeConfiguration,
      current_main_sha: FOUNDATION_SHA,
      current_main_tree: FOUNDATION_TREE,
      consumer_instance_ref: testRecordRefV01(`consumer-${input.cohortSuffix}`),
      execution_started_at: "2026-08-28T06:32:00.000Z",
      credential_free_compatibility_observation:
        TEST_ISOLATED_AUTH_HARNESS.credential_free_preflight,
      isolated_runtime_parent: path.join(input.root, "isolated-runtime-parent"),
      test_fixture_outputs: trainingFixtureOutputsV01(input.trainingCases, plan),
      fake_app_server_path: path.join(
        process.cwd(),
        "scripts",
        "fixtures",
        "fake-codex-app-server.mjs",
      ),
      create_isolated_authenticated_execution_owner:
        createTestIsolatedAuthenticatedExecutionOwnerV01,
        test_failure_injection_stage: input.failureStage,
      }),
      new RegExp(`live_training_test_failure_${input.failureStage}`, "u"),
    );
  } finally {
    if (previousCanonicalTestMode === undefined) {
      delete process.env.AUGNES_CANONICAL_TEST_MODE;
    } else {
      process.env.AUGNES_CANONICAL_TEST_MODE = previousCanonicalTestMode;
    }
  }
  const index = validateCommissionedLiveTrainingIncompleteArtifactsV01({
    repository_root: repository,
    relative_run_root: store.relative_run_root,
    expected_authorization_fingerprint: authorization.integrity.fingerprint,
    expected_plan_fingerprint: plan.integrity.fingerprint,
  });
  assert.equal(index.completion_state, "incomplete");
  assert.equal(index.cohort_aggregable, false);
  assert.equal(
    index.artifacts.filter((entry) => entry.slot_kind === "episode").length,
    input.expectedCompletedEpisodes,
  );
  if (input.expectedCompletedEpisodes === 4) {
    assert.equal(
      index.artifacts.filter(
        (entry) => entry.slot_kind === "predecessor_checkpoint",
      ).length,
      3,
    );
    assert.equal(
      index.artifacts.filter((entry) => entry.slot_kind === "clone_seal").length,
      3,
    );
  }
  assert.equal(
    index.artifacts.filter(
      (entry) => entry.slot_kind === "blind_objective_observation",
    ).length,
    input.expectedCompletedEpisodes,
  );
  assert.equal(
    existsSync(path.join(store.run_root, "artifact-index.json")),
    input.completeIndexExpected,
  );
  assert.equal(
    existsSync(
      path.join(
        store.live_training_root,
        "completion-witnesses",
        `${authorization.authorization_nonce_fingerprint.slice("sha256:".length)}.json`,
      ),
    ),
    false,
  );
  assert.throws(
    () => consumeCommissionedLiveTrainingAuthorizationV01({
      store,
      authorization,
      plan,
      native_execution_configuration: input.nativeConfiguration,
      current_main_sha: FOUNDATION_SHA,
      current_main_tree: FOUNDATION_TREE,
      checkout_root_fingerprint: CHECKOUT_ROOT_FINGERPRINT,
      evaluated_at: "2026-08-28T06:33:00.000Z",
      authorization_nonce: nonce,
      consumer_instance_ref: testRecordRefV01(`replay-${input.cohortSuffix}`),
      allow_test_conformance: true,
    }),
    /live_training_authorization_replay_refused/u,
  );
  if (input.expectedCompletedEpisodes === 1) {
    const resealedRepository = path.join(
      input.root,
      `${cohortId}-resealed-incomplete-host-copy`,
    );
    cpSync(repository, resealedRepository, { recursive: true });
    const runRoot = path.join(resealedRepository, store.relative_run_root);
    const indexPath = path.join(runRoot, "incomplete-artifact-index.json");
    const resealedIndex = JSON.parse(readFileSync(indexPath, "utf8"));
    const admissionEntry = resealedIndex.artifacts.find(
      (entry: { slot_kind: string }) => entry.slot_kind === "attempt_admission",
    );
    assert.ok(admissionEntry);
    const terminalEntry = resealedIndex.artifacts.find(
      (entry: { slot_kind: string; slot_id: string | null }) =>
        entry.slot_kind === "attempt_terminal" &&
        entry.slot_id === admissionEntry.slot_id,
    );
    assert.ok(terminalEntry);
    const admissionPath = path.join(runRoot, admissionEntry.relative_path);
    const admission = JSON.parse(readFileSync(admissionPath, "utf8"));
    const priorAdmissionFingerprint = admission.integrity.fingerprint;
    admission.host_context_fingerprint = createProtocolSha256V01(
      "resealed-incomplete-foreign-host-context",
    );
    resealV01(
      admission,
      "commissioned_live_training_attempt_admission_without_integrity_fingerprint",
    );
    const admissionText = canonicalizeProtocolValueV01(admission);
    writeFileSync(admissionPath, admissionText, "utf8");
    const terminalPath = path.join(runRoot, terminalEntry.relative_path);
    const terminal = JSON.parse(readFileSync(terminalPath, "utf8"));
    const priorTerminalFingerprint = terminal.integrity.fingerprint;
    terminal.attempt_admission_ref.record_fingerprint = admission.integrity.fingerprint;
    resealV01(
      terminal,
      "commissioned_live_training_attempt_terminal_without_integrity_fingerprint",
    );
    const terminalText = canonicalizeProtocolValueV01(terminal);
    writeFileSync(terminalPath, terminalText, "utf8");
    const closeoutPath = path.join(runRoot, "incomplete-closeout.json");
    const closeout = JSON.parse(readFileSync(closeoutPath, "utf8"));
    for (const ref of closeout.attempt_admission_refs as Array<{
      record_fingerprint: string;
    }>) {
      if (ref.record_fingerprint === priorAdmissionFingerprint) {
        ref.record_fingerprint = admission.integrity.fingerprint;
      }
    }
    for (const ref of closeout.attempt_terminal_refs as Array<{
      record_fingerprint: string;
    }>) {
      if (ref.record_fingerprint === priorTerminalFingerprint) {
        ref.record_fingerprint = terminal.integrity.fingerprint;
      }
    }
    resealV01(
      closeout,
      "commissioned_live_training_incomplete_closeout_without_integrity_fingerprint",
    );
    const closeoutText = canonicalizeProtocolValueV01(closeout);
    writeFileSync(closeoutPath, closeoutText, "utf8");
    for (const entry of resealedIndex.artifacts as Array<{
      relative_path: string;
      record_ref: { record_fingerprint: string };
      content_fingerprint: string;
    }>) {
      if (entry.relative_path === admissionEntry.relative_path) {
        entry.record_ref.record_fingerprint = admission.integrity.fingerprint;
        entry.content_fingerprint = createProtocolSha256V01(admissionText);
      } else if (entry.relative_path === terminalEntry.relative_path) {
        entry.record_ref.record_fingerprint = terminal.integrity.fingerprint;
        entry.content_fingerprint = createProtocolSha256V01(terminalText);
      } else if (entry.relative_path === "incomplete-closeout.json") {
        entry.record_ref.record_fingerprint = closeout.integrity.fingerprint;
        entry.content_fingerprint = createProtocolSha256V01(closeoutText);
      }
    }
    resealV01(
      resealedIndex,
      "commissioned_live_training_artifact_index_without_integrity_fingerprint",
    );
    writeFileSync(indexPath, canonicalizeProtocolValueV01(resealedIndex), "utf8");
    assert.throws(
      () => validateCommissionedLiveTrainingIncompleteArtifactsV01({
        repository_root: resealedRepository,
        relative_run_root: store.relative_run_root,
        expected_authorization_fingerprint: authorization.integrity.fingerprint,
        expected_plan_fingerprint: plan.integrity.fingerprint,
      }),
      /live_training_artifact_attempt_admission_source_invalid/u,
    );
  }
}

function runCliContractV01(input: {
  root: string;
  artifactRepository: string;
  manifest: ReturnType<
    typeof createCommissionedControlledWorkTrainingOnlyFamilyV01
  >["manifest"];
  trainingCases: ReturnType<
    typeof createCommissionedControlledWorkTrainingOnlyFamilyV01
  >["training_cases"];
  plan: CommissionedLiveTrainingCohortPlanV01;
  authorization: CommissionedLiveTrainingAuthorizationV01;
  nativeConfiguration: ReturnType<typeof buildTestNativeConfigurationV01>;
  attemptStart: ReturnType<typeof buildCommissionedLiveTrainingAttemptStartV01>;
  relativeRunRoot: string;
  completionWitnessFingerprint: string;
}): void {
  const cli = path.join(
    process.cwd(),
    "scripts",
    "run-commissioned-controlled-live-training.ts",
  );
  const run = (args: string[]): string =>
    execFileSync(process.execPath, ["--import", "tsx", cli, ...args], {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  const planInput = path.join(input.root, "cli-plan-input.json");
  const planOutput = path.join(input.root, "cli-plan-output.json");
  writeFileSync(
    planInput,
    canonicalizeProtocolValueV01({
      family_manifest: input.manifest,
      training_cases: input.trainingCases,
      cohort_id: "cw1-l1-cli-plan-contract",
      sealed_at: "2026-08-28T06:00:00.000Z",
    }),
    { encoding: "utf8", mode: 0o600 },
  );
  const planResult = JSON.parse(run(["plan-seal", planInput, planOutput]));
  assert.equal(planResult.primary_episode_slots, 15);
  assert.equal(planResult.holdout_materialized, false);
  assertValidCommissionedLiveTrainingCohortPlanV01(
    JSON.parse(readFileSync(planOutput, "utf8")),
  );
  const leakedPlanInput = path.join(input.root, "cli-plan-holdout-leak.json");
  writeFileSync(
    leakedPlanInput,
    canonicalizeProtocolValueV01({
      family_manifest: input.manifest,
      training_cases: input.trainingCases,
      cohort_id: "cw1-l1-cli-plan-holdout-leak",
      sealed_at: "2026-08-28T06:00:00.000Z",
      holdout_source: { forbidden: true },
    }),
    { encoding: "utf8", mode: 0o600 },
  );
  const leakedPlan = spawnSync(
    process.execPath,
    ["--import", "tsx", cli, "plan-seal", leakedPlanInput, path.join(input.root, "leaked-plan.json")],
    { cwd: process.cwd(), encoding: "utf8" },
  );
  assert.notEqual(leakedPlan.status, 0);
  assert.match(leakedPlan.stderr, /live_training_cli_input_schema_invalid/u);
  assert.throws(
    () => buildCommissionedLiveTrainingAuthorizationV01({
      authorization_id: "cw1-l1-cli-future-validation",
      authorization_kind: "future_live_execution",
      issued_at: "2026-08-28T06:00:00.000Z",
      expires_at: "2026-08-29T06:00:00.000Z",
      current_main_sha: FOUNDATION_SHA,
      current_main_tree: FOUNDATION_TREE,
      checkout_root_fingerprint: CHECKOUT_ROOT_FINGERPRINT,
      plan: input.plan,
      native_execution_configuration: input.nativeConfiguration,
      codex_environment_binding: TEST_CODEX_ENVIRONMENT_BINDING,
      authorization_nonce: "cw1l1_cli_future_validation_nonce_000001",
      artifact_relative_root: `${COMMISSIONED_LIVE_TRAINING_ARTIFACT_NAMESPACE_V01}/${COHORT_ID}`,
      replacement_invocation_limit: 3,
      native_host_invocation_limit: 15,
      provider_bearing_native_host_invocation_limit: 15,
      model_bearing_native_host_invocation_limit: 15,
      provider_call_ceiling: {
        observability: "unknown",
        limit: null,
        source_ref: null,
      },
      model_call_ceiling: {
        observability: "unknown",
        limit: null,
        source_ref: null,
      },
      usage_unit_ceiling: { observability: "unknown", limit: null, source_ref: null },
      cost_microunit_ceiling: { observability: "unknown", limit: null, source_ref: null },
      per_episode_timeout_ms: 10_000,
      total_cohort_timeout_ms: 180_000,
    }),
    /live_training_future_execution_binding_invalid/u,
  );
  const {
    attempt_start_version: _attemptStartVersion,
    persisted_before_native_host_invocation: _persistedBeforeInvocation,
    integrity: _attemptStartIntegrity,
    ...sixteenthStartSource
  } = input.attemptStart;
  const serializedSixteenthStart = JSON.parse(
    canonicalizeProtocolValueV01(
      buildCommissionedLiveTrainingAttemptStartV01({
        ...sixteenthStartSource,
        attempt_start_id: "cw1-l1-cli-sixteenth-native-start",
        attempt_id: "cw1-l1-cli-sixteenth-native-attempt",
        reserved_native_host_invocation_ordinal: 16,
        provider_bearing_invocation_reserved: true,
        model_bearing_invocation_reserved: true,
      }),
    ),
  );
  assert.throws(
    () =>
      assertCommissionedLiveTrainingAttemptStartReservationV01({
        authorization: input.authorization,
        start: serializedSixteenthStart,
      }),
    /live_training_attempt_start_authorization_ceiling_invalid/u,
  );
  const validationInput = path.join(input.root, "cli-authorization-input.json");
  writeFileSync(
    validationInput,
    canonicalizeProtocolValueV01({
      authorization: input.authorization,
      plan: input.plan,
      native_execution_configuration: input.nativeConfiguration,
      current_main_sha: FOUNDATION_SHA,
      current_main_tree: FOUNDATION_TREE,
      source_repository_root: process.cwd(),
      evaluated_at: "2026-08-28T06:02:00.000Z",
    }),
    { encoding: "utf8", mode: 0o600 },
  );
  const validation = spawnSync(
    process.execPath,
    ["--import", "tsx", cli, "validate-authorization", validationInput],
    { cwd: process.cwd(), encoding: "utf8" },
  );
  assert.notEqual(validation.status, 0);
  assert.match(
    validation.stderr,
    /live_training_test_authorization_not_live_authority/u,
  );
  const artifactInput = path.join(input.root, "cli-artifact-input.json");
  writeFileSync(
    artifactInput,
    canonicalizeProtocolValueV01({
      repository_root: input.artifactRepository,
      relative_run_root: input.relativeRunRoot,
      expected_authorization_fingerprint: input.authorization.integrity.fingerprint,
      expected_plan_fingerprint: input.plan.integrity.fingerprint,
      expected_completion_witness_fingerprint:
        input.completionWitnessFingerprint,
    }),
    { encoding: "utf8", mode: 0o600 },
  );
  assert.equal(JSON.parse(run(["validate-artifacts", artifactInput])).status, "valid");
  const noMode = spawnSync(process.execPath, ["--import", "tsx", cli], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.notEqual(noMode.status, 0);
  assert.match(noMode.stderr, /live_training_runner_explicit_mode_and_input_required/u);
  const refusedExecuteInput = path.join(input.root, "cli-refused-execution.json");
  writeFileSync(
    refusedExecuteInput,
    canonicalizeProtocolValueV01({
      authorization: input.authorization,
      plan: input.plan,
      native_execution_configuration: input.nativeConfiguration,
      current_main_sha: FOUNDATION_SHA,
      current_main_tree: FOUNDATION_TREE,
      source_repository_root: process.cwd(),
      artifact_repository_root: process.cwd(),
      family_manifest: input.manifest,
      training_cases: input.trainingCases,
      consumer_instance_ref: testRecordRefV01("cli-refused-consumer"),
      evaluated_at: "2026-08-28T06:02:00.000Z",
      native_host_executable_path: process.execPath,
    }),
    { encoding: "utf8", mode: 0o600 },
  );
  const refused = spawnSync(
    process.execPath,
    ["--import", "tsx", cli, "execute-training", refusedExecuteInput],
    { cwd: process.cwd(), encoding: "utf8" },
  );
  assert.notEqual(refused.status, 0);
  assert.match(refused.stderr, /live_training_cli_test_authorization_execution_refused/u);
}

async function assertIncompleteFailureArtifactsV01(input: {
  root: string;
  manifest: ReturnType<
    typeof createCommissionedControlledWorkTrainingOnlyFamilyV01
  >["manifest"];
  trainingCases: ReturnType<
    typeof createCommissionedControlledWorkTrainingOnlyFamilyV01
  >["training_cases"];
  nativeConfiguration: ReturnType<typeof buildTestNativeConfigurationV01>;
}): Promise<void> {
  const cohortId = "cw1-l1-incomplete-conformance";
  const repository = path.join(input.root, "incomplete-artifact-repository");
  mkdirSync(repository, { recursive: true, mode: 0o700 });
  writeFileSync(path.join(repository, ".gitignore"), ".augnes-lab/\n", "utf8");
  const plan = buildCommissionedLiveTrainingCohortPlanV01({
    manifest: input.manifest,
    training_cases: input.trainingCases,
    cohort_id: cohortId,
    sealed_at: "2026-08-28T06:20:00.000Z",
  });
  const nonce = "cw1l1_incomplete_conformance_nonce_000001";
  const authorization = buildCommissionedLiveTrainingAuthorizationV01({
    authorization_id: "cw1-l1-incomplete-authorization",
    authorization_kind: "test_conformance",
    issued_at: "2026-08-28T06:21:00.000Z",
    expires_at: "2026-08-29T06:21:00.000Z",
    current_main_sha: FOUNDATION_SHA,
    current_main_tree: FOUNDATION_TREE,
    checkout_root_fingerprint: CHECKOUT_ROOT_FINGERPRINT,
    plan,
    native_execution_configuration: input.nativeConfiguration,
    codex_environment_binding: TEST_CODEX_ENVIRONMENT_BINDING,
    authorization_nonce: nonce,
    artifact_relative_root: `${COMMISSIONED_LIVE_TRAINING_ARTIFACT_NAMESPACE_V01}/${cohortId}`,
    replacement_invocation_limit: 3,
    native_host_invocation_limit: 18,
    provider_bearing_native_host_invocation_limit: 0,
    model_bearing_native_host_invocation_limit: 0,
    provider_call_ceiling: {
      observability: "observed",
      limit: 0,
      source_ref: TEST_RESOURCE_SOURCE_REF,
    },
    model_call_ceiling: {
      observability: "observed",
      limit: 0,
      source_ref: TEST_RESOURCE_SOURCE_REF,
    },
    usage_unit_ceiling: { observability: "unknown", limit: null, source_ref: null },
    cost_microunit_ceiling: { observability: "unknown", limit: null, source_ref: null },
    per_episode_timeout_ms: 10_000,
    total_cohort_timeout_ms: 180_000,
  });
  const store = initializeCommissionedLiveTrainingArtifactStoreV01({
    repository_root: repository,
    plan,
    authorization,
    family: input.manifest,
  });
  const fixtureOutputs = trainingFixtureOutputsV01(input.trainingCases, plan);
  fixtureOutputs[0] = {
    ...fixtureOutputs[0]!,
    pre_action_infrastructure_failure_on_primary: true,
    pre_action_infrastructure_failure_on_replacement: true,
  };
  await assert.rejects(
    executeCommissionedLiveTrainingCohortV01({
      source_repository_root: process.cwd(),
      artifact_repository_root: repository,
      manifest: input.manifest,
      training_cases: input.trainingCases,
      plan,
      authorization,
      authorization_nonce: nonce,
      native_execution_configuration: input.nativeConfiguration,
      current_main_sha: FOUNDATION_SHA,
      current_main_tree: FOUNDATION_TREE,
      consumer_instance_ref: testRecordRefV01("incomplete-consumer"),
      execution_started_at: "2026-08-28T06:22:00.000Z",
      credential_free_compatibility_observation:
        TEST_ISOLATED_AUTH_HARNESS.credential_free_preflight,
      isolated_runtime_parent: path.join(input.root, "isolated-runtime-parent"),
      test_fixture_outputs: fixtureOutputs,
    fake_app_server_path: path.join(
        process.cwd(),
        "scripts",
        "fixtures",
      "fake-codex-app-server.mjs",
    ),
    create_isolated_authenticated_execution_owner:
      createTestIsolatedAuthenticatedExecutionOwnerV01,
    }),
    /live_training_runner_replacement_failed_or_second_replacement_refused/u,
  );
  const index = validateCommissionedLiveTrainingIncompleteArtifactsV01({
    repository_root: repository,
    relative_run_root: store.relative_run_root,
    expected_authorization_fingerprint: authorization.integrity.fingerprint,
    expected_plan_fingerprint: plan.integrity.fingerprint,
  });
  assert.equal(index.completion_state, "incomplete");
  assert.equal(index.complete_expected_slots, false);
  assert.equal(index.cohort_aggregable, false);
  assert.equal(index.artifacts.filter((entry) => entry.slot_kind === "attempt_start").length, 2);
  assert.equal(index.artifacts.filter((entry) => entry.slot_kind === "attempt_terminal").length, 2);
  assert.equal(index.artifacts.filter((entry) => entry.slot_kind === "incomplete_closeout").length, 1);
  assert.equal(index.artifacts.some((entry) => entry.slot_kind === "training_result"), false);
  assert.throws(
    () => consumeCommissionedLiveTrainingAuthorizationV01({
      store,
      authorization,
      plan,
      native_execution_configuration: input.nativeConfiguration,
      current_main_sha: FOUNDATION_SHA,
      current_main_tree: FOUNDATION_TREE,
      checkout_root_fingerprint: CHECKOUT_ROOT_FINGERPRINT,
      evaluated_at: "2026-08-28T06:23:00.000Z",
      authorization_nonce: nonce,
      consumer_instance_ref: testRecordRefV01("incomplete-replay-consumer"),
      allow_test_conformance: true,
    }),
    /live_training_authorization_replay_refused/u,
  );
}

async function runRuntimeConsumptionWitnessNegativeMatrixV01(input: {
  root: string;
  manifest: ReturnType<
    typeof createCommissionedControlledWorkTrainingOnlyFamilyV01
  >["manifest"];
  trainingCases: ReturnType<
    typeof createCommissionedControlledWorkTrainingOnlyFamilyV01
  >["training_cases"];
  plan: CommissionedLiveTrainingCohortPlanV01;
  authorization: CommissionedLiveTrainingAuthorizationV01;
  nativeConfiguration: ReturnType<typeof buildTestNativeConfigurationV01>;
}): Promise<void> {
  const repository = path.join(input.root, "runtime-witness-negative-repository");
  mkdirSync(repository, { recursive: true, mode: 0o700 });
  writeFileSync(path.join(repository, ".gitignore"), ".augnes-lab/\n", {
    encoding: "utf8",
    mode: 0o600,
  });
  const nonce = "cw1l1_runtime_witness_negative_nonce_000001";
  const authorization = buildCommissionedLiveTrainingAuthorizationV01({
    authorization_id: "cw1-l1-runtime-witness-negative",
    authorization_kind: "future_live_control_flow_conformance",
    issued_at: input.authorization.issued_at,
    expires_at: input.authorization.expires_at,
    current_main_sha: FOUNDATION_SHA,
    current_main_tree: FOUNDATION_TREE,
    checkout_root_fingerprint: CHECKOUT_ROOT_FINGERPRINT,
    plan: input.plan,
    native_execution_configuration: input.nativeConfiguration,
    codex_environment_binding: TEST_CODEX_ENVIRONMENT_BINDING,
    authorization_nonce: nonce,
    artifact_relative_root: input.authorization.artifact_relative_root,
    replacement_invocation_limit:
      input.authorization.replacement_invocation_limit,
    native_host_invocation_limit:
      input.authorization.native_host_invocation_limit,
    provider_bearing_native_host_invocation_limit: 0,
    model_bearing_native_host_invocation_limit: 0,
    provider_call_ceiling: structuredClone(
      input.authorization.provider_call_ceiling,
    ),
    model_call_ceiling: structuredClone(input.authorization.model_call_ceiling),
    usage_unit_ceiling: structuredClone(input.authorization.usage_unit_ceiling),
    cost_microunit_ceiling: structuredClone(
      input.authorization.cost_microunit_ceiling,
    ),
    per_episode_timeout_ms: input.authorization.per_episode_timeout_ms,
    total_cohort_timeout_ms: input.authorization.total_cohort_timeout_ms,
  });
  const store = initializeCommissionedLiveTrainingArtifactStoreV01({
    repository_root: repository,
    plan: input.plan,
    authorization,
    family: input.manifest,
  });
  const consumed = consumeCommissionedLiveTrainingAuthorizationV01({
    store,
    authorization,
    plan: input.plan,
    native_execution_configuration: input.nativeConfiguration,
    current_main_sha: FOUNDATION_SHA,
    current_main_tree: FOUNDATION_TREE,
    checkout_root_fingerprint: CHECKOUT_ROOT_FINGERPRINT,
    evaluated_at: "2026-08-28T06:04:00.000Z",
    authorization_nonce: nonce,
    consumer_instance_ref: testRecordRefV01("runtime-witness-negative-consumer"),
    allow_test_conformance: true,
  });
  const clonedWitness = structuredClone(consumed.runtime_witness);
  assert.throws(
    () =>
      assertSourceOwnedCommissionedLiveTrainingRuntimeConsumptionWitnessV01(
        clonedWitness,
      ),
    /live_training_runtime_consumption_witness_source_invalid/u,
  );
  const source = input.trainingCases[0];
  const attemptRepository = path.join(input.root, "runtime-witness-attempt-root");
  mkdirSync(attemptRepository, { recursive: true, mode: 0o700 });
  for (const fixture of source.repository_fixture) {
    const target = path.join(
      attemptRepository,
      fixture.repository_relative_path,
    );
    mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 });
    writeFileSync(target, fixture.content, { encoding: "utf8", mode: 0o600 });
  }
  const packet = buildCommissionedWorkTaskContextPacketV01({
    manifest: input.manifest,
    source,
    plan: source.predecessor_plan,
    consolidation_candidate: null,
    expected_candidate_freeze_fingerprint: null,
    generated_at: "2026-08-28T06:04:00.000Z",
  });
  const request = buildCommissionedWorkNativeHostRequestV01({
    manifest: input.manifest,
    source,
    plan: source.predecessor_plan,
    consolidation_candidate: null,
    expected_candidate_freeze_fingerprint: null,
    packet,
    runtime: {
      report_included: false,
      case_id: source.case_id,
      condition: null,
      holdout_variant: null,
      workspace_id: input.manifest.workspace_id,
      project_id: source.project_id,
      repository_root: attemptRepository,
      database_path: path.join(attemptRepository, "runtime.sqlite"),
      home_root: attemptRepository,
      data_root: attemptRepository,
      config_root: attemptRepository,
      runtime_root: attemptRepository,
      artifact_root: attemptRepository,
    },
    episode_id: "runtime-witness-negative-episode",
    requested_at: "2026-08-28T06:04:00.000Z",
  });
  const ownerState = path.join(input.root, "runtime-witness-owner-state");
  const owner = TEST_ISOLATED_AUTH_HARNESS.create_owner({
    repository_root: attemptRepository,
    state_parent: ownerState,
    test_environment: {
      AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE: "1",
      FAKE_CODEX_SCENARIO: "isolated_auth_success",
    },
  });
  const slot = input.plan.slots[0]!;
  try {
    for (const witness of [
      clonedWitness,
      consumed.consumption as unknown as typeof consumed.runtime_witness,
    ]) {
      assert.throws(
        () =>
          createCommissionedLiveTrainingTestExecutionAuthorizationV01({
            witness,
            owner,
            request,
            slot,
            attempt_id: slot.primary_attempt_id,
            attempt_kind: "primary",
            invocation_ordinal: 1,
            expires_at: authorization.expires_at,
          }),
        /live_training_runtime_consumption_witness_source_invalid/u,
      );
    }
    assert.throws(
      () =>
        createCommissionedLiveTrainingTestExecutionAuthorizationV01({
          witness: consumed.runtime_witness,
          owner,
          request,
          slot,
          attempt_id: "cw1l1-attempt-not-consumed-p",
          attempt_kind: "primary",
          invocation_ordinal: 1,
          expires_at: authorization.expires_at,
        }),
      /live_training_external_execution_authorization_allocation_refused/u,
    );
    const grant =
      createCommissionedLiveTrainingProductionAuthorizationSourceOwnershipContractFixtureV01({
      witness: consumed.runtime_witness,
      owner,
      request,
      slot,
      attempt_id: slot.primary_attempt_id,
      attempt_kind: "primary",
      invocation_ordinal: 1,
    });
    assert.equal(grant.single_use, true);
    assert.equal("consume_for_adapter_v01" in grant, false);
    assert.equal(containsFunctionMemberV01(grant), false);
    assertCommissionedLiveTrainingExternalExecutionAuthorizationPublicMaterialV01(
      grant,
    );
    const publicGrantText = JSON.stringify(grant);
    for (const forbidden of [
      "consume_for_adapter_v01",
      "childprocess",
      "stdin",
      "stdout",
      "keychain",
      "auth.json",
      "private_key",
      "jwt",
    ])
      assert.equal(publicGrantText.toLowerCase().includes(forbidden), false);
    const adapterObservation = {
      owner,
      request_id: request.request_id,
      run_id: request.run_id,
      root_scope_fingerprint: grant.root_scope_fingerprint,
      projection_fingerprint: grant.projection_fingerprint,
      execution_environment_fingerprint:
        grant.execution_environment_fingerprint,
      provider_ref: grant.provider_ref,
      model_configuration_fingerprint:
        grant.model_configuration_ref.external_id.slice(
          "codex-isolated-auth-model-configuration:".length,
        ),
      effective_route_fingerprint: grant.effective_route_fingerprint,
      observed_model_id: grant.expected_model_id,
      observed_reasoning_effort: grant.expected_reasoning_effort,
      observed_at: "2026-08-28T06:05:00.000Z",
    };
    const clonedGrant = structuredClone(grant);
    const { integrity: _clonedIntegrity, ...clonedMaterial } = clonedGrant;
    clonedGrant.integrity = {
      algorithm: "sha256",
      fingerprint: createProtocolSha256V01(
        canonicalizeProtocolValueV01(clonedMaterial),
      ),
    };
    assertCommissionedLiveTrainingExternalExecutionAuthorizationPublicMaterialV01(
      clonedGrant,
    );
    assert.throws(
      () =>
        assertCommissionedLiveTrainingExternalExecutionAuthorizationSourceOwnedV01(
          clonedGrant,
        ),
      /live_training_external_execution_authorization_source_identity_missing/u,
    );
    assert.throws(
      () =>
        consumeCommissionedLiveTrainingProductionAuthorizationSourceOwnershipContractFixtureV01(
          clonedGrant,
          adapterObservation,
        ),
      /live_training_external_execution_authorization_source_identity_missing/u,
    );
    for (const changedObservation of [
      { request_id: `${request.request_id}-wrong` },
      { run_id: `${request.run_id}-wrong` },
      { root_scope_fingerprint: createProtocolSha256V01("wrong-root") },
      { projection_fingerprint: createProtocolSha256V01("wrong-projection") },
      {
        execution_environment_fingerprint:
          createProtocolSha256V01("wrong-environment"),
      },
      {
        provider_ref: {
          ...grant.provider_ref,
          external_id: `${grant.provider_ref.external_id}-wrong`,
        },
      },
      {
        model_configuration_fingerprint:
          createProtocolSha256V01("wrong-model-configuration"),
      },
      {
        effective_route_fingerprint:
          createProtocolSha256V01("wrong-route"),
      },
      { observed_model_id: "wrong-model" },
      { observed_reasoning_effort: "wrong-reasoning" },
      { observed_at: grant.expires_at },
    ])
      assert.throws(
        () =>
          consumeCommissionedLiveTrainingProductionAuthorizationSourceOwnershipContractFixtureV01(
            grant,
            { ...adapterObservation, ...changedObservation },
          ),
        /live_training_external_execution_authorization_consumption_refused/u,
      );
    const wrongOwner = TEST_ISOLATED_AUTH_HARNESS.create_owner({
      repository_root: attemptRepository,
      state_parent: path.join(
        input.root,
        "runtime-witness-wrong-owner-state",
      ),
      test_environment: {
        AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE: "1",
        FAKE_CODEX_SCENARIO: "isolated_auth_success",
      },
    });
    try {
      assert.throws(
        () =>
          consumeCommissionedLiveTrainingProductionAuthorizationSourceOwnershipContractFixtureV01(
            grant,
            { ...adapterObservation, owner: wrongOwner },
          ),
        /live_training_external_execution_authorization_consumption_refused/u,
      );
    } finally {
      wrongOwner.cleanupV01();
    }
    consumeCommissionedLiveTrainingProductionAuthorizationSourceOwnershipContractFixtureV01(
      grant,
      adapterObservation,
    );
    assert.throws(
      () =>
        consumeCommissionedLiveTrainingProductionAuthorizationSourceOwnershipContractFixtureV01(
          grant,
          adapterObservation,
        ),
      /live_training_external_execution_authorization_consumption_refused/u,
    );
    assert.throws(
      () =>
        createCommissionedLiveTrainingTestExecutionAuthorizationV01({
          witness: consumed.runtime_witness,
          owner,
          request,
          slot,
          attempt_id: slot.primary_attempt_id,
          attempt_kind: "primary",
          invocation_ordinal: 1,
          expires_at: authorization.expires_at,
        }),
      /live_training_external_execution_authorization_allocation_refused/u,
    );
    createCommissionedLiveTrainingTestExecutionAuthorizationV01({
      witness: consumed.runtime_witness,
      owner,
      request,
      slot,
      attempt_id: `${slot.primary_attempt_id.slice(0, -1)}r1`,
      attempt_kind: "replacement",
      invocation_ordinal: 2,
      expires_at: authorization.expires_at,
    });
    assert.throws(
      () =>
        createCommissionedLiveTrainingTestExecutionAuthorizationV01({
          witness: consumed.runtime_witness,
          owner,
          request,
          slot,
          attempt_id: `${slot.primary_attempt_id.slice(0, -1)}r1`,
          attempt_kind: "replacement",
          invocation_ordinal: 3,
          expires_at: authorization.expires_at,
        }),
      /live_training_external_execution_authorization_allocation_refused/u,
    );
    const ceilingSlot = input.plan.slots[1]!;
    assert.throws(
      () =>
        createCommissionedLiveTrainingTestExecutionAuthorizationV01({
          witness: consumed.runtime_witness,
          owner,
          request,
          slot: ceilingSlot,
          attempt_id: ceilingSlot.primary_attempt_id,
          attempt_kind: "primary",
          invocation_ordinal:
            authorization.native_host_invocation_limit + 1,
          expires_at: authorization.expires_at,
        }),
      /live_training_external_execution_authorization_allocation_refused/u,
    );
  } finally {
    owner.cleanupV01();
  }
}

async function runNegativeProofMatrixV01(input: {
  root: string;
  artifactRepository: string;
  trainingCases: ReturnType<
    typeof createCommissionedControlledWorkTrainingOnlyFamilyV01
  >["training_cases"];
  manifest: ReturnType<
    typeof createCommissionedControlledWorkTrainingOnlyFamilyV01
  >["manifest"];
  plan: CommissionedLiveTrainingCohortPlanV01;
  authorization: CommissionedLiveTrainingAuthorizationV01;
  nativeConfiguration: ReturnType<typeof buildTestNativeConfigurationV01>;
  result: Awaited<ReturnType<typeof executeCommissionedLiveTrainingCohortV01>>;
}): Promise<void> {
  const currentInput = {
    authorization: input.authorization,
    plan: input.plan,
    current_main_sha: FOUNDATION_SHA,
    current_main_tree: FOUNDATION_TREE,
    checkout_root_fingerprint: CHECKOUT_ROOT_FINGERPRINT,
    evaluated_at: "2026-08-28T06:03:00.000Z",
    native_execution_configuration: input.nativeConfiguration,
    codex_environment_binding: TEST_CODEX_ENVIRONMENT_BINDING,
    allow_test_conformance: true,
  };
  assert.throws(
    () => assertCommissionedLiveTrainingAuthorizationCurrentV01({
      ...currentInput,
      current_main_sha: "1".repeat(40),
    }),
    /live_training_authorization_source_or_runtime_drift/u,
  );
  assert.throws(
    () => assertCommissionedLiveTrainingAuthorizationCurrentV01({
      ...currentInput,
      current_main_tree: "2".repeat(40),
    }),
    /live_training_authorization_source_or_runtime_drift/u,
  );
  const wrongTrainingCases = structuredClone(input.trainingCases);
  wrongTrainingCases[0].task.goal = "Changed after seal.";
  assert.throws(
    () => buildCommissionedLiveTrainingCohortPlanV01({
      manifest: input.manifest,
      training_cases: wrongTrainingCases,
      cohort_id: COHORT_ID,
      sealed_at: input.plan.sealed_at,
    }),
    /live_training_family_or_case_commitment_drift/u,
  );
  const changedSchedule = structuredClone(input.plan);
  [changedSchedule.slots[3], changedSchedule.slots[4]] = [
    changedSchedule.slots[4]!,
    changedSchedule.slots[3]!,
  ];
  resealV01(
    changedSchedule,
    "commissioned_live_training_plan_without_integrity_fingerprint",
  );
  assert.throws(
    () => assertValidCommissionedLiveTrainingCohortPlanV01(changedSchedule),
    /live_training_schedule_or_order_changed/u,
  );
  for (const mutate of [
    (candidate: CommissionedLiveTrainingCohortPlanV01) => {
      candidate.slots[0]!.replacement_allowed = false;
    },
    (candidate: CommissionedLiveTrainingCohortPlanV01) => {
      candidate.slots[0]!.primary_attempt_id = "cw1l1-attempt-forged-p";
    },
    (candidate: CommissionedLiveTrainingCohortPlanV01) => {
      candidate.slots[0]!.executor_role_ref = testRecordRefV01(
        "forged-executor-role",
      ) as never;
    },
    (candidate: CommissionedLiveTrainingCohortPlanV01) => {
      candidate.condition_assignment_executor_visible = true as never;
    },
    (candidate: CommissionedLiveTrainingCohortPlanV01) => {
      candidate.task_evidence_equal_within_case = false as never;
    },
  ]) {
    const mutated = structuredClone(input.plan);
    mutate(mutated);
    resealV01(
      mutated,
      "commissioned_live_training_plan_without_integrity_fingerprint",
    );
    assert.throws(
      () => assertValidCommissionedLiveTrainingCohortPlanV01(mutated),
      /live_training_(?:schedule|plan|blinding|common|executor)/u,
    );
  }
  const nestedHoldoutCaseSet = structuredClone(input.trainingCases);
  (nestedHoldoutCaseSet[0] as unknown as Record<string, unknown>).holdout_source = {
    repository_relative_path: "sealed/holdout-source.mjs",
  };
  assert.throws(
    () => buildCommissionedLiveTrainingCohortPlanV01({
      manifest: input.manifest,
      training_cases: nestedHoldoutCaseSet,
      cohort_id: COHORT_ID,
      sealed_at: input.plan.sealed_at,
    }),
    /commissioned_work_case_source_schema_invalid|live_training_forbidden_holdout_or_private_material/u,
  );
  assert.throws(
    () => assertCommissionedLiveTrainingAuthorizationCurrentV01({
      ...currentInput,
      evaluated_at: input.authorization.expires_at,
    }),
    /live_training_authorization_expired/u,
  );
  assert.throws(
    () => assertCommissionedLiveTrainingInvocationGateV01({
      authorization: input.authorization,
      plan: input.plan,
      slot_id: input.plan.slots[0]!.slot_id,
      native_host_invocations_started: 0,
      provider_bearing_invocations_reserved: 0,
      model_bearing_invocations_reserved: 0,
      task_external_network_observation:
        createCommissionedLiveTrainingObservedSourcedResourceLaneV01(
          0,
          TEST_RESOURCE_SOURCE_REF,
        ),
      evaluated_at: currentInput.evaluated_at,
      current_main_sha: FOUNDATION_SHA,
      current_main_tree: FOUNDATION_TREE,
      checkout_root_fingerprint: CHECKOUT_ROOT_FINGERPRINT,
      native_execution_configuration: input.nativeConfiguration,
      codex_environment_binding: TEST_CODEX_ENVIRONMENT_BINDING,
      authorization_consumed: false,
      provider_or_model_call_possible: false,
    }),
    /live_training_authorization_not_consumed/u,
  );
  assert.throws(
    () => assertCommissionedLiveTrainingInvocationGateV01({
      authorization: input.authorization,
      plan: input.plan,
      slot_id: input.plan.slots[0]!.slot_id,
      native_host_invocations_started: 0,
      provider_bearing_invocations_reserved: 0,
      model_bearing_invocations_reserved: 0,
      task_external_network_observation:
        createCommissionedLiveTrainingUnknownSourcedResourceLaneV01(),
      evaluated_at: currentInput.evaluated_at,
      current_main_sha: FOUNDATION_SHA,
      current_main_tree: FOUNDATION_TREE,
      checkout_root_fingerprint: CHECKOUT_ROOT_FINGERPRINT,
      native_execution_configuration: input.nativeConfiguration,
      codex_environment_binding: TEST_CODEX_ENVIRONMENT_BINDING,
      authorization_consumed: true,
      provider_or_model_call_possible: false,
    }),
    /live_training_task_network_coverage_unknown/u,
  );
  const networkApproval = buildCommissionedLiveTrainingApprovalObservationV01({
    observation_id: "network-approval-terminal-stop",
    approval_request_fingerprint: createProtocolSha256V01(
      "network-approval-request",
    ),
    operation_class: "command_execution",
    repository_relative_path_count: 0,
    network_resource_count: 1,
    outside_root: false,
    github_or_publication: false,
    package_or_download: false,
    credential_or_semantic: false,
    available_decisions: ["decline", "cancel_run"],
  });
  assert.equal(networkApproval.classification, "network_request");
  assert.equal(networkApproval.decision, "cancel_run");
  assert.equal(networkApproval.terminal_cohort_stop, true);
  assert.equal(networkApproval.approval_granted, false);
  assert.deepEqual(
    assertCommissionedLiveTrainingNoResumeBoundaryV01({
      boundary_kind: "reconciliation_required",
      authorization_consumed: true,
      meaningful_action_status: "observed_absent",
    }),
    {
      disposition: "terminal_nonreplaceable_consumed_cohort_incomplete",
      replacement_allowed: false,
      resume_allowed: false,
      nonce_reusable: false,
    },
  );
  await assertConcurrentConsumptionV01(input);
  const priorArtifactHookTestMode = process.env.AUGNES_CANONICAL_TEST_MODE;
  process.env.AUGNES_CANONICAL_TEST_MODE = "1";
  try {
    assertArtifactAncestorSwapRefusalV01(input);
  } finally {
    if (priorArtifactHookTestMode === undefined) {
      delete process.env.AUGNES_CANONICAL_TEST_MODE;
    } else {
      process.env.AUGNES_CANONICAL_TEST_MODE = priorArtifactHookTestMode;
    }
  }
  const wrongNativeConfiguration = structuredClone(input.nativeConfiguration);
  wrongNativeConfiguration.model_id = "substituted-model";
  wrongNativeConfiguration.configuration_fingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01({ substituted: true }),
  );
  assert.throws(
    () => assertCommissionedLiveTrainingAuthorizationCurrentV01({
      ...currentInput,
      native_execution_configuration: wrongNativeConfiguration,
    }),
    /live_training_authorization_source_or_runtime_drift/u,
  );
  for (const exactSubstitution of [
    { provider_id: "substituted-provider" },
    { model_id: "substituted-model" },
    { route_id: "substituted-route" },
    { reasoning_effort: "high" as const },
    { host_ref: testRecordRefV01("substituted-host-ref") },
    { runtime_ref: testRecordRefV01("substituted-host-runtime") },
  ]) {
    const substituted = buildCommissionedLiveTrainingExactNativeExecutionConfigurationV01({
      provider_id: exactSubstitution.provider_id ?? input.nativeConfiguration.provider_id,
      model_id: exactSubstitution.model_id ?? input.nativeConfiguration.model_id,
      route_id: exactSubstitution.route_id ?? input.nativeConfiguration.route_id,
      reasoning_effort:
        exactSubstitution.reasoning_effort ?? input.nativeConfiguration.reasoning_effort,
      expected_cli_version: input.nativeConfiguration.expected_cli_version,
      adapter_ref: input.nativeConfiguration.adapter_ref,
      capability_ref: input.nativeConfiguration.capability_ref,
      host_ref: exactSubstitution.host_ref ?? input.nativeConfiguration.host_ref,
      cli_ref: input.nativeConfiguration.cli_ref,
      runtime_ref: exactSubstitution.runtime_ref ?? input.nativeConfiguration.runtime_ref,
      provider_ref: input.nativeConfiguration.provider_ref,
      model_ref: input.nativeConfiguration.model_ref,
      route_ref: input.nativeConfiguration.route_ref,
      cli_executable_identity:
        input.nativeConfiguration.cli_executable_identity,
      runtime_executable_identity:
        input.nativeConfiguration.runtime_executable_identity,
    });
    assert.throws(
      () => assertCommissionedLiveTrainingAuthorizationCurrentV01({
        ...currentInput,
        native_execution_configuration: substituted,
      }),
      /live_training_authorization_source_or_runtime_drift/u,
    );
  }
  assert.throws(
    () => assertCommissionedLiveTrainingInvocationGateV01({
      authorization: input.authorization,
      plan: input.plan,
      slot_id: input.plan.slots[0]!.slot_id,
      native_host_invocations_started: 18,
      provider_bearing_invocations_reserved: 0,
      model_bearing_invocations_reserved: 0,
      task_external_network_observation:
        createCommissionedLiveTrainingObservedSourcedResourceLaneV01(
          0,
          TEST_RESOURCE_SOURCE_REF,
        ),
      evaluated_at: currentInput.evaluated_at,
      current_main_sha: FOUNDATION_SHA,
      current_main_tree: FOUNDATION_TREE,
      checkout_root_fingerprint: CHECKOUT_ROOT_FINGERPRINT,
      native_execution_configuration: input.nativeConfiguration,
      codex_environment_binding: TEST_CODEX_ENVIRONMENT_BINDING,
      authorization_consumed: true,
      provider_or_model_call_possible: false,
    }),
    /live_training_authorization_ceiling_reached/u,
  );
  const observationRef = testRecordRefV01("observed-resource-01");
  assert.throws(
    () => assertCommissionedLiveTrainingResourceCeilingsV01({
      authorization: input.authorization,
      native_host_invocations_started: 15,
      provider_calls: createCommissionedLiveTrainingObservedSourcedResourceLaneV01(
        1,
        observationRef,
      ),
      model_calls: createCommissionedLiveTrainingObservedSourcedResourceLaneV01(
        0,
        observationRef,
      ),
      token_units: createCommissionedLiveTrainingUnknownSourcedResourceLaneV01(),
      cost_microunits: createCommissionedLiveTrainingUnknownSourcedResourceLaneV01(),
      elapsed_ms: 1,
    }),
    /live_training_authorization_resource_or_time_ceiling_exceeded/u,
  );
  assert.throws(
    () => assertCommissionedLiveTrainingResourceCeilingsV01({
      authorization: {
        ...input.authorization,
        cost_microunit_ceiling: {
          observability: "observed",
          limit: 0,
          source_ref: observationRef,
        },
      },
      native_host_invocations_started: 15,
      provider_calls: createCommissionedLiveTrainingObservedSourcedResourceLaneV01(
        0,
        observationRef,
      ),
      model_calls: createCommissionedLiveTrainingObservedSourcedResourceLaneV01(
        0,
        observationRef,
      ),
      token_units: createCommissionedLiveTrainingUnknownSourcedResourceLaneV01(),
      cost_microunits: createCommissionedLiveTrainingObservedSourcedResourceLaneV01(
        1,
        observationRef,
      ),
      elapsed_ms: 1,
    }),
    /live_training_authorization_resource_or_time_ceiling_exceeded/u,
  );
  assert.throws(
    () => assertCommissionedLiveTrainingResourceCeilingsV01({
      authorization: input.authorization,
      native_host_invocations_started: 15,
      provider_calls: createCommissionedLiveTrainingUnknownSourcedResourceLaneV01(),
      model_calls: createCommissionedLiveTrainingUnknownSourcedResourceLaneV01(),
      token_units: createCommissionedLiveTrainingUnknownSourcedResourceLaneV01(),
      cost_microunits: createCommissionedLiveTrainingUnknownSourcedResourceLaneV01(),
      elapsed_ms: 1,
    }),
    /live_training_numeric_ceiling_observation_unknown/u,
  );
  assert.throws(
    () => assertCommissionedLiveTrainingResourceCeilingsV01({
      authorization: input.authorization,
      native_host_invocations_started: 15,
      provider_calls: createCommissionedLiveTrainingObservedSourcedResourceLaneV01(
        0,
        observationRef,
      ),
      model_calls: createCommissionedLiveTrainingObservedSourcedResourceLaneV01(
        0,
        observationRef,
      ),
      token_units: createCommissionedLiveTrainingObservedSourcedResourceLaneV01(
        1,
        observationRef,
      ),
      cost_microunits: createCommissionedLiveTrainingUnknownSourcedResourceLaneV01(),
      elapsed_ms: input.authorization.total_cohort_timeout_ms + 1,
    }),
    /live_training_authorization_resource_or_time_ceiling_exceeded/u,
  );
  assert.throws(
    () => assertCommissionedLiveTrainingExecutorVisibleMaterialV01({
      task: "Continue the repository.",
      hidden_assignment: "exact_current_continuity",
    }),
    /live_training_executor_condition_or_arm_leak/u,
  );
  assert.throws(
    () => assertCommissionedLiveTrainingExecutorVisibleMaterialV01({
      sibling_arm: { transcript: "not admitted" },
    }),
    /live_training_executor_condition_or_arm_leak|live_training_forbidden_material/u,
  );
  const mismatchedSeal = structuredClone(input.result.artifacts.clone_seals[0]);
  mismatchedSeal.clone_baselines[1].common_request_fingerprint = "sha256:" + "1".repeat(64);
  const { seal_version: _sealVersion, integrity: _sealIntegrity, identical_initial_source_state: _identical, distinct_clone_identities: _distinct, ...mismatchedInput } = mismatchedSeal;
  assert.throws(
    () => buildCommissionedLiveTrainingCloneSealV01({
      ...mismatchedInput,
      predecessor_checkpoint_source:
        input.result.artifacts.predecessor_checkpoints.find(
          (checkpoint) => checkpoint.case_id === mismatchedSeal.case_id,
        )!,
      cohort_plan_source: input.plan,
    }),
    /live_training_successor_clone_initial_state_mismatch/u,
  );
  const reusedSeal = structuredClone(input.result.artifacts.clone_seals[0]);
  reusedSeal.clone_baselines[1].clone_identity_fingerprint =
    reusedSeal.clone_baselines[0].clone_identity_fingerprint;
  const { seal_version: _reusedVersion, integrity: _reusedIntegrity, identical_initial_source_state: _reusedIdentical, distinct_clone_identities: _reusedDistinct, ...reusedInput } = reusedSeal;
  assert.throws(
    () => buildCommissionedLiveTrainingCloneSealV01({
      ...reusedInput,
      predecessor_checkpoint_source:
        input.result.artifacts.predecessor_checkpoints.find(
          (checkpoint) => checkpoint.case_id === reusedSeal.case_id,
        )!,
      cohort_plan_source: input.plan,
    }),
    /live_training_successor_clone_identity_reused/u,
  );
  const inheritedAuthorityEpisode = structuredClone(
    input.result.artifacts.episodes.find(
      (episode) => episode.episode_role === "successor",
    )!,
  );
  (
    inheritedAuthorityEpisode.execution_binding as unknown as {
      predecessor_execution_grant_inherited: boolean;
    }
  ).predecessor_execution_grant_inherited = true;
  resealV01(
    inheritedAuthorityEpisode,
    "commissioned_work_episode_without_integrity_fingerprint",
  );
  assert.throws(
    () => assertValidCommissionedWorkEpisodeArtifactV01(inheritedAuthorityEpisode),
    /commissioned_work_episode_(?:authority|execution|binding|cold|origin)/u,
  );
  const admissions = structuredClone(input.result.artifacts.attempt_admissions);
  admissions[1].run_ref_fingerprint = admissions[0].run_ref_fingerprint;
  assert.throws(
    () => assertCommissionedLiveTrainingAttemptIdentitiesDistinctV01(admissions),
    /live_training_executor_run_context_or_clone_reused/u,
  );
  const originalAdmission = input.result.artifacts.attempt_admissions[0]!;
  const behavioralFailure = buildCommissionedLiveTrainingAttemptTerminalV01({
    terminal_id: "behavioral-failure-terminal",
    attempt_admission_ref: commissionedLiveTrainingRecordRefV01(originalAdmission),
    slot_id: originalAdmission.slot_id,
    terminal_status: "non_aggregable_failure",
    failure_class: "behavioral_failure",
    first_meaningful_action_status: "observed_present",
    repository_mutation_status: "observed_present",
    native_host_settled: true,
    cleanup_complete: true,
    episode_ref: null,
    blind_observation_ref: null,
    finished_at: "2026-08-28T07:00:00.000Z",
  });
  assert.equal(behavioralFailure.replacement_eligible, false);
  const actionStartedInfrastructureFailure =
    buildCommissionedLiveTrainingAttemptTerminalV01({
      terminal_id: "action-started-infrastructure-terminal",
      attempt_admission_ref: commissionedLiveTrainingRecordRefV01(originalAdmission),
      slot_id: originalAdmission.slot_id,
      terminal_status: "non_aggregable_failure",
      failure_class: "pre_action_host_infrastructure_failure",
      first_meaningful_action_status: "observed_present",
      repository_mutation_status: "observed_absent",
      native_host_settled: true,
      cleanup_complete: true,
      episode_ref: null,
      blind_observation_ref: null,
      finished_at: "2026-08-28T07:00:01.000Z",
    });
  assert.equal(actionStartedInfrastructureFailure.replacement_eligible, false);
  const replacedPrimary = input.result.artifacts.attempt_admissions.find(
    (admission) =>
      input.result.artifacts.attempt_terminals.find(
        (terminal) =>
          terminal.attempt_admission_ref.record_fingerprint ===
            admission.integrity.fingerprint &&
          terminal.replacement_eligible,
      ) !== undefined,
  )!;
  const secondReplacementCloneBaseline = {
    ...replacedPrimary.clone_baseline,
    clone_identity_fingerprint: createProtocolSha256V01("replacement-clone-2"),
  };
  const secondReplacementStart = buildCommissionedLiveTrainingAttemptStartV01({
    attempt_start_id: `${replacedPrimary.attempt_id.slice(0, -1)}r2-start`,
    attempt_id: `${replacedPrimary.attempt_id.slice(0, -1)}r2`,
    slot_id: replacedPrimary.slot_id,
    attempt_kind: "replacement",
    authorization_consumption_ref: replacedPrimary.authorization_consumption_ref,
    cohort_plan_ref: replacedPrimary.cohort_plan_ref,
    executor_role_ref: createCommissionedWorkRoleRefV01(
      "executor",
      `${replacedPrimary.executor_role_ref.role_id}-replacement-2`,
    ),
    run_ref_fingerprint: createProtocolSha256V01("replacement-run-2"),
    request_ref_fingerprint: createProtocolSha256V01("replacement-request-2"),
    native_execution_configuration_fingerprint:
      replacedPrimary.native_execution_configuration_fingerprint,
    codex_environment_binding_fingerprint:
      input.authorization.codex_environment_binding.integrity.fingerprint,
    attempt_state_root_fingerprint: createProtocolSha256V01(
      "replacement-attempt-state-root-2",
    ),
    adapter_execution_binding_fingerprint:
      replacedPrimary.adapter_execution_binding_fingerprint,
    clone_baseline: secondReplacementCloneBaseline,
    reserved_native_host_invocation_ordinal: 18,
    provider_bearing_invocation_reserved: false,
    model_bearing_invocation_reserved: false,
    started_at: "2026-08-28T07:00:01.000Z",
  });
  const secondReplacementHostRefSet = replacedPrimary.host_ref_set.map(
    (binding) => ({
      ...binding,
      exact_ref_fingerprint: createProtocolSha256V01(
        canonicalizeProtocolValueV01({
          prior: binding.exact_ref_fingerprint,
          replacement_ordinal: 2,
        }),
      ),
    }),
  );
  const secondReplacementIsolation =
    buildCommissionedLiveTrainingIsolationObservationV01({
      observation_id: "replacement-isolation-observation-2",
      attempt_id: secondReplacementStart.attempt_id,
      environment_binding: input.authorization.codex_environment_binding,
      attempt_state_root_fingerprint:
        secondReplacementStart.attempt_state_root_fingerprint,
      home_identity_fingerprint: createProtocolSha256V01(
        "replacement-home-identity-2",
      ),
      codex_home_identity_fingerprint: createProtocolSha256V01(
        "replacement-codex-home-identity-2",
      ),
      codex_sqlite_home_identity_fingerprint: createProtocolSha256V01(
        "replacement-codex-sqlite-home-identity-2",
      ),
      distinct_from_prior_attempt_state_roots: true,
      state_root_created_empty: true,
      shared_codex_home_fallback_used: false,
      predecessor_history_present: false,
      sibling_history_present: false,
      foreign_instruction_or_config_present: false,
      account_projection_status: "observed_exact",
      account_projection_fingerprint:
        input.authorization.codex_environment_binding
          .account_identity_fingerprint,
      codex_configuration_status: "observed_exact",
      codex_configuration_fingerprint:
        input.authorization.codex_environment_binding
          .config_tool_policy_fingerprint,
      tool_policy_status: "observed_exact",
      tool_policy_fingerprint:
        input.authorization.codex_environment_binding
          .config_tool_policy_fingerprint,
    });
  const secondReplacement = buildCommissionedLiveTrainingAttemptAdmissionV01({
    attempt_id: `${replacedPrimary.attempt_id.slice(0, -1)}r2`,
    slot_id: replacedPrimary.slot_id,
    attempt_kind: "replacement",
    replacement_of_attempt_ref: commissionedLiveTrainingRecordRefV01(replacedPrimary),
    attempt_start_ref: commissionedLiveTrainingRecordRefV01(
      secondReplacementStart,
    ),
    authorization_consumption_ref: replacedPrimary.authorization_consumption_ref,
    cohort_plan_ref: replacedPrimary.cohort_plan_ref,
    executor_role_ref: createCommissionedWorkRoleRefV01(
      "executor",
      `${replacedPrimary.executor_role_ref.role_id}-replacement-2`,
    ),
    run_ref_fingerprint: createProtocolSha256V01("replacement-run-2"),
    request_ref_fingerprint: createProtocolSha256V01("replacement-request-2"),
    host_ref_set: secondReplacementHostRefSet,
    host_context_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(secondReplacementHostRefSet),
    ),
    native_execution_configuration_fingerprint:
      replacedPrimary.native_execution_configuration_fingerprint,
    codex_environment_binding_fingerprint:
      secondReplacementStart.codex_environment_binding_fingerprint,
    isolation_observation: secondReplacementIsolation,
    approval_observations: [],
    adapter_execution_binding_fingerprint:
      replacedPrimary.adapter_execution_binding_fingerprint,
    native_host_result_fingerprint:
      createProtocolSha256V01("replacement-result-2"),
    clone_identity_fingerprint: createProtocolSha256V01("replacement-clone-2"),
    clone_baseline: secondReplacementCloneBaseline,
    admitted_at: "2026-08-28T07:00:02.000Z",
  });
  const secondReplacementTerminal = buildCommissionedLiveTrainingAttemptTerminalV01({
    terminal_id: `${secondReplacement.attempt_id}-terminal`,
    attempt_admission_ref: commissionedLiveTrainingRecordRefV01(secondReplacement),
    slot_id: secondReplacement.slot_id,
    terminal_status: "non_aggregable_failure",
    failure_class: "pre_action_host_infrastructure_failure",
    first_meaningful_action_status: "observed_absent",
    repository_mutation_status: "observed_absent",
    native_host_settled: true,
    cleanup_complete: true,
    episode_ref: null,
    blind_observation_ref: null,
    finished_at: "2026-08-28T07:00:03.000Z",
  });
  assert.throws(
    () => buildCommissionedLiveTrainingAttemptRegistryV01({
      registry_id: "second-replacement-registry",
      plan: input.plan,
      authorization: input.authorization,
      starts: [
        ...input.result.artifacts.attempt_starts,
        secondReplacementStart,
      ],
      admissions: [
        ...input.result.artifacts.attempt_admissions,
        secondReplacement,
      ],
      terminals: [
        ...input.result.artifacts.attempt_terminals,
        secondReplacementTerminal,
      ],
    }),
    /live_training_attempt_registry_slot_count_invalid/u,
  );
  assert.throws(
    () => buildCommissionedLiveTrainingAuthorizationV01({
      authorization_id: "invalid-replacement-limit",
      authorization_kind: "test_conformance",
      issued_at: "2026-08-28T06:01:00.000Z",
      expires_at: "2026-08-29T06:01:00.000Z",
      current_main_sha: FOUNDATION_SHA,
      current_main_tree: FOUNDATION_TREE,
      checkout_root_fingerprint: CHECKOUT_ROOT_FINGERPRINT,
      plan: input.plan,
      native_execution_configuration: input.nativeConfiguration,
      codex_environment_binding: TEST_CODEX_ENVIRONMENT_BINDING,
      authorization_nonce: "invalid_replacement_limit_nonce_00000001",
      artifact_relative_root: `${COMMISSIONED_LIVE_TRAINING_ARTIFACT_NAMESPACE_V01}/${COHORT_ID}`,
      replacement_invocation_limit: 4,
      native_host_invocation_limit: 18,
      provider_bearing_native_host_invocation_limit: 0,
      model_bearing_native_host_invocation_limit: 0,
      provider_call_ceiling: {
        observability: "observed",
        limit: 0,
        source_ref: TEST_RESOURCE_SOURCE_REF,
      },
      model_call_ceiling: {
        observability: "observed",
        limit: 0,
        source_ref: TEST_RESOURCE_SOURCE_REF,
      },
      usage_unit_ceiling: { observability: "unknown", limit: null, source_ref: null },
      cost_microunit_ceiling: { observability: "unknown", limit: null, source_ref: null },
      per_episode_timeout_ms: 10_000,
      total_cohort_timeout_ms: 180_000,
    }),
    /live_training_authorization_ceiling_invalid/u,
  );
  assert.throws(
    () => assertSafeCommissionedLiveTrainingOutputV01({
      holdout_source: "modules/ledger/normalize.cjs",
    }),
    /live_training_forbidden_holdout_or_private_material|live_training_forbidden_material/u,
  );
  const blind = input.result.artifacts.blind_objective_observations[3]!;
  const foreignSlot = input.plan.slots.find(
    (slot) => slot.case_id !== blind.observation.case_id,
  )!;
  const foreignCommitment = input.manifest.training_cases.find(
    (commitment) => commitment.case_id === foreignSlot.case_id,
  )!;
  assert.throws(
    () => buildCommissionedLiveTrainingBlindObjectiveObservationV01({
      blind_observation_id: "cross-case-blind-observation",
      slot: foreignSlot,
      evaluator_role_id: blind.evaluator_role_ref.role_id,
      evaluator_view_fingerprint: blind.evaluator_view_fingerprint,
      case_commitment: foreignCommitment,
      observation: blind.observation,
      sealed_at: blind.sealed_at,
    }),
    /live_training_(?:blind_observation_case_binding_invalid|evaluator_unblinded_before_observation_seal)|commissioned_work_observation_source_invalid/u,
  );
  const unblindedObservation = structuredClone(blind.observation);
  unblindedObservation.condition = "exact_current_continuity";
  assert.throws(
    () => buildCommissionedLiveTrainingBlindObjectiveObservationV01({
      blind_observation_id: "unblinded-observation",
      slot: input.plan.slots.find((slot) => slot.slot_id === blind.slot_id)!,
      evaluator_role_id: blind.evaluator_role_ref.role_id,
      evaluator_view_fingerprint: blind.evaluator_view_fingerprint,
      case_commitment: input.manifest.training_cases.find(
        (commitment) => commitment.case_id === blind.observation.case_id,
      )!,
      observation: unblindedObservation,
      sealed_at: blind.sealed_at,
    }),
    /live_training_evaluator_unblinded_before_observation_seal/u,
  );
  const mutatedBlind = structuredClone(blind);
  mutatedBlind.observation.repository_diff_correctness = "failed";
  assert.throws(
    () => buildCommissionedLiveTrainingAnalysisJoinV01({
      join_id: "mutated-observation-join",
      slot: input.plan.slots.find((slot) => slot.slot_id === blind.slot_id)!,
      blind_observation: mutatedBlind,
      joined_at: "2026-08-28T08:00:00.000Z",
    }),
    /live_training_blind_observation_integrity_invalid/u,
  );
  const amberBlinds = input.result.artifacts.blind_objective_observations
    .filter((candidate) => candidate.observation.case_id === "case-amber-17")
    .sort((left, right) => Date.parse(left.sealed_at) - Date.parse(right.sealed_at));
  const earliestAmberSuccessorBlind = amberBlinds.find(
    (candidate) =>
      input.plan.slots.find((slot) => slot.slot_id === candidate.slot_id)
        ?.slot_role === "cold_successor",
  )!;
  const latestAmberSeal = Math.max(
    ...amberBlinds.map((candidate) => Date.parse(candidate.sealed_at)),
  );
  const earlyJoinTime = new Date(
    Date.parse(earliestAmberSuccessorBlind.sealed_at) + 1,
  ).toISOString();
  assert.ok(Date.parse(earlyJoinTime) < latestAmberSeal);
  const earlyJoin = buildCommissionedLiveTrainingAnalysisJoinV01({
    join_id: "early-case-unblinding-join",
    slot: input.plan.slots.find(
      (slot) => slot.slot_id === earliestAmberSuccessorBlind.slot_id,
    )!,
    blind_observation: earliestAmberSuccessorBlind,
    joined_at: earlyJoinTime,
  });
  assert.throws(
    () => buildCommissionedLiveTrainingResultV01({
      result_id: "early-case-unblinding-result",
      plan: input.plan,
      authorization: input.authorization,
      authorization_consumption_ref: createCommissionedWorkRecordRefV01({
        record_version:
          input.result.artifacts.authorization_consumption.consumption_version,
        record_id: input.result.artifacts.authorization_consumption.consumption_id,
        record_fingerprint:
          input.result.artifacts.authorization_consumption.integrity.fingerprint,
      }),
      attempt_registry: input.result.artifacts.attempt_registry,
      training_result: input.result.artifacts.training_result,
      predecessor_checkpoints: [
        input.result.artifacts.predecessor_checkpoints[0]!,
        input.result.artifacts.predecessor_checkpoints[1]!,
        input.result.artifacts.predecessor_checkpoints[2]!,
      ],
      clone_seals: [
        input.result.artifacts.clone_seals[0]!,
        input.result.artifacts.clone_seals[1]!,
        input.result.artifacts.clone_seals[2]!,
      ],
      blind_observations: input.result.artifacts.blind_objective_observations,
      analysis_joins: input.result.artifacts.analysis_joins.map((candidate) =>
        candidate.slot_id === earlyJoin.slot_id ? earlyJoin : candidate),
    }),
    /live_training_case_unblinded_before_all_observations_sealed/u,
  );
  const missingArtifactRepository = path.join(input.root, "missing-artifact-copy");
  cpSync(input.artifactRepository, missingArtifactRepository, { recursive: true });
  const copiedRunRoot = path.join(
    missingArtifactRepository,
    input.result.artifact_summary.relative_run_root,
  );
  const episodeFile = path.join(copiedRunRoot, "episodes", "cw1l1-slot-001.json");
  unlinkSync(episodeFile);
  assert.throws(
    () => validateCommissionedLiveTrainingArtifactsV01({
      repository_root: missingArtifactRepository,
      relative_run_root: input.result.artifact_summary.relative_run_root,
      expected_authorization_fingerprint: input.authorization.integrity.fingerprint,
      expected_plan_fingerprint: input.plan.integrity.fingerprint,
      expected_completion_witness_fingerprint:
        input.result.artifact_summary.completion_witness_fingerprint,
    }),
    /live_training_artifact_missing|live_training_artifact_file_set_invalid/u,
  );
  const resealedCoordinateRepository = path.join(
    input.root,
    "resealed-index-coordinate-artifact-copy",
  );
  cpSync(input.artifactRepository, resealedCoordinateRepository, {
    recursive: true,
  });
  const coordinateRunRoot = path.join(
    resealedCoordinateRepository,
    input.result.artifact_summary.relative_run_root,
  );
  const coordinateIndexPath = path.join(coordinateRunRoot, "artifact-index.json");
  const coordinateIndex = JSON.parse(readFileSync(coordinateIndexPath, "utf8"));
  const coordinateEntry = coordinateIndex.artifacts.find(
    (entry: { slot_kind: string }) => entry.slot_kind === "episode",
  );
  assert.ok(coordinateEntry);
  coordinateEntry.record_ref.record_id = "foreign-resealed-record-id";
  resealV01(
    coordinateIndex,
    "commissioned_live_training_artifact_index_without_integrity_fingerprint",
  );
  writeFileSync(
    coordinateIndexPath,
    canonicalizeProtocolValueV01(coordinateIndex),
    "utf8",
  );
  const coordinateWitnessPath = path.join(
    path.dirname(coordinateRunRoot),
    "completion-witnesses",
    `${input.authorization.authorization_nonce_fingerprint.slice("sha256:".length)}.json`,
  );
  const coordinateWitness = JSON.parse(
    readFileSync(coordinateWitnessPath, "utf8"),
  );
  coordinateWitness.artifact_index_fingerprint = coordinateIndex.integrity.fingerprint;
  coordinateWitness.artifact_index_content_fingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01(coordinateIndex),
  );
  resealV01(
    coordinateWitness,
    "commissioned_live_training_completion_witness_without_integrity_fingerprint",
  );
  writeFileSync(
    coordinateWitnessPath,
    canonicalizeProtocolValueV01(coordinateWitness),
    "utf8",
  );
  assert.throws(
    () => validateCommissionedLiveTrainingArtifactsV01({
      repository_root: resealedCoordinateRepository,
      relative_run_root: input.result.artifact_summary.relative_run_root,
      expected_authorization_fingerprint: input.authorization.integrity.fingerprint,
      expected_plan_fingerprint: input.plan.integrity.fingerprint,
      expected_completion_witness_fingerprint:
        coordinateWitness.integrity.fingerprint,
    }),
    /live_training_artifact_index_coordinate_invalid/u,
  );
  const substitutedArtifactRepository = path.join(
    input.root,
    "substituted-artifact-copy",
  );
  cpSync(input.artifactRepository, substitutedArtifactRepository, {
    recursive: true,
  });
  const substitutedCleanupPath = path.join(
    substitutedArtifactRepository,
    input.result.artifact_summary.relative_run_root,
    "cleanup-report.json",
  );
  const substitutedCleanup = JSON.parse(
    readFileSync(substitutedCleanupPath, "utf8"),
  );
  substitutedCleanup.completed = false;
  writeFileSync(
    substitutedCleanupPath,
    canonicalizeProtocolValueV01(substitutedCleanup),
    "utf8",
  );
  assert.throws(
    () => validateCommissionedLiveTrainingArtifactsV01({
      repository_root: substitutedArtifactRepository,
      relative_run_root: input.result.artifact_summary.relative_run_root,
      expected_authorization_fingerprint: input.authorization.integrity.fingerprint,
      expected_plan_fingerprint: input.plan.integrity.fingerprint,
      expected_completion_witness_fingerprint:
        input.result.artifact_summary.completion_witness_fingerprint,
    }),
    /live_training_artifact_(?:content|index|record|file)/u,
  );
  const resealedArtifactRepository = path.join(
    input.root,
    "resealed-stale-integrity-artifact-copy",
  );
  cpSync(input.artifactRepository, resealedArtifactRepository, {
    recursive: true,
  });
  const resealedRunRoot = path.join(
    resealedArtifactRepository,
    input.result.artifact_summary.relative_run_root,
  );
  const resealedCleanupPath = path.join(resealedRunRoot, "cleanup-report.json");
  const resealedCleanup = JSON.parse(readFileSync(resealedCleanupPath, "utf8"));
  resealedCleanup.completed = false;
  resealV01(
    resealedCleanup,
    "commissioned_live_training_cleanup_without_integrity_fingerprint",
  );
  const resealedCleanupText = canonicalizeProtocolValueV01(resealedCleanup);
  writeFileSync(resealedCleanupPath, resealedCleanupText, "utf8");
  const resealedIndexPath = path.join(resealedRunRoot, "artifact-index.json");
  const resealedIndex = JSON.parse(readFileSync(resealedIndexPath, "utf8"));
  const resealedCleanupEntry = resealedIndex.artifacts.find(
    (entry: { slot_kind: string }) => entry.slot_kind === "cleanup_report",
  );
  assert.ok(resealedCleanupEntry);
  resealedCleanupEntry.record_ref.record_fingerprint =
    resealedCleanup.integrity.fingerprint;
  resealedCleanupEntry.content_fingerprint =
    createProtocolSha256V01(resealedCleanupText);
  resealV01(
    resealedIndex,
    "commissioned_live_training_artifact_index_without_integrity_fingerprint",
  );
  writeFileSync(
    resealedIndexPath,
    canonicalizeProtocolValueV01(resealedIndex),
    "utf8",
  );
  const completionWitnessPath = path.join(
    path.dirname(resealedRunRoot),
    "completion-witnesses",
    `${input.authorization.authorization_nonce_fingerprint.slice("sha256:".length)}.json`,
  );
  const completionWitness = JSON.parse(
    readFileSync(completionWitnessPath, "utf8"),
  );
  completionWitness.artifact_index_fingerprint = resealedIndex.integrity.fingerprint;
  completionWitness.artifact_index_content_fingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01(resealedIndex),
  );
  resealV01(
    completionWitness,
    "commissioned_live_training_completion_witness_without_integrity_fingerprint",
  );
  writeFileSync(
    completionWitnessPath,
    canonicalizeProtocolValueV01(completionWitness),
    "utf8",
  );
  assert.throws(
    () => validateCommissionedLiveTrainingArtifactsV01({
      repository_root: resealedArtifactRepository,
      relative_run_root: input.result.artifact_summary.relative_run_root,
      expected_authorization_fingerprint: input.authorization.integrity.fingerprint,
      expected_plan_fingerprint: input.plan.integrity.fingerprint,
      expected_completion_witness_fingerprint:
        completionWitness.integrity.fingerprint,
    }),
    /live_training_cleanup_completion_invalid|live_training_artifact_cleanup_graph_invalid/u,
  );
  const resealedNativeBindingRepository = path.join(
    input.root,
    "resealed-native-binding-artifact-copy",
  );
  cpSync(input.artifactRepository, resealedNativeBindingRepository, {
    recursive: true,
  });
  const nativeBindingRunRoot = path.join(
    resealedNativeBindingRepository,
    input.result.artifact_summary.relative_run_root,
  );
  const selectedAdmission = input.result.artifacts.attempt_admissions[0]!;
  const selectedTerminal = input.result.artifacts.attempt_terminals.find(
    (terminal) =>
      terminal.attempt_admission_ref.record_fingerprint ===
      selectedAdmission.integrity.fingerprint,
  )!;
  const nativeAdmissionPath = path.join(
    nativeBindingRunRoot,
    "attempts",
    `${selectedAdmission.attempt_id}-admission.json`,
  );
  const nativeTerminalPath = path.join(
    nativeBindingRunRoot,
    "attempts",
    `${selectedTerminal.terminal_id}.json`,
  );
  const nativeAdmission = JSON.parse(readFileSync(nativeAdmissionPath, "utf8"));
  const priorAdmissionFingerprint = nativeAdmission.integrity.fingerprint;
  nativeAdmission.host_context_fingerprint =
    createProtocolSha256V01("forged-admission-host-context");
  resealV01(
    nativeAdmission,
    "commissioned_live_training_attempt_admission_without_integrity_fingerprint",
  );
  writeFileSync(
    nativeAdmissionPath,
    canonicalizeProtocolValueV01(nativeAdmission),
    "utf8",
  );
  const nativeTerminal = JSON.parse(readFileSync(nativeTerminalPath, "utf8"));
  const priorTerminalFingerprint = nativeTerminal.integrity.fingerprint;
  nativeTerminal.attempt_admission_ref.record_fingerprint =
    nativeAdmission.integrity.fingerprint;
  resealV01(
    nativeTerminal,
    "commissioned_live_training_attempt_terminal_without_integrity_fingerprint",
  );
  writeFileSync(
    nativeTerminalPath,
    canonicalizeProtocolValueV01(nativeTerminal),
    "utf8",
  );
  const nativeRegistryPath = path.join(nativeBindingRunRoot, "attempt-registry.json");
  const nativeRegistry = JSON.parse(readFileSync(nativeRegistryPath, "utf8"));
  for (const key of [
    "primary_attempts",
    "replacement_attempts",
    "non_aggregable_failure_refs",
  ]) {
    for (const ref of nativeRegistry[key] as Array<{ record_fingerprint: string }>) {
      if (ref.record_fingerprint === priorAdmissionFingerprint) {
        ref.record_fingerprint = nativeAdmission.integrity.fingerprint;
      }
    }
  }
  for (const ref of nativeRegistry.terminal_refs as Array<{
    record_fingerprint: string;
  }>) {
    if (ref.record_fingerprint === priorTerminalFingerprint) {
      ref.record_fingerprint = nativeTerminal.integrity.fingerprint;
    }
  }
  resealV01(
    nativeRegistry,
    "commissioned_live_training_attempt_registry_without_integrity_fingerprint",
  );
  writeFileSync(
    nativeRegistryPath,
    canonicalizeProtocolValueV01(nativeRegistry),
    "utf8",
  );
  const nativeIndexPath = path.join(nativeBindingRunRoot, "artifact-index.json");
  const nativeIndex = JSON.parse(readFileSync(nativeIndexPath, "utf8"));
  for (const entry of nativeIndex.artifacts as Array<{
    relative_path: string;
    record_ref: { record_fingerprint: string };
    content_fingerprint: string;
  }>) {
    if (entry.relative_path === path.posix.join(
      "attempts",
      `${selectedAdmission.attempt_id}-admission.json`,
    )) {
      entry.record_ref.record_fingerprint = nativeAdmission.integrity.fingerprint;
      entry.content_fingerprint = createProtocolSha256V01(
        canonicalizeProtocolValueV01(nativeAdmission),
      );
    } else if (entry.relative_path === path.posix.join(
      "attempts",
      `${selectedTerminal.terminal_id}.json`,
    )) {
      entry.record_ref.record_fingerprint = nativeTerminal.integrity.fingerprint;
      entry.content_fingerprint = createProtocolSha256V01(
        canonicalizeProtocolValueV01(nativeTerminal),
      );
    } else if (entry.relative_path === "attempt-registry.json") {
      entry.record_ref.record_fingerprint = nativeRegistry.integrity.fingerprint;
      entry.content_fingerprint = createProtocolSha256V01(
        canonicalizeProtocolValueV01(nativeRegistry),
      );
    }
  }
  resealV01(
    nativeIndex,
    "commissioned_live_training_artifact_index_without_integrity_fingerprint",
  );
  writeFileSync(nativeIndexPath, canonicalizeProtocolValueV01(nativeIndex), "utf8");
  const nativeWitnessPath = path.join(
    path.dirname(nativeBindingRunRoot),
    "completion-witnesses",
    `${input.authorization.authorization_nonce_fingerprint.slice("sha256:".length)}.json`,
  );
  const nativeWitness = JSON.parse(readFileSync(nativeWitnessPath, "utf8"));
  nativeWitness.artifact_index_fingerprint = nativeIndex.integrity.fingerprint;
  nativeWitness.artifact_index_content_fingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01(nativeIndex),
  );
  resealV01(
    nativeWitness,
    "commissioned_live_training_completion_witness_without_integrity_fingerprint",
  );
  writeFileSync(
    nativeWitnessPath,
    canonicalizeProtocolValueV01(nativeWitness),
    "utf8",
  );
  assert.throws(
    () => validateCommissionedLiveTrainingArtifactsV01({
      repository_root: resealedNativeBindingRepository,
      relative_run_root: input.result.artifact_summary.relative_run_root,
      expected_authorization_fingerprint: input.authorization.integrity.fingerprint,
      expected_plan_fingerprint: input.plan.integrity.fingerprint,
      expected_completion_witness_fingerprint:
        nativeWitness.integrity.fingerprint,
    }),
    /live_training_artifact_attempt_admission_source_invalid/u,
  );
  const symlinkArtifactRepository = path.join(input.root, "symlink-artifact-copy");
  cpSync(input.artifactRepository, symlinkArtifactRepository, { recursive: true });
  const symlinkRunRoot = path.join(
    symlinkArtifactRepository,
    input.result.artifact_summary.relative_run_root,
  );
  const symlinkTarget = path.join(symlinkRunRoot, "cleanup-report.json");
  const symlinkBackup = `${symlinkTarget}.backup`;
  writeFileSync(symlinkBackup, readFileSync(symlinkTarget));
  unlinkSync(symlinkTarget);
  symlinkSync(symlinkBackup, symlinkTarget);
  assert.throws(
    () => validateCommissionedLiveTrainingArtifactsV01({
      repository_root: symlinkArtifactRepository,
      relative_run_root: input.result.artifact_summary.relative_run_root,
      expected_authorization_fingerprint: input.authorization.integrity.fingerprint,
      expected_plan_fingerprint: input.plan.integrity.fingerprint,
      expected_completion_witness_fingerprint:
        input.result.artifact_summary.completion_witness_fingerprint,
    }),
    /live_training_artifact_symlink_refused|live_training_artifact_not_exact_file/u,
  );
  assert.throws(
    () => buildCommissionedLiveTrainingCleanupReportV01({
      cleanup_id: "unknown-zero-imputation",
      cohort_plan_ref: commissionedLiveTrainingRecordRefV01(input.plan),
      requested: true,
      completed: true,
      owned_processes_remaining: 0,
      owned_listeners_remaining: 0,
      owned_repository_roots_remaining: 0,
      owned_runtime_roots_remaining: 0,
      owned_temporary_roots_remaining: 0,
      stale_artifact_temporaries_remaining: 0,
      task_external_network_observation:
        createCommissionedLiveTrainingObservedSourcedResourceLaneV01(
          0,
          TEST_RESOURCE_SOURCE_REF,
        ),
      provider_calls_observed: {
        provenance: "unknown",
        value: 0,
        source_ref: null,
      } as never,
      model_calls_observed:
        createCommissionedLiveTrainingUnknownSourcedResourceLaneV01(),
      cleanup_observation:
        input.result.artifacts.cleanup_report.cleanup_observation,
      cleanup_observation_ref:
        input.result.artifacts.cleanup_report.cleanup_observation_ref,
    }),
    /live_training_resource_unknown_zero_imputation/u,
  );
  assert.throws(
    () => assertSafeCommissionedLiveTrainingOutputV01({
      raw_prompt: "sk-proj-1234567890123456789012345678901234567890",
    }),
    /live_training_forbidden_material/u,
  );
  const exactCandidateAssessment =
    buildCommissionedLiveTrainingCandidateAssessmentV01({
      assessment_id: "exact-source-bound-incomplete-assessment",
      family_manifest: input.manifest,
      plan: input.plan,
      authorization: input.authorization,
      training_result: input.result.artifacts.training_result,
      episodes: input.result.artifacts.episodes,
      blind_observations:
        input.result.artifacts.blind_objective_observations,
      analysis_joins: input.result.artifacts.analysis_joins,
      attempt_registry: input.result.artifacts.attempt_registry,
      assessor_role_id: input.manifest.consolidation_assessor.role_id,
    });
  assert.deepEqual(
    exactCandidateAssessment.components.map((component) => component.status),
    ["incomplete", "incomplete", "incomplete"],
  );
  assert.equal(
    exactCandidateAssessment.components.every(
      (component) =>
        component.independent_origin_count === 0 &&
        component.actual_reference_status !== "established" &&
        component.actual_use_status !== "established" &&
        component.support_validated_status !== "established" &&
        component.outcome_associated_status !== "established",
    ),
    true,
  );
  const selfReportOnlyEpisodes = structuredClone(
    input.result.artifacts.episodes,
  );
  const selfReportRow = selfReportOnlyEpisodes[3]!.evidence_ladder.find(
    (row) => row.stage === "referenced",
  )!;
  selfReportRow.status = "established";
  selfReportRow.basis = "exact_executor_reference";
  resealV01(
    selfReportOnlyEpisodes[3]!,
    "commissioned_work_episode_without_integrity_fingerprint",
  );
  assert.throws(
    () => buildCommissionedLiveTrainingCandidateAssessmentV01({
      assessment_id: "self-report-only-assessment",
      family_manifest: input.manifest,
      plan: input.plan,
      authorization: input.authorization,
      training_result: input.result.artifacts.training_result,
      episodes: selfReportOnlyEpisodes,
      blind_observations:
        input.result.artifacts.blind_objective_observations,
      analysis_joins: input.result.artifacts.analysis_joins,
      attempt_registry: input.result.artifacts.attempt_registry,
      assessor_role_id: input.manifest.consolidation_assessor.role_id,
    }),
    /commissioned_work_commissioned_agent_observation_binding_invalid|live_training_candidate_assessment_source_invalid/u,
  );
  assert.throws(
    () => buildCommissionedLiveTrainingCandidateAssessmentV01({
      assessment_id: "missing-origin-source-assessment",
      family_manifest: input.manifest,
      plan: input.plan,
      authorization: input.authorization,
      training_result: input.result.artifacts.training_result,
      episodes: input.result.artifacts.episodes.slice(1),
      blind_observations:
        input.result.artifacts.blind_objective_observations,
      analysis_joins: input.result.artifacts.analysis_joins,
      attempt_registry: input.result.artifacts.attempt_registry,
      assessor_role_id: input.manifest.consolidation_assessor.role_id,
    }),
    /live_training_candidate_assessment_source_invalid/u,
  );
  assert.throws(
    () => assertSafeCommissionedLiveTrainingOutputV01({
      candidate_version: "commissioned_controlled_work_candidate.v0.1",
      candidate_kind: "synthetic_mechanics_template",
    }),
    /live_training_forbidden_holdout_or_private_material/u,
  );
  assert.throws(
    () => buildCommissionedLiveTrainingAttemptRegistryV01({
      registry_id: "incomplete-registry",
      plan: input.plan,
      authorization: input.authorization,
      starts: input.result.artifacts.attempt_starts.slice(0, 14),
      admissions: input.result.artifacts.attempt_admissions.slice(0, 14),
      terminals: input.result.artifacts.attempt_terminals.slice(0, 14),
    }),
    /live_training_attempt_registry_limit_invalid/u,
  );
  assert.throws(
    () => {
      const incompleteObservation =
        buildCommissionedLiveTrainingCleanupObservationV01({
          observation_id: "cleanup-residue-observation",
          cohort_plan_ref: commissionedLiveTrainingRecordRefV01(input.plan),
          native_host_invocations_started: 1,
          exact_adapter_settlement_fingerprints: [],
          every_started_adapter_invocation_settled: false,
          listener_owner_kind: "stdio_only_no_listener_created",
          repository_roots_absent: true,
          runtime_roots_absent: true,
          temporary_roots_absent: true,
          artifact_temporaries_absent: true,
          task_external_network_observation:
            createCommissionedLiveTrainingObservedSourcedResourceLaneV01(
              0,
              TEST_RESOURCE_SOURCE_REF,
            ),
          observed_at: "2026-08-28T08:30:00.000Z",
        });
      return buildCommissionedLiveTrainingCleanupReportV01({
      cleanup_id: "cleanup-residue",
      cohort_plan_ref: commissionedLiveTrainingRecordRefV01(input.plan),
      requested: true,
      completed: true,
      owned_processes_remaining: 1,
      owned_listeners_remaining: 0,
      owned_repository_roots_remaining: 0,
      owned_runtime_roots_remaining: 0,
      owned_temporary_roots_remaining: 0,
      stale_artifact_temporaries_remaining: 0,
      task_external_network_observation:
        createCommissionedLiveTrainingObservedSourcedResourceLaneV01(
          0,
          TEST_RESOURCE_SOURCE_REF,
        ),
      provider_calls_observed:
        createCommissionedLiveTrainingObservedSourcedResourceLaneV01(
          0,
          TEST_RESOURCE_SOURCE_REF,
        ),
      model_calls_observed:
        createCommissionedLiveTrainingObservedSourcedResourceLaneV01(
          0,
          TEST_RESOURCE_SOURCE_REF,
        ),
      cleanup_observation: incompleteObservation,
      cleanup_observation_ref:
        commissionedLiveTrainingRecordRefV01(incompleteObservation),
      });
    },
    /live_training_cleanup_completion_invalid/u,
  );
  const exactBlind = input.result.artifacts.blind_objective_observations[0]!;
  const unauthorizedObservation = structuredClone(exactBlind.observation);
  (
    unauthorizedObservation.unauthorized_effects as unknown as {
      github_writes: number;
    }
  ).github_writes = 1;
  resealV01(
    unauthorizedObservation,
    "commissioned_work_objective_observation_without_integrity_fingerprint",
  );
  assert.throws(
    () => buildCommissionedLiveTrainingBlindObjectiveObservationV01({
      blind_observation_id: "unauthorized-observation",
      slot: input.plan.slots.find((slot) => slot.slot_id === exactBlind.slot_id)!,
      evaluator_role_id: exactBlind.evaluator_role_ref.role_id,
      evaluator_view_fingerprint: exactBlind.evaluator_view_fingerprint,
      case_commitment: input.manifest.training_cases.find(
        (commitment) => commitment.case_id === exactBlind.observation.case_id,
      )!,
      observation: unauthorizedObservation,
      sealed_at: exactBlind.sealed_at,
    }),
    /commissioned_work_observation_authority_expansion/u,
  );
}

function assertArtifactAncestorSwapRefusalV01(input: {
  root: string;
  manifest: ReturnType<
    typeof createCommissionedControlledWorkTrainingOnlyFamilyV01
  >["manifest"];
  plan: CommissionedLiveTrainingCohortPlanV01;
  nativeConfiguration: ReturnType<typeof buildTestNativeConfigurationV01>;
}): void {
  const repository = path.join(input.root, "artifact-ancestor-swap-repository");
  const outside = path.join(input.root, "artifact-ancestor-swap-outside");
  mkdirSync(repository, { recursive: true, mode: 0o700 });
  mkdirSync(outside, { recursive: true, mode: 0o700 });
  writeFileSync(path.join(repository, ".gitignore"), ".augnes-lab/\n", "utf8");
  const nonce = "cw1l1_ancestor_swap_nonce_00000000000001";
  const authorization = buildCommissionedLiveTrainingAuthorizationV01({
    authorization_id: "cw1-l1-ancestor-swap-authorization",
    authorization_kind: "test_conformance",
    issued_at: "2026-08-28T06:01:00.000Z",
    expires_at: "2026-08-29T06:01:00.000Z",
    current_main_sha: FOUNDATION_SHA,
    current_main_tree: FOUNDATION_TREE,
    checkout_root_fingerprint: CHECKOUT_ROOT_FINGERPRINT,
    plan: input.plan,
    native_execution_configuration: input.nativeConfiguration,
    codex_environment_binding: TEST_CODEX_ENVIRONMENT_BINDING,
    authorization_nonce: nonce,
    artifact_relative_root: `${COMMISSIONED_LIVE_TRAINING_ARTIFACT_NAMESPACE_V01}/${COHORT_ID}`,
    replacement_invocation_limit: 3,
    native_host_invocation_limit: 18,
    provider_bearing_native_host_invocation_limit: 0,
    model_bearing_native_host_invocation_limit: 0,
    provider_call_ceiling: {
      observability: "observed",
      limit: 0,
      source_ref: TEST_RESOURCE_SOURCE_REF,
    },
    model_call_ceiling: {
      observability: "observed",
      limit: 0,
      source_ref: TEST_RESOURCE_SOURCE_REF,
    },
    usage_unit_ceiling: { observability: "unknown", limit: null, source_ref: null },
    cost_microunit_ceiling: { observability: "unknown", limit: null, source_ref: null },
    per_episode_timeout_ms: 10_000,
    total_cohort_timeout_ms: 180_000,
  });
  const store = initializeCommissionedLiveTrainingArtifactStoreV01({
    repository_root: repository,
    plan: input.plan,
    authorization,
    family: input.manifest,
  });
  const namespace = path.join(repository, ".augnes-lab");
  const displaced = path.join(repository, ".augnes-lab-displaced");
  let swapped = false;
  setCommissionedLiveTrainingArtifactIoOneShotTestHookV01(() => {
    renameSync(namespace, displaced);
    symlinkSync(outside, namespace, "dir");
    swapped = true;
  });
  try {
    assert.throws(
      () => consumeCommissionedLiveTrainingAuthorizationV01({
        store,
        authorization,
        plan: input.plan,
        native_execution_configuration: input.nativeConfiguration,
        current_main_sha: FOUNDATION_SHA,
        current_main_tree: FOUNDATION_TREE,
        checkout_root_fingerprint: CHECKOUT_ROOT_FINGERPRINT,
        evaluated_at: "2026-08-28T06:03:00.000Z",
        authorization_nonce: nonce,
        consumer_instance_ref: testRecordRefV01("ancestor-swap-consumer"),
        allow_test_conformance: true,
      }),
      /live_training_artifact_directory_identity_invalid|live_training_artifact_exclusive_write_refused/u,
    );
  } finally {
    setCommissionedLiveTrainingArtifactIoOneShotTestHookV01(null);
    if (swapped) {
      unlinkSync(namespace);
      renameSync(displaced, namespace);
    }
  }
  assert.deepEqual(readdirSync(outside), []);
  assert.equal(
    existsSync(
      path.join(
        outside,
        "commissioned-controlled-workbench",
        "live-training-v0-1",
      ),
    ),
    false,
  );
  let ordinarySwapped = false;
  setCommissionedLiveTrainingArtifactIoOneShotTestHookV01(() => {
    renameSync(namespace, displaced);
    mkdirSync(namespace, { mode: 0o700 });
    ordinarySwapped = true;
  });
  try {
    assert.throws(
      () => consumeCommissionedLiveTrainingAuthorizationV01({
        store,
        authorization,
        plan: input.plan,
        native_execution_configuration: input.nativeConfiguration,
        current_main_sha: FOUNDATION_SHA,
        current_main_tree: FOUNDATION_TREE,
        checkout_root_fingerprint: CHECKOUT_ROOT_FINGERPRINT,
        evaluated_at: "2026-08-28T06:03:00.000Z",
        authorization_nonce: nonce,
        consumer_instance_ref: testRecordRefV01("ordinary-ancestor-swap-consumer"),
        allow_test_conformance: true,
      }),
      /live_training_artifact_directory_identity_(?:invalid|changed)|live_training_artifact_exclusive_write_refused/u,
    );
  } finally {
    setCommissionedLiveTrainingArtifactIoOneShotTestHookV01(null);
    if (ordinarySwapped) {
      rmdirSync(namespace);
      renameSync(displaced, namespace);
    }
  }
}

async function assertConcurrentConsumptionV01(input: {
  root: string;
  manifest: ReturnType<
    typeof createCommissionedControlledWorkTrainingOnlyFamilyV01
  >["manifest"];
  plan: CommissionedLiveTrainingCohortPlanV01;
  nativeConfiguration: ReturnType<typeof buildTestNativeConfigurationV01>;
}): Promise<void> {
  const repository = path.join(input.root, "concurrent-consumption-repository");
  mkdirSync(repository, { recursive: true, mode: 0o700 });
  writeFileSync(path.join(repository, ".gitignore"), ".augnes-lab/\n", "utf8");
  const authorization = buildCommissionedLiveTrainingAuthorizationV01({
    authorization_id: "cw1-l1-concurrent-consumption",
    authorization_kind: "test_conformance",
    issued_at: "2026-08-28T06:01:00.000Z",
    expires_at: "2026-08-29T06:01:00.000Z",
    current_main_sha: FOUNDATION_SHA,
    current_main_tree: FOUNDATION_TREE,
    checkout_root_fingerprint: CHECKOUT_ROOT_FINGERPRINT,
    plan: input.plan,
    native_execution_configuration: input.nativeConfiguration,
    codex_environment_binding: TEST_CODEX_ENVIRONMENT_BINDING,
    authorization_nonce: "cw1l1_concurrent_consumption_nonce_000001",
    artifact_relative_root: `${COMMISSIONED_LIVE_TRAINING_ARTIFACT_NAMESPACE_V01}/${COHORT_ID}`,
    replacement_invocation_limit: 3,
    native_host_invocation_limit: 18,
    provider_bearing_native_host_invocation_limit: 0,
    model_bearing_native_host_invocation_limit: 0,
    provider_call_ceiling: {
      observability: "observed",
      limit: 0,
      source_ref: TEST_RESOURCE_SOURCE_REF,
    },
    model_call_ceiling: {
      observability: "observed",
      limit: 0,
      source_ref: TEST_RESOURCE_SOURCE_REF,
    },
    usage_unit_ceiling: { observability: "unknown", limit: null, source_ref: null },
    cost_microunit_ceiling: { observability: "unknown", limit: null, source_ref: null },
    per_episode_timeout_ms: 10_000,
    total_cohort_timeout_ms: 180_000,
  });
  const store = initializeCommissionedLiveTrainingArtifactStoreV01({
    repository_root: repository,
    plan: input.plan,
    authorization,
    family: input.manifest,
  });
  const consume = (id: string) => consumeCommissionedLiveTrainingAuthorizationV01({
    store,
    authorization,
    plan: input.plan,
    native_execution_configuration: input.nativeConfiguration,
    current_main_sha: FOUNDATION_SHA,
    current_main_tree: FOUNDATION_TREE,
    checkout_root_fingerprint: CHECKOUT_ROOT_FINGERPRINT,
    evaluated_at: "2026-08-28T06:03:00.000Z",
    authorization_nonce: "cw1l1_concurrent_consumption_nonce_000001",
    consumer_instance_ref: testRecordRefV01(id),
    allow_test_conformance: true,
  });
  const workerInput = (id: string) => ({
    repository_root: repository,
    family: input.manifest,
    plan: input.plan,
    authorization,
    native_execution_configuration: input.nativeConfiguration,
    current_main_sha: FOUNDATION_SHA,
    current_main_tree: FOUNDATION_TREE,
    checkout_root_fingerprint: CHECKOUT_ROOT_FINGERPRINT,
    evaluated_at: "2026-08-28T06:03:00.000Z",
    authorization_nonce: "cw1l1_concurrent_consumption_nonce_000001",
    consumer_instance_ref: testRecordRefV01(id),
  });
  const inputA = path.join(input.root, "concurrent-consumer-a.json");
  const inputB = path.join(input.root, "concurrent-consumer-b.json");
  writeFileSync(inputA, canonicalizeProtocolValueV01(workerInput("concurrent-consumer-a")));
  writeFileSync(inputB, canonicalizeProtocolValueV01(workerInput("concurrent-consumer-b")));
  const workerPath = path.join(
    process.cwd(),
    "scripts",
    "fixtures",
    "consume-live-training-authorization.ts",
  );
  const settled = await Promise.all([
    spawnConsumptionWorkerV01(workerPath, inputA),
    spawnConsumptionWorkerV01(workerPath, inputB),
  ]);
  assert.equal(settled.filter((item) => item.code === 0).length, 1);
  assert.equal(settled.filter((item) => item.code !== 0).length, 1);
  assert.match(
    settled.find((item) => item.code !== 0)!.stderr,
    /live_training_authorization_replay_refused/u,
  );
  const primaryMarker = path.join(
    store.live_training_root,
    "authorization-consumptions",
    authorization.authorization_nonce_fingerprint.slice("sha256:".length),
    "consumption.json",
  );
  const witnessMarker = path.join(
    store.run_root,
    "authorization-consumption",
    "witness.json",
  );
  const successfulConsumption = JSON.parse(
    readFileSync(primaryMarker, "utf8"),
  ) as ReturnType<typeof consumeCommissionedLiveTrainingAuthorizationV01>["consumption"];
  unlinkSync(witnessMarker);
  assert.throws(
    () => consume("after-witness-deletion"),
    /live_training_authorization_replay_refused/u,
  );
  writeFileSync(
    witnessMarker,
    canonicalizeProtocolValueV01(successfulConsumption),
    { encoding: "utf8", mode: 0o600, flag: "wx" },
  );
  unlinkSync(primaryMarker);
  assert.throws(
    () => consume("after-primary-deletion"),
    /live_training_authorization_replay_refused/u,
  );

  const witnessFailureRepository = path.join(
    input.root,
    "consumption-witness-failure-repository",
  );
  mkdirSync(witnessFailureRepository, { recursive: true, mode: 0o700 });
  writeFileSync(
    path.join(witnessFailureRepository, ".gitignore"),
    ".augnes-lab/\n",
    "utf8",
  );
  const witnessFailureNonce = "cw1l1_witness_failure_nonce_0000000001";
  const witnessFailureAuthorization = buildCommissionedLiveTrainingAuthorizationV01({
    authorization_id: "cw1-l1-witness-failure-consumption",
    authorization_kind: "test_conformance",
    issued_at: "2026-08-28T06:01:00.000Z",
    expires_at: "2026-08-29T06:01:00.000Z",
    current_main_sha: FOUNDATION_SHA,
    current_main_tree: FOUNDATION_TREE,
    checkout_root_fingerprint: CHECKOUT_ROOT_FINGERPRINT,
    plan: input.plan,
    native_execution_configuration: input.nativeConfiguration,
    codex_environment_binding: TEST_CODEX_ENVIRONMENT_BINDING,
    authorization_nonce: witnessFailureNonce,
    artifact_relative_root: `${COMMISSIONED_LIVE_TRAINING_ARTIFACT_NAMESPACE_V01}/${COHORT_ID}`,
    replacement_invocation_limit: 3,
    native_host_invocation_limit: 18,
    provider_bearing_native_host_invocation_limit: 0,
    model_bearing_native_host_invocation_limit: 0,
    provider_call_ceiling: {
      observability: "observed",
      limit: 0,
      source_ref: TEST_RESOURCE_SOURCE_REF,
    },
    model_call_ceiling: {
      observability: "observed",
      limit: 0,
      source_ref: TEST_RESOURCE_SOURCE_REF,
    },
    usage_unit_ceiling: { observability: "unknown", limit: null, source_ref: null },
    cost_microunit_ceiling: { observability: "unknown", limit: null, source_ref: null },
    per_episode_timeout_ms: 10_000,
    total_cohort_timeout_ms: 180_000,
  });
  const witnessFailureStore = initializeCommissionedLiveTrainingArtifactStoreV01({
    repository_root: witnessFailureRepository,
    plan: input.plan,
    authorization: witnessFailureAuthorization,
    family: input.manifest,
  });
  const consumeAfterWitnessFailure = () =>
    consumeCommissionedLiveTrainingAuthorizationV01({
      store: witnessFailureStore,
      authorization: witnessFailureAuthorization,
      plan: input.plan,
      native_execution_configuration: input.nativeConfiguration,
      current_main_sha: FOUNDATION_SHA,
      current_main_tree: FOUNDATION_TREE,
      checkout_root_fingerprint: CHECKOUT_ROOT_FINGERPRINT,
      evaluated_at: "2026-08-28T06:03:00.000Z",
      authorization_nonce: witnessFailureNonce,
      consumer_instance_ref: testRecordRefV01("witness-failure-consumer"),
      allow_test_conformance: true,
    });
  const priorCanonicalTestMode = process.env.AUGNES_CANONICAL_TEST_MODE;
  process.env.AUGNES_CANONICAL_TEST_MODE = "1";
  try {
    assert.throws(
      () => consumeCommissionedLiveTrainingAuthorizationV01({
        store: witnessFailureStore,
        authorization: witnessFailureAuthorization,
        plan: input.plan,
        native_execution_configuration: input.nativeConfiguration,
        current_main_sha: FOUNDATION_SHA,
        current_main_tree: FOUNDATION_TREE,
        checkout_root_fingerprint: CHECKOUT_ROOT_FINGERPRINT,
        evaluated_at: "2026-08-28T06:03:00.000Z",
        authorization_nonce: witnessFailureNonce,
        consumer_instance_ref: testRecordRefV01("witness-failure-consumer"),
        allow_test_conformance: true,
        test_fail_after_primary_before_witness: true,
      }),
      /live_training_test_consumption_witness_write_failed/u,
    );
  } finally {
    if (priorCanonicalTestMode === undefined) {
      delete process.env.AUGNES_CANONICAL_TEST_MODE;
    } else {
      process.env.AUGNES_CANONICAL_TEST_MODE = priorCanonicalTestMode;
    }
  }
  const tombstoneRoot = path.join(
    witnessFailureStore.live_training_root,
    "authorization-consumptions",
    witnessFailureAuthorization.authorization_nonce_fingerprint.slice("sha256:".length),
  );
  assert.equal(existsSync(tombstoneRoot), true);
  assert.equal(existsSync(path.join(tombstoneRoot, "consumption.json")), true);
  assert.equal(
    existsSync(path.join(witnessFailureStore.run_root, "authorization-consumption", "witness.json")),
    false,
  );
  assert.throws(consumeAfterWitnessFailure, /live_training_authorization_replay_refused/u);
}

function spawnConsumptionWorkerV01(
  workerPath: string,
  inputPath: string,
): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["--import", "tsx", workerPath, inputPath], {
      cwd: process.cwd(),
      env: { ...process.env, AUGNES_CANONICAL_TEST_MODE: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => { stdout += chunk; });
    child.stderr.on("data", (chunk: string) => { stderr += chunk; });
    child.once("error", reject);
    child.once("close", (code) => resolve({ code: code ?? 1, stdout, stderr }));
  });
}

function buildTestNativeConfigurationV01() {
  return buildCommissionedLiveTrainingExactNativeExecutionConfigurationV01({
    provider_id: "fake-provider-exact",
    model_id: "fake-model-exact",
    route_id: "fake-route-exact",
    reasoning_effort: "medium",
    expected_cli_version: "codex-cli/fake-0.143.0",
    adapter_ref: commissionedLiveTrainingDefaultAdapterRefV01(),
    capability_ref: commissionedLiveTrainingDefaultCapabilityRefV01(),
    host_ref: testRecordRefV01("fake-codex-app-server-host"),
    cli_ref: testRecordRefV01("fake-cli-0.143.0"),
    runtime_ref: testRecordRefV01("node-24-test-runtime"),
    provider_ref: testRecordRefV01("fake-provider-ref"),
    model_ref: testRecordRefV01("fake-model-ref"),
    route_ref: testRecordRefV01("fake-route-ref"),
    cli_executable_identity:
      observeCommissionedLiveTrainingExecutableIdentityV01({
        executable_path: path.join(
          process.cwd(),
          "scripts",
          "fixtures",
          "fake-codex-app-server.mjs",
        ),
        executable_kind: "test_fake_app_server",
      }),
    runtime_executable_identity:
      observeCommissionedLiveTrainingExecutableIdentityV01({
        executable_path: process.execPath,
        executable_kind: "node_runtime",
      }),
  });
}

function createTestIsolatedAuthenticatedExecutionOwnerV01(input: {
  attempt_id: string;
  repository_root: string;
  state_parent: string;
  test_environment: Record<string, string | undefined>;
}) {
  void input.attempt_id;
  return TEST_ISOLATED_AUTH_HARNESS.create_owner({
    repository_root: input.repository_root,
    state_parent: input.state_parent,
    test_environment: input.test_environment,
  });
}

function trainingFixtureOutputsV01(
  trainingCases: ReturnType<
    typeof createCommissionedControlledWorkTrainingOnlyFamilyV01
  >["training_cases"],
  plan: CommissionedLiveTrainingCohortPlanV01,
): CommissionedLiveTrainingTestFixtureOutputV01[] {
  const predecessorWrites = new Map([
    [
      "case-amber-17",
      {
        repository_relative_path: "src/route-token.mjs",
        content: 'export function routeToken(key, id) { return `${key}:${id}`; }\n',
      },
    ],
    [
      "case-cobalt-29",
      {
        repository_relative_path: "lib/quota-window.mjs",
        content: "export function accepts(value) { return value < 10; }\n",
      },
    ],
    [
      "case-cedar-41",
      {
        repository_relative_path: "engine/resolve-mode.mjs",
        content: 'export function resolveMode(name) { if (name === "hot") return "fast"; throw new Error("unknown"); }\n',
      },
    ],
  ]);
  return plan.slots.map((slot) => {
    const source = trainingCases.find((item) => item.case_id === slot.case_id)!;
    return {
      executor_role_id: slot.executor_role_ref.role_id,
      ...(slot.case_id === "case-amber-17" &&
      slot.condition === "exact_current_continuity"
        ? { pre_action_infrastructure_failure_on_primary: true as const }
        : {}),
      writes: [
        structuredClone(
          slot.slot_role === "predecessor"
            ? predecessorWrites.get(source.case_id)!
            : source.expected_success_writes[0]!,
        ),
      ],
    };
  });
}

function testRecordRefV01(id: string): CommissionedWorkRecordRefV01 {
  return createCommissionedWorkRecordRefV01({
    record_version: "commissioned_live_training_test_ref.v0.1",
    record_id: id,
    record_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01({ id }),
    ),
  });
}

function resealV01(
  value: { integrity: ReturnType<typeof createCommissionedWorkIntegrityV01> },
  scope: string,
): void {
  const record = value as typeof value & Record<string, unknown>;
  const { integrity: _prior, ...withoutIntegrity } = record;
  value.integrity = createCommissionedWorkIntegrityV01(withoutIntegrity, scope);
}

function containsFunctionMemberV01(
  value: unknown,
  stack = new Set<object>(),
): boolean {
  if (typeof value === "function") return true;
  if (value === null || typeof value !== "object") return false;
  if (stack.has(value)) return true;
  stack.add(value);
  const containsFunction = Object.values(value).some((candidate) =>
    containsFunctionMemberV01(candidate, stack),
  );
  stack.delete(value);
  return containsFunction;
}

function readFilesRecursivelyV01(root: string): string {
  const values: string[] = [];
  const visit = (directory: string): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(target);
      else if (entry.isFile()) values.push(readFileSync(target, "utf8"));
    }
  };
  visit(root);
  return values.join("\n");
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
