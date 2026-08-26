#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";

import { acquireCompanionServiceMaintenance } from
  "../plugins/augnes-operator/mcp/companion-service-core.mjs";

if (process.env.AUGNES_COMPANION_SERVICE_TEST_MODE !== "1") {
  throw new Error("companion_service_maintenance_probe_test_only");
}

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const maintenance = await acquireCompanionServiceMaintenance({
  repositoryRoot,
  operationId: `stale-owner-probe:${process.pid}`,
  environment: process.env,
  testScope: process.env.AUGNES_COMPANION_SERVICE_TEST_SCOPE,
  joinAncestorLease:
    process.env.AUGNES_COMPANION_MAINTENANCE_JOIN_ANCESTOR === "1",
});
process.stdout.write(`${JSON.stringify({
  acquired: maintenance.acquired,
  before: maintenance.before,
})}\n`);
if (maintenance.joined === true) process.exit(0);
await new Promise(() => {});
