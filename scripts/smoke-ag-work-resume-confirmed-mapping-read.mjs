import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const readCorePath = path.join(
  rootDir,
  "lib",
  "ag-work-resume-confirmed-mapping-read.ts",
);
const writerPath = path.join(rootDir, "lib", "ag-work-resume-confirmed-mapping.ts");
const routePath = path.join(
  rootDir,
  "app",
  "api",
  "ag-work-resume",
  "confirmed-mappings",
  "route.ts",
);
const helperPath = path.join(
  rootDir,
  "scripts",
  "ag-work-resume-confirmed-mapping-read.mjs",
);
const docsPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_CONFIRMED_MAPPING_READ_V0_1.md",
);
const packagePath = path.join(rootDir, "package.json");
const pointerDocPaths = [
  path.join(rootDir, "docs", "AG_WORK_RESUME_CONFIRMED_MAPPING_ROUTE_V0_1.md"),
  path.join(rootDir, "docs", "AG_WORK_RESUME_CONFIRMED_MAPPING_WRITER_V0_1.md"),
  path.join(rootDir, "docs", "AG_WORK_RESUME_CONFIRMED_MAPPING_DB_SCHEMA_IMPLEMENTATION_V0_1.md"),
  path.join(rootDir, "docs", "AG_WORK_RESUME_CONFIRMED_MAPPING_RECORD_DESIGN_V0_1.md"),
  path.join(rootDir, "docs", "AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md"),
];
const mappingTableName = "ag_work_resume_confirmed_mappings";
const proposalTableName = "ag_work_resume_mapping_proposals";
const tempDir = mkdtempSync(
  path.join(os.tmpdir(), "augnes-ag-resume-confirmed-mapping-read-"),
);
const dbPath = path.join(tempDir, "augnes.db");

process.env.AUGNES_DB_PATH = dbPath;
process.env.OPENAI_API_KEY = "smoke-openai-key-must-not-be-used";

let fetchCalls = 0;
globalThis.fetch = async () => {
  fetchCalls += 1;
  throw new Error("AG resume confirmed mapping read smoke must not call fetch.");
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
  const {
    createAgWorkResumeConfirmedMapping,
  } = await import("../lib/ag-work-resume-confirmed-mapping.ts");
  const {
    readAgWorkResumeConfirmedMappings,
  } = await import("../lib/ag-work-resume-confirmed-mapping-read.ts");
  const route = await import("../app/api/ag-work-resume/confirmed-mappings/route.ts");

  assert.equal(typeof route.GET, "function", "confirmed mapping route must expose GET");
  assert.equal(typeof route.POST, "function", "confirmed mapping route must keep POST");

  const fixtures = {
    alpha: createConfirmedMappingFixture({
      key: "alpha",
      confirmedAt: "2026-06-01T01:00:00.000Z",
      buildAgWorkResumePacketPreview,
      createAgWorkResumeMappingProposalRecord,
      createAgWorkResumeConfirmedMapping,
    }),
    beta: createConfirmedMappingFixture({
      key: "beta",
      confirmedAt: "2026-06-01T01:03:00.000Z",
      buildAgWorkResumePacketPreview,
      createAgWorkResumeMappingProposalRecord,
      createAgWorkResumeConfirmedMapping,
    }),
    gamma: createConfirmedMappingFixture({
      key: "gamma",
      confirmedAt: "2026-06-01T01:02:00.000Z",
      buildAgWorkResumePacketPreview,
      createAgWorkResumeMappingProposalRecord,
      createAgWorkResumeConfirmedMapping,
    }),
    delta: createConfirmedMappingFixture({
      key: "delta",
      confirmedAt: "2026-06-01T01:01:00.000Z",
      buildAgWorkResumePacketPreview,
      createAgWorkResumeMappingProposalRecord,
      createAgWorkResumeConfirmedMapping,
    }),
  };
  setMappingStatus(dbPath, fixtures.gamma.mapping_id, "superseded");
  setMappingStatus(dbPath, fixtures.delta.mapping_id, "revoked");

  const protectedBefore = snapshotProtectedCounts(dbPath);
  const mappingRowsBefore = snapshotMappingRows(dbPath);
  const proposalRowsBefore = snapshotProposalRows(dbPath);
  const localWorkRowsBefore = snapshotLocalWorkRows(dbPath);

  const single = readAgWorkResumeConfirmedMappings({
    mapping_id: fixtures.alpha.mapping_id,
  });
  assert.equal(single.ok, true);
  assert.equal(single.status, "fetched");
  assert.equal(single.record.mapping_id, fixtures.alpha.mapping_id);
  assert.equal(single.records.length, 1);
  assert.equal(single.record.authority_boundary.confirmed_mapping_created, true);
  assertReadBoundary(single.authority_boundary);

  const foreignList = readAgWorkResumeConfirmedMappings({
    foreign_scope: fixtures.alpha.proposal.foreign_scope,
    foreign_work_id: fixtures.alpha.proposal.foreign_work_id,
  });
  assert.equal(foreignList.ok, true);
  assert.equal(foreignList.status, "listed");
  assert.equal(foreignList.records.length, 1);
  assert.equal(foreignList.records[0].mapping_id, fixtures.alpha.mapping_id);
  assert.equal(foreignList.limit, 20);

  const localList = readAgWorkResumeConfirmedMappings({
    local_scope: fixtures.beta.proposal.candidate_local_scope,
    local_work_id: fixtures.beta.proposal.candidate_local_work_id,
  });
  assert.equal(localList.ok, true);
  assert.equal(localList.records.length, 1);
  assert.equal(localList.records[0].mapping_id, fixtures.beta.mapping_id);

  const sourceProposalList = readAgWorkResumeConfirmedMappings({
    source_proposal_id: fixtures.alpha.proposal_id,
  });
  assert.equal(sourceProposalList.ok, true);
  assert.equal(sourceProposalList.records.length, 1);
  assert.equal(sourceProposalList.records[0].source_proposal_id, fixtures.alpha.proposal_id);

  const packetList = readAgWorkResumeConfirmedMappings({
    packet_id: fixtures.gamma.proposal.packet_id,
    packet_hash: fixtures.gamma.proposal.packet_hash,
  });
  assert.equal(packetList.ok, true);
  assert.equal(packetList.records.length, 1);
  assert.equal(packetList.records[0].mapping_id, fixtures.gamma.mapping_id);

  const activeList = readAgWorkResumeConfirmedMappings({
    status: "active",
    limit: 2,
  });
  assert.equal(activeList.ok, true);
  assert.equal(activeList.status, "listed");
  assert.equal(activeList.records.length, 2);
  assert.deepEqual(
    activeList.records.map((record) => record.mapping_id),
    [fixtures.beta.mapping_id, fixtures.alpha.mapping_id],
    "status list must order by created_at DESC, mapping_id ASC",
  );
  assert.equal(activeList.limit, 2);

  const supersededList = readAgWorkResumeConfirmedMappings({ status: "superseded" });
  assert.equal(supersededList.ok, true);
  assert.equal(supersededList.records.length, 1);
  assert.equal(supersededList.records[0].mapping_id, fixtures.gamma.mapping_id);

  const cappedLimit = readAgWorkResumeConfirmedMappings({
    status: "active",
    limit: 999,
  });
  assert.equal(cappedLimit.ok, true);
  assert.equal(cappedLimit.limit, 100);

  for (const invalidCase of [
    { mapping_id: fixtures.alpha.mapping_id, status: "active" },
    { mapping_id: fixtures.alpha.mapping_id, limit: 1 },
    { foreign_scope: fixtures.alpha.proposal.foreign_scope },
    { foreign_work_id: fixtures.alpha.proposal.foreign_work_id },
    { local_scope: fixtures.alpha.proposal.candidate_local_scope },
    { local_work_id: fixtures.alpha.proposal.candidate_local_work_id },
    { packet_id: fixtures.alpha.proposal.packet_id },
    { packet_hash: fixtures.alpha.proposal.packet_hash },
    { status: "proposed" },
    { status: "active", limit: 0 },
    { status: "active", unsupported_filter: "ignored" },
    {},
  ]) {
    const result = readAgWorkResumeConfirmedMappings(invalidCase);
    assert.equal(result.ok, false);
    assert.equal(result.status, "invalid_input");
    assertReadBoundary(result.authority_boundary);
  }

  const notFound = readAgWorkResumeConfirmedMappings({
    mapping_id: "ag-resume-confirmed-mapping:not-found",
  });
  assert.equal(notFound.ok, false);
  assert.equal(notFound.status, "not_found");

  const routeSingle = await route.GET(
    requestWithQuery({ mapping_id: fixtures.alpha.mapping_id }),
  );
  assert.equal(routeSingle.status, 200);
  const routeSinglePayload = await routeSingle.json();
  assert.equal(routeSinglePayload.ok, true);
  assert.equal(routeSinglePayload.route, "ag_work_resume_confirmed_mapping_read.v0_1");
  assert.equal(routeSinglePayload.result.status, "fetched");
  assertReadBoundary(routeSinglePayload.authority_boundary);
  assert.match(routeSinglePayload.recommended_next_step, /not import authorization/i);
  assert.match(routeSinglePayload.recommended_next_step, /Codex execution authority/i);

  const routeList = await route.GET(
    requestWithQuery({ status: "active", limit: "2" }),
  );
  assert.equal(routeList.status, 200);
  const routeListPayload = await routeList.json();
  assert.equal(routeListPayload.result.records.length, 2);

  const routeForeign = await route.GET(
    requestWithQuery({
      foreign_scope: fixtures.beta.proposal.foreign_scope,
      foreign_work_id: fixtures.beta.proposal.foreign_work_id,
    }),
  );
  assert.equal(routeForeign.status, 200);
  assert.equal((await routeForeign.json()).result.records.length, 1);

  const routeUnknown = await route.GET(requestWithQuery({ status: "active", unknown: "x" }));
  assert.equal(routeUnknown.status, 400);
  const routeRepeated = await route.GET(
    requestWithQueryPairs([
      ["status", "active"],
      ["status", "revoked"],
    ]),
  );
  assert.equal(routeRepeated.status, 400);
  const routeInvalid = await route.GET(
    requestWithQuery({ mapping_id: fixtures.alpha.mapping_id, limit: "1" }),
  );
  assert.equal(routeInvalid.status, 400);
  const routeMissingTuple = await route.GET(
    requestWithQuery({ foreign_scope: fixtures.alpha.proposal.foreign_scope }),
  );
  assert.equal(routeMissingTuple.status, 400);
  const routeMissing = await route.GET(
    requestWithQuery({ mapping_id: "ag-resume-confirmed-mapping:not-found" }),
  );
  assert.equal(routeMissing.status, 404);

  const helperEnv = runHelper({
    dbPath,
    envInput: { mapping_id: fixtures.alpha.mapping_id },
  });
  assert.equal(helperEnv.status, 0);
  assert.equal(helperEnv.json.ok, true);
  assert.equal(helperEnv.json.helper, "ag_work_resume_confirmed_mapping_read.v0_1");
  assert.equal(helperEnv.json.input_mode, "env");
  assert.equal(helperEnv.json.result.status, "fetched");

  const inputFile = path.join(tempDir, "read-file-input.json");
  writeFileSync(
    inputFile,
    JSON.stringify({
      source_proposal_id: fixtures.beta.proposal_id,
      limit: 2,
    }),
  );
  const helperFile = runHelper({ dbPath, filePath: inputFile });
  assert.equal(helperFile.status, 0);
  assert.equal(helperFile.json.input_mode, "file");
  assert.equal(helperFile.json.result.records.length, 1);

  const helperFlags = runHelper({
    dbPath,
    args: ["--status", "active", "--limit", "2"],
  });
  assert.equal(helperFlags.status, 0);
  assert.equal(helperFlags.json.input_mode, "flags");
  assert.equal(helperFlags.json.result.records.length, 2);

  const helperStdin = runHelper({
    dbPath,
    stdinInput: {
      packet_id: fixtures.gamma.proposal.packet_id,
      packet_hash: fixtures.gamma.proposal.packet_hash,
    },
  });
  assert.equal(helperStdin.status, 0);
  assert.equal(helperStdin.json.input_mode, "stdin");
  assert.equal(helperStdin.json.result.records.length, 1);

  const helperInvalid = runHelper({
    dbPath,
    args: ["--status", "proposed"],
  });
  assert.notEqual(helperInvalid.status, 0);
  assert.equal(helperInvalid.json.ok, false);
  assert.equal(helperInvalid.json.result.status, "invalid_input");
  const helperMissing = runHelper({
    dbPath,
    envInput: { mapping_id: "ag-resume-confirmed-mapping:not-found" },
  });
  assert.notEqual(helperMissing.status, 0);
  assert.equal(helperMissing.json.result.status, "not_found");

  assert.equal(snapshotMappingRows(dbPath), mappingRowsBefore);
  assert.equal(snapshotProposalRows(dbPath), proposalRowsBefore);
  assert.equal(snapshotLocalWorkRows(dbPath), localWorkRowsBefore);
  assertProtectedCounts(dbPath, protectedBefore);
  assertNoForbiddenTablesOrRows(dbPath);
  assert.equal(fetchCalls, 0);

  console.log(
    JSON.stringify(
      {
        smoke: "ag-work-resume-confirmed-mapping-read",
        temp_db_path: dbPath,
        cases: [
          "package scripts are present",
          "reader/helper/GET source guards pass",
          "docs and pointer guards pass",
          "fixture rows are seeded through existing writer core",
          "core fetch by mapping_id parses authority_boundary JSON text",
          "core list by foreign tuple succeeds",
          "core list by local tuple succeeds",
          "core list by source_proposal_id succeeds",
          "core list by packet tuple succeeds",
          "core list by status orders created_at DESC then mapping_id ASC",
          "invalid and not-found reads fail closed",
          "route GET fetch/list/invalid/unknown/repeated/not-found statuses are deterministic",
          "existing POST create handler remains exported",
          "helper env/file/flags/stdin reads succeed",
          "helper invalid and not-found reads exit non-zero",
          "confirmed mapping rows are unchanged by reads",
          "source proposal and local work rows are unchanged by reads",
          "protected table counts remain unchanged",
          "import/imported-context tables are absent",
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
    readCorePath,
    writerPath,
    routePath,
    helperPath,
    docsPath,
    packagePath,
    ...pointerDocPaths,
  ]) {
    assert.ok(existsSync(file), `${file} must exist`);
  }
}

function assertPackageScripts() {
  const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
  assert.equal(
    packageJson.scripts?.["ag:resume-confirmed-mapping-read"],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/ag-work-resume-confirmed-mapping-read.mjs",
  );
  assert.equal(
    packageJson.scripts?.["smoke:ag-work-resume-confirmed-mapping-read"],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-ag-work-resume-confirmed-mapping-read.mjs",
  );
}

function assertSourceGuards() {
  const readCore = readFileSync(readCorePath, "utf8");
  const route = readFileSync(routePath, "utf8");
  const helper = readFileSync(helperPath, "utf8");

  const readCoreImports = extractImportText(readCore);
  assert.match(readCoreImports, /@\/lib\/ag-work-resume-confirmed-mapping/);
  assert.match(readCoreImports, /@\/lib\/db/);

  const routeImports = extractImportText(route);
  assert.match(routeImports, /@\/lib\/ag-work-resume-confirmed-mapping/);
  assert.match(routeImports, /@\/lib\/ag-work-resume-confirmed-mapping-read/);
  assert.match(routeImports, /next\/server/);

  for (const [label, source] of Object.entries({ readCore, helper })) {
    const importText = extractImportText(source);
    for (const forbidden of [/node:http/i, /node:https/i, /node:net/i, /node:tls/i]) {
      assert.doesNotMatch(importText, forbidden, `${label} must not import ${forbidden}`);
    }
    for (const forbidden of [
      /fetch\s*\(/i,
      /INSERT\s+INTO/i,
      /\bUPDATE\b/i,
      /\bDELETE\b/i,
      /\bDROP\b/i,
      /createAgWorkResumeConfirmedMapping/i,
      /createAgWorkResumeMappingProposalRecord/i,
      /OpenAI/i,
      /GITHUB_TOKEN/i,
      /localStorage|sessionStorage|indexedDB/i,
      /Direct Resume Code/i,
      /relay/i,
      /createEvidenceRecord|recordEvidence|recordProof|bindSession|ensureSession|insertWorkItem|insertWorkEvent/i,
      /executeCodex|runCodex/i,
    ]) {
      assert.doesNotMatch(source, forbidden, `${label} must not contain ${forbidden}`);
    }
  }

  const getBlock = extractGetBlock(route);
  assert.match(getBlock, /readAgWorkResumeConfirmedMappings/);
  assert.doesNotMatch(getBlock, /createAgWorkResumeConfirmedMapping/);
  assert.doesNotMatch(getBlock, /INSERT\s+INTO|\bUPDATE\b|\bDELETE\b|\bDROP\b/i);

  const changedFiles = gitChangedFiles();
  const allowedFiles = new Set([
    "lib/ag-work-resume-confirmed-mapping-read.ts",
    "scripts/ag-work-resume-confirmed-mapping-read.mjs",
    "app/api/ag-work-resume/confirmed-mappings/route.ts",
    "scripts/smoke-ag-work-resume-confirmed-mapping-read.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-route.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-writer.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-db-schema.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-db-schema-design.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-record-design.mjs",
    "docs/AG_WORK_RESUME_CONFIRMED_MAPPING_READ_V0_1.md",
    "docs/AG_WORK_RESUME_CONFIRMED_MAPPING_ROUTE_V0_1.md",
    "docs/AG_WORK_RESUME_CONFIRMED_MAPPING_WRITER_V0_1.md",
    "docs/AG_WORK_RESUME_CONFIRMED_MAPPING_DB_SCHEMA_IMPLEMENTATION_V0_1.md",
    "docs/AG_WORK_RESUME_CONFIRMED_MAPPING_RECORD_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md",
    "package.json",
  ]);
  for (const file of changedFiles) {
    assert.ok(
      allowedFiles.has(file),
      `changed file is outside confirmed mapping read helper/route slice: ${file}`,
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
      `lib changes limited to confirmed mapping read core: ${file}`,
    );
    assert.notEqual(file, "lib/db/schema.sql", "schema.sql must be unchanged");
  }
}

function assertDocsGuard() {
  const docs = readFileSync(docsPath, "utf8");
  for (const pattern of [
    /Purpose/i,
    /read-only Stage C/i,
    /mapping identity metadata only/i,
    /Shared Reader Core/i,
    /Local Helper/i,
    /Route/i,
    /GET \/api\/ag-work-resume\/confirmed-mappings/i,
    /mapping_id/i,
    /foreign_scope.*foreign_work_id/is,
    /local_scope.*local_work_id/is,
    /source_proposal_id/i,
    /packet_id.*packet_hash/is,
    /status/i,
    /limit/i,
    /Unknown input fields are rejected/i,
    /mapping_id` fetch must not combine with list filters or `limit`/i,
    /At least one supported read filter is required/i,
    /no implicit\s+list-all/is,
    /created_at DESC, mapping_id ASC/i,
    /authority_boundary` JSON text is parsed/i,
    /reads only from `ag_work_resume_confirmed_mappings`/i,
    /does not insert/i,
    /does not update/i,
    /does not delete/i,
    /repeated query\s+parameters/i,
    /request bodies/i,
    /fetched` -> HTTP 200/i,
    /listed` -> HTTP 200/i,
    /invalid_input` -> HTTP 400/i,
    /not_found` -> HTTP 404/i,
    /db_error` -> HTTP 500/i,
    /Not proof\/evidence/i,
    /Not session binding/i,
    /Not Codex execution/i,
    /No Cockpit UI/i,
    /No schema or migration/i,
    /No approval, publish, retry, replay, merge/i,
    /browser verification skipped: no rendered UI\/operator surface changed in this confirmed mapping read helper\/route slice/i,
  ]) {
    assert.match(docs, pattern, `read docs must include ${pattern}`);
  }

  for (const pointerDocPath of pointerDocPaths) {
    const pointerDocs = readFileSync(pointerDocPath, "utf8");
    assert.match(
      pointerDocs,
      /AG_WORK_RESUME_CONFIRMED_MAPPING_READ_V0_1\.md/,
      `${path.basename(pointerDocPath)} must point to confirmed mapping read doc`,
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

function createConfirmedMappingFixture({
  key,
  confirmedAt,
  buildAgWorkResumePacketPreview,
  createAgWorkResumeMappingProposalRecord,
  createAgWorkResumeConfirmedMapping,
}) {
  const packet = buildAgWorkResumePacketPreview(
    buildFixtureInput({
      key,
      foreignWorkId: `AG-CONFIRMED-READ-${key.toUpperCase()}`,
      runtimeInstanceId: `runtime-instance:confirmed-read-${key}`,
    }),
  );
  const candidate = buildCandidateFromPacket(packet, {
    candidate_id: `candidate:${key}`,
    local_scope: "project:augnes",
    local_work_id: `AG-LOCAL-CONFIRMED-READ-${key.toUpperCase()}`,
  });
  seedLocalWorkItem(dbPath, candidate);

  const createdProposal = createAgWorkResumeMappingProposalRecord(
    buildProposalCreateInput(packet, candidate, {
      proposal_reason: `User/Core requested confirmed mapping read fixture ${key}.`,
    }),
  );
  assert.equal(createdProposal.ok, true, `proposal fixture ${key} should be created`);

  const createdMapping = createAgWorkResumeConfirmedMapping({
    source_proposal_id: createdProposal.record.proposal_id,
    confirmed_by: "user-core:confirmed-mapping-read-smoke",
    confirmation_reason: `User/Core confirmed read fixture mapping ${key}.`,
    confirmed_at: confirmedAt,
  });
  assert.equal(createdMapping.ok, true, `mapping fixture ${key} should be created`);

  return {
    key,
    packet,
    candidate,
    proposal_id: createdProposal.record.proposal_id,
    proposal: readProposalRow(dbPath, createdProposal.record.proposal_id),
    mapping_id: createdMapping.record.mapping_id,
    mapping: readMappingRow(dbPath, createdMapping.record.mapping_id),
  };
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
      links: JSON.stringify({ source: "confirmed-mapping-read-smoke" }),
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
    proposed_by: "user-core:confirmed-mapping-read-smoke",
    proposal_reason:
      overrides.proposal_reason ??
      "User/Core requested a durable proposal for read verification.",
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
        title: `Confirmed mapping read fixture ${key}`,
        status: "in_progress",
        priority: "now",
        summary: "Create a confirmed mapping read smoke fixture.",
        next_action: "Read an existing confirmed mapping identity association.",
        user_attention_required: false,
        related_state_keys: ["coordination.ag_resume_confirmed_mapping"],
        links: {
          docs: ["docs/AG_WORK_RESUME_CONFIRMED_MAPPING_READ_V0_1.md"],
        },
        created_at: "2026-06-01T00:00:00.000Z",
        updated_at: "2026-06-01T00:00:00.000Z",
      },
      next_action: "Read an existing confirmed mapping identity association.",
      user_attention_required: false,
      recent_events: [],
      related_state_keys: ["coordination.ag_resume_confirmed_mapping"],
      related_proof: {
        action_ids: [],
        action_records: [],
        docs: ["docs/AG_WORK_RESUME_CONFIRMED_MAPPING_READ_V0_1.md"],
        note: "No local proof is imported by confirmed mapping reads.",
      },
      codex_handoff: {
        task_brief: "Implement confirmed mapping read helper and route.",
        constraints: ["No import.", "No UI.", "No Codex execution."],
        suggested_verification: [
          "npm run smoke:ag-work-resume-confirmed-mapping-read",
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
          task_brief: "Implement confirmed mapping read helper and route.",
          constraints: ["No import.", "No UI.", "No Codex execution."],
          likely_files: [
            "lib/ag-work-resume-confirmed-mapping-read.ts",
            "app/api/ag-work-resume/confirmed-mappings/route.ts",
            "scripts/ag-work-resume-confirmed-mapping-read.mjs",
          ],
          verification_commands: [
            "npm run smoke:ag-work-resume-confirmed-mapping-read",
          ],
        },
      },
    },
    handoffDraft: {
      handoff_id: `handoff:confirmed-mapping-read-smoke:${key}`,
      status: "ready",
      expected_files: [
        "lib/ag-work-resume-confirmed-mapping-read.ts",
        "app/api/ag-work-resume/confirmed-mappings/route.ts",
        "scripts/ag-work-resume-confirmed-mapping-read.mjs",
      ],
      expected_checks: [
        "npm run smoke:ag-work-resume-confirmed-mapping-read",
      ],
      expected_execution_surfaces: [],
      forbidden_surfaces: ["import", "proof/evidence", "Codex execution"],
      stop_conditions: ["Confirmed mapping read output grants downstream authority."],
      safety_boundaries: [
        "Confirmed mapping reads are identity metadata only.",
      ],
    },
    git: {
      remote: "https://github.com/hynk-studio/augnes.git",
      base_branch: "main",
      base_commit: "18bc836",
      working_branch: "codex/ag-resume-confirmed-mapping-read",
      head_commit: "confirmed-mapping-read",
      related_pr: null,
      dirty_worktree: false,
    },
    issuer: {
      runtime_instance_id: runtimeInstanceId,
      source_local_label: `source-local-confirmed-read-${key}`,
      created_by_surface: "confirmed-mapping-read-smoke",
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

function runHelper({ dbPath: helperDbPath, envInput, filePath, args = [], stdinInput }) {
  const helperArgs = [
    "--tsconfig",
    "tsconfig.json",
    "scripts/ag-work-resume-confirmed-mapping-read.mjs",
    "--json",
    ...args,
  ];
  if (filePath) {
    helperArgs.push("--file", filePath);
  }
  const result = spawnSync(
    "./apps/augnes_apps/node_modules/.bin/tsx",
    helperArgs,
    {
      cwd: rootDir,
      env: {
        ...process.env,
        AUGNES_DB_PATH: helperDbPath,
        ...(envInput
          ? {
              AG_WORK_RESUME_CONFIRMED_MAPPING_READ_INPUT: JSON.stringify(envInput),
            }
          : {}),
      },
      input: stdinInput ? JSON.stringify(stdinInput) : undefined,
      encoding: "utf8",
    },
  );
  let json = null;
  try {
    json = JSON.parse(result.stdout);
  } catch (error) {
    assert.fail(
      `helper stdout must be JSON. status=${result.status}\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}\n${error}`,
    );
  }
  return { status: result.status, stdout: result.stdout, stderr: result.stderr, json };
}

function requestWithQuery(params) {
  const url = new URL("http://localhost/api/ag-work-resume/confirmed-mappings");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new Request(url, { method: "GET" });
}

function requestWithQueryPairs(pairs) {
  const url = new URL("http://localhost/api/ag-work-resume/confirmed-mappings");
  for (const [key, value] of pairs) {
    url.searchParams.append(key, value);
  }
  return new Request(url, { method: "GET" });
}

function setMappingStatus(targetDbPath, mappingId, status) {
  const db = new Database(targetDbPath);
  try {
    db.prepare(
      `UPDATE ${mappingTableName} SET status = ?, updated_at = ? WHERE mapping_id = ?`,
    ).run(status, "2026-06-01T01:30:00.000Z", mappingId);
  } finally {
    db.close();
  }
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

function snapshotMappingRows(targetDbPath) {
  const db = new Database(targetDbPath);
  try {
    return JSON.stringify(
      db
        .prepare(`SELECT * FROM ${mappingTableName} ORDER BY mapping_id ASC`)
        .all(),
    );
  } finally {
    db.close();
  }
}

function snapshotProposalRows(targetDbPath) {
  const db = new Database(targetDbPath);
  try {
    return JSON.stringify(
      db
        .prepare(`SELECT * FROM ${proposalTableName} ORDER BY proposal_id ASC`)
        .all(),
    );
  } finally {
    db.close();
  }
}

function snapshotLocalWorkRows(targetDbPath) {
  const db = new Database(targetDbPath);
  try {
    return JSON.stringify(
      db
        .prepare("SELECT * FROM work_items ORDER BY scope ASC, work_id ASC")
        .all(),
    );
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

function readMappingRow(targetDbPath, mappingId) {
  const db = new Database(targetDbPath);
  try {
    return db
      .prepare(`SELECT * FROM ${mappingTableName} WHERE mapping_id = ?`)
      .get(mappingId);
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

function tableExists(db, table) {
  return Boolean(
    db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
      .get(table),
  );
}

function assertReadBoundary(boundary) {
  assert.equal(boundary.read_only, true);
  assert.equal(boundary.mapping_identity_metadata_only, true);
  for (const key of [
    "confirmed_mapping_created",
    "confirmed_mapping_updated",
    "confirmed_mapping_deleted",
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
  assert.match(boundary.statement, /mapping identity metadata/i);
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

function extractGetBlock(source) {
  const start = source.indexOf("export function GET");
  assert.notEqual(start, -1, "route must include GET");
  const end = source.indexOf("\nfunction parseReadQuery", start);
  assert.notEqual(end, -1, "GET block must end before parseReadQuery");
  return source.slice(start, end);
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
