import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const componentPath =
  "components/research-candidate-manual-note-preview-panel.tsx";
const runtimeHookPath =
  "components/use-research-candidate-manual-note-preview-runtime.ts";
const draftListPanelPath =
  "components/research-candidate-preview-draft-list-panel.tsx";
const draftCardPath = "components/research-candidate-preview-draft-card.tsx";
const labelControlsPath =
  "components/research-candidate-preview-draft-label-controls.tsx";
const activityReadoutPath =
  "components/research-candidate-preview-draft-activity-readout.tsx";
const metadataReadoutPath =
  "components/research-candidate-preview-draft-metadata-readout.tsx";
const preflightReadoutPath =
  "components/research-candidate-promotion-readiness-preflight-readout.tsx";
const formatHintPath =
  "components/research-candidate-manual-note-format-hint.tsx";
const handoffSeedPreviewPath =
  "components/research-candidate-manual-note-handoff-seed-preview.tsx";
const handoffResultIntakePanelPath =
  "components/research-candidate-manual-note-handoff-result-intake-panel.tsx";
const resultSummaryPath =
  "components/research-candidate-manual-note-result-summary.tsx";
const warningDisplayPath =
  "components/research-candidate-manual-note-warning-display.tsx";
const sourceReferenceListPath =
  "components/research-candidate-manual-note-source-reference-list.tsx";
const candidateFamilyListsPath =
  "components/research-candidate-manual-note-candidate-family-lists.tsx";
const authorityFlagsPath =
  "components/research-candidate-manual-note-authority-flags.tsx";
const currentRoutePath = "app/research-candidate-review/page.tsx";
const humanSurfaceHomePath = "components/human-surface/human-surface-home.tsx";
const humanSurfaceLinkGridPath =
  "components/human-surface/surface-link-grid.tsx";
const agentWorkplanePath = "components/workplane/agent-workplane.tsx";
const parserPath = "lib/research-candidate-review/manual-note-parser.ts";
const handoffSeedBuilderPath =
  "lib/research-candidate-review/manual-note-handoff-seed.ts";
const handoffResultIntakeBuilderPath =
  "lib/research-candidate-review/manual-note-handoff-result-intake.ts";
const packagePath = "package.json";
const smokePath =
  "scripts/smoke-research-candidate-manual-note-preview-ui-v0-1.mjs";

for (const filePath of [
  componentPath,
  runtimeHookPath,
  draftListPanelPath,
  draftCardPath,
  labelControlsPath,
  activityReadoutPath,
  metadataReadoutPath,
  preflightReadoutPath,
  formatHintPath,
  handoffSeedPreviewPath,
  handoffResultIntakePanelPath,
  resultSummaryPath,
  warningDisplayPath,
  sourceReferenceListPath,
  candidateFamilyListsPath,
  authorityFlagsPath,
  currentRoutePath,
  humanSurfaceHomePath,
  humanSurfaceLinkGridPath,
  agentWorkplanePath,
  parserPath,
  handoffSeedBuilderPath,
  handoffResultIntakeBuilderPath,
  packagePath,
  smokePath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const manualPanelComponent = readFileSync(componentPath, "utf8");
const runtimeHookComponent = readFileSync(runtimeHookPath, "utf8");
const handoffSeedPreviewComponent = readFileSync(handoffSeedPreviewPath, "utf8");
const handoffResultIntakePanelComponent = readFileSync(
  handoffResultIntakePanelPath,
  "utf8",
);
const draftUiComponent = [
  readFileSync(formatHintPath, "utf8"),
  handoffSeedPreviewComponent,
  handoffResultIntakePanelComponent,
  readFileSync(resultSummaryPath, "utf8"),
  readFileSync(warningDisplayPath, "utf8"),
  readFileSync(sourceReferenceListPath, "utf8"),
  readFileSync(candidateFamilyListsPath, "utf8"),
  readFileSync(authorityFlagsPath, "utf8"),
  readFileSync(draftListPanelPath, "utf8"),
  readFileSync(draftCardPath, "utf8"),
  readFileSync(labelControlsPath, "utf8"),
  readFileSync(activityReadoutPath, "utf8"),
  readFileSync(metadataReadoutPath, "utf8"),
  readFileSync(preflightReadoutPath, "utf8"),
].join("\n");
const component = `${manualPanelComponent}\n${draftUiComponent}`;
const runtimeComponent = `${component}\n${runtimeHookComponent}`;
const currentRoute = readFileSync(currentRoutePath, "utf8");
const humanSurfaceHome = readFileSync(humanSurfaceHomePath, "utf8");
const humanSurfaceLinkGrid = readFileSync(humanSurfaceLinkGridPath, "utf8");
const agentWorkplane = readFileSync(agentWorkplanePath, "utf8");
const parser = readFileSync(parserPath, "utf8");
const handoffSeedBuilder = readFileSync(handoffSeedBuilderPath, "utf8");
const handoffResultIntakeBuilder = readFileSync(
  handoffResultIntakeBuilderPath,
  "utf8",
);
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

assertDedicatedComponent();
assertCurrentRouteWiring();
assertHumanSurfaceDiscoverability();
assertWorkbenchDisplayOnlyLink();
assertParserReuse();
assertLocalOnlyParserExecution();
assertRuntimePreviewDraftAction();
assertSampleNoteAction();
assertEmptyFormattingHint();
assertWarningSummaryCard();
assertCompactResultSummary();
assertManualNoteHandoffSeedPreview();
assertManualNoteHandoffResultIntakePreview();
assertPreviewOutputRendering();
assertAuthorityBoundaryCopy();
assertClearBehavior();
assertForbiddenImplementationPatterns();
assertPackageScript();

console.log(
  JSON.stringify(
    {
      smoke: "research-candidate-manual-note-preview-ui-v0-1",
      dedicated_component_exists: true,
      current_route_imports_and_renders_component: true,
      human_surface_exposes_current_route: true,
      workbench_display_only_link_checked: true,
      existing_manual_note_parser_reused: true,
      parser_execution_local_only: true,
      runtime_preview_draft_action_checked: true,
      sample_note_action_checked: true,
      empty_formatting_hint_checked: true,
      warning_summary_card_checked: true,
      compact_result_summary_checked: true,
      manual_note_handoff_seed_preview_checked: true,
      manual_note_handoff_result_intake_preview_checked: true,
      preview_output_rendering_checked: true,
      visible_authority_boundary_copy_checked: true,
      clear_behavior_checked: true,
      forbidden_implementation_patterns_absent: true,
      package_script_checked: true,
    },
    null,
    2,
  ),
);

function assertDedicatedComponent() {
  assert.match(
    runtimeComponent,
    /export function ResearchCandidateManualNotePreviewPanel\(/,
    "dedicated manual note preview component must be exported",
  );
  assert.match(component, /"use client";/, "component must be a client component");
  assert.match(component, /<textarea\b/, "component must include textarea input");
  assert.match(component, /Parse locally/, "component must expose local parse trigger");
  assert.match(
    component,
    /Manual Research Candidate Preview/,
    "component must use current-surface manual research candidate heading",
  );
  assert.doesNotMatch(
    component,
    /Cockpit Manual Pasted Note Preview/,
    "component heading must not keep the Cockpit-era panel label",
  );
}

function assertCurrentRouteWiring() {
  assert.match(
    currentRoute,
    /import \{ ResearchCandidateManualNotePreviewPanel \} from "@\/components\/research-candidate-manual-note-preview-panel";/,
    "current Research Candidate Review route must import the dedicated component",
  );
  assert.match(
    currentRoute,
    /<ResearchCandidateManualNotePreviewPanel \/>/,
    "current Research Candidate Review route must render the dedicated component",
  );
  assert.match(
    currentRoute,
    /description:\s*"Candidate-only manual research note preview for Research Candidate Review\."/,
    "route metadata must describe the lane as candidate-only manual research note preview",
  );
  assert.match(
    currentRoute,
    /className="human-surface-home"/,
    "route must render as a current Human Surface page, not a Cockpit surface",
  );
  assert.doesNotMatch(
    currentRoute,
    /AugnesCockpit|components\/augnes-cockpit|\/cockpit/,
    "current route must not resurrect or link to Legacy Cockpit",
  );
}

function assertHumanSurfaceDiscoverability() {
  assert.match(
    humanSurfaceHome,
    /<SurfaceLinkGrid \/>/,
    "current Human Surface home must render SurfaceLinkGrid",
  );
  assert.match(
    humanSurfaceLinkGrid,
    /href:\s*"\/research-candidate-review"/,
    "Human Surface link grid must expose the current manual Research Candidate Review route",
  );

  for (const requiredText of [
    "Manual research notes",
    "Candidate-only manual research note preview.",
    "No source fetching",
    "provider calls",
    "retrieval/RAG",
    "durable Perspective promotion",
    "proof/evidence writes",
    "proof/evidence rows",
  ]) {
    assert.ok(
      humanSurfaceLinkGrid.includes(requiredText),
      `Human Surface manual note card must include ${requiredText}`,
    );
  }

  assert.doesNotMatch(
    humanSurfaceLinkGrid,
    /Cockpit|\/cockpit|AugnesCockpit/,
    "Human Surface manual note discoverability must not point to Legacy Cockpit",
  );
}

function assertWorkbenchDisplayOnlyLink() {
  const workbenchSnippet = snippetBetween(
    agentWorkplane,
    'aria-label="Research Candidate Review current surface link"',
    "<WorkplaneIntentModePanel",
    agentWorkplanePath,
  );

  assert.match(
    workbenchSnippet,
    /href="\/research-candidate-review"/,
    "Agent Workplane must include a display-only link to the current route",
  );
  for (const requiredText of [
    "Research Candidate Review",
    "Open manual research note preview",
    "Candidate-only manual research note preview.",
    "No source fetching",
    "provider calls",
    "retrieval/RAG",
    "durable Perspective promotion",
    "proof/evidence writes",
    "proof/evidence rows",
    "work item creation",
  ]) {
    assert.ok(
      workbenchSnippet.includes(requiredText),
      `Agent Workplane current-route link must include ${requiredText}`,
    );
  }
  assert.doesNotMatch(
    workbenchSnippet,
    /\b(onClick|onSubmit|fetch|method:|POST|PUT|PATCH|DELETE|useState|useEffect)\b|<form\b|<button\b/,
    "Agent Workplane route visibility must remain a display-only link without a new write/action path",
  );
}

function assertParserReuse() {
  assert.match(
    parser,
    /export function parseManualResearchNoteToPreview\(/,
    "existing parser must export parseManualResearchNoteToPreview",
  );
  assert.match(
    runtimeComponent,
    /parseManualResearchNoteToPreview/,
    "component must import/use parseManualResearchNoteToPreview",
  );
  assert.match(
    runtimeComponent,
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
    runtimeComponent,
    /MANUAL_NOTE_PREVIEW_ROUTE/,
    "component must import/use the bounded manual note preview route constant",
  );
  assert.match(
    runtimeComponent,
    /fetch\(MANUAL_NOTE_PREVIEW_ROUTE,/,
    "component runtime action must call only the same-origin route constant",
  );
  assert.match(
    runtimeComponent,
    /method:\s*"POST"/,
    "component runtime action must POST to the bounded route",
  );
  assert.match(
    runtimeComponent,
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

function assertManualNoteHandoffSeedPreview() {
  assert.match(
    manualPanelComponent,
    /ResearchCandidateManualNoteHandoffSeedPreview/,
    "manual note panel must import/render the handoff seed preview component",
  );
  assert.match(
    manualPanelComponent,
    /buildResearchCandidateManualNoteHandoffSeed/,
    "manual note panel must build a handoff seed from the visible display result",
  );
  assert.match(
    manualPanelComponent,
    /preview:\s*displayResult\.preview/,
    "handoff seed must use the currently visible parser preview",
  );
  assert.match(
    manualPanelComponent,
    /warnings:\s*displayResult\.warnings/,
    "handoff seed must preserve parser warnings",
  );
  assert.match(
    manualPanelComponent,
    /displayResult\.runtimeResult\?\.preview_draft_id[\s\S]*displayResult\.storedDraftResult\?\.draft\.preview_draft_id/,
    "handoff seed must include runtime or stored draft preview id metadata when available",
  );
  assert.match(
    component,
    /export function ResearchCandidateManualNoteHandoffSeedPreview/,
    "handoff seed preview component must be exported",
  );
  assert.match(
    component,
    /Candidate-only handoff seed preview/,
    "handoff seed preview must render a clear candidate-only heading",
  );
  assert.match(
    component,
    /copyable_prompt/,
    "handoff seed preview must expose the copyable prompt",
  );
  assert.match(
    component,
    /readOnly/,
    "handoff seed prompt must render read-only",
  );
  assert.doesNotMatch(
    handoffSeedPreviewComponent,
    /navigator\.clipboard|writeText|<button[\s\S]*copyable_prompt/,
    "handoff seed preview must not add clipboard-write or execution controls",
  );
  assert.match(
    handoffSeedPreviewComponent,
    /ResearchCandidateManualNoteHandoffResultIntakePanel seed=\{seed\}/,
    "handoff seed preview must render the local result intake panel",
  );
  assert.match(
    handoffSeedBuilder,
    /seed_kind:\s*seedKind/,
    "handoff seed builder must return the manual note seed kind",
  );
  assert.match(
    handoffSeedBuilder,
    /ResearchCandidateReviewPreviewResponse/,
    "handoff seed builder must consume ResearchCandidateReviewPreviewResponse-shaped input",
  );
}

function assertManualNoteHandoffResultIntakePreview() {
  assert.match(
    handoffResultIntakeBuilder,
    /export function buildResearchCandidateManualNoteHandoffResultIntake/,
    "result intake builder must be exported",
  );
  assert.match(
    handoffResultIntakeBuilder,
    /codex_result_report_text/,
    "result intake builder must accept pasted result report text",
  );
  assert.match(
    handoffResultIntakeBuilder,
    /source_handoff_seed_fingerprint/,
    "result intake builder must preserve source handoff seed fingerprint",
  );
  assert.match(
    component,
    /export function ResearchCandidateManualNoteHandoffResultIntakePanel/,
    "result intake panel must be exported",
  );
  assert.match(
    component,
    /Candidate-only result intake preview/,
    "result intake panel must render a clear candidate-only heading",
  );
  assert.match(
    component,
    /Codex result report text/,
    "result intake panel must expose the pasted result report textarea",
  );
  assert.match(
    component,
    /Preview result intake/,
    "result intake panel must expose a local preview action",
  );
  assert.match(
    component,
    /Clear result intake/,
    "result intake panel must expose a local clear action",
  );
  assert.match(
    component,
    /Expected vs observed delta draft/,
    "result intake panel must render the ExpectedObservedDelta draft",
  );
  assert.match(
    component,
    /Reuse outcome draft/,
    "result intake panel must render the reuse outcome draft",
  );
  assert.match(
    component,
    /missing_required_return_fields/,
    "result intake panel must render missing return-field coverage",
  );
  assert.doesNotMatch(
    handoffResultIntakePanelComponent,
    /\bfetch\s*\(|navigator\.clipboard|writeText|localStorage|sessionStorage|indexedDB|document\.cookie|NextResponse|Request\(|Response\(|OPENAI_API_KEY|api\.openai\.com|new\s+OpenAI|GITHUB_TOKEN|octokit|executeCodex|runCodex|launchCodex/i,
    "result intake panel must not add network, storage, clipboard, provider, GitHub, or Codex behavior",
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
    /manualNoteRuntime\.actions\.resetRuntimeDraftState\(\)/,
    "clear handler must reset runtime state through the runtime hook",
  );
  assert.match(
    runtimeComponent,
    /function clearRuntimeResult\(\)[\s\S]*setRuntimeResult\(null\)[\s\S]*setRuntimeError\(null\)[\s\S]*setIsRuntimeLoading\(false\)/,
    "runtime hook clear action must reset runtime result/error/loading state",
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
  const currentRouteAndSurfaceText = [
    currentRoute,
    humanSurfaceHome,
    humanSurfaceLinkGrid,
    snippetBetween(
      agentWorkplane,
      'aria-label="Research Candidate Review current surface link"',
      "<WorkplaneIntentModePanel",
      agentWorkplanePath,
    ),
  ].join("\n");

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

  const currentSurfaceForbiddenPatterns = [
    { label: "external network URL", regex: /\bfetch\s*\(\s*["'`]https?:\/\//i },
    { label: "mutating HTTP method", regex: /\bmethod:\s*["'`](POST|PUT|PATCH|DELETE)["'`]/ },
    { label: "form action", regex: /<form\b|<button\b|onClick=|onSubmit=/ },
    { label: "database import", regex: /from ["'`][^"'`]*(db|database|sqlite)[^"'`]*["'`]/i },
    { label: "OpenAI endpoint", regex: /\bapi\.openai\.com\b/i },
    { label: "OpenAI client", regex: /\bnew\s+OpenAI\b/ },
    { label: "provider client", regex: /\b(providerClient|providerRun|callProvider)\b/i },
    { label: "retrieval implementation", regex: /\b(retrieveSources|ragIndex|vectorStore|embedding|embeddings|crawler|scrapeSource)\b/i },
    { label: "promotion workflow", regex: /\b(promotePerspective|promoteCandidate|rejectCandidate|deferCandidate|approveCandidate)\b/ },
    { label: "proof write", regex: /\b(recordProof|createProof|proofWrite)\b/ },
    { label: "evidence write", regex: /\b(recordEvidence|createEvidence|evidenceWrite)\b/ },
    { label: "work item create", regex: /\b(createWorkItem|newWorkItem|workItemCreate)\b/ },
    { label: "Codex execution", regex: /\b(executeCodex|runCodex|launchCodex)\b/ },
    { label: "GitHub automation", regex: /\b(octokit|createPullRequest|mergePullRequest)\b/i },
  ];

  for (const { label, regex } of currentSurfaceForbiddenPatterns) {
    assert.doesNotMatch(
      currentRouteAndSurfaceText,
      regex,
      `current route/surface wiring must not introduce ${label}`,
    );
  }
}

function assertPackageScript() {
  assert.equal(
    packageJson.scripts?.["smoke:research-candidate-manual-note-preview-ui-v0-1"],
    "node scripts/smoke-research-candidate-manual-note-preview-ui-v0-1.mjs",
    "package.json must include the manual note preview UI smoke script",
  );
}

function snippetBetween(source, startMarker, endMarker, label) {
  const start = source.indexOf(startMarker);
  assert.notEqual(start, -1, `${label} must include ${startMarker}`);
  const end = source.indexOf(endMarker, start);
  assert.notEqual(end, -1, `${label} must include ${endMarker} after ${startMarker}`);
  return source.slice(start, end);
}
