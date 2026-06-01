import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const readCorePath = path.join(
  rootDir,
  "lib",
  "ag-work-resume-proof-evidence-reconciliation-candidate-read.ts",
);
const writerPath = path.join(
  rootDir,
  "lib",
  "ag-work-resume-proof-evidence-reconciliation-candidate.ts",
);
const helperPath = path.join(
  rootDir,
  "scripts",
  "ag-work-resume-proof-evidence-reconciliation-candidate-read.mjs",
);
const smokePath = fileURLToPath(import.meta.url);
const routePath = path.join(
  rootDir,
  "app",
  "api",
  "ag-work-resume",
  "proof-evidence-reconciliation-candidates",
  "route.ts",
);
const docsPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_READ_V0_1.md",
);
const packagePath = path.join(rootDir, "package.json");
const schemaPath = path.join(rootDir, "lib", "db", "schema.sql");
const tableName =
  "ag_work_resume_proof_evidence_reconciliation_candidates";
const importedTableName = "ag_work_resume_imported_contexts";
const mappingTableName = "ag_work_resume_confirmed_mappings";
const proposalTableName = "ag_work_resume_mapping_proposals";
const pointerDocPaths = [
  path.join(
    rootDir,
    "docs",
    "AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_ROUTE_V0_1.md",
  ),
  path.join(
    rootDir,
    "docs",
    "AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_WRITER_V0_1.md",
  ),
  path.join(
    rootDir,
    "docs",
    "AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_DB_SCHEMA_IMPLEMENTATION_V0_1.md",
  ),
  path.join(
    rootDir,
    "docs",
    "AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_DB_SCHEMA_DESIGN_V0_1.md",
  ),
  path.join(
    rootDir,
    "docs",
    "AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_DESIGN_V0_1.md",
  ),
  path.join(
    rootDir,
    "docs",
    "AG_WORK_RESUME_PROOF_EVIDENCE_SESSION_CODEX_GATES_DESIGN_V0_1.md",
  ),
  path.join(rootDir, "docs", "AG_WORK_RESUME_IMPORTED_CONTEXT_READ_V0_1.md"),
  path.join(rootDir, "docs", "AG_WORK_RESUME_IMPORTED_CONTEXT_ROUTE_V0_1.md"),
  path.join(rootDir, "docs", "AG_WORK_RESUME_IMPORTED_CONTEXT_WRITER_V0_1.md"),
  path.join(
    rootDir,
    "docs",
    "AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md",
  ),
];
const tempDir = mkdtempSync(
  path.join(os.tmpdir(), "augnes-ag-resume-reconciliation-candidate-read-"),
);
const dbPath = path.join(tempDir, "augnes.db");

process.env.AUGNES_DB_PATH = dbPath;
process.env.OPENAI_API_KEY = "smoke-openai-key-must-not-be-used";

let fetchCalls = 0;
globalThis.fetch = async () => {
  fetchCalls += 1;
  throw new Error(
    "AG resume reconciliation candidate read smoke must not call fetch.",
  );
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
  const {
    createAgWorkResumeConfirmedMapping,
  } = await import("../lib/ag-work-resume-confirmed-mapping.ts");
  const { createAgWorkResumeImportedContext } = await import(
    "../lib/ag-work-resume-imported-context.ts"
  );
  const {
    createAgWorkResumeProofEvidenceReconciliationCandidate,
  } = await import(
    "../lib/ag-work-resume-proof-evidence-reconciliation-candidate.ts"
  );
  const {
    readAgWorkResumeProofEvidenceReconciliationCandidates,
  } = await import(
    "../lib/ag-work-resume-proof-evidence-reconciliation-candidate-read.ts"
  );
  const { GET, POST } = await import(
    "../app/api/ag-work-resume/proof-evidence-reconciliation-candidates/route.ts"
  );
  assert.equal(typeof GET, "function", "candidate route must expose GET");
  assert.equal(typeof POST, "function", "candidate route must keep POST");

  const createFixture = (key) =>
    createImportedContextFixture({
      key,
      buildAgWorkResumePacketPreview,
      createAgWorkResumeMappingProposalRecord,
      createAgWorkResumeConfirmedMapping,
      createAgWorkResumeImportedContext,
    });

  const primary = createFixture("read-primary");
  const primaryCreate =
    createAgWorkResumeProofEvidenceReconciliationCandidate(
      buildCandidateInput(primary, {
        foreign_ref_id: "foreign-proof:read-primary",
        proposed_by: "user-core:reconciliation-candidate-read-primary",
        created_at: "2026-06-01T04:00:00.000Z",
      }),
    );
  assert.equal(primaryCreate.ok, true);
  const primaryCandidateId = primaryCreate.record.candidate_id;

  const routeFixture = createFixture("read-post-preserved");
  const postResponse = await POST(
    jsonPostRequest(
      buildCandidateInput(routeFixture, {
        foreign_ref_id: "foreign-proof:read-post-preserved",
        created_at: "2026-06-01T04:01:00.000Z",
      }),
    ),
  );
  const postPayload = await postResponse.json();
  assert.equal(postResponse.status, 201);
  assert.equal(
    postPayload.route,
    "ag_work_resume_proof_evidence_reconciliation_candidates.v0_1",
  );
  assert.equal(postPayload.result.status, "created");

  const reviewedFixture = createFixture("read-reviewed");
  const reviewedCreate =
    createAgWorkResumeProofEvidenceReconciliationCandidate(
      buildCandidateInput(reviewedFixture, {
        foreign_ref_id: "foreign-proof:read-reviewed",
        proposed_by: "user-core:reconciliation-candidate-read-reviewed",
        created_at: "2026-06-01T04:02:00.000Z",
      }),
    );
  assert.equal(reviewedCreate.ok, true);
  markCandidateReviewed(
    dbPath,
    reviewedCreate.record.candidate_id,
    "user-core:reviewer-read-smoke",
  );

  for (let index = 0; index < 24; index += 1) {
    const fixture = createFixture(`read-bulk-${String(index).padStart(2, "0")}`);
    const result = createAgWorkResumeProofEvidenceReconciliationCandidate(
      buildCandidateInput(fixture, {
        foreign_ref_id: `foreign-proof:read-bulk-${index}`,
        proposed_by: "user-core:reconciliation-candidate-read-bulk",
        created_at: `2026-06-01T04:${String(index + 3).padStart(2, "0")}:00.000Z`,
      }),
    );
    assert.equal(result.ok, true, `bulk candidate ${index} should be created`);
  }

  const beforeReads = sideEffectSnapshot(dbPath, primary);
  const candidateRowsBeforeReads = countRows(dbPath, tableName);
  const candidateRowsSnapshotBeforeReads = snapshotCandidateRows(dbPath);

  const fetched = readAgWorkResumeProofEvidenceReconciliationCandidates({
    candidate_id: primaryCandidateId,
  });
  assert.equal(fetched.ok, true);
  assert.equal(fetched.status, "fetched");
  assert.equal(fetched.record.candidate_id, primaryCandidateId);
  assert.equal(fetched.records.length, 1);
  assert.equal(fetched.limit, null);
  assertReadAuthorityBoundary(fetched.authority_boundary);
  assert.equal(fetched.record.redaction_status.safe, true);
  assert.equal(fetched.record.authority_boundary.review_metadata_only, true);

  assertListedOne(
    readAgWorkResumeProofEvidenceReconciliationCandidates({
      import_id: primary.import_id,
    }),
    primaryCandidateId,
    "import_id list",
  );
  assertListedOne(
    readAgWorkResumeProofEvidenceReconciliationCandidates({
      mapping_id: primary.mapping_id,
    }),
    primaryCandidateId,
    "mapping_id list",
  );
  assertListedOne(
    readAgWorkResumeProofEvidenceReconciliationCandidates({
      foreign_ref_type: "proof",
      foreign_ref_id: "foreign-proof:read-primary",
    }),
    primaryCandidateId,
    "foreign ref tuple list",
  );
  assertListedOne(
    readAgWorkResumeProofEvidenceReconciliationCandidates({
      local_target_scope: primary.mapping.local_scope,
      local_target_work_id: primary.mapping.local_work_id,
    }),
    primaryCandidateId,
    "local target tuple list",
  );

  const byStatusDefaultLimit =
    readAgWorkResumeProofEvidenceReconciliationCandidates({
      status: "proposed",
    });
  assert.equal(byStatusDefaultLimit.ok, true);
  assert.equal(byStatusDefaultLimit.status, "listed");
  assert.equal(byStatusDefaultLimit.limit, 20);
  assert.equal(byStatusDefaultLimit.records.length, 20);
  assertReadAuthorityBoundary(byStatusDefaultLimit.authority_boundary);

  const byStatusCappedLimit =
    readAgWorkResumeProofEvidenceReconciliationCandidates({
      status: "proposed",
      limit: 200,
    });
  assert.equal(byStatusCappedLimit.ok, true);
  assert.equal(byStatusCappedLimit.limit, 100);
  assert.equal(byStatusCappedLimit.records.length <= 100, true);

  assertListedOne(
    readAgWorkResumeProofEvidenceReconciliationCandidates({
      proposed_by: "user-core:reconciliation-candidate-read-primary",
    }),
    primaryCandidateId,
    "proposed_by list",
  );
  assertListedOne(
    readAgWorkResumeProofEvidenceReconciliationCandidates({
      reviewed_by: "user-core:reviewer-read-smoke",
    }),
    reviewedCreate.record.candidate_id,
    "reviewed_by list",
  );

  for (const invalidCase of [
    { name: "no filters", input: {} },
    {
      name: "candidate_id with import_id",
      input: { candidate_id: primaryCandidateId, import_id: primary.import_id },
    },
    {
      name: "candidate_id with limit",
      input: { candidate_id: primaryCandidateId, limit: 1 },
    },
    { name: "foreign ref tuple incomplete", input: { foreign_ref_type: "proof" } },
    {
      name: "local target tuple incomplete",
      input: { local_target_scope: primary.mapping.local_scope },
    },
    { name: "bad foreign_ref_type", input: { foreign_ref_type: "raw", foreign_ref_id: "x" } },
    { name: "bad status", input: { status: "active" } },
    { name: "bad limit", input: { status: "proposed", limit: 0 } },
    { name: "unknown field", input: { mapping_id: primary.mapping_id, db_path: dbPath } },
  ]) {
    const result = readAgWorkResumeProofEvidenceReconciliationCandidates(
      invalidCase.input,
    );
    assert.equal(result.ok, false, invalidCase.name);
    assert.equal(result.status, "invalid_input", invalidCase.name);
    assertReadAuthorityBoundary(result.authority_boundary);
  }

  const missingCore = readAgWorkResumeProofEvidenceReconciliationCandidates({
    candidate_id: "ag-resume-proof-evidence-reconciliation-candidate:missing",
  });
  assert.equal(missingCore.ok, false);
  assert.equal(missingCore.status, "not_found");
  assertReadAuthorityBoundary(missingCore.authority_boundary);

  const inputFile = path.join(tempDir, "read-candidate-input.json");
  writeFileSync(inputFile, JSON.stringify({ mapping_id: primary.mapping_id }));
  const helperEnv = runHelper({
    dbPath,
    envInput: { candidate_id: primaryCandidateId },
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
      foreign_ref_type: "proof",
      foreign_ref_id: "foreign-proof:read-primary",
      limit: "5",
    },
  });
  assert.equal(helperFlags.status, 0);
  assert.equal(helperFlags.json.ok, true);
  assert.equal(helperFlags.json.input_mode, "flags");
  assert.equal(helperFlags.json.result.status, "listed");

  const helperStdin = runHelper({
    dbPath,
    stdinInput: {
      proposed_by: "user-core:reconciliation-candidate-read-primary",
    },
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
    flags: {
      candidate_id: "ag-resume-proof-evidence-reconciliation-candidate:missing",
    },
  });
  assert.notEqual(helperNotFound.status, 0);
  assert.equal(helperNotFound.json.ok, false);
  assert.equal(helperNotFound.json.result.status, "not_found");

  const getFetch = await GET(
    getRequest(`?candidate_id=${encodeURIComponent(primaryCandidateId)}`),
  );
  const getFetchPayload = await getFetch.json();
  assert.equal(getFetch.status, 200);
  assert.equal(getFetchPayload.ok, true);
  assert.equal(
    getFetchPayload.route,
    "ag_work_resume_proof_evidence_reconciliation_candidate_read.v0_1",
  );
  assert.equal(getFetchPayload.result.status, "fetched");
  assertReadAuthorityBoundary(getFetchPayload.authority_boundary);

  const getList = await GET(
    getRequest(`?mapping_id=${encodeURIComponent(primary.mapping_id)}`),
  );
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
    request: getRequest("?status=proposed", true),
    expectedStatus: 400,
    expectedResultStatus: null,
    GET,
  });
  await assertGetFailure({
    name: "invalid filters",
    request: getRequest("?foreign_ref_type=proof"),
    expectedStatus: 400,
    expectedResultStatus: "invalid_input",
    GET,
  });
  await assertGetFailure({
    name: "not found",
    request: getRequest(
      "?candidate_id=ag-resume-proof-evidence-reconciliation-candidate%3Amissing",
    ),
    expectedStatus: 404,
    expectedResultStatus: "not_found",
    GET,
  });

  assert.equal(countRows(dbPath, tableName), candidateRowsBeforeReads);
  assert.equal(snapshotCandidateRows(dbPath), candidateRowsSnapshotBeforeReads);
  assertSideEffectsUnchanged(dbPath, primary, beforeReads);
  assertNoForbiddenRows(dbPath);
  assert.equal(fetchCalls, 0);

  console.log(
    JSON.stringify(
      {
        smoke:
          "ag-work-resume-proof-evidence-reconciliation-candidate-read",
        temp_db_path: dbPath,
        cases: [
          "package scripts are present",
          "read core/helper/route/docs source guards pass",
          "core fetches by candidate_id",
          "core lists by import_id, mapping_id, foreign ref tuple, local target tuple, status, proposed_by, and reviewed_by",
          "default and capped limits are deterministic",
          "JSON text fields parse correctly",
          "invalid filters fail closed",
          "not_found returns not_found",
          "helper env/file/flags/stdin succeeds",
          "helper invalid input and not_found exit non-zero",
          "GET fetch/list succeeds",
          "GET repeated, unknown, body, invalid filter, and not_found cases fail closed",
          "existing POST create route remains exported and creates one row",
          "read paths leave candidate rows and protected tables unchanged",
          "imported context, confirmed mapping, source proposal, and local work rows are unchanged",
          "no fetch/network call observed in core/helper/route process",
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
    packageJson.scripts?.[
      "ag:resume-proof-evidence-reconciliation-candidate-read"
    ],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/ag-work-resume-proof-evidence-reconciliation-candidate-read.mjs",
  );
  assert.equal(
    packageJson.scripts?.[
      "smoke:ag-work-resume-proof-evidence-reconciliation-candidate-read"
    ],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-read.mjs",
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
  assert.match(
    routeImportText,
    /@\/lib\/ag-work-resume-proof-evidence-reconciliation-candidate\b/,
  );
  assert.match(
    routeImportText,
    /@\/lib\/ag-work-resume-proof-evidence-reconciliation-candidate-read/,
  );
  assert.match(routeImportText, /next\/server/);
  for (const forbidden of [
    /ag-work-resume-imported-context["']/i,
    /ag-work-resume-confirmed-mapping/i,
    /ag-work-resume-mapping-proposal/i,
    /node:http/i,
    /node:https/i,
    /node:net/i,
    /node:tls/i,
  ]) {
    assert.doesNotMatch(routeImportText, forbidden, `route import guard forbids ${forbidden}`);
  }
  assert.match(sources.route, /export function GET\(/);
  assert.match(sources.route, /export async function POST\(/);

  assertNoUnexpectedChangedFiles();
}

function assertNoUnexpectedChangedFiles() {
  const changedFiles = new Set([
    ...gitLinesAllowFailure(["diff", "--name-only", "origin/main...HEAD"]),
    ...gitLines(["diff", "--name-only"]),
    ...gitLines(["diff", "--cached", "--name-only"]),
    ...gitLines(["ls-files", "--others", "--exclude-standard"]),
  ]);
  const allowedFiles = new Set([
    "lib/ag-work-resume-proof-evidence-reconciliation-candidate-read.ts",
    "scripts/ag-work-resume-proof-evidence-reconciliation-candidate-read.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-read.mjs",
    "app/api/ag-work-resume/proof-evidence-reconciliation-candidates/route.ts",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_READ_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_ROUTE_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_WRITER_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_DB_SCHEMA_IMPLEMENTATION_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_DB_SCHEMA_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_SESSION_CODEX_GATES_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_READ_V0_1.md",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_ROUTE_V0_1.md",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_WRITER_V0_1.md",
    "docs/AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-route.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-writer.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-db-schema.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-db-schema-design.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-design.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-session-codex-gates-design.mjs",
    "scripts/smoke-ag-work-resume-imported-context-route.mjs",
    "scripts/smoke-ag-work-resume-imported-context-writer.mjs",
    "package.json",
  ]);
  for (const file of changedFiles) {
    assert.ok(
      allowedFiles.has(file),
      `changed file is outside candidate read helper/route slice: ${file}`,
    );
    assert.ok(
      file === "lib/ag-work-resume-proof-evidence-reconciliation-candidate-read.ts" ||
        !file.startsWith("lib/"),
      `lib changes limited to candidate read core: ${file}`,
    );
    assert.ok(
      file ===
        "app/api/ag-work-resume/proof-evidence-reconciliation-candidates/route.ts" ||
        !file.startsWith("app/"),
      `app changes limited to candidate collection route: ${file}`,
    );
    assert.equal(file.startsWith("components/"), false, `no component change: ${file}`);
    assert.equal(file.startsWith("migrations/"), false, `no migration change: ${file}`);
    assert.equal(file.startsWith("apps/"), false, `no MCP/App change: ${file}`);
    assert.equal(file.startsWith("reports/browser/"), false, `no browser report: ${file}`);
    assert.notEqual(file, "lib/db/schema.sql", "schema.sql must be unchanged");
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
    /browser verification skipped: no rendered UI\/operator surface changed in this reconciliation candidate read helper\/route slice/i,
    /read-only candidate review metadata only/i,
    /Candidate rows are not proof\/evidence/i,
    /not proof\/evidence recording/i,
    /not session binding/i,
    /not Codex/i,
    /not\s+work item\/event creation/is,
    /not\s+imported context\/confirmed mapping\/proposal mutation/is,
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
      /AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_READ_V0_1\.md/,
      `${path.basename(pointerDocPath)} must point to candidate read doc`,
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

function createImportedContextFixture({
  key,
  buildAgWorkResumePacketPreview,
  createAgWorkResumeMappingProposalRecord,
  createAgWorkResumeConfirmedMapping,
  createAgWorkResumeImportedContext,
}) {
  const packet = buildAgWorkResumePacketPreview(
    buildFixtureInput({
      key,
      foreignWorkId: `AG-RECONCILIATION-CANDIDATE-READ-${key.toUpperCase()}`,
      runtimeInstanceId: `runtime-instance:reconciliation-candidate-read-${key}`,
    }),
  );
  const candidate = buildCandidateFromPacket(packet, {
    candidate_id: `candidate:${key}`,
    local_scope: "project:augnes",
    local_work_id: `AG-LOCAL-RECONCILIATION-CANDIDATE-READ-${key.toUpperCase()}`,
  });
  seedLocalWorkItem(dbPath, candidate);

  const proposal = createAgWorkResumeMappingProposalRecord(
    buildProposalCreateInput(packet, candidate, {
      proposal_reason: `User/Core requested reconciliation candidate read fixture ${key}.`,
    }),
  );
  assert.equal(proposal.ok, true, `proposal fixture ${key} should be created`);

  const mapping = createAgWorkResumeConfirmedMapping(
    buildConfirmedInput(proposal.record, {
      confirmed_by: "user-core:reconciliation-candidate-read-fixture",
      confirmation_reason: `User/Core confirmed read fixture mapping ${key}.`,
      confirmed_at: `2026-06-01T03:${String(fixtureMinute(key)).padStart(2, "0")}:00.000Z`,
    }),
  );
  assert.equal(mapping.ok, true, `confirmed mapping fixture ${key} should be created`);

  const imported = createAgWorkResumeImportedContext(
    buildImportedInput(mapping.record, key, {
      created_at: `2026-06-01T03:${String(fixtureMinute(key)).padStart(2, "0")}:30.000Z`,
    }),
  );
  assert.equal(imported.ok, true, `imported context fixture ${key} should be created`);

  return {
    key,
    packet,
    candidate,
    proposal_id: proposal.record.proposal_id,
    proposal: readProposalRow(dbPath, proposal.record.proposal_id),
    mapping_id: mapping.record.mapping_id,
    mapping: readMappingRow(dbPath, mapping.record.mapping_id),
    import_id: imported.record.import_id,
    imported: readImportedRow(dbPath, imported.record.import_id),
  };
}

function buildCandidateInput(fixture, overrides = {}) {
  return {
    import_id: fixture.import_id,
    ...(overrides.mapping_id !== undefined ? { mapping_id: overrides.mapping_id } : {}),
    foreign_ref_type: overrides.foreign_ref_type ?? "proof",
    foreign_ref_id:
      overrides.foreign_ref_id ?? `foreign-proof:${fixture.key}:public-safe`,
    local_target_scope:
      overrides.local_target_scope ?? fixture.mapping.local_scope,
    local_target_work_id:
      overrides.local_target_work_id ?? fixture.mapping.local_work_id,
    summary:
      overrides.summary ??
      `Bounded reconciliation candidate read summary for fixture ${fixture.key}.`,
    redaction_status: overrides.redaction_status ?? safeRedactionStatus(),
    proposed_by:
      overrides.proposed_by ?? "user-core:reconciliation-candidate-read-smoke",
    proposed_reason:
      overrides.proposed_reason ??
      `User/Core proposed reconciliation candidate read fixture ${fixture.key}.`,
    ...(overrides.created_at !== undefined ? { created_at: overrides.created_at } : {}),
  };
}

function buildImportedInput(mapping, key, overrides = {}) {
  return {
    mapping_id: mapping.mapping_id,
    packet_id: mapping.packet_id,
    packet_hash: mapping.packet_hash,
    imported_summary: `Bounded imported context summary for reconciliation candidate read fixture ${key}.`,
    imported_expected_files: [
      "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_READ_V0_1.md",
    ],
    imported_expected_checks: [
      "npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-read",
    ],
    foreign_refs_summary: {
      foreign_proof_ref: `proof:foreign-public-safe:${key}`,
      foreign_evidence_ref: `evidence:foreign-public-safe:${key}`,
    },
    redaction_report: {
      secrets_included: false,
      raw_db_paths_included: false,
      session_payloads_included: false,
      proof_payloads_included: false,
    },
    created_by: "user-core:reconciliation-candidate-read-smoke",
    import_reason:
      "User/Core imported bounded context before reconciliation candidate reads.",
    created_at: overrides.created_at,
  };
}

function buildConfirmedInput(proposal, overrides = {}) {
  return {
    source_proposal_id: proposal.proposal_id,
    confirmed_by: overrides.confirmed_by ?? "user-core:reconciliation-candidate-read-smoke",
    confirmation_reason:
      overrides.confirmation_reason ??
      "User/Core confirmed mapping before reconciliation candidate reads.",
    confirmed_at: overrides.confirmed_at,
  };
}

function buildProposalCreateInput(packet, candidate, overrides = {}) {
  return {
    packet,
    candidates: [candidate],
    selected_candidate_id: candidate.candidate_id,
    proposed_by: "user-core:reconciliation-candidate-read-smoke",
    proposal_reason:
      overrides.proposal_reason ??
      "User/Core requested a durable proposal for later reconciliation candidate reads.",
    status: "proposed",
    expires_at: null,
    source: {
      reviewed_by_surface: "codex",
      reviewed_at: "2026-06-01T03:00:00.000Z",
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
      as_of: "2026-06-01T03:00:00.000Z",
      framing: {
        work_id: "Trace anchor only.",
        state_authority: "Augnes committed state remains authority.",
        execution_proof: "Action records remain proof.",
        temporal_proof: "Temporal graph remains proof over time.",
      },
      work: {
        work_id: foreignWorkId,
        scope,
        title: `Reconciliation candidate read fixture ${key}`,
        status: "in_progress",
        priority: "now",
        summary: "Create a reconciliation candidate read smoke fixture.",
        next_action: "Read bounded reconciliation candidate metadata.",
        user_attention_required: false,
        related_state_keys: ["coordination.ag_resume_reconciliation_candidate_read"],
        links: {
          docs: [
            "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_READ_V0_1.md",
          ],
        },
        created_at: "2026-06-01T03:00:00.000Z",
        updated_at: "2026-06-01T03:00:00.000Z",
      },
      next_action: "Read bounded reconciliation candidate metadata.",
      user_attention_required: false,
      recent_events: [],
      related_state_keys: ["coordination.ag_resume_reconciliation_candidate_read"],
      related_proof: {
        action_ids: [],
        action_records: [],
        docs: [
          "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_READ_V0_1.md",
        ],
        note: "No local proof is imported by reconciliation candidate metadata.",
      },
      codex_handoff: {
        task_brief: "Implement reconciliation candidate read helper/route.",
        constraints: ["No UI.", "No proof/evidence.", "No Codex execution."],
        suggested_verification: [
          "npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-read",
        ],
      },
    },
    stateBrief: {
      runtime: "augnes",
      scope,
      as_of: "2026-06-01T03:00:00.000Z",
      generated_at: "2026-06-01T03:00:00.000Z",
      agent_instructions: ["Keep AG Resume reconciliation candidate reads gated."],
      agent_handoff: {
        current_status: {
          notable_state_keys: ["coordination.ag_resume_reconciliation_candidate_read"],
        },
        next_recommended_action: {
          related_state_keys: ["coordination.ag_resume_reconciliation_candidate_read"],
        },
        codex_handoff: {
          task_brief: "Implement reconciliation candidate read helper/route.",
          constraints: ["No UI.", "No proof/evidence.", "No Codex execution."],
          likely_files: [
            "lib/ag-work-resume-proof-evidence-reconciliation-candidate-read.ts",
            "app/api/ag-work-resume/proof-evidence-reconciliation-candidates/route.ts",
          ],
          verification_commands: [
            "npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-read",
          ],
        },
      },
    },
    handoffDraft: {
      handoff_id: `handoff:reconciliation-candidate-read-smoke:${key}`,
      status: "ready",
      expected_files: [
        "lib/ag-work-resume-proof-evidence-reconciliation-candidate-read.ts",
        "app/api/ag-work-resume/proof-evidence-reconciliation-candidates/route.ts",
      ],
      expected_checks: [
        "npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-read",
      ],
      expected_execution_surfaces: [],
      forbidden_surfaces: ["proof/evidence", "session binding", "Codex execution"],
      stop_conditions: [
        "Reconciliation candidate read output grants downstream authority.",
      ],
      safety_boundaries: [
        "Reconciliation candidate reads are only bounded review metadata.",
      ],
    },
    git: {
      remote: "https://github.com/hynk-studio/augnes.git",
      base_branch: "main",
      base_commit: "2ee9709",
      working_branch: "codex/ag-resume-reconciliation-candidate-read",
      head_commit: "reconciliation-candidate-read",
      related_pr: null,
      dirty_worktree: false,
    },
    issuer: {
      runtime_instance_id: runtimeInstanceId,
      source_local_label: `source-local-reconciliation-candidate-read-${key}`,
      created_by_surface: "reconciliation-candidate-read-smoke",
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
  if (expectedResultStatus) {
    assert.equal(payload.result.status, expectedResultStatus, name);
    assertReadAuthorityBoundary(payload.authority_boundary);
  } else {
    assert.equal(payload.result, undefined, name);
  }
}

function assertListedOne(result, candidateId, label) {
  assert.equal(result.ok, true, label);
  assert.equal(result.status, "listed", label);
  assert.equal(result.records.length, 1, label);
  assert.equal(result.records[0].candidate_id, candidateId, label);
  assertReadAuthorityBoundary(result.authority_boundary);
}

function runHelper({ dbPath: helperDbPath, envInput, filePath, flags, stdinInput }) {
  const args = [
    "--tsconfig",
    "tsconfig.json",
    "scripts/ag-work-resume-proof-evidence-reconciliation-candidate-read.mjs",
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
  const result = spawnSync(
    "./apps/augnes_apps/node_modules/.bin/tsx",
    args,
    {
      cwd: rootDir,
      env: {
        ...process.env,
        AUGNES_DB_PATH: helperDbPath,
        ...(envInput
          ? {
              AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_READ_INPUT:
                JSON.stringify(envInput),
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

function sideEffectSnapshot(targetDbPath, fixture) {
  return {
    protectedCounts: snapshotProtectedCounts(targetDbPath),
    importedRow: snapshotImportedRow(targetDbPath, fixture.import_id),
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
    snapshotImportedRow(targetDbPath, fixture.import_id),
    before.importedRow,
    `${fixture.key}: imported context row must not change`,
  );
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
      links: JSON.stringify({ source: "reconciliation-candidate-read-smoke" }),
      created_at: "2026-06-01T03:00:00.000Z",
      updated_at: "2026-06-01T03:00:00.000Z",
    });
  } finally {
    db.close();
  }
}

function markCandidateReviewed(targetDbPath, candidateId, reviewedBy) {
  const db = new Database(targetDbPath);
  try {
    db.prepare(
      `
        UPDATE ag_work_resume_proof_evidence_reconciliation_candidates
        SET reviewed_by = ?,
            reviewed_at = ?,
            review_note = ?,
            updated_at = ?
        WHERE candidate_id = ?
      `,
    ).run(
      reviewedBy,
      "2026-06-01T04:02:30.000Z",
      "Read smoke fixture reviewed_by seed only.",
      "2026-06-01T04:02:30.000Z",
      candidateId,
    );
  } finally {
    db.close();
  }
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

function routeUrl(query = "") {
  return `http://localhost/api/ag-work-resume/proof-evidence-reconciliation-candidates${query}`;
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

function readImportedRow(targetDbPath, importId) {
  const db = new Database(targetDbPath);
  try {
    return db
      .prepare(`SELECT * FROM ${importedTableName} WHERE import_id = ?`)
      .get(importId);
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

function snapshotImportedRow(targetDbPath, importId) {
  return JSON.stringify(readImportedRow(targetDbPath, importId));
}

function snapshotCandidateRows(targetDbPath) {
  const db = new Database(targetDbPath);
  try {
    return JSON.stringify(
      db
        .prepare(`SELECT * FROM ${tableName} ORDER BY candidate_id ASC`)
        .all(),
    );
  } finally {
    db.close();
  }
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

function assertReadAuthorityBoundary(boundary) {
  assert.equal(boundary.read_only, true);
  assert.equal(boundary.review_metadata_only, true);
  for (const key of [
    "reconciliation_candidate_created",
    "reconciliation_candidate_updated",
    "reconciliation_candidate_deleted",
    "proof_recorded",
    "evidence_recorded",
    "session_bound",
    "codex_executed",
    "work_item_created",
    "work_event_created",
    "imported_context_updated",
    "confirmed_mapping_updated",
    "proposal_record_updated",
    "approval_granted",
    "publish_retry_replay_authority",
    "merge_authority",
  ]) {
    assert.equal(boundary[key], false, `${key} must be false`);
  }
  assert.equal(boundary.durable_approval, "user/Core gated");
  assert.match(boundary.statement, /review metadata only/i);
  assert.match(boundary.statement, /not proof\/evidence\/session\/Codex\/merge authority/i);
}

function safeRedactionStatus() {
  return {
    safe: true,
    secrets_included: false,
    raw_db_paths_included: false,
    session_payloads_included: false,
    proof_payloads_included: false,
  };
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

function gitLines(args) {
  const result = spawnSync("git", args, {
    cwd: rootDir,
    encoding: "utf8",
  });
  assert.equal(
    result.status,
    0,
    `git ${args.join(" ")} must succeed\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`,
  );
  return result.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function gitLinesAllowFailure(args) {
  const result = spawnSync("git", args, {
    cwd: rootDir,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    return [];
  }
  return result.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function isPathInside(candidatePath, parentPath) {
  const relative = path.relative(parentPath, candidatePath);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}
