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
});

const CANONICAL_STEP_PATH_KEYS = new Set(
  Object.keys(CANONICAL_STEP_ENVIRONMENT_ALLOWLIST),
);

export function buildCanonicalChildEnvironment({
  ambientEnvironment = process.env,
  stepEnvironment = {},
  temporaryRoot,
}) {
  if (typeof temporaryRoot !== "string" || !path.isAbsolute(temporaryRoot)) {
    throw new Error("canonical temporary root must be an absolute path");
  }

  const environment = { NODE_ENV: "test" };

  for (const key of CANONICAL_AMBIENT_ENVIRONMENT_ALLOWLIST) {
    copyNonEmptyString(environment, ambientEnvironment, key);
  }
  for (const key of CANONICAL_OPTIONAL_AMBIENT_ENVIRONMENT_ALLOWLIST) {
    copyNonEmptyString(environment, ambientEnvironment, key);
  }

  for (const [key, value] of Object.entries(stepEnvironment)) {
    if (!(key in CANONICAL_STEP_ENVIRONMENT_ALLOWLIST)) {
      throw new Error(`canonical step environment key is not allowlisted: ${key}`);
    }
    if (typeof value !== "string" || value.length === 0) {
      throw new Error(`canonical step environment value must be non-empty: ${key}`);
    }
    if (
      CANONICAL_STEP_PATH_KEYS.has(key) &&
      !isPathInsideOrEqual(temporaryRoot, value)
    ) {
      throw new Error(
        `canonical step path must remain inside the suite temporary root: ${key}`,
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
