#!/usr/bin/env node

import assert from "node:assert/strict";

import {
  buildGuideBriefUrl,
  fetchGuideBrief,
  printGuideBriefSummary,
} from "../apps/augnes_apps/scripts/codex-read-brief";
import { MockStateRuntimeBridgeAdapter } from "../apps/augnes_apps/scripts/mock-state-runtime";

const PROJECT_ID = "project:00000000-0000-4000-8000-000000000001";

async function main() {
  const adapter = new MockStateRuntimeBridgeAdapter();
  const fixture = await adapter.getGuideBrief({ scope: "project:augnes", projectId: PROJECT_ID });
  const originalFetch = globalThis.fetch;
  let observedUrl = "";
  let observedMarker = "";
  let parsedGuide: Awaited<ReturnType<typeof fetchGuideBrief>> | null = null;
  globalThis.fetch = (async (input, init) => {
    observedUrl = String(input);
    observedMarker = new Headers(init?.headers).get("x-augnes-local-readonly") ?? "";
    return new Response(JSON.stringify(fixture), { status: 200, headers: { "content-type": "application/json" } });
  }) as typeof fetch;
  try {
    const guide = await fetchGuideBrief("http://localhost:3000", "project:augnes", PROJECT_ID);
    parsedGuide = guide;
    assert.equal(guide.guide_version, "guide_brief.v0.2");
    assert.equal(guide.identity.project_id, PROJECT_ID);
    assert.equal(observedMarker, "guide-brief-v0.2");
    assert.match(observedUrl, /scope=project%3Aaugnes/u);
    assert.match(observedUrl, /project_id=project%3A00000000-0000-4000-8000-000000000001/u);
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(
    buildGuideBriefUrl("http://localhost:3000", "project:augnes", null).pathname,
    "/api/augnes/read/guide-brief",
  );

  const lines: string[] = [];
  const originalLog = console.log;
  console.log = (...values: unknown[]) => { lines.push(values.join(" ")); };
  try {
    assert(parsedGuide);
    printGuideBriefSummary(parsedGuide);
  } finally {
    console.log = originalLog;
  }
  const rendered = lines.join("\n");
  for (const heading of [
    "Current coordinate",
    "Observed",
    "Inferred with caveats",
    "Suggested",
    "Needs user judgment",
    "Constraints",
    "Required checks",
    "Authority boundary",
    "Source status",
  ]) assert.match(rendered, new RegExp(heading, "u"));
  assert.match(rendered, /TaskContextPacket is delivered separately/u);
  assert.equal(rendered.includes("item_id"), false);
  assert.equal(Buffer.byteLength(rendered, "utf8") < 16_384, true);

  globalThis.fetch = (async () => new Response(JSON.stringify({ runtime: "augnes", guide_version: "guide_brief.v0.1" }), { status: 200 })) as typeof fetch;
  try {
    await assert.rejects(
      fetchGuideBrief("http://localhost:3000", "project:augnes", null),
      /CODEX_READ_BRIEF_INVALID_GUIDE_RESPONSE/u,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }

  globalThis.fetch = (async () => { throw new Error("offline"); }) as typeof fetch;
  try {
    await assert.rejects(
      fetchGuideBrief("http://localhost:3000", "project:augnes", null),
      /CODEX_READ_BRIEF_RUNTIME_UNAVAILABLE/u,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }

  console.log(JSON.stringify({
    assertions: 21,
    guide_marker: "guide-brief-v0.2",
    bounded_sections: true,
    old_state_brief_rejected: true,
    unavailable_explicit: true,
  }));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
