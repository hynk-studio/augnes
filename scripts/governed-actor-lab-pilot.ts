import path from "node:path";

import {
  governedActorLabDevelopmentSourcesFixture,
  governedActorLabHoldoutFixture,
  governedActorLabManifestFixture,
} from "@/fixtures/vnext/protocol/governed-actor-lab-v0-1";
import { writeGovernedActorLabPilotArtifactsV01 } from "@/lib/vnext/governed-actor-lab-artifact-store";
import { runGovernedActorLabPilotV01 } from "@/lib/vnext/governed-actor-lab";

const options = parseArgumentsV01(process.argv.slice(2));
const result = runGovernedActorLabPilotV01({
  manifest: governedActorLabManifestFixture,
  development_sources: governedActorLabDevelopmentSourcesFixture,
  hidden_holdout: governedActorLabHoldoutFixture,
});
const artifacts = writeGovernedActorLabPilotArtifactsV01({
  repository_root: options.repositoryRoot,
  run_label: options.runLabel,
  result,
});

process.stdout.write(
  `${JSON.stringify(
    {
      suite: "governed-actor-lab-pilot-v0.1",
      status: "passed",
      experiment_id: result.manifest.experiment_id,
      experiment_fingerprint: result.manifest.integrity.fingerprint,
      report_id: result.report.report_id,
      report_fingerprint: result.report.integrity.fingerprint,
      generations: result.generations.map((entry) => ({
        generation: entry.generation,
        actor_ids: entry.actors_at_episode_start.map((actor) => actor.lab_actor_id),
        start_memory_snapshot_fingerprints: entry.memories_at_episode_start.map(
          (memory) => memory.integrity.fingerprint,
        ),
        post_episode_memory_snapshot_fingerprints: entry.post_episode_memories.map(
          (memory) => memory.integrity.fingerprint,
        ),
      })),
      memory_operations: result.episodes.flatMap((episode) =>
        episode.memory_admissions.map((admission) => admission.operation),
      ),
      baseline_arms: result.report.baselines.map((baseline) => baseline.arm),
      baseline_observations: result.report.baselines.map((baseline) => ({
        arm: baseline.arm,
        observation_id: baseline.observation_id,
        holdout: baseline.outcome.holdout,
        support_validated_claims: baseline.outcome.verification.support_validated_claims,
        harmful_transfer_candidates: baseline.outcome.harm.harmful_transfer_candidates,
        review_operations: baseline.outcome.burden.review_operations,
        support_status: "supported_executed",
        actor_hard_gate_failure_count:
          baseline.execution.arm_hard_gate.actor_hard_gate_failure_count,
        population_selection_exclusion_count:
          baseline.execution.arm_hard_gate.population_selection_exclusion_count,
        arm_completed: baseline.execution.arm_hard_gate.arm_completed,
        arm_level_hard_gate_failure:
          baseline.execution.arm_hard_gate.arm_level_hard_gate_failure,
        arm_level_hard_gate_failure_codes:
          baseline.execution.arm_hard_gate.arm_level_hard_gate_failure_codes,
        comparable: baseline.comparable,
        observed_compute: baseline.execution.compute_accounting,
        curated_input_id: baseline.execution.curated_input?.curated_input_id ?? null,
      })),
      non_dominated_arms: result.report.non_dominance.non_dominated_arms,
      dominated_relations: result.report.non_dominance.dominated_relations,
      tradeoff_pairs: result.report.non_dominance.tradeoff_pairs,
      persistence_benefit_candidate: result.report.persistence_benefit_candidate,
      evolution_benefit_candidate: result.report.evolution_benefit_candidate,
      promotion_candidates: result.report.promotion_candidates.length,
      product_effects: result.report.product_effects,
      mechanics_substrate_proof_only: result.report.mechanics_proof_only,
      run_root: artifacts.relative_run_root,
      artifact_count: artifacts.artifact_count,
      artifact_index_fingerprint: artifacts.artifact_index_fingerprint,
    },
    null,
    2,
  )}\n`,
);

function parseArgumentsV01(argumentsInput: string[]): {
  repositoryRoot: string;
  runLabel: string;
} {
  let repositoryRoot = process.cwd();
  let runLabel: string | null = null;
  for (let index = 0; index < argumentsInput.length; index += 1) {
    const argument = argumentsInput[index];
    if (argument === "--repository-root") {
      const value = argumentsInput[index + 1];
      if (!value) throw new Error("actor_lab_repository_root_argument_missing");
      repositoryRoot = path.resolve(value);
      index += 1;
      continue;
    }
    if (argument === "--run-label") {
      const value = argumentsInput[index + 1];
      if (!value) throw new Error("actor_lab_run_label_argument_missing");
      runLabel = value;
      index += 1;
      continue;
    }
    throw new Error(`actor_lab_unknown_argument:${argument}`);
  }
  if (runLabel === null) throw new Error("actor_lab_run_label_required");
  return { repositoryRoot, runLabel };
}
