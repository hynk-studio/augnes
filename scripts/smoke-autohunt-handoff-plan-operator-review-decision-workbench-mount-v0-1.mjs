#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
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
  buildAutohuntHandoffPlanOperatorReviewDecisionAuthorityBoundary,
  readAutohuntHandoffPlanOperatorReviewDecisions,
} from "../lib/autonomy/read-autohunt-handoff-plan-operator-review-decisions.ts";
import {
  allValuesFalse,
  containsForbiddenRawMaterial,
} from "../lib/research-candidate-review/shared-source-chain-guards.ts";

const files = {
  agentWorkplane: "components/workplane/agent-workplane.tsx",
  decisionPanel:
    "components/autonomy/autohunt-handoff-plan-operator-review-decision-readback-panel.tsx",
  decisionReader:
    "lib/autonomy/read-autohunt-handoff-plan-operator-review-decisions.ts",
  decisionWriter:
    "lib/autonomy/autohunt-handoff-plan-operator-review-decision-write.ts",
  handoffPanel:
    "components/autonomy/autohunt-handoff-plan-preview-readback-panel.tsx",
  handoffReader: "lib/autonomy/read-autohunt-handoff-plan-previews.ts",
  smoke:
    "scripts/smoke-autohunt-handoff-plan-operator-review-decision-workbench-mount-v0-1.mjs",
  decisionSmoke:
    "scripts/smoke-autohunt-handoff-plan-operator-review-decision-v0-1.mjs",
  handoffMountSmoke:
    "scripts/smoke-autohunt-handoff-plan-preview-workbench-mount-v0-1.mjs",
  handoffPlanSmoke:
    "scripts/smoke-autohunt-handoff-plan-preview-v0-1.mjs",
  workbenchSpineSmoke:
    "scripts/smoke-autohunt-workbench-readback-spine-v0-1.mjs",
  preflightSmoke: "scripts/smoke-autohunt-preflight-packet-v0-1.mjs",
  queueCandidateSmoke: "scripts/smoke-autohunt-work-queue-candidate-v0-1.mjs",
  delegationGrantSmoke:
    "scripts/smoke-autonomy-delegation-grant-record-v0-1.mjs",
  sharedSourceGuardSmoke: "scripts/smoke-shared-source-chain-guards-v0-1.mjs",
  agentWorkplanePanelsSmoke: "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  autonomyContractSmoke: "scripts/smoke-autonomy-contract-v0-1.mjs",
  autonomyRunnerPreflightSmoke:
    "scripts/smoke-autonomy-runner-preflight-v0-1.mjs",
  localAutohuntChainDogfood:
    "scripts/dogfood-seed-local-autohunt-chain-v0-1.mjs",
  localAutohuntChainDogfoodSmoke:
    "scripts/smoke-local-autohunt-chain-dogfood-v0-1.mjs",
  copyExportType: "types/autohunt-handoff-copy-export-preview.ts",
  copyExportBuilder:
    "lib/autonomy/autohunt-handoff-copy-export-preview.ts",
  copyExportPanel:
    "components/autonomy/autohunt-handoff-copy-export-preview-panel.tsx",
  copyExportSmoke:
    "scripts/smoke-autohunt-handoff-copy-export-preview-v0-1.mjs",
  executionGateType: "types/autohunt-execution-readiness-gate.ts",
  executionGateBuilder:
    "lib/autonomy/autohunt-execution-readiness-gate.ts",
  executionGatePanel:
    "components/autonomy/autohunt-execution-readiness-gate-panel.tsx",
  executionGateSmoke:
    "scripts/smoke-autohunt-execution-readiness-gate-v0-1.mjs",
  packageJson: "package.json",
};

const expectedChangedFiles = new Set([
  files.agentWorkplane,
  files.smoke,
  files.packageJson,
  files.decisionSmoke,
  files.handoffMountSmoke,
  files.handoffPlanSmoke,
  files.workbenchSpineSmoke,
  files.preflightSmoke,
  files.queueCandidateSmoke,
  files.delegationGrantSmoke,
  files.sharedSourceGuardSmoke,
  files.agentWorkplanePanelsSmoke,
  files.autonomyContractSmoke,
  files.autonomyRunnerPreflightSmoke,
  files.localAutohuntChainDogfood,
  files.localAutohuntChainDogfoodSmoke,
  files.copyExportType,
  files.copyExportBuilder,
  files.copyExportPanel,
  files.copyExportSmoke,
  files.executionGateType,
  files.executionGateBuilder,
  files.executionGatePanel,
  files.executionGateSmoke,
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
assertExistingDecisionSmokeStillPasses();

console.log(
  JSON.stringify(
    {
      smoke:
        "autohunt-handoff-plan-operator-review-decision-workbench-mount-v0-1",
      pass: true,
      expected_changed_files_checked: true,
      docs_changed: false,
      no_db_schema_or_route_added_checked: true,
      server_side_readback_checked: true,
      render_order_checked: true,
      readback_import_checked: true,
      panel_import_checked: true,
      panel_passive_checked: true,
      write_helper_absent_from_workbench_checked: true,
      no_runner_or_external_authority_checked: true,
      no_auto_acceptance_checked: true,
      existing_operator_decision_smoke_passed: true,
    },
    null,
    2,
  ),
);
console.log(
  "PASS smoke:autohunt-handoff-plan-operator-review-decision-workbench-mount-v0-1",
);

function assertChangedFileBoundary() {
  const changedFiles = collectChangedFiles();
  for (const file of changedFiles) {
    assert(
      expectedChangedFiles.has(file),
      `Unexpected changed file for operator decision Workbench mount: ${file}`,
    );
    assert.doesNotMatch(file, /^docs\//, "mount slice must not edit docs");
    assert.doesNotMatch(file, /^README/i, "mount slice must not edit README");
    assert.doesNotMatch(file, /^app\/api\//, "mount slice must not add routes");
    assert.doesNotMatch(file, /^app\//, "mount slice must not change app surfaces");
    assert.doesNotMatch(
      file,
      /package-lock|pnpm-lock|yarn\.lock/,
      "package lock must not change",
    );
  }
}

function assertPackageScriptWiring() {
  assertPackageScript({
    packageJsonText: source.packageJson,
    scriptName:
      "smoke:autohunt-handoff-plan-operator-review-decision-workbench-mount-v0-1",
    expectedCommand:
      "tsx --tsconfig tsconfig.json scripts/smoke-autohunt-handoff-plan-operator-review-decision-workbench-mount-v0-1.mjs",
  });
}

function assertWorkbenchMount() {
  const agent = source.agentWorkplane;
  assertContains(agent, [
    "AutohuntHandoffPlanOperatorReviewDecisionReadbackPanel",
    "readAutohuntHandoffPlanOperatorReviewDecisions",
    "const autohuntSourceHandoffPlanId",
    "const autohuntHandoffPlanOperatorReviewDecisionReadback",
    "source_handoff_plan_id: autohuntSourceHandoffPlanId",
    'decision_status: "accepted_for_future_supervised_handoff_copy_export_planning"',
    "readback={autohuntHandoffPlanOperatorReviewDecisionReadback}",
  ]);

  assert(!agent.includes('"use client"'), "Agent Workplane must remain server-rendered");
  assert.doesNotMatch(
    agent,
    /writeAutohuntHandoffPlanOperatorReviewDecision/,
    "Agent Workplane must not import or call the decision write helper",
  );

  const readbackIndex = agent.indexOf(
    "const autohuntHandoffPlanOperatorReviewDecisionReadback",
  );
  const returnIndex = agent.indexOf("return (");
  assert(
    readbackIndex !== -1 && returnIndex !== -1 && readbackIndex < returnIndex,
    "Agent Workplane must construct decision readback server-side before render",
  );

  const handoffRenderIndex = agent.indexOf(
    "<AutohuntHandoffPlanPreviewReadbackPanel",
  );
  const decisionRenderIndex = agent.indexOf(
    "<AutohuntHandoffPlanOperatorReviewDecisionReadbackPanel",
    handoffRenderIndex,
  );
  const contractRenderIndex = agent.indexOf(
    "<AutonomyContractPreviewPanel",
    decisionRenderIndex,
  );
  assert(
    handoffRenderIndex !== -1 &&
      decisionRenderIndex !== -1 &&
      contractRenderIndex !== -1,
    "Agent Workplane must render handoff preview, decision, and autonomy contract panels",
  );
  assert(
    handoffRenderIndex < decisionRenderIndex &&
      decisionRenderIndex < contractRenderIndex,
    "Decision readback panel must render after handoff plan preview and before autonomy previews",
  );

  const constructionSnippet = agent.slice(
    readbackIndex,
    agent.indexOf("const selectedSessionDigestIntakePreview", readbackIndex),
  );
  assert.doesNotMatch(constructionSnippet, /\bfetch\s*\(/);
  assert.doesNotMatch(constructionSnippet, /\bINSERT\b|\bUPDATE\b|\bDELETE\b/i);
  assert.doesNotMatch(constructionSnippet, /\bformAction\b/);
  assert.doesNotMatch(constructionSnippet, /\bonClick\b/);
  assert.doesNotMatch(constructionSnippet, /\bwriteAutohunt/i);
}

function assertNoSchemaRouteOrActionExpansion() {
  const changedFiles = collectChangedFiles();
  for (const forbidden of [
    "lib/db.ts",
    "lib/db/schema.sql",
    "scripts/db-migrations.mjs",
    "scripts/db-migrate.mjs",
  ]) {
    assert(
      !changedFiles.includes(forbidden),
      `mount slice must not change schema or migration file: ${forbidden}`,
    );
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
  for (const [label, text] of Object.entries({
    agentWorkplane: source.agentWorkplane,
    panel: source.decisionPanel,
  })) {
    assert.doesNotMatch(text, /\bfetch\s*\(/, `${label} must not fetch`);
    assert.doesNotMatch(text, /formAction/, `${label} must not expose form actions`);
    assert.doesNotMatch(text, /use server/i, `${label} must not use server directives`);
    assert.doesNotMatch(text, /<button\b/i, `${label} must not add buttons`);
    assert.doesNotMatch(text, /\bonClick\b/, `${label} must not add click handlers`);
  }
}

function assertPanelPassive() {
  assertContains(source.decisionPanel, [
    "AutohuntHandoffPlanOperatorReviewDecisionReadbackPanel",
    "Passive operator decision readback only.",
    "Acceptance here is limited to",
    "starts no runner",
    "executes no Codex task",
    "calls no GitHub or provider service",
    "creates no branch or PR",
  ]);
  assert.doesNotMatch(source.decisionPanel, /<button\b/i);
  assert.doesNotMatch(source.decisionPanel, /\bonClick\b/);
  assert.doesNotMatch(source.decisionPanel, /\bfetch\s*\(/);
  assert.doesNotMatch(source.decisionPanel, /\bformAction\b/);
  assert.doesNotMatch(source.decisionPanel, /server action/i);
  assert.doesNotMatch(source.decisionPanel, /use server/i);
  assert.doesNotMatch(source.decisionPanel, /clipboard/i);
  assert.doesNotMatch(source.decisionPanel, /\bdownload\b/i);
}

function assertForbiddenImportsAbsent() {
  const relevantAgentImports = source.agentWorkplane
    .split("\n")
    .filter(
      (line) =>
        /^\s*import\b/.test(line) &&
        /AutohuntHandoffPlanOperatorReviewDecisionReadbackPanel|read-autohunt-handoff-plan-operator-review-decisions/.test(
          line,
        ),
    )
    .join("\n");
  assertContains(relevantAgentImports, [
    "AutohuntHandoffPlanOperatorReviewDecisionReadbackPanel",
    "readAutohuntHandoffPlanOperatorReviewDecisions",
  ]);
  const relevantSources = {
    agentWorkplaneDecisionImports: relevantAgentImports,
    decisionPanel: source.decisionPanel,
    decisionReader: source.decisionReader,
  };
  for (const [label, text] of Object.entries(relevantSources)) {
    const imports = text
      .split("\n")
      .filter((line) => /^\s*import\b/.test(line))
      .join("\n");
    assert.doesNotMatch(
      imports,
      /from\s+["'][^"']*(openai|provider|github|octokit|@actions)[^"']*["']/i,
      `${label} must not import provider/GitHub code`,
    );
    assert.doesNotMatch(
      imports,
      /from\s+["'][^"']*(retrieval|rag|embedding|vector|crawler|source-fetch|fetch-source)[^"']*["']/i,
      `${label} must not import retrieval or source-fetch code`,
    );
    assert.doesNotMatch(imports, /writeAutohuntHandoffPlanOperatorReviewDecision/);
  }
  assert.doesNotMatch(
    source.agentWorkplane,
    /accepted_for_future_supervised_handoff_copy_export_planning\s*:/,
    "Agent Workplane must not fabricate accepted decision objects",
  );
}

function assertReadbackBoundary() {
  const authorityBoundary =
    buildAutohuntHandoffPlanOperatorReviewDecisionAuthorityBoundary();
  assert.equal(allValuesFalse(authorityBoundary), true);

  const db = new Database(":memory:");
  try {
    const readback = readAutohuntHandoffPlanOperatorReviewDecisions({
      db,
      scope: "project:augnes",
      source_handoff_plan_id: "autohunt-handoff-plan:mount-smoke",
      decision_status:
        "accepted_for_future_supervised_handoff_copy_export_planning",
    });
    assert.equal(allValuesFalse(readback.no_run_no_execution_boundary), true);
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
    assert.equal(readback.selection_status, "no_decisions");
    assert.equal(readback.selected_decision, null);
  } finally {
    db.close();
  }

  assert.equal(
    containsForbiddenRawMaterial({
      source_handoff_plan_id: "autohunt-handoff-plan:mount-smoke",
      decision_status:
        "accepted_for_future_supervised_handoff_copy_export_planning",
      persisted_material_summary: {
        source_fingerprints_persisted: true,
        operator_decision_persisted: true,
        unsafe_material_persisted: false,
      },
    }),
    false,
    "safe decision mount material must not contain forbidden raw material fields",
  );
}

function assertExistingDecisionSmokeStillPasses() {
  execFileSync(
    "npm",
    ["run", "smoke:autohunt-handoff-plan-operator-review-decision-v0-1"],
    {
      cwd: process.cwd(),
      stdio: "pipe",
      encoding: "utf8",
    },
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
