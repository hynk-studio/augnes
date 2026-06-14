import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

process.env.AUGNES_DB_PATH = path.join(
  mkdtempSync(path.join(os.tmpdir(), "augnes-reuse-intake-")),
  "augnes.db",
);

const itemModel = await import(
  "../lib/perspective-ingest/perspective-memory-item.ts"
);
const intake = await import(
  "../lib/perspective-ingest/perspective-memory-reuse-intake.ts"
);
const dbCommon = await import("./db-common.mjs");

const packageFile = "package.json";
const helperFile =
  "lib/perspective-ingest/perspective-memory-reuse-intake.ts";
const scriptFile = "scripts/perspective-memory-reuse-intake.mjs";
const smokeFile = "scripts/smoke-perspective-memory-reuse-intake.mjs";
const docFile = "docs/PERSPECTIVE_MEMORY_REUSE_INTAKE_V0_1.md";
const reportFile = "reports/2026-06-14-perspective-memory-reuse-intake.md";
const v02ReportFile =
  "reports/2026-06-14-perspective-memory-reuse-intake-v0-2.md";

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const helperText = readFileSync(helperFile, "utf8");
const scriptText = readFileSync(scriptFile, "utf8");
const docText = readFileSync(docFile, "utf8");
const reportText = readFileSync(reportFile, "utf8");
const v02ReportText = readFileSync(v02ReportFile, "utf8");

try {
  assertStaticFilesAndScripts();
  assertPureIntakeBehavior();
  assertV02RankingNoMatchAndCompactGuidance();
  assertStoreBackedCliBehavior();
  assertDocsReportsAndBoundary();
  assertNoForbiddenImplementationMarkers();
  console.log("PASS smoke:perspective-memory-reuse-intake");
} finally {
  rmSync(path.dirname(process.env.AUGNES_DB_PATH), {
    recursive: true,
    force: true,
  });
}

function assertStaticFilesAndScripts() {
  for (const file of [
    helperFile,
    scriptFile,
    smokeFile,
    docFile,
    reportFile,
    v02ReportFile,
  ]) {
    assert.equal(existsSync(file), true, `${file} must exist`);
  }

  assert.equal(
    packageJson.scripts["perspective:memory-reuse-intake"],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/perspective-memory-reuse-intake.mjs",
  );
  assert.equal(
    packageJson.scripts["smoke:perspective-memory-reuse-intake"],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-perspective-memory-reuse-intake.mjs",
  );

  assertIncludesAll(helperText, [
    "perspective_memory_reuse_intake.v0.2",
    "buildPerspectiveMemoryReuseIntakeFromStore",
    "listPerspectiveMemoryItems",
    "buildPerspectiveMemoryReusePacket",
    "buildPerspectiveMemoryReuseQualityReview",
    "why_selected",
    "reuse_boundary",
    "selection_guidance",
    "no_match_state",
    "exact_task_entity_match_boost",
    "buildExactTaskEntityMatchBoost",
    "Store read succeeded and persisted perspective-memory items existed",
    "Only inactive perspective-memory items matched this task",
    "No store read was performed because the explicit perspective-memory DB path was missing",
    "Preserve selected memory IDs.",
    "Trim repeated summaries, long source refs, and repeated warnings first.",
    "quality_review_preview_summary",
    "deterministic_local_intake: true",
    "mechanical_keyword_matching_only: true",
    "provider_model_call_created: false",
    "openai_api_call_created: false",
    "codex_sdk_execution_created: false",
    "mcp_tool_call_created: false",
    "github_mutation_created: false",
    "persistence_write_created: false",
    "memory_item_created: false",
    "memory_item_mutated: false",
    "db_schema_changed: false",
    "augnes_state_commit_reject_created: false",
  ]);

  assertIncludesAll(scriptText, [
    "--task",
    "--task-title",
    "--task-description",
    "--limit",
    "--db-path",
    "--json",
    "--brief",
    "buildPerspectiveMemoryReuseIntakeFromStore",
  ]);
}

function assertPureIntakeBehavior() {
  const items = [
    makeItem({
      item_id: "perspective-memory-item:intake-accepted",
      title: "Codex-facing memory reuse intake",
      summary:
        "Build the local one-command intake so Codex can receive a memory brief.",
      source_refs: ["docs/PERSPECTIVE_MEMORY_REUSE_INTAKE_V0_1.md"],
      evidence_refs: ["report:intake"],
      risk_notes: ["Do not call providers or persist reuse packets."],
      carry_forward_questions: [
        "Can the intake replace manual why_selected entry for common tasks?",
      ],
      suggested_next_review_action:
        "Run the deterministic intake smoke before PR handoff.",
      item_status: "accepted",
      updated_at: "2026-06-14T02:00:00.000Z",
    }),
    makeItem({
      item_id: "perspective-memory-item:quality-reviewing",
      title: "Quality review panel dogfood",
      summary:
        "Keep the quality review preview visible beside the Codex Memory Brief.",
      source_refs: ["reports/browser/quality-review-panel-dogfood"],
      risk_notes: ["Review stale or misleading reuse before treating it as truth."],
      carry_forward_questions: [
        "Should Codex see quality review warnings in the first command output?",
      ],
      item_status: "reviewing",
      updated_at: "2026-06-14T01:00:00.000Z",
    }),
    makeItem({
      item_id: "perspective-memory-item:intake-deprecated",
      title: "Deprecated memory reuse intake sketch",
      summary: "Old intake sketch that should not be automatically reused.",
      item_status: "deprecated",
      updated_at: "2026-06-14T03:00:00.000Z",
    }),
    makeItem({
      item_id: "perspective-memory-item:unrelated",
      title: "Returned envelope workflow",
      summary: "Different local adapter flow.",
      item_status: "accepted",
      risk_notes: ["separate returned envelope concern"],
      carry_forward_questions: ["Does returned envelope validation need review?"],
      suggested_next_review_action: "Review returned envelope validation.",
    }),
  ];

  const input = {
    task: "Add Codex-facing Perspective Memory Reuse Intake with quality review warnings",
    limit: 5,
    items,
  };
  const first = intake.buildPerspectiveMemoryReuseIntake(input);
  const second = intake.buildPerspectiveMemoryReuseIntake(input);
  assert.deepEqual(first, second, "same input must produce deterministic output");

  assert.equal(
    first.intake_version,
    intake.PERSPECTIVE_MEMORY_REUSE_INTAKE_VERSION,
  );
  assert.equal(first.deterministic_output, true);
  assert.equal(first.suggested_memory_items.length, 2);
  assert.deepEqual(
    first.suggested_memory_items.map((item) => item.memory_item_id),
    [
      "perspective-memory-item:intake-accepted",
      "perspective-memory-item:quality-reviewing",
    ],
  );
  assert.equal(first.excluded_candidates.length, 1);
  assert.equal(
    first.excluded_candidates[0].memory_item_id,
    "perspective-memory-item:intake-deprecated",
  );
  assert(first.warnings.some((warning) => warning.includes("deprecated")));

  const selected = first.suggested_memory_items[0];
  assertIncludesAll(selected.why_selected, [
    "Matched task keywords",
    "content.title",
    "item status is accepted",
  ]);
  assertIncludesAll(selected.reuse_boundary, [
    "Reuse only as bounded Augnes prior context",
    "Do not treat it as runtime authority",
    "call OpenAI API",
    "call MCP tools",
  ]);
  assert.equal(first.reuse_packet.selected_memory_items.length, 2);
  assert.equal(first.reuse_packet.authority_boundary.provider_model_call_created, false);
  assertIncludesAll(first.codex_memory_brief, [
    "# Codex Memory Brief",
    "memory_item_id: perspective-memory-item:intake-accepted",
    "why relevant:",
    "boundary:",
  ]);
  assert.equal(
    first.quality_review_preview_summary.preview_state,
    "needs_operator_review",
  );
  assertIncludesAll(first.quality_review_summary, [
    "# Perspective Memory Reuse Quality Review",
    "selected_item_count: 2",
  ]);

  const human = intake.formatPerspectiveMemoryReuseIntakeHuman(first);
  assertIncludesAll(human, [
    "# Perspective Memory Reuse Intake v0.2",
    "## Suggested Persisted Perspective-Memory Items",
    "## Codex Memory Brief",
    "## Quality Review Warning Summary",
    "## Structured Reuse Packet JSON",
  ]);
  const brief = intake.formatPerspectiveMemoryReuseIntakeBrief(first);
  assertIncludesAll(brief, [
    "# Codex Memory Brief",
    "## Quality Review Warning Summary",
  ]);
}

function assertV02RankingNoMatchAndCompactGuidance() {
  const exactIntakeCommand = makeItem({
    item_id: "perspective-memory-item:v02-exact-intake-command",
    title: "Perspective Memory Reuse Intake command",
    summary:
      "Codex-facing reuse intake command created by PR #565 for the npm run perspective:memory-reuse-intake workflow.",
    source_refs: [
      "scripts/perspective-memory-reuse-intake.mjs",
      "docs/PERSPECTIVE_MEMORY_REUSE_INTAKE_V0_1.md",
    ],
    evidence_refs: ["npm run perspective:memory-reuse-intake"],
    risk_notes: ["No provider/model calls and no persistence writes."],
  });
  const broadCompactBrief = makeItem({
    item_id: "perspective-memory-item:v02-broad-compact-brief",
    title: "Compact brief guidance for larger Perspective Memory Reuse selections",
    summary:
      "When Perspective Memory Reuse selects several items, the Codex Memory Brief can get large and compact_brief_recommended should tell Codex what to trim.",
    source_refs: [
      "lib/perspective-ingest/perspective-memory-item-reuse-packet.ts",
      "compact_brief_recommended",
    ],
    evidence_refs: ["codex-memory-brief-metadata", "large-selection-threshold"],
    risk_notes: [
      "Large selection warning should help Codex trim context without hiding selected memory IDs.",
    ],
    carry_forward_questions: [
      "Does compact brief guidance preserve why_selected and reuse_boundary?",
    ],
  });
  const rankingResult = intake.buildPerspectiveMemoryReuseIntake({
    task:
      "Review Perspective Memory Reuse Intake command ranking, no-match copy, and compact brief guidance",
    limit: 5,
    items: [broadCompactBrief, exactIntakeCommand],
  });

  assert.equal(
    rankingResult.suggested_memory_items[0].memory_item_id,
    "perspective-memory-item:v02-exact-intake-command",
  );
  assert(
    rankingResult.suggested_memory_items[0].exact_task_entity_match_boost > 0,
    "exact intake command item should receive deterministic boost",
  );
  assert.equal(
    rankingResult.suggested_memory_items[0].exact_task_entity_match,
    true,
  );
  assertIncludesAll(rankingResult.suggested_memory_items[0].why_selected, [
    "Exact intake-command entity match boost applied.",
  ]);

  const readableNoActiveMatch = intake.buildPerspectiveMemoryReuseIntake({
    task: "Investigate billing webhook retries for a remote payments integration",
    readVia: "listPerspectiveMemoryItems",
    items: [
      makeItem({
        item_id: "perspective-memory-item:v02-readable-unrelated",
        title: "Perspective reuse unrelated local workflow",
        summary: "Different Augnes local adapter concern.",
      }),
    ],
  });
  assert.equal(readableNoActiveMatch.suggested_memory_items.length, 0);
  assert.equal(
    readableNoActiveMatch.selection_guidance.no_match_state,
    "readable_store_no_active_matches",
  );
  assertIncludesAll(readableNoActiveMatch.selection_guidance.no_match_message, [
    "Store read succeeded and persisted perspective-memory items existed",
    "no accepted/reviewing items matched this task",
  ]);
  assertIncludesAll(
    intake.formatPerspectiveMemoryReuseIntakeBrief(readableNoActiveMatch),
    [
      "no_match_state: readable_store_no_active_matches",
      "Store read succeeded and persisted perspective-memory items existed",
    ],
  );

  const onlyInactiveMatch = intake.buildPerspectiveMemoryReuseIntake({
    task: "Review Perspective Memory Reuse Intake no-match copy",
    readVia: "listPerspectiveMemoryItems",
    items: [
      makeItem({
        item_id: "perspective-memory-item:v02-inactive-intake-copy",
        title: "Deprecated Perspective Memory Reuse Intake no-match copy",
        summary:
          "Old reuse intake copy that should warn but not be automatically selected.",
        item_status: "deprecated",
      }),
    ],
  });
  assert.equal(onlyInactiveMatch.suggested_memory_items.length, 0);
  assert.equal(
    onlyInactiveMatch.selection_guidance.no_match_state,
    "only_inactive_matches",
  );
  assertIncludesAll(onlyInactiveMatch.selection_guidance.no_match_message, [
    "Only inactive perspective-memory items matched this task",
    "warning context only",
  ]);

  const missingDb = intake.buildPerspectiveMemoryReuseIntake({
    task: "Review Perspective Memory Reuse Intake command",
    items: [],
    extraWarnings: [
      "Perspective-memory DB not found at /tmp/missing.db; no store read was performed.",
    ],
  });
  assert.equal(
    missingDb.selection_guidance.no_match_state,
    "db_missing_no_store_read",
  );
  assertIncludesAll(missingDb.selection_guidance.no_match_message, [
    "No store read was performed",
    "--db-path",
  ]);

  const zeroItems = intake.buildPerspectiveMemoryReuseIntake({
    task: "Review Perspective Memory Reuse Intake command",
    readVia: "listPerspectiveMemoryItems",
    items: [],
  });
  assert.equal(
    zeroItems.selection_guidance.no_match_state,
    "store_read_zero_items",
  );
  assertIncludesAll(zeroItems.selection_guidance.no_match_message, [
    "Store read succeeded",
    "zero persisted perspective-memory items",
  ]);

  const compactResult = intake.buildPerspectiveMemoryReuseIntake({
    task:
      "Review Perspective Memory Reuse Intake command compact brief guidance for the next bounded Augnes development slice",
    limit: 5,
    items: [
      exactIntakeCommand,
      broadCompactBrief,
      makeItem({
        item_id: "perspective-memory-item:v02-compact-third",
        title: "Perspective Memory Reuse Intake copy guidance",
        summary:
          "The intake command should preserve selected memory IDs, why_selected, reuse_boundary, Return Expectations, and authority boundary.",
        source_refs: ["reports/2026-06-14-perspective-memory-reuse-intake-v0-2.md"],
        risk_notes: [
          "Trim repeated summaries, long source refs, and repeated warnings first.",
        ],
      }),
    ],
  });
  assert.equal(compactResult.suggested_memory_items.length, 3);
  assert.equal(
    compactResult.codex_memory_brief_metadata.compact_brief_recommended,
    true,
  );
  assert.deepEqual(compactResult.selection_guidance.compact_brief_guidance, [
    "Preserve selected memory IDs.",
    "Preserve why_selected.",
    "Preserve reuse_boundary.",
    "Preserve Return Expectations.",
    "Preserve the authority boundary.",
    "Trim repeated summaries, long source refs, and repeated warnings first.",
  ]);
  assertIncludesAll(intake.formatPerspectiveMemoryReuseIntakeHuman(compactResult), [
    "compact_brief_guidance:",
    "Preserve selected memory IDs.",
    "Trim repeated summaries, long source refs, and repeated warnings first.",
  ]);
  assertIncludesAll(intake.formatPerspectiveMemoryReuseIntakeBrief(compactResult), [
    "compact_brief_guidance:",
    "Preserve why_selected.",
    "Preserve reuse_boundary.",
    "Preserve Return Expectations.",
    "Preserve the authority boundary.",
  ]);
}

function assertStoreBackedCliBehavior() {
  const db = dbCommon.resetDatabase();
  try {
    insertItem(
      db,
      makeItem({
        item_id: "perspective-memory-item:cli-intake",
        title: "Codex memory reuse intake command",
        summary:
          "CLI reads persisted perspective-memory items and prints a Codex Memory Brief.",
        source_refs: ["script:perspective-memory-reuse-intake"],
        risk_notes: ["No provider/model calls and no persistence writes."],
      }),
    );
    insertItem(
      db,
      makeItem({
        item_id: "perspective-memory-item:cli-retracted",
        title: "Retracted Codex memory reuse intake command",
        summary: "A stale match that must be excluded from selection.",
        item_status: "retracted",
        source_boundary_record_id: "perspective-memory-boundary:retracted",
      }),
    );
  } finally {
    db.close();
  }

  const env = { ...process.env, AUGNES_DB_PATH: process.env.AUGNES_DB_PATH };
  delete env.OPENAI_API_KEY;
  const jsonOutput = execFileSync(
    "npm",
    [
      "run",
      "--silent",
      "perspective:memory-reuse-intake",
      "--",
      "--task",
      "Codex memory reuse intake command",
      "--db-path",
      process.env.AUGNES_DB_PATH,
      "--json",
    ],
    { cwd: process.cwd(), encoding: "utf8", env },
  );
  const parsed = JSON.parse(jsonOutput);
  assert.equal(parsed.candidate_source.read_via, "listPerspectiveMemoryItems");
  assert.equal(parsed.suggested_memory_items.length, 1);
  assert.equal(
    parsed.suggested_memory_items[0].memory_item_id,
    "perspective-memory-item:cli-intake",
  );
  assert.equal(parsed.excluded_candidates.length, 1);
  assert.equal(parsed.reuse_packet.selected_memory_items.length, 1);
  assertIncludesAll(parsed.codex_memory_brief, [
    "# Codex Memory Brief",
    "perspective-memory-item:cli-intake",
  ]);

  const briefOutput = execFileSync(
    "npm",
    [
      "run",
      "--silent",
      "perspective:memory-reuse-intake",
      "--",
      "--task",
      "Codex memory reuse intake command",
      "--db-path",
      process.env.AUGNES_DB_PATH,
      "--brief",
    ],
    { cwd: process.cwd(), encoding: "utf8", env },
  );
  assertIncludesAll(briefOutput, [
    "# Codex Memory Brief",
    "## Quality Review Warning Summary",
    "preview_state:",
  ]);
}

function assertDocsReportsAndBoundary() {
  assertIncludesAll(docText, [
    "# Perspective Memory Reuse Intake v0.1",
    "## v0.2 Ranking And Copy Guidance",
    "npm run perspective:memory-reuse-intake -- --task",
    "Codex-facing entrypoint",
    "why_selected",
    "reuse_boundary",
    "exact-task/entity match boost",
    "No-match copy",
    "compact_brief_recommended",
    "quality review preview",
    "No provider/model calls",
    "No OpenAI API calls",
    "No MCP tools",
    "No Codex SDK",
    "No GitHub mutation",
    "No persistence writes",
    "No automatic memory creation",
    "No Augnes state commit/reject authority",
  ]);
  assertIncludesAll(reportText, [
    "# Perspective Memory Reuse Intake v0.1 Report",
    "Codex-facing entrypoint",
    "deterministic local CLI/helper",
    "buildPerspectiveMemoryReusePacket",
    "buildPerspectiveMemoryReuseQualityReview",
    "smoke:perspective-memory-reuse-intake",
    "typecheck",
    "git diff --check",
  ]);
  assertIncludesAll(v02ReportText, [
    "# Perspective Memory Reuse Intake v0.2 Report",
    "ranking/copy guidance only",
    "exact-task/entity match boost",
    "readable DB with no active matches",
    "only inactive candidates",
    "compact_brief_recommended",
    "Preserve selected memory IDs",
    "Trim repeated summaries, long source refs, and repeated warnings first",
    "No provider/model calls",
    "No OpenAI API calls",
    "No MCP tool calls",
    "No Codex SDK execution",
    "No GitHub mutation",
    "No persistence writes",
    "No DB schema",
    "No automatic memory creation",
    "No Augnes state commit/reject authority",
  ]);
}

function assertNoForbiddenImplementationMarkers() {
  assertNoIncludes(helperText, [
    "fetch(",
    "openai.chat",
    "responses.create",
    "chat.completions",
    "createPerspectiveMemoryItemFromBoundaryRecord(",
    "updatePerspectiveMemoryItemStatusInStore(",
  ]);
  assertNoIncludes(scriptText, [
    "fetch(",
    "OPENAI_API_KEY",
    "responses.create",
    "chat.completions",
    "createPerspectiveMemoryItemFromBoundaryRecord(",
    "updatePerspectiveMemoryItemStatusInStore(",
  ]);
}

function insertItem(db, item) {
  db.prepare(
    `
      INSERT INTO perspective_memory_items (
        item_id,
        item_status,
        memory_kind,
        source_boundary_record_id,
        source_checklist_id,
        source_proposal_id,
        source_queue_item_id,
        source_candidate_draft_id,
        source_validation_result_state,
        source_validation_summary_hash,
        source_input_ref,
        source_input_hash,
        prepare_summary_ref,
        prepare_execution_summary_hash,
        returned_envelope_hash,
        source_proposal_hash,
        item_title,
        item_summary,
        item_json,
        created_at,
        updated_at
      )
      VALUES (
        @item_id,
        @item_status,
        @memory_kind,
        @source_boundary_record_id,
        @source_checklist_id,
        @source_proposal_id,
        @source_queue_item_id,
        @source_candidate_draft_id,
        @source_validation_result_state,
        @source_validation_summary_hash,
        @source_input_ref,
        @source_input_hash,
        @prepare_summary_ref,
        @prepare_execution_summary_hash,
        @returned_envelope_hash,
        @source_proposal_hash,
        @item_title,
        @item_summary,
        @item_json,
        @created_at,
        @updated_at
      )
    `,
  ).run({
    item_id: item.item_id,
    item_status: item.item_status,
    memory_kind: item.memory_kind,
    source_boundary_record_id: item.source_boundary_record_id,
    source_checklist_id: item.source_checklist_id,
    source_proposal_id: item.source_proposal_id,
    source_queue_item_id: item.source_queue_item_id,
    source_candidate_draft_id: item.source_candidate_draft_id,
    source_validation_result_state: item.source_validation_result_state,
    source_validation_summary_hash: item.source_validation_summary_hash,
    source_input_ref: item.source_input_ref,
    source_input_hash: item.source_input_hash,
    prepare_summary_ref: item.prepare_summary_ref,
    prepare_execution_summary_hash: item.prepare_execution_summary_hash,
    returned_envelope_hash: item.returned_envelope_hash,
    source_proposal_hash: item.source_proposal_hash,
    item_title: item.content.title,
    item_summary: item.content.summary,
    item_json: JSON.stringify(item),
    created_at: item.created_at,
    updated_at: item.updated_at,
  });
}

function makeItem(overrides = {}) {
  const itemId = overrides.item_id ?? "perspective-memory-item:base";
  return {
    item_version: itemModel.PERSPECTIVE_MEMORY_ITEM_VERSION,
    item_id: itemId,
    created_at: overrides.created_at ?? "2026-06-14T00:00:00.000Z",
    updated_at: overrides.updated_at ?? "2026-06-14T00:00:00.000Z",
    source: "product_persistence_boundary_record",
    source_boundary_record_id:
      overrides.source_boundary_record_id ??
      `perspective-memory-boundary:${itemId.split(":").pop()}`,
    source_checklist_id: overrides.source_checklist_id ?? `checklist:${itemId}`,
    source_proposal_id: overrides.source_proposal_id ?? `proposal:${itemId}`,
    source_queue_item_id: overrides.source_queue_item_id ?? `queue-item:${itemId}`,
    source_candidate_draft_id:
      overrides.source_candidate_draft_id ?? `candidate-draft:${itemId}`,
    source_validation_result_state:
      overrides.source_validation_result_state ?? "PASS",
    source_validation_summary_hash:
      overrides.source_validation_summary_hash ?? `sha256:validation:${itemId}`,
    source_input_ref: overrides.source_input_ref ?? `source-input:${itemId}`,
    source_input_hash: overrides.source_input_hash ?? `sha256:source:${itemId}`,
    prepare_summary_ref: overrides.prepare_summary_ref ?? `prepare:${itemId}`,
    prepare_execution_summary_hash:
      overrides.prepare_execution_summary_hash ?? `sha256:prepare:${itemId}`,
    returned_envelope_hash:
      overrides.returned_envelope_hash ?? `sha256:envelope:${itemId}`,
    source_proposal_hash:
      overrides.source_proposal_hash ?? `sha256:proposal:${itemId}`,
    memory_kind: overrides.memory_kind ?? "perspective_candidate",
    item_status: overrides.item_status ?? "accepted",
    content: {
      content_version: itemModel.PERSPECTIVE_MEMORY_ITEM_CONTENT_VERSION,
      title: overrides.title ?? "Perspective memory reuse fixture",
      summary: overrides.summary ?? "Bounded persisted item summary.",
      source_refs: overrides.source_refs ?? ["source-input:fixture"],
      evidence_refs: overrides.evidence_refs ?? ["evidence:fixture"],
      risk_notes: overrides.risk_notes ?? ["0 warnings", "0 pointer warnings"],
      unresolved_tensions:
        overrides.unresolved_tensions ?? ["not captured in local queue item"],
      carry_forward_questions:
        overrides.carry_forward_questions ??
        ["Should this item be reused before deterministic synthesis?"],
      suggested_next_review_action:
        overrides.suggested_next_review_action ??
        "Review before Core-facing promotion or runtime usage.",
    },
    acceptance: {
      accepted_at: overrides.accepted_at ?? "2026-06-14T00:00:00.000Z",
      acceptance_label: "Create persisted perspective-memory item",
      user_confirmed_create_persisted_perspective_memory_item: true,
      user_confirmed_not_core_decision: true,
      user_confirmed_no_automatic_runtime_injection: true,
      user_confirmed_source_boundary_record_preserved: true,
    },
    source_boundary_snapshot: {
      boundary_status_at_creation: "product_persistence_boundary_recorded",
      checklist_ready_for_product_persistence_review: true,
      checklist_ready_for_memory_write_now: false,
      proposed_memory_payload_should_write_to_memory_now: false,
      user_confirmation_from_boundary_record: {
        confirmed_at: "2026-06-14T00:00:00.000Z",
      },
      checklist_gate_summary: {
        required_gate_count: 1,
        completed_required_gate_count: 1,
        optional_gate_count: 0,
        completed_optional_gate_count: 0,
        checked_required_gates: ["final_user_intent_confirmed"],
        not_applicable_gates: [],
        blocked_gates: [],
      },
      proposal_diff_summary: {
        included_from_queue_item: ["memory candidate preview"],
        excluded_from_queue_item: ["queue-only local status"],
        excluded_raw_material: ["excluded raw material category redacted"],
        authority_boundary_notes: ["boundary record is not Core memory"],
      },
    },
    availability: {
      visible_in_perspective_memory_items: true,
      eligible_for_manual_review: true,
      eligible_for_future_retrieval_surfaces: true,
      eligible_for_future_synthesis_surfaces: true,
      automatic_runtime_injection_enabled: false,
      core_memory_enabled: false,
    },
    authority_boundary: {
      perspective_memory_item_created: true,
      accepted_product_memory_item_created: true,
      core_decision_created: false,
      core_memory_created: false,
      state_entry_created: false,
      runtime_handoff_created: false,
      automatic_runtime_injection_created: false,
      automatic_promotion_created: false,
      provider_model_call_created: false,
      github_mutation_created: false,
    },
  };
}

function assertIncludesAll(text, snippets) {
  for (const snippet of snippets) {
    assert(text.includes(snippet), `expected source to include ${snippet}`);
  }
}

function assertNoIncludes(text, snippets) {
  for (const snippet of snippets) {
    assert(!text.includes(snippet), `source must not include ${snippet}`);
  }
}
