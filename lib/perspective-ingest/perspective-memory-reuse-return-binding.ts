export const PERSPECTIVE_MEMORY_REUSE_RETURN_BINDING_VERSION =
  "perspective_memory_reuse_return_binding.v0.1";
export const PERSPECTIVE_MEMORY_REUSE_RETURN_BINDING_PREVIEW_VERSION =
  "perspective_memory_reuse_return_binding_preview.v0.1";

const RETURN_BINDING_TEXT_LIMIT = 900;
const RETURN_BINDING_REF_LIMIT = 220;
const RETURN_BINDING_FILE_LIMIT = 260;
const RETURN_BINDING_ARRAY_LIMIT = 80;

export type PerspectiveMemoryReuseReturnBindingVerificationInput = {
  command: string;
  status?: "passed" | "failed" | "skipped" | "unknown" | null;
  notes?: string | null;
};

export type PerspectiveMemoryReuseReturnBindingSkippedCheckInput = {
  check: string;
  reason: string;
};

export type PerspectiveMemoryReuseReturnBindingCandidateMemoryPreviewInput = {
  title: string;
  summary: string;
  source_refs?: string[] | null;
  risk_notes?: string[] | null;
  carry_forward_questions?: string[] | null;
  suggested_next_review_action?: string | null;
};

export type PerspectiveMemoryReuseReturnBindingInput = {
  reuse_packet_id: string;
  codex_run_ref: string;
  returned_envelope_ref: string;
  returned_at: string;
  changed_files: string[];
  verification: PerspectiveMemoryReuseReturnBindingVerificationInput[];
  skipped_checks: PerspectiveMemoryReuseReturnBindingSkippedCheckInput[];
  remaining_friction: string[];
  follow_up_candidate_memory_preview:
    PerspectiveMemoryReuseReturnBindingCandidateMemoryPreviewInput;
  operator_notes?: string[] | null;
  nowIso: string;
  bindingId?: string | null;
};

export type PerspectiveMemoryReuseReturnBindingV01 = {
  binding_version: typeof PERSPECTIVE_MEMORY_REUSE_RETURN_BINDING_VERSION;
  binding_id: string;
  created_at: string;
  reuse_packet_id: string;
  codex_run_ref: string;
  returned_envelope_ref: string;
  returned_at: string;
  changed_files: string[];
  verification: Array<{
    command: string;
    status: "passed" | "failed" | "skipped" | "unknown";
    notes: string;
  }>;
  skipped_checks: Array<{
    check: string;
    reason: string;
  }>;
  remaining_friction: string[];
  follow_up_candidate_memory_preview: {
    preview_version: typeof PERSPECTIVE_MEMORY_REUSE_RETURN_BINDING_PREVIEW_VERSION;
    title: string;
    summary: string;
    source_refs: string[];
    risk_notes: string[];
    carry_forward_questions: string[];
    suggested_next_review_action: string;
    preview_only: true;
    authority_boundary: {
      memory_item_created: false;
      product_boundary_record_created: false;
      perspective_memory_persistence_write_created: false;
      core_decision_created: false;
      core_memory_created: false;
      runtime_injection_created: false;
      automatic_synthesis_created: false;
    };
  };
  operator_notes: string[];
  return_quality_summary: {
    complete_enough_for_future_memory_review: boolean;
    missing_return_sections: string[];
    changed_file_count: number;
    verification_count: number;
    skipped_check_count: number;
    remaining_friction_count: number;
    has_follow_up_candidate_memory_preview: boolean;
  };
  authority_boundary: {
    deterministic_local_preview: true;
    return_binding_created: true;
    return_binding_persisted: false;
    reuse_packet_persisted: false;
    follow_up_candidate_memory_created: false;
    memory_item_created: false;
    product_boundary_record_created: false;
    perspective_memory_persistence_write_created: false;
    proof_evidence_written: false;
    db_schema_changed: false;
    migration_created: false;
    runtime_authority_created: false;
    runtime_started: false;
    hidden_background_daemon_created: false;
    provider_model_call_created: false;
    openai_api_call_created: false;
    codex_sdk_execution_created: false;
    mcp_tool_call_created: false;
    github_mutation_created: false;
    augnes_state_commit_reject_created: false;
    core_decision_created: false;
    core_memory_created: false;
    runtime_injection_created: false;
    automatic_synthesis_created: false;
    automatic_memory_creation_created: false;
    default_user_db_write_created: false;
  };
};

export type PerspectiveMemoryReuseReturnBindingResultV01 = {
  binding: PerspectiveMemoryReuseReturnBindingV01;
  return_binding_summary: string;
};

export function buildPerspectiveMemoryReuseReturnBinding(
  input: PerspectiveMemoryReuseReturnBindingInput,
): PerspectiveMemoryReuseReturnBindingResultV01 {
  const reusePacketId = boundText(input.reuse_packet_id, RETURN_BINDING_REF_LIMIT);
  const codexRunRef = boundText(input.codex_run_ref, RETURN_BINDING_REF_LIMIT);
  const returnedEnvelopeRef = boundText(
    input.returned_envelope_ref,
    RETURN_BINDING_REF_LIMIT,
  );
  const returnedAt = boundText(input.returned_at, RETURN_BINDING_REF_LIMIT);
  const changedFiles = uniqueBoundedStrings(
    input.changed_files,
    RETURN_BINDING_ARRAY_LIMIT,
    RETURN_BINDING_FILE_LIMIT,
  );
  const verification = normalizeVerification(input.verification);
  const skippedChecks = normalizeSkippedChecks(input.skipped_checks);
  const remainingFriction = uniqueBoundedStrings(
    input.remaining_friction,
    RETURN_BINDING_ARRAY_LIMIT,
    RETURN_BINDING_TEXT_LIMIT,
  );
  const followUpCandidateMemoryPreview =
    buildFollowUpCandidateMemoryPreview(
      input.follow_up_candidate_memory_preview,
    );
  const operatorNotes = uniqueBoundedStrings(
    input.operator_notes ?? [],
    RETURN_BINDING_ARRAY_LIMIT,
    RETURN_BINDING_TEXT_LIMIT,
  );
  const missingReturnSections = collectMissingReturnSections({
    reusePacketId,
    codexRunRef,
    returnedEnvelopeRef,
    returnedAt,
    changedFiles,
    verification,
    skippedChecks,
    remainingFriction,
    followUpCandidateMemoryPreview,
  });

  const binding: PerspectiveMemoryReuseReturnBindingV01 = {
    binding_version: PERSPECTIVE_MEMORY_REUSE_RETURN_BINDING_VERSION,
    binding_id: boundText(
      input.bindingId ||
        buildDefaultBindingId(reusePacketId, codexRunRef, returnedEnvelopeRef),
      RETURN_BINDING_REF_LIMIT,
    ),
    created_at: boundText(input.nowIso, RETURN_BINDING_REF_LIMIT),
    reuse_packet_id: reusePacketId,
    codex_run_ref: codexRunRef,
    returned_envelope_ref: returnedEnvelopeRef,
    returned_at: returnedAt,
    changed_files: changedFiles,
    verification,
    skipped_checks: skippedChecks,
    remaining_friction: remainingFriction,
    follow_up_candidate_memory_preview: followUpCandidateMemoryPreview,
    operator_notes: operatorNotes,
    return_quality_summary: {
      complete_enough_for_future_memory_review:
        missingReturnSections.length === 0,
      missing_return_sections: missingReturnSections,
      changed_file_count: changedFiles.length,
      verification_count: verification.length,
      skipped_check_count: skippedChecks.length,
      remaining_friction_count: remainingFriction.length,
      has_follow_up_candidate_memory_preview:
        followUpCandidateMemoryPreview.title.length > 0 &&
        followUpCandidateMemoryPreview.summary.length > 0,
    },
    authority_boundary: buildAuthorityBoundary(),
  };

  return {
    binding,
    return_binding_summary: buildReturnBindingSummary(binding),
  };
}

export function buildReturnBindingSummary(
  binding: PerspectiveMemoryReuseReturnBindingV01,
): string {
  const lines = [
    "# Perspective Memory Reuse Return Binding",
    "",
    `binding_id: ${binding.binding_id}`,
    `reuse_packet_id: ${binding.reuse_packet_id || "missing"}`,
    `codex_run_ref: ${binding.codex_run_ref || "missing"}`,
    `returned_envelope_ref: ${binding.returned_envelope_ref || "missing"}`,
    `returned_at: ${binding.returned_at || "missing"}`,
    `complete_enough_for_future_memory_review: ${String(
      binding.return_quality_summary.complete_enough_for_future_memory_review,
    )}`,
    "",
    "## Changed Files",
    ...listOrNone(binding.changed_files),
    "",
    "## Verification",
    ...listOrNone(
      binding.verification.map((entry) =>
        [entry.command, entry.status, entry.notes].filter(Boolean).join(" - "),
      ),
    ),
    "",
    "## Skipped Checks",
    ...listOrNone(
      binding.skipped_checks.map((entry) => `${entry.check}: ${entry.reason}`),
    ),
    "",
    "## Remaining Friction",
    ...listOrNone(binding.remaining_friction),
    "",
    "## Follow-Up Candidate Memory Preview",
    `- title: ${binding.follow_up_candidate_memory_preview.title || "missing"}`,
    `- summary: ${
      binding.follow_up_candidate_memory_preview.summary || "missing"
    }`,
    "- preview_only: true",
    "",
    "## Missing Return Sections",
    ...listOrNone(binding.return_quality_summary.missing_return_sections),
    "",
    "## Boundary",
    "- Preview only; no memory item created.",
    "- No product boundary record created.",
    "- No persistence write.",
    "- No Core decision or Core memory.",
    "- No runtime injection.",
    "- No automatic synthesis.",
  ];
  return lines.join("\n");
}

function normalizeVerification(
  verification: PerspectiveMemoryReuseReturnBindingVerificationInput[],
) {
  const seen = new Set<string>();
  const result: PerspectiveMemoryReuseReturnBindingV01["verification"] = [];
  for (const entry of verification) {
    const command = boundText(entry.command, RETURN_BINDING_TEXT_LIMIT);
    const normalized = normalizeText(command);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push({
      command,
      status: entry.status ?? "unknown",
      notes: boundText(entry.notes ?? "", RETURN_BINDING_TEXT_LIMIT),
    });
    if (result.length >= RETURN_BINDING_ARRAY_LIMIT) break;
  }
  return result;
}

function normalizeSkippedChecks(
  skippedChecks: PerspectiveMemoryReuseReturnBindingSkippedCheckInput[],
) {
  const seen = new Set<string>();
  const result: PerspectiveMemoryReuseReturnBindingV01["skipped_checks"] = [];
  for (const entry of skippedChecks) {
    const check = boundText(entry.check, RETURN_BINDING_TEXT_LIMIT);
    const reason = boundText(entry.reason, RETURN_BINDING_TEXT_LIMIT);
    const normalized = normalizeText(`${check}:${reason}`);
    if (!normalizeText(check) || !normalizeText(reason) || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    result.push({ check, reason });
    if (result.length >= RETURN_BINDING_ARRAY_LIMIT) break;
  }
  return result;
}

function buildFollowUpCandidateMemoryPreview(
  input: PerspectiveMemoryReuseReturnBindingCandidateMemoryPreviewInput,
): PerspectiveMemoryReuseReturnBindingV01["follow_up_candidate_memory_preview"] {
  return {
    preview_version: PERSPECTIVE_MEMORY_REUSE_RETURN_BINDING_PREVIEW_VERSION,
    title: boundText(input.title, 180),
    summary: boundText(input.summary, RETURN_BINDING_TEXT_LIMIT),
    source_refs: uniqueBoundedStrings(
      input.source_refs ?? [],
      RETURN_BINDING_ARRAY_LIMIT,
      RETURN_BINDING_FILE_LIMIT,
    ),
    risk_notes: uniqueBoundedStrings(
      input.risk_notes ?? [],
      RETURN_BINDING_ARRAY_LIMIT,
      RETURN_BINDING_TEXT_LIMIT,
    ),
    carry_forward_questions: uniqueBoundedStrings(
      input.carry_forward_questions ?? [],
      RETURN_BINDING_ARRAY_LIMIT,
      RETURN_BINDING_TEXT_LIMIT,
    ),
    suggested_next_review_action: boundText(
      input.suggested_next_review_action ?? "",
      RETURN_BINDING_TEXT_LIMIT,
    ),
    preview_only: true,
    authority_boundary: {
      memory_item_created: false,
      product_boundary_record_created: false,
      perspective_memory_persistence_write_created: false,
      core_decision_created: false,
      core_memory_created: false,
      runtime_injection_created: false,
      automatic_synthesis_created: false,
    },
  };
}

function collectMissingReturnSections(input: {
  reusePacketId: string;
  codexRunRef: string;
  returnedEnvelopeRef: string;
  returnedAt: string;
  changedFiles: string[];
  verification: PerspectiveMemoryReuseReturnBindingV01["verification"];
  skippedChecks: PerspectiveMemoryReuseReturnBindingV01["skipped_checks"];
  remainingFriction: string[];
  followUpCandidateMemoryPreview:
    PerspectiveMemoryReuseReturnBindingV01["follow_up_candidate_memory_preview"];
}) {
  const missing: string[] = [];
  if (!input.reusePacketId) missing.push("reuse_packet_id");
  if (!input.codexRunRef) missing.push("codex_run_ref");
  if (!input.returnedEnvelopeRef) missing.push("returned_envelope_ref");
  if (!input.returnedAt) missing.push("returned_at");
  if (input.changedFiles.length === 0) missing.push("changed_files");
  if (input.verification.length === 0) missing.push("verification");
  if (input.skippedChecks.length === 0) missing.push("skipped_checks");
  if (input.remainingFriction.length === 0) missing.push("remaining_friction");
  if (!input.followUpCandidateMemoryPreview.title) {
    missing.push("follow_up_candidate_memory_preview.title");
  }
  if (!input.followUpCandidateMemoryPreview.summary) {
    missing.push("follow_up_candidate_memory_preview.summary");
  }
  return missing;
}

function buildAuthorityBoundary(): PerspectiveMemoryReuseReturnBindingV01["authority_boundary"] {
  return {
    deterministic_local_preview: true,
    return_binding_created: true,
    return_binding_persisted: false,
    reuse_packet_persisted: false,
    follow_up_candidate_memory_created: false,
    memory_item_created: false,
    product_boundary_record_created: false,
    perspective_memory_persistence_write_created: false,
    proof_evidence_written: false,
    db_schema_changed: false,
    migration_created: false,
    runtime_authority_created: false,
    runtime_started: false,
    hidden_background_daemon_created: false,
    provider_model_call_created: false,
    openai_api_call_created: false,
    codex_sdk_execution_created: false,
    mcp_tool_call_created: false,
    github_mutation_created: false,
    augnes_state_commit_reject_created: false,
    core_decision_created: false,
    core_memory_created: false,
    runtime_injection_created: false,
    automatic_synthesis_created: false,
    automatic_memory_creation_created: false,
    default_user_db_write_created: false,
  };
}

function buildDefaultBindingId(
  reusePacketId: string,
  codexRunRef: string,
  returnedEnvelopeRef: string,
) {
  const parts = [reusePacketId, codexRunRef, returnedEnvelopeRef]
    .map((part) => normalizeText(part).replace(/[^a-z0-9]+/g, "-"))
    .filter(Boolean)
    .map((part) => part.slice(0, 54));
  return `perspective-memory-reuse-return-binding:${parts.join(":") || "missing"}`;
}

function listOrNone(values: string[]) {
  if (values.length === 0) return ["- none"];
  return values.map((value) => `- ${value}`);
}

function uniqueBoundedStrings(
  values: string[],
  limit: number,
  maxLength: number,
) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const bounded = boundText(value, maxLength);
    const normalized = normalizeText(bounded);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(bounded);
    if (result.length >= limit) break;
  }
  return result;
}

function boundText(value: string, maxLength: number) {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (normalized.length <= maxLength) return normalized;
  return normalized.slice(0, maxLength);
}

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}
