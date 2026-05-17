import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const closeoutPath =
  "docs/TEMPORAL_PREVIEW_REVIEW_ARTIFACT_V0_1_CLOSEOUT.md";
const statusPath = "docs/TEMPORAL_INTERPRETATION_V0_2_STATUS_AND_ROADMAP.md";
const persistencePath =
  "docs/TEMPORAL_INTERPRETATION_PERSISTENCE_DESIGN_V0_1.md";
const schemaPath =
  "docs/TEMPORAL_PREVIEW_REVIEW_ARTIFACT_SCHEMA_DESIGN_V0_1.md";
const routePath =
  "docs/TEMPORAL_PREVIEW_REVIEW_ARTIFACT_CREATE_ROUTE_DESIGN_V0_1.md";
const evidencePackPath = "docs/VERIFICATION_EVIDENCE_PACK.md";
const onboardingPath = "docs/DEVELOPMENT_ONBOARDING.md";
const readmePath = "README.md";
const packagePath = "package.json";

const requiredPaths = [
  closeoutPath,
  statusPath,
  persistencePath,
  schemaPath,
  routePath,
  evidencePackPath,
  onboardingPath,
  readmePath,
  packagePath,
];

for (const path of requiredPaths) {
  assert.ok(existsSync(path), `Missing required closeout input: ${path}`);
}

const closeout = readFileSync(closeoutPath, "utf8");
const status = readFileSync(statusPath, "utf8");
const persistence = readFileSync(persistencePath, "utf8");
const schema = readFileSync(schemaPath, "utf8");
const route = readFileSync(routePath, "utf8");
const evidencePack = readFileSync(evidencePackPath, "utf8");
const onboarding = readFileSync(onboardingPath, "utf8");
const readme = readFileSync(readmePath, "utf8");
const pkg = JSON.parse(readFileSync(packagePath, "utf8"));
const normalizedEvidencePack = normalizeWhitespace(evidencePack);
const normalizedRoute = normalizeWhitespace(route);

const joined = [
  closeout,
  status,
  persistence,
  schema,
  route,
  evidencePack,
  onboarding,
  readme,
].join("\n");

const requiredCloseoutText = [
  "complete and closed as a bounded",
  "Seeded work anchor `AG-TEMPORAL-INTERPRETATION`",
  "Schema/read model",
  "Read-only GET list/get APIs",
  "Forbidden-persistence fixture corpus",
  "Non-public capture helper",
  "Private insert helper",
  "Idempotency storage and duplicate source/hash policy",
  "Public bounded capture route",
  "Evidence Pack read-only awareness",
  "Cockpit read-only `Temporal Review Artifacts` browser",
  "Stop expanding `TemporalPreviewReviewArtifact` v0.1",
  "GitHub App/token management",
  "Cockpit product UI and Core-gated write-control design",
];

for (const text of requiredCloseoutText) {
  assert.ok(closeout.includes(text), `${closeoutPath} missing: ${text}`);
}

const requiredJoinedText = [
  "TemporalPreviewReviewArtifact v0.1 is complete",
  "Evidence Pack read-only awareness",
  "Cockpit read-only browser",
  "PerspectiveSnapshot runtime",
  "RawEpisodeBundle runtime",
  "Approval-gated interpretation commit",
  "reviewer_verdict",
  "guardrail_passed",
  "Cockpit DOM is not",
];

for (const text of requiredJoinedText) {
  assert.ok(joined.includes(text), `Closeout docs missing: ${text}`);
}

assert.ok(
  normalizedEvidencePack.includes("Evidence Pack read-only awareness is complete"),
  "Evidence Pack awareness should be marked complete.",
);
assert.ok(
  status.includes("Cockpit read-only browser") &&
    status.includes("v0.1 closeout"),
  "Cockpit browser and closeout status should be marked complete.",
);
assert.ok(
  normalizedRoute.includes("v0.1 is complete and closed") &&
    normalizedRoute.includes(
      "they do not make this route an authority-bearing workflow",
    ),
  "Capture route doc should keep the route bounded and non-authoritative.",
);
assert.ok(
  joined.includes("reviewer_verdict` remains review metadata, not approval") ||
    joined.includes("reviewer_verdict remains review metadata, not approval"),
  "reviewer_verdict must remain non-approval metadata.",
);
assert.ok(
  joined.includes("guardrail_passed` remains guardrail output") ||
    joined.includes("guardrail_passed remains guardrail output"),
  "guardrail_passed must remain guardrail output.",
);

const forbiddenWording = [
  "reviewer_verdict is approval",
  "reviewer_verdict grants approval",
  "guardrail_passed is readiness",
  "guardrail_passed is state commit",
  "Evidence Pack is authority",
  "Cockpit is authority",
  "Cockpit DOM is truth",
];

for (const text of forbiddenWording) {
  assert.ok(!joined.includes(text), `Forbidden authority wording found: ${text}`);
}

assert.equal(
  pkg.scripts?.["smoke:temporal-review-artifact-v01-closeout"],
  "node scripts/smoke-temporal-review-artifact-v01-closeout.mjs",
  "package script smoke:temporal-review-artifact-v01-closeout must exist",
);

console.log(
  JSON.stringify(
    {
      smoke: "temporal-review-artifact-v01-closeout",
      closeout_doc_exists: true,
      v01_marked_complete: true,
      evidence_pack_awareness_marked_complete: true,
      cockpit_browser_marked_complete: true,
      future_authority_work_out_of_scope: true,
      reviewer_verdict_non_approval: true,
      guardrail_passed_non_readiness_non_commit: true,
      package_script_exists: true,
    },
    null,
    2,
  ),
);

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}
