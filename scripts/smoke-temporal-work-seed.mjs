import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const workId = "AG-TEMPORAL-INTERPRETATION";
const scope = "project:augnes";
const tempDir = mkdtempSync(path.join(os.tmpdir(), "augnes-temporal-work-seed-"));
const dbPath = path.join(tempDir, "augnes.db");
process.env.AUGNES_DB_PATH = dbPath;
process.env.OPENAI_API_KEY = "smoke-openai-key-must-not-be-used";

let fetchCalls = 0;
globalThis.fetch = async () => {
  fetchCalls += 1;
  throw new Error("Temporal work seed smoke must not call fetch.");
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

  const workRoute = await import("../app/api/work/[work_id]/route.ts");
  const workBriefRoute = await import("../app/api/work/[work_id]/brief/route.ts");
  const evidenceRecordsRoute = await import("../app/api/evidence/records/route.ts");
  const evidencePackRoute = await import("../app/api/evidence-pack/route.ts");
  const { openDatabase } = await import("./db-common.mjs");
  const { getWorkItem, listWorkItems } = await import("../lib/work.ts");

  const db = openDatabase();
  const protectedBefore = snapshotProtectedCounts(db);
  const directWork = getWorkItem(workId.toLowerCase(), scope);
  const workItems = listWorkItems(scope);
  const ag004 = getWorkItem("AG-004", scope);

  assert.ok(directWork, "Temporal Interpretation work item should exist");
  assert.equal(directWork.work_id, workId);
  assert.equal(directWork.scope, scope);
  assert.equal(
    directWork.title,
    "Temporal Interpretation validation and persistence preparation",
  );
  assert.equal(directWork.status, "planned");
  assert.equal(directWork.priority, "normal");
  assert.ok(
    directWork.summary.includes("Dedicated work anchor for Temporal Interpretation"),
    "summary should describe the Temporal Interpretation anchor",
  );
  assert.deepEqual(directWork.related_state_keys, [
    "temporal.interpretation.preview",
    "temporal.interpretation.validation",
    "temporal.interpretation.persistence_design",
  ]);
  assert.deepEqual(directWork.links.evidence_target_refs, [
    "temporal:v0.2:hardening",
    "temporal:v0.2:route-review",
    "temporal:v0.2:cockpit-validation",
    "temporal:v0.2:openai-validation",
    "temporal:persistence-design:v0.1",
    "temporal:work-binding:v0.1",
  ]);
  assert.equal(directWork.links.lifecycle_stage, "design/validation/persistence-prep");
  assert.equal(directWork.links.owner_surface, "user/Core");

  assert.ok(
    workItems.some((item) => item.work_id === workId),
    "work list should include the Temporal Interpretation work item",
  );
  assert.ok(ag004, "AG-004 should still exist");
  assert.equal(ag004.title, "Codex completion protocol");
  db.close();

  const workResponse = await workRoute.GET(
    new Request(`http://localhost/api/work/${workId.toLowerCase()}?scope=${encodeURIComponent(scope)}`),
    { params: Promise.resolve({ work_id: workId.toLowerCase() }) },
  );
  assert.equal(workResponse.status, 200, "work read route should return 200");
  const workPayload = await workResponse.json();
  assert.equal(workPayload.work.work_id, workId);

  const briefResponse = await workBriefRoute.GET(
    new Request(
      `http://localhost/api/work/${encodeURIComponent(workId)}%20?scope=${encodeURIComponent(scope)}`,
    ),
    { params: Promise.resolve({ work_id: `${workId} ` }) },
  );
  assert.equal(briefResponse.status, 200, "work brief route should return 200");
  const briefPayload = await briefResponse.json();
  assert.equal(briefPayload.work_id, workId);
  assert.ok(
    briefPayload.codex_handoff.task_brief.includes(workId),
    "work brief should include the work anchor in handoff text",
  );
  assert.ok(
    briefPayload.codex_handoff.constraints.some((constraint) =>
      constraint.includes("docs/PR_REVIEW_ANCHOR_CONVENTION_V0_1.md"),
    ),
    "work brief should point Codex to the PR review anchor convention",
  );
  assert.ok(
    briefPayload.codex_handoff.constraints.some(
      (constraint) =>
        constraint.includes("review aids only") &&
        constraint.includes("record missing exact external ChatGPT/Codex prompt or review text as a gap"),
    ),
    "work brief should keep PR review anchors bounded and gap-oriented",
  );

  const evidenceResponse = await evidenceRecordsRoute.POST(
    jsonRequest("http://localhost/api/evidence/records", {
      scope,
      work_id: workId.toLowerCase(),
      target_surface: "docs",
      target_ref: "temporal:work-seed:v0.1",
      evidence_kind: "check_passed",
      label: "Temporal work seed smoke evidence",
      status: "passed",
      command: "npm run smoke:temporal-work-seed",
      result_summary:
        "Temporal Interpretation seeded work item accepted a bounded evidence record.",
      source_surface: "local_runtime",
      source_ref: "scripts/smoke-temporal-work-seed.mjs",
      created_by: "codex-smoke",
    }),
  );
  assert.equal(evidenceResponse.status, 201, "evidence POST should accept work_id");
  const evidencePayload = await evidenceResponse.json();
  assert.equal(evidencePayload.record.work_id, workId);

  const evidenceListResponse = await evidenceRecordsRoute.GET(
    new Request(
      `http://localhost/api/evidence/records?scope=${encodeURIComponent(scope)}&work_id=${encodeURIComponent(workId)}`,
    ),
  );
  assert.equal(evidenceListResponse.status, 200, "evidence GET should return 200");
  const evidenceListPayload = await evidenceListResponse.json();
  assert.ok(
    evidenceListPayload.records.some(
      (record) => record.evidence_id === evidencePayload.record.evidence_id,
    ),
    "evidence GET by work_id should include the smoke evidence record",
  );

  const evidencePackResponse = await evidencePackRoute.GET(
    new Request(
      `http://localhost/api/evidence-pack?scope=${encodeURIComponent(scope)}&work_id=${encodeURIComponent(workId)}`,
    ),
  );
  assert.equal(evidencePackResponse.status, 200, "Evidence Pack by work_id should return 200");
  const evidencePack = await evidencePackResponse.json();
  assert.equal(evidencePack.selection.mode, "by_work_id");
  assert.equal(evidencePack.selection.work_id, workId);
  assert.equal(evidencePack.work_trace.work_id, workId);
  assert.ok(
    evidencePack.gaps.includes("No publication trace was found for the selected evidence"),
    "Evidence Pack should remain safe and surface gaps when no publication exists",
  );

  const dbAfter = openDatabase();
  const protectedAfter = snapshotProtectedCounts(dbAfter);
  assert.deepEqual(
    protectedAfter,
    protectedBefore,
    "evidence/work read checks must not mutate protected authority rows",
  );
  dbAfter.close();

  assert.equal(fetchCalls, 0, "smoke should not call fetch");

  console.log(
    JSON.stringify(
      {
        smoke: "temporal-work-seed",
        db_path: dbPath,
        work_id: workId,
        work_seeded: true,
        work_id_format_supported: true,
        work_read_api_ok: true,
        work_brief_api_ok: true,
        ag_004_preserved: true,
        evidence_record_id: evidencePayload.record.evidence_id,
        evidence_api_accepts_work_id: true,
        evidence_pack_by_work_id_safe: true,
        protected_authority_rows_mutated: false,
        fetch_calls: fetchCalls,
        openai_calls: 0,
        github_publication_adapter_calls: 0,
        approval_publish_replay_behavior: false,
      },
      null,
      2,
    ),
  );
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

function jsonRequest(url, body) {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
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
    "state_delta_proposals",
    "state_entries",
    "state_tensions",
    "state_transitions",
  ];

  return Object.fromEntries(
    tables.map((table) => [
      table,
      db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count,
    ]),
  );
}
