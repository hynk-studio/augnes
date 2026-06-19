import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const componentPath =
  "components/research-candidate-manual-note-preview-panel.tsx";
const cockpitPath = "components/augnes-cockpit.tsx";
const parserPath = "lib/research-candidate-review/manual-note-parser.ts";
const indexPath = "docs/00_INDEX_LATEST.md";
const packagePath = "package.json";
const smokePath =
  "scripts/smoke-research-candidate-manual-note-preview-ui-v0-1.mjs";

for (const filePath of [
  componentPath,
  cockpitPath,
  parserPath,
  indexPath,
  packagePath,
  smokePath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const component = readFileSync(componentPath, "utf8");
const cockpit = readFileSync(cockpitPath, "utf8");
const parser = readFileSync(parserPath, "utf8");
const index = readFileSync(indexPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

assertDedicatedComponent();
assertCockpitWiring();
assertParserReuse();
assertLocalOnlyParserExecution();
assertPreviewOutputRendering();
assertAuthorityBoundaryCopy();
assertForbiddenImplementationPatterns();
assertIndexPointer();
assertPackageScript();

console.log(
  JSON.stringify(
    {
      smoke: "research-candidate-manual-note-preview-ui-v0-1",
      dedicated_component_exists: true,
      cockpit_imports_and_renders_component: true,
      existing_manual_note_parser_reused: true,
      parser_execution_local_only: true,
      preview_output_rendering_checked: true,
      visible_authority_boundary_copy_checked: true,
      forbidden_implementation_patterns_absent: true,
      index_pointer_checked: true,
      package_script_checked: true,
    },
    null,
    2,
  ),
);

function assertDedicatedComponent() {
  assert.match(
    component,
    /export function ResearchCandidateManualNotePreviewPanel\(/,
    "dedicated manual note preview component must be exported",
  );
  assert.match(component, /"use client";/, "component must be a client component");
  assert.match(component, /<textarea\b/, "component must include textarea input");
  assert.match(component, /Parse local note/, "component must expose local parse trigger");
}

function assertCockpitWiring() {
  assert.match(
    cockpit,
    /import \{ ResearchCandidateManualNotePreviewPanel \} from "@\/components\/research-candidate-manual-note-preview-panel";/,
    "Cockpit must import the dedicated component",
  );
  assert.match(
    cockpit,
    /<ResearchCandidateManualNotePreviewPanel \/>/,
    "Cockpit must render the dedicated component",
  );
  assert.match(
    cockpit,
    /href="#research-candidate-manual-note-preview-panel"/,
    "Cockpit must link to the manual pasted note panel",
  );
  assert.match(
    cockpit,
    /Research Candidate Manual Note Preview Panel Start/,
    "Cockpit must keep a narrow render marker for the panel",
  );
}

function assertParserReuse() {
  assert.match(
    parser,
    /export function parseManualResearchNoteToPreview\(/,
    "existing parser must export parseManualResearchNoteToPreview",
  );
  assert.match(
    component,
    /parseManualResearchNoteToPreview/,
    "component must import/use parseManualResearchNoteToPreview",
  );
  assert.match(
    component,
    /from "@\/lib\/research-candidate-review\/manual-note-parser"/,
    "component must import from the existing manual-note-parser",
  );
}

function assertLocalOnlyParserExecution() {
  assert.match(
    component,
    /parseManualResearchNoteToPreview\(manualNoteText\)/,
    "component must execute the parser directly over local textarea state",
  );
  assert.match(
    component,
    /data-augnes-parser-execution="local-only"/,
    "component must declare local-only parser execution",
  );
  assert.match(
    component,
    /onSubmit=\{parseManualNote\}/,
    "parser execution must be triggered by local form submit",
  );
  assert.doesNotMatch(
    component,
    /\buseEffect\b/,
    "component must not create background parser side effects",
  );
}

function assertPreviewOutputRendering() {
  for (const requiredText of [
    "parser_version",
    "warnings",
    "research_session_preview",
    "source_reference_previews",
    "claim_candidates",
    "evidence_candidates",
    "tension_candidates",
    "knowledge_gap_candidates",
    "perspective_delta_candidates",
    "follow_up_work_candidates",
    "claim_candidate_count",
    "evidence_candidate_count",
    "tension_candidate_count",
    "knowledge_gap_candidate_count",
    "perspective_delta_candidate_count",
    "follow_up_work_candidate_count",
    "source_refs",
    "review_status",
    "epistemic_status",
    "promotion_readiness",
  ]) {
    assert.ok(component.includes(requiredText), `component must render ${requiredText}`);
  }
}

function assertAuthorityBoundaryCopy() {
  for (const requiredText of [
    "Parser execution is local only.",
    "Output is read-only preview material.",
    "No network, no API route, no DB, no persistence, no durable candidate/review/receipt storage.",
    "No promotion/reject/defer workflow.",
    "No proof/evidence writes.",
    "No work item creation.",
    "No provider/OpenAI calls.",
    "No retrieval/RAG/source fetching.",
    "No Codex execution or external handoff sending.",
  ]) {
    assert.ok(component.includes(requiredText), `boundary copy must include ${requiredText}`);
  }
}

function assertForbiddenImplementationPatterns() {
  const forbiddenPatterns = [
    { label: "fetch call", regex: /\bfetch\s*\(/ },
    { label: "fetchJson", regex: /\bfetchJson\b/ },
    { label: "XMLHttpRequest", regex: /\bXMLHttpRequest\b/ },
    { label: "API route path", regex: /["'`]\/api\// },
    { label: "HTTP method mutation", regex: /method:\s*["'`](POST|PUT|PATCH|DELETE)["'`]/i },
    { label: "NextResponse route behavior", regex: /\bNextResponse\b/ },
    { label: "localStorage", regex: /\blocalStorage\b/ },
    { label: "sessionStorage", regex: /\bsessionStorage\b/ },
    { label: "indexedDB", regex: /\bindexedDB\b/ },
    { label: "document.cookie", regex: /\bdocument\.cookie\b/ },
    { label: "database import", regex: /from ["'`][^"'`]*(db|database|sqlite)[^"'`]*["'`]/i },
    { label: "SQL create table", regex: /\bCREATE\s+TABLE\b/i },
    { label: "SQL insert", regex: /\bINSERT\s+INTO\b/i },
    { label: "SQL update", regex: /\bUPDATE\s+\w+\s+SET\b/i },
    { label: "OpenAI key", regex: /\bOPENAI_API_KEY\b/ },
    { label: "OpenAI endpoint", regex: /\bapi\.openai\.com\b/i },
    { label: "OpenAI client", regex: /\bnew\s+OpenAI\b/ },
    { label: "provider client", regex: /\b(providerClient|providerRun|callProvider)\b/i },
    { label: "retrieval implementation", regex: /\b(retrieveSources|ragIndex|vectorStore|embedding|embeddings|crawler|scrapeSource)\b/i },
    { label: "promotion workflow", regex: /\b(promotePerspective|promoteCandidate|rejectCandidate|deferCandidate|approveCandidate)\b/ },
    { label: "proof write", regex: /\b(recordProof|createProof|proofWrite)\b/ },
    { label: "evidence write", regex: /\b(recordEvidence|createEvidence|evidenceWrite)\b/ },
    { label: "work item create", regex: /\b(createWorkItem|newWorkItem|workItemCreate)\b/ },
    { label: "Codex execution", regex: /\b(executeCodex|runCodex|launchCodex)\b/ },
    { label: "external handoff send", regex: /\b(sendHandoff|postHandoff|navigator\.sendBeacon)\b/ },
  ];

  for (const { label, regex } of forbiddenPatterns) {
    assert.doesNotMatch(component, regex, `component must not include ${label}`);
  }
}

function assertIndexPointer() {
  for (const requiredText of [
    componentPath,
    smokePath,
    "smoke:research-candidate-manual-note-preview-ui-v0-1",
    "Cockpit manual pasted note preview UI shell",
  ]) {
    assert.ok(index.includes(requiredText), `docs index must include ${requiredText}`);
  }
}

function assertPackageScript() {
  assert.equal(
    packageJson.scripts?.["smoke:research-candidate-manual-note-preview-ui-v0-1"],
    "node scripts/smoke-research-candidate-manual-note-preview-ui-v0-1.mjs",
    "package.json must include the manual note preview UI smoke script",
  );
}
