import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { applyCanonicalDatabaseMigrations } from "./canonical-database-migrations.mjs";
import { createRecoveryBackup } from "./recovery-backup.mjs";
import { inspectRecoveryDatabaseFile, restoreRuntimeDatabase } from "./runtime-database-bootstrap.mjs";
import { runCanonicalChild, canonicalChildAcceptanceFailure } from "./canonical-child-runner.mjs";
import { getOrCreateDefaultWorkspaceIdentityV01, getOrCreateCanonicalProjectForLocalRootV01, normalizeLocalProjectRootRefV01 } from "../lib/vnext/persistence/project-identity-registry";
import { readProjectSelectionStateV02 } from "../lib/vnext/persistence/project-lifecycle-registry";
import { defineInitialProjectWorkV01 } from "../lib/vnext/runtime/project-work-initialization";
import { issueVNextLocalOperatorBootstrapV01, consumeVNextLocalOperatorBootstrapV01, readVNextLocalOperatorCredentialFromRequestV01, VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01 } from "../lib/vnext/runtime/local-operator-session";
import { GET, POST } from "../app/api/vnext/projects/route";

async function request(body?: unknown, expected = 200) {
  const response = await (body ? POST : GET)(new Request(`http://127.0.0.1/api/vnext/projects${body ? "" : "?view=registered"}`, {
    method: body ? "POST" : "GET", headers: { host: "127.0.0.1", origin: "http://127.0.0.1", "content-type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  }));
  const value = await response.json(); assert.equal(response.status, expected, JSON.stringify(value)); return value;
}
const observation = (db: Database.Database, workspace: string) => {
  const selected = readProjectSelectionStateV02(db, workspace);
  return { expected_project_id: selected?.project_id ?? null, expected_revision: selected?.selection_revision ?? null };
};
const history = (db: Database.Database) => ["vnext_core_records", "vnext_project_identities", "vnext_project_root_bindings", "vnext_project_direction_records", "autonomy_runs"]
  .map(table => db.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all());
const digest = (file: string) => createHash("sha256").update(readFileSync(file)).digest("hex");

export async function testProjectSelectionRecovery() {
  const root = realpathSync(mkdtempSync(path.join(tmpdir(), "augnes-selection-recovery-"))), previous = process.env.AUGNES_DB_PATH;
  const repositoryRoot = process.cwd(), fingerprint = createHash("sha256").update(repositoryRoot).digest("hex");
  let db: Database.Database | undefined;
  try {
    for (const state of ["selected", "cleared", "never-selected"]) {
      const directory = path.join(root, state), projectRoot = path.join(directory, "project"), databasePath = path.join(directory, "work.db"), backupDirectory = path.join(directory, "backups");
      mkdirSync(directory); mkdirSync(projectRoot); writeFileSync(path.join(projectRoot, "kept.txt"), "Original project file");
      process.env.AUGNES_DB_PATH = databasePath;
      db = new Database(databasePath); db.pragma("foreign_keys=ON"); applyCanonicalDatabaseMigrations(db);
      const workspace = getOrCreateDefaultWorkspaceIdentityV01(db).workspace_id;
      const project = getOrCreateCanonicalProjectForLocalRootV01(db, { workspace_id: workspace, local_root: normalizeLocalProjectRootRefV01(projectRoot, { base_path: root }), display_name: "Restore fixture" }).project.project_id;
      const select = (action: "open" | "remove") => request({ action, project_id: project, ...observation(db!, workspace) });
      if (state !== "never-selected") {
        await select("open");
        const config = { enabled: true as const, workspace_id: workspace, project_id: project, operator_id: "operator:selection-recovery-fixture", database_path: databasePath };
        const bootstrap = issueVNextLocalOperatorBootstrapV01(db, { config });
        const session = consumeVNextLocalOperatorBootstrapV01(db, { config, bootstrap_token: bootstrap.bootstrap_token });
        const credential = readVNextLocalOperatorCredentialFromRequestV01(new Request("http://127.0.0.1", { headers: { cookie: `${VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01}=${session.cookie_value}` } }));
        defineInitialProjectWorkV01(db, { config, credential, request: { action: "define_initial_project_work", workspace_id: workspace, project_id: project,
          expected_active_project_id: project, expected_active_selection_revision: observation(db, workspace).expected_revision!, expected_initialization_state: "not_defined",
          goal: "Keep the original saved work", success_criteria: ["Preserve historical fingerprints"], non_goals: ["No execution authority"] } });
        if (state === "cleared") await select("remove");
      }
      const saved = observation(db, workspace), original = history(db);
      const held = state === "selected" ? { action: "rename", project_id: project, expected_active_project_id: project, expected_active_selection_revision: saved.expected_revision,
        expected_current_display_name: "Restore fixture", requested_display_name: "Stale name" } : { action: "open", project_id: project, ...saved };
      // These JavaScript owners infer only their defaulted options in TypeScript.
      // Keep the fixture on their real full input contract without changing it.
      const backup = await createRecoveryBackup({ databasePath, backupDirectory, applicationScopeFingerprint: fingerprint,
        sourceApplication: { application_version: null, build_identity: null, package_contract: null, package_contract_version: null, runtime_contract: null, runtime_schema_version: null },
        reason: "manual_recovery", inspectDatabase: inspectRecoveryDatabaseFile } as unknown as Parameters<typeof createRecoveryBackup>[0]);
      const backupBytes = digest(backup.payloadPath);
      if (state === "selected") { await select("remove"); await select("open"); }
      else { await select("open"); await select("remove"); }
      await request(held, 409);
      const moved = observation(db, workspace);
      const restore = { databasePath, backupDirectory, repositoryRoot, instanceId: `selection-recovery-${state}`, repositoryFingerprint: fingerprint,
        runtimeOwnershipGeneration: "owned-selection-fixture", databaseOverrideActive: true, selectedBackupId: backup.manifest.backup_id } as unknown as NonNullable<Parameters<typeof restoreRuntimeDatabase>[0]>;
      db.close();
      // A failure after stage invalidation cannot publish the new token or rows.
      await assert.rejects(restoreRuntimeDatabase({ ...restore, dependencies: { verifyPreparedDatabase: () => { throw new Error("injected_stage_refusal"); } } }), /database_integrity_failed/);
      db = new Database(databasePath); assert.deepEqual(observation(db, workspace), moved); assert.deepEqual(history(db), original); db.close();
      const seen = new Set([saved.expected_revision, moved.expected_revision]);
      for (let attempt = 0; attempt < 2; attempt++) {
        assert.equal((await restoreRuntimeDatabase(restore)).databaseState, "restored");
        db = new Database(databasePath);
        const current = observation(db, workspace);
        assert.equal(current.expected_project_id, saved.expected_project_id);
        assert.match(current.expected_revision!, /^selection:[0-9a-f]{32}$/u); assert(!seen.has(current.expected_revision)); seen.add(current.expected_revision);
        assert.deepEqual(history(db), original); assert.equal(digest(backup.payloadPath), backupBytes);
        assert.equal(readFileSync(path.join(projectRoot, "kept.txt"), "utf8"), "Original project file");
        const input = path.join(directory, `readback-${attempt}.json`); writeFileSync(input, JSON.stringify({ databasePath, workspace, project, held, current }));
        db.close();
        const result = await runCanonicalChild({ resourceOwner: undefined, suite: "selection-recovery", label: `fresh process ${state} restore ${attempt}`, command: process.execPath,
          args: ["--import", "tsx", "scripts/test-project-selection-recovery.ts", "--readback", input], cwd: repositoryRoot, env: process.env, timeoutMs: 15_000 });
        assert.equal(canonicalChildAcceptanceFailure(result, { suite: "selection-recovery", timeoutMs: 15_000, requireNaturalExit: true }), null);
      }
    }
    console.log(JSON.stringify({ selection_recovery: "pass", states: ["selected", "cleared", "never-selected"], repeated_restore: true, stale_requests: "refused", fresh_process_management: "accepted", historical_rows_and_backup_bytes: "unchanged", failed_stage: "not_published" }));
  } finally { if (db?.open) db.close(); if (previous === undefined) delete process.env.AUGNES_DB_PATH; else process.env.AUGNES_DB_PATH = previous; rmSync(root, { recursive: true, force: true }); }
}

const isEntryPoint = path.resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url);
if (isEntryPoint && process.argv[2] === "--readback") {
  void (async () => {
    const input = JSON.parse(readFileSync(process.argv[3]!, "utf8")); process.env.AUGNES_DB_PATH = input.databasePath;
    const db = new Database(input.databasePath);
    try {
      assert.deepEqual(observation(db, input.workspace), input.current);
      const before = db.serialize(); await request(input.held, 409); assert(before.equals(db.serialize()));
      const page = await request(); assert.equal(page.complete, true); assert.equal(page.projects[0].project.project_id, input.project);
      await request({ action: "open", project_id: input.project, ...input.current });
      console.log(JSON.stringify({ restored_selection_fresh_process: "pass", held_write: "refused", fresh_open: "accepted" }));
    } finally { db.close(); }
  })().catch(error => { console.error(error); process.exitCode = 1; });
} else if (isEntryPoint && process.argv[2] === "--only") void testProjectSelectionRecovery().catch(error => { console.error(error); process.exitCode = 1; });
