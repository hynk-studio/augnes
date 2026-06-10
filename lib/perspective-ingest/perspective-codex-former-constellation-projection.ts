import { sanitizeCodexPerspectiveText } from "@/lib/perspective-ingest/perspective-codex-former-input-packet";

export type CodexFormerConstellationProjectionVersionV0 =
  "codex_former_constellation_projection.v0.1";
export type CodexFormerConstellationProjectionKindV0 =
  "codex_former_constellation_projection";

export type CodexFormerConstellationNodeKindV0 =
  | "work"
  | "source_input"
  | "manual_copy_packet"
  | "codex_session"
  | "candidate_draft"
  | "validation_summary"
  | "review_candidate"
  | "warning"
  | "worker_guidance"
  | "next_action";

export type CodexFormerConstellationNodeStatusV0 =
  | "raw"
  | "prepared"
  | "returned"
  | "validated"
  | "needs_review"
  | "blocked"
  | "review_only"
  | "accepted_future_only";

export type CodexFormerConstellationAuthorityV0 =
  | "review_only"
  | "non_committed"
  | "advisory_only"
  | "pointer_only"
  | "blocked"
  | "accepted_future_only";

export type CodexFormerConstellationEdgeRelationV0 =
  | "prepared"
  | "pasted_by_human"
  | "returned"
  | "validated"
  | "informs"
  | "suggests"
  | "pointer_only"
  | "blocked_by";

export type CodexFormerConstellationEdgeStatusV0 =
  | "raw"
  | "prepared"
  | "returned"
  | "validated"
  | "needs_review"
  | "blocked"
  | "review_only";

export type CodexFormerConstellationEdgeAuthorityBoundaryV0 =
  | "review_only"
  | "non_committing"
  | "advisory_only"
  | "pointer_only"
  | "blocked";

export type CodexFormerConstellationConclusionV0 =
  | "PASS"
  | "PASS with follow-up"
  | "BLOCKED with useful findings";

export type CodexFormerConstellationOverallStatusV0 =
  | "pass"
  | "pass_with_follow_up"
  | "blocked";

export interface CodexFormerConstellationNodeV0 {
  id: string;
  node_kind: CodexFormerConstellationNodeKindV0;
  title: string;
  status: CodexFormerConstellationNodeStatusV0;
  authority: CodexFormerConstellationAuthorityV0;
  primary_badges: string[];
  warning_count: number;
  provenance_refs: string[];
  detail_refs: string[];
}

export interface CodexFormerConstellationEdgeV0 {
  id: string;
  from: string;
  to: string;
  relation: CodexFormerConstellationEdgeRelationV0;
  status: CodexFormerConstellationEdgeStatusV0;
  authority_boundary: CodexFormerConstellationEdgeAuthorityBoundaryV0;
  warning_count: number;
  provenance_refs: string[];
}

export interface CodexFormerConstellationProjectionV0 {
  projection_version: CodexFormerConstellationProjectionVersionV0;
  projection_kind: CodexFormerConstellationProjectionKindV0;
  generated_at: string | null;
  source: {
    capture_source_kind: string;
    source_input_hash?: string;
    source_prompt_hash?: string;
    metadata_match: boolean;
    candidate_count: number;
  };
  nodes: CodexFormerConstellationNodeV0[];
  edges: CodexFormerConstellationEdgeV0[];
  status_summary: {
    conclusion: CodexFormerConstellationConclusionV0;
    overall_status: CodexFormerConstellationOverallStatusV0;
    candidate_count: number;
    metadata_match: boolean;
    direct_validation_status: string;
    candidate_basis_quality: string;
  };
  warning_summary: {
    warning_count: number;
    pointer_warning_count: number;
    warnings: string[];
    blocked_reasons: string[];
  };
  authority_summary: {
    review_only: true;
    non_committed_candidate: boolean;
    accepted_state_created: false;
    proof_evidence_readiness_created: false;
    provider_model_calls: false;
    codex_sdk_calls: false;
    github_mutation: false;
    db_writes: false;
    ui_implemented: false;
    core_decision: false;
  };
  privacy: {
    raw_payloads_included: false;
    bounded_summaries_only: true;
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

export interface BuildCodexFormerConstellationProjectionInputV0 {
  generated_at?: string | null;
  capture_source_kind: string;
  source_input_hash?: string | null;
  source_prompt_hash?: string | null;
  metadata_match: boolean;
  candidate_count: number;
  conclusion: CodexFormerConstellationConclusionV0;
  direct_validation_status: string;
  candidate_authority: "non_committed" | "none" | string;
  candidate_basis_quality:
    | "sufficient_for_review"
    | "needs_review"
    | "blocked"
    | "none"
    | string;
  pointer_warning_count: number;
  warning_summary: string[];
  blocked_reasons: string[];
  source_pr_refs?: string[];
  changed_files?: string[];
  next_action_summaries?: string[];
}

interface WarningProjectionItem {
  id: string;
  summary: string;
  status: "needs_review" | "blocked";
  authority: "advisory_only" | "blocked";
  relation: "pointer_only" | "blocked_by";
}

export function buildCodexFormerConstellationProjection(
  input: BuildCodexFormerConstellationProjectionInputV0,
): CodexFormerConstellationProjectionV0 {
  const omittedUnsafeFields = new Set<string>();
  const overallStatus = deriveOverallStatus(input.conclusion);
  const candidateCount = normalizeCount(input.candidate_count);
  const pointerWarningCount = normalizeCount(input.pointer_warning_count);
  const generatedAt =
    sanitizeProjectionText(
      input.generated_at,
      "projection.generated_at",
      omittedUnsafeFields,
    ) ?? null;
  const captureSourceKind =
    sanitizeProjectionText(
      input.capture_source_kind,
      "projection.capture_source_kind",
      omittedUnsafeFields,
    ) ?? "unspecified_capture_source";
  const sourceInputHash = sanitizeOptionalText(
    input.source_input_hash,
    "projection.source_input_hash",
    omittedUnsafeFields,
  );
  const sourcePromptHash = sanitizeOptionalText(
    input.source_prompt_hash,
    "projection.source_prompt_hash",
    omittedUnsafeFields,
  );
  const directValidationStatus =
    sanitizeProjectionText(
      input.direct_validation_status,
      "projection.direct_validation_status",
      omittedUnsafeFields,
    ) ?? "unknown";
  const candidateBasisQuality =
    sanitizeProjectionText(
      input.candidate_basis_quality,
      "projection.candidate_basis_quality",
      omittedUnsafeFields,
    ) ?? "none";
  const warnings = copySafeProjectionTextList(
    input.warning_summary,
    "projection.warning_summary",
    omittedUnsafeFields,
  );
  const blockedReasons = copySafeProjectionTextList(
    input.blocked_reasons,
    "projection.blocked_reasons",
    omittedUnsafeFields,
  );
  const sourcePrRefs = copySafeProjectionTextList(
    input.source_pr_refs,
    "projection.source_pr_refs",
    omittedUnsafeFields,
  );
  const changedFiles = copySafeProjectionTextList(
    input.changed_files,
    "projection.changed_files",
    omittedUnsafeFields,
  );
  const nextActions = copySafeProjectionTextList(
    input.next_action_summaries,
    "projection.next_action_summaries",
    omittedUnsafeFields,
  );

  const warningItems = buildWarningItems({
    overallStatus,
    pointerWarningCount,
    warnings,
    blockedReasons,
  });
  const candidateCompatible = isCandidateCompatible({
    input,
    overallStatus,
    directValidationStatus,
    candidateBasisQuality,
    candidateCount,
  });
  const hasWarningPressure = warningItems.length > 0 || pointerWarningCount > 0;
  const reviewCandidateStatus: CodexFormerConstellationNodeStatusV0 =
    candidateBasisQuality === "needs_review" || hasWarningPressure
      ? "needs_review"
      : "review_only";
  const validationStatus: CodexFormerConstellationNodeStatusV0 =
    overallStatus === "blocked"
      ? "blocked"
      : hasWarningPressure || candidateBasisQuality === "needs_review"
        ? "needs_review"
        : "validated";

  const nodes: CodexFormerConstellationNodeV0[] = [];
  const edges: CodexFormerConstellationEdgeV0[] = [];

  if (sourcePrRefs.length > 0 || changedFiles.length > 0) {
    nodes.push(
      buildNode({
        id: "node:work",
        node_kind: "work",
        title: "Source work",
        status: overallStatus === "blocked" ? "review_only" : "prepared",
        authority: "pointer_only",
        primary_badges: ["pointer-only", "review-only"],
        warning_count: 0,
        provenance_refs: sourcePrRefs,
        detail_refs: changedFiles,
        omittedUnsafeFields,
      }),
    );
  }

  nodes.push(
    buildNode({
      id: "node:source_input",
      node_kind: "source_input",
      title: "Source input",
      status: overallStatus === "blocked" ? "blocked" : "prepared",
      authority: overallStatus === "blocked" ? "blocked" : "non_committed",
      primary_badges:
        overallStatus === "blocked"
          ? ["blocked", "review-only"]
          : ["review-only", "non-committed"],
      warning_count: overallStatus === "blocked" ? warningItems.length : 0,
      provenance_refs: compactTextList([
        captureSourceKind,
        ...sourcePrRefs,
      ]),
      detail_refs: compactTextList([
        sourceInputHash ? `source_input_hash:${sourceInputHash}` : null,
        ...changedFiles,
      ]),
      omittedUnsafeFields,
    }),
    buildNode({
      id: "node:manual_copy_packet",
      node_kind: "manual_copy_packet",
      title: "Manual copy packet",
      status: "prepared",
      authority: "pointer_only",
      primary_badges: ["pointer-only", "review-only"],
      warning_count: 0,
      provenance_refs: compactTextList([
        sourcePromptHash ? `source_prompt_hash:${sourcePromptHash}` : null,
      ]),
      detail_refs: [],
      omittedUnsafeFields,
    }),
    buildNode({
      id: "node:codex_session",
      node_kind: "codex_session",
      title: "Separate Codex session",
      status: "returned",
      authority: "review_only",
      primary_badges: ["review-only"],
      warning_count: 0,
      provenance_refs: ["human_manual_paste"],
      detail_refs: [],
      omittedUnsafeFields,
    }),
  );

  if (overallStatus !== "blocked" || candidateCount > 0) {
    nodes.push(
      buildNode({
        id: "node:candidate_draft",
        node_kind: "candidate_draft",
        title: "Candidate draft",
        status: overallStatus === "blocked" ? "blocked" : "returned",
        authority: overallStatus === "blocked" ? "blocked" : "non_committed",
        primary_badges:
          overallStatus === "blocked"
            ? ["blocked"]
            : ["review-only", "non-committed"],
        warning_count: warningItems.length,
        provenance_refs: [`candidate_count:${candidateCount}`],
        detail_refs: [],
        omittedUnsafeFields,
      }),
    );
  }

  nodes.push(
    buildNode({
      id: "node:validation_summary",
      node_kind: "validation_summary",
      title: "Validation summary",
      status: validationStatus,
      authority: overallStatus === "blocked" ? "blocked" : "review_only",
      primary_badges:
        overallStatus === "blocked"
          ? ["blocked"]
          : validationStatus === "needs_review"
            ? ["needs_review", "review-only"]
            : ["review-only"],
      warning_count: warningItems.length,
      provenance_refs: [
        `direct_validation_status:${directValidationStatus}`,
        `metadata_match:${input.metadata_match}`,
      ],
      detail_refs: [`candidate_basis_quality:${candidateBasisQuality}`],
      omittedUnsafeFields,
    }),
  );

  for (const warningItem of warningItems) {
    nodes.push(
      buildNode({
        id: warningItem.id,
        node_kind: "warning",
        title:
          warningItem.status === "blocked"
            ? "Blocking validation caveat"
            : "Review warning",
        status: warningItem.status,
        authority: warningItem.authority,
        primary_badges:
          warningItem.status === "blocked"
            ? ["blocked"]
            : ["needs_review", "pointer_warning"],
        warning_count: 1,
        provenance_refs: [],
        detail_refs: [warningItem.summary],
        omittedUnsafeFields,
      }),
    );
  }

  if (candidateCompatible) {
    nodes.push(
      buildNode({
        id: "node:review_candidate",
        node_kind: "review_candidate",
        title: "Review candidate",
        status: reviewCandidateStatus,
        authority: "non_committed",
        primary_badges:
          reviewCandidateStatus === "needs_review"
            ? ["needs_review", "non-committed"]
            : ["review-only", "non-committed"],
        warning_count: warningItems.length,
        provenance_refs: ["candidate_authority:non_committed"],
        detail_refs: [],
        omittedUnsafeFields,
      }),
      buildNode({
        id: "node:worker_guidance",
        node_kind: "worker_guidance",
        title: "Worker guidance",
        status: reviewCandidateStatus,
        authority: "advisory_only",
        primary_badges: ["advisory-only", "review-only"],
        warning_count: warningItems.length,
        provenance_refs: ["derived_after_validation"],
        detail_refs: [],
        omittedUnsafeFields,
      }),
    );

    nextActions.forEach((summary, index) => {
      nodes.push(
        buildNode({
          id: `node:next_action:${index + 1}`,
          node_kind: "next_action",
          title: `Next action ${index + 1}`,
          status: reviewCandidateStatus,
          authority: "advisory_only",
          primary_badges: ["advisory-only", "review-only"],
          warning_count: 0,
          provenance_refs: ["worker_guidance"],
          detail_refs: [summary],
          omittedUnsafeFields,
        }),
      );
    });
  }

  if (hasNode(nodes, "node:work")) {
    edges.push(
      buildEdge({
        from: "node:work",
        to: "node:source_input",
        relation: "informs",
        status: "review_only",
        authority_boundary: "pointer_only",
        warning_count: 0,
        provenance_refs: sourcePrRefs,
      }),
    );
  }

  edges.push(
    buildEdge({
      from: "node:source_input",
      to: "node:manual_copy_packet",
      relation: "prepared",
      status: "prepared",
      authority_boundary: "non_committing",
      warning_count: 0,
      provenance_refs: compactTextList([sourceInputHash]),
    }),
    buildEdge({
      from: "node:manual_copy_packet",
      to: "node:codex_session",
      relation: "pasted_by_human",
      status: "review_only",
      authority_boundary: "pointer_only",
      warning_count: 0,
      provenance_refs: compactTextList([sourcePromptHash]),
    }),
  );

  if (hasNode(nodes, "node:candidate_draft")) {
    edges.push(
      buildEdge({
        from: "node:codex_session",
        to: "node:candidate_draft",
        relation: "returned",
        status: "returned",
        authority_boundary:
          overallStatus === "blocked" ? "blocked" : "review_only",
        warning_count: warningItems.length,
        provenance_refs: [`candidate_count:${candidateCount}`],
      }),
      buildEdge({
        from: "node:candidate_draft",
        to: "node:validation_summary",
        relation: "validated",
        status: overallStatus === "blocked" ? "blocked" : validationStatus,
        authority_boundary:
          overallStatus === "blocked" ? "blocked" : "review_only",
        warning_count: warningItems.length,
        provenance_refs: [directValidationStatus],
      }),
    );
  }

  if (candidateCompatible) {
    edges.push(
      buildEdge({
        from: "node:validation_summary",
        to: "node:review_candidate",
        relation: "informs",
        status: reviewCandidateStatus,
        authority_boundary: "review_only",
        warning_count: warningItems.length,
        provenance_refs: [candidateBasisQuality],
      }),
    );

    for (const warningItem of warningItems) {
      edges.push(
        buildEdge({
          from: warningItem.id,
          to: "node:review_candidate",
          relation: "pointer_only",
          status: warningItem.status,
          authority_boundary:
            warningItem.status === "blocked" ? "blocked" : "pointer_only",
          warning_count: 1,
          provenance_refs: [],
        }),
      );
    }

    edges.push(
      buildEdge({
        from: "node:review_candidate",
        to: "node:worker_guidance",
        relation: "informs",
        status: reviewCandidateStatus,
        authority_boundary: "advisory_only",
        warning_count: warningItems.length,
        provenance_refs: [],
      }),
    );

    nextActions.forEach((_, index) => {
      edges.push(
        buildEdge({
          from: "node:worker_guidance",
          to: `node:next_action:${index + 1}`,
          relation: "suggests",
          status: reviewCandidateStatus,
          authority_boundary: "advisory_only",
          warning_count: 0,
          provenance_refs: [],
        }),
      );
    });
  } else if (overallStatus === "blocked") {
    for (const warningItem of warningItems) {
      edges.push(
        buildEdge({
          from: warningItem.id,
          to: "node:validation_summary",
          relation: "blocked_by",
          status: "blocked",
          authority_boundary: "blocked",
          warning_count: 1,
          provenance_refs: [],
        }),
      );
    }
  }

  const nonCommittedCandidate = candidateCompatible;
  const warningCount =
    warningItems.length +
    Math.max(0, pointerWarningCount - countPointerWarningItems(warningItems));

  return {
    projection_version: "codex_former_constellation_projection.v0.1",
    projection_kind: "codex_former_constellation_projection",
    generated_at: generatedAt,
    source: {
      capture_source_kind: captureSourceKind,
      ...(sourceInputHash ? { source_input_hash: sourceInputHash } : {}),
      ...(sourcePromptHash ? { source_prompt_hash: sourcePromptHash } : {}),
      metadata_match: input.metadata_match,
      candidate_count: candidateCount,
    },
    nodes,
    edges,
    status_summary: {
      conclusion: input.conclusion,
      overall_status: overallStatus,
      candidate_count: candidateCount,
      metadata_match: input.metadata_match,
      direct_validation_status: directValidationStatus,
      candidate_basis_quality: candidateBasisQuality,
    },
    warning_summary: {
      warning_count: warningCount,
      pointer_warning_count: pointerWarningCount,
      warnings,
      blocked_reasons: blockedReasons,
    },
    authority_summary: {
      review_only: true,
      non_committed_candidate: nonCommittedCandidate,
      accepted_state_created: false,
      proof_evidence_readiness_created: false,
      provider_model_calls: false,
      codex_sdk_calls: false,
      github_mutation: false,
      db_writes: false,
      ui_implemented: false,
      core_decision: false,
    },
    privacy: {
      raw_payloads_included: false,
      bounded_summaries_only: true,
      unsafe_input_material_omitted: omittedUnsafeFields.size > 0,
      omitted_unsafe_fields: [...omittedUnsafeFields].sort(),
    },
    authority_flags: buildFalseAuthorityFlags(),
  };
}

function deriveOverallStatus(
  conclusion: CodexFormerConstellationConclusionV0,
): CodexFormerConstellationOverallStatusV0 {
  if (conclusion === "PASS") return "pass";
  if (conclusion === "PASS with follow-up") return "pass_with_follow_up";
  return "blocked";
}

function isCandidateCompatible({
  input,
  overallStatus,
  directValidationStatus,
  candidateBasisQuality,
  candidateCount,
}: {
  input: BuildCodexFormerConstellationProjectionInputV0;
  overallStatus: CodexFormerConstellationOverallStatusV0;
  directValidationStatus: string;
  candidateBasisQuality: string;
  candidateCount: number;
}) {
  return (
    overallStatus !== "blocked" &&
    input.metadata_match &&
    candidateCount === 1 &&
    input.candidate_authority === "non_committed" &&
    candidateBasisQuality !== "blocked" &&
    directValidationStatus !== "blocked"
  );
}

function buildWarningItems({
  overallStatus,
  pointerWarningCount,
  warnings,
  blockedReasons,
}: {
  overallStatus: CodexFormerConstellationOverallStatusV0;
  pointerWarningCount: number;
  warnings: string[];
  blockedReasons: string[];
}): WarningProjectionItem[] {
  const items: WarningProjectionItem[] = warnings.map((summary, index) => ({
    id: `node:warning:${index + 1}`,
    summary,
    status: "needs_review",
    authority: "advisory_only",
    relation: "pointer_only",
  }));

  if (pointerWarningCount > 0) {
    items.push({
      id: `node:warning:${items.length + 1}`,
      summary: "Pointer warnings remain visible for review.",
      status: "needs_review",
      authority: "advisory_only",
      relation: "pointer_only",
    });
  }

  blockedReasons.forEach((summary) => {
    items.push({
      id: `node:warning:${items.length + 1}`,
      summary,
      status: "blocked",
      authority: "blocked",
      relation: "blocked_by",
    });
  });

  if (overallStatus === "blocked" && items.length === 0) {
    items.push({
      id: "node:warning:1",
      summary: "Validation blocked candidate review use.",
      status: "blocked",
      authority: "blocked",
      relation: "blocked_by",
    });
  }

  return items;
}

function buildNode(input: {
  id: string;
  node_kind: CodexFormerConstellationNodeKindV0;
  title: string;
  status: CodexFormerConstellationNodeStatusV0;
  authority: CodexFormerConstellationAuthorityV0;
  primary_badges: string[];
  warning_count: number;
  provenance_refs: string[];
  detail_refs: string[];
  omittedUnsafeFields: Set<string>;
}): CodexFormerConstellationNodeV0 {
  return {
    id: input.id,
    node_kind: input.node_kind,
    title:
      sanitizeProjectionText(
        input.title,
        `${input.id}.title`,
        input.omittedUnsafeFields,
      ) ?? input.node_kind,
    status: input.status,
    authority: input.authority,
    primary_badges: copySafeProjectionTextList(
      input.primary_badges,
      `${input.id}.primary_badges`,
      input.omittedUnsafeFields,
    ).slice(0, 2),
    warning_count: normalizeCount(input.warning_count),
    provenance_refs: copySafeProjectionTextList(
      input.provenance_refs,
      `${input.id}.provenance_refs`,
      input.omittedUnsafeFields,
    ),
    detail_refs: copySafeProjectionTextList(
      input.detail_refs,
      `${input.id}.detail_refs`,
      input.omittedUnsafeFields,
    ),
  };
}

function buildEdge(input: {
  from: string;
  to: string;
  relation: CodexFormerConstellationEdgeRelationV0;
  status: CodexFormerConstellationEdgeStatusV0;
  authority_boundary: CodexFormerConstellationEdgeAuthorityBoundaryV0;
  warning_count: number;
  provenance_refs: string[];
}): CodexFormerConstellationEdgeV0 {
  return {
    id: `edge:${input.from}->${input.to}:${input.relation}`,
    from: input.from,
    to: input.to,
    relation: input.relation,
    status: input.status,
    authority_boundary: input.authority_boundary,
    warning_count: normalizeCount(input.warning_count),
    provenance_refs: [...input.provenance_refs],
  };
}

function buildFalseAuthorityFlags(): CodexFormerConstellationProjectionV0["authority_flags"] {
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

function sanitizeOptionalText(
  value: string | null | undefined,
  fieldName: string,
  omittedUnsafeFields: Set<string>,
): string | undefined {
  return (
    sanitizeProjectionText(value, fieldName, omittedUnsafeFields) ?? undefined
  );
}

function sanitizeProjectionText(
  value: string | null | undefined,
  fieldName: string,
  omittedUnsafeFields: Set<string>,
): string | null {
  const safeValue = sanitizeCodexPerspectiveText(
    value,
    fieldName,
    omittedUnsafeFields,
  );
  if (!safeValue) return null;

  if (containsProjectionUnsafeMaterial(safeValue)) {
    omittedUnsafeFields.add(fieldName);
    return null;
  }

  return safeValue;
}

function copySafeProjectionTextList(
  values: readonly string[] | undefined,
  fieldName: string,
  omittedUnsafeFields: Set<string>,
): string[] {
  const safeValues: string[] = [];

  values?.forEach((value, index) => {
    const safeValue = sanitizeProjectionText(
      value,
      `${fieldName}[${index}]`,
      omittedUnsafeFields,
    );
    if (safeValue) safeValues.push(safeValue);
  });

  return [...new Set(safeValues)];
}

function containsProjectionUnsafeMaterial(value: string): boolean {
  const lowered = value.toLowerCase();
  const unsafeMarkers = [
    "raw" + "_review" + "_payload",
    "raw" + "_page" + "_dump",
    "raw" + "_pr" + "_diff",
    "provider" + "_log",
    "account" + "_data",
  ];

  return unsafeMarkers.some((marker) => lowered.includes(marker));
}

function compactTextList(values: Array<string | null | undefined>) {
  return values.filter((value): value is string => Boolean(value));
}

function normalizeCount(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function hasNode(nodes: CodexFormerConstellationNodeV0[], id: string) {
  return nodes.some((node) => node.id === id);
}

function countPointerWarningItems(items: WarningProjectionItem[]) {
  return items.filter((item) => item.relation === "pointer_only").length;
}
