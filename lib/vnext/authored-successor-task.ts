import { AUTHORED_SUCCESSOR_TASK_V01, AUTHORED_SUCCESSOR_CONTEXT_V01 } from "@/types/vnext/project-work-initialization";
import { canonicalizeProtocolValueV01, createProtocolSha256V01 } from "./protocol-primitives";
import { normalizeInitialProjectWorkDefinitionV01 } from "./runtime/initial-project-work-context";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";

/** Local task-authoring profile, not a semantic Transition or execution grant. */
export { AUTHORED_SUCCESSOR_TASK_V01 } from "@/types/vnext/project-work-initialization";
export interface AuthoredSuccessorTaskDefinitionV01 {
  objective: string;
  approved_instruction_hashes: string[];
  checks: { check_id: string; criterion: string }[];
  stop_conditions: string[];
  materials: { relative_path: string; sha256: string; role: "task_data" | "historical_material" }[];
}
export class AuthoredSuccessorTaskErrorV01 extends Error {
  constructor(readonly code: string) { super(code); this.name = "AuthoredSuccessorTaskErrorV01"; }
}
export function requireSuccessorV01(value: unknown, reason: string): asserts value {
  if (!value) throw new AuthoredSuccessorTaskErrorV01(`successor_task_${reason}`);
}
export const successorDigestV01 = (value: unknown) => createProtocolSha256V01(canonicalizeProtocolValueV01(value));
export const equalSuccessorV01 = (a: unknown, b: unknown) => canonicalizeProtocolValueV01(a) === canonicalizeProtocolValueV01(b);

export function normalizeAuthoredSuccessorTaskV01(value: unknown, workingContext = false): AuthoredSuccessorTaskDefinitionV01 {
  requireSuccessorV01(value && typeof value === "object" && !Array.isArray(value), "definition_invalid");
  const d = value as AuthoredSuccessorTaskDefinitionV01;
  requireSuccessorV01(equalSuccessorV01(Object.keys(d).sort(), ["approved_instruction_hashes", "checks", "materials", "objective", "stop_conditions"]), "definition_fields");
  requireSuccessorV01(Array.isArray(d.checks) && d.checks.length > 0 && d.checks.length <= (workingContext ? 12 : 8) &&
    d.checks.every(c => c && equalSuccessorV01(Object.keys(c).sort(), ["check_id", "criterion"]) &&
      /^[a-z][a-z0-9_]{0,63}$/u.test(c.check_id) && typeof c.criterion === "string") &&
    new Set(d.checks.map(c => c.check_id)).size === d.checks.length, "checks_invalid");
  requireSuccessorV01(Array.isArray(d.approved_instruction_hashes) && d.approved_instruction_hashes.length <= 4 &&
    d.approved_instruction_hashes.every(v => /^[a-f0-9]{64}$/u.test(v)) &&
    new Set(d.approved_instruction_hashes).size === d.approved_instruction_hashes.length, "instruction_hashes_invalid");
  const task = normalizeInitialProjectWorkDefinitionV01({ goal: d.objective,
    success_criteria: d.checks.map(c => c.criterion), non_goals: d.stop_conditions });
  requireSuccessorV01((workingContext || task.non_goals.length > 0) && task.success_criteria.length === d.checks.length, "definition_not_normalized");
  requireSuccessorV01(Array.isArray(d.materials) && (workingContext ? d.materials.length === 0 && d.approved_instruction_hashes.length === 0 : d.materials.length > 0) && d.materials.length <= 8 &&
    d.materials.every(m => m && equalSuccessorV01(Object.keys(m).sort(), ["relative_path", "role", "sha256"]) &&
      /^[A-Za-z0-9][A-Za-z0-9_-]*\.(?:json|md|txt)$/u.test(m.relative_path) &&
      !/^(?:AGENTS|CLAUDE)\./iu.test(m.relative_path) && /^[a-f0-9]{64}$/u.test(m.sha256) &&
      ["task_data", "historical_material"].includes(m.role)) &&
    (workingContext || d.materials.some(m => m.role === "task_data")) &&
    new Set(d.materials.map(m => m.relative_path)).size === d.materials.length, "materials_invalid");
  return { ...structuredClone(d), objective: task.goal, stop_conditions: task.non_goals,
    checks: task.success_criteria.map(criterion => ({ check_id: d.checks.find(c => c.criterion.trim() === criterion)!.check_id, criterion })),
    materials: [...d.materials].sort((a, b) => a.relative_path < b.relative_path ? -1 : a.relative_path > b.relative_path ? 1 : 0) };
}

/** The packet is validated through the persisted compiler lineage owner before
 * admission. This parser supplies no authority for caller-created packets. */
export function readAuthoredSuccessorDefinitionV01(packet: TaskContextPacketV01): AuthoredSuccessorTaskDefinitionV01 {
  requireSuccessorV01(packet.compatibility.source_contracts.includes(AUTHORED_SUCCESSOR_TASK_V01), "authored_definition_required");
  const entries = packet.selected_context.filter(e => e.entry_id === AUTHORED_SUCCESSOR_TASK_V01);
  requireSuccessorV01(entries.length === 1 && typeof entries[0]!.bounded_summary === "string" &&
    Buffer.byteLength(entries[0]!.bounded_summary!) <= 16_384, "definition_missing");
  let value: unknown;
  try { value = JSON.parse(entries[0]!.bounded_summary!); } catch { requireSuccessorV01(false, "definition_invalid"); }
  const definition = normalizeAuthoredSuccessorTaskV01(value, packet.compatibility.source_contracts.includes(AUTHORED_SUCCESSOR_CONTEXT_V01));
  requireSuccessorV01(equalSuccessorV01(packet.task, { goal: definition.objective,
    success_criteria: definition.checks.map(c => c.criterion), non_goals: definition.stop_conditions }) &&
    equalSuccessorV01(packet.constraints.required_checks, definition.checks.map(c => c.check_id).sort()) &&
    equalSuccessorV01(packet.return_contract.required_checks, packet.constraints.required_checks) &&
    equalSuccessorV01(packet.constraints.forbidden_actions, definition.stop_conditions) &&
    packet.current_projection?.bounded_summary === definition.objective && !packet.capability_grant &&
    !packet.criterion_verification_plan, "task_contract_conflict");
  return definition;
}

/** Exact reviewed inventory/role consistency, not a natural-language conflict
 * detector and not a claim that the worker has consumed any file. */
export function assertAuthoredSuccessorInventoryV01(packet: TaskContextPacketV01, input: {
  files: readonly { relative_path: string; sha256: string }[];
  historical_files: readonly { relative_path: string; sha256: string }[];
  approved_instruction_hashes: readonly string[];
}): void {
  const d = readAuthoredSuccessorDefinitionV01(packet);
  const inventory = (role: "task_data" | "historical_material") => d.materials.filter(m => m.role === role)
    .map(({ relative_path, sha256 }) => ({ relative_path, sha256 }));
  requireSuccessorV01(equalSuccessorV01(input.files, inventory("task_data")) &&
    equalSuccessorV01(input.historical_files, inventory("historical_material")) &&
    equalSuccessorV01(input.approved_instruction_hashes, d.approved_instruction_hashes), "inventory_role_conflict");
}
