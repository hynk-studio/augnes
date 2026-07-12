import { lstatSync, realpathSync, statSync } from "node:fs";
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
  const missingSegments = [];
  let ancestor = absolutePath;
  while (true) {
    const entry = getLexicalPathEntryKindV01(ancestor);
    if (entry === "symlink") {
      try {
        const canonicalAncestor = realpathSync.native(ancestor);
        if (missingSegments.length > 0 && !statSync(canonicalAncestor).isDirectory()) {
          throw new M3dEvidenceRunnerPathPolicyErrorV01(
            "path_input_invalid",
            "Prospective path ancestor must be a directory.",
          );
        }
        return path.join(canonicalAncestor, ...missingSegments);
      } catch (error) {
        if (error instanceof M3dEvidenceRunnerPathPolicyErrorV01) throw error;
        throw new M3dEvidenceRunnerPathPolicyErrorV01(
          "dangling_symlink",
          "Prospective path contains a dangling symlink.",
        );
      }
    }
    if (entry !== "missing") {
      const canonicalAncestor = canonicalizeExistingPathV01(ancestor);
      if (missingSegments.length > 0 && !statSync(canonicalAncestor).isDirectory()) {
        throw new M3dEvidenceRunnerPathPolicyErrorV01(
          "path_input_invalid",
          "Prospective path ancestor must be a directory.",
        );
      }
      return path.join(canonicalAncestor, ...missingSegments);
    }
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
}

export function getLexicalPathEntryKindV01(pathValue) {
  const absolutePath = validateAbsolutePathInputV01(pathValue);
  try {
    const entry = lstatSync(absolutePath);
    if (entry.isSymbolicLink()) return "symlink";
    if (entry.isDirectory()) return "directory";
    if (entry.isFile()) return "file";
    return "other";
  } catch (error) {
    if (error?.code === "ENOENT") return "missing";
    throw new M3dEvidenceRunnerPathPolicyErrorV01(
      "path_input_invalid",
      "Path entry could not be inspected.",
    );
  }
}

export function pathHasSymlinkComponentV01(pathValue) {
  const absolutePath = validateAbsolutePathInputV01(pathValue);
  const parsed = path.parse(absolutePath);
  const segments = absolutePath.slice(parsed.root.length).split(path.sep).filter(Boolean);
  let current = parsed.root;
  for (const segment of segments) {
    current = path.join(current, segment);
    const entry = getLexicalPathEntryKindV01(current);
    if (entry === "symlink") return true;
    if (entry === "missing") return false;
  }
  return false;
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
    const escapedThroughSymlink =
      !withinRoot &&
      pathHasCandidateOnlySymlinkComponentV01(rootPath, candidatePath);
    return {
      status: withinRoot ? "pass" : "fail",
      reason_code: withinRoot
        ? null
        : escapedThroughSymlink
          ? "symlink_escape"
          : "path_scope_escape",
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

function pathHasCandidateOnlySymlinkComponentV01(rootPath, candidatePath) {
  const root = validateAbsolutePathInputV01(rootPath);
  const candidate = validateAbsolutePathInputV01(candidatePath);
  const rootSegments = root.split(path.sep);
  const candidateSegments = candidate.split(path.sep);
  let commonLength = 0;
  while (
    commonLength < rootSegments.length &&
    commonLength < candidateSegments.length &&
    rootSegments[commonLength] === candidateSegments[commonLength]
  ) {
    commonLength += 1;
  }
  let current = candidateSegments.slice(0, commonLength).join(path.sep) || path.sep;
  for (const segment of candidateSegments.slice(commonLength)) {
    if (!segment) continue;
    current = path.join(current, segment);
    const entry = getLexicalPathEntryKindV01(current);
    if (entry === "symlink") return true;
    if (entry === "missing") return false;
  }
  return false;
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
