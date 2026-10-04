import { checkpointProcessReplacement } from "./test-stateless-observation-checkpoint";
import { OPENAI_PLANNER_SOL_LOW, OPENAI_PLANNER_SOL_LOW_REF } from "../lib/vnext/model-gateway/planner-execution-configuration";
import { STATELESS_LIMITS, STATELESS_SOL_LOW_LIMITS } from "../lib/vnext/stateless-work";
import { statelessTerminalEntries, statelessMandatoryEntries } from "../lib/vnext/stateless-work";
import { inspectStatelessTerminalSuccessor, readTerminalAuthorshipPreparation, readTerminalAttemptHistory, assertTerminalHistoryActive, previewTerminalAuthorship } from "../lib/vnext/runtime/stateless-terminal-authorship";
import { StatelessTerminalAuthorship } from "../components/blank-state/stateless-terminal-authorship";
import { pathToFileURL } from "node:url";
import { readStatelessDispositionPreparation, assertStatelessUnsettledAdmission, statelessUnresolvedEntries } from "../lib/vnext/runtime/stateless-review-disposition";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { StatelessReviewFailure } from "../components/blank-state/stateless-review-failure";
import { readStatelessFailureReviews, STATELESS_FAILURE_BOUNDS } from "../lib/vnext/stateless-review-failure";
import { installZeroNetworkGuard } from "./test-harness-zero-network-guard.mjs";
import { mkdtempSync, mkdirSync, realpathSync, writeFileSync, readFileSync, rmSync, renameSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { hasUnsettledAutonomyRunLedgerRecords, insertAutonomyRunLedgerRecord, updateAutonomyRunStepLedgerFields } from "../lib/autonomy/runner-ledger";
import { createVNextOperatorContextUseReviewHandlerV01 } from "../app/api/vnext/operator/project-continuity/route";
import { readSelectedWorkSources, selectedWorkSourceInput } from "../lib/intake/selected-work-source-comparison";
import { readProjectWorkInitializationV01 } from "../lib/vnext/runtime/project-work-initialization";
import { inspectPersistedHostProjectRootV01, runDirectNativeHostRoundTripV01 } from "../lib/vnext/runtime/direct-native-host-round-trip";
import { inspectCurrentOrdinarySuccessorRevisionChainV01, ordinarySuccessorRevisionExecutionBlockedV01 } from "../lib/vnext/runtime/authored-successor-revision";
import { readSourceReview, readStatelessSelectedNotes, validateStatelessGrant, statelessGrantKey } from "../lib/vnext/stateless-work";
import { fingerprintNativeHostPhysicalRootIdentityV01 } from "../lib/vnext/native-host/project-root-identity";
import { previewActivePortableProjectV01 } from "../lib/vnext/portability/portable-project";
import { createProjectDirectionHandler } from "../app/api/vnext/operator/project-direction/route";
import { packetDirectionBinding, readPacketDirectionInterpretation } from "../lib/vnext/persistence/project-direction-store";
import type { ModelAdapterV01 } from "../lib/vnext/model-gateway/contracts";
import { channel } from "node:diagnostics_channel";
import Database from "better-sqlite3";
import { applyCanonicalDatabaseMigrations } from "./canonical-database-migrations.mjs";
import { getOrCreateDefaultWorkspaceIdentityV01, getOrCreateCanonicalProjectForLocalRootV01, normalizeLocalProjectRootRefV01 } from "../lib/vnext/persistence/project-identity-registry";
import { readActiveProjectSelectionV01, selectActiveProjectV01 } from "../lib/vnext/persistence/project-lifecycle-registry";
import { issueVNextLocalOperatorBootstrapV01, consumeVNextLocalOperatorBootstrapV01, readVNextLocalOperatorCredentialFromRequestV01, revokeVNextLocalOperatorSessionByCredentialV01, VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01 } from "../lib/vnext/runtime/local-operator-session";
import { defineInitialProjectWorkV01 } from "../lib/vnext/runtime/project-work-initialization";
import { mutateProjectControlV01, readProjectAutomationControlV01 } from "../lib/vnext/persistence/project-control-store";
import { createStatelessSourceReviewHandler } from "../app/api/vnext/operator/stateless-source-review/route";
import { StatelessSourceReviewHost, authorizeStatelessReview } from "../lib/vnext/runtime/stateless-source-review";
import { createOpenAIResponsesAdapterV01 } from "../lib/vnext/model-gateway/openai/responses-adapter";
import { preparePlannerModelGatewayRouteV01 } from "../lib/vnext/model-gateway/model-gateway";
import { projectModelTransportFailureObservationV01, normalizeModelTransportFailureObservationV01 } from "../lib/vnext/model-gateway/transport-failure-observation";
import { validateModelInvocationReceiptV02 } from "../lib/vnext/model-gateway/model-invocation-receipt";
import { listVNextCoreRecordsV01 } from "../lib/vnext/persistence/durable-semantic-store";
import { readProjectRunResultSourceBindingV01 } from "../lib/vnext/runtime/project-run-result-read-model";
import { createRecoveryBackup, RECOVERY_DATABASE_PAYLOAD } from "./recovery-backup.mjs";
import { inspectRecoveryDatabaseFile } from "./runtime-database-bootstrap.mjs";
import { validateRecoveryCanonicalDatabaseV01 } from "./recovery-canonical-record-validator";
import { canonicalizeProtocolValueV01 as canonical, createProtocolSha256V01 as hash } from "../lib/vnext/protocol-primitives";

const root = realpathSync(mkdtempSync(path.join(tmpdir(), "augnes-stateless-review-")));
let requests = 0;
const network = channel("undici:request:create"), onNetwork = () => { requests++; };
network.subscribe(onNetwork);
const databases: Database.Database[] = [];
// Recovery's existing process owner uses an exact loopback ownership probe.
const zeroNetwork = installZeroNetworkGuard({ allowLoopback: true });
const sourceText = "export function choose() { return 'advisory'; }\nexport function inspect() { return 'exact source bytes'; }\n";
function scripted(firstChoice = "read_selected_sources", secondChoice = "use_observation", model = "gpt-4.1-mini") {
  const inputs: any[] = [], serializedRequests: string[] = []; let calls = 0;
  const controls = { lose: false, transportError: new Error("simulated_transport_loss_after_dispatch") as unknown, outputTokens: 80, dispatch: async () => {}, transform: (_output: any, _input: any) => {} };
  const environment = { OPENAI_API_KEY: "scripted-transport-only-not-a-key", OPENAI_MODEL: model };
  const responseControls = { status: null as string | null, incompleteReason: null as string | null, reasoningTokens: null as number | null, omitOutput: false };
  const adapter = createOpenAIResponsesAdapterV01({ environment, transport: async request => {
    calls++; serializedRequests.push(request.body); const body = JSON.parse(request.body);
    assert.equal(body.store, false); assert.equal(body.previous_response_id, undefined);
    const material = JSON.parse(body.input[1].content[0].text); const input = JSON.parse(material.message); inputs.push(input);
    await controls.dispatch();
    if (controls.lose) throw controls.transportError;
    const choice = input.stage === "choose" ? firstChoice : secondChoice;
    const output = { recommendations: [{ title: "Bounded entrypoint finding", rationale: input.stage === "choose" ? (choice === "read_selected_sources" ? "Read the selected excerpt because the question concerns this entrypoint." : "The question needs broader evidence; defer this read rather than treating a limited excerpt as sufficient.") : (choice === "use_observation" ? "The selected excerpt exposes advisory output and bounded result reentry. These fragments do not prove a broader connection." : "Retain uncertainty because this observation is unavailable or insufficient for the question."),
      tool_name: choice, priority: "now", grounded_state_keys: [input.stage === "choose" ? input.review_ref : input.observation_fingerprint] }] };
    controls.transform(output, input);
    return { ok: true, status: 200, json: async () => ({
      ...(responseControls.status ? { status: responseControls.status } : {}),
      ...(responseControls.incompleteReason ? { incomplete_details: { reason: responseControls.incompleteReason } } : {}),
      output: responseControls.omitOutput ? [{ type: "reasoning", encrypted_content: "scripted-hidden-content-must-not-persist" }]
        : [{ type: "message", content: [{ type: "output_text", text: JSON.stringify(output) }] }],
      usage: { input_tokens: 200, output_tokens: controls.outputTokens, total_tokens: 200 + controls.outputTokens,
        ...(responseControls.reasoningTokens === null ? {} : { output_tokens_details: { reasoning_tokens: responseControls.reasoningTokens } }) } }) };
  } });
  return { adapter, inputs, serializedRequests, controls, responseControls, environment, get calls() { return calls; } };
}
async function fixture(name: string, firstChoice = "read_selected_sources", secondChoice = "use_observation", auditSources = false, model = "gpt-4.1-mini") {
  const dir = path.join(root, name); mkdirSync(dir); const projectRoot = path.join(dir, "project"); mkdirSync(projectRoot);
  writeFileSync(path.join(projectRoot, "entry.ts"), sourceText);
  const selected = auditSources ? [
    { path: "planner.ts", start_line: 141, end_line: 164 },
    { path: "prospective.ts", start_line: 112, end_line: 131 },
  ] : [{ path: "entry.ts", start_line: 1, end_line: 2 }];
  if (auditSources) {
    writeFileSync(path.join(projectRoot, "planner.ts"), readFileSync("lib/vnext/automation/policy-triggered-planner-run.ts"));
    writeFileSync(path.join(projectRoot, "prospective.ts"), readFileSync("lib/vnext/runtime/prospective-reentry.ts"));
  }
  const databasePath = path.join(dir, "review.db"), db = new Database(databasePath); databases.push(db); db.pragma("foreign_keys=ON"); applyCanonicalDatabaseMigrations(db);
  const workspace = getOrCreateDefaultWorkspaceIdentityV01(db), registration = getOrCreateCanonicalProjectForLocalRootV01(db, { workspace_id: workspace.workspace_id,
    local_root: normalizeLocalProjectRootRefV01(projectRoot, { base_path: root }), display_name: name });
  const scope = { workspace_id: workspace.workspace_id, project_id: registration.project.project_id };
  const config = { ...scope, enabled: true as const, operator_id: "operator:stateless-test", database_path: databasePath };
  let time = Date.now() + 10; const now = () => new Date(time).toISOString(), tick = (ms = 10) => { time += ms; };
  selectActiveProjectV01(db, { ...scope, expected_project_id: null, expected_revision: null, now: now() });
  const active = readActiveProjectSelectionV01(db, scope.workspace_id)!;
  const bootstrap = issueVNextLocalOperatorBootstrapV01(db, { config, clock: { now } }), session = consumeVNextLocalOperatorBootstrapV01(db, { config, clock: { now }, bootstrap_token: bootstrap.bootstrap_token });
  let cookie = `${VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01}=${session.cookie_value}`;
  const credential = () => readVNextLocalOperatorCredentialFromRequestV01(new Request("http://127.0.0.1", { headers: { cookie } }));
  tick();
  const initial = defineInitialProjectWorkV01(db, { config, credential: credential(), clock: { now }, request: { action: "define_initial_project_work", ...scope,
    expected_active_project_id: scope.project_id, expected_active_selection_revision: active.selection_revision, expected_initialization_state: "not_defined",
    goal: "Identify the connections established by the selected entrypoints", success_criteria: ["Attribute findings to exact excerpts and preserve uncertainty"], non_goals: ["No repository-wide absence claim or semantic acceptance"] } });
  assert.equal(initial.packet.capability_grant, null); cookie = `${VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01}=${initial.session_admission.cookie_value}`;
  tick();
  const control = readProjectAutomationControlV01(db, scope);
  mutateProjectControlV01(db, { ...scope, action: "enable_automation", expected_active_project_id: scope.project_id, expected_active_selection_revision: active.selection_revision, expected_control_revision: control?.revision ?? null }, { now });
  const script = scripted(firstChoice, secondChoice, model);
  const { adapter, inputs } = script;
  const environment = { NODE_ENV: "test" as const, AUGNES_VNEXT_OPERATOR_PILOT_ENABLED: "1", AUGNES_VNEXT_OPERATOR_WORKSPACE_ID: scope.workspace_id,
    AUGNES_VNEXT_OPERATOR_PROJECT_ID: scope.project_id, AUGNES_VNEXT_OPERATOR_ID: config.operator_id, AUGNES_DB_PATH: databasePath };
  const route = createStatelessSourceReviewHandler({ environment, clock: { now }, adapter });
  const url = "http://127.0.0.1/api/vnext/operator/stateless-source-review";
  async function call(body?: unknown, expected: number | number[] = 200, headers: Record<string, string> = {}, projectId = scope.project_id) {
    tick(); const response = await route(new Request(`${url}?project_id=${projectId}`, { method: body ? "POST" : "GET",
      headers: { host: "127.0.0.1", origin: "http://127.0.0.1", cookie, ...(body ? { "content-type": "application/json" } : {}), ...headers }, ...(body ? { body: JSON.stringify(body) } : {}) }));
    const value = await response.json(); assert.ok((Array.isArray(expected) ? expected : [expected]).includes(response.status), `${response.status}: ${canonical(value)}`);
    if (response.headers.get("set-cookie")) cookie = response.headers.get("set-cookie")!.split(";")[0]!;
    return value;
  }
  const prepared = await call({ action: "prepare", material: { question: "What connection does this exact entrypoint establish, and what remains unestablished?", files: selected } });
  const preview = (await call({ action: "preview", pricing: { input_nano_usd_per_byte: 1000, output_nano_usd_per_token: 1000, maximum_total_nano_usd: 100_000_000, source_version: "scripted-test-price-not-live-authority" } })).authorization;
  assert.equal(script.calls, 0);
  assert.equal(listVNextCoreRecordsV01(db, { ...scope, record_kinds: ["capability_grant"], limit: 128 }).length, 0);
  const direction = async (request: unknown) => {
    tick(); const response = await createProjectDirectionHandler({ environment, clock: { now } })(new Request(`http://127.0.0.1/api/vnext/operator/project-direction?project_id=${scope.project_id}`, {
      method: "POST", headers: { host: "127.0.0.1", origin: "http://127.0.0.1", cookie, "content-type": "application/json" }, body: JSON.stringify(request) }));
    const value = await response.json(); assert.equal(response.status, 200, value.error);
    cookie = response.headers.get("set-cookie")!.split(";")[0]!; return value;
  };
  const continuity = async (body: unknown, expected = 200, headers: Record<string, string> = {}) => {
    tick(); const response = await createVNextOperatorContextUseReviewHandlerV01({ environment, clock: { now } })(new Request("http://127.0.0.1/api/vnext/operator/project-continuity", {
      method: "POST", headers: { host: "127.0.0.1", origin: "http://127.0.0.1", cookie, "content-type": "application/json", ...headers }, body: JSON.stringify(body) }));
    const value = await response.json(); assert.equal(response.status, expected, canonical(value));
    if (response.headers.get("set-cookie")) cookie = response.headers.get("set-cookie")!.split(";")[0]!;
    return value;
  };
  return { db, scope, config, projectRoot, now, tick, adapter, inputs, serializedRequests: script.serializedRequests, call, preview, credential, direction, continuity, preparationBytes: prepared.result.preparation_bytes, controls: script.controls, responseControls: script.responseControls, modelEnvironment: script.environment,
    host: (id: string, customAdapter = adapter) => new StatelessSourceReviewHost({ config, now, adapter: customAdapter }, id),
    get calls() { return script.calls; }, loseDispatch(error?: unknown) { script.controls.lose = true; if (error !== undefined) script.controls.transportError = error; },
    refreshSession() { const b = issueVNextLocalOperatorBootstrapV01(db, { config, clock: { now } }); const s = consumeVNextLocalOperatorBootstrapV01(db, { config, clock: { now }, bootstrap_token: b.bootstrap_token }); cookie = `${VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01}=${s.cookie_value}`; },
    authorizeOnly(request = preview) { tick(); const authorized = authorizeStatelessReview(db, { config, now, adapter }, credential(), request); cookie = `${VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01}=${authorized.session_admission.cookie_value}`; return authorized; } };
}
const notePricing = { input_nano_usd_per_byte: 1000, output_nano_usd_per_token: 1000, maximum_total_nano_usd: 100_000_000, source_version: "scripted-selected-note-price" };
async function selectOrdinaryNotes(f: Awaited<ReturnType<typeof fixture>>, notes: unknown[]) {
  const work = readProjectWorkInitializationV01(f.db, f.config), packet = work.current_packet!;
  const comparison = (await f.continuity({ action: "compare_selected_work_sources", expected_current_packet_id: packet.packet_id,
    expected_current_packet_fingerprint: packet.packet_fingerprint, notes })).comparison;
  await f.continuity({ action: "revise_pre_execution_project_work", ...f.scope, expected_active_project_id: f.scope.project_id,
    expected_active_selection_revision: work.active_selection_revision, expected_current_packet_id: packet.packet_id,
    expected_current_packet_fingerprint: packet.packet_fingerprint, expected_current_lineage_kind: packet.lineage_kind, ...work.current_work,
    selected_source_context: comparison.entries, expected_source_comparison: comparison.fingerprint }, 201);
}
function currentNotes(f: Awaited<ReturnType<typeof fixture>>) {
  const id = readProjectWorkInitializationV01(f.db, f.config).current_packet!.packet_id;
  const packet = listVNextCoreRecordsV01(f.db, { ...f.scope, record_kinds: ["task_context_packet"], limit: 128 }).find(r => r.record_id === id)!.payload as any;
  return readSelectedWorkSources(packet).map(selectedWorkSourceInput);
}
function unsettledOwnerContract(run: any) {
  // Isolated ledger truth-table fixtures only. No grant, ordinary work or
  // successful execution is fabricated or repaired by these interventions.
  const db = new Database(":memory:");
  try {
    insertAutonomyRunLedgerRecord({ ...run, run_id: "own", status: "running", metadata: {} }, [], [], { db });
    insertAutonomyRunLedgerRecord({ ...run, run_id: "other", status: "completed", metadata: {} }, [], [], { db });
    const check = (metadata: string, expected: boolean) => {
      db.prepare("UPDATE autonomy_runs SET metadata_json=? WHERE run_id='other'").run(metadata);
      assert.equal(hasUnsettledAutonomyRunLedgerRecords({ db, scope: run.scope, exclude_run_id: "own" }), expected, metadata);
      assert.equal((db.prepare("SELECT metadata_json FROM autonomy_runs WHERE run_id='other'").get() as any).metadata_json, metadata);
    };
    for (const metadata of ['{"reconciliation_required":true}', '{"reconciliation_required":null}', '{"reconciliation_required":"false"}', '{"reconciliation_required":0}', '{', '[]', 'null']) check(metadata, true);
    check('{"reconciliation_required":false}', false); check('{}', false);
    assert.equal(hasUnsettledAutonomyRunLedgerRecords({ db, scope: run.scope }), true, "Own run is excluded only by explicit exact ID");
    assert.equal(hasUnsettledAutonomyRunLedgerRecords({ db, scope: run.scope, exclude_run_id: "other" }), true);
    assert.equal(hasUnsettledAutonomyRunLedgerRecords({ db, scope: "another-project" }), false);
  } finally { db.close(); }
}
async function ordinarySuccessor(f: Awaited<ReturnType<typeof fixture>>, result: any, expectedCalls = 2, workReview = false) {
  const prep = await f.continuity({ action: "read_result_work_preparation", receipt_id: result.receipt.receipt_id });
  assert.equal(result.run.metadata.reconciliation_required, false);
  const rootScope = await inspectPersistedHostProjectRootV01(f.db, { config: f.config, evaluated_at: f.now() });
  assert.equal(prep.binding.expected_root_fingerprint, rootScope.root_fingerprint);
  assert.equal(result.run.metadata.root_physical_identity_fingerprint, fingerprintNativeHostPhysicalRootIdentityV01(rootScope.physical_root_identity));
  assert.ok(prep.result_source, "The ordinary preparation exposes the completed review as a selectable attributed result");
  const note = selectedWorkSourceInput(prep.result_source);
  assert.equal(note.provenance, "imported_unverified"); assert.equal(note.label, "Unclassified / needs review");
  assert.ok(note.text.includes("verification: not_run")); assert.ok(note.text.includes("not independently verified"));
  assert.ok(note.source.includes(result.receipt.receipt_id)); assert.ok(note.source.includes(result.receipt.integrity.fingerprint));
  const selectedNote = workReview ? { ...note, source: `Work review of ${note.source}`, provenance: "derived_interpretation", label: "Changed assumption / user correction",
    text: `Work source review: the selected fragments do not establish a call or data relation. The prior dependency assertion and full model report are not selected as premises. Repository-wide absence remains unestablished. This is Work's review, not a model correction. Receipt: ${result.receipt.receipt_id} ${result.receipt.integrity.fingerprint}; observation: ${result.run.steps[1].output.observation_fingerprint}; entry.ts:1-2 ${readSourceReview(readProjectRunResultSourceBindingV01(f.db, { ...f.scope, receipt_id: result.receipt.receipt_id }).packet!).files[0]!.digest}.` } : note;
  const comparison = (await f.continuity({ action: "compare_result_work_sources", binding: prep.binding, notes: [selectedNote] })).comparison;
  const preview = await f.continuity({ action: "preview_result_work", binding: prep.binding,
    definition: { goal: "Check the remaining connection using the attributed prior review", success_criteria: ["Keep the review's uncertainty and inspect the missing connection"], non_goals: ["Do not accept the model recommendation as truth or execution permission"] },
    selected_sources: { selected_source_context: comparison.entries, expected_source_comparison: comparison.fingerprint,
      omitted_sources: comparison.unselected_previous.map((row: any) => ({ source_binding: row.source_ref, reason: "The predecessor question is historical; this distinct task explicitly selects its result." })) } });
  assert.equal(preview.writes, 0);
  const before = canonical(listVNextCoreRecordsV01(f.db, { ...f.scope, record_kinds: ["capability_grant"], limit: 128 }));
  await f.continuity({ action: "prepare_result_work", request: preview.request }, 401, { cookie: "" });
  const next = await f.continuity({ action: "prepare_result_work", request: preview.request }, 201);
  assert.equal(next.execution_authority_granted, false); assert.equal(next.run_created, false); assert.equal(next.semantic_state_changed, false);
  const record = listVNextCoreRecordsV01(f.db, { ...f.scope, record_kinds: ["task_context_packet"], limit: 128 }).find(r => r.record_id === next.packet_id)!;
  const packet = record.payload as any;
  assert.equal(packet.capability_grant, null); assert.notEqual(packet.packet_id, f.preview.packet_id);
  assert.equal(readProjectWorkInitializationV01(f.db, f.config).current_packet?.packet_id, packet.packet_id);
  assert.equal(readSelectedWorkSources(packet).length, 1); assert.deepEqual(selectedWorkSourceInput(readSelectedWorkSources(packet)[0]!), selectedNote);
  assert.equal(packet.selected_context.find((e: any) => e.entry_id === `successor-predecessor:${result.receipt.receipt_id}`).bounded_summary,
    "Recorded execution: completed; verification: not_run. No proposal acceptance is implied.");
  assert.equal(canonical(listVNextCoreRecordsV01(f.db, { ...f.scope, record_kinds: ["capability_grant"], limit: 128 })), before);
  await f.call({ action: "authorize_and_run", authorization: f.preview }, 409);
  await f.call({ action: "continue", run_id: result.run.run_id }); assert.equal(f.calls, expectedCalls, "The predecessor grant never executes the successor");
  validateRecoveryCanonicalDatabaseV01(f.db);
}
function originalClaimSteps(run: any) {
  return run.steps.map((step: any) => {
    if (!step.output.disposed_claim_generation) return step;
    const { disposed_claim_generation, ...retained } = step.output;
    return { ...step, output: { ...retained, generation: disposed_claim_generation } };
  });
}
async function recoveryBackup(f: Awaited<ReturnType<typeof fixture>>, name: string) {
  return await (createRecoveryBackup as unknown as (input: {
      databasePath: string; backupDirectory: string; applicationScopeFingerprint: string;
      sourceApplication: { application_version: string; build_identity: string; package_contract: string; package_contract_version: number; runtime_contract: string; runtime_schema_version: number };
      reason: string; inspectDatabase: typeof inspectRecoveryDatabaseFile; now: () => Date;
    }) => Promise<{ backupPath: string }>)({ databasePath: f.config.database_path, backupDirectory: path.join(root, `backups-${name}`), applicationScopeFingerprint: "a".repeat(64),
      sourceApplication: { application_version: "0.1.1", build_identity: hash("stateless-development"), package_contract: "augnes.distributable.v1", package_contract_version: 1, runtime_contract: "augnes-local-runtime-supervisor-v1", runtime_schema_version: 2 },
      reason: "manual_recovery", inspectDatabase: inspectRecoveryDatabaseFile, now: () => new Date(f.now()) });
}
const pricing = { input_nano_usd_per_byte: 1000, output_nano_usd_per_token: 1000, maximum_total_nano_usd: 100_000_000, source_version: "scripted-test-price-not-live-authority" };
const replacementMaterial = { question: "Re-examine this bounded entrypoint while retaining the predecessor's unknown effects", files: [{ path: "entry.ts", start_line: 1, end_line: 2 }] };
async function directionDispositionContract() {
  for (const mode of ["unchanged", "changed", "unselected"] as const) {
    const f = await fixture(`disposition-direction-${mode}`);
    let direction: any;
    const decide = (expected_ref: string | null, purpose: string) => f.direction({ action: "decide", expected_ref,
      content: { purpose, criteria: [], constraints: [] }, reason: "Explicit project direction for this source review", status: "active", proposal_ref: null });
    if (mode !== "unselected") {
      direction = await decide(null, "Review the selected entrypoint and retain uncertainty");
      await f.direction({ action: "prepare_inspection", expected_ref: direction.record.ref, files: [{ path: "entry.ts", contains: "advisory" }] });
    }
    const authorization = (await f.call({ action: "preview", pricing })).authorization;
    f.loseDispatch();
    const lost = (await f.call({ action: "authorize_and_run", authorization })).result;
    assert.equal(lost.stage, "dispatch_outcome_unknown");
    const ended = (await f.call({ action: "end_work", binding: lost.disposition_preparation.binding })).result;
    const history = canonical(ended.run);
    if (mode === "changed") await decide(direction.record.ref, "A different direction requires explicit reconsideration");
    if (mode === "unselected") await decide(null, "This effective direction has not been selected by the historical packet");
    const records = () => canonical({ packets: listVNextCoreRecordsV01(f.db, { ...f.scope, record_kinds: ["task_context_packet"], limit: 128 }),
      directions: f.db.prepare("SELECT * FROM vnext_project_direction_records ORDER BY ref").all() });
    const before = records();
    const linked = await f.call({ action: "prepare_linked_work", disposition: { run_id: lost.run.run_id,
      disposition_fingerprint: ended.run.metadata.stateless_review_disposition.fingerprint }, material: replacementMaterial }, mode === "unchanged" ? 200 : 409);
    if (mode === "unchanged") {
      const packet = listVNextCoreRecordsV01(f.db, { ...f.scope, record_kinds: ["task_context_packet"], limit: 128 }).find(r => r.record_id === linked.result.packet_id)!.payload as any;
      assert.equal(packetDirectionBinding(f.db, packet)!.value.direction_ref, direction.record.ref);
      assert.equal(readPacketDirectionInterpretation(f.db, packet, f.now()).status, "current");
      assert.equal(packet.capability_grant, null);
      validateRecoveryCanonicalDatabaseV01(f.db);
    } else {
      assert.equal(records(), before, "Rejected direction leaves neither a partial packet nor a binding");
    }
    assert.equal(canonical(f.host(lost.run.run_id).read().run), history); assert.equal(f.calls, 1);
  }
}
async function dispositionContract() {
  const f = await fixture("disposition-ordinary");
  const unselected = { source: "Earlier unrelated working note", observed_at: f.now(), provenance: "imported_unverified", label: "Unclassified / needs review", text: "UNSELECTED_PREDECESSOR_NOTE: a different hypothesis, not selected for the later task." };
  await selectOrdinaryNotes(f, [...currentNotes(f), unselected]);
  f.preview = (await f.call({ action: "preview", pricing: notePricing })).authorization;
  f.loseDispatch();
  const lost = (await f.call({ action: "authorize_and_run", authorization: f.preview })).result;
  assert.equal(lost.stage, "dispatch_outcome_unknown"); assert.equal(f.calls, 1);
  const beforeSteps = canonical(lost.run.steps), grantsBefore = canonical(listVNextCoreRecordsV01(f.db, { ...f.scope, record_kinds: ["capability_grant"], limit: 128 }));
  const binding = lost.disposition_preparation.binding;
  // Optional diagnostics are not eligibility or outcome evidence. A pure legacy
  // projection removes only that additive field; no database/grant is repaired.
  const legacy = structuredClone(lost.run); delete legacy.steps[0].output.transport_failure_observation;
  assert.ok(readStatelessDispositionPreparation(f.db, f.scope, legacy));
  const wrongClass = structuredClone(lost.run); wrongClass.autonomy_contract_ref = "managed_live";
  assert.equal(readStatelessDispositionPreparation(f.db, f.scope, wrongClass), null);
  await f.call({ action: "end_work", binding }, 401, { cookie: "" });
  await f.call({ action: "end_work", binding }, 409, {}, `project:${randomUUID()}`);
  await f.call({ action: "end_work", binding: { ...binding, generation: "another-controller" } }, 409);
  await f.call({ action: "prepare_linked_work", disposition: { run_id: lost.run.run_id, disposition_fingerprint: hash("not-a-disposition") }, material: replacementMaterial }, 409);
  const active = readActiveProjectSelectionV01(f.db, f.scope.workspace_id)!;
  mutateProjectControlV01(f.db, { ...f.scope, action: "disable_automation", expected_active_project_id: f.scope.project_id, expected_active_selection_revision: active.selection_revision, expected_control_revision: 1 }, { now: f.now });
  f.tick(600_001); rmSync(path.join(f.projectRoot, "entry.ts"));
  renameSync(f.projectRoot, `${f.projectRoot}-offline`);
  // Both requests authenticate before their asynchronous body read. Only one
  // current nonce may commit; then an explicit identical fresh submission is safe.
  const concurrent = await Promise.all([f.call({ action: "end_work", binding }, [200, 409]), f.call({ action: "end_work", binding }, [200, 409])]);
  assert.equal(concurrent.filter(v => v.ok).length, 1);
  assert.equal(concurrent.find(v => !v.ok).error, "operator_action_nonce_invalid");
  const ended = (await f.call({ action: "end_work", binding })).result;
  assert.equal(ended.stage, "ended_effects_unknown"); assert.equal(ended.run.metadata.reconciliation_required, true);
  assert.equal(canonical(originalClaimSteps(ended.run)), beforeSteps);
  assert.notEqual(ended.run.steps[0].output.generation, binding.generation, "Even a generation-only old controller is fenced"); assert.equal(ended.receipt, null);
  assert.equal(ended.run.events.filter((e: any) => e.payload.version === "stateless_model_request_disposition.v0.1").length, 1);
  await f.call({ action: "end_work", binding: { ...binding, expected_revision: binding.expected_revision + 1 } }, 409);
  await f.call({ action: "continue", run_id: lost.run.run_id }); assert.equal(f.calls, 1);
  assert.equal(canonical(listVNextCoreRecordsV01(f.db, { ...f.scope, record_kinds: ["capability_grant"], limit: 128 })), grantsBefore);
  const childInput = path.join(root, "disposition-read.json");
  writeFileSync(childInput, JSON.stringify({ config: f.config, run_id: lost.run.run_id, at: f.now(), step_fingerprint: hash(beforeSteps), disposition_fingerprint: ended.run.metadata.stateless_review_disposition.fingerprint }));
  const child = spawnSync(process.execPath, ["--import", "tsx", "scripts/test-stateless-source-review.ts", "--read-disposition", childInput], { cwd: process.cwd(), env: { ...process.env, OPENAI_API_KEY: "" }, encoding: "utf8", timeout: 30_000 });
  assert.equal(child.status, 0, child.stderr); assert.equal(JSON.parse(child.stdout.trim()).provider_calls, 0);
  const link = { run_id: lost.run.run_id, disposition_fingerprint: ended.run.metadata.stateless_review_disposition.fingerprint };
  renameSync(`${f.projectRoot}-offline`, f.projectRoot);
  await f.call({ action: "prepare_linked_work", disposition: link, material: replacementMaterial }, 409);
  writeFileSync(path.join(f.projectRoot, "entry.ts"), sourceText);
  const linked = (await f.call({ action: "prepare_linked_work", disposition: link, material: replacementMaterial })).result;
  assert.equal(f.calls, 1); assert.notEqual(linked.packet_id, f.preview.packet_id); assert.equal(linked.authorized, false);
  const saved = readProjectWorkInitializationV01(f.db, f.config);
  assert.equal(saved.current_packet?.packet_id, linked.packet_id); assert.equal(saved.current_packet?.lineage_kind, "stateless_review_replacement");
  assert.equal(canonical(listVNextCoreRecordsV01(f.db, { ...f.scope, record_kinds: ["capability_grant"], limit: 128 })), grantsBefore);
  const packet = listVNextCoreRecordsV01(f.db, { ...f.scope, record_kinds: ["task_context_packet"], limit: 128 }).find(r => r.record_id === linked.packet_id)!.payload as any;
  assert.equal(packet.capability_grant, null); assert.equal(statelessUnresolvedEntries(packet).length, 1);
  assert.ok(statelessUnresolvedEntries(packet)[0]!.bounded_summary!.includes("cost remain unknown"));
  assert.equal((await f.call({ action: "prepare_linked_work", disposition: link, material: replacementMaterial })).result.packet_id, linked.packet_id);
  await f.call({ action: "prepare_linked_work", disposition: link, material: { ...replacementMaterial, question: "Competing definition" } }, 409);
  assert.equal((await f.call()).preparation.packet_id, linked.packet_id);
  assert.equal(hasUnsettledAutonomyRunLedgerRecords({ db: f.db, scope: f.scope.project_id }), true, "The shared default does not settle or ignore disposed runs");
  assertStatelessUnsettledAdmission(f.db, f.scope, packet);
  const backup = await recoveryBackup(f, "disposed-linked");
  const recoveryCopy = new Database(path.join(backup.backupPath, RECOVERY_DATABASE_PAYLOAD));
  try {
    assert.equal(validateRecoveryCanonicalDatabaseV01(recoveryCopy).status, "valid");
    assert.throws(() => assertStatelessUnsettledAdmission(recoveryCopy, f.scope, packet), "Recovered disposition is readable but cannot waive execution suspension");
  } finally { recoveryCopy.close(); }

  // Isolated negative/legacy admission matrices use copies only. They never
  // create positive execution authority, change the ordinary fixture or repair it.
  for (const [metadata, expected] of [
    ['{"reconciliation_required":true}', true], ['{"reconciliation_required":null}', true], ['{"reconciliation_required":"false"}', true],
    ['{', true], ['[]', true], ['{}', false], ['{"reconciliation_required":false}', false],
  ] as const) {
    const copy = new Database(f.db.serialize());
    try {
      insertAutonomyRunLedgerRecord({ ...lost.run, run_id: "unrelated-run", status: "completed", metadata: {} }, [], [], { db: copy });
      copy.prepare("UPDATE autonomy_runs SET metadata_json=? WHERE run_id='unrelated-run'").run(metadata);
      if (expected) assert.throws(() => assertStatelessUnsettledAdmission(copy, f.scope, packet));
      else assertStatelessUnsettledAdmission(copy, f.scope, packet);
      assert.equal((copy.prepare("SELECT metadata_json FROM autonomy_runs WHERE run_id='unrelated-run'").get() as any).metadata_json, metadata);
    } finally { copy.close(); }
  }
  for (const field of ["stateless_review_disposition", "reconciliation_required"]) {
    const copy = new Database(f.db.serialize());
    try {
      copy.prepare("UPDATE autonomy_runs SET metadata_json=json_remove(metadata_json, ?) WHERE run_id=?").run(`$.${field}`, lost.run.run_id);
      assert.throws(() => assertStatelessUnsettledAdmission(copy, f.scope, packet), "Missing exact disposition proof cannot be excluded");
    } finally { copy.close(); }
  }
  const malformedPath = path.join(root, "malformed-disposition.db");
  writeFileSync(malformedPath, f.db.serialize());
  const malformed = new Database(malformedPath);
  try {
    // Negative copy only: malformed metadata must not become a valid work
    // decision in the reader, let alone admission authority.
    malformed.prepare("UPDATE autonomy_runs SET metadata_json=json_set(metadata_json, '$.stateless_review_disposition', 'invalid') WHERE run_id=?").run(lost.run.run_id);
    const host = new StatelessSourceReviewHost({ config: { ...f.config, database_path: malformedPath }, now: f.now, adapter: f.adapter }, lost.run.run_id);
    assert.equal((await host.run()).stage, "disposition_invalid");
    assert.equal(host.read().disposition_preparation, null); assert.equal(f.calls, 1);
    assert.throws(() => assertStatelessUnsettledAdmission(malformed, f.scope, packet));
  } finally { malformed.close(); }

  await f.call({ action: "preview", pricing }, 409); // disabled control still gates fresh execution
  const control = readProjectAutomationControlV01(f.db, f.scope)!;
  mutateProjectControlV01(f.db, { ...f.scope, action: "enable_automation", expected_active_project_id: f.scope.project_id, expected_active_selection_revision: active.selection_revision, expected_control_revision: control.revision }, { now: f.now });
  const fresh = (await f.call({ action: "preview", pricing })).authorization;
  assert.notEqual(fresh.packet_id, f.preview.packet_id); assert.equal(fresh.cost_budget.maximum_permitted_cost, f.preview.cost_budget.maximum_permitted_cost);
  await f.call({ action: "authorize_and_run", authorization: f.preview }, 409);
  writeFileSync(path.join(f.projectRoot, "entry.ts"), "changed\n");
  await f.call({ action: "authorize_and_run", authorization: fresh }, 409); assert.equal(f.calls, 1);
  writeFileSync(path.join(f.projectRoot, "entry.ts"), sourceText);
  f.controls.lose = false;
  const replacement = (await f.call({ action: "authorize_and_run", authorization: fresh })).result;
  assert.equal(replacement.run.status, "completed", replacement.run.stop_reason); assert.equal(f.calls, 3);
  assert.notEqual(replacement.run.run_id, lost.run.run_id); assert.notEqual(replacement.run.metadata.stateless_review.grant_id, lost.run.metadata.stateless_review.grant_id);
  assert.ok(f.inputs[1].unresolved_predecessors[0].includes(lost.run.run_id));
  assert.equal(canonical(originalClaimSteps(f.host(lost.run.run_id).read().run)), beforeSteps);
  await ordinarySuccessor(f, replacement, 3, true);
  const successorId = readProjectWorkInitializationV01(f.db, f.config).current_packet!.packet_id;
  const successor = listVNextCoreRecordsV01(f.db, { ...f.scope, record_kinds: ["task_context_packet"], limit: 128 }).find(r => r.record_id === successorId)!.payload as any;
  assert.equal(successor.capability_grant, null); assert.deepEqual(statelessUnresolvedEntries(successor), statelessUnresolvedEntries(packet));
  validateRecoveryCanonicalDatabaseV01(f.db);
  const endedHistory = canonical(f.host(lost.run.run_id).read().run);
  const nextMaterial = { question: "Which remaining entrypoint connection is supported by this next source review?", files: [{ path: "entry.ts", start_line: 2, end_line: 2 }] };
  const authorityBeforeRevision = canonical(listVNextCoreRecordsV01(f.db, { ...f.scope, record_kinds: ["capability_grant"], limit: 128 }));
  const revised = (await f.call({ action: "prepare", material: nextMaterial })).result;
  assert.equal(revised.authorized, false); assert.equal(f.calls, 3);
  assert.equal(canonical(listVNextCoreRecordsV01(f.db, { ...f.scope, record_kinds: ["capability_grant"], limit: 128 })), authorityBeforeRevision);
  const chain = inspectCurrentOrdinarySuccessorRevisionChainV01(f.db, f.scope, f.now())!;
  assert.equal(chain.tip_packet.packet_id, revised.packet_id); assert.equal(chain.projection_current, true);
  assert.equal(chain.tip_packet.capability_grant, null); assert.equal(chain.revision_count, 1);
  assert.deepEqual(statelessUnresolvedEntries(chain.tip_packet), statelessUnresolvedEntries(packet));
  assert.equal(readSourceReview(chain.tip_packet).question, nextMaterial.question);
  assert.equal(ordinarySuccessorRevisionExecutionBlockedV01(f.db, f.scope, chain), false);
  assert.equal(hasUnsettledAutonomyRunLedgerRecords({ db: f.db, scope: f.scope.project_id }), true);
  const preparedNotes = (await f.call()).preparation;
  assert.equal(preparedNotes.packet_id, revised.packet_id);
  assert.deepEqual(preparedNotes.selected_notes, readStatelessSelectedNotes(chain.tip_packet));
  assert.equal(preparedNotes.selected_notes.notes.length, 1);
  assert.ok(!canonical(preparedNotes.selected_notes).includes(unselected.text));
  assert.ok(!canonical(chain.tip_packet.task).includes(preparedNotes.selected_notes.notes[0].text), "Delivery cannot be faked by copying the review into the task");
  await f.call({ action: "prepare", material: nextMaterial }, 409, {}, `project:${randomUUID()}`);
  await assert.rejects(() => runDirectNativeHostRoundTripV01(f.db, { config: f.config, mode: "interactive" }, { now: f.now }),
    /direct_host_(run_conflict|unresolved_stateless_effects)/, "Zero-model revision supplies no generic/native execution exception");
  validateRecoveryCanonicalDatabaseV01(f.db);

  const revisionRead = path.join(root, "successor-revision-read.json");
  writeFileSync(revisionRead, JSON.stringify({ config: f.config, run_id: lost.run.run_id, at: f.now(), step_fingerprint: hash(beforeSteps),
    disposition_fingerprint: link.disposition_fingerprint, packet_id: revised.packet_id, unresolved_context: statelessUnresolvedEntries(packet), question: nextMaterial.question, selected_notes: preparedNotes.selected_notes }));
  const reopened = spawnSync(process.execPath, ["--import", "tsx", "scripts/test-stateless-source-review.ts", "--read-disposition", revisionRead],
    { cwd: process.cwd(), env: { ...process.env, OPENAI_API_KEY: "" }, encoding: "utf8", timeout: 30_000 });
  assert.equal(reopened.status, 0, reopened.stderr); assert.equal(JSON.parse(reopened.stdout.trim()).successor_revision_read, true);
  const revisionBackup = await recoveryBackup(f, "successor-revised"), revisionRecovery = new Database(path.join(revisionBackup.backupPath, RECOVERY_DATABASE_PAYLOAD));
  try {
    assert.equal(validateRecoveryCanonicalDatabaseV01(revisionRecovery).status, "valid");
    const recoveredChain = inspectCurrentOrdinarySuccessorRevisionChainV01(revisionRecovery, f.scope, f.now())!;
    assert.deepEqual(statelessUnresolvedEntries(recoveredChain.tip_packet), statelessUnresolvedEntries(packet));
    assert.equal(ordinarySuccessorRevisionExecutionBlockedV01(revisionRecovery, f.scope, recoveredChain), true, "Recovery suspension cannot supply the revision exception");
  } finally { revisionRecovery.close(); }
  // Negative/legacy truth-table copies only; no positive path is repaired.
  for (const [metadata, blocked] of [
    ['{"reconciliation_required":true}', true], ['{"reconciliation_required":null}', true], ['{"reconciliation_required":"false"}', true],
    ['{', true], ['[]', true], ['{}', false], ['{"reconciliation_required":false}', false],
  ] as const) {
    const copy = new Database(f.db.serialize());
    try {
      insertAutonomyRunLedgerRecord({ ...lost.run, run_id: "unrelated-revision-run", status: "completed", metadata: {} }, [], [], { db: copy });
      copy.prepare("UPDATE autonomy_runs SET metadata_json=? WHERE run_id='unrelated-revision-run'").run(metadata);
      assert.equal(ordinarySuccessorRevisionExecutionBlockedV01(copy, f.scope, chain), blocked);
      assert.equal((copy.prepare("SELECT metadata_json FROM autonomy_runs WHERE run_id='unrelated-revision-run'").get() as any).metadata_json, metadata);
    } finally { copy.close(); }
  }
  for (const field of ["stateless_review_disposition", "reconciliation_required"]) {
    const copy = new Database(f.db.serialize());
    try {
      copy.prepare("UPDATE autonomy_runs SET metadata_json=json_remove(metadata_json, ?) WHERE run_id=?").run(`$.${field}`, lost.run.run_id);
      assert.equal(ordinarySuccessorRevisionExecutionBlockedV01(copy, f.scope, chain), true);
    } finally { copy.close(); }
  }

  await f.call({ action: "authorize_and_run", authorization: f.preview }, 409);
  await f.call({ action: "authorize_and_run", authorization: fresh }, 409);
  await f.call({ action: "continue", run_id: lost.run.run_id });
  await f.call({ action: "continue", run_id: replacement.run.run_id }); assert.equal(f.calls, 3);
  const nextAuthorization = (await f.call({ action: "preview", pricing })).authorization;
  assert.equal(nextAuthorization.packet_id, revised.packet_id);
  assert.notEqual(nextAuthorization.packet_fingerprint, fresh.packet_fingerprint);
  assert.equal(nextAuthorization.selected_notes_ref, preparedNotes.selected_notes.fingerprint);
  const { selected_notes_ref: _notesRef, ...oldProjectionPreview } = nextAuthorization;
  await f.call({ action: "authorize_and_run", authorization: oldProjectionPreview }, 409);
  await f.call({ action: "authorize_and_run", authorization: { ...nextAuthorization, selected_notes_ref: hash("unreviewed notes") } }, 409);
  assert.equal(canonical(listVNextCoreRecordsV01(f.db, { ...f.scope, record_kinds: ["capability_grant"], limit: 128 })), authorityBeforeRevision);
  assert.equal(f.calls, 3);
  const nextRun = (await f.call({ action: "authorize_and_run", authorization: nextAuthorization })).result;
  assert.equal(nextRun.run.status, "completed", nextRun.run.stop_reason); assert.equal(f.calls, 5);
  assert.notEqual(nextRun.run.run_id, replacement.run.run_id);
  assert.notEqual(nextRun.run.metadata.stateless_review.grant_id, replacement.run.metadata.stateless_review.grant_id);
  assert.notEqual(nextRun.run.metadata.stateless_review.grant_id, lost.run.metadata.stateless_review.grant_id);
  assert.equal(nextRun.run.metadata.reconciliation_required, false);
  for (const input of f.inputs.slice(3)) {
    assert.ok(input.unresolved_predecessors[0].includes(lost.run.run_id));
    assert.equal(input.selected_work_notes.notes.length, 1, "Both serialized requests must carry the explicitly selected review note");
    assert.deepEqual(input.selected_work_notes, preparedNotes.selected_notes);
    assert.equal(input.selected_work_notes.notes[0].provenance, "derived_interpretation");
    assert.ok(input.selected_work_notes_boundary.includes("not instructions"));
    assert.ok(!canonical(input).includes(unselected.text));
    assert.ok(!canonical(input).includes("Host report (not independently verified):"));
    assert.ok(input.selected_work_notes.notes[0].text.includes(replacement.receipt.receipt_id));
  }
  assert.equal(f.serializedRequests.slice(3).length, 2);
  for (const body of f.serializedRequests.slice(3)) assert.ok(Buffer.byteLength(body) <= nextAuthorization.limits.input_bytes);
  assert.equal(f.inputs[4].observation.sources[0].text, sourceText.trimEnd().split("\n")[1]);
  assert.equal(canonical(f.host(lost.run.run_id).read().run), endedHistory, "New work does not change the old unknown claim, receipt or disposition");
  assert.equal(f.host(lost.run.run_id).read().run.metadata.reconciliation_required, true);
  assert.equal(canonical(originalClaimSteps(f.host(lost.run.run_id).read().run)), beforeSteps);
  assert.equal(ordinarySuccessorRevisionExecutionBlockedV01(f.db, f.scope, chain), true, "A grant/run admitted on this work still prevents revision");
  const packetsAfterExecution = canonical(listVNextCoreRecordsV01(f.db, { ...f.scope, record_kinds: ["task_context_packet"], limit: 128 }));
  await f.call({ action: "prepare", material: { ...nextMaterial, question: "Cannot revise already issued work" } }, 409);
  assert.equal(canonical(listVNextCoreRecordsV01(f.db, { ...f.scope, record_kinds: ["task_context_packet"], limit: 128 })), packetsAfterExecution);
  validateRecoveryCanonicalDatabaseV01(f.db);

  // Independent ordinary race: end a live dispatched model claim, prepare and
  // complete its replacement before releasing the original response.
  const late = await fixture("disposition-late-response"); const authorized = late.authorizeOnly();
  let entered!: () => void, release!: () => void;
  const arrived = new Promise<void>(r => { entered = r; }), pending = new Promise<void>(r => { release = r; });
  let held = false;
  late.controls.dispatch = async () => { if (!held) { held = true; entered(); await pending; } };
  const host = late.host(authorized.run_id), resultPromise = host.step().then(() => null, e => e);
  try {
    await arrived;
    const inflight = host.read(); assert.ok(inflight.disposition_preparation);
    const end = (await late.call({ action: "end_work", binding: inflight.disposition_preparation!.binding })).result;
    const before = canonical(end.run.steps);
    await late.call({ action: "prepare_linked_work", disposition: { run_id: authorized.run_id, disposition_fingerprint: end.run.metadata.stateless_review_disposition.fingerprint }, material: replacementMaterial });
    const preview = (await late.call({ action: "preview", pricing })).authorization;
    const completed = (await late.call({ action: "authorize_and_run", authorization: preview })).result;
    assert.equal(completed.run.status, "completed"); const finished = canonical(completed.run);
    release(); assert.match(String(await resultPromise), /stale_generation_result_refused/);
    const read = host.read(); assert.equal(read.stage, "ended_effects_unknown"); assert.equal(canonical(read.run.steps), before); assert.equal(read.receipt, null);
    assert.equal(read.run.metadata.reconciliation_required, true); assert.equal(late.calls, 3);
    const event = read.run.events.find(e => e.payload.profile === "stateless_late_model_receipt.v0.1")!;
    assert.ok(event); assert.equal((event.payload.model_receipt as any).usage.input_tokens, 200);
    const lateEvidence = read.failures.find(r => r.availability === "available" && r.evidence.code === "work_ended");
    assert.ok(lateEvidence?.availability === "available"); assert.equal(lateEvidence.evidence.layer, "fencing");
    assert.equal(lateEvidence.evidence.public_result.availability, "complete");
    assert.equal(event.payload.judgment, undefined); assert.equal(canonical(late.host(completed.run.run_id).read().run), finished);
    await late.call({ action: "continue", run_id: authorized.run_id }); assert.equal(late.calls, 3);
    // Later receipt evidence does not invalidate the exact historical decision.
    assert.ok(host.read().disposition_preparation?.disposition);
  } finally { release(); await resultPromise; }

  const second = await fixture("disposition-second-judgment-loss");
  const secondRun = second.authorizeOnly(), secondHost = second.host(secondRun.run_id);
  await secondHost.step(); await secondHost.step();
  const completedSteps = canonical(secondHost.read().run.steps.slice(0, 2));
  second.loseDispatch();
  const secondLost = (await second.call({ action: "continue", run_id: secondRun.run_id })).result;
  assert.equal(secondLost.stage, "dispatch_outcome_unknown"); assert.equal(second.calls, 2);
  assert.equal(secondLost.disposition_preparation.binding.step_id, `${secondRun.run_id}.conclude`);
  const secondEnded = (await second.call({ action: "end_work", binding: secondLost.disposition_preparation.binding })).result;
  assert.equal(secondEnded.stage, "ended_effects_unknown"); assert.equal(secondEnded.receipt, null);
  await second.call({ action: "continue", run_id: secondRun.run_id });
  assert.equal(second.calls, 2); assert.equal(canonical(secondHost.read().run.steps.slice(0, 2)), completedSteps);

  const stale = await fixture("disposition-stale-decision"); stale.loseDispatch();
  const staleRun = (await stale.call({ action: "authorize_and_run", authorization: stale.preview })).result;
  await stale.call({ action: "cancel", run_id: staleRun.run.run_id });
  await stale.call({ action: "end_work", binding: staleRun.disposition_preparation.binding }, 409);
  assert.equal(stale.host(staleRun.run.run_id).read().stage, "dispatch_outcome_unknown");
  assert.equal(stale.calls, 1);
}
async function readDispositionChild(filename: string) {
  try {
    const { config, run_id, at, step_fingerprint, disposition_fingerprint, packet_id, unresolved_context, question, selected_notes } = JSON.parse(readFileSync(filename, "utf8"));
    const script = scripted(), host = new StatelessSourceReviewHost({ config, now: () => at, adapter: script.adapter }, run_id);
    const read = await host.run(); assert.equal(read.stage, "ended_effects_unknown"); assert.equal(read.run.metadata.reconciliation_required, true);
    assert.equal(hash(canonical(originalClaimSteps(read.run))), step_fingerprint); assert.equal(read.disposition_preparation!.disposition!.fingerprint, disposition_fingerprint);
    if (packet_id) {
      const db = new Database(config.database_path);
      try {
        const chain = inspectCurrentOrdinarySuccessorRevisionChainV01(db, config, at)!;
        assert.equal(chain.tip_packet.packet_id, packet_id); assert.equal(chain.projection_current, true);
        assert.deepEqual(statelessUnresolvedEntries(chain.tip_packet), unresolved_context);
        assert.equal(readSourceReview(chain.tip_packet).question, question); assert.equal(chain.tip_packet.capability_grant, null);
        if (selected_notes) assert.deepEqual(readStatelessSelectedNotes(chain.tip_packet), selected_notes);
        validateRecoveryCanonicalDatabaseV01(db);
      } finally { db.close(); }
    }
    assert.equal(script.calls, 0); assert.equal(requests, 0); console.log(JSON.stringify({ provider_calls: 0, decision_and_uncertainty_retained: true, successor_revision_read: !!packet_id }));
  } finally { rmSync(root, { recursive: true, force: true }); network.unsubscribe(onNetwork); }
}

async function selectedNoteBoundsContract() {
  for (const stage of ["choose", "conclude"] as const) {
    const f = await fixture(`selected-note-overflow-${stage}`);
    const notes = Array.from({ length: stage === "choose" ? 5 : 1 }, (_, i) => ({ source: `Bounded overflow source ${i}`, observed_at: f.now(),
      provenance: "derived_interpretation", label: "Open question", text: "N".repeat(1800) }));
    await selectOrdinaryNotes(f, [...currentNotes(f), ...notes]);
    if (stage === "conclude") {
      writeFileSync(path.join(f.projectRoot, "entry.ts"), "//" + "source ".repeat(565) + "\n");
      await f.call({ action: "prepare", material: { question: "Inspect this selected line with the attributed note", files: [{ path: "entry.ts", start_line: 1, end_line: 1 }] } });
    }
    const prepared = (await f.call()).preparation;
    assert.equal(prepared.selected_notes.notes.length, notes.length, "Preparation never silently drops an overflowing note");
    const authorization = (await f.call({ action: "preview", pricing: notePricing })).authorization;
    const result = (await f.call({ action: "authorize_and_run", authorization })).result;
    assert.equal(result.run.status, "stopped"); assert.equal(result.run.stop_reason, "model_input_bound_before_dispatch");
    assert.equal(f.calls, stage === "choose" ? 0 : 1, "The overflowing judgment never reaches the scripted transport");
    assert.equal(result.run.steps[stage === "choose" ? 0 : 2].status, "planned");
    assert.equal(result.run.steps.some((s: any) => s.status === "running"), false); assert.equal(result.receipt, null);
    assert.deepEqual((await f.call({ action: "continue", run_id: result.run.run_id })).result.run, result.run);
    assert.equal(f.calls, stage === "choose" ? 0 : 1);
  }
  const stale = await fixture("selected-note-stale-preview");
  const stalePreview = stale.preview;
  await selectOrdinaryNotes(stale, [...currentNotes(stale), { source: "New selection", observed_at: stale.now(), provenance: "derived_interpretation", label: "Open question", text: "This newly selected note needs fresh data authority." }]);
  await stale.call({ action: "authorize_and_run", authorization: stalePreview }, 409); assert.equal(stale.calls, 0);
  assert.equal(listVNextCoreRecordsV01(stale.db, { ...stale.scope, record_kinds: ["capability_grant"], limit: 128 }).length, 0);
}

async function rejectionEvidenceContract() {
  const readbacks: unknown[] = [];
  for (const kind of ["rationale", "anchor", "unavailable", "content_bound", "persistence"] as const) {
    const f = await fixture(`rejection-${kind}`, kind === "unavailable" ? "no_action" : "read_selected_sources");
    const expected = { rationale: "rationale_bound_exceeded", anchor: "source_anchor_missing", unavailable: "observation_unavailable", content_bound: "one_judgment_required", persistence: "result_persistence_failed" }[kind];
    f.controls.transform = (output, input) => {
      if (kind === "rationale" && input.stage === "conclude") output.recommendations[0].rationale = "é".repeat(601);
      if (kind === "anchor") output.recommendations[0].grounded_state_keys = ["unrelated-source"];
      if (kind === "content_bound") {
        output.recommendations[0].rationale = "x".repeat(4096);
        output.recommendations.push({ ...output.recommendations[0] });
      }
    };
    // Explicit isolated storage fault, never fabricated positive state or grants.
    if (kind === "persistence") f.db.exec("CREATE TRIGGER refuse_scripted_result BEFORE UPDATE ON autonomy_run_steps WHEN NEW.status='completed' BEGIN SELECT RAISE(ABORT,'private_sqlite_error_not_for_public_evidence'); END");
    const result = (await f.call({ action: "authorize_and_run", authorization: f.preview })).result;
    const calls = ["rationale", "unavailable"].includes(kind) ? 2 : 1;
    assert.equal(f.calls, calls); assert.equal(result.run.status, "stopped"); assert.equal(result.receipt, null);
    assert.equal(result.disposition_preparation, null, "Unknown-outcome disposition cannot be used for a known rejected result");
    assert.equal(result.terminal_preparation === null, kind === "persistence", "Known persistence failures need a separate contract");
    const failed = result.run.steps.find((s: any) => s.status === "failed");
    assert.equal(failed.output.judgment, undefined, "Rejected advice is not the applied step output");
    assert.equal(failed.output.dispatch_outcome, kind === "persistence" ? "returned_unapplied" : "returned_invalid");
    assert.equal(failed.output.failure_receipt.status, "completed", "Gateway returned a normalized result before host rejection");
    const review = (await f.call()).reviews[0].failures[0], evidence = review.evidence;
    assert.equal(review.availability, "available"); assert.equal(evidence.code, expected);
    assert.equal(evidence.layer, kind === "persistence" ? "result_persistence" : "host_validation");
    assert.equal(evidence.binding.packet_id, f.preview.packet_id); assert.equal(evidence.binding.packet_fingerprint, f.preview.packet_fingerprint);
    assert.equal(evidence.binding.input_fingerprint, failed.output.input_fingerprint); assert.equal(evidence.binding.generation, failed.output.generation);
    assert.equal(evidence.binding.invocation_id, failed.step_id); assert.equal(evidence.binding.receipt_fingerprint, hash(canonical(failed.output.failure_receipt)));
    assert.equal(evidence.binding.review_ref, f.preview.review_ref); assert.equal(evidence.binding.selected_notes_ref, f.preview.selected_notes_ref);
    assert.ok(Buffer.byteLength(canonical(evidence)) <= STATELESS_FAILURE_BOUNDS.record_bytes);
    if (kind === "rationale") { assert.equal(evidence.validation.rationale_bytes, 1202); assert.equal(evidence.validation.rationale_limit_bytes, 1200); assert.equal(evidence.stage, "conclude"); }
    if (kind === "anchor") assert.equal(evidence.validation.source_anchor_present, false);
    if (kind === "unavailable") { assert.equal(evidence.validation.observation_available, false); assert.equal(result.run.steps[1].output.observation.availability, "not_used"); }
    if (kind === "content_bound") {
      assert.equal(evidence.public_result.availability, "omitted_bound"); assert.equal(evidence.public_result.recommendations, null);
      assert.ok(evidence.public_result.bytes > STATELESS_FAILURE_BOUNDS.public_bytes);
    } else {
      assert.equal(evidence.public_result.availability, "complete"); assert.equal(evidence.public_result.recommendations.length, 1);
      if (kind === "rationale") assert.equal(evidence.public_result.recommendations[0].rationale, "é".repeat(601));
    }
    const markup = renderToStaticMarkup(createElement(StatelessReviewFailure, { review }));
    assert.ok(markup.includes(expected)); assert.ok(markup.includes("non-authoritative")); assert.ok(markup.includes(evidence.binding.run_id));
    assert.ok(!markup.includes("private_sqlite_error_not_for_public_evidence"));
    await f.call(undefined, 401, { cookie: "" }); await f.call(undefined, 409, {}, `project:${randomUUID()}`);
    const saved = canonical(result.run);
    assert.equal(canonical((await f.call({ action: "continue", run_id: result.run.run_id })).result.run), saved); assert.equal(f.calls, calls);
    const immutable = canonical(listVNextCoreRecordsV01(f.db, { ...f.scope, record_kinds: ["task_context_packet", "capability_grant", "run_receipt"], limit: 128 }));
    await f.call({ action: "prepare", material: replacementMaterial }, 409);
    await f.call({ action: "authorize_and_run", authorization: f.preview }, 409);
    // There is no receipt to select; never manufacture one to enter this route.
    await f.continuity({ action: "read_result_work_preparation", receipt_id: `missing:${result.run.run_id}` }, 409);
    assert.equal(canonical(listVNextCoreRecordsV01(f.db, { ...f.scope, record_kinds: ["task_context_packet", "capability_grant", "run_receipt"], limit: 128 })), immutable);
    readbacks.push({ config: f.config, run_id: result.run.run_id, at: f.now(), expected: review, saved });
    // Pure projections prove historical absence and corruption are not backfilled.
    const legacy = structuredClone(result.run); delete legacy.steps.find((s: any) => s.status === "failed").output.failure_evidence;
    assert.deepEqual(readStatelessFailureReviews(legacy), [{ step_id: failed.step_id, availability: "unavailable", reason: "not_recorded" }]);
    const corrupted = structuredClone(result.run); corrupted.steps.find((s: any) => s.status === "failed").output.failure_evidence.code = "invented";
    assert.equal(readStatelessFailureReviews(corrupted)[0]!.availability, "unavailable");
    validateRecoveryCanonicalDatabaseV01(f.db);
  }
  const f = await fixture("receipt-persistence-rejection");
  f.db.exec("CREATE TRIGGER refuse_scripted_receipt BEFORE INSERT ON vnext_core_records WHEN NEW.record_kind='run_receipt' BEGIN SELECT RAISE(ABORT,'private_receipt_failure'); END");
  const result = (await f.call({ action: "authorize_and_run", authorization: f.preview })).result;
  assert.equal(f.calls, 2); assert.equal(result.receipt, null); assert.equal(result.run.status, "stopped");
  assert.equal(result.run.steps.every((s: any) => s.status === "completed"), true, "Receipt failure never rolls back stored steps");
  assert.equal(result.failures[0].evidence.layer, "receipt_persistence"); assert.equal(result.failures[0].evidence.code, "receipt_persistence_failed");
  assert.equal(result.terminal_preparation, null, "Receipt projection repair is outside terminal model-failure authorship");
  assert.equal(result.failures[0].evidence.public_result.availability, "complete");
  const before = canonical(result.run);
  await f.call({ action: "continue", run_id: result.run.run_id }); assert.equal(f.calls, 2); assert.equal(canonical(f.host(result.run.run_id).read().run), before);
  readbacks.push({ config: f.config, run_id: result.run.run_id, at: f.now(), expected: result.failures[0], saved: before });
  const inputPath = path.join(root, "rejection-readbacks.json"); writeFileSync(inputPath, JSON.stringify(readbacks));
  const child = spawnSync(process.execPath, ["--import", "tsx", "scripts/test-stateless-source-review.ts", "--read-rejection", inputPath], { encoding: "utf8", timeout: 15000, env: { ...process.env, OPENAI_API_KEY: "" } });
  assert.equal(child.status, 0, child.stderr || child.stdout); assert.equal(JSON.parse(child.stdout).calls, 0); assert.equal(JSON.parse(child.stdout).cases, 6);
}
async function readRejectionChild(filename: string) {
  try {
    const inputs = JSON.parse(readFileSync(filename, "utf8"));
    for (const input of inputs) await readRejectedFixture(input);
    console.log(JSON.stringify({ calls: 0, cases: inputs.length, external_requests: requests, authenticated_fresh_read: true, ordinary_review_component_rendered: true, logout: 401 }));
  } finally { rmSync(root, { recursive: true, force: true }); network.unsubscribe(onNetwork); zeroNetwork.restore(); }
}
async function readRejectedFixture({ config, run_id, at, expected, saved }: any) {
  const db = new Database(config.database_path), script = scripted(), clock = { now: () => at };
  let cookie = "";
  try {
    const bootstrap = issueVNextLocalOperatorBootstrapV01(db, { config, clock });
    const session = consumeVNextLocalOperatorBootstrapV01(db, { config, clock, bootstrap_token: bootstrap.bootstrap_token });
    cookie = `${VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01}=${session.cookie_value}`;
    const route = createStatelessSourceReviewHandler({ clock, adapter: script.adapter, environment: { NODE_ENV: "test", AUGNES_VNEXT_OPERATOR_PILOT_ENABLED: "1", AUGNES_VNEXT_OPERATOR_WORKSPACE_ID: config.workspace_id,
      AUGNES_VNEXT_OPERATOR_PROJECT_ID: config.project_id, AUGNES_VNEXT_OPERATOR_ID: config.operator_id, AUGNES_DB_PATH: config.database_path } });
    const call = async (body?: unknown) => {
      const response = await route(new Request(`http://127.0.0.1/api/vnext/operator/stateless-source-review?project_id=${config.project_id}`, { method: body ? "POST" : "GET",
        headers: { host: "127.0.0.1", origin: "http://127.0.0.1", cookie, ...(body ? { "content-type": "application/json" } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) }));
      if (response.headers.get("set-cookie")) cookie = response.headers.get("set-cookie")!.split(";")[0]!;
      return response;
    };
    const response = await call(); assert.equal(response.status, 200); const review = (await response.json()).reviews[0];
    assert.deepEqual(review.failures[0], expected); assert.equal(canonical(review.run), saved);
    assert.ok(renderToStaticMarkup(createElement(StatelessReviewFailure, { review: review.failures[0] })).includes(expected.evidence.code));
    const continued = await call({ action: "continue", run_id }); assert.equal(continued.status, 200);
    assert.equal(canonical((await continued.json()).result.run), saved); assert.equal(script.calls, 0); assert.equal(requests, 0);
    const credential = readVNextLocalOperatorCredentialFromRequestV01(new Request("http://127.0.0.1", { headers: { cookie } }));
    assert.equal(revokeVNextLocalOperatorSessionByCredentialV01(db, { config, credential, clock }).revoked_at, at);
    assert.equal((await call()).status, 401);
  } finally { db.close(); }
}
async function historicalResponseHost() {
  // Explicit compatibility writer, not a deleted-field fixture or repaired ledger.
  // Execute the exact old host with ordinary current setup/grants and controlled
  // Responses transport. Its own catch persists the legacy unavailable evidence.
  const ref = "65f6efc92d969c47e86152efa9388aba4c169c63:lib/vnext/runtime/stateless-source-review.ts";
  const source = spawnSync("git", ["show", ref], { encoding: "utf8", timeout: 5000 });
  assert.equal(source.status, 0, "Pinned legacy compatibility writer must be available; never reconstruct it");
  const file = path.join(root, "legacy-response-host.ts");
  writeFileSync(file, source.stdout.replace(/from "(\.\.?\/[^"\n]+)"/g, (_match, specifier) => `from "${path.resolve("lib/vnext/runtime", specifier)}"`));
  return (await import(pathToFileURL(file).href)).StatelessSourceReviewHost as typeof StatelessSourceReviewHost;
}
function controlFor(f: Awaited<ReturnType<typeof fixture>>, enabled: boolean) {
  const active = readActiveProjectSelectionV01(f.db, f.scope.workspace_id)!, control = readProjectAutomationControlV01(f.db, f.scope)!;
  mutateProjectControlV01(f.db, { ...f.scope, action: enabled ? "enable_automation" : "disable_automation", expected_active_project_id: f.scope.project_id,
    expected_active_selection_revision: active.selection_revision, expected_control_revision: control.revision }, { now: f.now });
}
async function terminalAuthorshipContract() {
  const LegacyHost = await historicalResponseHost(), readbacks: unknown[] = [];
  for (const legacy of [false, true]) {
    const f = await fixture(`terminal-authorship-${legacy ? "legacy" : "current"}`);
    const workNote = { source: "Attributed Work review", observed_at: f.now(), provenance: "derived_interpretation", label: "Changed assumption / user correction", text: "Work review: separate observed direct calls from hypotheses. Earlier claims are not established premises." };
    await selectOrdinaryNotes(f, [...currentNotes(f), workNote]);
    const direction = await f.direction({ action: "decide", expected_ref: null, content: { purpose: "Trace the selected source", criteria: [], constraints: [] }, reason: "Explicit development direction", status: "active", proposal_ref: null });
    await f.direction({ action: "prepare_inspection", expected_ref: direction.record.ref, files: [{ path: "entry.ts", contains: "advisory" }] });
    f.preview = (await f.call({ action: "preview", pricing: notePricing })).authorization;
    f.loseDispatch(); const unknown = (await f.call({ action: "authorize_and_run", authorization: f.preview })).result;
    assert.equal(unknown.terminal_preparation, null);
    const ended = (await f.call({ action: "end_work", binding: unknown.disposition_preparation.binding })).result;
    const unknownSnapshot = canonical(ended.run);
    await f.call({ action: "prepare_linked_work", disposition: { run_id: ended.run.run_id, disposition_fingerprint: ended.disposition_preparation.disposition.fingerprint },
      material: { question: "Inspect the selected trace before drawing a connection", files: [{ path: "entry.ts", start_line: 1, end_line: 2 }] } });
    f.controls.lose = false;
    f.controls.transform = (output, input) => { if (input.stage === "conclude") { output.recommendations[0].grounded_state_keys = ["wrong-anchor"]; output.recommendations[0].rationale = "REJECTED_PUBLIC_JUDGMENT_NOT_SELECTED: a controlled response, not a finding."; } };
    const grant = (await f.call({ action: "preview", pricing: notePricing })).authorization;
    const auth = f.authorizeOnly(grant);
    const host = legacy ? new LegacyHost({ config: f.config, now: f.now, adapter: f.adapter }, auth.run_id) : f.host(auth.run_id);
    await assert.rejects(() => host.run());
    const failed = f.host(auth.run_id).read(), snapshot = canonical(failed.run);
    assert.equal(failed.run.status, "stopped"); assert.equal(failed.run.steps[2]!.status, "failed"); assert.equal(failed.receipt, null);
    readTerminalAttemptHistory(f.db, f.config, auth.run_id);
    assert.ok(failed.terminal_preparation); assert.equal(failed.terminal_preparation.evidence.layer, legacy ? "unavailable" : "host_validation");
    assert.equal(failed.run.steps[2]!.output.failure_evidence === undefined, legacy);
    const oldPacket = listVNextCoreRecordsV01(f.db, { ...f.scope, record_kinds: ["task_context_packet"], limit: 128 }).find(r => r.record_id === grant.packet_id)!.payload as any;
    const oldGrants = canonical(listVNextCoreRecordsV01(f.db, { ...f.scope, record_kinds: ["capability_grant"], limit: 128 }));
    controlFor(f, false); f.tick(Date.parse(oldPacket.expires_at) - Date.parse(f.now()) + 1); f.refreshSession();
    assert.ok(f.now() > oldPacket.expires_at && f.now() > grant.expires_at);
    const beforeControl = canonical(readProjectAutomationControlV01(f.db, f.scope)), beforeCalls = f.calls;
    // No model route or provider credential is needed for read/compare/preview/save.
    f.controls.transform = () => {};
    const preparation = (await f.call()).reviews.find((r: any) => r.run.run_id === auth.run_id).terminal_preparation;
    const request = { predecessor: preparation.binding, definition: { goal: "Inspect a distinct bounded trace", success_criteria: ["Attribute observed edges to source"], non_goals: ["No semantic acceptance or general absence claim"] },
      material: { question: "What direct calls does this selected source establish?", files: [{ path: "entry.ts", start_line: 1, end_line: 2 }] },
      notes: preparation.sources.filter((e: any) => { try { return JSON.parse(e.bounded_summary).profile !== "stateless_source_review.v0.1"; } catch { return true; } }).map((e: any) => ({ saved_source_id: e.entry_id })), omitted_sources: [] as any[] };
    const comparison = (await f.call({ action: "compare_terminal_sources", request })).preparation.comparison;
    request.omitted_sources = comparison.unselected_previous.map((e: any) => ({ source_binding: e.source_ref, reason: "The old inventory is historical; this new question explicitly selects current versions." }));
    let preview = (await f.call({ action: "preview_terminal_work", request })).preparation;
    assert.equal(preview.evidence.layer, legacy ? "unavailable" : "host_validation");
    const originalCore = canonical(listVNextCoreRecordsV01(f.db, { ...f.scope, record_kinds: ["task_context_packet", "capability_grant", "run_receipt"], limit: 128 }));
    await f.call({ action: "author_terminal_work", request, expected_preview: preview.preview_binding }, 401, { cookie: "" });
    await f.call({ action: "author_terminal_work", request, expected_preview: preview.preview_binding }, 409, {}, `project:${randomUUID()}`);
    await f.call({ action: "author_terminal_work", request: { ...request, predecessor: { ...request.predecessor, history_fingerprint: hash("changed") } }, expected_preview: preview.preview_binding }, 409);
    await f.call({ action: "author_terminal_work", request: { ...request, notes: [] }, expected_preview: preview.preview_binding }, 409);
    await f.call({ action: "author_terminal_work", request, expected_preview: hash("wrong-root-or-selection") }, 409);
    writeFileSync(path.join(f.projectRoot, "entry.ts"), sourceText + "// changed after preview\n");
    await f.call({ action: "author_terminal_work", request, expected_preview: preview.preview_binding }, 409); writeFileSync(path.join(f.projectRoot, "entry.ts"), sourceText);
    renameSync(f.projectRoot, `${f.projectRoot}-held`); mkdirSync(f.projectRoot); writeFileSync(path.join(f.projectRoot, "entry.ts"), sourceText);
    await f.call({ action: "author_terminal_work", request, expected_preview: preview.preview_binding }, 409);
    rmSync(f.projectRoot, { recursive: true }); renameSync(`${f.projectRoot}-held`, f.projectRoot);
    assert.equal(canonical(listVNextCoreRecordsV01(f.db, { ...f.scope, record_kinds: ["task_context_packet", "capability_grant", "run_receipt"], limit: 128 })), originalCore);
    if (!legacy && process.argv[2] === "--terminal-browser") {
      const copy = path.join(root, "terminal-browser-copy.db"); await f.db.backup(copy);
      const input = path.join(root, "terminal-browser-input.json"); writeFileSync(input, JSON.stringify({ config: { ...f.config, database_path: copy }, at: f.now(), request }));
      const ui = spawnSync(process.execPath, ["--import", "tsx", "scripts/test-stateless-terminal-browser.ts", input], { encoding: "utf8", timeout: 90000, env: { ...process.env, OPENAI_API_KEY: "" } });
      assert.equal(ui.status, 0, ui.stderr || ui.stdout); console.log(ui.stdout.trim());
    }
    // Isolated negative corruption inside a rolled-back transaction. Never
    // fabricate a positive history, grant or source binding.
    f.db.exec("BEGIN IMMEDIATE");
    try {
      updateAutonomyRunStepLedgerFields(failed.run.steps[2]!.step_id, { error_message: "changed historical failure" }, { db: f.db });
      assert.throws(() => previewTerminalAuthorship(f.db, f.config, request, f.now()), /history_changed/);
      updateAutonomyRunStepLedgerFields(failed.run.steps[2]!.step_id, { output: { ...failed.run.steps[2]!.output, failure_evidence: { code: "malformed_record" } } }, { db: f.db });
      assert.equal(readTerminalAuthorshipPreparation(f.db, f.config, auth.run_id, f.now()), null, "Malformed new evidence cannot borrow legacy omission compatibility");
    } finally { f.db.exec("ROLLBACK"); }
    assert.equal(canonical(f.host(auth.run_id).read().run), snapshot);
    if (!legacy) {
      const selection = readActiveProjectSelectionV01(f.db, f.scope.workspace_id)!;
      selectActiveProjectV01(f.db, { ...f.scope, now: f.now(), expected_project_id: f.scope.project_id, expected_revision: selection.selection_revision });
      await f.call({ action: "author_terminal_work", request, expected_preview: preview.preview_binding }, 409);
      preview = (await f.call({ action: "preview_terminal_work", request })).preparation;
      const changed = await f.direction({ action: "decide", expected_ref: direction.record.ref, content: { purpose: "Trace only direct source edges", criteria: [], constraints: [] }, reason: "Current explicit direction changed after preview", status: "active", proposal_ref: null });
      await f.call({ action: "author_terminal_work", request, expected_preview: preview.preview_binding }, 409);
      assert.equal(canonical(listVNextCoreRecordsV01(f.db, { ...f.scope, record_kinds: ["task_context_packet", "capability_grant", "run_receipt"], limit: 128 })), originalCore);
      const updated = (await f.call()).reviews.find((r: any) => r.run.run_id === auth.run_id).terminal_preparation;
      const currentDirection = updated.current_direction_source;
      assert.equal(JSON.parse(currentDirection.bounded_summary).revision_ref, changed.record.ref);
      // Resolve the precise old direction entry using the existing owner.
      request.notes = request.notes.filter((n: any) => n.saved_source_id !== preparation.current_direction_source.entry_id);
      request.notes = request.notes.filter((n: any) => {
        const e = preparation.sources.find((s: any) => s.entry_id === n.saved_source_id);
        try { return JSON.parse(e?.bounded_summary ?? "null")?.profile !== "augnes.prospective-input.v0.1"; } catch { return true; }
      });
      request.notes.push(selectedWorkSourceInput(currentDirection) as any);
      request.omitted_sources = [];
      const changedComparison = (await f.call({ action: "compare_terminal_sources", request })).preparation.comparison;
      request.omitted_sources = changedComparison.unselected_previous.map((e: any) => ({ source_binding: e.source_ref, reason: "Explicitly select current direction and new source question; retain the prior version only as history." }));
      preview = (await f.call({ action: "preview_terminal_work", request })).preparation;
    }
    const submissions = await Promise.all([f.call({ action: "author_terminal_work", request, expected_preview: preview.preview_binding }, [200, 409]), f.call({ action: "author_terminal_work", request, expected_preview: preview.preview_binding }, [200, 409])]);
    assert.equal(submissions.filter(v => v.ok).length, 1, JSON.stringify(submissions));
    const packet = submissions.find(v => v.ok)!.result.packet;
    const duplicate = (await f.call({ action: "author_terminal_work", request, expected_preview: preview.preview_binding })).result;
    assert.equal(duplicate.status, "exact_replay"); assert.deepEqual(duplicate.packet, packet);
    await f.call({ action: "author_terminal_work", request: { ...request, definition: { ...request.definition, goal: "Conflicting authorship" } }, expected_preview: preview.preview_binding }, 409);
    assert.equal(packet.capability_grant, null); assert.notEqual(packet.work_ref.external_id, oldPacket.work_ref.external_id);
    assert.ok(packet.generated_at > oldPacket.expires_at && packet.expires_at > packet.generated_at);
    assert.equal(readProjectWorkInitializationV01(f.db, f.config).current_packet?.packet_id, packet.packet_id);
    assert.equal(readPacketDirectionInterpretation(f.db, packet, f.now()).status, "current");
    assert.deepEqual(statelessUnresolvedEntries(packet), statelessUnresolvedEntries(oldPacket));
    assert.equal(statelessTerminalEntries(packet).length, 1); assert.ok(statelessTerminalEntries(packet)[0]!.bounded_summary!.includes(auth.run_id));
    assert.equal(JSON.stringify(packet).includes("REJECTED_PUBLIC_JUDGMENT_NOT_SELECTED"), false);
    assert.ok(readStatelessSelectedNotes(packet).notes.some(n => n.text === workNote.text));
    assert.equal(canonical(f.host(auth.run_id).read().run), snapshot); assert.equal(canonical(f.host(unknown.run.run_id).read().run), unknownSnapshot);
    assert.equal(canonical(listVNextCoreRecordsV01(f.db, { ...f.scope, record_kinds: ["capability_grant"], limit: 128 })), oldGrants);
    assert.equal(canonical(readProjectAutomationControlV01(f.db, f.scope)), beforeControl); assert.equal(f.calls, beforeCalls);
    await f.call({ action: "preview", pricing: notePricing }, 409); assert.equal(f.calls, beforeCalls);
    assert.equal(validateRecoveryCanonicalDatabaseV01(f.db).status, "valid");
    readbacks.push({ config: f.config, run_id: auth.run_id, unknown_id: unknown.run.run_id, at: f.now(), packet, snapshot, unknownSnapshot, request });
    const backup = await recoveryBackup(f, `terminal-${legacy}`), recovered = new Database(path.join(backup.backupPath, RECOVERY_DATABASE_PAYLOAD));
    try {
      assert.equal(validateRecoveryCanonicalDatabaseV01(recovered).status, "valid");
      assert.ok(inspectStatelessTerminalSuccessor(recovered, { config: { ...f.config, database_path: recovered.name }, packet }).packet);
      assert.throws(() => assertTerminalHistoryActive(recovered, f.scope, packet), /suspended_or_changed/);
      assert.equal(readTerminalAuthorshipPreparation(recovered, f.config, auth.run_id, f.now())!.recovery_suspended, true);
      const config = { ...f.config, database_path: recovered.name }, clock = { now: f.now };
      const bootstrap = issueVNextLocalOperatorBootstrapV01(recovered, { config, clock });
      const session = consumeVNextLocalOperatorBootstrapV01(recovered, { config, clock, bootstrap_token: bootstrap.bootstrap_token });
      const cookie = `${VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01}=${session.cookie_value}`;
      const route = createStatelessSourceReviewHandler({ clock, environment: { NODE_ENV: "test", AUGNES_VNEXT_OPERATOR_PILOT_ENABLED: "1", AUGNES_VNEXT_OPERATOR_WORKSPACE_ID: config.workspace_id,
        AUGNES_VNEXT_OPERATOR_PROJECT_ID: config.project_id, AUGNES_VNEXT_OPERATOR_ID: config.operator_id, AUGNES_DB_PATH: config.database_path, OPENAI_API_KEY: "" } });
      const api = (body?: unknown) => route(new Request(`http://127.0.0.1/api/vnext/operator/stateless-source-review?project_id=${config.project_id}`, { method: body ? "POST" : "GET",
        headers: { host: "127.0.0.1", origin: "http://127.0.0.1", cookie, ...(body ? { "content-type": "application/json" } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) }));
      try { assert.equal((await api()).status, 200); assert.equal((await api({ action: "preview_terminal_work", request })).status, 409); }
      finally { const credential = readVNextLocalOperatorCredentialFromRequestV01(new Request("http://127.0.0.1", { headers: { cookie } }));
        assert.ok(revokeVNextLocalOperatorSessionByCredentialV01(recovered, { config, credential, clock }).revoked_at); assert.equal((await api()).status, 401); }
    } finally { recovered.close(); }
    assert.throws(() => previewActivePortableProjectV01(f.db), /portable_stateless_review_not_supported/);
    // Save a read-only test copy before fresh authorization, so child readback
    // observes the prepared packet and disabled control without later state drift.
    const copy = path.join(root, `terminal-read-${legacy}.db`); await f.db.backup(copy); (readbacks.at(-1) as any).config = { ...f.config, database_path: copy };
    controlFor(f, true); await f.call({ action: "authorize_and_run", authorization: grant }, 409);
    const fresh = (await f.call({ action: "preview", pricing: notePricing })).authorization;
    const result = (await f.call({ action: "authorize_and_run", authorization: fresh })).result;
    assert.equal(result.run.status, "completed", result.run.stop_reason); assert.notEqual(result.run.run_id, auth.run_id); assert.equal(f.calls, beforeCalls + 2);
    for (const input of f.inputs.slice(-2)) {
      assert.equal(JSON.stringify(input).includes("REJECTED_PUBLIC_JUDGMENT_NOT_SELECTED"), false);
      assert.ok(JSON.stringify(input.returned_attempt_history).includes(auth.run_id)); assert.ok(JSON.stringify(input.unresolved_predecessors).includes(unknown.run.run_id));
      assert.ok(input.selected_work_notes.notes.some((n: any) => n.text === workNote.text));
    }
    assert.equal(canonical(f.host(auth.run_id).read().run), snapshot); assert.equal(canonical(f.host(unknown.run.run_id).read().run), unknownSnapshot);
    await f.call({ action: "author_terminal_work", request, expected_preview: preview.preview_binding }, 409);
    await ordinarySuccessor(f, result, f.calls);
    const current = readProjectWorkInitializationV01(f.db, f.config).current_packet!;
    const next = listVNextCoreRecordsV01(f.db, { ...f.scope, record_kinds: ["task_context_packet"], limit: 128 }).find(r => r.record_id === current.packet_id)!.payload as any;
    assert.deepEqual(statelessMandatoryEntries(next), statelessMandatoryEntries(packet));
    controlFor(f, false);
  }
  const file = path.join(root, "terminal-readbacks.json"); writeFileSync(file, JSON.stringify(readbacks));
  const child = spawnSync(process.execPath, ["--import", "tsx", "scripts/test-stateless-source-review.ts", "--read-terminal", file], { encoding: "utf8", timeout: 20000, env: { ...process.env, OPENAI_API_KEY: "" } });
  assert.equal(child.status, 0, child.stderr || child.stdout); assert.equal(JSON.parse(child.stdout).cases, 2);
}
async function readTerminalChild(filename: string) {
  try {
    const inputs = JSON.parse(readFileSync(filename, "utf8"));
    for (const input of inputs) {
      const { config, at, packet } = input, db = new Database(config.database_path), clock = { now: () => at };
      let cookie = "";
      const route = createStatelessSourceReviewHandler({ clock, environment: { NODE_ENV: "test", AUGNES_VNEXT_OPERATOR_PILOT_ENABLED: "1", AUGNES_VNEXT_OPERATOR_WORKSPACE_ID: config.workspace_id, AUGNES_VNEXT_OPERATOR_PROJECT_ID: config.project_id, AUGNES_VNEXT_OPERATOR_ID: config.operator_id, AUGNES_DB_PATH: config.database_path, OPENAI_API_KEY: "" } });
      const request = () => route(new Request(`http://127.0.0.1/api/vnext/operator/stateless-source-review?project_id=${config.project_id}`, { headers: { host: "127.0.0.1", origin: "http://127.0.0.1", cookie } }));
      try {
        const b = issueVNextLocalOperatorBootstrapV01(db, { config, clock }), s = consumeVNextLocalOperatorBootstrapV01(db, { config, clock, bootstrap_token: b.bootstrap_token }); cookie = `${VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01}=${s.cookie_value}`;
        const response = await request(); assert.equal(response.status, 200); const value = await response.json();
        assert.equal(value.preparation.packet_id, packet.packet_id); assert.equal(readProjectAutomationControlV01(db, config)!.enabled, false);
        const review = value.reviews.find((r: any) => r.run.run_id === input.run_id), unknown = value.reviews.find((r: any) => r.run.run_id === input.unknown_id);
        assert.equal(canonical(review.run), input.snapshot); assert.equal(canonical(unknown.run), input.unknownSnapshot);
        const markup = renderToStaticMarkup(createElement(StatelessTerminalAuthorship, { preparation: review.terminal_preparation, material: input.request.material, request: async () => { throw new Error("readback_must_not_mutate"); }, saved: async () => {} }));
        assert.ok(markup.includes("Compare selected context for new work") && markup.includes("The provider response returned.") && markup.includes("Attributed Work review"));
        assert.ok(markup.includes(review.terminal_preparation.evidence.layer));
        assert.deepEqual(inspectStatelessTerminalSuccessor(db, { config, packet }).packet, packet); validateRecoveryCanonicalDatabaseV01(db);
      } finally {
        if (cookie) { const credential = readVNextLocalOperatorCredentialFromRequestV01(new Request("http://127.0.0.1", { headers: { cookie } })); assert.ok(revokeVNextLocalOperatorSessionByCredentialV01(db, { config, credential, clock }).revoked_at); assert.equal((await request()).status, 401); }
        db.close();
      }
    }
    assert.equal(requests, 0); console.log(JSON.stringify({ cases: inputs.length, calls: 0, fresh_authenticated_read: true, actual_product_component: true, logout: 401 }));
  } finally { rmSync(root, { recursive: true, force: true }); network.unsubscribe(onNetwork); zeroNetwork.restore(); }
}
async function solLowContract() {
  const model = "gpt-6.1-sol", pricing = { input_nano_usd_per_byte: 2500, output_nano_usd_per_token: 10000,
    maximum_total_nano_usd: 200_000_000, source_version: "scripted-sol-low-not-live-authority" };
  const make = (name: string) => fixture(`sol-${name}`, "read_selected_sources", "use_observation", false, model);
  const legacy = await fixture("sol-legacy");
  assert.deepEqual(legacy.preview.limits, STATELESS_LIMITS); assert.equal(legacy.preview.model_configuration, undefined);
  assert.equal((await legacy.call({ action: "authorize_and_run", authorization: legacy.preview })).result.run.status, "completed");
  assert.equal(JSON.parse(legacy.serializedRequests[0]!).reasoning, undefined); assert.equal(JSON.parse(legacy.serializedRequests[0]!).max_output_tokens, 1024);

  const normal = await make("normal");
  const preview = (await normal.call({ action: "preview", pricing })).authorization;
  assert.deepEqual(preview.model_configuration, OPENAI_PLANNER_SOL_LOW); assert.deepEqual(preview.limits, STATELESS_SOL_LOW_LIMITS);
  assert.equal(preview.cost_budget.authority.model_ref.source_ref, OPENAI_PLANNER_SOL_LOW_REF);
  assert.equal(normal.calls, 0);
  // Changing effort, omission, limits or cost after review creates no grant/run.
  for (const change of [
    (p: any) => { p.model_configuration.reasoning.effort = "medium"; },
    (p: any) => { p.model_configuration.reasoning.mode = "pro"; },
    (p: any) => { delete p.model_configuration; },
    (p: any) => { p.limits.output_tokens++; },
    (p: any) => { p.cost_budget.authority.model_ref.source_ref = hash("another-setting"); },
  ]) { const altered = structuredClone(preview); change(altered); await normal.call({ action: "authorize_and_run", authorization: altered }, 409); }
  assert.equal(listVNextCoreRecordsV01(normal.db, { ...normal.scope, record_kinds: ["capability_grant"], limit: 128 }).length, 0);
  await normal.call({ action: "preview", pricing: { ...pricing, maximum_total_nano_usd: 1 } }, 409);
  normal.controls.outputTokens = 3200; normal.responseControls.reasoningTokens = 3000;
  const auth = normal.authorizeOnly(preview), host = normal.host(auth.run_id);
  assert.equal(await host.step(), true); assert.equal(await host.step(), true);
  const observation = canonical(host.read().run.steps[1]); assert.equal(normal.calls, 1);
  const receipt = host.read().run.steps[0]!.output.model_receipt as any;
  assert.equal(receipt.usage.reasoning_tokens, 3000); validateModelInvocationReceiptV02(receipt);
  assert.deepEqual(JSON.parse(normal.serializedRequests[0]!).reasoning, { effort: "low", mode: "standard" });
  assert.equal(JSON.parse(normal.serializedRequests[0]!).max_output_tokens, 4096);
  assert.equal(JSON.parse(normal.serializedRequests[0]!).store, false);
  assert.equal(JSON.parse(normal.serializedRequests[0]!).service_tier, undefined);
  assert.equal(JSON.parse(normal.serializedRequests[0]!).previous_response_id, undefined);
  rmSync(path.join(normal.projectRoot, "entry.ts"));
  const resumePath = path.join(root, "sol-resume.json"); writeFileSync(resumePath, JSON.stringify({ config: normal.config, run_id: auth.run_id, at: normal.now(), model }));
  const resumed = spawnSync(process.execPath, ["--import", "tsx", "scripts/test-stateless-source-review.ts", "--resume", resumePath], { encoding: "utf8", timeout: 20000, env: { ...process.env, OPENAI_API_KEY: "" } });
  assert.equal(resumed.status, 0, resumed.stderr); const resumedResult = JSON.parse(resumed.stdout);
  assert.equal(resumedResult.calls, 1); assert.deepEqual(JSON.parse(resumedResult.serialized_request).reasoning, { effort: "low", mode: "standard" });
  assert.equal(canonical(host.read().run.steps[1]), observation); assert.equal(host.read().run.status, "completed");
  validateRecoveryCanonicalDatabaseV01(normal.db);

  const readbacks: any[] = [];
  for (const kind of ["output-limit", "output-limit-public", "content-filter", "unknown-reason", "over-budget", "invalid-usage", "public-bound"] as const) {
    const f = await make(kind);
    f.controls.outputTokens = kind === "over-budget" ? 4097 : 4096; f.responseControls.reasoningTokens = kind === "invalid-usage" ? 4097 : 3900;
    if (["output-limit", "output-limit-public", "content-filter", "unknown-reason"].includes(kind)) {
      f.responseControls.status = "incomplete"; f.responseControls.incompleteReason = kind.startsWith("output-limit") ? "max_output_tokens" : kind === "content-filter" ? "content_filter" : "private-provider-reason-must-not-persist";
      f.responseControls.omitOutput = kind !== "output-limit-public";
    }
    if (kind === "public-bound") f.controls.transform = output => { output.recommendations[0].rationale = "x".repeat(1201); };
    const result = (await f.call({ action: "authorize_and_run", authorization: f.preview })).result;
    assert.equal(f.calls, 1); assert.equal(result.run.status, "stopped"); assert.equal(result.receipt, null);
    const failed = result.run.steps[0], review = result.failures[0]; assert.equal(failed.status, "failed");
    assert.equal(failed.output.dispatch_outcome, f.responseControls.status ? "returned_incomplete" : "returned_invalid");
    assert.equal(review.resource_limit_failure, kind.startsWith("output-limit"));
    assert.ok(!canonical(result.run).includes("scripted-hidden-content-must-not-persist"));
    assert.ok(!canonical(result.run).includes("private-provider-reason-must-not-persist"));
    if (f.responseControls.status) {
      assert.equal(review.provider_response.provider_status, "incomplete"); assert.equal(review.provider_response.stage, "response_status_not_completed");
      assert.equal(review.provider_response.incomplete_reason, kind === "unknown-reason" ? "unknown" : f.responseControls.incompleteReason);
      assert.equal(review.provider_response.output_text_present, kind === "output-limit-public");
      assert.equal(review.reported_usage.reasoning_tokens, 3900); assert.equal(failed.output.failure_receipt.usage, null);
      assert.equal(result.terminal_preparation, null, "Incomplete provider results do not enter host-rejected terminal authorship");
    }
    if (kind === "over-budget") { assert.equal(review.evidence.code, "model_gateway_budget_refused"); assert.equal(review.reported_usage.output_tokens, 4097); }
    if (kind === "invalid-usage") { assert.equal(review.provider_response.stage, "response_usage_invalid"); assert.equal(review.reported_usage, null); }
    if (kind === "public-bound") { assert.equal(review.evidence.code, "rationale_bound_exceeded"); assert.equal(review.evidence.layer, "host_validation"); }
    const markup = renderToStaticMarkup(createElement(StatelessReviewFailure, { review }));
    if (kind === "output-limit") { assert.ok(markup.includes("resource-limit failure")); assert.ok(markup.includes("3900")); }
    const saved = canonical(result.run); await f.call({ action: "continue", run_id: result.run.run_id }); assert.equal(f.calls, 1); assert.equal(canonical(f.host(result.run.run_id).read().run), saved);
    readbacks.push({ config: f.config, run_id: result.run.run_id, at: f.now(), expected: review, saved });
  }
  const readPath = path.join(root, "sol-readbacks.json"); writeFileSync(readPath, JSON.stringify(readbacks));
  const fresh = spawnSync(process.execPath, ["--import", "tsx", "scripts/test-stateless-source-review.ts", "--read-rejection", readPath], { encoding: "utf8", timeout: 20000, env: { ...process.env, OPENAI_API_KEY: "" } });
  assert.equal(fresh.status, 0, fresh.stderr); assert.equal(JSON.parse(fresh.stdout).calls, 0);

  const drift = await make("route-drift"); drift.modelEnvironment.OPENAI_MODEL = "gpt-4.1-mini";
  const drifted = (await drift.call({ action: "authorize_and_run", authorization: drift.preview })).result;
  assert.equal(drift.calls, 0); assert.equal(drifted.run.status, "stopped"); assert.equal(drifted.run.steps[0].output.dispatch_outcome, "not_issued");
  const timeout = await make("attempt-time"); const timed = timeout.authorizeOnly();
  assert.equal(await timeout.host(timed.run_id).step(), true); timeout.tick(STATELESS_SOL_LOW_LIMITS.host_ms + 1);
  const expired = (await timeout.call({ action: "continue", run_id: timed.run_id })).result;
  assert.equal(expired.run.stop_reason, "attempt_time_limit_before_dispatch"); assert.equal(timeout.calls, 1); assert.equal(expired.run.steps[1].status, "planned");

  const cancel = await make("cancel-during-dispatch"), cancelAuth = cancel.authorizeOnly(), cancelHost = cancel.host(cancelAuth.run_id);
  cancel.controls.dispatch = async () => { await cancel.call({ action: "cancel", run_id: cancelAuth.run_id }); };
  const cancelled = await cancelHost.run(); assert.equal(cancelled.run.status, "cancelled");
  assert.equal(cancelled.run.steps[0]!.status, "completed"); assert.equal(cancelled.run.steps[1]!.status, "planned");
  await cancel.call({ action: "continue", run_id: cancelAuth.run_id }); assert.equal(cancel.calls, 1);

  const lost = await make("unknown"); lost.loseDispatch();
  const unknown = (await lost.call({ action: "authorize_and_run", authorization: lost.preview })).result;
  assert.equal(unknown.stage, "dispatch_outcome_unknown"); assert.equal(unknown.run.metadata.reconciliation_required, true);
  await lost.call({ action: "continue", run_id: unknown.run.run_id }); assert.equal(lost.calls, 1);
  const late = await make("late"); const lateAuth = late.authorizeOnly();
  let release!: () => void; late.controls.dispatch = () => new Promise<void>(resolve => { release = resolve; });
  const pending = late.host(lateAuth.run_id).step();
  while (!release) await new Promise(resolve => setTimeout(resolve, 1));
  const binding = late.host(lateAuth.run_id).read().disposition_preparation!.binding;
  await late.call({ action: "end_work", binding }); release(); await assert.rejects(pending);
  const quarantined = late.host(lateAuth.run_id).read(); assert.equal(quarantined.stage, "ended_effects_unknown");
  assert.ok(quarantined.run.events.some(e => e.payload.profile === "stateless_late_model_receipt.v0.1"));
  assert.equal(quarantined.run.steps[2]!.status, "planned"); await late.call({ action: "continue", run_id: lateAuth.run_id }); assert.equal(late.calls, 1);
}

async function observationCheckpointContract() {
  const pause = async (name: string) => {
    const f = await fixture(`checkpoint-${name}`, "read_selected_sources", "use_observation", false, "gpt-6.1-sol");
    const authorization = (await f.call({ action: "preview", pricing: notePricing, pause_after_observation: true })).authorization;
    assert.equal(authorization.pause_after_observation, true);
    const saved = (await f.call({ action: "authorize_and_run", authorization })).result;
    assert.equal(saved.stage, "observation_saved"); assert.equal(saved.run.status, "paused"); assert.equal(f.calls, 1);
    assert.deepEqual(saved.run.steps.map((s: any) => s.status), ["completed", "completed", "planned"]);
    assert.equal(saved.run.steps[2].output.generation, undefined); assert.ok(saved.observation_checkpoint);
    return { f, saved, authorization };
  };
  const processCase = await fixture("checkpoint-process", "read_selected_sources", "use_observation", false, "gpt-6.1-sol");
  await checkpointProcessReplacement(processCase.config, processCase.projectRoot);
  const { f, saved, authorization } = await pause("controller-race");
  const request = { action: "continue", run_id: saved.run.run_id, checkpoint: saved.observation_checkpoint };
  await f.call({ action: "continue", run_id: saved.run.run_id }, 409);
  await f.call({ ...request, checkpoint: { ...request.checkpoint, revision: request.checkpoint.revision + 1 } }, 409);
  await f.call(request, 409, {}, "another-project");
  assert.equal((await f.host(saved.run.run_id).run()).stage, "observation_saved"); assert.equal(f.calls, 1);
  const grants = canonical(listVNextCoreRecordsV01(f.db, { ...f.scope, record_kinds: ["capability_grant"], limit: 128 }));
  const boundGrant = JSON.parse(grants)[0].payload;
  assert.equal(validateStatelessGrant(boundGrant), true);
  assert.equal(validateStatelessGrant({ ...boundGrant, request: { ...boundGrant.request, pause_after_observation: false } }), false);
  // Exact authenticated writer contracts: abandon an unclaimed local controller,
  // replace it using a fresh binding, then ensure its old generation cannot dispatch.
  const stale = f.host(saved.run.run_id).resumeObservation(f.credential(), saved.observation_checkpoint); f.refreshSession();
  const checkpoint2 = f.host(saved.run.run_id).read().observation_checkpoint;
  const replacement = f.host(saved.run.run_id).resumeObservation(f.credential(), checkpoint2); f.refreshSession();
  assert.notEqual(stale.generation, replacement.generation);
  const unchanged = canonical(f.host(saved.run.run_id).read().run);
  await f.host(saved.run.run_id).run(undefined, stale.generation); assert.equal(f.calls, 1);
  assert.equal(canonical(f.host(saved.run.run_id).read().run), unchanged);
  const current = f.host(saved.run.run_id).read().observation_checkpoint;
  let release!: () => void, entered!: () => void;
  const enteredPromise = new Promise<void>(r => { entered = r; }), gate = new Promise<void>(r => { release = r; });
  f.controls.dispatch = async () => { entered(); await gate; };
  const pending = f.call({ ...request, checkpoint: current }); await enteredPromise;
  f.refreshSession(); await f.call({ ...request, checkpoint: current }, 409); release();
  const completed = (await pending).result;
  assert.equal(completed.run.status, "completed"); assert.equal(f.calls, 2);
  assert.deepEqual(completed.run.steps.slice(0, 2), saved.run.steps.slice(0, 2));
  assert.equal(canonical(listVNextCoreRecordsV01(f.db, { ...f.scope, record_kinds: ["capability_grant"], limit: 128 })), grants);
  assert.equal(authorization.expires_at, JSON.parse(grants)[0].payload.request.expires_at);
  f.refreshSession(); await f.call(request, 409); assert.equal(f.calls, 2);
  for (const mode of ["cancel", "grant-expiry", "attempt-expiry", "control-disabled"] as const) {
    const { f, saved } = await pause(mode), originalGrant = canonical(listVNextCoreRecordsV01(f.db, { ...f.scope, record_kinds: ["capability_grant"], limit: 128 }));
    if (mode === "cancel") await f.call({ action: "cancel", run_id: saved.run.run_id });
    if (mode === "grant-expiry") f.tick(600001);
    if (mode === "attempt-expiry") f.tick(150001);
    if (mode === "control-disabled") controlFor(f, false);
    f.refreshSession(); const result = await f.call({ action: "continue", run_id: saved.run.run_id, checkpoint: saved.observation_checkpoint }, 409);
    if (mode === "attempt-expiry") assert.equal(result.error, "stateless_review_attempt_time_limit_before_dispatch");
    assert.equal(f.calls, 1); assert.deepEqual(f.host(saved.run.run_id).read().run.steps, saved.run.steps);
    assert.equal(canonical(listVNextCoreRecordsV01(f.db, { ...f.scope, record_kinds: ["capability_grant"], limit: 128 })), originalGrant);
  }
  const unknown = await fixture("checkpoint-unknown", "read_selected_sources", "use_observation", false, "gpt-6.1-sol");
  const uPreview = (await unknown.call({ action: "preview", pricing: notePricing, pause_after_observation: true })).authorization;
  unknown.loseDispatch(); const lost = (await unknown.call({ action: "authorize_and_run", authorization: uPreview })).result;
  assert.equal(lost.stage, "dispatch_outcome_unknown"); assert.equal(lost.observation_checkpoint, null);
  await unknown.call({ action: "continue", run_id: lost.run.run_id, checkpoint: saved.observation_checkpoint }, 409);
  assert.equal(unknown.calls, 1); assert.deepEqual(unknown.host(lost.run.run_id).read().run, lost.run);
  const recovery = await pause("recovery");
  assert.throws(() => previewActivePortableProjectV01(recovery.f.db), /portable_stateless_review_not_supported/);
  const backup = await recoveryBackup(recovery.f, "checkpoint");
  const recoveredPath = path.join(backup.backupPath, RECOVERY_DATABASE_PAYLOAD);
  const suspended = new StatelessSourceReviewHost({ config: { ...recovery.f.config, database_path: recoveredPath }, now: recovery.f.now, adapter: recovery.f.adapter }, recovery.saved.run.run_id);
  assert.equal((await suspended.run()).stage, "recovery_suspended"); assert.equal(suspended.read().observation_checkpoint, null); assert.equal(recovery.f.calls, 1);
  assert.deepEqual(suspended.read().run.steps, recovery.saved.run.steps);
}

async function main() {
  try {
    if (process.argv[2] === "--observation-checkpoint") {
      await observationCheckpointContract(); assert.equal(requests, 0); assert.equal(zeroNetwork.attempts.length, 0);
      console.log(JSON.stringify({ status: "passed", checkpoint: "ordinary_authenticated_http", process_replacement: true, no_replay: true, original_grant_and_deadline: true, stale_and_concurrent_controllers: "refused", cancellation_expiry_unknown_recovery: "refused", provider_egress: 0 })); return;
    }
    if (process.argv[2] === "--sol-low") {
      await solLowContract(); assert.equal(requests, 0); assert.equal(zeroNetwork.attempts.length, 0);
      console.log(JSON.stringify({ status: "passed", model_configuration: "gpt-6.1-sol-low-standard", scripted_only: true, authority_and_usage: true,
        incomplete_resource_failure: true, fresh_process_readback_and_restart: true, stale_route_refused: true, late_fencing: true, external_requests: requests })); return;
    }
    if (["--terminal-authorship", "--terminal-browser"].includes(process.argv[2]!)) {
      await terminalAuthorshipContract(); assert.equal(requests, 0); assert.equal(zeroNetwork.attempts.length, 0);
      console.log(JSON.stringify({ status: "passed", terminal_authorship: "ordinary_preview_new_packet_fresh_grant", legacy_writer: "65f6efc92d969c47e86152efa9388aba4c169c63", candidate_writes: 0, external_requests: requests })); return;
    }
    if (process.argv[2] === "--rejection-evidence") {
      await rejectionEvidenceContract(); assert.equal(requests, 0);
      console.log(JSON.stringify({ status: "passed", post_gateway_rejections: ["rationale_bound_exceeded", "source_anchor_missing", "observation_unavailable"], whole_public_projection_or_explicit_omission: true,
        persistence_failure_distinct: true, authenticated_fresh_process_and_review_component: true, legacy_missing_evidence: "unavailable", continue_replays: 0, completed_result_and_revision_guards: "unchanged_use_explicit_terminal_authorship", external_requests: requests })); return;
    }
    if (process.argv[2] === "--selected-notes") {
      await dispositionContract(); await selectedNoteBoundsContract(); assert.equal(requests, 0);
      console.log(JSON.stringify({ status: "passed", selected_note_delivery_both_serialized_requests: true, fresh_process_provenance: true, excluded_history: true, stale_data_authority: "refused", overflow_before_affected_dispatch: true, external_requests: requests })); return;
    }
    if (process.argv[2] === "--direction-disposition") {
      await directionDispositionContract(); assert.equal(requests, 0);
      console.log(JSON.stringify({ status: "passed", selected_direction_linked_preparation: true, changed_or_unselected_direction: "atomic_refusal", external_requests: requests })); return;
    }
    if (process.argv[2] === "--disposition") {
      await dispositionContract(); assert.equal(requests, 0);
      console.log(JSON.stringify({ status: "passed", successor_review_reentry: true, fresh_process_and_recovery_warning: true, separate_grant_required: true, external_requests: requests })); return;
    }
    const previewAdapter = scripted();
    const routeIdentity = await preparePlannerModelGatewayRouteV01({ adapter: previewAdapter.adapter });
    assert.deepEqual(Object.keys(routeIdentity!).sort(), ["model_ref", "provider_ref"]);
    assert.equal(previewAdapter.calls, 0, "route preview must not dispatch a provider call or expose an invocable session");
    assert.equal(await preparePlannerModelGatewayRouteV01({ adapter: createOpenAIResponsesAdapterV01({ environment: {} }) }), null);
    await directionDispositionContract(); await dispositionContract(); await selectedNoteBoundsContract(); await rejectionEvidenceContract();
    const normal = await fixture("normal");
    await normal.call({ action: "authorize_and_run", authorization: normal.preview }, 401, { cookie: "" });
    await normal.call({ action: "authorize_and_run", authorization: normal.preview }, 403, { origin: "https://foreign.example" });
    const authoredBeforeMismatch = canonical(listVNextCoreRecordsV01(normal.db, { ...normal.scope, record_kinds: ["task_context_packet", "capability_grant"], limit: 128 }));
    await normal.call({ action: "prepare", material: { question: "Do not write to the cookie's other project", files: [{ path: "entry.ts", start_line: 1, end_line: 2 }] } }, 409, {}, `project:${randomUUID()}`);
    await normal.call({ action: "authorize_and_run", authorization: normal.preview }, 409, {}, "");
    assert.equal(canonical(listVNextCoreRecordsV01(normal.db, { ...normal.scope, record_kinds: ["task_context_packet", "capability_grant"], limit: 128 })), authoredBeforeMismatch);
    assert.equal(normal.calls, 0);
    const result = (await normal.call({ action: "authorize_and_run", authorization: normal.preview })).result;
    const historical = structuredClone(listVNextCoreRecordsV01(normal.db, { ...normal.scope, record_kinds: ["capability_grant"], limit: 128 })[0]!.payload) as any;
    delete historical.request.selected_notes_ref;
    historical.grant_id = `stateless-grant:${statelessGrantKey(historical.request, historical.approved_by).slice(7, 31)}`;
    const { grant_id: _id, grant_fingerprint: _fp, ...legacyMaterial } = historical;
    historical.grant_fingerprint = hash(canonical(legacyMaterial));
    assert.equal(validateStatelessGrant(historical), true, "Pure legacy compatibility projection remains readable; never persisted as positive authority");
    assert.equal(result.run.status, "completed", result.run.stop_reason); assert.equal(normal.calls, 2);
    assert.equal(normal.inputs[1].observation.sources[0].text, sourceText.trimEnd());
    assert.equal(normal.inputs[1].observation.availability, "observed");
    assert.equal(normal.inputs[1].prior_judgment.tool_name, "read_selected_sources");
    assert.equal(result.run.steps[1].output.action_bundles, 1);
    const binding = readProjectRunResultSourceBindingV01(normal.db, { ...normal.scope, receipt_id: result.receipt.receipt_id });
    assert.equal(binding.packet!.packet_id, normal.preview.packet_id); assert.equal(binding.receipt.model_invocations.length, 2);
    const read = await normal.call(); assert.equal(read.reviews[0].receipt.receipt_id, binding.receipt.receipt_id);
    await normal.call({ action: "continue", run_id: result.run.run_id }); assert.equal(normal.calls, 2);
    validateRecoveryCanonicalDatabaseV01(normal.db);
    await normal.call({ action: "authorize_and_run", authorization: normal.preview }, 409);
    assert.equal(normal.calls, 2);
    unsettledOwnerContract(result.run);
    await ordinarySuccessor(normal, result);
    for (const [name, metadata] of [["unreconciled", '{"reconciliation_required":true}'], ["malformed", '{']] as const) {
      const blocked = await fixture(`other-${name}`); const authorization = blocked.authorizeOnly();
      // Negative admission fault: never clear this other run to obtain success.
      insertAutonomyRunLedgerRecord({ ...result.run, run_id: `other-${name}`, scope: blocked.scope.project_id, created_at: blocked.now(), updated_at: blocked.now() }, [], [], { db: blocked.db });
      blocked.db.prepare("UPDATE autonomy_runs SET metadata_json=? WHERE run_id=?").run(metadata, `other-${name}`);
      await assert.rejects(() => blocked.host(authorization.run_id).run(), /unsettled_project_run/);
      assert.equal(blocked.calls, 0);
      assert.equal((blocked.db.prepare("SELECT metadata_json FROM autonomy_runs WHERE run_id=?").get(`other-${name}`) as any).metadata_json, metadata);
    }
    const restart = await fixture("restart");
    const restartNote = { source: "Work review before interruption", observed_at: restart.now(), provenance: "derived_interpretation", label: "Open question", text: "Retain this attributed observation as context across a process boundary; its content supplies no authority." };
    await selectOrdinaryNotes(restart, [...currentNotes(restart), restartNote]);
    const restartPreview = (await restart.call({ action: "preview", pricing: notePricing })).authorization;
    const restartNotes = (await restart.call()).preparation.selected_notes;
    const auth = restart.authorizeOnly(restartPreview);
    const host = new StatelessSourceReviewHost({ config: restart.config, now: restart.now, adapter: restart.adapter }, auth.run_id);
    assert.equal(await host.step(), true); assert.equal(await host.step(), true);
    const stored = canonical(host.read().run.steps[1]); assert.equal(restart.calls, 1);
    // No source reread is needed by the next judgment; exact bytes are in SQLite.
    rmSync(path.join(restart.projectRoot, "entry.ts"));
    const resumeInput = path.join(root, "resume.json");
    writeFileSync(resumeInput, JSON.stringify({ config: restart.config, run_id: auth.run_id, at: restart.now() }));
    const childEnvironment = { ...process.env }; delete childEnvironment.OPENAI_API_KEY;
    const child = spawnSync(process.execPath, ["--import", "tsx", "scripts/test-stateless-source-review.ts", "--resume", resumeInput], {
      cwd: process.cwd(), env: childEnvironment, timeout: 20_000, encoding: "utf8", maxBuffer: 256 * 1024 });
    assert.equal(child.status, 0, child.stderr || String(child.error));
    const childResult = JSON.parse(child.stdout.trim()); assert.equal(childResult.calls, 1); assert.equal(childResult.external_requests, 0);
    assert.equal(childResult.observation.sources[0].text, sourceText.trimEnd());
    assert.deepEqual(restart.inputs[0].selected_work_notes, restartNotes);
    assert.deepEqual(childResult.selected_notes, restartNotes);
    assert.equal(childResult.selected_notes.notes[0].text, restartNote.text);
    assert.equal(JSON.parse(JSON.parse(childResult.serialized_request).input[1].content[0].text).message.includes(restartNote.text), true);
    assert.ok(Buffer.byteLength(childResult.serialized_request) <= restartPreview.limits.input_bytes);
    const resumed = host.read(); assert.equal(resumed.run.status, "completed");
    assert.equal(canonical(resumed.run.steps[1]), stored); assert.equal(resumed.run.run_id, auth.run_id);
    await restart.call({ action: "continue", run_id: auth.run_id }); assert.equal(restart.calls, 1);
    for (const choice of ["no_action", "defer"]) {
      const unused = await fixture(`nonuse-${choice}`, choice, "decline_observation");
      const unusedResult = (await unused.call({ action: "authorize_and_run", authorization: unused.preview })).result;
      assert.equal(unusedResult.run.status, "completed"); assert.equal(unusedResult.run.steps[1].output.action_bundles, 0);
      assert.equal(unused.inputs[1].observation.availability, "not_used");
    }
    const privateCanary = "PRIVATE_EXCEPTION_HEADER_BODY_URL_CANARY";
    const transportError = new TypeError(privateCanary, { cause: Object.assign(new Error(privateCanary), { code: "EPERM", address: privateCanary }) });
    const diagnostic = projectModelTransportFailureObservationV01(transportError, false);
    assert.deepEqual(diagnostic, { observation_version: "model_transport_failure_observation.v0.1", phase: "request_transport", error_name: "TypeError", error_code: null, cause_code: "EPERM", signal_aborted: false });
    assert.deepEqual(normalizeModelTransportFailureObservationV01({ ...diagnostic, headers: privateCanary, stack: privateCanary }), diagnostic);
    assert.equal(projectModelTransportFailureObservationV01({ name: privateCanary, code: privateCanary, cause: { code: privateCanary } }, false).error_name, "unknown");
    assert.equal(projectModelTransportFailureObservationV01({ code: privateCanary }, false).error_code, null);
    let getters = 0;
    const hostile = Object.defineProperty({}, "cause", { get() { getters++; throw new Error(privateCanary); } });
    assert.equal(projectModelTransportFailureObservationV01(hostile, false).cause_code, null); assert.equal(getters, 0);
    assert.equal(normalizeModelTransportFailureObservationV01({ ...diagnostic, signal_aborted: privateCanary }), null);
    const unknown = await fixture("dispatch-unknown"); unknown.loseDispatch(transportError);
    const lost = (await unknown.call({ action: "authorize_and_run", authorization: unknown.preview })).result;
    assert.equal(unknown.calls, 1); assert.equal(lost.stage, "dispatch_outcome_unknown");
    const again = (await unknown.call({ action: "continue", run_id: lost.run.run_id })).result;
    assert.equal(unknown.calls, 1); assert.equal(again.stage, "dispatch_outcome_unknown");
    assert.equal(again.run.steps[0].output.failure_receipt.egress_attempted, true);
    assert.equal(again.run.status, "paused"); assert.equal(again.run.steps[0].status, "running");
    assert.equal(again.run.metadata.reconciliation_required, true);
    assert.equal(again.run.steps[0].output.dispatch_outcome, "unknown"); assert.equal(again.run.steps[0].output.received_model_result, null);
    assert.equal(again.run.steps[0].output.failure_receipt.usage, null);
    assert.equal(again.failures[0].evidence.layer, "gateway"); assert.equal(again.failures[0].evidence.code, "model_gateway_transport_failed");
    assert.equal(again.failures[0].evidence.public_result.availability, "unavailable");
    validateModelInvocationReceiptV02(again.run.steps[0].output.failure_receipt);
    assert.deepEqual(unknown.host(lost.run.run_id).read().run.steps[0]!.output.transport_failure_observation, diagnostic, "Fresh owner reads the persisted bounded diagnostic");
    assert.equal(canonical(again).includes(privateCanary), false);
    assert.deepEqual(again.run.steps, lost.run.steps, "Continuation preserves the exact unknown claim without replay");
    await unknown.call({ action: "cancel", run_id: lost.run.run_id });
    const cancelledUnknown = unknown.host(lost.run.run_id).read();
    assert.equal(cancelledUnknown.stage, "dispatch_outcome_unknown"); assert.equal(cancelledUnknown.run.metadata.reconciliation_required, true);
    assert.deepEqual(cancelledUnknown.run.steps, lost.run.steps, "Cancellation is not provider-outcome settlement"); assert.equal(unknown.calls, 1);
    for (const code of ["ENOTFOUND", "ECONNRESET", "DEPTH_ZERO_SELF_SIGNED_CERT", "ERR_INVALID_CHAR", "UND_ERR_CONNECT_TIMEOUT"]) {
      const failure = await fixture(`diagnostic-${code}`);
      failure.loseDispatch(new TypeError(privateCanary, { cause: Object.assign(new Error(privateCanary), { code }) }));
      const failed = (await failure.call({ action: "authorize_and_run", authorization: failure.preview })).result;
      assert.equal(failed.run.steps[0].output.transport_failure_observation.cause_code, code);
      assert.equal(failed.stage, "dispatch_outcome_unknown"); assert.equal(failed.run.metadata.reconciliation_required, true);
      assert.equal(canonical(failed).includes(privateCanary), false);
      const continued = (await failure.call({ action: "continue", run_id: failed.run.run_id })).result;
      assert.deepEqual(continued.run.steps, failed.run.steps); assert.equal(failure.calls, 1);
    }
    const actionUnknown = await fixture("action-dispatch-unknown"); const au = actionUnknown.authorizeOnly(); const auh = actionUnknown.host(au.run_id);
    await auh.step();
    // Isolated fault injection represents a process disappearing after the
    // action claim and before a durable result. It is not a positive grant path.
    updateAutonomyRunStepLedgerFields(auh.read().run.steps[1]!.step_id, { status: "running", output: { generation: "lost-action-controller" } }, { db: actionUnknown.db });
    const actionLost = await auh.run(); assert.equal(actionLost.stage, "dispatch_outcome_unknown");
    assert.equal(actionLost.disposition_preparation, null, "Unknown local actions have no model-disposition exception");
    assert.equal(actionLost.run.steps[1]!.output.action_bundles, undefined); assert.equal(actionUnknown.calls, 1);
    await auh.run(); assert.equal(actionUnknown.calls, 1);
    const changed = await fixture("changed-source"); const ch = changed.authorizeOnly();
    writeFileSync(path.join(changed.projectRoot, "entry.ts"), "changed\n");
    const chost = new StatelessSourceReviewHost({ config: changed.config, now: changed.now, adapter: changed.adapter }, ch.run_id);
    await assert.rejects(() => chost.run(), /source_changed_before_judgment/); assert.equal(changed.calls, 0);
    const expired = await fixture("expiry"); const exp = expired.authorizeOnly(); expired.tick(600_001);
    const ehost = new StatelessSourceReviewHost({ config: expired.config, now: expired.now, adapter: expired.adapter }, exp.run_id);
    await assert.rejects(() => ehost.run(), /grant_source_or_permission_changed/); assert.equal(expired.calls, 0);
    const stop = await fixture("stop", "stop");
    const stopped = (await stop.call({ action: "authorize_and_run", authorization: stop.preview })).result;
    assert.equal(stop.calls, 1); assert.equal(stopped.run.status, "stopped");
    assert.deepEqual(stopped.run.steps.map((s: any) => s.status), ["completed", "skipped", "skipped"]);

    const cancelled = await fixture("cancelled"); const ca = cancelled.authorizeOnly();
    const chost2 = cancelled.host(ca.run_id); await chost2.step(); await chost2.step();
    const beforeCancel = canonical(chost2.read().run.steps[1]);
    await cancelled.call({ action: "cancel", run_id: ca.run_id });
    await cancelled.call({ action: "continue", run_id: ca.run_id });
    assert.equal(cancelled.calls, 1); assert.equal(canonical(chost2.read().run.steps[1]), beforeCancel);

    const revoked = await fixture("revoked"); const rev = revoked.authorizeOnly(); const rh = revoked.host(rev.run_id);
    await rh.step(); await rh.step();
    const active = readActiveProjectSelectionV01(revoked.db, revoked.scope.workspace_id)!;
    mutateProjectControlV01(revoked.db, { ...revoked.scope, action: "disable_automation", expected_active_project_id: revoked.scope.project_id,
      expected_active_selection_revision: active.selection_revision, expected_control_revision: 1 }, { now: revoked.now });
    await assert.rejects(() => rh.run(), /grant_source_or_permission_changed/); assert.equal(revoked.calls, 1);

    const wrongRoot = await fixture("wrong-root"); const wr = wrongRoot.authorizeOnly();
    renameSync(wrongRoot.projectRoot, `${wrongRoot.projectRoot}-original`); mkdirSync(wrongRoot.projectRoot);
    await assert.rejects(() => wrongRoot.host(wr.run_id).run(), /grant_source_or_permission_changed/); assert.equal(wrongRoot.calls, 0);
    assert.throws(() => new StatelessSourceReviewHost({ config: { ...normal.config, project_id: `project:${randomUUID()}` }, adapter: normal.adapter }, result.run.run_id).read(), /run_scope_invalid/);

    const irrelevant = await fixture("changed-after-choose", "read_selected_sources", "defer"); const ir = irrelevant.authorizeOnly(); const ih = irrelevant.host(ir.run_id);
    await ih.step(); writeFileSync(path.join(irrelevant.projectRoot, "entry.ts"), "changed meaning\n");
    await ih.run(); assert.equal(irrelevant.inputs[1].observation.availability, "conflicting"); assert.equal(irrelevant.inputs[1].observation.sources.length, 0);

    const during = await fixture("cancel-during-dispatch"); const dur = during.authorizeOnly(); const dh = during.host(dur.run_id);
    during.controls.dispatch = async () => { dh.cancel(during.credential()); };
    const dr = await dh.run(); assert.equal(during.calls, 1); assert.equal(dr.run.status, "cancelled"); assert.equal(dr.run.steps[0]!.status, "completed");

    const stale = await fixture("stale-generation"); const st = stale.authorizeOnly(); const sh = stale.host(st.run_id);
    stale.controls.dispatch = async () => { // Explicit isolated corruption: the old controller must not overwrite a successor fence.
      const step = sh.read().run.steps[0]!;
      updateAutonomyRunStepLedgerFields(step.step_id, { output: { ...step.output, generation: "successor-fence" } }, { db: stale.db });
    };
    await assert.rejects(() => sh.run(), /stale_generation_result_refused/);
    assert.equal(sh.read().stage, "dispatch_outcome_unknown"); await sh.run(); assert.equal(stale.calls, 1);
    const fenced = sh.read().failures.find(r => r.availability === "available" && r.evidence.layer === "fencing");
    assert.ok(fenced?.availability === "available"); assert.equal(fenced.evidence.code, "generation_fenced"); assert.equal(fenced.evidence.public_result.availability, "complete");

    const budget = await fixture("budget");
    await budget.call({ action: "preview", pricing: { input_nano_usd_per_byte: 1000, output_nano_usd_per_token: 1000, maximum_total_nano_usd: 1, source_version: "below-bound" } }, 409);
    const ba = budget.authorizeOnly(); budget.controls.outputTokens = 1025;
    await assert.rejects(() => budget.host(ba.run_id).run()); assert.equal(budget.calls, 1);
    const budgetSaved = budget.host(ba.run_id).read();
    assert.ok(budgetSaved.failures[0]?.availability === "available");
    assert.equal(budgetSaved.failures[0].evidence.layer, "gateway"); assert.equal(budgetSaved.failures[0].evidence.code, "model_gateway_budget_refused");
    assert.equal(budgetSaved.failures[0].evidence.public_result.availability, "unavailable");
    assert.equal(budgetSaved.stage, "finished"); assert.equal(budgetSaved.run.status, "stopped");
    const budgetStep = budgetSaved.run.steps[0]!;
    assert.equal(budgetStep.status, "failed"); assert.equal(budgetStep.output.dispatch_outcome, "returned_invalid");
    const failure = budgetStep.output.failure_receipt as any, received = budgetStep.output.received_model_result as any;
    assert.equal(failure.failure_code, "model_gateway_budget_refused"); assert.equal(failure.status, "blocked"); assert.equal(failure.egress_attempted, true);
    assert.equal(failure.cost.basis, "unavailable"); assert.equal(failure.cost.amount, null);
    assert.deepEqual(received.usage, { basis: "provider_report", quality: "reported", source: "provider_response", input_tokens: 200, output_tokens: 1025, total_tokens: 1225 });
    assert.equal(budgetSaved.receipt, null, "Rejected output is not a successful work receipt");
    const budgetAgain = (await budget.call({ action: "continue", run_id: ba.run_id })).result;
    assert.deepEqual(budgetAgain.run, budgetSaved.run); assert.equal(budget.calls, 1);

    const invalid = await fixture("invalid-choice", "run_arbitrary_command"); const inv = invalid.authorizeOnly();
    await assert.rejects(() => invalid.host(inv.run_id).run());
    const invalidState = invalid.host(inv.run_id).read(); assert.equal(invalidState.run.status, "stopped"); assert.equal(invalidState.run.steps[0]!.output.dispatch_outcome, "returned_invalid");

    const preEgress = await fixture("cancel-before-egress"); const pe = preEgress.authorizeOnly();
    const pa: ModelAdapterV01 = { ...preEgress.adapter, async prepare(purpose, signal) {
      const session = await preEgress.adapter.prepare(purpose, signal);
      await preEgress.call({ action: "cancel", run_id: pe.run_id }); return session;
    } };
    await assert.rejects(() => preEgress.host(pe.run_id, pa).run()); assert.equal(preEgress.calls, 0);
    assert.equal(preEgress.host(pe.run_id).read().run.steps[0]!.output.dispatch_outcome, "not_issued");
    const preEgressSaved = preEgress.host(pe.run_id).read(); assert.equal(preEgressSaved.run.steps[0]!.status, "failed");
    assert.equal(preEgressSaved.run.steps[0]!.output.received_model_result, null);
    assert.deepEqual((await preEgress.call({ action: "continue", run_id: pe.run_id })).result.run, preEgressSaved.run); assert.equal(preEgress.calls, 0);

    const wrongPurpose = await fixture("pre-egress-invalid-purpose"); const wp = wrongPurpose.authorizeOnly();
    // Negative adapter configuration fault: response-invalid can originate
    // before invoke, so the error code alone cannot prove a received response.
    const wrongPurposeAdapter: ModelAdapterV01 = { ...wrongPurpose.adapter, async prepare(purpose, signal) {
      const session = await wrongPurpose.adapter.prepare(purpose, signal);
      return session ? { ...session, purpose: "observe_delta_compile" } : null;
    } };
    await assert.rejects(() => wrongPurpose.host(wp.run_id, wrongPurposeAdapter).run());
    const wrongPurposeSaved = wrongPurpose.host(wp.run_id).read(), wrongPurposeOutput = wrongPurposeSaved.run.steps[0]!.output;
    assert.equal((wrongPurposeOutput.failure_receipt as any).failure_code, "model_gateway_provider_response_invalid");
    assert.equal((wrongPurposeOutput.failure_receipt as any).egress_attempted, false);
    assert.equal(wrongPurposeOutput.dispatch_outcome, "not_issued"); assert.equal(wrongPurposeOutput.received_model_result, null);
    assert.deepEqual((await wrongPurpose.call({ action: "continue", run_id: wp.run_id })).result.run, wrongPurposeSaved.run); assert.equal(wrongPurpose.calls, 0);

    const corrupt = await fixture("stored-result-corruption"); const co = corrupt.authorizeOnly(); const coh = corrupt.host(co.run_id);
    await coh.step(); await coh.step();
    updateAutonomyRunStepLedgerFields(coh.read().run.steps[1]!.step_id, { output: { forged: true } }, { db: corrupt.db });
    await assert.rejects(() => coh.run(), /stored_result_changed/); assert.equal(corrupt.calls, 1);

    const direction = await fixture("direction-changed"); const di = direction.authorizeOnly(); const dih = direction.host(di.run_id);
    await dih.step(); await dih.step();
    await direction.direction({ action: "decide", expected_ref: null, content: { purpose: "Different source question", criteria: [], constraints: [] }, reason: "Change current direction", status: "active", proposal_ref: null });
    await assert.rejects(() => dih.run()); assert.equal(direction.calls, 1);

    const audit = await fixture("actual-entrypoints", "read_selected_sources", "use_observation", true);
    const ar = (await audit.call({ action: "authorize_and_run", authorization: audit.preview })).result;
    assert.equal(ar.run.status, "completed", ar.run.stop_reason); assert.equal(audit.inputs[1].observation.sources.length, 2);
    const actualObservation = audit.inputs[1].observation;
    assert.equal(actualObservation.bytes_read, readFileSync("lib/vnext/automation/policy-triggered-planner-run.ts").length + readFileSync("lib/vnext/runtime/prospective-reentry.ts").length);
    assert.ok(actualObservation.sources[0].text.includes("external_action_performed: false"));
    assert.ok(actualObservation.sources[1].text.includes("source_bound_result_reentry"));
    assert.throws(() => previewActivePortableProjectV01(normal.db), /portable_stateless_review_not_supported/);
    const recovery = await fixture("recovery"); const ra = recovery.authorizeOnly(); const rrh = recovery.host(ra.run_id);
    await rrh.step(); await rrh.step();
    const backup = await recoveryBackup(recovery, "normal");
    const recoveredPath = path.join(backup.backupPath, RECOVERY_DATABASE_PAYLOAD);
    const recovered = new Database(recoveredPath);
    try { assert.equal(validateRecoveryCanonicalDatabaseV01(recovered).status, "valid"); } finally { recovered.close(); }
    const suspended = new StatelessSourceReviewHost({ config: { ...recovery.config, database_path: recoveredPath }, now: recovery.now, adapter: recovery.adapter }, ra.run_id);
    assert.equal((await suspended.run()).stage, "recovery_suspended"); assert.equal(recovery.calls, 1);
    assert.equal(canonical(suspended.read().run.steps), canonical(rrh.read().run.steps));
    assert.equal(requests, 0); assert.equal(zeroNetwork.attempts.length, 0);
    console.log(JSON.stringify({ status: "passed", normal_model_calls: normal.calls, action_bundles: 1, restart_model_calls: restart.calls + childResult.calls, fresh_process: true,
      selected_note_delivery_both_requests: true, selected_note_restart_from_database: true, selected_note_overflow_before_dispatch: true, stale_selected_note_authority_refused: true, ordinary_successor_authored: true, successor_execution_granted: false, unsettled_ledger_contract: "preserved",
      returned_over_budget: "returned_invalid_no_retry", pre_egress_refusal: "not_issued_no_retry", transport_loss: "unknown_no_retry",
      bounded_transport_diagnostics: "persisted_without_private_exception_material", cancellation_settles_unknown: false,
      local_disposition: "authenticated_revision_and_generation_fenced", linked_work: "explicit_null_grant_then_fresh_authorization", disposition_provider_calls: 0,
      fresh_process_disposition_read: true, late_result: "quarantined_original_attempt_replacement_unchanged",
      selected_direction_linked_preparation: true, changed_or_unselected_direction: "atomic_refusal", successor_review_reentry: "fresh_grant_and_loop_with_mandatory_uncertainty",
      audit_source_bytes: actualObservation.bytes_read, audit_preparation_bytes: audit.preparationBytes + ar.run.metadata.authorization_preparation_bytes + ar.run.steps[0].output.preparation_bytes, audit_excerpt_bytes: actualObservation.sources.reduce((n: number, f: any) => n + Buffer.byteLength(f.text), 0), completed_action_replays: 0, unknown_dispatch_retries: 0, external_requests: requests, actual_model_judgment: "NOT RUN", usefulness: "NOT RUN" }));
  } finally { for (const db of databases) db.close(); rmSync(root, { recursive: true, force: true }); network.unsubscribe(onNetwork); zeroNetwork.restore(); }
}
async function resumeChild(filename: string) {
  try {
    const { config, run_id, at, model = "gpt-4.1-mini" } = JSON.parse(readFileSync(filename, "utf8"));
    const script = scripted("read_selected_sources", "use_observation", model); const result = await new StatelessSourceReviewHost({ config, now: () => at, adapter: script.adapter }, run_id).run();
    assert.equal(result.run.status, "completed"); assert.equal(requests, 0);
    console.log(JSON.stringify({ calls: script.calls, observation: script.inputs[0].observation, selected_notes: script.inputs[0].selected_work_notes, serialized_request: script.serializedRequests[0], external_requests: requests }));
  } finally { rmSync(root, { recursive: true, force: true }); network.unsubscribe(onNetwork); }
}
void (process.argv[2] === "--resume" ? resumeChild(process.argv[3]!) : process.argv[2] === "--read-disposition" ? readDispositionChild(process.argv[3]!) : process.argv[2] === "--read-terminal" ? readTerminalChild(process.argv[3]!) : process.argv[2] === "--read-rejection" ? readRejectionChild(process.argv[3]!) : main()).catch(e => { console.error(e); process.exitCode = 1; });
