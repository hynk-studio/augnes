import assert from "node:assert/strict";
import path from "node:path";
import { createCanonicalTestResourceRoot, cleanupCanonicalTestResources } from "./canonical-test-environment.mjs";
import { inputAdoptionInventory } from "./local-canonical-input-requalification.mjs";
import { createFixture, git, commit, write } from "./fixtures/input-requalification.mjs";

// Read-only exact Git-tree inventory in an owned disposable repository,
// including literal Next dynamic route components. No attempt is admitted.
const owner = createCanonicalTestResourceRoot("ag-resource-test-");
try {
  const f = createFixture(owner.root, "source-paths");
  const names = ["app/projects/[projectId]/page.tsx", "app/api/events/[event_id]/route.ts", "app/example/[...slug]/route.ts", "app/example/[[...slug]]/page.tsx"];
  for (const name of names) write(path.join(f.checkout, name), "// literal route asset\n");
  const head = commit(f.checkout, "add literal route assets");
  const inventory = inputAdoptionInventory(f.checkout, head, f.base, head);
  for (const name of names) {
    const entry = inventory.entries.find(e => e.path === name);
    assert(entry); assert.equal(entry.base, null); assert.equal(entry.main, null);
    assert.equal(entry.predecessor, entry.target);
    assert(entry.target.endsWith(git(f.checkout, "rev-parse", `${head}:${name}`)));
  }
  // Unknown path syntax is still a refusal, not silently dropped inventory.
  write(path.join(f.checkout, "unsupported path.txt"), "unreviewed path syntax\n");
  const unsupported = commit(f.checkout, "unsupported path syntax control");
  assert.throws(() => inputAdoptionInventory(f.checkout, unsupported, f.base, unsupported), /input_requalification_source_path_unsupported/u);
  console.log(JSON.stringify({ source_path_inventory: "pass", literal_route_entries: names.length, unknown_path_syntax: "refused", admission_performed: false }));
} finally {
  const [cleanup] = cleanupCanonicalTestResources([owner]); assert(cleanup.completed, JSON.stringify(cleanup));
}
