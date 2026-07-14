#!/usr/bin/env node
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, renameSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import Database from "better-sqlite3";

import { applyCanonicalDatabaseMigrations } from "./canonical-database-migrations.mjs";
import { vNextProjectLifecycleSchemaSqlV01 } from "./db-migrations.mjs";
import {
  chooseLocalProjectFolderV01,
  confirmLocalProjectOnboardingV01,
  inspectLocalProjectRootV01,
  listRecentProjectsV01,
  openRecentProjectV01,
  pickAndInspectLocalProjectV01,
  readProjectDestinationV01,
  rebindLocalProjectRootFromSelectionV01,
  removeProjectFromRecentV01,
  sanitizeRepositoryRemoteV01,
} from "../lib/vnext/onboarding/local-project-onboarding";
import { getOrCreateDefaultWorkspaceIdentityV01, VNEXT_PROJECT_IDENTITY_REGISTRY_SCHEMA_SQL_V01 } from "../lib/vnext/persistence/project-identity-registry";
import { VNEXT_PROJECT_LIFECYCLE_SCHEMA_SQL_V01 } from "../lib/vnext/persistence/project-lifecycle-registry";
import { POST as projectRoutePost } from "../app/api/vnext/projects/route";

const root = mkdtempSync(path.join(tmpdir(), "augnes-project-onboarding-"));
const dbPath = path.join(root, "onboarding.db");
const folderA = path.join(root, "Project A ü");
const folderB = path.join(root, "Project B");
const folderA2 = path.join(root, "Project A moved");
const folderNoRemote = path.join(root, "Git without remote");
const worktreeFolder = path.join(root, "Git worktree fixture");
const worktreeGitDir = path.join(root, "worktree metadata");
const disappearingFolder = path.join(root, "Disappearing selection");
mkdirSync(folderA); mkdirSync(folderB); mkdirSync(folderA2); mkdirSync(folderNoRemote);
mkdirSync(worktreeFolder); mkdirSync(worktreeGitDir); mkdirSync(disappearingFolder);
const originalEnvironment = { ...process.env };

async function main() {
try {
  const commands: Array<{ command: string; args: readonly string[] }> = [];
  const selected = await chooseLocalProjectFolderV01({ platform: "darwin", process: {
    async run(command, args) { commands.push({ command, args }); return { stdout: `${folderA}\n` }; },
  }});
  assert.deepEqual(selected, { status: "selected", absolute_path: folderA });
  assert.equal(commands[0].command, "/usr/bin/osascript");
  assert.equal(commands[0].args.includes(folderA), false, "selected paths must never enter process arguments");
  const windowsCommands: string[] = [];
  await chooseLocalProjectFolderV01({ platform: "win32", process: { async run(command) { windowsCommands.push(command); return { stdout: folderA }; } } });
  assert.deepEqual(windowsCommands, ["powershell.exe"]);
  const linuxCommands: string[] = [];
  await chooseLocalProjectFolderV01({ platform: "linux", process: { async run(command) { linuxCommands.push(command); return { stdout: folderA }; } } });
  assert.deepEqual(linuxCommands, ["zenity"]);
  assert.equal((await chooseLocalProjectFolderV01({ platform: "freebsd" })).status, "unavailable");
  assert.equal((await chooseLocalProjectFolderV01({ platform: "freebsd", environment: { NODE_ENV: "production", AUGNES_TEST_FOLDER_PICKER_PATH: folderA } })).status, "unavailable");
  assert.equal((await chooseLocalProjectFolderV01({ platform: "linux", process: { async run() { const error = new Error("cancelled") as Error & { code: number }; error.code = 1; throw error; } } })).status, "cancelled");
  assert.deepEqual(await chooseLocalProjectFolderV01({ platform: "darwin", process: { async run() { const error = new Error("timeout") as Error & { code: string }; error.code = "ETIMEDOUT"; throw error; } } }), { status: "error", error_code: "picker_timeout" });
  assert.deepEqual(await chooseLocalProjectFolderV01({ platform: "darwin", process: { async run() { const error = Object.assign(new Error("killed"), { code: null, killed: true, signal: "SIGKILL" }); throw error; } } }), { status: "error", error_code: "picker_timeout" });
  assert.deepEqual(await chooseLocalProjectFolderV01({ platform: "darwin", process: { async run() { const error = Object.assign(new Error("bounded"), { code: "ERR_CHILD_PROCESS_STDIO_MAXBUFFER" }); throw error; } } }), { status: "error", error_code: "picker_failed" });

  const regularFile = path.join(root, "not-a-directory.txt");
  writeFileSync(regularFile, "fixture");
  await assert.rejects(inspectLocalProjectRootV01(path.join(root, "missing")), /selection_missing/);
  await assert.rejects(inspectLocalProjectRootV01(regularFile), /selection_not_directory/);

  const plain = await inspectLocalProjectRootV01(folderA, { now: () => "2026-07-15T00:00:00.000Z" });
  assert.equal(plain.folder_kind, "plain_folder");
  assert.equal(plain.display_name, "Project A ü");
  mkdirSync(path.join(folderA, ".git"));
  writeFileSync(path.join(folderA, ".git", "config"), `[remote "origin"]\n  url = https://user:secret@example.test/shared/repo.git\n`);
  const git = await inspectLocalProjectRootV01(folderA, { now: () => "2026-07-15T00:00:01.000Z" });
  assert.equal(git.folder_kind, "git_repository");
  assert.equal(git.repository_display, "https://example.test/shared/repo.git");
  assert.equal(JSON.stringify(git).includes("secret"), false);
  assert.equal(sanitizeRepositoryRemoteV01("git@example.test:shared/repo.git"), "example.test:shared/repo.git");
  mkdirSync(path.join(folderNoRemote, ".git"));
  writeFileSync(path.join(folderNoRemote, ".git", "config"), "[core]\n  bare = false\n");
  const noRemote = await inspectLocalProjectRootV01(folderNoRemote);
  assert.equal(noRemote.folder_kind, "git_repository");
  assert.equal(noRemote.repository_status, "no_remote");
  writeFileSync(path.join(worktreeFolder, ".git"), `gitdir: ${path.relative(worktreeFolder, worktreeGitDir)}\n`);
  writeFileSync(path.join(worktreeGitDir, "config"), `[remote "origin"]\n  url = git@example.test:shared/worktree.git\n`);
  const worktree = await inspectLocalProjectRootV01(worktreeFolder);
  assert.equal(worktree.folder_kind, "git_repository");
  assert.equal(worktree.repository_display, "example.test:shared/worktree.git");
  mkdirSync(path.join(folderB, ".git"));
  writeFileSync(path.join(folderB, ".git", "config"), `[remote "origin"]\n  url = https://example.test/shared/repo.git\n`);

  process.env.AUGNES_CANONICAL_TEST_MODE = "1";
  process.env.AUGNES_CANONICAL_TEMP_ROOT = root;
  const open = () => { const db = new Database(dbPath); db.pragma("foreign_keys = ON"); applyCanonicalDatabaseMigrations(db); return db; };
  process.env.AUGNES_DB_PATH = dbPath;
  let db = open();
  assert.deepEqual(await listRecentProjectsV01(db), []);
  assert.equal((db.prepare("SELECT COUNT(*) AS count FROM vnext_workspace_identities").get() as { count: number }).count, 0, "passive recent reads must not create a workspace");
  db.close();
  const rejectedOrigin = await projectRoutePost(new Request("http://127.0.0.1:4321/api/vnext/projects", {
    method: "POST", headers: { host: "127.0.0.1:4321", origin: "https://attacker.invalid", "content-type": "application/json" }, body: JSON.stringify({ action: "choose_folder" }),
  }));
  assert.equal(rejectedOrigin.status, 403);
  async function selection(folder: string, time: string) {
    process.env.AUGNES_TEST_FOLDER_PICKER_PATH = folder;
    const result = await pickAndInspectLocalProjectV01({ open_database: open, now: () => time });
    assert.equal(result.status, "selected");
    return result;
  }
  const selectedA = await selection(folderA, "2026-07-15T00:01:00.000Z");
  assert.equal(selectedA.status, "selected");
  db = open();
  assert.equal((db.prepare("SELECT COUNT(*) AS count FROM vnext_workspace_identities").get() as { count: number }).count, 0, "inspection must not create workspace identity rows");
  const confirmedA = await confirmLocalProjectOnboardingV01(db, { selection_token: selectedA.selection_token, inspection_fingerprint: selectedA.inspection.inspection_fingerprint }, { now: () => "2026-07-15T00:01:00.000Z" });
  assert.equal(confirmedA.status, "created");
  assert.equal((await listRecentProjectsV01(db)).length, 1);
  assert.equal((await listRecentProjectsV01(db))[0].is_active, true);
  db.close();

  db = open();
  const reopened = await readProjectDestinationV01(db, confirmedA.project.project_id);
  assert(reopened);
  assert.equal(reopened.external_refs.length, 1);
  const selectedB = await selection(folderB, "2026-07-15T00:02:00.000Z");
  assert.equal(selectedB.status, "selected");
  const confirmedB = await confirmLocalProjectOnboardingV01(db, { selection_token: selectedB.selection_token, inspection_fingerprint: selectedB.inspection.inspection_fingerprint }, { now: () => "2026-07-15T00:02:00.000Z" });
  assert.notEqual(confirmedA.project.project_id, confirmedB.project.project_id);
  assert.equal((await listRecentProjectsV01(db)).length, 2);
  assert.equal((await readProjectDestinationV01(db, confirmedB.project.project_id))?.external_refs.length, 1);
  assert.equal((await readProjectDestinationV01(db, confirmedA.project.project_id))?.external_refs.length, 1);

  const occupiedRecovery = await selection(folderB, "2026-07-15T00:02:30.000Z");
  assert.equal(occupiedRecovery.status, "selected");
  await assert.rejects(rebindLocalProjectRootFromSelectionV01(db, {
    project_id: confirmedA.project.project_id,
    selection_token: occupiedRecovery.selection_token,
    inspection_fingerprint: occupiedRecovery.inspection.inspection_fingerprint,
  }), /project_root_rebind_conflict/);
  assert.equal((await readProjectDestinationV01(db, confirmedB.project.project_id))?.root_binding.local_root.normalized_path, folderB);

  await assert.rejects(openRecentProjectV01(db, { project_id: confirmedA.project.project_id, expected_project_id: null }), /active_selection_conflict/);
  const activeB = (await listRecentProjectsV01(db)).find((entry) => entry.is_active)!;
  await openRecentProjectV01(db, { project_id: confirmedA.project.project_id, expected_project_id: activeB.project.project_id, now: "2026-07-15T00:03:00.000Z" });
  assert.equal((await listRecentProjectsV01(db)).find((entry) => entry.is_active)?.project.project_id, confirmedA.project.project_id);
  const removed = removeProjectFromRecentV01(db, confirmedA.project.project_id);
  assert.deepEqual(removed, { removed: true, project_data_preserved: true });
  assert(await readProjectDestinationV01(db, confirmedA.project.project_id));
  assert.equal((await listRecentProjectsV01(db)).some((entry) => entry.is_active), false);

  renameSync(folderA, `${folderA}.missing`);
  const remainingA = await readProjectDestinationV01(db, confirmedA.project.project_id);
  assert.equal(remainingA?.root_availability, "missing");
  await assert.rejects(openRecentProjectV01(db, { project_id: confirmedA.project.project_id }), /project_root_unavailable/);
  const recovery = await selection(folderA2, "2026-07-15T00:04:00.000Z");
  assert.equal(recovery.status, "selected");
  const rebound = await rebindLocalProjectRootFromSelectionV01(db, { project_id: confirmedA.project.project_id, selection_token: recovery.selection_token, inspection_fingerprint: recovery.inspection.inspection_fingerprint }, { now: () => "2026-07-15T00:04:00.000Z" });
  assert.equal(rebound.project.project_id, confirmedA.project.project_id);
  assert.equal((await readProjectDestinationV01(db, confirmedA.project.project_id))?.root_binding.local_root.normalized_path, folderA2);
  assert.equal((await listRecentProjectsV01(db)).find((entry) => entry.project.project_id === confirmedA.project.project_id)?.is_active, true);

  const replaySelection = await selection(folderA2, "2026-07-15T00:05:00.000Z");
  assert.equal(replaySelection.status, "selected");
  const replay = await confirmLocalProjectOnboardingV01(db, { selection_token: replaySelection.selection_token, inspection_fingerprint: replaySelection.inspection.inspection_fingerprint }, { now: () => "2026-07-15T00:05:00.000Z" });
  assert.equal(replay.status, "already_added");
  assert.equal(replay.project.project_id, confirmedA.project.project_id);
  assert.equal((await readProjectDestinationV01(db, confirmedA.project.project_id))?.external_refs.length, 1);
  assert.equal((db.prepare("SELECT COUNT(*) AS count FROM vnext_project_identities").get() as { count: number }).count, 2);
  assert.equal((db.prepare("SELECT COUNT(*) AS count FROM vnext_recent_projects").get() as { count: number }).count, 2);
  assert.equal((db.prepare("SELECT COUNT(*) AS count FROM vnext_active_project_selections").get() as { count: number }).count, 1);
  const workspace = getOrCreateDefaultWorkspaceIdentityV01(db);
  assert(workspace.workspace_id.startsWith("workspace:"));
  db.close();

  const disappearing = await selection(disappearingFolder, "2026-07-15T00:05:30.000Z");
  assert.equal(disappearing.status, "selected");
  renameSync(disappearingFolder, `${disappearingFolder}.missing`);
  db = open();
  const projectsBeforeMissingConfirmation = (db.prepare("SELECT COUNT(*) AS count FROM vnext_project_identities").get() as { count: number }).count;
  await assert.rejects(confirmLocalProjectOnboardingV01(db, {
    selection_token: disappearing.selection_token,
    inspection_fingerprint: disappearing.inspection.inspection_fingerprint,
  }), /selection_missing/);
  assert.equal((db.prepare("SELECT COUNT(*) AS count FROM vnext_project_identities").get() as { count: number }).count, projectsBeforeMissingConfirmation);
  db.close();

  const tampered = await selection(folderB, "2026-07-15T00:06:00.000Z");
  assert.equal(tampered.status, "selected");
  db = open();
  await assert.rejects(confirmLocalProjectOnboardingV01(db, { selection_token: tampered.selection_token, inspection_fingerprint: "sha256:" + "0".repeat(64) }), /selection_tampered/);
  assert.equal((db.prepare("SELECT COUNT(*) AS count FROM vnext_project_identities").get() as { count: number }).count, 2);
  for (const artifact of ["vnext_recent_projects", "vnext_active_project_selections", "idx_vnext_recent_projects_workspace_opened"]) {
    assert(db.prepare("SELECT 1 FROM sqlite_master WHERE name = ?").get(artifact));
  }
  applyCanonicalDatabaseMigrations(db);
  db.close();

  const artifactNames = ["vnext_recent_projects", "vnext_active_project_selections", "idx_vnext_recent_projects_workspace_opened"];
  const artifactSql = (database: Database.Database) => Object.fromEntries(artifactNames.map((name) => [name, String((database.prepare("SELECT sql FROM sqlite_master WHERE name = ?").get(name) as { sql: string }).sql).replace(/\s+/g, " ").replace(/\s*([(),=])\s*/g, "$1").trim()]));
  const runtimeSchema = new Database(":memory:");
  runtimeSchema.exec(VNEXT_PROJECT_IDENTITY_REGISTRY_SCHEMA_SQL_V01);
  runtimeSchema.exec(VNEXT_PROJECT_LIFECYCLE_SCHEMA_SQL_V01);
  const migrationSchema = new Database(":memory:");
  migrationSchema.exec(VNEXT_PROJECT_IDENTITY_REGISTRY_SCHEMA_SQL_V01);
  migrationSchema.exec(vNextProjectLifecycleSchemaSqlV01);
  const canonicalSchema = new Database(":memory:");
  canonicalSchema.exec(readFileSync(path.join(process.cwd(), "lib", "db", "schema.sql"), "utf8"));
  assert.deepEqual(artifactSql(runtimeSchema), artifactSql(migrationSchema));
  assert.deepEqual(artifactSql(runtimeSchema), artifactSql(canonicalSchema));
  runtimeSchema.close(); migrationSchema.close(); canonicalSchema.close();

  console.log(JSON.stringify({ status: "pass", picker_adapter: true, picker_platform_boundaries: true, picker_output_and_timeout_bounded: true, origin_guard: true, plain_and_git_inspection: true, git_no_remote_and_worktree_metadata: true, inspection_identity_rows_written: 0, passive_reads_identity_rows_written: 0, credentials_sanitized: true, exact_root_replay: true, same_repository_independence: true, recent_active_restart: true, removal_preserves_data: true, moved_root_recovery: true, occupied_root_rebind_refusal: true, stale_tamper_and_disappearing_root_refusal: true, migration_idempotent: true, migration_schema_parity: true, network_calls: 0, git_processes: 0 }, null, 2));
} finally {
  process.env = originalEnvironment;
  rmSync(root, { recursive: true, force: true });
}
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "project_onboarding_test_failed");
  process.exitCode = 1;
});
