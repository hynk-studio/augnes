import { existsSync, readFileSync } from "node:fs";

const bindingDocPath =
  "docs/TEMPORAL_INTERPRETATION_WORK_AND_EVIDENCE_BINDING.md";
const persistenceDesignPath =
  "docs/TEMPORAL_INTERPRETATION_PERSISTENCE_DESIGN_V0_1.md";
const statusDocPath =
  "docs/TEMPORAL_INTERPRETATION_V0_2_STATUS_AND_ROADMAP.md";
const packagePath = "package.json";

for (const path of [
  bindingDocPath,
  persistenceDesignPath,
  statusDocPath,
  packagePath,
]) {
  if (!existsSync(path)) {
    throw new Error(`Missing required file: ${path}`);
  }
}

const bindingDoc = readFileSync(bindingDocPath, "utf8");
const normalizedBindingDoc = bindingDoc.toLowerCase();
const persistenceDesign = readFileSync(persistenceDesignPath, "utf8");
const statusDoc = readFileSync(statusDocPath, "utf8");
const pkg = JSON.parse(readFileSync(packagePath, "utf8"));

const requiredBindingText = [
  "dedicated work",
  "AG-TEMPORAL-INTERPRETATION",
  "target_ref",
  "source_ref",
  "do not invent `work_id`",
  "AG-004",
  "TemporalPreviewReviewArtifact",
  "session_id",
  "evidence_record_ids",
  "no automatic session creation",
  "no GitHub publication adapter",
  "raw OpenAI response",
  persistenceDesignPath,
  statusDocPath,
];

for (const text of requiredBindingText) {
  if (!normalizedBindingDoc.includes(text.toLowerCase())) {
    throw new Error(`Work binding doc missing required text: ${text}`);
  }
}

if (!persistenceDesign.includes(bindingDocPath)) {
  throw new Error(`Persistence design doc must reference ${bindingDocPath}.`);
}

if (!statusDoc.includes(bindingDocPath)) {
  throw new Error(`Status roadmap doc must reference ${bindingDocPath}.`);
}

if (
  pkg.scripts?.["smoke:temporal-work-binding"] !==
  "node scripts/smoke-temporal-work-binding.mjs"
) {
  throw new Error("Missing smoke:temporal-work-binding package script.");
}

console.log(
  JSON.stringify(
    {
      smoke: "temporal-work-binding",
      binding_doc_exists: true,
      canonical_work_anchor_present: true,
      target_and_source_refs_present: true,
      no_invented_work_id_boundary_present: true,
      ag_004_misuse_warning_present: true,
      future_artifact_linkage_present: true,
      session_binding_boundary_present: true,
      github_publication_adapter_forbidden: true,
      raw_openai_response_forbidden: true,
      related_docs_reference_binding_doc: true,
      package_script_exists: true,
    },
    null,
    2,
  ),
);
