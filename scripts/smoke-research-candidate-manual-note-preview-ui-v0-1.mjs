import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const componentPath =
  "components/research-candidate-manual-note-preview-panel.tsx";
const draftListPanelPath =
  "components/research-candidate-preview-draft-list-panel.tsx";
const draftCardPath = "components/research-candidate-preview-draft-card.tsx";
const labelControlsPath =
  "components/research-candidate-preview-draft-label-controls.tsx";
const activityReadoutPath =
  "components/research-candidate-preview-draft-activity-readout.tsx";
const metadataReadoutPath =
  "components/research-candidate-preview-draft-metadata-readout.tsx";
const cockpitPath = "components/augnes-cockpit.tsx";
const parserPath = "lib/research-candidate-review/manual-note-parser.ts";
const indexPath = "docs/00_INDEX_LATEST.md";
const packagePath = "package.json";
const smokePath =
  "scripts/smoke-research-candidate-manual-note-preview-ui-v0-1.mjs";

for (const filePath of [
  componentPath,
  draftListPanelPath,
  draftCardPath,
  labelControlsPath,
  activityReadoutPath,
  metadataReadoutPath,
  cockpitPath,
  parserPath,
  indexPath,
  packagePath,
  smokePath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const manualPanelComponent = readFileSync(componentPath, "utf8");
const draftUiComponent = [
  readFileSync(draftListPanelPath, "utf8"),
  readFileSync(draftCardPath, "utf8"),
  readFileSync(labelControlsPath, "utf8"),
  readFileSync(activityReadoutPath, "utf8"),
  readFileSync(metadataReadoutPath, "utf8"),
].join("\n");
const component = `${manualPanelComponent}\n${draftUiComponent}`;
const cockpit = readFileSync(cockpitPath, "utf8");
const parser = readFileSync(parserPath, "utf8");
const index = readFileSync(indexPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

assertDedicatedComponent();
assertCockpitWiring();
assertParserReuse();
assertLocalOnlyParserExecution();
assertRuntimePreviewDraftAction();
assertSampleNoteAction();
assertEmptyFormattingHint();
assertWarningSummaryCard();
assertCompactResultSummary();
assertPreviewOutputRendering();
assertAuthorityBoundaryCopy();
assertClearBehavior();
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
      runtime_preview_draft_action_checked: true,
      sample_note_action_checked: true,
      empty_formatting_hint_checked: true,
      warning_summary_card_checked: true,
      compact_result_summary_checked: true,
      preview_output_rendering_checked: true,
      visible_authority_boundary_copy_checked: true,
      clear_behavior_checked: true,
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
  assert.match(component, /Parse locally/, "component must expose local parse trigger");
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
    /data-augnes-parser-execution="local-parser-and-same-origin-runtime-route"/,
    "component must declare local parser and bounded runtime route execution",
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

function assertRuntimePreviewDraftAction() {
  assert.match(
    component,
    /MANUAL_NOTE_PREVIEW_ROUTE/,
    "component must import/use the bounded manual note preview route constant",
  );
  assert.match(
    component,
    /fetch\(MANUAL_NOTE_PREVIEW_ROUTE,/,
    "component runtime action must call only the same-origin route constant",
  );
  assert.match(
    component,
    /method:\s*"POST"/,
    "component runtime action must POST to the bounded route",
  );
  assert.match(
    component,
    /persist_preview_draft:\s*true/,
    "component runtime action must request a preview draft explicitly",
  );
  assert.match(
    component,
    /Create runtime preview draft/,
    "component must expose runtime preview draft action",
  );
  assert.match(
    component,
    /Clear runtime result/,
    "component must expose runtime result reset action",
  );
  assert.match(
    component,
    /Runtime preview draft metadata/,
    "component must render runtime metadata",
  );
  assert.match(
    component,
    /input_fingerprint/,
    "component must render input fingerprint",
  );
  assert.match(
    component,
    /preview_draft_id/,
    "component must render preview draft id",
  );
  assert.match(
    component,
    /persistence_mode/,
    "component must render persistence mode",
  );
  assert.match(
    component,
    /runtime_boundary/,
    "component must render runtime boundary",
  );
  assert.match(
    component,
    /no_side_effects/,
    "component must render no_side_effects metadata",
  );
}

function assertSampleNoteAction() {
  assert.match(
    component,
    /const MANUAL_NOTE_SAMPLE = \[/,
    "component must define a local sample manual note",
  );
  assert.match(
    component,
    /Use sample note/,
    "component must expose a Use sample note action",
  );
  assert.match(
    component,
    /function useSampleNote\(\)/,
    "component must implement sample note fill handler",
  );
  assert.match(
    component,
    /setManualNoteText\(MANUAL_NOTE_SAMPLE\)/,
    "sample action must populate local textarea state",
  );
  assert.doesNotMatch(
    component,
    /function useSampleNote\(\)[\s\S]*parseManualResearchNoteToPreview/,
    "sample action must not auto-parse",
  );

  for (const requiredText of [
    "Research Question:",
    "Operator Intent:",
    "Source Title:",
    "Source Origin:",
    "Source Identifier:",
    "Claim:",
    "Evidence: supports:",
    "Evidence: context:",
    "Tension:",
    "Gap:",
    "next:",
    "Perspective Delta:",
    "Next:",
    "files:",
    "checks:",
    "candidate-only",
    "non-authoritative",
  ]) {
    assert.ok(
      component.includes(requiredText),
      `sample/manual help must include ${requiredText}`,
    );
  }
}

function assertEmptyFormattingHint() {
  assert.match(
    component,
    /function ManualNoteFormatHint\(\)/,
    "component must render a compact empty formatting hint",
  );
  assert.match(
    component,
    /How to format a note/,
    "empty state must include formatting help heading",
  );
  assert.match(
    component,
    /research-candidate-manual-note-format-hint/,
    "textarea must reference formatting hint for accessibility",
  );

  for (const requiredPrefix of [
    "Research Question:",
    "연구질문:",
    "Operator Intent:",
    "의도:",
    "Source Title:",
    "출처제목:",
    "Source Origin:",
    "출처:",
    "Source Identifier:",
    "식별자:",
    "Claim:",
    "주장:",
    "Evidence:",
    "근거:",
    "Tension:",
    "긴장:",
    "Gap:",
    "공백:",
    "Perspective Delta:",
    "관점변화:",
    "Next:",
    "다음:",
    "files:",
    "checks:",
  ]) {
    assert.ok(
      component.includes(requiredPrefix),
      `format hint must include parser-supported prefix ${requiredPrefix}`,
    );
  }
}

function assertWarningSummaryCard() {
  assert.match(
    component,
    /function ParserWarningSummary\(/,
    "component must include a top warning summary card",
  );
  assert.match(
    component,
    /Parser warning summary/,
    "warning summary must have a visible heading",
  );
  assert.match(
    component,
    /role="status"/,
    "warning summary must be readable by assistive tech",
  );
  assert.match(
    component,
    /warning\.code/,
    "warning summary must render warning code",
  );
  assert.match(
    component,
    /warning\.message/,
    "warning summary must render warning message",
  );
  assert.match(
    component,
    /warning\.line \?\? "not available"/,
    "warning summary must render line number fallback",
  );
}

function assertCompactResultSummary() {
  assert.match(
    component,
    /function ManualNoteResultSummary\(/,
    "component must include a compact parse result summary",
  );
  for (const requiredText of [
    "Parse result summary",
    "candidates",
    "claims",
    "evidence",
    "warnings",
    "parser_version",
    "preview_status",
    "local_parse_count",
  ]) {
    assert.ok(component.includes(requiredText), `summary must include ${requiredText}`);
  }
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

function assertClearBehavior() {
  assert.match(component, /Clear local note/, "component must expose local clear action");
  assert.match(
    component,
    /function clearManualNote\(\)/,
    "component must keep a clear handler",
  );
  assert.match(
    component,
    /setManualNoteText\(""\)/,
    "clear handler must empty textarea state",
  );
  assert.match(
    component,
    /setParserResult\(null\)/,
    "clear handler must reset parser result",
  );
  assert.match(
    component,
    /setRuntimeResult\(null\)/,
    "clear handler must reset runtime result",
  );
  assert.match(
    component,
    /setRuntimeError\(null\)/,
    "clear handler must reset runtime error",
  );
  assert.match(
    component,
    /setIsRuntimeLoading\(false\)/,
    "clear handler must reset runtime loading state",
  );
  assert.match(
    component,
    /setParseCount\(0\)/,
    "clear handler must reset parse count",
  );
  assert.match(
    component,
    /!manualNoteText[\s\S]*!parserResult[\s\S]*!runtimeResult[\s\S]*!runtimeError[\s\S]*!isRuntimeLoading/,
    "clear button must disable only when there is no local or runtime state",
  );
}

function assertAuthorityBoundaryCopy() {
  for (const requiredText of [
    "Local parser execution remains available.",
    "Runtime action uses the same-origin bounded preview route only.",
    "Optional DB write is a non-canonical preview draft.",
    "Raw pasted note text is not persisted.",
    "Output is read-only preview material.",
    "No durable candidate/review/receipt storage or canonical Perspective storage.",
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
  assert.doesNotMatch(
    component,
    /\bfetch\s*\(\s*["'`]https?:\/\//i,
    "component must not call an external network URL",
  );
  assert.doesNotMatch(
    component,
    /["'`]\/api\/(?!research-candidate-review\/manual-note-preview)/,
    "component must not embed any API route other than the bounded manual note route",
  );

  const forbiddenPatterns = [
    { label: "fetchJson", regex: /\bfetchJson\b/ },
    { label: "XMLHttpRequest", regex: /\bXMLHttpRequest\b/ },
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
