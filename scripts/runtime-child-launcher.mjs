#!/usr/bin/env node

import { timingSafeEqual } from "node:crypto";
import { spawn } from "node:child_process";
import { createServer } from "node:http";

const LOOPBACK_HOST = "127.0.0.1";
const childArguments = process.argv.slice(2);
let finishing = false;

if (childArguments.length === 0) {
  process.exitCode = 2;
} else {
  const ownershipServer = createServer((request, response) => {
    if (request.method !== "GET" || request.url !== "/v1/ownership") {
      respond(response, 404, { error: "not_found" });
      return;
    }
    const supplied = Array.isArray(request.headers["x-augnes-child-ownership"])
      ? request.headers["x-augnes-child-ownership"][0]
      : request.headers["x-augnes-child-ownership"];
    if (!constantTimeEqual(supplied, process.env.AUGNES_RUNTIME_OWNERSHIP_TOKEN)) {
      respond(response, 403, {
        ownership_verified: false,
        reason: "ownership_unverified",
      });
      return;
    }
    respond(response, 200, {
      ownership_verified: true,
      schema_version: integerEnvironment("AUGNES_RUNTIME_SCHEMA_VERSION"),
      contract: process.env.AUGNES_RUNTIME_CONTRACT ?? null,
      generation_version: integerEnvironment(
        "AUGNES_RUNTIME_GENERATION_VERSION",
      ),
      generation_id: process.env.AUGNES_RUNTIME_GENERATION_ID ?? null,
      repository_fingerprint:
        process.env.AUGNES_RUNTIME_REPOSITORY_FINGERPRINT ?? null,
      instance_id: process.env.AUGNES_RUNTIME_INSTANCE_ID ?? null,
      role: process.env.AUGNES_RUNTIME_CHILD_ROLE ?? null,
      child_root_pid: process.pid,
      process_pid: process.pid,
      loopback_port: integerEnvironment("AUGNES_RUNTIME_CHILD_PORT"),
    });
  });
  ownershipServer.keepAliveTimeout = 500;
  ownershipServer.headersTimeout = 1_000;
  await new Promise((resolve, reject) => {
    ownershipServer.once("error", reject);
    ownershipServer.listen(
      { host: LOOPBACK_HOST, port: 0, exclusive: true },
      resolve,
    );
  });
  try {
    process.send?.({
      type: "augnes-runtime-child-ownership-ready",
      port: ownershipServer.address().port,
      pid: process.pid,
    });
  } catch {
    // The parent may already have exited; the private listener remains usable.
  }

  const child = spawn(process.execPath, childArguments, {
    env: {
      ...process.env,
      AUGNES_RUNTIME_CHILD_ROOT_PID: String(process.pid),
    },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  forwardWithoutOwningLifetime(child.stdout, process.stdout);
  forwardWithoutOwningLifetime(child.stderr, process.stderr);
  child.once("error", () => finish(ownershipServer, 1));
  child.once("exit", (code) => finish(ownershipServer, code ?? 1));
}

function finish(server, exitCode) {
  if (finishing) return;
  finishing = true;
  if (!server.listening) {
    process.exitCode = exitCode;
    return;
  }
  server.close(() => {
    process.exitCode = exitCode;
  });
  server.closeAllConnections?.();
}

function forwardWithoutOwningLifetime(source, destination) {
  let forwarding = true;
  const stopForwardingOnClosedParent = () => {
    forwarding = false;
  };
  destination.on("error", stopForwardingOnClosedParent);
  source.on("data", (chunk) => {
    if (!forwarding) return;
    try {
      destination.write(chunk, (error) => {
        if (error) stopForwardingOnClosedParent();
      });
    } catch {
      stopForwardingOnClosedParent();
    }
  });
}

function respond(response, statusCode, body) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(JSON.stringify(body));
}

function integerEnvironment(name) {
  const value = Number(process.env[name]);
  return Number.isInteger(value) ? value : null;
}

function constantTimeEqual(left, right) {
  if (typeof left !== "string" || typeof right !== "string") return false;
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}
