import { execFile } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import {
  constants,
  existsSync,
  lstatSync,
  readFileSync,
  realpathSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
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
  renameCanonicalProjectDisplayNameV01,
  normalizeProjectDisplayNameV01,
} from "@/lib/vnext/persistence/project-identity-registry";
import {
  ensureVNextProjectLifecycleSchemaV01,
  listRecentProjectRowsV01,
  readActiveProjectSelectionV01,
  removeRecentProjectV01,
  selectActiveProjectV01,
  touchRecentProjectV01,
} from "@/lib/vnext/persistence/project-lifecycle-registry";
import {
  insertPhysicalRootBaselineIfAbsentInsideTransactionV01,
  listPhysicalRootBaselinesByIdentityV01,
} from "@/lib/vnext/persistence/repository-execution-store";
import { readPhysicalRootBaselineV01 } from "@/lib/vnext/persistence/repository-execution-store";
import {
  buildPhysicalRootBaselineV01,
  fingerprintProjectRootBindingV01,
  inspectPhysicalRootForExecutionV01,
  previewRepositoryExecutionRootRebindV01,
  readOpenRepositoryExecutionDecisionProjectionV01,
  rebindRepositoryExecutionRootV01,
  type RepositoryExecutionDependenciesV01,
} from "@/lib/vnext/repository-execution/repository-execution";
import { EXTERNAL_REF_VERSION_V01, type ExternalRefV01 } from "@/types/vnext/external-ref";
import {
  LOCAL_PROJECT_INSPECTION_VERSION_V01,
  RECENT_PROJECT_ENTRY_VERSION_V01,
  type LocalFolderPickerOutcomeV01,
  type LocalProjectInspectionV01,
  type LocalProjectSelectionOriginV01,
  type ProjectOnboardingConfirmationV01,
  type ProjectOnboardingErrorCodeV01,
  type ProjectRootRebindResultV01,
  type ProjectRootAvailabilityV01,
  type RecentProjectEntryV01,
} from "@/types/vnext/project-onboarding";
import type { PhysicalRootObservationV01 } from "@/types/vnext/repository-execution";

const execFileAsync = promisify(execFile);
const MAX_PICKER_OUTPUT = 16 * 1024;
const MAX_GIT_CONFIG_BYTES = 64 * 1024;
const SELECTION_TTL_MS = 10 * 60 * 1000;
const MAX_PENDING_SELECTIONS = 64;
const SYSTEM_LOCAL_PROJECT_FILESYSTEM = { stat, access };
const CANONICAL_PICKER_SEQUENCE_VERSION =
  "augnes_canonical_folder_picker_sequence.v0.1";
type CanonicalFolderPickerOutcomeV01 =
  | { status: "selected"; absolute_path: string }
  | Exclude<LocalFolderPickerOutcomeV01, { status: "selected" }>
  | { status: "pending_until_abort" };

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
  run(
    command: string,
    args: readonly string[],
    timeoutMs: number,
    signal?: AbortSignal,
  ): Promise<{ stdout: string }>;
}

const SYSTEM_PICKER_PROCESS: FolderPickerProcessV01 = {
  async run(command, args, timeoutMs, signal) {
    const result = await execFileAsync(command, [...args], {
      timeout: timeoutMs,
      killSignal: "SIGKILL",
      maxBuffer: MAX_PICKER_OUTPUT,
      encoding: "utf8",
      windowsHide: true,
      signal,
    });
    return { stdout: result.stdout };
  },
};

export async function chooseLocalProjectFolderV01(options: {
  platform?: NodeJS.Platform;
  process?: FolderPickerProcessV01;
  timeout_ms?: number;
  environment?: NodeJS.ProcessEnv;
  signal?: AbortSignal;
} = {}): Promise<{ status: "selected"; absolute_path: string } | Exclude<LocalFolderPickerOutcomeV01, { status: "selected" }>> {
  const environment = options.environment ?? process.env;
  const injected = environment.AUGNES_TEST_FOLDER_PICKER_PATH;
  const canonicalTempRoot = environment.AUGNES_CANONICAL_TEMP_ROOT;
  const canonicalTestRoot = environment.AUGNES_CANONICAL_TEST_MODE === "1" && canonicalTempRoot
    ? canonicalTempRoot
    : null;
  const sequencePath = environment.AUGNES_TEST_FOLDER_PICKER_SEQUENCE_PATH;
  if (canonicalTestRoot && sequencePath) {
    const canonical = consumeCanonicalFolderPickerSequence(
      sequencePath,
      canonicalTestRoot,
    );
    if (canonical.status !== "pending_until_abort") return canonical;
    return waitForCanonicalPickerAbortV01(
      options.signal,
      options.timeout_ms ?? 120_000,
    );
  }
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
    ? [["/usr/bin/osascript", ["-e", "POSIX path of (choose folder with prompt \"Open a local project folder\")"]]] as const
    : platform === "win32"
      ? [["powershell.exe", ["-NoProfile", "-NonInteractive", "-STA", "-Command", "Add-Type -AssemblyName System.Windows.Forms; $d=New-Object System.Windows.Forms.FolderBrowserDialog; if($d.ShowDialog() -eq 'OK'){[Console]::Out.Write($d.SelectedPath)}else{exit 2}"]]] as const
      : platform === "linux"
        ? [["zenity", ["--file-selection", "--directory", "--title=Open a local project folder"]], ["kdialog", ["--getexistingdirectory", ".", "--title", "Open a local project folder"]]] as const
        : [];
  if (commands.length === 0) return { status: "unavailable", reason: "unsupported_platform" };
  for (const [command, args] of commands) {
    try {
      const result = await runner.run(command, args, timeout, options.signal);
      const selected = result.stdout.trim();
      if (!selected) return { status: "cancelled" };
      if (!path.isAbsolute(selected)) return { status: "error", error_code: "picker_failed" };
      return { status: "selected", absolute_path: path.resolve(selected) };
    } catch (error) {
      const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
      if (code === "ABORT_ERR" || options.signal?.aborted) {
        return { status: "cancelled" };
      }
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

function consumeCanonicalFolderPickerSequence(
  configuredPath: string,
  configuredRoot: string,
): CanonicalFolderPickerOutcomeV01 {
  const sequencePath = path.resolve(configuredPath);
  const claimPath = `${sequencePath}.claim`;
  const nextPath = `${sequencePath}.next-${process.pid}`;
  try {
    const physicalRoot = realpathSync(configuredRoot);
    assertCanonicalOwnedRegularFile(sequencePath, physicalRoot);
    if (existsSync(claimPath) || existsSync(nextPath)) {
      throw new Error("sequence_claim_ambiguous");
    }
    renameSync(sequencePath, claimPath);
    try {
      const sequence = parseCanonicalFolderPickerSequence(
        readFileSync(claimPath, "utf8"),
        physicalRoot,
      );
      if (sequence.next_index >= sequence.entries.length) {
        throw new Error("sequence_exhausted");
      }
      const entry = sequence.entries[sequence.next_index];
      writeFileSync(
        nextPath,
        `${JSON.stringify({ ...sequence, next_index: sequence.next_index + 1 })}\n`,
        { encoding: "utf8", flag: "wx", mode: 0o600 },
      );
      renameSync(nextPath, sequencePath);
      unlinkSync(claimPath);
      return entry.outcome === "cancelled"
        ? { status: "cancelled" }
        : entry.outcome === "pending_until_abort"
          ? { status: "pending_until_abort" }
          : { status: "selected", absolute_path: entry.absolute_path };
    } catch (error) {
      if (existsSync(nextPath)) unlinkSync(nextPath);
      if (!existsSync(sequencePath) && existsSync(claimPath)) {
        renameSync(claimPath, sequencePath);
      }
      throw error;
    }
  } catch {
    return { status: "error", error_code: "picker_failed" };
  }
}

function parseCanonicalFolderPickerSequence(serialized: string, physicalRoot: string): {
  sequence_version: typeof CANONICAL_PICKER_SEQUENCE_VERSION;
  next_index: number;
  entries: Array<
    | { id: string; outcome: "cancelled" }
    | { id: string; outcome: "pending_until_abort" }
    | { id: string; outcome: "selected"; absolute_path: string }
  >;
} {
  const value = JSON.parse(serialized) as Record<string, unknown>;
  if (
    value?.sequence_version !== CANONICAL_PICKER_SEQUENCE_VERSION ||
    !Number.isSafeInteger(value.next_index) ||
    Number(value.next_index) < 0 ||
    !Array.isArray(value.entries) ||
    value.entries.length < 1 ||
    value.entries.length > 16
  ) {
    throw new Error("sequence_invalid");
  }
  const ids = new Set<string>();
  const entries = value.entries.map((candidate) => {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
      throw new Error("sequence_entry_invalid");
    }
    const entry = candidate as Record<string, unknown>;
    if (
      typeof entry.id !== "string" ||
      !/^[a-z0-9][a-z0-9_-]{0,63}$/u.test(entry.id) ||
      ids.has(entry.id)
    ) {
      throw new Error("sequence_entry_id_invalid");
    }
    ids.add(entry.id);
    if (entry.outcome === "cancelled" && Object.keys(entry).length === 2) {
      return { id: entry.id, outcome: "cancelled" as const };
    }
    if (
      entry.outcome === "pending_until_abort" &&
      Object.keys(entry).length === 2
    ) {
      return { id: entry.id, outcome: "pending_until_abort" as const };
    }
    if (
      entry.outcome !== "selected" ||
      typeof entry.absolute_path !== "string" ||
      Object.keys(entry).length !== 3
    ) {
      throw new Error("sequence_entry_invalid");
    }
    const selected = path.resolve(entry.absolute_path);
    if (!path.isAbsolute(entry.absolute_path)) throw new Error("sequence_path_invalid");
    const selectedEntry = lstatSync(selected);
    const physicalSelected = realpathSync(selected);
    if (
      selectedEntry.isSymbolicLink() ||
      !selectedEntry.isDirectory() ||
      !isPathInsideOrEqual(physicalRoot, physicalSelected)
    ) {
      throw new Error("sequence_path_invalid");
    }
    return {
      id: entry.id,
      outcome: "selected" as const,
      absolute_path: selected,
    };
  });
  return {
    sequence_version: CANONICAL_PICKER_SEQUENCE_VERSION,
    next_index: Number(value.next_index),
    entries,
  };
}

async function waitForCanonicalPickerAbortV01(
  signal: AbortSignal | undefined,
  timeoutMs: number,
): Promise<Exclude<LocalFolderPickerOutcomeV01, { status: "selected" }>> {
  if (signal?.aborted) return { status: "cancelled" };
  return new Promise((resolve) => {
    const finish = (outcome: Exclude<LocalFolderPickerOutcomeV01, { status: "selected" }>) => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      resolve(outcome);
    };
    const onAbort = () => finish({ status: "cancelled" });
    const timer = setTimeout(
      () => finish({ status: "error", error_code: "picker_timeout" }),
      timeoutMs,
    );
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function assertCanonicalOwnedRegularFile(file: string, physicalRoot: string): void {
  if (!path.isAbsolute(file)) throw new Error("sequence_path_invalid");
  const entry = lstatSync(file);
  const physicalFile = realpathSync(file);
  if (
    entry.isSymbolicLink() ||
    !entry.isFile() ||
    !isPathInsideOrEqual(physicalRoot, physicalFile)
  ) {
    throw new Error("sequence_path_invalid");
  }
}

function isPathInsideOrEqual(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate);
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== "..");
}

function readCanonicalProjectForPhysicalObservationV01(
  db: Database.Database,
  workspaceId: string,
  observation: Extract<PhysicalRootObservationV01, { status: "exact" }>,
) {
  const baselines = listPhysicalRootBaselinesByIdentityV01(db, {
    workspace_id: workspaceId,
    node_scope_fingerprint: observation.node_scope_fingerprint,
    identity_version: observation.identity.identity_version,
    filesystem_volume_identity: observation.platform === "win32"
      ? observation.identity.volume_serial_identity
      : observation.identity.device,
    filesystem_object_identity: observation.platform === "win32"
      ? observation.identity.file_id
      : observation.identity.inode,
  });
  if (baselines.length > 1) {
    throw new ProjectOnboardingErrorV01("inspection_failed", 409);
  }
  const baseline = baselines[0] ?? null;
  if (!baseline) return null;
  const registration = readCanonicalProjectWithRootV01(db, {
    workspace_id: workspaceId,
    project_id: baseline.project_id,
  });
  if (
    !registration ||
    fingerprintProjectRootBindingV01(registration.root_binding) !==
      baseline.root_binding_fingerprint
  ) {
    throw new ProjectOnboardingErrorV01("inspection_failed", 422);
  }
  return registration;
}

export async function inspectLocalProjectRootV01(absolutePath: string, options: {
  now?: () => string;
  db?: Database.Database;
  workspace_id?: string;
  filesystem?: Partial<typeof SYSTEM_LOCAL_PROJECT_FILESYSTEM>;
  metadata_reader?: LocalProjectMetadataFileReaderV01;
  repository_execution_dependencies?: RepositoryExecutionDependenciesV01;
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
  const physical = options.db
    ? await inspectPhysicalRootForExecutionV01(options.db, localRoot.normalized_path, {
        ...options.repository_execution_dependencies,
        now: () => inspectedAt,
      })
    : null;
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
    physical_identity_status: physical?.status ?? "identity_unavailable",
    physical_root_observation_fingerprint:
      physical?.status === "exact" ? physical.observation_fingerprint : null,
  });
  const lexicalRegistration = options.db && options.workspace_id
    ? findCanonicalProjectByLocalRootV01(options.db, {
      workspace_id: options.workspace_id,
      local_root: localRoot,
    })
    : null;
  const physicalRegistration =
    options.db && options.workspace_id && physical?.status === "exact"
      ? readCanonicalProjectForPhysicalObservationV01(
          options.db,
          options.workspace_id,
          physical,
        )
      : null;
  if (
    lexicalRegistration &&
    physicalRegistration &&
    lexicalRegistration.project.project_id !==
      physicalRegistration.project.project_id
  ) {
    throw new ProjectOnboardingErrorV01("inspection_failed", 409);
  }
  const existingRegistration = lexicalRegistration ?? physicalRegistration;
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
    physical_identity_status: physical?.status ?? "identity_unavailable",
    physical_root_observation_fingerprint:
      physical?.status === "exact" ? physical.observation_fingerprint : null,
    already_added: existingRegistration !== null,
    existing_project: existingRegistration?.project ?? null,
  };
}

type SelectionRecord = {
  selection_origin: LocalProjectSelectionOriginV01;
  absolute_path: string;
  normalized_path_fingerprint: string;
  inspection_fingerprint: string;
  physical_root_observation_fingerprint: string | null;
  expires_at: number;
  expected_workspace_id: string | null;
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
  repository_execution_dependencies?: RepositoryExecutionDependenciesV01;
} = {}): Promise<LocalFolderPickerOutcomeV01> {
  const picked = await chooseLocalProjectFolderV01(options);
  if (picked.status !== "selected") return picked;
  return prepareLocalProjectSelectionV01(
    "native_picker",
    picked.absolute_path,
    options,
  );
}

export async function declareAndInspectLocalProjectV01(
  absolutePath: string,
  options: {
    open_database?: () => Database.Database;
    now?: () => string;
    now_ms?: () => number;
    create_token?: () => string;
    metadata_reader?: LocalProjectMetadataFileReaderV01;
    repository_execution_dependencies?: RepositoryExecutionDependenciesV01;
  } = {},
): Promise<Extract<LocalFolderPickerOutcomeV01, { status: "selected" }>> {
  return prepareLocalProjectSelectionV01("declared_path", absolutePath, options);
}

async function prepareLocalProjectSelectionV01(
  selectionOrigin: LocalProjectSelectionOriginV01,
  absolutePath: string,
  options: {
    open_database?: () => Database.Database;
    now?: () => string;
    now_ms?: () => number;
    create_token?: () => string;
    metadata_reader?: LocalProjectMetadataFileReaderV01;
    repository_execution_dependencies?: RepositoryExecutionDependenciesV01;
  },
): Promise<Extract<LocalFolderPickerOutcomeV01, { status: "selected" }>> {
  const db = (options.open_database ?? openDatabase)();
  try {
    const workspace = readDefaultWorkspaceIdentityV01(db);
    const inspection = await inspectLocalProjectRootV01(absolutePath, {
      now: options.now,
      metadata_reader: options.metadata_reader,
      repository_execution_dependencies:
        options.repository_execution_dependencies,
      db,
      ...(workspace ? { workspace_id: workspace.workspace_id } : {}),
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
      selection_origin: selectionOrigin,
      absolute_path: absolutePath,
      normalized_path_fingerprint: `sha256:${createHash("sha256")
        .update(JSON.stringify(inspection.local_root))
        .digest("hex")}`,
      inspection_fingerprint: inspection.inspection_fingerprint,
      physical_root_observation_fingerprint:
        inspection.physical_root_observation_fingerprint,
      expires_at: nowMs + SELECTION_TTL_MS,
      expected_workspace_id: workspace?.workspace_id ?? null,
      expected_active_project_id: active?.project_id ?? null,
      expected_active_revision: active?.selection_revision ?? null,
    });
    return {
      status: "selected",
      selection_token: token,
      selection_origin: selectionOrigin,
      inspection,
    };
  } finally { db.close(); }
}

export function readPreparedLocalProjectSelectionBindingV01(
  selectionToken: string,
  options: { now_ms?: () => number } = {},
) {
  const record = selections.get(selectionToken);
  if (!record || record.expires_at < (options.now_ms ?? Date.now)()) {
    selections.delete(selectionToken);
    throw new ProjectOnboardingErrorV01("inspection_stale", 409);
  }
  return {
    selection_origin: record.selection_origin,
    normalized_path_fingerprint: record.normalized_path_fingerprint,
    inspection_fingerprint: record.inspection_fingerprint,
    physical_root_observation_fingerprint:
      record.physical_root_observation_fingerprint,
    expires_at: new Date(record.expires_at).toISOString(),
    expected_workspace_id: record.expected_workspace_id,
    expected_active_project_id: record.expected_active_project_id,
    expected_active_selection_revision: record.expected_active_revision,
  };
}

export function abandonPreparedLocalProjectSelectionV01(
  selectionToken: string,
): void {
  selections.delete(selectionToken);
}

export async function confirmLocalProjectOnboardingV01(db: Database.Database, input: {
  selection_token: string;
  inspection_fingerprint: string;
  display_name?: string;
  selection_origin?: LocalProjectSelectionOriginV01;
}, options: {
  now?: () => string;
  now_ms?: () => number;
  create_uuid?: () => string;
  before_baseline_insert_inside_transaction?: () => void;
  repository_execution_dependencies?: RepositoryExecutionDependenciesV01;
} = {}): Promise<ProjectOnboardingConfirmationV01> {
  const record = consumeSelection(input.selection_token, options.now_ms);
  if (record.selection_origin !== (input.selection_origin ?? "native_picker")) {
    throw new ProjectOnboardingErrorV01("selection_origin_mismatch", 409);
  }
  if (record.inspection_fingerprint !== input.inspection_fingerprint) throw new ProjectOnboardingErrorV01("selection_tampered", 409);
  const existingWorkspace = readDefaultWorkspaceIdentityV01(db);
  if (
    (existingWorkspace?.workspace_id ?? null) !== record.expected_workspace_id
  ) {
    throw new ProjectOnboardingErrorV01("project_scope_conflict", 409);
  }
  const inspection = await inspectLocalProjectRootV01(record.absolute_path, {
    now: options.now,
    repository_execution_dependencies:
      options.repository_execution_dependencies,
    db,
    ...(existingWorkspace
      ? { workspace_id: existingWorkspace.workspace_id }
      : {}),
  });
  if (
    inspection.inspection_fingerprint !== record.inspection_fingerprint ||
    inspection.physical_root_observation_fingerprint !==
      record.physical_root_observation_fingerprint
  ) throw new ProjectOnboardingErrorV01("inspection_stale", 409);
  if (inspection.physical_identity_status !== "exact") {
    throw new ProjectOnboardingErrorV01(
      inspection.physical_identity_status === "identity_unsupported"
        ? "physical_identity_unsupported"
        : inspection.physical_identity_status === "identity_ambiguous"
          ? "physical_identity_ambiguous"
          : "physical_identity_unavailable",
      409,
    );
  }
  const physical = await inspectPhysicalRootForExecutionV01(
    db,
    inspection.local_root.normalized_path,
    { ...options.repository_execution_dependencies, now: options.now },
  );
  if (
    physical.status !== "exact" ||
    physical.observation_fingerprint !== inspection.physical_root_observation_fingerprint
  ) {
    throw new ProjectOnboardingErrorV01("inspection_stale", 409);
  }
  const displayName = inspection.already_added
    ? undefined
    : normalizeProjectDisplayNameV01(
      input.display_name === undefined
        ? inspection.display_name
        : input.display_name,
    );
  const workspace = existingWorkspace ?? getOrCreateDefaultWorkspaceIdentityV01(db, {
    now: options.now,
    create_uuid: options.create_uuid,
  });
  const now = (options.now ?? (() => new Date().toISOString()))();
  return db.transaction(() => {
    ensureVNextProjectLifecycleSchemaV01(db);
    const physicalRegistration =
      readCanonicalProjectForPhysicalObservationV01(
          db,
          workspace.workspace_id,
          physical,
        );
    const lexicalRegistration = findCanonicalProjectByLocalRootV01(db, {
      workspace_id: workspace.workspace_id,
      local_root: inspection.local_root,
    });
    if (
      lexicalRegistration &&
      physicalRegistration &&
      lexicalRegistration.project.project_id !==
        physicalRegistration.project.project_id
    ) {
      throw new ProjectOnboardingErrorV01("inspection_failed", 409);
    }
    const registration = physicalRegistration
      ? { status: "exact_replay" as const, ...physicalRegistration }
      : getOrCreateCanonicalProjectForLocalRootV01(db, {
          workspace_id: workspace.workspace_id,
          local_root: inspection.local_root,
          ...(displayName === undefined ? {} : { display_name: displayName }),
        }, { now: options.now, create_uuid: options.create_uuid });
    if (registration.status === "inserted") {
      options.before_baseline_insert_inside_transaction?.();
      const insertion = insertPhysicalRootBaselineIfAbsentInsideTransactionV01(
        db,
        buildPhysicalRootBaselineV01({
          workspace_id: workspace.workspace_id,
          project_id: registration.project.project_id,
          root_binding: registration.root_binding,
          observation: physical,
          provenance: "canonical_new_project_onboarding",
        }),
      );
      if (insertion.status !== "inserted") {
        throw new ProjectOnboardingErrorV01("inspection_stale", 409);
      }
    }
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

export function renameActiveProjectDisplayNameV01(
  db: Database.Database,
  input: {
    project_id: string;
    expected_active_project_id: string;
    expected_active_selection_revision: number;
    expected_current_display_name: string | null;
    requested_display_name: string;
  },
) {
  const workspace = readDefaultWorkspaceIdentityV01(db);
  if (!workspace) {
    throw new ProjectOnboardingErrorV01("project_scope_conflict", 404);
  }
  return db.transaction(() => {
    const active = readActiveProjectSelectionV01(db, workspace.workspace_id);
    if (
      !active ||
      input.project_id !== input.expected_active_project_id ||
      active.project_id !== input.project_id ||
      active.project_id !== input.expected_active_project_id ||
      active.selection_revision !== input.expected_active_selection_revision
    ) {
      throw new ProjectOnboardingErrorV01("active_selection_conflict", 409);
    }
    return renameCanonicalProjectDisplayNameV01(db, {
      workspace_id: workspace.workspace_id,
      project_id: input.project_id,
      requested_display_name: input.requested_display_name,
      expected_current_display_name: input.expected_current_display_name,
    });
  }).immediate();
}

export async function previewLocalProjectRootRebindFromSelectionV01(
  db: Database.Database,
  input: {
    project_id: string;
    selection_token: string;
    inspection_fingerprint: string;
    expected_old_root_binding_fingerprint: string;
    expected_old_baseline_fingerprint: string | null;
  },
  options: { now?: () => string; now_ms?: () => number } = {},
) {
  const record = selections.get(input.selection_token);
  if (!record || record.expires_at < (options.now_ms ?? Date.now)()) {
    throw new ProjectOnboardingErrorV01("inspection_stale", 409);
  }
  if (record.inspection_fingerprint !== input.inspection_fingerprint) {
    throw new ProjectOnboardingErrorV01("selection_tampered", 409);
  }
  const workspace = readDefaultWorkspaceIdentityV01(db);
  if (!workspace) {
    throw new ProjectOnboardingErrorV01("project_scope_conflict", 404);
  }
  const inspection = await inspectLocalProjectRootV01(record.absolute_path, {
    now: options.now,
    db,
    workspace_id: workspace.workspace_id,
  });
  if (inspection.inspection_fingerprint !== record.inspection_fingerprint) {
    throw new ProjectOnboardingErrorV01("inspection_stale", 409);
  }
  const preview = await previewRepositoryExecutionRootRebindV01(db, {
    workspace_id: workspace.workspace_id,
    project_id: input.project_id,
    new_local_root: inspection.local_root,
  }, { now: options.now });
  if (
    preview.status !== "ready" ||
    !preview.decision_request ||
    preview.expected_old_root_binding_fingerprint !==
      input.expected_old_root_binding_fingerprint ||
    preview.expected_old_baseline_fingerprint !==
      input.expected_old_baseline_fingerprint ||
    preview.expected_new_observation_fingerprint !==
      inspection.physical_root_observation_fingerprint
  ) {
    throw new ProjectOnboardingErrorV01("inspection_stale", 409);
  }
  return preview;
}

export async function rebindLocalProjectRootFromSelectionV01(db: Database.Database, input: {
  project_id: string;
  selection_token: string;
  inspection_fingerprint: string;
  expected_old_root_binding_fingerprint: string;
  expected_old_baseline_fingerprint: string | null;
  decision_request_fingerprint: string;
}, options: {
  now?: () => string;
  now_ms?: () => number;
  decision_grant_fingerprint?: string;
  authorize_decision_inside_transaction?:
    RepositoryExecutionDependenciesV01["authorize_decision_inside_transaction"];
} = {}): Promise<ProjectRootRebindResultV01> {
  const record = consumeSelection(input.selection_token, options.now_ms);
  if (record.inspection_fingerprint !== input.inspection_fingerprint) throw new ProjectOnboardingErrorV01("selection_tampered", 409);
  const workspace = readDefaultWorkspaceIdentityV01(db);
  if (!workspace) throw new ProjectOnboardingErrorV01("project_scope_conflict", 404);
  const project = readCanonicalProjectWithRootV01(db, { workspace_id: workspace.workspace_id, project_id: input.project_id });
  if (!project) throw new ProjectOnboardingErrorV01("project_scope_conflict", 404);
  const inspection = await inspectLocalProjectRootV01(record.absolute_path, { now: options.now, db, workspace_id: workspace.workspace_id });
  if (inspection.inspection_fingerprint !== record.inspection_fingerprint) throw new ProjectOnboardingErrorV01("inspection_stale", 409);
  const now = (options.now ?? (() => new Date().toISOString()))();
  if (!inspection.physical_root_observation_fingerprint) {
    throw new ProjectOnboardingErrorV01("physical_identity_unavailable", 409);
  }
  if (!input.expected_old_baseline_fingerprint) {
    throw new ProjectOnboardingErrorV01("physical_identity_unavailable", 409);
  }
  const preview = await previewRepositoryExecutionRootRebindV01(db, {
    workspace_id: workspace.workspace_id,
    project_id: input.project_id,
    new_local_root: inspection.local_root,
  }, { now: () => now });
  if (
    preview.status !== "ready" ||
    !preview.decision_request ||
    preview.expected_old_root_binding_fingerprint !==
      input.expected_old_root_binding_fingerprint ||
    preview.expected_old_baseline_fingerprint !==
      input.expected_old_baseline_fingerprint ||
    preview.expected_new_observation_fingerprint !==
      inspection.physical_root_observation_fingerprint ||
    preview.decision_request.request_fingerprint !==
      input.decision_request_fingerprint
  ) {
    throw new ProjectOnboardingErrorV01("inspection_stale", 409);
  }
  await rebindRepositoryExecutionRootV01(db, {
    workspace_id: workspace.workspace_id,
    project_id: input.project_id,
    new_local_root: inspection.local_root,
    expected_old_root_binding_fingerprint: input.expected_old_root_binding_fingerprint,
    expected_old_baseline_fingerprint: input.expected_old_baseline_fingerprint,
    expected_new_observation_fingerprint: inspection.physical_root_observation_fingerprint,
    decision_request_fingerprint: preview.decision_request.request_fingerprint,
    decision_grant_fingerprint: options.decision_grant_fingerprint,
  }, {
    now: () => now,
    authorize_decision_inside_transaction:
      options.authorize_decision_inside_transaction,
    after_rebind_inside_transaction: () => {
      touchRecentProjectV01(db, { workspace_id: workspace.workspace_id, project_id: input.project_id, now });
      selectActiveProjectV01(db, {
        workspace_id: workspace.workspace_id,
        project_id: input.project_id,
        now,
        expected_project_id: record.expected_active_project_id,
        expected_revision: record.expected_active_revision,
      });
    },
  });
  return {
    status: "rebound" as const,
    project: project.project,
    local_root: inspection.local_root,
    destination: projectDestination(input.project_id),
  };
}

export async function listRecentProjectsV01(db: Database.Database): Promise<RecentProjectEntryV01[]> {
  const workspace = readDefaultWorkspaceIdentityV01(db);
  if (!workspace) return [];
  const active = readActiveProjectSelectionV01(db, workspace.workspace_id);
  const nodeObservation = await inspectPhysicalRootForExecutionV01(
    db,
    path.dirname(path.resolve(db.name)),
  );
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
      root_binding_fingerprint: fingerprintProjectRootBindingV01(registration.root_binding),
      physical_root_baseline_fingerprint: nodeObservation.status === "exact"
        ? readPhysicalRootBaselineV01(db, {
            workspace_id: workspace.workspace_id,
            project_id: row.project_id,
            node_scope_fingerprint: nodeObservation.node_scope_fingerprint,
          })?.baseline_fingerprint ?? null
        : null,
      repository_execution_decision:
        readOpenRepositoryExecutionDecisionProjectionV01(db, {
          workspace_id: workspace.workspace_id,
          project_id: row.project_id,
        }),
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
