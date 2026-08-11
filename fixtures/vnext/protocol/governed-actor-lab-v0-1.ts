import {
  buildGovernedActorLabManifestV01,
  type BuildGovernedActorLabManifestInputV01,
} from "@/lib/vnext/governed-actor-lab";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import { createStrategyCompositionCaseReferenceV01 } from "@/lib/vnext/strategy-composition-case";
import { strategyCompositionOrderedCaseFixture } from "@/fixtures/vnext/protocol/strategy-composition-comparison-v0-1";
import type {
  GovernedActorLabHoldoutFixtureV01,
  GovernedActorLabSyntheticSourceV01,
} from "@/types/vnext/governed-actor-lab";

const taskFamilyKey = "task-family:acgc3c1-synthetic-continuity-review";

function fingerprintV01(value: unknown): string {
  return createProtocolSha256V01(canonicalizeProtocolValueV01(value));
}

function sourceV01(index: number): GovernedActorLabSyntheticSourceV01 {
  const sourceId = `synthetic-case:acgc3c1-development-${index}`;
  return {
    source_id: sourceId,
    source_fingerprint: fingerprintV01({
      source_id: sourceId,
      task_family_key: taskFamilyKey,
      admitted_fact: `bounded-development-fact-${index}`,
      required_check: `deterministic-check-${index}`,
    }),
    task_family_key: taskFamilyKey,
    available_at: `2026-08-0${index}T00:00:00.000Z`,
    trust_class: "direct_local_observation",
  };
}

export const governedActorLabDevelopmentSourcesFixture = deepFreeze([
  sourceV01(1),
  sourceV01(2),
  sourceV01(3),
] as const);

const holdoutContent: GovernedActorLabHoldoutFixtureV01["content"] = {
  cases: [
    {
      case_id: "synthetic-holdout:verification",
      task_family_key: "task-family:acgc3c1-holdout-verification",
      required_policy_signal: "verification_first",
      harmful_transfer_trap: false,
    },
    {
      case_id: "synthetic-holdout:scope",
      task_family_key: "task-family:acgc3c1-holdout-scope",
      required_policy_signal: "scope_sentinel",
      harmful_transfer_trap: false,
    },
    {
      case_id: "synthetic-holdout:falsifier",
      task_family_key: "task-family:acgc3c1-holdout-falsifier",
      required_policy_signal: "counterexample_search",
      harmful_transfer_trap: true,
    },
    {
      case_id: "synthetic-holdout:synthesis",
      task_family_key: "task-family:acgc3c1-holdout-synthesis",
      required_policy_signal: "bounded_synthesis",
      harmful_transfer_trap: false,
    },
  ],
};

export const governedActorLabHoldoutFixture = deepFreeze({
  holdout_id: "hidden-holdout:acgc3c1-v0-1",
  holdout_fingerprint: fingerprintV01(holdoutContent),
  content: holdoutContent,
} satisfies GovernedActorLabHoldoutFixtureV01);

export const governedActorLabStrategyRecipeRefsFixture = deepFreeze([
  createStrategyCompositionCaseReferenceV01(strategyCompositionOrderedCaseFixture),
]);

export const governedActorLabManifestInputFixture = deepFreeze({
  workspace_id: "workspace:synthetic-acgc3c1",
  project_id: "project:synthetic-acgc3c1",
  case_family_key: taskFamilyKey,
  development_sources: [...governedActorLabDevelopmentSourcesFixture],
  decision_time_cutoff: "2026-08-04T00:00:00.000Z",
  hidden_holdout_id: governedActorLabHoldoutFixture.holdout_id,
  hidden_holdout_fingerprint: governedActorLabHoldoutFixture.holdout_fingerprint,
  evaluator: {
    version: "governed-actor-lab-evaluator.v0.1",
    fingerprint: fingerprintV01("governed-actor-lab-evaluator.v0.1"),
  },
  actor_engine: {
    version: "governed-actor-lab-deterministic-engine.v0.1",
    fingerprint: fingerprintV01("governed-actor-lab-deterministic-engine.v0.1"),
  },
  memory_policy: {
    version: "governed-actor-lab-memory-policy.v0.1",
    fingerprint: fingerprintV01("governed-actor-lab-memory-policy.v0.1"),
  },
  mutation_policy: {
    version: "governed-actor-lab-mutation-policy.v0.1",
    fingerprint: fingerprintV01("governed-actor-lab-mutation-policy.v0.1"),
  },
  deterministic_seed: "seed:acgc3c1:governed-actor-lab-v0-1",
  strategy_recipe_refs: [...governedActorLabStrategyRecipeRefsFixture],
  compute: {
    tool_read_limit: 4,
    step_limit: 16,
  },
} satisfies BuildGovernedActorLabManifestInputV01);

export const governedActorLabManifestFixture = deepFreeze(
  buildGovernedActorLabManifestV01(governedActorLabManifestInputFixture),
);

export function createGovernedActorLabManifestV01() {
  return buildGovernedActorLabManifestV01(
    structuredClone(governedActorLabManifestInputFixture),
  );
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
  }
  return value;
}
