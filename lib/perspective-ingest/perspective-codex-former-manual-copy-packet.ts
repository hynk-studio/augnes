import {
  containsUnsafeCodexPerspectiveMaterial,
  copySafeCodexPerspectiveTextList,
  sanitizeCodexPerspectiveText,
  type CodexPerspectiveFormerInputPacketV0,
} from "@/lib/perspective-ingest/perspective-codex-former-input-packet";
import type { CodexPerspectiveCandidateDraftV0 } from "@/lib/perspective-ingest/perspective-codex-candidate-draft-pipeline";
import {
  buildCodexPerspectiveFormerDraftPromptContractFromInputPacket,
  type CodexPerspectiveFormerDraftPromptContractV0,
} from "@/lib/perspective-ingest/perspective-codex-former-prompt-contract";

export type ManualCodexPerspectiveFormerDraftCopyPacketVersionV0 =
  "manual_codex_perspective_former_draft_copy_packet.v0.1";
export type ManualCodexPerspectiveFormerDraftCopyPacketKindV0 =
  "manual_codex_perspective_former_draft_copy_packet";
export type ManualCodexPerspectiveFormerDraftCopyStatusV0 =
  | "ready_to_copy"
  | "needs_review"
  | "needs_scope"
  | "blocked";
export type ManualCodexPerspectiveFormerDraftCopyPacketEvaluationVersionV0 =
  "manual_codex_perspective_former_draft_copy_packet_evaluation.v0.1";
export type ManualCodexPerspectiveFormerDraftCopyPacketEvaluationKindV0 =
  "manual_codex_perspective_former_draft_copy_packet_evaluation";
export type ManualCodexPerspectiveFormerDraftCopyPacketEvaluationStatusV0 =
  | "passes"
  | "needs_review"
  | "blocked";

export interface BuildManualCodexPerspectiveFormerDraftCopyPacketInputV0 {
  former_input_packet: CodexPerspectiveFormerInputPacketV0;
  prompt_contract?: CodexPerspectiveFormerDraftPromptContractV0;
  manual_context?: {
    reviewer_label?: string | null;
    intended_codex_surface?: string | null;
    usage_notes?: readonly string[];
  };
  expected_validation_commands?: readonly string[];
  generated_at?: string | null;
}

export interface ManualCodexPerspectiveFormerDraftCopyPacketV0 {
  packet_version: ManualCodexPerspectiveFormerDraftCopyPacketVersionV0;
  packet_kind: ManualCodexPerspectiveFormerDraftCopyPacketKindV0;
  packet_id: string;
  generated_at: string | null;
  copy_status: ManualCodexPerspectiveFormerDraftCopyStatusV0;
  copy_status_reasons: string[];
  source_former_input_packet: {
    packet_version: CodexPerspectiveFormerInputPacketV0["packet_version"];
    packet_id: string;
    role: CodexPerspectiveFormerInputPacketV0["role"];
  };
  source_prompt_contract: {
    contract_version: CodexPerspectiveFormerDraftPromptContractV0["contract_version"];
    contract_kind: CodexPerspectiveFormerDraftPromptContractV0["contract_kind"];
    role: CodexPerspectiveFormerDraftPromptContractV0["role"];
    source_packet_id: string;
  };
  manual_context: {
    reviewer_label: string | null;
    intended_codex_surface: string | null;
    usage_notes: string[];
  };
  copyable_prompt_hash: string;
  copyable_codex_prompt_text: string;
  capture_return_envelope: {
    envelope_label: "REAL TRANSCRIPT CAPTURE AFTER MANUAL COPY PACKET";
    capture_method: "human_manual";
    codex_surface_label: string | null;
    prompt_was_generated_by_manual_copy_packet: true;
    source_manual_copy_packet_id: string;
    source_former_input_packet_id: string;
    source_prompt_hash: string;
    captured_at: "<timestamp or unknown>";
    redaction_notes: string[];
    copyable_capture_return_template: string;
    returned_codex_response_placeholder: "<returned JSON>";
  };
  expected_codex_response_contract: {
    response_kind: "CodexPerspectiveCandidateDraft JSON";
    return_json_only: true;
    draft_version: CodexPerspectiveCandidateDraftV0["draft_version"];
    draft_kind: CodexPerspectiveCandidateDraftV0["draft_kind"];
    required_fields: string[];
    output_is_draft_review_material_only: true;
    must_use_pointer_only_refs: true;
    must_keep_authority_flags_false: true;
  };
  returned_draft_validation_instructions: {
    validation_function: "validateAndNormalizeCodexPerspectiveCandidateDraft";
    steps: string[];
    expected_validation_commands: string[];
    returned_draft_is_accepted_state: false;
    user_decides_after_validation: true;
  };
  manual_review_checklist: string[];
  unsafe_material_policy: {
    bounded_summaries_and_pointer_refs_only: true;
    unsafe_input_material_omitted: boolean;
    omitted_unsafe_fields: string[];
    copyable_prompt_unsafe_markers_included: false;
    forbidden_material_summary: string[];
  };
  authority_boundary: {
    human_must_review_before_pasting: true;
    user_started_codex_session_only: true;
    codex_sdk_integration: false;
    provider_model_api_calls: false;
    github_mutation: false;
    proof_evidence_readiness_writes: false;
    approval_merge_publish: false;
    core_decision: false;
    forbidden_actions: string[];
  };
  privacy: {
    raw_payloads_included: false;
    unsafe_input_material_omitted: boolean;
    omitted_unsafe_fields: string[];
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
  browser_or_computer_use_validation: {
    required: false;
    status: "not_required";
    reason: string;
  };
}

export interface ManualCodexPerspectiveFormerDraftCopyPacketEvaluationV0 {
  evaluation_version: ManualCodexPerspectiveFormerDraftCopyPacketEvaluationVersionV0;
  evaluation_kind: ManualCodexPerspectiveFormerDraftCopyPacketEvaluationKindV0;
  evaluation_status: ManualCodexPerspectiveFormerDraftCopyPacketEvaluationStatusV0;
  blocked_reasons: string[];
  warnings: string[];
  privacy: {
    raw_payloads_included: false;
    unsafe_markers_detected: boolean;
  };
  authority_flags: ManualCodexPerspectiveFormerDraftCopyPacketV0["authority_flags"];
}

const expectedDraftRequiredFields = [
  "draft_version",
  "draft_kind",
  "source_former_input_packet",
  "thesis",
  "selected_material",
  "evidence_pointer_refs",
  "unresolved_tensions",
  "basis_quality_suggestion",
  "next_action_candidates",
  "user_core_decision_questions",
  "qualification_notes",
  "privacy_flags",
  "authority_flags",
  "forbidden_actions",
];

const expectedValidationCommands = [
  "npm run smoke:perspective-codex-former-manual-copy-packet",
  "npm run smoke:perspective-codex-former-prompt-contract",
  "npm run smoke:perspective-codex-former-pipeline",
];

const browserComputerUseNotRequiredReason =
  "Not run: no browser/computer-use validation required because this PR is pure local library/docs/report/smoke/package work and adds no UI, route, browser-visible surface, or interactive copy control.";

export function buildManualCodexPerspectiveFormerDraftCopyPacket(
  input: BuildManualCodexPerspectiveFormerDraftCopyPacketInputV0,
): ManualCodexPerspectiveFormerDraftCopyPacketV0 {
  const omittedUnsafeFields = new Set<string>();
  const promptContract =
    input.prompt_contract ??
    buildCodexPerspectiveFormerDraftPromptContractFromInputPacket(
      input.former_input_packet,
    );
  const manualContext = sanitizeManualContext({
    manualContext: input.manual_context,
    omittedUnsafeFields,
  });
  const expectedCommands = copySafeCodexPerspectiveTextList(
    input.expected_validation_commands ?? expectedValidationCommands,
    "expected_validation_commands",
    omittedUnsafeFields,
  );
  const generatedAt =
    sanitizeCodexPerspectiveText(
      input.generated_at,
      "generated_at",
      omittedUnsafeFields,
    ) ?? null;
  const statusEvaluation = evaluateCopyStatus({
    formerInputPacket: input.former_input_packet,
    promptContract,
    manualContext,
    omittedCopyInputUnsafeFieldCount: omittedUnsafeFields.size,
  });
  const packetId = buildManualCopyPacketId(input.former_input_packet);
  const copyablePromptText = buildCopyableCodexPromptText({
    formerInputPacket: input.former_input_packet,
    promptContract,
    manualContext,
  });
  const copyablePromptHash = buildCopyablePromptHash(copyablePromptText);
  const captureReturnEnvelope = buildCaptureReturnEnvelope({
    packetId,
    formerInputPacket: input.former_input_packet,
    manualContext,
    copyablePromptHash,
  });
  const unsafePromptDetected =
    containsUnsafeCodexPerspectiveMaterial(copyablePromptText);
  const copyStatus: ManualCodexPerspectiveFormerDraftCopyStatusV0 =
    unsafePromptDetected
      ? "blocked"
      : statusEvaluation.status;
  const copyStatusReasons = unsafePromptDetected
    ? [
        ...statusEvaluation.reasons,
        "copyable prompt text contains unsafe material marker",
      ]
    : statusEvaluation.reasons;

  return {
    packet_version: "manual_codex_perspective_former_draft_copy_packet.v0.1",
    packet_kind: "manual_codex_perspective_former_draft_copy_packet",
    packet_id: packetId,
    generated_at: generatedAt,
    copy_status: copyStatus,
    copy_status_reasons: uniqueTextList(copyStatusReasons),
    source_former_input_packet: {
      packet_version: input.former_input_packet.packet_version,
      packet_id: input.former_input_packet.packet_id,
      role: input.former_input_packet.role,
    },
    source_prompt_contract: {
      contract_version: promptContract.contract_version,
      contract_kind: promptContract.contract_kind,
      role: promptContract.role,
      source_packet_id: promptContract.source_former_input_packet.packet_id,
    },
    manual_context: manualContext,
    copyable_prompt_hash: copyablePromptHash,
    copyable_codex_prompt_text: copyablePromptText,
    capture_return_envelope: captureReturnEnvelope,
    expected_codex_response_contract: {
      response_kind: "CodexPerspectiveCandidateDraft JSON",
      return_json_only: true,
      draft_version: "codex_perspective_candidate_draft.v0.1",
      draft_kind: "codex_perspective_candidate_draft",
      required_fields: [...expectedDraftRequiredFields],
      output_is_draft_review_material_only: true,
      must_use_pointer_only_refs: true,
      must_keep_authority_flags_false: true,
    },
    returned_draft_validation_instructions: {
      validation_function: "validateAndNormalizeCodexPerspectiveCandidateDraft",
      steps: [
        "Review the returned JSON before using it.",
        "Paste the returned CodexPerspectiveCandidateDraft JSON into Augnes local validation.",
        "Run validateAndNormalizeCodexPerspectiveCandidateDraft with the same former input packet.",
        "Treat blocked validation as no candidate-compatible review material.",
        "Let the user decide whether to continue after validation.",
      ],
      expected_validation_commands: expectedCommands,
      returned_draft_is_accepted_state: false,
      user_decides_after_validation: true,
    },
    manual_review_checklist: buildManualReviewChecklist({
      formerInputPacket: input.former_input_packet,
      promptContract,
      status: copyStatus,
      statusReasons: copyStatusReasons,
    }),
    unsafe_material_policy: {
      bounded_summaries_and_pointer_refs_only: true,
      unsafe_input_material_omitted:
        input.former_input_packet.privacy_constraints
          .unsafe_input_material_omitted || omittedUnsafeFields.size > 0,
      omitted_unsafe_fields: uniqueTextList([
        ...input.former_input_packet.privacy_constraints.omitted_unsafe_fields,
        ...(promptContract.source_packet_summary.unsafe_input_material_omitted
          ? ["prompt_contract.source_packet_summary"]
          : []),
        ...omittedUnsafeFields,
      ]).sort(),
      copyable_prompt_unsafe_markers_included: false,
      forbidden_material_summary: [
        "raw diffs, raw review material, raw source material, and raw returned draft material",
        "private, provider, token, billing, credential, and sensitive material",
        "hidden reasoning and generated raw model material",
      ],
    },
    authority_boundary: {
      human_must_review_before_pasting: true,
      user_started_codex_session_only: true,
      codex_sdk_integration: false,
      provider_model_api_calls: false,
      github_mutation: false,
      proof_evidence_readiness_writes: false,
      approval_merge_publish: false,
      core_decision: false,
      forbidden_actions: [
        "do not call Codex from Augnes",
        "do not call provider/model APIs",
        "do not mutate GitHub",
        "do not execute repo work from this packet",
        "do not create proof, evidence, or readiness records",
        "do not approve, merge, publish, retry, replay, or deploy",
        "do not make Core decisions",
      ],
    },
    privacy: {
      raw_payloads_included: false,
      unsafe_input_material_omitted:
        input.former_input_packet.privacy_constraints
          .unsafe_input_material_omitted || omittedUnsafeFields.size > 0,
      omitted_unsafe_fields: uniqueTextList([
        ...input.former_input_packet.privacy_constraints.omitted_unsafe_fields,
        ...omittedUnsafeFields,
      ]).sort(),
    },
    authority_flags: buildFalseAuthorityFlags(),
    browser_or_computer_use_validation: {
      required: false,
      status: "not_required",
      reason: browserComputerUseNotRequiredReason,
    },
  };
}

export function evaluateManualCodexPerspectiveFormerDraftCopyPacket(
  packet: ManualCodexPerspectiveFormerDraftCopyPacketV0,
): ManualCodexPerspectiveFormerDraftCopyPacketEvaluationV0 {
  const blockedReasons: string[] = [];
  const warnings: string[] = [];
  const stalePr479ContractWording = [
    "Use the PR #479",
    "prompt contract below.",
  ].join(" ");

  if (containsUnsafeCodexPerspectiveMaterial(JSON.stringify(packet))) {
    blockedReasons.push("packet output includes unsafe material marker");
  }
  if (
    !packet.copyable_codex_prompt_text.includes("Role: codex_perspective_former")
  ) {
    blockedReasons.push("copyable prompt is missing codex_perspective_former role");
  }
  if (
    !packet.copyable_codex_prompt_text.includes(
      "CodexPerspectiveCandidateDraft",
    )
  ) {
    blockedReasons.push("copyable prompt is missing candidate draft contract");
  }
  if (!packet.copyable_codex_prompt_text.includes("Return JSON only")) {
    blockedReasons.push("copyable prompt is missing JSON-only instruction");
  }
  if (
    packet.copyable_codex_prompt_text.includes(
      stalePr479ContractWording,
    )
  ) {
    blockedReasons.push("copyable prompt uses stale PR #479 contract label");
  }
  if (
    !packet.copyable_codex_prompt_text.includes(
      "Prompt contract: CodexPerspectiveFormerDraftPromptContract v0.1",
    )
  ) {
    blockedReasons.push("copyable prompt is missing stable prompt contract label");
  }
  if (
    !packet.copyable_codex_prompt_text.includes(
      "The former input packet may mention that a transcript is missing because it was generated before this capture.",
    )
  ) {
    blockedReasons.push("copyable prompt is missing pre-capture gap guidance");
  }
  if (
    packet.capture_return_envelope.source_manual_copy_packet_id !==
      packet.packet_id ||
    packet.capture_return_envelope.source_former_input_packet_id !==
      packet.source_former_input_packet.packet_id ||
    packet.capture_return_envelope.source_prompt_hash !==
      packet.copyable_prompt_hash
  ) {
    blockedReasons.push("capture return envelope provenance does not match packet");
  }
  if (
    !packet.capture_return_envelope.copyable_capture_return_template.includes(
      "RETURNED_CODEX_RESPONSE:",
    ) ||
    !packet.capture_return_envelope.copyable_capture_return_template.includes(
      "source_manual_copy_packet_id:",
    ) ||
    !packet.capture_return_envelope.copyable_capture_return_template.includes(
      "source_prompt_hash:",
    )
  ) {
    blockedReasons.push("capture return envelope is missing required fields");
  }
  if (!packet.copyable_codex_prompt_text.includes("pointer-only")) {
    blockedReasons.push("copyable prompt is missing pointer-only instruction");
  }
  if (
    !packet.copyable_codex_prompt_text.includes(
      "neutral perspective, not a plain PR summary",
    )
  ) {
    blockedReasons.push("copyable prompt is missing neutral perspective instruction");
  }
  if (!packet.copyable_codex_prompt_text.includes("authority flags false")) {
    blockedReasons.push("copyable prompt is missing false-authority instruction");
  }
  if (
    !packet.returned_draft_validation_instructions.steps.some((step) =>
      step.includes("validateAndNormalizeCodexPerspectiveCandidateDraft"),
    )
  ) {
    blockedReasons.push("returned draft validation instructions are missing validator");
  }
  if (!allAuthorityFlagsFalse(packet.authority_flags)) {
    blockedReasons.push("packet authority flags are not all false");
  }
  if (packet.privacy.raw_payloads_included !== false) {
    blockedReasons.push("packet privacy does not keep raw payloads false");
  }
  if (
    packet.expected_codex_response_contract.draft_version !==
      "codex_perspective_candidate_draft.v0.1" ||
    packet.expected_codex_response_contract.draft_kind !==
      "codex_perspective_candidate_draft"
  ) {
    blockedReasons.push("expected response contract does not match draft v0.1");
  }
  if (
    packet.expected_codex_response_contract.required_fields.length !==
      expectedDraftRequiredFields.length ||
    !expectedDraftRequiredFields.every((field) =>
      packet.expected_codex_response_contract.required_fields.includes(field),
    )
  ) {
    blockedReasons.push("expected response contract required fields are incomplete");
  }
  if (
    packet.copy_status === "ready_to_copy" &&
    packet.privacy.unsafe_input_material_omitted
  ) {
    warnings.push("ready_to_copy packet includes omitted unsafe material");
  }
  if (
    packet.copy_status === "ready_to_copy" &&
    packet.manual_review_checklist.some((item) =>
      item.toLowerCase().includes("unresolved gap"),
    )
  ) {
    warnings.push("ready_to_copy packet checklist still mentions unresolved gaps");
  }

  return {
    evaluation_version:
      "manual_codex_perspective_former_draft_copy_packet_evaluation.v0.1",
    evaluation_kind:
      "manual_codex_perspective_former_draft_copy_packet_evaluation",
    evaluation_status:
      blockedReasons.length > 0
        ? "blocked"
        : warnings.length > 0
          ? "needs_review"
          : "passes",
    blocked_reasons: blockedReasons,
    warnings,
    privacy: {
      raw_payloads_included: false,
      unsafe_markers_detected: blockedReasons.includes(
        "packet output includes unsafe material marker",
      ),
    },
    authority_flags: buildFalseAuthorityFlags(),
  };
}

function evaluateCopyStatus({
  formerInputPacket,
  promptContract,
  manualContext,
  omittedCopyInputUnsafeFieldCount,
}: {
  formerInputPacket: CodexPerspectiveFormerInputPacketV0;
  promptContract: CodexPerspectiveFormerDraftPromptContractV0;
  manualContext: ManualCodexPerspectiveFormerDraftCopyPacketV0["manual_context"];
  omittedCopyInputUnsafeFieldCount: number;
}): { status: ManualCodexPerspectiveFormerDraftCopyStatusV0; reasons: string[] } {
  const blockedReasons = collectBlockedReasons({
    formerInputPacket,
    promptContract,
    manualContext,
    omittedCopyInputUnsafeFieldCount,
  });
  if (blockedReasons.length > 0) {
    return { status: "blocked", reasons: blockedReasons };
  }

  const scopeReasons = collectScopeReasons({ formerInputPacket, promptContract });
  if (scopeReasons.length > 0) {
    return { status: "needs_scope", reasons: scopeReasons };
  }

  const reviewReasons = collectReviewReasons({ formerInputPacket, promptContract });
  if (reviewReasons.length > 0) {
    return { status: "needs_review", reasons: reviewReasons };
  }

  return {
    status: "ready_to_copy",
    reasons: ["bounded packet and prompt contract are ready for human review"],
  };
}

function collectBlockedReasons({
  formerInputPacket,
  promptContract,
  manualContext,
  omittedCopyInputUnsafeFieldCount,
}: {
  formerInputPacket: CodexPerspectiveFormerInputPacketV0;
  promptContract: CodexPerspectiveFormerDraftPromptContractV0;
  manualContext: ManualCodexPerspectiveFormerDraftCopyPacketV0["manual_context"];
  omittedCopyInputUnsafeFieldCount: number;
}): string[] {
  const serializedContext = JSON.stringify(manualContext);
  const blockedReasons: string[] = [];

  if (containsUnsafeCodexPerspectiveMaterial(serializedContext)) {
    blockedReasons.push("manual context includes unsafe material marker");
  }
  if (omittedCopyInputUnsafeFieldCount > 0) {
    blockedReasons.push("copy packet input included omitted unsafe material");
  }
  if (containsNonManualExecutionClaim(serializedContext)) {
    blockedReasons.push("manual context includes non-manual execution claim");
  }
  if (formerInputPacket.privacy_constraints.raw_payloads_included !== false) {
    blockedReasons.push("former input packet includes raw payloads");
  }
  if (!formerInputPacket.privacy_constraints.bounded_summaries_and_pointer_refs_only) {
    blockedReasons.push("former input packet is not bounded to summaries and pointer refs");
  }
  if (promptContract.role !== "codex_perspective_former") {
    blockedReasons.push("prompt contract role is not codex_perspective_former");
  }
  if (!promptContract.output_contract.output_is_draft_review_material_only) {
    blockedReasons.push("prompt contract does not keep output draft/review-only");
  }
  if (!promptContract.output_contract.must_use_pointer_only_refs) {
    blockedReasons.push("prompt contract does not require pointer-only refs");
  }
  if (!promptContract.output_contract.must_include_non_summary_usefulness) {
    blockedReasons.push("prompt contract does not require non-summary usefulness");
  }
  if (
    promptContract.source_former_input_packet.packet_id !==
      formerInputPacket.packet_id ||
    promptContract.source_former_input_packet.role !== formerInputPacket.role
  ) {
    blockedReasons.push("prompt contract source packet ref does not match");
  }

  return uniqueTextList(blockedReasons);
}

function collectScopeReasons({
  formerInputPacket,
  promptContract,
}: {
  formerInputPacket: CodexPerspectiveFormerInputPacketV0;
  promptContract: CodexPerspectiveFormerDraftPromptContractV0;
}): string[] {
  const reasons: string[] = [];
  const sourceBundle = formerInputPacket.source_formation_input_bundle;

  if (!hasText(sourceBundle.work_id)) reasons.push("missing work_id");
  if (sourceBundle.source_pr_refs.length === 0) {
    reasons.push("missing source PR refs");
  }
  if (
    promptContract.output_contract.required_fields.length === 0 ||
    !expectedDraftRequiredFields.every((field) =>
      promptContract.output_contract.required_fields.includes(field),
    )
  ) {
    reasons.push("prompt contract missing required draft fields");
  }
  if (formerInputPacket.pointer_refs.length === 0) {
    reasons.push("missing pointer refs");
  }

  return reasons;
}

function collectReviewReasons({
  formerInputPacket,
  promptContract,
}: {
  formerInputPacket: CodexPerspectiveFormerInputPacketV0;
  promptContract: CodexPerspectiveFormerDraftPromptContractV0;
}): string[] {
  const sourceBundle = formerInputPacket.source_formation_input_bundle;
  const reasons: string[] = [];
  const failedChecks = sourceBundle.verification_basis.checks_run.filter(
    (check) => check.status === "failed",
  );

  if (sourceBundle.readiness.status !== "ready_for_candidate") {
    reasons.push(`source readiness is ${sourceBundle.readiness.status}`);
  }
  if (sourceBundle.verification_basis.skipped_checks.length > 0) {
    reasons.push("skipped checks require human review");
  }
  if (sourceBundle.unresolved_gaps.length > 0) {
    reasons.push("unresolved gaps require human review");
  }
  if (failedChecks.length > 0) {
    reasons.push("failed checks require human review");
  }
  if (formerInputPacket.privacy_constraints.unsafe_input_material_omitted) {
    reasons.push("unsafe input material was omitted upstream");
  }
  if (promptContract.source_packet_summary.unsafe_input_material_omitted) {
    reasons.push("prompt contract records omitted unsafe material");
  }

  return uniqueTextList(reasons);
}

function buildCopyableCodexPromptText({
  formerInputPacket,
  promptContract,
  manualContext,
}: {
  formerInputPacket: CodexPerspectiveFormerInputPacketV0;
  promptContract: CodexPerspectiveFormerDraftPromptContractV0;
  manualContext: ManualCodexPerspectiveFormerDraftCopyPacketV0["manual_context"];
}): string {
  const lines = [
    "Manual Codex Former Draft Copy Packet",
    "",
    "Human review required before pasting. Paste this only into a user-started Codex session.",
    "This packet does not call Codex, does not execute Codex, does not call SDKs or provider/model APIs, and does not mutate GitHub.",
    "Do not use this prompt to approve, merge, publish, retry, replay, deploy, write state, or make Core decisions.",
    "",
    `Reviewer: ${manualContext.reviewer_label ?? "manual reviewer"}`,
    `Intended Codex surface: ${manualContext.intended_codex_surface ?? "user-started Codex session"}`,
    "",
    "Use the current Codex former draft prompt contract below.",
    "Prompt contract: CodexPerspectiveFormerDraftPromptContract v0.1",
    `Contract version: ${promptContract.contract_version}`,
    "This contract includes the latest local canonical-schema, thesis-boundary, and tension-kind guidance.",
    "",
    promptContract.copyable_former_draft_prompt_text.trimEnd(),
    "",
    "Manual response requirements:",
    "- Return JSON only.",
    "- Return exactly one CodexPerspectiveCandidateDraft object.",
    "- Use draft_version codex_perspective_candidate_draft.v0.1.",
    "- Use draft_kind codex_perspective_candidate_draft.",
    "- Use only pointer-only refs from the former input packet.",
    "- Form a neutral perspective beyond a plain summary.",
    "- If the packet is insufficient, return needs_review or blocked draft material with visible reasons.",
    "- The former input packet may mention that a transcript is missing because it was generated before this capture. Do not repeat that as current state after this response exists.",
    "- Treat this response as the captured draft output to be locally validated.",
    "- Use needs_review because local validation has not yet run, not because this response does not exist.",
    "- It is okay to say future validation is still needed.",
    "- It is not okay to phrase the current returned transcript as still absent.",
    "- Do not include raw diffs, raw review material, raw source material, private material, provider material, token material, billing material, API credentials, hidden reasoning, or generated raw model material.",
    "- Do not claim proof, evidence, readiness, approval, merge, GitHub mutation, Codex execution, provider/model execution, or Core-decision authority.",
    "- Set all authority flags false.",
    "",
    "After response:",
    "- A human must paste the returned JSON into Augnes local validation.",
    "- Run validateAndNormalizeCodexPerspectiveCandidateDraft with the same former input packet.",
    "- The returned draft is not accepted state before validation.",
    "- The user decides whether to continue after validation.",
  ];

  return `${lines.join("\n").trimEnd()}\n`;
}

function buildCopyablePromptHash(copyablePromptText: string): string {
  return stableHash(copyablePromptText);
}

function buildCaptureReturnEnvelope({
  packetId,
  formerInputPacket,
  manualContext,
  copyablePromptHash,
}: {
  packetId: string;
  formerInputPacket: CodexPerspectiveFormerInputPacketV0;
  manualContext: ManualCodexPerspectiveFormerDraftCopyPacketV0["manual_context"];
  copyablePromptHash: string;
}): ManualCodexPerspectiveFormerDraftCopyPacketV0["capture_return_envelope"] {
  const codexSurfaceLabel =
    manualContext.intended_codex_surface ?? "<surface>";
  const redactionNotes = [
    "Included only returned CodexPerspectiveCandidateDraft JSON or bounded response text.",
    "No hidden reasoning, cookies, tokens, account data, provider logs, raw page dumps, raw PR diffs, raw review payloads, unrelated chat text, or secrets included.",
  ];
  const lines = [
    "REAL TRANSCRIPT CAPTURE AFTER MANUAL COPY PACKET",
    "",
    "capture_method: human_manual",
    `codex_surface_label: ${codexSurfaceLabel}`,
    "prompt_was_generated_by_manual_copy_packet: true",
    `source_manual_copy_packet_id: ${packetId}`,
    `source_former_input_packet_id: ${formerInputPacket.packet_id}`,
    `source_prompt_hash: ${copyablePromptHash}`,
    "captured_at: <timestamp or unknown>",
    "",
    "TRANSCRIPT_REDACTION_NOTES:",
    ...redactionNotes.map((note) => `- ${note}`),
    "",
    "RETURNED_CODEX_RESPONSE:",
    "<returned JSON>",
    "END RETURNED_CODEX_RESPONSE",
  ];

  return {
    envelope_label: "REAL TRANSCRIPT CAPTURE AFTER MANUAL COPY PACKET",
    capture_method: "human_manual",
    codex_surface_label: codexSurfaceLabel,
    prompt_was_generated_by_manual_copy_packet: true,
    source_manual_copy_packet_id: packetId,
    source_former_input_packet_id: formerInputPacket.packet_id,
    source_prompt_hash: copyablePromptHash,
    captured_at: "<timestamp or unknown>",
    redaction_notes: redactionNotes,
    copyable_capture_return_template: `${lines.join("\n").trimEnd()}\n`,
    returned_codex_response_placeholder: "<returned JSON>",
  };
}

function buildManualReviewChecklist({
  formerInputPacket,
  promptContract,
  status,
  statusReasons,
}: {
  formerInputPacket: CodexPerspectiveFormerInputPacketV0;
  promptContract: CodexPerspectiveFormerDraftPromptContractV0;
  status: ManualCodexPerspectiveFormerDraftCopyStatusV0;
  statusReasons: readonly string[];
}): string[] {
  const sourceBundle = formerInputPacket.source_formation_input_bundle;
  const checklist = [
    "Confirm the human intends to paste this prompt into a user-started Codex session.",
    "Confirm the returned output must be CodexPerspectiveCandidateDraft JSON only.",
    "Confirm the returned draft will be pasted back into Augnes local validation.",
    "Confirm the returned draft is not accepted state before validation.",
    "Confirm all authority flags remain false.",
    `Confirm copy status ${status} is acceptable before manual use.`,
  ];

  if (statusReasons.length > 0) {
    checklist.push(`Review copy status reasons: ${statusReasons.join("; ")}.`);
  }
  if (sourceBundle.verification_basis.skipped_checks.length > 0) {
    checklist.push("Review skipped checks before pasting.");
  }
  if (sourceBundle.unresolved_gaps.length > 0) {
    checklist.push("Review unresolved gaps before pasting.");
  }
  if (formerInputPacket.privacy_constraints.unsafe_input_material_omitted) {
    checklist.push("Review omitted unsafe material notes without reconstructing omitted content.");
  }
  if (promptContract.output_contract.required_fields.length > 0) {
    checklist.push("Confirm the output contract required fields are present in the returned JSON.");
  }

  return uniqueTextList(checklist);
}

function sanitizeManualContext({
  manualContext,
  omittedUnsafeFields,
}: {
  manualContext:
    | BuildManualCodexPerspectiveFormerDraftCopyPacketInputV0["manual_context"]
    | undefined;
  omittedUnsafeFields: Set<string>;
}): ManualCodexPerspectiveFormerDraftCopyPacketV0["manual_context"] {
  return {
    reviewer_label: sanitizeCodexPerspectiveText(
      manualContext?.reviewer_label,
      "manual_context.reviewer_label",
      omittedUnsafeFields,
    ),
    intended_codex_surface: sanitizeCodexPerspectiveText(
      manualContext?.intended_codex_surface,
      "manual_context.intended_codex_surface",
      omittedUnsafeFields,
    ),
    usage_notes: copySafeCodexPerspectiveTextList(
      manualContext?.usage_notes,
      "manual_context.usage_notes",
      omittedUnsafeFields,
    ),
  };
}

function containsNonManualExecutionClaim(value: string): boolean {
  const lowered = value.toLowerCase();
  const patterns = [
    "call openai",
    "call provider",
    "call model api",
    "call codex sdk",
    "execute codex",
    "mutate github",
    "open browser",
    "click copy",
    "write database",
    "write db",
    "create proof",
    "create evidence",
    "create readiness",
    "approve this",
    "merge this",
    "make core decision",
  ];

  return patterns.some((pattern) => lowered.includes(pattern));
}

function buildManualCopyPacketId(
  formerInputPacket: CodexPerspectiveFormerInputPacketV0,
): string {
  const anchor = `${formerInputPacket.packet_id}|manual-copy`;
  return `manual-codex-former-copy:v0.1:${stableHash(anchor)}`;
}

function buildFalseAuthorityFlags(): ManualCodexPerspectiveFormerDraftCopyPacketV0["authority_flags"] {
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

function allAuthorityFlagsFalse(
  flags: ManualCodexPerspectiveFormerDraftCopyPacketV0["authority_flags"],
): boolean {
  return Object.values(flags).every((value) => value === false);
}

function uniqueTextList(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const uniqueValues: string[] = [];

  for (const value of values) {
    if (!seen.has(value)) {
      seen.add(value);
      uniqueValues.push(value);
    }
  }

  return uniqueValues;
}

function stableHash(value: string): string {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash.toString(36);
}

function hasText(value: string | null | undefined): boolean {
  return Boolean(value && value.trim());
}
