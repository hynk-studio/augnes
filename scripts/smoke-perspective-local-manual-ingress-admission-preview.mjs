import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const packageFile = "package.json";
const typeFile = "types/perspective-ingest-constellation-preview.ts";
const ingressTypeFile = "types/perspective-ingress-admission.ts";
const helperFile = "lib/readonly-api/perspective-ingest-local-preview.ts";
const routeFile =
  "app/api/augnes/read/perspective-ingest-local-preview/route.ts";
const ingressModelFile =
  "lib/perspective-ingest/perspective-ingress-admission-model.ts";
const docFile =
  "docs/PERSPECTIVE_LOCAL_MANUAL_INGRESS_ADMISSION_PREVIEW_V0_1.md";
const smokeFile =
  "scripts/smoke-perspective-local-manual-ingress-admission-preview.mjs";
const existingManualSmokeFile =
  "scripts/smoke-perspective-ingest-local-pasted-text-preview.mjs";
const ingressModelSmokeFile =
  "scripts/smoke-perspective-ingress-admission-model.mjs";
const agentBriefSmokeFile =
  "scripts/smoke-perspective-agent-brief-read-surface.mjs";
const projectionBuildersSmokeFile =
  "scripts/smoke-perspective-temporal-spatial-projection-builders.mjs";
const workbenchSmokeFile =
  "scripts/smoke-cockpit-perspective-workbench-temporal-underlay.mjs";
const cockpitFile = "components/augnes-cockpit.tsx";
const reportFile =
  "reports/2026-06-07-perspective-local-manual-ingress-admission-preview.md";

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const typeText = readFileSync(typeFile, "utf8");
const helperText = readFileSync(helperFile, "utf8");
const routeText = readFileSync(routeFile, "utf8");
const docText = readFileSync(docFile, "utf8");
const cockpitText = readFileSync(cockpitFile, "utf8");

const {
  PERSPECTIVE_INGEST_LOCAL_PREVIEW_BOUNDARY_CLASS,
  PERSPECTIVE_INGEST_LOCAL_PREVIEW_LOCAL_READ_MARKER,
  PERSPECTIVE_INGEST_LOCAL_PREVIEW_ROUTE_ID,
  buildPerspectiveIngestLocalPreviewError,
  buildPerspectiveIngestLocalPreviewReadResponse,
  buildPerspectiveIngestLocalPreviewReadResult,
  validatePerspectiveIngestLocalPreviewBody,
} = await import("../lib/readonly-api/perspective-ingest-local-preview.ts");

const allowedChangedFiles = new Set([
  packageFile,
  typeFile,
  helperFile,
  routeFile,
  docFile,
  smokeFile,
  reportFile,
  existingManualSmokeFile,
  ingressModelSmokeFile,
  agentBriefSmokeFile,
  projectionBuildersSmokeFile,
  workbenchSmokeFile,
  "lib/perspective-ingest/perspective-agent-brief.ts",
  "components/augnes-cockpit.tsx",
  "app/globals.css",
  "docs/PERSPECTIVE_INGRESS_ADMISSION_OBSERVATORY_SUMMARY_V0_1.md",
  "reports/browser/2026-06-07-perspective-ingress-admission-observatory-summary.md",
  "scripts/smoke-cockpit-perspective-ingress-admission-observatory-summary.mjs",
  "docs/PERSPECTIVE_AGENT_BRIEF_MANUAL_INGRESS_CONTEXT_V0_1.md",
  "reports/2026-06-07-perspective-agent-brief-manual-ingress-context.md",
  "scripts/smoke-perspective-agent-brief-manual-ingress-context.mjs",
  "lib/perspective-ingest/perspective-agent-brief-handoff-packet.ts",
  "docs/PERSPECTIVE_MANUAL_AGENT_BRIEF_HANDOFF_DOGFOOD_V0_1.md",
  "reports/2026-06-07-perspective-manual-agent-brief-handoff-dogfood.md",
  "scripts/smoke-perspective-manual-agent-brief-handoff-dogfood.mjs",
]);

assert.equal(
  packageJson.scripts["smoke:perspective-local-manual-ingress-admission-preview"],
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-perspective-local-manual-ingress-admission-preview.mjs",
  "package.json must register smoke:perspective-local-manual-ingress-admission-preview",
);

for (const file of [
  typeFile,
  ingressTypeFile,
  ingressModelFile,
  helperFile,
  routeFile,
  docFile,
  smokeFile,
  existingManualSmokeFile,
  ingressModelSmokeFile,
  agentBriefSmokeFile,
  projectionBuildersSmokeFile,
  workbenchSmokeFile,
]) {
  assert.equal(existsSync(file), true, `${file} must exist`);
}

assertContainsAll(docText, [
  "# Perspective Local Manual Ingress Admission Preview v0.1",
  "first runtime use of the Perspective ingress admission model",
  "applies only to the existing local manual pasted-text preview route",
  "Manual pasted text now enters Augnes as a bounded local ingress candidate",
  "Ingress remains separate from Formation",
  "Augnes Formation still builds the actual constellation",
  "Candidate metadata is bounded summary plus pointers only",
  "Raw pasted text is not stored in `ingress_admission`",
  "Rejected raw pasted text is not echoed in errors",
  "ingress_admission?:",
  "perspective_ingress_admission_preview.v0.1",
  "ingress_not_preview_ready",
  "No OAuth",
  "no external API ingress",
  "no provider/model calls",
  "no GitHub calls",
  "no Codex execution",
  "no DB schema or migrations",
  "no persistence",
  "no graph DB behavior",
  "no proof/evidence/readiness writes",
  "no UI redesign",
  "Add compact ingress admission summary to Observatory details",
]);

assertContainsAll(typeText, [
  "PerspectiveIngestAdmissionPreviewV0",
  "ingress_admission?: PerspectiveIngestAdmissionPreviewV0",
  "admission_version: \"perspective_ingress_admission_preview.v0.1\"",
  "candidate: PerspectiveIngressCandidateProjectionV0",
  "readiness: PerspectiveIngressFormationReadinessV0",
  "decision: PerspectiveIngressAdmissionDecisionV0",
  "ingress_kind: \"manual_pasted_text\"",
  "trust_level: \"user_provided_local\"",
]);

assertContainsAll(helperText, [
  "buildPerspectiveIngressSourceArtifactCandidate",
  "buildPerspectiveIngressAdmissionDecision",
  "getPerspectiveIngressFormationReadiness",
  "summarizePerspectiveIngressCandidateForFormation",
  "PERSPECTIVE_INGRESS_DEFAULT_AUTHORITY_BOUNDARY",
  "buildPerspectiveManualPastedTextIngressAdmission",
  "admission_state: \"episode_candidate\"",
  "redaction_state: \"not_applicable\"",
  "manual pasted text passed local bounded preview readiness",
  "ingress_not_preview_ready",
  "Manual pasted text ingress candidate is not ready for preview.",
  "no raw pasted text echo",
]);

assertContainsAll(routeText, [
  "export const runtime = \"nodejs\"",
  "export const dynamic = \"force-dynamic\"",
  "export async function POST",
  "buildPerspectiveIngestLocalPreviewReadResult",
  "if (!readResult.ok)",
  "readResult.authority_boundary",
]);
assert.equal(/\bexport\s+(async\s+)?function\s+GET\b/.test(routeText), false);
assert.equal(PERSPECTIVE_INGEST_LOCAL_PREVIEW_BOUNDARY_CLASS, "read_only_local_ingest_constellation_preview");
assert.equal(PERSPECTIVE_INGEST_LOCAL_PREVIEW_LOCAL_READ_MARKER, "perspective-ingest-local-preview-v0.1");
assert.equal(PERSPECTIVE_INGEST_LOCAL_PREVIEW_ROUTE_ID, "augnes.read.perspective-ingest-local-preview.v0.1");

const safeInput = [
  "Intent: Route existing manual pasted text through ingress admission before preview.",
  "Concept: Local manual ingress candidate metadata stays bounded and read-only.",
  "Decision: Admit only after local preview readiness passes.",
  "Work: Update helper contract without storing raw pasted text.",
  "Changed: types/perspective-ingest-constellation-preview.ts",
  "Validation: Run local manual ingress admission smoke.",
  "Report: Record API validation in a local report.",
  "Tension: Manual pasted text can guide preview but must not become Formation authority.",
  "Next: Add a compact Observatory details summary in a later PR.",
  "Evidence: local-preview-smoke",
  "Detail: " + "bounded local admission ".repeat(32),
].join("\n");
const request = {
  input_kind: "manual:pasted_text",
  source_label: "Manual ingress admission smoke",
  input_text: safeInput,
};
const generatedAt = "2026-06-08T00:00:00.000Z";
const response = buildPerspectiveIngestLocalPreviewReadResponse({
  generatedAt,
  request,
});
assertSuccessfulManualIngressResponse(response, safeInput);

const result = buildPerspectiveIngestLocalPreviewReadResult({
  generatedAt,
  request,
});
assert.equal(result.ok, true);
assertSuccessfulManualIngressResponse(result.response, safeInput);

const missingInput = validatePerspectiveIngestLocalPreviewBody({
  input_kind: "manual:pasted_text",
  input_text: "   ",
});
assert.equal(missingInput.ok, false);
assert.equal(missingInput.code, "missing_input_text");
const missingInputError = buildPerspectiveIngestLocalPreviewError({
  code: missingInput.code,
  status: missingInput.status,
  summary: missingInput.summary,
  authorityBoundary: missingInput.authority_boundary,
});
assert.equal(JSON.stringify(missingInputError).includes("   "), false);

const rejectedSecret = "Intent: reject this credential marker OPENAI_API_KEY";
const secretInput = validatePerspectiveIngestLocalPreviewBody({
  input_kind: "manual:pasted_text",
  input_text: rejectedSecret,
});
assert.equal(secretInput.ok, false);
assert.equal(secretInput.code, "secret_like_input");
const secretError = buildPerspectiveIngestLocalPreviewError({
  code: secretInput.code,
  status: secretInput.status,
  summary: secretInput.summary,
  authorityBoundary: secretInput.authority_boundary,
});
assert.equal(JSON.stringify(secretError).includes(rejectedSecret), false);

assert.equal(
  /\brulecraft\b/i.test(cockpitText),
  false,
  "Rulecraft must remain unexposed in product-facing Cockpit UI",
);
assertChangedFileBoundary();
assertNoForbiddenRuntimePlumbing();

console.log("PASS smoke:perspective-local-manual-ingress-admission-preview");

function assertSuccessfulManualIngressResponse(response, rawInput) {
  assert.equal(response.response_version, "perspective_ingest_constellation_preview.v0.1");
  assert.equal(response.boundary_class, "read_only_local_ingest_constellation_preview");
  assert.equal(response.meta.source_query, "manual:pasted_text");
  assert.equal(response.meta.route_id, "augnes.read.perspective-ingest-local-preview.v0.1");
  assert.equal(response.meta.local_only, true);
  assert.equal(response.meta.read_only, true);
  assert.equal(response.meta.external_calls, false);
  assert.equal(response.meta.persistence, false);
  assert.equal(response.meta.graph_db, false);
  assert.equal(response.meta.proof_evidence_readiness_writes, false);
  assert.equal(response.meta.codex_execution, false);
  assert.equal(response.source_kind, "manual_pasted_text");
  assert(response.constellation.nodes.length > 0, "manual preview must still build constellation nodes");
  assert(response.constellation.edges.length > 0, "manual preview must still build constellation edges");
  assert(
    response.constellation.nodes.some((node) => node.type === "work_context"),
    "manual preview should still form work_context nodes",
  );
  assert(
    response.constellation.nodes.some((node) => node.type === "validation_report"),
    "manual preview should still form validation_report nodes",
  );
  assert(response.ingress_admission, "manual preview must include ingress_admission");
  assert.equal(
    response.ingress_admission.admission_version,
    "perspective_ingress_admission_preview.v0.1",
  );
  assert.equal(response.ingress_admission.candidate.projection_version, "perspective_ingress_candidate_projection.v0.1");
  assert.equal(response.ingress_admission.candidate.ingress_kind, "manual_pasted_text");
  assert.equal(response.ingress_admission.candidate.trust_level, "user_provided_local");
  assert.equal(response.ingress_admission.candidate.admission_state, "episode_candidate");
  assert.equal(response.ingress_admission.candidate.redaction_state, "not_applicable");
  assert(response.ingress_admission.candidate.bounded_summary.length > 0);
  assert(response.ingress_admission.candidate.pointer_refs.length > 0);
  assert.equal(response.ingress_admission.readiness.eligible_for_preview, true);
  assert.equal(response.ingress_admission.readiness.eligible_for_episode_candidate, true);
  assert.equal(response.ingress_admission.readiness.eligible_for_research_archive, false);
  assert.equal(response.ingress_admission.decision.to_state, "accepted_for_preview");
  assert.equal(response.ingress_admission.decision.allowed, true);
  assert.equal(
    response.ingress_admission.decision.reason,
    "manual pasted text passed local bounded preview readiness",
  );
  assert.deepEqual(response.ingress_admission.candidate.authority_boundary, {
    local_only: true,
    read_only: true,
    external_calls_performed: false,
    persistence_performed: false,
    graph_db_write_performed: false,
    proof_evidence_readiness_write_performed: false,
    codex_execution_performed: false,
    github_mutation_performed: false,
    oauth_token_stored: false,
    raw_private_content_stored: false,
  });
  assertNoForbiddenPayload("ingress admission metadata", response.ingress_admission);
  assert.equal(
    JSON.stringify(response.ingress_admission).includes(rawInput),
    false,
    "ingress_admission must not contain raw input_text verbatim",
  );
  assert.equal(
    JSON.stringify(response.ingress_admission).includes("input_text"),
    false,
    "ingress_admission must not include an input_text field",
  );
}

function assertChangedFileBoundary() {
  for (const changedFile of collectChangedFiles()) {
    assert(
      allowedChangedFiles.has(changedFile),
      `Local manual ingress admission preview changed an out-of-scope file: ${changedFile}`,
    );
    if (changedFile.startsWith("app/api/")) {
      assert.equal(
        changedFile,
        routeFile,
        `No app/api route addition is allowed; only existing local preview route may change: ${changedFile}`,
      );
    }
    assert(
      !changedFile.startsWith("db/") &&
        !changedFile.startsWith("migrations/") &&
        !changedFile.includes("persistence") &&
        !changedFile.includes("provider") &&
        !changedFile.includes("github") &&
        !changedFile.includes("codex-execution") &&
        !changedFile.includes("oauth"),
      `Local manual ingress admission preview must not change forbidden surfaces: ${changedFile}`,
    );
  }
}

function assertNoForbiddenRuntimePlumbing() {
  for (const [file, text] of [
    [typeFile, typeText],
    [helperFile, helperText],
    [routeFile, routeText],
    [docFile, docText],
  ]) {
    for (const forbidden of [
      "fetch(",
      "api.github.com",
      "api.openai.com",
      "process.env",
      "GITHUB_TOKEN",
      "OPENAI_API_KEY",
      "use server",
      "access_token",
      "refresh_token",
      "client_secret",
    ]) {
      assert.equal(
        text.includes(forbidden),
        false,
        `${file} must not add runtime/provider/GitHub/OpenAI/token plumbing: ${forbidden}`,
      );
    }
  }
}

function assertNoForbiddenPayload(label, value) {
  const serialized = JSON.stringify(value);
  for (const forbidden of [
    "raw_source_text",
    "raw_private_text",
    "packet textarea",
    "access_token",
    "refresh_token",
    "client_secret",
    "GITHUB_TOKEN",
    "OPENAI_API_KEY",
    "api.github.com",
    "api.openai.com",
    "Perspective Handoff Packet",
    "Graph nodes:",
    "Graph edges:",
    "Boundary reminders:",
  ]) {
    assert.equal(
      serialized.includes(forbidden),
      false,
      `${label} must not include forbidden payload token: ${forbidden}`,
    );
  }
}

function assertContainsAll(text, snippets) {
  const normalized = normalize(text);
  for (const snippet of snippets) {
    assert(
      normalized.includes(normalize(snippet)),
      `Expected source to contain: ${snippet}`,
    );
  }
}

function normalize(text) {
  return text.replace(/\s+/g, " ").trim();
}

function collectChangedFiles() {
  const workingTreeFiles = gitLines(["diff", "--name-only", "HEAD"]);
  const branchFiles = gitLines(["diff", "--name-only", "origin/main...HEAD"]);
  const untrackedFiles = gitLines(["ls-files", "--others", "--exclude-standard"]);
  return Array.from(
    new Set([...workingTreeFiles, ...branchFiles, ...untrackedFiles]),
  ).filter(Boolean);
}

function gitLines(args) {
  try {
    return execFileSync("git", args, { encoding: "utf8" })
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}
