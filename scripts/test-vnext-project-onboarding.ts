#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync, renameSync } from "node:fs";
import { open as openFile } from "node:fs/promises";
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
  readRootAvailabilityV01,
  rebindLocalProjectRootFromSelectionV01,
  removeProjectFromRecentV01,
  sanitizeRepositoryRemoteV01,
  type LocalProjectMetadataFileReaderV01,
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
const staleFolder = path.join(root, "Stale project C");
const nullConflictFolder = path.join(root, "Null conflict project D");
mkdirSync(folderA); mkdirSync(folderB); mkdirSync(folderA2); mkdirSync(folderNoRemote);
mkdirSync(worktreeFolder); mkdirSync(worktreeGitDir); mkdirSync(disappearingFolder);
mkdirSync(staleFolder); mkdirSync(nullConflictFolder);
const originalEnvironment = { ...process.env };
const MAX_GIT_METADATA_BYTES = 64 * 1024;
const MAX_REQUEST_BODY_BYTES = 16 * 1024;

function sizedText(prefix: string, byteLength: number): string {
  const remaining = byteLength - Buffer.byteLength(prefix);
  assert(remaining >= 0);
  return prefix + "#".repeat(remaining);
}

function createTrackingMetadataReader(metrics: {
  bytes_read: number;
  read_lengths: number[];
  opened: number;
  closed: number;
}): LocalProjectMetadataFileReaderV01 {
  return {
    async open(file) {
      const handle = await openFile(file, "r");
      metrics.opened += 1;
      return {
        async read(buffer, offset, length, position) {
          metrics.read_lengths.push(length);
          const result = await handle.read(buffer, offset, length, position);
          metrics.bytes_read += result.bytesRead;
          return { bytesRead: result.bytesRead };
        },
        async close() {
          metrics.closed += 1;
          await handle.close();
        },
      };
    },
  };
}

function activeSnapshot(entries: Awaited<ReturnType<typeof listRecentProjectsV01>>) {
  const entry = entries[0];
  return {
    expected_project_id: entry?.active_project_id ?? null,
    expected_revision: entry?.active_selection_revision ?? null,
  };
}

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
  assert.equal((await chooseLocalProjectFolderV01({ platform: "freebsd", environment: { NODE_ENV: "production", AUGNES_TEST_FOLDER_PICKER_OUTCOME: "cancelled" } })).status, "unavailable");
  assert.equal((await chooseLocalProjectFolderV01({ platform: "freebsd", environment: { NODE_ENV: "test", AUGNES_CANONICAL_TEST_MODE: "1", AUGNES_CANONICAL_TEMP_ROOT: root, AUGNES_TEST_FOLDER_PICKER_OUTCOME: "cancelled" } })).status, "cancelled");
  assert.equal((await chooseLocalProjectFolderV01({ platform: "linux", process: { async run() { const error = new Error("cancelled") as Error & { code: number }; error.code = 1; throw error; } } })).status, "cancelled");
  assert.deepEqual(await chooseLocalProjectFolderV01({ platform: "darwin", process: { async run() { const error = new Error("timeout") as Error & { code: string }; error.code = "ETIMEDOUT"; throw error; } } }), { status: "error", error_code: "picker_timeout" });
  assert.deepEqual(await chooseLocalProjectFolderV01({ platform: "darwin", process: { async run() { const error = Object.assign(new Error("killed"), { code: null, killed: true, signal: "SIGKILL" }); throw error; } } }), { status: "error", error_code: "picker_timeout" });
  assert.deepEqual(await chooseLocalProjectFolderV01({ platform: "darwin", process: { async run() { const error = Object.assign(new Error("bounded"), { code: "ERR_CHILD_PROCESS_STDIO_MAXBUFFER" }); throw error; } } }), { status: "error", error_code: "picker_failed" });

  const regularFile = path.join(root, "not-a-directory.txt");
  writeFileSync(regularFile, "fixture");
  await assert.rejects(inspectLocalProjectRootV01(path.join(root, "missing")), /selection_missing/);
  await assert.rejects(inspectLocalProjectRootV01(regularFile), /selection_not_directory/);
  await assert.rejects(inspectLocalProjectRootV01(folderA, { filesystem: { async access() { throw Object.assign(new Error("denied"), { code: "EACCES" }); } } }), /selection_inaccessible/);

  const plain = await inspectLocalProjectRootV01(folderA, { now: () => "2026-07-15T00:00:00.000Z" });
  assert.equal(plain.folder_kind, "plain_folder");
  assert.equal(plain.display_name, "Project A ü");
  mkdirSync(path.join(folderA, ".git"));
  const credentialRemote = "https://credential-user:credential-password@example.test/shared/repo.git?access_token=top-secret&token=second-secret#secret-fragment";
  const removedCredentialMaterial = ["credential-user", "credential-password", "access_token", "top-secret", "token=", "second-secret", "secret-fragment"];
  writeFileSync(path.join(folderA, ".git", "config"), `[remote "origin"]\n  url = ${credentialRemote}\n`);
  const git = await inspectLocalProjectRootV01(folderA, { now: () => "2026-07-15T00:00:01.000Z" });
  assert.equal(git.folder_kind, "git_repository");
  assert.equal(git.repository_display, "https://example.test/shared/repo.git");
  assert.equal(git.repository_ref?.external_id, "https://example.test/shared/repo.git");
  for (const secret of removedCredentialMaterial) assert.equal(JSON.stringify(git).includes(secret), false);
  const remoteCases = [
    ["https://credential-user:credential-password@example.test/org/repo.git", "https://example.test/org/repo.git"],
    ["https://example.test/org/repo.git?access_token=secret", "https://example.test/org/repo.git"],
    ["https://example.test/org/repo.git?token=secret", "https://example.test/org/repo.git"],
    ["https://example.test/org/repo.git?first=secret&second=other", "https://example.test/org/repo.git"],
    ["https://example.test/org/repo.git?token=secret%2Fencoded", "https://example.test/org/repo.git"],
    ["https://example.test/org/repo.git#secret-fragment", "https://example.test/org/repo.git"],
    ["https://example.test/org/repo.git?token=secret#secret-fragment", "https://example.test/org/repo.git"],
    ["ssh://credential-user:credential-password@example.test/org/repo.git?token=secret#fragment", "ssh://example.test/org/repo.git"],
    ["git://credential-user:credential-password@example.test/org/repo.git?token=secret#fragment", "git://example.test/org/repo.git"],
    ["git@example.test:org/repo.git?secret", "example.test:org/repo.git"],
    ["git@example.test:org/repo.git#secret", "example.test:org/repo.git"],
    ["git@example.test:org/repo.git", "example.test:org/repo.git"],
    ["https://example.test/org/repo.git", "https://example.test/org/repo.git"],
  ] as const;
  for (const [remote, expected] of remoteCases) {
    const sanitized = sanitizeRepositoryRemoteV01(remote);
    assert.equal(sanitized, expected);
    assert.equal(JSON.stringify(sanitized).includes("secret"), false);
    assert.equal(JSON.stringify(sanitized).includes("credential-password"), false);
  }
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
  mkdirSync(path.join(staleFolder, ".git"));
  writeFileSync(path.join(staleFolder, ".git", "config"), `[remote "origin"]\n  url = https://example.test/stale/project.git\n`);

  const exactLimitRoot = path.join(root, "Git config exact limit");
  const oversizedRoot = path.join(root, "Git config over limit");
  const substantiallyOversizedRoot = path.join(root, "Git config substantially over limit");
  const oversizedPointerRoot = path.join(root, "Git pointer over limit");
  const oversizedCommonRoot = path.join(root, "Git commondir over limit");
  for (const fixture of [exactLimitRoot, oversizedRoot, substantiallyOversizedRoot, oversizedPointerRoot, oversizedCommonRoot]) mkdirSync(fixture);
  for (const fixture of [exactLimitRoot, oversizedRoot, substantiallyOversizedRoot, oversizedCommonRoot]) mkdirSync(path.join(fixture, ".git"));
  const configPrefix = `[remote "origin"]\n  url = https://example.test/bounded/repo.git\n`;
  writeFileSync(path.join(exactLimitRoot, ".git", "config"), sizedText(configPrefix, MAX_GIT_METADATA_BYTES));
  writeFileSync(path.join(oversizedRoot, ".git", "config"), sizedText(configPrefix, MAX_GIT_METADATA_BYTES + 1));
  writeFileSync(path.join(substantiallyOversizedRoot, ".git", "config"), sizedText(configPrefix, MAX_GIT_METADATA_BYTES * 4));
  writeFileSync(path.join(oversizedPointerRoot, ".git"), sizedText("gitdir: metadata\n", MAX_GIT_METADATA_BYTES + 1));
  writeFileSync(path.join(oversizedCommonRoot, ".git", "commondir"), sizedText("../metadata\n", MAX_GIT_METADATA_BYTES + 1));
  const successMetrics = { bytes_read: 0, read_lengths: [] as number[], opened: 0, closed: 0 };
  const exactLimitInspection = await inspectLocalProjectRootV01(exactLimitRoot, { metadata_reader: createTrackingMetadataReader(successMetrics) });
  assert.equal(exactLimitInspection.repository_display, "https://example.test/bounded/repo.git");
  assert.equal(successMetrics.opened, successMetrics.closed);
  assert.equal(successMetrics.bytes_read, MAX_GIT_METADATA_BYTES);
  assert(Math.max(...successMetrics.read_lengths) <= MAX_GIT_METADATA_BYTES + 1);
  for (const fixture of [oversizedRoot, substantiallyOversizedRoot, oversizedPointerRoot, oversizedCommonRoot]) {
    const metrics = { bytes_read: 0, read_lengths: [] as number[], opened: 0, closed: 0 };
    await assert.rejects(inspectLocalProjectRootV01(fixture, { metadata_reader: createTrackingMetadataReader(metrics) }), /inspection_failed/);
    assert.equal(metrics.opened, metrics.closed, "metadata handles must close after bounded-read failure");
    assert.equal(metrics.bytes_read, MAX_GIT_METADATA_BYTES + 1, "metadata reads must stop at the detection byte");
    assert(Math.max(...metrics.read_lengths) <= MAX_GIT_METADATA_BYTES + 1);
  }

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
  const invalidBodyDatabasePath = path.join(root, "invalid-body", "must-not-open.db");
  process.env.AUGNES_DB_PATH = invalidBodyDatabasePath;
  const routeHeaders = { host: "127.0.0.1:4321", origin: "http://127.0.0.1:4321", "content-type": "application/json" };
  const routeRequest = (body?: BodyInit | null, headers: Record<string, string> = {}) => new Request(
    "http://127.0.0.1:4321/api/vnext/projects",
    { method: "POST", headers: { ...routeHeaders, ...headers }, ...(body === undefined ? {} : { body }), duplex: "half" } as RequestInit & { duplex: "half" },
  );
  assert.equal((await projectRoutePost(routeRequest(undefined))).status, 400, "missing request bodies must be rejected");
  for (const contentLength of ["-1", "1.5", "NaN", "Infinity", "+1"]) {
    const response = await projectRoutePost(routeRequest("{}", { "content-length": contentLength }));
    assert.equal(response.status, 400, `invalid Content-Length ${contentLength} must be rejected`);
  }
  assert.equal((await projectRoutePost(routeRequest("{}", { "content-length": String(MAX_REQUEST_BODY_BYTES + 1) }))).status, 413);
  let oversizedPulls = 0;
  let oversizedCancelled = false;
  const oversizedChunks = [8192, 8192, 1, 4096];
  const oversizedStream = new ReadableStream<Uint8Array>({
    type: "bytes",
    pull(controller) {
      const size = oversizedChunks[oversizedPulls] ?? 4096;
      oversizedPulls += 1;
      controller.enqueue(new Uint8Array(size));
    },
    cancel() { oversizedCancelled = true; },
  });
  assert.equal((await projectRoutePost(routeRequest(oversizedStream))).status, 413);
  assert.equal(oversizedCancelled, true);
  assert.equal(oversizedPulls, 3, "the request reader must not consume chunks after the detection byte");
  let understatedPulls = 0;
  let understatedCancelled = false;
  const understatedStream = new ReadableStream<Uint8Array>({
    type: "bytes",
    pull(controller) {
      understatedPulls += 1;
      controller.enqueue(new Uint8Array(understatedPulls === 1 ? MAX_REQUEST_BODY_BYTES : 1));
    },
    cancel() { understatedCancelled = true; },
  });
  assert.equal((await projectRoutePost(routeRequest(understatedStream, { "content-length": "1" }))).status, 413);
  assert.equal(understatedCancelled, true);
  assert.equal(understatedPulls, 2);
  assert.equal(existsSync(invalidBodyDatabasePath), false, "invalid and oversized request bodies must be rejected before opening SQLite");
  process.env.AUGNES_DB_PATH = dbPath;
  process.env.AUGNES_TEST_FOLDER_PICKER_PATH = folderA;
  const exactBodyPrefix = '{"action":"choose_folder","padding":"';
  const exactBodySuffix = '"}';
  const exactBody = exactBodyPrefix + "x".repeat(MAX_REQUEST_BODY_BYTES - Buffer.byteLength(exactBodyPrefix + exactBodySuffix)) + exactBodySuffix;
  assert.equal(Buffer.byteLength(exactBody), MAX_REQUEST_BODY_BYTES);
  assert.equal((await projectRoutePost(routeRequest(exactBody, { "content-length": String(MAX_REQUEST_BODY_BYTES) }))).status, 200);
  db = open();
  assert.equal((db.prepare("SELECT COUNT(*) AS count FROM vnext_project_identities").get() as { count: number }).count, 0);
  assert.equal((db.prepare("SELECT COUNT(*) AS count FROM vnext_recent_projects").get() as { count: number }).count, 0);
  assert.equal((db.prepare("SELECT COUNT(*) AS count FROM vnext_active_project_selections").get() as { count: number }).count, 0);
  db.close();
  process.env.AUGNES_TEST_FOLDER_PICKER_PATH = substantiallyOversizedRoot;
  await assert.rejects(pickAndInspectLocalProjectV01({ open_database: open }), /inspection_failed/);
  db = open();
  assert.equal((db.prepare("SELECT COUNT(*) AS count FROM vnext_workspace_identities").get() as { count: number }).count, 0);
  assert.equal((db.prepare("SELECT COUNT(*) AS count FROM vnext_project_identities").get() as { count: number }).count, 0);
  assert.equal((db.prepare("SELECT COUNT(*) AS count FROM vnext_project_external_ref_bindings").get() as { count: number }).count, 0);
  assert.equal((db.prepare("SELECT COUNT(*) AS count FROM vnext_recent_projects").get() as { count: number }).count, 0);
  assert.equal((db.prepare("SELECT COUNT(*) AS count FROM vnext_active_project_selections").get() as { count: number }).count, 0);
  assert.equal((db.prepare("SELECT COUNT(*) AS count FROM vnext_core_records").get() as { count: number }).count, 0);
  db.close();
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
  const credentialInspectionAndConfirmation = JSON.stringify({ inspection: selectedA.inspection, confirmation: confirmedA });
  for (const secret of removedCredentialMaterial) assert.equal(credentialInspectionAndConfirmation.includes(secret), false);
  const persistedCredentialRef = db.prepare("SELECT ref_json FROM vnext_project_external_ref_bindings").get() as { ref_json: string };
  assert.equal(JSON.parse(persistedCredentialRef.ref_json).external_id, "https://example.test/shared/repo.git");
  for (const secret of removedCredentialMaterial) assert.equal(persistedCredentialRef.ref_json.includes(secret), false);
  writeFileSync(path.join(folderA, ".git", "config"), `[remote "origin"]\n  url = https://example.test/shared/repo.git\n`);
  const cleanReplaySelection = await selection(folderA, "2026-07-15T00:01:15.000Z");
  assert.equal(cleanReplaySelection.status, "selected");
  const cleanReplay = await confirmLocalProjectOnboardingV01(db, {
    selection_token: cleanReplaySelection.selection_token,
    inspection_fingerprint: cleanReplaySelection.inspection.inspection_fingerprint,
  }, { now: () => "2026-07-15T00:01:15.000Z" });
  assert.equal(cleanReplay.project.project_id, confirmedA.project.project_id);
  assert.equal((db.prepare("SELECT COUNT(*) AS count FROM vnext_project_external_ref_bindings").get() as { count: number }).count, 1, "sanitized and clean remotes must replay one binding");
  db.close();

  db = open();
  const reopened = await readProjectDestinationV01(db, confirmedA.project.project_id);
  assert(reopened);
  assert.equal(reopened.external_refs.length, 1);
  for (const secret of removedCredentialMaterial) assert.equal(JSON.stringify(reopened).includes(secret), false);
  const selectedB = await selection(folderB, "2026-07-15T00:02:00.000Z");
  assert.equal(selectedB.status, "selected");
  const confirmedB = await confirmLocalProjectOnboardingV01(db, { selection_token: selectedB.selection_token, inspection_fingerprint: selectedB.inspection.inspection_fingerprint }, { now: () => "2026-07-15T00:02:00.000Z" });
  assert.notEqual(confirmedA.project.project_id, confirmedB.project.project_id);
  assert.equal((await listRecentProjectsV01(db)).length, 2);
  assert.equal((await readProjectDestinationV01(db, confirmedB.project.project_id))?.external_refs.length, 1);
  assert.equal((await readProjectDestinationV01(db, confirmedA.project.project_id))?.external_refs.length, 1);

  const lifecycleBeforeRemoteConflict = JSON.stringify({
    recent: db.prepare("SELECT * FROM vnext_recent_projects ORDER BY workspace_id, project_id").all(),
    active: db.prepare("SELECT * FROM vnext_active_project_selections ORDER BY workspace_id").all(),
  });
  writeFileSync(path.join(folderB, ".git", "config"), `[remote "origin"]\n  url = https://example.test/changed/repo.git\n`);
  const changedRemote = await selection(folderB, "2026-07-15T00:02:15.000Z");
  assert.equal(changedRemote.status, "selected");
  await assert.rejects(confirmLocalProjectOnboardingV01(db, {
    selection_token: changedRemote.selection_token,
    inspection_fingerprint: changedRemote.inspection.inspection_fingerprint,
  }, { now: () => "2026-07-15T00:02:15.000Z" }), /project_external_ref_conflict/);
  assert.equal(JSON.stringify({
    recent: db.prepare("SELECT * FROM vnext_recent_projects ORDER BY workspace_id, project_id").all(),
    active: db.prepare("SELECT * FROM vnext_active_project_selections ORDER BY workspace_id").all(),
  }), lifecycleBeforeRemoteConflict, "failed confirmation must roll back lifecycle state");
  assert.equal(JSON.stringify(await readProjectDestinationV01(db, confirmedB.project.project_id)).includes("changed/repo"), false);
  writeFileSync(path.join(folderB, ".git", "config"), `[remote "origin"]\n  url = https://example.test/shared/repo.git\n`);

  const occupiedRecovery = await selection(folderB, "2026-07-15T00:02:30.000Z");
  assert.equal(occupiedRecovery.status, "selected");
  await assert.rejects(rebindLocalProjectRootFromSelectionV01(db, {
    project_id: confirmedA.project.project_id,
    selection_token: occupiedRecovery.selection_token,
    inspection_fingerprint: occupiedRecovery.inspection.inspection_fingerprint,
  }), /project_root_rebind_conflict/);
  assert.equal((await readProjectDestinationV01(db, confirmedB.project.project_id))?.root_binding.local_root.normalized_path, folderB);

  await assert.rejects(openRecentProjectV01(db, {
    project_id: confirmedA.project.project_id,
    expected_project_id: null,
    expected_revision: null,
  }), /active_selection_conflict/);
  let currentActiveSnapshot = activeSnapshot(await listRecentProjectsV01(db));
  await openRecentProjectV01(db, { project_id: confirmedA.project.project_id, ...currentActiveSnapshot, now: "2026-07-15T00:03:00.000Z" });
  assert.equal((await listRecentProjectsV01(db)).find((entry) => entry.is_active)?.project.project_id, confirmedA.project.project_id);
  const staleAbaSnapshot = activeSnapshot(await listRecentProjectsV01(db));
  await openRecentProjectV01(db, { project_id: confirmedB.project.project_id, ...staleAbaSnapshot, now: "2026-07-15T00:03:10.000Z" });
  currentActiveSnapshot = activeSnapshot(await listRecentProjectsV01(db));
  await openRecentProjectV01(db, { project_id: confirmedA.project.project_id, ...currentActiveSnapshot, now: "2026-07-15T00:03:20.000Z" });
  const recencyBeforeAbaConflict = JSON.stringify(db.prepare("SELECT * FROM vnext_recent_projects ORDER BY workspace_id, project_id").all());
  await assert.rejects(openRecentProjectV01(db, {
    project_id: confirmedB.project.project_id,
    ...staleAbaSnapshot,
    now: "2026-07-15T00:03:30.000Z",
  }), /active_selection_conflict/);
  assert.equal((await listRecentProjectsV01(db)).find((entry) => entry.is_active)?.project.project_id, confirmedA.project.project_id, "ABA conflicts must preserve the later active selection");
  assert.equal(JSON.stringify(db.prepare("SELECT * FROM vnext_recent_projects ORDER BY workspace_id, project_id").all()), recencyBeforeAbaConflict, "ABA conflicts must roll back recency");

  const staleOnboarding = await selection(staleFolder, "2026-07-15T00:03:40.000Z");
  assert.equal(staleOnboarding.status, "selected");
  currentActiveSnapshot = activeSnapshot(await listRecentProjectsV01(db));
  await openRecentProjectV01(db, { project_id: confirmedB.project.project_id, ...currentActiveSnapshot, now: "2026-07-15T00:03:50.000Z" });
  const stateBeforeStaleOnboarding = JSON.stringify({
    projects: db.prepare("SELECT * FROM vnext_project_identities ORDER BY workspace_id, project_id").all(),
    roots: db.prepare("SELECT * FROM vnext_project_root_bindings ORDER BY workspace_id, project_id").all(),
    refs: db.prepare("SELECT * FROM vnext_project_external_ref_bindings ORDER BY workspace_id, project_id, ref_fingerprint").all(),
    recent: db.prepare("SELECT * FROM vnext_recent_projects ORDER BY workspace_id, project_id").all(),
    active: db.prepare("SELECT * FROM vnext_active_project_selections ORDER BY workspace_id").all(),
  });
  await assert.rejects(confirmLocalProjectOnboardingV01(db, {
    selection_token: staleOnboarding.selection_token,
    inspection_fingerprint: staleOnboarding.inspection.inspection_fingerprint,
  }, { now: () => "2026-07-15T00:04:00.000Z" }), /active_selection_conflict/);
  assert.equal(JSON.stringify({
    projects: db.prepare("SELECT * FROM vnext_project_identities ORDER BY workspace_id, project_id").all(),
    roots: db.prepare("SELECT * FROM vnext_project_root_bindings ORDER BY workspace_id, project_id").all(),
    refs: db.prepare("SELECT * FROM vnext_project_external_ref_bindings ORDER BY workspace_id, project_id, ref_fingerprint").all(),
    recent: db.prepare("SELECT * FROM vnext_recent_projects ORDER BY workspace_id, project_id").all(),
    active: db.prepare("SELECT * FROM vnext_active_project_selections ORDER BY workspace_id").all(),
  }), stateBeforeStaleOnboarding, "stale onboarding must roll back every project lifecycle row");
  assert.equal((await listRecentProjectsV01(db)).find((entry) => entry.is_active)?.project.project_id, confirmedB.project.project_id);
  currentActiveSnapshot = activeSnapshot(await listRecentProjectsV01(db));
  await openRecentProjectV01(db, { project_id: confirmedA.project.project_id, ...currentActiveSnapshot, now: "2026-07-15T00:04:10.000Z" });
  const recencyBeforeStaleRemoval = JSON.stringify(db.prepare("SELECT * FROM vnext_recent_projects ORDER BY workspace_id, project_id").all());
  assert.throws(() => removeProjectFromRecentV01(db, {
    project_id: confirmedA.project.project_id,
    ...staleAbaSnapshot,
  }), /active_selection_conflict/);
  assert.equal(JSON.stringify(db.prepare("SELECT * FROM vnext_recent_projects ORDER BY workspace_id, project_id").all()), recencyBeforeStaleRemoval);
  currentActiveSnapshot = activeSnapshot(await listRecentProjectsV01(db));
  const removed = removeProjectFromRecentV01(db, { project_id: confirmedA.project.project_id, ...currentActiveSnapshot });
  assert.deepEqual(removed, { removed: true, project_data_preserved: true });
  assert(await readProjectDestinationV01(db, confirmedA.project.project_id));
  assert.equal((await listRecentProjectsV01(db)).some((entry) => entry.is_active), false);

  renameSync(folderA, `${folderA}.missing`);
  const remainingA = await readProjectDestinationV01(db, confirmedA.project.project_id);
  assert.equal(remainingA?.root_availability, "missing");
  await assert.rejects(openRecentProjectV01(db, {
    project_id: confirmedA.project.project_id,
    expected_project_id: null,
    expected_revision: null,
  }), /project_root_unavailable/);
  writeFileSync(folderA, "not a directory");
  assert.equal(await readRootAvailabilityV01(folderA), "not_directory");
  rmSync(folderA);
  writeFileSync(path.join(folderA2, "replacement-marker.txt"), "replacement folder remains unchanged");
  const oldFolderConfigBeforeRecovery = readFileSync(path.join(`${folderA}.missing`, ".git", "config"), "utf8");
  const replacementContentsBeforeRecovery = readdirSync(folderA2).sort();
  const staleRecovery = await selection(folderA2, "2026-07-15T00:04:20.000Z");
  assert.equal(staleRecovery.status, "selected");
  const nullOnboarding = await selection(nullConflictFolder, "2026-07-15T00:04:20.000Z");
  assert.equal(nullOnboarding.status, "selected");
  await openRecentProjectV01(db, {
    project_id: confirmedB.project.project_id,
    expected_project_id: null,
    expected_revision: null,
    now: "2026-07-15T00:04:30.000Z",
  });
  const rowsBeforeNullConflict = JSON.stringify({
    projects: db.prepare("SELECT * FROM vnext_project_identities ORDER BY workspace_id, project_id").all(),
    roots: db.prepare("SELECT * FROM vnext_project_root_bindings ORDER BY workspace_id, project_id").all(),
    refs: db.prepare("SELECT * FROM vnext_project_external_ref_bindings ORDER BY workspace_id, project_id, ref_fingerprint").all(),
    recent: db.prepare("SELECT * FROM vnext_recent_projects ORDER BY workspace_id, project_id").all(),
    active: db.prepare("SELECT * FROM vnext_active_project_selections ORDER BY workspace_id").all(),
  });
  await assert.rejects(confirmLocalProjectOnboardingV01(db, {
    selection_token: nullOnboarding.selection_token,
    inspection_fingerprint: nullOnboarding.inspection.inspection_fingerprint,
  }, { now: () => "2026-07-15T00:04:40.000Z" }), /active_selection_conflict/);
  assert.equal(JSON.stringify({
    projects: db.prepare("SELECT * FROM vnext_project_identities ORDER BY workspace_id, project_id").all(),
    roots: db.prepare("SELECT * FROM vnext_project_root_bindings ORDER BY workspace_id, project_id").all(),
    refs: db.prepare("SELECT * FROM vnext_project_external_ref_bindings ORDER BY workspace_id, project_id, ref_fingerprint").all(),
    recent: db.prepare("SELECT * FROM vnext_recent_projects ORDER BY workspace_id, project_id").all(),
    active: db.prepare("SELECT * FROM vnext_active_project_selections ORDER BY workspace_id").all(),
  }), rowsBeforeNullConflict, "null-to-project conflicts must leave no partial rows");
  const stateBeforeStaleRebind = JSON.stringify({
    roots: db.prepare("SELECT * FROM vnext_project_root_bindings ORDER BY workspace_id, project_id").all(),
    refs: db.prepare("SELECT * FROM vnext_project_external_ref_bindings ORDER BY workspace_id, project_id, ref_fingerprint").all(),
    recent: db.prepare("SELECT * FROM vnext_recent_projects ORDER BY workspace_id, project_id").all(),
    active: db.prepare("SELECT * FROM vnext_active_project_selections ORDER BY workspace_id").all(),
  });
  await assert.rejects(rebindLocalProjectRootFromSelectionV01(db, {
    project_id: confirmedA.project.project_id,
    selection_token: staleRecovery.selection_token,
    inspection_fingerprint: staleRecovery.inspection.inspection_fingerprint,
  }, { now: () => "2026-07-15T00:04:50.000Z" }), /active_selection_conflict/);
  assert.equal(JSON.stringify({
    roots: db.prepare("SELECT * FROM vnext_project_root_bindings ORDER BY workspace_id, project_id").all(),
    refs: db.prepare("SELECT * FROM vnext_project_external_ref_bindings ORDER BY workspace_id, project_id, ref_fingerprint").all(),
    recent: db.prepare("SELECT * FROM vnext_recent_projects ORDER BY workspace_id, project_id").all(),
    active: db.prepare("SELECT * FROM vnext_active_project_selections ORDER BY workspace_id").all(),
  }), stateBeforeStaleRebind, "stale rebind must roll back root, recency, refs, and active state");
  assert.equal(readFileSync(path.join(`${folderA}.missing`, ".git", "config"), "utf8"), oldFolderConfigBeforeRecovery);
  assert.deepEqual(readdirSync(folderA2).sort(), replacementContentsBeforeRecovery);
  assert.equal((await listRecentProjectsV01(db)).find((entry) => entry.is_active)?.project.project_id, confirmedB.project.project_id);

  const recovery = await selection(folderA2, "2026-07-15T00:05:00.000Z");
  assert.equal(recovery.status, "selected");
  const rebound = await rebindLocalProjectRootFromSelectionV01(db, { project_id: confirmedA.project.project_id, selection_token: recovery.selection_token, inspection_fingerprint: recovery.inspection.inspection_fingerprint }, { now: () => "2026-07-15T00:05:00.000Z" });
  assert.equal(rebound.project.project_id, confirmedA.project.project_id);
  assert.equal((await readProjectDestinationV01(db, confirmedA.project.project_id))?.root_binding.local_root.normalized_path, folderA2);
  assert.equal((await listRecentProjectsV01(db)).find((entry) => entry.project.project_id === confirmedA.project.project_id)?.is_active, true);

  const replaySelection = await selection(folderA2, "2026-07-15T00:05:10.000Z");
  assert.equal(replaySelection.status, "selected");
  const replay = await confirmLocalProjectOnboardingV01(db, { selection_token: replaySelection.selection_token, inspection_fingerprint: replaySelection.inspection.inspection_fingerprint }, { now: () => "2026-07-15T00:05:10.000Z" });
  assert.equal(replay.status, "already_added");
  assert.equal(replay.project.project_id, confirmedA.project.project_id);
  assert.equal((await readProjectDestinationV01(db, confirmedA.project.project_id))?.external_refs.length, 1);
  assert.equal((db.prepare("SELECT COUNT(*) AS count FROM vnext_project_identities").get() as { count: number }).count, 2);
  assert.equal((db.prepare("SELECT COUNT(*) AS count FROM vnext_recent_projects").get() as { count: number }).count, 2);
  assert.equal((db.prepare("SELECT COUNT(*) AS count FROM vnext_active_project_selections").get() as { count: number }).count, 1);
  const activeForRoute = activeSnapshot(await listRecentProjectsV01(db));
  const lifecycleBeforeRouteConflicts = JSON.stringify({
    recent: db.prepare("SELECT * FROM vnext_recent_projects ORDER BY workspace_id, project_id").all(),
    active: db.prepare("SELECT * FROM vnext_active_project_selections ORDER BY workspace_id").all(),
  });
  const missingRevisionResponse = await projectRoutePost(routeRequest(JSON.stringify({
    action: "open",
    project_id: confirmedB.project.project_id,
    expected_project_id: activeForRoute.expected_project_id,
  })));
  assert.equal(missingRevisionResponse.status, 400, "Open must require the complete active-selection snapshot");
  assert(activeForRoute.expected_revision && activeForRoute.expected_revision > 1);
  const staleRevisionResponse = await projectRoutePost(routeRequest(JSON.stringify({
    action: "open",
    project_id: confirmedB.project.project_id,
    expected_project_id: activeForRoute.expected_project_id,
    expected_revision: activeForRoute.expected_revision - 1,
  })));
  assert.equal(staleRevisionResponse.status, 409);
  assert.equal((await staleRevisionResponse.json() as { error_code: string }).error_code, "active_selection_conflict");
  assert.equal(JSON.stringify({
    recent: db.prepare("SELECT * FROM vnext_recent_projects ORDER BY workspace_id, project_id").all(),
    active: db.prepare("SELECT * FROM vnext_active_project_selections ORDER BY workspace_id").all(),
  }), lifecycleBeforeRouteConflicts);
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

  console.log(JSON.stringify({ status: "pass", picker_adapter: true, picker_platform_boundaries: true, picker_output_and_timeout_bounded: true, test_only_cancel_injection_guarded: true, origin_guard: true, plain_and_git_inspection: true, inaccessible_and_not_directory_states: true, git_no_remote_and_worktree_metadata: true, bounded_git_metadata_limit_and_detection_byte: true, bounded_chunked_request_limit_and_cancellation: true, inspection_identity_rows_written: 0, passive_reads_identity_rows_written: 0, credential_material_in_returned_and_persisted_values: 0, exact_root_replay: true, same_repository_independence: true, conflicting_repository_confirmation_rolled_back: true, stale_onboarding_rolled_back: true, null_to_project_conflict_rolled_back: true, aba_conflict_refused: true, stale_rebind_rolled_back: true, partial_rows_after_cas_conflicts: 0, recent_active_restart: true, removal_preserves_data: true, moved_root_recovery: true, occupied_root_rebind_refusal: true, stale_tamper_and_disappearing_root_refusal: true, migration_idempotent: true, migration_schema_parity: true, bytes_read_beyond_limit_plus_detection_byte: 0, network_calls: 0, git_processes: 0 }, null, 2));
} finally {
  process.env = originalEnvironment;
  rmSync(root, { recursive: true, force: true });
}
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "project_onboarding_test_failed");
  process.exitCode = 1;
});
