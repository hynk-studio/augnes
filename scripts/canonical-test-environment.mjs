import path from "node:path";

// Each key is required by Node, npm, Chrome, or cross-platform process startup.
export const CANONICAL_AMBIENT_ENVIRONMENT_ALLOWLIST = Object.freeze([
  "PATH",
  "Path",
  "HOME",
  "USERPROFILE",
  "TMPDIR",
  "TMP",
  "TEMP",
  "SystemRoot",
  "WINDIR",
  "COMSPEC",
  "PATHEXT",
  "LANG",
  "LANGUAGE",
  "LC_ALL",
  "LC_CTYPE",
  "TZ",
  "TERM",
  "COLORTERM",
  "NO_COLOR",
  "FORCE_COLOR",
  "CI",
]);

// The browser test may need an operator-selected installed browser binary.
export const CANONICAL_OPTIONAL_AMBIENT_ENVIRONMENT_ALLOWLIST = Object.freeze([
  "AUGNES_BROWSER_EXECUTABLE_PATH",
]);

// These values are authored by the canonical suite, never copied from ambient state.
export const CANONICAL_STEP_ENVIRONMENT_ALLOWLIST = Object.freeze({
  AUGNES_CANONICAL_TEMP_ROOT:
    "exposes the suite-owned temporary root to the environment-isolation regression",
  AUGNES_DB_PATH:
    "binds a database-writing test to a suite-owned disposable database",
  AUGNES_CANONICAL_TEST_MODE:
    "enables test-only local adapters inside a suite-owned runtime",
  AUGNES_TEST_FOLDER_PICKER_PATH:
    "injects a picker result constrained to the suite-owned temporary root",
  AUGNES_TEST_FOLDER_PICKER_OUTCOME:
    "injects a non-path picker outcome inside a suite-owned runtime",
  AUGNES_RUNTIME_STATE_DIR:
    "binds runtime state to a child-owned disposable directory",
  AUGNES_BROWSER_E2E_SCOPE:
    "selects one repository-owned browser lifecycle lane without changing product state",
});

const CANONICAL_STEP_PATH_KEYS = new Set([
  "AUGNES_CANONICAL_TEMP_ROOT",
  "AUGNES_DB_PATH",
  "AUGNES_TEST_FOLDER_PICKER_PATH",
  "AUGNES_RUNTIME_STATE_DIR",
]);

const CANONICAL_CHILD_OWNED_ENVIRONMENT_KEYS = new Set([
  "AUGNES_CANONICAL_TEMP_ROOT",
  "AUGNES_DB_PATH",
  "AUGNES_RUNTIME_STATE_DIR",
]);

export function buildCanonicalChildEnvironment({
  ambientEnvironment = process.env,
  stepEnvironment = {},
  temporaryRoot,
  resourceRoot = temporaryRoot,
}) {
  if (typeof temporaryRoot !== "string" || !path.isAbsolute(temporaryRoot)) {
    throw new Error("canonical temporary root must be an absolute path");
  }
  if (
    typeof resourceRoot !== "string" ||
    !path.isAbsolute(resourceRoot)
  ) {
    throw new Error("canonical child resource root must be absolute");
  }
  if (
    !isPathInsideOrEqual(temporaryRoot, resourceRoot) &&
    path.dirname(path.resolve(resourceRoot)) !==
      path.dirname(path.resolve(temporaryRoot))
  ) {
    throw new Error(
      "canonical child resource root must be suite-owned OS-temporary state",
    );
  }

  const environment = { NODE_ENV: "test" };

  for (const key of CANONICAL_AMBIENT_ENVIRONMENT_ALLOWLIST) {
    copyNonEmptyString(environment, ambientEnvironment, key);
  }
  for (const key of CANONICAL_OPTIONAL_AMBIENT_ENVIRONMENT_ALLOWLIST) {
    copyNonEmptyString(environment, ambientEnvironment, key);
  }

  const homeRoot = path.join(resourceRoot, "home");
  const processTempRoot = resourceRoot;
  environment.HOME = homeRoot;
  environment.USERPROFILE = homeRoot;
  environment.TMPDIR = processTempRoot;
  environment.TMP = processTempRoot;
  environment.TEMP = processTempRoot;
  environment.AUGNES_CANONICAL_TEMP_ROOT = resourceRoot;
  environment.AUGNES_DB_PATH = path.join(resourceRoot, "canonical.db");
  environment.AUGNES_RUNTIME_STATE_DIR = path.join(resourceRoot, "runtime-state");

  for (const [key, value] of Object.entries(stepEnvironment)) {
    if (!(key in CANONICAL_STEP_ENVIRONMENT_ALLOWLIST)) {
      throw new Error(`canonical step environment key is not allowlisted: ${key}`);
    }
    if (typeof value !== "string" || value.length === 0) {
      throw new Error(`canonical step environment value must be non-empty: ${key}`);
    }
    if (
      CANONICAL_STEP_PATH_KEYS.has(key) &&
      !isPathInsideOrEqual(resourceRoot, value)
    ) {
      throw new Error(
        `canonical step path must remain inside the child resource root: ${key}`,
      );
    }
    environment[key] = value;
  }

  return environment;
}

export function findForbiddenAmbientKeysForwarded({
  ambientEnvironment = process.env,
  childEnvironment,
  stepEnvironment = {},
}) {
  const allowedAmbientKeys = new Set([
    ...CANONICAL_AMBIENT_ENVIRONMENT_ALLOWLIST,
    ...CANONICAL_OPTIONAL_AMBIENT_ENVIRONMENT_ALLOWLIST,
  ]);
  const explicitStepKeys = new Set(Object.keys(stepEnvironment));

  return Object.keys(childEnvironment)
    .filter(
      (key) =>
        key !== "NODE_ENV" &&
        !allowedAmbientKeys.has(key) &&
        !CANONICAL_CHILD_OWNED_ENVIRONMENT_KEYS.has(key) &&
        !explicitStepKeys.has(key) &&
        Object.hasOwn(ambientEnvironment, key),
    )
    .sort();
}

export function isPathInsideOrEqual(root, candidate) {
  if (!path.isAbsolute(candidate)) return false;
  const relative = path.relative(path.resolve(root), path.resolve(candidate));
  return (
    relative === "" ||
    (relative !== ".." &&
      !relative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relative))
  );
}

function copyNonEmptyString(target, source, key) {
  const value = source[key];
  if (typeof value === "string" && value.length > 0) target[key] = value;
}
