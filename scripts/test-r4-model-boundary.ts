#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

import { openAiCodexHostAttestationInputFixture } from "../fixtures/vnext/protocol/run-receipt-v0-1";
import {
  buildRunReceiptV01,
  validateRunReceiptV01,
} from "../lib/vnext/run-receipt";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const approvedTransportConfigurationOwner =
  "lib/vnext/model-gateway/openai/responses-adapter.ts";
const sharedGatewayOwner = "lib/vnext/model-gateway/model-gateway.ts";
const approvedPurposeCodecOwners = new Set([
  "lib/vnext/model-gateway/openai/observe-codec.ts",
  "lib/vnext/model-gateway/openai/planner-codec.ts",
  "lib/vnext/model-gateway/openai/strategic-advantage-transfer-codec.ts",
  "lib/vnext/model-gateway/openai/temporal-codec.ts",
]);
const approvedOpenAIBoundaryImporters = new Set([
  approvedTransportConfigurationOwner,
  sharedGatewayOwner,
]);
const runtimeEnvironmentPropagationOwner =
  "scripts/augnes-runtime-supervisor.mjs";
const approvedLegacySummaryCompatibilityWriter =
  "lib/vnext/run-receipt.ts";
const approvedLegacySummaryCompatibilityFunction =
  "normalizeModelInvocations";
const productionRoots = [
  "app",
  "lib",
  "components",
  "types",
  "apps/augnes_apps/src",
  "plugins",
] as const;
const productionRuntimeFiles = [
  runtimeEnvironmentPropagationOwner,
  "scripts/runtime-child-environment.mjs",
] as const;
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const ignoredDirectoryNames = new Set([
  ".git",
  ".next",
  ".tmp",
  "__fixtures__",
  "build",
  "coverage",
  "dist",
  "fixtures",
  "generated",
  "node_modules",
  "tmp",
]);
const legacySummaryRequiredProperties = new Set([
  "invocation_ref",
  "provider_ref",
  "model_ref",
  "started_at",
  "finished_at",
  "input_units",
  "output_units",
  "latency_ms",
  "retry_count",
  "status",
  "retention_class",
  "egress_status",
  "raw_prompt_persisted",
  "raw_response_persisted",
  "hidden_reasoning_persisted",
  "source_refs",
]);
const currentModelInvocationEntryMarkers = new Set([
  "entry_version",
  "invocation_receipt",
  "work_ref",
  "run_ref",
]);

type BoundaryViolationKind =
  | "provider_transport_owner"
  | "provider_configuration_owner"
  | "provider_authorization_owner"
  | "provider_response_parser_owner"
  | "provider_purpose_codec_owner"
  | "direct_openai_boundary_import"
  | "legacy_run_receipt_model_summary_writer";

interface BoundaryViolation {
  file: string;
  kind: BoundaryViolationKind;
}

interface SourceFile {
  relativePath: string;
  source: string;
}

interface LegacySummaryWriterCandidate {
  enclosingFunctionName: string | null;
}

const providerDomainPattern =
  /api\s*\.\s*openai\s*\.\s*com|api\.\s*["'`]\s*\+\s*["'`]\s*openai\.com/i;
const responsesEndpointPattern =
  /\/v1\/responses\b|\/v1\/["'`]\s*\+\s*["'`]responses\b/i;
const providerSdkPattern =
  /(?:from\s*|require\s*\(\s*)["'`](?:openai|@anthropic-ai\/sdk|@google\/generative-ai)["'`]|\bnew\s+OpenAI\b|\.responses\s*\.\s*create\s*\(|\.chat\s*\.\s*completions\b|\.messages\s*\.\s*create\s*\(|\.generateContent\s*\(/i;
const providerConfigurationAccessPattern =
  /(?:process\s*\.\s*env|environment)\s*(?:\.\s*OPENAI_(?:API_KEY|MODEL)|\[\s*["'`]OPENAI_(?:API_KEY|MODEL)["'`]\s*\])/i;
const providerAuthorizationPattern =
  /\bAuthorization\b[\s\S]{0,160}\bBearer\b|\bBearer\b[\s\S]{0,160}\bAuthorization\b/i;
const providerResponseShapePattern = /\boutput_text\b|["'`]json_schema["'`]/i;
const providerRoleLayoutPattern =
  /\brole\s*:\s*["'`](?:system|developer|user)["'`][\s\S]{0,240}(?:input_text|json_schema)/i;
const purposeCodecPattern =
  /\b(?:build(?:Observe|Planner|Temporal|StrategicAdvantageTransfer)SystemPrompt|parse(?:Observe|Planner|Temporal|StrategicAdvantageTransfer)Output|project(?:Observe|Planner|Temporal|StrategicAdvantageTransfer)ModelMaterial|(?:observe|planner|temporal|strategicAdvantageTransfer)ResponseSchema)\b/;
const openAIBoundaryImportPattern =
  /(?:from\s*|require\s*\(\s*)["'`][^"'`]*model-gateway\/openai(?:\/[^"'`]*)?["'`]/;

const files = collectProductionSources();
const violations = files.flatMap(({ relativePath, source }) =>
  classifyBoundaryViolations(relativePath, source),
);
assert.deepEqual(violations, [], formatViolations(violations));

assertSyntheticDetectionMatrix();
assertCurrentOwnershipInventory(files);
assertCallerGatewayBoundary(files);
assertRunReceiptCompatibilityDisposition(files);

process.stdout.write(
  `${JSON.stringify(
    {
      test: "r4_model_boundary",
      status: "pass",
      source_extensions: [...sourceExtensions].sort(),
      production_roots: [...productionRoots],
      production_runtime_files: [...productionRuntimeFiles],
      production_files_scanned: files.length,
      approved_transport_configuration_owner:
        approvedTransportConfigurationOwner,
      approved_purpose_codec_owners: [...approvedPurposeCodecOwners].sort(),
      normal_callers_import_openai_boundary: 0,
      production_boundary_violations: violations.length,
      runtime_environment_propagation_owner:
        runtimeEnvironmentPropagationOwner,
      legacy_run_receipt_summary_disposition:
        "read_and_host_attestation_compatibility_only",
      approved_legacy_summary_compatibility_writer:
        approvedLegacySummaryCompatibilityWriter,
      approved_legacy_summary_compatibility_writer_count: 1,
      normal_production_legacy_summary_writer_count: 0,
      new_gateway_run_receipt_writer: "run_receipt_model_invocation.v0.2",
      r4_exit_regression: "pass",
      live_provider_calls: 0,
    },
    null,
    2,
  )}\n`,
);

function collectProductionSources(): SourceFile[] {
  const paths = productionRoots.flatMap((relativeRoot) => {
    const absoluteRoot = path.join(repositoryRoot, relativeRoot);
    return existsSync(absoluteRoot) ? listSourceFiles(absoluteRoot) : [];
  });
  for (const relativeFile of productionRuntimeFiles) {
    const absoluteFile = path.join(repositoryRoot, relativeFile);
    if (existsSync(absoluteFile)) paths.push(absoluteFile);
  }
  return [...new Set(paths)]
    .map((absolutePath) => ({
      relativePath: repositoryRelative(absolutePath),
      source: readFileSync(absolutePath, "utf8"),
    }))
    .sort((left, right) => left.relativePath.localeCompare(right.relativePath));
}

function listSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) {
      if (ignoredDirectoryNames.has(entry.name)) return [];
      return listSourceFiles(path.join(directory, entry.name));
    }
    if (!entry.isFile() || !sourceExtensions.has(path.extname(entry.name))) {
      return [];
    }
    if (/\.(?:test|spec)\.[^.]+$/i.test(entry.name)) return [];
    return [path.join(directory, entry.name)];
  });
}

function classifyBoundaryViolations(
  relativePath: string,
  source: string,
): BoundaryViolation[] {
  const found = new Set<BoundaryViolationKind>();
  const transportOwned =
    providerDomainPattern.test(source) ||
    responsesEndpointPattern.test(source) ||
    providerSdkPattern.test(source);
  if (
    transportOwned &&
    relativePath !== approvedTransportConfigurationOwner
  ) {
    found.add("provider_transport_owner");
  }

  if (
    providerConfigurationAccessPattern.test(source) &&
    relativePath !== approvedTransportConfigurationOwner &&
    !isReviewedRuntimeEnvironmentPropagation(relativePath, source)
  ) {
    found.add("provider_configuration_owner");
  }

  if (
    isProviderAuthorizationOwnerSource(source) &&
    providerAuthorizationPattern.test(source) &&
    relativePath !== approvedTransportConfigurationOwner
  ) {
    found.add("provider_authorization_owner");
  }

  if (
    providerResponseShapePattern.test(source) &&
    relativePath !== approvedTransportConfigurationOwner
  ) {
    found.add("provider_response_parser_owner");
  }

  if (
    (purposeCodecPattern.test(source) || providerRoleLayoutPattern.test(source)) &&
    relativePath !== approvedTransportConfigurationOwner &&
    !approvedPurposeCodecOwners.has(relativePath)
  ) {
    found.add("provider_purpose_codec_owner");
  }

  if (
    openAIBoundaryImportPattern.test(source) &&
    !approvedOpenAIBoundaryImporters.has(relativePath)
  ) {
    found.add("direct_openai_boundary_import");
  }

  const legacySummaryWriters = findLegacySummaryWriterCandidates(
    relativePath,
    source,
  );
  if (
    legacySummaryWriters.length > 0 &&
    !isApprovedLegacySummaryCompatibilityWriter(
      relativePath,
      legacySummaryWriters,
    )
  ) {
    found.add("legacy_run_receipt_model_summary_writer");
  }

  return [...found]
    .sort()
    .map((kind) => ({ file: relativePath, kind }));
}

function findLegacySummaryWriterCandidates(
  relativePath: string,
  source: string,
): LegacySummaryWriterCandidate[] {
  const sourceFile = ts.createSourceFile(
    relativePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    scriptKindFor(relativePath),
  );
  const candidates: LegacySummaryWriterCandidate[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isObjectLiteralExpression(node)) {
      const properties = new Set(
        node.properties
          .map(staticObjectPropertyName)
          .filter((name): name is string => name !== null),
      );
      if (
        [...legacySummaryRequiredProperties].every((property) =>
          properties.has(property),
        ) &&
        [...currentModelInvocationEntryMarkers].every(
          (property) => !properties.has(property),
        )
      ) {
        candidates.push({
          enclosingFunctionName: enclosingNamedFunction(node),
        });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return candidates;
}

function staticObjectPropertyName(
  property: ts.ObjectLiteralElementLike,
): string | null {
  if (ts.isSpreadAssignment(property)) return null;
  const name = property.name;
  if (ts.isIdentifier(name) || ts.isStringLiteralLike(name)) {
    return name.text;
  }
  if (
    ts.isComputedPropertyName(name) &&
    ts.isStringLiteralLike(name.expression)
  ) {
    return name.expression.text;
  }
  return null;
}

function enclosingNamedFunction(node: ts.Node): string | null {
  for (let current = node.parent; current; current = current.parent) {
    if (
      (ts.isFunctionDeclaration(current) ||
        ts.isMethodDeclaration(current) ||
        ts.isGetAccessorDeclaration(current) ||
        ts.isSetAccessorDeclaration(current)) &&
      current.name
    ) {
      if (
        ts.isIdentifier(current.name) ||
        ts.isStringLiteralLike(current.name)
      ) {
        return current.name.text;
      }
    }
  }
  return null;
}

function scriptKindFor(relativePath: string): ts.ScriptKind {
  switch (path.extname(relativePath)) {
    case ".ts":
      return ts.ScriptKind.TS;
    case ".tsx":
      return ts.ScriptKind.TSX;
    case ".jsx":
      return ts.ScriptKind.JSX;
    case ".js":
    case ".mjs":
    case ".cjs":
      return ts.ScriptKind.JS;
    default:
      return ts.ScriptKind.Unknown;
  }
}

function isApprovedLegacySummaryCompatibilityWriter(
  relativePath: string,
  candidates: LegacySummaryWriterCandidate[],
): boolean {
  return (
    relativePath === approvedLegacySummaryCompatibilityWriter &&
    candidates.length === 1 &&
    candidates[0]?.enclosingFunctionName ===
      approvedLegacySummaryCompatibilityFunction
  );
}

function isReviewedRuntimeEnvironmentPropagation(
  relativePath: string,
  source: string,
): boolean {
  if (relativePath !== runtimeEnvironmentPropagationOwner) return false;
  const withoutReviewedPropagation = source
    .replace(
      /OPENAI_API_KEY:\s*nonEmptyString\(environment\.OPENAI_API_KEY\)/g,
      "",
    )
    .replace(
      /OPENAI_MODEL:\s*nonEmptyString\(environment\.OPENAI_MODEL\)/g,
      "",
    );
  return !providerConfigurationAccessPattern.test(withoutReviewedPropagation);
}

function assertSyntheticDetectionMatrix() {
  const legacySummaryBody = `
    invocation_ref,
    provider_ref,
    model_ref,
    started_at,
    finished_at,
    input_units,
    output_units,
    latency_ms,
    retry_count: 0,
    status: "completed",
    retention_class: null,
    egress_status: "occurred",
    raw_prompt_persisted: false,
    raw_response_persisted: false,
    hidden_reasoning_persisted: false,
    source_refs,
  `;
  const quotedLegacySummaryBody = `
    "invocation_ref": invocation_ref,
    "provider_ref": provider_ref,
    "model_ref": model_ref,
    "started_at": started_at,
    "finished_at": finished_at,
    "input_units": input_units,
    "output_units": output_units,
    "latency_ms": latency_ms,
    "retry_count": 0,
    "status": "completed",
    "retention_class": null,
    "egress_status": "occurred",
    "raw_prompt_persisted": false,
    "raw_response_persisted": false,
    "hidden_reasoning_persisted": false,
    "source_refs": source_refs,
  `;
  const cases: Array<{
    name: string;
    source: string;
    expected: BoundaryViolationKind | null;
  }> = [
    {
      name: "provider_domain_and_fetch",
      source: 'fetch("https://api.openai.com/v1/responses")',
      expected: "provider_transport_owner",
    },
    {
      name: "split_responses_endpoint",
      source: 'fetch(baseUrl + "/v1/" + "responses")',
      expected: "provider_transport_owner",
    },
    {
      name: "openai_sdk",
      source: 'import OpenAI from "openai"; new OpenAI().responses.create({});',
      expected: "provider_transport_owner",
    },
    {
      name: "provider_environment_read",
      source: "const key = process.env.OPENAI_API_KEY;",
      expected: "provider_configuration_owner",
    },
    {
      name: "provider_authorization",
      source: 'const openaiHeaders = { Authorization: `Bearer ${token}` };',
      expected: "provider_authorization_owner",
    },
    {
      name: "provider_response_parser",
      source: "const answer = response.output_text;",
      expected: "provider_response_parser_owner",
    },
    {
      name: "purpose_codec",
      source: "export function buildPlannerSystemPrompt() { return 'x'; }",
      expected: "provider_purpose_codec_owner",
    },
    {
      name: "direct_adapter_import",
      source:
        'import { createOpenAIResponsesAdapterV01 } from "@/lib/vnext/model-gateway/openai/responses-adapter";',
      expected: "direct_openai_boundary_import",
    },
    {
      name: "direct_legacy_summary_assignment",
      source: `const summary = {${legacySummaryBody}};`,
      expected: "legacy_run_receipt_model_summary_writer",
    },
    {
      name: "inline_legacy_summary_in_model_invocations",
      source: `const receipt = { model_invocations: [{${legacySummaryBody}}] };`,
      expected: "legacy_run_receipt_model_summary_writer",
    },
    {
      name: "returned_legacy_summary_array",
      source: `function summaries() { return [{${legacySummaryBody}}]; }`,
      expected: "legacy_run_receipt_model_summary_writer",
    },
    {
      name: "quoted_legacy_summary_properties",
      source: `const summary = {${quotedLegacySummaryBody}};`,
      expected: "legacy_run_receipt_model_summary_writer",
    },
    {
      name: "current_v02_model_invocation_entry",
      source: `const entry = {
        entry_version: "run_receipt_model_invocation.v0.2",
        invocation_ref,
        work_ref,
        run_ref,
        invocation_receipt,
        retry_count: 0,
        source_refs,
      };`,
      expected: null,
    },
    {
      name: "current_v02_projector_call",
      source:
        "const entry = projectModelInvocationReceiptToRunReceiptEntryV02(input);",
      expected: null,
    },
    {
      name: "provider_ref_only",
      source: "const destination = { provider_ref };",
      expected: null,
    },
    {
      name: "usage_units_only",
      source: "const usage = { input_units, output_units };",
      expected: null,
    },
    {
      name: "compatibility_type_import_only",
      source:
        'import type { RunReceiptModelInvocationSummaryV01 } from "@/types/vnext/run-receipt"; function validate(input: RunReceiptModelInvocationSummaryV01) { return Boolean(input); }',
      expected: null,
    },
    {
      name: "unrelated_github_bearer",
      source: 'fetch(githubUrl, { headers: { authorization: `Bearer ${token}` } });',
      expected: null,
    },
    {
      name: "secret_refusal_marker",
      source: 'const forbidden = /OPENAI_API_KEY/i;',
      expected: null,
    },
    {
      name: "same_origin_application_fetch",
      source: 'fetch("/api/vnext/projects")',
      expected: null,
    },
  ];

  for (const testCase of cases) {
    const detected = classifyBoundaryViolations(
      `lib/synthetic/${testCase.name}.ts`,
      testCase.source,
    ).map((item) => item.kind);
    if (testCase.expected === null) {
      assert.deepEqual(detected, [], testCase.name);
    } else {
      assert(detected.includes(testCase.expected), testCase.name);
    }
  }

  for (const extension of sourceExtensions) {
    const detected = classifyBoundaryViolations(
      `lib/synthetic/legacy-summary${extension}`,
      `const summary = {${legacySummaryBody}};`,
    ).map((item) => item.kind);
    assert(
      detected.includes("legacy_run_receipt_model_summary_writer"),
      `legacy_summary_extension:${extension}`,
    );
  }
}

function assertCurrentOwnershipInventory(files: SourceFile[]) {
  assert.deepEqual(
    ownersMatching(files, providerDomainPattern),
    [approvedTransportConfigurationOwner],
  );
  assert.deepEqual(
    ownersMatching(files, responsesEndpointPattern),
    [approvedTransportConfigurationOwner],
  );
  assert.deepEqual(
    ownersMatching(files, providerSdkPattern),
    [],
    "the R4 adapter uses the repository transport seam, not a provider SDK",
  );
  assert.deepEqual(
    ownersMatching(files, providerResponseShapePattern),
    [approvedTransportConfigurationOwner],
  );
  assert.deepEqual(
    ownersMatching(files, providerAuthorizationPattern).filter((owner) =>
      isProviderAuthorizationOwnerSource(sourceFor(files, owner)),
    ),
    [approvedTransportConfigurationOwner],
  );
  assert.deepEqual(
    ownersMatching(files, providerConfigurationAccessPattern).filter(
      (owner) => owner !== runtimeEnvironmentPropagationOwner,
    ),
    [approvedTransportConfigurationOwner],
  );
  assert(
    isReviewedRuntimeEnvironmentPropagation(
      runtimeEnvironmentPropagationOwner,
      sourceFor(files, runtimeEnvironmentPropagationOwner),
    ),
  );
}

function assertCallerGatewayBoundary(files: SourceFile[]) {
  for (const [relativePath, invocation] of [
    ["lib/observe/delta-compiler.ts", "invokeObserveModelGatewayV01"],
    ["lib/planner/planner.ts", "invokePlannerModelGatewayV01"],
    ["lib/temporal-interpretation/preview.ts", "invokeTemporalModelGatewayV01"],
    [
      "lib/vnext/automation/policy-triggered-planner-run.ts",
      "invokePlannerModelGatewayV01",
    ],
    [
      "lib/vnext/runtime/operator-pilot-strategic-advantage-transfer.ts",
      "invokeStrategicAdvantageTransferModelGatewayV01",
    ],
  ] as const) {
    const source = sourceFor(files, relativePath);
    assert(source.includes(invocation), `${relativePath}:${invocation}`);
    assert.equal(openAIBoundaryImportPattern.test(source), false, relativePath);
  }

  const projectHomeSource = sourceFor(
    files,
    "lib/vnext/project-home/project-home-projection.ts",
  );
  assert(
    projectHomeSource.includes("readDefaultModelGatewayLocalCapabilityV01"),
  );
  assert.equal(openAIBoundaryImportPattern.test(projectHomeSource), false);

  const strategicRuntimeSource = sourceFor(
    files,
    "lib/vnext/runtime/operator-pilot-strategic-advantage-transfer.ts",
  );
  const proposalAdmissionSource = sourceFor(
    files,
    "lib/vnext/persistence/episode-delta-proposal-admission.ts",
  );
  assert(
    strategicRuntimeSource.includes(
      "function admitPreparedStrategicProposalV01(",
    ),
  );
  assert.equal(
    strategicRuntimeSource.includes(
      "export function admitPreparedStrategicProposalV01(",
    ),
    false,
  );
  assert.equal(
    proposalAdmissionSource.includes(
      "StrategicEpisodeDeltaProposalAdmissionInputV01",
    ),
    false,
    "no exported low-level strategic payload writer may bypass persisted source re-resolution",
  );
}

function assertRunReceiptCompatibilityDisposition(files: SourceFile[]) {
  const hostReceipt = buildRunReceiptV01(
    openAiCodexHostAttestationInputFixture,
  );
  const validation = validateRunReceiptV01(hostReceipt);
  assert.equal(validation.status, "valid");
  assert.equal(hostReceipt.model_invocations.length, 1);
  assert(
    hostReceipt.model_invocations.every((item) => !("entry_version" in item)),
  );
  assert(
    hostReceipt.model_invocations.every(
      (item) => !("invocation_receipt" in item),
    ),
    "host attestations must remain pre-Gateway compatibility evidence",
  );
  assert(
    hostReceipt.compatibility.source_contracts.includes(
      "host_result_fixture.v0.1",
    ),
  );
  assert.equal(
    JSON.stringify(hostReceipt.model_invocations).includes(
      "model_gateway_version",
    ),
    false,
    "host attestations must not fabricate Gateway enforcement claims",
  );
  assert.equal(
    files.some(
      ({ relativePath }) =>
        relativePath === "fixtures/vnext/protocol/run-receipt-v0-1.ts",
    ),
    false,
    "host compatibility fixtures must remain outside production scanning",
  );

  const policyRunSource = sourceFor(
    files,
    "lib/vnext/automation/policy-triggered-planner-run.ts",
  );
  assert(
    policyRunSource.includes(
      "projectModelInvocationReceiptToRunReceiptEntryV02",
    ),
  );
  assert(policyRunSource.includes("run_receipt_model_invocation.v0.2"));
  const projectorSource = sourceFor(
    files,
    "lib/vnext/model-gateway/run-receipt-projection.ts",
  );
  assert(
    projectorSource.includes(
      "entry_version: RUN_RECEIPT_MODEL_INVOCATION_ENTRY_VERSION_V02",
    ),
  );
  assert(projectorSource.includes("invocation_receipt: receipt"));
  assert(
    sourceFor(
      files,
      "lib/vnext/model-gateway/model-invocation-receipt.ts",
    ).includes("ModelInvocationReceiptV02"),
  );

  const structuralWriters = files.flatMap(({ relativePath, source }) =>
    findLegacySummaryWriterCandidates(relativePath, source).map((candidate) => ({
      relativePath,
      enclosingFunctionName: candidate.enclosingFunctionName,
    })),
  );
  assert.deepEqual(structuralWriters, [
    {
      relativePath: approvedLegacySummaryCompatibilityWriter,
      enclosingFunctionName: approvedLegacySummaryCompatibilityFunction,
    },
  ]);
  assert.deepEqual(
    structuralWriters.filter(
      ({ relativePath }) =>
        relativePath !== approvedLegacySummaryCompatibilityWriter,
    ),
    [],
    "normal production code must not construct legacy model summaries",
  );

  const compatibilityWriterSource = sourceFor(
    files,
    approvedLegacySummaryCompatibilityWriter,
  );
  assert.equal(providerDomainPattern.test(compatibilityWriterSource), false);
  assert.equal(responsesEndpointPattern.test(compatibilityWriterSource), false);
  assert.equal(providerSdkPattern.test(compatibilityWriterSource), false);
  assert.equal(
    providerConfigurationAccessPattern.test(compatibilityWriterSource),
    false,
  );
  assert.equal(
    openAIBoundaryImportPattern.test(compatibilityWriterSource),
    false,
  );
  assert.equal(
    /\binvoke\w*ModelGateway\w*\b/.test(compatibilityWriterSource),
    false,
  );

  const summaryTypeOwners = files
    .filter(({ source }) =>
      source.includes("RunReceiptModelInvocationSummaryV01"),
    )
    .map(({ relativePath }) => relativePath);
  assert.deepEqual(summaryTypeOwners, ["types/vnext/run-receipt.ts"]);
  assert.equal(
    (
      sourceFor(files, "types/vnext/run-receipt.ts").match(
        /export\s+interface\s+RunReceiptModelInvocationSummaryV01\b/g,
      ) ?? []
    ).length,
    1,
    "exactly one compatibility type declaration must remain",
  );
}

function ownersMatching(files: SourceFile[], pattern: RegExp): string[] {
  return files
    .filter(({ source }) => pattern.test(source))
    .map(({ relativePath }) => relativePath)
    .sort();
}

function isProviderAuthorizationOwnerSource(source: string): boolean {
  return (
    providerDomainPattern.test(source) ||
    responsesEndpointPattern.test(source) ||
    providerSdkPattern.test(source) ||
    providerConfigurationAccessPattern.test(source) ||
    /openai(?:client|transport|request|headers?)/i.test(source)
  );
}

function sourceFor(files: SourceFile[], relativePath: string): string {
  const file = files.find((candidate) => candidate.relativePath === relativePath);
  assert(file, `missing production source: ${relativePath}`);
  return file.source;
}

function repositoryRelative(absolutePath: string): string {
  return path.relative(repositoryRoot, absolutePath).split(path.sep).join("/");
}

function formatViolations(violations: BoundaryViolation[]): string {
  if (violations.length === 0) return "no R4 model boundary violations";
  return violations.map((item) => `${item.file}:${item.kind}`).join("\n");
}
