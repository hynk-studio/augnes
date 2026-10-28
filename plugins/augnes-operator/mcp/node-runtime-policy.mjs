// Source compatibility and patched minimums, independent of the exact
// Canonical toolchain and of a packaged native addon's ABI.
export const SUPPORTED_NODE_RANGE = "^22.23.4 || ^24.22.1";
export const NODE_SECURITY_FLOORS = Object.freeze({ 22: "22.23.4", 24: "24.22.1" });

export function isSupportedNodeVersion(version, { major = null } = {}) {
  if (typeof version !== "string" || version !== version.trim() ||
      !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/u.test(version)) return false;
  const parts = version.split(".").map(Number);
  if (!parts.every(Number.isSafeInteger) || (major !== null && parts[0] !== major)) return false;
  const floor = NODE_SECURITY_FLOORS[parts[0]];
  if (!floor) return false;
  const minimum = floor.split(".").map(Number);
  return parts[1] > minimum[1] || (parts[1] === minimum[1] && parts[2] >= minimum[2]);
}

// Service records deliberately retain the executable's v-prefixed identity.
export function isSupportedCompanionNodeVersion(version) {
  return typeof version === "string" && version.startsWith("v") &&
    isSupportedNodeVersion(version.slice(1), { major: 24 });
}
