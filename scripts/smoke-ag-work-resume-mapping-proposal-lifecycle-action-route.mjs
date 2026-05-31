import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const routePath = path.join(
  rootDir,
  "app",
  "api",
  "ag-work-resume",
  "mapping-proposal-records",
  "lifecycle-actions",
  "route.ts",
);
const corePath = path.join(
  rootDir,
  "lib",
  "ag-work-resume-mapping-proposal-lifecycle-action.ts",
);
const routeDocsPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTION_ROUTE_V0_1.md",
);
const helperDocsPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTION_HELPER_V0_1.md",
);
const designDocsPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTIONS_DESIGN_V0_1.md",
);
const gateDocsPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md",
);
const packagePath = path.join(rootDir, "package.json");
const tableName = "ag_work_resume_mapping_proposals";
const tempDir = mkdtempSync(
  path.join(os.tmpdir(), "augnes-ag-resume-mapping-proposal-lifecycle-route-"),
);
const dbPath = path.join(tempDir, "augnes.db");

process.env.AUGNES_DB_PATH = dbPath;
process.env.OPENAI_API_KEY = "smoke-openai-key-must-not-be-used";

let fetchCalls = 0;
let expectedProposalRowCount = 0;
globalThis.fetch = async () => {
  fetchCalls += 1;
  throw new Error("AG resume mapping proposal lifecycle route smoke must not call fetch.");
};

try {
  assert.equal(
    isPathInside(path.dirname(dbPath), rootDir),
    false,
    "smoke DB must be outside the repo",
  );
  assertFilesExist();
  assertPackageScripts();
  assertSourceGuards();
  assertDocsGuard();
  resetDb(dbPath);

  const { buildAgWorkResumePacketPreview } = await import(
    "../lib/ag-work-resume-packet.ts"
  );
  const {
    createAgWorkResumeMappingProposalRecord,
  } = await import("../lib/ag-work-resume-mapping-proposal-record.ts");
  const { POST } = await import(
    "../app/api/ag-work-resume/mapping-proposal-records/lifecycle-actions/route.ts"
  );

  assert.equal(typeof POST, "function", "lifecycle route must expose POST");

  const createFixture = makeFixtureCreator({
    buildAgWorkResumePacketPreview,
    createAgWorkResumeMappingProposalRecord,
  });
  const protectedBefore = snapshotProtectedCounts(dbPath);

  const withdrawTarget = createFixture("route-withdraw", { status: "proposed" });
  const withdrawPayload = await assertRouteSuccess({
    post: POST,
    body: {
      proposal_id: withdrawTarget.proposal_id,
      action: "withdraw",
      reviewed_by: "user-core:route",
      review_note: "Route withdraw proposed proposal.",
      reviewed_at: "2026-05-31T03:00:00.000Z",
    },
    action: "withdraw",
    proposalId: withdrawTarget.proposal_id,
    status: "withdrawn",
    reviewedAt: "2026-05-31T03:00:00.000Z",
  });
  assert.equal(withdrawPayload.result.record.review_note, "Route withdraw proposed proposal.");

  const rejectTarget = createFixture("route-reject", { status: "needs_review" });
  await assertRouteSuccess({
    post: POST,
    body: {
      proposal_id: rejectTarget.proposal_id,
      action: "reject",
      reviewed_by: "user-core:route",
      review_note: "Route reject needs_review proposal.",
      reviewed_at: "2026-05-31T03:01:00.000Z",
    },
    action: "reject",
    proposalId: rejectTarget.proposal_id,
    status: "rejected",
    reviewedAt: "2026-05-31T03:01:00.000Z",
  });

  const expireTarget = createFixture("route-expire", { status: "proposed" });
  await assertRouteSuccess({
    post: POST,
    body: {
      proposal_id: expireTarget.proposal_id,
      action: "expire",
      reviewed_by: "user-core:route",
      review_note: "Route expire proposed proposal.",
      reviewed_at: "2026-05-31T03:02:00.000Z",
    },
    action: "expire",
    proposalId: expireTarget.proposal_id,
    status: "expired",
    reviewedAt: "2026-05-31T03:02:00.000Z",
  });

  const supersedeTarget = createFixture("route-supersede-no-replacement", {
    status: "proposed",
  });
  const supersedeNoReplacement = await assertRouteSuccess({
    post: POST,
    body: {
      proposal_id: supersedeTarget.proposal_id,
      action: "supersede",
      reviewed_by: "user-core:route",
      review_note: "Route supersede without replacement.",
      reviewed_at: "2026-05-31T03:03:00.000Z",
    },
    action: "supersede",
    proposalId: supersedeTarget.proposal_id,
    status: "superseded",
    reviewedAt: "2026-05-31T03:03:00.000Z",
  });
  assert.equal(
    supersedeNoReplacement.result.record.superseded_by_proposal_id,
    null,
  );

  const supersedeWithReplacementTarget = createFixture(
    "route-supersede-with-replacement-target",
    { status: "needs_review" },
  );
  const replacement = createFixture("route-supersede-replacement", {
    status: "proposed",
  });
  const replacementBefore = readProposalRow(dbPath, replacement.proposal_id);
  const supersedeWithReplacement = await assertRouteSuccess({
    post: POST,
    body: {
      proposal_id: supersedeWithReplacementTarget.proposal_id,
      action: "supersede",
      reviewed_by: "user-core:route",
      review_note: "Route supersede with existing replacement.",
      reviewed_at: "2026-05-31T03:04:00.000Z",
      replacement_proposal_id: replacement.proposal_id,
    },
    action: "supersede",
    proposalId: supersedeWithReplacementTarget.proposal_id,
    status: "superseded",
    reviewedAt: "2026-05-31T03:04:00.000Z",
    supersededByProposalId: replacement.proposal_id,
  });
  assert.equal(
    supersedeWithReplacement.result.record.superseded_by_proposal_id,
    replacement.proposal_id,
  );
  assert.deepEqual(readProposalRow(dbPath, replacement.proposal_id), replacementBefore);

  const validationTarget = createFixture("route-validation-target", {
    status: "proposed",
  });
  await assertRouteFailureNoWrite({
    name: "wrong content-type",
    response: () =>
      POST(
        new Request(routeUrl(), {
          method: "POST",
          headers: { "content-type": "text/plain" },
          body: JSON.stringify({
            proposal_id: validationTarget.proposal_id,
            action: "withdraw",
            reviewed_by: "user-core:route",
            review_note: "Wrong content-type.",
          }),
        }),
      ),
    expectedHttpStatus: 400,
    expectedPayloadStatus: null,
  });
  await assertRouteFailureNoWrite({
    name: "invalid JSON",
    response: () =>
      POST(
        new Request(routeUrl(), {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "{",
        }),
      ),
    expectedHttpStatus: 400,
    expectedPayloadStatus: null,
  });
  await assertRouteFailureNoWrite({
    name: "non-object body",
    response: () => POST(jsonRequest(null)),
    expectedHttpStatus: 400,
    expectedPayloadStatus: null,
  });
  for (const invalidCase of [
    {
      name: "missing fields",
      body: {
        proposal_id: validationTarget.proposal_id,
        action: "withdraw",
      },
      httpStatus: 400,
      resultStatus: "invalid_input",
    },
    {
      name: "unknown action",
      body: {
        proposal_id: validationTarget.proposal_id,
        action: "confirm",
        reviewed_by: "user-core:route",
        review_note: "Unknown action.",
      },
      httpStatus: 400,
      resultStatus: "invalid_input",
    },
    {
      name: "malformed reviewed_at",
      body: {
        proposal_id: validationTarget.proposal_id,
        action: "withdraw",
        reviewed_by: "user-core:route",
        review_note: "Malformed reviewed_at.",
        reviewed_at: "2026-05-31T03:05:00Z",
      },
      httpStatus: 400,
      resultStatus: "invalid_input",
    },
    {
      name: "replacement for non-supersede",
      body: {
        proposal_id: validationTarget.proposal_id,
        action: "withdraw",
        reviewed_by: "user-core:route",
        review_note: "Replacement id not allowed.",
        replacement_proposal_id: replacement.proposal_id,
      },
      httpStatus: 400,
      resultStatus: "invalid_input",
    },
    {
      name: "replacement same as target",
      body: {
        proposal_id: validationTarget.proposal_id,
        action: "supersede",
        reviewed_by: "user-core:route",
        review_note: "Same replacement id.",
        replacement_proposal_id: validationTarget.proposal_id,
      },
      httpStatus: 400,
      resultStatus: "invalid_input",
    },
    {
      name: "db field rejected",
      body: {
        proposal_id: validationTarget.proposal_id,
        action: "withdraw",
        reviewed_by: "user-core:route",
        review_note: "Body db field is unsupported.",
        db: {},
      },
      httpStatus: 400,
      resultStatus: null,
    },
    {
      name: "now field rejected",
      body: {
        proposal_id: validationTarget.proposal_id,
        action: "withdraw",
        reviewed_by: "user-core:route",
        review_note: "Body now field is unsupported.",
        now: "2026-05-31T03:05:00.000Z",
      },
      httpStatus: 400,
      resultStatus: null,
    },
  ]) {
    await assertRouteFailureNoWrite({
      name: invalidCase.name,
      response: () => POST(jsonRequest(invalidCase.body)),
      expectedHttpStatus: invalidCase.httpStatus,
      expectedPayloadStatus: invalidCase.resultStatus,
    });
  }

  await assertRouteFailureNoWrite({
    name: "replacement not found",
    response: () =>
      POST(
        jsonRequest({
          proposal_id: validationTarget.proposal_id,
          action: "supersede",
          reviewed_by: "user-core:route",
          review_note: "Replacement missing.",
          reviewed_at: "2026-05-31T03:06:00.000Z",
          replacement_proposal_id: "ag-resume-mapping-proposal:not-found",
        }),
      ),
    expectedHttpStatus: 404,
    expectedPayloadStatus: "replacement_not_found",
  });
  await assertRouteFailureNoWrite({
    name: "proposal not found",
    response: () =>
      POST(
        jsonRequest({
          proposal_id: "ag-resume-mapping-proposal:not-found",
          action: "withdraw",
          reviewed_by: "user-core:route",
          review_note: "Target missing.",
          reviewed_at: "2026-05-31T03:07:00.000Z",
        }),
      ),
    expectedHttpStatus: 404,
    expectedPayloadStatus: "not_found",
  });
  await assertRouteFailureNoWrite({
    name: "not active",
    response: () =>
      POST(
        jsonRequest({
          proposal_id: withdrawPayload.result.record.proposal_id,
          action: "withdraw",
          reviewed_by: "user-core:route",
          review_note: "Already withdrawn.",
          reviewed_at: "2026-05-31T03:08:00.000Z",
        }),
      ),
    expectedHttpStatus: 409,
    expectedPayloadStatus: "not_active",
  });

  assertProtectedCounts(dbPath, protectedBefore);
  assertNoForbiddenTablesOrRows(dbPath);
  assert.equal(fetchCalls, 0);

  console.log(
    JSON.stringify(
      {
        smoke: "ag-work-resume-mapping-proposal-lifecycle-action-route",
        temp_db_path: dbPath,
        cases: [
          "package script is present",
          "route/docs/source guards pass",
          "writer-created fixture rows seed route tests",
          "route withdraw proposed succeeds",
          "route reject needs_review succeeds",
          "route expire proposed succeeds",
          "route supersede without replacement id succeeds",
          "route supersede with existing replacement id updates only target row",
          "wrong content-type, invalid JSON, and non-object body fail closed",
          "invalid inputs map deterministically to HTTP 400",
          "missing proposal and missing replacement map to HTTP 404",
          "not_active maps to HTTP 409",
          "proposal row count remains unchanged after lifecycle actions",
          "replacement row content remains unchanged",
          "protected table counts remain unchanged",
          "confirmed mapping/import/imported-context tables remain absent",
          "no fetch/network call observed",
        ],
      },
      null,
      2,
    ),
  );
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

function assertFilesExist() {
  for (const file of [
    routePath,
    corePath,
    routeDocsPath,
    helperDocsPath,
    designDocsPath,
    gateDocsPath,
    packagePath,
  ]) {
    assert.ok(existsSync(file), `${file} must exist`);
  }
}

function assertPackageScripts() {
  const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
  assert.equal(
    packageJson.scripts?.["smoke:ag-work-resume-mapping-proposal-lifecycle-action-route"],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-ag-work-resume-mapping-proposal-lifecycle-action-route.mjs",
  );
}

function assertSourceGuards() {
  const routeSource = readFileSync(routePath, "utf8");
  const importText = extractImportText(routeSource);
  for (const required of [
    /applyAgWorkResumeMappingProposalLifecycleAction/i,
    /runtime = "nodejs"/i,
    /dynamic = "force-dynamic"/i,
    /Request content-type must be application\/json/i,
    /replacement_not_found/i,
    /statusForResult/i,
  ]) {
    assert.match(routeSource, required, `route source must include ${required}`);
  }
  for (const forbiddenImport of [
    /node:http/i,
    /node:https/i,
    /node:net/i,
    /node:tls/i,
    /ag-work-resume-mapping-proposal-record-read/i,
    /ag-work-resume-mapping-proposal-record["']/i,
    /components\//i,
    /apps\/augnes_apps/i,
  ]) {
    assert.doesNotMatch(
      importText,
      forbiddenImport,
      `route must not import ${forbiddenImport}`,
    );
  }
  for (const forbidden of [
    /fetch\s*\(/i,
    /localStorage|sessionStorage|indexedDB/i,
    /Direct Resume Code/i,
    /\brelay\b/i,
    /createEvidenceRecord|recordEvidence|recordProof|bindSession|ensureSession/i,
    /insertWorkItem|insertWorkEvent|createWorkItem|createWorkEvent/i,
    /executeCodex|runCodex|startCodex/i,
    /createConfirmedMapping|confirmedMappingWriter|createImportRecord/i,
    /INSERT\s+INTO/i,
    /\bUPDATE\b/i,
    /\bDELETE\b/i,
    /\bDROP\b/i,
  ]) {
    assert.doesNotMatch(routeSource, forbidden, `route must not contain ${forbidden}`);
  }

  const changedFiles = gitChangedFiles();
  const allowedFiles = new Set([
    "app/api/ag-work-resume/mapping-proposal-records/lifecycle-actions/route.ts",
    "scripts/smoke-ag-work-resume-mapping-proposal-lifecycle-action-route.mjs",
    "scripts/smoke-ag-work-resume-mapping-proposal-lifecycle-action.mjs",
    "scripts/smoke-ag-work-resume-mapping-proposal-lifecycle-actions-design.mjs",
    "scripts/smoke-ag-work-resume-mapping-proposal-lifecycle-action-cockpit-panel.mjs",
    "scripts/smoke-ag-work-resume-mapping-proposal-record-read.mjs",
    "scripts/smoke-ag-work-resume-mapping-proposal-record-writer.mjs",
    "components/augnes-cockpit.tsx",
    "docs/AG_WORK_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTION_ROUTE_V0_1.md",
    "docs/AG_WORK_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTION_HELPER_V0_1.md",
    "docs/AG_WORK_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTIONS_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTION_COCKPIT_PANEL_V0_1.md",
    "docs/AG_WORK_RESUME_CONFIRMED_MAPPING_RECORD_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_WRITER_V0_1.md",
    "docs/AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_READ_V0_1.md",
    "docs/AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_READ_COCKPIT_PANEL_V0_1.md",
    "docs/AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md",
    "scripts/smoke-ag-work-resume-confirmed-mapping-record-design.mjs",
    "reports/browser/2026-05-31-ag-work-resume-mapping-proposal-lifecycle-action-cockpit-panel-verification.md",
    "package.json",
  ]);
  const forbiddenFiles = changedFiles.filter(
    (file) =>
      !allowedFiles.has(file) ||
      (file.startsWith("components/") && !allowedFiles.has(file)) ||
      file.startsWith("migrations/") ||
      file === "lib/db/schema.sql" ||
      file.startsWith("apps/") ||
      (file.startsWith("reports/browser/") && !allowedFiles.has(file)),
  );
  assert.deepEqual(
    forbiddenFiles,
    [],
    "changed files must stay inside lifecycle route/docs/smoke/package scope",
  );
}

function assertDocsGuard() {
  const routeDocs = readFileSync(routeDocsPath, "utf8");
  for (const pattern of [
    /Purpose/i,
    /Relationship To Existing Pieces/i,
    /POST \/api\/ag-work-resume\/mapping-proposal-records\/lifecycle-actions/i,
    /content-type: application\/json/i,
    /does not accept `db` or `now`/i,
    /updated` -> HTTP 200/i,
    /invalid_input` -> HTTP 400/i,
    /not_found` -> HTTP 404/i,
    /not_active` -> HTTP 409/i,
    /replacement_not_found` -> HTTP 404/i,
    /db_error` -> HTTP 500/i,
    /No Cockpit UI/i,
    /No DB schema or migration/i,
    /No proposal creation/i,
    /No replacement proposal creation/i,
    /No confirmed mapping/i,
    /No import/i,
    /No proof\/evidence/i,
    /No session binding/i,
    /No Codex execution/i,
    /No approval, publish, retry, replay, merge/i,
    /browser verification skipped: no rendered UI\/operator surface changed in this lifecycle route slice/i,
  ]) {
    assert.match(routeDocs, pattern, `route docs must include ${pattern}`);
  }

  for (const pointerPath of [helperDocsPath, designDocsPath, gateDocsPath]) {
    const source = readFileSync(pointerPath, "utf8");
    assert.match(
      source,
      /AG_WORK_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTION_ROUTE_V0_1\.md/,
      `${path.relative(rootDir, pointerPath)} must point to route docs`,
    );
  }
}

async function assertRouteSuccess({
  post,
  body,
  action,
  proposalId,
  status,
  reviewedAt,
  supersededByProposalId = null,
}) {
  const beforeCount = countRows(dbPath, tableName);
  const beforeRaw = readProposalRow(dbPath, proposalId);
  const response = await post(jsonRequest(body));
  assert.equal(response.status, 200, `${action} route status`);
  const payload = await response.json();
  assert.equal(payload.ok, true, `${action} payload ok`);
  assert.equal(
    payload.route,
    "ag_work_resume_mapping_proposal_lifecycle_actions.v0_1",
  );
  assert.equal(payload.result.status, "updated");
  assert.equal(payload.result.action, action);
  assert.equal(payload.result.proposal_id, proposalId);
  assert.equal(payload.result.record.status, status);
  assert.equal(payload.result.record.reviewed_by, "user-core:route");
  assert.equal(payload.result.record.reviewed_at, reviewedAt);
  assert.equal(payload.result.record.updated_at, reviewedAt);
  assert.equal(payload.result.record.superseded_by_proposal_id, supersededByProposalId);
  assert.deepEqual(payload.authority_boundary, payload.result.authority_boundary);
  assertLifecycleBoundary(payload.authority_boundary, true);
  const afterRaw = readProposalRow(dbPath, proposalId);
  assertOnlyAllowedFieldsChanged(beforeRaw, afterRaw, new Set(payload.result.updated_fields));
  assert.equal(countRows(dbPath, tableName), beforeCount);
  assert.equal(countRows(dbPath, tableName), expectedProposalRowCount);
  return payload;
}

async function assertRouteFailureNoWrite({
  name,
  response,
  expectedHttpStatus,
  expectedPayloadStatus,
}) {
  const before = snapshotProposalRows(dbPath);
  const beforeCount = countRows(dbPath, tableName);
  const routeResponse = await response();
  assert.equal(routeResponse.status, expectedHttpStatus, name);
  const payload = await routeResponse.json();
  assert.equal(payload.ok, false, `${name} payload ok`);
  if (expectedPayloadStatus) {
    assert.equal(payload.result.status, expectedPayloadStatus, name);
    assertLifecycleBoundary(payload.result.authority_boundary, false);
  } else {
    assert.equal(typeof payload.error, "string", `${name} route error`);
  }
  assert.equal(snapshotProposalRows(dbPath), before, `${name} must not write`);
  assert.equal(countRows(dbPath, tableName), beforeCount, `${name} row count`);
}

function resetDb(targetDbPath) {
  for (const script of ["db:reset", "db:migrate"]) {
    execFileSync("npm", ["run", script], {
      cwd: rootDir,
      env: {
        ...process.env,
        AUGNES_DB_PATH: targetDbPath,
      },
      encoding: "utf8",
      stdio: "pipe",
    });
  }
}

function makeFixtureCreator({
  buildAgWorkResumePacketPreview,
  createAgWorkResumeMappingProposalRecord,
}) {
  let index = 0;
  return function createFixture(label, overrides = {}) {
    index += 1;
    const suffix = String(index).padStart(3, "0");
    const packet = buildAgWorkResumePacketPreview(
      buildFixtureInput(`AG-MAPPING-LIFECYCLE-ROUTE-${suffix}`),
    );
    const candidate = buildCandidateFromPacket(packet, {
      candidate_id: `candidate:lifecycle-route-${label}-${suffix}`,
      local_work_id: `AG-MAPPING-LIFECYCLE-ROUTE-LOCAL-${suffix}`,
    });
    const result = createAgWorkResumeMappingProposalRecord({
      packet,
      candidates: [candidate],
      selected_candidate_id: candidate.candidate_id,
      proposed_by: "user-core",
      proposal_reason: `User/Core requested lifecycle route smoke proposal ${label}.`,
      status: overrides.status ?? "proposed",
      expires_at: null,
      source: {
        reviewed_by_surface: "route",
        reviewed_at: "2026-05-31T00:00:00.000Z",
      },
    });
    assert.equal(result.ok, true, `fixture ${label} must be created`);
    expectedProposalRowCount += 1;
    assert.equal(countRows(dbPath, tableName), expectedProposalRowCount);
    return result.record;
  };
}

function assertOnlyAllowedFieldsChanged(beforeRow, afterRow, allowedFields) {
  const beforeUnchanged = { ...beforeRow };
  const afterUnchanged = { ...afterRow };
  for (const field of allowedFields) {
    delete beforeUnchanged[field];
    delete afterUnchanged[field];
  }
  assert.deepEqual(afterUnchanged, beforeUnchanged);
  for (const field of allowedFields) {
    assert.notEqual(afterRow[field], beforeRow[field], `${field} must change`);
  }
}

function assertLifecycleBoundary(boundary, updated) {
  assert.equal(boundary.proposal_lifecycle_updated, updated);
  assert.equal(boundary.proposal_review_metadata_only, true);
  for (const key of [
    "proposal_record_created",
    "proposal_record_deleted",
    "confirmed_mapping_created",
    "import_record_created",
    "imported_context_created",
    "work_item_created",
    "work_event_created",
    "proof_recorded",
    "evidence_recorded",
    "session_bound",
    "codex_executed",
    "approval_granted",
    "publish_retry_replay_authority",
    "merge_authority",
  ]) {
    assert.equal(boundary[key], false, `${key} must be false`);
  }
  assert.equal(boundary.durable_approval, "user/Core gated");
  assert.match(boundary.statement, /proposal review metadata only/i);
  assert.match(boundary.statement, /do not confirm mappings/i);
  assert.match(boundary.statement, /import context/i);
  assert.match(boundary.statement, /record proof\/evidence/i);
  assert.match(boundary.statement, /execute Codex/i);
  assert.match(boundary.statement, /merge/i);
}

function snapshotProtectedCounts(targetDbPath) {
  const tables = [
    "sessions",
    "work_items",
    "work_events",
    "action_records",
    "verification_evidence_records",
  ];
  return Object.fromEntries(tables.map((table) => [table, countRows(targetDbPath, table)]));
}

function assertProtectedCounts(targetDbPath, before) {
  for (const [table, count] of Object.entries(before)) {
    assert.equal(countRows(targetDbPath, table), count, `${table} count must not change`);
  }
}

function assertNoForbiddenTablesOrRows(targetDbPath) {
  const db = new Database(targetDbPath);
  try {
    for (const table of [
      "ag_work_resume_mappings",
      "ag_work_resume_mapping_records",
      "ag_work_resume_confirmed_mappings",
      "ag_work_resume_imports",
      "ag_work_resume_imported_contexts",
    ]) {
      assert.equal(tableExists(db, table), false, `${table} must not be created`);
    }
  } finally {
    db.close();
  }
}

function snapshotProposalRows(targetDbPath) {
  const db = new Database(targetDbPath);
  try {
    return JSON.stringify(
      db
        .prepare(`SELECT * FROM ${tableName} ORDER BY proposal_id ASC`)
        .all(),
    );
  } finally {
    db.close();
  }
}

function countRows(targetDbPath, table) {
  const db = new Database(targetDbPath);
  try {
    return db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count;
  } finally {
    db.close();
  }
}

function readProposalRow(targetDbPath, proposalId) {
  const db = new Database(targetDbPath);
  try {
    return db
      .prepare(`SELECT * FROM ${tableName} WHERE proposal_id = ?`)
      .get(proposalId);
  } finally {
    db.close();
  }
}

function tableExists(db, table) {
  return Boolean(
    db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
      .get(table),
  );
}

function jsonRequest(body) {
  return new Request(routeUrl(), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function routeUrl() {
  return "http://localhost/api/ag-work-resume/mapping-proposal-records/lifecycle-actions";
}

function buildFixtureInput(workId) {
  const scope = "project:augnes";
  return {
    workBrief: {
      runtime: "augnes",
      scope,
      work_id: workId,
      as_of: "2026-05-31T00:00:00.000Z",
      framing: {
        work_id: "Trace anchor only.",
        state_authority: "Augnes committed state remains authority.",
        execution_proof: "Action records remain proof.",
        temporal_proof: "Temporal graph remains proof over time.",
      },
      work: {
        work_id: workId,
        scope,
        title: "Route AG resume mapping proposal lifecycle action",
        status: "in_progress",
        priority: "now",
        summary: "Route proposal lifecycle review metadata updates.",
        next_action: "Apply bounded lifecycle route after user/Core review.",
        user_attention_required: false,
        related_state_keys: ["coordination.ag_resume_mapping"],
        links: {
          docs: [
            "docs/AG_WORK_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTION_ROUTE_V0_1.md",
          ],
        },
        created_at: "2026-05-31T00:00:00.000Z",
        updated_at: "2026-05-31T00:00:00.000Z",
      },
      next_action: "Apply bounded lifecycle route after user/Core review.",
      user_attention_required: false,
      recent_events: [
        {
          id: `work-event:${workId}`,
          work_id: workId,
          scope,
          actor: "codex",
          event_type: "implementation",
          summary: "Prepared lifecycle route smoke fixture.",
          result_status: "completed",
          result_kind: "verification",
          related_action_id: "action:proof-only-1",
          related_pr: "https://github.com/hynk-studio/augnes/pull/304",
          related_state_keys: ["coordination.ag_resume_mapping"],
          created_at: "2026-05-31T00:00:00.000Z",
        },
      ],
      related_state_keys: ["coordination.ag_resume_mapping"],
      related_proof: {
        action_ids: ["action:from-id-only"],
        action_records: [
          {
            id: "action:proof-only-1",
            title: "Proof-only source action",
            status: "completed",
            state_key: null,
            proof_marker_type: "proof_only",
            linked_work_event_ids: [`work-event:${workId}`],
            created_at: "2026-05-31T00:00:00.000Z",
          },
        ],
        docs: [
          "docs/AG_WORK_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTION_ROUTE_V0_1.md",
        ],
        note: "Action records with state_key:null are proof-only.",
      },
      codex_handoff: {
        task_brief: "Implement proposal lifecycle action route.",
        constraints: ["No UI.", "No schema.", "No confirmed mapping.", "No import."],
        suggested_verification: [
          "npm run smoke:ag-work-resume-mapping-proposal-lifecycle-action-route",
        ],
      },
    },
    stateBrief: {
      runtime: "augnes",
      scope,
      as_of: "2026-05-31T00:00:00.000Z",
      generated_at: "2026-05-31T00:00:00.000Z",
      agent_instructions: ["Keep AG Resume mapping/import authority gated."],
      agent_handoff: {
        current_status: {
          notable_state_keys: ["coordination.ag_resume_mapping"],
        },
        next_recommended_action: {
          related_state_keys: ["coordination.ag_resume_mapping"],
        },
        codex_handoff: {
          task_brief: "Implement proposal lifecycle action route.",
          constraints: ["No UI.", "No schema.", "No confirmed mapping.", "No import."],
          likely_files: [
            "app/api/ag-work-resume/mapping-proposal-records/lifecycle-actions/route.ts",
          ],
          verification_commands: [
            "npm run smoke:ag-work-resume-mapping-proposal-lifecycle-action-route",
          ],
        },
      },
    },
    handoffDraft: {
      handoff_id: `handoff:${workId}`,
      status: "ready",
      expected_files: [
        "app/api/ag-work-resume/mapping-proposal-records/lifecycle-actions/route.ts",
      ],
      expected_checks: [
        "npm run smoke:ag-work-resume-mapping-proposal-lifecycle-action-route",
      ],
      expected_execution_surfaces: [],
      forbidden_surfaces: ["confirmed mapping", "import", "Codex execution"],
      stop_conditions: ["Mapping/import authority appears in lifecycle route output."],
      safety_boundaries: ["Lifecycle route is proposal review metadata only."],
    },
    git: {
      remote: "https://github.com/hynk-studio/augnes.git",
      base_branch: "main",
      base_commit: "d28603c",
      working_branch: "codex/ag-resume-mapping-proposal-lifecycle-action-route",
      head_commit: "lifecycle-action-route",
      related_pr: null,
      dirty_worktree: false,
    },
    issuer: {
      runtime_instance_id: "runtime-instance:mapping-proposal-lifecycle-route-smoke",
      source_local_label: "source-local-mapping-proposal-lifecycle-route-smoke",
      created_by_surface: "lifecycle-action-route-smoke",
      export_event_id: null,
    },
    foreign_evidence_refs: ["evidence:foreign-public-safe"],
    foreign_session_refs: ["session:foreign-public-safe"],
    foreign_evidence_pack_ref: "evidence-pack:foreign-public-safe",
  };
}

function buildCandidateFromPacket(packet, overrides = {}) {
  return {
    candidate_id: overrides.candidate_id ?? "candidate:local-work",
    local_scope: overrides.local_scope ?? packet.source_work.scope,
    local_work_id: overrides.local_work_id ?? packet.source_work.work_id,
    title: overrides.title ?? packet.source_work.title,
    status: overrides.status ?? packet.source_work.status,
    next_action: overrides.next_action ?? packet.source_work.next_action,
    related_state_keys:
      overrides.related_state_keys ?? [...packet.source_work.related_state_keys],
    summary: overrides.summary ?? packet.source_work.summary,
    priority: overrides.priority ?? packet.source_work.priority,
    source: overrides.source ?? "explicit_user_input",
    work_brief_available: overrides.work_brief_available ?? true,
    codex_read_brief_available: overrides.codex_read_brief_available ?? true,
    repo_match: overrides.repo_match ?? {
      remote_matches: true,
      base_commit_reachable: true,
      expected_files_present: [...packet.handoff.expected_files],
      expected_files_missing: [],
      dirty_worktree: false,
    },
  };
}

function extractImportText(source) {
  return [
    ...source.matchAll(/^\s*import\s+[^;]+;$/gm),
    ...source.matchAll(/\bimport\(\s*["'][^"']+["']\s*\)/g),
  ]
    .map((match) => match[0])
    .join("\n");
}

function gitChangedFiles() {
  const commands = [
    ["diff", "--name-only"],
    ["diff", "--cached", "--name-only"],
    ["ls-files", "--others", "--exclude-standard"],
  ];
  return [
    ...new Set(
      commands.flatMap((args) => {
        const result = spawnSync("git", args, {
          cwd: rootDir,
          encoding: "utf8",
        });
        if (result.status !== 0) return [];
        return result.stdout
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean);
      }),
    ),
  ];
}

function isPathInside(childPath, parentPath) {
  const relative = path.relative(parentPath, childPath);
  return Boolean(relative) && !relative.startsWith("..") && !path.isAbsolute(relative);
}
