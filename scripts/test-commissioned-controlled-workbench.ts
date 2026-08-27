import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  admitCommissionedWorkExecutorResultV01,
  assertCommissionedWorkFamilySourceBindingV01,
  assertSafeCommissionedWorkOutputV01,
  assertValidCommissionedWorkEpisodeArtifactV01,
  assertValidCommissionedWorkFinalReportV01,
  buildCommissionedWorkConsolidationCandidateV01,
  buildCommissionedWorkCommissionedAgentExecutionObservationV01,
  buildCommissionedWorkEpisodeArtifactV01,
  buildCommissionedWorkEpisodeCheckpointV01,
  buildCommissionedWorkFamilyManifestV01,
  buildCommissionedWorkFinalReportV01,
  buildCommissionedWorkHoldoutEvaluationV01,
  buildCommissionedWorkNativeHostRequestV01,
  buildCommissionedWorkObjectiveObservationV01,
  buildCommissionedWorkRunReceiptV01,
  buildCommissionedWorkSyntheticExecutionObservationV01,
  buildCommissionedWorkTaskContextPacketV01,
  buildCommissionedWorkTrainingResultV01,
  createCommissionedWorkIntegrityV01,
  createCommissionedWorkAuthorizationResourceCeilingV01,
  createCommissionedWorkPacketMaterialSetFingerprintV01,
  createCommissionedWorkRecordRefV01,
  createCommissionedWorkRoleRefV01,
  invokeCommissionedWorkAdapterV01,
  type BuildCommissionedWorkEpisodeArtifactInputV01,
  type BuildCommissionedWorkCommissionedAgentExecutionObservationInputV01,
  type BuildCommissionedWorkObjectiveObservationInputV01,
} from "@/lib/vnext/commissioned-controlled-workbench";
import {
  validateCommissionedWorkArtifactsV01,
  writeCommissionedWorkArtifactsV01,
} from "@/lib/vnext/commissioned-controlled-workbench-artifact-store";
import {
  createCodexAppServerAdapterV01,
  type CodexAppServerAdapterObservationV01,
} from "@/lib/vnext/native-host/codex-app-server-adapter";
import {
  createCommissionedWorkbenchFixtureAdapterV01,
  createCommissionedWorkbenchFixtureAdmissionV01,
  createCommissionedWorkbenchSyntheticFixtureBindingV01,
  type CommissionedWorkbenchFixtureAdmissionV01,
  type CommissionedWorkbenchSyntheticFixtureBindingV01,
} from "@/lib/vnext/native-host/commissioned-workbench-fixture-adapter";
import {
  canonicalizeProtocolValueV01,
  compareProtocolCodeUnitsV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import {
  createCommissionedControlledWorkFamilySourceV01,
  createCommissionedControlledWorkSyntheticFixtureOutputsV01,
} from "@/fixtures/vnext/research/commissioned-controlled-workbench-v0-1";
import {
  COMMISSIONED_WORK_CANDIDATE_COMPONENT_IDS_V01,
  COMMISSIONED_WORK_COMMISSIONED_AGENT_CONFORMANCE_EVIDENCE_CLASS_V01,
  COMMISSIONED_WORK_COMMISSIONED_AGENT_OBSERVATION_EVIDENCE_CLASS_V01,
  type CommissionedWorkArtifactIndexV01,
  type CommissionedWorkCaseCommitmentV01,
  type CommissionedWorkCaseSourceV01,
  type CommissionedWorkConditionV01,
  type CommissionedWorkConsolidationCandidateV01,
  type CommissionedWorkEpisodeArtifactV01,
  type CommissionedWorkEpisodeCheckpointV01,
  type CommissionedWorkExecutionObservationV01,
  type CommissionedWorkEpisodePlanSourceV01,
  type CommissionedWorkFinalReportV01,
  type CommissionedWorkHoldoutVariantV01,
  type CommissionedWorkObjectiveObservationV01,
  type CommissionedWorkRecordRefV01,
  type CommissionedWorkRuntimeBindingV01,
  type CommissionedWorkSuccessorPlanSourceV01,
  type CommissionedWorkSyntheticFixtureOutputV01,
} from "@/types/vnext/commissioned-controlled-workbench";
import type {
  NativeHostLifecycleEventV01,
  NativeHostRequestV01,
  NativeHostResultV01,
} from "@/types/vnext/native-host-adapter";
import type { RunReceiptV01 } from "@/types/vnext/run-receipt";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";
import { installZeroNetworkGuard } from "./test-harness-zero-network-guard.mjs";

let hermeticProcessEnvironmentV01: NodeJS.ProcessEnv | null = null;
let ownedSynchronousProcessesV01 = 0;
let ownedNativeHostProcessesV01 = 0;

type EpisodeBundle = {
  source: CommissionedWorkCaseSourceV01;
  plan: CommissionedWorkEpisodePlanSourceV01 | CommissionedWorkSuccessorPlanSourceV01;
  synthetic_fixture_output: CommissionedWorkSyntheticFixtureOutputV01;
  packet: TaskContextPacketV01;
  request: NativeHostRequestV01;
  fixture_admission: CommissionedWorkbenchFixtureAdmissionV01;
  result: NativeHostResultV01;
  execution_observation: CommissionedWorkExecutionObservationV01;
  receipt: RunReceiptV01;
  observation: CommissionedWorkObjectiveObservationV01;
  episode_id: string;
  episode_role: "predecessor" | "successor";
  condition: CommissionedWorkConditionV01 | null;
  holdout_variant: CommissionedWorkHoldoutVariantV01 | null;
  repository_state: CommissionedWorkEpisodeArtifactV01["repository_state"];
  started_at: string;
  first_material_action_at: string;
  finished_at: string;
  action_trace_fingerprint: string;
};

type CaseRun = {
  predecessor: CommissionedWorkEpisodeArtifactV01;
  successors: CommissionedWorkEpisodeArtifactV01[];
  predecessor_bundle: EpisodeBundle;
  successor_bundles: EpisodeBundle[];
  predecessor_root: string;
};

type ProductionEpisodeProbeV01 = {
  packet: TaskContextPacketV01;
  request: NativeHostRequestV01;
  result: NativeHostResultV01;
  execution_observation: CommissionedWorkExecutionObservationV01;
  objective_observation: CommissionedWorkObjectiveObservationV01;
  receipt: RunReceiptV01;
  episode: CommissionedWorkEpisodeArtifactV01;
};

async function main(): Promise<void> {
  const network = installZeroNetworkGuard({
    allowLoopback: false,
    errorPrefix: "commissioned_workbench_external_network_forbidden",
  });
  const disposableRoot = mkdtempSync(
    path.join(tmpdir(), "augnes-cw1-commissioned-workbench-"),
  );
  let resultSummary: Record<string, unknown> | null = null;
  try {
    resultSummary = await runGoldenFamilyV01(disposableRoot);
  } finally {
    network.restore();
    rmSync(disposableRoot, { recursive: true, force: true });
    hermeticProcessEnvironmentV01 = null;
  }
  assert.equal(network.attempts.length, 0, "CW1 attempted a network call");
  assert.equal(
    existsSync(disposableRoot),
    false,
    "CW1 disposable root survived cleanup",
  );
  assert.ok(resultSummary);
  assert.equal(ownedSynchronousProcessesV01, 0);
  assert.equal(ownedNativeHostProcessesV01, 0);
  console.log(
    JSON.stringify({
      ...resultSummary,
      real_provider_calls: 0,
      model_calls: 0,
      external_network_calls: 0,
      owned_processes_remaining:
        ownedSynchronousProcessesV01 + ownedNativeHostProcessesV01,
      cleanup_complete: true,
    }),
  );
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

async function runGoldenFamilyV01(root: string): Promise<Record<string, unknown>> {
  const roots = createDisposableRootsV01(root);
  assertHermeticGitEnvironmentV01(roots);
  const familySource = createCommissionedControlledWorkFamilySourceV01();
  const manifestBuiltWithoutSyntheticOutputs =
    buildCommissionedWorkFamilyManifestV01(familySource);
  const familyCommitmentFingerprintBuiltWithoutSyntheticOutputs =
    manifestBuiltWithoutSyntheticOutputs.integrity.fingerprint;
  const syntheticFixtureOutputs =
    createCommissionedControlledWorkSyntheticFixtureOutputsV01();
  assert.equal(syntheticFixtureOutputs.length, 20);
  assert.equal(
    syntheticFixtureOutputs.every(
      (output) =>
        output.execution_evidence_class === "synthetic_deterministic" &&
        output.commissioned_behavioral_evidence === false &&
        output.part_of_task_context_packet === false &&
        output.part_of_candidate_derivation_evidence === false &&
        output.required_by_live_executor_path === false,
    ),
    true,
  );
  for (const source of [
    ...familySource.training_cases,
    familySource.holdout_case,
  ]) {
    for (const plan of [source.predecessor_plan, ...source.successor_plans]) {
      assert.equal("writes" in plan, false);
      assert.equal("claimed_complete" in plan, false);
      assert.equal("referenced_material_ids" in plan, false);
    }
  }
  const manifest = buildCommissionedWorkFamilyManifestV01(familySource);
  assert.deepEqual(manifest, manifestBuiltWithoutSyntheticOutputs);
  assert.equal(
    manifest.integrity.fingerprint,
    familyCommitmentFingerprintBuiltWithoutSyntheticOutputs,
  );
  assert.deepEqual(
    buildCommissionedWorkFamilyManifestV01(familySource),
    manifest,
  );
  assert.deepEqual(
    [...syntheticFixtureOutputs].reverse().map((output) => output.output_id).sort(),
    syntheticFixtureOutputs.map((output) => output.output_id).sort(),
  );
  const manifestTextBuiltBeforeSyntheticOutputs =
    canonicalizeProtocolValueV01(manifestBuiltWithoutSyntheticOutputs);
  for (const output of [...syntheticFixtureOutputs].reverse()) {
    assert.equal(
      manifestTextBuiltBeforeSyntheticOutputs.includes(output.output_id),
      false,
    );
  }
  const trainingRuns: CaseRun[] = [];
  for (const [index, source] of familySource.training_cases.entries()) {
    trainingRuns.push(
      await runCaseV01({
        roots,
        manifest,
        source,
        synthetic_fixture_outputs: syntheticFixtureOutputs,
        case_index: index,
        consolidation_candidate: null,
      }),
    );
  }
  const training = buildCommissionedWorkTrainingResultV01({
    manifest,
    predecessor_episodes: trainingRuns.map((run) => run.predecessor),
    successor_episodes: trainingRuns.flatMap((run) => run.successors),
  });
  const candidate = buildCommissionedWorkConsolidationCandidateV01({
    manifest,
    training,
    candidate_id: "cw1-candidate-training-three-01",
    frozen_at: "2026-08-27T03:00:00.000Z",
  });
  const candidateReplay = buildCommissionedWorkConsolidationCandidateV01({
    manifest,
    training,
    candidate_id: candidate.candidate_id,
    frozen_at: candidate.frozen_at,
  });
  assert.deepEqual(candidateReplay, candidate);
  assert.equal(
    candidate.strongest_simpler_baseline.selected_before_holdout_outcomes,
    true,
  );
  assert.equal(candidate.strongest_simpler_baseline.outcome_data_used, false);
  assert.equal(
    candidate.strongest_simpler_baseline.strongest_claim_status,
    "unresolved",
  );
  const holdoutRootBeforeFreeze = path.join(
    roots.runtime,
    familySource.holdout_case.case_id,
  );
  assert.equal(
    existsSync(holdoutRootBeforeFreeze),
    false,
    "holdout content materialized before candidate freeze",
  );
  const holdoutRun = await runCaseV01({
    roots,
    manifest,
    source: familySource.holdout_case,
    synthetic_fixture_outputs: syntheticFixtureOutputs,
    case_index: 3,
    consolidation_candidate: candidate,
  });
  const holdout = buildCommissionedWorkHoldoutEvaluationV01({
    manifest,
    candidate,
    holdout_id: "cw1-holdout-quartz-01",
    holdout_materialized_at: "2026-08-27T04:00:00.000Z",
    holdout_started_at: "2026-08-27T04:05:00.000Z",
    predecessor_episode: holdoutRun.predecessor,
    arms: holdoutRun.successors as [
      CommissionedWorkEpisodeArtifactV01,
      CommissionedWorkEpisodeArtifactV01,
      CommissionedWorkEpisodeArtifactV01,
      CommissionedWorkEpisodeArtifactV01,
    ],
  });
  assert.equal(
    holdout.candidate_specific_transfer_conclusion.status,
    "not_established",
  );
  assert.equal(
    holdout.candidate_specific_transfer_conclusion
      .designated_baseline_relation,
    "improved",
  );
  assert.equal(
    holdout.candidate_specific_transfer_conclusion
      .comparable_no_candidate_equal,
    true,
  );
  assert.equal(
    holdout.candidate_specific_transfer_conclusion
      .strongest_no_candidate_selection,
    "unresolved",
  );
  assert.equal(
    holdout.arms.find((episode) => episode.holdout_variant === "candidate_present")
      ?.evaluation.deterministic_repository_task_success,
    true,
  );
  assert.equal(
    holdout.arms.find(
      (episode) => episode.holdout_variant === "strongest_equal_budget_baseline",
    )?.evaluation.deterministic_repository_task_success,
    false,
  );
  const holdoutBaseline = holdout.arms.find(
    (episode) => episode.holdout_variant === "strongest_equal_budget_baseline",
  )!;
  const holdoutCandidate = holdout.arms.find(
    (episode) => episode.holdout_variant === "candidate_present",
  )!;
  const holdoutAblation = holdout.arms.find(
    (episode) => episode.holdout_variant === "candidate_component_ablation",
  )!;
  const holdoutStaleReset = holdout.arms.find(
    (episode) => episode.holdout_variant === "stale_or_reset",
  )!;
  assert.notEqual(holdoutCandidate.condition, holdoutStaleReset.condition);
  assert.notEqual(
    holdoutCandidate.task_context_packet_ref.record_fingerprint,
    holdoutStaleReset.task_context_packet_ref.record_fingerprint,
  );
  assert.equal(
    holdoutCandidate.repository_action_trace_fingerprint,
    holdoutStaleReset.repository_action_trace_fingerprint,
  );
  assert.equal(
    holdoutCandidate.evidence_ladder.find(
      (row) => row.stage === "behaviorally_conditioned",
    )?.status,
    "unknown",
  );
  assert.equal(
    holdoutBaseline.execution_binding.continuation_materials_delivered,
    holdoutCandidate.execution_binding.continuation_materials_delivered,
  );
  assert.equal(
    holdoutBaseline.execution_binding.continuation_materials_delivered,
    holdoutAblation.execution_binding.continuation_materials_delivered,
  );
  assert.equal(holdoutBaseline.execution_binding.candidate_components_delivered, 0);
  assert.equal(holdoutCandidate.execution_binding.candidate_components_delivered, 3);
  assert.equal(holdoutAblation.execution_binding.candidate_components_delivered, 2);
  const report = buildCommissionedWorkFinalReportV01({
    report_id: "cw1-report-four-case-01",
    family: manifest,
    training,
    consolidation_candidate: candidate,
    holdout,
    limitations: [
      "deterministic_fixture_adapters_only",
      "synthetic_execution_not_commissioned_behavioral_evidence",
      "candidate_not_evidence_supported_procedural_knowledge",
      "candidate_not_independently_learned",
      "candidate_transfer_not_validated",
      "candidate_specific_held_out_transfer_not_established",
      "strongest_no_candidate_baseline_unresolved",
      "single_local_platform",
      "no_live_cohort",
      "no_policy_fitness_claim",
      "no_stage_7_claim",
      "no_rw1_conclusion",
      "no_user_or_product_usefulness_claim",
    ],
  });
  const replay = buildCommissionedWorkFinalReportV01({
    report_id: report.report_id,
    family: manifest,
    training,
    consolidation_candidate: candidate,
    holdout,
    limitations: [...report.limitations].reverse(),
  });
  assert.deepEqual(replay, report);
  assertValidCommissionedWorkFinalReportV01(report);
  const reportText = canonicalizeProtocolValueV01(report);
  for (const syntheticOutput of syntheticFixtureOutputs) {
    for (const write of syntheticOutput.writes) {
      assert.equal(reportText.includes(write.content), false);
    }
  }
  assert.equal(report.counts.total_episode_artifacts, 20);
  assert.equal(report.counts.independent_training_origins, 3);
  assert.equal(report.authority_summary.creates_live_cohort, false);
  assert.equal(report.authority_summary.creates_live_authorization, false);
  assert.equal(report.authority_summary.mutates_rw1_or_rw1a_material, false);
  assert.equal(report.authority_summary.claims_rw1_conclusion, false);
  assert.equal(report.consolidation_candidate.policy_created, false);
  assert.equal(report.family_evidence_ladder.at(-1)?.status, "not_established");
  assert.equal(
    report.consolidation_candidate.evidence_supported_procedural_knowledge,
    false,
  );
  assert.equal(report.consolidation_candidate.independently_learned, false);
  assert.equal(report.consolidation_candidate.validated_for_transfer, false);
  assertTrainingContrastsV01(report);
  await runNegativeContractCasesV01({
    roots,
    familySource,
    syntheticFixtureOutputs,
    manifest,
    report,
    candidate,
    training,
    holdout,
    receipt_probe_bundle: trainingRuns[0]!.successor_bundles[0]!,
  });
  const writeSummary = writeCommissionedWorkArtifactsV01({
    repository_root: roots.artifact_repository,
    run_label: "golden-four-case-01",
    report,
  });
  const index = validateCommissionedWorkArtifactsV01({
    repository_root: roots.artifact_repository,
    relative_run_root: writeSummary.relative_run_root,
  });
  assert.equal(index.expected_artifact_count, 25);
  assert.equal(index.artifacts.filter((item) => item.slot_kind === "episode").length, 20);
  const boundaryArtifactRepository = path.join(
    roots.artifacts,
    "boundary-artifact-repository",
  );
  cpSync(roots.artifact_repository, boundaryArtifactRepository, {
    recursive: true,
    force: false,
    errorOnExist: true,
  });
  const boundaryIndexPath = path.join(
    boundaryArtifactRepository,
    writeSummary.relative_run_root,
    "artifact-index.json",
  );
  const boundaryIndex = JSON.parse(
    readFileSync(boundaryIndexPath, "utf8"),
  ) as CommissionedWorkArtifactIndexV01;
  boundaryIndex.raw_prompt_persisted = true as false;
  boundaryIndex.writes_outside_cw1_root = true as false;
  boundaryIndex.product_database_writes = 1 as 0;
  resealV01(
    boundaryIndex,
    "commissioned_work_artifact_index_without_integrity_fingerprint",
  );
  writeFileSync(
    boundaryIndexPath,
    canonicalizeProtocolValueV01(boundaryIndex),
    "utf8",
  );
  assert.throws(
    () =>
      validateCommissionedWorkArtifactsV01({
        repository_root: boundaryArtifactRepository,
        relative_run_root: writeSummary.relative_run_root,
      }),
    /commissioned_work_artifact_index_boundary_invalid/u,
  );
  assert.throws(
    () =>
      writeCommissionedWorkArtifactsV01({
        repository_root: roots.artifact_repository,
        run_label: "golden-four-case-01",
        report,
      }),
    /commissioned_work_artifact_run_root_not_clean/u,
  );
  const corruptedArtifactRepository = path.join(
    roots.artifacts,
    "corrupted-artifact-repository",
  );
  cpSync(roots.artifact_repository, corruptedArtifactRepository, {
    recursive: true,
    force: false,
    errorOnExist: true,
  });
  const missingTarget = path.join(
    corruptedArtifactRepository,
    writeSummary.relative_run_root,
    index.artifacts.find((item) => item.slot_kind === "episode")!.relative_path,
  );
  unlinkSync(missingTarget);
  assert.throws(
    () =>
      validateCommissionedWorkArtifactsV01({
        repository_root: corruptedArtifactRepository,
        relative_run_root: writeSummary.relative_run_root,
      }),
    /commissioned_work_artifact_file_set_invalid/u,
  );
  const substitutedArtifactRepository = path.join(
    roots.artifacts,
    "substituted-artifact-repository",
  );
  cpSync(roots.artifact_repository, substitutedArtifactRepository, {
    recursive: true,
    force: false,
    errorOnExist: true,
  });
  const substitutedRunRoot = path.join(
    substitutedArtifactRepository,
    writeSummary.relative_run_root,
  );
  const substitutedIndexPath = path.join(
    substitutedRunRoot,
    "artifact-index.json",
  );
  const substitutedIndex = JSON.parse(
    readFileSync(substitutedIndexPath, "utf8"),
  ) as CommissionedWorkArtifactIndexV01;
  const episodeEntries = substitutedIndex.artifacts.filter(
    (artifact) => artifact.slot_kind === "episode",
  );
  const substitutionTarget = episodeEntries[0]!;
  const substitutionSource = episodeEntries[1]!;
  const substitutionText = readFileSync(
    path.join(substitutedRunRoot, substitutionSource.relative_path),
    "utf8",
  ).trimEnd();
  writeFileSync(
    path.join(substitutedRunRoot, substitutionTarget.relative_path),
    substitutionText,
    "utf8",
  );
  Object.assign(substitutionTarget, {
    record_ref: substitutionSource.record_ref,
    artifact_version: substitutionSource.artifact_version,
    case_id: substitutionSource.case_id,
    episode_id: substitutionSource.episode_id,
    condition: substitutionSource.condition,
    holdout_variant: substitutionSource.holdout_variant,
    content_fingerprint: createProtocolSha256V01(substitutionText),
  });
  resealV01(
    substitutedIndex,
    "commissioned_work_artifact_index_without_integrity_fingerprint",
  );
  writeFileSync(
    substitutedIndexPath,
    canonicalizeProtocolValueV01(substitutedIndex),
    "utf8",
  );
  assert.throws(
    () =>
      validateCommissionedWorkArtifactsV01({
        repository_root: substitutedArtifactRepository,
        relative_run_root: writeSummary.relative_run_root,
      }),
    /commissioned_work_artifact_frozen_slot_binding_invalid/u,
  );
  const misplacedRunRoot = path.join(
    roots.artifact_repository,
    "misplaced-cw1-run",
  );
  cpSync(
    path.join(roots.artifact_repository, writeSummary.relative_run_root),
    misplacedRunRoot,
    { recursive: true, force: false, errorOnExist: true },
  );
  assert.throws(
    () =>
      validateCommissionedWorkArtifactsV01({
        repository_root: roots.artifact_repository,
        relative_run_root: "misplaced-cw1-run",
      }),
    /commissioned_work_artifact_namespace_binding_invalid/u,
  );
  return {
    status: "passed",
    family_id: manifest.family_id,
    case_ids: [
      ...manifest.training_cases.map((item) => item.case_id),
      manifest.holdout_case.case_id,
    ],
    training_case_count: 3,
    holdout_case_count: 1,
    predecessor_episode_count: 4,
    successor_episode_count: 16,
    experiment_class: report.experiment_class,
    execution_evidence_class: report.execution_evidence_class,
    host_neutral_family_commitment:
      manifest.host_neutral_execution_commitment,
    operation_contract_built_before_synthetic_outputs: true,
    live_capable_result_admission_without_solution_plan: true,
    production_shaped_codex_result_preserved: true,
    commissioned_agent_full_episode_artifact_path: true,
    completed_predecessor_checkpoint_cold_successor: true,
    commissioned_agent_provider_accounting: "unknown",
    commissioned_agent_model_accounting: "unknown",
    commissioned_agent_network_accounting: "observed_zero",
    candidate_fingerprint: candidate.integrity.fingerprint,
    candidate_specific_transfer_result:
      holdout.candidate_specific_transfer_conclusion.status,
    candidate_present_vs_designated_baseline:
      holdout.candidate_specific_transfer_conclusion
        .designated_baseline_relation,
    comparable_no_candidate_equal:
      holdout.candidate_specific_transfer_conclusion
        .comparable_no_candidate_equal,
    strongest_no_candidate_selection:
      holdout.candidate_specific_transfer_conclusion
        .strongest_no_candidate_selection,
    report_fingerprint: report.integrity.fingerprint,
    artifact_index_fingerprint: index.integrity.fingerprint,
    artifact_relative_root: writeSummary.relative_run_root,
    raw_prompts_or_transcripts_persisted: false,
    product_database_writes: 0,
    core_writes: 0,
    proposal_writes: 0,
    review_decision_writes: 0,
    transition_writes: 0,
    policy_activations: 0,
    blocked_child_network_probe_attempts: 1,
  };
}

function assertHermeticGitEnvironmentV01(
  roots: ReturnType<typeof createDisposableRootsV01>,
): void {
  const hooksRoot = path.join(roots.runtime, "host-global-hooks");
  const markerPath = path.join(roots.runtime, "host-global-hook-ran");
  mkdirSync(hooksRoot, { recursive: true, mode: 0o700 });
  writeFileSync(
    path.join(roots.home, ".gitconfig"),
    `[core]\n\thooksPath = ${hooksRoot}\n`,
    { encoding: "utf8", mode: 0o600 },
  );
  writeFileSync(
    path.join(hooksRoot, "pre-commit"),
    `#!/bin/sh\n/usr/bin/touch ${JSON.stringify(markerPath)}\nexit 1\n`,
    { encoding: "utf8", mode: 0o700 },
  );
  const probeRoot = path.join(roots.runtime, "hermetic-git-probe");
  mkdirSync(probeRoot, { recursive: true, mode: 0o700 });
  writeFileSync(path.join(probeRoot, "probe.txt"), "sealed\n", "utf8");
  gitV01(probeRoot, ["init", "--initial-branch=main"]);
  gitV01(probeRoot, ["add", "--all"]);
  gitV01(
    probeRoot,
    ["commit", "-m", "prove host global hooks are disabled"],
    "2026-08-27T00:00:30.000Z",
  );
  assert.equal(existsSync(markerPath), false);
}

function createDisposableRootsV01(root: string): {
  home: string;
  data: string;
  config: string;
  database: string;
  runtime: string;
  artifacts: string;
  artifact_repository: string;
  temp: string;
  oracle_guard_path: string;
  network_attempt_log: string;
} {
  const roots = {
    home: path.join(root, "home"),
    data: path.join(root, "data"),
    config: path.join(root, "config"),
    database: path.join(root, "database"),
    runtime: path.join(root, "runtime"),
    artifacts: path.join(root, "artifacts"),
    artifact_repository: path.join(root, "artifact-repository"),
    temp: path.join(root, "tmp"),
    oracle_guard_path: path.join(root, "runtime", "oracle-network-guard.mjs"),
    network_attempt_log: path.join(root, "runtime", "oracle-network-attempts.log"),
  };
  [
    roots.home,
    roots.data,
    roots.config,
    roots.database,
    roots.runtime,
    roots.artifacts,
    roots.artifact_repository,
    roots.temp,
  ].forEach((directory) =>
    mkdirSync(directory, { recursive: true, mode: 0o700 }),
  );
  writeFileSync(
    path.join(roots.artifact_repository, ".gitignore"),
    ".augnes-lab/\n",
    "utf8",
  );
  const guardModuleUrl = pathToFileURL(
    path.join(process.cwd(), "scripts", "test-harness-zero-network-guard.mjs"),
  ).href;
  writeFileSync(
    roots.oracle_guard_path,
    `import { appendFileSync } from "node:fs";\nimport { installZeroNetworkGuard } from ${JSON.stringify(guardModuleUrl)};\ninstallZeroNetworkGuard({ allowLoopback: false, errorPrefix: "commissioned_workbench_oracle_network_forbidden", onBlockedAttempt(attempt) { appendFileSync(process.env.AUGNES_CW1_NETWORK_ATTEMPT_LOG, JSON.stringify(attempt) + "\\n", "utf8"); } });\n`,
    { encoding: "utf8", mode: 0o600 },
  );
  hermeticProcessEnvironmentV01 = {
    PATH: "/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin",
    HOME: roots.home,
    XDG_CONFIG_HOME: roots.config,
    TMPDIR: roots.temp,
    GIT_AUTHOR_NAME: "Augnes CW1 Fixture",
    GIT_AUTHOR_EMAIL: "cw1-fixture@invalid.local",
    GIT_COMMITTER_NAME: "Augnes CW1 Fixture",
    GIT_COMMITTER_EMAIL: "cw1-fixture@invalid.local",
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_CONFIG_SYSTEM: "/dev/null",
    GIT_CONFIG_GLOBAL: "/dev/null",
    GIT_TERMINAL_PROMPT: "0",
    LC_ALL: "C",
    LANG: "C",
    NODE_ENV: "test",
    AUGNES_CW1_NETWORK_ATTEMPT_LOG: roots.network_attempt_log,
  };
  return roots;
}

async function runCaseV01(input: {
  roots: ReturnType<typeof createDisposableRootsV01>;
  manifest: ReturnType<typeof buildCommissionedWorkFamilyManifestV01>;
  source: CommissionedWorkCaseSourceV01;
  synthetic_fixture_outputs: CommissionedWorkSyntheticFixtureOutputV01[];
  case_index: number;
  consolidation_candidate: CommissionedWorkConsolidationCandidateV01 | null;
}): Promise<CaseRun> {
  const caseRoot = path.join(input.roots.runtime, input.source.case_id);
  const predecessorRoot = path.join(caseRoot, "predecessor");
  mkdirSync(predecessorRoot, { recursive: true, mode: 0o700 });
  for (const fixture of input.source.repository_fixture) {
    writeRepositoryFileV01(
      predecessorRoot,
      fixture.repository_relative_path,
      fixture.content,
    );
  }
  gitV01(predecessorRoot, ["init", "--initial-branch=main"]);
  gitV01(predecessorRoot, ["add", "--all"]);
  gitV01(
    predecessorRoot,
    ["commit", "-m", "initial source-distinct fixture"],
    timestampForV01(input.case_index, 0),
  );
  const initialCommit = gitV01(predecessorRoot, ["rev-parse", "HEAD"]);
  const initialTree = gitV01(predecessorRoot, ["rev-parse", "HEAD^{tree}"]);
  const predecessorBundle = await executeEpisodeV01({
    roots: input.roots,
    manifest: input.manifest,
    source: input.source,
    plan: input.source.predecessor_plan,
    synthetic_fixture_output: requireSyntheticFixtureOutputV01(
      input.synthetic_fixture_outputs,
      input.source.predecessor_plan.executor_role_id,
    ),
    repository_root: predecessorRoot,
    episode_id: `${input.source.case_id}-episode-1`,
    episode_role: "predecessor",
    condition: null,
    holdout_variant: null,
    initial_commit: initialCommit,
    initial_tree: initialTree,
    case_index: input.case_index,
    phase_index: 1,
    run_oracles: false,
    consolidation_candidate: input.consolidation_candidate,
  });
  const predecessor = buildEpisodeArtifactFromBundleV01({
    manifest: input.manifest,
    bundle: predecessorBundle,
    predecessor_ref: null,
    predecessor_checkpoint: null,
    candidate_fingerprint:
      input.consolidation_candidate?.integrity.fingerprint ?? null,
  });
  const predecessorRef = episodeRefV01(predecessor);
  const predecessorCheckpoint =
    buildCommissionedWorkEpisodeCheckpointV01(predecessor);
  const successorBundles: EpisodeBundle[] = [];
  for (const [armIndex, plan] of input.source.successor_plans.entries()) {
    const armKey = `slot-${String(armIndex + 1).padStart(2, "0")}`;
    const successorRoot = path.join(caseRoot, `successor-${armKey}`);
    cpSync(predecessorRoot, successorRoot, {
      recursive: true,
      force: false,
      errorOnExist: true,
      preserveTimestamps: true,
    });
    assert.equal(gitV01(successorRoot, ["status", "--short"]), "");
    for (const drift of input.source.source_drift_writes) {
      writeRepositoryFileV01(
        successorRoot,
        drift.repository_relative_path,
        drift.content,
      );
    }
    gitV01(successorRoot, ["add", "--all"]);
    gitV01(
      successorRoot,
      ["commit", "-m", "apply sealed current-source change"],
      timestampForV01(input.case_index, 2),
    );
    successorBundles.push(
      await executeEpisodeV01({
        roots: input.roots,
        manifest: input.manifest,
        source: input.source,
        plan,
        synthetic_fixture_output: requireSyntheticFixtureOutputV01(
          input.synthetic_fixture_outputs,
          plan.executor_role_id,
        ),
        repository_root: successorRoot,
        episode_id: `${input.source.case_id}-episode-2-${armKey}`,
        episode_role: "successor",
        condition: plan.condition,
        holdout_variant: plan.holdout_variant,
        initial_commit: initialCommit,
        initial_tree: initialTree,
        case_index: input.case_index,
        phase_index: 3 + armIndex,
        run_oracles: true,
        consolidation_candidate: input.consolidation_candidate,
      }),
    );
  }
  const syntheticOutputShapes = new Set(
    successorBundles.map((bundle) =>
      canonicalizeProtocolValueV01({
        checks: bundle.observation.required_checks.map((check) => check.disposition),
        negative_space: bundle.observation.negative_space.status,
        source_currentness: bundle.observation.source_currentness,
        action: bundle.action_trace_fingerprint,
      }),
    ),
  );
  assert.equal(syntheticOutputShapes.size > 1, true);
  const successors = successorBundles.map((bundle) =>
    buildEpisodeArtifactFromBundleV01({
      manifest: input.manifest,
      bundle,
      predecessor_ref: predecessorRef,
      predecessor_checkpoint: predecessorCheckpoint,
      candidate_fingerprint:
        input.consolidation_candidate?.integrity.fingerprint ?? null,
    }),
  );
  return {
    predecessor,
    successors,
    predecessor_bundle: predecessorBundle,
    successor_bundles: successorBundles,
    predecessor_root: predecessorRoot,
  };
}

async function executeEpisodeV01(input: {
  roots: ReturnType<typeof createDisposableRootsV01>;
  manifest: ReturnType<typeof buildCommissionedWorkFamilyManifestV01>;
  source: CommissionedWorkCaseSourceV01;
  plan: CommissionedWorkEpisodePlanSourceV01 | CommissionedWorkSuccessorPlanSourceV01;
  synthetic_fixture_output: CommissionedWorkSyntheticFixtureOutputV01;
  repository_root: string;
  episode_id: string;
  episode_role: "predecessor" | "successor";
  condition: CommissionedWorkConditionV01 | null;
  holdout_variant: CommissionedWorkHoldoutVariantV01 | null;
  initial_commit: string;
  initial_tree: string;
  case_index: number;
  phase_index: number;
  run_oracles: boolean;
  consolidation_candidate: CommissionedWorkConsolidationCandidateV01 | null;
}): Promise<EpisodeBundle> {
  const startedAt = timestampForV01(input.case_index, 10 + input.phase_index);
  const firstActionAt = addSecondsV01(startedAt, 1);
  const finishedAt = addSecondsV01(startedAt, 2);
  const episodeStartCommit = gitV01(input.repository_root, ["rev-parse", "HEAD"]);
  const episodeStartTree = gitV01(input.repository_root, ["rev-parse", "HEAD^{tree}"]);
  const packet = buildCommissionedWorkTaskContextPacketV01({
    manifest: input.manifest,
    source: input.source,
    plan: input.plan,
    consolidation_candidate: input.consolidation_candidate,
    expected_candidate_freeze_fingerprint:
      input.consolidation_candidate?.integrity.fingerprint ?? null,
    generated_at: startedAt,
  });
  const runtime: CommissionedWorkRuntimeBindingV01 = {
    report_included: false,
    case_id: input.source.case_id,
    condition: input.condition,
    holdout_variant: input.holdout_variant,
    workspace_id: input.manifest.workspace_id,
    project_id: input.source.project_id,
    repository_root: input.repository_root,
    database_path: path.join(input.roots.database, `${input.episode_id}.sqlite`),
    home_root: input.roots.home,
    data_root: input.roots.data,
    config_root: input.roots.config,
    runtime_root: input.roots.runtime,
    artifact_root: input.roots.artifacts,
  };
  const request = buildCommissionedWorkNativeHostRequestV01({
    manifest: input.manifest,
    source: input.source,
    plan: input.plan,
    consolidation_candidate: input.consolidation_candidate,
    expected_candidate_freeze_fingerprint:
      input.consolidation_candidate?.integrity.fingerprint ?? null,
    packet,
    runtime,
    episode_id: input.episode_id,
    requested_at: startedAt,
  });
  const executorVisibleRequest = canonicalizeProtocolValueV01(request);
  for (const expectedWrite of input.source.expected_success_writes) {
    assert.equal(
      executorVisibleRequest.includes(expectedWrite.content),
      false,
      "executor-visible request leaked evaluator-only expected output",
    );
  }
  for (const treatmentLabel of [
    "exact_current_continuity",
    "matched_ablation",
    "stale_or_regime_shift_continuity",
    "zero_continuation_control",
    "strongest_equal_budget_baseline",
    "candidate_present",
    "candidate_component_ablation",
    "stale_or_reset",
  ]) {
    assert.equal(
      executorVisibleRequest.includes(treatmentLabel),
      false,
      `executor-visible request leaked treatment label ${treatmentLabel}`,
    );
  }
  const executorRole = createCommissionedWorkRoleRefV01(
    "executor",
    input.plan.executor_role_id,
  );
  const fixtureAdmission = createCommissionedWorkbenchFixtureAdmissionV01({
    admission_id: `fixture-admission:${input.episode_id}`,
    episode_id: input.episode_id,
    packet_fingerprint: packet.integrity.fingerprint,
    executor_role_fingerprint: executorRole.role_fingerprint,
  });
  const commitment = findCommitmentV01(input.manifest, input.source.case_id);
  const syntheticFixtureBinding = buildSyntheticFixtureBindingV01({
    source: input.source,
    actual_plan: input.plan,
    synthetic_fixture_output: input.synthetic_fixture_output,
    packet,
    commitment,
  });
  const expectedCandidateComponentIds =
    input.holdout_variant === "candidate_present"
      ? [...COMMISSIONED_WORK_CANDIDATE_COMPONENT_IDS_V01]
      : input.holdout_variant === "candidate_component_ablation"
        ? COMMISSIONED_WORK_CANDIDATE_COMPONENT_IDS_V01.slice(0, -1)
        : [];
  assert.deepEqual(
    syntheticFixtureBinding.candidate_component_ids,
    expectedCandidateComponentIds,
  );
  if (input.case_index === 0 && input.phase_index === 1) {
    const mismatchedAdmission = createCommissionedWorkbenchFixtureAdmissionV01({
      admission_id: `fixture-admission:${input.episode_id}`,
      episode_id: input.episode_id,
      packet_fingerprint: packet.integrity.fingerprint,
      executor_role_fingerprint: createProtocolSha256V01(
        "mismatched-fixture-executor",
      ),
    });
    const mismatchedAdapter = createCommissionedWorkbenchFixtureAdapterV01({
      exact_repository_root: input.repository_root,
      synthetic_fixture_binding: syntheticFixtureBinding,
      fixture_admission: mismatchedAdmission,
      started_at: startedAt,
      first_material_action_at: firstActionAt,
      finished_at: finishedAt,
    });
    await assert.rejects(
      () =>
        invokeCommissionedWorkAdapterV01({
          adapter: mismatchedAdapter,
          source: input.source,
          plan: input.plan,
          request,
        }),
      /commissioned_workbench_adapter_request_refused/u,
    );
  }
  if (input.holdout_variant === "candidate_present") {
    const candidateMismatchedBinding = structuredClone(syntheticFixtureBinding);
    candidateMismatchedBinding.candidate_component_ids =
      candidateMismatchedBinding.candidate_component_ids.slice(0, -1);
    const {
      binding_fingerprint: _priorBindingFingerprint,
      ...candidateMismatchedBindingWithoutFingerprint
    } = candidateMismatchedBinding;
    candidateMismatchedBinding.binding_fingerprint = createProtocolSha256V01(
      canonicalizeProtocolValueV01(
        candidateMismatchedBindingWithoutFingerprint,
      ),
    );
    const candidateMismatchedAdapter =
      createCommissionedWorkbenchFixtureAdapterV01({
        exact_repository_root: input.repository_root,
        synthetic_fixture_binding: candidateMismatchedBinding,
        fixture_admission: fixtureAdmission,
        started_at: startedAt,
        first_material_action_at: firstActionAt,
        finished_at: finishedAt,
      });
    await assert.rejects(
      () =>
        invokeCommissionedWorkAdapterV01({
          adapter: candidateMismatchedAdapter,
          source: input.source,
          plan: input.plan,
          request,
        }),
      /commissioned_workbench_adapter_request_refused/u,
    );
  }
  const adapter = createCommissionedWorkbenchFixtureAdapterV01({
    exact_repository_root: input.repository_root,
    synthetic_fixture_binding: syntheticFixtureBinding,
    fixture_admission: fixtureAdmission,
    started_at: startedAt,
    first_material_action_at: firstActionAt,
    finished_at: finishedAt,
  });
  const result = await invokeCommissionedWorkAdapterV01({
    adapter,
    source: input.source,
    plan: input.plan,
    request,
  });
  assert.equal(result.model_invocation_receipt_refs.length, 0);
  assert.equal(result.host_refs.length, 1);
  assert.equal(
    result.adapter_extension.bounded_metadata
      .synthetic_fixture_binding_fingerprint,
    syntheticFixtureBinding.binding_fingerprint,
  );
  assert.deepEqual(
    admitCommissionedWorkExecutorResultV01({
      source: input.source,
      plan: input.plan,
      request,
      result,
    }),
    result,
  );
  gitV01(input.repository_root, ["add", "--all"]);
  gitV01(
    input.repository_root,
    [
      "commit",
      "-m",
      input.episode_role === "predecessor"
        ? "seal predecessor interruption"
        : "apply cold successor work",
    ],
    timestampForV01(input.case_index, 20 + input.phase_index),
  );
  const episodeEndHead = gitV01(input.repository_root, ["rev-parse", "HEAD"]);
  const episodeEndTree = gitV01(input.repository_root, ["rev-parse", "HEAD^{tree}"]);
  assert.equal(gitV01(input.repository_root, ["status", "--short"]), "");
  const observation = evaluateRepositoryEpisodeV01({
    source: input.source,
    commitment,
    repository_root: input.repository_root,
    episode_start_commit: episodeStartCommit,
    episode_role: input.episode_role,
    condition: input.condition,
    holdout_variant: input.holdout_variant,
    run_ref_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(request.run_id),
    ),
    evaluator_role: input.manifest.outcome_evaluator,
    evaluator_version: input.manifest.evaluator_version,
    workspace_id: input.manifest.workspace_id,
    project_id: input.source.project_id,
    run_oracles: input.run_oracles,
    result,
    oracle_guard_path: input.roots.oracle_guard_path,
    network_attempt_log: input.roots.network_attempt_log,
  });
  const executionObservation =
    buildCommissionedWorkSyntheticExecutionObservationV01({
      packet,
      request,
      result,
      plan: input.plan,
    });
  const receipt = buildCommissionedWorkRunReceiptV01({
    request,
    packet,
    result,
    observation,
    execution_observation: executionObservation,
  });
  const repositoryState = {
    initial_commit: input.initial_commit,
    initial_tree: input.initial_tree,
    episode_start_commit: episodeStartCommit,
    episode_start_tree: episodeStartTree,
    episode_end_head: episodeEndHead,
    episode_end_tree: episodeEndTree,
    worktree_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01({
        head: episodeEndHead,
        tree: episodeEndTree,
        status: "clean",
      }),
    ),
  };
  return {
    source: input.source,
    plan: input.plan,
    packet,
    request,
    fixture_admission: fixtureAdmission,
    synthetic_fixture_output: input.synthetic_fixture_output,
    result,
    execution_observation: executionObservation,
    receipt,
    observation,
    episode_id: input.episode_id,
    episode_role: input.episode_role,
    condition: input.condition,
    holdout_variant: input.holdout_variant,
    repository_state: repositoryState,
    started_at: startedAt,
    first_material_action_at: firstActionAt,
    finished_at: finishedAt,
    action_trace_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(
        result.changed_files.map((changed) => ({
          change_kind: changed.change_kind,
          repository_path_fingerprint: createProtocolSha256V01(
            changed.repository_relative_path,
          ),
          after_hash: changed.after_hash,
        })),
      ),
    ),
  };
}

function buildSyntheticFixtureBindingV01(input: {
  source: CommissionedWorkCaseSourceV01;
  actual_plan:
    | CommissionedWorkEpisodePlanSourceV01
    | CommissionedWorkSuccessorPlanSourceV01;
  synthetic_fixture_output: CommissionedWorkSyntheticFixtureOutputV01;
  packet: TaskContextPacketV01;
  commitment: CommissionedWorkCaseCommitmentV01;
}): CommissionedWorkbenchSyntheticFixtureBindingV01 {
  const successor = "condition" in input.actual_plan ? input.actual_plan : null;
  assert.equal(
    input.synthetic_fixture_output.executor_role_id,
    input.actual_plan.executor_role_id,
  );
  return createCommissionedWorkbenchSyntheticFixtureBindingV01({
    packet: input.packet,
    operation_contract: input.actual_plan.operation_contract,
    synthetic_fixture_output: input.synthetic_fixture_output,
    expected_current_source_fingerprint:
      successor === null
        ? null
        : input.commitment.expected_current_source_fingerprint,
    current_source_relative_paths:
      successor === null ? [] : input.source.current_source_relative_paths,
    continuation_material_count: successor?.selected_material_ids.length ?? 0,
  });
}

function evaluateRepositoryEpisodeV01(input: {
  source: CommissionedWorkCaseSourceV01;
  commitment: CommissionedWorkCaseCommitmentV01;
  repository_root: string;
  episode_start_commit: string;
  episode_role: "predecessor" | "successor";
  condition: CommissionedWorkConditionV01 | null;
  holdout_variant: CommissionedWorkHoldoutVariantV01 | null;
  run_ref_fingerprint: string;
  evaluator_role: ReturnType<typeof buildCommissionedWorkFamilyManifestV01>["outcome_evaluator"];
  evaluator_version: string;
  workspace_id: string;
  project_id: string;
  run_oracles: boolean;
  result: NativeHostResultV01;
  oracle_guard_path: string;
  network_attempt_log: string;
}): CommissionedWorkObjectiveObservationV01 {
  const changedPaths = gitV01(input.repository_root, [
    "diff",
    "--name-only",
    `${input.episode_start_commit}..HEAD`,
  ])
    .split("\n")
    .filter(Boolean)
    .sort(compareProtocolCodeUnitsV01);
  const checks = input.source.required_checks.map((check) => {
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
    if (!input.run_oracles) {
      return {
        check_id: check.check_id,
        disposition: "skipped" as const,
        command_fingerprint: null,
        exit_code: null,
      };
    }
    try {
      runOracleProcessV01({
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
  const guardObservations = input.source.negative_space_guards.map(
    (guard, index) => {
      const content = readFileSync(
        path.join(input.repository_root, guard.repository_relative_path),
        "utf8",
      );
      const status = content.includes(guard.forbidden_fragment)
        ? ("revived" as const)
        : ("preserved" as const);
      return {
        guard_ref: input.commitment.negative_space_guard_refs[index]!,
        status,
      };
    },
  );
  const currentSourceFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01(
      [...input.source.current_source_relative_paths]
        .sort(compareProtocolCodeUnitsV01)
        .map((repository_relative_path) => ({
          repository_relative_path,
          content_fingerprint: createProtocolSha256V01(
            canonicalizeProtocolValueV01(
              readFileSync(
                path.join(input.repository_root, repository_relative_path),
                "utf8",
              ),
            ),
          ),
        })),
    ),
  );
  const currentnessCheck = checks.find(
    (check) => check.check_id === input.source.source_currentness_check_id,
  );
  const sourceCurrentness =
    input.episode_role === "predecessor"
      ? ("unknown" as const)
      : currentnessCheck?.disposition === "passed"
        ? ("current" as const)
        : currentnessCheck?.disposition === "failed"
          ? ("failed" as const)
          : ("unknown" as const);
  const actualDiff = changedPaths.map((repository_relative_path) => ({
    repository_relative_path,
    content_fingerprint: createProtocolSha256V01(
      readFileSync(
        path.join(input.repository_root, repository_relative_path),
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
    input.episode_role === "predecessor"
      ? recordedDiff
      : input.source.expected_success_writes
          .map((write) => ({
            repository_relative_path: write.repository_relative_path,
            content_fingerprint: createProtocolSha256V01(write.content),
          }))
          .sort((left, right) =>
            compareProtocolCodeUnitsV01(
              left.repository_relative_path,
              right.repository_relative_path,
            ),
          );
  const diffCorrect =
    canonicalizeProtocolValueV01(actualDiff) ===
      canonicalizeProtocolValueV01(expectedDiff) &&
    canonicalizeProtocolValueV01(actualDiff) ===
      canonicalizeProtocolValueV01(recordedDiff);
  const observationInput: BuildCommissionedWorkObjectiveObservationInputV01 = {
    case_commitment: input.commitment,
    evaluator_version: input.evaluator_version,
    evaluator_role: input.evaluator_role,
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    case_id: input.source.case_id,
    episode_role: input.episode_role,
    condition: input.condition,
    holdout_variant: input.holdout_variant,
    run_ref_fingerprint: input.run_ref_fingerprint,
    oracle_executed: input.run_oracles,
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
    repository_diff_correctness:
      diffCorrect ? "passed" : "failed",
    verification_completeness: input.run_oracles ? "complete" : "incomplete",
    negative_space: {
      status: guardObservations.some((guard) => guard.status === "revived")
        ? "revived"
        : "preserved",
      violated_guard_fingerprints: guardObservations
        .filter((guard) => guard.status === "revived")
        .map((guard) => guard.guard_ref.content_fingerprint),
      guard_observations: guardObservations,
    },
    source_currentness: sourceCurrentness,
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
  return buildCommissionedWorkObjectiveObservationV01(observationInput);
}

function buildEpisodeArtifactFromBundleV01(input: {
  manifest: ReturnType<typeof buildCommissionedWorkFamilyManifestV01>;
  bundle: EpisodeBundle;
  predecessor_ref: CommissionedWorkRecordRefV01 | null;
  predecessor_checkpoint: CommissionedWorkEpisodeCheckpointV01 | null;
  candidate_fingerprint: string | null;
}): CommissionedWorkEpisodeArtifactV01 {
  const buildInput: BuildCommissionedWorkEpisodeArtifactInputV01 = {
    manifest: input.manifest,
    source: input.bundle.source,
    plan: input.bundle.plan,
    packet: input.bundle.packet,
    request: input.bundle.request,
    result: input.bundle.result,
    receipt: input.bundle.receipt,
    observation: input.bundle.observation,
    execution_observation: input.bundle.execution_observation,
    episode_id: input.bundle.episode_id,
    episode_role: input.bundle.episode_role,
    condition: input.bundle.condition,
    holdout_variant: input.bundle.holdout_variant,
    predecessor_episode_ref: input.predecessor_ref,
    predecessor_checkpoint: input.predecessor_checkpoint,
    candidate_freeze_fingerprint: input.candidate_fingerprint,
    repository_state: input.bundle.repository_state,
    candidate_frozen_before_start:
      input.bundle.source.case_role === "holdout"
        ? true
        : null,
    repository_action_trace_fingerprint:
      input.bundle.action_trace_fingerprint,
  };
  return buildCommissionedWorkEpisodeArtifactV01(buildInput);
}

function assertTrainingContrastsV01(report: CommissionedWorkFinalReportV01): void {
  for (const caseCommitment of report.family.training_cases) {
    const episodes = report.training.successor_episodes.filter(
      (episode) => episode.case_id === caseCommitment.case_id,
    );
    const exact = episodes.find(
      (episode) => episode.condition === "exact_current_continuity",
    );
    assert.equal(exact?.evaluation.deterministic_repository_task_success, true);
    assert.equal(
      episodes.some(
        (episode) =>
          episode.condition !== "exact_current_continuity" &&
          !episode.evaluation.deterministic_repository_task_success,
      ),
      true,
    );
  }
  const cobaltPredecessor = report.training.predecessor_episodes.find(
    (episode) => episode.case_id === "case-cobalt-29",
  );
  assert.equal(
    cobaltPredecessor?.executor_completion_attestation.claimed_complete,
    true,
  );
  assert.equal(
    cobaltPredecessor?.evaluation.deterministic_repository_task_success,
    false,
  );
  assert.equal(cobaltPredecessor?.evaluation.false_success_behavior, "observed");
  const cedarRevival = report.training.successor_episodes.find(
    (episode) =>
      episode.case_id === "case-cedar-41" &&
      episode.condition === "stale_or_regime_shift_continuity",
  );
  assert.equal(cedarRevival?.evaluation.negative_space_status, "revived");
  assert.ok(cedarRevival?.evaluation.hard_failures.includes("negative_space_revived"));
  assert.equal(cedarRevival?.evaluation.hard_failures_non_compensable, true);
  for (const episode of report.training.successor_episodes) {
    assert.equal(episode.evaluation.resources.model_usage_units.value, null);
    assert.equal(episode.evaluation.resources.cost_microunits.value, null);
    assert.equal(episode.evaluation.resources.latency_ms.value, null);
    assert.equal(
      episode.evidence_ladder.find(
        (row) => row.stage === "support_validated",
      )?.status,
      "unknown",
    );
    if (
      (episode.execution_binding.continuation_materials_delivered ?? 0) > 0
    ) {
      assert.equal(
        episode.evidence_ladder.find((row) => row.stage === "referenced")
          ?.status,
        "unknown",
      );
    }
    assert.equal(
      episode.evidence_ladder.find(
        (row) => row.stage === "outcome_associated",
      )?.status,
      "unknown",
    );
  }
  const zeroControl = report.training.successor_episodes.find(
    (episode) => episode.condition === "zero_continuation_control",
  );
  assert.equal(
    zeroControl?.evidence_ladder.find((row) => row.stage === "referenced")
      ?.status,
    "not_established",
  );
  const verificationComponent =
    report.consolidation_candidate.minimal_generalized_rule.components.find(
      (component) =>
        component.component_ref.content_fingerprint ===
        createProtocolSha256V01(
          canonicalizeProtocolValueV01(
            "separate_execution_completion_from_verified_success",
          ),
        ),
    );
  assert.equal(verificationComponent?.independent_origin_group_ids.length, 1);
  assert.ok(
    report.consolidation_candidate.missing_evidence_codes.includes(
      "component_independent_recurrence_incomplete",
    ),
  );
  assert.equal(
    report.consolidation_candidate.minimal_generalized_rule.components.every(
      (component) =>
        component.source_episode_refs.length > 0 &&
        component.source_evaluation_refs.length > 0 &&
        component.independent_support_established === false,
    ),
    true,
  );
  for (const stage of [
    "referenced",
    "behaviorally_conditioned",
    "support_validated",
    "outcome_associated",
    "intervention_sensitive",
    "repeatable",
  ] as const) {
    assert.equal(
      report.family_evidence_ladder.find((row) => row.stage === stage)?.status,
      "unknown",
    );
  }
  assert.equal(
    report.family_evidence_ladder.find(
      (row) => row.stage === "held_out_transfer",
    )?.status,
    "not_established",
  );
}

async function runNegativeContractCasesV01(input: {
  roots: ReturnType<typeof createDisposableRootsV01>;
  familySource: ReturnType<typeof createCommissionedControlledWorkFamilySourceV01>;
  syntheticFixtureOutputs: CommissionedWorkSyntheticFixtureOutputV01[];
  manifest: ReturnType<typeof buildCommissionedWorkFamilyManifestV01>;
  report: CommissionedWorkFinalReportV01;
  candidate: CommissionedWorkFinalReportV01["consolidation_candidate"];
  training: CommissionedWorkFinalReportV01["training"];
  holdout: CommissionedWorkFinalReportV01["holdout"];
  receipt_probe_bundle: EpisodeBundle;
}): Promise<void> {
  const taskMutation = structuredClone(input.familySource);
  taskMutation.training_cases[0].task.goal = "Mutated after seal.";
  assert.throws(
    () =>
      assertCommissionedWorkFamilySourceBindingV01({
        manifest: input.manifest,
        training_cases: taskMutation.training_cases,
        holdout_case: taskMutation.holdout_case,
      }),
    /commissioned_work_task_or_rubric_mutated_after_seal/u,
  );
  const rubricMutation = structuredClone(input.familySource);
  rubricMutation.training_cases[1].required_checks[0]!.check_id =
    "cobalt-mutated-contract";
  assert.throws(
    () =>
      assertCommissionedWorkFamilySourceBindingV01({
        manifest: input.manifest,
        training_cases: rubricMutation.training_cases,
        holdout_case: rubricMutation.holdout_case,
      }),
    /commissioned_work_task_or_rubric_mutated_after_seal/u,
  );
  const sameLengthPlanMutation = structuredClone(input.familySource);
  const originalAllowedPath =
    sameLengthPlanMutation.training_cases[0].successor_plans[1]!
      .operation_contract.allowed_repository_relative_paths[0]!;
  sameLengthPlanMutation.training_cases[0].successor_plans[1]!
    .operation_contract.allowed_repository_relative_paths[0] =
    `${originalAllowedPath[0] === "a" ? "b" : "a"}${originalAllowedPath.slice(1)}`;
  assert.equal(
    Buffer.byteLength(
      sameLengthPlanMutation.training_cases[0].successor_plans[1]!
        .operation_contract.allowed_repository_relative_paths[0]!,
      "utf8",
    ),
    Buffer.byteLength(originalAllowedPath, "utf8"),
  );
  assert.throws(
    () =>
      assertCommissionedWorkFamilySourceBindingV01({
        manifest: input.manifest,
        training_cases: sameLengthPlanMutation.training_cases,
        holdout_case: sameLengthPlanMutation.holdout_case,
      }),
    /commissioned_work_task_or_rubric_mutated_after_seal/u,
  );
  const executorMutation = structuredClone(input.familySource);
  executorMutation.training_cases[0].successor_plans[1]!.executor_role_id =
    "executor-amber-forged";
  assert.throws(
    () =>
      assertCommissionedWorkFamilySourceBindingV01({
        manifest: input.manifest,
        training_cases: executorMutation.training_cases,
        holdout_case: executorMutation.holdout_case,
      }),
    /commissioned_work_task_or_rubric_mutated_after_seal/u,
  );
  const commonLeak = structuredClone(input.familySource);
  commonLeak.training_cases[0].materials.find(
    (item) => item.material_kind === "common_task_evidence",
  )!.content += " exact_current_continuity";
  assert.throws(
    () => buildCommissionedWorkFamilyManifestV01(commonLeak),
    /commissioned_work_condition_common_evidence_leak/u,
  );
  const repeatedOrigin = structuredClone(input.familySource);
  repeatedOrigin.training_cases[1].independent_origin_group_id =
    repeatedOrigin.training_cases[0].independent_origin_group_id;
  assert.throws(
    () => buildCommissionedWorkFamilyManifestV01(repeatedOrigin),
    /commissioned_work_case_source_distinction_invalid:independent_origin_group_id/u,
  );
  const zeroLeak = structuredClone(input.familySource);
  const zeroLeakPlan = zeroLeak.training_cases[0].successor_plans.find(
    (plan) => plan.condition === "zero_continuation_control",
  )!;
  zeroLeakPlan.selected_material_ids = ["amber-current"];
  zeroLeakPlan.excluded_material_ids = ["amber-old"];
  assert.throws(
    () => buildCommissionedWorkFamilyManifestV01(zeroLeak),
    /commissioned_work_zero_control_continuation_invalid/u,
  );
  const exactStale = structuredClone(input.familySource);
  const exactStalePlan = exactStale.training_cases[0].successor_plans.find(
    (plan) => plan.condition === "exact_current_continuity",
  )!;
  exactStalePlan.selected_material_ids.push("amber-old");
  exactStalePlan.excluded_material_ids = [];
  assert.throws(
    () => buildCommissionedWorkFamilyManifestV01(exactStale),
    /commissioned_work_exact_current_stale_material_invalid/u,
  );
  const unmatchedAblation = structuredClone(input.familySource);
  const unmatchedExact = unmatchedAblation.training_cases[1].successor_plans.find(
    (plan) => plan.condition === "exact_current_continuity",
  )!;
  const unmatchedPlan = unmatchedAblation.training_cases[1].successor_plans.find(
    (plan) => plan.condition === "matched_ablation",
  )!;
  unmatchedPlan.selected_material_ids = [...unmatchedExact.selected_material_ids];
  unmatchedPlan.excluded_material_ids = [...unmatchedExact.excluded_material_ids];
  assert.throws(
    () => buildCommissionedWorkFamilyManifestV01(unmatchedAblation),
    /commissioned_work_matched_ablation_relation_invalid/u,
  );
  const staleMissing = structuredClone(input.familySource);
  staleMissing.training_cases[2].successor_plans.find(
    (plan) => plan.condition === "stale_or_regime_shift_continuity",
  )!.stale_relation_material_id = null;
  assert.throws(
    () => buildCommissionedWorkFamilyManifestV01(staleMissing),
    /commissioned_work_stale_relation_binding_invalid/u,
  );
  const invalidHoldoutMode = structuredClone(input.familySource);
  invalidHoldoutMode.holdout_case.successor_plans.find(
    (plan) => plan.holdout_variant === "candidate_component_ablation",
  )!.candidate_intervention_mode = "all_frozen_candidate_components";
  assert.throws(
    () => buildCommissionedWorkFamilyManifestV01(invalidHoldoutMode),
    /commissioned_work_holdout_candidate_intervention_invalid/u,
  );
  await assertSyntheticOutputSeparationV01({
    roots: input.roots,
    familySource: input.familySource,
    syntheticFixtureOutputs: input.syntheticFixtureOutputs,
    manifest: input.manifest,
    bundle: input.receipt_probe_bundle,
    predecessor: input.training.predecessor_episodes.find(
      (episode) => episode.case_id === input.receipt_probe_bundle.source.case_id,
    )!,
  });
  const caseCommitment = input.manifest.training_cases[0];
  const baseObservation = negativeObservationInputV01(
    input.manifest,
    caseCommitment,
  );
  assert.throws(
    () =>
      buildCommissionedWorkObjectiveObservationV01({
        ...baseObservation,
        current_source_fingerprint: createProtocolSha256V01(
          "unreflected-current-source-drift",
        ),
      }),
    /commissioned_work_observation_current_source_binding_invalid/u,
  );
  const contradictoryCurrentnessChecks = baseObservation.required_checks.map(
    (check) =>
      check.check_id === caseCommitment.source_currentness_check_id
        ? {
            ...check,
            disposition: "failed" as const,
            command_fingerprint: createProtocolSha256V01(
              "contradictory-currentness-check",
            ),
            exit_code: 1,
          }
        : check,
  );
  assert.throws(
    () =>
      buildCommissionedWorkObjectiveObservationV01({
        ...baseObservation,
        required_checks: contradictoryCurrentnessChecks,
        source_currentness: "current",
      }),
    /commissioned_work_observation_source_currentness_relation_invalid/u,
  );
  assert.throws(
    () =>
      buildCommissionedWorkObjectiveObservationV01({
        ...baseObservation,
        unauthorized_effects: {
          ...baseObservation.unauthorized_effects,
          provider_calls_outside_authorization: 1 as 0,
        },
      }),
    /commissioned_work_observation_authority_expansion/u,
  );
  const crossProjectSource = input.familySource.training_cases[0];
  const crossProjectPlan = crossProjectSource.successor_plans[0]!;
  const crossProjectPacket = buildCommissionedWorkTaskContextPacketV01({
    manifest: input.manifest,
    source: crossProjectSource,
    plan: crossProjectPlan,
    consolidation_candidate: null,
    expected_candidate_freeze_fingerprint: null,
    generated_at: "2026-08-27T02:40:00.000Z",
  });
  assert.throws(
    () =>
      buildCommissionedWorkNativeHostRequestV01({
        manifest: input.manifest,
        source: crossProjectSource,
        plan: crossProjectPlan,
        consolidation_candidate: null,
        expected_candidate_freeze_fingerprint: null,
        packet: crossProjectPacket,
        runtime: {
          report_included: false,
          case_id: crossProjectSource.case_id,
          condition: crossProjectPlan.condition,
          holdout_variant: null,
          workspace_id: input.manifest.workspace_id,
          project_id: "project-cross-scope",
          repository_root: input.roots.artifact_repository,
          database_path: path.join(input.roots.database, "cross.sqlite"),
          home_root: input.roots.home,
          data_root: input.roots.data,
          config_root: input.roots.config,
          runtime_root: input.roots.runtime,
          artifact_root: input.roots.artifacts,
        },
        episode_id: "cross-project-refusal",
        requested_at: "2026-08-27T02:40:00.000Z",
      }),
    /commissioned_work_cross_project_source_refused/u,
  );
  const forgedPlan = structuredClone(crossProjectPlan);
  forgedPlan.operation_contract.max_commands += 1;
  assert.throws(
    () =>
      buildCommissionedWorkTaskContextPacketV01({
        manifest: input.manifest,
        source: crossProjectSource,
        plan: forgedPlan,
        consolidation_candidate: null,
        expected_candidate_freeze_fingerprint: null,
        generated_at: "2026-08-27T02:41:00.000Z",
      }),
    /commissioned_work_episode_plan_not_sealed/u,
  );
  const inheritedEpisode = structuredClone(
    input.training.predecessor_episodes[0]!,
  );
  inheritedEpisode.execution_binding.predecessor_transcript_inherited =
    true as false;
  resealV01(
    inheritedEpisode,
    "commissioned_work_episode_without_integrity_fingerprint",
  );
  assert.throws(
    () =>
      buildCommissionedWorkTrainingResultV01({
        manifest: input.manifest,
        predecessor_episodes: [
          inheritedEpisode,
          ...input.training.predecessor_episodes.slice(1),
        ],
        successor_episodes: input.training.successor_episodes,
      }),
    /commissioned_work_episode_authority_or_cold_boundary_invalid/u,
  );
  const sourceBoundEpisode = input.training.successor_episodes.find(
    (episode) =>
      episode.episode_id === input.receipt_probe_bundle.episode_id,
  )!;
  const chronologyTamperedBundle = structuredClone(
    input.receipt_probe_bundle,
  );
  chronologyTamperedBundle.execution_observation.first_material_action.observed_at =
    addSecondsV01(
      chronologyTamperedBundle.result.finished_at,
      1,
    );
  resealV01(
    chronologyTamperedBundle.execution_observation,
    "commissioned_work_execution_observation_without_integrity_fingerprint",
  );
  const sourcePredecessor = input.training.predecessor_episodes.find(
    (episode) => episode.case_id === sourceBoundEpisode.case_id,
  )!;
  const sourceCheckpoint = buildCommissionedWorkEpisodeCheckpointV01(
    sourcePredecessor,
  );
  assert.throws(
    () =>
      buildEpisodeArtifactFromBundleV01({
        manifest: input.manifest,
        bundle: chronologyTamperedBundle,
        predecessor_ref: sourceBoundEpisode.predecessor_episode_ref,
        predecessor_checkpoint: sourceCheckpoint,
        candidate_fingerprint: null,
      }),
    /commissioned_work_first_action_order_invalid/u,
  );
  const checkpointTampered = structuredClone(sourceBoundEpisode);
  checkpointTampered.episode_checkpoint_ref =
    createCommissionedWorkRecordRefV01({
      record_version: "commissioned_work_episode_checkpoint.v0.1",
      record_id: `checkpoint:${checkpointTampered.case_id}`,
      record_fingerprint: createProtocolSha256V01(
        "tampered-episode-checkpoint",
      ),
    });
  resealV01(
    checkpointTampered,
    "commissioned_work_episode_without_integrity_fingerprint",
  );
  assert.throws(
    () =>
      buildCommissionedWorkTrainingResultV01({
        manifest: input.manifest,
        predecessor_episodes: input.training.predecessor_episodes,
        successor_episodes: input.training.successor_episodes.map((episode) =>
          episode.episode_id === checkpointTampered.episode_id
            ? checkpointTampered
            : episode,
        ),
      }),
    /commissioned_work_training_case_slots_invalid/u,
  );
  const deliveryTampered = structuredClone(sourceBoundEpisode);
  deliveryTampered.execution_binding.continuation_materials_delivered =
    (deliveryTampered.execution_binding.continuation_materials_delivered ?? 0) +
    1;
  resealV01(
    deliveryTampered,
    "commissioned_work_episode_without_integrity_fingerprint",
  );
  assert.throws(
    () =>
      buildCommissionedWorkTrainingResultV01({
        manifest: input.manifest,
        predecessor_episodes: input.training.predecessor_episodes,
        successor_episodes: input.training.successor_episodes.map((episode) =>
          episode.episode_id === deliveryTampered.episode_id
            ? deliveryTampered
            : episode,
        ),
      }),
    /commissioned_work_episode_manifest_binding_invalid/u,
  );
  const mutatedCandidate = structuredClone(input.candidate);
  mutatedCandidate.uncertainty_codes.push("post_freeze_mutation");
  assert.throws(
    () =>
      buildCommissionedWorkTaskContextPacketV01({
        manifest: input.manifest,
        source: input.familySource.holdout_case,
        plan: input.familySource.holdout_case.successor_plans.find(
          (plan) => plan.holdout_variant === "candidate_present",
        )!,
        consolidation_candidate: mutatedCandidate,
        expected_candidate_freeze_fingerprint:
          input.candidate.integrity.fingerprint,
        generated_at: "2026-08-27T04:04:00.000Z",
      }),
    /commissioned_work_candidate_freeze_invalid/u,
  );
  const resealedCandidate = structuredClone(input.candidate);
  resealedCandidate.uncertainty_codes.push("post_freeze_resealed_mutation");
  resealV01(
    resealedCandidate,
    "commissioned_work_candidate_without_integrity_fingerprint",
  );
  assert.throws(
    () =>
      buildCommissionedWorkTaskContextPacketV01({
        manifest: input.manifest,
        source: input.familySource.holdout_case,
        plan: input.familySource.holdout_case.successor_plans.find(
          (plan) => plan.holdout_variant === "candidate_present",
        )!,
        consolidation_candidate: resealedCandidate,
        expected_candidate_freeze_fingerprint:
          input.candidate.integrity.fingerprint,
        generated_at: "2026-08-27T04:04:00.000Z",
      }),
    /commissioned_work_candidate_freeze_anchor_invalid/u,
  );
  assert.throws(
    () =>
      buildCommissionedWorkHoldoutEvaluationV01({
        manifest: input.manifest,
        candidate: mutatedCandidate,
        holdout_id: input.holdout.holdout_id,
        holdout_materialized_at: input.holdout.holdout_materialized_at,
        holdout_started_at: input.holdout.holdout_started_at,
        predecessor_episode: input.holdout.predecessor_episode,
        arms: input.holdout.arms,
      }),
    /commissioned_work_candidate_freeze_invalid/u,
  );
  const holdoutDerivedCandidate = structuredClone(input.candidate);
  holdoutDerivedCandidate.source_episode_refs.push(
    episodeRefV01(input.holdout.arms[0]),
  );
  resealV01(
    holdoutDerivedCandidate,
    "commissioned_work_candidate_without_integrity_fingerprint",
  );
  assert.throws(
    () =>
      buildCommissionedWorkFinalReportV01({
        report_id: input.report.report_id,
        family: input.manifest,
        training: input.training,
        consolidation_candidate: holdoutDerivedCandidate,
        holdout: input.holdout,
        limitations: input.report.limitations,
      }),
    /commissioned_work_candidate_training_derivation_invalid/u,
  );
  const reusedExecutorReport = structuredClone(input.report);
  reusedExecutorReport.holdout.arms[0]!.evaluation.executor_role =
    reusedExecutorReport.training.successor_episodes[0]!.evaluation.executor_role;
  resealV01(
    reusedExecutorReport.holdout.arms[0]!,
    "commissioned_work_episode_without_integrity_fingerprint",
  );
  resealV01(
    reusedExecutorReport.holdout,
    "commissioned_work_holdout_without_integrity_fingerprint",
  );
  resealV01(
    reusedExecutorReport,
    "commissioned_work_report_without_integrity_fingerprint",
  );
  assert.throws(
    () => assertValidCommissionedWorkFinalReportV01(reusedExecutorReport),
    /commissioned_work_report_executor_identity_reused/u,
  );
  const nonzeroCallCountReport = structuredClone(input.report);
  nonzeroCallCountReport.counts.real_provider_calls = 1 as 0;
  resealV01(
    nonzeroCallCountReport,
    "commissioned_work_report_without_integrity_fingerprint",
  );
  assert.throws(
    () => assertValidCommissionedWorkFinalReportV01(nonzeroCallCountReport),
    /commissioned_work_report_counts_or_cleanup_invalid/u,
  );
  const cleanupClaimReport = structuredClone(input.report);
  cleanupClaimReport.cleanup.requested = false as true;
  cleanupClaimReport.cleanup.report_claims_cleanup_completion = true as false;
  resealV01(
    cleanupClaimReport,
    "commissioned_work_report_without_integrity_fingerprint",
  );
  assert.throws(
    () => assertValidCommissionedWorkFinalReportV01(cleanupClaimReport),
    /commissioned_work_report_counts_or_cleanup_invalid/u,
  );
  const nonzeroEpisodeResource = structuredClone(sourceBoundEpisode);
  nonzeroEpisodeResource.evaluation.resources.provider_calls = {
    provenance: "observed",
    value: 1,
  };
  resealV01(
    nonzeroEpisodeResource,
    "commissioned_work_episode_without_integrity_fingerprint",
  );
  assert.throws(
    () =>
      buildCommissionedWorkTrainingResultV01({
        manifest: input.manifest,
        predecessor_episodes: input.training.predecessor_episodes,
        successor_episodes: input.training.successor_episodes.map((episode) =>
          episode.episode_id === nonzeroEpisodeResource.episode_id
            ? nonzeroEpisodeResource
            : episode,
        ),
      }),
    /commissioned_work_synthetic_episode_binding_invalid/u,
  );
  assert.throws(
    () =>
      buildCommissionedWorkConsolidationCandidateV01({
        manifest: input.manifest,
        training: input.training,
        candidate_id: "candidate-before-training-finished",
        frozen_at: "2026-08-27T01:00:00.000Z",
      }),
    /commissioned_work_candidate_frozen_before_training_complete/u,
  );
  const predatesMaterialization = structuredClone(
    input.holdout.predecessor_episode,
  );
  predatesMaterialization.chronology.started_at = "2026-08-27T03:30:00.000Z";
  predatesMaterialization.chronology.first_material_action_at =
    "2026-08-27T03:30:01.000Z";
  predatesMaterialization.chronology.finished_at = "2026-08-27T03:30:02.000Z";
  resealV01(
    predatesMaterialization,
    "commissioned_work_episode_without_integrity_fingerprint",
  );
  assert.throws(
    () =>
      buildCommissionedWorkHoldoutEvaluationV01({
        manifest: input.manifest,
        candidate: input.candidate,
        holdout_id: input.holdout.holdout_id,
        holdout_materialized_at: input.holdout.holdout_materialized_at,
        holdout_started_at: input.holdout.holdout_started_at,
        predecessor_episode: predatesMaterialization,
        arms: input.holdout.arms,
      }),
    /commissioned_work_holdout_predecessor_invalid/u,
  );
  const hardGateObservation = structuredClone(
    input.receipt_probe_bundle.observation,
  );
  hardGateObservation.negative_space.status = "revived";
  hardGateObservation.negative_space.violated_guard_fingerprints = [
    hardGateObservation.negative_space.guard_observations[0]!.guard_ref
      .content_fingerprint,
  ];
  hardGateObservation.negative_space.guard_observations[0]!.status = "revived";
  resealV01(
    hardGateObservation,
    "commissioned_work_objective_observation_without_integrity_fingerprint",
  );
  const hardGateReceipt = buildCommissionedWorkRunReceiptV01({
    request: input.receipt_probe_bundle.request,
    packet: input.receipt_probe_bundle.packet,
    result: input.receipt_probe_bundle.result,
    observation: hardGateObservation,
    execution_observation:
      input.receipt_probe_bundle.execution_observation,
  });
  assert.equal(hardGateReceipt.verification.status, "failed");
  assert.equal(
    hardGateReceipt.checks.find(
      (check) => check.check_id === "objective_negative_space",
    )?.status,
    "failed",
  );
  const noOracleObservation = structuredClone(
    input.receipt_probe_bundle.observation,
  );
  noOracleObservation.oracle_executed = false;
  noOracleObservation.verification_completeness = "incomplete";
  noOracleObservation.required_checks = noOracleObservation.required_checks.map(
    (check) => ({
      ...check,
      disposition: "unknown" as const,
      command_fingerprint: null,
      exit_code: null,
    }),
  );
  resealV01(
    noOracleObservation,
    "commissioned_work_objective_observation_without_integrity_fingerprint",
  );
  const noOracleReceipt = buildCommissionedWorkRunReceiptV01({
    request: input.receipt_probe_bundle.request,
    packet: input.receipt_probe_bundle.packet,
    result: input.receipt_probe_bundle.result,
    observation: noOracleObservation,
    execution_observation:
      input.receipt_probe_bundle.execution_observation,
  });
  assert.notEqual(noOracleReceipt.verification.status, "passed");
  const providerResult = structuredClone(input.receipt_probe_bundle.result);
  providerResult.model_invocation_receipt_refs.push({
    ref_version: "external_ref.v0.1",
    ref_type: "forbidden_model_invocation",
    external_id: "forbidden-model-invocation",
    observed_at: providerResult.finished_at,
    source_ref: createProtocolSha256V01("forbidden-model-invocation"),
    compatibility_namespace: null,
    trust_class: "provider_report",
  });
  assert.throws(
    () => {
      const providerExecutionObservation =
        buildCommissionedWorkSyntheticExecutionObservationV01({
          packet: input.receipt_probe_bundle.packet,
          request: input.receipt_probe_bundle.request,
          result: providerResult,
          plan: input.receipt_probe_bundle.plan,
        });
      return buildCommissionedWorkRunReceiptV01({
        request: input.receipt_probe_bundle.request,
        packet: input.receipt_probe_bundle.packet,
        result: providerResult,
        observation: input.receipt_probe_bundle.observation,
        execution_observation: providerExecutionObservation,
      });
    },
    /commissioned_work_execution_model_receipt_binding_invalid/u,
  );
  for (const unsafe of [
    "/Users/private/work/file.txt",
    "private source at /home/fixture-owner/work/file.txt",
    "C:\\repo\\private\\file.txt",
    "\\\\server\\share\\private.txt",
    "sk-proj-1234567890abcdef",
    "xoxb-12345678-secret",
    "AKIA1234567890ABCD12",
    "-----BEGIN PRIVATE KEY-----",
  ]) {
    assert.throws(
      () =>
        assertSafeCommissionedWorkOutputV01({
          report: input.report,
          unsafe_source_material: unsafe,
        }),
      /commissioned_work_safe_output_invalid/u,
    );
  }
  assertChildNetworkGuardV01(input.roots);
}

async function assertSyntheticOutputSeparationV01(input: {
  roots: ReturnType<typeof createDisposableRootsV01>;
  familySource: ReturnType<typeof createCommissionedControlledWorkFamilySourceV01>;
  syntheticFixtureOutputs: CommissionedWorkSyntheticFixtureOutputV01[];
  manifest: ReturnType<typeof buildCommissionedWorkFamilyManifestV01>;
  bundle: EpisodeBundle;
  predecessor: CommissionedWorkEpisodeArtifactV01;
}): Promise<void> {
  assert.equal("writes" in input.bundle.plan, false);
  const replacementOutputs = structuredClone(input.syntheticFixtureOutputs);
  const replacement = replacementOutputs.find(
    (output) =>
      output.executor_role_id === input.bundle.plan.executor_role_id,
  );
  assert.ok(replacement);
  replacement.writes[0]!.content += "// replacement synthetic mechanics output\n";
  const originalBinding = buildSyntheticFixtureBindingV01({
    source: input.bundle.source,
    actual_plan: input.bundle.plan,
    synthetic_fixture_output: input.bundle.synthetic_fixture_output,
    packet: input.bundle.packet,
    commitment: findCommitmentV01(
      input.manifest,
      input.bundle.source.case_id,
    ),
  });
  const replacementBinding = buildSyntheticFixtureBindingV01({
    source: input.bundle.source,
    actual_plan: input.bundle.plan,
    synthetic_fixture_output: replacement,
    packet: input.bundle.packet,
    commitment: findCommitmentV01(
      input.manifest,
      input.bundle.source.case_id,
    ),
  });
  assert.notEqual(
    replacementBinding.synthetic_fixture_output_fingerprint,
    originalBinding.synthetic_fixture_output_fingerprint,
  );
  assert.equal(
    replacementBinding.operation_contract_fingerprint,
    originalBinding.operation_contract_fingerprint,
  );
  const preauthorizedShapeReplacement = structuredClone(replacement);
  const alternateAuthorizedPath = input.bundle.plan.operation_contract
    .allowed_repository_relative_paths.find(
      (repositoryRelativePath) =>
        repositoryRelativePath !==
        preauthorizedShapeReplacement.writes[0]!.repository_relative_path,
    );
  assert.ok(alternateAuthorizedPath);
  preauthorizedShapeReplacement.writes = [
    {
      repository_relative_path: alternateAuthorizedPath,
      content: "export const mechanicsProbe = true;\n",
    },
  ];
  const preauthorizedShapeBinding = buildSyntheticFixtureBindingV01({
    source: input.bundle.source,
    actual_plan: input.bundle.plan,
    synthetic_fixture_output: preauthorizedShapeReplacement,
    packet: input.bundle.packet,
    commitment: findCommitmentV01(
      input.manifest,
      input.bundle.source.case_id,
    ),
  });
  assert.equal(
    preauthorizedShapeBinding.operation_contract_fingerprint,
    originalBinding.operation_contract_fingerprint,
  );
  assert.deepEqual(
    buildCommissionedWorkFamilyManifestV01(input.familySource),
    input.manifest,
  );
  const outOfContractOutput = structuredClone(replacement);
  outOfContractOutput.writes[0]!.repository_relative_path =
    "outside/preauthorized-scope.mjs";
  assert.throws(
    () =>
      buildSyntheticFixtureBindingV01({
        source: input.bundle.source,
        actual_plan: input.bundle.plan,
        synthetic_fixture_output: outOfContractOutput,
        packet: input.bundle.packet,
        commitment: findCommitmentV01(
          input.manifest,
          input.bundle.source.case_id,
        ),
      }),
    /commissioned_workbench_synthetic_fixture_binding_invalid/u,
  );
  const excessiveChangedFileOutput = structuredClone(replacement);
  excessiveChangedFileOutput.writes =
    input.bundle.plan.operation_contract.allowed_repository_relative_paths.map(
      (repositoryRelativePath, index) => ({
        repository_relative_path: repositoryRelativePath,
        content: `export const mechanicsProbe${index} = true;\n`,
      }),
    );
  assert.equal(
    excessiveChangedFileOutput.writes.length >
      input.bundle.plan.operation_contract.max_changed_files,
    true,
  );
  assert.throws(
    () =>
      buildSyntheticFixtureBindingV01({
        source: input.bundle.source,
        actual_plan: input.bundle.plan,
        synthetic_fixture_output: excessiveChangedFileOutput,
        packet: input.bundle.packet,
        commitment: findCommitmentV01(
          input.manifest,
          input.bundle.source.case_id,
        ),
      }),
    /commissioned_workbench_synthetic_fixture_binding_invalid/u,
  );
  const unsafeSyntheticOutput = structuredClone(replacement);
  unsafeSyntheticOutput.writes[0]!.content =
    "C:\\repo\\private\\synthetic-output.txt";
  assert.throws(
    () =>
      buildSyntheticFixtureBindingV01({
        source: input.bundle.source,
        actual_plan: input.bundle.plan,
        synthetic_fixture_output: unsafeSyntheticOutput,
        packet: input.bundle.packet,
        commitment: findCommitmentV01(
          input.manifest,
          input.bundle.source.case_id,
        ),
      }),
    /commissioned_workbench_synthetic_fixture_output_invalid/u,
  );
  assert.deepEqual(
    buildCommissionedWorkFamilyManifestV01(input.familySource),
    input.manifest,
  );
  const replayPacket = buildCommissionedWorkTaskContextPacketV01({
    manifest: input.manifest,
    source: input.bundle.source,
    plan: input.bundle.plan,
    consolidation_candidate: null,
    expected_candidate_freeze_fingerprint: null,
    generated_at: input.bundle.packet.generated_at,
  });
  const replayRequest = buildCommissionedWorkNativeHostRequestV01({
    manifest: input.manifest,
    source: input.bundle.source,
    plan: input.bundle.plan,
    consolidation_candidate: null,
    expected_candidate_freeze_fingerprint: null,
    packet: replayPacket,
    runtime: {
      report_included: false,
      case_id: input.bundle.source.case_id,
      condition: input.bundle.condition,
      holdout_variant: input.bundle.holdout_variant,
      workspace_id: input.manifest.workspace_id,
      project_id: input.bundle.source.project_id,
      repository_root: input.bundle.request.root_scope.canonical_root,
      database_path: path.join(input.roots.database, "separation-probe.sqlite"),
      home_root: input.roots.home,
      data_root: input.roots.data,
      config_root: input.roots.config,
      runtime_root: input.roots.runtime,
      artifact_root: input.roots.artifacts,
    },
    episode_id: input.bundle.episode_id,
    requested_at: input.bundle.started_at,
  });
  assert.deepEqual(replayPacket, input.bundle.packet);
  assert.deepEqual(replayRequest, input.bundle.request);
  assert.equal(
    canonicalizeProtocolValueV01(replayRequest).includes(
      replacement.writes[0]!.content,
    ),
    false,
  );
  await assertProductionShapedCommissionedAgentPathV01({
    roots: input.roots,
    manifest: input.manifest,
    source: input.familySource.training_cases[0],
  });
}

async function assertProductionShapedCommissionedAgentPathV01(input: {
  roots: ReturnType<typeof createDisposableRootsV01>;
  manifest: ReturnType<typeof buildCommissionedWorkFamilyManifestV01>;
  source: CommissionedWorkCaseSourceV01;
}): Promise<void> {
  const repositoryRoot = path.join(
    input.roots.runtime,
    "production-shaped-codex-app-server",
  );
  mkdirSync(repositoryRoot, { recursive: true, mode: 0o700 });
  for (const fixture of input.source.repository_fixture) {
    writeRepositoryFileV01(
      repositoryRoot,
      fixture.repository_relative_path,
      fixture.content,
    );
  }
  gitV01(repositoryRoot, ["init", "--initial-branch=main"]);
  gitV01(repositoryRoot, ["add", "--all"]);
  gitV01(
    repositoryRoot,
    ["commit", "-m", "initialize production-shaped CW1 probe"],
    "2026-08-27T06:00:00.000Z",
  );
  const initialCommit = gitV01(repositoryRoot, ["rev-parse", "HEAD"]);
  const initialTree = gitV01(repositoryRoot, ["rev-parse", "HEAD^{tree}"]);
  const commitment = findCommitmentV01(
    input.manifest,
    input.source.case_id,
  );

  const execute = async (episodeInput: {
    episode_id: string;
    episode_role: "predecessor" | "successor";
    plan: CommissionedWorkEpisodePlanSourceV01 | CommissionedWorkSuccessorPlanSourceV01;
    scenario:
      | "cw1_predecessor_repository_edit"
      | "cw1_successor_repository_edit";
    generated_at: string;
    thread_id: string;
    session_id: string;
    turn_id: string;
    predecessor_checkpoint: CommissionedWorkEpisodeCheckpointV01 | null;
  }): Promise<ProductionEpisodeProbeV01> => {
    const episodeStartCommit = gitV01(repositoryRoot, ["rev-parse", "HEAD"]);
    const episodeStartTree = gitV01(repositoryRoot, ["rev-parse", "HEAD^{tree}"]);
    const successorPlan =
      "condition" in episodeInput.plan ? episodeInput.plan : null;
    const packet = buildCommissionedWorkTaskContextPacketV01({
      manifest: input.manifest,
      source: input.source,
      plan: episodeInput.plan,
      consolidation_candidate: null,
      expected_candidate_freeze_fingerprint: null,
      generated_at: episodeInput.generated_at,
    });
    const request = buildCommissionedWorkNativeHostRequestV01({
      manifest: input.manifest,
      source: input.source,
      plan: episodeInput.plan,
      consolidation_candidate: null,
      expected_candidate_freeze_fingerprint: null,
      packet,
      runtime: {
        report_included: false,
        case_id: input.source.case_id,
        condition: successorPlan?.condition ?? null,
        holdout_variant: successorPlan?.holdout_variant ?? null,
        workspace_id: input.manifest.workspace_id,
        project_id: input.source.project_id,
        repository_root: repositoryRoot,
        database_path: path.join(
          input.roots.database,
          `${episodeInput.episode_id}.sqlite`,
        ),
        home_root: input.roots.home,
        data_root: input.roots.data,
        config_root: input.roots.config,
        runtime_root: input.roots.runtime,
        artifact_root: input.roots.artifacts,
      },
      episode_id: episodeInput.episode_id,
      requested_at: episodeInput.generated_at,
    });
    for (const expectedWrite of input.source.expected_success_writes) {
      assert.equal(
        canonicalizeProtocolValueV01(request).includes(expectedWrite.content),
        false,
      );
    }
    const runRoot = path.join(input.roots.runtime, episodeInput.episode_id);
    mkdirSync(runRoot, { recursive: true, mode: 0o700 });
    const cleanupMarker = path.join(runRoot, "cleanup.marker");
    const networkCountPath = path.join(runRoot, "network-count.txt");
    const lifecycleEvents: NativeHostLifecycleEventV01[] = [];
    let clockTick = 0;
    const clockBase = Date.parse(episodeInput.generated_at);
    const adapterObservations: CodexAppServerAdapterObservationV01[] = [];
    const adapter = createCodexAppServerAdapterV01({
      now: () => new Date(clockBase + clockTick++ * 50).toISOString(),
      observe: (observation) => adapterObservations.push(observation),
      launch: {
        command: process.execPath,
        prefix_args: [
          path.join(
            process.cwd(),
            "scripts",
            "fixtures",
            "fake-codex-app-server.mjs",
          ),
        ],
        environment: {
          NODE_ENV: "test",
          HOME: input.roots.home,
          TMPDIR: input.roots.temp,
          PATH: hermeticProcessEnvironmentV01?.PATH,
          FAKE_CODEX_SCENARIO: episodeInput.scenario,
          FAKE_CODEX_THREAD_ID: episodeInput.thread_id,
          FAKE_CODEX_SESSION_ID: episodeInput.session_id,
          FAKE_CODEX_TURN_ID: episodeInput.turn_id,
          FAKE_CODEX_CLEANUP_MARKER_PATH: cleanupMarker,
          FAKE_CODEX_NETWORK_COUNT_PATH: networkCountPath,
        },
      },
    });
    const invocation = adapter.invoke(request, {
      cancellation_signal: new AbortController().signal,
      timeout_ms: 10_000,
      stop_settle_timeout_ms: 3_000,
      lifecycle_sink: {
        async report_event(event) {
          lifecycleEvents.push(event);
        },
        async request_approval() {
          throw new Error("cw1_unexpected_native_host_approval");
        },
      },
      resume_binding: null,
    });
    ownedNativeHostProcessesV01 += 1;
    let result: NativeHostResultV01;
    try {
      result = await invocation.result;
      await invocation.settled;
    } catch (error) {
      await invocation
        .request_stop({ reason: "cancellation_requested" })
        .catch(() => undefined);
      await invocation.settled.catch(() => undefined);
      throw error;
    } finally {
      ownedNativeHostProcessesV01 -= 1;
    }
    assert.equal(readFileSync(cleanupMarker, "utf8"), "settled\n");
    assert.equal(readFileSync(networkCountPath, "utf8"), "0\n");
    assert.equal(adapterObservations.at(-1)?.kind, "settled");
    const exactAdapterResult = canonicalizeProtocolValueV01(result);
    const hostRefTypes = result.host_refs.map((ref) => ref.ref_type).sort();
    assert.deepEqual(hostRefTypes, [
      "host_connection",
      "host_session",
      "host_thread",
      "host_turn",
    ]);
    assert.equal(result.adapter_extension.adapter_kind, "codex_app_server");
    assert.equal(
      "synthetic_fixture_output_fingerprint" in
        result.adapter_extension.bounded_metadata,
      false,
    );
    assert.equal(
      "first_material_action_at" in result.adapter_extension.bounded_metadata,
      false,
    );
    const admitted = admitCommissionedWorkExecutorResultV01({
      source: input.source,
      plan: episodeInput.plan,
      request,
      result,
    });
    assert.deepEqual(admitted, result);
    assert.equal(canonicalizeProtocolValueV01(result), exactAdapterResult);
    gitV01(repositoryRoot, ["add", "--all"]);
    gitV01(
      repositoryRoot,
      [
        "commit",
        "-m",
        episodeInput.episode_role === "predecessor"
          ? "record completed bounded predecessor work"
          : "record cold successor repository work",
      ],
      episodeInput.generated_at,
    );
    const episodeEndHead = gitV01(repositoryRoot, ["rev-parse", "HEAD"]);
    const episodeEndTree = gitV01(repositoryRoot, ["rev-parse", "HEAD^{tree}"]);
    const objectiveObservation = evaluateRepositoryEpisodeV01({
      source: input.source,
      commitment,
      repository_root: repositoryRoot,
      episode_start_commit: episodeStartCommit,
      episode_role: episodeInput.episode_role,
      condition: successorPlan?.condition ?? null,
      holdout_variant: successorPlan?.holdout_variant ?? null,
      run_ref_fingerprint: createProtocolSha256V01(
        canonicalizeProtocolValueV01(result.run_id),
      ),
      evaluator_role: input.manifest.outcome_evaluator,
      evaluator_version: input.manifest.evaluator_version,
      workspace_id: input.manifest.workspace_id,
      project_id: input.source.project_id,
      run_oracles: episodeInput.episode_role === "successor",
      result,
      oracle_guard_path: input.roots.oracle_guard_path,
      network_attempt_log: input.roots.network_attempt_log,
    });
    const deliveryEvent = lifecycleEvents.find(
      (event) =>
        event.event_kind === "turn_started" &&
        event.bounded_metadata.packet_delivery_initiated === true,
    );
    assert.ok(deliveryEvent);
    const packetMaterialFingerprint =
      createCommissionedWorkPacketMaterialSetFingerprintV01(packet);
    const networkObservationRef = createCommissionedWorkRecordRefV01({
      record_version: "commissioned_work_test_resource_observation.v0.1",
      record_id: `network-observation:${episodeInput.episode_id}`,
      record_fingerprint: createProtocolSha256V01(
        canonicalizeProtocolValueV01({
          result_fingerprint: createProtocolSha256V01(
            canonicalizeProtocolValueV01(result),
          ),
          network_count: readFileSync(networkCountPath, "utf8"),
        }),
      ),
    });
    const executionObservation =
      buildCommissionedWorkCommissionedAgentExecutionObservationV01({
        packet,
        request,
        result,
        plan: episodeInput.plan,
        execution_evidence_class:
          COMMISSIONED_WORK_COMMISSIONED_AGENT_CONFORMANCE_EVIDENCE_CLASS_V01,
        packet_presentation: {
          status: "delivered_action_order_unknown",
          observed_at: deliveryEvent.observed_at,
          provenance: "native_host_lifecycle",
        },
        continuation_materials_delivered:
          successorPlan?.selected_material_ids.length ?? 0,
        candidate_components_delivered: 0,
        delivered_material_set_fingerprint: packetMaterialFingerprint,
        first_material_action_at: null,
        first_material_action_timing_provenance: "unknown",
        executor_completion_attestation: {
          provenance: "unknown",
          claimed_complete: null,
        },
        resources: {
          provider_calls: { provenance: "unknown", value: null },
          model_calls: { provenance: "unknown", value: null },
          external_network_calls: { provenance: "observed", value: 0 },
          tool_calls: { provenance: "unknown", value: null },
          model_usage_units: { provenance: "unknown", value: null },
          cost_microunits: { provenance: "unknown", value: null },
          latency_ms: { provenance: "unknown", value: null },
          human_review_burden: { provenance: "unknown", value: null },
        },
        resource_binding: {
          provider_calls_observation_ref: null,
          model_calls_observation_ref: null,
          external_network_calls_observation_ref: networkObservationRef,
          live_authorization_ref: null,
          authorization_resource_ceiling: null,
          provider_ref: null,
          model_ref: null,
          route_ref: null,
          network_destination_ref: null,
        },
        unauthorized_effects: zeroUnauthorizedEffectsForTestV01(),
      });
    const receipt = buildCommissionedWorkRunReceiptV01({
      request,
      packet,
      result,
      observation: objectiveObservation,
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
          status: gitV01(repositoryRoot, ["status", "--short"]),
        }),
      ),
    };
    const episode = buildCommissionedWorkEpisodeArtifactV01({
      manifest: input.manifest,
      source: input.source,
      plan: episodeInput.plan,
      packet,
      request,
      result,
      receipt,
      observation: objectiveObservation,
      execution_observation: executionObservation,
      episode_id: episodeInput.episode_id,
      episode_role: episodeInput.episode_role,
      condition: successorPlan?.condition ?? null,
      holdout_variant: successorPlan?.holdout_variant ?? null,
      predecessor_episode_ref:
        episodeInput.predecessor_checkpoint?.predecessor_episode_ref ?? null,
      predecessor_checkpoint: episodeInput.predecessor_checkpoint,
      candidate_freeze_fingerprint: null,
      repository_state: repositoryState,
      candidate_frozen_before_start: null,
      repository_action_trace_fingerprint: createProtocolSha256V01(
        canonicalizeProtocolValueV01({
          changed_files: result.changed_files,
          observed_actions: result.observed_actions,
        }),
      ),
    });
    assertValidCommissionedWorkEpisodeArtifactV01(episode);
    const readbackPath = path.join(
      input.roots.artifacts,
      `${episodeInput.episode_id}.json`,
    );
    writeFileSync(readbackPath, canonicalizeProtocolValueV01(episode), {
      encoding: "utf8",
      mode: 0o600,
    });
    const readback = JSON.parse(
      readFileSync(readbackPath, "utf8"),
    ) as CommissionedWorkEpisodeArtifactV01;
    assertValidCommissionedWorkEpisodeArtifactV01(readback);
    assert.deepEqual(readback, episode);
    return {
      packet,
      request,
      result,
      execution_observation: executionObservation,
      objective_observation: objectiveObservation,
      receipt,
      episode,
    };
  };

  const predecessor = await execute({
    episode_id: "case-amber-17-production-predecessor",
    episode_role: "predecessor",
    plan: input.source.predecessor_plan,
    scenario: "cw1_predecessor_repository_edit",
    generated_at: "2026-08-27T06:10:00.000Z",
    thread_id: "01900000-0000-7000-8000-000000000101",
    session_id: "01900000-0000-7000-8000-000000000102",
    turn_id: "01900000-0000-7000-8000-000000000103",
    predecessor_checkpoint: null,
  });
  assert.equal(predecessor.result.outcome, "completed");
  assert.equal(predecessor.receipt.execution.status, "completed");
  const checkpoint = buildCommissionedWorkEpisodeCheckpointV01(
    predecessor.episode,
  );
  assert.equal(checkpoint.native_host_outcome_preserved, true);
  for (const drift of input.source.source_drift_writes) {
    writeRepositoryFileV01(
      repositoryRoot,
      drift.repository_relative_path,
      drift.content,
    );
  }
  gitV01(repositoryRoot, ["add", "--all"]);
  gitV01(
    repositoryRoot,
    ["commit", "-m", "apply current source truth before cold successor"],
    "2026-08-27T06:20:00.000Z",
  );
  const successorPlan = input.source.successor_plans.find(
    (plan) => plan.condition === "exact_current_continuity",
  )!;
  const successor = await execute({
    episode_id: "case-amber-17-production-successor",
    episode_role: "successor",
    plan: successorPlan,
    scenario: "cw1_successor_repository_edit",
    generated_at: "2026-08-27T06:30:00.000Z",
    thread_id: "01900000-0000-7000-8000-000000000201",
    session_id: "01900000-0000-7000-8000-000000000202",
    turn_id: "01900000-0000-7000-8000-000000000203",
    predecessor_checkpoint: checkpoint,
  });
  assert.equal(
    successor.episode.evaluation.deterministic_repository_task_success,
    true,
  );
  assert.notEqual(
    predecessor.episode.execution_binding.host_ref_set_fingerprint,
    successor.episode.execution_binding.host_ref_set_fingerprint,
  );
  assert.equal(
    successor.episode.execution_binding.predecessor_run_reused,
    false,
  );
  assert.equal(
    successor.episode.execution_binding.predecessor_transcript_inherited,
    false,
  );
  for (const stage of [
    "referenced",
    "behaviorally_conditioned",
    "support_validated",
    "outcome_associated",
    "intervention_sensitive",
    "repeatable",
  ]) {
    assert.equal(
      successor.episode.evidence_ladder.find((row) => row.stage === stage)
        ?.status,
      "unknown",
    );
  }
  assert.equal(
    successor.episode.evaluation.resources.provider_calls.value,
    null,
  );
  assert.equal(
    successor.episode.evaluation.resources.model_calls.value,
    null,
  );
  assert.equal(
    successor.episode.evaluation.resources.external_network_calls.value,
    0,
  );
  assert.equal(successor.episode.evaluation.false_success_behavior, "unknown");

  assertCommissionedExecutionObservationNegativeCasesV01({
    predecessor,
    successor,
    plan: successorPlan,
    checkpoint,
    manifest: input.manifest,
    source: input.source,
  });
}

function zeroUnauthorizedEffectsForTestV01(): CommissionedWorkObjectiveObservationV01["unauthorized_effects"] {
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

function assertCommissionedExecutionObservationNegativeCasesV01(input: {
  predecessor: ProductionEpisodeProbeV01;
  successor: ProductionEpisodeProbeV01;
  plan: CommissionedWorkSuccessorPlanSourceV01;
  checkpoint: CommissionedWorkEpisodeCheckpointV01;
  manifest: ReturnType<typeof buildCommissionedWorkFamilyManifestV01>;
  source: CommissionedWorkCaseSourceV01;
}): void {
  const packetFingerprint =
    createCommissionedWorkPacketMaterialSetFingerprintV01(
      input.successor.packet,
    );
  const baseInput = {
    packet: input.successor.packet,
    request: input.successor.request,
    result: input.successor.result,
    plan: input.plan,
    execution_evidence_class:
      COMMISSIONED_WORK_COMMISSIONED_AGENT_CONFORMANCE_EVIDENCE_CLASS_V01,
    packet_presentation: {
      status: "delivered_action_order_unknown",
      observed_at: input.successor.result.started_at,
      provenance: "native_host_result",
    },
    continuation_materials_delivered: input.plan.selected_material_ids.length,
    candidate_components_delivered: 0,
    delivered_material_set_fingerprint: packetFingerprint,
    first_material_action_at: null,
    first_material_action_timing_provenance: "unknown",
    executor_completion_attestation: {
      provenance: "unknown",
      claimed_complete: null,
    },
    resources: {
      provider_calls: { provenance: "unknown", value: null },
      model_calls: { provenance: "unknown", value: null },
      external_network_calls: { provenance: "unknown", value: null },
      tool_calls: { provenance: "unknown", value: null },
      model_usage_units: { provenance: "unknown", value: null },
      cost_microunits: { provenance: "unknown", value: null },
      latency_ms: { provenance: "unknown", value: null },
      human_review_burden: { provenance: "unknown", value: null },
    },
    resource_binding: {
      provider_calls_observation_ref: null,
      model_calls_observation_ref: null,
      external_network_calls_observation_ref: null,
      live_authorization_ref: null,
      authorization_resource_ceiling: null,
      provider_ref: null,
      model_ref: null,
      route_ref: null,
      network_destination_ref: null,
    },
    unauthorized_effects: zeroUnauthorizedEffectsForTestV01(),
  } as const satisfies BuildCommissionedWorkCommissionedAgentExecutionObservationInputV01;

  const contaminatedResult = structuredClone(input.successor.result);
  contaminatedResult.adapter_extension.bounded_metadata[
    "synthetic_fixture_output_fingerprint"
  ] = createProtocolSha256V01("forbidden-synthetic-field");
  assert.throws(
    () =>
      buildCommissionedWorkCommissionedAgentExecutionObservationV01({
        ...baseInput,
        result: contaminatedResult,
      }),
    /commissioned_work_commissioned_agent_fixture_metadata_forbidden/u,
  );
  assert.throws(
    () =>
      buildCommissionedWorkRunReceiptV01({
        request: input.successor.request,
        packet: input.successor.packet,
        result: input.successor.result,
        observation: input.successor.objective_observation,
        execution_observation: input.predecessor.execution_observation,
      }),
    /commissioned_work_execution_observation_source_invalid/u,
  );
  const changedHostBinding = structuredClone(
    input.successor.execution_observation,
  );
  changedHostBinding.host_ref_set_fingerprint = createProtocolSha256V01(
    "changed-host-ref-set",
  );
  resealV01(
    changedHostBinding,
    "commissioned_work_execution_observation_without_integrity_fingerprint",
  );
  assert.throws(
    () =>
      buildCommissionedWorkRunReceiptV01({
        request: input.successor.request,
        packet: input.successor.packet,
        result: input.successor.result,
        observation: input.successor.objective_observation,
        execution_observation: changedHostBinding,
      }),
    /commissioned_work_execution_observation_source_invalid/u,
  );

  const firstActionAt = new Date(
    Date.parse(input.successor.result.started_at) + 50,
  ).toISOString();
  const latePresentationAt = new Date(
    Date.parse(input.successor.result.started_at) + 100,
  ).toISOString();
  assert.throws(
    () =>
      buildCommissionedWorkCommissionedAgentExecutionObservationV01({
        ...baseInput,
        packet_presentation: {
          status: "presented_before_first_meaningful_action",
          observed_at: latePresentationAt,
          provenance: "native_host_lifecycle",
        },
        first_material_action_at: firstActionAt,
        first_material_action_timing_provenance: "native_host_lifecycle",
      }),
    /commissioned_work_packet_presentation_order_invalid/u,
  );
  assert.throws(
    () =>
      buildCommissionedWorkCommissionedAgentExecutionObservationV01({
        ...baseInput,
        continuation_materials_delivered:
          input.plan.selected_material_ids.length + 1,
      }),
    /commissioned_work_execution_delivery_observation_invalid/u,
  );

  const resultVariants: NativeHostResultV01[] = [];
  const emptyHostResult = structuredClone(input.successor.result);
  emptyHostResult.host_refs = [];
  resultVariants.push(emptyHostResult);
  const duplicateHostResult = structuredClone(input.successor.result);
  duplicateHostResult.host_refs[3] = structuredClone(
    duplicateHostResult.host_refs[0]!,
  );
  resultVariants.push(duplicateHostResult);
  const unknownHostResult = structuredClone(input.successor.result);
  unknownHostResult.host_refs[3]!.ref_type = "arbitrary_provider_host";
  resultVariants.push(unknownHostResult);
  const crossRunHostResult = structuredClone(input.successor.result);
  crossRunHostResult.host_refs = structuredClone(
    input.predecessor.result.host_refs,
  );
  resultVariants.push(crossRunHostResult);
  for (const refusedResult of resultVariants) {
    assert.throws(() =>
      buildCommissionedWorkCommissionedAgentExecutionObservationV01({
        ...baseInput,
        result: refusedResult,
      }),
    );
  }

  const missingObservation =
    buildCommissionedWorkCommissionedAgentExecutionObservationV01({
      ...baseInput,
      packet_presentation: {
        status: "not_observed",
        observed_at: null,
        provenance: "unknown",
      },
      continuation_materials_delivered: null,
      candidate_components_delivered: null,
      delivered_material_set_fingerprint: null,
    });
  const missingReceipt = buildCommissionedWorkRunReceiptV01({
    request: input.successor.request,
    packet: input.successor.packet,
    result: input.successor.result,
    observation: input.successor.objective_observation,
    execution_observation: missingObservation,
  });
  const buildAlternateEpisode = (
    executionObservation: CommissionedWorkExecutionObservationV01,
    receipt: RunReceiptV01,
  ): CommissionedWorkEpisodeArtifactV01 =>
    buildCommissionedWorkEpisodeArtifactV01({
      manifest: input.manifest,
      source: input.source,
      plan: input.plan,
      packet: input.successor.packet,
      request: input.successor.request,
      result: input.successor.result,
      receipt,
      observation: input.successor.objective_observation,
      execution_observation: executionObservation,
      episode_id: input.successor.episode.episode_id,
      episode_role: "successor",
      condition: input.plan.condition,
      holdout_variant: input.plan.holdout_variant,
      predecessor_episode_ref: input.checkpoint.predecessor_episode_ref,
      predecessor_checkpoint: input.checkpoint,
      candidate_freeze_fingerprint: null,
      repository_state: input.successor.episode.repository_state,
      candidate_frozen_before_start: null,
      repository_action_trace_fingerprint:
        input.successor.episode.repository_action_trace_fingerprint,
    });
  const missingEpisode = buildAlternateEpisode(
    missingObservation,
    missingReceipt,
  );
  assert.equal(
    missingEpisode.evidence_ladder.find(
      (row) => row.stage === "presented_before_first_meaningful_action",
    )?.status,
    "unknown",
  );
  assert.equal(missingEpisode.evaluation.resources.provider_calls.value, null);
  assert.equal(missingEpisode.evaluation.resources.model_calls.value, null);
  assert.equal(
    missingEpisode.evaluation.resources.external_network_calls.value,
    null,
  );

  const testRef = (kind: string) =>
    createCommissionedWorkRecordRefV01({
      record_version: "commissioned_work_structural_resource_ref.v0.1",
      record_id: `${kind}:test-only`,
      record_fingerprint: createProtocolSha256V01(`cw1-${kind}-test-only`),
    });
  const resourceObservationRef = testRef("resource-observation");
  const liveAuthorizationRef = testRef("authorization");
  const positiveResourceInput = {
    ...baseInput,
    execution_evidence_class:
      COMMISSIONED_WORK_COMMISSIONED_AGENT_OBSERVATION_EVIDENCE_CLASS_V01,
    resources: {
      ...baseInput.resources,
      provider_calls: { provenance: "observed", value: 1 },
      model_calls: { provenance: "observed", value: 1 },
      external_network_calls: { provenance: "observed", value: 1 },
    },
    resource_binding: {
      provider_calls_observation_ref: resourceObservationRef,
      model_calls_observation_ref: resourceObservationRef,
      external_network_calls_observation_ref: resourceObservationRef,
      live_authorization_ref: liveAuthorizationRef,
      authorization_resource_ceiling:
        createCommissionedWorkAuthorizationResourceCeilingV01({
          live_authorization_ref: liveAuthorizationRef,
          provider_call_limit: 1,
          model_call_limit: 1,
          external_network_call_limit: 1,
        }),
      provider_ref: testRef("provider"),
      model_ref: testRef("model"),
      route_ref: testRef("route"),
      network_destination_ref: testRef("destination"),
    },
  } as const satisfies BuildCommissionedWorkCommissionedAgentExecutionObservationInputV01;
  const positiveResourceObservation =
    buildCommissionedWorkCommissionedAgentExecutionObservationV01(
      positiveResourceInput,
    );
  const positiveResourceReceipt = buildCommissionedWorkRunReceiptV01({
    request: input.successor.request,
    packet: input.successor.packet,
    result: input.successor.result,
    observation: input.successor.objective_observation,
    execution_observation: positiveResourceObservation,
  });
  const positiveResourceEpisode = buildAlternateEpisode(
    positiveResourceObservation,
    positiveResourceReceipt,
  );
  assert.equal(positiveResourceEpisode.evaluation.resources.model_calls.value, 1);
  assert.equal(positiveResourceEpisode.evaluation.authority_violation, false);
  assert.equal(
    positiveResourceEpisode.evidence_ladder.find(
      (row) => row.stage === "behaviorally_conditioned",
    )?.status,
    "unknown",
  );
  assert.throws(
    () =>
      buildCommissionedWorkCommissionedAgentExecutionObservationV01({
        ...positiveResourceInput,
        resource_binding: {
          ...positiveResourceInput.resource_binding,
          authorization_resource_ceiling: null,
        },
      }),
    /commissioned_work_authorization_resource_ceiling_missing/u,
  );
  assert.throws(
    () =>
      buildCommissionedWorkCommissionedAgentExecutionObservationV01({
        ...positiveResourceInput,
        resource_binding: {
          ...positiveResourceInput.resource_binding,
          authorization_resource_ceiling: {
            ...positiveResourceInput.resource_binding
              .authorization_resource_ceiling,
            model_call_limit: 2,
          },
        },
      }),
    /commissioned_work_authorization_resource_ceiling_invalid/u,
  );
  assert.throws(
    () =>
      buildCommissionedWorkCommissionedAgentExecutionObservationV01({
        ...positiveResourceInput,
        resources: {
          ...positiveResourceInput.resources,
          provider_calls: { provenance: "observed", value: 2 },
        },
      }),
    /commissioned_work_authorization_resource_ceiling_invalid/u,
  );
  assert.throws(
    () =>
      buildCommissionedWorkCommissionedAgentExecutionObservationV01({
        ...positiveResourceInput,
        resource_binding: {
          ...positiveResourceInput.resource_binding,
          model_ref: null,
        },
      }),
    /commissioned_work_execution_resource_identity_missing/u,
  );
  assert.throws(
    () =>
      buildCommissionedWorkCommissionedAgentExecutionObservationV01({
        ...baseInput,
        resources: {
          ...baseInput.resources,
          external_network_calls: { provenance: "observed", value: 0 },
        },
      }),
    /commissioned_work_execution_resource_source_invalid/u,
  );
  assert.throws(
    () =>
      buildCommissionedWorkCommissionedAgentExecutionObservationV01({
        ...baseInput,
        resources: {
          ...baseInput.resources,
          model_usage_units: {
            provenance: "unknown",
            value: 0,
          } as never,
        },
      }),
    /commissioned_work_resource_unknown_or_value_invalid/u,
  );
  assert.throws(
    () =>
      buildCommissionedWorkCommissionedAgentExecutionObservationV01({
        ...baseInput,
        unauthorized_effects: {
          ...baseInput.unauthorized_effects,
          github_writes: 1 as 0,
        },
      }),
    /commissioned_work_execution_unauthorized_effect/u,
  );
}

function assertChildNetworkGuardV01(
  roots: ReturnType<typeof createDisposableRootsV01>,
): void {
  if (hermeticProcessEnvironmentV01 === null) {
    throw new Error("commissioned_workbench_hermetic_environment_missing");
  }
  const probePath = path.join(roots.runtime, "network-refusal-probe.mjs");
  writeFileSync(
    probePath,
    'await fetch("https://example.invalid/cw1-network-refusal-probe");\n',
    { encoding: "utf8", mode: 0o600 },
  );
  const before = existsSync(roots.network_attempt_log)
    ? readFileSync(roots.network_attempt_log, "utf8")
    : "";
  ownedSynchronousProcessesV01 += 1;
  try {
    assert.throws(
      () =>
        execFileSync(
          process.execPath,
          ["--import", roots.oracle_guard_path, probePath],
          {
            cwd: roots.runtime,
            env: hermeticProcessEnvironmentV01!,
            stdio: "ignore",
            timeout: 5_000,
          },
        ),
    );
  } finally {
    ownedSynchronousProcessesV01 -= 1;
  }
  const after = readFileSync(roots.network_attempt_log, "utf8");
  assert.equal(after.slice(before.length).trim().split("\n").length, 1);
  assert.match(after.slice(before.length), /fetch/u);
}

function negativeObservationInputV01(
  manifest: ReturnType<typeof buildCommissionedWorkFamilyManifestV01>,
  commitment: CommissionedWorkCaseCommitmentV01,
): BuildCommissionedWorkObjectiveObservationInputV01 {
  return {
    case_commitment: commitment,
    evaluator_version: manifest.evaluator_version,
    evaluator_role: manifest.outcome_evaluator,
    workspace_id: manifest.workspace_id,
    project_id: commitment.project_id,
    case_id: commitment.case_id,
    episode_role: "successor",
    condition: "exact_current_continuity",
    holdout_variant: null,
    run_ref_fingerprint: createProtocolSha256V01("negative-observation-run"),
    oracle_executed: false,
    repository_state_fingerprint: createProtocolSha256V01(
      "negative-observation-repository-state",
    ),
    current_source_fingerprint: commitment.expected_current_source_fingerprint,
    changed_path_fingerprints: [],
    required_checks: commitment.required_check_ids.map((check_id) => ({
      check_id,
      disposition: "unknown",
      command_fingerprint: null,
      exit_code: null,
    })),
    repository_diff_correctness: "unknown",
    verification_completeness: "unknown",
    negative_space: {
      status: "unknown",
      violated_guard_fingerprints: [],
      guard_observations: commitment.negative_space_guard_refs.map((guard_ref) => ({
        guard_ref,
        status: "unknown",
      })),
    },
    source_currentness: "unknown",
    project_scope: "exact",
    unauthorized_effects: zeroUnauthorizedEffectsForTestV01(),
  };
}

function findCommitmentV01(
  manifest: ReturnType<typeof buildCommissionedWorkFamilyManifestV01>,
  caseId: string,
): CommissionedWorkCaseCommitmentV01 {
  const commitment = [
    ...manifest.training_cases,
    manifest.holdout_case,
  ].find((item) => item.case_id === caseId);
  assert.ok(commitment);
  return commitment;
}

function requireSyntheticFixtureOutputV01(
  outputs: CommissionedWorkSyntheticFixtureOutputV01[],
  executorRoleId: string,
): CommissionedWorkSyntheticFixtureOutputV01 {
  const matches = outputs.filter(
    (output) => output.executor_role_id === executorRoleId,
  );
  assert.equal(matches.length, 1);
  return structuredClone(matches[0]!);
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

function resealV01(
  value: { integrity: ReturnType<typeof createCommissionedWorkIntegrityV01> },
  scope: string,
): void {
  const record = value as typeof value & Record<string, unknown>;
  const { integrity: _prior, ...withoutIntegrity } = record;
  value.integrity = createCommissionedWorkIntegrityV01(
    withoutIntegrity,
    scope,
  );
}

function writeRepositoryFileV01(
  root: string,
  repositoryRelativePath: string,
  content: string,
): void {
  const target = path.join(root, repositoryRelativePath);
  const relative = path.relative(root, target);
  assert.ok(
    relative !== ".." &&
      !relative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relative),
  );
  mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 });
  writeFileSync(target, content, { encoding: "utf8", mode: 0o600 });
}

function runOracleProcessV01(input: {
  repository_root: string;
  oracle_relative_path: string;
  oracle_guard_path: string;
  network_attempt_log: string;
}): void {
  if (hermeticProcessEnvironmentV01 === null) {
    throw new Error("commissioned_workbench_hermetic_environment_missing");
  }
  const networkLogBefore = existsSync(input.network_attempt_log)
    ? readFileSync(input.network_attempt_log, "utf8")
    : "";
  ownedSynchronousProcessesV01 += 1;
  try {
    execFileSync(
      process.execPath,
      ["--import", input.oracle_guard_path, input.oracle_relative_path],
      {
        cwd: input.repository_root,
        env: hermeticProcessEnvironmentV01,
        stdio: "ignore",
        timeout: 5_000,
      },
    );
  } finally {
    ownedSynchronousProcessesV01 -= 1;
    const networkLogAfter = existsSync(input.network_attempt_log)
      ? readFileSync(input.network_attempt_log, "utf8")
      : "";
    if (networkLogAfter !== networkLogBefore) {
      throw new Error("commissioned_workbench_oracle_network_attempt_refused");
    }
  }
}

function gitV01(
  root: string,
  args: string[],
  timestamp?: string,
): string {
  if (hermeticProcessEnvironmentV01 === null) {
    throw new Error("commissioned_workbench_hermetic_environment_missing");
  }
  const environment = timestamp
    ? {
        ...hermeticProcessEnvironmentV01,
        GIT_AUTHOR_DATE: timestamp,
        GIT_COMMITTER_DATE: timestamp,
      }
    : hermeticProcessEnvironmentV01;
  ownedSynchronousProcessesV01 += 1;
  try {
    return execFileSync("git", args, {
      cwd: root,
      env: environment,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 10_000,
    }).trim();
  } finally {
    ownedSynchronousProcessesV01 -= 1;
  }
}

function timestampForV01(caseIndex: number, phaseIndex: number): string {
  const base =
    caseIndex === 3
      ? Date.parse("2026-08-27T04:05:00.000Z")
      : Date.parse("2026-08-27T01:10:00.000Z") + caseIndex * 20 * 60_000;
  return new Date(base + phaseIndex * 10_000).toISOString();
}

function addSecondsV01(timestamp: string, seconds: number): string {
  return new Date(Date.parse(timestamp) + seconds * 1_000).toISOString();
}
