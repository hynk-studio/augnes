import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const componentPath = path.join(rootDir, "components", "augnes-cockpit.tsx");
const docsPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_READ_COCKPIT_PANEL_V0_1.md",
);
const readDocsPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_READ_V0_1.md",
);
const routeDocsPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_ROUTE_V0_1.md",
);
const writerDocsPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_WRITER_V0_1.md",
);
const schemaDocsPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_DB_SCHEMA_IMPLEMENTATION_V0_1.md",
);
const reconciliationDocsPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_DESIGN_V0_1.md",
);
const gatesDocsPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_PROOF_EVIDENCE_SESSION_CODEX_GATES_DESIGN_V0_1.md",
);
const gateDocsPath = path.join(
  rootDir,
  "docs",
  "AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md",
);
const packagePath = path.join(rootDir, "package.json");
const browserReportPath = path.join(
  rootDir,
  "reports",
  "browser",
  "2026-06-01-ag-work-resume-proof-evidence-reconciliation-candidate-read-cockpit-panel-verification.md",
);

for (const file of [
  componentPath,
  docsPath,
  readDocsPath,
  routeDocsPath,
  writerDocsPath,
  schemaDocsPath,
  reconciliationDocsPath,
  gatesDocsPath,
  gateDocsPath,
  packagePath,
  browserReportPath,
]) {
  assert.ok(existsSync(file), `${file} must exist`);
}

const componentSource = readFileSync(componentPath, "utf8");
const docsSource = readFileSync(docsPath, "utf8");
const readDocsSource = readFileSync(readDocsPath, "utf8");
const routeDocsSource = readFileSync(routeDocsPath, "utf8");
const writerDocsSource = readFileSync(writerDocsPath, "utf8");
const schemaDocsSource = readFileSync(schemaDocsPath, "utf8");
const reconciliationDocsSource = readFileSync(reconciliationDocsPath, "utf8");
const gatesDocsSource = readFileSync(gatesDocsPath, "utf8");
const gateDocsSource = readFileSync(gateDocsPath, "utf8");
const browserReportSource = readFileSync(browserReportPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

assert.equal(
  packageJson.scripts?.[
    "smoke:ag-work-resume-proof-evidence-reconciliation-candidate-read-cockpit-panel"
  ],
  "node scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-read-cockpit-panel.mjs",
  "package.json must expose the reconciliation candidate read Cockpit panel smoke",
);

const panelSource = extractFunctionBlock(
  componentSource,
  "AgResumeReconciliationCandidateReadPanel",
);
const submitHandlerSource = extractFunctionBlock(
  panelSource,
  "handleReconciliationCandidateReadSubmit",
);
const queryBuilderSource = extractFunctionBlock(
  componentSource,
  "buildReconciliationCandidateReadSearchParams",
);
const resultSource = [
  extractFunctionBlock(
    componentSource,
    "AgResumeReconciliationCandidateReadResults",
  ),
  extractFunctionBlock(
    componentSource,
    "AgResumeReconciliationCandidateReadFilters",
  ),
  extractFunctionBlock(
    componentSource,
    "AgResumeReconciliationCandidateAuthorityBoundary",
  ),
  extractFunctionBlock(componentSource, "AgResumeReconciliationCandidateCard"),
].join("\n");
const fixtureSource = extractConstAssignment(
  componentSource,
  "SAFE_AG_RESUME_RECONCILIATION_CANDIDATE_REVIEW_FIXTURE",
);

assert.match(
  componentSource,
  /<AgResumeImportedContextReadPanel \/>[\s\S]*<AgResumeReconciliationCandidateCreatePanel \/>[\s\S]*<AgResumeReconciliationCandidateReadPanel \/>[\s\S]*<CoordinationEventTimeline\b/,
  "Operator tab must render the reconciliation candidate read panel near AG Resume imported context surfaces before the event timeline",
);

for (const token of [
  "AG Resume Reconciliation Candidate Review",
  "Read-only review over proof/evidence reconciliation candidate metadata.",
  "Read-only reconciliation candidate review metadata only.",
  "Candidate rows are not proof/evidence.",
  "Calls only the existing GET reconciliation candidates route.",
  "Not proof/evidence recording",
  "not session binding",
  "not Codex",
  "Not work item/event creation",
  "not imported context/confirmed\n            mapping/proposal mutation",
  "Not approval, publish, retry, replay, or merge authority.",
  "Durable\n            approval remains user/Core gated.",
  "candidateId",
  "importId",
  "mappingId",
  "foreignRefType",
  "foreignRefId",
  "localTargetScope",
  "localTargetWorkId",
  "status",
  "proposedBy",
  "reviewedBy",
  "limit",
  "Reconciliation candidate read route error",
]) {
  assert.match(panelSource, new RegExp(escapeRegExp(token)), `panel must include ${token}`);
}

assert.match(
  submitHandlerSource,
  /fetch\(\s*`\/api\/ag-work-resume\/proof-evidence-reconciliation-candidates\?\$\{searchParams\.toString\(\)\}`/,
  "panel must call the existing reconciliation candidates GET route",
);
assert.match(submitHandlerSource, /method:\s*"GET"/, "panel route call must use GET");
assert.doesNotMatch(submitHandlerSource, /method:\s*"POST"/, "panel must not POST");
assert.doesNotMatch(submitHandlerSource, /JSON\.stringify/, "panel must not build a write body");
assert.doesNotMatch(
  submitHandlerSource,
  /headers\s*:/,
  "panel GET must not set request headers",
);
assert.doesNotMatch(
  panelSource,
  /content-type/i,
  "panel GET must not set JSON content type",
);

const routeStrings = [
  ...panelSource.matchAll(/["'`]((?:\/api\/)[^"'`]+)["'`]/g),
].map((match) => match[1]);
assert.deepEqual(
  [...new Set(routeStrings)],
  [
    "/api/ag-work-resume/proof-evidence-reconciliation-candidates?${searchParams.toString()}",
  ],
  "panel must not reference any API route except reconciliation candidates GET",
);

assert.equal(
  [...panelSource.matchAll(/\bfetch\(/g)].length,
  1,
  "reconciliation candidate read panel must have exactly one route fetch",
);

for (const forbiddenRoute of [
  "/api/work",
  "/api/evidence",
  "/api/proof",
  "/api/session",
  "/api/sessions",
  "/api/publication",
  "/api/approval",
  "/api/codex",
  "/api/ag-work-resume/imported-contexts",
  "/api/ag-work-resume/mapping-proposal-records",
  "/api/ag-work-resume/confirmed-mappings",
  "/api/ag-work-resume/direct",
  "/api/ag-work-resume/resolve",
  "/api/ag-work-resume/relay",
  "bridge",
  "mcp/app",
  "direct resume code",
]) {
  assert.doesNotMatch(
    routeStrings.join("\n"),
    new RegExp(escapeRegExp(forbiddenRoute), "i"),
    `panel API route strings must not reference ${forbiddenRoute}`,
  );
}
for (const forbiddenStorage of [
  "localStorage",
  "sessionStorage",
  "indexedDB",
  "telemetry",
  "analytics",
]) {
  assert.doesNotMatch(
    panelSource,
    new RegExp(escapeRegExp(forbiddenStorage), "i"),
    `panel source must not reference ${forbiddenStorage}`,
  );
}

for (const accessibilityToken of [
  'htmlFor="ag-resume-reconciliation-candidate-candidate-id-input"',
  'htmlFor="ag-resume-reconciliation-candidate-import-id-input"',
  'htmlFor="ag-resume-reconciliation-candidate-mapping-id-input"',
  'htmlFor="ag-resume-reconciliation-candidate-foreign-ref-type-input"',
  'htmlFor="ag-resume-reconciliation-candidate-foreign-ref-id-input"',
  'htmlFor="ag-resume-reconciliation-candidate-local-target-scope-input"',
  'htmlFor="ag-resume-reconciliation-candidate-local-target-work-id-input"',
  'htmlFor="ag-resume-reconciliation-candidate-status-input"',
  'htmlFor="ag-resume-reconciliation-candidate-proposed-by-input"',
  'htmlFor="ag-resume-reconciliation-candidate-reviewed-by-input"',
  'htmlFor="ag-resume-reconciliation-candidate-limit-input"',
  'id="ag-resume-reconciliation-candidate-candidate-id-input"',
  'id="ag-resume-reconciliation-candidate-import-id-input"',
  'id="ag-resume-reconciliation-candidate-mapping-id-input"',
  'id="ag-resume-reconciliation-candidate-foreign-ref-type-input"',
  'id="ag-resume-reconciliation-candidate-foreign-ref-id-input"',
  'id="ag-resume-reconciliation-candidate-local-target-scope-input"',
  'id="ag-resume-reconciliation-candidate-local-target-work-id-input"',
  'id="ag-resume-reconciliation-candidate-status-input"',
  'id="ag-resume-reconciliation-candidate-proposed-by-input"',
  'id="ag-resume-reconciliation-candidate-reviewed-by-input"',
  'id="ag-resume-reconciliation-candidate-limit-input"',
  "aria-describedby",
  'role="alert"',
  "aria-busy",
  "<input",
  "<select",
  "<button",
]) {
  assert.match(
    panelSource,
    new RegExp(escapeRegExp(accessibilityToken)),
    `panel must include accessibility token ${accessibilityToken}`,
  );
}

for (const [groupLabel, headingId] of [
  [
    "Reconciliation candidate safe fixture controls",
    "ag-resume-reconciliation-candidate-safe-fixtures-heading",
  ],
  [
    "Reconciliation candidate lookup inputs",
    "ag-resume-reconciliation-candidate-inputs-heading",
  ],
  [
    "Reconciliation candidate read controls",
    "ag-resume-reconciliation-candidate-action-controls-heading",
  ],
]) {
  assert.match(
    panelSource,
    new RegExp(`role="group"[\\s\\S]*?aria-labelledby="${headingId}"`),
    `${groupLabel} must be a labelled control group`,
  );
  assert.match(
    panelSource,
    new RegExp(`id="${headingId}"[\\s\\S]*?${escapeRegExp(groupLabel)}`),
    `${groupLabel} heading must be visible`,
  );
}

assert.match(
  resultSource,
  /aria-live="polite"/,
  "result section must use aria-live polite",
);
assert.match(
  resultSource,
  /aria-labelledby="ag-resume-reconciliation-candidate-read-result-heading"/,
  "result section must have a stable labelled heading",
);

for (const queryToken of [
  "candidate_id fetch must not be combined with list filters or limit.",
  "foreign_ref_type and foreign_ref_id must be supplied together.",
  "local_target_scope and local_target_work_id must be supplied together.",
  "At least one reconciliation candidate read filter is required",
  "limit must be a positive integer.",
  'searchParams.set("import_id"',
  'searchParams.set("mapping_id"',
  'searchParams.set("foreign_ref_type"',
  'searchParams.set("foreign_ref_id"',
  'searchParams.set("local_target_scope"',
  'searchParams.set("local_target_work_id"',
  'searchParams.set("status"',
  'searchParams.set("proposed_by"',
  'searchParams.set("reviewed_by"',
  'searchParams.set("limit"',
]) {
  assert.match(
    queryBuilderSource,
    new RegExp(escapeRegExp(queryToken)),
    `query builder must include ${queryToken}`,
  );
}
assert.doesNotMatch(queryBuilderSource, /\bfetch\(/, "query builder must not fetch");
assert.doesNotMatch(queryBuilderSource, /\/api\//, "query builder must not call routes");

for (const fixtureToken of [
  "SAFE_AG_RESUME_RECONCILIATION_CANDIDATE_REVIEW_FIXTURE",
  "ag-resume-proof-evidence-reconciliation-candidate:",
  "ag-resume-imported-context:",
  "ag-resume-confirmed-mapping:",
  "proof",
  "proof:foreign-public-safe:reconciliation-candidate-read-001",
  "project:augnes",
  "AG-FIXTURE-RECONCILIATION-CANDIDATE-READ-LOCAL-001",
  "proposed",
  "user-core:reconciliation-candidate-read-cockpit-panel",
  "user-core:reconciliation-candidate-reviewer-cockpit-panel",
  "20",
]) {
  assert.match(
    fixtureSource,
    new RegExp(escapeRegExp(fixtureToken)),
    `fixture must include ${fixtureToken}`,
  );
}

for (const localFunctionName of [
  "loadSafeReconciliationCandidateIdFixture",
  "loadSafeReconciliationCandidateImportFixture",
  "loadSafeReconciliationCandidateMappingFixture",
  "loadSafeReconciliationCandidateForeignRefFixture",
  "loadSafeReconciliationCandidateLocalTargetFixture",
  "loadSafeReconciliationCandidateStatusFixture",
  "loadSafeReconciliationCandidateProposedByFixture",
  "loadSafeReconciliationCandidateReviewedByFixture",
  "clearReconciliationCandidateInputs",
]) {
  const source = extractFunctionBlock(panelSource, localFunctionName);
  assert.doesNotMatch(source, /\bfetch\(/, `${localFunctionName} must not fetch`);
  assert.doesNotMatch(source, /\/api\//, `${localFunctionName} must not call routes`);
  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB/i);
}

for (const buttonLabel of [
  "Load safe candidate lookup",
  "Load safe import lookup",
  "Load safe mapping lookup",
  "Load safe foreign ref lookup",
  "Load safe local target lookup",
  "Load safe status lookup",
  "Load safe proposer lookup",
  "Load safe reviewer lookup",
  "Clear reconciliation candidate inputs",
  "Read reconciliation candidates",
]) {
  assert.match(
    panelSource,
    new RegExp(`>\\s*${escapeRegExp(buttonLabel)}\\s*<|\\?\\s*"Reading reconciliation candidates"\\s*:\\s*"Read reconciliation candidates"`),
    `panel must include button label ${buttonLabel}`,
  );
}

for (const forbiddenLabel of [
  "Create candidate",
  "Record evidence",
  "Record proof",
  "Bind session",
  "Execute Codex",
  "Create work item",
  "Approve",
  "Publish",
  "Retry",
  "Replay",
  "Merge",
]) {
  assert.doesNotMatch(
    panelSource,
    new RegExp(`>\\s*${escapeRegExp(forbiddenLabel)}\\s*<`, "i"),
    `panel must not expose forbidden button label ${forbiddenLabel}`,
  );
}

for (const resultToken of [
  "HTTP Status",
  "Route ok",
  "Reader status",
  "Record count",
  "Applied filters",
  "Warnings",
  "Failures",
  "Read Authority Boundary",
  "Record Authority Boundary",
  "review_metadata_only",
  "candidate_id",
  "import_id",
  "mapping_id",
  "foreign_ref_type",
  "foreign_ref_id",
  "local_target_scope",
  "local_target_work_id",
  "summary",
  "redaction_status",
  "proposed_by",
  "proposed_reason",
  "reviewed_by",
  "reviewed_at",
  "review_note",
  "status",
  "created_at",
  "updated_at",
  "proof_recorded",
  "evidence_recorded",
  "session_bound",
  "codex_executed",
  "work_item_created",
  "work_event_created",
  "imported_context_updated",
  "confirmed_mapping_updated",
  "proposal_record_updated",
  "approval_granted",
  "publish_retry_replay_authority",
  "merge_authority",
]) {
  assert.match(
    resultSource,
    new RegExp(escapeRegExp(resultToken)),
    `result output must include ${resultToken}`,
  );
}

for (const docsToken of [
  "AG Work Resume Proof Evidence Reconciliation Candidate Read Cockpit Panel v0.1",
  "read-only Cockpit Operator panel",
  "GET /api/ag-work-resume/proof-evidence-reconciliation-candidates",
  "read-only reconciliation candidate review metadata only",
  "Candidate rows are not proof/evidence",
  "candidate_id",
  "import_id",
  "mapping_id",
  "foreign_ref_type",
  "foreign_ref_id",
  "local_target_scope",
  "local_target_work_id",
  "status",
  "proposed_by",
  "reviewed_by",
  "limit",
  "Load safe candidate lookup",
  "Read reconciliation candidates",
  "Candidate cards render",
  "role=\"alert\"",
  "aria-live=\"polite\"",
  "No create controls",
  "No update route",
  "No delete route",
  "No lifecycle mutation",
  "No proof/evidence recording",
  "No session binding",
  "No Codex execution",
  "No schema or migration",
  "No ChatGPT App, MCP/App schema, or bridge tool changes",
  "No telemetry, analytics, localStorage, sessionStorage, or indexedDB",
  "No approval, publish, retry, replay, merge",
  "Browser Verification Requirement",
  "network proof",
  "DB side-effect proof",
]) {
  assert.match(docsSource, new RegExp(escapeRegExp(docsToken)), `docs must include ${docsToken}`);
}

for (const pointerDocs of [
  readDocsSource,
  routeDocsSource,
  writerDocsSource,
  schemaDocsSource,
  reconciliationDocsSource,
  gatesDocsSource,
  gateDocsSource,
]) {
  assert.match(
    pointerDocs,
    /AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_READ_COCKPIT_PANEL_V0_1\.md/,
    "pointer docs must link to the reconciliation candidate read Cockpit panel doc",
  );
}

for (const reportToken of [
  "AG Resume proof/evidence reconciliation candidate read Cockpit panel",
  "Codex in-app Browser",
  "GET /api/ag-work-resume/proof-evidence-reconciliation-candidates",
  "candidate_id",
  "import_id",
  "mapping_id",
  "foreign_ref_type",
  "local_target_scope",
  "status",
  "proposed_by",
  "reviewed_by",
  "network proof",
  "request body length was `0`",
  "no read call sent a JSON `Content-Type` header",
  "DB side-effect proof",
  "ag_work_resume_proof_evidence_reconciliation_candidates",
  "No unauthorized controls",
  "Result: passed",
]) {
  assert.match(
    browserReportSource,
    new RegExp(escapeRegExp(reportToken), "i"),
    `browser report must include ${reportToken}`,
  );
}

assertChangedFilesGuard();

console.log("PASS ag work resume proof/evidence reconciliation candidate read cockpit panel smoke");

function assertChangedFilesGuard() {
  const changedFiles = new Set([
    ...gitLines(["diff", "--name-only"]),
    ...gitLines(["diff", "--cached", "--name-only"]),
    ...gitLines(["ls-files", "--others", "--exclude-standard"]),
  ]);
  const allowedFiles = new Set([
    "components/augnes-cockpit.tsx",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_CREATE_COCKPIT_PANEL_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_READ_COCKPIT_PANEL_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_READ_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_ROUTE_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_WRITER_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_DB_SCHEMA_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_DB_SCHEMA_IMPLEMENTATION_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_SESSION_CODEX_GATES_DESIGN_V0_1.md",
    "docs/AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_READ_V0_1.md",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_ROUTE_V0_1.md",
    "docs/AG_WORK_RESUME_IMPORTED_CONTEXT_WRITER_V0_1.md",
    "reports/browser/2026-06-01-ag-work-resume-proof-evidence-reconciliation-candidate-create-cockpit-panel-verification.md",
    "reports/browser/2026-06-01-ag-work-resume-proof-evidence-reconciliation-candidate-read-cockpit-panel-verification.md",
    "reports/browser/2026-06-01-ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-verification.md",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-create-cockpit-panel.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-read-cockpit-panel.mjs",
    "app/api/ag-work-resume/proof-evidence-reconciliation-candidates/lifecycle-actions/route.ts",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_LIFECYCLE_ACTIONS_V0_1.md",
    "docs/AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_LIFECYCLE_ACTION_COCKPIT_PANEL_V0_1.md",
    "lib/ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action.ts",
    "scripts/ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action-route.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action-cockpit-panel.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-read.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-route.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-writer.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-candidate-db-schema.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-reconciliation-design.mjs",
    "scripts/smoke-ag-work-resume-proof-evidence-session-codex-gates-design.mjs",
    "scripts/smoke-ag-work-resume-imported-context-route.mjs",
    "scripts/smoke-ag-work-resume-imported-context-writer.mjs",
    "scripts/smoke-ag-work-resume-mapping-import-authority-gate.mjs",
    "package.json",
  ]);
  for (const file of changedFiles) {
    assert.ok(
      allowedFiles.has(file),
      `changed file is outside reconciliation candidate read Cockpit panel slice: ${file}`,
    );
    assert.ok(
      file ===
        "app/api/ag-work-resume/proof-evidence-reconciliation-candidates/lifecycle-actions/route.ts" ||
        !file.startsWith("app/"),
      `app changes limited to candidate lifecycle route: ${file}`,
    );
    assert.equal(file.startsWith("apps/"), false, `no MCP/App change: ${file}`);
    assert.equal(file.startsWith("migrations/"), false, `no migration change: ${file}`);
    assert.ok(
      file === "lib/ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action.ts" ||
        !file.startsWith("lib/"),
      `lib changes limited to candidate lifecycle core: ${file}`,
    );
    assert.ok(
      file === "components/augnes-cockpit.tsx" || !file.startsWith("components/"),
      `component changes limited to the Cockpit panel: ${file}`,
    );
    assert.ok(
      file ===
        "reports/browser/2026-06-01-ag-work-resume-proof-evidence-reconciliation-candidate-read-cockpit-panel-verification.md" ||
        file ===
          "reports/browser/2026-06-01-ag-work-resume-proof-evidence-reconciliation-candidate-create-cockpit-panel-verification.md" ||
        file ===
          "reports/browser/2026-06-01-ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-verification.md" ||
        !file.startsWith("reports/browser/"),
      `browser report changes limited to reconciliation candidate read Cockpit panel: ${file}`,
    );
  }
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

function extractFunctionBlock(source, functionName) {
  const signature = `function ${functionName}`;
  const start = source.indexOf(signature);
  assert.notEqual(start, -1, `${functionName} must exist`);
  const bodyStartMatch = source.slice(start).match(/\)\s*\{/);
  assert.ok(bodyStartMatch, `${functionName} must have a body`);
  const openBrace =
    start + bodyStartMatch.index + bodyStartMatch[0].lastIndexOf("{");
  return source.slice(start, findMatchingBrace(source, openBrace) + 1);
}

function extractConstAssignment(source, constName) {
  const signature = `const ${constName}`;
  const start = source.indexOf(signature);
  assert.notEqual(start, -1, `${constName} must exist`);
  const end = source.indexOf("} as const;", start);
  assert.notEqual(end, -1, `${constName} must end with as const`);
  return source.slice(start, end + "} as const;".length);
}

function findMatchingBrace(source, openBrace) {
  let depth = 0;
  let quote = null;
  let escaped = false;

  for (let index = openBrace; index < source.length; index += 1) {
    const char = source[index];

    if (quote) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === "\\") {
        escaped = true;
        continue;
      }
      if (char === quote) quote = null;
      continue;
    }

    if (char === "\"" || char === "'" || char === "`") {
      quote = char;
      continue;
    }
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  assert.fail("No matching brace found");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
