import { canonicalizeProtocolValueV01 as canonical, createProtocolSha256V01 as hash, parseStrictIsoTimestampV01 } from "./protocol-primitives";
import type { TaskContextPacketProjectionItemV01, TaskContextPacketSelectedEntryV01, TaskContextPacketV01 } from "@/types/vnext/task-context-packet";
import { readSelectedWorkSources } from "@/lib/intake/selected-work-source-comparison";

/** One opt-in decision family over ordinary selected notes, not a capability registry. */
export const RETRY_INSPECTION_INPUT_V01 = "augnes.retry-inspection-input.v0.1";
export const RETRY_INSPECTION_OUTLOOK_V01 = "augnes.retry-inspection-outlook.v0.1";
export const RETRY_INSPECTION_OUTLOOK_V02 = "augnes.retry-inspection-outlook.v0.2";
export type RetryInspectionOutlookVersion = typeof RETRY_INSPECTION_OUTLOOK_V01 | typeof RETRY_INSPECTION_OUTLOOK_V02;
type Probability = { numerator: number; denominator: number } | null;
type Direction = { profile: typeof RETRY_INSPECTION_INPUT_V01; kind: "direction"; purpose: string; priority: "reduce_work" | "learn_inspection" };
type Workflow = { profile: typeof RETRY_INSPECTION_INPUT_V01; kind: "workflow"; attempt: number; verification: number; repair: number;
  direct_success: Probability; stationary: boolean | null; unit: string; valid_until: string; support_refs: string[] };
type Inspection = { profile: typeof RETRY_INSPECTION_INPUT_V01; kind: "inspection"; cost: number; success: Probability;
  available: boolean | null; preparation: string; valid_until: string; support_refs: string[] };
export type RetryInspectionInputV01 = Direction | Workflow | Inspection;
type Row = { entry: TaskContextPacketSelectedEntryV01; value: RetryInspectionInputV01 };

export interface RetryInspectionOutlook {
  version: RetryInspectionOutlookVersion;
  judgment_id: string;
  information_cutoff: string;
  project_direction: { purpose: string; priority: Direction["priority"]; source_ref: string } | null;
  sources: Array<{ source_ref: string; role: string; observed_at: string | null; provenance: string }>;
  baseline: { expected_work: string | null; status: "conditional" | "non_completing" | "unknown" };
  alternative: { expected_work: string | null; status: "conditional" | "non_completing" | "unknown" };
  horizon: string | null;
  action: "inspect" | "direct" | "observe" | "prepare" | "withdraw";
  recommendation: string;
  why_now: string;
  assumptions: string;
  revise_when: string;
  uncertainty: string[];
  authority: "recommendation_only";
}
export type RetryInspectionOutlookV01 = RetryInspectionOutlook & { version: typeof RETRY_INSPECTION_OUTLOOK_V01 };
export type RetryInspectionOutlookV02 = RetryInspectionOutlook & { version: typeof RETRY_INSPECTION_OUTLOOK_V02 };

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function keys(value: Record<string, unknown>, fields: string[]) {
  return Object.keys(value).sort().join(",") === fields.sort().join(",");
}
function text(value: unknown, max: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= max;
}
function cost(value: unknown): value is number { return Number.isSafeInteger(value) && (value as number) >= 0 && (value as number) <= 1_000_000; }
function probability(value: unknown): value is Probability {
  return value === null || (record(value) && keys(value, ["numerator", "denominator"]) &&
    Number.isSafeInteger(value.numerator) && Number.isSafeInteger(value.denominator) &&
    (value.denominator as number) > 0 && (value.denominator as number) <= 10_000 &&
    (value.numerator as number) >= 0 && (value.numerator as number) <= (value.denominator as number));
}
function parse(entry: TaskContextPacketSelectedEntryV01): Row | "invalid" | null {
  let v: unknown;
  try { v = JSON.parse(entry.bounded_summary ?? ""); } catch { return null; }
  if (!record(v) || v.profile !== RETRY_INSPECTION_INPUT_V01) return null;
  if (v.kind === "direction") {
    if (!keys(v, ["profile", "kind", "purpose", "priority"]) || !text(v.purpose, 400) ||
      !["reduce_work", "learn_inspection"].includes(v.priority as string) || entry.trust_class !== "user_declaration") return "invalid";
  } else {
    if (!Array.isArray(v.support_refs) || v.support_refs.length > 4 || new Set(v.support_refs).size !== v.support_refs.length ||
      !v.support_refs.every(ref => typeof ref === "string" && /^sha256:[a-f0-9]{64}$/u.test(ref)) ||
      typeof v.valid_until !== "string" || parseStrictIsoTimestampV01(v.valid_until) === null) return "invalid";
    if (v.kind === "workflow") {
      if (!keys(v, ["profile", "kind", "attempt", "verification", "repair", "direct_success", "stationary", "unit", "valid_until", "support_refs"]) ||
        ![v.attempt, v.verification, v.repair].every(cost) || !probability(v.direct_success) ||
        ![true, false, null].includes(v.stationary as null) || !text(v.unit, 40)) return "invalid";
    } else if (v.kind === "inspection") {
      if (!keys(v, ["profile", "kind", "cost", "success", "available", "preparation", "valid_until", "support_refs"]) ||
        !cost(v.cost) || !probability(v.success) || ![true, false, null].includes(v.available as null) || !text(v.preparation, 300)) return "invalid";
    } else return "invalid";
  }
  return { entry, value: v as RetryInspectionInputV01 };
}

// Renewal counting for the single stationary retry workflow: not another linear
// solver. Exact BigInt comparison; #1376's executable is an independent oracle.
function expected(w: Workflow, p: Probability, inspection: number) {
  if (p === null) return { value: null, projected: { expected_work: null, status: "unknown" as const } };
  if (p.numerator === 0) return { value: null, projected: { expected_work: null, status: "non_completing" as const } };
  const n = BigInt(w.attempt + w.verification + inspection) * BigInt(p.denominator) + BigInt(p.denominator - p.numerator) * BigInt(w.repair);
  const d = BigInt(p.numerator);
  let a = n, b = d;
  while (b !== BigInt(0)) [a, b] = [b, a % b];
  return { value: { n, d }, projected: { expected_work: d / a === BigInt(1) ? String(n / a) : `${n / a}/${d / a}`, status: "conditional" as const } };
}

/** Historical v0.1 reconstruction must retain its original decision ordering. */
export function buildRetryInspectionOutlookV01(entries: TaskContextPacketSelectedEntryV01[], at: string): RetryInspectionOutlookV01 | null {
  return buildOutlook(entries, at, RETRY_INSPECTION_OUTLOOK_V01) as RetryInspectionOutlookV01 | null;
}

/** Freeze new judgments at the existing authenticated packet writer's server time. */
export function buildRetryInspectionOutlookV02(entries: TaskContextPacketSelectedEntryV01[], at: string): RetryInspectionOutlookV02 | null {
  return buildOutlook(entries, at, RETRY_INSPECTION_OUTLOOK_V02) as RetryInspectionOutlookV02 | null;
}

function selectV02(direction: Direction, w: Workflow, i: Inspection, baseline: ReturnType<typeof expected>, alternative: ReturnType<typeof expected>):
  Pick<RetryInspectionOutlook, "action" | "recommendation" | "why_now"> {
  const learning = direction.priority === "learn_inspection";
  let basis = "The declared project priority is to resolve inspection uncertainty, even when the modeled cost is higher.";
  if (!learning) {
    if (baseline.value && (alternative.projected.status === "non_completing" ||
      (alternative.value && alternative.value.n * baseline.value.d >= baseline.value.n * alternative.value.d))) {
      return { action: "direct", recommendation: "Continue directly with every mandatory check; retain inspection as a conditional alternative.",
        why_now: alternative.projected.status === "non_completing"
          ? `Inspection is non-completing under the selected assumptions; direct work has a conditional completion estimate of ${baseline.projected.expected_work} ${w.unit}. Resource preparation cannot repair that completion premise.`
          : `Inspection's conditional ${alternative.projected.expected_work} ${w.unit} does not improve on direct work's ${baseline.projected.expected_work}. Resolving inspection availability does not improve this comparison; recurring preparation and inspection costs are included.` };
    }
    if (baseline.projected.status === "non_completing" && alternative.projected.status === "non_completing") {
      return { action: "withdraw", recommendation: "Withdraw both methods as completion recommendations; investigate a changed completion premise before proceeding.",
        why_now: "Both selected success estimates are zero, so neither workflow completes under these assumptions. This establishes non-completion, not unknown performance or an infinite work estimate." };
    }
    if (!alternative.value || (baseline.projected.status !== "non_completing" && !baseline.value)) {
      return { action: "observe", recommendation: "Resolve the unknown completion or performance estimate with a bounded observation before choosing a method.",
        why_now: "An unknown estimate can affect the method choice. Any separately established non-completion remains known; missing observations do not establish failure." };
    }
    basis = baseline.projected.status === "non_completing"
      ? `Direct work is non-completing under the selected assumptions; inspection has a conditional completion estimate of ${alternative.projected.expected_work} ${w.unit}. No finite or infinite work value is assigned to non-completion.`
      : `Under the selected stationary assumptions, inspection uses ${alternative.projected.expected_work} ${w.unit} versus ${baseline.projected.expected_work} for continuing directly.`;
  }
  // Resource work is relevant only after inspection serves the declared priority.
  if (i.available === false) return { action: "prepare", recommendation: `Prepare before reconsidering optional inspection: ${i.preparation}`,
    why_now: `${basis} The required inspection resource is reported unavailable; this recommendation does not make it feasible or authorized.` };
  if (i.available === null) return { action: "observe", recommendation: "Check inspection resource availability before choosing inspection.",
    why_now: `${basis} Practical availability is unknown; a permission grant cannot supply this observation.` };
  if (learning) return { action: "observe", recommendation: "Make one bounded observation of inspection cost and outcome before relying on its success estimate.", why_now: basis };
  return { action: "inspect", recommendation: "Consider optional inspection before the next attempt, retaining every mandatory check.",
    why_now: `${basis} The resource is reported available now.` };
}

function buildOutlook(entries: TaskContextPacketSelectedEntryV01[], at: string, version: RetryInspectionOutlookVersion): RetryInspectionOutlook | null {
  if (parseStrictIsoTimestampV01(at) === null) throw new Error("retry_inspection_cutoff_invalid");
  const parsed = entries.map(parse);
  if (parsed.every(row => row === null)) return null;
  const rows = parsed.filter((row): row is Row => row !== null && row !== "invalid");
  const uncertainty = ["Inputs are selected declarations/reports, not independently verified rates, causal effects or learned competence.",
    "No observation is not a failed prediction. Waiting has opportunity cost; its magnitude is unknown."];
  const unique = <K extends RetryInspectionInputV01["kind"]>(kind: K) => {
    const matches = rows.filter(row => row.value.kind === kind);
    return matches.length === 1 ? matches[0] as { entry: TaskContextPacketSelectedEntryV01; value: Extract<RetryInspectionInputV01, { kind: K }> } : null;
  };
  const direction = unique("direction"), workflow = unique("workflow"), inspection = unique("inspection");
  const used = new Set(rows.map(row => row.entry.source_ref!));
  parsed.forEach((row, index) => { if (row === "invalid") used.add(entries[index]!.source_ref!); });
  for (const row of rows) if (row.value.kind !== "direction") for (const ref of row.value.support_refs) used.add(ref);
  const sources = entries.filter(entry => used.has(entry.source_ref!)).map(entry => ({ source_ref: entry.source_ref!,
    role: rows.find(row => row.entry === entry)?.value.kind ?? "supporting_observation",
    observed_at: entry.external_ref?.observed_at ?? null, provenance: entry.trust_class })).sort((a, b) => a.source_ref.localeCompare(b.source_ref));
  const usable = (row: Row | null): boolean => Boolean(row &&
    (!row.entry.external_ref?.observed_at || Date.parse(row.entry.external_ref.observed_at) <= Date.parse(at)) &&
    (row.value.kind === "direction" || (Date.parse(row.value.valid_until) > Date.parse(at) && row.value.support_refs.every(ref =>
      entries.some(entry => entry.source_ref === ref && (!entry.external_ref?.observed_at || Date.parse(entry.external_ref.observed_at) <= Date.parse(at)))))));
  const w = workflow && usable(workflow) && workflow.value.stationary === true ? workflow.value : null;
  const i = inspection && usable(inspection) ? inspection.value : null;
  const unknown = { value: null, projected: { expected_work: null, status: "unknown" as const } };
  const baseline = w ? expected(w, w.direct_success, 0) : unknown;
  const alternative = w && i ? expected(w, i.success, i.cost) : unknown;
  let action: RetryInspectionOutlook["action"] = "observe";
  let recommendation = "Check the missing, conflicting or expired premises before selecting optional inspection.";
  let why = "The current selected sources do not establish this comparison; independent surviving inputs remain visible.";
  if (parsed.includes("invalid")) uncertainty.push("At least one marked input is malformed or is not a user-authored direction.");
  if (workflow?.value.stationary === false && usable(workflow)) {
    action = "withdraw"; recommendation = "Withdraw the stationary cost recommendation; inspect which costs or success conditions change between attempts.";
    why = "An essential stationary-workflow premise is explicitly broken; a replacement model is not required to withdraw this judgment.";
  } else if (!parsed.includes("invalid") && direction && usable(direction) && w && i) {
    if (version === RETRY_INSPECTION_OUTLOOK_V02) {
      ({ action, recommendation, why_now: why } = selectV02(direction.value, w, i, baseline, alternative));
      if (i.available !== true) uncertainty.push(i.available === false
        ? "Inspection resource is reported unavailable; the alternative remains conditional."
        : "Inspection resource availability is unknown; the alternative remains conditional.");
    } else if (i.available === false) {
      action = "prepare"; recommendation = `Prepare before reconsidering optional inspection: ${i.preparation}`;
      why = "The inspection resource is reported unavailable. A favorable conditional calculation does not make the method feasible.";
    } else if (i.available === null) {
      recommendation = "Check inspection resource availability before choosing a method.";
      why = "Practical availability is unknown; a permission grant cannot supply this missing observation.";
    } else if (direction.value.priority === "learn_inspection" || !baseline.value || !alternative.value) {
      recommendation = "Make one bounded observation of inspection cost and outcome before relying on its success estimate.";
      why = direction.value.priority === "learn_inspection" ? "The declared project priority is to resolve inspection uncertainty, even when the modeled cost is higher." : "At least one finite completion estimate is unknown or non-completing; no finite comparison is justified.";
    } else if (alternative.value.n * baseline.value.d < baseline.value.n * alternative.value.d) {
      action = "inspect"; recommendation = "Consider optional inspection before the next attempt, retaining every mandatory check.";
      why = `Under the selected stationary assumptions, inspection uses ${alternative.projected.expected_work} ${w.unit} versus ${baseline.projected.expected_work} for continuing directly; the resource is reported available now.`;
    } else {
      action = "direct"; recommendation = "Continue directly with every mandatory check; retain inspection as a conditional alternative.";
      why = `Inspection's conditional ${alternative.projected.expected_work} ${w.unit} does not improve on direct work's ${baseline.projected.expected_work}. Preparation and repeated inspection cost are included.`;
    }
  }
  const horizons = [workflow?.value.valid_until, inspection?.value.valid_until].filter((v): v is string => !!v).sort((a, b) => Date.parse(a) - Date.parse(b));
  const material: Omit<RetryInspectionOutlook, "judgment_id"> = {
    version, information_cutoff: at,
    project_direction: direction ? { purpose: direction.value.purpose, priority: direction.value.priority, source_ref: direction.entry.source_ref! } : null,
    sources, baseline: baseline.projected, alternative: alternative.projected, horizon: horizons[0] ?? null,
    action, recommendation, why_now: why,
    assumptions: "Until one completion: identical independent retry conditions, nonnegative costs in one unit, repair after failure; inspection precedes each attempt; mandatory verification always occurs.",
    revise_when: "Reconsider changed costs, availability, success estimates, stationary applicability, source versions/support, project priorities or the stated horizon. Preserve the original judgment and distinguish our intervention outcomes from external observations.",
    uncertainty, authority: "recommendation_only" as const,
  };
  // A new packet/time or irrelevant note is not an unsupported reversal. The
  // historical cutoff remains separately recorded in each immutable packet.
  return { ...material, judgment_id: hash(canonical({ ...material, information_cutoff: null })) };
}

export function retryInspectionProjectionItemsV01(entries: TaskContextPacketSelectedEntryV01[], at: string,
  version: RetryInspectionOutlookVersion | null = RETRY_INSPECTION_OUTLOOK_V02): TaskContextPacketProjectionItemV01[] {
  const outlook = version === null ? null : buildOutlook(entries, at, version);
  return outlook ? [{ item_kind: "other", summary: canonical(outlook), source_refs: outlook.sources.map(source => source.source_ref), external_refs: [],
    currentness: { status: "unknown", as_of: at, basis: "Frozen conditional recommendation over selected sources; external currentness is unknown.", source_ref: null } }] : [];
}

/** Validate against the frozen version's exact selected inputs, never today's inputs. */
export function retryInspectionOutlookVersion(packet: TaskContextPacketV01): RetryInspectionOutlookVersion | null {
  const versions = packet.compatibility?.source_contracts?.filter(value => value.startsWith("augnes.retry-inspection-outlook.")) ?? [];
  if (!versions.length) return null;
  if (versions.length !== 1 || ![RETRY_INSPECTION_OUTLOOK_V01, RETRY_INSPECTION_OUTLOOK_V02].includes(versions[0]!)) throw new Error("retry_inspection_outlook_version_invalid");
  return versions[0] as RetryInspectionOutlookVersion;
}

export function readRetryInspectionOutlookV01(packet: TaskContextPacketV01): RetryInspectionOutlook | null {
  const version = retryInspectionOutlookVersion(packet);
  if (!version) return null;
  const expected = buildOutlook(readSelectedWorkSources(packet), packet.generated_at, version);
  if (!expected || !packet.current_projection?.items.some(item => item.item_kind === "other" && item.summary === canonical(expected))) throw new Error("retry_inspection_outlook_binding_invalid");
  return expected;
}

export function retryInspectionGuidanceV01(packet: TaskContextPacketV01, evaluatedAt: string): string | null {
  const view = readRetryInspectionOutlookV01(packet);
  if (!view) return null;
  if (parseStrictIsoTimestampV01(evaluatedAt) === null) throw new Error("retry_inspection_read_time_invalid");
  if (!view.horizon || Date.parse(view.horizon) <= Date.parse(evaluatedAt)) return "Recheck the expired or missing inspection horizon before using the historical recommendation. Required task checks still apply.";
  return `${view.recommendation} ${view.why_now} Conditional guidance only; review the frozen project outlook and its sources in the packet.`;
}

export function retryInspectionResultContextV01(packet: TaskContextPacketV01): string {
  const view = readRetryInspectionOutlookV01(packet);
  return view ? `\nHistorical recommendation: ${view.action}; judgment ${view.judgment_id}; information cutoff ${view.information_cutoff}.\nOriginal packet: ${packet.packet_id} ${packet.integrity.fingerprint}.\n${view.recommendation}\n${view.why_now}\nThis execution result is a consequence of our work, not an external observation or proof of the forecast. Inspect actual checks before revising assumptions.` : "";
}
