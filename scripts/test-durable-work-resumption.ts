// Genuine historical packets are authored by the pinned predecessor writers,
// never by changing timestamps, resealing packets, or repairing database rows.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { canonicalizeProtocolValueV01 as canonical } from "../lib/vnext/protocol-primitives";
import { readProjectWorkInitializationV01 } from "../lib/vnext/runtime/project-work-initialization";
import { readProjectWorkRevisionEligibilityStrictV01 } from "../lib/vnext/runtime/project-work-revision";
import { readCurrentProjectWorkPacketLineageV01, projectVNextOperatorPilotContinuityV01 } from "../lib/vnext/runtime/operator-pilot-project-continuity";
import { readResultWorkPreparationV01 } from "../lib/vnext/runtime/authored-successor-task";
import { readProjectAutomationControlV01 } from "../lib/vnext/persistence/project-control-store";
import { readActiveProjectSelectionV01 } from "../lib/vnext/persistence/project-lifecycle-registry";
import { POST as manageProject } from "../app/api/vnext/projects/route";
import { historicalDurableWorkFixtures, DURABLE_WORK_PREDECESSOR } from "./historical-durable-work-fixtures";
import { validateRecoveryCanonicalDatabaseV01 } from "./recovery-canonical-record-validator";
import { registerOwnedChild, waitForOwnedProcessExit, terminateOwnedProcessTree } from "./test-harness-process-lifecycle.mjs";

const predecessor = DURABLE_WORK_PREDECESSOR;
const definition = { goal: "Continue the bounded saved investigation", success_criteria: ["Preserve attributed uncertainty"], non_goals: ["No execution or semantic acceptance"] };

const current = (f: any) => readCurrentProjectWorkPacketLineageV01(f.db, f.config)!.packet;
const revision = (f: any) => {
  const w = readProjectWorkInitializationV01(f.db, f.config), p = current(f);
  return { action: "revise_pre_execution_project_work", ...f.scope, expected_active_project_id: f.scope.project_id,
    expected_active_selection_revision: w.active_selection_revision, expected_current_packet_id: p.packet_id,
    expected_current_packet_fingerprint: p.integrity.fingerprint, expected_current_lineage_kind: "authored_successor_task", ...p.task };
};
const core = (f: any) => f.db.prepare("SELECT * FROM vnext_core_records ORDER BY rowid").all();
const authority = (f: any) => canonical([readProjectAutomationControlV01(f.db, f.scope), ...["autonomy_runs", "autonomy_run_steps", "autonomy_run_events"].map(table => f.db.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all())]);

async function clearAndReopen(f: any) {
  const previous = process.env.AUGNES_DB_PATH;
  process.env.AUGNES_DB_PATH = f.config.database_path;
  try {
    const selected = readActiveProjectSelectionV01(f.db, f.scope.workspace_id)!;
    let revision = selected.selection_revision;
    for (const action of ["remove", "open"]) {
      const response = await manageProject(new Request("http://127.0.0.1/api/vnext/projects", { method: "POST",
        headers: { host: "127.0.0.1", origin: "http://127.0.0.1", "content-type": "application/json" },
        body: JSON.stringify({ action, project_id: f.scope.project_id, expected_project_id: action === "remove" ? f.scope.project_id : null, expected_revision: revision }) }));
      const value = await response.json(); assert.equal(response.status, 200, canonical(value));
      revision = value.result.selection.selection_revision;
    }
    assert.notEqual(revision, selected.selection_revision);
  } finally { if (previous === undefined) delete process.env.AUGNES_DB_PATH; else process.env.AUGNES_DB_PATH = previous; }
}

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

export async function durableWorkContract(createFixture: (name: string, restored?: any) => Promise<any>, root: string, baseline = false) {
  const historical = await historicalDurableWorkFixtures(root);
  const restore = async (name: string) => {
    const saved = historical[name], f = await createFixture(`durable-${name}`, saved);
    const fingerprint = (bytes: string) => createHash("sha256").update(bytes).digest("hex");
    assert.equal(fingerprint(canonical(core(f))), saved.core_fingerprint, "Upgrade preserves every historical Core byte");
    assert.equal(fingerprint(authority(f)), saved.authority_fingerprint, "Upgrade does not renew runs, grants or automation");
    assert.equal(current(f).integrity.fingerprint, saved.packet_fingerprint);
    const selection = readActiveProjectSelectionV01(f.db, f.scope.workspace_id)!;
    assert.equal(selection.project_id, saved.selection.project_id);
    assert.match(String(selection.selection_revision), /^selection:[0-9a-f]{32}$/);
    return f;
  };
  if (!baseline) {
    // Re-enter both pre-receipt authoring families without inventing a receipt.
    for (const kind of ["terminal", "replacement"] as const) {
      const f = await restore(kind);
      let body: any;
      assert.ok(current(f).expires_at);
      const frozen = core(f), control = authority(f), task = current(f).task, calls = f.calls;
      f.tick(4 * 24 * 3600_000); await f.call(undefined, 401); f.refreshSession();
      const beforeRead = f.db.serialize();
      body = (await f.call()).preparation.resumption_request;
      assert.ok(body, "Ordinary authenticated read supplies saved authorship without form reentry");
      assert(beforeRead.equals(f.db.serialize()));
      await clearAndReopen(f);
      const afterReselection = f.db.serialize();
      assert.deepEqual((await f.call()).preparation.resumption_request, body, "Held saved-work request remains bound to unchanged project work through selection ABA");
      assert(afterReselection.equals(f.db.serialize()));
      if (kind === "replacement") {
        for (const binding of [undefined, null, 1, "invalid"]) {
          const invalid = { ...body, expected_project_work_binding: binding };
          await f.call(invalid, 409); assert(afterReselection.equals(f.db.serialize()));
        }
      }
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
      console.log(JSON.stringify({ historical_stateless_resumption: kind, days: 4, no_grant_or_run: true, selection_ABA: "unchanged_project_binding_retained", changed_source_and_physical_root: "atomic_refusal" }));
    }
  }
  for (const saved of [false, true]) {
    const name = saved ? "saved" : "result", f = await restore(name), completed = historical[name].completed;
    assert.ok(current(f).expires_at);
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
    const f = await restore("null");
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
