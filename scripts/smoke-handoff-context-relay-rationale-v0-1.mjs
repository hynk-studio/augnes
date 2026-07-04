#!/usr/bin/env node
import assert from "node:assert/strict";
import {
  assertChangedFilesWithin,
  assertContainsAll,
  assertPackageScript,
  collectUntrackedFiles,
  loadTextByFile,
  uniqueSorted,
} from "./smoke-boundary-common.mjs";

const typeFile = "types/handoff-context-relay-rationale.ts";
const helperFile = "lib/handoff/handoff-context-relay-rationale.ts";
const panelFile =
  "components/handoff/handoff-context-relay-rationale-panel.tsx";
const copyExportHelperFile = "lib/handoff/handoff-capsule-copy-export.ts";
const copyExportPanelFile = "components/handoff/handoff-copy-export-panel.tsx";
const agentWorkplaneFile = "components/workplane/agent-workplane.tsx";
const continuityTypeFile = "types/workplane-continuity-relay.ts";
const continuityHelperFile = "lib/workplane/workplane-continuity-relay.ts";
const packageJsonFile = "package.json";
const smokeFile = "scripts/smoke-handoff-context-relay-rationale-v0-1.mjs";
const handoffCopySmokeFile =
  "scripts/smoke-handoff-capsule-copy-export-v0-1.mjs";
const workplanePanelsSmokeFile =
  "scripts/smoke-agent-workplane-panels-v0-1.mjs";
const continuityRelaySmokeFile =
  "scripts/smoke-workplane-continuity-relay-v0-1.mjs";
const codexResultFeedbackTypeFile =
  "types/codex-result-feedback-draft.ts";
const codexResultFeedbackHelperFile =
  "lib/dogfooding/codex-result-feedback-draft.ts";
const codexResultFeedbackPanelFile =
  "components/codex-result-feedback-draft-panel.tsx";
const codexResultFeedbackSmokeFile =
  "scripts/smoke-codex-result-feedback-draft-v0-1.mjs";
const dogfoodReuseProposalTypeFile =
  "types/dogfood-reuse-record-proposal.ts";
const dogfoodReuseProposalHelperFile =
  "lib/dogfooding/dogfood-reuse-record-proposal.ts";
const dogfoodReuseProposalPanelFile =
  "components/dogfood-reuse-record-proposal-panel.tsx";
const dogfoodReuseProposalSmokeFile =
  "scripts/smoke-dogfood-reuse-record-proposal-v0-1.mjs";

const allowedChangedFiles = [
  typeFile,
  helperFile,
  panelFile,
  copyExportHelperFile,
  copyExportPanelFile,
  agentWorkplaneFile,
  packageJsonFile,
  smokeFile,
  handoffCopySmokeFile,
  workplanePanelsSmokeFile,
  continuityRelaySmokeFile,
  codexResultFeedbackTypeFile,
  codexResultFeedbackHelperFile,
  codexResultFeedbackPanelFile,
  codexResultFeedbackSmokeFile,
  dogfoodReuseProposalTypeFile,
  dogfoodReuseProposalHelperFile,
  dogfoodReuseProposalPanelFile,
  dogfoodReuseProposalSmokeFile,
];

const textByFile = loadTextByFile([
  ...allowedChangedFiles,
  continuityTypeFile,
  continuityHelperFile,
]);
const typeText = textByFile.get(typeFile);
const helperText = textByFile.get(helperFile);
const panelText = textByFile.get(panelFile);
const copyExportHelperText = textByFile.get(copyExportHelperFile);
const copyExportPanelText = textByFile.get(copyExportPanelFile);
const agentWorkplaneText = textByFile.get(agentWorkplaneFile);
const packageJsonText = textByFile.get(packageJsonFile);
const continuityTypeText = textByFile.get(continuityTypeFile);
const continuityHelperText = textByFile.get(continuityHelperFile);

assertPackageScript({
  packageJsonText,
  scriptName: "smoke:handoff-context-relay-rationale-v0-1",
  expectedCommand:
    "tsx --tsconfig tsconfig.json scripts/smoke-handoff-context-relay-rationale-v0-1.mjs",
});

assertContainsAll(
  typeText,
  [
    "handoff_context_relay_rationale.v0.1",
    "source_refs",
    "selected_refs",
    "why_included",
    "stale_or_gap_warnings",
    "excluded_or_deferred_refs",
    "stop_if_missing",
    "non_goals",
    "expected_return_signal",
    "authority_boundary",
    "source_status",
    "fallback_reason",
    "can_write_db: false",
    "can_mutate_memory: false",
    "can_promote_memory: false",
    "can_apply_project_perspective: false",
    "can_call_provider_openai: false",
    "can_call_github: false",
    "can_execute_codex: false",
    "can_send_handoff: false",
    "can_create_graph_or_vector_store: false",
    "can_create_rag_stack: false",
    "can_crawl_or_observe_browser: false",
    "can_launch_autonomous_action: false",
  ],
  { label: typeFile },
);

assertContainsAll(
  helperText,
  [
    "buildHandoffContextRelayRationale",
    "WorkplaneContinuityRelay",
    "WORKPLANE_CONTINUITY_RELAY_VERSION",
    "preserve_current_work",
    "warn_about_reuse",
    "block_confident_handoff_if_missing",
    "guide_next_focus",
    "changed_files",
    "checks_run",
    "skipped_checks",
    "requirement_progress",
    "context_helpful_or_stale_refs",
    "unresolved_gaps",
    "next_relay_update_suggestions",
    "No durable memory promotion.",
    "No Perspective apply.",
    "No provider or LLM call.",
    "No GitHub or Codex execution.",
    "No handoff send.",
    "source_of_truth: false",
    "derived_read_model: true",
    "can_write_db: false",
    "can_mutate_memory: false",
    "can_execute_codex: false",
    "can_send_handoff: false",
    "can_create_rag_stack: false",
  ],
  { label: helperFile },
);
assert(
  !helperText.includes("buildWorkplaneContinuityRelay"),
  `${helperFile} must consume the existing relay, not rebuild it`,
);
assertNoForbiddenRuntimeCode(helperFile, helperText);

assertContainsAll(
  panelText,
  [
    "HandoffContextRelayRationalePanel",
    "Relay rationale",
    "selected refs",
    "stale/gaps",
    "stop if missing",
    "return signal",
    "non-goals",
    "Read-only context compilation",
    "can_send_handoff",
    "can_execute_codex",
    "can_mutate_memory",
  ],
  { label: panelFile },
);
assertNoForbiddenRuntimeCode(panelFile, panelText);

assertContainsAll(
  copyExportHelperText,
  [
    "HandoffContextRelayRationale",
    "context_relay_rationale",
    "context_rationale_selected_ref_count",
    "formatContextRelayRationaleForCopy",
    "## Context Relay Rationale",
    "### Why Included",
    "### Stale Or Gap Warnings",
    "### Stop If Missing",
    "### Expected Return Signal",
  ],
  { label: copyExportHelperFile },
);

assertContainsAll(
  copyExportPanelText,
  [
    "contextRelayRationale",
    "buildHandoffCopyExportPreview(preview, contextRelayRationale)",
    "context rationale",
    "selected refs",
    "why-included rationale",
    "stale/gap warnings",
    "stop-if-missing blockers",
    "expected return signal",
  ],
  { label: copyExportPanelFile },
);

assertContainsAll(
  agentWorkplaneText,
  [
    "buildHandoffContextRelayRationale",
    "continuity_relay: context.continuity_relay",
    "handoff_preview: handoffPreview",
    "HandoffContextRelayRationalePanel",
    "contextRelayRationale={handoffContextRationale}",
  ],
  { label: agentWorkplaneFile },
);

assertContainsAll(
  continuityTypeText,
  [
    "workplane_continuity_relay.v0.1",
    "preserve_anchors",
    "warn_anchors",
    "stale_or_gap_warnings",
    "stop_if_missing",
    "next_focus",
  ],
  { label: continuityTypeFile },
);
assertContainsAll(
  continuityHelperText,
  ["buildWorkplaneContinuityRelay"],
  { label: continuityHelperFile },
);

const { readGuideBriefForWeb } = await import(
  "../lib/guide/read-guide-brief-for-web.ts"
);
const { readWorkplaneContext } = await import(
  "../lib/workplane/read-workplane-context.ts"
);
const { readHandoffCapsulePreviewForWeb } = await import(
  "../lib/handoff/read-handoff-capsule-for-web.ts"
);
const { buildHandoffContextRelayRationale } = await import(
  "../lib/handoff/handoff-context-relay-rationale.ts"
);
const { buildHandoffCopyExportPreview } = await import(
  "../lib/handoff/handoff-capsule-copy-export.ts"
);
const { HANDOFF_CONTEXT_RELAY_RATIONALE_VERSION } = await import(
  "../types/handoff-context-relay-rationale.ts"
);

const guideBrief = readGuideBriefForWeb();
const workplaneContext = await readWorkplaneContext({ guide_brief: guideBrief });
const handoffPreview = readHandoffCapsulePreviewForWeb();
const rationale = buildHandoffContextRelayRationale({
  continuity_relay: workplaneContext.continuity_relay,
  handoff_preview: handoffPreview,
});

assert.equal(
  rationale.rationale_version,
  HANDOFF_CONTEXT_RELAY_RATIONALE_VERSION,
);
assert.equal(rationale.source_status.continuity_relay, "supplied");
assert.equal(rationale.authority_boundary.source_of_truth, false);
assert.equal(rationale.authority_boundary.derived_read_model, true);
assert.equal(rationale.authority_boundary.can_write_db, false);
assert.equal(rationale.authority_boundary.can_mutate_memory, false);
assert.equal(rationale.authority_boundary.can_apply_project_perspective, false);
assert.equal(rationale.authority_boundary.can_call_provider_openai, false);
assert.equal(rationale.authority_boundary.can_call_github, false);
assert.equal(rationale.authority_boundary.can_execute_codex, false);
assert.equal(rationale.authority_boundary.can_send_handoff, false);
assert.equal(rationale.authority_boundary.can_create_graph_or_vector_store, false);
assert.equal(rationale.authority_boundary.can_create_rag_stack, false);
assert.equal(rationale.authority_boundary.can_crawl_or_observe_browser, false);
assert(rationale.source_refs.continuity_relay_ref);
assert(rationale.source_refs.handoff_capsule_ref);
assert(rationale.source_refs.codex_launch_card_ref);
assert(rationale.selected_refs.length > 0);
assert.equal(rationale.why_included.length, rationale.selected_refs.length);
assert(
  rationale.selected_refs.some(
    (ref) => ref.reason_category === "preserve_current_work",
  ),
  "rationale must include preserve-current-work selected refs",
);
assert(
  rationale.why_included.some((why) => why.ref_id === rationale.selected_refs[0].ref_id),
  "each selected ref must have why-included rationale",
);
assert(
  rationale.stale_or_gap_warnings.length > 0,
  "stale/gap warnings must carry forward",
);
assert(
  rationale.stop_if_missing.every((item) => typeof item.blocks_handoff === "boolean"),
  "stop-if-missing blockers must remain visible",
);
for (const field of [
  "changed_files",
  "checks_run",
  "skipped_checks",
  "requirement_progress",
  "context_helpful_or_stale_refs",
  "unresolved_gaps",
  "next_relay_update_suggestions",
]) {
  assert(
    [
      ...rationale.expected_return_signal.required_fields,
      ...rationale.expected_return_signal.context_feedback_fields,
    ].includes(field),
    `expected_return_signal must include ${field}`,
  );
}

const missingRationale = buildHandoffContextRelayRationale({
  continuity_relay: null,
  handoff_preview: null,
});
assert.equal(missingRationale.source_status.continuity_relay, "missing");
assert(
  missingRationale.stop_if_missing.some(
    (item) => item.stop_id === "stop.missing_continuity_relay",
  ),
  "missing continuity relay must produce a visible stop-if-missing blocker",
);
assert(
  missingRationale.stale_or_gap_warnings.some(
    (warning) =>
      warning.warning_id ===
      "handoff_context_relay_rationale.missing_continuity_relay",
  ),
  "missing continuity relay must produce a visible warning",
);

const copyPreview = buildHandoffCopyExportPreview(handoffPreview, rationale);
assert(copyPreview.json_preview.context_relay_rationale);
assert.equal(
  copyPreview.json_preview.context_relay_rationale.rationale_version,
  HANDOFF_CONTEXT_RELAY_RATIONALE_VERSION,
);
assert(
  copyPreview.combined_markdown.includes("## Context Relay Rationale"),
  "combined copy packet must include the context relay rationale",
);
assert.equal(
  countOccurrences(copyPreview.combined_markdown, "## Context Relay Rationale"),
  1,
  "combined copy packet must include Context Relay Rationale exactly once",
);
assert.equal(
  countOccurrences(copyPreview.capsule_markdown, "## Context Relay Rationale"),
  1,
  "standalone Handoff Capsule copy packet must include Context Relay Rationale",
);
assert.equal(
  countOccurrences(
    copyPreview.launch_card_markdown,
    "## Context Relay Rationale",
  ),
  1,
  "standalone Codex Launch Card copy packet must include Context Relay Rationale",
);
assert(
  copyPreview.combined_markdown.includes("### Expected Return Signal"),
  "combined copy packet must include expected return signal",
);
assert(
  copyPreview.packet_input_summary.context_rationale_selected_ref_count > 0,
  "copy packet summary must count selected rationale refs",
);

const changedFilesBoundary = assertChangedFilesWithin({
  allowedChangedFiles,
  label: "handoff-context-relay-rationale-v0-1",
});
const untrackedFiles = collectUntrackedFiles();
const changedAndUntrackedFiles = uniqueSorted([
  ...changedFilesBoundary.files,
  ...untrackedFiles,
]);
for (const file of changedAndUntrackedFiles) {
  assert(
    allowedChangedFiles.includes(file),
    `Unexpected handoff context relay rationale file: ${file}`,
  );
}

console.log(
  JSON.stringify(
    {
      smoke: "handoff-context-relay-rationale-v0-1",
      pass: true,
      selected_ref_count: rationale.selected_refs.length,
      why_included_count: rationale.why_included.length,
      warning_count: rationale.stale_or_gap_warnings.length,
      stop_if_missing_count: rationale.stop_if_missing.length,
      expected_return_signal_checked: true,
      copy_packet_rationale_checked: true,
      missing_partial_input_checked: true,
      authority_boundary_checked: true,
      consumed_continuity_relay: true,
      changed_files_checked: changedFilesBoundary.checked,
      changed_files_skipped: changedFilesBoundary.skipped,
      changed_files_observed: changedFilesBoundary.files,
      durable_write_added: false,
      provider_call_added: false,
      github_call_added: false,
      codex_execution_added: false,
      handoff_send_added: false,
      memory_promotion_added: false,
      perspective_apply_added: false,
      graph_vector_rag_crawler_observer_added: false,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:handoff-context-relay-rationale-v0-1");

function assertNoForbiddenRuntimeCode(file, text) {
  const forbiddenPatterns = [
    /from\s+["']@\/app\//,
    /from\s+["']@\/apps\/augnes_apps/,
    /from\s+["']@\/lib\/db/,
    /from\s+["'][^"']*(openai|octokit|github|provider)[^"']*["']/i,
    /\bfetch\s*\(/,
    /\bchild_process\b/,
    /\bspawn\s*\(/,
    /\bexec\s*\(/,
    /\bwriteFile(?:Sync)?\s*\(/,
    /\bappendFile(?:Sync)?\s*\(/,
    /\bDate\.now\s*\(/,
    /\bnew\s+Date\s*\(/,
    /\bMath\.random\s*\(/,
    /\blaunchCodex\b/i,
    /\bsendHandoff\b/i,
    /\bcreatePullRequest\b/i,
    /\brecordProof\b/i,
    /\bcreateEvidenceRecord\b/i,
    /\bcreateGraph\b/i,
    /\bcreateVector\b/i,
    /\bcrawl\b/i,
  ];

  for (const pattern of forbiddenPatterns) {
    assert(!pattern.test(text), `${file} must not include ${pattern}`);
  }
}

function countOccurrences(text, needle) {
  return text.split(needle).length - 1;
}
