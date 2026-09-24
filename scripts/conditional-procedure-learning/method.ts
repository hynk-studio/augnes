import { createHash } from "node:crypto";

// A bounded authored recipe, not a Core type, memory store, or execution grant.
export const METHOD_VERSION = "conditional-investigation.v0.1";
export const LIMITS = Object.freeze({ memoryCharacters: 1800, memoryBytes: 7200,
  workerTurns: 2, memoryTurns: 1, totalTurns: 24, turnMs: 180_000, settleMs: 10_000 });
export const ARMS = ["B", "F", "A"] as const;
export type Arm = typeof ARMS[number];
export type Task = "T1" | "T2" | "T3";
export const ORDER = ["B0", "P0", "T1-B", "T1-F", "T1-A", "B1", "P1",
  "T2-F", "T2-A", "T2-B", "B2", "P2", "T3-A", "T3-B", "T3-F"] as const;
export type Job = typeof ORDER[number];
export const sha = (text: string | Buffer) => createHash("sha256").update(text).digest("hex");
export const bytes = (value: unknown) => Buffer.byteLength(typeof value === "string" ? value : JSON.stringify(value));
export function assertMemory(text: string): void {
  if (!text || text !== text.trim() || [...text].length > LIMITS.memoryCharacters || bytes(text) > LIMITS.memoryBytes)
    throw new Error("method_memory_bound_or_normalization_refused");
}
export function memoryVersion(id: string, text: string, parent: string | null, evidence: string[]) {
  assertMemory(text);
  return Object.freeze({ id, text, sha256: sha(text), characters: [...text].length,
    bytes: bytes(text), parent, evidence: [...evidence], candidate_only: true });
}
export type Memory = ReturnType<typeof memoryVersion>;

const COMMON = `This is bounded research in disposable state. Generated material is a derived candidate, never accepted truth or authority. Use only the supplied files and task. Do not use prior conversations, external search, production resources, or future tasks. Collect only concise public action rationales, source-supported findings and observable results; do not return hidden reasoning. Preserve mandatory constraints. Return the normal native-host JSON; put the requested content in its summary. Do not edit files or invent commands, observations, verification success, or authority.`;
const OUTPUT = `Keep summary within 4096 characters and other public fields concise. changed_files and artifacts must be empty. Report actual source reads separately from coordinator probes; selecting a probe is not executing it. No raw shell command/output is needed in the result.`;

export const RECIPES = Object.freeze({
  extract: `${COMMON}\nRead SEED.md. Separate this case's answer from a reusable method. Produce one small natural-language conditional investigation procedure: when relevant; map concrete entities to reusable roles/relationships; a concrete check that distinguishes plausible causes; what each result changes in the next action; when to stop, decline reuse or reconsider; supporting episode, counterexamples and uncertainty. Label new abstractions as present hypotheses/interpretations, not the original worker's recorded reasons. "Check sources" or unconditional "cache expensive work" is insufficient. Existing candidates, if any, are in SEED.md. No fixed heading taxonomy is required. Put only the complete procedure in summary, at most 1800 Unicode characters and 7200 UTF-8 bytes, without leading/trailing whitespace. ${OUTPUT}`,
  memo: `${COMMON}\nRead SEED.md. Create the strongest useful free-form working memo for later repository investigations. You may freely organize facts, methods, conditional procedures, useful information requests, cautions and justified decisions to do no further work. Do not weaken the memo to contrast with another method. Preserve source attribution, corrections and limits. Put only the complete memo in summary, at most 1800 Unicode characters and 7200 UTF-8 bytes, without leading/trailing whitespace. ${OUTPUT}`,
  choose: `${COMMON}\nRead TASK.md and SOURCE.txt. First state the intended next investigation action and its important assumptions. Then consider the exact candidate in MEMORY.md: select zero, one or a small number of its relevant procedures. Check uncertain assumptions only when task-relevant or mandatory. A memo may contain equally useful procedures; non-use is valid. Select at most one listed probe, or NONE if source inspection already supports a substantive endpoint. A trusted coordinator executes exactly the selected probe on the frozen disposable state; you cannot run diagnostic commands yourself. Return summary as a JSON object with string fields intended_action, assumptions, memory_use, probe_id, rationale, finding_if_no_probe. Use a listed ID verbatim. Unsupported choices receive a refusal, never an improved substitute. ${OUTPUT}`,
  conclude: `${COMMON}\nRead TASK.md, SOURCE.txt, MEMORY.md and OBSERVATION.json. The latter contains your exact prior public choice and the actual coordinator observation (or refusal), not another arm's result. Reach a substantive source-supported diagnosis, repair/reuse direction, or necessary discriminating finding. State what the observation supports, what remains unknown and the appropriate next action. A proposed checklist or repeating a probe name is insufficient. Do not claim the proposed repair was applied. Non-use of memory is valid. ${OUTPUT}`,
  updateMemo: `${COMMON}\nRead MEMORY.md and FEEDBACK.json. Update the strongest free-form memo using only your arm's actual experience. You may freely reorganize or rewrite useful content, invent conditional methods, request useful information, or preserve unchanged. Preserve relevant corrections, evidence and uncertainty within the same budget. No future tasks or sibling results are available. Put only the complete resulting memo in summary, at most 1800 Unicode characters and 7200 UTF-8 bytes, without leading/trailing whitespace. ${OUTPUT}`,
  revise: `${COMMON}\nRead the exact prior procedure in MEMORY.md and your own actions, observations and attributable feedback in FEEDBACK.json. Propose ONE justified local change: narrow applicability, split cases, replace a step/result-dependent branch, suspend use, or KEEP unchanged. Do not force a counterexample or make every failure a warning. Distinguish a bad applicability judgment, bad step, changed conditions, unresolved cause and no demonstrated defect; correlation alone is not attribution. Return summary as JSON with string fields operation (KEEP or REPLACE), cause (bad_applicability, bad_step, changed_conditions, unresolved, no_defect), before, after, reason. For KEEP, before and after are empty. For REPLACE, before must be one exact unique substring of the prior procedure, at most 900 characters; after is its replacement, at most 900 characters. The resulting full procedure must stay within 1800 Unicode characters and 7200 UTF-8 bytes. Explain the local change or justified no-change using specific feedback evidence. The coordinator preserves every prior version and applies only this exact replacement; it does not repair invalid output. ${OUTPUT}`,
});

export function parseChoice(text: string, probes: readonly string[]) {
  const value: unknown = JSON.parse(text);
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("method_choice_invalid");
  const choice = value as Record<string, unknown>;
  const fields = ["intended_action", "assumptions", "memory_use", "probe_id", "rationale", "finding_if_no_probe"] as const;
  if (Object.keys(choice).sort().join() !== [...fields].sort().join() || fields.some(k => typeof choice[k] !== "string"))
    throw new Error("method_choice_invalid");
  const result = choice as Record<typeof fields[number], string>;
  return { ...result, supported: result.probe_id === "NONE" || probes.includes(result.probe_id) };
}

export function reviseMemory(prior: Memory, id: string, text: string, evidence: string[]): Memory {
  const change = JSON.parse(text) as Record<string, unknown>;
  if (!change || Object.keys(change).sort().join() !== "after,before,cause,operation,reason" ||
    Object.values(change).some(v => typeof v !== "string") || !(change.reason as string).trim() ||
    !["bad_applicability", "bad_step", "changed_conditions", "unresolved", "no_defect"].includes(change.cause as string))
    throw new Error("method_revision_invalid");
  let next: string;
  if (change.operation === "KEEP" && change.before === "" && change.after === "") next = prior.text;
  else if (change.operation === "REPLACE" && change.before && change.before !== change.after &&
    [...change.before as string].length <= 900 && [...change.after as string].length <= 900 &&
    prior.text.split(change.before as string).length === 2)
    next = prior.text.replace(change.before as string, () => change.after as string);
  else throw new Error("method_revision_not_one_exact_local_change");
  return memoryVersion(id, next, prior.sha256, evidence);
}

/** Local append-only accounting is persisted by the CLI before any invocation.
 * No rerun, replacement slot, evaluator call or reset is offered. */
export class TurnBudget {
  readonly initiated: { job: Job; turn: number }[] = [];
  claim(job: Job, turn: number) {
    const used = this.initiated.filter(x => x.job === job);
    if (!ORDER.includes(job) || !Number.isInteger(turn) || turn !== used.length + 1 ||
      turn > (job.startsWith("T") ? LIMITS.workerTurns : LIMITS.memoryTurns) ||
      this.initiated.length >= LIMITS.totalTurns) throw new Error("method_turn_budget_refused");
    this.initiated.push({ job, turn });
  }
}

export function memoryFor(job: Job): string | null {
  if (!job.startsWith("T")) return job.endsWith("0") ? null : `${job[0]}${Number(job[1]) - 1}`;
  const [task, arm] = job.split("-");
  return arm === "F" ? "P0" : `${arm === "B" ? "B" : "P"}${Number(task![1]) - 1}`;
}
