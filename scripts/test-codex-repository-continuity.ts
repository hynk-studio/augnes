#!/usr/bin/env node

import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import Database from "better-sqlite3";

import { POST as repositoryContinuityPOST } from "../app/api/augnes/read/codex-repository-continuity/route";
import { StateRuntimeHttpAdapter } from "../apps/augnes_apps/src/adapters/state-runtime-http";
import {
  readCodexRepositoryContinuityV01,
  resolveCodexRepositoryProjectV01,
} from "../lib/vnext/codex-repository-continuity/codex-repository-continuity";
import {
  getOrCreateCanonicalProjectForLocalRootV01,
  getOrCreateDefaultWorkspaceIdentityV01,
  normalizeLocalProjectRootRefV01,
} from "../lib/vnext/persistence/project-identity-registry";
import {
  readActiveProjectSelectionV01,
  selectActiveProjectV01,
} from "../lib/vnext/persistence/project-lifecycle-registry";
import { defineInitialProjectWorkV01 } from "../lib/vnext/runtime/project-work-initialization";
import { revisePreExecutionProjectWorkV01 } from "../lib/vnext/runtime/project-work-revision";
import { readProjectHomeProjectionV01 } from "../lib/vnext/project-home/project-home-projection";
import {
  consumeVNextLocalOperatorBootstrapV01,
  issueVNextLocalOperatorBootstrapV01,
  type VNextLocalOperatorPilotConfigV01,
} from "../lib/vnext/runtime/local-operator-session";
import { applyCanonicalDatabaseMigrations } from "./canonical-database-migrations.mjs";

const NOW = "2026-08-03T00:00:00.000Z";
const ROOT = mkdtempSync(path.join(tmpdir(), "augnes-cdx2b1-"));

void main().finally(() => rmSync(ROOT, { recursive: true, force: true }));

async function main(): Promise<void> {
  await assertRepositoryResolutionMatrixV01();
  await assertRepositoryAttachmentUsesExactProjectContinuityV01();
  await assertLiveRouteAndBridgeIdentityV01();
  console.log(JSON.stringify({
    status: "pass",
    contract: "codex_repository_continuity.v0.1",
    physical_root_resolution: true,
    active_selection_independent_target: true,
    cdx2a_projection_reused: true,
    zero_mutation: true,
  }, null, 2));
}

async function assertLiveRouteAndBridgeIdentityV01(): Promise<void> {
  const databasePath = path.join(ROOT, "route.db");
  const db = new Database(databasePath);
  db.pragma("foreign_keys = ON");
  applyCanonicalDatabaseMigrations(db);
  const workspace = workspaceV01(db);
  const repositoryRoot = projectRootV01("route-project");
  registerV01(db, workspace.workspace_id, repositoryRoot, "Route Project", "30000000-0000-4000-8000-000000000001");
  db.close();

  const originalEnvironment = { ...process.env };
  const originalFetch = globalThis.fetch;
  try {
    Object.assign(process.env, {
      AUGNES_DB_PATH: databasePath,
      AUGNES_RUNTIME_CHILD_ROLE: "ui",
      AUGNES_RUNTIME_INSTANCE_ID: "instance-route",
      AUGNES_RUNTIME_GENERATION_ID: "generation-route",
      AUGNES_RUNTIME_REPOSITORY_FINGERPRINT: "f".repeat(64),
    });
    delete process.env.AUGNES_RECOVERY_MODE;
    const request = () => new Request(
      "http://127.0.0.1:3000/api/augnes/read/codex-repository-continuity?scope=repository%3Alocal",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-augnes-local-readonly": "codex-repository-continuity-v0.1",
        },
        body: JSON.stringify({ repository_root: repositoryRoot }),
      },
    );
    const routeResponse = await repositoryContinuityPOST(request());
    assert.equal(routeResponse.status, 200);
    assert.equal(routeResponse.headers.get("x-augnes-runtime-instance"), "instance-route");
    assert.equal((await routeResponse.clone().json()).repository_resolution.status, "resolved_exact");

    globalThis.fetch = async (input, init) => repositoryContinuityPOST(new Request(input, init));
    const adapter = new StateRuntimeHttpAdapter({
      apiBaseUrl: "http://127.0.0.1:3000",
      runtimeInstanceId: "instance-route",
      runtimeGenerationId: "generation-route",
      runtimeRepositoryFingerprint: "f".repeat(64),
    });
    assert.equal((await adapter.getRepositoryContinuity({ repositoryRoot })).repository_resolution.status, "resolved_exact");

    const foreignAdapter = new StateRuntimeHttpAdapter({
      apiBaseUrl: "http://127.0.0.1:3000",
      runtimeInstanceId: "foreign-instance",
      runtimeGenerationId: "generation-route",
      runtimeRepositoryFingerprint: "f".repeat(64),
    });
    await assert.rejects(
      foreignAdapter.getRepositoryContinuity({ repositoryRoot }),
      /runtime identity did not match/u,
    );

    process.env.AUGNES_RECOVERY_MODE = "1";
    assert.equal((await repositoryContinuityPOST(request())).status, 503);
  } finally {
    globalThis.fetch = originalFetch;
    process.env = originalEnvironment;
  }
}

async function assertRepositoryResolutionMatrixV01(): Promise<void> {
  const db = databaseV01("resolution");
  try {
    const workspace = workspaceV01(db);
    const exactRoot = projectRootV01("exact");
    const exact = registerV01(db, workspace.workspace_id, exactRoot, "Exact", "10000000-0000-4000-8000-000000000001");

    const resolved = await resolveCodexRepositoryProjectV01(db, {
      repository_root: exactRoot,
    });
    assert.equal(resolved.status, "resolved_exact");
    assert.equal(resolved.project_id, exact.project.project_id);

    const aliasRoot = path.join(ROOT, "exact-alias");
    symlinkSync(exactRoot, aliasRoot, "dir");
    const alias = await resolveCodexRepositoryProjectV01(db, {
      repository_root: aliasRoot,
    });
    assert.equal(alias.status, "resolved_exact");
    assert.equal(alias.project_id, exact.project.project_id);

    assert.equal((await resolveCodexRepositoryProjectV01(db, {
      repository_root: projectRootV01("unregistered"),
    })).status, "project_not_registered");
    assert.equal((await resolveCodexRepositoryProjectV01(db, {
      repository_root: path.join(ROOT, "missing"),
    })).status, "root_unavailable");
    assert.equal((await resolveCodexRepositoryProjectV01(db, {
      repository_root: "relative/repository",
    })).status, "repository_input_invalid");

    const shared = projectRootV01("shared");
    const sharedAliasA = path.join(ROOT, "shared-a");
    const sharedAliasB = path.join(ROOT, "shared-b");
    symlinkSync(shared, sharedAliasA, "dir");
    symlinkSync(shared, sharedAliasB, "dir");
    registerV01(db, workspace.workspace_id, sharedAliasA, "Shared A", "10000000-0000-4000-8000-000000000002");
    registerV01(db, workspace.workspace_id, sharedAliasB, "Shared B", "10000000-0000-4000-8000-000000000003");
    assert.equal((await resolveCodexRepositoryProjectV01(db, {
      repository_root: shared,
    })).status, "project_ambiguous");
    assert.equal((await resolveCodexRepositoryProjectV01(db, {
      repository_root: sharedAliasA,
    })).status, "project_ambiguous");

    let inspection = 0;
    const changed = await resolveCodexRepositoryProjectV01(db, {
      repository_root: exactRoot,
    }, {
      inspect_physical_root: async () => ({
        identity_version: "native_host_physical_root_identity.v0.1",
        canonical_realpath_fingerprint: `sha256:${String(++inspection).padStart(64, "0")}`,
        device: "1",
        inode: "1",
      }),
    });
    assert.equal(changed.status, "root_identity_changed");
  } finally {
    db.close();
  }
}

async function assertRepositoryAttachmentUsesExactProjectContinuityV01(): Promise<void> {
  const db = databaseV01("continuity");
  try {
    const workspace = workspaceV01(db);
    const rootA = projectRootV01("project-a");
    const rootB = projectRootV01("project-b");
    const projectA = registerV01(db, workspace.workspace_id, rootA, "Project A", "20000000-0000-4000-8000-000000000001");
    const projectB = registerV01(db, workspace.workspace_id, rootB, "Project B", "20000000-0000-4000-8000-000000000002");
    selectV01(db, workspace.workspace_id, projectA.project.project_id, null, null);

    const config: VNextLocalOperatorPilotConfigV01 = {
      enabled: true,
      workspace_id: workspace.workspace_id,
      project_id: projectA.project.project_id,
      operator_id: "operator:cdx2b1",
      database_path: path.join(ROOT, "continuity.db"),
    };
    const issued = issueVNextLocalOperatorBootstrapV01(db, {
      config,
      clock: { now: () => NOW },
    });
    const credential = consumeVNextLocalOperatorBootstrapV01(db, {
      config,
      bootstrap_token: issued.bootstrap_token,
      clock: { now: () => "2026-08-03T00:00:01.000Z" },
    }).credential;
    const initial = defineInitialProjectWorkV01(db, {
      config,
      credential,
      request: {
        action: "define_initial_project_work",
        workspace_id: workspace.workspace_id,
        project_id: projectA.project.project_id,
        expected_active_project_id: projectA.project.project_id,
        expected_active_selection_revision: readActiveProjectSelectionV01(db, workspace.workspace_id)!.selection_revision,
        expected_initialization_state: "not_defined",
        goal: "Continue exact repository A work",
        success_criteria: ["Codex and Browser use one canonical packet"],
        non_goals: ["Do not attach Browser project B"],
      },
      clock: { now: () => "2026-08-03T00:00:02.000Z" },
    });

    const beforeSelection = await readCodexRepositoryContinuityV01(db, {
      repository_root: rootA,
      generated_at: "2026-08-03T00:00:03.000Z",
      browser_base_url: "http://127.0.0.1:3000",
    }, continuityDependenciesV01(config));
    assert.equal(beforeSelection.repository_resolution.status, "resolved_exact");
    assert.equal(beforeSelection.continuity?.projection_version, "codex_current_continuity.v0.1");
    assert.equal(beforeSelection.continuity?.current_work.goal, "Continue exact repository A work");
    assert.match(beforeSelection.browser_deep_link ?? "", /^http:\/\/127\.0\.0\.1:3000\/projects\//u);
    const browserProjection = await readProjectHomeProjectionV01(db, {
      workspace_id: workspace.workspace_id,
      project_id: projectA.project.project_id,
    }, {
      now: () => "2026-08-03T00:00:03.000Z",
      read_root_availability: async () => "available",
    });
    assert.equal(browserProjection.project_id, projectA.project.project_id);
    assert.equal(browserProjection.coordination.task_frame.goal, beforeSelection.continuity?.current_work.goal);

    const beforeSelectionRevision = readActiveProjectSelectionV01(db, workspace.workspace_id)!.selection_revision;
    selectV01(db, workspace.workspace_id, projectB.project.project_id, projectA.project.project_id, beforeSelectionRevision);
    const afterSelection = await readCodexRepositoryContinuityV01(db, {
      repository_root: rootA,
      generated_at: "2026-08-03T00:00:04.000Z",
      browser_base_url: "http://127.0.0.1:3000",
    }, continuityDependenciesV01(config));
    assert.equal(afterSelection.repository_resolution.project_key, beforeSelection.repository_resolution.project_key);
    assert.equal(afterSelection.continuity?.current_work.goal, "Continue exact repository A work");
    assert.equal(readActiveProjectSelectionV01(db, workspace.workspace_id)!.project_id, projectB.project.project_id);
    assert.deepEqual(afterSelection.authority, beforeSelection.authority);
    assert.equal(Object.values(afterSelection.authority).every((value) => value === false), true);

    const selectedB = readActiveProjectSelectionV01(db, workspace.workspace_id)!;
    selectV01(db, workspace.workspace_id, projectA.project.project_id, projectB.project.project_id, selectedB.selection_revision);
    config.operator_id = "operator:cdx2b1-revision";
    const revisionBootstrap = issueVNextLocalOperatorBootstrapV01(db, {
      config,
      clock: { now: () => "2026-08-03T00:00:04.100Z" },
    });
    const revisionCredential = consumeVNextLocalOperatorBootstrapV01(db, {
      config,
      bootstrap_token: revisionBootstrap.bootstrap_token,
      clock: { now: () => "2026-08-03T00:00:04.200Z" },
    }).credential;
    revisePreExecutionProjectWorkV01(db, {
      config,
      credential: revisionCredential,
      request: {
        action: "revise_pre_execution_project_work",
        workspace_id: workspace.workspace_id,
        project_id: projectA.project.project_id,
        expected_active_project_id: projectA.project.project_id,
        expected_active_selection_revision: readActiveProjectSelectionV01(db, workspace.workspace_id)!.selection_revision,
        expected_current_packet_id: initial.packet.packet_id,
        expected_current_packet_fingerprint: initial.packet.integrity.fingerprint,
        expected_current_lineage_kind: "initial_user_defined",
        goal: "Continue revised repository A work",
        success_criteria: ["Browser and Codex refresh to one revised packet"],
        non_goals: ["Do not create a Codex-only copy"],
      },
      clock: { now: () => "2026-08-03T00:00:05.000Z" },
    });
    const afterRevision = await readCodexRepositoryContinuityV01(db, {
      repository_root: rootA,
      generated_at: "2026-08-03T00:00:06.000Z",
    }, continuityDependenciesV01(config));
    assert.equal(afterRevision.continuity?.current_work.goal, "Continue revised repository A work");
    assert.notEqual(afterRevision.continuity?.snapshot.binding, beforeSelection.continuity?.snapshot.binding);
  } finally {
    db.close();
  }
}

function databaseV01(name: string): Database.Database {
  const db = new Database(path.join(ROOT, `${name}.db`));
  db.pragma("foreign_keys = ON");
  applyCanonicalDatabaseMigrations(db);
  return db;
}

function workspaceV01(db: Database.Database) {
  return getOrCreateDefaultWorkspaceIdentityV01(db, {
    create_uuid: () => "00000000-0000-4000-8000-000000000001",
    now: () => NOW,
  });
}

function projectRootV01(name: string): string {
  const root = path.join(ROOT, name);
  mkdirSync(root, { recursive: true });
  writeFileSync(path.join(root, "README.md"), `# ${name}\n`, "utf8");
  return root;
}

function registerV01(db: Database.Database, workspaceId: string, root: string, displayName: string, uuid: string) {
  return getOrCreateCanonicalProjectForLocalRootV01(db, {
    workspace_id: workspaceId,
    local_root: normalizeLocalProjectRootRefV01(root, { base_path: ROOT }),
    display_name: displayName,
  }, { create_uuid: () => uuid, now: () => NOW });
}

function selectV01(db: Database.Database, workspaceId: string, projectId: string, expectedProjectId: string | null, expectedRevision: number | null): void {
  selectActiveProjectV01(db, {
    workspace_id: workspaceId,
    project_id: projectId,
    expected_project_id: expectedProjectId,
    expected_revision: expectedRevision,
    now: NOW,
  });
}

function continuityDependenciesV01(config: VNextLocalOperatorPilotConfigV01) {
  return {
    read_root_availability: async () => "available" as const,
    read_operator_config: () => config,
  };
}
