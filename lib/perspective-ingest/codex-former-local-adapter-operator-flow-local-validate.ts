import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  hashCodexFormerLocalAdapterContent,
} from "@/lib/perspective-ingest/codex-former-local-adapter-manifest-to-source-input";
import {
  CODEX_FORMER_LOCAL_ADAPTER_OPERATOR_FLOW_AUTHORITY_BOUNDARY,
  operatorFlowPrepareExecutionSummaryRefs,
  operatorFlowSourceInputRefs,
  type OperatorFlowLocalValidationResponse,
  type OperatorFlowReturnedEnvelopeFixtureKey,
  type OperatorFlowValidationPreview,
} from "@/lib/perspective-ingest/codex-former-local-adapter-operator-flow";
import {
  buildCodexFormerLocalAdapterValidateExecutionSummary,
  buildFalseValidateAuthorityFlags,
  stableStringifyCodexFormerLocalAdapterValidateJson,
  type CodexFormerLocalAdapterValidateExecutionSummaryV0,
} from "@/lib/perspective-ingest/codex-former-local-adapter-validate-orchestration";

const maxReturnedEnvelopeLength = 20000;
const inMemoryReturnedEnvelopePath =
  "local-operator-flow:returned-envelope-textarea";
const fixtureTextReaders: Record<string, () => string> = {
  "fixtures/codex-former/2026-06-12-codex-former-local-adapter-source-input-pass.json":
    () =>
      readFileSync(
        resolve(
          process.cwd(),
          "fixtures/codex-former/2026-06-12-codex-former-local-adapter-source-input-pass.json",
        ),
        "utf8",
      ),
  "fixtures/codex-former/2026-06-11-codex-former-local-adapter-source-input.json":
    () =>
      readFileSync(
        resolve(
          process.cwd(),
          "fixtures/codex-former/2026-06-11-codex-former-local-adapter-source-input.json",
        ),
        "utf8",
      ),
  "fixtures/codex-former/2026-06-12-codex-former-local-adapter-prepare-execution-summary-pass.json":
    () =>
      readFileSync(
        resolve(
          process.cwd(),
          "fixtures/codex-former/2026-06-12-codex-former-local-adapter-prepare-execution-summary-pass.json",
        ),
        "utf8",
      ),
  "fixtures/codex-former/2026-06-12-codex-former-local-adapter-prepare-execution-summary-pass-with-follow-up.json":
    () =>
      readFileSync(
        resolve(
          process.cwd(),
          "fixtures/codex-former/2026-06-12-codex-former-local-adapter-prepare-execution-summary-pass-with-follow-up.json",
        ),
        "utf8",
      ),
};

export function runOperatorFlowLocalValidationBridge(
  input: unknown,
): OperatorFlowLocalValidationResponse {
  const request = parseRequest(input);
  if (!request.ok) {
    return buildOperatorFlowBlockedBeforeExecutionResponse({
      sourceInputRef: null,
      prepareSummaryRef: null,
      returnedEnvelopeText: "",
      blockedReasons: request.blockedReasons,
    });
  }

  const sourceInputRef = asKnownProjectRef(
    request.value.source_input_ref,
    operatorFlowSourceInputRefs,
  );
  const prepareSummaryRef = asKnownProjectRef(
    request.value.prepare_summary_ref,
    operatorFlowPrepareExecutionSummaryRefs,
  );
  const blockedReasons: string[] = [];

  if (!sourceInputRef) {
    blockedReasons.push("source_input_ref is not one of the committed operator flow source fixtures");
  }
  if (!prepareSummaryRef) {
    blockedReasons.push("prepare_summary_ref is not one of the committed operator flow prepare fixtures");
  }
  if (request.value.returned_envelope_text.length > maxReturnedEnvelopeLength) {
    blockedReasons.push(
      `returned_envelope_text exceeds ${maxReturnedEnvelopeLength} characters`,
    );
  }
  if (!sourceInputRef || !prepareSummaryRef || blockedReasons.length > 0) {
    return buildOperatorFlowBlockedBeforeExecutionResponse({
      sourceInputRef,
      prepareSummaryRef,
      returnedEnvelopeText: request.value.returned_envelope_text,
      blockedReasons,
    });
  }

  try {
    const sourceInputText = readProjectTextFile(sourceInputRef);
    const prepareExecutionSummaryText = readProjectTextFile(prepareSummaryRef);
    const result = buildCodexFormerLocalAdapterValidateExecutionSummary({
      generatedAt: null,
      sourceInputPath: sourceInputRef,
      sourceInputText,
      prepareExecutionSummaryPath: prepareSummaryRef,
      prepareExecutionSummaryText,
      returnedEnvelopePath: inMemoryReturnedEnvelopePath,
      returnedEnvelopeText: request.value.returned_envelope_text,
      dryRunSummaryPath: null,
      dryRunSummaryText: null,
      promptArtifactText: null,
    });

    return {
      validation_source: "real_local_validate_execution",
      validation_result: toOperatorFlowValidationPreview({
        summary: result.summary,
        validationSummaryHash: hashCodexFormerLocalAdapterContent(
          result.summaryJson,
        ),
      }),
      bridge_execution_path: "direct_validate_orchestration_library_call",
      boundary: CODEX_FORMER_LOCAL_ADAPTER_OPERATOR_FLOW_AUTHORITY_BOUNDARY,
    };
  } catch (error) {
    return buildOperatorFlowBlockedBeforeExecutionResponse({
      sourceInputRef,
      prepareSummaryRef,
      returnedEnvelopeText: request.value.returned_envelope_text,
      blockedReasons: [
        error instanceof Error
          ? `local validation bridge failed before execution: ${error.message}`
          : "local validation bridge failed before execution",
      ],
    });
  }
}

function parseRequest(input: unknown):
  | {
      ok: true;
      value: {
        selected_returned_envelope_fixture_key:
          | OperatorFlowReturnedEnvelopeFixtureKey
          | null;
        source_input_ref: string;
        prepare_summary_ref: string;
        returned_envelope_text: string;
      };
    }
  | { ok: false; blockedReasons: string[] } {
  if (!isRecord(input)) {
    return { ok: false, blockedReasons: ["request body must be a JSON object"] };
  }
  const blockedReasons: string[] = [];
  const sourceInputRef = readString(input.source_input_ref);
  const prepareSummaryRef = readString(input.prepare_summary_ref);
  const returnedEnvelopeText =
    typeof input.returned_envelope_text === "string"
      ? input.returned_envelope_text
      : null;
  const selectedFixtureKey = readFixtureKey(
    input.selected_returned_envelope_fixture_key,
  );

  if (!sourceInputRef) blockedReasons.push("source_input_ref is required");
  if (!prepareSummaryRef) blockedReasons.push("prepare_summary_ref is required");
  if (returnedEnvelopeText == null) {
    blockedReasons.push("returned_envelope_text must be a string");
  }
  if (!sourceInputRef || !prepareSummaryRef || returnedEnvelopeText == null) {
    return { ok: false, blockedReasons };
  }

  return {
    ok: true,
    value: {
      selected_returned_envelope_fixture_key: selectedFixtureKey,
      source_input_ref: sourceInputRef,
      prepare_summary_ref: prepareSummaryRef,
      returned_envelope_text: returnedEnvelopeText,
    },
  };
}

function toOperatorFlowValidationPreview({
  summary,
  validationSummaryHash,
}: {
  summary: CodexFormerLocalAdapterValidateExecutionSummaryV0;
  validationSummaryHash: string;
}): OperatorFlowValidationPreview {
  return {
    validation_source: "real_local_validate_execution",
    result_state: summary.result_state,
    execution_result: summary.execution_result,
    failure_kind: summary.failure_kind,
    candidate_count: summary.candidate_count,
    warnings: summary.warnings,
    pointer_warnings: summary.pointer_warnings,
    blocked_reasons: summary.blocked_reasons,
    next_safe_action: summary.next_safe_action,
    candidate_compatible_review_material:
      summary.candidate_compatible_review_material,
    worker_facing_guidance_status: summary.worker_facing_guidance_status,
    candidate_basis_quality: summary.candidate_basis_quality,
    candidate_authority: summary.candidate_authority,
    validation_summary_path: "local-operator-flow:in-memory-validate-summary",
    validation_summary_hash: validationSummaryHash,
    source_input_hash: summary.source_input_hash,
    prepare_execution_summary_hash: summary.prepare_execution_summary_hash,
    returned_envelope_hash: summary.returned_envelope_hash,
    authority_flags: summary.authority_flags,
    authority_boundary: CODEX_FORMER_LOCAL_ADAPTER_OPERATOR_FLOW_AUTHORITY_BOUNDARY,
  };
}

export function buildOperatorFlowBlockedBeforeExecutionResponse({
  sourceInputRef,
  prepareSummaryRef,
  returnedEnvelopeText,
  blockedReasons,
}: {
  sourceInputRef: string | null;
  prepareSummaryRef: string | null;
  returnedEnvelopeText: string;
  blockedReasons: string[];
}): OperatorFlowLocalValidationResponse {
  const sourceInputText = sourceInputRef ? readProjectTextFileIfAvailable(sourceInputRef) : "";
  const prepareSummaryText = prepareSummaryRef
    ? readProjectTextFileIfAvailable(prepareSummaryRef)
    : "";
  const validationResult: OperatorFlowValidationPreview = {
    validation_source: "blocked_before_execution",
    result_state: "BLOCKED",
    execution_result: "blocked",
    failure_kind: "blocked_before_execution",
    candidate_count: 0,
    warnings: [],
    pointer_warnings: [],
    blocked_reasons: uniqueStrings(blockedReasons),
    next_safe_action:
      "Fix the local validation bridge inputs, then run local validation again. No product state was created.",
    candidate_compatible_review_material: false,
    worker_facing_guidance_status: "not_run",
    candidate_basis_quality: null,
    candidate_authority: null,
    validation_summary_path: "local-operator-flow:blocked-before-execution",
    validation_summary_hash: "",
    source_input_hash: sourceInputText
      ? hashCodexFormerLocalAdapterContent(sourceInputText)
      : "not_available",
    prepare_execution_summary_hash: prepareSummaryText
      ? hashCodexFormerLocalAdapterContent(prepareSummaryText)
      : "not_available",
    returned_envelope_hash: hashCodexFormerLocalAdapterContent(
      returnedEnvelopeText,
    ),
    authority_flags: buildFalseValidateAuthorityFlags(),
    authority_boundary: CODEX_FORMER_LOCAL_ADAPTER_OPERATOR_FLOW_AUTHORITY_BOUNDARY,
  };
  validationResult.validation_summary_hash = hashCodexFormerLocalAdapterContent(
    stableStringifyCodexFormerLocalAdapterValidateJson(validationResult),
  );
  return {
    validation_source: "blocked_before_execution",
    validation_result: validationResult,
    bridge_execution_path: "blocked_before_execution",
    boundary: CODEX_FORMER_LOCAL_ADAPTER_OPERATOR_FLOW_AUTHORITY_BOUNDARY,
  };
}

function asKnownProjectRef<T extends readonly string[]>(
  value: string,
  allowedRefs: T,
): T[number] | null {
  return allowedRefs.includes(value) ? value : null;
}

function readProjectTextFile(projectRef: string) {
  const readFixtureText = fixtureTextReaders[projectRef];
  if (!readFixtureText) {
    throw new Error(`fixture ref is not allowed: ${projectRef}`);
  }
  return readFixtureText();
}

function readProjectTextFileIfAvailable(projectRef: string) {
  try {
    return readProjectTextFile(projectRef);
  } catch {
    return "";
  }
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readFixtureKey(value: unknown): OperatorFlowReturnedEnvelopeFixtureKey | null {
  if (
    value === "pass" ||
    value === "pass_with_follow_up" ||
    value === "blocked"
  ) {
    return value;
  }
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values));
}
