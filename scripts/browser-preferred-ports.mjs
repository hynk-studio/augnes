import net from "node:net";

import { PORT_SEARCH_SIZE } from "./augnes-runtime-supervisor-core.mjs";

const observations = new WeakMap();
const ERROR_CODES = new Set(["EADDRINUSE", "EACCES", "EPERM", "EINVAL", "EMFILE", "ENFILE", "ENOBUFS", "ENOMEM", "ERR_SERVER_NOT_RUNNING"]);
const errorCode = error => ERROR_CODES.has(error?.code) ? error.code : "unclassified";

// Only allocator-owned results/errors carry observations. No error message,
// stack, path, environment or caller-supplied diagnostic is serialized.
export function readBrowserPortAllocationDiagnostic(value) {
  return observations.get(value) ?? null;
}

// Browser-only allocation: the supervisor searches forward from each preferred
// port. An upper-tail OS candidate schedules an actual bind below that tail,
// within the same probe budget; an unprobed transformed port is never returned.
// Closing a probe does not reserve the port. Launch collisions still belong to
// the supervisor, and candidate selection never retries a Browser execution.
export async function chooseBrowserPorts() {
  const ports = [];
  const probes = [];
  let requestedPort = 0;
  const retain = (value, status) => {
    observations.set(value, Object.freeze({
      diagnostic_version: "browser_port_allocation.v1", status,
      probe_limit: PORT_SEARCH_SIZE,
      selected_ports: Object.freeze([...ports]),
      probes: Object.freeze(probes.map(probe => Object.freeze({ ...probe }))),
      cleanup_complete: probes.every(probe => ["closed", "not_created"].includes(probe.cleanup)),
    }));
    return value;
  };
  try {
    for (let attempt = 0; attempt < PORT_SEARCH_SIZE; attempt += 1) {
      const probe = { attempt: attempt + 1, requested_port: requestedPort, port: null, outcome: "probe_error",
        failure_stage: null, error_code: null, cleanup: "not_created", cleanup_error_code: null };
      probes.push(probe);
      let candidate;
      try { candidate = await probeLoopbackPort(probe, requestedPort); }
      catch (error) {
        // A busy explicitly probed fallback is unavailable, not a launch
        // collision. Other probe/cleanup failures preserve their primary error.
        if (requestedPort !== 0 && error?.code === "EADDRINUSE" && probe.cleanup === "closed") {
          probe.outcome = "address_in_use";
          requestedPort = 0;
          continue;
        }
        throw error;
      }
      probe.outcome = !Number.isInteger(candidate) || candidate < 1 || candidate > 65_535
        ? "invalid_port" : candidate < 1_024 || candidate > 65_535 - PORT_SEARCH_SIZE
          ? "range_rejected" : ports.includes(candidate) ? "duplicate" : "selected";
      requestedPort = probe.outcome === "range_rejected" && candidate > 65_535 - PORT_SEARCH_SIZE
        ? candidate - PORT_SEARCH_SIZE : 0;
      if (probe.outcome === "selected") {
        ports.push(candidate);
        if (ports.length === 3) {
          const [app, bridge, debug] = ports;
          return retain({ app, bridge, debug }, "allocated");
        }
      }
    }
    throw new Error("browser_preferred_ports_exhausted");
  } catch (error) {
    if (error !== null && ["object", "function"].includes(typeof error)) retain(error, "failed");
    throw error;
  }
}

async function probeLoopbackPort(probe, requestedPort) {
  let server;
  let failure = null;
  let stage = "create";
  let port;
  try {
    server = net.createServer((socket) => socket.destroy());
    probe.cleanup = "pending";
    stage = "listen";
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(requestedPort, "127.0.0.1", resolve);
    });
    stage = "address";
    const address = server.address();
    if (!address || typeof address !== "object") {
      throw new Error("browser_loopback_port_allocation_failed");
    }
    port = address.port;
    probe.port = Number.isInteger(port) && port >= 1 && port <= 65_535 ? port : null;
    if (requestedPort !== 0 && port !== requestedPort) {
      throw new Error("browser_loopback_port_binding_mismatch");
    }
  } catch (error) {
    failure = error;
    probe.failure_stage = stage;
    probe.error_code = errorCode(error);
  } finally {
    if (server) {
      try {
        await new Promise((resolve, reject) => {
          server.close((error) => {
            if (error && error.code !== "ERR_SERVER_NOT_RUNNING") reject(error);
            else resolve();
          });
        });
        probe.cleanup = "closed";
      } catch (error) {
        probe.cleanup = "failed";
        probe.cleanup_error_code = errorCode(error);
        if (!failure) {
          failure = error;
          probe.failure_stage = "close";
        }
      }
    }
  }
  if (failure) throw failure;
  return port;
}
