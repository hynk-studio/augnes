import { readFile } from "node:fs/promises";

const cockpit = await readFile("components/augnes-cockpit.tsx", "utf8");
const css = await readFile("app/globals.css", "utf8");
const packageJson = await readFile("package.json", "utf8");

const requiredCockpitSnippets = [
  "function SessionTracePanel",
  "Load Session Trace",
  "Refresh Session Trace",
  "/api/sessions/trace?scope=${SCOPE}",
  "setSessionTraceError",
  "Read-only Session Binding v0.1 trace data",
  "message_count",
  "latest_message",
  "work_event_counts",
  "action_records_by_session",
  "verification_evidence_records_total",
  "latest_work_event",
  "latest_evidence_record",
  "gaps",
];

for (const snippet of requiredCockpitSnippets) {
  if (!cockpit.includes(snippet)) {
    throw new Error(`Cockpit session trace smoke missing snippet: ${snippet}`);
  }
}

const forbiddenCockpitSnippets = [
  "/api/sessions/bind",
  "POST /api/sessions/bind",
  ">Bind Session<",
  ">Create Session<",
  ">Save Session<",
  ">Update Session<",
];

for (const snippet of forbiddenCockpitSnippets) {
  if (cockpit.includes(snippet)) {
    throw new Error(`Cockpit session trace smoke found forbidden snippet: ${snippet}`);
  }
}

if (!css.includes(".session-trace-shell")) {
  throw new Error("Cockpit session trace styles are missing.");
}

if (!packageJson.includes('"smoke:cockpit-session-trace"')) {
  throw new Error("package.json does not expose smoke:cockpit-session-trace.");
}

console.log(
  JSON.stringify(
    {
      cockpit_session_trace_panel: true,
      fetches_session_trace_get_endpoint: true,
      cockpit_bind_endpoint_absent: true,
      session_trace_styles_present: true,
      package_script_present: true,
    },
    null,
    2,
  ),
);
