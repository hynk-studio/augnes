/** Independent renewal calculation. Candidate bytes are data, never modules. */
export const WORKFLOW_COST_PROFILE = "workflow_cost_report_verification.v1";
export const WORKFLOW_COST_VERIFIER = "workflow_cost_renewal_verifier.v1";
export const WORKFLOW_COST_ADAPTER = "workflow_cost_verification_adapter.v1";
export const WORKFLOW_COST_CHECKS = [
  "workflow_cost_source_binding", "workflow_cost_report_schema", "workflow_cost_authoritative_inputs",
  "workflow_cost_expected_work", "workflow_cost_difference", "workflow_cost_status_comparison",
  "workflow_cost_read_only",
] as const;
export const WORKFLOW_COST_LIMITS = Object.freeze({ files: 2, input_bytes: 65_536, json_depth: 4,
  json_members: 32, input_digits: 20, input_bits: 64, arithmetic_bits: 1024,
  result_bytes: 16_384, timeout_ms: 10_000, settle_ms: 10_000 });
export const WORKFLOW_COST_INPUT_KEYS = ["attempt", "verification", "repair", "direct_success", "inspection", "inspected_success"] as const;
export type WorkflowCostInputs = Record<typeof WORKFLOW_COST_INPUT_KEYS[number], string>;
type Rational = { n: bigint; d: bigint };
export type WorkflowCostCalculation = {
  direct: { status: "finite" | "non_completing"; expected_work: string | null };
  inspected: { status: "finite" | "non_completing"; expected_work: string | null };
  inspection_minus_direct: string | null;
  comparison: "not_comparable" | "inspection_reduces_work" | "inspection_adds_work" | "equal_work";
};
export class WorkflowCostError extends Error {
  readonly status = 422;
  constructor(readonly code: string) { super(code); }
}
export function workflowCostRequire(ok: unknown, code: string): asserts ok {
  if (!ok) throw new WorkflowCostError(code);
}
export function exactObject(value: unknown, keys: readonly string[]): Record<string, unknown> {
  workflowCostRequire(value !== null && typeof value === "object" && !Array.isArray(value) &&
    Object.keys(value).sort().join(",") === [...keys].sort().join(","), "workflow_cost_schema_invalid");
  return value as Record<string, unknown>;
}

/** The published format contains only objects, strings and null. Bounded descent
 * also refuses duplicate keys (including escaped aliases), arrays and floats. */
export function parseWorkflowCostJson(text: string): unknown {
  workflowCostRequire(Buffer.byteLength(text, "utf8") <= WORKFLOW_COST_LIMITS.input_bytes, "workflow_cost_input_bound");
  let i = 0, members = 0;
  const ws = () => { while (/[\x20\t\r\n]/u.test(text[i] ?? "!")) i++; };
  const string = (): string => {
    workflowCostRequire(text[i] === '"', "workflow_cost_json_invalid");
    const start = i++;
    while (i < text.length) {
      if (text[i] === "\\") { i += 2; continue; }
      if (text[i++] === '"') {
        workflowCostRequire(i - start <= 2048, "workflow_cost_json_string_bound");
        try { return JSON.parse(text.slice(start, i)) as string; } catch { break; }
      }
    }
    throw new WorkflowCostError("workflow_cost_json_invalid");
  };
  const value = (depth: number): unknown => {
    ws();
    workflowCostRequire(depth <= WORKFLOW_COST_LIMITS.json_depth, "workflow_cost_json_depth_bound");
    if (text[i] === '"') return string();
    if (text.slice(i, i + 4) === "null") { i += 4; return null; }
    workflowCostRequire(text[i++] === "{", "workflow_cost_json_invalid");
    const result: Record<string, unknown> = Object.create(null);
    ws();
    if (text[i] === "}") { i++; return result; }
    while (i < text.length) {
      ws(); const key = string(); ws();
      workflowCostRequire(!Object.hasOwn(result, key) && ++members <= WORKFLOW_COST_LIMITS.json_members && text[i++] === ":", "workflow_cost_json_members_invalid");
      result[key] = value(depth + 1); ws();
      if (text[i] === "}") { i++; return result; }
      workflowCostRequire(text[i++] === ",", "workflow_cost_json_invalid");
    }
    throw new WorkflowCostError("workflow_cost_json_invalid");
  };
  const result = value(0); ws();
  workflowCostRequire(i === text.length, "workflow_cost_json_invalid");
  return result;
}
function rational(n: bigint, d: bigint): Rational {
  workflowCostRequire(d > BigInt(0) && n.toString(2).replace("-", "").length <= 1024 && d.toString(2).length <= 1024, "workflow_cost_arithmetic_bound");
  let a = n < BigInt(0) ? -n : n, b = d;
  while (b) [a, b] = [b, a % b];
  return { n: n / a, d: d / a };
}
function parseRational(value: unknown): Rational {
  workflowCostRequire(typeof value === "string" && /^[+-]?[0-9]{1,20}(?:\/[0-9]{1,20})?$/u.test(value), "workflow_cost_rational_invalid");
  const [n, d = "1"] = value.split("/");
  const r = rational(BigInt(n!), BigInt(d));
  workflowCostRequire((r.n < BigInt(0) ? -r.n : r.n).toString(2).length <= 64 && r.d.toString(2).length <= 64, "workflow_cost_rational_bound");
  return r;
}
const render = (r: Rational) => r.d === BigInt(1) ? String(r.n) : `${r.n}/${r.d}`;
const add = (a: Rational, b: Rational) => rational(a.n * b.d + b.n * a.d, a.d * b.d);
const subtract = (a: Rational, b: Rational) => add(a, { n: -b.n, d: b.d });
const multiply = (a: Rational, b: Rational) => rational(a.n * b.n, a.d * b.d);
const divide = (a: Rational, b: Rational) => rational(a.n * b.d, a.d * b.n);

export function normalizeWorkflowCostInputs(value: unknown): WorkflowCostInputs {
  const input = exactObject(value, WORKFLOW_COST_INPUT_KEYS);
  return Object.fromEntries(WORKFLOW_COST_INPUT_KEYS.map(key => {
    const r = parseRational(input[key]);
    workflowCostRequire(r.n >= BigInt(0) && (!key.endsWith("success") || r.n <= r.d), "workflow_cost_input_range");
    return [key, render(r)];
  })) as WorkflowCostInputs;
}
export function calculateWorkflowCost(inputs: WorkflowCostInputs): WorkflowCostCalculation {
  const v = Object.fromEntries(Object.entries(normalizeWorkflowCostInputs(inputs)).map(([k, s]) => [k, parseRational(s)]));
  const expected = (p: Rational, inspection: Rational) => p.n === BigInt(0) ? null
    : divide(add(add(add(v.attempt!, v.verification!), inspection), multiply(subtract({ n: BigInt(1), d: BigInt(1) }, p), v.repair!)), p);
  const direct = expected(v.direct_success!, { n: BigInt(0), d: BigInt(1) });
  const inspected = expected(v.inspected_success!, v.inspection!);
  const delta = direct && inspected ? subtract(inspected, direct) : null;
  const branch = (r: Rational | null) => ({ status: r === null ? "non_completing" as const : "finite" as const, expected_work: r === null ? null : render(r) });
  return { direct: branch(direct), inspected: branch(inspected), inspection_minus_direct: delta === null ? null : render(delta),
    comparison: delta === null ? "not_comparable" : delta.n < BigInt(0) ? "inspection_reduces_work" : delta.n > BigInt(0) ? "inspection_adds_work" : "equal_work" };
}
export function verifyWorkflowCostReport(inputs: WorkflowCostInputs, reportText: string) {
  const recomputed = calculateWorkflowCost(inputs);
  const checks: Record<string, boolean> = Object.fromEntries(WORKFLOW_COST_CHECKS.slice(1, -1).map(id => [id, false]));
  let reported: WorkflowCostCalculation | null = null;
  try {
    const r = exactObject(parseWorkflowCostJson(reportText), ["inputs", "evidence", "workflows", "inspection_minus_direct", "comparison"]);
    const workflows = exactObject(r.workflows, ["direct", "inspected"]);
    const branch = (v: unknown) => {
      const row = exactObject(v, ["status", "expected_work"]);
      workflowCostRequire(["finite", "non_completing"].includes(String(row.status)) &&
        (row.expected_work === null || typeof row.expected_work === "string" && /^-?[0-9]{1,310}(?:\/[0-9]{1,310})?$/u.test(row.expected_work)), "workflow_cost_report_value_invalid");
      return row as WorkflowCostCalculation["direct"];
    };
    const echoed = normalizeWorkflowCostInputs(r.inputs);
    workflowCostRequire(r.evidence === "constructed development calculation; probabilities and costs are stipulated" &&
      ["not_comparable", "inspection_reduces_work", "inspection_adds_work", "equal_work"].includes(String(r.comparison)) &&
      (r.inspection_minus_direct === null || typeof r.inspection_minus_direct === "string" && /^-?[0-9]{1,310}(?:\/[0-9]{1,310})?$/u.test(r.inspection_minus_direct)), "workflow_cost_report_value_invalid");
    reported = { direct: branch(workflows.direct), inspected: branch(workflows.inspected),
      inspection_minus_direct: r.inspection_minus_direct as string | null, comparison: r.comparison as WorkflowCostCalculation["comparison"] };
    checks.workflow_cost_report_schema = true;
    checks.workflow_cost_authoritative_inputs = WORKFLOW_COST_INPUT_KEYS.every(k => echoed[k] === inputs[k]);
    checks.workflow_cost_expected_work = reported.direct.expected_work === recomputed.direct.expected_work && reported.inspected.expected_work === recomputed.inspected.expected_work;
    checks.workflow_cost_difference = reported.inspection_minus_direct === recomputed.inspection_minus_direct;
    checks.workflow_cost_status_comparison = reported.direct.status === recomputed.direct.status && reported.inspected.status === recomputed.inspected.status && reported.comparison === recomputed.comparison;
  } catch (error) { if (!(error instanceof WorkflowCostError)) throw error; }
  return { inputs, recomputed, reported, checks, consistent: Object.values(checks).every(Boolean) };
}
