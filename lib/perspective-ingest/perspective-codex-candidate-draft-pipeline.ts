import type {
  PerspectiveCandidateBasisQualityStatusV0,
  PerspectiveCandidateEvidencePointerV0,
  PerspectiveCandidateNextActionV0,
  PerspectiveCandidateUnresolvedTensionV0,
  PerspectiveCandidateV0,
} from "@/lib/perspective-ingest/perspective-candidate-builder";
import type { PerspectiveFormationCheckRunInputV0 } from "@/lib/perspective-ingest/perspective-formation-input-bundle";
import {
  containsUnsafeCodexPerspectiveMaterial,
  copySafeCodexPerspectiveTextList,
  sanitizeCodexPerspectiveText,
  type CodexPerspectiveFormerInputPacketV0,
} from "@/lib/perspective-ingest/perspective-codex-former-input-packet";

export type CodexPerspectiveCandidateDraftVersionV0 =
  "codex_perspective_candidate_draft.v0.1";
export type CodexPerspectiveCandidateDraftKindV0 =
  "codex_perspective_candidate_draft";
export type CodexPerspectiveDraftValidationVersionV0 =
  "codex_perspective_candidate_draft_validation.v0.1";
export type CodexPerspectiveDraftValidationKindV0 =
  "codex_perspective_candidate_draft_validation";
export type CodexPerspectiveDraftValidationStatusV0 =
  | "ready_for_review"
  | "needs_review"
  | "blocked";

export interface CodexPerspectiveCandidateDraftSourceRefV0 {
  packet_version: CodexPerspectiveFormerInputPacketV0["packet_version"];
  packet_id: string;
  role: CodexPerspectiveFormerInputPacketV0["role"];
}

export interface CodexPerspectiveCandidateDraftAuthorityFlagsV0 {
  committed_state?: boolean;
  persistence?: boolean;
  provider_model_api_calls?: boolean;
  proof_evidence_readiness_writes?: boolean;
  codex_execution?: boolean;
  github_mutation?: boolean;
  merge_publish_approval?: boolean;
  core_decision?: boolean;
}

export interface CodexPerspectiveCandidateDraftV0 {
  draft_version: CodexPerspectiveCandidateDraftVersionV0;
  draft_kind: CodexPerspectiveCandidateDraftKindV0;
  source_former_input_packet: CodexPerspectiveCandidateDraftSourceRefV0;
  thesis: string;
  selected_material: {
    changed_files: string[];
    changed_files_summary: string | null;
    work_id: string | null;
    source_pr_refs: string[];
  };
  evidence_pointer_refs: PerspectiveCandidateEvidencePointerV0[];
  unresolved_tensions: PerspectiveCandidateUnresolvedTensionV0[];
  basis_quality_suggestion: {
    status: PerspectiveCandidateBasisQualityStatusV0;
    reasons: string[];
  };
  next_action_candidates: PerspectiveCandidateNextActionV0[];
  user_core_decision_questions: string[];
  qualification_notes: string[];
  privacy_flags: {
    raw_payloads_included?: boolean;
    unsafe_input_material_omitted?: boolean;
    omitted_unsafe_fields?: string[];
  };
  authority_flags: CodexPerspectiveCandidateDraftAuthorityFlagsV0;
  forbidden_actions: string[];
}

export interface CodexPerspectiveDraftValidationWarningV0 {
  warning_kind:
    | "authority_claim"
    | "unknown_pointer_ref"
    | "omitted_unsafe_material"
    | "normalization";
  field: string;
  summary: string;
}

export interface CodexPerspectiveDraftValidationResultV0 {
  validation_version: CodexPerspectiveDraftValidationVersionV0;
  validation_kind: CodexPerspectiveDraftValidationKindV0;
  status: CodexPerspectiveDraftValidationStatusV0;
  candidate_review_material: PerspectiveCandidateV0 | null;
  blocked_reasons: string[];
  warnings: CodexPerspectiveDraftValidationWarningV0[];
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

interface ValidateCodexPerspectiveCandidateDraftInputV0 {
  former_input_packet: CodexPerspectiveFormerInputPacketV0;
  draft: Partial<CodexPerspectiveCandidateDraftV0> | null | undefined;
}

const requiredDraftFields = [
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

export function validateAndNormalizeCodexPerspectiveCandidateDraft({
  former_input_packet,
  draft,
}: ValidateCodexPerspectiveCandidateDraftInputV0): CodexPerspectiveDraftValidationResultV0 {
  const omittedUnsafeFields = new Set<string>();
  const warnings: CodexPerspectiveDraftValidationWarningV0[] = [];
  const blockedReasons: string[] = [];

  if (!isRecord(draft)) {
    return buildBlockedResult({
      blockedReasons: ["draft is missing or is not an object"],
      warnings,
      omittedUnsafeFields,
    });
  }

  const missingFields = requiredDraftFields.filter(
    (field) => !Object.prototype.hasOwnProperty.call(draft, field),
  );
  if (missingFields.length > 0) {
    blockedReasons.push(`missing required fields: ${missingFields.join(", ")}`);
  }

  collectUnsafeFields(draft, "draft", omittedUnsafeFields);
  if (omittedUnsafeFields.size > 0) {
    blockedReasons.push("draft includes unsafe raw/private/provider/token material");
    warnings.push({
      warning_kind: "omitted_unsafe_material",
      field: "draft",
      summary:
        "Unsafe draft details were omitted from normalization and block candidate-compatible material.",
    });
  }

  if (
    draft.draft_version !== "codex_perspective_candidate_draft.v0.1" ||
    draft.draft_kind !== "codex_perspective_candidate_draft"
  ) {
    blockedReasons.push("draft version or kind is not supported");
  }

  if (!matchesSourcePacketRef(draft, former_input_packet)) {
    blockedReasons.push("draft source former input packet ref does not match");
  }

  const authorityWarnings = collectAuthorityWarnings(draft);
  if (authorityWarnings.length > 0) {
    blockedReasons.push("draft includes forbidden authority claims");
    warnings.push(...authorityWarnings);
  }

  if (draft.privacy_flags?.raw_payloads_included === true) {
    blockedReasons.push("draft says raw payloads are included");
    warnings.push({
      warning_kind: "omitted_unsafe_material",
      field: "draft.privacy_flags.raw_payloads_included",
      summary:
        "Draft privacy flags claimed raw payload inclusion; candidate-compatible material is blocked.",
    });
  }

  if (blockedReasons.length > 0) {
    return buildBlockedResult({
      blockedReasons: uniqueTextList(blockedReasons),
      warnings,
      omittedUnsafeFields,
    });
  }

  const candidate = normalizeCandidate({
    formerInputPacket: former_input_packet,
    draft: draft as CodexPerspectiveCandidateDraftV0,
    warnings,
    omittedUnsafeFields,
  });

  return {
    validation_version: "codex_perspective_candidate_draft_validation.v0.1",
    validation_kind: "codex_perspective_candidate_draft_validation",
    status:
      candidate.basis_quality.status === "sufficient_for_review"
        ? "ready_for_review"
        : "needs_review",
    candidate_review_material: candidate,
    blocked_reasons: [],
    warnings,
    privacy: {
      raw_payloads_included: false,
      unsafe_input_material_omitted: omittedUnsafeFields.size > 0,
      omitted_unsafe_fields: [...omittedUnsafeFields].sort(),
    },
    authority_flags: buildFalseAuthorityFlags(),
  };
}

function normalizeCandidate({
  formerInputPacket,
  draft,
  warnings,
  omittedUnsafeFields,
}: {
  formerInputPacket: CodexPerspectiveFormerInputPacketV0;
  draft: CodexPerspectiveCandidateDraftV0;
  warnings: CodexPerspectiveDraftValidationWarningV0[];
  omittedUnsafeFields: Set<string>;
}): PerspectiveCandidateV0 {
  const sourceBundle = formerInputPacket.source_formation_input_bundle;
  const safeThesis =
    sanitizeCodexPerspectiveText(
      draft.thesis,
      "draft.thesis",
      omittedUnsafeFields,
    ) ?? "Draft thesis was omitted during validation.";
  const selectedMaterial = normalizeSelectedMaterial({
    formerInputPacket,
    draft,
    omittedUnsafeFields,
  });
  const evidencePointers = normalizeEvidencePointers({
    formerInputPacket,
    draft,
    warnings,
    omittedUnsafeFields,
  });
  const unresolvedTensions = normalizeUnresolvedTensions({
    formerInputPacket,
    draft,
    omittedUnsafeFields,
  });
  const basisQuality = normalizeBasisQuality({
    formerInputPacket,
    draft,
    unresolvedTensions,
    omittedUnsafeFields,
  });

  return {
    candidate_version: "perspective_candidate.v0.1",
    candidate_kind: "perspective_candidate",
    candidate_id: buildCandidateId({
      formerInputPacket,
      thesis: safeThesis,
    }),
    status: "perspective_candidate",
    authority: "non_committed",
    source_bundle: {
      bundle_version: sourceBundle.bundle_version,
      scope: sourceBundle.scope,
      work_id: sourceBundle.work_id,
      source_pr_refs: [...sourceBundle.source_pr_refs],
    },
    thesis: safeThesis,
    selected_material: selectedMaterial,
    evidence_pointers: evidencePointers,
    verification_summary: {
      checks_run_count: sourceBundle.verification_basis.checks_run.length,
      check_statuses: countCheckStatuses(
        sourceBundle.verification_basis.checks_run,
      ),
      checks_run: sourceBundle.verification_basis.checks_run.map((check) => ({
        check_id: check.check_id,
        command: check.command,
        status: check.status,
        result_summary: check.result_summary,
      })),
      skipped_checks: sourceBundle.verification_basis.skipped_checks.map(
        (check) => ({
          check_id: check.check_id,
          skipped_reason: check.skipped_reason,
          ...(check.result_summary !== undefined
            ? { result_summary: check.result_summary }
            : {}),
        }),
      ),
    },
    unresolved_tensions: unresolvedTensions,
    basis_quality: basisQuality,
    next_action_candidates: normalizeNextActions({
      draft,
      basisStatus: basisQuality.status,
      unresolvedTensions,
      omittedUnsafeFields,
    }),
    user_core_decision_questions: normalizeUserCoreDecisionQuestions({
      draft,
      basisStatus: basisQuality.status,
      omittedUnsafeFields,
    }),
    forbidden_actions: [
      "no commit/reject state",
      "no proof/evidence/readiness writes",
      "no merge/publish/approval",
      "no GitHub mutation",
      "no Codex execution",
      "no provider/model/API calls",
      "no persistence",
      "no Core decision",
    ],
    privacy: {
      raw_payloads_included: false,
    },
    authority_flags: {
      committed_state: false,
      persistence: false,
      provider_model_api_calls: false,
      proof_evidence_readiness_writes: false,
      codex_execution: false,
      merge_publish_approval: false,
    },
  };
}

function normalizeSelectedMaterial({
  formerInputPacket,
  draft,
  omittedUnsafeFields,
}: {
  formerInputPacket: CodexPerspectiveFormerInputPacketV0;
  draft: CodexPerspectiveCandidateDraftV0;
  omittedUnsafeFields: Set<string>;
}): PerspectiveCandidateV0["selected_material"] {
  const sourceBundle = formerInputPacket.source_formation_input_bundle;
  const changedFiles = copySafeCodexPerspectiveTextList(
    draft.selected_material.changed_files,
    "draft.selected_material.changed_files",
    omittedUnsafeFields,
  );
  const sourceChangedFiles =
    changedFiles.length > 0 ? changedFiles : [...sourceBundle.changed_files];

  return {
    changed_files: uniqueTextList(sourceChangedFiles),
    changed_files_summary:
      sanitizeCodexPerspectiveText(
        draft.selected_material.changed_files_summary,
        "draft.selected_material.changed_files_summary",
        omittedUnsafeFields,
      ) ?? sourceBundle.changed_files_summary,
    work_id:
      sanitizeCodexPerspectiveText(
        draft.selected_material.work_id,
        "draft.selected_material.work_id",
        omittedUnsafeFields,
      ) ?? sourceBundle.work_id,
    source_pr_refs:
      copySafeCodexPerspectiveTextList(
        draft.selected_material.source_pr_refs,
        "draft.selected_material.source_pr_refs",
        omittedUnsafeFields,
      ).length > 0
        ? copySafeCodexPerspectiveTextList(
            draft.selected_material.source_pr_refs,
            "draft.selected_material.source_pr_refs",
            omittedUnsafeFields,
          )
        : [...sourceBundle.source_pr_refs],
  };
}

function normalizeEvidencePointers({
  formerInputPacket,
  draft,
  warnings,
  omittedUnsafeFields,
}: {
  formerInputPacket: CodexPerspectiveFormerInputPacketV0;
  draft: CodexPerspectiveCandidateDraftV0;
  warnings: CodexPerspectiveDraftValidationWarningV0[];
  omittedUnsafeFields: Set<string>;
}): PerspectiveCandidateEvidencePointerV0[] {
  const allowedPointerKeys = new Set(
    formerInputPacket.pointer_refs.map(
      (pointer) => `${pointer.pointer_kind}|${pointer.ref}`,
    ),
  );
  const normalizedPointers: PerspectiveCandidateEvidencePointerV0[] = [];

  draft.evidence_pointer_refs.forEach((pointer, index) => {
    const safeRef = sanitizeCodexPerspectiveText(
      pointer.ref,
      `draft.evidence_pointer_refs[${index}].ref`,
      omittedUnsafeFields,
    );
    const key = `${pointer.pointer_kind}|${safeRef ?? ""}`;

    if (!safeRef || pointer.pointer_semantics !== "pointer_only") {
      warnings.push({
        warning_kind: "normalization",
        field: `draft.evidence_pointer_refs[${index}]`,
        summary:
          "Draft evidence pointer was omitted because it was missing pointer-only semantics.",
      });
      return;
    }

    if (!allowedPointerKeys.has(key)) {
      warnings.push({
        warning_kind: "unknown_pointer_ref",
        field: `draft.evidence_pointer_refs[${index}]`,
        summary:
          "Draft evidence pointer was omitted because it was not present in the former input packet.",
      });
      return;
    }

    normalizedPointers.push({
      pointer_kind: pointer.pointer_kind,
      pointer_semantics: "pointer_only",
      ref: safeRef,
    });
  });

  return dedupePointers(normalizedPointers);
}

function normalizeUnresolvedTensions({
  formerInputPacket,
  draft,
  omittedUnsafeFields,
}: {
  formerInputPacket: CodexPerspectiveFormerInputPacketV0;
  draft: CodexPerspectiveCandidateDraftV0;
  omittedUnsafeFields: Set<string>;
}): PerspectiveCandidateUnresolvedTensionV0[] {
  const sourceBundle = formerInputPacket.source_formation_input_bundle;
  const sourceTensions: PerspectiveCandidateUnresolvedTensionV0[] = [
    ...sourceBundle.unresolved_gaps.map((gap) => ({
      tension_kind: "unresolved_gap" as const,
      summary: gap.summary,
      source_ref: gap.gap_id,
    })),
    ...sourceBundle.verification_basis.checks_run
      .filter((check) => check.status === "failed")
      .map((check) => ({
        tension_kind: "failed_check" as const,
        summary: check.result_summary,
        source_ref: check.check_id,
      })),
    ...sourceBundle.verification_basis.skipped_checks
      .filter((check) => !hasText(check.skipped_reason))
      .map((check) => ({
        tension_kind: "skipped_check_missing_reason" as const,
        summary: `Skipped check ${check.check_id} is missing a concrete reason.`,
        source_ref: check.check_id,
      })),
  ];

  if (sourceBundle.readiness.status !== "ready_for_candidate") {
    sourceTensions.push(
      ...sourceBundle.readiness.reasons.map((reason) => ({
        tension_kind: "readiness_reason" as const,
        summary: reason,
      })),
    );
  }

  const draftTensions = draft.unresolved_tensions.flatMap((tension, index) => {
    const safeSummary = sanitizeCodexPerspectiveText(
      tension.summary,
      `draft.unresolved_tensions[${index}].summary`,
      omittedUnsafeFields,
    );
    if (!safeSummary) return [];

    return [
      {
        tension_kind: normalizeTensionKind(tension.tension_kind),
        summary: safeSummary,
        ...(sanitizeCodexPerspectiveText(
          tension.source_ref,
          `draft.unresolved_tensions[${index}].source_ref`,
          omittedUnsafeFields,
        )
          ? {
              source_ref: sanitizeCodexPerspectiveText(
                tension.source_ref,
                `draft.unresolved_tensions[${index}].source_ref`,
                omittedUnsafeFields,
              ) as string,
            }
          : {}),
      },
    ];
  });
  const qualificationTensions = copySafeCodexPerspectiveTextList(
    draft.qualification_notes,
    "draft.qualification_notes",
    omittedUnsafeFields,
  ).map((note) => ({
    tension_kind: "readiness_reason" as const,
    summary: `Qualification note: ${note}`,
    source_ref: "codex-draft:qualification-note",
  }));

  return dedupeTensions([
    ...sourceTensions,
    ...draftTensions,
    ...qualificationTensions,
  ]);
}

function normalizeBasisQuality({
  formerInputPacket,
  draft,
  unresolvedTensions,
  omittedUnsafeFields,
}: {
  formerInputPacket: CodexPerspectiveFormerInputPacketV0;
  draft: CodexPerspectiveCandidateDraftV0;
  unresolvedTensions: readonly PerspectiveCandidateUnresolvedTensionV0[];
  omittedUnsafeFields: Set<string>;
}): PerspectiveCandidateV0["basis_quality"] {
  const sourceBundle = formerInputPacket.source_formation_input_bundle;
  const failedChecks = sourceBundle.verification_basis.checks_run.filter(
    (check) => check.status === "failed",
  );
  const safeDraftReasons = copySafeCodexPerspectiveTextList(
    draft.basis_quality_suggestion.reasons,
    "draft.basis_quality_suggestion.reasons",
    omittedUnsafeFields,
  );
  const qualificationReasons = copySafeCodexPerspectiveTextList(
    draft.qualification_notes,
    "draft.qualification_notes",
    omittedUnsafeFields,
  ).map((note) => `qualification: ${note}`);
  const reasons = uniqueTextList([
    ...sourceBundle.readiness.reasons,
    ...safeDraftReasons,
    ...qualificationReasons,
    ...(failedChecks.length > 0 ? ["failed checks present"] : []),
  ]);
  const suggestedStatus = draft.basis_quality_suggestion.status;
  const sourceStatus = sourceBundle.readiness.status;
  const status: PerspectiveCandidateBasisQualityStatusV0 =
    sourceStatus === "blocked" || suggestedStatus === "blocked"
      ? "blocked"
      : sourceStatus === "needs_review" ||
          suggestedStatus === "needs_review" ||
          failedChecks.length > 0 ||
          unresolvedTensions.length > 0
        ? "needs_review"
        : "sufficient_for_review";

  return {
    status,
    reasons,
  };
}

function normalizeNextActions({
  draft,
  basisStatus,
  unresolvedTensions,
  omittedUnsafeFields,
}: {
  draft: CodexPerspectiveCandidateDraftV0;
  basisStatus: PerspectiveCandidateBasisQualityStatusV0;
  unresolvedTensions: readonly PerspectiveCandidateUnresolvedTensionV0[];
  omittedUnsafeFields: Set<string>;
}): PerspectiveCandidateNextActionV0[] {
  const actions: PerspectiveCandidateNextActionV0[] = [
    {
      action_id: "review_candidate",
      summary: "Review the non-committed Codex-formed Perspective material.",
    },
  ];

  for (const action of draft.next_action_candidates) {
    if (
      !["review_candidate", "fix_input_gaps", "prepare_codex_handoff"].includes(
        action.action_id,
      )
    ) {
      continue;
    }

    const safeSummary = sanitizeCodexPerspectiveText(
      action.summary,
      `draft.next_action_candidates.${action.action_id}.summary`,
      omittedUnsafeFields,
    );
    if (!safeSummary) continue;

    actions.push({
      action_id: action.action_id,
      summary: safeSummary,
    });
  }

  if (
    basisStatus !== "sufficient_for_review" ||
    unresolvedTensions.some((tension) =>
      ["unresolved_gap", "skipped_check_missing_reason"].includes(
        tension.tension_kind,
      ),
    )
  ) {
    actions.push({
      action_id: "fix_input_gaps",
      summary:
        "Resolve missing input, failed check, skipped-check, qualification, or gap material before future handoff.",
    });
  }

  if (basisStatus === "sufficient_for_review") {
    actions.push({
      action_id: "prepare_codex_handoff",
      summary:
        "Prepare a future Codex handoff only after user review of this non-committed material.",
    });
  }

  return dedupeNextActions(actions);
}

function normalizeUserCoreDecisionQuestions({
  draft,
  basisStatus,
  omittedUnsafeFields,
}: {
  draft: CodexPerspectiveCandidateDraftV0;
  basisStatus: PerspectiveCandidateBasisQualityStatusV0;
  omittedUnsafeFields: Set<string>;
}): string[] {
  const questions = copySafeCodexPerspectiveTextList(
    draft.user_core_decision_questions,
    "draft.user_core_decision_questions",
    omittedUnsafeFields,
  );

  if (basisStatus !== "sufficient_for_review" && questions.length === 0) {
    questions.push(
      "Which unresolved gaps or qualification notes must be resolved before future worker planning?",
    );
  }

  return questions;
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

function collectAuthorityWarnings(
  draft: Partial<CodexPerspectiveCandidateDraftV0>,
): CodexPerspectiveDraftValidationWarningV0[] {
  const warnings: CodexPerspectiveDraftValidationWarningV0[] = [];

  if (isRecord(draft.authority_flags)) {
    for (const key of authorityFlagKeys) {
      if (draft.authority_flags[key] === true) {
        warnings.push({
          warning_kind: "authority_claim",
          field: `draft.authority_flags.${key}`,
          summary: "Draft attempted to grant forbidden authority; validation forced the authority flag false.",
        });
      }
    }
  }

  collectAuthorityClaimText(draft, "draft", warnings);

  return warnings;
}

function collectAuthorityClaimText(
  value: unknown,
  path: string,
  warnings: CodexPerspectiveDraftValidationWarningV0[],
): void {
  if (typeof value === "string") {
    if (containsAffirmativeAuthorityClaim(value)) {
      warnings.push({
        warning_kind: "authority_claim",
        field: path,
        summary:
          "Draft attempted to claim forbidden approval, write, execution, mutation, or Core-decision authority.",
      });
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      collectAuthorityClaimText(item, `${path}[${index}]`, warnings),
    );
    return;
  }

  if (!isRecord(value)) return;

  Object.entries(value).forEach(([key, nestedValue]) =>
    collectAuthorityClaimText(nestedValue, `${path}.${key}`, warnings),
  );
}

function containsAffirmativeAuthorityClaim(value: string): boolean {
  const lowered = value.toLowerCase();
  const patterns = [
    "approval granted",
    "approved this",
    "approved by codex",
    "merge completed",
    "merged this",
    "ready for merge",
    "publish completed",
    "github mutation complete",
    "github mutation completed",
    "mutated github",
    "codex executed",
    "codex execution completed",
    "core decided",
    "core decision made",
    "created proof",
    "created evidence",
    "created readiness",
    "proof record created",
    "evidence record created",
    "readiness record created",
    "may approve",
    "may merge",
    "may mutate github",
    "may execute codex",
    "may make core decision",
  ];

  return patterns.some((pattern) => lowered.includes(pattern));
}

function matchesSourcePacketRef(
  draft: Partial<CodexPerspectiveCandidateDraftV0>,
  formerInputPacket: CodexPerspectiveFormerInputPacketV0,
): boolean {
  const sourceRef = draft.source_former_input_packet;
  if (!isRecord(sourceRef)) return false;

  return (
    sourceRef.packet_version === formerInputPacket.packet_version &&
    sourceRef.packet_id === formerInputPacket.packet_id &&
    sourceRef.role === formerInputPacket.role
  );
}

function buildBlockedResult({
  blockedReasons,
  warnings,
  omittedUnsafeFields,
}: {
  blockedReasons: readonly string[];
  warnings: readonly CodexPerspectiveDraftValidationWarningV0[];
  omittedUnsafeFields: Set<string>;
}): CodexPerspectiveDraftValidationResultV0 {
  return {
    validation_version: "codex_perspective_candidate_draft_validation.v0.1",
    validation_kind: "codex_perspective_candidate_draft_validation",
    status: "blocked",
    candidate_review_material: null,
    blocked_reasons: [...blockedReasons],
    warnings: [...warnings],
    privacy: {
      raw_payloads_included: false,
      unsafe_input_material_omitted: omittedUnsafeFields.size > 0,
      omitted_unsafe_fields: [...omittedUnsafeFields].sort(),
    },
    authority_flags: buildFalseAuthorityFlags(),
  };
}

function buildFalseAuthorityFlags(): CodexPerspectiveDraftValidationResultV0["authority_flags"] {
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

function countCheckStatuses(
  checks: readonly PerspectiveFormationCheckRunInputV0[],
): PerspectiveCandidateV0["verification_summary"]["check_statuses"] {
  return checks.reduce(
    (counts, check) => ({
      passed: counts.passed + (check.status === "passed" ? 1 : 0),
      failed: counts.failed + (check.status === "failed" ? 1 : 0),
    }),
    { passed: 0, failed: 0 },
  );
}

function buildCandidateId({
  formerInputPacket,
  thesis,
}: {
  formerInputPacket: CodexPerspectiveFormerInputPacketV0;
  thesis: string;
}): string {
  const sourceBundle = formerInputPacket.source_formation_input_bundle;
  const anchor = [
    formerInputPacket.packet_id,
    sourceBundle.scope ?? "missing_scope",
    sourceBundle.work_id ?? "missing_work",
    thesis,
  ].join("|");

  return `codex-perspective-candidate-review:v0.1:${slugify(anchor)}:${stableHash(anchor)}`;
}

function normalizeTensionKind(
  value: string,
): PerspectiveCandidateUnresolvedTensionV0["tension_kind"] {
  if (value === "unresolved_gap") return "unresolved_gap";
  if (value === "failed_check") return "failed_check";
  if (value === "skipped_check_missing_reason") {
    return "skipped_check_missing_reason";
  }
  return "readiness_reason";
}

function dedupePointers(
  pointers: readonly PerspectiveCandidateEvidencePointerV0[],
): PerspectiveCandidateEvidencePointerV0[] {
  const seen = new Set<string>();
  const deduped: PerspectiveCandidateEvidencePointerV0[] = [];

  for (const pointer of pointers) {
    const key = `${pointer.pointer_kind}|${pointer.ref}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(pointer);
    }
  }

  return deduped;
}

function dedupeTensions(
  tensions: readonly PerspectiveCandidateUnresolvedTensionV0[],
): PerspectiveCandidateUnresolvedTensionV0[] {
  const seen = new Set<string>();
  const deduped: PerspectiveCandidateUnresolvedTensionV0[] = [];

  for (const tension of tensions) {
    const key = `${tension.tension_kind}|${tension.summary}|${tension.source_ref ?? ""}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(tension);
    }
  }

  return deduped;
}

function dedupeNextActions(
  actions: readonly PerspectiveCandidateNextActionV0[],
): PerspectiveCandidateNextActionV0[] {
  const seen = new Set<string>();
  const deduped: PerspectiveCandidateNextActionV0[] = [];

  for (const action of actions) {
    if (!seen.has(action.action_id)) {
      seen.add(action.action_id);
      deduped.push(action);
    }
  }

  return deduped;
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

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "missing-anchor"
  );
}

function stableHash(value: string): string {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash.toString(36);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function hasText(value: string | null | undefined): boolean {
  return Boolean(value && value.trim());
}
