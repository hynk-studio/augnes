import { existsSync, readFileSync } from "node:fs";

const reportPath =
  "docs/TEMPORAL_INTERPRETATION_COCKPIT_SCREENSHOT_VALIDATION.md";
const packagePath = "package.json";

for (const path of [reportPath, packagePath]) {
  if (!existsSync(path)) {
    throw new Error(`Missing required Cockpit screenshot validation artifact: ${path}`);
  }
}

const report = readFileSync(reportPath, "utf8");
const normalizedReport = report.toLowerCase();
const pkg = JSON.parse(readFileSync(packagePath, "utf8"));

if (
  pkg.scripts?.["smoke:temporal-cockpit-screenshot-validation"] !==
  "node scripts/smoke-temporal-cockpit-screenshot-validation.mjs"
) {
  throw new Error(
    "Missing smoke:temporal-cockpit-screenshot-validation package script.",
  );
}

const requiredReportText = [
  "Cockpit",
  "Temporal Interpretation Preview",
  "Structured admission decisions",
  "active_context_admission",
  "generator",
  "mock",
  "guardrails",
  "candidate_id",
  "source_authority",
  "counterexample_refs",
  "residual_tension_refs",
  "read-only",
  "OPENAI_API_KEY unset",
];

for (const text of requiredReportText) {
  if (!normalizedReport.includes(text.toLowerCase())) {
    throw new Error(`Cockpit screenshot validation report missing: ${text}`);
  }
}

if (
  !normalizedReport.includes("no write controls") &&
  !normalizedReport.includes("no cockpit write controls")
) {
  throw new Error(
    "Cockpit screenshot validation report missing no-write-control confirmation.",
  );
}

const committedScreenshotMatch = report.match(
  /docs\/(?:assets|screenshots)\/[A-Za-z0-9._/-]+\.png/,
);

if (committedScreenshotMatch && !existsSync(committedScreenshotMatch[0])) {
  throw new Error(
    `Report references committed screenshot that does not exist: ${committedScreenshotMatch[0]}`,
  );
}

if (!/\bpass(?:_with_notes)?\b/.test(normalizedReport)) {
  throw new Error("Cockpit screenshot validation report is missing a passing result.");
}

console.log(
  JSON.stringify(
    {
      smoke: "temporal-cockpit-screenshot-validation",
      report_exists: true,
      cockpit_referenced: true,
      temporal_preview_referenced: true,
      active_context_admission_referenced: true,
      mock_generator_referenced: true,
      guardrails_referenced: true,
      read_only_boundary_referenced: true,
      write_controls_absent_referenced: true,
      screenshot_reference_checked: Boolean(committedScreenshotMatch),
    },
    null,
    2,
  ),
);
