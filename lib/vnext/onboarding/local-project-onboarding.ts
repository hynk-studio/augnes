import { execFile } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { constants } from "node:fs";
import { access, open as openFile, stat } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

import type Database from "better-sqlite3";

import { openDatabase } from "@/lib/db";
import {
  attachProjectExternalRefV01,
  findCanonicalProjectByLocalRootV01,
  getOrCreateCanonicalProjectForLocalRootV01,
  getOrCreateDefaultWorkspaceIdentityV01,
  listProjectExternalRefsV01,
  normalizeLocalProjectRootRefV01,
  readDefaultWorkspaceIdentityV01,
  readCanonicalProjectWithRootV01,
  rebindCanonicalProjectLocalRootV01,
} from "@/lib/vnext/persistence/project-identity-registry";
import {
  ensureVNextProjectLifecycleSchemaV01,
  listRecentProjectRowsV01,
  readActiveProjectSelectionV01,
  removeRecentProjectV01,
  selectActiveProjectV01,
  touchRecentProjectV01,
} from "@/lib/vnext/persistence/project-lifecycle-registry";
import { EXTERNAL_REF_VERSION_V01, type ExternalRefV01 } from "@/types/vnext/external-ref";
import {
  LOCAL_PROJECT_INSPECTION_VERSION_V01,
  RECENT_PROJECT_ENTRY_VERSION_V01,
  type LocalFolderPickerOutcomeV01,
  type LocalProjectInspectionV01,
  type ProjectOnboardingConfirmationV01,
  type ProjectOnboardingErrorCodeV01,
  type ProjectRootRebindResultV01,
  type ProjectRootAvailabilityV01,
  type RecentProjectEntryV01,
} from "@/types/vnext/project-onboarding";

const execFileAsync = promisify(execFile);
const MAX_PICKER_OUTPUT = 16 * 1024;
const MAX_GIT_CONFIG_BYTES = 64 * 1024;
const SELECTION_TTL_MS = 10 * 60 * 1000;
const MAX_PENDING_SELECTIONS = 64;
const SYSTEM_LOCAL_PROJECT_FILESYSTEM = { stat, access };

export interface LocalProjectMetadataFileHandleV01 {
  read(buffer: Buffer, offset: number, length: number, position: number | null): Promise<{ bytesRead: number }>;
  close(): Promise<void>;
}

export interface LocalProjectMetadataFileReaderV01 {
  open(file: string): Promise<LocalProjectMetadataFileHandleV01>;
}

const SYSTEM_LOCAL_PROJECT_METADATA_READER: LocalProjectMetadataFileReaderV01 = {
  async open(file) {
    const handle = await openFile(file, "r");
    return {
      async read(buffer, offset, length, position) {
        const result = await handle.read(buffer, offset, length, position);
        return { bytesRead: result.bytesRead };
      },
      async close() { await handle.close(); },
    };
  },
};

export class ProjectOnboardingErrorV01 extends Error {
  constructor(readonly code: ProjectOnboardingErrorCodeV01, readonly status = 400) {
    super(code);
    this.name = "ProjectOnboardingErrorV01";
  }
}

export interface FolderPickerProcessV01 {
  run(command: string, args: readonly string[], timeoutMs: number): Promise<{ stdout: string }>;
}

const SYSTEM_PICKER_PROCESS: FolderPickerProcessV01 = {
  async run(command, args, timeoutMs) {
    const result = await execFileAsync(command, [...args], {
      timeout: timeoutMs,
      killSignal: "SIGKILL",
      maxBuffer: MAX_PICKER_OUTPUT,
      encoding: "utf8",
      windowsHide: true,
    });
    return { stdout: result.stdout };
  },
};

export async function chooseLocalProjectFolderV01(options: {
  platform?: NodeJS.Platform;
  process?: FolderPickerProcessV01;
  timeout_ms?: number;
  environment?: NodeJS.ProcessEnv;
} = {}): Promise<{ status: "selected"; absolute_path: string } | Exclude<LocalFolderPickerOutcomeV01, { status: "selected" }>> {
  const environment = options.environment ?? process.env;
  const injected = environment.AUGNES_TEST_FOLDER_PICKER_PATH;
  const canonicalTempRoot = environment.AUGNES_CANONICAL_TEMP_ROOT;
  const canonicalTestRoot = environment.AUGNES_CANONICAL_TEST_MODE === "1" && canonicalTempRoot
    ? canonicalTempRoot
    : null;
  if (canonicalTestRoot && environment.AUGNES_TEST_FOLDER_PICKER_OUTCOME === "cancelled") {
    return { status: "cancelled" };
  }
  if (injected && canonicalTestRoot) {
    const root = path.resolve(canonicalTestRoot);
    const selected = path.resolve(injected);
    const relative = path.relative(root, selected);
    if (path.isAbsolute(injected) && relative !== ".." && !relative.startsWith(`..${path.sep}`)) {
      return { status: "selected", absolute_path: selected };
    }
  }
  const platform = options.platform ?? process.platform;
  const runner = options.process ?? SYSTEM_PICKER_PROCESS;
  const timeout = options.timeout_ms ?? 120_000;
  const commands = platform === "darwin"
    ? [["/usr/bin/osascript", ["-e", "POSIX path of (choose folder with prompt \"Choose an Augnes project folder\")"]]] as const
    : platform === "win32"
      ? [["powershell.exe", ["-NoProfile", "-NonInteractive", "-STA", "-Command", "Add-Type -AssemblyName System.Windows.Forms; $d=New-Object System.Windows.Forms.FolderBrowserDialog; if($d.ShowDialog() -eq 'OK'){[Console]::Out.Write($d.SelectedPath)}else{exit 2}"]]] as const
      : platform === "linux"
        ? [["zenity", ["--file-selection", "--directory", "--title=Choose an Augnes project folder"]], ["kdialog", ["--getexistingdirectory", ".", "--title", "Choose an Augnes project folder"]]] as const
        : [];
  if (commands.length === 0) return { status: "unavailable", reason: "unsupported_platform" };
  for (const [command, args] of commands) {
    try {
      const result = await runner.run(command, args, timeout);
      const selected = result.stdout.trim();
      if (!selected) return { status: "cancelled" };
      if (!path.isAbsolute(selected)) return { status: "error", error_code: "picker_failed" };
      return { status: "selected", absolute_path: path.resolve(selected) };
    } catch (error) {
      const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
      if (code === "ENOENT") continue;
      const killedOnTimeout = Boolean(
        typeof error === "object" && error && "killed" in error && error.killed === true &&
        "signal" in error && error.signal === "SIGKILL",
      );
      if (code === "ETIMEDOUT" || killedOnTimeout || code === "ERR_CHILD_PROCESS_STDIO_MAXBUFFER") {
        return { status: "error", error_code: code === "ERR_CHILD_PROCESS_STDIO_MAXBUFFER" ? "picker_failed" : "picker_timeout" };
      }
      const exitCode = typeof error === "object" && error && "code" in error ? Number(error.code) : NaN;
      if (exitCode === 1 || exitCode === 2) return { status: "cancelled" };
      return { status: "error", error_code: "picker_failed" };
    }
  }
  return { status: "unavailable", reason: "picker_not_installed" };
}

export async function inspectLocalProjectRootV01(absolutePath: string, options: {
  now?: () => string;
  db?: Database.Database;
  workspace_id?: string;
  filesystem?: Partial<typeof SYSTEM_LOCAL_PROJECT_FILESYSTEM>;
  metadata_reader?: LocalProjectMetadataFileReaderV01;
} = {}): Promise<LocalProjectInspectionV01> {
  if (!path.isAbsolute(absolutePath)) throw new ProjectOnboardingErrorV01("selection_invalid");
  const localRoot = normalizeLocalProjectRootRefV01(absolutePath, { base_path: path.parse(absolutePath).root });
  const filesystem = { ...SYSTEM_LOCAL_PROJECT_FILESYSTEM, ...options.filesystem };
  let info;
  try { info = await filesystem.stat(localRoot.normalized_path); }
  catch (error) {
    if (isFsCode(error, "ENOENT")) throw new ProjectOnboardingErrorV01("selection_missing", 404);
    if (isFsCode(error, "EACCES") || isFsCode(error, "EPERM")) throw new ProjectOnboardingErrorV01("selection_inaccessible", 403);
    throw new ProjectOnboardingErrorV01("inspection_failed", 422);
  }
  if (!info.isDirectory()) throw new ProjectOnboardingErrorV01("selection_not_directory", 422);
  try { await filesystem.access(localRoot.normalized_path, constants.R_OK | constants.X_OK); }
  catch { throw new ProjectOnboardingErrorV01("selection_inaccessible", 403); }

  const inspectedAt = (options.now ?? (() => new Date().toISOString()))();
  let git;
  try {
    git = await inspectGitMetadata(
      localRoot.normalized_path,
      options.metadata_reader ?? SYSTEM_LOCAL_PROJECT_METADATA_READER,
    );
  } catch {
    throw new ProjectOnboardingErrorV01("inspection_failed", 422);
  }
  const displayName = path.basename(localRoot.normalized_path) || localRoot.normalized_path;
  const fingerprintPayload = JSON.stringify({
    root: localRoot,
    displayName,
    repository: { is_repository: git.isRepository, display: git.display },
  });
  const alreadyAdded = Boolean(options.db && options.workspace_id && findCanonicalProjectByLocalRootV01(options.db, {
    workspace_id: options.workspace_id, local_root: localRoot,
  }));
  return {
    inspection_version: LOCAL_PROJECT_INSPECTION_VERSION_V01,
    display_name: displayName,
    local_root: localRoot,
    folder_kind: git.isRepository ? "git_repository" : "plain_folder",
    repository_ref: git.ref,
    repository_display: git.display,
    repository_status: !git.isRepository ? "not_repository" : git.ref ? "configured" : "no_remote",
    inspected_at: inspectedAt,
    inspection_fingerprint: `sha256:${createHash("sha256").update(fingerprintPayload).digest("hex")}`,
    already_added: alreadyAdded,
  };
}

type SelectionRecord = {
  absolute_path: string;
  fingerprint: string;
  expires_at: number;
  expected_active_project_id: string | null;
  expected_active_revision: number | null;
};
const selections = new Map<string, SelectionRecord>();

export async function pickAndInspectLocalProjectV01(options: Parameters<typeof chooseLocalProjectFolderV01>[0] & {
  open_database?: () => Database.Database;
  now?: () => string;
  now_ms?: () => number;
  create_token?: () => string;
  metadata_reader?: LocalProjectMetadataFileReaderV01;
} = {}): Promise<LocalFolderPickerOutcomeV01> {
  const picked = await chooseLocalProjectFolderV01(options);
  if (picked.status !== "selected") return picked;
  const db = (options.open_database ?? openDatabase)();
  try {
    const workspace = readDefaultWorkspaceIdentityV01(db);
    const inspection = await inspectLocalProjectRootV01(picked.absolute_path, {
      now: options.now,
      metadata_reader: options.metadata_reader,
      ...(workspace ? { db, workspace_id: workspace.workspace_id } : {}),
    });
    const active = workspace
      ? readActiveProjectSelectionV01(db, workspace.workspace_id)
      : null;
    const nowMs = (options.now_ms ?? Date.now)();
    for (const [token, record] of selections) {
      if (record.expires_at < nowMs) selections.delete(token);
    }
    if (selections.size >= MAX_PENDING_SELECTIONS) {
      selections.delete(selections.keys().next().value as string);
    }
    const token = (options.create_token ?? randomUUID)();
    selections.set(token, {
      absolute_path: picked.absolute_path,
      fingerprint: inspection.inspection_fingerprint,
      expires_at: nowMs + SELECTION_TTL_MS,
      expected_active_project_id: active?.project_id ?? null,
      expected_active_revision: active?.selection_revision ?? null,
    });
    return { status: "selected", selection_token: token, inspection };
  } finally { db.close(); }
}

export async function confirmLocalProjectOnboardingV01(db: Database.Database, input: {
  selection_token: string; inspection_fingerprint: string;
}, options: { now?: () => string; now_ms?: () => number; create_uuid?: () => string } = {}): Promise<ProjectOnboardingConfirmationV01> {
  const record = consumeSelection(input.selection_token, options.now_ms);
  if (record.fingerprint !== input.inspection_fingerprint) throw new ProjectOnboardingErrorV01("selection_tampered", 409);
  const workspace = getOrCreateDefaultWorkspaceIdentityV01(db, {
    now: options.now,
    create_uuid: options.create_uuid,
  });
  const inspection = await inspectLocalProjectRootV01(record.absolute_path, { now: options.now, db, workspace_id: workspace.workspace_id });
  if (inspection.inspection_fingerprint !== record.fingerprint) throw new ProjectOnboardingErrorV01("inspection_stale", 409);
  const now = (options.now ?? (() => new Date().toISOString()))();
  return db.transaction(() => {
    ensureVNextProjectLifecycleSchemaV01(db);
    const registration = getOrCreateCanonicalProjectForLocalRootV01(db, {
      workspace_id: workspace.workspace_id,
      local_root: inspection.local_root,
      ...(inspection.already_added ? {} : { display_name: inspection.display_name }),
    }, { now: options.now, create_uuid: options.create_uuid });
    const existingRepositoryRefs = listProjectExternalRefsV01(db, {
      workspace_id: workspace.workspace_id,
      project_id: registration.project.project_id,
    }).filter((binding) => binding.external_ref.ref_type === "repository_remote");
    if (inspection.repository_ref && existingRepositoryRefs.some(
      (binding) => binding.external_ref.external_id !== inspection.repository_ref!.external_id,
    )) {
      throw new ProjectOnboardingErrorV01("project_external_ref_conflict", 409);
    }
    if (inspection.repository_ref) attachProjectExternalRefV01(db, {
      workspace_id: workspace.workspace_id, project_id: registration.project.project_id,
      external_ref: inspection.repository_ref,
    }, { now: () => now });
    touchRecentProjectV01(db, { workspace_id: workspace.workspace_id, project_id: registration.project.project_id, now });
    selectActiveProjectV01(db, {
      workspace_id: workspace.workspace_id,
      project_id: registration.project.project_id,
      now,
      expected_project_id: record.expected_active_project_id,
      expected_revision: record.expected_active_revision,
    });
    const status: ProjectOnboardingConfirmationV01["status"] =
      registration.status === "inserted" ? "created" : "already_added";
    return {
      status,
      project: registration.project,
      destination: projectDestination(registration.project.project_id),
    };
  }).immediate();
}

export async function rebindLocalProjectRootFromSelectionV01(db: Database.Database, input: {
  project_id: string; selection_token: string; inspection_fingerprint: string;
}, options: { now?: () => string; now_ms?: () => number } = {}): Promise<ProjectRootRebindResultV01> {
  const record = consumeSelection(input.selection_token, options.now_ms);
  if (record.fingerprint !== input.inspection_fingerprint) throw new ProjectOnboardingErrorV01("selection_tampered", 409);
  const workspace = readDefaultWorkspaceIdentityV01(db);
  if (!workspace) throw new ProjectOnboardingErrorV01("project_scope_conflict", 404);
  const project = readCanonicalProjectWithRootV01(db, { workspace_id: workspace.workspace_id, project_id: input.project_id });
  if (!project) throw new ProjectOnboardingErrorV01("project_scope_conflict", 404);
  const inspection = await inspectLocalProjectRootV01(record.absolute_path, { now: options.now, db, workspace_id: workspace.workspace_id });
  if (inspection.inspection_fingerprint !== record.fingerprint) throw new ProjectOnboardingErrorV01("inspection_stale", 409);
  const now = (options.now ?? (() => new Date().toISOString()))();
  return db.transaction(() => {
    rebindCanonicalProjectLocalRootV01(db, { workspace_id: workspace.workspace_id, project_id: input.project_id, local_root: inspection.local_root }, { now: () => now });
    touchRecentProjectV01(db, { workspace_id: workspace.workspace_id, project_id: input.project_id, now });
    selectActiveProjectV01(db, {
      workspace_id: workspace.workspace_id,
      project_id: input.project_id,
      now,
      expected_project_id: record.expected_active_project_id,
      expected_revision: record.expected_active_revision,
    });
    return { status: "rebound" as const, project: project.project, local_root: inspection.local_root, destination: projectDestination(input.project_id) };
  }).immediate();
}

export async function listRecentProjectsV01(db: Database.Database): Promise<RecentProjectEntryV01[]> {
  const workspace = readDefaultWorkspaceIdentityV01(db);
  if (!workspace) return [];
  const active = readActiveProjectSelectionV01(db, workspace.workspace_id);
  const rows = listRecentProjectRowsV01(db, workspace.workspace_id);
  return Promise.all(rows.map(async (row) => {
    const registration = readCanonicalProjectWithRootV01(db, row)!;
    return {
      recent_project_entry_version: RECENT_PROJECT_ENTRY_VERSION_V01,
      project: registration.project,
      local_root: registration.root_binding.local_root,
      root_availability: await readRootAvailabilityV01(registration.root_binding.local_root.normalized_path),
      created_at: row.created_at,
      last_opened_at: row.last_opened_at,
      is_active: active?.project_id === row.project_id,
      active_project_id: active?.project_id ?? null,
      active_selection_revision: active?.selection_revision ?? null,
    };
  }));
}

export async function readRootAvailabilityV01(root: string): Promise<ProjectRootAvailabilityV01> {
  try {
    const value = await stat(root);
    if (!value.isDirectory()) return "not_directory";
    await access(root, constants.R_OK | constants.X_OK);
    return "available";
  } catch (error) {
    if (isFsCode(error, "ENOENT")) return "missing";
    if (isFsCode(error, "EACCES") || isFsCode(error, "EPERM")) return "inaccessible";
    return "inspection_error";
  }
}

export async function openRecentProjectV01(db: Database.Database, input: {
  project_id: string; expected_project_id: string | null; expected_revision: number | null; now?: string;
}) {
  const workspace = readDefaultWorkspaceIdentityV01(db);
  if (!workspace) throw new ProjectOnboardingErrorV01("project_scope_conflict", 404);
  const registration = readCanonicalProjectWithRootV01(db, { workspace_id: workspace.workspace_id, project_id: input.project_id });
  if (!registration) throw new ProjectOnboardingErrorV01("project_scope_conflict", 404);
  if (await readRootAvailabilityV01(registration.root_binding.local_root.normalized_path) !== "available") {
    throw new ProjectOnboardingErrorV01("project_root_unavailable", 409);
  }
  const now = input.now ?? new Date().toISOString();
  return db.transaction(() => {
    touchRecentProjectV01(db, { workspace_id: workspace.workspace_id, project_id: input.project_id, now });
    const selection = selectActiveProjectV01(db, {
      workspace_id: workspace.workspace_id,
      project_id: input.project_id,
      now,
      expected_project_id: input.expected_project_id,
      expected_revision: input.expected_revision,
    });
    return { project: registration.project, selection, destination: projectDestination(input.project_id) };
  }).immediate();
}

export function removeProjectFromRecentV01(db: Database.Database, input: {
  project_id: string;
  expected_project_id: string | null;
  expected_revision: number | null;
}) {
  const workspace = readDefaultWorkspaceIdentityV01(db);
  if (!workspace) return { removed: false, project_data_preserved: true as const };
  const removed = removeRecentProjectV01(db, {
    workspace_id: workspace.workspace_id,
    project_id: input.project_id,
    expected_project_id: input.expected_project_id,
    expected_revision: input.expected_revision,
  });
  return { removed, project_data_preserved: true as const };
}

export async function readProjectDestinationV01(db: Database.Database, projectId: string) {
  const workspace = readDefaultWorkspaceIdentityV01(db);
  if (!workspace) return null;
  const registration = readCanonicalProjectWithRootV01(db, { workspace_id: workspace.workspace_id, project_id: projectId });
  if (!registration) return null;
  return {
    ...registration,
    external_refs: listProjectExternalRefsV01(db, { workspace_id: workspace.workspace_id, project_id: projectId }),
    active_selection: readActiveProjectSelectionV01(db, workspace.workspace_id),
    root_availability: await readRootAvailabilityV01(registration.root_binding.local_root.normalized_path),
  };
}

function consumeSelection(token: string, nowMs: (() => number) | undefined): SelectionRecord {
  const record = selections.get(token);
  selections.delete(token);
  if (!record || record.expires_at < (nowMs ?? Date.now)()) throw new ProjectOnboardingErrorV01("inspection_stale", 409);
  return record;
}

class GitMetadataTooLargeError extends Error {}

async function inspectGitMetadata(
  root: string,
  metadataReader: LocalProjectMetadataFileReaderV01,
): Promise<{ isRepository: boolean; ref: ExternalRefV01 | null; display: string | null }> {
  let gitPath = path.join(root, ".git");
  let gitInfo;
  try { gitInfo = await stat(gitPath); } catch { return { isRepository: false, ref: null, display: null }; }
  if (gitInfo.isFile()) {
    const pointer = await readBounded(gitPath, metadataReader);
    const match = /^gitdir:\s*(.+)\s*$/im.exec(pointer);
    if (!match) return { isRepository: true, ref: null, display: null };
    gitPath = path.resolve(root, match[1]);
  }
  let configPath = path.join(gitPath, "config");
  try {
    const common = (await readBounded(path.join(gitPath, "commondir"), metadataReader)).trim();
    if (common) configPath = path.join(path.resolve(gitPath, common), "config");
  } catch (error) {
    if (error instanceof GitMetadataTooLargeError) throw error;
  }
  let config = "";
  try { config = await readBounded(configPath, metadataReader); }
  catch (error) {
    if (error instanceof GitMetadataTooLargeError) throw error;
    return { isRepository: true, ref: null, display: null };
  }
  const remote = readOriginRemote(config);
  if (!remote) return { isRepository: true, ref: null, display: null };
  const sanitized = sanitizeRemote(remote);
  if (!sanitized) return { isRepository: true, ref: null, display: null };
  const host = remoteHost(sanitized);
  return {
    isRepository: true,
    display: sanitized,
    ref: {
      ref_version: EXTERNAL_REF_VERSION_V01,
      ref_type: "repository_remote",
      external_id: sanitized,
      provider: null,
      host,
      observed_at: null,
      source_ref: null,
      compatibility_namespace: null,
      trust_class: "direct_local_observation",
    },
  };
}

async function readBounded(file: string, metadataReader: LocalProjectMetadataFileReaderV01): Promise<string> {
  const handle = await metadataReader.open(file);
  const data = Buffer.alloc(MAX_GIT_CONFIG_BYTES + 1);
  let total = 0;
  try {
    while (total < data.byteLength) {
      const { bytesRead } = await handle.read(data, total, data.byteLength - total, null);
      if (bytesRead === 0) break;
      total += bytesRead;
    }
    if (total > MAX_GIT_CONFIG_BYTES) throw new GitMetadataTooLargeError();
    return data.subarray(0, total).toString("utf8");
  } finally {
    await handle.close();
  }
}

function readOriginRemote(config: string): string | null {
  const sections = config.split(/^\s*\[/m);
  const origin = sections.find((section) => /^remote\s+"origin"\]/i.test(section));
  return /^\s*url\s*=\s*(.+?)\s*$/im.exec(origin ?? "")?.[1] ?? null;
}

export function sanitizeRepositoryRemoteV01(value: string): string | null { return sanitizeRemote(value); }
function sanitizeRemote(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed.includes("\0") || /[\r\n]/.test(trimmed)) return null;
  try {
    const url = new URL(trimmed);
    if (!["https:", "http:", "ssh:", "git:"].includes(url.protocol)) return null;
    url.username = "";
    url.password = "";
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    const canonicalCandidate = trimmed.replace(/[?#].*$/, "");
    const scp = /^(?:[^@\s/:]+@)?([^\s/:]+):(.+)$/.exec(canonicalCandidate);
    return scp ? `${scp[1]}:${scp[2]}` : null;
  }
}
function remoteHost(value: string): string | null {
  try { return new URL(value).hostname || null; } catch { return /^([^:]+):/.exec(value)?.[1] ?? null; }
}
function isFsCode(error: unknown, code: string): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === code);
}
function projectDestination(projectId: string): string { return `/projects/${encodeURIComponent(projectId)}`; }
