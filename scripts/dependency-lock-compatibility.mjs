export const ROOT_DEPENDENCY_BEARING_FIELDS = Object.freeze([
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
  "peerDependenciesMeta",
  "bundledDependencies",
  "bundleDependencies",
  "workspaces",
]);

export function normalizedDependencyLock(lock) {
  if (!lock || typeof lock !== "object" || Array.isArray(lock)) {
    throw new TypeError("dependency lock must be an object");
  }

  const normalized = structuredClone(lock);
  delete normalized.version;

  const rootPackage = normalized.packages?.[""];
  if (
    rootPackage &&
    typeof rootPackage === "object" &&
    !Array.isArray(rootPackage)
  ) {
    normalized.packages[""] = Object.fromEntries(
      ROOT_DEPENDENCY_BEARING_FIELDS
        .filter((field) => Object.hasOwn(rootPackage, field))
        .map((field) => [field, rootPackage[field]]),
    );
  }

  for (const [packagePath, packageRecord] of Object.entries(
    normalized.packages ?? {},
  )) {
    if (
      packagePath !== "" &&
      packageRecord &&
      typeof packageRecord === "object" &&
      !Array.isArray(packageRecord)
    ) {
      // npm may add or remove this reachability classification when the same
      // exact package is also reachable through a non-peer dependency. It is
      // not a dependency edge, version, resolution, integrity, or peer
      // requirement.
      delete packageRecord.peer;
    }
  }

  return normalized;
}
