import { OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V02 as V2_LIMITS } from "../lib/vnext/model-gateway/openai/operational-reentry-matched-cohort-v0-2-codec";
import { OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V03 as V3_LIMITS } from "../lib/vnext/model-gateway/openai/operational-reentry-matched-cohort-v0-3-codec";
import { OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V04 as V4_LIMITS } from "../lib/vnext/model-gateway/openai/operational-reentry-matched-cohort-v0-4-codec";
import { OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_MODEL_EGRESS_LIMITS_V01 as CROSS_LIMITS } from "../lib/vnext/model-gateway/openai/operational-reentry-stale-reset-cross-case-replication-v0-1-codec";
// The exact same fixture driver runs against baseline and candidate source.
// All transport is deterministic. Snapshots retain request bytes and complete
// normalized results/receipts; no fingerprint or identity fields are scrubbed.
import assert from "node:assert/strict";
import { channel } from "node:diagnostics_channel";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import * as gateway from "../lib/vnext/model-gateway/model-gateway";
import * as contracts from "../lib/vnext/model-gateway/contracts";
import { createOpenAIResponsesAdapterV01 } from "../lib/vnext/model-gateway/openai/responses-adapter";
import { validateModelInvocationReceiptV02 } from "../lib/vnext/model-gateway/model-invocation-receipt";
import { buildModelGatewayCostAuthorityV01, buildModelGatewayCostBudgetV01 } from "../lib/vnext/model-gateway/cost-authority";
import { canonicalizeProtocolValueV01, createProtocolSha256V01 } from "../lib/vnext/protocol-primitives";
import { getOrCreateCanonicalProjectForLocalRootV01, getOrCreateDefaultWorkspaceIdentityV01, normalizeLocalProjectRootRefV01 } from "../lib/vnext/persistence/project-identity-registry";
import { selectActiveProjectV01 } from "../lib/vnext/persistence/project-lifecycle-registry";
import { guideBriefInterpretationCandidateMeaningV01 } from "../lib/vnext/guide-brief/guide-brief-model-interpretation";
import { buildMockTemporalPreview } from "../lib/temporal-interpretation/mock";
import type { TemporalPreviewContext } from "../lib/temporal-interpretation/types";
import { strategicModelInputFixtureV01, strategicModelOutputFixtureV01 } from "./vnext-protocol-conformance/strategic-advantage-transfer";
import { governedActorLabLiveCasebookFixture } from "../fixtures/vnext/protocol/governed-actor-lab-live-v0-1";
import { buildOperationalReentryMatchedCohortCallPlanV01 } from "../lib/vnext/operational-reentry-matched-cohort";
import { buildOperationalReentryMatchedCohortModelInputV02, buildOperationalReentryMatchedCohortGoldenOutputV02 } from "../lib/vnext/operational-reentry-matched-cohort-v0-2";
import { buildOperationalReentryMatchedCohortModelInputV03, buildOperationalReentryMatchedCohortGoldenWireOutputV03 } from "../lib/vnext/operational-reentry-matched-cohort-v0-3";
import { buildOperationalReentryMatchedCohortInvocationV04, buildOperationalReentryMatchedCohortGoldenWireOutputV04 } from "../lib/vnext/operational-reentry-matched-cohort-v0-4";
import { buildOperationalReentryStaleResetCrossCaseInvocationV01 } from "../lib/vnext/operational-reentry-stale-reset-cross-case-replication";
import { OPERATIONAL_REENTRY_STALE_RESET_R1_CASE_ID_V01, OPERATIONAL_REENTRY_STALE_RESET_R2_CASE_ID_V01 } from "../fixtures/vnext/research/operational-reentry-stale-reset-cross-case-replication-v0-1";
import { buildOperationalReentryStaleResetCrossCaseMaximalWireOutputV01 } from "../lib/vnext/model-gateway/openai/operational-reentry-stale-reset-cross-case-replication-v0-1-codec";
import { createDeterministicModelProviderRequestTraceV01 } from "../lib/vnext/model-gateway/provider-rejection-observation";
import { differentSelectionRevision } from "./test-selection-observation";

const PROJECT = "project:22222222-2222-4222-8222-222222222222";
const WORKSPACE = "workspace:11111111-1111-4111-8111-111111111111";
const NOW = "2026-10-29T00:00:00.000Z";
const TOKEN = `c_${"a".repeat(32)}`;
const fingerprint = (value: unknown) => createProtocolSha256V01(canonicalizeProtocolValueV01(value));
type RecordValue = Record<string, any>; // Heterogeneous test fixtures only; production contracts stay closed.
interface Fixture { label: string; input: RecordValue; output: unknown; invoke: string; prepare?: string; routeKey?: string; limits: { bytes: number; tokens: number; timeout: number }; cost?: boolean; model?: string }
const root = mkdtempSync(path.join(tmpdir(), "augnes-codec-parity-"));
const databasePath = path.join(root, "parity.db");
const originalFetch = globalThis.fetch;
let realRequests = 0;
const requestChannel = channel("undici:request:create");
const observeRequest = () => { realRequests += 1; };
const snapshot: RecordValue = { version: "gateway_codec_parity.v0.1", fixtures: [] };
const g = gateway as unknown as Record<string, (...args: any[]) => any>;
void main().catch(error => { console.error(error); process.exitCode = 1; });

async function main() {
  globalThis.fetch = (async () => { realRequests += 1; throw new Error("parity must never fetch"); }) as typeof fetch;
  requestChannel.subscribe(observeRequest);
  try {
    const db = new Database(databasePath);
    db.exec(readFileSync(path.join(process.cwd(), "lib/db/schema.sql"), "utf8"));
    const workspace = getOrCreateDefaultWorkspaceIdentityV01(db, { create_uuid: () => WORKSPACE.slice(10), now: () => NOW });
    const localRoot = normalizeLocalProjectRootRefV01("/fixture/augnes-codec-parity", { base_path: "/" });
    const project = getOrCreateCanonicalProjectForLocalRootV01(db, { workspace_id: workspace.workspace_id, local_root: localRoot, display_name: "codec parity" }, { create_uuid: () => PROJECT.slice(8), now: () => NOW });
    const active = selectActiveProjectV01(db, { workspace_id: workspace.workspace_id, project_id: project.project.project_id, now: NOW, expected_project_id: null, expected_revision: null });
    db.close();
    const admission = { workspace_id: WORKSPACE, project_id: PROJECT, project_root: { path_flavor: localRoot.path_flavor, normalized_path: localRoot.normalized_path }, revision: active.selection_revision };
    for (const fixture of fixtures()) await exercise(fixture, admission);
    assert.deepEqual([...new Set(snapshot.fixtures.map((row: RecordValue) => row.purpose))].sort(), [...contracts.MODEL_GATEWAY_PURPOSES_V01].sort());
    assert.equal(realRequests, 0);
    const serialized = `${JSON.stringify(snapshot, null, 2)}\n`;
    assert(!serialized.includes("parity-credential-never-persisted"));
    const destination = process.argv[2];
    if (destination) writeFileSync(destination, serialized);
    console.log(JSON.stringify({ entry: "codec_parity", status: "pass", fixtures: snapshot.fixtures.length, purposes: contracts.MODEL_GATEWAY_PURPOSES_V01.length, cases: snapshot.fixtures.reduce((total: number, row: RecordValue) => total + row.cases.length, 0), snapshot_sha256: createProtocolSha256V01(serialized), real_provider_calls: realRequests }));
  } finally {
    globalThis.fetch = originalFetch;
    requestChannel.unsubscribe(observeRequest);
    rmSync(root, { recursive: true, force: true });
  }
}

async function exercise(fixture: Fixture, admission: RecordValue) {
  const purpose = fixture.input.input_kind;
  const requests: unknown[] = [];
  let scenario = "success";
  let cancelInFlight: AbortController | null = null;
  const adapter = createOpenAIResponsesAdapterV01({ environment: { OPENAI_API_KEY: "parity-credential-never-persisted", OPENAI_MODEL: fixture.model ?? "parity-test-model" }, transport: async request => {
    requests.push({ url: request.url, method: request.method, body: request.body, headers: Object.fromEntries(Object.entries(request.headers).filter(([key]) => key !== "Authorization")) });
    if (scenario === "inflight_cancelled") cancelInFlight!.abort();
    if (scenario === "lost_response") throw new Error("synthetic transport loss");
    return { ok: scenario !== "provider_rejection", status: scenario === "provider_rejection" ? 429 : 200, headers: { get: (name: string) => name === "x-request-id" ? "req_parity_fixed" : null }, async json() { return { status: "completed", output_text: scenario === "malformed_response" ? "{" : scenario === "response_oversize" ? "x".repeat(100_000) : JSON.stringify(fixture.output), usage: scenario === "malformed_usage" ? { input_tokens: -1 } : { input_tokens: 120, output_tokens: 24, total_tokens: 144 } }; } };
  } });
  const route = fixture.prepare ? await g[fixture.prepare]!({ adapter }) : null;
  const session = await adapter.prepare(purpose, new AbortController().signal);
  assert(session);
  const base = envelope(fixture, admission, session, route);
  const deps = { adapter, open_database: () => new Database(databasePath), read_root_availability: async () => "available", now: () => new Date(NOW), ...(fixture.routeKey ? { [fixture.routeKey]: route } : {}) };
  const record: RecordValue = { label: fixture.label, purpose, input: fixture.input, implementation: adapter.describe(purpose), route, cases: [] };
  const invoke = async (label: string, value: unknown = base, dependencies: RecordValue = deps) => {
    requests.length = 0;
    scenario = label;
    let result: unknown;
    try { result = { ok: true, value: await g[fixture.invoke]!(value, dependencies) }; }
    catch (error) {
      assert(contracts.isModelGatewayInvocationErrorV01(error), `${fixture.label}/${label}: unexpected ${String(error)}`);
      if (error.receipt) validateModelInvocationReceiptV02(error.receipt);
      result = { ok: false, code: error.code, receipt: error.receipt, provider_rejection_observation: error.provider_rejection_observation, provider_response_invalid_observation: error.provider_response_invalid_observation, received_result: error.received_result, transport_failure_observation: error.transport_failure_observation };
    }
    record.cases.push({ label, requests: structuredClone(requests), result });
    return result as RecordValue;
  };
  const success = await invoke("success");
  assert.equal(success.ok, true, `${fixture.label}: ${JSON.stringify(success)}`);
  validateModelInvocationReceiptV02(success.value.model_invocation_receipt);
  assert.equal(requests.length, 1);
  assert.equal(success.value.model_invocation_receipt.outcome, "live_success");
  for (const label of ["malformed_response", "provider_rejection", "lost_response", "response_oversize", "malformed_usage"]) {
    const result = await invoke(label);
    assert.equal(result.ok, false, `${fixture.label}/${label}`);
    assert.equal(requests.length, 1);
  }
  for (const label of ["duplicate_egress", "wrong_result_purpose", "wrong_session_purpose"]) {
    const wrappedAdapter = { describe: adapter.describe, async prepare(...args: Parameters<typeof adapter.prepare>) {
      const prepared = await adapter.prepare(...args); assert(prepared);
      return { ...prepared, ...(label === "wrong_session_purpose" ? { purpose: "unsupported_purpose" as contracts.ModelGatewayPurposeV01 } : {}), async invoke(...invokeArgs: Parameters<typeof prepared.invoke>) {
        const result = await prepared.invoke(...invokeArgs);
        if (label === "duplicate_egress") invokeArgs[1].mark_egress_attempted();
        return label === "wrong_result_purpose" ? { ...result, purpose: "unsupported_purpose" } as unknown as contracts.ModelAdapterInvocationResultV01 : result;
      } };
    } };
    const result = await invoke(label, base, { ...deps, adapter: wrappedAdapter });
    assert.equal(result.ok, false, `${fixture.label}/${label}`);
    assert.equal(requests.length, label === "wrong_session_purpose" ? 0 : 1);
  }
  if ("output" in success.value) {
    const missingOutputAdapter = { describe: adapter.describe, async prepare(...args: Parameters<typeof adapter.prepare>) {
      const prepared = await adapter.prepare(...args); assert(prepared);
      return { ...prepared, async invoke(...invokeArgs: Parameters<typeof prepared.invoke>) { return { ...await prepared.invoke(...invokeArgs), output: undefined }; } };
    } };
    // An adapter-contract edge: preserve the baseline disposition and exact hash
    // of undefined output, including historical successes, without weakening it.
    await invoke("undefined_adapter_output", base, { ...deps, adapter: missingOutputAdapter });
  }
  cancelInFlight = new AbortController();
  const cancelled = await invoke("inflight_cancelled", { ...base, cancellation: { signal: cancelInFlight.signal } });
  assert.equal(cancelled.ok, false);
  assert.equal(cancelled.code, "model_gateway_cancelled");
  assert.equal(requests.length, 1);
  const adverse: Array<[string, RecordValue]> = [
    ["wrong_purpose", { ...base, purpose: "unsupported_purpose" }],
    ["wrong_input_kind", { ...base, input: { ...base.input, input_kind: "unsupported_purpose" } }],
    ["wrong_envelope_version", { ...base, envelope_version: "model_invocation_envelope.v999" }],
    ["stale_selection", { ...base, policy: { ...base.policy, expected_active_selection_revision: differentSelectionRevision(admission.revision) } }],
    ["wrong_project", { ...base, project_id: "project:33333333-3333-4333-8333-333333333333" }],
    ["budget_exceeded", { ...base, budget: { ...base.budget, max_input_bytes: 1 } }],
    ["privacy_refused", { ...base, privacy: { ...base.privacy, provider_egress: "deny" } }],
    ["cancelled", { ...base, cancellation: { signal: AbortSignal.abort() } }],
  ];
  if ("codec_version" in base.input) adverse.push(["wrong_codec_version", { ...base, input: { ...base.input, codec_version: "codec.v999" } }]);
  for (const [label, value] of adverse) {
    const result = await invoke(label, value);
    assert.equal(result.ok, false, `${fixture.label}/${label}`);
    assert.equal(requests.length, 0, `${fixture.label}/${label}: transport must be untouched`);
  }
  if (fixture.cost) {
    const result = await invoke("expired_cost_authority", base, { ...deps, now: () => new Date("2026-11-02T00:00:00.000Z") });
    assert.equal(result.ok, false);
    assert.equal(requests.length, 0);
  }
  snapshot.fixtures.push(record);
}

function envelope(fixture: Fixture, admission: RecordValue, session: contracts.ModelAdapterSessionV01, route: unknown): RecordValue {
  const purpose = fixture.input.input_kind;
  let costBudget;
  if (fixture.cost) {
    const authority = buildModelGatewayCostAuthorityV01({ authority_kind: "provider_model_pricing_snapshot", workspace_id: WORKSPACE, project_id: PROJECT, purpose, provider_ref: session.provider_ref, model_ref: session.model_ref, cost_unit: "nano_usd", input_rate: { unit: "utf8_byte", cost_per_unit: 1 }, output_rate: { unit: "token", cost_per_unit: 1 }, pricing_source_version: "synthetic_parity.v0.1", pricing_effective_at: "2026-10-28T00:00:00.000Z", pricing_expires_at: "2026-10-30T00:00:00.000Z", project_model_policy_fingerprint: fingerprint(route ?? session.model_ref) });
    costBudget = buildModelGatewayCostBudgetV01({ authority, workspace_id: WORKSPACE, project_id: PROJECT, purpose, provider_ref: session.provider_ref, model_ref: session.model_ref, maximum_input_units: fixture.limits.bytes, maximum_output_units: fixture.limits.tokens, timeout_ms: fixture.limits.timeout, maximum_permitted_cost: 1_000_000, evaluated_at: NOW });
  }
  const input = structuredClone(fixture.input);
  if (purpose === contracts.STRATEGIC_ADVANTAGE_TRANSFER_MODEL_GATEWAY_PURPOSE_V01) input.budget.model.cost = { status: "available", budget: costBudget };
  return { envelope_version: contracts.MODEL_INVOCATION_ENVELOPE_VERSION_V01, invocation_id: `parity:${fixture.label}`, workspace_id: WORKSPACE, project_id: PROJECT, purpose, data_classification: "public_safe", provenance_refs: [`sha256:${"b".repeat(64)}`], privacy: { provider_egress: "allow", retention_class: "none" }, budget: { max_input_bytes: fixture.limits.bytes, max_output_tokens: fixture.limits.tokens, max_provider_calls: 1, ...(costBudget ? { cost_budget: costBudget } : {}) }, timeout_ms: fixture.limits.timeout, cancellation: { signal: new AbortController().signal }, execution_mode: "live", policy: { invocation_origin: "interactive", expected_active_project_id: PROJECT, expected_active_selection_revision: admission.revision }, project_root: admission.project_root, input, ...(purpose.startsWith("operational_reentry") ? { provider_request_trace_id: createDeterministicModelProviderRequestTraceV01({ request_family_kind: "compatibility_probe", request_family_fingerprint: fingerprint({ fixture: fixture.label, input }) }) } : {}) };
}

function fixtures(): Fixture[] {
  const strategic = strategicModelInputFixtureV01();
  const context = temporalContext();
  const governedCase = governedActorLabLiveCasebookFixture.development_cases[0]!;
  const governed = { input_kind: "governed_actor_lab", codec_version: "governed_actor_lab_live_codec.v0.1", phase: "blind_solve", invocation_context: { cohort_ref: "parity", arm: "single_strong_actor", generation: 0, episode_or_holdout_index: 0, actor_slot: "slot-0", frozen_actor_ref: "actor:parity" }, actor_profile: { procedural_operator_policy: "verification_first", evidence_retrieval_policy: "support_and_currentness", memory_policy: "strict_source_only", orchestration_policy: "verify_then_solve" }, actor_visible_case: structuredClone(governedCase.actor_visible), admitted_private_memory: [], curated_knowledge: [], own_blind_artifact: null, peer_challenge_artifact: null, authority_notice: { output_is_candidate_only: true, source_tokens_must_be_supplied: true, memory_write_authorized: false, provider_route_control_authorized: false } };
  const result: Fixture[] = [
    { label: "observe", input: { input_kind: "observe_delta_compile", message: "Retain a review-only proposal.", current_state: [] }, output: { proposals: [{ state_key: "product.name", before_value: null, after_value: "Augnes", operation: "set", temporal_scope: "current_project", valid_from: null, valid_until: null, stability: "active", change_type: "new_state", reason: "Bounded synthetic response." }] }, invoke: "invokeObserveModelGatewayV01", limits: { bytes: 98_304, tokens: 2048, timeout: 1000 } },
    { label: "planner", input: { input_kind: "planner_plan", message: "Plan a bounded source review.", brief: { runtime: "augnes", scope: PROJECT, as_of: NOW, generated_at: NOW, active_state: [], future_state: [], completed_state: [], deprecated_state: [], open_tensions: [], pending_proposals: [], recent_actions: [], recent_action_visibility: {}, agent_instructions: [], agent_handoff: {} } }, output: { recommendations: [{ title: "Review", rationale: "Bounded synthetic response.", tool_name: null, priority: "next", grounded_state_keys: [] }] }, invoke: "invokePlannerModelGatewayV01", limits: { bytes: 98_304, tokens: 2048, timeout: 1000 } },
    { label: "temporal", input: { input_kind: "temporal_interpretation", context }, output: buildMockTemporalPreview(context), invoke: "invokeTemporalModelGatewayV01", limits: { bytes: 65_536, tokens: 4096, timeout: 1000 } },
    { label: "strategic", input: strategic, output: strategicModelOutputFixtureV01(strategic), invoke: "invokeStrategicAdvantageTransferModelGatewayV01", limits: { bytes: strategic.budget.model.max_input_bytes, tokens: strategic.budget.model.max_output_tokens, timeout: strategic.budget.model.timeout_ms }, cost: true },
    { label: "guide_brief", input: { input_kind: contracts.GUIDE_BRIEF_INTERPRETATION_MODEL_GATEWAY_PURPOSE_V01, utterance: "지금 무슨 상황인가요?", candidates: [{ candidate_token: TOKEN, ...guideBriefInterpretationCandidateMeaningV01("current_situation"), currently_available: true }], previous_answer_anchor: null }, output: { coverage: "complete", classification: "single", candidate_tokens: [TOKEN] }, invoke: "invokeGuideBriefInterpretationModelGatewayV01", limits: { bytes: 16_384, tokens: 256, timeout: 8000 } },
    { label: "governed_actor", input: governed, output: { result_token: governedCase.evaluator_only.expected_result_token, claim_candidates: governedCase.evaluator_only.required_support_relations.map(relation => ({ claim_token: relation.claim_token, source_tokens: [...relation.required_source_tokens] })), uncertainties: governed.actor_visible_case.uncertainty_tokens.slice(0, 1), abstention: governedCase.evaluator_only.abstention_required, challenge_response: { peer_claim_tokens_considered: [], accepted_peer_claim_tokens: [], rejected_peer_claim_tokens: [] }, referenced_memory_tokens: [], referenced_curated_tokens: [], synthesis_token: governedCase.evaluator_only.expected_result_token }, invoke: "invokeGovernedActorLabModelGatewayV01", prepare: "prepareGovernedActorLabModelGatewayRouteV01", routeKey: "expected_governed_actor_lab_route", limits: { bytes: 24576, tokens: 512, timeout: 30000 }, cost: true },
  ];
  for (const arm of ["A", "B", "C", "D"] as const) {
    const v1 = buildOperationalReentryMatchedCohortCallPlanV01().entries.find(entry => entry.arm === arm)!.model_input;
    result.push({ label: `matched_v1_${arm}`, input: v1, output: matchedV1Output(v1), invoke: "invokeOperationalReentryMatchedCohortModelGatewayV01", prepare: "prepareOperationalReentryMatchedCohortModelGatewayRouteV01", routeKey: "expected_operational_reentry_matched_cohort_route", limits: { bytes: 12288, tokens: 256, timeout: 30000 }, cost: true });
    result.push({ label: `matched_v2_${arm}`, input: buildOperationalReentryMatchedCohortModelInputV02({ arm, call_slot_id: `parity-${arm}`, block: 0 }), output: buildOperationalReentryMatchedCohortGoldenOutputV02(arm), invoke: "invokeOperationalReentryMatchedCohortModelGatewayV02", prepare: "prepareOperationalReentryMatchedCohortModelGatewayRouteV02", routeKey: "expected_operational_reentry_matched_cohort_v02_route", limits: limits(V2_LIMITS), cost: true });
    result.push({ label: `matched_v3_${arm}`, input: buildOperationalReentryMatchedCohortModelInputV03({ arm, call_slot_id: `parity-${arm}`, block: 0 }), output: buildOperationalReentryMatchedCohortGoldenWireOutputV03(arm), invoke: "invokeOperationalReentryMatchedCohortModelGatewayV03", prepare: "prepareOperationalReentryMatchedCohortModelGatewayRouteV03", routeKey: "expected_operational_reentry_matched_cohort_v03_route", limits: limits(V3_LIMITS), cost: true });
    result.push({ label: `matched_v4_${arm}`, input: buildOperationalReentryMatchedCohortInvocationV04({ arm, call_slot_id: `parity-${arm}`, cohort_ref: "parity", block: 0 }), output: buildOperationalReentryMatchedCohortGoldenWireOutputV04(arm), invoke: "invokeOperationalReentryMatchedCohortModelGatewayV04", prepare: "prepareOperationalReentryMatchedCohortModelGatewayRouteV04", routeKey: "expected_operational_reentry_matched_cohort_v04_route", limits: limits(V4_LIMITS), cost: true });
  }
  for (const case_id of [OPERATIONAL_REENTRY_STALE_RESET_R1_CASE_ID_V01, OPERATIONAL_REENTRY_STALE_RESET_R2_CASE_ID_V01]) for (const arm of ["A", "B", "C", "G"] as const) {
    const input = buildOperationalReentryStaleResetCrossCaseInvocationV01({ case_id, arm, cohort_ref: "parity", call_slot_id: `parity-${arm}`, repeat_block: 0 });
    result.push({ label: `cross_${case_id}_${arm}`, input, output: buildOperationalReentryStaleResetCrossCaseMaximalWireOutputV01(input.provider_material), invoke: "invokeOperationalReentryStaleResetCrossCaseModelGatewayV01", prepare: "prepareOperationalReentryStaleResetCrossCaseModelGatewayRouteV01", routeKey: "expected_operational_reentry_stale_reset_cross_case_route", limits: limits(CROSS_LIMITS), cost: true });
  }
  for (const stage of ["choose", "conclude"]) {
    const planner = structuredClone(result.find(item => item.label === "planner")!);
    planner.label = `planner_source_review_${stage}`;
    planner.input.message = JSON.stringify({ contract: "stateless_source_review.v0.1", stage });
    (planner.output as RecordValue).recommendations[0].tool_name = stage === "choose" ? "read_selected_sources" : "use_observation";
    result.push(planner);
  }
  const solLow = structuredClone(result.find(item => item.label === "planner_source_review_choose")!);
  solLow.label = "planner_sol_low"; solLow.model = "gpt-6.1-sol"; result.push(solLow);
  const historical = structuredClone(result.find(item => item.label === "matched_v1_A")!);
  historical.label = "matched_v1_historical_codec";
  historical.input.codec_version = "operational_reentry_matched_cohort_codec.v0.1";
  result.push(historical);
  return result;
}

function temporalContext({ evidenceCount = 0 } = {}): TemporalPreviewContext {
  return {
    scope: PROJECT,
    as_of: "2026-01-01T00:00:00.000Z",
    current_interpretation: "Bounded read-only interpretation.",
    active_prior_context: "No prior context is required.",
    evidence_anchors: Array.from({ length: evidenceCount }, (_, index) => ({
      ref: `state:item-${index}`,
      claim: "Bounded claim.",
      source_type: "committed_state" as const,
    })),
    summary_refs: [],
    source_authority_profile: {
      committed_state_authority: [],
      summary_only_refs: [],
      allowed_now: ["read_state_brief"],
      blocked_now: ["commit_state"],
    },
    counterexamples: [],
    residual_tensions: [],
    user_preferences: [],
    safe_next_step: "Continue read-only review.",
    non_authority_boundary: "This preview is non-authoritative.",
    active_context_admission_rationale: [],
    active_context_admission: {
      decisions: [],
      note: "No context admission is needed.",
    },
    suppressed_alternatives: [],
    temporal_hierarchy_view: {
      raw_observation_level: "No raw observations.",
      work_or_session_level: "Bounded work context.",
      project_status_level: "Review remains pending.",
      current_interpretive_stance: "Read-only.",
      hierarchy_caution: "Do not infer authority.",
    },
    memory_lifecycle_view: {
      active_context: [],
      retrieved_context: [],
      summary_or_view: [],
      stale_or_deferred_context: [],
      lifecycle_caution: "No memory write.",
    },
    interpretive_drivers: [],
    axis_pressures: [],
  };
}

function matchedV1Output(
  input: RecordValue,
): RecordValue {
  const isStale = input.stale_relation !== null;
  const targetAvailable = input.target_context_token !== null;
  const isA = targetAvailable && !isStale;
  const isB = !targetAvailable && input.context_material.length > 0;
  if (isB) {
    return {
      result_token: "result_review_blocked",
      referenced_context_tokens: [...input.allowed_output.referenced_context_tokens],
      required_check_dispositions: ["verify_portable_output:blocked"],
      operation_action_class_tokens: ["no_external_action"],
      blocker_warning_gap_tokens: ["gap_support_unknown"],
      result_limitation_tokens: ["limitation_non_authoritative", "limitation_target_not_available"],
      target_disposition: "not_available",
      abstention: true,
    };
  }
  if (isStale) {
    return {
      result_token: "result_review_ready",
      referenced_context_tokens: input.allowed_output.referenced_context_tokens.filter(
        (token: string) => token !== input.target_context_token,
      ),
      required_check_dispositions: ["verify_portable_output:passed"],
      operation_action_class_tokens: ["bounded_result_review"],
      blocker_warning_gap_tokens: ["gap_decision_pending"],
      result_limitation_tokens: ["limitation_non_authoritative"],
      target_disposition: "withheld_stale",
      abstention: false,
    };
  }
  return {
    result_token: "result_review_ready",
    referenced_context_tokens: [...input.allowed_output.referenced_context_tokens],
    required_check_dispositions: ["verify_portable_output:passed"],
    operation_action_class_tokens: isA
      ? ["bounded_result_review", "target_linked_verification_preparation"]
      : ["bounded_result_review"],
    blocker_warning_gap_tokens: targetAvailable
      ? ["gap_decision_pending", "gap_support_unknown"]
      : [],
    result_limitation_tokens: targetAvailable
      ? ["limitation_non_authoritative"]
      : ["limitation_non_authoritative", "limitation_target_not_available"],
    target_disposition: targetAvailable ? "applied_to_structure" : "not_available",
    abstention: false,
  };
}


function limits(value: {finalRequestBytes: number; maxOutputTokens: number; timeoutMs: number}) { return {bytes: value.finalRequestBytes, tokens: value.maxOutputTokens, timeout: value.timeoutMs}; }
