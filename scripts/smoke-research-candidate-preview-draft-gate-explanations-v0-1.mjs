import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const routePath =
  "app/api/research-candidate-review/manual-note-preview-drafts/[preview_draft_id]/promotion-readiness/route.ts";
const helperPath =
  "lib/research-candidate-review/manual-note-preview-draft-promotion-readiness.ts";
const sharedRuntimePath =
  "lib/research-candidate-review/manual-note-runtime-preview.ts";
const componentPath =
  "components/research-candidate-manual-note-preview-panel.tsx";
const draftListPanelPath =
  "components/research-candidate-preview-draft-list-panel.tsx";
const draftCardPath = "components/research-candidate-preview-draft-card.tsx";
const labelControlsPath =
  "components/research-candidate-preview-draft-label-controls.tsx";
const activityReadoutPath =
  "components/research-candidate-preview-draft-activity-readout.tsx";
const metadataReadoutPath =
  "components/research-candidate-preview-draft-metadata-readout.tsx";
const formatHintPath =
  "components/research-candidate-manual-note-format-hint.tsx";
const resultSummaryPath =
  "components/research-candidate-manual-note-result-summary.tsx";
const warningDisplayPath =
  "components/research-candidate-manual-note-warning-display.tsx";
const sourceReferenceListPath =
  "components/research-candidate-manual-note-source-reference-list.tsx";
const candidateFamilyListsPath =
  "components/research-candidate-manual-note-candidate-family-lists.tsx";
const authorityFlagsPath =
  "components/research-candidate-manual-note-authority-flags.tsx";
const gateExplanationsPath =
  "components/research-candidate-promotion-readiness-gate-explanations.tsx";
const preflightReadoutPath =
  "components/research-candidate-promotion-readiness-preflight-readout.tsx";
const startupReadinessPath = "components/cockpit-startup-readiness-readout.tsx";
const cssPath = "app/globals.css";
const indexPath = "docs/00_INDEX_LATEST.md";
const packagePath = "package.json";
const smokePath =
  "scripts/smoke-research-candidate-preview-draft-gate-explanations-v0-1.mjs";

for (const filePath of [
  routePath,
  helperPath,
  sharedRuntimePath,
  componentPath,
  draftListPanelPath,
  draftCardPath,
  labelControlsPath,
  activityReadoutPath,
  metadataReadoutPath,
  formatHintPath,
  resultSummaryPath,
  warningDisplayPath,
  sourceReferenceListPath,
  candidateFamilyListsPath,
  authorityFlagsPath,
  gateExplanationsPath,
  preflightReadoutPath,
  startupReadinessPath,
  cssPath,
  indexPath,
  packagePath,
  smokePath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const route = readFileSync(routePath, "utf8");
const helper = readFileSync(helperPath, "utf8");
const sharedRuntime = readFileSync(sharedRuntimePath, "utf8");
const component = [
  readFileSync(formatHintPath, "utf8"),
  readFileSync(resultSummaryPath, "utf8"),
  readFileSync(warningDisplayPath, "utf8"),
  readFileSync(sourceReferenceListPath, "utf8"),
  readFileSync(candidateFamilyListsPath, "utf8"),
  readFileSync(authorityFlagsPath, "utf8"),
  readFileSync(componentPath, "utf8"),
  readFileSync(draftListPanelPath, "utf8"),
  readFileSync(draftCardPath, "utf8"),
  readFileSync(labelControlsPath, "utf8"),
  readFileSync(activityReadoutPath, "utf8"),
  readFileSync(metadataReadoutPath, "utf8"),
  readFileSync(gateExplanationsPath, "utf8"),
  readFileSync(preflightReadoutPath, "utf8"),
].join("\n");
const startupReadiness = readFileSync(startupReadinessPath, "utf8");
const css = readFileSync(cssPath, "utf8");
const index = readFileSync(indexPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

const gateIds = [
  "lifecycle_gate",
  "storage_boundary_gate",
  "authority_boundary_gate",
  "parser_warning_gate",
  "source_reference_gate",
  "claim_candidate_gate",
  "evidence_candidate_gate",
  "tension_gap_gate",
  "follow_up_work_gate",
  "label_metadata_gate",
  "activity_metadata_gate",
  "canonical_link_guard_gate",
];

assertSharedContract();
assertHelperExplanations();
assertRouteResponse();
assertUi();
assertForbiddenPatternsAbsent();
assertDocsAndPackagePointers();

console.log(
  JSON.stringify(
    {
      smoke: "research-candidate-preview-draft-gate-explanations-v0-1",
      explanation_contract_checked: true,
      all_gate_explanations_checked: true,
      route_response_checked: true,
      helper_purity_checked: true,
      ui_explanations_checked: true,
      forbidden_actions_absent: true,
      docs_pointer_checked: true,
      package_script_checked: true,
    },
    null,
    2,
  ),
);

function assertSharedContract() {
  for (const requiredText of [
    "ManualNotePreviewDraftPromotionReadinessResolutionBoundary",
    "ManualNotePreviewDraftPromotionReadinessResolutionHint",
    "ManualNotePreviewDraftPromotionReadinessGateExplanation",
    "explanation_title: string",
    "operator_explanation: string",
    "why_it_matters: string",
    "current_signal: string",
    "suggested_safe_actions: ManualNotePreviewDraftPromotionReadinessResolutionHint[]",
    "related_ui_surfaces: string[]",
    "related_evidence_fields: string[]",
    "can_be_resolved_in_current_preview_lane: boolean",
    "resolution_boundary: ManualNotePreviewDraftPromotionReadinessResolutionBoundary",
    "gate_explanation: ManualNotePreviewDraftPromotionReadinessGateExplanation",
    "preview_metadata_only: true",
    "does_not_promote: true",
    "does_not_write_proof_or_evidence: true",
    "does_not_create_work_item: true",
    "does_not_fetch_sources: true",
    "does_not_run_retrieval: true",
    "does_not_call_provider: true",
    "does_not_update_perspective: true",
  ]) {
    assert.ok(
      sharedRuntime.includes(requiredText),
      `shared runtime contract must include ${requiredText}`,
    );
  }

  for (const gateId of gateIds) {
    assert.ok(sharedRuntime.includes(gateId), `shared runtime must include ${gateId}`);
  }
}

function assertHelperExplanations() {
  for (const requiredText of [
    "PREVIEW_RESOLUTION_BOUNDARY",
    "buildGateExplanation",
    "gate_explanation: buildGateExplanation",
    "resolution_boundary: PREVIEW_RESOLUTION_BOUNDARY",
    "suggested_safe_actions",
    "related_ui_surfaces",
    "related_evidence_fields",
    "can_be_resolved_in_current_preview_lane",
    "safeAction(",
    "existing_preview_surface",
    "new_preview_draft",
    "separate_future_lane",
    "stop_and_inspect",
  ]) {
    assert.ok(helper.includes(requiredText), `helper must include ${requiredText}`);
  }

  for (const gateId of gateIds) {
    const casePattern = new RegExp(`case "${gateId}"`);
    assert.match(helper, casePattern, `helper must explain ${gateId}`);
  }

  for (const gateGuidance of [
    "Inspect Preview draft activity",
    "Create a new runtime preview draft",
    "Do not undiscard or promote this draft in this lane.",
    "Raw manual note text must remain unavailable and unpersisted.",
    "Stop and inspect stored authority fields",
    "Create a new preview draft with clearer Research Question, Operator Intent, and Source Title lines.",
    "Paste a revised note with Source Title, Source Origin, and Source Identifier lines.",
    "Paste a revised note with explicit Claim lines.",
    "Do not write proof or evidence records in this lane.",
    "Inspect tension and knowledge gap candidate lists.",
    "Do not create work items in this lane.",
    "Use the existing Edit label, Save label, Cancel, or Clear label controls.",
    "Use Load activity or Refresh activity",
    "Stop and review data integrity if any authority link field is non-null.",
    "Do not mutate, repair, or cleanup link fields in this lane.",
  ]) {
    assert.ok(helper.includes(gateGuidance), `helper must include guidance: ${gateGuidance}`);
  }

  assert.doesNotMatch(
    helper,
    /\b(?:openDatabase|INSERT|UPDATE|DELETE|CREATE TABLE|ALTER TABLE|DROP TABLE|db\.prepare|db\.exec)\b/i,
    "helper must not open DB, write rows, or mutate schema",
  );
  assert.doesNotMatch(helper, /\bfetch\s*\(/, "helper must not fetch");
}

function assertRouteResponse() {
  for (const requiredText of [
    "export async function GET(",
    "buildManualNotePreviewDraftPromotionReadiness",
    "gate_results: preflight.gate_results",
    "ManualNotePreviewDraftPromotionReadinessResponse",
    "runtime_boundary",
    "no_side_effects",
  ]) {
    assert.ok(route.includes(requiredText), `route must include ${requiredText}`);
  }

  assert.ok(
    sharedRuntime.includes("gate_explanation: ManualNotePreviewDraftPromotionReadinessGateExplanation"),
    "route response gate_results must be typed with explanation metadata",
  );

  assert.doesNotMatch(
    route,
    /\b(?:INSERT|UPDATE|DELETE|CREATE TABLE|ALTER TABLE|DROP TABLE|db\.prepare|db\.exec)\b/i,
    "preflight explanation route must not write or mutate schema",
  );
  assert.doesNotMatch(route, /\bfetch\s*\(/, "preflight explanation route must not fetch");
}

function assertUi() {
  for (const requiredText of [
    "Promotion readiness preflight",
    "Gate explanations",
    "PromotionReadinessGateExplanations",
    "PromotionReadinessGateExplanationCard",
    "Gate explanations are operator guidance only.",
    "Suggested actions use",
    "No explanation here grants promotion authority.",
    "No proof/evidence, Perspective, work item, provider, retrieval",
    "Resolvable in this preview lane",
    "Requires separate future lane or stop/inspect",
    "Suggested safe actions",
    "Related UI surfaces",
    "Related evidence fields",
    "Resolution boundary",
    "Show pass gate explanations",
    "can_be_resolved_in_current_preview_lane",
    "gate.gate_explanation",
  ]) {
    assert.ok(component.includes(requiredText), `UI must include ${requiredText}`);
  }

  for (const preservedText of [
    "CockpitStartupReadinessReadout",
    "Use sample note",
    "Operator preview label",
    "Parse locally",
    "Create runtime preview draft",
    "Recent runtime preview drafts",
    "Refresh preview drafts",
    "Lifecycle filter",
    "Sort order",
    "Warning filter",
    "Candidate filter",
    "Limit selector",
    "Open preview draft",
    "Edit label",
    "Save label",
    "Cancel",
    "Clear label",
    "Load activity",
    "Refresh activity",
    "Discard preview draft",
    "Promotion readiness preflight",
    "Authority boundary",
  ]) {
    assert.ok(component.includes(preservedText), `existing UI must retain ${preservedText}`);
  }

  assert.ok(
    startupReadiness.includes("Startup readiness"),
    "Startup readiness readout component must remain present",
  );

  const buttonText = Array.from(component.matchAll(/<button\b[\s\S]*?<\/button>/g))
    .map((match) => match[0].replace(/<[^>]*>/g, " "))
    .join("\n");
  assert.doesNotMatch(
    buttonText,
    /\b(?:Promote|Approve|Reject|Defer|Create proof|Create evidence|Create work item|Fetch source|Run retrieval|Ask OpenAI|Execute Codex|Send handoff|Fix all|Repair DB)\b/i,
    "gate explanation UI must not add forbidden action button labels",
  );

  assert.doesNotMatch(
    component,
    /href=["'](?:javascript:|https?:\/\/)/i,
    "optional explanation links must not be external or script links",
  );

  for (const requiredCss of [
    ".manual-note-gate-explanations",
    ".manual-note-gate-resolution-summary",
    ".manual-note-gate-pass-explanations",
    ".manual-note-gate-explanation",
    ".manual-note-gate-explanation-grid",
    ".manual-note-gate-explanation-columns",
    ".manual-note-gate-resolution-boundary",
  ]) {
    assert.ok(css.includes(requiredCss), `CSS must include ${requiredCss}`);
  }
}

function assertForbiddenPatternsAbsent() {
  const checkedSources = {
    [routePath]: route,
    [helperPath]: helper,
    [sharedRuntimePath]: sharedRuntime,
    [componentPath]: component,
  };
  const forbiddenImportPattern =
    /from ["'][^"']*(?:openai|provider|retriev|rag|source-fetch|crawler|scraper|embedding|vector|proof|evidence|work-item|promotion-route|codex|handoff|mcp|plugin)/i;
  const forbiddenPersistencePattern =
    /\b(?:localStorage|sessionStorage|indexedDB|document\.cookie)\b/;
  const forbiddenMutationPattern =
    /\b(?:CREATE TABLE|ALTER TABLE|DROP TABLE|db:reset|db:migrate|seed)\b/i;

  for (const [filePath, source] of Object.entries(checkedSources)) {
    assert.doesNotMatch(
      source,
      forbiddenImportPattern,
      `${filePath} must not import forbidden provider/retrieval/proof/evidence/work/Codex modules`,
    );
    assert.doesNotMatch(
      source,
      forbiddenPersistencePattern,
      `${filePath} must not use browser persistence`,
    );
    assert.doesNotMatch(
      source,
      forbiddenMutationPattern,
      `${filePath} must not add schema reset/migration/seed behavior`,
    );
  }
}

function assertDocsAndPackagePointers() {
  assert.equal(
    packageJson.scripts[
      "smoke:research-candidate-preview-draft-gate-explanations-v0-1"
    ],
    "node scripts/smoke-research-candidate-preview-draft-gate-explanations-v0-1.mjs",
    "package.json must expose the gate explanations smoke",
  );

  assert.equal(
    packageJson.scripts[
      "smoke:research-candidate-preview-draft-promotion-readiness-v0-1"
    ],
    "node scripts/smoke-research-candidate-preview-draft-promotion-readiness-v0-1.mjs",
    "package.json must retain the promotion readiness preflight smoke",
  );

  for (const requiredText of [
    "Manual note preview draft gate explanations lane",
    "Gate explanations are operator guidance only.",
    "No explanation here grants promotion authority.",
    "smoke:research-candidate-preview-draft-gate-explanations-v0-1",
    "Manual note preview draft promotion readiness preflight lane",
  ]) {
    assert.ok(index.includes(requiredText), `docs index must include ${requiredText}`);
  }
}
