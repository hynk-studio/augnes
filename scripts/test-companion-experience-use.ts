// Exposed, scripted A -> B development consumer. Evaluator never enters worker inputs.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, copyFileSync, existsSync, realpathSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { applyCanonicalDatabaseMigrations } from "./canonical-database-migrations.mjs";
import { trackServerConnections, closeTrackedServer } from "./test-harness-process-lifecycle.mjs";
import { runCanonicalChild, canonicalChildAcceptanceFailure } from "./canonical-child-runner.mjs";
import { installZeroNetworkGuard } from "./test-harness-zero-network-guard.mjs";
import { ordinaryExperienceUse } from "./companion-experience-use.mjs";
import { normalizeV1 } from "./fixtures/experience-use/normalize-v1.mjs";
import { normalizeV2 } from "./fixtures/experience-use/normalize-v2.mjs";
import { POST as resumeRoute } from "../app/api/augnes/read/codex-repository-continuity/route";
import { POST as sourcesRoute } from "../app/api/augnes/read/codex-repository-work-sources/route";
import { POST as retainedRoute } from "../app/api/augnes/read/codex-repository-retained-sources/route";
import { POST as writerRoute } from "../app/api/augnes/repository-work-revision/route";
import { handleMessageV01 } from "../plugins/augnes-operator/mcp/companion-proxy.mjs";
import { getOrCreateDefaultWorkspaceIdentityV01, getOrCreateCanonicalProjectForLocalRootV01, normalizeLocalProjectRootRefV01 } from "../lib/vnext/persistence/project-identity-registry";
import { readActiveProjectSelectionV01, selectActiveProjectV01 } from "../lib/vnext/persistence/project-lifecycle-registry";
import { inspectPreExecutionProjectWorkRevisionChainV01 } from "../lib/vnext/runtime/pre-execution-project-work-revision";
import { canonicalizeProtocolValueV01 as canonical } from "../lib/vnext/protocol-primitives";

const repositoryRoot = process.cwd(), fixture = path.join(repositoryRoot, "scripts/fixtures/experience-use");
const directory = realpathSync(mkdtempSync(path.join(tmpdir(), "augnes-experience-use-")));
assert(!directory.startsWith(realpathSync(repositoryRoot) + path.sep));
const outputDirectory = process.argv[2];
assert(process.argv.length <= 3 && (!outputDirectory || (path.isAbsolute(outputDirectory) && !existsSync(outputDirectory))), "optional output directory must be absolute and new");
const dbPath = path.join(directory, "fixture.db"), db = new Database(dbPath);
const originalEnvironment = { ...process.env }, guard = installZeroNetworkGuard({ allowLoopback: true });
const hash = (value: string | Buffer) => `sha256:${createHash("sha256").update(value).digest("hex")}`;
const json = (file: string) => JSON.parse(readFileSync(file, "utf8"));
const save = (file: string, value: unknown) => writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
const instance = "experience-use-fixture", generation = "generation-1", repository = "e".repeat(64), token = "test-only-experience-channel".repeat(3);
let origin = "", requestId = 0, reads = 0, previews = 0, writes = 0;
const trace: any[] = [], executions: any[] = [], httpErrors: string[] = [];
const started = Date.now();
const routes: Record<string, (request: Request) => Promise<Response>> = {
  "/api/augnes/read/codex-repository-continuity": resumeRoute,
  "/api/augnes/read/codex-repository-work-sources": sourcesRoute,
  "/api/augnes/read/codex-repository-retained-sources": retainedRoute,
  "/api/augnes/repository-work-revision": writerRoute,
};
const server = trackServerConnections(createServer(async (req, res) => {
  try {
    const url = new URL(req.url!, origin);
    if (["/healthz", "/api/healthz"].includes(url.pathname)) {
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ ok: true, name: "augnes-console", service: "augnes-ui", status: "ready", mode: "http", live_core_status: "ready", recovery_mode: false,
        runtime_instance_id: instance, runtime_generation_id: generation, runtime_repository_fingerprint: repository })); return;
    }
    const handler = routes[url.pathname]; if (!handler) { res.writeHead(404).end(); return; }
    const chunks = []; for await (const chunk of req) chunks.push(Buffer.from(chunk));
    const body = Buffer.concat(chunks).toString(), before = db.serialize();
    const response = await handler(new Request(url, { method: req.method, headers: req.headers as Record<string, string>, ...(body ? { body } : {}) }));
    const isRead = url.pathname.includes("/read/"), isPreview = JSON.parse(body || "{}").action === "preview";
    if (isRead || isPreview || response.status >= 400) assert(before.equals(db.serialize()), "read/preview/refusal mutated data");
    if (isRead) reads++; else if (isPreview) previews++; else if (response.ok) writes++;
    response.headers.forEach((value, key) => res.setHeader(key, value)); res.writeHead(response.status).end(await response.text());
  } catch (error) { httpErrors.push(String(error)); res.writeHead(500).end('{"fixture_error":true}'); }
}));

async function call(name: string, args: object): Promise<any> {
  const response: any = await handleMessageV01({ jsonrpc: "2.0", id: ++requestId, method: "tools/call", params: { name, arguments: args } });
  trace.push({ order: trace.length, name, args, result: response.result?.structuredContent ?? response.error });
  assert(!response.error && !response.result?.isError, `tool refused ${name}: ${JSON.stringify(response.result ?? response.error)}`);
  return response.result.structuredContent;
}
const note = (source: string, text: string, provenance = "derived_interpretation") => ({ source, text, provenance, observed_at: null, label: "Next check" });
const find = (current: any, marker: string) => {
  const row = current.sources.sources.find((s: any) => s.excerpt_text.includes(marker)); assert(row, `missing source ${marker}`); return row;
};
const definition = (goal: string) => ({ goal, success_criteria: ["Produce the stated exact synthetic JSON deliverable; retain attributed results and method limits"],
  non_goals: ["No production data, provider/model calls, managed execution, learned rates or semantic acceptance"] });

function deliver(target: string, source: string, names: string[], inputName: string) {
  mkdirSync(target);
  for (const name of names) copyFileSync(path.join(source, name), path.join(target, name));
  copyFileSync(path.join(fixture, inputName), path.join(target, inputName));
  const files = names.map(name => { const bytes = readFileSync(path.join(target, name)); return { name, bytes: bytes.length, sha256: hash(bytes) }; });
  const manifest = { files, identity: hash(JSON.stringify(files)) }; save(path.join(target, "assets.json"), manifest);
  trace.push({ order: trace.length, action: "explicit file delivery", from: source, to: target, files, input: inputName });
  return manifest;
}
async function execute(root: string, mode: string, version: string, input: string, output: string, expectedExit = 0) {
  let stdout = "", stderr = "";
  const args = [path.join(root, "process-events.mjs"), mode, version, input, output];
  const result = await runCanonicalChild({ suite: "companion-experience-use", label: `${path.basename(root)}-${mode}-${version}`,
    command: process.execPath, args, cwd: root, env: { PATH: path.dirname(process.execPath) }, timeoutMs: 5_000, heartbeatMs: 0, log: () => {}, resourceOwner: undefined,
    stdout: { write(chunk: string | Uint8Array) { stdout += chunk; return true; } } as typeof process.stdout,
    stderr: { write(chunk: string | Uint8Array) { stderr += chunk; return true; } } as typeof process.stderr });
  assert.equal(canonicalChildAcceptanceFailure({ ...result, exit_code: result.exit_code === expectedExit ? 0 : result.exit_code }, { suite: "companion-experience-use", timeoutMs: 5_000, requireNaturalExit: true }), null, stderr);
  assert.equal(result.exit_code, expectedExit, stderr);
  const observation = { order: trace.length, command: process.execPath, args, cwd: root, exit_status: result.exit_code, stdout, stderr,
    duration_ms: result.duration_ms, cleanup_completed: result.cleanup_completed, remaining_owned_processes: result.remaining_owned_processes };
  executions.push(observation); trace.push({ action: "external execution", ...observation });
  if (expectedExit === 0) {
    const identity = JSON.parse(stdout);
    assert.equal(identity.executable, path.join(root, "process-events.mjs")); assert.equal(identity.cwd, root);
    assert(identity.imported.every((p: string) => path.dirname(p) === root), "hidden import fallback");
    assert.equal(identity.output_sha256, hash(readFileSync(path.join(root, output))));
  }
  return observation;
}
// Independent evaluator uses rational input sums and stated answers. Never copied to worker directories.
function evaluate(key: string, inputPath: string, outputPath: string) {
  const input = json(inputPath), output = json(outputPath), oracle = json(path.join(fixture, "evaluator.json"))[key];
  for (const [name, expected] of Object.entries(oracle)) assert.deepEqual(output[name], expected, `${key}.${name}`);
  const seen = new Set<string>(); let numerator = BigInt(0);
  for (const e of input.events) {
    if (seen.has(e.event_id)) continue; seen.add(e.event_id);
    if (key === "a" && e.status !== "ok") continue;
    if (input.schema_version === "build-events.v2") numerator += BigInt(e.elapsed_ms);
    else { const digits = e.duration_s.replace(".", ""), places = e.duration_s.includes(".") ? e.duration_s.split(".")[1].length : 0;
      numerator += BigInt(digits) * BigInt(1000) / (BigInt(10) ** BigInt(places)); }
  }
  assert.equal(BigInt(output.total_ms), numerator);
  assert.equal(output.input_sha256, hash(readFileSync(inputPath)));
  return { output_sha256: hash(readFileSync(outputPath)), expected_fields: "pass", independent_rational_ms: Number(numerator) };
}

async function main() {
  // Small callable qualification, independent of the end-to-end report workers.
  // These imports are evaluator-side only; each worker imports its delivered copy.
  const validV1 = json(path.join(fixture, "a.json")), validV2 = json(path.join(fixture, "c.json"));
  for (const duration_s of ["1e3", "-1", "1.0001", 1, "NaN"]) {
    const bad = structuredClone(validV1); bad.events[0].duration_s = duration_s;
    assert.throws(() => normalizeV1(bad), /exact decimal seconds/);
  }
  for (const elapsed_ms of [true, -1, 1.5, "1250"]) {
    const bad = structuredClone(validV2); bad.events[0].elapsed_ms = elapsed_ms;
    assert.throws(() => normalizeV2(bad), /integer milliseconds/);
  }
  const incomplete = structuredClone(validV1); delete incomplete.events[0].status;
  assert.throws(() => normalizeV1(incomplete), /unknown or missing fields/);
  assert.throws(() => normalizeV1({ ...validV1, schema_version: "build-events.unknown" }), /unsupported version/);
  assert.throws(() => normalizeV2({ ...validV2, units: "seconds" }), /unknown or missing fields/);
  db.pragma("foreign_keys = ON"); db.pragma("journal_mode = WAL"); applyCanonicalDatabaseMigrations(db);
  const workspace = getOrCreateDefaultWorkspaceIdentityV01(db), root = path.join(directory, "project"); mkdirSync(root);
  const registration = getOrCreateCanonicalProjectForLocalRootV01(db, { workspace_id: workspace.workspace_id,
    local_root: normalizeLocalProjectRootRefV01(root, { base_path: directory }), display_name: "Synthetic experience use" });
  const scope = { workspace_id: workspace.workspace_id, project_id: registration.project.project_id };
  const selected = readActiveProjectSelectionV01(db, workspace.workspace_id);
  selectActiveProjectV01(db, { ...scope, expected_project_id: selected?.project_id ?? null, expected_revision: selected?.selection_revision ?? null, now: new Date().toISOString() });
  const selection = canonical(readActiveProjectSelectionV01(db, workspace.workspace_id));
  Object.assign(process.env, { AUGNES_DB_PATH: dbPath, AUGNES_RUNTIME_CHILD_ROLE: "ui", AUGNES_RUNTIME_INSTANCE_ID: instance,
    AUGNES_RUNTIME_GENERATION_ID: generation, AUGNES_RUNTIME_REPOSITORY_FINGERPRINT: repository, AUGNES_COMPANION_PROXY_TOKEN: token });
  delete process.env.AUGNES_RECOVERY_MODE;
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const port = (server.address() as { port: number }).port; origin = `http://127.0.0.1:${port}`;
  const manifest = { schema_version: 2, contract: "augnes-local-runtime-supervisor-v1", generation_version: 1, generation_id: generation,
    instance_id: instance, repository_fingerprint: repository, supervisor_pid: process.pid, lifecycle_state: "ready", database_state: "ready",
    effective_url: origin, ui_port: port, bridge_port: port, children: ["ui", "bridge"].map(role => ({ role, pid: process.pid, port, state: "ready" })) };
  const manifestPath = path.join(directory, "runtime.json"); save(manifestPath, manifest);
  writeFileSync(path.join(directory, "companion-access.json"), JSON.stringify({ schema_version: 2, contract: manifest.contract, generation_version: 1,
    generation_id: generation, instance_id: instance, repository_fingerprint: repository, access_version: "augnes-companion-proxy-access.v0.1", proxy_token: token }), { mode: 0o600 });
  Object.assign(process.env, { AUGNES_COMPANION_RUNTIME_MANIFEST: manifestPath, AUGNES_COMPANION_TEST_MODE: "1" });
  const api = ordinaryExperienceUse(call, root);
  let current = await api.read();
  current = (await api.write("initial", current, definition("A: release-dashboard successful-build latency; produce success-latency.json"))).current;
  const a = path.join(directory, "a-worker"), b = path.join(directory, "b-worker"), c = path.join(directory, "c-control");
  const v1 = deliver(a, fixture, ["normalize-v1.mjs", "process-events.mjs"], "a.json");
  const aExecution = await execute(a, "success", "v1", "a.json", "success-latency.json");
  const aResult = evaluate("a", path.join(a, "a.json"), path.join(a, "success-latency.json"));
  const aNotes = [
    note("fixture:A:observation", `A observed report: ${JSON.stringify({ ...aResult, runtime: process.version, exit_status: aExecution.exit_status })}. Counts concern successful attempts only; actual externally executed output, not a managed receipt.`, "imported_unverified"),
    note("fixture:A:callable", `Reusable v1 normalization asset: ${JSON.stringify(v1)}. Exact event identity, decimal seconds to integer milliseconds, duplicate-delivery removal and conflict refusal precede any goal-specific filtering. Files delivered separately; no network or dependencies beyond Node builtins.`, "imported_unverified"),
    note("fixture:A:qualification", "A qualification: normalize-v1.mjs accepts only build-events.v1. Recheck the consumer's declared version, field contract, units, asset bytes and population. Preserve genuine retries. A used a success-only dashboard filter; that filter is not part of normalization."),
    note("fixture:A:display", "A-only display preference: alphabetically display job labels on the release dashboard. This is irrelevant to other output contracts and conveys no authority."),
  ];
  current = (await api.write("revise", current, { sources: { add: aNotes } })).current;
  const aPacket = inspectPreExecutionProjectWorkRevisionChainV01(db, scope).tip_packet;
  const frozenA = canonical(aPacket), originalA = structuredClone(current.sources.sources);
  const assetBinding = find(current, "Reusable v1 normalization asset:").source_binding;
  // Demonstrate real historical lookup/reselection BEFORE the distinct-task boundary.
  current = (await api.write("revise", current, { sources: { deselect: [assetBinding] } })).current;
  const recalled = await api.lookup(current, "Reusable v1 normalization asset");
  const hit = recalled.lookup.results.find((r: any) => r.note.source_binding === assetBinding);
  assert.equal(hit.selection, "historical_not_selected");
  current = (await api.write("revise", current, { sources: { retained_source_refs: [hit.source] } })).current;
  assert.deepEqual(find(current, "Reusable v1 normalization asset:"), originalA.find((s: any) => s.source_binding === assetBinding));
  const display = find(current, "A-only display preference:");
  const keep = current.sources.sources.filter((s: any) => s.source_binding !== display.source_binding).map((s: any) => s.source_binding);
  const applicability = note("fixture:B:applicability", `B applicability from A bindings ${keep.join(", ")}: retain the v1 normalization and conflict rule. Recheck v1 fields, decimal-second units and exact delivered files. DO NOT use A's success-only filter: B includes every unique attempt, failures and retries. Omit A's alphabetical display preference. Totals are worker occupancy, not makespan, learned benefit or execution authority.`);
  // Same raw material/assets/goals remain available to a strong adaptive memo reference.
  const adaptiveMemo = { status: "reference arrangement, not a live-model comparison", current_goal: "B: all unique attempt capacity audit", raw_sources: current.sources,
    source_cutoff: recalled.lookup.cutoff_recorded_at, asset: v1, retained_asset_directory: "a/", inputs: { b: hash(readFileSync(path.join(fixture, "b.json"))) },
    tools: ["ordinary readers/writers", "same delivered Node callable", "local file editing and execution"],
    authority: "same task-owned pure-data calculation", resources: "same relevant sources, assets and executor; may inspect, revise code and synthesize guidance", model_budget: "no provider/model experiment; comparative cost unknown" };
  const prepared = await api.write("different", current, { ...definition("B: CI capacity audit of ALL worker occupancy and failed-attempt time; produce capacity-audit.json"),
    sources: { keep, omitted_sources: [{ source_binding: display.source_binding, reason: "A dashboard display preference is irrelevant to B's all-attempt capacity contract" }], add: [applicability] } });
  current = prepared.current;
  assert.equal(current.work.previous_preparation.marked_complete, false);
  assert.equal(current.work.previous_preparation.goal, aPacket.task.goal);
  assert.equal(current.sources.sources.length, 4);
  for (const binding of keep) assert.deepEqual(current.sources.sources.find((s: any) => s.source_binding === binding), originalA.find((s: any) => s.source_binding === binding));
  assert.equal(find(current, "B applicability from A bindings").trust_class, "derived_interpretation");
  assert(!current.sources.sources.some((s: any) => s.source_binding === display.source_binding));
  const cutoffCheck = await api.lookup(current, "A-only display preference"); assert.equal(cutoffCheck.lookup.matching_entries, 0);
  const stale = await call("augnes_read_repository_work_sources", { repositoryRoot: root, expectedSnapshotBinding: recalled.snapshot_binding });
  assert.equal(stale.status, "refresh_required");
  const beforeB = structuredClone(current);
  // Only after B fresh readers and interpretation: deliver/import A bytes.
  const delivered = deliver(b, a, ["normalize-v1.mjs", "process-events.mjs"], "b.json"); assert.deepEqual(delivered, v1);
  assert(find(current, "Reusable v1 normalization asset:").excerpt_text.includes(delivered.identity));
  assert.deepEqual(readdirSync(b).sort(), ["assets.json", "b.json", "normalize-v1.mjs", "process-events.mjs"]);
  await execute(b, "capacity", "v1", "b.json", "capacity-audit.json");
  const bResult = evaluate("b", path.join(b, "b.json"), path.join(b, "capacity-audit.json"));
  current = (await api.write("revise", current, { sources: { add: [note("fixture:B:result", `B actual externally executed result ${JSON.stringify(bResult)}; every unique attempt retained, including failures and retries.`, "imported_unverified")] } })).current;
  const bPacket = inspectPreExecutionProjectWorkRevisionChainV01(db, scope).tip_packet, frozenB = canonical(bPacket);
  // Negative controls are deliberately wrong operations, not the adaptive baseline.
  await execute(b, "success", "v1", "b.json", "blind-success-replay.json");
  assert.equal(json(path.join(b, "blind-success-replay.json")).total_ms, 4250);
  assert.notEqual(json(path.join(b, "blind-success-replay.json")).total_ms, json(path.join(b, "capacity-audit.json")).total_ms);
  const conflict = json(path.join(b, "b.json")); conflict.events.push({ event_id: "b-02", job_id: "compile", attempt: 2, status: "ok", duration_s: "9.000" });
  save(path.join(b, "conflict.json"), conflict);
  const previous = readFileSync(path.join(b, "capacity-audit.json"));
  const conflictResult = await execute(b, "capacity", "v1", "conflict.json", "capacity-audit.json", 1);
  assert.match(conflictResult.stderr, /conflicting event_id/); assert(previous.equals(readFileSync(path.join(b, "capacity-audit.json"))));
  const missing = path.join(directory, "missing-control"); deliver(missing, a, ["normalize-v1.mjs", "process-events.mjs"], "b.json");
  rmSync(path.join(missing, "normalize-v1.mjs"));
  const missingResult = await execute(missing, "capacity", "v1", "b.json", "capacity-audit.json", 1);
  assert.match(missingResult.stderr, /ENOENT/); assert(!existsSync(path.join(missing, "capacity-audit.json")));
  const tampered = path.join(directory, "tampered-control"); deliver(tampered, a, ["normalize-v1.mjs", "process-events.mjs"], "b.json");
  const altered = readFileSync(path.join(tampered, "normalize-v1.mjs")); altered[0] = 32;
  writeFileSync(path.join(tampered, "normalize-v1.mjs"), altered);
  const tamperedResult = await execute(tampered, "capacity", "v1", "b.json", "capacity-audit.json", 1);
  assert.match(tamperedResult.stderr, /asset hash mismatch/); assert(!existsSync(path.join(tampered, "capacity-audit.json")));
  // C changes conditions, not B's goal. Refuse v1 before qualification/revision.
  deliver(c, a, ["normalize-v1.mjs", "process-events.mjs"], "c.json");
  const refusal = await execute(c, "capacity", "v1", "c.json", "capacity-audit-v2.json", 1);
  assert.match(refusal.stderr, /unsupported version/); assert(!existsSync(path.join(c, "capacity-audit-v2.json")));
  current = (await api.write("revise", current, { sources: { add: [note("fixture:C:refusal", "Actual v1 callable refused build-events.v2 before output: unsupported version; do not guess units. New contract uses outcome and integer elapsed_ms; B's all-attempt goal is unchanged.", "imported_unverified")] } })).current;
  copyFileSync(path.join(fixture, "normalize-v2.mjs"), path.join(c, "normalize-v2.mjs"));
  const v2files = ["normalize-v1.mjs", "normalize-v2.mjs", "process-events.mjs"].map(name => { const bytes = readFileSync(path.join(c, name)); return { name, bytes: bytes.length, sha256: hash(bytes) }; });
  const v2 = { files: v2files, identity: hash(JSON.stringify(v2files)) }; save(path.join(c, "assets.json"), v2);
  current = (await api.write("revise", current, { sources: { add: [note("fixture:C:revision", `C method revision supported by declared v2 contract and prior refusal: ${JSON.stringify(v2)}. Use separate normalize-v2.mjs, mapping outcome and preserving integer elapsed_ms exactly through v1 normalization. Retain original v1 bytes and B population; qualify by actual execution and independent checks before claiming success.`)] } })).current;
  assert.equal(find(current, "C method revision supported").trust_class, "derived_interpretation");
  await execute(c, "capacity", "v2", "c.json", "capacity-audit-v2.json");
  const cResult = evaluate("c", path.join(c, "c.json"), path.join(c, "capacity-audit-v2.json"));
  assert.equal(hash(readFileSync(path.join(a, "normalize-v1.mjs"))), v1.files[0].sha256);
  await execute(a, "success", "v1", "a.json", "success-latency-regression.json");
  assert(readFileSync(path.join(a, "success-latency.json")).equals(readFileSync(path.join(a, "success-latency-regression.json"))));
  current = (await api.write("revise", current, { sources: { add: [note("fixture:C:result", `C actual externally executed result ${JSON.stringify(cResult)}. Original A output reproduced byte-for-byte with unchanged v1 asset. Retain v1 for v1 and separate v2 adapter for v2; do not claim general transfer advantage or learned success rates.`, "imported_unverified")] } })).current;
  assert.equal(current.sources.sources.length, 8);
  const chain = inspectPreExecutionProjectWorkRevisionChainV01(db, scope);
  assert.equal(canonical(chain.packets.find(p => p.packet_id === aPacket.packet_id)), frozenA);
  assert.equal(canonical(chain.packets.find(p => p.packet_id === bPacket.packet_id)), frozenB);
  assert(chain.packets.every(p => p.capability_grant === null));
  assert.equal(canonical(readActiveProjectSelectionV01(db, workspace.workspace_id)), selection);
  assert.equal((db.prepare("SELECT count(*) n FROM autonomy_runs").get() as { n: number }).n, 0);
  const refused = await fetch(origin + "/api/augnes/repository-work-revision?scope=repository:local", { method: "POST",
    headers: { "content-type": "application/json", "x-augnes-local-work-revision": "codex-repository-work-revision-v0.1", "x-augnes-companion-proxy": "wrong" }, body: "{}" });
  assert.equal(refused.status, 403); await refused.body?.cancel();
  assert.deepEqual(httpErrors, []); assert.equal(guard.attempts.length, 0);
  const result = { status: "pass", evidence: "scripted exposed development mechanics and separate-task execution, not autonomous selection, learning or comparative usefulness",
    a: aResult, b: bResult, c: cResult, asset_v1: v1, asset_v2: v2, before_b: beforeB, final: current, adaptive_memo: adaptiveMemo,
    controls: { success_only_replay: "harmful: loses failed occupancy", conflict: "refused; completed output preserved", missing_asset: "refused; no fallback", tampered_asset: "refused", v2_with_v1: "refused", invalid_contract: "nondecimal/missing/unknown v1 and noninteger/Boolean/wrong-unit v2 refused", a_display_advice: "omitted before B", historical_lookup: "resolved before B; predecessor omitted note unavailable after boundary", original_packets: "reconstructable unchanged" },
    operations: { reads, previews, writes, tool_calls: requestId, external_executions: executions.length, provider_calls: 0, managed_runs: 0 },
    helper_effort: "Fixture/code reconstructed from issue tables, explicit copies/manifests and scripted source choices; optional archive not obtained. Developer saw all cases and evaluator answers.",
    trace, executions, elapsed_ms: Date.now() - started, comparative_model_usefulness: "NOT_RUN", active_developer_effort: "unknown" };
  if (outputDirectory) {
    mkdirSync(outputDirectory);
    // Retain only synthetic evidence and usable delivered files, never DB/access state.
    for (const [source, label] of [[a, "a"], [b, "b"], [c, "c"]]) {
      mkdirSync(path.join(outputDirectory, label));
      for (const file of readdirSync(source)) copyFileSync(path.join(source, file), path.join(outputDirectory, label, file));
    }
    save(path.join(outputDirectory, "report.json"), result);
    save(path.join(outputDirectory, "adaptive-memo-reference.json"), adaptiveMemo);
  }
  console.log(JSON.stringify({ status: result.status, a: aResult, b: bResult, c: cResult, operations: result.operations, output_directory: outputDirectory ?? null }));
}

void main().finally(async () => {
  await closeTrackedServer(server); db.close(); guard.restore();
  for (const key of Object.keys(process.env)) if (!(key in originalEnvironment)) delete process.env[key];
  Object.assign(process.env, originalEnvironment); rmSync(directory, { recursive: true, force: true });
});
