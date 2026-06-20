import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const routePath =
  "app/api/research-candidate-review/manual-note-preview-drafts/[preview_draft_id]/promotion-readiness/route.ts";
const helperPath =
  "lib/research-candidate-review/manual-note-preview-draft-promotion-readiness.ts";
const sharedRuntimePath =
  "lib/research-candidate-review/manual-note-runtime-preview.ts";
const storePath =
  "lib/research-candidate-review/manual-note-preview-draft-store.ts";
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
const preflightReadoutPath =
  "components/research-candidate-promotion-readiness-preflight-readout.tsx";
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
const startupReadinessPath = "components/cockpit-startup-readiness-readout.tsx";
const cssPath = "app/globals.css";
const indexPath = "docs/00_INDEX_LATEST.md";
const packagePath = "package.json";
const smokePath =
  "scripts/smoke-research-candidate-preview-draft-promotion-readiness-v0-1.mjs";

for (const filePath of [
  routePath,
  helperPath,
  sharedRuntimePath,
  storePath,
  componentPath,
  draftListPanelPath,
  draftCardPath,
  labelControlsPath,
  activityReadoutPath,
  metadataReadoutPath,
  preflightReadoutPath,
  formatHintPath,
  resultSummaryPath,
  warningDisplayPath,
  sourceReferenceListPath,
  candidateFamilyListsPath,
  authorityFlagsPath,
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
const store = readFileSync(storePath, "utf8");
const manualPanelComponent = readFileSync(componentPath, "utf8");
const draftUiComponent = [
  readFileSync(formatHintPath, "utf8"),
  readFileSync(resultSummaryPath, "utf8"),
  readFileSync(warningDisplayPath, "utf8"),
  readFileSync(sourceReferenceListPath, "utf8"),
  readFileSync(candidateFamilyListsPath, "utf8"),
  readFileSync(authorityFlagsPath, "utf8"),
  readFileSync(draftListPanelPath, "utf8"),
  readFileSync(draftCardPath, "utf8"),
  readFileSync(labelControlsPath, "utf8"),
  readFileSync(activityReadoutPath, "utf8"),
  readFileSync(metadataReadoutPath, "utf8"),
  readFileSync(preflightReadoutPath, "utf8"),
].join("\n");
const component = `${manualPanelComponent}\n${draftUiComponent}`;

const startupReadiness = readFileSync(startupReadinessPath, "utf8");
const css = readFileSync(cssPath, "utf8");
const index = readFileSync(indexPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

assertSharedContract();
assertHelper();
assertRoute();
assertStoreReadOnlyExposure();
assertUi();
assertForbiddenPatternsAbsent();
assertDocsAndPackagePointers();

console.log(
  JSON.stringify(
    {
      smoke: "research-candidate-preview-draft-promotion-readiness-v0-1",
      preflight_route_checked: true,
      preflight_helper_checked: true,
      readiness_status_values_checked: true,
      gate_results_checked: true,
      read_only_boundary_checked: true,
      ui_preflight_checked: true,
      existing_startup_and_manual_flows_preserved: true,
      forbidden_patterns_absent: true,
      docs_pointer_checked: true,
      package_script_checked: true,
    },
    null,
    2,
  ),
);

function assertSharedContract() {
  for (const requiredText of [
    "ManualNotePreviewDraftPromotionReadinessStatus",
    '"blocked"',
    '"needs_operator_review"',
    '"ready_for_promotion_discussion"',
    "ManualNotePreviewDraftPromotionReadinessGateResult",
    "ManualNotePreviewDraftPromotionReadinessOkResponse",
    "ManualNotePreviewDraftPromotionReadinessResponse",
    "ManualNotePreviewDraftPromotionReadinessRuntimeBoundary",
    "ManualNotePreviewDraftPromotionReadinessAuthority",
    "ManualNotePreviewDraftPromotionSourceSummary",
    "ManualNotePreviewDraftPromotionCandidateSummary",
    "buildManualNotePreviewDraftPromotionReadinessRoute",
    "buildManualNotePreviewDraftPromotionReadinessBoundary",
    "buildManualNotePreviewDraftPromotionReadinessAuthority",
    'preflight_actions: "read_promotion_readiness_only"',
    "preflight_only: true",
    "readiness_is_not_promotion_authority: true",
    "canonical_perspective_write: false",
    "proof_or_evidence_writes: false",
    "work_item_creation: false",
    "approval_workflow_created: false",
    "publication_workflow_created: false",
    "promotion_workflow_created: false",
    "provider_or_openai_calls: false",
    "retrieval_or_rag: false",
    "source_fetching: false",
    "codex_execution: false",
    "external_handoff_sending: false",
    "browser_persistence: false",
    "promoted_at: string | null",
    "canonical_perspective_id: string | null",
    "proof_id: string | null",
    "evidence_id: string | null",
    "work_item_id: string | null",
  ]) {
    assert.ok(
      sharedRuntime.includes(requiredText),
      `shared runtime contract must include ${requiredText}`,
    );
  }
}

function assertHelper() {
  for (const requiredText of [
    "buildManualNotePreviewDraftPromotionReadiness",
    "gate_results",
    "readiness_status",
    "readiness_score",
    "blockers",
    "warnings",
    "next_review_steps",
    "source_summary",
    "candidate_summary",
    "lifecycle_summary",
    "source_ref_count",
    "source_titles",
    "source_identifiers",
    "source_statuses",
    "source_boundary_notes",
    "buildManualNotePreviewDraftPromotionReadinessBoundary",
    "buildManualNotePreviewDraftPromotionReadinessAuthority",
    "buildManualNotePreviewNoSideEffects",
  ]) {
    assert.ok(helper.includes(requiredText), `preflight helper must include ${requiredText}`);
  }

  for (const gateId of [
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
  ]) {
    assert.ok(helper.includes(gateId), `preflight helper must include ${gateId}`);
  }

  for (const requiredText of [
    "missing_research_question",
    "missing_operator_intent",
    "missing_source_title",
    "discarded_preview_draft",
    "manual_note_text_stored",
    "canonical_perspective_id",
    "proof_id",
    "evidence_id",
    "work_item_id",
    "no source URLs were fetched or validated",
    "no_side_effects: true",
  ]) {
    assert.ok(helper.includes(requiredText), `preflight helper must include ${requiredText}`);
  }

  assert.doesNotMatch(
    helper,
    /\b(?:openDatabase|INSERT|UPDATE|DELETE|CREATE TABLE|ALTER TABLE|DROP TABLE)\b/i,
    "preflight helper must not open DB, write, or mutate schema",
  );
  assert.doesNotMatch(helper, /\bfetch\s*\(/, "preflight helper must not fetch");
}

function assertRoute() {
  for (const requiredText of [
    "export async function GET(",
    "PREVIEW_DRAFT_ID_PATTERN",
    "validatePreviewDraftId",
    "invalid_preview_draft_id",
    "parseScope",
    "unsupported_scope",
    "preview_draft_not_found",
    "getResearchCandidateManualNotePreviewDraft",
    "listResearchCandidateManualNotePreviewDraftActivities",
    "buildManualNotePreviewDraftPromotionReadiness",
    "buildManualNotePreviewDraftPromotionReadinessBoundary",
    "buildManualNotePreviewDraftPromotionReadinessRoute",
    "runtime_boundary",
    "no_side_effects",
    "readiness_status",
    "gate_results",
  ]) {
    assert.ok(route.includes(requiredText), `preflight route must include ${requiredText}`);
  }

  assert.doesNotMatch(
    route,
    /\b(?:INSERT|UPDATE|DELETE|CREATE TABLE|ALTER TABLE|DROP TABLE)\b/i,
    "preflight GET route must not write or mutate schema",
  );
  assert.doesNotMatch(route, /\bfetch\s*\(/, "preflight GET route must not fetch");
}

function assertStoreReadOnlyExposure() {
  for (const requiredText of [
    "getResearchCandidateManualNotePreviewDraft",
    "listResearchCandidateManualNotePreviewDraftActivities",
    "promoted_at: draft.promoted_at",
    "canonical_perspective_id: draft.canonical_perspective_id",
    "proof_id: draft.proof_id",
    "evidence_id: draft.evidence_id",
    "work_item_id: draft.work_item_id",
  ]) {
    assert.ok(store.includes(requiredText), `store must expose ${requiredText}`);
  }
}

function assertUi() {
  for (const requiredText of [
    "Promotion readiness preflight",
    "Run preflight",
    "Refresh preflight",
    "readiness_status",
    "readiness_score",
    "Blockers",
    "Warnings",
    "Next review steps",
    "Block gates",
    "Warning gates",
    "Pass gates",
    "Source summary",
    "Candidate summary",
    "Lifecycle summary",
    "This is a read-only preflight.",
    "Ready for promotion discussion is not promotion authority.",
    "buildManualNotePreviewDraftPromotionReadinessRoute",
    "ManualNotePreviewDraftPromotionReadinessResponse",
    "PromotionReadinessPreflightReadout",
  ]) {
    assert.ok(component.includes(requiredText), `manual note UI must include ${requiredText}`);
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
    "Discard preview draft",
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
    /\b(?:Promote|Approve|Reject|Defer|Create proof|Create evidence|Create work item|Execute Codex|Send handoff|Fix all)\b/,
    "preflight UI must not add forbidden action button labels",
  );

  for (const requiredCss of [
    ".manual-note-promotion-readiness",
    ".manual-note-promotion-readiness-status",
    ".manual-note-promotion-readiness-summary-grid",
    ".manual-note-promotion-readiness-gate",
    ".manual-note-promotion-readiness-gate-block",
    ".manual-note-promotion-readiness-gate-warn",
    ".manual-note-promotion-readiness-gate-pass",
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
  }
}

function assertDocsAndPackagePointers() {
  assert.equal(
    packageJson.scripts[
      "smoke:research-candidate-preview-draft-promotion-readiness-v0-1"
    ],
    "node scripts/smoke-research-candidate-preview-draft-promotion-readiness-v0-1.mjs",
    "package.json must expose the promotion readiness preflight smoke",
  );

  for (const existingSmokeScript of [
    "smoke:cockpit-startup-readiness-readout-v0-1",
    "smoke:research-candidate-manual-note-preview-ui-v0-1",
    "smoke:research-candidate-preview-draft-lifecycle-summary-v0-1",
  ]) {
    assert.ok(
      packageJson.scripts[existingSmokeScript],
      `package.json must retain ${existingSmokeScript}`,
    );
  }

  for (const requiredText of [
    "Manual note preview draft promotion readiness preflight lane",
    "Promotion readiness preflight",
    "ready_for_promotion_discussion",
    "Ready for promotion discussion is not promotion authority.",
    "smoke:research-candidate-preview-draft-promotion-readiness-v0-1",
  ]) {
    assert.ok(index.includes(requiredText), `docs index must include ${requiredText}`);
  }
}
