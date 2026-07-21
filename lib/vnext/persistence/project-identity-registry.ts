import { randomUUID } from "node:crypto";
import path from "node:path";

import type Database from "better-sqlite3";

import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
  normalizeExternalRefPrimitiveV01,
  normalizeProtocolNullableTextV01,
  normalizeProtocolTextV01,
  parseStrictIsoTimestampV01,
  validateExternalRefStructureV01,
} from "@/lib/vnext/protocol-primitives";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import {
  DEFAULT_LOCAL_WORKSPACE_ROLE_V01,
  LOCAL_PROJECT_ROOT_REF_VERSION_V01,
  PROJECT_EXTERNAL_REF_BINDING_VERSION_V01,
  PROJECT_IDENTITY_VERSION_V01,
  PROJECT_LOCAL_ROOT_BINDING_VERSION_V01,
  WORKSPACE_IDENTITY_VERSION_V01,
  type LocalProjectPathFlavorV01,
  type LocalProjectRootRefV01,
  type ProjectExternalRefBindingV01,
  type ProjectIdentityV01,
  type ProjectLocalRootBindingV01,
  type WorkspaceIdentityV01,
} from "@/types/vnext/project-identity";

export const VNEXT_PROJECT_IDENTITY_REGISTRY_VERSION_V01 =
  "vnext_project_identity_registry.v0.1" as const;

export type ProjectIdentityRegistryErrorCodeV01 =
  | "workspace_identity_invalid"
  | "project_identity_invalid"
  | "project_identity_registry_corrupt"
  | "project_identity_registry_uninitialized"
  | "project_identity_replay_conflict"
  | "project_identity_scope_mismatch"
  | "local_project_root_invalid"
  | "project_external_ref_invalid"
  | "project_external_ref_conflict"
  | "project_root_rebind_conflict";

export class ProjectIdentityRegistryErrorV01 extends Error {
  readonly code: ProjectIdentityRegistryErrorCodeV01;
  readonly path: string | null;

  constructor(
    code: ProjectIdentityRegistryErrorCodeV01,
    path: string | null = null,
  ) {
    super(code);
    this.name = "ProjectIdentityRegistryErrorV01";
    this.code = code;
    this.path = path;
  }
}

export interface ProjectIdentityRegistryDependenciesV01 {
  create_uuid?: () => string;
  now?: () => string;
}

export interface CanonicalProjectRegistrationV01 {
  project: ProjectIdentityV01;
  root_binding: ProjectLocalRootBindingV01;
}

export interface CanonicalProjectRegistrationWriteResultV01
  extends CanonicalProjectRegistrationV01 {
  status: "inserted" | "exact_replay";
}

export interface ProjectExternalRefBindingWriteResultV01 {
  status: "inserted" | "exact_replay";
  binding: ProjectExternalRefBindingV01;
}

export interface PortableProjectIdentityAdmissionV01 {
  status: "inserted" | "exact_replay";
  workspace: WorkspaceIdentityV01;
  project: ProjectIdentityV01;
  root_binding: ProjectLocalRootBindingV01;
}

export const VNEXT_PROJECT_IDENTITY_REGISTRY_SCHEMA_SQL_V01 = `
  CREATE TABLE IF NOT EXISTS vnext_workspace_identities (
    workspace_id TEXT PRIMARY KEY CHECK (
      length(workspace_id) <= 256 AND
      workspace_id GLOB 'workspace:*' AND
      length(substr(workspace_id, 11)) > 0
    ),
    workspace_identity_version TEXT NOT NULL CHECK (
      workspace_identity_version = 'workspace_identity.v0.1'
    ),
    identity_kind TEXT NOT NULL CHECK (identity_kind = 'canonical'),
    identity_source TEXT NOT NULL CHECK (identity_source = 'canonical_registry'),
    workspace_role TEXT NOT NULL UNIQUE CHECK (
      length(trim(workspace_role)) > 0 AND length(workspace_role) <= 128
    ),
    created_at TEXT NOT NULL CHECK (length(trim(created_at)) > 0)
  );

  CREATE TABLE IF NOT EXISTS vnext_project_identities (
    workspace_id TEXT NOT NULL,
    project_id TEXT NOT NULL CHECK (
      length(project_id) <= 256 AND
      project_id GLOB 'project:*' AND
      project_id <> 'project:augnes' AND
      length(substr(project_id, 9)) > 0
    ),
    project_identity_version TEXT NOT NULL CHECK (
      project_identity_version = 'project_identity.v0.1'
    ),
    identity_kind TEXT NOT NULL CHECK (identity_kind = 'canonical'),
    identity_source TEXT NOT NULL CHECK (identity_source = 'canonical_registry'),
    display_name TEXT CHECK (
      display_name IS NULL OR
      (length(trim(display_name)) > 0 AND length(display_name) <= 240)
    ),
    created_at TEXT NOT NULL CHECK (length(trim(created_at)) > 0),
    PRIMARY KEY (workspace_id, project_id),
    FOREIGN KEY (workspace_id)
      REFERENCES vnext_workspace_identities(workspace_id)
      ON UPDATE RESTRICT ON DELETE RESTRICT
  );

  CREATE INDEX IF NOT EXISTS idx_vnext_project_identities_workspace_created
    ON vnext_project_identities(workspace_id, created_at, project_id);

  CREATE TABLE IF NOT EXISTS vnext_project_root_bindings (
    workspace_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    binding_version TEXT NOT NULL CHECK (
      binding_version = 'project_local_root_binding.v0.1'
    ),
    local_root_ref_version TEXT NOT NULL CHECK (
      local_root_ref_version = 'local_project_root_ref.v0.1'
    ),
    ref_kind TEXT NOT NULL CHECK (ref_kind = 'local_project_root'),
    path_flavor TEXT NOT NULL CHECK (path_flavor IN ('posix', 'win32')),
    normalized_root TEXT NOT NULL CHECK (
      length(normalized_root) > 0 AND
      length(normalized_root) <= 8192 AND
      instr(normalized_root, char(0)) = 0
    ),
    bound_at TEXT NOT NULL CHECK (length(trim(bound_at)) > 0),
    PRIMARY KEY (workspace_id, project_id),
    FOREIGN KEY (workspace_id, project_id)
      REFERENCES vnext_project_identities(workspace_id, project_id)
      ON UPDATE RESTRICT ON DELETE RESTRICT
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_vnext_project_root_bindings_workspace_root
    ON vnext_project_root_bindings(workspace_id, path_flavor, normalized_root);

  CREATE TABLE IF NOT EXISTS vnext_project_external_ref_bindings (
    workspace_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    binding_version TEXT NOT NULL CHECK (
      binding_version = 'project_external_ref_binding.v0.1'
    ),
    ref_fingerprint TEXT NOT NULL CHECK (
      length(ref_fingerprint) = 71 AND substr(ref_fingerprint, 1, 7) = 'sha256:'
    ),
    ref_json TEXT NOT NULL CHECK (
      json_valid(ref_json) AND json_type(ref_json) = 'object'
    ),
    created_at TEXT NOT NULL CHECK (length(trim(created_at)) > 0),
    PRIMARY KEY (workspace_id, project_id, ref_fingerprint),
    FOREIGN KEY (workspace_id, project_id)
      REFERENCES vnext_project_identities(workspace_id, project_id)
      ON UPDATE RESTRICT ON DELETE RESTRICT
  );

  CREATE INDEX IF NOT EXISTS idx_vnext_project_external_refs_project_created
    ON vnext_project_external_ref_bindings(
      workspace_id, project_id, created_at, ref_fingerprint
    );

  CREATE TRIGGER IF NOT EXISTS trg_vnext_project_external_refs_immutable_update
    BEFORE UPDATE ON vnext_project_external_ref_bindings
    BEGIN SELECT RAISE(ABORT, 'vnext_project_external_ref_binding_immutable'); END;
  CREATE TRIGGER IF NOT EXISTS trg_vnext_project_external_refs_immutable_delete
    BEFORE DELETE ON vnext_project_external_ref_bindings
    BEGIN SELECT RAISE(ABORT, 'vnext_project_external_ref_binding_immutable'); END;
`;

interface WorkspaceRowV01 {
  workspace_id: string;
  workspace_identity_version: string;
  identity_kind: string;
  identity_source: string;
  workspace_role: string;
  created_at: string;
}

interface ProjectRowV01 {
  workspace_id: string;
  project_id: string;
  project_identity_version: string;
  identity_kind: string;
  identity_source: string;
  display_name: string | null;
  created_at: string;
}

interface RootBindingRowV01 {
  workspace_id: string;
  project_id: string;
  binding_version: string;
  local_root_ref_version: string;
  ref_kind: string;
  path_flavor: string;
  normalized_root: string;
  bound_at: string;
}

interface ExternalRefBindingRowV01 {
  workspace_id: string;
  project_id: string;
  binding_version: string;
  ref_fingerprint: string;
  ref_json: string;
  created_at: string;
}

const CANONICAL_UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function nativeLocalProjectPathFlavorV01(): LocalProjectPathFlavorV01 {
  return process.platform === "win32" ? "win32" : "posix";
}

export function normalizeLocalProjectRootRefV01(
  input: string,
  options: {
    base_path: string;
    path_flavor?: LocalProjectPathFlavorV01;
  },
): LocalProjectRootRefV01 {
  const pathFlavor = options.path_flavor ?? nativeLocalProjectPathFlavorV01();
  const pathApi = pathFlavor === "win32" ? path.win32 : path.posix;
  if (
    typeof input !== "string" ||
    input.length === 0 ||
    input.includes("\0") ||
    typeof options.base_path !== "string" ||
    options.base_path.length === 0 ||
    options.base_path.includes("\0") ||
    !pathApi.isAbsolute(options.base_path)
  ) {
    fail("local_project_root_invalid", "local_root");
  }
  return {
    local_root_ref_version: LOCAL_PROJECT_ROOT_REF_VERSION_V01,
    ref_kind: "local_project_root",
    path_flavor: pathFlavor,
    normalized_path: pathApi.resolve(options.base_path, input),
  };
}

export function ensureVNextProjectIdentityRegistrySchemaV01(
  db: Database.Database,
): void {
  db.pragma("foreign_keys = ON");
  db.exec(VNEXT_PROJECT_IDENTITY_REGISTRY_SCHEMA_SQL_V01);
}

export function assertVNextProjectIdentityRegistrySchemaV01(
  db: Database.Database,
): void {
  const requiredArtifacts = [
    ["table", "vnext_workspace_identities"],
    ["table", "vnext_project_identities"],
    ["table", "vnext_project_root_bindings"],
    ["table", "vnext_project_external_ref_bindings"],
    ["index", "idx_vnext_project_identities_workspace_created"],
    ["index", "idx_vnext_project_root_bindings_workspace_root"],
    ["index", "idx_vnext_project_external_refs_project_created"],
    ["trigger", "trg_vnext_project_external_refs_immutable_update"],
    ["trigger", "trg_vnext_project_external_refs_immutable_delete"],
  ] as const;
  const lookup = db.prepare(
    "SELECT 1 FROM sqlite_master WHERE type = ? AND name = ?",
  );
  const missing = requiredArtifacts
    .filter(([type, name]) => !lookup.get(type, name))
    .map(([type, name]) => `${type}:${name}`);
  if (missing.length > 0) {
    fail("project_identity_registry_uninitialized", missing.join(","));
  }
}

export function getOrCreateDefaultWorkspaceIdentityV01(
  db: Database.Database,
  dependencies: ProjectIdentityRegistryDependenciesV01 = {},
): WorkspaceIdentityV01 {
  assertVNextProjectIdentityRegistrySchemaV01(db);
  return runImmediateTransaction(db, () => {
    const existing = selectWorkspaceByRole(
      db,
      DEFAULT_LOCAL_WORKSPACE_ROLE_V01,
    );
    if (existing) return parseWorkspace(existing);

    const workspace: WorkspaceIdentityV01 = {
      workspace_identity_version: WORKSPACE_IDENTITY_VERSION_V01,
      identity_kind: "canonical",
      identity_source: "canonical_registry",
      workspace_id: createCanonicalIdentityId("workspace", dependencies),
      workspace_role: DEFAULT_LOCAL_WORKSPACE_ROLE_V01,
      created_at: createTimestamp(dependencies),
    };
    try {
      db.prepare(
        `INSERT INTO vnext_workspace_identities (
          workspace_id, workspace_identity_version, identity_kind,
          identity_source, workspace_role, created_at
        ) VALUES (?, ?, ?, ?, ?, ?)`,
      ).run(
        workspace.workspace_id,
        workspace.workspace_identity_version,
        workspace.identity_kind,
        workspace.identity_source,
        workspace.workspace_role,
        workspace.created_at,
      );
    } catch (error) {
      if (isSqliteConstraint(error)) {
        fail("workspace_identity_invalid", "workspace_id");
      }
      throw error;
    }
    return workspace;
  });
}

export function readDefaultWorkspaceIdentityV01(
  db: Database.Database,
): WorkspaceIdentityV01 | null {
  assertVNextProjectIdentityRegistrySchemaV01(db);
  const row = selectWorkspaceByRole(db, DEFAULT_LOCAL_WORKSPACE_ROLE_V01);
  return row ? parseWorkspace(row) : null;
}

export function getOrCreateCanonicalProjectForLocalRootV01(
  db: Database.Database,
  input: {
    workspace_id: string;
    local_root: LocalProjectRootRefV01;
    display_name?: string | null;
  },
  dependencies: ProjectIdentityRegistryDependenciesV01 = {},
): CanonicalProjectRegistrationWriteResultV01 {
  assertVNextProjectIdentityRegistrySchemaV01(db);
  const workspaceId = normalizeWorkspaceId(input.workspace_id);
  const localRoot = normalizeStoredLocalRoot(input.local_root);
  const assertedDisplayName = Object.hasOwn(input, "display_name");
  const displayName = normalizeDisplayName(input.display_name ?? null);

  return runImmediateTransaction(db, () => {
    if (!selectWorkspaceById(db, workspaceId)) {
      fail("project_identity_scope_mismatch", "workspace_id");
    }
    const existing = selectRegistrationByRoot(db, workspaceId, localRoot);
    if (existing) {
      const registration = parseRegistration(existing.project, existing.root);
      if (
        assertedDisplayName &&
        registration.project.display_name !== displayName
      ) {
        fail("project_identity_replay_conflict", "display_name");
      }
      return { status: "exact_replay", ...registration };
    }

    const createdAt = createTimestamp(dependencies);
    const project: ProjectIdentityV01 = {
      project_identity_version: PROJECT_IDENTITY_VERSION_V01,
      identity_kind: "canonical",
      identity_source: "canonical_registry",
      workspace_id: workspaceId,
      project_id: createCanonicalIdentityId("project", dependencies),
      display_name: displayName,
      created_at: createdAt,
    };
    const rootBinding: ProjectLocalRootBindingV01 = {
      binding_version: PROJECT_LOCAL_ROOT_BINDING_VERSION_V01,
      workspace_id: workspaceId,
      project_id: project.project_id,
      local_root: localRoot,
      bound_at: createdAt,
    };
    try {
      insertProject(db, project);
      insertRootBinding(db, rootBinding);
    } catch (error) {
      if (isSqliteConstraint(error)) {
        fail("project_identity_replay_conflict", "local_root");
      }
      throw error;
    }
    return { status: "inserted", project, root_binding: rootBinding };
  });
}

/**
 * Transaction-aware admission for a validated portable project. Portable
 * continuity preserves canonical identity but never transports a source
 * machine's absolute root. The caller supplies an application-owned local
 * destination root and owns the surrounding atomic import transaction.
 */
export function admitPortableProjectIdentityInsideTransactionV01(
  db: Database.Database,
  input: {
    workspace: WorkspaceIdentityV01;
    project: ProjectIdentityV01;
    local_root: LocalProjectRootRefV01;
    bound_at: string;
  },
): PortableProjectIdentityAdmissionV01 {
  assertVNextProjectIdentityRegistrySchemaV01(db);
  if (!db.inTransaction) {
    fail("project_identity_scope_mismatch", "transaction");
  }
  const workspaceId = normalizeWorkspaceId(input.workspace.workspace_id);
  const projectId = normalizeProjectId(input.project.project_id);
  const localRoot = normalizeStoredLocalRoot(input.local_root);
  const workspace: WorkspaceIdentityV01 = {
    workspace_identity_version: WORKSPACE_IDENTITY_VERSION_V01,
    identity_kind: "canonical",
    identity_source: "canonical_registry",
    workspace_id: workspaceId,
    workspace_role: DEFAULT_LOCAL_WORKSPACE_ROLE_V01,
    created_at: normalizeTimestamp(input.workspace.created_at),
  };
  const project: ProjectIdentityV01 = {
    project_identity_version: PROJECT_IDENTITY_VERSION_V01,
    identity_kind: "canonical",
    identity_source: "canonical_registry",
    workspace_id: workspaceId,
    project_id: projectId,
    display_name: normalizeDisplayName(input.project.display_name),
    created_at: normalizeTimestamp(input.project.created_at),
  };
  if (
    input.workspace.workspace_identity_version !== WORKSPACE_IDENTITY_VERSION_V01 ||
    input.workspace.identity_kind !== "canonical" ||
    input.workspace.identity_source !== "canonical_registry" ||
    input.workspace.workspace_role !== DEFAULT_LOCAL_WORKSPACE_ROLE_V01 ||
    input.project.project_identity_version !== PROJECT_IDENTITY_VERSION_V01 ||
    input.project.identity_kind !== "canonical" ||
    input.project.identity_source !== "canonical_registry" ||
    input.project.workspace_id !== workspaceId
  ) {
    fail("project_identity_invalid", "portable_identity");
  }
  const rootBinding: ProjectLocalRootBindingV01 = {
    binding_version: PROJECT_LOCAL_ROOT_BINDING_VERSION_V01,
    workspace_id: workspaceId,
    project_id: projectId,
    local_root: localRoot,
    bound_at: normalizeTimestamp(input.bound_at),
  };

  const existingWorkspace = selectWorkspaceByRole(
    db,
    DEFAULT_LOCAL_WORKSPACE_ROLE_V01,
  );
  if (existingWorkspace) {
    if (
      canonicalizeProtocolValueV01(parseWorkspace(existingWorkspace)) !==
      canonicalizeProtocolValueV01(workspace)
    ) {
      fail("project_identity_replay_conflict", "workspace");
    }
  } else {
    try {
      db.prepare(
        `INSERT INTO vnext_workspace_identities (
          workspace_id, workspace_identity_version, identity_kind,
          identity_source, workspace_role, created_at
        ) VALUES (?, ?, ?, ?, ?, ?)`,
      ).run(
        workspace.workspace_id,
        workspace.workspace_identity_version,
        workspace.identity_kind,
        workspace.identity_source,
        workspace.workspace_role,
        workspace.created_at,
      );
    } catch (error) {
      if (isSqliteConstraint(error)) {
        fail("project_identity_replay_conflict", "workspace");
      }
      throw error;
    }
  }

  const existingProject = selectProjectByScope(db, workspaceId, projectId);
  if (existingProject) {
    const registration = readCanonicalProjectWithRootV01(db, {
      workspace_id: workspaceId,
      project_id: projectId,
    });
    if (
      !registration ||
      canonicalizeProtocolValueV01(registration.project) !==
        canonicalizeProtocolValueV01(project)
    ) {
      fail("project_identity_replay_conflict", "project");
    }
    return {
      status: "exact_replay",
      workspace,
      project,
      root_binding: registration.root_binding,
    };
  }

  const occupied = selectRegistrationByRoot(db, workspaceId, localRoot);
  if (occupied) fail("project_identity_replay_conflict", "local_root");
  try {
    insertProject(db, project);
    insertRootBinding(db, rootBinding);
  } catch (error) {
    if (isSqliteConstraint(error)) {
      fail("project_identity_replay_conflict", "project");
    }
    throw error;
  }
  return {
    status: "inserted",
    workspace,
    project,
    root_binding: rootBinding,
  };
}

export function readCanonicalProjectIdentityV01(
  db: Database.Database,
  input: { workspace_id: string; project_id: string },
): ProjectIdentityV01 | null {
  assertVNextProjectIdentityRegistrySchemaV01(db);
  const row = selectProjectByScope(
    db,
    normalizeWorkspaceId(input.workspace_id),
    normalizeProjectId(input.project_id),
  );
  return row ? parseProject(row) : null;
}

export function readCanonicalProjectWithRootV01(
  db: Database.Database,
  input: { workspace_id: string; project_id: string },
): CanonicalProjectRegistrationV01 | null {
  assertVNextProjectIdentityRegistrySchemaV01(db);
  const workspaceId = normalizeWorkspaceId(input.workspace_id);
  const projectId = normalizeProjectId(input.project_id);
  const project = selectProjectByScope(db, workspaceId, projectId);
  if (!project) return null;
  const root = db
    .prepare(
      `SELECT * FROM vnext_project_root_bindings
       WHERE workspace_id = ? AND project_id = ?`,
    )
    .get(workspaceId, projectId) as RootBindingRowV01 | undefined;
  if (!root) fail("project_identity_registry_corrupt", "root_binding");
  return parseRegistration(project, root);
}

export function findCanonicalProjectByLocalRootV01(
  db: Database.Database,
  input: { workspace_id: string; local_root: LocalProjectRootRefV01 },
): CanonicalProjectRegistrationV01 | null {
  assertVNextProjectIdentityRegistrySchemaV01(db);
  const workspaceId = normalizeWorkspaceId(input.workspace_id);
  const localRoot = normalizeStoredLocalRoot(input.local_root);
  const rows = selectRegistrationByRoot(db, workspaceId, localRoot);
  return rows ? parseRegistration(rows.project, rows.root) : null;
}

export function rebindCanonicalProjectLocalRootV01(
  db: Database.Database,
  input: {
    workspace_id: string;
    project_id: string;
    local_root: LocalProjectRootRefV01;
  },
  dependencies: Pick<ProjectIdentityRegistryDependenciesV01, "now"> = {},
): ProjectLocalRootBindingV01 {
  assertVNextProjectIdentityRegistrySchemaV01(db);
  const workspaceId = normalizeWorkspaceId(input.workspace_id);
  const projectId = normalizeProjectId(input.project_id);
  const localRoot = normalizeStoredLocalRoot(input.local_root);
  return runImmediateTransaction(db, () => {
    if (!selectProjectByScope(db, workspaceId, projectId)) {
      fail("project_identity_scope_mismatch", "project_id");
    }
    const occupied = selectRegistrationByRoot(db, workspaceId, localRoot);
    if (occupied && occupied.project.project_id !== projectId) {
      fail("project_root_rebind_conflict", "local_root");
    }
    const boundAt = createTimestamp(dependencies);
    try {
      db.prepare(`UPDATE vnext_project_root_bindings SET
        path_flavor = ?, normalized_root = ?, bound_at = ?
        WHERE workspace_id = ? AND project_id = ?`)
        .run(localRoot.path_flavor, localRoot.normalized_path, boundAt, workspaceId, projectId);
    } catch (error) {
      if (isSqliteConstraint(error)) fail("project_root_rebind_conflict", "local_root");
      throw error;
    }
    return readCanonicalProjectWithRootV01(db, { workspace_id: workspaceId, project_id: projectId })!.root_binding;
  });
}

export function attachProjectExternalRefV01(
  db: Database.Database,
  input: {
    workspace_id: string;
    project_id: string;
    external_ref: ExternalRefV01;
  },
  dependencies: Pick<ProjectIdentityRegistryDependenciesV01, "now"> = {},
): ProjectExternalRefBindingWriteResultV01 {
  assertVNextProjectIdentityRegistrySchemaV01(db);
  const workspaceId = normalizeWorkspaceId(input.workspace_id);
  const projectId = normalizeProjectId(input.project_id);
  const externalRef = normalizeValidatedExternalRef(input.external_ref);
  const refJson = canonicalizeProtocolValueV01(externalRef);
  const refFingerprint = createProtocolSha256V01(refJson);

  return runImmediateTransaction(db, () => {
    if (!selectProjectByScope(db, workspaceId, projectId)) {
      fail("project_identity_scope_mismatch", "project_id");
    }
    const createdAt = createTimestamp(dependencies);
    const result = db
      .prepare(
        `INSERT INTO vnext_project_external_ref_bindings (
          workspace_id, project_id, binding_version,
          ref_fingerprint, ref_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(workspace_id, project_id, ref_fingerprint) DO NOTHING`,
      )
      .run(
        workspaceId,
        projectId,
        PROJECT_EXTERNAL_REF_BINDING_VERSION_V01,
        refFingerprint,
        refJson,
        createdAt,
      );
    const row = selectExternalRefBinding(
      db,
      workspaceId,
      projectId,
      refFingerprint,
    );
    if (!row) fail("project_identity_registry_corrupt", "external_ref");
    const binding = parseExternalRefBinding(row);
    if (canonicalizeProtocolValueV01(binding.external_ref) !== refJson) {
      fail("project_external_ref_conflict", "external_ref");
    }
    return {
      status: result.changes === 1 ? "inserted" : "exact_replay",
      binding,
    };
  });
}

export function readProjectExternalRefV01(
  db: Database.Database,
  input: {
    workspace_id: string;
    project_id: string;
    ref_fingerprint: string;
  },
): ProjectExternalRefBindingV01 | null {
  assertVNextProjectIdentityRegistrySchemaV01(db);
  const row = selectExternalRefBinding(
    db,
    normalizeWorkspaceId(input.workspace_id),
    normalizeProjectId(input.project_id),
    normalizeSha256(input.ref_fingerprint, "ref_fingerprint"),
  );
  return row ? parseExternalRefBinding(row) : null;
}

export function listProjectExternalRefsV01(
  db: Database.Database,
  input: { workspace_id: string; project_id: string },
): ProjectExternalRefBindingV01[] {
  assertVNextProjectIdentityRegistrySchemaV01(db);
  const workspaceId = normalizeWorkspaceId(input.workspace_id);
  const projectId = normalizeProjectId(input.project_id);
  const rows = db
    .prepare(
      `SELECT * FROM vnext_project_external_ref_bindings
       WHERE workspace_id = ? AND project_id = ?
       ORDER BY created_at, ref_fingerprint`,
    )
    .all(workspaceId, projectId) as ExternalRefBindingRowV01[];
  return rows.map(parseExternalRefBinding);
}

function insertProject(
  db: Database.Database,
  project: ProjectIdentityV01,
): void {
  db.prepare(
    `INSERT INTO vnext_project_identities (
      workspace_id, project_id, project_identity_version,
      identity_kind, identity_source, display_name, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    project.workspace_id,
    project.project_id,
    project.project_identity_version,
    project.identity_kind,
    project.identity_source,
    project.display_name,
    project.created_at,
  );
}

function insertRootBinding(
  db: Database.Database,
  binding: ProjectLocalRootBindingV01,
): void {
  db.prepare(
    `INSERT INTO vnext_project_root_bindings (
      workspace_id, project_id, binding_version, local_root_ref_version,
      ref_kind, path_flavor, normalized_root, bound_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    binding.workspace_id,
    binding.project_id,
    binding.binding_version,
    binding.local_root.local_root_ref_version,
    binding.local_root.ref_kind,
    binding.local_root.path_flavor,
    binding.local_root.normalized_path,
    binding.bound_at,
  );
}

function selectWorkspaceByRole(
  db: Database.Database,
  role: string,
): WorkspaceRowV01 | null {
  return (
    (db
      .prepare(
        "SELECT * FROM vnext_workspace_identities WHERE workspace_role = ?",
      )
      .get(role) as WorkspaceRowV01 | undefined) ?? null
  );
}

function selectWorkspaceById(
  db: Database.Database,
  workspaceId: string,
): WorkspaceRowV01 | null {
  return (
    (db
      .prepare(
        "SELECT * FROM vnext_workspace_identities WHERE workspace_id = ?",
      )
      .get(workspaceId) as WorkspaceRowV01 | undefined) ?? null
  );
}

function selectProjectByScope(
  db: Database.Database,
  workspaceId: string,
  projectId: string,
): ProjectRowV01 | null {
  return (
    (db
      .prepare(
        `SELECT * FROM vnext_project_identities
         WHERE workspace_id = ? AND project_id = ?`,
      )
      .get(workspaceId, projectId) as ProjectRowV01 | undefined) ?? null
  );
}

function selectRegistrationByRoot(
  db: Database.Database,
  workspaceId: string,
  localRoot: LocalProjectRootRefV01,
): { project: ProjectRowV01; root: RootBindingRowV01 } | null {
  const row = db
    .prepare(
      `SELECT
        p.workspace_id AS p_workspace_id,
        p.project_id AS p_project_id,
        p.project_identity_version,
        p.identity_kind,
        p.identity_source,
        p.display_name,
        p.created_at,
        r.binding_version,
        r.local_root_ref_version,
        r.ref_kind,
        r.path_flavor,
        r.normalized_root,
        r.bound_at
       FROM vnext_project_root_bindings r
       JOIN vnext_project_identities p
         ON p.workspace_id = r.workspace_id AND p.project_id = r.project_id
       WHERE r.workspace_id = ? AND r.path_flavor = ? AND r.normalized_root = ?`,
    )
    .get(
      workspaceId,
      localRoot.path_flavor,
      localRoot.normalized_path,
    ) as
    | {
        p_workspace_id: string;
        p_project_id: string;
        project_identity_version: string;
        identity_kind: string;
        identity_source: string;
        display_name: string | null;
        created_at: string;
        binding_version: string;
        local_root_ref_version: string;
        ref_kind: string;
        path_flavor: string;
        normalized_root: string;
        bound_at: string;
      }
    | undefined;
  if (!row) return null;
  return {
    project: {
      workspace_id: row.p_workspace_id,
      project_id: row.p_project_id,
      project_identity_version: row.project_identity_version,
      identity_kind: row.identity_kind,
      identity_source: row.identity_source,
      display_name: row.display_name,
      created_at: row.created_at,
    },
    root: {
      workspace_id: row.p_workspace_id,
      project_id: row.p_project_id,
      binding_version: row.binding_version,
      local_root_ref_version: row.local_root_ref_version,
      ref_kind: row.ref_kind,
      path_flavor: row.path_flavor,
      normalized_root: row.normalized_root,
      bound_at: row.bound_at,
    },
  };
}

function selectExternalRefBinding(
  db: Database.Database,
  workspaceId: string,
  projectId: string,
  refFingerprint: string,
): ExternalRefBindingRowV01 | null {
  return (
    (db
      .prepare(
        `SELECT * FROM vnext_project_external_ref_bindings
         WHERE workspace_id = ? AND project_id = ? AND ref_fingerprint = ?`,
      )
      .get(
        workspaceId,
        projectId,
        refFingerprint,
      ) as ExternalRefBindingRowV01 | undefined) ?? null
  );
}

function parseRegistration(
  project: ProjectRowV01,
  root: RootBindingRowV01,
): CanonicalProjectRegistrationV01 {
  const parsedProject = parseProject(project);
  const rootBinding = parseRootBinding(root);
  if (
    parsedProject.workspace_id !== rootBinding.workspace_id ||
    parsedProject.project_id !== rootBinding.project_id
  ) {
    fail("project_identity_registry_corrupt", "root_binding");
  }
  return { project: parsedProject, root_binding: rootBinding };
}

function parseWorkspace(row: WorkspaceRowV01): WorkspaceIdentityV01 {
  if (
    row.workspace_identity_version !== WORKSPACE_IDENTITY_VERSION_V01 ||
    row.identity_kind !== "canonical" ||
    row.identity_source !== "canonical_registry" ||
    row.workspace_role !== DEFAULT_LOCAL_WORKSPACE_ROLE_V01
  ) {
    fail("project_identity_registry_corrupt", "workspace");
  }
  return {
    workspace_identity_version: WORKSPACE_IDENTITY_VERSION_V01,
    identity_kind: "canonical",
    identity_source: "canonical_registry",
    workspace_id: normalizeWorkspaceId(row.workspace_id),
    workspace_role: DEFAULT_LOCAL_WORKSPACE_ROLE_V01,
    created_at: normalizeTimestamp(row.created_at),
  };
}

function parseProject(row: ProjectRowV01): ProjectIdentityV01 {
  if (
    row.project_identity_version !== PROJECT_IDENTITY_VERSION_V01 ||
    row.identity_kind !== "canonical" ||
    row.identity_source !== "canonical_registry"
  ) {
    fail("project_identity_registry_corrupt", "project");
  }
  return {
    project_identity_version: PROJECT_IDENTITY_VERSION_V01,
    identity_kind: "canonical",
    identity_source: "canonical_registry",
    workspace_id: normalizeWorkspaceId(row.workspace_id),
    project_id: normalizeProjectId(row.project_id),
    display_name: normalizeDisplayName(row.display_name),
    created_at: normalizeTimestamp(row.created_at),
  };
}

function parseRootBinding(
  row: RootBindingRowV01,
): ProjectLocalRootBindingV01 {
  if (
    row.binding_version !== PROJECT_LOCAL_ROOT_BINDING_VERSION_V01 ||
    row.local_root_ref_version !== LOCAL_PROJECT_ROOT_REF_VERSION_V01 ||
    row.ref_kind !== "local_project_root"
  ) {
    fail("project_identity_registry_corrupt", "root_binding");
  }
  return {
    binding_version: PROJECT_LOCAL_ROOT_BINDING_VERSION_V01,
    workspace_id: normalizeWorkspaceId(row.workspace_id),
    project_id: normalizeProjectId(row.project_id),
    local_root: normalizeStoredLocalRoot({
      local_root_ref_version: LOCAL_PROJECT_ROOT_REF_VERSION_V01,
      ref_kind: "local_project_root",
      path_flavor: normalizePathFlavor(row.path_flavor),
      normalized_path: row.normalized_root,
    }),
    bound_at: normalizeTimestamp(row.bound_at),
  };
}

function parseExternalRefBinding(
  row: ExternalRefBindingRowV01,
): ProjectExternalRefBindingV01 {
  if (row.binding_version !== PROJECT_EXTERNAL_REF_BINDING_VERSION_V01) {
    fail("project_identity_registry_corrupt", "external_ref.binding_version");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(row.ref_json) as unknown;
  } catch {
    fail("project_identity_registry_corrupt", "external_ref.ref_json");
  }
  const externalRef = normalizeValidatedExternalRef(parsed as ExternalRefV01);
  const canonical = canonicalizeProtocolValueV01(externalRef);
  const fingerprint = normalizeSha256(row.ref_fingerprint, "ref_fingerprint");
  if (
    canonical !== row.ref_json ||
    createProtocolSha256V01(canonical) !== fingerprint
  ) {
    fail("project_identity_registry_corrupt", "external_ref");
  }
  return {
    binding_version: PROJECT_EXTERNAL_REF_BINDING_VERSION_V01,
    workspace_id: normalizeWorkspaceId(row.workspace_id),
    project_id: normalizeProjectId(row.project_id),
    ref_fingerprint: fingerprint,
    external_ref: externalRef,
    created_at: normalizeTimestamp(row.created_at),
  };
}

function normalizeStoredLocalRoot(
  input: LocalProjectRootRefV01,
): LocalProjectRootRefV01 {
  if (
    input.local_root_ref_version !== LOCAL_PROJECT_ROOT_REF_VERSION_V01 ||
    input.ref_kind !== "local_project_root"
  ) {
    fail("local_project_root_invalid", "local_root");
  }
  const pathFlavor = normalizePathFlavor(input.path_flavor);
  const pathApi = pathFlavor === "win32" ? path.win32 : path.posix;
  if (
    typeof input.normalized_path !== "string" ||
    input.normalized_path.length === 0 ||
    input.normalized_path.length > 8192 ||
    input.normalized_path.includes("\0") ||
    !pathApi.isAbsolute(input.normalized_path)
  ) {
    fail("local_project_root_invalid", "local_root.normalized_path");
  }
  const canonical = pathApi.resolve(
    pathApi.parse(input.normalized_path).root,
    input.normalized_path,
  );
  if (canonical !== input.normalized_path) {
    fail("local_project_root_invalid", "local_root.normalized_path");
  }
  return {
    local_root_ref_version: LOCAL_PROJECT_ROOT_REF_VERSION_V01,
    ref_kind: "local_project_root",
    path_flavor: pathFlavor,
    normalized_path: canonical,
  };
}

function normalizeValidatedExternalRef(input: ExternalRefV01): ExternalRefV01 {
  const errors: Array<{ code: string; path: string | null }> = [];
  validateExternalRefStructureV01(input, "$.external_ref", {
    error(code, issuePath) {
      errors.push({ code, path: issuePath });
    },
    warning() {},
  });
  if (errors[0]) fail("project_external_ref_invalid", errors[0].path);
  const normalized = normalizeExternalRefPrimitiveV01(input);
  if (!normalized.ref_type || !normalized.external_id) {
    fail("project_external_ref_invalid", "$.external_ref");
  }
  return normalized;
}

function createCanonicalIdentityId(
  kind: "workspace" | "project",
  dependencies: ProjectIdentityRegistryDependenciesV01,
): string {
  const uuid = (dependencies.create_uuid ?? randomUUID)();
  if (!CANONICAL_UUID_PATTERN.test(uuid)) {
    fail(
      kind === "workspace"
        ? "workspace_identity_invalid"
        : "project_identity_invalid",
      `${kind}_id`,
    );
  }
  return `${kind}:${uuid.toLowerCase()}`;
}

function createTimestamp(
  dependencies: Pick<ProjectIdentityRegistryDependenciesV01, "now">,
): string {
  return normalizeTimestamp(
    dependencies.now?.() ?? new Date().toISOString(),
  );
}

function normalizeTimestamp(value: unknown): string {
  const normalized = normalizeProtocolTextV01(value);
  if (!normalized || parseStrictIsoTimestampV01(normalized) === null) {
    fail("project_identity_registry_corrupt", "timestamp");
  }
  return normalized;
}

function normalizeDisplayName(value: unknown): string | null {
  const normalized = normalizeProtocolNullableTextV01(value);
  if (normalized !== null && normalized.length > 240) {
    fail("project_identity_invalid", "display_name");
  }
  return normalized;
}

function normalizeWorkspaceId(value: unknown): string {
  return normalizeCanonicalId(value, "workspace");
}

function normalizeProjectId(value: unknown): string {
  return normalizeCanonicalId(value, "project");
}

function normalizeCanonicalId(
  value: unknown,
  kind: "workspace" | "project",
): string {
  const normalized = normalizeProtocolTextV01(value);
  const prefix = `${kind}:`;
  const uuid = normalized.startsWith(prefix)
    ? normalized.slice(prefix.length)
    : "";
  if (
    !CANONICAL_UUID_PATTERN.test(uuid) ||
    (kind === "project" && normalized === "project:augnes")
  ) {
    fail(
      kind === "workspace"
        ? "workspace_identity_invalid"
        : "project_identity_invalid",
      `${kind}_id`,
    );
  }
  return `${prefix}${uuid.toLowerCase()}`;
}

function normalizePathFlavor(value: unknown): LocalProjectPathFlavorV01 {
  if (value !== "posix" && value !== "win32") {
    fail("local_project_root_invalid", "local_root.path_flavor");
  }
  return value;
}

function normalizeSha256(value: unknown, pathValue: string): string {
  const normalized = normalizeProtocolTextV01(value);
  if (!/^sha256:[a-f0-9]{64}$/.test(normalized)) {
    fail("project_external_ref_invalid", pathValue);
  }
  return normalized;
}

function runImmediateTransaction<T>(
  db: Database.Database,
  operation: () => T,
): T {
  return db.inTransaction ? operation() : db.transaction(operation).immediate();
}

function isSqliteConstraint(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string" &&
    error.code.startsWith("SQLITE_CONSTRAINT")
  );
}

function fail(
  code: ProjectIdentityRegistryErrorCodeV01,
  pathValue: string | null = null,
): never {
  throw new ProjectIdentityRegistryErrorV01(code, pathValue);
}
