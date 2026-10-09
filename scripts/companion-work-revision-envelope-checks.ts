import assert from "node:assert/strict";
import { mkdirSync, renameSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import Database from "better-sqlite3";
import { applyCanonicalDatabaseMigrations } from "./canonical-database-migrations.mjs";
import { getOrCreateDefaultWorkspaceIdentityV01, getOrCreateCanonicalProjectForLocalRootV01, normalizeLocalProjectRootRefV01 } from "../lib/vnext/persistence/project-identity-registry";
import { readActiveProjectSelectionV01, selectActiveProjectV01 } from "../lib/vnext/persistence/project-lifecycle-registry";
import { readProjectWorkInitializationV01 } from "../lib/vnext/runtime/project-work-initialization";
import { COMPANION_WORK_OPERATOR_ID_V01 } from "../lib/vnext/runtime/local-operator-session";
import { buildSelectedWorkSourceEntry, normalizeNativeSelectedWorkSources, readSelectedWorkSources } from "../lib/intake/selected-work-source-comparison";
import { canonicalizeProtocolValueV01 } from "../lib/vnext/protocol-primitives";
import { inspectPreExecutionProjectWorkRevisionChainV01 } from "../lib/vnext/runtime/pre-execution-project-work-revision";
import { POST as revisionPOST } from "../app/api/augnes/repository-work-revision/route";
import { POST as resumePOST } from "../app/api/augnes/read/codex-repository-continuity/route";
import { POST as sourcesPOST } from "../app/api/augnes/read/codex-repository-work-sources/route";
import { handleMessageV01 } from "../plugins/augnes-operator/mcp/companion-proxy.mjs";
import { runFirstWorkExampleChild } from "./companion-first-work-consumer.mjs";
import { validateRecoveryCanonicalDatabaseV01 } from "./recovery-canonical-record-validator";

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
  let loseInitialResponse = false;
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
      if (loseInitialResponse && route === revisionPOST && JSON.parse(bytes.toString()).intent === "initial_work" && response.status === 200) {
        loseInitialResponse = false; outgoing.destroy(); return;
      }
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
    const empty = await resume();
    assert.equal(empty.continuity.current_work.status, "no_current_work");
    assert.equal(readProjectWorkInitializationV01(db, scope).state, "not_defined");
    const firstArgs = { repositoryRoot: root, expectedSnapshotBinding: empty.continuity.snapshot.binding,
      changes: { goal: "Preserve the complete Companion selection", success_criteria: ["One explicit save; exact sources after reopen"], non_goals: ["No execution"] } };
    const emptyBytes = db.serialize();
    const firstPreview = await call("augnes_preview_repository_initial_work", firstArgs);
    assert.equal(firstPreview.status, "previewed");
    assert.equal(firstPreview.packet_fingerprint, null);
    assert.deepEqual(db.serialize(), emptyBytes, "initial preview writes no packet or admission");
    const firstSave = { ...firstArgs, previewBinding: firstPreview.preview_binding };
    const firstWire = { action: "save", intent: "initial_work", repository_root: root,
      expected_snapshot_binding: firstArgs.expectedSnapshotBinding, changes: firstArgs.changes, preview_binding: firstPreview.preview_binding };
    for (const overrides of [{ "x-augnes-companion-proxy": "" }, { "x-augnes-companion-proxy": "wrong", cookie: "browser-cookie-is-not-channel-auth" }] as Array<Record<string, string>>) {
      const refused = await fetch(`http://127.0.0.1:${port}/api/augnes/repository-work-revision?scope=repository:local`, {
        method: "POST", headers: { ...headers, ...overrides }, body: JSON.stringify(firstWire), signal: AbortSignal.timeout(10_000),
      });
      assert.equal(refused.status, 403); assert.equal((await refused.json()).error.code, "companion_channel_refused");
    }
    assert.equal((await call("augnes_define_repository_initial_work", { ...firstSave, changes: { ...firstArgs.changes, goal: "Changed after preview" } })).reason, "preview_changed");
    assert.equal((await call("augnes_define_repository_initial_work", { ...firstSave, expectedSnapshotBinding: `sha256:${"0".repeat(64)}` })).reason, "refresh_required");
    assert.equal((await call("augnes_preview_repository_initial_work", { ...firstArgs, changes: { ...firstArgs.changes, sources: { add: [] } } })).reason, "invalid_revision_input");
    assert.deepEqual(db.serialize(), emptyBytes);
    db.exec("CREATE TRIGGER fail_initial_write BEFORE INSERT ON vnext_core_records BEGIN SELECT RAISE(ABORT, 'disposable_initial_rollback'); END");
    const beforeInitialFailure = db.serialize();
    assert.equal((await call("augnes_define_repository_initial_work", firstSave)).reason, "first_work_write_failed");
    assert.deepEqual(db.serialize(), beforeInitialFailure, "admission and initial packet roll back together");
    db.exec("DROP TRIGGER fail_initial_write");
    loseInitialResponse = true;
    const dispatches = observations.length;
    assert.equal((await call("augnes_define_repository_initial_work", firstSave)).status, "outcome_unknown");
    assert.equal(observations.length, dispatches + 1, "lost response never retries");
    const recovered = await resume();
    assert.equal(recovered.continuity.current_work.goal, firstArgs.changes.goal);
    assert.equal(recovered.continuity.current_work.lineage_kind, "initial_user_defined");
    const initial = inspectPreExecutionProjectWorkRevisionChainV01(db, scope).tip_packet;
    assert.equal((await call("augnes_define_repository_initial_work", firstSave)).reason, "refresh_required");
    const admission = db.prepare("SELECT operator_id, revoked_at, issued_at FROM vnext_local_operator_sessions WHERE project_id = ?").all(scope.project_id) as Array<{ operator_id: string; revoked_at: string; issued_at: string }>;
    assert.equal(admission.length, 1); assert.equal(admission[0].operator_id, COMPANION_WORK_OPERATOR_ID_V01);
    assert.equal(admission[0].revoked_at, admission[0].issued_at);
    assert.equal(validateRecoveryCanonicalDatabaseV01(db).status, "valid", "ordinary initial lineage accepts genuine Companion admission");
    console.log(JSON.stringify({ first_work_proxy_http: "saved_then_lost_response", initial_lineage_reconstructed: true,
      preview_readonly: true, independent_save_authentication: true, initial_write_atomic: true, duplicate_refused: true,
      explicit_resume_reconciled: true, first_packet_fingerprint: initial.integrity.fingerprint }));
    const snapshot = recovered.continuity.snapshot.binding;
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
    assert.equal((await call("augnes_define_repository_initial_work", firstSave)).reason, "refresh_required", "later revisions cannot reactivate genesis");
    assert.equal((await call("augnes_preview_repository_initial_work", { ...firstArgs,
      expectedSnapshotBinding: afterFailureResume.continuity.snapshot.binding })).reason, "first_work_state_changed");
    console.log(JSON.stringify({ envelope_save: saveObservation, exact_replay_revision_count: 1,
      exact_selected_readback: true, known_and_unknown_times: true, canonical_selected_bytes: selectedBytes,
      transport_and_content_refusals: "pass", bounded_stream_cancellation: "pass", failed_write_atomic: true,
      compact_notes_bytes: Buffer.byteLength(JSON.stringify(notes)), snapshot_binding_bytes: Buffer.byteLength(snapshot),
      preview_binding_bytes: Buffer.byteLength(preview.preview_binding), observations }));
    // A separate harness starts from a second registered/selected EMPTY project.
    // Each invocation owns a fresh MCP client/proxy process and derives all work
    // and source bindings by Resume, without copying a packet or context text.
    const consumerRoot = path.join(temporaryRoot, "consumer-project");
    mkdirSync(consumerRoot);
    const consumerProject = getOrCreateCanonicalProjectForLocalRootV01(db, { workspace_id: scope.workspace_id,
      local_root: normalizeLocalProjectRootRefV01(consumerRoot, { base_path: temporaryRoot }), display_name: "First-work consumer" }).project;
    const consumerScope = { workspace_id: scope.workspace_id, project_id: consumerProject.project_id };
    selectActiveProjectV01(db, { ...consumerScope, expected_project_id: scope.project_id,
      expected_revision: readActiveProjectSelectionV01(db, scope.workspace_id)!.selection_revision, now: new Date().toISOString() });
    assert.equal(readProjectWorkInitializationV01(db, consumerScope).state, "not_defined");
    const inputPath = path.join(temporaryRoot, "compatible-manifest.json");
    const incompatiblePath = path.join(temporaryRoot, "incompatible-manifest.json");
    const manifestInput = [{ name: "report.txt", role: "report", bytes: 3, digest: `sha256:${"a".repeat(64)}` }];
    writeFileSync(inputPath, JSON.stringify(manifestInput));
    writeFileSync(incompatiblePath, JSON.stringify([{ ...manifestInput[0], role: "future-report" }]));
    const compatible = await runFirstWorkExampleChild("start", [consumerRoot, inputPath]);
    assert.equal(compatible.exit_status, 0); assert.equal(compatible.bootstrap.status, "saved");
    assert.equal(compatible.report.exit_status, 0); assert.equal(compatible.report.code, "compatible");
    assert.equal(compatible.follow_up, null); assert.match(compatible.next_goal, /^Stop/);
    const incompatible = await runFirstWorkExampleChild("continue", [consumerRoot, incompatiblePath]);
    assert.equal(incompatible.exit_status, 0); assert.equal(incompatible.prior_source_count, 2);
    assert.equal(incompatible.report.exit_status, 1); assert.equal(incompatible.report.code, "invalid_file_name_or_role");
    assert.equal(incompatible.follow_up.exit_status, 0); assert.equal(incompatible.follow_up.code, "compatible");
    assert.notEqual(incompatible.next_goal, compatible.next_goal);
    const freshClient = await runFirstWorkExampleChild("read", [consumerRoot]);
    assert.equal(freshClient.exit_status, 0); assert.equal(freshClient.continuity.current_work.goal, incompatible.next_goal);
    assert.equal(freshClient.sources.packet_fingerprint, incompatible.packet_fingerprint);
    assert.equal(freshClient.sources.sources.length, 5);
    const notesRead = freshClient.sources.sources;
    assert.equal(notesRead.filter((note: { trust_class: string }) => note.trust_class === "imported_unverified").length, 3);
    assert.equal(notesRead.filter((note: { trust_class: string }) => note.trust_class === "derived_interpretation").length, 2);
    assert(notesRead.some((note: { excerpt_text: string }) => note.excerpt_text === compatible.interpretation));
    assert(notesRead.some((note: { excerpt_text: string }) => note.excerpt_text === incompatible.interpretation));
    assert.equal((db.prepare("SELECT COUNT(*) AS n FROM vnext_core_records WHERE record_kind <> 'task_context_packet'").get() as { n: number }).n, 0);
    assert.equal((db.prepare("SELECT COUNT(*) AS n FROM autonomy_runs").get() as { n: number }).n, 0);
    assert.equal(validateRecoveryCanonicalDatabaseV01(db).status, "valid");
    console.log(JSON.stringify({ first_work_consumer: "pass", fixture: "synthetic registered/selected projects; discovery health/manifest scripted",
      compatible, incompatible, fresh_client_source_count: notesRead.length, recovery_lineage: "valid", managed_runs_and_receipts: 0 }));
    const raceRoot = path.join(temporaryRoot, "concurrent-empty-project");
    mkdirSync(raceRoot);
    const raceProject = getOrCreateCanonicalProjectForLocalRootV01(db, { workspace_id: scope.workspace_id,
      local_root: normalizeLocalProjectRootRefV01(raceRoot, { base_path: temporaryRoot }), display_name: "Concurrent initial creation" }).project;
    const raceScope = { workspace_id: scope.workspace_id, project_id: raceProject.project_id };
    selectActiveProjectV01(db, { ...raceScope, expected_project_id: consumerScope.project_id,
      expected_revision: readActiveProjectSelectionV01(db, scope.workspace_id)!.selection_revision, now: new Date().toISOString() });
    let raceResume = await call("augnes_resume_repository", { repositoryRoot: raceRoot });
    let raceArgs = { ...firstArgs, repositoryRoot: raceRoot, expectedSnapshotBinding: raceResume.continuity.snapshot.binding };
    let racePreview = await call("augnes_preview_repository_initial_work", raceArgs);
    assert.equal(racePreview.status, "previewed");
    const beforeBindingRefusals = db.serialize();
    for (const [key, value, reason] of [
      ["AUGNES_RUNTIME_GENERATION_ID", "changed-generation", "companion_identity_changed"],
      ["AUGNES_COMPANION_PROXY_TOKEN", "rotated-fixture-token", "companion_channel_refused"],
      ["AUGNES_RUNTIME_CHILD_ROLE", "bridge", "companion_unavailable"],
      ["AUGNES_RECOVERY_MODE", "1", "companion_unavailable"],
    ]) {
      const previous = process.env[key]; process.env[key] = value;
      try { assert.equal((await call("augnes_define_repository_initial_work", { ...raceArgs, previewBinding: racePreview.preview_binding })).reason, reason); }
      finally { if (previous === undefined) delete process.env[key]; else process.env[key] = previous; }
      assert.deepEqual(db.serialize(), beforeBindingRefusals);
    }
    const movedRoot = `${raceRoot}-unavailable`;
    renameSync(raceRoot, movedRoot);
    try { assert.equal((await call("augnes_define_repository_initial_work", { ...raceArgs, previewBinding: racePreview.preview_binding })).reason, "repository_unresolved"); }
    finally { renameSync(movedRoot, raceRoot); }
    assert.deepEqual(db.serialize(), beforeBindingRefusals);
    const select = (project_id: string) => {
      const active = readActiveProjectSelectionV01(db, scope.workspace_id)!;
      selectActiveProjectV01(db, { workspace_id: scope.workspace_id, project_id,
        expected_project_id: active.project_id, expected_revision: active.selection_revision, now: new Date().toISOString() });
    };
    select(consumerScope.project_id);
    assert.equal((await call("augnes_resume_repository", { repositoryRoot: raceRoot })).continuity.snapshot.binding, raceArgs.expectedSnapshotBinding);
    assert.equal((await call("augnes_preview_repository_initial_work", raceArgs)).preview_binding, racePreview.preview_binding);
    select(raceScope.project_id);
    assert.equal((await call("augnes_resume_repository", { repositoryRoot: raceRoot })).continuity.snapshot.binding, raceArgs.expectedSnapshotBinding);
    raceResume = await call("augnes_resume_repository", { repositoryRoot: raceRoot });
    raceArgs = { ...raceArgs, expectedSnapshotBinding: raceResume.continuity.snapshot.binding };
    racePreview = await call("augnes_preview_repository_initial_work", raceArgs);
    assert.equal(racePreview.status, "previewed");
    select(consumerScope.project_id);
    const requestsBeforeRace = observations.length;
    const racers = await Promise.all([0, 1].map(() => call("augnes_define_repository_initial_work", { ...raceArgs, previewBinding: racePreview.preview_binding })));
    assert.equal(observations.length, requestsBeforeRace + 2, "one dispatch per contender");
    assert.equal(racers.filter(result => result.status === "saved").length, 1);
    assert(racers.every(result => result.status === "saved" || result.reason === "refresh_required" || result.status === "outcome_unknown"));
    // SQLite contention may be outcome_unknown; reconcile with explicit readback.
    const raceReadback = await call("augnes_resume_repository", { repositoryRoot: raceRoot });
    assert.equal(raceReadback.continuity.current_work.lineage_kind, "initial_user_defined");
    assert.equal(inspectPreExecutionProjectWorkRevisionChainV01(db, raceScope).packets.length, 1);
    assert.equal((db.prepare("SELECT COUNT(*) AS n FROM vnext_local_operator_sessions WHERE project_id = ?").get(raceScope.project_id) as { n: number }).n, 1);
    assert.equal(validateRecoveryCanonicalDatabaseV01(db).status, "valid");
    console.log(JSON.stringify({ concurrent_initial_creation: racers.map(result => ({ status: result.status, reason: result.reason })), unique_genesis: true,
      changed_runtime_authentication_role_recovery_and_root_refused: true, unrelated_selection_independent: true, explicit_resume_reconciled: true }));
    return { databasePath, root, scope, operator_id: COMPANION_WORK_OPERATOR_ID_V01, selected, goal: initial.task.goal };
  } finally {
    try {
      server.closeAllConnections();
      if (server.listening) await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    } finally { db.close(); process.env = environment; }
  }
}
