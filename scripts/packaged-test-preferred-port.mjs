import assert from "node:assert/strict";
import net from "node:net";

import { PORT_SEARCH_SIZE } from "./augnes-runtime-supervisor-core.mjs";
import { closeTrackedServer, trackServerConnections } from "./test-harness-process-lifecycle.mjs";

// Packaged-test preparation only. A closed probe is not a reservation; the
// unchanged supervisor still owns collisions during its bounded forward search.
export async function choosePackagedTestPreferredPort(ownedServers, excludedPort = null) {
  let requestedPort = 0;
  for (let attempt = 0; attempt < PORT_SEARCH_SIZE; attempt += 1) {
    let server, port, failure;
    try {
      server = trackServerConnections(net.createServer(socket => socket.destroy()));
      ownedServers.add(server);
      await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen({ host: "127.0.0.1", port: requestedPort, exclusive: true }, resolve);
      });
      const address = server.address();
      assert(address && typeof address === "object" && Number.isInteger(address.port) &&
        address.port >= 1 && address.port <= 65_535, "packaged preferred-port address invalid");
      port = address.port;
      assert(requestedPort === 0 || port === requestedPort, "packaged preferred-port binding mismatch");
    } catch (error) {
      failure = error;
    } finally {
      if (server) {
        try {
          await closeTrackedServer(server, { timeoutMs: 3_000 });
          ownedServers.delete(server);
        } catch (cleanupError) {
          // Retain the server for the enclosing test's cleanup owner. A bind
          // refusal never conceals a second failure to settle its resources.
          throw failure ? new AggregateError([failure, cleanupError],
            "packaged preferred-port probe and cleanup failed", { cause: failure }) : cleanupError;
        }
      }
    }
    if (failure) {
      if (requestedPort !== 0 && failure.code === "EADDRINUSE") {
        requestedPort = 0;
        continue;
      }
      throw failure;
    }
    if (port >= 1_024 && port <= 65_535 - PORT_SEARCH_SIZE && port !== excludedPort) return port;
    // An upper-tail assignment selects the next probe, not an unverified port.
    // Explicit fallback binds consume the same finite budget as port-0 probes.
    requestedPort = port > 65_535 - PORT_SEARCH_SIZE ? port - PORT_SEARCH_SIZE
      : port === excludedPort ? (port === 1_024 ? 1_025 : port - 1) : 0;
  }
  throw new Error("no valid bounded preferred port was assigned");
}
