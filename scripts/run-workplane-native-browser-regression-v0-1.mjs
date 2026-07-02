#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import http from "node:http";
import https from "node:https";

import {
  buildWorkplaneBrowserRegressionReport,
  WORKPLANE_BROWSER_REGRESSION_REQUIRED_MARKERS,
} from "../lib/workplane/workplane-browser-regression.ts";

const url =
  process.env.AUGNES_BROWSER_REGRESSION_URL ??
  "http://127.0.0.1:3000/workbench";
const outputPath = process.env.AUGNES_BROWSER_REGRESSION_OUTPUT_PATH;

const html = await getWorkbenchHtml(url);
const report = buildWorkplaneBrowserRegressionReport({
  html,
  url,
  source: "server_rendered_html",
  metrics_status: "watch",
  dogfood_status: "needs_review",
  cockpit_shrink_readiness: "needs_review",
  notes: [
    "Regression runner performs one GET against an already running dev server.",
  ],
});

if (outputPath) {
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

const markerPassed = report.marker_checks.filter(
  (check) => check.status === "passed",
).length;
const markerFailed = report.marker_checks.filter(
  (check) => check.status === "failed" || check.status === "blocked",
).length;
const capabilityCounts = report.capability_checks.reduce(
  (counts, check) => {
    counts[check.status] = (counts[check.status] ?? 0) + 1;
    return counts;
  },
  {},
);

console.log(
  JSON.stringify(
    {
      version: report.version,
      status: report.status,
      url,
      marker_counts: {
        total: WORKPLANE_BROWSER_REGRESSION_REQUIRED_MARKERS.length,
        passed: markerPassed,
        failed: markerFailed,
      },
      capability_counts: {
        passed: capabilityCounts.passed ?? 0,
        partial: capabilityCounts.partial ?? 0,
        needs_review: capabilityCounts.needs_review ?? 0,
        failed: capabilityCounts.failed ?? 0,
        blocked: capabilityCounts.blocked ?? 0,
      },
      no_control_status: report.no_control_status,
      legacy_compatibility_status: report.legacy_compatibility_status,
      deltabatch_identity_status: report.deltabatch_identity_status,
      recommendation: report.recommendation,
    },
    null,
    2,
  ),
);

async function getWorkbenchHtml(targetUrl) {
  if (typeof fetch === "function") {
    const response = await fetch(targetUrl, { method: "GET" });
    if (!response.ok) {
      throw new Error(`GET ${targetUrl} returned ${response.status}`);
    }
    return await response.text();
  }

  return await new Promise((resolve, reject) => {
    const parsed = new URL(targetUrl);
    const client = parsed.protocol === "https:" ? https : http;
    const request = client.request(
      parsed,
      {
        method: "GET",
        headers: {
          accept: "text/html",
        },
      },
      (response) => {
        if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error(`GET ${targetUrl} returned ${response.statusCode}`));
          response.resume();
          return;
        }
        let body = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.on("end", () => resolve(body));
      },
    );
    request.on("error", reject);
    request.end();
  });
}
