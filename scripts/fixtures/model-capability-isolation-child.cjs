// A fresh process observes real transitive loads before any product import.
const assert = require("node:assert/strict");
const { channel } = require("node:diagnostics_channel");
const { existsSync } = require("node:fs");
const Module = require("node:module");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");
const entries = {
  local_capability: "lib/vnext/model-gateway/local-capability.ts",
  project_home: "lib/vnext/project-home/project-home-projection.ts",
  pc5_capability: "lib/vnext/guide-brief/guide-brief-pc5-capability-source.ts",
  review_material: "lib/vnext/runtime/operator-pilot-review-material.ts",
  semantic_review: "app/api/vnext/operator/semantic-review/route.ts",
};
const entry = process.argv[2];
assert(Object.hasOwn(entries, entry), "known capability entry required");

function invocationOrResearch(filename) {
  const relative = path.relative(root, filename).split(path.sep).join("/");
  return /^(?:lib\/vnext\/model-gateway\/(?:invocation-core|method-bindings|method-routes)|lib\/vnext\/model-gateway\/openai\/(?:responses-transport|responses-method-bindings))\.ts$/.test(relative) ||
    relative === "lib/vnext/model-gateway/model-gateway.ts" ||
    relative === "lib/vnext/model-gateway/openai/responses-adapter.ts" ||
    relative.startsWith("fixtures/vnext/research/") ||
    /^(?:lib|types)\/vnext\/(?:model-gateway\/openai\/)?(?:operational-reentry|governed-actor-lab)/.test(relative);
}

const originalLoad = Module._load;
const originalFetch = globalThis.fetch;
const blockedLoads = [];
let networkCalls = 0;
const requestChannel = channel("undici:request:create");
const observeRequest = () => { networkCalls += 1; };
requestChannel.subscribe(observeRequest);
globalThis.fetch = () => {
  networkCalls += 1;
  throw new Error("capability_read_must_not_fetch");
};
Module._load = function (id, parent, ...args) {
  const resolved = Module._resolveFilename(id, parent);
  if (invocationOrResearch(resolved)) {
    blockedLoads.push(path.relative(root, resolved));
    throw new Error("capability_read_loaded_invocation_or_research");
  }
  return originalLoad.call(this, id, parent, ...args);
};

async function main() {
  try {
    const loadedEntry = require(path.join(root, entries[entry]));
    const local = require(path.join(root, entries.local_capability));
    const provider = require(path.join(root, "lib/vnext/model-gateway/openai/local-configuration.ts"));
    const summaries = {
      unavailable: "No local OpenAI credential is configured. Deterministic model behavior remains available.",
      action_required: "Local OpenAI model configuration is present, but a credential is required. Provider access was not contacted or verified.",
      misconfigured: "Local OpenAI model configuration is malformed. Provider access was not contacted or verified.",
      available: "Local OpenAI configuration is present and syntactically valid. Provider access was not contacted or verified.",
    };
    const sentinel = "synthetic-capability-credential-never-returned";
    const cases = [
      [{}, "unavailable"],
      [{ OPENAI_API_KEY: " \t", OPENAI_MODEL: " \t" }, "unavailable"],
      [{ OPENAI_MODEL: "model-only" }, "action_required"],
      [{ OPENAI_API_KEY: sentinel }, "available"],
      [{ OPENAI_API_KEY: ` ${sentinel} `, OPENAI_MODEL: " model-a_1:2026.10 " }, "available"],
      [{ OPENAI_MODEL: "invalid model" }, "misconfigured"],
      [{ OPENAI_API_KEY: sentinel, OPENAI_MODEL: "invalid/model" }, "misconfigured"],
      [{ OPENAI_MODEL: "모델" }, "misconfigured"],
      [{ OPENAI_MODEL: "-model" }, "misconfigured"],
      [{ OPENAI_MODEL: "a".repeat(128) }, "action_required"],
      [{ OPENAI_MODEL: "a".repeat(129) }, "misconfigured"],
    ];
    for (const [environment, status] of cases) {
      delete process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_MODEL;
      Object.assign(process.env, environment);
      const expected = { status, summary: summaries[status], verification: "trusted_local_status" };
      assert.deepEqual(provider.readOpenAILocalCapabilityDiagnosticV01(environment), expected);
      assert.deepEqual(local.readDefaultModelGatewayLocalCapabilityV01(), expected);
      assert.equal(JSON.stringify(expected).includes(sentinel), false);
      if (entry === "project_home") {
        const home = await loadedEntry.readProjectHomeCapabilityStatusesV01();
        assert.deepEqual(home.items.find(item => item.capability === "openai"), {
          capability: "openai", ...expected,
        });
      }
    }

    const configuration = require(path.join(root, "lib/vnext/model-gateway/planner-execution-configuration.ts"));
    const model = { external_id: configuration.OPENAI_PLANNER_SOL_LOW.model,
      provider: "openai", source_ref: configuration.OPENAI_PLANNER_SOL_LOW_REF };
    assert.deepEqual(configuration.readPlannerModelGatewayExecutionConfigurationV01(model,
      { require_current_binding: true }), configuration.OPENAI_PLANNER_SOL_LOW);
    assert.equal(configuration.readPlannerModelGatewayExecutionConfigurationV01({ ...model, source_ref: undefined }), null);
    assert.equal(configuration.readPlannerModelGatewayExecutionConfigurationV01({ external_id: "historical-model" },
      { require_current_binding: true }), null);
    assert.throws(() => configuration.readPlannerModelGatewayExecutionConfigurationV01({ ...model, source_ref: "forged" },
      { require_current_binding: true }), error => error.name === "ModelGatewayInvocationErrorV01" &&
        error.message === "Model gateway invocation failed." &&
        error.code === "model_gateway_provider_response_invalid" &&
        ["receipt", "provider_rejection_observation", "provider_response_invalid_observation",
          "received_result", "transport_failure_observation"].every(key => error[key] === null));
    const copy = configuration.readPlannerModelGatewayExecutionConfigurationV01(model);
    copy.reasoning.effort = "changed-only-in-copy";
    assert.equal(configuration.readPlannerModelGatewayExecutionConfigurationV01(model).reasoning.effort, "low");

    assert.deepEqual(blockedLoads, [], "ordinary entry attempted a forbidden transitive load");
    assert.deepEqual(Object.keys(require.cache).filter(invocationOrResearch), []);
    assert.equal(networkCalls, 0);
    assert(process.env.AUGNES_DB_PATH, "parent-owned unused database path required");
    assert.equal(existsSync(process.env.AUGNES_DB_PATH), false, "capability reads must not open a database");
    const loadedProjectModules = Object.keys(require.cache).filter(file => file.startsWith(`${root}${path.sep}`) &&
      !file.includes(`${path.sep}node_modules${path.sep}`)).length;

    // The same guard must reject both the old gateway and an actual research fixture.
    assert.throws(() => require(path.join(root, "lib/vnext/model-gateway/model-gateway.ts")),
      /capability_read_loaded_invocation_or_research/);
    assert.throws(() => require(path.join(root, "fixtures/vnext/research/operational-reentry-matched-cohort-v0-2.ts")),
      /capability_read_loaded_invocation_or_research/);
    assert.equal(blockedLoads.length, 2);
    Module._load = originalLoad;

    // Compatibility exports still select the identical implementations. This
    // separate control deliberately loads the invocation stack after the read check.
    if (entry === "local_capability") {
      const gateway = require(path.join(root, "lib/vnext/model-gateway/model-gateway.ts"));
      const adapter = require(path.join(root, "lib/vnext/model-gateway/openai/responses-adapter.ts"));
      assert.equal(gateway.readDefaultModelGatewayLocalCapabilityV01, local.readDefaultModelGatewayLocalCapabilityV01);
      assert.equal(adapter.readOpenAILocalCapabilityDiagnosticV01, provider.readOpenAILocalCapabilityDiagnosticV01);
      assert.equal(gateway.readPlannerModelGatewayExecutionConfigurationV01, configuration.readPlannerModelGatewayExecutionConfigurationV01);
      assert(Object.keys(require.cache).some(file => file.includes(`${path.sep}fixtures${path.sep}vnext${path.sep}research${path.sep}`)),
        "legacy control must observe the actual research graph");
    }
    assert.equal(networkCalls, 0);
    process.stdout.write(`${JSON.stringify({ entry, status: "pass", diagnostic_cases: cases.length,
      ordinary_invocation_or_research_loads: 0, blocked_controls: blockedLoads.length,
      loaded_project_modules: loadedProjectModules, network_calls: networkCalls, database_opened: false,
      compatibility_exports_checked: entry === "local_capability" })}\n`);
  } finally {
    Module._load = originalLoad;
    globalThis.fetch = originalFetch;
    requestChannel.unsubscribe(observeRequest);
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
