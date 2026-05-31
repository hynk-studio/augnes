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
  "AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md",
);
const packagePath = path.join(rootDir, "package.json");

assert.ok(existsSync(docsPath), "mapping/import authority-gate doc must exist");
assert.ok(existsSync(packagePath), "package.json must exist");

const smokeSource = readFileSync(smokePath, "utf8");
assertNoForbiddenSmokeImports(smokeSource);

const docsSource = readFileSync(docsPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

assert.equal(
  packageJson.scripts?.["smoke:ag-work-resume-mapping-import-authority-gate"],
  "node scripts/smoke-ag-work-resume-mapping-import-authority-gate.mjs",
  "package.json must expose mapping/import authority-gate smoke",
);

for (const pattern of [
  /design-only/i,
  /proposal and authority contract/i,
  /adds no implementation/i,
  /no runtime behavior/i,
  /no schema/i,
  /no API route/i,
  /no UI control/i,
  /no import/i,
  /no persistence/i,
  /no mapping record creation/i,
  /no work item creation/i,
  /no proof\/evidence recording/i,
  /no session binding/i,
  /no Codex execution/i,
  /no approval, publish, retry, replay, merge, or committed-state mutation/i,
]) {
  assert.match(docsSource, pattern, `design doc must state status boundary ${pattern}`);
}

for (const definition of [
  /AG Resume Packet/i,
  /foreign work id/i,
  /local work id/i,
  /foreign ref/i,
  /local mapping/i,
  /mapping proposal/i,
  /confirmed mapping/i,
  /imported resume context/i,
  /user\/Core approval/i,
  /proof\/evidence authorization/i,
  /session binding authorization/i,
  /execution authority/i,
]) {
  assert.match(docsSource, definition, `design doc must define ${definition}`);
}

for (const requiredStatement of [
  /mapping proposal.*review metadata only/is,
  /confirmed mapping.*requires\s+explicit user\/Core action/is,
  /Import requires\s+explicit user\/Core action/is,
  /Imported context is not\s+proof\/evidence/is,
  /Imported context is not committed state authority/is,
  /Imported context does not imply user\/Core approval/is,
  /imported context is not proof, not\s+evidence, not approval, and not source of truth/is,
  /Foreign refs remain foreign/i,
  /Codex execution remains separate/i,
]) {
  assert.match(
    docsSource,
    requiredStatement,
    `design doc must include authority statement ${requiredStatement}`,
  );
}

for (const allowedBehavior of [
  /validate a packet with `ag:resume-preflight`/i,
  /build a read-only packet preview/i,
  /run the target preview pure checker/i,
  /run the local target preview helper/i,
  /call the read-only target preview route/i,
  /use the Cockpit panel to paste packet\/local context/i,
  /load safe synthetic fixtures/i,
  /validate pasted packet only with `local: null`, `strict: true`, and\s+`skip_preflight: false`/i,
  /accessibility, and keyboard-readiness\s+states/i,
  /All of the above behavior is read-only/i,
]) {
  assert.match(
    docsSource,
    allowedBehavior,
    `design doc must list current read-only behavior ${allowedBehavior}`,
  );
}

for (const forbiddenBehavior of [
  /no automatic local work item creation/i,
  /no automatic mapping creation/i,
  /no automatic import\/persistence/i,
  /no proof\/evidence recording/i,
  /no session binding/i,
  /no Codex execution/i,
  /no approval, publish, retry, replay, external posting, merge, or auto-merge/i,
  /no committed-state mutation/i,
  /no Direct Resume Code route/i,
  /no relay/i,
  /no use of foreign proof\/evidence\/session refs as local proof\/evidence\/session\s+records/i,
  /no treatment of route `ok` or preview `ok_to_continue` as implementation\s+authority/i,
]) {
  assert.match(
    docsSource,
    forbiddenBehavior,
    `design doc must list forbidden behavior ${forbiddenBehavior}`,
  );
}

for (const stage of [
  /Stage A: mapping proposal preview/i,
  /Stage B: mapping proposal record/i,
  /Stage C: confirmed mapping record/i,
  /Stage D: imported resume context record/i,
  /Stage E: optional local work item creation/i,
  /Stage F: optional proof\/evidence\/session reconciliation/i,
  /Stage G: optional Codex continuation/i,
  /No stage implies the next stage/i,
  /Each write stage requires separate user\/Core\s+approval/i,
]) {
  assert.match(docsSource, stage, `design doc must define future stage ${stage}`);
}

for (const previewShapeToken of [
  "packet_foreign_work",
  "candidate_local_work",
  "match_confidence",
  "comparison_summary",
  "conflicts",
  "gaps",
  "required_user_core_questions",
  "recommended_next_step",
  "authority_boundary",
  "foreign_refs_summary",
]) {
  assert.match(
    docsSource,
    new RegExp(escapeRegExp(previewShapeToken)),
    `mapping proposal preview shape must include ${previewShapeToken}`,
  );
}

for (const mappingRecordToken of [
  "mapping_id",
  "foreign_scope",
  "foreign_work_id",
  "local_scope",
  "local_work_id",
  "packet_id",
  "packet_hash",
  "source_runtime_instance_id",
  "confirmed_by",
  "confirmed_at",
  "confirmation_reason",
  "status",
  "supersedes_mapping_id",
  "authority_boundary",
  "created_at",
  "updated_at",
]) {
  assert.match(
    docsSource,
    new RegExp(escapeRegExp(mappingRecordToken)),
    `future mapping record shape must include ${mappingRecordToken}`,
  );
}
assert.match(
  docsSource,
  /future persisted confirmed mapping record shape, not implemented in\s+this PR/is,
  "mapping record shape must be marked future-only",
);
assert.match(
  docsSource,
  /does not create proof\/evidence\/session records/i,
  "mapping record must not create proof/evidence/session records",
);
assert.match(
  docsSource,
  /does not\s+import packet content by itself/i,
  "mapping record must not import packet content by itself",
);
assert.match(
  docsSource,
  /does not authorize Codex execution/i,
  "mapping record must not authorize Codex execution",
);

for (const importRecordToken of [
  "import_id",
  "mapping_id",
  "packet_id",
  "packet_hash",
  "source_runtime_instance_id",
  "imported_summary",
  "imported_expected_files",
  "imported_expected_checks",
  "foreign_refs_summary",
  "redaction_report",
  "created_by",
  "created_at",
  "status",
  "authority_boundary",
]) {
  assert.match(
    docsSource,
    new RegExp(escapeRegExp(importRecordToken)),
    `future imported context record shape must include ${importRecordToken}`,
  );
}
assert.match(
  docsSource,
  /future persisted imported resume context record shape, not\s+implemented in this PR/is,
  "imported context record shape must be marked future-only",
);
assert.match(
  docsSource,
  /Imported context is review metadata only/i,
  "imported context must be review metadata only",
);
assert.match(
  docsSource,
  /Imported context does not start\s+Codex/i,
  "imported context must not start Codex",
);

for (const invalidHandling of [
  /Malformed packet JSON must fail before any route, mapping, or import path/i,
  /Preflight-failing packets must not be mapped\/imported/i,
  /previously failing packet can only be reconsidered after a corrected packet\s+passes preflight/is,
  /preserve packet provenance or clearly\s+create a new packet id\/hash/is,
  /must not silently apply\s+corrections/is,
  /User\/Core must decide whether a corrected packet is acceptable/i,
]) {
  assert.match(
    docsSource,
    invalidHandling,
    `design doc must explain invalid packet handling ${invalidHandling}`,
  );
}

for (const foreignRefHandling of [
  /Foreign action, evidence, evidence-pack, proof, and session refs remain\s+foreign/is,
  /Local proof\/evidence\/session records are never created automatically/i,
  /requires separate design and user\/Core\s+authorization/i,
  /Foreign refs may be displayed as context only/i,
  /Foreign refs may\s+be used as source refs only if a future design defines that safely/is,
]) {
  assert.match(
    docsSource,
    foreignRefHandling,
    `design doc must explain foreign ref reconciliation ${foreignRefHandling}`,
  );
}

for (const codexGate of [
  /Codex cannot start automatically/i,
  /local runtime endpoint/i,
  /`CODEX_SCOPE`/i,
  /`CODEX_WORK_ID`/i,
  /successful `npm run codex:read-brief`/i,
  /expected files\/checks/i,
  /explicit evidence\/proof\/session authorization choices/i,
  /stop conditions/i,
  /Failed `codex:read-brief` means stop/i,
  /PR creation is not merge authority/i,
  /Proof is not approval/i,
]) {
  assert.match(docsSource, codexGate, `design doc must include Codex gate ${codexGate}`);
}

for (const uxPrinciple of [
  /Default to preview-only/i,
  /Visually separate write actions from read-only previews/i,
  /explicit user\/Core confirmation copy/i,
  /Do not hide writes/i,
  /Do not call write routes from preview buttons/i,
  /Avoid ambiguous labels such as `Resume`/i,
  /`Propose mapping`/i,
  /`Confirm mapping`/i,
  /`Import context`/i,
  /disabled states and warnings/i,
  /Preserve accessibility and keyboard behavior/i,
]) {
  assert.match(docsSource, uxPrinciple, `design doc must include UX principle ${uxPrinciple}`);
}

for (const checklistItem of [
  /changed files/i,
  /authority boundary statement/i,
  /schema changes: yes\/no/i,
  /route changes: yes\/no/i,
  /write route: yes\/no/i,
  /DB migration: yes\/no/i,
  /proof\/evidence writes: yes\/no/i,
  /session binding: yes\/no/i,
  /work item creation: yes\/no/i,
  /mapping record creation: yes\/no/i,
  /import record creation: yes\/no/i,
  /Codex execution: yes\/no/i,
  /approval\/publish\/retry\/replay\/merge: yes\/no/i,
  /browser verification required if UI changes/i,
  /smoke coverage/i,
  /skipped checks with concrete reasons/i,
  /user\/Core judgment questions/i,
]) {
  assert.match(
    docsSource,
    checklistItem,
    `future PR checklist must include ${checklistItem}`,
  );
}

for (const nonGoal of [
  /no implementation in this PR/i,
  /no routes/i,
  /no DB\/schema changes/i,
  /no UI/i,
  /no import/i,
  /no persistence/i,
  /no mapping records/i,
  /no work item creation/i,
  /no Direct Resume Code/i,
  /no relay/i,
  /no proof\/evidence\/session\/Codex\/approval\/merge authority/i,
]) {
  assert.match(docsSource, nonGoal, `non-goals must include ${nonGoal}`);
}

assert.doesNotMatch(
  docsSource,
  /This PR implements (?:mapping|import|persistence)/i,
  "design doc must not claim this PR implements mapping/import/persistence",
);
assert.doesNotMatch(
  docsSource,
  /This document authorizes implementation/i,
  "design doc must not authorize implementation",
);

for (const forbiddenPhrase of [
  "automatic import",
  "auto import",
  "automatically creates local work item",
  "starts Codex",
  "executes Codex",
  "grants approval",
  "merge authority",
  "proof is approval",
  "imported context is evidence",
  "imported context is committed state",
]) {
  assertForbiddenPhraseIsNegated(docsSource, forbiddenPhrase);
}

console.log(
  JSON.stringify(
    {
      smoke: "ag-work-resume-mapping-import-authority-gate",
      cases: [
        "design doc exists",
        "package script is present",
        "smoke source imports only Node built-ins and no runtime helpers",
        "design doc is design-only and no implementation",
        "definitions cover mapping, import, foreign refs, user/Core approval, and execution authority",
        "current allowed behavior remains read-only",
        "forbidden behavior remains explicit",
        "future stages A through G are separate gates",
        "future mapping proposal preview shape is read-only",
        "future mapping record shape is future-only and non-authorizing",
        "future imported context record shape is future-only and review metadata only",
        "invalid/preflight-failing packet handling is fail-closed",
        "foreign ref reconciliation stays separate",
        "Codex continuation requires codex:read-brief",
        "future UI principles preserve preview-only and accessibility boundaries",
        "future PR checklist is present",
        "non-goals are repeated",
        "forbidden phrases are absent or explicitly negated",
      ],
    },
    null,
    2,
  ),
);

function assertNoForbiddenSmokeImports(source) {
  const imports = [...source.matchAll(/import\s+[^;]*?\s+from\s+["']([^"']+)["']/g)].map(
    (match) => match[1],
  );
  for (const specifier of imports) {
    assert.ok(
      specifier.startsWith("node:"),
      `smoke source must import Node built-ins only, got ${specifier}`,
    );
    assert.ok(
      ![
        "node:child_process",
        "node:http",
        "node:https",
        "node:net",
        "node:tls",
        "node:dgram",
      ].includes(specifier),
      `smoke source must not import network/process module ${specifier}`,
    );
  }
  assert.doesNotMatch(source, /from\s+["'][^"']*route(?:\.ts|\.js)?["']/);
  assert.doesNotMatch(source, /from\s+["'][^"']*(?:db|database|runtime)[^"']*["']/i);
  for (const token of [
    "open" + "Database",
    "better" + "-sqlite3",
    "fetch" + "(",
  ]) {
    assert.ok(
      !source.includes(token),
      `smoke source must not reference ${token}`,
    );
  }
}

function assertForbiddenPhraseIsNegated(source, phrase) {
  const normalizedPhrase = phrase.toLowerCase();
  const paragraphs = source
    .split(/\n\s*\n|[.!?]\s+/)
    .map((part) => part.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const matches = paragraphs.filter((part) =>
    part.toLowerCase().includes(normalizedPhrase),
  );
  for (const match of matches) {
    assert.match(
      match,
      /\b(no|none|not|never|forbidden|non-goal|non-goals|does not|do not|must not|is not)\b/i,
      `forbidden phrase "${phrase}" must be explicitly negated when mentioned: ${match}`,
    );
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
