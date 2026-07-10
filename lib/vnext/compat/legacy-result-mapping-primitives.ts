import {
  isProtocolRecordV01,
  protocolStringValueV01,
  validateExternalRefStructureV01,
} from "@/lib/vnext/protocol-primitives";

export interface LegacyResultRunReceiptMappingIssueV01 {
  severity: "error" | "warning";
  code: string;
  path: string | null;
  message: string;
}

export type LegacyResultArtifactRefClassificationV01 =
  | "repository_relative_path"
  | "legacy_artifact_ref"
  | "blocked";

const externalRefKeys = new Set([
  "ref_version",
  "ref_type",
  "external_id",
  "provider",
  "host",
  "observed_at",
  "trust_class",
  "source_ref",
  "compatibility_namespace",
]);

export const LEGACY_RESULT_OPTIONAL_EXTERNAL_REF_FIELDS_V01 = [
  "work_ref",
  "task_context_packet_ref",
  "host_ref",
  "worker_ref",
] as const;

const forbiddenMappingSemanticField =
  /(?:approv|authori[sz]|accepted.?evidence|canonical.?state|semantic.?commit|work.?(?:clos|complet)|clos(?:e|es|ed|ing)?[_-]?work|state.?(?:mutat|appl|commit|write|accept|reject)|publish|publication|merge|external.?(?:execution|side.?effect)|execution.?(?:authori[sz]|grant)|durable.?transition|proof.?accepted)/i;

export function isForbiddenLegacyResultMappingSemanticFieldV01(
  field: string,
): boolean {
  return forbiddenMappingSemanticField.test(field);
}

export function validateLegacyResultMappingInputKeysV01(
  input: Record<string, unknown>,
  allowedKeys: ReadonlySet<string>,
): { errors: LegacyResultRunReceiptMappingIssueV01[]; blocked: boolean } {
  const unknownKeys = Object.keys(input).filter((key) => !allowedKeys.has(key));
  return {
    blocked: unknownKeys.some(isForbiddenLegacyResultMappingSemanticFieldV01),
    errors: unknownKeys.map((key) => {
      const forbidden = isForbiddenLegacyResultMappingSemanticFieldV01(key);
      return {
        severity: "error" as const,
        code: forbidden
          ? "mapping_input_forbidden_semantic_field"
          : "mapping_input_unknown_field",
        path: `$.${key}`,
        message: forbidden
          ? "Mapper input contains a field that attempts to claim a forbidden semantic."
          : "Mapper input contains a field outside the v0.1 compatibility contract.",
      };
    }),
  };
}

export function validateLegacyResultRawOptionalExternalRefsV01(
  input: Record<string, unknown>,
): {
  errors: LegacyResultRunReceiptMappingIssueV01[];
  warnings: LegacyResultRunReceiptMappingIssueV01[];
  blocked: boolean;
} {
  const errors: LegacyResultRunReceiptMappingIssueV01[] = [];
  const warnings: LegacyResultRunReceiptMappingIssueV01[] = [];
  let blocked = false;
  for (const field of LEGACY_RESULT_OPTIONAL_EXTERNAL_REF_FIELDS_V01) {
    const value = input[field];
    if (value === null || value === undefined) continue;
    const path = `$.${field}`;
    if (isProtocolRecordV01(value)) {
      for (const key of Object.keys(value)) {
        if (externalRefKeys.has(key)) continue;
        const forbidden = isForbiddenLegacyResultMappingSemanticFieldV01(key);
        errors.push({
          severity: "error",
          code: forbidden
            ? "mapping_external_ref_forbidden_semantic_field"
            : "mapping_external_ref_unknown_field",
          path: `${path}.${key}`,
          message: forbidden
            ? "Optional ExternalRef contains a field that attempts to claim a forbidden semantic."
            : "Optional ExternalRef contains a field outside the v0.1 contract.",
        });
        if (forbidden) blocked = true;
      }
    }
    validateExternalRefStructureV01(value, path, {
      error(code, issuePath, message, issueBlocked = false) {
        if (code === "unknown_external_ref_field") return;
        errors.push({ severity: "error", code, path: issuePath, message });
        if (issueBlocked) blocked = true;
      },
      warning(code, issuePath, message) {
        warnings.push({ severity: "warning", code, path: issuePath, message });
      },
    });
  }
  return { errors, warnings, blocked };
}

export function classifyLegacyResultArtifactRefV01(
  value: unknown,
): LegacyResultArtifactRefClassificationV01 {
  const candidate = protocolStringValueV01(value);
  if (
    !candidate ||
    candidate.length > 240 ||
    /[\u0000-\u001f\u007f]/.test(candidate)
  ) {
    return "blocked";
  }
  const symbolic = candidate.match(/^(file-ref:|artifact-ref:)(.*)$/);
  if (symbolic) {
    const payload = symbolic[2];
    return /^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(payload) &&
      !/(?:^|\/)\.\.(?:\/|$)/.test(payload)
      ? "legacy_artifact_ref"
      : "blocked";
  }
  if (
    isUnsafeLocalPath(candidate) ||
    /^[A-Za-z]:/.test(candidate) ||
    /^\\/.test(candidate) ||
    /^[A-Za-z][A-Za-z0-9+.-]*:\/\//.test(candidate) ||
    /(?:^|[\\/])\.\.(?:[\\/]|$)/.test(candidate)
  ) {
    return "blocked";
  }
  return "repository_relative_path";
}

function isUnsafeLocalPath(value: string): boolean {
  return (
    value.startsWith("/") ||
    /^file:\/\//i.test(value) ||
    /^[A-Za-z]:[\\/]/.test(value) ||
    /^~[\\/]/.test(value) ||
    /^\\\\/.test(value) ||
    /^[a-z0-9_-]+:\/(?!\/)/i.test(value)
  );
}
