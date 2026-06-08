import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const packageFile = "package.json";
const typeFile = "types/perspective-ingress-admission.ts";
const modelFile =
  "lib/perspective-ingest/perspective-ingress-admission-model.ts";
const docFile = "docs/PERSPECTIVE_INGRESS_ADMISSION_MODEL_V0_1.md";
const smokeFile = "scripts/smoke-perspective-ingress-admission-model.mjs";
const reportFile = "reports/2026-06-07-perspective-ingress-admission-model.md";
const cockpitFile = "components/augnes-cockpit.tsx";
const agentBriefTypeFile = "types/perspective-agent-brief.ts";
const agentBriefHelperFile = "lib/readonly-api/perspective-agent-brief.ts";
const agentBriefRouteFile =
  "app/api/augnes/read/perspective-agent-brief/route.ts";
const agentBriefDocFile =
  "docs/PERSPECTIVE_AGENT_BRIEF_READ_SURFACE_V0_1.md";
const agentBriefSmokeFile =
  "scripts/smoke-perspective-agent-brief-read-surface.mjs";
const workbenchSmokeFile =
  "scripts/smoke-cockpit-perspective-workbench-temporal-underlay.mjs";

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const typeText = readFileSync(typeFile, "utf8");
const modelText = readFileSync(modelFile, "utf8");
const docText = readFileSync(docFile, "utf8");
const cockpitText = readFileSync(cockpitFile, "utf8");

const {
  PERSPECTIVE_INGRESS_ADMISSION_MODEL_VERSION,
  PERSPECTIVE_INGRESS_ALLOWED_ADMISSION_TRANSITIONS,
  PERSPECTIVE_INGRESS_DEFAULT_AUTHORITY_BOUNDARY,
  PERSPECTIVE_INGRESS_KIND_ARTIFACT_CLASSES,
  PERSPECTIVE_INGRESS_KIND_TRUST_LEVELS,
  assertPerspectiveIngressCandidateHasNoRawAuthority,
  buildPerspectiveIngressAdmissionDecision,
  buildPerspectiveIngressCandidateId,
  buildPerspectiveIngressSourceArtifactCandidate,
  buildPerspectiveIngressSourceProvider,
  canPerspectiveIngressTransition,
  getPerspectiveIngressAllowedNextStates,
  getPerspectiveIngressFormationReadiness,
  summarizePerspectiveIngressCandidateForFormation,
} = await import("../lib/perspective-ingest/perspective-ingress-admission-model.ts");

const ingressKinds = [
  "fixture",
  "manual_pasted_text",
  "chatgpt_export",
  "codex_session_log",
  "oauth_document",
  "oauth_calendar",
  "oauth_email",
  "browser_capture",
  "agent_submitted_artifact",
  "external_pointer",
];
const trustLevels = [
  "fixture_public_safe",
  "user_provided_local",
  "oauth_user_authorized",
  "agent_submitted_untrusted",
  "external_pointer_only",
];
const admissionStates = [
  "raw_quarantined",
  "redacted_candidate",
  "episode_candidate",
  "accepted_for_preview",
  "accepted_for_research_archive",
  "rejected",
  "superseded",
];
const artifactClasses = [
  "conversation_export",
  "implementation_log",
  "document",
  "calendar_event",
  "email_thread",
  "browser_page",
  "manual_note",
  "agent_report",
  "pointer_only",
];
const redactionStates = [
  "not_applicable",
  "pending",
  "redacted",
  "blocked_sensitive",
  "failed",
];

const allowedChangedFiles = new Set([
  typeFile,
  modelFile,
  docFile,
  smokeFile,
  reportFile,
  packageFile,
  "scripts/smoke-perspective-agent-brief-read-surface.mjs",
  "scripts/smoke-perspective-temporal-spatial-projection-builders.mjs",
  "scripts/smoke-cockpit-perspective-workbench-temporal-underlay.mjs",
  "scripts/smoke-perspective-capsule-contract.mjs",
]);

assert.equal(
  packageJson.scripts["smoke:perspective-ingress-admission-model"],
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-perspective-ingress-admission-model.mjs",
  "package.json must register smoke:perspective-ingress-admission-model",
);

for (const file of [typeFile, modelFile, docFile, smokeFile]) {
  assert.equal(existsSync(file), true, `${file} must exist`);
}

assertContainsAll(typeText, [
  "PerspectiveIngressKindV0",
  "PerspectiveIngressTrustLevelV0",
  "PerspectiveIngressAdmissionStateV0",
  "PerspectiveIngressArtifactClassV0",
  "PerspectiveIngressRedactionStateV0",
  "PerspectiveIngressAuthorityBoundaryV0",
  "PerspectiveIngressSourceProviderV0",
  "PerspectiveIngressSourceArtifactCandidateV0",
  "PerspectiveIngressAdmissionDecisionV0",
  "PerspectiveIngressFormationReadinessV0",
  "PerspectiveIngressCandidateProjectionV0",
  "PerspectiveIngressAdmissionModelV0",
  "PerspectiveIngressAdmissionErrorV0",
  ...ingressKinds,
  ...trustLevels,
  ...admissionStates,
  ...artifactClasses,
  ...redactionStates,
  "raw_private_content_stored",
  "oauth_token_stored",
]);

assertContainsAll(docText, [
  "# Perspective Ingress Admission Model v0.1",
  "Purpose and Scope",
  "Why This Follows the Agent Brief Read Surface",
  "External ingress providers",
  "Agent consumption surfaces",
  "Augnes Formation surface",
  "Ingress is not Formation",
  "Agent consumption is not Ingress",
  "Augnes Formation is the authority boundary",
  "Augnes internal formation remains responsible for constellation construction, Event Rail structure, temporal placement, research perspective, and projection generation",
  "Ingress Kinds",
  "Trust Levels",
  "Admission States",
  "Redaction States",
  "Artifact Classes",
  "Admission Transitions",
  "Candidate Shape Summary",
  "Authority Boundary",
  "OAuth sources are future ingress providers",
  "This PR does not implement OAuth",
  "OAuth tokens must not be stored in candidates",
  "OAuth raw content must not be stored by this model",
  "Agent artifacts are untrusted by default",
  "Codex and ChatGPT outputs must re-enter Augnes through admission",
  "The existing Perspective Agent Brief is consumption/read-only",
  "The Human Workbench remains unchanged",
  "API routes",
  "provider/model/API calls",
  "DB schema or migrations",
  "Prototype local manual ingress admission preview",
]);

assert.equal(
  PERSPECTIVE_INGRESS_ADMISSION_MODEL_VERSION,
  "perspective_ingress_admission_model.v0.1",
);
assertContainsAll(modelText, [
  "PERSPECTIVE_INGRESS_ADMISSION_MODEL_VERSION",
  "PERSPECTIVE_INGRESS_DEFAULT_AUTHORITY_BOUNDARY",
  "PERSPECTIVE_INGRESS_KIND_TRUST_LEVELS",
  "PERSPECTIVE_INGRESS_KIND_ARTIFACT_CLASSES",
  "PERSPECTIVE_INGRESS_ALLOWED_ADMISSION_TRANSITIONS",
  "buildPerspectiveIngressCandidateId",
  "buildPerspectiveIngressSourceProvider",
  "buildPerspectiveIngressSourceArtifactCandidate",
  "buildPerspectiveIngressAdmissionDecision",
  "getPerspectiveIngressAllowedNextStates",
  "canPerspectiveIngressTransition",
  "summarizePerspectiveIngressCandidateForFormation",
  "assertPerspectiveIngressCandidateHasNoRawAuthority",
  "getPerspectiveIngressFormationReadiness",
]);

assert.deepEqual(PERSPECTIVE_INGRESS_DEFAULT_AUTHORITY_BOUNDARY, {
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

assert.deepEqual(PERSPECTIVE_INGRESS_KIND_TRUST_LEVELS, {
  fixture: "fixture_public_safe",
  manual_pasted_text: "user_provided_local",
  chatgpt_export: "user_provided_local",
  codex_session_log: "user_provided_local",
  oauth_document: "oauth_user_authorized",
  oauth_calendar: "oauth_user_authorized",
  oauth_email: "oauth_user_authorized",
  browser_capture: "user_provided_local",
  agent_submitted_artifact: "agent_submitted_untrusted",
  external_pointer: "external_pointer_only",
});
assert.deepEqual(PERSPECTIVE_INGRESS_KIND_ARTIFACT_CLASSES, {
  fixture: "conversation_export",
  manual_pasted_text: "manual_note",
  chatgpt_export: "conversation_export",
  codex_session_log: "implementation_log",
  oauth_document: "document",
  oauth_calendar: "calendar_event",
  oauth_email: "email_thread",
  browser_capture: "browser_page",
  agent_submitted_artifact: "agent_report",
  external_pointer: "pointer_only",
});
assert.deepEqual(PERSPECTIVE_INGRESS_ALLOWED_ADMISSION_TRANSITIONS, {
  raw_quarantined: ["redacted_candidate", "rejected"],
  redacted_candidate: ["episode_candidate", "rejected"],
  episode_candidate: [
    "accepted_for_preview",
    "accepted_for_research_archive",
    "rejected",
  ],
  accepted_for_preview: ["accepted_for_research_archive", "superseded"],
  accepted_for_research_archive: ["superseded"],
  rejected: ["superseded"],
  superseded: [],
});
assert.deepEqual(getPerspectiveIngressAllowedNextStates("raw_quarantined"), [
  "redacted_candidate",
  "rejected",
]);
assert.equal(canPerspectiveIngressTransition("episode_candidate", "accepted_for_preview"), true);
assert.equal(canPerspectiveIngressTransition("raw_quarantined", "accepted_for_preview"), false);

const fixtureWithSummary = buildPerspectiveIngressSourceArtifactCandidate({
  ingress_kind: "fixture",
  source_label: "Fixture candidate",
  source_ref: "fixture:perspective",
  bounded_summary: "Public-safe fixture summary.",
});
assert.equal(fixtureWithSummary.eligible_for_preview, true);
assert.equal(fixtureWithSummary.eligible_for_episode_candidate, true);
assert.equal(fixtureWithSummary.eligible_for_research_archive, false);
assertPerspectiveIngressCandidateHasNoRawAuthority(fixtureWithSummary);

const manualWithSummary = buildPerspectiveIngressSourceArtifactCandidate({
  ingress_kind: "manual_pasted_text",
  source_label: "Manual local note",
  source_ref: "manual:local",
  bounded_summary: "Local bounded summary.",
});
assert.equal(manualWithSummary.eligible_for_preview, true);

const manualWithoutSummary = buildPerspectiveIngressSourceArtifactCandidate({
  ingress_kind: "manual_pasted_text",
  source_label: "Manual empty note",
  source_ref: "manual:empty",
});
assert.equal(manualWithoutSummary.eligible_for_preview, false);
assert(
  getPerspectiveIngressFormationReadiness(manualWithoutSummary).reasons.includes(
    "bounded summary required",
  ),
);

const oauthCandidate = buildPerspectiveIngressSourceArtifactCandidate({
  ingress_kind: "oauth_document",
  source_label: "OAuth document pointer",
  source_ref: "oauth:document:1",
  bounded_summary: "Redacted document candidate.",
  admission_state: "accepted_for_preview",
  redaction_state: "redacted",
  authority_boundary: {
    oauth_token_stored: true,
    raw_private_content_stored: true,
  },
});
assert.notEqual(oauthCandidate.admission_state, "accepted_for_preview");
assert(["raw_quarantined", "redacted_candidate"].includes(oauthCandidate.admission_state));
assert.equal(oauthCandidate.eligible_for_preview, false);
assert.equal(oauthCandidate.authority_boundary.oauth_token_stored, false);
assert.equal(oauthCandidate.authority_boundary.raw_private_content_stored, false);

const agentCandidate = buildPerspectiveIngressSourceArtifactCandidate({
  ingress_kind: "agent_submitted_artifact",
  source_label: "Agent report",
  source_ref: "agent:report:1",
  bounded_summary: "Agent-provided report candidate.",
  redaction_state: "redacted",
});
assert.equal(agentCandidate.trust_level, "agent_submitted_untrusted");
assert.equal(agentCandidate.eligible_for_preview, false);
assert.equal(agentCandidate.eligible_for_research_archive, false);

const externalPointer = buildPerspectiveIngressSourceArtifactCandidate({
  ingress_kind: "external_pointer",
  source_label: "External pointer",
  source_ref: "https://example.invalid/pointer",
  bounded_summary: "Pointer-only reference.",
  redaction_state: "redacted",
});
assert.equal(externalPointer.artifact_class, "pointer_only");
assert.equal(externalPointer.eligible_for_preview, false);

const unsafeCandidate = {
  ...fixtureWithSummary,
  authority_boundary: {
    ...fixtureWithSummary.authority_boundary,
    raw_private_content_stored: true,
  },
};
assert.equal(getPerspectiveIngressFormationReadiness(unsafeCandidate).eligible_for_preview, false);
assert.throws(
  () => assertPerspectiveIngressCandidateHasNoRawAuthority(unsafeCandidate),
  /raw_private_content_stored/,
);

const tokenCandidate = {
  ...fixtureWithSummary,
  authority_boundary: {
    ...fixtureWithSummary.authority_boundary,
    oauth_token_stored: true,
  },
};
assert.equal(getPerspectiveIngressFormationReadiness(tokenCandidate).eligible_for_preview, false);

const projection = summarizePerspectiveIngressCandidateForFormation(fixtureWithSummary);
assert.equal(
  projection.projection_version,
  "perspective_ingress_candidate_projection.v0.1",
);
assert.equal(projection.bounded_summary, "Public-safe fixture summary.");
assert.deepEqual(projection.pointer_refs, []);
assertNoForbiddenPayload("formation projection", projection);

const decision = buildPerspectiveIngressAdmissionDecision({
  candidate: fixtureWithSummary,
  to_state: "episode_candidate",
});
assert.equal(decision.allowed, true);
assert.equal(decision.from_state, "redacted_candidate");
assert.equal(decision.to_state, "episode_candidate");
assertNoForbiddenPayload("admission decision", decision);

assert.equal(
  buildPerspectiveIngressCandidateId({
    ingress_kind: "manual_pasted_text",
    source_ref: "Manual Note #1",
    created_at: "2026-06-08T00:00:00.000Z",
  }),
  "candidate.manual_pasted_text.manual_note_1.2026_06_08t00_00_00_000z",
);
assert.equal(
  buildPerspectiveIngressSourceProvider({ ingress_kind: "oauth_email" }).trust_level,
  "oauth_user_authorized",
);

for (const file of [
  agentBriefTypeFile,
  agentBriefHelperFile,
  agentBriefRouteFile,
  agentBriefDocFile,
  agentBriefSmokeFile,
  workbenchSmokeFile,
]) {
  assert.equal(existsSync(file), true, `${file} must remain present`);
}

assert.equal(
  /\brulecraft\b/i.test(cockpitText),
  false,
  "Rulecraft must remain unexposed in product-facing Cockpit UI",
);

for (const changedFile of collectChangedFiles()) {
  assert(
    allowedChangedFiles.has(changedFile),
    `Perspective ingress admission model changed an out-of-scope file: ${changedFile}`,
  );
  assert(
    !changedFile.startsWith("app/api/") &&
      !changedFile.startsWith("db/") &&
      !changedFile.startsWith("migrations/") &&
      !changedFile.includes("persistence") &&
      !changedFile.includes("provider") &&
      !changedFile.includes("github") &&
      !changedFile.includes("codex-execution"),
    `Perspective ingress admission model must not change forbidden surfaces: ${changedFile}`,
  );
}

for (const [file, text] of [
  [typeFile, typeText],
  [modelFile, modelText],
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

console.log("PASS smoke:perspective-ingress-admission-model");

function assertContainsAll(text, snippets) {
  const normalized = normalize(text);
  for (const snippet of snippets) {
    assert(
      normalized.includes(normalize(snippet)),
      `Expected source to contain: ${snippet}`,
    );
  }
}

function assertNoForbiddenPayload(label, value) {
  const serialized = JSON.stringify(value);
  for (const forbidden of [
    "raw_source_text",
    "raw_private_text",
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
  ]) {
    assert.equal(
      serialized.includes(forbidden),
      false,
      `${label} must not include forbidden payload token: ${forbidden}`,
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
