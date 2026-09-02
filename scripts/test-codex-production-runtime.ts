import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  CodexProductionRuntimeErrorV01,
  assertCodexProductionRuntimeIdentityUnchangedV01,
  resolveCodexProductionRuntimeForTestV01,
} from "../lib/vnext/native-host/codex-production-runtime";
import {
  observeOrdinaryCodexAppServerUserAgentV01,
  resolveDefaultCodexAppServerLaunchV01,
} from "../lib/vnext/native-host/codex-app-server-adapter";

const root = realpathSync(
  mkdtempSync(path.join(tmpdir(), "augnes-codex-runtime-test-")),
);
const previousTestMode = process.env.AUGNES_CODEX_PRODUCTION_RUNTIME_TEST_MODE;
process.env.AUGNES_CODEX_PRODUCTION_RUNTIME_TEST_MODE = "1";

try {
  directNativeIsAdmittedV01();
  symlinkNativeIsCanonicalizedV01();
  staleAndNewerVersionsAreRejectedV01();
  wrongFingerprintIsRejectedV01();
  firstPathEntryWinsV01();
  unknownWrapperIsRejectedV01();
  officialOpenAiWrapperIsBoundToVendorNativeV01();
  identityDriftIsRejectedV01();
  absentPathRuntimeIsClassifiedV01();
  canonicalFakeRouteRemainsUnchangedV01();
  ordinaryPostSpawnIdentityIsExactV01();
  console.log("codex production runtime resolver: passed");
} finally {
  if (previousTestMode === undefined) {
    delete process.env.AUGNES_CODEX_PRODUCTION_RUNTIME_TEST_MODE;
  } else {
    process.env.AUGNES_CODEX_PRODUCTION_RUNTIME_TEST_MODE = previousTestMode;
  }
  rmSync(root, { recursive: true, force: true });
}

function directNativeIsAdmittedV01(): void {
  const directory = fixtureDirectoryV01("direct");
  const executable = nativeFixtureV01(path.join(directory, "codex"), "direct");
  const identity = resolveFixtureV01({
    path_value: directory,
    expected_fingerprint: sha256V01(executable),
    read_cli_version: (value) => {
      assert.equal(value, executable);
      return "0.152.1";
    },
  });
  assert.equal(identity.launch_shape, "direct_native");
  assert.equal(identity.canonical_native_executable, executable);
  assert.equal(path.isAbsolute(identity.canonical_native_executable), true);
  assertCodexProductionRuntimeIdentityUnchangedV01(identity);
}

function symlinkNativeIsCanonicalizedV01(): void {
  const directory = fixtureDirectoryV01("symlink");
  const targetDirectory = fixtureDirectoryV01("symlink-target");
  const executable = nativeFixtureV01(
    path.join(targetDirectory, "codex-native"),
    "symlink",
  );
  symlinkSync(executable, path.join(directory, "codex"));
  const identity = resolveFixtureV01({
    path_value: directory,
    expected_fingerprint: sha256V01(executable),
    read_cli_version: () => "0.152.1",
  });
  assert.equal(identity.launch_shape, "symlink_to_native");
  assert.equal(identity.path_candidate_was_symlink, true);
  assert.equal(identity.canonical_native_executable, executable);
}

function staleAndNewerVersionsAreRejectedV01(): void {
  for (const version of ["0.150.1", "0.153.0"]) {
    const directory = fixtureDirectoryV01(`version-${version}`);
    const executable = nativeFixtureV01(
      path.join(directory, "codex"),
      version,
    );
    expectRuntimeCodeV01(
      () =>
        resolveFixtureV01({
          path_value: directory,
          expected_fingerprint: sha256V01(executable),
          read_cli_version: () => version,
        }),
      "codex_production_runtime_identity_mismatch",
    );
  }
}

function wrongFingerprintIsRejectedV01(): void {
  const directory = fixtureDirectoryV01("wrong-fingerprint");
  nativeFixtureV01(path.join(directory, "codex"), "wrong-fingerprint");
  let versionProbeCalled = false;
  expectRuntimeCodeV01(
    () =>
      resolveFixtureV01({
        path_value: directory,
        expected_fingerprint: `sha256:${"0".repeat(64)}`,
        read_cli_version: () => {
          versionProbeCalled = true;
          return "0.152.1";
        },
      }),
    "codex_production_runtime_identity_mismatch",
  );
  assert.equal(versionProbeCalled, false);
}

function firstPathEntryWinsV01(): void {
  const wrongDirectory = fixtureDirectoryV01("path-wrong-first");
  const exactDirectory = fixtureDirectoryV01("path-exact-second");
  nativeFixtureV01(path.join(wrongDirectory, "codex"), "wrong-first");
  const exact = nativeFixtureV01(
    path.join(exactDirectory, "codex"),
    "exact-second",
  );
  expectRuntimeCodeV01(
    () =>
      resolveFixtureV01({
        path_value: [wrongDirectory, exactDirectory].join(path.delimiter),
        expected_fingerprint: sha256V01(exact),
        read_cli_version: () => "0.152.1",
      }),
    "codex_production_runtime_identity_mismatch",
  );
}

function unknownWrapperIsRejectedV01(): void {
  const directory = fixtureDirectoryV01("unknown-wrapper");
  const wrapper = path.join(directory, "codex");
  writeFileSync(wrapper, "#!/bin/sh\nexit 0\n", { mode: 0o755 });
  expectRuntimeCodeV01(
    () =>
      resolveFixtureV01({
        path_value: directory,
        expected_fingerprint: sha256V01(wrapper),
        read_cli_version: () => "0.152.1",
      }),
    "codex_production_runtime_launch_shape_unsupported",
  );
}

function officialOpenAiWrapperIsBoundToVendorNativeV01(): void {
  const globalBin = fixtureDirectoryV01("official-wrapper-bin");
  const packageRoot = fixtureDirectoryV01("official-wrapper-package");
  const launcherDirectory = path.join(packageRoot, "bin");
  mkdirSync(launcherDirectory, { recursive: true });
  const launcher = path.join(launcherDirectory, "codex.js");
  writeFileSync(launcher, "#!/usr/bin/env node\n// exact test launcher\n", {
    mode: 0o755,
  });
  writeFileSync(
    path.join(packageRoot, "package.json"),
    JSON.stringify({
      name: "@openai/codex",
      version: "0.152.1",
      bin: { codex: "bin/codex.js" },
    }),
  );
  const platformRoot = path.join(
    packageRoot,
    "node_modules",
    "@openai",
    "codex-darwin-arm64",
  );
  const nativeDirectory = path.join(
    platformRoot,
    "vendor",
    "aarch64-apple-darwin",
    "bin",
  );
  mkdirSync(nativeDirectory, { recursive: true });
  writeFileSync(
    path.join(platformRoot, "package.json"),
    JSON.stringify({
      name: "@openai/codex",
      version: "0.152.1-darwin-arm64",
    }),
  );
  const executable = nativeFixtureV01(
    path.join(nativeDirectory, "codex"),
    "official-vendor",
  );
  symlinkSync(launcher, path.join(globalBin, "codex"));
  const identity = resolveFixtureV01({
    path_value: globalBin,
    expected_fingerprint: sha256V01(executable),
    expected_official_launcher_fingerprint: sha256V01(launcher),
    read_cli_version: (value) => {
      assert.equal(value, executable);
      return "0.152.1";
    },
  });
  assert.equal(identity.launch_shape, "official_openai_node_launcher");
  assert.equal(identity.official_package_shape, "nested_platform_package");
  assert.equal(identity.canonical_native_executable, executable);
  const launch = resolveDefaultCodexAppServerLaunchV01(
    { NODE_ENV: "test", PATH: globalBin },
    { resolve_production_runtime: () => identity },
  );
  assert.equal(launch.command, executable);
  assert.equal(launch.production_runtime_identity, identity);
  assert.deepEqual(launch.prefix_args, []);
}

function identityDriftIsRejectedV01(): void {
  const directory = fixtureDirectoryV01("identity-drift");
  const executable = nativeFixtureV01(path.join(directory, "codex"), "before");
  expectRuntimeCodeV01(
    () =>
      resolveFixtureV01({
        path_value: directory,
        expected_fingerprint: sha256V01(executable),
        read_cli_version: () => "0.152.1",
        before_final_identity_check: () => {
          nativeFixtureV01(executable, "after");
        },
      }),
    "codex_production_runtime_identity_changed",
  );
}

function absentPathRuntimeIsClassifiedV01(): void {
  const directory = fixtureDirectoryV01("absent");
  expectRuntimeCodeV01(
    () =>
      resolveFixtureV01({
        path_value: directory,
        expected_fingerprint: `sha256:${"0".repeat(64)}`,
        read_cli_version: () => "0.152.1",
      }),
    "codex_production_runtime_not_found",
  );
}

function canonicalFakeRouteRemainsUnchangedV01(): void {
  const launch = resolveDefaultCodexAppServerLaunchV01({
    ...process.env,
    AUGNES_CANONICAL_TEST_MODE: "1",
  });
  assert.equal(launch.command, process.execPath);
  assert.equal(launch.prefix_args?.length, 1);
  assert.equal(
    launch.prefix_args?.[0],
    path.join(
      process.cwd(),
      "scripts",
      "fixtures",
      "fake-codex-app-server.mjs",
    ),
  );
  assert.equal(launch.production_runtime_identity, undefined);
}

function ordinaryPostSpawnIdentityIsExactV01(): void {
  assert.equal(
    observeOrdinaryCodexAppServerUserAgentV01(
      "augnes/0.152.1 (Mac OS 15.7.1; arm64) fake-terminal/1.0 (augnes; codex_app_server_adapter.v0.1)",
    ),
    "0.152.1",
  );
  for (const userAgent of [
    "augnes/0.151.0 (Mac OS 15.7.1; arm64) fake-terminal/1.0 (augnes; codex_app_server_adapter.v0.1)",
    "codex-cli/fake-0.152.1",
  ]) {
    expectRuntimeCodeV01(
      () => observeOrdinaryCodexAppServerUserAgentV01(userAgent),
      "codex_production_runtime_protocol_drift",
    );
  }
}

function resolveFixtureV01(input: {
  path_value: string;
  expected_fingerprint: string;
  expected_official_launcher_fingerprint?: string;
  read_cli_version(nativeExecutable: string): string;
  before_final_identity_check?: () => void;
}) {
  return resolveCodexProductionRuntimeForTestV01({
    environment: { NODE_ENV: "test", PATH: input.path_value },
    cwd: root,
    expected_executable_fingerprint: input.expected_fingerprint,
    expected_official_launcher_fingerprint:
      input.expected_official_launcher_fingerprint,
    read_cli_version: input.read_cli_version,
    before_final_identity_check: input.before_final_identity_check,
  });
}

function fixtureDirectoryV01(name: string): string {
  const value = path.join(root, name);
  mkdirSync(value, { recursive: true });
  return value;
}

function nativeFixtureV01(value: string, label: string): string {
  writeFileSync(
    value,
    Buffer.concat([
      Buffer.from([0xcf, 0xfa, 0xed, 0xfe]),
      Buffer.from(`augnes-test-${label}`, "utf8"),
    ]),
  );
  chmodSync(value, 0o755);
  return value;
}

function sha256V01(value: string): string {
  const bytes = readFileSync(value);
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

function expectRuntimeCodeV01(action: () => unknown, code: string): void {
  assert.throws(
    action,
    (error: unknown) =>
      error instanceof CodexProductionRuntimeErrorV01 && error.code === code,
  );
}
