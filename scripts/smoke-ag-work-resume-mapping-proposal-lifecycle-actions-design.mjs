import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const smokePath = fileURLToPath(import.meta.url);
const lifecycleDocName =
  "AG_WORK_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTIONS_DESIGN_V0_1.md";
const lifecycleDocPath = path.join(rootDir, "docs", lifecycleDocName);
const packagePath = path.join(rootDir, "package.json");
const pointerDocPaths = [
  "docs/AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md",
  "docs/AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_WRITER_V0_1.md",
  "docs/AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_READ_V0_1.md",
  "docs/AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_READ_COCKPIT_PANEL_V0_1.md",
].map((relativePath) => path.join(rootDir, relativePath));

for (const file of [smokePath, lifecycleDocPath, packagePath, ...pointerDocPaths]) {
  assert.ok(existsSync(file), `${file} must exist`);
}

const smokeSource = readFileSync(smokePath, "utf8");
assertNoForbiddenSmokeSource(smokeSource);

const lifecycleDoc = readFileSync(lifecycleDocPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

assert.equal(
  packageJson.scripts?.[
    "smoke:ag-work-resume-mapping-proposal-lifecycle-actions-design"
  ],
  "node scripts/smoke-ag-work-resume-mapping-proposal-lifecycle-actions-design.mjs",
  "package.json must expose lifecycle actions design smoke",
);

for (const pattern of [
  /design-only/i,
  /adds no runtime behavior/i,
  /no DB migration/i,
  /no route/i,
  /no helper/i,
  /no UI/i,
  /no write authority/i,
  /no lifecycle writer/i,
  /no confirmed mapping/i,
  /no import/i,
  /no proof\/evidence recording/i,
  /no session binding/i,
  /no Codex execution/i,
  /no\s+approval, publish, retry, replay, merge/i,
]) {
  assert.match(lifecycleDoc, pattern, `status must include ${pattern}`);
}

for (const pattern of [
  /Lifecycle action semantics need to be designed before any update helper, route,\s+or Cockpit control exists/is,
  /Stage B proposal rows are review metadata only/i,
  /not confirmed mappings/i,
  /do not import context/i,
]) {
  assert.match(lifecycleDoc, pattern, `purpose must include ${pattern}`);
}

for (const definition of [
  /active proposal statuses.*`proposed`.*`needs_review`/is,
  /terminal or inactive proposal statuses.*`withdrawn`.*`rejected`.*`superseded`.*`expired`/is,
  /lifecycle action/i,
  /reviewer\/user-Core actor/i,
  /review note/i,
  /replacement proposal/i,
  /confirmed mapping.*separate future Stage C object/is,
]) {
  assert.match(lifecycleDoc, definition, `definitions must include ${definition}`);
}

const transitionSection = extractSection(lifecycleDoc, "Transition Model");
for (const transition of [
  "`proposed` -> `withdrawn`",
  "`proposed` -> `rejected`",
  "`proposed` -> `superseded`",
  "`proposed` -> `expired`",
  "`needs_review` -> `withdrawn`",
  "`needs_review` -> `rejected`",
  "`needs_review` -> `superseded`",
  "`needs_review` -> `expired`",
]) {
  assert.match(
    transitionSection,
    new RegExp(escapeRegExp(transition)),
    `transition model must include ${transition}`,
  );
}
for (const transitionRule of [
  /Terminal statuses do not transition further/i,
  /future separately gated\s+design allows correction or reopen behavior/is,
  /No transition ever means confirmed mapping/i,
  /No transition creates an import/i,
  /proof\/evidence record/i,
  /session binding/i,
  /Codex continuation/i,
  /merge/i,
]) {
  assert.match(
    transitionSection,
    transitionRule,
    `transition model must state ${transitionRule}`,
  );
}

assert.match(
  lifecycleDoc,
  /There is no proposal status named `confirmed`\.\s+This design does not add or\s+imply one\./is,
  "design must explicitly say there is no confirmed proposal status",
);
const statusDefinitionText = extractSection(lifecycleDoc, "Definitions");
assert.doesNotMatch(
  statusDefinitionText
    .split("\n")
    .filter((line) => line.trim().startsWith("- **active") || line.trim().startsWith("- **terminal"))
    .join("\n"),
  /`confirmed`/i,
  "active/terminal proposal status lists must not include confirmed",
);

for (const [heading, requirements] of [
  [
    "Withdraw",
    [
      /removed from active\s+consideration without saying the candidate mapping is wrong/is,
      /explicit reviewer\/user-Core actor/i,
      /reason or review note/i,
      /grants no confirmed mapping, import, proof\/evidence, session, Codex/i,
    ],
  ],
  [
    "Reject",
    [
      /candidate mapping should not\s+proceed/is,
      /explicit reviewer\/user-Core actor/i,
      /reason or review note/i,
      /grants no confirmed mapping, import, proof\/evidence, session, Codex/i,
    ],
  ],
  [
    "Supersede",
    [
      /later proposal replaces this proposal/i,
      /current partial unique index blocks duplicate active proposals/is,
      /same-tuple\s+supersede-with-replacement flow must be deliberately designed and likely\s+transactional/is,
      /DB\s+transaction/i,
      /replacement proposal id/i,
      /grants no confirmed mapping, import, proof\/evidence, session, Codex/i,
    ],
  ],
  [
    "Expire",
    [
      /`expires_at` is reached/i,
      /`expires_at` being in the past must not by itself imply an unauthorized write/i,
      /Automatic expiration, if ever added, requires a\s+separate user\/Core-gated design or maintenance-authority design/is,
      /grants no confirmed mapping, import, proof\/evidence, session, Codex/i,
    ],
  ],
]) {
  const section = extractSubsection(lifecycleDoc, heading);
  for (const requirement of requirements) {
    assert.match(section, requirement, `${heading} semantics must include ${requirement}`);
  }
}

const futureContractSection = extractSection(lifecycleDoc, "Future Update Contract Sketch");
for (const token of [
  "proposal_id",
  "action",
  "reviewed_by",
  "review_note",
  "reviewed_at",
  "replacement_proposal_id",
  "superseded_by_proposal_id",
]) {
  assert.match(
    futureContractSection,
    new RegExp(escapeRegExp(token)),
    `future update contract must include ${token}`,
  );
}
for (const requirement of [
  /non-implemented future input shape/i,
  /design-only/i,
  /must not be treated as a route, helper, schema, UI, or\s+runtime contract/is,
  /only to a\s+future supersede action/is,
  /DB transaction/i,
  /side-effect guards/i,
  /no unauthorized tables are written/i,
]) {
  assert.match(
    futureContractSection,
    requirement,
    `future update contract must include ${requirement}`,
  );
}

const dbSection = extractSection(lifecycleDoc, "DB Behavior");
for (const requirement of [
  /changes no DB schema/i,
  /creates no tables/i,
  /update only\s+`ag_work_resume_mapping_proposals` lifecycle and review fields/is,
  /`status`/i,
  /`reviewed_by`/i,
  /`reviewed_at`/i,
  /`review_note`/i,
  /`updated_at`/i,
  /`supersedes_proposal_id`/i,
  /`superseded_by_proposal_id`/i,
  /must not write confirmed mapping tables/i,
  /import tables/i,
  /proof\/evidence tables/i,
  /session tables/i,
  /Codex execution records/i,
  /bridge tables/i,
  /MCP\/App schema/i,
  /telemetry\/analytics storage/i,
  /preserve an audit trail/i,
]) {
  assert.match(dbSection, requirement, `DB behavior must include ${requirement}`);
}

const authoritySection = extractSection(lifecycleDoc, "Authority Boundary");
for (const requirement of [
  /No mapping confirmation/i,
  /No confirmed mapping object/i,
  /No import/i,
  /No imported context/i,
  /No work item or work event creation/i,
  /No proof\/evidence recording/i,
  /No proof\/evidence authorization/i,
  /No session binding/i,
  /No Codex execution or continuation/i,
  /No ChatGPT App card/i,
  /No MCP\/App schema change/i,
  /No bridge tool/i,
  /No Direct Resume Code/i,
  /No relay/i,
  /No telemetry, analytics, localStorage, sessionStorage, or indexedDB/i,
  /No approval, publish, retry, replay, merge/i,
  /Durable approval remains user\/Core gated/i,
]) {
  assert.match(
    authoritySection,
    requirement,
    `authority boundary must include ${requirement}`,
  );
}

const nonGoalsSection = extractSection(lifecycleDoc, "Non-Goals");
for (const requirement of [
  /No route\/helper\/UI/i,
  /No lifecycle writer/i,
  /No runtime behavior/i,
  /No DB schema or migration/i,
  /No confirmed mapping design/i,
  /No confirmed mapping implementation/i,
  /No import design/i,
  /No import implementation/i,
  /No proof\/evidence\/session reconciliation/i,
  /No Codex execution behavior/i,
  /No Direct Resume Code/i,
  /No relay/i,
  /No ChatGPT App, MCP\/App schema, or bridge behavior/i,
  /No telemetry, analytics, or browser persistence/i,
]) {
  assert.match(nonGoalsSection, requirement, `non-goals must include ${requirement}`);
}

const futurePrSection = extractSection(lifecycleDoc, "Future PR Sequence");
for (const requirement of [
  /Lifecycle design only: this PR/i,
  /Lifecycle update helper\/core: future, separately approved/i,
  /Lifecycle route: future, separately approved/i,
  /Cockpit lifecycle controls: future, separately approved/i,
  /Stage C confirmed mapping design: future, separately approved/i,
]) {
  assert.match(
    futurePrSection,
    requirement,
    `future PR sequence must include ${requirement}`,
  );
}

assert.match(
  extractSection(lifecycleDoc, "Browser Verification"),
  /browser verification skipped: no rendered UI\/operator surface changed in this design-only lifecycle slice/,
  "browser verification skip reason must be exact",
);

for (const pointerPath of pointerDocPaths) {
  const pointerSource = readFileSync(pointerPath, "utf8");
  assert.match(
    pointerSource,
    new RegExp(escapeRegExp(lifecycleDocName)),
    `${path.relative(rootDir, pointerPath)} must point to lifecycle actions design doc`,
  );
}

assertNoUnexpectedChangedFiles();
assertNoImplementationSqlOrRuntimeCode();

console.log(
  JSON.stringify(
    {
      smoke: "ag-work-resume-mapping-proposal-lifecycle-actions-design",
      cases: [
        "package script is present",
        "lifecycle design doc exists",
        "design-only status forbids runtime, route, helper, UI, schema, migration, and write authority",
        "definitions cover active and terminal statuses, lifecycle action, reviewer actor, review note, replacement proposal, and separate Stage C confirmed mapping",
        "transition model covers proposed/needs_review to withdrawn/rejected/superseded/expired",
        "transition model forbids confirmed proposal status and downstream authority",
        "withdraw, reject, supersede, and expire semantics are documented",
        "supersede discusses duplicate-active partial unique index and transactional replacement implications",
        "expiration does not authorize automatic writes",
        "future update contract sketch is non-implemented and requires transaction plus side-effect guards",
        "DB behavior is scoped to future ag_work_resume_mapping_proposals lifecycle/review fields only",
        "authority boundary and non-goals forbid mapping/import/proof/evidence/session/Codex/approval/publish/retry/replay/merge behavior",
        "existing Stage B docs point to the lifecycle design doc",
        "source guard limits changed files to docs, package.json, and this static smoke",
        "implementation guard rejects route/UI/runtime/schema/app/browser-persistence/network/tool changes",
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
    "docs/AG_WORK_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTIONS_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md",
    "docs/AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_WRITER_V0_1.md",
    "docs/AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_READ_V0_1.md",
    "docs/AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_READ_COCKPIT_PANEL_V0_1.md",
    "package.json",
    "scripts/smoke-ag-work-resume-mapping-proposal-lifecycle-actions-design.mjs",
  ]);
  const forbiddenPrefixes = [
    "app/",
    "apps/",
    "components/",
    "lib/",
    "migrations/",
    "reports/browser/",
  ];

  for (const file of changedFiles) {
    assert.ok(
      allowedFiles.has(file),
      `changed file is outside the design-only lifecycle slice: ${file}`,
    );
    assert.ok(
      !forbiddenPrefixes.some((prefix) => file.startsWith(prefix)),
      `design-only lifecycle slice must not touch runtime/UI/schema/browser report files: ${file}`,
    );
  }
}

function assertNoImplementationSqlOrRuntimeCode() {
  const changedFiles = [
    ...new Set([
      ...gitLines(["diff", "--name-only"]),
      ...gitLines(["diff", "--cached", "--name-only"]),
      ...gitLines(["ls-files", "--others", "--exclude-standard"]),
    ]),
  ];
  const implementationPrefixes = [
    "app/",
    "apps/",
    "components/",
    "lib/",
    "migrations/",
  ];
  const implementationFiles = changedFiles.filter((file) =>
    implementationPrefixes.some((prefix) => file.startsWith(prefix)),
  );
  assert.deepEqual(
    implementationFiles,
    [],
    "no implementation files may change in this lifecycle design slice",
  );

  for (const file of implementationFiles) {
    const source = readFileSync(path.join(rootDir, file), "utf8");
    for (const forbiddenSql of [
      /INSERT\s+INTO/i,
      /\bUPDATE\b/i,
      /\bDELETE\b/i,
      /\bDROP\b/i,
    ]) {
      assert.doesNotMatch(
        source,
        forbiddenSql,
        `implementation code must not include lifecycle SQL write ${forbiddenSql}`,
      );
    }
  }

  const forbiddenRouteOrReportFiles = changedFiles.filter(
    (file) =>
      file.includes("mapping-proposal-lifecycle") &&
      (file.startsWith("app/") ||
        file.startsWith("components/") ||
        file.startsWith("lib/") ||
        file.startsWith("reports/browser/")),
  );
  assert.deepEqual(
    forbiddenRouteOrReportFiles,
    [],
    "no lifecycle route/UI/runtime/browser verification report files may be added",
  );
}

function assertNoForbiddenSmokeSource(source) {
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

function extractSubsection(source, heading) {
  const pattern = new RegExp(
    `(?:^|\\n)### ${escapeRegExp(heading)}\\n([\\s\\S]*?)(?=\\n### |\\n## |$)`,
  );
  const match = source.match(pattern);
  assert.ok(match, `missing subsection ${heading}`);
  return match[1];
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
