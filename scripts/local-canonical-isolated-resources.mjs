import { existsSync, lstatSync, mkdirSync } from "node:fs";
import path from "node:path";
import {
  buildCanonicalChildEnvironment, createCanonicalTestResourceRoot,
  beginCanonicalTestResourceUse, settleCanonicalTestResourceUse,
  cleanupCanonicalTestResources,
} from "./canonical-test-environment.mjs";
import { physicalFingerprint } from "./local-canonical-verification-context.mjs";
import { initializeSelectedExecution, selectedExecutionEnvironment } from "./local-canonical-selected-execution.mjs";
import { readOwnedChildLifecycleFile } from "./test-harness-process-lifecycle.mjs";
import { createHash } from "node:crypto";
const physicalLedgerHash=value=>createHash("sha256").update(value).digest("hex");

const resources = new WeakMap();
export function createIsolatedInvocationResources(invocationId, { repositoryRoot = null } = {}) {
  const owner = createCanonicalTestResourceRoot("ag-suite-", { shortSocketPaths: true });
  let started=false;
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
    beginCanonicalTestResourceUse(owner); started=true;
    const selection = repositoryRoot ? initializeSelectedExecution({ repositoryRoot, temporaryRoot: owner.root, environment }) : null;
    resources.set(resource, { owner, environment, selection });
    return resource;
  } catch (error) {
    const ledgerFile=path.join(owner.root,"selected-inputs","owned-children.jsonl");
    let settled=!existsSync(ledgerFile);
    if (!settled) {
      try {
        const stat=lstatSync(ledgerFile),parent=lstatSync(path.dirname(ledgerFile));
        // Initialization has not returned its capability. Reconstruct only
        // this new owned file identity; the retained event bytes decide safety.
        const identity={schema:"augnes.owned-child-ledger.v1",location_fingerprint:physicalLedgerHash(ledgerFile),device:String(stat.dev),inode:String(stat.ino),
          mode:stat.mode&0o777,uid:stat.uid,gid:stat.gid,links:stat.nlink,parent_device:String(parent.dev),parent_inode:String(parent.ino)};
        const observed=readOwnedChildLifecycleFile(ledgerFile,identity);
        settled=observed.complete || (observed.started_count===0 && observed.issues.length===0);
      } catch { settled=false; }
    }
    if (!settled || error.owned_child_lifecycle?.event === "unknown" || (error.owned_child_lifecycle_start && !error.owned_child_lifecycle)) {
      throw Object.assign(error,{isolatedResourceCleanup:{completed:false,failure_count:1,failures:["selected_bootstrap_children_unsettled"],
        preserved_root:owner.root,preserved_root_identity:{device:owner.device,inode:owner.inode}}});
    }
    if(started)settleCanonicalTestResourceUse(owner,{exit_observed:true,streams_closed:true,cleanup_completed:true,remaining_owned_processes:0});
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
  return state.selection ? selectedExecutionEnvironment(state.selection) : { ...state.environment };
}

export function isolatedInvocationSelection(resource) {
  const state = resources.get(resource);
  if (!state) throw Object.assign(new Error("isolated_resource_not_owned"), { code: "isolated_resource_not_owned" });
  return state.selection;
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
