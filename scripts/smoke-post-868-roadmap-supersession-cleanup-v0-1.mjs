import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const oldRoadmapPath = "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";
const archiveRoadmapPath =
  "docs/archive/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL_SUPERSEDED_2026_06_30.md";
const posturePath = "docs/POST_868_DEVELOPMENT_POSTURE.md";
const longActivePlanPath =
  "docs/AUGNES_POST_868_CORE_HANDOFF_CONVERSATION_DEVELOPMENT_PLAN_V0_3.md";
const archiveDir = "docs/archive";
const indexPath = "docs/00_INDEX_LATEST.md";
const packagePath = "package.json";

for (const filePath of [oldRoadmapPath, archiveRoadmapPath, posturePath, indexPath, packagePath]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const oldRoadmap = readText(oldRoadmapPath);
const archivedRoadmap = readText(archiveRoadmapPath);
const posture = readText(posturePath);
const index = readText(indexPath);
const packageJson = JSON.parse(readText(packagePath));

assertNoActiveLongPost868Plan();
assertOldRoadmapSupersededBanner();
assertArchivePreserved();
assertPostureDoc();
assertIndexPointer();
assertNoCurrentPlanningPointerTreatsOldRoadmapAsActive();
assertNoIndexCurrentPlanningPointerTreatsOldRoadmapAsActive();
assertArchivedLongPlanIfPresent();
assertPackageScript();

console.log(
  JSON.stringify(
    {
      smoke: "post-868-roadmap-supersession-cleanup-v0-1",
      old_roadmap_superseded_banner_checked: true,
      archived_old_roadmap_checked: true,
      posture_doc_checked: true,
      no_active_long_post_868_plan_checked: true,
      latest_index_posture_pointer_checked: true,
      active_current_planning_old_roadmap_authority_absent: true,
      package_script_checked: true,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:post-868-roadmap-supersession-cleanup-v0-1");

function readText(filePath) {
  return readFileSync(filePath, "utf8");
}

function assertNoActiveLongPost868Plan() {
  assert.ok(
    !existsSync(longActivePlanPath),
    `${longActivePlanPath} must not exist as an active long-form plan`,
  );
}

function assertOldRoadmapSupersededBanner() {
  assert.match(
    oldRoadmap,
    /^# SUPERSEDED AFTER PR #868 - HISTORICAL COMPATIBILITY REFERENCE ONLY$/m,
    "old roadmap live path must start with a post-868 superseded banner",
  );
  assertIncludes(oldRoadmap, "Superseded after PR #868.");
  assertIncludes(oldRoadmap, "historical / compatibility reference only");
  assertIncludes(oldRoadmap, "It is not current PR sequencing authority.");
  assertIncludes(oldRoadmap, "Do not use this file for new slice selection.");
  assertIncludes(oldRoadmap, posturePath);
  assertNotIncludes(oldRoadmap, longActivePlanPath);
  assertIncludes(oldRoadmap, "This posture note is not a roadmap, not SSOT, and not PR sequencing authority.");
  assertIncludes(oldRoadmap, "There is no replacement long-form roadmap authority.");
  assertIncludes(oldRoadmap, "The current non-authority posture is Core first, Handoff first, Conversation");
  assertIncludes(oldRoadmap, "first, Web last.");
  assertIncludes(oldRoadmap, "New slice selection must come from explicit operator task prompts");
  assertIncludes(oldRoadmap, "not from");
  assertIncludes(oldRoadmap, "roadmap tables.");
  assertIncludes(oldRoadmap, archiveRoadmapPath);
  assertIncludes(oldRoadmap, "Historical body begins below.");
  assertIncludes(oldRoadmap, "Do not use the historical body below for current sequencing.");
  assertIncludes(
    oldRoadmap,
    "원문 문서 상태(역사적 원문, 현재 권위 아님): 향후 개발 지침서, PR sequencing guide, authority-boundary checklist",
  );
  assert.ok(
    !/^문서 상태: 향후 개발 지침서, PR sequencing guide, authority-boundary checklist$/m.test(
      oldRoadmap,
    ),
    "old roadmap original active-sounding status line must be qualified as historical",
  );
  assertIncludes(oldRoadmap, "Warning: do not use this section for current sequencing.");
  assertIncludes(oldRoadmap, "explicit operator task prompts");
  assertIncludes(oldRoadmap, "# Augnes");
  assertIncludes(oldRoadmap, "formation_receipt_durable_write_v0_1");
  assertIncludes(oldRoadmap, "research_retrieval_runtime_contract_v0_1");
  assertIncludes(oldRoadmap, "/ = public Augnes surface");
  assertIncludes(oldRoadmap, "/perspective = Perspective detail");
  assertIncludes(oldRoadmap, "/workbench = cockpit/workbench");
}

function assertArchivePreserved() {
  assertIncludes(archivedRoadmap, "ARCHIVED SUPERSEDED DOCUMENT");
  assertIncludes(archivedRoadmap, "HISTORICAL COMPATIBILITY REFERENCE ONLY");
  assertIncludes(archivedRoadmap, "Superseded after PR #868.");
  assertIncludes(archivedRoadmap, "not current PR sequencing");
  assertIncludes(archivedRoadmap, "Do not use this file for new slice selection.");
  assertIncludes(archivedRoadmap, posturePath);
  assertNotIncludes(archivedRoadmap, longActivePlanPath);
  assertIncludes(archivedRoadmap, "This posture note is not a roadmap, not SSOT, and not PR sequencing authority.");
  assertIncludes(archivedRoadmap, "The current non-authority posture is Core first, Handoff first, Conversation");
  assertIncludes(archivedRoadmap, "New slice selection must come from explicit operator task prompts");
  assertIncludes(archivedRoadmap, "Historical body begins below.");
  assertIncludes(
    archivedRoadmap,
    "원문 문서 상태(역사적 원문, 현재 권위 아님): 향후 개발 지침서, PR sequencing guide, authority-boundary checklist",
  );
  assertIncludes(archivedRoadmap, "# Augnes");
  assertIncludes(archivedRoadmap, "v0.2.1 FULL");
}

function assertPostureDoc() {
  assert.match(posture, /^# Post-#868 Development Posture$/m);
  for (const required of [
    "PR #868 is the web baseline.",
    "/ = public Augnes surface",
    "/perspective = Perspective detail",
    "/workbench = cockpit/workbench",
    "Web UI / public surface work is frozen unless explicitly reopened by the",
    "operator.",
    "Current posture is Core first, Handoff first, Conversation first, Web last.",
    "The old v0.2.1 FULL roadmap is historical / compatibility reference only.",
    "This posture doc is not a roadmap, not SSOT, and not PR sequencing authority.",
    "New slices must come from explicit operator task prompts, not from mining old",
    "or new roadmap docs.",
    "Codex must not infer new work from roadmap tables.",
    "Codex must not start UI, route, DB, provider, retrieval, product-write, GitHub",
    "actuation, or release work unless the operator explicitly asks for that slice.",
  ]) {
    assertIncludes(posture, required);
  }

  assertNotIncludes(posture, "## Development Lanes");
  assertNotIncludes(posture, "## Preferred future slices");
  assertNotIncludes(posture, "PR sequencing guide");
}

function assertIndexPointer() {
  assertIncludes(index, "Post-#868 development posture pointer");
  assertIncludes(index, posturePath);
  assertIncludes(index, "short non-authority posture /");
  assertIncludes(index, "guardrail note");
  assertIncludes(index, "not a roadmap, not SSOT, and not PR sequencing");
  assertIncludes(index, "New slices must come from explicit operator task prompts");
  assertIncludes(index, "Core first, Handoff first,");
  assertIncludes(index, "Conversation first, Web last");
  assertIncludes(index, archiveRoadmapPath);
  assertIncludes(index, "v0.2.1 FULL is superseded for current PR sequencing");
  assertIncludes(index, "used for new slice selection");
  assertIncludes(index, "historical roadmap content preserved");
  assertNotIncludes(index, longActivePlanPath);
  assertNotIncludes(index, "Post-#868 Core/Handoff/Conversation development plan pointer");
  assertNotIncludes(index, "current post-#868 development sequencing pointer");
  assertNotIncludes(index, "current PR sequencing and current development-plan orientation");

  const postureIndex = index.indexOf(posturePath);
  const oldRoadmapIndex = index.indexOf(oldRoadmapPath);
  assert.ok(postureIndex >= 0, "latest index must include posture doc");
  assert.ok(oldRoadmapIndex >= 0, "latest index may still mention old roadmap");
  assert.ok(
    postureIndex < oldRoadmapIndex,
    "latest index must point to the posture note before old roadmap provenance references",
  );
}

function assertNoCurrentPlanningPointerTreatsOldRoadmapAsActive() {
  const activePlanningTexts = {
    [oldRoadmapPath]: oldRoadmap,
    [posturePath]: posture,
    [indexPath]: index,
    "README.md": readText("README.md"),
    "AGENTS.md": readText("AGENTS.md"),
    "docs/AUGNES_START_HERE_FOR_USERS_AND_AI.md": readText(
      "docs/AUGNES_START_HERE_FOR_USERS_AND_AI.md",
    ),
  };

  const activeAuthorityPattern =
    /(current|active|latest|primary|preferred).{0,80}(PR sequencing|planning|development-plan|roadmap authority|authority)/i;
  const oldRoadmapPattern =
    /(AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL|v0\.2\.1 FULL|integrated roadmap guide v0\.2\.1 FULL)/i;
  const allowedSupersessionPattern =
    /(superseded|historical|archive|archived|provenance|not current|not active|not current PR sequencing authority|not current development-plan authority|compatibility reference|compatibility banner)/i;

  for (const [filePath, text] of Object.entries(activePlanningTexts)) {
    const lines = text.split(/\r?\n/);
    lines.forEach((line, index) => {
      if (
        oldRoadmapPattern.test(line) &&
        activeAuthorityPattern.test(line) &&
        !allowedSupersessionPattern.test(line)
      ) {
        assert.fail(
          `${filePath}:${index + 1} forbidden supersession regression: ${line}`,
        );
      }
    });
  }
}

function assertNoIndexCurrentPlanningPointerTreatsOldRoadmapAsActive() {
  const oldRoadmapPattern =
    /(AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL|v0\.2\.1 FULL|integrated roadmap guide v0\.2\.1 FULL)/i;
  const activeAuthorityPattern =
    /(current|active|latest|primary|preferred).{0,80}(PR sequencing|planning|development sequencing|development-plan|roadmap authority|authority)/i;
  const allowedSupersessionPattern =
    /(superseded|historical|archive|archived|provenance|not current|not active|must not be|older slice provenance|compatibility banner)/i;

  index.split(/\r?\n/).forEach((line, lineIndex) => {
    if (
      oldRoadmapPattern.test(line) &&
      activeAuthorityPattern.test(line) &&
      !allowedSupersessionPattern.test(line)
    ) {
      assert.fail(
        `${indexPath}:${lineIndex + 1} forbidden supersession regression: ${line}`,
      );
    }
  });
}

function assertArchivedLongPlanIfPresent() {
  if (!existsSync(archiveDir)) {
    return;
  }

  const archivedLongPlans = readdirSync(archiveDir).filter((fileName) =>
    fileName.includes("AUGNES_POST_868_CORE_HANDOFF_CONVERSATION_DEVELOPMENT_PLAN_V0_3"),
  );

  for (const fileName of archivedLongPlans) {
    assert.match(
      fileName,
      /NON_AUTHORITY_CHATGPT_PLANNING_DRAFT/i,
      `${fileName} must be named as a non-authority ChatGPT planning draft`,
    );
    const archivedPlan = readText(join(archiveDir, fileName));
    assertIncludes(archivedPlan, "non-authority ChatGPT planning draft");
    assertIncludes(archivedPlan, "not PR sequencing authority");
  }
}

function assertPackageScript() {
  assert.equal(
    packageJson.scripts?.["smoke:post-868-roadmap-supersession-cleanup-v0-1"],
    "node scripts/smoke-post-868-roadmap-supersession-cleanup-v0-1.mjs",
    "package.json must expose post-868 roadmap supersession smoke",
  );
}

function assertIncludes(text, phrase) {
  assert.ok(text.includes(phrase), `Expected text to include ${JSON.stringify(phrase)}`);
}

function assertNotIncludes(text, phrase) {
  assert.ok(!text.includes(phrase), `Expected text not to include ${JSON.stringify(phrase)}`);
}
