import { lstatSync, readFileSync } from "node:fs";
import path from "node:path";

// Reviewed responsibility, not caller-authored commands or phase selection.
// Adding another family changes this integrity owner and requires Full.
export const RESEARCH_REGISTRATION_PATH = "scripts/canonical-research-tests.v1.json";
export const RESEARCH_OWNER_ID = "hypothesis-cache-study";
export const RESEARCH_SOURCE_PATHS = Object.freeze([
  "scripts/hypothesis-cache-study/README.md",
  "scripts/hypothesis-cache-study/check.mjs",
  "scripts/hypothesis-cache-study/environment.mjs",
  "scripts/hypothesis-cache-study/fixtures.json",
  "scripts/hypothesis-cache-study/io.mjs",
  "scripts/hypothesis-cache-study/scripted.mjs",
  "scripts/hypothesis-cache-study/seed.cjs",
  "scripts/hypothesis-cache-study/study.mjs",
  "scripts/test-hypothesis-cache-study.mjs",
]);
const fail = (reason) => { throw new Error(`research_registration_${reason}`); };

export function parseResearchRegistration(source) {
  if (typeof source !== "string" || Buffer.byteLength(source) > 4096) fail("unavailable");
  let value;
  try { value = JSON.parse(source); } catch { fail("invalid_json"); }
  // Canonical data also refuses duplicate JSON keys and ambiguous encodings.
  if (!value || Object.keys(value).join(",") !== "schema,test_ids" ||
      value.schema !== "augnes.canonical-research-tests.v1" || !Array.isArray(value.test_ids) ||
      JSON.stringify(value, null, 2) + "\n" !== source) fail("invalid_shape");
  if (new Set(value.test_ids).size !== value.test_ids.length) fail("duplicate_id");
  if (value.test_ids.some(id => id !== RESEARCH_OWNER_ID)) fail("unknown_id");
  return value.test_ids;
}

// modeAt reads either an exact Git tree or the physical checkout. Any research
// source present requires the complete family and its test, including in Full.
export function validateResearchRegistration(source, modeAt) {
  const ids = parseResearchRegistration(source);
  if (modeAt(RESEARCH_REGISTRATION_PATH) !== "100644") fail("unsafe_data_mode");
  const modes = RESEARCH_SOURCE_PATHS.map(modeAt);
  if (modes.some(Boolean) || ids.length) {
    if (!ids.includes(RESEARCH_OWNER_ID)) fail("missing_test");
    if (modes.some(mode => mode !== "100644")) fail("incomplete_or_unsafe_family");
  }
  return ids;
}

export function assertAdditiveResearchRegistration(before, after) {
  if (before.some(id => !after.includes(id))) fail("removal_or_replacement");
}

export function loadResearchTestSteps(repositoryRoot, existingIds = []) {
  const modeAt = relative => {
    let current = repositoryRoot;
    for (const [index, part] of relative.split("/").entries()) {
      current = path.join(current, part);
      const stat = lstatSync(current, { throwIfNoEntry: false });
      if (!stat) return null;
      if (stat.isSymbolicLink()) return "120000";
      if (index < relative.split("/").length - 1) {
        if (!stat.isDirectory()) return "unsafe";
      } else return stat.isFile() && !(stat.mode & 0o111) ? "100644" : "unsafe";
    }
  };
  if (modeAt(RESEARCH_REGISTRATION_PATH) !== "100644") fail("unsafe_data_mode");
  const ids = validateResearchRegistration(
    readFileSync(path.join(repositoryRoot, RESEARCH_REGISTRATION_PATH), "utf8"), modeAt,
  );
  if (ids.some(id => existingIds.includes(id))) fail("conflicting_id");
  return ids.map(id => ({
    id,
    group: "serial",
    requirements: ["filesystem", "immutable-fixture-input"],
    label: "hypothesis and adaptive memo cache study outputs, provenance and costs (zero model)",
    command: process.execPath,
    args: ["scripts/test-hypothesis-cache-study.mjs"],
    cwd: repositoryRoot,
    timeoutMs: 10_000,
    requireNaturalExit: true,
  }));
}
