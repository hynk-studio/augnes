// Separate v2 adapter; retains the original v1 callable and its strict contract.
import assert from "node:assert/strict";
import { exactKeys, normalizeV1 } from "./normalize-v1.mjs";

export function normalizeV2(input) {
  exactKeys(input, ["schema_version", "events"]);
  assert.equal(input.schema_version, "build-events.v2", "unsupported version");
  assert(Array.isArray(input.events));
  const events = input.events.map(event => {
    exactKeys(event, ["event_id", "job_id", "attempt", "outcome", "elapsed_ms"]);
    assert(["passed", "failed"].includes(event.outcome), "unknown outcome");
    assert(Number.isSafeInteger(event.elapsed_ms) && event.elapsed_ms >= 0, "integer milliseconds required");
    const ms = BigInt(event.elapsed_ms);
    return { event_id: event.event_id, job_id: event.job_id, attempt: event.attempt,
      status: event.outcome === "passed" ? "ok" : "failed",
      duration_s: `${ms / 1000n}.${String(ms % 1000n).padStart(3, "0")}` };
  });
  return normalizeV1({ schema_version: "build-events.v1", events });
}
