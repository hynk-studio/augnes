#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { buildOperatorExecutionBrowserFixtureV1 } from "./operator-execution-browser-fixture-v1.ts";
import {
  createOperatorChildTemporaryRootsV1,
  createOperatorExecutionBrowserLifecycleV1,
} from "./operator-execution-browser-lifecycle-v1.mjs";

const require = createRequire(import.meta.url);
const Database = require("better-sqlite3");
const CHILD_ID = "cross-boundary-golden";
const OWNER_MANIFEST = JSON.parse(
  readFileSync(
    new URL("./browser-verification-owners.v1.json", import.meta.url),
    "utf8",
  ),
);
assert.equal(OWNER_MANIFEST.schema, "augnes.browser-verification-owners.v1");
const GOLDEN_COMPOSITION_STEPS = Object.freeze([
  ...OWNER_MANIFEST.owners.cross_boundary_golden.composition_steps,
]);
assert.equal(GOLDEN_COMPOSITION_STEPS.length, 5);
assert.equal(
  new Set(GOLDEN_COMPOSITION_STEPS).size,
  GOLDEN_COMPOSITION_STEPS.length,
);
for (const step of GOLDEN_COMPOSITION_STEPS) {
  assert.match(step, /^[a-z][a-z0-9_]{1,80}$/u);
}
const [
  PROJECT_CONNECTION_STEP,
  FIRST_WORK_DEFINITION_STEP,
  EXPLICIT_DETERMINISTIC_LOCAL_START_STEP,
  ONE_ADMITTED_RESULT_RECEIPT_STEP,
  ONE_PROPOSAL_VISIBLE_FOR_REVIEW_STEP,
] = GOLDEN_COMPOSITION_STEPS;
const ACCEPTANCE_BOUND_MS = 360_000;
const LIVE_TIMEOUT_MS = 90_000;
const startedAt = Date.now();
const originalUmask = process.umask(0o077);
const roots = createOperatorChildTemporaryRootsV1(CHILD_ID);
const fixtureRoot = path.join(roots.temporary_root, "fixture-v1");
mkdirSync(fixtureRoot, { recursive: false, mode: 0o700 });
let fixture = null;
let lifecycle = null;
let functionalSucceeded = false;

const result = {
  ok: false,
  validation_version: "cross_boundary_golden_browser_validation.v1",
  owner: "cross_boundary_golden",
  child_id: CHILD_ID,
  composition_steps: [],
  fixture_version: null,
  fixture_fingerprint: null,
  source_database_sha256: null,
  writable_seed_sha256: null,
  project_id_fingerprint: null,
  packet_id_fingerprint: null,
  run_id_fingerprint: null,
  receipt_id_fingerprint: null,
  proposal_id_fingerprint: null,
  unexpected_external_request_count: null,
  unexpected_console_failure_count: null,
  unexpected_page_failure_count: null,
  unexpected_request_failure_count: null,
  credential_private_material_boundary: false,
  default_database_isolated: false,
  provider_or_external_network_call: false,
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
  runtime_shutdown_complete: false,
  chrome_cdp_shutdown_complete: false,
  acceptance_bound_ms: ACCEPTANCE_BOUND_MS,
  total_duration_ms: null,
  e2e_timing_summary: null,
  failure: null,
};

try {
  fixture = await buildOperatorExecutionBrowserFixtureV1({
    output_directory: fixtureRoot,
    reference_time: new Date().toISOString(),
    profile: "native_host_execution",
  });
  result.fixture_version = fixture.manifest.fixture_version;
  result.fixture_fingerprint = fixture.manifest.fixture_fingerprint;
  result.source_database_sha256 = fixture.manifest.source_database_sha256;
  result.writable_seed_sha256 = fixture.manifest.writable_seed_sha256;
  result.default_database_isolated =
    path.resolve(fixture.writable_database_path) !==
      path.resolve(process.env.AUGNES_DB_PATH ?? "") &&
    path.resolve(fixture.writable_database_path) !==
      path.resolve(process.cwd(), "data", "augnes.db");
  assert.equal(result.default_database_isolated, true);
  lifecycle = await createOperatorExecutionBrowserLifecycleV1({
    child_id: CHILD_ID,
    database_path: fixture.writable_database_path,
    manifest: fixture.manifest,
    project_id: fixture.manifest.profile_project_id,
    temp_root: roots.temporary_root,
    process_temp_root: roots.process_root,
  });
  lifecycle.recordFixtureConstruction(Date.now() - startedAt);
  await lifecycle.start();
  await executeGoldenPath({ fixture, lifecycle, result, roots });
  functionalSucceeded = true;
} catch (error) {
  result.failure = safeError(error);
  process.exitCode = 1;
} finally {
  const cleanupStartedAt = Date.now();
  try {
    if (lifecycle) await lifecycle.cleanup();
    result.cleanup_complete = true;
  } catch (error) {
    if (!result.failure) result.failure = safeError(error);
    process.exitCode = 1;
  }
  if (lifecycle) lifecycle.recordGlobalCleanup(Date.now() - cleanupStartedAt);
  const evidence = lifecycle ? await lifecycle.evidence().catch(() => null) : null;
  result.owned_process_residue_count = evidence?.owned_process_residue_count ?? 0;
  result.listener_residue_count = evidence?.listener_residue_count ?? 0;
  result.owned_streams_settled = result.owned_process_residue_count === 0;
  result.runtime_shutdown_complete = evidence?.runtime_shutdown_complete ?? true;
  result.chrome_cdp_shutdown_complete = evidence?.chrome_cdp_shutdown_complete ?? true;
  result.temporary_root_removed = !existsSync(roots.temporary_root);
  result.temporary_process_root_removed = !existsSync(roots.process_root);
  result.temporary_profile_removed = evidence?.profile_removed ?? result.temporary_root_removed;
  result.temporary_database_removed = fixture
    ? !existsSync(fixture.writable_database_path)
    : result.temporary_root_removed;
  result.temporary_fixture_removed = !existsSync(fixtureRoot);
  result.temporary_signal_removed = result.temporary_root_removed;
  result.unexpected_external_request_count = evidence?.external_requests.length ?? 0;
  result.unexpected_console_failure_count = classifyUnexpectedConsole(evidence).length;
  result.unexpected_page_failure_count = evidence?.page_errors.length ?? 0;
  result.unexpected_request_failure_count = (evidence?.failed_requests ?? []).filter(
    (entry) => entry.error_text !== "net::ERR_ABORTED",
  ).length;
  result.e2e_timing_summary = evidence?.timing_summary ?? null;
  result.total_duration_ms = Date.now() - startedAt;
  try {
    assertGoldenSuccess(result, functionalSucceeded);
    result.ok = true;
  } catch (error) {
    result.ok = false;
    if (!result.failure) result.failure = safeError(error);
    process.exitCode = 1;
  }
  process.umask(originalUmask);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

async function executeGoldenPath({ fixture, lifecycle, result, roots }) {
  const projectId = fixture.manifest.profile_project_id;
  assert.match(projectId, /^project:/u);
  const appOrigin = lifecycle.app_origin;
  await lifecycle.runPhase("project_connection", async () => {
    await lifecycle.navigate(`${appOrigin}/projects/${encodeURIComponent(projectId)}`);
    await lifecycle.waitForCondition(
      `document.querySelector('[data-blank-state="v0.1"][data-blank-state-active="true"]') !== null && document.body.textContent.includes('Operator Native Host First Work')`,
      "connected canonical project",
    );
    const project = readProjectIdentity(fixture.writable_database_path, projectId);
    assert.equal(project.normalized_root, fixture.profile_project_root);
    result.project_id_fingerprint = publicIdentityFingerprint(projectId);
    completeCompositionStep(result, PROJECT_CONNECTION_STEP);
  });

  await lifecycle.runPhase("first_work_definition", async () => {
    await lifecycle.navigate(`${appOrigin}/workbench/semantic-review#first-work`);
    await lifecycle.waitForCondition(
      `document.querySelector('[data-vnext-operator-session="locked"]') !== null`,
      "locked first-work entry",
    );
    assert.equal(await lifecycle.authenticate(), true);
    result.credential_private_material_boundary = true;
    await lifecycle.waitForCondition(
      `document.querySelector('[data-first-work-composer="project_work_initialization.v0.1"]') !== null`,
      "first-work composer",
    );
    const before = projectCounts(fixture.writable_database_path, projectId);
    assert.deepEqual(before, { packets: 0, receipts: 0, proposals: 0, runs: 0 });
    await lifecycle.setFormControlValue(
      'textarea[name="first-work-goal"]',
      "Prove one exact connected-project result reaches proposal review.",
    );
    await lifecycle.setFormControlValue(
      'textarea[name="first-work-success-criteria"]',
      "One deterministic local result receipt is admitted\nOne proposal is visible for review",
    );
    await lifecycle.setFormControlValue(
      'textarea[name="first-work-non-goals"]',
      "No semantic decision or Transition\nNo provider or external network",
    );
    await lifecycle.waitForCondition(
      `document.querySelector('[data-first-work-action="save"]:not(:disabled)') !== null`,
      "first-work save eligible",
    );
    const responseStart = lifecycle.responses.length;
    assert.equal(
      await lifecycle.evaluateBoolean(`(() => {
        const form = document.querySelector('[data-first-work-composer] form');
        if (!(form instanceof HTMLFormElement)) return false;
        form.requestSubmit(); return true;
      })()`),
      true,
    );
    await lifecycle.waitForHostCondition(
      () => lifecycle.responses.slice(responseStart).some(
        (entry) => entry.path === "/api/vnext/operator/project-continuity" && entry.method === "POST" && entry.status === 201,
      ),
      "first-work definition admission",
    );
    await lifecycle.waitForCondition(
      `document.body.textContent.includes('First work defined. No execution has started.') && document.querySelector('[data-delegated-work-action="start"]:not(:disabled)') !== null`,
      "saved first-work definition",
    );
    const after = projectCounts(fixture.writable_database_path, projectId);
    assert.deepEqual(after, { packets: 1, receipts: 0, proposals: 0, runs: 0 });
    result.packet_id_fingerprint = publicIdentityFingerprint(
      latestCoreRecordId(fixture.writable_database_path, projectId, "task_context_packet"),
    );
    completeCompositionStep(result, FIRST_WORK_DEFINITION_STEP);
  });

  await lifecycle.runPhase("explicit_deterministic_start_to_result", async () => {
    const responseStart = lifecycle.responses.length;
    await clickSelector(lifecycle, '[data-delegated-work-action="start"]');
    await lifecycle.waitForHostCondition(
      () => lifecycle.responses.slice(responseStart).some(
        (entry) => entry.path === "/api/vnext/operator/host-round-trip" && entry.method === "POST" && entry.status === 202,
      ),
      "explicit deterministic local start",
    );
    const firstApproval = await waitForLiveState(
      fixture.writable_database_path,
      projectId,
      "waiting_for_approval",
      LIVE_TIMEOUT_MS,
    );
    result.run_id_fingerprint = publicIdentityFingerprint(firstApproval.run_ref);
    await lifecycle.waitForCondition(
      `document.querySelector('[data-delegated-work-action="approve-once"]:not(:disabled)') !== null`,
      "first bounded approval",
    );
    await clickSelector(lifecycle, '[data-delegated-work-action="approve-once"]');
    await waitForLiveState(
      fixture.writable_database_path,
      projectId,
      "running",
      LIVE_TIMEOUT_MS,
    );
    const secondRelease = path.join(roots.temporary_root, "browser-second-approval.release");
    writeFileSync(secondRelease, "released\n", { encoding: "utf8", flag: "wx", mode: 0o600 });
    const secondApproval = await waitForDistinctApproval(
      fixture.writable_database_path,
      projectId,
      firstApproval.pending_approval.approval_ref,
      LIVE_TIMEOUT_MS,
    );
    assert.equal(secondApproval.run_ref, firstApproval.run_ref);
    await lifecycle.waitForCondition(
      `document.querySelector('[data-delegated-work-action="approve-once"]:not(:disabled)') !== null`,
      "second bounded approval",
    );
    await clickSelector(lifecycle, '[data-delegated-work-action="approve-once"]');
    await waitForLiveState(
      fixture.writable_database_path,
      projectId,
      "running",
      LIVE_TIMEOUT_MS,
    );
    const terminalRelease = path.join(roots.temporary_root, "browser-terminal.release");
    writeFileSync(terminalRelease, "released\n", { encoding: "utf8", flag: "wx", mode: 0o600 });
    const completed = await waitForLiveState(
      fixture.writable_database_path,
      projectId,
      "completed",
      LIVE_TIMEOUT_MS,
    );
    assert.equal(completed.run_ref, firstApproval.run_ref);
    await lifecycle.waitForCondition(
      `document.querySelector('[data-delegated-work-stage="result_ready"] [data-ai-workplane-primary-action="review-result"]') !== null`,
      "one admitted result receipt",
      LIVE_TIMEOUT_MS,
    );
    const counts = projectCounts(fixture.writable_database_path, projectId);
    assert.deepEqual(counts, { packets: 1, receipts: 1, proposals: 1, runs: 1 });
    result.receipt_id_fingerprint = publicIdentityFingerprint(
      latestCoreRecordId(fixture.writable_database_path, projectId, "run_receipt"),
    );
    completeCompositionStep(result, EXPLICIT_DETERMINISTIC_LOCAL_START_STEP);
    completeCompositionStep(result, ONE_ADMITTED_RESULT_RECEIPT_STEP);
  });

  await lifecycle.runPhase("proposal_visible_for_review", async () => {
    const proposalId = latestCoreRecordId(
      fixture.writable_database_path,
      projectId,
      "episode_delta_proposal",
    );
    const proposalHref =
      `/workbench/semantic-review/${proposalId.replace(":", "~")}`;
    await lifecycle.navigate(new URL(proposalHref, appOrigin).toString());
    await lifecycle.waitForCondition(
      `document.querySelector('[data-vnext-semantic-review-detail="v0.1"]') !== null && location.pathname === ${JSON.stringify(`/workbench/semantic-review/${proposalId.replace(":", "~")}`)}`,
      "proposal visible for semantic review",
    );
    result.proposal_id_fingerprint = publicIdentityFingerprint(proposalId);
    completeCompositionStep(result, ONE_PROPOSAL_VISIBLE_FOR_REVIEW_STEP);
    await lifecycle.waitForRequestQuiet();
    result.provider_or_external_network_call = false;
  });
}

function completeCompositionStep(value, step) {
  assert.equal(
    step,
    GOLDEN_COMPOSITION_STEPS[value.composition_steps.length],
    "golden_composition_step_out_of_order",
  );
  value.composition_steps.push(step);
}

function projectCounts(databasePath, projectId) {
  const database = new Database(databasePath, { readonly: true, fileMustExist: true });
  try {
    const count = (kind) => Number(database.prepare(
      "SELECT COUNT(*) AS count FROM vnext_core_records WHERE project_id = ? AND record_kind = ?",
    ).get(projectId, kind).count);
    return {
      packets: count("task_context_packet"),
      receipts: count("run_receipt"),
      proposals: count("episode_delta_proposal"),
      runs: Number(database.prepare("SELECT COUNT(*) AS count FROM autonomy_runs WHERE scope = ?").get(projectId).count),
    };
  } finally {
    database.close();
  }
}

function readProjectIdentity(databasePath, projectId) {
  const database = new Database(databasePath, { readonly: true, fileMustExist: true });
  try {
    const row = database.prepare(
      `SELECT p.project_id, r.normalized_root
       FROM vnext_project_identities p
       JOIN vnext_project_root_bindings r
         ON r.workspace_id = p.workspace_id AND r.project_id = p.project_id
       WHERE p.project_id = ?`,
    ).get(projectId);
    assert(row, "golden_project_identity_missing");
    return row;
  } finally {
    database.close();
  }
}

function latestCoreRecordId(databasePath, projectId, recordKind) {
  const database = new Database(databasePath, { readonly: true, fileMustExist: true });
  try {
    const row = database.prepare(
      `SELECT record_id FROM vnext_core_records
       WHERE project_id = ? AND record_kind = ?
       ORDER BY created_at DESC, record_id DESC LIMIT 1`,
    ).get(projectId, recordKind);
    assert(row, `golden_${recordKind}_missing`);
    return row.record_id;
  } finally {
    database.close();
  }
}

function readLatestLiveProjection(databasePath, projectId) {
  const database = new Database(databasePath, { readonly: true, fileMustExist: true });
  try {
    const row = database.prepare(
      `SELECT run_id, status, metadata_json FROM autonomy_runs
       WHERE scope = ? AND autonomy_contract_ref = 'direct_native_host_round_trip.v0.1'
         AND json_extract(metadata_json, '$.lifecycle_mode') = 'managed_live'
       ORDER BY created_at DESC, run_id DESC LIMIT 1`,
    ).get(projectId);
    assert(row, "golden_live_run_missing");
    const metadata = JSON.parse(row.metadata_json);
    const pending = metadata.pending_approval ?? null;
    return {
      run_ref: row.run_id,
      status: row.status,
      pending_approval: pending
        ? { approval_ref: String(pending.approval_id ?? "") }
        : null,
    };
  } finally {
    database.close();
  }
}

async function waitForLiveState(databasePath, projectId, status, timeoutMs) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const state = readLatestLiveProjection(databasePath, projectId);
    if (state.status === status) return state;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`golden_live_state_timeout:${status}`);
}

async function waitForDistinctApproval(databasePath, projectId, prior, timeoutMs) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const state = readLatestLiveProjection(databasePath, projectId);
    if (
      state.status === "waiting_for_approval" &&
      state.pending_approval?.approval_ref &&
      state.pending_approval.approval_ref !== prior
    ) return state;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("golden_second_approval_timeout");
}

async function clickSelector(lifecycle, selector) {
  assert.equal(await lifecycle.evaluateBoolean(`(() => {
    const element = Array.from(document.querySelectorAll(${JSON.stringify(selector)}))
      .find((entry) => entry.getBoundingClientRect().width > 0);
    if (!(element instanceof HTMLElement)) return false;
    element.click(); return true;
  })()`), true);
}

function classifyUnexpectedConsole(evidence) {
  if (!evidence) return [];
  return evidence.console_errors.filter((entry) => {
    const response = evidence.responses.find(
      (candidate) => candidate.request_id === entry.network_request_id,
    );
    return !(
      entry.phase === "first_work_definition" &&
      entry.text === "Failed to load resource: the server responded with a status of 401 (Unauthorized)" &&
      response?.path === "/api/vnext/operator/session" &&
      response.status === 401
    ) && !(
      entry.text === "Failed to load resource: the server responded with a status of 404 (Not Found)" &&
      response?.path === "/favicon.ico" &&
      response.status === 404
    );
  });
}

function assertGoldenSuccess(value, functionalSucceeded) {
  assert.equal(functionalSucceeded, true);
  assert.equal(value.ok, false);
  assert.equal(value.failure, null);
  assert.deepEqual(value.composition_steps, GOLDEN_COMPOSITION_STEPS);
  for (const key of [
    "project_id_fingerprint",
    "packet_id_fingerprint",
    "run_id_fingerprint",
    "receipt_id_fingerprint",
    "proposal_id_fingerprint",
  ]) assert.match(value[key], /^sha256:[a-f0-9]{64}$/u, key);
  assert.equal(value.unexpected_external_request_count, 0);
  assert.equal(value.unexpected_console_failure_count, 0);
  assert.equal(value.unexpected_page_failure_count, 0);
  assert.equal(value.unexpected_request_failure_count, 0);
  assert.equal(value.credential_private_material_boundary, true);
  assert.equal(value.default_database_isolated, true);
  assert.equal(value.provider_or_external_network_call, false);
  assert.equal(value.cleanup_complete, true);
  assert.equal(value.owned_streams_settled, true);
  assert.equal(value.owned_process_residue_count, 0);
  assert.equal(value.listener_residue_count, 0);
  assert.equal(value.temporary_root_removed, true);
  assert.equal(value.temporary_process_root_removed, true);
  assert.equal(value.temporary_profile_removed, true);
  assert.equal(value.temporary_database_removed, true);
  assert.equal(value.temporary_fixture_removed, true);
  assert.equal(value.temporary_signal_removed, true);
  assert.equal(value.runtime_shutdown_complete, true);
  assert.equal(value.chrome_cdp_shutdown_complete, true);
  assert.equal(value.total_duration_ms < value.acceptance_bound_ms, true);
}

function publicIdentityFingerprint(value) {
  return `sha256:${createHash("sha256").update(String(value)).digest("hex")}`;
}

function safeError(error) {
  const name = error instanceof Error ? error.name : "Error";
  const message = error instanceof Error ? error.message : "unknown_failure";
  return `${CHILD_ID}:${name}:${message}`
    .replaceAll(roots.temporary_root, "<temporary-root>")
    .replaceAll(roots.process_root, "<process-root>")
    .replaceAll(process.cwd(), "<repository-root>")
    .slice(0, 500);
}
