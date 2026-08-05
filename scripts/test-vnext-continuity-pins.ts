#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import Database from "better-sqlite3";

import { ProductShell } from "../components/product-shell";
import {
  GET as pinsGET,
  POST as pinsPOST,
} from "../app/api/vnext/continuity-pins/route";
import {
  buildSemanticReviewLoopProposalFixture,
  buildSemanticReviewLoopRunReceiptFixture,
  buildSemanticReviewLoopTaskContextPacketFixture,
  type SemanticReviewLoopProjectFixtureV01,
} from "../fixtures/vnext/protocol/semantic-review-loop-v0-1";
import { openDatabase } from "../lib/db";
import {
  buildBlankStateContinuityV01,
} from "../lib/vnext/blank-state/blank-state-continuity";
import {
  readBlankStateSourceV01,
} from "../lib/vnext/blank-state/blank-state-source";
import {
  buildContinuityPinTargetV01,
  continuityPinTargetIdentityV01,
  sameContinuityPinTargetV01,
} from "../lib/vnext/continuity-pins/continuity-pin-target";
import {
  ProjectContinuityPinStoreErrorV01,
  VNEXT_PROJECT_CONTINUITY_PIN_SCHEMA_SQL_V01,
  mutateProjectContinuityPinsV01,
  readProjectContinuityPinProjectionV01,
} from "../lib/vnext/persistence/project-continuity-pin-store";
import {
  insertVNextCoreRecordV01,
} from "../lib/vnext/persistence/durable-semantic-store";
import {
  getOrCreateCanonicalProjectForLocalRootV01,
  getOrCreateDefaultWorkspaceIdentityV01,
  normalizeLocalProjectRootRefV01,
} from "../lib/vnext/persistence/project-identity-registry";
import {
  readActiveProjectSelectionV01,
  selectActiveProjectV01,
  touchRecentProjectV01,
} from "../lib/vnext/persistence/project-lifecycle-registry";
import {
  exportActivePortableProjectV01,
} from "../lib/vnext/portability/portable-project";
import {
  readProjectHomeDatabaseCompatibilityV01,
} from "../lib/vnext/project-home/project-home-projection";
import type {
  BlankStateContinuityItemV01,
} from "../types/vnext/blank-state";
import type {
  ContinuityPinTargetRefV01,
  ProjectContinuityPinProjectionV01,
} from "../types/vnext/continuity-pins";
import {
  CANONICAL_DATABASE_SUPPORTED_SOURCE_SCHEMA_SIGNATURES,
  applyCanonicalDatabaseMigrations,
} from "./canonical-database-migrations.mjs";
import {
  vNextProjectContinuityPinSchemaSqlV01,
} from "./db-migrations.mjs";
import {
  inspectRecoveryDatabaseFile,
  structuralSchemaContractSignature,
} from "./runtime-database-bootstrap.mjs";
import {
  createRecoveryBackup,
  stageRecoveryBackupDatabase,
  validateRecoveryBackup,
} from "./recovery-backup.mjs";

const PRE_PINNED_CUX1_SCHEMA_SIGNATURE =
  "91f244d9ecda6e7702370a9cc0382c244bb9bf7929bc5abd722fa833ff1c5e7e";
const NOW = "2026-07-29T06:00:00.000Z";
const root = mkdtempSync(path.join(tmpdir(), "augnes-continuity-pins-"));
const dbPath = path.join(root, "pins.db");
const restoredPath = path.join(root, "restored.db");
const backupDirectory = path.join(root, "backups");
const projectARoot = path.join(root, "project-a");
const projectBRoot = path.join(root, "project-b");
const originalEnvironment = { ...process.env };
const pinOnlySnapshot = "PIN_ONLY_SENTINEL_CUX2_LOCAL_PREFERENCE";

process.env.AUGNES_DB_PATH = dbPath;
process.env.AUGNES_CANONICAL_TEST_MODE = "1";
process.env.AUGNES_CANONICAL_TEMP_ROOT = root;
for (const key of [
  "OPENAI_API_KEY",
  "GITHUB_TOKEN",
  "GH_TOKEN",
  "MCP_CONFIG",
  "SCHEDULER_CONFIG",
]) {
  delete process.env[key];
}

async function main(): Promise<void> {
  let db: Database.Database | null = null;
  try {
  mkdirSync(projectARoot);
  mkdirSync(projectBRoot);
  testProductShellPinnedLandmarkV01();
  testMigrationParityAndPrePinnedUpgradeV01();

  db = openDatabase();
  applyCanonicalDatabaseMigrations(db);
  const workspace = getOrCreateDefaultWorkspaceIdentityV01(db, {
    create_uuid: () => "10000000-0000-4000-8000-000000000001",
    now: () => NOW,
  });
  const projectA = registerProjectV01(
    db,
    workspace.workspace_id,
    projectARoot,
    "Continuity pins A",
    "20000000-0000-4000-8000-000000000001",
  );
  const projectB = registerProjectV01(
    db,
    workspace.workspace_id,
    projectBRoot,
    "Continuity pins B",
    "20000000-0000-4000-8000-000000000002",
  );
  touchRecentProjectV01(db, {
    workspace_id: workspace.workspace_id,
    project_id: projectA.project.project_id,
    now: NOW,
  });
  touchRecentProjectV01(db, {
    workspace_id: workspace.workspace_id,
    project_id: projectB.project.project_id,
    now: "2026-07-29T06:00:01.000Z",
  });
  selectActiveProjectV01(db, {
    workspace_id: workspace.workspace_id,
    project_id: projectA.project.project_id,
    expected_project_id: null,
    expected_revision: null,
    now: "2026-07-29T06:00:02.000Z",
  });

  const fixture: SemanticReviewLoopProjectFixtureV01 = {
    fixture_id: "continuity-pins-a",
    workspace_id: workspace.workspace_id,
    project_id: projectA.project.project_id,
    run_id: "run:continuity-pins-a-0",
  };
  const packet = buildSemanticReviewLoopTaskContextPacketFixture(fixture);
  insertVNextCoreRecordV01(db, {
    record_kind: "task_context_packet",
    record_id: packet.packet_id,
    workspace_id: fixture.workspace_id,
    project_id: fixture.project_id,
    fingerprint: packet.integrity.fingerprint,
    idempotency_key: null,
    payload: packet,
    created_at: packet.generated_at,
  });
  const proposals = Array.from({ length: 7 }, (_, index) => {
    const runFixture: SemanticReviewLoopProjectFixtureV01 = {
      ...fixture,
      fixture_id: `continuity-pins-a-${index}`,
      run_id: `run:continuity-pins-a-${index}`,
    };
    const timelineAnchor =
      `2026-07-11T${String(index).padStart(2, "0")}:00:00.000Z`;
    const receipt = buildSemanticReviewLoopRunReceiptFixture(
      runFixture,
      packet,
      { timeline_anchor_at: timelineAnchor },
    );
    const proposal = buildSemanticReviewLoopProposalFixture(
      runFixture,
      packet,
      receipt,
      {
        candidate_namespace: `continuity-pins-${index}`,
        timeline_anchor_at: timelineAnchor,
      },
    );
    insertVNextCoreRecordV01(db!, {
      record_kind: "run_receipt",
      record_id: receipt.receipt_id,
      workspace_id: runFixture.workspace_id,
      project_id: runFixture.project_id,
      fingerprint: receipt.integrity.fingerprint,
      idempotency_key: receipt.idempotency_key,
      payload: receipt,
      created_at: receipt.recorded_at,
    });
    insertVNextCoreRecordV01(db!, {
      record_kind: "episode_delta_proposal",
      record_id: proposal.proposal_id,
      workspace_id: runFixture.workspace_id,
      project_id: runFixture.project_id,
      fingerprint: proposal.integrity.fingerprint,
      idempotency_key: null,
      payload: proposal,
      created_at: proposal.created_at,
    });
    return proposal;
  });

  const scopeA = {
    workspace_id: workspace.workspace_id,
    project_id: projectA.project.project_id,
  };
  const scopeB = {
    workspace_id: workspace.workspace_id,
    project_id: projectB.project.project_id,
  };
  const empty = readProjectContinuityPinProjectionV01(db, scopeA);
  assert.equal(empty.revision, 0);
  assert.deepEqual(empty.pins, []);
  assert.deepEqual(readProjectContinuityPinProjectionV01(db, scopeB).pins, []);
  readProjectHomeDatabaseCompatibilityV01(db, scopeA);

  const sourceBefore = await readBlankStateSourceV01(db, {
    route_mode: "canonical",
    requested_project_id: null,
  });
  assert.equal(sourceBefore.active_project_id, scopeA.project_id);
  assert.equal(sourceBefore.projection?.project_id, scopeA.project_id);
  assert.equal(sourceBefore.projection?.project_summary.is_active, true);
  assert.notEqual(
    sourceBefore.projection?.attention.state.status,
    "error",
    JSON.stringify(sourceBefore.projection?.attention),
  );
  const continuityBefore = buildBlankStateContinuityV01(sourceBefore);
  const visibleItemsBefore = [
    continuityBefore.highlighted_item,
    ...continuityBefore.continuity_items,
  ];
  const eligibleItem = requireEligibleItemV01(visibleItemsBefore);
  const visibleProposalIds = new Set(
    visibleItemsBefore.flatMap((item) => {
      if (
        item.pinning.status === "eligible" &&
        item.pinning.target.owner.kind === "core_record" &&
        item.pinning.target.owner.record_kind === "episode_delta_proposal"
      ) {
        return [item.pinning.target.owner.record_id];
      }
      return [];
    }),
  );
  const proposal = proposals.find(
    (candidate) => !visibleProposalIds.has(candidate.proposal_id),
  );
  assert(
    proposal,
    "fixture must expose a valid owner outside the bounded continuity stream",
  );
  const authorityBefore = authoritySnapshotV01(db, continuityBefore);

  const first = mutateProjectContinuityPinsV01(
    db,
    {
      ...scopeA,
      mutation: {
        action: "pin",
        expected_revision: 0,
        target: eligibleItem.pinning.target,
        source_family: eligibleItem.source_family,
        source_item_id: eligibleItem.item_id,
        label_snapshot: pinOnlySnapshot,
        state_snapshot: eligibleItem.meaningful_state,
      },
    },
    { now: () => "2026-07-29T06:01:00.000Z" },
  );
  assert.equal(first.status, "pinned");
  assert.equal(first.collection.revision, 1);
  assert.equal(first.collection.pins.length, 1);
  assert.notEqual(first.collection.pins[0]!.label, pinOnlySnapshot);
  assert.equal(first.collection.pins[0]!.resolution_status, "resolved");
  assert(first.collection.pins[0]!.destination);
  assert.equal(
    JSON.stringify(first.collection.pins[0]!.target).includes("/workbench/"),
    false,
    "derived destinations must not be durable pin identity",
  );

  const duplicate = mutateProjectContinuityPinsV01(db, {
    ...scopeA,
    mutation: {
      action: "pin",
      expected_revision: 0,
      target: eligibleItem.pinning.target,
      source_family: eligibleItem.source_family,
      source_item_id: eligibleItem.item_id,
      label_snapshot: eligibleItem.work_name,
      state_snapshot: eligibleItem.meaningful_state,
    },
  });
  assert.equal(duplicate.status, "already_pinned");
  assert.equal(duplicate.collection.revision, 1);

  const proposalTarget = buildContinuityPinTargetV01({
    ...scopeA,
    owner: {
      kind: "core_record",
      record_kind: "episode_delta_proposal",
      record_id: proposal.proposal_id,
    },
  });
  const second = mutateProjectContinuityPinsV01(
    db,
    {
      ...scopeA,
      mutation: {
        action: "pin",
        expected_revision: 1,
        target: proposalTarget,
        source_family: "project_attention",
        source_item_id: "continuity:project_attention:test-proposal",
        label_snapshot: "Old proposal label",
        state_snapshot: "Old proposal state",
      },
    },
    { now: () => "2026-07-29T06:02:00.000Z" },
  );
  assert.equal(second.status, "pinned");
  assert.equal(second.collection.revision, 2);
  assert.equal(
    second.collection.pins.find((pin) => pin.target.owner.kind === "core_record")
      ?.label,
    proposal.bounded_summary,
    "the current owner label must supersede the unavailable-display snapshot",
  );

  const unpinned = mutateProjectContinuityPinsV01(
    db,
    {
      ...scopeA,
      mutation: {
        action: "unpin",
        expected_revision: 2,
        target: proposalTarget,
      },
    },
    { now: () => "2026-07-29T06:02:10.000Z" },
  );
  assert.equal(unpinned.status, "unpinned");
  assert.equal(unpinned.collection.revision, 3);
  assert.equal(
    unpinned.collection.pins.some((pin) =>
      sameContinuityPinTargetV01(pin.target, proposalTarget),
    ),
    false,
  );
  const duplicateUnpin = mutateProjectContinuityPinsV01(db, {
    ...scopeA,
    mutation: {
      action: "unpin",
      expected_revision: 2,
      target: proposalTarget,
    },
  });
  assert.equal(duplicateUnpin.status, "already_unpinned");
  assert.equal(duplicateUnpin.collection.revision, 3);
  const repinned = mutateProjectContinuityPinsV01(
    db,
    {
      ...scopeA,
      mutation: {
        action: "pin",
        expected_revision: 3,
        target: proposalTarget,
        source_family: "project_attention",
        source_item_id: "continuity:project_attention:test-proposal",
        label_snapshot: "Old proposal label",
        state_snapshot: "Old proposal state",
      },
    },
    { now: () => "2026-07-29T06:02:20.000Z" },
  );
  assert.equal(repinned.status, "pinned");
  assert.equal(repinned.collection.revision, 4);
  assert.equal(
    repinned.collection.pins.find((pin) =>
      sameContinuityPinTargetV01(pin.target, proposalTarget),
    )?.resolution_status,
    "resolved",
    "a valid owner absent from the bounded list must remain resolvable",
  );

  expectStoreErrorV01(
    () =>
      mutateProjectContinuityPinsV01(db!, {
        ...scopeA,
        mutation: {
          action: "reorder",
          expected_revision: 3,
          target_order: repinned.collection.pins
            .map((pin) => pin.target)
            .reverse(),
        },
      }),
    "continuity_pin_stale_write",
  );
  const reordered = mutateProjectContinuityPinsV01(
    db,
    {
      ...scopeA,
      mutation: {
        action: "reorder",
        expected_revision: 4,
        target_order: repinned.collection.pins
          .map((pin) => pin.target)
          .reverse(),
      },
    },
    { now: () => "2026-07-29T06:03:00.000Z" },
  );
  assert.equal(reordered.status, "reordered");
  assert.equal(reordered.collection.revision, 5);
  assert.deepEqual(
    reordered.collection.pins.map((pin) => pin.target),
    repinned.collection.pins.map((pin) => pin.target).reverse(),
  );

  const missingTarget = buildContinuityPinTargetV01({
    ...scopeA,
    owner: {
      kind: "core_record",
      record_kind: "episode_delta_proposal",
      record_id: "episode-delta-proposal:ffffffffffffffffffffffff",
    },
  });
  const unsupportedTarget: ContinuityPinTargetRefV01 = {
    target_version: "continuity_pin_target.v0.1",
    ...scopeA,
    owner: {
      kind: "unsupported_source",
      source_family: "retired_projection_family",
      source_key: "retired-owner:one",
    },
  };
  insertRetainedPinV01(
    db,
    scopeA,
    missingTarget,
    2,
    proposal.bounded_summary,
    "Missing owner snapshot",
    "2026-07-29T06:04:00.000Z",
  );
  insertRetainedPinV01(
    db,
    scopeA,
    unsupportedTarget,
    3,
    "Retired pinned source",
    "Retired source snapshot",
    "2026-07-29T06:04:01.000Z",
  );
  db.prepare(
    `UPDATE vnext_project_continuity_pin_collections
     SET revision = 6, updated_at = ?
     WHERE workspace_id = ? AND project_id = ?`,
  ).run("2026-07-29T06:04:02.000Z", scopeA.workspace_id, scopeA.project_id);
  const retained = readProjectContinuityPinProjectionV01(db, scopeA);
  assert.equal(retained.revision, 6);
  assert.equal(retained.pins[2]!.resolution_status, "temporarily_unavailable");
  assert.equal(retained.pins[2]!.destination, null);
  assert.equal(retained.pins[2]!.label, proposal.bounded_summary);
  assert.equal(
    retained.pins[2]!.destination,
    null,
    "a missing owner must not retarget to a same-label proposal",
  );
  assert.equal(retained.pins[3]!.resolution_status, "no_longer_supported");
  assert.equal(retained.pins[3]!.destination, null);

  const unresolvedReorder = mutateProjectContinuityPinsV01(
    db,
    {
      ...scopeA,
      mutation: {
        action: "reorder",
        expected_revision: 6,
        target_order: [
          missingTarget,
          ...retained.pins
            .filter(
              (pin) =>
                !sameContinuityPinTargetV01(pin.target, missingTarget),
            )
            .map((pin) => pin.target),
        ],
      },
    },
    { now: () => "2026-07-29T06:05:00.000Z" },
  );
  assert.equal(unresolvedReorder.status, "reordered");
  assert.equal(
    unresolvedReorder.collection.pins[0]!.resolution_status,
    "temporarily_unavailable",
  );

  db.close();
  db = openDatabase();
  const afterRestart = readProjectContinuityPinProjectionV01(db, scopeA);
  assert.equal(afterRestart.revision, 7);
  assert.deepEqual(
    afterRestart.pins.map((pin) => pin.target),
    unresolvedReorder.collection.pins.map((pin) => pin.target),
  );

  const selectionA = readActiveProjectSelectionV01(db, workspace.workspace_id)!;
  selectActiveProjectV01(db, {
    workspace_id: workspace.workspace_id,
    project_id: projectB.project.project_id,
    expected_project_id: selectionA.project_id,
    expected_revision: selectionA.selection_revision,
    now: "2026-07-29T06:06:00.000Z",
  });
  expectStoreErrorV01(
    () =>
      mutateProjectContinuityPinsV01(db!, {
        ...scopeA,
        mutation: {
          action: "unpin",
          expected_revision: 7,
          target: missingTarget,
        },
      }),
    "continuity_pin_project_mismatch",
  );
  assert.equal(readProjectContinuityPinProjectionV01(db, scopeB).revision, 0);
  assert.equal(readProjectContinuityPinProjectionV01(db, scopeA).revision, 7);

  const selectionB = readActiveProjectSelectionV01(db, workspace.workspace_id)!;
  selectActiveProjectV01(db, {
    workspace_id: workspace.workspace_id,
    project_id: projectA.project.project_id,
    expected_project_id: selectionB.project_id,
    expected_revision: selectionB.selection_revision,
    now: "2026-07-29T06:07:00.000Z",
  });

  const alreadyUnpinned = mutateProjectContinuityPinsV01(db, {
    ...scopeA,
    mutation: {
      action: "unpin",
      expected_revision: 0,
      target: buildContinuityPinTargetV01({
        ...scopeA,
        owner: {
          kind: "core_record",
          record_kind: "run_receipt",
          record_id: "run-receipt:eeeeeeeeeeeeeeeeeeeeeeee",
        },
      }),
    },
  });
  assert.equal(alreadyUnpinned.status, "already_unpinned");
  assert.equal(alreadyUnpinned.collection.revision, 7);
  expectStoreErrorV01(
    () =>
      mutateProjectContinuityPinsV01(db!, {
        ...scopeA,
        mutation: {
          action: "unpin",
          expected_revision: 7,
          target: {
            ...missingTarget,
            workspace_id: "workspace:other",
          },
        },
    }),
    "continuity_pin_invalid_target",
  );
  expectStoreErrorV01(
    () =>
      readProjectContinuityPinProjectionV01(db!, {
        workspace_id: "workspace:other",
        project_id: scopeA.project_id,
      }),
    "continuity_pin_project_mismatch",
  );

  const sourceAfter = await readBlankStateSourceV01(db, {
    route_mode: "canonical",
    requested_project_id: null,
  });
  const continuityAfter = buildBlankStateContinuityV01(sourceAfter);
  assert.deepEqual(
    authoritySnapshotV01(db, continuityAfter),
    authorityBefore,
    "pin writes must not change attention, recommendation, action, Decision, Transition, or Core state",
  );

  const routeCollection = await routeGetV01(scopeA.project_id);
  assert.equal(routeCollection.revision, 7);
  const routePin = await routePostV01({
    action: "pin",
    project_id: scopeA.project_id,
    expected_revision: 7,
    source_item_id: eligibleItem.item_id,
    target: eligibleItem.pinning.status === "eligible"
      ? eligibleItem.pinning.target
      : null,
  });
  assert.equal(routePin.status, 200);
  assert.equal(
    (
      (routePin.body.result as { status: string })
    ).status,
    "already_pinned",
  );
  const staleRouteMutation = await routePostV01({
    action: "unpin",
    project_id: scopeA.project_id,
    expected_revision: 6,
    target: missingTarget,
  });
  assert.equal(staleRouteMutation.status, 409);
  assert.equal(
    staleRouteMutation.body.error_code,
    "continuity_pin_stale_write",
  );
  assert.equal(staleRouteMutation.body.current_revision, 7);

  const portable = exportActivePortableProjectV01(db, {
    include_personal_perspective: false,
    exported_at: "2026-07-29T06:08:00.000Z",
  });
  const portableText = new TextDecoder().decode(portable.bytes);
  assert.equal(portableText.includes(pinOnlySnapshot), false);
  assert.equal(portableText.includes("vnext_project_continuity_pins"), false);
  assert.equal(portableText.includes("continuity_pin_target.v0.1"), false);

  db.close();
  db = null;
  const createRecoveryBackupForTest = createRecoveryBackup as unknown as (
    options: Record<string, unknown>,
  ) => Promise<{ backupPath: string }>;
  const validateRecoveryBackupForTest = validateRecoveryBackup as unknown as (
    options: Record<string, unknown>,
  ) => {
    payloadPath: string;
    manifest: { database: { recovery_eligible: boolean } };
  };
  const stageRecoveryBackupDatabaseForTest =
    stageRecoveryBackupDatabase as unknown as (
      options: Record<string, unknown>,
    ) => Promise<{ schema_classification: string }>;
  const backup = await createRecoveryBackupForTest({
    databasePath: dbPath,
    backupDirectory,
    applicationScopeFingerprint: "c".repeat(64),
    sourceApplication: {
      application_version: "0.1.1+cux2.test",
      build_identity: `sha256:${"d".repeat(64)}`,
      package_contract: "augnes.distributable.v1",
      package_contract_version: 1,
      runtime_contract: "augnes-local-runtime-supervisor-v1",
      runtime_schema_version: 2,
    },
    reason: "manual_recovery",
    inspectDatabase: inspectRecoveryDatabaseFile,
    backupBasename:
      "augnes-recovery-20260729T060900-91919191.backup",
    stagingBasename:
      ".augnes-recovery-incomplete-91919191-9191-4191-8191-919191919191",
    now: () => new Date("2026-07-29T06:09:00.000Z"),
  });
  const selected = validateRecoveryBackupForTest({
    backupPath: backup.backupPath,
    expectedApplicationScopeFingerprint: "c".repeat(64),
    inspectDatabase: inspectRecoveryDatabaseFile,
  });
  const restoredInspection = await stageRecoveryBackupDatabaseForTest({
    selectedBackup: selected,
    targetPath: restoredPath,
    inspectDatabase: inspectRecoveryDatabaseFile,
    migrateDatabase: applyCanonicalDatabaseMigrations,
  });
  assert.equal(restoredInspection.schema_classification, "current");
  const restored = new Database(restoredPath);
  restored.pragma("foreign_keys = ON");
  try {
    const restoredPins = readProjectContinuityPinProjectionV01(
      restored,
      scopeA,
    );
    assert.equal(restoredPins.revision, 7);
    assert.deepEqual(
      storedPinSnapshotV01(restoredPins),
      storedPinSnapshotV01(afterRestart),
    );
  } finally {
    restored.close();
  }

  console.log(
    JSON.stringify(
      {
        status: "ok",
        assertions: {
          product_shell_primary_landmark_isolation: true,
          migration_from_pre_pinned_schema: true,
          migration_idempotency: true,
          pin_unpin_idempotency: true,
          collection_cas_and_reorder: true,
          deterministic_order_and_restart: true,
          project_and_workspace_scope_guard: true,
          owner_outside_bounded_list_resolves: true,
          resolved_renamed_and_route_derived_owner: true,
          unresolved_and_unsupported_retained: true,
          no_label_retarget_or_stale_url: true,
          recovery_backup_restore: true,
          portable_export_excludes_personal_pins: true,
          attention_recommendation_action_authority_unchanged: true,
          api_read_and_idempotent_pin: true,
          api_stale_write_returns_current_revision: true,
          additive_rollback_tables_only: true,
        },
      },
      null,
      2,
    ),
  );
  } finally {
    db?.close();
    process.env = originalEnvironment;
    rmSync(root, { recursive: true, force: true });
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

function registerProjectV01(
  database: Database.Database,
  workspaceId: string,
  projectRoot: string,
  displayName: string,
  uuid: string,
) {
  return getOrCreateCanonicalProjectForLocalRootV01(
    database,
    {
      workspace_id: workspaceId,
      local_root: normalizeLocalProjectRootRefV01(projectRoot, {
        base_path: root,
      }),
      display_name: displayName,
    },
    {
      create_uuid: () => uuid,
      now: () => NOW,
    },
  );
}

function requireEligibleItemV01(
  items: BlankStateContinuityItemV01[],
): BlankStateContinuityItemV01 & {
  pinning: Extract<
    BlankStateContinuityItemV01["pinning"],
    { status: "eligible" }
  >;
} {
  const item = items.find(
    (
      candidate,
    ): candidate is BlankStateContinuityItemV01 & {
      pinning: Extract<
        BlankStateContinuityItemV01["pinning"],
        { status: "eligible" }
      >;
    } => candidate.pinning.status === "eligible",
  );
  assert(
    item,
    `fixture must expose a source-backed pinnable continuity: ${JSON.stringify(
      items.map((candidate) => ({
        family: candidate.source_family,
        pinning: candidate.pinning,
      })),
    )}`,
  );
  return item;
}

function expectStoreErrorV01(
  operation: () => unknown,
  code: ProjectContinuityPinStoreErrorV01["code"],
): void {
  assert.throws(operation, (error: unknown) => {
    assert(error instanceof ProjectContinuityPinStoreErrorV01);
    assert.equal(error.code, code);
    return true;
  });
}

function authoritySnapshotV01(
  database: Database.Database,
  composition: ReturnType<typeof buildBlankStateContinuityV01>,
) {
  const counts = database
    .prepare(
      `SELECT
        (SELECT COUNT(*) FROM vnext_core_records) AS core_records,
        (SELECT COUNT(*) FROM vnext_core_records
          WHERE record_kind = 'review_decision') AS review_decisions,
        (SELECT COUNT(*) FROM vnext_core_records
          WHERE record_kind = 'state_transition_receipt') AS transitions,
        (SELECT COUNT(*) FROM autonomy_runs) AS runs`,
    )
    .get() as Record<string, number>;
  return {
    counts,
    known_attention_count: composition.known_attention_count,
    attention_count_status: composition.attention_count_status,
    source_omitted_attention_count:
      composition.source_omitted_attention_count,
    recommended_item_id: composition.highlighted_item.item_id,
    item_order: [
      composition.highlighted_item,
      ...composition.continuity_items,
    ].map((item) => item.item_id),
    primary_action: composition.primary_action,
  };
}

function testProductShellPinnedLandmarkV01(): void {
  const pinnedSection = createElement(
    "section",
    {
      "aria-labelledby": "test-pinned-heading",
      "data-continuity-pins-navigation": "desktop",
    },
    createElement("p", { id: "test-pinned-heading" }, "Pinned"),
    createElement("a", { href: "/workbench/inspector" }, "Pinned destination"),
    createElement("button", { type: "button" }, "Move up"),
    createElement("button", { type: "button" }, "Move down"),
    createElement("button", { type: "button" }, "Unpin"),
    createElement("button", { type: "button" }, "Retry resolution"),
  );
  const withPins = renderToStaticMarkup(
    createElement(
      ProductShell,
      {
        primaryZone: "blank-state",
        secondaryNavigation: pinnedSection,
        children: createElement("p", null, "Continuity content"),
      },
    ),
  );
  assert.match(withPins, /aria-label="Augnes home"[\s\S]*<strong>Augnes<\/strong>/u);
  assert.doesNotMatch(withPins, /product-brand-mark|<svg/u);
  const primaryNavigationMatches = [
    ...withPins.matchAll(
      /<nav class="product-navigation" aria-label="Primary navigation">([\s\S]*?)<\/nav>/gu,
    ),
  ];
  assert.equal(primaryNavigationMatches.length, 1);
  const primaryNavigation = primaryNavigationMatches[0]?.[1] ?? "";
  assert.deepEqual(
    [...primaryNavigation.matchAll(/<strong>([^<]+)<\/strong>/gu)].map(
      (match) => match[1],
    ),
    ["Continuities", "AI Workplane"],
  );
  assert.equal([...primaryNavigation.matchAll(/<a /gu)].length, 2);
  assert.doesNotMatch(
    primaryNavigation,
    /Pinned|Move up|Move down|Unpin|Retry resolution|<button/u,
  );
  assert(
    withPins.indexOf("data-continuity-pins-navigation") >
      withPins.indexOf("</nav>"),
    "Pinned must render after, rather than inside, Primary navigation",
  );

  function EmptySecondaryNavigation() {
    return null;
  }
  const withoutPins = renderToStaticMarkup(
    createElement(
      ProductShell,
      {
        primaryZone: "blank-state",
        secondaryNavigation: createElement(EmptySecondaryNavigation),
        children: createElement("p", null, "Continuity content"),
      },
    ),
  );
  assert.doesNotMatch(
    withoutPins,
    /data-continuity-pins-navigation|Pinned|secondary-navigation/u,
  );
  assert.match(
    withoutPins,
    /<div class="product-navigation-rail"><nav class="product-navigation" aria-label="Primary navigation">[\s\S]*?<\/nav><\/div>/u,
  );

  const withRailSupport = renderToStaticMarkup(
    createElement(
      ProductShell,
      {
        primaryZone: "blank-state",
        railSupport: createElement(
          "section",
          { "data-product-rail-support": "guidebrief" },
          "Ask GuideBrief",
        ),
        children: createElement("p", null, "Continuity content"),
      },
    ),
  );
  assert(
    withRailSupport.indexOf("data-product-rail-support") >
      withRailSupport.indexOf("</nav>"),
    "GuideBrief support must remain a sibling after Primary navigation",
  );
  assert.doesNotMatch(
    withRailSupport.match(
      /<nav class="product-navigation" aria-label="Primary navigation">([\s\S]*?)<\/nav>/u,
    )?.[1] ?? "",
    /GuideBrief/u,
  );
}

function insertRetainedPinV01(
  database: Database.Database,
  scope: { workspace_id: string; project_id: string },
  target: ContinuityPinTargetRefV01,
  sortOrder: number,
  label: string,
  state: string,
  timestamp: string,
): void {
  database.prepare(
    `INSERT INTO vnext_project_continuity_pins (
      workspace_id, project_id, target_key, target_ref_json,
      source_family_snapshot, source_item_id_snapshot,
      label_snapshot, state_snapshot, sort_order, pinned_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    scope.workspace_id,
    scope.project_id,
    targetKeyV01(target),
    JSON.stringify(target),
    "project_attention",
    `continuity:retained:${sortOrder}`,
    label,
    state,
    sortOrder,
    timestamp,
    timestamp,
  );
}

function targetKeyV01(target: ContinuityPinTargetRefV01): string {
  return `sha256:${createHash("sha256")
    .update(continuityPinTargetIdentityV01(target))
    .digest("hex")}`;
}

function storedPinSnapshotV01(
  collection: ProjectContinuityPinProjectionV01,
) {
  return {
    revision: collection.revision,
    pins: collection.pins.map((pin) => ({
      target: pin.target,
      source_family_snapshot: pin.source_family_snapshot,
      source_item_id_snapshot: pin.source_item_id_snapshot,
      label: pin.label,
      state_label: pin.state_label,
      resolution_status: pin.resolution_status,
      destination: pin.destination,
      sort_order: pin.sort_order,
      pinned_at: pin.pinned_at,
      updated_at: pin.updated_at,
    })),
  };
}

function normalizedTableShapeV01(
  database: Database.Database,
  table: string,
) {
  return {
    columns: database.prepare(`PRAGMA table_info(${table})`).all(),
    foreign_keys: database
      .prepare(`PRAGMA foreign_key_list(${table})`)
      .all(),
    indexes: database.prepare(`PRAGMA index_list(${table})`).all(),
  };
}

function testMigrationParityAndPrePinnedUpgradeV01(): void {
  assert(
    CANONICAL_DATABASE_SUPPORTED_SOURCE_SCHEMA_SIGNATURES.includes(
      PRE_PINNED_CUX1_SCHEMA_SIGNATURE,
    ),
  );
  const runtime = new Database(":memory:");
  const direct = new Database(":memory:");
  try {
    applyCanonicalDatabaseMigrations(runtime);
    applyCanonicalDatabaseMigrations(runtime);
    applyCanonicalDatabaseMigrations(direct);
    direct.exec(VNEXT_PROJECT_CONTINUITY_PIN_SCHEMA_SQL_V01);
    direct.exec(vNextProjectContinuityPinSchemaSqlV01);
    for (const table of [
      "vnext_project_continuity_pin_collections",
      "vnext_project_continuity_pins",
    ]) {
      assert.deepEqual(
        normalizedTableShapeV01(runtime, table),
        normalizedTableShapeV01(direct, table),
      );
    }
    const coreBefore = runtime
      .prepare("SELECT COUNT(*) AS count FROM vnext_core_records")
      .get() as { count: number };
    runtime.exec(`
      DROP INDEX idx_vnext_project_continuity_pins_project_order;
      DROP TABLE vnext_project_continuity_pins;
      DROP TABLE vnext_project_continuity_pin_collections;
      DROP TABLE vnext_repository_managed_resume_cancellations;
      DROP TABLE vnext_repository_managed_resume_runtime_claim_history;
      DROP TABLE vnext_repository_managed_resume_runtime_claims;
      DROP TABLE vnext_repository_managed_resume_attempts;
      DROP TABLE vnext_repository_run_resume_checkpoints;
      DROP TABLE vnext_repository_execution_decision_requests;
      DROP TABLE vnext_repository_execution_attachments;
      DROP TABLE vnext_repository_root_rebind_receipts;
      DROP TABLE vnext_physical_root_baselines;
      DROP INDEX idx_vnext_local_operator_sessions_decision_token;
      DROP INDEX idx_vnext_local_operator_sessions_decision_nonce;
      ALTER TABLE vnext_local_operator_sessions DROP COLUMN decision_session_token_hash;
      ALTER TABLE vnext_local_operator_sessions DROP COLUMN decision_action_nonce_hash;
      ALTER TABLE vnext_local_operator_sessions DROP COLUMN decision_action_nonce_expires_at;
    `);
    assert.equal(
      structuralSchemaContractSignature(runtime),
      PRE_PINNED_CUX1_SCHEMA_SIGNATURE,
    );
    applyCanonicalDatabaseMigrations(runtime);
    assert.equal(runtime.pragma("integrity_check", { simple: true }), "ok");
    assert.deepEqual(
      runtime
        .prepare("SELECT COUNT(*) AS count FROM vnext_core_records")
        .get(),
      coreBefore,
      "the additive migration must not alter existing project records",
    );
    assert(
      runtime
        .prepare(
          `SELECT 1 FROM sqlite_master
           WHERE type = 'table'
             AND name = 'vnext_project_continuity_pin_collections'`,
        )
        .get(),
    );
  } finally {
    runtime.close();
    direct.close();
  }
}

function routeRequestV01(
  method: "GET" | "POST",
  url: string,
  body?: Record<string, unknown>,
): Request {
  return new Request(url, {
    method,
    headers: {
      host: "127.0.0.1:3100",
      origin: "http://127.0.0.1:3100",
      "content-type": "application/json",
      "sec-fetch-site": "same-origin",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function routeGetV01(
  projectId: string,
): Promise<ProjectContinuityPinProjectionV01> {
  const response = await pinsGET(
    routeRequestV01(
      "GET",
      `http://127.0.0.1:3100/api/vnext/continuity-pins?project_id=${encodeURIComponent(projectId)}`,
    ),
  );
  const body = (await response.json()) as {
    ok: boolean;
    collection: ProjectContinuityPinProjectionV01;
  };
  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  return body.collection;
}

async function routePostV01(body: Record<string, unknown>) {
  const response = await pinsPOST(
    routeRequestV01(
      "POST",
      "http://127.0.0.1:3100/api/vnext/continuity-pins",
      body,
    ),
  );
  return {
    status: response.status,
    body: (await response.json()) as Record<string, unknown>,
  };
}
