import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { tsImport } from "tsx/esm/api";
import { FileAugnesCoreAdapter } from "../src/adapters/file-core.js";
import { HttpAugnesCoreAdapter } from "../src/adapters/http-core.js";
import { MockAugnesCoreAdapter } from "../src/adapters/mock-core.js";
import { StateRuntimeHttpAdapter } from "../src/adapters/state-runtime-http.js";
import type { WorkBrief } from "../src/lib/state-runtime-types.js";
import { AUGNES_BRIDGE_TOOL_NAMES, AUGNES_WORK_READ_TOOL_NAMES, PUBLIC_TOOL_NAMES, createMcpAppServer } from "../src/server.js";
import { assertWorkReadWidgetProjection } from "./widget-bridge-fixture.js";

function structured(result: Record<string, unknown>): Record<string, unknown> {
  assert.ok(result.structuredContent && typeof result.structuredContent === "object");
  return result.structuredContent as Record<string, unknown>;
}

// Local MCP protocol + real route/producer contracts over disposable demo data.
// The HTTP boundary is intercepted; this is not connected-client evidence.
export async function assertWorkReadContract() {
  const root = await mkdtemp(join(tmpdir(), "augnes-work-read-"));
  const databasePath = join(root, "work.db");
  const previousDatabasePath = process.env.AUGNES_DB_PATH;
  const previousFetch = globalThis.fetch;
  const rootImport = (specifier: string) => tsImport(specifier, {
    parentURL: import.meta.url,
    tsconfig: fileURLToPath(new URL("../../../tsconfig.json", import.meta.url)),
  });
  let disposition: "routes" | "unavailable" | "malformed" = "routes";
  const requests: URL[] = [];

  try {
    process.env.AUGNES_DB_PATH = databasePath;
    await rootImport("../../../scripts/demo-seed.mjs");
    const listRoute = await rootImport("../../../app/api/work/route.ts");
    const briefRoute = await rootImport("../../../app/api/work/[work_id]/brief/route.ts");
    globalThis.fetch = async (input, init) => {
      const request = new Request(input, init);
      const url = new URL(request.url);
      assert.equal(url.origin, "http://127.0.0.1:1");
      assert.equal(request.method, "GET");
      requests.push(url);
      if (disposition === "unavailable") throw new Error("Fixture transport unavailable");
      if (disposition === "malformed") return Response.json({ scope: "project:augnes" });
      if (url.pathname === "/api/work") return listRoute.GET(request);
      const match = url.pathname.match(/^\/api\/work\/([^/]+)\/brief$/);
      assert.ok(match, "work reads must use the existing route owner");
      return briefRoute.GET(request, {
        params: Promise.resolve({ work_id: decodeURIComponent(match[1]) }),
      });
    };

    const runtime = new StateRuntimeHttpAdapter({ apiBaseUrl: "http://127.0.0.1:1" });
    const server = createMcpAppServer(new MockAugnesCoreAdapter(), runtime, {
      toolSurface: "public", enableAgentBridge: false,
    });
    const client = new Client({ name: "work-read-contract", version: "1.0.0" });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    try {
      await server.connect(serverTransport);
      await client.connect(clientTransport);
      const tools = (await client.listTools()).tools;
      assert.deepEqual(tools.map((tool) => tool.name), PUBLIC_TOOL_NAMES);
      for (const name of AUGNES_WORK_READ_TOOL_NAMES) {
        const tool = tools.find((entry) => entry.name === name)!;
        assert.deepEqual(tool.annotations, {
          readOnlyHint: true, destructiveHint: false, openWorldHint: true,
        });
      }
      const listed = await client.callTool({ name: "augnes_list_work_items", arguments: {} });
      assert.notEqual(listed.isError, true);
      const list = listed.structuredContent as {
        scope: string; workItems: Array<{ work_id: string; scope: string; status: string }>;
      };
      assert.ok(list.workItems.length > 0, "the normal demo writer must provide work");
      const selected = list.workItems[0];
      const opened = await client.callTool({
        name: "augnes_get_work_brief",
        arguments: { scope: list.scope, workId: selected.work_id },
      });
      assert.notEqual(opened.isError, true);
      const brief = (opened.structuredContent as { brief: WorkBrief }).brief;
      assert.equal(brief.work_id, selected.work_id);
      assert.equal(brief.scope, list.scope);
      assert.equal(brief.work.status, selected.status);
      assert.match(brief.framing.work_id, /not canonical project state/);
      assert.deepEqual(opened._meta, opened.structuredContent);
      assert.deepEqual(listed._meta, listed.structuredContent);
      assert.ok(JSON.stringify(opened.content).includes(selected.work_id));

      const empty = await client.callTool({
        name: "augnes_list_work_items", arguments: { scope: "project:empty-fixture" },
      });
      assert.notEqual(empty.isError, true);
      assert.deepEqual(structured(empty).workItems, []);
      assert.equal(structured(empty).recommended_work_id, null);

      process.env.AUGNES_DB_PATH = join(root, "missing-tables.db");
      const fallback = await client.callTool({ name: "augnes_list_work_items", arguments: {} });
      process.env.AUGNES_DB_PATH = databasePath;
      assert.equal(structured(fallback).workItems, undefined,
        "a missing-table runtime fallback must not become a successful empty work list");
      assert.match(JSON.stringify(fallback.content), /unavailable.*missing_optional_runtime_table/);
      assert.equal(fallback.isError, true);
      await assertWorkReadWidgetProjection({
        listed: structured(listed), opened: structured(opened),
        empty: structured(empty), failed: structured(fallback),
      });

      for (const args of [
        { scope: list.scope, workId: "MISSING-WORK-FIXTURE" },
        { scope: "project:empty-fixture", workId: selected.work_id },
      ]) {
        const result = await client.callTool({ name: "augnes_get_work_brief", arguments: args });
        assert.equal(result.isError, true);
        assert.match(JSON.stringify(result.content), /status 404/);
        assert.equal(structured(result).brief, undefined);
      }
      const beforeInvalid = requests.length;
      for (const args of [{}, { workId: "" }, { workId: selected.work_id, scope: "" }]) {
        const result = await client.callTool({ name: "augnes_get_work_brief", arguments: args });
        assert.equal(result.isError, true, "MCP input validation must reject invalid arguments");
      }
      assert.equal(requests.length, beforeInvalid);

      for (const mode of ["unavailable", "malformed"] as const) {
        disposition = mode;
        for (const name of AUGNES_WORK_READ_TOOL_NAMES) {
          const result = await client.callTool({ name, arguments: { workId: selected.work_id } });
          assert.equal(result.isError, true);
          assert.equal(structured(result).workItems, undefined);
          assert.equal(structured(result).brief, undefined);
          assert.match(JSON.stringify(result.content), mode === "unavailable" ? /unavailable/ : /invalid .* payload/);
        }
      }
      disposition = "routes";

      // Work backing is independent of the legacy adapter and surface gates.
      for (const [legacy, options, expected] of [
        [new FileAugnesCoreAdapter({}), { toolSurface: "work_loop_readonly", enableAgentBridge: true }, AUGNES_WORK_READ_TOOL_NAMES],
        [new HttpAugnesCoreAdapter({ apiBaseUrl: "http://127.0.0.1:1" }), { toolSurface: "public", enableAgentBridge: true }, [...PUBLIC_TOOL_NAMES, ...AUGNES_BRIDGE_TOOL_NAMES]],
        [new MockAugnesCoreAdapter(), { toolSurface: "companion_repository_readonly", enableAgentBridge: true }, ["augnes_resume_repository", ...AUGNES_WORK_READ_TOOL_NAMES]],
      ] as const) {
        const gatedServer = createMcpAppServer(legacy, runtime, options);
        const gatedClient = new Client({ name: "work-read-surface", version: "1.0.0" });
        const [readTransport, toolTransport] = InMemoryTransport.createLinkedPair();
        try {
          await gatedServer.connect(toolTransport);
          await gatedClient.connect(readTransport);
          assert.deepEqual((await gatedClient.listTools()).tools.map((tool) => tool.name).sort(), [...expected].sort());
          const result = await gatedClient.callTool({ name: "augnes_list_work_items", arguments: {} });
          assert.deepEqual(structured(result).workItems, list.workItems);
          disposition = "unavailable";
          const unavailable = await gatedClient.callTool({ name: "augnes_list_work_items", arguments: {} });
          assert.equal(unavailable.isError, true, "legacy mock/file/HTTP must not supply fallback work");
          disposition = "routes";
        } finally {
          await gatedClient.close();
          await gatedServer.close();
        }
      }
      console.log("Work-read contract passed: disposable demo writer/routes, MCP list/call, empty/unavailable/404, adapter/surface and widget contrasts; zero external calls.");
    } finally {
      await client.close();
      await server.close();
    }
  } finally {
    globalThis.fetch = previousFetch;
    if (previousDatabasePath === undefined) delete process.env.AUGNES_DB_PATH;
    else process.env.AUGNES_DB_PATH = previousDatabasePath;
    await rm(root, { recursive: true, force: true });
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  await assertWorkReadContract();
}
