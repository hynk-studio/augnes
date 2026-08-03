#!/usr/bin/env node

import { createHash } from "node:crypto";
import { lstatSync, readFileSync, readdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const TOOL_NAME = "augnes_resume_repository";
const MAX_RUNTIME_FILE_BYTES = 64 * 1024;
const REQUEST_TIMEOUT_MS = 2_000;

export async function discoverVerifiedCompanionV01(environment = process.env) {
  const verified = [];
  for (const manifestPath of candidateManifestPathsV01(environment)) {
    const companion = await verifyManifestV01(manifestPath);
    if (companion) verified.push(companion);
  }
  return verified.length === 1
    ? { status: "resolved", companion: verified[0] }
    : verified.length === 0
      ? { status: "companion_unavailable", companion: null }
      : { status: "companion_ambiguous", companion: null };
}

export function candidateManifestPathsV01(environment = process.env) {
  const explicit = environment.AUGNES_COMPANION_RUNTIME_MANIFEST;
  if (explicit) {
    return environment.AUGNES_COMPANION_TEST_MODE === "1" && path.isAbsolute(explicit)
      ? [path.resolve(explicit)]
      : [];
  }
  const configuredRuntimeDirectory = environment.AUGNES_RUNTIME_STATE_DIR;
  if (configuredRuntimeDirectory) {
    return path.isAbsolute(configuredRuntimeDirectory)
      ? [path.join(path.resolve(configuredRuntimeDirectory), "runtime.json")]
      : [];
  }
  const home = os.homedir();
  const roots = process.platform === "darwin"
    ? [path.join(home, "Library", "Application Support", "Augnes", "runtime")]
    : process.platform === "win32"
      ? [path.join(environment.LOCALAPPDATA ?? path.join(home, "AppData", "Local"), "Augnes", "runtime")]
      : [
          ...(environment.XDG_RUNTIME_DIR ? [environment.XDG_RUNTIME_DIR] : []),
          path.join(environment.XDG_STATE_HOME ?? path.join(home, ".local", "state"), "augnes", "runtime"),
        ];
  const candidates = [];
  for (const root of roots) {
    try {
      for (const entry of readdirSync(root, { withFileTypes: true })) {
        if (entry.isDirectory() && !entry.isSymbolicLink() && /^checkout-[a-f0-9]{16}$/u.test(entry.name)) {
          candidates.push(path.join(root, entry.name, "runtime.json"));
        }
      }
    } catch {
      // A missing platform runtime root means no Companion at that location.
    }
  }
  return [...new Set(candidates)].sort();
}

async function verifyManifestV01(manifestPath) {
  const manifest = readBoundedJsonV01(manifestPath);
  const token = readBoundedJsonV01(path.join(path.dirname(manifestPath), "control-token.json"));
  if (!validManifestV01(manifest) || !validTokenV01(token, manifest) || !processAliveV01(manifest.supervisor_pid)) {
    return null;
  }
  const children = new Map(manifest.children.map((child) => [child.role, child]));
  const ui = children.get("ui");
  const bridge = children.get("bridge");
  if (!validChildV01(ui, manifest.ui_port) || !validChildV01(bridge, manifest.bridge_port)) return null;

  const ownershipHeader = { "x-augnes-child-ownership": token.child_ownership_token };
  const [uiPublic, bridgePublic, uiPrivate, bridgePrivate] = await Promise.all([
    fetchJsonV01(`${manifest.effective_url}/api/healthz`),
    fetchJsonV01(`http://127.0.0.1:${manifest.bridge_port}/healthz`),
    fetchJsonV01(`${manifest.effective_url}/api/healthz?ownership=1`, ownershipHeader),
    fetchJsonV01(`http://127.0.0.1:${manifest.bridge_port}/healthz?ownership=1`, ownershipHeader),
  ]);
  if (
    !samePublicUiV01(uiPublic, manifest) ||
    !samePublicBridgeV01(bridgePublic, manifest) ||
    !samePrivateChildV01(uiPrivate, manifest, "ui", ui) ||
    !samePrivateChildV01(bridgePrivate, manifest, "bridge", bridge)
  ) {
    return null;
  }
  return {
    bridge_url: `http://127.0.0.1:${manifest.bridge_port}/mcp`,
    binding: `sha256:${createHash("sha256").update(JSON.stringify({
      instance: manifest.instance_id,
      generation: manifest.generation_id,
      repository: manifest.repository_fingerprint,
    })).digest("hex")}`,
  };
}

function validManifestV01(value) {
  return Boolean(value) &&
    value.schema_version === 2 &&
    value.contract === "augnes-local-runtime-supervisor-v1" &&
    value.generation_version === 1 &&
    typeof value.generation_id === "string" && value.generation_id.length > 0 &&
    typeof value.instance_id === "string" && value.instance_id.length > 0 &&
    /^[a-f0-9]{64}$/u.test(value.repository_fingerprint ?? "") &&
    Number.isInteger(value.supervisor_pid) && value.supervisor_pid > 0 &&
    value.lifecycle_state === "ready" &&
    value.database_state !== "recovery_required" &&
    typeof value.effective_url === "string" && /^http:\/\/127\.0\.0\.1:[0-9]+$/u.test(value.effective_url) &&
    Number.isInteger(value.ui_port) && value.ui_port > 0 &&
    Number.isInteger(value.bridge_port) && value.bridge_port > 0 &&
    Array.isArray(value.children);
}

function validTokenV01(token, manifest) {
  return Boolean(token) &&
    token.schema_version === manifest.schema_version &&
    token.contract === manifest.contract &&
    token.generation_version === manifest.generation_version &&
    token.generation_id === manifest.generation_id &&
    token.instance_id === manifest.instance_id &&
    token.repository_fingerprint === manifest.repository_fingerprint &&
    typeof token.child_ownership_token === "string" && token.child_ownership_token.length >= 32;
}

function validChildV01(child, port) {
  return Boolean(child) && child.state === "ready" && child.port === port &&
    Number.isInteger(child.pid) && child.pid > 0 && processAliveV01(child.pid);
}

function samePublicUiV01(body, manifest) {
  return body?.ok === true && body?.service === "augnes-ui" && body?.status === "ready" &&
    body?.recovery_mode === false && body?.runtime_instance_id === manifest.instance_id &&
    body?.runtime_generation_id === manifest.generation_id &&
    body?.runtime_repository_fingerprint === manifest.repository_fingerprint;
}

function samePublicBridgeV01(body, manifest) {
  return body?.ok === true && body?.name === "augnes-console" && body?.mode === "http" &&
    body?.live_core_status === "ready" && body?.runtime_instance_id === manifest.instance_id &&
    body?.runtime_generation_id === manifest.generation_id &&
    body?.runtime_repository_fingerprint === manifest.repository_fingerprint;
}

function samePrivateChildV01(body, manifest, role, child) {
  return body?.ownership_verified === true && body?.schema_version === manifest.schema_version &&
    body?.contract === manifest.contract && body?.generation_version === manifest.generation_version &&
    body?.generation_id === manifest.generation_id && body?.repository_fingerprint === manifest.repository_fingerprint &&
    body?.instance_id === manifest.instance_id && body?.role === role &&
    body?.child_root_pid === child.pid && body?.loopback_port === child.port;
}

function readBoundedJsonV01(file) {
  try {
    const stat = lstatSync(file);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > MAX_RUNTIME_FILE_BYTES) return null;
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function processAliveV01(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error?.code === "EPERM";
  }
}

async function fetchJsonV01(url, headers = {}) {
  try {
    const response = await fetch(url, {
      method: "GET",
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}

async function forwardRepositoryCallV01(companion, request) {
  const response = await fetch(companion.bridge_url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
    },
    body: JSON.stringify(request),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`live_companion_mcp_status_${response.status}`);
  const text = await response.text();
  return parseMcpResponseV01(text, response.headers.get("content-type"));
}

function parseMcpResponseV01(text, contentType) {
  if (contentType?.includes("text/event-stream")) {
    const data = text.split(/\r?\n/u).filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trim()).find((line) => line && line !== "[DONE]");
    if (!data) throw new Error("live_companion_mcp_response_invalid");
    return JSON.parse(data);
  }
  return JSON.parse(text);
}

function toolDescriptionV01() {
  return {
    name: TOOL_NAME,
    title: "Resume this repository with Augnes",
    description: "Resolve the current local repository through the live supervised Augnes Companion and return exact read-only project/work/run/result/review continuity.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["repositoryRoot"],
      properties: { repositoryRoot: { type: "string", minLength: 1 } },
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  };
}

function unavailableToolResultV01(reason) {
  const structuredContent = {
    companion: { status: "unavailable", mode: "http", binding: null },
    repository_resolution: {
      status: "companion_unavailable",
      project_key: null,
      display_name: null,
      message: reason,
    },
    continuity: null,
    current_situation: "Exact repository continuity is unavailable because one verified live Augnes Companion could not be selected.",
    next_meaningful_action: { label: "Start or disambiguate the local Augnes Companion", reason, executes: false },
    browser_deep_link: null,
  };
  return {
    isError: true,
    structuredContent,
    content: [{ type: "text", text: structuredContent.current_situation }],
  };
}

async function handleMessageV01(message) {
  if (message.method === "initialize") {
    return { jsonrpc: "2.0", id: message.id, result: {
      protocolVersion: message.params?.protocolVersion ?? "2025-06-18",
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: "augnes-live-companion-proxy", version: "0.1.0" },
    } };
  }
  if (message.method === "notifications/initialized" || message.method === "notifications/cancelled") return null;
  if (message.method === "ping") return { jsonrpc: "2.0", id: message.id, result: {} };
  if (message.method === "tools/list") {
    return { jsonrpc: "2.0", id: message.id, result: { tools: [toolDescriptionV01()] } };
  }
  if (message.method === "tools/call") {
    const args = message.params?.arguments;
    if (
      message.params?.name !== TOOL_NAME ||
      !args ||
      typeof args !== "object" ||
      Array.isArray(args) ||
      Object.keys(args).length !== 1 ||
      typeof args.repositoryRoot !== "string"
    ) {
      return { jsonrpc: "2.0", id: message.id, error: { code: -32602, message: "invalid_repository_tool_request" } };
    }
    const discovery = await discoverVerifiedCompanionV01();
    if (discovery.status !== "resolved") {
      const reason = discovery.status === "companion_ambiguous"
        ? "Multiple verified live Augnes Companions were found; no runtime was selected."
        : "No verified live Augnes Companion was found.";
      return { jsonrpc: "2.0", id: message.id, result: unavailableToolResultV01(reason) };
    }
    try {
      return await forwardRepositoryCallV01(discovery.companion, message);
    } catch {
      return { jsonrpc: "2.0", id: message.id, result: unavailableToolResultV01("The verified Companion became unavailable before the continuity read completed.") };
    }
  }
  return { jsonrpc: "2.0", id: message.id ?? null, error: { code: -32601, message: "method_not_found" } };
}

async function runStdioV01() {
  let buffered = "";
  process.stdin.setEncoding("utf8");
  for await (const chunk of process.stdin) {
    buffered += chunk;
    for (;;) {
      const newline = buffered.indexOf("\n");
      if (newline < 0) break;
      const line = buffered.slice(0, newline).trim();
      buffered = buffered.slice(newline + 1);
      if (!line) continue;
      let response;
      try {
        response = await handleMessageV01(JSON.parse(line));
      } catch {
        response = { jsonrpc: "2.0", id: null, error: { code: -32700, message: "parse_error" } };
      }
      if (response) process.stdout.write(`${JSON.stringify(response)}\n`);
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runStdioV01().catch(() => { process.exitCode = 1; });
}
