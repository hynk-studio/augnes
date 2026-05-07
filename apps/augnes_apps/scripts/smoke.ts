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

function spawnConfigProfile(env: Record<string, string | undefined>) {
  const childEnv = { ...process.env };
  delete childEnv.AUGNES_APP_PROFILE;
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
          augnes_observe: { message: 'Record the current bridge smoke context.' },
          augnes_plan: { message: 'What should happen next?' },
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
        };
        const profiles = {};
        for (const name of AUGNES_BRIDGE_TOOL_NAMES) {
          const result = await server._registeredTools[name].handler(args[name]);
          profiles[name] = {
            structuredProfile: result.structuredContent?.profile,
            metaProfile: result._meta?.profile,
            text: result.content?.[0]?.text,
            agentHandoff: result.structuredContent?.brief?.agent_handoff,
            actionRecord: result.structuredContent?.actionRecord,
            eventResult: result.structuredContent?.eventResult,
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

function spawnRecordResultConfigSnapshot(env: Record<string, string | undefined>) {
  const childEnv = { ...process.env };
  delete childEnv.CODEX_FILES_CHANGED;
  delete childEnv.CODEX_RESULT_STATUS;
  delete childEnv.CODEX_RESULT_KIND;

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
        const { resolveRecordResultConfig } = await import('./scripts/codex-record-result.ts');
        const config = resolveRecordResultConfig();
        console.log(JSON.stringify({
          filesChanged: config.filesChanged,
          resultStatus: config.resultStatus,
          resultKind: config.resultKind
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
  assert.match(widgetHtml, /id="profile-chip"/, "widget should keep the visible profile badge");
  assert.match(widgetHtml, /profile: public/, "widget should render a visible default profile label");
  assert.doesNotMatch(widgetHtml, /\blocalStorage\b/, "widget must not use localStorage");
  assert.doesNotMatch(widgetHtml, /\bsessionStorage\b/, "widget must not use sessionStorage");
  assert.doesNotMatch(widgetHtml, /\beval\s*\(/, "widget must not use eval");
  assert.doesNotMatch(widgetHtml, /\bnew\s+Function\b/, "widget must not use new Function");
  assert.doesNotMatch(widgetHtml, /\bfetch\s*\(/, "widget must not make direct fetch calls");
  assert.doesNotMatch(widgetHtml, /\bXMLHttpRequest\b|\bWebSocket\b|\bEventSource\b/, "widget must not open direct network channels");

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
  assert.match(
    bridgeSnapshot.profiles.augnes_get_state_brief.text,
    /Agent handoff is available for current status, next step, blockers, and Codex handoff\./,
    "augnes_get_state_brief should advertise the user-facing agent_handoff answer areas without dumping the handoff"
  );
  assert.deepEqual(
    bridgeSnapshot.profiles.augnes_get_state_brief.agentHandoff,
    (await new MockStateRuntimeBridgeAdapter().getStateBrief("project:augnes")).agent_handoff,
    "augnes_get_state_brief should preserve structuredContent.brief.agent_handoff when present"
  );
  assert.equal(
    bridgeSnapshot.richRecord.action_name,
    "smoke_rich_result_check",
    "rich augnes_record_action_result payload should preserve runtime action result"
  );
  assert.equal(bridgeSnapshot.richRecord.result_status, "blocked", "resultStatus should pass through to runtime result_status");
  assert.equal(bridgeSnapshot.richRecord.result_kind, "verification", "resultKind should pass through to runtime result_kind");
  assert.match(bridgeSnapshot.richRecordText, /0 changed file\(s\)/, "empty filesChanged array should be reflected in bridge response text");

  const defaultRecordConfig = spawnRecordResultConfigSnapshot({});
  assert.equal(defaultRecordConfig.status, 0, `default record config snapshot should run: ${defaultRecordConfig.stderr}`);
  assert.deepEqual(
    JSON.parse(defaultRecordConfig.stdout).filesChanged,
    ["docs/CODEX_HANDOFF_DEMO.md"],
    "omitted CODEX_FILES_CHANGED should use the demo handoff default"
  );

  const emptyFilesRecordConfig = spawnRecordResultConfigSnapshot({ CODEX_FILES_CHANGED: "" });
  assert.equal(emptyFilesRecordConfig.status, 0, `empty files record config snapshot should run: ${emptyFilesRecordConfig.stderr}`);
  assert.deepEqual(JSON.parse(emptyFilesRecordConfig.stdout).filesChanged, [], 'CODEX_FILES_CHANGED="" should resolve to an empty file list');

  const csvRecordConfig = spawnRecordResultConfigSnapshot({
    CODEX_FILES_CHANGED: "README.md, docs/CODEX_HANDOFF_DEMO.md,",
    CODEX_RESULT_STATUS: "needs_review",
    CODEX_RESULT_KIND: "verification",
  });
  assert.equal(csvRecordConfig.status, 0, `CSV record config snapshot should run: ${csvRecordConfig.stderr}`);
  assert.deepEqual(JSON.parse(csvRecordConfig.stdout), {
    filesChanged: ["README.md", "docs/CODEX_HANDOFF_DEMO.md"],
    resultStatus: "needs_review",
    resultKind: "verification",
  });

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
