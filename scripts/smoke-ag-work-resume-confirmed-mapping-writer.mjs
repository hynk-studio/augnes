import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const writerPath = path.join(rootDir, "lib", "ag-work-resume-confirmed-mapping.ts");
const helperPath = path.join(
  rootDir,
  "scripts",
  "ag-work-resume-confirmed-mapping-create.mjs",
);
const smokePath = fileURLToPath(import.meta.url);
const docsPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_CONFIRMED_MAPPING_WRITER_V0_1.md",
);
const packagePath = path.join(rootDir, "package.json");
const schemaPath = path.join(rootDir, "lib", "db", "schema.sql");
const pointerDocPaths = [
  path.join(rootDir, "docs", "AG_WORK_RESUME_CONFIRMED_MAPPING_DB_SCHEMA_IMPLEMENTATION_V0_1.md"),
  path.join(rootDir, "docs", "AG_WORK_RESUME_CONFIRMED_MAPPING_DB_SCHEMA_DESIGN_V0_1.md"),
  path.join(rootDir, "docs", "AG_WORK_RESUME_CONFIRMED_MAPPING_RECORD_DESIGN_V0_1.md"),
  path.join(rootDir, "docs", "AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md"),
];
const tableName = "ag_work_resume_confirmed_mappings";
const proposalTableName = "ag_work_resume_mapping_proposals";
const tempDir = mkdtempSync(
  path.join(os.tmpdir(), "augnes-ag-resume-confirmed-mapping-writer-"),
);
const dbPath = path.join(tempDir, "augnes.db");

process.env.AUGNES_DB_PATH = dbPath;
process.env.OPENAI_API_KEY = "smoke-openai-key-must-not-be-used";

let fetchCalls = 0;
globalThis.fetch = async () => {
  fetchCalls += 1;
  throw new Error("AG resume confirmed mapping writer smoke must not call fetch.");
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

  const fixtures = {
    proposed: createProposalFixture({
      key: "core-proposed",
      buildAgWorkResumePacketPreview,
      createAgWorkResumeMappingProposalRecord,
    }),
    needsReview: createProposalFixture({
      key: "core-needs-review",
      status: "needs_review",
      buildAgWorkResumePacketPreview,
      createAgWorkResumeMappingProposalRecord,
    }),
    helperEnv: createProposalFixture({
      key: "helper-env",
      buildAgWorkResumePacketPreview,
      createAgWorkResumeMappingProposalRecord,
    }),
    helperFile: createProposalFixture({
      key: "helper-file",
      buildAgWorkResumePacketPreview,
      createAgWorkResumeMappingProposalRecord,
    }),
    helperFlags: createProposalFixture({
      key: "helper-flags",
      buildAgWorkResumePacketPreview,
      createAgWorkResumeMappingProposalRecord,
    }),
    helperStdin: createProposalFixture({
      key: "helper-stdin",
      buildAgWorkResumePacketPreview,
      createAgWorkResumeMappingProposalRecord,
    }),
    localMissing: createProposalFixture({
      key: "local-missing",
      seedLocalWork: false,
      buildAgWorkResumePacketPreview,
      createAgWorkResumeMappingProposalRecord,
    }),
    mismatch: createProposalFixture({
      key: "mismatch",
      buildAgWorkResumePacketPreview,
      createAgWorkResumeMappingProposalRecord,
    }),
    withdrawn: createProposalFixture({
      key: "withdrawn",
      status: "withdrawn",
      buildAgWorkResumePacketPreview,
      createAgWorkResumeMappingProposalRecord,
    }),
    rejected: createProposalFixture({
      key: "rejected",
      status: "rejected",
      buildAgWorkResumePacketPreview,
      createAgWorkResumeMappingProposalRecord,
    }),
    superseded: createProposalFixture({
      key: "superseded",
      status: "superseded",
      buildAgWorkResumePacketPreview,
      createAgWorkResumeMappingProposalRecord,
    }),
    expired: createProposalFixture({
      key: "expired",
      status: "expired",
      buildAgWorkResumePacketPreview,
      createAgWorkResumeMappingProposalRecord,
    }),
  };

  const proposedBefore = sideEffectSnapshot(dbPath, fixtures.proposed);
  const beforeProposedCount = countRows(dbPath, tableName);
  const proposedResult = createAgWorkResumeConfirmedMapping(
    buildConfirmedInput(fixtures.proposed, {
      now: "2026-05-31T01:00:00.000Z",
    }),
  );
  assert.equal(proposedResult.ok, true);
  assert.equal(proposedResult.status, "created");
  assert.equal(proposedResult.record?.status, "active");
  assert.equal(proposedResult.record?.source_proposal_id, fixtures.proposed.proposal_id);
  assert.equal(proposedResult.record?.foreign_scope, fixtures.proposed.proposal.foreign_scope);
  assert.equal(proposedResult.record?.foreign_work_id, fixtures.proposed.proposal.foreign_work_id);
  assert.equal(proposedResult.record?.local_scope, fixtures.proposed.proposal.candidate_local_scope);
  assert.equal(proposedResult.record?.local_work_id, fixtures.proposed.proposal.candidate_local_work_id);
  assert.equal(proposedResult.record?.packet_id, fixtures.proposed.proposal.packet_id);
  assert.equal(proposedResult.record?.packet_hash, fixtures.proposed.proposal.packet_hash);
  assert.ok(proposedResult.mapping_id?.startsWith("ag-resume-confirmed-mapping:"));
  assertConfirmedAuthorityBoundary(proposedResult.authority_boundary, true);
  assertConfirmedAuthorityBoundary(proposedResult.record.authority_boundary, true);
  assert.equal(countRows(dbPath, tableName), beforeProposedCount + 1);
  assertSideEffectsUnchanged(dbPath, fixtures.proposed, proposedBefore);

  const duplicateBefore = sideEffectSnapshot(dbPath, fixtures.proposed);
  const duplicateResult = createAgWorkResumeConfirmedMapping(
    buildConfirmedInput(fixtures.proposed, {
      now: "2026-05-31T01:01:00.000Z",
    }),
  );
  assert.equal(duplicateResult.ok, false);
  assert.equal(duplicateResult.status, "duplicate_active_mapping");
  assert.equal(countRows(dbPath, tableName), beforeProposedCount + 1);
  assertSideEffectsUnchanged(dbPath, fixtures.proposed, duplicateBefore);

  const needsReviewBefore = sideEffectSnapshot(dbPath, fixtures.needsReview);
  const needsReviewCount = countRows(dbPath, tableName);
  const needsReviewResult = createAgWorkResumeConfirmedMapping(
    buildConfirmedInput(fixtures.needsReview, {
      foreign_scope: fixtures.needsReview.proposal.foreign_scope,
      foreign_work_id: fixtures.needsReview.proposal.foreign_work_id,
      local_scope: fixtures.needsReview.proposal.candidate_local_scope,
      local_work_id: fixtures.needsReview.proposal.candidate_local_work_id,
      packet_id: fixtures.needsReview.proposal.packet_id,
      packet_hash: fixtures.needsReview.proposal.packet_hash,
      source_runtime_instance_id:
        fixtures.needsReview.proposal.source_runtime_instance_id,
      confirmed_at: "2026-05-31T01:02:00.000Z",
    }),
  );
  assert.equal(needsReviewResult.ok, true);
  assert.equal(needsReviewResult.status, "created");
  assert.equal(needsReviewResult.source_proposal?.status, "needs_review");
  assert.equal(countRows(dbPath, tableName), needsReviewCount + 1);
  assertSideEffectsUnchanged(dbPath, fixtures.needsReview, needsReviewBefore);

  const helperEnvBefore = sideEffectSnapshot(dbPath, fixtures.helperEnv);
  const helperEnvCount = countRows(dbPath, tableName);
  const helperEnv = runHelper({
    dbPath,
    envInput: buildConfirmedInput(fixtures.helperEnv, {
      confirmed_at: "2026-05-31T01:03:00.000Z",
    }),
  });
  assert.equal(helperEnv.status, 0);
  assert.equal(helperEnv.json.ok, true);
  assert.equal(helperEnv.json.helper, "ag_work_resume_confirmed_mapping_create.v0_1");
  assert.equal(helperEnv.json.input_mode, "env");
  assert.equal(helperEnv.json.result.status, "created");
  assert.equal(countRows(dbPath, tableName), helperEnvCount + 1);
  assertSideEffectsUnchanged(dbPath, fixtures.helperEnv, helperEnvBefore);

  const helperFileBefore = sideEffectSnapshot(dbPath, fixtures.helperFile);
  const helperFileCount = countRows(dbPath, tableName);
  const inputFile = path.join(tempDir, "helper-file-input.json");
  writeFileSync(
    inputFile,
    JSON.stringify(
      buildConfirmedInput(fixtures.helperFile, {
        confirmed_at: "2026-05-31T01:04:00.000Z",
      }),
    ),
  );
  const helperFile = runHelper({ dbPath, filePath: inputFile });
  assert.equal(helperFile.status, 0);
  assert.equal(helperFile.json.ok, true);
  assert.equal(helperFile.json.input_mode, "file");
  assert.equal(countRows(dbPath, tableName), helperFileCount + 1);
  assertSideEffectsUnchanged(dbPath, fixtures.helperFile, helperFileBefore);

  const helperFlagsBefore = sideEffectSnapshot(dbPath, fixtures.helperFlags);
  const helperFlagsCount = countRows(dbPath, tableName);
  const helperFlags = runHelper({
    dbPath,
    flags: {
      source_proposal_id: fixtures.helperFlags.proposal_id,
      confirmed_by: "user-core:flags",
      confirmation_reason: "User/Core confirmed this mapping through flags.",
      confirmed_at: "2026-05-31T01:05:00.000Z",
    },
  });
  assert.equal(helperFlags.status, 0);
  assert.equal(helperFlags.json.ok, true);
  assert.equal(helperFlags.json.input_mode, "flags");
  assert.equal(countRows(dbPath, tableName), helperFlagsCount + 1);
  assertSideEffectsUnchanged(dbPath, fixtures.helperFlags, helperFlagsBefore);

  const helperStdinBefore = sideEffectSnapshot(dbPath, fixtures.helperStdin);
  const helperStdinCount = countRows(dbPath, tableName);
  const helperStdin = runHelper({
    dbPath,
    stdinInput: buildConfirmedInput(fixtures.helperStdin, {
      confirmed_at: "2026-05-31T01:06:00.000Z",
    }),
  });
  assert.equal(helperStdin.status, 0);
  assert.equal(helperStdin.json.ok, true);
  assert.equal(helperStdin.json.input_mode, "stdin");
  assert.equal(countRows(dbPath, tableName), helperStdinCount + 1);
  assertSideEffectsUnchanged(dbPath, fixtures.helperStdin, helperStdinBefore);

  const invalidCases = [
    {
      name: "missing source proposal id",
      input: { ...buildConfirmedInput(fixtures.mismatch), source_proposal_id: "" },
      status: "invalid_input",
    },
    {
      name: "missing confirmed by",
      input: { ...buildConfirmedInput(fixtures.mismatch), confirmed_by: "" },
      status: "invalid_input",
    },
    {
      name: "missing confirmation reason",
      input: { ...buildConfirmedInput(fixtures.mismatch), confirmation_reason: "" },
      status: "invalid_input",
    },
    {
      name: "malformed confirmed at",
      input: {
        ...buildConfirmedInput(fixtures.mismatch),
        confirmed_at: "2026-05-31T01:07:00Z",
      },
      status: "invalid_input",
    },
    {
      name: "unknown field",
      input: { ...buildConfirmedInput(fixtures.mismatch), import_context: true },
      status: "invalid_input",
    },
    {
      name: "missing proposal row",
      input: {
        ...buildConfirmedInput(fixtures.mismatch),
        source_proposal_id: "ag-resume-mapping-proposal:missing",
      },
      status: "proposal_not_found",
    },
    {
      name: "local work missing",
      input: buildConfirmedInput(fixtures.localMissing),
      status: "local_work_not_found",
    },
  ];
  for (const invalidCase of invalidCases) {
    assertCreateFailsWithoutMapping({
      createAgWorkResumeConfirmedMapping,
      input: invalidCase.input,
      status: invalidCase.status,
      label: invalidCase.name,
    });
  }

  for (const fixture of [
    fixtures.withdrawn,
    fixtures.rejected,
    fixtures.superseded,
    fixtures.expired,
  ]) {
    assertCreateFailsWithoutMapping({
      createAgWorkResumeConfirmedMapping,
      input: buildConfirmedInput(fixture),
      status: "proposal_not_active",
      label: `inactive ${fixture.proposal.status}`,
    });
  }

  for (const [field, value] of Object.entries({
    foreign_scope: "project:mismatch",
    foreign_work_id: "AG-MISMATCH",
    local_scope: "project:mismatch",
    local_work_id: "AG-MISMATCH-LOCAL",
    packet_id: "resume-packet:mismatch",
    packet_hash: "sha256:mismatch",
    source_runtime_instance_id: "runtime-instance:mismatch",
  })) {
    assertCreateFailsWithoutMapping({
      createAgWorkResumeConfirmedMapping,
      input: {
        ...buildConfirmedInput(fixtures.mismatch),
        [field]: value,
      },
      status: "proposal_mismatch",
      label: `proposal mismatch ${field}`,
    });
  }

  const deterministicIdA = createInFreshDbAndReturnId({
    freshDbPath: path.join(tempDir, "deterministic-a.db"),
    buildAgWorkResumePacketPreview,
    createAgWorkResumeMappingProposalRecord,
    createAgWorkResumeConfirmedMapping,
  });
  const deterministicIdB = createInFreshDbAndReturnId({
    freshDbPath: path.join(tempDir, "deterministic-b.db"),
    buildAgWorkResumePacketPreview,
    createAgWorkResumeMappingProposalRecord,
    createAgWorkResumeConfirmedMapping,
  });
  assert.equal(deterministicIdA, deterministicIdB);

  assertNoForbiddenTablesOrRows(dbPath);
  assert.equal(fetchCalls, 0);

  console.log(
    JSON.stringify(
      {
        smoke: "ag-work-resume-confirmed-mapping-writer",
        temp_db_path: dbPath,
        cases: [
          "package scripts are present",
          "writer/helper source guards pass",
          "docs and pointer guards pass",
          "core creates one confirmed mapping from proposed proposal",
          "core creates one confirmed mapping from needs_review proposal",
          "core derives optional fields from proposal",
          "core accepts explicit matching proposal fields",
          "helper env/file/flags/stdin creates mappings",
          "missing required fields fail closed",
          "malformed confirmed_at fails closed",
          "missing proposal fails closed",
          "withdrawn/rejected/superseded/expired proposals fail closed",
          "proposal field mismatches fail closed",
          "missing local work fails closed",
          "duplicate active mapping fails closed",
          "unknown fields fail closed",
          "source proposal and local work rows are unchanged",
          "protected table counts remain unchanged after fixture seeding",
          "deterministic mapping id repeats across fresh DBs",
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
    writerPath,
    helperPath,
    smokePath,
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
    packageJson.scripts?.["ag:resume-confirmed-mapping-create"],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/ag-work-resume-confirmed-mapping-create.mjs",
  );
  assert.equal(
    packageJson.scripts?.["smoke:ag-work-resume-confirmed-mapping-writer"],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-ag-work-resume-confirmed-mapping-writer.mjs",
  );
}

function assertSourceGuards() {
  const sources = {
    writer: readFileSync(writerPath, "utf8"),
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
      /createEvidenceRecord|recordEvidence|recordProof|bindSession|ensureSession|insertWorkItem|insertWorkEvent/i,
      /executeCodex|runCodex/i,
      /app\/api\/ag-work-resume\/confirmed/i,
    ]) {
      assert.doesNotMatch(source, forbidden, `${label} must not contain ${forbidden}`);
    }
  }

  for (const forbiddenPath of [
    "app/api/ag-work-resume/confirmed-mapping-records/route.ts",
    "components/ag-work-resume-confirmed-mapping.tsx",
  ]) {
    assert.equal(
      existsSync(path.join(rootDir, forbiddenPath)),
      false,
      `${forbiddenPath} must not exist in writer/helper-only slice`,
    );
  }

  const allowedFiles = new Set([
    "lib/ag-work-resume-confirmed-mapping.ts",
    "lib/ag-work-resume-confirmed-mapping-read.ts",
    "components/augnes-cockpit.tsx",
    "reports/browser/2026-05-31-ag-work-resume-confirmed-mapping-read-cockpit-panel-verification.md",
    "reports/browser/2026-06-01-ag-work-resume-confirmed-mapping-create-cockpit-panel-verification.md",
    "scripts/ag-work-resume-confirmed-mapping-create.mjs",
    "scripts/ag-work-resume-confirmed-mapping-read.mjs",
    "app/api/ag-work-resume/confirmed-mappings/route.ts",
    "scripts/smoke-ag-work-resume-confirmed-mapping-read.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-read-cockpit-panel.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-create-cockpit-panel.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-route.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-writer.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-db-schema.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-db-schema-design.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-record-design.mjs",
    "docs/AG_WORK_RESUME_CONFIRMED_MAPPING_READ_V0_1.md",
    "docs/AG_WORK_RESUME_CONFIRMED_MAPPING_READ_COCKPIT_PANEL_V0_1.md",
    "docs/AG_WORK_RESUME_CONFIRMED_MAPPING_CREATE_COCKPIT_PANEL_V0_1.md",
    "docs/AG_WORK_RESUME_CONFIRMED_MAPPING_ROUTE_V0_1.md",
    "docs/AG_WORK_RESUME_CONFIRMED_MAPPING_WRITER_V0_1.md",
    "docs/AG_WORK_RESUME_CONFIRMED_MAPPING_DB_SCHEMA_IMPLEMENTATION_V0_1.md",
    "docs/AG_WORK_RESUME_CONFIRMED_MAPPING_DB_SCHEMA_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_CONFIRMED_MAPPING_RECORD_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md",
    "package.json",
  ]);
  const changedFiles = gitChangedFiles();
  for (const file of changedFiles) {
    assert.ok(
      allowedFiles.has(file),
      `changed file is outside confirmed mapping writer/helper slice: ${file}`,
    );
    assert.ok(
      file === "app/api/ag-work-resume/confirmed-mappings/route.ts" ||
        !file.startsWith("app/"),
      `app changes limited to confirmed mapping route in this follow-up: ${file}`,
    );
    assert.ok(
      file === "components/augnes-cockpit.tsx" || !file.startsWith("components/"),
      `component changes limited to confirmed mapping read Cockpit panel: ${file}`,
    );
    assert.equal(file.startsWith("migrations/"), false, `no migration change: ${file}`);
    assert.equal(file.startsWith("apps/"), false, `no MCP/App change: ${file}`);
    assert.ok(
      file ===
        "reports/browser/2026-05-31-ag-work-resume-confirmed-mapping-read-cockpit-panel-verification.md" ||
        file ===
          "reports/browser/2026-06-01-ag-work-resume-confirmed-mapping-create-cockpit-panel-verification.md" ||
        !file.startsWith("reports/browser/"),
      `browser reports limited to confirmed mapping Cockpit panel verification: ${file}`,
    );
    assert.ok(
      file === "lib/ag-work-resume-confirmed-mapping.ts" ||
        file === "lib/ag-work-resume-confirmed-mapping-read.ts" ||
        !file.startsWith("lib/"),
      `lib changes limited to confirmed mapping writer/read cores: ${file}`,
    );
    assert.notEqual(file, "lib/db/schema.sql", "schema.sql must be unchanged");
  }
}

function assertDocsGuard() {
  const docs = readFileSync(docsPath, "utf8");
  for (const pattern of [
    /Purpose/i,
    /Stage C design\/schema implementation/i,
    /Core API/i,
    /Helper Usage/i,
    /Validation Rules/i,
    /DB Behavior/i,
    /Local Work Existence Validation/i,
    /Proposal Match Validation/i,
    /Duplicate Active Mapping Policy/i,
    /Output Shape/i,
    /Authority Boundary/i,
    /Non-Goals/i,
    /Verification/i,
    /browser verification skipped: no rendered UI\/operator surface changed in this confirmed mapping writer\/helper slice/i,
    /writer creates only confirmed mapping identity association rows/i,
    /writer does not import context/i,
    /writer does not create work items/i,
    /writer does not update proposal rows/i,
    /writer does not record proof\/evidence/i,
    /writer does not bind sessions/i,
    /writer does not execute Codex/i,
    /writer adds no route\/UI/i,
  ]) {
    assert.match(docs, pattern, `writer docs must include ${pattern}`);
  }

  for (const pointerDocPath of pointerDocPaths) {
    const pointerDocs = readFileSync(pointerDocPath, "utf8");
    assert.match(
      pointerDocs,
      /AG_WORK_RESUME_CONFIRMED_MAPPING_WRITER_V0_1\.md/,
      `${path.basename(pointerDocPath)} must point to confirmed mapping writer doc`,
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

function createProposalFixture({
  key,
  status = "proposed",
  seedLocalWork = true,
  buildAgWorkResumePacketPreview,
  createAgWorkResumeMappingProposalRecord,
  targetDbPath = dbPath,
}) {
  const packet = buildAgWorkResumePacketPreview(
    buildFixtureInput({
      key,
      foreignWorkId: `AG-CONFIRMED-MAPPING-${key.toUpperCase()}`,
      runtimeInstanceId: `runtime-instance:confirmed-mapping-${key}`,
    }),
  );
  const candidate = buildCandidateFromPacket(packet, {
    candidate_id: `candidate:${key}`,
    local_scope: "project:augnes",
    local_work_id: `AG-LOCAL-CONFIRMED-MAPPING-${key.toUpperCase()}`,
  });
  if (seedLocalWork) {
    seedLocalWorkItem(targetDbPath, candidate);
  }

  const createStatus = status === "needs_review" ? "needs_review" : "proposed";
  const created = createAgWorkResumeMappingProposalRecord(
    buildProposalCreateInput(packet, candidate, {
      status: createStatus,
      proposal_reason: `User/Core requested Stage C confirmed mapping fixture ${key}.`,
    }),
  );
  assert.equal(created.ok, true, `proposal fixture ${key} should be created`);

  if (!["proposed", "needs_review"].includes(status)) {
    updateProposalStatus(targetDbPath, created.record.proposal_id, status);
  }

  return {
    key,
    packet,
    candidate,
    proposal_id: created.record.proposal_id,
    proposal: readProposalRow(targetDbPath, created.record.proposal_id),
  };
}

function buildConfirmedInput(fixture, overrides = {}) {
  return {
    source_proposal_id: fixture.proposal_id,
    confirmed_by: overrides.confirmed_by ?? "user-core:confirmed-mapping-smoke",
    confirmation_reason:
      overrides.confirmation_reason ??
      `User/Core confirmed fixture mapping ${fixture.key}.`,
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
    ...(overrides.now !== undefined ? { now: overrides.now } : {}),
  };
}

function assertCreateFailsWithoutMapping({
  createAgWorkResumeConfirmedMapping,
  input,
  status,
  label,
}) {
  const before = countRows(dbPath, tableName);
  const protectedBefore = snapshotProtectedCounts(dbPath);
  const result = createAgWorkResumeConfirmedMapping(input);
  assert.equal(result.ok, false, label);
  assert.equal(result.status, status, label);
  assert.equal(countRows(dbPath, tableName), before, label);
  assertProtectedCounts(dbPath, protectedBefore, label);
}

function createInFreshDbAndReturnId({
  freshDbPath,
  buildAgWorkResumePacketPreview,
  createAgWorkResumeMappingProposalRecord,
  createAgWorkResumeConfirmedMapping,
}) {
  resetDb(freshDbPath);
  const previous = process.env.AUGNES_DB_PATH;
  process.env.AUGNES_DB_PATH = freshDbPath;
  try {
    const fixture = createProposalFixture({
      key: "deterministic",
      buildAgWorkResumePacketPreview,
      createAgWorkResumeMappingProposalRecord,
      targetDbPath: freshDbPath,
    });
    const result = createAgWorkResumeConfirmedMapping(
      buildConfirmedInput(fixture, {
        confirmed_by: "user-core:deterministic",
        confirmation_reason: "User/Core confirmed deterministic mapping.",
        confirmed_at: "2026-05-31T02:00:00.000Z",
      }),
    );
    assert.equal(result.ok, true);
    return result.mapping_id;
  } finally {
    process.env.AUGNES_DB_PATH = previous;
  }
}

function runHelper({ dbPath: helperDbPath, envInput, filePath, flags, stdinInput }) {
  const args = [
    "--tsconfig",
    "tsconfig.json",
    "scripts/ag-work-resume-confirmed-mapping-create.mjs",
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
              AG_WORK_RESUME_CONFIRMED_MAPPING_CREATE_INPUT:
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
    proposalRow: snapshotProposalRow(targetDbPath, fixture.proposal_id),
    localWorkRow: fixture.candidate
      ? snapshotLocalWorkRow(
          targetDbPath,
          fixture.candidate.local_scope,
          fixture.candidate.local_work_id,
        )
      : null,
  };
}

function assertSideEffectsUnchanged(targetDbPath, fixture, before) {
  assertProtectedCounts(targetDbPath, before.protectedCounts, fixture.key);
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
      links: JSON.stringify({ source: "confirmed-mapping-writer-smoke" }),
      created_at: "2026-05-31T00:00:00.000Z",
      updated_at: "2026-05-31T00:00:00.000Z",
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
    proposed_by: "user-core:confirmed-mapping-smoke",
    proposal_reason:
      overrides.proposal_reason ??
      "User/Core requested a durable proposal for later confirmed mapping review.",
    status: overrides.status ?? "proposed",
    expires_at: null,
    source: {
      reviewed_by_surface: "codex",
      reviewed_at: "2026-05-31T00:00:00.000Z",
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
      as_of: "2026-05-31T00:00:00.000Z",
      framing: {
        work_id: "Trace anchor only.",
        state_authority: "Augnes committed state remains authority.",
        execution_proof: "Action records remain proof.",
        temporal_proof: "Temporal graph remains proof over time.",
      },
      work: {
        work_id: foreignWorkId,
        scope,
        title: `Confirmed mapping writer fixture ${key}`,
        status: "in_progress",
        priority: "now",
        summary: "Create a confirmed mapping writer smoke fixture.",
        next_action: "Confirm an existing local work identity association.",
        user_attention_required: false,
        related_state_keys: ["coordination.ag_resume_confirmed_mapping"],
        links: {
          docs: ["docs/AG_WORK_RESUME_CONFIRMED_MAPPING_WRITER_V0_1.md"],
        },
        created_at: "2026-05-31T00:00:00.000Z",
        updated_at: "2026-05-31T00:00:00.000Z",
      },
      next_action: "Confirm an existing local work identity association.",
      user_attention_required: false,
      recent_events: [],
      related_state_keys: ["coordination.ag_resume_confirmed_mapping"],
      related_proof: {
        action_ids: [],
        action_records: [],
        docs: ["docs/AG_WORK_RESUME_CONFIRMED_MAPPING_WRITER_V0_1.md"],
        note: "No local proof is imported by confirmed mapping.",
      },
      codex_handoff: {
        task_brief: "Implement confirmed mapping writer/helper.",
        constraints: ["No import.", "No route/UI.", "No Codex execution."],
        suggested_verification: [
          "npm run smoke:ag-work-resume-confirmed-mapping-writer",
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
          notable_state_keys: ["coordination.ag_resume_confirmed_mapping"],
        },
        next_recommended_action: {
          related_state_keys: ["coordination.ag_resume_confirmed_mapping"],
        },
        codex_handoff: {
          task_brief: "Implement confirmed mapping writer/helper.",
          constraints: ["No import.", "No route/UI.", "No Codex execution."],
          likely_files: [
            "lib/ag-work-resume-confirmed-mapping.ts",
            "scripts/ag-work-resume-confirmed-mapping-create.mjs",
          ],
          verification_commands: [
            "npm run smoke:ag-work-resume-confirmed-mapping-writer",
          ],
        },
      },
    },
    handoffDraft: {
      handoff_id: `handoff:confirmed-mapping-writer-smoke:${key}`,
      status: "ready",
      expected_files: [
        "lib/ag-work-resume-confirmed-mapping.ts",
        "scripts/ag-work-resume-confirmed-mapping-create.mjs",
      ],
      expected_checks: [
        "npm run smoke:ag-work-resume-confirmed-mapping-writer",
      ],
      expected_execution_surfaces: [],
      forbidden_surfaces: ["import", "proof/evidence", "Codex execution"],
      stop_conditions: ["Confirmed mapping writer output grants downstream authority."],
      safety_boundaries: [
        "Confirmed mapping creation is only an identity association.",
      ],
    },
    git: {
      remote: "https://github.com/hynk-studio/augnes.git",
      base_branch: "main",
      base_commit: "0c873b4",
      working_branch: "codex/ag-resume-confirmed-mapping-writer",
      head_commit: "confirmed-mapping-writer",
      related_pr: null,
      dirty_worktree: false,
    },
    issuer: {
      runtime_instance_id: runtimeInstanceId,
      source_local_label: `source-local-confirmed-mapping-${key}`,
      created_by_surface: "confirmed-mapping-writer-smoke",
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
    ).run(status, "2026-05-31T00:30:00.000Z", proposalId);
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
