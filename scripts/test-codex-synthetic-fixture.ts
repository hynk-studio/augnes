import assert from "node:assert/strict";
import fs from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import path from "node:path";
import { assertCodexSyntheticAppServerPrefixV01, codexSyntheticIsolatedAppServerArgvForScanV01, resolveCodexSyntheticAppServerFixtureV01 } from "../lib/vnext/native-host/codex-synthetic-app-server-fixture.mjs";
import { CODEX_ISOLATED_AUTH_CONFIG_OVERRIDE_ARGS_V01 } from "../types/vnext/codex-isolated-auth-projection";

export function testCodexSyntheticFixtureIdentityV01(root: string): void {
  const fixed = resolveCodexSyntheticAppServerFixtureV01("ordinary_candidate");
  const alias = path.join(root, "fake-codex-app-server.mjs");
  const mode = process.env.AUGNES_CODEX_ORDINARY_CANDIDATE_TEST_MODE;
  const isolatedMode = process.env.AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE;
  const originalRead = fs.readFileSync;
  try {
    assertCodexSyntheticAppServerPrefixV01(fixed.command, fixed.prefix_args, "ordinary_candidate");
    process.env.AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE = "1";
    const args = [...fixed.prefix_args, ...CODEX_ISOLATED_AUTH_CONFIG_OVERRIDE_ARGS_V01, "app-server", "--stdio"];
    assert.deepEqual(codexSyntheticIsolatedAppServerArgvForScanV01(fixed.command, args),
      [fixed.command, "fixed-synthetic-app-server", ...args.slice(1)]);
    for (const altered of [[...args, "extra"], [...args, "prefix-sk-synthetic-suffix"], [args[0], ...args.slice(2)],
      [args[0], ...args.slice(1, -1), "embedded-xoxb-synthetic"]])
      assert.throws(() => codexSyntheticIsolatedAppServerArgvForScanV01(fixed.command, altered), /fixture_launch_invalid/);
    // Equal bytes and matching basename do not confer the fixed source identity.
    fs.copyFileSync(fixed.prefix_args[0], alias);
    assert.throws(() => assertCodexSyntheticAppServerPrefixV01(fixed.command, [alias], "ordinary_candidate"), /fixture_launch_invalid/);
    fs.unlinkSync(alias); fs.symlinkSync(fixed.prefix_args[0], alias);
    assert.throws(() => assertCodexSyntheticAppServerPrefixV01(fixed.command, [alias], "ordinary_candidate"), /fixture_launch_invalid/);
    for (const args of [[], [...fixed.prefix_args, "extra"], ["prefix-sk-synthetic-suffix"], [fixed.prefix_args[0] + "\n"]])
      assert.throws(() => assertCodexSyntheticAppServerPrefixV01(fixed.command, args, "ordinary_candidate"), /fixture_launch_invalid/);
    assert.throws(() => assertCodexSyntheticAppServerPrefixV01(alias, fixed.prefix_args, "ordinary_candidate"), /fixture_launch_invalid/);
    delete process.env.AUGNES_CODEX_ORDINARY_CANDIDATE_TEST_MODE;
    assert.throws(() => resolveCodexSyntheticAppServerFixtureV01("ordinary_candidate"), /test_mode_required/);
    process.env.AUGNES_CODEX_ORDINARY_CANDIDATE_TEST_MODE = "1";
    // Read-observation fault only: never mutate the checked-in fixture bytes.
    fs.readFileSync = ((file: fs.PathOrFileDescriptor, ...args: unknown[]) => file === fixed.prefix_args[0]
      ? Buffer.from("altered fixture bytes") : Reflect.apply(originalRead, fs, [file, ...args])) as typeof fs.readFileSync;
    syncBuiltinESMExports();
    assert.throws(() => resolveCodexSyntheticAppServerFixtureV01("ordinary_candidate"), /fixture_identity_invalid/);
  } finally {
    fs.readFileSync = originalRead; syncBuiltinESMExports();
    if (mode === undefined) delete process.env.AUGNES_CODEX_ORDINARY_CANDIDATE_TEST_MODE;
    else process.env.AUGNES_CODEX_ORDINARY_CANDIDATE_TEST_MODE = mode;
    if (isolatedMode === undefined) delete process.env.AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE;
    else process.env.AUGNES_CODEX_ISOLATED_AUTH_TEST_MODE = isolatedMode;
    if (fs.existsSync(alias)) fs.unlinkSync(alias);
  }
  assertCodexSyntheticAppServerPrefixV01(fixed.command, fixed.prefix_args, "ordinary_candidate");
  assert.equal(fs.existsSync(alias), false);
}
