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
  buildAutohuntWorkQueueCandidateAuthorityBoundary,
  computeAutohuntWorkQueueCandidateFingerprint,
  ensureAutohuntWorkQueueCandidateSchema,
  readAutohuntWorkQueueCandidates,
} from "../lib/autonomy/read-autohunt-work-queue-candidates.ts";
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
  AUTOHUNT_WORK_QUEUE_CANDIDATE_AUTHORITY_FLAG_NAMES,
  AUTOHUNT_WORK_QUEUE_CANDIDATE_TABLE,
} from "../types/autohunt-work-queue-candidate.ts";

const files = {
  type: "types/autohunt-work-queue-candidate.ts",
  writer: "lib/autonomy/autohunt-work-queue-candidate-write.ts",
  reader: "lib/autonomy/read-autohunt-work-queue-candidates.ts",
  panel:
    "components/autonomy/autohunt-work-queue-candidate-readback-panel.tsx",
  preflightType: "types/autohunt-preflight-packet.ts",
  preflightWriter: "lib/autonomy/autohunt-preflight-packet-write.ts",
  preflightReader: "lib/autonomy/read-autohunt-preflight-packets.ts",
  preflightPanel:
    "components/autonomy/autohunt-preflight-packet-readback-panel.tsx",
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
  operatorDecisionType:
    "types/autohunt-handoff-plan-operator-review-decision.ts",
  operatorDecisionWriter:
    "lib/autonomy/autohunt-handoff-plan-operator-review-decision-write.ts",
  operatorDecisionReader:
    "lib/autonomy/read-autohunt-handoff-plan-operator-review-decisions.ts",
  operatorDecisionPanel:
    "components/autonomy/autohunt-handoff-plan-operator-review-decision-readback-panel.tsx",
  agentWorkplane: "components/workplane/agent-workplane.tsx",
  db: "lib/db.ts",
  schema: "lib/db/schema.sql",
  migrations: "scripts/db-migrations.mjs",
  migrate: "scripts/db-migrate.mjs",
  smoke: "scripts/smoke-autohunt-work-queue-candidate-v0-1.mjs",
  preflightSmoke: "scripts/smoke-autohunt-preflight-packet-v0-1.mjs",
  workbenchSpineSmoke:
    "scripts/smoke-autohunt-workbench-readback-spine-v0-1.mjs",
  handoffPlanSmoke:
    "scripts/smoke-autohunt-handoff-plan-preview-v0-1.mjs",
  handoffPlanWorkbenchMountSmoke:
    "scripts/smoke-autohunt-handoff-plan-preview-workbench-mount-v0-1.mjs",
  operatorDecisionSmoke:
    "scripts/smoke-autohunt-handoff-plan-operator-review-decision-v0-1.mjs",
  operatorDecisionWorkbenchMountSmoke:
    "scripts/smoke-autohunt-handoff-plan-operator-review-decision-workbench-mount-v0-1.mjs",
  packageJson: "package.json",
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
      smoke: "autohunt-work-queue-candidate-v0-1",
      pass: true,
      target_table: AUTOHUNT_WORK_QUEUE_CANDIDATE_TABLE,
      expected_changed_files_checked: true,
      docs_changed: false,
      write_helper_checked: true,
      readback_helper_checked: true,
      panel_passive_checked: true,
      target_only_write_checked: true,
      duplicate_replay_checked: true,
      grant_fit_refusals_checked: true,
      unsafe_input_refusals_checked: true,
      queued_readback_checked: true,
      historical_status_visibility_checked: true,
      no_runner_or_external_authority_checked: true,
      raw_material_persistence_checked: true,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:autohunt-work-queue-candidate-v0-1");

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
      `Unexpected changed file for autohunt work queue candidate slice: ${file}`,
    );
    assert.doesNotMatch(file, /^docs\//, "queue candidate slice must not edit docs");
    assert.doesNotMatch(file, /^README/i, "queue candidate slice must not edit README");
    assert.doesNotMatch(file, /^app\/api\//, "queue candidate slice must not edit routes");
    assert.doesNotMatch(file, /^app\//, "queue candidate slice must not edit app surfaces");
    assert.doesNotMatch(file, /package-lock|pnpm-lock|yarn\.lock/, "package lock must not change");
  }
}

function assertTypeAndHelperFiles() {
  assertContains(source.type, [
    "AUTOHUNT_WORK_QUEUE_CANDIDATE_KIND",
    "AUTOHUNT_WORK_QUEUE_CANDIDATE_VERSION",
    "AUTOHUNT_WORK_QUEUE_CANDIDATE_TABLE",
    "candidate_status",
    "continuity_spine_summary",
    "residual_diagnostic",
    "operator_supplied",
    "source_grant",
    "budget_projection",
    "grant_fit",
    "authority_boundary",
    "persisted_material_boundary",
    "candidate_fingerprint",
  ], files.type);
  assertContains(source.writer, [
    "writeAutohuntWorkQueueCandidate",
    "validateAutohuntWorkQueueCandidateInput",
    "buildDeterministicIdempotencyKey",
    "findForbiddenRawMaterialFields",
    "containsForbiddenRawMaterial",
    "assertAllFalseBoundary",
    "requiredStringFieldsPresent",
    "validateSourceBindingPairs",
    "summarizeTargetOnlyRowCountWrite",
    "BEGIN IMMEDIATE",
    "target_only_autohunt_work_queue_candidate_row_count_proof_failed",
  ], files.writer);
  assertContains(source.reader, [
    "readAutohuntWorkQueueCandidates",
    "ensureAutohuntWorkQueueCandidateSchema",
    "computeAutohuntWorkQueueCandidateFingerprint",
    "selected_queued_candidates",
    "blocked_candidates",
    "deferred_candidates",
    "rejected_candidates",
    "superseded_candidates",
    "no_run_no_execution_boundary",
  ], files.reader);
  assertContains(source.panel, [
    "AutohuntWorkQueueCandidateReadbackPanel",
    "selected candidate",
    "status breakdown",
    "budget projection",
    "grant fit",
    "source binding",
    "candidate scope",
    "authority boundary",
    "material boundary",
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
    assert(text.includes("autohunt_work_queue_candidates"), `${label} must wire target table`);
  }

  const db = new Database(":memory:");
  try {
    ensureAutohuntWorkQueueCandidateSchema(db);
    const columns = db.prepare("PRAGMA table_info(autohunt_work_queue_candidates)").all();
    const columnNames = columns.map((column) => column.name);
    assert.deepEqual(columnNames, [
      "candidate_id",
      "created_at",
      "scope",
      "candidate_status",
      "candidate_origin",
      "source_grant_id",
      "source_grant_fingerprint",
      "source_grant_status",
      "source_grant_mode",
      "work_class",
      "title",
      "summary",
      "title_summary_fingerprint",
      "idempotency_key",
      "source_refs_json",
      "source_fingerprints_json",
      "evidence_refs_json",
      "required_context_refs_json",
      "proposed_files_or_globs_json",
      "expected_outputs_json",
      "required_checks_json",
      "blocked_actions_json",
      "stop_conditions_json",
      "budget_projection_json",
      "grant_fit_json",
      "authority_boundary_json",
      "persisted_material_boundary_json",
      "validation_json",
      "row_count_write_summary_json",
      "candidate_fingerprint",
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
        "SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'autohunt_work_queue_candidates'",
      )
      .all()
      .map((index) => index.name);
    for (const indexName of [
      "idx_autohunt_work_queue_candidates_scope_created",
      "idx_autohunt_work_queue_candidates_source_grant_id_created",
      "idx_autohunt_work_queue_candidates_source_grant_fingerprint_created",
      "idx_autohunt_work_queue_candidates_candidate_status_created",
      "idx_autohunt_work_queue_candidates_candidate_origin_created",
      "idx_autohunt_work_queue_candidates_work_class_created",
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
    scriptName: "smoke:autohunt-work-queue-candidate-v0-1",
    expectedCommand:
      "tsx --tsconfig tsconfig.json scripts/smoke-autohunt-work-queue-candidate-v0-1.mjs",
  });
}

function assertWriteReadBehavior() {
  const db = new Database(":memory:");
  try {
    ensureAutonomyDelegationGrantSchema(db);
    ensureAutohuntWorkQueueCandidateSchema(db);
    const activeGrant = writeGrant(db, "active", "approval:queue-active").grant;
    assert(activeGrant, "active grant must write");

    const beforeTarget = countRows(db, AUTOHUNT_WORK_QUEUE_CANDIDATE_TABLE);
    const beforeGrant = countRows(db, AUTONOMY_DELEGATION_GRANT_TABLE);
    const accepted = writeAutohuntWorkQueueCandidate(makeCandidateInput(activeGrant), {
      db,
      now: "2026-07-09T00:10:00.000Z",
    });
    assert.equal(accepted.result_status, "written");
    assert.equal(accepted.ok, true);
    assert.equal(accepted.candidate?.candidate_status, "queued");
    assert.equal(accepted.queue_candidate_record_written, true);
    assert.equal(countRows(db, AUTOHUNT_WORK_QUEUE_CANDIDATE_TABLE), beforeTarget + 1);
    assert.equal(countRows(db, AUTONOMY_DELEGATION_GRANT_TABLE), beforeGrant);
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
    assertNoCandidateAuthority(accepted.candidate);

    const duplicate = writeAutohuntWorkQueueCandidate(makeCandidateInput(activeGrant), {
      db,
      now: "2026-07-09T00:11:00.000Z",
    });
    assert.equal(duplicate.result_status, "duplicate_replayed");
    assert.equal(duplicate.duplicate_replayed, true);
    assert.equal(duplicate.queue_candidate_record_written, false);
    assert.equal(countRows(db, AUTOHUNT_WORK_QUEUE_CANDIDATE_TABLE), beforeTarget + 1);

    assertRefused({ source_grant: null }, db);
    const pausedGrant = writeGrant(db, "paused", "approval:queue-paused").grant;
    const revokedGrant = writeGrant(db, "revoked", "approval:queue-revoked").grant;
    assertRefused({ source_grant: pausedGrant }, db);
    assertRefused({ source_grant: revokedGrant }, db);
    assertRefused({
      source_grant: {
        ...activeGrant,
        grant_fingerprint: "fnv1a32_canonical_json_v0_1:tampered",
      },
    }, db);
    assertRefused({ work_class: "dependency_upgrade" }, db);
    assertRefused({ proposed_files_or_globs: ["app/page.tsx"] }, db);
    assertRefused({ proposed_files_or_globs: ["docs/autohunt.md"] }, db);
    assertRefused({
      budget_projection: { estimated_iterations: 99 },
    }, db);
    assertRefused({
      stop_conditions: ["authority_boundary_unclear", "budget_exhausted"],
    }, db);
    assertRefused({
      stop_conditions: ["manual_stop_requested", "budget_exhausted"],
    }, db);
    assertRefused({ proposed_actions: ["start_runner"] }, db);
    assertRefused({ raw_prompt: "prompt body" }, db);
    assertRefused({ raw_source_payload: "source body" }, db);
    assertRefused({ operator_note_body: "operator note body" }, db);
    assertRefused({ token: "token=value" }, db);
    assertRefused({ secret: "secret=value" }, db);
    assertRefused({ callback_url: "https://example.invalid/source" }, db);
    assertRefused({ env: "OPENAI_API_KEY=sk-not-real-value" }, db);
    assertRefused({ summary: "api_key=sk-not-real-value" }, db);

    for (const [candidate_status, suffix, createdAt] of [
      ["blocked", "blocked", "2026-07-09T00:12:00.000Z"],
      ["deferred", "deferred", "2026-07-09T00:13:00.000Z"],
      ["rejected", "rejected", "2026-07-09T00:14:00.000Z"],
      ["superseded", "superseded", "2026-07-09T00:15:00.000Z"],
    ]) {
      const result = writeAutohuntWorkQueueCandidate(
        makeCandidateInput(activeGrant, {
          candidate_status,
          title: `Historical ${suffix} queue candidate`,
          source_fingerprints: [`fnv1a32_canonical_json_v0_1:${suffix}001`],
        }),
        { db, now: createdAt },
      );
      assert.equal(result.ok, true, `${candidate_status} candidate should write`);
      assert.equal(result.candidate?.candidate_status, candidate_status);
    }

    const readback = readAutohuntWorkQueueCandidates({ db });
    assert.equal(readback.selection_status, "selected_queued_candidates");
    assert.equal(readback.selected_queued_candidates.length, 1);
    assert(readback.selected_queued_candidates.every((candidate) => candidate.candidate_status === "queued"));
    assert.equal(readback.blocked_candidates.length, 1);
    assert.equal(readback.deferred_candidates.length, 1);
    assert.equal(readback.rejected_candidates.length, 1);
    assert.equal(readback.superseded_candidates.length, 1);
    assert.equal(readback.invalid_record_count, 0);
    assert.equal(
      readback.selected_queued_candidates[0]?.candidate_fingerprint,
      computeAutohuntWorkQueueCandidateFingerprint(
        readback.selected_queued_candidates[0],
      ),
    );
    assertNoReadbackAuthority(readback);

    const byId = readAutohuntWorkQueueCandidates({
      db,
      candidate_id: accepted.candidate?.candidate_id,
    });
    assert.equal(byId.selection_status, "selected_by_candidate_id");
    assert.equal(byId.selected_candidate?.candidate_id, accepted.candidate?.candidate_id);

    const byGrant = readAutohuntWorkQueueCandidates({
      db,
      source_grant_id: activeGrant.grant_id,
      candidate_status: "queued",
      candidate_origin: "continuity_spine_summary",
      work_class: "small_refactor",
    });
    assert.equal(byGrant.selected_queued_candidates.length, 1);
  } finally {
    db.close();
  }

  const tamperDb = new Database(":memory:");
  try {
    ensureAutonomyDelegationGrantSchema(tamperDb);
    ensureAutohuntWorkQueueCandidateSchema(tamperDb);
    const activeGrant = writeGrant(
      tamperDb,
      "active",
      "approval:queue-active-tamper",
    ).grant;
    const result = writeAutohuntWorkQueueCandidate(
      makeCandidateInput(activeGrant),
      {
        db: tamperDb,
        now: "2026-07-09T00:10:00.000Z",
      },
    );
    assert.equal(result.ok, true);
    tamperDb
      .prepare(
        "UPDATE autohunt_work_queue_candidates SET candidate_fingerprint = ? WHERE candidate_id = ?",
      )
      .run("tampered", result.candidate?.candidate_id);
    const tamperedReadback = readAutohuntWorkQueueCandidates({ db: tamperDb });
    assert.equal(tamperedReadback.invalid_record_count, 1);
    assert.equal(tamperedReadback.selected_queued_candidates.length, 0);
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
    now: `2026-07-09T00:0${approvalRef.length % 10}:00.000Z`,
  });
  assert.equal(result.ok, true, `${grantStatus} grant should write`);
  return result;
}

function makeGrantInput(overrides = {}) {
  const base = {
    scope: "project:augnes",
    grant_status: "active",
    grant_mode: "supervised_autohunt_planning",
    explicit_user_approval: {
      approval_ref: "approval:autohunt-work-queue-candidate:v0.1",
      approved_by: "operator",
      approved_at: "2026-07-09T00:00:00.000Z",
      approval_basis: "explicit bounded queue candidate approval",
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
      interval_description: "report after bounded queue candidate write",
      minimum_report_fields: [
        "candidate_id",
        "grant_fit",
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
    title: "Bounded queue candidate",
    summary: "Queue candidate for future supervised Autohunt preflight.",
    source_refs: ["workplane-continuity-spine-summary:fixture"],
    source_fingerprints: ["fnv1a32_canonical_json_v0_1:source001"],
    evidence_refs: [],
    required_context_refs: ["context:workplane-summary"],
    proposed_files_or_globs: [
      "types/autohunt-work-queue-candidate.ts",
      "lib/autonomy/autohunt-work-queue-candidate-write.ts",
      "components/autonomy/autohunt-work-queue-candidate-readback-panel.tsx",
      "scripts/smoke-autohunt-work-queue-candidate-v0-1.mjs",
    ],
    expected_outputs: ["draft_pr_plan"],
    required_checks: ["npm run smoke:autohunt-work-queue-candidate-v0-1"],
    blocked_actions: [...AUTONOMY_DELEGATION_GRANT_FORBIDDEN_ACTIONS],
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

function assertRefused(overrides, db) {
  const activeGrant = readFirstActiveGrant(db);
  const result = writeAutohuntWorkQueueCandidate(
    makeCandidateInput(activeGrant, overrides),
    {
      db,
      now: "2026-07-09T00:20:00.000Z",
    },
  );
  assert.equal(result.result_status, "refused");
  assert.equal(result.ok, false);
  assert.equal(result.queue_candidate_record_written, false);
  assertNoAuthority(result);
}

function readFirstActiveGrant(db) {
  const row = db
    .prepare(
      `SELECT * FROM ${AUTONOMY_DELEGATION_GRANT_TABLE} WHERE grant_status = 'active' ORDER BY created_at DESC LIMIT 1`,
    )
    .get();
  assert(row, "active grant row must exist for refusal fixtures");
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

function assertNoAuthority(result) {
  for (const key of AUTOHUNT_WORK_QUEUE_CANDIDATE_AUTHORITY_FLAG_NAMES) {
    assert.equal(result[key], false, `${key} must remain false`);
  }
  assert.equal(result.raw_material_persisted, false);
}

function assertNoCandidateAuthority(candidate) {
  assert(candidate, "candidate must exist");
  assert.deepEqual(
    candidate.authority_boundary,
    buildAutohuntWorkQueueCandidateAuthorityBoundary(),
  );
  for (const [key, value] of Object.entries(candidate.authority_boundary)) {
    assert.equal(value, false, `${key} must remain false`);
  }
  assert.equal(candidate.persisted_material_boundary.persists_raw_prompt, false);
  assert.equal(
    candidate.persisted_material_boundary.persists_raw_operator_note,
    false,
  );
  assert.equal(
    candidate.persisted_material_boundary.persists_raw_source_payload,
    false,
  );
  assert.equal(candidate.persisted_material_boundary.persists_secret_or_token, false);
  assert.equal(candidate.persisted_material_boundary.persists_url_or_env_value, false);
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
