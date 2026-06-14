import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const returnBinding = await import(
  "../lib/perspective-ingest/perspective-memory-reuse-return-binding.ts"
);

const packageFile = "package.json";
const helperFile =
  "lib/perspective-ingest/perspective-memory-reuse-return-binding.ts";
const docFile = "docs/PERSPECTIVE_MEMORY_REUSE_RETURN_BINDING_V0_1.md";
const reportFile =
  "reports/2026-06-14-perspective-memory-reuse-return-binding.md";

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const helperText = readFileSync(helperFile, "utf8");
const docText = readFileSync(docFile, "utf8");
const reportText = readFileSync(reportFile, "utf8");

assertStaticFilesAndScript();
assertCompleteReturnBinding();
assertMissingReturnSections();
assertDocsReportsAndBoundary();
assertNoForbiddenImplementationMarkers();

console.log("PASS smoke:perspective-memory-reuse-return-binding");

function assertStaticFilesAndScript() {
  for (const file of [helperFile, docFile, reportFile]) {
    assert.equal(existsSync(file), true, `${file} must exist`);
  }

  assert.equal(
    packageJson.scripts["smoke:perspective-memory-reuse-return-binding"],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-perspective-memory-reuse-return-binding.mjs",
  );

  assertIncludesAll(helperText, [
    "PERSPECTIVE_MEMORY_REUSE_RETURN_BINDING_VERSION",
    "PERSPECTIVE_MEMORY_REUSE_RETURN_BINDING_PREVIEW_VERSION",
    "perspective_memory_reuse_return_binding.v0.1",
    "perspective_memory_reuse_return_binding_preview.v0.1",
    "buildPerspectiveMemoryReuseReturnBinding",
    "buildReturnBindingSummary",
    "complete_enough_for_future_memory_review",
    "missing_return_sections",
    "follow_up_candidate_memory_preview",
    "preview_only: true",
  ]);
}

function assertCompleteReturnBinding() {
  const result = returnBinding.buildPerspectiveMemoryReuseReturnBinding({
    reuse_packet_id: "reuse-packet:551",
    codex_run_ref: "codex-run:552",
    returned_envelope_ref: "returned-envelope:552",
    returned_at: "2026-06-14T12:00:00.000Z",
    changed_files: [
      "lib/perspective-ingest/perspective-memory-reuse-return-binding.ts",
      "docs/PERSPECTIVE_MEMORY_REUSE_RETURN_BINDING_V0_1.md",
      "lib/perspective-ingest/perspective-memory-reuse-return-binding.ts",
      "reports/2026-06-14-perspective-memory-reuse-return-binding.md",
    ],
    verification: [
      {
        command: "npm run smoke:perspective-memory-reuse-return-binding",
        status: "passed",
        notes: "return binding smoke passed",
      },
      {
        command: "npm run typecheck",
        status: "passed",
        notes: "tsc --noEmit passed",
      },
    ],
    skipped_checks: [
      {
        check: "runtime/browser validation",
        reason: "preview helper only; no runtime route added",
      },
      {
        check: "MCP bridge startup",
        reason: "return binding preview does not need bridge behavior",
      },
    ],
    remaining_friction: [
      "live-data browser/runtime reuse dogfood still needs seeded memory rows",
      "persisted return binding table is not decided yet",
    ],
    follow_up_candidate_memory_preview: {
      title: "Return Binding preview should be dogfooded",
      summary:
        "The next slice should validate whether this preview links a reuse packet to a returned envelope clearly enough.",
      source_refs: ["pr:551", "pr:552"],
      risk_notes: ["do not persist return bindings in the preview layer"],
      carry_forward_questions: [
        "Should live-data reuse dogfood happen before persistence?",
      ],
      suggested_next_review_action:
        "Dogfood with the PR #551/#552 loop before adding storage.",
    },
    operator_notes: ["preview-only return relationship"],
    nowIso: "2026-06-14T12:01:00.000Z",
  });

  assert.equal(
    result.binding.binding_version,
    returnBinding.PERSPECTIVE_MEMORY_REUSE_RETURN_BINDING_VERSION,
  );
  assert.equal(
    result.binding.follow_up_candidate_memory_preview.preview_version,
    returnBinding.PERSPECTIVE_MEMORY_REUSE_RETURN_BINDING_PREVIEW_VERSION,
  );
  assert.equal(
    result.binding.binding_id,
    "perspective-memory-reuse-return-binding:reuse-packet-551:codex-run-552:returned-envelope-552",
  );
  assert.equal(result.binding.reuse_packet_id, "reuse-packet:551");
  assert.equal(result.binding.codex_run_ref, "codex-run:552");
  assert.equal(result.binding.returned_envelope_ref, "returned-envelope:552");
  assert.deepEqual(result.binding.changed_files, [
    "lib/perspective-ingest/perspective-memory-reuse-return-binding.ts",
    "docs/PERSPECTIVE_MEMORY_REUSE_RETURN_BINDING_V0_1.md",
    "reports/2026-06-14-perspective-memory-reuse-return-binding.md",
  ]);
  assert.equal(result.binding.verification.length, 2);
  assert.equal(
    result.binding.verification[0].command,
    "npm run smoke:perspective-memory-reuse-return-binding",
  );
  assert.equal(result.binding.verification[0].status, "passed");
  assert.equal(result.binding.skipped_checks.length, 2);
  assert.deepEqual(result.binding.skipped_checks[0], {
    check: "runtime/browser validation",
    reason: "preview helper only; no runtime route added",
  });
  assert.equal(result.binding.remaining_friction.length, 2);
  assert.equal(
    result.binding.follow_up_candidate_memory_preview.preview_only,
    true,
  );
  assert.equal(
    result.binding.return_quality_summary.complete_enough_for_future_memory_review,
    true,
  );
  assert.deepEqual(result.binding.return_quality_summary.missing_return_sections, []);
  assertIncludesAll(result.return_binding_summary, [
    "# Perspective Memory Reuse Return Binding",
    "reuse_packet_id: reuse-packet:551",
    "codex_run_ref: codex-run:552",
    "returned_envelope_ref: returned-envelope:552",
    "complete_enough_for_future_memory_review: true",
    "Return Binding preview should be dogfooded",
    "Preview only; no memory item created.",
  ]);

  for (const [key, value] of Object.entries(result.binding.authority_boundary)) {
    if (key === "deterministic_local_preview" || key === "return_binding_created") {
      assert.equal(value, true, `${key} must be true`);
    } else {
      assert.equal(value, false, `${key} must be false`);
    }
  }

  for (const [key, value] of Object.entries(
    result.binding.follow_up_candidate_memory_preview.authority_boundary,
  )) {
    assert.equal(value, false, `${key} must be false`);
  }
}

function assertMissingReturnSections() {
  const result = returnBinding.buildPerspectiveMemoryReuseReturnBinding({
    reuse_packet_id: "",
    codex_run_ref: "",
    returned_envelope_ref: "",
    returned_at: "",
    changed_files: [],
    verification: [],
    skipped_checks: [],
    remaining_friction: [],
    follow_up_candidate_memory_preview: {
      title: "",
      summary: "",
    },
    operator_notes: [],
    nowIso: "2026-06-14T12:02:00.000Z",
  });

  assert.equal(
    result.binding.return_quality_summary.complete_enough_for_future_memory_review,
    false,
  );
  assertIncludesAll(result.binding.return_quality_summary.missing_return_sections, [
    "reuse_packet_id",
    "codex_run_ref",
    "returned_envelope_ref",
    "returned_at",
    "changed_files",
    "verification",
    "skipped_checks",
    "remaining_friction",
    "follow_up_candidate_memory_preview.title",
    "follow_up_candidate_memory_preview.summary",
  ]);
  assertIncludesAll(result.return_binding_summary, [
    "complete_enough_for_future_memory_review: false",
    "## Missing Return Sections",
    "reuse_packet_id",
    "follow_up_candidate_memory_preview.summary",
  ]);
}

function assertDocsReportsAndBoundary() {
  for (const text of [docText, reportText]) {
    assertIncludesAll(text, [
      "Perspective Memory Reuse Return Binding v0.1",
      "reuse_packet_id -> codex_run_ref -> returned_envelope_ref -> follow-up",
      "perspective_memory_reuse_return_binding.v0.1",
      "perspective_memory_reuse_return_binding_preview.v0.1",
      "follow_up_candidate_memory_preview",
      "complete enough for future memory review",
      "preview-only",
      "no memory item created",
      "no product boundary record created",
      "no persistence write",
      "no Core decision",
      "no Core memory",
      "no runtime injection",
      "no automatic synthesis",
      "provider/model calls",
      "OpenAI API calls",
      "Codex SDK execution",
      "MCP tool calls",
      "GitHub mutation from scripts",
      "DB schema",
      "proof/evidence writes",
      "hidden background daemons",
      "Augnes state commit/reject authority",
      "Next Recommended PR",
    ]);
  }
  assertIncludesAll(reportText, [
    "PR #551",
    "/tmp/augnes-demo.db",
    "zero persisted memory rows",
    "live-data browser/runtime dogfood remains future work",
  ]);
}

function assertNoForbiddenImplementationMarkers() {
  assertNoIncludes(helperText, [
    "api.openai.com",
    "new OpenAI",
    "openai.chat",
    "@openai/codex",
    "CodexSDK",
    "callMcpTool",
    "McpClient",
    "new Octokit",
    "@octokit",
    "api.github.com",
    "fetch(",
    "CREATE TABLE",
    "ALTER TABLE",
    "INSERT INTO",
    "UPDATE perspective",
    "recordEvidence",
    "writeFileSync",
    "appendFileSync",
    "runtime_started: true",
    "hidden_background_daemon_created: true",
    "augnes_state_commit_reject_created: true",
    "return_binding_persisted: true",
    "reuse_packet_persisted: true",
    "proof_evidence_written: true",
    "db_schema_changed: true",
    "provider_model_call_created: true",
    "openai_api_call_created: true",
    "codex_sdk_execution_created: true",
    "mcp_tool_call_created: true",
    "github_mutation_created: true",
  ]);
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
