import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const readCorePath = path.join(rootDir, "lib", "ag-work-resume-imported-context-read.ts");
const writerPath = path.join(rootDir, "lib", "ag-work-resume-imported-context.ts");
const helperPath = path.join(rootDir, "scripts", "ag-work-resume-imported-context-read.mjs");
const smokePath = fileURLToPath(import.meta.url);
const routePath = path.join(rootDir, "app", "api", "ag-work-resume", "imported-contexts", "route.ts");
const docsPath = path.join(rootDir, "docs", "AG_WORK_RESUME_IMPORTED_CONTEXT_READ_V0_1.md");
const packagePath = path.join(rootDir, "package.json");
const schemaPath = path.join(rootDir, "lib", "db", "schema.sql");
const pointerDocPaths = [
  path.join(rootDir, "docs", "AG_WORK_RESUME_IMPORTED_CONTEXT_ROUTE_V0_1.md"),
  path.join(rootDir, "docs", "AG_WORK_RESUME_IMPORTED_CONTEXT_WRITER_V0_1.md"),
  path.join(rootDir, "docs", "AG_WORK_RESUME_IMPORTED_CONTEXT_DB_SCHEMA_IMPLEMENTATION_V0_1.md"),
  path.join(rootDir, "docs", "AG_WORK_RESUME_IMPORTED_CONTEXT_DB_SCHEMA_DESIGN_V0_1.md"),
  path.join(rootDir, "docs", "AG_WORK_RESUME_IMPORTED_CONTEXT_RECORD_DESIGN_V0_1.md"),
  path.join(rootDir, "docs", "AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md"),
];
const tableName = "ag_work_resume_imported_contexts";
const mappingTableName = "ag_work_resume_confirmed_mappings";
const proposalTableName = "ag_work_resume_mapping_proposals";
const tempDir = mkdtempSync(path.join(os.tmpdir(), "augnes-ag-resume-imported-context-read-"));
const dbPath = path.join(tempDir, "augnes.db");

process.env.AUGNES_DB_PATH = dbPath;
process.env.OPENAI_API_KEY = "smoke-openai-key-must-not-be-used";

let fetchCalls = 0;
globalThis.fetch = async () => {
  fetchCalls += 1;
  throw new Error("AG resume imported context read smoke must not call fetch.");
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
    createAgWorkResumeImportedContext,
  } = await import("../lib/ag-work-resume-imported-context.ts");
  const {
    readAgWorkResumeImportedContexts,
  } = await import("../lib/ag-work-resume-imported-context-read.ts");
  const { GET, POST } = await import("../app/api/ag-work-resume/imported-contexts/route.ts");
  assert.equal(typeof GET, "function", "imported context route must expose GET");
  assert.equal(typeof POST, "function", "imported context route must keep POST");

  const createFixture = (key) =>
    createConfirmedMappingFixture({
      key,
      buildAgWorkResumePacketPreview,
      createAgWorkResumeMappingProposalRecord,
      createAgWorkResumeConfirmedMapping,
    });

  const primary = createFixture("read-primary");
  const primaryCreate = createAgWorkResumeImportedContext(
    buildImportedInput(primary, {
      created_at: "2026-06-01T03:00:00.000Z",
      imported_expected_files: ["docs/read-primary.md"],
      imported_expected_checks: ["npm run smoke:ag-work-resume-imported-context-read"],
      foreign_refs_summary: { foreign_action_ref: "action:read-primary" },
      created_by: "user-core:imported-context-read-primary",
    }),
  );
  assert.equal(primaryCreate.ok, true);
  const primaryImportId = primaryCreate.record.import_id;

  const secondary = createFixture("read-secondary");
  const postResponse = await POST(
    jsonPostRequest(
      buildImportedInput(secondary, {
        created_at: "2026-06-01T03:01:00.000Z",
        created_by: "user-core:imported-context-read-post",
      }),
    ),
  );
  const postPayload = await postResponse.json();
  assert.equal(postResponse.status, 201);
  assert.equal(postPayload.route, "ag_work_resume_imported_contexts.v0_1");
  assert.equal(postPayload.result.status, "created");

  const bulkImports = [];
  for (let index = 0; index < 24; index += 1) {
    const fixture = createFixture(`read-bulk-${String(index).padStart(2, "0")}`);
    const result = createAgWorkResumeImportedContext(
      buildImportedInput(fixture, {
        created_at: `2026-06-01T03:${String(index + 2).padStart(2, "0")}:00.000Z`,
        created_by: "user-core:imported-context-read-bulk",
      }),
    );
    assert.equal(result.ok, true, `bulk imported context ${index} should be created`);
    bulkImports.push({ fixture, result });
  }

  const beforeReads = sideEffectSnapshot(dbPath, primary);
  const importedRowsBeforeReads = countRows(dbPath, tableName);
  const importedRowsSnapshotBeforeReads = snapshotImportedContextRows(dbPath);

  const fetched = readAgWorkResumeImportedContexts({ import_id: primaryImportId });
  assert.equal(fetched.ok, true);
  assert.equal(fetched.status, "fetched");
  assert.equal(fetched.record.import_id, primaryImportId);
  assert.equal(fetched.records.length, 1);
  assert.equal(fetched.limit, null);
  assertReadAuthorityBoundary(fetched.authority_boundary);
  assert.deepEqual(fetched.record.imported_expected_files, ["docs/read-primary.md"]);
  assert.deepEqual(fetched.record.imported_expected_checks, [
    "npm run smoke:ag-work-resume-imported-context-read",
  ]);
  assert.equal(fetched.record.foreign_refs_summary.foreign_action_ref, "action:read-primary");
  assert.equal(fetched.record.redaction_report.secrets_included, false);
  assertImportedContextRecordAuthorityBoundary(fetched.record.authority_boundary);

  const byMapping = readAgWorkResumeImportedContexts({ mapping_id: primary.mapping_id });
  assertListedOne(byMapping, primaryImportId, "mapping_id list");

  const byForeign = readAgWorkResumeImportedContexts({
    foreign_scope: primary.mapping.foreign_scope,
    foreign_work_id: primary.mapping.foreign_work_id,
  });
  assertListedOne(byForeign, primaryImportId, "foreign tuple list");

  const byLocal = readAgWorkResumeImportedContexts({
    local_scope: primary.mapping.local_scope,
    local_work_id: primary.mapping.local_work_id,
  });
  assertListedOne(byLocal, primaryImportId, "local tuple list");

  const byPacket = readAgWorkResumeImportedContexts({
    packet_id: primary.mapping.packet_id,
    packet_hash: primary.mapping.packet_hash,
  });
  assertListedOne(byPacket, primaryImportId, "packet tuple list");

  const byStatusDefaultLimit = readAgWorkResumeImportedContexts({
    status: "review_metadata",
  });
  assert.equal(byStatusDefaultLimit.ok, true);
  assert.equal(byStatusDefaultLimit.status, "listed");
  assert.equal(byStatusDefaultLimit.limit, 20);
  assert.equal(byStatusDefaultLimit.records.length, 20);
  assertReadAuthorityBoundary(byStatusDefaultLimit.authority_boundary);

  const byStatusCappedLimit = readAgWorkResumeImportedContexts({
    status: "review_metadata",
    limit: 200,
  });
  assert.equal(byStatusCappedLimit.ok, true);
  assert.equal(byStatusCappedLimit.limit, 100);
  assert.equal(byStatusCappedLimit.records.length <= 100, true);

  const byCreator = readAgWorkResumeImportedContexts({
    created_by: "user-core:imported-context-read-primary",
  });
  assertListedOne(byCreator, primaryImportId, "created_by list");

  for (const invalidCase of [
    { name: "no filters", input: {} },
    { name: "import_id with mapping_id", input: { import_id: primaryImportId, mapping_id: primary.mapping_id } },
    { name: "import_id with limit", input: { import_id: primaryImportId, limit: 1 } },
    { name: "foreign tuple incomplete", input: { foreign_scope: primary.mapping.foreign_scope } },
    { name: "local tuple incomplete", input: { local_work_id: primary.mapping.local_work_id } },
    { name: "packet tuple incomplete", input: { packet_id: primary.mapping.packet_id } },
    { name: "bad status", input: { status: "active" } },
    { name: "bad limit", input: { status: "review_metadata", limit: 0 } },
    { name: "unknown field", input: { mapping_id: primary.mapping_id, db_path: dbPath } },
  ]) {
    const result = readAgWorkResumeImportedContexts(invalidCase.input);
    assert.equal(result.ok, false, invalidCase.name);
    assert.equal(result.status, "invalid_input", invalidCase.name);
    assertReadAuthorityBoundary(result.authority_boundary);
  }

  const missingCore = readAgWorkResumeImportedContexts({
    import_id: "ag-resume-imported-context:missing",
  });
  assert.equal(missingCore.ok, false);
  assert.equal(missingCore.status, "not_found");
  assertReadAuthorityBoundary(missingCore.authority_boundary);

  const inputFile = path.join(tempDir, "read-input.json");
  writeFileSync(inputFile, JSON.stringify({ mapping_id: primary.mapping_id }));
  const helperEnv = runHelper({
    dbPath,
    envInput: { import_id: primaryImportId },
  });
  assert.equal(helperEnv.status, 0);
  assert.equal(helperEnv.json.ok, true);
  assert.equal(helperEnv.json.input_mode, "env");
  assert.equal(helperEnv.json.result.status, "fetched");

  const helperFile = runHelper({ dbPath, filePath: inputFile });
  assert.equal(helperFile.status, 0);
  assert.equal(helperFile.json.ok, true);
  assert.equal(helperFile.json.input_mode, "file");
  assert.equal(helperFile.json.result.status, "listed");

  const helperFlags = runHelper({
    dbPath,
    flags: {
      foreign_scope: primary.mapping.foreign_scope,
      foreign_work_id: primary.mapping.foreign_work_id,
      limit: "5",
    },
  });
  assert.equal(helperFlags.status, 0);
  assert.equal(helperFlags.json.ok, true);
  assert.equal(helperFlags.json.input_mode, "flags");
  assert.equal(helperFlags.json.result.status, "listed");

  const helperStdin = runHelper({
    dbPath,
    stdinInput: { created_by: "user-core:imported-context-read-primary" },
  });
  assert.equal(helperStdin.status, 0);
  assert.equal(helperStdin.json.ok, true);
  assert.equal(helperStdin.json.input_mode, "stdin");
  assert.equal(helperStdin.json.result.status, "listed");

  const helperInvalid = runHelper({ dbPath, stdinInput: {} });
  assert.notEqual(helperInvalid.status, 0);
  assert.equal(helperInvalid.json.ok, false);
  assert.equal(helperInvalid.json.result.status, "invalid_input");

  const helperNotFound = runHelper({
    dbPath,
    flags: { import_id: "ag-resume-imported-context:missing" },
  });
  assert.notEqual(helperNotFound.status, 0);
  assert.equal(helperNotFound.json.ok, false);
  assert.equal(helperNotFound.json.result.status, "not_found");

  const getFetch = await GET(getRequest(`?import_id=${encodeURIComponent(primaryImportId)}`));
  const getFetchPayload = await getFetch.json();
  assert.equal(getFetch.status, 200);
  assert.equal(getFetchPayload.ok, true);
  assert.equal(getFetchPayload.route, "ag_work_resume_imported_context_read.v0_1");
  assert.equal(getFetchPayload.result.status, "fetched");
  assertReadAuthorityBoundary(getFetchPayload.authority_boundary);

  const getList = await GET(getRequest(`?mapping_id=${encodeURIComponent(primary.mapping_id)}`));
  const getListPayload = await getList.json();
  assert.equal(getList.status, 200);
  assert.equal(getListPayload.ok, true);
  assert.equal(getListPayload.result.status, "listed");

  await assertGetFailure({
    name: "repeated query",
    request: getRequest("?mapping_id=a&mapping_id=b"),
    expectedStatus: 400,
    expectedResultStatus: null,
    GET,
  });
  await assertGetFailure({
    name: "unknown query",
    request: getRequest("?db=1"),
    expectedStatus: 400,
    expectedResultStatus: null,
    GET,
  });
  await assertGetFailure({
    name: "request body",
    request: getRequest("?status=review_metadata", true),
    expectedStatus: 400,
    expectedResultStatus: null,
    GET,
  });
  await assertGetFailure({
    name: "invalid filters",
    request: getRequest("?foreign_scope=project%3Aforeign"),
    expectedStatus: 400,
    expectedResultStatus: "invalid_input",
    GET,
  });
  await assertGetFailure({
    name: "not found",
    request: getRequest("?import_id=ag-resume-imported-context%3Amissing"),
    expectedStatus: 404,
    expectedResultStatus: "not_found",
    GET,
  });

  assert.equal(countRows(dbPath, tableName), importedRowsBeforeReads);
  assert.equal(snapshotImportedContextRows(dbPath), importedRowsSnapshotBeforeReads);
  assertSideEffectsUnchanged(dbPath, primary, beforeReads);
  assertNoForbiddenRows(dbPath);
  assert.equal(fetchCalls, 0);

  console.log(
    JSON.stringify(
      {
        smoke: "ag-work-resume-imported-context-read",
        temp_db_path: dbPath,
        cases: [
          "package scripts are present",
          "read core/helper/route/docs source guards pass",
          "core fetches by import_id",
          "core lists by mapping_id, foreign tuple, local tuple, packet tuple, status, and created_by",
          "default and capped limits are deterministic",
          "JSON text fields parse correctly",
          "invalid filters fail closed",
          "not_found returns not_found",
          "helper env/file/flags/stdin succeeds",
          "helper invalid input and not_found exit non-zero",
          "GET fetch/list succeeds",
          "GET repeated, unknown, body, invalid filter, and not_found cases fail closed",
          "existing POST create route remains exported and creates one row",
          "read paths leave imported context rows and protected tables unchanged",
          "confirmed mapping, source proposal, and local work rows are unchanged",
          "no fetch/network call observed in core/route process",
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
    helperPath,
    smokePath,
    routePath,
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
    packageJson.scripts?.["ag:resume-imported-context-read"],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/ag-work-resume-imported-context-read.mjs",
  );
  assert.equal(
    packageJson.scripts?.["smoke:ag-work-resume-imported-context-read"],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-ag-work-resume-imported-context-read.mjs",
  );
}

function assertSourceGuards() {
  const sources = {
    readCore: readFileSync(readCorePath, "utf8"),
    helper: readFileSync(helperPath, "utf8"),
    route: readFileSync(routePath, "utf8"),
  };
  for (const [label, source] of Object.entries({
    readCore: sources.readCore,
    helper: sources.helper,
  })) {
    const importText = extractImportText(source);
    for (const forbidden of [/node:http/i, /node:https/i, /node:net/i, /node:tls/i]) {
      assert.doesNotMatch(importText, forbidden, `${label} must not import ${forbidden}`);
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
      /app\/api\//i,
    ]) {
      assert.doesNotMatch(source, forbidden, `${label} must not contain ${forbidden}`);
    }
    assert.doesNotMatch(
      source,
      /\b(INSERT|UPDATE|DELETE|REPLACE|ALTER|DROP|CREATE\s+TABLE)\b/i,
      `${label} must not contain write SQL`,
    );
  }

  const routeImportText = extractImportText(sources.route);
  assert.match(routeImportText, /@\/lib\/ag-work-resume-imported-context\b/);
  assert.match(routeImportText, /@\/lib\/ag-work-resume-imported-context-read/);
  assert.match(routeImportText, /next\/server/);
  for (const forbidden of [
    /ag-work-resume-confirmed-mapping/i,
    /ag-work-resume-mapping-proposal/i,
    /node:http/i,
    /node:https/i,
    /node:net/i,
    /node:tls/i,
  ]) {
    assert.doesNotMatch(routeImportText, forbidden, `route import guard forbids ${forbidden}`);
  }

  const changedFiles = gitChangedFiles();
  const allowedFiles = new Set([
    "lib/ag-work-resume-imported-context-read.ts",
    "scripts/ag-work-resume-imported-context-read.mjs",
    "scripts/smoke-ag-work-resume-imported-context-read.mjs",
    "app/api/ag-work-resume/imported-contexts/route.ts",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_READ_V0_1.md",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_ROUTE_V0_1.md",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_WRITER_V0_1.md",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_DB_SCHEMA_IMPLEMENTATION_V0_1.md",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_DB_SCHEMA_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_RECORD_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md",
    "package.json",
    "scripts/smoke-ag-work-resume-imported-context-route.mjs",
    "scripts/smoke-ag-work-resume-imported-context-writer.mjs",
    "scripts/smoke-ag-work-resume-imported-context-db-schema.mjs",
    "scripts/smoke-ag-work-resume-imported-context-db-schema-design.mjs",
    "scripts/smoke-ag-work-resume-imported-context-record-design.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-writer.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-route.mjs",
  ]);
  for (const file of changedFiles) {
    assert.ok(
      allowedFiles.has(file),
      `changed file is outside imported context read helper/route slice: ${file}`,
    );
    assert.equal(file.startsWith("components/"), false, `no component change: ${file}`);
    assert.equal(file.startsWith("migrations/"), false, `no migration change: ${file}`);
    assert.equal(file.startsWith("apps/"), false, `no MCP/App change: ${file}`);
    assert.equal(file.startsWith("reports/browser/"), false, `no browser report: ${file}`);
    assert.notEqual(file, "lib/db/schema.sql", "schema.sql must be unchanged");
    assert.ok(
      file === "lib/ag-work-resume-imported-context-read.ts" || !file.startsWith("lib/"),
      `lib changes limited to imported context read core: ${file}`,
    );
    assert.ok(
      file === "app/api/ag-work-resume/imported-contexts/route.ts" ||
        !file.startsWith("app/"),
      `app changes limited to imported context collection route: ${file}`,
    );
  }
}

function assertDocsGuard() {
  const docs = readFileSync(docsPath, "utf8");
  for (const pattern of [
    /Purpose/i,
    /Relationship To Writer Route Schema And Design/i,
    /Read Filters/i,
    /Validation Rules/i,
    /Core API/i,
    /Local Helper Usage/i,
    /GET Route Behavior/i,
    /Result shape/i,
    /JSON Text Parsing/i,
    /Authority Boundary/i,
    /Non-Goals/i,
    /browser verification skipped: no rendered UI\/operator surface changed in this imported context read helper\/route slice/i,
    /read-only imported context review metadata only/i,
    /not proof\/evidence/i,
    /not session binding/i,
    /not Codex/i,
    /not\s+work item\/event creation/is,
    /not\s+confirmed mapping\/proposal mutation/is,
    /approval, publish, retry, replay, or merge authority/i,
    /No Cockpit UI/i,
    /No schema or migration/i,
    /existing POST create route is preserved/i,
  ]) {
    assert.match(docs, pattern, `read docs must include ${pattern}`);
  }

  for (const pointerDocPath of pointerDocPaths) {
    const pointerDocs = readFileSync(pointerDocPath, "utf8");
    assert.match(
      pointerDocs,
      /AG_WORK_RESUME_IMPORTED_CONTEXT_READ_V0_1\.md/,
      `${path.basename(pointerDocPath)} must point to imported context read doc`,
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
  buildAgWorkResumePacketPreview,
  createAgWorkResumeMappingProposalRecord,
  createAgWorkResumeConfirmedMapping,
}) {
  const packet = buildAgWorkResumePacketPreview(
    buildFixtureInput({
      key,
      foreignWorkId: `AG-IMPORTED-CONTEXT-READ-${key.toUpperCase()}`,
      runtimeInstanceId: `runtime-instance:imported-context-read-${key}`,
    }),
  );
  const candidate = buildCandidateFromPacket(packet, {
    candidate_id: `candidate:${key}`,
    local_scope: "project:augnes",
    local_work_id: `AG-LOCAL-IMPORTED-CONTEXT-READ-${key.toUpperCase()}`,
  });
  seedLocalWorkItem(dbPath, candidate);

  const proposal = createAgWorkResumeMappingProposalRecord(
    buildProposalCreateInput(packet, candidate, {
      proposal_reason: `User/Core requested imported context read fixture ${key}.`,
    }),
  );
  assert.equal(proposal.ok, true, `proposal fixture ${key} should be created`);

  const mapping = createAgWorkResumeConfirmedMapping(
    buildConfirmedInput(proposal.record, {
      confirmed_by: "user-core:imported-context-read-fixture",
      confirmation_reason: `User/Core confirmed read fixture mapping ${key}.`,
      confirmed_at: `2026-06-01T02:${String(fixtureMinute(key)).padStart(2, "0")}:00.000Z`,
    }),
  );
  assert.equal(mapping.ok, true, `confirmed mapping fixture ${key} should be created`);

  return {
    key,
    packet,
    candidate,
    proposal_id: proposal.record.proposal_id,
    proposal: readProposalRow(dbPath, proposal.record.proposal_id),
    mapping_id: mapping.record.mapping_id,
    mapping: readMappingRow(dbPath, mapping.record.mapping_id),
  };
}

function buildImportedInput(fixture, overrides = {}) {
  const hasOverride = (key) => Object.prototype.hasOwnProperty.call(overrides, key);
  return {
    mapping_id: fixture.mapping_id,
    packet_id: fixture.mapping.packet_id,
    packet_hash: fixture.mapping.packet_hash,
    imported_summary:
      overrides.imported_summary ??
      `Bounded imported context read summary for fixture ${fixture.key}.`,
    ...(hasOverride("imported_expected_files")
      ? { imported_expected_files: overrides.imported_expected_files }
      : { imported_expected_files: ["docs/imported-context-read.md"] }),
    ...(hasOverride("imported_expected_checks")
      ? { imported_expected_checks: overrides.imported_expected_checks }
      : { imported_expected_checks: ["npm run smoke:ag-work-resume-imported-context-read"] }),
    ...(hasOverride("foreign_refs_summary")
      ? { foreign_refs_summary: overrides.foreign_refs_summary }
      : { foreign_refs_summary: { foreign_proof_ref: "proof:foreign-public-safe" } }),
    redaction_report: overrides.redaction_report ?? safeRedactionReport(),
    created_by: overrides.created_by ?? "user-core:imported-context-read-smoke",
    import_reason:
      overrides.import_reason ??
      `User/Core imported bounded context for read fixture ${fixture.key}.`,
    ...(overrides.created_at !== undefined ? { created_at: overrides.created_at } : {}),
  };
}

function buildConfirmedInput(proposal, overrides = {}) {
  return {
    source_proposal_id: proposal.proposal_id,
    confirmed_by: overrides.confirmed_by ?? "user-core:imported-context-read-smoke",
    confirmation_reason:
      overrides.confirmation_reason ??
      "User/Core confirmed mapping before imported context read smoke.",
    confirmed_at: overrides.confirmed_at,
  };
}

function buildProposalCreateInput(packet, candidate, overrides = {}) {
  return {
    packet,
    candidates: [candidate],
    selected_candidate_id: candidate.candidate_id,
    proposed_by: "user-core:imported-context-read-smoke",
    proposal_reason:
      overrides.proposal_reason ??
      "User/Core requested a durable proposal for later imported context read review.",
    status: "proposed",
    expires_at: null,
    source: {
      reviewed_by_surface: "codex",
      reviewed_at: "2026-06-01T02:00:00.000Z",
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
      as_of: "2026-06-01T02:00:00.000Z",
      framing: {
        work_id: "Trace anchor only.",
        state_authority: "Augnes committed state remains authority.",
        execution_proof: "Action records remain proof.",
        temporal_proof: "Temporal graph remains proof over time.",
      },
      work: {
        work_id: foreignWorkId,
        scope,
        title: `Imported context read fixture ${key}`,
        status: "in_progress",
        priority: "now",
        summary: "Create an imported context read smoke fixture.",
        next_action: "Read bounded imported review metadata.",
        user_attention_required: false,
        related_state_keys: ["coordination.ag_resume_imported_context"],
        links: {
          docs: ["docs/AG_WORK_RESUME_IMPORTED_CONTEXT_READ_V0_1.md"],
        },
        created_at: "2026-06-01T02:00:00.000Z",
        updated_at: "2026-06-01T02:00:00.000Z",
      },
      next_action: "Read bounded imported review metadata.",
      user_attention_required: false,
      recent_events: [],
      related_state_keys: ["coordination.ag_resume_imported_context"],
      related_proof: {
        action_ids: [],
        action_records: [],
        docs: ["docs/AG_WORK_RESUME_IMPORTED_CONTEXT_READ_V0_1.md"],
        note: "No local proof is imported by imported context reads.",
      },
      codex_handoff: {
        task_brief: "Implement imported context read helper and route.",
        constraints: ["No UI.", "No proof/evidence.", "No Codex execution."],
        suggested_verification: [
          "npm run smoke:ag-work-resume-imported-context-read",
        ],
      },
    },
    stateBrief: {
      runtime: "augnes",
      scope,
      as_of: "2026-06-01T02:00:00.000Z",
      generated_at: "2026-06-01T02:00:00.000Z",
      agent_instructions: ["Keep AG Resume mapping/import authority gated."],
      agent_handoff: {
        current_status: {
          notable_state_keys: ["coordination.ag_resume_imported_context"],
        },
        next_recommended_action: {
          related_state_keys: ["coordination.ag_resume_imported_context"],
        },
        codex_handoff: {
          task_brief: "Implement imported context read helper and route.",
          constraints: ["No UI.", "No proof/evidence.", "No Codex execution."],
          likely_files: [
            "lib/ag-work-resume-imported-context-read.ts",
            "scripts/ag-work-resume-imported-context-read.mjs",
            "app/api/ag-work-resume/imported-contexts/route.ts",
          ],
          verification_commands: [
            "npm run smoke:ag-work-resume-imported-context-read",
          ],
        },
      },
    },
    handoffDraft: {
      handoff_id: `handoff:imported-context-read-smoke:${key}`,
      status: "ready",
      expected_files: ["lib/ag-work-resume-imported-context-read.ts"],
      expected_checks: ["npm run smoke:ag-work-resume-imported-context-read"],
      expected_execution_surfaces: [],
      forbidden_surfaces: ["proof/evidence", "session binding", "Codex execution"],
      stop_conditions: ["Imported context read output grants downstream authority."],
      safety_boundaries: [
        "Imported context reads expose only bounded review metadata.",
      ],
    },
    git: {
      remote: "https://github.com/hynk-studio/augnes.git",
      base_branch: "main",
      base_commit: "0c873b4",
      working_branch: "codex/ag-resume-imported-context-read",
      head_commit: "imported-context-read",
      related_pr: null,
      dirty_worktree: false,
    },
    issuer: {
      runtime_instance_id: runtimeInstanceId,
      source_local_label: `source-local-imported-context-read-${key}`,
      created_by_surface: "imported-context-read-smoke",
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
      links: JSON.stringify({ source: "imported-context-read-smoke" }),
      created_at: "2026-06-01T02:00:00.000Z",
      updated_at: "2026-06-01T02:00:00.000Z",
    });
  } finally {
    db.close();
  }
}

function runHelper({ dbPath: helperDbPath, envInput, filePath, flags, stdinInput }) {
  const args = [
    "--tsconfig",
    "tsconfig.json",
    "scripts/ag-work-resume-imported-context-read.mjs",
    "--json",
  ];
  if (filePath) {
    args.push("--file", filePath);
  }
  if (flags) {
    for (const [key, value] of Object.entries(flags)) {
      args.push(`--${key.replaceAll("_", "-")}`, value);
    }
  }
  const result = spawnSync("./apps/augnes_apps/node_modules/.bin/tsx", args, {
    cwd: rootDir,
    env: {
      ...process.env,
      AUGNES_DB_PATH: helperDbPath,
      ...(envInput
        ? {
            AG_WORK_RESUME_IMPORTED_CONTEXT_READ_INPUT: JSON.stringify(envInput),
          }
        : {}),
    },
    input: stdinInput ? JSON.stringify(stdinInput) : undefined,
    encoding: "utf8",
  });
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

function assertListedOne(result, importId, label) {
  assert.equal(result.ok, true, label);
  assert.equal(result.status, "listed", label);
  assert.equal(result.records.length, 1, label);
  assert.equal(result.records[0].import_id, importId, label);
  assertReadAuthorityBoundary(result.authority_boundary);
}

async function assertGetFailure({
  name,
  request,
  expectedStatus,
  expectedResultStatus,
  GET,
}) {
  const response = await GET(request);
  const payload = await response.json();
  assert.equal(response.status, expectedStatus, name);
  assert.equal(payload.ok, false, name);
  assert.equal(payload.route, "ag_work_resume_imported_context_read.v0_1", name);
  if (expectedResultStatus) {
    assert.equal(payload.result.status, expectedResultStatus, name);
    assertReadAuthorityBoundary(payload.authority_boundary);
  } else {
    assert.equal("result" in payload, false, name);
  }
}

function sideEffectSnapshot(targetDbPath, fixture) {
  return {
    protectedCounts: snapshotProtectedCounts(targetDbPath),
    mappingRow: snapshotMappingRow(targetDbPath, fixture.mapping_id),
    proposalRow: snapshotProposalRow(targetDbPath, fixture.proposal_id),
    localWorkRow: snapshotLocalWorkRow(
      targetDbPath,
      fixture.candidate.local_scope,
      fixture.candidate.local_work_id,
    ),
  };
}

function assertSideEffectsUnchanged(targetDbPath, fixture, before) {
  assertProtectedCounts(targetDbPath, before.protectedCounts, fixture.key);
  assert.equal(
    snapshotMappingRow(targetDbPath, fixture.mapping_id),
    before.mappingRow,
    `${fixture.key}: confirmed mapping row must not change`,
  );
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

function assertNoForbiddenRows(targetDbPath) {
  for (const table of [
    "sessions",
    "work_events",
    "action_records",
    "verification_evidence_records",
  ]) {
    assert.equal(countRows(targetDbPath, table), 0, `${table} rows must not be created`);
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
    return db.prepare(`SELECT * FROM ${proposalTableName} WHERE proposal_id = ?`).get(proposalId);
  } finally {
    db.close();
  }
}

function readMappingRow(targetDbPath, mappingId) {
  const db = new Database(targetDbPath);
  try {
    return db.prepare(`SELECT * FROM ${mappingTableName} WHERE mapping_id = ?`).get(mappingId);
  } finally {
    db.close();
  }
}

function snapshotProposalRow(targetDbPath, proposalId) {
  return JSON.stringify(readProposalRow(targetDbPath, proposalId));
}

function snapshotMappingRow(targetDbPath, mappingId) {
  return JSON.stringify(readMappingRow(targetDbPath, mappingId));
}

function snapshotLocalWorkRow(targetDbPath, scope, workId) {
  const db = new Database(targetDbPath);
  try {
    return JSON.stringify(
      db.prepare("SELECT * FROM work_items WHERE scope = ? AND work_id = ?").get(scope, workId) ??
        null,
    );
  } finally {
    db.close();
  }
}

function snapshotImportedContextRows(targetDbPath) {
  const db = new Database(targetDbPath);
  try {
    return JSON.stringify(
      db.prepare(`SELECT * FROM ${tableName} ORDER BY import_id ASC`).all(),
    );
  } finally {
    db.close();
  }
}

function assertReadAuthorityBoundary(boundary) {
  assert.equal(boundary.read_only, true);
  assert.equal(boundary.review_metadata_only, true);
  for (const key of [
    "imported_context_created",
    "imported_context_updated",
    "imported_context_deleted",
    "confirmed_mapping_created",
    "confirmed_mapping_updated",
    "proposal_record_updated",
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
  assert.match(boundary.statement, /bounded review metadata only/i);
  assert.match(boundary.statement, /not proof\/evidence\/session\/Codex\/merge authority/i);
}

function assertImportedContextRecordAuthorityBoundary(boundary) {
  assert.equal(boundary.imported_context_created, true);
  assert.equal(boundary.review_metadata_only, true);
  assert.equal(boundary.confirmed_mapping_required, true);
  for (const key of [
    "confirmed_mapping_updated",
    "proposal_record_updated",
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
  assert.match(boundary.statement, /bounded review metadata only/i);
  assert.match(boundary.statement, /not proof\/evidence\/session\/Codex\/merge authority/i);
}

function safeRedactionReport() {
  return {
    secrets_included: false,
    raw_db_paths_included: false,
    session_payloads_included: false,
    proof_payloads_included: false,
  };
}

function routeUrl(query = "") {
  return `http://localhost/api/ag-work-resume/imported-contexts${query}`;
}

function jsonPostRequest(body) {
  return new Request(routeUrl(), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function getRequest(query = "", withBody = false) {
  const request = new Request(routeUrl(query), { method: "GET" });
  if (withBody) {
    Object.defineProperty(request, "body", {
      value: new ReadableStream(),
      configurable: true,
    });
  }
  return request;
}

function fixtureMinute(key) {
  return (Array.from(key).reduce((sum, char) => sum + char.charCodeAt(0), 0) % 50) + 1;
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
  if (diffResult.status !== 0 || cachedResult.status !== 0 || untrackedResult.status !== 0) {
    return [];
  }
  return `${diffResult.stdout}\n${cachedResult.stdout}\n${untrackedResult.stdout}`
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function isPathInside(childPath, parentPath) {
  const relative = path.relative(parentPath, childPath);
  return relative.length === 0 || (!relative.startsWith("..") && !path.isAbsolute(relative));
}
