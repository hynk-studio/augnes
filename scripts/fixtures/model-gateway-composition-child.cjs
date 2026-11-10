// Fresh-process, behavioral dependency guard: generic owners run with every
// production method implementation unavailable. The same guard then detects
// actual forbidden imports as positive controls.
const assert = require("node:assert/strict");
const { mkdtempSync, readFileSync, rmSync } = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const { tmpdir } = require("node:os");
const { channel } = require("node:diagnostics_channel");
const root = path.resolve(__dirname, "../..");
const ownedRoot = mkdtempSync(path.join(tmpdir(), "augnes-composition-"));
const databasePath = path.join(ownedRoot, "composition.db");
const forbidden = filename => {
  const relative = path.relative(root, filename).split(path.sep).join("/");
  return /(?:^|\/)model-gateway\/(?:model-gateway|method-bindings|method-routes)\.ts$/.test(relative) ||
    /(?:^|\/)model-gateway\/openai\/(?:responses-adapter|responses-method-bindings|.+-codec)\.ts$/.test(relative);
};
const blocked = [];
const originalLoad = Module._load;
const originalFetch = globalThis.fetch;
let networkCalls = 0;
const requestChannel = channel("undici:request:create");
const observeRequest = () => { networkCalls += 1; };
requestChannel.subscribe(observeRequest);
globalThis.fetch = async () => { networkCalls += 1; throw new Error("composition_test_forbids_network"); };
Module._load = function (id, parent, ...args) {
  const resolved = Module._resolveFilename(id, parent);
  if (forbidden(resolved)) {
    blocked.push(path.relative(root, resolved));
    throw new Error("generic_owner_loaded_method_implementation");
  }
  return originalLoad.call(this, id, parent, ...args);
};
async function main() {
  try {
    const core = require(path.join(root, "lib/vnext/model-gateway/invocation-core.ts"));
    const transport = require(path.join(root, "lib/vnext/model-gateway/openai/responses-transport.ts"));
    const contracts = require(path.join(root, "lib/vnext/model-gateway/contracts.ts"));
    const { validateModelInvocationReceiptV02 } = require(path.join(root, "lib/vnext/model-gateway/model-invocation-receipt.ts"));
    const identity = require(path.join(root, "lib/vnext/persistence/project-identity-registry.ts"));
    const { selectActiveProjectV01 } = require(path.join(root, "lib/vnext/persistence/project-lifecycle-registry.ts"));
    const Database = require("better-sqlite3");
    const db = new Database(databasePath);
    db.exec(readFileSync(path.join(root, "lib/db/schema.sql"), "utf8"));
    const now = "2026-10-29T00:00:00.000Z";
    const workspace = identity.getOrCreateDefaultWorkspaceIdentityV01(db, { create_uuid: () => "11111111-1111-4111-8111-111111111111", now: () => now });
    const project = identity.getOrCreateCanonicalProjectForLocalRootV01(db, { workspace_id: workspace.workspace_id, local_root: identity.normalizeLocalProjectRootRefV01(ownedRoot, { base_path: "/" }), display_name: "composition" }, { create_uuid: () => "22222222-2222-4222-8222-222222222222", now: () => now });
    const active = selectActiveProjectV01(db, { workspace_id: workspace.workspace_id, project_id: project.project.project_id, now, expected_project_id: null, expected_revision: null });
    db.close();
    const purpose = contracts.OBSERVE_MODEL_GATEWAY_PURPOSE_V01;
    const implementation = { implementation_id: "synthetic.composition", implementation_version: "synthetic.v0.1" };
    let transports = 0, parsers = 0, validators = 0;
    const method = Object.freeze({
      implementation, capture_provider_rejection: false, require_response_status: false, retain_reported_usage_on_refusal: false,
      model_configuration() { return {}; }, client_request_id() { return null; }, parse_failure_stage() { return "response_other_invalid"; },
      codec(input) {
        assert.equal(input.input_kind, purpose);
        return { dynamic_material: { synthetic_fixture: input.message }, dynamic_bytes: 512, final_request_bytes: 4096, response_bytes: 1024, system_prompt: "Synthetic test binding only.", schema_name: "synthetic_test", schema: { type: "object", properties: { ok: { type: "boolean" } }, required: ["ok"], additionalProperties: false },
          parse(text, usage) { parsers += 1; assert.deepEqual(JSON.parse(text), { ok: true }); return { purpose, proposals: [], usage }; } };
      },
    });
    const adapter = transport.createBoundOpenAIResponsesAdapterV01(candidate => { assert.equal(candidate, purpose); return method; }, {
      environment: { OPENAI_API_KEY: "synthetic-composition-never-returned", OPENAI_MODEL: "synthetic-test" },
      transport: async request => {
        transports += 1;
        const body = JSON.parse(request.body);
        assert.equal(body.store, false);
        assert.deepEqual(JSON.parse(body.input[1].content[0].text), { synthetic_fixture: "fixture" });
        assert.equal(body.text.format.name, "synthetic_test");
        return { ok: true, status: 200, async json() { return { output_text: '{"ok":true}', usage: { input_tokens: 8, output_tokens: 2, total_tokens: 10 } }; } };
      },
    });
    const binding = Object.freeze({ purpose, maximum_input_bytes: 4096, maximum_output_tokens: 128, maximum_timeout_ms: 1000, requires_request_trace: false, cost_budget: "forbidden", provider_unavailable_fallback: false, deterministic_implementation: implementation,
      complete_envelope(common, input) { validators += 1; assert.deepEqual(input, { input_kind: purpose, message: "fixture", current_state: [] }); return { ...common, purpose, input }; },
      cost_input_matches() { return true; }, local_identity() { return undefined; }, fingerprinted_output() { return null; },
    });
    const envelope = { envelope_version: contracts.MODEL_INVOCATION_ENVELOPE_VERSION_V01, invocation_id: "synthetic-seam-test", workspace_id: workspace.workspace_id, project_id: project.project.project_id, purpose, data_classification: "public_safe", provenance_refs: ["test:synthetic-seam"], privacy: { provider_egress: "allow", retention_class: "none" }, budget: { max_input_bytes: 4096, max_output_tokens: 128, max_provider_calls: 1 }, timeout_ms: 1000, cancellation: { signal: new AbortController().signal }, execution_mode: "live", policy: { invocation_origin: "interactive", expected_active_project_id: project.project.project_id, expected_active_selection_revision: active.selection_revision }, input: { input_kind: purpose, message: "fixture", current_state: [] } };
    const dependencies = { adapter, open_database: () => new Database(databasePath), read_root_availability: async () => "available", now: () => new Date(now), deterministic_execute: () => ({ purpose, proposals: [] }), provider_failure_fallback: false };
    const resolver = candidate => { assert.equal(candidate, purpose); return binding; };
    const result = await core.invokeModelGatewayCoreV01(envelope, dependencies, resolver);
    validateModelInvocationReceiptV02(result.model_invocation_receipt);
    assert.equal(result.model_invocation_receipt.outcome, "live_success");
    assert.equal(result.model_invocation_receipt.final_implementation_id, implementation.implementation_id);
    assert.equal(transports, 1); assert.equal(parsers, 1); assert.equal(validators, 1);
    await assert.rejects(() => core.invokeModelGatewayCoreV01({ ...envelope, budget: { ...envelope.budget, max_input_bytes: 4097 } }, dependencies, resolver), error => error.code === "model_gateway_invalid_envelope");
    await assert.rejects(() => core.invokeModelGatewayCoreV01({ ...envelope, purpose: "synthetic_new_purpose" }, dependencies, resolver), error => error.code === "model_gateway_invalid_envelope");
    await assert.rejects(() => core.invokeModelGatewayCoreV01({ ...envelope, cancellation: { signal: AbortSignal.abort() } }, dependencies, resolver), error => error.code === "model_gateway_cancelled");
    assert.equal(transports, 1);
    assert.deepEqual(blocked, []);
    assert.deepEqual(Object.keys(require.cache).filter(forbidden), []);
    for (const file of ["lib/vnext/model-gateway/method-bindings.ts", "lib/vnext/model-gateway/openai/responses-method-bindings.ts", "lib/vnext/model-gateway/openai/observe-codec.ts"]) {
      assert.throws(() => require(path.join(root, file)), /generic_owner_loaded_method_implementation/);
    }
    assert.equal(blocked.length, 3); assert.equal(networkCalls, 0);
    process.stdout.write(`${JSON.stringify({ entry: "codec_composition", status: "pass", production_purpose_added: false, generic_method_implementation_loads: 0, blocked_controls: blocked.length, synthetic_transport_calls: transports, synthetic_parser_calls: parsers, shared_budget_refused: true, shared_cancellation_refused: true, unknown_purpose_refused: true, network_calls: networkCalls })}\n`);
  } finally {
    Module._load = originalLoad; globalThis.fetch = originalFetch; requestChannel.unsubscribe(observeRequest);
    rmSync(ownedRoot, { recursive: true, force: true });
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
