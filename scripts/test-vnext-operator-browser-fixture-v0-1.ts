#!/usr/bin/env node

import assert from "node:assert/strict";
import { createRequire } from "node:module";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import Database from "better-sqlite3";

import {
  installZeroNetworkGuard,
  ZERO_NETWORK_GUARD_METHODS,
} from "./test-harness-zero-network-guard.mjs";

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
const require = createRequire(import.meta.url);

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

  const guard = installZeroNetworkGuard({ allowLoopback: false });
  try {
    const http = require("node:http") as typeof import("node:http");
    const net = require("node:net") as typeof import("node:net");
    const dns = require("node:dns") as typeof import("node:dns");
    assert.throws(
      () => globalThis.fetch("https://example.invalid/fixture-guard"),
      /test_external_network_forbidden:fetch/u,
    );
    assert.throws(
      () => http.request("http://example.invalid/fixture-guard"),
      /test_external_network_forbidden:http.request/u,
    );
    assert.throws(
      () => net.connect({ host: "example.invalid", port: 443 }),
      /test_external_network_forbidden:net.connect/u,
    );
    assert.throws(
      () => dns.lookup("example.invalid", () => {}),
      /test_external_network_forbidden:dns.lookup/u,
    );
    assert.deepEqual(
      guard.attempts.map((attempt) => attempt.method),
      ["fetch", "http.request", "net.connect", "dns.lookup"],
    );
  } finally {
    guard.restore();
  }
  record("zero_network_guard_blocks_and_records_fetch_http_net_and_dns");

  const guardedFixtureDirectory = path.join(tempRoot, "guarded-fixture");
  await assert.rejects(
    () =>
      buildVNextOperatorBrowserFixtureV01({
        output_directory: guardedFixtureDirectory,
        reference_time: referenceTime,
        test_only_guard_probe: async () => {
          await globalThis.fetch("https://example.invalid/fixture-builder");
        },
      }),
    (error: unknown) =>
      error instanceof Error &&
      (error as Error & { code?: string }).code ===
        "test_external_network_forbidden",
  );
  assert.deepEqual(readdirSync(guardedFixtureDirectory), []);
  record("fixture_builder_installs_guard_before_production_seams_and_cleans");

  const originalAmbientDatabasePath = process.env.AUGNES_DB_PATH;
  const ambientFixtureDirectory = path.join(tempRoot, "ambient-db-fixture");
  await assert.rejects(
    () =>
      buildVNextOperatorBrowserFixtureV01({
        output_directory: ambientFixtureDirectory,
        reference_time: referenceTime,
        test_only_guard_probe: ({ ambient_database_path }) => {
          const ambient = new Database(ambient_database_path);
          ambient.close();
        },
      }),
    /fixture ambient\/default database sentinel changed/u,
  );
  assert.deepEqual(readdirSync(ambientFixtureDirectory), []);
  assert.equal(process.env.AUGNES_DB_PATH, originalAmbientDatabasePath);
  record("fixture_builder_fails_closed_on_ambient_database_access_and_cleans");

  const summary = await buildVNextOperatorBrowserFixtureV01({
    output_directory: fixtureDirectory,
    reference_time: referenceTime,
  });
  assert.equal(summary.status, "pass");
  assert.equal(summary.persisted_lineage_status, "packet_compiled");
  assert.equal(summary.external_network_calls, 0);
  assert.equal(summary.provider_calls, 0);
  assert.deepEqual(summary.network_guard_methods, ZERO_NETWORK_GUARD_METHODS);
  assert.equal(
    summary.provider_boundary,
    "no_live_provider_imports_and_zero_guarded_network_attempts",
  );
  assert.equal(summary.credential_material_included, false);
  assert.equal(summary.private_absolute_path_in_manifest, false);
  assert.equal(summary.default_database_accessed, false);
  assert.equal(summary.ambient_database_observation, "absent_before_and_after");
  assert.deepEqual(summary.production_seams, [
    "review_material",
    "review_decision_route",
    "semantic_transition_route",
    "project_identity_registry",
  ]);
  assert.equal(JSON.stringify(summary).length < 2_048, true);
  record("fixture_builder_uses_bounded_production_seams_without_provider_egress");

  const manifestSource = readFileSync(manifestPath, "utf8");
  const manifest = JSON.parse(manifestSource) as Record<string, unknown>;
  assert.equal(JSON.stringify(manifest).includes(process.env.HOME ?? "\0"), false);
  delete manifest.transition_receipt_fingerprint;
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, {
    mode: 0o600,
  });
  assert.throws(
    () =>
      validateVNextOperatorBrowserFixtureV01({
        fixture_directory: fixtureDirectory,
      }),
    /fixture manifest transition_receipt_fingerprint missing/u,
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
  for (const unobservedClaim of [
    "external_network_calls",
    "provider_calls",
    "default_database_accessed",
  ]) {
    assert.equal(Object.hasOwn(validated, unobservedClaim), false);
  }
  record("fixture_validation_does_not_claim_unobserved_egress_or_database_state");

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
