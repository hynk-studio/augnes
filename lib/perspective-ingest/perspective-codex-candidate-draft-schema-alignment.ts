import type {
  PerspectiveCandidateEvidencePointerKindV0,
  PerspectiveCandidateNextActionV0,
  PerspectiveCandidateUnresolvedTensionV0,
} from "@/lib/perspective-ingest/perspective-candidate-builder";
import type {
  CodexPerspectiveCandidateDraftAuthorityFlagsV0,
  CodexPerspectiveCandidateDraftV0,
} from "@/lib/perspective-ingest/perspective-codex-candidate-draft-pipeline";
import {
  containsUnsafeCodexPerspectiveMaterial,
  sanitizeCodexPerspectiveText,
  type CodexPerspectiveFormerInputPacketV0,
} from "@/lib/perspective-ingest/perspective-codex-former-input-packet";

export type CodexPerspectiveCandidateDraftSchemaAlignmentVersionV0 =
  "codex_perspective_candidate_draft_schema_alignment.v0.1";
export type CodexPerspectiveCandidateDraftSchemaAlignmentKindV0 =
  "codex_perspective_candidate_draft_schema_alignment";
export type CodexPerspectiveCandidateDraftSchemaAlignmentStatusV0 =
  | "aligned"
  | "needs_review"
  | "blocked";

export interface AlignCodexPerspectiveCandidateDraftSchemaInputV0 {
  former_input_packet: CodexPerspectiveFormerInputPacketV0;
  draft: unknown;
}

export interface CodexPerspectiveCandidateDraftSchemaAlignmentWarningV0 {
  warning_kind:
    | "alias_mapping"
    | "context_default"
    | "omitted_ambiguous_material"
    | "unsafe_material"
    | "authority_claim"
    | "pointer_ref";
  field: string;
  summary: string;
}

export interface CodexPerspectiveCandidateDraftSchemaAlignmentResultV0 {
  alignment_version: CodexPerspectiveCandidateDraftSchemaAlignmentVersionV0;
  alignment_kind: CodexPerspectiveCandidateDraftSchemaAlignmentKindV0;
  alignment_status: CodexPerspectiveCandidateDraftSchemaAlignmentStatusV0;
  aligned_draft: CodexPerspectiveCandidateDraftV0 | null;
  applied_mappings: string[];
  blocked_reasons: string[];
  warnings: CodexPerspectiveCandidateDraftSchemaAlignmentWarningV0[];
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
}

const canonicalAuthorityFlagKeys = [
  "committed_state",
  "persistence",
  "provider_model_api_calls",
  "proof_evidence_readiness_writes",
  "codex_execution",
  "github_mutation",
  "merge_publish_approval",
  "core_decision",
] as const;

const modelFriendlyAuthorityFlagMap = {
  creates_augnes_state: "committed_state",
  calls_provider_model_api: "provider_model_api_calls",
  creates_proof: "proof_evidence_readiness_writes",
  creates_evidence: "proof_evidence_readiness_writes",
  creates_readiness_record: "proof_evidence_readiness_writes",
  executes_codex: "codex_execution",
  mutates_github: "github_mutation",
  approves: "merge_publish_approval",
  merges: "merge_publish_approval",
  publishes: "merge_publish_approval",
  retries: "merge_publish_approval",
  replays: "merge_publish_approval",
  deploys: "merge_publish_approval",
  makes_core_decision: "core_decision",
} satisfies Record<string, keyof CodexPerspectiveCandidateDraftAuthorityFlagsV0>;

const privacyInclusionFalseAliasKeys = [
  "raw_diffs_included",
  "raw_review_material_included",
  "raw_source_material_included",
  "private_material_included",
  "provider_material_included",
  "token_material_included",
  "billing_material_included",
  "api_credentials_included",
  "hidden_reasoning_included",
  "raw_payloads_included",
] as const;

const allowedNextActionIds = new Set([
  "review_candidate",
  "fix_input_gaps",
  "prepare_codex_handoff",
]);

export function alignCodexPerspectiveCandidateDraftSchemaFromModelOutput(
  input: AlignCodexPerspectiveCandidateDraftSchemaInputV0,
): CodexPerspectiveCandidateDraftSchemaAlignmentResultV0 {
  const warnings: CodexPerspectiveCandidateDraftSchemaAlignmentWarningV0[] = [];
  const blockedReasons: string[] = [];
  const omittedUnsafeFields = new Set<string>();
  const appliedMappings = new Set<string>();

  if (!isRecord(input.draft)) {
    return buildBlockedAlignment({
      blockedReasons: ["draft is missing or is not an object"],
      warnings,
      omittedUnsafeFields,
    });
  }

  collectUnsafeFields(input.draft, "draft", omittedUnsafeFields);
  if (omittedUnsafeFields.size > 0) {
    blockedReasons.push(
      "draft includes unsafe raw/private/provider/token material",
    );
    warnings.push({
      warning_kind: "unsafe_material",
      field: "draft",
      summary:
        "Unsafe draft material blocks schema alignment and is not copied into aligned draft material.",
    });
  }

  const selectedMaterial = alignSelectedMaterial({
    formerInputPacket: input.former_input_packet,
    draft: input.draft,
    appliedMappings,
    warnings,
    blockedReasons,
    omittedUnsafeFields,
  });
  const evidencePointers = alignEvidencePointers({
    formerInputPacket: input.former_input_packet,
    draft: input.draft,
    appliedMappings,
    warnings,
    blockedReasons,
    omittedUnsafeFields,
  });
  const authorityFlags = alignAuthorityFlags({
    draft: input.draft,
    appliedMappings,
    warnings,
    blockedReasons,
  });
  const privacyFlags = alignPrivacyFlags({
    draft: input.draft,
    appliedMappings,
    warnings,
    blockedReasons,
    omittedUnsafeFields,
  });
  const unresolvedTensions = alignUnresolvedTensions({
    draft: input.draft,
    appliedMappings,
    warnings,
    blockedReasons,
    omittedUnsafeFields,
  });
  const nextActionCandidates = alignNextActionCandidates({
    draft: input.draft,
    appliedMappings,
    warnings,
    omittedUnsafeFields,
  });
  const userCoreDecisionQuestions = alignUserCoreDecisionQuestions({
    draft: input.draft,
    appliedMappings,
    warnings,
    omittedUnsafeFields,
  });
  const qualificationNotes = alignQualificationNotes({
    draft: input.draft,
    selectedMaterial: isRecord(input.draft.selected_material)
      ? input.draft.selected_material
      : null,
    appliedMappings,
    warnings,
    omittedUnsafeFields,
  });
  const basisQualitySuggestion = alignBasisQualitySuggestion({
    draft: input.draft,
    blockedReasons,
    omittedUnsafeFields,
  });
  const forbiddenActions = alignForbiddenActions({
    draft: input.draft,
    omittedUnsafeFields,
  });
  const sourceFormerInputPacket = alignSourceFormerInputPacket({
    formerInputPacket: input.former_input_packet,
    draft: input.draft,
    blockedReasons,
  });
  const thesis = sanitizeCodexPerspectiveText(
    typeof input.draft.thesis === "string" ? input.draft.thesis : null,
    "draft.thesis",
    omittedUnsafeFields,
  );
  if (!thesis) {
    blockedReasons.push("draft thesis is missing or unsafe");
  }

  if (blockedReasons.length > 0) {
    return buildBlockedAlignment({
      blockedReasons,
      warnings,
      omittedUnsafeFields,
      appliedMappings,
    });
  }

  const alignedDraft: CodexPerspectiveCandidateDraftV0 = {
    draft_version: "codex_perspective_candidate_draft.v0.1",
    draft_kind: "codex_perspective_candidate_draft",
    source_former_input_packet: sourceFormerInputPacket,
    thesis: thesis as string,
    selected_material: selectedMaterial,
    evidence_pointer_refs: evidencePointers,
    unresolved_tensions: unresolvedTensions,
    basis_quality_suggestion: basisQualitySuggestion,
    next_action_candidates: nextActionCandidates,
    user_core_decision_questions: userCoreDecisionQuestions,
    qualification_notes: qualificationNotes,
    privacy_flags: privacyFlags,
    authority_flags: authorityFlags,
    forbidden_actions: forbiddenActions,
  };

  const needsReview = warnings.some((warning) =>
    ["context_default", "omitted_ambiguous_material"].includes(
      warning.warning_kind,
    ),
  );

  return {
    alignment_version: "codex_perspective_candidate_draft_schema_alignment.v0.1",
    alignment_kind: "codex_perspective_candidate_draft_schema_alignment",
    alignment_status: needsReview ? "needs_review" : "aligned",
    aligned_draft: alignedDraft,
    applied_mappings: [...appliedMappings].sort(),
    blocked_reasons: [],
    warnings,
    privacy: {
      raw_payloads_included: false,
      unsafe_input_material_omitted:
        omittedUnsafeFields.size > 0 ||
        privacyFlags.unsafe_input_material_omitted === true,
      omitted_unsafe_fields: uniqueTextList([
        ...omittedUnsafeFields,
        ...(privacyFlags.omitted_unsafe_fields ?? []),
      ]).sort(),
    },
    authority_flags: buildFalseAuthorityFlags(),
  };
}

export function evaluateCodexPerspectiveCandidateDraftSchemaAlignment(
  input: AlignCodexPerspectiveCandidateDraftSchemaInputV0,
): CodexPerspectiveCandidateDraftSchemaAlignmentResultV0 {
  return alignCodexPerspectiveCandidateDraftSchemaFromModelOutput(input);
}

function alignSourceFormerInputPacket({
  formerInputPacket,
  draft,
  blockedReasons,
}: {
  formerInputPacket: CodexPerspectiveFormerInputPacketV0;
  draft: Record<string, unknown>;
  blockedReasons: string[];
}): CodexPerspectiveCandidateDraftV0["source_former_input_packet"] {
  if (
    isRecord(draft.source_former_input_packet) &&
    draft.source_former_input_packet.packet_version ===
      formerInputPacket.packet_version &&
    draft.source_former_input_packet.packet_id === formerInputPacket.packet_id &&
    draft.source_former_input_packet.role === formerInputPacket.role
  ) {
    return {
      packet_version: formerInputPacket.packet_version,
      packet_id: formerInputPacket.packet_id,
      role: formerInputPacket.role,
    };
  }

  blockedReasons.push("draft source former input packet ref does not match");
  return {
    packet_version: formerInputPacket.packet_version,
    packet_id: formerInputPacket.packet_id,
    role: formerInputPacket.role,
  };
}

function alignSelectedMaterial({
  formerInputPacket,
  draft,
  appliedMappings,
  warnings,
  blockedReasons,
  omittedUnsafeFields,
}: {
  formerInputPacket: CodexPerspectiveFormerInputPacketV0;
  draft: Record<string, unknown>;
  appliedMappings: Set<string>;
  warnings: CodexPerspectiveCandidateDraftSchemaAlignmentWarningV0[];
  blockedReasons: string[];
  omittedUnsafeFields: Set<string>;
}): CodexPerspectiveCandidateDraftV0["selected_material"] {
  const sourceBundle = formerInputPacket.source_formation_input_bundle;
  const selected = draft.selected_material;
  if (!isRecord(selected)) {
    blockedReasons.push("selected_material is missing or is not an object");
    return {
      changed_files: [],
      changed_files_summary: null,
      work_id: sourceBundle.work_id,
      source_pr_refs: [...sourceBundle.source_pr_refs],
    };
  }

  let changedFiles = copySafeStringList(
    selected.changed_files,
    "draft.selected_material.changed_files",
    omittedUnsafeFields,
  );
  if (changedFiles.length === 0) {
    const aliasedChangedFiles = copySafeStringList(
      selected.changed_file_paths,
      "draft.selected_material.changed_file_paths",
      omittedUnsafeFields,
    );
    if (aliasedChangedFiles.length > 0) {
      changedFiles = aliasedChangedFiles;
      appliedMappings.add("selected_material_changed_file_paths");
    }
  }
  if (changedFiles.length === 0 && sourceBundle.changed_files.length > 0) {
    changedFiles = [...sourceBundle.changed_files];
    appliedMappings.add("selected_material_changed_files_from_source_context");
    warnings.push({
      warning_kind: "context_default",
      field: "draft.selected_material.changed_files",
      summary:
        "Changed files were missing from draft aliases and were filled from the former input packet context.",
    });
  }
  if (changedFiles.length === 0) {
    blockedReasons.push(
      "selected_material changed files are missing and no source context default is available",
    );
  }

  let changedFilesSummary = sanitizeCodexPerspectiveText(
    typeof selected.changed_files_summary === "string"
      ? selected.changed_files_summary
      : null,
    "draft.selected_material.changed_files_summary",
    omittedUnsafeFields,
  );
  if (!changedFilesSummary) {
    const plainSummaryFacts = copySafeStringList(
      selected.plain_summary_facts,
      "draft.selected_material.plain_summary_facts",
      omittedUnsafeFields,
    );
    if (plainSummaryFacts.length > 0) {
      changedFilesSummary = plainSummaryFacts.join(" ");
      appliedMappings.add("selected_material_plain_summary_facts");
    }
  }
  if (!changedFilesSummary && sourceBundle.changed_files_summary) {
    changedFilesSummary = sourceBundle.changed_files_summary;
    appliedMappings.add(
      "selected_material_changed_files_summary_from_source_context",
    );
    warnings.push({
      warning_kind: "context_default",
      field: "draft.selected_material.changed_files_summary",
      summary:
        "Changed-files summary was filled from the former input packet context.",
    });
  }

  let workId = sanitizeCodexPerspectiveText(
    typeof selected.work_id === "string" ? selected.work_id : null,
    "draft.selected_material.work_id",
    omittedUnsafeFields,
  );
  if (!workId && sourceBundle.work_id) {
    workId = sourceBundle.work_id;
    appliedMappings.add("selected_material_work_id_from_source_context");
  }

  let sourcePrRefs = copySafeStringList(
    selected.source_pr_refs,
    "draft.selected_material.source_pr_refs",
    omittedUnsafeFields,
  );
  if (sourcePrRefs.length === 0 && sourceBundle.source_pr_refs.length > 0) {
    sourcePrRefs = [...sourceBundle.source_pr_refs];
    appliedMappings.add("selected_material_source_pr_refs_from_source_context");
    warnings.push({
      warning_kind: "context_default",
      field: "draft.selected_material.source_pr_refs",
      summary:
        "Source PR refs were missing from draft aliases and were filled from the former input packet context.",
    });
  }

  return {
    changed_files: uniqueTextList(changedFiles),
    changed_files_summary: changedFilesSummary ?? null,
    work_id: workId ?? null,
    source_pr_refs: uniqueTextList(sourcePrRefs),
  };
}

function alignEvidencePointers({
  formerInputPacket,
  draft,
  appliedMappings,
  warnings,
  blockedReasons,
  omittedUnsafeFields,
}: {
  formerInputPacket: CodexPerspectiveFormerInputPacketV0;
  draft: Record<string, unknown>;
  appliedMappings: Set<string>;
  warnings: CodexPerspectiveCandidateDraftSchemaAlignmentWarningV0[];
  blockedReasons: string[];
  omittedUnsafeFields: Set<string>;
}): CodexPerspectiveCandidateDraftV0["evidence_pointer_refs"] {
  if (!Array.isArray(draft.evidence_pointer_refs)) {
    blockedReasons.push("evidence_pointer_refs must be an array");
    return [];
  }

  const allowedPointers = new Set(
    formerInputPacket.pointer_refs.map(
      (pointer) => `${pointer.pointer_kind}|${pointer.ref}`,
    ),
  );
  const allowedKinds = new Set(
    formerInputPacket.pointer_refs.map((pointer) => pointer.pointer_kind),
  );

  return draft.evidence_pointer_refs.flatMap((pointer, index) => {
    if (!isRecord(pointer)) {
      blockedReasons.push(`evidence_pointer_refs[${index}] is not an object`);
      return [];
    }

    const ref = sanitizeCodexPerspectiveText(
      typeof pointer.ref === "string" ? pointer.ref : null,
      `draft.evidence_pointer_refs[${index}].ref`,
      omittedUnsafeFields,
    );
    const pointerKind = alignPointerKind({
      pointer,
      allowedKinds,
      index,
      appliedMappings,
      blockedReasons,
    });
    const pointerSemantics = alignPointerSemantics({
      pointer,
      index,
      appliedMappings,
      blockedReasons,
    });

    if (!ref) {
      blockedReasons.push(`evidence_pointer_refs[${index}] is missing ref`);
      return [];
    }
    if (!pointerKind || !pointerSemantics) return [];

    if (!allowedPointers.has(`${pointerKind}|${ref}`)) {
      blockedReasons.push(
        `evidence_pointer_refs[${index}] is not present in the former input packet pointer refs`,
      );
      warnings.push({
        warning_kind: "pointer_ref",
        field: `draft.evidence_pointer_refs[${index}]`,
        summary:
          "Pointer alias alignment only accepts pointer-only refs present in the former input packet.",
      });
      return [];
    }

    return [
      {
        pointer_kind: pointerKind,
        pointer_semantics: "pointer_only" as const,
        ref,
      },
    ];
  });
}

function alignPointerKind({
  pointer,
  allowedKinds,
  index,
  appliedMappings,
  blockedReasons,
}: {
  pointer: Record<string, unknown>;
  allowedKinds: Set<PerspectiveCandidateEvidencePointerKindV0>;
  index: number;
  appliedMappings: Set<string>;
  blockedReasons: string[];
}): PerspectiveCandidateEvidencePointerKindV0 | null {
  const rawKind =
    typeof pointer.pointer_kind === "string"
      ? pointer.pointer_kind
      : typeof pointer.ref_type === "string"
        ? pointer.ref_type
        : null;

  if (typeof pointer.ref_type === "string" && !pointer.pointer_kind) {
    appliedMappings.add("pointer_ref_type_pointer_only");
  }

  if (!rawKind || !allowedKinds.has(rawKind as PerspectiveCandidateEvidencePointerKindV0)) {
    blockedReasons.push(
      `evidence_pointer_refs[${index}] has missing or unsupported pointer kind`,
    );
    return null;
  }

  return rawKind as PerspectiveCandidateEvidencePointerKindV0;
}

function alignPointerSemantics({
  pointer,
  index,
  appliedMappings,
  blockedReasons,
}: {
  pointer: Record<string, unknown>;
  index: number;
  appliedMappings: Set<string>;
  blockedReasons: string[];
}): "pointer_only" | null {
  if (pointer.pointer_semantics === "pointer_only") return "pointer_only";
  if (pointer.pointer_semantics && pointer.pointer_semantics !== "pointer_only") {
    blockedReasons.push(
      `evidence_pointer_refs[${index}] is not pointer-only`,
    );
    return null;
  }
  if (pointer.pointer_only === true) {
    appliedMappings.add("pointer_ref_type_pointer_only");
    return "pointer_only";
  }
  if (pointer.pointer_only === false) {
    blockedReasons.push(
      `evidence_pointer_refs[${index}] has pointer_only false`,
    );
    return null;
  }

  blockedReasons.push(
    `evidence_pointer_refs[${index}] is missing pointer-only semantics`,
  );
  return null;
}

function alignAuthorityFlags({
  draft,
  appliedMappings,
  warnings,
  blockedReasons,
}: {
  draft: Record<string, unknown>;
  appliedMappings: Set<string>;
  warnings: CodexPerspectiveCandidateDraftSchemaAlignmentWarningV0[];
  blockedReasons: string[];
}): CodexPerspectiveCandidateDraftAuthorityFlagsV0 {
  const sourceFlags = isRecord(draft.authority_flags)
    ? draft.authority_flags
    : {};
  const canonicalFlags = buildFalseAuthorityFlags();
  let sawModelFriendlyFlag = false;

  for (const key of canonicalAuthorityFlagKeys) {
    if (sourceFlags[key] === true) {
      blockedReasons.push(`authority_flags.${key} is true`);
      warnings.push({
        warning_kind: "authority_claim",
        field: `draft.authority_flags.${key}`,
        summary: "Canonical authority flags must remain false.",
      });
    }
  }

  Object.entries(modelFriendlyAuthorityFlagMap).forEach(
    ([modelFriendlyKey]) => {
      if (Object.prototype.hasOwnProperty.call(sourceFlags, modelFriendlyKey)) {
        sawModelFriendlyFlag = true;
      }
      if (sourceFlags[modelFriendlyKey] === true) {
        blockedReasons.push(`authority_flags.${modelFriendlyKey} is true`);
        warnings.push({
          warning_kind: "authority_claim",
          field: `draft.authority_flags.${modelFriendlyKey}`,
          summary:
            "Model-friendly authority aliases may align only when every authority alias is false.",
        });
      }
    },
  );

  Object.entries(sourceFlags).forEach(([key, value]) => {
    if (
      value === true &&
      !canonicalAuthorityFlagKeys.includes(
        key as (typeof canonicalAuthorityFlagKeys)[number],
      ) &&
      !Object.prototype.hasOwnProperty.call(
        modelFriendlyAuthorityFlagMap,
        key,
      )
    ) {
      blockedReasons.push(`authority_flags.${key} is an unsupported true flag`);
    }
  });

  if (sawModelFriendlyFlag) {
    appliedMappings.add("authority_model_friendly_false_flags");
  }

  return canonicalFlags;
}

function alignPrivacyFlags({
  draft,
  appliedMappings,
  warnings,
  blockedReasons,
  omittedUnsafeFields,
}: {
  draft: Record<string, unknown>;
  appliedMappings: Set<string>;
  warnings: CodexPerspectiveCandidateDraftSchemaAlignmentWarningV0[];
  blockedReasons: string[];
  omittedUnsafeFields: Set<string>;
}): CodexPerspectiveCandidateDraftV0["privacy_flags"] {
  const sourceFlags = isRecord(draft.privacy_flags) ? draft.privacy_flags : {};
  let sawPrivacyAlias = false;

  privacyInclusionFalseAliasKeys.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(sourceFlags, key)) {
      sawPrivacyAlias = true;
    }
    if (sourceFlags[key] === true) {
      blockedReasons.push(`privacy_flags.${key} is true`);
      warnings.push({
        warning_kind: "unsafe_material",
        field: `draft.privacy_flags.${key}`,
        summary:
          "Privacy inclusion flags must remain false before schema alignment can continue.",
      });
    }
  });

  Object.entries(sourceFlags).forEach(([key, value]) => {
    if (key.endsWith("_included") && value === true) {
      blockedReasons.push(`privacy_flags.${key} is true`);
    }
  });

  if (sawPrivacyAlias) {
    appliedMappings.add("privacy_false_alias_flags");
  }

  const omittedFields = copySafeStringList(
    sourceFlags.omitted_unsafe_fields,
    "draft.privacy_flags.omitted_unsafe_fields",
    omittedUnsafeFields,
  );

  return {
    raw_payloads_included: false,
    unsafe_input_material_omitted:
      sourceFlags.unsafe_input_material_omitted === true,
    omitted_unsafe_fields: omittedFields,
  };
}

function alignUnresolvedTensions({
  draft,
  appliedMappings,
  warnings,
  blockedReasons,
  omittedUnsafeFields,
}: {
  draft: Record<string, unknown>;
  appliedMappings: Set<string>;
  warnings: CodexPerspectiveCandidateDraftSchemaAlignmentWarningV0[];
  blockedReasons: string[];
  omittedUnsafeFields: Set<string>;
}): PerspectiveCandidateUnresolvedTensionV0[] {
  if (!Array.isArray(draft.unresolved_tensions)) {
    blockedReasons.push("unresolved_tensions must be an array");
    return [];
  }

  return draft.unresolved_tensions.flatMap((tension, index) => {
    if (!isRecord(tension)) {
      warnings.push({
        warning_kind: "omitted_ambiguous_material",
        field: `draft.unresolved_tensions[${index}]`,
        summary: "Non-object unresolved tension was omitted.",
      });
      return [];
    }

    const summary = sanitizeCodexPerspectiveText(
      typeof tension.summary === "string" ? tension.summary : null,
      `draft.unresolved_tensions[${index}].summary`,
      omittedUnsafeFields,
    );
    if (!summary) return [];

    const sourceRef = sanitizeCodexPerspectiveText(
      typeof tension.source_ref === "string"
        ? tension.source_ref
        : typeof tension.id === "string"
          ? tension.id
          : null,
      `draft.unresolved_tensions[${index}].source_ref`,
      omittedUnsafeFields,
    );
    if (typeof tension.id === "string" && !tension.source_ref) {
      appliedMappings.add("unresolved_tension_id_source_ref");
    }

    return [
      {
        tension_kind: normalizeTensionKind(tension.tension_kind),
        summary,
        ...(sourceRef ? { source_ref: sourceRef } : {}),
      },
    ];
  });
}

function alignNextActionCandidates({
  draft,
  appliedMappings,
  warnings,
  omittedUnsafeFields,
}: {
  draft: Record<string, unknown>;
  appliedMappings: Set<string>;
  warnings: CodexPerspectiveCandidateDraftSchemaAlignmentWarningV0[];
  omittedUnsafeFields: Set<string>;
}): PerspectiveCandidateNextActionV0[] {
  if (!Array.isArray(draft.next_action_candidates)) return [];

  return draft.next_action_candidates.flatMap((action, index) => {
    if (!isRecord(action)) return [];
    const summary = sanitizeCodexPerspectiveText(
      typeof action.summary === "string" ? action.summary : null,
      `draft.next_action_candidates[${index}].summary`,
      omittedUnsafeFields,
    );
    if (!summary) return [];

    const actionId = normalizeActionId(action);
    if (!actionId) {
      warnings.push({
        warning_kind: "omitted_ambiguous_material",
        field: `draft.next_action_candidates[${index}].id`,
        summary:
          "Next-action id did not map to a canonical action id and was omitted.",
      });
      return [];
    }

    if (!action.action_id && action.id) {
      appliedMappings.add("next_action_id_to_action_id");
    }

    return [
      {
        action_id: actionId,
        summary,
      },
    ];
  });
}

function alignUserCoreDecisionQuestions({
  draft,
  appliedMappings,
  warnings,
  omittedUnsafeFields,
}: {
  draft: Record<string, unknown>;
  appliedMappings: Set<string>;
  warnings: CodexPerspectiveCandidateDraftSchemaAlignmentWarningV0[];
  omittedUnsafeFields: Set<string>;
}): string[] {
  if (!Array.isArray(draft.user_core_decision_questions)) return [];

  return draft.user_core_decision_questions.flatMap((question, index) => {
    const value =
      typeof question === "string"
        ? question
        : isRecord(question) && typeof question.question === "string"
          ? question.question
          : null;
    const safeQuestion = sanitizeCodexPerspectiveText(
      value,
      `draft.user_core_decision_questions[${index}]`,
      omittedUnsafeFields,
    );
    if (!safeQuestion) {
      warnings.push({
        warning_kind: "omitted_ambiguous_material",
        field: `draft.user_core_decision_questions[${index}]`,
        summary: "Ambiguous user/Core decision question was omitted.",
      });
      return [];
    }
    if (isRecord(question) && typeof question.question === "string") {
      appliedMappings.add("user_core_decision_question_object_question");
    }
    return [safeQuestion];
  });
}

function alignQualificationNotes({
  draft,
  selectedMaterial,
  appliedMappings,
  warnings,
  omittedUnsafeFields,
}: {
  draft: Record<string, unknown>;
  selectedMaterial: Record<string, unknown> | null;
  appliedMappings: Set<string>;
  warnings: CodexPerspectiveCandidateDraftSchemaAlignmentWarningV0[];
  omittedUnsafeFields: Set<string>;
}): string[] {
  const notes = copySafeStringList(
    draft.qualification_notes,
    "draft.qualification_notes",
    omittedUnsafeFields,
  );
  const neutralBasis = selectedMaterial
    ? copySafeStringList(
        selectedMaterial.neutral_perspective_basis,
        "draft.selected_material.neutral_perspective_basis",
        omittedUnsafeFields,
      )
    : [];

  if (neutralBasis.length > 0) {
    appliedMappings.add(
      "selected_material_neutral_perspective_basis_to_qualification_notes",
    );
    neutralBasis.forEach((basis) =>
      notes.push(`Neutral perspective basis: ${basis}`),
    );
  } else if (
    selectedMaterial &&
    Object.prototype.hasOwnProperty.call(
      selectedMaterial,
      "neutral_perspective_basis",
    )
  ) {
    warnings.push({
      warning_kind: "omitted_ambiguous_material",
      field: "draft.selected_material.neutral_perspective_basis",
      summary:
        "Neutral perspective basis was present but could not be copied as bounded notes.",
    });
  }

  return uniqueTextList(notes);
}

function alignBasisQualitySuggestion({
  draft,
  blockedReasons,
  omittedUnsafeFields,
}: {
  draft: Record<string, unknown>;
  blockedReasons: string[];
  omittedUnsafeFields: Set<string>;
}): CodexPerspectiveCandidateDraftV0["basis_quality_suggestion"] {
  const basis = draft.basis_quality_suggestion;
  if (!isRecord(basis)) {
    blockedReasons.push("basis_quality_suggestion is missing or is not an object");
    return {
      status: "blocked",
      reasons: [],
    };
  }

  const status =
    basis.status === "sufficient_for_review" ||
    basis.status === "needs_review" ||
    basis.status === "blocked"
      ? basis.status
      : "needs_review";
  const reasons = copySafeStringList(
    basis.reasons,
    "draft.basis_quality_suggestion.reasons",
    omittedUnsafeFields,
  );

  return {
    status,
    reasons,
  };
}

function alignForbiddenActions({
  draft,
  omittedUnsafeFields,
}: {
  draft: Record<string, unknown>;
  omittedUnsafeFields: Set<string>;
}): string[] {
  const actions = copySafeStringList(
    draft.forbidden_actions,
    "draft.forbidden_actions",
    omittedUnsafeFields,
  );

  return actions.length > 0
    ? actions
    : [
        "Do not create proof, evidence, readiness records, or accepted Augnes state.",
        "Do not approve, merge, publish, retry, replay, deploy, or mutate GitHub.",
        "Do not execute Codex, call the Codex SDK, or call provider/model/API services.",
        "Do not make Core decisions.",
      ];
}

function normalizeTensionKind(
  value: unknown,
): PerspectiveCandidateUnresolvedTensionV0["tension_kind"] {
  if (
    value === "unresolved_gap" ||
    value === "readiness_reason" ||
    value === "failed_check" ||
    value === "skipped_check_missing_reason"
  ) {
    return value;
  }

  return "unresolved_gap";
}

function normalizeActionId(
  action: Record<string, unknown>,
): PerspectiveCandidateNextActionV0["action_id"] | null {
  if (
    typeof action.action_id === "string" &&
    allowedNextActionIds.has(action.action_id)
  ) {
    return action.action_id as PerspectiveCandidateNextActionV0["action_id"];
  }

  if (action.id === "capture-one-bounded-real-transcript") {
    return "fix_input_gaps";
  }
  if (action.id === "validate-returned-draft-locally") {
    return "review_candidate";
  }

  return null;
}

function buildBlockedAlignment({
  blockedReasons,
  warnings,
  omittedUnsafeFields,
  appliedMappings,
}: {
  blockedReasons: readonly string[];
  warnings: readonly CodexPerspectiveCandidateDraftSchemaAlignmentWarningV0[];
  omittedUnsafeFields: Set<string>;
  appliedMappings?: Set<string>;
}): CodexPerspectiveCandidateDraftSchemaAlignmentResultV0 {
  return {
    alignment_version: "codex_perspective_candidate_draft_schema_alignment.v0.1",
    alignment_kind: "codex_perspective_candidate_draft_schema_alignment",
    alignment_status: "blocked",
    aligned_draft: null,
    applied_mappings: [...(appliedMappings ?? new Set<string>())].sort(),
    blocked_reasons: uniqueTextList([...blockedReasons]),
    warnings: [...warnings],
    privacy: {
      raw_payloads_included: false,
      unsafe_input_material_omitted: omittedUnsafeFields.size > 0,
      omitted_unsafe_fields: [...omittedUnsafeFields].sort(),
    },
    authority_flags: buildFalseAuthorityFlags(),
  };
}

function copySafeStringList(
  value: unknown,
  fieldName: string,
  omittedUnsafeFields: Set<string>,
): string[] {
  if (!Array.isArray(value)) return [];

  return uniqueTextList(
    value.flatMap((item, index) => {
      const safeText = sanitizeCodexPerspectiveText(
        typeof item === "string" ? item : null,
        `${fieldName}[${index}]`,
        omittedUnsafeFields,
      );
      return safeText ? [safeText] : [];
    }),
  );
}

function collectUnsafeFields(
  value: unknown,
  path: string,
  omittedUnsafeFields: Set<string>,
): void {
  if (typeof value === "string") {
    if (containsUnsafeCodexPerspectiveMaterial(value)) {
      omittedUnsafeFields.add(path);
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      collectUnsafeFields(item, `${path}[${index}]`, omittedUnsafeFields),
    );
    return;
  }

  if (!isRecord(value)) return;

  Object.entries(value).forEach(([key, nestedValue]) =>
    collectUnsafeFields(nestedValue, `${path}.${key}`, omittedUnsafeFields),
  );
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

function buildFalseAuthorityFlags(): CodexPerspectiveCandidateDraftSchemaAlignmentResultV0["authority_flags"] {
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
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
