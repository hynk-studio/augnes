#!/usr/bin/env node
import assert from "node:assert/strict";

const checkName = "cockpit-route-removal-runtime-check-v0-1";
const baseUrl = (process.env.BASE_URL || "http://127.0.0.1:3000").replace(
  /\/$/,
  "",
);

const workbenchRequired = [
  'data-workplane-state-proposal-review-panel="v0.1"',
  'data-cockpit-manual-controls-migration="v0.1"',
];

const workbenchForbidden = [
  "legacy_cockpit_compatibility",
  "Legacy Cockpit route split",
  "Compatibility pointer",
  'href="/cockpit"',
  "six-tab-cockpit",
  "cockpit-shell",
  "AugnesCockpit",
];

const cockpitForbidden = [
  "AugnesCockpit",
  "cockpit-shell",
  "six-tab-cockpit",
  "Legacy Cockpit compatibility route",
  "retained compatibility route",
];

const workbench = await getText(`${baseUrl}/workbench`);
assert.equal(workbench.status, 200, "/workbench must return HTTP 200");
for (const marker of workbenchRequired) {
  assert(
    workbench.text.includes(marker),
    `/workbench must contain ${marker}`,
  );
}
for (const marker of workbenchForbidden) {
  assert(
    !workbench.text.includes(marker),
    `/workbench must not contain ${marker}`,
  );
}

const cockpit = await getText(`${baseUrl}/cockpit`);
const cockpitLooksNotFound =
  cockpit.status === 404 ||
  (/not[- ]?found|404/i.test(cockpit.text) &&
    !cockpitForbidden.some((marker) => cockpit.text.includes(marker)));

assert(
  cockpitLooksNotFound,
  `/cockpit must return 404 or framework not-found without Cockpit content; received HTTP ${cockpit.status}`,
);
for (const marker of cockpitForbidden) {
  assert(
    !cockpit.text.includes(marker),
    `/cockpit response must not contain ${marker}`,
  );
}

console.log(
  JSON.stringify(
    {
      runtime: checkName,
      pass: true,
      base_url: baseUrl,
      workbench_status: workbench.status,
      cockpit_status: cockpit.status,
      cockpit_not_found_checked: true,
    },
    null,
    2,
  ),
);
console.log("PASS runtime:cockpit-route-removal-check-v0-1");

async function getText(url) {
  const response = await fetch(url, { method: "GET", redirect: "manual" });
  return {
    status: response.status,
    text: await response.text(),
  };
}
