import path from "node:path";

export const CANONICAL_REPOSITORY_MIGRATION_BRIDGE =
  "perspective-lab-to-augnes.v0.1";

export const LEGACY_MIGRATION_REPOSITORY_ID =
  "hynk-studio/augnes-perspective-lab";
export const LEGACY_MIGRATION_ORIGIN_URL =
  "https://github.com/hynk-studio/augnes-perspective-lab.git";
export const LEGACY_MIGRATION_REPOSITORY_ROOT =
  "/Users/hynk/code/augnes-temp";

export const TARGET_CANONICAL_REPOSITORY_ID = "hynk-studio/augnes";
export const TARGET_CANONICAL_ORIGIN_URL =
  "https://github.com/hynk-studio/augnes.git";
export const TARGET_CANONICAL_REPOSITORY_ROOT = "/Users/hynk/code/augnes";

const DARWIN_MIGRATION_IDENTITIES = Object.freeze([
  Object.freeze({
    role: "legacy_migration_source",
    repository_id: LEGACY_MIGRATION_REPOSITORY_ID,
    origin: LEGACY_MIGRATION_ORIGIN_URL,
    root: LEGACY_MIGRATION_REPOSITORY_ROOT,
  }),
  Object.freeze({
    role: "target_canonical",
    repository_id: TARGET_CANONICAL_REPOSITORY_ID,
    origin: TARGET_CANONICAL_ORIGIN_URL,
    root: TARGET_CANONICAL_REPOSITORY_ROOT,
  }),
]);

export function canonicalMigrationBridgeIdentities({
  platform = process.platform,
  windowsRepositoryRoot =
    process.env.AUGNES_CANONICAL_WINDOWS_REPOSITORY_ROOT ?? "",
} = {}) {
  if (platform !== "win32") return DARWIN_MIGRATION_IDENTITIES;
  if (
    typeof windowsRepositoryRoot !== "string" ||
    !path.win32.isAbsolute(windowsRepositoryRoot)
  ) return Object.freeze([]);
  return Object.freeze(DARWIN_MIGRATION_IDENTITIES.map((identity) =>
    Object.freeze({ ...identity, root: windowsRepositoryRoot })
  ));
}

export function matchCanonicalMigrationBridgeIdentity({
  resolvedRoot,
  originUrl,
  platform = process.platform,
  windowsRepositoryRoot =
    process.env.AUGNES_CANONICAL_WINDOWS_REPOSITORY_ROOT ?? "",
}) {
  const identities = canonicalMigrationBridgeIdentities({
    platform,
    windowsRepositoryRoot,
  });
  const rootMatches = identities.filter((identity) =>
    identity.root === resolvedRoot
  );
  if (rootMatches.length === 0) {
    const error = new Error("local canonical repository root is unauthorized");
    error.code = "unauthorized_repository_root";
    throw error;
  }
  const identity = rootMatches.find((candidate) =>
    candidate.origin === originUrl
  );
  if (!identity) {
    const error = new Error("local canonical repository origin is unauthorized");
    error.code = "unauthorized_repository_origin";
    throw error;
  }
  return identity;
}
