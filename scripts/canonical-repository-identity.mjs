import path from "node:path";

export const CANONICAL_REPOSITORY_ID = "hynk-studio/augnes";
export const CANONICAL_ORIGIN_URL =
  "https://github.com/hynk-studio/augnes.git";
export const CANONICAL_DARWIN_REPOSITORY_ROOT = "/Users/hynk/code/augnes";

export function canonicalRepositoryIdentity({
  platform = process.platform,
  windowsRepositoryRoot =
    process.env.AUGNES_CANONICAL_WINDOWS_REPOSITORY_ROOT ?? "",
} = {}) {
  const root = platform === "win32"
    ? windowsRepositoryRoot
    : CANONICAL_DARWIN_REPOSITORY_ROOT;
  if (
    typeof root !== "string" ||
    (platform === "win32" ? !path.win32.isAbsolute(root) : !path.isAbsolute(root))
  ) return null;
  return Object.freeze({
    role: "canonical",
    repository_id: CANONICAL_REPOSITORY_ID,
    origin: CANONICAL_ORIGIN_URL,
    root,
  });
}

export function matchCanonicalRepositoryIdentity({
  resolvedRoot,
  originUrl,
  platform = process.platform,
  windowsRepositoryRoot =
    process.env.AUGNES_CANONICAL_WINDOWS_REPOSITORY_ROOT ?? "",
}) {
  const identity = canonicalRepositoryIdentity({
    platform,
    windowsRepositoryRoot,
  });
  if (!identity || identity.root !== resolvedRoot) {
    const error = new Error("local canonical repository root is unauthorized");
    error.code = "unauthorized_repository_root";
    throw error;
  }
  if (identity.origin !== originUrl) {
    const error = new Error("local canonical repository origin is unauthorized");
    error.code = "unauthorized_repository_origin";
    throw error;
  }
  return identity;
}
