import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const smokePath = fileURLToPath(import.meta.url);
const designDocName = "AG_WORK_RESUME_CONFIRMED_MAPPING_RECORD_DESIGN_V0_1.md";
const designDocPath = path.join(rootDir, "docs", designDocName);
const packagePath = path.join(rootDir, "package.json");
const pointerDocPaths = [
  "docs/AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md",
  "docs/AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_DESIGN_V0_1.md",
  "docs/AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_WRITER_V0_1.md",
  "docs/AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_READ_V0_1.md",
  "docs/AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_READ_COCKPIT_PANEL_V0_1.md",
  "docs/AG_WORK_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTIONS_DESIGN_V0_1.md",
  "docs/AG_WORK_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTION_HELPER_V0_1.md",
  "docs/AG_WORK_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTION_ROUTE_V0_1.md",
  "docs/AG_WORK_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTION_COCKPIT_PANEL_V0_1.md",
].map((relativePath) => path.join(rootDir, relativePath));

for (const file of [smokePath, designDocPath, packagePath, ...pointerDocPaths]) {
  assert.ok(existsSync(file), `${file} must exist`);
}

const smokeSource = readFileSync(smokePath, "utf8");
assertNoForbiddenSmokeImports(smokeSource);

const designDoc = readFileSync(designDocPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

assert.equal(
  packageJson.scripts?.["smoke:ag-work-resume-confirmed-mapping-record-design"],
  "node scripts/smoke-ag-work-resume-confirmed-mapping-record-design.mjs",
  "package.json must expose confirmed mapping record design smoke",
);

for (const pattern of [
  /design-only/i,
  /Stage C AG Resume confirmed\s+mapping record contract/is,
  /adds no runtime behavior/i,
  /no schema\/migration/i,
  /no writer\/helper\/route\/UI/i,
  /no write authority/i,
  /does not create confirmed mapping rows/i,
  /does not import context/i,
  /does not record proof\/evidence/i,
  /does not bind sessions/i,
  /does not execute Codex/i,
  /Durable approval remains user\/Core gated/i,
]) {
  assert.match(designDoc, pattern, `status must include ${pattern}`);
}

for (const pattern of [
  /Stage C confirmed mapping is the future step/i,
  /associate\s+one foreign work identity with one existing local work identity/is,
  /Stage B proposal\s+records and lifecycle actions are review metadata only/is,
  /Neither proposal\s+records nor lifecycle actions confirm mappings/is,
  /Confirmed mapping must be designed separately/i,
  /still\s+does not import packet content/is,
  /record proof\/evidence/i,
  /bind sessions/i,
  /authorize Codex execution or continuation/i,
]) {
  assert.match(designDoc, pattern, `purpose must include ${pattern}`);
}

for (const definition of [
  /foreign work identity.*`foreign_scope`.*`foreign_work_id`/is,
  /local work identity.*`local_scope`.*`local_work_id`/is,
  /existing local work item/i,
  /proposal record/i,
  /active proposal/i,
  /lifecycle action/i,
  /confirmed mapping.*future Stage C/is,
  /mapping confirmation actor \/ user-Core actor/i,
  /confirmation reason/i,
  /source packet identity.*`packet_id`.*`packet_hash`.*`source_runtime_instance_id`/is,
  /mapping status.*`active`.*`superseded`.*`withdrawn`.*`revoked`/is,
  /supersession/i,
  /revocation/i,
  /imported resume context.*future Stage D/is,
]) {
  assert.match(designDoc, definition, `definitions must include ${definition}`);
}

const recordShapeSection = extractSection(designDoc, "Confirmed Mapping Record Shape");
for (const token of [
  "mapping_id",
  "record_kind",
  "ag_work_resume_confirmed_mapping",
  "schema",
  "augnes.ag_work_resume_confirmed_mapping.v0_1",
  "status",
  "active",
  "foreign_scope",
  "foreign_work_id",
  "local_scope",
  "local_work_id",
  "source_proposal_id",
  "packet_id",
  "packet_hash",
  "source_runtime_instance_id",
  "confirmed_by",
  "confirmed_at",
  "confirmation_reason",
  "supersedes_mapping_id",
  "superseded_by_mapping_id",
  "revoked_by",
  "revoked_at",
  "revocation_reason",
  "authority_boundary",
  "confirmed_mapping_created",
  "proposal_record_created",
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
  "durable_approval",
  "created_at",
  "updated_at",
]) {
  assert.match(
    recordShapeSection,
    new RegExp(escapeRegExp(token)),
    `future record shape must include ${token}`,
  );
}
for (const requirement of [
  /future non-implemented confirmed mapping record shape/i,
  /design only, not schema\/runtime/i,
  /not a writer contract/i,
  /not a route\s+contract/is,
  /`mapping_id` is not `proposal_id` and not `import_id`/i,
  /`source_proposal_id` is\s+traceability to Stage B review metadata/is,
  /not a proposal status named\s+`confirmed`/is,
  /traceability metadata only/i,
]) {
  assert.match(recordShapeSection, requirement, `record shape must include ${requirement}`);
}

const constraintsSection = extractSection(designDoc, "Mapping Constraints");
for (const requirement of [
  /One active confirmed mapping per `foreign_scope` \+ `foreign_work_id`/i,
  /One foreign work maps to one existing local work at a time/i,
  /Local work must already exist/i,
  /Confirmed mapping must not create local work/i,
  /explicit user\/Core actor and confirmation\s+reason/is,
  /`source_proposal_id` should be required/i,
  /missing.*reject the request.*no writes/is,
  /missing proposal record.*not-found result and no\s+writes/is,
  /inactive, rejected, withdrawn,\s+superseded, or expired proposal/is,
  /not-active-for-confirmation result and no writes/i,
  /Do not add a proposal status named `confirmed`/i,
  /proposal lifecycle status must not automatically create a confirmed\s+mapping/is,
  /route ok, smoke pass, browser pass, PR merge, or proof row is not\s+confirmation/is,
]) {
  assert.match(constraintsSection, requirement, `mapping constraints must include ${requirement}`);
}

const relationshipSection = extractSection(designDoc, "Relationship To Proposal Records");
for (const requirement of [
  /proposal record is review metadata only/i,
  /Lifecycle actions move proposals out of active consideration but do not\s+confirm mappings/is,
  /future explicit Stage C\s+confirmation/is,
  /may reference a proposal record for traceability/i,
  /should not mutate the source proposal record/i,
  /separately designed or transactionally\s+guarded/is,
  /There is no proposal status named `confirmed`/i,
  /lifecycle action does not create confirmed mapping rows/i,
]) {
  assert.match(
    relationshipSection,
    requirement,
    `proposal relationship must include ${requirement}`,
  );
}

const lifecycleSection = extractSection(designDoc, "Status And Lifecycle");
for (const statusPattern of [
  /`active`: the current confirmed association/i,
  /`superseded`: the mapping was replaced by another confirmed mapping/i,
  /`withdrawn`: user\/Core removed the mapping from active use without saying it\s+was wrong/is,
  /`revoked`: user\/Core determined the mapping should no longer be trusted/i,
  /`active` -> `superseded`/i,
  /`active` -> `withdrawn`/i,
  /`active` -> `revoked`/i,
  /Terminal statuses do not transition further/i,
  /No status implies import/i,
  /proof\/evidence/i,
  /session\s+binding/is,
  /Codex execution or continuation/i,
  /merge/i,
]) {
  assert.match(lifecycleSection, statusPattern, `lifecycle must include ${statusPattern}`);
}

const dbSection = extractSection(designDoc, "Future DB/Schema Considerations");
for (const requirement of [
  /Possible table name: `ag_work_resume_confirmed_mappings`/i,
  /unique on `foreign_scope`, `foreign_work_id`\s+where `status = 'active'`/is,
  /lookup index on `local_scope`, `local_work_id`/i,
  /lookup index on `source_proposal_id`/i,
  /lookup index on `packet_id`, `packet_hash`/i,
  /lookup index on `status`, `created_at`/i,
  /No schema\/migration is added in this PR/i,
  /must use a transaction and side-effect guards/i,
  /no proposal creation, import, imported\s+context, work, proof\/evidence, session, Codex execution/is,
]) {
  assert.match(dbSection, requirement, `DB/schema considerations must include ${requirement}`);
}

const contractSection = extractSection(designDoc, "Future Writer/Helper/Route Contract Sketch");
for (const token of [
  "foreign_scope",
  "foreign_work_id",
  "local_scope",
  "local_work_id",
  "source_proposal_id",
  "packet_id",
  "packet_hash",
  "source_runtime_instance_id",
  "confirmed_by",
  "confirmation_reason",
  "confirmed_at",
]) {
  assert.match(
    contractSection,
    new RegExp(escapeRegExp(token)),
    `future contract sketch must include ${token}`,
  );
}
for (const requirement of [
  /Design only/i,
  /reject missing explicit actor\/reason/i,
  /reject non-existing local work/i,
  /reject a duplicate active mapping\s+unless a supersession path is explicitly designed/is,
  /must not import context/i,
  /must not write proof\/evidence\/session\/work\/Codex tables/i,
  /must return an\s+authority boundary/is,
  /not implementation/i,
  /not a helper, route, schema, Cockpit\s+control/is,
]) {
  assert.match(contractSection, requirement, `future contract must include ${requirement}`);
}

const authoritySection = extractSection(designDoc, "Authority Boundary");
for (const requirement of [
  /Confirmed mapping creation is only a foreign\/local identity association/i,
  /It is not import/i,
  /It is not imported resume context/i,
  /It is not proof\/evidence/i,
  /It is not session binding/i,
  /It is not Codex execution or continuation/i,
  /It is not approval, publish, retry, replay, merge/i,
  /does not create proposal records/i,
  /does not create import records/i,
  /does not create imported context/i,
  /does not create work items or work events/i,
  /does not reconcile foreign proof\/evidence\/session refs as local records/i,
  /does not grant proof\/evidence authorization/i,
  /does not grant session binding authorization/i,
  /does not grant Codex authority/i,
  /Durable approval remains user\/Core gated/i,
]) {
  assert.match(authoritySection, requirement, `authority boundary must include ${requirement}`);
}

const nonGoalsSection = extractSection(designDoc, "Non-Goals");
for (const requirement of [
  /No schema\/migration/i,
  /No writer\/helper\/route/i,
  /No Cockpit UI/i,
  /No ChatGPT App card/i,
  /No MCP\/App schema/i,
  /No bridge tool/i,
  /No import design implementation/i,
  /No imported context implementation/i,
  /No proof\/evidence\/session reconciliation/i,
  /No Codex continuation/i,
  /No Direct Resume Code/i,
  /No relay/i,
  /No telemetry\/analytics\/browser persistence/i,
  /No approval, publish, retry, replay, merge/i,
]) {
  assert.match(nonGoalsSection, requirement, `non-goals must include ${requirement}`);
}

const futurePrSection = extractSection(designDoc, "Future PR Sequence");
for (const requirement of [
  /Confirmed mapping design only: this PR/i,
  /Confirmed mapping DB\/schema design/i,
  /Confirmed mapping DB\/schema implementation/i,
  /Confirmed mapping writer\/helper/i,
  /Confirmed mapping route/i,
  /Confirmed mapping Cockpit review\/control UI, only if separately approved/i,
  /Imported resume context design as Stage D/i,
  /Proof\/evidence\/session\/Codex gates remain separate/i,
]) {
  assert.match(futurePrSection, requirement, `future PR sequence must include ${requirement}`);
}

assert.match(
  extractSection(designDoc, "Browser Verification"),
  /browser verification skipped: no rendered UI\/operator surface changed in this design-only confirmed mapping slice/,
  "browser verification skip reason must be exact",
);

for (const pointerPath of pointerDocPaths) {
  const pointerSource = readFileSync(pointerPath, "utf8");
  assert.match(
    pointerSource,
    new RegExp(escapeRegExp(designDocName)),
    `${path.relative(rootDir, pointerPath)} must point to confirmed mapping design doc`,
  );
}

assertNoUnexpectedChangedFiles();
assertNoForbiddenImplementationCode();

console.log(
  JSON.stringify(
    {
      smoke: "ag-work-resume-confirmed-mapping-record-design",
      cases: [
        "design doc exists",
        "package script is present",
        "status states design-only and forbids runtime/schema/migration/writer/helper/route/UI/write authority",
        "definitions cover foreign/local identities, existing local work, proposal records, lifecycle actions, confirmed mapping, actors, source packet identity, statuses, supersession, revocation, and Stage D import separation",
        "future record shape is present and marked non-implemented design-only",
        "mapping constraints require existing local work, explicit actor/reason, one active foreign mapping, no confirmed proposal status, and no automatic lifecycle confirmation",
        "proposal relationship keeps Stage B review metadata separate from Stage C confirmation",
        "status lifecycle covers active, superseded, withdrawn, and revoked",
        "future DB/schema considerations are documented without adding schema or migrations",
        "future writer/helper/route sketch rejects missing actor/reason, non-existing local work, duplicate active mapping, and disallowed source proposal states",
        "authority boundary and non-goals forbid import/proof/evidence/session/Codex/merge authority",
        "relevant docs point to the confirmed mapping design doc",
        "source guard limits changed files to Stage C docs/package files and guard-only smoke compatibility files",
        "implementation guard rejects runtime/schema/app/MCP/browser/network/storage/tool changes",
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
    "app/api/ag-work-resume/confirmed-mappings/route.ts",
    "lib/ag-work-resume-confirmed-mapping-read.ts",
    "scripts/ag-work-resume-confirmed-mapping-read.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-read.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-route.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-writer.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-db-schema.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-db-schema-design.mjs",
    "docs/AG_WORK_RESUME_CONFIRMED_MAPPING_RECORD_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_CONFIRMED_MAPPING_READ_V0_1.md",
    "docs/AG_WORK_RESUME_CONFIRMED_MAPPING_READ_COCKPIT_PANEL_V0_1.md",
    "docs/AG_WORK_RESUME_CONFIRMED_MAPPING_CREATE_COCKPIT_PANEL_V0_1.md",
    "docs/AG_WORK_RESUME_CONFIRMED_MAPPING_ROUTE_V0_1.md",
    "docs/AG_WORK_RESUME_CONFIRMED_MAPPING_WRITER_V0_1.md",
    "docs/AG_WORK_RESUME_CONFIRMED_MAPPING_DB_SCHEMA_IMPLEMENTATION_V0_1.md",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_RECORD_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md",
    "docs/AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_WRITER_V0_1.md",
    "docs/AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_READ_V0_1.md",
    "docs/AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_READ_COCKPIT_PANEL_V0_1.md",
    "docs/AG_WORK_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTIONS_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTION_HELPER_V0_1.md",
    "docs/AG_WORK_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTION_ROUTE_V0_1.md",
    "docs/AG_WORK_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTION_COCKPIT_PANEL_V0_1.md",
    "package.json",
    "scripts/smoke-ag-work-resume-confirmed-mapping-record-design.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-create-cockpit-panel.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-read-cockpit-panel.mjs",
    "scripts/smoke-ag-work-resume-imported-context-record-design.mjs",
    "scripts/smoke-ag-work-resume-mapping-proposal-lifecycle-action.mjs",
    "scripts/smoke-ag-work-resume-mapping-proposal-lifecycle-action-route.mjs",
    "scripts/smoke-ag-work-resume-mapping-proposal-lifecycle-action-cockpit-panel.mjs",
    "scripts/smoke-ag-work-resume-mapping-proposal-record-read.mjs",
    "scripts/smoke-ag-work-resume-mapping-proposal-record-writer.mjs",
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
      `changed file is outside the design-only confirmed mapping slice: ${file}`,
    );
    assert.ok(
      !forbiddenPrefixes.some((prefix) => file.startsWith(prefix)) &&
        (!file.startsWith("app/") || allowedAppFiles.has(file)) &&
        (!file.startsWith("lib/") || allowedLibFiles.has(file)),
      `design-only confirmed mapping slice must not touch runtime/UI/schema/browser report files: ${file}`,
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
  const forbiddenImplementationPrefixes = [
    "app/",
    "apps/",
    "components/",
    "lib/",
    "migrations/",
  ];
  const implementationFiles = changedFiles.filter((file) =>
    forbiddenImplementationPrefixes.some((prefix) => file.startsWith(prefix)),
  );
  const allowedImplementationFiles = new Set([
    "app/api/ag-work-resume/confirmed-mappings/route.ts",
    "lib/ag-work-resume-confirmed-mapping-read.ts",
  ]);
  assert.deepEqual(
    implementationFiles.filter((file) => !allowedImplementationFiles.has(file)),
    [],
    "no runtime, route, schema, App, component, or library implementation files may change outside the confirmed mapping read slice",
  );

  const forbiddenCodePatterns = [
    /INSERT\s+INTO/i,
    /\bUPDATE\b/i,
    /\bDELETE\b/i,
    /\bDROP\b/i,
    /fetch\s*\(/i,
    /OpenAI|GitHub|browser tool/i,
    /localStorage|sessionStorage|indexedDB/i,
    /recordEvidence|recordProof|bindSession|executeCodex|runCodex/i,
  ];
  const guardOnlySmokeFiles = new Set([
    "scripts/smoke-ag-work-resume-confirmed-mapping-record-design.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-create-cockpit-panel.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-read-cockpit-panel.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-read.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-route.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-writer.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-db-schema.mjs",
    "scripts/smoke-ag-work-resume-confirmed-mapping-db-schema-design.mjs",
    "scripts/ag-work-resume-confirmed-mapping-read.mjs",
    "scripts/smoke-ag-work-resume-imported-context-record-design.mjs",
    "scripts/smoke-ag-work-resume-mapping-proposal-lifecycle-action.mjs",
    "scripts/smoke-ag-work-resume-mapping-proposal-lifecycle-action-route.mjs",
    "scripts/smoke-ag-work-resume-mapping-proposal-lifecycle-action-cockpit-panel.mjs",
    "scripts/smoke-ag-work-resume-mapping-proposal-record-read.mjs",
    "scripts/smoke-ag-work-resume-mapping-proposal-record-writer.mjs",
  ]);
  for (const file of changedFiles.filter((changedFile) =>
    /\.(?:mjs|js|ts|tsx|jsx|sql)$/.test(changedFile),
  )) {
    if (
      guardOnlySmokeFiles.has(file) ||
      file === "app/api/ag-work-resume/confirmed-mappings/route.ts" ||
      file === "lib/ag-work-resume-confirmed-mapping-read.ts"
    ) {
      continue;
    }
    const source = readFileSync(path.join(rootDir, file), "utf8");
    for (const pattern of forbiddenCodePatterns) {
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
