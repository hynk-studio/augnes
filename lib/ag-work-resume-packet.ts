import { createHash } from "node:crypto";
import type { WorkBrief, WorkEvent, WorkProofActionRecord } from "@/lib/work";

export const AG_WORK_RESUME_PACKET_SCHEMA_V0_2 =
  "augnes.ag_work_resume_packet.v0_2" as const;

const PACKET_KIND = "ag_work_resume_packet" as const;
const CANONICALIZATION = "augnes-json-c14n-v0_1" as const;
const DEFAULT_MAX_RECENT_WORK_EVENTS = 10;
const DEFAULT_MAX_FOREIGN_EVIDENCE_REFS = 20;

const FIXED_SAFETY_BOUNDARIES = [
  "Resume packet is read-only context.",
  "Resume packet is not approval.",
  "Resume packet is not proof/evidence authorization.",
  "Resume packet is not Codex execution authority.",
  "Resume packet is not merge/publish authority.",
  "Foreign refs remain foreign until user/Core confirms a local mapping.",
];

const FIXED_STOP_CONDITIONS = [
  "Local runtime/work mapping is missing.",
  "codex:read-brief fails after a future mapping is confirmed.",
  "Expected scope is ambiguous.",
  "Target policy requests execution/merge/publication/state mutation.",
  "Unsafe redaction content is detected.",
];

const TARGET_RUNTIME_POLICY = {
  preview_only_by_default: true,
  may_map_to_existing_local_work_item: "requires explicit user/Core approval",
  may_create_local_work_item: false,
  may_record_evidence:
    "requires explicit user/Core approval and known local work_id",
  may_record_proof:
    "requires explicit user/Core approval and known local work_id",
  may_bind_session: false,
  may_commit_or_reject_state: false,
  may_execute_codex: false,
  may_merge: false,
  may_publish_or_replay: false,
} as const;

export type AgWorkResumePacketGitInput = {
  remote: string;
  base_branch: string;
  base_commit: string;
  working_branch: string;
  head_commit: string;
  related_pr: string | null;
  dirty_worktree: boolean;
};

export type AgWorkResumePacketIssuerInput = {
  runtime_instance_id: string;
  source_local_label: string;
  created_by_surface: string;
  export_event_id?: string | null;
};

export type AgWorkResumePacketHandoffLikeInput = {
  handoff_id?: string | null;
  status?: string | null;
  expected_files?: string[];
  expected_checks?: string[];
  expected_execution_surfaces?: string[];
  forbidden_surfaces?: string[];
  stop_conditions?: string[];
  safety_boundaries?: string[];
};

export type AgWorkResumePacketStateBriefLike = {
  runtime?: string;
  scope?: string;
  as_of?: string;
  generated_at?: string;
  agent_instructions?: string[];
  agent_handoff?: {
    current_status?: {
      notable_state_keys?: string[];
    };
    next_recommended_action?: {
      related_state_keys?: string[];
    };
    codex_handoff?: {
      task_brief?: string;
      constraints?: string[];
      likely_files?: string[];
      verification_commands?: string[];
    };
  };
};

export type AgWorkResumePacketBuilderInput = {
  workBrief: WorkBrief;
  stateBrief: AgWorkResumePacketStateBriefLike;
  handoffDraft?: AgWorkResumePacketHandoffLikeInput | null;
  git: AgWorkResumePacketGitInput;
  issuer: AgWorkResumePacketIssuerInput;
  created_at?: string;
  expires_at?: string | null;
  max_recent_work_events?: number;
  max_foreign_evidence_refs?: number;
  foreign_evidence_refs?: string[];
  foreign_session_refs?: string[];
  foreign_evidence_pack_ref?: string | null;
};

export type AgWorkResumePacketV02 = {
  schema: typeof AG_WORK_RESUME_PACKET_SCHEMA_V0_2;
  packet_kind: typeof PACKET_KIND;
  packet_id: string;
  created_at: string;
  expires_at: string | null;
  issuer: {
    runtime: "augnes";
    runtime_instance_id: string;
    source_local_label: string;
    created_by_surface: string;
    export_event_id: string | null;
  };
  integrity: {
    canonicalization: typeof CANONICALIZATION;
    payload_hash: string;
    redaction_report_hash: string;
    signature: null;
  };
  source_work: {
    scope: string;
    work_id: string;
    title: string;
    status: string;
    priority: string;
    summary: string;
    next_action: string;
    related_state_keys: string[];
  };
  git: AgWorkResumePacketGitInput;
  handoff: {
    handoff_id: string;
    status: string;
    expected_files: string[];
    expected_checks: string[];
    expected_execution_surfaces: string[];
    forbidden_surfaces: string[];
    stop_conditions: string[];
    safety_boundaries: string[];
  };
  continuity: {
    recent_work_events: AgWorkResumePacketWorkEventSummary[];
    foreign_action_refs: AgWorkResumePacketForeignActionRef[];
    foreign_evidence_refs: string[];
    foreign_session_refs: string[];
    foreign_evidence_pack_ref: string | null;
    proof_marker_note: "state_key:null action records are proof-only";
  };
  target_runtime_policy: typeof TARGET_RUNTIME_POLICY;
  redaction: {
    raw_db_paths_included: false;
    secrets_included: false;
    tunnel_urls_included: false;
    local_absolute_paths_included: false;
    screenshots_or_media_included: false;
    raw_openai_responses_included: false;
    notes: string[];
  };
  bounds: {
    max_recent_work_events: number;
    max_foreign_evidence_refs: number;
    summaries_only: true;
    raw_logs_included: false;
  };
};

export type AgWorkResumePacketWorkEventSummary = {
  id: string;
  actor: string;
  event_type: string;
  summary: string;
  result_status: string | null;
  result_kind: string | null;
  related_pr: string | null;
  related_state_keys: string[];
  created_at: string;
};

export type AgWorkResumePacketForeignActionRef = {
  id: string;
  title?: string;
  status?: string;
  proof_marker_type?: string;
  created_at?: string;
  ref_kind: "foreign_action_ref";
};

type RedactionNoteSet = Set<string>;

export function buildAgWorkResumePacketPreview(
  input: AgWorkResumePacketBuilderInput,
): AgWorkResumePacketV02 {
  const notes: RedactionNoteSet = new Set();
  const maxRecentWorkEvents = clampPositiveInteger(
    input.max_recent_work_events,
    DEFAULT_MAX_RECENT_WORK_EVENTS,
  );
  const maxForeignEvidenceRefs = clampPositiveInteger(
    input.max_foreign_evidence_refs,
    DEFAULT_MAX_FOREIGN_EVIDENCE_REFS,
  );
  const scope = safeRequiredString(
    input.workBrief.work.scope || input.workBrief.scope,
    "project:augnes",
    notes,
  );
  const workId = safeRequiredString(
    input.workBrief.work.work_id || input.workBrief.work_id,
    "AG-UNKNOWN",
    notes,
  );
  const createdAt =
    cleanString(input.created_at) ??
    cleanString(input.workBrief.as_of) ??
    cleanString(input.stateBrief.generated_at) ??
    cleanString(input.stateBrief.as_of) ??
    "1970-01-01T00:00:00.000Z";
  const packetId = `resume-packet:preview:${safeIdSegment(scope)}:${safeIdSegment(
    workId,
  )}`;

  const sourceWork = {
    scope,
    work_id: workId,
    title: safeRequiredString(
      input.workBrief.work.title,
      "Omitted unsafe source work title.",
      notes,
    ),
    status: safeRequiredString(
      input.workBrief.work.status,
      "unknown",
      notes,
    ),
    priority: safeRequiredString(
      input.workBrief.work.priority,
      "normal",
      notes,
    ),
    summary: safeRequiredString(
      truncate(input.workBrief.work.summary || input.workBrief.codex_handoff.task_brief, 600),
      "Omitted unsafe source work summary.",
      notes,
    ),
    next_action: safeRequiredString(
      input.workBrief.work.next_action || input.workBrief.next_action,
      "Continue only after user/Core confirms local runtime/work mapping.",
      notes,
    ),
    related_state_keys: uniqueSanitizedStrings(
      [
        ...input.workBrief.related_state_keys,
        ...input.workBrief.work.related_state_keys,
        ...(input.stateBrief.agent_handoff?.current_status?.notable_state_keys ?? []),
        ...(input.stateBrief.agent_handoff?.next_recommended_action
          ?.related_state_keys ?? []),
      ],
      notes,
    ),
  };

  const redaction: AgWorkResumePacketV02["redaction"] = {
    raw_db_paths_included: false,
    secrets_included: false,
    tunnel_urls_included: false,
    local_absolute_paths_included: false,
    screenshots_or_media_included: false,
    raw_openai_responses_included: false,
    notes: [] as string[],
  };

  const packetWithoutHashes: AgWorkResumePacketV02 = {
    schema: AG_WORK_RESUME_PACKET_SCHEMA_V0_2,
    packet_kind: PACKET_KIND,
    packet_id: packetId,
    created_at: createdAt,
    expires_at: input.expires_at ?? null,
    issuer: {
      runtime: "augnes",
      runtime_instance_id: safeRequiredString(
        input.issuer.runtime_instance_id,
        "runtime-instance:unknown",
        notes,
      ),
      source_local_label: safeRequiredString(
        input.issuer.source_local_label,
        "source-local",
        notes,
      ),
      created_by_surface: safeRequiredString(
        input.issuer.created_by_surface,
        "builder_preview",
        notes,
      ),
      export_event_id: safeNullableString(input.issuer.export_event_id, notes),
    },
    integrity: {
      canonicalization: CANONICALIZATION,
      payload_hash: "sha256:pending",
      redaction_report_hash: "sha256:pending",
      signature: null,
    },
    source_work: sourceWork,
    git: sanitizeGitInput(input.git, notes),
    handoff: buildHandoff(input, scope, workId, notes),
    continuity: {
      recent_work_events: input.workBrief.recent_events
        .slice(0, maxRecentWorkEvents)
        .map((event) => summarizeWorkEvent(event, notes)),
      foreign_action_refs: collectForeignActionRefs(input.workBrief, notes),
      foreign_evidence_refs: uniqueSanitizedStrings(
        input.foreign_evidence_refs ?? [],
        notes,
      ).slice(0, maxForeignEvidenceRefs),
      foreign_session_refs: uniqueSanitizedStrings(
        input.foreign_session_refs ?? [],
        notes,
      ),
      foreign_evidence_pack_ref: safeNullableString(
        input.foreign_evidence_pack_ref,
        notes,
      ),
      proof_marker_note: "state_key:null action records are proof-only",
    },
    target_runtime_policy: TARGET_RUNTIME_POLICY,
    redaction,
    bounds: {
      max_recent_work_events: maxRecentWorkEvents,
      max_foreign_evidence_refs: maxForeignEvidenceRefs,
      summaries_only: true,
      raw_logs_included: false,
    },
  };

  packetWithoutHashes.redaction.notes = [...notes].sort();
  const redactionReportHash = sha256(canonicalize(packetWithoutHashes.redaction));
  const payloadForHash: AgWorkResumePacketV02 = {
    ...packetWithoutHashes,
    integrity: {
      ...packetWithoutHashes.integrity,
      payload_hash: "sha256:null",
      redaction_report_hash: redactionReportHash,
    },
  };
  const payloadHash = sha256(canonicalize(payloadForHash));

  return {
    ...packetWithoutHashes,
    integrity: {
      canonicalization: CANONICALIZATION,
      payload_hash: payloadHash,
      redaction_report_hash: redactionReportHash,
      signature: null,
    },
  };
}

function buildHandoff(
  input: AgWorkResumePacketBuilderInput,
  scope: string,
  workId: string,
  notes: RedactionNoteSet,
): AgWorkResumePacketV02["handoff"] {
  const stateCodexHandoff = input.stateBrief.agent_handoff?.codex_handoff;
  const expectedFiles = uniqueSanitizedStrings(
    [
      ...(input.handoffDraft?.expected_files ?? []),
      ...input.workBrief.related_proof.docs,
      ...(stateCodexHandoff?.likely_files ?? []),
    ],
    notes,
  );
  const expectedChecks = uniqueSanitizedStrings(
    [
      ...(input.handoffDraft?.expected_checks ?? []),
      ...input.workBrief.codex_handoff.suggested_verification,
      ...(stateCodexHandoff?.verification_commands ?? []),
    ],
    notes,
  );
  const safetyBoundaries = uniqueSanitizedStrings(
    [
      ...(input.handoffDraft?.safety_boundaries ?? []),
      ...FIXED_SAFETY_BOUNDARIES,
      ...(input.stateBrief.agent_instructions ?? []),
      ...input.workBrief.codex_handoff.constraints,
      ...(stateCodexHandoff?.constraints ?? []),
    ],
    notes,
  );

  return {
    handoff_id:
      safeNullableString(input.handoffDraft?.handoff_id, notes) ??
      `handoff:preview:${safeIdSegment(scope)}:${safeIdSegment(workId)}`,
    status: safeRequiredString(input.handoffDraft?.status, "ready", notes),
    expected_files: expectedFiles,
    expected_checks:
      expectedChecks.length > 0
        ? expectedChecks
        : ["Run local verification after user/Core confirms local mapping."],
    expected_execution_surfaces: uniqueSanitizedStrings(
      input.handoffDraft?.expected_execution_surfaces ?? [],
      notes,
    ),
    forbidden_surfaces: uniqueSanitizedStrings(
      input.handoffDraft?.forbidden_surfaces ?? [],
      notes,
    ),
    stop_conditions: uniqueSanitizedStrings(
      [...(input.handoffDraft?.stop_conditions ?? []), ...FIXED_STOP_CONDITIONS],
      notes,
    ),
    safety_boundaries: safetyBoundaries,
  };
}

function sanitizeGitInput(
  git: AgWorkResumePacketGitInput,
  notes: RedactionNoteSet,
): AgWorkResumePacketGitInput {
  return {
    remote: safeRequiredString(git.remote, "", notes),
    base_branch: safeRequiredString(git.base_branch, "", notes),
    base_commit: safeRequiredString(git.base_commit, "", notes),
    working_branch: safeRequiredString(git.working_branch, "", notes),
    head_commit: safeRequiredString(git.head_commit, "", notes),
    related_pr: safeNullableString(git.related_pr, notes),
    dirty_worktree: Boolean(git.dirty_worktree),
  };
}

function summarizeWorkEvent(
  event: WorkEvent,
  notes: RedactionNoteSet,
): AgWorkResumePacketWorkEventSummary {
  return {
    id: safeRequiredString(event.id, "work-event:unknown", notes),
    actor: safeRequiredString(event.actor, "unknown", notes),
    event_type: safeRequiredString(event.event_type, "note", notes),
    summary: safeRequiredString(
      truncate(event.summary, 400),
      "Omitted unsafe work event summary.",
      notes,
    ),
    result_status: safeNullableString(event.result_status, notes),
    result_kind: safeNullableString(event.result_kind, notes),
    related_pr: safeNullableString(event.related_pr, notes),
    related_state_keys: uniqueSanitizedStrings(event.related_state_keys, notes),
    created_at: safeRequiredString(event.created_at, "1970-01-01T00:00:00.000Z", notes),
  };
}

function collectForeignActionRefs(
  workBrief: WorkBrief,
  notes: RedactionNoteSet,
): AgWorkResumePacketForeignActionRef[] {
  const refsById = new Map<string, AgWorkResumePacketForeignActionRef>();
  for (const record of workBrief.related_proof.action_records) {
    const ref = formatForeignActionRecord(record, notes);
    refsById.set(ref.id, ref);
  }
  for (const actionId of workBrief.related_proof.action_ids) {
    const id = safeNullableString(actionId, notes);
    if (id && !refsById.has(id)) {
      refsById.set(id, { id, ref_kind: "foreign_action_ref" });
    }
  }
  return [...refsById.values()];
}

function formatForeignActionRecord(
  record: WorkProofActionRecord,
  notes: RedactionNoteSet,
): AgWorkResumePacketForeignActionRef {
  const ref: AgWorkResumePacketForeignActionRef = {
    id: safeRequiredString(record.id, "action:unknown", notes),
    ref_kind: "foreign_action_ref",
  };
  const title = safeNullableString(record.title, notes);
  const status = safeNullableString(record.status, notes);
  const proofMarkerType = safeNullableString(record.proof_marker_type, notes);
  const createdAt = safeNullableString(record.created_at, notes);
  if (title) ref.title = title;
  if (status) ref.status = status;
  if (proofMarkerType) ref.proof_marker_type = proofMarkerType;
  if (createdAt) ref.created_at = createdAt;
  return ref;
}

function uniqueSanitizedStrings(values: string[], notes: RedactionNoteSet) {
  const result: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const safe = safeNullableString(value, notes);
    if (!safe || seen.has(safe)) continue;
    seen.add(safe);
    result.push(safe);
  }
  return result;
}

function safeRequiredString(
  value: unknown,
  fallback: string,
  notes: RedactionNoteSet,
) {
  const safe = safeNullableString(value, notes);
  return safe ?? fallback;
}

function safeNullableString(value: unknown, notes: RedactionNoteSet) {
  const cleaned = cleanString(value);
  if (!cleaned) return null;
  const categories = unsafeCategories(cleaned);
  if (categories.length > 0) {
    for (const category of categories) notes.add(noteForCategory(category));
    return null;
  }
  return cleaned;
}

function cleanString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function unsafeCategories(value: string) {
  const categories: string[] = [];
  if (/http:\/\/localhost|https:\/\/localhost|http:\/\/127\.0\.0\.1|AUGNES_API_BASE_URL\s*=/i.test(value)) {
    categories.push("local_runtime_endpoint");
  }
  if (/trycloudflare\.com|ngrok-free\.app|ngrok\.io|loca\.lt/i.test(value)) {
    categories.push("tunnel_url");
  }
  if (/\/tmp\/augnes|(?:^|[^\w.-])[\w./-]+\.db(?:\b|$)/i.test(value)) {
    categories.push("raw_db_path");
  }
  if (/\/Users\/|\/home\/|\b[A-Za-z]:\\/i.test(value)) {
    categories.push("local_absolute_path");
  }
  if (/OPENAI_API_KEY\s*=|GITHUB_TOKEN\s*=|\bsk-[A-Za-z0-9_-]*|\bghp_[A-Za-z0-9_]*|\bgithub_pat_[A-Za-z0-9_]*|BEGIN (?:OPENSSH |RSA |)PRIVATE KEY/i.test(value)) {
    categories.push("secret_like_content");
  }
  return [...new Set(categories)];
}

function noteForCategory(category: string) {
  switch (category) {
    case "local_runtime_endpoint":
      return "omitted local-runtime endpoint-specific verification command";
    case "tunnel_url":
      return "omitted tunnel URL reference";
    case "raw_db_path":
      return "omitted raw DB path reference";
    case "local_absolute_path":
      return "omitted unsafe local path reference";
    case "secret_like_content":
      return "omitted secret-like verification content";
    default:
      return "omitted unsafe resume packet content";
  }
}

function safeIdSegment(value: string) {
  return value
    .trim()
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 3).trimEnd()}...`;
}

function clampPositiveInteger(value: number | undefined, fallback: number) {
  if (!Number.isInteger(value) || value === undefined || value <= 0) {
    return fallback;
  }
  return value;
}

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalize(item)).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalize(record[key])}`)
    .join(",")}}`;
}

function sha256(value: string) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}
