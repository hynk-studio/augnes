import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, cpSync } from "node:fs";
import path from "node:path";
import { runCanonicalChild, canonicalChildAcceptanceFailure } from "./canonical-child-runner.mjs";
import { createCanonicalTestResourceRoot, beginCanonicalTestResourceUse, settleCanonicalTestResourceUse, cleanupCanonicalTestResources } from "./canonical-test-environment.mjs";
const destination = process.argv[2];
assert(!destination || (path.isAbsolute(destination) && !existsSync(destination)));
const owner = createCanonicalTestResourceRoot("ag-suite-", { shortSocketPaths: true });
async function main() {
beginCanonicalTestResourceUse(owner);
let settled = true;
try {
    // Each producer has fully exited before the next process starts. Only the
    // database/configuration and ordinary project material cross that boundary.
    for (const mode of ["producer", "consumer", "recover", "restored", "boundaries"]) {
        settled = false;
        const result = await runCanonicalChild({ suite: "late-review", label: mode, command: process.execPath,
            args: ["--import", "tsx", "scripts/late-review-fixture.ts", mode, owner.root], cwd: process.cwd(), env: process.env,
            timeoutMs: 30_000, heartbeatMs: 5000, resourceOwner: undefined });
        settled = result.exit_observed && result.streams_closed && result.cleanup_completed && result.remaining_owned_processes === 0;
        assert.equal(canonicalChildAcceptanceFailure(result, { suite: "late-review", timeoutMs: 30_000, requireNaturalExit: true }), null);
    }
    const read = (name: string) => JSON.parse(readFileSync(path.join(owner.root, "artifacts", name + ".json"), "utf8"));
    const a = read("consumer-followup"), b = read("restored-followup");
    assert.deepEqual(a, b, "backup/restore must preserve full historical/current follow-up");
    assert.equal(a.load_l, 27); assert.equal(a.trips, 1); assert.equal(a.vehicle_capacity_l, 30);
    assert.equal(a.non_use.trips, 2); assert.equal(a.dispatch_authorized, false);
    assert.match(a.next_check, /road access/); assert.equal(a.retained_response_refs.length, 2);
    console.log(JSON.stringify({ test: "late-review", status: "PASS", checks: read("producer-results").checks,
        boundary_checks: read("boundary-results").checks, fresh_processes: 5, actual_external_participation: "NOT_RUN", human_model_semantic_consumption: "NOT_RUN", comparative_usefulness: "NOT_RUN" }));
} finally {
    if (destination && existsSync(path.join(owner.root, "artifacts"))) {
        mkdirSync(destination); cpSync(path.join(owner.root, "artifacts"), destination, { recursive: true, errorOnExist: true });
    }
    if (settled) settleCanonicalTestResourceUse(owner, { exit_observed: true, streams_closed: true, cleanup_completed: true, remaining_owned_processes: 0 });
    const cleanup = cleanupCanonicalTestResources([owner]);
    console.log(JSON.stringify({ test: "late-review-cleanup", cleanup }));
    assert(cleanup.every((r: any) => r.completed));
}
}
void main();
