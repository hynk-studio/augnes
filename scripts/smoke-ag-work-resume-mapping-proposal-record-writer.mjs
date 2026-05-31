import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const writerPath = path.join(rootDir, "lib", "ag-work-resume-mapping-proposal-record.ts");
const routePath = path.join(
  rootDir,
  "app",
  "api",
  "ag-work-resume",
  "mapping-proposal-records",
  "route.ts",
);
const helperPath = path.join(
  rootDir,
  "scripts",
  "ag-work-resume-mapping-proposal-record-create.mjs",
);
const docsPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_WRITER_V0_1.md",
);
const packagePath = path.join(rootDir, "package.json");
const tableName = "ag_work_resume_mapping_proposals";
const tempDir = mkdtempSync(
  path.join(os.tmpdir(), "augnes-ag-resume-mapping-proposal-record-writer-"),
);
const dbPath = path.join(tempDir, "augnes.db");

process.env.AUGNES_DB_PATH = dbPath;
process.env.OPENAI_API_KEY = "smoke-openai-key-must-not-be-used";

let fetchCalls = 0;
globalThis.fetch = async () => {
  fetchCalls += 1;
  throw new Error("AG resume mapping proposal record writer smoke must not call fetch.");
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
    "../app/api/ag-work-resume/mapping-proposal-records/route.ts"
  );

  const packet = buildAgWorkResumePacketPreview(buildFixtureInput());
  const candidate = buildCandidateFromPacket(packet, {
    candidate_id: "candidate:core-success",
  });
  const protectedBefore = snapshotProtectedCounts(dbPath);

  const coreResult = createAgWorkResumeMappingProposalRecord(
    buildCreateInput(packet, candidate, {
      proposal_reason: "User/Core requested core smoke proposal.",
      status: "proposed",
    }),
  );
  assert.equal(coreResult.ok, true);
  assert.equal(coreResult.status, "created");
  assert.ok(coreResult.proposal_id?.startsWith("ag-resume-mapping-proposal:"));
  assert.ok(coreResult.record?.proposal_id.startsWith("ag-resume-mapping-proposal:"));
  assert.equal(coreResult.record?.record_kind, "ag_work_resume_mapping_proposal");
  assert.equal(coreResult.record?.schema, "augnes.ag_work_resume_mapping_proposal.v0_1");
  assert.equal(coreResult.record?.status, "proposed");
  assert.equal(coreResult.record?.packet_id, packet.packet_id);
  assert.equal(coreResult.record?.packet_hash, packet.integrity.payload_hash);
  assert.equal(coreResult.record?.proposal_id.includes("mapping_id"), false);
  assert.equal(coreResult.record?.proposal_id.includes("import_id"), false);
  assert.ok(Array.isArray(coreResult.record?.comparison_summary));
  assert.ok(Array.isArray(coreResult.record?.gaps_summary));
  assert.ok(Array.isArray(coreResult.record?.conflicts_summary));
  assert.ok(Array.isArray(coreResult.record?.questions_summary));
  assert.equal(coreResult.authority_boundary.proposal_record_created, true);
  assertProposalAuthorityBoundary(coreResult.authority_boundary, true);
  assertProposalAuthorityBoundary(coreResult.record.authority_boundary, true);
  assert.equal(countRows(dbPath, tableName), 1);
  assert.equal(readProposalRow(dbPath, coreResult.record.proposal_id).status, "proposed");

  const routeCandidate = buildCandidateFromPacket(packet, {
    candidate_id: "candidate:route-success",
    local_work_id: "AG-MAPPING-WRITER-ROUTE",
  });
  const routeResponse = await POST(jsonRequest(buildCreateInput(packet, routeCandidate, {
    proposal_reason: "User/Core requested route smoke proposal.",
    status: "needs_review",
    source: {
      reviewed_by_surface: "route",
      reviewed_at: "2026-05-31T00:00:00.000Z",
    },
  })));
  const routePayload = await routeResponse.json();
  assert.equal(routeResponse.status, 201);
  assert.equal(routePayload.ok, true);
  assert.equal(routePayload.route, "ag_work_resume_mapping_proposal_records.v0_1");
  assert.equal(routePayload.result.status, "created");
  assert.equal(routePayload.result.record.status, "needs_review");
  assert.match(routePayload.recommended_next_step, /not mapping confirmation/i);
  assert.match(routePayload.recommended_next_step, /import authorization/i);
  assert.match(routePayload.recommended_next_step, /Codex execution authority/i);
  assert.equal(countRows(dbPath, tableName), 2);

  const helperEnvCandidate = buildCandidateFromPacket(packet, {
    candidate_id: "candidate:helper-env",
    local_work_id: "AG-MAPPING-WRITER-HELPER-ENV",
  });
  const helperEnv = runHelper({
    dbPath,
    envInput: buildCreateInput(packet, helperEnvCandidate, {
      proposal_reason: "User/Core requested helper env proposal.",
    }),
  });
  assert.equal(helperEnv.status, 0);
  assert.equal(helperEnv.json.ok, true);
  assert.equal(helperEnv.json.helper, "ag_work_resume_mapping_proposal_record_create.v0_1");
  assert.equal(helperEnv.json.input_mode, "env");
  assert.equal(helperEnv.json.result.status, "created");
  assert.equal(countRows(dbPath, tableName), 3);

  const helperFileCandidate = buildCandidateFromPacket(packet, {
    candidate_id: "candidate:helper-file",
    local_work_id: "AG-MAPPING-WRITER-HELPER-FILE",
  });
  const inputFile = path.join(tempDir, "helper-file-input.json");
  writeFileSync(
    inputFile,
    JSON.stringify(
      buildCreateInput(packet, helperFileCandidate, {
        proposal_reason: "User/Core requested helper file proposal.",
      }),
    ),
  );
  const helperFile = runHelper({ dbPath, filePath: inputFile });
  assert.equal(helperFile.status, 0);
  assert.equal(helperFile.json.ok, true);
  assert.equal(helperFile.json.input_mode, "file");
  assert.equal(countRows(dbPath, tableName), 4);

  const unsafePacket = cloneJson(packet);
  unsafePacket.target_runtime_policy.may_execute_codex = true;
  const beforeUnsafe = countRows(dbPath, tableName);
  const unsafeResult = createAgWorkResumeMappingProposalRecord(
    buildCreateInput(unsafePacket, buildCandidateFromPacket(unsafePacket), {
      proposal_reason: "Unsafe packet should fail.",
    }),
  );
  assert.equal(unsafeResult.ok, false);
  assert.equal(unsafeResult.status, "preflight_failed");
  assert.equal(countRows(dbPath, tableName), beforeUnsafe);
  const unsafeRoute = await POST(jsonRequest(buildCreateInput(unsafePacket, buildCandidateFromPacket(unsafePacket), {
    proposal_reason: "Unsafe packet route should fail.",
  })));
  assert.equal(unsafeRoute.status, 422);
  const unsafeHelper = runHelper({
    dbPath,
    envInput: buildCreateInput(
      unsafePacket,
      buildCandidateFromPacket(unsafePacket, {
        candidate_id: "candidate:helper-unsafe",
        local_work_id: "AG-MAPPING-WRITER-HELPER-UNSAFE",
      }),
      {
        proposal_reason: "Unsafe packet helper should fail.",
      },
    ),
  });
  assert.notEqual(unsafeHelper.status, 0);
  assert.equal(unsafeHelper.json.ok, false);
  assert.equal(unsafeHelper.json.result.status, "preflight_failed");
  assert.equal(countRows(dbPath, tableName), beforeUnsafe);

  const beforePreviewRejects = countRows(dbPath, tableName);
  const noCandidateResult = createAgWorkResumeMappingProposalRecord({
    ...buildCreateInput(packet, candidate, {
      selected_candidate_id: "candidate:missing",
      proposal_reason: "Missing selected candidate should fail.",
    }),
    candidates: [],
  });
  assert.equal(noCandidateResult.ok, false);
  assert.equal(noCandidateResult.status, "preview_not_creatable");
  assert.equal(noCandidateResult.preview?.status, "needs_candidate");

  const missingSelectedResult = createAgWorkResumeMappingProposalRecord({
    ...buildCreateInput(packet, candidate, {
      proposal_reason: "Missing selected id should fail.",
    }),
    selected_candidate_id: "",
  });
  assert.equal(missingSelectedResult.ok, false);
  assert.equal(missingSelectedResult.status, "invalid_input");

  const conflictCandidate = buildCandidateFromPacket(packet, {
    candidate_id: "candidate:conflict",
    local_work_id: "AG-MAPPING-WRITER-CONFLICT",
    title: "Different local title",
  });
  const conflictResult = createAgWorkResumeMappingProposalRecord(
    buildCreateInput(packet, conflictCandidate, {
      proposal_reason: "Conflict preview should fail.",
    }),
  );
  assert.equal(conflictResult.ok, false);
  assert.equal(conflictResult.status, "preview_not_creatable");
  assert.equal(conflictResult.preview?.status, "conflict");
  assert.equal(countRows(dbPath, tableName), beforePreviewRejects);

  const invalidCases = [
    { name: "missing packet", patch: { packet: null }, status: "invalid_input" },
    { name: "missing selected candidate", patch: { selected_candidate_id: null }, status: "invalid_input" },
    { name: "missing proposed_by", patch: { proposed_by: "" }, status: "invalid_input" },
    { name: "missing proposal_reason", patch: { proposal_reason: "" }, status: "invalid_input" },
    { name: "confirmed status", patch: { status: "confirmed" }, status: "invalid_input" },
    { name: "malformed expires_at", patch: { expires_at: "not-a-date" }, status: "invalid_input" },
    { name: "past expires_at", patch: { expires_at: "2020-01-01T00:00:00.000Z" }, status: "invalid_input" },
    { name: "candidates not array", patch: { candidates: "not-array" }, status: "invalid_input" },
  ];
  for (const invalidCase of invalidCases) {
    const before = countRows(dbPath, tableName);
    const result = createAgWorkResumeMappingProposalRecord({
      ...buildCreateInput(packet, candidate, {
        proposal_reason: `Invalid input case ${invalidCase.name}.`,
      }),
      ...invalidCase.patch,
    });
    assert.equal(result.ok, false, invalidCase.name);
    assert.equal(result.status, invalidCase.status, invalidCase.name);
    assert.equal(countRows(dbPath, tableName), before, invalidCase.name);
  }

  const invalidJsonRoute = await POST(
    new Request("http://localhost/api/ag-work-resume/mapping-proposal-records", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{",
    }),
  );
  assert.equal(invalidJsonRoute.status, 400);
  const invalidJsonPayload = await invalidJsonRoute.json();
  assert.equal(invalidJsonPayload.ok, false);

  const duplicateCandidate = buildCandidateFromPacket(packet, {
    candidate_id: "candidate:duplicate",
    local_work_id: "AG-MAPPING-WRITER-DUPLICATE",
  });
  const duplicateFirst = createAgWorkResumeMappingProposalRecord(
    buildCreateInput(packet, duplicateCandidate, {
      proposal_reason: "Initial duplicate smoke proposal.",
    }),
  );
  assert.equal(duplicateFirst.ok, true);
  const beforeDuplicate = countRows(dbPath, tableName);
  const duplicateSecond = createAgWorkResumeMappingProposalRecord(
    buildCreateInput(packet, duplicateCandidate, {
      proposal_reason: "Second active duplicate smoke proposal.",
    }),
  );
  assert.equal(duplicateSecond.ok, false);
  assert.equal(duplicateSecond.status, "duplicate_active_proposal");
  assert.equal(countRows(dbPath, tableName), beforeDuplicate);
  updateProposalStatus(dbPath, duplicateFirst.record.proposal_id, "withdrawn");
  const duplicateAfterWithdrawn = createAgWorkResumeMappingProposalRecord(
    buildCreateInput(packet, duplicateCandidate, {
      proposal_reason: "Second active duplicate smoke proposal.",
    }),
  );
  assert.equal(duplicateAfterWithdrawn.ok, true);
  assert.notEqual(
    duplicateAfterWithdrawn.record.proposal_id,
    duplicateFirst.record.proposal_id,
  );

  const deterministicInput = buildCreateInput(
    packet,
    buildCandidateFromPacket(packet, {
      candidate_id: "candidate:deterministic",
      local_work_id: "AG-MAPPING-WRITER-DETERMINISTIC",
    }),
    {
      proposal_reason: "Deterministic id smoke proposal.",
      expires_at: "2099-01-01T00:00:00.000Z",
    },
  );
  const deterministicIdA = createInFreshDbAndReturnId(
    createAgWorkResumeMappingProposalRecord,
    deterministicInput,
    path.join(tempDir, "deterministic-a.db"),
  );
  const deterministicIdB = createInFreshDbAndReturnId(
    createAgWorkResumeMappingProposalRecord,
    deterministicInput,
    path.join(tempDir, "deterministic-b.db"),
  );
  assert.equal(deterministicIdA, deterministicIdB);

  const beforeFailedPartial = countRows(dbPath, tableName);
  const failedPartial = createAgWorkResumeMappingProposalRecord({
    ...buildCreateInput(packet, candidate, {
      proposal_reason: "Failed partial insert should leave no row.",
    }),
    status: "rejected",
  });
  assert.equal(failedPartial.ok, false);
  assert.equal(countRows(dbPath, tableName), beforeFailedPartial);
  assertProtectedCounts(dbPath, protectedBefore);
  assertNoForbiddenTablesOrRows(dbPath);
  assert.equal(fetchCalls, 0);

  console.log(
    JSON.stringify(
      {
        smoke: "ag-work-resume-mapping-proposal-record-writer",
        temp_db_path: dbPath,
        cases: [
          "package scripts are present",
          "writer/route/helper source guards pass",
          "docs guard passes",
          "successful core create inserts one proposal row",
          "route create returns 201 and proposal-only authority boundary",
          "helper env create exits zero",
          "helper file create exits zero",
          "strict preflight failure writes no row through core/route/helper",
          "preview needs_candidate/conflict rejections write no rows",
          "invalid input cases write no rows",
          "duplicate active proposal is rejected",
          "withdrawn proposal permits later proposal for same tuple",
          "deterministic proposal id repeats across fresh DBs",
          "failed create leaves no partial row",
          "protected table counts remain unchanged",
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
  for (const file of [writerPath, routePath, helperPath, docsPath, packagePath]) {
    assert.ok(existsSync(file), `${file} must exist`);
  }
}

function assertPackageScripts() {
  const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
  assert.equal(
    packageJson.scripts?.["ag:resume-mapping-proposal-record-create"],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/ag-work-resume-mapping-proposal-record-create.mjs",
  );
  assert.equal(
    packageJson.scripts?.["smoke:ag-work-resume-mapping-proposal-record-writer"],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-ag-work-resume-mapping-proposal-record-writer.mjs",
  );
}

function assertSourceGuards() {
  const sources = {
    writer: readFileSync(writerPath, "utf8"),
    route: readFileSync(routePath, "utf8"),
    helper: readFileSync(helperPath, "utf8"),
  };
  for (const [label, source] of Object.entries(sources)) {
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
      /confirm[-_ ]?mapping/i,
      /createEvidenceRecord|recordEvidence|recordProof|bindSession|ensureSession|insertWorkItem|insertWorkEvent/i,
      /executeCodex|runCodex/i,
    ]) {
      assert.doesNotMatch(source, forbidden, `${label} must not contain ${forbidden}`);
    }
  }

  const changedFiles = gitChangedFiles();
  const allowedScopedFollowUpFiles = new Set([
    "components/augnes-cockpit.tsx",
    "reports/browser/2026-05-31-ag-work-resume-mapping-proposal-record-read-cockpit-panel-verification.md",
    "scripts/smoke-ag-work-resume-mapping-proposal-record-read-cockpit-panel.mjs",
    "scripts/smoke-ag-work-resume-mapping-proposal-lifecycle-action.mjs",
    "scripts/smoke-ag-work-resume-mapping-proposal-lifecycle-action-route.mjs",
    "scripts/smoke-ag-work-resume-mapping-proposal-lifecycle-action-cockpit-panel.mjs",
  ]);
  for (const file of changedFiles) {
    if (allowedScopedFollowUpFiles.has(file)) continue;
    assert.equal(file.includes("components/"), false, `no Cockpit component change: ${file}`);
    assert.equal(/cockpit/i.test(file) && !file.startsWith("docs/"), false, `no Cockpit code change: ${file}`);
  }
}

function assertDocsGuard() {
  const docs = readFileSync(docsPath, "utf8");
  for (const pattern of [
    /Purpose/i,
    /mapping\/import authority gate/i,
    /Stage B record design/i,
    /DB\/schema implementation/i,
    /Stage A mapping proposal preview route and panel/i,
    /Shared Writer Core/i,
    /Local Helper/i,
    /Write Route/i,
    /Input Body/i,
    /Output Shape/i,
    /Status Codes And Exit Codes/i,
    /Strict packet preflight is required/i,
    /Generated strict mapping proposal preview is required/i,
    /selected_candidate_id/i,
    /proposed_by/i,
    /proposal_reason/i,
    /Duplicate active proposals are rejected/i,
    /inserts only into `ag_work_resume_mapping_proposals`/i,
    /Uses a DB transaction/i,
    /Does not overwrite/i,
    /Does not update/i,
    /Not confirmed mapping/i,
    /Not import/i,
    /Not proof\/evidence/i,
    /Not session binding/i,
    /Not Codex execution/i,
    /Not approval, publish, retry, replay, merge/i,
    /No Cockpit UI/i,
    /No Direct Resume Code/i,
    /No relay/i,
    /confirmed mapping remains Stage C/i,
  ]) {
    assert.match(docs, pattern, `writer docs must include ${pattern}`);
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

function buildCreateInput(packet, candidate, overrides = {}) {
  return {
    packet,
    candidates: [candidate],
    selected_candidate_id: overrides.selected_candidate_id ?? candidate.candidate_id,
    proposed_by: overrides.proposed_by ?? "user-core",
    proposal_reason:
      overrides.proposal_reason ??
      "User/Core requested a durable proposal for later review.",
    status: overrides.status ?? "proposed",
    expires_at: Object.hasOwn(overrides, "expires_at") ? overrides.expires_at : null,
    source: overrides.source ?? {
      reviewed_by_surface: "codex",
      reviewed_at: "2026-05-31T00:00:00.000Z",
    },
  };
}

function runHelper({ dbPath: helperDbPath, envInput, filePath }) {
  const args = [
    "--tsconfig",
    "tsconfig.json",
    "scripts/ag-work-resume-mapping-proposal-record-create.mjs",
    "--json",
  ];
  if (filePath) {
    args.push("--file", filePath);
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
              AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_INPUT: JSON.stringify(envInput),
            }
          : {}),
      },
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

function jsonRequest(body) {
  return new Request("http://localhost/api/ag-work-resume/mapping-proposal-records", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function createInFreshDbAndReturnId(createFn, input, freshDbPath) {
  resetDb(freshDbPath);
  const previous = process.env.AUGNES_DB_PATH;
  process.env.AUGNES_DB_PATH = freshDbPath;
  try {
    const result = createFn(input);
    assert.equal(result.ok, true);
    return result.record.proposal_id;
  } finally {
    process.env.AUGNES_DB_PATH = previous;
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
    assert.equal(
      tableExists(db, "ag_work_resume_confirmed_mappings"),
      true,
      "confirmed mapping schema table should exist after schema foundation",
    );
    assert.equal(
      countRows(targetDbPath, "ag_work_resume_confirmed_mappings"),
      0,
      "proposal record writer smoke must not create confirmed mapping rows",
    );
    for (const table of [
      "ag_work_resume_imports",
      "ag_work_resume_imported_contexts",
    ]) {
      assert.equal(tableExists(db, table), false, `${table} must not be created`);
    }
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

function updateProposalStatus(targetDbPath, proposalId, status) {
  const db = new Database(targetDbPath);
  try {
    db.prepare(`UPDATE ${tableName} SET status = ? WHERE proposal_id = ?`).run(
      status,
      proposalId,
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

function assertProposalAuthorityBoundary(boundary, created) {
  assert.equal(boundary.proposal_record_created, created);
  for (const key of [
    "confirmed_mapping_created",
    "import_record_created",
    "work_item_created",
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
  assert.match(boundary.statement, /not mapping confirmation/i);
  assert.match(boundary.statement, /not import/i);
  assert.match(boundary.statement, /not proof\/evidence/i);
  assert.match(boundary.statement, /not session binding/i);
  assert.match(boundary.statement, /not Codex execution authority/i);
  assert.match(boundary.statement, /not merge\/publish authority/i);
}

function buildFixtureInput() {
  const workId = "AG-MAPPING-WRITER-001";
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
        title: "Create AG resume mapping proposal writer",
        status: "in_progress",
        priority: "now",
        summary: "Create a proposal-only Stage B writer.",
        next_action: "Create a durable proposal record for later review.",
        user_attention_required: false,
        related_state_keys: ["coordination.ag_resume_mapping"],
        links: {
          docs: ["docs/AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_WRITER_V0_1.md"],
        },
        created_at: "2026-05-31T00:00:00.000Z",
        updated_at: "2026-05-31T00:00:00.000Z",
      },
      next_action: "Create a durable proposal record for later review.",
      user_attention_required: false,
      recent_events: [
        {
          id: "work-event:mapping-writer-1",
          work_id: workId,
          scope,
          actor: "codex",
          event_type: "implementation",
          summary: "Prepared mapping proposal record writer smoke fixture.",
          result_status: "completed",
          result_kind: "verification",
          related_action_id: "action:proof-only-1",
          related_pr: "https://github.com/hynk-studio/augnes/pull/299",
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
            linked_work_event_ids: ["work-event:mapping-writer-1"],
            created_at: "2026-05-31T00:00:00.000Z",
          },
        ],
        docs: ["docs/AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_WRITER_V0_1.md"],
        note: "Action records with state_key:null are proof-only.",
      },
      codex_handoff: {
        task_brief: "Implement proposal-only mapping proposal record writer.",
        constraints: ["No confirmed mapping.", "No import.", "No Codex execution."],
        suggested_verification: [
          "npm run smoke:ag-work-resume-mapping-proposal-record-writer",
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
          task_brief: "Implement proposal-only mapping proposal record writer.",
          constraints: ["No confirmed mapping.", "No import.", "No Codex execution."],
          likely_files: [
            "lib/ag-work-resume-mapping-proposal-record.ts",
            "app/api/ag-work-resume/mapping-proposal-records/route.ts",
            "scripts/ag-work-resume-mapping-proposal-record-create.mjs",
          ],
          verification_commands: [
            "npm run smoke:ag-work-resume-mapping-proposal-record-writer",
          ],
        },
      },
    },
    handoffDraft: {
      handoff_id: "handoff:mapping-proposal-record-writer-smoke",
      status: "ready",
      expected_files: [
        "lib/ag-work-resume-mapping-proposal-record.ts",
        "app/api/ag-work-resume/mapping-proposal-records/route.ts",
        "scripts/ag-work-resume-mapping-proposal-record-create.mjs",
      ],
      expected_checks: [
        "npm run smoke:ag-work-resume-mapping-proposal-record-writer",
      ],
      expected_execution_surfaces: [],
      forbidden_surfaces: ["confirmed mapping", "import", "Codex execution"],
      stop_conditions: ["Mapping/import authority appears in writer output."],
      safety_boundaries: ["Proposal record creation is not mapping confirmation."],
    },
    git: {
      remote: "https://github.com/hynk-studio/augnes.git",
      base_branch: "main",
      base_commit: "40810e7",
      working_branch: "codex/ag-resume-mapping-proposal-record-writer",
      head_commit: "record-writer",
      related_pr: null,
      dirty_worktree: false,
    },
    issuer: {
      runtime_instance_id: "runtime-instance:mapping-proposal-record-writer-smoke",
      source_local_label: "source-local-mapping-record-writer-smoke",
      created_by_surface: "record-writer-smoke",
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
  const diffResult = spawnSync("git", ["diff", "--name-only"], {
    cwd: rootDir,
    encoding: "utf8",
  });
  const untrackedResult = spawnSync("git", ["ls-files", "--others", "--exclude-standard"], {
    cwd: rootDir,
    encoding: "utf8",
  });
  if (diffResult.status !== 0 || untrackedResult.status !== 0) return [];
  return `${diffResult.stdout}\n${untrackedResult.stdout}`
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function isPathInside(childPath, parentPath) {
  const relative = path.relative(parentPath, childPath);
  return Boolean(relative) && !relative.startsWith("..") && !path.isAbsolute(relative);
}
