import { stat, realpath } from "node:fs/promises";
import path from "node:path";

import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import type { NativeHostPhysicalRootIdentityV01 } from "@/types/vnext/native-host-adapter";

export class NativeHostProjectRootIdentityErrorV01 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "NativeHostProjectRootIdentityErrorV01";
  }
}

export interface ProjectRootIdentityFilesystemV01 {
  realpath(pathname: string): Promise<string>;
  stat(pathname: string): Promise<{
    dev: number | bigint;
    ino: number | bigint;
    isDirectory(): boolean;
  }>;
}

const SYSTEM_PROJECT_ROOT_IDENTITY_FILESYSTEM_V01: ProjectRootIdentityFilesystemV01 = {
  realpath,
  stat,
};

export async function inspectNativeHostPhysicalRootIdentityV01(
  canonicalRoot: string,
  filesystem: ProjectRootIdentityFilesystemV01 =
    SYSTEM_PROJECT_ROOT_IDENTITY_FILESYSTEM_V01,
): Promise<NativeHostPhysicalRootIdentityV01> {
  if (!path.isAbsolute(canonicalRoot) || canonicalRoot.includes("\0")) {
    throw new NativeHostProjectRootIdentityErrorV01(
      "native_host_project_root_identity_invalid",
    );
  }
  let resolvedRoot: string;
  let rootStat: Awaited<ReturnType<ProjectRootIdentityFilesystemV01["stat"]>>;
  try {
    resolvedRoot = await filesystem.realpath(canonicalRoot);
    rootStat = await filesystem.stat(resolvedRoot);
  } catch {
    throw new NativeHostProjectRootIdentityErrorV01(
      "native_host_project_root_identity_unavailable",
    );
  }
  if (!path.isAbsolute(resolvedRoot) || !rootStat.isDirectory()) {
    throw new NativeHostProjectRootIdentityErrorV01(
      "native_host_project_root_not_directory",
    );
  }
  return {
    identity_version: "native_host_physical_root_identity.v0.1",
    canonical_realpath_fingerprint: createProtocolSha256V01(resolvedRoot),
    device: String(rootStat.dev),
    inode: String(rootStat.ino),
  };
}

export function fingerprintNativeHostPhysicalRootIdentityV01(
  identity: NativeHostPhysicalRootIdentityV01,
): string {
  return createProtocolSha256V01(canonicalizeProtocolValueV01(identity));
}
