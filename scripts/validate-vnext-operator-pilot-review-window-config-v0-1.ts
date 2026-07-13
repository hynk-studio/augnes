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
  VNEXT_SEMANTIC_COMMIT_CONFIRMATION_CONTEXT_NAMESPACE_V01,
  VNEXT_SEMANTIC_COMMIT_CONFIRMATION_CONTEXT_REF_TYPE_V01,
  commitVNextSemanticTransitionWithOperatorPilotCapabilityInsideTransactionV01,
  commitVNextSemanticTransitionV01,
  persistVNextSemanticReviewMaterialV01,
  prepareVNextSemanticCommitPreviewWithOperatorPilotCapabilityV01,
  prepareVNextSemanticCommitPreviewV01,
  recordVNextSemanticCommitAuthorizationWithOperatorPilotCapabilityInsideTransactionV01,
  recordVNextSemanticCommitAuthorizationV01,
  type VNextSemanticCommitGateRecordV01,
  type VNextSemanticCommitPreviewV01,
} from "@/lib/vnext/runtime/durable-semantic-transition";
import {
  VNEXT_OPERATOR_PILOT_GATE_TTL_ENV_V01,
  VNEXT_OPERATOR_PILOT_PREVIEW_MAX_AGE_ENV_V01,
  createVNextOperatorPilotReviewWindowCapabilityV01,
  readVNextOperatorPilotReviewWindowConfigV01,
  type VNextOperatorPilotReviewWindowCapabilityV01,
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
    validateRuntimeCapabilityBoundary();
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
    assert.throws(
      () =>
        commitGateWithCapability(
          db,
          fixture,
          gate,
          changedGate,
          "2026-07-10T14:59:58.000Z",
        ),
      /semantic_commit_operator_pilot_capability_mismatch/,
    );
    assert.equal(coreKindCount(db, "state_transition_receipt"), 0);
    reject("configuration_change_between_confirmation_and_commit_rejected");
    reject("changed_gate_ttl_rejected_before_commit");

    const applied = commitGateWithCapability(
      db,
      fixture,
      gate,
      extended,
      "2026-07-10T14:59:59.000Z",
    );
    databaseWrites += 3;
    assert.equal(applied.status, "applied");
    assert.equal(applied.state_records.length, 1);
    assert.equal(applied.projection_entries.length, 1);
    assert.equal(coreKindCount(db, "state_transition_receipt"), 1);
    assert.equal(coreKindCount(db, "task_context_packet"), 0);
    pass("fresh_extended_ttl_gate_commits_state_head_receipt_only");
    pass("packet_compilation_remains_separate");
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
          changedPreview,
          "2026-07-10T14:00:00.000Z",
        ),
      /semantic_commit_confirmation_digest_mismatch/,
    );
    assert.equal(coreKindCount(db, "semantic_commit_gate"), 0);
    reject("configuration_change_between_preview_and_confirmation_rejected");
    reject("changed_preview_age_rejected_before_confirmation");
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
        commitGateWithCapability(
          db,
          fixture,
          gate,
          maximum,
          "2026-07-10T16:00:00.001Z",
        ),
      /semantic_commit_gate_expired/,
    );
    assert.equal(coreKindCount(db, "state_transition_receipt"), 0);
    reject("expired_extended_ttl_gate_rejected");
  });

  withScenarioDatabase((db, fixture) => {
    const shortConfig = explicitConfig("7200000", "3600000");
    const longerConfig = explicitConfig("28800000", "7200000");
    const preview = preparePreview(
      db,
      fixture,
      shortConfig,
      "2026-07-10T13:16:00.000Z",
    );
    const gate = recordGate(
      db,
      fixture,
      preview,
      shortConfig,
      "2026-07-10T14:00:00.000Z",
    );
    assert.throws(
      () =>
        commitGateWithCapability(
          db,
          fixture,
          gate,
          longerConfig,
          "2026-07-10T15:00:00.001Z",
        ),
      /semantic_commit_operator_pilot_capability_mismatch/,
    );
    assert.equal(coreKindCount(db, "state_transition_receipt"), 0);
    reject("expired_operator_gate_not_revived_by_longer_current_config");
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

function validateRuntimeCapabilityBoundary(): void {
  const validFingerprint = `sha256:${"a".repeat(64)}`;
  const invalidFingerprint = "sha256:not-a-fingerprint";
  const explicit = explicitConfig("7200000", "3600000");

  withScenarioDatabase((db, fixture) => {
    const previewInput = {
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
    };
    assert.throws(
      () =>
        prepareVNextSemanticCommitPreviewV01(db, {
          ...previewInput,
          gate_ttl_ms: 3_600_001,
        }),
      /semantic_commit_gate_ttl_invalid/,
    );
    reject("generic_preview_above_one_hour_rejected");

    const genericPreview = prepareVNextSemanticCommitPreviewV01(
      db,
      previewInput,
    );
    assert.throws(
      () =>
        recordVNextSemanticCommitAuthorizationV01(db, {
          preview: genericPreview,
          confirmation_digest: genericPreview.confirmation_digest,
          operator_actor_ref: fixture.decision.actor_ref,
          clock: sequenceClock([
            "2026-07-10T13:31:00.001Z",
            "2026-07-10T13:31:00.001Z",
            "2026-07-10T13:31:00.001Z",
          ]),
        }),
      /semantic_commit_preview_confirmation_window_expired/,
    );
    assert.equal(coreKindCount(db, "semantic_commit_gate"), 0);
    reject("generic_preview_older_than_fifteen_minutes_rejected");
    const rawPreview = prepareVNextSemanticCommitPreviewV01 as unknown as (
      database: Database.Database,
      input: Record<string, unknown>,
    ) => VNextSemanticCommitPreviewV01;
    for (const [caseId, fingerprint] of [
      ["arbitrary_valid_fingerprint_cannot_unlock_extended_ttl", validFingerprint],
      ["arbitrary_invalid_fingerprint_cannot_unlock_extended_ttl", invalidFingerprint],
    ] as const) {
      assert.throws(
        () =>
          rawPreview(db, {
            ...previewInput,
            gate_ttl_ms: 7_200_000,
            confirmation_context_fingerprint: fingerprint,
          }),
        /runtime_input_unknown_field:confirmation_context_fingerprint/,
      );
      reject(caseId);
    }
    assert.throws(
      () =>
        rawPreview(db, {
          ...previewInput,
          confirmation_context_fingerprint: validFingerprint,
        }),
      /runtime_input_unknown_field:confirmation_context_fingerprint/,
    );
    reject("generic_preview_context_field_rejected");

    const rawAuthorization =
      recordVNextSemanticCommitAuthorizationV01 as unknown as (
        database: Database.Database,
        input: Record<string, unknown>,
      ) => unknown;
    assert.throws(
      () =>
        rawAuthorization(db, {
          preview: genericPreview,
          confirmation_digest: genericPreview.confirmation_digest,
          operator_actor_ref: fixture.decision.actor_ref,
          confirmation_context_fingerprint: validFingerprint,
          clock: sequenceClock([
            "2026-07-10T13:20:00.000Z",
            "2026-07-10T13:20:00.000Z",
            "2026-07-10T13:20:00.000Z",
          ]),
        }),
      /runtime_input_unknown_field:confirmation_context_fingerprint/,
    );
    reject("generic_authorization_context_field_rejected");
    assert.throws(
      () =>
        rawAuthorization(db, {
          preview: genericPreview,
          confirmation_digest: genericPreview.confirmation_digest,
          operator_actor_ref: fixture.decision.actor_ref,
          preview_max_age_ms: 7_200_000,
          clock: sequenceClock([
            "2026-07-10T13:20:00.000Z",
            "2026-07-10T13:20:00.000Z",
            "2026-07-10T13:20:00.000Z",
          ]),
        }),
      /runtime_input_unknown_field:preview_max_age_ms/,
    );
    reject("generic_authorization_preview_age_field_rejected");

    const forgedContextRef = {
      ref_version: "external_ref.v0.1",
      ref_type: VNEXT_SEMANTIC_COMMIT_CONFIRMATION_CONTEXT_REF_TYPE_V01,
      external_id: explicit.config_version,
      trust_class: "direct_local_observation",
      observed_at: "2026-07-10T13:20:00.000Z",
      source_ref: validFingerprint,
      compatibility_namespace:
        VNEXT_SEMANTIC_COMMIT_CONFIRMATION_CONTEXT_NAMESPACE_V01,
    };
    assert.throws(
      () =>
        recordVNextSemanticCommitAuthorizationV01(db, {
          preview: genericPreview,
          confirmation_digest: genericPreview.confirmation_digest,
          operator_actor_ref: fixture.decision.actor_ref,
          operator_confirmation_basis_refs: [forgedContextRef as never],
          clock: sequenceClock([
            "2026-07-10T13:20:00.000Z",
            "2026-07-10T13:20:00.000Z",
            "2026-07-10T13:20:00.000Z",
          ]),
        }),
      /semantic_commit_operator_review_window_context_forbidden/,
    );
    assert.equal(coreKindCount(db, "semantic_commit_gate"), 0);
    reject("manual_confirmation_context_ref_cannot_unlock_extended_ttl");

    const rawCommit = commitVNextSemanticTransitionV01 as unknown as (
      database: Database.Database,
      input: Record<string, unknown>,
    ) => unknown;
    assert.throws(
      () =>
        rawCommit(db, {
          workspace_id: fixture.proposal.workspace_id,
          project_id: fixture.proposal.project_id,
          proposal_id: fixture.proposal.proposal_id,
          proposal_fingerprint: fixture.proposal.integrity.fingerprint,
          decision_id: fixture.decision.decision_id,
          decision_fingerprint: fixture.decision.integrity.fingerprint,
          gate_record_id: "semantic-commit-gate:missing",
          gate_record_fingerprint: validFingerprint,
          preview_max_age_ms: 7_200_000,
          clock: sequenceClock(["2026-07-10T13:20:00.000Z"]),
        }),
      /runtime_input_unknown_field:preview_max_age_ms/,
    );
    reject("generic_commit_preview_age_field_rejected");
  });

  withScenarioDatabase((db, fixture) => {
    const capability = capabilityFor(fixture, explicit);
    assert.equal(Object.keys(capability).length, 0);
    assert.equal(JSON.stringify(capability), "{}");
    pass("runtime_capability_is_opaque_and_non_enumerable");

    const operatorInput = {
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
      clock: sequenceClock([
        "2026-07-10T13:16:00.000Z",
        "2026-07-10T13:16:00.000Z",
      ]),
    };
    for (const [caseId, forged] of [
      ["operator_like_plain_config_object_rejected", { ...explicit }],
      ["copied_capability_fields_rejected", { ...capability }],
      ["serialized_capability_loses_authority", JSON.parse(JSON.stringify(capability))],
    ] as const) {
      const attemptedCapability =
        caseId === "operator_like_plain_config_object_rejected"
          ? createCapabilityFromUnknown(forged, fixture)
          : forged;
      if (caseId === "operator_like_plain_config_object_rejected") {
        assert.equal(attemptedCapability, null);
      } else {
        assert.throws(
          () =>
            prepareVNextSemanticCommitPreviewWithOperatorPilotCapabilityV01(
              db,
              {
                ...operatorInput,
                review_window_capability: attemptedCapability as never,
              },
            ),
          /operator_pilot_review_window_capability_invalid/,
        );
      }
      reject(caseId);
    }

    for (const [caseId, scope] of [
      [
        "capability_from_another_workspace_rejected",
        { workspace_id: "workspace:other", project_id: fixture.proposal.project_id },
      ],
      [
        "capability_from_another_project_rejected",
        { workspace_id: fixture.proposal.workspace_id, project_id: "project:other" },
      ],
    ] as const) {
      const scopedCapability = createVNextOperatorPilotReviewWindowCapabilityV01({
        config: explicit,
        ...scope,
      });
      assert.throws(
        () =>
          prepareVNextSemanticCommitPreviewWithOperatorPilotCapabilityV01(db, {
            ...operatorInput,
            review_window_capability: scopedCapability,
          }),
        /operator_pilot_review_window_capability_invalid/,
      );
      reject(caseId);
    }

    const forgedVersion = {
      ...explicit,
      config_version: "vnext_operator_pilot_review_window_config.v9.9",
    };
    assert.equal(createCapabilityFromUnknown(forgedVersion, fixture), null);
    reject("capability_from_another_config_version_rejected");
  });

  withScenarioDatabase((db, fixture) => {
    const preview = preparePreview(
      db,
      fixture,
      explicit,
      "2026-07-10T13:16:00.000Z",
    );
    const forgedContextRef = {
      ref_version: "external_ref.v0.1",
      ref_type: VNEXT_SEMANTIC_COMMIT_CONFIRMATION_CONTEXT_REF_TYPE_V01,
      external_id: explicit.config_version,
      trust_class: "direct_local_observation",
      observed_at: "2026-07-10T14:00:00.000Z",
      source_ref: validFingerprint,
      compatibility_namespace:
        VNEXT_SEMANTIC_COMMIT_CONFIRMATION_CONTEXT_NAMESPACE_V01,
    };
    db.exec("BEGIN IMMEDIATE");
    try {
      assert.throws(
        () =>
          recordVNextSemanticCommitAuthorizationWithOperatorPilotCapabilityInsideTransactionV01(
            db,
            {
              preview,
              confirmation_digest: preview.confirmation_digest,
              operator_actor_ref: fixture.decision.actor_ref,
              operator_confirmation_basis_refs: [forgedContextRef as never],
              review_window_capability: capabilityFor(fixture, explicit),
              clock: sequenceClock([
                "2026-07-10T14:00:00.000Z",
                "2026-07-10T14:00:00.000Z",
                "2026-07-10T14:00:00.000Z",
              ]),
            },
          ),
        /semantic_commit_operator_review_window_context_forbidden/,
      );
    } finally {
      db.exec("ROLLBACK");
    }
    assert.equal(coreKindCount(db, "semantic_commit_gate"), 0);
    reject("forged_basis_ref_with_copied_values_rejected");

    db.exec("BEGIN IMMEDIATE");
    try {
      assert.throws(
        () =>
          recordVNextSemanticCommitAuthorizationWithOperatorPilotCapabilityInsideTransactionV01(
            db,
            {
              preview,
              confirmation_digest: validFingerprint,
              operator_actor_ref: fixture.decision.actor_ref,
              review_window_capability: capabilityFor(fixture, explicit),
              clock: sequenceClock([
                "2026-07-10T14:00:00.000Z",
                "2026-07-10T14:00:00.000Z",
                "2026-07-10T14:00:00.000Z",
              ]),
            },
          ),
        /semantic_commit_confirmation_digest_mismatch/,
      );
    } finally {
      db.exec("ROLLBACK");
    }
    assert.equal(coreKindCount(db, "semantic_commit_gate"), 0);
    reject("changed_confirmation_digest_rejected");
    reject("failed_confirmation_writes_no_gate");
  });

  withScenarioDatabase((db, fixture) => {
    const defaultConfig = readVNextOperatorPilotReviewWindowConfigV01({});
    const explicitDefaults = explicitConfig("900000", "600000");
    const preview = preparePreview(
      db,
      fixture,
      explicitDefaults,
      "2026-07-10T13:16:00.000Z",
    );
    assert.throws(
      () =>
        recordGate(
          db,
          fixture,
          preview,
          defaultConfig,
          "2026-07-10T13:20:00.000Z",
        ),
      /semantic_commit_confirmation_digest_mismatch/,
    );
    reject("changed_source_metadata_rejected");
  });

  withScenarioDatabase((db, fixture) => {
    const genericPreview = prepareVNextSemanticCommitPreviewV01(db, {
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
    const gate = recordVNextSemanticCommitAuthorizationV01(db, {
      preview: genericPreview,
      confirmation_digest: genericPreview.confirmation_digest,
      operator_actor_ref: fixture.decision.actor_ref,
      clock: sequenceClock([
        "2026-07-10T13:20:00.000Z",
        "2026-07-10T13:20:00.000Z",
        "2026-07-10T13:20:00.000Z",
      ]),
    }).gate_record;
    assert.throws(
      () =>
        commitGateWithCapability(
          db,
          fixture,
          gate,
          explicit,
          "2026-07-10T13:21:00.000Z",
        ),
      /semantic_commit_operator_pilot_capability_mismatch/,
    );
    assert.equal(coreKindCount(db, "state_transition_receipt"), 0);
    reject("legacy_generic_gate_cannot_be_reclassified_as_operator_extended");
    reject("failed_commit_writes_no_receipt_state_or_head");

    const applied = commitVNextSemanticTransitionV01(db, {
      workspace_id: fixture.proposal.workspace_id,
      project_id: fixture.proposal.project_id,
      proposal_id: fixture.proposal.proposal_id,
      proposal_fingerprint: fixture.proposal.integrity.fingerprint,
      decision_id: fixture.decision.decision_id,
      decision_fingerprint: fixture.decision.integrity.fingerprint,
      gate_record_id: gate.gate_record_id,
      gate_record_fingerprint: gate.integrity.fingerprint,
      clock: sequenceClock([
        "2026-07-10T13:21:00.000Z",
        "2026-07-10T13:21:00.000Z",
      ]),
    });
    assert.equal(applied.status, "applied");
    pass("generic_commit_uses_legacy_timing_without_caller_override");
  });
}

function preparePreview(
  db: Database.Database,
  fixture: ReturnType<typeof buildSemanticTransitionLoopFixtureV01>,
  config: VNextOperatorPilotReviewWindowConfigV01,
  previewedAt: string,
): VNextSemanticCommitPreviewV01 {
  databaseReads += 1;
  return prepareVNextSemanticCommitPreviewWithOperatorPilotCapabilityV01(db, {
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
    review_window_capability: capabilityFor(fixture, config),
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
  db.exec("BEGIN IMMEDIATE");
  let result: ReturnType<
    typeof recordVNextSemanticCommitAuthorizationWithOperatorPilotCapabilityInsideTransactionV01
  >;
  try {
    result =
      recordVNextSemanticCommitAuthorizationWithOperatorPilotCapabilityInsideTransactionV01(
        db,
        {
          preview,
          confirmation_digest: preview.confirmation_digest,
          operator_actor_ref: fixture.decision.actor_ref,
          review_window_capability: capabilityFor(fixture, config),
          clock: sequenceClock([confirmedAt, confirmedAt, confirmedAt]),
        },
      );
    db.exec("COMMIT");
  } catch (error) {
    if (db.inTransaction) db.exec("ROLLBACK");
    throw error;
  }
  databaseWrites += 1;
  return result.gate_record;
}

function commitGateWithCapability(
  db: Database.Database,
  fixture: ReturnType<typeof buildSemanticTransitionLoopFixtureV01>,
  gate: VNextSemanticCommitGateRecordV01,
  config: VNextOperatorPilotReviewWindowConfigV01,
  appliedAt: string,
): ReturnType<
  typeof commitVNextSemanticTransitionWithOperatorPilotCapabilityInsideTransactionV01
> {
  db.exec("BEGIN IMMEDIATE");
  try {
    const result =
      commitVNextSemanticTransitionWithOperatorPilotCapabilityInsideTransactionV01(
        db,
        {
          workspace_id: fixture.proposal.workspace_id,
          project_id: fixture.proposal.project_id,
          proposal_id: fixture.proposal.proposal_id,
          proposal_fingerprint: fixture.proposal.integrity.fingerprint,
          decision_id: fixture.decision.decision_id,
          decision_fingerprint: fixture.decision.integrity.fingerprint,
          gate_record_id: gate.gate_record_id,
          gate_record_fingerprint: gate.integrity.fingerprint,
          review_window_capability: capabilityFor(fixture, config),
          clock: sequenceClock([appliedAt, appliedAt]),
        },
      );
    db.exec("COMMIT");
    return result;
  } catch (error) {
    if (db.inTransaction) db.exec("ROLLBACK");
    throw error;
  }
}

function capabilityFor(
  fixture: ReturnType<typeof buildSemanticTransitionLoopFixtureV01>,
  config: VNextOperatorPilotReviewWindowConfigV01,
): VNextOperatorPilotReviewWindowCapabilityV01 {
  return createVNextOperatorPilotReviewWindowCapabilityV01({
    config,
    workspace_id: fixture.proposal.workspace_id,
    project_id: fixture.proposal.project_id,
  });
}

function createCapabilityFromUnknown(
  config: unknown,
  fixture: ReturnType<typeof buildSemanticTransitionLoopFixtureV01>,
): VNextOperatorPilotReviewWindowCapabilityV01 | null {
  try {
    return createVNextOperatorPilotReviewWindowCapabilityV01({
      config: config as VNextOperatorPilotReviewWindowConfigV01,
      workspace_id: fixture.proposal.workspace_id,
      project_id: fixture.proposal.project_id,
    });
  } catch {
    return null;
  }
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
