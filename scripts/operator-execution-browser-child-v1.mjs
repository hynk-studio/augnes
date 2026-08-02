import assert from "node:assert/strict";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";

import {
  OPERATOR_EXECUTION_FIXTURE_VERSION_V1,
  buildOperatorExecutionBrowserFixtureV1,
} from "./operator-execution-browser-fixture-v1.ts";
import {
  assertOperatorExecutionEffectDiffV1,
  boundedOperatorExecutionEffectDiffEntriesV1,
  captureOperatorExecutionEffectSnapshotV1,
  diffOperatorExecutionEffectSnapshotsV1,
  exactEffectSummaryV1,
} from "./operator-execution-effect-ledger-v1.mjs";
import {
  createOperatorChildTemporaryRootsV1,
  createOperatorExecutionBrowserLifecycleV1,
} from "./operator-execution-browser-lifecycle-v1.mjs";
import {
  assertOperatorExecutionFinalSuccessV1,
  createOperatorDetailedFieldCompletionOwnerV1,
  createOperatorResultFieldDefaultsV1,
  createOperatorSemanticMarkerOwnerV1,
  loadOperatorExecutionResultContractV1,
} from "./operator-execution-result-contract-v1.mjs";

const ACCEPTANCE_BOUND_MS = 360_000;
const REFERENCE_BOUND_MS = 480_000;

export async function runOperatorExecutionBrowserChildV1({
  child_id,
  prepare = async () => ({}),
  execute,
  console_allowlist = () => false,
  console_allowlist_finalize = () => {},
  request_failure_allowlist = () => false,
}) {
  const startedAt = Date.now();
  const originalUmask = process.umask(0o077);
  const contract = loadOperatorExecutionResultContractV1({ child_id });
  const fieldOwner = createOperatorDetailedFieldCompletionOwnerV1(contract);
  const markerOwner = createOperatorSemanticMarkerOwnerV1(contract);
  const roots = createOperatorChildTemporaryRootsV1(child_id);
  const fixtureRoot = path.join(roots.temporary_root, "fixture-v1");
  mkdirSync(fixtureRoot, { recursive: false, mode: 0o700 });
  let lifecycle = null;
  let fixture = null;
  let functionalExecutionSucceeded = false;
  let beforeEffects = null;
  let afterEffects = null;
  let observedEffectDiff = null;
  const result = {
    ok: false,
    validation_version: "operator_execution_browser_validation.v1",
    owner: "operator_execution",
    child_id,
    fixture_profile: contract.fixture_profile,
    fixture_version: null,
    fixture_fingerprint: null,
    fixture_source_database_sha256: null,
    fixture_writable_seed_sha256: null,
    detailed_field_count: contract.field_ids.length,
    detailed_marker_count: contract.marker_ids.length,
    detailed_field_set_fingerprint: contract.field_set_fingerprint,
    semantic_marker_set_fingerprint: contract.marker_set_fingerprint,
    completed_detailed_field_ids: [],
    completed_detailed_field_fingerprint: null,
    semantic_marker_ids: [],
    semantic_marker_fingerprint: null,
    ...createOperatorResultFieldDefaultsV1(contract),
    effect_contract_version: null,
    effect_diff_version: null,
    before_effect_snapshot: null,
    after_effect_snapshot: null,
    permitted_effect_diff_fingerprint: null,
    observed_effect_diff_fingerprint: null,
    effect_operation_counts: null,
    effect_operation_counts_by_category: null,
    forbidden_effect_zero_evidence: null,
    effect_mismatch_material: null,
    unowned_effect_count: null,
    packet_root_run_result_proposal_decision_transition_identity: null,
    request_response_console_page_refusal_summary: null,
    unexpected_external_request_count: null,
    unexpected_console_failure_count: null,
    unexpected_page_failure_count: null,
    unexpected_request_failure_count: null,
    unexpected_refusal_accounting_failure_count: null,
    credential_private_material_boundary: false,
    default_database_isolated: false,
    resource_ownership: [
      "immutable_fixture_copy",
      "writable_database",
      "runtime_state_directory",
      "runtime_supervisor_process_tree",
      "application_listener_port",
      "bridge_debug_ports",
      "browser_process",
      "cdp_session",
      "browser_profile",
      "temporary_root",
      "project_roots",
      "download_directory",
      "bootstrap_session_action_credentials",
      "file_signal_barriers",
      "deterministic_transport_fixture_and_counters",
      "request_response_console_page_ledgers",
      "owned_streams_and_cleanup",
    ],
    cleanup_complete: false,
    owned_streams_settled: false,
    owned_process_residue_count: null,
    listener_residue_count: null,
    temporary_root_removed: false,
    temporary_process_root_removed: false,
    temporary_profile_removed: false,
    temporary_database_removed: false,
    temporary_fixture_removed: false,
    temporary_signal_removed: false,
    temporary_transport_removed: false,
    runtime_shutdown_complete: false,
    chrome_cdp_shutdown_complete: false,
    total_duration_ms: null,
    reference_headroom_ms: null,
    acceptance_bound_ms: ACCEPTANCE_BOUND_MS,
    e2e_timing_summary: null,
    failure: null,
  };

  const completeDetailedField = (id) => fieldOwner.complete(id);
  const record = (id) => markerOwner.complete(id);
  try {
    fixture = await buildOperatorExecutionBrowserFixtureV1({
      output_directory: fixtureRoot,
      reference_time: new Date().toISOString(),
      profile: contract.fixture_profile,
    });
    assert.equal(
      fixture.manifest.fixture_version,
      OPERATOR_EXECUTION_FIXTURE_VERSION_V1,
    );
    result.fixture_version = fixture.manifest.fixture_version;
    result.fixture_fingerprint = fixture.manifest.fixture_fingerprint;
    result.fixture_source_database_sha256 =
      fixture.manifest.source_database_sha256;
    result.fixture_writable_seed_sha256 = fixture.manifest.writable_seed_sha256;
    result.effect_contract_version =
      fixture.manifest.permitted_effect_contract.effect_contract_version;
    result.default_database_isolated =
      path.resolve(fixture.writable_database_path) !==
        path.resolve(process.env.AUGNES_DB_PATH ?? "") &&
      path.resolve(fixture.writable_database_path) !==
        path.resolve(process.cwd(), "data", "augnes.db");
    assert.equal(result.default_database_isolated, true);
    const prepared = await prepare({
      fixture,
      temporary_root: roots.temporary_root,
      process_root: roots.process_root,
    });
    lifecycle = await createOperatorExecutionBrowserLifecycleV1({
      child_id,
      database_path: fixture.writable_database_path,
      manifest: fixture.manifest,
      project_id:
        prepared.project_id ??
        fixture.manifest.profile_project_id ??
        fixture.manifest.project_id,
      temp_root: roots.temporary_root,
      process_temp_root: roots.process_root,
      environment: prepared.environment ?? {},
    });
    lifecycle.recordFixtureConstruction(Date.now() - startedAt);
    beforeEffects = captureOperatorExecutionEffectSnapshotV1({
      database_path: fixture.writable_database_path,
      prepared,
    });
    result.before_effect_snapshot = exactEffectSummaryV1(beforeEffects);
    await lifecycle.start();
    await execute({
      contract,
      fixture,
      lifecycle,
      result,
      detailed_field_owner: completeDetailedField,
      semantic_marker_owner: record,
      prepared,
    });
    afterEffects = captureOperatorExecutionEffectSnapshotV1({
      database_path: fixture.writable_database_path,
      prepared,
    });
    const effectDiff = diffOperatorExecutionEffectSnapshotsV1(
      beforeEffects,
      afterEffects,
    );
    observedEffectDiff = effectDiff;
    result.effect_diff_version = effectDiff.diff_version;
    result.after_effect_snapshot = exactEffectSummaryV1(afterEffects);
    result.observed_effect_diff_fingerprint = effectDiff.diff_fingerprint;
    result.effect_operation_counts = effectDiff.operation_counts;
    result.effect_operation_counts_by_category =
      effectDiff.operation_counts_by_category;
    const exactEffectEvidence = assertOperatorExecutionEffectDiffV1({
      contract: fixture.manifest.permitted_effect_contract,
      manifest: fixture.manifest,
      result,
      before: beforeEffects,
      after: afterEffects,
      diff: effectDiff,
    });
    result.permitted_effect_diff_fingerprint =
      exactEffectEvidence.permitted_diff_fingerprint;
    result.unowned_effect_count = 0;
    functionalExecutionSucceeded = true;
  } catch (error) {
    if (observedEffectDiff) {
      result.effect_mismatch_material =
        boundedOperatorExecutionEffectDiffEntriesV1(observedEffectDiff);
    }
    if (beforeEffects && !afterEffects && fixture?.writable_database_path) {
      try {
        afterEffects = captureOperatorExecutionEffectSnapshotV1({
          database_path: fixture.writable_database_path,
          prepared: {},
        });
        const failedEffectDiff = diffOperatorExecutionEffectSnapshotsV1(
          beforeEffects,
          afterEffects,
        );
        result.effect_diff_version = failedEffectDiff.diff_version;
        result.after_effect_snapshot = exactEffectSummaryV1(afterEffects);
        result.observed_effect_diff_fingerprint =
          failedEffectDiff.diff_fingerprint;
        result.effect_operation_counts = failedEffectDiff.operation_counts;
        result.effect_operation_counts_by_category =
          failedEffectDiff.operation_counts_by_category;
        observedEffectDiff = failedEffectDiff;
        result.effect_mismatch_material =
          boundedOperatorExecutionEffectDiffEntriesV1(failedEffectDiff);
      } catch {
        // The bounded primary failure remains authoritative when snapshot capture
        // itself is no longer possible.
      }
    }
    result.unowned_effect_count ??= 1;
    result.failure = safeError(error, {
      phase: child_id,
      roots,
      repository_root: process.cwd(),
    });
    process.exitCode = 1;
  } finally {
    const cleanupStartedAt = Date.now();
    process.stdout.write(
      `[browser-e2e] cleanup_start scope=${child_id} owned_processes=${
        lifecycle ? "tracked" : "none"
      }\n`,
    );
    try {
      if (lifecycle) await lifecycle.cleanup();
      result.cleanup_complete = true;
    } catch (error) {
      if (!result.failure) {
        result.failure = safeError(error, {
          phase: "cleanup",
          roots,
          repository_root: process.cwd(),
        });
      }
      process.exitCode = 1;
    }
    try {
      if (lifecycle) {
        lifecycle.recordGlobalCleanup(Date.now() - cleanupStartedAt);
      }
    } catch (error) {
      if (!result.failure) {
        result.failure = safeError(error, {
          phase: "cleanup_timing",
          roots,
          repository_root: process.cwd(),
        });
      }
      process.exitCode = 1;
    }
    const evidence = lifecycle
      ? await lifecycle.evidence().catch(() => null)
      : null;
    result.owned_process_residue_count =
      evidence?.owned_process_residue_count ?? 0;
    result.listener_residue_count = evidence?.listener_residue_count ?? 0;
    result.owned_streams_settled = result.owned_process_residue_count === 0;
    result.runtime_shutdown_complete =
      evidence?.runtime_shutdown_complete ?? true;
    result.chrome_cdp_shutdown_complete =
      evidence?.chrome_cdp_shutdown_complete ?? true;
    result.temporary_root_removed = !existsSync(roots.temporary_root);
    result.temporary_process_root_removed = !existsSync(roots.process_root);
    result.temporary_profile_removed =
      evidence?.profile_removed ?? result.temporary_root_removed;
    result.temporary_database_removed = fixture
      ? !existsSync(fixture.writable_database_path)
      : result.temporary_root_removed;
    result.temporary_fixture_removed = !existsSync(fixtureRoot);
    result.temporary_signal_removed = result.temporary_root_removed;
    result.temporary_transport_removed = result.temporary_root_removed;
    result.completed_detailed_field_ids = fieldOwner.ids();
    result.completed_detailed_field_fingerprint = fieldOwner.fingerprint();
    result.semantic_marker_ids = markerOwner.ids();
    result.semantic_marker_fingerprint = markerOwner.fingerprint();
    const classifiedConsole = (evidence?.console_errors ?? []).map((entry) => {
      const response = evidence?.responses.find(
        (candidate) => candidate.request_id === entry.network_request_id,
      );
      return {
        ...entry,
        request_path: response?.path ?? null,
        response_status: response?.status ?? null,
        response_body_classification:
          response?.body_classification ?? null,
      };
    });
    const unexpectedConsole = classifiedConsole.filter(
      (entry) => !console_allowlist(entry),
    );
    const unexpectedFailedRequests = (evidence?.failed_requests ?? []).filter(
      (entry) => !request_failure_allowlist(entry),
    );
    result.unexpected_external_request_count =
      evidence?.external_requests.length ?? 0;
    result.unexpected_console_failure_count = unexpectedConsole.length;
    result.unexpected_page_failure_count = evidence?.page_errors.length ?? 0;
    result.unexpected_request_failure_count = unexpectedFailedRequests.length;
    if (observedEffectDiff) {
      const memoryPerspectiveMutations = ["inserted", "updated", "deleted"]
        .map(
          (operation) =>
            result.effect_operation_counts_by_category?.[operation]
              ?.memory_perspective ?? 0,
        )
        .reduce((total, count) => total + count, 0);
      result.forbidden_effect_zero_evidence = {
        provider_calls: 0,
        external_network_calls: result.unexpected_external_request_count,
        github_calls: 0,
        deployment_calls: 0,
        publication_calls: 0,
        memory_perspective_mutations: memoryPerspectiveMutations,
      };
    }
    const refusalAccounting = deriveRefusalAccountingResult(
      result,
      contract.fixture_profile,
    );
    result.unexpected_refusal_accounting_failure_count =
      refusalAccounting.failure_count;
    result.request_response_console_page_refusal_summary = {
      request_count: evidence?.requests.length ?? 0,
      response_count: evidence?.responses.length ?? 0,
      raw_console_failure_count: classifiedConsole.length,
      raw_console_warning_count: evidence?.console_warnings.length ?? 0,
      expected_console_classification_count:
        classifiedConsole.length - unexpectedConsole.length,
      page_failure_count: evidence?.page_errors.length ?? 0,
      request_failure_count: evidence?.failed_requests.length ?? 0,
      refusal_accounting_failure_count: refusalAccounting.failure_count,
      refusal_accounting: refusalAccounting.summary,
      unexpected_console_failures: unexpectedConsole
        .slice(0, 8)
        .map((entry) => publicDiagnostic(entry, roots)),
      unexpected_request_failures: unexpectedFailedRequests
        .slice(0, 8)
        .map((entry) => publicDiagnostic(entry, roots)),
    };
    result.e2e_timing_summary = evidence?.timing_summary ?? null;
    result.total_duration_ms = Date.now() - startedAt;
    result.reference_headroom_ms = Math.max(
      0,
      REFERENCE_BOUND_MS - result.total_duration_ms,
    );
    try {
      console_allowlist_finalize();
      assertOperatorExecutionFinalSuccessV1({
        result: JSON.parse(JSON.stringify(result)),
        contract,
        field_owner: fieldOwner,
        marker_owner: markerOwner,
        functional_execution_succeeded: functionalExecutionSucceeded,
      });
      result.ok = true;
    } catch (error) {
      result.ok = false;
      if (!result.failure) {
        result.failure = safeError(error, {
          phase: "final_gate",
          roots,
          repository_root: process.cwd(),
        });
      }
      process.exitCode = 1;
    }
    process.umask(originalUmask);
    process.stdout.write(
      `[browser-e2e] cleanup_result scope=${child_id} owned_processes=${result.owned_process_residue_count} listener_residue=${result.listener_residue_count}\n`,
    );
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  }
}

function deriveRefusalAccountingResult(result, fixtureProfile) {
  if (fixtureProfile !== "review_control") {
    return {
      failure_count: 0,
      summary: {
        contract: "no_refusal_profile.v1",
        profile: fixtureProfile,
        expected_refusal_deliveries: 0,
      },
    };
  }
  const summary = result.expected_refusal_accounting_summary;
  const tokens = Array.isArray(summary?.tokens) ? summary.tokens : [];
  const failures = [];
  if (summary?.raw_console_events_preserved !== true) {
    failures.push("raw_console_events_not_preserved");
  }
  if (!Array.isArray(summary?.duplicate_deliveries) || summary.duplicate_deliveries.length !== 0) {
    failures.push("duplicate_refusal_delivery");
  }
  if (tokens.length !== 1) failures.push("refusal_token_count_mismatch");
  for (const token of tokens) {
    if (
      token.refusal_status !== 403 ||
      token.refusal_response_count !== 1 ||
      token.refusal_log_count !== 1 ||
      token.authenticated_recovery_response_count !== 1 ||
      typeof token.refusal_request_id !== "string" ||
      typeof token.authenticated_request_id !== "string" ||
      token.refusal_request_id === token.authenticated_request_id
    ) {
      failures.push("refusal_delivery_identity_mismatch");
    }
  }
  return {
    failure_count: failures.length,
    summary: {
      contract: "observed_refusal_accounting.v1",
      expected_refusal_deliveries: 1,
      observed_refusal_deliveries: tokens.length,
      failure_codes: failures,
    },
  };
}

function safeError(error, { phase, roots, repository_root }) {
  const name = error instanceof Error ? error.name : "Error";
  const message = error instanceof Error ? error.message : "unknown_failure";
  return `${phase}:${name}:${message}`
    .replaceAll(roots.temporary_root, "<temporary-root>")
    .replaceAll(roots.process_root, "<process-root>")
    .replaceAll(repository_root, "<repository-root>")
    .replace(/[\r\n\t]/gu, " ")
    .slice(0, 500);
}

function publicDiagnostic(entry, roots) {
  return Object.fromEntries(
    Object.entries(entry).map(([key, value]) => [
      key,
      typeof value === "string"
        ? value
            .replaceAll(roots.temporary_root, "<temporary-root>")
            .replaceAll(roots.process_root, "<process-root>")
            .replace(/vnext_(?:bootstrap|session|action)_v01\.[A-Za-z0-9._-]+/gu, "<credential>")
            .replace(/(?:OPENAI_API_KEY|GITHUB_TOKEN|sk-[A-Za-z0-9_-]{8,}|ghp_[A-Za-z0-9_-]{8,})/gu, "<secret>")
            .slice(0, 240)
        : value,
    ]),
  );
}
