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
const corePath = path.join(
  rootDir,
  "lib",
  "ag-work-resume-mapping-proposal-lifecycle-action.ts",
);
const writerPath = path.join(
  rootDir,
  "lib",
  "ag-work-resume-mapping-proposal-record.ts",
);
const helperPath = path.join(
  rootDir,
  "scripts",
  "ag-work-resume-mapping-proposal-lifecycle-action.mjs",
);
const smokePath = fileURLToPath(import.meta.url);
const docsPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTION_HELPER_V0_1.md",
);
const lifecycleDesignDocsPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTIONS_DESIGN_V0_1.md",
);
const packagePath = path.join(rootDir, "package.json");
const tableName = "ag_work_resume_mapping_proposals";
const tempDir = mkdtempSync(
  path.join(os.tmpdir(), "augnes-ag-resume-mapping-proposal-lifecycle-action-"),
);
const dbPath = path.join(tempDir, "augnes.db");

process.env.AUGNES_DB_PATH = dbPath;
process.env.OPENAI_API_KEY = "smoke-openai-key-must-not-be-used";

let fetchCalls = 0;
let expectedProposalRowCount = 0;
globalThis.fetch = async () => {
  fetchCalls += 1;
  throw new Error("AG resume mapping proposal lifecycle smoke must not call fetch.");
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
  assertSyntaxGuards();
  resetDb(dbPath);

  const { buildAgWorkResumePacketPreview } = await import(
    "../lib/ag-work-resume-packet.ts"
  );
  const {
    createAgWorkResumeMappingProposalRecord,
  } = await import("../lib/ag-work-resume-mapping-proposal-record.ts");
  const {
    applyAgWorkResumeMappingProposalLifecycleAction,
  } = await import("../lib/ag-work-resume-mapping-proposal-lifecycle-action.ts");

  const createFixture = makeFixtureCreator({
    buildAgWorkResumePacketPreview,
    createAgWorkResumeMappingProposalRecord,
  });

  const protectedBefore = snapshotProtectedCounts(dbPath);

  const withdrawTarget = createFixture("core-withdraw", { status: "proposed" });
  const withdrawResult = assertSuccessfulLifecycle({
    run: () =>
      applyAgWorkResumeMappingProposalLifecycleAction({
        proposal_id: withdrawTarget.proposal_id,
        action: "withdraw",
        reviewed_by: "user-core:reviewer",
        review_note: "Withdraw active proposed proposal.",
        now: "2026-05-31T01:00:00.000Z",
      }),
    action: "withdraw",
    proposalId: withdrawTarget.proposal_id,
    status: "withdrawn",
    reviewedAt: "2026-05-31T01:00:00.000Z",
  });
  assert.equal(withdrawResult.record.review_note, "Withdraw active proposed proposal.");

  const rejectTarget = createFixture("core-reject", { status: "needs_review" });
  const injectedDb = new Database(dbPath);
  try {
    assertSuccessfulLifecycle({
      run: () =>
        applyAgWorkResumeMappingProposalLifecycleAction({
          proposal_id: rejectTarget.proposal_id,
          action: "reject",
          reviewed_by: "user-core:reviewer",
          review_note: "Reject active needs_review proposal.",
          reviewed_at: "2026-05-31T01:01:00.000Z",
          db: injectedDb,
        }),
      action: "reject",
      proposalId: rejectTarget.proposal_id,
      status: "rejected",
      reviewedAt: "2026-05-31T01:01:00.000Z",
    });
  } finally {
    injectedDb.close();
  }

  const expireTarget = createFixture("core-expire", { status: "proposed" });
  assertSuccessfulLifecycle({
    run: () =>
      applyAgWorkResumeMappingProposalLifecycleAction({
        proposal_id: expireTarget.proposal_id,
        action: "expire",
        reviewed_by: "user-core:reviewer",
        review_note: "Expire active proposed proposal explicitly.",
        reviewed_at: "2026-05-31T01:02:00.000Z",
      }),
    action: "expire",
    proposalId: expireTarget.proposal_id,
    status: "expired",
    reviewedAt: "2026-05-31T01:02:00.000Z",
  });

  const supersedeTarget = createFixture("core-supersede-no-replacement", {
    status: "proposed",
  });
  const supersedeNoReplacement = assertSuccessfulLifecycle({
    run: () =>
      applyAgWorkResumeMappingProposalLifecycleAction({
        proposal_id: supersedeTarget.proposal_id,
        action: "supersede",
        reviewed_by: "user-core:reviewer",
        review_note: "Supersede without a replacement id.",
        reviewed_at: "2026-05-31T01:03:00.000Z",
      }),
    action: "supersede",
    proposalId: supersedeTarget.proposal_id,
    status: "superseded",
    reviewedAt: "2026-05-31T01:03:00.000Z",
  });
  assert.equal(supersedeNoReplacement.record.superseded_by_proposal_id, null);
  assert.deepEqual(
    supersedeNoReplacement.updated_fields,
    ["status", "reviewed_by", "reviewed_at", "review_note", "updated_at"],
  );

  const supersedeWithReplacementTarget = createFixture(
    "core-supersede-with-replacement-target",
    { status: "needs_review" },
  );
  const replacement = createFixture("core-supersede-replacement", {
    status: "proposed",
  });
  const replacementBefore = readProposalRow(dbPath, replacement.proposal_id);
  const supersedeWithReplacement = assertSuccessfulLifecycle({
    run: () =>
      applyAgWorkResumeMappingProposalLifecycleAction({
        proposal_id: supersedeWithReplacementTarget.proposal_id,
        action: "supersede",
        reviewed_by: "user-core:reviewer",
        review_note: "Supersede with an existing replacement id.",
        reviewed_at: "2026-05-31T01:04:00.000Z",
        replacement_proposal_id: replacement.proposal_id,
        superseded_by_proposal_id: ` ${replacement.proposal_id} `,
      }),
    action: "supersede",
    proposalId: supersedeWithReplacementTarget.proposal_id,
    status: "superseded",
    reviewedAt: "2026-05-31T01:04:00.000Z",
    supersededByProposalId: replacement.proposal_id,
  });
  assert.equal(
    supersedeWithReplacement.record.superseded_by_proposal_id,
    replacement.proposal_id,
  );
  assert.deepEqual(readProposalRow(dbPath, replacement.proposal_id), replacementBefore);

  const validationTarget = createFixture("core-validation-target", {
    status: "proposed",
  });
  for (const invalidCase of [
    {
      name: "missing proposal_id",
      input: {
        action: "withdraw",
        reviewed_by: "user-core",
        review_note: "Missing proposal_id.",
      },
    },
    {
      name: "unknown action",
      input: {
        proposal_id: validationTarget.proposal_id,
        action: "confirm",
        reviewed_by: "user-core",
        review_note: "Unknown action.",
      },
    },
    {
      name: "missing reviewed_by",
      input: {
        proposal_id: validationTarget.proposal_id,
        action: "withdraw",
        review_note: "Missing reviewed_by.",
      },
    },
    {
      name: "missing review_note",
      input: {
        proposal_id: validationTarget.proposal_id,
        action: "withdraw",
        reviewed_by: "user-core",
      },
    },
    {
      name: "malformed reviewed_at",
      input: {
        proposal_id: validationTarget.proposal_id,
        action: "withdraw",
        reviewed_by: "user-core",
        review_note: "Malformed reviewed_at.",
        reviewed_at: "2026-05-31T01:05:00Z",
      },
    },
    {
      name: "malformed now",
      input: {
        proposal_id: validationTarget.proposal_id,
        action: "withdraw",
        reviewed_by: "user-core",
        review_note: "Malformed now.",
        now: "not-a-date",
      },
    },
    {
      name: "replacement for non-supersede",
      input: {
        proposal_id: validationTarget.proposal_id,
        action: "withdraw",
        reviewed_by: "user-core",
        review_note: "Replacement not allowed.",
        replacement_proposal_id: replacement.proposal_id,
      },
    },
    {
      name: "replacement same as proposal",
      input: {
        proposal_id: validationTarget.proposal_id,
        action: "supersede",
        reviewed_by: "user-core",
        review_note: "Same replacement id.",
        replacement_proposal_id: validationTarget.proposal_id,
      },
    },
    {
      name: "mismatched replacement ids",
      input: {
        proposal_id: validationTarget.proposal_id,
        action: "supersede",
        reviewed_by: "user-core",
        review_note: "Mismatched replacement ids.",
        replacement_proposal_id: replacement.proposal_id,
        superseded_by_proposal_id: "ag-resume-mapping-proposal:other",
      },
    },
    {
      name: "unknown field",
      input: {
        proposal_id: validationTarget.proposal_id,
        action: "withdraw",
        reviewed_by: "user-core",
        review_note: "Unknown field.",
        confirm_mapping: true,
      },
    },
  ]) {
    assertFailureNoWrite({
      name: invalidCase.name,
      run: () =>
        applyAgWorkResumeMappingProposalLifecycleAction(invalidCase.input),
      expectedStatus: "invalid_input",
    });
  }

  assertFailureNoWrite({
    name: "supersede replacement id not found",
    run: () =>
      applyAgWorkResumeMappingProposalLifecycleAction({
        proposal_id: validationTarget.proposal_id,
        action: "supersede",
        reviewed_by: "user-core",
        review_note: "Replacement id not found.",
        replacement_proposal_id: "ag-resume-mapping-proposal:not-found",
        reviewed_at: "2026-05-31T01:05:00.000Z",
      }),
    expectedStatus: "replacement_not_found",
  });

  assertFailureNoWrite({
    name: "target proposal_id not found",
    run: () =>
      applyAgWorkResumeMappingProposalLifecycleAction({
        proposal_id: "ag-resume-mapping-proposal:not-found",
        action: "withdraw",
        reviewed_by: "user-core",
        review_note: "Target id not found.",
        reviewed_at: "2026-05-31T01:06:00.000Z",
      }),
    expectedStatus: "not_found",
  });

  for (const inactiveRecord of [
    withdrawResult.record,
    readProposalRow(dbPath, rejectTarget.proposal_id),
    readProposalRow(dbPath, expireTarget.proposal_id),
    supersedeNoReplacement.record,
  ]) {
    assertFailureNoWrite({
      name: `inactive ${inactiveRecord.status}`,
      run: () =>
        applyAgWorkResumeMappingProposalLifecycleAction({
          proposal_id: inactiveRecord.proposal_id,
          action: "withdraw",
          reviewed_by: "user-core",
          review_note: "Inactive proposal should not update again.",
          reviewed_at: "2026-05-31T01:07:00.000Z",
        }),
      expectedStatus: "not_active",
    });
  }

  const helperEnvTarget = createFixture("helper-env", { status: "proposed" });
  const helperEnv = runHelper({
    dbPath,
    envInput: {
      proposal_id: helperEnvTarget.proposal_id,
      action: "withdraw",
      reviewed_by: "user-core:helper",
      review_note: "Helper env withdraw.",
      reviewed_at: "2026-05-31T02:00:00.000Z",
    },
  });
  assert.equal(helperEnv.status, 0);
  assert.equal(helperEnv.json.ok, true);
  assert.equal(helperEnv.json.input_mode, "env");
  assert.equal(
    readProposalRow(dbPath, helperEnvTarget.proposal_id).status,
    "withdrawn",
  );

  const helperFileTarget = createFixture("helper-file", { status: "needs_review" });
  const helperFileInputPath = path.join(tempDir, "helper-file-input.json");
  writeFileSync(
    helperFileInputPath,
    JSON.stringify({
      proposal_id: helperFileTarget.proposal_id,
      action: "reject",
      reviewed_by: "user-core:helper",
      review_note: "Helper file reject.",
      reviewed_at: "2026-05-31T02:01:00.000Z",
    }),
  );
  const helperFile = runHelper({ dbPath, filePath: helperFileInputPath });
  assert.equal(helperFile.status, 0);
  assert.equal(helperFile.json.ok, true);
  assert.equal(helperFile.json.input_mode, "file");
  assert.equal(readProposalRow(dbPath, helperFileTarget.proposal_id).status, "rejected");

  const helperFlagsTarget = createFixture("helper-flags", { status: "proposed" });
  const helperFlags = runHelper({
    dbPath,
    flags: [
      "--proposal-id",
      helperFlagsTarget.proposal_id,
      "--action",
      "expire",
      "--reviewed-by",
      "user-core:helper",
      "--review-note",
      "Helper flags expire.",
      "--reviewed-at",
      "2026-05-31T02:02:00.000Z",
    ],
  });
  assert.equal(helperFlags.status, 0);
  assert.equal(helperFlags.json.ok, true);
  assert.equal(helperFlags.json.input_mode, "flags");
  assert.equal(readProposalRow(dbPath, helperFlagsTarget.proposal_id).status, "expired");

  const helperStdinTarget = createFixture("helper-stdin", { status: "proposed" });
  const helperStdin = runHelper({
    dbPath,
    stdinInput: {
      proposal_id: helperStdinTarget.proposal_id,
      action: "supersede",
      reviewed_by: "user-core:helper",
      review_note: "Helper stdin supersede.",
      reviewed_at: "2026-05-31T02:03:00.000Z",
    },
  });
  assert.equal(helperStdin.status, 0);
  assert.equal(helperStdin.json.ok, true);
  assert.equal(helperStdin.json.input_mode, "stdin");
  assert.equal(
    readProposalRow(dbPath, helperStdinTarget.proposal_id).status,
    "superseded",
  );

  const helperInvalidTarget = createFixture("helper-invalid", { status: "proposed" });
  const invalidBefore = snapshotProposalRows(dbPath);
  const helperInvalid = runHelper({
    dbPath,
    envInput: {
      proposal_id: helperInvalidTarget.proposal_id,
      action: "withdraw",
      review_note: "Missing reviewed_by should fail.",
    },
  });
  assert.notEqual(helperInvalid.status, 0);
  assert.equal(helperInvalid.json.ok, false);
  assert.equal(helperInvalid.json.result.status, "invalid_input");
  assert.equal(snapshotProposalRows(dbPath), invalidBefore);

  assertProtectedCounts(dbPath, protectedBefore);
  assertNoForbiddenTablesOrRows(dbPath);
  assert.equal(fetchCalls, 0);

  console.log(
    JSON.stringify(
      {
        smoke: "ag-work-resume-mapping-proposal-lifecycle-action",
        temp_db_path: dbPath,
        cases: [
          "package scripts are present",
          "core/helper source guards pass",
          "docs and pointer guards pass",
          "syntax guards pass for helper and smoke",
          "writer-created fixture rows seed lifecycle tests",
          "core withdraw active proposed proposal succeeds",
          "core reject active needs_review proposal succeeds",
          "core expire active proposed proposal succeeds",
          "core supersede active proposal without replacement id succeeds",
          "core supersede active proposal with existing replacement id updates only target row",
          "core invalid input and not-found cases fail closed with no write",
          "core not_active cases for terminal statuses fail closed with no write",
          "helper env/file/flags/stdin successes exit zero",
          "helper invalid input exits non-zero with no write",
          "proposal row count remains unchanged by lifecycle actions",
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
    corePath,
    writerPath,
    helperPath,
    smokePath,
    docsPath,
    lifecycleDesignDocsPath,
    packagePath,
  ]) {
    assert.ok(existsSync(file), `${file} must exist`);
  }
}

function assertPackageScripts() {
  const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
  assert.equal(
    packageJson.scripts?.["ag:resume-mapping-proposal-lifecycle-action"],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/ag-work-resume-mapping-proposal-lifecycle-action.mjs",
  );
  assert.equal(
    packageJson.scripts?.["smoke:ag-work-resume-mapping-proposal-lifecycle-action"],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-ag-work-resume-mapping-proposal-lifecycle-action.mjs",
  );
}

function assertSourceGuards() {
  const sources = {
    core: readFileSync(corePath, "utf8"),
    helper: readFileSync(helperPath, "utf8"),
  };
  for (const [label, source] of Object.entries(sources)) {
    const importText = extractImportText(source);
    for (const forbidden of [
      /node:http/i,
      /node:https/i,
      /node:net/i,
      /node:tls/i,
      /app\/api/i,
      /components\//i,
      /apps\/augnes_apps/i,
    ]) {
      assert.doesNotMatch(importText, forbidden, `${label} must not import ${forbidden}`);
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
      /\bDELETE\b/i,
      /\bDROP\b/i,
    ]) {
      assert.doesNotMatch(source, forbidden, `${label} must not contain ${forbidden}`);
    }
  }

  const changedFiles = gitChangedFiles();
  const allowedFiles = new Set([
    "lib/ag-work-resume-mapping-proposal-lifecycle-action.ts",
    "app/api/ag-work-resume/mapping-proposal-records/lifecycle-actions/route.ts",
    "scripts/ag-work-resume-mapping-proposal-lifecycle-action.mjs",
    "scripts/smoke-ag-work-resume-mapping-proposal-lifecycle-action.mjs",
    "scripts/smoke-ag-work-resume-mapping-proposal-lifecycle-actions-design.mjs",
    "scripts/smoke-ag-work-resume-mapping-proposal-lifecycle-action-route.mjs",
    "scripts/smoke-ag-work-resume-mapping-proposal-lifecycle-action-cockpit-panel.mjs",
    "components/augnes-cockpit.tsx",
    "docs/AG_WORK_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTION_HELPER_V0_1.md",
    "docs/AG_WORK_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTION_ROUTE_V0_1.md",
    "docs/AG_WORK_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTIONS_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTION_COCKPIT_PANEL_V0_1.md",
    "docs/AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_WRITER_V0_1.md",
    "docs/AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_READ_V0_1.md",
    "docs/AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_READ_COCKPIT_PANEL_V0_1.md",
    "docs/AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md",
    "reports/browser/2026-05-31-ag-work-resume-mapping-proposal-lifecycle-action-cockpit-panel-verification.md",
    "package.json",
  ]);
  const forbiddenFiles = changedFiles.filter(
    (file) =>
      !allowedFiles.has(file) ||
      (file.startsWith("app/") &&
        file !==
          "app/api/ag-work-resume/mapping-proposal-records/lifecycle-actions/route.ts") ||
      (file.startsWith("components/") && !allowedFiles.has(file)) ||
      file.startsWith("migrations/") ||
      file === "lib/db/schema.sql" ||
      file.startsWith("apps/") ||
      (file.startsWith("reports/browser/") && !allowedFiles.has(file)),
  );
  assert.deepEqual(
    forbiddenFiles,
    [],
    "changed files must stay inside lifecycle core/helper docs/scripts/package scope",
  );
}

function assertDocsGuard() {
  const docs = readFileSync(docsPath, "utf8");
  for (const pattern of [
    /Purpose/i,
    /Relationship To PR #303 Lifecycle Design/i,
    /Core API/i,
    /Helper Usage/i,
    /Input Examples/i,
    /Output Shape/i,
    /Status And Exit Codes/i,
    /Validation Rules/i,
    /DB Behavior/i,
    /Supersede Limitations/i,
    /Authority Boundary/i,
    /Non-Goals/i,
    /Verification/i,
    /Browser Verification/i,
    /AG_WORK_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTION_ROUTE_V0_1\.md/i,
    /updates existing proposal lifecycle and review metadata only/i,
    /does not create replacement proposal rows/i,
    /does not update replacement proposal rows/i,
    /does not implement same-tuple transactional replacement/i,
    /does not confirm mappings/i,
    /does not import context/i,
    /does not record proof\/evidence/i,
    /does not bind sessions/i,
    /does not execute Codex/i,
    /adds no app\/api route, no Cockpit UI, no DB schema, no migration/is,
    /browser verification skipped: no rendered UI\/operator surface changed in this lifecycle core\/helper slice/i,
  ]) {
    assert.match(docs, pattern, `helper docs must include ${pattern}`);
  }

  for (const pointerPath of [
    lifecycleDesignDocsPath,
    path.join(rootDir, "docs", "AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_WRITER_V0_1.md"),
    path.join(rootDir, "docs", "AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_READ_V0_1.md"),
    path.join(
      rootDir,
      "docs",
      "AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_READ_COCKPIT_PANEL_V0_1.md",
    ),
    path.join(rootDir, "docs", "AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md"),
  ]) {
    const source = readFileSync(pointerPath, "utf8");
    assert.match(
      source,
      /AG_WORK_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTION_HELPER_V0_1\.md/,
      `${path.relative(rootDir, pointerPath)} must point to helper docs`,
    );
  }
}

function assertSyntaxGuards() {
  for (const file of [helperPath, smokePath]) {
    const result = spawnSync("node", ["--check", file], {
      cwd: rootDir,
      encoding: "utf8",
    });
    assert.equal(
      result.status,
      0,
      `node --check ${path.relative(rootDir, file)} must pass\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`,
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

function makeFixtureCreator({
  buildAgWorkResumePacketPreview,
  createAgWorkResumeMappingProposalRecord,
}) {
  let index = 0;
  return function createFixture(label, overrides = {}) {
    index += 1;
    const suffix = String(index).padStart(3, "0");
    const packet = buildAgWorkResumePacketPreview(
      buildFixtureInput(`AG-MAPPING-LIFECYCLE-${suffix}`),
    );
    const candidate = buildCandidateFromPacket(packet, {
      candidate_id: `candidate:lifecycle-${label}-${suffix}`,
      local_work_id: `AG-MAPPING-LIFECYCLE-LOCAL-${suffix}`,
    });
    const result = createAgWorkResumeMappingProposalRecord(
      buildCreateInput(packet, candidate, {
        proposal_reason: `User/Core requested lifecycle smoke proposal ${label}.`,
        status: overrides.status ?? "proposed",
      }),
    );
    assert.equal(result.ok, true, `fixture ${label} must be created`);
    assert.equal(result.status, "created", `fixture ${label} must be created`);
    expectedProposalRowCount += 1;
    assert.equal(countRows(dbPath, tableName), expectedProposalRowCount);
    return result.record;
  };
}

function buildCreateInput(packet, candidate, overrides = {}) {
  return {
    packet,
    candidates: [candidate],
    selected_candidate_id: candidate.candidate_id,
    proposed_by: overrides.proposed_by ?? "user-core",
    proposal_reason:
      overrides.proposal_reason ??
      "User/Core requested a durable proposal for later review.",
    status: overrides.status ?? "proposed",
    expires_at: null,
    source: {
      reviewed_by_surface: "lifecycle-smoke",
      reviewed_at: "2026-05-31T00:00:00.000Z",
    },
  };
}

function assertSuccessfulLifecycle({
  run,
  action,
  proposalId,
  status,
  reviewedAt,
  supersededByProposalId = null,
}) {
  const beforeCount = countRows(dbPath, tableName);
  const beforeRaw = readProposalRow(dbPath, proposalId);
  const result = run();
  assert.equal(result.ok, true, `${action} must succeed`);
  assert.equal(result.status, "updated", `${action} must update`);
  assert.equal(result.action, action);
  assert.equal(result.proposal_id, proposalId);
  assert.equal(result.before_record.proposal_id, proposalId);
  assert.equal(result.record.proposal_id, proposalId);
  assert.equal(result.record.status, status);
  assert.equal(result.record.reviewed_by, "user-core:reviewer");
  assert.equal(result.record.reviewed_at, reviewedAt);
  assert.equal(result.record.updated_at, reviewedAt);
  assert.equal(result.record.superseded_by_proposal_id, supersededByProposalId);
  assertLifecycleBoundary(result.authority_boundary, true);
  const afterRaw = readProposalRow(dbPath, proposalId);
  const allowed = new Set(result.updated_fields);
  assertOnlyAllowedFieldsChanged(beforeRaw, afterRaw, allowed);
  assert.equal(countRows(dbPath, tableName), beforeCount);
  assert.equal(countRows(dbPath, tableName), expectedProposalRowCount);
  return result;
}

function assertFailureNoWrite({ name, run, expectedStatus }) {
  const before = snapshotProposalRows(dbPath);
  const beforeCount = countRows(dbPath, tableName);
  const result = run();
  assert.equal(result.ok, false, name);
  assert.equal(result.status, expectedStatus, name);
  assertLifecycleBoundary(result.authority_boundary, false);
  assert.deepEqual(result.updated_fields, [], `${name} must not update fields`);
  assert.equal(snapshotProposalRows(dbPath), before, `${name} must not write`);
  assert.equal(countRows(dbPath, tableName), beforeCount, `${name} must not change row count`);
  return result;
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

function runHelper({ dbPath: helperDbPath, envInput, filePath, flags, stdinInput }) {
  const args = [
    "--tsconfig",
    "tsconfig.json",
    "scripts/ag-work-resume-mapping-proposal-lifecycle-action.mjs",
    "--json",
  ];
  if (filePath) {
    args.push("--file", filePath);
  }
  if (flags) {
    args.push(...flags);
  }
  const result = spawnSync("./apps/augnes_apps/node_modules/.bin/tsx", args, {
    cwd: rootDir,
    env: {
      ...process.env,
      AUGNES_DB_PATH: helperDbPath,
      ...(envInput
        ? {
            AG_WORK_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTION_INPUT:
              JSON.stringify(envInput),
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
        title: "Apply AG resume mapping proposal lifecycle action",
        status: "in_progress",
        priority: "now",
        summary: "Update proposal lifecycle review metadata.",
        next_action: "Apply a bounded lifecycle action after user/Core review.",
        user_attention_required: false,
        related_state_keys: ["coordination.ag_resume_mapping"],
        links: {
          docs: [
            "docs/AG_WORK_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTION_HELPER_V0_1.md",
          ],
        },
        created_at: "2026-05-31T00:00:00.000Z",
        updated_at: "2026-05-31T00:00:00.000Z",
      },
      next_action: "Apply a bounded lifecycle action after user/Core review.",
      user_attention_required: false,
      recent_events: [
        {
          id: `work-event:${workId}`,
          work_id: workId,
          scope,
          actor: "codex",
          event_type: "implementation",
          summary: "Prepared lifecycle action smoke fixture.",
          result_status: "completed",
          result_kind: "verification",
          related_action_id: "action:proof-only-1",
          related_pr: "https://github.com/hynk-studio/augnes/pull/303",
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
          "docs/AG_WORK_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTION_HELPER_V0_1.md",
        ],
        note: "Action records with state_key:null are proof-only.",
      },
      codex_handoff: {
        task_brief: "Implement proposal lifecycle action helper.",
        constraints: ["No route.", "No UI.", "No confirmed mapping.", "No import."],
        suggested_verification: [
          "npm run smoke:ag-work-resume-mapping-proposal-lifecycle-action",
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
          task_brief: "Implement proposal lifecycle action helper.",
          constraints: ["No route.", "No UI.", "No confirmed mapping.", "No import."],
          likely_files: [
            "lib/ag-work-resume-mapping-proposal-lifecycle-action.ts",
            "scripts/ag-work-resume-mapping-proposal-lifecycle-action.mjs",
          ],
          verification_commands: [
            "npm run smoke:ag-work-resume-mapping-proposal-lifecycle-action",
          ],
        },
      },
    },
    handoffDraft: {
      handoff_id: `handoff:${workId}`,
      status: "ready",
      expected_files: [
        "lib/ag-work-resume-mapping-proposal-lifecycle-action.ts",
        "scripts/ag-work-resume-mapping-proposal-lifecycle-action.mjs",
      ],
      expected_checks: [
        "npm run smoke:ag-work-resume-mapping-proposal-lifecycle-action",
      ],
      expected_execution_surfaces: [],
      forbidden_surfaces: ["confirmed mapping", "import", "Codex execution"],
      stop_conditions: ["Mapping/import authority appears in lifecycle output."],
      safety_boundaries: ["Lifecycle action is proposal review metadata only."],
    },
    git: {
      remote: "https://github.com/hynk-studio/augnes.git",
      base_branch: "main",
      base_commit: "06f8115",
      working_branch:
        "codex/ag-resume-mapping-proposal-lifecycle-action-helper",
      head_commit: "lifecycle-action-helper",
      related_pr: null,
      dirty_worktree: false,
    },
    issuer: {
      runtime_instance_id: "runtime-instance:mapping-proposal-lifecycle-smoke",
      source_local_label: "source-local-mapping-proposal-lifecycle-smoke",
      created_by_surface: "lifecycle-action-smoke",
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
