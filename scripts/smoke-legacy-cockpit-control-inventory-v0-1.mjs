#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

import {
  assertContainsAll,
  assertPackageScript,
  collectGitDiffFiles,
  collectUntrackedFiles,
  getBaseRangeChangedFiles,
  loadTextByFile,
  uniqueSorted,
} from "./smoke-boundary-common.mjs";

const typeFile = "types/legacy-cockpit-control-inventory.ts";
const helperFile = "lib/workplane/legacy-cockpit-control-inventory.ts";
const docFile =
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_CONTROL_INVENTORY_V0_1.md";
const smokeFile = "scripts/smoke-legacy-cockpit-control-inventory-v0-1.mjs";
const packageJsonFile = "package.json";
const indexDoc = "docs/00_INDEX_LATEST.md";
const classificationDoc =
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_LOCAL_CONTROL_CLASSIFICATION_V0_1.md";
const baselineDoc = "docs/AUGNES_DOGFOOD_METRICS_BASELINE_V0_2.md";
const shrinkPlanDoc =
  "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_SHRINK_PLAN_V0_1.md";
const shrinkDoc = "docs/AGENT_WORKPLANE_LEGACY_COCKPIT_SHRINK_V0_1.md";
const browserRegressionDoc =
  "docs/AGENT_WORKPLANE_NATIVE_REPLACEMENT_BROWSER_REGRESSION_V0_1.md";
const agentWorkplaneDoc = "docs/AGENT_WORKPLANE_V0_1.md";
const reviewMemoryDoc =
  "docs/AGENT_WORKPLANE_REVIEW_MEMORY_DETAIL_V0_1.md";
const dogfoodDoc = "docs/AUGNES_ON_AUGNES_DOGFOOD_V0_1.md";
const metricsDoc = "docs/AUGNES_WORKFLOW_METRICS_V0_1.md";
const agentWorkplaneFile = "components/workplane/agent-workplane.tsx";
const augnesCockpitFile = "components/augnes-cockpit.tsx";
const cockpitPageFile = "app/cockpit/page.tsx";
const legacyCompatibilityPanelFile =
  "components/workplane/legacy-cockpit-compatibility-panel.tsx";

const inventorySliceFiles = [
  typeFile,
  helperFile,
  docFile,
  smokeFile,
  packageJsonFile,
  indexDoc,
  classificationDoc,
  baselineDoc,
  shrinkPlanDoc,
  shrinkDoc,
  browserRegressionDoc,
  agentWorkplaneDoc,
  reviewMemoryDoc,
  dogfoodDoc,
  metricsDoc,
];

const existingSmokeAllowlistFiles = [
  "scripts/smoke-augnes-dogfood-metrics-baseline-v0-2.mjs",
  "scripts/smoke-legacy-cockpit-local-control-classification-v0-1.mjs",
  "scripts/smoke-agent-workplane-run-postmortem-detail-v0-1.mjs",
  "scripts/smoke-agent-workplane-review-memory-detail-v0-1.mjs",
  "scripts/smoke-agent-workplane-bridge-trace-detail-v0-1.mjs",
  "scripts/smoke-workplane-native-browser-regression-v0-1.mjs",
  "scripts/smoke-augnes-on-augnes-dogfood-v0-1.mjs",
  "scripts/smoke-runner-workplane-metrics-v0-1.mjs",
  "scripts/smoke-agent-workplane-legacy-cockpit-shrink-plan-v0-1.mjs",
  "scripts/smoke-autonomy-runner-v0-1.mjs",
];

const allowedChangedFiles = new Set([
  ...inventorySliceFiles,
  ...existingSmokeAllowlistFiles,
  cockpitPageFile,
  agentWorkplaneFile,
  legacyCompatibilityPanelFile,
  "lib/workplane/workplane-browser-regression.ts",
  "docs/AGENT_WORKPLANE_COCKPIT_CAPABILITY_INVENTORY_V0_1.md",
  "docs/AGENT_WORKPLANE_NATIVE_ABSORPTION_MAP_V0_1.md",
  "scripts/smoke-agent-workplane-legacy-cockpit-shrink-v0-1.mjs",
  "scripts/smoke-agent-workplane-shell-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "scripts/smoke-agent-workplane-projection-handoff-v0-1.mjs",
  "scripts/smoke-agent-workplane-cleanup-hardening-v0-1.mjs",
  "scripts/smoke-agent-workplane-cockpit-inheritance-v0-1.mjs",
]);

const requiredFiles = [
  ...inventorySliceFiles,
  agentWorkplaneFile,
  augnesCockpitFile,
  legacyCompatibilityPanelFile,
];

const requiredControlClasses = [
  "read_only",
  "copy_only",
  "preview_only",
  "local_write",
  "forbidden",
  "unknown",
];

const requiredEvidenceKinds = [
  "server_rendered_html",
  "manual_dom_review",
  "static_source",
  "classification_v0_1",
];

const requiredEvidenceStatuses = [
  "observed",
  "inferred",
  "not_observed",
  "needs_manual_review",
];

const requiredAuthorityFields = [
  "can_write_product_db",
  "can_delete_legacy_cockpit",
  "can_shrink_legacy_cockpit",
  "can_hide_legacy_cockpit",
  "can_change_product_ui_behavior",
  "can_add_product_route",
  "can_add_api_write_route",
  "can_add_server_action",
  "can_add_chat_composer",
  "can_call_provider_openai",
  "can_call_github",
  "can_actuate_github",
  "can_execute_codex",
  "can_execute_runner_in_product",
  "can_tick_runner_in_product",
  "can_recover_delta_batch_in_product",
  "can_schedule_runner_in_product",
  "can_record_proof",
  "can_create_evidence",
  "can_apply_durable_memory",
  "can_apply_perspective",
  "can_auto_apply_delta",
  "can_merge_publish_retry_replay_deploy",
  "can_absorb_local_write_control_without_contract",
  "can_approve_proposal",
  "can_reject_proposal",
  "can_commit_proposal",
];

const requiredHelperExports = [
  "buildLegacyCockpitControlInventoryReport",
  "buildLegacyCockpitProposalDiffPreflight",
  "compareAgainstLegacyCockpitLocalControlClassification",
  "LEGACY_COCKPIT_CONTROL_INVENTORY_SMOKE_REFS",
  "LEGACY_COCKPIT_CONTROL_INVENTORY_REQUIRED_DOCS",
  "LEGACY_COCKPIT_CONTROL_INVENTORY_EVIDENCE_LABELS",
];

const textByFile = loadTextByFile(requiredFiles);
const typeText = textByFile.get(typeFile);
const helperText = textByFile.get(helperFile);
const docText = textByFile.get(docFile);
const packageJsonText = textByFile.get(packageJsonFile);
const indexText = textByFile.get(indexDoc);
const classificationDocText = textByFile.get(classificationDoc);
const baselineDocText = textByFile.get(baselineDoc);
const shrinkPlanDocText = textByFile.get(shrinkPlanDoc);
const browserRegressionDocText = textByFile.get(browserRegressionDoc);
const agentWorkplaneDocText = textByFile.get(agentWorkplaneDoc);
const reviewMemoryDocText = textByFile.get(reviewMemoryDoc);
const dogfoodDocText = textByFile.get(dogfoodDoc);
const metricsDocText = textByFile.get(metricsDoc);
const agentWorkplaneText = textByFile.get(agentWorkplaneFile);
const augnesCockpitText = textByFile.get(augnesCockpitFile);
const legacyCompatibilityPanelText = textByFile.get(
  legacyCompatibilityPanelFile,
);

assertPackageScript({
  packageJsonText,
  scriptName: "smoke:legacy-cockpit-control-inventory-v0-1",
  expectedCommand: "node scripts/smoke-legacy-cockpit-control-inventory-v0-1.mjs",
});

assertDocsAndPointers();
assertTypeContract();
assertHelperStaticShape();
const behavior = assertHelperBehavior();
assertCompatibilityStillRendered();
assertChangedFileBoundary();
assertNoSourceDeletion();
assertNoRouteOrAuthorityPathAdded();
assertNoProductComponentBehaviorFilesChanged();
assertNoLegacyCockpitDeletionOrShrink();

console.log(
  JSON.stringify(
    {
      smoke: "legacy-cockpit-control-inventory-v0-1",
      pass: true,
      type_exists: existsSync(typeFile),
      helper_exists: existsSync(helperFile),
      doc_exists: existsSync(docFile),
      package_script_checked: true,
      docs_backlinks_checked: true,
      required_control_classes_checked: requiredControlClasses,
      required_evidence_kinds_checked: requiredEvidenceKinds,
      required_evidence_statuses_checked: requiredEvidenceStatuses,
      authority_fields_checked: requiredAuthorityFields,
      helper_exports_checked: true,
      unknown_before:
        behavior.evidenceReport.comparison_to_v0_1_classification
          .previous_unknown_count,
      unknown_after_with_evidence:
        behavior.evidenceReport.comparison_to_v0_1_classification
          .after_unknown_count,
      unknown_after_without_evidence:
        behavior.noEvidenceReport.comparison_to_v0_1_classification
          .after_unknown_count,
      unknown_reduction_claim:
        behavior.evidenceReport.comparison_to_v0_1_classification
          .unknown_reduction_claim,
      proposal_diff_preflight_status:
        behavior.evidenceReport.proposal_diff_preflight.status,
      proposal_diff_needs_richer_detail:
        behavior.evidenceReport.proposal_diff_preflight
          .needs_richer_proposal_diff_detail,
      compatibility_marker_present:
        behavior.evidenceReport.compatibility_marker_present,
      server_rendered_compatibility_content_present:
        behavior.evidenceReport.server_rendered_compatibility_content_present,
      local_write_controls_still_compatibility_only:
        behavior.evidenceReport.comparison_to_v0_1_classification
          .local_write_controls_still_compatibility_only,
      forbidden_controls_still_forbidden:
        behavior.evidenceReport.comparison_to_v0_1_classification
          .forbidden_controls_still_forbidden,
      shrink_readiness_status: behavior.evidenceReport.shrink_readiness.status,
      changed_files_allowed: [...allowedChangedFiles],
    },
    null,
    2,
  ),
);
console.log("PASS smoke:legacy-cockpit-control-inventory-v0-1");

function assertDocsAndPointers() {
  assertContainsAll(docText, [
    "unknown local UI control blocker",
    "proposal diff readiness preflight",
    "No Legacy Cockpit functionality was deleted, hidden, disabled, or absorbed",
    "moved the full Cockpit from the `/workbench` compatibility island to the explicit `/cockpit` compatibility route",
    "Future native absorption of retained local-write/manual controls requires a separate authority contract",
    "no product route beyond the explicit `/cockpit` compatibility route",
    "no API write route",
    "no server action",
    "no chat composer",
    "no provider/OpenAI call",
    "no GitHub call or actuation",
    "no Codex launch or execution",
    "no runner execution",
    "no product DB write or persistence",
    "no proof/evidence write",
    "no durable memory apply",
    "no Perspective apply",
    "no delta auto-apply",
    "npm run smoke:legacy-cockpit-control-inventory-v0-1",
  ]);

  for (const [label, text] of [
    [indexDoc, indexText],
    [classificationDoc, classificationDocText],
    [baselineDoc, baselineDocText],
    [shrinkPlanDoc, shrinkPlanDocText],
    [browserRegressionDoc, browserRegressionDocText],
    [agentWorkplaneDoc, agentWorkplaneDocText],
    [reviewMemoryDoc, reviewMemoryDocText],
    [dogfoodDoc, dogfoodDocText],
    [metricsDoc, metricsDocText],
  ]) {
    assert(
      text.includes("docs/AGENT_WORKPLANE_LEGACY_COCKPIT_CONTROL_INVENTORY_V0_1.md"),
      `${label} must point to the control inventory doc`,
    );
  }
}

function assertTypeContract() {
  assertContainsAll(typeText, [
    "LEGACY_COCKPIT_CONTROL_INVENTORY_VERSION",
    "LegacyCockpitControlInventoryStatus",
    "LegacyCockpitControlInventoryControlClass",
    "LegacyCockpitControlInventoryEvidenceKind",
    "LegacyCockpitProposalDiffPreflight",
    "LegacyCockpitControlInventoryComparison",
    "LegacyCockpitControlInventoryReport",
  ]);
  assertContainsAll(typeText, requiredControlClasses);
  assertContainsAll(typeText, requiredEvidenceKinds);
  assertContainsAll(typeText, requiredEvidenceStatuses);
  assertContainsAll(typeText, requiredAuthorityFields);
}

function assertHelperStaticShape() {
  assertContainsAll(helperText, requiredHelperExports);
  assertContainsAll(helperText, [
    "buildLegacyCockpitLocalControlClassification",
    "unknown_legacy_browser_manual_controls",
    "missing_richer_proposal_diff_detail",
    "proposal_diff_preflight_is_read_only",
    "No Legacy Cockpit deletion, shrink, hide, disable",
  ]);
}

function assertHelperBehavior() {
  const output = execFileSync(
    "node",
    [
      "--import",
      "tsx",
      "-e",
      `
        const {
          buildLegacyCockpitControlInventoryReport,
          buildLegacyCockpitProposalDiffPreflight,
        } = await import("./lib/workplane/legacy-cockpit-control-inventory.ts");

        const html = ${JSON.stringify(buildServerRenderedWorkbenchFixture())};
        const proposalDiffSource = [
          "Review / memory proposal detail",
          "missing_richer_proposal_diff_detail",
          "proposal diff",
          "delta summaries",
          "source refs",
          "merge policy",
          "non-goals",
        ].join("\\n");
        const evidenceReport = buildLegacyCockpitControlInventoryReport({
          as_of: "2026-07-03T00:00:00.000Z",
          workbench_html: html,
          source_text: "app/cockpit/page.tsx imports AugnesCockpit and renders <" + "AugnesCockpit />; agent-workplane.tsx renders <" + "LegacyCockpitCompatibilityPanel />",
          proposal_diff_source_text: proposalDiffSource,
          proposal_diff_evidence_refs: ["docs/AGENT_WORKPLANE_REVIEW_MEMORY_DETAIL_V0_1.md"],
        });
        const noEvidenceReport = buildLegacyCockpitControlInventoryReport({
          as_of: "2026-07-03T00:00:00.000Z",
          proposal_diff_source_text: "",
        });
        const preflight = buildLegacyCockpitProposalDiffPreflight({
          proposal_diff_source_text: proposalDiffSource,
        });
        console.log(JSON.stringify({ evidenceReport, noEvidenceReport, preflight }));
      `,
    ],
    { encoding: "utf8" },
  );
  const parsed = JSON.parse(output);
  const { evidenceReport, noEvidenceReport, preflight } = parsed;

  assert.equal(evidenceReport.report_version, "legacy_cockpit_control_inventory.v0.1");
  assert.equal(evidenceReport.compatibility_marker_present, true);
  assert.equal(evidenceReport.augnes_cockpit_component_present, true);
  assert.equal(evidenceReport.server_rendered_compatibility_content_present, true);
  assert.equal(
    evidenceReport.comparison_to_v0_1_classification.previous_unknown_count,
    1,
  );
  assert.equal(
    evidenceReport.comparison_to_v0_1_classification.after_unknown_count,
    0,
  );
  assert.equal(
    evidenceReport.comparison_to_v0_1_classification.unknown_reduction_claim,
    "reduced_with_evidence",
  );
  assert.equal(
    noEvidenceReport.comparison_to_v0_1_classification.after_unknown_count,
    1,
  );
  assert.equal(
    noEvidenceReport.comparison_to_v0_1_classification.unknown_reduction_claim,
    "unchanged",
  );
  assert.equal(evidenceReport.proposal_diff_preflight.status, "needs_richer_detail");
  assert.equal(evidenceReport.proposal_diff_preflight.needs_richer_proposal_diff_detail, true);
  assert.equal(preflight.can_apply_or_commit, false);
  assert.equal(evidenceReport.shrink_readiness.status, "gated");
  assert(
    evidenceReport.comparison_to_v0_1_classification
      .classified_with_dom_or_manual_evidence > 0,
  );
  assert(
    evidenceReport.comparison_to_v0_1_classification
      .local_write_controls_still_compatibility_only > 0,
  );
  assert(
    evidenceReport.comparison_to_v0_1_classification
      .forbidden_controls_still_forbidden > 0,
  );
  for (const field of requiredAuthorityFields) {
    assert.equal(evidenceReport.authority_boundary[field], false, `${field} must be false`);
  }

  const byClass = evidenceReport.counts.by_class;
  for (const key of ["read_only", "copy_only", "preview_only", "local_write", "forbidden"]) {
    assert(byClass[key] > 0, `${key} should be present in the evidence report`);
  }
  assert.equal(noEvidenceReport.counts.by_class.unknown, 1);

  return parsed;
}

function buildServerRenderedWorkbenchFixture() {
  return `
    <!doctype html>
    <html>
      <body>
        <section aria-label="Retained Legacy Cockpit compatibility route">
          <section
            data-workplane-panel-id="legacy_cockpit_compatibility"
            data-workplane-node-id="legacy_cockpit_compatibility"
            data-workplane-node-kind="compatibility_panel"
            data-workplane-node-status="compatibility_only"
            data-workplane-legacy-cockpit-shrink="workbench_full_mount_removed"
            data-workplane-legacy-cockpit-route="/cockpit"
          >
            <p>Full Legacy Cockpit remains reachable at /cockpit.</p>
            <h2>Retained Legacy Cockpit route</h2>
            <main class="cockpit-shell six-tab-cockpit">
              <nav class="cockpit-tab-nav" aria-label="Cockpit tabs">
                <button type="button">Overview</button>
                <button type="button">Work</button>
                <button type="button">Perspective</button>
                <button type="button">Bridge</button>
                <button type="button">Operator</button>
              </nav>
              <section aria-label="Perspective">
                <button type="button">Formation Basis</button>
                <button type="button">Apply View</button>
                <button type="button">Whole Constellation</button>
                <button type="button">Connected Node</button>
                <button type="button">Cluster</button>
                <button type="button">Manual Selection</button>
                <button type="button">Manual Gravity Preview</button>
                <button type="button">Copy Codex handoff</button>
                <label>Manual pasted note<textarea></textarea></label>
              </section>
            </main>
          </section>
        </section>
        <section data-workplane-review-memory-detail-panel="v0.1">
          Review / memory proposal detail missing_richer_proposal_diff_detail
          proposal diff delta summaries source refs merge policy non-goals
        </section>
      </body>
    </html>
  `;
}

function assertCompatibilityStillRendered() {
  assert(existsSync(augnesCockpitFile), "components/augnes-cockpit.tsx must exist");
  assert(
    existsSync(legacyCompatibilityPanelFile),
    "legacy compatibility panel must exist",
  );
  assertContainsAll(agentWorkplaneText, [
    "LegacyCockpitCompatibilityPanel",
    "<" + "LegacyCockpitCompatibilityPanel />",
    "Agent Workplane shrunk compatibility route",
  ]);
  assert(!agentWorkplaneText.includes("AugnesCockpit"), `${agentWorkplaneFile} must not import or render AugnesCockpit after the route split`);
  assertContainsAll(legacyCompatibilityPanelText, [
    'data-workplane-panel-id="legacy_cockpit_compatibility"',
    'data-workplane-legacy-cockpit-shrink="workbench_full_mount_removed"',
    'data-workplane-legacy-cockpit-route="/cockpit"',
    "Legacy Cockpit full mount was removed from /workbench",
  ]);
  assert(augnesCockpitText.includes("export function " + "AugnesCockpit"));
}

function assertChangedFileBoundary() {
  for (const file of changedAndUntrackedFiles()) {
    assert(
      allowedChangedFiles.has(file),
      `Unexpected changed file for Legacy Cockpit control inventory v0.1: ${file}`,
    );
  }
}

function assertNoSourceDeletion() {
  const deletedFiles = uniqueSorted([
    ...collectGitDiffFiles(["diff", "--name-only", "--diff-filter=D", "HEAD"])
      .files,
    ...collectGitDiffFiles([
      "diff",
      "--name-only",
      "--diff-filter=D",
      "origin/main...HEAD",
    ]).files,
  ]);
  assert.deepEqual(deletedFiles, [], "No source file deletion is allowed");
}

function assertNoRouteOrAuthorityPathAdded() {
  for (const file of changedAndUntrackedFiles()) {
    if (file === cockpitPageFile) {
      continue;
    }
    assert(!/^app\//.test(file), `No product route/page changes allowed: ${file}`);
    assert(!/^app\/api\//.test(file), `No API route changes allowed: ${file}`);
    assert(!/route\.(ts|tsx|js|jsx)$/.test(file), `No route file changes allowed: ${file}`);
    assert(!/actions?\.(ts|tsx|js|jsx)$/.test(file), `No server action file changes allowed: ${file}`);
    assert(!/^db\//.test(file), `No DB file changes allowed: ${file}`);
    assert(!/^migrations\//.test(file), `No migration changes allowed: ${file}`);
  }

  const implementationText = [typeText, helperText, docText].join("\n");
  const forbiddenPatterns = [
    [/@openai|from\s+["'][^"']*openai/i, "OpenAI import"],
    [/\bnew OpenAI\b|api\.openai\.com/i, "OpenAI client"],
    [/@octokit|api\.github\.com|github\/rest/i, "GitHub client"],
    [/executeCodex\s*\(/i, "Codex execution"],
    [/runAutonomy|tickAutonomy|scheduleAutonomy|recoverDeltaBatchForRun\s*\(/i, "runner execution or recovery"],
    [/recordProof\s*\(|createEvidence\b|createEvidenceRecord\s*\(/i, "proof/evidence write"],
    [/applyDurableMemory\s*\(|applyPerspective\s*\(|autoApplyDelta\s*\(/i, "apply authority"],
    [/localStorage\.setItem|sessionStorage\.setItem/i, "durable browser storage"],
    [/method:\s*["'](?:POST|PUT|PATCH|DELETE)["']/i, "mutating HTTP method"],
  ];
  for (const [pattern, label] of forbiddenPatterns) {
    assert(!pattern.test(implementationText), `Control inventory must not add ${label}`);
  }
}

function assertNoProductComponentBehaviorFilesChanged() {
  const changedFiles = changedAndUntrackedFiles();
  assert(
    changedFiles.includes(agentWorkplaneFile),
    "agent-workplane.tsx must change for the route split shrink",
  );
  assert(!changedFiles.includes(augnesCockpitFile), "AugnesCockpit must not change");
  assert(
    changedFiles.includes(legacyCompatibilityPanelFile),
    "legacy compatibility panel must change into the compact route pointer",
  );
}

function assertNoLegacyCockpitDeletionOrShrink() {
  assertContainsAll([docText, helperText, typeText].join("\n"), [
    "can_delete_legacy_cockpit",
    "can_shrink_legacy_cockpit",
    "can_hide_legacy_cockpit",
    "Legacy Cockpit functionality was deleted, hidden, disabled, or absorbed",
    "explicit `/cockpit` compatibility route",
    "Full Legacy Cockpit remains reachable at /cockpit",
  ]);
}

function changedAndUntrackedFiles() {
  return uniqueSorted([
    ...collectGitDiffFiles(["diff", "--name-only"]).files,
    ...collectGitDiffFiles(["diff", "--cached", "--name-only"]).files,
    ...getBaseRangeChangedFiles().files,
    ...collectUntrackedFiles(),
  ]);
}
