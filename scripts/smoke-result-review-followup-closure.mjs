import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import vm from "node:vm";

const serverPath = "apps/augnes_apps/src/server.ts";
const widgetPath = "apps/augnes_apps/public/console-widget.html";
const runbookPath = "apps/augnes_apps/docs/12_WORK_CONTRACT_CARD_RUNBOOK.md";

for (const filePath of [serverPath, widgetPath, runbookPath]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const server = readFileSync(serverPath, "utf8");
const widget = readFileSync(widgetPath, "utf8");
const runbook = readFileSync(runbookPath, "utf8");

const workBriefBlock = extractToolBlock(server, "augnes_get_work_brief");
assert.match(server, /type ResultReviewClosurePreview/, "server must define a model-readable closure preview type");
assert.match(server, /function buildResultReviewClosurePreview\(/, "server must define a pure result-review closure helper");
assert.match(workBriefBlock, /result_review_closure_preview:\s*resultReviewClosurePreview/, "work brief must expose result_review_closure_preview");
assert.match(workBriefBlock, /work_result_closure_preview:\s*resultReviewClosurePreview/, "work brief must expose work_result_closure_preview alias");
assert.match(workBriefBlock, /next_action_closure:\s*resultReviewClosurePreview/, "work brief must expose next_action_closure alias");
assert.match(workBriefBlock, /followup_closure_preview:\s*resultReviewClosurePreview/, "work brief must expose followup_closure_preview alias");

for (const category of [
  "needs_result_input",
  "close_ready",
  "additional_verification_needed",
  "follow_up_fix_needed",
  "new_handoff_needed",
  "result_incomplete_or_blocked",
  "human_decision_needed",
]) {
  assert.match(server, new RegExp(escapeRegExp(category)), `server must support closure category ${category}`);
  assert.match(widget, new RegExp(escapeRegExp(category)), `widget must support closure category ${category}`);
}

for (const label of [
  "Result closure",
  "Next action",
  "Closure recommendation",
  "Why this recommendation",
  "Follow-up seed",
  "Missing before close",
  "Verification still needed",
  "Human decision needed",
  "What this screen does not do",
]) {
  assert.match(widget, new RegExp(escapeRegExp(label)), `widget must render label: ${label}`);
}

for (const boundary of [
  "No work close.",
  "No work status update.",
  "No event creation.",
  "No event mutation.",
  "No proof/evidence write.",
  "No state commit/reject.",
  "No Codex execution.",
  "No GitHub calls.",
  "No PR review submission.",
  "No branch/PR creation.",
  "No provider/OpenAI calls.",
  "No publish/merge/retry/replay/deploy authority.",
]) {
  assert.match(server, new RegExp(escapeRegExp(boundary)), `server boundary must include: ${boundary}`);
  assert.match(widget, new RegExp(escapeRegExp(boundary)), `widget boundary must include: ${boundary}`);
}

assert.match(runbook, /Result Review Closure Preview/, "runbook must document result review closure preview");
assert.match(runbook, /finalCodexHandoffPacket\.codex_result_review_packet_preview/, "runbook must document result review packet data source");
assert.match(runbook, /work_event_spine_timeline/, "runbook must document event timeline data source");
assert.match(runbook, /follow-up\s+seed is preview-only text/i, "runbook must document preview-only follow-up seed");
assert.match(runbook, /must not invent changed files, verification results,\s+PR URLs, proof IDs, evidence IDs, event IDs, close status, or human approval/i, "runbook must document no-invention behavior");
assert.match(runbook, /does not close work, update work status, create or mutate coordination events/i, "runbook must document no closure writes");

const serverFeatureSource = [
  extractFunction(server, "resultReviewAlignmentNeedsAttention"),
  extractFunction(server, "resultReviewHasContextMismatch"),
  extractFunction(server, "resultReviewVerificationStillNeeded"),
  extractFunction(server, "resultReviewMissingBeforeClose"),
  extractFunction(server, "resultReviewClosureRecommendation"),
  extractFunction(server, "resultReviewClosureReasons"),
  extractFunction(server, "resultReviewHumanDecisionItems"),
  extractFunction(server, "resultReviewClosureSummary"),
  extractFunction(server, "resultReviewClosureFollowUpSeed"),
  extractFunction(server, "buildResultReviewClosurePreview"),
  extractFunction(server, "describeResultReviewClosurePreview"),
  workBriefBlock,
].join("\n\n");
const widgetFeatureSource = [
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
  extractFunction(widget, "formatClosureReasonText"),
  extractFunction(widget, "normalizeResultReviewClosurePreview"),
  extractFunction(widget, "renderResultReviewClosurePreview"),
].join("\n\n");

assertNoForbiddenFeatureAuthority(serverFeatureSource, "server closure preview feature");
assertNoForbiddenFeatureAuthority(widgetFeatureSource, "widget closure preview feature");

const renderSource = [
  extractFunction(widget, "el"),
  extractFunction(widget, "tag"),
  extractFunction(widget, "createMetricGrid"),
  extractFunction(widget, "createSection"),
  extractFunction(widget, "createTextList"),
  extractFunction(widget, "nonEmptyText"),
  extractFunction(widget, "safeArray"),
  extractFunction(widget, "safeCount"),
  extractFunction(widget, "formatUiStatus"),
  extractFunction(widget, "safeRecord"),
  extractFunction(widget, "safeRecordArray"),
  extractFunction(widget, "firstRecord"),
  extractFunction(widget, "makeAlignment"),
  extractFunction(widget, "prBodyChecklistRequiredSections"),
  extractFunction(widget, "codexResultReviewRequiredInputs"),
  extractFunction(widget, "codexResultReviewMissingInputs"),
  extractFunction(widget, "codexResultReviewOptionalInputs"),
  extractFunction(widget, "codexResultReviewBoundaryText"),
  extractFunction(widget, "codexResultReviewWarnings"),
  extractFunction(widget, "normalizeCodexResultReviewPacket"),
  extractFunction(widget, "eventStringArray"),
  extractFunction(widget, "sortEventTimestamp"),
  extractFunction(widget, "normalizeCoordinationTimelineEvent"),
  extractFunction(widget, "normalizeWorkEventSpineTimeline"),
  widgetFeatureSource,
].join("\n\n");

const noResult = normalizeClosure(renderSource, {
  codex_result_review_packet_preview: reviewPacket({
    status: "needs_result_input",
    result_source: "not_provided",
    review_recommendation: "needs_result_input",
    suggested_result_status: "not_provided",
    suggested_next_action: "result_incomplete_blocked",
    missing_result_input_fields: [
      "Codex final report text or structured result payload.",
      "Changed files.",
      "Verification commands and results.",
    ],
    reported_changed_files: [],
    reported_verification_commands: [],
    reported_verification_results: [],
    file_alignment: alignment("not_provided", ["apps/augnes_apps/src/server.ts"], [], ["apps/augnes_apps/src/server.ts"]),
    verification_alignment: alignment("not_provided", ["npm run typecheck"], [], ["npm run typecheck"]),
  }),
});
assert.equal(noResult.closure_recommendation, "needs_result_input", "no-result closure must need result input");
assert.equal(noResult.status, "needs_result_input", "no-result closure status must need result input");
assert.deepEqual(noResult.result_source, "not_provided", "no-result closure must preserve result source");
assert.deepEqual(noResult.reported_changed_files, undefined, "closure object must not invent changed files");
assert.doesNotMatch(noResult.follow_up_seed, /https:\/\/github\.com|proof:|evidence:|event:/i, "no-result seed must not invent refs");

const missingVerification = normalizeClosure(renderSource, {
  codex_result_review_packet_preview: reviewPacket({
    suggested_result_status: "completed",
    suggested_next_action: "close_done",
    reported_verification_commands: [],
    reported_verification_results: [],
    verification_alignment: alignment("missing", ["curl http://localhost:3000/api/work/AG-006/brief"], [], ["curl http://localhost:3000/api/work/AG-006/brief"]),
  }),
});
assert.equal(missingVerification.closure_recommendation, "additional_verification_needed", "completed result with missing expected verification must need verification");
assert.notEqual(missingVerification.closure_recommendation, "close_ready", "missing verification must not be close-ready");
assert.match(missingVerification.verification_still_needed.join("\n"), /curl http:\/\/localhost:3000\/api\/work\/AG-006\/brief/, "missing verification must be named");

const closeReady = normalizeClosure(renderSource, {
  codex_result_review_packet_preview: reviewPacket(),
  work_event_spine_timeline: timelineFixture(),
});
assert.equal(closeReady.closure_recommendation, "close_ready", "aligned completed review may be close-ready");
assert.match(closeReady.follow_up_seed, /does not close work, merge PRs, approve, commit state, or record proof/i, "close-ready seed must preserve authority boundary");

const failed = normalizeClosure(renderSource, {
  codex_result_review_packet_preview: reviewPacket({
    suggested_result_status: "failed",
    suggested_next_action: "follow_up_fix_needed",
  }),
});
assert.equal(failed.closure_recommendation, "follow_up_fix_needed", "failed result must map to fix follow-up");

const blocked = normalizeClosure(renderSource, {
  codex_result_review_packet_preview: reviewPacket({
    suggested_result_status: "blocked",
    suggested_next_action: "result_incomplete_blocked",
  }),
});
assert.equal(blocked.closure_recommendation, "result_incomplete_or_blocked", "blocked result must map to incomplete/blocked");

const mismatched = normalizeClosure(renderSource, {
  codex_result_review_packet_preview: reviewPacket({
    suggested_next_action: "new_handoff_needed",
    warnings: ["Result work_id AG-999 does not match the opened work item AG-006."],
  }),
});
assert.equal(mismatched.closure_recommendation, "new_handoff_needed", "mismatched result must map to new handoff");

const ambiguous = normalizeClosure(renderSource, {
  codex_result_review_packet_preview: reviewPacket({
    suggested_result_status: "needs_human_review",
    suggested_next_action: "human_decision_needed",
  }),
});
assert.equal(ambiguous.closure_recommendation, "human_decision_needed", "ambiguous result must map to human decision");

const rendered = renderClosure(renderSource, {
  codex_result_review_packet_preview: reviewPacket({
    suggested_result_status: "completed",
    suggested_next_action: "close_done",
  }),
  work_event_spine_timeline: timelineFixture(),
});
for (const expected of [
  "Next action",
  "Closure recommendation",
  "Why this recommendation",
  "Follow-up seed",
  "Missing before close",
  "Verification still needed",
  "Human decision needed",
  "What this screen does not do",
  "Close-ready",
  "Preview-only follow-up seed for AG-006",
  "No work close.",
  "No event creation.",
  "No proof/evidence write.",
  "No PR review submission.",
  "No branch/PR creation.",
]) {
  assert.match(rendered.text, new RegExp(escapeRegExp(expected)), `rendered closure must include ${expected}`);
}

console.log(JSON.stringify({
  smoke: "result-review-followup-closure",
  server_structured_content_present: true,
  closure_aliases_present: true,
  no_result_needs_input_checked: true,
  aligned_close_ready_checked: true,
  missing_verification_checked: true,
  failed_blocked_mismatch_ambiguous_checked: true,
  follow_up_seed_preview_only_checked: true,
  widget_labels_checked: true,
  read_only_boundary_checked: true,
  forbidden_feature_authority_absent: true,
}, null, 2));

function alignment(status, expected, reported = expected, missing = []) {
  return {
    status,
    summary: status === "aligned" ? "Aligned." : "Needs review.",
    expected,
    reported,
    missing,
  };
}

function reviewPacket(overrides = {}) {
  const expectedFiles = ["apps/augnes_apps/src/server.ts", "apps/augnes_apps/public/console-widget.html"];
  const expectedChecks = ["npm run typecheck", "node scripts/smoke-result-review-followup-closure.mjs"];
  return {
    packet_type: "codex_result_review_packet_preview",
    status: "preview_ready",
    result_source: "structured_payload",
    reviewed_against_packet_id: "final_codex_handoff_packet:AG-006",
    work_id: "AG-006",
    provided_result_input_fields: ["Codex final report text or structured result payload.", "Changed files.", "Verification commands and results."],
    missing_result_input_fields: [],
    result_review_summary: "Codex result import has aligned attached result input.",
    pr_reference: { url: "", number: "", source: "not_provided", fetched: false },
    reported_result_status: "completed",
    suggested_result_status: "completed",
    reported_authority_boundary_statement: "Preview-only result review; no writes or external calls.",
    expected_files: expectedFiles,
    reported_changed_files: expectedFiles,
    expected_checks: expectedChecks,
    reported_verification_commands: expectedChecks,
    reported_verification_results: expectedChecks.map((check) => `${check} passed`),
    skipped_checks: ["No skipped checks reported."],
    remaining_caveats: [],
    missing_required_closeout_sections: [],
    required_result_input_fields: ["work_id.", "scope.", "Codex final report text or structured result payload."],
    authority_boundary_issues: [],
    memory_reuse_alignment: alignment("aligned", ["Memory Reuse attachment status"]),
    constellation_context_alignment: alignment("aligned", ["Project Constellation context status"]),
    preflight_alignment: alignment("aligned", ["Final handoff preflight status"]),
    checklist_alignment: alignment("aligned", ["PR body checklist", "closeout skeleton"]),
    file_alignment: alignment("aligned", expectedFiles),
    verification_alignment: alignment("aligned", expectedChecks),
    skipped_check_alignment: alignment("aligned", ["Skipped checks must be reported with concrete reasons; do not claim skipped checks passed."], ["No skipped checks reported."], []),
    review_questions: ["Should the human close or keep this open for review?"],
    review_recommendation: "ready_for_human_review",
    suggested_next_action: "close_done",
    warnings: ["Review recommendations are advisory only and do not submit or post anything."],
    boundary_text: ["Codex result review packet is preview-only review preparation."],
    ...overrides,
  };
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
        event_id: "event:ag-006-seeded-read-path",
        event_type: "handoff_created",
        scope: "project:augnes",
        work_id: "AG-006",
        actor: "user",
        source_surface: "demo_seed",
        authority_level: "handoff_guidance",
        state_keys: ["coordination.event_spine"],
        created_at: "2026-05-08T00:01:00.000Z",
        summary: "Seeded read-path coordination event.",
      },
    ],
    selected_event: null,
    empty_state: "No coordination events are attached to this work item yet.",
    warnings: [],
    boundary_text: ["Work event spine timeline is read-only and derived from attached work brief coordination_events."],
  };
}

function normalizeClosure(source, payload) {
  const context = buildVmContext(payload);
  vm.runInContext(source, context);
  return vm.runInContext("normalizeResultReviewClosurePreview(__payload.result_review_closure_preview, __payload)", context);
}

function renderClosure(source, payload) {
  const context = buildVmContext(payload);
  vm.runInContext(source, context);
  const output = vm.runInContext("renderResultReviewClosurePreview(__payload.result_review_closure_preview, __payload)", context);
  return {
    tree: output,
    text: collectText(output).replace(/\s+/g, " ").trim(),
  };
}

function buildVmContext(payload) {
  class FakeNode {
    constructor(tag) {
      this.tag = tag;
      this.children = [];
      this.textContent = "";
      this.innerHTML = "";
      this.className = "";
      this.open = false;
    }

    append(...children) {
      for (const child of children) this.appendChild(child);
    }

    appendChild(child) {
      this.children.push(child);
      return child;
    }
  }

  const context = {
    document: {
      createElement(tag) {
        return new FakeNode(tag);
      },
    },
    Date,
    Number,
    Array,
    String,
    Set,
    RegExp,
  };
  vm.createContext(context);
  context.__payload = payload;
  return context;
}

function collectText(node) {
  if (!node || typeof node !== "object") return "";
  const ownText = [node.textContent, node.innerHTML].filter(Boolean).join(" ");
  const childText = Array.isArray(node.children) ? node.children.map(collectText).join(" ") : "";
  return `${ownText} ${childText}`;
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

function assertNoForbiddenFeatureAuthority(source, label) {
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
    assert.doesNotMatch(source, pattern, `${label} must not contain forbidden authority pattern ${pattern}`);
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
