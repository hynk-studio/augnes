import { createHash } from "node:crypto";
import { lstatSync, readFileSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Source-owned zero-network fixture, not a caller-selected trusted path. Changing
// its bytes requires an explicit source review of this pin and the fixture.
const FIXTURE_SHA256 = "d2a5c429a377fd28537bac870e02e87cb29564aa6985edb8e8caf174fb06046b";
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
  return [command, "fixed-synthetic-app-server", ...args.slice(1)];
}
