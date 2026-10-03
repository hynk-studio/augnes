import type { AutonomyRunRecord, AutonomyRunStepRecord } from "@/types/autonomy-runner-execution";
import { MODEL_GATEWAY_FAILURE_CODES_V01, type PlannerModelGatewayResultV01, type PlannerRecommendationV01 } from "./model-gateway/contracts";
import { canonicalizeProtocolValueV01 as canonical, createProtocolSha256V01 as hash } from "./protocol-primitives";

// Whole normalized public recommendations only. Never provider bodies, prompts,
// exceptions or reasoning. Oversize content is omitted explicitly, not shortened.
export const STATELESS_FAILURE_BOUNDS = { public_bytes: 8192, record_bytes: 16384, recommendations: 5 } as const;
const hostCodes = ["one_judgment_required", "choice_not_allowed", "rationale_bound_exceeded", "rationale_empty", "source_anchor_missing", "observation_unavailable"] as const;
type HostCode = typeof hostCodes[number];
const otherCodes = ["result_persistence_failed", "receipt_persistence_failed", "generation_fenced", "work_ended", "host_stage_failed"] as const;
export type StatelessFailureLayer = "gateway" | "host_validation" | "result_persistence" | "receipt_persistence" | "fencing" | "host_execution";
export type StatelessFailureCode = HostCode | typeof otherCodes[number] | typeof MODEL_GATEWAY_FAILURE_CODES_V01[number];
export type StatelessValidationFacts = {
  recommendation_count: number; planner_supported: boolean; choice_allowed: boolean | null;
  rationale_bytes: number | null; rationale_limit_bytes: 1200; rationale_nonempty: boolean | null;
  source_anchor_present: boolean | null; observation_available: boolean;
};
export class StatelessJudgmentRejection extends Error {
  constructor(readonly code: HostCode, readonly facts: StatelessValidationFacts) { super(`stateless_review_${code}`); }
}
export function validateStatelessJudgment(result: PlannerModelGatewayResultV01, stage: "choose" | "conclude", anchor: string, observed: boolean) {
  const judgment = result.recommendations.length === 1 ? result.recommendations[0]! : null;
  const choices = stage === "choose" ? ["read_selected_sources", "no_action", "defer", "stop"] : ["use_observation", "decline_observation", "defer", "stop"];
  const facts: StatelessValidationFacts = { recommendation_count: result.recommendations.length, planner_supported: result.planner === "openai",
    choice_allowed: judgment ? choices.includes(judgment.tool_name ?? "") : null, rationale_bytes: judgment ? Buffer.byteLength(judgment.rationale) : null,
    rationale_limit_bytes: 1200, rationale_nonempty: judgment ? Boolean(judgment.rationale.trim()) : null,
    source_anchor_present: judgment ? judgment.grounded_state_keys.includes(anchor) : null, observation_available: observed };
  const refuse = (code: HostCode): never => { throw new StatelessJudgmentRejection(code, facts); };
  if (!facts.planner_supported || !judgment) return refuse("one_judgment_required");
  if (!facts.choice_allowed) return refuse("choice_not_allowed");
  if (facts.rationale_bytes! > facts.rationale_limit_bytes) return refuse("rationale_bound_exceeded");
  if (!facts.rationale_nonempty) return refuse("rationale_empty");
  if (!facts.source_anchor_present) return refuse("source_anchor_missing");
  if (judgment.tool_name === "use_observation" && !observed) return refuse("observation_unavailable");
  return judgment;
}
type PublicResult = { availability: "complete" | "omitted_bound"; bytes: number; fingerprint: string; recommendation_count: number;
  planner: "openai" | "mock"; recommendations: PlannerRecommendationV01[] | null } | { availability: "unavailable" };
export interface StatelessFailureEvidence {
  version: "stateless_model_failure.v0.1"; layer: StatelessFailureLayer; code: StatelessFailureCode; stage: "choose" | "conclude";
  binding: { workspace_id: string; project_id: string; run_id: string; step_id: string; invocation_id: string; generation: string;
    packet_id: string; packet_fingerprint: string; grant_id: string; grant_fingerprint: string; input_fingerprint: string | null;
    review_ref: string; selected_notes_ref: string | null; observation_fingerprint: string | null; receipt_fingerprint: string | null };
  host_rejection_code: HostCode | null; validation: StatelessValidationFacts | null; public_result: PublicResult; fingerprint: string;
}
export function buildStatelessFailureEvidence(input: Omit<StatelessFailureEvidence, "version" | "fingerprint" | "public_result"> & { result: PlannerModelGatewayResultV01 | null }): StatelessFailureEvidence | null {
  const { result, ...rest } = input;
  // These bindings come from admitted local owners, never an exception object.
  if (Object.values(input.binding).some(v => v !== null && (typeof v !== "string" || Buffer.byteLength(v) > 256))) return null;
  let publicResult: PublicResult = { availability: "unavailable" };
  if (result) {
    const recommendations = result.recommendations.map(r => ({ title: r.title, rationale: r.rationale, tool_name: r.tool_name, priority: r.priority, grounded_state_keys: [...r.grounded_state_keys] }));
    const serialized = canonical({ planner: result.planner, recommendations }), bytes = Buffer.byteLength(serialized);
    const complete = bytes <= STATELESS_FAILURE_BOUNDS.public_bytes && recommendations.length <= STATELESS_FAILURE_BOUNDS.recommendations;
    publicResult = { availability: complete ? "complete" : "omitted_bound", bytes, fingerprint: hash(serialized), planner: result.planner,
      recommendation_count: recommendations.length, recommendations: complete ? recommendations : null };
  }
  const body = { version: "stateless_model_failure.v0.1" as const, ...rest, public_result: publicResult };
  const evidence = { ...body, fingerprint: hash(canonical(body)) };
  return Buffer.byteLength(canonical(evidence)) <= STATELESS_FAILURE_BOUNDS.record_bytes ? evidence : null;
}
export type StatelessFailureReview = { step_id: string; availability: "available"; evidence: StatelessFailureEvidence }
  | { step_id: string; availability: "unavailable"; reason: "not_recorded" | "invalid_record" | "storage_bound" };

function readEvidence(value: unknown, run: AutonomyRunRecord, step: AutonomyRunStepRecord, generation: unknown): StatelessFailureEvidence | null {
  try {
    if (!value || Buffer.byteLength(canonical(value)) > STATELESS_FAILURE_BOUNDS.record_bytes) return null;
    const e = value as StatelessFailureEvidence, { fingerprint, ...body } = e;
    if (e.version !== "stateless_model_failure.v0.1" || fingerprint !== hash(canonical(body)) ||
      ![...hostCodes, ...otherCodes, ...MODEL_GATEWAY_FAILURE_CODES_V01].includes(e.code) ||
      !["gateway", "host_validation", "result_persistence", "receipt_persistence", "fencing", "host_execution"].includes(e.layer) ||
      e.stage !== step.title || e.binding.run_id !== run.run_id || e.binding.step_id !== step.step_id || e.binding.generation !== generation ||
      e.binding.project_id !== run.scope || e.binding.workspace_id !== run.metadata.workspace_id || e.binding.packet_id !== run.metadata.packet_id ||
      e.binding.packet_fingerprint !== run.metadata.packet_fingerprint || e.binding.invocation_id !== `${run.run_id}.${step.title}` ||
      e.binding.grant_id !== (run.metadata.stateless_review as { grant_id: string }).grant_id ||
      e.binding.grant_fingerprint !== (run.metadata.stateless_review as { grant_fingerprint: string }).grant_fingerprint ||
      !(e.host_rejection_code === null || hostCodes.includes(e.host_rejection_code))) return null;
    const p = e.public_result;
    if (p.availability === "complete") {
      if (!Array.isArray(p.recommendations) || p.recommendations.length !== p.recommendation_count || p.recommendations.length > STATELESS_FAILURE_BOUNDS.recommendations ||
        p.recommendations.some(r => typeof r.title !== "string" || typeof r.rationale !== "string" || !(r.tool_name === null || typeof r.tool_name === "string") ||
          !["now", "next", "later"].includes(r.priority) || !Array.isArray(r.grounded_state_keys) || r.grounded_state_keys.some(k => typeof k !== "string"))) return null;
      const serialized = canonical({ planner: p.planner, recommendations: p.recommendations });
      if (Buffer.byteLength(serialized) !== p.bytes || p.bytes > STATELESS_FAILURE_BOUNDS.public_bytes || hash(serialized) !== p.fingerprint) return null;
    } else if (p.availability !== "unavailable" && !(p.availability === "omitted_bound" && p.recommendations === null && Number.isSafeInteger(p.bytes) && p.bytes > 0)) return null;
    return e;
  } catch { return null; }
}
/** Read projection only: missing historical evidence never becomes a new claim. */
export function readStatelessFailureReviews(run: AutonomyRunRecord): StatelessFailureReview[] {
  const reviews: StatelessFailureReview[] = [];
  const add = (step: AutonomyRunStepRecord, output: Record<string, unknown>, generation: unknown) => {
    const evidence = readEvidence(output.failure_evidence, run, step, generation);
    reviews.push(evidence ? { step_id: step.step_id, availability: "available", evidence } : { step_id: step.step_id, availability: "unavailable",
      reason: output.failure_evidence ? "invalid_record" : output.failure_evidence_unavailable === "storage_bound" ? "storage_bound" : "not_recorded" });
  };
  for (const step of run.steps) if (step.title !== "observe" && (step.status === "failed" || step.output.failure_receipt || step.output.dispatch_outcome)) {
    add(step, step.output, step.output.disposed_claim_generation ?? step.output.generation);
  }
  for (const event of run.events) if (event.payload.failure_evidence || event.payload.failure_evidence_unavailable || event.payload.profile === "stateless_late_model_receipt.v0.1" || event.payload.stale_generation) {
    const step = run.steps.find(s => s.step_id === event.step_id || (event.payload.stale_generation && (event.payload.returned_receipt as { invocation_id?: string })?.invocation_id === s.step_id));
    if (step) add(step, event.payload, event.payload.generation ?? event.payload.stale_generation);
  }
  return reviews;
}
