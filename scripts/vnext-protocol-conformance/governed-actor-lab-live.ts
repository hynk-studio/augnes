import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import { governedActorLabLiveCasebookFixture } from "@/fixtures/vnext/protocol/governed-actor-lab-live-v0-1";
import { buildGovernedActorLabLiveCallPlanV01 } from "@/lib/vnext/governed-actor-lab-live";

export function runGovernedActorLabLiveConformanceV01() {
  const plan = buildGovernedActorLabLiveCallPlanV01(
    structuredClone(governedActorLabLiveCasebookFixture),
  );
  assert.equal(plan.planned_calls, 140);
  assert.equal(plan.entries.length, 140);
  assert.equal(plan.retries, 0);
  assert.equal(plan.max_parallel_provider_calls, 1);
  assert.equal(plan.aggregate_provider_call_ceiling, 140);
  assert.equal(
    plan.entries.filter((entry) => entry.generation === "holdout").length,
    20,
  );
  assert.ok(
    plan.entries
      .filter((entry) => entry.generation === "holdout")
      .every((entry) => entry.phase === "holdout_blind" && entry.peer_slot === null),
  );
  assert.equal(
    plan.entries.filter((entry) => entry.phase === "challenge_synthesis").length,
    60,
  );
  const liveSource = sourceV01("lib/vnext/governed-actor-lab-live.ts");
  const codecSource = sourceV01(
    "lib/vnext/model-gateway/openai/governed-actor-lab-codec.ts",
  );
  const adapterSource = sourceV01(
    "lib/vnext/model-gateway/openai/responses-adapter.ts",
  );
  const typesSource = sourceV01("types/vnext/governed-actor-lab-live.ts");
  const runnerSource = sourceV01("scripts/governed-actor-lab-live-cohort.ts");
  assert.ok(!liveSource.includes("fetch("), "the Lab must not own provider transport");
  assert.ok(!liveSource.includes("openDatabase"), "the Lab must not directly read the product database");
  assert.ok(!liveSource.includes("process.env"), "the Lab must not inspect credentials or provider configuration");
  assert.ok(
    liveSource.includes("invokeGovernedActorLabModelGatewayV01"),
    "every live invocation must pass through the existing Model Gateway",
  );
  assert.ok(
    adapterSource.includes("sendOpenAIResponsesRequest") &&
      adapterSource.includes("return fetch(request.url"),
    "the existing OpenAI Responses adapter remains the provider-network owner",
  );
  assert.ok(!codecSource.includes("chain_of_thought"));
  assert.ok(!typesSource.includes("chain_of_thought"));
  assert.ok(!liveSource.includes(".includes(claim.claim_token)"));
  assert.ok(liveSource.includes("referenced_memory_tokens"));
  assert.ok(liveSource.includes("not_attempted_arm_terminal"));
  assert.ok(liveSource.includes("on_binding_finalized"));
  assert.ok(typesSource.includes("authorized_replacement_after_historical_incomplete"));
  assert.ok(typesSource.includes("holdout_selection_disqualifying_output"));
  assert.ok(liveSource.includes("hard_gate_non_compensation"));
  assert.ok(runnerSource.includes("--confirm-authorized-cohort"));
  assert.ok(runnerSource.includes("live_cohort_first_cohort_confirmation_retired"));
  assert.ok(!runnerSource.includes(["", "Users", "hynk", "code", "augnes-temp"].join("/")));
  assert.ok(typesSource.includes("raw_prompt_persisted: false"));
  assert.ok(typesSource.includes("raw_response_persisted: false"));
  assert.ok(typesSource.includes("hidden_reasoning_persisted: false"));
  assert.equal(governedActorLabLiveCasebookFixture.source_material, "synthetic_public_safe");
  assert.equal(governedActorLabLiveCasebookFixture.real_user_or_project_data_included, false);
  assert.equal(
    governedActorLabLiveCasebookFixture.hidden_holdout.evaluator_answers_provider_visible,
    false,
  );
  return {
    status: "governed_actor_lab_live_conformance_passed" as const,
    planned_calls: plan.planned_calls,
    live_arms: 5,
    development_episodes: 3,
    slots: 4,
    holdout_slots_per_arm: 4,
    provider_clients_owned_by_lab: 0,
    product_database_dependencies_owned_by_lab: 0,
  };
}

function sourceV01(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}
