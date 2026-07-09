#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

import {
  assertPackageScript,
  getBaseRangeChangedFiles,
  uniqueSorted,
} from "./smoke-boundary-common.mjs";
import {
  buildAutohuntWorkbenchReadbackSpine,
} from "../lib/autonomy/autohunt-workbench-readback-spine.ts";
import {
  allValuesFalse,
  containsForbiddenRawMaterial,
  findForbiddenRawMaterialFields,
  fingerprint,
  validateSourceBindingPairs,
} from "../lib/research-candidate-review/shared-source-chain-guards.ts";
import {
  AUTOHUNT_WORKBENCH_READBACK_SPINE_BLOCKED_ACTIONS,
} from "../types/autohunt-workbench-readback-spine.ts";

const files = {
  type: "types/autohunt-workbench-readback-spine.ts",
  builder: "lib/autonomy/autohunt-workbench-readback-spine.ts",
  panel: "components/autonomy/autohunt-workbench-readback-spine-panel.tsx",
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
  smoke: "scripts/smoke-autohunt-workbench-readback-spine-v0-1.mjs",
  packageJson: "package.json",
  agentWorkplanePanelsSmoke: "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  preflightSmoke: "scripts/smoke-autohunt-preflight-packet-v0-1.mjs",
  queueCandidateSmoke: "scripts/smoke-autohunt-work-queue-candidate-v0-1.mjs",
  delegationGrantSmoke:
    "scripts/smoke-autonomy-delegation-grant-record-v0-1.mjs",
  sharedSourceGuardSmoke: "scripts/smoke-shared-source-chain-guards-v0-1.mjs",
  autonomyContractSmoke: "scripts/smoke-autonomy-contract-v0-1.mjs",
  autonomyRunnerPreflightSmoke:
    "scripts/smoke-autonomy-runner-preflight-v0-1.mjs",
  handoffPlanSmoke:
    "scripts/smoke-autohunt-handoff-plan-preview-v0-1.mjs",
  handoffPlanWorkbenchMountSmoke:
    "scripts/smoke-autohunt-handoff-plan-preview-workbench-mount-v0-1.mjs",
  operatorDecisionSmoke:
    "scripts/smoke-autohunt-handoff-plan-operator-review-decision-v0-1.mjs",
  operatorDecisionWorkbenchMountSmoke:
    "scripts/smoke-autohunt-handoff-plan-operator-review-decision-workbench-mount-v0-1.mjs",
};

const expectedChangedFiles = new Set(Object.values(files));
const source = Object.fromEntries(
  Object.entries(files).map(([key, filePath]) => {
    assert(existsSync(filePath), `${filePath} must exist`);
    return [key, readFileSync(filePath, "utf8")];
  }),
);

assertChangedFileBoundary();
assertTypeBuilderPanelAndMount();
assertNoSchemaRouteOrActionExpansion();
assertPackageScriptWiring();
assertBuilderBehavior();
assertPanelPassive();
assertForbiddenImportsAbsent();

console.log(
  JSON.stringify(
    {
      smoke: "autohunt-workbench-readback-spine-v0-1",
      pass: true,
      expected_changed_files_checked: true,
      docs_changed: false,
      type_checked: true,
      builder_checked: true,
      panel_passive_checked: true,
      package_script_checked: true,
      no_db_schema_or_route_added_checked: true,
      no_runner_or_external_import_checked: true,
      ready_spine_checked: true,
      missing_and_mismatch_statuses_checked: true,
      invalid_counts_checked: true,
      authority_boundary_checked: true,
      raw_material_absence_checked: true,
      workbench_mount_checked: true,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:autohunt-workbench-readback-spine-v0-1");

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
      `Unexpected changed file for autohunt workbench readback spine slice: ${file}`,
    );
    assert.doesNotMatch(file, /^docs\//, "readback spine slice must not edit docs");
    assert.doesNotMatch(file, /^README/i, "readback spine slice must not edit README");
    assert.doesNotMatch(file, /^app\/api\//, "readback spine slice must not add routes");
    assert.doesNotMatch(file, /package-lock|pnpm-lock|yarn\.lock/, "package lock must not change");
  }
}

function assertTypeBuilderPanelAndMount() {
  assertContains(source.type, [
    "AUTOHUNT_WORKBENCH_READBACK_SPINE_KIND",
    "AUTOHUNT_WORKBENCH_READBACK_SPINE_VERSION",
    "ready_for_supervised_handoff_planning",
    "missing_grant",
    "no_queued_candidates",
    "missing_preflight_packet",
    "invalid_record_attention",
    "AUTOHUNT_WORKBENCH_READBACK_SPINE_BLOCKED_ACTIONS",
    "AutohuntWorkbenchReadbackSpine",
    "raw_material_persisted: false",
    "spine_fingerprint",
  ]);
  assertContains(source.builder, [
    "buildAutohuntWorkbenchReadbackSpine",
    "validateSourceBindingPairs",
    "allValuesFalse",
    "fingerprint",
    "grant_to_candidates_bound",
    "candidates_to_preflight_bound",
    "candidate_fingerprints_match",
    "return \"ready_for_supervised_handoff_planning\"",
  ]);
  assertContains(source.panel, [
    "AutohuntWorkbenchReadbackSpinePanel",
    "Readback only",
    "starts no runner",
    "executes no Codex task",
    "calls no GitHub or provider",
    "creates no branch",
    "mutates no Perspective",
  ]);
  assertContains(source.agentWorkplane, [
    "AutohuntWorkbenchReadbackSpinePanel",
    "buildAutohuntWorkbenchReadbackSpine",
    "readAutonomyDelegationGrants",
    "readAutohuntWorkQueueCandidates",
    "readAutohuntPreflightPackets",
    "autohuntWorkbenchReadbackSpine",
  ]);
}

function assertNoSchemaRouteOrActionExpansion() {
  const changedFiles = uniqueSorted([
    ...collectGitFiles(["diff", "--name-only"]),
    ...collectGitFiles(["diff", "--cached", "--name-only"]),
    ...collectGitFiles(["ls-files", "--others", "--exclude-standard"]),
    ...getBaseRangeChangedFiles().files,
  ]);
  assert.equal(
    changedFiles.some((file) => /^app\/api\//.test(file)),
    false,
    "readback spine slice must not add app/api routes",
  );
  for (const file of changedFiles.filter((candidate) =>
    /^(lib\/db\.ts|lib\/db\/schema\.sql|scripts\/db-migrations\.mjs|scripts\/db-migrate\.mjs)$/.test(
      candidate,
    ),
  )) {
    assert(
      source[fileToSourceKey(file)]?.includes(
        "autohunt_handoff_plan_operator_review_decisions",
      ),
      `DB follow-on change must be limited to operator review decision table: ${file}`,
    );
  }
  for (const [name, text] of Object.entries({
    builder: source.builder,
    panel: source.panel,
  })) {
    assert.doesNotMatch(text, /CREATE\s+TABLE/i, `${name} must not create tables`);
    assert.doesNotMatch(text, /\bINSERT\b/i, `${name} must not insert rows`);
    assert.doesNotMatch(text, /\bUPDATE\b/i, `${name} must not update rows`);
    assert.doesNotMatch(text, /\bDELETE\b/i, `${name} must not delete rows`);
    assert.doesNotMatch(text, /\bfetch\s*\(/, `${name} must not fetch`);
    assert.doesNotMatch(text, /formAction/, `${name} must not expose form actions`);
    assert.doesNotMatch(text, /use server/i, `${name} must not use server directives`);
  }
}

function fileToSourceKey(file) {
  return {
    "lib/db.ts": "db",
    "lib/db/schema.sql": "schema",
    "scripts/db-migrations.mjs": "migrations",
    "scripts/db-migrate.mjs": "migrate",
  }[file];
}

function assertPackageScriptWiring() {
  assertPackageScript({
    packageJsonText: source.packageJson,
    scriptName: "smoke:autohunt-workbench-readback-spine-v0-1",
    expectedCommand:
      "tsx --tsconfig tsconfig.json scripts/smoke-autohunt-workbench-readback-spine-v0-1.mjs",
  });
}

function assertBuilderBehavior() {
  const readySpine = buildAutohuntWorkbenchReadbackSpine({
    grant_readback: makeGrantReadback(),
    queue_readback: makeQueueReadback(),
    preflight_readback: makePreflightReadback(),
    as_of: "2026-07-09T02:45:00.000Z",
  });
  assert.equal(
    readySpine.spine_status,
    "ready_for_supervised_handoff_planning",
  );
  assert.equal(readySpine.queued_candidate_summary.queued_candidate_count, 1);
  assert.equal(
    readySpine.ready_preflight_summary.selected_candidate_count,
    1,
  );
  assert.equal(readySpine.chain_binding.grant_to_candidates_bound, true);
  assert.equal(readySpine.chain_binding.candidates_to_preflight_bound, true);
  assert.equal(readySpine.chain_binding.grant_fingerprint_matches, true);
  assert.equal(readySpine.chain_binding.candidate_fingerprints_match, true);
  assert.equal(readySpine.raw_material_persisted, false);
  assert.equal(allValuesFalse(readySpine.authority_boundary), true);
  assert.deepEqual(
    readySpine.blocked_actions,
    [...AUTOHUNT_WORKBENCH_READBACK_SPINE_BLOCKED_ACTIONS],
  );
  assert.equal(
    readySpine.spine_fingerprint,
    computeSpineFingerprint(readySpine),
  );
  assertRawMaterialBoundary(readySpine);
  assert.equal(
    validateSourceBindingPairs([
      {
        field: "grant_to_candidate",
        expected: readySpine.latest_active_grant_summary.grant_fingerprint,
        actual: readySpine.ready_preflight_summary
          .preflight_packet_fingerprint
          ? "fnv1a32_canonical_json_v0_1:grant001"
          : null,
        reason: "smoke_binding_missing",
      },
    ]).passed,
    true,
  );

  assert.equal(
    buildAutohuntWorkbenchReadbackSpine({
      grant_readback: makeGrantReadback({ grant: null }),
      queue_readback: makeQueueReadback(),
      preflight_readback: makePreflightReadback(),
      as_of: "2026-07-09T02:46:00.000Z",
    }).spine_status,
    "missing_grant",
  );
  assert.equal(
    buildAutohuntWorkbenchReadbackSpine({
      grant_readback: makeGrantReadback(),
      queue_readback: makeQueueReadback({ candidates: [] }),
      preflight_readback: makePreflightReadback(),
      as_of: "2026-07-09T02:47:00.000Z",
    }).spine_status,
    "no_queued_candidates",
  );
  assert.equal(
    buildAutohuntWorkbenchReadbackSpine({
      grant_readback: makeGrantReadback(),
      queue_readback: makeQueueReadback(),
      preflight_readback: makePreflightReadback({ packet: null }),
      as_of: "2026-07-09T02:48:00.000Z",
    }).spine_status,
    "missing_preflight_packet",
  );
  const mismatchedCandidate = makeCandidate({
    candidate_fingerprint: "fnv1a32_canonical_json_v0_1:mismatch",
  });
  const mismatchSpine = buildAutohuntWorkbenchReadbackSpine({
    grant_readback: makeGrantReadback(),
    queue_readback: makeQueueReadback({ candidates: [mismatchedCandidate] }),
    preflight_readback: makePreflightReadback(),
    as_of: "2026-07-09T02:49:00.000Z",
  });
  assert.equal(mismatchSpine.spine_status, "blocked");
  assert.equal(mismatchSpine.chain_binding.candidate_fingerprints_match, false);

  const invalidSpine = buildAutohuntWorkbenchReadbackSpine({
    grant_readback: makeGrantReadback({ invalid_record_count: 1 }),
    queue_readback: makeQueueReadback({ invalid_record_count: 2 }),
    preflight_readback: makePreflightReadback({ invalid_record_count: 3 }),
    as_of: "2026-07-09T02:50:00.000Z",
  });
  assert.equal(invalidSpine.spine_status, "invalid_record_attention");
  assert.equal(
    invalidSpine.latest_active_grant_summary.invalid_grant_count,
    1,
  );
  assert.equal(
    invalidSpine.queued_candidate_summary.invalid_candidate_count,
    2,
  );
  assert.equal(invalidSpine.ready_preflight_summary.invalid_packet_count, 3);
}

function assertPanelPassive() {
  assert.doesNotMatch(source.panel, /<button\b/i);
  assert.doesNotMatch(source.panel, /\bonClick\b/);
  assert.doesNotMatch(source.panel, /\bfetch\s*\(/);
  assert.doesNotMatch(source.panel, /\bformAction\b/);
  assert.doesNotMatch(source.panel, /use server/i);
}

function assertForbiddenImportsAbsent() {
  const texts = {
    type: source.type,
    builder: source.builder,
    panel: source.panel,
  };
  for (const [name, text] of Object.entries(texts)) {
    const importLines = text
      .split("\n")
      .filter((line) => /^\s*import\b/.test(line))
      .join("\n");
    assert.doesNotMatch(importLines, /openai/i, `${name} must not import OpenAI/provider code`);
    assert.doesNotMatch(importLines, /github|octokit|@actions/i, `${name} must not import GitHub code`);
    assert.doesNotMatch(importLines, /codex/i, `${name} must not import Codex execution code`);
    assert.doesNotMatch(importLines, /retrieval|rag|vector|embedding|crawler/i, `${name} must not import retrieval code`);
    assert.doesNotMatch(importLines, /source-fetch|fetch-source/i, `${name} must not import source fetch code`);
  }
  const newAgentImports = source.agentWorkplane
    .split("\n")
    .filter(
      (line) =>
        /^\s*import\b/.test(line) &&
        /AutohuntWorkbenchReadbackSpinePanel|autohunt-workbench-readback-spine|read-autonomy-delegation-grants|read-autohunt-work-queue-candidates|read-autohunt-preflight-packets/.test(
          line,
        ),
    )
    .join("\n");
  assert.doesNotMatch(newAgentImports, /openai/i, "new Workplane imports must not import OpenAI/provider code");
  assert.doesNotMatch(newAgentImports, /github|octokit|@actions/i, "new Workplane imports must not import GitHub code");
  assert.doesNotMatch(newAgentImports, /codex/i, "new Workplane imports must not import Codex execution code");
  assert.doesNotMatch(newAgentImports, /retrieval|rag|vector|embedding|crawler/i, "new Workplane imports must not import retrieval code");
  assert.doesNotMatch(newAgentImports, /source-fetch|fetch-source/i, "new Workplane imports must not import source fetch code");
}

function makeGrantReadback({
  grant = makeGrant(),
  invalid_record_count = 0,
} = {}) {
  return {
    scope: "project:augnes",
    latest_active_grant: grant,
    active_grants: grant ? [grant] : [],
    invalid_record_count,
    no_run_no_execution_boundary: makeAuthorityBoundary(),
  };
}

function makeQueueReadback({
  candidates = [makeCandidate()],
  invalid_record_count = 0,
  blocker_reasons = [],
  warning_reasons = [],
} = {}) {
  return {
    scope: "project:augnes",
    source_grant_id_filter: "grant:active",
    candidate_status_filter: "queued",
    candidate_id_filter: null,
    candidates,
    queued_candidates: candidates,
    selected_queued_candidates: candidates,
    invalid_record_count,
    grant_fit_blocker_reasons: blocker_reasons,
    grant_fit_warning_reasons: warning_reasons,
    no_run_no_execution_boundary: makeAuthorityBoundary(),
  };
}

function makePreflightReadback({
  packet = makePreflightPacket(),
  invalid_record_count = 0,
  blocker_reasons = [],
  warning_reasons = [],
} = {}) {
  return {
    scope: "project:augnes",
    source_grant_id_filter: "grant:active",
    latest_ready_preflight_packet: packet,
    preflight_packets: packet ? [packet] : [],
    ready_preflight_packets: packet ? [packet] : [],
    invalid_record_count,
    preflight_blocker_reasons: blocker_reasons,
    preflight_warning_reasons: warning_reasons,
    no_run_no_execution_boundary: makeAuthorityBoundary(),
  };
}

function makeGrant() {
  return {
    grant_id: "grant:active",
    grant_fingerprint: "fnv1a32_canonical_json_v0_1:grant001",
    grant_status: "active",
    grant_mode: "work_queue_preflight_only",
    created_at: "2026-07-09T02:40:00.000Z",
    explicit_user_approval: {
      approval_ref: "approval:autohunt-spine",
      approval_text_fingerprint: "fnv1a32_canonical_json_v0_1:approval001",
    },
    budget: {
      time_limit_minutes: 30,
      max_iterations: 3,
      max_tool_calls: 20,
      max_codex_tasks: 0,
      max_draft_prs: 0,
      max_file_changes: 6,
      max_changed_files_per_pr: 6,
    },
  };
}

function makeCandidate(overrides = {}) {
  return {
    candidate_id: "candidate:queued",
    candidate_fingerprint: "fnv1a32_canonical_json_v0_1:candidate001",
    candidate_status: "queued",
    candidate_origin: "operator_supplied",
    source_grant: {
      grant_id: "grant:active",
      grant_fingerprint: "fnv1a32_canonical_json_v0_1:grant001",
    },
    work_class: "small_refactor",
    created_at: "2026-07-09T02:41:00.000Z",
    grant_fit: {
      blocker_reasons: [],
      warning_reasons: [],
    },
    ...overrides,
  };
}

function makePreflightPacket(overrides = {}) {
  return {
    preflight_packet_id: "preflight:ready",
    preflight_packet_fingerprint:
      "fnv1a32_canonical_json_v0_1:preflight001",
    preflight_status: "ready_for_supervised_handoff_planning",
    created_at: "2026-07-09T02:42:00.000Z",
    source_grant: {
      grant_id: "grant:active",
      grant_fingerprint: "fnv1a32_canonical_json_v0_1:grant001",
    },
    source_queue_readback: {
      selected_candidate_ids: ["candidate:queued"],
      selected_candidate_fingerprints: [
        "fnv1a32_canonical_json_v0_1:candidate001",
      ],
    },
    aggregate_budget_projection: {
      estimated_iterations: 1,
      estimated_tool_calls: 4,
      estimated_codex_tasks: 0,
      estimated_file_changes: 2,
      estimated_draft_prs: 0,
    },
    preflight_checks: {
      blocker_reasons: [],
      warning_reasons: [],
    },
    ...overrides,
  };
}

function makeAuthorityBoundary() {
  return {
    can_start_runner: false,
    can_schedule_runner: false,
    can_execute_codex: false,
    can_call_github: false,
    can_create_branch_or_pr: false,
    can_merge: false,
    can_deploy: false,
    can_publish_external: false,
    can_call_provider_or_openai: false,
    can_fetch_sources: false,
    can_run_retrieval: false,
    can_write_memory: false,
    can_promote_perspective: false,
    can_mutate_cwp: false,
    can_mutate_work: false,
    can_write_proof_or_evidence: false,
    can_auto_apply_delta: false,
  };
}

function computeSpineFingerprint(spine) {
  const { spine_fingerprint: _spineFingerprint, ...sourceForFingerprint } =
    spine;
  return fingerprint(sourceForFingerprint);
}

function assertRawMaterialBoundary(spine) {
  const scrubbed = stripAllowedRawMaterialBoundaryKeys(spine);
  assert.deepEqual(findForbiddenRawMaterialFields(scrubbed), []);
  assert.equal(containsForbiddenRawMaterial(scrubbed), false);
}

function stripAllowedRawMaterialBoundaryKeys(value) {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) {
    return value.map(stripAllowedRawMaterialBoundaryKeys);
  }
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== "raw_material_persisted")
      .map(([key, nestedValue]) => [
        key,
        stripAllowedRawMaterialBoundaryKeys(nestedValue),
      ]),
  );
}

function assertContains(text, snippets) {
  for (const snippet of snippets) {
    assert(
      text.includes(snippet),
      `Expected source to include ${JSON.stringify(snippet)}`,
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
