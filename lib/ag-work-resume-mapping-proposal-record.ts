import { createHash } from "node:crypto";
import type Database from "better-sqlite3";
import { openDatabase } from "@/lib/db";
import type { AgWorkResumePacketV02 } from "@/lib/ag-work-resume-packet";
import {
  buildAgWorkResumeMappingProposalPreview,
  type AgWorkResumeMappingProposalCandidate,
  type AgWorkResumeMappingProposalPreview,
  type AgWorkResumeMappingProposalPreviewInput,
} from "@/lib/ag-work-resume-mapping-proposal-preview";
import {
  preflightAgWorkResumePacket,
  type AgWorkResumePacketPreflightResult,
} from "@/lib/ag-work-resume-packet-preflight";

export type AgWorkResumeMappingProposalRecordStatus =
  | "proposed"
  | "needs_review";

export type AgWorkResumeMappingProposalRecordCreateInput = {
  packet: unknown;
  candidates: unknown;
  selected_candidate_id: unknown;
  proposed_by: unknown;
  proposal_reason: unknown;
  status?: unknown;
  expires_at?: unknown;
  source?: AgWorkResumeMappingProposalPreviewInput["source"];
  db?: Database.Database;
  now?: string;
};

export type AgWorkResumeMappingProposalRecordAuthorityBoundary = {
  proposal_record_created: boolean;
  confirmed_mapping_created: false;
  import_record_created: false;
  work_item_created: false;
  proof_recorded: false;
  evidence_recorded: false;
  session_bound: false;
  codex_executed: false;
  approval_granted: false;
  publish_retry_replay_authority: false;
  merge_authority: false;
  durable_approval: "user/Core gated";
  statement: string;
};

export type AgWorkResumeMappingProposalRecord = {
  proposal_id: string;
  record_kind: "ag_work_resume_mapping_proposal";
  schema: "augnes.ag_work_resume_mapping_proposal.v0_1";
  status: "proposed" | "needs_review" | "superseded" | "withdrawn" | "rejected" | "expired";
  foreign_scope: string;
  foreign_work_id: string;
  foreign_title: string;
  foreign_status: string | null;
  foreign_next_action: string | null;
  candidate_local_scope: string;
  candidate_local_work_id: string;
  candidate_title: string;
  candidate_status: string | null;
  candidate_next_action: string | null;
  packet_id: string;
  packet_hash: string;
  source_runtime_instance_id: string | null;
  source_packet_created_at: string | null;
  proposal_preview_id: string;
  proposal_preview_hash: string;
  match_confidence_label: string | null;
  comparison_summary: unknown[];
  gaps_summary: unknown[];
  conflicts_summary: unknown[];
  questions_summary: unknown[];
  foreign_refs_summary: Record<string, unknown>;
  repo_context_summary: Record<string, unknown>;
  redaction_summary: Record<string, unknown>;
  proposed_by: string;
  proposed_at: string;
  proposal_reason: string;
  expires_at: string | null;
  supersedes_proposal_id: string | null;
  superseded_by_proposal_id: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  authority_boundary: AgWorkResumeMappingProposalRecordAuthorityBoundary;
  created_at: string;
  updated_at: string;
};

export type AgWorkResumeMappingProposalRecordCreateResult = {
  ok: boolean;
  status:
    | "created"
    | "invalid_input"
    | "preflight_failed"
    | "preview_not_creatable"
    | "duplicate_active_proposal"
    | "db_error";
  proposal_id: string | null;
  record: AgWorkResumeMappingProposalRecord | null;
  preflight: AgWorkResumePacketPreflightResult | null;
  preview: AgWorkResumeMappingProposalPreview | null;
  warnings: string[];
  failures: string[];
  authority_boundary: AgWorkResumeMappingProposalRecordAuthorityBoundary;
  recommended_next_step: string;
};

type NormalizedCreateInput = {
  packet: AgWorkResumePacketV02;
  candidates: AgWorkResumeMappingProposalCandidate[];
  selected_candidate_id: string;
  proposed_by: string;
  proposal_reason: string;
  status: AgWorkResumeMappingProposalRecordStatus;
  expires_at: string | null;
  source: AgWorkResumeMappingProposalPreviewInput["source"];
};

type ProposalInsertRow = {
  proposal_id: string;
  record_kind: "ag_work_resume_mapping_proposal";
  schema: "augnes.ag_work_resume_mapping_proposal.v0_1";
  status: AgWorkResumeMappingProposalRecordStatus;
  foreign_scope: string;
  foreign_work_id: string;
  foreign_title: string;
  foreign_status: string | null;
  foreign_next_action: string | null;
  candidate_local_scope: string;
  candidate_local_work_id: string;
  candidate_title: string;
  candidate_status: string | null;
  candidate_next_action: string | null;
  packet_id: string;
  packet_hash: string;
  source_runtime_instance_id: string | null;
  source_packet_created_at: string | null;
  proposal_preview_id: string;
  proposal_preview_hash: string;
  match_confidence_label: string | null;
  comparison_summary: string;
  gaps_summary: string;
  conflicts_summary: string;
  questions_summary: string;
  foreign_refs_summary: string;
  repo_context_summary: string;
  redaction_summary: string;
  proposed_by: string;
  proposal_reason: string;
  expires_at: string | null;
  authority_boundary: string;
};

const RECORD_KIND = "ag_work_resume_mapping_proposal" as const;
const RECORD_SCHEMA = "augnes.ag_work_resume_mapping_proposal.v0_1" as const;
const RESULT_STATEMENT =
  "Proposal record creation is not mapping confirmation, not import, not proof/evidence authorization, not session binding, not Codex execution authority, and not merge/publish authority.";

export function createAgWorkResumeMappingProposalRecord(
  input: AgWorkResumeMappingProposalRecordCreateInput,
): AgWorkResumeMappingProposalRecordCreateResult {
  const validation = normalizeCreateInput(input);
  if ("error" in validation) {
    return failureResult({
      status: "invalid_input",
      failures: [validation.error],
      recommended_next_step:
        "Stop. Provide packet, candidates, selected_candidate_id, proposed_by, proposal_reason, status proposed/needs_review, and a valid future expires_at or null.",
    });
  }

  const normalized = validation.value;
  const preflight = preflightAgWorkResumePacket(normalized.packet, {
    strict: true,
    inputMode: "writer",
    rawInput: stableStringify(normalized.packet),
  });
  if (!preflight.ok) {
    return failureResult({
      status: "preflight_failed",
      preflight,
      failures: failedPreflightMessages(preflight),
      warnings: warningPreflightMessages(preflight),
      recommended_next_step:
        "Stop. Repair the AG Resume Packet until strict preflight passes before creating a proposal record.",
    });
  }

  const preview = buildAgWorkResumeMappingProposalPreview({
    packet: normalized.packet,
    candidates: normalized.candidates,
    selected_candidate_id: normalized.selected_candidate_id,
    strict: true,
    source: normalized.source,
  });
  if (preview.status !== "candidate_review") {
    return failureResult({
      status: "preview_not_creatable",
      preflight,
      preview,
      failures: [`Mapping proposal preview status is ${preview.status}.`],
      recommended_next_step: previewNotCreatableNextStep(preview),
    });
  }

  const proposalPreviewHash = hashValue(preview);
  const packetHash = packetHashFor(normalized.packet);
  const insertRow = buildInsertRow({
    input: normalized,
    preview,
    packetHash,
    proposalPreviewHash,
  });
  const db = input.db ?? openDatabase();
  const ownsDb = !input.db;

  try {
    const insertedRow = db.transaction(() => {
      db.prepare(
        `
          INSERT INTO ag_work_resume_mapping_proposals (
            proposal_id,
            record_kind,
            schema,
            status,
            foreign_scope,
            foreign_work_id,
            foreign_title,
            foreign_status,
            foreign_next_action,
            candidate_local_scope,
            candidate_local_work_id,
            candidate_title,
            candidate_status,
            candidate_next_action,
            packet_id,
            packet_hash,
            source_runtime_instance_id,
            source_packet_created_at,
            proposal_preview_id,
            proposal_preview_hash,
            match_confidence_label,
            comparison_summary,
            gaps_summary,
            conflicts_summary,
            questions_summary,
            foreign_refs_summary,
            repo_context_summary,
            redaction_summary,
            proposed_by,
            proposal_reason,
            expires_at,
            authority_boundary
          )
          VALUES (
            @proposal_id,
            @record_kind,
            @schema,
            @status,
            @foreign_scope,
            @foreign_work_id,
            @foreign_title,
            @foreign_status,
            @foreign_next_action,
            @candidate_local_scope,
            @candidate_local_work_id,
            @candidate_title,
            @candidate_status,
            @candidate_next_action,
            @packet_id,
            @packet_hash,
            @source_runtime_instance_id,
            @source_packet_created_at,
            @proposal_preview_id,
            @proposal_preview_hash,
            @match_confidence_label,
            @comparison_summary,
            @gaps_summary,
            @conflicts_summary,
            @questions_summary,
            @foreign_refs_summary,
            @repo_context_summary,
            @redaction_summary,
            @proposed_by,
            @proposal_reason,
            @expires_at,
            @authority_boundary
          )
        `,
      ).run(insertRow);

      return selectProposalRecordRow(db, insertRow.proposal_id);
    })();

    return {
      ok: true,
      status: "created",
      proposal_id: insertRow.proposal_id,
      record: parseProposalRecordRow(insertedRow),
      preflight,
      preview,
      warnings: warningPreflightMessages(preflight),
      failures: [],
      authority_boundary: buildAuthorityBoundary(true),
      recommended_next_step:
        "User/Core should review the proposal record. This is not mapping confirmation, import authorization, proof/evidence authorization, session binding, Codex execution authority, or merge/publish authority.",
    };
  } catch (error) {
    if (isDuplicateConstraintError(error)) {
      return failureResult({
        status: "duplicate_active_proposal",
        proposal_id: insertRow.proposal_id,
        preflight,
        preview,
        failures: [
          "An active proposed/needs_review mapping proposal already exists for this foreign work and candidate local work tuple.",
        ],
        warnings: warningPreflightMessages(preflight),
        recommended_next_step:
          "User/Core should review the existing active proposal or withdraw/reject/supersede it before creating another proposal for the same foreign/candidate tuple.",
      });
    }

    return failureResult({
      status: "db_error",
      proposal_id: insertRow.proposal_id,
      preflight,
      preview,
      failures: [
        `Failed to create mapping proposal record: ${
          error instanceof Error ? error.message : String(error)
        }`,
      ],
      warnings: warningPreflightMessages(preflight),
      recommended_next_step:
        "Stop. Inspect the database error before retrying proposal record creation.",
    });
  } finally {
    if (ownsDb) db.close();
  }
}

function normalizeCreateInput(
  input: AgWorkResumeMappingProposalRecordCreateInput,
): { value: NormalizedCreateInput } | { error: string } {
  if (!isRecord(input.packet)) {
    return { error: "packet must be an object." };
  }
  if (!Array.isArray(input.candidates)) {
    return { error: "candidates must be an array." };
  }
  for (const [index, candidate] of input.candidates.entries()) {
    const candidateError = validateCandidateShape(candidate, index);
    if (candidateError) {
      return { error: candidateError };
    }
  }
  const selectedCandidateId = cleanString(input.selected_candidate_id);
  if (!selectedCandidateId) {
    return { error: "selected_candidate_id must be a non-empty string." };
  }
  const proposedBy = cleanString(input.proposed_by);
  if (!proposedBy) {
    return { error: "proposed_by must be a non-empty string." };
  }
  const proposalReason = cleanString(input.proposal_reason);
  if (!proposalReason) {
    return { error: "proposal_reason must be a non-empty string." };
  }
  const status = normalizeStatus(input.status);
  if (!status) {
    return { error: "status must be omitted, proposed, or needs_review." };
  }
  const expiresAt = normalizeExpiresAt(input.expires_at, input.now);
  if ("error" in expiresAt) {
    return { error: expiresAt.error };
  }

  return {
    value: {
      packet: input.packet as unknown as AgWorkResumePacketV02,
      candidates: input.candidates as AgWorkResumeMappingProposalCandidate[],
      selected_candidate_id: selectedCandidateId,
      proposed_by: proposedBy,
      proposal_reason: proposalReason,
      status,
      expires_at: expiresAt.value,
      source: isRecord(input.source) ? input.source : undefined,
    },
  };
}

function validateCandidateShape(candidate: unknown, index: number) {
  if (!isRecord(candidate)) {
    return `candidates[${index}] must be an object.`;
  }
  for (const field of [
    "candidate_id",
    "local_scope",
    "local_work_id",
    "title",
    "status",
    "next_action",
  ]) {
    if (!cleanString(candidate[field])) {
      return `candidates[${index}].${field} must be a non-empty string.`;
    }
  }
  if (!Array.isArray(candidate.related_state_keys)) {
    return `candidates[${index}].related_state_keys must be an array.`;
  }
  return null;
}

function buildInsertRow({
  input,
  preview,
  packetHash,
  proposalPreviewHash,
}: {
  input: NormalizedCreateInput;
  preview: AgWorkResumeMappingProposalPreview;
  packetHash: string;
  proposalPreviewHash: string;
}): ProposalInsertRow {
  const selected = preview.selected_candidate_summary;
  if (!selected) {
    throw new Error("candidate_review preview must include selected candidate.");
  }
  const packetSummary = preview.packet_summary;
  const previewId = cleanString(preview.proposal_preview_id) ??
    `mapping-proposal-preview:${packetSummary.packet_foreign_work.work_id}:${input.selected_candidate_id}`;
  const proposalId = buildProposalId({
    packet_id: packetSummary.packet_id,
    packet_hash: packetHash,
    proposal_preview_id: previewId,
    proposal_preview_hash: proposalPreviewHash,
    foreign_scope: packetSummary.packet_foreign_work.scope,
    foreign_work_id: packetSummary.packet_foreign_work.work_id,
    candidate_local_scope: selected.local_scope,
    candidate_local_work_id: selected.local_work_id,
    selected_candidate_id: input.selected_candidate_id,
    proposed_by: input.proposed_by,
    proposal_reason: input.proposal_reason,
    status: input.status,
    expires_at: input.expires_at,
  });

  return {
    proposal_id: proposalId,
    record_kind: RECORD_KIND,
    schema: RECORD_SCHEMA,
    status: input.status,
    foreign_scope: packetSummary.packet_foreign_work.scope,
    foreign_work_id: packetSummary.packet_foreign_work.work_id,
    foreign_title: packetSummary.packet_foreign_work.title,
    foreign_status: packetSummary.packet_foreign_work.status,
    foreign_next_action: packetSummary.packet_foreign_work.next_action,
    candidate_local_scope: selected.local_scope,
    candidate_local_work_id: selected.local_work_id,
    candidate_title: selected.title,
    candidate_status: selected.status,
    candidate_next_action: selected.next_action,
    packet_id: packetSummary.packet_id,
    packet_hash: packetHash,
    source_runtime_instance_id:
      cleanString(input.packet.issuer?.runtime_instance_id) ?? null,
    source_packet_created_at: cleanString(input.packet.created_at) ?? null,
    proposal_preview_id: previewId,
    proposal_preview_hash: proposalPreviewHash,
    match_confidence_label: preview.comparison.match_confidence_label,
    comparison_summary: JSON.stringify(preview.comparison.fields),
    gaps_summary: JSON.stringify(preview.gaps),
    conflicts_summary: JSON.stringify(preview.conflicts),
    questions_summary: JSON.stringify(preview.questions),
    foreign_refs_summary: JSON.stringify(preview.foreign_refs_summary),
    repo_context_summary: JSON.stringify({
      git: packetSummary.git,
      repo: preview.comparison.repo,
    }),
    redaction_summary: JSON.stringify(input.packet.redaction ?? {}),
    proposed_by: input.proposed_by,
    proposal_reason: input.proposal_reason,
    expires_at: input.expires_at,
    authority_boundary: JSON.stringify(buildAuthorityBoundary(true)),
  };
}

function selectProposalRecordRow(db: Database.Database, proposalId: string) {
  const row = db
    .prepare(
      `
        SELECT *
        FROM ag_work_resume_mapping_proposals
        WHERE proposal_id = ?
      `,
    )
    .get(proposalId);
  if (!row) {
    throw new Error("Inserted mapping proposal record could not be read back.");
  }

  return row as Record<string, unknown>;
}

function parseProposalRecordRow(
  row: Record<string, unknown>,
): AgWorkResumeMappingProposalRecord {
  return {
    proposal_id: stringField(row.proposal_id),
    record_kind: RECORD_KIND,
    schema: RECORD_SCHEMA,
    status: stringField(row.status) as AgWorkResumeMappingProposalRecord["status"],
    foreign_scope: stringField(row.foreign_scope),
    foreign_work_id: stringField(row.foreign_work_id),
    foreign_title: stringField(row.foreign_title),
    foreign_status: nullableStringField(row.foreign_status),
    foreign_next_action: nullableStringField(row.foreign_next_action),
    candidate_local_scope: stringField(row.candidate_local_scope),
    candidate_local_work_id: stringField(row.candidate_local_work_id),
    candidate_title: stringField(row.candidate_title),
    candidate_status: nullableStringField(row.candidate_status),
    candidate_next_action: nullableStringField(row.candidate_next_action),
    packet_id: stringField(row.packet_id),
    packet_hash: stringField(row.packet_hash),
    source_runtime_instance_id: nullableStringField(row.source_runtime_instance_id),
    source_packet_created_at: nullableStringField(row.source_packet_created_at),
    proposal_preview_id: stringField(row.proposal_preview_id),
    proposal_preview_hash: stringField(row.proposal_preview_hash),
    match_confidence_label: nullableStringField(row.match_confidence_label),
    comparison_summary: parseJsonArrayField(row.comparison_summary),
    gaps_summary: parseJsonArrayField(row.gaps_summary),
    conflicts_summary: parseJsonArrayField(row.conflicts_summary),
    questions_summary: parseJsonArrayField(row.questions_summary),
    foreign_refs_summary: parseJsonObjectField(row.foreign_refs_summary),
    repo_context_summary: parseJsonObjectField(row.repo_context_summary),
    redaction_summary: parseJsonObjectField(row.redaction_summary),
    proposed_by: stringField(row.proposed_by),
    proposed_at: stringField(row.proposed_at),
    proposal_reason: stringField(row.proposal_reason),
    expires_at: nullableStringField(row.expires_at),
    supersedes_proposal_id: nullableStringField(row.supersedes_proposal_id),
    superseded_by_proposal_id: nullableStringField(row.superseded_by_proposal_id),
    reviewed_by: nullableStringField(row.reviewed_by),
    reviewed_at: nullableStringField(row.reviewed_at),
    review_note: nullableStringField(row.review_note),
    authority_boundary: parseJsonObjectField(
      row.authority_boundary,
    ) as AgWorkResumeMappingProposalRecordAuthorityBoundary,
    created_at: stringField(row.created_at),
    updated_at: stringField(row.updated_at),
  };
}

function buildProposalId(value: Record<string, unknown>) {
  return `ag-resume-mapping-proposal:${createHash("sha256")
    .update(stableStringify(value))
    .digest("hex")
    .slice(0, 24)}`;
}

function packetHashFor(packet: AgWorkResumePacketV02) {
  const supplied = cleanString(packet.integrity?.payload_hash);
  return supplied ?? hashValue(packet);
}

function hashValue(value: unknown) {
  return `sha256:${createHash("sha256").update(stableStringify(value)).digest("hex")}`;
}

function stableStringify(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (isRecord(value)) {
    return Object.keys(value)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = canonicalize(value[key]);
        return acc;
      }, {});
  }
  return value;
}

function normalizeStatus(value: unknown): AgWorkResumeMappingProposalRecordStatus | null {
  if (value === undefined || value === null) {
    return "proposed";
  }
  if (value === "proposed" || value === "needs_review") {
    return value;
  }
  return null;
}

function normalizeExpiresAt(
  value: unknown,
  nowValue: string | undefined,
): { value: string | null } | { error: string } {
  if (value === undefined || value === null) {
    return { value: null };
  }
  if (typeof value !== "string" || value.trim().length === 0) {
    return { error: "expires_at must be omitted, null, or a future ISO UTC timestamp." };
  }
  const expiresAt = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(expiresAt)) {
    return { error: "expires_at must be an ISO UTC timestamp with millisecond precision." };
  }
  const expiresAtMs = Date.parse(expiresAt);
  const nowMs = nowValue ? Date.parse(nowValue) : Date.now();
  if (!Number.isFinite(expiresAtMs) || !Number.isFinite(nowMs)) {
    return { error: "expires_at must be a valid future ISO UTC timestamp." };
  }
  if (expiresAtMs <= nowMs) {
    return { error: "expires_at must be in the future." };
  }
  return { value: expiresAt };
}

function buildAuthorityBoundary(
  proposalRecordCreated: boolean,
): AgWorkResumeMappingProposalRecordAuthorityBoundary {
  return {
    proposal_record_created: proposalRecordCreated,
    confirmed_mapping_created: false,
    import_record_created: false,
    work_item_created: false,
    proof_recorded: false,
    evidence_recorded: false,
    session_bound: false,
    codex_executed: false,
    approval_granted: false,
    publish_retry_replay_authority: false,
    merge_authority: false,
    durable_approval: "user/Core gated",
    statement: RESULT_STATEMENT,
  };
}

function failureResult({
  status,
  proposal_id = null,
  record = null,
  preflight = null,
  preview = null,
  warnings = [],
  failures = [],
  recommended_next_step,
}: {
  status: Exclude<AgWorkResumeMappingProposalRecordCreateResult["status"], "created">;
  proposal_id?: string | null;
  record?: null;
  preflight?: AgWorkResumePacketPreflightResult | null;
  preview?: AgWorkResumeMappingProposalPreview | null;
  warnings?: string[];
  failures?: string[];
  recommended_next_step: string;
}): AgWorkResumeMappingProposalRecordCreateResult {
  return {
    ok: false,
    status,
    proposal_id,
    record,
    preflight,
    preview,
    warnings,
    failures,
    authority_boundary: buildAuthorityBoundary(false),
    recommended_next_step,
  };
}

function previewNotCreatableNextStep(
  preview: AgWorkResumeMappingProposalPreview,
) {
  if (preview.status === "needs_candidate") {
    return "Provide an explicit selected candidate that is present in the candidate list before creating a proposal record.";
  }
  if (preview.status === "conflict") {
    return "Resolve mapping proposal preview conflicts before creating a proposal record.";
  }
  return "Stop. Unsafe packet policy or packet shape blocks proposal record creation.";
}

function failedPreflightMessages(preflight: AgWorkResumePacketPreflightResult) {
  return preflight.checks
    .filter((check) => check.status === "fail")
    .map((check) => `${check.id}: ${check.message}`);
}

function warningPreflightMessages(preflight: AgWorkResumePacketPreflightResult) {
  return preflight.checks
    .filter((check) => check.status === "warn")
    .map((check) => `${check.id}: ${check.message}`);
}

function isDuplicateConstraintError(error: unknown) {
  if (!(error instanceof Error)) return false;
  return /UNIQUE constraint failed|SQLITE_CONSTRAINT_UNIQUE|constraint failed/i.test(
    error.message,
  );
}

function parseJsonArrayField(value: unknown) {
  const parsed = JSON.parse(stringField(value));
  return Array.isArray(parsed) ? parsed : [];
}

function parseJsonObjectField(value: unknown) {
  const parsed = JSON.parse(stringField(value));
  return isRecord(parsed) ? parsed : {};
}

function stringField(value: unknown) {
  return typeof value === "string" ? value : String(value ?? "");
}

function nullableStringField(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function cleanString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
