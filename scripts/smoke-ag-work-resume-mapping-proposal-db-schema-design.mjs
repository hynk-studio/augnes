import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const smokePath = fileURLToPath(import.meta.url);
const docsPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_MAPPING_PROPOSAL_DB_SCHEMA_DESIGN_V0_1.md",
);
const recordDesignPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_DESIGN_V0_1.md",
);
const gateDocPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md",
);
const packagePath = path.join(rootDir, "package.json");

assert.ok(existsSync(docsPath), "mapping proposal DB/schema design doc must exist");
assert.ok(existsSync(packagePath), "package.json must exist");

const smokeSource = readFileSync(smokePath, "utf8");
assertNoForbiddenSmokeImports(smokeSource);

const docsSource = readFileSync(docsPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

assert.equal(
  packageJson.scripts?.[
    "smoke:ag-work-resume-mapping-proposal-db-schema-design"
  ],
  "node scripts/smoke-ag-work-resume-mapping-proposal-db-schema-design.mjs",
  "package.json must expose mapping proposal DB/schema design smoke",
);

for (const pattern of [
  /design-only/i,
  /Stage B AG Resume mapping proposal\s+DB\/schema design/is,
  /adds no implementation/i,
  /no schema change/i,
  /no migration/i,
  /no route/i,
  /no UI/i,
  /no persistence/i,
  /no proposal record creation/i,
  /no confirmed mapping/i,
  /no import/i,
  /no proof\/evidence recording/i,
  /no session binding/i,
  /no Codex execution/i,
  /no\s+approval, publish, retry, replay, merge, or state mutation authority/i,
]) {
  assert.match(docsSource, pattern, `status must include ${pattern}`);
}

for (const purposePattern of [
  /PR #297 defined the Stage B mapping proposal record contract/i,
  /translates that Stage B proposal record contract into a possible\s+future SQLite schema and migration design/is,
  /precursor to any actual DB\/schema\s+PR, not implementation authorization/is,
]) {
  assert.match(docsSource, purposePattern, `purpose must include ${purposePattern}`);
}

for (const dbPattern of [
  /`scripts\/db-migrate\.mjs` reads `lib\/db\/schema\.sql`/i,
  /runs targeted migration helpers from\s+`scripts\/db-migrations\.mjs`/is,
  /Persistent base tables and indexes live in `lib\/db\/schema\.sql`/i,
  /Migration helpers handle additive and idempotent compatibility details/i,
  /does not change `lib\/db\/schema\.sql`/i,
]) {
  assert.match(docsSource, dbPattern, `DB architecture section must include ${dbPattern}`);
}

for (const token of [
  "ag_work_resume_mapping_proposals",
  "ag_work_resume_mapping_proposal",
  "augnes.ag_work_resume_mapping_proposal.v0_1",
]) {
  assert.match(
    docsSource,
    new RegExp(escapeRegExp(token)),
    `design doc must name ${token}`,
  );
}

const tableNameSection = extractSection(docsSource, "Proposed Future Table Name");
for (const status of [
  "proposed",
  "needs_review",
  "superseded",
  "withdrawn",
  "rejected",
  "expired",
]) {
  assert.match(
    tableNameSection,
    new RegExp(`\`${escapeRegExp(status)}\``),
    `status enum must include ${status}`,
  );
}
assert.match(
  tableNameSection,
  /explicitly have no `confirmed` status/i,
  "status enum must explicitly exclude confirmed",
);

const sqlSection = extractSection(docsSource, "Proposed Future SQL Shape");
for (const field of [
  "proposal_id",
  "record_kind",
  "schema",
  "status",
  "foreign_scope",
  "foreign_work_id",
  "foreign_title",
  "foreign_status",
  "foreign_next_action",
  "candidate_local_scope",
  "candidate_local_work_id",
  "candidate_title",
  "candidate_status",
  "candidate_next_action",
  "packet_id",
  "packet_hash",
  "source_runtime_instance_id",
  "source_packet_created_at",
  "proposal_preview_id",
  "proposal_preview_hash",
  "match_confidence_label",
  "comparison_summary",
  "gaps_summary",
  "conflicts_summary",
  "questions_summary",
  "foreign_refs_summary",
  "repo_context_summary",
  "redaction_summary",
  "proposed_by",
  "proposed_at",
  "proposal_reason",
  "expires_at",
  "supersedes_proposal_id",
  "superseded_by_proposal_id",
  "reviewed_by",
  "reviewed_at",
  "review_note",
  "authority_boundary",
  "created_at",
  "updated_at",
]) {
  assert.match(
    sqlSection,
    new RegExp(`\\b${escapeRegExp(field)}\\b`),
    `SQL sketch must include ${field}`,
  );
}
for (const sqlPattern of [
  /proposal_id TEXT PRIMARY KEY/i,
  /record_kind TEXT NOT NULL CHECK\s*\(\s*record_kind = 'ag_work_resume_mapping_proposal'/is,
  /schema TEXT NOT NULL CHECK\s*\(\s*schema = 'augnes\.ag_work_resume_mapping_proposal\.v0_1'/is,
  /status TEXT NOT NULL CHECK\s*\(\s*status IN/is,
  /comparison_summary TEXT NOT NULL DEFAULT '\[\]'/i,
  /foreign_refs_summary TEXT NOT NULL DEFAULT '\{\}'/i,
  /proposed_at TEXT NOT NULL DEFAULT\s+\(strftime\('%Y-%m-%dT%H:%M:%fZ', 'now'\)\)/i,
  /created_at TEXT NOT NULL DEFAULT\s+\(strftime\('%Y-%m-%dT%H:%M:%fZ', 'now'\)\)/i,
  /updated_at TEXT NOT NULL DEFAULT\s+\(strftime\('%Y-%m-%dT%H:%M:%fZ', 'now'\)\)/i,
]) {
  assert.match(sqlSection, sqlPattern, `SQL sketch must include ${sqlPattern}`);
}
assert.match(
  sqlSection,
  /JSON-ish values are stored as `TEXT` containing JSON/i,
  "design doc must state JSON-ish values are stored as TEXT containing JSON",
);
assert.match(
  sqlSection,
  /consistent with existing\s+`schema\.sql` patterns/is,
  "JSON text statement must reference existing schema.sql patterns",
);

const indexesSection = extractSection(docsSource, "Proposed Future Indexes");
for (const indexPattern of [
  /foreign work/i,
  /foreign_scope,\s+foreign_work_id,\s+created_at DESC/is,
  /candidate/i,
  /candidate_local_scope,\s+candidate_local_work_id,\s+created_at DESC/is,
  /status,\s+created_at DESC/is,
  /packet_id,\s+packet_hash/is,
  /proposal_preview_id,\s+proposal_preview_hash/is,
  /expires_at/i,
  /supersedes_proposal_id/i,
  /superseded_by_proposal_id/i,
]) {
  assert.match(indexesSection, indexPattern, `indexes must include ${indexPattern}`);
}
for (const idempotencyPattern of [
  /Prevent duplicate active proposals/i,
  /same `foreign_scope`,\s+`foreign_work_id`,\s+`candidate_local_scope`, and `candidate_local_work_id`/is,
  /status is `proposed` or `needs_review`/i,
  /SQLite partial unique index may be considered/i,
  /enforce the same rule in a future write\s+route inside one transaction/is,
  /does not implement a partial unique index or route-level transaction\s+enforcement/is,
]) {
  assert.match(
    indexesSection,
    idempotencyPattern,
    `uniqueness/idempotency section must include ${idempotencyPattern}`,
  );
}

const migrationSection = extractSection(docsSource, "Proposed Future Migration Approach");
for (const migrationPattern of [
  /add a `CREATE TABLE IF NOT EXISTS` block to `lib\/db\/schema\.sql`/i,
  /add `CREATE INDEX IF NOT EXISTS` blocks to `lib\/db\/schema\.sql`/i,
  /add or update a migration helper only if needed/i,
  /keep the migration idempotent/i,
  /`npm run db:migrate` works on empty DBs and existing DBs/i,
  /avoid destructive migration/i,
  /avoid any backfill that creates records automatically/i,
  /avoid introducing a write route/i,
  /avoid proof\/evidence\/session\/Codex side effects/i,
  /check whether the table\/index already exists/i,
  /safe to run more than once/i,
]) {
  assert.match(migrationSection, migrationPattern, `migration approach must include ${migrationPattern}`);
}

const validationSection = extractSection(docsSource, "Proposed Future Validation Rules");
for (const validationPattern of [
  /packet passed strict preflight/i,
  /`packet_id` and `packet_hash` are present/i,
  /`proposal_preview_id` and `proposal_preview_hash` are present/i,
  /selected candidate is explicit/i,
  /status must not be `confirmed`/i,
  /no blocked preview/i,
  /conflict preview default blocks proposal record creation/i,
  /unsafe target policy blocks/i,
  /expired packet blocks/i,
  /redaction flags or unsafe content blocks/i,
  /user\/Core explicit request required/i,
  /`proposed_by` required/i,
  /`proposal_reason` required/i,
  /no hidden auto-create/i,
]) {
  assert.match(validationSection, validationPattern, `validation rules must include ${validationPattern}`);
}

const authoritySection = extractSection(docsSource, "Authority Boundary");
for (const authorityPattern of [
  /Schema design is not implementation/i,
  /Table design is not approval/i,
  /Future proposal row is not confirmed mapping/i,
  /Future proposal row is not import/i,
  /Future proposal row is not proof\/evidence/i,
  /Future proposal row is not session binding/i,
  /Future proposal row is not Codex execution/i,
  /Future proposal row is not approval, publish, retry, replay, or merge/i,
  /not committed project state beyond the proposal record\s+itself/is,
  /Durable approval remains user\/Core gated/i,
]) {
  assert.match(authoritySection, authorityPattern, `authority boundary must include ${authorityPattern}`);
}

const routeSection = extractSection(docsSource, "Future Write-Route Separation");
for (const routePattern of [
  /DB\/schema PR should not include a write route/i,
  /separate PR or an explicitly scoped PR/i,
  /use a transaction/i,
  /return HTTP 201 only for proposal record creation, not mapping confirmation/i,
  /not create confirmed mapping records/i,
  /not create import records/i,
  /not create work items/i,
  /not create proof records or evidence rows/i,
  /not bind sessions/i,
  /not create Codex execution state/i,
]) {
  assert.match(routeSection, routePattern, `write-route separation must include ${routePattern}`);
}

const readModelSection = extractSection(docsSource, "Future Read Model Considerations");
for (const readModelPattern of [
  /list proposals by foreign work/i,
  /list proposals by candidate local work/i,
  /list active proposals/i,
  /list expired proposals/i,
  /fetch by `proposal_id`/i,
  /fetch by `packet_id` and `packet_hash`/i,
  /implements no read route/i,
]) {
  assert.match(readModelSection, readModelPattern, `read model must include ${readModelPattern}`);
}

const testsSection = extractSection(docsSource, "Future Tests And Smokes For Implementation PR");
for (const testPattern of [
  /empty DB migration creates table and indexes/i,
  /existing DB migration is idempotent/i,
  /status `CHECK` rejects `confirmed`/i,
  /JSON text defaults exist/i,
  /duplicate active proposal policy is tested if implemented/i,
  /no other tables are mutated/i,
  /no route\/UI\/write behavior added/i,
  /`db:migrate` output reports table\/index status/i,
  /`git diff --check`/i,
  /`npm run typecheck`/i,
  /existing AG Resume smokes still pass/i,
]) {
  assert.match(testsSection, testPattern, `future tests must include ${testPattern}`);
}

const redactionSection = extractSection(docsSource, "Foreign Refs And Redaction Storage");
for (const redactionPattern of [
  /only bounded summaries/i,
  /not raw foreign\s+proof\/evidence\/session payloads/is,
  /raw secrets/i,
  /raw DB paths/i,
  /tunnel URLs/i,
  /local absolute paths/i,
  /screenshots\/media/i,
  /raw OpenAI responses/i,
  /Foreign refs remain foreign/i,
  /Reconciliation remains a separate future\s+authority gate/is,
]) {
  assert.match(redactionSection, redactionPattern, `foreign refs/redaction must include ${redactionPattern}`);
}

const expirySection = extractSection(docsSource, "Expiration And Supersession Design");
for (const expiryPattern of [
  /`expires_at` is nullable/i,
  /Expired proposals stay records but inactive/i,
  /Supersession relationships.*are trace only/is,
  /Supersession does not confirm mapping/i,
  /`updated_at` should change when proposal lifecycle changes/i,
  /adds no auto-expiry job/i,
]) {
  assert.match(expirySection, expiryPattern, `expiration/supersession must include ${expiryPattern}`);
}

const decisionsSection = extractSection(docsSource, "Open User/Core Decisions");
for (const decision of [
  /exact expiry default/i,
  /whether conflict-for-review proposal records are allowed/i,
  /whether partial unique index or route-level transaction enforcement is\s+preferred/is,
  /whether `proposal_reason` should be free text or enum/i,
  /whether `proposed_by` and `reviewed_by` should reference agents\/users or\s+remain text/is,
  /whether future schema PR may include only schema or schema plus a read helper/i,
  /whether Stage C confirmed mapping should share this table or be a separate\s+table/is,
  /recommendation: Stage C confirmed mapping should be a separate table/i,
]) {
  assert.match(decisionsSection, decision, `open decisions must include ${decision}`);
}

const nonGoalsSection = extractSection(docsSource, "Non-Goals");
for (const nonGoal of [
  /no implementation/i,
  /no schema change/i,
  /no migration/i,
  /no route/i,
  /no UI/i,
  /no persistence/i,
  /no proposal record creation/i,
  /no confirmed mapping/i,
  /no import/i,
  /no proof\/evidence\/session/i,
  /no Codex/i,
  /no Direct Resume Code/i,
  /no relay/i,
  /no approval, merge, or state mutation/i,
]) {
  assert.match(nonGoalsSection, nonGoal, `non-goals must include ${nonGoal}`);
}

const nextSection = extractSection(docsSource, "Next Suggested Implementation");
assert.match(
  nextSection,
  /implement DB\/schema and\s+migration for `ag_work_resume_mapping_proposals` while still adding no write\s+route/is,
  "next implementation should mention schema/migration with no write route",
);
assert.match(
  nextSection,
  /continue Stage A real-packet dogfood\s+without persistence/is,
  "next implementation should allow Stage A dogfood without persistence",
);
assert.match(
  nextSection,
  /design document itself does not authorize implementation/i,
  "design doc must not authorize implementation",
);

for (const implementationClaim of [
  /this PR modifies\s+schema/i,
  /this PR modifies\s+`lib\/db\/schema\.sql`/i,
  /this PR creates\s+(?:a\s+)?migration/i,
  /this PR adds\s+(?:a\s+)?route(?!, no)/i,
  /this PR creates\s+records/i,
  /this PR creates\s+proposal records/i,
  /this PR implements\s+(?:a\s+)?schema/i,
]) {
  assert.doesNotMatch(
    docsSource,
    implementationClaim,
    `design doc must not claim implemented schema/migration/route/records: ${implementationClaim}`,
  );
}

for (const forbidden of [
  "schema implemented",
  "migration implemented",
  "creates proposal record",
  "confirmed mapping created",
  "automatically confirms mapping",
  "automatic import",
  "starts Codex",
  "executes Codex",
  "grants approval",
  "merge authority",
  "proof is approval",
  "proposal record is evidence",
  "proposal record creates work item",
]) {
  assertForbiddenPhraseOnlyNegated(docsSource, forbidden);
}

if (existsSync(recordDesignPath)) {
  const recordDesignSource = readFileSync(recordDesignPath, "utf8");
  if (recordDesignSource.includes("AG_WORK_RESUME_MAPPING_PROPOSAL_DB_SCHEMA_DESIGN_V0_1.md")) {
    assert.match(
      recordDesignSource,
      /Stage B DB\/schema design is documented in\s+`docs\/AG_WORK_RESUME_MAPPING_PROPOSAL_DB_SCHEMA_DESIGN_V0_1\.md`/is,
      "record design pointer must point to DB/schema design doc",
    );
    assert.match(
      recordDesignSource,
      /no schema\s+or migration is added by current docs/i,
      "record design pointer must preserve non-implementation boundary",
    );
  }
}

if (existsSync(gateDocPath)) {
  const gateDocSource = readFileSync(gateDocPath, "utf8");
  if (gateDocSource.includes("AG_WORK_RESUME_MAPPING_PROPOSAL_DB_SCHEMA_DESIGN_V0_1.md")) {
    assert.match(
      gateDocSource,
      /Stage B DB\/schema design is documented in\s+`docs\/AG_WORK_RESUME_MAPPING_PROPOSAL_DB_SCHEMA_DESIGN_V0_1\.md`/is,
      "authority gate pointer must point to DB/schema design doc",
    );
    assert.match(
      gateDocSource,
      /current\s+Stage A surfaces and Stage B record design remain non-implementation;\s+no\s+schema or migration is added by current docs/is,
      "authority gate pointer must preserve read-only and no-schema boundary",
    );
  }
}

console.log("mapping proposal DB/schema design smoke passed");

function assertNoForbiddenSmokeImports(source) {
  const importStatements = [
    ...source.matchAll(/^\s*import\s+[^;]+;$/gm),
    ...source.matchAll(/\bimport\(\s*["'][^"']+["']\s*\)/g),
  ].map((match) => match[0]);
  const importText = importStatements.join("\n");
  for (const forbiddenImport of [
    /node:child_process/i,
    /node:http/i,
    /node:https/i,
    /node:net/i,
    /node:tls/i,
    /better-sqlite3/i,
    /\bdb\b/i,
    /openDatabase/i,
    /app\/api/i,
    /\/route(?:\.ts)?/i,
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

function assertForbiddenPhraseOnlyNegated(source, phrase) {
  const pattern = new RegExp(escapeRegExp(phrase), "gi");
  for (const match of source.matchAll(pattern)) {
    const lineStart = source.lastIndexOf("\n", match.index) + 1;
    const lineEnd = source.indexOf("\n", match.index);
    const line = source.slice(lineStart, lineEnd === -1 ? source.length : lineEnd);
    assert.ok(
      isClearlyNegated(line, phrase),
      `forbidden phrase must be clearly negated when used: ${phrase}`,
    );
  }
}

function isClearlyNegated(line, phrase) {
  const lowerLine = line.toLowerCase();
  const lowerPhrase = phrase.toLowerCase();
  if (lowerLine.includes(`not ${lowerPhrase}`)) return true;
  if (lowerLine.includes(`no ${lowerPhrase}`)) return true;
  if (lowerLine.includes(`does not ${lowerPhrase}`)) return true;
  if (lowerLine.includes(`must not ${lowerPhrase}`)) return true;
  if (lowerLine.includes(`is not ${lowerPhrase}`)) return true;
  if (lowerLine.includes(`cannot ${lowerPhrase}`)) return true;
  if (lowerLine.includes(`avoid any backfill that ${lowerPhrase}s automatically`)) {
    return true;
  }
  if (phrase === "schema implemented" && lowerLine.includes("not schema implementation")) {
    return true;
  }
  if (phrase === "migration implemented" && lowerLine.includes("not migration authorization")) {
    return true;
  }
  if (phrase === "merge authority" && lowerLine.includes("not merge authority")) return true;
  if (phrase === "merge authority" && lowerLine.includes("or merge authority")) return true;
  if (phrase === "proof is approval" && lowerLine.includes("proof is not approval")) {
    return true;
  }
  return false;
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
