import { readFileSync, existsSync } from "node:fs";

const validateWrapperPath = "scripts/validate-temporal-openai-path.mjs";
const validateScriptPath = "scripts/validate-temporal-openai-path.ts";
const reportPath = "docs/TEMPORAL_INTERPRETATION_OPENAI_PATH_VALIDATION.md";
const packagePath = "package.json";

for (const path of [
  validateWrapperPath,
  validateScriptPath,
  reportPath,
  packagePath,
]) {
  if (!existsSync(path)) {
    throw new Error(`Missing required validation artifact: ${path}`);
  }
}

const report = readFileSync(reportPath, "utf8");
const pkg = JSON.parse(readFileSync(packagePath, "utf8"));

if (pkg.scripts?.["validate:temporal-openai-path"] !==
  "node scripts/validate-temporal-openai-path.mjs") {
  throw new Error("Missing validate:temporal-openai-path package script.");
}

if (pkg.scripts?.["smoke:temporal-openai-validation-docs"] !==
  "node scripts/smoke-temporal-openai-validation-docs.mjs") {
  throw new Error(
    "Missing smoke:temporal-openai-validation-docs package script.",
  );
}

for (const [name, command] of Object.entries(pkg.scripts ?? {})) {
  if (
    name.startsWith("smoke:") &&
    (String(command).includes("validate-temporal-openai-path") ||
      String(command).includes("OPENAI_API_KEY"))
  ) {
    throw new Error(`Normal smoke script must not require OpenAI: ${name}`);
  }
}

const requiredReportText = [
  "OpenAI-path validation",
  "active_context_admission",
  "guardrails",
  "counterexample",
  "residual tension",
  "summary/evidence",
  "safe_next_step",
  "non-authority",
  "no secrets committed",
  "verdict",
];

for (const text of requiredReportText) {
  if (!report.includes(text)) {
    throw new Error(`Validation report missing required text: ${text}`);
  }
}

console.log(
  JSON.stringify(
    {
      smoke: "temporal-openai-validation-docs",
      validate_script_exists: true,
      package_validate_script_exists: true,
      validation_report_exists: true,
      normal_smoke_requires_openai: false,
    },
    null,
    2,
  ),
);
