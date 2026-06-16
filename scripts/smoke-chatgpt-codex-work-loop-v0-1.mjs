import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import vm from "node:vm";

const snapshotDocPath = "docs/AUGNES_CHATGPT_CODEX_WORK_LOOP_V0_1_SNAPSHOT.md";
const serverPath = "apps/augnes_apps/src/server.ts";
const widgetPath = "apps/augnes_apps/public/console-widget.html";
const runbookPath = "apps/augnes_apps/docs/12_WORK_CONTRACT_CARD_RUNBOOK.md";
const demoSeedPath = "scripts/demo-seed.mjs";

for (const filePath of [snapshotDocPath, serverPath, widgetPath, runbookPath, demoSeedPath]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const snapshotDoc = readFileSync(snapshotDocPath, "utf8");
const server = readFileSync(serverPath, "utf8");
const widget = readFileSync(widgetPath, "utf8");
const runbook = readFileSync(runbookPath, "utf8");
const demoSeed = readFileSync(demoSeedPath, "utf8");

const EXPECTED_FILES = [
  "docs/AUGNES_CHATGPT_CODEX_WORK_LOOP_V0_1_SNAPSHOT.md",
  "scripts/smoke-chatgpt-codex-work-loop-v0-1.mjs",
  "apps/augnes_apps/docs/12_WORK_CONTRACT_CARD_RUNBOOK.md",
];

const EXPECTED_CHECKS = [
  "curl -sS 'http://localhost:3000/api/work/AG-006/brief?scope=project:augnes'",
  "curl -sS 'http://localhost:3000/api/events?scope=project:augnes&work_id=AG-006'",
  "node scripts/smoke-chatgpt-codex-work-loop-v0-1.mjs",
];

const AUTHORITY_BOUNDARY_ASSERTIONS = [
  "no Codex execution",
  "no App/MCP shell execution",
  "no GitHub API calls from product/App/MCP code",
  "no provider/OpenAI calls",
  "no proof/evidence writes",
  "no event creation/mutation",
  "no work close/status update",
  "no state commit/reject",
  "no branch/PR creation",
  "no PR review submission",
  "no merge/publish/retry/replay/deploy controls",
  "no durable lifecycle automation",
];

assertSnapshotDoc();
assertRunbookPointer();
assertStructuredToolSurface();
assertAg006Seed();
assertAuthoritySourceBoundary();
assertFixtureScenarios();

console.log(
  JSON.stringify(
    {
      smoke: "chatgpt-codex-work-loop-v0-1",
      snapshot_doc_present: true,
      baseline_after_pr_596_checked: true,
      work_picker_checked: true,
      work_contract_card_checked: true,
      core_full_handoff_checked: true,
      result_import_review_scenarios_checked: true,
      event_spine_timeline_checked: true,
      closure_followup_scenarios_checked: true,
      authority_boundaries_checked: true,
      runtime_dogfood_skipped_reason_documented: true,
      forbidden_product_authority_absent: true,
    },
    null,
    2,
  ),
);

function assertSnapshotDoc() {
  assert.match(snapshotDoc, /^# Augnes ChatGPT-Codex Work Loop v0\.1 Snapshot/m, "snapshot doc must have the required title");
  assert.match(snapshotDoc, /Date: 2026-06-16/, "snapshot doc must include the snapshot date");
  assert.match(snapshotDoc, /Baseline commit: `89f920e`/, "snapshot doc must pin the post-PR #596 baseline commit");
  for (const pr of ["PR #594", "PR #595", "PR #596"]) {
    assert.match(snapshotDoc, new RegExp(escapeRegExp(pr)), `snapshot doc must name ${pr}`);
  }
  for (const heading of [
    "## Summary",
    "## Baseline",
    "## Loop",
    "## Verified User/Operator Path",
    "## Structured Surfaces",
    "## Dogfood Scenarios",
    "## Authority Boundaries",
    "## Verification",
    "## Skipped Checks",
    "## Remaining Caveats",
    "## Next Recommended Steps",
  ]) {
    assert.match(snapshotDoc, new RegExp(`^${escapeRegExp(heading)}$`, "m"), `snapshot doc must include ${heading}`);
  }
  assert.match(
    snapshotDoc,
    /Work Picker\s*-> Work Brief \/ Work Contract Card\s*-> Core \/ Full Codex handoff\s*-> Codex result import \/ review\s*-> Work Event Spine Timeline \/ Inspector\s*-> Result Closure \/ Follow-up Recommendation/s,
    "snapshot doc must include the full loop diagram",
  );
  for (const boundary of AUTHORITY_BOUNDARY_ASSERTIONS) {
    assert.match(snapshotDoc, new RegExp(escapeRegExp(boundary), "i"), `snapshot doc must assert ${boundary}`);
  }
  assert.match(snapshotDoc, /CODEX_READ_BRIEF_RUNTIME_UNAVAILABLE/, "snapshot doc must document the skipped runtime dogfood reason");
  assert.match(snapshotDoc, /node scripts\/smoke-chatgpt-codex-work-loop-v0-1\.mjs/, "snapshot doc must list the integrated smoke command");
}

function assertRunbookPointer() {
  assert.match(
    runbook,
    /AUGNES_CHATGPT_CODEX_WORK_LOOP_V0_1_SNAPSHOT\.md/,
    "Work Contract Card runbook must point to the integrated v0.1 snapshot",
  );
}

function assertStructuredToolSurface() {
  const workListBlock = extractToolBlock(server, "augnes_list_work_items");
  assert.match(workListBlock, /annotations:\s*bridgeReadAnnotations/, "Work Picker must remain read-only annotated");
  assert.doesNotMatch(workListBlock, /annotations:\s*bridgeWriteAnnotations/, "Work Picker must not be write annotated");
  for (const field of [
    "work_picker_card",
    "work_candidates",
    "recommended_work_id",
    "selection_reason",
    "next_action_hint",
    "handoff_tool_hint",
  ]) {
    assert.match(workListBlock, new RegExp(escapeRegExp(field)), `Work Picker structuredContent must include ${field}`);
  }

  const workBriefBlock = extractToolBlock(server, "augnes_get_work_brief");
  assert.match(workBriefBlock, /annotations:\s*bridgeReadAnnotations/, "Work Brief must remain read-only annotated");
  assert.doesNotMatch(workBriefBlock, /annotations:\s*bridgeWriteAnnotations/, "Work Brief must not be write annotated");
  assert.match(workBriefBlock, /codexResult:\s*CodexResultImportInputSchema\.optional\(\)/, "Work Brief must accept codexResult");
  assert.match(workBriefBlock, /codexResultInput:\s*CodexResultImportInputSchema\.optional\(\)/, "Work Brief must accept codexResultInput");
  assert.match(workBriefBlock, /codex_result:\s*CodexResultImportInputSchema\.optional\(\)/, "Work Brief must accept codex_result");
  for (const field of [
    "work_contract_card",
    "core_codex_handoff_packet",
    "copyable_core_handoff_text",
    "full_codex_handoff_packet",
    "copyable_full_handoff_text",
    "codex_handoff_recommendation",
    "codex_handoff_decision",
    "codex_result_review_packet_preview",
    "final_handoff_codex_result_review_packet",
    "codex_pr_review_packet_preview",
    "codex_result_import_input_shape",
    "codex_result_import_review_surface",
    "work_event_spine_timeline",
    "coordination_event_timeline",
    "event_spine_timeline",
    "event_spine_inspector",
    "result_review_closure_preview",
    "work_result_closure_preview",
    "next_action_closure",
    "followup_closure_preview",
  ]) {
    assert.match(workBriefBlock, new RegExp(escapeRegExp(field)), `Work Brief structuredContent must include ${field}`);
  }
}

function assertAg006Seed() {
  assert.match(demoSeed, /workId:\s*"AG-006"/, "demo seed must include AG-006");
  assert.match(demoSeed, /event:ag-006-spine-storage-handoff/, "demo seed must attach a coordination event to AG-006");
  assert.match(demoSeed, /coordination\.event_spine/, "AG-006 seed must include event-spine state context");
}

function assertAuthoritySourceBoundary() {
  const featureSource = [
    extractToolBlock(server, "augnes_list_work_items"),
    extractToolBlock(server, "augnes_get_work_brief"),
    extractFunction(server, "buildWorkPickerCard"),
    extractFunction(server, "buildWorkContractCard"),
    extractFunction(server, "buildCodexHandoffPreview"),
    extractFunction(server, "buildFinalCodexHandoffPacket"),
    extractFunction(server, "buildCoreCodexHandoffPacket"),
    extractFunction(server, "buildCodexHandoffDecision"),
    extractFunction(server, "buildCodexResultReviewPacketPreview"),
    extractFunction(server, "buildWorkEventSpineTimeline"),
    extractFunction(server, "buildResultReviewClosurePreview"),
    extractFunction(server, "buildCodexExecutionRequestPreview"),
    extractFunction(server, "buildFinalHandoffReadinessSummary"),
  ].join("\n\n");

  assertNoForbiddenProductAuthority(featureSource, "integrated work-loop server path");
}

function assertFixtureScenarios() {
  const vmContext = buildWidgetVmContext();

  const workPicker = normalizeInVm(vmContext, "normalizeWorkPickerCard(__payload)", workPickerPayload());
  assert.equal(workPicker.recommended_work_id, "AG-006", "Work Picker should recommend AG-006 in the integrated fixture");
  assert.ok(workPicker.work_candidates.some((candidate) => candidate.work_id === "AG-006"), "Work Picker should include AG-006 as a candidate");

  const noResultPayload = integratedPayload(reviewPacket({ scenario: "no_result" }));
  assertScenario(noResultPayload, {
    label: "no result input",
    reviewStatus: "needs_result_input",
    resultSource: "not_provided",
    closureRecommendation: "needs_result_input",
  });
  const noResultPacket = normalizeReviewPacket(vmContext, noResultPayload);
  assert.deepEqual(noResultPacket.reported_changed_files, [], "no-result review must not invent changed files");
  assert.deepEqual(noResultPacket.reported_verification_results, [], "no-result review must not invent verification results");
  assert.equal(noResultPacket.pr_reference.url, "", "no-result review must not invent PR URLs");
  assert.equal(noResultPacket.pr_reference.fetched, false, "App/MCP result review must not fetch PR data");

  const partialPayload = integratedPayload(reviewPacket({ scenario: "partial" }));
  assertScenario(partialPayload, {
    label: "partially verified completed result",
    reviewStatus: "preview_ready",
    resultSource: "structured_payload",
    closureRecommendation: "additional_verification_needed",
  });
  const partialPacket = normalizeReviewPacket(vmContext, partialPayload);
  assert.equal(partialPacket.reported_result_status, "completed", "partial scenario must preserve Codex-reported completed status");
  assert.notEqual(partialPacket.suggested_result_status, "completed", "partial scenario must not treat missing AG-006 curl checks as complete");
  assert.match(
    partialPacket.verification_alignment.missing.join("\n"),
    /curl -sS 'http:\/\/localhost:3000\/api\/work\/AG-006\/brief\?scope=project:augnes'/,
    "partial scenario must name missing AG-006 work-brief curl verification",
  );

  const alignedPayload = integratedPayload(reviewPacket({ scenario: "aligned" }));
  assertScenario(alignedPayload, {
    label: "aligned completed result",
    reviewStatus: "preview_ready",
    resultSource: "structured_payload",
    closureRecommendation: "close_ready",
  });
  const alignedPacket = normalizeReviewPacket(vmContext, alignedPayload);
  assert.equal(alignedPacket.review_recommendation, "ready_for_human_review", "aligned result may be ready for human review");
  assert.equal(alignedPacket.suggested_result_status, "completed", "aligned result may retain completed suggested status");
  assert.equal(alignedPacket.suggested_next_action, "close_done", "aligned result may suggest close_done");

  const blockedPayload = integratedPayload(reviewPacket({ scenario: "blocked" }));
  assertScenario(blockedPayload, {
    label: "blocked result",
    reviewStatus: "preview_ready",
    resultSource: "structured_payload",
    closureRecommendation: "result_incomplete_or_blocked",
  });
  const blockedPacket = normalizeReviewPacket(vmContext, blockedPayload);
  assert.equal(blockedPacket.suggested_result_status, "blocked", "blocked scenario must preserve blocked result status");
  assert.equal(blockedPacket.suggested_next_action, "result_incomplete_blocked", "blocked scenario must suggest incomplete/blocked guidance");

  const timeline = normalizeTimeline(vmContext, alignedPayload);
  assert.equal(timeline.event_count, 1, "AG-006 seeded fixture should have at least one coordination event");
  assert.equal(timeline.sort_order, "created_at_ascending", "event timeline sort order must be explicit");
  assert.equal(timeline.events[0]?.event_id, "event:ag-006-spine-storage-handoff", "event timeline should include the seeded AG-006 event");

  const emptyTimeline = normalizeTimeline(vmContext, {
    brief: { scope: "project:augnes", work_id: "AG-EMPTY", coordination_events: [] },
  });
  assert.equal(emptyTimeline.status, "empty", "empty event timeline must be explicit");
  assert.equal(emptyTimeline.event_count, 0, "empty event timeline must not invent events");
  assert.equal(emptyTimeline.events.length, 0, "empty event timeline must not invent event IDs");
  assert.match(emptyTimeline.empty_state, /No coordination events are attached/, "empty event timeline must expose empty state text");

  for (const payload of [noResultPayload, partialPayload, alignedPayload, blockedPayload]) {
    assertAliasIdentity(payload, "coordination_event_timeline", payload.work_event_spine_timeline);
    assertAliasIdentity(payload, "event_spine_timeline", payload.work_event_spine_timeline);
    assertAliasIdentity(payload, "work_result_closure_preview", payload.result_review_closure_preview);
    assertAliasIdentity(payload, "next_action_closure", payload.result_review_closure_preview);
    assertAliasIdentity(payload, "followup_closure_preview", payload.result_review_closure_preview);
    assertAliasIdentity(payload, "final_handoff_codex_result_review_packet", payload.codex_result_review_packet_preview);
    assertAliasIdentity(payload, "codex_pr_review_packet_preview", payload.codex_result_review_packet_preview);
    assert.equal(payload.codex_handoff_decision.recommended_for_planning, "core_handoff", "Core handoff planning recommendation must be explicit");
    assert.equal(payload.codex_handoff_decision.recommended_for_implementation, "core_handoff", "Core / Full implementation recommendation must be explicit");
    assert.ok(payload.copyable_core_handoff_text, "copyable Core handoff text must exist");
    assert.ok(payload.copyable_full_handoff_text, "copyable Full handoff text must exist");
    assertNoCreatedFollowUpRefs(payload.result_review_closure_preview.follow_up_seed);
    for (const boundary of payload.result_review_closure_preview.boundary_text) {
      assert.doesNotMatch(boundary, /\bcreated\b|\brecorded\b|\bclosed\b/i, "closure boundary text must stay preview/non-write oriented");
    }
  }
}

function assertScenario(payload, expected) {
  const vmContext = buildWidgetVmContext();
  const packet = normalizeReviewPacket(vmContext, payload);
  const closure = normalizeClosure(vmContext, payload);
  payload.result_review_closure_preview = closure;
  payload.work_result_closure_preview = closure;
  payload.next_action_closure = closure;
  payload.followup_closure_preview = closure;

  assert.equal(packet.status, expected.reviewStatus, `${expected.label}: result review status`);
  assert.equal(packet.result_source, expected.resultSource, `${expected.label}: result source`);
  assert.equal(closure.closure_recommendation, expected.closureRecommendation, `${expected.label}: closure recommendation`);
  assert.equal(closure.status, expected.closureRecommendation, `${expected.label}: closure status`);
  assert.match(closure.follow_up_seed, /Preview-only follow-up seed for AG-006/, `${expected.label}: follow-up seed must be preview text`);
}

function normalizeReviewPacket(context, payload) {
  return normalizeInVm(
    context,
    "normalizeCodexResultReviewPacket(__payload.codex_result_review_packet_preview, __payload.final_codex_handoff_packet)",
    payload,
  );
}

function normalizeClosure(context, payload) {
  return normalizeInVm(
    context,
    "normalizeResultReviewClosurePreview(__payload.result_review_closure_preview, __payload)",
    payload,
  );
}

function normalizeTimeline(context, payload) {
  return normalizeInVm(context, "normalizeWorkEventSpineTimeline(__payload.work_event_spine_timeline, __payload)", payload);
}

function normalizeInVm(context, expression, payload) {
  context.__payload = payload;
  return vm.runInContext(expression, context);
}

function buildWidgetVmContext() {
  const source = [
    extractFunction(widget, "nonEmptyText"),
    extractFunction(widget, "safeArray"),
    extractFunction(widget, "safeRecord"),
    extractFunction(widget, "safeRecordArray"),
    extractFunction(widget, "firstRecord"),
    extractFunction(widget, "isCompletedWorkStatus"),
    extractFunction(widget, "numberOrZero"),
    extractFunction(widget, "countArrayLike"),
    extractFunction(widget, "normalizeWorkPickerCandidate"),
    extractFunction(widget, "normalizeWorkPickerCard"),
    extractFunction(widget, "eventStringArray"),
    extractFunction(widget, "sortEventTimestamp"),
    extractFunction(widget, "normalizeCoordinationTimelineEvent"),
    extractFunction(widget, "normalizeWorkEventSpineTimeline"),
    extractFunction(widget, "prBodyChecklistRequiredSections"),
    extractFunction(widget, "codexResultReviewRequiredInputs"),
    extractFunction(widget, "codexResultReviewMissingInputs"),
    extractFunction(widget, "codexResultReviewOptionalInputs"),
    extractFunction(widget, "codexResultReviewBoundaryText"),
    extractFunction(widget, "codexResultReviewWarnings"),
    extractFunction(widget, "makeAlignment"),
    extractFunction(widget, "normalizeCodexResultReviewPacket"),
    extractFunction(widget, "resultReviewClosureBoundaryText"),
    extractFunction(widget, "uniqueTextArray"),
    extractFunction(widget, "alignmentNeedsAttention"),
    extractFunction(widget, "hasResultContextMismatch"),
    extractFunction(widget, "deriveClosureRecommendation"),
    extractFunction(widget, "deriveVerificationStillNeeded"),
    extractFunction(widget, "deriveMissingBeforeClose"),
    extractFunction(widget, "closureSummaryForRecommendation"),
    extractFunction(widget, "closureHumanDecisionItems"),
    extractFunction(widget, "closureFollowUpSeed"),
    extractFunction(widget, "normalizeResultReviewClosurePreview"),
  ].join("\n\n");
  const context = { Date, Number, Array, String, Set, RegExp };
  vm.createContext(context);
  vm.runInContext(source, context);
  return context;
}

function workPickerPayload() {
  return {
    panel: "work_picker_card",
    scope: "project:augnes",
    recommended_work_id: "AG-006",
    work_picker_card: {
      card_type: "work_picker_card",
      title: "Choose a work item",
      scope: "project:augnes",
      candidate_count: 1,
      recommended_work_id: "AG-006",
      selection_reason: "First active work item for this scope.",
      next_action_hint: "Open the recommended work with augnes_get_work_brief using workId: AG-006.",
      handoff_tool_hint: {
        tool: "augnes_list_work_items",
        next_tool: "augnes_get_work_brief",
      },
      work_candidates: [
        {
          work_id: "AG-006",
          title: "Coordination event spine schema and storage",
          status: "in_progress",
          priority: "now",
          summary: "Add the Phase 1 event spine schema, storage helpers, and read-only API without expanding write authority.",
          next_step: "Implement PR 1.1 and verify the append-only coordination event read path.",
          expected_files_count: 0,
          expected_checks_count: 2,
          linked_docs_count: 1,
          is_recommended: true,
        },
      ],
      boundaries: ["Work Picker is read-only.", "No Codex execution.", "No state mutation."],
    },
  };
}

function integratedPayload(packet) {
  const timeline = timelineFixture();
  const corePacket = {
    packet_type: "core_codex_handoff_packet",
    schema: "augnes.core_codex_handoff_packet.v0_1",
    title: "Core Codex Handoff Packet",
    core_handoff_usage: "implementation_ready",
    implementation_anchors: ["lib/coordination-events.ts", "app/api/work/[work_id]/brief/route.ts"],
    implementation_anchor_summary: "Implementation file/schema anchors are attached in Core; confirm them with codex:read-brief before editing.",
    full_context_required_before_implementation: false,
    work_scope: "project:augnes",
    work_id: "AG-006",
    work_title: "Coordination event spine schema and storage",
    work_status: "in_progress",
    current_or_next_step: "Verify the preview-only ChatGPT-Codex work loop snapshot.",
    expected_files: EXPECTED_FILES,
    expected_checks: EXPECTED_CHECKS,
    related_state_keys: ["coordination.event_spine"],
    copyable_handoff_text: "Core Codex Handoff Packet for AG-006. Preview/copy only; does not execute Codex.",
  };
  const handoffDecision = {
    decision_type: "codex_handoff_recommendation",
    status: "ready",
    core_handoff_usage: "implementation_ready",
    implementation_anchor_count: corePacket.implementation_anchors.length,
    recommended_for_planning: "core_handoff",
    recommended_for_implementation: "core_handoff",
    recommendation_reason: "Core includes implementation anchors. Confirm anchors before editing.",
    user_confirmation_items: [
      "I know whether I'm asking Codex for planning or implementation.",
      "I checked whether Full Context is required.",
      "I checked expected checks.",
      "I will paste the selected packet into a separate Codex session.",
    ],
    blocking_reason: "",
    boundary_text: [
      "Codex handoff recommendation is read-only guidance for choosing copied packet text.",
      "The recommendation panel does not run Codex.",
      "The recommendation panel does not create branches or PRs.",
      "The recommendation panel does not record proof or evidence.",
      "The recommendation panel does not mutate Augnes state.",
    ],
  };
  const fullPacket = {
    packet_type: "final_codex_handoff_packet",
    schema: "augnes.final_codex_handoff_packet.v0_1",
    title: "Final Codex Handoff Packet",
    work_scope: "project:augnes",
    work_id: "AG-006",
    work_title: "Coordination event spine schema and storage",
    work_status: "in_progress",
    current_or_next_step: "Verify the preview-only ChatGPT-Codex work loop snapshot.",
    expected_files: EXPECTED_FILES,
    expected_checks: EXPECTED_CHECKS,
    related_state_keys: ["coordination.event_spine"],
    constellation_context_status: "explicitly_absent",
    memory_reuse_attachment_proposal: { status: "no_match" },
    copyable_handoff_text: "Full Codex handoff packet for AG-006. Preview/copy only; does not execute Codex.",
    codex_result_review_packet_preview: packet,
    final_handoff_codex_result_review_packet: packet,
    codex_pr_review_packet_preview: packet,
  };

  return {
    profile: "public",
    panel: "work_contract_card",
    scope: "project:augnes",
    brief: {
      scope: "project:augnes",
      work_id: "AG-006",
      coordination_events: timeline.events,
    },
    work_contract_card: {
      card_type: "work_contract_card",
      scope: "project:augnes",
      work_id: "AG-006",
      work_title: "Coordination event spine schema and storage",
      work_status: "in_progress",
      expected_files: EXPECTED_FILES,
      expected_checks: EXPECTED_CHECKS,
    },
    work_event_spine_timeline: timeline,
    coordination_event_timeline: timeline,
    event_spine_timeline: timeline,
    event_spine_inspector: timeline.selected_event,
    core_codex_handoff_packet: corePacket,
    codex_core_handoff_packet: corePacket,
    copyable_core_handoff_text: corePacket.copyable_handoff_text,
    codex_handoff_decision: handoffDecision,
    codex_handoff_recommendation: handoffDecision,
    final_codex_handoff_packet: fullPacket,
    codex_final_handoff_packet: fullPacket,
    full_codex_handoff_packet: fullPacket,
    copyable_full_handoff_text: fullPacket.copyable_handoff_text,
    codex_result_review_packet_preview: packet,
    final_handoff_codex_result_review_packet: packet,
    codex_pr_review_packet_preview: packet,
    codex_result_import_input_shape: { codexResult: "optional user-provided result payload" },
    codex_result_import_review_surface: packet,
  };
}

function reviewPacket({ scenario }) {
  const base = {
    packet_type: "codex_result_review_packet_preview",
    status: "preview_ready",
    result_source: "structured_payload",
    reviewed_against_packet_id: "final_codex_handoff_packet:AG-006",
    work_id: "AG-006",
    input_shape: { codexResult: "optional user-provided result payload" },
    provided_result_input_fields: [
      "Codex final report text or structured result payload.",
      "Changed files.",
      "Verification commands and results.",
      "Skipped checks with concrete reasons.",
      "Authority boundary statement.",
      "Remaining caveats.",
    ],
    missing_result_input_fields: [],
    optional_result_input_fields: ["PR URL or PR number, user-provided only.", "Result status if Codex reported one."],
    result_review_summary: "Codex result import has aligned attached result input.",
    pr_reference: { url: "", number: "", source: "not_provided", fetched: false },
    reported_result_status: "completed",
    suggested_result_status: "completed",
    reported_authority_boundary_statement:
      "Preview-only result review; no writes, no execution, no external calls, and no lifecycle mutation.",
    expected_files: EXPECTED_FILES,
    reported_changed_files: EXPECTED_FILES,
    expected_checks: EXPECTED_CHECKS,
    reported_verification_commands: EXPECTED_CHECKS,
    reported_verification_results: EXPECTED_CHECKS.map((check) => `${check} passed`),
    skipped_checks: ["No skipped checks reported."],
    remaining_caveats: [],
    missing_required_closeout_sections: [],
    required_result_input_fields: [
      "work_id.",
      "scope.",
      "Codex final report text or structured result payload.",
      "Changed files.",
      "Verification commands and results.",
    ],
    authority_boundary_issues: [],
    memory_reuse_alignment: alignment("aligned", ["Memory Reuse attachment status"], ["Memory Reuse attachment status"], []),
    constellation_context_alignment: alignment("aligned", ["Project Constellation context status"], ["Project Constellation context status"], []),
    preflight_alignment: alignment("aligned", ["Final handoff preflight status"], ["Final handoff preflight status"], []),
    checklist_alignment: alignment("aligned", ["PR body checklist", "closeout skeleton"], ["PR body checklist", "closeout skeleton"], []),
    file_alignment: alignment("aligned", EXPECTED_FILES, EXPECTED_FILES, []),
    verification_alignment: alignment("aligned", EXPECTED_CHECKS, EXPECTED_CHECKS, []),
    skipped_check_alignment: alignment(
      "aligned",
      ["Skipped checks must be reported with concrete reasons; do not claim skipped checks passed."],
      ["No skipped checks reported."],
      [],
    ),
    review_questions: ["Should the human close or keep this open for review?"],
    review_recommendation: "ready_for_human_review",
    suggested_next_action: "close_done",
    warnings: ["Review recommendations are advisory only and do not submit or post anything."],
    boundary_text: [
      "Codex result review packet is preview-only review preparation.",
      "No GitHub PR data is fetched by the App/MCP server.",
      "No GitHub comments, review submissions, approvals, change requests, labels, status updates, merges, proof/evidence records, Codex execution, provider calls, or Augnes state writes are performed by this surface.",
    ],
  };

  if (scenario === "no_result") {
    return {
      ...base,
      status: "needs_result_input",
      result_source: "not_provided",
      provided_result_input_fields: [],
      missing_result_input_fields: [
        "Codex final report text or structured result payload.",
        "Changed files.",
        "Verification commands and results.",
      ],
      result_review_summary: "Codex result import is waiting for user-provided Codex output; no result data was invented.",
      reported_result_status: "",
      suggested_result_status: "not_provided",
      reported_authority_boundary_statement: "",
      reported_changed_files: [],
      reported_verification_commands: [],
      reported_verification_results: [],
      skipped_checks: [],
      remaining_caveats: [],
      missing_required_closeout_sections: ["Summary", "Files changed", "Verification"],
      file_alignment: alignment("not_provided", EXPECTED_FILES, [], EXPECTED_FILES),
      verification_alignment: alignment("not_provided", EXPECTED_CHECKS, [], EXPECTED_CHECKS),
      skipped_check_alignment: alignment(
        "not_provided",
        ["Skipped checks must be reported with concrete reasons; do not claim skipped checks passed."],
        [],
        ["Skipped checks must be reported with concrete reasons; do not claim skipped checks passed."],
      ),
      review_recommendation: "needs_result_input",
      suggested_next_action: "result_incomplete_blocked",
      warnings: [
        "No Codex result payload is attached; no changed files, verification results, PR URLs, proof IDs, evidence IDs, screenshots, findings, or host observations were invented.",
      ],
    };
  }

  if (scenario === "partial") {
    const reportedChecks = ["node scripts/smoke-chatgpt-codex-work-loop-v0-1.mjs"];
    const missingChecks = EXPECTED_CHECKS.filter((check) => !reportedChecks.includes(check));
    return {
      ...base,
      result_review_summary: "Codex result import has partial verification coverage.",
      suggested_result_status: "partial",
      reported_verification_commands: reportedChecks,
      reported_verification_results: reportedChecks.map((check) => `${check} passed`),
      verification_alignment: alignment("partial", EXPECTED_CHECKS, reportedChecks, missingChecks),
      review_recommendation: "needs_revision",
      suggested_next_action: "additional_verification_needed",
      review_questions: ["Do reported verification results cover every expected AG-006 curl check?"],
      warnings: ["Expected AG-006 curl checks were not covered by the reported result."],
    };
  }

  if (scenario === "blocked") {
    return {
      ...base,
      reported_result_status: "blocked",
      suggested_result_status: "blocked",
      review_recommendation: "needs_revision",
      suggested_next_action: "result_incomplete_blocked",
      remaining_caveats: ["Runtime dogfood was blocked before live host observation."],
      warnings: ["Result was reported as blocked; no close-ready guidance is allowed."],
    };
  }

  return base;
}

function timelineFixture() {
  return {
    timeline_type: "work_event_spine_timeline",
    status: "attached",
    scope: "project:augnes",
    work_id: "AG-006",
    event_count: 1,
    sort_order: "created_at_ascending",
    events: [
      {
        event_id: "event:ag-006-spine-storage-handoff",
        event_type: "handoff_ready",
        scope: "project:augnes",
        work_id: "AG-006",
        actor: "user",
        target: "codex",
        source_surface: "local_runtime",
        authority_level: "handoff_guidance",
        state_keys: ["coordination.event_spine"],
        causal_parent_id: "",
        payload_ref: "docs/AUGNES_COORDINATION_SPINE_ROADMAP.md#pr-11-event-spine-schema-and-storage",
        result_status: "",
        created_at: "2026-05-08T00:00:00.000Z",
        payload_summary: "Seeded read-path coordination event.",
        summary: "Seeded read-path coordination event.",
        missing_fields: [],
      },
    ],
    selected_event: null,
    first_event_summary: "Seeded read-path coordination event.",
    empty_state: "No coordination events are attached to this work item yet.",
    warnings: [],
    boundary_text: [
      "Work event spine timeline is read-only and derived from attached work brief coordination_events.",
      "No event creation.",
      "No event mutation.",
      "No proof/evidence write.",
      "No state commit/reject.",
      "No Codex execution.",
      "No GitHub calls.",
      "No provider/OpenAI calls.",
      "No publish/merge/retry/replay/deploy authority.",
    ],
  };
}

function alignment(status, expected, reported, missing) {
  return {
    status,
    summary: status === "aligned" ? "Aligned." : "Needs review.",
    expected,
    reported,
    missing,
  };
}

function assertAliasIdentity(payload, alias, target) {
  assert.deepEqual(payload[alias], target, `${alias} must point to the same structured preview object`);
}

function assertNoCreatedFollowUpRefs(seed) {
  assert.match(seed, /Preview-only follow-up seed/, "follow-up seed must be preview-only text");
  assert.doesNotMatch(seed, /created work item|created handoff|created event|proof:|evidence:|github\.com\/.+\/pull\//i, "follow-up seed must not invent created refs");
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
  const asyncMarker = `async function ${name}(`;
  const marker = `function ${name}(`;
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

function assertNoForbiddenProductAuthority(source, label) {
  const forbiddenPatterns = [
    /\bchild_process\b/,
    /\bspawn\s*\(/,
    /\bexecFile\s*\(/,
    /\bexec\s*\(/,
    /\bapi\.github\.com\b/,
    /\bapi\.openai\.com\b/,
    /\bGITHUB_TOKEN\b/,
    /\bOPENAI_API_KEY\b/,
    /\bcreatePullRequest\b/i,
    /\bcreateBranch\b/i,
    /\bsubmitReview\b/i,
    /\bappendCoordinationEvent\b/,
    /\brecord-proof\b/,
    /\brecord-evidence\b/,
    /\brecordProof\b/,
    /\brecordEvidence\b/,
    /\bcommitStateUpdate\b/,
    /\bfetch\s*\(/,
    /\bXMLHttpRequest\b/,
    /\bWebSocket\b/,
    /\bEventSource\b/,
    /\bprovider\b.{0,20}\(/i,
    /\bopenai\b.{0,20}\(/i,
    /\bgithub\b.{0,20}\(/i,
    /\bmergePullRequest\b/i,
    /\bpublish\b.{0,20}\(/i,
    /\bretry\b.{0,20}\(/i,
    /\breplay\b.{0,20}\(/i,
    /\bdeploy\b.{0,20}\(/i,
  ];
  for (const pattern of forbiddenPatterns) {
    assert.doesNotMatch(source, pattern, `${label} must not contain forbidden product authority pattern ${pattern}`);
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
