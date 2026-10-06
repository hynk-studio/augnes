import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import Database from "better-sqlite3";
import { applyCanonicalDatabaseMigrations } from "./canonical-database-migrations.mjs";
import { getOrCreateDefaultWorkspaceIdentityV01, getOrCreateCanonicalProjectForLocalRootV01, normalizeLocalProjectRootRefV01 } from "../lib/vnext/persistence/project-identity-registry";
import { readActiveProjectSelectionV01, selectActiveProjectV01 } from "../lib/vnext/persistence/project-lifecycle-registry";
import { defineInitialProjectWorkV01, readProjectWorkInitializationV01 } from "../lib/vnext/runtime/project-work-initialization";
import { issueVNextLocalOperatorBootstrapV01, consumeVNextLocalOperatorBootstrapV01 } from "../lib/vnext/runtime/local-operator-session";
import { buildSelectedWorkSourceEntry, normalizeNativeSelectedWorkSources, readSelectedWorkSources } from "../lib/intake/selected-work-source-comparison";
import { canonicalizeProtocolValueV01 } from "../lib/vnext/protocol-primitives";
import { inspectPreExecutionProjectWorkRevisionChainV01 } from "../lib/vnext/runtime/pre-execution-project-work-revision";
import { POST as revisionPOST } from "../app/api/augnes/repository-work-revision/route";
import { POST as resumePOST } from "../app/api/augnes/read/codex-repository-continuity/route";
import { POST as sourcesPOST } from "../app/api/augnes/read/codex-repository-work-sources/route";
import { handleMessageV01 } from "../plugins/augnes-operator/mcp/companion-proxy.mjs";

/** Real proxy discovery/dispatch, HTTP, authenticated route, writer and parser.
 * Only discovery health and manifest are fixtures; no installed runtime is used. */
export async function assertCompanionWorkRevisionEnvelopeV01(temporaryRoot: string) {
  const root = path.join(temporaryRoot, "envelope-project");
  const runtimeRoot = path.join(temporaryRoot, "envelope-runtime");
  mkdirSync(root); mkdirSync(runtimeRoot);
  writeFileSync(path.join(root, "README.md"), "# Disposable envelope project\n");
  const databasePath = path.join(temporaryRoot, "envelope.db");
  const db = new Database(databasePath);
  const environment = { ...process.env };
  const observations: Array<{ action: string; bytes: number; status: number; response_bytes: number }> = [];
  const identity = { instance_id: "envelope-instance", generation_id: "envelope-generation", repository_fingerprint: "e".repeat(64) };
  const token = "disposable-envelope-channel-credential";
  const headers = { "content-type": "application/json", "x-augnes-local-work-revision": "codex-repository-work-revision-v0.1",
    "x-augnes-companion-proxy": token, "x-augnes-runtime-instance": identity.instance_id,
    "x-augnes-runtime-generation": identity.generation_id, "x-augnes-runtime-repository": identity.repository_fingerprint };
  const server = createServer(async (incoming, outgoing) => {
    try {
      const url = new URL(incoming.url!, "http://127.0.0.1");
      if (["/api/healthz", "/healthz"].includes(url.pathname)) {
        outgoing.setHeader("content-type", "application/json");
        outgoing.end(JSON.stringify({ ok: true, service: "augnes-ui", status: "ready", recovery_mode: false,
          name: "augnes-console", mode: "http", live_core_status: "ready", runtime_instance_id: identity.instance_id,
          runtime_generation_id: identity.generation_id, runtime_repository_fingerprint: identity.repository_fingerprint }));
        return;
      }
      const chunks: Buffer[] = [];
      for await (const chunk of incoming) chunks.push(Buffer.from(chunk));
      const bytes = Buffer.concat(chunks);
      const request = new Request(`http://127.0.0.1:${(server.address() as { port: number }).port}${incoming.url}`, {
        method: "POST", headers: incoming.headers as Record<string, string>, body: bytes,
      });
      const route = url.pathname === "/api/augnes/repository-work-revision" ? revisionPOST
        : url.pathname.endsWith("codex-repository-work-sources") ? sourcesPOST : resumePOST;
      const response = await route(request);
      const body = await response.text();
      if (route === revisionPOST) observations.push({ action: JSON.parse(bytes.toString()).action,
        bytes: bytes.byteLength, status: response.status, response_bytes: Buffer.byteLength(body) });
      outgoing.writeHead(response.status, Object.fromEntries(response.headers)); outgoing.end(body);
    } catch { outgoing.writeHead(500); outgoing.end(); }
  });
  try {
    db.pragma("foreign_keys = ON"); applyCanonicalDatabaseMigrations(db);
    const workspace = getOrCreateDefaultWorkspaceIdentityV01(db);
    const project = getOrCreateCanonicalProjectForLocalRootV01(db, { workspace_id: workspace.workspace_id,
      local_root: normalizeLocalProjectRootRefV01(root, { base_path: temporaryRoot }), display_name: "Envelope" }).project;
    const scope = { workspace_id: workspace.workspace_id, project_id: project.project_id };
    selectActiveProjectV01(db, { ...scope, expected_project_id: null, expected_revision: null, now: new Date().toISOString() });
    const config = { enabled: true as const, ...scope, operator_id: "operator:envelope", database_path: databasePath };
    const credential = consumeVNextLocalOperatorBootstrapV01(db, { config,
      bootstrap_token: issueVNextLocalOperatorBootstrapV01(db, { config }).bootstrap_token }).credential;
    const initial = defineInitialProjectWorkV01(db, { config, credential, request: { action: "define_initial_project_work",
      ...scope, expected_active_project_id: scope.project_id, expected_active_selection_revision: readActiveProjectSelectionV01(db, scope.workspace_id)!.selection_revision,
      expected_initialization_state: "not_defined", goal: "Preserve the complete Companion selection",
      success_criteria: ["One explicit save; exact sources after reopen"], non_goals: ["No execution"] } }).packet;
    await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
    const port = (server.address() as { port: number }).port;
    const manifest = { schema_version: 2, contract: "augnes-local-runtime-supervisor-v1", generation_version: 1,
      ...identity, supervisor_pid: process.pid, lifecycle_state: "ready", database_state: "ready",
      effective_url: `http://127.0.0.1:${port}`, ui_port: port, bridge_port: port,
      children: ["ui", "bridge"].map(role => ({ role, pid: process.pid, port, state: "ready" })) };
    const manifestPath = path.join(runtimeRoot, "runtime.json");
    writeFileSync(manifestPath, JSON.stringify(manifest), { mode: 0o600 });
    writeFileSync(path.join(runtimeRoot, "companion-access.json"), JSON.stringify({ ...manifest,
      access_version: "augnes-companion-proxy-access.v0.1", proxy_token: token }), { mode: 0o600 });
    Object.assign(process.env, { AUGNES_DB_PATH: databasePath, AUGNES_COMPANION_TEST_MODE: "1",
      AUGNES_COMPANION_RUNTIME_MANIFEST: manifestPath, AUGNES_RUNTIME_CHILD_ROLE: "ui",
      AUGNES_RUNTIME_INSTANCE_ID: identity.instance_id, AUGNES_RUNTIME_GENERATION_ID: identity.generation_id,
      AUGNES_RUNTIME_REPOSITORY_FINGERPRINT: identity.repository_fingerprint, AUGNES_COMPANION_PROXY_TOKEN: token });
    delete process.env.AUGNES_RECOVERY_MODE;
    const call = async (name: string, args: Record<string, unknown>) => {
      const response = await handleMessageV01({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } });
      assert(response && "result" in response && response.result && "structuredContent" in response.result);
      return response.result.structuredContent;
    };
    const resume = () => call("augnes_resume_repository", { repositoryRoot: root });
    const snapshot = (await resume()).continuity.snapshot.binding;
    const notes = Array.from({ length: 8 }, (_, i) => ({ source: `note-${i}`, text: `${i}:` + (i === 7 ? "가".repeat(400) + "a".repeat(1_598) : "a".repeat(1_998)),
      provenance: i % 2 ? "imported_unverified" : "user_declaration", label: "Open question",
      observed_at: i === 7 ? null : "2026-09-29T00:00:00.000Z" }));
    const selected = normalizeNativeSelectedWorkSources(scope, notes.map(note => buildSelectedWorkSourceEntry(scope, note)));
    const selectedBytes = Buffer.byteLength(canonicalizeProtocolValueV01(selected));
    const args = { repositoryRoot: root, expectedSnapshotBinding: snapshot, changes: { sources: { add: notes } } };
    const before = db.serialize();
    const preview = await call("augnes_preview_repository_work_revision", args);
    assert.deepEqual(db.serialize(), before);
    console.log(JSON.stringify({ envelope_preview: observations.at(-1), canonical_selected_bytes: selectedBytes,
      response_status: preview.status, reason: preview.reason, unchanged: true }));
    assert(observations.at(-1)!.bytes > 16 * 1024);
    assert.equal(preview.status, "previewed");
    const saveArgs = { ...args, previewBinding: preview.preview_binding };
    const expectRefusal = async (name: string, input: Record<string, unknown>, reason: string, status: number) => {
      const previous = db.serialize(), requests = observations.length;
      const result = await call(name, input);
      assert.equal(result.status, "refused"); assert.equal(result.reason, reason); assert.equal(result.http_status, status);
      assert.equal(observations.length, requests + 1, "one dispatch, no automatic retry");
      assert.deepEqual(db.serialize(), previous);
    };
    for (const name of ["augnes_preview_repository_work_revision", "augnes_save_repository_work_revision"]) {
      await expectRefusal(name, { ...(name.includes("save") ? saveArgs : args), changes: { goal: "a".repeat(64_000) } }, "request_too_large", 413);
    }
    const tooMuchContent = notes.map(note => ({ ...note, text: "가".repeat(2_000) }));
    assert.throws(() => normalizeNativeSelectedWorkSources(scope, tooMuchContent.map(note => buildSelectedWorkSourceEntry(scope, note))), /selected_source_context_budget_exceeded/);
    await expectRefusal("augnes_preview_repository_work_revision", { ...args, changes: { sources: { add: tooMuchContent } } }, "selected_source_context_budget_exceeded", 422);
    assert(observations.at(-1)!.bytes < 64_000, "content refusal must pass the transport boundary");
    await expectRefusal("augnes_preview_repository_work_revision", { ...args, changes: { sources: { add: Array.from({ length: 9 }, (_, i) => ({ ...notes[0], source: `entry-${i}`, text: "one" })) } } }, "task_context_mandatory_selection_budget_exceeded", 422);
    await expectRefusal("augnes_preview_repository_work_revision", { ...args, changes: { sources: { add: [{ ...notes[0], text: "a".repeat(2_001) }] } } }, "selected_source_context_invalid", 422);
    await expectRefusal("augnes_preview_repository_work_revision", { ...args, expectedSnapshotBinding: `sha256:${"0".repeat(64)}` }, "refresh_required", 409);
    await expectRefusal("augnes_preview_repository_work_revision", { ...args, repositoryRoot: runtimeRoot }, "repository_unresolved", 409);
    await expectRefusal("augnes_save_repository_work_revision", { ...saveArgs, changes: { goal: "Changed since preview" } }, "preview_changed", 409);
    const wirePreview = JSON.stringify({ action: "preview", repository_root: root, expected_snapshot_binding: snapshot, changes: args.changes });
    const post = (body: string | ReadableStream<Uint8Array>, overrides = {}) => revisionPOST(new Request(
      `http://127.0.0.1:${port}/api/augnes/repository-work-revision?scope=repository:local`,
      { method: "POST", headers: { ...headers, ...overrides }, body, duplex: "half" } as RequestInit));
    for (const [body, overrides, status, code] of [
      ["{", {}, 400, "invalid_json"], ["null", {}, 400, "invalid_revision_input"],
      [wirePreview, { "x-augnes-companion-proxy": "wrong" }, 403, "companion_channel_refused"],
      [wirePreview, { "x-augnes-runtime-generation": "wrong" }, 409, "companion_identity_changed"],
    ] as const) {
      const response = await post(body, overrides); assert.equal(response.status, status);
      assert.equal((await response.json()).error.code, code);
    }
    // Exactly 64,000 bytes is accepted, including split UTF-8 code units. An
    // absent or false Content-Length cannot bypass incremental byte accounting.
    const atLimit = Buffer.from(wirePreview + " ".repeat(64_000 - Buffer.byteLength(wirePreview)));
    const split = atLimit.indexOf(Buffer.from("가")) + 1;
    const chunks = [atLimit.subarray(0, split), atLimit.subarray(split)];
    const exactStream = new ReadableStream<Uint8Array>({ pull(controller) {
      if (chunks.length) controller.enqueue(chunks.shift()!); else controller.close();
    } }, { highWaterMark: 0 });
    const exactResponse = await post(exactStream);
    assert.equal(exactResponse.status, 200);
    const exactProjection = await exactResponse.json();
    assert.deepEqual(exactProjection.sources.after, preview.sources.after);
    assert.equal(exactProjection.preview_binding, preview.preview_binding);
    assert.equal(exactStream.locked, false);
    for (const length of [undefined, "1", "64001"]) {
      let reads = 0, cancelled = false;
      const stream = new ReadableStream<Uint8Array>({ pull(controller) {
        reads++; controller.enqueue(reads === 1 ? atLimit : new Uint8Array([32]));
        assert(reads <= 2, "must stop reading after overflow");
      }, cancel() { cancelled = true; } }, { highWaterMark: 0 });
      const response = await post(stream, length === undefined ? {} : { "content-length": length });
      assert.equal(response.status, 413); assert.equal((await response.json()).error.code, "request_too_large");
      assert.equal(reads, length === "64001" ? 0 : 2); assert(cancelled); assert.equal(stream.locked, false);
    }
    assert.deepEqual(db.serialize(), before, "every preview and refusal preserves all state");
    const saved = await call("augnes_save_repository_work_revision", saveArgs);
    assert.equal(saved.status, "saved");
    const saveObservation = observations.at(-1)!;
    assert(saveObservation.bytes > observations[0]!.bytes);
    const chain = () => inspectPreExecutionProjectWorkRevisionChainV01(db, scope);
    assert.equal(chain().revision_count, 1);
    assert.deepEqual(chain().packets[0], initial);
    assert.deepEqual(readSelectedWorkSources(chain().tip_packet), selected);
    assert.equal((await call("augnes_save_repository_work_revision", saveArgs)).status, "exact_replay");
    assert.equal(chain().revision_count, 1);
    const fresh = await resume();
    const sourceRead = await call("augnes_read_repository_work_sources", { repositoryRoot: root,
      expectedSnapshotBinding: fresh.continuity.snapshot.binding });
    assert.equal(sourceRead.packet_fingerprint, saved.packet_fingerprint);
    assert.deepEqual(sourceRead.sources, preview.sources.after);
    const reopened = new Database(databasePath, { readonly: true, fileMustExist: true });
    try { assert.deepEqual(readProjectWorkInitializationV01(reopened, scope).selected_source_context, selected); }
    finally { reopened.close(); }
    // A real route-side failure after admission stays atomic and uncertain at
    // the proxy. Do not retry it; fresh source read confirms the prior selection.
    const later = { repositoryRoot: root, expectedSnapshotBinding: fresh.continuity.snapshot.binding, changes: { goal: "Failed extra revision" } };
    const laterPreview = await call("augnes_preview_repository_work_revision", later);
    db.exec("CREATE TRIGGER fail_envelope_write BEFORE INSERT ON vnext_core_records BEGIN SELECT RAISE(ABORT, 'disposable_envelope_rollback'); END");
    const beforeFailure = db.serialize(), requestCount = observations.length;
    try {
      const failed = await call("augnes_save_repository_work_revision", { ...later, previewBinding: laterPreview.preview_binding });
      assert.equal(failed.status, "outcome_unknown");
      assert.equal(observations.length, requestCount + 1);
      assert.deepEqual(db.serialize(), beforeFailure);
    } finally { db.exec("DROP TRIGGER fail_envelope_write"); }
    assert.deepEqual(readSelectedWorkSources(chain().tip_packet), selected);
    assert.equal(chain().revision_count, 1);
    const afterFailureResume = await resume();
    assert.equal(afterFailureResume.continuity.snapshot.binding, fresh.continuity.snapshot.binding);
    const afterFailureSources = await call("augnes_read_repository_work_sources", { repositoryRoot: root,
      expectedSnapshotBinding: afterFailureResume.continuity.snapshot.binding });
    assert.deepEqual(afterFailureSources.sources, sourceRead.sources);
    console.log(JSON.stringify({ envelope_save: saveObservation, exact_replay_revision_count: 1,
      exact_selected_readback: true, known_and_unknown_times: true, canonical_selected_bytes: selectedBytes,
      transport_and_content_refusals: "pass", bounded_stream_cancellation: "pass", failed_write_atomic: true,
      compact_notes_bytes: Buffer.byteLength(JSON.stringify(notes)), snapshot_binding_bytes: Buffer.byteLength(snapshot),
      preview_binding_bytes: Buffer.byteLength(preview.preview_binding), observations }));
    return { databasePath, root, scope, operator_id: config.operator_id, selected, goal: initial.task.goal };
  } finally {
    try {
      server.closeAllConnections();
      if (server.listening) await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    } finally { db.close(); process.env = environment; }
  }
}
