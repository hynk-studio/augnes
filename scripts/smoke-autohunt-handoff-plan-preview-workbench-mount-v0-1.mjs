#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import Database from "better-sqlite3";

import {
  assertPackageScript,
  collectGitDiffFiles,
  collectUntrackedFiles,
  getBaseRangeChangedFiles,
  uniqueSorted,
} from "./smoke-boundary-common.mjs";
import {
  buildAutohuntHandoffPlanPreviewAuthorityBoundary,
  readAutohuntHandoffPlanPreviews,
} from "../lib/autonomy/read-autohunt-handoff-plan-previews.ts";
import {
  allValuesFalse,
  containsForbiddenRawMaterial,
} from "../lib/research-candidate-review/shared-source-chain-guards.ts";
import {
  AUTOHUNT_HANDOFF_PLAN_PREVIEW_AUTHORITY_FLAG_NAMES,
} from "../types/autohunt-handoff-plan-preview.ts";

const files = {
  agentWorkplane: "components/workplane/agent-workplane.tsx",
  handoffPanel:
    "components/autonomy/autohunt-handoff-plan-preview-readback-panel.tsx",
  handoffReader: "lib/autonomy/read-autohunt-handoff-plan-previews.ts",
  operatorDecisionType:
    "types/autohunt-handoff-plan-operator-review-decision.ts",
  operatorDecisionWriter:
    "lib/autonomy/autohunt-handoff-plan-operator-review-decision-write.ts",
  operatorDecisionReader:
    "lib/autonomy/read-autohunt-handoff-plan-operator-review-decisions.ts",
  operatorDecisionPanel:
    "components/autonomy/autohunt-handoff-plan-operator-review-decision-readback-panel.tsx",
  workbenchSpinePanel:
    "components/autonomy/autohunt-workbench-readback-spine-panel.tsx",
  db: "lib/db.ts",
  schema: "lib/db/schema.sql",
  migrations: "scripts/db-migrations.mjs",
  migrate: "scripts/db-migrate.mjs",
  smoke: "scripts/smoke-autohunt-handoff-plan-preview-workbench-mount-v0-1.mjs",
  operatorDecisionSmoke:
    "scripts/smoke-autohunt-handoff-plan-operator-review-decision-v0-1.mjs",
  operatorDecisionWorkbenchMountSmoke:
    "scripts/smoke-autohunt-handoff-plan-operator-review-decision-workbench-mount-v0-1.mjs",
  packageJson: "package.json",
  agentWorkplanePanelsSmoke: "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  handoffPlanSmoke:
    "scripts/smoke-autohunt-handoff-plan-preview-v0-1.mjs",
  workbenchSpineSmoke:
    "scripts/smoke-autohunt-workbench-readback-spine-v0-1.mjs",
  preflightSmoke: "scripts/smoke-autohunt-preflight-packet-v0-1.mjs",
  queueCandidateSmoke: "scripts/smoke-autohunt-work-queue-candidate-v0-1.mjs",
  delegationGrantSmoke:
    "scripts/smoke-autonomy-delegation-grant-record-v0-1.mjs",
  sharedSourceGuardSmoke: "scripts/smoke-shared-source-chain-guards-v0-1.mjs",
  autonomyContractSmoke: "scripts/smoke-autonomy-contract-v0-1.mjs",
  autonomyRunnerPreflightSmoke:
    "scripts/smoke-autonomy-runner-preflight-v0-1.mjs",
  localAutohuntChainDogfood:
    "scripts/dogfood-seed-local-autohunt-chain-v0-1.mjs",
  localAutohuntChainDogfoodSmoke:
    "scripts/smoke-local-autohunt-chain-dogfood-v0-1.mjs",
};

const expectedChangedFiles = new Set([
  files.agentWorkplane,
  files.operatorDecisionType,
  files.operatorDecisionWriter,
  files.operatorDecisionReader,
  files.operatorDecisionPanel,
  files.db,
  files.schema,
  files.migrations,
  files.migrate,
  files.smoke,
  files.operatorDecisionSmoke,
  files.operatorDecisionWorkbenchMountSmoke,
  files.packageJson,
  files.agentWorkplanePanelsSmoke,
  files.handoffPlanSmoke,
  files.workbenchSpineSmoke,
  files.preflightSmoke,
  files.queueCandidateSmoke,
  files.delegationGrantSmoke,
  files.sharedSourceGuardSmoke,
  files.autonomyContractSmoke,
  files.autonomyRunnerPreflightSmoke,
  files.localAutohuntChainDogfood,
  files.localAutohuntChainDogfoodSmoke,
]);
const source = Object.fromEntries(
  Object.entries(files).map(([key, filePath]) => {
    assert(existsSync(filePath), `${filePath} must exist`);
    return [key, readFileSync(filePath, "utf8")];
  }),
);

assertChangedFileBoundary();
assertPackageScriptWiring();
assertWorkbenchMount();
assertNoSchemaRouteOrActionExpansion();
assertPanelPassive();
assertForbiddenImportsAbsent();
assertReadbackBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "autohunt-handoff-plan-preview-workbench-mount-v0-1",
      pass: true,
      expected_changed_files_checked: true,
      docs_changed: false,
      no_db_schema_or_route_added_checked: true,
      workbench_readback_import_checked: true,
      workbench_panel_import_checked: true,
      server_side_readback_checked: true,
      render_order_checked: true,
      panel_passive_checked: true,
      write_helper_absent_from_workbench_checked: true,
      no_runner_or_external_authority_checked: true,
      raw_material_absence_checked: true,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:autohunt-handoff-plan-preview-workbench-mount-v0-1");

function assertChangedFileBoundary() {
  const changedFiles = collectChangedFiles();

  for (const file of changedFiles) {
    assert(
      expectedChangedFiles.has(file),
      `Unexpected changed file for autohunt handoff plan preview Workbench mount: ${file}`,
    );
    assert.doesNotMatch(file, /^docs\//, "mount slice must not edit docs");
    assert.doesNotMatch(file, /^README/i, "mount slice must not edit README");
    assert.doesNotMatch(file, /^app\/api\//, "mount slice must not add routes");
    assert.doesNotMatch(file, /^app\//, "mount slice must not change app surfaces");
    assert.doesNotMatch(file, /package-lock|pnpm-lock|yarn\.lock/, "package lock must not change");
  }
}

function assertPackageScriptWiring() {
  assertPackageScript({
    packageJsonText: source.packageJson,
    scriptName: "smoke:autohunt-handoff-plan-preview-workbench-mount-v0-1",
    expectedCommand:
      "tsx --tsconfig tsconfig.json scripts/smoke-autohunt-handoff-plan-preview-workbench-mount-v0-1.mjs",
  });
}

function assertWorkbenchMount() {
  const agent = source.agentWorkplane;
  assertContains(agent, [
    "AutohuntHandoffPlanPreviewReadbackPanel",
    "readAutohuntHandoffPlanPreviews",
    "const autohuntHandoffPlanPreviewReadback",
    "source_grant_id: autohuntSourceGrantId",
    'handoff_plan_status: "ready_for_operator_review"',
    "readback={autohuntHandoffPlanPreviewReadback}",
  ]);

  assert(!agent.includes('"use client"'), "Agent Workplane must remain server-rendered");
  assert(!agent.includes("writeAutohuntHandoffPlanPreview"), "Agent Workplane must not invoke the write helper");

  const readbackIndex = agent.indexOf(
    "const autohuntHandoffPlanPreviewReadback",
  );
  const returnIndex = agent.indexOf("return (");
  assert(
    readbackIndex !== -1 && returnIndex !== -1 && readbackIndex < returnIndex,
    "Agent Workplane must construct handoff plan readback server-side before render",
  );

  const spineRenderIndex = agent.indexOf("<AutohuntWorkbenchReadbackSpinePanel");
  const handoffRenderIndex = agent.indexOf(
    "<AutohuntHandoffPlanPreviewReadbackPanel",
    spineRenderIndex,
  );
  const contractRenderIndex = agent.indexOf(
    "<AutonomyContractPreviewPanel",
    handoffRenderIndex,
  );
  assert(
    spineRenderIndex !== -1 &&
      handoffRenderIndex !== -1 &&
      contractRenderIndex !== -1,
    "Agent Workplane must render the spine, handoff panel, and autonomy contract panel",
  );
  assert(
    spineRenderIndex < handoffRenderIndex &&
      handoffRenderIndex < contractRenderIndex,
    "Handoff plan readback panel must render after the Autohunt spine and before autonomy previews",
  );

  const constructionSnippet = agent.slice(
    readbackIndex,
    agent.indexOf("const selectedSessionDigestIntakePreview", readbackIndex),
  );
  assert.doesNotMatch(constructionSnippet, /\bfetch\s*\(/);
  assert.doesNotMatch(constructionSnippet, /\bINSERT\b|\bUPDATE\b|\bDELETE\b/i);
  assert.doesNotMatch(constructionSnippet, /\bformAction\b/);
  assert.doesNotMatch(constructionSnippet, /\bonClick\b/);
}

function assertNoSchemaRouteOrActionExpansion() {
  const changedFiles = collectChangedFiles();
  for (const forbidden of [
    "lib/db.ts",
    "lib/db/schema.sql",
    "scripts/db-migrations.mjs",
    "scripts/db-migrate.mjs",
  ]) {
    if (changedFiles.includes(forbidden)) {
      assert(
        source[fileToSourceKey(forbidden)].includes(
          "autohunt_handoff_plan_operator_review_decisions",
        ),
        `DB follow-on change must be limited to operator review decision table: ${forbidden}`,
      );
    }
  }
  assert.equal(
    changedFiles.some((file) => /^app\/api\//.test(file)),
    false,
    "mount slice must not add app/api routes",
  );
  assert.equal(
    changedFiles.some((file) => /^app\//.test(file)),
    false,
    "mount slice must not alter app route surfaces",
  );
}

function fileToSourceKey(file) {
  return {
    "lib/db.ts": "db",
    "lib/db/schema.sql": "schema",
    "scripts/db-migrations.mjs": "migrations",
    "scripts/db-migrate.mjs": "migrate",
  }[file];
}

function assertPanelPassive() {
  assertContains(source.handoffPanel, [
    "AutohuntHandoffPlanPreviewReadbackPanel",
    "Passive handoff plan preview readback only.",
    "launches no runner",
    "schedules nothing",
    "executes no Codex task",
    "calls no GitHub or provider service",
    "creates no branch or PR",
    "writes no durable state",
  ]);
  assert.doesNotMatch(source.handoffPanel, /<button\b/i);
  assert.doesNotMatch(source.handoffPanel, /\bonClick\b/);
  assert.doesNotMatch(source.handoffPanel, /\bfetch\s*\(/);
  assert.doesNotMatch(source.handoffPanel, /\bformAction\b/);
  assert.doesNotMatch(source.handoffPanel, /server action/i);
  assert.doesNotMatch(source.handoffPanel, /use server/i);
  assert.doesNotMatch(source.handoffPanel, /clipboard/i);
  assert.doesNotMatch(source.handoffPanel, /\bdownload\b/i);
}

function assertForbiddenImportsAbsent() {
  const agentImportLines = source.agentWorkplane
    .split("\n")
    .filter(
      (line) =>
        /^\s*import\b/.test(line) &&
        /AutohuntHandoffPlanPreviewReadbackPanel|read-autohunt-handoff-plan-previews/.test(
          line,
        ),
    )
    .join("\n");
  assertContains(agentImportLines, [
    "AutohuntHandoffPlanPreviewReadbackPanel",
    "readAutohuntHandoffPlanPreviews",
  ]);
  assert.doesNotMatch(agentImportLines, /openai|provider|github|octokit|@actions/i);
  assert.doesNotMatch(agentImportLines, /retrieval|rag|vector|embedding|crawler/i);
  assert.doesNotMatch(agentImportLines, /source-fetch|fetch-source/i);
  assert.doesNotMatch(agentImportLines, /writeAutohuntHandoffPlanPreview/);

  for (const [label, text] of Object.entries({
    handoffPanel: source.handoffPanel,
    handoffReader: source.handoffReader,
  })) {
    const imports = text
      .split("\n")
      .filter((line) => /^\s*import\b/.test(line))
      .join("\n");
    assert.doesNotMatch(imports, /from\s+["'][^"']*(openai|provider|github|octokit)[^"']*["']/i, `${label} must not import provider/GitHub code`);
    assert.doesNotMatch(imports, /from\s+["'][^"']*(retrieval|rag|embedding|vector|crawler|source-fetch)[^"']*["']/i, `${label} must not import retrieval or source-fetch code`);
    assert.doesNotMatch(text, /\bfetch\s*\(/, `${label} must not fetch`);
  }
}

function assertReadbackBoundary() {
  const authorityBoundary = buildAutohuntHandoffPlanPreviewAuthorityBoundary();
  assert.deepEqual(
    Object.keys(authorityBoundary).sort(),
    [...AUTOHUNT_HANDOFF_PLAN_PREVIEW_AUTHORITY_FLAG_NAMES].sort(),
  );
  assert.equal(allValuesFalse(authorityBoundary), true);

  const db = new Database(":memory:");
  try {
    const readback = readAutohuntHandoffPlanPreviews({
      db,
      scope: "project:augnes",
      source_grant_id: null,
      handoff_plan_status: "ready_for_operator_review",
    });
    assert.equal(
      allValuesFalse(readback.no_run_no_execution_boundary),
      true,
    );
    assert.equal(readback.raw_material_persisted, false);
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
  } finally {
    db.close();
  }

  assert.equal(
    containsForbiddenRawMaterial({
      source_grant_id: "grant:readback-mount",
      handoff_plan_status: "ready_for_operator_review",
      persisted_material_summary: {
        source_fingerprints_persisted: true,
        handoff_plan_policy_persisted: true,
        unsafe_material_persisted: false,
      },
    }),
    false,
    "safe readback mount material must not contain forbidden raw material fields",
  );
}

function collectChangedFiles() {
  return uniqueSorted([
    ...collectGitDiffFiles(["diff", "--name-only"]).files,
    ...collectGitDiffFiles(["diff", "--cached", "--name-only"]).files,
    ...collectUntrackedFiles(),
    ...getBaseRangeChangedFiles().files,
  ]);
}

function assertContains(text, phrases) {
  const normalizedText = text.replace(/\s+/g, " ");
  for (const phrase of phrases) {
    assert(
      normalizedText.includes(phrase.replace(/\s+/g, " ")),
      `Expected source to contain ${JSON.stringify(phrase)}`,
    );
  }
}
