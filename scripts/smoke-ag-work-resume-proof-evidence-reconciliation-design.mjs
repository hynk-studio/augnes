import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const smokePath = fileURLToPath(import.meta.url);
const smokeRelativePath =
  "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-design.mjs";
const candidateSchemaSmokeRelativePath =
  "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-db-schema-design.mjs";
const candidateSchemaImplementationSmokeRelativePath =
  "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-db-schema.mjs";
const candidateWriterSmokeRelativePath =
  "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-writer.mjs";
const candidateWriterHelperRelativePath =
  "scripts/ag-work-resume-proof-evidence-reconciliation-candidate-create.mjs";
const gateSmokeRelativePath =
  "scripts/smoke-ag-work-resume-proof-evidence-session-codex-gates-design.mjs";
const schemaRelativePath = "lib/db/schema.sql";
const candidateWriterCoreRelativePath =
  "lib/ag-work-resume-proof-evidence-reconciliation-candidate.ts";
const designDocRelativePath =
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
  "docs/AG_WORK_RESUME_PROOF_EVIDENCE_SESSION_CODEX_GATES_DESIGN_V0_1.md",
  "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_CREATE_COCKPIT_PANEL_V0_1.md",
  "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_READ_COCKPIT_PANEL_V0_1.md",
  "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_READ_V0_1.md",
  "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_ROUTE_V0_1.md",
  "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_WRITER_V0_1.md",
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
  path.join(rootDir, gateSmokeRelativePath),
  ...pointerDocRelativePaths.map((relativePath) => path.join(rootDir, relativePath)),
]) {
  assert.ok(existsSync(file), `${file} must exist`);
}

const smokeSource = readFileSync(smokePath, "utf8");
assertNoForbiddenSmokeImports(smokeSource);

const designDoc = readFileSync(designDocPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

assert.equal(
  packageJson.scripts?.["smoke:ag-work-resume-proof-evidence-reconciliation-design"],
  "node scripts/smoke-ag-work-resume-proof-evidence-reconciliation-design.mjs",
  "package.json must expose proof/evidence reconciliation design smoke",
);

const statusSection = extractSection(designDoc, "Status");
for (const pattern of [
  /design-only/i,
  /adds no runtime behavior/i,
  /adds no schema or migration/i,
  /adds no writer, helper, route, or UI/i,
  /creates no proof\/evidence records/i,
  /no reconciliation candidate records/i,
  /no session records/i,
  /no Codex records/i,
  /no proof\/evidence writer/i,
  /no proof\/evidence schema/i,
  /no\s+session binding/is,
  /no Codex behavior/i,
  /no app\/api changes/i,
  /no components changes/i,
  /no lib runtime changes/i,
  /no `lib\/db\/schema\.sql` changes/i,
  /no migrations/i,
  /no\s+ChatGPT App\/MCP\/App schema changes/is,
  /no bridge tools/i,
  /no Direct Resume Code/i,
  /no relay/i,
  /no telemetry\/analytics\/browser persistence/i,
  /no browser report/i,
  /no session authority, no Codex authority, no approval/i,
  /publish, retry, replay, merge/i,
]) {
  assert.match(statusSection, pattern, `status must include ${pattern}`);
}

const purposeSection = extractSection(designDoc, "Purpose");
for (const pattern of [
  /Imported context foreign refs need reconciliation/i,
  /before they can become local\s+proof\/evidence/is,
  /outside the local Augnes proof and\s+evidence ledgers/is,
  /foreign proof ref or foreign evidence ref/i,
  /not a local proof record/i,
  /not a local evidence\s+record/is,
  /Imported context is review metadata only/i,
  /foreign_refs_summary/i,
  /bounded summaries for local review/i,
  /does not\s+import raw payloads/is,
  /does not create local proof\/evidence/i,
  /Foreign refs remain foreign until explicitly reconciled/i,
  /no imported context ref is\s+automatically converted into local proof\/evidence/is,
]) {
  assert.match(purposeSection, pattern, `purpose must include ${pattern}`);
}

const definitionsSection = extractSection(designDoc, "Definitions");
for (const pattern of [
  /imported context row.*ag_work_resume_imported_contexts/is,
  /foreign proof ref.*remains foreign/is,
  /foreign evidence ref.*remains\s+foreign/is,
  /local proof record.*separately authorized proof path/is,
  /local evidence record.*separately authorized evidence path/is,
  /reconciliation candidate.*future review-only object/is,
  /reconciliation decision.*future explicit user\/Core decision/is,
  /actor\/reason.*explicit user\/Core actor and written reason/is,
  /redaction report.*secrets, raw DB paths, raw\s+session payloads, and raw proof payloads/is,
  /review-only summary.*without becoming a local proof\/evidence payload/is,
  /proof\/evidence authority boundary.*do not record proof\/evidence/is,
]) {
  assert.match(definitionsSection, pattern, `definitions must include ${pattern}`);
}

const modelSection = extractSection(designDoc, "Reconciliation Model");
for (const pattern of [
  /Candidate discovery is read-only/i,
  /discovery does not create\s+proof\/evidence records/is,
  /Candidate review does not create proof\/evidence/i,
  /review remains metadata/i,
  /explicit user\/Core reconciliation decision is required/i,
  /actor,\s+reason,\s+source imported context/is,
  /Future local proof\/evidence creation remains separately authorized/i,
  /would not automatically create local proof or\s+evidence/is,
  /Rejected candidates remain review metadata only/i,
  /There is no automatic conversion from imported context refs/i,
  /foreign refs remain foreign until explicitly reconciled/i,
]) {
  assert.match(modelSection, pattern, `model must include ${pattern}`);
}

const checksSection = extractSection(designDoc, "Required Future Checks");
for (const pattern of [
  /imported context exists/i,
  /imported context status is allowed for reconciliation/i,
  /redaction report is safe/i,
  /foreign refs are bounded summaries, not raw payloads/i,
  /local target work identity is confirmed/i,
  /actor is required/i,
  /reason is required/i,
  /no raw secrets/i,
  /no raw DB paths/i,
  /no raw session payloads/i,
  /no raw proof payloads/i,
  /no session binding/i,
  /no Codex execution/i,
  /no merge, publish, retry, or replay authority/i,
]) {
  assert.match(checksSection, pattern, `future checks must include ${pattern}`);
}

const shapeSection = extractSection(designDoc, "Future Non-Implemented Record Shape");
for (const token of [
  "candidate_id",
  "import_id",
  "foreign_ref_type",
  "foreign_ref_id",
  "local_target_scope",
  "local_target_work_id",
  "summary",
  "redaction_status",
  "proposed_by",
  "proposed_reason",
  "authority_boundary",
]) {
  assert.match(shapeSection, new RegExp(escapeRegExp(token)), `shape must include ${token}`);
}
for (const pattern of [
  /reconciliation candidate shape is design-only/i,
  /not a\s+schema, migration, runtime model, writer contract, helper contract, route\s+contract, UI contract, or proof\/evidence recording contract/is,
  /`candidate_id` is not a proof id, not an evidence id/i,
  /`import_id` traces the candidate back to\s+review metadata only/is,
  /not a local record to trust automatically/i,
]) {
  assert.match(shapeSection, pattern, `shape section must include ${pattern}`);
}

const authoritySection = extractSection(designDoc, "Authority Boundary");
for (const pattern of [
  /no proof\/evidence recording/i,
  /no session binding/i,
  /no Codex execution/i,
  /no work item creation/i,
  /no work event creation/i,
  /no confirmed mapping mutation/i,
  /no proposal mutation/i,
  /no imported context mutation/i,
  /no approval, publish, retry, replay, merge/i,
  /no committed state authority/i,
  /Durable approval remains user\/Core gated/i,
  /foreign refs remain\s+foreign until explicitly reconciled/is,
  /reconciliation candidate is review\s+metadata only/is,
]) {
  assert.match(authoritySection, pattern, `authority boundary must include ${pattern}`);
}

const nonGoalsSection = extractSection(designDoc, "Non-Goals");
for (const pattern of [
  /No schema or migration/i,
  /No writer, helper, route, or UI/i,
  /No proof\/evidence implementation/i,
  /No proof\/evidence writer/i,
  /No proof\/evidence schema/i,
  /No session implementation/i,
  /No session binding/i,
  /No Codex implementation/i,
  /No Codex behavior/i,
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
  /Proof\/evidence reconciliation design only: this PR/i,
  /Reconciliation candidate DB\/schema design/i,
  /AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_DB_SCHEMA_DESIGN_V0_1\.md/i,
  /Reconciliation candidate writer\/helper/i,
  /AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_WRITER_V0_1\.md/i,
  /Proof\/evidence actual recording design, separately approved/i,
  /Session\/Codex gates remain separate/i,
  /foreign refs remain foreign until explicitly reconciled/i,
  /actor and reason are\s+required/is,
]) {
  assert.match(futureSection, pattern, `future sequence must include ${pattern}`);
}

const browserSection = extractSection(designDoc, "Browser Verification");
assert.match(
  browserSection,
  /browser verification skipped: no rendered UI\/operator surface changed in this design-only proof\/evidence reconciliation slice/,
  "browser verification skip reason must match",
);

const verificationSection = extractSection(designDoc, "Verification");
for (const command of [
  "npm run typecheck",
  "npm run smoke:ag-work-resume-proof-evidence-reconciliation-design",
  "npm run smoke:ag-work-resume-proof-evidence-session-codex-gates-design",
  "npm run smoke:ag-work-resume-imported-context-create-cockpit-panel",
  "npm run smoke:ag-work-resume-imported-context-read-cockpit-panel",
  "npm run smoke:ag-work-resume-imported-context-read",
  "npm run smoke:ag-work-resume-imported-context-route",
  "npm run smoke:ag-work-resume-imported-context-writer",
  "npm run smoke:ag-work-resume-mapping-import-authority-gate",
  "git diff --check",
  "git diff --cached --check",
  "node --check scripts/smoke-ag-work-resume-proof-evidence-reconciliation-design.mjs",
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
    /AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_DESIGN_V0_1\.md/,
    `${relativePath} must point to proof/evidence reconciliation design`,
  );
}

assertNoUnexpectedChangedFiles();
assertNoForbiddenImplementationCode();

console.log(
  JSON.stringify(
    {
      smoke: "ag-work-resume-proof-evidence-reconciliation-design",
      cases: [
        "design doc exists",
        "package script exists",
        "doc says design-only",
        "doc forbids runtime/schema/writer/helper/route/UI",
        "doc says foreign refs remain foreign until explicitly reconciled",
        "doc says no automatic proof/evidence recording",
        "doc requires actor and reason",
        "doc forbids session/Codex/merge authority",
        "related docs point to proof/evidence reconciliation design",
        "changed files are limited to docs, package.json, schema foundation, candidate writer/helper, and design-smoke compatibility",
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
    candidateSchemaDesignDocRelativePath,
    candidateSchemaImplementationDocRelativePath,
    candidateWriterDocRelativePath,
    smokeRelativePath,
    candidateSchemaSmokeRelativePath,
    candidateSchemaImplementationSmokeRelativePath,
    candidateWriterSmokeRelativePath,
    candidateWriterHelperRelativePath,
    gateSmokeRelativePath,
    "scripts/smoke-ag-work-resume-imported-context-route.mjs",
    "scripts/smoke-ag-work-resume-imported-context-writer.mjs",
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
      `changed file is outside the design-only reconciliation slice: ${file}`,
    );
    assert.equal(
      file !== schemaRelativePath &&
        file !== candidateWriterCoreRelativePath &&
        forbiddenPrefixes.some((prefix) => file.startsWith(prefix)),
      false,
      `reconciliation follow-up must not touch runtime/UI/app/browser files: ${file}`,
    );
    assert.ok(
      file === schemaRelativePath ||
        file === candidateWriterCoreRelativePath ||
        !file.startsWith("lib/"),
      `lib changes are limited to ${schemaRelativePath} or candidate writer core: ${file}`,
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
      file !== smokeRelativePath &&
      file !== candidateSchemaSmokeRelativePath &&
      file !== candidateSchemaImplementationSmokeRelativePath &&
      file !== candidateWriterSmokeRelativePath &&
      file !== candidateWriterHelperRelativePath &&
      file !== gateSmokeRelativePath &&
      file !== "scripts/smoke-ag-work-resume-imported-context-route.mjs" &&
      file !== "scripts/smoke-ag-work-resume-imported-context-writer.mjs",
  );
  assert.deepEqual(
    implementationFiles,
    [],
    `design-only reconciliation slice must not change implementation code: ${implementationFiles.join(", ")}`,
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
