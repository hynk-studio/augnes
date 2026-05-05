import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { WorkingViewSchema } from "../src/lib/schemas.js";
import { readFileModeEnv } from "./load-file-env.js";

const DEFAULT_PORT = 3000;
const DEFAULT_WORKING_VIEW_FILE = "./data/working-view.example.json";

export interface CoreReadApiStubOptions {
  workingViewFile?: string;
}

function resolveWorkingViewFile(): string {
  if (process.env.AUGNES_WORKING_VIEW_FILE) {
    return process.env.AUGNES_WORKING_VIEW_FILE;
  }

  try {
    const { values } = readFileModeEnv();
    return values.AUGNES_WORKING_VIEW_FILE ?? DEFAULT_WORKING_VIEW_FILE;
  } catch {
    return DEFAULT_WORKING_VIEW_FILE;
  }
}

function sendJson(res: ServerResponse, statusCode: number, body: unknown): void {
  res.writeHead(statusCode, {
    "content-type": "application/json",
    "cache-control": "no-store",
  });
  res.end(JSON.stringify(body));
}

function sendCorsPreflight(res: ServerResponse): void {
  res.writeHead(204, {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "content-type, authorization",
    "cache-control": "no-store",
  });
  res.end();
}

function readWorkingView(filePath: string): unknown {
  const raw = readFileSync(resolve(process.cwd(), filePath), "utf8");
  const parsedJson = JSON.parse(raw) as unknown;
  const parsed = WorkingViewSchema.safeParse(parsedJson);

  if (!parsed.success) {
    throw new Error("Working view fixture does not match WorkingViewSchema.");
  }

  return parsed.data;
}

function notImplemented(pathname: string) {
  return {
    error: {
      code: "AUGNES_CORE_STUB_ENDPOINT_NOT_IMPLEMENTED",
      message: `The Core read API contract stub only implements GET /working-view. Requested: ${pathname}`,
      retryable: false,
    },
  };
}

function serverError(message: string) {
  return {
    error: {
      code: "AUGNES_CORE_STUB_ERROR",
      message,
      retryable: false,
    },
  };
}

export function createCoreReadApiStubServer(options: CoreReadApiStubOptions = {}) {
  const workingViewFile = options.workingViewFile ?? resolveWorkingViewFile();

  return createServer((req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

    if (req.method === "OPTIONS") {
      sendCorsPreflight(res);
      return;
    }

    if (req.method !== "GET") {
      sendJson(res, 405, {
        error: {
          code: "AUGNES_CORE_STUB_METHOD_NOT_ALLOWED",
          message: "The Core read API contract stub currently accepts GET requests only.",
          retryable: false,
        },
      });
      return;
    }

    if (url.pathname === "/healthz") {
      sendJson(res, 200, {
        ok: true,
        name: "augnes-core-read-api-stub",
        readOnly: true,
        implementedEndpoints: ["GET /working-view"],
        workingViewFile,
      });
      return;
    }

    if (url.pathname === "/working-view") {
      try {
        sendJson(res, 200, readWorkingView(workingViewFile));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to read working view.";
        sendJson(res, 500, serverError(message));
      }
      return;
    }

    sendJson(res, 501, notImplemented(url.pathname));
  });
}

function isDirectExecution(): boolean {
  return Boolean(process.argv[1]) && pathToFileURL(process.argv[1]).href === import.meta.url;
}

if (isDirectExecution()) {
  const port = Number(process.env.AUGNES_CORE_STUB_PORT ?? DEFAULT_PORT);
  const server = createCoreReadApiStubServer();

  server.listen(port, () => {
    console.log(`Augnes Core read API contract stub listening on http://127.0.0.1:${port}`);
    console.log("Implemented endpoints: GET /healthz, GET /working-view");
  });
}
