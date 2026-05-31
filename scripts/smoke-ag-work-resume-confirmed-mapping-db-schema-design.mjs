import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const smokePath = fileURLToPath(import.meta.url);
const schemaDesignDocName =
  "AG_WORK_RESUME_CONFIRMED_MAPPING_DB_SCHEMA_DESIGN_V0_1.md";
const schemaDesignDocPath = path.join(rootDir, "docs", schemaDesignDocName);
const recordDesignDocPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_CONFIRMED_MAPPING_RECORD_DESIGN_V0_1.md",
);
const gateDocPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md",
);
const packagePath = path.join(rootDir, "package.json");

for (const file of [
  smokePath,
  schemaDesignDocPath,
  recordDesignDocPath,
  gateDocPath,
  packagePath,
]) {
  assert.ok(existsSync(file), `${file} must exist`);
}

const smokeSource = readFileSync(smokePath, "utf8");
assertNoForbiddenSmokeImports(smokeSource);

const schemaDesignDoc = readFileSync(schemaDesignDocPath, "utf8");
const recordDesignDoc = readFileSync(recordDesignDocPath, "utf8");
const gateDoc = readFileSync(gateDocPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

assert.equal(
  packageJson.scripts?.["smoke:ag-work-resume-confirmed-mapping-db-schema-design"],
  "node scripts/smoke-ag-work-resume-confirmed-mapping-db-schema-design.mjs",
  "package.json must expose confirmed mapping DB/schema design smoke",
);

for (const pattern of [
  /design-only/i,
  /future DB\/schema contract/i,
  /no schema\/migration implementation/i,
  /no runtime behavior/i,
  /no writer\/helper\/route\/UI/i,
  /no confirmed mapping rows/i,
  /does not modify\s+`lib\/db\/schema\.sql`/is,
  /Durable approval remains user\/Core gated/i,
]) {
  assert.match(schemaDesignDoc, pattern, `status must include ${pattern}`);
}

for (const pattern of [
  /Schema must be designed separately before implementation/i,
  /durable identity association/i,
  /AG_WORK_RESUME_CONFIRMED_MAPPING_RECORD_DESIGN_V0_1\.md/i,
  /identity association only/i,
  /one foreign work identity associated with one\s+existing local work identity/is,
  /separate from import, imported resume context,\s+proof\/evidence, session binding, Codex execution/is,
]) {
  assert.match(schemaDesignDoc, pattern, `purpose must include ${pattern}`);
}

const tableSection = extractSection(schemaDesignDoc, "Proposed Table");
for (const token of [
  "ag_work_resume_confirmed_mappings",
  "mapping_id TEXT PRIMARY KEY",
  "record_kind TEXT",
  "record_kind = 'ag_work_resume_confirmed_mapping'",
  "schema TEXT",
  "schema = 'augnes.ag_work_resume_confirmed_mapping.v0_1'",
  "status TEXT",
  "active",
  "superseded",
  "withdrawn",
  "revoked",
  "foreign_scope TEXT NOT NULL",
  "foreign_work_id TEXT NOT NULL",
  "local_scope TEXT NOT NULL",
  "local_work_id TEXT NOT NULL",
  "source_proposal_id TEXT NOT NULL",
  "packet_id TEXT NOT NULL",
  "packet_hash TEXT NOT NULL",
  "source_runtime_instance_id TEXT",
  "confirmed_by TEXT NOT NULL",
  "confirmed_at TEXT NOT NULL",
  "confirmation_reason TEXT NOT NULL",
  "supersedes_mapping_id TEXT",
  "superseded_by_mapping_id TEXT",
  "revoked_by TEXT",
  "revoked_at TEXT",
  "revocation_reason TEXT",
  "authority_boundary TEXT NOT NULL DEFAULT '{}'",
  "created_at TEXT NOT NULL",
  "updated_at TEXT NOT NULL",
]) {
  assert.match(
    tableSection,
    new RegExp(escapeRegExp(token)),
    `proposed table must include ${token}`,
  );
}
for (const pattern of [
  /CREATE TABLE IF NOT EXISTS ag_work_resume_confirmed_mappings/i,
  /status IN \('active', 'superseded', 'withdrawn', 'revoked'\)/i,
  /authority_boundary` is JSON text/i,
  /storage remains `TEXT`/i,
  /plain text for design review/i,
  /not executed by\s+this PR and is not schema implementation/is,
]) {
  assert.match(tableSection, pattern, `table section must include ${pattern}`);
}

const indexesSection = extractSection(schemaDesignDoc, "Proposed Indexes");
for (const pattern of [
  /CREATE UNIQUE INDEX IF NOT EXISTS idx_ag_confirmed_mappings_active_foreign/is,
  /ON ag_work_resume_confirmed_mappings\(foreign_scope, foreign_work_id\)/i,
  /WHERE status = 'active'/i,
  /foreign_scope`, `foreign_work_id`, `created_at DESC`/i,
  /local_scope`, `local_work_id`, `created_at DESC`/i,
  /source_proposal_id/i,
  /packet_id`, `packet_hash`/i,
  /status`, `created_at DESC`/i,
  /supersedes_mapping_id/i,
  /superseded_by_mapping_id/i,
]) {
  assert.match(indexesSection, pattern, `indexes must include ${pattern}`);
}

const fkSection = extractSection(schemaDesignDoc, "Constraints And Foreign-Key Policy");
for (const pattern of [
  /DB foreign key to\s+`ag_work_resume_mapping_proposals\(source_proposal_id\)`/is,
  /enforces local\s+proposal existence/is,
  /may complicate future archival,\s+import, or cross-runtime reconciliation/is,
  /No DB foreign key/i,
  /future\s+writer must validate source proposal existence explicitly/is,
  /validate the\s+proposal is active for confirmation/is,
  /future writer must validate local work exists/i,
  /DB foreign key to.*`work_items\(scope, work_id\)`/is,
  /not added here/i,
  /Confirmed mapping must never create local work/i,
  /No schema is implemented in this PR/i,
]) {
  assert.match(fkSection, pattern, `FK/local work policy must include ${pattern}`);
}

const lifecycleSection = extractSection(schemaDesignDoc, "Active Uniqueness And Lifecycle");
for (const pattern of [
  /only one active confirmed mapping per `foreign_scope` \+\s+`foreign_work_id`/is,
  /`superseded`, `withdrawn`, and `revoked` mappings are inactive/i,
  /must not be deleted/i,
  /Supersession must be transactional/i,
  /cannot leave two\s+active rows/is,
  /cannot leave a half-written\s+supersession link/is,
  /Revocation and withdrawal must not delete rows/i,
]) {
  assert.match(lifecycleSection, pattern, `active lifecycle must include ${pattern}`);
}

const authoritySection = extractSection(schemaDesignDoc, "Authority Boundary");
for (const pattern of [
  /mapping identity association only/i,
  /No import context/i,
  /No imported resume context/i,
  /No proof\/evidence/i,
  /No session binding/i,
  /No Codex execution or continuation/i,
  /No approval, merge, publish, retry, or replay/i,
  /No work item or work event creation/i,
  /No proposal creation/i,
  /Durable approval remains user\/Core gated/i,
]) {
  assert.match(authoritySection, pattern, `authority boundary must include ${pattern}`);
}

const nonGoalsSection = extractSection(schemaDesignDoc, "Non-Goals");
for (const pattern of [
  /No schema implementation/i,
  /No migration/i,
  /No writer\/helper\/route\/UI/i,
  /No import schema/i,
  /No proof\/evidence\/session reconciliation/i,
  /No Codex continuation/i,
  /No Direct Resume Code/i,
  /No relay/i,
  /No telemetry\/analytics\/browser persistence/i,
  /No approval, publish, retry, replay, merge/i,
]) {
  assert.match(nonGoalsSection, pattern, `non-goals must include ${pattern}`);
}

const futureSection = extractSection(schemaDesignDoc, "Future Implementation Notes");
for (const pattern of [
  /future schema implementation PR should add the table and indexes only/i,
  /should not add a writer, helper, route, Cockpit UI/i,
  /source proposal exists/i,
  /source proposal is active for confirmation/i,
  /packet id\/hash and packet hash match expected proposal metadata/i,
  /local work exists/i,
  /explicit user\/Core actor and confirmation reason/i,
  /duplicate active mapping does not exist/i,
  /Future route\/UI work should remain separately gated/i,
  /Stage D imported resume\s+context remains after confirmed mapping/is,
]) {
  assert.match(futureSection, pattern, `future notes must include ${pattern}`);
}

assert.match(
  extractSection(schemaDesignDoc, "Browser Verification"),
  /browser verification skipped: no rendered UI\/operator surface changed in this design-only confirmed mapping schema slice/,
  "browser verification skip reason must be exact",
);

for (const [label, source] of [
  ["record design doc", recordDesignDoc],
  ["import authority gate doc", gateDoc],
]) {
  assert.match(
    source,
    new RegExp(escapeRegExp(schemaDesignDocName)),
    `${label} must point to confirmed mapping DB/schema design doc`,
  );
}

assertNoUnexpectedChangedFiles();
assertNoForbiddenImplementationCode();

console.log(
  JSON.stringify(
    {
      smoke: "ag-work-resume-confirmed-mapping-db-schema-design",
      cases: [
        "schema design doc exists",
        "package script is present",
        "status says design-only with no schema implementation, migration, runtime, writer/helper/route/UI, or rows created",
        "purpose links to confirmed mapping record design and preserves identity-association-only semantics",
        "table name and all fields are documented",
        "status CHECK values are documented",
        "active unique partial index is documented",
        "lookup indexes are documented",
        "foreign-key policy discussion is present",
        "local work existence validation discussion is present",
        "active uniqueness and lifecycle rules are documented",
        "authority boundary and non-goals are documented",
        "record design and authority gate docs point to schema design doc",
        "source guard limits changed files to docs, package.json, and the new smoke script",
        "forbidden code guard rejects runtime/schema/app/network/storage/proof/session/Codex changes",
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
    "lib/ag-work-resume-confirmed-mapping-read.ts",
    "app/api/ag-work-resume/confirmed-mappings/route.ts",
    "scripts/ag-work-resume-confirmed-mapping-read.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-read.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-route.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-writer.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-db-schema.mjs",
    "docs/AG_WORK_RESUME_CONFIRMED_MAPPING_DB_SCHEMA_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_CONFIRMED_MAPPING_RECORD_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_CONFIRMED_MAPPING_DB_SCHEMA_IMPLEMENTATION_V0_1.md",
    "docs/AG_WORK_RESUME_CONFIRMED_MAPPING_READ_V0_1.md",
    "docs/AG_WORK_RESUME_CONFIRMED_MAPPING_ROUTE_V0_1.md",
    "docs/AG_WORK_RESUME_CONFIRMED_MAPPING_WRITER_V0_1.md",
    "docs/AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md",
    "package.json",
    "scripts/smoke-ag-work-resume-confirmed-mapping-db-schema-design.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-record-design.mjs",
  ]);
  const allowedAppFiles = new Set([
    "app/api/ag-work-resume/confirmed-mappings/route.ts",
  ]);
  const allowedLibFiles = new Set([
    "lib/ag-work-resume-confirmed-mapping-read.ts",
  ]);
  const forbiddenPrefixes = ["apps/", "components/", "migrations/", "reports/browser/"];

  for (const file of changedFiles) {
    assert.ok(
      allowedFiles.has(file),
      `changed file is outside the design-only confirmed mapping schema slice: ${file}`,
    );
    assert.ok(
      !forbiddenPrefixes.some((prefix) => file.startsWith(prefix)) &&
        (!file.startsWith("app/") || allowedAppFiles.has(file)) &&
        (!file.startsWith("lib/") || allowedLibFiles.has(file)),
      `design-only confirmed mapping schema slice must not touch forbidden path: ${file}`,
    );
    assert.notEqual(file, "lib/db/schema.sql", "schema.sql must not change");
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
      /^(app|apps|components|lib|migrations)\//.test(file) ||
      file === "lib/db/schema.sql",
  );
  const allowedImplementationFiles = new Set([
    "app/api/ag-work-resume/confirmed-mappings/route.ts",
    "lib/ag-work-resume-confirmed-mapping-read.ts",
  ]);
  assert.deepEqual(
    implementationFiles.filter((file) => !allowedImplementationFiles.has(file)),
    [],
    "no runtime, route, schema, App, component, library, migration, or browser files may change outside the confirmed mapping read slice",
  );

  const forbiddenPatterns = [
    /CREATE\s+TABLE/i,
    /ALTER\s+TABLE/i,
    /INSERT\s+INTO/i,
    /\bUPDATE\b/i,
    /\bDELETE\b/i,
    /\bDROP\b/i,
    /fetch\s*\(/i,
    /OpenAI|GitHub|browser tool/i,
    /localStorage|sessionStorage|indexedDB/i,
    /recordEvidence|recordProof|bindSession|executeCodex|runCodex/i,
  ];
  const allowedReadSliceSourceFiles = new Set([
    "app/api/ag-work-resume/confirmed-mappings/route.ts",
    "lib/ag-work-resume-confirmed-mapping-read.ts",
    "scripts/ag-work-resume-confirmed-mapping-read.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-read.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-route.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-writer.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-db-schema.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-record-design.mjs",
  ]);
  for (const file of changedFiles.filter((changedFile) =>
    /\.(?:mjs|js|ts|tsx|jsx|sql)$/.test(changedFile),
  )) {
    if (
      file === "scripts/smoke-ag-work-resume-confirmed-mapping-db-schema-design.mjs" ||
      allowedReadSliceSourceFiles.has(file)
    ) {
      continue;
    }
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

function extractSection(source, heading) {
  const pattern = new RegExp(
    `(?:^|\\n)## ${escapeRegExp(heading)}\\n([\\s\\S]*?)(?=\\n## |$)`,
  );
  const match = source.match(pattern);
  assert.ok(match, `missing section ${heading}`);
  return match[1];
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
