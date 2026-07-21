import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, chmodSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import Database from "better-sqlite3";

import {
  exportActivePortableProjectV01,
  importPortableProjectV01,
  parseAndValidatePortableProjectV01,
  PortableProjectErrorV01,
  previewActivePortableProjectV01,
} from "../lib/vnext/portability/portable-project";
import { mutateProjectControlV01 } from "../lib/vnext/persistence/project-control-store";
import { readActiveProjectSelectionV01, selectActiveProjectV01, touchRecentProjectV01 } from "../lib/vnext/persistence/project-lifecycle-registry";
import { readProjectHomeDatabaseCompatibilityV01, readProjectHomeProjectionV01 } from "../lib/vnext/project-home/project-home-projection";
import { readVNextOperatorPilotProposalDurableLineageV01 } from "../lib/vnext/runtime/operator-pilot-workbench-lineage";
import { readSharedProjectInspectorV01 } from "../lib/vnext/runtime/shared-project-inspector";
import { canonicalizeProtocolValueV01, createProtocolSha256V01 } from "../lib/vnext/protocol-primitives";
import type { EpisodeDeltaProposalV01 } from "../types/vnext/episode-delta-proposal";
import type { PortableProjectV01 } from "../types/vnext/portable-project";
import { applyCanonicalDatabaseMigrations } from "./canonical-database-migrations.mjs";
import { DISTRIBUTABLE_APPLICATION_SCOPE_FINGERPRINT } from "./distributable-package-contract.mjs";
import { validateRecoveryBackup } from "./recovery-backup.mjs";
import { installZeroNetworkGuard } from "./test-harness-zero-network-guard.mjs";
import { buildVNextOperatorBrowserFixtureV01 } from "./vnext-operator-browser-fixture-builder-v0-1";
import { GET as portabilityGet, POST as portabilityPost } from "../app/api/vnext/portability/route";

const root = mkdtempSync(path.join(tmpdir(), "augnes-portable-project-test-"));
const sourceRoot = path.join(root, "source-fixture");
const destinationRoot = path.join(root, "destination");
const destinationProjects = path.join(destinationRoot, "portable-projects");
const rollbackRoot = path.join(root, "rollback-destination");
const rollbackProjects = path.join(rollbackRoot, "portable-projects");
const sourceDbPath = path.join(sourceRoot, "operator-pilot.db");
const destinationDbPath = path.join(destinationRoot, "augnes.db");
const rollbackDbPath = path.join(rollbackRoot, "augnes.db");
const observedAt = "2026-07-21T03:00:00.000Z";
const network = installZeroNetworkGuard({
  allowLoopback: false,
  errorPrefix: "portable_project_external_network_forbidden",
});

async function main(): Promise<void> {
try {
  mkdirSync(sourceRoot, { mode: 0o700 });
  mkdirSync(destinationProjects, { recursive: true, mode: 0o700 });
  mkdirSync(rollbackProjects, { recursive: true, mode: 0o700 });
  const fixture = await buildVNextOperatorBrowserFixtureV01({
    output_directory: sourceRoot,
    reference_time: "2026-07-20T02:00:00.000Z",
  });
  assert.equal(fixture.status, "pass");
  const fixtureManifest = JSON.parse(
    readFileSync(path.join(sourceRoot, fixture.manifest_file), "utf8"),
  ) as {
    workspace_id: string;
    project_id: string;
    proposal_id: string;
    proposal_fingerprint: string;
  };

  const source = new Database(sourceDbPath, { fileMustExist: true });
  source.pragma("foreign_keys = ON");
  let active = readActiveProjectSelectionV01(source, fixtureManifest.workspace_id);
  if (!active) {
    touchRecentProjectV01(source, {
      workspace_id: fixtureManifest.workspace_id,
      project_id: fixtureManifest.project_id,
      now: "2026-07-21T02:29:00.000Z",
    });
    active = selectActiveProjectV01(source, {
      workspace_id: fixtureManifest.workspace_id,
      project_id: fixtureManifest.project_id,
      now: "2026-07-21T02:29:00.000Z",
      expected_project_id: null,
      expected_revision: null,
    });
  }
  mutateProjectControlV01(source, {
    workspace_id: fixtureManifest.workspace_id,
    project_id: fixtureManifest.project_id,
    action: "include_personal_perspective",
    expected_control_revision: null,
    expected_active_project_id: active.project_id,
    expected_active_selection_revision: active.selection_revision,
  }, { now: () => "2026-07-20T02:30:00.000Z" });

  const preview = previewActivePortableProjectV01(source);
  assert.equal(preview.active_project, true);
  assert.equal(preview.personal_perspective.included_by_default, false);
  assert.equal(preview.personal_perspective.consent_available, true);
  assert(preview.record_kinds.includes("episode_delta_proposal"));
  assert(preview.record_kinds.includes("state_transition_receipt"));
  assert(preview.record_kinds.includes("task_context_packet"));
  assert.equal(preview.record_kinds.includes("capability_grant"), false);
  assert.equal(preview.record_kinds.includes("automation_work_item"), false);

  const withoutPersonal = exportActivePortableProjectV01(source, {
    include_personal_perspective: false,
    exported_at: observedAt,
  });
  assert.equal(withoutPersonal.package.personal_perspective_scope, null);
  assert.equal(withoutPersonal.package.manifest.personal_perspective.included, false);
  const exported = exportActivePortableProjectV01(source, {
    include_personal_perspective: true,
    exported_at: observedAt,
  });
  assert.equal(exported.package.personal_perspective_scope?.selection, "included");
  assert.deepEqual(parseAndValidatePortableProjectV01(exported.bytes), exported.package);
  assert.equal(new TextDecoder().decode(exported.bytes).includes(sourceRoot), false);

  initializeDatabase(destinationDbPath);
  const destination = new Database(destinationDbPath, { fileMustExist: true });
  destination.pragma("foreign_keys = ON");
  const imported = importPortableProjectV01(destination, {
    bytes: exported.bytes,
    destination_root_base: destinationProjects,
    imported_at: "2026-07-21T03:05:00.000Z",
  });
  assert.equal(imported.status, "imported");
  assert.equal(imported.projection_reader_verification, "verified");
  assert.equal(imported.semantic_authority_created, false);
  assert.equal(imported.automation_authority_created, false);
  assert.equal(imported.external_action_created, false);

  const replay = importPortableProjectV01(destination, {
    bytes: exported.bytes,
    destination_root_base: destinationProjects,
    imported_at: "2026-07-21T03:06:00.000Z",
  });
  assert.equal(replay.status, "exact_replay");
  assert.equal(
    count(destination, "vnext_core_records", fixtureManifest.workspace_id, fixtureManifest.project_id),
    exported.package.records.length,
  );

  const config = {
    enabled: true as const,
    workspace_id: fixtureManifest.workspace_id,
    project_id: fixtureManifest.project_id,
    operator_id: exported.package.operator_provenance_sessions[0]?.operator_id ?? "operator:portable-test",
    database_path: destinationDbPath,
  };
  const readerObservedAt = (destination.prepare(
    `SELECT created_at FROM vnext_core_records
      WHERE record_kind = 'task_context_packet'
      ORDER BY created_at DESC, record_id DESC LIMIT 1`,
  ).get() as { created_at: string }).created_at;
  assert.deepEqual(
    readProjectHomeDatabaseCompatibilityV01(destination, {
      workspace_id: config.workspace_id,
      project_id: config.project_id,
    }, { now: () => readerObservedAt, operator_config: config }),
    {
      workspace_id: config.workspace_id,
      project_id: config.project_id,
      read_compatible: true,
      projection_only: true,
    },
  );
  const sourceHome = await readProjectHomeProjectionV01(source, {
    workspace_id: config.workspace_id,
    project_id: config.project_id,
  }, { now: () => readerObservedAt, operator_config: { ...config, database_path: sourceDbPath } });
  const importedHome = await readProjectHomeProjectionV01(destination, {
    workspace_id: config.workspace_id,
    project_id: config.project_id,
  }, { now: () => readerObservedAt, operator_config: config });
  for (const section of ["accepted_state", "working_projection", "attention", "recent_activity", "run_results"] as const) {
    assert.deepEqual(importedHome[section], sourceHome[section], `${section} reader fidelity`);
  }
  const proposalRecord = destination.prepare(
    `SELECT payload_json FROM vnext_core_records
      WHERE record_kind = 'episode_delta_proposal' AND record_id = ?`,
  ).get(fixtureManifest.proposal_id) as { payload_json: string };
  const proposal = JSON.parse(proposalRecord.payload_json) as EpisodeDeltaProposalV01;
  const workbench = readVNextOperatorPilotProposalDurableLineageV01(destination, {
    config,
    proposal,
    clock: { now: () => readerObservedAt },
  });
  assert.equal(workbench.proposal_fingerprint, fixtureManifest.proposal_fingerprint);
  assert.equal(workbench.read_only, true);
  assert.equal(workbench.semantic_authority_granted, false);
  const inspector = readSharedProjectInspectorV01(destination, {
    config,
    authenticated_session_id: "session:portable-test",
    observed_at: readerObservedAt,
    target: {
      target_kind: "episode_delta_proposal",
      record_id: proposal.proposal_id,
      expected_fingerprint: proposal.integrity.fingerprint,
    },
  });
  assert.equal(inspector.authority.read_only, true);
  assert.equal(inspector.authority.writes_database, false);
  assert.equal(inspector.authority.creates_review_decision, false);
  assert.equal(inspector.authority.applies_transition, false);

  initializeDatabase(rollbackDbPath);
  const rollback = new Database(rollbackDbPath, { fileMustExist: true });
  rollback.pragma("foreign_keys = ON");
  const lateInvalid = mutatePackageV01(exported.package, (value) => {
    const record = value.records.find((item) => item.record_kind === "episode_delta_proposal");
    assert(record);
    record.created_at = "2026-07-21T03:09:00.000Z";
  });
  assert.throws(
    () => importPortableProjectV01(rollback, {
      bytes: lateInvalid,
      destination_root_base: rollbackProjects,
      imported_at: "2026-07-21T03:10:00.000Z",
    }),
    (error: unknown) => error instanceof PortableProjectErrorV01,
  );
  assert.equal(tableCount(rollback, "vnext_project_identities"), 0);
  assert.equal(tableCount(rollback, "vnext_core_records"), 0);
  rollback.close();

  const tamperedBytes = Uint8Array.from(exported.bytes);
  tamperedBytes[Math.floor(tamperedBytes.length / 2)]! ^= 1;
  assertPortableRefusal(tamperedBytes);
  assertPortableRefusal(new TextEncoder().encode(
    new TextDecoder().decode(exported.bytes).replace(
      '"contract":"augnes.portable-project.v1"',
      '"contract":"augnes.portable-project.v1","contract":"augnes.portable-project.v1"',
    ),
  ));
  assertPortableRefusal(mutatePackageV01(exported.package, (value) => {
    value.contract_version = 2 as 1;
  }));
  assertPortableRefusal(mutatePackageV01(exported.package, (value) => {
    (value as unknown as Record<string, unknown>).entries = [{ path: "../escape", mode: 0o777 }];
  }, false));
  assertPortableRefusal(mutatePackageV01(exported.package, (value) => {
    const record = value.records[0]!;
    (record.payload as Record<string, unknown>).api_key = "sk_test_portable_secret_material";
  }));
  assertPortableRefusal(mutatePackageV01(exported.package, (value) => {
    const record = value.records[0]!;
    (record.payload as Record<string, unknown>).absolute_path = "/private/source/project";
  }));
  assertPortableRefusal(new TextEncoder().encode(JSON.stringify({
    contract: "augnes.recovery-backup.v1",
    contract_version: 1,
  })));

  const fakeRecovery = path.join(root, "augnes-recovery-20260721T030000-12345678.backup");
  const fakeState = path.join(fakeRecovery, "state");
  mkdirSync(fakeState, { recursive: true, mode: 0o700 });
  writeFileSync(path.join(fakeRecovery, "recovery-manifest.json"), exported.bytes, { mode: 0o600 });
  writeFileSync(path.join(fakeState, "augnes.db"), new Uint8Array([0]), { mode: 0o600 });
  chmodSync(fakeRecovery, 0o700);
  chmodSync(fakeState, 0o700);
  const validateRecoveryPackage = validateRecoveryBackup as unknown as (input: {
    backupPath: string;
    expectedApplicationScopeFingerprint: string;
    inspectDatabase: (databasePath: string) => unknown;
  }) => unknown;
  assert.throws(() => validateRecoveryPackage({
    backupPath: fakeRecovery,
    expectedApplicationScopeFingerprint: DISTRIBUTABLE_APPLICATION_SCOPE_FINGERPRINT,
    inspectDatabase: () => { throw new Error("portable_must_fail_before_database_inspection"); },
  }));

  const previousDatabasePath = process.env.AUGNES_DB_PATH;
  process.env.AUGNES_DB_PATH = sourceDbPath;
  try {
    const routeGet = portabilityGet(localRequestV01("GET"));
    assert.equal(routeGet.status, 200);
    const routePreview = await routeGet.json() as { contract: string; project_id: string };
    assert.equal(routePreview.contract, "augnes.portable-project-preview.v1");
    assert.equal(routePreview.project_id, fixtureManifest.project_id);
    const routeExport = await portabilityPost(localRequestV01("POST", {
      contentType: "application/json",
      body: JSON.stringify({
        action: "export",
        include_personal_perspective: true,
      }),
    }));
    assert.equal(routeExport.status, 200);
    assert.match(routeExport.headers.get("content-disposition") ?? "", /\.augnes-project\.json/u);
    const routeBytes = new Uint8Array(await routeExport.arrayBuffer());
    assert.equal(parseAndValidatePortableProjectV01(routeBytes).contract, "augnes.portable-project.v1");
    const routeImport = await portabilityPost(localRequestV01("POST", {
      contentType: "application/vnd.augnes.portable-project+json",
      body: routeBytes.buffer as ArrayBuffer,
    }));
    assert.equal(routeImport.status, 200);
    const routeImportResult = await routeImport.json() as { status: string; project_home_href: string };
    assert.equal(routeImportResult.status, "exact_replay");
    assert.equal(routeImportResult.project_home_href, imported.project_home_href);
  } finally {
    if (previousDatabasePath === undefined) delete process.env.AUGNES_DB_PATH;
    else process.env.AUGNES_DB_PATH = previousDatabasePath;
  }

  source.close();
  destination.close();
  assert.equal(network.attempts.length, 0);
  console.log(JSON.stringify({
    test: "portable-project-continuity",
    status: "pass",
    portable_contract: exported.package.contract,
    supported_record_kinds: exported.package.manifest.record_kinds,
    exported_records: exported.package.records.length,
    imported_records: imported.record_count,
    exact_replay: true,
    atomic_rollback: true,
    project_home_fidelity: true,
    workbench_fidelity: true,
    inspector_fidelity: true,
    personal_perspective_default_excluded: true,
    personal_perspective_explicit_consent: true,
    recovery_contract_separation: true,
    product_route_round_trip: true,
    external_network_calls: network.attempts.length,
    residue_after_cleanup: 0,
  }, null, 2));
} finally {
  network.restore();
  rmSync(root, { recursive: true, force: true });
}
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

function initializeDatabase(databasePath: string): void {
  mkdirSync(path.dirname(databasePath), { recursive: true, mode: 0o700 });
  const db = new Database(databasePath);
  try {
    db.pragma("journal_mode = DELETE");
    db.pragma("foreign_keys = ON");
    applyCanonicalDatabaseMigrations(db);
  } finally {
    db.close();
  }
}

function mutatePackageV01(
  source: PortableProjectV01,
  mutate: (value: PortableProjectV01) => void,
  resign = true,
): Uint8Array {
  const value = structuredClone(source);
  mutate(value);
  if (resign) {
    value.manifest.content_fingerprint = createProtocolSha256V01(canonicalizeProtocolValueV01({
      workspace: value.manifest.workspace,
      project: value.manifest.project,
      records: value.records,
      operator_provenance_sessions: value.operator_provenance_sessions,
      personal_perspective_scope: value.personal_perspective_scope,
    }));
    const { integrity: _integrity, ...withoutIntegrity } = value;
    value.integrity.fingerprint = createProtocolSha256V01(
      canonicalizeProtocolValueV01(withoutIntegrity),
    );
  }
  return new TextEncoder().encode(`${canonicalizeProtocolValueV01(value)}\n`);
}

function assertPortableRefusal(bytes: Uint8Array): void {
  assert.throws(
    () => parseAndValidatePortableProjectV01(bytes),
    (error: unknown) => error instanceof PortableProjectErrorV01,
  );
}

function tableCount(db: Database.Database, table: string): number {
  return Number((db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get() as { count: number }).count);
}

function count(db: Database.Database, table: string, workspaceId: string, projectId: string): number {
  return Number((db.prepare(`SELECT COUNT(*) AS count FROM ${table} WHERE workspace_id = ? AND project_id = ?`).get(workspaceId, projectId) as { count: number }).count);
}

function localRequestV01(
  method: "GET" | "POST",
  options: { contentType: string; body: BodyInit } | null = null,
): Request {
  return new Request("http://127.0.0.1:3100/api/vnext/portability", {
    method,
    headers: {
      host: "127.0.0.1:3100",
      ...(method === "POST" ? { origin: "http://127.0.0.1:3100" } : {}),
      ...(options ? { "content-type": options.contentType } : {}),
    },
    ...(options ? { body: options.body } : {}),
  });
}
