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
  "confirmed-mappings",
  "route.ts",
);
const writerPath = path.join(rootDir, "lib", "ag-work-resume-confirmed-mapping.ts");
const docsPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_CONFIRMED_MAPPING_ROUTE_V0_1.md",
);
const packagePath = path.join(rootDir, "package.json");
const schemaPath = path.join(rootDir, "lib", "db", "schema.sql");
const pointerDocPaths = [
  path.join(rootDir, "docs", "AG_WORK_RESUME_CONFIRMED_MAPPING_WRITER_V0_1.md"),
  path.join(rootDir, "docs", "AG_WORK_RESUME_CONFIRMED_MAPPING_DB_SCHEMA_IMPLEMENTATION_V0_1.md"),
  path.join(rootDir, "docs", "AG_WORK_RESUME_CONFIRMED_MAPPING_DB_SCHEMA_DESIGN_V0_1.md"),
  path.join(rootDir, "docs", "AG_WORK_RESUME_CONFIRMED_MAPPING_RECORD_DESIGN_V0_1.md"),
  path.join(rootDir, "docs", "AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md"),
];
const mappingTableName = "ag_work_resume_confirmed_mappings";
const proposalTableName = "ag_work_resume_mapping_proposals";
const tempDir = mkdtempSync(
  path.join(os.tmpdir(), "augnes-ag-resume-confirmed-mapping-route-"),
);
const dbPath = path.join(tempDir, "augnes.db");

process.env.AUGNES_DB_PATH = dbPath;
process.env.OPENAI_API_KEY = "smoke-openai-key-must-not-be-used";

let fetchCalls = 0;
globalThis.fetch = async () => {
  fetchCalls += 1;
  throw new Error("AG resume confirmed mapping route smoke must not call fetch.");
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

  const { buildAgWorkResumePacketPreview } = await import("../lib/ag-work-resume-packet.ts");
  const {
    createAgWorkResumeMappingProposalRecord,
  } = await import("../lib/ag-work-resume-mapping-proposal-record.ts");
  const { POST } = await import(
    "../app/api/ag-work-resume/confirmed-mappings/route.ts"
  );
  assert.equal(typeof POST, "function", "confirmed mapping route must expose POST");

  const createFixture = (key, options = {}) =>
    createProposalFixture({
      key,
      buildAgWorkResumePacketPreview,
      createAgWorkResumeMappingProposalRecord,
      ...options,
    });

  const fixtures = {
    proposed: createFixture("route-proposed"),
    needsReview: createFixture("route-needs-review", { status: "needs_review" }),
    validation: createFixture("route-validation"),
    localMissing: createFixture("route-local-missing", { seedLocalWork: false }),
    mismatch: createFixture("route-mismatch"),
    inactive: createFixture("route-inactive", { status: "withdrawn" }),
    duplicate: createFixture("route-duplicate"),
  };
  const protectedBefore = snapshotProtectedCounts(dbPath);
  const proposalRowsBefore = countRows(dbPath, proposalTableName);
  let expectedMappingRows = countRows(dbPath, mappingTableName);

  const proposedBefore = sideEffectSnapshot(dbPath, fixtures.proposed);
  const proposedResponse = await POST(
    jsonRequest(
      buildRouteInput(fixtures.proposed, {
        confirmed_at: "2026-06-01T00:00:00.000Z",
      }),
    ),
  );
  const proposedPayload = await proposedResponse.json();
  assert.equal(proposedResponse.status, 201);
  assert.equal(proposedPayload.ok, true);
  assert.equal(proposedPayload.route, "ag_work_resume_confirmed_mappings.v0_1");
  assert.equal(proposedPayload.result.status, "created");
  assert.equal(proposedPayload.result.record.source_proposal_id, fixtures.proposed.proposal_id);
  assert.equal(proposedPayload.result.record.foreign_scope, fixtures.proposed.proposal.foreign_scope);
  assert.equal(proposedPayload.result.record.local_work_id, fixtures.proposed.proposal.candidate_local_work_id);
  assertConfirmedAuthorityBoundary(proposedPayload.authority_boundary, true);
  assertConfirmedAuthorityBoundary(proposedPayload.result.authority_boundary, true);
  assert.match(proposedPayload.recommended_next_step, /not import authorization/i);
  expectedMappingRows += 1;
  assert.equal(countRows(dbPath, mappingTableName), expectedMappingRows);
  assertSideEffectsUnchanged(dbPath, fixtures.proposed, proposedBefore);

  const needsReviewBefore = sideEffectSnapshot(dbPath, fixtures.needsReview);
  const needsReviewResponse = await POST(
    jsonRequest(
      buildRouteInput(fixtures.needsReview, {
        foreign_scope: fixtures.needsReview.proposal.foreign_scope,
        foreign_work_id: fixtures.needsReview.proposal.foreign_work_id,
        local_scope: fixtures.needsReview.proposal.candidate_local_scope,
        local_work_id: fixtures.needsReview.proposal.candidate_local_work_id,
        packet_id: fixtures.needsReview.proposal.packet_id,
        packet_hash: fixtures.needsReview.proposal.packet_hash,
        source_runtime_instance_id:
          fixtures.needsReview.proposal.source_runtime_instance_id,
        confirmed_at: "2026-06-01T00:01:00.000Z",
      }),
    ),
  );
  const needsReviewPayload = await needsReviewResponse.json();
  assert.equal(needsReviewResponse.status, 201);
  assert.equal(needsReviewPayload.ok, true);
  assert.equal(needsReviewPayload.result.source_proposal.status, "needs_review");
  assert.equal(needsReviewPayload.result.record.packet_id, fixtures.needsReview.proposal.packet_id);
  expectedMappingRows += 1;
  assert.equal(countRows(dbPath, mappingTableName), expectedMappingRows);
  assertSideEffectsUnchanged(dbPath, fixtures.needsReview, needsReviewBefore);

  await assertRouteFailureNoWrite({
    name: "wrong content-type",
    response: () =>
      POST(
        new Request(routeUrl(), {
          method: "POST",
          headers: { "content-type": "text/plain" },
          body: JSON.stringify(buildRouteInput(fixtures.validation)),
        }),
      ),
    expectedHttpStatus: 400,
    expectedPayloadStatus: null,
    expectedMappingRows,
    proposalRowsBefore,
    protectedBefore,
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
    expectedMappingRows,
    proposalRowsBefore,
    protectedBefore,
  });
  await assertRouteFailureNoWrite({
    name: "non-object JSON",
    response: () => POST(jsonRequest([])),
    expectedHttpStatus: 400,
    expectedPayloadStatus: null,
    expectedMappingRows,
    proposalRowsBefore,
    protectedBefore,
  });

  for (const invalidCase of [
    {
      name: "unknown db field",
      body: { ...buildRouteInput(fixtures.validation), db: {} },
      httpStatus: 400,
      resultStatus: null,
    },
    {
      name: "unknown now field",
      body: { ...buildRouteInput(fixtures.validation), now: "2026-06-01T00:02:00.000Z" },
      httpStatus: 400,
      resultStatus: null,
    },
    {
      name: "missing source_proposal_id",
      body: { ...buildRouteInput(fixtures.validation), source_proposal_id: "" },
      httpStatus: 400,
      resultStatus: "invalid_input",
    },
    {
      name: "missing confirmed_by",
      body: { ...buildRouteInput(fixtures.validation), confirmed_by: "" },
      httpStatus: 400,
      resultStatus: "invalid_input",
    },
    {
      name: "missing confirmation_reason",
      body: { ...buildRouteInput(fixtures.validation), confirmation_reason: "" },
      httpStatus: 400,
      resultStatus: "invalid_input",
    },
    {
      name: "malformed confirmed_at",
      body: {
        ...buildRouteInput(fixtures.validation),
        confirmed_at: "2026-06-01T00:02:00Z",
      },
      httpStatus: 400,
      resultStatus: "invalid_input",
    },
    {
      name: "proposal missing",
      body: {
        ...buildRouteInput(fixtures.validation),
        source_proposal_id: "ag-resume-mapping-proposal:missing",
      },
      httpStatus: 404,
      resultStatus: "proposal_not_found",
    },
    {
      name: "proposal inactive",
      body: buildRouteInput(fixtures.inactive),
      httpStatus: 409,
      resultStatus: "proposal_not_active",
    },
    {
      name: "local work missing",
      body: buildRouteInput(fixtures.localMissing),
      httpStatus: 404,
      resultStatus: "local_work_not_found",
    },
    {
      name: "proposal mismatch",
      body: {
        ...buildRouteInput(fixtures.mismatch),
        foreign_work_id: "AG-CONFIRMED-MAPPING-MISMATCH",
      },
      httpStatus: 409,
      resultStatus: "proposal_mismatch",
    },
  ]) {
    await assertRouteFailureNoWrite({
      name: invalidCase.name,
      response: () => POST(jsonRequest(invalidCase.body)),
      expectedHttpStatus: invalidCase.httpStatus,
      expectedPayloadStatus: invalidCase.resultStatus,
      expectedMappingRows,
      proposalRowsBefore,
      protectedBefore,
    });
  }

  const duplicateBefore = sideEffectSnapshot(dbPath, fixtures.duplicate);
  const duplicateCreate = await POST(
    jsonRequest(
      buildRouteInput(fixtures.duplicate, {
        confirmed_at: "2026-06-01T00:03:00.000Z",
      }),
    ),
  );
  assert.equal(duplicateCreate.status, 201);
  expectedMappingRows += 1;
  assert.equal(countRows(dbPath, mappingTableName), expectedMappingRows);
  assertSideEffectsUnchanged(dbPath, fixtures.duplicate, duplicateBefore);

  await assertRouteFailureNoWrite({
    name: "duplicate active mapping",
    response: () =>
      POST(
        jsonRequest(
          buildRouteInput(fixtures.duplicate, {
            confirmed_at: "2026-06-01T00:04:00.000Z",
          }),
        ),
      ),
    expectedHttpStatus: 409,
    expectedPayloadStatus: "duplicate_active_mapping",
    expectedMappingRows,
    proposalRowsBefore,
    protectedBefore,
  });

  assert.equal(countRows(dbPath, proposalTableName), proposalRowsBefore);
  assertProtectedCounts(dbPath, protectedBefore, "final protected counts");
  assertNoForbiddenTablesOrRows(dbPath);
  assert.equal(fetchCalls, 0);

  console.log(
    JSON.stringify(
      {
        smoke: "ag-work-resume-confirmed-mapping-route",
        temp_db_path: dbPath,
        cases: [
          "package script is present",
          "route source guard passes",
          "docs and pointer guards pass",
          "proposed proposal route create returns 201",
          "needs_review proposal route create returns 201",
          "omitted optional fields derive from proposal",
          "explicit matching fields are accepted",
          "wrong content-type fails with 400",
          "invalid JSON fails with 400",
          "non-object JSON fails with 400",
          "db and now body fields fail with 400",
          "missing required fields fail with 400",
          "malformed confirmed_at fails with 400",
          "missing proposal fails with 404",
          "inactive proposal fails with 409",
          "missing local work fails with 404",
          "proposal mismatch fails with 409",
          "duplicate active mapping fails with 409",
          "source proposal and local work rows are unchanged",
          "only successful route cases create confirmed mapping rows",
          "no work/proof/evidence/session/import side effects",
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
    writerPath,
    docsPath,
    packagePath,
    schemaPath,
    ...pointerDocPaths,
  ]) {
    assert.ok(existsSync(file), `${file} must exist`);
  }
}

function assertPackageScripts() {
  const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
  assert.equal(
    packageJson.scripts?.["smoke:ag-work-resume-confirmed-mapping-route"],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-ag-work-resume-confirmed-mapping-route.mjs",
  );
}

function assertSourceGuards() {
  const routeSource = readFileSync(routePath, "utf8");
  const routeImportText = extractImportText(routeSource);
  assert.match(
    routeImportText,
    /@\/lib\/ag-work-resume-confirmed-mapping/,
    "route must import the confirmed mapping writer core",
  );
  assert.match(
    routeImportText,
    /next\/server/,
    "route must import NextResponse",
  );
  for (const forbidden of [
    /ag-work-resume-mapping-proposal-record/i,
    /ag-work-resume-mapping-proposal-record-read/i,
    /ag-work-resume-confirmed-mapping-record-read/i,
    /node:http/i,
    /node:https/i,
    /node:net/i,
    /node:tls/i,
  ]) {
    assert.doesNotMatch(routeImportText, forbidden, `route import guard forbids ${forbidden}`);
  }
  for (const forbidden of [
    /fetch\s*\(/i,
    /OpenAI/i,
    /GITHUB_TOKEN/i,
    /localStorage|sessionStorage|indexedDB/i,
    /Direct Resume Code/i,
    /relay/i,
    /createEvidenceRecord|recordEvidence|recordProof|bindSession|ensureSession|insertWorkItem|insertWorkEvent/i,
    /executeCodex|runCodex/i,
    /\bdb\s*:/i,
    /\bnow\s*:/i,
  ]) {
    assert.doesNotMatch(routeSource, forbidden, `route source guard forbids ${forbidden}`);
  }

  const changedFiles = gitChangedFiles();
  const allowedFiles = new Set([
    "app/api/ag-work-resume/confirmed-mappings/route.ts",
    "lib/ag-work-resume-confirmed-mapping-read.ts",
    "scripts/ag-work-resume-confirmed-mapping-read.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-read.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-route.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-db-schema.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-db-schema-design.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-record-design.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-writer.mjs",
    "docs/AG_WORK_RESUME_CONFIRMED_MAPPING_READ_V0_1.md",
    "docs/AG_WORK_RESUME_CONFIRMED_MAPPING_ROUTE_V0_1.md",
    "docs/AG_WORK_RESUME_CONFIRMED_MAPPING_WRITER_V0_1.md",
    "docs/AG_WORK_RESUME_CONFIRMED_MAPPING_DB_SCHEMA_IMPLEMENTATION_V0_1.md",
    "docs/AG_WORK_RESUME_CONFIRMED_MAPPING_DB_SCHEMA_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_CONFIRMED_MAPPING_RECORD_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md",
    "package.json",
  ]);
  for (const file of changedFiles) {
    assert.ok(
      allowedFiles.has(file),
      `changed file is outside confirmed mapping route slice: ${file}`,
    );
    assert.ok(
      file === "app/api/ag-work-resume/confirmed-mappings/route.ts" ||
        !file.startsWith("app/"),
      `app changes limited to confirmed mapping route: ${file}`,
    );
    assert.equal(file.startsWith("components/"), false, `no component change: ${file}`);
    assert.equal(file.startsWith("migrations/"), false, `no migration change: ${file}`);
    assert.equal(file.startsWith("apps/"), false, `no MCP/App change: ${file}`);
    assert.equal(file.startsWith("reports/browser/"), false, `no browser report: ${file}`);
    assert.ok(
      file === "lib/ag-work-resume-confirmed-mapping-read.ts" ||
        !file.startsWith("lib/"),
      `lib changes limited to confirmed mapping read core in this follow-up: ${file}`,
    );
    assert.notEqual(file, "lib/db/schema.sql", "schema.sql must be unchanged");
  }
}

function assertDocsGuard() {
  const docs = readFileSync(docsPath, "utf8");
  for (const pattern of [
    /Purpose/i,
    /POST \/api\/ag-work-resume\/confirmed-mappings/i,
    /content-type: application\/json/i,
    /source_proposal_id/i,
    /confirmed_by/i,
    /confirmation_reason/i,
    /db` and `now`/i,
    /delegates validation and insert behavior to/i,
    /route creates confirmed mapping identity association rows only/i,
    /created` -> HTTP 201/i,
    /invalid_input` -> HTTP 400/i,
    /proposal_not_found` -> HTTP 404/i,
    /proposal_not_active` -> HTTP 409/i,
    /local_work_not_found` -> HTTP 404/i,
    /proposal_mismatch` -> HTTP 409/i,
    /duplicate_active_mapping` -> HTTP 409/i,
    /db_error` -> HTTP 500/i,
    /route does not import context/i,
    /route does not create work items/i,
    /route does not update proposal rows/i,
    /route does not record proof\/evidence/i,
    /route does not bind sessions/i,
    /route does not execute Codex/i,
    /route adds no UI/i,
    /browser verification skipped: no rendered UI\/operator surface changed in this confirmed mapping route slice/i,
  ]) {
    assert.match(docs, pattern, `route docs must include ${pattern}`);
  }

  for (const pointerDocPath of pointerDocPaths) {
    const pointerDocs = readFileSync(pointerDocPath, "utf8");
    assert.match(
      pointerDocs,
      /AG_WORK_RESUME_CONFIRMED_MAPPING_ROUTE_V0_1\.md/,
      `${path.basename(pointerDocPath)} must point to confirmed mapping route doc`,
    );
  }
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

async function assertRouteFailureNoWrite({
  name,
  response,
  expectedHttpStatus,
  expectedPayloadStatus,
  expectedMappingRows,
  proposalRowsBefore,
  protectedBefore,
}) {
  const beforeMappingRows = countRows(dbPath, mappingTableName);
  const routeResponse = await response();
  const payload = await routeResponse.json();
  assert.equal(routeResponse.status, expectedHttpStatus, name);
  assert.equal(payload.ok, false, name);
  if (expectedPayloadStatus) {
    assert.equal(payload.result.status, expectedPayloadStatus, name);
  } else {
    assert.equal("result" in payload, false, name);
  }
  assert.equal(countRows(dbPath, mappingTableName), beforeMappingRows, name);
  assert.equal(countRows(dbPath, mappingTableName), expectedMappingRows, name);
  assert.equal(countRows(dbPath, proposalTableName), proposalRowsBefore, name);
  assertProtectedCounts(dbPath, protectedBefore, name);
}

function createProposalFixture({
  key,
  status = "proposed",
  seedLocalWork = true,
  buildAgWorkResumePacketPreview,
  createAgWorkResumeMappingProposalRecord,
}) {
  const packet = buildAgWorkResumePacketPreview(
    buildFixtureInput({
      key,
      foreignWorkId: `AG-CONFIRMED-ROUTE-${key.toUpperCase()}`,
      runtimeInstanceId: `runtime-instance:confirmed-route-${key}`,
    }),
  );
  const candidate = buildCandidateFromPacket(packet, {
    candidate_id: `candidate:${key}`,
    local_scope: "project:augnes",
    local_work_id: `AG-LOCAL-CONFIRMED-ROUTE-${key.toUpperCase()}`,
  });
  if (seedLocalWork) {
    seedLocalWorkItem(dbPath, candidate);
  }

  const createStatus = status === "needs_review" ? "needs_review" : "proposed";
  const created = createAgWorkResumeMappingProposalRecord(
    buildProposalCreateInput(packet, candidate, {
      status: createStatus,
      proposal_reason: `User/Core requested confirmed mapping route fixture ${key}.`,
    }),
  );
  assert.equal(created.ok, true, `proposal fixture ${key} should be created`);

  if (!["proposed", "needs_review"].includes(status)) {
    updateProposalStatus(dbPath, created.record.proposal_id, status);
  }

  return {
    key,
    packet,
    candidate,
    proposal_id: created.record.proposal_id,
    proposal: readProposalRow(dbPath, created.record.proposal_id),
  };
}

function buildRouteInput(fixture, overrides = {}) {
  return {
    source_proposal_id: fixture.proposal_id,
    confirmed_by: overrides.confirmed_by ?? "user-core:confirmed-mapping-route",
    confirmation_reason:
      overrides.confirmation_reason ??
      `User/Core confirmed route fixture mapping ${fixture.key}.`,
    ...(overrides.foreign_scope !== undefined
      ? { foreign_scope: overrides.foreign_scope }
      : {}),
    ...(overrides.foreign_work_id !== undefined
      ? { foreign_work_id: overrides.foreign_work_id }
      : {}),
    ...(overrides.local_scope !== undefined
      ? { local_scope: overrides.local_scope }
      : {}),
    ...(overrides.local_work_id !== undefined
      ? { local_work_id: overrides.local_work_id }
      : {}),
    ...(overrides.packet_id !== undefined ? { packet_id: overrides.packet_id } : {}),
    ...(overrides.packet_hash !== undefined
      ? { packet_hash: overrides.packet_hash }
      : {}),
    ...(overrides.source_runtime_instance_id !== undefined
      ? { source_runtime_instance_id: overrides.source_runtime_instance_id }
      : {}),
    ...(overrides.confirmed_at !== undefined
      ? { confirmed_at: overrides.confirmed_at }
      : {}),
  };
}

function sideEffectSnapshot(targetDbPath, fixture) {
  return {
    proposalRow: snapshotProposalRow(targetDbPath, fixture.proposal_id),
    localWorkRow: snapshotLocalWorkRow(
      targetDbPath,
      fixture.candidate.local_scope,
      fixture.candidate.local_work_id,
    ),
  };
}

function assertSideEffectsUnchanged(targetDbPath, fixture, before) {
  assert.equal(
    snapshotProposalRow(targetDbPath, fixture.proposal_id),
    before.proposalRow,
    `${fixture.key}: source proposal row must not change`,
  );
  assert.equal(
    snapshotLocalWorkRow(
      targetDbPath,
      fixture.candidate.local_scope,
      fixture.candidate.local_work_id,
    ),
    before.localWorkRow,
    `${fixture.key}: local work row must not change`,
  );
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

function assertProtectedCounts(targetDbPath, before, label = "protected counts") {
  for (const [table, count] of Object.entries(before)) {
    assert.equal(countRows(targetDbPath, table), count, `${label}: ${table} count must not change`);
  }
}

function assertNoForbiddenTablesOrRows(targetDbPath) {
  const db = new Database(targetDbPath);
  try {
    for (const table of [
      "ag_work_resume_imports",
      "ag_work_resume_imported_contexts",
    ]) {
      assert.equal(tableExists(db, table), false, `${table} must not be created`);
    }
    for (const table of [
      "sessions",
      "work_events",
      "action_records",
      "verification_evidence_records",
    ]) {
      assert.equal(countRows(targetDbPath, table), 0, `${table} rows must not be created`);
    }
  } finally {
    db.close();
  }
}

function seedLocalWorkItem(targetDbPath, candidate) {
  const db = new Database(targetDbPath);
  try {
    db.prepare(
      `
        INSERT INTO work_items (
          scope,
          work_id,
          title,
          status,
          priority,
          summary,
          next_action,
          related_state_keys,
          links,
          created_at,
          updated_at
        )
        VALUES (
          @scope,
          @work_id,
          @title,
          @status,
          @priority,
          @summary,
          @next_action,
          @related_state_keys,
          @links,
          @created_at,
          @updated_at
        )
      `,
    ).run({
      scope: candidate.local_scope,
      work_id: candidate.local_work_id,
      title: candidate.title,
      status: candidate.status,
      priority: candidate.priority ?? "normal",
      summary: candidate.summary ?? "Smoke fixture local work item.",
      next_action: candidate.next_action,
      related_state_keys: JSON.stringify(candidate.related_state_keys ?? []),
      links: JSON.stringify({ source: "confirmed-mapping-route-smoke" }),
      created_at: "2026-06-01T00:00:00.000Z",
      updated_at: "2026-06-01T00:00:00.000Z",
    });
  } finally {
    db.close();
  }
}

function buildProposalCreateInput(packet, candidate, overrides = {}) {
  return {
    packet,
    candidates: [candidate],
    selected_candidate_id: candidate.candidate_id,
    proposed_by: "user-core:confirmed-mapping-route-smoke",
    proposal_reason:
      overrides.proposal_reason ??
      "User/Core requested a durable proposal for route confirmation review.",
    status: overrides.status ?? "proposed",
    expires_at: null,
    source: {
      reviewed_by_surface: "codex",
      reviewed_at: "2026-06-01T00:00:00.000Z",
    },
  };
}

function buildFixtureInput({ key, foreignWorkId, runtimeInstanceId }) {
  const scope = "project:foreign";
  return {
    workBrief: {
      runtime: "augnes",
      scope,
      work_id: foreignWorkId,
      as_of: "2026-06-01T00:00:00.000Z",
      framing: {
        work_id: "Trace anchor only.",
        state_authority: "Augnes committed state remains authority.",
        execution_proof: "Action records remain proof.",
        temporal_proof: "Temporal graph remains proof over time.",
      },
      work: {
        work_id: foreignWorkId,
        scope,
        title: `Confirmed mapping route fixture ${key}`,
        status: "in_progress",
        priority: "now",
        summary: "Create a confirmed mapping route smoke fixture.",
        next_action: "Confirm an existing local work identity association through route.",
        user_attention_required: false,
        related_state_keys: ["coordination.ag_resume_confirmed_mapping"],
        links: {
          docs: ["docs/AG_WORK_RESUME_CONFIRMED_MAPPING_ROUTE_V0_1.md"],
        },
        created_at: "2026-06-01T00:00:00.000Z",
        updated_at: "2026-06-01T00:00:00.000Z",
      },
      next_action: "Confirm an existing local work identity association through route.",
      user_attention_required: false,
      recent_events: [],
      related_state_keys: ["coordination.ag_resume_confirmed_mapping"],
      related_proof: {
        action_ids: [],
        action_records: [],
        docs: ["docs/AG_WORK_RESUME_CONFIRMED_MAPPING_ROUTE_V0_1.md"],
        note: "No local proof is imported by confirmed mapping.",
      },
      codex_handoff: {
        task_brief: "Implement confirmed mapping route.",
        constraints: ["No import.", "No UI.", "No Codex execution."],
        suggested_verification: [
          "npm run smoke:ag-work-resume-confirmed-mapping-route",
        ],
      },
    },
    stateBrief: {
      runtime: "augnes",
      scope,
      as_of: "2026-06-01T00:00:00.000Z",
      generated_at: "2026-06-01T00:00:00.000Z",
      agent_instructions: ["Keep AG Resume mapping/import authority gated."],
      agent_handoff: {
        current_status: {
          notable_state_keys: ["coordination.ag_resume_confirmed_mapping"],
        },
        next_recommended_action: {
          related_state_keys: ["coordination.ag_resume_confirmed_mapping"],
        },
        codex_handoff: {
          task_brief: "Implement confirmed mapping route.",
          constraints: ["No import.", "No UI.", "No Codex execution."],
          likely_files: [
            "app/api/ag-work-resume/confirmed-mappings/route.ts",
          ],
          verification_commands: [
            "npm run smoke:ag-work-resume-confirmed-mapping-route",
          ],
        },
      },
    },
    handoffDraft: {
      handoff_id: `handoff:confirmed-mapping-route-smoke:${key}`,
      status: "ready",
      expected_files: [
        "app/api/ag-work-resume/confirmed-mappings/route.ts",
      ],
      expected_checks: [
        "npm run smoke:ag-work-resume-confirmed-mapping-route",
      ],
      expected_execution_surfaces: [],
      forbidden_surfaces: ["import", "proof/evidence", "Codex execution"],
      stop_conditions: ["Confirmed mapping route output grants downstream authority."],
      safety_boundaries: [
        "Confirmed mapping route creation is only an identity association.",
      ],
    },
    git: {
      remote: "https://github.com/hynk-studio/augnes.git",
      base_branch: "main",
      base_commit: "937b442",
      working_branch: "codex/ag-resume-confirmed-mapping-route",
      head_commit: "confirmed-mapping-route",
      related_pr: null,
      dirty_worktree: false,
    },
    issuer: {
      runtime_instance_id: runtimeInstanceId,
      source_local_label: `source-local-confirmed-route-${key}`,
      created_by_surface: "confirmed-mapping-route-smoke",
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
    local_scope: overrides.local_scope ?? "project:augnes",
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

function jsonRequest(body) {
  return new Request(routeUrl(), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function routeUrl() {
  return "http://localhost/api/ag-work-resume/confirmed-mappings";
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
      .prepare(`SELECT * FROM ${proposalTableName} WHERE proposal_id = ?`)
      .get(proposalId);
  } finally {
    db.close();
  }
}

function updateProposalStatus(targetDbPath, proposalId, status) {
  const db = new Database(targetDbPath);
  try {
    db.prepare(
      `UPDATE ${proposalTableName} SET status = ?, updated_at = ? WHERE proposal_id = ?`,
    ).run(status, "2026-06-01T00:30:00.000Z", proposalId);
  } finally {
    db.close();
  }
}

function snapshotProposalRow(targetDbPath, proposalId) {
  return JSON.stringify(readProposalRow(targetDbPath, proposalId));
}

function snapshotLocalWorkRow(targetDbPath, scope, workId) {
  const db = new Database(targetDbPath);
  try {
    return JSON.stringify(
      db
        .prepare("SELECT * FROM work_items WHERE scope = ? AND work_id = ?")
        .get(scope, workId) ?? null,
    );
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

function assertConfirmedAuthorityBoundary(boundary, created) {
  assert.equal(boundary.confirmed_mapping_created, created);
  for (const key of [
    "proposal_record_created",
    "proposal_record_updated",
    "proposal_record_deleted",
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
  assert.match(boundary.statement, /identity association/i);
  assert.match(boundary.statement, /not import\/proof\/evidence\/session\/Codex\/merge authority/i);
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
  const diffResult = spawnSync("git", ["diff", "--name-only"], {
    cwd: rootDir,
    encoding: "utf8",
  });
  const cachedResult = spawnSync("git", ["diff", "--cached", "--name-only"], {
    cwd: rootDir,
    encoding: "utf8",
  });
  const untrackedResult = spawnSync("git", ["ls-files", "--others", "--exclude-standard"], {
    cwd: rootDir,
    encoding: "utf8",
  });
  if (diffResult.status !== 0 || cachedResult.status !== 0 || untrackedResult.status !== 0) return [];
  return `${diffResult.stdout}\n${cachedResult.stdout}\n${untrackedResult.stdout}`
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function isPathInside(childPath, parentPath) {
  const relative = path.relative(parentPath, childPath);
  return Boolean(relative) && !relative.startsWith("..") && !path.isAbsolute(relative);
}
