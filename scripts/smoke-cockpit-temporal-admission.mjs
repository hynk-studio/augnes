import { readFileSync, existsSync } from "node:fs";

const cockpitPath = "components/augnes-cockpit.tsx";
const cssPath = "app/globals.css";
const packagePath = "package.json";

for (const path of [cockpitPath, cssPath, packagePath]) {
  if (!existsSync(path)) {
    throw new Error(`Missing required file: ${path}`);
  }
}

const cockpit = readFileSync(cockpitPath, "utf8");
const css = readFileSync(cssPath, "utf8");
const pkg = JSON.parse(readFileSync(packagePath, "utf8"));

const requiredCockpitText = [
  "Structured admission decisions",
  "active_context_admission",
  "candidate_id",
  "source_authority",
  "evidence_refs",
  "counterexample_refs",
  "residual_tension_refs",
  "No structured admission decisions were returned by this preview.",
  "TemporalAdmissionDecisions",
  "TemporalAdmissionDecisionCard",
  "TemporalAdmissionRefs",
];

for (const text of requiredCockpitText) {
  if (!cockpit.includes(text)) {
    throw new Error(`Cockpit temporal admission rendering missing: ${text}`);
  }
}

const requiredStyles = [
  ".temporal-admission-decisions",
  ".temporal-admission-card",
  ".temporal-admission-refs",
];

for (const text of requiredStyles) {
  if (!css.includes(text)) {
    throw new Error(`Cockpit temporal admission style missing: ${text}`);
  }
}

if (pkg.scripts?.["smoke:cockpit-temporal-admission"] !==
  "node scripts/smoke-cockpit-temporal-admission.mjs") {
  throw new Error("Missing smoke:cockpit-temporal-admission package script.");
}

const admissionBlock = extractFunctionBlock(cockpit, "TemporalAdmissionDecisions");
const decisionBlock = extractFunctionBlock(
  cockpit,
  "TemporalAdmissionDecisionCard",
);
const refsBlock = extractFunctionBlock(cockpit, "TemporalAdmissionRefs");
const renderedAdmissionCode = [admissionBlock, decisionBlock, refsBlock].join(
  "\n",
);

const forbiddenControlText = [
  "<button",
  "onClick",
  "fetch(",
  "method: \"POST\"",
  "method: 'POST'",
  "bindSession",
  "createSession",
  "approve",
  "publish",
  "retry",
  "replay",
];

for (const text of forbiddenControlText) {
  if (renderedAdmissionCode.includes(text)) {
    throw new Error(
      `Structured admission rendering introduced write/control text: ${text}`,
    );
  }
}

console.log(
  JSON.stringify(
    {
      smoke: "cockpit-temporal-admission",
      renders_structured_admission_decisions: true,
      active_context_admission_referenced: true,
      fallback_present: true,
      styles_present: true,
      write_controls_added: false,
    },
    null,
    2,
  ),
);

function extractFunctionBlock(source, functionName) {
  const start = source.indexOf(`function ${functionName}`);
  if (start === -1) {
    throw new Error(`Missing function: ${functionName}`);
  }

  const nextFunction = source.indexOf("\nfunction ", start + 1);
  return source.slice(start, nextFunction === -1 ? source.length : nextFunction);
}
