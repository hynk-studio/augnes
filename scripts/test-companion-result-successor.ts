// Actual Operator proxy / HTTP / canonical-writer integration. Disposable only.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { applyCanonicalDatabaseMigrations } from "./canonical-database-migrations.mjs";
import { trackServerConnections, closeTrackedServer } from "./test-harness-process-lifecycle.mjs";
import { runCanonicalChild, canonicalChildAcceptanceFailure } from "./canonical-child-runner.mjs";
import { installZeroNetworkGuard } from "./test-harness-zero-network-guard.mjs";
import { POST as resumeRoute } from "../app/api/augnes/read/codex-repository-continuity/route";
import { POST as sourcesRoute } from "../app/api/augnes/read/codex-repository-work-sources/route";
import { POST as revisionRoute } from "../app/api/augnes/repository-work-revision/route";
import { POST as resultRoute } from "../app/api/augnes/repository-result-work/route";
import { handleMessageV01, parseRepositoryResultWorkResponseV01 } from "../plugins/augnes-operator/mcp/companion-proxy.mjs";
import { getOrCreateDefaultWorkspaceIdentityV01, getOrCreateCanonicalProjectForLocalRootV01, normalizeLocalProjectRootRefV01 } from "../lib/vnext/persistence/project-identity-registry";
import { readActiveProjectSelectionV01, selectActiveProjectV01 } from "../lib/vnext/persistence/project-lifecycle-registry";
import { issueVNextLocalReviewAccessV01 } from "./issue-vnext-local-review-access";
import { consumeVNextLocalOperatorBootstrapV01 } from "../lib/vnext/runtime/local-operator-session";
import { runDirectNativeHostRoundTripV01 } from "../lib/vnext/runtime/direct-native-host-round-trip";
import { createDeterministicCodexAdapterV01 } from "../lib/vnext/native-host/deterministic-codex-adapter";
import { validateRecoveryCanonicalDatabaseV01 } from "./recovery-canonical-record-validator";
import { readProjectWorkInitializationV01 } from "../lib/vnext/runtime/project-work-initialization";

const directory = realpathSync(mkdtempSync(path.join(tmpdir(), "augnes-result-successor-")));
const databasePath = path.join(directory, "fixture.db"), db = new Database(databasePath);
const originalEnvironment = { ...process.env }, guard = installZeroNetworkGuard({ allowLoopback: true });
const instance = "result-successor-fixture", generation = "generation-1", repository = "b".repeat(64), token = "fixture-only-result-channel".repeat(3);
const marker = "codex-repository-result-work-v0.1";
const tools = { read: "augnes_read_repository_result_work", compare: "augnes_compare_repository_result_work_sources",
  preview: "augnes_preview_repository_result_work", save: "augnes_prepare_repository_result_work" };
const obligation = "Organiser approval remains pending. Do not publish, send invitations or book the room.";
const omitted = "UNSELECTED_PRIVATE_NOTE: the earlier poster colour discussion is outside this capacity correction.";
let origin = "", requestId = 0, dropNextSave = false, droppedSaves = 0;
const operations: unknown[] = [], serverErrors: string[] = [];
const routes: Record<string, (request: Request) => Promise<Response>> = {
  "/api/augnes/read/codex-repository-continuity": resumeRoute,
  "/api/augnes/read/codex-repository-work-sources": sourcesRoute,
  "/api/augnes/repository-work-revision": revisionRoute,
  "/api/augnes/repository-result-work": resultRoute,
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
    const body = Buffer.concat(chunks).toString(), parsed = body ? JSON.parse(body) : {};
    const before = db.serialize();
    const response = await handler(new Request(url, { method: req.method, headers: req.headers as Record<string, string>, ...(body ? { body } : {}) }));
    const text = await response.text(), result = JSON.parse(text);
    if (url.pathname.includes("/read/") || (url.pathname.endsWith("repository-result-work") && parsed.action !== "save"))
      assert(before.equals(db.serialize()), "Read, comparison and full preview must not write");
    operations.push({ route: url.pathname, action: parsed.action ?? "read", http_status: response.status,
      status: result.status ?? null, refusal: result.error?.code ?? null, packet_fingerprint: result.packet_fingerprint ?? null });
    if (dropNextSave && url.pathname.endsWith("repository-result-work") && parsed.action === "save" && result.status === "saved") {
      dropNextSave = false; droppedSaves++; res.destroy(); return;
    }
    response.headers.forEach((value, key) => res.setHeader(key, value)); res.writeHead(response.status).end(text);
  } catch (error) { serverErrors.push(String(error)); res.writeHead(500).end('{"fixture_error":true}'); }
}));

async function raw(name: string, args: object): Promise<any> {
  try { return await handleMessageV01({ jsonrpc: "2.0", id: ++requestId, method: "tools/call", params: { name, arguments: args } }); }
  catch (error) { return { thrown: String(error) }; }
}
async function call(name: string, args: object): Promise<any> {
  const result = await raw(name, args);
  assert(!result.error && !result.thrown && !result.result?.isError, `tool refused: ${name}: ${JSON.stringify(result)}`);
  return result.result.structuredContent;
}
async function refusal(name: string, args: object, reason: RegExp) {
  const before = db.serialize(), result = await raw(name, args);
  assert(result.error || result.thrown || result.result?.isError, `Expected refusal for ${name}`);
  assert.match(result.result?.structuredContent?.reason ?? "", reason,
    `Expected a concrete contract refusal, not decoder or transport failure: ${JSON.stringify(result)}`);
  assert(before.equals(db.serialize()), "Refused operation must not append packet/admission");
  return result;
}
const resume = (root: string) => call("augnes_resume_repository", { repositoryRoot: root });
const coreRows = () => db.prepare("SELECT record_kind,record_id,payload_json FROM vnext_core_records ORDER BY record_kind,record_id").all() as Array<{record_kind:string;record_id:string;payload_json:string}>;
const runRows = () => db.prepare("SELECT * FROM autonomy_runs ORDER BY run_id").all();

async function fixture(name: string) {
  const root = path.join(directory, name); mkdirSync(root);
  const workspace = getOrCreateDefaultWorkspaceIdentityV01(db);
  const registered = getOrCreateCanonicalProjectForLocalRootV01(db, { workspace_id: workspace.workspace_id,
    local_root: normalizeLocalProjectRootRefV01(root, { base_path: directory }), display_name: name });
  const scope = { workspace_id: workspace.workspace_id, project_id: registered.project.project_id };
  const active = readActiveProjectSelectionV01(db, scope.workspace_id);
  selectActiveProjectV01(db, { ...scope, expected_project_id: active?.project_id ?? null,
    expected_revision: active?.selection_revision ?? null, now: new Date().toISOString() });
  const input = JSON.stringify({ title: "Local workshop", capacity: 12, date: "2026-11-03" }) + "\n";
  writeFileSync(path.join(root, "notice.json"), input, { flag: "wx" });
  const first = await resume(root), initialArgs = { repositoryRoot: root, expectedSnapshotBinding: first.continuity.snapshot.binding,
    changes: { goal: "Inspect the existing 12-seat workshop notice", success_criteria: ["Report the actual notice capacity"], non_goals: ["Do not publish or book the room"] } };
  const initial = await call("augnes_preview_repository_initial_work", initialArgs);
  await call("augnes_define_repository_initial_work", { ...initialArgs, previewBinding: initial.preview_binding });
  const current = await resume(root), revisionArgs = { repositoryRoot: root, expectedSnapshotBinding: current.continuity.snapshot.binding,
    changes: { sources: { add: [
      { source: path.join(root, "private-organiser-instruction"), text: obligation, provenance: "user_declaration", observed_at: null, label: "Deferred item / revisit condition" },
      { source: path.join(root, "private-poster-history"), text: omitted, provenance: "imported_unverified", observed_at: "2026-10-01T00:00:00.000Z", label: "Open question" },
    ] } } };
  const revision = await call("augnes_preview_repository_work_revision", revisionArgs);
  await call("augnes_save_repository_work_revision", { ...revisionArgs, previewBinding: revision.preview_binding });
  const access = issueVNextLocalReviewAccessV01(db, { database_path: databasePath });
  const credential = consumeVNextLocalOperatorBootstrapV01(db, { config: access.config, bootstrap_token: access.bootstrap.bootstrap_token }).credential;
  const base = createDeterministicCodexAdapterV01(); let observations = 0;
  const completed = await runDirectNativeHostRoundTripV01(db, { config: access.config, mode: "interactive", operator_mutation: { credential } }, {
    adapter: { ...base, invoke(request, control) {
      const handle = base.invoke(request, control);
      const result = handle.result.then(value => {
        const observed = JSON.parse(readFileSync(path.join(root, "notice.json"), "utf8")); observations++;
        assert.equal(observed.capacity, 12);
        return { ...value, summary: `Read notice.json: ${observed.title}, capacity ${observed.capacity}. Organiser approval is unknown.`,
          checks: [...value.checks, { check_id: "organiser_approval", required: false, status: "failed" as const,
            summary: "The local notice does not establish organiser approval." }] };
      });
      return { ...handle, result, settled: result.then(() => undefined, () => undefined) };
    } },
  });
  assert.equal(observations, 1); assert.equal(completed.receipt.execution.status, "completed");
  assert.notEqual(completed.receipt.verification.status, "passed", "Completed and settled is not successful verification");
  // A different selected project must never retarget the explicit repository.
  const otherRoot = path.join(directory, `${name}-other-project`); mkdirSync(otherRoot);
  const other = getOrCreateCanonicalProjectForLocalRootV01(db, { workspace_id: scope.workspace_id,
    local_root: normalizeLocalProjectRootRefV01(otherRoot, { base_path: directory }), display_name: "Unrelated selected project" }).project;
  const selection = readActiveProjectSelectionV01(db, scope.workspace_id)!;
  selectActiveProjectV01(db, { workspace_id: scope.workspace_id, project_id: other.project_id,
    expected_project_id: selection.project_id, expected_revision: selection.selection_revision, now: new Date().toISOString() });
  const resumed = await resume(root);
  assert.equal(resumed.continuity.snapshot.status, "exact", JSON.stringify(resumed));
  const args = { repositoryRoot: root, expectedSnapshotBinding: resumed.continuity.snapshot.binding };
  const read = await call(tools.read, args);
  assert.equal(read.status, "read"); assert(read.preparation_binding);
  assert.equal(read.result.execution_status, "completed");
  assert.equal(read.result.verification_status, "failed");
  assert.equal(read.sources.before.length, 2); assert(read.sources.result);
  assert(read.sources.before.every((s: any) => s.source_locator === null));
  assert.equal(read.sources.result.trust_class, "imported_unverified");
  assert.equal(readActiveProjectSelectionV01(db, scope.workspace_id)!.project_id, other.project_id);
  const reviewProfile = process.env.AUGNES_LOCAL_REVIEW_PROFILE;
  const beforeAbsentProfile = db.serialize();
  delete process.env.AUGNES_LOCAL_REVIEW_PROFILE;
  try {
    const unavailable = await resume(root);
    assert.equal(unavailable.continuity.snapshot.status, "unavailable");
    assert.equal(unavailable.continuity.review_continuity.state, "review_source_unavailable_or_inconsistent");
    assert(beforeAbsentProfile.equals(db.serialize()), "Absent runtime review profile must stay read-only and fail closed");
  } finally {
    if (reviewProfile === undefined) delete process.env.AUGNES_LOCAL_REVIEW_PROFILE;
    else process.env.AUGNES_LOCAL_REVIEW_PROFILE = reviewProfile;
  }
  const keep = read.sources.before.find((s: any) => s.excerpt_text === obligation);
  const discard = read.sources.before.find((s: any) => s.excerpt_text === omitted);
  const spec = { profile: "result-successor-notice.v0.1", title: "Local workshop", capacity: 24, date: "2026-11-03",
    input_file: "notice.json", input_sha256: createHash("sha256").update(input).digest("hex"), output_file: "follow-up.md" };
  const sources = { keep: [keep.source_binding], include_result: true, include_reviewed_outcome: false,
    add: [
      { source: "Synthetic explicit changed requirement", text: JSON.stringify(spec), observed_at: null, provenance: "user_declaration", label: "Changed assumption / user correction" },
      { source: "Synthetic bounded correction", text: "Earlier capacity 12 is historical; use the explicitly requested capacity 24. This correction does not establish organiser approval.", observed_at: null, provenance: "user_declaration", label: "Changed assumption / user correction" },
    ], omitted_sources: [{ source_binding: discard.source_binding, reason: "Poster colour history does not affect the capacity correction; preserve it in predecessor history." }] };
  const selected = { ...args, preparationBinding: read.preparation_binding, sources };
  const comparison = await call(tools.compare, selected);
  assert(comparison.expected_source_comparison);
  const definition = { goal: "Prepare the changed 24-seat workshop notice as a local draft", success_criteria: ["Read the actual source and verify its digest", "Write and check the 24-seat draft", "Retain organiser approval as pending"], non_goals: ["Do not publish or book the room"] };
  const draft = { ...selected, definition, expectedSourceComparison: comparison.expected_source_comparison };
  const preview = await call(tools.preview, draft);
  assert.equal(preview.status, "previewed"); assert(preview.packet_preview, "Full packet projection must be present");
  return { root, scope, completed, args, read, sources, selected, comparison, definition, draft, preview,
    save: { ...draft, previewBinding: preview.preview_binding }, input, otherRoot, otherProjectId: other.project_id };
}

async function boundaryChecks(f: Awaited<ReturnType<typeof fixture>>) {
  const endpoint = origin + "/api/augnes/repository-result-work?scope=repository:local";
  const headers = { "content-type": "application/json", "x-augnes-local-result-work": marker, "x-augnes-companion-proxy": token,
    "x-augnes-runtime-instance": instance, "x-augnes-runtime-generation": generation, "x-augnes-runtime-repository": repository };
  const input = { action: "read", repository_root: f.root, expected_snapshot_binding: f.args.expectedSnapshotBinding };
  const controls: unknown[] = [];
  for (const [extra, status] of [[{ "x-augnes-companion-proxy": "wrong" }, 403], [{ "x-augnes-runtime-instance": "wrong" }, 409],
    [{ "x-augnes-runtime-generation": "wrong" }, 409], [{ "x-augnes-runtime-repository": "wrong" }, 409], [{ origin }, 403]] as const) {
    const before = db.serialize(), response = await fetch(endpoint, { method: "POST", headers: { ...headers, ...extra }, body: JSON.stringify(input) });
    assert.equal(response.status, status); controls.push({ boundary: Object.keys(extra)[0], status, body: await response.json() });
    assert(before.equals(db.serialize()));
  }
  const assertedAuth = await fetch(endpoint, { method: "POST", headers, body: JSON.stringify({ ...input, authenticated: true }) });
  assert.equal(assertedAuth.status, 400); await assertedAuth.body?.cancel();
  await refusal(tools.read, { ...f.args, expectedSnapshotBinding: `sha256:${"0".repeat(64)}` }, /^refresh_required$/);
  await refusal(tools.read, { ...f.args, repositoryRoot: directory }, /^repository_unresolved$/);
  await refusal(tools.read, { ...f.args, repositoryRoot: f.otherRoot }, /^refresh_required$/);
  await refusal(tools.save, { ...f.save, previewBinding: `sha256:${"0".repeat(64)}` }, /^preview_changed$/);
  await refusal(tools.save, { ...f.save, definition: { ...f.definition, goal: "Changed after preview" } }, /^preview_changed$/);
  await refusal(tools.preview, { ...f.draft, sources: { ...f.sources, add: [] } }, /^source_comparison_changed$/);
  await refusal(tools.preview, { ...f.draft, sources: { ...f.sources, omitted_sources: [] } }, /^source_omissions_invalid$/);
  const moved = `${f.root}-temporarily-moved`; renameSync(f.root, moved);
  try { await refusal(tools.save, f.save, /^repository_unresolved$/); } finally { renameSync(moved, f.root); }
  renameSync(f.root, moved); mkdirSync(f.root);
  try { await refusal(tools.save, f.save, /^(refresh_required|result_root_changed)$/); }
  finally { rmSync(f.root, { recursive: true }); renameSync(moved, f.root); }
  const run = db.prepare("SELECT status,metadata_json FROM autonomy_runs WHERE run_id=?").get(f.completed.receipt.run_id) as {status:string;metadata_json:string};
  const update = db.prepare("UPDATE autonomy_runs SET status=?,metadata_json=? WHERE run_id=?");
  for (const [status, metadata] of [["running", run.metadata_json], ["failed", run.metadata_json], ["cancelled", run.metadata_json],
    ["completed", JSON.stringify({ ...JSON.parse(run.metadata_json), reconciliation_required: true })], ["unknown-status", run.metadata_json]]) {
    update.run(status, metadata, f.completed.receipt.run_id);
    try { await refusal(tools.save, f.save, /^(refresh_required|successor_task_preparation_unavailable)$/); }
    finally { update.run(run.status, run.metadata_json, f.completed.receipt.run_id); }
  }
  // Whole notes fit the native selection cap; duplicated full-packet
  // material must still fail the canonical packet budget, without truncation.
  const overflowing = { ...f.sources, keep: [], include_result: false, add: Array.from({ length: 8 }, (_, index) => ({
    source: `Synthetic budget note ${index}`, text: `${index}:` + "n".repeat(998), observed_at: null, provenance: "user_declaration", label: "Open question" })),
    omitted_sources: f.read.sources.before.map((s: any) => ({ source_binding: s.source_binding, reason: "Explicit isolated budget control only" })) };
  const selected = { ...f.selected, sources: overflowing };
  const compared = await call(tools.compare, selected);
  const oversizedDefinition = { goal: "g".repeat(900), success_criteria: Array.from({ length: 10 }, (_, index) => `${index}:` + "c".repeat(488)),
    non_goals: ["Keep immutable originals and rollback.", "No execution authority."] };
  const overflow = await refusal(tools.preview, { ...selected, definition: oversizedDefinition, expectedSourceComparison: compared.expected_source_comparison },
    /^successor_task_packet_max_(characters|estimated_tokens)_exceeded$/);
  const { companion: _companion, ...projection } = f.read;
  assert.deepEqual(parseRepositoryResultWorkResponseV01(projection), projection);
  for (const extra of [{ raw_packet: {} }, { credential: "forged" }, { authentication: true }])
    assert.throws(() => parseRepositoryResultWorkResponseV01({ ...projection, ...extra }), /contract_invalid/);
  const leaked = structuredClone(projection); leaked.sources.before[0].source_locator = f.root;
  assert.throws(() => parseRepositoryResultWorkResponseV01(leaked), /contract_invalid/);
  return { transport: controls, stale_snapshot: true, wrong_root: true, physical_root_changed: true,
    altered_preview_and_selection: true, omitted_reason_required: true, unsettled_and_unresolved: true, full_packet_overflow: overflow };
}

async function main() {
  db.pragma("foreign_keys = ON"); db.pragma("journal_mode = WAL"); applyCanonicalDatabaseMigrations(db);
  Object.assign(process.env, { AUGNES_DB_PATH: databasePath, AUGNES_RUNTIME_CHILD_ROLE: "ui", AUGNES_RUNTIME_INSTANCE_ID: instance,
    AUGNES_RUNTIME_GENERATION_ID: generation, AUGNES_RUNTIME_REPOSITORY_FINGERPRINT: repository, AUGNES_COMPANION_PROXY_TOKEN: token,
    AUGNES_LOCAL_REVIEW_PROFILE: "companion_first_work_v1", AUGNES_RUNTIME_CONTRACT: "augnes-local-runtime-supervisor-v1", AUGNES_DISTRIBUTION_MODE: "source" });
  for (const key of ["AUGNES_VNEXT_OPERATOR_PILOT_ENABLED", "AUGNES_VNEXT_OPERATOR_WORKSPACE_ID", "AUGNES_VNEXT_OPERATOR_PROJECT_ID", "AUGNES_VNEXT_OPERATOR_ID"])
    delete process.env[key];
  delete process.env.AUGNES_RECOVERY_MODE;
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const port = (server.address() as {port:number}).port; origin = `http://127.0.0.1:${port}`;
  const manifest = { schema_version: 2, contract: "augnes-local-runtime-supervisor-v1", generation_version: 1, generation_id: generation,
    instance_id: instance, repository_fingerprint: repository, supervisor_pid: process.pid, lifecycle_state: "ready", database_state: "ready",
    effective_url: origin, ui_port: port, bridge_port: port, children: ["ui", "bridge"].map(role => ({ role, pid: process.pid, port, state: "ready" })) };
  const manifestPath = path.join(directory, "runtime.json");
  writeFileSync(manifestPath, JSON.stringify(manifest), { mode: 0o600 });
  writeFileSync(path.join(directory, "companion-access.json"), JSON.stringify({ schema_version: 2, contract: manifest.contract, generation_version: 1,
    generation_id: generation, instance_id: instance, repository_fingerprint: repository, access_version: "augnes-companion-proxy-access.v0.1", proxy_token: token }), { mode: 0o600 });
  Object.assign(process.env, { AUGNES_COMPANION_RUNTIME_MANIFEST: manifestPath, AUGNES_COMPANION_TEST_MODE: "1" });
  const f = await fixture("normal-flow"), adverse = await boundaryChecks(f);
  const frozen = coreRows(), runsBefore = runRows();
  const saved = await call(tools.save, f.save); assert.equal(saved.status, "saved");
  assert.deepEqual(saved.effects, { successor_work_created: true, authorization_record_created: true });
  assert.equal(saved.packet_preview.capability_grant, null);
  for (const [key, value] of Object.entries(saved.authority))
    assert.equal(value, ["writes_database", "changes_operator_session"].includes(key), `Preparation authority: ${key}`);
  assert.deepEqual(runRows(), runsBefore, "Preparation grants/starts no execution and preserves original result ledger");
  const after = coreRows(); assert.equal(after.length, frozen.length + 1);
  for (const prior of frozen) assert.deepEqual(after.find(row => row.record_id === prior.record_id && row.record_kind === prior.record_kind), prior);
  assert.equal(readProjectWorkInitializationV01(db, f.scope).current_work!.goal, f.definition.goal);
  assert.equal(validateRecoveryCanonicalDatabaseV01(db).status, "valid");
  assert.equal(readActiveProjectSelectionV01(db, f.scope.workspace_id)!.project_id, f.otherProjectId, "Save does not select the target project");
  await refusal(tools.save, f.save, /^refresh_required$/); await refusal(tools.read, f.args, /^refresh_required$/);
  let stdout = "", stderr = "";
  const consumer = await runCanonicalChild({ suite: "companion-result-successor", label: "fresh-stdio-consumer", command: process.execPath,
    args: [path.join(process.cwd(), "scripts/companion-result-successor-consumer.mjs"), f.root], cwd: directory,
    env: { PATH: process.env.PATH, AUGNES_COMPANION_RUNTIME_MANIFEST: manifestPath, AUGNES_COMPANION_TEST_MODE: "1" },
    timeoutMs: 25_000, heartbeatMs: 0, resourceOwner: undefined, log: () => {},
    stdout: { write(chunk: string | Uint8Array) { stdout += chunk; return true; } } as typeof process.stdout,
    stderr: { write(chunk: string | Uint8Array) { stderr += chunk; return true; } } as typeof process.stderr });
  assert.equal(canonicalChildAcceptanceFailure(consumer, { suite: "companion-result-successor", timeoutMs: 25_000, requireNaturalExit: true }), null, stderr);
  const consumed = JSON.parse(stdout); assert.notEqual(consumed.pid, process.pid);
  assert.equal(consumed.packet_fingerprint, saved.packet_fingerprint);
  const expected = "# Local workshop\n\nDate: 2026-11-03\nCapacity: 24\n\nOrganiser approval: PENDING\nPublication and room booking: NOT AUTHORISED\n";
  assert.equal(readFileSync(path.join(f.root, "follow-up.md"), "utf8"), expected);
  assert.equal(consumed.artifact.content, expected);
  assert.equal(readFileSync(path.join(f.root, "notice.json"), "utf8"), f.input);

  const uncertain = await fixture("uncertain-concurrent-save");
  const otherDraft = { ...uncertain.draft, definition: { ...uncertain.definition, goal: "Prepare the alternative 24-seat workshop draft" } };
  const otherPreview = await call(tools.preview, otherDraft);
  const beforeRace = coreRows(), beforeRuns = runRows(); dropNextSave = true;
  const raced = await Promise.all([raw(tools.save, uncertain.save), raw(tools.save, { ...otherDraft, previewBinding: otherPreview.preview_binding })]);
  assert.equal(droppedSaves, 1); assert.equal(coreRows().length, beforeRace.length + 1);
  assert.deepEqual(runRows(), beforeRuns);
  assert(raced.every(result => result.error || result.thrown || result.result?.isError), "Dropped delivery and concurrent contention must not claim confirmed saves");
  assert(raced.some(result => result.result?.structuredContent?.status === "outcome_unknown"));
  // Explicit normal Resume/readback reconciles the unknown response. No save retry.
  const reconciled = await resume(uncertain.root);
  const readback = await call("augnes_read_repository_work_sources", { repositoryRoot: uncertain.root,
    expectedSnapshotBinding: reconciled.continuity.snapshot.binding, includeWorkDefinition: true });
  assert.equal(readback.status, "available");
  assert([uncertain.definition.goal, otherDraft.definition.goal].includes(readback.work_definition.goal));
  assert.equal(readback.sources.length, 4);
  await refusal(tools.save, uncertain.save, /^refresh_required$/);
  assert.equal(coreRows().length, beforeRace.length + 1, "Repeated/uncertain delivery never duplicates successor work");
  assert.equal(validateRecoveryCanonicalDatabaseV01(db).status, "valid");
  assert.deepEqual(serverErrors, []); assert.equal(guard.attempts.length, 0);
  console.log(JSON.stringify({ status: "pass", native_flow: { read: f.read, compare: f.comparison, preview: f.preview, saved },
    predecessor: { run_id: f.completed.receipt.run_id, receipt_id: f.completed.receipt.receipt_id,
      execution: f.completed.receipt.execution.status, verification: f.completed.receipt.verification.status },
    fresh_consumer: consumed, adverse, concurrent_lost_response: { responses: raced, reconciled_definition: readback.work_definition,
      appended_packets: 1, dropped_responses: droppedSaves, replay_supported: false },
    operations, recovery: "valid", external_requests: guard.attempts.length, model_calls: 0,
    child_cleanup: { exit_observed: consumer.exit_observed, streams_closed: consumer.streams_closed,
      cleanup_completed: consumer.cleanup_completed, remaining_owned_processes: consumer.remaining_owned_processes } }));
}

void main().finally(async () => {
  await closeTrackedServer(server); db.close(); guard.restore();
  for (const key of Object.keys(process.env)) if (!(key in originalEnvironment)) delete process.env[key];
  Object.assign(process.env, originalEnvironment); rmSync(directory, { recursive: true, force: true });
  assert.equal(existsSync(directory), false);
}).catch(error => { console.error(error); process.exitCode = 1; });
