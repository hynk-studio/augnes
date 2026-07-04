#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  assertChangedFilesWithin,
  assertContainsAll,
  assertPackageScript,
  collectUntrackedFiles,
  loadTextByFile,
  uniqueSorted,
} from "./smoke-boundary-common.mjs";

const typeFile = "types/workplane-continuity-relay.ts";
const helperFile = "lib/workplane/workplane-continuity-relay.ts";
const contextReaderFile = "lib/workplane/read-workplane-context.ts";
const panelFile = "components/workplane/continuity-relay-workplane-panel.tsx";
const agentWorkplaneFile = "components/workplane/agent-workplane.tsx";
const nodeTypeFile = "types/agent-workplane-node.ts";
const nodeContextFile = "lib/workplane/workplane-node-context.ts";
const packageJsonFile = "package.json";
const smokeFile = "scripts/smoke-workplane-continuity-relay-v0-1.mjs";
const panelsSmokeFile = "scripts/smoke-agent-workplane-panels-v0-1.mjs";
const nodeSmokeFile = "scripts/smoke-agent-workplane-node-contract-v0-1.mjs";
const handoffRationaleTypeFile =
  "types/handoff-context-relay-rationale.ts";
const handoffRationaleHelperFile =
  "lib/handoff/handoff-context-relay-rationale.ts";
const handoffRationalePanelFile =
  "components/handoff/handoff-context-relay-rationale-panel.tsx";
const handoffCopyExportHelperFile =
  "lib/handoff/handoff-capsule-copy-export.ts";
const handoffCopyExportPanelFile =
  "components/handoff/handoff-copy-export-panel.tsx";
const handoffRationaleSmokeFile =
  "scripts/smoke-handoff-context-relay-rationale-v0-1.mjs";
const handoffCopyExportSmokeFile =
  "scripts/smoke-handoff-capsule-copy-export-v0-1.mjs";
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
  contextReaderFile,
  panelFile,
  agentWorkplaneFile,
  nodeTypeFile,
  nodeContextFile,
  packageJsonFile,
  smokeFile,
  panelsSmokeFile,
  nodeSmokeFile,
  handoffRationaleTypeFile,
  handoffRationaleHelperFile,
  handoffRationalePanelFile,
  handoffCopyExportHelperFile,
  handoffCopyExportPanelFile,
  handoffRationaleSmokeFile,
  handoffCopyExportSmokeFile,
  codexResultFeedbackTypeFile,
  codexResultFeedbackHelperFile,
  codexResultFeedbackPanelFile,
  codexResultFeedbackSmokeFile,
  dogfoodReuseProposalTypeFile,
  dogfoodReuseProposalHelperFile,
  dogfoodReuseProposalPanelFile,
  dogfoodReuseProposalSmokeFile,
];

const textByFile = loadTextByFile(allowedChangedFiles);
const typeText = textByFile.get(typeFile);
const helperText = textByFile.get(helperFile);
const contextReaderText = textByFile.get(contextReaderFile);
const panelText = textByFile.get(panelFile);
const agentWorkplaneText = textByFile.get(agentWorkplaneFile);
const nodeTypeText = textByFile.get(nodeTypeFile);
const nodeContextText = textByFile.get(nodeContextFile);
const packageJsonText = textByFile.get(packageJsonFile);

assertPackageScript({
  packageJsonText,
  scriptName: "smoke:workplane-continuity-relay-v0-1",
  expectedCommand:
    "tsx --tsconfig tsconfig.json scripts/smoke-workplane-continuity-relay-v0-1.mjs",
});

assertContainsAll(
  typeText,
  [
    "workplane_continuity_relay.v0.1",
    "preserve_anchors",
    "warn_anchors",
    "stop_if_missing",
    "next_focus",
    "stale_or_gap_warnings",
    "source_refs",
    "source_status",
    "fallback_reason",
    "authority_boundary",
    "can_write_db: false",
    "can_mutate_memory: false",
    "can_apply_project_perspective: false",
    "can_call_provider_openai: false",
    "can_call_github: false",
    "can_execute_codex: false",
    "can_create_graph_or_vector_store: false",
    "can_crawl_or_observe_browser: false",
  ],
  { label: typeFile },
);

assertContainsAll(
  helperText,
  [
    "buildWorkplaneContinuityRelay",
    "Current Working Perspective",
    "GuideBrief",
    "stop.missing_current_working_perspective",
    "warn.missing_guide_brief",
    "source_of_truth: false",
    "derived_read_model: true",
    "can_write_db: false",
    "can_mutate_memory: false",
    "can_apply_project_perspective: false",
    "can_execute_codex: false",
    "can_create_graph_or_vector_store: false",
    "can_crawl_or_observe_browser: false",
  ],
  { label: helperFile },
);

assertNoForbiddenRuntimeCode(helperFile, helperText);

assertContainsAll(
  contextReaderText,
  [
    "buildWorkplaneContinuityRelay",
    "continuity_relay",
    "guide_brief",
    'satisfies Omit<WorkplaneContextRead, "continuity_relay">',
  ],
  { label: contextReaderFile },
);

assertContainsAll(
  panelText,
  [
    "ContinuityRelayWorkplanePanel",
    "Continuity Relay",
    "Continue from here",
    "Preserve",
    "Watch",
    "label=\"Watch\" value={relay.warn_anchors.length}",
    "anchors={relay.warn_anchors}",
    "No warnings materialized.",
    "Stop If Missing",
    "Next Focus",
    "Read-only/advisory",
    "No memory promotion",
    "panelId=\"continuity_relay\"",
    "nodeId=\"handoff_context\"",
  ],
  { label: panelFile },
);
assert(
  !panelText.includes("anchors={relay.stale_or_gap_warnings}"),
  `${panelFile} Watch section must render warn_anchors to match the metric`,
);

assertContainsAll(
  agentWorkplaneText,
  [
    "ContinuityRelayWorkplanePanel",
    "readWorkplaneContext({ guide_brief: guideBrief })",
    "<ContinuityRelayWorkplanePanel context={context} />",
  ],
  { label: agentWorkplaneFile },
);

assertContainsAll(
  nodeTypeText,
  ["continuity_relay", "AGENT_WORKPLANE_PANEL_IDS"],
  { label: nodeTypeFile },
);

assertContainsAll(
  nodeContextText,
  [
    "continuity_relay",
    "Continuity Relay",
    "smoke:workplane-continuity-relay-v0-1",
    "not handoff send, durable memory, Perspective apply",
  ],
  { label: nodeContextFile },
);

const { buildWorkplaneContinuityRelay } = await import(
  "../lib/workplane/workplane-continuity-relay.ts"
);
const { WORKPLANE_CONTINUITY_RELAY_VERSION } = await import(
  "../types/workplane-continuity-relay.ts"
);

const current = readJson("fixtures/current-working-perspective.sample.v0.1.json");
const projection = readJson("fixtures/augnes-delta-projection.sample.v0.1.json");
const guideBrief = readJson("fixtures/guide-brief.sample.v0.1.json");

const representativeRelay = buildWorkplaneContinuityRelay({
  workplane_context: buildFixtureWorkplaneContext({ current, projection }),
  guide_brief: guideBrief,
});

assert.equal(
  representativeRelay.relay_version,
  WORKPLANE_CONTINUITY_RELAY_VERSION,
);
assert.equal(representativeRelay.runtime, "augnes");
assert.equal(representativeRelay.scope, "project:augnes");
assert.equal(representativeRelay.source_status.guide_brief, "supplied");
assert(representativeRelay.source_refs.source_refs.length > 0);
assert(
  representativeRelay.preserve_anchors.some(
    (anchor) => anchor.kind === "thesis",
  ),
  "relay must preserve current thesis",
);
assert(
  representativeRelay.preserve_anchors.some(
    (anchor) => anchor.kind === "active_goal",
  ),
  "relay must preserve active goals",
);
assert(
  representativeRelay.warn_anchors.some(
    (anchor) => anchor.kind === "staleness" || anchor.kind === "gap",
  ),
  "relay must expose stale/gap warnings",
);
assert(
  representativeRelay.next_focus.some(
    (anchor) =>
      anchor.kind === "next_candidate" || anchor.kind === "guide_suggestion",
  ),
  "relay must expose next focus anchors",
);
assertAuthorityBoundary(representativeRelay.authority_boundary);

const missingRelay = buildWorkplaneContinuityRelay({
  workplane_context: null,
  guide_brief: null,
  as_of: "2026-07-04T00:00:00.000Z",
});

assert.equal(missingRelay.source_status.current_perspective, "missing");
assert.equal(missingRelay.source_status.guide_brief, "missing");
assert(
  missingRelay.stop_if_missing.some(
    (anchor) => anchor.anchor_id === "stop.missing_current_working_perspective",
  ),
  "missing CWP must produce a stop-if-missing anchor",
);
assert(
  missingRelay.warn_anchors.some(
    (anchor) => anchor.anchor_id === "warn.missing_guide_brief",
  ),
  "missing GuideBrief must produce a visible warning",
);
assert(
  missingRelay.next_focus.some(
    (anchor) => anchor.anchor_id === "next.no_focus_materialized",
  ),
  "missing context must produce explicit next-focus gap",
);
assertAuthorityBoundary(missingRelay.authority_boundary);

const changedFilesBoundary = assertChangedFilesWithin({
  allowedChangedFiles,
  label: "workplane-continuity-relay-v0-1",
});
const untrackedFiles = collectUntrackedFiles();
const changedAndUntrackedFiles = uniqueSorted([
  ...changedFilesBoundary.files,
  ...untrackedFiles,
]);
for (const file of changedAndUntrackedFiles) {
  assert(
    allowedChangedFiles.includes(file),
    `Unexpected changed or untracked relay file: ${file}`,
  );
}

console.log(
  JSON.stringify(
    {
      smoke: "workplane-continuity-relay-v0-1",
      pass: true,
      representative_preserve_count:
        representativeRelay.preserve_anchors.length,
      representative_warn_count: representativeRelay.warn_anchors.length,
      representative_next_focus_count: representativeRelay.next_focus.length,
      missing_stop_count: missingRelay.stop_if_missing.length,
      source_refs_checked: true,
      authority_boundary_checked: true,
      missing_partial_input_checked: true,
      changed_files_checked: changedFilesBoundary.checked,
      changed_files_skipped: changedFilesBoundary.skipped,
      changed_files_observed: changedAndUntrackedFiles,
      route_added: false,
      durable_write_added: false,
      provider_call_added: false,
      codex_execution_added: false,
      memory_promotion_added: false,
      perspective_apply_added: false,
      graph_vector_rag_crawler_observer_added: false,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:workplane-continuity-relay-v0-1");

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

function buildFixtureWorkplaneContext({ current, projection }) {
  return {
    current_perspective_read: {
      data: current,
      source_status: "runtime",
      fallback_reason: null,
      authority_boundary: current.authority_boundary,
    },
    delta_projection_read: {
      data: projection,
      source_status: "runtime",
      fallback_reason: null,
      authority_boundary: projection.authority_boundary,
    },
    runner_delta_batch_read: {
      status: "empty",
      as_of: null,
      source_status: "empty_fallback",
      fallback_reason: "No runner DeltaBatch fixture supplied for relay smoke.",
      recovered_batch_count: 0,
      recovered_delta_count: 0,
      latest_batch_id: null,
      latest_run_id: null,
      latest_validation_status: null,
      batches: [],
      staleness: {
        status: "unknown",
        as_of: null,
        updated_at: null,
        notes: ["No runner readback required for Continuity Relay smoke."],
      },
      fallback_status: {
        notes: ["Runner readback omitted by focused relay smoke."],
      },
    },
    overview: {
      scope: current.scope,
      current_perspective: {
        as_of: current.as_of,
        thesis: current.current_thesis.summary,
        frame_summary: current.current_frame.summary,
        active_goal_count: current.active_goals.length,
        active_work_ids: current.current_frame.active_work_ids,
        open_question_count: current.open_questions.length,
        active_risk_count: current.active_risks.length,
        next_candidate_count: current.next_candidates.length,
        research_pressure: current.research_pressure.pressure_level,
        staleness_status: current.staleness.status,
      },
      delta_projection: {
        as_of: projection.as_of,
        projected_delta_count: projection.source_counts.total_projected_deltas,
        batch_count: projection.source_counts.total_batches,
        gap_count: projection.source_counts.total_gaps,
        handoff_ref_count: projection.source_refs.handoff_refs.length,
        codex_result_ref_count: projection.source_refs.codex_result_refs.length,
        evidence_ref_count: projection.deltas.reduce(
          (count, delta) => count + delta.evidence_refs.length,
          0,
        ),
        latest_delta_titles: projection.deltas
          .slice(0, 4)
          .map((delta) => `${delta.title} (${delta.status})`),
      },
      runner_delta_batch: {
        as_of: null,
        recovered_batch_count: 0,
        recovered_delta_count: 0,
        latest_batch_id: null,
        latest_run_id: null,
        latest_validation_status: null,
      },
      review_queue: {
        needs_review_count:
          current.review_queue_hints.needs_review_delta_ids.length,
        blocked_count: current.review_queue_hints.blocked_delta_ids.length,
        manual_review_count:
          current.review_queue_hints.manual_review_delta_ids.length,
        validation_required_count:
          current.review_queue_hints.validation_required_delta_ids.length,
        project_perspective_review_count:
          current.review_queue_hints.project_perspective_review_delta_ids.length,
        durable_memory_review_count:
          current.review_queue_hints.durable_memory_review_delta_ids.length,
        user_decision_count:
          current.review_queue_hints.user_decision_delta_ids.length,
        total_attention_count: 0,
      },
    },
    source_status: {
      current_perspective: "runtime",
      delta_projection: "runtime",
      runner_delta_batch: "empty_fallback",
    },
    fallback_reason: {
      current_perspective: null,
      delta_projection: null,
      runner_delta_batch: "No runner DeltaBatch fixture supplied for relay smoke.",
    },
    authority_boundary: {
      surface: "agent_workplane",
      read_only_operator_view: true,
      no_hidden_execution_authority: true,
      can_write_db: false,
      can_record_proof: false,
      can_create_evidence: false,
      can_update_work: false,
      can_mutate_memory: false,
      can_apply_project_perspective: false,
      can_call_provider: false,
      can_call_github: false,
      can_execute_codex: false,
      can_publish_external: false,
      can_merge: false,
      can_retry_replay_deploy: false,
      notes: ["Fixture Workplane context for relay smoke."],
    },
    workplane_notes: ["Fixture Workplane context for relay smoke."],
  };
}

function assertAuthorityBoundary(boundary) {
  assert.equal(boundary.source_of_truth, false);
  assert.equal(boundary.derived_read_model, true);
  assert.equal(boundary.read_only_operator_view, true);
  assert.equal(boundary.candidate_material_only, true);

  for (const key of [
    "can_write_db",
    "can_record_proof",
    "can_create_evidence",
    "can_update_work",
    "can_mutate_memory",
    "can_promote_memory",
    "can_apply_project_perspective",
    "can_create_promotion_decision",
    "can_create_formation_receipt",
    "can_call_provider_openai",
    "can_call_github",
    "can_execute_codex",
    "can_execute_runner",
    "can_create_branch_or_pr",
    "can_send_handoff",
    "can_create_graph_or_vector_store",
    "can_crawl_or_observe_browser",
    "can_merge_publish_retry_replay_deploy",
  ]) {
    assert.equal(boundary[key], false, `authority_boundary.${key}`);
  }
}

function assertNoForbiddenRuntimeCode(file, text) {
  for (const pattern of [
    /fetch\s*\(/,
    /INSERT\s+INTO/i,
    /UPDATE\s+[a-z_]/i,
    /DELETE\s+FROM/i,
    /createPromotionDecision\s*\(/,
    /createFormationReceipt\s*\(/,
    /applyPerspectiveDelta\s*\(/,
    /new\s+OpenAI\s*\(/,
    /executeCodex\s*\(/,
  ]) {
    assert(!pattern.test(text), `${file} must not contain ${pattern}`);
  }
}
