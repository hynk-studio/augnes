// Genuine historical packets are authored by the pinned predecessor writers,
// never by changing timestamps, resealing packets, or repairing database rows.
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { canonicalizeProtocolValueV01 as canonical } from "../lib/vnext/protocol-primitives";
import { readProjectWorkInitializationV01 } from "../lib/vnext/runtime/project-work-initialization";
import { readProjectWorkRevisionEligibilityStrictV01 } from "../lib/vnext/runtime/project-work-revision";
import { readCurrentProjectWorkPacketLineageV01, projectVNextOperatorPilotContinuityV01 } from "../lib/vnext/runtime/operator-pilot-project-continuity";
import { readResultWorkPreparationV01 } from "../lib/vnext/runtime/authored-successor-task";
import { mutateProjectControlV01, readProjectAutomationControlV01 } from "../lib/vnext/persistence/project-control-store";
import { validateRecoveryCanonicalDatabaseV01 } from "./recovery-canonical-record-validator";
import { registerOwnedChild, waitForOwnedProcessExit, terminateOwnedProcessTree } from "./test-harness-process-lifecycle.mjs";

const predecessor = "d9b6b56f0de6dcb0a36ac591b13a3672f99fa71a";
const pricing = { input_nano_usd_per_byte: 1000, output_nano_usd_per_token: 1000, maximum_total_nano_usd: 100_000_000, source_version: "durable-work-scripted" };
const material = { question: "Which connection is visible in this exact excerpt?", files: [{ path: "entry.ts", start_line: 1, end_line: 2 }] };
const definition = { goal: "Continue the bounded saved investigation", success_criteria: ["Preserve attributed uncertainty"], non_goals: ["No execution or semantic acceptance"] };

async function oldWriter(root: string, name: string, replacements: Record<string, string> = {}) {
  const file = `lib/vnext/runtime/${name}.ts`;
  const source = spawnSync("git", ["show", `${predecessor}:${file}`], { encoding: "utf8", timeout: 5000 });
  assert.equal(source.status, 0, "Historical writer must be available at the exact predecessor");
  const target = path.join(root, `historical-${name}.ts`);
  writeFileSync(target, source.stdout.replace(/from "(\.\.?\/[^"\n]+)"/g,
    (_match, specifier) => `from "${replacements[specifier] ?? path.resolve(path.dirname(file), specifier)}"`));
  return { module: await import(pathToFileURL(target).href), path: target };
}
const current = (f: any) => readCurrentProjectWorkPacketLineageV01(f.db, f.config)!.packet;
const revision = (f: any) => {
  const w = readProjectWorkInitializationV01(f.db, f.config), p = current(f);
  return { action: "revise_pre_execution_project_work", ...f.scope, expected_active_project_id: f.scope.project_id,
    expected_active_selection_revision: w.active_selection_revision, expected_current_packet_id: p.packet_id,
    expected_current_packet_fingerprint: p.integrity.fingerprint, expected_current_lineage_kind: "authored_successor_task", ...p.task };
};
const core = (f: any) => f.db.prepare("SELECT * FROM vnext_core_records ORDER BY rowid").all();
const authority = (f: any) => canonical([readProjectAutomationControlV01(f.db, f.scope), ...["autonomy_runs", "autonomy_run_steps", "autonomy_run_events"].map(table => f.db.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all())]);

async function freshSurfaces(f: any, root: string, modes = process.platform === "darwin" ? ["human", "agent"] : ["agent"]) {
  for (const mode of modes) {
    const directory = path.join(root, `durable-surface-${mode}`); mkdirSync(directory);
    const database_path = path.join(directory, "work.sqlite"); await f.db.backup(database_path);
    for (const stage of [mode, "readback"]) {
      const input = path.join(directory, `${stage}.json`);
      writeFileSync(input, JSON.stringify({ config: { ...f.config, database_path }, projectRoot: f.projectRoot, mode: stage,
        at: new Date(Date.parse(f.now()) + (stage === "readback" ? 4 * 24 * 3600_000 : 0)).toISOString() }));
      const owned = new Set();
      const child = registerOwnedChild(owned, spawn(process.execPath, ["--import", "tsx", "scripts/test-durable-work-surfaces.ts", input], { detached: true, stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, OPENAI_API_KEY: "" } }), { label: "durable-work-surface" });
      let output = ""; for (const stream of [child.child.stdout, child.child.stderr]) stream?.on("data", (b: Buffer) => { output = (output + b.toString()).slice(-16000); });
      try { const result = await waitForOwnedProcessExit(child, 45000); assert.equal(result.code, 0, output); console.log(output.trim()); }
      finally { await terminateOwnedProcessTree(child); assert.equal(owned.size, 0); }
    }
  }
}

export async function durableWorkContract(createFixture: (name: string) => Promise<any>, root: string, baseline = false) {
  const terminal = await oldWriter(root, "stateless-terminal-authorship");
  const successor = await oldWriter(root, "authored-successor-task");
  const oldRevision = await oldWriter(root, "authored-successor-revision");
  const revisionOwner = await oldWriter(root, "project-work-revision", { "./authored-successor-revision": oldRevision.path });
  if (!baseline) {
    // Re-enter both pre-receipt authoring families without inventing a receipt.
    for (const kind of ["terminal", "replacement"] as const) {
      const f = await createFixture(`durable-unexecuted-${kind}`);
      f.controls.lose = kind === "replacement";
      if (kind === "terminal") f.controls.transform = (output: any) => { output.recommendations[0].grounded_state_keys = ["wrong-source"]; };
      const attempt = (await f.call({ action: "authorize_and_run", authorization: f.preview })).result;
      let body: any;
      if (kind === "terminal") {
        const request = { predecessor: attempt.terminal_preparation.binding, definition, material, notes: [], omitted_sources: [] as any[] };
        request.omitted_sources = (await f.call({ action: "compare_terminal_sources", request })).preparation.comparison.unselected_previous.map((e: any) => ({ source_binding: e.source_ref, reason: "Explicitly select current inventory." }));
        const preview = (await f.call({ action: "preview_terminal_work", request })).preparation;
        f.tick(); terminal.module.authorTerminalWork(f.db, { config: f.config, credential: f.credential(), request, expected_preview: preview.preview_binding, now: f.now });
        body = { action: "author_terminal_work", request };
      } else {
        const ended = (await f.call({ action: "end_work", binding: attempt.disposition_preparation.binding })).result;
        const old = await oldWriter(root, "stateless-review-disposition");
        const { prepareMaterial } = await import("../lib/vnext/runtime/stateless-source-review");
        body = { action: "prepare_linked_work", disposition: { run_id: ended.run.run_id, disposition_fingerprint: ended.run.metadata.stateless_review_disposition.fingerprint }, material };
        f.tick(); old.module.prepareLinkedStatelessWork(f.db, { config: f.config, credential: f.credential(), disposition: body.disposition, review: prepareMaterial(f.db, f.config, material, f.now()).review, now: f.now });
      }
      assert.ok(current(f).expires_at); f.refreshSession();
      const frozen = core(f), control = authority(f), task = current(f).task, calls = f.calls;
      f.tick(4 * 24 * 3600_000); await f.call(undefined, 401); f.refreshSession();
      const beforeRead = f.db.serialize();
      body = (await f.call()).preparation.resumption_request;
      assert.ok(body, "Ordinary authenticated read supplies saved authorship without form reentry");
      assert(beforeRead.equals(f.db.serialize()));
      if (process.platform === "darwin") await freshSurfaces(f, root, [`stateless-${kind}`]);
      const unchanged = f.db.serialize(), sourcePath = path.join(f.projectRoot, "entry.ts"), bytes = readFileSync(sourcePath);
      try {
        writeFileSync(sourcePath, "export const changed = true;\n// Different selected bytes.\n");
        await f.call(body, 409); assert(unchanged.equals(f.db.serialize()));
      } finally { writeFileSync(sourcePath, bytes); }
      const moved = `${f.projectRoot}-original`;
      renameSync(f.projectRoot, moved); mkdirSync(f.projectRoot); writeFileSync(sourcePath, bytes);
      try { await f.call(body, 409); assert(unchanged.equals(f.db.serialize())); }
      finally { rmSync(f.projectRoot, { recursive: true }); renameSync(moved, f.projectRoot); }
      await f.call(body); assert.equal(current(f).expires_at, null); assert.deepEqual(current(f).task, task);
      const packet = current(f); await f.call(body); assert.equal(current(f).packet_id, packet.packet_id);
      assert.deepEqual(core(f).slice(0, frozen.length), frozen); assert.equal(authority(f), control); assert.equal(f.calls, calls);
      assert.equal(validateRecoveryCanonicalDatabaseV01(f.db).status, "valid");
      console.log(JSON.stringify({ historical_stateless_resumption: kind, days: 4, no_grant_or_run: true, changed_source_and_physical_root: "atomic_refusal" }));
    }
  }
  for (const saved of [false, true]) {
    const f = await createFixture(`durable-${saved}`);
    assert.equal(current(f).expires_at, null, "Initial preparation already has no expiry");
    f.controls.transform = (output: any) => { output.recommendations[0].grounded_state_keys = ["wrong-source"]; };
    const first = (await f.call({ action: "authorize_and_run", authorization: f.preview })).result;
    assert.equal(first.run.status, "stopped");
    const prep = first.terminal_preparation;
    const request = { predecessor: prep.binding, definition, material, notes: [], omitted_sources: [] as any[] };
    request.omitted_sources = (await f.call({ action: "compare_terminal_sources", request })).preparation.comparison.unselected_previous
      .map((e: any) => ({ source_binding: e.source_ref, reason: "Replace the prior inventory with current selected bytes." }));
    const preview = (await f.call({ action: "preview_terminal_work", request })).preparation;
    f.tick();
    const historical = terminal.module.authorTerminalWork(f.db, { config: f.config, credential: f.credential(), request, expected_preview: preview.preview_binding, now: f.now });
    assert.ok(historical.packet.expires_at);
    f.refreshSession(); f.controls.transform = () => {};
    const grant = (await f.call({ action: "preview", pricing })).authorization;
    const completed = (await f.call({ action: "authorize_and_run", authorization: grant })).result;
    assert.equal(completed.run.status, "completed");
    if (saved) {
      const prep = await f.continuity({ action: "read_result_work_preparation", receipt_id: completed.receipt.receipt_id });
      const comparison = (await f.continuity({ action: "compare_result_work_sources", binding: prep.binding, notes: [] })).comparison;
      const preview = await f.continuity({ action: "preview_result_work", binding: prep.binding, definition,
        selected_sources: { selected_source_context: comparison.entries, expected_source_comparison: comparison.fingerprint,
          omitted_sources: comparison.unselected_previous.map((e: any) => ({ source_binding: e.source_ref, reason: "Keep the evidence in immutable history." })) } });
      f.tick(); await successor.module.defineAuthoredSuccessorTaskV01(f.db, { config: f.config, credential: f.credential(), request: preview.request, clock: { now: f.now } });
      f.refreshSession(); f.tick();
      const historicalRevision = revisionOwner.module.revisePreExecutionProjectWorkV01(f.db, { config: f.config, credential: f.credential(),
        request: { ...revision(f), goal: "Edit the saved investigation before expiry" }, clock: { now: f.now } });
      assert.equal(historicalRevision.packet.expires_at, historical.packet.expires_at);
      f.refreshSession();
    }
    const selected = readProjectWorkInitializationV01(f.db, f.config);
    mutateProjectControlV01(f.db, { ...f.scope, action: "disable_automation", expected_active_project_id: f.scope.project_id,
      expected_active_selection_revision: selected.active_selection_revision!, expected_control_revision: readProjectAutomationControlV01(f.db, f.scope)!.revision }, { now: f.now });
    const frozen = core(f), frozenAuthority = authority(f), calls = f.calls, expiredPacket = current(f);
    f.tick(4 * 24 * 3600_000); f.refreshSession();
    assert.equal(projectVNextOperatorPilotContinuityV01(f.db, { config: f.config, clock: { now: f.now } }).packet_currentness, "expired");
    assert.equal(current(f).integrity.fingerprint, expiredPacket.integrity.fingerprint);
    assert.deepEqual(core(f), frozen, "Reads preserve all historical bytes and fingerprints");
    if (baseline) {
      if (saved) {
        assert.equal(readProjectWorkRevisionEligibilityStrictV01(f.db, f.scope, { evaluated_at: f.now() }).eligible, false);
        await f.continuity(revision(f), 409);
      } else {
        assert.throws(() => readResultWorkPreparationV01(f.db, { config: f.config, receipt_id: completed.receipt.receipt_id, clock: { now: f.now } }), /preparation_unavailable/);
        await f.continuity({ action: "read_result_work_preparation", receipt_id: completed.receipt.receipt_id }, 409);
      }
      console.log(JSON.stringify({ baseline: saved ? "ordinary_revision_blocked" : "result_preparation_blocked", days: 4, expiry: expiredPacket.expires_at, historical_writer: predecessor }));
    } else {
      if (saved) {
        await freshSurfaces(f, root);
        assert.equal(readProjectWorkRevisionEligibilityStrictV01(f.db, f.scope, { evaluated_at: f.now() }).eligible, true);
        const request = revision(f);
        await f.continuity(request, 201);
        const resumed = current(f);
        assert.equal(resumed.expires_at, null); assert.deepEqual(resumed.task, expiredPacket.task);
        for (const field of ["required_checks", "forbidden_actions", "data_classification"] as const) assert.deepEqual(resumed.constraints[field], expiredPacket.constraints[field]);
        for (const field of ["max_characters", "max_estimated_tokens", "max_selected_entries", "max_projection_items"] as const) assert.equal(resumed.constraints.context_budget[field], expiredPacket.constraints.context_budget[field]);
        await f.continuity(request, 200);
        assert.equal(current(f).packet_id, resumed.packet_id);
        await f.continuity({ ...request, goal: "Concurrent stale edit" }, 409);
      } else {
        const prep = await f.continuity({ action: "read_result_work_preparation", receipt_id: completed.receipt.receipt_id });
        const comparison = (await f.continuity({ action: "compare_result_work_sources", binding: prep.binding, notes: [] })).comparison;
        const preview = await f.continuity({ action: "preview_result_work", binding: prep.binding, definition,
          selected_sources: { selected_source_context: comparison.entries, expected_source_comparison: comparison.fingerprint,
            omitted_sources: comparison.unselected_previous.map((e: any) => ({ source_binding: e.source_ref, reason: "Historical inventory remains available." })) } });
        await f.continuity({ action: "prepare_result_work", request: preview.request }, 201);
        assert.equal(current(f).expires_at, null);
      }
      assert.equal(current(f).capability_grant, null);
      assert.equal(validateRecoveryCanonicalDatabaseV01(f.db).status, "valid");
      assert.deepEqual(core(f).slice(0, frozen.length), frozen);
      console.log(JSON.stringify({ durable_work: saved ? "unchanged_revision_resumption" : "expired_result_successor", days: 4, historical_fingerprints_preserved: true }));
    }
    assert.equal(authority(f), frozenAuthority); assert.equal(f.calls, calls);
  }
  if (!baseline) {
    const f = await createFixture("historical-null-work");
    const completed = (await f.call({ action: "authorize_and_run", authorization: f.preview })).result;
    const prep = await f.continuity({ action: "read_result_work_preparation", receipt_id: completed.receipt.receipt_id });
    const comparison = (await f.continuity({ action: "compare_result_work_sources", binding: prep.binding, notes: [] })).comparison;
    const preview = await f.continuity({ action: "preview_result_work", binding: prep.binding, definition,
      selected_sources: { selected_source_context: comparison.entries, expected_source_comparison: comparison.fingerprint,
        omitted_sources: comparison.unselected_previous.map((e: any) => ({ source_binding: e.source_ref, reason: "Preserve the old source inventory in history." })) } });
    f.tick(); await successor.module.defineAuthoredSuccessorTaskV01(f.db, { config: f.config, credential: f.credential(), request: preview.request, clock: { now: f.now } });
    f.refreshSession(); f.tick();
    revisionOwner.module.revisePreExecutionProjectWorkV01(f.db, { config: f.config, credential: f.credential(),
      request: { ...revision(f), goal: "Historical already-durable work" }, clock: { now: f.now } });
    const old = current(f), frozen = core(f), control = authority(f), calls = f.calls;
    assert.equal(old.expires_at, null); assert.ok(!old.compatibility.source_contracts.includes("augnes.durable-authored-work.v0.1"));
    f.tick(4 * 24 * 3600_000); f.refreshSession();
    const request = revision(f); await f.continuity(request, 200);
    assert.equal(current(f).integrity.fingerprint, old.integrity.fingerprint, "Unchanged already-null work needs no replacement");
    await f.continuity({ ...request, goal: "An actual edit after several days" }, 201);
    assert.equal(current(f).expires_at, null); assert.deepEqual(core(f).slice(0, frozen.length), frozen);
    assert.equal(authority(f), control); assert.equal(f.calls, calls); assert.equal(validateRecoveryCanonicalDatabaseV01(f.db).status, "valid");
    console.log(JSON.stringify({ historical_null_successor_and_revision: "reconstructed_and_editable", days: 4, unchanged_save: "exact_replay" }));
  }
}
