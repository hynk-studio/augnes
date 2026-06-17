import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const readmePath = "README.md";
const agentsPath = "AGENTS.md";
const guidePath = "docs/AUGNES_START_HERE_FOR_USERS_AND_AI.md";
const indexPath = "docs/00_INDEX_LATEST.md";
const packagePath = "package.json";

for (const filePath of [readmePath, agentsPath, guidePath, indexPath, packagePath]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const readme = readFileSync(readmePath, "utf8");
const agents = readFileSync(agentsPath, "utf8");
const guide = readFileSync(guidePath, "utf8");
const index = readFileSync(indexPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

assert.equal(
  packageJson.scripts?.["smoke:readme-user-ai-front-door-v0-1"],
  "node scripts/smoke-readme-user-ai-front-door-v0-1.mjs",
  "package.json must expose the README user/AI front-door smoke",
);

assertReadme();
assertAgents();
assertGuide();
assertIndexPointer();
assertNoForbiddenAuthorityPatterns({
  [readmePath]: readme,
  [agentsPath]: agents,
  [guidePath]: guide,
  [indexPath]: index,
});

console.log(
  JSON.stringify(
    {
      smoke: "readme-user-ai-front-door-v0-1",
      readme_human_operator_chatgpt_mcp_codex_paths_checked: true,
      readme_codex_next_work_reference_checked: true,
      readme_codex_result_text_paste_reference_checked: true,
      readme_result_report_template_reference_checked: true,
      readme_local_first_operator_led_boundaries_checked: true,
      readme_forbidden_automation_claims_absent: true,
      agents_codex_next_work_and_source_reporting_checked: true,
      start_guide_required_sections_checked: true,
      start_guide_research_work_loop_references_checked: true,
      index_pointer_checked: true,
      forbidden_authority_patterns_absent: true,
      package_script_checked: true,
    },
    null,
    2,
  ),
);

function assertReadme() {
  for (const requiredText of [
    "# Augnes",
    "local-first",
    "operator-led",
    "## What It Can Do Today",
    "## What It Does Not Do Automatically",
    "## Use Augnes In Three Paths",
    "### 1. Human/operator local path",
    "### 2. ChatGPT / MCP path",
    "### 3. Codex worker path",
    "AUGNES_APP_TOOL_SURFACE=work_loop_readonly",
    "In `work_loop_readonly` mode, useful calls are:",
    "Broader local bridge/proof workflows are documented separately",
    "npm run codex:next-work -- --scope project:augnes",
    "npm run codex:next-work -- --scope project:augnes --work-id AG-DOGFOOD-RESEARCH-001",
    "codexResultText",
    "codexResultPaste",
    "docs/AUGNES_CODEX_RESULT_REPORT_TEMPLATE_V0_1.md",
    "docs/AUGNES_RESEARCH_ACCUMULATION_SCENARIO_PACK_V0_1.md",
    "docs/AUGNES_LIVE_RESEARCH_WORK_PICKER_BRIEF_OBSERVATION_V0_1.md",
    "does not automatically execute Codex",
    "does not automatically fetch, review, merge, publish, or approve",
    "does not automatically ingest papers",
    "Brief/Core Handoff",
    "Current Research Accumulation implementation is a",
    "preview contract only",
    "not a hosted production service",
  ]) {
    assertIncludes(readme, requiredText, `README must include ${requiredText}`);
  }

  for (const forbiddenClaim of [
    /\bresearch ingestion is implemented\b/i,
    /\bpaper ingestion is implemented\b/i,
    /\bAugnes ingests papers\b/i,
    /\bexecutes Codex automatically\b/i,
    /\bautomatically executes Codex\b/i,
    /\bautomatically fetches GitHub\b/i,
    /\bautomatically reviews GitHub\b/i,
    /\bautomatically merges\b/i,
    /\bautomatically publishes\b/i,
  ]) {
    assert.doesNotMatch(readme, forbiddenClaim, `README must not claim ${forbiddenClaim}`);
  }
}

function assertAgents() {
  for (const requiredText of [
    "Core Handoff",
    "Full Handoff",
    "npm run codex:next-work -- --scope project:augnes",
    "npm run codex:next-work -- --scope project:augnes --prefer-research",
    "npm run codex:next-work -- --scope project:augnes --work-id AG-DOGFOOD-RESEARCH-001",
    "runtime_work_brief",
    "repo_seed_fallback",
    "docs_fallback",
    "blocked",
    "Report honestly whether",
    "docs/AUGNES_CODEX_RESULT_REPORT_TEMPLATE_V0_1.md",
    "codexResultText",
    "codexResultPaste",
  ]) {
    assertIncludes(agents, requiredText, `AGENTS.md must include ${requiredText}`);
  }
}

function assertGuide() {
  for (const heading of [
    "## What Augnes Is",
    "## Who This Is For",
    "## What Works Today",
    "## What Is Preview-only",
    "## What Is Not Implemented Yet",
    "## Human Quick Start",
    "## ChatGPT / MCP Quick Start",
    "## Codex Quick Start",
    "## Research Work Loop Example",
    "## Result Report Return Path",
    "## Authority Boundaries",
    "## Recommended Next Docs",
  ]) {
    assert.match(guide, new RegExp(`^${escapeRegExp(heading)}$`, "m"), `guide must include ${heading}`);
  }

  for (const requiredText of [
    "Cockpit",
    "Work Picker",
    "Work Brief / Work Contract Card",
    "Core Handoff",
    "AUGNES_APP_TOOL_SURFACE=work_loop_readonly",
    "In `work_loop_readonly` mode, useful calls are:",
    "Broader local bridge/proof workflows are documented separately",
    "npm run codex:next-work",
    "AG-DOGFOOD-RESEARCH-001",
    "codexResultText",
    "codexResultPaste",
    "docs/AUGNES_CODEX_RESULT_REPORT_TEMPLATE_V0_1.md",
    "docs/AUGNES_RESEARCH_ACCUMULATION_SCENARIO_PACK_V0_1.md",
    "docs/AUGNES_LIVE_RESEARCH_WORK_PICKER_BRIEF_OBSERVATION_V0_1.md",
    "Research accumulation product lanes are not implemented in the current",
    "Work Brief/Core Handoff",
  ]) {
    assertIncludes(guide, requiredText, `guide must include ${requiredText}`);
  }
}

function assertIndexPointer() {
  assertIncludes(index, "AUGNES_START_HERE_FOR_USERS_AND_AI.md", "index must point to the start guide");
  assertIncludes(index, "repo-local", "index pointer must stay repo-local");
  assertIncludes(index, "non-SSOT", "index pointer must stay non-SSOT");
}

function assertNoForbiddenAuthorityPatterns(files) {
  const forbiddenPatterns = [
    { label: "provider/OpenAI calls as automatic behavior", pattern: /\b(?:provider\/OpenAI calls|provider calls|OpenAI calls)\b/i },
    { label: "paper ingestion as implemented behavior", pattern: /\b(?:paper ingestion|paper fetching|research ingestion)\b/i },
    { label: "automatic Codex execution", pattern: /\bautomatic Codex execution\b/i },
    { label: "automatic GitHub automation", pattern: /\bautomatic GitHub (?:fetch|review|merge|publish|fetch\/review\/merge\/publish)\b/i },
    { label: "proof/evidence write authority", pattern: /\bproof\/evidence write\b/i },
    { label: "state commit/reject authority", pattern: /\bstate commit\/reject\b/i },
    { label: "App/MCP tool widening", pattern: /\b(?:new App\/MCP tools|MCP\/App tools|App\/MCP tool)\b/i },
    {
      label: "work loop readonly widening",
      pattern: /\b(?:widen|widens|widening|widened)\b.*\bwork_loop_readonly\b|\bwork_loop_readonly\b.*\b(?:widen|widens|widening|widened)\b/i,
    },
  ];

  for (const [filePath, source] of Object.entries(files)) {
    const lines = source.split(/\r?\n/);
    for (const [index, line] of lines.entries()) {
      for (const { label, pattern } of forbiddenPatterns) {
        if (!pattern.test(line)) continue;
        const context = [
          lines[index - 2] ?? "",
          lines[index - 1] ?? "",
          line,
          lines[index + 1] ?? "",
          lines[index + 2] ?? "",
        ].join(" ");
        assert.ok(
          hasBoundaryNegation(context),
          `${filePath}:${index + 1} mentions ${label} without a boundary negation: ${line}`,
        );
      }
    }
  }
}

function hasBoundaryNegation(line) {
  const negativeBoundaryTerms =
    /\b(no|not|never|without|unless|do not|does not|must not|cannot|is not|are not|adds no|not implemented|not yet|preview-only|forbidden|skipped)\b|(?:변경하지|만들지|아니다|않는다)/i;
  const scopedBoundaryPhrases = [
    /\bfresh Work Brief(?:\/| or )Core Handoff\b/i,
    /\bexplicitly scopes the lane\b/i,
    /\bexplicitly authorizes a bounded (?:capability )?lane\b/i,
    /\bnon-authoritative candidates?\b/i,
    /\bcandidate\/review records\b/i,
  ];

  return negativeBoundaryTerms.test(line) || scopedBoundaryPhrases.some((pattern) => pattern.test(line));
}

function assertIncludes(source, expected, message) {
  assert.ok(source.includes(expected), message);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
