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
  "AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_DESIGN_V0_1.md",
);
const packagePath = path.join(rootDir, "package.json");

assert.ok(existsSync(docsPath), "mapping proposal record design doc must exist");
assert.ok(existsSync(packagePath), "package.json must exist");

const smokeSource = readFileSync(smokePath, "utf8");
assertNoForbiddenSmokeImports(smokeSource);

const docsSource = readFileSync(docsPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

assert.equal(
  packageJson.scripts?.["smoke:ag-work-resume-mapping-proposal-record-design"],
  "node scripts/smoke-ag-work-resume-mapping-proposal-record-design.mjs",
  "package.json must expose mapping proposal record design smoke",
);

for (const pattern of [
  /design-only/i,
  /Stage B AG Resume mapping proposal\s+record design/is,
  /adds no implementation/i,
  /no schema/i,
  /no migration/i,
  /no route/i,
  /no UI\s+control/i,
  /no persistence/i,
  /no record creation/i,
  /no confirmed mapping/i,
  /no import/i,
  /no proof\/evidence recording/i,
  /no session binding/i,
  /no Codex execution/i,
  /no\s+approval, publish, retry, replay, merge, or state mutation authority/i,
]) {
  assert.match(docsSource, pattern, `design doc must state status boundary ${pattern}`);
}

for (const pattern of [
  /Stage A mapping proposal previews are ephemeral review metadata/i,
  /future Stage B mapping proposal record would preserve a proposed mapping/is,
  /proposal record is not a confirmed mapping/i,
  /proposal record is not imported resume context/i,
  /does not authorize writes beyond the proposal record\s+itself/i,
  /before\s+any schema, migration, route, UI control, persistence path, or writer exists/is,
]) {
  assert.match(docsSource, pattern, `purpose must include ${pattern}`);
}

for (const stage of [
  /Stage A: mapping proposal preview/i,
  /pure helper, local helper, route, and Cockpit\s+panel/is,
  /Stage B: mapping proposal record/i,
  /design-only in this PR/i,
  /Stage C: confirmed mapping record/i,
  /Stage D: imported resume context/i,
  /Proof\/evidence\/session\/Codex gates/i,
  /No stage implies the next stage/i,
]) {
  assert.match(docsSource, stage, `relationship section must mention ${stage}`);
}

for (const definition of [
  /mapping proposal record/i,
  /proposal status/i,
  /foreign work identity/i,
  /candidate local work identity/i,
  /selected candidate/i,
  /proposal source preview/i,
  /proposal preview id/i,
  /proposal snapshot/i,
  /proposal review metadata/i,
  /proposal supersession/i,
  /proposal withdrawal/i,
  /proposal expiration/i,
  /user\/Core proposer/i,
  /user\/Core reviewer/i,
  /not confirmed mapping/i,
  /not import/i,
  /not proof\/evidence/i,
  /not Codex execution authority/i,
]) {
  assert.match(docsSource, definition, `design doc must define ${definition}`);
}

for (const nonAuthority of [
  /proposal record is not mapping confirmation/i,
  /proposal record is not a confirmed mapping/i,
  /proposal record does not create a confirmed mapping/i,
  /proposal record does not import packet content/i,
  /proposal record does not create imported resume context/i,
  /proposal record does not create work items/i,
  /proposal record does not reconcile foreign refs/i,
  /proposal record does not record proof\/evidence/i,
  /proposal record does not bind sessions/i,
  /proposal record does not allow Codex execution/i,
  /proposal record does not approve, publish, retry, replay, or merge/i,
  /proposal record does not mutate committed project state except the future\s+proposal record itself/is,
  /proposal record is not approval authority and not merge authority/i,
]) {
  assert.match(docsSource, nonAuthority, `non-authority rule must include ${nonAuthority}`);
}

for (const token of [
  "proposal_id",
  "record_kind",
  "ag_work_resume_mapping_proposal",
  "schema",
  "augnes.ag_work_resume_mapping_proposal.v0_1",
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
    docsSource,
    new RegExp(escapeRegExp(token)),
    `future minimal record shape must include ${token}`,
  );
}
assert.match(
  docsSource,
  /possible future persisted mapping proposal record shape.*future-only and not implemented/is,
  "future minimal record shape must be marked future-only and not implemented",
);
assert.match(
  docsSource,
  /`proposal_id` is not `mapping_id`\.\s+`proposal_id` is not `import_id`/i,
  "proposal_id must be distinct from mapping_id and import_id",
);
assert.match(
  docsSource,
  /`proposal_preview_id` is source review metadata, not a durable mapping/i,
  "proposal_preview_id must be source review metadata only",
);
assert.match(
  docsSource,
  /`packet_hash` and `proposal_preview_hash` are traceability metadata/i,
  "hashes must be traceability metadata",
);
for (const sensitive of [
  /raw secrets/i,
  /raw DB paths/i,
  /tunnel URLs/i,
  /screenshots\/media/i,
  /raw OpenAI responses/i,
  /local absolute paths/i,
]) {
  assert.match(docsSource, sensitive, `record must exclude ${sensitive}`);
}

const statusSection = extractSection(docsSource, "Status Semantics");
for (const statusPattern of [
  /`proposed`: proposal was created for review, not confirmed/i,
  /`needs_review`: proposal exists but still needs user\/Core review/i,
  /`superseded`: proposal was replaced by a newer proposal/i,
  /`withdrawn`: proposal was removed from consideration by user\/Core/i,
  /`rejected`: proposal was explicitly rejected by user\/Core/i,
  /`expired`: proposal is no longer valid due to packet\/proposal expiry/i,
  /status enum intentionally has no `confirmed` value/i,
  /Confirmed\s+mapping belongs to Stage C, not Stage B/i,
]) {
  assert.match(statusSection, statusPattern, `status semantics must include ${statusPattern}`);
}
const statusBullets = statusSection
  .split("\n")
  .filter((line) => line.trim().startsWith("- `"))
  .join("\n");
assert.doesNotMatch(
  statusBullets,
  /`confirmed`/i,
  "Stage B status bullet list must not include confirmed",
);

const preconditionsSection = extractSection(
  docsSource,
  "Required Future Write-Route Preconditions",
);
for (const precondition of [
  /packet passed strict preflight/i,
  /mapping proposal preview was generated/i,
  /selected candidate is explicit/i,
  /user\/Core explicitly requested proposal record creation/i,
  /authority copy displayed or supplied/i,
  /no blocked preview status/i,
  /no conflict preview status unless user\/Core explicitly chooses/i,
  /no unsafe redaction or target policy/i,
  /no stale packet expiry/i,
  /no hidden auto-create/i,
  /no local work item creation/i,
  /no mapping confirmation/i,
]) {
  assert.match(preconditionsSection, precondition, `preconditions must include ${precondition}`);
}

const responseSection = extractSection(docsSource, "Future Write-Route Response Contract");
for (const responseRequirement of [
  /returns the proposal record\s+only/is,
  /HTTP status 201 may mean proposal record created, not mapping confirmed/i,
  /must not return `ok` text.*mapping\s+authority/is,
  /must include `authority_boundary`/i,
  /next_step:\s+"user\/Core review required"/i,
  /must not create confirmed mapping records/i,
  /import records/i,
  /proof records/i,
  /evidence rows/i,
  /session records/i,
]) {
  assert.match(responseSection, responseRequirement, `response contract must include ${responseRequirement}`);
}

const uiSection = extractSection(docsSource, "Future UI Principles");
for (const uiRequirement of [
  /visually separated from read-only preview/i,
  /`Create mapping proposal record`, not `Confirm mapping`/i,
  /explicit non-authority copy/i,
  /checkbox or typed confirmation/i,
  /packet id\/hash and selected candidate id/i,
  /conflicts\/gaps before record creation/i,
  /must not hide read-only vs write distinction/i,
  /keyboard accessible/i,
  /must not include import\/Codex\/merge buttons/i,
]) {
  assert.match(uiSection, uiRequirement, `UI principles must include ${uiRequirement}`);
}

const invalidSection = extractSection(docsSource, "Invalid And Preflight-Failing Handling");
for (const invalidRequirement of [
  /Malformed packet input cannot create a proposal record/i,
  /fails strict preflight cannot create a proposal record/i,
  /Unsafe packet target policy cannot create a proposal record/i,
  /blocked mapping proposal preview cannot create a proposal record/i,
  /default is no\s+proposal record until conflict is resolved/is,
  /corrected packet should have a new packet hash or clear provenance trail/i,
  /must not silently correct packet content/i,
]) {
  assert.match(invalidSection, invalidRequirement, `invalid handling must include ${invalidRequirement}`);
}

const foreignRefsSection = extractSection(docsSource, "Foreign Refs Handling");
for (const foreignRefsRequirement of [
  /Foreign refs may be summarized.*foreign context only/is,
  /does not convert foreign refs into local proof\/evidence or\s+session records/is,
  /Foreign refs reconciliation remains a separate future design/i,
  /Proof\/evidence\s+authorization remains separate/is,
  /Session binding remains separate/i,
]) {
  assert.match(
    foreignRefsSection,
    foreignRefsRequirement,
    `foreign refs handling must include ${foreignRefsRequirement}`,
  );
}

const expirySection = extractSection(docsSource, "Expiration And Supersession");
for (const expiryRequirement of [
  /Proposals may expire/i,
  /Proposal expiry does not mutate the packet/i,
  /Proposal supersession creates a trace relationship.*not confirmation/is,
  /Only one active proposal per\s+`foreign_scope`\/`foreign_work_id`\/local candidate may be recommended/is,
  /enforcement is future-only/i,
  /Stale proposal handling must be explicit/i,
]) {
  assert.match(expirySection, expiryRequirement, `expiration/supersession must include ${expiryRequirement}`);
}

const codexSection = extractSection(docsSource, "Codex Continuation Boundary");
for (const codexRequirement of [
  /Stage B proposal record does not enable Codex/i,
  /future confirmed mapping/i,
  /local runtime\/work context/i,
  /`CODEX_WORK_ID`/i,
  /successful `codex:read-brief`/i,
  /Proof\/evidence\/session choices remain separate/i,
  /Proof is not approval/i,
  /PR\s+creation is not merge authority/is,
]) {
  assert.match(codexSection, codexRequirement, `Codex boundary must include ${codexRequirement}`);
}

const checklistSection = extractSection(docsSource, "Required Future PR Review Checklist");
for (const checklistItem of [
  "Does this PR add schema?",
  "Does this PR add migration?",
  "Does this PR add write route?",
  "Does this PR create proposal records?",
  "Does this PR create confirmed mappings?",
  "Does this PR import packet context?",
  "Does this PR create work items?",
  "Does this PR reconcile proof/evidence/session refs?",
  "Does this PR start Codex?",
  "Does this PR grant approval/publish/retry/replay/merge?",
  "Are packet preflight and preview status checked?",
  "Are authority boundaries visible?",
  "Are browser checks included for UI?",
  "Are skipped checks listed with concrete reasons?",
  "What requires user/Core judgment?",
]) {
  assert.match(
    checklistSection,
    new RegExp(escapeRegExp(checklistItem)),
    `future PR checklist must include ${checklistItem}`,
  );
}

const nonGoalsSection = extractSection(docsSource, "Non-Goals");
for (const nonGoal of [
  /no implementation in this PR/i,
  /no schema/i,
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
  assert.match(nonGoalsSection, nonGoal, `non-goals must repeat ${nonGoal}`);
}

const nextSection = extractSection(docsSource, "Next Suggested Implementation");
assert.match(
  nextSection,
  /DB\/schema design for\s+mapping proposal records while still adding no route writes/is,
  "next implementation should allow schema design only if user/Core approves",
);
assert.match(
  nextSection,
  /continue Stage A real-packet dogfood without persistence/i,
  "next implementation should allow Stage A dogfood without persistence",
);
assert.match(
  nextSection,
  /design document itself does not authorize implementation/i,
  "design doc must not authorize implementation",
);

for (const implementationClaim of [
  /this PR implements\s+(?:a\s+)?schema/i,
  /this PR implements\s+(?:a\s+)?route/i,
  /this PR implements\s+persistence/i,
  /this PR adds\s+(?:a\s+)?schema(?!, no)/i,
  /this PR adds\s+(?:a\s+)?route(?!, no)/i,
  /this PR creates\s+persistence/i,
]) {
  assert.doesNotMatch(
    docsSource,
    implementationClaim,
    `design doc must not claim implemented schema/route/persistence: ${implementationClaim}`,
  );
}

for (const forbidden of [
  "confirmed mapping created",
  "automatically confirms mapping",
  "automatic import",
  "starts Codex",
  "executes Codex",
  "grants approval",
  "merge authority",
  "proof is approval",
  "proposal record is evidence",
  "proposal record is committed state",
  "proposal record creates work item",
]) {
  assertForbiddenPhraseOnlyNegated(docsSource, forbidden);
}

console.log("mapping proposal record design smoke passed");

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
  if (phrase === "merge authority" && lowerLine.includes("not merge authority")) return true;
  if (phrase === "merge authority" && lowerLine.includes("or merge authority")) return true;
  if (phrase === "merge authority" && lowerLine.includes("no stage b proposal record grants")) {
    return true;
  }
  if (phrase === "merge authority" && lowerLine.includes("is not approval authority")) {
    return true;
  }
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
