#!/usr/bin/env node
import assert from "node:assert/strict";

const checkName = "agent-workplane-legacy-cockpit-runtime-check-v0-1";
const defaultBaseUrl = "http://127.0.0.1:3000";
const baseUrl = normalizeBaseUrl(process.env.BASE_URL || defaultBaseUrl);

const workbenchRequiredMarkers = [
  'data-workplane-panel-id="legacy_cockpit_compatibility"',
  'data-workplane-legacy-cockpit-shrink="workbench_full_mount_removed"',
  'data-workplane-legacy-cockpit-route="/cockpit"',
  "Legacy Cockpit route split",
  "Compatibility pointer",
];

const workbenchForbiddenMarkers = [
  "six-tab-cockpit",
  "cockpit-shell",
  "cockpit-tab-nav",
  "cockpit-tab-panel",
  "<AugnesCockpit",
  "AugnesCockpit",
  "Existing Cockpit compatibility content",
];

const cockpitRequiredMarkers = [
  "Legacy Cockpit",
  "Legacy Cockpit compatibility route",
  "retained Legacy Cockpit compatibility route",
  "cockpit-shell",
  "six-tab-cockpit",
  "cockpit-tab-nav",
];

const routes = {
  workbench: await fetchHtmlRoute("/workbench"),
  cockpit: await fetchHtmlRoute("/cockpit"),
};

assert.equal(
  routes.workbench.status,
  200,
  `GET /workbench expected HTTP 200, received ${routes.workbench.status}`,
);
assert.equal(
  routes.cockpit.status,
  200,
  `GET /cockpit expected HTTP 200, received ${routes.cockpit.status}`,
);

const workbenchHtml = normalizeHtml(routes.workbench.html);
const cockpitHtml = normalizeHtml(routes.cockpit.html);
const workbenchMissingMarkers = getMissingMarkers(
  workbenchHtml,
  workbenchRequiredMarkers,
);
const workbenchForbiddenPresent = getPresentMarkers(
  workbenchHtml,
  workbenchForbiddenMarkers,
);
const cockpitMissingMarkers = getMissingMarkers(
  cockpitHtml,
  cockpitRequiredMarkers,
);

assert.deepEqual(
  workbenchMissingMarkers,
  [],
  `/workbench is missing Legacy Cockpit shrink markers: ${workbenchMissingMarkers.join(", ")}`,
);
assert.deepEqual(
  workbenchForbiddenPresent,
  [],
  `/workbench still contains embedded legacy Cockpit shell markers: ${workbenchForbiddenPresent.join(", ")}`,
);
assert.deepEqual(
  cockpitMissingMarkers,
  [],
  `/cockpit is missing retained Legacy Cockpit route markers: ${cockpitMissingMarkers.join(", ")}`,
);

const result = {
  runtime_check: checkName,
  pass: true,
  base_url: baseUrl,
  routes: {
    workbench: {
      url: routes.workbench.url,
      status: routes.workbench.status,
      shrink_marker_present: true,
      retained_route_pointer_present: true,
      compact_compatibility_panel_present: true,
      embedded_legacy_cockpit_shell_absent: true,
    },
    cockpit: {
      url: routes.cockpit.url,
      status: routes.cockpit.status,
      legacy_cockpit_page_heading_present: true,
      augnes_cockpit_shell_markers_present: true,
      six_tab_shell_marker_present: true,
      retained_compatibility_route_present: true,
    },
  },
};

console.log(JSON.stringify(result, null, 2));
console.log("PASS runtime:agent-workplane-legacy-cockpit-runtime-check-v0-1");

async function fetchHtmlRoute(pathname) {
  const url = new URL(pathname, baseUrl).toString();
  let response;

  try {
    response = await fetch(url, {
      headers: {
        accept: "text/html,*/*",
      },
    });
  } catch (error) {
    throw new Error(
      `GET ${pathname} failed for ${url}: ${error?.message ?? String(error)}`,
    );
  }

  return {
    pathname,
    url,
    status: response.status,
    html: await response.text(),
  };
}

function normalizeBaseUrl(value) {
  const url = new URL(value);
  url.pathname = url.pathname.replace(/\/+$/, "");
  return url.toString().replace(/\/$/, "");
}

function normalizeHtml(html) {
  return html
    .replaceAll("&quot;", '"')
    .replaceAll("&#34;", '"')
    .replaceAll("&#x27;", "'")
    .replaceAll("&amp;", "&");
}

function getMissingMarkers(html, markers) {
  return markers.filter((marker) => !html.includes(marker));
}

function getPresentMarkers(html, markers) {
  return markers.filter((marker) => html.includes(marker));
}
