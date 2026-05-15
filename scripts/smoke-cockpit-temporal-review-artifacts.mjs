import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const cockpitPath = "components/augnes-cockpit.tsx";
const cssPath = "app/globals.css";
const packagePath = "package.json";
const workId = "AG-TEMPORAL-INTERPRETATION";
const scope = "project:augnes";

for (const requiredPath of [cockpitPath, cssPath, packagePath]) {
  if (!existsSync(requiredPath)) {
    throw new Error(`Missing required file: ${requiredPath}`);
  }
}

const cockpit = readFileSync(cockpitPath, "utf8");
const css = readFileSync(cssPath, "utf8");
const pkg = JSON.parse(readFileSync(packagePath, "utf8"));

const requiredCockpitText = [
  "TemporalReviewArtifact",
  "TemporalReviewArtifactsResponse",
  "temporalReviewArtifacts",
  "temporalReviewArtifactsError",
  "temporalReviewArtifactsBusy",
  "temporalReviewArtifactsRequested",
  "selectedTemporalReviewArtifactId",
  "loadTemporalReviewArtifacts",
  "TemporalReviewArtifactBrowserPanel",
  "TemporalReviewArtifactCard",
  "TemporalReviewArtifactDetail",
  "TemporalReviewArtifactRefs",
  "TemporalReviewArtifactBoundaries",
  "Temporal Review Artifacts",
  "Load Temporal Review Artifacts",
  "Refresh Temporal Review Artifacts",
  "/api/temporal-interpretation/review-artifacts?scope=",
  "method: \"GET\"",
  "reviewer_verdict",
  "guardrail_passed",
  "capture_mode",
  "generator",
  "linked_evidence_record_ids",
  "linked_session_id",
  "linked_pr_url",
  "manual_review_report_path",
  "boundaries",
  "gaps",
  "reviewer_verdict is review metadata, not approval",
  "guardrail_passed is",
  "Cockpit DOM is not truth",
];

for (const text of requiredCockpitText) {
  if (!cockpit.includes(text)) {
    throw new Error(`Cockpit Temporal review artifact browser missing: ${text}`);
  }
}

const requiredStyles = [
  ".temporal-review-artifacts-shell",
  ".temporal-review-artifacts-heading",
  ".temporal-review-artifacts-grid",
  ".temporal-review-artifact-card",
  ".temporal-review-artifact-detail",
  ".temporal-review-artifact-refs",
  ".temporal-review-artifact-boundaries",
  ".temporal-review-artifact-gaps",
];

for (const text of requiredStyles) {
  if (!css.includes(text)) {
    throw new Error(`Cockpit Temporal review artifact style missing: ${text}`);
  }
}

assert.equal(
  pkg.scripts?.["smoke:cockpit-temporal-review-artifacts"],
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-cockpit-temporal-review-artifacts.mjs",
  "Missing smoke:cockpit-temporal-review-artifacts package script.",
);

const browserFunctionNames = [
  "loadTemporalReviewArtifacts",
  "TemporalReviewArtifactBrowserPanel",
  "TemporalReviewArtifactSummary",
  "TemporalReviewArtifactCard",
  "TemporalReviewArtifactDetail",
  "TemporalReviewArtifactField",
  "TemporalReviewArtifactRefs",
  "TemporalReviewArtifactGaps",
  "TemporalReviewArtifactBoundaries",
];
const browserCode = browserFunctionNames
  .map((functionName) => extractFunctionBlock(cockpit, functionName))
  .join("\n");

for (const forbiddenText of [
  "method: \"POST\"",
  "method: 'POST'",
  "/api/temporal-interpretation/review-artifacts/capture",
  "createTemporalReviewArtifact",
  "captureTemporalReviewArtifact",
  "updateTemporalReviewArtifact",
  "deleteTemporalReviewArtifact",
  "approveTemporalReviewArtifact",
  "publishTemporalReviewArtifact",
  "retryTemporalReviewArtifact",
  "replayTemporalReviewArtifact",
  "commitTemporalReviewArtifact",
  "rejectTemporalReviewArtifact",
]) {
  if (browserCode.includes(forbiddenText)) {
    throw new Error(
      `Temporal review artifact browser introduced forbidden behavior: ${forbiddenText}`,
    );
  }
}

const buttonLabels = Array.from(
  browserCode.matchAll(/<button[\s\S]*?<\/button>/g),
).map((match) => match[0].toLowerCase());
for (const forbiddenControl of [
  "approve",
  "publish",
  "retry",
  "replay",
  "commit",
  "reject",
  "create artifact",
  "update artifact",
  "delete artifact",
]) {
  if (buttonLabels.some((button) => button.includes(forbiddenControl))) {
    throw new Error(
      `Temporal review artifact browser includes forbidden button/control text: ${forbiddenControl}`,
    );
  }
}
if (buttonLabels.some((button) => />\s*capture\s*</.test(button))) {
  throw new Error(
    "Temporal review artifact browser includes forbidden button/control text: capture",
  );
}

const tempDir = mkdtempSync(
  path.join(os.tmpdir(), "augnes-cockpit-temporal-review-artifacts-"),
);
const dbPath = path.join(tempDir, "augnes.db");
process.env.AUGNES_DB_PATH = dbPath;
delete process.env.OPENAI_API_KEY;

let fetchCalls = 0;
globalThis.fetch = async () => {
  fetchCalls += 1;
  throw new Error("Cockpit Temporal review artifacts smoke must not call fetch.");
};

try {
  for (const [script, label] of [
    ["db:reset", "reset"],
    ["db:migrate", "migrate"],
    ["demo:seed", "demo seed"],
  ]) {
    execFileSync("npm", ["run", script], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        AUGNES_DB_PATH: dbPath,
      },
      encoding: "utf8",
      stdio: "pipe",
    });
    assert.ok(dbPath, `${label} should run against a temp DB path`);
  }

  const { openDatabase } = await import("./db-common.mjs");
  const { createEvidenceRecord } = await import("../lib/evidence-records.ts");
  const { insertTemporalPreviewReviewArtifactForSmoke } = await import(
    "../lib/temporal-review-artifacts.ts"
  );
  const { buildValidTemporalPreviewReviewArtifactFixture } = await import(
    "../lib/temporal-review-artifact-fixtures.ts"
  );
  const listRoute = await import(
    "../app/api/temporal-interpretation/review-artifacts/route.ts"
  );

  const evidenceRecord = createEvidenceRecord({
    evidence_id: "evidence:cockpit-temporal-review-artifacts-smoke",
    scope,
    work_id: workId,
    evidence_kind: "check_passed",
    label: "Cockpit Temporal review artifact browser smoke",
    status: "passed",
    result_summary:
      "Smoke inserted bounded review artifact rows and verified the read-only list route for Cockpit browser source.",
    source_surface: "local_runtime",
    source_ref: "scripts/smoke-cockpit-temporal-review-artifacts.mjs",
    metadata: { smoke: "cockpit-temporal-review-artifacts" },
    created_by: "codex-smoke",
    created_at: "2026-05-15T00:00:00.000Z",
  });

  insertTemporalPreviewReviewArtifactForSmoke(
    buildValidTemporalPreviewReviewArtifactFixture({
      artifact_id: "temporal-review:cockpit-browser-older",
      source_ref: "scripts/smoke-cockpit-temporal-review-artifacts.mjs#older",
      preview_hash: "sha256:cockpit-temporal-review-artifacts-older",
      reviewer_verdict: "pass_with_notes",
      guardrail_passed: true,
      capture_mode: "route_capture",
      generator: "mock",
      model: null,
      created_by: "codex-smoke",
      created_at: "2026-05-14T00:00:00.000Z",
      updated_at: "2026-05-14T00:00:00.000Z",
    }),
  );

  insertTemporalPreviewReviewArtifactForSmoke(
    buildValidTemporalPreviewReviewArtifactFixture({
      artifact_id: "temporal-review:cockpit-browser-latest",
      source_ref: "scripts/smoke-cockpit-temporal-review-artifacts.mjs#latest",
      preview_hash: "sha256:cockpit-temporal-review-artifacts-latest",
      reviewer_verdict: "fail",
      guardrail_passed: false,
      capture_mode: "route_capture",
      generator: "mock",
      model: "temporal-mock-v0",
      linked_evidence_record_ids: [evidenceRecord.evidence_id],
      linked_session_id: "session:demo-runtime-core",
      linked_pr_url: "https://github.com/Aurna-code/augnes/pull/133",
      manual_review_report_path:
        "docs/TEMPORAL_INTERPRETATION_MANUAL_REVIEW_REPORT_ROUTE_CAPTURE_V0_1.md",
      created_by: "codex-smoke",
      created_at: "2026-05-15T00:00:00.000Z",
      updated_at: "2026-05-15T00:00:00.000Z",
    }),
  );

  const dbBefore = openDatabase();
  const protectedBefore = snapshotProtectedCounts(dbBefore);
  dbBefore.close();

  const listResponse = await listRoute.GET(
    new Request(
      `http://localhost/api/temporal-interpretation/review-artifacts?scope=${encodeURIComponent(scope)}&work_id=${encodeURIComponent(workId)}&limit=20`,
    ),
  );
  assert.equal(listResponse.status, 200, "Temporal review artifact GET list should return 200");
  const listPayload = await listResponse.json();
  assert.equal(listPayload.count, 2, "GET list should return seeded artifacts");
  assert.equal(
    listPayload.artifacts[0].artifact_id,
    "temporal-review:cockpit-browser-latest",
    "GET list should order latest artifact first",
  );
  assert.equal(listPayload.artifacts[0].reviewer_verdict, "fail");
  assert.equal(listPayload.artifacts[0].guardrail_passed, false);
  assert.deepEqual(listPayload.artifacts[0].linked_evidence_record_ids, [
    evidenceRecord.evidence_id,
  ]);
  assert.equal(listPayload.artifacts[0].linked_session_id, "session:demo-runtime-core");
  assert.equal(listPayload.artifacts[0].linked_pr_url, "https://github.com/Aurna-code/augnes/pull/133");
  assert.ok(
    listPayload.boundaries.some((boundary) =>
      boundary.includes("bounded review artifacts only"),
    ),
    "GET list should include read-only boundaries",
  );

  const emptyResponse = await listRoute.GET(
    new Request(
      `http://localhost/api/temporal-interpretation/review-artifacts?scope=${encodeURIComponent(scope)}&work_id=AG-TEMPORAL-EMPTY&limit=20`,
    ),
  );
  assert.equal(emptyResponse.status, 200, "Temporal review artifact empty GET should return 200");
  const emptyPayload = await emptyResponse.json();
  assert.equal(emptyPayload.count, 0, "empty GET should return count 0");
  assert.ok(emptyPayload.gaps.length > 0, "empty GET should surface API gaps");

  const dbAfter = openDatabase();
  const protectedAfter = snapshotProtectedCounts(dbAfter);
  dbAfter.close();
  assert.deepEqual(
    protectedAfter,
    protectedBefore,
    "Cockpit Temporal review artifact smoke must not mutate protected authority rows during GET verification",
  );
  assert.equal(fetchCalls, 0, "smoke should not call fetch/OpenAI/GitHub");

  console.log(
    JSON.stringify(
      {
        smoke: "cockpit-temporal-review-artifacts",
        panel_present: true,
        button_text_present: true,
        get_list_route_used: true,
        post_capture_route_used: false,
        write_controls_added: false,
        styles_present: true,
        runtime_get_list_rows: listPayload.count,
        no_artifact_empty_gap_verified: true,
        artifact_present_browser_source_verified: true,
        linked_evidence_session_pr_fields_visible: true,
        reviewer_verdict_guardrail_non_authority_copy: true,
        protected_authority_rows_mutated: false,
        openai_calls: 0,
        github_publication_adapter_calls: 0,
        fetch_calls: fetchCalls,
      },
      null,
      2,
    ),
  );
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

function extractFunctionBlock(source, functionName) {
  const startCandidates = [
    source.indexOf(`function ${functionName}`),
    source.indexOf(`async function ${functionName}`),
  ].filter((index) => index >= 0);
  const start = startCandidates.length ? Math.min(...startCandidates) : -1;
  if (start === -1) {
    throw new Error(`Missing function: ${functionName}`);
  }

  const nextFunctionCandidates = [
    source.indexOf("\nfunction ", start + 1),
    source.indexOf("\n  async function ", start + 1),
    source.indexOf("\n  function ", start + 1),
  ].filter((index) => index >= 0);
  const nextFunction = nextFunctionCandidates.length
    ? Math.min(...nextFunctionCandidates)
    : -1;
  return source.slice(start, nextFunction === -1 ? source.length : nextFunction);
}

function snapshotProtectedCounts(db) {
  const tables = [
    "action_records",
    "delivery_ledger",
    "mailbox_messages",
    "publication_approval_decisions",
    "publication_approval_requests",
    "publication_drafts",
    "publication_readiness_checks",
    "sessions",
    "state_delta_proposals",
    "state_entries",
    "state_tensions",
    "state_transitions",
    "verification_evidence_records",
  ];

  return Object.fromEntries(
    tables.map((table) => [
      table,
      db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count,
    ]),
  );
}
