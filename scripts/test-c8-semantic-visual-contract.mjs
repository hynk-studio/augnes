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
const projectSettingsLink = read("components/project-settings-link.tsx");
const blankStateSurface = read(
  "components/blank-state/blank-state-surface.tsx",
);
const semanticReviewSurface = read(
  "components/workbench/semantic-review/semantic-review-surface.tsx",
);
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
const continuityPinsMarkup = read(
  "components/continuity-pins/continuity-pins-ui.tsx",
);
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
  /Select an existing folder on the computer running Augnes\. Augnes[\s\S]*links it as the local project root; this step does not upload the[\s\S]*folder\./u,
);
assert.match(blankState, /Use a regular folder or a Git repository\./u);
assert.match(blankState, /Choose a folder/u);
assert.match(blankState, /Enter the folder path instead/u);
assert.match(blankState, /Review folder/u);
assert.match(blankState, /Connect project/u);
assert.match(blankState, /Open project/u);
assert.match(blankState, /does not run Codex or change any files/u);
assert.match(blankState, /Project identity/u);
assert.match(blankState, /does not rename the local folder/u);
assert.match(blankState, /data-project-name-save="true"/u);
assert.match(productShell, /<ProjectSettingsLink/u);
assert.match(
  productShell,
  /projectContext\.label === "Current project" &&\s*projectContext\.managementHref/u,
);
assert.match(
  productShell,
  /<ProjectSettingsLink[\s\S]*href=\{projectContext\.managementHref\}/u,
);
assert.doesNotMatch(productShell, /\?\? "\/#project-settings"/u);
assert.match(
  blankStateSurface,
  /managementHref: presentationMode === "active_continuities"[\s\S]*\? "#project-settings"[\s\S]*: undefined/u,
);
assert.match(
  semanticReviewSurface,
  /label: "Current project"[\s\S]*managementHref: "\/#project-settings"/u,
);
assert.match(projectSettingsLink, /Manage current project/u);
assert.match(
  projectSettingsLink,
  /window\.dispatchEvent\(new Event\(PROJECT_SETTINGS_ACTIVATION_EVENT\)\)/u,
);
assert.doesNotMatch(projectSettingsLink, /preventDefault/u);
assert.match(
  blankState,
  /window\.addEventListener\([\s\S]*PROJECT_SETTINGS_ACTIVATION_EVENT[\s\S]*openAndFocusProjectSettings/u,
);
assert.match(blankState, /ownerId=\{/u);
assert.match(blankState, /\? "project-settings"/u);
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
  "<GuideBriefConversation",
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
  createHash("sha256")
    .update(interLicense.replaceAll("\r\n", "\n"))
    .digest("hex"),
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
  "--continuities-material-current",
  "--continuities-material-current-high",
  "--continuities-material-search",
  "--continuities-material-modal",
  "--continuities-ambient-light",
  "--continuities-ambient-light-soft",
  "--continuities-ambient-shade",
  "--continuities-ambient-shade-soft",
  "--continuities-ambient-sheen",
  "--continuities-header-reflection",
  "--continuities-header-edge",
  "--continuities-rail-reflection",
  "--continuities-modal-backdrop",
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
for (const raisedNeutralToken of [
  "--continuities-material-canvas-high: #3a454c",
  "--continuities-material-canvas-mid: #2d383f",
  "--continuities-material-canvas-low: #20292f",
  "--continuities-material-header: #222b31",
  "--continuities-material-rail: #182028",
  "--continuities-material-rail-high: #222a30",
  "--continuities-material-card: #2a4050",
  "--continuities-material-onboarding: #303a41",
  "--continuities-material-temporal: #303d45",
]) {
  assert.match(continuitiesCss, new RegExp(raisedNeutralToken, "u"));
}
const materialHex = (name) => {
  const value = continuitiesCss.match(
    new RegExp(`${name}:\\s*(#[0-9a-f]{6})`, "u"),
  )?.[1];
  assert.ok(value, `missing ${name} material token`);
  return value;
};
const materialRgb = (hex) => [
  Number.parseInt(hex.slice(1, 3), 16),
  Number.parseInt(hex.slice(3, 5), 16),
  Number.parseInt(hex.slice(5, 7), 16),
];
const materialLuminance = (hex) => {
  const channels = materialRgb(hex).map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return (
    0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
  );
};
const materialBlueDominance = (hex) => {
  const [red, , blue] = materialRgb(hex);
  return blue - red;
};
const canvasMid = materialHex("--continuities-material-canvas-mid");
const rail = materialHex("--continuities-material-rail");
const card = materialHex("--continuities-material-card");
const onboarding = materialHex("--continuities-material-onboarding");
const temporal = materialHex("--continuities-material-temporal");
const control = materialHex("--continuities-material-control");
const currentSituation = materialHex("--continuities-material-current");
const searchControl = materialHex("--continuities-material-search");
assert.ok(
  materialLuminance(canvasMid) > materialLuminance("#182832"),
  "the refined canvas must remain brighter than the prior CUX5 field",
);
assert.ok(
  Math.abs(
    materialLuminance(canvasMid) - materialLuminance("#253945"),
  ) < 0.001,
  "canvas neutralization must preserve the 9dbceb2 canvas luminance",
);
assert.ok(
  Math.abs(materialLuminance(rail) - materialLuminance("#10212c")) < 0.001,
  "rail neutralization must preserve the 9dbceb2 rail luminance",
);
assert.ok(
  materialBlueDominance(canvasMid) <
    materialBlueDominance("#253945") - 10,
  "canvas blue dominance must be materially lower than at 9dbceb2",
);
assert.ok(
  materialBlueDominance(rail) < materialBlueDominance("#10212c") - 10,
  "rail blue dominance must be materially lower than at 9dbceb2",
);
assert.ok(
  materialLuminance(rail) < materialLuminance(canvasMid),
  "the dry navigation rail must remain darker than the graphite canvas",
);
assert.ok(
  materialLuminance(card) > materialLuminance(canvasMid),
  "metallic continuity cards must remain raised above the canvas",
);
assert.ok(
  materialLuminance(control) < materialLuminance(card),
  "controls must remain inset relative to continuity cards",
);
assert.ok(
  materialLuminance(currentSituation) > materialLuminance(control) &&
    materialLuminance(currentSituation) < materialLuminance(canvasMid) &&
    materialLuminance(currentSituation) < materialLuminance(card),
  "Current situation must lift above the deepest control while remaining recessed below canvas and cards",
);
assert.ok(
  materialLuminance(searchControl) > materialLuminance(control) &&
    materialLuminance(searchControl) < materialLuminance(canvasMid) &&
    materialLuminance(searchControl) < materialLuminance(card),
  "search must remain inset without returning to the deepest control material",
);
assert.ok(
  materialBlueDominance(card) > materialBlueDominance(canvasMid) + 15,
  "continuity cards must remain perceptually cooler than the neutral canvas",
);
const [cardRed, , cardBlue] = materialRgb(card);
const [onboardingRed, , onboardingBlue] = materialRgb(onboarding);
const [temporalRed, , temporalBlue] = materialRgb(temporal);
assert.ok(
  cardBlue - cardRed > onboardingBlue - onboardingRed,
  "the onboarding slate must remain more neutral than metallic cards",
);
assert.ok(
  cardBlue - cardRed > temporalBlue - temporalRed,
  "Temporal must remain greyer and quieter than metallic cards",
);
for (const protectedMaterialToken of [
  "--continuities-material-card: #2a4050",
  "--continuities-material-card-high: #354f60",
  "--continuities-material-card-highlight: #3d5a6d",
  "--continuities-material-temporal: #303d45",
  "--continuities-material-temporal-high: #3b4850",
  "--continuities-material-control: #101e28",
  "--continuities-material-control-high: #162a37",
  "--continuities-material-modal: #182f3d",
  "--continuities-material-modal-high: #223c4b",
  "--continuities-blue: #76bce4",
  "--continuities-blue-strong: #a0d4ee",
  "--continuities-violet: #a88ad5",
  "--continuities-amber: #d6a04b",
]) {
  assert.match(continuitiesCss, new RegExp(protectedMaterialToken, "u"));
}
for (const protectedSurfaceRule of [
  /\.blank-state-continuity-item\s*\{(?<declarations>[^}]*)\}/u,
  /\.continuities-temporal-context\s*\{(?<declarations>[^}]*)\}/u,
  /\.continuities-guide-dialog\s*\{(?<declarations>[^}]*)\}/u,
]) {
  const declarations = continuitiesCss.match(protectedSurfaceRule)?.groups
    ?.declarations;
  assert.ok(declarations, "missing protected material surface rule");
  assert.doesNotMatch(
    declarations,
    /filter:\s*(?:saturate|grayscale|opacity)/u,
    "protected material surfaces must not receive a neutralization filter",
  );
}
const cux53MicroPolish = continuitiesCss.match(
  /CUX5\.3 mobile density and dark-control micro-polish\.[\s\S]*?(?=@media \(prefers-reduced-motion: reduce\))/u,
)?.[0];
assert.ok(cux53MicroPolish, "missing bounded CUX5.3 micro-polish rules");
for (const protectedSelector of [
  ".blank-state-continuity-item",
  ".continuities-temporal-context",
  ".continuities-guide-dialog",
  ".product-project-context",
]) {
  assert.equal(
    cux53MicroPolish.includes(protectedSelector),
    false,
    `${protectedSelector} must remain outside the CUX5.3 correction`,
  );
}
assert.doesNotMatch(
  cux53MicroPolish,
  /(?:^|[;{])\s*(?:display:\s*none|height:\s*\d|overflow:\s*hidden)/mu,
  "CUX5.3 must not hide or fixed-height clip semantic content",
);
assert.match(
  cux53MicroPolish,
  /\.continuities-current-situation\s*\{[\s\S]{0,260}var\(--continuities-material-current-high\)[\s\S]{0,120}var\(--continuities-material-current\)/u,
);
assert.match(
  cux53MicroPolish,
  /\.continuities-filter\s+input\s*\{[\s\S]{0,300}var\(--continuities-material-search\)/u,
);
assert.match(
  cux53MicroPolish,
  /\.product-shell-bar\s*\{[\s\S]{0,100}border-bottom-color:\s*var\(--continuities-header-edge\)/u,
);
assert.match(
  cux53MicroPolish,
  /@media \(max-width: 620px\)[\s\S]*\.blank-state-shell\s*\{[\s\S]{0,80}padding-top:\s*20px[\s\S]*\.continuity-pins-mobile\s+>\s+summary\s*\{[\s\S]{0,100}min-height:\s*44px[\s\S]*\.continuities-filter-controls\s*\{[\s\S]{0,100}gap:\s*6px;[\s\S]{0,60}margin-top:\s*10px[\s\S]*\.blank-state-continuity\s*\{[\s\S]{0,80}padding-top:\s*9px/u,
);
const ordinaryMobileGuideSupport = cux53MicroPolish.match(
  /\.continuities-guide-launcher\s*\{(?<declarations>[^}]*)\}/u,
)?.groups?.declarations;
assert.ok(ordinaryMobileGuideSupport);
assert.match(
  ordinaryMobileGuideSupport,
  /border-top-color:\s*var\(--continuities-border-soft\)/u,
);
assert.match(
  continuitiesCss,
  /:is\(a, button, input, summary\):focus-visible\s*\{[\s\S]{0,180}outline-color:\s*rgba\(160, 212, 238, 0\.84\)/u,
  "focus-visible precision treatment must remain stronger than ordinary support",
);
const precisionAccentUseCount = [
  ...continuitiesCss.matchAll(
    /var\(--continuities-(?:blue(?:-strong)?|selected-edge)\)/gu,
  ),
].length;
assert.equal(
  precisionAccentUseCount,
  13,
  "ambient neutralization must not expand precision-accent token coverage",
);
const cux5ActiveNavigationRule = [
  ...continuitiesCss.matchAll(
    /\.product-navigation\s+a\[aria-current="page"\]\s*\{(?<declarations>[^}]*)\}/gu,
  ),
].find((match) =>
  match.groups?.declarations.includes("rgba(118, 188, 228, 0.095)")
);
assert.ok(cux5ActiveNavigationRule?.groups?.declarations);
assert.doesNotMatch(
  cux5ActiveNavigationRule.groups.declarations,
  /inset\s+(?:2|3)px\s+0|--continuities-selected-edge/u,
  "the desktop active row must not duplicate the selected node with a cyan leading edge",
);
assert.match(
  continuitiesCss,
  /\.product-project-context--neutral\s*\{[\s\S]{0,280}display:\s*inline-flex[\s\S]{0,160}align-items:\s*baseline[\s\S]{0,160}gap:\s*8px/u,
);
assert.match(
  blankState,
  /data-project-message-tone=\{message\.tone\}[\s\S]{0,120}\{message\.text\}/u,
);
assert.match(
  continuitiesCss,
  /\[data-project-message-tone="error"\]\s*\{[\s\S]{0,220}border-inline-start:\s*2px solid rgba\(214, 160, 75, 0\.66\)/u,
);
assert.match(
  continuitiesCss,
  /\[data-project-message-tone="info"\][\s\S]{0,180}border-inline-start:\s*2px solid rgba\(118, 188, 228, 0\.32\)/u,
);
assert.match(
  continuitiesCss,
  /\.blank-state-continuity-item\[data-continuities-tone="amber"\]\s*\{[\s\S]{0,260}border-inline-start:\s*2px solid rgba\(214, 160, 75, 0\.58\)/u,
);
assert.match(
  continuitiesCss,
  /\.blank-state-continuity-item:hover\s*\{[\s\S]{0,260}filter:\s*brightness\(1\.025\)/u,
);
assert.match(
  continuityPinsMarkup,
  /<strong aria-disabled="true">\{pin\.label\}<\/strong>/u,
);
const disabledControlMaterialRule = continuitiesCss.match(
  /\.product-shell\[data-primary-product-zone="blank-state"\]\s+button:disabled\s*\{(?<declarations>[^}]*filter:\s*saturate\(0\.45\)[^}]*)\}/u,
);
assert.ok(disabledControlMaterialRule?.groups?.declarations);
assert.doesNotMatch(
  disabledControlMaterialRule[0],
  /\[aria-disabled="true"\]/u,
  "disabled material must remain scoped to interactive controls",
);
const unresolvedPinnedLabelRule = continuitiesCss.match(
  /\.product-shell\[data-primary-product-zone="blank-state"\]\s+\.continuity-pin-destination\s+strong\[aria-disabled="true"\]\s*\{(?<declarations>[^}]*)\}/u,
);
assert.ok(unresolvedPinnedLabelRule?.groups?.declarations);
for (const declaration of [
  /border:\s*0/u,
  /color:\s*var\(--continuities-text\)/u,
  /background:\s*transparent/u,
  /box-shadow:\s*none/u,
  /filter:\s*none/u,
  /opacity:\s*1/u,
]) {
  assert.match(unresolvedPinnedLabelRule.groups.declarations, declaration);
}
assert.match(
  continuitiesCss,
  /\[data-continuity-pin-resolution="temporarily_unavailable"\][\s\S]{0,240}\[data-continuity-pin-resolution="no_longer_supported"\][\s\S]{0,180}\.continuity-pin-indicator\s*\{[\s\S]{0,120}background:\s*var\(--continuities-violet\)/u,
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
assert.equal(packageJson.scripts["test:c8-visual-review"], undefined);

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
