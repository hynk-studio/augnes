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

const typeFile = "types/readonly-api-route-response.ts";
const planningDoc = "docs/READONLY_API_ROUTE_PLANNING_BOUNDARY_V0_1.md";
const checklistDoc = "docs/READONLY_API_ROUTE_REVIEW_CHECKLIST_V0_1.md";
const indexDoc = "docs/00_INDEX_LATEST.md";
const packageJsonFile = "package.json";
const smokeFile =
  "scripts/smoke-readonly-api-route-response-shape-boundary.mjs";
const planningSmokeFile =
  "scripts/smoke-readonly-api-route-planning-boundary.mjs";
const checklistSmokeFile =
  "scripts/smoke-readonly-api-route-review-checklist.mjs";
const surfaceSmokeFile =
  "scripts/smoke-chatgpt-app-mcp-readonly-surface-boundary.mjs";
const implementationDesignDoc =
  "docs/READONLY_API_ROUTE_IMPLEMENTATION_DESIGN_PACKET_V0_1.md";
const implementationDesignSmokeFile =
  "scripts/smoke-readonly-api-route-implementation-design-packet.mjs";
const implementationPlanDoc =
  "docs/READONLY_API_ROUTE_IMPLEMENTATION_PLAN_V0_1.md";
const implementationPlanSmokeFile =
  "scripts/smoke-readonly-api-route-implementation-plan.mjs";
const constellationPreviewRouteDoc =
  "docs/READONLY_API_ROUTE_CONSTELLATION_PREVIEW_V0_1.md";
const constellationPreviewRouteFile =
  "app/api/augnes/read/constellation-preview/route.ts";
const constellationPreviewHelperFile =
  "lib/readonly-api/constellation-preview.ts";
const constellationPreviewSmokeFile =
  "scripts/smoke-readonly-api-route-constellation-preview.mjs";
const accessGuardDoc = "docs/READONLY_API_ROUTE_ACCESS_GUARD_V0_1.md";
const accessGuardFile = "lib/readonly-api/access-guard.ts";
const accessGuardSmokeFile =
  "scripts/smoke-readonly-api-route-access-guard.mjs";
const authorityMatrixDoc = "docs/AUTHORITY_MATRIX.md";
const localDevAdapterFile = "lib/readonly-api/local-dev-auth-adapter.ts";
const localDevAdapterDoc =
  "docs/READONLY_API_ROUTE_LOCAL_DEV_AUTH_ADAPTER_V0_1.md";
const localDevAdapterSmokeFile =
  "scripts/smoke-readonly-api-route-local-dev-auth-adapter.mjs";
const cockpitFile = "components/augnes-cockpit.tsx";
const cockpitImplementationDoc =
  "docs/COCKPIT_LOCAL_ONLY_CONSTELLATION_ROUTE_PREVIEW_V0_1.md";
const cockpitImplementationSmokeFile =
  "scripts/smoke-cockpit-local-only-constellation-route-preview.mjs";
const closeoutDoc =
  "docs/READONLY_CONSTELLATION_LOCAL_ONLY_CONSUMER_CLOSEOUT_V0_1.md";
const closeoutSmokeFile =
  "scripts/smoke-readonly-constellation-local-only-consumer-closeout.mjs";

const inspectedFiles = [
  typeFile,
  planningDoc,
  checklistDoc,
  indexDoc,
  packageJsonFile,
  smokeFile,
];

const allowedChangedFiles = new Set([
  ...inspectedFiles,
  planningSmokeFile,
  checklistSmokeFile,
  surfaceSmokeFile,
  implementationDesignDoc,
  implementationDesignSmokeFile,
  implementationPlanDoc,
  implementationPlanSmokeFile,
  constellationPreviewRouteDoc,
  constellationPreviewRouteFile,
  constellationPreviewHelperFile,
  constellationPreviewSmokeFile,
  accessGuardDoc,
  accessGuardFile,
  accessGuardSmokeFile,
  authorityMatrixDoc,
  localDevAdapterFile,
  localDevAdapterDoc,
  localDevAdapterSmokeFile,
  cockpitFile,
  cockpitImplementationDoc,
  cockpitImplementationSmokeFile,
  closeoutDoc,
  closeoutSmokeFile,
  "types/perspective-agent-brief.ts",
  "lib/readonly-api/perspective-agent-brief.ts",
  "app/api/augnes/read/perspective-agent-brief/route.ts",
  "docs/PERSPECTIVE_AGENT_BRIEF_READ_SURFACE_V0_1.md",
  "reports/2026-06-07-perspective-agent-brief-read-surface.md",
  "scripts/smoke-perspective-agent-brief-read-surface.mjs",
  "scripts/smoke-perspective-temporal-spatial-projection-builders.mjs",
  "scripts/smoke-cockpit-perspective-workbench-temporal-underlay.mjs",
  "scripts/smoke-perspective-capsule-contract.mjs",
  "scripts/smoke-readonly-api-route-access-guard.mjs",
  "scripts/smoke-readonly-api-route-auth-scope-adapter-boundary.mjs",
  "scripts/smoke-readonly-api-route-auth-source-selection.mjs",
]);

const requiredExportedTypes = [
  "ReadonlyApiRouteResponseEnvelopeV0",
  "ReadonlyApiRouteResponseMeta",
  "ReadonlyApiRouteBoundaryClass",
  "ReadonlyApiRouteDiagnostics",
  "ReadonlyApiRouteSourceRef",
  "ReadonlyApiRouteWholePerspectiveSummary",
  "ReadonlyApiRouteProjectConstellationReadModel",
  "ReadonlyApiRouteConstellationNode",
  "ReadonlyApiRouteConstellationEdge",
  "ReadonlyApiRouteConstellationCluster",
  "ReadonlyApiRouteEvidencePointer",
  "ReadonlyApiRouteUnresolvedTension",
  "ReadonlyApiRouteNextActionCandidate",
  "ReadonlyApiRoutePerspectiveCapsulePreview",
  "ReadonlyApiRouteCopyableHandoffPreview",
  "ReadonlyApiRouteBoundaryNextReview",
  "ReadonlyApiRouteForbiddenField",
];

const requiredConcepts = [
  "response envelope",
  "meta",
  "source_refs",
  "generated_at",
  "route_family",
  "workspace_scope",
  "project_scope",
  "whole_perspective",
  "project_constellation",
  "perspective_capsule_preview",
  "copyable_handoff_preview",
  "boundary_next_review",
  "evidence_pointers",
  "unresolved_tensions",
  "next_action_candidates",
  "boundary_class",
  "diagnostics",
  "forbidden_fields_removed",
  "authority_boundary",
];

const expectedBoundaryClasses = [
  "read_only_local_static_preview",
  "whole_perspective_summary",
  "perspective_capsule_preview",
  "copyable_handoff_draft",
  "boundary_next_review",
];

const productFacingBoundaryClassRequirements = [
  {
    interfaceName: "ReadonlyApiRouteProjectConstellationReadModel",
    expectedField: 'boundary_class: "read_only_local_static_preview";',
  },
  {
    interfaceName: "ReadonlyApiRouteWholePerspectiveSummary",
    expectedField: 'boundary_class: "whole_perspective_summary";',
  },
  {
    interfaceName: "ReadonlyApiRoutePerspectiveCapsulePreview",
    expectedField: 'boundary_class: "perspective_capsule_preview";',
  },
  {
    interfaceName: "ReadonlyApiRouteCopyableHandoffPreview",
    expectedField: 'boundary_class: "copyable_handoff_draft";',
  },
  {
    interfaceName: "ReadonlyApiRouteBoundaryNextReview",
    expectedField: 'boundary_class: "boundary_next_review";',
  },
];

const productFacingNoAuthorityListInterfaces = [
  "ReadonlyApiRouteResponseEnvelopeV0",
  "ReadonlyApiRouteWholePerspectiveSummary",
  "ReadonlyApiRouteProjectConstellationReadModel",
  "ReadonlyApiRouteNextActionCandidate",
  "ReadonlyApiRoutePerspectiveCapsulePreview",
  "ReadonlyApiRouteCopyableHandoffPreview",
  "ReadonlyApiRouteBoundaryNextReview",
];

const forbiddenFieldVocabulary = [
  "secrets",
  "credentials/auth/env",
  "hidden reasoning / chain-of-thought",
  "raw DB rows",
  "proof/evidence write handles",
  "mutation URLs",
  "approval/publish/merge controls",
  "Codex SDK execution handles",
  "provider credentials",
];

const boundaryPhrases = [
  "type-only response shape boundary",
  "not runtime schema",
  "not API route implementation",
  "not DB schema",
  "not MCP/App tool contract",
  "not proof/evidence write authority",
  "not source-of-truth",
  "no auth implementation",
  "no external calls",
  "no runtime execution",
];

const forbiddenPositiveAuthoritySelfTests = [
  "A response type may expose credentials without review.",
  "A future response shape may create proof records.",
  "A read-only response may include mutation URLs.",
  "A route response type may approve merges.",
  "A response envelope may execute Codex.",
];

const allowedBoundarySelfTests = [
  "This type does not implement API routes.",
  "No response type may expose credentials.",
  "Read-only response shape planning does not write Augnes state.",
  "Future implementation requires auth/security review.",
];

const textByFile = loadTextByFile(inspectedFiles);
const typeText = textByFile.get(typeFile);

assertAuthorityClassifierSelfTests();
assertPackageJsonScript();
assertTypeExports();
assertTypeFileBoundary();
assertRequiredTypeContent();
assertDocPointers();
assertSmokeScriptBoundary();
const changedFilesBoundary = assertChangedFilesBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "readonly-api-route-response-shape-boundary",
      pass: true,
      boundary_smoke_mode: changedFilesBoundary.mode,
      type_file_checked: typeFile,
      docs_checked: [planningDoc, checklistDoc, indexDoc],
      package_script_checked: true,
      exported_types_checked: requiredExportedTypes.length,
      required_concepts_checked: requiredConcepts.length,
      boundary_classes_checked: expectedBoundaryClasses,
      product_facing_boundary_class_fields_checked:
        productFacingBoundaryClassRequirements.length,
      product_facing_authority_lists_disallowed_checked:
        productFacingNoAuthorityListInterfaces.length,
      forbidden_field_vocabulary_checked: forbiddenFieldVocabulary.length,
      type_only_boundary_checked: true,
      forbidden_positive_authority_self_tests_checked:
        forbiddenPositiveAuthoritySelfTests.length,
      allowed_boundary_self_tests_checked: allowedBoundarySelfTests.length,
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
      api_route_implemented: false,
      runtime_behavior_changed: false,
      ui_behavior_changed: false,
      chatgpt_app_tool_implemented: false,
      mcp_app_tool_changes_added: false,
      db_schema_migration_changed: false,
      graph_db_added: false,
      persistence_added: false,
      auth_implementation_added: false,
      external_calls_added: false,
      proof_evidence_writes_added: false,
      ag_resume_behavior_added: false,
      codex_sdk_execution_added: false,
      provider_implementation_added: false,
      branch_pr_creation_authority_added: false,
      merge_publish_authority_added: false,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:readonly-api-route-response-shape-boundary");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText: textByFile.get(packageJsonFile),
    scriptName: "smoke:readonly-api-route-response-shape-boundary",
    expectedCommand:
      "node scripts/smoke-readonly-api-route-response-shape-boundary.mjs",
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
      "@openai/codex-sdk",
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
  assert(!/\bzod\b|\bio-ts\b|\bruntypes\b|\bsuperstruct\b|\bvalibot\b/i.test(typeText), `${typeFile} must not reference runtime schema libraries`);
}

function assertRequiredTypeContent() {
  assertContainsAll(typeText, [
    ...requiredConcepts,
    ...expectedBoundaryClasses,
    ...forbiddenFieldVocabulary,
    ...boundaryPhrases,
    "readonly_api_route_response.v0.1",
    "runtime_schema: false",
    "api_route_implementation: false",
    "auth_implementation: false",
    "external_calls: false",
    "source_of_truth: false",
    "proof_evidence_write_authority: false",
    "readiness_write_authority: false",
  ], { label: typeFile });
  assertBoundaryClassUnion();
  assertProductFacingBoundaryClasses();
  assertDetailedAuthorityListsStayInDiagnostics();
  assertNoForbiddenPositiveClauses(typeFile, typeText);
}

function assertBoundaryClassUnion() {
  const match = typeText.match(
    /export\s+type\s+ReadonlyApiRouteBoundaryClass\s*=\s*([\s\S]*?);/m,
  );
  assert(match, `${typeFile} must export ReadonlyApiRouteBoundaryClass`);
  const actualClasses = [...match[1].matchAll(/"([^"]+)"/g)].map(
    ([, value]) => value,
  );
  assert.deepEqual(
    uniqueSorted(actualClasses),
    uniqueSorted(expectedBoundaryClasses),
    `${typeFile} must keep a small explicit boundary_class union`,
  );
}

function assertProductFacingBoundaryClasses() {
  for (const { interfaceName, expectedField } of productFacingBoundaryClassRequirements) {
    const body = getInterfaceBody(interfaceName);
    assert(
      body.includes(expectedField),
      `${interfaceName} must use ${expectedField} as its product-facing boundary contract`,
    );
  }

  const candidateBody = getInterfaceBody("ReadonlyApiRouteNextActionCandidate");
  assert(
    candidateBody.includes("boundary_class?: ReadonlyApiRouteBoundaryClass;"),
    "ReadonlyApiRouteNextActionCandidate must keep compact optional boundary_class for advisory candidates",
  );
}

function assertDetailedAuthorityListsStayInDiagnostics() {
  const diagnosticsBody = getInterfaceBody("ReadonlyApiRouteDiagnostics");
  assert(
    /^\s+authority_boundary: string\[];/m.test(diagnosticsBody),
    "ReadonlyApiRouteDiagnostics must retain detailed authority_boundary lists",
  );
  assert(
    /^\s+forbidden_fields_removed: ReadonlyApiRouteForbiddenField\[];/m.test(
      diagnosticsBody,
    ),
    "ReadonlyApiRouteDiagnostics must retain forbidden_fields_removed lists",
  );
  assertContainsAll(diagnosticsBody, [
    "whole_perspective_authority_boundary?: string[];",
    "perspective_capsule_authority_boundary?: string[];",
    "copyable_handoff_authority_boundary?: string[];",
    "boundary_next_review_authority_boundary?: string[];",
    "next_action_authority_boundary?: string[];",
  ], { label: "ReadonlyApiRouteDiagnostics" });

  for (const interfaceName of productFacingNoAuthorityListInterfaces) {
    const body = getInterfaceBody(interfaceName);
    assert(
      !/^\s+authority_boundary[?:]:/m.test(body),
      `${interfaceName} must not require or expose authority_boundary in the default product-facing shape`,
    );
  }

  const envelopeBody = getInterfaceBody("ReadonlyApiRouteResponseEnvelopeV0");
  assert(
    !/^\s+forbidden_fields_removed[?:]:/m.test(envelopeBody),
    "ReadonlyApiRouteResponseEnvelopeV0 must keep forbidden_fields_removed out of the default product-facing shape",
  );
}

function assertDocPointers() {
  assertContainsAll(planningDoc, [
    typeFile,
    "type-only response shape boundary",
    "required before endpoint implementation",
    "does not implement any API route",
    "does not add runtime behavior",
    "does not add auth implementation",
    "does not add DB schema",
    "does not add MCP/App tool",
    "does not add proof/evidence writes",
    "does not add Codex SDK execution",
    "smoke:readonly-api-route-response-shape-boundary",
  ], { textByFile });

  assertContainsAll(checklistDoc, [
    typeFile,
    "type-only response shape",
    "compare against the type-only response shape",
    "does not implement any API route",
    "does not add runtime behavior",
    "does not add auth implementation",
    "does not add proof/evidence writes",
    "smoke:readonly-api-route-response-shape-boundary",
  ], { textByFile });

  assertContainsAll(indexDoc, [
    typeFile,
    "read-only API route response shape boundary",
    "smoke:readonly-api-route-response-shape-boundary",
    "type-only",
    "non-SSOT",
    "no API route",
    "no runtime behavior",
    "no auth implementation",
    "no DB",
    "no MCP/App tool",
    "no proof/evidence write",
    "no Codex SDK execution",
  ], { textByFile });

  for (const [file, text] of textByFile.entries()) {
    if ([smokeFile, packageJsonFile].includes(file)) continue;
    assertNoForbiddenPositiveClauses(file, text);
  }
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
      "openai",
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
    label: "read-only API route response shape boundary smoke",
  });
  const untrackedFiles = collectUntrackedFiles();
  const contentOnly = result.mode === "content-only";

  if (!contentOnly) {
    for (const file of untrackedFiles) {
      assert(
        allowedChangedFiles.has(file),
        `Unexpected untracked file for read-only API route response shape boundary smoke: ${file}`,
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
    if (
      [
        constellationPreviewRouteFile,
        constellationPreviewHelperFile,
        localDevAdapterFile,
        "app/api/augnes/read/perspective-agent-brief/route.ts",
        "lib/readonly-api/perspective-agent-brief.ts",
        cockpitFile,
        cockpitImplementationSmokeFile,
      ].includes(file)
    ) {
      continue;
    }
    assert(
      !forbiddenPatterns.some((pattern) => pattern.test(file)),
      `Forbidden changed file for read-only API route response shape boundary smoke: ${file}`,
    );
  }
}

function getInterfaceBody(interfaceName) {
  const match = typeText.match(
    new RegExp(
      `export\\s+interface\\s+${escapeRegExp(interfaceName)}\\s*\\{([\\s\\S]*?)\\n\\}`,
      "m",
    ),
  );
  assert(match, `${typeFile} must export interface ${interfaceName}`);
  return match[1];
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
    /\b(response|response type|response shape|response envelope|route response|type)\b.{0,120}\b(can|may|is allowed to|is permitted to|has authority to|is authorized to|authorizes?)\b.{0,160}\b(expose credentials|include mutation URLs?|approve merges?|merge|publish|approve|retry|replay|deploy|create proof records?|record proof|record evidence|write proof|write evidence|execute Codex|launch Codex|call SDK|call GitHub|call OpenAI|call Augnes runtime)\b/i,
    /\b(adds?|implements?|enables?|activates?|creates?|records?|writes?(?!\s+handles)|calls?|runs?|executes?|publishes?|approves?|retries|replays|merges?(?!\s+controls)|deploys?|exposes?|includes?)\b.{0,160}\b(runtime behavior|UI behavior|API routes?|API route implementation|DB schema|migrations?|MCP\/App tools?|proof\/evidence writes?|proof writes?|evidence writes?|AG Resume behavior|branch creation authority|PR creation authority|merge authority|publish authority|approval authority|Codex SDK execution|provider implementation|credentials|mutation URLs?|approval\/publish\/merge controls)\b/i,
    /\b(grants?|adds?|creates?|provides?|authori[sz]es?)\b.{0,100}\b(branch creation authority|PR creation authority|merge authority|publish authority|approval authority|proof\/evidence write authority|Codex SDK execution authority|deploy authority)\b/i,
    /\b(navigator\.clipboard|@openai\/codex-sdk|api\.github\.com|api\.openai\.com|fetch\s*\(|XMLHttpRequest|gh\s+(api|pr|issue|repo))\b/i,
  ];

  if (!forbiddenPatterns.some((pattern) => pattern.test(clause))) return false;
  return !isNegatedBoundary(clause);
}

function isNegatedBoundary(clause) {
  return /\b(not|no|does not|do not|must not|never|is not|are not|cannot|can't|by itself)\b|않|만들지 않는다/i.test(
    clause,
  );
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
