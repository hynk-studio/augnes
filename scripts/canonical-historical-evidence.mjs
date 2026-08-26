import { existsSync, lstatSync, realpathSync } from "node:fs";
import path from "node:path";

export const MIGRATED_HISTORICAL_EVIDENCE_ROOT =
  ".augnes-history/perspective-lab-cutover/historical-evidence";
const LEGACY_ACTIVE_EVIDENCE_PREFIX = ".augnes-lab/";

export function resolveMigratedHistoricalEvidencePath({
  repositoryRoot,
  legacyRelativePath,
}) {
  const root = realpathSync(repositoryRoot);
  if (
    typeof legacyRelativePath !== "string" ||
    !legacyRelativePath.startsWith(LEGACY_ACTIVE_EVIDENCE_PREFIX) ||
    path.posix.normalize(legacyRelativePath) !== legacyRelativePath
  ) {
    throw historicalError("historical_evidence_path_invalid");
  }
  const archiveRoot = path.join(root, MIGRATED_HISTORICAL_EVIDENCE_ROOT);
  if (!existsSync(archiveRoot) || lstatSync(archiveRoot).isSymbolicLink()) {
    throw historicalError("historical_evidence_archive_unavailable");
  }
  const resolvedArchiveRoot = realpathSync(archiveRoot);
  const candidate = path.join(resolvedArchiveRoot, legacyRelativePath);
  if (!existsSync(candidate)) {
    throw historicalError("historical_evidence_path_unavailable");
  }
  const resolvedCandidate = realpathSync(candidate);
  if (!resolvedCandidate.startsWith(`${resolvedArchiveRoot}${path.sep}`)) {
    throw historicalError("historical_evidence_path_escape");
  }
  return resolvedCandidate;
}

function historicalError(code) {
  const error = new Error(code);
  error.code = code;
  return error;
}
