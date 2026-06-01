import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const smokePath = fileURLToPath(import.meta.url);
const smokeRelativePath =
  "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-db-schema-design.mjs";
const implementationSmokeRelativePath =
  "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-db-schema.mjs";
const writerSmokeRelativePath =
  "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-writer.mjs";
const writerHelperRelativePath =
  "scripts/ag-work-resume-proof-evidence-reconciliation-candidate-create.mjs";
const reconciliationSmokeRelativePath =
  "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-design.mjs";
const gateSmokeRelativePath =
  "scripts/smoke-ag-work-resume-proof-evidence-session-codex-gates-design.mjs";
const schemaRelativePath = "lib/db/schema.sql";
const writerCoreRelativePath =
  "lib/ag-work-resume-proof-evidence-reconciliation-candidate.ts";
const designDocRelativePath =
  "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_DB_SCHEMA_DESIGN_V0_1.md";
const implementationDocRelativePath =
  "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_DB_SCHEMA_IMPLEMENTATION_V0_1.md";
const writerDocRelativePath =
  "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_WRITER_V0_1.md";
const reconciliationDocRelativePath =
  "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_DESIGN_V0_1.md";
const gateDocRelativePath =
  "docs/AG_WORK_RESUME_PROOF_EVIDENCE_SESSION_CODEX_GATES_DESIGN_V0_1.md";
const designDocPath = path.join(rootDir, designDocRelativePath);
const packagePath = path.join(rootDir, "package.json");
const pointerDocRelativePaths = [
  reconciliationDocRelativePath,
  gateDocRelativePath,
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
  path.join(rootDir, writerCoreRelativePath),
  path.join(rootDir, writerHelperRelativePath),
  path.join(rootDir, writerSmokeRelativePath),
  path.join(rootDir, writerDocRelativePath),
  path.join(rootDir, implementationDocRelativePath),
  path.join(rootDir, schemaRelativePath),
  path.join(rootDir, implementationSmokeRelativePath),
  path.join(rootDir, reconciliationSmokeRelativePath),
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
  packageJson.scripts?.[
    "smoke:ag-work-resume-proof-evidence-reconciliation-candidate-db-schema-design"
  ],
  "node scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-db-schema-design.mjs",
  "package.json must expose candidate DB/schema design smoke",
);

const statusSection = extractSection(designDoc, "Status");
for (const pattern of [
  /design-only/i,
  /no schema implementation/i,
  /no migration/i,
  /adds no runtime behavior/i,
  /no\s+runtime behavior/is,
  /writer, helper, route, or UI/i,
  /creates no\s+proof\/evidence records/is,
  /no reconciliation candidate rows/i,
  /no session bindings/i,
  /no Codex records or actions/i,
  /no session authority, no Codex authority, no approval/i,
  /publish, retry, replay, merge/i,
]) {
  assert.match(statusSection, pattern, `status must include ${pattern}`);
}

const purposeSection = extractSection(designDoc, "Purpose");
for (const pattern of [
  /Candidate schema must be designed separately before implementation/i,
  /between imported context review\s+metadata and any future local proof\/evidence recording/is,
  /preserve\s+the distinction between a review candidate and a local proof or evidence\s+record/is,
  /AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_DESIGN_V0_1\.md/,
  /Reconciliation candidates remain review metadata only/i,
  /Foreign refs remain foreign until explicitly reconciled/i,
  /must not\s+automatically convert imported context foreign refs into local proof\/evidence/is,
]) {
  assert.match(purposeSection, pattern, `purpose must include ${pattern}`);
}

const tableSection = extractSection(designDoc, "Proposed Table");
for (const token of [
  "ag_work_resume_proof_evidence_reconciliation_candidates",
  "candidate_id",
  "TEXT PRIMARY KEY",
  "record_kind",
  "TEXT CHECK record_kind = ag_work_resume_proof_evidence_reconciliation_candidate",
  "schema",
  "TEXT CHECK schema = augnes.ag_work_resume_proof_evidence_reconciliation_candidate.v0_1",
  "status",
  "TEXT CHECK status IN proposed, accepted_for_future_recording, rejected, deferred, superseded, withdrawn, revoked",
  "import_id",
  "mapping_id",
  "foreign_ref_type",
  "TEXT NOT NULL CHECK foreign_ref_type IN proof, evidence, action, session, git, evidence_pack, handoff, other",
  "foreign_ref_id",
  "local_target_scope",
  "local_target_work_id",
  "summary",
  "redaction_status",
  "TEXT NOT NULL DEFAULT '{}'",
  "proposed_by",
  "proposed_reason",
  "reviewed_by",
  "reviewed_at",
  "review_note",
  "supersedes_candidate_id",
  "superseded_by_candidate_id",
  "authority_boundary",
  "created_at",
  "updated_at",
]) {
  assert.match(tableSection, new RegExp(escapeRegExp(token)), `table must include ${token}`);
}
for (const pattern of [
  /State JSON text fields/i,
  /redaction_status/i,
  /authority_boundary/i,
  /No schema is implemented in this PR/i,
]) {
  assert.match(tableSection, pattern, `table JSON/schema statement must include ${pattern}`);
}

const indexesSection = extractSection(designDoc, "Proposed Indexes");
for (const index of [
  "import_id, created_at DESC",
  "mapping_id, created_at DESC",
  "foreign_ref_type, foreign_ref_id",
  "local_target_scope, local_target_work_id, created_at DESC",
  "status, created_at DESC",
  "proposed_by, created_at DESC",
  "reviewed_by, reviewed_at DESC",
  "supersedes_candidate_id",
  "superseded_by_candidate_id",
]) {
  assert.match(indexesSection, new RegExp(escapeRegExp(index)), `index must include ${index}`);
}
assert.match(indexesSection, /No index is added by this PR/i);

const constraintsSection = extractSection(designDoc, "Constraints And FK Policy");
for (const pattern of [
  /foreign key from `import_id` to\s+`ag_work_resume_imported_contexts\(import_id\)`/is,
  /foreign key from `mapping_id` to\s+`ag_work_resume_confirmed_mappings\(mapping_id\)`/is,
  /imported context exists/i,
  /imported context status is allowed for reconciliation/i,
  /`mapping_id` matches the imported context/i,
  /local target work identity exists/i,
  /redaction status is safe/i,
  /foreign ref is a bounded summary, not a raw payload/i,
  /actor is present/i,
  /reason is present/i,
  /No schema is implemented in this PR/i,
  /No FK is added in this PR/i,
  /No writer\s+validation is implemented in this PR/is,
]) {
  assert.match(constraintsSection, pattern, `constraints/FK policy must include ${pattern}`);
}

const lifecycleSection = extractSection(designDoc, "Status And Lifecycle Model");
for (const pattern of [
  /`proposed` is review metadata candidate state/i,
  /`accepted_for_future_recording`.*not proof\/evidence recording/is,
  /`rejected` is inactive and non-recording/i,
  /`deferred` is inactive or waiting and non-recording/i,
  /`superseded` is inactive and non-recording/i,
  /`withdrawn` is inactive and non-recording/i,
  /`revoked` is inactive and non-recording/i,
  /No status creates proof\/evidence/i,
  /No status binds a session/i,
  /No status\s+executes Codex/is,
  /No status grants approval, publish, retry, replay, merge/i,
  /Lifecycle changes, if ever implemented, require separate design/i,
]) {
  assert.match(lifecycleSection, pattern, `status/lifecycle must include ${pattern}`);
}

const authoritySection = extractSection(designDoc, "Authority Boundary");
for (const pattern of [
  /Candidate rows are review metadata only/i,
  /no proof\/evidence recording/i,
  /no session binding/i,
  /no Codex execution/i,
  /no work item creation/i,
  /no work event creation/i,
  /no imported context mutation/i,
  /no confirmed mapping mutation/i,
  /no proposal mutation/i,
  /no approval, publish, retry, replay, merge/i,
  /Durable approval remains user\/Core gated/i,
]) {
  assert.match(authoritySection, pattern, `authority boundary must include ${pattern}`);
}

const nonGoalsSection = extractSection(designDoc, "Non-Goals");
for (const pattern of [
  /No schema implementation/i,
  /No migration/i,
  /No writer, helper, route, or UI/i,
  /No proof\/evidence implementation/i,
  /No proof\/evidence recording/i,
  /No session implementation/i,
  /No session binding/i,
  /No Codex implementation/i,
  /No Codex behavior/i,
  /No ChatGPT App, MCP\/App schema, or bridge tool changes/i,
  /No Direct Resume Code/i,
  /No relay/i,
  /No telemetry, analytics, localStorage, sessionStorage, indexedDB, or browser\s+persistence/is,
]) {
  assert.match(nonGoalsSection, pattern, `non-goals must include ${pattern}`);
}

const implementationSection = extractSection(designDoc, "Future Implementation Notes");
for (const pattern of [
  /future schema implementation PR should add the candidate table and indexes\s+only/is,
  /candidate writer\/helper is documented/is,
  /validates imported context, mapping, local work, redaction, actor\/reason,\s+and duplicate candidate policy/is,
  /Future actual proof\/evidence recording remains separately approved/i,
  /Session\/Codex gates remain separate/i,
]) {
  assert.match(implementationSection, pattern, `future implementation notes must include ${pattern}`);
}

const browserSection = extractSection(designDoc, "Browser Verification");
assert.match(
  browserSection,
  /browser verification skipped: no rendered UI\/operator surface changed in this design-only proof\/evidence reconciliation candidate schema slice/,
  "browser verification skip reason must match",
);

const verificationSection = extractSection(designDoc, "Verification");
for (const command of [
  "npm run typecheck",
  "npm run smoke:ag-work-resume-proof-evidence-reconciliation-candidate-db-schema-design",
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
  "node --check scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-db-schema-design.mjs",
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
    /AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_DB_SCHEMA_DESIGN_V0_1\.md/,
    `${relativePath} must point to candidate DB/schema design`,
  );
}

assertNoUnexpectedChangedFiles();
assertNoForbiddenImplementationCode();

console.log(
  JSON.stringify(
    {
      smoke: "ag-work-resume-proof-evidence-reconciliation-candidate-db-schema-design",
      cases: [
        "schema design doc exists",
        "package script exists",
        "doc says design-only/no schema implementation/no migration",
        "table name and fields documented",
        "JSON text fields documented",
        "status CHECK values documented",
        "lookup indexes documented",
        "FK policy discussion present",
        "imported context validation discussion present",
        "status/lifecycle rules documented",
        "authority boundary and non-goals documented",
        "related docs point to candidate schema design doc",
        "source guard accepts only docs, package, schema foundation, schema smoke, and design-smoke compatibility",
        "no app/components/runtime/migration/apps/browser report files changed",
        "no implementation code changed outside the schema foundation",
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
    implementationDocRelativePath,
    writerDocRelativePath,
    smokeRelativePath,
    implementationSmokeRelativePath,
    writerSmokeRelativePath,
    writerHelperRelativePath,
    reconciliationSmokeRelativePath,
    gateSmokeRelativePath,
    "scripts/smoke-ag-work-resume-imported-context-route.mjs",
    "scripts/smoke-ag-work-resume-imported-context-writer.mjs",
    schemaRelativePath,
    writerCoreRelativePath,
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
      `changed file is outside the candidate DB/schema design slice: ${file}`,
    );
    assert.equal(
      file !== schemaRelativePath &&
        file !== writerCoreRelativePath &&
        forbiddenPrefixes.some((prefix) => file.startsWith(prefix)),
      false,
      `candidate DB/schema follow-up must not touch runtime/UI/app/browser files: ${file}`,
    );
    assert.ok(
      file === schemaRelativePath ||
        file === writerCoreRelativePath ||
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
      file !== writerCoreRelativePath &&
      file !== smokeRelativePath &&
      file !== implementationSmokeRelativePath &&
      file !== writerSmokeRelativePath &&
      file !== writerHelperRelativePath &&
      file !== reconciliationSmokeRelativePath &&
      file !== gateSmokeRelativePath &&
      file !== "scripts/smoke-ag-work-resume-imported-context-route.mjs" &&
      file !== "scripts/smoke-ag-work-resume-imported-context-writer.mjs",
  );
  assert.deepEqual(
    implementationFiles,
    [],
    `candidate DB/schema design slice must not change implementation code: ${implementationFiles.join(", ")}`,
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
