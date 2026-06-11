import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const packageFile = "package.json";
const designDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_LOCAL_CODEX_INTEGRATION_ADAPTER_DESIGN_V0_1.md";
const reportFile =
  "reports/2026-06-11-perspective-codex-former-local-codex-integration-adapter-design.md";
const smokeFile =
  "scripts/smoke-perspective-codex-former-local-codex-integration-adapter-design.mjs";
const manualWorkflowDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_MANUAL_WORKFLOW_V0_1.md";
const sourceInputTemplateDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_CAPTURE_SOURCE_INPUT_TEMPLATE_V0_1.md";
const workflowCloseoutDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_WORKFLOW_CLOSEOUT_V0_1.md";
const sessionPanelImplementationDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_SESSION_PERSPECTIVE_PANEL_FIXTURE_SURFACE_IMPLEMENTATION_V0_1.md";
const captureReviewInboxImplementationDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_CAPTURE_REVIEW_INBOX_FIXTURE_SURFACE_IMPLEMENTATION_V0_1.md";
const constellationImplementationDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_CONSTELLATION_PREVIEW_FIXTURE_SURFACE_IMPLEMENTATION_V0_1.md";
const expectedTsxCommand =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json";

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const docText = readFileSync(designDocFile, "utf8");
const reportText = readFileSync(reportFile, "utf8");
const smokeText = readFileSync(smokeFile, "utf8");

assertPackageScript();
assertFilesExist();
assertDesignDocContent();
assertReportContent();
assertNoRawUnsafeMarkersInPublicArtifacts();
assertNoForbiddenImplementationSurfaces();
assertChangedFileBoundary();

console.log(
  "PASS smoke:perspective-codex-former-local-codex-integration-adapter-design",
);

function assertPackageScript() {
  assert.equal(
    packageJson.scripts[
      "smoke:perspective-codex-former-local-codex-integration-adapter-design"
    ],
    `${expectedTsxCommand} ${smokeFile}`,
    "package.json must register local Codex integration adapter design smoke",
  );
}

function assertFilesExist() {
  for (const file of [
    designDocFile,
    reportFile,
    smokeFile,
    manualWorkflowDocFile,
    sourceInputTemplateDocFile,
    workflowCloseoutDocFile,
    sessionPanelImplementationDocFile,
    captureReviewInboxImplementationDocFile,
    constellationImplementationDocFile,
  ]) {
    assert.equal(existsSync(file), true, `${file} must exist`);
  }
}

function assertDesignDocContent() {
  assertIncludesAll(docText, [
    "local Codex integration adapter",
    "Why Follows PR #507",
    manualWorkflowDocFile,
    sourceInputTemplateDocFile,
    workflowCloseoutDocFile,
    sessionPanelImplementationDocFile,
    captureReviewInboxImplementationDocFile,
    constellationImplementationDocFile,
    "Relationship To Existing Workflow And Surfaces",
    "The existing capture helper remains the source of prepare/validate behavior",
    "The source input template remains the operator-facing input contract",
    "Session Panel displays per-work/session adapter status",
    "Capture Review Inbox displays multiple adapter/capture review items",
    "Constellation Preview displays graph relationships after successful validation/projection",
    "Stage A. Local Work Context Collection",
    "Stage B. Source Input Assembly",
    "Stage C. Prepare Helper Handoff",
    "Stage D. Manual Codex Return",
    "Stage E. Validate Helper Handoff",
    "Stage F. Surface Projection",
    "Allowed Input Sources",
    "Disallowed Input Sources",
    "Adapter Modes",
    "Manifest-to-source-input mode",
    "Source-input preflight mode",
    "Prepare orchestration mode",
    "Validate orchestration mode",
    "Surface export mode",
    "Adapter Manifest Shape",
    "Output Contracts",
    "State Mapping To Product Surfaces",
    "Not prepared",
    "Waiting",
    "PASS with follow-up",
    "BLOCKED",
    "Invalid data",
    "Authority And Safety Boundaries",
    "Privacy/Redaction",
    "Error And Caveat Handling",
    "Browser/Computer-Use Validation Plan",
    "This PR is design-only",
    "no adapter implementation",
    "no CLI behavior",
    "no UI implementation",
    "no route",
    "no runtime browser surface",
    "no provider/model call",
    "no Codex SDK call",
    "no GitHub API call",
    "no DB write",
    "no persistence",
    "no clipboard automation",
    "no accepted Augnes state",
    "no proof/evidence/readiness creation",
    "no review decision records",
    "no accept/promote/reject actions",
    "no approval/merge/deploy/Core decision",
    "no live Codex capture",
    "no runtime fixture mutation",
    "no hidden reasoning",
    "Add local Codex adapter manifest-to-source-input implementation",
    "Conclusion",
    "PASS with follow-up",
  ]);

  assertIncludesAll(docText, [
    "operator-provided source input JSON",
    "bounded adapter manifest JSON",
    "local git metadata summaries",
    "test/check command, status, and bounded result summary",
    "prior helper metadata JSON",
    "returned envelope file path",
    "validation summary JSON",
    "existing committed fixture JSON for fixture mode only",
    "raw diffs",
    "raw logs",
    "raw terminal dumps",
    "raw transcripts",
    "provider/model logs",
    "tokens",
    "cookies",
    "credentials",
    "network calls in this design",
  ]);

  for (const field of [
    "adapter_manifest_version",
    "adapter_source_kind",
    "generated_at",
    "scope",
    "work_id",
    "work_session_label",
    "codex_surface_label",
    "source_pr_refs",
    "changed_files",
    "changed_files_summary",
    "tests_checks_run",
    "skipped_checks",
    "unresolved_gaps",
    "readiness",
    "operator_notes_bounded",
    "existing_helper_metadata_path",
    "returned_envelope_path",
    "validation_summary_path",
  ]) {
    assert(docText.includes(field), `manifest shape must include ${field}`);
  }

  assertIncludesAll(docText, [
    "source input JSON",
    "adapter metadata JSON",
    "prepare summary JSON",
    "validate summary JSON",
    "session panel snapshot JSON",
    "capture review inbox item JSON",
    "constellation preview handoff reference",
  ]);
}

function assertReportContent() {
  assertIncludesAll(reportText, [
    "Summary",
    "Why Follows PR #507",
    "Design Scope",
    "Relationship to Existing Workflow and Surfaces",
    "Local Adapter Stages",
    "Allowed and Disallowed Inputs",
    "Adapter Modes",
    "Manifest Shape",
    "Output Contracts",
    "State Mapping to Surfaces",
    "Error and Caveat Handling",
    "Privacy/Redaction Handling",
    "Authority Boundary",
    "Browser/Computer-Use Validation Plan",
    "Verification",
    "Skipped Checks With Reasons",
    "Recommended Next PR",
    "What Codex Did Not Do",
    "Browser/computer-use validation skipped: no UI, route, browser-visible surface, clipboard automation, or browser/computer-use capture was added.",
  ]);
}

function assertNoRawUnsafeMarkersInPublicArtifacts() {
  const publicText = `${docText}\n${reportText}`;
  for (const marker of [
    "hidden" + "_reasoning",
    "raw_page" + "_dump",
    "raw_pr" + "_diff",
    "raw_review" + "_payload",
    "access" + "_token",
    "refresh" + "_token",
    "api" + "_key",
    "oauth" + "_token",
    "sk-proj" + "-",
    "ghp" + "_",
  ]) {
    assert.equal(
      publicText.includes(marker),
      false,
      `local adapter public docs/report must not echo raw unsafe marker ${marker}`,
    );
  }
}

function assertNoForbiddenImplementationSurfaces() {
  for (const phrase of [
    "no accepted Augnes state",
    "no proof/evidence/readiness creation",
    "no review decision records",
    "no accept/promote/reject actions",
    "no provider/model call",
    "no Codex SDK call",
    "no GitHub API call",
    "no DB write",
    "no clipboard automation",
    "no approval/merge/deploy/Core decision",
    "no live Codex capture",
    "no persistence",
    "no runtime fixture mutation",
    "no hidden reasoning",
  ]) {
    assert(
      docText.includes(phrase),
      `design boundary text must include: ${phrase}`,
    );
  }

  const changedText = `${docText}\n${reportText}`;
  for (const snippet of [
    "await" + " fetch(",
    "globalThis" + ".fetch(",
    "node:" + "http",
    "node:" + "https",
    "XML" + "HttpRequest",
    "responses" + ".create",
    "openai" + ".chat",
    "navigator" + ".clipboard",
    "commit" + "StateUpdate(",
    "record" + "Proof(",
    "create" + "Evidence(",
    "better" + "-sql" + "ite3",
    "createClient" + "(",
    "graphql" + "(",
    "app" + "/api/",
    "components" + "/",
  ]) {
    assert.equal(
      changedText.includes(snippet),
      false,
      `local adapter design must not introduce forbidden implementation surface ${snippet}`,
    );
  }
}

function assertChangedFileBoundary() {
  const allowedChangedFiles = new Set([
    packageFile,
    designDocFile,
    reportFile,
    smokeFile,
  ]);

  for (const changedFile of collectChangedFiles()) {
    assert(
      allowedChangedFiles.has(changedFile),
      `local Codex integration adapter design changed an out-of-scope file: ${changedFile}`,
    );
    assert(
      changedFile === packageFile ||
        changedFile.startsWith("docs/") ||
        changedFile.startsWith("reports/") ||
        changedFile.startsWith("scripts/smoke-"),
      `local adapter design must stay docs/report/smoke/package only: ${changedFile}`,
    );
    assert(
      !changedFile.startsWith("app/") &&
        !changedFile.startsWith("components/") &&
        !changedFile.startsWith("lib/") &&
        !changedFile.startsWith("db/") &&
        !changedFile.startsWith("migrations/") &&
        !changedFile.startsWith("apps/augnes_apps/"),
      `local adapter design must not touch runtime, UI, DB, app, component, lib, or schema surfaces: ${changedFile}`,
    );
  }
}

function collectChangedFiles() {
  return [
    ...new Set([
      ...gitLines(["diff", "--name-only", "--diff-filter=ACMR", "HEAD"]),
      ...gitLines(["diff", "--cached", "--name-only", "--diff-filter=ACMR"]),
      ...gitLines(["diff", "--name-only", "--diff-filter=ACMR", "origin/main...HEAD"]),
      ...gitLines(["ls-files", "--others", "--exclude-standard"]),
    ]),
  ].sort();
}

function gitLines(args) {
  return execFileSync("git", args, { encoding: "utf8" })
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function assertIncludesAll(text, requiredPhrases) {
  const normalizedText = normalizeText(text);
  for (const phrase of requiredPhrases) {
    assert(
      normalizedText.includes(normalizeText(phrase)),
      `expected text to include: ${phrase}`,
    );
  }
}

function normalizeText(text) {
  return text.replace(/\s+/g, " ").trim();
}
