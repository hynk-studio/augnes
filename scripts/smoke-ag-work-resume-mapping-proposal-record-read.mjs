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
  "ag-work-resume-mapping-proposal-record-read.ts",
);
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
  "ag-work-resume-mapping-proposal-record-read.mjs",
);
const docsPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_READ_V0_1.md",
);
const packagePath = path.join(rootDir, "package.json");
const tableName = "ag_work_resume_mapping_proposals";
const tempDir = mkdtempSync(
  path.join(os.tmpdir(), "augnes-ag-resume-mapping-proposal-record-read-"),
);
const dbPath = path.join(tempDir, "augnes.db");

process.env.AUGNES_DB_PATH = dbPath;
process.env.OPENAI_API_KEY = "smoke-openai-key-must-not-be-used";

let fetchCalls = 0;
globalThis.fetch = async () => {
  fetchCalls += 1;
  throw new Error("AG resume mapping proposal record read smoke must not call fetch.");
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
    readAgWorkResumeMappingProposalRecords,
  } = await import("../lib/ag-work-resume-mapping-proposal-record-read.ts");
  const route = await import(
    "../app/api/ag-work-resume/mapping-proposal-records/route.ts"
  );

  assert.equal(typeof route.GET, "function", "route must expose GET");
  assert.equal(typeof route.POST, "function", "route must keep existing POST");

  const packetA = buildAgWorkResumePacketPreview(buildFixtureInput("AG-MAPPING-READ-001"));
  const packetB = buildAgWorkResumePacketPreview(buildFixtureInput("AG-MAPPING-READ-002"));
  const candidateA = buildCandidateFromPacket(packetA, {
    candidate_id: "candidate:read-a",
    local_work_id: "AG-MAPPING-READ-LOCAL-A",
  });
  const candidateB = buildCandidateFromPacket(packetA, {
    candidate_id: "candidate:read-b",
    local_work_id: "AG-MAPPING-READ-LOCAL-B",
  });
  const candidateC = buildCandidateFromPacket(packetB, {
    candidate_id: "candidate:read-c",
    local_work_id: "AG-MAPPING-READ-LOCAL-C",
  });

  const createdA = createAgWorkResumeMappingProposalRecord(
    buildCreateInput(packetA, candidateA, {
      proposal_reason: "User/Core requested read smoke proposal A.",
      status: "proposed",
    }),
  );
  const createdB = createAgWorkResumeMappingProposalRecord(
    buildCreateInput(packetA, candidateB, {
      proposal_reason: "User/Core requested read smoke proposal B.",
      status: "needs_review",
    }),
  );
  const createdC = createAgWorkResumeMappingProposalRecord(
    buildCreateInput(packetB, candidateC, {
      proposal_reason: "User/Core requested read smoke proposal C.",
      status: "proposed",
    }),
  );
  assert.equal(createdA.ok, true);
  assert.equal(createdB.ok, true);
  assert.equal(createdC.ok, true);
  setProposalCreatedAt(dbPath, createdA.record.proposal_id, "2026-05-31T00:00:01.000Z");
  setProposalCreatedAt(dbPath, createdB.record.proposal_id, "2026-05-31T00:00:03.000Z");
  setProposalCreatedAt(dbPath, createdC.record.proposal_id, "2026-05-31T00:00:02.000Z");

  const protectedBefore = snapshotProtectedCounts(dbPath);
  const proposalsBefore = snapshotProposalRows(dbPath);

  const single = readAgWorkResumeMappingProposalRecords({
    proposal_id: createdA.record.proposal_id,
  });
  assert.equal(single.ok, true);
  assert.equal(single.status, "fetched");
  assert.equal(single.record.proposal_id, createdA.record.proposal_id);
  assert.equal(single.records.length, 1);
  assert.equal(single.record.comparison_summary.length > 0, true);
  assert.equal(typeof single.record.foreign_refs_summary, "object");
  assertReadBoundary(single.authority_boundary);

  const foreignList = readAgWorkResumeMappingProposalRecords({
    foreign_scope: packetA.source_work.scope,
    foreign_work_id: packetA.source_work.work_id,
  });
  assert.equal(foreignList.ok, true);
  assert.equal(foreignList.status, "listed");
  assert.deepEqual(
    foreignList.records.map((record) => record.proposal_id),
    [createdB.record.proposal_id, createdA.record.proposal_id],
    "foreign list must order by created_at DESC",
  );
  assert.equal(foreignList.limit, 20);

  const candidateList = readAgWorkResumeMappingProposalRecords({
    candidate_local_scope: candidateC.local_scope,
    candidate_local_work_id: candidateC.local_work_id,
  });
  assert.equal(candidateList.ok, true);
  assert.equal(candidateList.records.length, 1);
  assert.equal(candidateList.records[0].proposal_id, createdC.record.proposal_id);

  const statusList = readAgWorkResumeMappingProposalRecords({
    status: "proposed",
    limit: 1,
  });
  assert.equal(statusList.ok, true);
  assert.equal(statusList.records.length, 1);
  assert.equal(statusList.limit, 1);
  assert.equal(statusList.records[0].status, "proposed");

  const cappedLimit = readAgWorkResumeMappingProposalRecords({
    status: "proposed",
    limit: 999,
  });
  assert.equal(cappedLimit.ok, true);
  assert.equal(cappedLimit.limit, 100);

  for (const invalidCase of [
    { proposal_id: createdA.record.proposal_id, status: "proposed" },
    { foreign_scope: "project:augnes" },
    { candidate_local_work_id: candidateA.local_work_id },
    { status: "confirmed" },
    { status: "proposed", limit: 0 },
    { status: "proposed", unsupported_filter: "ignored" },
    {},
  ]) {
    const result = readAgWorkResumeMappingProposalRecords(invalidCase);
    assert.equal(result.ok, false);
    assert.equal(result.status, "invalid_input");
  }

  const notFound = readAgWorkResumeMappingProposalRecords({
    proposal_id: "ag-resume-mapping-proposal:not-found",
  });
  assert.equal(notFound.ok, false);
  assert.equal(notFound.status, "not_found");

  const routeSingle = await route.GET(
    requestWithQuery({ proposal_id: createdA.record.proposal_id }),
  );
  assert.equal(routeSingle.status, 200);
  const routeSinglePayload = await routeSingle.json();
  assert.equal(routeSinglePayload.ok, true);
  assert.equal(routeSinglePayload.route, "ag_work_resume_mapping_proposal_record_read.v0_1");
  assert.equal(routeSinglePayload.result.status, "fetched");
  assert.match(routeSinglePayload.recommended_next_step, /not mapping confirmation/i);
  assert.match(routeSinglePayload.recommended_next_step, /Codex execution authority/i);

  const routeList = await route.GET(
    requestWithQuery({
      foreign_scope: packetA.source_work.scope,
      foreign_work_id: packetA.source_work.work_id,
      limit: "2",
    }),
  );
  assert.equal(routeList.status, 200);
  const routeListPayload = await routeList.json();
  assert.equal(routeListPayload.result.records.length, 2);

  const routeInvalid = await route.GET(requestWithQuery({}));
  assert.equal(routeInvalid.status, 400);
  const routeUnknown = await route.GET(requestWithQuery({ status: "proposed", unknown: "x" }));
  assert.equal(routeUnknown.status, 400);
  const routeRepeated = await route.GET(
    requestWithQueryPairs([
      ["status", "proposed"],
      ["status", "needs_review"],
    ]),
  );
  assert.equal(routeRepeated.status, 400);
  const routeMissing = await route.GET(
    requestWithQuery({ proposal_id: "ag-resume-mapping-proposal:not-found" }),
  );
  assert.equal(routeMissing.status, 404);

  const helperEnv = runHelper({
    dbPath,
    envInput: { proposal_id: createdA.record.proposal_id },
  });
  assert.equal(helperEnv.status, 0);
  assert.equal(helperEnv.json.ok, true);
  assert.equal(helperEnv.json.helper, "ag_work_resume_mapping_proposal_record_read.v0_1");
  assert.equal(helperEnv.json.input_mode, "env");
  assert.equal(helperEnv.json.result.status, "fetched");

  const inputFile = path.join(tempDir, "read-file-input.json");
  writeFileSync(
    inputFile,
    JSON.stringify({
      foreign_scope: packetA.source_work.scope,
      foreign_work_id: packetA.source_work.work_id,
      limit: 2,
    }),
  );
  const helperFile = runHelper({ dbPath, filePath: inputFile });
  assert.equal(helperFile.status, 0);
  assert.equal(helperFile.json.input_mode, "file");
  assert.equal(helperFile.json.result.records.length, 2);

  const helperFlags = runHelper({
    dbPath,
    args: ["--status", "proposed", "--limit", "2"],
  });
  assert.equal(helperFlags.status, 0);
  assert.equal(helperFlags.json.input_mode, "flags");
  assert.equal(helperFlags.json.result.records.length, 2);

  const helperInvalid = runHelper({
    dbPath,
    args: ["--status", "confirmed"],
  });
  assert.notEqual(helperInvalid.status, 0);
  assert.equal(helperInvalid.json.ok, false);
  assert.equal(helperInvalid.json.result.status, "invalid_input");
  const helperUnknown = runHelper({
    dbPath,
    envInput: { status: "proposed", unsupported_filter: "ignored" },
  });
  assert.notEqual(helperUnknown.status, 0);
  assert.equal(helperUnknown.json.result.status, "invalid_input");

  assert.deepEqual(snapshotProposalRows(dbPath), proposalsBefore);
  assertProtectedCounts(dbPath, protectedBefore);
  assertNoForbiddenTablesOrRows(dbPath);
  assert.equal(fetchCalls, 0);

  console.log(
    JSON.stringify(
      {
        smoke: "ag-work-resume-mapping-proposal-record-read",
        temp_db_path: dbPath,
        cases: [
          "package scripts are present",
          "reader/helper/GET source guards pass",
          "docs guard passes",
          "fixture rows are created through existing writer",
          "core fetch by proposal_id parses JSON fields",
          "core list by foreign work orders created_at DESC",
          "core list by candidate local work succeeds",
          "core list by status and limit succeeds",
          "invalid and not-found reads fail closed",
          "route GET fetch/list/invalid/unknown/repeated/not-found statuses are deterministic",
          "helper env/file/flags reads succeed",
          "helper invalid and unknown-field reads exit non-zero",
          "proposal rows are unchanged after reads",
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
  for (const file of [readCorePath, writerPath, routePath, helperPath, docsPath, packagePath]) {
    assert.ok(existsSync(file), `${file} must exist`);
  }
}

function assertPackageScripts() {
  const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
  assert.equal(
    packageJson.scripts?.["ag:resume-mapping-proposal-record-read"],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/ag-work-resume-mapping-proposal-record-read.mjs",
  );
  assert.equal(
    packageJson.scripts?.["smoke:ag-work-resume-mapping-proposal-record-read"],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-ag-work-resume-mapping-proposal-record-read.mjs",
  );
}

function assertSourceGuards() {
  const readCore = readFileSync(readCorePath, "utf8");
  const route = readFileSync(routePath, "utf8");
  const helper = readFileSync(helperPath, "utf8");
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
  assert.match(getBlock, /readAgWorkResumeMappingProposalRecords/);
  assert.doesNotMatch(getBlock, /createAgWorkResumeMappingProposalRecord/);
  assert.doesNotMatch(getBlock, /INSERT\s+INTO|\bUPDATE\b|\bDELETE\b|\bDROP\b/i);

  const changedFiles = gitChangedFiles();
  const allowedScopedFollowUpFiles = new Set([
    "components/augnes-cockpit.tsx",
    "reports/browser/2026-05-31-ag-work-resume-mapping-proposal-record-read-cockpit-panel-verification.md",
    "scripts/smoke-ag-work-resume-mapping-proposal-record-read-cockpit-panel.mjs",
  ]);
  for (const file of changedFiles) {
    if (allowedScopedFollowUpFiles.has(file)) continue;
    assert.equal(file.includes("components/"), false, `no Cockpit component change: ${file}`);
    assert.equal(file.startsWith("apps/"), false, `no MCP/App or ChatGPT app change: ${file}`);
    assert.equal(/cockpit/i.test(file) && !file.startsWith("docs/"), false, `no Cockpit code change: ${file}`);
  }
}

function assertDocsGuard() {
  const docs = readFileSync(docsPath, "utf8");
  for (const pattern of [
    /Purpose/i,
    /read-only Stage B/i,
    /mapping\/import authority gate/i,
    /Stage B writer/i,
    /DB\/schema implementation/i,
    /Shared Reader Core/i,
    /Local Helper/i,
    /Route/i,
    /fetch by `proposal_id`/i,
    /foreign_scope.*foreign_work_id/is,
    /candidate_local_scope.*candidate_local_work_id/is,
    /status/i,
    /bounded `limit`/i,
    /Unknown helper input fields or route query parameters are rejected/i,
    /Repeated route query parameters are rejected/i,
    /created_at DESC/i,
    /no implicit list-all/i,
    /Reads only from `ag_work_resume_mapping_proposals`/i,
    /Does not insert/i,
    /Does not update/i,
    /Does not delete/i,
    /Not confirmed mapping/i,
    /Not import/i,
    /Not proof\/evidence/i,
    /Not session binding/i,
    /Not Codex execution/i,
    /No Cockpit UI/i,
    /No ChatGPT App card/i,
    /No MCP\/App tool schema/i,
    /No Direct Resume Code/i,
    /No relay/i,
  ]) {
    assert.match(docs, pattern, `read docs must include ${pattern}`);
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
    selected_candidate_id: candidate.candidate_id,
    proposed_by: "user-core",
    proposal_reason:
      overrides.proposal_reason ??
      "User/Core requested a durable proposal for later review.",
    status: overrides.status ?? "proposed",
    expires_at: null,
    source: {
      reviewed_by_surface: "codex",
      reviewed_at: "2026-05-31T00:00:00.000Z",
    },
  };
}

function runHelper({ dbPath: helperDbPath, envInput, filePath, args = [] }) {
  const helperArgs = [
    "--tsconfig",
    "tsconfig.json",
    "scripts/ag-work-resume-mapping-proposal-record-read.mjs",
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
              AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_READ_INPUT: JSON.stringify(envInput),
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

function requestWithQuery(params) {
  const url = new URL("http://localhost/api/ag-work-resume/mapping-proposal-records");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new Request(url, { method: "GET" });
}

function requestWithQueryPairs(pairs) {
  const url = new URL("http://localhost/api/ag-work-resume/mapping-proposal-records");
  for (const [key, value] of pairs) {
    url.searchParams.append(key, value);
  }
  return new Request(url, { method: "GET" });
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

function setProposalCreatedAt(targetDbPath, proposalId, createdAt) {
  const db = new Database(targetDbPath);
  try {
    db.prepare(
      `UPDATE ${tableName} SET created_at = ?, updated_at = ? WHERE proposal_id = ?`,
    ).run(createdAt, createdAt, proposalId);
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
  assert.equal(boundary.proposal_review_metadata_only, true);
  for (const key of [
    "proposal_record_created",
    "proposal_record_updated",
    "proposal_record_deleted",
    "confirmed_mapping_created",
    "import_record_created",
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
  assert.match(boundary.statement, /read-only review metadata/i);
  assert.match(boundary.statement, /do not confirm mappings/i);
  assert.match(boundary.statement, /execute Codex/i);
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
        title: "Read AG resume mapping proposal records",
        status: "in_progress",
        priority: "now",
        summary: "Read proposal-only Stage B records.",
        next_action: "Review proposal records without changing them.",
        user_attention_required: false,
        related_state_keys: ["coordination.ag_resume_mapping"],
        links: {
          docs: ["docs/AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_READ_V0_1.md"],
        },
        created_at: "2026-05-31T00:00:00.000Z",
        updated_at: "2026-05-31T00:00:00.000Z",
      },
      next_action: "Review proposal records without changing them.",
      user_attention_required: false,
      recent_events: [
        {
          id: `work-event:${workId}`,
          work_id: workId,
          scope,
          actor: "codex",
          event_type: "implementation",
          summary: "Prepared mapping proposal record read smoke fixture.",
          result_status: "completed",
          result_kind: "verification",
          related_action_id: "action:proof-only-1",
          related_pr: "https://github.com/hynk-studio/augnes/pull/300",
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
        docs: ["docs/AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_READ_V0_1.md"],
        note: "Action records with state_key:null are proof-only.",
      },
      codex_handoff: {
        task_brief: "Implement read-only proposal record reader.",
        constraints: ["No writes.", "No confirmed mapping.", "No import."],
        suggested_verification: [
          "npm run smoke:ag-work-resume-mapping-proposal-record-read",
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
          task_brief: "Implement read-only proposal record reader.",
          constraints: ["No writes.", "No confirmed mapping.", "No import."],
          likely_files: [
            "lib/ag-work-resume-mapping-proposal-record-read.ts",
            "app/api/ag-work-resume/mapping-proposal-records/route.ts",
            "scripts/ag-work-resume-mapping-proposal-record-read.mjs",
          ],
          verification_commands: [
            "npm run smoke:ag-work-resume-mapping-proposal-record-read",
          ],
        },
      },
    },
    handoffDraft: {
      handoff_id: `handoff:${workId}`,
      status: "ready",
      expected_files: [
        "lib/ag-work-resume-mapping-proposal-record-read.ts",
        "app/api/ag-work-resume/mapping-proposal-records/route.ts",
        "scripts/ag-work-resume-mapping-proposal-record-read.mjs",
      ],
      expected_checks: [
        "npm run smoke:ag-work-resume-mapping-proposal-record-read",
      ],
      expected_execution_surfaces: [],
      forbidden_surfaces: ["confirmed mapping", "import", "Codex execution"],
      stop_conditions: ["Mapping/import authority appears in reader output."],
      safety_boundaries: ["Proposal record reads are review metadata only."],
    },
    git: {
      remote: "https://github.com/hynk-studio/augnes.git",
      base_branch: "main",
      base_commit: "51d9234",
      working_branch: "codex/ag-resume-mapping-proposal-record-read",
      head_commit: "record-read",
      related_pr: null,
      dirty_worktree: false,
    },
    issuer: {
      runtime_instance_id: "runtime-instance:mapping-proposal-record-read-smoke",
      source_local_label: "source-local-mapping-record-read-smoke",
      created_by_surface: "record-read-smoke",
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

function extractGetBlock(source) {
  const start = source.indexOf("export function GET");
  assert.notEqual(start, -1, "route must include GET");
  const end = source.indexOf("\nfunction acceptsJson", start);
  assert.notEqual(end, -1, "GET block must end before acceptsJson");
  return source.slice(start, end);
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

function isPathInside(childPath, parentPath) {
  const relative = path.relative(parentPath, childPath);
  return Boolean(relative) && !relative.startsWith("..") && !path.isAbsolute(relative);
}
