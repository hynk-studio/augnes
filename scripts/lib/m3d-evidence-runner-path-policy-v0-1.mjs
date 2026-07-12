import { existsSync, realpathSync } from "node:fs";
import path from "node:path";

const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/u;

export class M3dEvidenceRunnerPathPolicyErrorV01 extends Error {
  constructor(reasonCode, message) {
    super(message);
    this.name = "M3dEvidenceRunnerPathPolicyErrorV01";
    this.reasonCode = reasonCode;
  }
}

export function validateAbsolutePathInputV01(pathValue) {
  if (typeof pathValue !== "string" || pathValue.length === 0) {
    throw new M3dEvidenceRunnerPathPolicyErrorV01(
      "path_input_invalid",
      "Path input must be a non-empty string.",
    );
  }
  if (CONTROL_CHARACTER_PATTERN.test(pathValue)) {
    throw new M3dEvidenceRunnerPathPolicyErrorV01(
      "path_input_invalid",
      "Path input must not contain control characters.",
    );
  }
  if (!path.isAbsolute(pathValue)) {
    throw new M3dEvidenceRunnerPathPolicyErrorV01(
      "path_input_invalid",
      "Path input must be absolute.",
    );
  }
  return path.resolve(pathValue);
}

export function canonicalizeExistingPathV01(pathValue) {
  const absolutePath = validateAbsolutePathInputV01(pathValue);
  try {
    return realpathSync.native(absolutePath);
  } catch {
    throw new M3dEvidenceRunnerPathPolicyErrorV01(
      "path_not_found",
      "Existing path could not be canonicalized.",
    );
  }
}

export function canonicalizeProspectivePathV01(pathValue) {
  const absolutePath = validateAbsolutePathInputV01(pathValue);
  if (existsSync(absolutePath)) return canonicalizeExistingPathV01(absolutePath);

  const missingSegments = [];
  let ancestor = absolutePath;
  while (!existsSync(ancestor)) {
    const parent = path.dirname(ancestor);
    if (parent === ancestor) {
      throw new M3dEvidenceRunnerPathPolicyErrorV01(
        "path_not_found",
        "Prospective path has no canonicalizable ancestor.",
      );
    }
    const segment = path.basename(ancestor);
    if (!segment || segment === "." || segment === "..") {
      throw new M3dEvidenceRunnerPathPolicyErrorV01(
        "path_input_invalid",
        "Prospective path contains an ambiguous missing segment.",
      );
    }
    missingSegments.unshift(segment);
    ancestor = parent;
  }

  const canonicalAncestor = canonicalizeExistingPathV01(ancestor);
  const canonicalProspectivePath = path.join(
    canonicalAncestor,
    ...missingSegments,
  );
  for (const segment of missingSegments) {
    if (!segment || segment === "." || segment === "..") {
      throw new M3dEvidenceRunnerPathPolicyErrorV01(
        "path_input_invalid",
        "Prospective path contains an ambiguous missing segment.",
      );
    }
  }
  return canonicalProspectivePath;
}

export function isPathWithinCanonicalRootV01(root, candidate) {
  const relative = path.relative(root, candidate);
  if (relative === "") return true;
  if (path.isAbsolute(relative)) return false;
  return relative !== ".." && !relative.startsWith(`..${path.sep}`);
}

export function doCanonicalPathsOverlapV01(left, right) {
  return (
    isPathWithinCanonicalRootV01(left, right) ||
    isPathWithinCanonicalRootV01(right, left)
  );
}

export function classifyPathScopeV01({
  rootPath,
  candidatePath,
  rootKind = "prospective",
  candidateKind = "prospective",
}) {
  try {
    const canonicalRoot = canonicalizeByKind(rootPath, rootKind);
    const canonicalCandidate = canonicalizeByKind(candidatePath, candidateKind);
    const withinRoot = isPathWithinCanonicalRootV01(
      canonicalRoot,
      canonicalCandidate,
    );
    return {
      status: withinRoot ? "pass" : "fail",
      reason_code: withinRoot ? null : "path_scope_escape",
      canonical_root: canonicalRoot,
      canonical_candidate: canonicalCandidate,
    };
  } catch (error) {
    return {
      status: "fail",
      reason_code:
        error instanceof M3dEvidenceRunnerPathPolicyErrorV01
          ? error.reasonCode
          : "path_input_invalid",
      canonical_root: null,
      canonical_candidate: null,
    };
  }
}

export function assertPathScopeV01(input) {
  const result = classifyPathScopeV01(input);
  if (result.status !== "pass") {
    throw new M3dEvidenceRunnerPathPolicyErrorV01(
      result.reason_code,
      "Candidate path is outside the canonical root.",
    );
  }
  return result;
}

function canonicalizeByKind(pathValue, kind) {
  if (kind === "existing") return canonicalizeExistingPathV01(pathValue);
  if (kind === "prospective") return canonicalizeProspectivePathV01(pathValue);
  throw new M3dEvidenceRunnerPathPolicyErrorV01(
    "path_input_invalid",
    "Path kind must be existing or prospective.",
  );
}
