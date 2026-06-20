import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const builderPath =
  "lib/research-candidate-review/manual-note-preview-draft-readiness-copy-packet.ts";
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
const copyPacketPanelPath =
  "components/research-candidate-readiness-copy-packet-panel.tsx";
const gateExplanationsPath =
  "components/research-candidate-promotion-readiness-gate-explanations.tsx";
const startupReadinessPath = "components/cockpit-startup-readiness-readout.tsx";
const cssPath = "app/globals.css";
const indexPath = "docs/00_INDEX_LATEST.md";
const packagePath = "package.json";
const gateSmokePath =
  "scripts/smoke-research-candidate-preview-draft-gate-explanations-v0-1.mjs";
const smokePath =
  "scripts/smoke-research-candidate-preview-draft-readiness-copy-packet-v0-1.mjs";

for (const filePath of [
  builderPath,
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
  copyPacketPanelPath,
  gateExplanationsPath,
  startupReadinessPath,
  cssPath,
  indexPath,
  packagePath,
  gateSmokePath,
  smokePath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const builder = readFileSync(builderPath, "utf8");
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
  readFileSync(copyPacketPanelPath, "utf8"),
  readFileSync(gateExplanationsPath, "utf8"),
].join("\n");
const startupReadiness = readFileSync(startupReadinessPath, "utf8");
const css = readFileSync(cssPath, "utf8");
const index = readFileSync(indexPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

assertSharedContract();
assertBuilder();
assertUi();
assertForbiddenPatternsAbsent();
assertDocsAndPackagePointers();

console.log(
  JSON.stringify(
    {
      smoke: "research-candidate-preview-draft-readiness-copy-packet-v0-1",
      copy_packet_builder_checked: true,
      packet_kind_version_checked: true,
      packet_content_checked: true,
      copy_packet_boundary_checked: true,
      builder_purity_checked: true,
      ui_clipboard_checked: true,
      existing_flows_preserved: true,
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
    "MANUAL_NOTE_PREVIEW_DRAFT_READINESS_COPY_PACKET_KIND",
    "research_candidate_preview_draft_readiness_copy_packet",
    "MANUAL_NOTE_PREVIEW_DRAFT_READINESS_COPY_PACKET_VERSION",
    "research_candidate_preview_draft_readiness_copy_packet.v0.1",
    "ManualNotePreviewDraftReadinessCopyPacketKind",
    "ManualNotePreviewDraftReadinessCopyPacketVersion",
    "ManualNotePreviewDraftReadinessCopyPacketBoundary",
    "ManualNotePreviewDraftReadinessCopyPacket",
    "packet_version",
    "packet_kind",
    "generated_at",
    "readiness_status",
    "readiness_score",
    "blockers",
    "warnings",
    "next_review_steps",
    "source_summary",
    "candidate_summary",
    "lifecycle_summary",
    "gate_results",
    "runtime_boundary",
    "no_side_effects",
    "authority",
    "copy_packet_boundary",
    "local_clipboard_only: true",
    "external_handoff_sent: false",
    "proof_or_evidence_writes: false",
    "perspective_promotion: false",
    "canonical_graph_write: false",
    "work_item_creation: false",
    "provider_or_openai_calls: false",
    "retrieval_or_rag: false",
    "source_fetching: false",
    "codex_execution: false",
    "browser_persistence: false",
    "raw_manual_note_text_included: false",
    "promotion_authority_granted: false",
  ]) {
    assert.ok(
      sharedRuntime.includes(requiredText),
      `shared runtime must include ${requiredText}`,
    );
  }
}

function assertBuilder() {
  for (const requiredText of [
    "buildManualNotePreviewDraftReadinessCopyPacket",
    "formatReadinessCopyPacketMarkdown",
    "JSON.stringify(packet, null, 2)",
    "packet_version",
    "packet_kind",
    "generated_at",
    "preview_draft_id",
    "operator_note_label",
    "Untitled preview draft",
    "input_fingerprint",
    "readiness_status",
    "readiness_score",
    "blockers",
    "warnings",
    "next_review_steps",
    "source_summary",
    "candidate_summary",
    "lifecycle_summary",
    "gate_results",
    "gate_explanation",
    "runtime_boundary",
    "no_side_effects",
    "authority",
    "copy_packet_boundary",
    "activity_summary",
    "Raw manual note text is not included in this packet.",
    "This packet is local clipboard material only and grants no promotion authority.",
    "Block Gates",
    "Warning Gates",
    "Pass Gates",
  ]) {
    assert.ok(builder.includes(requiredText), `builder must include ${requiredText}`);
  }

  assert.doesNotMatch(
    builder,
    /\b(?:openDatabase|INSERT|UPDATE|DELETE|CREATE TABLE|ALTER TABLE|DROP TABLE|db\.prepare|db\.exec)\b/i,
    "packet builder must not open DB, write rows, or mutate schema",
  );
  assert.doesNotMatch(builder, /\bfetch\s*\(/, "packet builder must not fetch");
  assert.doesNotMatch(
    builder,
    /\bmanual_note_text\s*:/,
    "packet builder must not include raw manual note text fields",
  );
  assert.doesNotMatch(
    builder,
    /\bmanual_note_text_stored\b/,
    "packet builder must not expose raw note storage fields in the packet",
  );
}

function assertUi() {
  for (const requiredText of [
    "Readiness copy packet",
    "ReadinessCopyPacketPanel",
    "Copy human review packet",
    "Copy JSON packet",
    "navigator.clipboard.writeText",
    "Clipboard API is unavailable",
    "Clipboard write failed",
    "Manual copy fallback",
    "local_clipboard_only",
    "external_handoff_sent",
    "raw_manual_note_text_included",
    "packet_character_count",
    "Run or refresh preflight",
    "buildManualNotePreviewDraftReadinessCopyPacket",
    "Gate explanations",
    "Promotion readiness preflight",
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
    "Gate explanations",
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
    /\b(?:Send|Share|Email|Submit|Create handoff|Execute Codex|Promote|Approve|Reject|Defer|Create proof|Create evidence|Create work item|Fix all)\b/i,
    "copy packet UI must not add forbidden action button labels",
  );

  for (const requiredCss of [
    ".manual-note-readiness-copy-packet",
    ".manual-note-readiness-copy-packet-header",
    ".manual-note-readiness-copy-packet-actions",
    ".manual-note-readiness-copy-packet-grid",
    ".manual-note-readiness-copy-packet-fallback",
  ]) {
    assert.ok(css.includes(requiredCss), `CSS must include ${requiredCss}`);
  }
}

function assertForbiddenPatternsAbsent() {
  const checkedSources = {
    [builderPath]: builder,
    [sharedRuntimePath]: sharedRuntime,
    [componentPath]: component,
  };
  const forbiddenImportPattern =
    /from ["'][^"']*(?:openai|provider|retriev|rag|source-fetch|crawler|scraper|embedding|vector|proof|evidence|work-item|promotion-route|codex|handoff|mcp|plugin|slack|email|webhook|share)/i;
  const forbiddenPersistencePattern =
    /\b(?:localStorage|sessionStorage|indexedDB|document\.cookie)\b/;
  const forbiddenMutationPattern =
    /\b(?:CREATE TABLE|ALTER TABLE|DROP TABLE|db:reset|db:migrate|seed)\b/i;

  for (const [filePath, source] of Object.entries(checkedSources)) {
    assert.doesNotMatch(
      source,
      forbiddenImportPattern,
      `${filePath} must not import forbidden provider/retrieval/proof/evidence/work/Codex/share modules`,
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
      "smoke:research-candidate-preview-draft-readiness-copy-packet-v0-1"
    ],
    "node scripts/smoke-research-candidate-preview-draft-readiness-copy-packet-v0-1.mjs",
    "package.json must expose the readiness copy packet smoke",
  );

  for (const existingSmokeScript of [
    "smoke:research-candidate-preview-draft-gate-explanations-v0-1",
    "smoke:research-candidate-preview-draft-promotion-readiness-v0-1",
    "smoke:cockpit-startup-readiness-readout-v0-1",
  ]) {
    assert.ok(
      packageJson.scripts[existingSmokeScript],
      `package.json must retain ${existingSmokeScript}`,
    );
  }

  for (const requiredText of [
    "Manual note preview draft readiness copy packet lane",
    "Readiness copy packet",
    "local clipboard only",
    "external_handoff_sent false",
    "raw_manual_note_text_included false",
    "smoke:research-candidate-preview-draft-readiness-copy-packet-v0-1",
    "Manual note preview draft gate explanations lane",
  ]) {
    assert.ok(index.includes(requiredText), `docs index must include ${requiredText}`);
  }
}
