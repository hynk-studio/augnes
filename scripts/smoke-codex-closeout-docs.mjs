import { readFileSync } from "node:fs";

const checks = [
  {
    file: ".github/pull_request_template.md",
    needles: [
      "## Structured Evidence Records",
      "Evidence record IDs:",
      "`command_run`:",
      "`check_passed`:",
      "`check_skipped`:",
      "Did not call GitHub/OpenAI.",
      "Did not execute replay or duplicate publish.",
      "Did not mutate publication/approval/readiness/delivery/mailbox/state rows directly.",
    ],
  },
  {
    file: "apps/augnes_apps/docs/09_CODEX_COMPLETION_PROTOCOL.md",
    needles: [
      "## Structured Evidence Recording Closeout",
      "npm run codex:record-evidence",
      "npm run codex:record-completion-proof",
      "CODEX_EVIDENCE_KIND=command_run",
      "CODEX_EVIDENCE_KIND=check_skipped",
      "evidence_id",
    ],
  },
  {
    file: "docs/VERIFICATION_EVIDENCE_PACK.md",
    needles: [
      "## Structured Records And PR Evidence",
      "verification_evidence_records",
      "machine-readable Core evidence",
      "Missing rows must remain visible as gaps.",
    ],
  },
  {
    file: "docs/CODEX_HANDOFF_PACKET.md",
    needles: [
      "structured evidence record IDs, or the exact reason evidence rows were skipped",
    ],
  },
];

for (const check of checks) {
  const content = readFileSync(check.file, "utf8");
  for (const needle of check.needles) {
    if (!content.includes(needle)) {
      throw new Error(`${check.file} is missing required text: ${needle}`);
    }
  }
}

const rootPackage = JSON.parse(readFileSync("package.json", "utf8"));
const appPackage = JSON.parse(readFileSync("apps/augnes_apps/package.json", "utf8"));

assertScript(rootPackage, "codex:record-evidence");
assertScript(rootPackage, "codex:record-completion-proof");
assertScript(rootPackage, "smoke:codex-record-evidence-helper");
assertScript(rootPackage, "smoke:codex-closeout-docs");
assertScript(appPackage, "codex:record-evidence");
assertScript(appPackage, "codex:record-completion-proof");

console.log(
  JSON.stringify(
    {
      smoke: "codex-closeout-docs",
      pr_template_structured_evidence_records: true,
      completion_protocol_closeout: true,
      verification_evidence_records_documented: true,
      codex_record_evidence_script_present: true,
      helper_smoke_script_present: true,
    },
    null,
    2,
  ),
);

function assertScript(packageJson, scriptName) {
  if (!packageJson.scripts || typeof packageJson.scripts[scriptName] !== "string") {
    throw new Error(`package.json is missing script: ${scriptName}`);
  }
}
