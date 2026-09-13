import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  OPERATOR_EXECUTION_FIXTURE_PROFILES_V1,
  OPERATOR_EXECUTION_FIXTURE_VERSION_V1,
  OPERATOR_EXECUTION_INSPECTOR_ROUTE_FIXTURE_VERSION_V1,
  buildOperatorExecutionBrowserFixtureV1,
  operatorExecutionFixtureFingerprintV1,
} from "./operator-execution-browser-fixture-v1";
import { captureOperatorExecutionEffectSnapshotV1 } from "./operator-execution-effect-ledger-v1.mjs";

const roots: string[] = [];
const require = createRequire(import.meta.url);
const Database = require("better-sqlite3");
void main();

async function main() {
try {
  const fixtures = [];
  for (const [index, profile] of OPERATOR_EXECUTION_FIXTURE_PROFILES_V1.entries()) {
    const root = mkdtempSync(path.join(tmpdir(), `ag-operator-fixture-${index}-`));
    roots.push(root);
    const fixture = await buildOperatorExecutionBrowserFixtureV1({
      output_directory: root,
      reference_time: `2026-08-02T00:00:0${index}.000Z`,
      profile,
    });
    fixtures.push(fixture);
    assert.equal(fixture.manifest.fixture_version, OPERATOR_EXECUTION_FIXTURE_VERSION_V1);
    assert.equal(fixture.manifest.profile, profile);
    assert.equal(fixture.manifest.source_bound, true);
    assert.equal(fixture.manifest.provider_network_capability, "none");
    assert.equal(fixture.manifest.credential_material_included, false);
    assert.equal(
      fixture.manifest.fixture_fingerprint,
      operatorExecutionFixtureFingerprintV1(fixture.manifest),
    );
    assert.notEqual(
      path.resolve(fixture.source_database_path),
      path.resolve(fixture.writable_database_path),
    );
    assert.equal(fixture.manifest.source_database_sha256, sha256(fixture.source_database_path));
    assert.equal(fixture.manifest.writable_seed_sha256, sha256(fixture.writable_database_path));
    assert.equal(
      JSON.stringify(fixture.manifest).includes(root),
      false,
      "public manifest must not contain a private absolute root",
    );
    assert.doesNotThrow(() =>
      captureOperatorExecutionEffectSnapshotV1({
        database_path: fixture.writable_database_path,
      }),
    );
    const persisted = JSON.parse(readFileSync(fixture.manifest_path, "utf8"));
    assert.deepEqual(persisted, fixture.manifest);
  }
  assert.equal(
    new Set(fixtures.map((fixture) => fixture.writable_database_path)).size,
    fixtures.length,
  );
  assert.equal(
    new Set(fixtures.map((fixture) => fixture.manifest.fixture_fingerprint)).size,
    fixtures.length,
  );
  const review = fixtures.find(f => f.manifest.profile === "review_control")!;
  const native = fixtures.find(f => f.manifest.profile === "native_host_execution")!;
  const expectation = fixtures.find(f => f.manifest.profile === "work_expectation")!;
  const multi = fixtures.find(f => f.manifest.profile === "multi_candidate")!;
  assert.equal(OPERATOR_EXECUTION_FIXTURE_PROFILES_V1.length, 4);
  assert.equal(expectation.manifest.execution_capability, "deterministic_local_only");
  assert.equal(native.manifest.expectation_project_id, null);
  assert.match(expectation.manifest.expectation_project_id ?? "", /^project:/u);
  assert.equal(expectation.manifest.profile_project_id, null);
  assert.equal(expectation.manifest.automation_project_id, null);
  assert.equal(expectation.manifest.multi_candidate_fixture, null);
  assert.equal(expectation.manifest.inspector_route_fixture, null);
  const expectationDatabase = new Database(expectation.writable_database_path, { readonly: true, fileMustExist: true });
  try {
    const projectId = expectation.manifest.expectation_project_id;
    for (const [table, column] of [["vnext_core_records", "project_id"], ["autonomy_runs", "scope"], ["vnext_local_operator_sessions", "project_id"]]) {
      assert.equal(expectationDatabase.prepare(`SELECT COUNT(*) AS count FROM ${table} WHERE ${column} = ?`).get(projectId).count, 0, `F1 starts without borrowed ${table}`);
    }
  } finally {
    expectationDatabase.close();
  }
  assert.equal(review.manifest.execution_capability, "none");
  assert.equal(
    native.manifest.execution_capability,
    "deterministic_local_only",
  );
  assert.equal(multi.manifest.execution_capability, "none");
  assert.match(review.manifest.profile_project_id ?? "", /^project:/u);
  assert.notEqual(
    review.manifest.profile_project_id,
    review.manifest.project_id,
  );
  assert.match(native.manifest.profile_project_id ?? "", /^project:/u);
  assert.equal(multi.manifest.profile_project_id, null);
  assert.equal(review.manifest.multi_candidate_fixture, null);
  assert.equal(native.manifest.multi_candidate_fixture, null);
  assert.equal(multi.manifest.multi_candidate_fixture?.candidate_ids.length, 2);
  assert.match(
    multi.manifest.multi_candidate_fixture?.exact_binding
      .pending_proposal_id ?? "",
    /^episode-delta-proposal:/u,
  );
  assert.notEqual(
    multi.manifest.multi_candidate_fixture?.exact_binding
      .pending_proposal_id,
    multi.manifest.multi_candidate_fixture?.exact_binding
      .newer_proposal_id,
  );
  assert.equal(
    multi.manifest.permitted_effect_contract.core_insert_counts
      .review_decision,
    4,
  );
  assert.equal(
    review.manifest.inspector_route_fixture?.fixture_version,
    OPERATOR_EXECUTION_INSPECTOR_ROUTE_FIXTURE_VERSION_V1,
  );
  assert.equal(
    review.manifest.inspector_route_fixture?.admitted_record_count,
    2,
  );
  assert.match(
    review.manifest.inspector_route_fixture?.bounded_receipt_id ?? "",
    /^run-receipt:/u,
  );
  const inspectorDatabase = new Database(review.writable_database_path, {
    readonly: true,
    fileMustExist: true,
  });
  try {
    const inspectorFixture = review.manifest.inspector_route_fixture!;
    const receiptRow = inspectorDatabase
      .prepare(
        `SELECT workspace_id, project_id, fingerprint, payload_json
         FROM vnext_core_records
         WHERE record_kind = 'run_receipt' AND record_id = ?`,
      )
      .get(inspectorFixture.bounded_receipt_id) as {
      workspace_id: string;
      project_id: string;
      fingerprint: string;
      payload_json: string;
    };
    assert.equal(receiptRow.workspace_id, review.manifest.workspace_id);
    assert.equal(receiptRow.project_id, inspectorFixture.project_id);
    assert.equal(
      receiptRow.fingerprint,
      inspectorFixture.bounded_receipt_fingerprint,
    );
    assert.equal(
      (JSON.parse(receiptRow.payload_json).capability_coverage as unknown[])
        .length,
      65,
    );
  } finally {
    inspectorDatabase.close();
  }
  assert.equal(native.manifest.inspector_route_fixture, null);
  assert.equal(multi.manifest.inspector_route_fixture, null);
  process.stdout.write(
    `${JSON.stringify({
      test: "operator-execution-browser-fixture-v1",
      status: "pass",
      profiles: OPERATOR_EXECUTION_FIXTURE_PROFILES_V1,
      independent_writable_databases: fixtures.length,
    })}\n`,
  );
} finally {
  for (const root of roots) rmSync(root, { recursive: true, force: true });
}
}

function sha256(filePath: string) {
  return `sha256:${createHash("sha256").update(readFileSync(filePath)).digest("hex")}`;
}
