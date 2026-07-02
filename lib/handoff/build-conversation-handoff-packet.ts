import { createHash } from "node:crypto";

import {
  PRIVACY_REDACTION_RUNTIME_GUARD_VERSION,
  buildPrivacyRedactionRuntimeGuardReportV01,
  createPrivacyRedactionRuntimeGuardAuthorityBoundaryV01,
  createPrivacyRedactionRuntimeGuardFingerprintV01,
  type PrivacyRedactionRuntimeGuardFinding,
  type PrivacyRedactionRuntimeGuardReport,
} from "../privacy/redaction-guard";
import {
  ConversationHandoffPacketBuilderVersionV02,
  ConversationHandoffPacketInputVersionV02,
  ConversationHandoffPacketNextSliceV02,
  ConversationHandoffPacketProfilesV02,
  ConversationHandoffPacketReasonCodesV02,
  ConversationHandoffPacketScopeV02,
  ConversationHandoffPacketSliceV02,
  ConversationHandoffPacketVersionV02,
  type ConversationHandoffPacketAuthorityBoundaryV02,
  type ConversationHandoffPacketBuildResultV02,
  type ConversationHandoffPacketInputV02,
  type ConversationHandoffPacketProfileV02,
  type ConversationHandoffPacketReasonCodeV02,
  type ConversationHandoffPacketSectionIdV02,
  type ConversationHandoffPacketSectionV02,
  type ConversationHandoffPacketV02,
} from "../../types/conversation-handoff-packet";

type JsonRecord = Record<string, unknown>;
type NormalizedPacketInput = {
  packet_id: string;
  packet_version: typeof ConversationHandoffPacketVersionV02;
  scope: typeof ConversationHandoffPacketScopeV02;
  profile: ConversationHandoffPacketProfileV02;
  created_at: string;
  project_context: string[];
  current_baseline: string[];
  current_task: string[];
  expected_files: string[];
  observed_files: string[];
  expected_checks: string[];
  observed_checks: string[];
  expected_observed_delta: string[];
  known_warnings: string[];
  skipped_checks: string[];
  not_done_items: string[];
  source_refs: string[];
  dogfooding_record_refs: string[];
  review_memory_refs: string[];
  promotion_receipt_state_refs: string[];
  unresolved_tensions: string[];
  forbidden_capabilities: string[];
  stop_conditions: string[];
  pr_body_requirements: string[];
  validation_commands: string[];
  next_recommended_slice: string;
  reason_codes: ConversationHandoffPacketReasonCodeV02[];
};

const defaultCreatedAt = "1970-01-01T00:00:00.000Z" as const;
const defaultPacketIdPrefix = "conversation-handoff-packet" as const;

const defaultForbiddenCapabilities = [
  "Handoff text only.",
  "UI, route, DB, provider, retrieval, and source-fetch work remain out of scope.",
  "Review Memory, proof/evidence, promotion, Formation Receipt, durable state, and product-write remain out of scope.",
  "Codex, GitHub, Git, release, deploy, and publish execution remain out of scope.",
] as const;

const defaultAuthorityBoundaryLines = [
  "Handoff packet is not execution approval.",
  "Handoff packet is not truth.",
  "Handoff packet is not proof.",
  "Handoff packet is not accepted evidence.",
  "Expected files are not write authority.",
  "Observed files are not proof.",
  "Expected checks are not proof.",
  "Observed checks are not approval.",
  "Validation pass is not approval.",
  "Validation failure is not automatic rejection.",
  "Smoke pass is not evidence.",
  "Smoke failure is diagnostic, not automatic rejection.",
  "CI pass is not authority.",
  "CI failure is diagnostic, not automatic rejection.",
  "PR body is not authority.",
  "Codex report is not execution approval.",
  "Dogfooding record is candidate-only review material.",
  "Review Memory refs are references only.",
  "Promotion/Receipt/State refs are references only unless separately executed by an approved existing runtime.",
  "Git refs and GitHub PR refs are references only.",
  "Next recommended slice is not execution approval.",
] as const;

const defaultStopConditions = [
  "Stop before adding UI, components, routes, API behavior, DB migrations, provider calls, retrieval, source fetch, GitHub/Git actuation, product-write, release, deploy, or publish behavior.",
  "Stop if caller input contains private/raw/provider/runtime/local/credential/hidden-reasoning markers.",
  "Stop if caller input asserts a positive authority shortcut.",
] as const;

const defaultPrBodyRequirements = [
  "Slice name:",
  "Goal:",
  "Why now:",
  "#868 baseline and current scope:",
  "Scope:",
  "Expected files:",
  "Validation commands:",
  "Skipped checks and reason:",
  "Known warnings:",
  "Authority boundary:",
  "Forbidden capabilities:",
  "What this does not do:",
  "What remains incomplete:",
  "Next recommended slice:",
] as const;

const defaultValidationCommands = [
  "node --check scripts/smoke-conversation-handoff-packet-v0-2.mjs",
  "npm run smoke:conversation-handoff-packet-v0-2",
  "npm run typecheck",
  "git diff --check",
  "git diff --cached --check",
  "npm run smoke:authority-boundary-regression-v0-1",
  "npm run smoke:privacy-redaction-guard-v0-1",
  "npm run smoke:codex-result-to-dogfooding-record-v0-1",
] as const;

const baseReasonCodes = [
  "conversation_handoff_packet_builder_present",
  "caller_provided_input_only",
  "public_safe_summary_only",
  "deterministic_plain_text_packet",
  "candidate_only_conversation_guidance",
  "authority_boundary_preserved",
  "forbidden_capabilities_preserved",
  "expected_observed_delta_preserved",
  "skipped_checks_preserved",
  "known_warnings_preserved",
  "not_done_preserved",
  "next_slice_is_cue_not_execution_approval",
  "handoff_packet_not_truth",
  "handoff_packet_not_proof",
  "handoff_packet_not_execution_approval",
  "expected_files_not_write_authority",
  "observed_files_not_proof",
  "validation_pass_not_approval",
  "validation_failure_not_rejection",
  "ci_pass_not_authority",
  "ci_failure_diagnostic_only",
  "pr_body_not_authority",
  "codex_report_not_execution_approval",
  "dogfooding_record_candidate_only",
  "review_memory_refs_reference_only",
  "promotion_receipt_state_refs_reference_only",
  "product_write_denied",
  "review_memory_not_written",
  "promotion_not_executed",
  "proof_not_created",
  "evidence_not_created",
  "durable_state_not_applied",
  "formation_receipt_not_written",
  "provider_call_not_executed",
  "retrieval_not_executed",
  "source_fetch_not_executed",
  "git_github_not_executed",
  "release_not_executed",
  "privacy_guard_applied",
] as const satisfies readonly ConversationHandoffPacketReasonCodeV02[];

const sectionTitles: Record<ConversationHandoffPacketSectionIdV02, string> = {
  project_context: "Project Context",
  current_baseline: "Current Baseline",
  current_task: "Current Task",
  expected_files: "Expected Files",
  observed_files: "Observed Files",
  expected_checks: "Expected Checks",
  observed_checks: "Observed Checks",
  expected_observed_delta: "Expected/Observed Delta",
  known_warnings: "Known Warnings",
  skipped_checks_and_reason: "Skipped Checks And Reason",
  not_done_classification: "Not-Done Classification",
  source_refs: "Source Refs",
  dogfooding_record_refs: "Dogfooding Record Refs",
  review_memory_refs: "Review Memory Refs",
  promotion_receipt_state_refs: "Promotion/Receipt/State Refs",
  unresolved_tensions: "Unresolved Tensions",
  authority_boundary: "Authority Boundary",
  forbidden_capabilities: "Forbidden Capabilities",
  stop_conditions: "Stop Conditions",
  pr_body_requirements: "PR Body Requirements",
  validation_commands: "Validation Commands",
  next_recommended_slice: "Next Recommended Slice",
};

const profileSectionOrder: Record<
  ConversationHandoffPacketProfileV02,
  ConversationHandoffPacketSectionIdV02[]
> = {
  chatgpt_strategy: [
    "project_context",
    "current_baseline",
    "current_task",
    "unresolved_tensions",
    "expected_observed_delta",
    "dogfooding_record_refs",
    "source_refs",
    "next_recommended_slice",
    "authority_boundary",
    "forbidden_capabilities",
  ],
  codex_implementation: [
    "current_task",
    "current_baseline",
    "expected_files",
    "validation_commands",
    "expected_checks",
    "forbidden_capabilities",
    "stop_conditions",
    "authority_boundary",
    "pr_body_requirements",
    "next_recommended_slice",
  ],
  codex_pr_review: [
    "current_task",
    "observed_files",
    "observed_checks",
    "expected_observed_delta",
    "skipped_checks_and_reason",
    "known_warnings",
    "not_done_classification",
    "unresolved_tensions",
    "authority_boundary",
    "forbidden_capabilities",
    "source_refs",
  ],
  human_operator_review: [
    "project_context",
    "current_baseline",
    "current_task",
    "observed_checks",
    "skipped_checks_and_reason",
    "known_warnings",
    "not_done_classification",
    "unresolved_tensions",
    "expected_observed_delta",
    "next_recommended_slice",
    "authority_boundary",
    "forbidden_capabilities",
  ],
  boundary_audit: [
    "authority_boundary",
    "forbidden_capabilities",
    "stop_conditions",
    "source_refs",
    "dogfooding_record_refs",
    "review_memory_refs",
    "promotion_receipt_state_refs",
    "next_recommended_slice",
  ],
  handoff_minimal: [
    "current_task",
    "next_recommended_slice",
    "authority_boundary",
    "forbidden_capabilities",
    "stop_conditions",
  ],
  release_readiness_review: [
    "current_baseline",
    "current_task",
    "observed_checks",
    "skipped_checks_and_reason",
    "known_warnings",
    "not_done_classification",
    "expected_observed_delta",
    "unresolved_tensions",
    "authority_boundary",
    "forbidden_capabilities",
    "stop_conditions",
    "next_recommended_slice",
  ],
};

const forbiddenAuthorityFields = [
  "ui_now",
  "component_now",
  "cockpit_change_now",
  "public_surface_change_now",
  "route_model_change_now",
  "api_route_now",
  "db_migration_now",
  "provider_openai_call_now",
  "prompt_sent_now",
  "source_fetch_now",
  "retrieval_execution_now",
  "retrieval_index_write_now",
  "proof_or_evidence_record_now",
  "claim_or_evidence_write_now",
  "review_memory_write_now",
  "promotion_execution_now",
  "promotion_decision_record_write_now",
  "formation_receipt_write_now",
  "durable_state_write_now",
  "durable_state_apply_now",
  "product_write_now",
  "product_id_allocation_now",
  "codex_execution_from_augnes_runtime_now",
  "github_api_call_now",
  "git_write_now",
  "github_git_actuation_now",
  "release_deploy_publish_now",
  "handoff_packet_is_execution_approval",
  "handoff_packet_is_truth",
  "handoff_packet_is_proof",
  "handoff_packet_is_accepted_evidence",
  "expected_files_are_write_authority",
  "observed_files_are_proof",
  "expected_checks_are_proof",
  "observed_checks_are_approval",
  "validation_pass_is_approval",
  "validation_failure_is_rejection",
  "smoke_pass_is_evidence",
  "smoke_failure_is_rejection",
  "ci_pass_is_authority",
  "ci_failure_is_rejection",
  "pr_body_is_authority",
  "codex_report_is_execution_approval",
  "git_ref_is_authority",
  "github_pr_ref_is_authority",
  "next_recommended_slice_is_execution_approval",
] as const;
const allowedTrueAuthorityFields = [
  "conversation_handoff_packet_builder_now",
  "caller_provided_input_only",
  "public_safe_summary_only",
  "candidate_only_conversation_guidance",
  "dogfooding_record_is_candidate_only",
  "review_memory_refs_are_reference_only",
  "promotion_receipt_state_refs_are_reference_only",
] as const;
const forbiddenAuthorityFieldSet = new Set<string>(forbiddenAuthorityFields);
const allowedTrueAuthorityFieldSet = new Set<string>(allowedTrueAuthorityFields);

const forbiddenAuthorityPhrasePatterns = [
  /\bhandoff packet\s+(?:is|=|as)\s+(?!not\b)(?:execution approval|truth|proof|accepted evidence|authority|approval)\b/i,
  /\bexpected files?\s+(?:is|are|=|as)\s+(?!not\b)(?:write authority|authority|approval)\b/i,
  /\bobserved files?\s+(?:is|are|=|as)\s+(?!not\b)(?:proof|accepted evidence|evidence|authority|approval)\b/i,
  /\bexpected checks?\s+(?:is|are|=|as)\s+(?!not\b)(?:proof|accepted evidence|evidence|authority|approval)\b/i,
  /\bobserved checks?\s+(?:is|are|=|as)\s+(?!not\b)(?:approval|authority|proof)\b/i,
  /\bvalidation pass\s+(?:is|=|as)\s+(?!not\b)(?:approval|truth|proof|authority)\b/i,
  /\bvalidation failure\s+(?:is|=|as)\s+(?!not\b|diagnostic\b)(?:automatic\s+)?rejection\b/i,
  /\bsmoke pass\s+(?:is|=|as)\s+(?!not\b)(?:accepted evidence|evidence|truth|proof|approval|authority)\b/i,
  /\bsmoke failure\s+(?:is|=|as)\s+(?!not\b|diagnostic\b)(?:automatic\s+)?rejection\b/i,
  /\bci pass\s+(?:is|=|as)\s+(?!not\b)(?:truth|proof|approval|authority|promotion|merge approval|release approval|product-write authority|durable state)\b/i,
  /\bci failure\s+(?:is|=|as)\s+(?!not\b|diagnostic\b)(?:automatic\s+)?rejection\b/i,
  /\bpr body\s+(?:is|=|as)\s+(?!not\b)(?:truth|proof|authority|approval)\b/i,
  /\bcodex (?:report|result)\s+(?:is|=|as)\s+(?!not\b)(?:execution approval|proof|accepted evidence|evidence|authority|approval|durable state|state)\b/i,
  /\bdogfooding record\s+(?:is|=|as)\s+(?!not\b)(?:review memory write|promotion|formation receipt|durable perspective state|product-write|truth|proof|authority|approval)\b/i,
  /\breview memory refs?\s+(?:is|are|=|as)\s+(?!not\b)(?:approval|authority|write authority|truth|proof)\b/i,
  /\bpromotion\/receipt\/state refs?\s+(?:is|are|=|as)\s+(?!not\b)(?:approval|authority|execution approval|durable state|truth|proof)\b/i,
  /\bnext recommended slice\s+(?:is|=|as)\s+(?!not\b)(?:execution approval|approval|authority|promotion)\b/i,
  /\bprovider output\s+(?:is|=|as)\s+(?!not\b)(?:truth|proof|accepted evidence|evidence)\b/i,
  /\bretrieval (?:result|score)\s+(?:is|=|as)\s+(?!not\b)(?:accepted evidence|evidence|authority|promotion authority|truth score|truth|promotion readiness|approval)\b/i,
  /\bfeedback\s+(?:is|=|as)\s+(?!not\b)truth\b/i,
  /\blayout coordinates?\s+(?:is|are|=|as)\s+(?!not\b)(?:truth|authority|source of truth)\b/i,
  /\bsalience score\s+(?:is|=|as)\s+(?!not\b)(?:truth|truth score|authority|promotion readiness)\b/i,
  /\bgit (?:commit|ref|tag|branch)\s+(?:is|=|as)\s+(?!not\b)(?:approval|authority|durable state|core decision|promotion)\b/i,
  /\bgithub (?:branch|commit|pr)\s+(?:is|=|as)\s+(?!not\b)(?:core decision|automatic execution authority|execution authority|authority)\b/i,
] as const;

export function createConversationHandoffPacketAuthorityBoundaryV02():
  ConversationHandoffPacketAuthorityBoundaryV02 {
  return {
    conversation_handoff_packet_builder_now: true,
    caller_provided_input_only: true,
    public_safe_summary_only: true,
    candidate_only_conversation_guidance: true,
    ui_now: false,
    component_now: false,
    cockpit_change_now: false,
    public_surface_change_now: false,
    route_model_change_now: false,
    api_route_now: false,
    db_migration_now: false,
    provider_openai_call_now: false,
    prompt_sent_now: false,
    source_fetch_now: false,
    retrieval_execution_now: false,
    retrieval_index_write_now: false,
    proof_or_evidence_record_now: false,
    claim_or_evidence_write_now: false,
    review_memory_write_now: false,
    promotion_execution_now: false,
    promotion_decision_record_write_now: false,
    formation_receipt_write_now: false,
    durable_state_write_now: false,
    durable_state_apply_now: false,
    product_write_now: false,
    product_id_allocation_now: false,
    codex_execution_from_augnes_runtime_now: false,
    github_api_call_now: false,
    git_write_now: false,
    github_git_actuation_now: false,
    release_deploy_publish_now: false,
    handoff_packet_is_execution_approval: false,
    handoff_packet_is_truth: false,
    handoff_packet_is_proof: false,
    handoff_packet_is_accepted_evidence: false,
    expected_files_are_write_authority: false,
    observed_files_are_proof: false,
    expected_checks_are_proof: false,
    observed_checks_are_approval: false,
    validation_pass_is_approval: false,
    validation_failure_is_rejection: false,
    smoke_pass_is_evidence: false,
    smoke_failure_is_rejection: false,
    ci_pass_is_authority: false,
    ci_failure_is_rejection: false,
    pr_body_is_authority: false,
    codex_report_is_execution_approval: false,
    dogfooding_record_is_candidate_only: true,
    review_memory_refs_are_reference_only: true,
    promotion_receipt_state_refs_are_reference_only: true,
    git_ref_is_authority: false,
    github_pr_ref_is_authority: false,
    next_recommended_slice_is_execution_approval: false,
  };
}

export function buildConversationHandoffPacketV02(
  input: unknown,
): ConversationHandoffPacketBuildResultV02 {
  const authorityBoundary = createConversationHandoffPacketAuthorityBoundaryV02();
  const privacyReport = buildPrivacyRedactionRuntimeGuardReportV01(input);
  if (privacyReport.status !== "passed") {
    return buildResult({
      status:
        privacyReport.status === "blocked_forbidden_authority"
          ? "blocked_forbidden_authority"
          : "blocked_private_or_raw_payload",
      packet: null,
      privacyReport,
      reasonCodes: [
        ...baseReasonCodes,
        privacyReport.status === "blocked_forbidden_authority"
          ? "forbidden_authority_blocked"
          : "raw_private_payload_blocked",
      ],
      authorityBoundary,
    });
  }

  if (!isRecord(input)) {
    return buildResult({
      status: "rejected",
      packet: null,
      privacyReport,
      reasonCodes: baseReasonCodes,
      authorityBoundary,
    });
  }

  const authorityFindings = detectForbiddenAuthorityFindings(input);
  if (authorityFindings.length > 0) {
    return buildResult({
      status: "blocked_forbidden_authority",
      packet: null,
      privacyReport: buildForbiddenAuthorityReport(input, authorityFindings),
      reasonCodes: [...baseReasonCodes, "forbidden_authority_blocked"],
      authorityBoundary,
    });
  }

  const normalized = normalizePacketInput(input);
  if (!normalized) {
    return buildResult({
      status: "rejected",
      packet: null,
      privacyReport,
      reasonCodes: baseReasonCodes,
      authorityBoundary,
    });
  }

  const sections = buildSections(normalized);
  const packetWithoutFingerprint = {
    packet_version: ConversationHandoffPacketVersionV02,
    builder_version: ConversationHandoffPacketBuilderVersionV02,
    scope: ConversationHandoffPacketScopeV02,
    profile: normalized.profile,
    packet_id: normalized.packet_id,
    created_at: normalized.created_at,
    sections,
    authority_boundary: authorityBoundary,
    forbidden_capabilities: normalized.forbidden_capabilities,
    reason_codes: normalized.reason_codes,
    deterministic_profile_notes: buildProfileNotes(normalized.profile),
  } satisfies Omit<ConversationHandoffPacketV02, "plain_text" | "packet_fingerprint">;
  const plainText = buildPlainText(packetWithoutFingerprint);
  const packet: ConversationHandoffPacketV02 = {
    ...packetWithoutFingerprint,
    plain_text: plainText,
    packet_fingerprint: createConversationHandoffPacketFingerprintV02({
      ...packetWithoutFingerprint,
      plain_text: plainText,
    }),
  };

  return buildResult({
    status: "built",
    packet,
    privacyReport,
    reasonCodes: packet.reason_codes,
    authorityBoundary,
  });
}

export function createConversationHandoffPacketFingerprintV02(
  packetOrInput: unknown,
): string {
  const valueForHash = cloneJson(packetOrInput);
  if (isRecord(valueForHash)) {
    delete valueForHash.packet_fingerprint;
  }
  return `sha256:${createHash("sha256")
    .update(canonicalJson(valueForHash))
    .digest("hex")}`;
}

function buildResult({
  status,
  packet,
  privacyReport,
  reasonCodes,
  authorityBoundary,
}: {
  status: ConversationHandoffPacketBuildResultV02["status"];
  packet: ConversationHandoffPacketV02 | null;
  privacyReport: PrivacyRedactionRuntimeGuardReport | null;
  reasonCodes: readonly ConversationHandoffPacketReasonCodeV02[];
  authorityBoundary: ConversationHandoffPacketAuthorityBoundaryV02;
}): ConversationHandoffPacketBuildResultV02 {
  return {
    ok: status === "built",
    status,
    error_code: status === "built" ? null : status,
    packet,
    privacy_report: privacyReport,
    reason_codes: uniqueSortedReasonCodes(reasonCodes),
    authority_boundary: authorityBoundary,
    product_write_executed: false,
    review_memory_written: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    promotion_executed: false,
    formation_receipt_written: false,
    durable_state_applied: false,
    github_git_actuated: false,
    provider_called: false,
    retrieval_executed: false,
    source_fetched: false,
    release_deploy_publish_executed: false,
  };
}

function normalizePacketInput(input: JsonRecord): NormalizedPacketInput | null {
  const profile = normalizeProfile(input.profile);
  if (!profile) return null;
  if (normalizeString(input.scope, "") !== ConversationHandoffPacketScopeV02) {
    return null;
  }
  const packetId =
    normalizeString(input.packet_id, "") ||
    deterministicPacketIdFromInput(input, profile);
  const createdAt = normalizeString(input.created_at, defaultCreatedAt);
  const nextRecommendedSlice =
    normalizeString(input.next_recommended_slice, "") ||
    ConversationHandoffPacketNextSliceV02;
  const forbiddenCapabilities = uniqueSortedStrings([
    ...defaultForbiddenCapabilities,
    ...normalizeList(input.forbidden_capabilities),
  ]);
  const reasonCodes = uniqueSortedReasonCodes([
    ...baseReasonCodes,
    "profile_specific_section_order",
    ...normalizeReasonCodes(input.reason_codes),
  ]);

  return {
    packet_id: packetId,
    packet_version: ConversationHandoffPacketVersionV02,
    scope: ConversationHandoffPacketScopeV02,
    profile,
    created_at: createdAt,
    project_context: normalizeList(input.project_context),
    current_baseline: normalizeList(input.current_baseline),
    current_task: normalizeList(input.current_task),
    expected_files: normalizeList(input.expected_files),
    observed_files: normalizeList(input.observed_files),
    expected_checks: normalizeList(input.expected_checks),
    observed_checks: normalizeList(input.observed_checks),
    expected_observed_delta: normalizeList(input.expected_observed_delta),
    known_warnings: normalizeList(input.known_warnings),
    skipped_checks: normalizeList(input.skipped_checks),
    not_done_items: normalizeList(input.not_done_items),
    source_refs: normalizeList(input.source_refs),
    dogfooding_record_refs: normalizeList(input.dogfooding_record_refs),
    review_memory_refs: normalizeList(input.review_memory_refs),
    promotion_receipt_state_refs: normalizeList(input.promotion_receipt_state_refs),
    unresolved_tensions: normalizeList(input.unresolved_tensions),
    forbidden_capabilities: forbiddenCapabilities,
    stop_conditions: uniqueSortedStrings([
      ...defaultStopConditions,
      ...normalizeList(input.stop_conditions),
    ]),
    pr_body_requirements: uniqueSortedStrings([
      ...defaultPrBodyRequirements,
      ...normalizeList(input.pr_body_requirements),
    ]),
    validation_commands: uniqueSortedStrings([
      ...defaultValidationCommands,
      ...normalizeList(input.validation_commands),
    ]),
    next_recommended_slice: nextRecommendedSlice,
    reason_codes: reasonCodes,
  };
}

function normalizeProfile(value: unknown): ConversationHandoffPacketProfileV02 | null {
  if (typeof value !== "string") return null;
  if (ConversationHandoffPacketProfilesV02.includes(
    value as ConversationHandoffPacketProfileV02,
  )) {
    return value as ConversationHandoffPacketProfileV02;
  }
  return null;
}

function buildSections(
  input: NormalizedPacketInput,
): ConversationHandoffPacketSectionV02[] {
  const contentBySection: Record<ConversationHandoffPacketSectionIdV02, string[]> = {
    project_context: withFallback(input.project_context, "No project context supplied."),
    current_baseline: withFallback(input.current_baseline, "No current baseline supplied."),
    current_task: withFallback(input.current_task, "No current task supplied."),
    expected_files: withFallback(input.expected_files, "No expected files supplied."),
    observed_files: withFallback(input.observed_files, "No observed files supplied."),
    expected_checks: withFallback(input.expected_checks, "No expected checks supplied."),
    observed_checks: withFallback(input.observed_checks, "No observed checks supplied."),
    expected_observed_delta: withFallback(
      input.expected_observed_delta,
      "No expected/observed delta supplied.",
    ),
    known_warnings: withFallback(input.known_warnings, "No known warnings supplied."),
    skipped_checks_and_reason: withFallback(
      input.skipped_checks,
      "No skipped checks supplied.",
    ),
    not_done_classification: withFallback(
      input.not_done_items,
      "No not-done items supplied.",
    ),
    source_refs: withFallback(input.source_refs, "No source refs supplied."),
    dogfooding_record_refs: withFallback(
      input.dogfooding_record_refs,
      "No dogfooding record refs supplied.",
    ),
    review_memory_refs: withFallback(
      input.review_memory_refs,
      "No Review Memory refs supplied.",
    ),
    promotion_receipt_state_refs: withFallback(
      input.promotion_receipt_state_refs,
      "No promotion, receipt, or state refs supplied.",
    ),
    unresolved_tensions: withFallback(
      input.unresolved_tensions,
      "No unresolved tensions supplied.",
    ),
    authority_boundary: [...defaultAuthorityBoundaryLines],
    forbidden_capabilities: input.forbidden_capabilities,
    stop_conditions: input.stop_conditions,
    pr_body_requirements: input.pr_body_requirements,
    validation_commands: input.validation_commands,
    next_recommended_slice: [
      `${input.next_recommended_slice} remains a cue, not execution approval.`,
    ],
  };
  const order = profileSectionOrder[input.profile];
  return order.map((sectionId) => ({
    section_id: sectionId,
    title: sectionTitles[sectionId],
    body_lines: contentBySection[sectionId],
    source_field_refs: sourceFieldsForSection(sectionId),
  }));
}

function sourceFieldsForSection(
  sectionId: ConversationHandoffPacketSectionIdV02,
): string[] {
  const sourceFields: Record<ConversationHandoffPacketSectionIdV02, string[]> = {
    project_context: ["project_context"],
    current_baseline: ["current_baseline"],
    current_task: ["current_task"],
    expected_files: ["expected_files"],
    observed_files: ["observed_files"],
    expected_checks: ["expected_checks"],
    observed_checks: ["observed_checks"],
    expected_observed_delta: ["expected_observed_delta"],
    known_warnings: ["known_warnings"],
    skipped_checks_and_reason: ["skipped_checks"],
    not_done_classification: ["not_done_items"],
    source_refs: ["source_refs"],
    dogfooding_record_refs: ["dogfooding_record_refs"],
    review_memory_refs: ["review_memory_refs"],
    promotion_receipt_state_refs: ["promotion_receipt_state_refs"],
    unresolved_tensions: ["unresolved_tensions"],
    authority_boundary: ["authority_boundary", "default_authority_boundary"],
    forbidden_capabilities: ["forbidden_capabilities", "default_forbidden_capabilities"],
    stop_conditions: ["stop_conditions", "default_stop_conditions"],
    pr_body_requirements: ["pr_body_requirements", "default_pr_body_requirements"],
    validation_commands: ["validation_commands", "default_validation_commands"],
    next_recommended_slice: ["next_recommended_slice"],
  };
  return sourceFields[sectionId];
}

function buildProfileNotes(profile: ConversationHandoffPacketProfileV02): string[] {
  const notesByProfile: Record<ConversationHandoffPacketProfileV02, string[]> = {
    chatgpt_strategy: [
      "Profile emphasizes current status, unresolved tensions, next recommended slice, and review notes.",
    ],
    codex_implementation: [
      "Profile keeps expected files, validation commands, forbidden capabilities, stop conditions, and PR body requirements prominent.",
    ],
    codex_pr_review: [
      "Profile emphasizes observed files, observed checks, expected/observed delta, skipped checks, warnings, not-done items, and authority boundary.",
    ],
    human_operator_review: [
      "Profile emphasizes readiness cues, skipped checks, warnings, unresolved tensions, and incomplete items.",
    ],
    boundary_audit: [
      "Profile emphasizes authority boundary, forbidden capabilities, stop conditions, and blocked authority shortcuts.",
    ],
    handoff_minimal: [
      "Profile is compact but keeps authority boundary and forbidden capabilities present.",
    ],
    release_readiness_review: [
      "Profile emphasizes readiness, blocked items, skipped checks, warnings, release non-authority, and no deploy/publish execution.",
    ],
  };
  return [
    `profile:${profile}`,
    "same input and profile produce deterministic plain text and fingerprint",
    "authority boundary and forbidden capabilities are preserved for every profile",
    ...notesByProfile[profile],
  ];
}

function buildPlainText(
  packet: Omit<ConversationHandoffPacketV02, "plain_text" | "packet_fingerprint">,
): string {
  const header = [
    "# Conversation Handoff Packet",
    `Packet ID: ${packet.packet_id}`,
    `Packet Version: ${packet.packet_version}`,
    `Builder Version: ${packet.builder_version}`,
    `Scope: ${packet.scope}`,
    `Profile: ${packet.profile}`,
    `Created At: ${packet.created_at}`,
    `Slice: ${ConversationHandoffPacketSliceV02}`,
  ];
  const sections = packet.sections.flatMap((section) => [
    "",
    `## ${section.title}`,
    ...section.body_lines.map((line) => `- ${line}`),
  ]);
  const notes = [
    "",
    "## Deterministic Profile Notes",
    ...packet.deterministic_profile_notes.map((line) => `- ${line}`),
    "",
    "## Reason Codes",
    ...packet.reason_codes.map((line) => `- ${line}`),
  ];
  return [...header, ...sections, ...notes].join("\n");
}

function detectForbiddenAuthorityFindings(
  input: JsonRecord,
): PrivacyRedactionRuntimeGuardFinding[] {
  const findings: Array<Omit<PrivacyRedactionRuntimeGuardFinding, "finding_id">> = [];
  visitValue(input, "input", (path, value, key) => {
    if (key && isForbiddenAuthorityField(key, value)) {
      findings.push({
        path,
        finding_kind: "forbidden_authority_claim",
        severity: "critical",
        action: "blocked",
        reason_codes: ["authority_escalation_blocked", "public_safe_summary_only"],
        public_safe_summary:
          "Forbidden authority claim was blocked; no raw value included.",
        original_value_included: false,
      });
    }
    if (typeof value !== "string") return;
    for (const pattern of forbiddenAuthorityPhrasePatterns) {
      pattern.lastIndex = 0;
      if (!pattern.test(value)) continue;
      findings.push({
        path,
        finding_kind: "forbidden_authority_phrase",
        severity: "critical",
        action: "blocked",
        reason_codes: ["authority_escalation_blocked", "public_safe_summary_only"],
        public_safe_summary:
          "Forbidden authority phrase was blocked; no raw value included.",
        original_value_included: false,
      });
    }
  });
  return findings.map((finding, index) => ({
    finding_id: `conversation-handoff-authority-finding-${String(index + 1).padStart(3, "0")}`,
    ...finding,
  }));
}

function buildForbiddenAuthorityReport(
  input: JsonRecord,
  findings: PrivacyRedactionRuntimeGuardFinding[],
): PrivacyRedactionRuntimeGuardReport {
  const reportWithoutFingerprint: Omit<
    PrivacyRedactionRuntimeGuardReport,
    "guard_fingerprint"
  > = {
    guard_version: PRIVACY_REDACTION_RUNTIME_GUARD_VERSION,
    scope: ConversationHandoffPacketScopeV02,
    status: "blocked_forbidden_authority",
    as_of: normalizeString(input.created_at, defaultCreatedAt),
    subject_ref: "conversation-handoff-packet:blocked",
    findings,
    redacted_preview: {
      status: "blocked_forbidden_authority",
      public_safe_summary_only: true,
    },
    blocked_paths: uniqueSortedStrings(findings.map((finding) => finding.path)),
    redacted_paths: [],
    reason_codes: ["authority_escalation_blocked", "public_safe_summary_only"],
    boundary_notes: [
      "Forbidden authority shortcuts are blocked without raw value echo.",
      "Handoff packets remain candidate-only conversation guidance.",
    ],
    authority_boundary: createPrivacyRedactionRuntimeGuardAuthorityBoundaryV01(),
  };
  return {
    ...reportWithoutFingerprint,
    guard_fingerprint:
      createPrivacyRedactionRuntimeGuardFingerprintV01(reportWithoutFingerprint),
  };
}

function isForbiddenAuthorityField(key: string, value: unknown): boolean {
  if (value === false || value === null || value === undefined) return false;
  const lower = key.toLowerCase();
  if (allowedTrueAuthorityFieldSet.has(lower)) return false;
  return (
    forbiddenAuthorityFieldSet.has(lower) ||
    lower.endsWith("_authority") ||
    lower.endsWith("_authority_now") ||
    lower.endsWith("_write_now") ||
    lower.endsWith("_call_now") ||
    lower.endsWith("_execution_now") ||
    lower.endsWith("_is_truth") ||
    lower.endsWith("_is_proof") ||
    lower.endsWith("_is_approval") ||
    lower.endsWith("_is_rejection")
  );
}

function visitValue(
  value: unknown,
  path: string,
  visitor: (path: string, value: unknown, key?: string) => void,
  key?: string,
): void {
  visitor(path, value, key);
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      visitValue(item, `${path}[${index}]`, visitor);
    });
    return;
  }
  if (!isRecord(value)) return;
  for (const key of Object.keys(value).sort()) {
    visitValue(value[key], `${path}.${safePathSegment(key)}`, visitor, key);
  }
}

function normalizeList(value: unknown): string[] {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) {
    return uniqueSortedStrings(value.map((item) => normalizeString(item, "")));
  }
  return uniqueSortedStrings([normalizeString(value, "")]);
}

function normalizeReasonCodes(
  value: unknown,
): ConversationHandoffPacketReasonCodeV02[] {
  const allowed = new Set<string>(ConversationHandoffPacketReasonCodesV02);
  return normalizeList(value).filter(
    (reasonCode): reasonCode is ConversationHandoffPacketReasonCodeV02 =>
      allowed.has(reasonCode),
  );
}

function normalizeString(value: unknown, fallback: string): string {
  if (typeof value === "string") return clampText(value.trim()) || fallback;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value === null || value === undefined) return fallback;
  return clampText(canonicalJson(value));
}

function clampText(value: string): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= 480) return normalized;
  return `${normalized.slice(0, 477).trimEnd()}...`;
}

function withFallback(items: string[], fallback: string): string[] {
  return items.length === 0 ? [fallback] : items;
}

function deterministicPacketIdFromInput(
  input: JsonRecord,
  profile: ConversationHandoffPacketProfileV02,
): string {
  return `${defaultPacketIdPrefix}:${profile}:${createHash("sha256")
    .update(canonicalJson(input))
    .digest("hex")
    .slice(0, 16)}`;
}

function uniqueSortedStrings(values: readonly string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).sort();
}

function uniqueSortedReasonCodes(
  values: readonly ConversationHandoffPacketReasonCodeV02[],
): ConversationHandoffPacketReasonCodeV02[] {
  const allowed = new Set<string>(ConversationHandoffPacketReasonCodesV02);
  return Array.from(new Set(values.filter((value) => allowed.has(value)))).sort();
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(sortJson(value));
}

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => sortJson(item));
  if (!isRecord(value)) return value;
  return Object.keys(value)
    .sort()
    .reduce<JsonRecord>((acc, key) => {
      acc[key] = sortJson(value[key]);
      return acc;
    }, {});
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function safePathSegment(key: string): string {
  return key.replace(/[^A-Za-z0-9_-]/g, "_");
}
