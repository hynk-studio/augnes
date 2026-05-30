import type { AgWorkResumePacketV02 } from "@/lib/ag-work-resume-packet";

export type AgWorkResumeTargetPreviewInput = {
  packet: AgWorkResumePacketV02;
  local?: AgWorkResumeTargetLocalContext | null;
  strict?: boolean;
};

export type AgWorkResumeTargetLocalContext = {
  runtime?: AgWorkResumeTargetRuntimeContext | null;
  repo?: AgWorkResumeTargetRepoContext | null;
  known_local_work_mappings?: AgWorkResumeTargetWorkMapping[];
};

export type AgWorkResumeTargetRuntimeContext = {
  runtime_available: boolean;
  scope?: string | null;
  work_item?: AgWorkResumeTargetWorkItem | null;
  work_brief_available?: boolean;
  codex_read_brief_command_available?: boolean;
  evidence_recording_authorized?: boolean;
  proof_recording_authorized?: boolean;
  session_binding_authorized?: boolean;
};

export type AgWorkResumeTargetWorkItem = {
  work_id: string;
  scope: string;
  title: string;
  status: string;
  next_action: string;
  related_state_keys: string[];
};

export type AgWorkResumeTargetRepoContext = {
  repo_available: boolean;
  remote?: string | null;
  base_branch?: string | null;
  base_commit_reachable?: boolean | null;
  current_branch?: string | null;
  head_commit?: string | null;
  dirty_worktree?: boolean | null;
  expected_files_present?: string[];
  expected_files_missing?: string[];
};

export type AgWorkResumeTargetWorkMapping = {
  foreign_scope: string;
  foreign_work_id: string;
  local_scope: string;
  local_work_id: string;
  mapping_status: "proposed" | "confirmed" | "rejected";
  confirmed_by?: string | null;
};

export type AgWorkResumeTargetPreviewStatus =
  | "ready_for_user_core_review"
  | "blocked"
  | "needs_mapping"
  | "context_only"
  | "conflict";

export type AgWorkResumeTargetPreviewGap = {
  id: string;
  severity: "info" | "warning" | "blocking";
  title: string;
  detail: string;
  fields?: string[];
  refs?: string[];
};

export type AgWorkResumeTargetPreviewConflict = {
  id: string;
  title: string;
  detail: string;
  fields?: string[];
  refs?: string[];
  differences?: AgWorkResumeTargetPreviewDifference[];
};

export type AgWorkResumeTargetPreviewDifference = {
  field: string;
  packet_value: string | null;
  local_value: string | null;
};

export type AgWorkResumeTargetPreviewRecommendation = {
  id: string;
  text: string;
};

export type AgWorkResumeTargetPreview = {
  ok_to_continue: boolean;
  status: AgWorkResumeTargetPreviewStatus;
  packet_summary: {
    packet_id: string;
    source_work: {
      scope: string;
      work_id: string;
      title: string;
      status: string;
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
    foreign_refs: {
      foreign_action_ref_ids: string[];
      foreign_evidence_refs: string[];
      foreign_session_refs: string[];
      foreign_evidence_pack_ref: string | null;
      local_proof_records_created: false;
      local_evidence_records_created: false;
      local_sessions_bound: false;
      note: string;
    };
  };
  local_context_summary: {
    runtime: {
      provided: boolean;
      runtime_available: boolean;
      scope: string | null;
      work_item: AgWorkResumeTargetWorkItem | null;
      work_brief_available: boolean;
      codex_read_brief_command_available: boolean;
      evidence_recording_authorized: boolean;
      proof_recording_authorized: boolean;
      session_binding_authorized: boolean;
    };
    repo: {
      provided: boolean;
      repo_available: boolean;
      remote: string | null;
      base_branch: string | null;
      base_commit_reachable: boolean | null;
      current_branch: string | null;
      head_commit: string | null;
      dirty_worktree: boolean | null;
      expected_files_present: string[];
      expected_files_missing: string[];
    };
    mapping: {
      status: "missing" | "proposed" | "confirmed" | "rejected";
      foreign_scope: string;
      foreign_work_id: string;
      local_scope: string | null;
      local_work_id: string | null;
      confirmed_by: string | null;
    };
    foreign_refs_remain_foreign: true;
  };
  gaps: AgWorkResumeTargetPreviewGap[];
  conflicts: AgWorkResumeTargetPreviewConflict[];
  warnings: AgWorkResumeTargetPreviewGap[];
  recommendations: AgWorkResumeTargetPreviewRecommendation[];
  authority_boundary: {
    read_only: string;
    boundaries: string[];
    durable_approval: string;
  };
  next_step: string;
};

const AUTHORITY_BOUNDARIES = [
  "Target preview is read-only.",
  "Target preview does not import or persist resume packets.",
  "Target preview does not create or map work items.",
  "Target preview does not record proof or evidence.",
  "Target preview does not bind sessions.",
  "Target preview does not execute Codex.",
  "Target preview does not approve, publish, retry, replay, externally post, merge, auto-merge, or mutate committed state.",
  "Durable approval remains user/Core gated.",
] as const;

const TARGET_POLICY_FALSE_FIELDS = [
  "may_create_local_work_item",
  "may_bind_session",
  "may_commit_or_reject_state",
  "may_execute_codex",
  "may_merge",
  "may_publish_or_replay",
] as const;

const TARGET_POLICY_RECORD_FIELDS = [
  "may_record_evidence",
  "may_record_proof",
] as const;

export function buildAgWorkResumeTargetPreview(
  input: AgWorkResumeTargetPreviewInput,
): AgWorkResumeTargetPreview {
  const strict = input.strict === true;
  const packet = input.packet;
  const local = input.local ?? null;
  const runtime = local?.runtime ?? null;
  const repo = local?.repo ?? null;
  const mappings = local?.known_local_work_mappings ?? [];
  const gaps: AgWorkResumeTargetPreviewGap[] = [];
  const conflicts: AgWorkResumeTargetPreviewConflict[] = [];
  const warnings: AgWorkResumeTargetPreviewGap[] = [];
  const recommendations = new Map<string, AgWorkResumeTargetPreviewRecommendation>();

  addRecommendation(
    recommendations,
    "run_preflight",
    "Run ag:resume-preflight before target preview if not already done.",
  );
  addRecommendation(
    recommendations,
    "confirm_mapping",
    `Confirm whether foreign work ${packet.source_work.scope}/${packet.source_work.work_id} maps to an existing local work item.`,
  );
  addRecommendation(
    recommendations,
    "read_brief_after_mapping",
    "Run codex:read-brief only after local runtime/work mapping is confirmed.",
  );
  addRecommendation(
    recommendations,
    "user_core_before_codex",
    "User/Core must confirm the local mapping before any Codex start.",
  );
  addRecommendation(
    recommendations,
    "do_not_record_proof_evidence",
    "Do not record evidence/proof unless user/Core authorizes it for the local work item.",
  );
  addRecommendation(
    recommendations,
    "do_not_auto_create_work",
    "Do not create a local work item automatically from this packet.",
  );

  const unsafePolicy = addTargetPolicyConflicts(packet, conflicts);
  const mappingState = resolveMapping(packet, mappings);
  const localWork = runtime?.work_item ?? null;
  let localWorkMappingMissing = false;

  if (mappingState.rejected && !mappingState.confirmed) {
    conflicts.push({
      id: "local_work_mapping_rejected",
      title: "Local work mapping is rejected",
      detail: "A supplied mapping for the packet foreign work is explicitly rejected.",
      refs: [
        `${mappingState.rejected.foreign_scope}/${mappingState.rejected.foreign_work_id}`,
      ],
    });
  }

  if (!runtime) {
    gaps.push({
      id: "local_runtime_context_missing",
      severity: "blocking",
      title: "Local runtime context is missing",
      detail:
        "Use this packet as human-readable context only. Local proof/evidence recording and session binding are unavailable without explicit runtime context.",
    });
    addRecommendation(
      recommendations,
      "context_only",
      "Use packet as context only because local runtime context is missing.",
    );
  } else if (!runtime.runtime_available) {
    gaps.push({
      id: "local_runtime_unavailable",
      severity: "blocking",
      title: "Local runtime is unavailable",
      detail:
        "Use this packet as human-readable context only. Local proof/evidence recording and session binding are unavailable while the runtime is unavailable.",
    });
    addRecommendation(
      recommendations,
      "context_only",
      "Use packet as context only because local runtime context is missing.",
    );
  } else {
    if (mappingState.confirmed) {
      const confirmed = mappingState.confirmed;
      if (localWork && !matchesMapping(localWork, confirmed)) {
        conflicts.push({
          id: "confirmed_mapping_target_mismatch",
          title: "Confirmed mapping does not match supplied local work item",
          detail:
            "The confirmed mapping points to a different local work identity than the supplied runtime work item.",
          fields: ["scope", "work_id"],
          refs: [
            `${confirmed.local_scope}/${confirmed.local_work_id}`,
            `${localWork.scope}/${localWork.work_id}`,
          ],
        });
      }
      if (!localWork) {
        gaps.push({
          id: "confirmed_mapping_work_item_missing",
          severity: "blocking",
          title: "Confirmed mapping lacks local work item context",
          detail:
            "A confirmed mapping was supplied, but the local runtime context did not include the mapped work item details.",
          refs: [`${confirmed.local_scope}/${confirmed.local_work_id}`],
        });
      }
    } else if (!localWork) {
      localWorkMappingMissing = true;
      gaps.push({
        id: "local_work_mapping_missing",
        severity: "blocking",
        title: "Local work mapping is missing",
        detail:
          "Runtime context is available, but no local work item or confirmed mapping was supplied. Do not auto-create a work item from this packet.",
      });
    } else {
      const sameIdentity =
        localWork.scope === packet.source_work.scope &&
        localWork.work_id === packet.source_work.work_id;
      if (sameIdentity) {
        const differences = compareWorkItem(packet, localWork);
        if (differences.length > 0) {
          conflicts.push({
            id: "local_work_identity_conflict",
            title: "Local work item identity conflicts with packet work",
            detail:
              "A local work item with the same scope/work_id exists, but its title, status, or next action differs from the packet.",
            fields: differences.map((difference) => difference.field),
            differences,
          });
        } else {
          localWorkMappingMissing = true;
          gaps.push({
            id: "local_work_mapping_unconfirmed",
            severity: "blocking",
            title: "Local work mapping is unconfirmed",
            detail:
              "A matching local work item was supplied, but this preview still requires user/Core confirmation before Codex starts.",
            refs: [`${localWork.scope}/${localWork.work_id}`],
          });
        }
      } else {
        localWorkMappingMissing = true;
        gaps.push({
          id: "local_work_mapping_missing",
          severity: "blocking",
          title: "Local work mapping is missing",
          detail:
            "The supplied local work item does not share the packet work identity, and no confirmed mapping was supplied.",
          refs: [
            `${packet.source_work.scope}/${packet.source_work.work_id}`,
            `${localWork.scope}/${localWork.work_id}`,
          ],
        });
      }
    }

    if (mappingState.proposed && !mappingState.confirmed) {
      localWorkMappingMissing = true;
      gaps.push({
        id: "local_work_mapping_proposed",
        severity: "blocking",
        title: "Local work mapping is proposed but not confirmed",
        detail:
          "A proposed mapping is advisory only. User/Core must confirm it before it can be used as the local target identity.",
        refs: [
          `${mappingState.proposed.foreign_scope}/${mappingState.proposed.foreign_work_id}`,
          `${mappingState.proposed.local_scope}/${mappingState.proposed.local_work_id}`,
        ],
      });
    }
  }

  addRepoFindings(packet, repo, strict, gaps, conflicts, warnings, recommendations);

  const status = selectStatus({
    unsafePolicy,
    conflicts,
    gaps,
    runtime,
    localWorkMappingMissing,
  });
  const okToContinue = status === "ready_for_user_core_review";

  return {
    ok_to_continue: okToContinue,
    status,
    packet_summary: buildPacketSummary(packet),
    local_context_summary: buildLocalContextSummary(packet, runtime, repo, mappingState),
    gaps,
    conflicts,
    warnings,
    recommendations: [...recommendations.values()],
    authority_boundary: {
      read_only: "Target preview is a read-only review aid.",
      boundaries: [...AUTHORITY_BOUNDARIES],
      durable_approval: "Durable approval remains user/Core gated.",
    },
    next_step: nextStepForStatus(status),
  };
}

function addTargetPolicyConflicts(
  packet: AgWorkResumePacketV02,
  conflicts: AgWorkResumeTargetPreviewConflict[],
) {
  const policy = packet.target_runtime_policy as unknown as Record<string, unknown>;
  const unsafeFields: string[] = [];

  if (policy.preview_only_by_default !== true) {
    unsafeFields.push("preview_only_by_default");
  }
  for (const field of TARGET_POLICY_FALSE_FIELDS) {
    if (policy[field] !== false) unsafeFields.push(field);
  }
  for (const field of TARGET_POLICY_RECORD_FIELDS) {
    if (policy[field] === true) unsafeFields.push(field);
  }

  if (unsafeFields.length > 0) {
    conflicts.push({
      id: "unsafe_target_runtime_policy",
      title: "Unsafe target runtime policy",
      detail:
        "The packet target policy appears to grant or ambiguously allow execution, merge/publish, state mutation, work creation, session binding, or proof/evidence recording.",
      fields: unsafeFields,
    });
  }

  return unsafeFields.length > 0;
}

function addRepoFindings(
  packet: AgWorkResumePacketV02,
  repo: AgWorkResumeTargetRepoContext | null,
  strict: boolean,
  gaps: AgWorkResumeTargetPreviewGap[],
  conflicts: AgWorkResumeTargetPreviewConflict[],
  warnings: AgWorkResumeTargetPreviewGap[],
  recommendations: Map<string, AgWorkResumeTargetPreviewRecommendation>,
) {
  if (!repo) {
    warnings.push({
      id: "repo_context_missing",
      severity: "warning",
      title: "Repo context is missing",
      detail:
        "No local repo context was supplied, so remote, base commit, worktree, and expected-file checks remain unverified.",
    });
    return;
  }

  if (!repo.repo_available) {
    warnings.push({
      id: "repo_unavailable",
      severity: "warning",
      title: "Repo context is unavailable",
      detail:
        "The supplied repo context says the repository is unavailable, so Git continuity remains unverified.",
    });
  }

  const packetRemote = clean(packet.git.remote);
  const localRemote = clean(repo.remote);
  if (packetRemote && localRemote && packetRemote !== localRemote) {
    conflicts.push({
      id: "repo_remote_mismatch",
      title: "Repo remote mismatch",
      detail: "The supplied local repo remote differs from packet.git.remote.",
      fields: ["remote"],
      refs: [packetRemote, localRemote],
    });
    addRecommendation(
      recommendations,
      "resolve_repo_mismatch",
      "Resolve repo remote/base commit mismatch before implementation.",
    );
  }

  if (repo.base_commit_reachable === false) {
    if (strict) {
      conflicts.push({
        id: "repo_base_commit_unreachable",
        title: "Packet base commit is unreachable",
        detail:
          "Strict mode treats an unreachable packet base commit as a target repo conflict.",
        fields: ["base_commit_reachable"],
        refs: [packet.git.base_commit],
      });
    } else {
      gaps.push({
        id: "repo_base_commit_unreachable",
        severity: "blocking",
        title: "Packet base commit is unreachable",
        detail:
          "The supplied repo context says packet.git.base_commit is not reachable locally.",
        refs: [packet.git.base_commit],
      });
    }
    addRecommendation(
      recommendations,
      "resolve_repo_mismatch",
      "Resolve repo remote/base commit mismatch before implementation.",
    );
  }

  if (repo.dirty_worktree === true) {
    if (strict) {
      conflicts.push({
        id: "repo_dirty_worktree",
        title: "Dirty worktree in strict mode",
        detail:
          "Strict mode blocks target preview readiness while the supplied repo context says the worktree is dirty.",
        fields: ["dirty_worktree"],
      });
    } else {
      warnings.push({
        id: "repo_dirty_worktree",
        severity: "warning",
        title: "Dirty worktree",
        detail:
          "The supplied repo context says the worktree is dirty. Review unrelated local changes before implementation.",
      });
    }
  }

  const missingFiles = uniqueStrings(repo.expected_files_missing ?? []);
  if (missingFiles.length > 0) {
    gaps.push({
      id: "expected_files_missing",
      severity: "blocking",
      title: "Expected files are missing",
      detail: "The supplied repo context says one or more packet-expected files are missing locally.",
      refs: missingFiles,
    });
  }
}

function resolveMapping(
  packet: AgWorkResumePacketV02,
  mappings: AgWorkResumeTargetWorkMapping[],
) {
  const matching = mappings.filter(
    (mapping) =>
      mapping.foreign_scope === packet.source_work.scope &&
      mapping.foreign_work_id === packet.source_work.work_id,
  );
  return {
    confirmed: matching.find((mapping) => mapping.mapping_status === "confirmed") ?? null,
    proposed: matching.find((mapping) => mapping.mapping_status === "proposed") ?? null,
    rejected: matching.find((mapping) => mapping.mapping_status === "rejected") ?? null,
  };
}

function matchesMapping(
  workItem: AgWorkResumeTargetWorkItem,
  mapping: AgWorkResumeTargetWorkMapping,
) {
  return (
    workItem.scope === mapping.local_scope &&
    workItem.work_id === mapping.local_work_id
  );
}

function compareWorkItem(
  packet: AgWorkResumePacketV02,
  localWork: AgWorkResumeTargetWorkItem,
) {
  const pairs = [
    ["title", packet.source_work.title, localWork.title],
    ["status", packet.source_work.status, localWork.status],
    ["next_action", packet.source_work.next_action, localWork.next_action],
  ] as const;
  return pairs
    .filter(([, packetValue, localValue]) => packetValue !== localValue)
    .map(([field, packetValue, localValue]) => ({
      field,
      packet_value: packetValue,
      local_value: localValue,
    }));
}

function selectStatus({
  unsafePolicy,
  conflicts,
  gaps,
  runtime,
  localWorkMappingMissing,
}: {
  unsafePolicy: boolean;
  conflicts: AgWorkResumeTargetPreviewConflict[];
  gaps: AgWorkResumeTargetPreviewGap[];
  runtime: AgWorkResumeTargetRuntimeContext | null;
  localWorkMappingMissing: boolean;
}): AgWorkResumeTargetPreviewStatus {
  if (unsafePolicy) return "blocked";
  if (conflicts.length > 0) return "conflict";
  if (!runtime || !runtime.runtime_available) return "context_only";
  if (localWorkMappingMissing) return "needs_mapping";
  if (gaps.some((gap) => gap.severity === "blocking")) return "blocked";
  return "ready_for_user_core_review";
}

function nextStepForStatus(status: AgWorkResumeTargetPreviewStatus) {
  switch (status) {
    case "ready_for_user_core_review":
      return "User/Core should review and confirm the local mapping and authority choices before any Codex start.";
    case "context_only":
      return "Use the packet as human-readable context only until local runtime and work mapping context are supplied.";
    case "needs_mapping":
      return "User/Core must confirm whether the foreign work maps to an existing local work item; do not auto-create one.";
    case "conflict":
      return "Resolve conflicts before implementation, mapping, proof/evidence recording, session binding, or Codex start.";
    case "blocked":
      return "Stop and resolve blocking gaps before continuing to user/Core review.";
  }
}

function buildPacketSummary(packet: AgWorkResumePacketV02) {
  return {
    packet_id: packet.packet_id,
    source_work: {
      scope: packet.source_work.scope,
      work_id: packet.source_work.work_id,
      title: packet.source_work.title,
      status: packet.source_work.status,
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
    foreign_refs: {
      foreign_action_ref_ids: packet.continuity.foreign_action_refs.map(
        (ref) => ref.id,
      ),
      foreign_evidence_refs: [...packet.continuity.foreign_evidence_refs],
      foreign_session_refs: [...packet.continuity.foreign_session_refs],
      foreign_evidence_pack_ref: packet.continuity.foreign_evidence_pack_ref,
      local_proof_records_created: false as const,
      local_evidence_records_created: false as const,
      local_sessions_bound: false as const,
      note:
        "Foreign action/evidence/session refs remain foreign; this preview does not convert them into local proof, evidence, or session records.",
    },
  };
}

function buildLocalContextSummary(
  packet: AgWorkResumePacketV02,
  runtime: AgWorkResumeTargetRuntimeContext | null,
  repo: AgWorkResumeTargetRepoContext | null,
  mappingState: ReturnType<typeof resolveMapping>,
): AgWorkResumeTargetPreview["local_context_summary"] {
  const mapping =
    mappingState.confirmed ?? mappingState.proposed ?? mappingState.rejected ?? null;
  return {
    runtime: {
      provided: Boolean(runtime),
      runtime_available: runtime?.runtime_available === true,
      scope: runtime?.scope ?? null,
      work_item: runtime?.work_item ?? null,
      work_brief_available: runtime?.work_brief_available === true,
      codex_read_brief_command_available:
        runtime?.codex_read_brief_command_available === true,
      evidence_recording_authorized:
        runtime?.evidence_recording_authorized === true,
      proof_recording_authorized: runtime?.proof_recording_authorized === true,
      session_binding_authorized: runtime?.session_binding_authorized === true,
    },
    repo: {
      provided: Boolean(repo),
      repo_available: repo?.repo_available === true,
      remote: repo?.remote ?? null,
      base_branch: repo?.base_branch ?? null,
      base_commit_reachable: repo?.base_commit_reachable ?? null,
      current_branch: repo?.current_branch ?? null,
      head_commit: repo?.head_commit ?? null,
      dirty_worktree: repo?.dirty_worktree ?? null,
      expected_files_present: uniqueStrings(repo?.expected_files_present ?? []),
      expected_files_missing: uniqueStrings(repo?.expected_files_missing ?? []),
    },
    mapping: {
      status: mapping?.mapping_status ?? "missing",
      foreign_scope: packet.source_work.scope,
      foreign_work_id: packet.source_work.work_id,
      local_scope: mapping?.local_scope ?? null,
      local_work_id: mapping?.local_work_id ?? null,
      confirmed_by: mapping?.confirmed_by ?? null,
    },
    foreign_refs_remain_foreign: true,
  };
}

function addRecommendation(
  recommendations: Map<string, AgWorkResumeTargetPreviewRecommendation>,
  id: string,
  text: string,
) {
  if (!recommendations.has(id)) {
    recommendations.set(id, { id, text });
  }
}

function uniqueStrings(values: string[]) {
  const result: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const cleaned = clean(value);
    if (!cleaned || seen.has(cleaned)) continue;
    seen.add(cleaned);
    result.push(cleaned);
  }
  return result;
}

function clean(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
