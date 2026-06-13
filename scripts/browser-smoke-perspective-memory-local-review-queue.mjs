import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const browserReportFile =
  "reports/browser/2026-06-13-perspective-memory-local-review-queue.md";
const routePath = "/cockpit/perspective/memory-review-queue/local";

assert.equal(existsSync(browserReportFile), true, `${browserReportFile} must exist`);

const report = readFileSync(browserReportFile, "utf8");
const normalizedReport = report.replace(/\s+/g, " ").trim();

for (const phrase of [
  "Perspective Memory Local Review Queue Browser Validation",
  routePath,
  "route loads successfully",
  "No console warnings/errors",
  "No unexpected external traffic",
  "queue item count visible",
  "queued item list visible",
  "select queue item works",
  "memory candidate preview visible",
  "proposal eligibility visible",
  "Create local memory write proposal works",
  "proposal id visible",
  "proposal_status visible",
  "proposed memory payload visible",
  "should_write_to_memory_now false visible",
  "proposal diff summary visible",
  "PASS with follow-up proposal includes warning/risk caveat",
  "Mark proposal reviewing locally works",
  "Keep proposal for later works",
  "Reject proposal locally works",
  "Mark proposal superseded locally works",
  "clear selected proposal works",
  "clear all proposals works",
  "refresh restores proposals",
  "selected queue item shows already has proposal",
  "removing queue item makes proposal show missing/removed source state",
  "source refs/hashes visible",
  "warning counts visible",
  "authority boundary visible",
  "filters work",
  "Mark reviewing locally works",
  "Keep for later works",
  "Remove from queue works",
  "Clear queue works",
  "refresh preserves queue changes",
  "stale/missing source draft state visible",
  "390px viewport had no horizontal overflow",
  "768px viewport had no horizontal overflow",
  "desktop viewport had no horizontal overflow",
  "no clipboard automation",
  "no provider/model/Codex SDK/GitHub/DB/network behavior",
  "no accepted memory/review decision/Core decision behavior",
  "no raw returned envelope/private/provider/token/browser/source/candidate material visible outside the returned envelope textarea",
]) {
  assert(
    normalizedReport.includes(phrase),
    `browser report must include: ${phrase}`,
  );
}

console.log("PASS browser:perspective-memory-local-review-queue");
