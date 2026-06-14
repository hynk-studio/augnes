import assert from "node:assert/strict";
import {
  assertChangedFilesWithin,
  assertContainsAll,
  assertNoRuntimeImports,
  assertPackageScript,
  collectUntrackedFiles,
  loadTextByFile,
  normalizeText,
  uniqueSorted,
} from "./smoke-boundary-common.mjs";

const typeFile = "types/codex-execution-record.ts";
const designDoc = "docs/CODEX_SDK_EXECUTION_AUTHORITY_DESIGN_V0_1.md";
const indexDoc = "docs/00_INDEX_LATEST.md";
const packageJsonFile = "package.json";
const smokeFile = "scripts/smoke-codex-execution-record-boundary.mjs";
const designSmokeFile = "scripts/smoke-codex-sdk-execution-authority-design.mjs";

const inspectedFiles = [
  typeFile,
  designDoc,
  indexDoc,
  packageJsonFile,
  smokeFile,
];

const allowedChangedFiles = new Set([
  ...inspectedFiles,
  designSmokeFile,
]);

const requiredExportedTypes = [
  "CodexExecutionIntent",
  "CodexPermissionProfile",
  "CodexExecutionRequest",
  "CodexExecutionResult",
  "CodexUserApprovalRecord",
  "CodexEvidenceLink",
  "CodexExecutionProviderBoundary",
  "CodexExecutionStatus",
  "CodexExecutionHostProvenance",
  "CodexExecutionRiskRecord",
  "CodexExecutionCheckResult",
  "CodexExecutionResumePointer",
];

const permissionProfileLiterals = [
  '"read_only"',
  '"workspace_write"',
  '"network_limited"',
  '"full_access"',
  '"danger_full_access"',
];

const statusLiterals = [
  '"planned"',
  '"approval_required"',
  '"approved"',
  '"denied"',
  '"running"',
  '"succeeded"',
  '"failed"',
  '"interrupted"',
  '"skipped"',
  '"superseded"',
];

const conceptualFields = [
  "intent_id",
  "work_id",
  "repo",
  "base_branch",
  "working_branch",
  "task_goal",
  "thread_id",
  "run_id",
  "permission_profile",
  "requested_capability",
  "risk_note",
  "rollback_or_reversibility_note",
  "user_approval",
  "result_summary",
  "changed_files",
  "checks",
  "evidence_links",
  "ag_resume_ref",
  "project_constellation_ref",
  "perspective_capsule_ref",
  "next_action_candidates",
  "skipped_reason",
  "host_provenance",
];

const userApprovalFields = [
  "approval_id",
  "approved_by",
  "approved_at",
  "permission_profile",
  "scope",
  "risk_note",
  "user_responsibility_acknowledged",
];

const executionResultFields = [
  "status",
  "result_summary",
  "changed_files",
  "checks",
  "evidence_links",
  "interruption_reason",
  "next_resume_candidate",
];

const evidencePointerPhrases = [
  "pointer_only",
  "pointer only",
  "not proof/evidence/readiness write authority",
  "proof_evidence_write_authority: false",
  "readiness_write_authority: false",
];

const boundaryPhrases = [
  "type-only Codex execution record boundary",
  "not runtime schema",
  "not DB schema",
  "not API contract",
  "not MCP/App tool contract",
  "not proof/evidence write authority",
  "no live SDK call",
  "no provider implementation",
  "no runtime execution",
  "not source-of-truth",
  "does not implement MockCodexExecutionProvider or",
  "RealCodexSdkExecutionProvider",
];

const forbiddenPositiveAuthoritySelfTests = [
  "A future Codex execution record may merge without approval.",
  "A provider may call SDK without approval.",
  "A boundary may record proof without evidence gate approval.",
];

const allowedBoundarySelfTests = [
  "No execution record may merge without separate approval.",
  "No provider may call SDK without separate approval.",
];

const textByFile = loadTextByFile(inspectedFiles);
const typeText = textByFile.get(typeFile);

assertAuthorityClassifierSelfTests();
assertPackageJsonScript();
assertTypeExports();
assertTypeFileBoundary();
assertRequiredTypeContent();
assertDocPointers();
assertNoStaleTypeBoundaryClaims();
assertSmokeScriptBoundary();
const changedFilesBoundary = assertChangedFilesBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "codex-execution-record-boundary",
      pass: true,
      boundary_smoke_mode: changedFilesBoundary.mode,
      type_file_checked: typeFile,
      docs_checked: [designDoc, indexDoc],
      package_script_checked: true,
      exported_types_checked: requiredExportedTypes.length,
      permission_profile_literals_checked: permissionProfileLiterals.length,
      status_literals_checked: statusLiterals.length,
      conceptual_fields_checked: conceptualFields.length,
      user_approval_fields_checked: userApprovalFields.length,
      execution_result_fields_checked: executionResultFields.length,
      evidence_pointer_semantics_checked: true,
      provider_boundary_checked: true,
      type_only_boundary_checked: true,
      changed_files_boundary_checked: changedFilesBoundary.checked,
      changed_files_boundary_skipped: changedFilesBoundary.skipped,
      changed_files_boundary_skip_reason: changedFilesBoundary.skip_reason,
      changed_files_checked: changedFilesBoundary.files,
      changed_files_observed: changedFilesBoundary.files,
      changed_files_base_ref: changedFilesBoundary.base_ref,
      changed_files_base_range_checked: changedFilesBoundary.base_range_checked,
      changed_files_base_range_skipped: changedFilesBoundary.base_range_skipped,
      changed_files_working_tree_checked:
        changedFilesBoundary.working_tree_checked,
      untracked_files_checked: changedFilesBoundary.untracked_checked,
      untracked_files_skipped: changedFilesBoundary.untracked_skipped,
      untracked_files_skip_reason: changedFilesBoundary.untracked_skip_reason,
      untracked_files_observed: changedFilesBoundary.untracked_files,
      smoke_type: "static-type-docs-package-pointer-boundary-only",
      runtime_behavior_changed: false,
      ui_behavior_changed: false,
      api_route_behavior_changed: false,
      db_schema_migration_changed: false,
      mcp_app_tool_changes_added: false,
      proof_evidence_writes_added: false,
      ag_resume_behavior_added: false,
      live_codex_sdk_call_added: false,
      codex_sdk_import_added: false,
      provider_implementation_added: false,
      project_constellation_runtime_changed: false,
      branch_pr_creation_authority_added: false,
      merge_publish_authority_added: false,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:codex-execution-record-boundary");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText: textByFile.get(packageJsonFile),
    scriptName: "smoke:codex-execution-record-boundary",
    expectedCommand: "node scripts/smoke-codex-execution-record-boundary.mjs",
  });
}

function assertTypeExports() {
  for (const typeName of requiredExportedTypes) {
    const exportPattern = new RegExp(
      `export\\s+(?:type|interface)\\s+${escapeRegExp(typeName)}\\b`,
    );
    assert(exportPattern.test(typeText), `${typeFile} must export ${typeName}`);
  }
}

function assertTypeFileBoundary() {
  assertNoRuntimeImports({
    file: typeFile,
    text: typeText,
    forbiddenImports: [
      ".json",
      "@openai/codex-sdk",
      "zod",
      "io-ts",
      "runtypes",
      "superstruct",
      "valibot",
      "app/",
      "components/",
      "db/",
      "migrations/",
      "apps/augnes_apps/",
    ],
  });
  assert(!/\bimport\s+/m.test(typeText), `${typeFile} must not contain imports`);
  assert(!/\bexport\s+const\b/.test(typeText), `${typeFile} must not export runtime values`);
  assert(!/\bexport\s+let\b/.test(typeText), `${typeFile} must not export runtime values`);
  assert(!/\bexport\s+var\b/.test(typeText), `${typeFile} must not export runtime values`);
  assert(!/\bfunction\b/.test(typeText), `${typeFile} must not contain functions`);
  assert(!/\bclass\b/.test(typeText), `${typeFile} must not contain classes`);
  assert(!/\benum\b/.test(typeText), `${typeFile} must not contain enums`);
  assert(!/\bJSON\./.test(typeText), `${typeFile} must not import or parse JSON`);
  assert(!/\b@openai\/codex-sdk\b/.test(typeText), `${typeFile} must not import @openai/codex-sdk`);
  assert(!/\bzod\b|\bio-ts\b|\bruntypes\b|\bsuperstruct\b|\bvalibot\b/i.test(typeText), `${typeFile} must not reference runtime schema libraries`);
}

function assertRequiredTypeContent() {
  assertContainsAll(typeText, [
    ...permissionProfileLiterals,
    ...statusLiterals,
    ...conceptualFields,
    ...userApprovalFields,
    ...executionResultFields,
    ...evidencePointerPhrases,
    ...boundaryPhrases,
    "live_sdk_call: false",
    "provider_implementation: false",
    "runtime_execution: false",
    "CodexExecutionProviderBoundary",
  ], { label: typeFile });
  assertNoForbiddenPositiveClauses(typeFile, typeText);
}

function assertDocPointers() {
  assertContainsAll(designDoc, [
    typeFile,
    "type-only Codex execution record boundary",
    "original design-only PR did not create TypeScript files",
    "This follow-up now introduces `types/codex-execution-record.ts` as a type-only boundary",
    "not runtime schema",
    "not DB schema",
    "not API contract",
    "not MCP/App tool contract",
    "not proof/evidence write authority",
    "not source-of-truth",
    "no live SDK call",
    "no `@openai/codex-sdk` import",
    "does not add live SDK calls",
    "does not add provider implementation",
    "does not add runtime execution",
    "does not add credentials/auth/env",
    "does not add API route",
    "does not add DB schema",
    "does not add MCP/App tool",
    "does not add proof/evidence writes",
    "does not add AG Resume behavior",
    "does not add Project Constellation runtime behavior",
    "smoke:codex-execution-record-boundary",
  ], { textByFile });

  assertContainsAll(indexDoc, [
    typeFile,
    "type-only Codex execution record boundary",
    "smoke:codex-execution-record-boundary",
    "non-SSOT",
    "no runtime schema",
    "no DB schema",
    "no API route",
    "no MCP/App tool",
    "no proof/evidence write",
    "no AG Resume behavior",
    "no Codex SDK execution/provider implementation",
  ], { textByFile });

  for (const [file, text] of textByFile.entries()) {
    if ([smokeFile, packageJsonFile].includes(file)) continue;
    assertNoForbiddenPositiveClauses(file, text);
  }
}

function assertNoStaleTypeBoundaryClaims() {
  const designText = textByFile.get(designDoc);
  if (!designText.includes(typeFile)) return;
  assert(
    !/\bThis PR does not create TypeScript files\b/.test(designText),
    `${designDoc} must not keep stale "This PR does not create TypeScript files" wording when it points to ${typeFile}`,
  );
}

function assertSmokeScriptBoundary() {
  const script = textByFile.get(smokeFile);
  assertNoRuntimeImports({
    file: smokeFile,
    text: script,
    forbiddenImports: [
      "app/",
      "components/",
      "db/",
      "migrations/",
      "apps/augnes_apps/",
      "reports/",
      "screenshots/",
      "@openai/codex-sdk",
      "zod",
      "io-ts",
      "runtypes",
      "superstruct",
      "valibot",
    ],
  });
}

function assertChangedFilesBoundary() {
  const result = assertChangedFilesWithin({
    allowedChangedFiles,
    label: "Codex execution record boundary smoke",
  });
  const untrackedFiles = collectUntrackedFiles();
  const contentOnly = result.mode === "content-only";

  if (!contentOnly) {
    for (const file of untrackedFiles) {
      assert(
        allowedChangedFiles.has(file),
        `Unexpected untracked file for Codex execution record boundary smoke: ${file}`,
      );
    }
  }

  const files = uniqueSorted([...result.files, ...untrackedFiles]);

  if (!contentOnly) {
    assertNoForbiddenChangedPaths(files);
  }

  return {
    ...result,
    files,
    untracked_checked: !contentOnly,
    untracked_skipped: contentOnly,
    untracked_skip_reason: contentOnly
      ? "untracked-file boundary skipped because AUGNES_BOUNDARY_SMOKE_MODE=content-only"
      : null,
    untracked_files: untrackedFiles,
  };
}

function assertNoForbiddenChangedPaths(files) {
  const forbiddenPatterns = [
    /^AGENTS\.md$/,
    /^components\//,
    /^app\//,
    /^db\//,
    /^migrations\//,
    /^apps\/augnes_apps\//,
    /^reports\/browser\//,
    /^screenshots\//,
    /(^|\/)(route|api)\.(js|jsx|ts|tsx)$/,
    /^plugins\/augnes-operator\/hooks\//,
    /^plugins\/augnes-operator\/(?:\.mcp\.json|mcp|mcpServers|apps|app-mappings|app_mappings)(\/|$)/,
    /(^|\/)(secret|secrets|env)(\/|$)/i,
    /(^|\/)\.env/i,
    /(^|\/)(ag-work-resume|ag_resume|ag-resume)(\/|$)/i,
    /(^|\/)(proof|evidence).*(writer|record|route|helper)/i,
    /(^|\/)(sidecar-runtime|sidecar_et_runtime|sidecar-et-runtime|runtime-sidecar)(\/|$)/i,
    /(^|\/)(codex-sdk|codex_sdk|provider|providers)(\/|$)/i,
    /(^|\/)(project-constellation).*(runtime|provider|engine|route|api|db|persistence)/i,
  ];

  for (const file of files) {
    assert(
      !forbiddenPatterns.some((pattern) => pattern.test(file)),
      `Forbidden changed file for Codex execution record boundary smoke: ${file}`,
    );
  }
}

function assertNoForbiddenPositiveClauses(file, text) {
  const clauses = normalizeText(text)
    .split(/[.;!?]\s+/)
    .map((clause) => clause.trim())
    .filter(Boolean);

  for (const clause of clauses) {
    assert.equal(
      isForbiddenPositiveClause(clause),
      false,
      `${file} appears to grant forbidden authority or active behavior: ${clause}`,
    );
  }
}

function assertAuthorityClassifierSelfTests() {
  for (const clause of forbiddenPositiveAuthoritySelfTests) {
    assert.equal(
      isForbiddenPositiveClause(clause),
      true,
      `Authority classifier must reject forbidden positive claim: ${clause}`,
    );
  }

  for (const clause of allowedBoundarySelfTests) {
    assert.equal(
      isForbiddenPositiveClause(clause),
      false,
      `Authority classifier must allow legitimate boundary wording: ${clause}`,
    );
  }
}

function isForbiddenPositiveClause(clause) {
  const forbiddenPatterns = [
    /\b(type|boundary|record|Codex|execution|provider|PR)\b.{0,120}\b(can|may|is allowed to|is permitted to|has authority to|is authorized to|authorizes?)\b.{0,160}\b(create branches?|open PRs?|create PRs?|merge|publish|approve|retry|replay|deploy|record proof|record evidence|write proof|write evidence|execute Codex|call GitHub|call OpenAI|call Augnes runtime|call MCP\/App tools?|call SDK|implement providers?)\b/i,
    /\b(adds?|implements?|enables?|activates?|creates?|records?|writes?|calls?|runs?|executes?|publishes?|approves?|retries|replays|merges?|deploys?)\b.{0,160}\b(runtime behavior|UI behavior|API routes?|DB schema|migrations?|MCP\/App tools?|proof\/evidence writes?|proof writes?|evidence writes?|AG Resume behavior|branch creation authority|PR creation authority|merge authority|publish authority|approval authority|Codex SDK execution|provider implementation|Project Constellation runtime behavior)\b/i,
    /\b(grants?|adds?|creates?|provides?|authori[sz]es?)\b.{0,100}\b(branch creation authority|PR creation authority|merge authority|publish authority|approval authority|proof\/evidence write authority|Codex SDK execution authority|deploy authority)\b/i,
    /\b(navigator\.clipboard|@openai\/codex-sdk|api\.github\.com|api\.openai\.com|fetch\s*\(|XMLHttpRequest|gh\s+(api|pr|issue|repo))\b/i,
  ];

  if (!forbiddenPatterns.some((pattern) => pattern.test(clause))) return false;
  return !isNegatedBoundary(clause);
}

function isNegatedBoundary(clause) {
  return /\b(not|no|does not|do not|must not|never|is not|are not|cannot|can't|by itself|type-only|boundary only|pointer only)\b|않|만들지 않는다/i.test(
    clause,
  );
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
