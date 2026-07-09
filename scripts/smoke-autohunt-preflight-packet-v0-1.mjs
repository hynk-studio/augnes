#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import Database from "better-sqlite3";

import {
  assertPackageScript,
  getBaseRangeChangedFiles,
  uniqueSorted,
} from "./smoke-boundary-common.mjs";
import {
  writeAutonomyDelegationGrant,
} from "../lib/autonomy/autonomy-delegation-grant-write.ts";
import {
  buildAutonomyDelegationGrantAuthorityBoundary,
  ensureAutonomyDelegationGrantSchema,
} from "../lib/autonomy/read-autonomy-delegation-grants.ts";
import {
  writeAutohuntWorkQueueCandidate,
} from "../lib/autonomy/autohunt-work-queue-candidate-write.ts";
import {
  ensureAutohuntWorkQueueCandidateSchema,
  readAutohuntWorkQueueCandidates,
} from "../lib/autonomy/read-autohunt-work-queue-candidates.ts";
import {
  writeAutohuntPreflightPacket,
} from "../lib/autonomy/autohunt-preflight-packet-write.ts";
import {
  buildAutohuntPreflightPacketAuthorityBoundary,
  computeAutohuntPreflightPacketFingerprint,
  ensureAutohuntPreflightPacketSchema,
  readAutohuntPreflightPackets,
} from "../lib/autonomy/read-autohunt-preflight-packets.ts";
import {
  AUTONOMY_DELEGATION_GRANT_ALLOWED_ACTIONS,
  AUTONOMY_DELEGATION_GRANT_ALLOWED_OUTPUTS,
  AUTONOMY_DELEGATION_GRANT_ALLOWED_WORK_CLASSES,
  AUTONOMY_DELEGATION_GRANT_FORBIDDEN_ACTIONS,
  AUTONOMY_DELEGATION_GRANT_FORBIDDEN_OUTPUTS,
  AUTONOMY_DELEGATION_GRANT_FORBIDDEN_WORK_CLASSES,
  AUTONOMY_DELEGATION_GRANT_STOP_CONDITIONS,
  AUTONOMY_DELEGATION_GRANT_TABLE,
} from "../types/autonomy-delegation-grant.ts";
import {
  AUTOHUNT_WORK_QUEUE_CANDIDATE_TABLE,
} from "../types/autohunt-work-queue-candidate.ts";
import {
  AUTOHUNT_PREFLIGHT_PACKET_AUTHORITY_FLAG_NAMES,
  AUTOHUNT_PREFLIGHT_PACKET_TABLE,
} from "../types/autohunt-preflight-packet.ts";
import { RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_DRY_RUN_PROTECTED_ROW_COUNT_TABLES } from "../types/research-candidate-manual-global-dogfood-perspective-existing-writer-dry-run-result.ts";

const files = {
  type: "types/autohunt-preflight-packet.ts",
  writer: "lib/autonomy/autohunt-preflight-packet-write.ts",
  reader: "lib/autonomy/read-autohunt-preflight-packets.ts",
  panel: "components/autonomy/autohunt-preflight-packet-readback-panel.tsx",
  workbenchSpineType: "types/autohunt-workbench-readback-spine.ts",
  workbenchSpineBuilder:
    "lib/autonomy/autohunt-workbench-readback-spine.ts",
  workbenchSpinePanel:
    "components/autonomy/autohunt-workbench-readback-spine-panel.tsx",
  handoffPlanType: "types/autohunt-handoff-plan-preview.ts",
  handoffPlanWriter: "lib/autonomy/autohunt-handoff-plan-preview-write.ts",
  handoffPlanReader: "lib/autonomy/read-autohunt-handoff-plan-previews.ts",
  handoffPlanPanel:
    "components/autonomy/autohunt-handoff-plan-preview-readback-panel.tsx",
  agentWorkplane: "components/workplane/agent-workplane.tsx",
  db: "lib/db.ts",
  schema: "lib/db/schema.sql",
  migrations: "scripts/db-migrations.mjs",
  migrate: "scripts/db-migrate.mjs",
  smoke: "scripts/smoke-autohunt-preflight-packet-v0-1.mjs",
  workbenchSpineSmoke:
    "scripts/smoke-autohunt-workbench-readback-spine-v0-1.mjs",
  handoffPlanSmoke:
    "scripts/smoke-autohunt-handoff-plan-preview-v0-1.mjs",
  handoffPlanWorkbenchMountSmoke:
    "scripts/smoke-autohunt-handoff-plan-preview-workbench-mount-v0-1.mjs",
  packageJson: "package.json",
  queueCandidateSmoke: "scripts/smoke-autohunt-work-queue-candidate-v0-1.mjs",
  delegationGrantSmoke:
    "scripts/smoke-autonomy-delegation-grant-record-v0-1.mjs",
  sharedSourceGuardSmoke: "scripts/smoke-shared-source-chain-guards-v0-1.mjs",
  agentWorkplanePanelsSmoke: "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  autonomyContractSmoke: "scripts/smoke-autonomy-contract-v0-1.mjs",
  autonomyRunnerPreflightSmoke:
    "scripts/smoke-autonomy-runner-preflight-v0-1.mjs",
};

const expectedChangedFiles = new Set(Object.values(files));
const source = Object.fromEntries(
  Object.entries(files).map(([key, filePath]) => {
    assert(existsSync(filePath), `${filePath} must exist`);
    return [key, readFileSync(filePath, "utf8")];
  }),
);

assertChangedFileBoundary();
assertTypeAndHelperFiles();
assertDbSchemaAndMigration();
assertPackageScriptWiring();
assertWriteReadBehavior();
assertPanelPassive();
assertForbiddenImportsAbsent();

console.log(
  JSON.stringify(
    {
      smoke: "autohunt-preflight-packet-v0-1",
      pass: true,
      target_table: AUTOHUNT_PREFLIGHT_PACKET_TABLE,
      expected_changed_files_checked: true,
      docs_changed: false,
      write_helper_checked: true,
      readback_helper_checked: true,
      panel_passive_checked: true,
      target_only_write_checked: true,
      duplicate_replay_checked: true,
      grant_candidate_refusals_checked: true,
      unsafe_input_refusals_checked: true,
      latest_ready_readback_checked: true,
      no_runner_or_external_authority_checked: true,
      raw_material_persistence_checked: true,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:autohunt-preflight-packet-v0-1");

function assertChangedFileBoundary() {
  const changedFiles = uniqueSorted([
    ...collectGitFiles(["diff", "--name-only"]),
    ...collectGitFiles(["diff", "--cached", "--name-only"]),
    ...collectGitFiles(["ls-files", "--others", "--exclude-standard"]),
    ...getBaseRangeChangedFiles().files,
  ]);

  for (const file of changedFiles) {
    assert(
      expectedChangedFiles.has(file),
      `Unexpected changed file for autohunt preflight packet slice: ${file}`,
    );
    assert.doesNotMatch(file, /^docs\//, "preflight packet slice must not edit docs");
    assert.doesNotMatch(file, /^README/i, "preflight packet slice must not edit README");
    assert.doesNotMatch(file, /^app\/api\//, "preflight packet slice must not edit routes");
    assert.doesNotMatch(file, /^app\//, "preflight packet slice must not edit app surfaces");
    assert.doesNotMatch(file, /package-lock|pnpm-lock|yarn\.lock/, "package lock must not change");
  }
}

function assertTypeAndHelperFiles() {
  assertContains(source.type, [
    "AUTOHUNT_PREFLIGHT_PACKET_KIND",
    "AUTOHUNT_PREFLIGHT_PACKET_VERSION",
    "AUTOHUNT_PREFLIGHT_PACKET_TABLE",
    "ready_for_supervised_handoff_planning",
    "source_grant",
    "source_queue_readback",
    "selected_candidates",
    "aggregate_budget_projection",
    "grant_budget_remaining_projection",
    "preflight_checks",
    "authority_boundary",
    "persisted_material_boundary",
    "preflight_packet_fingerprint",
  ], files.type);
  assertContains(source.writer, [
    "writeAutohuntPreflightPacket",
    "validateAutohuntPreflightPacketInput",
    "buildDeterministicIdempotencyKey",
    "findForbiddenRawMaterialFields",
    "containsForbiddenRawMaterial",
    "assertAllFalseBoundary",
    "requiredStringFieldsPresent",
    "validateSourceBindingPairs",
    "summarizeTargetOnlyRowCountWrite",
    "BEGIN IMMEDIATE",
    "target_only_autohunt_preflight_packet_row_count_proof_failed",
  ], files.writer);
  assertContains(source.reader, [
    "readAutohuntPreflightPackets",
    "ensureAutohuntPreflightPacketSchema",
    "computeAutohuntPreflightPacketFingerprint",
    "latest_ready_preflight_packet",
    "blocked_preflight_packets",
    "insufficient_data_preflight_packets",
    "no_queued_candidates_preflight_packets",
    "no_run_no_execution_boundary",
  ], files.reader);
  assertContains(source.panel, [
    "AutohuntPreflightPacketReadbackPanel",
    "selected packet",
    "budget projection",
    "preflight checks",
    "candidate policy",
    "authority boundary",
    "material boundary",
    "row-count summary",
  ], files.panel);
}

function assertDbSchemaAndMigration() {
  for (const [label, text] of [
    [files.schema, source.schema],
    [files.db, source.db],
    [files.migrations, source.migrations],
    [files.migrate, source.migrate],
    [files.reader, source.reader],
  ]) {
    assert(text.includes("autohunt_preflight_packets"), `${label} must wire target table`);
  }

  const db = new Database(":memory:");
  try {
    ensureAutohuntPreflightPacketSchema(db);
    const columns = db.prepare("PRAGMA table_info(autohunt_preflight_packets)").all();
    const columnNames = columns.map((column) => column.name);
    assert.deepEqual(columnNames, [
      "preflight_packet_id",
      "created_at",
      "scope",
      "preflight_status",
      "source_grant_id",
      "source_grant_fingerprint",
      "source_grant_status",
      "source_grant_mode",
      "selected_candidate_ids_json",
      "selected_candidate_fingerprints_json",
      "idempotency_key",
      "source_queue_readback_json",
      "selected_candidates_json",
      "aggregate_budget_projection_json",
      "grant_budget_remaining_projection_json",
      "preflight_checks_json",
      "blocked_actions_json",
      "stop_conditions_json",
      "required_checks_json",
      "next_allowed_outputs_json",
      "forbidden_outputs_json",
      "authority_boundary_json",
      "persisted_material_boundary_json",
      "validation_json",
      "row_count_write_summary_json",
      "preflight_packet_fingerprint",
    ]);
    for (const columnName of columnNames) {
      assert.doesNotMatch(columnName, /^raw/i, "raw columns must not exist");
      assert.doesNotMatch(columnName, /raw_prompt/i);
      assert.doesNotMatch(columnName, /operator_note/i);
      assert.doesNotMatch(columnName, /source_payload/i);
      assert.doesNotMatch(columnName, /\btoken\b/i);
      assert.doesNotMatch(columnName, /\bsecret\b/i);
      assert.doesNotMatch(columnName, /\burl\b/i);
      assert.doesNotMatch(columnName, /\benv\b/i);
      assert.doesNotMatch(columnName, /credential/i);
    }
    const indexes = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'autohunt_preflight_packets'",
      )
      .all()
      .map((index) => index.name);
    for (const indexName of [
      "idx_autohunt_preflight_packets_scope_created",
      "idx_autohunt_preflight_packets_source_grant_id_created",
      "idx_autohunt_preflight_packets_source_grant_fingerprint_created",
      "idx_autohunt_preflight_packets_preflight_status_created",
    ]) {
      assert(indexes.includes(indexName), `${indexName} must exist`);
    }
  } finally {
    db.close();
  }
}

function assertPackageScriptWiring() {
  assertPackageScript({
    packageJsonText: source.packageJson,
    scriptName: "smoke:autohunt-preflight-packet-v0-1",
    expectedCommand:
      "tsx --tsconfig tsconfig.json scripts/smoke-autohunt-preflight-packet-v0-1.mjs",
  });
}

function assertWriteReadBehavior() {
  const db = new Database(":memory:");
  try {
    ensureAutonomyDelegationGrantSchema(db);
    ensureAutohuntWorkQueueCandidateSchema(db);
    ensureAutohuntPreflightPacketSchema(db);
    const activeGrant = writeGrant(db, "active", "approval:preflight-active").grant;
    assert(activeGrant, "active grant must write");
    const queuedCandidate = writeCandidate(db, activeGrant, {
      title: "Ready preflight candidate",
      source_fingerprints: ["fnv1a32_canonical_json_v0_1:preflight001"],
    }).candidate;
    assert(queuedCandidate, "queued candidate must write");
    const queueReadback = readAutohuntWorkQueueCandidates({
      db,
      source_grant_id: activeGrant.grant_id,
      candidate_status: "queued",
    });

    const beforeTarget = countRows(db, AUTOHUNT_PREFLIGHT_PACKET_TABLE);
    const beforeGrant = countRows(db, AUTONOMY_DELEGATION_GRANT_TABLE);
    const beforeQueue = countRows(db, AUTOHUNT_WORK_QUEUE_CANDIDATE_TABLE);
    const accepted = writeAutohuntPreflightPacket(
      makePreflightInput(activeGrant, queueReadback),
      {
        db,
        now: "2026-07-09T01:20:00.000Z",
      },
    );
    assert.equal(
      accepted.result_status,
      "written",
      JSON.stringify(accepted.refusal_reasons),
    );
    assert.equal(accepted.ok, true);
    assert.equal(
      accepted.preflight_packet?.preflight_status,
      "ready_for_supervised_handoff_planning",
    );
    assert.equal(accepted.preflight_packet_record_written, true);
    assert.equal(countRows(db, AUTOHUNT_PREFLIGHT_PACKET_TABLE), beforeTarget + 1);
    assert.equal(countRows(db, AUTONOMY_DELEGATION_GRANT_TABLE), beforeGrant);
    assert.equal(countRows(db, AUTOHUNT_WORK_QUEUE_CANDIDATE_TABLE), beforeQueue);
    assert.equal(accepted.row_count_write_summary?.target_delta, 1);
    assert.equal(
      accepted.row_count_write_summary?.target_delta_matches_expected,
      true,
    );
    assert.equal(
      accepted.row_count_write_summary?.all_non_target_row_counts_unchanged,
      true,
    );
    assert.equal(
      accepted.row_count_write_summary?.non_target_changed_table_count,
      0,
    );
    assertRowCountSummaryIncludesProtectedTables(
      accepted.row_count_write_summary,
    );
    assertNoAuthority(accepted);
    assertNoPacketAuthority(accepted.preflight_packet);

    const duplicate = writeAutohuntPreflightPacket(
      makePreflightInput(activeGrant, queueReadback),
      {
        db,
        now: "2026-07-09T01:21:00.000Z",
      },
    );
    assert.equal(duplicate.result_status, "duplicate_replayed");
    assert.equal(duplicate.duplicate_replayed, true);
    assert.equal(duplicate.preflight_packet_record_written, false);
    assert.equal(countRows(db, AUTOHUNT_PREFLIGHT_PACKET_TABLE), beforeTarget + 1);

    assertRefused(db, { source_grant: null });
    const pausedGrant = writeGrant(db, "paused", "approval:preflight-paused").grant;
    const revokedGrant = writeGrant(db, "revoked", "approval:preflight-revoked").grant;
    assertRefused(db, { source_grant: pausedGrant });
    assertRefused(db, { source_grant: revokedGrant });
    assertRefused(db, {
      source_grant: {
        ...activeGrant,
        grant_fingerprint: "fnv1a32_canonical_json_v0_1:tampered",
      },
    });
    assertRefused(db, { source_queue: [] });
    assertRefused(db, {
      source_queue: [
        {
          ...queuedCandidate,
          candidate_fingerprint: "fnv1a32_canonical_json_v0_1:badc0de0",
        },
      ],
    });
    assertRefused(db, {
      source_queue: [
        {
          ...queuedCandidate,
          source_grant: {
            ...queuedCandidate.source_grant,
            grant_id: "autonomy-delegation-grant:mismatch",
          },
        },
      ],
    });
    assertRefused(db, {
      source_queue: [{ ...queuedCandidate, candidate_status: "blocked" }],
    });
    assertRefused(db, {
      source_queue: [
        {
          ...queuedCandidate,
          grant_fit: { ...queuedCandidate.grant_fit, passed: false },
        },
      ],
    });
    const aggregateOverBudgetCandidate = writeCandidate(db, activeGrant, {
      title: "Aggregate over budget candidate",
      source_fingerprints: ["fnv1a32_canonical_json_v0_1:preflight002"],
      budget_projection: { estimated_iterations: 2 },
    }).candidate;
    assertRefused(db, {
      source_queue: [queuedCandidate, aggregateOverBudgetCandidate],
    });
    const missingChecksCandidate = writeCandidate(db, activeGrant, {
      title: "Missing checks candidate",
      source_fingerprints: ["fnv1a32_canonical_json_v0_1:preflight003"],
      required_checks: [],
    }).candidate;
    assertRefused(db, { source_queue: [missingChecksCandidate] });
    assertRefused(db, {
      source_queue: [
        {
          ...queuedCandidate,
          stop_conditions: queuedCandidate.stop_conditions.filter(
            (condition) => condition !== "manual_stop_requested",
          ),
        },
      ],
    });
    assertRefused(db, {
      source_queue: [
        {
          ...queuedCandidate,
          stop_conditions: queuedCandidate.stop_conditions.filter(
            (condition) => condition !== "authority_boundary_unclear",
          ),
        },
      ],
    });
    const forbiddenActionCandidate = writeCandidate(db, activeGrant, {
      title: "Forbidden action candidate",
      source_fingerprints: ["fnv1a32_canonical_json_v0_1:preflight004"],
      blocked_actions: ["start_runner"],
    }).candidate;
    assertRefused(db, { source_queue: [forbiddenActionCandidate] });
    assertRefused(db, { raw_prompt: "prompt body" });
    assertRefused(db, { raw_source_payload: "source body" });
    assertRefused(db, { operator_note_body: "operator note body" });
    assertRefused(db, { token: "token=value" });
    assertRefused(db, { secret: "secret=value" });
    assertRefused(db, { callback_url: "https://example.invalid/source" });
    assertRefused(db, { env: "OPENAI_API_KEY=sk-not-real-value" });
    assertRefused(db, { candidate_input: { api_key: "sk-not-real-value" } });

    const secondReadyCandidate = writeCandidate(db, activeGrant, {
      title: "Second ready preflight candidate",
      source_fingerprints: ["fnv1a32_canonical_json_v0_1:preflight005"],
    }).candidate;
    const secondReady = writeAutohuntPreflightPacket(
      makePreflightInput(activeGrant, [secondReadyCandidate]),
      {
        db,
        now: "2026-07-09T01:22:00.000Z",
      },
    );
    assert.equal(secondReady.ok, true);

    const readback = readAutohuntPreflightPackets({ db });
    assert.equal(
      readback.selection_status,
      "selected_latest_ready_preflight_packet",
    );
    assert.equal(readback.ready_preflight_packets.length, 2);
    assert.equal(readback.invalid_record_count, 0);
    assert.equal(
      readback.selected_preflight_packet?.preflight_packet_id,
      secondReady.preflight_packet?.preflight_packet_id,
    );
    assert.equal(
      readback.selected_preflight_packet?.preflight_packet_fingerprint,
      computeAutohuntPreflightPacketFingerprint(
        readback.selected_preflight_packet,
      ),
    );
    assertNoReadbackAuthority(readback);

    const byId = readAutohuntPreflightPackets({
      db,
      preflight_packet_id: accepted.preflight_packet?.preflight_packet_id,
    });
    assert.equal(byId.selection_status, "selected_by_preflight_packet_id");
    assert.equal(
      byId.selected_preflight_packet?.preflight_packet_id,
      accepted.preflight_packet?.preflight_packet_id,
    );

    const byCandidate = readAutohuntPreflightPackets({
      db,
      candidate_id: queuedCandidate.candidate_id,
    });
    assert.equal(byCandidate.ready_preflight_packets.length, 1);
    assert.equal(
      byCandidate.selected_preflight_packet?.preflight_packet_id,
      accepted.preflight_packet?.preflight_packet_id,
    );
  } finally {
    db.close();
  }

  const tamperDb = new Database(":memory:");
  try {
    ensureAutonomyDelegationGrantSchema(tamperDb);
    ensureAutohuntWorkQueueCandidateSchema(tamperDb);
    ensureAutohuntPreflightPacketSchema(tamperDb);
    const activeGrant = writeGrant(
      tamperDb,
      "active",
      "approval:preflight-active-tamper",
    ).grant;
    const queuedCandidate = writeCandidate(tamperDb, activeGrant, {
      title: "Tamper candidate",
      source_fingerprints: ["fnv1a32_canonical_json_v0_1:preflight099"],
    }).candidate;
    const result = writeAutohuntPreflightPacket(
      makePreflightInput(activeGrant, [queuedCandidate]),
      {
        db: tamperDb,
        now: "2026-07-09T01:20:00.000Z",
      },
    );
    assert.equal(result.ok, true);
    tamperDb
      .prepare(
        "UPDATE autohunt_preflight_packets SET preflight_packet_fingerprint = ? WHERE preflight_packet_id = ?",
      )
      .run("tampered", result.preflight_packet?.preflight_packet_id);
    const tamperedReadback = readAutohuntPreflightPackets({ db: tamperDb });
    assert.equal(tamperedReadback.invalid_record_count, 1);
    assert.equal(tamperedReadback.selected_preflight_packet, null);
  } finally {
    tamperDb.close();
  }
}

function assertPanelPassive() {
  assert.doesNotMatch(source.panel, /<button\b/i);
  assert.doesNotMatch(source.panel, /\bonClick\b/);
  assert.doesNotMatch(source.panel, /\bfetch\s*\(/);
  assert.doesNotMatch(source.panel, /\bformAction\b/);
  assert.doesNotMatch(source.panel, /server action/i);
  assert.doesNotMatch(source.panel, /use server/i);
}

function assertForbiddenImportsAbsent() {
  for (const [label, text] of Object.entries({
    [files.type]: source.type,
    [files.writer]: source.writer,
    [files.reader]: source.reader,
    [files.panel]: source.panel,
  })) {
    const importLines = text
      .split("\n")
      .filter((line) => line.trim().startsWith("import "));
    const imports = importLines.join("\n");
    assert.doesNotMatch(imports, /from\s+["'][^"']*(openai|provider|github|octokit|codex)[^"']*["']/i, `${label} must not import provider/GitHub/Codex code`);
    assert.doesNotMatch(imports, /from\s+["'][^"']*(retrieval|rag|embedding|vector|crawler|source-fetch)[^"']*["']/i, `${label} must not import retrieval or source-fetch code`);
    assert.doesNotMatch(text, /\bfetch\s*\(/, `${label} must not fetch sources`);
    assert.doesNotMatch(text, /\bcreatePullRequest\b|\bcallGithub\b|\bexecuteCodex\b|\blaunchCodex\b/i);
  }
}

function writeGrant(db, grantStatus, approvalRef) {
  const result = writeAutonomyDelegationGrant(makeGrantInput({
    grant_status: grantStatus,
    explicit_user_approval: { approval_ref: approvalRef },
  }), {
    db,
    now: `2026-07-09T01:0${approvalRef.length % 10}:00.000Z`,
  });
  assert.equal(result.ok, true, `${grantStatus} grant should write`);
  return result;
}

function writeCandidate(db, sourceGrant, overrides = {}) {
  const result = writeAutohuntWorkQueueCandidate(
    makeCandidateInput(sourceGrant, overrides),
    {
      db,
      now: `2026-07-09T01:1${String(overrides.title ?? "").length % 10}:00.000Z`,
    },
  );
  assert.equal(result.ok, true, "queue candidate should write");
  return result;
}

function makeGrantInput(overrides = {}) {
  const base = {
    scope: "project:augnes",
    grant_status: "active",
    grant_mode: "supervised_autohunt_planning",
    explicit_user_approval: {
      approval_ref: "approval:autohunt-preflight-packet:v0.1",
      approved_by: "operator",
      approved_at: "2026-07-09T01:00:00.000Z",
      approval_basis: "explicit bounded preflight packet approval",
      approval_text_fingerprint: "fnv1a32_canonical_json_v0_1:approval001",
      raw_approval_text_persisted: false,
    },
    source_autonomy_contract: {
      contract_id: "autonomy_contract.sample.phase_8a.v0.1",
      contract_fingerprint: "fnv1a32_canonical_json_v0_1:contract001",
      contract_version: "autonomy_contract.v0.1",
      autonomy_mode: "scheduled_hunt_preview",
      source_refs: ["autonomy-contract:fixture"],
    },
    allowed_work_classes: [
      AUTONOMY_DELEGATION_GRANT_ALLOWED_WORK_CLASSES[0],
      AUTONOMY_DELEGATION_GRANT_ALLOWED_WORK_CLASSES[2],
      AUTONOMY_DELEGATION_GRANT_ALLOWED_WORK_CLASSES[3],
    ],
    forbidden_work_classes: [
      ...AUTONOMY_DELEGATION_GRANT_FORBIDDEN_WORK_CLASSES,
    ],
    allowed_actions: [...AUTONOMY_DELEGATION_GRANT_ALLOWED_ACTIONS],
    forbidden_actions: [...AUTONOMY_DELEGATION_GRANT_FORBIDDEN_ACTIONS],
    budget: {
      time_limit_minutes: 30,
      max_iterations: 2,
      max_tool_calls: 20,
      max_codex_tasks: 0,
      max_draft_prs: 0,
      max_file_changes: 8,
      max_changed_files_per_pr: 8,
      allowed_file_globs: [
        "types/**",
        "lib/autonomy/**",
        "components/autonomy/**",
        "scripts/**",
      ],
      forbidden_file_globs: ["app/api/**", "docs/**"],
      retry_limit: 1,
      failure_threshold: 1,
      requires_budget_refresh_after: ["budget_exhausted", "scope_change"],
    },
    reporting_cadence: {
      mode: "manual",
      interval_description: "report after bounded preflight packet write",
      minimum_report_fields: [
        "preflight_packet_id",
        "preflight_status",
        "stop_condition_status",
      ],
      report_target_surface: "operator_report",
    },
    stop_conditions: [...AUTONOMY_DELEGATION_GRANT_STOP_CONDITIONS],
    allowed_outputs: [...AUTONOMY_DELEGATION_GRANT_ALLOWED_OUTPUTS],
    forbidden_outputs: [...AUTONOMY_DELEGATION_GRANT_FORBIDDEN_OUTPUTS],
    revocation: {
      revoked_by: null,
      revoked_at: null,
      revocation_reason: null,
      supersedes_grant_id: null,
      superseded_by_grant_id: null,
    },
    authority_boundary: buildAutonomyDelegationGrantAuthorityBoundary(),
    persisted_material_boundary: {
      persists_source_fingerprints: true,
      persists_budget: true,
      persists_policy: true,
      persists_raw_user_approval_text: false,
      persists_raw_prompt: false,
      persists_raw_operator_note: false,
      persists_secret_or_token: false,
      persists_url_or_env_value: false,
    },
  };
  return deepMerge(base, overrides);
}

function makeCandidateInput(sourceGrant, overrides = {}) {
  const base = {
    scope: "project:augnes",
    candidate_origin: "continuity_spine_summary",
    source_grant: sourceGrant,
    work_class: "small_refactor",
    title: "Bounded preflight queue candidate",
    summary: "Queue candidate for future supervised Autohunt preflight packet.",
    source_refs: ["workplane-continuity-spine-summary:fixture"],
    source_fingerprints: ["fnv1a32_canonical_json_v0_1:source001"],
    evidence_refs: [],
    required_context_refs: ["context:workplane-summary"],
    proposed_files_or_globs: [
      "types/autohunt-preflight-packet.ts",
      "lib/autonomy/autohunt-preflight-packet-write.ts",
      "components/autonomy/autohunt-preflight-packet-readback-panel.tsx",
      "scripts/smoke-autohunt-preflight-packet-v0-1.mjs",
    ],
    expected_outputs: ["draft_pr_plan"],
    required_checks: ["npm run smoke:autohunt-preflight-packet-v0-1"],
    blocked_actions: [],
    stop_conditions: [
      "manual_stop_requested",
      "authority_boundary_unclear",
      "budget_exhausted",
      "forbidden_action_requested",
    ],
    budget_projection: {
      estimated_iterations: 1,
      estimated_tool_calls: 4,
      estimated_codex_tasks: 0,
      estimated_file_changes: 4,
      estimated_draft_prs: 0,
    },
    proposed_actions: ["read_repo", "report_result"],
  };
  return deepMerge(base, overrides);
}

function makePreflightInput(sourceGrant, sourceQueue, overrides = {}) {
  const base = {
    scope: "project:augnes",
    source_grant: sourceGrant,
    source_queue: sourceQueue,
  };
  return deepMerge(base, overrides);
}

function assertRefused(db, overrides) {
  const activeGrant = readLatestGrant(db, "active");
  const queueReadback = readAutohuntWorkQueueCandidates({
    db,
    source_grant_id: activeGrant.grant_id,
    candidate_status: "queued",
  });
  const result = writeAutohuntPreflightPacket(
    makePreflightInput(activeGrant, queueReadback, overrides),
    {
      db,
      now: "2026-07-09T01:30:00.000Z",
    },
  );
  assert.equal(result.result_status, "refused");
  assert.equal(result.ok, false);
  assert.equal(result.preflight_packet_record_written, false);
  assertNoAuthority(result);
}

function readLatestGrant(db, status) {
  const row = db
    .prepare(
      `SELECT * FROM ${AUTONOMY_DELEGATION_GRANT_TABLE} WHERE grant_status = ? ORDER BY created_at DESC LIMIT 1`,
    )
    .get(status);
  assert(row, `${status} grant row must exist`);
  return {
    grant_kind: "autonomy_delegation_grant",
    grant_version: "autonomy_delegation_grant.v0.1",
    grant_id: row.grant_id,
    scope: row.scope,
    created_at: row.created_at,
    grant_status: row.grant_status,
    grant_mode: row.grant_mode,
    idempotency_key: row.idempotency_key,
    explicit_user_approval: {
      approval_ref: row.approval_ref,
      approved_by: row.approved_by,
      approved_at: row.approved_at,
      approval_basis: row.approval_basis,
      approval_text_fingerprint: row.approval_text_fingerprint,
      raw_approval_text_persisted: false,
    },
    source_autonomy_contract: {
      contract_id: row.source_contract_id,
      contract_fingerprint: row.source_contract_fingerprint,
      contract_version: row.source_contract_version,
      autonomy_mode: row.source_autonomy_mode,
      source_refs: [],
    },
    allowed_work_classes: JSON.parse(row.allowed_work_classes_json),
    forbidden_work_classes: JSON.parse(row.forbidden_work_classes_json),
    allowed_actions: JSON.parse(row.allowed_actions_json),
    forbidden_actions: JSON.parse(row.forbidden_actions_json),
    budget: JSON.parse(row.budget_json),
    reporting_cadence: JSON.parse(row.reporting_cadence_json),
    stop_conditions: JSON.parse(row.stop_conditions_json),
    allowed_outputs: JSON.parse(row.allowed_outputs_json),
    forbidden_outputs: JSON.parse(row.forbidden_outputs_json),
    revocation: JSON.parse(row.revocation_json),
    authority_boundary: JSON.parse(row.authority_boundary_json),
    persisted_material_boundary: JSON.parse(row.persisted_material_boundary_json),
    validation: JSON.parse(row.validation_json),
    row_count_write_summary: JSON.parse(row.row_count_write_summary_json),
    grant_fingerprint: row.grant_fingerprint,
  };
}

function assertRowCountSummaryIncludesProtectedTables(summary) {
  assert(summary, "row-count summary must exist");
  const tableNames = summary.rows.map((row) => row.table_name);
  assert(tableNames.includes(AUTONOMY_DELEGATION_GRANT_TABLE));
  assert(tableNames.includes(AUTOHUNT_WORK_QUEUE_CANDIDATE_TABLE));
  for (const tableName of RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_DRY_RUN_PROTECTED_ROW_COUNT_TABLES) {
    assert(tableNames.includes(tableName), `${tableName} must be checked`);
  }
}

function assertNoAuthority(result) {
  for (const key of AUTOHUNT_PREFLIGHT_PACKET_AUTHORITY_FLAG_NAMES) {
    assert.equal(result[key], false, `${key} must remain false`);
  }
  assert.equal(result.raw_material_persisted, false);
}

function assertNoPacketAuthority(packet) {
  assert(packet, "packet must exist");
  assert.deepEqual(
    packet.authority_boundary,
    buildAutohuntPreflightPacketAuthorityBoundary(),
  );
  for (const [key, value] of Object.entries(packet.authority_boundary)) {
    assert.equal(value, false, `${key} must remain false`);
  }
  assert.equal(packet.persisted_material_boundary.persists_raw_prompt, false);
  assert.equal(
    packet.persisted_material_boundary.persists_raw_operator_note,
    false,
  );
  assert.equal(
    packet.persisted_material_boundary.persists_raw_source_payload,
    false,
  );
  assert.equal(packet.persisted_material_boundary.persists_secret_or_token, false);
  assert.equal(packet.persisted_material_boundary.persists_url_or_env_value, false);
}

function assertNoReadbackAuthority(readback) {
  for (const [key, value] of Object.entries(readback.no_run_no_execution_boundary)) {
    assert.equal(value, false, `${key} must remain false`);
  }
  assert.equal(readback.runner_started, false);
  assert.equal(readback.scheduler_started, false);
  assert.equal(readback.codex_executed, false);
  assert.equal(readback.github_called, false);
  assert.equal(readback.provider_openai_called, false);
  assert.equal(readback.sources_fetched, false);
  assert.equal(readback.retrieval_run, false);
  assert.equal(readback.memory_written, false);
  assert.equal(readback.perspective_promoted, false);
  assert.equal(readback.cwp_mutated, false);
  assert.equal(readback.work_mutated, false);
  assert.equal(readback.proof_or_evidence_written, false);
  assert.equal(readback.product_or_delivery_state_written, false);
}

function countRows(db, tableName) {
  return db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get().count;
}

function collectGitFiles(args) {
  try {
    return execFileSync("git", args, { encoding: "utf8" })
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function assertContains(text, requiredPhrases, label) {
  const normalized = text.replace(/\s+/g, " ");
  for (const phrase of requiredPhrases) {
    assert(
      normalized.includes(phrase.replace(/\s+/g, " ")),
      `${label} must contain ${phrase}`,
    );
  }
}

function deepMerge(base, overrides) {
  const output = { ...base };
  for (const [key, value] of Object.entries(overrides)) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      base[key] &&
      typeof base[key] === "object" &&
      !Array.isArray(base[key])
    ) {
      output[key] = deepMerge(base[key], value);
    } else {
      output[key] = value;
    }
  }
  return output;
}
