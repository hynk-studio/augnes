import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { MockAugnesCoreAdapter } from "../src/adapters/mock-core.js";
import { StateRuntimeHttpAdapter } from "../src/adapters/state-runtime-http.js";
import { AUGNES_BRIDGE_TOOL_NAMES, createMcpAppServer } from "../src/server.js";

type RegisteredTool = {
  annotations?: {
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    openWorldHint?: boolean;
  };
  inputSchema: {
    parse: (value: unknown) => unknown;
    safeParse: (value: unknown) => { success: boolean; data?: unknown };
  };
  handler: (input: Record<string, unknown>) => Promise<{
    structuredContent?: Record<string, unknown>;
    content?: Array<{ text?: string }>;
  }>;
};

type RequestLog = {
  method: string;
  pathname: string;
  searchParams: URLSearchParams;
  host: string;
};

function registeredTools(server: unknown): Record<string, RegisteredTool> {
  const candidate = server as { _registeredTools?: Record<string, RegisteredTool> };
  assert.ok(candidate._registeredTools, "MCP server registered tools should be inspectable");
  return candidate._registeredTools;
}

const requestLog: RequestLog[] = [];

const httpServer = createServer((req, res) => {
  if (!req.url) {
    res.writeHead(400).end("Missing URL");
    return;
  }

  const url = new URL(req.url, "http://127.0.0.1");
  requestLog.push({
    method: req.method ?? "GET",
    pathname: url.pathname,
    searchParams: url.searchParams,
    host: req.headers.host ?? "",
  });

  res.setHeader("content-type", "application/json");

  if (req.method !== "GET") {
    res.writeHead(405).end(JSON.stringify({ error: "GET only in cross-session read tool smoke." }));
    return;
  }

  if (url.pathname === "/api/evidence-pack") {
    res.end(
      JSON.stringify({
        scope: url.searchParams.get("scope"),
        generated_at: "2026-05-09T00:00:00.000Z",
        filters: {
          work_id: url.searchParams.get("work_id"),
          target_ref: url.searchParams.get("target_ref"),
        },
        boundaries: ["Read-only evidence pack."],
      })
    );
    return;
  }

  if (url.pathname === "/api/sessions/session%3Asmoke-1/trace") {
    res.end(
      JSON.stringify({
        runtime: "augnes",
        scope: url.searchParams.get("scope"),
        generated_at: "2026-05-09T00:00:00.000Z",
        sessions: [
          {
            session_id: "session:smoke-1",
            title: "Smoke session",
            message_count: 3,
            evidence_counts: {
              messages: 3,
              action_records_by_session: 0,
              verification_evidence_records_for_work: 1,
              verification_evidence_records_for_pr: 0,
              verification_evidence_records_total: 1,
            },
            latest_evidence_record: {
              evidence_id: "evidence:smoke-1",
              evidence_kind: "check_passed",
              status: "passed",
              label: "Smoke verification",
            },
            gaps: [],
          },
        ],
        gaps: [],
        boundaries: ["Read-only session trace."],
      })
    );
    return;
  }

  if (url.pathname === "/api/evidence/records") {
    res.end(
      JSON.stringify({
        scope: url.searchParams.get("scope"),
        count: 1,
        records: [
          {
    evidence_id: "evidence:smoke-1",
    work_id: url.searchParams.get("work_id"),
    evidence_kind: url.searchParams.get("evidence_kind") ?? "check_passed",
    status: url.searchParams.get("status") ?? "passed",
            label: "Smoke verification",
            created_at: "2026-05-09T00:00:00.000Z",
          },
        ],
        boundaries: ["Read-only verification evidence records."],
      })
    );
    return;
  }

  res.writeHead(404).end(JSON.stringify({ error: `Unexpected route in smoke: ${url.pathname}` }));
});

httpServer.listen(0, "127.0.0.1");
await once(httpServer, "listening");

const address = httpServer.address();
if (!address || typeof address === "string") {
  throw new Error("Failed to allocate mock HTTP server port for cross-session read tool smoke.");
}

const apiBaseUrl = `http://127.0.0.1:${address.port}`;
const appServer = createMcpAppServer(new MockAugnesCoreAdapter(), new StateRuntimeHttpAdapter({ apiBaseUrl }), {
  enableAgentBridge: true,
});

try {
  const tools = registeredTools(appServer);
  const newToolNames = [
    "augnes_get_evidence_pack",
    "augnes_get_session_trace",
    "augnes_get_verification_evidence_records",
  ] as const;

  for (const toolName of newToolNames) {
    assert.ok(AUGNES_BRIDGE_TOOL_NAMES.includes(toolName), `${toolName} should be part of AUGNES_BRIDGE_TOOL_NAMES`);
    const tool = tools[toolName];
    assert.ok(tool, `${toolName} should be registered`);
    assert.equal(tool.annotations?.readOnlyHint, true, `${toolName} should be read-only`);
    assert.equal(tool.annotations?.destructiveHint, false, `${toolName} should be non-destructive`);
    assert.equal(tool.annotations?.openWorldHint, true, `${toolName} should be open-world`);
  }

  const evidencePackParsed = tools.augnes_get_evidence_pack.inputSchema.parse({
    scope: "project:augnes",
    workId: "AG-001",
    method: "POST",
    createEvidenceRecord: true,
    publish: true,
  }) as Record<string, unknown>;
  assert.deepEqual(evidencePackParsed, { scope: "project:augnes", workId: "AG-001" }, "evidence pack input schema should ignore write-shaped keys");

  const sessionTraceParsed = tools.augnes_get_session_trace.inputSchema.parse({
    scope: "project:augnes",
    sessionId: "session:smoke-1",
    limit: 5,
    bind: true,
    method: "POST",
  }) as Record<string, unknown>;
  assert.deepEqual(
    sessionTraceParsed,
    { scope: "project:augnes", sessionId: "session:smoke-1", limit: 5 },
    "session trace input schema should ignore bind/write-shaped keys"
  );
  assert.equal(
    tools.augnes_get_session_trace.inputSchema.safeParse({ scope: "project:augnes", limit: 999 }).success,
    false,
    "session trace input schema should reject out-of-range limits"
  );

  const verificationParsed = tools.augnes_get_verification_evidence_records.inputSchema.parse({
    scope: "project:augnes",
    workId: "AG-001",
    evidenceKind: "check_passed",
    status: "passed",
    limit: 5,
    method: "POST",
    create: true,
    sessionBind: true,
  }) as Record<string, unknown>;
  assert.deepEqual(
    verificationParsed,
    {
      scope: "project:augnes",
      workId: "AG-001",
      evidenceKind: "check_passed",
      status: "passed",
      limit: 5,
    },
    "verification evidence input schema should ignore write-shaped keys"
  );

  const evidencePackResult = await tools.augnes_get_evidence_pack.handler(evidencePackParsed);
  const sessionTraceResult = await tools.augnes_get_session_trace.handler(sessionTraceParsed);
  const verificationResult = await tools.augnes_get_verification_evidence_records.handler(verificationParsed);
  const evidencePackStructured = evidencePackResult.structuredContent as { boundaries?: { read_only?: boolean } } | undefined;
  const sessionTraceStructured = sessionTraceResult.structuredContent as {
    session_trace?: { sessions?: Array<{ session_id?: string }> };
  } | undefined;
  const verificationStructured = verificationResult.structuredContent as {
    verification_evidence_records?: { records?: unknown[] };
  } | undefined;

  assert.equal(
    evidencePackStructured?.boundaries?.read_only,
    true,
    "evidence pack tool should expose read-only boundaries"
  );
  assert.equal(
    sessionTraceStructured?.session_trace?.sessions?.[0]?.session_id,
    "session:smoke-1",
    "session trace tool should preserve session_id in structured content"
  );
  assert.equal(
    verificationStructured?.verification_evidence_records?.records?.length,
    1,
    "verification evidence tool should return the mocked records envelope"
  );

  assert.deepEqual(
    requestLog.map((request) => request.method),
    ["GET", "GET", "GET"],
    "cross-session read tools should only issue GET requests"
  );
  assert.ok(
    requestLog.some(
      (request) =>
        request.pathname === "/api/sessions/session%3Asmoke-1/trace" &&
        request.searchParams.get("scope") === "project:augnes" &&
        request.searchParams.get("limit") === "5"
    ),
    "session trace tool should call the session-specific GET trace route"
  );
  assert.ok(
    requestLog.some(
      (request) =>
        request.pathname === "/api/evidence-pack" &&
        request.searchParams.get("scope") === "project:augnes" &&
        request.searchParams.get("work_id") === "AG-001"
    ),
    "evidence pack tool should call the GET evidence pack route"
  );
  assert.ok(
    requestLog.some(
      (request) =>
        request.pathname === "/api/evidence/records" &&
        request.searchParams.get("scope") === "project:augnes" &&
        request.searchParams.get("work_id") === "AG-001" &&
        request.searchParams.get("evidence_kind") === "check_passed" &&
        request.searchParams.get("status") === "passed" &&
        request.searchParams.get("limit") === "5"
    ),
    "verification evidence tool should call the GET evidence records route"
  );
  assert.ok(
    !requestLog.some((request) => request.pathname === "/api/sessions/bind"),
    "cross-session read tools must not call POST /api/sessions/bind"
  );
  assert.ok(
    !requestLog.some((request) => request.method === "POST" && request.pathname === "/api/evidence/records"),
    "cross-session read tools must not call POST /api/evidence/records"
  );
  assert.ok(
    requestLog.every((request) => request.host.startsWith("127.0.0.1:")),
    "cross-session read tools should not call GitHub or OpenAI hosts in smoke"
  );
  assert.ok(
    !Object.keys(tools).some((toolName) => /session_bind|evidence_create|publish|replay|approval/i.test(toolName)),
    "registered tool names should not include session-bind/evidence-create/publish/replay/approval actions"
  );

  console.log(
    JSON.stringify(
      {
        cross_session_read_tools_present: true,
        schemas_strip_write_shaped_inputs: true,
        session_trace_get_only: true,
        evidence_pack_get_only: true,
        verification_evidence_records_get_only: true,
        bind_route_unused: true,
        evidence_post_unused: true,
        github_or_openai_calls: false,
      },
      null,
      2
    )
  );
} finally {
  appServer.close();
  httpServer.close();
}
