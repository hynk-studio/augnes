import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const smokePath = fileURLToPath(import.meta.url);
const designDocRelativePath =
  "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_RECORD_DESIGN_V0_1.md";
const designDocPath = path.join(rootDir, designDocRelativePath);
const packagePath = path.join(rootDir, "package.json");
const pointerDocRelativePaths = [
  "docs/AG_WORK_RESUME_CONFIRMED_MAPPING_CREATE_COCKPIT_PANEL_V0_1.md",
  "docs/AG_WORK_RESUME_CONFIRMED_MAPPING_READ_COCKPIT_PANEL_V0_1.md",
  "docs/AG_WORK_RESUME_CONFIRMED_MAPPING_READ_V0_1.md",
  "docs/AG_WORK_RESUME_CONFIRMED_MAPPING_ROUTE_V0_1.md",
  "docs/AG_WORK_RESUME_CONFIRMED_MAPPING_WRITER_V0_1.md",
  "docs/AG_WORK_RESUME_CONFIRMED_MAPPING_RECORD_DESIGN_V0_1.md",
  "docs/AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md",
];

for (const file of [
  smokePath,
  designDocPath,
  packagePath,
  ...pointerDocRelativePaths.map((relativePath) => path.join(rootDir, relativePath)),
]) {
  assert.ok(existsSync(file), `${file} must exist`);
}

const smokeSource = readFileSync(smokePath, "utf8");
assertNoForbiddenSmokeImports(smokeSource);

const designDoc = readFileSync(designDocPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

const expectedScripts = {
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
  /Stage D AG Resume imported resume\s+context record contract/is,
  /future record design after Stage C confirmed\s+mapping/is,
  /adds no runtime behavior/i,
  /no schema, no migration/i,
  /no\s+writer\/helper\/route\/UI/i,
  /no import rows/i,
  /no imported context rows/i,
  /no work\s+items/is,
  /no work\s+events/is,
  /no proof\/evidence records/i,
  /no session binding/i,
  /no Codex\s+execution or continuation/is,
  /no approval, publish, retry, replay, merge, or\s+committed-state authority/is,
  /no DB schema/i,
  /no ChatGPT App card/i,
  /no MCP\/App schema/i,
  /no Direct Resume Code/i,
  /no relay/i,
  /no telemetry\/analytics/i,
  /no\s+localStorage\/sessionStorage\/indexedDB persistence/is,
  /Durable approval remains user\/Core gated/i,
]) {
  assert.match(designDoc, pattern, `status must include ${pattern}`);
}

for (const pattern of [
  /future bounded review metadata record/i,
  /derived from a validated AG Resume packet and an existing active confirmed\s+mapping/is,
  /selected packet summary material/i,
  /expected files/i,
  /expected checks/i,
  /foreign refs summary/i,
  /redaction metadata/i,
  /separate from confirmed mapping/i,
  /Confirmed mapping does not import packet content/i,
  /not proof\/evidence/i,
  /not committed state authority/i,
  /not approval/i,
  /does not authorize publish, retry, replay, or merge/i,
  /does not bind sessions/i,
  /does not start or continue Codex/i,
  /fresh `codex:read-brief`/i,
]) {
  assert.match(designDoc, pattern, `purpose must include ${pattern}`);
}

for (const definition of [
  /confirmed mapping.*Stage C identity association/is,
  /source packet identity.*`packet_id`.*`packet_hash`.*`source_runtime_instance_id`/is,
  /imported context.*future Stage D bounded review metadata/is,
  /imported summary.*bounded summary/is,
  /imported expected files\/checks.*expected-file and expected-check/is,
  /foreign refs summary.*foreign action, evidence,\s+proof, evidence-pack, session, Git, or handoff refs/is,
  /redaction report.*secrets.*raw local DB paths.*raw session payloads.*raw proof payloads/is,
  /import actor \/ user-Core actor/i,
  /review metadata only.*without becoming proof, evidence, committed state, approval,\s+session binding, or Codex authority/is,
  /proof\/evidence.*separately authorized local proof or evidence records/is,
  /session binding.*must not create, bind, or mutate sessions/is,
  /Codex continuation.*must not execute or continue\s+Codex/is,
]) {
  assert.match(designDoc, definition, `definitions must include ${definition}`);
}

const recordShapeSection = extractSection(designDoc, "Future Record Shape");
for (const token of [
  "import_id",
  "ag-resume-imported-context:example",
  "record_kind",
  "ag_work_resume_imported_context",
  "schema",
  "augnes.ag_work_resume_imported_context.v0_1",
  "status",
  "review_metadata",
  "mapping_id",
  "ag-resume-confirmed-mapping:example",
  "foreign_scope",
  "foreign_work_id",
  "local_scope",
  "local_work_id",
  "packet_id",
  "packet_hash",
  "source_runtime_instance_id",
  "imported_summary",
  "imported_expected_files",
  "imported_expected_checks",
  "foreign_refs_summary",
  "redaction_report",
  "secrets_included",
  "raw_db_paths_included",
  "session_payloads_included",
  "proof_payloads_included",
  "created_by",
  "import_reason",
  "created_at",
  "authority_boundary",
  "review_metadata_only",
  "confirmed_mapping_required",
  "proof_recorded",
  "evidence_recorded",
  "session_bound",
  "codex_executed",
  "approval_granted",
  "merge_authority",
]) {
  assert.match(
    recordShapeSection,
    new RegExp(escapeRegExp(token)),
    `future record shape must include ${token}`,
  );
}
for (const requirement of [
  /future non-implemented imported context record shape/i,
  /design only, not schema\/runtime/i,
  /not a writer contract/i,
  /not a route\s+contract/is,
  /`import_id` is not `mapping_id`, not `proposal_id`, and not a proof\/evidence\s+id/is,
  /`mapping_id` is required traceability to an existing active confirmed\s+mapping/is,
  /`import_reason` records why user\/Core created or imported this\s+bounded review metadata/is,
  /packet identity fields for review traceability only/i,
]) {
  assert.match(recordShapeSection, requirement, `record shape must include ${requirement}`);
}

const constraintsSection = extractSection(designDoc, "Constraints");
for (const requirement of [
  /Confirmed mapping must exist and be active/i,
  /Imported context must require `mapping_id`/i,
  /validated source packet identity/i,
  /`packet_id` and `packet_hash` must match reviewed and expected source\s+context/is,
  /`foreign_scope`, `foreign_work_id`, `local_scope`, and `local_work_id` must\s+match the active confirmed mapping/is,
  /must not create work items/i,
  /must not create work events/i,
  /must not mutate confirmed mapping rows/i,
  /must not mutate proposal rows/i,
  /must not record proof\/evidence/i,
  /must not bind sessions/i,
  /must not start Codex/i,
  /must not grant approval, merge, publish, retry, or replay/i,
  /Raw secrets must be excluded/i,
  /Raw local DB paths must be excluded/i,
  /Raw session payloads must be excluded/i,
  /Raw proof payloads must be excluded/i,
  /No constraint.*creates schema, migration, helper, route, UI, or\s+runtime behavior/is,
]) {
  assert.match(constraintsSection, requirement, `constraints must include ${requirement}`);
}

const relationshipSection = extractSection(designDoc, "Relationship To Confirmed Mapping");
for (const requirement of [
  /Confirmed mapping is an identity association/i,
  /Imported context is bounded\s+review metadata/is,
  /different purposes, different authority\s+boundaries/is,
  /separate user\/Core-gated stages/i,
  /may reference a confirmed mapping for\s+traceability/is,
  /must not update, supersede, withdraw,\s+or revoke a confirmed mapping/is,
  /Confirmed mapping lifecycle remains separate/i,
]) {
  assert.match(relationshipSection, requirement, `relationship must include ${requirement}`);
}

const authoritySection = extractSection(designDoc, "Authority Boundary");
for (const requirement of [
  /Imported context is review metadata only/i,
  /requires an active confirmed mapping/i,
  /not proof\/evidence/i,
  /not session binding/i,
  /not Codex execution or continuation/i,
  /not committed state authority/i,
  /not approval/i,
  /not merge, publish, retry, or replay authority/i,
  /does not create work items or work events/i,
  /does not mutate confirmed mapping rows/i,
  /does not mutate proposal rows/i,
  /does not reconcile foreign proof\/evidence\/session refs as\s+local records/is,
  /Durable approval remains user\/Core gated/i,
]) {
  assert.match(authoritySection, requirement, `authority boundary must include ${requirement}`);
}

const nonGoalsSection = extractSection(designDoc, "Non-Goals");
for (const nonGoal of [
  /No schema\/migration/i,
  /No writer\/helper\/route\/UI/i,
  /No imported context DB table/i,
  /No import row creation/i,
  /No Cockpit UI/i,
  /No ChatGPT App card/i,
  /No MCP\/App schema/i,
  /No bridge tool/i,
  /No proof\/evidence\/session reconciliation/i,
  /No Codex continuation/i,
  /No Direct Resume Code/i,
  /No relay/i,
  /No telemetry\/analytics\/browser persistence/i,
  /No localStorage, sessionStorage, or indexedDB persistence/i,
  /No work item creation/i,
  /No work event creation/i,
  /No approval, publish, retry, replay, merge, auto-merge, external posting, or\s+committed-state mutation/is,
]) {
  assert.match(nonGoalsSection, nonGoal, `non-goals must include ${nonGoal}`);
}

const futureSequenceSection = extractSection(designDoc, "Future PR Sequence");
for (const requirement of [
  /Imported context design only: this PR/i,
  /Imported context DB\/schema design/i,
  /Imported context schema implementation/i,
  /Imported context writer\/helper/i,
  /Imported context route/i,
  /Imported context read helper\/route/i,
  /Cockpit review UI, only if separately approved/i,
  /Proof\/evidence\/session\/Codex gates remain separate/i,
  /Each future PR must restate the authority boundary/i,
]) {
  assert.match(futureSequenceSection, requirement, `future sequence must include ${requirement}`);
}

const browserSection = extractSection(designDoc, "Browser Verification");
assert.match(
  browserSection,
  /browser verification skipped: no rendered UI\/operator surface changed in this design-only imported context slice/,
  "browser verification skip reason must match the requested design-only reason",
);

const verificationSection = extractSection(designDoc, "Verification");
for (const command of [
  "npm run typecheck",
  "npm run smoke:ag-work-resume-imported-context-record-design",
  "npm run smoke:ag-work-resume-confirmed-mapping-create-cockpit-panel",
  "npm run smoke:ag-work-resume-confirmed-mapping-read-cockpit-panel",
  "npm run smoke:ag-work-resume-confirmed-mapping-read",
  "npm run smoke:ag-work-resume-confirmed-mapping-route",
  "npm run smoke:ag-work-resume-confirmed-mapping-writer",
  "npm run smoke:ag-work-resume-mapping-import-authority-gate",
  "git diff --check",
  "git diff --cached --check",
  "node --check scripts/smoke-ag-work-resume-imported-context-record-design.mjs",
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
    /AG_WORK_RESUME_IMPORTED_CONTEXT_RECORD_DESIGN_V0_1\.md/,
    `${relativePath} must point to the Stage D imported context record design`,
  );
}

assertNoUnexpectedChangedFiles();

console.log(
  JSON.stringify(
    {
      smoke: "ag-work-resume-imported-context-record-design",
      cases: [
        "design doc exists",
        "package script is present",
        "smoke source imports only Node built-ins and no runtime helpers",
        "status keeps this slice design-only with no runtime/schema/UI authority",
        "definitions cover confirmed mapping, source packet identity, imported context, redaction, proof/evidence, session, and Codex separation",
        "future record shape is present and marked non-implemented design-only",
        "constraints require an active confirmed mapping and forbid work/proof/evidence/session/Codex/approval side effects",
        "relationship to confirmed mapping keeps identity association separate from imported review metadata",
        "authority boundary and non-goals forbid runtime, schema, route, UI, MCP/App, browser persistence, proof/evidence, session, Codex, and merge authority",
        "future PR sequence keeps DB/schema, writer/helper, route, read, UI, and proof/evidence/session/Codex gates separate",
        "pointer docs link to the Stage D imported context record design",
        "source guard limits changed files to Stage D schema/writer docs/package/smoke and narrow guard compatibility files",
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
    designDocRelativePath,
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_DB_SCHEMA_DESIGN_V0_1.md",
    ...pointerDocRelativePaths,
    "package.json",
    "scripts/ag-work-resume-imported-context-create.mjs",
    "scripts/smoke-ag-work-resume-imported-context-writer.mjs",
    "scripts/smoke-ag-work-resume-imported-context-db-schema.mjs",
    "scripts/smoke-ag-work-resume-imported-context-record-design.mjs",
    "scripts/smoke-ag-work-resume-imported-context-db-schema-design.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-create-cockpit-panel.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-read-cockpit-panel.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-read.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-route.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-writer.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-record-design.mjs",
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
      `changed file is outside the design-only imported context slice: ${file}`,
    );
    assert.ok(
      file === "lib/db/schema.sql" ||
        file === "lib/ag-work-resume-imported-context.ts" ||
        !forbiddenPrefixes.some((prefix) => file.startsWith(prefix)),
      `imported context follow-up must not touch runtime/UI/browser files outside schema.sql or writer core: ${file}`,
    );
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
