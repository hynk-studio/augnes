import { existsSync, readFileSync } from "node:fs";

const schemaDesignPath =
  "docs/TEMPORAL_PREVIEW_REVIEW_ARTIFACT_SCHEMA_DESIGN_V0_1.md";
const persistenceDesignPath =
  "docs/TEMPORAL_INTERPRETATION_PERSISTENCE_DESIGN_V0_1.md";
const workBindingPath =
  "docs/TEMPORAL_INTERPRETATION_WORK_AND_EVIDENCE_BINDING.md";
const packagePath = "package.json";

for (const path of [
  schemaDesignPath,
  persistenceDesignPath,
  workBindingPath,
  packagePath,
]) {
  if (!existsSync(path)) {
    throw new Error(`Missing required file: ${path}`);
  }
}

const schemaDesign = readFileSync(schemaDesignPath, "utf8");
const normalizedSchemaDesign = schemaDesign.toLowerCase();
const pkg = JSON.parse(readFileSync(packagePath, "utf8"));

const requiredText = [
  "temporal_preview_review_artifacts",
  "TemporalPreviewReviewArtifact",
  "AG-TEMPORAL-INTERPRETATION",
  "forbidden fields",
  "raw_openai_response",
  "approval_status",
  "publish_status",
  "memory_admission_status",
  "bounded_preview_json",
  "reviewer_verdict",
  "linked_evidence_record_ids",
  "linked_session_id",
  "Evidence Pack integration",
  "read-only list/get APIs",
  "no implementation",
  persistenceDesignPath,
  workBindingPath,
];

for (const text of requiredText) {
  if (!normalizedSchemaDesign.includes(text.toLowerCase())) {
    throw new Error(`Schema design doc missing required text: ${text}`);
  }
}

if (
  pkg.scripts?.["smoke:temporal-review-artifact-schema-design"] !==
  "node scripts/smoke-temporal-review-artifact-schema-design.mjs"
) {
  throw new Error(
    "Missing smoke:temporal-review-artifact-schema-design package script.",
  );
}

console.log(
  JSON.stringify(
    {
      smoke: "temporal-review-artifact-schema-design",
      schema_design_doc_exists: true,
      conceptual_table_present: true,
      artifact_name_present: true,
      work_anchor_present: true,
      forbidden_fields_present: true,
      raw_openai_response_forbidden: true,
      approval_status_forbidden: true,
      publish_status_forbidden: true,
      memory_admission_status_forbidden: true,
      bounded_preview_json_present: true,
      reviewer_verdict_present: true,
      linked_evidence_record_ids_present: true,
      linked_session_id_present: true,
      evidence_pack_integration_present: true,
      read_only_list_get_api_design_present: true,
      no_implementation_boundary_present: true,
      references_persistence_design: true,
      references_work_evidence_binding: true,
      package_script_exists: true,
    },
    null,
    2,
  ),
);
