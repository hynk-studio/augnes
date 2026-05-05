import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { WorkingViewSchema } from "../src/lib/schemas.js";
import type { WorkingView } from "../src/lib/types.js";

export const CORE_READ_STUB_NAME = "augnes-core-read-stub";
export const CORE_READ_STUB_VERSION = "0.1.0";

export interface CoreReadStubConfig {
  port?: number;
  workingViewFile?: string;
}

export function resolveCoreReadStubConfig(env: NodeJS.ProcessEnv = process.env): Required<CoreReadStubConfig> {
  return {
    port: Number(env.AUGNES_CORE_STUB_PORT ?? 3000),
    workingViewFile: env.AUGNES_CORE_STUB_WORKING_VIEW_FILE ?? env.AUGNES_WORKING_VIEW_FILE ?? "./data/working-view.example.json",
  };
}

export function buildCoreReadStubHealthPayload(config: Required<CoreReadStubConfig>) {
  return {
    ok: true,
    name: CORE_READ_STUB_NAME,
    version: CORE_READ_STUB_VERSION,
    readOnly: true,
    contract: "core-http-read-v1",
    endpoints: ["GET /working-view"],
    workingViewSource: config.workingViewFile,
  };
}

export async function readWorkingViewFixture(filePath: string): Promise<WorkingView> {
  let raw: string;
  try {
    raw = await readFile(filePath, "utf8");
  } catch {
    throw new Error("Unable to read working view fixture for Core read stub.");
  }

  let json: unknown;
  try {
    json = JSON.parse(raw) as unknown;
  } catch {
    throw new Error("Working view fixture for Core read stub is not valid JSON.");
  }

  const parsed = WorkingViewSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Working view fixture for Core read stub does not match WorkingViewSchema.");
  }

  return parsed.data;
}

function sendJson(res: ServerResponse, statusCode: number, payload: unknown) {
  res.writeHead(statusCode, {
    "content-type": "application/json",
    "cache-control": "no-store",
  });
  res.end(JSON.stringify(payload));
}

function sendText(res: ServerResponse, statusCode: number, text: string) {
  res.writeHead(statusCode, {
    "content-type": "text/plain; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(text);
}

function sendCoreError(res: ServerResponse, statusCode: number, code: string, message: string, retryable: boolean) {
  sendJson(res, statusCode, {
    error: {
      code,
      message,
      retryable,
    },
  });
}

export function createCoreReadStubServer(config: Required<CoreReadStubConfig> = resolveCoreReadStubConfig()) {
  return createServer(async (req: IncomingMessage, res: ServerResponse) => {
    if (!req.url) {
      sendCoreError(res, 400, "AUGNES_CORE_STUB_MISSING_URL", "Missing request URL.", false);
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host ?? "localhost"}`);

    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET, OPTIONS",
        "access-control-allow-headers": "content-type",
        "access-control-max-age": "600",
      });
      res.end();
      return;
    }

    if (req.method === "GET" && url.pathname === "/") {
      sendText(res, 200, "Augnes Core read stub");
      return;
    }

    if (req.method === "GET" && url.pathname === "/healthz") {
      sendJson(res, 200, buildCoreReadStubHealthPayload(config));
      return;
    }

    if (req.method === "GET" && url.pathname === "/working-view") {
      try {
        const workingView = await readWorkingViewFixture(config.workingViewFile);
        sendJson(res, 200, workingView);
      } catch (error) {
        console.error("Core read stub /working-view failed:", error);
        sendCoreError(
          res,
          503,
          "AUGNES_CORE_STUB_WORKING_VIEW_UNAVAILABLE",
          "Working view is unavailable from the Core read stub.",
          true
        );
      }
      return;
    }

    sendCoreError(res, 404, "AUGNES_CORE_STUB_NOT_FOUND", "No read-only Core stub endpoint exists for this path.", false);
  });
}

function isDirectExecution(): boolean {
  return Boolean(process.argv[1]) && pathToFileURL(process.argv[1]).href === import.meta.url;
}

if (isDirectExecution()) {
  const config = resolveCoreReadStubConfig();
  const server = createCoreReadStubServer(config);
  server.listen(config.port, () => {
    console.log(`${CORE_READ_STUB_NAME} listening on http://localhost:${config.port}`);
    console.log(`GET http://localhost:${config.port}/working-view -> ${config.workingViewFile}`);
  });
}
