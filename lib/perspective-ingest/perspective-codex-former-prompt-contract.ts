import {
  containsUnsafeCodexPerspectiveMaterial,
  type CodexPerspectiveFormerInputPacketV0,
} from "@/lib/perspective-ingest/perspective-codex-former-input-packet";
import type { CodexPerspectiveCandidateDraftV0 } from "@/lib/perspective-ingest/perspective-codex-candidate-draft-pipeline";

export type CodexPerspectiveFormerDraftPromptContractVersionV0 =
  "codex_perspective_former_draft_prompt_contract.v0.1";
export type CodexPerspectiveFormerDraftPromptContractKindV0 =
  "codex_perspective_former_draft_prompt_contract";
export type CodexPerspectiveDraftPromptContractFitVersionV0 =
  "codex_perspective_draft_prompt_contract_fit.v0.1";
export type CodexPerspectiveDraftPromptContractFitKindV0 =
  "codex_perspective_draft_prompt_contract_fit";
export type CodexPerspectiveDraftPromptContractFitStatusV0 =
  | "fits_contract"
  | "needs_review"
  | "violates_contract";

export interface CodexPerspectiveFormerDraftPromptContractV0 {
  contract_version: CodexPerspectiveFormerDraftPromptContractVersionV0;
  contract_kind: CodexPerspectiveFormerDraftPromptContractKindV0;
  role: CodexPerspectiveFormerInputPacketV0["role"];
  source_former_input_packet: {
    packet_version: CodexPerspectiveFormerInputPacketV0["packet_version"];
    packet_id: string;
    role: CodexPerspectiveFormerInputPacketV0["role"];
  };
  allowed_input_material: string[];
  output_contract: {
    draft_version: "codex_perspective_candidate_draft.v0.1";
    draft_kind: "codex_perspective_candidate_draft";
    required_fields: string[];
    output_is_draft_review_material_only: true;
    must_use_pointer_only_refs: true;
    must_include_non_summary_usefulness: true;
  };
  neutral_perspective_requirements: string[];
  basis_quality_rules: string[];
  privacy_rules: string[];
  authority_rules: string[];
  insufficiency_rules: string[];
  source_packet_summary: {
    source_pr_refs: string[];
    changed_files: string[];
    changed_files_summary: string | null;
    readiness_status: string;
    readiness_reasons: string[];
    checks_run_count: number;
    skipped_checks_count: number;
    unresolved_gaps_count: number;
    pointer_refs_count: number;
    unsafe_input_material_omitted: boolean;
    omitted_unsafe_field_count: number;
  };
  copyable_former_draft_prompt_text: string;
}

export interface CodexPerspectiveDraftPromptContractFitWarningV0 {
  warning_kind:
    | "plain_summary"
    | "missing_usefulness"
    | "overconfident_basis"
    | "pointer_ref"
    | "missing_user_core_questions"
    | "authority_claim"
    | "unsafe_material";
  field: string;
  summary: string;
}

export interface CodexPerspectiveDraftPromptContractFitResultV0 {
  contract_fit_version: CodexPerspectiveDraftPromptContractFitVersionV0;
  contract_fit_kind: CodexPerspectiveDraftPromptContractFitKindV0;
  status: CodexPerspectiveDraftPromptContractFitStatusV0;
  warnings: CodexPerspectiveDraftPromptContractFitWarningV0[];
  privacy: {
    raw_payloads_included: false;
    unsafe_material_detected: boolean;
  };
  authority_flags: {
    committed_state: false;
    persistence: false;
    provider_model_api_calls: false;
    proof_evidence_readiness_writes: false;
    codex_execution: false;
    github_mutation: false;
    merge_publish_approval: false;
    core_decision: false;
  };
}

const authorityFlagKeys = [
  "committed_state",
  "persistence",
  "provider_model_api_calls",
  "proof_evidence_readiness_writes",
  "codex_execution",
  "github_mutation",
  "merge_publish_approval",
  "core_decision",
] as const;

export function buildCodexPerspectiveFormerDraftPromptContractFromInputPacket(
  inputPacket: CodexPerspectiveFormerInputPacketV0,
): CodexPerspectiveFormerDraftPromptContractV0 {
  const allowedInputMaterial = [
    "source PR refs",
    "bounded changed-file summaries and changed-file paths",
    "validation command summaries and skipped-check reasons",
    "unresolved gap summaries",
    "authority boundary summaries",
    "privacy and redaction summaries",
    "pointer-only refs listed in the former input packet",
  ];
  const neutralPerspectiveRequirements = [
    "Form a neutral perspective, not a plain PR summary.",
    "Use the thesis to explain a validation boundary, unresolved tension, scope/risk tradeoff, or next smallest useful work.",
    "State why the perspective is useful beyond a plain summary in the thesis or qualification notes.",
    "Separate plain summary facts from neutral perspective, validation gaps, next actions, and user/Core decision questions.",
    "Preserve uncertainty; do not make ready claims when the packet only supports needs-review or blocked material.",
  ];
  const basisQualityRules = [
    "Use sufficient_for_review only when packet material has concrete validation summaries and no unresolved gaps.",
    "Use needs_review when skipped checks, unresolved gaps, weak verification, or qualification notes remain.",
    "Use blocked when the packet is blocked or a safe draft cannot be produced from bounded material.",
    "Do not claim checks passed unless the former input packet provides check summaries.",
    "Give concrete reasons for the basis_quality_suggestion status.",
  ];
  const privacyRules = [
    "Use only bounded summaries and pointer refs from the packet.",
    "Use privacy_flags only as { raw_payloads_included: false, unsafe_input_material_omitted: boolean, omitted_unsafe_fields: string[] }.",
    "Do not invent raw diffs, raw review data, raw source data, hidden reasoning, private material, provider material, token material, billing material, credentials, or sensitive values.",
    "Preserve pointer-only semantics for evidence_pointer_refs.",
    "If unsafe input was omitted, mention omission only as a qualification without reconstructing the omitted content.",
  ];
  const authorityRules = [
    "Output is draft/review material only.",
    "Do not create proof, evidence, or readiness records.",
    "Do not approve, merge, publish, retry, replay, deploy, or mutate GitHub.",
    "Do not execute Codex, call the Codex SDK, or call provider/model/API services.",
    "Do not make Core decisions.",
    "Set every authority flag to false.",
  ];
  const insufficiencyRules = [
    "If the packet is insufficient, produce needs_review or blocked draft material with visible reasons.",
    "If a neutral perspective beyond summary cannot be produced, say so in qualification_notes and set basis_quality_suggestion accordingly.",
    "Prefer a narrow next-action candidate that resolves input gaps or refines the prompt contract.",
  ];
  const sourcePacketSummary = buildSourcePacketSummary(inputPacket);
  const copyableFormerDraftPromptText = renderPromptText({
    inputPacket,
    allowedInputMaterial,
    neutralPerspectiveRequirements,
    basisQualityRules,
    privacyRules,
    authorityRules,
    insufficiencyRules,
  });

  return {
    contract_version: "codex_perspective_former_draft_prompt_contract.v0.1",
    contract_kind: "codex_perspective_former_draft_prompt_contract",
    role: inputPacket.role,
    source_former_input_packet: {
      packet_version: inputPacket.packet_version,
      packet_id: inputPacket.packet_id,
      role: inputPacket.role,
    },
    allowed_input_material: allowedInputMaterial,
    output_contract: {
      draft_version: "codex_perspective_candidate_draft.v0.1",
      draft_kind: "codex_perspective_candidate_draft",
      required_fields: [...inputPacket.expected_output_contract.required_fields],
      output_is_draft_review_material_only: true,
      must_use_pointer_only_refs: true,
      must_include_non_summary_usefulness: true,
    },
    neutral_perspective_requirements: neutralPerspectiveRequirements,
    basis_quality_rules: basisQualityRules,
    privacy_rules: privacyRules,
    authority_rules: authorityRules,
    insufficiency_rules: insufficiencyRules,
    source_packet_summary: sourcePacketSummary,
    copyable_former_draft_prompt_text: copyableFormerDraftPromptText,
  };
}

export function buildCodexPerspectiveFormerDraftPromptFromInputPacket(
  inputPacket: CodexPerspectiveFormerInputPacketV0,
): string {
  return buildCodexPerspectiveFormerDraftPromptContractFromInputPacket(
    inputPacket,
  ).copyable_former_draft_prompt_text;
}

export function evaluateCodexPerspectiveCandidateDraftPromptContractFit({
  former_input_packet,
  draft,
}: {
  former_input_packet: CodexPerspectiveFormerInputPacketV0;
  draft: Partial<CodexPerspectiveCandidateDraftV0> | null | undefined;
}): CodexPerspectiveDraftPromptContractFitResultV0 {
  const warnings: CodexPerspectiveDraftPromptContractFitWarningV0[] = [];

  if (!isRecord(draft)) {
    warnings.push({
      warning_kind: "plain_summary",
      field: "draft",
      summary: "Draft is missing or is not an object.",
    });

    return buildContractFitResult(warnings);
  }

  const unsafeFields = collectUnsafeFieldNames(draft, "draft");
  warnings.push(
    ...unsafeFields.map((field) => ({
      warning_kind: "unsafe_material" as const,
      field,
      summary:
        "Draft field includes unsafe material markers and must be omitted or blocked.",
    })),
  );

  if (!hasNeutralPerspectiveThesis(draft.thesis)) {
    warnings.push({
      warning_kind: "plain_summary",
      field: "draft.thesis",
      summary:
        "Draft thesis does not clearly distinguish neutral perspective from plain summary.",
    });
  }

  if (!hasNonSummaryUsefulnessNote(draft)) {
    warnings.push({
      warning_kind: "missing_usefulness",
      field: "draft.qualification_notes",
      summary:
        "Draft is missing a visible usefulness claim or qualification beyond plain summary.",
    });
  }

  if (
    isOverconfidentBasisSuggestion({
      former_input_packet,
      draft,
    })
  ) {
    warnings.push({
      warning_kind: "overconfident_basis",
      field: "draft.basis_quality_suggestion.status",
      summary:
        "Draft suggests sufficient_for_review despite packet gaps, skipped checks, failed checks, or non-ready input.",
    });
  }

  warnings.push(
    ...collectPointerWarnings({
      former_input_packet,
      draft,
    }),
  );

  if (
    !Array.isArray(draft.user_core_decision_questions) ||
    draft.user_core_decision_questions.length === 0
  ) {
    warnings.push({
      warning_kind: "missing_user_core_questions",
      field: "draft.user_core_decision_questions",
      summary:
        "Draft should include user/Core decision questions when perspective usefulness or next work needs judgment.",
    });
  }

  if (!allAuthorityFlagsFalse(draft.authority_flags)) {
    warnings.push({
      warning_kind: "authority_claim",
      field: "draft.authority_flags",
      summary:
        "Draft authority flags must remain false; prompt-contract fit cannot grant authority.",
    });
  }

  return buildContractFitResult(warnings);
}

function renderPromptText({
  inputPacket,
  allowedInputMaterial,
  neutralPerspectiveRequirements,
  basisQualityRules,
  privacyRules,
  authorityRules,
  insufficiencyRules,
}: {
  inputPacket: CodexPerspectiveFormerInputPacketV0;
  allowedInputMaterial: readonly string[];
  neutralPerspectiveRequirements: readonly string[];
  basisQualityRules: readonly string[];
  privacyRules: readonly string[];
  authorityRules: readonly string[];
  insufficiencyRules: readonly string[];
}): string {
  const sourceBundle = inputPacket.source_formation_input_bundle;
  const lines = [
    "Role: codex_perspective_former",
    "",
    "Task: Produce one CodexPerspectiveCandidateDraft JSON object from the bounded former input packet below.",
    "The draft must form a neutral perspective, not a plain PR summary.",
    "The output is draft/review material only and creates no Augnes state.",
    "",
    "Former input packet ref:",
    `- packet_version: ${safePromptText(inputPacket.packet_version)}`,
    `- packet_id: ${safePromptText(inputPacket.packet_id)}`,
    `- role: ${safePromptText(inputPacket.role)}`,
    "",
    "Allowed input material:",
    ...formatBulletList(allowedInputMaterial),
    "",
    "Bounded packet summary:",
    `- scope: ${safePromptText(sourceBundle.scope ?? "missing")}`,
    `- work_id: ${safePromptText(sourceBundle.work_id ?? "missing")}`,
    `- source_pr_refs: ${formatInlineList(sourceBundle.source_pr_refs)}`,
    `- changed_files_summary: ${safePromptText(sourceBundle.changed_files_summary ?? "missing")}`,
    `- changed_files: ${formatInlineList(sourceBundle.changed_files)}`,
    `- readiness: ${safePromptText(sourceBundle.readiness.status)}`,
    `- readiness_reasons: ${formatInlineList(sourceBundle.readiness.reasons)}`,
    `- checks_run: ${formatChecks(sourceBundle.verification_basis.checks_run)}`,
    `- skipped_checks: ${formatSkippedChecks(sourceBundle.verification_basis.skipped_checks)}`,
    `- unresolved_gaps: ${formatGaps(sourceBundle.unresolved_gaps)}`,
    `- pointer_refs: ${formatPointerRefs(inputPacket.pointer_refs)}`,
    `- unsafe_input_material_omitted: ${inputPacket.privacy_constraints.unsafe_input_material_omitted ? "yes" : "no"}`,
    `- omitted_unsafe_field_count: ${inputPacket.privacy_constraints.omitted_unsafe_fields.length}`,
    "",
    "Output contract:",
    "- Return JSON only.",
    "- draft_version must be codex_perspective_candidate_draft.v0.1.",
    "- draft_kind must be codex_perspective_candidate_draft.",
    "- Required fields:",
    ...formatBulletList(inputPacket.expected_output_contract.required_fields),
    "- source_former_input_packet must match the former input packet ref above.",
    "- evidence_pointer_refs must use only pointer-only refs from the bounded packet summary.",
    "- thesis must explain the useful neutral perspective beyond a plain PR summary.",
    "- qualification_notes must preserve uncertainty, skipped checks, or why the perspective is or is not useful beyond summary.",
    "- basis_quality_suggestion.status must be one of sufficient_for_review, needs_review, or blocked.",
    "",
    "Canonical schema only:",
    "- selected_material must be exactly { changed_files: string[], changed_files_summary: string|null, work_id: string|null, source_pr_refs: string[] }.",
    "- Do not emit selected_material aliases changed_file_paths, plain_summary_facts, or neutral_perspective_basis.",
    "- Fold plain summary facts into selected_material.changed_files_summary.",
    "- Put neutral perspective basis in thesis or qualification_notes.",
    "- evidence_pointer_refs entries must be exactly { pointer_kind, pointer_semantics: \"pointer_only\", ref }.",
    "- Do not emit evidence pointer aliases ref_type or pointer_only.",
    "- Each evidence pointer ref must match one former input packet pointer ref.",
    "- authority_flags must use only committed_state, persistence, provider_model_api_calls, proof_evidence_readiness_writes, codex_execution, github_mutation, merge_publish_approval, and core_decision, with every value false.",
    "- Do not emit model-friendly authority aliases creates_augnes_state, creates_proof, creates_evidence, creates_readiness_record, approves, merges, publishes, retries, replays, deploys, mutates_github, executes_codex, calls_codex_sdk, calls_provider_model_api, or makes_core_decision.",
    "- privacy_flags must use only raw_payloads_included: false, unsafe_input_material_omitted: boolean, and omitted_unsafe_fields: string[].",
    "- Do not emit privacy inclusion aliases raw_diffs_included, raw_review_material_included, raw_source_material_included, private_material_included, provider_material_included, token_material_included, billing_material_included, api_credentials_included, or hidden[_]reasoning_included.",
    "- user_core_decision_questions must be string[]. Do not emit objects for user/Core questions.",
    "- next_action_candidates entries must be exactly { action_id, summary } using local action ids review_candidate, fix_input_gaps, or prepare_codex_handoff.",
    "- Do not emit next-action aliases id or why_next.",
    "- unresolved_tensions entries must be exactly { tension_kind, summary, source_ref? }.",
    "- Do not emit unresolved tension aliases id or why_it_matters.",
    "",
    "Neutral perspective requirements:",
    ...formatBulletList(neutralPerspectiveRequirements),
    "",
    "Basis quality rules:",
    ...formatBulletList(basisQualityRules),
    "",
    "Privacy rules:",
    ...formatBulletList(privacyRules),
    "",
    "Authority rules:",
    ...formatBulletList(authorityRules),
    "",
    "Insufficient input rules:",
    ...formatBulletList(insufficiencyRules),
  ];

  return `${lines.join("\n").trimEnd()}\n`;
}

function buildSourcePacketSummary(
  inputPacket: CodexPerspectiveFormerInputPacketV0,
): CodexPerspectiveFormerDraftPromptContractV0["source_packet_summary"] {
  const sourceBundle = inputPacket.source_formation_input_bundle;

  return {
    source_pr_refs: [...sourceBundle.source_pr_refs],
    changed_files: [...sourceBundle.changed_files],
    changed_files_summary: sourceBundle.changed_files_summary,
    readiness_status: sourceBundle.readiness.status,
    readiness_reasons: [...sourceBundle.readiness.reasons],
    checks_run_count: sourceBundle.verification_basis.checks_run.length,
    skipped_checks_count: sourceBundle.verification_basis.skipped_checks.length,
    unresolved_gaps_count: sourceBundle.unresolved_gaps.length,
    pointer_refs_count: inputPacket.pointer_refs.length,
    unsafe_input_material_omitted:
      inputPacket.privacy_constraints.unsafe_input_material_omitted,
    omitted_unsafe_field_count:
      inputPacket.privacy_constraints.omitted_unsafe_fields.length,
  };
}

function hasNeutralPerspectiveThesis(value: unknown): boolean {
  if (typeof value !== "string") return false;

  const lowered = value.toLowerCase();
  const perspectiveMarkers = [
    "validation boundary",
    "unresolved tension",
    "scope",
    "risk",
    "next useful work",
    "beyond a plain summary",
    "not a plain summary",
    "prompt contract",
  ];

  return perspectiveMarkers.some((marker) => lowered.includes(marker));
}

function hasNonSummaryUsefulnessNote(
  draft: Partial<CodexPerspectiveCandidateDraftV0>,
): boolean {
  const notes = Array.isArray(draft.qualification_notes)
    ? draft.qualification_notes
    : [];
  const thesis = typeof draft.thesis === "string" ? draft.thesis : "";
  const combined = [thesis, ...notes].join(" ").toLowerCase();
  const usefulnessMarkers = [
    "useful beyond",
    "beyond a plain summary",
    "not a plain summary",
    "neutral perspective",
    "validation boundary",
    "qualification",
  ];

  return usefulnessMarkers.some((marker) => combined.includes(marker));
}

function isOverconfidentBasisSuggestion({
  former_input_packet,
  draft,
}: {
  former_input_packet: CodexPerspectiveFormerInputPacketV0;
  draft: Partial<CodexPerspectiveCandidateDraftV0>;
}): boolean {
  if (draft.basis_quality_suggestion?.status !== "sufficient_for_review") {
    return false;
  }

  const sourceBundle = former_input_packet.source_formation_input_bundle;
  const hasFailedChecks = sourceBundle.verification_basis.checks_run.some(
    (check) => check.status === "failed",
  );

  return (
    sourceBundle.readiness.status !== "ready_for_candidate" ||
    sourceBundle.unresolved_gaps.length > 0 ||
    sourceBundle.verification_basis.skipped_checks.length > 0 ||
    hasFailedChecks
  );
}

function collectPointerWarnings({
  former_input_packet,
  draft,
}: {
  former_input_packet: CodexPerspectiveFormerInputPacketV0;
  draft: Partial<CodexPerspectiveCandidateDraftV0>;
}): CodexPerspectiveDraftPromptContractFitWarningV0[] {
  const warnings: CodexPerspectiveDraftPromptContractFitWarningV0[] = [];
  if (!Array.isArray(draft.evidence_pointer_refs)) {
    warnings.push({
      warning_kind: "pointer_ref",
      field: "draft.evidence_pointer_refs",
      summary:
        "Draft evidence_pointer_refs must be an array of pointer-only refs.",
    });
    return warnings;
  }

  const allowedRefs = new Set(
    former_input_packet.pointer_refs.map(
      (pointer) => `${pointer.pointer_kind}|${pointer.ref}`,
    ),
  );

  draft.evidence_pointer_refs.forEach((pointer, index) => {
    const key = `${pointer.pointer_kind}|${pointer.ref}`;
    if (pointer.pointer_semantics !== "pointer_only" || !allowedRefs.has(key)) {
      warnings.push({
        warning_kind: "pointer_ref",
        field: `draft.evidence_pointer_refs[${index}]`,
        summary:
          "Draft evidence pointer must use a pointer-only ref from the former input packet.",
      });
    }
  });

  return warnings;
}

function collectUnsafeFieldNames(value: unknown, path: string): string[] {
  if (typeof value === "string") {
    return containsUnsafeCodexPerspectiveMaterial(value) ? [path] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      collectUnsafeFieldNames(item, `${path}[${index}]`),
    );
  }

  if (!isRecord(value)) return [];

  return Object.entries(value).flatMap(([key, nestedValue]) =>
    collectUnsafeFieldNames(nestedValue, `${path}.${key}`),
  );
}

function buildContractFitResult(
  warnings: CodexPerspectiveDraftPromptContractFitWarningV0[],
): CodexPerspectiveDraftPromptContractFitResultV0 {
  const hasHardViolation = warnings.some((warning) =>
    ["authority_claim", "unsafe_material"].includes(warning.warning_kind),
  );

  return {
    contract_fit_version: "codex_perspective_draft_prompt_contract_fit.v0.1",
    contract_fit_kind: "codex_perspective_draft_prompt_contract_fit",
    status:
      warnings.length === 0
        ? "fits_contract"
        : hasHardViolation
          ? "violates_contract"
          : "needs_review",
    warnings,
    privacy: {
      raw_payloads_included: false,
      unsafe_material_detected: warnings.some(
        (warning) => warning.warning_kind === "unsafe_material",
      ),
    },
    authority_flags: buildFalseAuthorityFlags(),
  };
}

function safePromptText(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "missing";
  if (containsUnsafeCodexPerspectiveMaterial(trimmed)) {
    return "[omitted unsafe material]";
  }

  return trimmed;
}

function formatInlineList(values: readonly string[]): string {
  const safeValues = values.map(safePromptText).filter((value) => value !== "");
  return safeValues.length > 0 ? safeValues.join(", ") : "none";
}

function formatBulletList(values: readonly string[]): string[] {
  return values.map((value) => `- ${safePromptText(value)}`);
}

function formatChecks(
  checks: CodexPerspectiveFormerInputPacketV0["source_formation_input_bundle"]["verification_basis"]["checks_run"],
): string {
  if (checks.length === 0) return "none";

  return checks
    .map(
      (check) =>
        `${safePromptText(check.check_id)} (${check.status}): ${safePromptText(check.result_summary)}`,
    )
    .join("; ");
}

function formatSkippedChecks(
  checks: CodexPerspectiveFormerInputPacketV0["source_formation_input_bundle"]["verification_basis"]["skipped_checks"],
): string {
  if (checks.length === 0) return "none";

  return checks
    .map(
      (check) =>
        `${safePromptText(check.check_id)}: ${safePromptText(check.skipped_reason || "missing reason")}`,
    )
    .join("; ");
}

function formatGaps(
  gaps: CodexPerspectiveFormerInputPacketV0["source_formation_input_bundle"]["unresolved_gaps"],
): string {
  if (gaps.length === 0) return "none";

  return gaps
    .map(
      (gap) =>
        `${safePromptText(gap.gap_id)}: ${safePromptText(gap.summary)}`,
    )
    .join("; ");
}

function formatPointerRefs(
  pointerRefs: CodexPerspectiveFormerInputPacketV0["pointer_refs"],
): string {
  if (pointerRefs.length === 0) return "none";

  return pointerRefs
    .map(
      (pointer) =>
        `${pointer.pointer_kind}|${pointer.pointer_semantics}|${safePromptText(pointer.ref)}`,
    )
    .join("; ");
}

function allAuthorityFlagsFalse(value: unknown): boolean {
  if (!isRecord(value)) return false;

  return authorityFlagKeys.every((key) => value[key] === false);
}

function buildFalseAuthorityFlags(): CodexPerspectiveDraftPromptContractFitResultV0["authority_flags"] {
  return {
    committed_state: false,
    persistence: false,
    provider_model_api_calls: false,
    proof_evidence_readiness_writes: false,
    codex_execution: false,
    github_mutation: false,
    merge_publish_approval: false,
    core_decision: false,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
