import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const docPath =
  "docs/TEMPORAL_PREVIEW_REVIEW_ARTIFACT_CREATE_ROUTE_DESIGN_V0_1.md";
const packagePath = "package.json";

const doc = readFileSync(docPath, "utf8");
const normalizedDoc = normalizeWhitespace(doc);
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

const requiredDocNeedles = [
  {
    label: "recommended capture route",
    needle: "POST /api/temporal-interpretation/review-artifacts/capture",
  },
  {
    label: "idempotency",
    needle: "idempotency_key",
  },
  {
    label: "same-key replay",
    needle: "Same idempotency key plus same payload hash returns the existing artifact",
  },
  {
    label: "same-key different payload 409",
    needle: "Same idempotency key plus different payload hash returns `409`",
  },
  {
    label: "duplicate source_ref/preview_hash policy",
    needle: "Duplicate `source_ref` plus `preview_hash` plus `work_id` should return `409`",
  },
  {
    label: "raw_openai_response forbidden",
    needle: "`raw_openai_response`",
  },
  {
    label: "no OpenAI call",
    needle: "must not call OpenAI",
  },
  {
    label: "no GitHub publication adapter",
    needle: "must not call the GitHub publication adapter",
  },
  {
    label: "no approval/publish/replay/state mutation",
    needle: "must not approve, publish, replay, commit state",
  },
  {
    label: "private non-smoke insert helper prerequisite",
    needle: "insertTemporalPreviewReviewArtifact",
  },
  {
    label: "forbidden fixture corpus",
    needle: "TEMPORAL_REVIEW_ARTIFACT_FORBIDDEN_PERSISTENCE_FIXTURES",
  },
  {
    label: "no Cockpit write button",
    needle: "No Cockpit write button",
  },
  {
    label: "no ChatGPT App create tool",
    needle: "No ChatGPT App create tool",
  },
];

for (const { label, needle } of requiredDocNeedles) {
  assert.ok(
    normalizedDoc.includes(normalizeWhitespace(needle)),
    `${docPath} must include ${label}: ${JSON.stringify(needle)}`,
  );
}

assert.equal(
  packageJson.scripts?.["smoke:temporal-create-route-design"],
  "node scripts/smoke-temporal-create-route-design.mjs",
  "package script smoke:temporal-create-route-design must exist",
);

console.log(
  JSON.stringify(
    {
      smoke: "temporal-create-route-design",
      doc_path: docPath,
      route_design_doc_exists: true,
      recommended_route_specified: true,
      idempotency_design_present: true,
      same_key_replay_present: true,
      same_key_different_payload_409_present: true,
      duplicate_source_ref_preview_hash_policy_present: true,
      raw_openai_response_forbidden_present: true,
      no_openai_call_boundary_present: true,
      no_github_publication_adapter_boundary_present: true,
      no_approval_publish_replay_state_mutation_boundary_present: true,
      private_non_smoke_insert_helper_prerequisite_present: true,
      forbidden_fixture_corpus_required: true,
      no_cockpit_write_button_present: true,
      no_chatgpt_app_create_tool_present: true,
      package_script_exists: true,
    },
    null,
    2,
  ),
);

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}
