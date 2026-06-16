import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import vm from "node:vm";

const serverPath = "apps/augnes_apps/src/server.ts";
const widgetPath = "apps/augnes_apps/public/console-widget.html";
const runbookPath = "apps/augnes_apps/docs/12_WORK_CONTRACT_CARD_RUNBOOK.md";
const packagePath = "package.json";
const demoSeedPath = "scripts/demo-seed.mjs";

for (const filePath of [serverPath, widgetPath, runbookPath, packagePath, demoSeedPath]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const server = readFileSync(serverPath, "utf8");
const widget = readFileSync(widgetPath, "utf8");
const runbook = readFileSync(runbookPath, "utf8");
const demoSeed = readFileSync(demoSeedPath, "utf8");
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
assert.match(server, /work_picker_card/, "server must return Work Picker structured content");
assert.match(server, /recommended_work_id/, "server must return a recommended work ID for the Work Picker");
assert.match(server, /handoff_tool_hint/, "server must return model-readable handoff tool guidance");
assert.match(server, /codex_handoff_preview/, "server must return Codex Handoff Preview structured content");
assert.match(server, /core_codex_handoff_packet/, "server must return Core Codex Handoff Packet structured content");
assert.match(server, /copyable_core_handoff_text/, "server must expose copyable Core handoff text");
assert.match(server, /core_handoff_usage/, "server must expose Core handoff usage state");
assert.match(server, /implementation_anchors/, "server must expose Core implementation anchors");
assert.match(server, /buildFullContextImplementationAnchors/, "server must derive Full Context implementation anchors");
assert.match(server, /FULL_CONTEXT_ANCHORS_BY_STATE_KEY/, "server must keep grounded state-key implementation anchors");
assert.match(server, /implementation_anchor_summary/, "server must expose a Full Context implementation anchor summary");
assert.match(server, /full_context_required_before_implementation/, "server must expose Full Context requirement state");
assert.match(server, /codex_handoff_decision/, "server must expose Codex handoff decision guidance");
assert.match(server, /codex_handoff_recommendation/, "server must expose Codex handoff recommendation alias");
assert.match(server, /full_codex_handoff_packet/, "server must expose a full handoff packet alias");
assert.match(server, /copyable_full_handoff_text/, "server must expose copyable full handoff text");
assert.match(server, /final_codex_handoff_packet/, "server must return Final Codex Handoff Packet structured content");
assert.match(server, /codex_final_handoff_packet/, "server must expose a final handoff packet alias for model-readable access");
assert.match(server, /execution_request_preview/, "server must return execution request preview structured content");
assert.match(server, /codex_execution_request_preview/, "server must expose a Codex execution request preview alias");
assert.match(server, /final_handoff_preflight/, "server must return Final Handoff Preflight structured content");
assert.match(server, /handoff_automation_slots/, "server must return handoff automation slots");
assert.match(server, /memory_reuse_attachment_proposal/, "server must return Memory Reuse attachment proposal structured content");
assert.match(server, /final_handoff_memory_reuse_attachment/, "server must return a Memory Reuse attachment proposal alias");
assert.match(server, /pr_body_checklist_preview/, "server must return PR body checklist preview structured content");
assert.match(server, /codex_pr_body_checklist/, "server must return a PR body checklist alias");
assert.match(server, /codex_closeout_skeleton/, "server must return closeout skeleton structured content");
assert.match(server, /final_handoff_closeout_skeleton/, "server must return a closeout skeleton alias");
assert.match(server, /codex_result_review_packet_preview/, "server must return Codex result review packet preview structured content");
assert.match(server, /final_handoff_codex_result_review_packet/, "server must return a final handoff result review packet alias");
assert.match(server, /codex_pr_review_packet_preview/, "server must return a PR review packet preview alias");
assert.match(server, /CodexResultImportInputSchema/, "server must define a bounded Codex result import input schema");
assert.match(server, /normalizeSkippedCheckResultObjects/, "server must preserve structured skipped-check reason objects");
assert.match(server, /codexResult:\s*CodexResultImportInputSchema\.optional\(\)/, "augnes_get_work_brief must accept optional codexResult input");
assert.match(server, /codexResultInput:\s*CodexResultImportInputSchema\.optional\(\)/, "augnes_get_work_brief must accept optional codexResultInput input");
assert.match(server, /codex_result:\s*CodexResultImportInputSchema\.optional\(\)/, "augnes_get_work_brief must accept optional codex_result input");
assert.match(server, /codex_result_import_input_shape/, "server must expose the result import input shape");
assert.match(server, /codex_result_import_review_surface/, "server must expose the result import review surface alias");
assert.match(server, /final_handoff_readiness_summary/, "server must return final handoff readiness summary structured content");
assert.match(server, /pre_run_handoff_readiness/, "server must expose pre-run handoff readiness");
assert.match(server, /post_run_result_review_readiness/, "server must expose post-run result review readiness");
assert.match(server, /overall_local_preflight_status/, "server must expose overall local preflight status");
assert.match(server, /work_contract_constellation_context/, "server must support optional Work Contract / Constellation context");
assert.match(server, /No Project Constellation context is attached to this work contract\./, "server must keep missing Constellation context explicit");
assert.match(widget, /renderWorkContractCard/, "widget must implement Work Contract Card rendering");
assert.match(widget, /renderWorkPickerCard/, "widget must implement Work Picker rendering");
assert.match(widget, /normalizeWorkPickerCard/, "widget must normalize Work Picker structured content");
assert.match(widget, /renderCodexHandoffPreview/, "widget must implement Codex Handoff Preview rendering");
assert.match(widget, /renderFinalCodexHandoffPacket/, "widget must render the Final Codex Handoff section");
assert.match(widget, /renderCodexExecutionRequestPreview/, "widget must render the Codex execution request preview section");
assert.match(widget, /normalizeCodexExecutionRequestPreview/, "widget must normalize the Codex execution request preview state");
assert.match(widget, /renderFinalHandoffPreflight/, "widget must render final handoff preflight status");
assert.match(widget, /renderHandoffAutomationSlots/, "widget must render future attachment slots");
assert.match(widget, /renderMemoryReuseAttachmentProposal/, "widget must render Memory Reuse attachment proposal state");
assert.match(widget, /renderPrBodyChecklistPreview/, "widget must render PR body checklist preview state");
assert.match(widget, /renderCodexResultReviewPacketPreview/, "widget must render Codex result review packet preview state");
assert.match(widget, /Codex result import/, "widget must render the Codex result import section");
assert.match(widget, /What was provided/, "widget must render provided result input");
assert.match(widget, /Missing result input/, "widget must render missing result input");
assert.match(widget, /Expected vs actual/, "widget must render expected-vs-actual review");
assert.match(widget, /Verification review/, "widget must render verification review");
assert.match(widget, /Remaining caveats/, "widget must render remaining caveats");
assert.match(widget, /Suggested next action/, "widget must render suggested next action");
assert.match(widget, /What this screen does not do/, "widget must render result-review non-authority text");
assert.match(widget, /renderFinalHandoffReadinessSummary/, "widget must render final handoff readiness summary state");
assert.match(widget, /normalizeFinalHandoffReadinessSummary/, "widget must normalize final handoff readiness summary state");
assert.match(widget, /renderWorkContractConstellationContext/, "widget must render Work Contract / Constellation context");
assert.match(widget, /renderCopyableHandoffPacket/, "widget must implement a bounded copy affordance renderer");
assert.match(widget, /normalizeCodexHandoffDecision/, "widget must normalize Codex handoff decision guidance");
assert.match(widget, /renderCodexHandoffDecisionPanel/, "widget must render Codex handoff decision guidance");
assert.match(widget, /Copy Full Context/, "widget must expose a secondary full-context copy action");
assert.match(server, /BEGIN_AUGNES_CODEX_HANDOFF_JSON/, "server packet must include JSON block begin delimiter");
assert.match(server, /END_AUGNES_CODEX_HANDOFF_JSON/, "server packet must include JSON block end delimiter");
assert.match(widget, /BEGIN_AUGNES_CODEX_HANDOFF_JSON/, "widget fallback packet must include JSON block begin delimiter");
assert.match(widget, /END_AUGNES_CODEX_HANDOFF_JSON/, "widget fallback packet must include JSON block end delimiter");
assert.match(widget, /After copying, validate locally with codex:handoff-preflight\./, "widget must include local preflight hint text");
assert.match(widget, /core_handoff_usage/, "widget fallback must preserve Core handoff usage state");
assert.match(widget, /implementation_anchors/, "widget fallback must preserve Core implementation anchors");
assert.match(widget, /Expected read-only checks/, "widget fallback must label read-only checks clearly");
assert.match(widget, /Clipboard API/, "copy behavior must retain Clipboard API path text or implementation");
assert.match(widget, /document\.execCommand\?\.\("copy"\)/, "copy behavior must retain execCommand fallback");
assert.match(widget, /clipboardData\.setData\("text\/plain", text\)/, "copy behavior must verify execCommand copy data through the copy event");
assert.match(widget, /selectElementText\(pre\)/, "copy behavior must retain visible text selection fallback");
assert.match(runbook, /Data Source/i, "runbook must explain the data source");
assert.match(runbook, /Work Picker Entry Surface/i, "runbook must explain the Work Picker entry surface");
assert.match(runbook, /scope-only first-entry/i, "runbook must document the scope-only first-entry path");
assert.match(runbook, /augnes_list_work_items/i, "runbook must name the list-work-items entry tool");
assert.match(runbook, /augnes_get_work_brief/i, "runbook must name the handoff card follow-up tool");
assert.match(runbook, /Missing Data Behavior/i, "runbook must explain missing data behavior");
assert.match(runbook, /Codex Handoff Preview/i, "runbook must explain the Codex Handoff Preview");
assert.match(runbook, /Core Handoff/i, "runbook must document the Core Handoff packet");
assert.match(runbook, /Codex handoff recommendation/i, "runbook must document the handoff recommendation panel");
assert.match(runbook, /What to copy/i, "runbook must document the user-facing copy decision");
assert.match(runbook, /core_handoff_usage/, "runbook must document Core handoff usage state");
assert.match(runbook, /Implementation anchors/, "runbook must document Core implementation anchors");
assert.match(
  runbook,
  /No implementation file\/schema anchors are attached in\s+Core[\s\S]*Use Core for planning only, or open Full Context before implementation\./,
  "runbook must document missing-anchor Full Context requirement",
);
assert.match(runbook, /Copy Full Context/i, "runbook must document the full-context copy action");
assert.match(runbook, /copyable_core_handoff_text/, "runbook must name the Core copy text field");
assert.match(runbook, /copyable_full_handoff_text/, "runbook must name the Full copy text field");
assert.match(runbook, /Full Context[\s\S]*Implementation anchors/i, "runbook must document Full Context implementation anchors");
assert.match(runbook, /Final Codex Handoff Auto-Compose And Preflight/i, "runbook must explain final handoff auto-compose and preflight");
assert.match(runbook, /final_codex_handoff_packet/, "runbook must name the final handoff packet field");
assert.match(runbook, /final_handoff_preflight/, "runbook must name the final handoff preflight field");
assert.match(runbook, /memory_reuse_attachment/, "runbook must document Memory Reuse attachment proposal slot");
assert.match(runbook, /no_match.*valid state/i, "runbook must document no_match as valid");
assert.match(runbook, /pr_body_checklist/, "runbook must document PR body checklist slot");
assert.match(runbook, /preview-only PR body checklist/i, "runbook must document preview-only PR body checklist behavior");
assert.match(runbook, /closeout skeleton/i, "runbook must document the closeout skeleton");
assert.match(runbook, /placeholders/i, "runbook must distinguish placeholders from actual results");
assert.match(runbook, /codex_result_review_packet/, "runbook must document result review packet slot");

assert.match(demoSeed, /workId:\s*"AG-006"/, "demo seed must include AG-006");
assert.match(demoSeed, /implementation_anchors/, "AG-006 seed must expose implementation anchors without using expected_files");
for (const expectedAg006Anchor of [
  "docs/AUGNES_COORDINATION_SPINE_ROADMAP.md#pr-11-event-spine-schema-and-storage",
  "lib/db/schema.sql#coordination_events",
  "lib/coordination-events.ts",
  "app/api/events/route.ts",
  "app/api/events/[event_id]/route.ts",
  "lib/work.ts#appendCoordinationEvent",
  "app/api/work/[work_id]/route.ts",
  "app/api/work/[work_id]/brief/route.ts",
  "scripts/demo-seed.mjs#AG-006",
  "scripts/smoke-authority-invariants.mjs#coordination_events",
]) {
  assert.match(demoSeed, new RegExp(escapeRegExp(expectedAg006Anchor)), `AG-006 seed must include grounded Full Context anchor: ${expectedAg006Anchor}`);
  assert.match(server, new RegExp(escapeRegExp(expectedAg006Anchor)), `server state-key fallback must include grounded Full Context anchor: ${expectedAg006Anchor}`);
}
assert.match(runbook, /preview-only Codex\s+result review packet/i, "runbook must document preview-only result review packet behavior");
assert.match(runbook, /needs_result_input/i, "runbook must document missing result input state");
assert.match(runbook, /pre-run handoff readiness/i, "runbook must distinguish pre-run handoff readiness");
assert.match(runbook, /post-run result review readiness/i, "runbook must distinguish post-run result review readiness");
assert.match(runbook, /does not mean the pre-run handoff packet is broken/i, "runbook must explain needs_result_input warning meaning");
assert.match(runbook, /no\s+GitHub PR data\s+is\s+fetched/i, "runbook must document no App/MCP GitHub fetching");
assert.match(runbook, /Structured `skipped_checks` objects preserve concrete reasons/, "runbook must document structured skipped-check reason preservation");
assert.match(runbook, /`suggested_result_status` is Augnes's review-derived status/, "runbook must document review-derived suggested result status");
assert.match(runbook, /codex_execution_request_preview/, "runbook must document the Codex execution request preview alias");
assert.match(runbook, /This preview does not execute Codex\. It only prepares the request shape for later explicit user-confirmed execution\./, "runbook must preserve execution request preview boundary wording");
assert.match(runbook, /awaiting_user_confirmation/, "runbook must document the awaiting user confirmation state");
assert.match(runbook, /Codex handoff package/, "runbook must document the user-facing final handoff label");
assert.match(runbook, /Raw enum values[\s\S]*`preview_only`[\s\S]*`needs_result_input`[\s\S]*`awaiting_user_confirmation`/, "runbook must document raw enum display mapping");
assert.match(runbook, /Long authority and packet details stay available in collapsed technical\s+sections/, "runbook must document collapsed technical detail behavior");
for (const status of ["proposed", "no_match", "unavailable", "not_configured"]) {
  assert.match(server, new RegExp(escapeRegExp(status)), `server must support Memory Reuse proposal status ${status}`);
  assert.match(widget, new RegExp(escapeRegExp(status)), `widget must support Memory Reuse proposal status ${status}`);
}
for (const status of ["not_provided", "needs_result_input", "preview_ready", "unavailable", "user_provided_input", "close_done", "additional_verification_needed", "follow_up_fix_needed", "new_handoff_needed", "result_incomplete_blocked", "human_decision_needed"]) {
  assert.match(server, new RegExp(escapeRegExp(status)), `server must support Codex result review status ${status}`);
  assert.match(widget, new RegExp(escapeRegExp(status)), `widget must support Codex result review status ${status}`);
}
for (const status of ["preview_only", "awaiting_user_confirmation", "unavailable"]) {
  assert.match(server, new RegExp(escapeRegExp(status)), `server must support Codex execution request preview status ${status}`);
  assert.match(widget, new RegExp(escapeRegExp(status)), `widget must support Codex execution request preview status ${status}`);
}

const uiText = `${server}\n${widget}`;
assertNoForbiddenServerOrWidgetCalls(uiText);
const forbiddenUiPhrases = [
  "Run Codex",
  "Start Codex",
  "Execute",
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
  "Submit review",
  "Request changes",
  "Approve PR",
];
const allowedCopyLabels = ["Copy Codex Handoff", "Copy Full Context", "Copy Handoff Preview"];
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

const workListBlock = extractToolBlock(server, "augnes_list_work_items");
assert.match(workListBlock, /annotations:\s*bridgeReadAnnotations/, "augnes_list_work_items must remain read-only annotated");
assert.match(workListBlock, /_meta:\s*widgetToolMeta/, "augnes_list_work_items must be widget-backed for the Work Picker card");
assert.match(workListBlock, /work_picker_card/, "augnes_list_work_items must carry Work Picker structured content");
assert.match(workListBlock, /recommended_work_id/, "augnes_list_work_items must expose recommended_work_id");
assert.match(workListBlock, /work_candidates/, "augnes_list_work_items must expose work_candidates");
assert.match(workListBlock, /handoff_tool_hint/, "augnes_list_work_items must expose handoff tool guidance");

const workBriefBlock = extractToolBlock(server, "augnes_get_work_brief");
assert.match(workBriefBlock, /annotations:\s*bridgeReadAnnotations/, "augnes_get_work_brief must remain read-only annotated");
assert.match(workBriefBlock, /_meta:\s*widgetToolMeta/, "augnes_get_work_brief must be widget-backed for the card");
assert.match(workBriefBlock, /work_contract_card/, "augnes_get_work_brief must carry card structured content");
assert.match(workBriefBlock, /codex_handoff_preview/, "augnes_get_work_brief must carry handoff preview structured content");
assert.match(workBriefBlock, /core_codex_handoff_packet/, "augnes_get_work_brief must carry Core Handoff structured content");
assert.match(workBriefBlock, /copyable_core_handoff_text/, "augnes_get_work_brief must expose Core Handoff copy text");
assert.match(workBriefBlock, /final_codex_handoff_packet/, "augnes_get_work_brief must carry final handoff packet structured content");
assert.match(workBriefBlock, /full_codex_handoff_packet/, "augnes_get_work_brief must expose a full handoff packet alias");
assert.match(workBriefBlock, /copyable_full_handoff_text/, "augnes_get_work_brief must expose full handoff copy text");
assert.match(workBriefBlock, /execution_request_preview/, "augnes_get_work_brief must carry execution request preview structured content");
assert.match(workBriefBlock, /codex_execution_request_preview/, "augnes_get_work_brief must carry Codex execution request preview alias structured content");
assert.match(workBriefBlock, /final_handoff_preflight/, "augnes_get_work_brief must carry final handoff preflight structured content");
assert.match(workBriefBlock, /handoff_automation_slots/, "augnes_get_work_brief must carry automation slots");
assert.match(workBriefBlock, /memory_reuse_attachment_proposal/, "augnes_get_work_brief must carry Memory Reuse proposal structured content");
assert.match(workBriefBlock, /pr_body_checklist_preview/, "augnes_get_work_brief must carry PR body checklist preview structured content");
assert.match(workBriefBlock, /codex_closeout_skeleton/, "augnes_get_work_brief must carry closeout skeleton structured content");
assert.match(workBriefBlock, /codex_result_review_packet_preview/, "augnes_get_work_brief must carry Codex result review packet preview structured content");
assert.match(workBriefBlock, /final_handoff_readiness_summary/, "augnes_get_work_brief must carry readiness summary structured content");
assert.doesNotMatch(server, /buildPerspectiveMemoryReuseIntakeFromStore\s*\(/, "App/MCP server must not run the store-backed Memory Reuse intake helper");
assert.doesNotMatch(server, /listPerspectiveMemoryItems\s*\(/, "App/MCP server must not query persisted perspective-memory items for this preview");

if (server.includes('"augnes_get_work_contract_card"')) {
  const cardToolBlock = extractToolBlock(server, "augnes_get_work_contract_card");
  assert.match(cardToolBlock, /annotations:\s*bridgeReadAnnotations|annotations:\s*readOnlyAnnotations/, "new card tool must be read-only annotated");
  assert.doesNotMatch(cardToolBlock, /annotations:\s*bridgeWriteAnnotations/, "new card tool must not be write annotated");
}

assertNoNetworkCalls(extractFunction(server, "buildWorkContractCard"), "buildWorkContractCard");
assertNoNetworkCalls(extractFunction(server, "isCompletedWorkStatus"), "isCompletedWorkStatus");
assertNoNetworkCalls(extractFunction(server, "countLinkedStrings"), "countLinkedStrings");
assertNoNetworkCalls(extractFunction(server, "buildWorkPickerCard"), "buildWorkPickerCard");
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
assertNoNetworkCalls(extractFunction(server, "includesText"), "includesText");
assertNoNetworkCalls(extractFunction(server, "stringFromUnknownResult"), "stringFromUnknownResult");
assertNoNetworkCalls(extractFunction(server, "collectResultText"), "collectResultText");
assertNoNetworkCalls(extractFunction(server, "stringArrayFromResultObjects"), "stringArrayFromResultObjects");
assertNoNetworkCalls(extractFunction(server, "firstRecordValue"), "firstRecordValue");
assertNoNetworkCalls(extractFunction(server, "stringValueFromRecord"), "stringValueFromRecord");
assertNoNetworkCalls(extractFunction(server, "stringArrayFromRecordFields"), "stringArrayFromRecordFields");
assertNoNetworkCalls(extractFunction(server, "normalizeSkippedCheckResultObjects"), "normalizeSkippedCheckResultObjects");
assertNoNetworkCalls(extractFunction(server, "normalizeResultStatus"), "normalizeResultStatus");
assertNoNetworkCalls(extractFunction(server, "inferResultStatusFromText"), "inferResultStatusFromText");
assertNoNetworkCalls(extractFunction(server, "skippedCheckHasConcreteReason"), "skippedCheckHasConcreteReason");
assertNoNetworkCalls(extractFunction(server, "hasExplicitNone"), "hasExplicitNone");
assertNoNetworkCalls(extractFunction(server, "resultReviewPayloadFromBrief"), "resultReviewPayloadFromBrief");
assertNoNetworkCalls(extractFunction(server, "buildListAlignment"), "buildListAlignment");
assertNoNetworkCalls(extractFunction(server, "buildPresenceAlignment"), "buildPresenceAlignment");
assertNoNetworkCalls(extractFunction(server, "buildCodexResultReviewPacketPreview"), "buildCodexResultReviewPacketPreview");
assertNoNetworkCalls(extractFunction(server, "summarizeCodexResultReviewPacket"), "summarizeCodexResultReviewPacket");
assertNoNetworkCalls(extractFunction(server, "codexResultReviewPacketLines"), "codexResultReviewPacketLines");
assertNoNetworkCalls(extractFunction(server, "buildHandoffAutomationSlots"), "buildHandoffAutomationSlots");
assertNoNetworkCalls(extractFunction(server, "constellationSummaryLines"), "constellationSummaryLines");
assertNoNetworkCalls(extractFunction(server, "memoryReuseSummaryLines"), "memoryReuseSummaryLines");
assertNoNetworkCalls(extractFunction(server, "prChecklistSummaryLines"), "prChecklistSummaryLines");
assertNoNetworkCalls(extractFunction(server, "buildFullContextImplementationAnchors"), "buildFullContextImplementationAnchors");
assertNoNetworkCalls(extractFunction(server, "fullContextImplementationAnchorSummary"), "fullContextImplementationAnchorSummary");
assertNoNetworkCalls(extractFunction(server, "buildCodexHandoffDecision"), "buildCodexHandoffDecision");
assertNoNetworkCalls(extractFunction(server, "buildCoreCodexHandoffJsonBlock"), "buildCoreCodexHandoffJsonBlock");
assertNoNetworkCalls(extractFunction(server, "buildCoreCodexHandoffText"), "buildCoreCodexHandoffText");
assertNoNetworkCalls(extractFunction(server, "buildCoreCodexHandoffPacket"), "buildCoreCodexHandoffPacket");
assertNoNetworkCalls(extractFunction(server, "buildFinalCodexHandoffJsonBlock"), "buildFinalCodexHandoffJsonBlock");
assertNoNetworkCalls(extractFunction(server, "buildFinalCodexHandoffText"), "buildFinalCodexHandoffText");
assertNoNetworkCalls(extractFunction(server, "buildFinalCodexHandoffPacket"), "buildFinalCodexHandoffPacket");
assertNoNetworkCalls(extractFunction(server, "extractStructuredHandoffJsonBlock"), "extractStructuredHandoffJsonBlock");
assertNoNetworkCalls(extractFunction(server, "finalHandoffMemoryReusePreflightCheck"), "finalHandoffMemoryReusePreflightCheck");
assertNoNetworkCalls(extractFunction(server, "finalHandoffPrBodyChecklistPreflightCheck"), "finalHandoffPrBodyChecklistPreflightCheck");
assertNoNetworkCalls(extractFunction(server, "finalHandoffCodexResultReviewPacketPreflightCheck"), "finalHandoffCodexResultReviewPacketPreflightCheck");
assertNoNetworkCalls(extractFunction(server, "buildFinalHandoffPreflight"), "buildFinalHandoffPreflight");
assertNoNetworkCalls(extractFunction(server, "buildFinalHandoffReadinessSummary"), "buildFinalHandoffReadinessSummary");
assertNoNetworkCalls(extractFunction(server, "buildCodexExecutionRequestPreview"), "buildCodexExecutionRequestPreview");
assertNoNetworkCalls(extractFunction(server, "buildWorkContractConstellationContext"), "buildWorkContractConstellationContext");
assertNoNetworkCalls(extractFunction(server, "buildWorkContractConstellationContextFromBrief"), "buildWorkContractConstellationContextFromBrief");
assertNoNetworkCalls(extractFunction(server, "describeWorkContractCard"), "describeWorkContractCard");
assertNoNetworkCalls(extractFunction(server, "describeWorkPickerCard"), "describeWorkPickerCard");
assertNoNetworkCalls(extractFunction(server, "describeCodexHandoffPreview"), "describeCodexHandoffPreview");
assertNoNetworkCalls(extractFunction(server, "describeFinalCodexHandoffPacket"), "describeFinalCodexHandoffPacket");
assertNoNetworkCalls(extractFunction(widget, "renderWorkContractCard"), "renderWorkContractCard");
assertNoNetworkCalls(extractFunction(widget, "renderWorkPickerCandidate"), "renderWorkPickerCandidate");
assertNoNetworkCalls(extractFunction(widget, "renderWorkPickerCard"), "renderWorkPickerCard");
assertNoNetworkCalls(extractFunction(widget, "renderCodexHandoffPreview"), "renderCodexHandoffPreview");
assertNoNetworkCalls(extractFunction(widget, "renderFinalCodexHandoffPacket"), "renderFinalCodexHandoffPacket");
assertNoNetworkCalls(extractFunction(widget, "renderCodexExecutionRequestPreview"), "renderCodexExecutionRequestPreview");
assertNoNetworkCalls(extractFunction(widget, "renderFinalHandoffReadinessSummary"), "renderFinalHandoffReadinessSummary");
assertNoNetworkCalls(extractFunction(widget, "renderFinalHandoffPreflight"), "renderFinalHandoffPreflight");
assertNoNetworkCalls(extractFunction(widget, "renderMemoryReuseAttachmentProposal"), "renderMemoryReuseAttachmentProposal");
assertNoNetworkCalls(extractFunction(widget, "renderPrBodyChecklistPreview"), "renderPrBodyChecklistPreview");
assertNoNetworkCalls(extractFunction(widget, "renderCodexResultReviewPacketPreview"), "renderCodexResultReviewPacketPreview");
assertNoNetworkCalls(extractFunction(widget, "renderHandoffAutomationSlots"), "renderHandoffAutomationSlots");
assertNoNetworkCalls(extractFunction(widget, "renderWorkContractConstellationContext"), "renderWorkContractConstellationContext");
assertNoNetworkCalls(extractFunction(widget, "renderCopyableHandoffPacket"), "renderCopyableHandoffPacket");
assertNoNetworkCalls(extractFunction(widget, "isKnownCoreHandoffUsage"), "isKnownCoreHandoffUsage");
assertNoNetworkCalls(extractFunction(widget, "defaultHandoffDecisionForUsage"), "defaultHandoffDecisionForUsage");
assertNoNetworkCalls(extractFunction(widget, "normalizeCodexHandoffDecision"), "normalizeCodexHandoffDecision");
assertNoNetworkCalls(extractFunction(widget, "handoffRecommendationLabel"), "handoffRecommendationLabel");
assertNoNetworkCalls(extractFunction(widget, "handoffRecommendationAction"), "handoffRecommendationAction");
assertNoNetworkCalls(extractFunction(widget, "renderCodexHandoffDecisionPanel"), "renderCodexHandoffDecisionPanel");
assertNoNetworkCalls(extractFunction(widget, "normalizeWorkContractCard"), "normalizeWorkContractCard");
assertNoNetworkCalls(extractFunction(widget, "isCompletedWorkStatus"), "isCompletedWorkStatus");
assertNoNetworkCalls(extractFunction(widget, "numberOrZero"), "numberOrZero");
assertNoNetworkCalls(extractFunction(widget, "countArrayLike"), "countArrayLike");
assertNoNetworkCalls(extractFunction(widget, "normalizeWorkPickerCandidate"), "normalizeWorkPickerCandidate");
assertNoNetworkCalls(extractFunction(widget, "normalizeWorkPickerCard"), "normalizeWorkPickerCard");
assertNoNetworkCalls(extractFunction(widget, "normalizeCodexHandoffPreview"), "normalizeCodexHandoffPreview");
assertNoNetworkCalls(extractFunction(widget, "normalizeFinalCodexHandoffPacket"), "normalizeFinalCodexHandoffPacket");
assertNoNetworkCalls(extractFunction(widget, "normalizeFinalHandoffPreflight"), "normalizeFinalHandoffPreflight");
assertNoNetworkCalls(extractFunction(widget, "derivePostRunResultReviewReadiness"), "derivePostRunResultReviewReadiness");
assertNoNetworkCalls(extractFunction(widget, "normalizeFinalHandoffReadinessSummary"), "normalizeFinalHandoffReadinessSummary");
assertNoNetworkCalls(extractFunction(widget, "codexExecutionRequestConfirmationFields"), "codexExecutionRequestConfirmationFields");
assertNoNetworkCalls(extractFunction(widget, "codexExecutionRequestNonAuthorities"), "codexExecutionRequestNonAuthorities");
assertNoNetworkCalls(extractFunction(widget, "normalizeCodexExecutionRequestPreview"), "normalizeCodexExecutionRequestPreview");
assertNoNetworkCalls(extractFunction(widget, "coreAuthorityBoundaryText"), "coreAuthorityBoundaryText");
assertNoNetworkCalls(extractFunction(widget, "composeFallbackCoreHandoffText"), "composeFallbackCoreHandoffText");
assertNoNetworkCalls(extractFunction(widget, "normalizeCoreCodexHandoffPacket"), "normalizeCoreCodexHandoffPacket");
assertNoNetworkCalls(extractFunction(widget, "formatUiStatus"), "formatUiStatus");
assertNoNetworkCalls(extractFunction(widget, "formatUiSlotLabel"), "formatUiSlotLabel");
assertNoNetworkCalls(extractFunction(widget, "formatSourcePacketRef"), "formatSourcePacketRef");
assertNoNetworkCalls(extractFunction(widget, "formatConfirmationField"), "formatConfirmationField");
assertNoNetworkCalls(extractFunction(widget, "formatPrSectionLabel"), "formatPrSectionLabel");
assertNoNetworkCalls(extractFunction(widget, "formatResultInputField"), "formatResultInputField");
assertNoNetworkCalls(extractFunction(widget, "normalizeMemoryReuseAttachmentProposal"), "normalizeMemoryReuseAttachmentProposal");
assertNoNetworkCalls(extractFunction(widget, "normalizePrBodyChecklistPreview"), "normalizePrBodyChecklistPreview");
assertNoNetworkCalls(extractFunction(widget, "normalizeCloseoutSkeleton"), "normalizeCloseoutSkeleton");
assertNoNetworkCalls(extractFunction(widget, "normalizeCodexResultReviewPacket"), "normalizeCodexResultReviewPacket");
assertNoNetworkCalls(extractFunction(widget, "memoryReuseAttachmentPreflightCheck"), "memoryReuseAttachmentPreflightCheck");
assertNoNetworkCalls(extractFunction(widget, "prBodyChecklistPreflightCheck"), "prBodyChecklistPreflightCheck");
assertNoNetworkCalls(extractFunction(widget, "codexResultReviewPacketPreflightCheck"), "codexResultReviewPacketPreflightCheck");
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
  extractFunction(widget, "formatUiStatus"),
  extractFunction(widget, "formatUiSlotLabel"),
  extractFunction(widget, "formatSourcePacketRef"),
  extractFunction(widget, "formatConfirmationField"),
  extractFunction(widget, "formatPrSectionLabel"),
  extractFunction(widget, "formatResultInputField"),
  extractFunction(widget, "isCompletedWorkStatus"),
  extractFunction(widget, "numberOrZero"),
  extractFunction(widget, "countArrayLike"),
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
  extractFunction(widget, "normalizeWorkPickerCandidate"),
  extractFunction(widget, "normalizeWorkPickerCard"),
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
  extractFunction(widget, "codexResultReviewRequiredInputs"),
  extractFunction(widget, "codexResultReviewMissingInputs"),
  extractFunction(widget, "codexResultReviewOptionalInputs"),
  extractFunction(widget, "codexResultReviewBoundaryText"),
  extractFunction(widget, "codexResultReviewWarnings"),
  extractFunction(widget, "normalizePrBodyChecklistPreview"),
  extractFunction(widget, "summarizeMemoryReuseForCloseout"),
  extractFunction(widget, "summarizeConstellationForCloseout"),
  extractFunction(widget, "closeoutSkeletonTextFromSections"),
  extractFunction(widget, "normalizeCloseoutSkeleton"),
  extractFunction(widget, "makeAlignment"),
  extractFunction(widget, "normalizeCodexResultReviewPacket"),
  extractFunction(widget, "codexResultReviewPacketLineItems"),
  extractFunction(widget, "fallbackHandoffAutomationSlots"),
  extractFunction(widget, "slotLine"),
  extractFunction(widget, "finalConstellationPacketLines"),
  extractFunction(widget, "composeFallbackFinalHandoffText"),
  extractFunction(widget, "normalizeFinalCodexHandoffPacket"),
  extractFunction(widget, "extractStructuredHandoffBlock"),
  extractFunction(widget, "containsForbiddenFinalHandoffLabel"),
  extractFunction(widget, "memoryReuseAttachmentPreflightCheck"),
  extractFunction(widget, "prBodyChecklistPreflightCheck"),
  extractFunction(widget, "codexResultReviewPacketPreflightCheck"),
  extractFunction(widget, "localFinalPreflight"),
  extractFunction(widget, "normalizeFinalHandoffPreflight"),
  extractFunction(widget, "derivePostRunResultReviewReadiness"),
  extractFunction(widget, "normalizeFinalHandoffReadinessSummary"),
  extractFunction(widget, "codexExecutionRequestConfirmationFields"),
  extractFunction(widget, "codexExecutionRequestNonAuthorities"),
  extractFunction(widget, "normalizeCodexExecutionRequestPreview"),
  extractFunction(widget, "isKnownCoreHandoffUsage"),
  extractFunction(widget, "defaultHandoffDecisionForUsage"),
  extractFunction(widget, "normalizeCodexHandoffDecision"),
  extractFunction(widget, "handoffRecommendationLabel"),
  extractFunction(widget, "handoffRecommendationAction"),
  extractFunction(widget, "renderCodexHandoffDecisionPanel"),
  extractFunction(widget, "coreAuthorityBoundaryText"),
  extractFunction(widget, "composeFallbackCoreHandoffText"),
  extractFunction(widget, "normalizeCoreCodexHandoffPacket"),
  extractFunction(widget, "renderWorkPickerCandidate"),
  extractFunction(widget, "renderWorkPickerCard"),
  extractFunction(widget, "normalizeWorkContractCard"),
  extractFunction(widget, "normalizeCodexHandoffPreview"),
  extractFunction(widget, "renderWorkContractConstellationContext"),
  extractFunction(widget, "renderFinalHandoffReadinessSummary"),
  extractFunction(widget, "renderFinalHandoffPreflight"),
  extractFunction(widget, "renderCodexExecutionRequestPreview"),
  extractFunction(widget, "renderMemoryReuseAttachmentProposal"),
  extractFunction(widget, "renderPrBodyChecklistPreview"),
  extractFunction(widget, "renderCodexResultReviewPacketPreview"),
  extractFunction(widget, "renderHandoffAutomationSlots"),
  extractFunction(widget, "renderFinalCodexHandoffPacket"),
  extractFunction(widget, "renderCodexHandoffPreview"),
  extractFunction(widget, "renderWorkContractCard"),
].join("\n\n");

assertNoForbiddenControls(extractFunction(widget, "renderWorkContractCard"), "renderWorkContractCard");
assertNoForbiddenControls(extractFunction(widget, "renderWorkPickerCandidate"), "renderWorkPickerCandidate");
assertNoForbiddenControls(extractFunction(widget, "renderWorkPickerCard"), "renderWorkPickerCard");
assertNoForbiddenControls(extractFunction(widget, "renderCodexHandoffPreview"), "renderCodexHandoffPreview");
assertNoForbiddenControls(extractFunction(widget, "renderFinalHandoffReadinessSummary"), "renderFinalHandoffReadinessSummary");
assertNoForbiddenControls(extractFunction(widget, "renderFinalHandoffPreflight"), "renderFinalHandoffPreflight");
assertNoForbiddenControls(extractFunction(widget, "renderCodexExecutionRequestPreview"), "renderCodexExecutionRequestPreview");
assertNoForbiddenControls(extractFunction(widget, "renderMemoryReuseAttachmentProposal"), "renderMemoryReuseAttachmentProposal");
assertNoForbiddenControls(extractFunction(widget, "renderPrBodyChecklistPreview"), "renderPrBodyChecklistPreview");
assertNoForbiddenControls(extractFunction(widget, "renderCodexResultReviewPacketPreview"), "renderCodexResultReviewPacketPreview");
assertNoForbiddenControls(extractFunction(widget, "renderHandoffAutomationSlots"), "renderHandoffAutomationSlots");
assertNoForbiddenControls(extractFunction(widget, "normalizeWorkContractCard"), "normalizeWorkContractCard");
assertNoForbiddenControls(extractFunction(widget, "normalizeCodexHandoffPreview"), "normalizeCodexHandoffPreview");
assertNoForbiddenControls(extractFunction(widget, "normalizeFinalHandoffReadinessSummary"), "normalizeFinalHandoffReadinessSummary");
assertNoForbiddenControls(extractFunction(widget, "normalizeCodexExecutionRequestPreview"), "normalizeCodexExecutionRequestPreview");
assertNoForbiddenControls(extractFunction(widget, "renderCodexHandoffDecisionPanel"), "renderCodexHandoffDecisionPanel");
assertSafeCopyAffordanceSource(extractFunction(widget, "renderCopyableHandoffPacket"));
assertSafeCopyHelperSource(extractFunction(widget, "copyTextToClipboard"));

const renderedWorkPicker = renderWorkPicker(renderSource, workPickerPayload());
for (const expectedWorkPickerText of [
  "Choose a work item",
  "Scope",
  "project:augnes",
  "Candidate count",
  "Recommended work",
  "AG-006",
  "First active work item for this scope.",
  "Coordination event spine schema and storage",
  "Work ID: AG-006",
  "Status",
  "In progress",
  "Priority",
  "Expected files",
  "Expected checks",
  "Related state",
  "Linked docs",
  "Next step",
  "Implement PR 1.1 and verify the append-only coordination event read path.",
  "Open this work with augnes_get_work_brief using workId: AG-006.",
  "Open the recommended work with augnes_get_work_brief using workId: AG-006.",
  "When a user asks for a project handoff and no workId is known, list work items first",
]) {
  assert.match(
    renderedWorkPicker.visibleText,
    new RegExp(escapeRegExp(expectedWorkPickerText)),
    `Work Picker visible render must include: ${expectedWorkPickerText}`,
  );
}
for (const hiddenWorkPickerRawText of [
  "work_picker_card",
  "structuredContent",
  "final_handoff_preflight",
  "codex_result_review_packet_preview",
  "non_authorities",
  "preview_only",
  "needs_result_input",
  "provider calls",
  "proof/evidence writes",
]) {
  assert.doesNotMatch(
    renderedWorkPicker.visibleText,
    new RegExp(escapeRegExp(hiddenWorkPickerRawText)),
    `Work Picker primary visible text must not emphasize raw/internal text: ${hiddenWorkPickerRawText}`,
  );
}
const renderedEmptyWorkPicker = renderWorkPicker(renderSource, emptyWorkPickerPayload());
for (const expectedEmptyPickerText of [
  "Choose a work item",
  "Candidate count",
  "0",
  "Recommended work",
  "none",
  "No work items found for this scope.",
  "Check the scope or select/create a work item elsewhere",
]) {
  assert.match(
    renderedEmptyWorkPicker.visibleText,
    new RegExp(escapeRegExp(expectedEmptyPickerText)),
    `empty Work Picker visible render must include: ${expectedEmptyPickerText}`,
  );
}

const renderedFallback = renderFallbackCard(renderSource);
const renderedFallbackText = renderedFallback.text;
const renderedFallbackVisibleText = renderedFallback.visibleText;
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
for (const expectedVisibleText of [
  "Codex handoff package",
  "Readiness",
  "Handoff prep",
  "Result review",
  "Overall check",
  "Result input",
  "Needs result input",
  "Needs user confirmation",
  "Preview only",
  "No matching memory",
  "Not attached",
  "Result review is waiting for a Codex final report or structured result payload. This does not mean the pre-run handoff packet is broken.",
  "Codex handoff readiness",
  "This preview does not execute Codex. It only prepares the request shape for later explicit user-confirmed execution.",
  "What will be handed to Codex",
  "source handoff package: Final handoff package for AG-SMOKE",
  "copyable handoff text unchanged: true",
  "What the user confirms later",
  "Confirm the current runtime endpoint.",
  "Confirm the work ID.",
  "Expect a result review packet after the work.",
  "What this screen does not do",
  "Readiness check: Needs attention.",
  "Reference memory",
  "No persisted memory IDs selected.",
  "No persisted perspective-memory items were selected",
  "PR writing checklist and report outline",
  "Work report outline",
  "Required PR body sections",
  "Summary",
  "User-facing path",
  "Files changed",
  "Verification",
  "Skipped checks and notes",
  "Reference memory status",
  "Related perspective status",
  "Final readiness check",
  "Guardrail statement",
  "Remaining caveats",
  "Next step",
  "Work result review",
  "Result incomplete / blocked",
  "Codex result import",
  "What was provided",
  "Missing result input",
  "Codex final report text or structured result payload.",
  "Changed files.",
  "Verification commands and results.",
  "Skipped checks with concrete reasons or an explicit none-skipped statement.",
  "Guardrail statement.",
  "Remaining caveats or an explicit none-remaining statement.",
  "Expected vs actual",
  "No reported changed files attached.",
  "Verification review",
  "Suggested next action",
  "What this screen does not do",
  "Readiness reasons",
  "Copy packet",
  "Codex handoff recommendation",
  "What to copy",
  "For planning",
  "Core Handoff - Copy Codex Handoff",
  "For implementation",
  "Full Context - Copy Full Context",
  "Why this recommendation",
  "Core is enough for planning. Full Context is required before implementation because implementation file/schema anchors are missing.",
  "What the user confirms",
  "I know whether I'm asking Codex for planning or implementation.",
  "I checked whether Full Context is required.",
  "I checked expected checks.",
  "I will paste the selected packet into a separate Codex session.",
  "Copy Codex Handoff",
  "After copying, validate locally with codex:handoff-preflight.",
  "Copy action only. The packet is for a separate Codex session; copying does not execute Codex, approve anything, record proof or evidence, mutate Augnes state, merge, or enable auto-merge.",
  "Related perspective",
  "No related perspective is attached to this work item.",
]) {
  assert.match(renderedFallbackVisibleText, new RegExp(escapeRegExp(expectedVisibleText)), `main visible preview must include: ${expectedVisibleText}`);
}
for (const hiddenRawStatus of ["awaiting_user_confirmation", "needs_result_input", "preview_only", "no_match", "explicitly_absent", "implementation_requires_full_context", "implementation_ready", "planning_only"]) {
  assert.doesNotMatch(
    renderedFallbackVisibleText,
    new RegExp(escapeRegExp(hiddenRawStatus)),
    `main visible preview must not show raw status ${hiddenRawStatus}`,
  );
}
for (const expectedCopyOrTechnicalText of [
  "Final Codex Handoff Packet",
  "Preparation automation only.",
  "This is a preview/copy packet, not an execution action.",
  "BEGIN_AUGNES_CODEX_HANDOFF_JSON",
  "END_AUGNES_CODEX_HANDOFF_JSON",
  "needs_result_input",
  "preview_only",
  "no_match",
  "No Project Constellation context is attached to this work contract.",
]) {
  assert.match(renderedFallbackText, new RegExp(escapeRegExp(expectedCopyOrTechnicalText)), `structured/copy text must still include: ${expectedCopyOrTechnicalText}`);
}
assert.match(
  renderedFallbackVisibleText,
  /Handoff prep[\s\S]*Ready[\s\S]*Result review[\s\S]*Needs result input[\s\S]*Overall check[\s\S]*Needs attention[\s\S]*does not mean the pre-run handoff packet is broken/,
  "fallback/no-result readiness summary must distinguish pre-run handoff readiness from post-run result review readiness",
);
await assertRenderedCopyAffordance(
  renderedFallback,
  "clipboard",
  /No Project Constellation context is attached to this work contract\.[\s\S]*Memory Reuse summary[\s\S]*No persisted perspective-memory items were selected/,
);
await assertRenderedCopyAffordance(
  renderedFallback,
  "clipboard",
  /No Project Constellation context is attached to this work contract\.[\s\S]*Memory Reuse attachment[\s\S]*No persisted memory IDs selected\.[\s\S]*Codex result review packet[\s\S]*needs_result_input/,
  "full",
);
const renderedExecFallback = renderFallbackCard(renderSource, { clipboardWriteThrows: true });
await assertRenderedCopyAffordance(renderedExecFallback, "execCommand");
const renderedStaleExecFallback = renderFallbackCard(renderSource, {
  clipboardWriteThrows: true,
  clipboardReadText: "stale clipboard text",
});
await assertRenderedCopyAffordance(renderedStaleExecFallback, "selection");
const renderedUnverifiedExecFallback = renderFallbackCard(renderSource, {
  clipboardWriteThrows: true,
  execCommandSkipsCopyEvent: true,
});
await assertRenderedCopyAffordance(renderedUnverifiedExecFallback, "selection");
const renderedSelectionFallback = renderFallbackCard(renderSource, {
  clipboardWriteThrows: true,
  execCommandReturnsFalse: true,
});
await assertRenderedCopyAffordance(renderedSelectionFallback, "selection");
assertFinalPreflightFixtures(renderSource);

const renderedImplementationReady = renderImplementationReadyCard(renderSource);
for (const expectedImplementationReadyText of [
  "Codex handoff recommendation",
  "For implementation",
  "Core Handoff - Copy Codex Handoff",
  "Core includes implementation anchors. Confirm anchors before editing.",
  "Core can be used for implementation planning. Confirm anchors before editing.",
]) {
  assert.match(
    renderedImplementationReady.visibleText,
    new RegExp(escapeRegExp(expectedImplementationReadyText)),
    `implementation-ready visible decision must include: ${expectedImplementationReadyText}`,
  );
}
assert.doesNotMatch(
  renderedImplementationReady.visibleText,
  /Full Context is required before implementation because implementation file\/schema anchors are missing/,
  "implementation-ready visible decision must not require Full Context as mandatory",
);
assert.doesNotMatch(
  renderedImplementationReady.visibleText,
  /implementation_ready/,
  "implementation-ready visible decision must not show raw usage enum",
);

const renderedPlanningOnly = renderPlanningOnlyDecisionCard(renderSource);
for (const expectedPlanningOnlyText of [
  "Core is enough for planning. For implementation, use Full Context or provide implementation anchors.",
  "Full Context or implementation anchors - Copy Full Context or provide implementation anchors",
]) {
  assert.match(
    renderedPlanningOnly.visibleText,
    new RegExp(escapeRegExp(expectedPlanningOnlyText)),
    `planning-only visible decision must include: ${expectedPlanningOnlyText}`,
  );
}
assert.doesNotMatch(renderedPlanningOnly.visibleText, /Core can be used for implementation planning/, "planning-only decision must not invent implementation readiness");
assert.doesNotMatch(renderedPlanningOnly.visibleText, /planning_only/, "planning-only visible decision must not show raw usage enum");

const renderedUnavailableDecision = renderUnavailableDecisionCard(renderSource);
for (const expectedUnavailableText of [
  "Codex handoff recommendation is unavailable. Review Core and Full Context details before choosing what to copy.",
  "No copy recommendation is inferred from unavailable Core data.",
]) {
  assert.match(
    renderedUnavailableDecision.visibleText,
    new RegExp(escapeRegExp(expectedUnavailableText)),
    `unavailable visible decision must include: ${expectedUnavailableText}`,
  );
}
assert.doesNotMatch(renderedUnavailableDecision.visibleText, /Core can be used for implementation planning/, "unavailable decision must not invent implementation readiness");
assert.doesNotMatch(renderedUnavailableDecision.visibleText, /Full Context is required before implementation because implementation file\/schema anchors are missing/, "unavailable decision must not invent a missing-anchor recommendation");

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
  /Memory Reuse summary[\s\S]*perspective-memory-item:intake-accepted[\s\S]*Reuse only as bounded prior context/,
);

const renderedWithResultReview = renderResultReviewPreviewReadyCard(renderSource);
for (const expectedResultReviewText of [
  "preview_ready",
  "structured_payload",
  "ready_for_human_review",
  "close_done",
  "Close / done",
  "Codex result import",
  "What was provided",
  "Missing result input",
  "Expected vs actual",
  "Verification review",
  "Remaining caveats",
  "Suggested next action",
  "What this screen does not do",
  "apps/augnes_apps/src/server.ts",
  "npm run smoke:chatgpt-work-contract-card",
  "npm run smoke:chatgpt-work-contract-card passed",
  "Live Developer Mode validation: No Developer Mode host session was available.",
  "No live Developer Mode observation was made.",
  "Reported changed files cover the expected file list.",
  "Reported verification results cover the expected checks.",
  "Reported result includes Memory Reuse attachment status.",
  "Reported result includes Project Constellation context status.",
  "Reported result includes final handoff preflight status.",
  "Reported result references the PR body checklist and closeout skeleton.",
  "Handoff prep",
  "Ready",
  "Result review",
  "Ready for human review",
  "Post-run result review has input and is ready for human review",
  "Review recommendations are advisory only and do not submit or post anything.",
]) {
  assert.match(renderedWithResultReview.text, new RegExp(escapeRegExp(expectedResultReviewText)), `result review render must include: ${expectedResultReviewText}`);
}
const renderedPartialResultReview = renderResultReviewPartialCard(renderSource);
for (const expectedPartialReviewText of [
  "user_provided_input",
  "User-provided result",
  "needs_revision",
  "additional_verification_needed",
  "Additional verification needed",
  "Codex result import",
  "What was provided",
  "Missing result input",
  "Changed files.",
  "Verification commands and results.",
  "Authority boundary statement.",
  "Remaining caveats or an explicit none-remaining statement.",
  "No reported changed files attached.",
  "Some skipped checks were reported without concrete reasons.",
  "Skipped check needs a concrete reason: Host visual check skipped",
  "Codex result review packet has partial attached result input; missing fields are surfaced for bounded human review.",
]) {
  assert.match(renderedPartialResultReview.text, new RegExp(escapeRegExp(expectedPartialReviewText)), `partial result review render must include: ${expectedPartialReviewText}`);
}
const partialResultPacket = resultReviewPartialCardPayload().codex_result_review_packet_preview;
assert.equal(partialResultPacket.reported_result_status, "completed", "partial fixture must preserve Codex-reported completed status");
assert.equal(partialResultPacket.suggested_result_status, "partial", "partial fixture must derive suggested_result_status from review gaps");
assert.notEqual(partialResultPacket.suggested_result_status, "completed", "partial fixture must not blindly accept Codex-reported completed status");
assert.equal(partialResultPacket.suggested_next_action, "additional_verification_needed", "missing expected verification must suggest additional verification");
const blockedResultPacket = resultReviewBlockedCardPayload().codex_result_review_packet_preview;
assert.equal(blockedResultPacket.reported_result_status, "blocked", "blocked fixture must preserve Codex-reported blocked status");
assert.equal(blockedResultPacket.suggested_result_status, "blocked", "blocked fixture must keep blocked suggested status");
assert.equal(blockedResultPacket.suggested_next_action, "result_incomplete_blocked", "blocked fixture must suggest result incomplete / blocked");
assert.doesNotMatch(
  renderedPartialResultReview.text,
  /Reported changed files cover the expected file list\./,
  "partial result review must not claim missing changed files cover expectations",
);
await assertRenderedCopyAffordance(
  renderedWithResultReview,
  "clipboard",
  /Core Codex Handoff Packet/,
);
await assertRenderedCopyAffordance(
  renderedWithResultReview,
  "clipboard",
  /Codex result review packet[\s\S]*preview_ready[\s\S]*apps\/augnes_apps\/src\/server\.ts[\s\S]*npm run smoke:chatgpt-work-contract-card passed/,
  "full",
);

console.log(
  JSON.stringify(
    {
      smoke: "chatgpt-work-contract-card",
      code_present: true,
      docs_present: true,
      package_script_present: true,
      boundary_text_present: true,
      work_picker_card_present: true,
      work_picker_widget_rendered: true,
      work_picker_empty_state_checked: true,
      scope_only_first_entry_documented: true,
      work_picker_raw_internal_text_hidden: true,
      work_picker_read_only_widget_card: true,
      handoff_preview_present: true,
      handoff_preview_stop_conditions_present: true,
      handoff_preview_copyable_packet_present: true,
      core_codex_handoff_packet_present: true,
      core_handoff_usage_present: true,
      implementation_anchors_present: true,
      full_context_implementation_anchors_present: true,
      ag006_full_context_anchor_seed_checked: true,
      missing_anchors_require_full_context: true,
      anchored_core_packet_checked: true,
      codex_handoff_decision_present: true,
      missing_anchor_decision_guidance_checked: true,
      implementation_ready_decision_guidance_checked: true,
      planning_only_decision_guidance_checked: true,
      unavailable_decision_guidance_checked: true,
      core_copy_primary_checked: true,
      full_context_copy_secondary_checked: true,
      core_copy_excludes_execution_request_metadata: true,
      core_copy_excludes_full_appendices: true,
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
      codex_result_review_packet_present: true,
      codex_result_import_input_shape_present: true,
      codex_result_review_needs_input_checked: true,
      codex_result_review_preview_ready_fixture_checked: true,
      codex_result_review_partial_fixture_checked: true,
      codex_result_review_missing_changed_files_warned: true,
      codex_result_review_missing_verification_warned: true,
      codex_result_review_skipped_reason_required: true,
      codex_result_review_structured_skipped_reason_preserved: true,
      codex_result_review_completed_with_gaps_not_suggested_completed: true,
      codex_result_review_blocked_status_checked: true,
      codex_result_review_suggested_next_action_present: true,
      codex_result_review_copy_packet_checked: true,
      codex_execution_request_preview_present: true,
      codex_execution_request_preview_status_checked: true,
      codex_execution_request_preview_user_confirmation_checked: true,
      codex_execution_request_preview_non_authorities_checked: true,
      codex_execution_request_preview_copy_unchanged_checked: true,
      user_facing_labels_checked: true,
      raw_statuses_hidden_from_main_visible_text: true,
      collapsed_technical_sections_checked: true,
      final_handoff_preflight_present: true,
      final_handoff_preflight_pass_fixture_checked: true,
      final_handoff_preflight_malformed_fixture_checked: true,
      final_handoff_preflight_memory_reuse_state_checked: true,
      final_handoff_preflight_pr_body_checklist_state_checked: true,
      final_handoff_preflight_codex_result_review_state_checked: true,
      handoff_automation_slots_present: true,
      pr_body_and_result_review_slots_preview_only: true,
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
  assert.match(source, /label:\s*"Copy Codex Handoff"/, "copy affordance must keep the primary Core Handoff label");
  assert.match(source, /label:\s*"Copy Full Context"/, "copy affordance must expose the secondary Full Context label");
  assert.match(source, /Core: Shorter packet for starting Codex work\./, "copy affordance must explain Core copy behavior");
  assert.match(source, /Full: Full context and appendices\./, "copy affordance must explain Full copy behavior");
  assert.match(source, /copyTextToClipboard\(packetText\)/, "copy affordance must use the shared layered copy helper");
  assert.match(source, /selectElementText\(pre\)/, "copy affordance must fall back to visible packet text selection");
  assert.match(source, /successText:\s*"Core handoff copied\."/ , "copy success status must name Core copy");
  assert.match(source, /successText:\s*"Full handoff copied\."/ , "copy success status must name Full copy");
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
  const codexResultReviewPacket = {
    packet_type: "codex_result_review_packet_preview",
    status: "preview_ready",
    result_source: "structured_payload",
    reviewed_against_packet_id: "final_codex_handoff_packet:AG-SMOKE",
    work_id: "AG-SMOKE",
    provided_result_input_fields: [
      "work_id",
      "scope",
      "codex final report text",
      "changed files",
      "verification commands and results",
      "skipped checks",
      "remaining caveats",
      "authority boundary statement",
    ],
    missing_result_input_fields: [],
    optional_result_input_fields: [
      "PR URL or PR number, user-provided only.",
      "Result status if Codex reported one.",
    ],
    result_review_summary: "Codex result import has 8 provided field(s) and 0 missing field(s).",
    pr_reference: {
      url: "",
      number: "",
      source: "not_provided",
      fetched: false,
    },
    reported_result_status: "completed",
    suggested_result_status: "completed",
    reported_authority_boundary_statement: "Authority boundary statement: preview-only review; no durable state or merge authority.",
    expected_files: ["apps/augnes_apps/src/server.ts"],
    reported_changed_files: ["apps/augnes_apps/src/server.ts"],
    expected_checks: ["npm run smoke:chatgpt-work-contract-card"],
    reported_verification_commands: ["npm run smoke:chatgpt-work-contract-card"],
    reported_verification_results: ["npm run smoke:chatgpt-work-contract-card passed"],
    skipped_checks: ["Live Developer Mode validation: No Developer Mode host session was available."],
    remaining_caveats: ["No live Developer Mode observation was made."],
    missing_required_closeout_sections: [],
    required_result_input_fields: ["Codex final report text or structured result payload."],
    authority_boundary_issues: [],
    memory_reuse_alignment: {
      status: "aligned",
      summary: "Reported result includes Memory Reuse attachment status.",
      expected: ["Memory Reuse attachment status", "no_match"],
      reported: ["Memory Reuse attachment status: no_match"],
      missing: [],
    },
    constellation_context_alignment: {
      status: "aligned",
      summary: "Reported result includes Project Constellation context status.",
      expected: ["Project Constellation context status", "explicitly_absent"],
      reported: ["Project Constellation context status: explicitly_absent"],
      missing: [],
    },
    preflight_alignment: {
      status: "aligned",
      summary: "Reported result includes final handoff preflight status.",
      expected: ["Final handoff preflight status"],
      reported: ["Final handoff preflight status: pass"],
      missing: [],
    },
    checklist_alignment: {
      status: "aligned",
      summary: "Reported result references the PR body checklist and closeout skeleton.",
      expected: ["PR body checklist", "closeout skeleton"],
      reported: ["PR body checklist / closeout skeleton included"],
      missing: [],
    },
    file_alignment: {
      status: "aligned",
      summary: "Reported changed files cover the expected file list.",
      expected: ["apps/augnes_apps/src/server.ts"],
      reported: ["apps/augnes_apps/src/server.ts"],
      missing: [],
    },
    verification_alignment: {
      status: "aligned",
      summary: "Reported verification results cover the expected checks.",
      expected: ["npm run smoke:chatgpt-work-contract-card"],
      reported: ["npm run smoke:chatgpt-work-contract-card passed"],
      missing: [],
    },
    skipped_check_alignment: {
      status: "aligned",
      summary: "Skipped checks were reported with concrete reasons.",
      expected: ["Skipped checks must be reported with concrete reasons; do not claim skipped checks passed."],
      reported: ["Live Developer Mode validation: No Developer Mode host session was available."],
      missing: [],
    },
    review_questions: ["Ready for human review after checking the reported result payload."],
    review_recommendation: "ready_for_human_review",
    suggested_next_action: "close_done",
    warnings: ["Review recommendations are advisory only and do not submit or post anything."],
    boundary_text: ["Codex result review packet is preview-only review preparation."],
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
    codex_result_review_packet_preview: codexResultReviewPacket,
    final_handoff_codex_result_review_packet: codexResultReviewPacket,
    codex_pr_review_packet_preview: codexResultReviewPacket,
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
        status: "preview_ready",
        generated: true,
        inert: true,
        review_packet: codexResultReviewPacket,
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
      "Codex result review packet",
      "- Status: preview_ready",
      "- Result source: structured_payload",
      "- Reported changed files:",
      "  - apps/augnes_apps/src/server.ts",
      "- Reported verification results:",
      "  - npm run smoke:chatgpt-work-contract-card passed",
      "Skipped checks must be reported with concrete reasons; do not claim skipped checks passed.",
      "BEGIN_AUGNES_CODEX_HANDOFF_JSON",
      JSON.stringify({
        schema: "augnes.codex_handoff_preview.v0_1",
        packet_kind: "final_codex_handoff_packet",
        final_packet_schema: "augnes.final_codex_handoff_packet.v0_1",
        pr_body_checklist_preview: prBodyChecklistPreview,
        codex_closeout_skeleton: closeoutSkeleton,
        codex_result_review_packet_preview: codexResultReviewPacket,
        handoff_automation_slots: {
          pr_body_checklist: {
            status: "preview_only",
            generated: true,
            inert: true,
          },
          codex_result_review_packet: {
            status: "preview_ready",
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
  assert.ok(pass.checks.some((check) => check.id === "codex_result_review_packet_state" && check.status === "pass"), "preflight must check Codex result review packet state");

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
  assert.match(source, /document\.addEventListener\?\.\("copy"/, "execCommand copy fallback must install a copy-event handler");
  assert.match(source, /clipboardData\.setData\("text\/plain", text\)/, "execCommand fallback must provide text through clipboardData");
  assert.match(source, /navigator\.clipboard\?\.readText/, "execCommand fallback must verify copied text before reporting success");
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

function resultReviewPreviewReadyCardPayload() {
  return {
    ...memoryReuseProposedCardPayload(),
    codex_result_review_packet_preview: {
      packet_type: "codex_result_review_packet_preview",
      status: "preview_ready",
      result_source: "structured_payload",
      reviewed_against_packet_id: "final_codex_handoff_packet:AG-SMOKE",
      work_id: "AG-SMOKE",
      provided_result_input_fields: [
        "work_id",
        "scope",
        "codex final report text",
        "changed files",
        "verification commands and results",
        "skipped checks",
        "remaining caveats",
        "authority boundary statement",
        "result status",
      ],
      missing_result_input_fields: [],
      optional_result_input_fields: [
        "PR URL or PR number, user-provided only.",
        "Result status if Codex reported one.",
      ],
      result_review_summary: "Codex result import has 9 provided field(s) and 0 missing field(s).",
      pr_reference: {
        url: "https://github.com/hynk-studio/augnes/pull/000",
        number: "000",
        source: "user_provided",
        fetched: false,
      },
      reported_result_status: "completed",
      suggested_result_status: "completed",
      reported_authority_boundary_statement: "Authority boundary statement: preview-only review; no durable state or merge authority.",
      expected_files: ["apps/augnes_apps/src/server.ts"],
      reported_changed_files: ["apps/augnes_apps/src/server.ts"],
      expected_checks: ["npm run smoke:chatgpt-work-contract-card"],
      reported_verification_commands: ["npm run smoke:chatgpt-work-contract-card"],
      reported_verification_results: ["npm run smoke:chatgpt-work-contract-card passed"],
      skipped_checks: ["Live Developer Mode validation: No Developer Mode host session was available."],
      remaining_caveats: ["No live Developer Mode observation was made."],
      missing_required_closeout_sections: [],
      required_result_input_fields: [
        "Codex final report text or structured result payload.",
        "Changed files.",
        "Verification commands and results.",
      ],
      authority_boundary_issues: [],
      memory_reuse_alignment: {
        status: "aligned",
        summary: "Reported result includes Memory Reuse attachment status.",
        expected: ["Memory Reuse attachment status", "proposed"],
        reported: ["Memory Reuse attachment status: proposed"],
        missing: [],
      },
      constellation_context_alignment: {
        status: "aligned",
        summary: "Reported result includes Project Constellation context status.",
        expected: ["Project Constellation context status", "attached"],
        reported: ["Project Constellation context status: attached"],
        missing: [],
      },
      preflight_alignment: {
        status: "aligned",
        summary: "Reported result includes final handoff preflight status.",
        expected: ["Final handoff preflight status"],
        reported: ["Final handoff preflight status: pass"],
        missing: [],
      },
      checklist_alignment: {
        status: "aligned",
        summary: "Reported result references the PR body checklist and closeout skeleton.",
        expected: ["PR body checklist", "closeout skeleton"],
        reported: ["PR body checklist / closeout skeleton included"],
        missing: [],
      },
      file_alignment: {
        status: "aligned",
        summary: "Reported changed files cover the expected file list.",
        expected: ["apps/augnes_apps/src/server.ts"],
        reported: ["apps/augnes_apps/src/server.ts"],
        missing: [],
      },
      verification_alignment: {
        status: "aligned",
        summary: "Reported verification results cover the expected checks.",
        expected: ["npm run smoke:chatgpt-work-contract-card"],
        reported: ["npm run smoke:chatgpt-work-contract-card passed"],
        missing: [],
      },
      skipped_check_alignment: {
        status: "aligned",
        summary: "Skipped checks were reported with concrete reasons.",
        expected: ["Skipped checks must be reported with concrete reasons; do not claim skipped checks passed."],
        reported: ["Live Developer Mode validation: No Developer Mode host session was available."],
        missing: [],
      },
      review_questions: [
        "Ready for human review after checking the reported result payload.",
      ],
      review_recommendation: "ready_for_human_review",
      suggested_next_action: "close_done",
      warnings: [
        "Review recommendations are advisory only and do not submit or post anything.",
      ],
      boundary_text: [
        "Codex result review packet is preview-only review preparation.",
        "No GitHub PR data is fetched by the App/MCP server.",
      ],
    },
  };
}

function resultReviewPartialCardPayload() {
  return {
    ...memoryReuseProposedCardPayload(),
    codex_result_review_packet_preview: {
      packet_type: "codex_result_review_packet_preview",
      status: "preview_ready",
      result_source: "user_provided_input",
      reviewed_against_packet_id: "final_codex_handoff_packet:AG-SMOKE",
      work_id: "AG-SMOKE",
      provided_result_input_fields: [
        "work_id",
        "scope",
        "codex final report text",
        "skipped checks",
      ],
      missing_result_input_fields: [
        "Changed files.",
        "Verification commands and results.",
        "Authority boundary statement.",
        "Remaining caveats or an explicit none-remaining statement.",
      ],
      optional_result_input_fields: [
        "PR URL or PR number, user-provided only.",
        "Result status if Codex reported one.",
      ],
      result_review_summary: "Codex result import has 4 provided field(s) and 4 missing field(s).",
      pr_reference: {
        url: "",
        number: "",
        source: "not_provided",
        fetched: false,
      },
      reported_result_status: "completed",
      suggested_result_status: "partial",
      reported_authority_boundary_statement: "",
      expected_files: ["apps/augnes_apps/src/server.ts"],
      reported_changed_files: [],
      expected_checks: ["npm run smoke:chatgpt-work-contract-card"],
      reported_verification_commands: [],
      reported_verification_results: [],
      skipped_checks: ["Host visual check skipped"],
      remaining_caveats: [],
      missing_required_closeout_sections: ["Verification", "Authority boundary statement", "Remaining caveats"],
      required_result_input_fields: [
        "work_id.",
        "scope.",
        "Codex final report text or structured result payload.",
        "Changed files.",
        "Verification commands and results.",
      ],
      authority_boundary_issues: ["Authority boundary statement is missing from the reported result payload."],
      memory_reuse_alignment: {
        status: "missing",
        summary: "Reported result is missing Memory Reuse attachment status.",
        expected: ["Memory Reuse attachment status", "proposed"],
        reported: [],
        missing: ["Memory Reuse attachment status", "proposed"],
      },
      constellation_context_alignment: {
        status: "missing",
        summary: "Reported result is missing Project Constellation context status.",
        expected: ["Project Constellation context status", "attached"],
        reported: [],
        missing: ["Project Constellation context status", "attached"],
      },
      preflight_alignment: {
        status: "missing",
        summary: "Reported result is missing final handoff preflight status.",
        expected: ["Final handoff preflight status"],
        reported: [],
        missing: ["Final handoff preflight status"],
      },
      checklist_alignment: {
        status: "missing",
        summary: "Reported result is missing PR body checklist / closeout skeleton context.",
        expected: ["PR body checklist", "closeout skeleton"],
        reported: [],
        missing: ["PR body checklist", "closeout skeleton"],
      },
      file_alignment: {
        status: "not_provided",
        summary: "No changed files were reported.",
        expected: ["apps/augnes_apps/src/server.ts"],
        reported: [],
        missing: ["apps/augnes_apps/src/server.ts"],
      },
      verification_alignment: {
        status: "not_provided",
        summary: "No verification results were reported.",
        expected: ["npm run smoke:chatgpt-work-contract-card"],
        reported: [],
        missing: ["npm run smoke:chatgpt-work-contract-card"],
      },
      skipped_check_alignment: {
        status: "partial",
        summary: "Some skipped checks were reported without concrete reasons.",
        expected: ["Skipped checks must be reported with concrete reasons; do not claim skipped checks passed."],
        reported: ["Host visual check skipped"],
        missing: ["Host visual check skipped"],
      },
      review_questions: [
        "Can Codex provide Changed files.",
        "Can Codex provide Verification commands and results.",
        "Does the closeout include the required authority boundary statement?",
      ],
      review_recommendation: "needs_revision",
      suggested_next_action: "additional_verification_needed",
      warnings: [
        "Skipped check needs a concrete reason: Host visual check skipped",
        "Missing result input: Changed files.; Verification commands and results.; Authority boundary statement.; Remaining caveats or an explicit none-remaining statement.",
        "Review recommendations are advisory only and do not submit or post anything.",
      ],
      boundary_text: [
        "Codex result review packet is preview-only review preparation.",
        "No GitHub PR data is fetched by the App/MCP server.",
      ],
    },
  };
}

function resultReviewBlockedCardPayload() {
  const payload = resultReviewPartialCardPayload();
  return {
    ...payload,
    codex_result_review_packet_preview: {
      ...payload.codex_result_review_packet_preview,
      reported_result_status: "blocked",
      suggested_result_status: "blocked",
      suggested_next_action: "result_incomplete_blocked",
      review_recommendation: "blocked_by_missing_evidence",
    },
  };
}

function implementationReadyCardPayload() {
  const payload = fallbackCardPayload();
  return {
    ...payload,
    work_contract_card: {
      ...payload.work_contract_card,
      expected_files: ["apps/augnes_apps/src/server.ts"],
      expected_checks: ["npm run smoke:chatgpt-work-contract-card"],
      related_state_keys: ["coordination.event_spine"],
    },
  };
}

function planningOnlyDecisionCardPayload() {
  return {
    ...fallbackCardPayload(),
    codex_handoff_decision: {
      decision_type: "codex_handoff_recommendation",
      status: "ready",
      core_handoff_usage: "planning_only",
      implementation_anchor_count: 0,
    },
  };
}

function unavailableDecisionCardPayload() {
  return {
    ...fallbackCardPayload(),
    codex_handoff_decision: {
      decision_type: "codex_handoff_recommendation",
      status: "unavailable",
      recommendation_reason: "Codex handoff recommendation is unavailable. Review Core and Full Context details before choosing what to copy.",
      blocking_reason: "Core Handoff usage is unavailable.",
    },
  };
}

function workPickerPayload() {
  return {
    panel: "work_picker_card",
    scope: "project:augnes",
    workItems: [
      {
        work_id: "AG-006",
        scope: "project:augnes",
        title: "Coordination event spine schema and storage",
        status: "in_progress",
        priority: "now",
        summary: "Add the Phase 1 event spine schema, storage helpers, and read-only API without expanding write authority.",
        next_action: "Implement PR 1.1 and verify the append-only coordination event read path.",
        updated_at: "2026-05-08T00:00:00.000Z",
        user_attention_required: false,
        related_state_keys: ["coordination.event_spine"],
        links: {
          docs: ["docs/AUGNES_COORDINATION_SPINE_ROADMAP.md"],
          expected_files: ["lib/state-runtime/work.ts"],
          expected_checks: ["npm run smoke:readonly-api-route-constellation-preview"],
        },
        created_at: "2026-05-08T00:00:00.000Z",
      },
      {
        work_id: "AG-001",
        scope: "project:augnes",
        title: "Work Trace Spine v0 and Work Focus View",
        status: "completed",
        priority: "later",
        summary: "Completed historical work anchor.",
        next_action: "Use AG-006 for current handoff.",
        updated_at: "2026-05-07T00:00:00.000Z",
        user_attention_required: false,
        related_state_keys: [],
        links: {},
        created_at: "2026-05-07T00:00:00.000Z",
      },
    ],
    work_picker_card: {
      card_type: "work_picker_card",
      title: "Choose a work item",
      scope: "project:augnes",
      candidate_count: 2,
      recommended_work_id: "AG-006",
      recommended_work_title: "Coordination event spine schema and storage",
      selection_reason: "First active work item for this scope.",
      next_action_hint: "Open the recommended work with augnes_get_work_brief using workId: AG-006.",
      handoff_tool_hint:
        "When a user asks for a project handoff and no workId is known, list work items first, then call augnes_get_work_brief with the selected or recommended workId.",
      empty_state: null,
      work_candidates: [
        {
          work_id: "AG-006",
          title: "Coordination event spine schema and storage",
          status: "in_progress",
          priority: "now",
          summary: "Add the Phase 1 event spine schema, storage helpers, and read-only API without expanding write authority.",
          next_step: "Implement PR 1.1 and verify the append-only coordination event read path.",
          user_attention_required: false,
          related_state_keys_count: 1,
          expected_files_count: 1,
          expected_checks_count: 1,
          linked_docs_count: 1,
          is_recommended: true,
          handoff_instruction: "Open this work with augnes_get_work_brief using workId: AG-006.",
        },
        {
          work_id: "AG-001",
          title: "Work Trace Spine v0 and Work Focus View",
          status: "completed",
          priority: "later",
          summary: "Completed historical work anchor.",
          next_step: "Use AG-006 for current handoff.",
          user_attention_required: false,
          related_state_keys_count: 0,
          expected_files_count: 0,
          expected_checks_count: 0,
          linked_docs_count: 0,
          is_recommended: false,
          handoff_instruction: "Open this work with augnes_get_work_brief using workId: AG-001.",
        },
      ],
      boundary_text: [
        "Work Picker is read-only.",
        "Work IDs are trace anchors, not committed state authority.",
        "Selecting a work item means choosing what to inspect next; it does not execute Codex.",
      ],
    },
  };
}

function emptyWorkPickerPayload() {
  return {
    panel: "work_picker_card",
    scope: "project:augnes",
    workItems: [],
    work_picker_card: {
      card_type: "work_picker_card",
      title: "Choose a work item",
      scope: "project:augnes",
      candidate_count: 0,
      recommended_work_id: null,
      recommended_work_title: null,
      selection_reason: "No work items found for this scope.",
      next_action_hint: "No work items found for this scope. Check the scope or select/create a work item elsewhere before opening a handoff card.",
      handoff_tool_hint:
        "When a user asks for a project handoff and no workId is known, list work items first, then call augnes_get_work_brief with the selected or recommended workId.",
      empty_state: "No work items found for this scope. Check the scope or select/create a work item elsewhere.",
      work_candidates: [],
      boundary_text: [
        "Work Picker is read-only.",
        "Work IDs are trace anchors, not committed state authority.",
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

function renderResultReviewPreviewReadyCard(source, options = {}) {
  return renderCard(source, resultReviewPreviewReadyCardPayload(), options);
}

function renderResultReviewPartialCard(source, options = {}) {
  return renderCard(source, resultReviewPartialCardPayload(), options);
}

function renderImplementationReadyCard(source, options = {}) {
  return renderCard(source, implementationReadyCardPayload(), options);
}

function renderPlanningOnlyDecisionCard(source, options = {}) {
  return renderCard(source, planningOnlyDecisionCardPayload(), options);
}

function renderUnavailableDecisionCard(source, options = {}) {
  return renderCard(source, unavailableDecisionCardPayload(), options);
}

function renderCard(source, payload, options = {}) {
  return renderWidget(source, payload, "renderWorkContractCard(__payload)", options);
}

function renderWorkPicker(source, payload, options = {}) {
  return renderWidget(source, payload, "renderWorkPickerCard(__payload)", options);
}

function renderWidget(source, payload, renderExpression, options = {}) {
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
  const documentListeners = new Map();
  const context = {
    document: {
      body,
      createElement(tag) {
        return new FakeNode(tag);
      },
      addEventListener(type, listener) {
        const listeners = documentListeners.get(type) ?? [];
        listeners.push(listener);
        documentListeners.set(type, listeners);
      },
      removeEventListener(type, listener) {
        const listeners = documentListeners.get(type) ?? [];
        documentListeners.set(
          type,
          listeners.filter((candidate) => candidate !== listener),
        );
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
        const ok = !options.execCommandReturnsFalse && command === "copy";
        if (ok && !options.execCommandSkipsCopyEvent) {
          for (const listener of documentListeners.get("copy") ?? []) {
            listener({
              clipboardData: {
                setData(format, value) {
                  context.__execCommandClipboardFormat = format;
                  context.__execCommandClipboardText = value;
                },
              },
              preventDefault() {
                context.__copyEventPrevented = true;
              },
            });
          }
        }
        return ok;
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
      async readText() {
        context.__clipboardReadCount = (context.__clipboardReadCount ?? 0) + 1;
        if (options.clipboardReadThrows) throw new Error("blocked");
        if (typeof options.clipboardReadText === "string") return options.clipboardReadText;
        return context.__copiedText ?? context.__execCommandClipboardText ?? "";
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
  const output = vm.runInContext(renderExpression, context);
  return {
    context,
    tree: output,
    text: collectText(output).replace(/\s+/g, " ").trim(),
    visibleText: collectVisibleText(output).replace(/\s+/g, " ").trim(),
  };
}

async function assertRenderedCopyAffordance(renderedFallback, expectedPath = "clipboard", expectedTextPattern = /Core Codex Handoff Packet/, copyMode = "core") {
  const buttons = collectNodes(renderedFallback.tree, (node) => node.tag === "button");
  assert.equal(buttons.length, 2, "fallback render must include Core and Full safe copy buttons");
  assert.deepEqual(
    buttons.map((button) => button.textContent).sort(),
    ["Copy Codex Handoff", "Copy Full Context"],
    "copy buttons must expose primary Core and secondary Full labels",
  );
  for (const candidate of buttons) {
    assert.ok(allowedCopyLabels.includes(candidate.textContent), "copy button label must be allowed");
    assert.equal(candidate.type, "button", "copy button must be type=button");
    assert.ok(candidate.listeners.click?.length === 1, "copy button must have one local click handler");
  }
  const button = buttons.find((candidate) =>
    copyMode === "full" ? candidate.textContent === "Copy Full Context" : candidate.textContent === "Copy Codex Handoff"
  );
  assert.ok(button, `${copyMode} copy button must exist`);
  const statusNodes = collectNodes(
    renderedFallback.tree,
    (node) => node.attributes?.["aria-live"] === "polite",
  );
  assert.equal(statusNodes.length, 1, "copy affordance must expose one aria-live local status node");
  const preBlocks = collectNodes(renderedFallback.tree, (node) => node.tag === "pre");
  assert.ok(preBlocks.some((node) => node.textContent.includes("Core Codex Handoff Packet")), "core packet preformatted text must remain visible");
  assert.ok(preBlocks.some((node) => node.textContent.includes("Final Codex Handoff Packet")), "final packet preformatted text must remain visible");
  const fullPacketText = preBlocks.find((node) => node.textContent.includes("Final Codex Handoff Packet"))?.textContent || "";
  assert.match(renderedFallback.visibleText, /Core: Shorter packet for starting Codex work\./, "visible copy helper must explain Core packet");
  assert.match(renderedFallback.visibleText, /Full: Full context and appendices\./, "visible copy helper must explain Full packet");

  await button.listeners.click[0]();
  const copiedText = expectedPath === "execCommand"
    ? renderedFallback.context.__execCommandClipboardText
    : expectedPath === "selection"
      ? renderedFallback.context.__selectedText
      : renderedFallback.context.__copiedText;
  if (copyMode === "full") {
    assert.match(copiedText, /Final Codex Handoff Packet/, "full copy button must copy the final handoff packet");
    assert.match(copiedText, /Closeout skeleton preview/, "full copy must preserve closeout skeleton appendix");
    assert.match(copiedText, /Codex result review packet/, "full copy must preserve result review appendix");
  } else {
    assert.match(copiedText, /Core Codex Handoff Packet/, "primary copy button must copy the Core handoff packet");
    assert.match(copiedText, /Shorter packet for starting Codex work/, "Core copy must explain it is the shorter start packet");
    assert.match(copiedText, /Core usage/, "Core copy must include usage state section");
    assert.match(copiedText, /Implementation anchors/, "Core copy must include implementation anchors section");
    assert.match(copiedText, /Expected read-only checks/, "Core copy must label read-only checks clearly");
    assert.ok(copiedText.length < fullPacketText.length * 0.8, "Core copy must remain much shorter than Full Context");
    assert.doesNotMatch(copiedText, /Closeout skeleton preview/, "Core copy must not include the full closeout skeleton appendix");
    assert.doesNotMatch(copiedText, /Codex result review packet/, "Core copy must not include result review packet details");
  }
  assert.match(copiedText, expectedTextPattern, "copy button must copy the expected visible handoff packet text");
  assert.match(copiedText, /BEGIN_AUGNES_CODEX_HANDOFF_JSON/, "copied packet must include JSON begin delimiter");
  assert.match(copiedText, /END_AUGNES_CODEX_HANDOFF_JSON/, "copied packet must include JSON end delimiter");
  assert.doesNotMatch(
    copiedText,
    /Codex execution request preview|codex_execution_request_preview|execution_request_preview/,
    "copy button must not include execution request preview metadata",
  );
  if (expectedPath === "selection") {
    assert.equal(
      statusNodes[0].textContent,
      "Clipboard blocked by this host. Packet text selected; press Command+C to copy.",
      "host-blocked clipboard fallback must select visible packet text and label manual copy",
    );
    assert.equal(renderedFallback.context.__selectionCleared, true, "selection fallback must clear previous selection");
    assert.equal(renderedFallback.context.__rangeAdded, true, "selection fallback must select the visible packet text");
  } else {
    assert.equal(
      statusNodes[0].textContent,
      copyMode === "full" ? "Full handoff copied." : "Core handoff copied.",
      "copy success must update local status only",
    );
  }
  if (expectedPath === "execCommand") {
    assert.equal(renderedFallback.context.__execCommand, "copy", "copy fallback must use document.execCommand copy");
    assert.equal(renderedFallback.context.__execCommandClipboardFormat, "text/plain", "execCommand fallback must write text/plain data");
    assert.equal(renderedFallback.context.__copyEventPrevented, true, "execCommand fallback must prevent the default copy event after setting data");
    assert.ok(renderedFallback.context.__clipboardReadCount >= 1, "execCommand fallback must read back the copied text before reporting success");
  } else {
    assert.ok(renderedFallback.context.__clipboardWriteCount >= 1, "copy button must try navigator.clipboard");
  }

  const jsonBlock = extractEmbeddedHandoffJson(copiedText);
  assert.equal(jsonBlock.schema, "augnes.codex_handoff_preview.v0_1", "embedded handoff JSON schema must match v0.1");
  assert.equal(jsonBlock.copy_packet.preview_only, true, "embedded JSON must mark packet preview-only");
  assert.equal(jsonBlock.copy_packet.does_not_execute_codex, true, "embedded JSON must mark no Codex execution");
  assert.equal(jsonBlock.copy_packet.does_not_record_proof, true, "embedded JSON must mark no proof recording");
  assert.equal(jsonBlock.copy_packet.does_not_record_evidence, true, "embedded JSON must mark no evidence recording");
  assert.equal(jsonBlock.copy_packet.does_not_mutate_state, true, "embedded JSON must mark no state mutation");
  assert.equal(jsonBlock.copy_packet.does_not_merge, true, "embedded JSON must mark no merge authority");
  if (copyMode !== "full") {
    assert.equal(jsonBlock.packet_kind, "core_codex_handoff_packet", "embedded handoff JSON kind must identify the Core packet");
    assert.equal(jsonBlock.core_packet_schema, "augnes.core_codex_handoff_packet.v0_1", "Core JSON must identify the Core packet schema");
    assert.equal(jsonBlock.copy_packet.core_packet, true, "Core JSON must mark the packet as the Core copy");
    assert.equal(jsonBlock.copy_packet.full_context_available_separately, true, "Core JSON must point to separate full context availability");
    assert.ok(jsonBlock.work?.title, "Core JSON must include task title");
    assert.ok(jsonBlock.work?.work_id, "Core JSON must include work ID");
    assert.ok(jsonBlock.expected_scope, "Core JSON must include expected scope");
    assert.ok(
      ["planning_only", "implementation_ready", "implementation_requires_full_context"].includes(jsonBlock.core_handoff_usage),
      "Core JSON must include bounded usage state",
    );
    assert.ok(Array.isArray(jsonBlock.implementation_anchors), "Core JSON must include implementation anchors array");
    if (jsonBlock.implementation_anchors.length === 0) {
      assert.equal(
        jsonBlock.core_handoff_usage,
        "implementation_requires_full_context",
        "Core JSON without implementation anchors must require Full Context before implementation",
      );
      assert.equal(
        jsonBlock.full_context_required_before_implementation,
        true,
        "Core JSON without implementation anchors must mark Full Context required",
      );
      assert.match(
        copiedText,
        /No implementation file\/schema anchors are attached in Core\. Use Core for planning only, or open Full Context before implementation\./,
        "Core copy without anchors must not invent targets and must require Full Context",
      );
    } else {
      assert.equal(jsonBlock.core_handoff_usage, "implementation_ready", "Core JSON with anchors must mark implementation_ready");
      assert.equal(
        jsonBlock.full_context_required_before_implementation,
        false,
        "Core JSON with anchors must not require Full Context before implementation",
      );
      for (const anchor of jsonBlock.implementation_anchors) {
        assert.match(copiedText, new RegExp(escapeRegExp(anchor)), `Core copy must include implementation anchor: ${anchor}`);
      }
    }
    assert.ok(jsonBlock.final_report_requirements, "Core JSON must include final report requirements");
    assert.equal(jsonBlock.codex_result_review_packet_preview, undefined, "Core JSON must not include result review packet details");
    assert.equal(jsonBlock.codex_closeout_skeleton, undefined, "Core JSON must not include full closeout skeleton details");
    return;
  }
  assert.equal(jsonBlock.packet_kind, "final_codex_handoff_packet", "embedded handoff JSON kind must identify the final packet");
  assert.equal(jsonBlock.final_packet_schema, "augnes.final_codex_handoff_packet.v0_1", "embedded JSON must identify the final packet schema");
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
  assert.ok(jsonBlock.codex_result_review_packet_preview, "embedded JSON must include Codex result review packet preview");
  assert.ok(
    ["not_provided", "needs_result_input", "preview_ready", "unavailable"].includes(jsonBlock.codex_result_review_packet_preview?.status),
    "Codex result review packet must use a bounded status",
  );
  if (jsonBlock.codex_result_review_packet_preview?.status === "needs_result_input") {
    assert.equal(jsonBlock.codex_result_review_packet_preview?.result_source, "not_provided", "missing result review packet must mark result_source not_provided");
    assert.deepEqual(jsonBlock.codex_result_review_packet_preview?.reported_changed_files, [], "missing result review packet must not invent changed files");
    assert.deepEqual(jsonBlock.codex_result_review_packet_preview?.reported_verification_results, [], "missing result review packet must not invent verification results");
    assert.match(
      (jsonBlock.codex_result_review_packet_preview?.warnings || []).join("\n"),
      /no changed files, verification results, PR URLs, proof IDs, evidence IDs, screenshots, findings, or host observations were invented/i,
      "missing result review packet must explicitly state no result data was invented",
    );
  }
  assert.equal(
    jsonBlock.handoff_automation_slots?.codex_result_review_packet?.status,
    jsonBlock.codex_result_review_packet_preview?.status,
    "Codex result review packet slot must mirror packet status",
  );
  assert.equal(jsonBlock.handoff_automation_slots?.codex_result_review_packet?.generated, true, "Codex result review packet slot must be generated");
  assert.equal(jsonBlock.handoff_automation_slots?.codex_result_review_packet?.inert, true, "Codex result review packet slot must stay inert/no-write");
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

function collectVisibleText(node) {
  if (!node || typeof node !== "object") return "";
  const ownText = [node.textContent, node.innerHTML].filter(Boolean).join(" ");
  if (node.tag === "details" && node.open === false) {
    return `${ownText} ${collectVisibleText(node.children?.[0])}`;
  }
  const childText = Array.isArray(node.children) ? node.children.map(collectVisibleText).join(" ") : "";
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
