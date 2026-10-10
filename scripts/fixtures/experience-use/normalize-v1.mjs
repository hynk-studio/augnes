// Qualified synthetic build-events.v1 callable. No population filter or I/O.
import assert from "node:assert/strict";

export function exactKeys(value, keys) {
  assert(value && typeof value === "object" && !Array.isArray(value), "object required");
  assert.deepEqual(Object.keys(value).sort(), [...keys].sort(), "unknown or missing fields");
}

export function normalizeV1(input) {
  exactKeys(input, ["schema_version", "events"]);
  assert.equal(input.schema_version, "build-events.v1", "unsupported version; do not guess units");
  assert(Array.isArray(input.events), "events required");
  const seen = new Map(), rows = [];
  for (const event of input.events) {
    exactKeys(event, ["event_id", "job_id", "attempt", "status", "duration_s"]);
    assert(typeof event.event_id === "string" && event.event_id.trim(), "event_id required");
    assert(typeof event.job_id === "string" && event.job_id.trim(), "job_id required");
    assert(Number.isSafeInteger(event.attempt) && event.attempt > 0, "positive integer attempt required");
    assert(["ok", "failed"].includes(event.status), "unknown status");
    assert(typeof event.duration_s === "string" && /^\d+(?:\.\d{1,3})?$/u.test(event.duration_s), "exact decimal seconds required");
    // Compare original fields, including decimal spelling, before normalization.
    const identity = JSON.stringify([event.job_id, event.attempt, event.status, event.duration_s]);
    if (seen.has(event.event_id)) {
      assert.equal(seen.get(event.event_id), identity, "conflicting event_id");
      continue;
    }
    seen.set(event.event_id, identity);
    const [seconds, fraction = ""] = event.duration_s.split(".");
    const milliseconds = BigInt(seconds) * 1000n + BigInt(fraction.padEnd(3, "0"));
    assert(milliseconds <= BigInt(Number.MAX_SAFE_INTEGER), "duration exceeds exact JSON integer range");
    rows.push({ event_id: event.event_id, job_id: event.job_id, attempt: event.attempt,
      status: event.status, duration_ms: Number(milliseconds) });
  }
  rows.sort((a, b) => a.event_id < b.event_id ? -1 : a.event_id > b.event_id ? 1 : 0);
  return { input_rows: input.events.length, unique_attempts: rows.length,
    duplicate_deliveries: input.events.length - rows.length, rows };
}
