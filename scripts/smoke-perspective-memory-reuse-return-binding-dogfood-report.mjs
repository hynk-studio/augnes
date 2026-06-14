import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const returnBinding = await import(
  "../lib/perspective-ingest/perspective-memory-reuse-return-binding.ts"
);

const packageFile = "package.json";
const reportFile =
  "reports/dogfood/2026-06-14-perspective-memory-reuse-return-binding-dogfood.md";
const scriptFile =
  "scripts/smoke-perspective-memory-reuse-return-binding-dogfood-report.mjs";

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const reportText = readFileSync(reportFile, "utf8");
const scriptText = readFileSync(scriptFile, "utf8");

assertStaticFilesAndScript();
assertReportContract();
assertReturnBindingFixture();
assertBoundary();
assertNoForbiddenScriptMarkers();

console.log("PASS smoke:perspective-memory-reuse-return-binding-dogfood-report");

function assertStaticFilesAndScript() {
  for (const file of [reportFile, scriptFile]) {
    assert.equal(existsSync(file), true, `${file} must exist`);
  }

  assert.equal(
    packageJson.scripts[
      "smoke:perspective-memory-reuse-return-binding-dogfood-report"
    ],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-perspective-memory-reuse-return-binding-dogfood-report.mjs",
  );
}

function assertReportContract() {
  assertIncludesAll(reportText, [
    "# Dogfood Perspective Memory Reuse Return Binding v0.1",
    "## Summary",
    "## Environment",
    "## Dogfood task",
    "## Return binding fixture/input used",
    "## Binding preview result",
    "## Findings",
    "## User-facing/operator friction",
    "## Changed files",
    "## Verification",
    "## Skipped checks with concrete reasons",
    "## Cleanup status",
    "## Remaining friction",
    "## Boundary",
    "## Next recommended PR",
    "PR #552 merged prerequisite",
    "PR #551 dogfood context",
    "reuse_packet_id -> codex_run_ref -> returned_envelope_ref -> follow-up candidate memory",
    "changed_files",
    "verification",
    "skipped checks with concrete reasons",
    "remaining friction",
    "follow_up_candidate_memory_preview",
    "complete_enough_for_future_memory_review",
    "missing return sections",
    "missing_return_sections",
    "Cleanup status",
    "No product/helper code changed",
    "no product/helper code changed",
    "Next recommended PR: live-data browser/runtime reuse dogfood with seeded",
    "persisted memory rows before adding any persisted return binding table",
  ]);
}

function assertReturnBindingFixture() {
  const result = returnBinding.buildPerspectiveMemoryReuseReturnBinding({
    reuse_packet_id: "reuse-packet:pr-551-dogfood-context",
    codex_run_ref: "codex-run:pr-552-return-binding-preview",
    returned_envelope_ref: "returned-envelope:pr-552-pr-body",
    returned_at: "2026-06-14T10:53:47.000Z",
    changed_files: [
      "lib/perspective-ingest/perspective-memory-reuse-return-binding.ts",
      "docs/PERSPECTIVE_MEMORY_REUSE_RETURN_BINDING_V0_1.md",
      "reports/2026-06-14-perspective-memory-reuse-return-binding.md",
      "scripts/smoke-perspective-memory-reuse-return-binding.mjs",
      "package.json",
    ],
    verification: [
      {
        command: "npm run smoke:perspective-memory-items",
        status: "passed",
        notes: "PR #552 returned envelope stated this passed locally",
      },
      {
        command: "npm run smoke:perspective-memory-items-search",
        status: "passed",
        notes: "PR #552 returned envelope stated this passed locally",
      },
      {
        command: "npm run smoke:perspective-memory-items-review-workspace",
        status: "passed",
        notes: "PR #552 returned envelope stated this passed locally",
      },
      {
        command: "npm run smoke:perspective-memory-items-reuse-packet",
        status: "passed",
        notes: "PR #552 returned envelope stated this passed locally",
      },
      {
        command: "npm run smoke:perspective-memory-reuse-packet-dogfood-report",
        status: "passed",
        notes:
          "PR #552 returned envelope stated this passed before later cleanup removed the script",
      },
      {
        command: "npm run smoke:perspective-memory-reuse-return-binding",
        status: "passed",
        notes: "PR #552 returned envelope stated this passed locally",
      },
      {
        command: "npm run smoke:augnes-codex-bootstrap",
        status: "passed",
        notes: "PR #552 returned envelope stated this passed locally",
      },
      {
        command: "npm run smoke:augnes-codex-doctor",
        status: "passed",
        notes: "PR #552 returned envelope stated this passed locally",
      },
      {
        command: "npm run smoke:augnes-codex-prepare",
        status: "passed",
        notes: "PR #552 returned envelope stated this passed locally",
      },
      {
        command: "npm run smoke:augnes-operator-plugin-scaffold",
        status: "passed",
        notes: "PR #552 returned envelope stated this passed locally",
      },
      {
        command: "npm run smoke:augnes-operator-plugin-hooks",
        status: "passed",
        notes: "PR #552 returned envelope stated this passed locally",
      },
      {
        command: "npm run typecheck",
        status: "passed",
        notes: "PR #552 returned envelope stated this passed locally",
      },
      {
        command: "git diff --check",
        status: "passed",
        notes: "PR #552 returned envelope stated this passed locally",
      },
      {
        command: "git diff --cached --check",
        status: "passed",
        notes: "PR #552 returned envelope stated this passed locally",
      },
    ],
    skipped_checks: [
      {
        check: "runtime/browser validation",
        reason:
          "PR #552 added no route and no runtime behavior; helper/static smoke and typecheck covered the slice",
      },
      {
        check: "runtime startup",
        reason: "PR #552 preview layer did not require runtime",
      },
      {
        check: "MCP bridge startup",
        reason: "PR #552 preview layer did not require bridge behavior",
      },
      {
        check: "MCP tools",
        reason: "PR #552 boundary prohibited MCP tool calls",
      },
      {
        check: "provider/model checks and OpenAI API calls",
        reason: "PR #552 boundary prohibited them",
      },
      {
        check: "Codex SDK",
        reason: "PR #552 boundary prohibited Codex SDK execution",
      },
      {
        check: "setup execution and setup/prepare polish",
        reason: "PR #552 did not change setup/prepare behavior",
      },
      {
        check: "secrets and config reads",
        reason: "PR #552 did not need credentialed behavior",
      },
    ],
    remaining_friction: [
      "/tmp/augnes-demo.db had the perspective_memory_items table but zero persisted memory rows",
      "fixture-backed validation was useful but live-data browser/runtime dogfood remains future work",
      "persisted return binding storage is not justified by this preview alone",
    ],
    follow_up_candidate_memory_preview: {
      title: "Dogfood Return Binding with the PR #551/#552 loop",
      summary:
        "Return Binding preserved the reuse-packet-to-Codex-return chain and should carry forward live-data browser/runtime reuse dogfood with seeded persisted memory rows before any persisted return binding table.",
      source_refs: [
        "pr:551",
        "pr:552",
        "report:2026-06-14-perspective-memory-reuse-return-binding-dogfood",
      ],
      risk_notes: [
        "preview-only; do not create memory automatically",
        "fixture-backed validation does not prove live-data route usability",
      ],
      carry_forward_questions: [
        "Do seeded persisted memory rows make browser/runtime reuse dogfood clear enough?",
        "Is there a concrete product reason to persist return bindings now?",
      ],
      suggested_next_review_action:
        "Run live-data browser/runtime reuse dogfood with seeded persisted memory rows before storage work.",
    },
    operator_notes: [
      "dogfood report/smoke/package only",
      "no product/helper blocker found",
    ],
    nowIso: "2026-06-14T12:30:00.000Z",
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
    "perspective-memory-reuse-return-binding:reuse-packet-pr-551-dogfood-context:codex-run-pr-552-return-binding-preview:returned-envelope-pr-552-pr-body",
  );
  assert.equal(
    result.binding.reuse_packet_id,
    "reuse-packet:pr-551-dogfood-context",
  );
  assert.equal(
    result.binding.codex_run_ref,
    "codex-run:pr-552-return-binding-preview",
  );
  assert.equal(
    result.binding.returned_envelope_ref,
    "returned-envelope:pr-552-pr-body",
  );
  assert.deepEqual(result.binding.changed_files, [
    "lib/perspective-ingest/perspective-memory-reuse-return-binding.ts",
    "docs/PERSPECTIVE_MEMORY_REUSE_RETURN_BINDING_V0_1.md",
    "reports/2026-06-14-perspective-memory-reuse-return-binding.md",
    "scripts/smoke-perspective-memory-reuse-return-binding.mjs",
    "package.json",
  ]);
  assert.equal(result.binding.verification.length, 14);
  assert.equal(result.binding.skipped_checks.length, 8);
  assert.equal(result.binding.remaining_friction.length, 3);
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
    "reuse_packet_id: reuse-packet:pr-551-dogfood-context",
    "codex_run_ref: codex-run:pr-552-return-binding-preview",
    "returned_envelope_ref: returned-envelope:pr-552-pr-body",
    "complete_enough_for_future_memory_review: true",
    "Dogfood Return Binding with the PR #551/#552 loop",
    "Preview only; no memory item created.",
  ]);

  const incomplete = returnBinding.buildPerspectiveMemoryReuseReturnBinding({
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
    nowIso: "2026-06-14T12:35:00.000Z",
  });

  assert.equal(
    incomplete.binding.return_quality_summary.complete_enough_for_future_memory_review,
    false,
  );
  assertIncludesAll(incomplete.binding.return_quality_summary.missing_return_sections, [
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
}

function assertBoundary() {
  assertIncludesAll(reportText, [
    "This PR is a bounded dogfood validation PR for the merged Return Binding preview.",
    "no runtime authority, DB schema changes, migrations, setup/prepare polish, provider/model calls, OpenAI API calls, Codex SDK execution, MCP tool calls, GitHub mutation from scripts, proof/evidence writes, perspective-memory persistence writes, reuse packet persistence, return binding persistence, product boundary creation, automatic synthesis, automatic memory creation, default/user DB writes, hidden background daemons, or Augnes state commit/reject authority",
    "Runtime/browser validation skipped because this PR changes no route, UI, or browser-visible surface.",
    "Runtime startup skipped because this report/smoke/package validation does not require an app process.",
    "MCP bridge startup skipped because no bridge behavior changed.",
    "MCP tool calls skipped because the boundary forbids adding MCP tool calls.",
    "Provider/model checks and OpenAI API calls skipped because the boundary forbids provider/model calls and OpenAI API calls.",
    "Codex SDK execution skipped because the boundary forbids Codex SDK execution.",
    "Setup execution and setup/prepare polish skipped because this PR does not change setup/prepare behavior.",
    "Default/user DB inspection skipped because this PR must not perform default/user DB writes and does not need DB state.",
  ]);
}

function assertNoForbiddenScriptMarkers() {
  assertNoIncludes(scriptText, [
    ["api", ".openai", ".com"].join(""),
    ["new", " OpenAI"].join(""),
    ["@openai", "/codex"].join(""),
    ["Codex", "SDK"].join(""),
    ["call", "Mcp", "Tool"].join(""),
    ["Mcp", "Client"].join(""),
    ["new", " Octokit"].join(""),
    ["@octo", "kit"].join(""),
    ["api", ".github", ".com"].join(""),
    ["fetch", "("].join(""),
    ["CREATE", " TABLE"].join(""),
    ["ALTER", " TABLE"].join(""),
    ["INSERT", " INTO"].join(""),
    ["UPDATE", " perspective"].join(""),
    ["record", "Evidence"].join(""),
    ["write", "FileSync"].join(""),
    ["append", "FileSync"].join(""),
  ]);
}

function assertIncludesAll(text, snippets) {
  const normalizedText = normalizeWhitespace(text);
  for (const snippet of snippets) {
    assert(
      normalizedText.includes(normalizeWhitespace(snippet)),
      `expected source to include ${snippet}`,
    );
  }
}

function assertNoIncludes(text, snippets) {
  const normalizedText = normalizeWhitespace(text);
  for (const snippet of snippets) {
    assert(
      !normalizedText.includes(normalizeWhitespace(snippet)),
      `source must not include ${snippet}`,
    );
  }
}

function normalizeWhitespace(value) {
  const text = Array.isArray(value) ? value.join("\n") : String(value);
  return text.replace(/\s+/g, " ");
}
