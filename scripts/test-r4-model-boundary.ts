#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
  "lib/vnext/model-gateway/openai/temporal-codec.ts",
]);
const approvedOpenAIBoundaryImporters = new Set([
  approvedTransportConfigurationOwner,
  sharedGatewayOwner,
]);
const runtimeEnvironmentPropagationOwner =
  "scripts/augnes-runtime-supervisor.mjs";
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

type BoundaryViolationKind =
  | "provider_transport_owner"
  | "provider_configuration_owner"
  | "provider_authorization_owner"
  | "provider_response_parser_owner"
  | "provider_purpose_codec_owner"
  | "direct_openai_boundary_import";

interface BoundaryViolation {
  file: string;
  kind: BoundaryViolationKind;
}

interface SourceFile {
  relativePath: string;
  source: string;
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
  /\b(?:build(?:Observe|Planner|Temporal)SystemPrompt|parse(?:Observe|Planner|Temporal)Output|project(?:Observe|Planner|Temporal)ModelMaterial|(?:observe|planner|temporal)ResponseSchema)\b/;
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

  return [...found]
    .sort()
    .map((kind) => ({ file: relativePath, kind }));
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

  const policyRunSource = sourceFor(
    files,
    "lib/vnext/automation/policy-triggered-planner-run.ts",
  );
  assert(
    policyRunSource.includes(
      "projectModelInvocationReceiptToRunReceiptEntryV02",
    ),
  );
  const summaryTypeOwners = files
    .filter(({ source }) =>
      source.includes("RunReceiptModelInvocationSummaryV01"),
    )
    .map(({ relativePath }) => relativePath);
  assert.deepEqual(summaryTypeOwners, ["types/vnext/run-receipt.ts"]);
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
