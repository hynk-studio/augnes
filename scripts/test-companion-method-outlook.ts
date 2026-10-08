// Production route/proxy integration with disposable writer-authored work only.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { applyCanonicalDatabaseMigrations } from "./canonical-database-migrations.mjs";
import { trackServerConnections, closeTrackedServer } from "./test-harness-process-lifecycle.mjs";
import { runCanonicalChild, canonicalChildAcceptanceFailure } from "./canonical-child-runner.mjs";
import { installZeroNetworkGuard } from "./test-harness-zero-network-guard.mjs";
import { POST as resumeRoute } from "../app/api/augnes/read/codex-repository-continuity/route";
import { POST as sourcesRoute } from "../app/api/augnes/read/codex-repository-work-sources/route";
import { POST as outlookRoute } from "../app/api/augnes/read/codex-repository-method-outlook/route";
import { POST as writerRoute } from "../app/api/augnes/repository-work-revision/route";
import { handleMessageV01, parseRepositoryMethodOutlookResponseV01, parseRepositoryWorkSourcesResponseV01 } from "../plugins/augnes-operator/mcp/companion-proxy.mjs";
import { getOrCreateDefaultWorkspaceIdentityV01, getOrCreateCanonicalProjectForLocalRootV01, normalizeLocalProjectRootRefV01 } from "../lib/vnext/persistence/project-identity-registry";
import { readActiveProjectSelectionV01, selectActiveProjectV01 } from "../lib/vnext/persistence/project-lifecycle-registry";
import { readCodexRepositoryContinuityV01 } from "../lib/vnext/codex-repository-continuity/codex-repository-continuity";
import { readCodexRepositoryMethodOutlookV01 } from "../lib/vnext/codex-repository-continuity/codex-repository-method-outlook";
import { buildPreExecutionProjectWorkRevisionPacketV01, inspectPreExecutionProjectWorkRevisionChainV01 } from "../lib/vnext/runtime/pre-execution-project-work-revision";
import { readRetryInspectionOutlookV01, buildRetryInspectionOutlookV01, RETRY_INSPECTION_OUTLOOK_V01 } from "../lib/vnext/retry-inspection-outlook";
import { compareSelectedWorkSources, buildSelectedWorkSourceEntry, readSelectedWorkSources } from "../lib/intake/selected-work-source-comparison";
import { canonicalizeProtocolValueV01 as canonical } from "../lib/vnext/protocol-primitives";
import { COMPANION_WORK_OPERATOR_ID_V01, issueVNextLocalOperatorBootstrapV01, consumeVNextLocalOperatorBootstrapV01, readVNextLocalOperatorCredentialFromRequestV01, VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01 } from "../lib/vnext/runtime/local-operator-session";
import { buildTaskContextPacketV01 } from "../lib/vnext/task-context-packet";
import { insertVNextCoreRecordV01 } from "../lib/vnext/persistence/durable-semantic-store";
import { packetLineageKindV01 } from "../lib/vnext/runtime/project-work-revision";
import { mutateHumanDirection } from "../lib/vnext/runtime/project-direction";

const directory = mkdtempSync(path.join(tmpdir(), "augnes-method-outlook-"));
const databasePath = path.join(directory, "fixture.db"), db = new Database(databasePath);
const originalEnvironment = { ...process.env };
const guard = installZeroNetworkGuard({ allowLoopback: true });
const instance = "method-outlook-fixture", generation = "generation-1", repository = "a".repeat(64), token = "fixture-only-channel".repeat(3);
let origin = "", requestId = 0, readCount = 0, writeCount = 0, errors = 0;
const routes: Record<string, (request: Request) => Promise<Response>> = {
  "/api/augnes/read/codex-repository-continuity": resumeRoute,
  "/api/augnes/read/codex-repository-work-sources": sourcesRoute,
  "/api/augnes/read/codex-repository-method-outlook": outlookRoute,
  "/api/augnes/repository-work-revision": writerRoute,
};
const server = trackServerConnections(createServer(async (req, res) => {
  try {
    const url = new URL(req.url!, origin);
    if (["/healthz", "/api/healthz"].includes(url.pathname)) {
      res.setHeader("content-type", "application/json"); res.end(JSON.stringify({ ok: true, name: "augnes-console", service: "augnes-ui", status: "ready", mode: "http", live_core_status: "ready", recovery_mode: false,
        runtime_instance_id: instance, runtime_generation_id: generation, runtime_repository_fingerprint: repository })); return;
    }
    const handler = routes[url.pathname]; if (!handler) { res.writeHead(404).end(); return; }
    const chunks = []; for await (const chunk of req) chunks.push(Buffer.from(chunk));
    const body = Buffer.concat(chunks).toString();
    const before = db.serialize();
    const response = await handler(new Request(url, { method: req.method, headers: req.headers as Record<string, string>, ...(body ? { body } : {}) }));
    if (url.pathname.includes("/read/")) { readCount++; assert(before.equals(db.serialize()), "read-attributable database mutation"); }
    else writeCount++;
    response.headers.forEach((value, key) => res.setHeader(key, value));
    res.writeHead(response.status).end(await response.text());
  } catch { errors++; res.writeHead(500).end('{"fixture_error":true}'); }
}));

async function call(name: string, args: object): Promise<any> {
  const response: any = await handleMessageV01({ jsonrpc: "2.0", id: ++requestId, method: "tools/call", params: { name, arguments: args } });
  assert(!response.error && !response.result?.isError, `tool refused: ${name}`);
  return response.result.structuredContent;
}
const resume = (repositoryRoot: string) => call("augnes_resume_repository", { repositoryRoot });
async function read(repositoryRoot: string) {
  const current = await resume(repositoryRoot);
  return call("augnes_read_repository_method_outlook", { repositoryRoot, expectedSnapshotBinding: current.continuity.snapshot.binding });
}
async function revise(repositoryRoot: string, changes: object) {
  const current = await resume(repositoryRoot), args = { repositoryRoot, expectedSnapshotBinding: current.continuity.snapshot.binding, changes };
  const preview = await call("augnes_preview_repository_work_revision", args); assert.equal(preview.status, "previewed");
  const saved = await call("augnes_save_repository_work_revision", { ...args, previewBinding: preview.preview_binding }); assert.equal(saved.status, "saved"); return saved;
}
const note = (kind: string, value: object) => ({ source: `Constructed ordinary outlook ${kind}`, text: JSON.stringify({ profile: "augnes.retry-inspection-input.v0.1", kind, ...value }),
  observed_at: null, provenance: kind === "direction" ? "user_declaration" : "derived_interpretation", label: "Next check" });

async function main() {
  db.pragma("foreign_keys = ON"); db.pragma("journal_mode = WAL"); applyCanonicalDatabaseMigrations(db);
  const workspace = getOrCreateDefaultWorkspaceIdentityV01(db);
  Object.assign(process.env, { AUGNES_DB_PATH: databasePath, AUGNES_RUNTIME_CHILD_ROLE: "ui", AUGNES_RUNTIME_INSTANCE_ID: instance,
    AUGNES_RUNTIME_GENERATION_ID: generation, AUGNES_RUNTIME_REPOSITORY_FINGERPRINT: repository, AUGNES_COMPANION_PROXY_TOKEN: token });
  delete process.env.AUGNES_RECOVERY_MODE;
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const port = (server.address() as { port: number }).port; origin = `http://127.0.0.1:${port}`;
  const manifest = { schema_version: 2, contract: "augnes-local-runtime-supervisor-v1", generation_version: 1, generation_id: generation,
    instance_id: instance, repository_fingerprint: repository, supervisor_pid: process.pid, lifecycle_state: "ready", database_state: "ready",
    effective_url: origin, ui_port: port, bridge_port: port, children: ["ui", "bridge"].map(role => ({ role, pid: process.pid, port, state: "ready" })) };
  const manifestPath = path.join(directory, "runtime.json");
  writeFileSync(manifestPath, JSON.stringify(manifest), { mode: 0o600 });
  writeFileSync(path.join(directory, "companion-access.json"), JSON.stringify({ schema_version: 2, contract: manifest.contract, generation_version: 1,
    generation_id: generation, instance_id: instance, repository_fingerprint: repository, access_version: "augnes-companion-proxy-access.v0.1", proxy_token: token }), { mode: 0o600 });
  Object.assign(process.env, { AUGNES_COMPANION_RUNTIME_MANIFEST: manifestPath, AUGNES_COMPANION_TEST_MODE: "1" });
  const horizon = new Date(Date.now() + 3600_000).toISOString();
  const cases = []; let precedingRoot: string | null = null;
  for (const [name, available] of [["availability-change", null], ["unchanged-support", true]] as const) {
    const root = path.join(directory, name); mkdirSync(root);
    const registration = getOrCreateCanonicalProjectForLocalRootV01(db, { workspace_id: workspace.workspace_id,
      local_root: normalizeLocalProjectRootRefV01(root, { base_path: directory }), display_name: name });
    const scope = { workspace_id: workspace.workspace_id, project_id: registration.project.project_id };
    const selected = readActiveProjectSelectionV01(db, workspace.workspace_id);
    selectActiveProjectV01(db, { ...scope, expected_project_id: selected?.project_id ?? null, expected_revision: selected?.selection_revision ?? null, now: new Date().toISOString() });
    const current = await resume(root), args = { repositoryRoot: root, expectedSnapshotBinding: current.continuity.snapshot.binding,
      changes: { goal: "Inspect the candidate module before any permitted execution", success_criteria: ["Record local diagnostic availability and retain mandatory checks"], non_goals: ["No program execution, provider, managed run, empirical rate learning or direction change"] } };
    const initial = await call("augnes_preview_repository_initial_work", args);
    assert.equal((await call("augnes_define_repository_initial_work", { ...args, previewBinding: initial.preview_binding })).status, "saved");
    const absent = await read(root); assert.equal(absent.status, "absent");
    const sources = await call("augnes_read_repository_work_sources", { repositoryRoot: root, expectedSnapshotBinding: absent.snapshot_binding });
    const { companion: _companion, ...defaultSources } = sources;
    parseRepositoryWorkSourcesResponseV01(defaultSources);
    assert(!Object.hasOwn(defaultSources, "outlook"), "default DTO unchanged");
    await revise(root, { sources: { add: [
      note("direction", { purpose: "Fixture author asks to reduce stipulated retry work while keeping required verification", priority: "reduce_work" }),
      note("workflow", { attempt: 8, verification: 2, repair: 3, direct_success: { numerator: 3, denominator: 5 }, stationary: true, unit: "stipulated effort units", valid_until: horizon, support_refs: [] }),
      note("inspection", { cost: 2, success: { numerator: 4, denominator: 5 }, available, preparation: "Check local Node syntax-check support using the known-valid prerequisite module", valid_until: horizon, support_refs: [] }),
    ] } });
    const before = await read(root);
    assert(before.sources.every((s: any) => s.source_locator === null), "withheld locators remain withheld");
    assert(!JSON.stringify(before).includes("Constructed ordinary outlook inspection"));
    const beforePacket = inspectPreExecutionProjectWorkRevisionChainV01(db, scope).tip_packet;
    const savedBefore = canonical(beforePacket), selectedBefore = canonical(readActiveProjectSelectionV01(db, workspace.workspace_id));
    const stableRead = await read(root); assert.equal(stableRead.outlook.judgment_id, before.outlook.judgment_id);
    const prerequisite = path.join(root, "prerequisite.mjs"), candidate = path.join(root, "candidate.mjs");
    writeFileSync(prerequisite, "export const prerequisite = true;\n");
    writeFileSync(candidate, "export const candidate = ;\n");
    let stdout = "", stderr = "";
    const result = await runCanonicalChild({ suite: "method-outlook", label: name, command: process.execPath,
      args: [path.join(process.cwd(), "scripts/companion-method-outlook-consumer.mjs"), root, prerequisite, candidate], cwd: directory,
      env: { PATH: process.env.PATH, AUGNES_COMPANION_RUNTIME_MANIFEST: manifestPath, AUGNES_COMPANION_TEST_MODE: "1" }, timeoutMs: 25_000, heartbeatMs: 0, resourceOwner: undefined, log: () => {},
      stdout: { write(chunk: string | Uint8Array) { stdout += chunk; return true; } } as typeof process.stdout, stderr: { write(chunk: string | Uint8Array) { stderr += chunk; return true; } } as typeof process.stderr });
    assert.equal(canonicalChildAcceptanceFailure(result, { suite: "method-outlook", timeoutMs: 25_000, requireNaturalExit: true }), null, stderr);
    const consumer = JSON.parse(stdout); assert.equal(consumer.before.action, available === null ? "observe" : "inspect");
    assert.equal(consumer.after.action, "inspect"); assert.equal(consumer.observation.exit_status, 0); assert.equal(consumer.follow_up.exit_status, 1);
    assert.match(consumer.next_behavior, /Decline execution/); assert.equal(consumer.program_executed, false);
    assert.equal(canonical(readActiveProjectSelectionV01(db, workspace.workspace_id)), selectedBefore);
    const chain = inspectPreExecutionProjectWorkRevisionChainV01(db, scope);
    assert.equal(canonical(chain.packets.find(p => p.packet_id === beforePacket.packet_id)), savedBefore);
    assert.deepEqual(readRetryInspectionOutlookV01(beforePacket), before.outlook);
    assert.equal(chain.tip_packet.capability_grant, null);
    const after = await read(root); assert.notEqual(after.packet.packet_fingerprint, before.packet.packet_fingerprint);
    if (precedingRoot) assert.equal((await call("augnes_read_repository_method_outlook", { repositoryRoot: precedingRoot, expectedSnapshotBinding: after.snapshot_binding })).status, "refresh_required");
    precedingRoot = root;
    assert.equal((await call("augnes_read_repository_method_outlook", { repositoryRoot: root, expectedSnapshotBinding: before.snapshot_binding })).status, "refresh_required");
    assert.equal((await call("augnes_read_repository_method_outlook", { repositoryRoot: directory, expectedSnapshotBinding: after.snapshot_binding })).repository_resolution, "project_not_registered");
    const beforeReads = db.serialize();
    const at = new Date(Date.parse(horizon) + 1).toISOString(), dependencies = { now: () => at };
    const later = await readCodexRepositoryContinuityV01(db, { repository_root: root }, dependencies);
    const expired = await readCodexRepositoryMethodOutlookV01(db, { repository_root: root, expected_snapshot_binding: later.continuity!.snapshot.binding! }, dependencies);
    assert.equal(expired.status, "available"); assert(expired.applicability!.reasons.includes("horizon_expired_or_missing"));
    assert.equal(expired.outlook!.judgment_id, after.outlook.judgment_id); assert(beforeReads.equals(db.serialize()));
    await boundaryChecks(root, scope, after, horizon);
    cases.push({ case: name, ...consumer });
  }
  assert.equal((db.prepare("SELECT count(*) n FROM autonomy_runs").get() as { n: number }).n, 0);
  assert.equal(errors, 0); assert.equal(guard.attempts.length, 0);
  console.log(JSON.stringify({ status: "pass", cases, actual_proxy_http_routes: true, read_requests_without_writes: readCount, writer_requests: writeCount,
    managed_runs: 0, external_requests: guard.attempts.length, consumer_cleanup: "natural exit, closed streams, zero owned processes" }));
}

async function boundaryChecks(root: string, scope: { workspace_id: string; project_id: string }, value: any, horizon: string) {
  const endpoint = origin + "/api/augnes/read/codex-repository-method-outlook?scope=repository:local";
  const headers = { "content-type": "application/json", "x-augnes-local-readonly": "codex-repository-method-outlook-v0.1", "x-augnes-companion-proxy": token,
    "x-augnes-runtime-instance": instance, "x-augnes-runtime-generation": generation, "x-augnes-runtime-repository": repository };
  const input = { repository_root: root, expected_snapshot_binding: value.snapshot_binding };
  for (const [extra, status] of [[{ "x-augnes-companion-proxy": "wrong" }, 403], [{ "x-augnes-runtime-instance": "wrong" }, 409],
    [{ "x-augnes-runtime-generation": "wrong" }, 409], [{ "x-augnes-runtime-repository": "wrong" }, 409], [{ origin }, 403]] as const) {
    const response = await fetch(endpoint, { method: "POST", headers: { ...headers, ...extra }, body: JSON.stringify(input) });
    assert.equal(response.status, status); await response.body?.cancel();
  }
  const callerTime = await fetch(endpoint, { method: "POST", headers, body: JSON.stringify({ ...input, evaluated_at: horizon }) });
  assert.equal(callerTime.status, 400); await callerTime.body?.cancel();
  const invalidTool: any = await handleMessageV01({ jsonrpc: "2.0", id: ++requestId, method: "tools/call", params: { name: "augnes_read_repository_method_outlook", arguments: { repositoryRoot: root, expectedSnapshotBinding: value.snapshot_binding, evaluatedAt: horizon } } });
  assert.equal(invalidTool.error.code, -32602);
  const { companion: _companion, ...projection } = value;
  assert.deepEqual(parseRepositoryMethodOutlookResponseV01(projection), projection);
  for (const extra of [{ raw_packet: {} }, { credential: "withheld" }, { withheld_locator: "private" }]) assert.throws(() => parseRepositoryMethodOutlookResponseV01({ ...projection, ...extra }), /contract_invalid/);
  const missing = structuredClone(projection); missing.sources.pop(); assert.throws(() => parseRepositoryMethodOutlookResponseV01(missing), /contract_invalid/);
  const foreign = structuredClone(projection); foreign.outlook.sources[0].source_ref = `sha256:${"e".repeat(64)}`; assert.throws(() => parseRepositoryMethodOutlookResponseV01(foreign), /contract_invalid/);
  const malformed = structuredClone(projection); malformed.outlook.sources[0] = null; assert.throws(() => parseRepositoryMethodOutlookResponseV01(malformed), /contract_invalid/);
  const oversized = structuredClone(projection); oversized.outlook.recommendation = "x".repeat(128 * 1024); assert.throws(() => parseRepositoryMethodOutlookResponseV01(oversized), /contract_invalid/);
  const packet = inspectPreExecutionProjectWorkRevisionChainV01(db, scope).tip_packet;
  // Reuse the historical producer/reconstructor, exercising the adapter's version-preserving decoder.
  const old = structuredClone(packet); old.compatibility.source_contracts = old.compatibility.source_contracts.map(x => x === "augnes.retry-inspection-outlook.v0.2" ? RETRY_INSPECTION_OUTLOOK_V01 : x);
  const historical = buildRetryInspectionOutlookV01(readSelectedWorkSources(old), old.generated_at)!;
  old.current_projection!.items = old.current_projection!.items.map(item => item.summary === canonical(projection.outlook) ? { ...item, summary: canonical(historical) } : item);
  assert.deepEqual(readRetryInspectionOutlookV01(old), historical);
  assert.equal(parseRepositoryMethodOutlookResponseV01({ ...projection, outlook: historical }).outlook.version, RETRY_INSPECTION_OUTLOOK_V01);
  // Historical migration fixture, separate from the writer-authored consumer:
  // regenerate with the existing versioned compiler, then substitute only the
  // tip in a disposable copy. Restore immutability before any reader executes.
  const history = inspectPreExecutionProjectWorkRevisionChainV01(db, scope), tip = history.tip_revision!;
  const selected = readSelectedWorkSources(packet), selection = readActiveProjectSelectionV01(db, scope.workspace_id)!;
  const historicalBuilt = buildPreExecutionProjectWorkRevisionPacketV01({
    request: { action: "revise_pre_execution_project_work", ...scope, expected_active_project_id: scope.project_id,
      expected_active_selection_revision: selection.selection_revision, expected_current_packet_id: tip.prior_packet.packet_id,
      expected_current_packet_fingerprint: tip.prior_packet.integrity.fingerprint, expected_current_lineage_kind: packetLineageKindV01(tip.prior_packet)!,
      ...packet.task, selected_source_context: selected, expected_source_comparison: compareSelectedWorkSources(tip.prior_packet, selected).fingerprint },
    operator_id: COMPANION_WORK_OPERATOR_ID_V01, session_id: tip.operator_action_ref.external_id,
    revision_number: tip.revision_number, definition: packet.task, prior_packet: tip.prior_packet,
    origin_first_work_definition_ref: history.origin_first_work_definition_ref, generated_at: packet.generated_at, outlook_version: RETRY_INSPECTION_OUTLOOK_V01,
  });
  const historicalPath = path.join(directory, `${scope.project_id.replaceAll(":", "-")}-historical.db`);
  writeFileSync(historicalPath, db.serialize()); const historicalDb = new Database(historicalPath);
  try {
    const trigger = (historicalDb.prepare("SELECT sql FROM sqlite_master WHERE name='trg_vnext_core_records_immutable_update'").get() as { sql: string }).sql;
    historicalDb.exec("DROP TRIGGER trg_vnext_core_records_immutable_update");
    historicalDb.prepare("UPDATE vnext_core_records SET record_id=?,fingerprint=?,payload_json=? WHERE record_id=?")
      .run(historicalBuilt.packet.packet_id, historicalBuilt.packet.integrity.fingerprint, canonical(historicalBuilt.packet), packet.packet_id);
    historicalDb.exec(trigger);
    const earlier = await readCodexRepositoryContinuityV01(historicalDb, { repository_root: root });
    const bytes = historicalDb.serialize();
    const readOld = await readCodexRepositoryMethodOutlookV01(historicalDb, { repository_root: root, expected_snapshot_binding: earlier.continuity!.snapshot.binding! });
    assert.equal(readOld.status, "available"); assert.equal(readOld.outlook!.version, RETRY_INSPECTION_OUTLOOK_V01);
    assert.deepEqual(readOld.outlook, readRetryInspectionOutlookV01(historicalBuilt.packet)); assert(bytes.equals(historicalDb.serialize()));
    parseRepositoryMethodOutlookResponseV01(readOld);
  } finally { historicalDb.close(); }
  // Negative copies use Core insertion, preserving the valid consumer history.
  // Invalid historical sources must not be described as an absent optional family.
  for (const fault of ["missing-outlook", "unknown-version", "foreign-support", "missing-support"] as const) {
    const copyPath = path.join(directory, `${scope.project_id.replaceAll(":", "-")}-${fault}.db`);
    writeFileSync(copyPath, db.serialize()); const copy = new Database(copyPath);
    try {
      const changed = structuredClone(packet);
      if (fault === "missing-outlook") changed.current_projection!.items = changed.current_projection!.items.filter(i => i.summary !== canonical(projection.outlook));
      else if (fault === "unknown-version") changed.compatibility.source_contracts = changed.compatibility.source_contracts.map(v => v === "augnes.retry-inspection-outlook.v0.2" ? "augnes.retry-inspection-outlook.v9" : v);
      else {
        const reportRef = projection.outlook.sources.find((s: any) => s.role === "supporting_observation").source_ref;
        changed.selected_context = changed.selected_context.map(e => e.source_ref !== reportRef ? e : fault === "missing-support" ? { ...e, source_ref: null } :
          buildSelectedWorkSourceEntry({ ...scope, project_id: "project:foreign" }, { source: "note-ref:foreign", text: e.bounded_summary!, observed_at: e.external_ref!.observed_at, provenance: "imported_unverified", label: "Next check" }));
      }
      const candidate = buildTaskContextPacketV01(changed);
      insertVNextCoreRecordV01(copy, { record_kind: "task_context_packet", record_id: candidate.packet_id, ...scope, fingerprint: candidate.integrity.fingerprint,
        idempotency_key: null, payload: candidate, created_at: candidate.generated_at });
      const bytes = copy.serialize();
      const bad = await readCodexRepositoryMethodOutlookV01(copy, input);
      assert.equal(bad.status, "unavailable", fault); assert.equal(bad.outlook, null); assert.deepEqual(bad.sources, []);
      assert(bytes.equals(copy.serialize()));
    } finally { copy.close(); }
  }
  // Ordinary direction owner; fixture-only human authorship, never a live user declaration.
  const config = { enabled: true as const, ...scope, operator_id: "operator:outlook-fixture", database_path: databasePath };
  const issued = issueVNextLocalOperatorBootstrapV01(db, { config });
  const admitted = consumeVNextLocalOperatorBootstrapV01(db, { config, bootstrap_token: issued.bootstrap_token });
  const credential = readVNextLocalOperatorCredentialFromRequestV01(new Request(origin, { headers: { cookie: `${VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01}=${admitted.cookie_value}` } }));
  mutateHumanDirection(db, { config, credential, request: { action: "decide", expected_ref: null,
    content: { purpose: "Fixture changed direction: investigate correctness before cost", criteria: [], constraints: [] }, reason: "Boundary fixture", status: "active", proposal_ref: null } });
  assert.equal((await call("augnes_read_repository_method_outlook", { repositoryRoot: root, expectedSnapshotBinding: value.snapshot_binding })).status, "refresh_required");
  const changed = await read(root); assert.equal(changed.packet.packet_fingerprint, value.packet.packet_fingerprint);
  assert.equal(changed.outlook.judgment_id, value.outlook.judgment_id); assert(changed.applicability.reasons.includes("project_direction_changed"));
}

void main().finally(async () => {
  await closeTrackedServer(server); db.close(); guard.restore();
  for (const key of Object.keys(process.env)) if (!(key in originalEnvironment)) delete process.env[key];
  Object.assign(process.env, originalEnvironment); rmSync(directory, { recursive: true, force: true });
});
