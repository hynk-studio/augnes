/** Disposable engineering producer/controller. Does not supply answers to the consumer. */
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync, existsSync, symlinkSync, unlinkSync } from "node:fs";
import fsPromises from "node:fs/promises";
import { syncBuiltinESMExports } from "node:module";
import path from "node:path";
import Database from "better-sqlite3";
import { applyCanonicalDatabaseMigrations } from "./canonical-database-migrations.mjs";
import { getOrCreateDefaultWorkspaceIdentityV01, getOrCreateCanonicalProjectForLocalRootV01, normalizeLocalProjectRootRefV01 } from "../lib/vnext/persistence/project-identity-registry";
import { selectActiveProjectV01, readActiveProjectSelectionV01 } from "../lib/vnext/persistence/project-lifecycle-registry";
import { defineInitialProjectWorkV01, readProjectWorkInitializationSnapshotV01 } from "../lib/vnext/runtime/project-work-initialization";
import { revisePreExecutionProjectWorkV01 } from "../lib/vnext/runtime/project-work-revision";
import { issueVNextLocalOperatorBootstrapV01, consumeVNextLocalOperatorBootstrapV01, readVNextLocalOperatorPilotConfigV01,
  readVNextLocalOperatorCredentialFromRequestV01, VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01, revokeVNextLocalOperatorSessionByCredentialV01,
  revokeVNextLocalOperatorSessionByIdV01, authenticateVNextLocalOperatorCurrentCredentialV01 } from "../lib/vnext/runtime/local-operator-session";
import { buildSelectedWorkSourceEntry, readSelectedWorkSources, compareSelectedWorkSources } from "../lib/intake/selected-work-source-comparison";
import { readProjectRunResultOverviewV01 } from "../lib/vnext/runtime/project-run-result-read-model";
import { readResultWorkPreparationV01, compareResultWorkSourcesV01, previewResultWorkV01, defineAuthoredSuccessorTaskV01 } from "../lib/vnext/runtime/authored-successor-task";
import { runDirectNativeHostRoundTripV01 } from "../lib/vnext/runtime/direct-native-host-round-trip";
import { POST, GET as inspectVerification } from "../app/api/vnext/operator/workflow-cost-verification/route";
import { GET as readResult } from "../app/api/vnext/operator/run-results/route";
import { createWorkflowCostVerificationAdapter } from "../lib/vnext/native-host/workflow-cost-verification-adapter";
import { WORKFLOW_COST_LIMITS } from "../lib/vnext/workflow-cost-verifier";
import { guardWorkflowCostProcess } from "./workflow-cost-process-guard.mjs";
import { listAutonomyRunLedgerRecords } from "../lib/autonomy/runner-ledger";

async function main() {
const mode = process.argv[2]!;
const config = readVNextLocalOperatorPilotConfigV01(process.env);
const root = path.dirname(config.database_path), projectRoot = path.join(root, "project"), sessionFile = path.join(root, "session.cookie");
const db = new Database(config.database_path); db.pragma("foreign_keys=ON");
const scope = { workspace_id: config.workspace_id, project_id: config.project_id };
const endpoint = "http://127.0.0.1/api/vnext/operator/workflow-cost-verification";
let cookie = existsSync(sessionFile) ? readFileSync(sessionFile, "utf8") : "";
function credential() { return readVNextLocalOperatorCredentialFromRequestV01(new Request(endpoint, { headers: { cookie } })); }
function updateCookie(value: string) { cookie = `${VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01}=${value}`; writeFileSync(sessionFile, cookie, { mode: 0o600 }); }
function record(name: string, value: unknown) { writeFileSync(path.join(root, name), JSON.stringify(value, null, 2), { mode: 0o600 }); }
async function post(body: unknown, signal?: AbortSignal) {
  const response = await POST(new Request(endpoint, { method: "POST", signal, headers: { host: "127.0.0.1", origin: "http://127.0.0.1", "content-type": "application/json", cookie }, body: JSON.stringify(body) }));
  const set = response.headers.get("set-cookie"); if (set) { cookie = set.split(";")[0]!; writeFileSync(sessionFile, cookie, { mode: 0o600 }); }
  return { status: response.status, body: await response.json() };
}
const ordinaryNotes = () => [{ source: "synthetic-applicability", observed_at: null, provenance: "user_declaration", label: "Open question",
  text: "Stationary probabilities are stipulated, not empirical. A possible history-dependent failure remains an unresolved applicability obligation." },
{ source: "independent-checklist", observed_at: null, provenance: "user_declaration", label: "Next check",
  text: "Retain mandatory verification and the independently approved rollback checklist regardless of optional inspection cost." }];
function writeData(inspection: "1" | "20", altered: boolean) {
  const inputs = { attempt: "10", verification: "2", repair: "4", direct_success: "2/5", inspection, inspected_success: "4/5" };
  writeFileSync(path.join(projectRoot, "basis.json"), JSON.stringify(inputs));
  writeFileSync(path.join(projectRoot, "report.json"), JSON.stringify({ inputs,
    evidence: "constructed development calculation; probabilities and costs are stipulated",
    workflows: { direct: { status: "finite", expected_work: "36" }, inspected: { status: "finite", expected_work: inspection === "1" ? "69/4" : "41" } },
    inspection_minus_direct: altered ? "0" : inspection === "1" ? "-75/4" : "5",
    comparison: inspection === "1" ? "inspection_reduces_work" : "inspection_adds_work" }));
}
async function select() {
  const response = await inspectVerification(new Request(endpoint, { headers: { host: "127.0.0.1", cookie } }));
  assert.equal(response.status, 200); const inspected = await response.json(); record(`selection-${mode}.json`, inspected);
  const body = { ...inspected.identity, basis_path: "basis.json", report_path: "report.json" };
  const preview = await post({ action: "preview", ...body }); assert.equal(preview.status, 200, JSON.stringify(preview));
  const selected = await post({ action: "select", ...body, preview_binding: preview.body.preview_binding }); assert.equal(selected.status, 200, JSON.stringify(selected));
  const { packet_id, packet_fingerprint, root_fingerprint, selection_binding, criteria_binding, verifier_source } = selected.body;
  const request = { action: "verify", packet_id, packet_fingerprint, root_fingerprint, selection_binding, criteria_binding, verifier_source };
  record("verify-request.json", request); return request;
}
async function verify(request = JSON.parse(readFileSync(path.join(root, "verify-request.json"), "utf8"))) {
  const result = await post(request); record(`result-${mode}.json`, result);
  assert.equal(result.status, 200, JSON.stringify(result));
  const receipt = result.body.result.identity.receipt_ref;
  const response = await readResult(new Request(`http://127.0.0.1/api/vnext/operator/run-results?receipt_ref=${receipt}`, { headers: { host: "127.0.0.1", cookie } }));
  assert.equal(response.status, 200); const fresh = await response.json();
  assert.deepEqual(fresh.result, result.body.result); record(`readback-${mode}.json`, fresh);
  return result;
}
async function successor(note: string) {
  const latest = readProjectRunResultOverviewV01(db, config).latest_result!;
  const before = readResultWorkPreparationV01(db, { config, receipt_id: latest.receipt_ref });
  const current = readProjectWorkInitializationSnapshotV01(db, config).packet!;
  const comparison = compareResultWorkSourcesV01(db, { config, binding: before.binding,
    notes: [...readSelectedWorkSources(current).map(e => ({ saved_source_id: e.entry_id })),
      { source: `synthetic-correction-${mode}`, observed_at: null, provenance: "user_declaration", label: "Changed assumption / user correction", text: note }] });
  const preview = previewResultWorkV01(db, { config, binding: before.binding, definition: {
    goal: current.task.goal, success_criteria: current.task.success_criteria, non_goals: current.task.non_goals },
    selected_sources: { selected_source_context: comparison.entries, expected_source_comparison: comparison.fingerprint, omitted_sources: [] } });
  const saved = await defineAuthoredSuccessorTaskV01(db, { config, credential: credential(), request: preview.request });
  updateCookie(saved.session_admission.cookie_value);
}
const isolation = guardWorkflowCostProcess(root);
try {
  if (mode === "seed" || mode === "prepare") {
    mkdirSync(projectRoot); applyCanonicalDatabaseMigrations(db);
    getOrCreateDefaultWorkspaceIdentityV01(db, { create_uuid: () => scope.workspace_id.slice(10) });
    getOrCreateCanonicalProjectForLocalRootV01(db, { workspace_id: scope.workspace_id, local_root: normalizeLocalProjectRootRefV01(projectRoot, { base_path: root }) }, { create_uuid: () => scope.project_id.slice(8) });
    selectActiveProjectV01(db, { ...scope, expected_project_id: null, expected_revision: null, now: new Date().toISOString() });
    const bootstrap = issueVNextLocalOperatorBootstrapV01(db, { config });
    const session = consumeVNextLocalOperatorBootstrapV01(db, { config, bootstrap_token: bootstrap.bootstrap_token }); updateCookie(session.cookie_value);
    const active = readActiveProjectSelectionV01(db, scope.workspace_id)!;
    const initial = defineInitialProjectWorkV01(db, { config, credential: credential(), request: { action: "define_initial_project_work", ...scope,
      expected_active_project_id: scope.project_id, expected_active_selection_revision: active.selection_revision, expected_initialization_state: "not_defined",
      goal: "Choose conditional optional inspection using fixed independent verification and preserve mandatory checks.",
      success_criteria: ["Retain conditions, rejected claims and unresolved applicability."], non_goals: ["No deployment or semantic acceptance"] } });
    updateCookie(initial.session_admission.cookie_value);
    const comparison = compareSelectedWorkSources(initial.packet, ordinaryNotes().map(n => buildSelectedWorkSourceEntry(scope, n)));
    const saved = revisePreExecutionProjectWorkV01(db, { config, credential: credential(), request: { action: "revise_pre_execution_project_work", ...scope,
      expected_active_project_id: scope.project_id, expected_active_selection_revision: active.selection_revision,
      expected_current_packet_id: initial.packet.packet_id, expected_current_packet_fingerprint: initial.packet.integrity.fingerprint,
      expected_current_lineage_kind: "initial_user_defined", ...initial.definition, selected_source_context: comparison.entries, expected_source_comparison: comparison.fingerprint } });
    updateCookie(saved.session_admission.cookie_value); writeData("1", mode === "seed"); const request = await select();
    if (mode === "seed") await verify(request);
  } else if (mode === "correct-report" || mode === "correct-input") {
    await successor(mode === "correct-report" ? "The original report falsely claimed difference zero; retain the rejected receipt. Correct the report under the unchanged numeric basis."
      : "Optional inspection costs 20 per attempt, including retries, rather than 1. The earlier input basis is historical; preserve independent rollback material and unresolved stationarity.");
    writeData(mode === "correct-report" ? "1" : "20", false); await verify(await select());
  } else if (mode === "unrelated") {
    await successor("Unrelated documentation label changed. Numeric basis, verified material and the rollback checklist remain applicable under the same stipulated conditions.");
  } else if (mode === "replay") {
    const before = readProjectRunResultOverviewV01(db, config).latest_result;
    const count = listAutonomyRunLedgerRecords({ db, scope: config.project_id, limit: 16 }).length;
    const result = await verify(); assert.equal(result.body.status, "exact_replay");
    assert.deepEqual(readProjectRunResultOverviewV01(db, config).latest_result, before);
    assert.equal(listAutonomyRunLedgerRecords({ db, scope: config.project_id, limit: 16 }).length, count);
  } else if (mode === "refusals") {
    const savedRequest = JSON.parse(readFileSync(path.join(root, "verify-request.json"), "utf8"));
    const packet = readProjectWorkInitializationSnapshotV01(db, config).packet!;
    const request = { ...savedRequest, packet_id: packet.packet_id, packet_fingerprint: packet.integrity.fingerprint };
    const results = [];
    for (const [field, value] of [["criteria_binding", "sha256:" + "0".repeat(64)], ["selection_binding", "sha256:" + "0".repeat(64)],
      ["verifier_source", "sha256:" + "0".repeat(64)], ["packet_id", "packet:foreign"], ["root_fingerprint", "sha256:" + "0".repeat(64)]]) {
      const result = await post({ ...request, [field!]: value }); assert.notEqual(result.status, 200); results.push({ field, ...result });
    }
    const stale = await post(savedRequest); assert.notEqual(stale.status, 200); results.push({ field: "stale_work", ...stale });
    for (const file of ["basis.json", "report.json"]) {
      const target = path.join(projectRoot, file), original = readFileSync(target);
      try {
        writeFileSync(target, Buffer.concat([original, Buffer.from("\n")]));
        const changed = await post(request); assert.equal(changed.body.error_code, "workflow_cost_sources_changed"); results.push({ field: `changed_${file}`, ...changed });
        writeFileSync(target, " ".repeat(65_537));
        const oversized = await post(request); assert.equal(oversized.body.error_code, "workflow_cost_file_bound"); results.push({ field: `oversized_${file}`, ...oversized });
        unlinkSync(target); symlinkSync(file === "basis.json" ? "report.json" : "basis.json", target);
        const alias = await post(request); assert.equal(alias.body.error_code, "workflow_cost_file_alias_refused"); results.push({ field: `symlink_${file}`, ...alias });
      } finally { unlinkSync(target); writeFileSync(target, original); }
    }
    const originalCookie = cookie;
    const foreignRoot = path.join(root, "foreign"); mkdirSync(foreignRoot);
    const foreignProject = getOrCreateCanonicalProjectForLocalRootV01(db, { workspace_id: scope.workspace_id,
      local_root: normalizeLocalProjectRootRefV01(foreignRoot, { base_path: root }) }, { create_uuid: () => "33333333-3333-4333-8333-333333333333" });
    const foreignConfig = { ...config, project_id: foreignProject.project.project_id };
    const bootstrap = issueVNextLocalOperatorBootstrapV01(db, { config: foreignConfig });
    updateCookie(consumeVNextLocalOperatorBootstrapV01(db, { config: foreignConfig, bootstrap_token: bootstrap.bootstrap_token }).cookie_value);
    const foreign = await post(request); assert.notEqual(foreign.status, 200); results.push({ field: "foreign_project", ...foreign });
    cookie = originalCookie; writeFileSync(sessionFile, cookie, { mode: 0o600 });
    revokeVNextLocalOperatorSessionByCredentialV01(db, { config, credential: credential() });
    const revoked = await post(request); assert.equal(revoked.status, 401); results.push({ field: "revoked", ...revoked }); record("refusals.json", results);
  } else if (mode === "missing-check") {
    // Negative normalization fault only. Successful product demonstrations all
    // call the unchanged public handler above with its real fixed adapter.
    const request = JSON.parse(readFileSync(path.join(root, "verify-request.json"), "utf8"));
    const adapter = createWorkflowCostVerificationAdapter(async () => { authenticateVNextLocalOperatorCurrentCredentialV01(db, { config, credential: credential() }); });
    const invoke = adapter.invoke;
    adapter.invoke = (request, control) => {
      const invocation = invoke(request, control);
      return { ...invocation, result: invocation.result.then(result => ({ ...result,
        checks: result.checks.filter(c => c.check_id !== "workflow_cost_expected_work") })) };
    };
    const result = await runDirectNativeHostRoundTripV01(db, { config, mode: "interactive", operator_mutation: { credential: credential() } }, {
      adapter, resolve_packet_selection: () => ({ packet_id: request.packet_id, packet_fingerprint: request.packet_fingerprint }),
      on_invocation_admitted: ({ session_admission }) => { if (session_admission) updateCookie(session_admission.cookie_value); } });
    assert(result.receipt.skipped_checks.some(c => c.check_id === "workflow_cost_expected_work"));
    assert.notEqual(result.receipt.verification.status, "passed"); record("result-missing-check.json", result.receipt);
  } else if (["interrupt-execution", "interrupt-storage", "interrupt-delivery", "cancel-execution", "timeout-execution", "revoke-execution"].includes(mode)) {
    // Test-only fault at actual I/O/receipt admission; the product handler has
    // no adapter override, injected result, test switch or failure bypass.
    const request = JSON.parse(readFileSync(path.join(root, "verify-request.json"), "utf8"));
    const abort = new AbortController();
    const originalOpen = fsPromises.open, originalPrepare = Database.prototype.prepare, originalExec = Database.prototype.exec;
    let reads = 0;
    const marker = () => { writeFileSync(1, `interrupt_boundary:${mode}\n`); };
    if (!["interrupt-storage", "interrupt-delivery"].includes(mode)) {
      fsPromises.open = (async (...args: Parameters<typeof fsPromises.open>) => {
        if (String(args[0]) === path.join(projectRoot, "basis.json") && ++reads === 2) {
          marker();
          if (mode === "cancel-execution") { abort.abort(); await new Promise(resolve => setTimeout(resolve, 30)); }
          else if (mode === "timeout-execution") await new Promise(resolve => setTimeout(resolve, WORKFLOW_COST_LIMITS.timeout_ms + 50));
          else if (mode === "revoke-execution") revokeVNextLocalOperatorSessionByIdV01(db, { config, session_id: credential().session_id });
          else await new Promise(() => { setTimeout(() => { throw new Error("interruption_not_observed"); }, 5000); });
        }
        return originalOpen(...args);
      }) as typeof fsPromises.open;
      syncBuiltinESMExports();
    } else {
      let wroteReceipt = false;
      if (mode === "interrupt-delivery") Database.prototype.exec = function(this: Database.Database, sql: string) {
        const result = originalExec.call(this, sql);
        if (sql === "COMMIT" && wroteReceipt) { marker(); Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 5000); throw new Error("interruption_not_observed"); }
        return result;
      };
      Database.prototype.prepare = function(this: Database.Database, sql: string) {
        const statement = originalPrepare.call(this, sql);
        if (/INSERT INTO vnext_core_records/u.test(sql)) {
          const originalRun = statement.run;
          statement.run = function(this: Database.Statement, ...args: unknown[]) {
            if (args[0] === "run_receipt") {
              if (mode === "interrupt-storage") { marker(); Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 5000); throw new Error("interruption_not_observed"); }
              wroteReceipt = true;
            }
            return Reflect.apply(originalRun, this, args);
          };
        }
        return statement;
      } as typeof Database.prototype.prepare;
    }
    try {
      const result = await post(request, abort.signal); record(`result-${mode}.json`, result);
      assert(!mode.startsWith("interrupt")); assert.equal(result.status, 200);
      assert.equal(result.body.result.summary.outcome, mode === "cancel-execution" ? "cancelled" : mode === "timeout-execution" ? "timed_out" : "failed");
      if (mode === "revoke-execution") {
        const bootstrap = issueVNextLocalOperatorBootstrapV01(db, { config });
        updateCookie(consumeVNextLocalOperatorBootstrapV01(db, { config, bootstrap_token: bootstrap.bootstrap_token }).cookie_value);
      }
      const replay = await post(request); assert.equal(replay.body.status, "exact_replay");
      assert.equal(replay.body.result.identity.receipt_ref, result.body.result.identity.receipt_ref);
    } finally { fsPromises.open = originalOpen; Database.prototype.prepare = originalPrepare; Database.prototype.exec = originalExec; syncBuiltinESMExports(); }
  } else if (mode === "recover" || mode === "recover-delivery") {
    // A killed request may have committed its nonce. Fresh local bootstrap is
    // ordinary authentication, not a reset of the run or replay permission.
    const bootstrap = issueVNextLocalOperatorBootstrapV01(db, { config });
    updateCookie(consumeVNextLocalOperatorBootstrapV01(db, { config, bootstrap_token: bootstrap.bootstrap_token }).cookie_value);
    const before = readProjectRunResultOverviewV01(db, config);
    if (mode === "recover") { assert.equal(before.latest_result, null); assert(before.current_run); }
    else { assert(before.latest_result); assert.equal(before.current_run, null); }
    const request = JSON.parse(readFileSync(path.join(root, "verify-request.json"), "utf8"));
    const deliveries = [await post(request), await post(request)];
    for (const result of deliveries) {
      if (mode === "recover") assert.equal(result.body.error_code, "direct_host_run_conflict");
      else { assert.equal(result.body.status, "exact_replay"); assert.equal(result.body.result.identity.receipt_ref, before.latest_result!.receipt_ref); }
    }
    const after = readProjectRunResultOverviewV01(db, config);
    assert.deepEqual(after, before);
    assert.equal(listAutonomyRunLedgerRecords({ db, scope: config.project_id, limit: 16 }).length, 1);
    record("recovery.json", { before, deliveries, after, disposition: mode === "recover" ? "existing unresolved run retained; no automatic rerun or fabricated terminal receipt" : "persisted terminal result restored; duplicate delivery returns the same receipt" });
  } else throw new Error("fixture_mode_unknown");
  record(`isolation-${mode}.json`, isolation.observation);
  console.log(JSON.stringify({ mode, status: "passed", model_calls: 0 }));
} finally { isolation.finish(); db.close(); }
}
void main().catch(error => { console.error(error); process.exitCode = 1; });
