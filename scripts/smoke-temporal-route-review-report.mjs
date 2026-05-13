import { existsSync, readFileSync } from "node:fs";

const templatePath = "docs/TEMPORAL_INTERPRETATION_MANUAL_REVIEW_REPORT.md";
const reportPath =
  "docs/TEMPORAL_INTERPRETATION_MANUAL_REVIEW_REPORT_ROUTE_CAPTURE_V0_1.md";
const packagePath = "package.json";

for (const path of [templatePath, reportPath, packagePath]) {
  if (!existsSync(path)) {
    throw new Error(`Missing required route review artifact: ${path}`);
  }
}

const report = readFileSync(reportPath, "utf8");
const normalizedReport = report.toLowerCase();
const pkg = JSON.parse(readFileSync(packagePath, "utf8"));

if (
  pkg.scripts?.["smoke:temporal-route-review-report"] !==
  "node scripts/smoke-temporal-route-review-report.mjs"
) {
  throw new Error("Missing smoke:temporal-route-review-report package script.");
}

const requiredReportText = [
  "post /api/temporal-interpretation/preview",
  "generator observed",
  "mock",
  "openai_api_key was unset",
  "active_context_admission",
  "admission decisions",
  "counterexamples preserved?",
  "residual tensions preserved?",
  "summary/evidence separation",
  "authority boundary check",
  "safe next step check",
  "reviewer verdict",
  "raw full JSON not committed",
];

for (const text of requiredReportText) {
  if (!normalizedReport.includes(text.toLowerCase())) {
    throw new Error(`Route review report missing required text: ${text}`);
  }
}

if (!/\bpass(?:_with_notes)?\b/.test(report.toLowerCase())) {
  throw new Error("Route review report is missing a passing verdict.");
}

console.log(
  JSON.stringify(
    {
      smoke: "temporal-route-review-report",
      template_exists: true,
      report_exists: true,
      route_endpoint_referenced: true,
      mock_generator_referenced: true,
      raw_json_not_committed_referenced: true,
      package_script_exists: true,
    },
    null,
    2,
  ),
);
