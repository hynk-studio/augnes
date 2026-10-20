import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync, readdirSync, copyFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";
import { createCanonicalTestResourceRoot, buildCanonicalChildEnvironment, beginCanonicalTestResourceUse,
  settleCanonicalTestResourceUse, cleanupCanonicalTestResources } from "./canonical-test-environment.mjs";
import { runCanonicalChild, canonicalChildAcceptanceFailure } from "./canonical-child-runner.mjs";
import { genericCliBuilderInputFixture } from "../fixtures/vnext/protocol/task-context-packet-v0-1";
import { buildTaskContextPacketV01, canonicalizeTaskContextValueV01 as canonical,
  TaskContextPacketBudgetErrorV01, type TaskContextPacketBuilderInputV01 } from "../lib/vnext/task-context-packet";

/** Bounded compiler controls. Custom fixture caps do not alter successor limits. */
export function assertCompilerBudgetDiagnostics() {
  const input: TaskContextPacketBuilderInputV01 = structuredClone(genericCliBuilderInputFixture);
  input.task.goal = 'Review 한국어 ASCII 😀 "quoted" \\ escaped material';
  input.constraints.context_budget = { max_selected_entries: 24, max_projection_items: 4,
    max_characters: 76_000, max_estimated_tokens: 19_000 };
  const packet = buildTaskContextPacketV01(input), text = canonical(packet);
  // Independently count the serialized UTF-16 encoding, not displayed characters/UTF-8.
  const units = Buffer.byteLength(text, "utf16le") / 2;
  assert.equal(units, text.length); assert.notEqual(units, [...text].length);
  assert.notEqual(units, Buffer.byteLength(text, "utf8"));
  const { fingerprint: _fingerprint, ...integrity } = packet.integrity;
  const tokenMaterial = { ...packet, packet_id: "task-context-packet:pending", integrity,
    constraints: { ...packet.constraints, context_budget: { ...packet.constraints.context_budget, estimated_tokens: null } } };
  const estimate = Math.max(1, Math.ceil(Buffer.byteLength(canonical(tokenMaterial), "utf16le") / 8));
  assert.equal(packet.constraints.context_budget.estimated_tokens, estimate);

  // Same-width cap keeps the serialized measurement stable. The candidate is
  // always bounded; no failed packet is rebuilt with an unlimited estimator.
  input.constraints.context_budget.max_characters = units;
  const capWidthChange = String(units).length - String(76_000).length;
  input.task.goal += "x".repeat(-capWidthChange);
  const atCharacterLimit = buildTaskContextPacketV01(input);
  assert.equal(canonical(atCharacterLimit).length, units);
  input.task.goal += "😀";
  assert.throws(() => buildTaskContextPacketV01(input), error => {
    assert(error instanceof TaskContextPacketBudgetErrorV01);
    assert.deepEqual(error.diagnostic, { budget: "max_characters", unit: "utf16_code_units",
      observed: units + 2, limit: units, overage: 2 }); return true;
  });
  // Both caps fail: preserve the compiler's character-first ordering.
  input.constraints.context_budget.max_estimated_tokens = 1;
  input.task.goal += "xxxx";
  assert.throws(() => buildTaskContextPacketV01(input), error => error instanceof TaskContextPacketBudgetErrorV01 && error.budget === "max_characters");

  for (const characterCap of [76_000, null]) {
    const tokenInput: TaskContextPacketBuilderInputV01 = structuredClone(genericCliBuilderInputFixture);
    tokenInput.task.goal = 'Token estimate 한국 😀 "escape"';
    tokenInput.constraints.context_budget = { max_selected_entries: 24, max_projection_items: 4,
      max_characters: characterCap, max_estimated_tokens: 9_999 };
    const baseline = buildTaskContextPacketV01(tokenInput);
    assert.equal(baseline.constraints.context_budget.max_characters, characterCap ?? 200_000,
      "Null input retains the compiler's bounded default; it is not a zero cap");
    const limit = baseline.constraints.context_budget.estimated_tokens!;
    assert.equal(String(limit).length, 4);
    tokenInput.constraints.context_budget.max_estimated_tokens = limit;
    assert.equal(buildTaskContextPacketV01(tokenInput).constraints.context_budget.estimated_tokens, limit);
    tokenInput.task.goal += "xxxx";
    assert.throws(() => buildTaskContextPacketV01(tokenInput), error => {
      assert(error instanceof TaskContextPacketBudgetErrorV01);
      assert.deepEqual(error.diagnostic, { budget: "max_estimated_tokens", unit: "estimated_tokens",
        observed: limit + 1, limit, overage: 1 }); return true;
    });
  }
  const unexpected = new RangeError("unrelated compiler input failure");
  assert.throws(() => buildTaskContextPacketV01({ ...input, get task() { throw unexpected; } }), error => error === unexpected);
  console.log(JSON.stringify({ compiler_budget_diagnostics: "passed", canonical_utf16_units: units,
    canonical_utf8_bytes: Buffer.byteLength(text), code_points: [...text].length, estimated_tokens: estimate,
    boundaries: "exact cap accepted; +2 UTF-16 units / +1 estimated token refused", null_cap_not_zero: true }));
}

export async function assertExplicitArtifactPreservingRepair() {
  const repo = process.cwd(), owner = createCanonicalTestResourceRoot("ag-suite-", { shortSocketPaths: true });
  beginCanonicalTestResourceUse(owner);
  const hash = (b: Buffer | string) => createHash("sha256").update(b).digest("hex");
  // Predeclared by the test coordinator, before the producer or consumer runs.
  // The consumer is not handed this map; it must read the preserved artifact.
  const obligations = [
    { id: "originals", action: "Keep original photo files immutable and record their SHA-256 inventory.", condition: "Before any future conversion" },
    { id: "staging", action: "Write future catalogue candidates only into separate staging.", condition: "No overwrite of the original tree" },
    { id: "schema", action: "Validate every candidate against the catalogue schema after every attempt.", condition: "No schema PASS inferred from process exit" },
    { id: "row_count", action: "Compare source and output record counts after every attempt.", condition: "Any mismatch blocks promotion" },
    { id: "content", action: "Verify exact identifier, label and file-digest content after every attempt.", condition: "Include Korean, ASCII, astral and escaped-name cases" },
    { id: "rollback", action: "Retain a rollback manifest mapping staged records to immutable originals.", condition: "Rehearse rollback before any separately authorized promotion" },
    { id: "correction", action: "Keep rejected claim R1 and correction C1: row count alone never proves content integrity.", condition: "The earlier claim remains historical, not accepted" },
    { id: "applicability", action: "Hold conversion until duplicate identifiers and timezone interpretation are resolved.", condition: "Applicability is unresolved; no automatic execution" },
  ];
  const plan = { scenario: "New synthetic offline photo catalogue planning fixture", obligations,
    history: { rejected: "R1: matching row count is sufficient", correction: "C1: require independent schema, row-count and exact content checks" },
    unresolved_conditions: ["duplicate identifiers", "timezone interpretation"] };
  const full = "# Complete original catalogue plan\n\nPlanning only; no conversion or execution authority.\n\n```json\n" + JSON.stringify(plan, null, 2) + "\n```\n\n" +
    obligations.map(o => `## ${o.id}\n\n${o.action}\n${o.condition}\n` +
      "Review the original inventory and document the applicable branch. Preserve the exact evidence and the reason for any deferred action; a generated checklist does not complete its checks. 한국어 / ASCII / 😀 / \"quoted\\\\name\".\n".repeat(5)).join("\n");
  let settled = true, completed = false;
  const children: unknown[] = [];
  try {
    mkdirSync(path.join(owner.root, "project"));
    mkdirSync(path.join(owner.root, "home"));
    writeFileSync(path.join(owner.root, "project", "complete-plan.md"), full, { flag: "wx", mode: 0o600 });
    writeFileSync(path.join(owner.root, "obligation-map.json"), JSON.stringify(plan, null, 2) + "\n", { flag: "wx" });
    const bundle = path.join(owner.root, "fixture.cjs");
    await build({ entryPoints: [path.join(repo, "scripts/successor-budget-repair-fixture.ts")], outfile: bundle,
      bundle: true, platform: "node", format: "cjs", packages: "external", plugins: [{ name: "source-locations", setup(b) {
        b.onLoad({ filter: /\.(?:mjs|ts)$/ }, async args => ({ contents: readFileSync(args.path, "utf8")
          .replaceAll("import.meta.url", JSON.stringify(pathToFileURL(args.path).href)), loader: args.path.endsWith(".ts") ? "ts" : "js" }));
      } }] });
    const env: NodeJS.ProcessEnv = { ...buildCanonicalChildEnvironment({ temporaryRoot: owner.root }), NODE_PATH: path.join(repo, "node_modules") };
    delete env.OPENAI_API_KEY;
    for (const mode of ["produce", "consume"]) {
      settled = false;
      const result = await runCanonicalChild({ suite: "successor-budget-repair", label: mode, command: process.execPath,
        args: [bundle, mode, owner.root], cwd: repo, env, timeoutMs: 30_000 });
      children.push(result);
      settled = result.exit_observed && result.streams_closed && result.cleanup_completed && result.remaining_owned_processes === 0;
      assert.equal(canonicalChildAcceptanceFailure(result, { suite: "successor-budget-repair", timeoutMs: 30_000, requireNaturalExit: true }), null);
      // The producer is fully settled before the fresh consumer is spawned.
    }
    const producer = JSON.parse(readFileSync(path.join(owner.root, "producer-result.json"), "utf8"));
    const consumer = JSON.parse(readFileSync(path.join(owner.root, "consumer-output.json"), "utf8"));
    assert.notEqual(consumer.pid, producer.pid);
    assert.equal(producer.adapter_calls, 1); assert.equal(consumer.actual_model_calls, 0);
    assert.equal(consumer.artifact.sha256, hash(full));
    assert.equal(consumer.actual_file_read.bytes, Buffer.byteLength(full));
    assert.equal(consumer.actual_file_read.sha256, hash(full));
    assert.equal(consumer.current_packet.packet_id, producer.packet_id);
    assert.equal(consumer.current_packet.packet_fingerprint, producer.packet_fingerprint);
    assert.deepEqual(consumer.checklist, obligations.map(o => ({ ...o, status: "pending_explicit_authorization_and_checks" })));
    assert.deepEqual(consumer.history, plan.history); assert.deepEqual(consumer.unresolved_conditions, plan.unresolved_conditions);
    assert.equal(consumer.decision, "hold_conversion_pending_applicability_and_validation");
    assert.equal(hash(readFileSync(path.join(owner.root, "rejected-draft.json"))), producer.rejected_draft_sha256);
    assert.equal(hash(readFileSync(path.join(owner.root, "project", "complete-plan.md"))), hash(full));
    completed = true;
    console.log(JSON.stringify({ explicit_artifact_repair: "passed", obligation_checks: obligations.length,
      actual_file_bytes: Buffer.byteLength(full), full_plan_sha256: hash(full), packet_budget: producer.packet_budget,
      retained_notes: producer.retained_notes, producer_settled_before_fresh_consumer: true,
      consumption: "scripted", representation_author: "fixture coordinator", model_use: "NOT_RUN", comparative_usefulness: "NOT_RUN" }));
  } finally {
    const index = process.argv.indexOf("--evidence-dir");
    if (index >= 0) {
      const destination = path.resolve(process.argv[index + 1]!);
      assert(destination.startsWith(path.join(repo, ".augnes-local-verification") + path.sep));
      mkdirSync(destination, { recursive: true });
      // Explicit synthetic evidence allowlist. Never copy session, access config,
      // database, compiled bundle, provider payload or broad process transcript.
      for (const name of readdirSync(owner.root).filter(n => /^(?:produce-|consume-|producer-result|consumer-output|obligation-map|representation-change|rejected-draft|next-work-checklist).*\.(?:json|md)$/u.test(n)))
        copyFileSync(path.join(owner.root, name), path.join(destination, name));
      copyFileSync(path.join(owner.root, "project", "complete-plan.md"), path.join(destination, "complete-plan.md"));
      writeFileSync(path.join(destination, "process-results.json"), JSON.stringify({ completed, children }, null, 2) + "\n");
    }
    if (settled) settleCanonicalTestResourceUse(owner, { exit_observed: true, streams_closed: true, cleanup_completed: true, remaining_owned_processes: 0 });
    const cleanup = cleanupCanonicalTestResources([owner]);
    console.log(JSON.stringify({ successor_budget_repair_cleanup: cleanup }));
    assert(cleanup.every((x: { completed: boolean }) => x.completed));
  }
}
