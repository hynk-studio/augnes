import { createHash } from "node:crypto";
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Source-owned zero-network fixture, not a caller-selected trusted path. Changing
// its bytes requires an explicit source review of this pin and the fixture.
const FIXTURE_SHA256 = "2185288c386c932828fce7cb83b1ae08583f0d5fcca0eccd6d78d3b4d67263af";
/** @typedef {"ordinary_candidate" | "isolated_auth"} TestMode */
/** @param {string} file */
const digest = (file) => createHash("sha256").update(readFileSync(file)).digest("hex");

/** @param {TestMode} mode @returns {{command: string, prefix_args: [string]}} */
export function resolveCodexSyntheticAppServerFixtureV01(mode) {
  const flag = mode === "ordinary_candidate"
    ? "AUGNES_CODEX_ORDINARY_CANDIDATE_TEST_MODE"
    : mode === "isolated_auth" ? "AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE" : null;
  if (!flag || process.env[flag] !== "1") throw new Error("codex_synthetic_fixture_test_mode_required");
  const fixture = fileURLToPath(new URL("../../../scripts/fixtures/fake-codex-app-server.mjs", import.meta.url));
  const command = realpathSync.native(process.execPath);
  try {
    const stat = lstatSync(fixture);
    if (realpathSync.native(fixture) !== fixture || !stat.isFile() || stat.isSymbolicLink() ||
        stat.nlink !== 1 || digest(fixture) !== FIXTURE_SHA256 || !lstatSync(command).isFile())
      throw new Error();
  } catch { throw new Error("codex_synthetic_fixture_identity_invalid"); }
  return { command, prefix_args: [fixture] };
}

/** @param {string} command @param {string[]} values @param {TestMode} mode */
export function assertCodexSyntheticAppServerPrefixV01(command, values, mode) {
  const expected = resolveCodexSyntheticAppServerFixtureV01(mode);
  if (command !== expected.command || values.length !== 1 || values[0] !== expected.prefix_args[0])
    throw new Error("codex_synthetic_fixture_launch_invalid");
}

/** Project only independently validated fixed locators, never arbitrary paths.
 * Consumers validate their entire permitted argument tail before calling this.
 * @param {string} command @param {string[]} prefix @param {TestMode} mode
 */
export function codexSyntheticAppServerPrefixForScanV01(command, prefix, mode) {
  assertCodexSyntheticAppServerPrefixV01(command, prefix, mode);
  return { command: "selected-node-executable", prefix_args: ["fixed-synthetic-app-server"] };
}

/** Exact JSON sequence of CODEX_ISOLATED_AUTH_CONFIG_OVERRIDE_ARGS_V01 followed
 * by app-server/--stdio. Kept in this plain-JS owner so each fixture child does
 * not initialize a TypeScript loader. The contract test exercises that sequence.
 * @param {string} command @param {string[]} args
 */
export function codexSyntheticIsolatedAppServerArgvForScanV01(command, args) {
  assertCodexSyntheticAppServerPrefixV01(command, args.slice(0, 1), "isolated_auth");
  if (createHash("sha256").update(JSON.stringify(args.slice(1))).digest("hex") !==
      "5b356bd7d22486161cf2ea85a89f6dc3b8c25418879621d8f42c861eafe8a3ed")
    throw new Error("codex_synthetic_fixture_launch_invalid");
  const fixed = codexSyntheticAppServerPrefixForScanV01(command, args.slice(0, 1), "isolated_auth");
  return [fixed.command, ...fixed.prefix_args, ...args.slice(1)];
}
