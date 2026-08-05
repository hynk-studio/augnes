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

import { POST as projectRoutePost } from "../app/api/vnext/projects/route";

import {
  confirmLocalProjectOnboardingV01,
  listRecentProjectsV01,
  pickAndInspectLocalProjectV01,
} from "../lib/vnext/onboarding/local-project-onboarding";
import {
  getOrCreateCanonicalProjectForLocalRootV01,
  normalizeLocalProjectRootRefV01,
  readCanonicalProjectWithRootV01,
  rebindCanonicalProjectLocalRootV01,
  VNEXT_PROJECT_IDENTITY_REGISTRY_SCHEMA_SQL_V01,
} from "../lib/vnext/persistence/project-identity-registry";
import {
  insertPhysicalRootBaselineIfAbsentInsideTransactionV01,
  VNEXT_REPOSITORY_EXECUTION_STORE_SCHEMA_SQL_V01,
} from "../lib/vnext/persistence/repository-execution-store";
import {
  readActiveProjectSelectionV01,
  selectActiveProjectV01,
  touchRecentProjectV01,
} from "../lib/vnext/persistence/project-lifecycle-registry";
import {
  adoptLegacyPhysicalRootBaselineV01,
  buildPhysicalRootBaselineV01,
  grantRepositoryExecutionDecisionFromBrowserSessionV01,
  inspectPhysicalRootForExecutionV01,
  prepareRepositoryExecutionV01,
  previewRepositoryExecutionAttachmentRevocationV01,
  previewRepositoryExecutionRootRebindV01,
  projectPhysicalRootMutationResultV01,
  readProjectExecutionAdmissionV01,
  rebindRepositoryExecutionRootV01,
  revokeRepositoryExecutionAttachmentV01,
  validateRepositoryExecutionAttachmentV01,
} from "../lib/vnext/repository-execution/repository-execution";
import { defineInitialProjectWorkV01 } from "../lib/vnext/runtime/project-work-initialization";
import { revisePreExecutionProjectWorkV01 } from "../lib/vnext/runtime/project-work-revision";
import { inspectRepositoryWorktreeV01 } from "../lib/vnext/repository-execution/worktree-observation";
import { exportActivePortableProjectV01 } from "../lib/vnext/portability/portable-project";
import {
  authenticateVNextLocalOperatorSessionV01,
  consumeVNextLocalOperatorBootstrapV01,
  issueVNextLocalOperatorBootstrapV01,
  issueVNextRepositoryDecisionChallengeV01,
  VNEXT_REPOSITORY_DECISION_SESSION_COOKIE_V01,
  type VNextLocalOperatorPilotConfigV01,
} from "../lib/vnext/runtime/local-operator-session";
import { applyCanonicalDatabaseMigrations } from "./canonical-database-migrations.mjs";
import { vNextRepositoryExecutionStoreSchemaSqlV01 } from "./db-migrations.mjs";
import { validateRecoveryCanonicalDatabaseV01 } from "./recovery-canonical-record-validator";
import type { RepositoryExecutionDecisionRequestProjectionV01 } from "../types/vnext/repository-execution";

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
  process.env.AUGNES_DB_PATH = DATABASE_PATH;
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
    await assertConcurrentOnboardingBaselineRollbackV01(
      db,
      createRepository("onboarding-baseline-race"),
      "2026-08-04T00:00:01.100Z",
    );
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
    writeFileSync(path.join(rootA, "foo.ts"), "export const value = 0;\n", "utf8");
    commitFixtureV01(rootA, "add tracked fixture");
    writeFileSync(path.join(rootA, "foo.ts"), "export const value = 1;\n", "utf8");
    const dirtyTrackedAttachment = await prepareRepositoryExecutionV01(db, {
      workspace_id: workspaceId,
      project_id: projectA.project_id,
    }, { now: () => "2026-08-04T00:00:07.100Z" });
    assert.equal(dirtyTrackedAttachment.status, "prepared");
    writeFileSync(path.join(rootA, "foo.ts"), "export const value = 2;\n", "utf8");
    const staleTrackedContent = await validateRepositoryExecutionAttachmentV01(
      db,
      dirtyTrackedAttachment.attachment!.attachment_id,
      { now: () => "2026-08-04T00:00:07.200Z" },
    );
    assert.equal(staleTrackedContent?.stale_reason, "worktree_changed");
    writeFileSync(path.join(rootA, "foo.ts"), "export const value = 0;\n", "utf8");

    writeFileSync(path.join(rootA, "new.ts"), "export const newValue = 1;\n", "utf8");
    const untrackedAttachment = await prepareRepositoryExecutionV01(db, {
      workspace_id: workspaceId,
      project_id: projectA.project_id,
    }, { now: () => "2026-08-04T00:00:07.300Z" });
    assert.equal(untrackedAttachment.status, "prepared");
    writeFileSync(path.join(rootA, "new.ts"), "export const newValue = 2;\n", "utf8");
    const staleUntrackedContent = await validateRepositoryExecutionAttachmentV01(
      db,
      untrackedAttachment.attachment!.attachment_id,
      { now: () => "2026-08-04T00:00:07.400Z" },
    );
    assert.equal(staleUntrackedContent?.stale_reason, "worktree_changed");
    rmSync(path.join(rootA, "new.ts"));

    writeFileSync(
      path.join(rootA, "oversized-untracked.bin"),
      Buffer.alloc(8 * 1024 * 1024 + 1, 0x61),
    );
    const oversizedWorktree = await prepareRepositoryExecutionV01(db, {
      workspace_id: workspaceId,
      project_id: projectA.project_id,
    }, { now: () => "2026-08-04T00:00:07.450Z" });
    assert.equal(oversizedWorktree.status, "blocked");
    assert.equal(oversizedWorktree.reason, "worktree_ambiguous");
    assert.equal(oversizedWorktree.attachment, null);
    rmSync(path.join(rootA, "oversized-untracked.bin"));

    writeFileSync(path.join(rootA, "staged.ts"), "export const staged = 0;\n", "utf8");
    commitFixtureV01(rootA, "add staged fixture");
    writeFileSync(path.join(rootA, "staged.ts"), "export const staged = 1;\n", "utf8");
    execFileSync("git", ["-C", rootA, "add", "staged.ts"], { stdio: "ignore" });
    const stagedAttachment = await prepareRepositoryExecutionV01(db, {
      workspace_id: workspaceId,
      project_id: projectA.project_id,
    }, { now: () => "2026-08-04T00:00:07.500Z" });
    assert.equal(stagedAttachment.status, "prepared");
    writeFileSync(path.join(rootA, "staged.ts"), "export const staged = 2;\n", "utf8");
    execFileSync("git", ["-C", rootA, "add", "staged.ts"], { stdio: "ignore" });
    assert.equal((await validateRepositoryExecutionAttachmentV01(
      db,
      stagedAttachment.attachment!.attachment_id,
      { now: () => "2026-08-04T00:00:07.600Z" },
    ))?.stale_reason, "worktree_changed");
    writeFileSync(path.join(rootA, "staged.ts"), "export const staged = 0;\n", "utf8");
    execFileSync("git", ["-C", rootA, "add", "staged.ts"], { stdio: "ignore" });

    const preRevisionAttachment = await prepareRepositoryExecutionV01(db, {
      workspace_id: workspaceId,
      project_id: projectA.project_id,
    }, { now: () => "2026-08-04T00:00:07.700Z" });
    assert(preRevisionAttachment.attachment);
    reviseWorkV01(db, projectA.project_id, initial, "Repository A revised work", "2026-08-04T00:00:08.000Z");
    const staleAfterRevision = await validateRepositoryExecutionAttachmentV01(
      db,
      preRevisionAttachment.attachment.attachment_id,
      { now: () => "2026-08-04T00:00:09.000Z" },
    );
    assert.equal(staleAfterRevision?.lifecycle, "stale");
    assert.equal(staleAfterRevision?.stale_reason, "packet_changed");

    const revisedAttachment = await prepareRepositoryExecutionV01(db, {
      workspace_id: workspaceId,
      project_id: projectA.project_id,
    }, { now: () => "2026-08-04T00:00:10.000Z" });
    assert.equal(revisedAttachment.status, "prepared");
    assert.notEqual(
      revisedAttachment.attachment?.attachment_id,
      preRevisionAttachment.attachment.attachment_id,
    );
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
    const revokePreview = previewRepositoryExecutionAttachmentRevocationV01(db, {
      attachment_id: revocable.attachment!.attachment_id,
      expected_binding_fingerprint: revocable.attachment!.binding_fingerprint,
    }, { now: () => "2026-08-04T00:00:12.100Z" });
    const revokeGrant = grantDecisionV01(
      db,
      revokePreview.decision_request,
      "2026-08-04T00:00:12.200Z",
    );
    const revoked = revokeRepositoryExecutionAttachmentV01(db, {
      attachment_id: revocable.attachment!.attachment_id,
      expected_binding_fingerprint: revocable.attachment!.binding_fingerprint,
      decision_request_fingerprint: revokeGrant.request_fingerprint,
      decision_grant_fingerprint: revokeGrant.grant_fingerprint!,
      now: "2026-08-04T00:00:13.000Z",
    });
    assert.equal(revoked.lifecycle, "revoked");
    assert.equal(revoked.stale_reason, "explicitly_revoked");
    assert.equal(revokeRepositoryExecutionAttachmentV01(db, {
      attachment_id: revoked.attachment_id,
      expected_binding_fingerprint: revoked.binding_fingerprint,
      decision_request_fingerprint: revokeGrant.request_fingerprint,
      decision_grant_fingerprint: revokeGrant.grant_fingerprint!,
      now: "2026-08-04T00:30:13.100Z",
    }).attachment_id, revoked.attachment_id);
    assert.deepEqual(db.prepare(
      `SELECT status, COUNT(*) AS count
       FROM vnext_repository_execution_decision_requests
       WHERE request_fingerprint = ?`,
    ).get(revokeGrant.request_fingerprint), { status: "consumed", count: 1 });

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
    touchRecentProjectV01(db, {
      workspace_id: workspaceId,
      project_id: legacy.project.project_id,
      now: "2026-08-04T00:00:14.100Z",
    });
    selectProjectV01(db, workspaceId, legacy.project.project_id);
    const legacyPreparation = await prepareRepositoryExecutionV01(db, {
      workspace_id: workspaceId,
      project_id: legacy.project.project_id,
    });
    assert(legacyPreparation.decision_request);
    const pendingDecisionEntry = (await listRecentProjectsV01(db)).find(
      (entry) => entry.project.project_id === legacy.project.project_id,
    );
    assert.equal(pendingDecisionEntry?.repository_execution_decision?.status, "pending");
    assert.equal(
      pendingDecisionEntry?.repository_execution_decision?.ordinary_text.includes("sha256:"),
      false,
    );
    const adoptionGrant = await confirmDecisionThroughBrowserRouteV01(
      legacyPreparation.decision_request,
    );
    assert.equal(
      (await listRecentProjectsV01(db)).find(
        (entry) => entry.project.project_id === legacy.project.project_id,
      )?.repository_execution_decision?.status,
      "granted",
    );
    assert.equal(
      grantDecisionV01(db, adoptionGrant, "2026-08-04T00:00:15.200Z")
        .grant_fingerprint,
      adoptionGrant.grant_fingerprint,
      "exact Browser confirmation replay must not mint another grant",
    );
    await assert.rejects(adoptLegacyPhysicalRootBaselineV01(db, {
      workspace_id: workspaceId,
      project_id: legacy.project.project_id,
      expected_admission_fingerprint: legacyAdmission.admission_fingerprint,
      expected_observation_fingerprint: legacyAdmission.physical_root_observation_fingerprint,
      decision_request_fingerprint: adoptionGrant.request_fingerprint,
      decision_grant_fingerprint: "sha256:model-invented-grant",
    }), /repository_execution_decision_mismatch/u);
    await assert.rejects(adoptLegacyPhysicalRootBaselineV01(db, {
      workspace_id: workspaceId,
      project_id: legacy.project.project_id,
      expected_admission_fingerprint: "sha256:stale",
      expected_observation_fingerprint: legacyAdmission.physical_root_observation_fingerprint,
      decision_request_fingerprint: adoptionGrant.request_fingerprint,
      decision_grant_fingerprint: adoptionGrant.grant_fingerprint!,
    }), /repository_execution_decision_mismatch/u);
    const adoption = await adoptLegacyPhysicalRootBaselineV01(db, {
      workspace_id: workspaceId,
      project_id: legacy.project.project_id,
      expected_admission_fingerprint: legacyAdmission.admission_fingerprint,
      expected_observation_fingerprint: legacyAdmission.physical_root_observation_fingerprint,
      decision_request_fingerprint: adoptionGrant.request_fingerprint,
      decision_grant_fingerprint: adoptionGrant.grant_fingerprint!,
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
      decision_request_fingerprint: adoptionGrant.request_fingerprint,
      decision_grant_fingerprint: adoptionGrant.grant_fingerprint!,
    }, { now: () => "2026-08-04T00:00:16.000Z" })).status, "exact_replay");
    assert.equal(
      (await listRecentProjectsV01(db)).find(
        (entry) => entry.project.project_id === legacy.project.project_id,
      )?.repository_execution_decision,
      null,
    );
    selectProjectV01(db, workspaceId, projectA.project_id);

    const staleLegacyRoot = createRepository("stale-legacy-repository");
    const staleLegacy = getOrCreateCanonicalProjectForLocalRootV01(db, {
      workspace_id: workspaceId,
      local_root: normalizeLocalProjectRootRefV01(staleLegacyRoot, { base_path: ROOT }),
      display_name: "Stale Legacy Repository",
    }, {
      create_uuid: () => "50000000-0000-4000-8000-000000000002",
      now: () => "2026-08-04T00:00:16.100Z",
    });
    const staleLegacyPreparation = await prepareRepositoryExecutionV01(db, {
      workspace_id: workspaceId,
      project_id: staleLegacy.project.project_id,
    }, { now: () => "2026-08-04T00:00:16.200Z" });
    assert(staleLegacyPreparation.admission?.physical_root_observation_fingerprint);
    assert(staleLegacyPreparation.decision_request);
    const staleLegacyGrant = grantDecisionV01(
      db,
      staleLegacyPreparation.decision_request,
      "2026-08-04T00:00:16.250Z",
    );
    const staleLegacyPhysical = await inspectPhysicalRootForExecutionV01(
      db,
      staleLegacyRoot,
      { now: () => "2026-08-04T00:00:16.300Z" },
    );
    assert.equal(staleLegacyPhysical.status, "exact");
    db.transaction(() => {
      const insertion = insertPhysicalRootBaselineIfAbsentInsideTransactionV01(
        db,
        buildPhysicalRootBaselineV01({
          workspace_id: workspaceId,
          project_id: staleLegacy.project.project_id,
          root_binding: staleLegacy.root_binding,
          observation: staleLegacyPhysical.status === "exact"
            ? staleLegacyPhysical
            : assert.fail(),
          provenance: "explicit_root_rebind",
        }),
      );
      assert.equal(insertion.status, "inserted");
    }).immediate();
    await assert.rejects(adoptLegacyPhysicalRootBaselineV01(db, {
      workspace_id: workspaceId,
      project_id: staleLegacy.project.project_id,
      expected_admission_fingerprint:
        staleLegacyPreparation.admission.admission_fingerprint,
      expected_observation_fingerprint:
        staleLegacyPreparation.admission.physical_root_observation_fingerprint,
      decision_request_fingerprint: staleLegacyGrant.request_fingerprint,
      decision_grant_fingerprint: staleLegacyGrant.grant_fingerprint!,
    }, { now: () => "2026-08-04T00:00:16.400Z" }), /baseline_adoption_stale/u);

    const expiredLegacyRoot = createRepository("expired-decision-repository");
    const expiredLegacy = getOrCreateCanonicalProjectForLocalRootV01(db, {
      workspace_id: workspaceId,
      local_root: normalizeLocalProjectRootRefV01(expiredLegacyRoot, { base_path: ROOT }),
      display_name: "Expired Decision Repository",
    }, {
      create_uuid: () => "50000000-0000-4000-8000-000000000003",
      now: () => "2026-08-04T00:00:16.500Z",
    });
    const expiredPreparation = await prepareRepositoryExecutionV01(db, {
      workspace_id: workspaceId,
      project_id: expiredLegacy.project.project_id,
    }, { now: () => "2026-08-04T00:00:16.600Z" });
    assert(expiredPreparation.decision_request);
    assert.throws(() => grantDecisionV01(
      db,
      expiredPreparation.decision_request!,
      "2026-08-04T00:16:16.601Z",
    ), /repository_execution_decision_expired/u);

    const portable = exportActivePortableProjectV01(db, {
      include_personal_perspective: false,
      exported_at: "2026-08-04T00:00:16.500Z",
    });
    const portableText = new TextDecoder().decode(portable.bytes);
    assert.equal(portableText.includes("filesystem_volume_identity"), false);
    assert.equal(portableText.includes("filesystem_object_identity"), false);
    assert.equal(portableText.includes("repository_execution_attachment.v0.1"), false);
    assert.equal(portableText.includes("repository_run_resume_checkpoint.v0.1"), false);
    assert.equal(
      portable.package.manifest.exclusions.includes(
        "machine_local_physical_root_baselines_and_execution_attachments",
      ),
      true,
    );
    assert.equal(
      portable.package.manifest.exclusions.includes(
        "machine_local_repository_execution_decision_requests_and_grants",
      ),
      true,
    );
    assert.equal(
      portable.package.manifest.exclusions.includes(
        "machine_local_repository_run_resume_checkpoints_and_provider_bindings",
      ),
      true,
    );
    assert.equal(portableText.includes("repository_execution_decision_request.v0.1"), false);

    const plainRoot = path.join(ROOT, "plain-project");
    mkdirSync(plainRoot);
    writeFileSync(path.join(plainRoot, "notes.txt"), "plain folder\n", "utf8");
    const plainProject = await onboardV01(
      db,
      plainRoot,
      "Plain Project",
      "2026-08-04T00:00:16.600Z",
    );
    defineWorkV01(
      db,
      plainProject.project_id,
      "Keep non-Git continuity without claiming managed execution readiness",
      "2026-08-04T00:00:16.700Z",
    );
    const plainPreparation = await prepareRepositoryExecutionV01(db, {
      workspace_id: workspaceId,
      project_id: plainProject.project_id,
    }, { now: () => "2026-08-04T00:00:16.800Z" });
    assert.equal(plainPreparation.status, "blocked");
    assert.equal(plainPreparation.reason, "non_git_execution_unsupported");
    assert.equal(plainPreparation.attachment, null);

    const submoduleSource = createRepository("submodule-source");
    const submoduleParent = createRepository("submodule-parent");
    execFileSync("git", [
      "-c", "protocol.file.allow=always",
      "-C", submoduleParent,
      "submodule", "add", "--quiet", submoduleSource, "modules/source",
    ], { stdio: "ignore" });
    commitFixtureV01(submoduleParent, "add bounded submodule");
    const submoduleProject = await onboardV01(
      db,
      submoduleParent,
      "Submodule Project",
      "2026-08-04T00:00:16.810Z",
    );
    defineWorkV01(
      db,
      submoduleProject.project_id,
      "Bind supported submodule commit state",
      "2026-08-04T00:00:16.820Z",
    );
    const nestedSubmodule = path.join(submoduleParent, "modules", "source");
    writeFileSync(path.join(nestedSubmodule, "submodule.ts"), "export const sub = 1;\n", "utf8");
    commitFixtureV01(nestedSubmodule, "advance submodule once");
    const submoduleAttachment = await prepareRepositoryExecutionV01(db, {
      workspace_id: workspaceId,
      project_id: submoduleProject.project_id,
    }, { now: () => "2026-08-04T00:00:16.830Z" });
    assert.equal(
      submoduleAttachment.status,
      "prepared",
      `supported submodule commit state: ${submoduleAttachment.reason}`,
    );
    writeFileSync(path.join(nestedSubmodule, "submodule.ts"), "export const sub = 2;\n", "utf8");
    commitFixtureV01(nestedSubmodule, "advance submodule twice");
    assert.equal((await validateRepositoryExecutionAttachmentV01(
      db,
      submoduleAttachment.attachment!.attachment_id,
      { now: () => "2026-08-04T00:00:16.840Z" },
    ))?.stale_reason, "worktree_changed");
    const dirtySubmoduleAttachment = await prepareRepositoryExecutionV01(db, {
      workspace_id: workspaceId,
      project_id: submoduleProject.project_id,
    }, { now: () => "2026-08-04T00:00:16.850Z" });
    assert.equal(dirtySubmoduleAttachment.status, "prepared");
    writeFileSync(path.join(nestedSubmodule, "submodule.ts"), "export const sub = 3;\n", "utf8");
    const dirtySubmoduleAdmission = await readProjectExecutionAdmissionV01(db, {
      workspace_id: workspaceId,
      project_id: submoduleProject.project_id,
    }, { now: () => "2026-08-04T00:00:16.860Z" });
    assert.equal(dirtySubmoduleAdmission.reason, "worktree_ambiguous");
    assert.equal((await validateRepositoryExecutionAttachmentV01(
      db,
      dirtySubmoduleAttachment.attachment!.attachment_id,
      { now: () => "2026-08-04T00:00:16.870Z" },
    ))?.stale_reason, "worktree_changed");
    selectProjectV01(db, workspaceId, projectA.project_id);

    const backupPath = path.join(ROOT, "attachment-backup.db");
    await db.backup(backupPath);
    const restored = new Database(backupPath, { readonly: true, fileMustExist: true });
    try {
      assert.equal(count(restored, "vnext_physical_root_baselines"), count(db, "vnext_physical_root_baselines"));
      assert.equal(count(restored, "vnext_repository_execution_attachments"), count(db, "vnext_repository_execution_attachments"));
      assert.equal(
        count(restored, "vnext_repository_execution_decision_requests"),
        count(db, "vnext_repository_execution_decision_requests"),
      );
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

    const packetRaceRoot = createRepository("packet-race-repository");
    const packetRaceProject = await onboardV01(
      db,
      packetRaceRoot,
      "Packet Race Repository",
      "2026-08-04T00:00:17.280Z",
    );
    const packetRaceInitial = defineWorkV01(
      db,
      packetRaceProject.project_id,
      "Observe current work before the write race",
      "2026-08-04T00:00:17.281Z",
    );
    await assert.rejects(prepareRepositoryExecutionV01(db, {
      workspace_id: workspaceId,
      project_id: packetRaceProject.project_id,
    }, {
      now: () => "2026-08-04T00:00:17.282Z",
      before_prepare_transaction: () => reviseWorkV01(
        db,
        packetRaceProject.project_id,
        packetRaceInitial,
        "Mutated between observation and write",
        "2026-08-04T00:00:17.283Z",
      ),
    }), /repository_execution_preparation_stale/u);
    assert.equal(countWhere(
      db,
      "vnext_repository_execution_attachments",
      `project_id = '${packetRaceProject.project_id}'`,
    ), 0);

    const rootRaceRoot = createRepository("root-race-repository");
    const rootRaceProject = await onboardV01(
      db,
      rootRaceRoot,
      "Root Race Repository",
      "2026-08-04T00:00:17.284Z",
    );
    defineWorkV01(
      db,
      rootRaceProject.project_id,
      "Observe the root before the write race",
      "2026-08-04T00:00:17.285Z",
    );
    const rootRaceReplacement = createRepository("root-race-replacement");
    await assert.rejects(prepareRepositoryExecutionV01(db, {
      workspace_id: workspaceId,
      project_id: rootRaceProject.project_id,
    }, {
      now: () => "2026-08-04T00:00:17.286Z",
      before_prepare_transaction: () => {
        rebindCanonicalProjectLocalRootV01(db, {
          workspace_id: workspaceId,
          project_id: rootRaceProject.project_id,
          local_root: normalizeLocalProjectRootRefV01(rootRaceReplacement, { base_path: ROOT }),
        }, { now: () => "2026-08-04T00:00:17.287Z" });
      },
    }), /repository_execution_preparation_stale/u);
    assert.equal(countWhere(
      db,
      "vnext_repository_execution_attachments",
      `project_id = '${rootRaceProject.project_id}'`,
    ), 0);

    const runRaceRoot = createRepository("managed-run-race-repository");
    const runRaceProject = await onboardV01(
      db,
      runRaceRoot,
      "Managed Run Race Repository",
      "2026-08-04T00:00:17.288Z",
    );
    defineWorkV01(
      db,
      runRaceProject.project_id,
      "Observe managed-run state before the write race",
      "2026-08-04T00:00:17.289Z",
    );
    await assert.rejects(prepareRepositoryExecutionV01(db, {
      workspace_id: workspaceId,
      project_id: runRaceProject.project_id,
    }, {
      now: () => "2026-08-04T00:00:17.290Z",
      before_prepare_transaction: () => insertManagedRunFixtureV01(
        db,
        workspaceId,
        runRaceProject.project_id,
        "autonomy-run:cdx2b2a-prepare-race",
        "2026-08-04T00:00:17.291Z",
      ),
    }), /repository_execution_preparation_stale/u);
    assert.equal(countWhere(
      db,
      "vnext_repository_execution_attachments",
      `project_id = '${runRaceProject.project_id}'`,
    ), 0);
    db.prepare("DELETE FROM autonomy_runs WHERE run_id = ?").run(
      "autonomy-run:cdx2b2a-prepare-race",
    );

    const postCommitRaceRoot = createRepository("post-commit-race-repository");
    const postCommitRaceProject = await onboardV01(
      db,
      postCommitRaceRoot,
      "Post-commit Race Repository",
      "2026-08-04T00:00:17.292Z",
    );
    defineWorkV01(
      db,
      postCommitRaceProject.project_id,
      "Reobserve after attachment metadata commits",
      "2026-08-04T00:00:17.293Z",
    );
    const postCommitRace = await prepareRepositoryExecutionV01(db, {
      workspace_id: workspaceId,
      project_id: postCommitRaceProject.project_id,
    }, {
      now: () => "2026-08-04T00:00:17.294Z",
      after_prepare_transaction_before_reobserve: () => {
        writeFileSync(path.join(postCommitRaceRoot, "changed-after-commit.ts"), "changed\n", "utf8");
      },
    });
    assert.equal(postCommitRace.status, "blocked");
    assert.equal(postCommitRace.attachment, null);
    assert.equal(countWhere(
      db,
      "vnext_repository_execution_attachments",
      `project_id = '${postCommitRaceProject.project_id}' AND lifecycle = 'stale'`,
    ), 1);

    const postCommitPacketRoot = createRepository("post-commit-packet-race-repository");
    const postCommitPacketProject = await onboardV01(
      db,
      postCommitPacketRoot,
      "Post-commit Packet Race Repository",
      "2026-08-04T00:00:17.295Z",
    );
    const postCommitPacketInitial = defineWorkV01(
      db,
      postCommitPacketProject.project_id,
      "Re-read database state after attachment metadata commits",
      "2026-08-04T00:00:17.296Z",
    );
    const postCommitPacketRace = await prepareRepositoryExecutionV01(db, {
      workspace_id: workspaceId,
      project_id: postCommitPacketProject.project_id,
    }, {
      now: () => "2026-08-04T00:00:17.297Z",
      inspect_worktree: secondObservationMutationV01(() => reviseWorkV01(
          db,
          postCommitPacketProject.project_id,
          postCommitPacketInitial,
          "Changed during the post-commit worktree observation",
          "2026-08-04T00:00:17.298Z",
        )),
    });
    assert.equal(postCommitPacketRace.status, "blocked");
    assert.equal(postCommitPacketRace.attachment, null);
    assert.equal((db.prepare(
      `SELECT stale_reason FROM vnext_repository_execution_attachments
       WHERE project_id = ? ORDER BY lifecycle_updated_at DESC LIMIT 1`,
    ).get(postCommitPacketProject.project_id) as { stale_reason: string }).stale_reason, "packet_changed");

    const postCommitRunRoot = createRepository("post-commit-run-race-repository");
    const postCommitRunProject = await onboardV01(
      db,
      postCommitRunRoot,
      "Post-commit Managed Run Race Repository",
      "2026-08-04T00:00:17.298Z",
    );
    defineWorkV01(
      db,
      postCommitRunProject.project_id,
      "Re-read managed-run state after the worktree observation",
      "2026-08-04T00:00:17.299Z",
    );
    const postCommitRunRace = await prepareRepositoryExecutionV01(db, {
      workspace_id: workspaceId,
      project_id: postCommitRunProject.project_id,
    }, {
      now: () => "2026-08-04T00:00:17.299Z",
      inspect_worktree: secondObservationMutationV01(() =>
        insertManagedRunFixtureV01(
          db,
          workspaceId,
          postCommitRunProject.project_id,
          "autonomy-run:cdx2b2a-post-commit-race",
          "2026-08-04T00:00:17.299Z",
        )),
    });
    assert.equal(postCommitRunRace.status, "blocked");
    assert.equal(postCommitRunRace.reason, "managed_run_conflict");
    assert.equal(postCommitRunRace.attachment, null);
    assert.equal((db.prepare(
      `SELECT stale_reason FROM vnext_repository_execution_attachments
       WHERE project_id = ? ORDER BY lifecycle_updated_at DESC LIMIT 1`,
    ).get(postCommitRunProject.project_id) as { stale_reason: string }).stale_reason, "managed_run_conflict");
    db.prepare("DELETE FROM autonomy_runs WHERE run_id = ?").run(
      "autonomy-run:cdx2b2a-post-commit-race",
    );

    const postCommitRootRoot = createRepository("post-commit-root-race-repository");
    const postCommitRootProject = await onboardV01(
      db,
      postCommitRootRoot,
      "Post-commit Root Race Repository",
      "2026-08-04T00:00:17.299Z",
    );
    defineWorkV01(
      db,
      postCommitRootProject.project_id,
      "Re-read root binding after the worktree observation",
      "2026-08-04T00:00:17.299Z",
    );
    const postCommitRootReplacement = createRepository(
      "post-commit-root-race-replacement",
    );
    const postCommitRootRace = await prepareRepositoryExecutionV01(db, {
      workspace_id: workspaceId,
      project_id: postCommitRootProject.project_id,
    }, {
      now: () => "2026-08-04T00:00:17.299Z",
      inspect_worktree: secondObservationMutationV01(() =>
        rebindCanonicalProjectLocalRootV01(db, {
          workspace_id: workspaceId,
          project_id: postCommitRootProject.project_id,
          local_root: normalizeLocalProjectRootRefV01(
            postCommitRootReplacement,
            { base_path: ROOT },
          ),
        }, { now: () => "2026-08-04T00:00:17.299Z" })),
    });
    assert.equal(postCommitRootRace.status, "blocked");
    assert.equal(postCommitRootRace.attachment, null);
    assert.equal((db.prepare(
      `SELECT stale_reason FROM vnext_repository_execution_attachments
       WHERE project_id = ? ORDER BY lifecycle_updated_at DESC LIMIT 1`,
    ).get(postCommitRootProject.project_id) as { stale_reason: string }).stale_reason, "root_binding_changed");

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
    const rebindGrant = grantDecisionV01(
      db,
      rebindPreview.decision_request!,
      "2026-08-04T00:00:17.650Z",
    );
    const rebindInput = {
      workspace_id: workspaceId,
      project_id: rebindProject.project_id,
      new_local_root: normalizeLocalProjectRootRefV01(movedRoot, { base_path: ROOT }),
      expected_old_root_binding_fingerprint: rebindPreview.expected_old_root_binding_fingerprint!,
      expected_old_baseline_fingerprint: rebindPreview.expected_old_baseline_fingerprint!,
      expected_new_observation_fingerprint: rebindPreview.expected_new_observation_fingerprint!,
      decision_request_fingerprint: rebindPreview.decision_request!.request_fingerprint,
      decision_grant_fingerprint: rebindGrant.grant_fingerprint!,
    };
    await assert.rejects(rebindRepositoryExecutionRootV01(db, {
      ...rebindInput,
      expected_old_baseline_fingerprint: "sha256:stale-old-baseline",
    }, { now: () => "2026-08-04T00:00:17.660Z" }), /repository_execution_decision_mismatch/u);
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
      tracked_dirty_content_only_change_stale: "worktree_changed",
      untracked_content_only_change_stale: "worktree_changed",
      staged_content_change_stale: "worktree_changed",
      submodule_commit_change_stale_and_dirty_state_blocked: true,
      worktree_bounds_fail_closed: "worktree_ambiguous",
      non_git_execution_admission: "non_git_execution_unsupported",
      same_path_replacement_blocked: true,
      exact_preparation_idempotent: true,
      explicit_revocation_idempotent: true,
      browser_decision_grant_independent_of_mcp_literal: true,
      forged_browser_headers_without_session_refused: true,
      browser_session_exact_nonce_grants_once: true,
      browser_decision_nonce_rotation_preserves_operator_session: true,
      browser_session_secret_absent_from_response_database_and_environment: true,
      decision_grant_expiry_mismatch_and_one_time_consumption: true,
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
      baseline_expected_absent_and_expected_old_cas: true,
      preparation_packet_root_and_managed_run_races_refused: true,
      post_commit_reobservation_compensates_stale: true,
      post_commit_database_read_after_worktree_observation: true,
      post_commit_packet_run_and_root_races_stale: true,
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
    "vnext_repository_execution_decision_requests",
    "idx_vnext_physical_root_baselines_project",
    "idx_vnext_repository_execution_attachments_project",
    "idx_vnext_repository_execution_one_prepared",
    "idx_vnext_repository_root_rebind_receipts_project",
    "idx_vnext_repository_execution_decisions_project",
    "idx_vnext_repository_execution_one_open_decision",
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

async function assertConcurrentOnboardingBaselineRollbackV01(
  db: Database.Database,
  root: string,
  now: string,
): Promise<void> {
  process.env.AUGNES_TEST_FOLDER_PICKER_PATH = root;
  const picked = await pickAndInspectLocalProjectV01({
    open_database: openDatabaseV01,
    now: () => now,
  });
  assert.equal(picked.status, "selected");
  const physical = await inspectPhysicalRootForExecutionV01(db, root, {
    now: () => now,
  });
  assert.equal(physical.status, "exact");
  await assert.rejects(confirmLocalProjectOnboardingV01(db, {
    selection_token: picked.selection_token,
    inspection_fingerprint: picked.inspection.inspection_fingerprint,
    display_name: "Onboarding Baseline Race",
  }, {
    now: () => now,
    before_baseline_insert_inside_transaction: () => {
      const row = db.prepare(
        "SELECT workspace_id, project_id FROM vnext_project_root_bindings WHERE normalized_root = ?",
      ).get(root) as { workspace_id: string; project_id: string } | undefined;
      assert(row);
      const registration = readCanonicalProjectWithRootV01(db, row);
      assert(registration);
      const insertion = insertPhysicalRootBaselineIfAbsentInsideTransactionV01(
        db,
        buildPhysicalRootBaselineV01({
          ...row,
          root_binding: registration.root_binding,
          observation: physical.status === "exact" ? physical : assert.fail(),
          provenance: "explicit_legacy_adoption",
        }),
      );
      assert.equal(insertion.status, "inserted");
    },
  }), /inspection_stale/u);
  assert.equal((db.prepare(
    "SELECT COUNT(*) AS count FROM vnext_project_root_bindings WHERE normalized_root = ?",
  ).get(root) as { count: number }).count, 0);
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

function insertManagedRunFixtureV01(
  db: Database.Database,
  workspaceId: string,
  projectId: string,
  runId: string,
  now: string,
): void {
  db.prepare(
    `INSERT INTO autonomy_runs (
      run_id, scope, autonomy_contract_ref, title, status, scheduled_for,
      started_at, finished_at, created_at, updated_at, stop_reason,
      source_refs_json, authority_boundary_json, budget_snapshot_json,
      metadata_json
    ) VALUES (?, ?, NULL, ?, 'queued', NULL, NULL, NULL, ?, ?, NULL, '{}', '{}', '{}', ?)`,
  ).run(
    runId,
    projectId,
    "CDX2B2A race fixture",
    now,
    now,
    JSON.stringify({
      workspace_id: workspaceId,
      project_id: projectId,
      lifecycle_mode: "managed_live",
    }),
  );
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

function commitFixtureV01(root: string, message: string): void {
  execFileSync("git", ["-C", root, "add", "--all"], { stdio: "ignore" });
  execFileSync("git", [
    "-C", root,
    "-c", "user.name=Augnes Test",
    "-c", "user.email=test@augnes.local",
    "commit", "--quiet", "-m", message,
  ], { stdio: "ignore" });
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

function secondObservationMutationV01(
  mutate: () => void,
): typeof inspectRepositoryWorktreeV01 {
  let observationCount = 0;
  return async (repositoryRoot, options) => {
    const observation = await inspectRepositoryWorktreeV01(
      repositoryRoot,
      options,
    );
    observationCount += 1;
    if (observationCount === 2) mutate();
    return observation;
  };
}

function grantDecisionV01(
  db: Database.Database,
  request: RepositoryExecutionDecisionRequestProjectionV01,
  now: string,
): RepositoryExecutionDecisionRequestProjectionV01 {
  const browserSession = browserDecisionSessionV01(
    db,
    request.project_id,
    now,
  );
  const admission = browserSession.repository_decision_session;
  const challenge = issueVNextRepositoryDecisionChallengeV01(db, {
    request_fingerprint: request.request_fingerprint,
    workspace_id: request.workspace_id,
    project_id: request.project_id,
    credential: admission.credential,
    clock: { now: () => now },
  });
  return grantRepositoryExecutionDecisionFromBrowserSessionV01(db, {
    request_fingerprint: request.request_fingerprint,
    workspace_id: request.workspace_id,
    project_id: request.project_id,
    challenge_fingerprint: challenge.challenge_fingerprint,
    credential: admission.credential,
  }, { now: () => now }).decision;
}

async function confirmDecisionThroughBrowserRouteV01(
  request: RepositoryExecutionDecisionRequestProjectionV01,
): Promise<RepositoryExecutionDecisionRequestProjectionV01> {
  const exactHeaders = {
    host: "127.0.0.1:4321",
    origin: "http://127.0.0.1:4321",
    "content-type": "application/json",
    "sec-fetch-site": "same-origin",
    "sec-fetch-mode": "cors",
    "sec-fetch-dest": "empty",
  };
  const inventedResponse = await projectRoutePost(new Request(
    "http://127.0.0.1:4321/api/vnext/projects",
    {
      method: "POST",
      headers: exactHeaders,
      body: JSON.stringify({
        action: "confirm_repository_execution_decision",
        workspace_id: request.workspace_id,
        project_id: request.project_id,
        request_fingerprint: request.request_fingerprint,
        challenge_fingerprint: `sha256:${"0".repeat(64)}`,
      }),
    },
  ));
  assert.equal(inventedResponse.status, 401);

  const browserDatabase = openDatabaseV01();
  let session: ReturnType<typeof browserDecisionSessionV01>;
  try {
    session = browserDecisionSessionV01(
      browserDatabase,
      request.project_id,
      request.requested_at,
    );
  } finally {
    browserDatabase.close();
  }
  const decisionSession = session.repository_decision_session;
  const cookie = `${VNEXT_REPOSITORY_DECISION_SESSION_COOKIE_V01}=${decisionSession.cookie_value}`;
  const challengeResponse = await projectRoutePost(new Request(
    "http://127.0.0.1:4321/api/vnext/projects",
    {
      method: "POST",
      headers: {
        ...exactHeaders,
        cookie,
      },
      body: JSON.stringify({
        action: "prepare_repository_execution_decision_confirmation",
        workspace_id: request.workspace_id,
        project_id: request.project_id,
        request_fingerprint: request.request_fingerprint,
      }),
    },
  ));
  assert.equal(challengeResponse.status, 200);
  const challengeText = await challengeResponse.text();
  assert.equal(challengeText.includes(decisionSession.credential.session_secret), false);
  assert.equal(challengeText.includes(decisionSession.credential.action_nonce), false);
  const challengeBody = JSON.parse(challengeText) as {
    confirmation: { challenge_fingerprint: string };
  };

  const mismatchResponse = await projectRoutePost(new Request(
    "http://127.0.0.1:4321/api/vnext/projects",
    {
      method: "POST",
      headers: { ...exactHeaders, cookie },
      body: JSON.stringify({
        action: "confirm_repository_execution_decision",
        workspace_id: request.workspace_id,
        project_id: request.project_id,
        request_fingerprint: request.request_fingerprint,
        challenge_fingerprint: `sha256:${"f".repeat(64)}`,
      }),
    },
  ));
  assert.equal(mismatchResponse.status, 409);

  const response = await projectRoutePost(new Request(
    "http://127.0.0.1:4321/api/vnext/projects",
    {
      method: "POST",
      headers: { ...exactHeaders, cookie },
      body: JSON.stringify({
        action: "confirm_repository_execution_decision",
        workspace_id: request.workspace_id,
        project_id: request.project_id,
        request_fingerprint: request.request_fingerprint,
        challenge_fingerprint:
          challengeBody.confirmation.challenge_fingerprint,
      }),
    },
  ));
  assert.equal(response.status, 200);
  const rotatedCookie = response.headers.get("set-cookie") ?? "";
  assert.match(
    rotatedCookie,
    new RegExp(`^${VNEXT_REPOSITORY_DECISION_SESSION_COOKIE_V01}=`),
  );
  assert.match(rotatedCookie, /Path=\/api\/vnext\/projects/);
  assert.match(rotatedCookie, /HttpOnly/);
  assert.match(rotatedCookie, /SameSite=Strict/);
  const responseText = await response.text();
  assert.equal(responseText.includes(decisionSession.credential.session_secret), false);
  assert.equal(responseText.includes(decisionSession.credential.action_nonce), false);
  const body = JSON.parse(responseText) as {
    result: RepositoryExecutionDecisionRequestProjectionV01;
  };
  assert.equal(body.result.status, "granted");
  assert(body.result.grant_fingerprint);

  const replayResponse = await projectRoutePost(new Request(
    "http://127.0.0.1:4321/api/vnext/projects",
    {
      method: "POST",
      headers: { ...exactHeaders, cookie },
      body: JSON.stringify({
        action: "confirm_repository_execution_decision",
        workspace_id: request.workspace_id,
        project_id: request.project_id,
        request_fingerprint: request.request_fingerprint,
        challenge_fingerprint:
          challengeBody.confirmation.challenge_fingerprint,
      }),
    },
  ));
  assert.equal(replayResponse.status, 409);
  const operatorDb = openDatabaseV01();
  try {
    assert.equal(authenticateVNextLocalOperatorSessionV01(operatorDb, {
      config: operatorConfig(operatorDb, request.project_id),
      credential: session.credential,
      clock: { now: () => request.requested_at },
    }).session.authenticated, true);
  } finally {
    operatorDb.close();
  }
  assert.equal(JSON.stringify(process.env).includes(decisionSession.credential.session_secret), false);
  assert.equal(JSON.stringify(process.env).includes(decisionSession.credential.action_nonce), false);
  const databaseBytes = readFileSync(DATABASE_PATH);
  assert.equal(databaseBytes.includes(Buffer.from(decisionSession.credential.session_secret)), false);
  assert.equal(databaseBytes.includes(Buffer.from(decisionSession.credential.action_nonce)), false);
  return body.result;
}

function browserDecisionSessionV01(
  db: Database.Database,
  projectId: string,
  now: string,
) {
  const base = Date.parse(now);
  const config = operatorConfig(db, projectId);
  const issued = issueVNextLocalOperatorBootstrapV01(db, {
    config,
    clock: { now: () => new Date(base - 2_000).toISOString() },
  });
  return consumeVNextLocalOperatorBootstrapV01(db, {
    config,
    bootstrap_token: issued.bootstrap_token,
    clock: { now: () => new Date(base - 1_000).toISOString() },
  });
}
