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
const preflightReadoutPath =
  "components/research-candidate-promotion-readiness-preflight-readout.tsx";
const startupReadinessPath = "components/cockpit-startup-readiness-readout.tsx";
const cssPath = "app/globals.css";
const indexPath = "docs/00_INDEX_LATEST.md";
const packagePath = "package.json";
const previousSmokePath =
  "scripts/smoke-research-candidate-preview-draft-readiness-copy-packet-v0-1.mjs";
const smokePath =
  "scripts/smoke-research-candidate-preview-draft-readiness-copy-packet-staleness-v0-1.mjs";

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
  preflightReadoutPath,
  startupReadinessPath,
  cssPath,
  indexPath,
  packagePath,
  previousSmokePath,
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
  readFileSync(preflightReadoutPath, "utf8"),
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
      smoke:
        "research-candidate-preview-draft-readiness-copy-packet-staleness-v0-1",
      packet_fingerprint_checked: true,
      packet_input_summary_checked: true,
      generated_at_exclusion_checked: true,
      ui_freshness_checked: true,
      in_memory_state_checked: true,
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
    "MANUAL_NOTE_PREVIEW_DRAFT_READINESS_COPY_PACKET_FINGERPRINT_ALGORITHM",
    "fnv1a32_canonical_json_v0_1",
    "ManualNotePreviewDraftReadinessCopyPacketFingerprintAlgorithm",
    "ManualNotePreviewDraftReadinessCopyPacketInputSummary",
    "packet_fingerprint_algorithm",
    "packet_fingerprint",
    "packet_input_summary",
    "packet_generated_at",
    "preview_draft_id",
    "preflight_readiness_status",
    "preflight_readiness_score",
    "lifecycle_status",
    "draft_updated_at",
    "label_state",
    "discard_state",
    "activity_count",
    "last_activity_type",
    "last_activity_at",
    "gate_count",
    "blocker_count",
    "warning_count",
    "copied_activity_included",
    "copied_activity_count",
    "packet_fingerprint_is_security_authority: false",
    "packet_fingerprint_persisted: false",
  ]) {
    assert.ok(
      sharedRuntime.includes(requiredText),
      `shared runtime must include ${requiredText}`,
    );
  }
}

function assertBuilder() {
  for (const requiredText of [
    "packet_fingerprint",
    "packet_fingerprint_algorithm",
    "packet_character_count_human",
    "packet_character_count_json",
    "packet_input_summary",
    "buildReadinessCopyPacketFingerprint",
    "stableCanonicalJson",
    "fnv1a32Hex",
    "Math.imul",
    "omitGeneratedAtForFingerprint",
    "generated_at",
    "packet_generated_at",
    "packet_fingerprint_is_security_authority: false",
    "packet_fingerprint_persisted: false",
    "Fingerprint compares preview packet content only. It excludes generated_at and is not security authority.",
  ]) {
    assert.ok(builder.includes(requiredText), `builder must include ${requiredText}`);
  }

  assert.match(
    builder,
    /const\s*\{\s*generated_at:\s*[^,]+,\s*packet_generated_at:\s*[^,]+,\s*\.\.\.rest\s*\}/,
    "fingerprint input must omit generated_at and packet_generated_at",
  );
  assert.doesNotMatch(
    builder,
    /\b(?:crypto|subtle|createHash|sha256|md5)\b/i,
    "fingerprint must use local deterministic non-crypto helper",
  );
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
    "Current packet fingerprint",
    "Last copied packet fingerprint",
    "Packet freshness status",
    "No packet copied yet",
    "Current",
    "Stale",
    "Unavailable",
    "lastCopiedPacketFingerprint",
    "lastCopiedPacketMode",
    "lastCopiedPacketGeneratedAt",
    "lastCopiedPacketCharacterCount",
    "lastCopiedInputSummary",
    "getReadinessPacketFreshnessStatus",
    "buildReadinessPacketInputDiffSummary",
    "Current packet content summary",
    "Last copied packet content summary",
    "Copy a fresh packet before using it for review.",
    "Fingerprint compares preview packet content only. It excludes",
    "generated_at and is not security authority.",
    "Copy human review packet",
    "Copy JSON packet",
    "navigator.clipboard.writeText",
    "Manual copy fallback",
    "Clipboard API is unavailable",
    "Clipboard write failed",
    "packet_fingerprint_is_security_authority",
    "packet_fingerprint_persisted",
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
    "Readiness copy packet",
    "Authority boundary",
  ]) {
    assert.ok(component.includes(preservedText), `existing UI must retain ${preservedText}`);
  }

  for (const requiredCss of [
    "manual-note-readiness-copy-packet-freshness",
    "manual-note-readiness-copy-packet-summary-grid",
    "manual-note-readiness-copy-packet-summary-list",
    "manual-note-readiness-copy-packet-diff",
  ]) {
    assert.ok(css.includes(requiredCss), `CSS must include ${requiredCss}`);
  }

  assert.ok(
    startupReadiness.includes("Startup readiness"),
    "Startup readiness readout component must remain present",
  );
}

function assertForbiddenPatternsAbsent() {
  const runtimeAndBuilder = `${builder}\n${sharedRuntime}`;
  assert.doesNotMatch(
    runtimeAndBuilder,
    /from\s+["'][^"']*(?:openai|provider|retrieval|rag|source-fetch|crawler|scraper|embedding|vector|codex|proof|evidence|work-item|promotion)[^"']*["']/i,
    "builder/runtime must not import provider/retrieval/source/proof/evidence/work/Codex modules",
  );
  assert.doesNotMatch(
    runtimeAndBuilder,
    /\b(?:INSERT INTO|UPDATE\s+\w|DELETE FROM|CREATE TABLE|ALTER TABLE|DROP TABLE)\b/i,
    "builder/runtime must not write storage or mutate schema",
  );

  for (const forbiddenStoragePattern of [
    "localStorage",
    "sessionStorage",
    "indexedDB",
    "document.cookie",
  ]) {
    assert.ok(
      !component.includes(forbiddenStoragePattern),
      `UI must not use ${forbiddenStoragePattern}`,
    );
  }

  for (const forbiddenButtonLabel of [
    "Send packet",
    "Share packet",
    "Email packet",
    "Submit packet",
    "Create handoff",
    "Execute Codex",
    "Promote",
    "Approve",
    "Reject",
    "Defer",
    "Create proof",
    "Create evidence",
    "Create work item",
    "Fix all",
  ]) {
    assert.doesNotMatch(
      component,
      new RegExp(`>\\s*${escapeRegExp(forbiddenButtonLabel)}\\s*<`, "i"),
      `UI must not add forbidden button ${forbiddenButtonLabel}`,
    );
  }
}

function assertDocsAndPackagePointers() {
  assert.equal(
    packageJson.scripts[
      "smoke:research-candidate-preview-draft-readiness-copy-packet-staleness-v0-1"
    ],
    "node scripts/smoke-research-candidate-preview-draft-readiness-copy-packet-staleness-v0-1.mjs",
    "package script must point to staleness smoke",
  );

  for (const requiredText of [
    "readiness copy packet staleness",
    "packet_fingerprint",
    "fnv1a32_canonical_json_v0_1",
    "No packet copied yet",
    "Current",
    "Stale",
    "Unavailable",
    "packet_fingerprint_is_security_authority false",
    "packet_fingerprint_persisted false",
    "smoke:research-candidate-preview-draft-readiness-copy-packet-staleness-v0-1",
  ]) {
    assert.ok(index.includes(requiredText), `docs index must include ${requiredText}`);
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
