import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { applyCanonicalDatabaseMigrations } from "./canonical-database-migrations.mjs";
import { inspectRuntimeDatabase, prepareRuntimeDatabase, structuralSchemaContractSignature } from "./runtime-database-bootstrap.mjs";
import { migrateProjectSelectionV02 } from "../lib/vnext/persistence/project-lifecycle-schema.mjs";
import { getOrCreateDefaultWorkspaceIdentityV01, getOrCreateCanonicalProjectForLocalRootV01, normalizeLocalProjectRootRefV01 } from "../lib/vnext/persistence/project-identity-registry";
import { readProjectSelectionStateV02, selectActiveProjectV01 } from "../lib/vnext/persistence/project-lifecycle-registry";
import { declareAndInspectLocalProjectV01, confirmLocalProjectOnboardingV01, listRegisteredProjectsV02 } from "../lib/vnext/onboarding/local-project-onboarding";
import { GET, POST } from "../app/api/vnext/projects/route";
import { readBlankStateSourceV01 } from "../lib/vnext/blank-state/blank-state-source";
import { runCanonicalChild, canonicalChildAcceptanceFailure } from "./canonical-child-runner.mjs";

async function call(body?: unknown, query = "", expected = 200) {
  const response = await (body ? POST : GET)(new Request(`http://127.0.0.1/api/vnext/projects${query}`, {
    method: body ? "POST" : "GET", headers: { host: "127.0.0.1", origin: "http://127.0.0.1", "content-type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  }));
  const value = await response.json();
  assert.equal(response.status, expected, JSON.stringify(value));
  return value;
}

export async function testProjectManagement() {
  const root = mkdtempSync(path.join(tmpdir(), "augnes-project-management-"));
  const previous = process.env.AUGNES_DB_PATH;
  process.env.AUGNES_DB_PATH = path.join(root, "state.db");
  const db = new Database(process.env.AUGNES_DB_PATH);
  try {
    db.pragma("foreign_keys=ON"); applyCanonicalDatabaseMigrations(db);
    const workspace = getOrCreateDefaultWorkspaceIdentityV01(db);
    const projects = Array.from({ length: 25 }, (_, i) => {
      const folder = path.join(root, `project-${i}`); mkdirSync(folder);
      writeFileSync(path.join(folder, "kept.txt"), `original ${i}`);
      return getOrCreateCanonicalProjectForLocalRootV01(db, { workspace_id: workspace.workspace_id,
        local_root: normalizeLocalProjectRootRefV01(folder, { base_path: root }), display_name: `Saved ${i}` });
    });
    rmSync(projects[24]!.root_binding.local_root.normalized_path, { recursive: true });
    const a = projects[0]!.project.project_id, b = projects[1]!.project.project_id;
    const observation = () => { const state = readProjectSelectionStateV02(db, workspace.workspace_id); return { expected_project_id: state?.project_id ?? null, expected_revision: state?.selection_revision ?? null }; };
    const open = (project_id: string, expected = observation()) => call({ action: "open", project_id, ...expected });
    const remove = (project_id: string) => call({ action: "remove", project_id, ...observation() });
    const emptyBefore = observation();
    await open(a);
    const oldA = observation();
    const pendingRoot=path.join(root,"pending-connect");mkdirSync(pendingRoot);
    const pending=await declareAndInspectLocalProjectV01(pendingRoot);
    assert.equal(pending.status,"selected");
    const firstPage = await call(undefined, "?view=registered");
    assert.equal(firstPage.projects.length, 20); assert.equal(firstPage.complete, false); assert(firstPage.next_cursor);
    await call(undefined, "?view=registered&cursor=invalid", 400);
    const foreignCursor = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(firstPage.next_cursor, "base64url").toString()), workspace: "workspace:foreign" })).toString("base64url");
    await call(undefined, `?view=registered&cursor=${foreignCursor}`, 400);
    const secondPage = await call(undefined, `?view=registered&cursor=${firstPage.next_cursor}`);
    assert.equal(secondPage.projects.length, 5); assert.equal(secondPage.complete, true);
    assert.equal(new Set([...firstPage.projects, ...secondPage.projects].map(p => p.project.project_id)).size, 25);
    assert.equal(secondPage.projects[4].root_availability, "missing");
    assert.equal(secondPage.projects[4].in_recents, false);
    const identityBytes = db.prepare("SELECT * FROM vnext_project_identities ORDER BY project_id").all();
    const rootBytes = db.prepare("SELECT * FROM vnext_project_root_bindings ORDER BY project_id").all();
    await remove(a);
    assert.equal((await call()).recent_projects.length, 0);
    assert.equal((await call(undefined, "?view=registered")).projects[0].project.project_id, a);
    await call({ action: "open", project_id: b, ...emptyBefore }, "", 409);
    await call(undefined, `?view=registered&cursor=${firstPage.next_cursor}`, 409);
    await open(a);
    assert.notEqual(observation().expected_revision, oldA.expected_revision);
    const beforeStale = () => JSON.stringify({ identities: db.prepare("SELECT * FROM vnext_project_identities ORDER BY project_id").all(), recents: db.prepare("SELECT * FROM vnext_recent_projects ORDER BY project_id").all(), selection: observation() });
    const stable = beforeStale();
    await assert.rejects(confirmLocalProjectOnboardingV01(db,{selection_token:pending.selection_token,inspection_fingerprint:pending.inspection.inspection_fingerprint,selection_origin:"declared_path",display_name:"Stale new project"}),/active_selection_conflict/);
    for (const action of ["open", "remove"]) await call({ action, project_id: a, ...oldA }, "", 409);
    await call({ action: "rename", project_id: a, expected_active_project_id: a, expected_active_selection_revision: oldA.expected_revision,
      expected_current_display_name: "Saved 0", requested_display_name: "Stale edit" }, "", 409);
    assert.equal(beforeStale(), stable, "stale mutations roll back identities and recency");
    await open(b); await open(a);
    await call({ action: "remove", project_id: a, ...oldA }, "", 409);
    await remove(a);
    const emptyAfter = observation();
    const emptySource = await readBlankStateSourceV01(db, { route_mode: "canonical" });
    assert.equal(emptySource.active_project_id, null);
    assert.equal(emptySource.active_selection_revision, emptyAfter.expected_revision,
      "the browser source retains the cleared selection observation");
    await open(a); await remove(a);
    await call({ action: "open", project_id: b, ...emptyAfter }, "", 409);
    assert.deepEqual(db.prepare("SELECT * FROM vnext_project_identities ORDER BY project_id").all(), identityBytes);
    assert.deepEqual(db.prepare("SELECT * FROM vnext_project_root_bindings ORDER BY project_id").all(), rootBytes);
    assert.equal(readFileSync(path.join(projects[0]!.root_binding.local_root.normalized_path, "kept.txt"), "utf8"), "original 0");
    const concurrent = observation();
    const request = { action: "open", project_id: a, ...concurrent };
    const responses = await Promise.all([0,1].map(() => POST(new Request("http://127.0.0.1/api/vnext/projects", { method: "POST", headers: { host: "127.0.0.1", origin: "http://127.0.0.1", "content-type": "application/json" }, body: JSON.stringify(request) }))));
    assert.deepEqual(responses.map(r => r.status).sort(), [200,409]);

    // Drop any row, including the lookahead or summary, from the actual SQL result.
    // Instrument only an isolated reader; no production fallback is introduced.
    const prepare = db.prepare.bind(db);
    for (const drop of [0, 1, 21]) {
      db.prepare = ((sql: string) => {
        const statement = prepare(sql);
        if (sql.includes("WITH page AS MATERIALIZED")) {
          const all = statement.all.bind(statement);
          statement.all = (...args: unknown[]) => { const rows = all(...args); rows.splice(drop, 1); return rows; };
        }
        return statement;
      }) as typeof db.prepare;
      await assert.rejects(listRegisteredProjectsV02(db, null), /project_discovery_incomplete/);
    }
    db.prepare = prepare;
    const later = await listRegisteredProjectsV02(db, null);
    db.prepare = ((sql: string) => {
      const statement = prepare(sql);
      if (sql.includes("WITH page AS MATERIALIZED")) { const all = statement.all.bind(statement); statement.all = (...args: unknown[]) => all(...args).slice(0, -1); }
      return statement;
    }) as typeof db.prepare;
    await assert.rejects(listRegisteredProjectsV02(db, later.next_cursor), /project_discovery_incomplete/);
    db.prepare = prepare;

    const expected = { count: 25, project_id: a, oldA, selection: observation() };
    const input = path.join(root, "readback.json"); writeFileSync(input, JSON.stringify(expected));
    const result = await runCanonicalChild({ resourceOwner: undefined, suite: "project-management", label: "fresh process rediscovery and stale refusal", command: process.execPath,
      args: ["--import", "tsx", "scripts/test-project-management.ts", "--readback", input], cwd: process.cwd(), env: process.env, timeoutMs: 30_000 });
    assert.equal(canonicalChildAcceptanceFailure(result, { suite: "project-management", timeoutMs: 30_000, requireNaturalExit: true }), null);
    await testLegacyMigration(db, workspace.workspace_id, a, root);
    console.log(JSON.stringify({ project_management: "pass", registered:25, pages:[20,5], stale_cycles:["A-B-A","A-none-A","none-A-none"], concurrent_winners:1, lost_first_and_later_pages:"refused", fresh_process:true, provider_calls:0 }));
  } finally { db.close(); if (previous === undefined) delete process.env.AUGNES_DB_PATH; else process.env.AUGNES_DB_PATH = previous; rmSync(root, { recursive:true, force:true }); }
}

async function testLegacyMigration(source: Database.Database, workspace: string, project: string, root: string) {
  for (const active of [true,false]) {
    const databasePath = path.join(root, `legacy-${active}.db`);
    writeFileSync(databasePath, source.serialize());
    const db = new Database(databasePath);
    const before = db.prepare("SELECT * FROM vnext_project_identities ORDER BY project_id").all();
    try {
      db.exec(`DROP INDEX idx_vnext_project_direction_authority; DROP TRIGGER trg_vnext_project_selection_retain; DROP TABLE vnext_active_project_selections;
CREATE TABLE IF NOT EXISTS vnext_active_project_selections (
  workspace_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  active_project_selection_version TEXT NOT NULL CHECK (
    active_project_selection_version = 'active_project_selection.v0.1'
  ),
  selection_revision INTEGER NOT NULL CHECK (selection_revision > 0),
  selected_at TEXT NOT NULL CHECK (length(trim(selected_at)) > 0),
  FOREIGN KEY (workspace_id, project_id)
    REFERENCES vnext_project_identities(workspace_id, project_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
);`);
      if (active) db.prepare("INSERT INTO vnext_active_project_selections VALUES (?,?,'active_project_selection.v0.1',1,'2026-01-01T00:00:00.000Z')").run(workspace,project);
      assert.equal(structuralSchemaContractSignature(db), "05472650bc9bec935c2ece2a2cff9678cf3d361dea46599e9e1d83ed0e571326", "exact predecessor schema");
      const failed=new Database(db.serialize());
      try {
        const rows=failed.prepare("SELECT * FROM vnext_active_project_selections").all();
        const signature=structuralSchemaContractSignature(failed);
        const exec=failed.exec.bind(failed);
        failed.exec=(sql:string)=>{if(sql.includes("INSERT INTO vnext_active_project_selections"))throw new Error("injected migration write failure");return exec(sql);};
        assert.throws(()=>migrateProjectSelectionV02(failed),/injected migration write failure/);
        assert.equal(structuralSchemaContractSignature(failed),signature);
        assert.deepEqual(failed.prepare("SELECT * FROM vnext_active_project_selections").all(),rows);
      } finally {failed.close();}
    } finally { db.close(); }
    assert.equal((await inspectRuntimeDatabase({ databasePath })).database_state,"old");
    const upgradeInput = { databasePath, backupDirectory:path.join(root,`backups-${active}`), repositoryRoot:process.cwd(), instanceId:`selection-upgrade-${active}`, databaseOverrideActive:true };
    const migratedStore = await prepareRuntimeDatabase(upgradeInput);
    assert.equal(migratedStore.databaseState,"migrated"); assert.equal(migratedStore.recoveryBackupCreated,true);
    const reopened = new Database(databasePath);
    try {
      const db = reopened;
      const migrated = readProjectSelectionStateV02(db,workspace)!;
      assert.equal(migrated.project_id,active ? project : null); assert.match(migrated.selection_revision,/^selection:[0-9a-f]{32}$/);
      migrateProjectSelectionV02(db); assert.deepEqual(readProjectSelectionStateV02(db,workspace),migrated);
      assert.throws(()=>selectActiveProjectV01(db,{workspace_id:workspace,project_id:project,expected_project_id:active ? project : null,expected_revision:active ? 1 : null,now:new Date().toISOString()}),/active_selection_conflict/);
      assert.deepEqual(readProjectSelectionStateV02(db,workspace),migrated);
      assert.deepEqual(db.prepare("SELECT * FROM vnext_project_identities ORDER BY project_id").all(),before);
      assert.throws(()=>db.prepare("DELETE FROM vnext_active_project_selections WHERE workspace_id=?").run(workspace),/project_selection_delete_refused/);
    } finally { reopened.close(); }
  }
}

if (process.argv[2] === "--readback") {
  void (async () => {
    const expected=JSON.parse(readFileSync(process.argv[3]!,"utf8"));
    const first=await call(undefined,"?view=registered");
    const last=await call(undefined,`?view=registered&cursor=${first.next_cursor}`);
    assert.equal(first.projects.length+last.projects.length,expected.count);
    const found=first.projects.find((p:{project:{project_id:string}})=>p.project.project_id===expected.project_id);
    assert.equal(found.active_selection_revision,expected.selection.expected_revision);
    await call({action:"open",project_id:expected.project_id,...expected.oldA},"",409);
    await call({action:"open",project_id:expected.project_id,...expected.selection});
    console.log("fresh-process registered discovery and stale-write refusal passed");
  })().catch(error=>{console.error(error);process.exitCode=1;});
}
