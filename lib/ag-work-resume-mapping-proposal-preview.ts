import type { AgWorkResumePacketV02 } from "@/lib/ag-work-resume-packet";

export type AgWorkResumeMappingProposalPreviewInput = {
  packet: AgWorkResumePacketV02;
  candidates?: AgWorkResumeMappingProposalCandidate[];
  selected_candidate_id?: string | null;
  strict?: boolean;
  source?: {
    reviewed_by_surface?:
      | "cockpit"
      | "local_helper"
      | "route"
      | "chatgpt_app"
      | "codex"
      | "unknown";
    reviewed_at?: string | null;
  };
};

export type AgWorkResumeMappingProposalCandidate = {
  candidate_id: string;
  local_scope: string;
  local_work_id: string;
  title: string;
  status: string;
  next_action: string;
  related_state_keys: string[];
  summary?: string | null;
  priority?: string | null;
  source?: "explicit_user_input" | "local_runtime_list" | "fixture" | "unknown";
  work_brief_available?: boolean;
  codex_read_brief_available?: boolean;
  repo_match?: {
    remote_matches?: boolean | null;
    base_commit_reachable?: boolean | null;
    expected_files_present?: string[];
    expected_files_missing?: string[];
    dirty_worktree?: boolean | null;
  };
};

export type AgWorkResumeMappingProposalPreviewStatus =
  | "needs_candidate"
  | "candidate_review"
  | "conflict"
  | "blocked";

export type AgWorkResumeMappingProposalPreviewGap = {
  id: string;
  severity: "info" | "warning" | "blocking";
  title: string;
  detail: string;
  fields?: string[];
  refs?: string[];
};

export type AgWorkResumeMappingProposalPreviewConflict = {
  id: string;
  title: string;
  detail: string;
  fields?: string[];
  refs?: string[];
  differences?: AgWorkResumeMappingProposalPreviewDifference[];
};

export type AgWorkResumeMappingProposalPreviewQuestion = {
  id: string;
  text: string;
};

export type AgWorkResumeMappingProposalPreviewRecommendation = {
  id: string;
  text: string;
};

export type AgWorkResumeMappingProposalPreviewComparisonLabel =
  | "exact"
  | "differs"
  | "missing"
  | "overlaps"
  | "no_overlap"
  | "not_supplied";

export type AgWorkResumeMappingProposalPreviewDifference = {
  field: string;
  packet_value: string | string[] | boolean | null;
  candidate_value: string | string[] | boolean | null;
  label: AgWorkResumeMappingProposalPreviewComparisonLabel;
};

export type AgWorkResumeMappingProposalPreview = {
  preview_kind: "ag_work_resume_mapping_proposal_preview";
  schema: "augnes.ag_work_resume_mapping_proposal_preview.v0_1";
  proposal_preview_id: string;
  status: AgWorkResumeMappingProposalPreviewStatus;
  ok_for_user_core_review: boolean;
  packet_summary: {
    packet_id: string;
    packet_foreign_work: {
      scope: string;
      work_id: string;
      title: string;
      status: string;
      priority: string;
      summary: string;
      next_action: string;
      related_state_keys: string[];
    };
    git: {
      remote: string;
      base_branch: string;
      base_commit: string;
      working_branch: string;
      head_commit: string;
      related_pr: string | null;
    };
    expected_files: string[];
    expected_checks: string[];
    preflight_assumption: string;
  };
  candidate_summaries: AgWorkResumeMappingProposalCandidateSummary[];
  selected_candidate_summary: AgWorkResumeMappingProposalCandidateSummary | null;
  comparison: {
    match_confidence_label:
      | "same_scope_and_work_id"
      | "same_work_id_different_scope"
      | "different_work_id_but_confirmable_candidate"
      | "weak_candidate_needs_user_core_review"
      | "conflict_requires_resolution";
    advisory_only: true;
    fields: AgWorkResumeMappingProposalPreviewDifference[];
    related_state_keys_overlap: string[];
    repo: {
      remote_matches: AgWorkResumeMappingProposalPreviewComparisonLabel;
      base_commit_reachable: AgWorkResumeMappingProposalPreviewComparisonLabel;
      dirty_worktree: AgWorkResumeMappingProposalPreviewComparisonLabel;
      expected_files: AgWorkResumeMappingProposalPreviewComparisonLabel;
    };
  };
  gaps: AgWorkResumeMappingProposalPreviewGap[];
  conflicts: AgWorkResumeMappingProposalPreviewConflict[];
  questions: AgWorkResumeMappingProposalPreviewQuestion[];
  recommendations: AgWorkResumeMappingProposalPreviewRecommendation[];
  foreign_refs_summary: {
    foreign_action_ref_ids: string[];
    foreign_evidence_refs: string[];
    foreign_session_refs: string[];
    foreign_evidence_pack_ref: string | null;
    local_proof_records_created: false;
    local_evidence_records_created: false;
    local_sessions_bound: false;
    note: string;
  };
  authority_boundary: {
    read_only: true;
    proposal_only: true;
    creates_mapping_record: false;
    creates_import_record: false;
    creates_work_item: false;
    records_proof: false;
    records_evidence: false;
    binds_session: false;
    executes_codex: false;
    approval_authority: false;
    publish_retry_replay_authority: false;
    merge_authority: false;
    state_mutation: false;
    durable_approval: "user/Core gated";
    statement: string;
  };
  next_step: string;
};

export type AgWorkResumeMappingProposalCandidateSummary = {
  candidate_id: string;
  local_scope: string;
  local_work_id: string;
  title: string;
  status: string;
  next_action: string;
  related_state_keys: string[];
  summary: string | null;
  priority: string | null;
  source: "explicit_user_input" | "local_runtime_list" | "fixture" | "unknown";
  work_brief_available: boolean;
  codex_read_brief_available: boolean;
  repo_match: {
    remote_matches: boolean | null;
    base_commit_reachable: boolean | null;
    expected_files_present: string[];
    expected_files_missing: string[];
    dirty_worktree: boolean | null;
  };
};

const PREVIEW_KIND = "ag_work_resume_mapping_proposal_preview" as const;
const SCHEMA = "augnes.ag_work_resume_mapping_proposal_preview.v0_1" as const;

const UNSAFE_TARGET_POLICY_FIELDS = [
  "may_create_local_work_item",
  "may_bind_session",
  "may_commit_or_reject_state",
  "may_execute_codex",
  "may_merge",
  "may_publish_or_replay",
] as const;

const AUTHORITY_STATEMENT =
  "Mapping proposal preview is review metadata only, not mapping confirmation, not import, not persistence, not proof/evidence, not execution authority.";

export function buildAgWorkResumeMappingProposalPreview(
  input: AgWorkResumeMappingProposalPreviewInput,
): AgWorkResumeMappingProposalPreview {
  const strict = input.strict === true;
  const packet = input.packet;
  const candidates = (input.candidates ?? []).map(summarizeCandidate);
  const gaps: AgWorkResumeMappingProposalPreviewGap[] = [];
  const conflicts: AgWorkResumeMappingProposalPreviewConflict[] = [];
  const questions: AgWorkResumeMappingProposalPreviewQuestion[] = [];
  const recommendations = new Map<
    string,
    AgWorkResumeMappingProposalPreviewRecommendation
  >();

  addBaseRecommendations(recommendations);

  const unsafePolicyFields = findUnsafeTargetPolicyFields(packet);
  if (unsafePolicyFields.length > 0) {
    conflicts.push({
      id: "unsafe_packet_target_policy",
      title: "Unsafe packet target policy",
      detail:
        "The packet target_runtime_policy is unsafe for mapping proposal preview because it appears to grant write, execution, merge, publish, session, or committed-state authority.",
      fields: unsafePolicyFields,
    });
    gaps.push({
      id: "unsafe_packet_policy_blocks_preview",
      severity: "blocking",
      title: "Packet policy blocks mapping proposal preview",
      detail:
        "Run or repair packet preflight before mapping proposal review. Mapping proposal preview must not rely on unsafe packet policy.",
      fields: unsafePolicyFields,
    });
  }

  const selection = selectCandidate(candidates, input.selected_candidate_id ?? null);
  if (selection.gap) gaps.push(selection.gap);
  if (selection.question) questions.push(selection.question);
  const selectedCandidate = selection.candidate;

  const comparison = buildComparison(packet, selectedCandidate);
  if (selectedCandidate) {
    addWorkComparisonFindings(packet, selectedCandidate, conflicts, questions);
    addRepoFindings(selectedCandidate, strict, gaps, conflicts);
    addCandidateQuestions(packet, selectedCandidate, questions);
  }

  addForeignRefsQuestion(questions);
  addCodexGateQuestion(questions);

  const status = selectStatus({
    hasUnsafePolicy: unsafePolicyFields.length > 0,
    hasSelectedCandidate: Boolean(selectedCandidate),
    conflicts,
  });

  return {
    preview_kind: PREVIEW_KIND,
    schema: SCHEMA,
    proposal_preview_id: buildProposalPreviewId(packet, selectedCandidate),
    status,
    ok_for_user_core_review: status === "candidate_review",
    packet_summary: buildPacketSummary(packet),
    candidate_summaries: candidates,
    selected_candidate_summary: selectedCandidate,
    comparison,
    gaps,
    conflicts,
    questions: uniqueById(questions),
    recommendations: [...recommendations.values()],
    foreign_refs_summary: buildForeignRefsSummary(packet),
    authority_boundary: buildAuthorityBoundary(),
    next_step: nextStepForStatus(status),
  };
}

function selectCandidate(
  candidates: AgWorkResumeMappingProposalCandidateSummary[],
  selectedCandidateId: string | null,
): {
  candidate: AgWorkResumeMappingProposalCandidateSummary | null;
  gap: AgWorkResumeMappingProposalPreviewGap | null;
  question: AgWorkResumeMappingProposalPreviewQuestion | null;
} {
  if (candidates.length === 0) {
    return {
      candidate: null,
      gap: {
        id: "local_candidate_missing",
        severity: "blocking",
        title: "Local work candidate is missing",
        detail:
          "No explicit Local B candidate work item context was supplied for mapping proposal review.",
      },
      question: null,
    };
  }

  if (selectedCandidateId) {
    const candidate =
      candidates.find((item) => item.candidate_id === selectedCandidateId) ?? null;
    if (candidate) {
      return { candidate, gap: null, question: null };
    }
    return {
      candidate: null,
      gap: {
        id: "selected_candidate_not_found",
        severity: "blocking",
        title: "Selected candidate id was not found",
        detail:
          "The selected_candidate_id does not match any supplied Local B candidate work item.",
        refs: [selectedCandidateId],
      },
      question: null,
    };
  }

  if (candidates.length === 1) {
    return { candidate: candidates[0], gap: null, question: null };
  }

  return {
    candidate: null,
    gap: {
      id: "selected_candidate_required",
      severity: "blocking",
      title: "Selected candidate is required",
      detail:
        "Multiple Local B candidate work items were supplied; select exactly one candidate for mapping proposal review.",
    },
    question: {
      id: "which_candidate_should_be_reviewed",
      text: "Which local work item should be reviewed as the candidate mapping target?",
    },
  };
}

function buildComparison(
  packet: AgWorkResumePacketV02,
  candidate: AgWorkResumeMappingProposalCandidateSummary | null,
): AgWorkResumeMappingProposalPreview["comparison"] {
  const emptyComparison = {
    match_confidence_label: "weak_candidate_needs_user_core_review" as const,
    advisory_only: true as const,
    fields: [] as AgWorkResumeMappingProposalPreviewDifference[],
    related_state_keys_overlap: [] as string[],
    repo: {
      remote_matches: "not_supplied" as const,
      base_commit_reachable: "not_supplied" as const,
      dirty_worktree: "not_supplied" as const,
      expected_files: "not_supplied" as const,
    },
  };

  if (!candidate) return emptyComparison;

  const packetWork = packet.source_work;
  const relatedStateKeysOverlap = overlap(
    packetWork.related_state_keys,
    candidate.related_state_keys,
  );
  const fields: AgWorkResumeMappingProposalPreviewDifference[] = [
    compareStringField("scope", packetWork.scope, candidate.local_scope),
    compareStringField("work_id", packetWork.work_id, candidate.local_work_id),
    compareStringField("title", packetWork.title, candidate.title),
    compareStringField("status", packetWork.status, candidate.status),
    compareStringField("next_action", packetWork.next_action, candidate.next_action),
    {
      field: "related_state_keys",
      packet_value: [...packetWork.related_state_keys],
      candidate_value: [...candidate.related_state_keys],
      label:
        packetWork.related_state_keys.length === 0 ||
        candidate.related_state_keys.length === 0
          ? "missing"
          : relatedStateKeysOverlap.length > 0
            ? "overlaps"
            : "no_overlap",
    },
  ];

  const repo = candidate.repo_match;
  const repoComparison = {
    remote_matches: booleanComparisonLabel(repo.remote_matches),
    base_commit_reachable: booleanComparisonLabel(repo.base_commit_reachable),
    dirty_worktree:
      repo.dirty_worktree === null
        ? "not_supplied"
        : repo.dirty_worktree
          ? "differs"
          : "exact",
    expected_files:
      repo.expected_files_missing.length > 0
        ? "differs"
        : repo.expected_files_present.length > 0
          ? "exact"
          : "not_supplied",
  } satisfies AgWorkResumeMappingProposalPreview["comparison"]["repo"];

  return {
    match_confidence_label: matchConfidenceLabel(fields),
    advisory_only: true,
    fields,
    related_state_keys_overlap: relatedStateKeysOverlap,
    repo: repoComparison,
  };
}

function addWorkComparisonFindings(
  packet: AgWorkResumePacketV02,
  candidate: AgWorkResumeMappingProposalCandidateSummary,
  conflicts: AgWorkResumeMappingProposalPreviewConflict[],
  questions: AgWorkResumeMappingProposalPreviewQuestion[],
) {
  const differences = [
    compareStringField("scope", packet.source_work.scope, candidate.local_scope),
    compareStringField("work_id", packet.source_work.work_id, candidate.local_work_id),
    compareStringField("title", packet.source_work.title, candidate.title),
    compareStringField("status", packet.source_work.status, candidate.status),
    compareStringField("next_action", packet.source_work.next_action, candidate.next_action),
  ].filter((difference) => difference.label !== "exact");

  const blockingDifferences = differences.filter((difference) =>
    ["title", "status", "next_action"].includes(difference.field),
  );

  if (blockingDifferences.length > 0) {
    conflicts.push({
      id: "candidate_work_fields_differ",
      title: "Candidate work fields differ",
      detail:
        "The selected Local B candidate differs from the packet foreign work in fields that require user/Core resolution before a mapping can be confirmed.",
      fields: differences.map((difference) => difference.field),
      differences,
    });
  }

  if (differences.length > 0) {
    questions.push({
      id: "are_work_differences_expected",
      text: "Are title/status/next_action differences expected?",
    });
  }
}

function addRepoFindings(
  candidate: AgWorkResumeMappingProposalCandidateSummary,
  strict: boolean,
  gaps: AgWorkResumeMappingProposalPreviewGap[],
  conflicts: AgWorkResumeMappingProposalPreviewConflict[],
) {
  const repo = candidate.repo_match;
  if (repo.remote_matches === false) {
    conflicts.push({
      id: "repo_remote_mismatch",
      title: "Repo remote mismatch",
      detail:
        "The selected candidate repo context says the Local B remote does not match the packet remote.",
      fields: ["repo_match.remote_matches"],
    });
  }

  if (repo.base_commit_reachable === false) {
    if (strict) {
      conflicts.push({
        id: "repo_base_commit_unreachable",
        title: "Packet base commit is unreachable",
        detail:
          "Strict mode treats an unreachable packet base commit as a mapping proposal conflict.",
        fields: ["repo_match.base_commit_reachable"],
      });
    } else {
      gaps.push({
        id: "repo_base_commit_unreachable",
        severity: "warning",
        title: "Packet base commit is unreachable",
        detail:
          "Local B repo context says the packet base commit is not reachable. Resolve this before any future mapping confirmation.",
      });
    }
  }

  if (repo.dirty_worktree === true) {
    if (strict) {
      conflicts.push({
        id: "repo_dirty_worktree",
        title: "Dirty worktree in strict mode",
        detail:
          "Strict mode treats a dirty Local B worktree as a mapping proposal conflict.",
        fields: ["repo_match.dirty_worktree"],
      });
    } else {
      gaps.push({
        id: "repo_dirty_worktree",
        severity: "warning",
        title: "Dirty worktree",
        detail:
          "Local B repo context says the worktree is dirty. Review unrelated changes before relying on this proposal preview.",
      });
    }
  }

  if (repo.expected_files_missing.length > 0) {
    if (strict) {
      conflicts.push({
        id: "expected_files_missing",
        title: "Expected files are missing in strict mode",
        detail:
          "Strict mode treats missing packet-expected files as a mapping proposal conflict.",
        fields: ["repo_match.expected_files_missing"],
        refs: [...repo.expected_files_missing],
      });
    } else {
      gaps.push({
        id: "expected_files_missing",
        severity: "warning",
        title: "Expected files are missing",
        detail:
          "Local B repo context says one or more packet-expected files are missing.",
        refs: [...repo.expected_files_missing],
      });
    }
  }
}

function addCandidateQuestions(
  packet: AgWorkResumePacketV02,
  candidate: AgWorkResumeMappingProposalCandidateSummary,
  questions: AgWorkResumeMappingProposalPreviewQuestion[],
) {
  questions.push({
    id: "does_foreign_work_map_to_local_work",
    text: `Does foreign work ${packet.source_work.scope}/${packet.source_work.work_id} map to local work ${candidate.local_scope}/${candidate.local_work_id}?`,
  });
  questions.push({
    id: "is_repo_context_sufficient",
    text: "Is Local B repo context sufficient before any future mapping confirmation?",
  });
}

function addForeignRefsQuestion(
  questions: AgWorkResumeMappingProposalPreviewQuestion[],
) {
  questions.push({
    id: "should_foreign_refs_remain_context_only",
    text: "Should foreign refs remain context-only?",
  });
}

function addCodexGateQuestion(
  questions: AgWorkResumeMappingProposalPreviewQuestion[],
) {
  questions.push({
    id: "should_codex_remain_blocked_until_read_brief",
    text: "Should Codex continuation remain blocked until codex:read-brief succeeds?",
  });
}

function addBaseRecommendations(
  recommendations: Map<string, AgWorkResumeMappingProposalPreviewRecommendation>,
) {
  addRecommendation(
    recommendations,
    "run_or_confirm_preflight",
    "Run or confirm ag:resume-preflight before mapping proposal review.",
  );
  addRecommendation(
    recommendations,
    "provide_candidate_context",
    "Provide explicit Local B candidate work item context.",
  );
  addRecommendation(
    recommendations,
    "preview_only_until_confirmed",
    "Keep this as preview-only until user/Core confirms mapping.",
  );
  addRecommendation(
    recommendations,
    "do_not_import_or_persist",
    "Do not import or persist packet context from this preview.",
  );
  addRecommendation(
    recommendations,
    "do_not_create_mapping_record",
    "Do not create mapping records from this preview.",
  );
  addRecommendation(
    recommendations,
    "do_not_record_or_bind_or_execute",
    "Do not record proof/evidence, bind sessions, or start Codex from this preview.",
  );
  addRecommendation(
    recommendations,
    "future_gated_pr",
    "If user/Core later confirms mapping, use a separate gated PR/route/schema.",
  );
}

function selectStatus({
  hasUnsafePolicy,
  hasSelectedCandidate,
  conflicts,
}: {
  hasUnsafePolicy: boolean;
  hasSelectedCandidate: boolean;
  conflicts: AgWorkResumeMappingProposalPreviewConflict[];
}): AgWorkResumeMappingProposalPreviewStatus {
  if (hasUnsafePolicy) return "blocked";
  if (!hasSelectedCandidate) return "needs_candidate";
  if (conflicts.length > 0) return "conflict";
  return "candidate_review";
}

function nextStepForStatus(status: AgWorkResumeMappingProposalPreviewStatus) {
  switch (status) {
    case "candidate_review":
      return "User/Core should review the mapping proposal questions; do not confirm mapping, import, persist, or start Codex from this preview.";
    case "needs_candidate":
      return "Provide explicit Local B candidate work item context and select one candidate for review.";
    case "conflict":
      return "Resolve proposal conflicts before any future user/Core mapping confirmation.";
    case "blocked":
      return "Stop and fix unsafe packet policy or packet shape before mapping proposal review.";
  }
}

function buildPacketSummary(packet: AgWorkResumePacketV02) {
  return {
    packet_id: packet.packet_id,
    packet_foreign_work: {
      scope: packet.source_work.scope,
      work_id: packet.source_work.work_id,
      title: packet.source_work.title,
      status: packet.source_work.status,
      priority: packet.source_work.priority,
      summary: packet.source_work.summary,
      next_action: packet.source_work.next_action,
      related_state_keys: [...packet.source_work.related_state_keys],
    },
    git: {
      remote: packet.git.remote,
      base_branch: packet.git.base_branch,
      base_commit: packet.git.base_commit,
      working_branch: packet.git.working_branch,
      head_commit: packet.git.head_commit,
      related_pr: packet.git.related_pr,
    },
    expected_files: [...packet.handoff.expected_files],
    expected_checks: [...packet.handoff.expected_checks],
    preflight_assumption:
      "Mapping proposal preview assumes packet preflight already passed; unsafe target policy still fails closed.",
  };
}

function summarizeCandidate(
  candidate: AgWorkResumeMappingProposalCandidate,
): AgWorkResumeMappingProposalCandidateSummary {
  return {
    candidate_id: candidate.candidate_id,
    local_scope: candidate.local_scope,
    local_work_id: candidate.local_work_id,
    title: candidate.title,
    status: candidate.status,
    next_action: candidate.next_action,
    related_state_keys: [...candidate.related_state_keys],
    summary: candidate.summary ?? null,
    priority: candidate.priority ?? null,
    source: candidate.source ?? "unknown",
    work_brief_available: candidate.work_brief_available === true,
    codex_read_brief_available: candidate.codex_read_brief_available === true,
    repo_match: {
      remote_matches: candidate.repo_match?.remote_matches ?? null,
      base_commit_reachable: candidate.repo_match?.base_commit_reachable ?? null,
      expected_files_present: uniqueStrings(
        candidate.repo_match?.expected_files_present ?? [],
      ),
      expected_files_missing: uniqueStrings(
        candidate.repo_match?.expected_files_missing ?? [],
      ),
      dirty_worktree: candidate.repo_match?.dirty_worktree ?? null,
    },
  };
}

function buildForeignRefsSummary(packet: AgWorkResumePacketV02) {
  return {
    foreign_action_ref_ids: packet.continuity.foreign_action_refs.map((ref) => ref.id),
    foreign_evidence_refs: [...packet.continuity.foreign_evidence_refs],
    foreign_session_refs: [...packet.continuity.foreign_session_refs],
    foreign_evidence_pack_ref: packet.continuity.foreign_evidence_pack_ref,
    local_proof_records_created: false as const,
    local_evidence_records_created: false as const,
    local_sessions_bound: false as const,
    note:
      "Foreign refs remain foreign until a separate reconciliation authority gate exists.",
  };
}

function buildAuthorityBoundary() {
  return {
    read_only: true as const,
    proposal_only: true as const,
    creates_mapping_record: false as const,
    creates_import_record: false as const,
    creates_work_item: false as const,
    records_proof: false as const,
    records_evidence: false as const,
    binds_session: false as const,
    executes_codex: false as const,
    approval_authority: false as const,
    publish_retry_replay_authority: false as const,
    merge_authority: false as const,
    state_mutation: false as const,
    durable_approval: "user/Core gated" as const,
    statement: AUTHORITY_STATEMENT,
  };
}

function buildProposalPreviewId(
  packet: AgWorkResumePacketV02,
  candidate: AgWorkResumeMappingProposalCandidateSummary | null,
) {
  return `mapping-proposal-preview:${safeIdSegment(
    packet.source_work.work_id,
  )}:${safeIdSegment(candidate?.candidate_id ?? "none")}`;
}

function findUnsafeTargetPolicyFields(packet: AgWorkResumePacketV02) {
  const policy = packet.target_runtime_policy as unknown as Record<string, unknown>;
  const fields: string[] = [];
  for (const field of UNSAFE_TARGET_POLICY_FIELDS) {
    if (policy[field] !== false) fields.push(field);
  }
  return fields;
}

function compareStringField(
  field: string,
  packetValue: string | null,
  candidateValue: string | null,
): AgWorkResumeMappingProposalPreviewDifference {
  return {
    field,
    packet_value: packetValue,
    candidate_value: candidateValue,
    label: comparisonLabel(packetValue, candidateValue),
  };
}

function comparisonLabel(
  packetValue: string | null,
  candidateValue: string | null,
): AgWorkResumeMappingProposalPreviewComparisonLabel {
  if (!packetValue || !candidateValue) return "missing";
  return packetValue === candidateValue ? "exact" : "differs";
}

function booleanComparisonLabel(
  value: boolean | null,
): AgWorkResumeMappingProposalPreviewComparisonLabel {
  if (value === null) return "not_supplied";
  return value ? "exact" : "differs";
}

function matchConfidenceLabel(
  fields: AgWorkResumeMappingProposalPreviewDifference[],
): AgWorkResumeMappingProposalPreview["comparison"]["match_confidence_label"] {
  const scope = fields.find((field) => field.field === "scope")?.label;
  const workId = fields.find((field) => field.field === "work_id")?.label;
  const title = fields.find((field) => field.field === "title")?.label;
  const status = fields.find((field) => field.field === "status")?.label;
  const nextAction = fields.find((field) => field.field === "next_action")?.label;
  const hasWorkFieldConflict =
    title === "differs" || status === "differs" || nextAction === "differs";

  if (hasWorkFieldConflict) return "conflict_requires_resolution";
  if (scope === "exact" && workId === "exact") return "same_scope_and_work_id";
  if (scope === "differs" && workId === "exact") return "same_work_id_different_scope";
  if (workId === "differs") return "different_work_id_but_confirmable_candidate";
  return "weak_candidate_needs_user_core_review";
}

function overlap(left: string[], right: string[]) {
  const rightSet = new Set(right);
  return uniqueStrings(left.filter((value) => rightSet.has(value)));
}

function uniqueStrings(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const trimmed = typeof value === "string" ? value.trim() : "";
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    result.push(trimmed);
  }
  return result;
}

function uniqueById<T extends { id: string }>(items: T[]) {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    result.push(item);
  }
  return result;
}

function addRecommendation(
  recommendations: Map<string, AgWorkResumeMappingProposalPreviewRecommendation>,
  id: string,
  text: string,
) {
  if (!recommendations.has(id)) {
    recommendations.set(id, { id, text });
  }
}

function safeIdSegment(value: string) {
  return value
    .trim()
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
