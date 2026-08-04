#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import Database from "better-sqlite3";

import {
  confirmLocalProjectOnboardingV01,
  pickAndInspectLocalProjectV01,
} from "../lib/vnext/onboarding/local-project-onboarding";
import {
  getOrCreateCanonicalProjectForLocalRootV01,
  normalizeLocalProjectRootRefV01,
  VNEXT_PROJECT_IDENTITY_REGISTRY_SCHEMA_SQL_V01,
} from "../lib/vnext/persistence/project-identity-registry";
import { VNEXT_REPOSITORY_EXECUTION_STORE_SCHEMA_SQL_V01 } from "../lib/vnext/persistence/repository-execution-store";
import {
  readActiveProjectSelectionV01,
  selectActiveProjectV01,
} from "../lib/vnext/persistence/project-lifecycle-registry";
import {
  adoptLegacyPhysicalRootBaselineV01,
  inspectPhysicalRootForExecutionV01,
  prepareRepositoryExecutionV01,
  previewRepositoryExecutionRootRebindV01,
  projectPhysicalRootMutationResultV01,
  readProjectExecutionAdmissionV01,
  rebindRepositoryExecutionRootV01,
  revokeRepositoryExecutionAttachmentV01,
  validateRepositoryExecutionAttachmentV01,
} from "../lib/vnext/repository-execution/repository-execution";
import { defineInitialProjectWorkV01 } from "../lib/vnext/runtime/project-work-initialization";
import { revisePreExecutionProjectWorkV01 } from "../lib/vnext/runtime/project-work-revision";
import { exportActivePortableProjectV01 } from "../lib/vnext/portability/portable-project";
import {
  consumeVNextLocalOperatorBootstrapV01,
  issueVNextLocalOperatorBootstrapV01,
  type VNextLocalOperatorPilotConfigV01,
} from "../lib/vnext/runtime/local-operator-session";
import { applyCanonicalDatabaseMigrations } from "./canonical-database-migrations.mjs";
import { vNextRepositoryExecutionStoreSchemaSqlV01 } from "./db-migrations.mjs";
import { validateRecoveryCanonicalDatabaseV01 } from "./recovery-canonical-record-validator";

const ROOT = mkdtempSync(path.join(tmpdir(), "augnes-cdx2b2a-"));
const DATABASE_PATH = path.join(ROOT, "augnes.db");
const originalEnvironment = { ...process.env };

void main().finally(() => {
  process.env = originalEnvironment;
  rmSync(ROOT, { recursive: true, force: true });
});

async function main(): Promise<void> {
  process.env.AUGNES_CANONICAL_TEST_MODE = "1";
  process.env.AUGNES_CANONICAL_TEMP_ROOT = ROOT;
  assertSchemaParityV01();
  const rootA = createRepository("repository-a");
  const rootB = createRepository("repository-b");
  const db = openDatabaseV01();
  try {
    const projectA = await onboardV01(db, rootA, "Repository A", "2026-08-04T00:00:00.000Z");
    const workspaceId = projectA.workspace_id;
    const baselineCountAfterA = count(db, "vnext_physical_root_baselines");
    assert.equal(baselineCountAfterA, 1, "new onboarding must atomically create one physical baseline");
    const projectB = await onboardV01(db, rootB, "Repository B", "2026-08-04T00:00:01.000Z");
    assert.equal(count(db, "vnext_physical_root_baselines"), 2);

    const rootAlias = path.join(ROOT, "repository-a-alias");
    symlinkSync(rootA, rootAlias, "dir");
    const [canonicalObservation, aliasObservation] = await Promise.all([
      inspectPhysicalRootForExecutionV01(db, rootA),
      inspectPhysicalRootForExecutionV01(db, rootAlias),
    ]);
    assert.equal(canonicalObservation.status, "exact");
    assert.equal(aliasObservation.status, "exact");
    assert.equal(
      aliasObservation.status === "exact" ? aliasObservation.observation_fingerprint : null,
      canonicalObservation.status === "exact"
        ? canonicalObservation.observation_fingerprint
        : null,
      "a symlink alias must observe the same physical root identity",
    );

    selectProjectV01(db, workspaceId, projectA.project_id);
    const initial = defineWorkV01(db, projectA.project_id, "Repository A exact work", "2026-08-04T00:00:02.000Z");
    const projectFilesBeforePrepare = snapshotProjectFiles(rootA);
    const preparedA = await prepareRepositoryExecutionV01(db, {
      workspace_id: workspaceId,
      project_id: projectA.project_id,
    }, { now: () => "2026-08-04T00:00:03.000Z" });
    assert.equal(preparedA.status, "prepared");
    assert(preparedA.attachment);
    assert.equal(preparedA.ordinary_text, "Repository A is ready to continue.");
    assert.equal(Object.values(preparedA.authority).every((value) => value === false), true);
    assert.deepEqual(snapshotProjectFiles(rootA), projectFilesBeforePrepare);
    assert.equal(count(db, "autonomy_runs"), 0);

    const exactReplay = await prepareRepositoryExecutionV01(db, {
      workspace_id: workspaceId,
      project_id: projectA.project_id,
    }, { now: () => "2026-08-04T00:00:04.000Z" });
    assert.equal(exactReplay.attachment?.attachment_id, preparedA.attachment.attachment_id);
    assert.equal(count(db, "vnext_repository_execution_attachments"), 1);

    selectProjectV01(db, workspaceId, projectB.project_id);
    const selectedBAdmission = await readProjectExecutionAdmissionV01(db, {
      workspace_id: workspaceId,
      project_id: projectA.project_id,
    }, { now: () => "2026-08-04T00:00:05.000Z" });
    assert.equal(selectedBAdmission.readiness, "ready");
    assert.equal(selectedBAdmission.browser_observation.selected_project_is_target, false);
    assert.equal(selectedBAdmission.admission_fingerprint, preparedA.admission?.admission_fingerprint);
    const afterBrowserSelection = await prepareRepositoryExecutionV01(db, {
      workspace_id: workspaceId,
      project_id: projectA.project_id,
    }, { now: () => "2026-08-04T00:00:06.000Z" });
    assert.equal(afterBrowserSelection.attachment?.binding_fingerprint, preparedA.attachment.binding_fingerprint);

    writeFileSync(path.join(rootB, "only-b.txt"), "unrelated B change\n", "utf8");
    const afterBChange = await prepareRepositoryExecutionV01(db, {
      workspace_id: workspaceId,
      project_id: projectA.project_id,
    }, { now: () => "2026-08-04T00:00:07.000Z" });
    assert.equal(afterBChange.attachment?.binding_fingerprint, preparedA.attachment.binding_fingerprint);

    selectProjectV01(db, workspaceId, projectA.project_id);
    reviseWorkV01(db, projectA.project_id, initial, "Repository A revised work", "2026-08-04T00:00:08.000Z");
    const staleAfterRevision = await validateRepositoryExecutionAttachmentV01(
      db,
      preparedA.attachment.attachment_id,
      { now: () => "2026-08-04T00:00:09.000Z" },
    );
    assert.equal(staleAfterRevision?.lifecycle, "stale");
    assert.equal(staleAfterRevision?.stale_reason, "packet_changed");

    const revisedAttachment = await prepareRepositoryExecutionV01(db, {
      workspace_id: workspaceId,
      project_id: projectA.project_id,
    }, { now: () => "2026-08-04T00:00:10.000Z" });
    assert.equal(revisedAttachment.status, "prepared");
    assert.notEqual(revisedAttachment.attachment?.attachment_id, preparedA.attachment.attachment_id);
    writeFileSync(path.join(rootA, "untracked-change.txt"), "bounded change\n", "utf8");
    const staleAfterWorktree = await validateRepositoryExecutionAttachmentV01(
      db,
      revisedAttachment.attachment!.attachment_id,
      { now: () => "2026-08-04T00:00:11.000Z" },
    );
    assert.equal(staleAfterWorktree?.stale_reason, "worktree_changed");
    rmSync(path.join(rootA, "untracked-change.txt"));

    const revocable = await prepareRepositoryExecutionV01(db, {
      workspace_id: workspaceId,
      project_id: projectA.project_id,
    }, { now: () => "2026-08-04T00:00:12.000Z" });
    const revoked = revokeRepositoryExecutionAttachmentV01(db, {
      attachment_id: revocable.attachment!.attachment_id,
      expected_binding_fingerprint: revocable.attachment!.binding_fingerprint,
      user_intent: "revoke_repository_execution_attachment",
      now: "2026-08-04T00:00:13.000Z",
    });
    assert.equal(revoked.lifecycle, "revoked");
    assert.equal(revoked.stale_reason, "explicitly_revoked");
    assert.equal(revokeRepositoryExecutionAttachmentV01(db, {
      attachment_id: revoked.attachment_id,
      expected_binding_fingerprint: revoked.binding_fingerprint,
      user_intent: "revoke_repository_execution_attachment",
    }).attachment_id, revoked.attachment_id);

    const legacyRoot = createRepository("legacy-repository");
    const legacy = getOrCreateCanonicalProjectForLocalRootV01(db, {
      workspace_id: workspaceId,
      local_root: normalizeLocalProjectRootRefV01(legacyRoot, { base_path: ROOT }),
      display_name: "Legacy Repository",
    }, {
      create_uuid: () => "50000000-0000-4000-8000-000000000001",
      now: () => "2026-08-04T00:00:14.000Z",
    });
    const legacyAdmission = await readProjectExecutionAdmissionV01(db, {
      workspace_id: workspaceId,
      project_id: legacy.project.project_id,
    }, { now: () => "2026-08-04T00:00:15.000Z" });
    assert.equal(legacyAdmission.reason, "baseline_adoption_required");
    assert.equal(legacyAdmission.readiness, "decision_required");
    assert(legacyAdmission.physical_root_observation_fingerprint);
    await assert.rejects(adoptLegacyPhysicalRootBaselineV01(db, {
      workspace_id: workspaceId,
      project_id: legacy.project.project_id,
      expected_admission_fingerprint: "sha256:stale",
      expected_observation_fingerprint: legacyAdmission.physical_root_observation_fingerprint,
      user_intent: "adopt_current_root",
    }), /baseline_adoption_stale/u);
    const adoption = await adoptLegacyPhysicalRootBaselineV01(db, {
      workspace_id: workspaceId,
      project_id: legacy.project.project_id,
      expected_admission_fingerprint: legacyAdmission.admission_fingerprint,
      expected_observation_fingerprint: legacyAdmission.physical_root_observation_fingerprint,
      user_intent: "adopt_current_root",
    }, { now: () => "2026-08-04T00:00:15.000Z" });
    assert.equal(adoption.status, "adopted");
    const adoptionProjection = projectPhysicalRootMutationResultV01(
      adoption,
      "This folder is now the project's trusted execution root.",
    );
    const adoptionProjectionText = JSON.stringify(adoptionProjection);
    for (const forbidden of [
      "filesystem_volume_identity",
      "filesystem_object_identity",
      "canonical_realpath_fingerprint",
      "root_binding_fingerprint",
      "node_scope_fingerprint",
      legacyRoot,
    ]) {
      assert.equal(adoptionProjectionText.includes(forbidden), false);
    }
    assert.equal((await adoptLegacyPhysicalRootBaselineV01(db, {
      workspace_id: workspaceId,
      project_id: legacy.project.project_id,
      expected_admission_fingerprint: legacyAdmission.admission_fingerprint,
      expected_observation_fingerprint: legacyAdmission.physical_root_observation_fingerprint,
      user_intent: "adopt_current_root",
    }, { now: () => "2026-08-04T00:00:16.000Z" })).status, "exact_replay");

    const portable = exportActivePortableProjectV01(db, {
      include_personal_perspective: false,
      exported_at: "2026-08-04T00:00:16.500Z",
    });
    const portableText = new TextDecoder().decode(portable.bytes);
    assert.equal(portableText.includes("filesystem_volume_identity"), false);
    assert.equal(portableText.includes("filesystem_object_identity"), false);
    assert.equal(portableText.includes("repository_execution_attachment.v0.1"), false);
    assert.equal(
      portable.package.manifest.exclusions.includes(
        "machine_local_physical_root_baselines_and_execution_attachments",
      ),
      true,
    );

    const backupPath = path.join(ROOT, "attachment-backup.db");
    await db.backup(backupPath);
    const restored = new Database(backupPath, { readonly: true, fileMustExist: true });
    try {
      assert.equal(count(restored, "vnext_physical_root_baselines"), count(db, "vnext_physical_root_baselines"));
      assert.equal(count(restored, "vnext_repository_execution_attachments"), count(db, "vnext_repository_execution_attachments"));
      assert.equal(validateRecoveryCanonicalDatabaseV01(restored).status, "valid");
    } finally {
      restored.close();
    }
    const unsupported = await readProjectExecutionAdmissionV01(db, {
      workspace_id: workspaceId,
      project_id: projectA.project_id,
    }, { platform: "win32", now: () => "2026-08-04T00:00:17.000Z" });
    assert.equal(unsupported.reason, "identity_unsupported");
    const crossNode = await readProjectExecutionAdmissionV01(db, {
      workspace_id: workspaceId,
      project_id: projectA.project_id,
    }, {
      platform: "darwin",
      node_scope_root: "/virtual/augnes-node-b",
      physical_identity_filesystem: {
        async realpath(pathname) { return pathname; },
        async stat(pathname) {
          return {
            dev: pathname === "/virtual/augnes-node-b" ? 91 : 92,
            ino: pathname === "/virtual/augnes-node-b" ? 101 : 102,
            isDirectory: () => true,
          };
        },
      },
      now: () => "2026-08-04T00:00:17.100Z",
    });
    assert.equal(crossNode.reason, "baseline_adoption_required");
    const ambiguous = await readProjectExecutionAdmissionV01(db, {
      workspace_id: workspaceId,
      project_id: projectA.project_id,
    }, {
      platform: "darwin",
      node_scope_root: "/virtual/ambiguous-node",
      physical_identity_filesystem: {
        async realpath(pathname) { return pathname; },
        async stat() { return { dev: 0, ino: 0, isDirectory: () => true }; },
      },
      now: () => "2026-08-04T00:00:17.200Z",
    });
    assert.equal(ambiguous.reason, "identity_ambiguous");
    const networkFilesystem = await readProjectExecutionAdmissionV01(db, {
      workspace_id: workspaceId,
      project_id: projectA.project_id,
    }, {
      platform: "linux",
      filesystem_type: async () => 0x6969,
      now: () => "2026-08-04T00:00:17.250Z",
    });
    assert.equal(networkFilesystem.reason, "identity_unsupported");
    const darwinNetworkFilesystem = await readProjectExecutionAdmissionV01(db, {
      workspace_id: workspaceId,
      project_id: projectA.project_id,
    }, {
      platform: "darwin",
      filesystem_type: async () => 27,
      now: () => "2026-08-04T00:00:17.260Z",
    });
    assert.equal(darwinNetworkFilesystem.reason, "identity_unsupported");
    const darwinVirtualFilesystem = await readProjectExecutionAdmissionV01(db, {
      workspace_id: workspaceId,
      project_id: projectA.project_id,
    }, {
      platform: "darwin",
      filesystem_type: async () => 15,
      now: () => "2026-08-04T00:00:17.270Z",
    });
    assert.equal(darwinVirtualFilesystem.reason, "identity_ambiguous");

    const rebindRoot = createRepository("rebind-repository");
    const rebindProject = await onboardV01(
      db,
      rebindRoot,
      "Rebind Repository",
      "2026-08-04T00:00:17.300Z",
    );
    const rebindInitial = defineWorkV01(
      db,
      rebindProject.project_id,
      "Prove exact root rebind",
      "2026-08-04T00:00:17.400Z",
    );
    assert(rebindInitial.packet.packet_id);
    const beforeRebind = await prepareRepositoryExecutionV01(db, {
      workspace_id: workspaceId,
      project_id: rebindProject.project_id,
    }, { now: () => "2026-08-04T00:00:17.500Z" });
    assert(beforeRebind.attachment && beforeRebind.admission);
    const movedRoot = `${rebindRoot}-moved`;
    renameSync(rebindRoot, movedRoot);
    const missingRootAdmission = await readProjectExecutionAdmissionV01(db, {
      workspace_id: workspaceId,
      project_id: rebindProject.project_id,
    }, { now: () => "2026-08-04T00:00:17.550Z" });
    assert.equal(missingRootAdmission.reason, "identity_unavailable");
    const movedObservation = await inspectPhysicalRootForExecutionV01(
      db,
      movedRoot,
      { now: () => "2026-08-04T00:00:17.600Z" },
    );
    assert.equal(movedObservation.status, "exact");
    const rebindPreview = await previewRepositoryExecutionRootRebindV01(db, {
      workspace_id: workspaceId,
      project_id: rebindProject.project_id,
      new_local_root: normalizeLocalProjectRootRefV01(movedRoot, { base_path: ROOT }),
    }, { now: () => "2026-08-04T00:00:17.600Z" });
    assert.equal(rebindPreview.status, "ready");
    assert.equal(rebindPreview.authority.execution_authority_granted, false);
    const rebindInput = {
      workspace_id: workspaceId,
      project_id: rebindProject.project_id,
      new_local_root: normalizeLocalProjectRootRefV01(movedRoot, { base_path: ROOT }),
      expected_old_root_binding_fingerprint: rebindPreview.expected_old_root_binding_fingerprint!,
      expected_old_baseline_fingerprint: rebindPreview.expected_old_baseline_fingerprint,
      expected_new_observation_fingerprint: rebindPreview.expected_new_observation_fingerprint!,
      user_intent: "rebind_project_root" as const,
    };
    const rebound = await rebindRepositoryExecutionRootV01(db, rebindInput, {
      now: () => "2026-08-04T00:00:17.600Z",
    });
    assert.equal(rebound.status, "rebound");
    const rebindProjectionText = JSON.stringify(projectPhysicalRootMutationResultV01(
      rebound,
      "The project's trusted execution root has been updated.",
    ));
    assert.equal(rebindProjectionText.includes(movedRoot), false);
    assert.equal(rebindProjectionText.includes("filesystem_object_identity"), false);
    assert.notEqual(
      rebound.baseline.baseline_fingerprint,
      beforeRebind.admission.physical_root_baseline_fingerprint,
    );
    assert.equal(
      (await validateRepositoryExecutionAttachmentV01(
        db,
        beforeRebind.attachment.attachment_id,
      ))?.stale_reason,
      "root_binding_changed",
    );
    assert.equal((await rebindRepositoryExecutionRootV01(db, rebindInput, {
      now: () => "2026-08-04T00:00:17.700Z",
    })).status, "exact_replay");
    selectProjectV01(db, workspaceId, projectA.project_id);

    const conflictCandidate = await prepareRepositoryExecutionV01(db, {
      workspace_id: workspaceId,
      project_id: projectA.project_id,
    }, { now: () => "2026-08-04T00:00:17.800Z" });
    assert(conflictCandidate.attachment);
    db.prepare(
      `INSERT INTO autonomy_runs (
        run_id, scope, autonomy_contract_ref, title, status, scheduled_for,
        started_at, finished_at, created_at, updated_at, stop_reason,
        source_refs_json, authority_boundary_json, budget_snapshot_json,
        metadata_json
      ) VALUES (?, ?, NULL, ?, 'queued', NULL, NULL, NULL, ?, ?, NULL, '{}', '{}', '{}', ?)`,
    ).run(
      "autonomy-run:cdx2b2a-conflict-fixture",
      projectA.project_id,
      "CDX2B2A conflict fixture",
      "2026-08-04T00:00:17.850Z",
      "2026-08-04T00:00:17.850Z",
      JSON.stringify({
        workspace_id: workspaceId,
        project_id: projectA.project_id,
        lifecycle_mode: "managed_live",
      }),
    );
    assert.equal((await validateRepositoryExecutionAttachmentV01(
      db,
      conflictCandidate.attachment.attachment_id,
      { now: () => "2026-08-04T00:00:17.900Z" },
    ))?.stale_reason, "managed_run_conflict");
    db.prepare("DELETE FROM autonomy_runs WHERE run_id = ?").run(
      "autonomy-run:cdx2b2a-conflict-fixture",
    );

    const replacementAttachment = await prepareRepositoryExecutionV01(db, {
      workspace_id: workspaceId,
      project_id: projectA.project_id,
    }, { now: () => "2026-08-04T00:00:18.000Z" });
    assert.equal(replacementAttachment.status, "prepared");
    const baselineCountBeforeReplacement = count(db, "vnext_physical_root_baselines");
    db.close();
    renameSync(rootA, `${rootA}.repository-a`);
    createRepositoryAtPath(rootA, "replacement-b");
    const reopened = openDatabaseV01();
    try {
      const replacement = await prepareRepositoryExecutionV01(reopened, {
        workspace_id: workspaceId,
        project_id: projectA.project_id,
      }, { now: () => "2026-08-04T00:00:19.000Z" });
      assert.equal(replacement.status, "blocked");
      assert.equal(replacement.reason, "physical_root_mismatch");
      assert.equal(count(reopened, "vnext_physical_root_baselines"), baselineCountBeforeReplacement);
      assert.equal(countWhere(reopened, "vnext_repository_execution_attachments", "lifecycle = 'prepared'"), 0);
      assert.equal(countWhere(reopened, "vnext_repository_execution_attachments", "lifecycle = 'consumed'"), 0);
      assert.equal(count(reopened, "autonomy_runs"), 0);
      assert.deepEqual(readdirSync(rootA).sort(), [".git", "README.md"]);
    } finally {
      reopened.close();
    }

    console.log(JSON.stringify({
      status: "pass",
      contract: "repository_execution_attachment.v0.1",
      new_onboarding_baseline: true,
      new_onboarding_second_prompt: false,
      legacy_adoption_required_and_explicit: true,
      physical_identifier_free_tool_projection: true,
      selection_independent_admission: true,
      browser_selection_prompt_or_warning: false,
      unrelated_project_change_ignored: true,
      work_revision_stale: "packet_changed",
      worktree_change_stale: true,
      same_path_replacement_blocked: true,
      exact_preparation_idempotent: true,
      explicit_revocation_idempotent: true,
      backup_restore_retains_local_metadata: true,
      recovery_validator_accepts_exact_metadata: true,
      portable_export_excludes_machine_local_metadata: true,
      windows_verified: false,
      windows_status: "identity_unsupported",
      cross_node_status: "baseline_adoption_required",
      ambiguous_identity_refused: true,
      network_filesystem_identity_refused: true,
      symlink_alias_identity_exact: true,
      intentional_rebind_atomic_and_idempotent: true,
      moved_root_rebind_decisions: 1,
      missing_root_refused_before_rebind: true,
      old_baseline_cannot_authorize_new_root: true,
      conflicting_managed_run_refused: true,
      managed_runs_created: 0,
      project_commands_executed_by_product: 0,
      authority_flags_true: 0,
    }, null, 2));
  } finally {
    if (db.open) db.close();
  }
}

function assertSchemaParityV01(): void {
  const names = [
    "vnext_physical_root_baselines",
    "vnext_repository_execution_attachments",
    "vnext_repository_root_rebind_receipts",
    "idx_vnext_physical_root_baselines_project",
    "idx_vnext_repository_execution_attachments_project",
    "idx_vnext_repository_execution_one_prepared",
    "idx_vnext_repository_root_rebind_receipts_project",
  ];
  const create = (sql: string, includesIdentity = true) => {
    const db = new Database(":memory:");
    if (includesIdentity) db.exec(VNEXT_PROJECT_IDENTITY_REGISTRY_SCHEMA_SQL_V01);
    db.exec(sql);
    return db;
  };
  const runtime = create(VNEXT_REPOSITORY_EXECUTION_STORE_SCHEMA_SQL_V01);
  const migration = create(vNextRepositoryExecutionStoreSchemaSqlV01);
  const canonical = create(readFileSync(path.join(process.cwd(), "lib", "db", "schema.sql"), "utf8"), false);
  try {
    const read = (db: Database.Database) => Object.fromEntries(names.map((name) => {
      const row = db.prepare("SELECT sql FROM sqlite_master WHERE name = ?").get(name) as { sql: string };
      return [name, row.sql.replace(/\s+/gu, " ").replace(/\s*([(),=])\s*/gu, "$1").trim()];
    }));
    assert.deepEqual(read(runtime), read(migration));
    assert.deepEqual(read(runtime), read(canonical));
  } finally {
    runtime.close();
    migration.close();
    canonical.close();
  }
}

async function onboardV01(
  db: Database.Database,
  root: string,
  displayName: string,
  now: string,
) {
  process.env.AUGNES_TEST_FOLDER_PICKER_PATH = root;
  const picked = await pickAndInspectLocalProjectV01({
    open_database: openDatabaseV01,
    now: () => now,
  });
  assert.equal(picked.status, "selected");
  const result = await confirmLocalProjectOnboardingV01(db, {
    selection_token: picked.selection_token,
    inspection_fingerprint: picked.inspection.inspection_fingerprint,
    display_name: displayName,
  }, { now: () => now });
  assert.equal(result.status, "created");
  return result.project;
}

function defineWorkV01(
  db: Database.Database,
  projectId: string,
  goal: string,
  now: string,
) {
  const workspaceId = projectScope(db, projectId).workspace_id;
  const config = operatorConfig(db, projectId);
  const credential = credentialV01(db, config, now);
  return defineInitialProjectWorkV01(db, {
    config,
    credential,
    request: {
      action: "define_initial_project_work",
      workspace_id: workspaceId,
      project_id: projectId,
      expected_active_project_id: projectId,
      expected_active_selection_revision: readActiveProjectSelectionV01(db, workspaceId)!.selection_revision,
      expected_initialization_state: "not_defined",
      goal,
      success_criteria: ["One exact selection-independent attachment"],
      non_goals: ["Do not start execution"],
    },
    clock: { now: () => now },
  });
}

function reviseWorkV01(
  db: Database.Database,
  projectId: string,
  initial: ReturnType<typeof defineInitialProjectWorkV01>,
  goal: string,
  now: string,
): void {
  const workspaceId = projectScope(db, projectId).workspace_id;
  const config = { ...operatorConfig(db, projectId), operator_id: "operator:cdx2b2a-revision" };
  const credential = credentialV01(db, config, now);
  revisePreExecutionProjectWorkV01(db, {
    config,
    credential,
    request: {
      action: "revise_pre_execution_project_work",
      workspace_id: workspaceId,
      project_id: projectId,
      expected_active_project_id: projectId,
      expected_active_selection_revision: readActiveProjectSelectionV01(db, workspaceId)!.selection_revision,
      expected_current_packet_id: initial.packet.packet_id,
      expected_current_packet_fingerprint: initial.packet.integrity.fingerprint,
      expected_current_lineage_kind: "initial_user_defined",
      goal,
      success_criteria: ["The former attachment becomes stale"],
      non_goals: ["Do not start execution"],
    },
    clock: { now: () => now },
  });
}

function credentialV01(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
  now: string,
) {
  const base = Date.parse(now);
  const issued = issueVNextLocalOperatorBootstrapV01(db, {
    config,
    clock: { now: () => new Date(base - 2_000).toISOString() },
  });
  return consumeVNextLocalOperatorBootstrapV01(db, {
    config,
    bootstrap_token: issued.bootstrap_token,
    clock: { now: () => new Date(base - 1_000).toISOString() },
  }).credential;
}

function operatorConfig(
  db: Database.Database,
  projectId: string,
): VNextLocalOperatorPilotConfigV01 {
  return {
    enabled: true,
    workspace_id: projectScope(db, projectId).workspace_id,
    project_id: projectId,
    operator_id: "operator:cdx2b2a",
    database_path: DATABASE_PATH,
  };
}

function projectScope(db: Database.Database, projectId: string): { workspace_id: string } {
  const row = db.prepare(
    "SELECT workspace_id FROM vnext_project_identities WHERE project_id = ?",
  ).get(projectId) as { workspace_id: string } | undefined;
  assert(row);
  return row;
}

function openDatabaseV01(): Database.Database {
  const db = new Database(DATABASE_PATH);
  db.pragma("foreign_keys = ON");
  applyCanonicalDatabaseMigrations(db);
  return db;
}

function selectProjectV01(db: Database.Database, workspaceId: string, projectId: string): void {
  const active = readActiveProjectSelectionV01(db, workspaceId);
  if (active?.project_id === projectId) return;
  selectActiveProjectV01(db, {
    workspace_id: workspaceId,
    project_id: projectId,
    expected_project_id: active?.project_id ?? null,
    expected_revision: active?.selection_revision ?? null,
    now: "2026-08-04T00:00:00.000Z",
  });
}

function createRepository(name: string): string {
  const root = path.join(ROOT, name);
  createRepositoryAtPath(root, name);
  return root;
}

function createRepositoryAtPath(root: string, name: string): void {
  mkdirSync(root, { recursive: true });
  writeFileSync(path.join(root, "README.md"), `# ${name}\n`, "utf8");
  execFileSync("git", ["init", "--quiet", root], { stdio: "ignore" });
  execFileSync("git", ["-C", root, "add", "README.md"], { stdio: "ignore" });
  execFileSync("git", ["-C", root, "-c", "user.name=Augnes Test", "-c", "user.email=test@augnes.local", "commit", "--quiet", "-m", "fixture"], { stdio: "ignore" });
}

function snapshotProjectFiles(root: string) {
  return {
    entries: readdirSync(root).sort(),
    readme: readFileSync(path.join(root, "README.md"), "utf8"),
  };
}

function count(db: Database.Database, table: string): number {
  return (db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get() as { count: number }).count;
}

function countWhere(db: Database.Database, table: string, where: string): number {
  return (db.prepare(`SELECT COUNT(*) AS count FROM ${table} WHERE ${where}`).get() as { count: number }).count;
}
