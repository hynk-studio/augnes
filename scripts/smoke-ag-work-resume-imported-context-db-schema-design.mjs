import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const smokePath = fileURLToPath(import.meta.url);
const schemaDesignDocRelativePath =
  "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_DB_SCHEMA_DESIGN_V0_1.md";
const schemaDesignDocPath = path.join(rootDir, schemaDesignDocRelativePath);
const recordDesignDocRelativePath =
  "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_RECORD_DESIGN_V0_1.md";
const recordDesignDocPath = path.join(rootDir, recordDesignDocRelativePath);
const packagePath = path.join(rootDir, "package.json");
const pointerDocRelativePaths = [
  recordDesignDocRelativePath,
  "docs/AG_WORK_RESUME_CONFIRMED_MAPPING_CREATE_COCKPIT_PANEL_V0_1.md",
  "docs/AG_WORK_RESUME_CONFIRMED_MAPPING_READ_COCKPIT_PANEL_V0_1.md",
  "docs/AG_WORK_RESUME_CONFIRMED_MAPPING_ROUTE_V0_1.md",
  "docs/AG_WORK_RESUME_CONFIRMED_MAPPING_WRITER_V0_1.md",
  "docs/AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md",
];

for (const file of [
  smokePath,
  schemaDesignDocPath,
  recordDesignDocPath,
  packagePath,
  ...pointerDocRelativePaths.map((relativePath) => path.join(rootDir, relativePath)),
]) {
  assert.ok(existsSync(file), `${file} must exist`);
}

const smokeSource = readFileSync(smokePath, "utf8");
assertNoForbiddenSmokeImports(smokeSource);

const schemaDesignDoc = readFileSync(schemaDesignDocPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

const expectedScripts = {
  "smoke:ag-work-resume-imported-context-db-schema-design":
    "node scripts/smoke-ag-work-resume-imported-context-db-schema-design.mjs",
  "smoke:ag-work-resume-imported-context-record-design":
    "node scripts/smoke-ag-work-resume-imported-context-record-design.mjs",
  "smoke:ag-work-resume-confirmed-mapping-create-cockpit-panel":
    "node scripts/smoke-ag-work-resume-confirmed-mapping-create-cockpit-panel.mjs",
  "smoke:ag-work-resume-confirmed-mapping-read-cockpit-panel":
    "node scripts/smoke-ag-work-resume-confirmed-mapping-read-cockpit-panel.mjs",
  "smoke:ag-work-resume-confirmed-mapping-read":
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-ag-work-resume-confirmed-mapping-read.mjs",
  "smoke:ag-work-resume-confirmed-mapping-route":
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-ag-work-resume-confirmed-mapping-route.mjs",
  "smoke:ag-work-resume-confirmed-mapping-writer":
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-ag-work-resume-confirmed-mapping-writer.mjs",
  "smoke:ag-work-resume-mapping-import-authority-gate":
    "node scripts/smoke-ag-work-resume-mapping-import-authority-gate.mjs",
};
for (const [scriptName, command] of Object.entries(expectedScripts)) {
  assert.equal(packageJson.scripts?.[scriptName], command, `${scriptName} script must match`);
}

for (const pattern of [
  /design-only/i,
  /future DB\/schema contract for Stage\s+D AG Resume imported resume context records/is,
  /no schema\/migration implementation/i,
  /no runtime behavior/i,
  /no writer\/helper\/route\/UI/i,
  /no imported context rows/i,
  /does not modify\s+`lib\/db\/schema\.sql`/is,
  /add migrations/i,
  /no proof\/evidence/i,
  /bind sessions/i,
  /execute or continue Codex/i,
  /approval, publish, retry,\s+replay, merge, or committed-state authority/is,
  /Durable approval remains user\/Core gated/i,
]) {
  assert.match(schemaDesignDoc, pattern, `status must include ${pattern}`);
}

for (const pattern of [
  /Imported context schema must be designed separately before implementation/i,
  /bounded packet review metadata/i,
  /validated AG Resume packet and an existing active confirmed mapping/i,
  /AG_WORK_RESUME_IMPORTED_CONTEXT_RECORD_DESIGN_V0_1\.md/i,
  /review metadata only/i,
  /Confirmed mapping remains a required prerequisite/i,
  /not downstream\s+authority/is,
  /does not import packet context/i,
  /record proof\/evidence/i,
  /bind sessions/i,
  /start Codex/i,
  /approve, publish, retry, replay,\s+or merge/is,
]) {
  assert.match(schemaDesignDoc, pattern, `purpose must include ${pattern}`);
}

const tableSection = extractSection(schemaDesignDoc, "Proposed Table");
for (const token of [
  "ag_work_resume_imported_contexts",
  "import_id TEXT PRIMARY KEY",
  "record_kind TEXT",
  "record_kind = 'ag_work_resume_imported_context'",
  "schema TEXT",
  "schema = 'augnes.ag_work_resume_imported_context.v0_1'",
  "status TEXT",
  "review_metadata",
  "superseded",
  "withdrawn",
  "revoked",
  "mapping_id TEXT NOT NULL",
  "foreign_scope TEXT NOT NULL",
  "foreign_work_id TEXT NOT NULL",
  "local_scope TEXT NOT NULL",
  "local_work_id TEXT NOT NULL",
  "packet_id TEXT NOT NULL",
  "packet_hash TEXT NOT NULL",
  "source_runtime_instance_id TEXT",
  "imported_summary TEXT NOT NULL",
  "imported_expected_files TEXT NOT NULL DEFAULT '[]'",
  "imported_expected_checks TEXT NOT NULL DEFAULT '[]'",
  "foreign_refs_summary TEXT NOT NULL DEFAULT '{}'",
  "redaction_report TEXT NOT NULL DEFAULT '{}'",
  "created_by TEXT NOT NULL",
  "import_reason TEXT NOT NULL",
  "created_at TEXT NOT NULL",
  "updated_at TEXT NOT NULL",
  "authority_boundary TEXT NOT NULL DEFAULT '{}'",
]) {
  assert.match(
    tableSection,
    new RegExp(escapeRegExp(token)),
    `proposed table must include ${token}`,
  );
}
for (const pattern of [
  /CREATE TABLE IF NOT EXISTS ag_work_resume_imported_contexts/i,
  /status IN \('review_metadata', 'superseded', 'withdrawn', 'revoked'\)/i,
  /import_reason` records why user\/Core created or imported this bounded review\s+metadata/is,
  /plain text for design review/i,
  /not executed by\s+this PR and is not schema implementation/is,
]) {
  assert.match(tableSection, pattern, `table section must include ${pattern}`);
}

for (const field of [
  "imported_expected_files",
  "imported_expected_checks",
  "foreign_refs_summary",
  "redaction_report",
  "authority_boundary",
]) {
  assert.match(
    tableSection,
    new RegExp("JSON text fields:[\\s\\S]*`" + escapeRegExp(field) + "`"),
    `JSON text fields must include ${field}`,
  );
}
assert.match(
  tableSection,
  /storage remains `TEXT`\s+to match existing Augnes JSON-text storage patterns/i,
  "JSON text storage policy must be documented",
);

const indexesSection = extractSection(schemaDesignDoc, "Proposed Indexes");
for (const pattern of [
  /idx_ag_imported_contexts_mapping_time/is,
  /mapping_id,\s+created_at DESC/is,
  /idx_ag_imported_contexts_foreign_time/is,
  /foreign_scope,\s+foreign_work_id,\s+created_at DESC/is,
  /idx_ag_imported_contexts_local_time/is,
  /local_scope,\s+local_work_id,\s+created_at DESC/is,
  /idx_ag_imported_contexts_packet_hash/is,
  /packet_id,\s+packet_hash/is,
  /idx_ag_imported_contexts_status_time/is,
  /status,\s+created_at DESC/is,
  /idx_ag_imported_contexts_created_by_time/is,
  /created_by,\s+created_at DESC/is,
]) {
  assert.match(indexesSection, pattern, `indexes must include ${pattern}`);
}

const fkSection = extractSection(schemaDesignDoc, "Constraints And Foreign-Key Policy");
for (const pattern of [
  /DB foreign key to\s+`ag_work_resume_confirmed_mappings\(mapping_id\)`/is,
  /enforces local mapping\s+existence/is,
  /may complicate archival or cross-runtime\s+import flows/is,
  /No DB foreign key/i,
  /future writer must validate active confirmed mapping\s+existence explicitly/is,
  /mapping exists/i,
  /mapping status is `active`/i,
  /foreign_scope`, `foreign_work_id`, `local_scope`, and `local_work_id` match\s+the active confirmed mapping/is,
  /packet_id` and `packet_hash` match the reviewed packet/is,
  /redaction report excludes secrets, raw DB paths, raw session payloads, and\s+raw proof payloads/is,
  /No schema is implemented in this PR/i,
]) {
  assert.match(fkSection, pattern, `FK and validation policy must include ${pattern}`);
}

const lifecycleSection = extractSection(schemaDesignDoc, "Lifecycle And Status Model");
for (const pattern of [
  /`review_metadata`: active\/default review metadata state/i,
  /`superseded`: inactive/i,
  /`withdrawn`: inactive/i,
  /`revoked`: inactive/i,
  /must not be deleted/i,
  /does not mutate confirmed mapping rows/i,
  /does not create proof\/evidence records/i,
  /bind sessions/i,
  /execute or continue Codex/i,
  /Revocation and withdrawal must not delete rows/i,
]) {
  assert.match(lifecycleSection, pattern, `lifecycle/status model must include ${pattern}`);
}

const authoritySection = extractSection(schemaDesignDoc, "Authority Boundary");
for (const pattern of [
  /review metadata only/i,
  /No proof\/evidence/i,
  /No session binding/i,
  /No Codex execution or continuation/i,
  /No committed state authority/i,
  /No approval, publish, retry, replay, or merge/i,
  /No work item or work event creation/i,
  /No confirmed mapping mutation/i,
  /Durable approval remains user\/Core gated/i,
]) {
  assert.match(authoritySection, pattern, `authority boundary must include ${pattern}`);
}

const nonGoalsSection = extractSection(schemaDesignDoc, "Non-Goals");
for (const pattern of [
  /No schema implementation/i,
  /No migration/i,
  /No writer\/helper\/route\/UI/i,
  /No proof\/evidence\/session reconciliation/i,
  /No Codex continuation/i,
  /No Direct Resume Code/i,
  /No relay/i,
  /No ChatGPT App, MCP\/App schema, or bridge tool/i,
  /No telemetry\/analytics\/browser persistence/i,
  /No approval, publish, retry, replay, merge/i,
]) {
  assert.match(nonGoalsSection, pattern, `non-goals must include ${pattern}`);
}

const futureSection = extractSection(schemaDesignDoc, "Future Implementation Notes");
for (const pattern of [
  /future schema implementation PR should add the imported context table and\s+indexes only/is,
  /should not add a writer, helper, route, Cockpit UI/i,
  /future writer\/helper PR must validate active confirmed mapping/i,
  /packet\s+identity/is,
  /redaction report/i,
  /actor\/reason/i,
  /duplicate\/import policy/i,
  /Future route, read, and UI work remain separately gated/i,
  /Proof\/evidence,\s+session, and Codex gates remain separate/is,
  /does not authorize implementation/i,
]) {
  assert.match(futureSection, pattern, `future notes must include ${pattern}`);
}

assert.match(
  extractSection(schemaDesignDoc, "Browser Verification"),
  /browser verification skipped: no rendered UI\/operator surface changed in this design-only imported context schema slice/,
  "browser verification skip reason must match the requested exact reason",
);

const verificationSection = extractSection(schemaDesignDoc, "Verification");
for (const command of [
  "npm run typecheck",
  "npm run smoke:ag-work-resume-imported-context-db-schema-design",
  "npm run smoke:ag-work-resume-imported-context-record-design",
  "npm run smoke:ag-work-resume-confirmed-mapping-create-cockpit-panel",
  "npm run smoke:ag-work-resume-confirmed-mapping-read-cockpit-panel",
  "npm run smoke:ag-work-resume-confirmed-mapping-read",
  "npm run smoke:ag-work-resume-confirmed-mapping-route",
  "npm run smoke:ag-work-resume-confirmed-mapping-writer",
  "npm run smoke:ag-work-resume-mapping-import-authority-gate",
  "git diff --check",
  "git diff --cached --check",
  "node --check scripts/smoke-ag-work-resume-imported-context-db-schema-design.mjs",
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
    /AG_WORK_RESUME_IMPORTED_CONTEXT_DB_SCHEMA_DESIGN_V0_1\.md/,
    `${relativePath} must point to the Stage D imported context DB/schema design`,
  );
}

assertNoUnexpectedChangedFiles();
assertNoForbiddenImplementationCode();

console.log(
  JSON.stringify(
    {
      smoke: "ag-work-resume-imported-context-db-schema-design",
      cases: [
        "schema design doc exists",
        "package script is present",
        "status says design-only with no schema implementation, migration, runtime, writer/helper/route/UI, rows, proof/evidence/session/Codex, or merge authority",
        "purpose links to imported context record design and preserves review-metadata-only semantics",
        "table name and all fields are documented",
        "JSON text fields are documented",
        "status CHECK values are documented",
        "lookup indexes are documented",
        "foreign-key policy discussion is present",
        "active confirmed mapping validation discussion is present",
        "redaction validation discussion is present",
        "lifecycle/status rules are documented",
        "authority boundary and non-goals are documented",
        "related docs point to imported context DB/schema design doc",
        "source guard allows only the Stage D schema/writer follow-up files, docs, package.json, smoke scripts, and guard-only compatibility scripts",
        "forbidden code guard rejects runtime/app/network/storage/proof/session/Codex implementation changes outside schema.sql or writer core",
      ],
    },
    null,
    2,
  ),
);

function assertNoUnexpectedChangedFiles() {
  const changedFiles = new Set([
    ...gitLines(["diff", "--name-only"]),
    ...gitLines(["diff", "--cached", "--name-only"]),
    ...gitLines(["ls-files", "--others", "--exclude-standard"]),
  ]);
  const allowedFiles = new Set([
    "lib/db/schema.sql",
    "lib/ag-work-resume-imported-context.ts",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_DB_SCHEMA_IMPLEMENTATION_V0_1.md",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_WRITER_V0_1.md",
    schemaDesignDocRelativePath,
    ...pointerDocRelativePaths,
    "package.json",
    "scripts/ag-work-resume-imported-context-create.mjs",
    "scripts/smoke-ag-work-resume-imported-context-writer.mjs",
    "scripts/smoke-ag-work-resume-imported-context-db-schema.mjs",
    "scripts/smoke-ag-work-resume-imported-context-db-schema-design.mjs",
    "scripts/smoke-ag-work-resume-imported-context-record-design.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-create-cockpit-panel.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-read-cockpit-panel.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-read.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-route.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-writer.mjs",
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
      `changed file is outside the design-only imported context schema slice: ${file}`,
    );
    assert.ok(
      file === "lib/db/schema.sql" ||
        file === "lib/ag-work-resume-imported-context.ts" ||
        !forbiddenPrefixes.some((prefix) => file.startsWith(prefix)),
      `imported context follow-up must not touch runtime/UI/browser files outside schema.sql or writer core: ${file}`,
    );
  }
}

function assertNoForbiddenImplementationCode() {
  const changedFiles = [
    ...new Set([
      ...gitLines(["diff", "--name-only"]),
      ...gitLines(["diff", "--cached", "--name-only"]),
      ...gitLines(["ls-files", "--others", "--exclude-standard"]),
    ]),
  ];
  const implementationFiles = changedFiles.filter(
    (file) =>
      /^(app|apps|components|migrations)\//.test(file) ||
      (file.startsWith("lib/") &&
        file !== "lib/db/schema.sql" &&
        file !== "lib/ag-work-resume-imported-context.ts"),
  );
  assert.deepEqual(
    implementationFiles,
    [],
    "no runtime, route, App, component, library, migration, or browser files may change outside schema.sql or imported context writer core",
  );

  const guardOnlySmokeFiles = new Set([
    "scripts/smoke-ag-work-resume-imported-context-db-schema.mjs",
    "scripts/ag-work-resume-imported-context-create.mjs",
    "scripts/smoke-ag-work-resume-imported-context-writer.mjs",
    "scripts/smoke-ag-work-resume-imported-context-db-schema-design.mjs",
    "scripts/smoke-ag-work-resume-imported-context-record-design.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-create-cockpit-panel.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-read-cockpit-panel.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-read.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-route.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-writer.mjs",
  ]);
  const forbiddenPatterns = [
    /CREATE\s+TABLE/i,
    /ALTER\s+TABLE/i,
    /INSERT\s+INTO/i,
    /\bUPDATE\b/i,
    /\bDELETE\b/i,
    /\bDROP\b/i,
    /fetch\s*\(/i,
    /localStorage|sessionStorage|indexedDB/i,
    /recordEvidence|recordProof|bindSession|executeCodex|runCodex/i,
  ];
  for (const file of changedFiles.filter((changedFile) =>
    /\.(?:mjs|js|ts|tsx|jsx|sql)$/.test(changedFile),
  )) {
    if (file === "lib/db/schema.sql") continue;
    if (file === "lib/ag-work-resume-imported-context.ts") continue;
    if (guardOnlySmokeFiles.has(file)) continue;
    const source = readFileSync(path.join(rootDir, file), "utf8");
    for (const pattern of forbiddenPatterns) {
      assert.doesNotMatch(
        source,
        pattern,
        `changed implementation code must not include ${pattern}`,
      );
    }
  }
}

function assertNoForbiddenSmokeImports(source) {
  const importStatements = [
    ...source.matchAll(/^\s*import\s+[^;]+;$/gm),
    ...source.matchAll(/\bimport\(\s*["'][^"']+["']\s*\)/g),
  ].map((match) => match[0]);
  const importText = importStatements.join("\n");
  for (const forbiddenImport of [
    /node:http/i,
    /node:https/i,
    /node:net/i,
    /node:tls/i,
    /better-sqlite3/i,
    /app\/api/i,
    /components\//i,
    /lib\/ag-work-resume/i,
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
  const sectionStart = start + marker.length;
  const rest = source.slice(sectionStart);
  const next = rest.search(/\n## /);
  return next === -1 ? rest : rest.slice(0, next);
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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
