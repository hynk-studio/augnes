import { existsSync, readFileSync } from "node:fs";

const workflowPath = "docs/CODEX_SESSION_ADAPTER_V0_2_WORKFLOW.md";

if (!existsSync(workflowPath)) {
  throw new Error(`${workflowPath} is missing.`);
}

const workflow = readFileSync(workflowPath, "utf8");
const completionProtocol = readFileSync(
  "apps/augnes_apps/docs/09_CODEX_COMPLETION_PROTOCOL.md",
  "utf8",
);
const handoffPacket = readFileSync("docs/CODEX_HANDOFF_PACKET.md", "utf8");
const evidencePack = readFileSync("docs/VERIFICATION_EVIDENCE_PACK.md", "utf8");
const rootPackage = JSON.parse(readFileSync("package.json", "utf8"));
const appPackage = JSON.parse(readFileSync("apps/augnes_apps/package.json", "utf8"));

assertIncludes(workflow, [
  "codex:read-brief",
  "codex:bind-session",
  "codex:record-evidence",
  "codex:record-completion",
  "codex:handoff-check",
  "augnes_get_session_trace",
  "augnes_get_evidence_pack",
  "GET /api/sessions/trace",
  "GET /api/evidence-pack",
  "no automatic session creation",
  "no ChatGPT App write tools",
  "no publish/replay/approval/state mutation",
]);

assertIncludes(completionProtocol, [
  "Codex Session Adapter v0.2 Closeout Flow",
  "docs/CODEX_SESSION_ADAPTER_V0_2_WORKFLOW.md",
]);

assertIncludes(handoffPacket, [
  "session_id, session binding status, evidence IDs, and skipped reason when applicable",
]);

assertIncludes(evidencePack, [
  "Codex Session Adapter v0.2 closeout review",
  "structured evidence rows and session trace refs",
  "missing rows or refs must remain visible gaps",
]);

for (const scriptName of [
  "codex:record-evidence",
  "codex:bind-session",
  "smoke:session-binding",
  "smoke:cockpit-session-trace",
  "smoke:codex-session-adapter-v2",
]) {
  assertScript(rootPackage, scriptName);
}

const optionalHelperExists = existsSync(
  "apps/augnes_apps/scripts/codex-session-adapter-v2-check.ts",
);

if (optionalHelperExists) {
  assertScript(rootPackage, "codex:session-adapter-check");
  assertScript(appPackage, "codex:session-adapter-check");
}

console.log(
  JSON.stringify(
    {
      smoke: "codex-session-adapter-v2",
      workflow_doc_present: true,
      workflow_mentions_required_helpers: true,
      workflow_mentions_read_only_tools: true,
      no_new_authority_boundary_documented: true,
      completion_protocol_references_workflow: true,
      handoff_packet_closeout_requirement: true,
      verification_evidence_pack_closeout_review: true,
      optional_helper: optionalHelperExists ? "added" : "skipped",
    },
    null,
    2,
  ),
);

function assertIncludes(content, needles) {
  for (const needle of needles) {
    if (!content.includes(needle)) {
      throw new Error(`Missing required text: ${needle}`);
    }
  }
}

function assertScript(packageJson, scriptName) {
  if (!packageJson.scripts || typeof packageJson.scripts[scriptName] !== "string") {
    throw new Error(`package.json is missing script: ${scriptName}`);
  }
}
