import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const serverPath = "apps/augnes_apps/src/server.ts";
const configPath = "apps/augnes_apps/src/lib/config.ts";

for (const filePath of [serverPath, configPath]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const serverSource = readFileSync(serverPath, "utf8");
const configSource = readFileSync(configPath, "utf8");

assert.match(configSource, /AUGNES_APP_TOOL_SURFACE/, "config must expose the tool-surface env gate");
assert.match(configSource, /work_loop_readonly/, "config must accept the work_loop_readonly tool surface");
assert.match(serverSource, /enableLegacyPublicTools/, "server must gate legacy public tools for narrowed surfaces");
assert.match(serverSource, /enableBridgeTools/, "server must gate wider bridge tools for narrowed surfaces");
assert.match(serverSource, /toolSurface !== "work_loop_readonly"/, "server must recognize the work-loop readonly surface");

const child = spawnReadonlyProfileSnapshot();
assert.equal(child.status, 0, `readonly profile snapshot should run:\nSTDOUT:\n${child.stdout}\nSTDERR:\n${child.stderr}`);

const snapshot = JSON.parse(child.stdout);

assert.deepEqual(
  snapshot.toolNames,
  ["augnes_list_work_items", "augnes_get_work_brief"],
  "work_loop_readonly surface must register only the work-loop read tools"
);
assert.deepEqual(snapshot.workReadToolNames, ["augnes_list_work_items", "augnes_get_work_brief"]);

for (const omittedTool of [
  "search",
  "fetch",
  "open_casefile",
  "get_working_view",
  "explain_strategy",
  "get_boundary_packet",
  "get_continuity_report",
  "navigate_repo",
  "get_governance_audit",
  "augnes_observe",
  "augnes_record_action_result",
  "augnes_record_work_event",
  "augnes_generate_codex_handoff_draft",
  "augnes_review_codex_result_draft",
  "augnes_get_publication_summary",
  "augnes_get_publication_decision_card",
]) {
  assert.ok(!snapshot.toolNames.includes(omittedTool), `${omittedTool} must not register in work_loop_readonly`);
}

for (const [toolName, annotations] of Object.entries(snapshot.annotations)) {
  assert.deepEqual(
    annotations,
    {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: true,
    },
    `${toolName} must remain read-only, non-destructive, and bridge-readable`
  );
}

assert.equal(snapshot.workPicker.recommended_work_id, "AG-006", "Work Picker should recommend AG-006 in the readonly profile smoke");
assert.ok(snapshot.workPicker.work_candidates.includes("AG-006"), "Work Picker should include AG-006");
assert.equal(snapshot.workPicker.boundaries.read_only, true, "Work Picker boundaries must remain read-only");

assert.equal(snapshot.noResult.reviewStatus, "needs_result_input");
assert.equal(snapshot.noResult.closureRecommendation, "needs_result_input");
assert.deepEqual(snapshot.noResult.reportedChangedFiles, [], "no-result review must not invent changed files");
assert.deepEqual(snapshot.noResult.reportedVerificationResults, [], "no-result review must not invent verification results");
assert.equal(snapshot.noResult.prFetched, false, "no-result review must not fetch PR metadata");

assert.equal(snapshot.partial.reviewStatus, "preview_ready");
assert.equal(snapshot.partial.reportedResultStatus, "completed");
assert.equal(snapshot.partial.closureRecommendation, "additional_verification_needed");
assert.notEqual(snapshot.partial.suggestedResultStatus, "completed", "partial result must not be treated as fully complete");
assert.ok(snapshot.partial.missingVerification.length > 0, "partial result must expose missing verification coverage");

assert.equal(snapshot.aligned.reviewStatus, "preview_ready");
assert.equal(snapshot.aligned.reviewRecommendation, "ready_for_human_review");
assert.equal(snapshot.aligned.suggestedResultStatus, "completed");
assert.equal(snapshot.aligned.suggestedNextAction, "close_done");
assert.equal(snapshot.aligned.closureRecommendation, "close_ready");

assert.equal(snapshot.blocked.reviewStatus, "preview_ready");
assert.equal(snapshot.blocked.suggestedResultStatus, "blocked");
assert.equal(snapshot.blocked.closureRecommendation, "result_incomplete_or_blocked");

assert.equal(snapshot.eventTimeline.event_count, 1, "AG-006 smoke brief should include a seeded event");
assert.equal(snapshot.eventTimeline.sort_order, "created_at_ascending", "event timeline sort order should be explicit");
assert.equal(snapshot.eventTimeline.read_only, true, "event timeline must remain read-only");

for (const forbiddenPattern of [
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
  /\bmerge\b.{0,20}\(/i,
  /\brecord-proof\b/,
  /\brecord-evidence\b/,
  /\bcommitStateUpdate\b/,
]) {
  assert.doesNotMatch(serverSource, forbiddenPattern, `server source must not add forbidden authority: ${forbiddenPattern}`);
}

console.log(
  JSON.stringify(
    {
      smoke: "work-loop-readonly-developer-profile",
      narrowed_tool_surface_checked: true,
      registered_work_loop_tools_only: true,
      read_only_annotations_checked: true,
      omitted_write_labeled_tools_checked: true,
      no_result_review_checked: true,
      partial_result_review_checked: true,
      aligned_result_review_checked: true,
      blocked_result_review_checked: true,
      event_timeline_checked: true,
      forbidden_authority_absent: true,
    },
    null,
    2
  )
);

function spawnReadonlyProfileSnapshot() {
  const childEnv = { ...process.env };
  childEnv.AUGNES_APP_TOOL_SURFACE = "work_loop_readonly";
  childEnv.AUGNES_ENABLE_AGENT_BRIDGE = "true";

  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--input-type=module",
      "--eval",
      readonlyProfileSnapshotSource(),
    ],
    {
      cwd: "apps/augnes_apps",
      encoding: "utf8",
      env: childEnv,
      maxBuffer: 1024 * 1024 * 8,
    }
  );
}

function readonlyProfileSnapshotSource() {
  return String.raw`
    import assert from "node:assert/strict";
    import { MockAugnesCoreAdapter } from "./src/adapters/mock-core.ts";
    import { MockStateRuntimeBridgeAdapter } from "./scripts/mock-state-runtime.ts";
    import { AUGNES_WORK_READ_TOOL_NAMES, createMcpAppServer } from "./src/server.ts";

    const expectedChecks = [
      "curl -sS 'http://localhost:3000/api/work/AG-006/brief?scope=project:augnes'",
      "curl -sS 'http://localhost:3000/api/events?scope=project:augnes&work_id=AG-006'",
      "node scripts/smoke-chatgpt-codex-work-loop-v0-1.mjs",
    ];
    const expectedFiles = [
      "docs/AUGNES_CHATGPT_CODEX_WORK_LOOP_V0_1_SNAPSHOT.md",
      "scripts/smoke-chatgpt-codex-work-loop-v0-1.mjs",
    ];

    class Ag006StateRuntimeBridgeAdapter extends MockStateRuntimeBridgeAdapter {
      async listWorkItems(scope) {
        return [
          {
            work_id: "AG-006",
            scope,
            title: "ChatGPT-Codex work loop v0.1 dogfood snapshot",
            status: "in_progress",
            priority: "now",
            summary: "Dogfood the preview-only ChatGPT-Augnes-Codex work progression loop.",
            next_action: "Use the Work Brief to inspect handoff, result review, event spine, and closure guidance.",
            user_attention_required: false,
            related_state_keys: ["coordination.event_spine", "chatgpt_codex_work_loop"],
            links: {
              docs: ["docs/AUGNES_CHATGPT_CODEX_WORK_LOOP_V0_1_SNAPSHOT.md"],
            },
            created_at: "2026-06-16T00:00:00.000Z",
            updated_at: "2026-06-16T00:30:00.000Z",
          },
        ];
      }

      async getWorkBrief(scope, workId) {
        const brief = await super.getWorkBrief(scope, workId);
        const resolvedWorkId = workId.toUpperCase();
        return {
          ...brief,
          scope,
          work_id: resolvedWorkId,
          work: {
            ...brief.work,
            work_id: resolvedWorkId,
            scope,
            title: "ChatGPT-Codex work loop v0.1 dogfood snapshot",
            summary: "Dogfood the preview-only ChatGPT-Augnes-Codex work progression loop.",
            next_action: "Inspect the read-only work loop surfaces.",
            related_state_keys: ["coordination.event_spine", "chatgpt_codex_work_loop"],
          },
          next_action: "Inspect the read-only work loop surfaces.",
          related_state_keys: ["coordination.event_spine", "chatgpt_codex_work_loop"],
          recent_events: [
            {
              id: "event:ag-006-readonly-profile-smoke",
              event_id: "event:ag-006-readonly-profile-smoke",
              work_id: resolvedWorkId,
              scope,
              actor: "chatgpt",
              event_type: "handoff",
              summary: "Readonly profile smoke fixture event for AG-006.",
              result_status: null,
              result_kind: "handoff",
              related_action_id: null,
              related_pr: null,
              related_state_keys: ["coordination.event_spine"],
              created_at: "2026-06-16T00:05:00.000Z",
            },
          ],
          coordination_events: [
            {
              event_id: "event:ag-006-readonly-profile-smoke",
              event_type: "handoff",
              scope,
              work_id: resolvedWorkId,
              actor: "chatgpt",
              target: "codex",
              source_surface: "chatgpt_developer_mode",
              authority_level: "read_only_preview",
              state_keys: ["coordination.event_spine"],
              causal_parent_id: null,
              payload_ref: "docs/AUGNES_CHATGPT_CODEX_WORK_LOOP_V0_1_SNAPSHOT.md",
              result_status: null,
              created_at: "2026-06-16T00:05:00.000Z",
              payload_summary: "Readonly profile smoke fixture event for AG-006.",
            },
          ],
          related_proof: {
            ...brief.related_proof,
            docs: expectedFiles,
            prs: [],
            action_ids: [],
          },
          codex_handoff: {
            ...brief.codex_handoff,
            task_brief: "Verify the ChatGPT-Codex work loop v0.1 snapshot without adding write authority.",
            constraints: [
              "Preview/copy only.",
              "No Codex execution from App/MCP.",
              "No state mutation.",
            ],
            expected_files: expectedFiles,
            suggested_verification: expectedChecks,
            work_event_template: {
              work_id: resolvedWorkId,
              scope,
              actor: "codex",
              event_type: "verification",
              summary: "Summarize readonly profile smoke validation.",
            },
          },
        };
      }
    }

    const server = createMcpAppServer(
      new MockAugnesCoreAdapter(),
      new Ag006StateRuntimeBridgeAdapter(),
      { enableAgentBridge: true }
    );

    try {
      const tools = server._registeredTools;
      assert.ok(tools, "registered tools should be inspectable");
      const toolNames = Object.keys(tools);
      assert.deepEqual(toolNames, ["augnes_list_work_items", "augnes_get_work_brief"]);

      const listResult = await tools.augnes_list_work_items.handler({ scope: "project:augnes" });
      const noResult = await briefResult(tools, null);
      const partial = await briefResult(tools, partialCodexResult());
      const aligned = await briefResult(tools, alignedCodexResult());
      const blocked = await briefResult(tools, blockedCodexResult());

      console.log(JSON.stringify({
        toolNames,
        workReadToolNames: [...AUGNES_WORK_READ_TOOL_NAMES],
        annotations: {
          augnes_list_work_items: tools.augnes_list_work_items.annotations,
          augnes_get_work_brief: tools.augnes_get_work_brief.annotations,
        },
        workPicker: {
          recommended_work_id: listResult.structuredContent.recommended_work_id,
          work_candidates: listResult.structuredContent.work_candidates.map((candidate) => candidate.work_id),
          boundaries: listResult.structuredContent.boundaries,
        },
        noResult: summarizeResult(noResult),
        partial: summarizeResult(partial),
        aligned: summarizeResult(aligned),
        blocked: summarizeResult(blocked),
        eventTimeline: {
          event_count: noResult.structuredContent.work_event_spine_timeline.event_count,
          sort_order: noResult.structuredContent.work_event_spine_timeline.sort_order,
          read_only: noResult.structuredContent.work_event_spine_timeline.boundary_text.join(" ").includes("read-only"),
        },
      }));
    } finally {
      server.close();
    }

    async function briefResult(tools, codexResult) {
      const input = {
        scope: "project:augnes",
        workId: "AG-006",
      };
      if (codexResult) input.codexResult = codexResult;
      return tools.augnes_get_work_brief.handler(input);
    }

    function summarizeResult(result) {
      const review = result.structuredContent.codex_result_review_packet_preview;
      const closure = result.structuredContent.result_review_closure_preview;
      return {
        reviewStatus: review.status,
        resultSource: review.result_source,
        reportedResultStatus: review.reported_result_status,
        suggestedResultStatus: review.suggested_result_status,
        suggestedNextAction: review.suggested_next_action,
        reviewRecommendation: review.review_recommendation,
        closureRecommendation: closure.closure_recommendation ?? closure.status,
        missingVerification: review.verification_alignment.missing,
        reportedChangedFiles: review.reported_changed_files,
        reportedVerificationResults: review.reported_verification_results,
        prFetched: review.pr_reference.fetched,
      };
    }

    function authorityBoundaryStatement() {
      return [
        "Authority boundary statement:",
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
      ].join("; ");
    }

    function closeoutText() {
      return [
        "Summary: readonly Developer Mode profile smoke completed.",
        "User-facing path added or changed: Developer Mode can use a narrow read-only work-loop tool surface.",
        "Files changed: docs/AUGNES_CHATGPT_CODEX_WORK_LOOP_V0_1_SNAPSHOT.md; scripts/smoke-chatgpt-codex-work-loop-v0-1.mjs.",
        "Verification: curl work brief passed; curl events passed; node scripts/smoke-chatgpt-codex-work-loop-v0-1.mjs passed.",
        "Skipped checks and caveats: none skipped.",
        "Remaining caveats: no remaining caveats.",
        "Memory Reuse attachment status: no_match.",
        "Project Constellation context status: explicitly_absent.",
        "Final handoff preflight status: passed.",
        "PR body checklist: present.",
        "closeout skeleton: present.",
        authorityBoundaryStatement(),
        "Next recommended step: rerun ChatGPT Developer Mode observation with the read-only work-loop profile.",
      ].join("\n");
    }

    function baseCodexResult() {
      return {
        work_id: "AG-006",
        scope: "project:augnes",
        final_report_text: closeoutText(),
        changed_files: expectedFiles,
        skipped_checks: ["none skipped"],
        remaining_caveats: ["no remaining caveats"],
        authority_boundary_statement: authorityBoundaryStatement(),
        result_status: "completed",
      };
    }

    function partialCodexResult() {
      return {
        ...baseCodexResult(),
        verification_commands: ["node scripts/smoke-chatgpt-codex-work-loop-v0-1.mjs"],
        verification_results: [
          {
            command: "node scripts/smoke-chatgpt-codex-work-loop-v0-1.mjs",
            status: "passed",
            summary: "Deterministic work-loop smoke passed, but curl runtime checks were not covered.",
          },
        ],
        skipped_checks: [
          {
            check: expectedChecks[0],
            reason: "local runtime curl check not covered in this partial result fixture",
          },
        ],
        remaining_caveats: ["Expected AG-006 curl checks still need runtime verification."],
      };
    }

    function alignedCodexResult() {
      return {
        ...baseCodexResult(),
        verification_commands: expectedChecks,
        verification_results: expectedChecks.map((command) => ({
          command,
          status: "passed",
          summary: command + " passed",
        })),
      };
    }

    function blockedCodexResult() {
      return {
        ...baseCodexResult(),
        final_report_text: closeoutText() + "\nBlocked: local runtime was unavailable.",
        verification_commands: [],
        verification_results: [],
        skipped_checks: [
          {
            check: expectedChecks[0],
            reason: "local runtime unavailable",
          },
        ],
        remaining_caveats: ["Blocked by local runtime unavailable."],
        result_status: "blocked",
      };
    }
  `;
}
