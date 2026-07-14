import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
} from "node:fs";
import path from "node:path";
import { Socket } from "node:net";
import { fileURLToPath } from "node:url";

import Database from "better-sqlite3";

import { openDatabase } from "../lib/db";
import {
  readLegacyProjectWorkItemsCompatibilityV01,
  resolveLegacyProjectCompatibilityIdentityV01,
} from "../lib/vnext/compat/project-identity";
import {
  countVNextCoreRecordsV01,
  insertVNextCoreRecordV01,
  readVNextCoreRecordV01,
} from "../lib/vnext/persistence/durable-semantic-store";
import {
  ProjectIdentityRegistryErrorV01,
  assertVNextProjectIdentityRegistrySchemaV01,
  attachProjectExternalRefV01,
  ensureVNextProjectIdentityRegistrySchemaV01,
  findCanonicalProjectByLocalRootV01,
  getOrCreateCanonicalProjectForLocalRootV01,
  getOrCreateDefaultWorkspaceIdentityV01,
  listProjectExternalRefsV01,
  nativeLocalProjectPathFlavorV01,
  normalizeLocalProjectRootRefV01,
  readCanonicalProjectIdentityV01,
  readCanonicalProjectWithRootV01,
  readProjectExternalRefV01,
} from "../lib/vnext/persistence/project-identity-registry";
import { createProtocolSha256V01 } from "../lib/vnext/protocol-primitives";
import type { ExternalRefV01 } from "../types/vnext/external-ref";
import { LEGACY_AUGNES_PROJECT_SCOPE_V01 } from "../types/vnext/project-identity";
import { applyCanonicalDatabaseMigrations } from "./canonical-database-migrations.mjs";
import { vNextProjectIdentityRegistrySchemaSqlV01 } from "./db-migrations.mjs";
import {
  prepareRuntimeDatabase,
  verifyDatabaseFile,
} from "./runtime-database-bootstrap.mjs";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const requestedDatabasePath = process.env.AUGNES_DB_PATH;
assert(
  requestedDatabasePath && path.isAbsolute(requestedDatabasePath),
  "project identity integration requires an absolute disposable AUGNES_DB_PATH",
);
mkdirSync(path.dirname(requestedDatabasePath), { recursive: true });
const temporaryRoot = mkdtempSync(
  path.join(path.dirname(requestedDatabasePath), "r3-project-identity-"),
);

const providerEnvironmentKeys = [
  "ANTHROPIC_API_KEY",
  "CODEX_HOME",
  "GEMINI_API_KEY",
  "GITHUB_TOKEN",
  "MCP_CONFIG",
  "OPENAI_API_KEY",
  "SCHEDULER_CONFIG",
] as const;
const originalProviderEnvironment = new Map(
  providerEnvironmentKeys.map((key) => [key, process.env[key]]),
);
for (const key of providerEnvironmentKeys) delete process.env[key];

const originalFetch = globalThis.fetch;
const originalSocketConnect = Socket.prototype.connect;
let fetchCalls = 0;
let networkConnectCalls = 0;
globalThis.fetch = async () => {
  fetchCalls += 1;
  throw new Error("project identity flow must not make fetch calls");
};
Socket.prototype.connect = function blockedNetworkConnect(..._args: unknown[]) {
  networkConnectCalls += 1;
  throw new Error("project identity flow must not open network connections");
} as typeof Socket.prototype.connect;

let symlinkCapabilityExclusion: string | null = null;
const originalDatabasePath = process.env.AUGNES_DB_PATH;

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function main() {
  try {
    const normalization = assertRootNormalizationContract();
    assertNoExternalExecutionDependency();
    const registry = assertRegistryLifecycleAndIsolation();
    const migration = await assertMigrationAndRuntimeLifecycle();
    const compatibility = assertLegacyCompatibilityRead();
    assert.equal(fetchCalls, 0, "identity flow made no fetch calls");
    assert.equal(
      networkConnectCalls,
      0,
      "identity flow made no network connection attempts",
    );

    console.log(
      JSON.stringify(
        {
          status: "pass",
          normalization,
          registry,
          migration,
          compatibility,
          external_dependencies: {
            credentials_required: false,
            fetch_calls: fetchCalls,
            network_connect_calls: networkConnectCalls,
            child_process_or_git_dependency: false,
            symlink_capability_exclusion: symlinkCapabilityExclusion,
          },
        },
        null,
        2,
      ),
    );
  } finally {
    globalThis.fetch = originalFetch;
    Socket.prototype.connect = originalSocketConnect;
    process.env.AUGNES_DB_PATH = originalDatabasePath;
    for (const [key, value] of originalProviderEnvironment) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

function assertRootNormalizationContract() {
  const flavor = nativeLocalProjectPathFlavorV01();
  const pathApi = flavor === "win32" ? path.win32 : path.posix;
  const base = temporaryRoot;
  const rootA = pathApi.join(base, "projects", "alpha");
  const sibling = pathApi.join(base, "projects", "beta");
  const prefix = pathApi.join(base, "projects", "alpha-copy");
  const normalizedA = normalizeLocalProjectRootRefV01(rootA, {
    base_path: base,
    path_flavor: flavor,
  });
  const relativeA = normalizeLocalProjectRootRefV01(
    pathApi.join("projects", ".", "alpha", "nested", ".."),
    { base_path: base, path_flavor: flavor },
  );
  const trailingA = normalizeLocalProjectRootRefV01(
    `${rootA}${pathApi.sep}`,
    { base_path: base, path_flavor: flavor },
  );
  assert.equal(relativeA.normalized_path, normalizedA.normalized_path);
  assert.equal(trailingA.normalized_path, normalizedA.normalized_path);
  assert.notEqual(
    normalizeLocalProjectRootRefV01(sibling, {
      base_path: base,
      path_flavor: flavor,
    }).normalized_path,
    normalizedA.normalized_path,
  );
  assert.notEqual(
    normalizeLocalProjectRootRefV01(prefix, {
      base_path: base,
      path_flavor: flavor,
    }).normalized_path,
    normalizedA.normalized_path,
  );

  const filesystemRoot = pathApi.parse(base).root;
  assert.equal(
    normalizeLocalProjectRootRefV01(filesystemRoot, {
      base_path: base,
      path_flavor: flavor,
    }).normalized_path,
    filesystemRoot,
  );
  const upperCase = normalizeLocalProjectRootRefV01(
    pathApi.join(base, "CaseSensitiveSelection"),
    { base_path: base, path_flavor: flavor },
  );
  const lowerCase = normalizeLocalProjectRootRefV01(
    pathApi.join(base, "casesensitiveselection"),
    { base_path: base, path_flavor: flavor },
  );
  assert.notEqual(
    upperCase.normalized_path,
    lowerCase.normalized_path,
    "root normalization must not case-fold selections",
  );
  assert.throws(
    () =>
      normalizeLocalProjectRootRefV01("relative", {
        base_path: "relative-base",
        path_flavor: flavor,
      }),
    isRegistryError("local_project_root_invalid"),
  );

  const target = path.join(temporaryRoot, "symlink-target");
  const link = path.join(temporaryRoot, "symlink-selection");
  mkdirSync(target, { recursive: true });
  if (createDirectoryLink(target, link)) {
    const targetRef = normalizeLocalProjectRootRefV01(target, {
      base_path: base,
      path_flavor: flavor,
    });
    const linkRef = normalizeLocalProjectRootRefV01(link, {
      base_path: base,
      path_flavor: flavor,
    });
    assert.notEqual(
      targetRef.normalized_path,
      linkRef.normalized_path,
      "lexical root identity preserves an explicitly selected symlink path",
    );
  }

  return {
    relative_resolution: true,
    dot_segments: true,
    trailing_separators: true,
    filesystem_root_preserved: true,
    siblings_and_prefixes_distinct: true,
    case_folding: false,
    realpath_identity: false,
    target_must_exist: false,
  };
}

function assertNoExternalExecutionDependency() {
  for (const relativePath of [
    "lib/vnext/persistence/project-identity-registry.ts",
    "lib/vnext/compat/project-identity.ts",
  ]) {
    const source = readFileSync(path.join(repoRoot, relativePath), "utf8");
    assert.equal(
      /node:child_process|\b(?:execFile|execSync|spawn|spawnSync)\s*\(|["'`]git\s/.test(
        source,
      ),
      false,
      `${relativePath} must not depend on Git or external process execution`,
    );
  }
}

function assertRegistryLifecycleAndIsolation() {
  const databasePath = path.join(temporaryRoot, "registry-lifecycle.db");
  const projectsRoot = path.join(temporaryRoot, "plain-projects");
  const rootAPath = path.join(projectsRoot, "alpha");
  const rootBPath = path.join(projectsRoot, "beta");
  mkdirSync(rootAPath, { recursive: true });
  mkdirSync(rootBPath, { recursive: true });
  const flavor = nativeLocalProjectPathFlavorV01();
  const rootA = normalizeLocalProjectRootRefV01(rootAPath, {
    base_path: temporaryRoot,
    path_flavor: flavor,
  });
  const rootB = normalizeLocalProjectRootRefV01(rootBPath, {
    base_path: temporaryRoot,
    path_flavor: flavor,
  });
  const ids = uuidSequence(1);
  const timestamps = timestampSequence();
  let workspaceId = "";
  let projectAId = "";
  let projectBId = "";
  let repositoryFingerprint = "";

  let database = new Database(databasePath);
  try {
    database.pragma("foreign_keys = ON");
    applyCanonicalDatabaseMigrations(database);
    assertVNextProjectIdentityRegistrySchemaV01(database);

    const workspace = getOrCreateDefaultWorkspaceIdentityV01(database, {
      create_uuid: ids,
      now: timestamps,
    });
    workspaceId = workspace.workspace_id;
    const projectA = getOrCreateCanonicalProjectForLocalRootV01(
      database,
      {
        workspace_id: workspaceId,
        local_root: rootA,
        display_name: "Alpha",
      },
      { create_uuid: ids, now: timestamps },
    );
    const projectB = getOrCreateCanonicalProjectForLocalRootV01(
      database,
      {
        workspace_id: workspaceId,
        local_root: rootB,
        display_name: "Beta",
      },
      { create_uuid: ids, now: timestamps },
    );
    assert.equal(projectA.status, "inserted");
    assert.equal(projectB.status, "inserted");
    projectAId = projectA.project.project_id;
    projectBId = projectB.project.project_id;
    assert.notEqual(projectAId, projectBId);
    assert.notEqual(projectAId, LEGACY_AUGNES_PROJECT_SCOPE_V01);
    assert.notEqual(projectBId, LEGACY_AUGNES_PROJECT_SCOPE_V01);

    const repositoryRef = repositoryExternalRef();
    const attachedA = attachProjectExternalRefV01(
      database,
      {
        workspace_id: workspaceId,
        project_id: projectAId,
        external_ref: repositoryRef,
      },
      { now: timestamps },
    );
    const attachedB = attachProjectExternalRefV01(
      database,
      {
        workspace_id: workspaceId,
        project_id: projectBId,
        external_ref: repositoryRef,
      },
      { now: timestamps },
    );
    repositoryFingerprint = attachedA.binding.ref_fingerprint;
    assert.equal(attachedA.status, "inserted");
    assert.equal(attachedB.status, "inserted");
    assert.equal(
      attachedA.binding.ref_fingerprint,
      attachedB.binding.ref_fingerprint,
      "the same repository reference is project-scoped, not globally unique",
    );
    assert.equal(
      attachProjectExternalRefV01(
        database,
        {
          workspace_id: workspaceId,
          project_id: projectAId,
          external_ref: repositoryRef,
        },
        { now: timestamps },
      ).status,
      "exact_replay",
    );

    const projectBOnly = attachProjectExternalRefV01(
      database,
      {
        workspace_id: workspaceId,
        project_id: projectBId,
        external_ref: {
          ref_version: "external_ref.v0.1",
          ref_type: "issue_tracker",
          external_id: "tracker:beta-only",
          trust_class: "user_declaration",
        },
      },
      { now: timestamps },
    );
    assert.equal(
      readProjectExternalRefV01(database, {
        workspace_id: workspaceId,
        project_id: projectAId,
        ref_fingerprint: projectBOnly.binding.ref_fingerprint,
      }),
      null,
    );
    assert.deepEqual(
      listProjectExternalRefsV01(database, {
        workspace_id: workspaceId,
        project_id: projectAId,
      }).map((binding) => binding.ref_fingerprint),
      [repositoryFingerprint],
    );
    assert.deepEqual(
      listProjectExternalRefsV01(database, {
        workspace_id: workspaceId,
        project_id: projectBId,
      }).map((binding) => binding.ref_fingerprint),
      [repositoryFingerprint, projectBOnly.binding.ref_fingerprint].sort(),
    );

    assert.throws(
      () =>
        database
          .prepare(
            `UPDATE vnext_project_external_ref_bindings
             SET project_id = ?
             WHERE workspace_id = ? AND project_id = ? AND ref_fingerprint = ?`,
          )
          .run(projectBId, workspaceId, projectAId, repositoryFingerprint),
      /vnext_project_external_ref_binding_immutable/,
      "a cross-project update cannot reassign another project's binding",
    );
    assert.throws(
      () =>
        attachProjectExternalRefV01(database, {
          workspace_id: canonicalWorkspaceId(999),
          project_id: projectAId,
          external_ref: repositoryRef,
        }),
      isRegistryError("project_identity_scope_mismatch"),
    );

    const coreFingerprint = createProtocolSha256V01("project-a-core-record");
    insertVNextCoreRecordV01(database, {
      record_kind: "run_receipt",
      record_id: "run-receipt:r3-project-a",
      workspace_id: workspaceId,
      project_id: projectAId,
      fingerprint: coreFingerprint,
      idempotency_key: null,
      payload: { contract: "r3-project-identity-integration" },
      created_at: "2026-07-14T10:10:00.000Z",
    });
    assert(
      readVNextCoreRecordV01(database, {
        record_kind: "run_receipt",
        record_id: "run-receipt:r3-project-a",
        workspace_id: workspaceId,
        project_id: projectAId,
      }),
    );
    assert.equal(
      readVNextCoreRecordV01(database, {
        record_kind: "run_receipt",
        record_id: "run-receipt:r3-project-a",
        workspace_id: workspaceId,
        project_id: projectBId,
      }),
      null,
    );
    assert.equal(
      countVNextCoreRecordsV01(database, {
        workspace_id: workspaceId,
        project_id: projectBId,
      }),
      0,
    );
  } finally {
    database.close();
  }

  database = new Database(databasePath, { fileMustExist: true });
  try {
    database.pragma("foreign_keys = ON");
    applyCanonicalDatabaseMigrations(database);
    const reopenedWorkspace = getOrCreateDefaultWorkspaceIdentityV01(database, {
      create_uuid: () => {
        throw new Error("stable workspace replay must not allocate another UUID");
      },
      now: () => {
        throw new Error("stable workspace replay must not allocate another timestamp");
      },
    });
    assert.equal(reopenedWorkspace.workspace_id, workspaceId);
    assert.equal(tableCount(database, "vnext_workspace_identities"), 1);
    const reopenedA = readCanonicalProjectWithRootV01(database, {
      workspace_id: workspaceId,
      project_id: projectAId,
    });
    assert(reopenedA);
    assert.equal(reopenedA.project.display_name, "Alpha");
    assert.equal(reopenedA.root_binding.local_root.normalized_path, rootA.normalized_path);
    assert.equal(
      findCanonicalProjectByLocalRootV01(database, {
        workspace_id: workspaceId,
        local_root: rootB,
      })?.project.project_id,
      projectBId,
    );
    assert(
      readProjectExternalRefV01(database, {
        workspace_id: workspaceId,
        project_id: projectAId,
        ref_fingerprint: repositoryFingerprint,
      }),
    );

    const pathApi = flavor === "win32" ? path.win32 : path.posix;
    const replayRoot = normalizeLocalProjectRootRefV01(
      pathApi.join(rootA.normalized_path, ".", "nested", ".."),
      { base_path: temporaryRoot, path_flavor: flavor },
    );
    const replay = getOrCreateCanonicalProjectForLocalRootV01(
      database,
      {
        workspace_id: workspaceId,
        local_root: replayRoot,
        display_name: "Alpha",
      },
      {
        create_uuid: () => {
          throw new Error("exact-root replay must not allocate a project ID");
        },
        now: () => {
          throw new Error("exact-root replay must not allocate a timestamp");
        },
      },
    );
    assert.equal(replay.status, "exact_replay");
    assert.equal(replay.project.project_id, projectAId);
    assert.equal(tableCount(database, "vnext_project_identities"), 2);
    assert.equal(tableCount(database, "vnext_project_root_bindings"), 2);
    assert.throws(
      () =>
        getOrCreateCanonicalProjectForLocalRootV01(database, {
          workspace_id: workspaceId,
          local_root: replayRoot,
          display_name: "Conflicting immutable replay metadata",
        }),
      isRegistryError("project_identity_replay_conflict"),
    );
    assert.equal(
      readCanonicalProjectIdentityV01(database, {
        workspace_id: canonicalWorkspaceId(999),
        project_id: projectAId,
      }),
      null,
    );
    assert.throws(
      () =>
        readCanonicalProjectIdentityV01(database, {
          workspace_id: workspaceId,
          project_id: LEGACY_AUGNES_PROJECT_SCOPE_V01,
        }),
      isRegistryError("project_identity_invalid"),
    );
  } finally {
    database.close();
  }

  return {
    workspace_restart_stability: true,
    project_restart_stability: true,
    exact_root_replay: true,
    replay_conflict_typed: true,
    two_root_isolation: true,
    same_repository_independence: true,
    external_ref_exact_replay: true,
    cross_project_binding_mutation_blocked: true,
    scoped_vnext_core_record_isolation: true,
  };
}

async function assertMigrationAndRuntimeLifecycle() {
  assertProjectIdentitySchemaParity();

  const emptyPath = path.join(temporaryRoot, "migration-empty.db");
  const empty = new Database(emptyPath);
  try {
    empty.pragma("foreign_keys = ON");
    const first = applyCanonicalDatabaseMigrations(empty);
    assert.deepEqual(
      first.vNextProjectIdentityRegistryResult.created_tables.sort(),
      [
        "vnext_project_external_ref_bindings",
        "vnext_project_identities",
        "vnext_project_root_bindings",
        "vnext_workspace_identities",
      ],
    );
    assertVNextProjectIdentityRegistrySchemaV01(empty);
    const firstSignature = identitySchemaSignature(empty);
    const second = applyCanonicalDatabaseMigrations(empty);
    assert.deepEqual(
      second.vNextProjectIdentityRegistryResult,
      { created_tables: [], created_indexes: [], created_triggers: [] },
    );
    assert.deepEqual(identitySchemaSignature(empty), firstSignature);
    assert.equal(
      (empty.pragma("foreign_key_check") as unknown[]).length,
      0,
    );
  } finally {
    empty.close();
  }

  const upgradePath = path.join(temporaryRoot, "migration-current-main.db");
  const upgrade = new Database(upgradePath);
  try {
    upgrade.pragma("foreign_keys = ON");
    applyCanonicalDatabaseMigrations(upgrade);
    dropProjectIdentityRegistry(upgrade);
    upgrade
      .prepare(
        `INSERT INTO work_items (
          work_id, scope, title, status, priority, summary, next_action,
          user_attention_required, related_state_keys, links, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        "AG-MIGRATION",
        LEGACY_AUGNES_PROJECT_SCOPE_V01,
        "Current-main migration sentinel",
        "planned",
        "normal",
        "preserve",
        "none",
        0,
        "[]",
        "{}",
        "2026-07-14T09:00:00.000Z",
        "2026-07-14T09:00:00.000Z",
      );
    const before = readLegacyWorkRow(upgrade, "AG-MIGRATION");
    applyCanonicalDatabaseMigrations(upgrade);
    applyCanonicalDatabaseMigrations(upgrade);
    assert.deepEqual(readLegacyWorkRow(upgrade, "AG-MIGRATION"), before);
    assertVNextProjectIdentityRegistrySchemaV01(upgrade);
  } finally {
    upgrade.close();
  }

  const openPath = path.join(temporaryRoot, "open-database-lifecycle.db");
  const openBaseline = new Database(openPath);
  openBaseline.pragma("foreign_keys = ON");
  applyCanonicalDatabaseMigrations(openBaseline);
  dropProjectIdentityRegistry(openBaseline);
  openBaseline.close();

  process.env.AUGNES_DB_PATH = openPath;
  const opened = openDatabase();
  let openWorkspaceId: string;
  try {
    assertVNextProjectIdentityRegistrySchemaV01(opened);
    openWorkspaceId = getOrCreateDefaultWorkspaceIdentityV01(opened, {
      create_uuid: () => canonicalUuid(500),
      now: () => "2026-07-14T09:30:00.000Z",
    }).workspace_id;
  } finally {
    opened.close();
  }
  const reopened = openDatabase();
  try {
    assert.equal(
      getOrCreateDefaultWorkspaceIdentityV01(reopened).workspace_id,
      openWorkspaceId,
    );
  } finally {
    reopened.close();
  }

  const runtimeRoot = path.join(temporaryRoot, "runtime-bootstrap");
  const runtimePath = path.join(runtimeRoot, "data", "augnes.db");
  const prepareRuntimeDatabaseForTest = prepareRuntimeDatabase as unknown as (
    input: {
      databasePath: string;
      backupDirectory: string;
      repositoryRoot: string;
      instanceId: string;
      databaseOverrideActive: boolean;
    },
  ) => Promise<{ databaseState: string; schemaVersion: string }>;
  const runtimeResult = await prepareRuntimeDatabaseForTest({
    databasePath: runtimePath,
    backupDirectory: path.join(runtimeRoot, "backups"),
    repositoryRoot: repoRoot,
    instanceId: "r3-project-identity",
    databaseOverrideActive: true,
  });
  assert.equal(runtimeResult.databaseState, "created");
  assert.equal(runtimeResult.schemaVersion, "current");
  verifyDatabaseFile(runtimePath);
  const runtimeDatabase = new Database(runtimePath, {
    readonly: true,
    fileMustExist: true,
  });
  try {
    assertVNextProjectIdentityRegistrySchemaV01(runtimeDatabase);
    assert.equal(
      (runtimeDatabase.pragma("foreign_key_check") as unknown[]).length,
      0,
    );
  } finally {
    runtimeDatabase.close();
  }

  return {
    empty_database: true,
    current_main_upgrade: true,
    repeated_migration: true,
    canonical_schema_parity: true,
    open_database_path: true,
    supervised_runtime_bootstrap: true,
    foreign_keys: true,
  };
}

function assertLegacyCompatibilityRead() {
  const databasePath = path.join(temporaryRoot, "legacy-compatibility.db");
  let database = new Database(databasePath);
  let beforeRows: Record<string, number>;
  let legacyWork: unknown;
  try {
    database.pragma("foreign_keys = ON");
    applyCanonicalDatabaseMigrations(database);
    database
      .prepare(
        `INSERT INTO work_items (
          work_id, scope, title, status, priority, summary, next_action,
          user_attention_required, related_state_keys, links, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        "AG-LEGACY",
        LEGACY_AUGNES_PROJECT_SCOPE_V01,
        "Legacy compatibility sentinel",
        "planned",
        "normal",
        "legacy data",
        "read only",
        0,
        "[]",
        "{}",
        "2026-07-14T08:00:00.000Z",
        "2026-07-14T08:00:00.000Z",
      );
    beforeRows = registryRowCounts(database);
    legacyWork = readLegacyWorkRow(database, "AG-LEGACY");
    const resolved = resolveLegacyProjectCompatibilityIdentityV01(database, {
      legacy_scope: LEGACY_AUGNES_PROJECT_SCOPE_V01,
    });
    assert(resolved);
    assert.equal(resolved.identity_kind, "legacy_compatibility");
    assert.equal(resolved.read_only, true);
    assert.deepEqual(registryRowCounts(database), beforeRows);
  } finally {
    database.close();
  }

  process.env.AUGNES_DB_PATH = databasePath;
  const compatibilityRead = readLegacyProjectWorkItemsCompatibilityV01({
    legacy_scope: LEGACY_AUGNES_PROJECT_SCOPE_V01,
  });
  assert(compatibilityRead);
  assert.equal(compatibilityRead.identity.identity_kind, "legacy_compatibility");
  assert.equal(compatibilityRead.identity.read_only, true);
  assert.deepEqual(
    compatibilityRead.work_items.map((item) => item.work_id),
    ["AG-LEGACY"],
    "the existing public work_items read remains available",
  );

  database = new Database(databasePath, { fileMustExist: true });
  try {
    database.pragma("foreign_keys = ON");
    assert.deepEqual(registryRowCounts(database), beforeRows!);
    const workspace = getOrCreateDefaultWorkspaceIdentityV01(database, {
      create_uuid: () => canonicalUuid(600),
      now: () => "2026-07-14T08:10:00.000Z",
    });
    const canonical = getOrCreateCanonicalProjectForLocalRootV01(
      database,
      {
        workspace_id: workspace.workspace_id,
        local_root: normalizeLocalProjectRootRefV01(
          path.join(temporaryRoot, "canonical-alongside-legacy"),
          {
            base_path: temporaryRoot,
            path_flavor: nativeLocalProjectPathFlavorV01(),
          },
        ),
        display_name: "Canonical alongside legacy",
      },
      {
        create_uuid: () => canonicalUuid(601),
        now: () => "2026-07-14T08:11:00.000Z",
      },
    );
    assert.notEqual(
      canonical.project.project_id,
      LEGACY_AUGNES_PROJECT_SCOPE_V01,
    );
    assert.deepEqual(readLegacyWorkRow(database, "AG-LEGACY"), legacyWork);
    assert.equal(
      (
        database
          .prepare(
            `SELECT COUNT(*) AS count FROM vnext_project_identities
             WHERE project_id = ?`,
          )
          .get(LEGACY_AUGNES_PROJECT_SCOPE_V01) as { count: number }
      ).count,
      0,
    );
    const countsBeforeSecondRead = registryRowCounts(database);
    const resolvedAgain = resolveLegacyProjectCompatibilityIdentityV01(
      database,
      { legacy_scope: LEGACY_AUGNES_PROJECT_SCOPE_V01 },
    );
    assert(resolvedAgain);
    assert.deepEqual(registryRowCounts(database), countsBeforeSecondRead);
  } finally {
    database.close();
  }

  return {
    explicit_read_only_identity: true,
    representative_work_items_read: true,
    compatibility_read_registry_rows_created: 0,
    legacy_rows_unchanged_by_canonical_writers: true,
    canonical_and_legacy_scopes_distinct: true,
    legacy_external_ref_bindings_created: 0,
  };
}

function assertProjectIdentitySchemaParity() {
  const canonicalSchema = readFileSync(
    path.join(repoRoot, "lib", "db", "schema.sql"),
    "utf8",
  );
  const signatures: Record<string, unknown> = {};
  for (const [source, initialize] of [
    [
      "runtime",
      (database: Database.Database) =>
        ensureVNextProjectIdentityRegistrySchemaV01(database),
    ],
    [
      "migration",
      (database: Database.Database) =>
        database.exec(vNextProjectIdentityRegistrySchemaSqlV01),
    ],
    [
      "canonical",
      (database: Database.Database) => database.exec(canonicalSchema),
    ],
  ] as const) {
    const database = new Database(":memory:");
    try {
      database.pragma("foreign_keys = ON");
      initialize(database);
      signatures[source] = identitySchemaSignature(database);
    } finally {
      database.close();
    }
  }
  assert.deepEqual(signatures.runtime, signatures.migration);
  assert.deepEqual(signatures.runtime, signatures.canonical);
}

function identitySchemaSignature(database: Database.Database) {
  const artifactNames = [
    "vnext_workspace_identities",
    "vnext_project_identities",
    "vnext_project_root_bindings",
    "vnext_project_external_ref_bindings",
    "idx_vnext_project_identities_workspace_created",
    "idx_vnext_project_root_bindings_workspace_root",
    "idx_vnext_project_external_refs_project_created",
    "trg_vnext_project_external_refs_immutable_update",
    "trg_vnext_project_external_refs_immutable_delete",
  ];
  return database
    .prepare(
      `SELECT type, name, tbl_name, sql
       FROM sqlite_master
       WHERE name IN (${artifactNames.map(() => "?").join(", ")})
       ORDER BY type, name`,
    )
    .all(...artifactNames)
    .map((row) => {
      const typed = row as {
        type: string;
        name: string;
        tbl_name: string;
        sql: string | null;
      };
      return {
        type: typed.type,
        name: typed.name,
        table_name: typed.tbl_name,
        sql: typed.sql
          ?.replace(/\bIF\s+NOT\s+EXISTS\b/gi, "")
          .replace(/\s+/g, " ")
          .trim(),
      };
    });
}

function dropProjectIdentityRegistry(database: Database.Database) {
  database.exec(`
    DROP TRIGGER IF EXISTS trg_vnext_project_external_refs_immutable_update;
    DROP TRIGGER IF EXISTS trg_vnext_project_external_refs_immutable_delete;
    DROP TABLE IF EXISTS vnext_project_external_ref_bindings;
    DROP TABLE IF EXISTS vnext_project_root_bindings;
    DROP TABLE IF EXISTS vnext_project_identities;
    DROP TABLE IF EXISTS vnext_workspace_identities;
  `);
}

function registryRowCounts(database: Database.Database) {
  return {
    workspaces: tableCount(database, "vnext_workspace_identities"),
    projects: tableCount(database, "vnext_project_identities"),
    roots: tableCount(database, "vnext_project_root_bindings"),
    external_refs: tableCount(
      database,
      "vnext_project_external_ref_bindings",
    ),
  };
}

function tableCount(database: Database.Database, table: string): number {
  return (
    database.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get() as {
      count: number;
    }
  ).count;
}

function readLegacyWorkRow(database: Database.Database, workId: string) {
  return database
    .prepare(
      "SELECT * FROM work_items WHERE scope = ? AND work_id = ?",
    )
    .get(LEGACY_AUGNES_PROJECT_SCOPE_V01, workId);
}

function repositoryExternalRef(): ExternalRefV01 {
  return {
    ref_version: "external_ref.v0.1",
    ref_type: "git_repository",
    external_id: "https://example.invalid/shared/repository.git",
    provider: "git",
    host: "example.invalid",
    observed_at: "2026-07-14T10:00:00.000Z",
    trust_class: "direct_local_observation",
  };
}

function timestampSequence() {
  let second = 0;
  return () =>
    `2026-07-14T10:00:${String(second++).padStart(2, "0")}.000Z`;
}

function uuidSequence(start: number) {
  let next = start;
  return () => canonicalUuid(next++);
}

function canonicalUuid(value: number): string {
  return `00000000-0000-4000-8000-${String(value).padStart(12, "0")}`;
}

function canonicalWorkspaceId(value: number): string {
  return `workspace:${canonicalUuid(value)}`;
}

function isRegistryError(code: ProjectIdentityRegistryErrorV01["code"]) {
  return (error: unknown) =>
    error instanceof ProjectIdentityRegistryErrorV01 && error.code === code;
}

function createDirectoryLink(target: string, link: string): boolean {
  try {
    symlinkSync(target, link, process.platform === "win32" ? "junction" : "dir");
    return true;
  } catch (error) {
    if (
      process.platform === "win32" &&
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      ["EPERM", "EACCES", "UNKNOWN"].includes(String(error.code))
    ) {
      symlinkCapabilityExclusion = `directory_junction_unavailable_${String(
        error.code,
      )}`;
      return false;
    }
    throw error;
  }
}
