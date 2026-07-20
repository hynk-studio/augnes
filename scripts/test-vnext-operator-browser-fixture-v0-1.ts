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
  type VNextOperatorBrowserFixtureManifestV01,
  validateVNextOperatorBrowserFixtureV01,
} from "./vnext-operator-browser-fixture-builder-v0-1";
import { createVNextOperatorSharedInspectorReadHandlerV01 } from "../app/api/vnext/operator/inspector/route";
import {
  issueVNextLocalOperatorBootstrapV01,
  consumeVNextLocalOperatorBootstrapV01,
  serializeVNextLocalOperatorSessionCookieV01,
  type VNextLocalOperatorPilotConfigV01,
} from "../lib/vnext/runtime/local-operator-session";
import { readSharedProjectInspectorV01 } from "../lib/vnext/runtime/shared-project-inspector";
import {
  SharedProjectInspectorTargetErrorV01,
  createSharedInspectorHrefV01,
  parseSharedInspectorTargetV01,
} from "../lib/vnext/shared-project-inspector-href";
import { readProjectVerifyReconciliationV01 } from "../lib/vnext/runtime/project-verify-reconciliation";

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
    "strategic_analysis_route",
    "project_identity_registry",
    "project_verify_material_admission",
    "project_verify_reconciliation_read",
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

  const typedManifest = JSON.parse(
    manifestSource,
  ) as VNextOperatorBrowserFixtureManifestV01;
  const databasePath = path.join(fixtureDirectory, typedManifest.database_file);
  const inspectorObservedAt = "2026-07-17T13:00:00.000Z";
  const inspectorConfig: VNextLocalOperatorPilotConfigV01 = {
    enabled: true,
    workspace_id: typedManifest.workspace_id,
    project_id: typedManifest.project_id,
    operator_id: typedManifest.operator_id,
    database_path: databasePath,
  };
  const inspectorEnvironment: NodeJS.ProcessEnv = {
    NODE_ENV: "test",
    AUGNES_VNEXT_OPERATOR_PILOT_ENABLED: "1",
    AUGNES_VNEXT_OPERATOR_WORKSPACE_ID: typedManifest.workspace_id,
    AUGNES_VNEXT_OPERATOR_PROJECT_ID: typedManifest.project_id,
    AUGNES_VNEXT_OPERATOR_ID: typedManifest.operator_id,
    AUGNES_DB_PATH: databasePath,
  };
  const sessionDb = new Database(databasePath, { fileMustExist: true });
  const bootstrap = issueVNextLocalOperatorBootstrapV01(sessionDb, {
    config: inspectorConfig,
    clock: { now: () => inspectorObservedAt },
  });
  const admission = consumeVNextLocalOperatorBootstrapV01(sessionDb, {
    config: inspectorConfig,
    bootstrap_token: bootstrap.bootstrap_token,
    clock: { now: () => inspectorObservedAt },
  });
  sessionDb.close();
  const cookie = serializeVNextLocalOperatorSessionCookieV01({
    value: admission.cookie_value,
    expires_at: admission.cookie_expires_at,
    max_age_seconds: admission.cookie_max_age_seconds,
    secure: false,
  }).split(";", 1)[0]!;

  const receiptTarget = {
    target_kind: "run_receipt" as const,
    record_id: typedManifest.transition_receipt_id.replace(
      "state-transition-receipt:",
      "run-receipt:",
    ),
    expected_fingerprint: "",
  };
  const inspectorDb = new Database(databasePath, { fileMustExist: true });
  const receiptRow = inspectorDb
    .prepare(
      `SELECT record_id, fingerprint
       FROM vnext_core_records
       WHERE workspace_id = ? AND project_id = ? AND record_kind = 'run_receipt'
       ORDER BY created_at DESC, record_id LIMIT 1`,
    )
    .get(typedManifest.workspace_id, typedManifest.project_id) as {
      record_id: string;
      fingerprint: string;
    };
  receiptTarget.record_id = receiptRow.record_id;
  receiptTarget.expected_fingerprint = receiptRow.fingerprint;
  const reconciliation = readProjectVerifyReconciliationV01(inspectorDb, {
    workspace_id: typedManifest.workspace_id,
    project_id: typedManifest.project_id,
    observed_at: inspectorObservedAt,
  });
  const criterion = reconciliation.criteria[0];
  const claimFamily = reconciliation.claim_families[0];
  const relationFamily = reconciliation.relation_families[0];
  assert(criterion);
  assert(claimFamily);
  assert(relationFamily);
  const beforeInspectorRead = snapshotAllUserTables(inspectorDb);

  const href = createSharedInspectorHrefV01(receiptTarget);
  assert.equal(href.startsWith("/workbench/inspector?target=run_receipt"), true);
  assert.deepEqual(
    parseSharedInspectorTargetV01(new URL(href, "http://127.0.0.1:3000")),
    receiptTarget,
  );
  assert.throws(
    () => parseSharedInspectorTargetV01(new URLSearchParams("target=run_receipt&target=run_receipt&record_id=x&fingerprint=sha256:" + "a".repeat(64))),
    (error: unknown) =>
      error instanceof SharedProjectInspectorTargetErrorV01 &&
      error.code === "shared_inspector_query_keys_invalid",
  );
  assert.throws(
    () => parseSharedInspectorTargetV01(new URLSearchParams("target=arbitrary_database_record")),
    (error: unknown) =>
      error instanceof SharedProjectInspectorTargetErrorV01 &&
      error.code === "shared_inspector_target_kind_unknown",
  );
  assert.throws(
    () => parseSharedInspectorTargetV01(new URLSearchParams(`target=project_coordination&oversized=${"x".repeat(4_100)}`)),
    (error: unknown) =>
      error instanceof SharedProjectInspectorTargetErrorV01 &&
      error.code === "shared_inspector_query_size_invalid",
  );
  record("shared_inspector_href_and_strict_target_parser_fail_closed");

  const networkGuard = installZeroNetworkGuard({ allowLoopback: false });
  try {
    const receiptInspector = readSharedProjectInspectorV01(inspectorDb, {
      config: inspectorConfig,
      authenticated_session_id: admission.session.session_id,
      observed_at: inspectorObservedAt,
      target: receiptTarget,
    });
    assert.equal(receiptInspector.inspector_version, "shared_project_inspector.v0.1");
    assert.equal(receiptInspector.project_id, typedManifest.project_id);
    assert.equal(receiptInspector.authority.read_only, true);
    assert.equal(receiptInspector.authority.writes_database, false);
    assert.equal(receiptInspector.authority.creates_review_decision, false);
    assert.equal(receiptInspector.authority.authorizes_semantic_commit_gate, false);
    assert.equal(receiptInspector.authority.applies_transition, false);
    assert.equal(receiptInspector.authority.calls_model_or_provider, false);
    assert.equal(receiptInspector.authority.performs_network_or_external_action, false);
    assert.equal(
      receiptInspector.sections.some(
        (section) => section.section_kind === "run_receipt" && section.status === "available",
      ),
      true,
    );
    assert.equal(
      receiptInspector.sections.find(
        (section) => section.section_kind === "evidence_claims_relations",
      )?.facts.some(
        (fact) => fact.label === "Claim truth" && fact.value === "not_established",
      ),
      true,
    );

    const criterionInspector = readSharedProjectInspectorV01(inspectorDb, {
      config: inspectorConfig,
      authenticated_session_id: admission.session.session_id,
      observed_at: inspectorObservedAt,
      target: {
        target_kind: "criterion",
        criterion_id: criterion.criterion.criterion_id,
        packet_id: criterion.packet_ref.record_id,
        packet_fingerprint: criterion.packet_ref.record_fingerprint,
        receipt_id: criterion.receipt_ref.record_id,
        receipt_fingerprint: criterion.receipt_ref.record_fingerprint,
        assessment_id: criterion.assessment_ref.record_id,
        assessment_fingerprint: criterion.assessment_ref.record_fingerprint,
      },
    });
    assert.equal(criterionInspector.lineage?.lookup.lookup_kind, "criterion");
    assert.equal(criterionInspector.lineage?.stop.reason.length! > 0, true);

    const claimInspector = readSharedProjectInspectorV01(inspectorDb, {
      config: inspectorConfig,
      authenticated_session_id: admission.session.session_id,
      observed_at: inspectorObservedAt,
      target: {
        target_kind: "claim_family",
        family_id: claimFamily.claim_family_id,
        family_origin_fingerprint: claimFamily.family_origin_fingerprint,
        applicability_scope_fingerprint:
          claimFamily.applicability_scope_fingerprint,
      },
    });
    assert.equal(claimInspector.lineage?.lookup.lookup_kind, "claim_family");
    assert.equal(
      claimInspector.sections
        .find((section) => section.section_kind === "evidence_claims_relations")
        ?.items.some((item) => item.summary.includes("truth not established")),
      true,
    );

    const relationInspector = readSharedProjectInspectorV01(inspectorDb, {
      config: inspectorConfig,
      authenticated_session_id: admission.session.session_id,
      observed_at: inspectorObservedAt,
      target: {
        target_kind: "relation_family",
        family_id: relationFamily.relation_family_id,
        family_origin_fingerprint: relationFamily.family_origin_fingerprint,
        applicability_scope_fingerprint:
          relationFamily.applicability_scope_fingerprint,
      },
    });
    assert.equal(
      relationInspector.sections
        .find((section) => section.section_kind === "evidence_claims_relations")
        ?.items.some((item) => item.summary.includes("proof false")),
      true,
    );

    const proposalInspector = readSharedProjectInspectorV01(inspectorDb, {
      config: inspectorConfig,
      authenticated_session_id: admission.session.session_id,
      observed_at: inspectorObservedAt,
      target: {
        target_kind: "episode_delta_proposal",
        record_id: typedManifest.proposal_id,
        expected_fingerprint: typedManifest.proposal_fingerprint,
      },
    });
    assert.equal(proposalInspector.lineage?.lookup.lookup_kind, "proposal");
    assert.equal(
      proposalInspector.sections.find(
        (section) => section.section_kind === "transition_current_head",
      )?.items.some((item) => item.status === "applied"),
      true,
    );
    assert.equal(
      proposalInspector.sections.find(
        (section) => section.section_kind === "later_context_feedback",
      )?.items.some((item) => item.title === "Compiler-produced TaskContextPacket"),
      true,
    );

    const transitionInspector = readSharedProjectInspectorV01(inspectorDb, {
      config: inspectorConfig,
      authenticated_session_id: admission.session.session_id,
      observed_at: inspectorObservedAt,
      target: {
        target_kind: "state_transition_receipt",
        record_id: typedManifest.transition_receipt_id,
        expected_fingerprint: typedManifest.transition_receipt_fingerprint,
      },
    });
    assert.equal(
      transitionInspector.lineage?.lookup.lookup_kind,
      "transition_receipt",
    );
    assert.equal(
      transitionInspector.sections.find(
        (section) => section.section_kind === "decision_gate",
      )?.items.some((item) => item.title.startsWith("ReviewDecision:")),
      true,
    );

    const packetInspector = readSharedProjectInspectorV01(inspectorDb, {
      config: inspectorConfig,
      authenticated_session_id: admission.session.session_id,
      observed_at: inspectorObservedAt,
      target: {
        target_kind: "later_task_context_packet",
        record_id: typedManifest.packet_id,
        expected_fingerprint: typedManifest.packet_fingerprint,
      },
    });
    assert.equal(packetInspector.target_trust, "selected working context, not truth");
    assert.equal(
      packetInspector.sections.find(
        (section) => section.section_kind === "selected_context_work",
      )?.status,
      "available",
    );

    assert.throws(
      () =>
        readSharedProjectInspectorV01(inspectorDb, {
          config: inspectorConfig,
          authenticated_session_id: admission.session.session_id,
          observed_at: inspectorObservedAt,
          target: {
            ...receiptTarget,
            expected_fingerprint: `sha256:${"f".repeat(64)}`,
          },
        }),
      /shared_inspector_target_fingerprint_conflict/u,
    );
    assert.throws(
      () =>
        readSharedProjectInspectorV01(inspectorDb, {
          config: {
            ...inspectorConfig,
            project_id: "project:33333333-3333-4333-8333-333333333333",
          },
          authenticated_session_id: admission.session.session_id,
          observed_at: inspectorObservedAt,
          target: receiptTarget,
        }),
      /shared_inspector_target_missing/u,
    );

    const handler = createVNextOperatorSharedInspectorReadHandlerV01({
      environment: inspectorEnvironment,
      clock: { now: () => inspectorObservedAt },
    });
    const query = href.slice(href.indexOf("?"));
    const response = await handler(
      new Request(`http://127.0.0.1:3000/api/vnext/operator/inspector${query}`, {
        method: "GET",
        headers: { host: "127.0.0.1:3000", cookie },
      }),
    );
    const responseBody = (await response.json()) as {
      status?: string;
      project_scope_source?: string;
      semantic_mutation_available?: boolean;
      model_or_provider_call_performed?: boolean;
    };
    assert.equal(response.status, 200, JSON.stringify(responseBody));
    assert.equal(responseBody.status, "inspector_read");
    assert.equal(
      responseBody.project_scope_source,
      "authenticated_server_configuration",
    );
    assert.equal(responseBody.semantic_mutation_available, false);
    assert.equal(responseBody.model_or_provider_call_performed, false);
    assert.deepEqual(networkGuard.attempts, []);
  } finally {
    networkGuard.restore();
  }
  const afterInspectorRead = snapshotAllUserTables(inspectorDb);
  assert.equal(afterInspectorRead, beforeInspectorRead);
  inspectorDb.close();
  record("shared_inspector_reads_exact_fixture_material_without_writes_or_egress");

  const inspectorRouteSource = readFileSync(
    path.join(process.cwd(), "app/api/vnext/operator/inspector/route.ts"),
    "utf8",
  );
  const inspectorSurfaceSource = readFileSync(
    path.join(
      process.cwd(),
      "components/workbench/inspector/shared-project-inspector-surface.tsx",
    ),
    "utf8",
  );
  const activeInspectorLinkSources = [
    "lib/vnext/runtime/project-run-result-read-model.ts",
    "lib/vnext/project-home/project-home-projection.ts",
    "app/api/vnext/operator/semantic-review/route.ts",
    "components/workbench/semantic-review/project-verification-workbench.tsx",
    "components/workplane/agent-workplane.tsx",
  ].map((relative) => readFileSync(path.join(process.cwd(), relative), "utf8"));
  assert.equal(activeInspectorLinkSources.every((source) => source.includes("createSharedInspectorHrefV01")), true);
  assert.equal(inspectorRouteSource.includes("export const POST"), false);
  assert.equal(inspectorRouteSource.includes("export const PUT"), false);
  assert.equal(inspectorRouteSource.includes("export const PATCH"), false);
  assert.equal(inspectorRouteSource.includes("export const DELETE"), false);
  assert.equal(inspectorSurfaceSource.includes("data-shared-project-inspector"), true);
  assert.equal(inspectorSurfaceSource.includes("<form"), false);
  assert.equal(inspectorSurfaceSource.includes('type="submit"'), false);
  assert.equal(inspectorSurfaceSource.includes("Create ReviewDecision"), false);
  assert.equal(inspectorSurfaceSource.includes("Apply Transition"), false);
  assert.equal(inspectorSurfaceSource.includes(process.env.HOME ?? "\0"), false);
  assert.equal(
    existsSync(path.join(process.cwd(), "components/workbench/semantic-review/proposal-detail.tsx")),
    false,
  );
  assert.equal(
    existsSync(path.join(process.cwd(), "components/workbench/semantic-review/durable-lineage-panel.tsx")),
    false,
  );
  record("active_surfaces_share_one_href_builder_and_deleted_panels_have_no_runtime_path");
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

function snapshotAllUserTables(db: Database.Database): string {
  const tableNames = (
    db
      .prepare(
        `SELECT name FROM sqlite_master
         WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
         ORDER BY name`,
      )
      .all() as Array<{ name: string }>
  ).map((row) => row.name);
  return JSON.stringify(
    tableNames.map((name) => ({
      name,
      rows: db
        .prepare(`SELECT * FROM "${name.replaceAll('"', '""')}" ORDER BY rowid`)
        .all(),
    })),
  );
}
