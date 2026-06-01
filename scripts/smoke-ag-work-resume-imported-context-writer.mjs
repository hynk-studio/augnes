import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const writerPath = path.join(rootDir, "lib", "ag-work-resume-imported-context.ts");
const helperPath = path.join(
  rootDir,
  "scripts",
  "ag-work-resume-imported-context-create.mjs",
);
const smokePath = fileURLToPath(import.meta.url);
const docsPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_IMPORTED_CONTEXT_WRITER_V0_1.md",
);
const packagePath = path.join(rootDir, "package.json");
const schemaPath = path.join(rootDir, "lib", "db", "schema.sql");
const pointerDocPaths = [
  path.join(rootDir, "docs", "AG_WORK_RESUME_IMPORTED_CONTEXT_DB_SCHEMA_IMPLEMENTATION_V0_1.md"),
  path.join(rootDir, "docs", "AG_WORK_RESUME_IMPORTED_CONTEXT_DB_SCHEMA_DESIGN_V0_1.md"),
  path.join(rootDir, "docs", "AG_WORK_RESUME_IMPORTED_CONTEXT_RECORD_DESIGN_V0_1.md"),
  path.join(rootDir, "docs", "AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md"),
];
const tableName = "ag_work_resume_imported_contexts";
const mappingTableName = "ag_work_resume_confirmed_mappings";
const proposalTableName = "ag_work_resume_mapping_proposals";
const tempDir = mkdtempSync(
  path.join(os.tmpdir(), "augnes-ag-resume-imported-context-writer-"),
);
const dbPath = path.join(tempDir, "augnes.db");

process.env.AUGNES_DB_PATH = dbPath;
process.env.OPENAI_API_KEY = "smoke-openai-key-must-not-be-used";

let fetchCalls = 0;
globalThis.fetch = async () => {
  fetchCalls += 1;
  throw new Error("AG resume imported context writer smoke must not call fetch.");
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

  const fixtures = {
    derived: createConfirmedMappingFixture({
      key: "derived",
      buildAgWorkResumePacketPreview,
      createAgWorkResumeMappingProposalRecord,
      createAgWorkResumeConfirmedMapping,
    }),
    explicit: createConfirmedMappingFixture({
      key: "explicit",
      buildAgWorkResumePacketPreview,
      createAgWorkResumeMappingProposalRecord,
      createAgWorkResumeConfirmedMapping,
    }),
    defaults: createConfirmedMappingFixture({
      key: "defaults",
      buildAgWorkResumePacketPreview,
      createAgWorkResumeMappingProposalRecord,
      createAgWorkResumeConfirmedMapping,
    }),
    helperEnv: createConfirmedMappingFixture({
      key: "helper-env",
      buildAgWorkResumePacketPreview,
      createAgWorkResumeMappingProposalRecord,
      createAgWorkResumeConfirmedMapping,
    }),
    helperFile: createConfirmedMappingFixture({
      key: "helper-file",
      buildAgWorkResumePacketPreview,
      createAgWorkResumeMappingProposalRecord,
      createAgWorkResumeConfirmedMapping,
    }),
    helperFlags: createConfirmedMappingFixture({
      key: "helper-flags",
      buildAgWorkResumePacketPreview,
      createAgWorkResumeMappingProposalRecord,
      createAgWorkResumeConfirmedMapping,
    }),
    helperStdin: createConfirmedMappingFixture({
      key: "helper-stdin",
      buildAgWorkResumePacketPreview,
      createAgWorkResumeMappingProposalRecord,
      createAgWorkResumeConfirmedMapping,
    }),
    invalid: createConfirmedMappingFixture({
      key: "invalid",
      buildAgWorkResumePacketPreview,
      createAgWorkResumeMappingProposalRecord,
      createAgWorkResumeConfirmedMapping,
    }),
    inactive: createConfirmedMappingFixture({
      key: "inactive",
      mappingStatus: "revoked",
      buildAgWorkResumePacketPreview,
      createAgWorkResumeMappingProposalRecord,
      createAgWorkResumeConfirmedMapping,
    }),
  };

  const derivedBefore = sideEffectSnapshot(dbPath, fixtures.derived);
  const derivedCount = countRows(dbPath, tableName);
  const derivedResult = createAgWorkResumeImportedContext(
    buildImportedInput(fixtures.derived, {
      now: "2026-06-01T01:00:00.000Z",
    }),
  );
  assert.equal(derivedResult.ok, true);
  assert.equal(derivedResult.status, "created");
  assert.equal(derivedResult.record?.status, "review_metadata");
  assert.equal(derivedResult.record?.mapping_id, fixtures.derived.mapping_id);
  assert.equal(derivedResult.record?.foreign_scope, fixtures.derived.mapping.foreign_scope);
  assert.equal(derivedResult.record?.foreign_work_id, fixtures.derived.mapping.foreign_work_id);
  assert.equal(derivedResult.record?.local_scope, fixtures.derived.mapping.local_scope);
  assert.equal(derivedResult.record?.local_work_id, fixtures.derived.mapping.local_work_id);
  assert.equal(derivedResult.record?.packet_id, fixtures.derived.mapping.packet_id);
  assert.equal(derivedResult.record?.packet_hash, fixtures.derived.mapping.packet_hash);
  assert.equal(derivedResult.record?.imported_expected_files.length, 1);
  assert.equal(derivedResult.record?.foreign_refs_summary.foreign_proof_ref, "proof:foreign-public-safe");
  assert.ok(derivedResult.import_id?.startsWith("ag-resume-imported-context:"));
  assertImportedAuthorityBoundary(derivedResult.authority_boundary, true);
  assertImportedAuthorityBoundary(derivedResult.record.authority_boundary, true);
  assert.equal(countRows(dbPath, tableName), derivedCount + 1);
  assertSideEffectsUnchanged(dbPath, fixtures.derived, derivedBefore);

  const explicitBefore = sideEffectSnapshot(dbPath, fixtures.explicit);
  const explicitCount = countRows(dbPath, tableName);
  const explicitResult = createAgWorkResumeImportedContext(
    buildImportedInput(fixtures.explicit, {
      foreign_scope: fixtures.explicit.mapping.foreign_scope,
      foreign_work_id: fixtures.explicit.mapping.foreign_work_id,
      local_scope: fixtures.explicit.mapping.local_scope,
      local_work_id: fixtures.explicit.mapping.local_work_id,
      source_runtime_instance_id:
        fixtures.explicit.mapping.source_runtime_instance_id,
      created_at: "2026-06-01T01:01:00.000Z",
    }),
  );
  assert.equal(explicitResult.ok, true);
  assert.equal(explicitResult.status, "created");
  assert.equal(countRows(dbPath, tableName), explicitCount + 1);
  assertSideEffectsUnchanged(dbPath, fixtures.explicit, explicitBefore);

  const defaultsBefore = sideEffectSnapshot(dbPath, fixtures.defaults);
  const defaultsCount = countRows(dbPath, tableName);
  const defaultsResult = createAgWorkResumeImportedContext(
    buildImportedInput(fixtures.defaults, {
      imported_expected_files: undefined,
      imported_expected_checks: undefined,
      foreign_refs_summary: undefined,
      created_at: "2026-06-01T01:02:00.000Z",
    }),
  );
  assert.equal(defaultsResult.ok, true);
  assert.deepEqual(defaultsResult.record?.imported_expected_files, []);
  assert.deepEqual(defaultsResult.record?.imported_expected_checks, []);
  assert.deepEqual(defaultsResult.record?.foreign_refs_summary, {});
  assert.equal(countRows(dbPath, tableName), defaultsCount + 1);
  assertSideEffectsUnchanged(dbPath, fixtures.defaults, defaultsBefore);

  const helperEnvBefore = sideEffectSnapshot(dbPath, fixtures.helperEnv);
  const helperEnvCount = countRows(dbPath, tableName);
  const helperEnv = runHelper({
    dbPath,
    envInput: buildImportedInput(fixtures.helperEnv, {
      created_at: "2026-06-01T01:03:00.000Z",
    }),
  });
  assert.equal(helperEnv.status, 0);
  assert.equal(helperEnv.json.ok, true);
  assert.equal(helperEnv.json.helper, "ag_work_resume_imported_context_create.v0_1");
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
      buildImportedInput(fixtures.helperFile, {
        created_at: "2026-06-01T01:04:00.000Z",
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
      mapping_id: fixtures.helperFlags.mapping_id,
      packet_id: fixtures.helperFlags.mapping.packet_id,
      packet_hash: fixtures.helperFlags.mapping.packet_hash,
      imported_summary: "Imported context helper flags summary.",
      imported_expected_files_json: JSON.stringify(["docs/flags.md"]),
      imported_expected_checks_json: JSON.stringify(["npm run flags"]),
      foreign_refs_summary_json: JSON.stringify({ foreign_action_ref: "action:flags" }),
      redaction_report_json: JSON.stringify(safeRedactionReport()),
      created_by: "user-core:imported-context-flags",
      import_reason: "User/Core created imported context through flags.",
      created_at: "2026-06-01T01:05:00.000Z",
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
    stdinInput: buildImportedInput(fixtures.helperStdin, {
      created_at: "2026-06-01T01:06:00.000Z",
    }),
  });
  assert.equal(helperStdin.status, 0);
  assert.equal(helperStdin.json.ok, true);
  assert.equal(helperStdin.json.input_mode, "stdin");
  assert.equal(countRows(dbPath, tableName), helperStdinCount + 1);
  assertSideEffectsUnchanged(dbPath, fixtures.helperStdin, helperStdinBefore);

  const invalidCases = [
    {
      name: "missing mapping_id",
      input: { ...buildImportedInput(fixtures.invalid), mapping_id: "" },
      status: "invalid_input",
    },
    {
      name: "missing packet_id",
      input: { ...buildImportedInput(fixtures.invalid), packet_id: "" },
      status: "invalid_input",
    },
    {
      name: "missing packet_hash",
      input: { ...buildImportedInput(fixtures.invalid), packet_hash: "" },
      status: "invalid_input",
    },
    {
      name: "missing imported_summary",
      input: { ...buildImportedInput(fixtures.invalid), imported_summary: "" },
      status: "invalid_input",
    },
    {
      name: "missing created_by",
      input: { ...buildImportedInput(fixtures.invalid), created_by: "" },
      status: "invalid_input",
    },
    {
      name: "missing import_reason",
      input: { ...buildImportedInput(fixtures.invalid), import_reason: "" },
      status: "invalid_input",
    },
    {
      name: "malformed created_at",
      input: {
        ...buildImportedInput(fixtures.invalid),
        created_at: "2026-06-01T01:07:00Z",
      },
      status: "invalid_input",
    },
    {
      name: "imported_expected_files not array of strings",
      input: {
        ...buildImportedInput(fixtures.invalid),
        imported_expected_files: ["ok", 7],
      },
      status: "invalid_input",
    },
    {
      name: "imported_expected_checks not array of strings",
      input: {
        ...buildImportedInput(fixtures.invalid),
        imported_expected_checks: ["ok", false],
      },
      status: "invalid_input",
    },
    {
      name: "foreign_refs_summary not object",
      input: {
        ...buildImportedInput(fixtures.invalid),
        foreign_refs_summary: [],
      },
      status: "invalid_input",
    },
    {
      name: "redaction_report missing",
      input: omit(buildImportedInput(fixtures.invalid), "redaction_report"),
      status: "redaction_blocked",
    },
    {
      name: "redaction_report secrets_included true",
      input: {
        ...buildImportedInput(fixtures.invalid),
        redaction_report: { ...safeRedactionReport(), secrets_included: true },
      },
      status: "redaction_blocked",
    },
    {
      name: "redaction_report raw_db_paths_included true",
      input: {
        ...buildImportedInput(fixtures.invalid),
        redaction_report: { ...safeRedactionReport(), raw_db_paths_included: true },
      },
      status: "redaction_blocked",
    },
    {
      name: "redaction_report session_payloads_included true",
      input: {
        ...buildImportedInput(fixtures.invalid),
        redaction_report: { ...safeRedactionReport(), session_payloads_included: true },
      },
      status: "redaction_blocked",
    },
    {
      name: "redaction_report proof_payloads_included true",
      input: {
        ...buildImportedInput(fixtures.invalid),
        redaction_report: { ...safeRedactionReport(), proof_payloads_included: true },
      },
      status: "redaction_blocked",
    },
    {
      name: "mapping missing",
      input: {
        ...buildImportedInput(fixtures.invalid),
        mapping_id: "ag-resume-confirmed-mapping:missing",
      },
      status: "mapping_not_found",
    },
    {
      name: "mapping not active",
      input: buildImportedInput(fixtures.inactive),
      status: "mapping_not_active",
    },
    {
      name: "unknown field",
      input: { ...buildImportedInput(fixtures.invalid), proof_record: true },
      status: "invalid_input",
    },
  ];
  for (const invalidCase of invalidCases) {
    assertCreateFailsWithoutImport({
      createAgWorkResumeImportedContext,
      input: invalidCase.input,
      status: invalidCase.status,
      label: invalidCase.name,
      fixture: fixtures.invalid,
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
    assertCreateFailsWithoutImport({
      createAgWorkResumeImportedContext,
      input: {
        ...buildImportedInput(fixtures.invalid),
        [field]: value,
      },
      status: "mapping_mismatch",
      label: `mapping mismatch ${field}`,
      fixture: fixtures.invalid,
    });
  }

  assertNoForbiddenRows(dbPath);
  assert.equal(fetchCalls, 0);

  console.log(
    JSON.stringify(
      {
        smoke: "ag-work-resume-imported-context-writer",
        temp_db_path: dbPath,
        cases: [
          "package scripts are present",
          "writer/helper source guards pass",
          "docs and pointer guards pass",
          "core creates one imported context from active confirmed mapping",
          "core derives foreign/local fields from mapping when omitted",
          "core accepts explicit matching foreign/local and packet fields",
          "core defaults expected files/checks and foreign refs",
          "helper env/file/flags/stdin creates imported contexts",
          "missing required fields fail closed",
          "malformed created_at fails closed",
          "expected files/checks and foreign refs validation fails closed",
          "redaction report blocks unsafe context",
          "missing or inactive mapping fails closed",
          "mapping mismatches fail closed",
          "unknown fields fail closed",
          "confirmed mapping, source proposal, and local work rows are unchanged",
          "work/proof/evidence/session tables receive no rows",
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
    packageJson.scripts?.["ag:resume-imported-context-create"],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/ag-work-resume-imported-context-create.mjs",
  );
  assert.equal(
    packageJson.scripts?.["smoke:ag-work-resume-imported-context-writer"],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-ag-work-resume-imported-context-writer.mjs",
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
      /app\/api\//i,
    ]) {
      assert.doesNotMatch(source, forbidden, `${label} must not contain ${forbidden}`);
    }
  }

  for (const forbiddenPath of [
    "components/ag-work-resume-imported-context.tsx",
  ]) {
    assert.equal(
      existsSync(path.join(rootDir, forbiddenPath)),
      false,
      `${forbiddenPath} must not exist in writer/helper-only slice`,
    );
  }

  const allowedFiles = new Set([
    "lib/ag-work-resume-imported-context.ts",
    "lib/ag-work-resume-imported-context-read.ts",
    "scripts/ag-work-resume-imported-context-create.mjs",
    "scripts/ag-work-resume-imported-context-read.mjs",
    "scripts/smoke-ag-work-resume-imported-context-writer.mjs",
    "scripts/smoke-ag-work-resume-imported-context-read.mjs",
    "components/augnes-cockpit.tsx",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_CREATE_COCKPIT_PANEL_V0_1.md",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_READ_COCKPIT_PANEL_V0_1.md",
    "reports/browser/2026-06-01-ag-work-resume-imported-context-create-cockpit-panel-verification.md",
    "reports/browser/2026-06-01-ag-work-resume-imported-context-read-cockpit-panel-verification.md",
    "scripts/smoke-ag-work-resume-imported-context-create-cockpit-panel.mjs",
    "scripts/smoke-ag-work-resume-imported-context-read-cockpit-panel.mjs",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_WRITER_V0_1.md",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_READ_V0_1.md",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_DB_SCHEMA_IMPLEMENTATION_V0_1.md",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_DB_SCHEMA_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_RECORD_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md",
    "package.json",
    "scripts/smoke-ag-work-resume-imported-context-db-schema.mjs",
    "scripts/smoke-ag-work-resume-imported-context-db-schema-design.mjs",
    "scripts/smoke-ag-work-resume-imported-context-record-design.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-writer.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-route.mjs",
    "app/api/ag-work-resume/imported-contexts/route.ts",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_ROUTE_V0_1.md",
    "scripts/smoke-ag-work-resume-imported-context-route.mjs",
  ]);
  const changedFiles = gitChangedFiles();
  for (const file of changedFiles) {
    assert.ok(
      allowedFiles.has(file),
      `changed file is outside imported context writer/helper slice: ${file}`,
    );
    assert.ok(
      file === "app/api/ag-work-resume/imported-contexts/route.ts" ||
        !file.startsWith("app/"),
      `app changes limited to imported context create route follow-up: ${file}`,
    );
    assert.ok(
      file === "components/augnes-cockpit.tsx" || !file.startsWith("components/"),
      `component changes limited to imported context read Cockpit panel: ${file}`,
    );
    assert.equal(file.startsWith("migrations/"), false, `no migration change: ${file}`);
    assert.equal(file.startsWith("apps/"), false, `no MCP/App change: ${file}`);
    assert.ok(
      file ===
        "reports/browser/2026-06-01-ag-work-resume-imported-context-read-cockpit-panel-verification.md" ||
        file ===
          "reports/browser/2026-06-01-ag-work-resume-imported-context-create-cockpit-panel-verification.md" ||
        !file.startsWith("reports/browser/"),
      `browser report changes limited to imported context Cockpit panels: ${file}`,
    );
    assert.notEqual(file, "lib/db/schema.sql", "schema.sql must be unchanged");
    assert.ok(
      file === "lib/ag-work-resume-imported-context.ts" ||
        file === "lib/ag-work-resume-imported-context-read.ts" ||
        !file.startsWith("lib/"),
      `lib changes limited to imported context writer/read cores: ${file}`,
    );
  }
}

function assertDocsGuard() {
  const docs = readFileSync(docsPath, "utf8");
  for (const pattern of [
    /Purpose/i,
    /Relationship To Stage D Design And Schema/i,
    /Core API/i,
    /Helper Usage/i,
    /Validation Rules/i,
    /DB Behavior/i,
    /Active Confirmed Mapping Validation/i,
    /Redaction Validation/i,
    /Output Shape/i,
    /Authority Boundary/i,
    /Non-Goals/i,
    /browser verification skipped: no rendered UI\/operator surface changed in this imported context writer\/helper slice/i,
    /writer creates only imported context review metadata rows/i,
    /does not record proof\/evidence/i,
    /does not bind sessions/i,
    /does not execute Codex/i,
    /does not create work items or work events/i,
    /does not mutate confirmed mapping rows/i,
    /does not mutate\s+proposal rows/is,
    /adds no route\/UI/i,
    /import_reason.*why user\/Core created or\s+imported this bounded review metadata/is,
  ]) {
    assert.match(docs, pattern, `writer docs must include ${pattern}`);
  }

  for (const pointerDocPath of pointerDocPaths) {
    const pointerDocs = readFileSync(pointerDocPath, "utf8");
    assert.match(
      pointerDocs,
      /AG_WORK_RESUME_IMPORTED_CONTEXT_WRITER_V0_1\.md/,
      `${path.basename(pointerDocPath)} must point to imported context writer doc`,
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
  mappingStatus = "active",
  buildAgWorkResumePacketPreview,
  createAgWorkResumeMappingProposalRecord,
  createAgWorkResumeConfirmedMapping,
}) {
  const packet = buildAgWorkResumePacketPreview(
    buildFixtureInput({
      key,
      foreignWorkId: `AG-IMPORTED-CONTEXT-${key.toUpperCase()}`,
      runtimeInstanceId: `runtime-instance:imported-context-${key}`,
    }),
  );
  const candidate = buildCandidateFromPacket(packet, {
    candidate_id: `candidate:${key}`,
    local_scope: "project:augnes",
    local_work_id: `AG-LOCAL-IMPORTED-CONTEXT-${key.toUpperCase()}`,
  });
  seedLocalWorkItem(dbPath, candidate);

  const proposal = createAgWorkResumeMappingProposalRecord(
    buildProposalCreateInput(packet, candidate, {
      proposal_reason: `User/Core requested imported context writer fixture ${key}.`,
    }),
  );
  assert.equal(proposal.ok, true, `proposal fixture ${key} should be created`);

  const mapping = createAgWorkResumeConfirmedMapping(
    buildConfirmedInput(proposal.record, {
      confirmed_by: "user-core:imported-context-fixture",
      confirmation_reason: `User/Core confirmed fixture mapping ${key}.`,
      confirmed_at: `2026-06-01T00:${String(fixtureMinute(key)).padStart(2, "0")}:00.000Z`,
    }),
  );
  assert.equal(mapping.ok, true, `confirmed mapping fixture ${key} should be created`);

  if (mappingStatus !== "active") {
    updateMappingStatus(dbPath, mapping.record.mapping_id, mappingStatus);
  }

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
      `Bounded imported context summary for fixture ${fixture.key}.`,
    ...(hasOverride("imported_expected_files")
      ? { imported_expected_files: overrides.imported_expected_files }
      : { imported_expected_files: ["docs/imported-context.md"] }),
    ...(hasOverride("imported_expected_checks")
      ? { imported_expected_checks: overrides.imported_expected_checks }
      : { imported_expected_checks: ["npm run smoke:ag-work-resume-imported-context-writer"] }),
    ...(hasOverride("foreign_refs_summary")
      ? { foreign_refs_summary: overrides.foreign_refs_summary }
      : { foreign_refs_summary: { foreign_proof_ref: "proof:foreign-public-safe" } }),
    redaction_report: overrides.redaction_report ?? safeRedactionReport(),
    created_by: overrides.created_by ?? "user-core:imported-context-smoke",
    import_reason:
      overrides.import_reason ??
      `User/Core imported bounded context for fixture ${fixture.key}.`,
    ...(overrides.source_runtime_instance_id !== undefined
      ? { source_runtime_instance_id: overrides.source_runtime_instance_id }
      : {}),
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
    ...(overrides.created_at !== undefined ? { created_at: overrides.created_at } : {}),
    ...(overrides.now !== undefined ? { now: overrides.now } : {}),
  };
}

function buildConfirmedInput(proposal, overrides = {}) {
  return {
    source_proposal_id: proposal.proposal_id,
    confirmed_by: overrides.confirmed_by ?? "user-core:imported-context-smoke",
    confirmation_reason:
      overrides.confirmation_reason ??
      "User/Core confirmed mapping before imported context creation.",
    confirmed_at: overrides.confirmed_at,
  };
}

function assertCreateFailsWithoutImport({
  createAgWorkResumeImportedContext,
  input,
  status,
  label,
  fixture,
}) {
  const before = countRows(dbPath, tableName);
  const protectedBefore = snapshotProtectedCounts(dbPath);
  const beforeSnapshot = sideEffectSnapshot(dbPath, fixture);
  const result = createAgWorkResumeImportedContext(input);
  assert.equal(result.ok, false, label);
  assert.equal(result.status, status, label);
  assert.equal(countRows(dbPath, tableName), before, label);
  assertProtectedCounts(dbPath, protectedBefore, label);
  assertSideEffectsUnchanged(dbPath, fixture, beforeSnapshot);
}

function runHelper({ dbPath: helperDbPath, envInput, filePath, flags, stdinInput }) {
  const args = [
    "--tsconfig",
    "tsconfig.json",
    "scripts/ag-work-resume-imported-context-create.mjs",
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
              AG_WORK_RESUME_IMPORTED_CONTEXT_CREATE_INPUT:
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
      links: JSON.stringify({ source: "imported-context-writer-smoke" }),
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
    proposed_by: "user-core:imported-context-smoke",
    proposal_reason:
      overrides.proposal_reason ??
      "User/Core requested a durable proposal for later imported context review.",
    status: "proposed",
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
        title: `Imported context writer fixture ${key}`,
        status: "in_progress",
        priority: "now",
        summary: "Create an imported context writer smoke fixture.",
        next_action: "Create bounded imported review metadata.",
        user_attention_required: false,
        related_state_keys: ["coordination.ag_resume_imported_context"],
        links: {
          docs: ["docs/AG_WORK_RESUME_IMPORTED_CONTEXT_WRITER_V0_1.md"],
        },
        created_at: "2026-06-01T00:00:00.000Z",
        updated_at: "2026-06-01T00:00:00.000Z",
      },
      next_action: "Create bounded imported review metadata.",
      user_attention_required: false,
      recent_events: [],
      related_state_keys: ["coordination.ag_resume_imported_context"],
      related_proof: {
        action_ids: [],
        action_records: [],
        docs: ["docs/AG_WORK_RESUME_IMPORTED_CONTEXT_WRITER_V0_1.md"],
        note: "No local proof is imported by imported context.",
      },
      codex_handoff: {
        task_brief: "Implement imported context writer/helper.",
        constraints: ["No route/UI.", "No proof/evidence.", "No Codex execution."],
        suggested_verification: [
          "npm run smoke:ag-work-resume-imported-context-writer",
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
          notable_state_keys: ["coordination.ag_resume_imported_context"],
        },
        next_recommended_action: {
          related_state_keys: ["coordination.ag_resume_imported_context"],
        },
        codex_handoff: {
          task_brief: "Implement imported context writer/helper.",
          constraints: ["No route/UI.", "No proof/evidence.", "No Codex execution."],
          likely_files: [
            "lib/ag-work-resume-imported-context.ts",
            "scripts/ag-work-resume-imported-context-create.mjs",
          ],
          verification_commands: [
            "npm run smoke:ag-work-resume-imported-context-writer",
          ],
        },
      },
    },
    handoffDraft: {
      handoff_id: `handoff:imported-context-writer-smoke:${key}`,
      status: "ready",
      expected_files: [
        "lib/ag-work-resume-imported-context.ts",
        "scripts/ag-work-resume-imported-context-create.mjs",
      ],
      expected_checks: [
        "npm run smoke:ag-work-resume-imported-context-writer",
      ],
      expected_execution_surfaces: [],
      forbidden_surfaces: ["proof/evidence", "session binding", "Codex execution"],
      stop_conditions: ["Imported context writer output grants downstream authority."],
      safety_boundaries: [
        "Imported context creation is only bounded review metadata.",
      ],
    },
    git: {
      remote: "https://github.com/hynk-studio/augnes.git",
      base_branch: "main",
      base_commit: "0c873b4",
      working_branch: "codex/ag-resume-imported-context-writer",
      head_commit: "imported-context-writer",
      related_pr: null,
      dirty_worktree: false,
    },
    issuer: {
      runtime_instance_id: runtimeInstanceId,
      source_local_label: `source-local-imported-context-${key}`,
      created_by_surface: "imported-context-writer-smoke",
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

function updateMappingStatus(targetDbPath, mappingId, status) {
  const db = new Database(targetDbPath);
  try {
    db.prepare(
      `UPDATE ${mappingTableName} SET status = ?, updated_at = ? WHERE mapping_id = ?`,
    ).run(status, "2026-06-01T00:30:00.000Z", mappingId);
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
      db
        .prepare("SELECT * FROM work_items WHERE scope = ? AND work_id = ?")
        .get(scope, workId) ?? null,
    );
  } finally {
    db.close();
  }
}

function assertImportedAuthorityBoundary(boundary, created) {
  assert.equal(boundary.imported_context_created, created);
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

function omit(value, key) {
  const clone = { ...value };
  delete clone[key];
  return clone;
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
