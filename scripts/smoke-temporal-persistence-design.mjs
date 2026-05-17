import { existsSync, readFileSync } from "node:fs";

const designDocPath =
  "docs/TEMPORAL_INTERPRETATION_PERSISTENCE_DESIGN_V0_1.md";
const statusDocPath =
  "docs/TEMPORAL_INTERPRETATION_V0_2_STATUS_AND_ROADMAP.md";
const routeReviewPath =
  "docs/TEMPORAL_INTERPRETATION_MANUAL_REVIEW_REPORT_ROUTE_CAPTURE_V0_1.md";
const cockpitValidationPath =
  "docs/TEMPORAL_INTERPRETATION_COCKPIT_SCREENSHOT_VALIDATION.md";
const openAiValidationPath =
  "docs/TEMPORAL_INTERPRETATION_OPENAI_PATH_VALIDATION.md";
const readmePath = "README.md";
const onboardingPath = "docs/DEVELOPMENT_ONBOARDING.md";
const packagePath = "package.json";

for (const path of [
  designDocPath,
  statusDocPath,
  routeReviewPath,
  cockpitValidationPath,
  openAiValidationPath,
  readmePath,
  onboardingPath,
  packagePath,
]) {
  if (!existsSync(path)) {
    throw new Error(`Missing required file: ${path}`);
  }
}

const designDoc = readFileSync(designDocPath, "utf8");
const normalizedDesignDoc = designDoc.toLowerCase();
const statusDoc = readFileSync(statusDocPath, "utf8");
const onboarding = readFileSync(onboardingPath, "utf8");
const pkg = JSON.parse(readFileSync(packagePath, "utf8"));

const requiredDesignText = [
  "TemporalPreviewReviewArtifact",
  "PerspectiveSnapshotCandidate",
  "RawEpisodeBundleRef",
  "non-authoritative",
  "forbidden persistence",
  "approval-gated",
  "summary-only refs",
  "not implementation",
  statusDocPath,
  routeReviewPath,
  cockpitValidationPath,
  openAiValidationPath,
];

for (const text of requiredDesignText) {
  if (!normalizedDesignDoc.includes(text.toLowerCase())) {
    throw new Error(`Persistence design doc missing required text: ${text}`);
  }
}

if (!statusDoc.includes(designDocPath)) {
  throw new Error(`Status roadmap doc must reference ${designDocPath}.`);
}

if (!onboarding.includes(designDocPath)) {
  throw new Error(`docs/DEVELOPMENT_ONBOARDING.md must reference ${designDocPath}.`);
}

if (
  pkg.scripts?.["smoke:temporal-persistence-design"] !==
  "node scripts/smoke-temporal-persistence-design.mjs"
) {
  throw new Error("Missing smoke:temporal-persistence-design package script.");
}

console.log(
  JSON.stringify(
    {
      smoke: "temporal-persistence-design",
      design_doc_exists: true,
      target_concepts_present: true,
      forbidden_persistence_present: true,
      approval_gated_boundary_present: true,
      related_artifacts_referenced: true,
      readme_exists: true,
      onboarding_references_design_doc: true,
      package_script_exists: true,
    },
    null,
    2,
  ),
);
