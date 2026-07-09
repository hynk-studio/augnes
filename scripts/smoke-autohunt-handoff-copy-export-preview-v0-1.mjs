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
  buildAutohuntHandoffCopyExportPreview,
} from "../lib/autonomy/autohunt-handoff-copy-export-preview.ts";
import {
  computeAutohuntHandoffPlanOperatorReviewDecisionFingerprint,
} from "../lib/autonomy/read-autohunt-handoff-plan-operator-review-decisions.ts";
import {
  seedLocalAutohuntChainV01,
} from "./dogfood-seed-local-autohunt-chain-v0-1.mjs";
import {
  allValuesFalse,
  findForbiddenRawMaterialFields,
} from "../lib/research-candidate-review/shared-source-chain-guards.ts";

const files = {
  type: "types/autohunt-handoff-copy-export-preview.ts",
  builder: "lib/autonomy/autohunt-handoff-copy-export-preview.ts",
  panel: "components/autonomy/autohunt-handoff-copy-export-preview-panel.tsx",
  agentWorkplane: "components/workplane/agent-workplane.tsx",
  smoke: "scripts/smoke-autohunt-handoff-copy-export-preview-v0-1.mjs",
  executionGateType: "types/autohunt-execution-readiness-gate.ts",
  executionGateBuilder:
    "lib/autonomy/autohunt-execution-readiness-gate.ts",
  executionGatePanel:
    "components/autonomy/autohunt-execution-readiness-gate-panel.tsx",
  executionGateSmoke:
    "scripts/smoke-autohunt-execution-readiness-gate-v0-1.mjs",
  packageJson: "package.json",
  localAutohuntChainDogfood:
    "scripts/dogfood-seed-local-autohunt-chain-v0-1.mjs",
  localAutohuntChainDogfoodSmoke:
    "scripts/smoke-local-autohunt-chain-dogfood-v0-1.mjs",
  operatorDecisionMountSmoke:
    "scripts/smoke-autohunt-handoff-plan-operator-review-decision-workbench-mount-v0-1.mjs",
  operatorDecisionSmoke:
    "scripts/smoke-autohunt-handoff-plan-operator-review-decision-v0-1.mjs",
  handoffPlanWorkbenchMountSmoke:
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
};

const expectedChangedFiles = new Set(Object.values(files));
const source = Object.fromEntries(
  Object.entries(files).map(([key, filePath]) => {
    assert(existsSync(filePath), `${filePath} must exist`);
    return [key, readFileSync(filePath, "utf8")];
  }),
);

const SAFE_RAW_BOUNDARY_KEYS = new Set([
  "raw_copy_text_persisted",
  "raw_pr_body_persisted",
  "persists_raw_copy_text",
  "persists_raw_prompt_text",
  "persists_raw_pr_body",
  "persists_raw_operator_note",
  "persists_raw_source_payload",
  "persists_secret_or_token",
  "persists_url_or_env_value",
  "raw_material_absent",
  "expected_result_report_sections",
]);

assertChangedFileBoundary();
assertStaticWiring();
assertBuilderBehavior();
assertPanelPassive();
assertWorkbenchMount();
assertDogfoodSeedSmokeStillPasses();

console.log(
  JSON.stringify(
    {
      smoke: "autohunt-handoff-copy-export-preview-v0-1",
      pass: true,
      expected_changed_files_checked: true,
      docs_changed: false,
      no_db_schema_or_route_added_checked: true,
      type_checked: true,
      builder_checked: true,
      panel_passive_checked: true,
      package_script_checked: true,
      workbench_mount_checked: true,
      ready_preview_checked: true,
      refusal_statuses_checked: true,
      export_boundary_checked: true,
      raw_material_absence_checked: true,
      dogfood_seed_smoke_checked: true,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:autohunt-handoff-copy-export-preview-v0-1");

function assertChangedFileBoundary() {
  const changedFiles = collectChangedFiles();
  for (const file of changedFiles) {
    assert(
      expectedChangedFiles.has(file),
      `Unexpected changed file for autohunt handoff copy/export preview slice: ${file}`,
    );
    assert.doesNotMatch(file, /^docs\//, "copy/export preview must not edit docs");
    assert.doesNotMatch(file, /^README/i, "copy/export preview must not edit README");
    assert.doesNotMatch(file, /^app\/api\//, "copy/export preview must not add API routes");
    assert.doesNotMatch(file, /^(lib\/db\.ts|lib\/db\/schema\.sql|scripts\/db-migrations\.mjs|scripts\/db-migrate\.mjs)$/, "copy/export preview must not change DB schema or migrations");
  }
}

function assertStaticWiring() {
  assertPackageScript({
    packageJsonText: source.packageJson,
    scriptName: "smoke:autohunt-handoff-copy-export-preview-v0-1",
    expectedCommand:
      "tsx --tsconfig tsconfig.json scripts/smoke-autohunt-handoff-copy-export-preview-v0-1.mjs",
  });
  assertContains(source.type, [
    "AUTOHUNT_HANDOFF_COPY_EXPORT_PREVIEW_KIND",
    "ready_for_operator_copy_review",
    "raw_copy_text_persisted: false",
    "copy_button_rendered: false",
    "clipboard_written: false",
    "codex_executed: false",
    "github_called: false",
    "branch_or_pr_created: false",
  ]);
  assertContains(source.builder, [
    "buildAutohuntHandoffCopyExportPreview",
    "computeAutohuntHandoffPlanOperatorReviewDecisionFingerprint",
    "findForbiddenRawMaterialFields",
    "containsForbiddenRawMaterial",
    "allValuesFalse",
    "requiredStringFieldsPresent",
    "validateSourceBindingPairs",
    "copy_button_rendered: false",
    "file_download_rendered: false",
    "launch_button_rendered: false",
    "clipboard_written: false",
  ]);
  assertContains(source.panel, [
    "AutohuntHandoffCopyExportPreviewPanel",
    "Handoff Copy/Export Preview",
    "Object.entries(preview.export_boundary)",
    "Object.entries(preview.authority_boundary)",
    "raw_copy_text_persisted",
    "raw_pr_body_persisted",
  ]);
}

function assertBuilderBehavior() {
  const db = new Database(":memory:");
  try {
    const seed = seedLocalAutohuntChainV01({ db });
    assert.equal(seed.ok, true, JSON.stringify(seed.refusal_reasons ?? []));
    const acceptedReadback = seed.readbacks.operator_decision;
    const acceptedDecision = seed.records.operator_decision;
    const ready = buildAutohuntHandoffCopyExportPreview({
      source_operator_decision: acceptedReadback,
      as_of: "2026-07-09T07:20:00.000Z",
    });
    assert.equal(ready.preview_status, "ready_for_operator_copy_review");
    assert.equal(ready.validation.passed, true);
    assert.equal(
      ready.source_operator_decision.decision_status,
      "accepted_for_future_supervised_handoff_copy_export_planning",
    );
    assert.equal(
      ready.source_operator_decision.approval_scope,
      "future_supervised_handoff_copy_export_planning_only",
    );
    assert.equal(ready.copy_packet.raw_copy_text_persisted, false);
    assert.equal(ready.draft_pr_plan_preview.raw_pr_body_persisted, false);
    assert.equal(ready.export_boundary.export_ready_for_manual_copy, true);
    assert.equal(ready.export_boundary.copy_button_rendered, false);
    assert.equal(ready.export_boundary.file_download_rendered, false);
    assert.equal(ready.export_boundary.launch_button_rendered, false);
    assert.equal(ready.export_boundary.clipboard_written, false);
    assert.equal(ready.export_boundary.file_written, false);
    assert.equal(ready.export_boundary.codex_executed, false);
    assert.equal(ready.export_boundary.github_called, false);
    assert.equal(ready.export_boundary.branch_or_pr_created, false);
    assert.equal(allValuesFalse(ready.authority_boundary), true);
    assert.equal(ready.persisted_material_boundary.persists_raw_copy_text, false);
    assert.equal(ready.persisted_material_boundary.persists_raw_prompt_text, false);
    assert.equal(ready.persisted_material_boundary.persists_raw_pr_body, false);
    assertNoUnsafeMaterial(ready);

    const missing = buildAutohuntHandoffCopyExportPreview({
      source_operator_decision: null,
    });
    assert.equal(missing.preview_status, "missing_accepted_decision");

    const nonAccepted = buildAutohuntHandoffCopyExportPreview({
      source_operator_decision: {
        ...acceptedDecision,
        decision_status: "deferred",
        operator_decision: "defer_handoff_plan_review",
        decision_fingerprint:
          computeAutohuntHandoffPlanOperatorReviewDecisionFingerprint({
            ...acceptedDecision,
            decision_status: "deferred",
            operator_decision: "defer_handoff_plan_review",
          }),
      },
    });
    assert.equal(nonAccepted.preview_status, "source_decision_not_accepted");

    const mismatched = buildAutohuntHandoffCopyExportPreview({
      source_operator_decision: {
        ...acceptedDecision,
        decision_fingerprint: "fnv1a32_canonical_json_v0_1:badbad00",
      },
    });
    assert.equal(
      mismatched.preview_status,
      "source_decision_fingerprint_mismatch",
    );

    const missingBindingSource = {
      ...acceptedDecision,
      source_handoff_plan: {
        ...acceptedDecision.source_handoff_plan,
        handoff_plan_id: "",
      },
    };
    const missingBinding = buildAutohuntHandoffCopyExportPreview({
      source_operator_decision: {
        ...missingBindingSource,
        decision_fingerprint:
          computeAutohuntHandoffPlanOperatorReviewDecisionFingerprint(
            missingBindingSource,
          ),
      },
    });
    assert.equal(
      missingBinding.preview_status,
      "source_handoff_plan_binding_missing",
    );

    const unsafe = buildAutohuntHandoffCopyExportPreview({
      source_operator_decision: acceptedDecision,
      raw_material_probe: {
        raw_prompt_text: "do not persist this",
      },
    });
    assert.equal(unsafe.preview_status, "unsafe_material_refused");
  } finally {
    db.close();
  }
}

function assertPanelPassive() {
  assert.doesNotMatch(source.panel, /<button\b/i, "panel must not render buttons");
  assert.doesNotMatch(source.panel, /\bonClick\b/, "panel must not add click handlers");
  assert.doesNotMatch(source.panel, /\bfetch\s*\(/, "panel must not fetch");
  assert.doesNotMatch(source.panel, /formAction/, "panel must not add form actions");
  assert.doesNotMatch(source.panel, /use server/i, "panel must not add server actions");
  assert.doesNotMatch(source.panel, /navigator\.clipboard|clipboard\.writeText/i, "panel must not write clipboard");
  assert.doesNotMatch(source.panel, /<a\b/i, "panel must not render download links");
  assert.doesNotMatch(source.panel, /download\s*=/i, "panel must not render downloads");
  assert.doesNotMatch(source.panel, /textarea/i, "panel must not render raw prompt text areas");
}

function assertWorkbenchMount() {
  assertContains(source.agentWorkplane, [
    "AutohuntHandoffCopyExportPreviewPanel",
    "buildAutohuntHandoffCopyExportPreview",
    "const autohuntHandoffCopyExportPreview",
    "source_operator_decision:\n        autohuntHandoffPlanOperatorReviewDecisionReadback",
    "<AutohuntHandoffCopyExportPreviewPanel",
  ]);
  const decisionPanelIndex = source.agentWorkplane.indexOf(
    "<AutohuntHandoffPlanOperatorReviewDecisionReadbackPanel",
  );
  const copyExportPanelIndex = source.agentWorkplane.indexOf(
    "<AutohuntHandoffCopyExportPreviewPanel",
  );
  const autonomyContractIndex = source.agentWorkplane.indexOf(
    "<AutonomyContractPreviewPanel",
  );
  assert(decisionPanelIndex !== -1, "operator decision panel must be mounted");
  assert(copyExportPanelIndex !== -1, "copy/export preview panel must be mounted");
  assert(
    decisionPanelIndex < copyExportPanelIndex &&
      copyExportPanelIndex < autonomyContractIndex,
    "copy/export preview panel must render after operator decision and before autonomy contract panels",
  );
  assert.doesNotMatch(
    source.agentWorkplane,
    /\bwriteAutonomyDelegationGrant\b|\bwriteAutohuntWorkQueueCandidate\b|\bwriteAutohuntPreflightPacket\b|\bwriteAutohuntHandoffPlanPreview\b|\bwriteAutohuntHandoffPlanOperatorReviewDecision\b/,
    "Agent Workplane must not call Autohunt write helpers",
  );
  assert.doesNotMatch(
    source.agentWorkplane,
    /\bfetch\s*\(|\b(callGithub|callOpenAI|executeCodex|runRetrieval|fetchSources|createBranch|openPullRequest)\s*\(/i,
    "Agent Workplane must not add fetch/GitHub/Codex/provider/retrieval calls",
  );
}

function assertDogfoodSeedSmokeStillPasses() {
  execFileSync("npm", ["run", "smoke:local-autohunt-chain-dogfood-v0-1"], {
    cwd: process.cwd(),
    stdio: "pipe",
    env: {
      ...process.env,
    },
  });
}

function assertContains(text, values) {
  for (const value of values) {
    assert(
      text.includes(value),
      `Expected source to include ${JSON.stringify(value)}`,
    );
  }
}

function assertNoUnsafeMaterial(preview) {
  const scrubbed = stripSafeRawBoundaryKeys(preview);
  assert.deepEqual(findForbiddenRawMaterialFields(scrubbed), []);
  const serialized = JSON.stringify(scrubbed);
  assert.doesNotMatch(serialized, /raw_prompt|raw_pr_body|raw_review_note|raw_reason_text|raw_source_payload|raw_copy_text/i);
  assert.doesNotMatch(serialized, /\b(token|secret|credential|api_key|authorization|cookie|password)\b/i);
  assert.doesNotMatch(serialized, /\bhttps?:\/\//i);
  assert.doesNotMatch(serialized, /\b[A-Z][A-Z0-9_]*_ENV\b/);
}

function stripSafeRawBoundaryKeys(value) {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(stripSafeRawBoundaryKeys);
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !SAFE_RAW_BOUNDARY_KEYS.has(key))
      .map(([key, nested]) => [key, stripSafeRawBoundaryKeys(nested)]),
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
