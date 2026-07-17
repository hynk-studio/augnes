import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { EventEmitter } from "node:events";
import { readFileSync } from "node:fs";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { FileAugnesCoreAdapter } from "../src/adapters/file-core.js";
import { AugnesCoreHttpError, HttpAugnesCoreAdapter } from "../src/adapters/http-core.js";
import { MockAugnesCoreAdapter } from "../src/adapters/mock-core.js";
import { config } from "../src/lib/config.js";
import { sanitizeValue } from "../src/lib/sanitize.js";
import { ModelInvocationReceiptSchema } from "../src/lib/state-runtime-types.js";
import {
  AUGNES_BRIDGE_TOOL_NAMES,
  buildHealthPayload,
  createHttpServer,
  createMcpAppServer,
  LEGACY_PUBLIC_TOOL_NAMES,
  PUBLIC_TOOL_NAMES,
  WIDGET_CSP,
  WIDGET_URI,
} from "../src/server.js";
import { assertFileModeFixturePaths, readFileModeEnv } from "./load-file-env.js";
import { MockStateRuntimeBridgeAdapter } from "./mock-state-runtime.js";
import { assertAppsModelInvocationReceiptSemanticMatrix } from "./model-invocation-receipt-semantic-matrix.js";

function spawnConfigProfile(env: Record<string, string | undefined>) {
  const childEnv = { ...process.env };
  delete childEnv.AUGNES_APP_PROFILE;
  delete childEnv.AUGNES_APP_TOOL_SURFACE;
  delete childEnv.AUGNES_ENABLE_AGENT_BRIDGE;

  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete childEnv[key];
    else childEnv[key] = value;
  }

  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--input-type=module",
      "--eval",
      "const { config } = await import('./src/lib/config.ts'); console.log(config.appProfile);",
    ],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      env: childEnv,
    }
  );
}

function spawnToolProfileSnapshot(env: Record<string, string | undefined>) {
  const childEnv = { ...process.env };
  delete childEnv.AUGNES_APP_PROFILE;
  delete childEnv.AUGNES_APP_TOOL_SURFACE;
  delete childEnv.AUGNES_ENABLE_AGENT_BRIDGE;

  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete childEnv[key];
    else childEnv[key] = value;
  }

  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--input-type=module",
      "--eval",
      `
        const { MockAugnesCoreAdapter } = await import('./src/adapters/mock-core.ts');
        const { MockStateRuntimeBridgeAdapter } = await import('./scripts/mock-state-runtime.ts');
        const { createMcpAppServer, PUBLIC_TOOL_NAMES, WIDGET_URI } = await import('./src/server.ts');
        const server = createMcpAppServer(new MockAugnesCoreAdapter(), new MockStateRuntimeBridgeAdapter());
        const args = {
          search: { query: 'auth' },
          fetch: { id: 'ev-001' },
          open_casefile: { subject: 'auth' },
          get_working_view: {},
          explain_strategy: { subject: 'auth' },
          get_boundary_packet: {},
          get_continuity_report: {},
          navigate_repo: { query: 'server' },
          get_governance_audit: {},
          augnes_list_work_items: {},
          augnes_get_work_brief: { workId: 'AG-001' },
        };
        const profiles = {};
        for (const name of PUBLIC_TOOL_NAMES) {
          const result = await server._registeredTools[name].handler(args[name]);
          profiles[name] = {
            structuredProfile: result.structuredContent?.profile,
            metaProfile: result._meta?.profile,
          };
        }
        server.close();
        console.log(JSON.stringify({ widgetUri: WIDGET_URI, profiles, toolNames: Object.keys(server._registeredTools) }));
      `,
    ],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      env: childEnv,
    }
  );
}

function spawnBridgeToolProfileSnapshot(env: Record<string, string | undefined>) {
  const childEnv = { ...process.env };
  delete childEnv.AUGNES_APP_PROFILE;
  delete childEnv.AUGNES_APP_TOOL_SURFACE;
  delete childEnv.AUGNES_ENABLE_AGENT_BRIDGE;

  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete childEnv[key];
    else childEnv[key] = value;
  }

  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--input-type=module",
      "--eval",
      `
        const { MockAugnesCoreAdapter } = await import('./src/adapters/mock-core.ts');
        const { MockStateRuntimeBridgeAdapter } = await import('./scripts/mock-state-runtime.ts');
        const { AUGNES_BRIDGE_TOOL_NAMES, createMcpAppServer, WIDGET_URI } = await import('./src/server.ts');
        const server = createMcpAppServer(new MockAugnesCoreAdapter(), new MockStateRuntimeBridgeAdapter(), { enableAgentBridge: true });
        const args = {
          augnes_get_state_brief: {},
          augnes_get_project_constellation_preview: {},
          augnes_get_guide_brief: {},
          augnes_get_autonomy_contract_preview: {},
          augnes_get_autonomy_runner_preflight: { include_dry_run_plan: true, include_boundary: true },
          augnes_get_evidence_pack: {},
          augnes_get_session_trace: { sessionId: 'session:smoke-1', limit: 5 },
          augnes_get_verification_evidence_records: { workId: 'AG-001', limit: 5 },
          augnes_observe: {
            workspaceId: 'workspace:11111111-1111-4111-8111-111111111111',
            projectId: 'project:22222222-2222-4222-8222-222222222222',
            expectedActiveProjectId: 'project:22222222-2222-4222-8222-222222222222',
            expectedActiveSelectionRevision: 1,
            executionMode: 'deterministic',
            message: 'Record the current bridge smoke context.',
          },
          augnes_plan: {
            workspaceId: 'workspace:11111111-1111-4111-8111-111111111111',
            projectId: 'project:22222222-2222-4222-8222-222222222222',
            expectedActiveProjectId: 'project:22222222-2222-4222-8222-222222222222',
            expectedActiveSelectionRevision: 1,
            executionMode: 'deterministic',
            message: 'What should happen next?',
          },
          augnes_record_action_result: {
            sourceAgentId: 'codex-smoke',
            actionName: 'smoke_legacy_check',
            resultSummary: 'Legacy smoke tool invocation passed.',
            filesChanged: ['src/server.ts'],
          },
          augnes_list_pending_proposals: {},
          augnes_record_work_event: {
            workId: 'AG-001',
            actor: 'codex',
            eventType: 'verification',
            summary: 'Bridge work event smoke passed.',
            resultStatus: 'completed',
            resultKind: 'verification',
            relatedStateKeys: ['current_focus'],
          },
          augnes_get_mailbox_summary: {},
          augnes_get_publication_summary: {},
          augnes_get_publication_decision_card: {},
        };
        const profiles = {};
        for (const name of AUGNES_BRIDGE_TOOL_NAMES) {
          const result = await server._registeredTools[name].handler(args[name]);
          profiles[name] = {
            structuredProfile: result.structuredContent?.profile,
            metaProfile: result._meta?.profile,
            text: result.content?.[0]?.text,
            projectConstellationPreview: result.structuredContent?.project_constellation_preview,
            selectedContext: result.structuredContent?.selected_context,
            guideBrief: result.structuredContent?.guideBrief,
            guideBriefSnake: result.structuredContent?.guide_brief,
            guideBriefSummary: result.structuredContent?.guideBriefSummary,
            authorityBoundary: result.structuredContent?.authority_boundary,
            readBoundary: result.structuredContent?.read_boundary,
            routeBoundary: result.structuredContent?.route_boundary,
            autonomyContract: result.structuredContent?.autonomy_contract,
            contractSummary: result.structuredContent?.contract_summary,
            autonomyRunnerPreflight: result.structuredContent?.autonomy_runner_preflight,
            preflightSummary: result.structuredContent?.preflight_summary,
            dryRunPlan: result.structuredContent?.dry_run_plan,
            dryRunPlanSummary: result.structuredContent?.dry_run_plan_summary,
            readiness: result.structuredContent?.readiness,
            readinessSummary: result.structuredContent?.readiness_summary,
            blockers: result.structuredContent?.blockers,
            warnings: result.structuredContent?.warnings,
            assessments: result.structuredContent?.assessments,
            plannedSteps: result.structuredContent?.planned_steps,
            plannedReadSources: result.structuredContent?.planned_read_sources,
            blockedSteps: result.structuredContent?.blocked_steps,
            noRunBoundary: result.structuredContent?.no_run_boundary,
            noRunBoundaryNotes: result.structuredContent?.no_run_boundary_notes,
            budget: result.structuredContent?.budget,
            deltaMergePolicy: result.structuredContent?.delta_merge_policy,
            reviewEscalationPolicy: result.structuredContent?.review_escalation_policy,
            stopConditions: result.structuredContent?.stop_conditions,
            runPreview: result.structuredContent?.run_preview,
            outputPolicy: result.structuredContent?.output_policy,
            stalenessPolicy: result.structuredContent?.staleness_policy,
            validationPolicy: result.structuredContent?.validation_policy,
            allowedActions: result.structuredContent?.allowed_actions,
            forbiddenActions: result.structuredContent?.forbidden_actions,
            sourceRefs: result.structuredContent?.source_refs,
            publicSafety: result.structuredContent?.public_safety,
            routeAuthorityBoundary: result.structuredContent?.route_authority_boundary,
            sourceStatus: result.structuredContent?.source_status,
            observedContext: result.structuredContent?.observed_context,
            inferredContext: result.structuredContent?.inferred_context,
            suggestedContext: result.structuredContent?.suggested_context,
            needsUserJudgment: result.structuredContent?.needs_user_judgment,
            expectedFiles: result.structuredContent?.expected_files,
            forbiddenFiles: result.structuredContent?.forbidden_files,
            requiredChecks: result.structuredContent?.required_checks,
            skippedCheckPolicy: result.structuredContent?.skipped_check_policy,
            prBodyRequirements: result.structuredContent?.pr_body_requirements,
            finalReportRequirements: result.structuredContent?.final_report_requirements,
            actionRecord: result.structuredContent?.actionRecord,
            eventResult: result.structuredContent?.eventResult,
            evidencePack: result.structuredContent?.evidence_pack,
            sessionTrace: result.structuredContent?.session_trace,
            verificationEvidenceRecords: result.structuredContent?.verification_evidence_records,
            mailboxSummary: result.structuredContent?.mailbox_summary,
            publicationSummary: result.structuredContent?.publication_summary,
            decisionCard: result.structuredContent?.decision_card,
            boundaries: result.structuredContent?.boundaries,
          };
        }
        const richRecordResult = await server._registeredTools.augnes_record_action_result.handler({
          sourceAgentId: 'codex-smoke',
          actionName: 'smoke_rich_result_check',
          resultSummary: 'Rich smoke tool invocation passed.',
          filesChanged: [],
          resultStatus: 'blocked',
          resultKind: 'verification',
        });
        server.close();
        console.log(JSON.stringify({
          widgetUri: WIDGET_URI,
          profiles,
          richRecord: richRecordResult.structuredContent?.actionRecord,
          richRecordText: richRecordResult.content?.[0]?.text,
          toolNames: Object.keys(server._registeredTools)
        }));
      `,
    ],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      env: childEnv,
    }
  );
}

async function requestHealthz() {
  const server = createHttpServer(new MockAugnesCoreAdapter());

  try {
    return await new Promise<{ statusCode: number; body: string }>((resolve) => {
      const req = new EventEmitter() as EventEmitter & {
        method: string;
        url: string;
        headers: Record<string, string>;
      };
      req.method = "GET";
      req.url = "/healthz";
      req.headers = { host: "localhost" };

      const res = new EventEmitter() as EventEmitter & {
        statusCode?: number;
        headers?: Record<string, string>;
        writeHead: (statusCode: number, headers?: Record<string, string>) => typeof res;
        end: (body?: string) => void;
      };
      res.headers = {};
      res.writeHead = (statusCode, headers = {}) => {
        res.statusCode = statusCode;
        res.headers = headers;
        return res;
      };
      res.end = (body = "") => {
        resolve({ statusCode: res.statusCode ?? 200, body });
      };

      server.emit("request", req, res);
    });
  } finally {
    server.close();
  }
}

async function assertWidgetResourceSecurity() {
  const widgetHtml = readFileSync(new URL("../public/console-widget.html", import.meta.url), "utf8");
  assert.match(widgetHtml, /id="title"/, "widget should keep a visible read-only title");
  assert.match(widgetHtml, /canonical project-scoped/, "widget should explain canonical result admission");
  assert.doesNotMatch(widgetHtml, /\blocalStorage\b/, "widget must not use localStorage");
  assert.doesNotMatch(widgetHtml, /\bsessionStorage\b/, "widget must not use sessionStorage");
  assert.doesNotMatch(widgetHtml, /\beval\s*\(/, "widget must not use eval");
  assert.doesNotMatch(widgetHtml, /\bnew\s+Function\b/, "widget must not use new Function");
  assert.doesNotMatch(widgetHtml, /\bfetch\s*\(/, "widget must not make direct fetch calls");
  assert.doesNotMatch(widgetHtml, /\bXMLHttpRequest\b|\bWebSocket\b|\bEventSource\b/, "widget must not open direct network channels");
  assert.doesNotMatch(widgetHtml, /navigator\.clipboard|execCommand|<button|<textarea|codexResultText|codexResultPaste/i, "widget must not expose native-host transport actions");

  const server = createMcpAppServer(new MockAugnesCoreAdapter(), new MockStateRuntimeBridgeAdapter());
  try {
    const resources = (server as unknown as { _registeredResources?: Record<string, { name: string; readCallback: (...args: unknown[]) => Promise<unknown> }> })
      ._registeredResources;
    assert.ok(resources, "registered resources should be inspectable");
    const resource = resources[WIDGET_URI];
    assert.ok(resource, "versioned widget resource should be registered");
    assert.equal(resource.name, "augnes-console-widget-v2", "widget resource name should be versioned");

    const result = (await resource.readCallback(new URL(WIDGET_URI), {})) as {
      contents: Array<{
        uri: string;
        _meta?: {
          ui?: { csp?: typeof WIDGET_CSP; domain?: string };
          "openai/widgetCSP"?: unknown;
          "openai/widgetDomain"?: unknown;
        };
      }>;
    };
    const content = result.contents[0];
    assert.equal(content.uri, WIDGET_URI, "resource content should use the expected widget URI");
    assert.deepEqual(content._meta?.ui?.csp, WIDGET_CSP, "widget should declare a narrow SDK-native CSP");
    assert.deepEqual(content._meta?.["openai/widgetCSP"], { connect_domains: [], resource_domains: [] }, "widget should declare OpenAI CSP metadata");
    assert.equal(typeof content._meta?.ui?.domain, "string", "widget should declare a stable resource domain");
  } finally {
    server.close();
  }
}

async function main() {
  const intendedLegacyToolNames = [
    "search",
    "fetch",
    "open_casefile",
    "get_working_view",
    "explain_strategy",
    "get_boundary_packet",
    "get_continuity_report",
    "navigate_repo",
    "get_governance_audit",
  ];
  const intendedPublicToolNames = [
    ...intendedLegacyToolNames,
    "augnes_list_work_items",
    "augnes_get_work_brief",
  ];

  const canonicalSuccessReceipt = {
    receipt_version: "model_invocation_receipt.v0.2",
    gateway_version: "model_gateway.v0.1",
    invocation_id: "model-invocation:apps-schema-success",
    workspace_id: "workspace:11111111-1111-4111-8111-111111111111",
    project_id: "project:22222222-2222-4222-8222-222222222222",
    work_id: null,
    run_id: null,
    purpose: "observe_delta_compile",
    invocation_origin: "interactive",
    attempted_implementation_id: "openai_responses.observe",
    attempted_implementation_version: "openai_responses_observe_adapter.v0.1",
    attempted_provider_ref: {
      ref_version: "external_ref.v0.1",
      ref_type: "model_provider",
      external_id: "openai",
      provider: "openai",
      observed_at: "2026-07-15T00:00:00.000Z",
      trust_class: "direct_local_observation",
    },
    attempted_model_ref: {
      ref_version: "external_ref.v0.1",
      ref_type: "provider_model",
      external_id: "test-model",
      provider: "openai",
      observed_at: "2026-07-15T00:00:00.000Z",
      trust_class: "direct_local_observation",
    },
    final_implementation_id: "openai_responses.observe",
    final_implementation_version: "openai_responses_observe_adapter.v0.1",
    requested_mode: "live",
    execution_mode: "live",
    selection_reason: "requested_live",
    started_at: "2026-07-15T00:00:00.000Z",
    finished_at: "2026-07-15T00:00:00.010Z",
    latency_ms: 10,
    status: "completed",
    outcome: "live_success",
    egress_attempted: true,
    egress_status: "occurred",
    egress_policy_version: "model_gateway_egress_policy.v0.1",
    usage: {
      basis: "provider_report",
      quality: "reported",
      source: "provider_response",
      input_tokens: 80,
      output_tokens: 24,
      total_tokens: 104,
    },
    cost: {
      basis: "unavailable",
      amount: null,
      currency: null,
      source: "no_pricing_authority",
    },
    budget: {
      decision: "within_budget",
      input_bytes_limit: 98_304,
      input_bytes_used: 1_024,
      output_tokens_limit: 2_048,
      output_tokens_used: 24,
      provider_call_limit: 1,
      provider_calls_used: 1,
      timeout_limit_ms: 30_000,
      timeout_disposition: "completed_within_deadline",
    },
    cancellation_disposition: "not_cancelled",
    failure_code: null,
    data_classification: "private",
    retention_class: "none",
    privacy_decision: "provider_egress_approved",
    provenance_refs: [
      "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    ],
    grant_lineage_ref: null,
    automation_control_lineage_ref: null,
    fallback_used: false,
    coverage_class: "enforced",
    trust_class: "provider_report",
    raw_prompt_persisted: false,
    raw_response_persisted: false,
    hidden_reasoning_persisted: false,
    receipt_is_semantic_authority: false,
  };
  assert.deepEqual(
    ModelInvocationReceiptSchema.parse(canonicalSuccessReceipt),
    canonicalSuccessReceipt,
    "complete real-shaped Gateway receipts should pass the Apps contract"
  );
  assert.equal(
    assertAppsModelInvocationReceiptSemanticMatrix(canonicalSuccessReceipt),
    56,
    "the strict Apps mirror should reject the complete root contradiction matrix"
  );
  for (const [purpose, implementationId, implementationVersion] of [
    [
      "observe_delta_compile",
      "openai_responses.observe",
      "openai_responses_observe_adapter.v0.1",
    ],
    [
      "planner_plan",
      "openai_responses.planner",
      "openai_responses_planner_adapter.v0.1",
    ],
    [
      "temporal_interpretation",
      "openai_responses.temporal",
      "openai_responses_temporal_adapter.v0.1",
    ],
  ] as const) {
    const purposeReceipt = {
      ...canonicalSuccessReceipt,
      purpose,
      attempted_implementation_id: implementationId,
      attempted_implementation_version: implementationVersion,
      final_implementation_id: implementationId,
      final_implementation_version: implementationVersion,
    };
    assert.deepEqual(
      ModelInvocationReceiptSchema.parse(purposeReceipt),
      purposeReceipt,
      `${purpose} should use the one strict common Apps receipt contract`
    );
  }
  for (const [name, invalidReceipt] of [
    ["unknown raw_prompt", { ...canonicalSuccessReceipt, raw_prompt: "private" }],
    ["invalid outcome", { ...canonicalSuccessReceipt, outcome: "unknown" }],
    ["arbitrary failure code", { ...canonicalSuccessReceipt, failure_code: "arbitrary" }],
    ["malformed usage", { ...canonicalSuccessReceipt, usage: { input_tokens: "80" } }],
    ["incomplete budget", { ...canonicalSuccessReceipt, budget: { decision: "within_budget" } }],
    [
      "semantic authority",
      { ...canonicalSuccessReceipt, receipt_is_semantic_authority: true },
    ],
  ] as const) {
    assert.throws(
      () => ModelInvocationReceiptSchema.parse(invalidReceipt),
      `${name} receipt should be rejected`
    );
  }
  const mockObserveResult = await new MockStateRuntimeBridgeAdapter().observe({
    workspaceId: canonicalSuccessReceipt.workspace_id,
    projectId: canonicalSuccessReceipt.project_id,
    expectedActiveProjectId: canonicalSuccessReceipt.project_id,
    expectedActiveSelectionRevision: 1,
    message: "Validate the complete mock receipt fixture.",
    executionMode: "deterministic",
  });
  assert.deepEqual(
    ModelInvocationReceiptSchema.parse(
      mockObserveResult.model_invocation_receipt
    ),
    mockObserveResult.model_invocation_receipt,
    "mock Observe should emit a complete canonical receipt"
  );
  const mockPlanResult = await new MockStateRuntimeBridgeAdapter().plan({
    workspaceId: canonicalSuccessReceipt.workspace_id,
    projectId: canonicalSuccessReceipt.project_id,
    expectedActiveProjectId: canonicalSuccessReceipt.project_id,
    expectedActiveSelectionRevision: 1,
    message: "Validate the complete Planner mock receipt fixture.",
    executionMode: "deterministic",
  });
  assert.deepEqual(
    ModelInvocationReceiptSchema.parse(mockPlanResult.model_invocation_receipt),
    mockPlanResult.model_invocation_receipt,
    "mock Planner should emit a complete canonical receipt"
  );
  const gatewayBridgeServer = createMcpAppServer(
    new MockAugnesCoreAdapter(),
    new MockStateRuntimeBridgeAdapter(),
    { enableAgentBridge: true }
  );
  try {
    const gatewayBridgeTools = (
      gatewayBridgeServer as unknown as {
        _registeredTools: {
          augnes_observe: {
            handler(input: Record<string, unknown>): Promise<{
              structuredContent?: unknown;
            }>;
          };
          augnes_plan: {
            handler(input: Record<string, unknown>): Promise<{
              structuredContent?: unknown;
            }>;
          };
        };
      }
    )._registeredTools;
    const bridgeObserveResult = await gatewayBridgeTools.augnes_observe.handler({
      workspaceId: canonicalSuccessReceipt.workspace_id,
      projectId: canonicalSuccessReceipt.project_id,
      expectedActiveProjectId: canonicalSuccessReceipt.project_id,
      expectedActiveSelectionRevision: 1,
      message: "Validate the Observe bridge receipt boundary.",
      executionMode: "deterministic",
    });
    const structuredObserve = (
      bridgeObserveResult.structuredContent as {
        observe?: { model_invocation_receipt?: unknown };
      }
    ).observe;
    assert.ok(structuredObserve, "Observe bridge should return its runtime result");
    assert.deepEqual(
      ModelInvocationReceiptSchema.parse(
        structuredObserve.model_invocation_receipt
      ),
      structuredObserve.model_invocation_receipt,
      "Observe bridge should preserve the strict canonical receipt"
    );
    const bridgePlanResult = await gatewayBridgeTools.augnes_plan.handler({
      workspaceId: canonicalSuccessReceipt.workspace_id,
      projectId: canonicalSuccessReceipt.project_id,
      expectedActiveProjectId: canonicalSuccessReceipt.project_id,
      expectedActiveSelectionRevision: 1,
      message: "Validate the Planner bridge receipt boundary.",
      executionMode: "deterministic",
    });
    const structuredPlan = (
      bridgePlanResult.structuredContent as {
        plan?: { model_invocation_receipt?: unknown };
      }
    ).plan;
    assert.ok(structuredPlan, "Planner bridge should return its runtime result");
    assert.deepEqual(
      ModelInvocationReceiptSchema.parse(
        structuredPlan.model_invocation_receipt
      ),
      structuredPlan.model_invocation_receipt,
      "Planner bridge should preserve the strict canonical receipt"
    );
  } finally {
    gatewayBridgeServer.close();
  }

  assert.equal(typeof config.useMock, "boolean", "config.useMock should load");
  assert.equal(typeof config.apiBaseUrl, "string", "config.apiBaseUrl should load");
  assert.equal(typeof config.enableAgentBridge, "boolean", "config.enableAgentBridge should load");
  assert.ok(config.appProfile === "public" || config.appProfile === "chrono_lab", "config.appProfile should load safely");

  const defaultProfile = spawnConfigProfile({});
  assert.equal(defaultProfile.status, 0, `default profile config should load: ${defaultProfile.stderr}`);
  assert.equal(defaultProfile.stdout.trim(), "public", "unset AUGNES_APP_PROFILE should default to public");

  const chronoProfile = spawnConfigProfile({ AUGNES_APP_PROFILE: "chrono_lab" });
  assert.equal(chronoProfile.status, 0, `chrono_lab profile config should load: ${chronoProfile.stderr}`);
  assert.equal(chronoProfile.stdout.trim(), "chrono_lab", "AUGNES_APP_PROFILE=chrono_lab should be accepted");

  const invalidProfile = spawnConfigProfile({ AUGNES_APP_PROFILE: "invalid" });
  assert.notEqual(invalidProfile.status, 0, "invalid AUGNES_APP_PROFILE should fail clearly");
  assert.match(invalidProfile.stderr, /Invalid AUGNES_APP_PROFILE: invalid/);

  const healthPayload = buildHealthPayload();
  assert.equal(healthPayload.profile, config.appProfile, "health payload should include the active profile");
  assert.deepEqual(Object.keys(healthPayload).sort(), ["mode", "name", "ok", "profile", "readOnly", "version"]);
  assert.ok(
    !JSON.stringify(healthPayload).match(/token|secret|providerSession|threadId|workspaceId|runId|traceId|auth/i),
    "health payload should not expose unsafe identifiers"
  );

  const healthResponse = await requestHealthz();
  assert.equal(healthResponse.statusCode, 200, "/healthz should return 200");
  assert.deepEqual(JSON.parse(healthResponse.body), healthPayload, "/healthz should return the health payload with profile");
  assert.equal(WIDGET_URI, "ui://widget/augnes-console.v2.html", "widget resource URI should be versioned for cache busting");
  assert.deepEqual(WIDGET_CSP, { connectDomains: [], resourceDomains: [], frameDomains: [], baseUriDomains: [] });
  await assertWidgetResourceSecurity();

  const publicToolProfiles = spawnToolProfileSnapshot({});
  assert.equal(publicToolProfiles.status, 0, `public tool profile snapshot should run: ${publicToolProfiles.stderr}`);
  const publicSnapshot = JSON.parse(publicToolProfiles.stdout);
  assert.equal(publicSnapshot.widgetUri, WIDGET_URI, "child snapshot should use the versioned widget URI");
  assert.deepEqual(publicSnapshot.toolNames, intendedPublicToolNames, "default tool snapshot should expose only the original public tools");
  for (const toolName of intendedPublicToolNames) {
    assert.equal(publicSnapshot.profiles[toolName].structuredProfile, "public", `${toolName} should include structuredContent.profile in public mode`);
    assert.equal(publicSnapshot.profiles[toolName].metaProfile, "public", `${toolName} should include _meta.profile in public mode`);
  }

  const envBridgeToolProfiles = spawnToolProfileSnapshot({ AUGNES_ENABLE_AGENT_BRIDGE: "true" });
  assert.equal(envBridgeToolProfiles.status, 0, `env bridge-gated tool snapshot should run: ${envBridgeToolProfiles.stderr}`);
  const envBridgeSnapshot = JSON.parse(envBridgeToolProfiles.stdout);
  assert.deepEqual(
    envBridgeSnapshot.toolNames,
    [...intendedPublicToolNames, ...AUGNES_BRIDGE_TOOL_NAMES],
    "AUGNES_ENABLE_AGENT_BRIDGE=true should expose bridge tools in addition to the public tools"
  );

  const chronoToolProfiles = spawnToolProfileSnapshot({ AUGNES_APP_PROFILE: "chrono_lab" });
  assert.equal(chronoToolProfiles.status, 0, `chrono_lab tool profile snapshot should run: ${chronoToolProfiles.stderr}`);
  const chronoSnapshot = JSON.parse(chronoToolProfiles.stdout);
  assert.deepEqual(chronoSnapshot.toolNames, intendedPublicToolNames, "chrono_lab default tool snapshot should expose only the original public tools");
  for (const toolName of intendedPublicToolNames) {
    assert.equal(
      chronoSnapshot.profiles[toolName].structuredProfile,
      "chrono_lab",
      `${toolName} should include structuredContent.profile in chrono_lab mode`
    );
    assert.equal(chronoSnapshot.profiles[toolName].metaProfile, "chrono_lab", `${toolName} should include _meta.profile in chrono_lab mode`);
  }

  const bridgeToolProfiles = spawnBridgeToolProfileSnapshot({});
  assert.equal(bridgeToolProfiles.status, 0, `bridge-enabled tool profile snapshot should run: ${bridgeToolProfiles.stderr}`);
  const bridgeSnapshot = JSON.parse(bridgeToolProfiles.stdout);
  assert.equal(bridgeSnapshot.widgetUri, WIDGET_URI, "bridge child snapshot should use the versioned widget URI");
  assert.deepEqual(
    bridgeSnapshot.toolNames,
    [...intendedPublicToolNames, ...AUGNES_BRIDGE_TOOL_NAMES],
    "bridge-enabled snapshot should expose public tools plus the explicit Augnes bridge tools"
  );
  for (const toolName of AUGNES_BRIDGE_TOOL_NAMES) {
    assert.equal(bridgeSnapshot.profiles[toolName].structuredProfile, "public", `${toolName} should include structuredContent.profile`);
    assert.equal(bridgeSnapshot.profiles[toolName].metaProfile, "public", `${toolName} should include _meta.profile`);
  }
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_project_constellation_preview.projectConstellationPreview.project_constellation.nodes.length,
    1,
    "augnes_get_project_constellation_preview should return bounded Project Constellation nodes"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_project_constellation_preview.selectedContext.advisory_only,
    true,
    "augnes_get_project_constellation_preview should return structured advisory context without transport text"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_guide_brief.guideBrief.guide_version,
    "guide_brief.v0.1",
    "augnes_get_guide_brief should return GuideBrief structured content"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_guide_brief.guideBriefSummary.observed_count,
    1,
    "augnes_get_guide_brief should summarize observed items"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_guide_brief.guideBrief.authority_boundary.can_execute_codex,
    false,
    "augnes_get_guide_brief should not expose Codex execution authority"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_guide_brief.guideBrief.authority_boundary.can_call_openai_or_provider,
    false,
    "augnes_get_guide_brief should preserve guideBrief OpenAI/provider denial"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_guide_brief.guideBriefSnake.authority_boundary.can_call_openai_or_provider,
    false,
    "augnes_get_guide_brief should preserve guide_brief OpenAI/provider denial"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_guide_brief.authorityBoundary.can_call_openai_or_provider,
    false,
    "augnes_get_guide_brief should preserve top-level OpenAI/provider denial"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_guide_brief.readBoundary.handoff_execution_authority,
    false,
    "augnes_get_guide_brief should keep handoff execution authority denied"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_guide_brief.readBoundary.github_openai_provider_calls,
    false,
    "augnes_get_guide_brief should preserve read boundary OpenAI/provider denial"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_guide_brief.routeBoundary.github_openai_provider_calls,
    false,
    "augnes_get_guide_brief should preserve route boundary OpenAI/provider denial"
  );
  assert.match(
    bridgeSnapshot.profiles.augnes_get_guide_brief.text,
    /Suggestions are not actions/i,
    "augnes_get_guide_brief should state suggestions are not actions"
  );
  assert.match(
    bridgeSnapshot.profiles.augnes_get_guide_brief.text,
    /Needs user judgment items are not decided by the guide/i,
    "augnes_get_guide_brief should state user judgment items are not decided"
  );
  assert.match(
    bridgeSnapshot.profiles.augnes_get_guide_brief.text,
    /Handoff candidates are preview-only/i,
    "augnes_get_guide_brief should state handoff candidates are preview-only"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_autonomy_contract_preview.autonomyContract.contract_version,
    "autonomy_contract.v0.1",
    "augnes_get_autonomy_contract_preview should return Autonomy Contract structured content"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_autonomy_contract_preview.contractSummary.run_preview_status,
    "preview_only",
    "augnes_get_autonomy_contract_preview should summarize run_preview.status"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_autonomy_contract_preview.runPreview.status,
    "preview_only",
    "augnes_get_autonomy_contract_preview should expose run_preview.status as preview_only"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_autonomy_contract_preview.deltaMergePolicy.auto_apply_allowed,
    false,
    "augnes_get_autonomy_contract_preview should preserve auto_apply_allowed false"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_autonomy_contract_preview.deltaMergePolicy.auto_apply_targets.length,
    0,
    "augnes_get_autonomy_contract_preview should preserve empty auto_apply_targets"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_autonomy_contract_preview.autonomyContract.authority_boundary.can_execute_codex,
    false,
    "augnes_get_autonomy_contract_preview should preserve Codex execution denial"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_autonomy_contract_preview.autonomyContract.authority_boundary.can_launch_codex,
    false,
    "augnes_get_autonomy_contract_preview should preserve Codex launch denial"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_autonomy_contract_preview.autonomyContract.authority_boundary.can_call_openai_or_provider,
    false,
    "augnes_get_autonomy_contract_preview should preserve OpenAI/provider denial"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_autonomy_contract_preview.autonomyContract.authority_boundary.can_schedule_background_work,
    false,
    "augnes_get_autonomy_contract_preview should preserve scheduler denial"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_autonomy_contract_preview.autonomyContract.authority_boundary.can_start_daemon,
    false,
    "augnes_get_autonomy_contract_preview should preserve daemon denial"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_autonomy_contract_preview.authorityBoundary.can_write_db,
    false,
    "augnes_get_autonomy_contract_preview should preserve DB write denial"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_autonomy_contract_preview.readBoundary.autonomy_runner_authority,
    false,
    "augnes_get_autonomy_contract_preview should deny runner authority"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_autonomy_contract_preview.readBoundary.scheduler_authority,
    false,
    "augnes_get_autonomy_contract_preview should deny scheduler authority"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_autonomy_contract_preview.readBoundary.daemon_authority,
    false,
    "augnes_get_autonomy_contract_preview should deny daemon authority"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_autonomy_contract_preview.readBoundary.background_work_authority,
    false,
    "augnes_get_autonomy_contract_preview should deny background work authority"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_autonomy_contract_preview.readBoundary.github_openai_provider_calls,
    false,
    "augnes_get_autonomy_contract_preview should deny GitHub/OpenAI/provider calls"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_autonomy_contract_preview.readBoundary.proof_evidence_writes,
    false,
    "augnes_get_autonomy_contract_preview should deny proof/evidence writes"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_autonomy_contract_preview.readBoundary.state_memory_db_mutation,
    false,
    "augnes_get_autonomy_contract_preview should deny state/memory/DB mutation"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_autonomy_contract_preview.readBoundary.handoff_send_authority,
    false,
    "augnes_get_autonomy_contract_preview should deny handoff send authority"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_autonomy_contract_preview.readBoundary.branch_pr_creation_authority,
    false,
    "augnes_get_autonomy_contract_preview should deny branch/PR creation authority"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_autonomy_contract_preview.readBoundary.auto_apply_authority,
    false,
    "augnes_get_autonomy_contract_preview should deny auto-apply authority"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_autonomy_contract_preview.readBoundary.budget_spend_permission,
    false,
    "augnes_get_autonomy_contract_preview should state budget is not spend permission"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_autonomy_contract_preview.readBoundary.run_preview_is_execution,
    false,
    "augnes_get_autonomy_contract_preview should state run preview is not execution"
  );
  assert.ok(
    bridgeSnapshot.profiles.augnes_get_autonomy_contract_preview.budget,
    "augnes_get_autonomy_contract_preview should expose budget boundaries"
  );
  assert.ok(
    bridgeSnapshot.profiles.augnes_get_autonomy_contract_preview.reviewEscalationPolicy,
    "augnes_get_autonomy_contract_preview should expose review escalation policy"
  );
  assert.ok(
    Array.isArray(bridgeSnapshot.profiles.augnes_get_autonomy_contract_preview.stopConditions),
    "augnes_get_autonomy_contract_preview should expose stop conditions"
  );
  assert.ok(
    bridgeSnapshot.profiles.augnes_get_autonomy_contract_preview.outputPolicy,
    "augnes_get_autonomy_contract_preview should expose output policy"
  );
  assert.match(
    bridgeSnapshot.profiles.augnes_get_autonomy_contract_preview.text,
    /Budget is not spend permission/i,
    "augnes_get_autonomy_contract_preview should state budget is not spend permission"
  );
  assert.match(
    bridgeSnapshot.profiles.augnes_get_autonomy_contract_preview.text,
    /no autonomy runner, no scheduler, no daemon, no background work/i,
    "augnes_get_autonomy_contract_preview should deny runner, scheduler, daemon, and background work"
  );
  assert.match(
    bridgeSnapshot.profiles.augnes_get_autonomy_contract_preview.text,
    /no Codex execution, no Codex launch/i,
    "augnes_get_autonomy_contract_preview should deny Codex execution and launch"
  );
  assert.match(
    bridgeSnapshot.profiles.augnes_get_autonomy_contract_preview.text,
    /no GitHub\/OpenAI\/provider calls/i,
    "augnes_get_autonomy_contract_preview should deny GitHub/OpenAI/provider calls"
  );
  assert.match(
    bridgeSnapshot.profiles.augnes_get_autonomy_contract_preview.text,
    /no handoff send/i,
    "augnes_get_autonomy_contract_preview should deny handoff send"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_autonomy_runner_preflight.autonomyRunnerPreflight.preflight_version,
    "autonomy_runner_preflight.v0.1",
    "augnes_get_autonomy_runner_preflight should return Autonomy Runner Preflight structured content"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_autonomy_runner_preflight.dryRunPlan.status,
    "dry_run_only",
    "augnes_get_autonomy_runner_preflight should return a dry_run_only plan"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_autonomy_runner_preflight.preflightSummary.every_planned_step_would_execute_false,
    true,
    "augnes_get_autonomy_runner_preflight should preserve would_execute false for every planned step"
  );
  assert.ok(
    bridgeSnapshot.profiles.augnes_get_autonomy_runner_preflight.plannedSteps.length > 0,
    "augnes_get_autonomy_runner_preflight should expose planned steps"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_autonomy_runner_preflight.plannedSteps.every((step: { would_execute?: unknown }) => step.would_execute === false),
    true,
    "augnes_get_autonomy_runner_preflight planned steps must all have would_execute false"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_autonomy_runner_preflight.authorityBoundary.can_start_runner,
    false,
    "augnes_get_autonomy_runner_preflight should deny runner start authority"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_autonomy_runner_preflight.authorityBoundary.can_schedule_runner,
    false,
    "augnes_get_autonomy_runner_preflight should deny runner schedule authority"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_autonomy_runner_preflight.authorityBoundary.can_execute_codex,
    false,
    "augnes_get_autonomy_runner_preflight should deny Codex execution"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_autonomy_runner_preflight.authorityBoundary.can_call_openai_or_provider,
    false,
    "augnes_get_autonomy_runner_preflight should deny OpenAI/provider calls"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_autonomy_runner_preflight.authorityBoundary.can_call_github,
    false,
    "augnes_get_autonomy_runner_preflight should deny GitHub calls"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_autonomy_runner_preflight.authorityBoundary.can_write_db,
    false,
    "augnes_get_autonomy_runner_preflight should deny DB writes"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_autonomy_runner_preflight.authorityBoundary.can_spend_budget,
    false,
    "augnes_get_autonomy_runner_preflight should deny budget spend"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_autonomy_runner_preflight.authorityBoundary.can_auto_apply_delta,
    false,
    "augnes_get_autonomy_runner_preflight should deny auto-apply"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_autonomy_runner_preflight.noRunBoundary.can_start_runner,
    false,
    "augnes_get_autonomy_runner_preflight should expose no-run boundary"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_autonomy_runner_preflight.readBoundary.dry_run_plan_is_execution,
    false,
    "augnes_get_autonomy_runner_preflight should state dry-run plan is not execution"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_autonomy_runner_preflight.noRunBoundaryNotes.no_run_started,
    true,
    "augnes_get_autonomy_runner_preflight should expose no-run boundary notes"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_autonomy_runner_preflight.publicSafety.contains_private_conversation,
    false,
    "augnes_get_autonomy_runner_preflight should not expose private conversation data"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_autonomy_runner_preflight.publicSafety.contains_secrets_or_tokens,
    false,
    "augnes_get_autonomy_runner_preflight should not expose secrets or tokens"
  );
  assert.match(
    bridgeSnapshot.profiles.augnes_get_autonomy_runner_preflight.text,
    /Read-only Autonomy Runner Preflight \/ Dry-Run preview tool/i,
    "augnes_get_autonomy_runner_preflight should state read-only preview behavior"
  );
  assert.match(
    bridgeSnapshot.profiles.augnes_get_autonomy_runner_preflight.text,
    /no runner starts, no scheduler starts, no daemon starts, no background work starts/i,
    "augnes_get_autonomy_runner_preflight should deny runner, scheduler, daemon, and background work"
  );
  assert.match(
    bridgeSnapshot.profiles.augnes_get_autonomy_runner_preflight.text,
    /no Codex execution, no GitHub\/provider\/OpenAI call/i,
    "augnes_get_autonomy_runner_preflight should deny Codex, GitHub, and provider calls"
  );
  assert.match(
    bridgeSnapshot.profiles.augnes_get_autonomy_runner_preflight.text,
    /no DB write, no proof\/evidence write, no memory mutation, no durable Perspective apply/i,
    "augnes_get_autonomy_runner_preflight should deny writes and durable state mutation"
  );
  assert.match(
    bridgeSnapshot.profiles.augnes_get_autonomy_runner_preflight.text,
    /no handoff send, no branch\/PR creation, no auto-apply, no budget spend, and no external side effect/i,
    "augnes_get_autonomy_runner_preflight should deny handoff, PR, auto-apply, budget, and external effects"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_record_action_result.actionRecord.action_name,
    "smoke_legacy_check",
    "legacy augnes_record_action_result payload should still work"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_record_work_event.eventResult.event.work_id,
    "AG-001",
    "augnes_record_work_event should preserve the target work_id"
  );
  assert.match(
    bridgeSnapshot.profiles.augnes_record_work_event.text,
    /no state deltas were committed or rejected/i,
    "augnes_record_work_event should state that it does not commit or reject state"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_mailbox_summary.mailboxSummary.summary.pending_handoffs.length,
    1,
    "augnes_get_mailbox_summary should return pending handoff summary items"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_mailbox_summary.mailboxSummary.summary.inactive.superseded_count,
    1,
    "augnes_get_mailbox_summary should preserve inactive counts"
  );
  assert.match(
    bridgeSnapshot.profiles.augnes_get_mailbox_summary.text,
    /read-only derived view/i,
    "augnes_get_mailbox_summary should state the derived read-only boundary"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_mailbox_summary.boundaries.state_commit_or_reject,
    false,
    "augnes_get_mailbox_summary should not expose state commit or reject authority"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_publication_summary.publicationSummary.summary.approved_previews.length,
    1,
    "augnes_get_publication_summary should return approved preview summary items"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_publication_summary.publicationSummary.summary.failed_deliveries[0].error_message,
    "GitHub publish failed: mock token unavailable.",
    "augnes_get_publication_summary should preserve failed delivery error messages"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_publication_summary.publicationSummary.limits.bounded_view,
    true,
    "augnes_get_publication_summary should declare bounded summary semantics"
  );
  assert.doesNotMatch(
    JSON.stringify(bridgeSnapshot.profiles.augnes_get_publication_summary.publicationSummary),
    /idempotency_key|idempotencyKey/,
    "augnes_get_publication_summary publication_summary must not expose idempotency keys"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_publication_summary.boundaries.publish_authority,
    false,
    "augnes_get_publication_summary should not expose publish authority"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_publication_summary.boundaries.github_posting,
    false,
    "augnes_get_publication_summary should not expose GitHub posting authority"
  );
  assert.match(
    bridgeSnapshot.profiles.augnes_get_publication_summary.text,
    /derived read-only view/i,
    "augnes_get_publication_summary should state the derived read-only boundary"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_publication_decision_card.decisionCard.status_summary.approved_preview_count,
    1,
    "augnes_get_publication_decision_card should count approved previews"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_publication_decision_card.decisionCard.status_summary.failed_delivery_count,
    1,
    "augnes_get_publication_decision_card should count failed deliveries"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_publication_decision_card.decisionCard.publication_items.find(
      (item: { publication_id: string }) => item.publication_id === "publication:smoke-approved"
    )?.decision_state,
    "approved_preview_needs_separate_publish_decision",
    "augnes_get_publication_decision_card should map approved previews to separate publish decisions"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_publication_decision_card.decisionCard.boundaries.publish_authority,
    false,
    "augnes_get_publication_decision_card should not expose publish authority"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_publication_decision_card.decisionCard.boundaries.external_side_effects,
    false,
    "augnes_get_publication_decision_card should not expose external side effects"
  );
  assert.doesNotMatch(
    JSON.stringify(bridgeSnapshot.profiles.augnes_get_publication_decision_card.decisionCard),
    /idempotency_key|idempotencyKey/,
    "augnes_get_publication_decision_card must not expose idempotency keys"
  );
  assert.match(
    bridgeSnapshot.profiles.augnes_get_publication_decision_card.text,
    /Read-only publication decision card/i,
    "augnes_get_publication_decision_card should state the read-only decision-card boundary"
  );
  assert.match(
    bridgeSnapshot.profiles.augnes_get_publication_decision_card.text,
    /does not approve, publish, retry, record proof, commit or reject state, execute Codex, mutate GitHub, or post to Discord/i,
    "augnes_get_publication_decision_card should deny approval, publication, proof, state, Codex, GitHub, and Discord authority"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_evidence_pack.boundaries.read_only,
    true,
    "augnes_get_evidence_pack should expose read-only boundaries"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_session_trace.sessionTrace.session_id,
    "session:smoke-1",
    "augnes_get_session_trace should preserve structured session identifiers"
  );
  assert.equal(
    bridgeSnapshot.profiles.augnes_get_verification_evidence_records.verificationEvidenceRecords.records.length,
    1,
    "augnes_get_verification_evidence_records should preserve the records list"
  );
  assert.equal(
    bridgeSnapshot.richRecord.action_name,
    "smoke_rich_result_check",
    "rich augnes_record_action_result payload should preserve runtime action result"
  );
  assert.equal(bridgeSnapshot.richRecord.result_status, "blocked", "resultStatus should pass through to runtime result_status");
  assert.equal(bridgeSnapshot.richRecord.result_kind, "verification", "resultKind should pass through to runtime result_kind");
  assert.match(bridgeSnapshot.richRecordText, /0 changed file\(s\)/, "empty filesChanged array should be reflected in bridge response text");

  const fileModeEnv = readFileModeEnv();
  assert.equal(fileModeEnv.values.AUGNES_CORE_MODE, "file", "start:file env should select file mode");
  assert.equal(fileModeEnv.values.AUGNES_APP_PROFILE, "public", "start:file env should default to public presentation");
  await assertFileModeFixturePaths(fileModeEnv.values);

  const sanitized = sanitizeValue({
    token: "remove-me",
    nested: {
      sessionId: "remove-me",
      apiKey: "remove-me",
      evidenceId: "keep-me",
      boundaryId: "keep-me-too",
      providerSessionId: "remove-me",
    },
    items: [
      {
        traceId: "remove-me",
        claimId: "keep-claim",
      },
    ],
  });

  assert.deepEqual(sanitized, {
    nested: {
      evidenceId: "keep-me",
      boundaryId: "keep-me-too",
    },
    items: [
      {
        claimId: "keep-claim",
      },
    ],
  });

  const adapter = new MockAugnesCoreAdapter();
  const results = await adapter.search("auth");
  assert.ok(results.length > 0, "mock search should return results");
  assert.ok(await adapter.fetch(results[0].id), "mock fetch should return a document");
  assert.ok((await adapter.openCasefile("auth")).id, "mock casefile should return data");
  assert.ok((await adapter.getWorkingView()).summary, "mock working view should return data");
  assert.ok((await adapter.explainStrategy("auth")).recommendedAction, "mock strategy should return data");
  assert.ok((await adapter.getBoundaryPacket()).boundaryId, "mock boundary packet should return data");
  assert.ok((await adapter.getContinuityReport()).latestBoundaryId, "mock continuity should return data");
  assert.ok((await adapter.navigateRepo("server")).search.length > 0, "mock repo navigation should return data");
  assert.ok((await adapter.getGovernanceAudit()).readOnlyTools.length > 0, "mock audit should return data");

  const fileModeStartup = spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--input-type=module",
      "--eval",
      "const { createAugnesCoreAdapter } = await import('./src/adapters/index.ts'); createAugnesCoreAdapter();",
    ],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      env: {
        ...process.env,
        AUGNES_CORE_MODE: "file",
        AUGNES_WORKING_VIEW_FILE: "./data/does-not-exist.json",
        AUGNES_CASEFILE_FILE: "./data/also-does-not-exist.json",
        AUGNES_EVIDENCE_INDEX_FILE: "./data/evidence-index-does-not-exist.json",
        AUGNES_CONTINUITY_REPORT_FILE: "./data/continuity-report-does-not-exist.json",
        AUGNES_BOUNDARY_PACKET_FILE: "./data/boundary-packet-does-not-exist.json",
        AUGNES_STRATEGY_RATIONALE_FILE: "./data/strategy-rationale-does-not-exist.json",
        AUGNES_GOVERNANCE_AUDIT_FILE: "./data/governance-audit-does-not-exist.json",
        AUGNES_REPO_NAVIGATION_FILE: "./data/repo-navigation-does-not-exist.json",
      },
    }
  );
  assert.equal(fileModeStartup.status, 0, `file mode adapter construction should not read the file at startup: ${fileModeStartup.stderr}`);

  const fileAdapter = new FileAugnesCoreAdapter({
    workingViewFile: "./data/working-view.example.json",
    casefileFile: "./data/casefile.example.json",
    evidenceIndexFile: "./data/evidence-index.example.json",
    continuityReportFile: "./data/continuity-report.example.json",
    boundaryPacketFile: "./data/boundary-packet.example.json",
    strategyRationaleFile: "./data/strategy-rationale.example.json",
    governanceAuditFile: "./data/governance-audit.example.json",
    repoNavigationFile: "./data/repo-navigation.example.json",
  });
  const fileWorkingView = await fileAdapter.getWorkingView();
  assert.equal(
    fileWorkingView.summary,
    "Fixture-safe Working View for the Augnes Console starter. File mode connects all nine public tools to local read-only JSON sources while preserving fetch as the evidence retrieval path."
  );
  assert.deepEqual(fileWorkingView.claimIds, [
    "claim-augnes-console-readonly-surface",
    "claim-sprint-3a-file-backed-working-view",
  ]);

  const fileCasefile = await fileAdapter.openCasefile("Augnes Console public read-only app");
  assert.equal(fileCasefile.id, "casefile-augnes-console-public-app");
  assert.equal(fileCasefile.subject, "Augnes Console public read-only app");
  assert.ok(
    fileWorkingView.activePointers.includes(`casefile:${fileCasefile.id}`),
    "working view should reference the casefile fixture id"
  );
  assert.ok(
    fileCasefile.supportingEvidence.some((evidence) => fileWorkingView.topEvidenceIds.includes(evidence.id)),
    "working view top evidence should include supporting casefile evidence ids"
  );

  for (const evidenceId of fileWorkingView.topEvidenceIds) {
    assert.ok(await fileAdapter.fetch(evidenceId), `working view top evidence should resolve via fetch: ${evidenceId}`);
  }

  for (const evidence of [...fileCasefile.supportingEvidence, ...fileCasefile.contradictingEvidence]) {
    assert.ok(await fileAdapter.fetch(evidence.id), `casefile evidence should resolve via fetch: ${evidence.id}`);
  }

  const assertSearchContains = async (query: string, id: string) => {
    const searchResults = await fileAdapter.search(query);
    assert.ok(searchResults.some((result) => result.id === id), `search for ${query} should return ${id}`);
  };

  await assertSearchContains("file-backed casefile", "evidence-file-backed-casefile");
  await assertSearchContains("file backed casefile", "evidence-file-backed-casefile");
  await assertSearchContains("open_casefile", "evidence-file-backed-casefile");
  await assertSearchContains("read-only", "evidence-readonly-public-surface");
  await assertSearchContains("read only", "evidence-readonly-public-surface");

  const casefileResults = await fileAdapter.search("casefile");
  assert.ok(
    casefileResults.some((result) => result.id === "casefile-augnes-console-public-app"),
    "search for casefile should return casefile-augnes-console-public-app"
  );

  const fetchedCasefileEvidence = await fileAdapter.fetch("evidence-file-backed-casefile");
  assert.equal(fetchedCasefileEvidence?.title, "Casefile fixture is read from a local file");
  assert.equal(await fileAdapter.fetch("missing-evidence-id"), null, "missing evidence fetch should preserve null behavior");

  const fileContinuity = await fileAdapter.getContinuityReport();
  assert.equal(fileContinuity.baselineClass, "same_self");
  assert.equal(fileContinuity.identityGoal, "Build Augnes as an evidence-governed, time-aware operations console.");
  assert.equal(fileContinuity.latestBoundaryId, "boundary:read-first-v1");
  assert.equal(fileContinuity.canaryStatus, "warn");
  assert.ok(
    fileContinuity.hardInvariants.includes("ChatGPT thread is not canonical memory"),
    "continuity fixture should preserve core app invariants"
  );
  assert.ok(
    fileContinuity.transitionRetention.some((retention) => retention.scenario === "tool_wait_resume" && retention.status === "pass"),
    "continuity fixture should include tool_wait_resume retention"
  );

  const defaultBoundaryPacket = await fileAdapter.getBoundaryPacket();
  assert.equal(defaultBoundaryPacket.boundaryId, "boundary:read-first-v1");
  assert.equal(defaultBoundaryPacket.snapshotId, "snapshot-read-first-v1");
  assert.equal(defaultBoundaryPacket.boundaryId, fileContinuity.latestBoundaryId);
  assert.deepEqual(await fileAdapter.getBoundaryPacket("boundary:read-first-v1"), defaultBoundaryPacket);
  assert.deepEqual(await fileAdapter.getBoundaryPacket("read-first-v1"), defaultBoundaryPacket);
  assert.ok(
    defaultBoundaryPacket.carryForwardCandidates.some((candidate) => candidate.title === "Public app remains read-first"),
    "boundary packet fixture should include read-first carry-forward candidate"
  );
  await assert.rejects(
    () => fileAdapter.getBoundaryPacket("boundary:other"),
    /does not match file-backed boundary packet/,
    "mismatched boundary id should fail clearly"
  );

  const fileStrategy = await fileAdapter.explainStrategy("casefile-augnes-console-public-app");
  assert.equal(fileStrategy.subject, "casefile-augnes-console-public-app");
  assert.equal(fileStrategy.recommendedAction, "VERIFY");
  assert.equal(fileStrategy.metaWm?.wmStrength, 0.68);
  assert.equal(fileStrategy.eop?.observed, "File-backed evidence, continuity, and boundary paths now resolve.");
  assert.equal(fileStrategy.rubric?.score, 0.82);
  assert.equal(fileStrategy.estimatedCost, 2);
  assert.equal(fileStrategy.estimatedSteps, 4);
  assert.equal(
    await fileAdapter.fetch("strategy-rationale-casefile-augnes-console-public-app"),
    null,
    "strategy rationale should remain Control/View and not be promoted to fetchable evidence"
  );

  const fileGovernanceAudit = await fileAdapter.getGovernanceAudit();
  assert.deepEqual(fileGovernanceAudit.readOnlyTools, intendedPublicToolNames);
  assert.ok(
    !fileGovernanceAudit.readOnlyTools.some((toolName) => /write|commit|action|automation|job|promote|apply|create|update|delete/.test(toolName)),
    "governance audit should not list forbidden public write/action tool names"
  );
  assert.deepEqual(
    fileGovernanceAudit.gateStatus.map((gateStatus) => gateStatus.gate).sort(),
    ["Gate-18", "Gate-19", "Gate-20"]
  );
  assert.ok(
    fileGovernanceAudit.promotionBans.some((ban) => ban.includes("No narrator text into Evidence Registry")),
    "governance audit should preserve narrator/evidence separation"
  );
  assert.ok(
    fileGovernanceAudit.promotionBans.some((ban) => ban.includes("No ChatGPT thread/session metadata into canonical memory")),
    "governance audit should preserve ChatGPT thread non-canonical rule"
  );
  const sanitizedGovernanceAudit = sanitizeValue({
    audit: fileGovernanceAudit,
    providerSessionId: "remove-me",
    authToken: "remove-me",
    debugInfo: "remove-me",
    augnesId: "augnes-governance-keep",
  });
  assert.deepEqual(sanitizedGovernanceAudit, {
    audit: fileGovernanceAudit,
    augnesId: "augnes-governance-keep",
  });

  const healthcheckRepo = await fileAdapter.navigateRepo("healthcheck metric logging");
  assert.ok(healthcheckRepo.search.length > 0, "healthcheck metric logging should return repo search results");
  assert.ok(
    healthcheckRepo.search.some((node) => node.title.includes("apps/web/src/observability/health.ts")),
    "healthcheck metric logging should return the healthcheck node"
  );

  const fileAdapterRepo = await fileAdapter.navigateRepo("file adapter");
  const fileCoreNode = fileAdapterRepo.search.find((node) => node.nodeId === "repo:src/adapters/file-core.ts");
  assert.ok(fileCoreNode, "file adapter query should return src/adapters/file-core.ts");
  assert.equal(fileCoreNode?.fetchable, true, "file-core repo node should be clearly marked fetchable");
  assert.ok(await fileAdapter.fetch("repo:src/adapters/file-core.ts"), "fetchable repo node should resolve through fetch");

  const evidenceIndexRepo = await fileAdapter.navigateRepo("evidence index");
  assert.ok(
    evidenceIndexRepo.search.some((node) => node.nodeId === "repo:data/evidence-index.example.json"),
    "evidence index query should return the evidence index fixture node"
  );

  const boundaryPacketRepo = await fileAdapter.navigateRepo("boundary packet");
  assert.ok(
    boundaryPacketRepo.search.some((node) => node.nodeId === "repo:data/boundary-packet.example.json"),
    "boundary packet query should return the boundary packet fixture node"
  );

  const unknownRepo = await fileAdapter.navigateRepo("definitely absent repo topic");
  assert.deepEqual(unknownRepo.search, []);
  assert.deepEqual(unknownRepo.explore, []);
  assert.ok(
    unknownRepo.guidance.includes("Search/Explore are view-only."),
    "repo navigation guidance should state search/explore are view-only"
  );
  assert.ok(
    unknownRepo.guidance.includes("Fetch source text before using a node as evidence."),
    "repo navigation guidance should require fetch before evidence"
  );
  assert.ok(
    unknownRepo.guidance.includes("Repo navigation does not write canonical state."),
    "repo navigation guidance should state it does not write canonical state"
  );

  const unconfiguredFileAdapter = new FileAugnesCoreAdapter({});
  await assert.rejects(
    () => unconfiguredFileAdapter.getWorkingView(),
    /AUGNES_WORKING_VIEW_FILE is required/,
    "unconfigured file adapter should construct cleanly and fail at method call time"
  );
  await assert.rejects(
    () => unconfiguredFileAdapter.openCasefile("auth"),
    /AUGNES_CASEFILE_FILE is required/,
    "unconfigured casefile file should fail at method call time"
  );
  await assert.rejects(
    () => unconfiguredFileAdapter.search("read-only"),
    /AUGNES_EVIDENCE_INDEX_FILE is required/,
    "unconfigured evidence index should fail during search at method call time"
  );
  await assert.rejects(
    () => unconfiguredFileAdapter.fetch("evidence-readonly-public-surface"),
    /AUGNES_EVIDENCE_INDEX_FILE is required/,
    "unconfigured evidence index should fail during fetch at method call time"
  );
  await assert.rejects(
    () => unconfiguredFileAdapter.getContinuityReport(),
    /AUGNES_CONTINUITY_REPORT_FILE is required/,
    "unconfigured continuity report should fail at method call time"
  );
  await assert.rejects(
    () => unconfiguredFileAdapter.getBoundaryPacket(),
    /AUGNES_BOUNDARY_PACKET_FILE is required/,
    "unconfigured boundary packet file should fail at method call time"
  );
  await assert.rejects(
    () => unconfiguredFileAdapter.explainStrategy("casefile-augnes-console-public-app"),
    /AUGNES_STRATEGY_RATIONALE_FILE is required/,
    "unconfigured strategy rationale should fail at method call time"
  );
  await assert.rejects(
    () => unconfiguredFileAdapter.getGovernanceAudit(),
    /AUGNES_GOVERNANCE_AUDIT_FILE is required/,
    "unconfigured governance audit should fail at method call time"
  );
  await assert.rejects(
    () => unconfiguredFileAdapter.navigateRepo("file adapter"),
    /AUGNES_REPO_NAVIGATION_FILE is required/,
    "unconfigured repo navigation should fail at method call time"
  );

  const missingFileAdapter = new FileAugnesCoreAdapter({ workingViewFile: "./data/does-not-exist.json" });
  await assert.rejects(
    () => missingFileAdapter.getWorkingView(),
    /Unable to read AUGNES_WORKING_VIEW_FILE/,
    "missing working view file should fail at method call time"
  );
  const missingCasefileAdapter = new FileAugnesCoreAdapter({ casefileFile: "./data/does-not-exist.json" });
  await assert.rejects(
    () => missingCasefileAdapter.openCasefile("auth"),
    /Unable to read AUGNES_CASEFILE_FILE/,
    "missing casefile file should fail at method call time"
  );
  const missingEvidenceAdapter = new FileAugnesCoreAdapter({ evidenceIndexFile: "./data/does-not-exist.json" });
  await assert.rejects(
    () => missingEvidenceAdapter.search("read-only"),
    /Unable to read AUGNES_EVIDENCE_INDEX_FILE/,
    "missing evidence index should fail during search at method call time"
  );
  await assert.rejects(
    () => missingEvidenceAdapter.fetch("evidence-readonly-public-surface"),
    /Unable to read AUGNES_EVIDENCE_INDEX_FILE/,
    "missing evidence index should fail during fetch at method call time"
  );
  const missingContinuityAdapter = new FileAugnesCoreAdapter({ continuityReportFile: "./data/does-not-exist.json" });
  await assert.rejects(
    () => missingContinuityAdapter.getContinuityReport(),
    /Unable to read AUGNES_CONTINUITY_REPORT_FILE/,
    "missing continuity report file should fail at method call time"
  );
  const missingBoundaryAdapter = new FileAugnesCoreAdapter({ boundaryPacketFile: "./data/does-not-exist.json" });
  await assert.rejects(
    () => missingBoundaryAdapter.getBoundaryPacket(),
    /Unable to read AUGNES_BOUNDARY_PACKET_FILE/,
    "missing boundary packet file should fail at method call time"
  );
  const missingStrategyAdapter = new FileAugnesCoreAdapter({ strategyRationaleFile: "./data/does-not-exist.json" });
  await assert.rejects(
    () => missingStrategyAdapter.explainStrategy("casefile-augnes-console-public-app"),
    /Unable to read AUGNES_STRATEGY_RATIONALE_FILE/,
    "missing strategy rationale file should fail at method call time"
  );
  const missingGovernanceAdapter = new FileAugnesCoreAdapter({ governanceAuditFile: "./data/does-not-exist.json" });
  await assert.rejects(
    () => missingGovernanceAdapter.getGovernanceAudit(),
    /Unable to read AUGNES_GOVERNANCE_AUDIT_FILE/,
    "missing governance audit file should fail at method call time"
  );
  const missingRepoAdapter = new FileAugnesCoreAdapter({ repoNavigationFile: "./data/does-not-exist.json" });
  await assert.rejects(
    () => missingRepoAdapter.navigateRepo("file adapter"),
    /Unable to read AUGNES_REPO_NAVIGATION_FILE/,
    "missing repo navigation file should fail at method call time"
  );

  const invalidDir = await mkdtemp(join(tmpdir(), "augnes-working-view-"));
  const invalidFile = join(invalidDir, "invalid-working-view.json");
  await writeFile(invalidFile, JSON.stringify({ summary: "missing required arrays" }), "utf8");
  const invalidFileAdapter = new FileAugnesCoreAdapter({ workingViewFile: invalidFile });
  await assert.rejects(
    () => invalidFileAdapter.getWorkingView(),
    /does not match the WorkingView schema/,
    "invalid working view file should fail at method call time"
  );
  const invalidCasefile = join(invalidDir, "invalid-casefile.json");
  await writeFile(invalidCasefile, JSON.stringify({ subject: "missing required casefile fields" }), "utf8");
  const invalidCasefileAdapter = new FileAugnesCoreAdapter({ casefileFile: invalidCasefile });
  await assert.rejects(
    () => invalidCasefileAdapter.openCasefile("auth"),
    /does not match the Casefile schema/,
    "invalid casefile file should fail at method call time"
  );
  const invalidEvidenceIndex = join(invalidDir, "invalid-evidence-index.json");
  await writeFile(invalidEvidenceIndex, JSON.stringify({ id: "not-an-array" }), "utf8");
  const invalidEvidenceAdapter = new FileAugnesCoreAdapter({ evidenceIndexFile: invalidEvidenceIndex });
  await assert.rejects(
    () => invalidEvidenceAdapter.search("read-only"),
    /does not match the EvidenceIndex schema/,
    "invalid evidence index should fail during search at method call time"
  );
  await assert.rejects(
    () => invalidEvidenceAdapter.fetch("evidence-readonly-public-surface"),
    /does not match the EvidenceIndex schema/,
    "invalid evidence index should fail during fetch at method call time"
  );
  const invalidContinuityReport = join(invalidDir, "invalid-continuity-report.json");
  await writeFile(invalidContinuityReport, JSON.stringify({ baselineClass: "same_self" }), "utf8");
  const invalidContinuityAdapter = new FileAugnesCoreAdapter({ continuityReportFile: invalidContinuityReport });
  await assert.rejects(
    () => invalidContinuityAdapter.getContinuityReport(),
    /does not match the ContinuityReport schema/,
    "invalid continuity report file should fail at method call time"
  );
  const invalidBoundaryPacket = join(invalidDir, "invalid-boundary-packet.json");
  await writeFile(invalidBoundaryPacket, JSON.stringify({ boundaryId: "boundary:read-first-v1" }), "utf8");
  const invalidBoundaryAdapter = new FileAugnesCoreAdapter({ boundaryPacketFile: invalidBoundaryPacket });
  await assert.rejects(
    () => invalidBoundaryAdapter.getBoundaryPacket(),
    /does not match the BoundaryPacket schema/,
    "invalid boundary packet file should fail at method call time"
  );
  const invalidStrategyRationale = join(invalidDir, "invalid-strategy-rationale.json");
  await writeFile(invalidStrategyRationale, JSON.stringify({ subject: "casefile-augnes-console-public-app" }), "utf8");
  const invalidStrategyAdapter = new FileAugnesCoreAdapter({ strategyRationaleFile: invalidStrategyRationale });
  await assert.rejects(
    () => invalidStrategyAdapter.explainStrategy("casefile-augnes-console-public-app"),
    /does not match the StrategyRationale schema/,
    "invalid strategy rationale file should fail at method call time"
  );
  const invalidGovernanceAudit = join(invalidDir, "invalid-governance-audit.json");
  await writeFile(invalidGovernanceAudit, JSON.stringify({ readOnlyTools: intendedPublicToolNames }), "utf8");
  const invalidGovernanceAdapter = new FileAugnesCoreAdapter({ governanceAuditFile: invalidGovernanceAudit });
  await assert.rejects(
    () => invalidGovernanceAdapter.getGovernanceAudit(),
    /does not match the GovernanceAudit schema/,
    "invalid governance audit file should fail at method call time"
  );
  const invalidRepoNavigation = join(invalidDir, "invalid-repo-navigation.json");
  await writeFile(invalidRepoNavigation, JSON.stringify({ query: "file adapter" }), "utf8");
  const invalidRepoAdapter = new FileAugnesCoreAdapter({ repoNavigationFile: invalidRepoNavigation });
  await assert.rejects(
    () => invalidRepoAdapter.navigateRepo("file adapter"),
    /does not match the RepoNavigationResult schema/,
    "invalid repo navigation file should fail at method call time"
  );

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error("simulated Augnes Core outage");
  };

  try {
    const httpAdapter = new HttpAugnesCoreAdapter({ apiBaseUrl: "http://127.0.0.1:1" });
    await assert.rejects(
      () => httpAdapter.search("auth"),
      (error) =>
        error instanceof AugnesCoreHttpError &&
        error.message === "Augnes Core search results endpoint is unavailable. Check the API base URL and server status.",
      "HTTP adapter should return a stable unavailable error when Augnes Core cannot be reached"
    );
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(LEGACY_PUBLIC_TOOL_NAMES, intendedLegacyToolNames);
  assert.deepEqual(PUBLIC_TOOL_NAMES, intendedPublicToolNames, "PUBLIC_TOOL_NAMES should remain the read-only public surface");

  console.log("Smoke checks passed.");
}

await main();
