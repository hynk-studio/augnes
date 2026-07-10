import type {
  AutohuntResultIntake,
  AutohuntResultIntakeStatus,
  AutohuntResultReportSource,
  AutohuntResultReportStatus,
} from "@/types/autohunt-result-intake";
import type { ExternalRefTrustClassV01, ExternalRefV01 } from "@/types/vnext/external-ref";
import { EXTERNAL_REF_VERSION_V01 } from "@/types/vnext/external-ref";
import type {
  RunReceiptAttestationTrustClassV01,
  RunReceiptAttestationV01,
  RunReceiptChangedArtifactV01,
  RunReceiptCheckResultV01,
  RunReceiptIssueV01,
  RunReceiptV01,
} from "@/types/vnext/run-receipt";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
  isProtocolRecordV01,
  parseStrictIsoTimestampV01,
  protocolStringValueV01,
} from "@/lib/vnext/protocol-primitives";
import {
  classifyLegacyResultArtifactRefV01,
  validateLegacyResultMappingInputKeysV01,
  validateLegacyResultRawOptionalExternalRefsV01,
} from "@/lib/vnext/compat/legacy-result-mapping-primitives";
import {
  validateAutohuntResultIntakeForRunReceiptV01,
  type AutohuntResultIntakeRunReceiptMappingIssueV01,
  type AutohuntResultIntakeSourceValidationV01,
} from "@/lib/vnext/compat/autohunt-result-intake-source-validator";
import {
  buildRunReceiptV01,
  validateRunReceiptV01,
  type RunReceiptBuilderInputV01,
} from "@/lib/vnext/run-receipt";

const NAMESPACE = "augnes.autohunt-result-intake.v0.1";
const allowedInputKeys = new Set([
  "workspace_id", "project_id", "run_id", "recorded_at",
  "data_classification", "source_intake", "work_ref",
  "task_context_packet_ref", "host_ref", "worker_ref",
]);
const dataClassifications = new Set(["public_safe", "private", "local_only", "secret"]);

export interface AutohuntResultIntakeRunReceiptInputV01 {
  workspace_id: string;
  project_id: string;
  run_id: string;
  recorded_at: string;
  data_classification: RunReceiptV01["privacy_egress"]["data_classification"];
  source_intake: AutohuntResultIntake;
  work_ref?: ExternalRefV01 | null;
  task_context_packet_ref?: ExternalRefV01 | null;
  host_ref?: ExternalRefV01 | null;
  worker_ref?: ExternalRefV01 | null;
}

export interface AutohuntResultIntakeRunReceiptMappingResultV01 {
  status: "mapped" | "blocked" | "invalid";
  receipt: RunReceiptV01 | null;
  errors: AutohuntResultIntakeRunReceiptMappingIssueV01[];
  warnings: AutohuntResultIntakeRunReceiptMappingIssueV01[];
  source_intake_fingerprint: string | null;
  normalized_source_intake_status: AutohuntResultIntakeStatus | null;
  source_result_report_status: AutohuntResultReportStatus | null;
  source_result_type: AutohuntResultReportSource | null;
}

export function mapAutohuntResultIntakeToRunReceiptV01(
  input: AutohuntResultIntakeRunReceiptInputV01,
): AutohuntResultIntakeRunReceiptMappingResultV01;
export function mapAutohuntResultIntakeToRunReceiptV01(
  input: unknown,
): AutohuntResultIntakeRunReceiptMappingResultV01;
export function mapAutohuntResultIntakeToRunReceiptV01(
  input: unknown,
): AutohuntResultIntakeRunReceiptMappingResultV01 {
  if (!isProtocolRecordV01(input)) return early("invalid", "mapping_input_not_object", "$", "RunReceipt compatibility mapping input must be an object.");
  const keyValidation = validateLegacyResultMappingInputKeysV01(input, allowedInputKeys);
  if (keyValidation.errors.length) return empty(keyValidation.blocked ? "blocked" : "invalid", keyValidation.errors);
  const refValidation = validateLegacyResultRawOptionalExternalRefsV01(input);
  if (refValidation.errors.length) return empty(refValidation.blocked ? "blocked" : "invalid", refValidation.errors, refValidation.warnings);

  const errors: AutohuntResultIntakeRunReceiptMappingIssueV01[] = [];
  for (const field of ["workspace_id", "project_id", "run_id"] as const) {
    if (!protocolStringValueV01(input[field])) errors.push(issue(`${field}_missing`, `$.${field}`, `${field} must be explicitly supplied as a non-empty string.`));
  }
  if (parseStrictIsoTimestampV01(input.recorded_at) === null) errors.push(issue("recorded_at_invalid", "$.recorded_at", "recorded_at must be an explicit ISO-8601 timestamp with timezone."));
  if (!dataClassifications.has(protocolStringValueV01(input.data_classification) ?? "")) errors.push(issue("data_classification_invalid", "$.data_classification", "data_classification must be explicitly supplied from the RunReceipt v0.1 set."));
  if (!Object.prototype.hasOwnProperty.call(input, "source_intake") || input.source_intake === null || input.source_intake === undefined) errors.push(issue("source_intake_missing", "$.source_intake", "source_intake must be explicitly supplied."));
  if (errors.length) return empty("invalid", errors);

  const sourceValidation = validateAutohuntResultIntakeForRunReceiptV01(input.source_intake);
  if (sourceValidation.status !== "valid") return fromValidation(sourceValidation);
  let receipt: RunReceiptV01;
  try {
    receipt = buildMappedReceipt(input as unknown as AutohuntResultIntakeRunReceiptInputV01);
  } catch {
    return fromValidation(sourceValidation, [issue("mapping_build_failed", null, "Malformed compatibility input could not be normalized safely.")]);
  }
  const receiptValidation = validateRunReceiptV01(receipt);
  if (receiptValidation.status !== "valid") {
    return {
      status: receiptValidation.status === "blocked" ? "blocked" : "invalid",
      receipt: null,
      errors: receiptValidation.errors,
      warnings: [...sourceValidation.warnings, ...receiptValidation.warnings],
      source_intake_fingerprint: sourceValidation.source_intake_fingerprint,
      normalized_source_intake_status: sourceValidation.normalized_source_intake_status,
      source_result_report_status: sourceValidation.source_result_report_status,
      source_result_type: sourceValidation.source_result_type,
    };
  }
  return {
    status: "mapped", receipt, errors: [],
    warnings: [...sourceValidation.warnings, ...receiptValidation.warnings],
    source_intake_fingerprint: sourceValidation.source_intake_fingerprint,
    normalized_source_intake_status: sourceValidation.normalized_source_intake_status,
    source_result_report_status: sourceValidation.source_result_report_status,
    source_result_type: sourceValidation.source_result_type,
  };
}

function buildMappedReceipt(input: AutohuntResultIntakeRunReceiptInputV01): RunReceiptV01 {
  const source = input.source_intake;
  const report = source.structured_result_report;
  const reportTrust = resultTrust(report.result_source);
  const intakeRef = ref("autohunt_result_intake", source.result_intake_id, "imported_unverified", source.created_at, source.result_intake_fingerprint);
  const reportRef = ref(resultRefType(report.result_source), report.result_report_id, reportTrust, source.created_at, source.result_intake_id);
  const contractRef = ref("autohunt_supervised_execution_contract", source.source_execution_contract.contract_id, "imported_unverified", source.created_at, source.source_execution_contract.contract_fingerprint);
  const deltaRef = ref("autohunt_expected_observed_delta_candidate", source.expected_observed_delta_candidate.delta_fingerprint, "derived_interpretation", source.created_at, source.result_intake_id);
  const reuseRef = ref("autohunt_reuse_outcome_candidate", source.reuse_outcome_candidate.outcome_fingerprint, "derived_interpretation", source.created_at, source.result_intake_id);
  const residualRef = ref("autohunt_residual_diagnostic_candidate", source.residual_diagnostic_candidate.residual_fingerprint, "derived_interpretation", source.created_at, source.result_intake_id);
  const metadataRefs = [
    ref("legacy_scope", source.scope, "imported_unverified"),
    ref("source_intake_status", source.result_intake_status, "imported_unverified"),
    ref("source_intake_fingerprint", source.result_intake_fingerprint, "imported_unverified"),
    ref("source_result_report_fingerprint", report.result_report_fingerprint, reportTrust),
    ref("source_execution_contract_fingerprint", source.source_execution_contract.contract_fingerprint, "imported_unverified"),
    ref("source_readiness_gate_fingerprint", source.source_execution_contract.source_readiness_gate_fingerprint, "imported_unverified"),
    ref("autonomy_delegation_grant", source.source_execution_contract.active_grant_id, "imported_unverified", undefined, source.source_execution_contract.active_grant_fingerprint),
    ref("autohunt_preflight_packet", source.source_execution_contract.ready_preflight_packet_id, "imported_unverified", undefined, source.source_execution_contract.ready_preflight_packet_fingerprint),
    ref("autohunt_operator_decision", source.source_execution_contract.operator_decision_id, "imported_unverified", undefined, source.source_execution_contract.operator_decision_fingerprint),
    ref("autohunt_copy_export_preview_fingerprint", source.source_execution_contract.copy_export_preview_fingerprint, "imported_unverified"),
    ref("reused_context_fingerprint", source.reuse_outcome_candidate.reused_context_fingerprint, "derived_interpretation"),
  ];
  const legacyRefs = [
    ...report.useful_refs.map((value) => ref("autohunt_useful_ref", value, reportTrust)),
    ...report.stale_refs.map((value) => ref("autohunt_stale_ref", value, reportTrust)),
    ...report.missing_refs.map((value) => ref("autohunt_missing_ref", value, reportTrust)),
    ...report.noisy_refs.map((value) => ref("autohunt_noisy_ref", value, reportTrust)),
  ];
  const artifactRefs = sorted(report.changed_files).map((value) =>
    ref(classifyLegacyResultArtifactRefV01(value) === "legacy_artifact_ref" ? "legacy_artifact_ref" : "repository_relative_path", value, reportTrust, source.created_at, report.result_report_id),
  );
  const artifactByValue = new Map(artifactRefs.map((value) => [value.external_id, value]));

  const attestations: RunReceiptAttestationV01[] = [
    attestation("reported_result_status", `Autohunt result intake reports result status ${report.result_status}.`, reportRef, reportTrust, source.created_at),
    attestation("reported_budget_usage", `Reported budget usage: ${report.budget_used.iterations} iterations, ${report.budget_used.tool_calls} tool calls, ${report.budget_used.codex_tasks} Codex tasks, ${report.budget_used.draft_prs} draft PRs, and ${report.budget_used.changed_files} changed files.`, reportRef, reportTrust, source.created_at),
    attestation("reported_external_side_effect_flags", "Source report states branch_created=false, pr_created=false, github_called=false, and codex_executed=false for its declared surfaces.", reportRef, reportTrust, source.created_at),
    attestation("source_validation_claim", "Source intake reports validation.passed=true and target_only_write_proven=true; these remain source claims, not Evidence.", intakeRef, "imported_unverified", source.created_at),
    attestation("source_row_count_claim", `Source intake reports target delta ${source.row_count_write_summary.target_delta} with ${source.row_count_write_summary.non_target_changed_table_count} non-target changed tables.`, intakeRef, "imported_unverified", source.created_at),
    attestation("learning_loop_readiness_claim", `Source learning-loop readiness is ${source.learning_loop_summary.ready_for_next_daily_autohunt_cycle}; it grants no scheduling or execution authority.`, intakeRef, "imported_unverified", source.created_at),
    attestation("expected_observed_delta_candidate", `ExpectedObservedDelta candidate status is ${source.expected_observed_delta_candidate.delta_status}; candidate only.`, deltaRef, "derived_interpretation", source.created_at),
    attestation("expected_observed_delta_expected_summary", source.expected_observed_delta_candidate.expected_summary, deltaRef, "derived_interpretation", source.created_at),
    attestation("expected_observed_delta_observed_summary", source.expected_observed_delta_candidate.observed_summary, deltaRef, "derived_interpretation", source.created_at),
    attestation("reuse_outcome_candidate", `ReuseOutcome candidate ${source.reuse_outcome_candidate.source_chain_helpfulness}: ${source.reuse_outcome_candidate.useful_refs.length} useful, ${source.reuse_outcome_candidate.stale_refs.length} stale, ${source.reuse_outcome_candidate.missing_refs.length} missing, and ${source.reuse_outcome_candidate.noisy_refs.length} noisy refs; candidate only.`, reuseRef, "derived_interpretation", source.created_at),
    attestation("residual_diagnostic_candidate", `ResidualDiagnostic candidate ${source.residual_diagnostic_candidate.severity}/${source.residual_diagnostic_candidate.residual_category}, recommended class ${source.residual_diagnostic_candidate.recommended_next_work_class}: ${source.residual_diagnostic_candidate.residual_summary}`, residualRef, "derived_interpretation", source.created_at),
  ];
  for (const matched of source.expected_observed_delta_candidate.matched_expectations) attestations.push(attestation("matched_expectation_candidate", matched, deltaRef, "derived_interpretation", source.created_at, matched));
  const outcomeByCheck = new Map<string, "passed" | "failed" | "unknown">();
  report.checks_run.forEach((value) => outcomeByCheck.set(value, "unknown"));
  report.checks_passed.forEach((value) => outcomeByCheck.set(value, "passed"));
  report.checks_failed.forEach((value) => outcomeByCheck.set(value, "failed"));
  for (const [check, status] of outcomeByCheck) attestations.push(attestation(`reported_check_${status}`, `Source reports check ${check} with ${status} outcome.`, reportRef, reportTrust, source.created_at, check));
  for (const check of report.checks_skipped) attestations.push(attestation("reported_check_skipped", `Source reports check ${check} as skipped without a structured reason.`, reportRef, reportTrust, source.created_at, check));
  for (const artifact of report.changed_files) attestations.push(attestation("changed_artifact_claim", `Source reports changed artifact ${artifact}.`, reportRef, reportTrust, source.created_at, artifact, [requiredRef(artifactByValue, artifact)]));

  const requiredSourceChecks = new Set(source.expected_observed_delta_candidate.checks_delta.required_checks);
  const checks: RunReceiptCheckResultV01[] = [...outcomeByCheck].map(([value, status]) => ({
    check_id: checkId(value), required: requiredSourceChecks.has(value), status,
    basis: "attested", summary: bounded(`Source reports check ${value} as ${status}.`), source_refs: [reportRef],
  }));
  const requiredCheckIds = [...requiredSourceChecks].map(checkId);
  const verificationStatus = deriveVerification(source, outcomeByCheck);
  const changedArtifacts: RunReceiptChangedArtifactV01[] = report.changed_files.map((value) => ({
    artifact_ref: requiredRef(artifactByValue, value), change_kind: "unknown",
    before_hash: null, after_hash: null, basis: "attested",
    related_observation_ids: [],
    related_attestation_ids: [stableId("attestation", "changed_artifact_claim", value)],
    source_refs: [reportRef],
  }));
  const blockers = report.blocker_reasons.map((value) => receiptIssue("source_reported_blocker", value, reportRef));
  const warnings: RunReceiptIssueV01[] = [
    ...report.warning_reasons.map((value) => receiptIssue("source_reported_warning", value, reportRef)),
    ...requiredFailures(source, "failed").map((value) => receiptIssue("required_check_reported_failed", `Required check reported failed: ${value}.`, reportRef)),
    ...source.expected_observed_delta_candidate.unexpected_observations
      .filter((value) => !value.startsWith("blocker:") && !value.startsWith("warning:"))
      .map((value) => receiptIssue("unexpected_observation_candidate", value, deltaRef)),
    ...report.stale_refs.map((value) => receiptIssue("source_reuse_ref_stale", value, reuseRef)),
    ...report.noisy_refs.map((value) => receiptIssue("source_reuse_ref_noisy", value, reuseRef)),
    ...(source.residual_diagnostic_candidate.severity === "low" ? [receiptIssue("residual_diagnostic_candidate", source.residual_diagnostic_candidate.residual_summary, residualRef)] : []),
  ];
  const gaps: RunReceiptIssueV01[] = [
    ...requiredFailures(source, "skipped").map((value) => receiptIssue("required_check_reported_skipped", `Required check reported skipped without a structured reason: ${value}.`, reportRef)),
    ...source.expected_observed_delta_candidate.checks_delta.missing_required_checks.map((value) => receiptIssue("required_check_missing", `Required check is missing from source claims: ${value}.`, reportRef)),
    ...source.expected_observed_delta_candidate.missed_expectations
      .filter((value) => !/^(?:missing|skipped|failed)_required_check:/.test(value))
      .map((value) => receiptIssue("missed_expectation_candidate", value, deltaRef)),
    ...report.missing_refs.map((value) => receiptIssue("source_reuse_ref_missing", value, reuseRef)),
    ...(["medium", "high"].includes(source.residual_diagnostic_candidate.severity) ? [receiptIssue("residual_diagnostic_candidate", source.residual_diagnostic_candidate.residual_summary, residualRef)] : []),
  ];
  const allRefs = [intakeRef, reportRef, contractRef, deltaRef, reuseRef, residualRef, ...metadataRefs, ...legacyRefs, ...artifactRefs, input.host_ref ?? null, input.worker_ref ?? null].filter((value): value is ExternalRefV01 => value !== null);

  const receiptInput: RunReceiptBuilderInputV01 = {
    workspace_id: input.workspace_id, project_id: input.project_id, run_id: input.run_id,
    work_ref: input.work_ref ?? null, task_context_packet_ref: input.task_context_packet_ref ?? null,
    recorded_at: input.recorded_at, started_at: null, finished_at: null,
    execution: { status: "unknown", basis: "attested", source_refs: [reportRef] },
    verification: { status: verificationStatus, basis: "attested", required_check_ids: requiredCheckIds, source_refs: [reportRef] },
    reporter_ref: reportRef, observer_refs: [], verifier_refs: [],
    host_ref: input.host_ref ?? null, worker_ref: input.worker_ref ?? null, model_invocations: [],
    execution_environment: { environment_kind: "unknown", host_ref: input.host_ref ?? null, worker_ref: input.worker_ref ?? null, operating_system: null, runtime_labels: ["autohunt-result-intake-compatibility", source.source_execution_contract.launch_mode], source_refs: [intakeRef, reportRef] },
    observations: [], attestations, changed_artifacts: changedArtifacts, commands: [], checks, skipped_checks: [], external_refs: allRefs,
    result_summary: {
      summary: `Source ${report.result_source} reports ${report.result_status}: ${report.checks_passed.length} passed, ${report.checks_failed.length} failed, ${report.checks_skipped.length} skipped checks, and ${report.changed_file_count} changed-file claims.`,
      outcome: null,
      limitations: ["Autohunt intake is not direct run telemetry.", "Reported check outcomes are attestations, not independent verification.", "Source candidates do not create accepted Evidence, authority, project state, or work closure."],
    },
    blockers, warnings, gaps,
    privacy_egress: { data_classification: input.data_classification, egress_status: "unknown", basis: "unknown", destination_refs: [], redaction_status: "applied", retention_class: null, raw_prompt_persisted: false, raw_output_persisted: false, raw_transcript_persisted: false, secret_material_persisted: false, source_refs: [], notes: ["Source-record material safety is known; original represented-run egress remains unknown.", "Mapper purity does not prove that the represented run had no egress.", "Source false flags cover only their declared surfaces."] },
    cost_usage: { cost_basis: "unknown", cost_amount: null, currency: null, usage: { basis: "unknown", input_units: null, output_units: null, total_units: null, unit: null }, source_refs: [] },
    capability_coverage: [
      coverage("source_record_integrity", "advisory", intakeRef),
      coverage("run_execution_observation", "outside_coverage", reportRef),
      coverage("changed_artifact_verification", "advisory", reportRef),
      coverage("check_outcome_verification", "advisory", reportRef),
      coverage("source_contract_enforcement", "advisory", contractRef),
      coverage("authority_enforcement", "outside_coverage", intakeRef),
    ],
    source_refs: [intakeRef, reportRef, contractRef], artifact_refs: artifactRefs,
    compatibility: {
      source_contracts: [source.result_intake_version, "autohunt_structured_result_report.v0.1"],
      unmapped_fields: [
        { source_field: "structured_result_report.result_status", reason: "Reported result status is not independently observed execution telemetry." },
        { source_field: "structured_result_report.budget_used", reason: "Autohunt budget counts are not model usage or cost units." },
        { source_field: "row_count_write_summary", reason: "Target-only row counts remain source claims and are not accepted Evidence." },
        { source_field: "expected_observed_delta_candidate", reason: "Candidate is not EpisodeDeltaProposal or an accepted delta." },
        { source_field: "reuse_outcome_candidate", reason: "Candidate is not reviewed memory or proof that reuse helped." },
        { source_field: "residual_diagnostic_candidate", reason: "Candidate is not project state or automatic next work." },
        { source_field: "learning_loop_summary.ready_for_next_daily_autohunt_cycle", reason: "Readiness is not scheduling, execution, approval, or closure authority." },
      ],
      warnings: [
        `Source intake status: ${source.result_intake_status}.`, `Source intake fingerprint: ${source.result_intake_fingerprint}.`,
        `Source result status: ${report.result_status}.`, `Source result type: ${report.result_source}.`, `Source launch mode: ${report.source_contract_launch_mode}.`,
        `Source contract fingerprint: ${source.source_execution_contract.contract_fingerprint}.`, `ExpectedObservedDelta fingerprint: ${source.expected_observed_delta_candidate.delta_fingerprint}.`,
        `ReuseOutcome fingerprint: ${source.reuse_outcome_candidate.outcome_fingerprint}.`, `ResidualDiagnostic fingerprint: ${source.residual_diagnostic_candidate.residual_fingerprint}.`,
        "Legacy scope is compatibility metadata and never determines canonical project identity.", "No source field creates a direct or verified observation.",
        "Source validation pass is not proof or accepted Evidence.", "ExpectedObservedDelta, ReuseOutcome, and ResidualDiagnostic remain candidates.",
        "Learning-loop readiness is a source candidate claim only and grants no authority.",
      ],
      external_refs: [intakeRef, reportRef, contractRef, deltaRef, reuseRef, residualRef, ...metadataRefs],
    },
    authority_notes: ["Autohunt source authority and persisted-material boundaries were validated as closed before mapping.", "Source candidates, validation claims, and row-count claims grant no RunReceipt authority."],
  };
  return buildRunReceiptV01(receiptInput);
}

function deriveVerification(source: AutohuntResultIntake, outcomes: Map<string, "passed" | "failed" | "unknown">): RunReceiptV01["verification"]["status"] {
  const report = source.structured_result_report;
  if (!report.checks_run.length && !report.checks_passed.length && !report.checks_failed.length && !report.checks_skipped.length) return "not_run";
  if ([...outcomes.values()].includes("failed")) return "failed";
  const required = source.expected_observed_delta_candidate.checks_delta.required_checks;
  if (required.some((check) => report.checks_skipped.includes(check)) || source.expected_observed_delta_candidate.checks_delta.missing_required_checks.length || [...outcomes.values()].includes("unknown")) return "partial";
  if (required.length && required.every((check) => outcomes.get(check) === "passed")) return "passed";
  return "unknown";
}

function requiredFailures(source: AutohuntResultIntake, kind: "failed" | "skipped") { const values = kind === "failed" ? source.structured_result_report.checks_failed : source.structured_result_report.checks_skipped; return source.expected_observed_delta_candidate.checks_delta.required_checks.filter((check) => values.includes(check)); }
function resultTrust(source: AutohuntResultReportSource): RunReceiptAttestationTrustClassV01 { return source === "manual_operator_report" ? "user_declaration" : source === "future_launcher_report" ? "host_attestation" : "imported_unverified"; }
function resultRefType(source: AutohuntResultReportSource) { return source === "manual_operator_report" ? "manual_operator_result_report" : source === "future_launcher_report" ? "autohunt_launcher_result_report" : "autohunt_dry_run_fixture_result_report"; }
function ref(refType: string, externalId: string, trustClass: ExternalRefTrustClassV01, observedAt?: string, sourceRef?: string): ExternalRefV01 { return { ref_version: EXTERNAL_REF_VERSION_V01, ref_type: refType, external_id: externalId, trust_class: trustClass, ...(observedAt ? { observed_at: observedAt } : {}), ...(sourceRef ? { source_ref: sourceRef } : {}), compatibility_namespace: NAMESPACE }; }
function attestation(kind: string, summary: string, reporter: ExternalRefV01, trust: RunReceiptAttestationTrustClassV01, reportedAt: string, identity = summary, subjects: ExternalRefV01[] = []): RunReceiptAttestationV01 { return { attestation_id: stableId("attestation", kind, identity), attestation_kind: kind, summary: bounded(summary), reported_at: reportedAt, reporter_ref: reporter, trust_class: trust, source_refs: [reporter], subject_refs: subjects }; }
function receiptIssue(code: string, summary: string, sourceRef: ExternalRefV01): RunReceiptIssueV01 { return { code, summary: bounded(summary), source_refs: [sourceRef] }; }
function coverage(capability: string, coverageLevel: "advisory" | "outside_coverage", sourceRef: ExternalRefV01) { return { capability, coverage_level: coverageLevel, source_ref: sourceRef, notes: [coverageLevel === "advisory" ? "Source claims are review cues and do not verify or enforce represented-run behavior." : "The compatibility mapper does not observe or enforce the represented run."] }; }
function checkId(value: string) { return stableId("check", "autohunt_reported_check", value); }
function stableId(prefix: string, kind: string, value: string) { const hash = createProtocolSha256V01(canonicalizeProtocolValueV01({ kind, value })); return `${prefix}:${hash.slice("sha256:".length, 31)}`; }
function bounded(value: string) { const normalized = value.replace(/\s+/g, " ").trim(); return normalized.length <= 240 ? normalized : `${normalized.slice(0, 237)}...`; }
function sorted(values: Iterable<string>) { return [...new Set(values)].sort(); }
function requiredRef(refs: ReadonlyMap<string, ExternalRefV01>, value: string) { const result = refs.get(value); if (!result) throw new Error("Internal deterministic reference mapping failed."); return result; }
function issue(code: string, path: string | null, message: string): AutohuntResultIntakeRunReceiptMappingIssueV01 { return { severity: "error", code, path, message }; }
function empty(status: "blocked" | "invalid", errors: AutohuntResultIntakeRunReceiptMappingIssueV01[], warnings: AutohuntResultIntakeRunReceiptMappingIssueV01[] = []): AutohuntResultIntakeRunReceiptMappingResultV01 { return { status, receipt: null, errors, warnings, source_intake_fingerprint: null, normalized_source_intake_status: null, source_result_report_status: null, source_result_type: null }; }
function early(status: "blocked" | "invalid", code: string, path: string | null, message: string) { return empty(status, [issue(code, path, message)]); }
function fromValidation(source: AutohuntResultIntakeSourceValidationV01, extraErrors: AutohuntResultIntakeRunReceiptMappingIssueV01[] = []): AutohuntResultIntakeRunReceiptMappingResultV01 { return { status: source.status === "blocked" ? "blocked" : "invalid", receipt: null, errors: [...source.errors, ...extraErrors], warnings: source.warnings, source_intake_fingerprint: source.source_intake_fingerprint, normalized_source_intake_status: source.normalized_source_intake_status, source_result_report_status: source.source_result_report_status, source_result_type: source.source_result_type }; }
