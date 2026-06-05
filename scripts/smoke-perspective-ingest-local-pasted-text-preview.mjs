import assert from "node:assert/strict";
import {
  assertContainsAll,
  assertPackageScript,
  loadTextByFile,
} from "./smoke-boundary-common.mjs";

const typeFile = "types/perspective-ingest-constellation-preview.ts";
const localPreviewPostGuardFile =
  "lib/readonly-api/local-preview-post-guard.ts";
const validationHelperFile =
  "lib/perspective-ingest/manual-pasted-text-validation.ts";
const adapterFile = "lib/perspective-ingest/manual-pasted-text-adapter.ts";
const packetBuilderFile =
  "lib/perspective-ingest/episode-to-constellation-packet.ts";
const routeHelperFile =
  "lib/readonly-api/perspective-ingest-local-preview.ts";
const routeFile =
  "app/api/augnes/read/perspective-ingest-local-preview/route.ts";
const cockpitFile = "components/augnes-cockpit.tsx";
const cssFile = "app/globals.css";
const boundaryDoc =
  "docs/PERSPECTIVE_INGEST_LOCAL_PASTED_TEXT_PREVIEW_V0_1.md";
const fixturePreviewDoc =
  "docs/PERSPECTIVE_INGEST_CONSTELLATION_PREVIEW_V0_1.md";
const indexDoc = "docs/00_INDEX_LATEST.md";
const dogfoodReport =
  "reports/browser/2026-06-05-perspective-ingest-local-pasted-text-dogfood.md";
const packageJsonFile = "package.json";
const smokeFile =
  "scripts/smoke-perspective-ingest-local-pasted-text-preview.mjs";

const inspectedFiles = [
  typeFile,
  localPreviewPostGuardFile,
  validationHelperFile,
  adapterFile,
  packetBuilderFile,
  routeHelperFile,
  routeFile,
  cockpitFile,
  cssFile,
  boundaryDoc,
  fixturePreviewDoc,
  indexDoc,
  dogfoodReport,
  packageJsonFile,
  smokeFile,
];

const textByFile = loadTextByFile(inspectedFiles);

assertPackageJsonScript();
assertRouteShape();
assertGuardShape();
assertRequestAndValidationShape();
assertAdapterAndPacketShape();
assertCockpitSurface();
assertCssHooks();
assertBoundaryDocs();
assertNoExternalCallPatterns();

console.log("perspective ingest local pasted text preview smoke passed");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText: textByFile.get(packageJsonFile),
    scriptName: "smoke:perspective-ingest-local-pasted-text-preview",
    expectedCommand:
      "node scripts/smoke-perspective-ingest-local-pasted-text-preview.mjs",
  });
}

function assertRouteShape() {
  const routeText = textByFile.get(routeFile);

  assertContainsAll(routeFile, [
    "export const runtime = \"nodejs\"",
    "export const dynamic = \"force-dynamic\"",
    "export async function POST",
    "validatePerspectiveIngestLocalPreviewAccess",
    "validatePerspectiveIngestLocalPreviewBody",
    "buildPerspectiveIngestLocalPreviewReadResponse",
    "buildPerspectiveIngestLocalPreviewError",
    "invalid_json",
  ], { textByFile });
  assert(!/\bexport\s+(async\s+)?function\s+GET\b/.test(routeText), `${routeFile} must not export GET`);
  assertContainsAll(routeHelperFile, [
    "perspective-ingest-local-preview-v0.1",
    "manual:pasted_text",
    "validateLocalPreviewPostAccess",
    "buildManualPastedTextSessionEpisode",
    "buildPerspectiveIngestConstellationPreviewResponse",
    "augnes.read.perspective-ingest-local-preview.v0.1",
  ], { textByFile });
}

function assertGuardShape() {
  assertContainsAll(localPreviewPostGuardFile, [
    "validateLocalPreviewPostAccess",
    "method.toUpperCase() !== \"POST\"",
    "required_scope",
    "required_marker_header",
    "required_marker_value",
    "request.headers.get(\"host\")",
    "request.headers.get(\"x-forwarded-host\")",
    "disallowed_forwarded_host",
    "missing_host_header",
    "method_not_allowed",
  ], { textByFile });
}

function assertRequestAndValidationShape() {
  assertContainsAll(typeFile, [
    "manual_pasted_text",
    "manual:pasted_text",
    "export interface PerspectiveIngestLocalPastedTextPreviewRequest",
    "export interface PerspectiveIngestLocalPreviewErrorBody",
    "source_query: PerspectiveIngestSourceQuery",
  ], { textByFile });
  assertContainsAll(validationHelperFile, [
    "PERSPECTIVE_INGEST_LOCAL_PREVIEW_INPUT_KIND",
    "manual:pasted_text",
    "PERSPECTIVE_INGEST_LOCAL_PREVIEW_INPUT_TEXT_MAX_LENGTH = 12000",
    "PERSPECTIVE_INGEST_LOCAL_PREVIEW_SOURCE_LABEL_MAX_LENGTH = 120",
    "missing_input_text",
    "input_text_too_large",
    "secret_like_input",
    "OPENAI_API_KEY",
    "sk-[A-Za-z0-9_-]{8,}",
    "ghp_",
    "github_pat_",
    "BEGIN PRIVATE KEY",
    "authorization:\\s*bearer",
    "bearer\\s+[A-Za-z0-9._-]{16,}",
    "AWS_ACCESS_KEY_ID",
    "SECRET_ACCESS_KEY",
    "password=",
    "api_key=",
    "access_token=",
  ], { textByFile });
  const validationText = textByFile.get(validationHelperFile);
  assert(!/\/sk-\/i/.test(validationText), `${validationHelperFile} must not use broad /sk-/ secret matching`);
  assert(!/\/bearer\\s\+token\/i/.test(validationText), `${validationHelperFile} must not reject bearer tokenization docs text`);
}

function assertAdapterAndPacketShape() {
  assertContainsAll(adapterFile, [
    "buildManualPastedTextSessionEpisode",
    "PerspectiveIngestSessionEpisode",
    "source_kind: \"manual_pasted_text\"",
    "source_ref: MANUAL_PASTED_TEXT_SOURCE_REF",
    "local-user-provided:manual-pasted-text",
    "MAX_SUMMARY_LENGTH = 300",
    "PREFIX_ALIASES",
    "goal: \"user_intents\"",
    "idea: \"product_concepts\"",
    "choice: \"decisions\"",
    "risk: \"unresolved_tensions\"",
    "todo: \"next_actions\"",
    "source: \"evidence_refs\"",
    "\"의도\": \"user_intents\"",
    "\"개념\": \"product_concepts\"",
    "\"결정\": \"decisions\"",
    "\"작업\": \"work_units\"",
    "\"변경\": \"changed_files\"",
    "\"검증\": \"validations\"",
    "\"근거\": \"evidence_refs\"",
    "\"긴장\": \"unresolved_tensions\"",
    "\"다음\": \"next_actions\"",
    "\"보고\": \"final_report_points\"",
    "not raw private history",
    "no external call",
    "no Codex execution authority",
  ], { textByFile });
  assertContainsAll(packetBuilderFile, [
    "manual_pasted_text",
    "manual:pasted_text",
    "buildManualPastedTextConstellation",
    "Manual pasted text source",
    "Work context",
    "Validation/report",
    "work_context",
    "validation_report",
    "User-supplied validation context (not rerun by this packet):",
    "User-supplied report context (review context, not proof):",
    "derived_from",
    "refines",
    "supports",
    "conflicts_with",
    "warns_against",
    "next_candidate",
    "evidence_for",
    "depends_on",
    "preview packet only; it is not an instruction to execute unless a user manually gives it to Codex",
    "expectedChangedFiles",
  ], { textByFile });
}

function assertCockpitSurface() {
  assertContainsAll(cockpitFile, [
    "PERSPECTIVE_INGEST_LOCAL_PREVIEW_REQUEST_PATH",
    "PERSPECTIVE_INGEST_LOCAL_PREVIEW_HEADERS",
    "manual:pasted_text",
    "SAFE_PASTED_TEXT_EXAMPLE",
    "Manual pasted text preview",
    "Preview pasted text",
    "Load safe pasted text example",
    "Clear pasted text",
    "fetchPerspectiveIngestLocalPastedTextPreview",
    "failed preview",
    "unavailable",
    "formatPerspectiveIngestGraphNodeLabel",
    "formatPerspectiveIngestGraphEdgeLabel",
    "selected sample source",
    "loaded source query",
    "Copy ChatGPT review packet",
    "Copy Codex handoff packet",
    "Currently selected packet text",
  ], { textByFile });
}

function assertCssHooks() {
  assertContainsAll(cssFile, [
    "ingest-local-preview-form",
    "ingest-local-preview-grid",
    "ingest-local-preview-actions",
    "ingest-local-preview-error",
    "ingest-local-preview-textarea",
  ], { textByFile });
}

function assertBoundaryDocs() {
  assertContainsAll(boundaryDoc, [
    "manual pasted text",
    "Why pasted text comes before export zip parsing",
    "POST-only local preview guard",
    "deterministic pasted-text parser",
    "bounded 300-character summary",
    "does not preserve the full raw input",
    "rejects obvious secret-like input",
    "English aliases",
    "Korean aliases",
    "Work / Changed / Validation / Report",
    "credential-shaped",
    "Cockpit reuses the existing Perspective Ingest Constellation display path",
    "no raw private history persistence",
    "no automatic ChatGPT account scraping",
    "no OAuth",
    "no export zip parser",
    "no real Codex thread import",
    "no file upload",
    "no external calls",
    "no OpenAI calls",
    "no GitHub calls",
    "no DB writes",
    "no graph DB",
    "no proof/evidence/readiness writes",
    "no Codex execution",
    "no approval/merge/publish/deploy authority",
    "local file import or a ChatGPT export parser stub only after pasted text preview is stable",
  ], { textByFile });
  assertContainsAll(fixturePreviewDoc, [
    "Manual pasted-text follow-up path",
    "docs/PERSPECTIVE_INGEST_LOCAL_PASTED_TEXT_PREVIEW_V0_1.md",
    "POST /api/augnes/read/perspective-ingest-local-preview?scope=project:augnes",
  ], { textByFile });
  assertContainsAll(indexDoc, [
    "PERSPECTIVE_INGEST_LOCAL_PASTED_TEXT_PREVIEW_V0_1.md",
    "reports/browser/2026-06-05-perspective-ingest-local-pasted-text-dogfood.md",
    "smoke:perspective-ingest-local-pasted-text-preview",
  ], { textByFile });
  assertContainsAll(dogfoodReport, [
    "Perspective Ingest Local Pasted Text Dogfood",
    "False-Positive Secret Rejection Findings",
    "True Secret Rejection Findings",
    "Prefix Vocabulary Findings",
    "Graph UX Findings",
    "Packet Usefulness Findings",
    "Next Suggested Goal",
  ], { textByFile });
}

function assertNoExternalCallPatterns() {
  const files = [
    routeFile,
    routeHelperFile,
    localPreviewPostGuardFile,
    adapterFile,
  ];
  const forbiddenPatterns = [
    { pattern: /\bfetch\s*\(/, label: "fetch(" },
    { pattern: /\bOpenAI\b/, label: "OpenAI" },
    { pattern: /github\.com/i, label: "github.com" },
    { pattern: /api\.github/i, label: "api.github" },
    { pattern: /\bdb\.(insert|update|delete)\b/i, label: "DB write helper" },
    { pattern: /\bwriteFile(Sync)?\b/, label: "filesystem write" },
    { pattern: /\bappendFile(Sync)?\b/, label: "filesystem append" },
  ];

  for (const file of files) {
    const text = textByFile.get(file);
    for (const { pattern, label } of forbiddenPatterns) {
      assert(!pattern.test(text), `${file} must not contain ${label}`);
    }
  }
}
