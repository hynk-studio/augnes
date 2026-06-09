import type {
  PerspectiveFormationCheckRunInputV0,
  PerspectiveFormationGapInputV0,
  PerspectiveFormationInputBundleV0,
  PerspectiveFormationSkippedCheckInputV0,
} from "@/lib/perspective-ingest/perspective-formation-input-bundle";
import type {
  PerspectiveCandidateEvidencePointerV0,
  PerspectiveCandidateEvidencePointerKindV0,
} from "@/lib/perspective-ingest/perspective-candidate-builder";

export type CodexPerspectiveFormerInputPacketVersionV0 =
  "codex_perspective_former_input_packet.v0.1";
export type CodexPerspectiveFormerInputPacketKindV0 =
  "codex_perspective_former_input_packet";
export type CodexPerspectiveFormerRoleV0 = "codex_perspective_former";

export interface CodexPerspectiveFormerInputPacketV0 {
  packet_version: CodexPerspectiveFormerInputPacketVersionV0;
  packet_kind: CodexPerspectiveFormerInputPacketKindV0;
  packet_id: string;
  role: CodexPerspectiveFormerRoleV0;
  source_formation_input_bundle: PerspectiveFormationInputBundleV0;
  bounded_material: {
    changed_files_summary: string | null;
    changed_files: string[];
    verification_basis: {
      checks_run: PerspectiveFormationCheckRunInputV0[];
      skipped_checks: PerspectiveFormationSkippedCheckInputV0[];
    };
    unresolved_gaps: PerspectiveFormationGapInputV0[];
    authority_boundaries: string[];
    source_privacy_redaction_notes: string[];
  };
  pointer_refs: PerspectiveCandidateEvidencePointerV0[];
  expected_output_contract: {
    draft_version: "codex_perspective_candidate_draft.v0.1";
    draft_kind: "codex_perspective_candidate_draft";
    required_fields: string[];
    output_is_draft_only: true;
    must_use_pointer_only_refs: true;
    must_preserve_unresolved_tensions: true;
    must_preserve_qualification_notes: true;
  };
  authority_constraints: {
    may_form_perspective_draft: true;
    committed_state: false;
    persistence: false;
    provider_model_api_calls: false;
    proof_evidence_readiness_writes: false;
    codex_execution: false;
    github_mutation: false;
    merge_publish_approval: false;
    core_decision: false;
    forbidden_actions: string[];
  };
  privacy_constraints: {
    bounded_summaries_and_pointer_refs_only: true;
    raw_payloads_included: false;
    unsafe_input_material_omitted: boolean;
    omitted_unsafe_fields: string[];
    forbidden_material_summary: string[];
  };
  copyable_former_input_text: string;
}

export function buildCodexPerspectiveFormerInputPacket(
  bundle: PerspectiveFormationInputBundleV0,
): CodexPerspectiveFormerInputPacketV0 {
  const omittedUnsafeFields = new Set<string>();
  const sourceBundle = sanitizeFormationInputBundle(
    bundle,
    omittedUnsafeFields,
  );
  const pointerRefs = buildPointerRefs(sourceBundle);
  const packetId = buildPacketId(sourceBundle);

  return {
    packet_version: "codex_perspective_former_input_packet.v0.1",
    packet_kind: "codex_perspective_former_input_packet",
    packet_id: packetId,
    role: "codex_perspective_former",
    source_formation_input_bundle: sourceBundle,
    bounded_material: {
      changed_files_summary: sourceBundle.changed_files_summary,
      changed_files: [...sourceBundle.changed_files],
      verification_basis: {
        checks_run: copyChecks(sourceBundle.verification_basis.checks_run),
        skipped_checks: copySkippedChecks(
          sourceBundle.verification_basis.skipped_checks,
        ),
      },
      unresolved_gaps: copyGaps(sourceBundle.unresolved_gaps),
      authority_boundaries: [...sourceBundle.authority_boundaries],
      source_privacy_redaction_notes: [
        ...sourceBundle.privacy.source_privacy_redaction_notes,
      ],
    },
    pointer_refs: pointerRefs,
    expected_output_contract: {
      draft_version: "codex_perspective_candidate_draft.v0.1",
      draft_kind: "codex_perspective_candidate_draft",
      required_fields: [
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
      ],
      output_is_draft_only: true,
      must_use_pointer_only_refs: true,
      must_preserve_unresolved_tensions: true,
      must_preserve_qualification_notes: true,
    },
    authority_constraints: {
      may_form_perspective_draft: true,
      committed_state: false,
      persistence: false,
      provider_model_api_calls: false,
      proof_evidence_readiness_writes: false,
      codex_execution: false,
      github_mutation: false,
      merge_publish_approval: false,
      core_decision: false,
      forbidden_actions: [
        "do not create committed Perspective Candidate state",
        "do not write proof, evidence, or readiness records",
        "do not approve, merge, publish, retry, replay, or deploy",
        "do not mutate GitHub",
        "do not execute Codex or call provider/model APIs",
        "do not make Core decisions",
      ],
    },
    privacy_constraints: {
      bounded_summaries_and_pointer_refs_only: true,
      raw_payloads_included: false,
      unsafe_input_material_omitted: omittedUnsafeFields.size > 0,
      omitted_unsafe_fields: [...omittedUnsafeFields].sort(),
      forbidden_material_summary: [
        "raw diffs and raw review/source/candidate material",
        "private, provider, token, billing, and credential material",
        "hidden reasoning and generated model raw material",
      ],
    },
    copyable_former_input_text: buildCopyableFormerInputText({
      packetId,
      sourceBundle,
      pointerRefs,
    }),
  };
}

export function containsUnsafeCodexPerspectiveMaterial(
  value: string,
): boolean {
  const lowered = value.toLowerCase();
  const unsafeMarkers = [
    "billing_payload",
    "token_payload",
    "oauth_payload",
    "raw_pasted_text",
    "raw_source_payload",
    "raw_candidate_payload",
    "raw_private_payload",
    "private_payload",
    "provider_payload",
    "oauth_token",
    "access_token",
    "refresh_token",
    "api_key",
    "hidden_reasoning",
    "generated_model_payload",
    "sk-proj-",
    "ghp_",
    "gho_",
    "ghu_",
    "ghs_",
    "ghr_",
  ];

  return (
    unsafeMarkers.some((marker) => lowered.includes(marker)) ||
    /\bsecret\b/i.test(value)
  );
}

export function sanitizeCodexPerspectiveText(
  value: string | null | undefined,
  fieldName: string,
  omittedUnsafeFields: Set<string>,
): string | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (containsUnsafeCodexPerspectiveMaterial(trimmed)) {
    omittedUnsafeFields.add(fieldName);
    return null;
  }

  return trimmed;
}

export function copySafeCodexPerspectiveTextList(
  values: readonly string[] | undefined,
  fieldName: string,
  omittedUnsafeFields: Set<string>,
): string[] {
  const safeValues: string[] = [];

  values?.forEach((value, index) => {
    const safeValue = sanitizeCodexPerspectiveText(
      value,
      `${fieldName}[${index}]`,
      omittedUnsafeFields,
    );

    if (safeValue) {
      safeValues.push(safeValue);
    }
  });

  return uniqueTextList(safeValues);
}

function sanitizeFormationInputBundle(
  bundle: PerspectiveFormationInputBundleV0,
  omittedUnsafeFields: Set<string>,
): PerspectiveFormationInputBundleV0 {
  return {
    bundle_version: bundle.bundle_version,
    bundle_kind: bundle.bundle_kind,
    generated_at: sanitizeCodexPerspectiveText(
      bundle.generated_at,
      "source_formation_input_bundle.generated_at",
      omittedUnsafeFields,
    ),
    scope: sanitizeCodexPerspectiveText(
      bundle.scope,
      "source_formation_input_bundle.scope",
      omittedUnsafeFields,
    ),
    work_id: sanitizeCodexPerspectiveText(
      bundle.work_id,
      "source_formation_input_bundle.work_id",
      omittedUnsafeFields,
    ),
    source_pr_refs: copySafeCodexPerspectiveTextList(
      bundle.source_pr_refs,
      "source_formation_input_bundle.source_pr_refs",
      omittedUnsafeFields,
    ),
    changed_files_summary: sanitizeCodexPerspectiveText(
      bundle.changed_files_summary,
      "source_formation_input_bundle.changed_files_summary",
      omittedUnsafeFields,
    ),
    changed_files: copySafeCodexPerspectiveTextList(
      bundle.changed_files,
      "source_formation_input_bundle.changed_files",
      omittedUnsafeFields,
    ),
    verification_basis: {
      checks_run: bundle.verification_basis.checks_run.map((check, index) => ({
        check_id:
          sanitizeCodexPerspectiveText(
            check.check_id,
            `source_formation_input_bundle.verification_basis.checks_run[${index}].check_id`,
            omittedUnsafeFields,
          ) ?? `omitted-check-${index}`,
        command:
          sanitizeCodexPerspectiveText(
            check.command,
            `source_formation_input_bundle.verification_basis.checks_run[${index}].command`,
            omittedUnsafeFields,
          ) ?? "omitted unsafe check command",
        status: check.status,
        result_summary:
          sanitizeCodexPerspectiveText(
            check.result_summary,
            `source_formation_input_bundle.verification_basis.checks_run[${index}].result_summary`,
            omittedUnsafeFields,
          ) ?? "Unsafe check result detail omitted.",
      })),
      skipped_checks: bundle.verification_basis.skipped_checks.map(
        (check, index) => ({
          check_id:
            sanitizeCodexPerspectiveText(
              check.check_id,
              `source_formation_input_bundle.verification_basis.skipped_checks[${index}].check_id`,
              omittedUnsafeFields,
            ) ?? `omitted-skipped-check-${index}`,
          skipped_reason:
            sanitizeCodexPerspectiveText(
              check.skipped_reason,
              `source_formation_input_bundle.verification_basis.skipped_checks[${index}].skipped_reason`,
              omittedUnsafeFields,
            ) ?? "",
          ...(check.result_summary !== undefined
            ? {
                result_summary:
                  sanitizeCodexPerspectiveText(
                    check.result_summary,
                    `source_formation_input_bundle.verification_basis.skipped_checks[${index}].result_summary`,
                    omittedUnsafeFields,
                  ) ?? "Unsafe skipped-check result detail omitted.",
              }
            : {}),
        }),
      ),
      evidence_row_refs: copySafeCodexPerspectiveTextList(
        bundle.verification_basis.evidence_row_refs,
        "source_formation_input_bundle.verification_basis.evidence_row_refs",
        omittedUnsafeFields,
      ),
      proof_only_action_refs: copySafeCodexPerspectiveTextList(
        bundle.verification_basis.proof_only_action_refs,
        "source_formation_input_bundle.verification_basis.proof_only_action_refs",
        omittedUnsafeFields,
      ),
    },
    trace_basis: {
      work_event_refs: copySafeCodexPerspectiveTextList(
        bundle.trace_basis.work_event_refs,
        "source_formation_input_bundle.trace_basis.work_event_refs",
        omittedUnsafeFields,
      ),
      session_trace_refs: copySafeCodexPerspectiveTextList(
        bundle.trace_basis.session_trace_refs,
        "source_formation_input_bundle.trace_basis.session_trace_refs",
        omittedUnsafeFields,
      ),
    },
    perspective_basis: {
      existing_perspective_refs: copySafeCodexPerspectiveTextList(
        bundle.perspective_basis.existing_perspective_refs,
        "source_formation_input_bundle.perspective_basis.existing_perspective_refs",
        omittedUnsafeFields,
      ),
    },
    unresolved_gaps: bundle.unresolved_gaps.map((gap, index) => ({
      gap_id:
        sanitizeCodexPerspectiveText(
          gap.gap_id,
          `source_formation_input_bundle.unresolved_gaps[${index}].gap_id`,
          omittedUnsafeFields,
        ) ?? `omitted-gap-${index}`,
      summary:
        sanitizeCodexPerspectiveText(
          gap.summary,
          `source_formation_input_bundle.unresolved_gaps[${index}].summary`,
          omittedUnsafeFields,
        ) ?? "Unsafe unresolved-gap detail omitted.",
    })),
    readiness: {
      status: bundle.readiness.status,
      reasons: copySafeCodexPerspectiveTextList(
        bundle.readiness.reasons,
        "source_formation_input_bundle.readiness.reasons",
        omittedUnsafeFields,
      ),
    },
    privacy: {
      source_privacy_redaction_notes: copySafeCodexPerspectiveTextList(
        bundle.privacy.source_privacy_redaction_notes,
        "source_formation_input_bundle.privacy.source_privacy_redaction_notes",
        omittedUnsafeFields,
      ),
      raw_payloads_included: false,
    },
    authority: {
      mode: "read_only_formation_input",
      committed_state: false,
      persistence: false,
      provider_model_api_calls: false,
      proof_evidence_readiness_writes: false,
      codex_execution: false,
      merge_publish_approval: false,
    },
    authority_boundaries: copySafeCodexPerspectiveTextList(
      bundle.authority_boundaries,
      "source_formation_input_bundle.authority_boundaries",
      omittedUnsafeFields,
    ),
  };
}

function buildPointerRefs(
  bundle: PerspectiveFormationInputBundleV0,
): PerspectiveCandidateEvidencePointerV0[] {
  return [
    ...buildPointerList(
      "evidence_row_ref",
      bundle.verification_basis.evidence_row_refs,
    ),
    ...buildPointerList(
      "proof_only_action_ref",
      bundle.verification_basis.proof_only_action_refs,
    ),
    ...buildPointerList("work_event_ref", bundle.trace_basis.work_event_refs),
    ...buildPointerList("session_trace_ref", bundle.trace_basis.session_trace_refs),
    ...buildPointerList(
      "perspective_ref",
      bundle.perspective_basis.existing_perspective_refs,
    ),
  ];
}

function buildPointerList(
  pointerKind: PerspectiveCandidateEvidencePointerKindV0,
  refs: readonly string[],
): PerspectiveCandidateEvidencePointerV0[] {
  return refs
    .filter(hasText)
    .map((ref) => ({
      pointer_kind: pointerKind,
      pointer_semantics: "pointer_only",
      ref,
    }));
}

function buildPacketId(bundle: PerspectiveFormationInputBundleV0): string {
  const anchor = [
    bundle.scope ?? "missing_scope",
    bundle.work_id ?? "missing_work",
    ...bundle.source_pr_refs,
  ].join("|");

  return `codex-perspective-former-input:v0.1:${slugify(anchor)}:${stableHash(anchor)}`;
}

function buildCopyableFormerInputText({
  packetId,
  sourceBundle,
  pointerRefs,
}: {
  packetId: string;
  sourceBundle: PerspectiveFormationInputBundleV0;
  pointerRefs: readonly PerspectiveCandidateEvidencePointerV0[];
}): string {
  const lines = [
    "Role: codex_perspective_former",
    `Packet: ${packetId}`,
    `Source bundle: ${sourceBundle.bundle_version}`,
    `Scope: ${sourceBundle.scope ?? "missing"}`,
    `Work: ${sourceBundle.work_id ?? "missing"}`,
    `Source PR refs: ${
      sourceBundle.source_pr_refs.length > 0
        ? sourceBundle.source_pr_refs.join(", ")
        : "none"
    }`,
    `Readiness: ${sourceBundle.readiness.status}`,
    `Changed files summary: ${
      sourceBundle.changed_files_summary ?? "missing"
    }`,
    `Pointer refs: ${pointerRefs.length}`,
    "Expected output: codex_perspective_candidate_draft.v0.1 only.",
    "Authority: draft review material only; no writes, API calls, GitHub mutation, approval, merge, deployment, Codex execution, or Core decision.",
    "Privacy: use bounded summaries and pointer-only refs only; omit raw, private, provider, token, billing, credential, hidden-reasoning, and generated raw model material.",
  ];

  return lines.join("\n");
}

function copyChecks(
  checks: readonly PerspectiveFormationCheckRunInputV0[],
): PerspectiveFormationCheckRunInputV0[] {
  return checks.map((check) => ({
    check_id: check.check_id,
    command: check.command,
    status: check.status,
    result_summary: check.result_summary,
  }));
}

function copySkippedChecks(
  skippedChecks: readonly PerspectiveFormationSkippedCheckInputV0[],
): PerspectiveFormationSkippedCheckInputV0[] {
  return skippedChecks.map((check) => ({
    check_id: check.check_id,
    skipped_reason: check.skipped_reason,
    ...(check.result_summary !== undefined
      ? { result_summary: check.result_summary }
      : {}),
  }));
}

function copyGaps(
  gaps: readonly PerspectiveFormationGapInputV0[],
): PerspectiveFormationGapInputV0[] {
  return gaps.map((gap) => ({
    gap_id: gap.gap_id,
    summary: gap.summary,
  }));
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

function hasText(value: string | null | undefined): boolean {
  return Boolean(value && value.trim());
}
