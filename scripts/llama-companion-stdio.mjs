#!/usr/bin/env node

import { pathToFileURL } from "node:url";
import {
  handleMessageV01,
  runStdioV01,
} from "../plugins/augnes-operator/mcp/companion-proxy.mjs";

// llama.cpp v1 forwards only content[type=text] to its model. The existing
// Companion summaries omit the exact bindings and source material needed by
// the next tool call. Mirror only the already-returned structured tool result;
// discovery, authentication, authorization and execution stay with the proxy.
// This opt-in entry point does not add protocol-version negotiation.
export async function handleLlamaMessageV01(message, handleMessage = handleMessageV01) {
  const response = await handleMessage(message);
  if (message?.method !== "tools/call" || response?.error ||
      !response?.result || !Object.hasOwn(response.result, "structuredContent")) return response;
  const text = JSON.stringify(response.result.structuredContent);
  if (typeof text !== "string") return response;
  return {
    ...response,
    result: {
      ...response.result,
      content: [...response.result.content, { type: "text", text }],
    },
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runStdioV01(handleLlamaMessageV01).catch(() => { process.exitCode = 1; });
}
