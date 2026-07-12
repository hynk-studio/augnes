import {
  chmodSync,
  closeSync,
  constants as fsConstants,
  mkdirSync,
  openSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

import {
  canonicalizeExistingPathV01,
  canonicalizeProspectivePathV01,
  getLexicalPathEntryKindV01,
  isPathWithinCanonicalRootV01,
  validateAbsolutePathInputV01,
} from "./m3d-evidence-runner-path-policy-v0-1.mjs";

export const M3D_AUTONOMOUS_EVIDENCE_REPORT_VERSION_V01 =
  "vnext_m3d_autonomous_evidence_report.v0.1";

const SECRET_VALUE_PATTERNS = [
  /\bsk-(?:proj-)?[A-Za-z0-9_-]{12,}\b/u,
  /\b(?:ghp|github_pat)_[A-Za-z0-9_]{12,}\b/u,
  /\bBearer\s+[A-Za-z0-9._~+\/-]{12,}\b/iu,
  /(?:bootstrap|session|action)[_-]?(?:token|secret|nonce)\s*[:=]\s*[^\s,}]{8,}/iu,
  /(?:cookie|set-cookie)\s*[:=]\s*[^\s,}]{8,}/iu,
];

export function assertPublicSafeRunnerMaterialV01(value) {
  visitPublicValue(value, []);
  return true;
}

export function buildPublicRunnerReportV01(input) {
  const report = {
    report_version: M3D_AUTONOMOUS_EVIDENCE_REPORT_VERSION_V01,
    runner_version: input.runner_version,
    classification: "Lab / verification infrastructure",
    mode: input.mode,
    verdict: input.verdict,
    phase: input.phase,
    chain_id: input.chain_id ?? null,
    fixture_only: input.fixture_only === true,
    application_commit: input.application_commit ?? null,
    qualification: input.qualification ?? null,
    phases: input.phases ?? [],
    database_integrity: input.database_integrity ?? "not_run",
    backup_sha256: input.backup_sha256 ?? null,
    cleanup: input.cleanup ?? { status: "not_run" },
    skipped_checks: input.skipped_checks ?? [],
    reason_codes: input.reason_codes ?? [],
    authority_boundary: {
      semantic_authority_granted: false,
      real_user_authorization_created: false,
      real_product_transition_claimed: false,
      reviewed_reuse_claimed: false,
      outcome_improvement_claimed: false,
      m3_completion_claimed: false,
      proof_or_evidence_record_written: false,
      perspective_or_memory_written: false,
      work_closed: false,
      provider_or_model_called: false,
      external_actuator_called: false,
      real_chain_6_claimed: false,
    },
  };
  assertPublicSafeRunnerMaterialV01(report);
  return report;
}

export function writePublicRunnerJsonV01(
  { evidenceRoot, outputPath, value },
  dependencies = {},
) {
  const writeFile = dependencies.writeFile ?? writeFileSync;
  const beforeExclusiveCreate =
    dependencies.beforeExclusiveCreate ?? (() => undefined);
  const lexicalEvidenceRoot = validateAbsolutePathInputV01(evidenceRoot);
  const lexicalOutputPath = validateAbsolutePathInputV01(outputPath);
  const canonicalEvidenceRoot = canonicalizeProspectivePathV01(
    lexicalEvidenceRoot,
  );
  const canonicalOutputPath = canonicalizeProspectiveLeafWithoutInspectionV01(
    lexicalOutputPath,
  );
  const canonicalOutputParent = path.dirname(canonicalOutputPath);
  if (
    canonicalOutputPath === canonicalEvidenceRoot ||
    !isPathWithinCanonicalRootV01(canonicalEvidenceRoot, canonicalOutputPath)
  ) {
    throw reportError(
      "runner_report_outside_evidence",
      "Runner report output must be strictly inside evidence.",
    );
  }
  const outputEntryKind = getLexicalPathEntryKindV01(lexicalOutputPath);
  if (outputEntryKind === "symlink") {
    throw reportError(
      "runner_report_output_symlink",
      "Runner report output must not be a symlink.",
    );
  }
  if (outputEntryKind !== "missing") {
    throw reportError(
      "runner_report_output_exists",
      "Runner report output must not already exist.",
    );
  }
  assertPublicSafeRunnerMaterialV01(value);
  const serialized = `${JSON.stringify(value, null, 2)}\n`;
  let descriptor = null;
  let created = false;
  try {
    mkdirSync(canonicalEvidenceRoot, { recursive: true, mode: 0o700 });
    mkdirSync(canonicalOutputParent, { recursive: true, mode: 0o700 });
    const actualEvidenceRoot = canonicalizeExistingPathV01(
      canonicalEvidenceRoot,
    );
    const actualOutputParent = canonicalizeExistingPathV01(
      canonicalOutputParent,
    );
    if (
      actualEvidenceRoot !== canonicalEvidenceRoot ||
      !isPathWithinCanonicalRootV01(actualEvidenceRoot, actualOutputParent)
    ) {
      throw reportError(
        "symlink_escape",
        "Runner report parent changed canonical identity.",
      );
    }
    beforeExclusiveCreate({
      evidenceRoot: actualEvidenceRoot,
      outputParent: actualOutputParent,
      outputPath: canonicalOutputPath,
    });
    if (
      canonicalizeExistingPathV01(canonicalEvidenceRoot) !==
        actualEvidenceRoot ||
      canonicalizeExistingPathV01(canonicalOutputParent) !==
        actualOutputParent
    ) {
      throw reportError(
        "symlink_escape",
        "Runner report parent identity changed before creation.",
      );
    }
    descriptor = openSync(
      canonicalOutputPath,
      fsConstants.O_WRONLY |
        fsConstants.O_CREAT |
        fsConstants.O_EXCL |
        (fsConstants.O_NOFOLLOW ?? 0),
      0o600,
    );
    created = true;
    writeFile(descriptor, serialized, { encoding: "utf8" });
    closeSync(descriptor);
    descriptor = null;
    chmodSync(canonicalOutputPath, 0o600);
    const actualOutputPath = canonicalizeExistingPathV01(
      canonicalOutputPath,
    );
    if (
      actualOutputPath !== canonicalOutputPath ||
      actualOutputPath === actualEvidenceRoot ||
      !isPathWithinCanonicalRootV01(actualEvidenceRoot, actualOutputPath) ||
      !statSync(actualOutputPath).isFile()
    ) {
      throw reportError(
        "symlink_escape",
        "Created runner report failed canonical requalification.",
      );
    }
    return actualOutputPath;
  } catch (error) {
    if (descriptor !== null) closeSync(descriptor);
    if (created) {
      try {
        unlinkSync(canonicalOutputPath);
      } catch {
        // Preserve the bounded original failure after best-effort cleanup.
      }
    }
    if (error?.code === "EEXIST") {
      throw reportError(
        "runner_report_output_exists",
        "Runner report output appeared before exclusive creation.",
      );
    }
    throw error;
  }
}

function visitPublicValue(value, keyPath) {
  if (value === null || value === undefined) return;
  if (typeof value === "string") {
    if (path.isAbsolute(value)) {
      throw reportError(
        "private_absolute_path_in_public_report",
        `Public report field ${keyPath.join(".") || "<root>"} contains an absolute path.`,
      );
    }
    if (SECRET_VALUE_PATTERNS.some((pattern) => pattern.test(value))) {
      throw reportError(
        "credential_material_detected",
        `Public report field ${keyPath.join(".") || "<root>"} contains credential-shaped material.`,
      );
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => visitPublicValue(entry, [...keyPath, String(index)]));
    return;
  }
  if (typeof value === "object") {
    for (const [key, entry] of Object.entries(value)) {
      visitPublicValue(entry, [...keyPath, key]);
    }
  }
}

function canonicalizeProspectiveLeafWithoutInspectionV01(pathValue) {
  const lexicalPath = validateAbsolutePathInputV01(pathValue);
  const canonicalParent = canonicalizeProspectivePathV01(
    path.dirname(lexicalPath),
  );
  return path.join(canonicalParent, path.basename(lexicalPath));
}

function reportError(reasonCode, message) {
  const error = new Error(message);
  error.reasonCode = reasonCode;
  return error;
}
