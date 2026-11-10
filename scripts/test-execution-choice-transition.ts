import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, cpSync } from "node:fs";
import path from "node:path";
import { runCanonicalChild, canonicalChildAcceptanceFailure } from "./canonical-child-runner.mjs";
import { createCanonicalTestResourceRoot, beginCanonicalTestResourceUse, settleCanonicalTestResourceUse, cleanupCanonicalTestResources } from "./canonical-test-environment.mjs";

const destination = process.argv[2], existing = process.argv[3] === "existing";
assert(!destination || (path.isAbsolute(destination) && !existsSync(destination)));
const owner = createCanonicalTestResourceRoot("ag-suite-", { shortSocketPaths: true });
async function main() {
    beginCanonicalTestResourceUse(owner);
    let settled = true;
    try {
        for (const role of ["producer", "consumer"]) {
            const mode = (existing ? "existing-" : "") + role;
            settled = false;
            const result = await runCanonicalChild({ suite: "execution-choice-transition", label: mode, command: process.execPath,
                args: ["--import", "tsx", role === "consumer" ? "scripts/execution-choice-followup.ts" : "scripts/execution-choice-transition-fixture.ts", mode, owner.root],
                cwd: process.cwd(), env: process.env, timeoutMs: 30_000, heartbeatMs: 5000, resourceOwner: undefined });
            settled = result.exit_observed && result.streams_closed && result.cleanup_completed && result.remaining_owned_processes === 0;
            assert.equal(canonicalChildAcceptanceFailure(result, { suite: "execution-choice-transition", timeoutMs: 30_000, requireNaturalExit: true }), null);
        }
        const followup = JSON.parse(readFileSync(path.join(owner.root, "artifacts/fresh-followup.json"), "utf8"));
        assert.deepEqual(followup.labels, [
            { label: "red-1", batch: "red", count: 10 }, { label: "red-2", batch: "red", count: 2 },
            { label: "blue-1", batch: "blue", count: 6 }, { label: "green-1", batch: "green", count: 5 },
        ]);
        assert.equal(followup.total_items, 23); assert.equal(followup.tray_count, 4);
        assert.equal(followup.current_arrangement, "Reviewer B"); assert.equal(followup.prior_arrangement, "Reviewer A");
        assert.equal(followup.physical_stock, "unknown"); assert.equal(followup.dispatch_authorized, false);
        console.log(JSON.stringify({test: "execution-choice-transition", existing, status: "PASS", producer_settled_before_fresh_consumer: true,
            actual_external_participation: "NOT_RUN", human_model_semantic_consumption: "NOT_RUN", comparative_usefulness: "NOT_RUN"}));
    } finally {
        let exportError: unknown;
        try {
            if (destination && existsSync(path.join(owner.root, "artifacts"))) {
                mkdirSync(destination); cpSync(path.join(owner.root, "artifacts"), destination, { recursive: true, errorOnExist: true });
            }
        } catch (error) { exportError = error; }
        if (settled) settleCanonicalTestResourceUse(owner, {exit_observed:true,streams_closed:true,cleanup_completed:true,remaining_owned_processes:0});
        const cleanup = cleanupCanonicalTestResources([owner]);
        console.log(JSON.stringify({test:"execution-choice-transition-cleanup",cleanup}));
        assert(cleanup.every((r:any)=>r.completed));
        if (exportError) throw exportError;
    }
}
void main();
