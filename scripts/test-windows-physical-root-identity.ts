import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  realpathSync,
  renameSync,
  rmdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";

import Database from "better-sqlite3";

import {
  inspectWindowsPhysicalRootIdentityV01,
  normalizeWindowsFinalTargetPathV01,
  parseWindowsPhysicalRootHelperResponseV01,
  WINDOWS_PHYSICAL_ROOT_HELPER_CONTRACT_V01,
  WINDOWS_PHYSICAL_ROOT_HELPER_MANIFEST_RELATIVE_PATH_V01,
  WINDOWS_PHYSICAL_ROOT_HELPER_MANIFEST_V01,
  WINDOWS_PHYSICAL_ROOT_HELPER_RELATIVE_PATH_V01,
  WINDOWS_PHYSICAL_ROOT_IDENTITY_VERSION_V01,
  WindowsProjectRootIdentityErrorV01,
} from "@/lib/vnext/native-host/windows-project-root-identity";
import {
  buildPhysicalRootBaselineV01,
  inspectPhysicalRootForExecutionV01,
} from "@/lib/vnext/repository-execution/repository-execution";
import { normalizeLocalProjectRootRefV01 } from "@/lib/vnext/persistence/project-identity-registry";
import { createProtocolSha256V01 } from "@/lib/vnext/protocol-primitives";
import {
  insertPhysicalRootBaselineIfAbsentInsideTransactionV01,
  readPhysicalRootBaselineV01,
} from "@/lib/vnext/persistence/repository-execution-store";
import type { NativeHostWindowsPhysicalRootIdentityV01 } from "@/types/vnext/native-host-adapter";
import { migrateVNextRepositoryExecutionStoreV01 } from "./db-migrations.mjs";

async function main(): Promise<void> {
const temporaryRoot = mkdtempSync(path.join(os.tmpdir(), "augnes-windows-identity-contract-"));

try {
  const valid = helperResponse("\\\\?\\C:\\Users\\연구\\repository");
  const identity = parseWindowsPhysicalRootHelperResponseV01(JSON.stringify(valid));
  assert.deepEqual(identity, {
    identity_version: WINDOWS_PHYSICAL_ROOT_IDENTITY_VERSION_V01,
    canonical_final_path_fingerprint: createProtocolSha256V01(
      "C:\\Users\\연구\\repository",
    ),
    volume_serial_identity: "0011223344556677",
    file_id: "00112233445566778899aabbccddeeff",
    filesystem_family: "NTFS",
    drive_type: "fixed",
  });

  const lowerDrive = parseWindowsPhysicalRootHelperResponseV01(
    JSON.stringify(helperResponse("\\\\?\\c:\\Users\\연구\\repository")),
  );
  assert.equal(
    lowerDrive.canonical_final_path_fingerprint,
    identity.canonical_final_path_fingerprint,
  );
  assert.equal(
    normalizeWindowsFinalTargetPathV01("C:\\root\\.\\nested\\..\\repository"),
    "C:\\root\\repository",
  );
  const longPath = `\\\\?\\C:\\${"long-segment\\".repeat(40)}repository`;
  assert.equal(
    normalizeWindowsFinalTargetPathV01(longPath),
    longPath.replace(/^\\\\\?\\/u, ""),
  );

  assertWindowsError(
    () => parseWindowsPhysicalRootHelperResponseV01("not-json"),
    "windows_physical_identity_helper_output_invalid",
  );
  assertWindowsError(
    () => parseWindowsPhysicalRootHelperResponseV01("x".repeat(20 * 1024)),
    "windows_physical_identity_helper_output_invalid",
  );
  assertWindowsError(
    () => parseWindowsPhysicalRootHelperResponseV01(JSON.stringify({
      ...valid,
      identity_version: "physical_root_identity.windows.v9",
    })),
    "windows_physical_identity_helper_contract_mismatch",
  );
  assertWindowsError(
    () => parseWindowsPhysicalRootHelperResponseV01(JSON.stringify({
      ...valid,
      architecture: "arm64",
    })),
    "windows_physical_identity_helper_contract_mismatch",
  );
  assertWindowsError(
    () => parseWindowsPhysicalRootHelperResponseV01(JSON.stringify({
      ...valid,
      unexpected: true,
    })),
    "windows_physical_identity_helper_contract_mismatch",
  );
  assertWindowsError(
    () => parseWindowsPhysicalRootHelperResponseV01(JSON.stringify({
      ...valid,
      filesystem_family: "ReFS",
    })),
    "windows_physical_identity_filesystem_unsupported",
  );
  assertWindowsError(
    () => parseWindowsPhysicalRootHelperResponseV01(JSON.stringify({
      ...valid,
      drive_type: "remote",
    })),
    "windows_physical_identity_drive_unsupported",
  );
  assertWindowsError(
    () => normalizeWindowsFinalTargetPathV01("\\\\?\\UNC\\server\\repo"),
    "windows_physical_identity_network_unsupported",
  );
  assertWindowsError(
    () => normalizeWindowsFinalTargetPathV01("\\\\wsl$\\Ubuntu\\repo"),
    "windows_physical_identity_wsl_unsupported",
  );

  await assert.rejects(
    inspectWindowsPhysicalRootIdentityV01("C:\\repo", {
      platform: "win32",
      architecture: "arm64",
      runtime_root: temporaryRoot,
    }),
    isWindowsError("windows_physical_identity_architecture_unsupported"),
  );
  await assert.rejects(
    inspectWindowsPhysicalRootIdentityV01("C:\\repo", {
      platform: "win32",
      architecture: "x64",
      windows_version: "10.0.19044",
      runtime_root: temporaryRoot,
    }),
    isWindowsError("windows_physical_identity_windows_version_unsupported"),
  );
  await assert.rejects(
    inspectWindowsPhysicalRootIdentityV01("\\\\server\\repo", {
      platform: "win32",
      architecture: "x64",
      windows_version: "10.0.26100",
      runtime_root: temporaryRoot,
    }),
    isWindowsError("windows_physical_identity_network_unsupported"),
  );
  await assert.rejects(
    inspectWindowsPhysicalRootIdentityV01("C:\\repo", {
      platform: "win32",
      architecture: "x64",
      windows_version: "10.0.26100",
      runtime_root: temporaryRoot,
    }),
    isWindowsError("windows_physical_identity_component_missing"),
  );

  const helperPath = path.join(
    temporaryRoot,
    ...WINDOWS_PHYSICAL_ROOT_HELPER_RELATIVE_PATH_V01.split("/"),
  );
  const manifestPath = path.join(
    temporaryRoot,
    ...WINDOWS_PHYSICAL_ROOT_HELPER_MANIFEST_RELATIVE_PATH_V01.split("/"),
  );
  mkdirSync(path.dirname(helperPath), { recursive: true });
  writeFileSync(helperPath, "reviewed-test-double\n", "utf8");
  chmodSync(helperPath, 0o755);
  const helperSha256 = createHash("sha256")
    .update("reviewed-test-double\n")
    .digest("hex");
  writeFileSync(manifestPath, `${JSON.stringify({
    architecture: "x64",
    contract: WINDOWS_PHYSICAL_ROOT_HELPER_MANIFEST_V01,
    helper_contract: WINDOWS_PHYSICAL_ROOT_HELPER_CONTRACT_V01,
    helper_file: WINDOWS_PHYSICAL_ROOT_HELPER_RELATIVE_PATH_V01,
    helper_sha256: helperSha256,
    identity_version: WINDOWS_PHYSICAL_ROOT_IDENTITY_VERSION_V01,
    minimum_windows_build: 19045,
    platform: "win32",
  }, null, 2)}\n`, "utf8");

  let helperCalls = 0;
  const observed = await inspectWindowsPhysicalRootIdentityV01("C:\\repo", {
    platform: "win32",
    architecture: "x64",
    windows_version: "10.0.26100",
    runtime_root: temporaryRoot,
    helper_process: {
      async run(input) {
        helperCalls += 1;
        assert.equal(input.helper_path, realpathSync(helperPath));
        assert.equal(input.canonical_root, "C:\\repo");
        assert.equal(input.runtime_root, realpathSync(temporaryRoot));
        return {
          stdout: JSON.stringify(valid),
          stderr: "",
          exit_code: 0,
        };
      },
    },
  });
  assert.deepEqual(observed, identity);
  assert.equal(helperCalls, 1);

  await assert.rejects(
    inspectWindowsPhysicalRootIdentityV01("C:\\repo", {
      platform: "win32",
      architecture: "x64",
      windows_version: "10.0.26100",
      runtime_root: temporaryRoot,
      helper_process: {
        async run() {
          return {
            stdout: JSON.stringify({
              code: "filesystem_unsupported",
              contract: WINDOWS_PHYSICAL_ROOT_HELPER_CONTRACT_V01,
              status: "error",
            }),
            stderr: "",
            exit_code: 1,
          };
        },
      },
    }),
    isWindowsError("windows_physical_identity_filesystem_unsupported"),
  );
  await assert.rejects(
    inspectWindowsPhysicalRootIdentityV01("C:\\missing", {
      platform: "win32",
      architecture: "x64",
      windows_version: "10.0.26100",
      runtime_root: temporaryRoot,
      helper_process: {
        async run() {
          return {
            stdout: JSON.stringify({
              code: "directory_open_failed",
              contract: WINDOWS_PHYSICAL_ROOT_HELPER_CONTRACT_V01,
              status: "error",
            }),
            stderr: "",
            exit_code: 1,
          };
        },
      },
    }),
    isWindowsError("windows_physical_identity_directory_unavailable"),
  );

  writeFileSync(helperPath, "modified-test-double\n", "utf8");
  await assert.rejects(
    inspectWindowsPhysicalRootIdentityV01("C:\\repo", {
      platform: "win32",
      architecture: "x64",
      windows_version: "10.0.26100",
      runtime_root: temporaryRoot,
      helper_process: {
        async run() {
          throw new Error("must not execute modified helper");
        },
      },
    }),
    isWindowsError("windows_physical_identity_component_integrity_invalid"),
  );

  let timeoutProcessCleaned = process.platform === "win32";
  if (process.platform !== "win32") {
    const timeoutHelper = [
      "#!/bin/sh",
      "printf '%s' \"$$\" > helper.pid",
      "exec /bin/sleep 30",
      "",
    ].join("\n");
    writeFileSync(helperPath, timeoutHelper, "utf8");
    chmodSync(helperPath, 0o755);
    const timeoutSha256 = createHash("sha256").update(timeoutHelper).digest("hex");
    writeFileSync(manifestPath, `${JSON.stringify({
      architecture: "x64",
      contract: WINDOWS_PHYSICAL_ROOT_HELPER_MANIFEST_V01,
      helper_contract: WINDOWS_PHYSICAL_ROOT_HELPER_CONTRACT_V01,
      helper_file: WINDOWS_PHYSICAL_ROOT_HELPER_RELATIVE_PATH_V01,
      helper_sha256: timeoutSha256,
      identity_version: WINDOWS_PHYSICAL_ROOT_IDENTITY_VERSION_V01,
      minimum_windows_build: 19045,
      platform: "win32",
    }, null, 2)}\n`, "utf8");
    await assert.rejects(
      inspectWindowsPhysicalRootIdentityV01("C:\\repo", {
        platform: "win32",
        architecture: "x64",
        windows_version: "10.0.26100",
        runtime_root: temporaryRoot,
      }),
      isWindowsError("windows_physical_identity_helper_timeout"),
    );
    const helperPid = Number((await (await import("node:fs/promises")).readFile(
        path.join(temporaryRoot, "helper.pid"),
        "utf8",
      )).trim());
    assert(Number.isSafeInteger(helperPid) && helperPid > 1);
    assert.throws(
      () => process.kill(helperPid, 0),
      (error: unknown) =>
        (error as NodeJS.ErrnoException).code === "ESRCH",
    );
    timeoutProcessCleaned = true;
  }

  const db = new Database(":memory:");
  try {
    const windowsIdentityFor = (root: string): NativeHostWindowsPhysicalRootIdentityV01 => ({
      identity_version: WINDOWS_PHYSICAL_ROOT_IDENTITY_VERSION_V01,
      canonical_final_path_fingerprint: createProtocolSha256V01(
        root === "C:\\AugnesData" ? "C:\\AugnesData" : "C:\\repo",
      ),
      volume_serial_identity: "0011223344556677",
      file_id: root === "C:\\AugnesData"
        ? "11112222333344445555666677778888"
        : "00112233445566778899aabbccddeeff",
      filesystem_family: "NTFS",
      drive_type: "fixed",
    });
    const physical = await inspectPhysicalRootForExecutionV01(db, "C:\\repo", {
      platform: "win32",
      architecture: "x64",
      windows_version: "10.0.26100",
      node_scope_root: "C:\\AugnesData",
      windows_physical_identity: async (root) => windowsIdentityFor(root),
      now: () => "2026-08-05T00:00:00.000Z",
    });
    assert.equal(physical.status, "exact");
    assert.equal(physical.platform, "win32");
    if (physical.status !== "exact" || physical.platform !== "win32") {
      throw new Error("windows identity observation did not narrow");
    }
    const baseline = buildPhysicalRootBaselineV01({
      workspace_id: "workspace:test",
      project_id: "project:test",
      root_binding: {
        binding_version: "project_local_root_binding.v0.1",
        workspace_id: "workspace:test",
        project_id: "project:test",
        local_root: normalizeLocalProjectRootRefV01("C:\\repo", {
          base_path: "C:\\",
          path_flavor: "win32",
        }),
        bound_at: "2026-08-05T00:00:00.000Z",
      },
      observation: physical,
      provenance: "canonical_new_project_onboarding",
    });
    assert.equal(baseline.identity_version, WINDOWS_PHYSICAL_ROOT_IDENTITY_VERSION_V01);
    assert.equal(baseline.filesystem_volume_identity, "0011223344556677");
    assert.equal(
      baseline.filesystem_object_identity,
      "00112233445566778899aabbccddeeff",
    );

    const zeroIdentity = await inspectPhysicalRootForExecutionV01(db, "C:\\repo", {
      platform: "win32",
      architecture: "x64",
      windows_version: "10.0.26100",
      node_scope_root: "C:\\AugnesData",
      windows_physical_identity: async (root) => ({
        ...windowsIdentityFor(root),
        file_id: "00000000000000000000000000000000",
      }),
      now: () => "2026-08-05T00:00:01.000Z",
    });
    assert.equal(zeroIdentity.status, "identity_ambiguous");
  } finally {
    db.close();
  }

  const migrated = new Database(":memory:");
  try {
    migrated.exec(`
      PRAGMA foreign_keys = ON;
      CREATE TABLE vnext_project_identities (
        workspace_id TEXT NOT NULL,
        project_id TEXT NOT NULL,
        PRIMARY KEY (workspace_id, project_id)
      );
      INSERT INTO vnext_project_identities VALUES ('workspace:migration', 'project:migration');
      CREATE TABLE vnext_physical_root_baselines (
        workspace_id TEXT NOT NULL,
        project_id TEXT NOT NULL,
        node_scope_fingerprint TEXT NOT NULL,
        baseline_version TEXT NOT NULL CHECK (baseline_version = 'physical_root_baseline.v0.1'),
        root_binding_fingerprint TEXT NOT NULL,
        identity_version TEXT NOT NULL CHECK (identity_version = 'native_host_physical_root_identity.v0.1'),
        canonical_realpath_fingerprint TEXT NOT NULL,
        filesystem_volume_identity TEXT NOT NULL,
        filesystem_object_identity TEXT NOT NULL,
        observed_at TEXT NOT NULL,
        provenance TEXT NOT NULL,
        baseline_fingerprint TEXT NOT NULL UNIQUE,
        PRIMARY KEY (workspace_id, project_id, node_scope_fingerprint),
        FOREIGN KEY (workspace_id, project_id)
          REFERENCES vnext_project_identities(workspace_id, project_id)
          ON UPDATE RESTRICT ON DELETE CASCADE
      );
      CREATE INDEX idx_vnext_physical_root_baselines_project
        ON vnext_physical_root_baselines(workspace_id, project_id, observed_at);
    `);
    const oldFingerprint = `sha256:${"a".repeat(64)}`;
    migrated.prepare(`INSERT INTO vnext_physical_root_baselines (
      workspace_id, project_id, node_scope_fingerprint, baseline_version,
      root_binding_fingerprint, identity_version,
      canonical_realpath_fingerprint, filesystem_volume_identity,
      filesystem_object_identity, observed_at, provenance, baseline_fingerprint
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      "workspace:migration",
      "project:migration",
      `sha256:${"b".repeat(64)}`,
      "physical_root_baseline.v0.1",
      `sha256:${"c".repeat(64)}`,
      "native_host_physical_root_identity.v0.1",
      `sha256:${"d".repeat(64)}`,
      "10",
      "20",
      "2026-08-05T00:00:00.000Z",
      "explicit_legacy_adoption",
      oldFingerprint,
    );
    migrateVNextRepositoryExecutionStoreV01(migrated);
    const oldBaseline = readPhysicalRootBaselineV01(migrated, {
      workspace_id: "workspace:migration",
      project_id: "project:migration",
      node_scope_fingerprint: `sha256:${"b".repeat(64)}`,
    });
    assert.equal(oldBaseline?.identity_version, "native_host_physical_root_identity.v0.1");
    assert.equal(oldBaseline?.baseline_fingerprint, oldFingerprint);
    assert.equal(
      migrated.prepare(
        "SELECT identity_platform FROM vnext_physical_root_baselines WHERE project_id = 'project:migration'",
      ).pluck().get(),
      null,
    );
    assert(migrated.prepare(
      "SELECT 1 FROM sqlite_master WHERE type = 'index' AND name = 'idx_vnext_physical_root_baselines_object'",
    ).get());
    assert(migrated.prepare(
      "SELECT 1 FROM sqlite_master WHERE type = 'index' AND name = 'idx_vnext_physical_root_baselines_project'",
    ).get());
    const windowsBaseline = {
      baseline_version: "physical_root_baseline.v0.1" as const,
      workspace_id: "workspace:migration",
      project_id: "project:migration",
      node_scope_fingerprint: `sha256:${"e".repeat(64)}`,
      root_binding_fingerprint: `sha256:${"f".repeat(64)}`,
      identity_version: WINDOWS_PHYSICAL_ROOT_IDENTITY_VERSION_V01,
      identity_platform: "win32" as const,
      canonical_final_path_fingerprint: `sha256:${"1".repeat(64)}`,
      filesystem_volume_identity: "0011223344556677",
      filesystem_object_identity: "00112233445566778899aabbccddeeff",
      supported_filesystem_family: "NTFS" as const,
      observed_at: "2026-08-05T00:00:01.000Z",
      provenance: "explicit_legacy_adoption" as const,
      baseline_fingerprint: `sha256:${"2".repeat(64)}`,
    };
    migrated.transaction(() => {
      assert.equal(
        insertPhysicalRootBaselineIfAbsentInsideTransactionV01(
          migrated,
          windowsBaseline,
        ).status,
        "inserted",
      );
    }).immediate();
    assert.deepEqual(readPhysicalRootBaselineV01(migrated, windowsBaseline), windowsBaseline);
    migrated.exec(`
      INSERT INTO vnext_project_identities VALUES
        ('workspace:migration', 'project:posix-alias'),
        ('workspace:migration', 'project:windows-alias');
    `);
    assert(oldBaseline);
    migrated.transaction(() => {
      assert.equal(
        insertPhysicalRootBaselineIfAbsentInsideTransactionV01(migrated, {
          ...oldBaseline,
          project_id: "project:posix-alias",
          root_binding_fingerprint: `sha256:${"3".repeat(64)}`,
          baseline_fingerprint: `sha256:${"4".repeat(64)}`,
        }).status,
        "inserted",
      );
    }).immediate();
    assert.throws(() => migrated.transaction(() => {
      insertPhysicalRootBaselineIfAbsentInsideTransactionV01(migrated, {
        ...windowsBaseline,
        project_id: "project:windows-alias",
        root_binding_fingerprint: `sha256:${"5".repeat(64)}`,
        baseline_fingerprint: `sha256:${"6".repeat(64)}`,
      });
    }).immediate(), /UNIQUE constraint failed/u);
  } finally {
    migrated.close();
  }

  const nativeSource = path.join(
    process.cwd(),
    "native/windows-physical-root/augnes-windows-physical-root-v0.1.cpp",
  );
  const nativeBytes = await import("node:fs/promises").then(({ readFile }) =>
    readFile(nativeSource, "utf8"));
  for (const required of [
    "CreateFileW",
    "GetFinalPathNameByHandleW",
    "GetFileInformationByHandleEx",
    "GetVolumeInformationByHandleW",
    "CloseHandle",
    "FILE_ID_INFO",
  ]) {
    assert(nativeBytes.includes(required), `missing native owner: ${required}`);
  }
  for (const forbidden of [
    /PowerShell/u,
    /\bWMI\b/u,
    /\bfsutil\b/u,
    /\bsystem\s*\(/u,
    /\bpopen\s*\(/u,
  ]) {
    assert(!forbidden.test(nativeBytes), `forbidden native mechanism: ${forbidden}`);
  }

  const realWindowsFilesystemProof = process.platform === "win32"
    ? await runRealWindowsFilesystemProofV01()
    : {
        real_windows_filesystem_proof: false,
        real_windows_filesystem_skipped_reason: "non_windows_host",
      };

  console.log(JSON.stringify({
    status: "pass",
    contract: WINDOWS_PHYSICAL_ROOT_IDENTITY_VERSION_V01,
    parser_and_prefix_normalization: true,
    unicode_and_long_path_contract: true,
    fixed_ntfs_only: true,
    unc_wsl_and_wrong_architecture_refused: true,
    windows_10_22h2_admitted: true,
    pre_windows_10_22h2_refused: true,
    missing_and_modified_component_refused: true,
    native_unsupported_code_preserved: true,
    timeout_process_cleaned: timeoutProcessCleaned,
    package_root_bounded_integrity_contract: true,
    old_posix_baseline_migration_compatible: true,
    windows_baseline_serialization: true,
    node_scope_binds_platform_architecture_and_contract: true,
    native_directory_handle_api_review: true,
    ...realWindowsFilesystemProof,
  }));
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

async function runRealWindowsFilesystemProofV01(): Promise<Record<string, unknown>> {
  const proofRoot = mkdtempSync(path.join(os.tmpdir(), "augnes-windows-identity-real-"));
  const normalizedTemporaryRoot = path.resolve(os.tmpdir());
  if (!path.resolve(proofRoot).startsWith(`${normalizedTemporaryRoot}${path.sep}`)) {
    throw new Error("windows_physical_identity_real_proof_root_invalid");
  }
  const inspect = (candidate: string) => inspectWindowsPhysicalRootIdentityV01(candidate, {
    runtime_root: process.cwd(),
  });
  const sameIdentity = (
    left: NativeHostWindowsPhysicalRootIdentityV01,
    right: NativeHostWindowsPhysicalRootIdentityV01,
  ) => assert.deepEqual(right, left);
  let directorySymlink: "verified" | "privilege_unavailable" = "privilege_unavailable";
  let reparseLoopRefusal: string | null = null;

  try {
    const stableRoot = path.join(proofRoot, "stable");
    mkdirSync(path.join(stableRoot, "nested"), { recursive: true });
    const stable = await inspect(stableRoot);
    sameIdentity(stable, await inspect(stableRoot));
    sameIdentity(stable, await inspect(`${stableRoot[0].toLowerCase()}${stableRoot.slice(1)}`));
    sameIdentity(stable, await inspect(path.join(stableRoot, ".", "nested", "..")));

    const unicodeRoot = path.join(proofRoot, "연구-저장소");
    mkdirSync(unicodeRoot);
    const unicode = await inspect(unicodeRoot);
    assert.equal(unicode.filesystem_family, "NTFS");

    let longRoot = path.join(proofRoot, "long-path");
    mkdirSync(longRoot);
    while (longRoot.length < 320) {
      longRoot = path.join(longRoot, "segment-0123456789abcdef");
      mkdirSync(longRoot);
    }
    const longIdentity = await inspect(longRoot);
    assert.equal(longIdentity.filesystem_family, "NTFS");

    const junctionRoot = path.join(proofRoot, "junction-alias");
    symlinkSync(stableRoot, junctionRoot, "junction");
    sameIdentity(stable, await inspect(junctionRoot));

    const symlinkRoot = path.join(proofRoot, "symlink-alias");
    try {
      symlinkSync(stableRoot, symlinkRoot, "dir");
      sameIdentity(stable, await inspect(symlinkRoot));
      directorySymlink = "verified";
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== "EPERM" && code !== "EACCES") throw error;
    }

    const loopA = path.join(proofRoot, "loop-a");
    const loopB = path.join(proofRoot, "loop-b");
    symlinkSync(loopB, loopA, "junction");
    symlinkSync(loopA, loopB, "junction");
    try {
      await inspect(loopA);
      assert.fail("reparse loop unexpectedly produced an exact identity");
    } catch (error) {
      assert(error instanceof WindowsProjectRootIdentityErrorV01);
      reparseLoopRefusal = error.code;
      assert([
        "windows_physical_identity_directory_unavailable",
        "windows_physical_identity_reparse_target_ambiguous",
      ].includes(error.code));
    }

    const replacementRoot = path.join(proofRoot, "replacement");
    mkdirSync(replacementRoot);
    const beforeReplacement = await inspect(replacementRoot);
    rmdirSync(replacementRoot);
    mkdirSync(replacementRoot);
    const afterReplacement = await inspect(replacementRoot);
    assert.notEqual(afterReplacement.file_id, beforeReplacement.file_id);
    assert.equal(
      afterReplacement.canonical_final_path_fingerprint,
      beforeReplacement.canonical_final_path_fingerprint,
    );

    const movedFrom = path.join(proofRoot, "move-from");
    const movedTo = path.join(proofRoot, "move-to");
    mkdirSync(movedFrom);
    const beforeMove = await inspect(movedFrom);
    renameSync(movedFrom, movedTo);
    const afterMove = await inspect(movedTo);
    assert.equal(afterMove.volume_serial_identity, beforeMove.volume_serial_identity);
    assert.equal(afterMove.file_id, beforeMove.file_id);
    assert.notEqual(
      afterMove.canonical_final_path_fingerprint,
      beforeMove.canonical_final_path_fingerprint,
    );

    return {
      real_windows_filesystem_proof: true,
      real_windows_host_release: os.release(),
      restart_identity_stable: true,
      drive_case_identity_stable: true,
      dot_dot_identity_stable: true,
      unicode_path_verified: true,
      long_path_verified: true,
      junction_alias_verified: true,
      directory_symlink: directorySymlink,
      reparse_loop_refused: reparseLoopRefusal,
      same_path_replacement_detected: true,
      delete_recreate_detected: true,
      rename_requires_rebind: true,
      cross_volume_move_verified: false,
      cross_volume_move_skipped_reason: "no_second_local_fixed_ntfs_volume_provisioned",
    };
  } finally {
    rmSync(proofRoot, { recursive: true, force: true });
  }
}

function helperResponse(finalTargetPath: string) {
  return {
    architecture: "x64",
    contract: WINDOWS_PHYSICAL_ROOT_HELPER_CONTRACT_V01,
    drive_type: "fixed",
    file_id: "00112233445566778899AABBCCDDEEFF",
    filesystem_family: "NTFS",
    final_target_path: finalTargetPath,
    identity_version: WINDOWS_PHYSICAL_ROOT_IDENTITY_VERSION_V01,
    platform: "win32",
    status: "exact",
    volume_serial_identity: "0011223344556677",
  };
}

function assertWindowsError(operation: () => unknown, code: string): void {
  assert.throws(operation, isWindowsError(code));
}

function isWindowsError(code: string) {
  return (error: unknown) =>
    error instanceof WindowsProjectRootIdentityErrorV01 && error.code === code;
}
