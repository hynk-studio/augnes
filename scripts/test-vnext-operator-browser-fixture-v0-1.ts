#!/usr/bin/env node

import assert from "node:assert/strict";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  buildVNextOperatorBrowserFixtureV01,
  validateVNextOperatorBrowserFixtureV01,
} from "./vnext-operator-browser-fixture-builder-v0-1";

const tempRoot = mkdtempSync(
  path.join(tmpdir(), "augnes-operator-browser-fixture-contract-v0-1-"),
);
const fixtureDirectory = path.join(tempRoot, "fixture");
const manifestPath = path.join(
  fixtureDirectory,
  "operator-pilot-browser-fixture.json",
);
const assertions: string[] = [];
const referenceTime = "2026-07-17T12:00:00.000Z";

async function main(): Promise<void> {
try {
  await assert.rejects(
    () =>
      buildVNextOperatorBrowserFixtureV01({
        output_directory: path.join(process.cwd(), ".fixture-must-not-write"),
        reference_time: referenceTime,
      }),
    /browser fixture must stay inside the OS temporary directory/u,
  );
  assert.equal(existsSync(path.join(process.cwd(), ".fixture-must-not-write")), false);
  record("fixture_builder_rejects_non_disposable_output_root");

  const summary = await buildVNextOperatorBrowserFixtureV01({
    output_directory: fixtureDirectory,
    reference_time: referenceTime,
  });
  assert.equal(summary.status, "pass");
  assert.equal(summary.persisted_lineage_status, "reviewed");
  assert.equal(summary.external_network_calls, 0);
  assert.equal(summary.provider_calls, 0);
  assert.equal(summary.credential_material_included, false);
  assert.equal(summary.private_absolute_path_in_manifest, false);
  assert.equal(summary.default_database_accessed, false);
  assert.deepEqual(summary.production_seams, [
    "review_material",
    "review_decision_route",
    "semantic_transition_route",
    "later_result_route",
    "context_use_review_route",
    "project_identity_registry",
  ]);
  assert.equal(JSON.stringify(summary).length < 2_048, true);
  record("fixture_builder_uses_bounded_production_seams_without_provider_egress");

  const manifestSource = readFileSync(manifestPath, "utf8");
  const manifest = JSON.parse(manifestSource) as Record<string, unknown>;
  assert.equal(JSON.stringify(manifest).includes(process.env.HOME ?? "\0"), false);
  delete manifest.context_use_review_fingerprint;
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, {
    mode: 0o600,
  });
  assert.throws(
    () =>
      validateVNextOperatorBrowserFixtureV01({
        fixture_directory: fixtureDirectory,
      }),
    /fixture manifest context_use_review_fingerprint missing/u,
  );
  writeFileSync(manifestPath, manifestSource, { mode: 0o600 });
  record("fixture_validation_fails_closed_on_incomplete_manifest");

  const conflicting = JSON.parse(manifestSource) as Record<string, unknown>;
  conflicting.packet_fingerprint = `sha256:${"f".repeat(64)}`;
  writeFileSync(manifestPath, `${JSON.stringify(conflicting, null, 2)}\n`, {
    mode: 0o600,
  });
  assert.throws(
    () =>
      validateVNextOperatorBrowserFixtureV01({
        fixture_directory: fixtureDirectory,
      }),
    /task_context_packet fingerprint mismatch/u,
  );
  writeFileSync(manifestPath, manifestSource, { mode: 0o600 });
  record("fixture_validation_fails_closed_on_conflicting_database_binding");

  const validated = validateVNextOperatorBrowserFixtureV01({
    fixture_directory: fixtureDirectory,
  });
  assert.equal(validated.status, "pass");
  record("fixture_contract_accepts_complete_owned_state");

  await assert.rejects(
    () =>
      buildVNextOperatorBrowserFixtureV01({
        output_directory: fixtureDirectory,
        reference_time: referenceTime,
      }),
    /fixture output directory must be empty/u,
  );
  assert.equal(readFileSync(manifestPath, "utf8"), manifestSource);
  record("fixture_builder_refuses_overwrite_and_preserves_existing_artifacts");
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}

assert.equal(existsSync(tempRoot), false);
record("fixture_contract_removes_database_manifest_root_and_side_files");
process.stdout.write(
  `${JSON.stringify(
    {
      status: "pass",
      contract_version: "vnext_operator_browser_fixture_contract.v0.1",
      assertion_count: assertions.length,
      assertions,
      temporary_root_removed: true,
    },
    null,
    2,
  )}\n`,
);
}

void main();

function record(assertion: string): void {
  assert.equal(assertions.includes(assertion), false, `duplicate assertion: ${assertion}`);
  assertions.push(assertion);
}
