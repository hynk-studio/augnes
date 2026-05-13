import { existsSync, readFileSync } from "node:fs";

const statusDocPath =
  "docs/TEMPORAL_INTERPRETATION_V0_2_STATUS_AND_ROADMAP.md";
const readmePath = "README.md";
const onboardingPath = "DEVELOPMENT_ONBOARDING.md";
const packagePath = "package.json";

for (const path of [statusDocPath, readmePath, onboardingPath, packagePath]) {
  if (!existsSync(path)) {
    throw new Error(`Missing required file: ${path}`);
  }
}

const statusDoc = readFileSync(statusDocPath, "utf8");
const readme = readFileSync(readmePath, "utf8");
const onboarding = readFileSync(onboardingPath, "utf8");
const pkg = JSON.parse(readFileSync(packagePath, "utf8"));

const requiredStatusText = [
  "Temporal Interpretation v0.2",
  "read-only",
  "non-authoritative",
  "active_context_admission",
  "PerspectiveSnapshot",
  "RawEpisodeBundle",
  "Validation matrix",
  "Guarded failure modes",
  "Known limitations",
  "Recommended next step",
  "docs/TEMPORAL_INTERPRETATION_MANUAL_REVIEW_REPORT.md",
  "docs/TEMPORAL_INTERPRETATION_MANUAL_REVIEW_REPORT_MOCK_PREVIEW_V0_1.md",
  "docs/TEMPORAL_INTERPRETATION_OPENAI_PATH_VALIDATION.md",
  "Cockpit rendering",
];

for (const text of requiredStatusText) {
  if (!statusDoc.includes(text)) {
    throw new Error(`Status roadmap doc missing required text: ${text}`);
  }
}

if (!readme.includes(statusDocPath)) {
  throw new Error(`README.md must reference ${statusDocPath}.`);
}

if (!onboarding.includes(statusDocPath)) {
  throw new Error(`DEVELOPMENT_ONBOARDING.md must reference ${statusDocPath}.`);
}

if (
  pkg.scripts?.["smoke:temporal-v02-status-roadmap"] !==
  "node scripts/smoke-temporal-v02-status-roadmap.mjs"
) {
  throw new Error("Missing smoke:temporal-v02-status-roadmap package script.");
}

console.log(
  JSON.stringify(
    {
      smoke: "temporal-v02-status-roadmap",
      status_doc_exists: true,
      status_doc_required_text_present: true,
      readme_references_status_doc: true,
      onboarding_references_status_doc: true,
      package_script_exists: true,
    },
    null,
    2,
  ),
);
