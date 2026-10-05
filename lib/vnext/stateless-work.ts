import { WORK_HANDOFF_ENTRY, handoffNoteAttribution } from "./work-handoff";
import { readBoundPlannerExecutionConfigurationV01 } from "./model-gateway/planner-execution-configuration";
import type { PlannerModelExecutionConfigurationV01 } from "./model-gateway/contracts";
import { canonicalizeProtocolValueV01 as canonical, createProtocolSha256V01 as hash, parseStrictIsoTimestampV01 } from "./protocol-primitives";
import { readSelectedWorkSources, selectedWorkSourceInput, reviewedOutcomeSourceRef } from "@/lib/intake/selected-work-source-comparison";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";
import type { ModelGatewayCostBudgetV01 } from "@/types/vnext/model-invocation-receipt";
import { validateModelGatewayCostBudgetV01 } from "./model-gateway/cost-authority";

export const STATELESS_WORK = "stateless_source_review.v0.1";
export const STATELESS_GRANT = "stateless_source_review_grant.v0.1";
export const STATELESS_DISPOSITION = "stateless_model_request_disposition.v0.1";
export const STATELESS_REPLACEMENT = "stateless_source_review_replacement.v0.1";
export const STATELESS_TERMINAL_WORK = "stateless_returned_attempt_successor.v0.1";
export const STATELESS_TERMINAL_CONTEXT = "stateless-review-returned-predecessors";
export const STATELESS_UNRESOLVED_CONTEXT = "stateless-review-unresolved-predecessors";
export interface StatelessDispositionBinding {
  run_id: string; expected_revision: number; step_id: string; generation: string;
  packet_id: string; packet_fingerprint: string; grant_id: string; grant_fingerprint: string;
  failure_evidence_fingerprint: string;
}
export const STATELESS_LIMITS = Object.freeze({ model_invocations: 2, action_bundles: 1, files: 2,
  source_bytes: 65_536, excerpt_bytes: 4_096, input_bytes: 16_384, output_tokens: 1_024,
  invocation_ms: 15_000, action_ms: 10_000, host_ms: 45_000, attempts: 1 });
/** Reasoning and public output share this provider token cap. Public judgment
 * and all source/input/action bounds remain unchanged. */
export const STATELESS_SOL_LOW_LIMITS = Object.freeze({ ...STATELESS_LIMITS,
  output_tokens: 4096, invocation_ms: 60_000, host_ms: 150_000 });
export interface ReviewFile { path: string; start_line: number; end_line: number; digest: string }
export interface SourceReview { profile: typeof STATELESS_WORK; question: string; files: ReviewFile[] }
export interface ReviewObservation {
  availability: "observed" | "conflicting" | "channel_unavailable" | "not_used";
  observed_at: string; bytes_read: number; reason: string;
  sources: Array<ReviewFile & { text: string; excerpt_digest: string }>;
}
export interface StatelessGrantRequest {
  workspace_id: string; project_id: string; packet_id: string; packet_fingerprint: string;
  review_ref: string; root_fingerprint: string; host_fingerprint: string;
  control_revision: number; expires_at: string; limits: typeof STATELESS_LIMITS | typeof STATELESS_SOL_LOW_LIMITS;
  model_configuration?: PlannerModelExecutionConfigurationV01;
  cost_budget: ModelGatewayCostBudgetV01;
  /** Absent only in historical grants, whose model input omitted ordinary notes. */
  selected_notes_ref?: string;
  /** Optional local checkpoint; omission preserves uninterrupted historical behavior. */
  pause_after_observation?: true;
}
export interface StatelessGrant {
  grant_version: typeof STATELESS_GRANT; grant_id: string; grant_fingerprint: string;
  workspace_id: string; project_id: string; approved_by: string; issued_at: string;
  request: StatelessGrantRequest;
}
export function reviewCheck(value: unknown, code: string): asserts value {
  if (!value) throw new Error(`stateless_review_${code}`);
}
export function reviewObject(value: unknown, keys: string[]): Record<string, unknown> {
  reviewCheck(value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).sort().join() === [...keys].sort().join(), "shape_invalid");
  return value as Record<string, unknown>;
}
export function reviewText(value: unknown, bytes: number): string {
  reviewCheck(typeof value === "string" && value.trim() && Buffer.byteLength(value) <= bytes && !value.includes("\0"), "text_bound"); return value;
}
export function reviewSha(value: unknown): string { reviewCheck(typeof value === "string" && /^sha256:[a-f0-9]{64}$/.test(value), "fingerprint_invalid"); return value; }
export function reviewFile(value: unknown, withDigest = true): ReviewFile {
  const v = reviewObject(value, ["path", "start_line", "end_line", ...(withDigest ? ["digest"] : [])]);
  const p = reviewText(v.path, 220);
  reviewCheck(/^(?:[A-Za-z0-9_-][A-Za-z0-9_.-]*\/){0,7}[A-Za-z0-9_-][A-Za-z0-9_.-]*\.(?:md|txt|ts|tsx|js|mjs|py|json)$/.test(p), "path_refused");
  reviewCheck(Number.isSafeInteger(v.start_line) && Number.isSafeInteger(v.end_line) && Number(v.start_line) >= 1 && Number(v.end_line) >= Number(v.start_line) && Number(v.end_line) <= 20_000, "line_range_invalid");
  return { path: p, start_line: Number(v.start_line), end_line: Number(v.end_line), digest: withDigest ? reviewSha(v.digest) : hash("") };
}
export function readSourceReview(packet: TaskContextPacketV01): SourceReview {
  const candidates = readSelectedWorkSources(packet).flatMap(s => {
    try { const v = JSON.parse(selectedWorkSourceInput(s).text); return v.profile === STATELESS_WORK ? [v] : []; } catch { return []; }
  });
  reviewCheck(candidates.length === 1, "authored_material_required");
  const v = reviewObject(candidates[0], ["profile", "question", "files"]);
  reviewCheck(Array.isArray(v.files) && v.files.length > 0 && v.files.length <= 2, "file_count");
  const files = v.files.map(f => reviewFile(f));
  reviewCheck(new Set(files.map(f => f.path)).size === files.length, "duplicate_file");
  return { profile: STATELESS_WORK, question: reviewText(v.question, 800), files };
}
export const reviewRef = (value: SourceReview) => hash(canonical(value));
/** A projection of explicitly selected whole notes, never a search of history.
 * The authored question/inventory already has its separate review_ref. */
export function readStatelessSelectedNotes(packet: TaskContextPacketV01) {
  const notes = readSelectedWorkSources(packet).filter(entry => {
    try { return JSON.parse(selectedWorkSourceInput(entry).text).profile !== STATELESS_WORK; } catch { return true; }
  }).map(entry => ({ entry_id: entry.entry_id, source_ref: entry.source_ref,
    ...selectedWorkSourceInput(entry),
    ...(handoffNoteAttribution(packet, entry) ? { imported_attribution: handoffNoteAttribution(packet, entry) } : {}),
    ...(reviewedOutcomeSourceRef(entry) ? { reviewed_outcome_ref: entry.compatibility_source_ref } : {}),
  }));
  const material = { version: "stateless_selected_work_notes.v0.1" as const, notes };
  return { ...material, fingerprint: hash(canonical(material)) };
}
export type StatelessSelectedNotes = ReturnType<typeof readStatelessSelectedNotes>;
export const statelessGrantKey = (request: StatelessGrantRequest, operator: string) => hash(canonical({ purpose: STATELESS_GRANT, request, approved_by: operator }));
export function validateStatelessGrant(value: unknown): value is StatelessGrant {
  try {
    const v = reviewObject(value, ["grant_version", "grant_id", "grant_fingerprint", "workspace_id", "project_id", "approved_by", "issued_at", "request"]);
    const r = reviewObject(v.request, ["workspace_id", "project_id", "packet_id", "packet_fingerprint", "review_ref", "root_fingerprint", "host_fingerprint", "control_revision", "expires_at", "limits", "cost_budget",
      ...(v.request && typeof v.request === "object" && "selected_notes_ref" in v.request ? ["selected_notes_ref"] : []),
      ...(v.request && typeof v.request === "object" && "model_configuration" in v.request ? ["model_configuration"] : []),
      ...(v.request && typeof v.request === "object" && "pause_after_observation" in v.request ? ["pause_after_observation"] : [])]);
    if ("selected_notes_ref" in r) reviewSha(r.selected_notes_ref);
    if ("pause_after_observation" in r) reviewCheck(r.pause_after_observation === true, "grant_checkpoint_invalid");
    reviewCheck(v.grant_version === STATELESS_GRANT && v.workspace_id === r.workspace_id && v.project_id === r.project_id, "grant_scope");
    for (const key of ["packet_fingerprint", "review_ref", "root_fingerprint", "host_fingerprint"]) reviewSha(r[key]);
    for (const key of ["workspace_id", "project_id", "packet_id"]) reviewText(r[key], 256);
    reviewText(v.approved_by, 256);
    const limits = "model_configuration" in r ? STATELESS_SOL_LOW_LIMITS : STATELESS_LIMITS;
    reviewCheck(Number.isSafeInteger(r.control_revision) && Number(r.control_revision) > 0 && canonical(r.limits) === canonical(limits), "grant_limits");
    const budget = validateModelGatewayCostBudgetV01(r.cost_budget);
    const configuration = readBoundPlannerExecutionConfigurationV01(budget.authority.model_ref);
    if ("model_configuration" in r) reviewCheck(configuration && canonical(r.model_configuration) === canonical(configuration) &&
      budget.authority.provider_ref.external_id === configuration.provider, "grant_model_configuration");
    else reviewCheck(!configuration, "grant_model_configuration");
    reviewCheck(budget.authority.workspace_id === r.workspace_id && budget.authority.project_id === r.project_id && budget.authority.purpose === "planner_plan" &&
      budget.maximum_input_units === limits.input_bytes && budget.maximum_output_units === limits.output_tokens && budget.timeout_ms === limits.invocation_ms, "grant_cost");
    reviewCheck(typeof v.issued_at === "string" && parseStrictIsoTimestampV01(v.issued_at) !== null && typeof r.expires_at === "string" && parseStrictIsoTimestampV01(r.expires_at) !== null &&
      Date.parse(r.expires_at) > Date.parse(v.issued_at) && Date.parse(r.expires_at) - Date.parse(v.issued_at) <= 600_000, "grant_time");
    const typed = value as StatelessGrant;
    const { grant_id, grant_fingerprint, ...material } = typed;
    return grant_id === `stateless-grant:${statelessGrantKey(typed.request, typed.approved_by).slice(7, 31)}` && grant_fingerprint === hash(canonical(material));
  } catch { return false; }
}

/** Operational history is mandatory, separate from selectable substantive notes. */
export const statelessTerminalEntries = (p: TaskContextPacketV01) => p.selected_context.filter(e => e.entry_id === STATELESS_TERMINAL_CONTEXT);
export const statelessMandatoryEntries = (p: TaskContextPacketV01) => p.selected_context.filter(e => [STATELESS_UNRESOLVED_CONTEXT, STATELESS_TERMINAL_CONTEXT, WORK_HANDOFF_ENTRY].includes(e.entry_id));
