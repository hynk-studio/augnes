import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const smokePath = fileURLToPath(import.meta.url);
const smokeRelativePath =
  "scripts/smoke-ag-work-resume-proof-evidence-session-codex-gates-design.mjs";
const reconciliationSmokeRelativePath =
  "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-design.mjs";
const candidateSchemaSmokeRelativePath =
  "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-db-schema-design.mjs";
const candidateSchemaImplementationSmokeRelativePath =
  "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-db-schema.mjs";
const candidateWriterSmokeRelativePath =
  "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-writer.mjs";
const candidateWriterHelperRelativePath =
  "scripts/ag-work-resume-proof-evidence-reconciliation-candidate-create.mjs";
const schemaRelativePath = "lib/db/schema.sql";
const candidateWriterCoreRelativePath =
  "lib/ag-work-resume-proof-evidence-reconciliation-candidate.ts";
const designDocRelativePath =
  "docs/AG_WORK_RESUME_PROOF_EVIDENCE_SESSION_CODEX_GATES_DESIGN_V0_1.md";
const reconciliationDesignDocRelativePath =
  "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_DESIGN_V0_1.md";
const candidateSchemaDesignDocRelativePath =
  "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_DB_SCHEMA_DESIGN_V0_1.md";
const candidateSchemaImplementationDocRelativePath =
  "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_DB_SCHEMA_IMPLEMENTATION_V0_1.md";
const candidateWriterDocRelativePath =
  "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_WRITER_V0_1.md";
const designDocPath = path.join(rootDir, designDocRelativePath);
const packagePath = path.join(rootDir, "package.json");
const pointerDocRelativePaths = [
  "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_CREATE_COCKPIT_PANEL_V0_1.md",
  "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_READ_COCKPIT_PANEL_V0_1.md",
  "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_READ_V0_1.md",
  "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_ROUTE_V0_1.md",
  "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_WRITER_V0_1.md",
  "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_RECORD_DESIGN_V0_1.md",
  "docs/AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md",
];

for (const file of [
  smokePath,
  designDocPath,
  packagePath,
  path.join(rootDir, schemaRelativePath),
  path.join(rootDir, candidateWriterCoreRelativePath),
  path.join(rootDir, candidateWriterHelperRelativePath),
  path.join(rootDir, candidateWriterSmokeRelativePath),
  path.join(rootDir, candidateWriterDocRelativePath),
  path.join(rootDir, candidateSchemaImplementationDocRelativePath),
  path.join(rootDir, candidateSchemaImplementationSmokeRelativePath),
  ...pointerDocRelativePaths.map((relativePath) => path.join(rootDir, relativePath)),
]) {
  assert.ok(existsSync(file), `${file} must exist`);
}

const smokeSource = readFileSync(smokePath, "utf8");
assertNoForbiddenSmokeImports(smokeSource);

const designDoc = readFileSync(designDocPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

assert.equal(
  packageJson.scripts?.["smoke:ag-work-resume-proof-evidence-session-codex-gates-design"],
  "node scripts/smoke-ag-work-resume-proof-evidence-session-codex-gates-design.mjs",
  "package.json must expose proof/evidence/session/Codex gates design smoke",
);

const statusSection = extractSection(designDoc, "Status");
for (const pattern of [
  /design-only/i,
  /adds no runtime behavior/i,
  /adds no schema or migration/i,
  /adds no writer, helper, route, or UI/i,
  /creates no proof\/evidence records/i,
  /no session records or session bindings/i,
  /no Codex records or actions/i,
  /no work\s+items/is,
  /no work\s+events/is,
  /no proof\/evidence writer/i,
  /no session binder/i,
  /no Codex\s+continuation route\/helper\/UI/is,
  /no app\/api changes/i,
  /no components changes/i,
  /no lib runtime changes/i,
  /no ChatGPT App\/MCP\/App schema changes/i,
  /no bridge tools/i,
  /no Direct Resume Code/i,
  /no relay/i,
  /no telemetry\/analytics\/browser persistence/i,
  /no browser report/i,
  /grants no approval, publish, retry, replay, merge/i,
  /Durable approval\s+remains user\/Core gated/is,
]) {
  assert.match(statusSection, pattern, `status section must include ${pattern}`);
}

const purposeSection = extractSection(designDoc, "Purpose");
for (const pattern of [
  /Imported context is bounded review metadata/i,
  /validated AG Resume\s+packet/is,
  /existing active confirmed mapping/i,
  /must remain review metadata until separately\s+gated/is,
  /foreign\s+refs and foreign history/is,
  /not local Augnes proof, evidence, sessions,\s+work events, committed state, or Codex authority/is,
  /does not mean proof\/evidence was\s+reconciled/is,
  /a session was bound/i,
  /Codex may continue/i,
  /durable approval was\s+granted/is,
  /Proof\/evidence reconciliation, session binding, and Codex continuation are\s+distinct future gates/is,
  /No gate\s+implies the next gate/is,
  /Approval, publish, retry, replay, and merge remain\s+separate/is,
  /Durable approval remains user\/Core gated/i,
]) {
  assert.match(purposeSection, pattern, `purpose section must include ${pattern}`);
}

const definitionsSection = extractSection(designDoc, "Definitions");
for (const pattern of [
  /imported context review metadata.*Stage D/is,
  /proof record.*separately authorized proof path/is,
  /evidence record.*separately authorized evidence path/is,
  /session binding.*known local work\s+identity.*known existing session identity/is,
  /Codex continuation.*future authorized Codex work/is,
  /codex:read-brief.*check-only Codex helper/is,
  /user\/Core approval.*explicit human\/Core-gated authorization/is,
  /committed state authority.*durable accepted project\s+state transitions/is,
  /merge\/publish\/retry\/replay authority.*Imported context review metadata has none/is,
]) {
  assert.match(definitionsSection, pattern, `definitions section must include ${pattern}`);
}

const gateModelSection = extractSection(designDoc, "Gate Model");
for (const pattern of [
  /Gate A: Imported Context Review Complete/i,
  /Gate B: Proof\/Evidence Reconciliation Design And Explicit Authorization/i,
  /Gate C: Session Binding Design And Explicit Authorization/i,
  /Gate D: Codex Continuation After Fresh codex:read-brief/i,
  /Gate E: Approval\/Publish\/Retry\/Replay\/Merge Remains Separate/i,
  /Gate A completion is not proof\/evidence reconciliation/i,
  /Proof\/evidence reconciliation must be designed and authorized separately/i,
  /Imported context does not automatically record\s+proof\/evidence/is,
  /Session binding must be designed and authorized separately/i,
  /Imported context does not automatically bind\s+sessions/is,
  /requires a fresh `codex:read-brief` result/i,
  /Imported context and Cockpit UI\s+do not automatically execute or continue Codex/is,
  /Those actions remain separately user\/Core gated/i,
  /Merge remains outside Codex\s+authority/is,
]) {
  assert.match(gateModelSection, pattern, `gate model must include ${pattern}`);
}

const proofEvidenceSection = extractSection(
  designDoc,
  "Required Future Checks Before Proof/Evidence",
);
for (const pattern of [
  /imported context row exists/i,
  /status is `review_metadata`/i,
  /approved future status\s+only if separately designed/is,
  /redaction report is safe/i,
  /foreign refs remain foreign/i,
  /user\/Core actor is required/i,
  /user\/Core reason is required/i,
  /no automatic proof\/evidence recording from imported context/i,
]) {
  assert.match(proofEvidenceSection, pattern, `proof/evidence checks must include ${pattern}`);
}

const sessionSection = extractSection(
  designDoc,
  "Required Future Checks Before Session Binding",
);
for (const pattern of [
  /local work identity is confirmed/i,
  /session identity is explicit/i,
  /user\/Core actor is required/i,
  /user\/Core reason is required/i,
  /no automatic session binding from imported context/i,
]) {
  assert.match(sessionSection, pattern, `session checks must include ${pattern}`);
}

const codexSection = extractSection(
  designDoc,
  "Required Future Checks Before Codex Continuation",
);
for (const pattern of [
  /confirmed mapping exists/i,
  /imported context was reviewed/i,
  /fresh `codex:read-brief` succeeds/i,
  /expected files\/checks were reviewed/i,
  /stop conditions are defined/i,
  /`CODEX_WORK_ID` is present if required/i,
  /`CODEX_SESSION_ID` is present if required/i,
  /no automatic Codex execution from imported context or UI/i,
]) {
  assert.match(codexSection, pattern, `Codex checks must include ${pattern}`);
}

const authoritySection = extractSection(designDoc, "Authority Boundary");
for (const pattern of [
  /no proof\/evidence recording/i,
  /no session binding/i,
  /no Codex execution or continuation/i,
  /no work item creation/i,
  /no work event creation/i,
  /no confirmed mapping mutation/i,
  /no proposal mutation/i,
  /no approval, publish, retry, replay, merge/i,
  /no Direct Resume Code/i,
  /no relay/i,
  /no committed state authority/i,
  /Durable approval remains user\/Core gated/i,
  /Imported context review metadata is\s+not proof\/evidence, not session binding, not Codex/is,
]) {
  assert.match(authoritySection, pattern, `authority section must include ${pattern}`);
}

const nonGoalsSection = extractSection(designDoc, "Non-Goals");
for (const pattern of [
  /No schema or migration/i,
  /No writer, helper, route, or UI/i,
  /No proof\/evidence writer/i,
  /No proof\/evidence reconciliation implementation/i,
  /No session binder/i,
  /No session binding implementation/i,
  /No Codex continuation route\/helper\/UI/i,
  /No Codex continuation implementation/i,
  /No app\/api changes/i,
  /No components changes/i,
  /No lib runtime changes/i,
  /No ChatGPT App, MCP\/App schema, or bridge tool changes/i,
  /No Direct Resume Code/i,
  /No relay/i,
  /No telemetry, analytics, localStorage, sessionStorage, indexedDB, or browser\s+persistence/is,
  /No browser report/i,
  /No approval, publish, retry, replay, merge/i,
]) {
  assert.match(nonGoalsSection, pattern, `non-goals must include ${pattern}`);
}

const futureSection = extractSection(designDoc, "Future PR Sequence");
for (const pattern of [
  /Proof\/evidence\/session\/Codex gate design only: this PR/i,
  /Proof\/evidence schema\/design or integration design, separately approved/i,
  /Session binding design, separately approved/i,
  /Codex continuation design, separately approved/i,
  /Runtime implementations only after separate user\/Core approval/i,
  /actor and reason\s+requirements/is,
]) {
  assert.match(futureSection, pattern, `future sequence must include ${pattern}`);
}

const browserSection = extractSection(designDoc, "Browser Verification");
assert.match(
  browserSection,
  /browser verification skipped: no rendered UI\/operator surface changed in this design-only proof\/evidence\/session\/Codex gate slice/,
  "browser verification skip reason must match",
);

const verificationSection = extractSection(designDoc, "Verification");
for (const command of [
  "npm run typecheck",
  "npm run smoke:ag-work-resume-proof-evidence-session-codex-gates-design",
  "npm run smoke:ag-work-resume-imported-context-create-cockpit-panel",
  "npm run smoke:ag-work-resume-imported-context-read-cockpit-panel",
  "npm run smoke:ag-work-resume-imported-context-read",
  "npm run smoke:ag-work-resume-imported-context-route",
  "npm run smoke:ag-work-resume-imported-context-writer",
  "npm run smoke:ag-work-resume-mapping-import-authority-gate",
  "git diff --check",
  "git diff --cached --check",
  "node --check scripts/smoke-ag-work-resume-proof-evidence-session-codex-gates-design.mjs",
]) {
  assert.match(
    verificationSection,
    new RegExp(escapeRegExp(command)),
    `verification section must include ${command}`,
  );
}

for (const relativePath of pointerDocRelativePaths) {
  const source = readFileSync(path.join(rootDir, relativePath), "utf8");
  assert.match(
    source,
    /AG_WORK_RESUME_PROOF_EVIDENCE_SESSION_CODEX_GATES_DESIGN_V0_1\.md/,
    `${relativePath} must point to the gate design doc`,
  );
}

assertNoUnexpectedChangedFiles();
assertNoForbiddenImplementationCode();

console.log(
  JSON.stringify(
    {
      smoke: "ag-work-resume-proof-evidence-session-codex-gates-design",
      cases: [
        "design doc exists",
        "package script exists",
        "doc says design-only with no runtime/schema/writer/helper/route/UI",
        "doc defines proof/evidence/session/Codex gates separately",
        "doc says imported context does not automatically record proof/evidence, bind session, or execute Codex",
        "doc requires fresh codex:read-brief before future Codex continuation",
        "doc requires user/Core actor and reason for future gates",
        "doc keeps approval/publish/retry/replay/merge separate",
        "related docs point to gate design doc",
        "changed files are limited to docs, package.json, schema foundation, candidate writer/helper, route, and design-smoke compatibility",
        "no app/components/runtime/migration/apps/browser report files changed",
        "no runtime implementation code changed for proof/evidence/session/Codex behavior outside schema.sql",
      ],
    },
    null,
    2,
  ),
);

function assertNoUnexpectedChangedFiles() {
  const changedFiles = gitChangedFiles();
  const allowedFiles = new Set([
    designDocRelativePath,
    reconciliationDesignDocRelativePath,
    candidateSchemaDesignDocRelativePath,
    candidateSchemaImplementationDocRelativePath,
    candidateWriterDocRelativePath,
    smokeRelativePath,
    reconciliationSmokeRelativePath,
    candidateSchemaSmokeRelativePath,
    candidateSchemaImplementationSmokeRelativePath,
    candidateWriterSmokeRelativePath,
    candidateWriterHelperRelativePath,
    "scripts/smoke-ag-work-resume-imported-context-route.mjs",
    "scripts/smoke-ag-work-resume-imported-context-writer.mjs",
    "app/api/ag-work-resume/proof-evidence-reconciliation-candidates/route.ts",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_ROUTE_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_READ_V0_1.md",
    "lib/ag-work-resume-proof-evidence-reconciliation-candidate-read.ts",
    "scripts/ag-work-resume-proof-evidence-reconciliation-candidate-read.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-read.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-route.mjs",
    "components/augnes-cockpit.tsx",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_CREATE_COCKPIT_PANEL_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_READ_COCKPIT_PANEL_V0_1.md",
    "reports/browser/2026-06-01-ag-work-resume-proof-evidence-reconciliation-candidate-create-cockpit-panel-verification.md",
    "reports/browser/2026-06-01-ag-work-resume-proof-evidence-reconciliation-candidate-read-cockpit-panel-verification.md",
    "reports/browser/2026-06-01-ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-verification.md",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-create-cockpit-panel.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-read-cockpit-panel.mjs",
    "app/api/ag-work-resume/proof-evidence-reconciliation-candidates/lifecycle-actions/route.ts",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_LIFECYCLE_ACTIONS_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_LIFECYCLE_ACTION_COCKPIT_PANEL_V0_1.md",
    "lib/ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action.ts",
    "scripts/ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action-route.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action-cockpit-panel.mjs",
    schemaRelativePath,
    candidateWriterCoreRelativePath,
    "package.json",
    ...pointerDocRelativePaths,
  ]);
  const forbiddenPrefixes = [
    "app/",
    "components/",
    "lib/",
    "migrations/",
    "apps/",
    "reports/browser/",
  ];

  for (const file of changedFiles) {
    assert.ok(
      allowedFiles.has(file),
      `changed file is outside the design-only gate slice: ${file}`,
    );
    assert.equal(
      file !== schemaRelativePath &&
        file !== candidateWriterCoreRelativePath &&
        file !== "lib/ag-work-resume-proof-evidence-reconciliation-candidate-read.ts" &&
        file !== "lib/ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action.ts" &&
        file !==
          "app/api/ag-work-resume/proof-evidence-reconciliation-candidates/route.ts" &&
        file !==
          "app/api/ag-work-resume/proof-evidence-reconciliation-candidates/lifecycle-actions/route.ts" &&
        file !== "components/augnes-cockpit.tsx" &&
        file !==
          "reports/browser/2026-06-01-ag-work-resume-proof-evidence-reconciliation-candidate-read-cockpit-panel-verification.md" &&
        file !==
          "reports/browser/2026-06-01-ag-work-resume-proof-evidence-reconciliation-candidate-create-cockpit-panel-verification.md" &&
        file !==
          "reports/browser/2026-06-01-ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-verification.md" &&
        forbiddenPrefixes.some((prefix) => file.startsWith(prefix)),
      false,
      `gate follow-up must not touch runtime/UI/app/browser files: ${file}`,
    );
    assert.ok(
      file === schemaRelativePath ||
        file === candidateWriterCoreRelativePath ||
        file === "lib/ag-work-resume-proof-evidence-reconciliation-candidate-read.ts" ||
        file === "lib/ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action.ts" ||
        !file.startsWith("lib/"),
      `lib changes are limited to ${schemaRelativePath} or candidate writer/read core: ${file}`,
    );
  }
}

function assertNoForbiddenImplementationCode() {
  const implementationFiles = gitChangedFiles().filter(
    (file) =>
      !file.startsWith("docs/") &&
      file !== "package.json" &&
      file !== schemaRelativePath &&
      file !== candidateWriterCoreRelativePath &&
      file !== "lib/ag-work-resume-proof-evidence-reconciliation-candidate-read.ts" &&
      file !== "lib/ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action.ts" &&
      file !== smokeRelativePath &&
      file !== reconciliationSmokeRelativePath &&
      file !== candidateSchemaSmokeRelativePath &&
      file !== candidateSchemaImplementationSmokeRelativePath &&
      file !== candidateWriterSmokeRelativePath &&
      file !== candidateWriterHelperRelativePath &&
      file !== "scripts/ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action.mjs" &&
      file !== "scripts/ag-work-resume-proof-evidence-reconciliation-candidate-read.mjs" &&
      file !== "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-read.mjs" &&
      file !== "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action.mjs" &&
      file !== "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action-route.mjs" &&
      file !== "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action-cockpit-panel.mjs" &&
      file !==
        "app/api/ag-work-resume/proof-evidence-reconciliation-candidates/route.ts" &&
      file !==
        "app/api/ag-work-resume/proof-evidence-reconciliation-candidates/lifecycle-actions/route.ts" &&
      file !== "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-route.mjs" &&
      file !== "components/augnes-cockpit.tsx" &&
      file !==
        "reports/browser/2026-06-01-ag-work-resume-proof-evidence-reconciliation-candidate-read-cockpit-panel-verification.md" &&
      file !==
        "reports/browser/2026-06-01-ag-work-resume-proof-evidence-reconciliation-candidate-create-cockpit-panel-verification.md" &&
      file !==
        "reports/browser/2026-06-01-ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-verification.md" &&
      file !==
        "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-create-cockpit-panel.mjs" &&
      file !==
        "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-read-cockpit-panel.mjs" &&
      !file.startsWith("scripts/smoke-ag-work-resume-imported-context"),
  );
  assert.deepEqual(
    implementationFiles,
    [],
    `design-only gate slice must not change implementation code: ${implementationFiles.join(", ")}`,
  );
}

function assertNoForbiddenSmokeImports(source) {
  const imports = [
    ...source.matchAll(/^\s*import\s+[^;]+;$/gm),
    ...source.matchAll(/\bimport\(\s*["'][^"']+["']\s*\)/g),
  ].map((match) => match[0]);
  const importText = imports.join("\n");
  for (const forbiddenImport of [
    /node:http/i,
    /node:https/i,
    /node:net/i,
    /node:tls/i,
    /node:dgram/i,
    /better-sqlite3/i,
    /app\/api/i,
    /components\//i,
    /lib\//i,
    /apps\/augnes_apps/i,
  ]) {
    assert.doesNotMatch(
      importText,
      forbiddenImport,
      `smoke source must not import ${forbiddenImport}`,
    );
  }
}

function extractSection(source, heading) {
  const marker = `## ${heading}`;
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `missing section ${marker}`);
  const rest = source.slice(start + marker.length);
  const next = rest.search(/\n## /);
  return next === -1 ? rest : rest.slice(0, next);
}

function gitChangedFiles() {
  return [
    ...new Set([
      ...gitLinesAllowFailure(["diff", "--name-only", "origin/main...HEAD"]),
      ...gitLines(["diff", "--name-only"]),
      ...gitLines(["diff", "--cached", "--name-only"]),
      ...gitLines(["ls-files", "--others", "--exclude-standard"]),
    ]),
  ];
}

function gitLines(args) {
  return execFileSync("git", args, {
    cwd: rootDir,
    encoding: "utf8",
  })
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function gitLinesAllowFailure(args) {
  try {
    return gitLines(args);
  } catch {
    return [];
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
