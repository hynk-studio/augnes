import { readFileSync, existsSync } from "node:fs";

const templatePath = "docs/TEMPORAL_INTERPRETATION_MANUAL_REVIEW_REPORT.md";
const reportPath =
  "docs/TEMPORAL_INTERPRETATION_MANUAL_REVIEW_REPORT_MOCK_PREVIEW_V0_1.md";

if (!existsSync(templatePath)) {
  throw new Error(`Missing manual review template: ${templatePath}`);
}

if (!existsSync(reportPath)) {
  throw new Error(`Missing filled manual review report: ${reportPath}`);
}

const report = readFileSync(reportPath, "utf8");
const lowerReport = report.toLowerCase();

const requiredSubstrings = [
  "Reviewer Verdict",
  "active_context_admission",
  "summary-only",
  "counterexample",
  "residual tension",
  "non-authority",
  "safe_next_step",
  "does not commit state",
  "TEMPORAL_HARDENING_FIXTURES[0]",
  "valid_review_bounded_preview",
];

for (const substring of requiredSubstrings) {
  if (!report.includes(substring)) {
    throw new Error(
      `Filled manual review report missing required text: ${substring}`,
    );
  }
}

if (!/\bpass(?:_with_notes)?\b/.test(lowerReport)) {
  throw new Error("Filled manual review report is missing a passing verdict.");
}

console.log(
  JSON.stringify(
    {
      smoke: "temporal-manual-review-report",
      template_exists: true,
      report_exists: true,
      verdict_present: true,
      source_fixture_referenced: true,
      non_authority_boundary_referenced: true,
    },
    null,
    2,
  ),
);
