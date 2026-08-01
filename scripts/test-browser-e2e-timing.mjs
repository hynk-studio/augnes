#!/usr/bin/env node

import assert from "node:assert/strict";

import {
  createBrowserE2ETimingRecorder,
  publicTimingLabel,
} from "./browser-e2e-timing.mjs";

let clock = 1_000;
const timing = createBrowserE2ETimingRecorder({
  scope: "core",
  now: () => clock,
  maxEvents: 3,
});
const finish = timing.start("wait_for_http", "initial route readiness");
clock += 550;
finish();
clock += 25;
timing.milestone("first approval durable state");
const summary = timing.summary();
assert.equal(summary.timing_version, "browser_e2e_timing.v0.1");
assert.equal(summary.total_elapsed_ms, 575);
assert.equal(summary.event_count, 2);
assert.equal(summary.totals_ms.wait_for_http, 550);
assert.deepEqual(summary.events[0], {
  sequence: 1,
  kind: "wait_for_http_pass",
  label: "initial route readiness",
  elapsed_ms: 550,
  duration_ms: 550,
});
assert.match(publicTimingLabel("/Users/private/project"), /^redacted_[a-f0-9]{12}$/u);
assert.match(publicTimingLabel("OPENAI_API_KEY=secret"), /^redacted_[a-f0-9]{12}$/u);
assert.equal(publicTimingLabel("Project Home refresh\nresponse"), "Project Home refresh response");
assert.equal(createBrowserE2ETimingRecorder({ scope: "cux6b" }).summary().scope, "cux6b");
assert.throws(() => createBrowserE2ETimingRecorder({ scope: "unknown" }), /scope_invalid/u);
assert.throws(
  () => createBrowserE2ETimingRecorder({ scope: "core", maxEvents: 513 }),
  /event_bound_invalid/u,
);
timing.milestone("terminal result");
assert.throws(() => timing.milestone("overflow"), /event_bound_exceeded/u);

process.stdout.write(
  `${JSON.stringify({ test: "browser-e2e-timing", status: "pass", assertions: 13 })}\n`,
);
