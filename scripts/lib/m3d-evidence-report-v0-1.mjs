import { chmodSync, mkdirSync, openSync, closeSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  canonicalizeProspectivePathV01,
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

export function writePublicRunnerJsonV01({ evidenceRoot, outputPath, value }) {
  const lexicalEvidenceRoot = validateAbsolutePathInputV01(evidenceRoot);
  const lexicalOutputPath = validateAbsolutePathInputV01(outputPath);
  const canonicalEvidenceRoot = canonicalizeProspectivePathV01(
    lexicalEvidenceRoot,
  );
  const canonicalOutputPath = canonicalizeProspectivePathV01(lexicalOutputPath);
  if (
    canonicalOutputPath === canonicalEvidenceRoot ||
    !isPathWithinCanonicalRootV01(canonicalEvidenceRoot, canonicalOutputPath)
  ) {
    throw reportError(
      "runner_report_outside_evidence",
      "Runner report output must be strictly inside evidence.",
    );
  }
  assertPublicSafeRunnerMaterialV01(value);
  mkdirSync(path.dirname(canonicalOutputPath), { recursive: true, mode: 0o700 });
  const descriptor = openSync(canonicalOutputPath, "wx", 0o600);
  try {
    writeFileSync(descriptor, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  } finally {
    closeSync(descriptor);
  }
  chmodSync(canonicalOutputPath, 0o600);
  return canonicalOutputPath;
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

function reportError(reasonCode, message) {
  const error = new Error(message);
  error.reasonCode = reasonCode;
  return error;
}
