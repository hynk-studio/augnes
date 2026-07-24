#!/usr/bin/env node

import assert from "node:assert/strict";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { NextRequest } from "next/server";

import { GET, POST } from "../app/api/recovery/route";
import {
  RECOVERY_RESTORE_RECOMMENDATION_CODES_V01,
  RECOVERY_RETRY_RECOMMENDATION_CODES_V01,
  buildRecoverySafetyViewV01,
  buildUnavailableRecoverySafetyViewV01,
} from "../lib/vnext/recovery/recovery-safety-view";
import { proxy } from "../proxy";
import type { RecoveryStatusV01 } from "../types/vnext/recovery-safety";
import {
  recordPortableOperationResult,
  recordRunReconciliationResult,
} from "./continuity-operational-status.mjs";

const routeRoot = mkdtempSync(path.join(tmpdir(), "augnes-recovery-route-"));
const routeDatabasePath = path.join(routeRoot, "augnes.db");

const environment = {
  AUGNES_CANONICAL_TEST_MODE: "1",
  AUGNES_TEST_RECOVERY_ROUTE_TIMEOUT_MS: "20",
  AUGNES_RUNTIME_CONTROL_PORT: "43123",
  AUGNES_RUNTIME_INSTANCE_ID: "instance-recovery-route-timeout",
  AUGNES_RUNTIME_OWNERSHIP_TOKEN: "ownership-recovery-route-timeout",
  AUGNES_RECOVERY_MODE: "1",
  AUGNES_DB_PATH: routeDatabasePath,
};
const requestHeaders = {
  host: "127.0.0.1:3000",
  origin: "http://127.0.0.1:3000",
  "content-type": "application/json",
};

async function main() {
  testRecoverySafetyPresentationV01();
  const savedEnvironment = new Map<string, string | undefined>();
  for (const [key, value] of Object.entries(environment)) {
    savedEnvironment.set(key, process.env[key]);
    process.env[key] = value;
  }

  const originalFetch = globalThis.fetch;
  let simulatedSupervisorAccepted = false;
  let supervisorRequestCount = 0;

  try {
    globalThis.fetch = (
      _input: RequestInfo | URL,
      init?: RequestInit,
    ): Promise<Response> => {
      supervisorRequestCount += 1;
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          simulatedSupervisorAccepted = true;
          resolve(
            Response.json(
              {
                accepted: true,
                outcome: "retry_scheduled",
                next_action: "wait_for_augnes_to_restart",
              },
              { status: 202 },
            ),
          );
        }, 60);
        init?.signal?.addEventListener(
          "abort",
          () => reject(new DOMException("request aborted", "AbortError")),
          { once: true },
        );
      });
    };

    const response = await POST(recoveryRequest({ action: "retry_update" }));
    assert.equal(response.status, 504);
    const body = await response.json();
    assert.deepEqual(body, {
      outcome: "status_unknown",
      reason_code: "recovery_action_outcome_unknown",
      next_action: "refresh_recovery_status",
      message:
        "Augnes could not confirm whether the recovery action was accepted. Refresh recovery status before choosing another action.",
    });
    assert.doesNotMatch(JSON.stringify(body), /did not change|not changed/u);

    await new Promise((resolve) => setTimeout(resolve, 80));
    assert.equal(
      simulatedSupervisorAccepted,
      true,
      "the route must remain truthful when the supervisor accepts after the bounded client timeout",
    );

    const encoder = new TextEncoder();
    const oversizedStream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode("x".repeat(4_096)));
        controller.enqueue(encoder.encode("x"));
        controller.close();
      },
    });
    await assertRequestRefused(
      new Request("http://127.0.0.1:3000/api/recovery", {
        method: "POST",
        headers: requestHeaders,
        body: oversizedStream,
        duplex: "half",
      } as RequestInit & { duplex: "half" }),
    );
    await assertRequestRefused(
      recoveryRequest({ action: "retry_update" }, { "content-length": "x" }),
    );
    await assertRequestRefused(
      recoveryRequest({ action: "retry_update", unexpected: true }),
    );
    await assertRequestRefused(recoveryRequest("", {}, "text/plain"));
    await assertRequestRefused(recoveryRequest(""));
    assert.equal(
      supervisorRequestCount,
      1,
      "invalid or oversized product requests must be refused before supervisor contact",
    );

    recordPortableOperationResult({
      databasePath: routeDatabasePath,
      event: {
        contract: "augnes.portable-operation-result.v1",
        observed_at: "2026-07-21T05:10:00.000Z",
        operation: "import",
        outcome: "completed",
        reason_code: "portable_project_imported",
        record_count: 27,
        personal_perspective_included: false,
        reader_verification: "verified",
        data_preserved: true,
        next_safe_action: "open_imported_project_home",
      },
    });
    recordRunReconciliationResult({
      databasePath: routeDatabasePath,
      result: {
        contract: "augnes.run-reconciliation-result.v1",
        schema_version: 1,
        observed_at: "2026-07-21T05:11:00.000Z",
        outcome: "review_needed",
        total_runs_available: 3,
        total_runs_considered: 3,
        counts: {
          queued: 0,
          starting: 0,
          running: 0,
          waiting_for_approval: 1,
          cancelling: 0,
          completed: 1,
          failed: 0,
          timed_out: 0,
          cancelled: 0,
          orphaned_or_indeterminate: 1,
        },
        exact_replays_reused: 1,
        conflicts_refused: 0,
        waiting_for_approval_count: 1,
        orphaned_review_needed_count: 1,
        unsupported_host_coverage_count: 1,
        no_retry_count: 3,
        reconciliation_events_created: 1,
        reason_codes: ["approval_remains_pending", "host_observation_unsupported_after_restart"],
        next_safe_action: "review_orphaned_runs",
        automatic_retry_started: false,
        semantic_authority_created: false,
        external_action_created: false,
      },
    });
    globalThis.fetch = async () => Response.json(recoveryStatusFixture());
    const diagnosticResponse = await GET(new Request(
      "http://127.0.0.1:3000/api/recovery",
      { headers: { host: "127.0.0.1:3000" } },
    ));
    assert.equal(diagnosticResponse.status, 200);
    const diagnostics = await diagnosticResponse.json();
    assert.equal(diagnostics.continuity.portability.reason_code, "portable_project_imported");
    assert.equal(diagnostics.continuity.reconciliation.waiting_for_approval_count, 1);
    assert.equal(diagnostics.runtime.bridge_health, "ready");

    const reportResponse = await POST(recoveryRequest({
      action: "preview_support_report",
    }));
    assert.equal(reportResponse.status, 200);
    const preview = await reportResponse.json();
    assert.equal(preview.contract, "augnes.support-report-preview.v1");
    assert.equal(preview.previewed, true);
    assert.equal(preview.report.redacted, true);
    assert.equal(preview.report.read_only, true);
    assert.equal(preview.report.authoritative, false);
    assert.equal(preview.report.actions_created.recovery, false);
    assert.equal(preview.report.actions_created.semantic, false);
    assert.equal(preview.report.actions_created.host, false);
    assert.equal(preview.report.actions_created.external, false);
    const reportText = JSON.stringify(preview.report);
    for (const forbidden of [
      routeDatabasePath,
      "sk-proj-route-secret",
      "raw prompt route sentinel",
      "project:private-route-sentinel",
    ]) {
      assert.equal(reportText.includes(forbidden), false);
    }

    const writeRefusal = proxy(
      new NextRequest("http://127.0.0.1:3000/api/product-write", {
        method: "POST",
      }),
    );
    assert.equal(writeRefusal.status, 503);
    assert.equal(writeRefusal.headers.get("location"), null);
    assert.equal(writeRefusal.headers.get("cache-control"), "no-store, max-age=0");
    assert.deepEqual(await writeRefusal.json(), {
      error_code: "recovery_mode_write_refused",
      next_action: "use_the_recovery_page",
    });

    const recoveryWrite = proxy(
      new NextRequest("http://127.0.0.1:3000/api/recovery", {
        method: "POST",
      }),
    );
    assert.equal(recoveryWrite.headers.get("x-middleware-next"), "1");
    assert.equal(recoveryWrite.headers.get("location"), null);

    const navigation = proxy(
      new NextRequest("http://127.0.0.1:3000/projects?private=value"),
    );
    assert.equal(navigation.status, 307);
    const recoveryLocation = new URL(
      navigation.headers.get("location") ?? "invalid:",
    );
    assert.equal(recoveryLocation.pathname, "/recovery");
    assert.equal(recoveryLocation.search, "");
    assert.equal(navigation.headers.get("cache-control"), "no-store, max-age=0");

    console.log(
      JSON.stringify(
        {
          test: "recovery-product-route",
          status: "pass",
          bounded_timeout_verified: true,
          late_supervisor_acceptance_reported_as_unknown: true,
          streamed_oversize_and_malformed_requests_refused: true,
          recovery_mode_write_barrier_verified: true,
          recovery_product_action_allowed: true,
          recovery_navigation_no_store_verified: true,
          portability_and_reconciliation_diagnostics_verified: true,
          redacted_support_report_preview_verified: true,
          report_private_material_leaks: 0,
          false_no_mutation_claims: 0,
        },
        null,
        2,
      ),
    );
  } finally {
    globalThis.fetch = originalFetch;
    for (const [key, value] of savedEnvironment) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    rmSync(routeRoot, { recursive: true, force: true });
    assert.equal(existsSync(routeRoot), false);
  }
}

function testRecoverySafetyPresentationV01() {
  const healthyStatus = recoveryPresentationFixture();
  const healthy = buildRecoverySafetyViewV01({
    status: healthyStatus,
    selected_backup_id: null,
  });
  assert.equal(healthy.mode, "normal");
  assert.equal(healthy.safety_state, "ready");
  assert.equal(healthy.primary_action.kind, "create_backup");
  assert.equal(healthy.primary_action.label, "Create backup");
  assert.equal(healthy.secondary_actions.some((action) => action.kind === "check_again"), true);

  for (const recommendation of RECOVERY_RESTORE_RECOMMENDATION_CODES_V01) {
    const status = recoveryPresentationFixture({
      recovery_mode: true,
      latest_operation: latestOperation(recommendation),
      backups: [verifiedBackup()],
      backup_count: 1,
      actions: {
        create_backup: true,
        retry_update: true,
        restore_backup: true,
      },
    });
    const view = buildRecoverySafetyViewV01({
      status,
      selected_backup_id: "backup:verified",
    });
    assert.equal(view.primary_action.kind, "restore_backup", recommendation);
    assert.equal(view.mode, "recovery");
    assert.equal(view.safety_state, "attention");
  }

  for (const recommendation of RECOVERY_RETRY_RECOMMENDATION_CODES_V01) {
    const status = recoveryPresentationFixture({
      recovery_mode: true,
      latest_operation: latestOperation(recommendation),
      backups: [verifiedBackup()],
      backup_count: 1,
      actions: {
        create_backup: true,
        retry_update: true,
        restore_backup: true,
      },
    });
    const view = buildRecoverySafetyViewV01({
      status,
      selected_backup_id: "backup:verified",
    });
    assert.equal(view.primary_action.kind, "retry_update", recommendation);
  }

  for (const ambiguous of [
    "retry_update_or_restore_verified_backup",
    "retry_restore_or_choose_another_verified_backup",
    "choose_a_verified_recovery_backup",
    "review_recovery_backup_inventory",
    "retry_update_or_continue_current_data",
    "relaunch_a_compatible_verified_package",
    "preserve_current_data_and_relaunch_a_compatible_verified_package",
    "continue_with_current_data",
    "unknown_future_recovery_action",
  ]) {
    const view = buildRecoverySafetyViewV01({
      status: recoveryPresentationFixture({
        recovery_mode: true,
        latest_operation: latestOperation(ambiguous),
        backups: [verifiedBackup()],
        backup_count: 1,
        actions: {
          create_backup: true,
          retry_update: true,
          restore_backup: true,
        },
      }),
      selected_backup_id: "backup:verified",
    });
    assert.equal(view.primary_action.kind, "none", ambiguous);
    assert.equal(view.primary_action.mutates, false);
  }

  const noLatest = buildRecoverySafetyViewV01({
    status: recoveryPresentationFixture({
      recovery_mode: true,
      latest_operation: null,
      actions: {
        create_backup: true,
        retry_update: true,
        restore_backup: true,
      },
    }),
    selected_backup_id: null,
  });
  assert.equal(noLatest.primary_action.kind, "none");

  const unverifiedRestore = buildRecoverySafetyViewV01({
    status: recoveryPresentationFixture({
      recovery_mode: true,
      latest_operation: latestOperation("restore_latest_verified_backup"),
      backups: [{ ...verifiedBackup(), verified: false }],
      backup_count: 1,
      actions: {
        create_backup: false,
        retry_update: false,
        restore_backup: true,
      },
    }),
    selected_backup_id: "backup:verified",
  });
  assert.equal(unverifiedRestore.primary_action.kind, "none");
  assert.equal(unverifiedRestore.backup_summary.selected_verified, false);

  const inventoryUnavailable = buildRecoverySafetyViewV01({
    status: recoveryPresentationFixture({
      recovery_mode: true,
      latest_operation: latestOperation("restore_latest_verified_backup"),
      backup_inventory_state: "unavailable",
      backups: [],
      backup_count: 0,
      actions: {
        create_backup: false,
        retry_update: false,
        restore_backup: true,
      },
    }),
    selected_backup_id: null,
  });
  assert.equal(inventoryUnavailable.primary_action.kind, "none");
  assert.match(inventoryUnavailable.backup_summary.notice ?? "", /not treated as an empty inventory/u);

  const truncated = buildRecoverySafetyViewV01({
    status: recoveryPresentationFixture({
      backup_inventory_truncated: true,
      backup_page_count: 2,
      backups: [verifiedBackup()],
      backup_count: 2,
    }),
    selected_backup_id: "backup:verified",
  });
  assert.match(truncated.backup_summary.notice ?? "", /other pages/u);

  const legacy = buildRecoverySafetyViewV01({
    status: recoveryPresentationFixture({
      legacy_backup_count: 2,
      legacy_backup_unavailable_count: 1,
      backups: [verifiedBackup()],
      backup_count: 1,
    }),
    selected_backup_id: "backup:verified",
  });
  assert.match(legacy.backup_summary.notice ?? "", /compatible verified Augnes package/u);

  for (const classification of ["old", "incompatible", "unavailable"] as const) {
    const view = buildRecoverySafetyViewV01({
      status: recoveryPresentationFixture({
        database: {
          ...recoveryPresentationFixture().database,
          schema_classification: classification,
        },
      }),
      selected_backup_id: null,
    });
    assert.notEqual(view.primary_action.kind, "create_backup");
    assert.equal(
      view.safety_state,
      classification === "unavailable" ? "unavailable" : "incompatible",
    );
  }

  const refused = buildRecoverySafetyViewV01({
    status: recoveryPresentationFixture({
      latest_operation: latestOperation("review_the_current_recovery_status", {
        outcome: "refused",
        data_preserved: false,
      }),
    }),
    selected_backup_id: null,
  });
  assert.match(refused.latest_operation_summary ?? "", /not confirmed/u);

  const acceptedBackup = buildRecoverySafetyViewV01({
    status: recoveryPresentationFixture({
      latest_operation: latestOperation("continue_with_current_data", {
        outcome: "backup_created",
        backup_verified: true,
        safety_backup_created: true,
      }),
    }),
    selected_backup_id: null,
  });
  assert.match(acceptedBackup.latest_operation_summary ?? "", /verified recovery point/u);

  const unavailable = buildUnavailableRecoverySafetyViewV01();
  assert.equal(unavailable.mode, "unknown");
  assert.equal(unavailable.primary_action.kind, "check_again");
  assert.equal(unavailable.primary_action.mutates, false);
  assert.equal(Object.values(unavailable.authority).every((value) => value === false), true);
  assert.deepEqual(
    buildRecoverySafetyViewV01({
      status: healthyStatus,
      selected_backup_id: null,
    }),
    healthy,
  );
  assert.equal(Object.values(healthy.authority).every((value) => value === false), true);
}

function recoveryPresentationFixture(
  overrides: Partial<RecoveryStatusV01> = {},
): RecoveryStatusV01 {
  const base = recoveryStatusFixture();
  return {
    ...base,
    continuity: {
      contract: "augnes.continuity-operations.v1",
      status_available: true,
      public_reason_code: "continuity_status_available",
      portability: null,
      reconciliation: null,
    },
    ...overrides,
  };
}

function latestOperation(
  nextAction: string,
  overrides: Partial<
    NonNullable<RecoveryStatusV01["latest_operation"]>
  > = {},
): NonNullable<RecoveryStatusV01["latest_operation"]> {
  return {
    outcome: "recovery_available",
    reason_code: "recovery_required",
    application_version: "0.1.0",
    target_application_version: "0.2.0",
    target_build_identity: `sha256:${"b".repeat(64)}`,
    database_state: "recovery_required",
    data_preserved: true,
    backup_verified: false,
    safety_backup_created: false,
    next_action: nextAction,
    ...overrides,
  };
}

function verifiedBackup(): RecoveryStatusV01["backups"][number] {
  return {
    backup_id: "backup:verified",
    label: "Verified recovery point",
    created_at: "2026-07-21T04:00:00.000Z",
    reason: "pre_update",
    source_application_version: "0.1.0",
    verified: true,
  };
}

function recoveryStatusFixture(): Omit<RecoveryStatusV01, "continuity"> {
  return {
    contract: "augnes.recovery-product.v1",
    schema_version: 1,
    recovery_mode: false,
    application: {
      version: "0.1.0",
      build_identity: `sha256:${"a".repeat(64)}`,
      package_contract: "augnes.distributable.v1",
      package_contract_version: 2,
      compatibility: "verified_package",
    },
    database: {
      state: "current",
      schema_contract: "augnes.sqlite.structural-schema.v1",
      schema_classification: "current",
      migration_state: "current",
    },
    runtime: {
      runtime_contract: "augnes-local-runtime-supervisor-v1",
      runtime_schema_version: 2,
      lifecycle_state: "ready",
      bridge_health: "ready",
      capability_availability: "runtime_and_bridge",
    },
    latest_operation: null,
    backup_inventory_state: "available",
    backup_count: 0,
    legacy_backup_count: 0,
    legacy_backup_unavailable_count: 0,
    backup_inventory_truncated: false,
    backup_page: 1,
    backup_page_count: 1,
    backups: [],
    actions: {
      create_backup: true,
      retry_update: false,
      restore_backup: false,
    },
  };
}

function recoveryRequest(
  body: unknown,
  additionalHeaders: Record<string, string> = {},
  contentType = "application/json",
): Request {
  return new Request("http://127.0.0.1:3000/api/recovery", {
    method: "POST",
    headers: {
      ...requestHeaders,
      "content-type": contentType,
      ...additionalHeaders,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

async function assertRequestRefused(request: Request): Promise<void> {
  const response = await POST(request);
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    accepted: false,
    outcome: "refused",
    reason_code: "recovery_request_invalid",
    next_action: "choose_an_available_recovery_action",
  });
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
