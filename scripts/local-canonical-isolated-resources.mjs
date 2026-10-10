import { mkdirSync } from "node:fs";
import path from "node:path";
import {
  buildCanonicalChildEnvironment, createCanonicalTestResourceRoot,
  beginCanonicalTestResourceUse, settleCanonicalTestResourceUse,
  cleanupCanonicalTestResources,
} from "./canonical-test-environment.mjs";
import { physicalFingerprint } from "./local-canonical-verification-context.mjs";

const resources = new WeakMap();
export function createIsolatedInvocationResources(invocationId) {
  const owner = createCanonicalTestResourceRoot("ag-suite-", { shortSocketPaths: true });
  try {
    const environment = buildCanonicalChildEnvironment({ temporaryRoot: owner.root });
    // Keep ordinary npm/build mode selection; test suites still set their own mode.
    delete environment.NODE_ENV;
    for (const key of ["HOME", "APPDATA", "LOCALAPPDATA", "AUGNES_RUNTIME_STATE_DIR"])
      mkdirSync(environment[key], { recursive: true, mode: 0o700 });
    environment.npm_config_cache = path.join(owner.root, "npm-cache");
    environment.npm_config_devdir = path.join(owner.root, "node-gyp");
    const resource = Object.freeze({
      invocation_id: invocationId,
      fingerprint: physicalFingerprint(owner.root),
      policy: "private_outer_home_temp_cache_database_runtime",
    });
    resources.set(resource, { owner, environment });
    beginCanonicalTestResourceUse(owner);
    return resource;
  } catch (error) {
    const [cleanup] = cleanupCanonicalTestResources([owner]);
    throw Object.assign(error, { isolatedResourceCleanup: {
      completed: cleanup.completed, failure_count: cleanup.failure_count, failures: cleanup.failures,
    } });
  }
}

export function isolatedInvocationEnvironment(resource) {
  const state = resources.get(resource);
  if (!state || physicalFingerprint(state.owner.root) !== resource.fingerprint)
    throw Object.assign(new Error("isolated_resource_owner_changed"), { code: "isolated_resource_owner_changed" });
  return { ...state.environment };
}

export function cleanupIsolatedInvocationResources(resource, { consumersSettled }) {
  const state = resources.get(resource);
  if (!state) throw Object.assign(new Error("isolated_resource_not_owned"), { code: "isolated_resource_not_owned" });
  if (consumersSettled) settleCanonicalTestResourceUse(state.owner, {
    exit_observed: true, streams_closed: true, cleanup_completed: true, remaining_owned_processes: 0,
  });
  const [result] = cleanupCanonicalTestResources([state.owner]);
  if (result.completed) resources.delete(resource);
  return { completed: result.completed, failure_count: result.failure_count, failures: result.failures };
}
