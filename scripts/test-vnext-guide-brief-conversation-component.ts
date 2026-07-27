import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const component = readFileSync(
  new URL(
    "../components/guide/guide-brief-conversation.tsx",
    import.meta.url,
  ),
  "utf8",
);
const css = readFileSync(
  new URL(
    "../components/guide/guide-brief-conversation.module.css",
    import.meta.url,
  ),
  "utf8",
);
const blankState = readFileSync(
  new URL("../components/blank-state/blank-state-client.tsx", import.meta.url),
  "utf8",
);
const detail = readFileSync(
  new URL(
    "../components/workbench/semantic-review/decision-centered-proposal-detail.tsx",
    import.meta.url,
  ),
  "utf8",
);
const owner = readFileSync(
  new URL(
    "../lib/vnext/guide-brief/guide-brief-conversation-plan.ts",
    import.meta.url,
  ),
  "utf8",
);

assert.match(component, /<summary>Ask about this work<\/summary>/);
assert.match(component, /Questions supported by current sources/);
assert.match(component, /visibleAnswer \?[\s\S]*ConversationAnswer/);
assert.match(component, /answer\?\.scope\.scope_key === scopeKey/);
assert.match(component, /data-guidebrief-conversation-hydrated=\{String\(hydrated\)\}/);
assert.match(component, /setContext\(createGuideBriefConversationContextV01\(scopeKey\)\)/);
assert.match(component, /Guidance only\./);
assert.match(
  component,
  /data-augnes-visual-priority=\{SEMANTIC_VISUAL_PRIORITY\.supporting\}/,
);
assert.doesNotMatch(component, /localStorage|sessionStorage|indexedDB/);
assert.doesNotMatch(component, /\bfetch\s*\(|provider|model call/i);
assert.doesNotMatch(component, /data-augnes-primary-action/);

assert.match(css, /min-height:\s*44px/);
assert.match(css, /min-width:\s*0/);
assert.match(css, /overflow-wrap:\s*anywhere/);
assert.match(css, /@media \(max-width:\s*760px\)/);

assert.match(blankState, /<GuideBriefConversation guide=\{guide\} surface="blank_state" \/>/);
assert.match(detail, /surface="ai_workplane"/);
assert.match(detail, /buildSelectedWorkRelationshipsV01\(\{/);
assert.match(detail, /selected_relationship_question_key=/);
assert.doesNotMatch(detail, /guidebrief.*primary-action/i);

assert.match(owner, /routeGuideBriefConversationQuestionV01/);
assert.match(owner, /slice\(-GUIDE_BRIEF_CONVERSATION_MAX_TURNS_V01\)/);
assert.doesNotMatch(owner, /localStorage|sessionStorage|indexedDB/);
assert.doesNotMatch(owner, /\bfetch\s*\(|openai|anthropic|provider\(/i);

console.log("vNext GuideBrief conversation component contract tests passed.");
