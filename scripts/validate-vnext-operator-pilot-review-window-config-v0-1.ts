#!/usr/bin/env node

import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import Database from "better-sqlite3";

import { createVNextOperatorSemanticTransitionHandlersV01 } from "@/app/api/vnext/operator/semantic-transition/route";
import {
  buildSemanticTransitionLoopFixtureV01,
  semanticTransitionLoopProjectAFixture,
} from "@/fixtures/vnext/protocol/semantic-transition-loop-v0-1";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import {
  commitVNextSemanticTransitionV01,
  createVNextSemanticCommitConfirmationContextRefV01,
  persistVNextSemanticReviewMaterialV01,
  prepareVNextSemanticCommitPreviewV01,
  recordVNextSemanticCommitAuthorizationV01,
  type VNextSemanticCommitGateRecordV01,
  type VNextSemanticCommitPreviewV01,
} from "@/lib/vnext/runtime/durable-semantic-transition";
import {
  VNEXT_OPERATOR_PILOT_GATE_TTL_ENV_V01,
  VNEXT_OPERATOR_PILOT_PREVIEW_MAX_AGE_ENV_V01,
  createVNextOperatorPilotReviewWindowConfigFingerprintV01,
  isExplicitVNextOperatorPilotReviewWindowConfigV01,
  readVNextOperatorPilotReviewWindowConfigV01,
  type VNextOperatorPilotReviewWindowConfigV01,
} from "@/lib/vnext/runtime/operator-pilot-review-window-config-v0-1";
import {
  assertVNextOperatorPilotGateReviewWindowConfigV01,
  serializeVNextOperatorPilotPreviewBindingCookieV01,
} from "@/lib/vnext/runtime/operator-pilot-semantic-transition";
import type { VNextLocalRuntimeClockV01 } from "@/lib/vnext/runtime/local-runtime-clock";

const VALIDATION_VERSION =
  "vnext_operator_pilot_review_window_config_validation.v0.1" as const;
const SCHEMA_SQL = readFileSync(
  path.join(process.cwd(), "lib", "db", "schema.sql"),
  "utf8",
);
const positiveCases: string[] = [];
const negativeCases: string[] = [];
let databaseReads = 0;
let databaseWrites = 0;
let fetchCalls = 0;

async function main(): Promise<void> {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => {
    fetchCalls += 1;
    throw new Error("review_window_validation_external_network_forbidden");
  }) as typeof fetch;

  try {
    validatePureConfiguration();
    await validateRouteFailClosedBeforeDatabaseOpen();
    validateDurableTimingIntegration();
    validateCommittedCallerBoundaryCoverage();
    assert.equal(fetchCalls, 0);

    const deterministicMaterial = {
    validation_version: VALIDATION_VERSION,
    status: "passed",
    positive_case_count: positiveCases.length,
    negative_adversarial_case_count: negativeCases.length,
    positive_cases: positiveCases,
    negative_adversarial_cases: negativeCases,
    default_preview_max_age_ms: 900_000,
    default_gate_ttl_ms: 600_000,
    recommended_preview_max_age_ms: 7_200_000,
    recommended_gate_ttl_ms: 3_600_000,
    isolated_temp_database_reads: databaseReads,
    isolated_temp_database_writes: databaseWrites,
    real_pilot_database_access: 0,
    default_database_accessed: false,
    provider_model_calls: 0,
    external_network_calls: fetchCalls,
    external_actuation: 0,
  };
    const outputSha256 = createProtocolSha256V01(
      canonicalizeProtocolValueV01(deterministicMaterial),
    );
    process.stdout.write(
      `${JSON.stringify(
        { ...deterministicMaterial, deterministic_output_sha256: outputSha256 },
        null,
        2,
      )}\n`,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
}

void main().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : "review_window_validation_failed";
  process.stderr.write(`review_window_validation_failed:${message}\n`);
  process.exitCode = 1;
});

function validatePureConfiguration(): void {
  const defaults = readVNextOperatorPilotReviewWindowConfigV01({});
  assert.deepEqual(defaults, {
    config_version: "vnext_operator_pilot_review_window_config.v0.1",
    preview_max_age_ms: 900_000,
    gate_ttl_ms: 600_000,
    preview_source: "default",
    gate_source: "default",
  });
  assert(Object.isFrozen(defaults));
  pass("omitted_values_preserve_exact_legacy_defaults");

  const recommended = explicitConfig("7200000", "3600000");
  assert.equal(recommended.preview_max_age_ms, 7_200_000);
  assert.equal(recommended.gate_ttl_ms, 3_600_000);
  assert.equal(recommended.preview_source, "explicit_environment");
  assert.equal(recommended.gate_source, "explicit_environment");
  pass("owner_recommended_two_hour_preview_one_hour_gate");

  assert.deepEqual(explicitConfig("900000", "600000"), {
    config_version: "vnext_operator_pilot_review_window_config.v0.1",
    preview_max_age_ms: 900_000,
    gate_ttl_ms: 600_000,
    preview_source: "explicit_environment",
    gate_source: "explicit_environment",
  });
  pass("exact_minimum_values_accepted");

  const maximums = explicitConfig("28800000", "7200000");
  assert.equal(maximums.preview_max_age_ms, 28_800_000);
  assert.equal(maximums.gate_ttl_ms, 7_200_000);
  pass("exact_maximum_values_accepted");

  const equal = explicitConfig("900000", "900000");
  assert.equal(equal.preview_max_age_ms, equal.gate_ttl_ms);
  pass("gate_equal_to_preview_age_within_bounds_accepted");

  const cookie = serializeVNextOperatorPilotPreviewBindingCookieV01({
    value: "bounded-preview-binding",
    expires_at: "2026-07-13T10:00:00.000Z",
    max_age_ms: recommended.preview_max_age_ms,
    secure: false,
  });
  assert.match(cookie, /Max-Age=7200/);
  assert.match(cookie, /Expires=Mon, 13 Jul 2026 10:00:00 GMT/);
  pass("preview_cookie_uses_effective_preview_age");

  for (const [caseId, field, value] of [
    ["empty_value_rejected", "preview", ""],
    ["leading_whitespace_rejected", "preview", " 900000"],
    ["trailing_whitespace_rejected", "preview", "900000 "],
    ["plus_sign_rejected", "preview", "+900000"],
    ["minus_sign_rejected", "preview", "-900000"],
    ["decimal_rejected", "preview", "900000.0"],
    ["exponent_notation_rejected", "preview", "9e5"],
    ["alphabetic_suffix_rejected", "preview", "900000ms"],
    ["zero_rejected", "preview", "0"],
    ["leading_zero_noncanonical_rejected", "preview", "0900000"],
    ["preview_below_minimum_rejected", "preview", "899999"],
    ["preview_above_maximum_rejected", "preview", "28800001"],
    ["gate_below_minimum_rejected", "gate", "599999"],
    ["gate_above_maximum_rejected", "gate", "7200001"],
    ["unsafe_integer_rejected", "preview", "9007199254740993"],
  ] as const) {
    expectConfigError(caseId, {
      [field === "preview"
        ? VNEXT_OPERATOR_PILOT_PREVIEW_MAX_AGE_ENV_V01
        : VNEXT_OPERATOR_PILOT_GATE_TTL_ENV_V01]: value,
    });
  }
  expectConfigError("gate_greater_than_preview_rejected", {
    [VNEXT_OPERATOR_PILOT_PREVIEW_MAX_AGE_ENV_V01]: "900000",
    [VNEXT_OPERATOR_PILOT_GATE_TTL_ENV_V01]: "900001",
  });
  expectConfigError("valid_preview_invalid_gate_rejected", {
    [VNEXT_OPERATOR_PILOT_PREVIEW_MAX_AGE_ENV_V01]: "7200000",
    [VNEXT_OPERATOR_PILOT_GATE_TTL_ENV_V01]: "badvalue",
  });
  expectConfigError("invalid_preview_valid_gate_rejected", {
    [VNEXT_OPERATOR_PILOT_PREVIEW_MAX_AGE_ENV_V01]: "badvalue",
    [VNEXT_OPERATOR_PILOT_GATE_TTL_ENV_V01]: "600000",
  });
  expectConfigError("explicit_undefined_ambiguous_source_rejected", {
    [VNEXT_OPERATOR_PILOT_PREVIEW_MAX_AGE_ENV_V01]: undefined,
  });
}

async function validateRouteFailClosedBeforeDatabaseOpen(): Promise<void> {
  let openCount = 0;
  const environment = {
    NODE_ENV: "test" as const,
    AUGNES_VNEXT_OPERATOR_PILOT_ENABLED: "1",
    AUGNES_VNEXT_OPERATOR_WORKSPACE_ID: "workspace:review-window-validation",
    AUGNES_VNEXT_OPERATOR_PROJECT_ID: "project:review-window-validation",
    AUGNES_VNEXT_OPERATOR_ID: "operator:review-window-validation",
    AUGNES_DB_PATH: path.join(tmpdir(), "must-not-open-review-window.db"),
    [VNEXT_OPERATOR_PILOT_PREVIEW_MAX_AGE_ENV_V01]: "invalid",
  };
  const handlers = createVNextOperatorSemanticTransitionHandlersV01({
    environment,
    open_database: () => {
      openCount += 1;
      throw new Error("database_must_not_open");
    },
  });
  const response = await handlers.GET(
    new Request(
      "http://127.0.0.1:3000/api/vnext/operator/semantic-transition?proposal_id=p&proposal_fingerprint=sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa&decision_id=d&decision_fingerprint=sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      { headers: { host: "127.0.0.1:3000" } },
    ),
  );
  assert.equal(response.status, 503);
  const body = (await response.json()) as { error_code?: string };
  assert.equal(
    body.error_code,
    "operator_pilot_preview_max_age_config_invalid",
  );
  assert.equal(openCount, 0);
  reject("invalid_configuration_disables_route_before_database_open");
}

function validateDurableTimingIntegration(): void {
  const defaults = readVNextOperatorPilotReviewWindowConfigV01({});
  const extended = explicitConfig("7200000", "3600000");
  const maximum = explicitConfig("7200000", "7200000");
  const changedGate = explicitConfig("7200000", "3600001");
  const changedPreview = explicitConfig("7200001", "3600000");

  withScenarioDatabase((db, fixture) => {
    const defaultPreview = preparePreview(
      db,
      fixture,
      defaults,
      "2026-07-10T13:16:00.000Z",
    );
    const legacyPreview = prepareVNextSemanticCommitPreviewV01(db, {
      workspace_id: fixture.proposal.workspace_id,
      project_id: fixture.proposal.project_id,
      proposal_id: fixture.proposal.proposal_id,
      proposal_fingerprint: fixture.proposal.integrity.fingerprint,
      decision_id: fixture.decision.decision_id,
      decision_fingerprint: fixture.decision.integrity.fingerprint,
      authorized_applier_identity: {
        ref_type: "operator_actor",
        external_id: "operator:review-window-validation",
      },
      gate_ttl_ms: 600_000,
      clock: sequenceClock([
        "2026-07-10T13:16:00.000Z",
        "2026-07-10T13:16:00.000Z",
      ]),
    });
    assert.deepEqual(defaultPreview, legacyPreview);
    pass("omitted_default_preview_fixture_byte_identical");

    const extendedPreview = preparePreview(
      db,
      fixture,
      extended,
      "2026-07-10T13:16:00.000Z",
    );
    assert.equal(extendedPreview.gate_ttl_ms, 3_600_000);
    pass("preview_reports_effective_gate_ttl");

    const changedGatePreview = preparePreview(
      db,
      fixture,
      changedGate,
      "2026-07-10T13:16:00.000Z",
    );
    assert.notEqual(
      extendedPreview.confirmation_digest,
      changedGatePreview.confirmation_digest,
    );
    pass("confirmation_digest_changes_with_gate_ttl");

    const changedPreviewResult = preparePreview(
      db,
      fixture,
      changedPreview,
      "2026-07-10T13:16:00.000Z",
    );
    assert.notEqual(
      extendedPreview.confirmation_digest,
      changedPreviewResult.confirmation_digest,
    );
    pass("confirmation_digest_changes_with_preview_age");

    const beforePreviewCount = coreCount(db);
    const maximumPreview = preparePreview(
      db,
      fixture,
      maximum,
      "2026-07-10T13:16:00.000Z",
    );
    assert.equal(maximumPreview.gate_ttl_ms, 7_200_000);
    assert.equal(coreCount(db), beforePreviewCount);
    pass("preview_writes_zero_database_rows");
  });

  withScenarioDatabase((db, fixture) => {
    const preview = preparePreview(
      db,
      fixture,
      extended,
      "2026-07-10T13:16:00.000Z",
    );
    const gate = recordGate(
      db,
      fixture,
      preview,
      extended,
      "2026-07-10T14:00:00.000Z",
    );
    assert.equal(
      Date.parse(gate.semantic_commit_gate_evaluation.expires_at) -
        Date.parse(gate.semantic_commit_gate_evaluation.evaluated_at),
      3_600_000,
    );
    assert.equal(coreKindCount(db, "semantic_commit_gate"), 1);
    assert.equal(coreKindCount(db, "state_transition_receipt"), 0);
    pass("confirmation_after_legacy_window_uses_effective_preview_age");
    pass("gate_expiry_uses_effective_gate_ttl");
    pass("confirmation_writes_gate_only");
    assertVNextOperatorPilotGateReviewWindowConfigV01(gate, extended);

    assert.throws(
      () => assertVNextOperatorPilotGateReviewWindowConfigV01(gate, changedGate),
      /operator_pilot_review_window_config_mismatch/,
    );
    reject("configuration_change_between_confirmation_and_commit_rejected");

    const applied = commitVNextSemanticTransitionV01(db, {
      workspace_id: fixture.proposal.workspace_id,
      project_id: fixture.proposal.project_id,
      proposal_id: fixture.proposal.proposal_id,
      proposal_fingerprint: fixture.proposal.integrity.fingerprint,
      decision_id: fixture.decision.decision_id,
      decision_fingerprint: fixture.decision.integrity.fingerprint,
      gate_record_id: gate.gate_record_id,
      gate_record_fingerprint: gate.integrity.fingerprint,
      preview_max_age_ms: extended.preview_max_age_ms,
      clock: sequenceClock([
        "2026-07-10T14:59:59.000Z",
        "2026-07-10T14:59:59.000Z",
      ]),
    });
    databaseWrites += 3;
    assert.equal(applied.status, "applied");
    assert.equal(applied.state_records.length, 1);
    assert.equal(applied.projection_entries.length, 1);
    assert.equal(coreKindCount(db, "state_transition_receipt"), 1);
    pass("fresh_extended_ttl_gate_commits_state_head_receipt_only");
  });

  withScenarioDatabase((db, fixture) => {
    const preview = preparePreview(
      db,
      fixture,
      extended,
      "2026-07-10T13:16:00.000Z",
    );
    const contextFingerprint =
      createVNextOperatorPilotReviewWindowConfigFingerprintV01(changedPreview);
    const contextRef = createVNextSemanticCommitConfirmationContextRefV01({
      context_id: changedPreview.config_version,
      context_fingerprint: contextFingerprint,
      observed_at: "2026-07-10T14:00:00.000Z",
    });
    assert.throws(
      () =>
        recordVNextSemanticCommitAuthorizationV01(db, {
          preview,
          confirmation_digest: preview.confirmation_digest,
          operator_actor_ref: fixture.decision.actor_ref,
          operator_confirmation_basis_refs: [contextRef],
          confirmation_context_fingerprint: contextFingerprint,
          preview_max_age_ms: changedPreview.preview_max_age_ms,
          clock: sequenceClock([
            "2026-07-10T14:00:00.000Z",
            "2026-07-10T14:00:00.000Z",
            "2026-07-10T14:00:00.000Z",
          ]),
        }),
      /semantic_commit_confirmation_digest_mismatch/,
    );
    assert.equal(coreKindCount(db, "semantic_commit_gate"), 0);
    reject("configuration_change_between_preview_and_confirmation_rejected");
  });

  withScenarioDatabase((db, fixture) => {
    const preview = preparePreview(
      db,
      fixture,
      extended,
      "2026-07-10T13:16:00.000Z",
    );
    assert.throws(
      () =>
        recordGate(
          db,
          fixture,
          preview,
          extended,
          "2026-07-10T15:16:00.001Z",
        ),
      /semantic_commit_preview_confirmation_window_expired/,
    );
    assert.equal(coreKindCount(db, "semantic_commit_gate"), 0);
    reject("stale_preview_beyond_configured_age_rejected");
  });

  withScenarioDatabase((db, fixture) => {
    const preview = preparePreview(
      db,
      fixture,
      maximum,
      "2026-07-10T13:16:00.000Z",
    );
    const gate = recordGate(
      db,
      fixture,
      preview,
      maximum,
      "2026-07-10T14:00:00.000Z",
    );
    assert.throws(
      () =>
        commitVNextSemanticTransitionV01(db, {
          workspace_id: fixture.proposal.workspace_id,
          project_id: fixture.proposal.project_id,
          proposal_id: fixture.proposal.proposal_id,
          proposal_fingerprint: fixture.proposal.integrity.fingerprint,
          decision_id: fixture.decision.decision_id,
          decision_fingerprint: fixture.decision.integrity.fingerprint,
          gate_record_id: gate.gate_record_id,
          gate_record_fingerprint: gate.integrity.fingerprint,
          preview_max_age_ms: maximum.preview_max_age_ms,
          clock: sequenceClock(["2026-07-10T16:00:00.001Z"]),
        }),
      /semantic_commit_gate_expired/,
    );
    assert.equal(coreKindCount(db, "state_transition_receipt"), 0);
    reject("expired_extended_ttl_gate_rejected");
  });
}

function validateCommittedCallerBoundaryCoverage(): void {
  const operatorRuntime = readFileSync(
    path.join(
      process.cwd(),
      "lib",
      "vnext",
      "runtime",
      "operator-pilot-semantic-transition.ts",
    ),
    "utf8",
  );
  const confirmBoundary = operatorRuntime.slice(
    operatorRuntime.indexOf("function parseConfirmRequest"),
    operatorRuntime.indexOf("function parseCommitRequest"),
  );
  const commitBoundary = operatorRuntime.slice(
    operatorRuntime.indexOf("function parseCommitRequest"),
    operatorRuntime.indexOf("function parseCompileRequest"),
  );
  assert(!confirmBoundary.includes("preview_max_age_ms"));
  assert(!confirmBoundary.includes("gate_ttl_ms"));
  assert(!commitBoundary.includes("preview_max_age_ms"));
  assert(!commitBoundary.includes("gate_ttl_ms"));
  reject("caller_supplied_preview_max_age_field_rejected");
  reject("caller_supplied_gate_ttl_field_rejected");
}

function preparePreview(
  db: Database.Database,
  fixture: ReturnType<typeof buildSemanticTransitionLoopFixtureV01>,
  config: VNextOperatorPilotReviewWindowConfigV01,
  previewedAt: string,
): VNextSemanticCommitPreviewV01 {
  databaseReads += 1;
  const contextFingerprint = isExplicitVNextOperatorPilotReviewWindowConfigV01(
    config,
  )
    ? createVNextOperatorPilotReviewWindowConfigFingerprintV01(config)
    : undefined;
  return prepareVNextSemanticCommitPreviewV01(db, {
    workspace_id: fixture.proposal.workspace_id,
    project_id: fixture.proposal.project_id,
    proposal_id: fixture.proposal.proposal_id,
    proposal_fingerprint: fixture.proposal.integrity.fingerprint,
    decision_id: fixture.decision.decision_id,
    decision_fingerprint: fixture.decision.integrity.fingerprint,
    authorized_applier_identity: {
      ref_type: "operator_actor",
      external_id: "operator:review-window-validation",
    },
    gate_ttl_ms: config.gate_ttl_ms,
    confirmation_context_fingerprint: contextFingerprint,
    clock: sequenceClock([previewedAt, previewedAt]),
  });
}

function recordGate(
  db: Database.Database,
  fixture: ReturnType<typeof buildSemanticTransitionLoopFixtureV01>,
  preview: VNextSemanticCommitPreviewV01,
  config: VNextOperatorPilotReviewWindowConfigV01,
  confirmedAt: string,
): VNextSemanticCommitGateRecordV01 {
  const contextFingerprint = isExplicitVNextOperatorPilotReviewWindowConfigV01(
    config,
  )
    ? createVNextOperatorPilotReviewWindowConfigFingerprintV01(config)
    : undefined;
  const contextRef = contextFingerprint
    ? createVNextSemanticCommitConfirmationContextRefV01({
        context_id: config.config_version,
        context_fingerprint: contextFingerprint,
        observed_at: confirmedAt,
      })
    : null;
  const result = recordVNextSemanticCommitAuthorizationV01(db, {
    preview,
    confirmation_digest: preview.confirmation_digest,
    operator_actor_ref: fixture.decision.actor_ref,
    operator_confirmation_basis_refs: contextRef ? [contextRef] : undefined,
    confirmation_context_fingerprint: contextFingerprint,
    preview_max_age_ms: config.preview_max_age_ms,
    clock: sequenceClock([confirmedAt, confirmedAt, confirmedAt]),
  });
  databaseWrites += 1;
  return result.gate_record;
}

function withScenarioDatabase(
  run: (
    db: Database.Database,
    fixture: ReturnType<typeof buildSemanticTransitionLoopFixtureV01>,
  ) => void,
): void {
  const root = mkdtempSync(path.join(tmpdir(), "augnes-review-window-"));
  const databasePath = path.join(root, "isolated.db");
  const db = new Database(databasePath);
  try {
    db.exec(SCHEMA_SQL);
    const fixture = buildSemanticTransitionLoopFixtureV01(
      semanticTransitionLoopProjectAFixture,
    );
    persistVNextSemanticReviewMaterialV01(db, {
      proposal: fixture.proposal,
      decision: fixture.decision,
    });
    databaseWrites += 2;
    run(db, fixture);
    assert.deepEqual(db.pragma("integrity_check"), [{ integrity_check: "ok" }]);
  } finally {
    db.close();
    rmSync(root, { recursive: true, force: true });
  }
}

function sequenceClock(values: string[]): VNextLocalRuntimeClockV01 {
  let index = 0;
  return {
    now: () => values[Math.min(index++, values.length - 1)]!,
  };
}

function explicitConfig(
  preview: string,
  gate: string,
): VNextOperatorPilotReviewWindowConfigV01 {
  return readVNextOperatorPilotReviewWindowConfigV01({
    [VNEXT_OPERATOR_PILOT_PREVIEW_MAX_AGE_ENV_V01]: preview,
    [VNEXT_OPERATOR_PILOT_GATE_TTL_ENV_V01]: gate,
  });
}

function expectConfigError(
  caseId: string,
  environment: Readonly<Record<string, string | undefined>>,
): void {
  assert.throws(
    () => readVNextOperatorPilotReviewWindowConfigV01(environment),
    (error: unknown) => {
      assert(error instanceof Error);
      assert.match(error.message, /^operator_pilot_[a-z_]+_invalid$/);
      for (const value of Object.values(environment)) {
        if (value) assert(!error.message.includes(value));
      }
      return true;
    },
  );
  reject(caseId);
}

function coreCount(db: Database.Database): number {
  databaseReads += 1;
  return (
    db.prepare("SELECT COUNT(*) AS count FROM vnext_core_records").get() as {
      count: number;
    }
  ).count;
}

function coreKindCount(db: Database.Database, recordKind: string): number {
  databaseReads += 1;
  return (
    db
      .prepare(
        "SELECT COUNT(*) AS count FROM vnext_core_records WHERE record_kind = ?",
      )
      .get(recordKind) as { count: number }
  ).count;
}

function pass(caseId: string): void {
  if (!positiveCases.includes(caseId)) positiveCases.push(caseId);
}

function reject(caseId: string): void {
  if (!negativeCases.includes(caseId)) negativeCases.push(caseId);
}
