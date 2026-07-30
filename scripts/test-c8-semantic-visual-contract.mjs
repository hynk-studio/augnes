#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  SEMANTIC_VISUAL_PRIORITIES,
  semanticVisualOrderIsValid,
} from "../lib/vnext/semantic-visual/semantic-visual-contract.ts";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const read = (file) => readFileSync(path.join(repoRoot, file), "utf8");
const readBuffer = (file) => readFileSync(path.join(repoRoot, file));

assert.deepEqual(SEMANTIC_VISUAL_PRIORITIES, [
  "situation",
  "primary-action",
  "ai-summary",
  "risk",
  "supporting",
  "raw-record",
]);
assert.equal(semanticVisualOrderIsValid(SEMANTIC_VISUAL_PRIORITIES), true);
assert.equal(
  semanticVisualOrderIsValid(["situation", "risk", "primary-action"]),
  false,
);

const globals = read("app/globals.css");
for (const token of [
  "--reading-width",
  "--space-1",
  "--space-5",
  "--risk-surface",
  "--raw-record-surface",
]) {
  assert.match(globals, new RegExp(token, "u"));
}
for (const priority of SEMANTIC_VISUAL_PRIORITIES) {
  assert.equal(
    globals.includes(`data-augnes-visual-priority="${priority}"`),
    true,
  );
}

const productShell = read("components/product-shell.tsx");
assert.equal(
  [...productShell.matchAll(/zone: "(?:blank-state|ai-workplane)"/gu)].length,
  2,
);
assert.match(
  productShell,
  /label: "Continuities"[\s\S]*zone: "blank-state"/u,
);
assert.match(
  productShell,
  /<a className="product-brand" href="\/" aria-label="Augnes home">[\s\S]*<strong>Augnes<\/strong>/u,
);
assert.doesNotMatch(productShell, /product-brand-mark|<svg/u);
assert.match(
  productShell,
  /<div className="product-navigation-rail">[\s\S]*<nav className="product-navigation" aria-label="Primary navigation">[\s\S]*<\/nav>\s*\{secondaryNavigation\}\s*\{railSupport\}\s*<\/div>/u,
);
const primaryNavigationSource =
  productShell.match(
    /<nav className="product-navigation" aria-label="Primary navigation">([\s\S]*?)<\/nav>/u,
  )?.[1] ?? "";
assert.notEqual(primaryNavigationSource, "");
assert.doesNotMatch(primaryNavigationSource, /secondaryNavigation|Pinned/u);
assert.equal(
  [...primaryNavigationSource.matchAll(/<a[\s>]/gu)].length,
  1,
  "the single mapped destination anchor must remain the only primary-nav anchor source",
);
assert.doesNotMatch(productShell, /label: "Blank State"/u);
assert.doesNotMatch(productShell, /Project tools|Portability|Recovery/u);

const blankState = read("components/blank-state/blank-state-client.tsx");
assert.match(blankState, /data-augnes-surface-role/u);
assert.match(blankState, /data-augnes-primary-action/u);
assert.match(blankState, /SEMANTIC_VISUAL_PRIORITY\.situation/u);
assert.match(blankState, /SEMANTIC_VISUAL_PRIORITY\.aiSummary/u);
assert.match(blankState, /SEMANTIC_VISUAL_PRIORITY\.risk/u);
assert.match(blankState, /SEMANTIC_VISUAL_PRIORITY\.rawRecord/u);
assert.match(blankState, /data-blank-state-continuity-list/u);
assert.match(blankState, /data-blank-state-continuity-highlighted/u);
assert.match(blankState, /data-blank-state-human-attention/u);
assert.match(blankState, /data-blank-state-attention-summary/u);
assert.match(blankState, />Continuities<\/h1>/u);
assert.match(blankState, /Work and perspective you carry forward\./u);
assert.doesNotMatch(
  blankState,
  /Current-project continuity|blank-state-eyebrow/u,
);
assert.match(blankState, /data-continuities-filter="shown-items"/u);
assert.match(blankState, /data-continuities-recommended=\{highlighted/u);
assert.match(blankState, /data-continuities-temporal-context/u);
assert.match(blankState, /data-continuities-guidebrief-launcher="true"/u);
assert.match(blankState, /continuities-guide-rail-support/u);
assert.match(blankState, /createPortal\(guideLauncher, guideRailTarget\)/u);
assert.match(blankState, /data-blank-state-presentation=\{presentationMode\}/u);
assert.match(blankState, /presentationMode === "active_continuities"/u);
assert.match(blankState, /presentationMode === "local_project_onboarding"/u);
assert.match(blankState, /presentationMode === "project_choice"/u);
assert.match(blankState, /Open a local project folder/u);
assert.match(
  blankState,
  /Select an existing folder on this computer\. Augnes links it as the[\s\S]*local project root; this step does not upload the folder\./u,
);
assert.match(blankState, /Use a regular folder or a Git repository\./u);
assert.match(blankState, /Choose a folder/u);
assert.match(blankState, /Use this folder/u);
assert.match(blankState, /aria-label="Open GuideBrief"/u);
assert.match(blankState, /aria-label=\{busy \? "Working…" : action\.label\}/u);
assert.match(blankState, /data-continuities-guidebrief-dialog="true"/u);
assert.match(blankState, /showModal\(\)/u);
assert.match(blankState, /event\.key !== "Escape"/u);
assert.match(blankState, /presentation="embedded"/u);
assert.match(blankState, /data-continuities-filter-chip="all"/u);
assert.match(blankState, /data-continuities-filter-chip="attention"/u);
assert.match(blankState, /<details className="continuities-item-details">/u);
assert.match(blankState, /<ContinuityPinAction item=\{item\} \/>/u);
assert.match(blankState, /<MobilePinnedContinuities \/>/u);
assert.match(
  blankState,
  /data-blank-state-project-settings-recovery="true"[\s\S]*<summary>Project settings and recovery<\/summary>/u,
);
assert.equal(
  [...blankState.matchAll(/<summary>Project settings and recovery<\/summary>/gu)]
    .length,
  1,
);
assert.match(
  blankState,
  /<ManagementSafety view=\{managementSafety\} embedded \/>/u,
);
assert.match(
  blankState,
  /<ProjectOptions[\s\S]*embedded[\s\S]*\/>/u,
);
assert.match(
  blankState,
  /className="continuities-temporal-title"[\s\S]*title=\{item\.(?:label|summary)\}/u,
);
assert.match(blankState, /<h3 title=\{item\.work_name\}>/u);
assert.match(
  blankState,
  /className="blank-state-continuity-state"[\s\S]*title=\{item\.meaningful_state\}/u,
);
assert.doesNotMatch(blankState, /className="continuities-last-change-summary"/u);
assert.match(
  blankState,
  /className="blank-state-continuity-change"[\s\S]*item\.last_meaningful_change\.summary/u,
);
assert.doesNotMatch(blankState, /aria-selected|localStorage/u);
assert.doesNotMatch(blankState, /Other items to review|Since you last looked/u);
assertOrdered(blankState, [
  'className="blank-state-focus"',
  'data-continuities-filter="shown-items"',
  'data-blank-state-continuity-list="v0.1"',
  "<ContinuitiesTemporalContext view={temporalContext} />",
  "<GuideBriefConversation\n            guide={guide}",
  "<ManagementSafety",
]);
const temporalContext = read(
  "lib/vnext/blank-state/continuities-temporal-context.ts",
);
assert.match(temporalContext, /projection\.next_moves/u);
assert.match(temporalContext, /projection\.recent_activity\.items/u);
assert.match(temporalContext, /activity\.occurred_at/u);
assert.doesNotMatch(
  temporalContext,
  /Date\(|Date\.now|setTimeout|localStorage|openDatabase|fetch\(/u,
);
const guideConversation = read(
  "components/guide/guide-brief-conversation.tsx",
);
assert.match(guideConversation, /<summary>Ask about this work<\/summary>/u);
assert.match(
  guideConversation,
  /presentation\?: "disclosure" \| "embedded"/u,
);
assert.match(guideConversation, /presentation === "embedded"/u);
assert.match(
  guideConversation,
  /data-augnes-visual-priority=\{SEMANTIC_VISUAL_PRIORITY\.supporting\}/u,
);
assert.doesNotMatch(
  guideConversation,
  /data-augnes-primary-action|data-augnes-independent-surface/u,
);
const continuitiesCss = read("app/continuities.css");
const rootLayout = read("app/layout.tsx");
const interFont = readBuffer(
  "app/fonts/inter-latin-wght-normal.woff2",
);
const interLicense = read("app/fonts/Inter-OFL-1.1.txt");
const interProvenance = read("app/fonts/README.md");
assert.equal(interFont.subarray(0, 4).toString("ascii"), "wOF2");
assert.equal(interFont.byteLength, 48_256);
assert.equal(
  createHash("sha256").update(interFont).digest("hex"),
  "3100e775e8616cd2611beecfa23a4263d7037586789b43f035236a2e6fbd4c62",
);
assert.equal(
  createHash("sha256").update(interLicense).digest("hex"),
  "3b0a5fca3d17942cde889069889dedbbbd075e9b599968c82a95f4d944e9b345",
);
assert.deepEqual(
  readdirSync(path.join(repoRoot, "app", "fonts")).filter((file) =>
    file.endsWith(".woff2"),
  ),
  ["inter-latin-wght-normal.woff2"],
);
assert.match(
  interLicense,
  /Copyright 2016 The Inter Project Authors/u,
);
assert.match(interLicense, /SIL OPEN FONT LICENSE Version 1\.1/u);
assert.match(interProvenance, /@fontsource-variable\/inter@5\.3\.0/u);
assert.match(
  interProvenance,
  /3100e775e8616cd2611beecfa23a4263d7037586789b43f035236a2e6fbd4c62/u,
);
assert.match(rootLayout, /import localFont from "next\/font\/local"/u);
assert.doesNotMatch(rootLayout, /next\/font\/google/u);
assert.match(
  rootLayout,
  /src: "\.\/fonts\/inter-latin-wght-normal\.woff2"/u,
);
assert.match(rootLayout, /variable: "--font-continuities-inter"/u);
assert.match(rootLayout, /display: "swap"/u);
assert.match(rootLayout, /weight: "100 900"/u);
assert.match(rootLayout, /style: "normal"/u);
assert.match(rootLayout, /"Apple SD Gothic Neo"/u);
assert.match(rootLayout, /"Noto Sans CJK KR"/u);
assert.match(rootLayout, /"Malgun Gothic"/u);
assert.match(rootLayout, /adjustFontFallback: false/u);
assert.match(rootLayout, /<body className=\{interLatin\.variable\}>/u);
assert.match(
  continuitiesCss,
  /\.product-shell\[data-primary-product-zone="blank-state"\]/u,
);
assert.match(continuitiesCss, /grid-template-columns: 244px minmax\(0, 1fr\)/u);
assert.match(
  continuitiesCss,
  /grid-template-columns: minmax\(0, 1fr\) minmax\(304px, 336px\)/u,
);
assert.match(continuitiesCss, /width: min\(620px, calc\(100% - 32px\)\)/u);
assert.match(continuitiesCss, /max-height: 82dvh/u);
for (const scopedToken of [
  "--continuities-canvas-high",
  "--continuities-panel",
  "--continuities-text",
  "--continuities-blue",
  "--continuities-violet",
  "--continuities-amber",
  "--continuities-border",
  "--continuities-shadow",
]) {
  assert.match(continuitiesCss, new RegExp(scopedToken, "u"));
}
for (const materialToken of [
  "--continuities-material-canvas-high",
  "--continuities-material-header",
  "--continuities-material-rail",
  "--continuities-material-card",
  "--continuities-material-onboarding",
  "--continuities-material-temporal",
  "--continuities-material-control",
  "--continuities-material-modal",
  "--continuities-reflection-soft",
  "--continuities-reflection-raised",
  "--continuities-lower-edge",
  "--continuities-shadow-card",
  "--continuities-shadow-temporal",
  "--continuities-shadow-onboarding",
  "--continuities-shadow-modal",
  "--continuities-inset-depth",
  "--continuities-selected-edge",
]) {
  assert.match(continuitiesCss, new RegExp(materialToken, "u"));
}
assert.match(
  continuitiesCss,
  /\.blank-state-continuity-item\[data-continuities-tone="amber"\]\s*\{[\s\S]{0,260}border-inline-start:\s*2px solid rgba\(214, 160, 75, 0\.58\)/u,
);
assert.match(
  continuitiesCss,
  /\.blank-state-continuity-item:hover\s*\{[\s\S]{0,260}filter:\s*brightness\(1\.025\)/u,
);
assert.match(
  continuitiesCss,
  /:is\([\s\S]{0,120}button:disabled,[\s\S]{0,80}\[aria-disabled="true"\][\s\S]{0,340}filter:\s*saturate\(0\.45\)/u,
);
assert.doesNotMatch(continuitiesCss, /animation:\s*[^;]*(?:noise|grain)/iu);
assert.match(
  continuitiesCss,
  /var\([\s\S]*--font-continuities-inter,[\s\S]*"Apple SD Gothic Neo",[\s\S]*"Noto Sans CJK KR",[\s\S]*"Malgun Gothic",[\s\S]*ui-sans-serif/u,
);
assert.doesNotMatch(continuitiesCss, /\bInter,\s*ui-sans-serif/u);
assert.doesNotMatch(continuitiesCss, /\.product-brand-mark/u);
assert.match(
  continuitiesCss,
  /\.continuities-item-details:not\(\[open\]\)[\s\S]*display:\s*none/u,
);
assert.match(continuitiesCss, /prefers-reduced-motion: reduce/u);
assert.match(
  continuitiesCss,
  /\.product-shell-rail-support:empty[\s\S]*display:\s*none/u,
);
assert.match(
  continuitiesCss,
  /\.blank-state-project-management--focused\s*\{[\s\S]{0,120}gap:\s*0/u,
);
assert.match(
  continuitiesCss,
  /\.project-onboarding-copy\s*\{[\s\S]{0,180}margin-top:\s*28px/u,
);
assert.match(
  continuitiesCss,
  /\.blank-state-project-settings\s*\{[\s\S]{0,420}rgba\(14, 29, 40, 0\.7\)/u,
);
assert.match(
  continuitiesCss,
  /a\.continuities-temporal-title\s*\{[\s\S]{0,240}text-decoration:\s*none/u,
);
assert.match(
  continuitiesCss,
  /a\.continuities-temporal-title:is\(:hover, :focus-visible\)\s*\{[\s\S]{0,160}text-decoration:\s*underline/u,
);
assert.match(continuitiesCss, /-webkit-line-clamp:\s*2/u);
assert.match(
  continuitiesCss,
  /\.product-project-context\s*\{[\s\S]{0,120}width:\s*fit-content[\s\S]{0,100}max-width:\s*min\(390px, 42vw\)/u,
);
assert.doesNotMatch(
  continuitiesCss,
  /\.continuities-recommendation-label\s*\{[\s\S]{0,180}position:\s*absolute/u,
);
assert.doesNotMatch(
  continuitiesCss,
  /repeating-(?:linear|radial)-gradient/u,
);
assert.match(continuitiesCss, /\.continuity-pins-navigation/u);
assert.match(continuitiesCss, /\.continuity-pins-mobile/u);
assert.match(continuitiesCss, /min-width:\s*44px/u);
assert.match(
  continuitiesCss,
  /@media \(max-width: 900px\)[\s\S]*\.continuities-item-details[\s\S]*>\s*summary[\s\S]*a\.continuities-temporal-title[\s\S]*min-height:\s*44px/u,
);
const browserValidation = read(
  "scripts/browser-validate-vnext-native-host-result-v0-1.mjs",
);
for (const assertion of [
  "onboarding_compact_order",
  "management_collapsed_height",
  "temporal_links_unadorned_until_interaction",
  "temporal_timestamps_separate",
  "continuity_copy_action_nonoverlap",
  "recommendation_action_nonoverlap",
  "temporal_stream_nonoverlap",
  "pinned_guide_nonoverlap",
  "augnes_owned_lower_left_overlay_absent",
  "mobile_touch_targets_minimum_size",
  "material_surfaces_differentiated",
  "attention_material_bounded",
  "continuity_titles_preserve_full_text",
  "more_context_default_secondary",
  "more_context_keyboard_focus_visible",
]) {
  assert.match(browserValidation, new RegExp(assertion, "u"));
}
assert.match(
  browserValidation,
  /width === 390 \? 844 : width === 430 \? 932 : width === 1280 \? 900 : 1000/u,
);
const continuityPinsUi = read(
  "components/continuity-pins/continuity-pins-ui.tsx",
);
assert.match(continuityPinsUi, />Pinned<\/p>/u);
assert.match(continuityPinsUi, /data-continuity-pin-move="up"/u);
assert.match(continuityPinsUi, /data-continuity-pin-move="down"/u);
assert.match(continuityPinsUi, /Pin \$\{item\.work_name\} to sidebar/u);
assert.match(continuityPinsUi, /collection\.revision < reorderFocus\.after_revision/u);
assert.match(continuityPinsUi, /control\?\.focus\(\)/u);
assert.doesNotMatch(continuityPinsUi, /aria-selected|localStorage/u);
const guidePublicText = read(
  "lib/vnext/guide-brief/public-guide-text.ts",
);
assert.match(
  guidePublicText,
  /local_operator_runtime_unavailable[\s\S]*Local work controls are currently unavailable\./u,
);

const workplaneShell = read(
  "components/workbench/ai-workplane/ai-workplane-shell.tsx",
);
assert.match(workplaneShell, /data-augnes-surface-role/u);
assert.match(
  workplaneShell,
  /<ul[\s\S]*className=\{styles\.boundaryBand\}[\s\S]*Results are not accepted automatically\.[\s\S]*<\/ul>/u,
);
assert.doesNotMatch(
  workplaneShell,
  /className=\{styles\.boundaryBand\}[\s\S]*<span>/u,
);

const guideRail = read("components/guide/project-guide-brief-rail.tsx");
for (const hook of [
  "data-guide-brief-core-goal",
  "data-guide-brief-core-constraint",
  "data-guide-brief-core-judgment",
]) {
  assert.match(guideRail, new RegExp(hook, "u"));
}
const guideBuilder = read("lib/vnext/guide-brief/project-guide-brief.ts");
const continuityBuilder = read(
  "lib/vnext/blank-state/blank-state-continuity.ts",
);
assert.equal(
  [...guideBuilder.matchAll(/buildBlankStateContinuityV01\(/gu)].length,
  1,
);
assert.doesNotMatch(guideBuilder, /decideFocusV02/u);
assert.match(continuityBuilder, /MAX_VISIBLE_ITEMS = 5/u);
assert.match(continuityBuilder, /compareCandidatesV01/u);
assert.match(continuityBuilder, /deduplicateCandidatesV01/u);
assert.match(continuityBuilder, /automationRequiresIntervention/u);
assert.match(
  guideBuilder,
  /important_constraints: boundedListV02\([\s\S]*forbidden_actions/u,
);
assert.match(
  guideBuilder,
  /unresolved_user_judgments: judgments\.map/u,
);

const resultReview = read(
  "components/workbench/result-review/run-result-review-surface.tsx",
);
assertOrdered(resultReview, [
  'data-ai-workplane-result-section="outcome"',
  'data-ai-workplane-result-section="next-step"',
  'data-ai-workplane-result-section="verification"',
  'data-ai-workplane-result-section="unresolved"',
]);
const resultVerificationStart = resultReview.indexOf(
  'data-ai-workplane-result-section="verification"',
);
const resultRiskStart = resultReview.indexOf(
  'data-ai-workplane-result-section="unresolved"',
);
assert.notEqual(resultVerificationStart, -1);
assert.notEqual(resultRiskStart, -1);
const resultVerificationOpeningTag = extractOpeningTagContaining(
  resultReview,
  'data-ai-workplane-result-section="verification"',
);
assert.match(
  resultVerificationOpeningTag,
  /aria-labelledby="result-verification-title"/u,
);
assert.match(
  resultVerificationOpeningTag,
  /data-ai-workplane-verification=\{view\.verification\.status\}/u,
);
assert.match(
  resultVerificationOpeningTag,
  /data-ai-workplane-result-section="verification"/u,
);
assert.match(
  resultVerificationOpeningTag,
  /data-augnes-visual-priority=\{SEMANTIC_VISUAL_PRIORITY\.aiSummary\}/u,
);
const resultVerificationBodyStart =
  resultReview.indexOf(">", resultVerificationStart) + 1;
const resultVerificationBody = resultReview.slice(
  resultVerificationBodyStart,
  resultRiskStart,
);
assert.match(
  resultVerificationBody,
  /<p className=\{styles\.kicker\}>AI summary<\/p>[\s\S]*<h2 id="result-verification-title">\{view\.verification\.label\}<\/h2>/u,
);
for (const verificationField of [
  "passed",
  "failed",
  "skipped",
  "satisfied",
  "unsatisfied",
  "unknown",
]) {
  assert.match(
    resultVerificationBody,
    new RegExp(`view\\.verification\\.${verificationField}`, "u"),
    `result AI summary preserves the ${verificationField} verification metric`,
  );
}
assert.match(
  resultVerificationBody,
  /view\.verification\.blockers\.length > 0[\s\S]*view\.verification\.blockers\.map/u,
);
const resultRiskAndExactDetail = resultReview.slice(resultRiskStart);
assert.match(
  resultRiskAndExactDetail,
  /data-augnes-visual-priority=\{SEMANTIC_VISUAL_PRIORITY\.risk\}/u,
);
assert.match(resultRiskAndExactDetail, /What remains unresolved/u);
assert.match(
  resultRiskAndExactDetail,
  /data-result-to-shared-inspector="true"[\s\S]*View exact details/u,
);
assert.match(resultReview, /data-result-review-read-only="true"/u);
assert.match(resultReview, /data-result-authority-boundary="true"/u);
assert.equal(
  [...resultReview.matchAll(/data-augnes-primary-action=/gu)].length >= 2,
  true,
);

const proposalReview = read(
  "components/workbench/semantic-review/decision-centered-proposal-detail.tsx",
);
const selectedWorkTimeline = read(
  "lib/vnext/ai-workplane/selected-work-timeline.ts",
);
const selectedWorkRelationships = read(
  "lib/vnext/ai-workplane/selected-work-relationships.ts",
);
const selectedWorkRelationshipContract = read(
  "types/vnext/selected-work-relationships.ts",
);
const strictIsoTimestamp = read("lib/vnext/strict-iso-timestamp.ts");
assert.match(
  selectedWorkTimeline,
  /@\/lib\/vnext\/strict-iso-timestamp/u,
);
assert.doesNotMatch(selectedWorkTimeline, /protocol-primitives|node:/u);
assert.doesNotMatch(strictIsoTimestamp, /node:/u);
assertOrdered(proposalReview, [
  'id="what-would-change-title"',
  "{timeline ? <SelectedWorkTimeline timeline={timeline} /> : null}",
  'id="your-decision-title"',
  "<SelectedWorkRelationshipExploration",
  "<SelectedWorkSupport view={view} />",
  'id="selected-work-later-feedback"',
  "<summary ref={advancedReviewSummaryRef}>Advanced review</summary>",
]);
assertOrdered(proposalReview, [
  'id="selected-work-timeline-title"',
  'id="selected-work-next-step-title"',
]);
assert.match(
  proposalReview,
  /data-vnext-review-next-change="true"[\s\S]*data-ai-workplane-primary-action="review-next-change"[\s\S]*data-augnes-primary-action="review-next-change"/u,
);
assert.match(
  selectedWorkTimeline,
  /export function selectNextSelectedWorkCandidateV01/u,
);
assert.equal(
  [
    ...selectedWorkTimeline.matchAll(
      /selectNextSelectedWorkCandidateV01\(/gu,
    ),
  ].length,
  2,
  "the timeline builder must consume its exported next-candidate owner",
);
assert.match(
  proposalReview,
  /selectNextSelectedWorkCandidateV01\(\{[\s\S]*selected_work_candidate_selection_owner_without_candidate/u,
);
assert.doesNotMatch(
  proposalReview,
  /candidateView\.decision_status === "needs_decision"[\s\S]*candidateView\.decision_status === "blocked"/u,
);
assert.match(
  proposalReview,
  /timeline\?\.current_position\.primary_action_owner === "transition"[\s\S]*id="selected-work-transition"[\s\S]*<SemanticTransitionActions/u,
);
assert.match(
  proposalReview,
  /data-selected-work-relationship-question-selector="true"/u,
);
assert.match(
  proposalReview,
  /data-selected-work-relationship-highlighted=\{String\(highlighted\)\}/u,
);
assert.match(
  proposalReview,
  /data-selected-work-relationship-semantic-authority="false"/u,
);
assertOrdered(proposalReview, [
  "<SelectedWorkRelationships",
  "<GuideBriefConversation",
]);
assert.match(
  proposalReview,
  /SEMANTIC_VISUAL_PRIORITY\.supporting/u,
);
assert.match(
  selectedWorkRelationshipContract,
  /SELECTED_WORK_RELATIONSHIPS_MAX_QUESTIONS_V01 = 4/u,
);
assert.match(
  selectedWorkRelationshipContract,
  /SELECTED_WORK_RELATIONSHIPS_MAX_CONNECTIONS_V01 = 6/u,
);
assert.match(
  selectedWorkRelationships,
  /timeline_remains_current_position_owner: true/u,
);
assert.match(
  selectedWorkRelationships,
  /creates_relation_record: false/u,
);
assert.match(
  selectedWorkRelationships,
  /calls_model_or_provider: false/u,
);
assert.doesNotMatch(
  selectedWorkRelationships,
  /readVNext|openDatabase|fetch\(|Date\.parse|node:/u,
);
const decisionForm = read(
  "components/workbench/semantic-review/review-decision-form.tsx",
);
assert.match(
  decisionForm,
  /data-vnext-default-decision-path-interactions="2"/u,
);
assert.match(decisionForm, /DEFAULT_DEFER_RATIONALE/u);
assert.match(decisionForm, /DEFAULT_REVISIT_CONDITION/u);
const transitionActions = read(
  "components/workbench/semantic-review/semantic-transition-actions.tsx",
);
assert.doesNotMatch(
  transitionActions,
  /data-(?:ai-workplane|augnes)-primary-action="return-home"/u,
);
assert.match(
  transitionActions,
  /className=\{styles\.secondaryButton\}[\s\S]*Return to AI Workplane/u,
);
for (const source of [
  blankState,
  workplaneShell,
  read("components/workbench/semantic-review/proposal-list.tsx"),
]) {
  assert.match(source, /data-augnes-state-badge/u);
}
assert.doesNotMatch(proposalReview, /data-augnes-state-badge/u);
assert.match(
  proposalReview,
  /aria-current=\{current \? "step" : undefined\}[\s\S]*statusLabel\(item\.status, current\)/u,
);

const inspector = read(
  "components/workbench/inspector/shared-project-inspector-surface.tsx",
);
assert.match(inspector, /SEMANTIC_SURFACE_ROLE\.inspector/u);
assert.match(inspector, /data-augnes-raw-record="true"/u);
assert.match(inspector, /data-inspector-read-only="true"/u);
assert.match(inspector, /data-inspector-semantic-mutation="false"/u);

const portability = read("app/portability/page.tsx");
const recovery = read("app/recovery/page.tsx");
assert.match(portability, /SEMANTIC_SURFACE_ROLE\.portability/u);
assert.match(recovery, /SEMANTIC_SURFACE_ROLE\.recovery/u);
assert.doesNotMatch(portability, /localBadge/u);
assert.doesNotMatch(recovery, /localBadge/u);
assert.match(recovery, /data-augnes-primary-action=\{action\.kind\}/u);

for (const component of [
  "components/blank-state/blank-state-client.tsx",
  "components/delegated-work/delegated-work-panel.tsx",
  "components/workbench/result-review/run-result-review-surface.tsx",
  "components/workbench/semantic-review/review-decision-form.tsx",
  "components/workbench/semantic-review/semantic-transition-actions.tsx",
  "app/portability/page.tsx",
  "app/recovery/page.tsx",
]) {
  assert.match(read(component), /data-augnes-primary-action/u, component);
}

for (const compatibilityPath of [
  "app/projects/page.tsx",
  "app/projects/[projectId]/page.tsx",
  "app/overview/page.tsx",
  "app/workbench/page.tsx",
  "app/workbench/semantic-review/page.tsx",
]) {
  assert.equal(existsSync(path.join(repoRoot, compatibilityPath)), true);
}

const workflowRoot = path.join(repoRoot, ".github/workflows");
assert.deepEqual(
  existsSync(workflowRoot)
    ? readdirSync(workflowRoot).filter((entry) => !entry.startsWith("."))
    : [],
  [],
);

const packageJson = JSON.parse(read("package.json"));
assert.equal(
  packageJson.scripts["test:c8-semantic-visual"],
  "node --import tsx scripts/test-c8-semantic-visual-contract.mjs",
);
assert.equal(
  packageJson.scripts["test:c8-visual-review"],
  "AUGNES_C8_CAPTURE_REVIEW=1 node --import tsx scripts/browser-validate-vnext-native-host-result-v0-1.mjs",
);

process.stdout.write(
  `${JSON.stringify({
    test: "c8-semantic-visual-contract",
    status: "pass",
    hierarchy: SEMANTIC_VISUAL_PRIORITIES,
    primary_navigation_destinations: 2,
    c9_compatibility_paths_preserved: true,
    github_workflow_files: 0,
  })}\n`,
);

function assertOrdered(source, values) {
  let previous = -1;
  for (const value of values) {
    const current = source.indexOf(value);
    assert(current > previous, `${value} is not in semantic order`);
    previous = current;
  }
}

function extractOpeningTagContaining(source, marker) {
  const markerIndex = source.indexOf(marker);
  assert.notEqual(markerIndex, -1, `opening-tag marker is absent: ${marker}`);
  const openingStart = source.lastIndexOf("<section", markerIndex);
  assert.notEqual(
    openingStart,
    -1,
    `no preceding section opening tag contains: ${marker}`,
  );
  const openingEnd = source.indexOf(">", openingStart);
  assert(
    openingEnd > markerIndex,
    `section opening tag is unterminated before marker: ${marker}`,
  );
  return source.slice(openingStart, openingEnd + 1);
}
