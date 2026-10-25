import assert from "node:assert/strict";
import { mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createCanonicalTestResourceRoot, cleanupCanonicalTestResources } from "./canonical-test-environment.mjs";
import { auditSelectedConsumers, collectSelectedConsumerInventory, SELECTED_CONSUMER_CONTRACT,
  SELECTED_CONSUMER_MANIFEST, SELECTED_CONSUMER_ROOTS, SELECTED_CONSUMER_OWNERS } from "./local-canonical-selected-consumers.mjs";

const owner = createCanonicalTestResourceRoot("ag-resource-test-");
try {
  const root = owner.root;
  for (const file of Object.values(SELECTED_CONSUMER_OWNERS).flat()) {
    mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    writeFileSync(path.join(root, file), "// Disposable source-inventory control; no qualification identity.\n");
  }
  const inventory = collectSelectedConsumerInventory({ repositoryRoot: root });
  writeFileSync(path.join(root, SELECTED_CONSUMER_MANIFEST), JSON.stringify({
    schema: SELECTED_CONSUMER_CONTRACT, source_roots: SELECTED_CONSUMER_ROOTS,
    reviewed_owners: SELECTED_CONSUMER_OWNERS, file_count: inventory.count, inventory_fingerprint: inventory.fingerprint,
  }));
  assert.equal(auditSelectedConsumers({ repositoryRoot: root }).inventory_fingerprint, inventory.fingerprint);
  const added = path.join(root, "scripts/new-unclassified-reader.mjs");
  writeFileSync(added, "import { readFileSync } from 'node:fs'; readFileSync('/etc/unclassified');\n");
  assert.throws(() => auditSelectedConsumers({ repositoryRoot: root }), /selected_consumer_inventory_changed/u);
  rmSync(added);
  const opaque = path.join(root, "scripts/reader.payload");
  writeFileSync(opaque, "// Extension does not prove non-execution.\n");
  assert.throws(() => auditSelectedConsumers({ repositoryRoot: root }), /selected_consumer_inventory_changed/u);
  rmSync(opaque);
  const component = path.join(root, "components/new-reader.ts");
  mkdirSync(path.dirname(component)); writeFileSync(component, "// New root consumer directory is still fenced.\n");
  assert.throws(() => auditSelectedConsumers({ repositoryRoot: root }), /selected_consumer_inventory_changed/u);
  rmSync(component);
  const rootConfig = path.join(root, ".npmrc"); writeFileSync(rootConfig, "script-shell=/unclassified\n");
  assert.throws(() => auditSelectedConsumers({ repositoryRoot: root }), /selected_consumer_inventory_changed/u);
  rmSync(rootConfig);
  const existing = path.join(root, SELECTED_CONSUMER_OWNERS.controller[0]);
  const prior = readFileSync(existing);
  writeFileSync(existing, "// Changed consumer source cannot inherit the old reviewed map.\n");
  assert.throws(() => auditSelectedConsumers({ repositoryRoot: root }), /selected_consumer_inventory_changed/u);
  writeFileSync(existing, prior);
  rmSync(existing);
  assert.throws(() => auditSelectedConsumers({ repositoryRoot: root }), /selected_consumer_owner_missing/u);
  writeFileSync(existing, prior);
  mkdirSync(path.join(root, "apps/web_planning/node_modules"), { recursive: true });
  writeFileSync(path.join(root, "apps/web_planning/node_modules/generated.js"), "// separately lock/install-bound generated dependency\n");
  assert.equal(auditSelectedConsumers({ repositoryRoot: root }).inventory_fingerprint, inventory.fingerprint);
  symlinkSync(existing, added);
  assert.throws(() => auditSelectedConsumers({ repositoryRoot: root }), /selected_consumer_source_alias_refused/u);
  console.log("selected consumer inventory controls passed: added/changed/missing-or-aliased reader source refuses; generated dependency root stays separately bound");
} finally {
  const [cleanup] = cleanupCanonicalTestResources([owner]);
  assert.equal(cleanup.completed, true, cleanup.failures.join(","));
}
