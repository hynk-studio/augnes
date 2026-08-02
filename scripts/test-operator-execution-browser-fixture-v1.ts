import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  OPERATOR_EXECUTION_FIXTURE_PROFILES_V1,
  OPERATOR_EXECUTION_FIXTURE_VERSION_V1,
  buildOperatorExecutionBrowserFixtureV1,
  operatorExecutionFixtureFingerprintV1,
  snapshotOperatorExecutionEffectsV1,
} from "./operator-execution-browser-fixture-v1";

const roots: string[] = [];
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
      snapshotOperatorExecutionEffectsV1(fixture.writable_database_path),
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
  assert.equal(fixtures[0].manifest.execution_capability, "none");
  assert.equal(
    fixtures[1].manifest.execution_capability,
    "deterministic_local_only",
  );
  assert.equal(fixtures[2].manifest.execution_capability, "none");
  assert.match(fixtures[0].manifest.profile_project_id ?? "", /^project:/u);
  assert.notEqual(
    fixtures[0].manifest.profile_project_id,
    fixtures[0].manifest.project_id,
  );
  assert.match(fixtures[1].manifest.profile_project_id ?? "", /^project:/u);
  assert.equal(fixtures[2].manifest.profile_project_id, null);
  assert.equal(fixtures[0].manifest.multi_candidate_fixture, null);
  assert.equal(fixtures[1].manifest.multi_candidate_fixture, null);
  assert.equal(fixtures[2].manifest.multi_candidate_fixture?.candidate_ids.length, 2);
  assert.match(
    fixtures[2].manifest.multi_candidate_fixture?.exact_binding
      .pending_proposal_id ?? "",
    /^episode-delta-proposal:/u,
  );
  assert.notEqual(
    fixtures[2].manifest.multi_candidate_fixture?.exact_binding
      .pending_proposal_id,
    fixtures[2].manifest.multi_candidate_fixture?.exact_binding
      .newer_proposal_id,
  );
  assert.equal(fixtures[2].manifest.permitted_effects.review_decisions, 4);
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
