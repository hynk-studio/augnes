import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import vm from "node:vm";

const serverPath = "apps/augnes_apps/src/server.ts";
const widgetPath = "apps/augnes_apps/public/console-widget.html";
const runbookPath = "apps/augnes_apps/docs/12_WORK_CONTRACT_CARD_RUNBOOK.md";
const packagePath = "package.json";

for (const filePath of [serverPath, widgetPath, runbookPath, packagePath]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const server = readFileSync(serverPath, "utf8");
const widget = readFileSync(widgetPath, "utf8");
const runbook = readFileSync(runbookPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

assert.equal(
  packageJson.scripts?.["smoke:chatgpt-work-contract-card"],
  "node scripts/smoke-chatgpt-work-contract-card.mjs",
  "package.json must expose the Work Contract Card smoke script",
);

for (const text of [server, widget, runbook]) {
  assertBoundaryText(text);
}

assert.match(server, /work_contract_card/, "server must return Work Contract Card structured content");
assert.match(server, /codex_handoff_preview/, "server must return Codex Handoff Preview structured content");
assert.match(server, /final_codex_handoff_packet/, "server must return Final Codex Handoff Packet structured content");
assert.match(server, /codex_final_handoff_packet/, "server must expose a final handoff packet alias for model-readable access");
assert.match(server, /final_handoff_preflight/, "server must return Final Handoff Preflight structured content");
assert.match(server, /handoff_automation_slots/, "server must return handoff automation slots");
assert.match(server, /memory_reuse_attachment_proposal/, "server must return Memory Reuse attachment proposal structured content");
assert.match(server, /final_handoff_memory_reuse_attachment/, "server must return a Memory Reuse attachment proposal alias");
assert.match(server, /pr_body_checklist_preview/, "server must return PR body checklist preview structured content");
assert.match(server, /codex_pr_body_checklist/, "server must return a PR body checklist alias");
assert.match(server, /codex_closeout_skeleton/, "server must return closeout skeleton structured content");
assert.match(server, /final_handoff_closeout_skeleton/, "server must return a closeout skeleton alias");
assert.match(server, /work_contract_constellation_context/, "server must support optional Work Contract / Constellation context");
assert.match(server, /No Project Constellation context is attached to this work contract\./, "server must keep missing Constellation context explicit");
assert.match(widget, /renderWorkContractCard/, "widget must implement Work Contract Card rendering");
assert.match(widget, /renderCodexHandoffPreview/, "widget must implement Codex Handoff Preview rendering");
assert.match(widget, /renderFinalCodexHandoffPacket/, "widget must render the Final Codex Handoff section");
assert.match(widget, /renderFinalHandoffPreflight/, "widget must render final handoff preflight status");
assert.match(widget, /renderHandoffAutomationSlots/, "widget must render future attachment slots");
assert.match(widget, /renderMemoryReuseAttachmentProposal/, "widget must render Memory Reuse attachment proposal state");
assert.match(widget, /renderPrBodyChecklistPreview/, "widget must render PR body checklist preview state");
assert.match(widget, /renderWorkContractConstellationContext/, "widget must render Work Contract / Constellation context");
assert.match(widget, /renderCopyableHandoffPacket/, "widget must implement a bounded copy affordance renderer");
assert.match(server, /BEGIN_AUGNES_CODEX_HANDOFF_JSON/, "server packet must include JSON block begin delimiter");
assert.match(server, /END_AUGNES_CODEX_HANDOFF_JSON/, "server packet must include JSON block end delimiter");
assert.match(widget, /BEGIN_AUGNES_CODEX_HANDOFF_JSON/, "widget fallback packet must include JSON block begin delimiter");
assert.match(widget, /END_AUGNES_CODEX_HANDOFF_JSON/, "widget fallback packet must include JSON block end delimiter");
assert.match(widget, /After copying, validate locally with codex:handoff-preflight\./, "widget must include local preflight hint text");
assert.match(widget, /Clipboard API/, "copy behavior must retain Clipboard API path text or implementation");
assert.match(widget, /document\.execCommand\?\.\("copy"\)/, "copy behavior must retain execCommand fallback");
assert.match(widget, /selectElementText\(pre\)/, "copy behavior must retain visible text selection fallback");
assert.match(runbook, /Data Source/i, "runbook must explain the data source");
assert.match(runbook, /Missing Data Behavior/i, "runbook must explain missing data behavior");
assert.match(runbook, /Codex Handoff Preview/i, "runbook must explain the Codex Handoff Preview");
assert.match(runbook, /Final Codex Handoff Auto-Compose And Preflight/i, "runbook must explain final handoff auto-compose and preflight");
assert.match(runbook, /final_codex_handoff_packet/, "runbook must name the final handoff packet field");
assert.match(runbook, /final_handoff_preflight/, "runbook must name the final handoff preflight field");
assert.match(runbook, /memory_reuse_attachment/, "runbook must document Memory Reuse attachment proposal slot");
assert.match(runbook, /no_match.*valid state/i, "runbook must document no_match as valid");
assert.match(runbook, /pr_body_checklist/, "runbook must document PR body checklist slot");
assert.match(runbook, /preview-only PR body checklist/i, "runbook must document preview-only PR body checklist behavior");
assert.match(runbook, /closeout skeleton/i, "runbook must document the closeout skeleton");
assert.match(runbook, /placeholders/i, "runbook must distinguish placeholders from actual results");
assert.match(runbook, /codex_result_review_packet/, "runbook must document inert result review packet slot");
for (const status of ["proposed", "no_match", "unavailable", "not_configured"]) {
  assert.match(server, new RegExp(escapeRegExp(status)), `server must support Memory Reuse proposal status ${status}`);
  assert.match(widget, new RegExp(escapeRegExp(status)), `widget must support Memory Reuse proposal status ${status}`);
}

const uiText = `${server}\n${widget}`;
assertNoForbiddenServerOrWidgetCalls(uiText);
const forbiddenUiPhrases = [
  "Run Codex",
  "Start Codex",
  "Execute Codex",
  "Launch Codex",
  "Send to Codex",
  "Merge PR",
  "Enable auto-merge",
  "Approve publication",
  "Publish now",
  "Commit state",
  "Record proof",
  "Record evidence",
  "Retry",
  "Replay",
  "Deploy",
  "Post externally",
  "Create PR",
  "Open PR",
];
const allowedCopyLabels = ["Copy Codex Handoff", "Copy Handoff Preview"];
for (const phrase of forbiddenUiPhrases) {
  assert.doesNotMatch(uiText, new RegExp(escapeRegExp(phrase), "g"), `UI text must not include ${phrase}`);
}

const writeTools = collectToolsWithAnnotation(server, "bridgeWriteAnnotations");
assert.deepEqual(
  writeTools,
  [
    "augnes_observe",
    "augnes_record_action_result",
    "augnes_record_work_event",
    "augnes_generate_codex_handoff_draft",
    "augnes_review_codex_result_draft",
  ],
  "existing bridge write tools must not be broadened or extended for the card",
);
assert.ok(!writeTools.some((name) => /work_contract|contract_card/i.test(name)), "card must not add a bridge write tool");

const workBriefBlock = extractToolBlock(server, "augnes_get_work_brief");
assert.match(workBriefBlock, /annotations:\s*bridgeReadAnnotations/, "augnes_get_work_brief must remain read-only annotated");
assert.match(workBriefBlock, /_meta:\s*widgetToolMeta/, "augnes_get_work_brief must be widget-backed for the card");
assert.match(workBriefBlock, /work_contract_card/, "augnes_get_work_brief must carry card structured content");
assert.match(workBriefBlock, /codex_handoff_preview/, "augnes_get_work_brief must carry handoff preview structured content");
assert.match(workBriefBlock, /final_codex_handoff_packet/, "augnes_get_work_brief must carry final handoff packet structured content");
assert.match(workBriefBlock, /final_handoff_preflight/, "augnes_get_work_brief must carry final handoff preflight structured content");
assert.match(workBriefBlock, /handoff_automation_slots/, "augnes_get_work_brief must carry automation slots");
assert.match(workBriefBlock, /memory_reuse_attachment_proposal/, "augnes_get_work_brief must carry Memory Reuse proposal structured content");
assert.match(workBriefBlock, /pr_body_checklist_preview/, "augnes_get_work_brief must carry PR body checklist preview structured content");
assert.match(workBriefBlock, /codex_closeout_skeleton/, "augnes_get_work_brief must carry closeout skeleton structured content");
assert.doesNotMatch(server, /buildPerspectiveMemoryReuseIntakeFromStore\s*\(/, "App/MCP server must not run the store-backed Memory Reuse intake helper");
assert.doesNotMatch(server, /listPerspectiveMemoryItems\s*\(/, "App/MCP server must not query persisted perspective-memory items for this preview");

if (server.includes('"augnes_get_work_contract_card"')) {
  const cardToolBlock = extractToolBlock(server, "augnes_get_work_contract_card");
  assert.match(cardToolBlock, /annotations:\s*bridgeReadAnnotations|annotations:\s*readOnlyAnnotations/, "new card tool must be read-only annotated");
  assert.doesNotMatch(cardToolBlock, /annotations:\s*bridgeWriteAnnotations/, "new card tool must not be write annotated");
}

assertNoNetworkCalls(extractFunction(server, "buildWorkContractCard"), "buildWorkContractCard");
assertNoNetworkCalls(extractFunction(server, "buildCodexHandoffPreview"), "buildCodexHandoffPreview");
assertNoNetworkCalls(extractFunction(server, "buildCopyableHandoffText"), "buildCopyableHandoffText");
assertNoNetworkCalls(extractFunction(server, "memoryReuseAttachmentStatusFromUnknown"), "memoryReuseAttachmentStatusFromUnknown");
assertNoNetworkCalls(extractFunction(server, "memoryReuseSourceContextFromUnknown"), "memoryReuseSourceContextFromUnknown");
assertNoNetworkCalls(extractFunction(server, "buildMemoryReuseTaskSummary"), "buildMemoryReuseTaskSummary");
assertNoNetworkCalls(extractFunction(server, "buildDefaultMemoryReuseSelectionGuidance"), "buildDefaultMemoryReuseSelectionGuidance");
assertNoNetworkCalls(extractFunction(server, "fallbackBriefForMemoryReuseStatus"), "fallbackBriefForMemoryReuseStatus");
assertNoNetworkCalls(extractFunction(server, "memoryReuseProposalSourceFromBrief"), "memoryReuseProposalSourceFromBrief");
assertNoNetworkCalls(extractFunction(server, "memoryReuseSelectedIdsFromSource"), "memoryReuseSelectedIdsFromSource");
assertNoNetworkCalls(extractFunction(server, "buildMemoryReuseAttachmentProposal"), "buildMemoryReuseAttachmentProposal");
assertNoNetworkCalls(extractFunction(server, "summarizeMemoryReuseAttachmentProposal"), "summarizeMemoryReuseAttachmentProposal");
assertNoNetworkCalls(extractFunction(server, "memoryReuseProposalLines"), "memoryReuseProposalLines");
assertNoNetworkCalls(extractFunction(server, "buildPrBodyChecklistPreview"), "buildPrBodyChecklistPreview");
assertNoNetworkCalls(extractFunction(server, "summarizeMemoryReuseForCloseout"), "summarizeMemoryReuseForCloseout");
assertNoNetworkCalls(extractFunction(server, "summarizeConstellationForCloseout"), "summarizeConstellationForCloseout");
assertNoNetworkCalls(extractFunction(server, "buildCloseoutSkeletonText"), "buildCloseoutSkeletonText");
assertNoNetworkCalls(extractFunction(server, "buildCloseoutSkeleton"), "buildCloseoutSkeleton");
assertNoNetworkCalls(extractFunction(server, "buildHandoffAutomationSlots"), "buildHandoffAutomationSlots");
assertNoNetworkCalls(extractFunction(server, "buildFinalCodexHandoffJsonBlock"), "buildFinalCodexHandoffJsonBlock");
assertNoNetworkCalls(extractFunction(server, "buildFinalCodexHandoffText"), "buildFinalCodexHandoffText");
assertNoNetworkCalls(extractFunction(server, "buildFinalCodexHandoffPacket"), "buildFinalCodexHandoffPacket");
assertNoNetworkCalls(extractFunction(server, "extractStructuredHandoffJsonBlock"), "extractStructuredHandoffJsonBlock");
assertNoNetworkCalls(extractFunction(server, "finalHandoffMemoryReusePreflightCheck"), "finalHandoffMemoryReusePreflightCheck");
assertNoNetworkCalls(extractFunction(server, "finalHandoffPrBodyChecklistPreflightCheck"), "finalHandoffPrBodyChecklistPreflightCheck");
assertNoNetworkCalls(extractFunction(server, "buildFinalHandoffPreflight"), "buildFinalHandoffPreflight");
assertNoNetworkCalls(extractFunction(server, "buildWorkContractConstellationContext"), "buildWorkContractConstellationContext");
assertNoNetworkCalls(extractFunction(server, "buildWorkContractConstellationContextFromBrief"), "buildWorkContractConstellationContextFromBrief");
assertNoNetworkCalls(extractFunction(server, "describeWorkContractCard"), "describeWorkContractCard");
assertNoNetworkCalls(extractFunction(server, "describeCodexHandoffPreview"), "describeCodexHandoffPreview");
assertNoNetworkCalls(extractFunction(server, "describeFinalCodexHandoffPacket"), "describeFinalCodexHandoffPacket");
assertNoNetworkCalls(extractFunction(widget, "renderWorkContractCard"), "renderWorkContractCard");
assertNoNetworkCalls(extractFunction(widget, "renderCodexHandoffPreview"), "renderCodexHandoffPreview");
assertNoNetworkCalls(extractFunction(widget, "renderFinalCodexHandoffPacket"), "renderFinalCodexHandoffPacket");
assertNoNetworkCalls(extractFunction(widget, "renderFinalHandoffPreflight"), "renderFinalHandoffPreflight");
assertNoNetworkCalls(extractFunction(widget, "renderMemoryReuseAttachmentProposal"), "renderMemoryReuseAttachmentProposal");
assertNoNetworkCalls(extractFunction(widget, "renderPrBodyChecklistPreview"), "renderPrBodyChecklistPreview");
assertNoNetworkCalls(extractFunction(widget, "renderHandoffAutomationSlots"), "renderHandoffAutomationSlots");
assertNoNetworkCalls(extractFunction(widget, "renderWorkContractConstellationContext"), "renderWorkContractConstellationContext");
assertNoNetworkCalls(extractFunction(widget, "renderCopyableHandoffPacket"), "renderCopyableHandoffPacket");
assertNoNetworkCalls(extractFunction(widget, "normalizeWorkContractCard"), "normalizeWorkContractCard");
assertNoNetworkCalls(extractFunction(widget, "normalizeCodexHandoffPreview"), "normalizeCodexHandoffPreview");
assertNoNetworkCalls(extractFunction(widget, "normalizeFinalCodexHandoffPacket"), "normalizeFinalCodexHandoffPacket");
assertNoNetworkCalls(extractFunction(widget, "normalizeFinalHandoffPreflight"), "normalizeFinalHandoffPreflight");
assertNoNetworkCalls(extractFunction(widget, "normalizeMemoryReuseAttachmentProposal"), "normalizeMemoryReuseAttachmentProposal");
assertNoNetworkCalls(extractFunction(widget, "normalizePrBodyChecklistPreview"), "normalizePrBodyChecklistPreview");
assertNoNetworkCalls(extractFunction(widget, "normalizeCloseoutSkeleton"), "normalizeCloseoutSkeleton");
assertNoNetworkCalls(extractFunction(widget, "memoryReuseAttachmentPreflightCheck"), "memoryReuseAttachmentPreflightCheck");
assertNoNetworkCalls(extractFunction(widget, "prBodyChecklistPreflightCheck"), "prBodyChecklistPreflightCheck");
assertNoNetworkCalls(extractFunction(widget, "localFinalPreflight"), "localFinalPreflight");
assertNoNetworkCalls(extractFunction(widget, "normalizeWorkContractConstellationContext"), "normalizeWorkContractConstellationContext");
assertNoNetworkCalls(widget, "console-widget");

const renderSource = [
  extractFunction(widget, "el"),
  extractFunction(widget, "codeChip"),
  extractFunction(widget, "tag"),
  extractFunction(widget, "createMetricGrid"),
  extractFunction(widget, "createSection"),
  extractFunction(widget, "createTextList"),
  extractFunction(widget, "createCodeList"),
  extractFunction(widget, "createPreBlock"),
  extractFunction(widget, "copyTextToClipboard"),
  extractFunction(widget, "selectElementText"),
  extractFunction(widget, "renderCopyableHandoffPacket"),
  extractFunction(widget, "nonEmptyText"),
  extractFunction(widget, "safeArray"),
  extractFunction(widget, "safeCount"),
  extractFunction(widget, "createCodeListWithFallback"),
  extractFunction(widget, "safeRecord"),
  extractFunction(widget, "safeRecordArray"),
  extractFunction(widget, "firstRecord"),
  extractFunction(widget, "sourceRefText"),
  extractFunction(widget, "summarizeContextEvidenceRef"),
  extractFunction(widget, "summarizeContextTension"),
  extractFunction(widget, "summarizeContextNextAction"),
  extractFunction(widget, "normalizeWorkContractConstellationContext"),
  extractFunction(widget, "constellationContextPacketLines"),
  extractFunction(widget, "memoryReuseAttachmentBoundaryText"),
  extractFunction(widget, "fallbackMemoryReuseBrief"),
  extractFunction(widget, "normalizeMemoryReuseSourceContext"),
  extractFunction(widget, "selectedMemoryIdsFromProposal"),
  extractFunction(widget, "normalizeMemoryReuseAttachmentProposal"),
  extractFunction(widget, "memoryReuseProposalLineItems"),
  extractFunction(widget, "prBodyChecklistRequiredSections"),
  extractFunction(widget, "prBodyChecklistBoundaryText"),
  extractFunction(widget, "prBodyChecklistForbiddenClaims"),
  extractFunction(widget, "prBodyChecklistWarnings"),
  extractFunction(widget, "normalizePrBodyChecklistPreview"),
  extractFunction(widget, "summarizeMemoryReuseForCloseout"),
  extractFunction(widget, "summarizeConstellationForCloseout"),
  extractFunction(widget, "closeoutSkeletonTextFromSections"),
  extractFunction(widget, "normalizeCloseoutSkeleton"),
  extractFunction(widget, "fallbackHandoffAutomationSlots"),
  extractFunction(widget, "slotLine"),
  extractFunction(widget, "finalConstellationPacketLines"),
  extractFunction(widget, "composeFallbackFinalHandoffText"),
  extractFunction(widget, "normalizeFinalCodexHandoffPacket"),
  extractFunction(widget, "extractStructuredHandoffBlock"),
  extractFunction(widget, "containsForbiddenFinalHandoffLabel"),
  extractFunction(widget, "memoryReuseAttachmentPreflightCheck"),
  extractFunction(widget, "prBodyChecklistPreflightCheck"),
  extractFunction(widget, "localFinalPreflight"),
  extractFunction(widget, "normalizeFinalHandoffPreflight"),
  extractFunction(widget, "normalizeWorkContractCard"),
  extractFunction(widget, "normalizeCodexHandoffPreview"),
  extractFunction(widget, "renderWorkContractConstellationContext"),
  extractFunction(widget, "renderFinalHandoffPreflight"),
  extractFunction(widget, "renderMemoryReuseAttachmentProposal"),
  extractFunction(widget, "renderPrBodyChecklistPreview"),
  extractFunction(widget, "renderHandoffAutomationSlots"),
  extractFunction(widget, "renderFinalCodexHandoffPacket"),
  extractFunction(widget, "renderCodexHandoffPreview"),
  extractFunction(widget, "renderWorkContractCard"),
].join("\n\n");

assertNoForbiddenControls(extractFunction(widget, "renderWorkContractCard"), "renderWorkContractCard");
assertNoForbiddenControls(extractFunction(widget, "renderCodexHandoffPreview"), "renderCodexHandoffPreview");
assertNoForbiddenControls(extractFunction(widget, "renderFinalHandoffPreflight"), "renderFinalHandoffPreflight");
assertNoForbiddenControls(extractFunction(widget, "renderMemoryReuseAttachmentProposal"), "renderMemoryReuseAttachmentProposal");
assertNoForbiddenControls(extractFunction(widget, "renderPrBodyChecklistPreview"), "renderPrBodyChecklistPreview");
assertNoForbiddenControls(extractFunction(widget, "renderHandoffAutomationSlots"), "renderHandoffAutomationSlots");
assertNoForbiddenControls(extractFunction(widget, "normalizeWorkContractCard"), "normalizeWorkContractCard");
assertNoForbiddenControls(extractFunction(widget, "normalizeCodexHandoffPreview"), "normalizeCodexHandoffPreview");
assertSafeCopyAffordanceSource(extractFunction(widget, "renderCopyableHandoffPacket"));
assertSafeCopyHelperSource(extractFunction(widget, "copyTextToClipboard"));

const renderedFallback = renderFallbackCard(renderSource);
const renderedFallbackText = renderedFallback.text;
for (const expectedFallback of [
  "No expected files are listed in the work brief.",
  "No expected checks are listed in the work brief.",
  "No related state keys are listed in the work brief.",
  "No proof/evidence expectation is listed in the work brief; proof and evidence remain separate from approval.",
  "Skipped checks must be reported with concrete reasons; no per-check skipped expectation is listed in the work brief.",
]) {
  assert.match(renderedFallbackText, new RegExp(escapeRegExp(expectedFallback)), `fallback render must include: ${expectedFallback}`);
}
assertBoundaryText(renderedFallbackText);
for (const expectedPreviewText of [
  "Codex Handoff Preview",
  "Final Codex Handoff",
  "Final Codex Handoff Packet",
  "Local read-only preflight: pass.",
  "Preflight checks",
  "Future attachment slots",
  "Memory Reuse attachment",
  "no_match",
  "Memory Reuse proposal is explicit no_match",
  "No persisted memory IDs selected.",
  "No persisted perspective-memory items were selected",
  "PR body checklist",
  "preview_only",
  "Codex PR body checklist / closeout skeleton",
  "Closeout skeleton preview",
  "Required PR body sections",
  "Summary",
  "User-facing path added or changed",
  "Files changed",
  "Verification",
  "Skipped checks and caveats",
  "Memory Reuse attachment status",
  "Project Constellation context status",
  "Final handoff preflight status",
  "Authority boundary statement",
  "Remaining caveats",
  "Next recommended step",
  "Placeholder:",
  "Do not claim they passed until they have actually run.",
  "Codex result review packet",
  "Readiness reasons",
  "Stop conditions",
  "Copyable handoff packet",
  "Preparation automation only.",
  "This is a preview/copy packet, not an execution action.",
  "Copy Codex Handoff",
  "After copying, validate locally with codex:handoff-preflight.",
  "BEGIN_AUGNES_CODEX_HANDOFF_JSON",
  "END_AUGNES_CODEX_HANDOFF_JSON",
  "Copy action only. The packet is for a separate Codex session; copying does not execute Codex, approve anything, record proof or evidence, mutate Augnes state, merge, or enable auto-merge.",
  "Project Constellation context",
  "No Project Constellation context is attached to this work contract.",
]) {
  assert.match(renderedFallbackText, new RegExp(escapeRegExp(expectedPreviewText)), `fallback preview must include: ${expectedPreviewText}`);
}
await assertRenderedCopyAffordance(
  renderedFallback,
  "clipboard",
  /No Project Constellation context is attached to this work contract\.[\s\S]*Memory Reuse attachment[\s\S]*No persisted memory IDs selected\./,
);
const renderedExecFallback = renderFallbackCard(renderSource, { clipboardWriteThrows: true });
await assertRenderedCopyAffordance(renderedExecFallback, "execCommand");
const renderedSelectionFallback = renderFallbackCard(renderSource, {
  clipboardWriteThrows: true,
  execCommandReturnsFalse: true,
});
await assertRenderedCopyAffordance(renderedSelectionFallback, "selection");
assertFinalPreflightFixtures(renderSource);

const renderedWithConstellation = renderConstellationContextCard(renderSource);
for (const expectedContextText of [
  "Selectable handoff seed context thesis.",
  "candidate:operator-review",
  "Operator review candidate",
  "selected",
  "Pointer one",
  "Unresolved tension summary.",
  "Operator review candidate summary.",
  "fixtures/project-constellation.sample.json",
]) {
  assert.match(renderedWithConstellation.text, new RegExp(escapeRegExp(expectedContextText)), `constellation context render must include: ${expectedContextText}`);
}
await assertRenderedCopyAffordance(renderedWithConstellation, "clipboard", /candidate:operator-review/);

const renderedWithMemoryReuse = renderMemoryReuseProposedCard(renderSource);
for (const expectedMemoryReuseText of [
  "proposed",
  "perspective-memory-item:intake-accepted",
  "Matched Work Contract and selected Constellation context",
  "Reuse only as bounded prior context",
  "Selected persisted memory item is attached as read-only prior context.",
  "Memory Reuse attachment is a read-only proposal preview.",
]) {
  assert.match(renderedWithMemoryReuse.text, new RegExp(escapeRegExp(expectedMemoryReuseText)), `Memory Reuse proposal render must include: ${expectedMemoryReuseText}`);
}
assert.doesNotMatch(renderedFallback.text, /perspective-memory-item:intake-accepted/, "no_match fallback must not invent selected memory IDs");
assert.doesNotMatch(renderedFallback.text, /Matched Work Contract and selected Constellation context/, "no_match fallback must not invent why_selected");
assert.doesNotMatch(renderedFallback.text, /Reuse only as bounded prior context/, "no_match fallback must not invent reuse_boundary");
await assertRenderedCopyAffordance(
  renderedWithMemoryReuse,
  "clipboard",
  /Memory Reuse attachment[\s\S]*perspective-memory-item:intake-accepted[\s\S]*Reuse only as bounded prior context/,
);

console.log(
  JSON.stringify(
    {
      smoke: "chatgpt-work-contract-card",
      code_present: true,
      docs_present: true,
      package_script_present: true,
      boundary_text_present: true,
      handoff_preview_present: true,
      handoff_preview_stop_conditions_present: true,
      handoff_preview_copyable_packet_present: true,
      final_codex_handoff_packet_present: true,
      final_packet_work_contract_fields_checked: true,
      final_packet_missing_constellation_fallback_checked: true,
      final_packet_attached_constellation_context_checked: true,
      memory_reuse_attachment_proposal_present: true,
      memory_reuse_attachment_no_match_checked: true,
      memory_reuse_attachment_selected_fixture_checked: true,
      memory_reuse_attachment_copy_packet_checked: true,
      pr_body_checklist_preview_present: true,
      pr_body_checklist_slot_preview_only: true,
      closeout_skeleton_present: true,
      closeout_skeleton_placeholders_checked: true,
      closeout_skeleton_copy_packet_checked: true,
      final_handoff_preflight_present: true,
      final_handoff_preflight_pass_fixture_checked: true,
      final_handoff_preflight_malformed_fixture_checked: true,
      final_handoff_preflight_memory_reuse_state_checked: true,
      final_handoff_preflight_pr_body_checklist_state_checked: true,
      handoff_automation_slots_present: true,
      pr_body_slot_preview_only_and_review_slot_inert: true,
      work_contract_constellation_context_optional: true,
      work_contract_constellation_context_rendered: true,
      missing_constellation_context_fallback_checked: true,
      constellation_context_handoff_packet_checked: true,
      safe_copy_affordance_present: true,
      safe_copy_affordance_local_only: true,
      copy_exec_fallback_checked: true,
      copy_visible_selection_fallback_checked: true,
      handoff_json_block_present: true,
      handoff_json_block_parseable: true,
      handoff_preflight_hint_present: true,
      forbidden_ui_text_absent: true,
      bridge_write_tools_unchanged: true,
      work_brief_read_only_widget_card: true,
      fallback_render_without_throwing: true,
      direct_network_calls_absent: true,
      shell_npm_child_process_calls_absent: true,
      forbidden_controls_absent: true,
    },
    null,
    2,
  ),
);

function assertBoundaryText(text) {
  const requiredPatterns = [
    /Work ID is a trace anchor, not committed state authority\./,
    /This card is read-only\./,
    /This card cannot execute Codex\./,
    /This card cannot commit or reject Augnes state\./,
    /This card cannot approve, publish, retry, replay, externally post, merge, or enable auto-merge\./,
    /Proof is not approval\./,
    /A PR is not merge authority\./,
    /Durable approval remains user\/Core gated\./,
    /This preview is read-only\./,
    /This preview cannot execute Codex\./,
    /This preview cannot record evidence\./,
    /This preview cannot record proof\./,
    /This preview cannot commit or reject Augnes state\./,
    /This preview cannot approve, publish, retry, replay, or externally post\./,
    /This preview cannot merge or enable auto-merge\./,
    /Evidence is not approval\./,
    /Raw DB paths are local-dev fallback only and should not be normal user-facing input\./,
  ];

  for (const pattern of requiredPatterns) {
    assert.match(text, pattern, `boundary text must include ${pattern}`);
  }
}

function collectToolsWithAnnotation(source, annotationName) {
  const matches = [...source.matchAll(/registerAppTool\(\s*server,\s*"([^"]+)"/g)];
  return matches
    .map((match, index) => {
      const next = matches[index + 1]?.index ?? source.length;
      return {
        name: match[1],
        block: source.slice(match.index, next),
      };
    })
    .filter(({ block }) => block.includes(`annotations: ${annotationName}`))
    .map(({ name }) => name);
}

function extractToolBlock(source, toolName) {
  const registrationPattern = new RegExp(`registerAppTool\\(\\s*server,\\s*"${escapeRegExp(toolName)}"`);
  const registration = registrationPattern.exec(source);
  assert.ok(registration, `${toolName} tool registration must exist`);
  const start = registration.index;
  const nextMatch = [...source.slice(start + "registerAppTool(".length).matchAll(/registerAppTool\(/g)][0];
  const next = nextMatch ? start + "registerAppTool(".length + nextMatch.index : source.length;
  return source.slice(start, next);
}

function extractFunction(source, name) {
  const asyncMarker = `async function ${name}`;
  const marker = `function ${name}`;
  const asyncStart = source.indexOf(asyncMarker);
  const start = asyncStart === -1 ? source.indexOf(marker) : asyncStart;
  assert.notEqual(start, -1, `${name} must exist`);
  const signatureEnd = source.indexOf(")", start);
  assert.notEqual(signatureEnd, -1, `${name} must have a parameter list`);
  const openBrace = source.indexOf("{", signatureEnd);
  assert.notEqual(openBrace, -1, `${name} must have a body`);
  let depth = 0;
  for (let index = openBrace; index < source.length; index += 1) {
    const char = source[index];
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  throw new Error(`${name} body did not terminate`);
}

function assertNoNetworkCalls(source, label) {
  const forbiddenPatterns = [
    /\bfetch\s*\(/,
    /\bXMLHttpRequest\b/,
    /\bWebSocket\b/,
    /\bEventSource\b/,
    /\bapi\.github\.com\b/,
    /\bapi\.openai\.com\b/,
    /\/api\/(?:actions|evidence|observe|plan|work|state|publication|delivery)\b/,
    /\brecord-proof\b/,
    /\brecord-evidence\b/,
    /\bopenai\b.{0,20}\(/i,
    /\bgithub\b.{0,20}\(/i,
  ];
  for (const pattern of forbiddenPatterns) {
    assert.doesNotMatch(source, pattern, `${label} must not contain direct network or provider calls: ${pattern}`);
  }
}

function assertNoForbiddenServerOrWidgetCalls(source) {
  const forbiddenPatterns = [
    /\bchild_process\b/,
    /\bspawn\s*\(/,
    /\bexecFile\s*\(/,
    /\bexec\s*\(/,
    /\bnpm\s+run\b.*(?:server|widget|App\/MCP)/,
    /\bapi\.github\.com\b/,
    /\bapi\.openai\.com\b/,
    /\bopenai\b.{0,20}\(/i,
    /\bgithub\b.{0,20}\(/i,
  ];
  for (const pattern of forbiddenPatterns) {
    assert.doesNotMatch(source, pattern, `App/MCP server and widget must not add shell, npm spawn, GitHub/OpenAI, or provider calls: ${pattern}`);
  }
}

function assertSafeCopyAffordanceSource(source) {
  assert.match(source, /document\.createElement\("button"\)/, "copy affordance must use a normal button element");
  assert.match(source, /copyButton\.type\s*=\s*"button"/, "copy affordance button must not submit a form");
  assert.match(
    source,
    /copyButton\.textContent\s*=\s*"Copy Codex Handoff"|copyButton\.textContent\s*=\s*"Copy Handoff Preview"/,
    "copy affordance label must be allowed",
  );
  assert.match(source, /copyTextToClipboard\(packetText\)/, "copy affordance must use the shared layered copy helper");
  assert.match(source, /selectElementText\(pre\)/, "copy affordance must fall back to visible packet text selection");
  assert.match(source, /status\.textContent\s*=\s*"Handoff copied\."/ , "copy success status must be local UI text");
  assert.match(
    source,
    /status\.textContent\s*=\s*"Clipboard blocked by this host\. Packet text selected; press Command\+C to copy\."/,
    "copy blocked status must tell the user the visible packet text was selected",
  );
  assert.match(
    source,
    /status\.textContent\s*=\s*"Copy unavailable\. Select and copy the packet text manually\."/,
    "copy failure status must tell the user to manually copy the visible packet",
  );
  assert.doesNotMatch(source, /\bfetch\s*\(/, "copy affordance must not call fetch");
  assert.doesNotMatch(source, /\bXMLHttpRequest\b/, "copy affordance must not use XMLHttpRequest");
  assert.doesNotMatch(source, /\bWebSocket\b/, "copy affordance must not use WebSocket");
  assert.doesNotMatch(source, /\bEventSource\b/, "copy affordance must not use EventSource");
  assert.doesNotMatch(source, /\brpcRequest\b|\brpcNotify\b|\bpostMessage\b/, "copy affordance must not call bridge/runtime messaging");
  assert.doesNotMatch(source, /\bdispatchEvent\b|\bCustomEvent\b/, "copy affordance must not dispatch execution events");
  assert.doesNotMatch(source, /\bwindow\.open\b|\blocation\./, "copy affordance must not navigate");
  assert.doesNotMatch(source, /\bsubmit\s*\(/, "copy affordance must not submit forms");
}

function assertFinalPreflightFixtures(source) {
  const context = { console, JSON, Number, Array, String, Error };
  vm.createContext(context);
  vm.runInContext(source, context);
  const requiredSections = [
    "Summary",
    "User-facing path added or changed",
    "Files changed",
    "Verification",
    "Skipped checks and caveats",
    "Memory Reuse attachment status",
    "Project Constellation context status",
    "Final handoff preflight status",
    "Authority boundary statement",
    "Remaining caveats",
    "Next recommended step",
  ];
  const prBodyChecklistPreview = {
    checklist_type: "pr_body_checklist_preview",
    status: "preview_only",
    generated: true,
    required_sections: requiredSections,
    forbidden_claims: ["Do not claim verification passed without actual command results."],
    warnings: ["Replace placeholders with actual results after implementation."],
    boundary_text: ["PR body checklist is preview-only closeout preparation."],
  };
  const closeoutSkeletonText = requiredSections
    .map((heading) => `## ${heading}\nPlaceholder: ${heading} details go here.\nSource hint: smoke fixture.`)
    .join("\n\n");
  const closeoutSkeleton = {
    skeleton_type: "codex_closeout_skeleton",
    status: "preview_only",
    generated: true,
    copyable_closeout_text: closeoutSkeletonText,
    sections: requiredSections.map((heading) => ({
      heading,
      placeholder: `Placeholder: ${heading} details go here.`,
      source_hint: "smoke fixture.",
    })),
    required_sections: requiredSections,
    verification_command_placeholders: ["npm run smoke:chatgpt-work-contract-card"],
    skipped_check_policy: "Skipped checks must be reported with concrete reasons; do not claim skipped checks passed.",
    memory_reuse_attachment_status: "no_match",
    project_constellation_context_status: "explicitly_absent",
    final_handoff_preflight_status: "pending_preflight",
    warnings: ["Replace placeholders with actual results after implementation."],
    boundary_text: ["PR body checklist is preview-only closeout preparation."],
  };
  context.__passingPacket = {
    packet_type: "final_codex_handoff_packet",
    work_id: "AG-SMOKE",
    work_scope: "project:augnes",
    authority_boundaries: ["This preview is read-only.", "This preview cannot execute Codex.", "This preview cannot record evidence."],
    forbidden_actions: ["No Codex execution from this card."],
    skipped_check_policy: "Skipped checks must be reported with concrete reasons; do not claim skipped checks passed.",
    final_report_requirements: ["Changed files."],
    constellation_context_status: "explicitly_absent",
    memory_reuse_attachment_proposal: {
      status: "no_match",
      task_summary: "Fallback smoke card",
      task_ref: "AG-SMOKE",
      source_context: "work_contract",
      selected_memory_ids: [],
      selected_memory_count: 0,
      why_selected: [],
      reuse_boundary: [],
      selection_guidance: ["No persisted perspective-memory items were selected from the attached Work Contract context."],
      fallback_brief: "No persisted perspective-memory items were selected for this Work Contract context.",
      warnings: [],
      boundary_text: ["Memory Reuse attachment is a read-only proposal preview."],
    },
    pr_body_checklist_preview: prBodyChecklistPreview,
    codex_pr_body_checklist: prBodyChecklistPreview,
    codex_closeout_skeleton: closeoutSkeleton,
    final_handoff_closeout_skeleton: closeoutSkeleton,
    handoff_automation_slots: {
      memory_reuse_attachment: {
        status: "no_match",
        generated: true,
        inert: false,
        proposal: {
          status: "no_match",
          selected_memory_ids: [],
          selected_memory_count: 0,
          why_selected: [],
          reuse_boundary: [],
          fallback_brief: "No persisted perspective-memory items were selected for this Work Contract context.",
        },
      },
      pr_body_checklist: {
        status: "preview_only",
        generated: true,
        inert: true,
        checklist: prBodyChecklistPreview,
        closeout_skeleton: closeoutSkeleton,
      },
      codex_result_review_packet: {
        status: "not_generated",
        generated: false,
        inert: true,
      },
    },
    copyable_handoff_text: [
      "Final Codex Handoff Packet",
      "No Project Constellation context is attached to this work contract.",
      "Memory Reuse attachment",
      "- Status: no_match",
      "- Selected memory IDs:",
      "  - No persisted memory IDs selected.",
      "- Fallback brief: No persisted perspective-memory items were selected for this Work Contract context.",
      "Codex PR body checklist / closeout skeleton",
      "- Checklist status: preview_only",
      "Closeout skeleton preview",
      closeoutSkeletonText,
      "Skipped checks must be reported with concrete reasons; do not claim skipped checks passed.",
      "BEGIN_AUGNES_CODEX_HANDOFF_JSON",
      JSON.stringify({
        schema: "augnes.codex_handoff_preview.v0_1",
        packet_kind: "final_codex_handoff_packet",
        final_packet_schema: "augnes.final_codex_handoff_packet.v0_1",
        pr_body_checklist_preview: prBodyChecklistPreview,
        codex_closeout_skeleton: closeoutSkeleton,
        handoff_automation_slots: {
          pr_body_checklist: {
            status: "preview_only",
            generated: true,
            inert: true,
          },
        },
        copy_packet: {
          preview_only: true,
          does_not_execute_codex: true,
          does_not_record_evidence: true,
          does_not_record_proof: true,
          does_not_mutate_state: true,
          does_not_merge: true,
        },
      }),
      "END_AUGNES_CODEX_HANDOFF_JSON",
    ].join("\n"),
  };
  const pass = vm.runInContext("localFinalPreflight(__passingPacket)", context);
  assert.equal(pass.status, "pass", "normal final handoff fixture must pass local preflight");
  assert.ok(pass.checks.some((check) => check.id === "authority_boundary" && check.status === "pass"), "preflight must check authority boundary");
  assert.ok(pass.checks.some((check) => check.id === "skipped_check_policy" && check.status === "pass"), "preflight must check skipped check policy");
  assert.ok(pass.checks.some((check) => check.id === "forbidden_actions" && check.status === "pass"), "preflight must check forbidden actions");
  assert.ok(pass.checks.some((check) => check.id === "constellation_context_state" && check.status === "pass"), "preflight must check attached/missing Constellation state");
  assert.ok(pass.checks.some((check) => check.id === "memory_reuse_attachment_state" && check.status === "pass"), "preflight must check Memory Reuse attachment state");
  assert.ok(pass.checks.some((check) => check.id === "pr_body_checklist_state" && check.status === "pass"), "preflight must check PR body checklist state");

  context.__badPacket = {
    packet_type: "final_codex_handoff_packet",
    work_id: "",
    authority_boundaries: [],
    forbidden_actions: [],
    skipped_check_policy: "",
    final_report_requirements: [],
    constellation_context_status: "unknown",
    copyable_handoff_text: "Final Codex Handoff Packet\nmissing structured block",
  };
  const bad = vm.runInContext("localFinalPreflight(__badPacket)", context);
  assert.equal(bad.status, "fail", "malformed/minimal final handoff fixture must fail local preflight");
  assert.ok(bad.checks.some((check) => check.status === "fail"), "malformed/minimal preflight must contain failures");
}

function assertSafeCopyHelperSource(source) {
  assert.match(source, /navigator\.clipboard\?\.writeText/, "copy helper must try navigator.clipboard.writeText first");
  assert.match(source, /document\.execCommand\?\.\("copy"\)/, "copy helper must provide an execCommand copy fallback");
  assert.doesNotMatch(source, /\bfetch\s*\(/, "copy helper must not call fetch");
  assert.doesNotMatch(source, /\bXMLHttpRequest\b/, "copy helper must not use XMLHttpRequest");
  assert.doesNotMatch(source, /\bWebSocket\b/, "copy helper must not use WebSocket");
  assert.doesNotMatch(source, /\bEventSource\b/, "copy helper must not use EventSource");
  assert.doesNotMatch(source, /\brpcRequest\b|\brpcNotify\b|\bpostMessage\b/, "copy helper must not call bridge/runtime messaging");
}

function assertNoForbiddenControls(source, label) {
  const forbiddenPatterns = [
    /createElement\(["']button["']\)/,
    /createElement\(["']form["']\)/,
    /createElement\(["']input["']\)/,
    /createElement\(["']select["']\)/,
    /createElement\(["']textarea["']\)/,
    /<button\b/i,
    /<form\b/i,
    /\bonclick\b/i,
    /addEventListener\(["']click["']/,
    /\brpcRequest\b/,
    /\brpcNotify\b/,
    /\bpostMessage\b/,
  ];
  for (const pattern of forbiddenPatterns) {
    assert.doesNotMatch(source, pattern, `${label} must not add execution or approval controls: ${pattern}`);
  }
}

function fallbackCardPayload() {
  return {
    work_contract_card: {
      scope: "project:augnes",
      work_id: "AG-SMOKE",
      work_title: "Fallback smoke card",
      work_status: "needs_review",
      priority: "next",
      recent_events_count: 0,
      linked_proof_action_ids_count: 0,
      linked_prs_count: 0,
      linked_docs_count: 0,
    },
    brief: {
      scope: "project:augnes",
      work_id: "AG-SMOKE",
      work: {
        work_id: "AG-SMOKE",
        title: "Fallback smoke card",
        status: "needs_review",
        priority: "next",
      },
      recent_events: [],
      related_proof: {},
    },
  };
}

function constellationContextCardPayload() {
  return {
    ...fallbackCardPayload(),
    work_contract_constellation_context: {
      status: "attached",
      thesis: "Selectable handoff seed context thesis.",
      selected_candidate_id: "candidate:operator-review",
      selected_candidate_label: "Operator review candidate",
      selection_status: "selected",
      selection_fallback_reason: "",
      pointer_evidence_ref_count: 1,
      pointer_evidence_refs: ["evidence:one: Pointer one -> fixtures/project-constellation.sample.json"],
      unresolved_tension_count: 1,
      unresolved_tensions: ["tension:one: Tension one: Unresolved tension summary."],
      advisory_next_action_summary: "candidate:operator-review: Operator review candidate summary.",
      source_refs: ["fixtures/project-constellation.sample.json"],
      boundary_text: [
        "Project Constellation context is read-only operator context.",
        "Evidence refs remain pointer-only.",
        "Unresolved tensions remain unresolved.",
        "Advisory next action context does not execute Codex.",
      ],
    },
  };
}

function memoryReuseProposedCardPayload() {
  return {
    ...constellationContextCardPayload(),
    memory_reuse_attachment_proposal: {
      proposal_type: "memory_reuse_attachment_proposal",
      status: "proposed",
      task_summary: "Build the selected-memory proposal fixture.",
      task_ref: "AG-SMOKE",
      source_context: "constellation_context",
      selected_memory_ids: [
        "perspective-memory-item:intake-accepted",
      ],
      selected_memory_count: 1,
      why_selected: [
        "Matched Work Contract and selected Constellation context for Memory Reuse attachment proposal smoke.",
      ],
      reuse_boundary: [
        "Reuse only as bounded prior context; do not treat memory as runtime authority or a write permission.",
      ],
      selection_guidance: [
        "Preserve selected memory IDs.",
        "Preserve why_selected and reuse_boundary.",
      ],
      fallback_brief: "Selected persisted memory item is attached as read-only prior context.",
      warnings: [
        "Operator should review memory reuse before starting a separate Codex session.",
      ],
      boundary_text: [
        "Memory Reuse attachment is a read-only proposal preview.",
        "No memory items are created, persisted, or mutated by this surface.",
      ],
    },
  };
}

function renderFallbackCard(source, options = {}) {
  return renderCard(source, fallbackCardPayload(), options);
}

function renderConstellationContextCard(source, options = {}) {
  return renderCard(source, constellationContextCardPayload(), options);
}

function renderMemoryReuseProposedCard(source, options = {}) {
  return renderCard(source, memoryReuseProposedCardPayload(), options);
}

function renderCard(source, payload, options = {}) {
  class FakeNode {
    constructor(tag) {
      this.tag = tag;
      this.children = [];
      this.textContent = "";
      this.className = "";
      this.innerHTML = "";
      this.open = false;
      this.type = "";
      this.value = "";
      this.style = {};
      this.attributes = {};
      this.listeners = {};
      this.focused = false;
      this.selected = false;
      this.selectionRange = undefined;
    }

    append(...children) {
      for (const child of children) this.appendChild(child);
    }

    appendChild(child) {
      this.children.push(child);
      return child;
    }

    setAttribute(name, value) {
      this.attributes[name] = String(value);
    }

    addEventListener(name, handler) {
      this.listeners[name] ??= [];
      this.listeners[name].push(handler);
    }

    focus() {
      this.focused = true;
    }

    select() {
      this.selected = true;
    }

    setSelectionRange(start, end) {
      this.selectionRange = [start, end];
    }

    remove() {
      this.removed = true;
    }
  }

  const body = new FakeNode("body");
  const context = {
    document: {
      body,
      createElement(tag) {
        return new FakeNode(tag);
      },
      createRange() {
        return {
          selectNodeContents(node) {
            context.__selectedText = node?.textContent ?? "";
          },
        };
      },
      execCommand(command) {
        context.__execCommand = command;
        const lastChild = body.children[body.children.length - 1];
        context.__execCommandText = lastChild?.value ?? "";
        return options.execCommandReturnsFalse ? false : command === "copy";
      },
    },
    Number,
    Array,
    String,
    Error,
    Promise,
  };
  context.navigator = {
    clipboard: {
      async writeText(text) {
        context.__clipboardWriteCount = (context.__clipboardWriteCount ?? 0) + 1;
        if (options.clipboardWriteThrows) throw new Error("blocked");
        context.__copiedText = text;
      },
    },
  };
  context.window = {
    getSelection() {
      return {
        removeAllRanges() {
          context.__selectionCleared = true;
        },
        addRange() {
          context.__rangeAdded = true;
        },
      };
    },
  };
  vm.createContext(context);
  context.__payload = payload;
  vm.runInContext(source, context);
  const output = vm.runInContext("renderWorkContractCard(__payload)", context);
  return {
    context,
    tree: output,
    text: collectText(output).replace(/\s+/g, " ").trim(),
  };
}

async function assertRenderedCopyAffordance(renderedFallback, expectedPath = "clipboard", expectedTextPattern = /Final Codex Handoff Packet/) {
  const buttons = collectNodes(renderedFallback.tree, (node) => node.tag === "button");
  assert.equal(buttons.length, 1, "fallback render must include exactly one safe copy button");
  assert.ok(allowedCopyLabels.includes(buttons[0].textContent), "copy button label must be allowed");
  assert.equal(buttons[0].type, "button", "copy button must be type=button");
  assert.ok(buttons[0].listeners.click?.length === 1, "copy button must have one local click handler");
  const statusNodes = collectNodes(
    renderedFallback.tree,
    (node) => node.attributes?.["aria-live"] === "polite" && node.textContent.includes("Copy action only."),
  );
  assert.equal(statusNodes.length, 1, "copy affordance must expose one aria-live local status node");
  const preBlocks = collectNodes(renderedFallback.tree, (node) => node.tag === "pre");
  assert.ok(preBlocks.some((node) => node.textContent.includes("Final Codex Handoff Packet")), "final packet preformatted text must remain visible");

  await buttons[0].listeners.click[0]();
  const copiedText = expectedPath === "execCommand"
    ? renderedFallback.context.__execCommandText
    : expectedPath === "selection"
      ? renderedFallback.context.__selectedText
      : renderedFallback.context.__copiedText;
  assert.match(copiedText, /Final Codex Handoff Packet/, "copy button must copy the final handoff packet");
  assert.match(copiedText, expectedTextPattern, "copy button must copy the expected visible handoff packet text");
  assert.match(copiedText, /BEGIN_AUGNES_CODEX_HANDOFF_JSON/, "copied packet must include JSON begin delimiter");
  assert.match(copiedText, /END_AUGNES_CODEX_HANDOFF_JSON/, "copied packet must include JSON end delimiter");
  if (expectedPath === "selection") {
    assert.equal(
      statusNodes[0].textContent,
      "Clipboard blocked by this host. Packet text selected; press Command+C to copy.",
      "host-blocked clipboard fallback must select visible packet text and label manual copy",
    );
    assert.equal(renderedFallback.context.__selectionCleared, true, "selection fallback must clear previous selection");
    assert.equal(renderedFallback.context.__rangeAdded, true, "selection fallback must select the visible packet text");
  } else {
    assert.equal(statusNodes[0].textContent, "Handoff copied.", "copy success must update local status only");
  }
  if (expectedPath === "execCommand") {
    assert.equal(renderedFallback.context.__execCommand, "copy", "copy fallback must use document.execCommand copy");
  } else {
    assert.equal(renderedFallback.context.__clipboardWriteCount, 1, "copy button must try navigator.clipboard once");
  }

  const jsonBlock = extractEmbeddedHandoffJson(copiedText);
  assert.equal(jsonBlock.schema, "augnes.codex_handoff_preview.v0_1", "embedded handoff JSON schema must match v0.1");
  assert.equal(jsonBlock.packet_kind, "final_codex_handoff_packet", "embedded handoff JSON kind must identify the final packet");
  assert.equal(jsonBlock.final_packet_schema, "augnes.final_codex_handoff_packet.v0_1", "embedded JSON must identify the final packet schema");
  assert.equal(jsonBlock.copy_packet.preview_only, true, "embedded JSON must mark packet preview-only");
  assert.equal(jsonBlock.copy_packet.does_not_execute_codex, true, "embedded JSON must mark no Codex execution");
  assert.equal(jsonBlock.copy_packet.does_not_record_proof, true, "embedded JSON must mark no proof recording");
  assert.equal(jsonBlock.copy_packet.does_not_record_evidence, true, "embedded JSON must mark no evidence recording");
  assert.equal(jsonBlock.copy_packet.does_not_mutate_state, true, "embedded JSON must mark no state mutation");
  assert.equal(jsonBlock.copy_packet.does_not_merge, true, "embedded JSON must mark no merge authority");
  assert.ok(jsonBlock.memory_reuse_attachment_proposal, "embedded JSON must include Memory Reuse attachment proposal");
  assert.ok(
    ["proposed", "no_match", "unavailable", "not_configured"].includes(jsonBlock.memory_reuse_attachment_proposal.status),
    "embedded JSON Memory Reuse proposal must use a bounded status",
  );
  assert.ok(jsonBlock.handoff_automation_slots?.memory_reuse_attachment, "embedded JSON must include the Memory Reuse automation slot");
  assert.ok(jsonBlock.pr_body_checklist_preview, "embedded JSON must include PR body checklist preview");
  assert.equal(jsonBlock.pr_body_checklist_preview?.status, "preview_only", "PR body checklist preview must be preview_only");
  assert.equal(jsonBlock.pr_body_checklist_preview?.generated, true, "PR body checklist preview must be marked generated");
  assert.ok(jsonBlock.codex_closeout_skeleton, "embedded JSON must include closeout skeleton");
  assert.equal(jsonBlock.codex_closeout_skeleton?.status, "preview_only", "closeout skeleton must be preview_only");
  assert.equal(jsonBlock.codex_closeout_skeleton?.generated, true, "closeout skeleton must be marked generated");
  assert.match(
    jsonBlock.codex_closeout_skeleton?.copyable_closeout_text || "",
    /Placeholder:/,
    "closeout skeleton must contain placeholders",
  );
  assert.doesNotMatch(
    jsonBlock.codex_closeout_skeleton?.copyable_closeout_text || "",
    /All passed\.|Verification passed|All checks passed/i,
    "closeout skeleton must not claim verification passed without result data",
  );
  assert.equal(jsonBlock.handoff_automation_slots?.pr_body_checklist?.status, "preview_only", "PR body checklist slot must be preview_only");
  assert.equal(jsonBlock.handoff_automation_slots?.pr_body_checklist?.generated, true, "PR body checklist slot must be generated");
  assert.equal(jsonBlock.handoff_automation_slots?.pr_body_checklist?.inert, true, "PR body checklist slot must stay inert/no-write");
  assert.equal(jsonBlock.handoff_automation_slots?.codex_result_review_packet?.status, "not_generated", "Codex result review packet slot must remain inert");
}

function extractEmbeddedHandoffJson(text) {
  const begin = "BEGIN_AUGNES_CODEX_HANDOFF_JSON";
  const end = "END_AUGNES_CODEX_HANDOFF_JSON";
  const beginIndex = text.indexOf(begin);
  const endIndex = text.indexOf(end);
  assert.notEqual(beginIndex, -1, "copied packet must include JSON begin delimiter");
  assert.notEqual(endIndex, -1, "copied packet must include JSON end delimiter");
  assert.ok(endIndex > beginIndex, "copied packet JSON delimiters must be ordered");
  return JSON.parse(text.slice(beginIndex + begin.length, endIndex).trim());
}

function collectText(node) {
  if (!node || typeof node !== "object") return "";
  const ownText = [node.textContent, node.innerHTML].filter(Boolean).join(" ");
  const childText = Array.isArray(node.children) ? node.children.map(collectText).join(" ") : "";
  return `${ownText} ${childText}`;
}

function collectNodes(node, predicate, matches = []) {
  if (!node || typeof node !== "object") return matches;
  if (predicate(node)) matches.push(node);
  if (Array.isArray(node.children)) {
    for (const child of node.children) collectNodes(child, predicate, matches);
  }
  return matches;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
