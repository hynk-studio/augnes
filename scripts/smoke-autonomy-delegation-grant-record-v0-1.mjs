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
  computeAutonomyDelegationGrantFingerprint,
  ensureAutonomyDelegationGrantSchema,
  readAutonomyDelegationGrants,
} from "../lib/autonomy/read-autonomy-delegation-grants.ts";
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

const files = {
  type: "types/autonomy-delegation-grant.ts",
  writer: "lib/autonomy/autonomy-delegation-grant-write.ts",
  reader: "lib/autonomy/read-autonomy-delegation-grants.ts",
  panel: "components/autonomy/autonomy-delegation-grant-readback-panel.tsx",
  queueType: "types/autohunt-work-queue-candidate.ts",
  queueWriter: "lib/autonomy/autohunt-work-queue-candidate-write.ts",
  queueReader: "lib/autonomy/read-autohunt-work-queue-candidates.ts",
  queuePanel:
    "components/autonomy/autohunt-work-queue-candidate-readback-panel.tsx",
  preflightType: "types/autohunt-preflight-packet.ts",
  preflightWriter: "lib/autonomy/autohunt-preflight-packet-write.ts",
  preflightReader: "lib/autonomy/read-autohunt-preflight-packets.ts",
  preflightPanel:
    "components/autonomy/autohunt-preflight-packet-readback-panel.tsx",
  db: "lib/db.ts",
  schema: "lib/db/schema.sql",
  migrations: "scripts/db-migrations.mjs",
  migrate: "scripts/db-migrate.mjs",
  smoke: "scripts/smoke-autonomy-delegation-grant-record-v0-1.mjs",
  queueSmoke: "scripts/smoke-autohunt-work-queue-candidate-v0-1.mjs",
  preflightSmoke: "scripts/smoke-autohunt-preflight-packet-v0-1.mjs",
  packageJson: "package.json",
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
const packageJson = JSON.parse(source.packageJson);

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
      smoke: "autonomy-delegation-grant-record-v0-1",
      pass: true,
      target_table: AUTONOMY_DELEGATION_GRANT_TABLE,
      expected_changed_files_checked: true,
      docs_changed: false,
      write_helper_checked: true,
      readback_helper_checked: true,
      panel_passive_checked: true,
      target_only_write_checked: true,
      duplicate_replay_checked: true,
      unsafe_input_refusals_checked: true,
      latest_active_readback_checked: true,
      paused_revoked_superseded_expired_visible_checked: true,
      no_runner_or_external_authority_checked: true,
      raw_material_persistence_checked: true,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:autonomy-delegation-grant-record-v0-1");

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
      `Unexpected changed file for autonomy delegation grant slice: ${file}`,
    );
    assert.doesNotMatch(file, /^docs\//, "autonomy grant slice must not edit docs");
    assert.doesNotMatch(file, /^README/i, "autonomy grant slice must not edit README");
    assert.doesNotMatch(file, /^app\/api\//, "autonomy grant slice must not edit routes");
    assert.doesNotMatch(file, /^app\//, "autonomy grant slice must not edit app surfaces");
    assert.doesNotMatch(file, /package-lock|pnpm-lock|yarn\.lock/, "package lock must not change");
  }
}

function assertTypeAndHelperFiles() {
  assertContains(source.type, [
    "AUTONOMY_DELEGATION_GRANT_KIND",
    "AUTONOMY_DELEGATION_GRANT_VERSION",
    "AUTONOMY_DELEGATION_GRANT_TABLE",
    "grant_status",
    "supervised_autohunt_planning",
    "supervised_codex_draft_pr_loop",
    "research_accumulation_loop",
    "work_queue_preflight_only",
    "explicit_user_approval",
    "raw_approval_text_persisted: false",
    "source_autonomy_contract",
    "allowed_work_classes",
    "forbidden_work_classes",
    "allowed_actions",
    "forbidden_actions",
    "budget",
    "reporting_cadence",
    "stop_conditions",
    "allowed_outputs",
    "forbidden_outputs",
    "revocation",
    "authority_boundary",
    "persisted_material_boundary",
    "grant_fingerprint",
  ], files.type);
  assertContains(source.writer, [
    "writeAutonomyDelegationGrant",
    "validateAutonomyDelegationGrantInput",
    "buildDeterministicIdempotencyKey",
    "findForbiddenRawMaterialFields",
    "containsForbiddenRawMaterial",
    "assertAllFalseBoundary",
    "requiredStringFieldsPresent",
    "validateSourceBindingPairs",
    "summarizeTargetOnlyRowCountWrite",
    "BEGIN IMMEDIATE",
    "target_only_autonomy_delegation_grant_row_count_proof_failed",
  ], files.writer);
  assertContains(source.reader, [
    "readAutonomyDelegationGrants",
    "ensureAutonomyDelegationGrantSchema",
    "computeAutonomyDelegationGrantFingerprint",
    "parseAutonomyDelegationGrantRow",
    "selected_latest_active_grant",
    "paused_grants",
    "revoked_grants",
    "superseded_grants",
    "expired_grants",
    "no_run_no_execution_boundary",
  ], files.reader);
  assertContains(source.panel, [
    "AutonomyDelegationGrantReadbackPanel",
    "selected grant",
    "budget",
    "work classes",
    "actions",
    "stop and report",
    "revocation",
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
    assert(text.includes("autonomy_delegation_grants"), `${label} must wire target table`);
  }

  const db = new Database(":memory:");
  try {
    ensureAutonomyDelegationGrantSchema(db);
    const columns = db.prepare("PRAGMA table_info(autonomy_delegation_grants)").all();
    const columnNames = columns.map((column) => column.name);
    assert.deepEqual(columnNames, [
      "grant_id",
      "created_at",
      "scope",
      "grant_status",
      "grant_mode",
      "approval_ref",
      "approved_by",
      "approved_at",
      "approval_basis",
      "approval_text_fingerprint",
      "source_contract_id",
      "source_contract_fingerprint",
      "source_contract_version",
      "source_autonomy_mode",
      "idempotency_key",
      "allowed_work_classes_json",
      "forbidden_work_classes_json",
      "allowed_actions_json",
      "forbidden_actions_json",
      "budget_json",
      "reporting_cadence_json",
      "stop_conditions_json",
      "allowed_outputs_json",
      "forbidden_outputs_json",
      "revocation_json",
      "authority_boundary_json",
      "persisted_material_boundary_json",
      "validation_json",
      "row_count_write_summary_json",
      "grant_fingerprint",
    ]);
    for (const columnName of columnNames) {
      assert.doesNotMatch(columnName, /^raw/i, "raw columns must not exist");
      assert.doesNotMatch(columnName, /raw_approval_text/i);
      assert.doesNotMatch(columnName, /raw_prompt/i);
      assert.doesNotMatch(columnName, /operator_note/i);
      assert.doesNotMatch(columnName, /\btoken\b/i);
      assert.doesNotMatch(columnName, /\bsecret\b/i);
      assert.doesNotMatch(columnName, /\burl\b/i);
      assert.doesNotMatch(columnName, /\benv\b/i);
      assert.doesNotMatch(columnName, /credential/i);
    }
    const indexes = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'autonomy_delegation_grants'",
      )
      .all()
      .map((index) => index.name);
    for (const indexName of [
      "idx_autonomy_delegation_grants_scope_created",
      "idx_autonomy_delegation_grants_scope_status_created",
      "idx_autonomy_delegation_grants_scope_mode_created",
      "idx_autonomy_delegation_grants_approval_ref",
      "idx_autonomy_delegation_grants_source_contract_fingerprint",
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
    scriptName: "smoke:autonomy-delegation-grant-record-v0-1",
    expectedCommand:
      "tsx --tsconfig tsconfig.json scripts/smoke-autonomy-delegation-grant-record-v0-1.mjs",
  });
}

function assertWriteReadBehavior() {
  const db = new Database(":memory:");
  try {
    ensureAutonomyDelegationGrantSchema(db);
    const beforeTarget = countRows(db, AUTONOMY_DELEGATION_GRANT_TABLE);
    const accepted = writeAutonomyDelegationGrant(makeGrantInput(), {
      db,
      now: "2026-07-09T00:00:00.000Z",
    });
    assert.equal(accepted.result_status, "written");
    assert.equal(accepted.ok, true);
    assert.equal(accepted.grant_record_written, true);
    assert.equal(countRows(db, AUTONOMY_DELEGATION_GRANT_TABLE), beforeTarget + 1);
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
    assertNoAuthority(accepted);

    const duplicate = writeAutonomyDelegationGrant(makeGrantInput(), {
      db,
      now: "2026-07-09T00:01:00.000Z",
    });
    assert.equal(duplicate.result_status, "duplicate_replayed");
    assert.equal(duplicate.duplicate_replayed, true);
    assert.equal(duplicate.grant_record_written, false);
    assert.equal(countRows(db, AUTONOMY_DELEGATION_GRANT_TABLE), beforeTarget + 1);

    assertRefused({ explicit_user_approval: { approval_ref: "" } });
    assertRefused({
      explicit_user_approval: { approval_text_fingerprint: "" },
    });
    assertRefused({ explicit_user_approval: { raw_approval_text: "body" } });
    assertRefused({ raw_prompt: "prompt body" });
    assertRefused({ operator_note_body: "operator note body" });
    assertRefused({ token: "token=value" });
    assertRefused({ secret: "secret=value" });
    assertRefused({ callback_url: "https://example.invalid/callback" });
    assertRefused({ env: "OPENAI_API_KEY=sk-not-real-value" });
    assertRefused({ approval_basis: "api_key=sk-not-real-value" });
    assertRefused({
      stop_conditions: AUTONOMY_DELEGATION_GRANT_STOP_CONDITIONS.filter(
        (condition) => condition !== "manual_stop_requested",
      ),
    });
    assertRefused({
      stop_conditions: AUTONOMY_DELEGATION_GRANT_STOP_CONDITIONS.filter(
        (condition) => condition !== "authority_boundary_unclear",
      ),
    });
    assertRefused({
      forbidden_actions: AUTONOMY_DELEGATION_GRANT_FORBIDDEN_ACTIONS.filter(
        (action) => action !== "start_runner",
      ),
    });
    assertRefused({ budget: { max_iterations: 0 } });
    assertRefused({ budget: { failure_threshold: 0 } });

    writeAutonomyDelegationGrant(makeGrantInput({
      explicit_user_approval: { approval_ref: "approval:active-later" },
    }), {
      db,
      now: "2026-07-09T00:02:00.000Z",
    });
    for (const [grant_status, approval_ref, createdAt] of [
      ["paused", "approval:paused", "2026-07-09T00:03:00.000Z"],
      ["revoked", "approval:revoked", "2026-07-09T00:04:00.000Z"],
      ["superseded", "approval:superseded", "2026-07-09T00:05:00.000Z"],
      ["expired", "approval:expired", "2026-07-09T00:06:00.000Z"],
    ]) {
      const result = writeAutonomyDelegationGrant(makeGrantInput({
        grant_status,
        explicit_user_approval: { approval_ref },
      }), {
        db,
        now: createdAt,
      });
      assert.equal(result.ok, true, `${grant_status} grant should write`);
    }

    const readback = readAutonomyDelegationGrants({ db });
    assert.equal(readback.selection_status, "selected_latest_active_grant");
    assert.equal(
      readback.selected_grant?.explicit_user_approval.approval_ref,
      "approval:active-later",
    );
    assert.equal(readback.latest_active_grant?.grant_status, "active");
    assert.equal(readback.paused_grants.length, 1);
    assert.equal(readback.revoked_grants.length, 1);
    assert.equal(readback.superseded_grants.length, 1);
    assert.equal(readback.expired_grants.length, 1);
    assert.equal(readback.invalid_record_count, 0);
    assert.equal(
      readback.selected_grant?.grant_fingerprint,
      computeAutonomyDelegationGrantFingerprint(readback.selected_grant),
    );
    assertNoReadbackAuthority(readback);

    const byId = readAutonomyDelegationGrants({
      db,
      grant_id: readback.selected_grant?.grant_id,
    });
    assert.equal(byId.selection_status, "selected_by_grant_id");
    assert.equal(byId.selected_grant?.grant_id, readback.selected_grant?.grant_id);
  } finally {
    db.close();
  }

  const tamperDb = new Database(":memory:");
  try {
    ensureAutonomyDelegationGrantSchema(tamperDb);
    const result = writeAutonomyDelegationGrant(makeGrantInput(), {
      db: tamperDb,
      now: "2026-07-09T00:00:00.000Z",
    });
    assert.equal(result.ok, true);
    tamperDb
      .prepare(
        "UPDATE autonomy_delegation_grants SET grant_fingerprint = ? WHERE grant_id = ?",
      )
      .run("tampered", result.grant?.grant_id);
    const tamperedReadback = readAutonomyDelegationGrants({ db: tamperDb });
    assert.equal(tamperedReadback.invalid_record_count, 1);
    assert.equal(tamperedReadback.selected_grant, null);
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
    assert.doesNotMatch(text, /from\s+["'][^"']*(openai|provider|github|octokit|codex)[^"']*["']/i, `${label} must not import provider/GitHub/Codex code`);
    assert.doesNotMatch(text, /from\s+["'][^"']*(retrieval|rag|embedding|vector|crawler)[^"']*["']/i, `${label} must not import retrieval code`);
    assert.doesNotMatch(text, /\bfetch\s*\(/, `${label} must not fetch sources`);
    assert.doesNotMatch(text, /\bcreatePullRequest\b|\bcallGithub\b|\bexecuteCodex\b|\blaunchCodex\b/i);
  }
}

function makeGrantInput(overrides = {}) {
  const base = {
    scope: "project:augnes",
    grant_status: "active",
    grant_mode: "supervised_autohunt_planning",
    explicit_user_approval: {
      approval_ref: "approval:autonomy-delegation-grant:v0.1",
      approved_by: "operator",
      approved_at: "2026-07-09T00:00:00.000Z",
      approval_basis: "explicit bounded operator approval",
      approval_text_fingerprint: "fnv1a32_canonical_json_v0_1:approval001",
      raw_approval_text_persisted: false,
    },
    source_autonomy_contract: {
      contract_id: "autonomy_contract.sample.phase_8a.v0.1",
      contract_fingerprint: "fnv1a32_canonical_json_v0_1:contract001",
      contract_version: "autonomy_contract.v0.1",
      autonomy_mode: "scheduled_hunt_preview",
      source_refs: ["docs/AUTONOMY_CONTRACT_V0_1.md"],
    },
    allowed_work_classes: [
      AUTONOMY_DELEGATION_GRANT_ALLOWED_WORK_CLASSES[0],
      AUTONOMY_DELEGATION_GRANT_ALLOWED_WORK_CLASSES[2],
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
      allowed_file_globs: ["types/**", "lib/autonomy/**", "scripts/**"],
      forbidden_file_globs: ["app/api/**", "docs/**"],
      retry_limit: 1,
      failure_threshold: 1,
      requires_budget_refresh_after: ["budget_exhausted", "scope_change"],
    },
    reporting_cadence: {
      mode: "manual",
      interval_description: "report after bounded planning loop",
      minimum_report_fields: [
        "grant_id",
        "budget_status",
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

function assertRefused(overrides) {
  const db = new Database(":memory:");
  try {
    ensureAutonomyDelegationGrantSchema(db);
    const result = writeAutonomyDelegationGrant(makeGrantInput(overrides), {
      db,
      now: "2026-07-09T00:00:00.000Z",
    });
    assert.equal(result.result_status, "refused");
    assert.equal(result.ok, false);
    assert.equal(result.grant_record_written, false);
    assert.equal(countRows(db, AUTONOMY_DELEGATION_GRANT_TABLE), 0);
    assertNoAuthority(result);
  } finally {
    db.close();
  }
}

function assertNoAuthority(result) {
  for (const key of [
    "can_start_runner",
    "can_schedule_runner",
    "can_start_daemon",
    "can_start_background_work",
    "can_execute_codex",
    "can_call_github",
    "can_create_branch_or_pr",
    "can_merge",
    "can_deploy",
    "can_publish_external",
    "can_call_provider_or_openai",
    "can_fetch_sources",
    "can_run_retrieval",
    "can_write_db_outside_grant_record",
    "can_write_memory",
    "can_promote_perspective",
    "can_mutate_cwp",
    "can_mutate_work",
    "can_write_proof_or_evidence",
    "can_auto_apply_delta",
  ]) {
    assert.equal(result[key], false, `${key} must remain false`);
  }
  assert.equal(result.raw_material_persisted, false);
}

function assertNoReadbackAuthority(readback) {
  for (const value of Object.values(readback.no_run_no_execution_boundary)) {
    assert.equal(value, false);
  }
  for (const key of [
    "runner_started",
    "scheduler_started",
    "daemon_started",
    "background_work_started",
    "codex_executed",
    "github_called",
    "provider_openai_called",
    "sources_fetched",
    "retrieval_run",
    "memory_written",
    "perspective_promoted",
    "cwp_mutated",
    "work_mutated",
    "proof_or_evidence_written",
    "product_or_delivery_state_written",
  ]) {
    assert.equal(readback[key], false, `${key} must remain false`);
  }
}

function countRows(db, tableName) {
  const row = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
  return Number(row.count);
}

function assertContains(text, phrases, label) {
  const normalized = text.replace(/\s+/g, " ");
  for (const phrase of phrases) {
    assert(
      normalized.includes(phrase.replace(/\s+/g, " ")),
      `${label} must contain ${phrase}`,
    );
  }
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

function deepMerge(base, overrides) {
  const result = structuredClone(base);
  mergeInto(result, overrides);
  return result;
}

function mergeInto(target, sourceObject) {
  for (const [key, value] of Object.entries(sourceObject)) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      target[key] &&
      typeof target[key] === "object" &&
      !Array.isArray(target[key])
    ) {
      mergeInto(target[key], value);
    } else {
      target[key] = value;
    }
  }
}
