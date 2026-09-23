import assert from "node:assert/strict";
import { appendFileSync, mkdirSync, readFileSync, readdirSync, symlinkSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { Writable } from "node:stream";
import { fileURLToPath } from "node:url";
import { createCanonicalTestResourceRoot, buildCanonicalChildEnvironment, cleanupCanonicalTestResources } from "../canonical-test-environment.mjs";
import { runCanonicalChild, canonicalChildAcceptanceFailure } from "../canonical-child-runner.mjs";
import { resolveCodexProductionRuntimeV01 } from "@/lib/vnext/native-host/codex-production-runtime";
import { SCOPED_CODEX_MODEL_V01, SCOPED_CODEX_EFFORT_V01 } from "@/lib/vnext/native-host/codex-scoped-task";
import { BASE, CASES, SEED, SEED_SOURCE, REVIEW, freezeCases } from "./cases";
import { LIMITS, METHOD_VERSION, ORDER, RECIPES, TurnBudget, memoryVersion, memoryFor, reviseMemory, parseChoice,
  sha, bytes, type Memory, type Job, type Task } from "./method";
import { nativeTurn, approvedInstructions } from "./native-turn";
import { resolveAugnesLocalPaths } from "../augnes-local-paths.mjs";
import { matchCanonicalRepositoryIdentity } from "../canonical-repository-identity.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const sourceDir = path.join(root, "scripts/conditional-procedure-learning");
const OWNER_FILES = ["lib/intake/selected-work-source-comparison.ts", "lib/vnext/native-host/codex-scoped-task.ts",
  "lib/vnext/native-host/codex-app-server-adapter.ts", "lib/vnext/native-host/codex-qualified-runtime-registry.v1.json",
  "lib/vnext/runtime/direct-native-host-round-trip.ts", "lib/vnext/runtime/live-native-host-run-service.ts",
  "lib/vnext/runtime/project-run-result-read-model.ts", "lib/vnext/runtime/operator-pilot-review-material.ts",
  "scripts/canonical-child-runner.mjs", "scripts/canonical-test-environment.mjs", "scripts/canonical-repository-identity.mjs",
  "package-lock.json", "tsconfig.json"];
const readJSON = (file: string) => JSON.parse(readFileSync(file, "utf8"));
const save = (file: string, value: unknown) => writeFileSync(file, JSON.stringify(value, null, 2) + "\n", { flag: "wx", mode: 0o600 });
const git = (...args: string[]) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
function identity() {
  const origin = git("remote", "get-url", "origin");
  matchCanonicalRepositoryIdentity({ resolvedRoot: git("rev-parse", "--show-toplevel"), originUrl: origin });
  return { root: "canonical_augnes_checkout", origin, branch: git("branch", "--show-current"),
    head: git("rev-parse", "HEAD"), base: git("rev-parse", "origin/main"), tree: git("rev-parse", "HEAD^{tree}"),
    worktree: git("status", "--short"), node: process.version };
}
function runtimeIdentity() {
  // Reuse the supervisor's existing location owner; selection is read-only.
  // This sets only this explicit CLI process's environment, never host config.
  const localPaths = resolveAugnesLocalPaths as (input: { repositoryRoot: string }) => { managed_codex_runtime_directory: string };
  process.env.AUGNES_MANAGED_CODEX_RUNTIME_ROOT ??= localPaths({ repositoryRoot: root }).managed_codex_runtime_directory;
  const runtime = resolveCodexProductionRuntimeV01({ scoped_code_mode: true });
  return { model: SCOPED_CODEX_MODEL_V01, effort: SCOPED_CODEX_EFFORT_V01, version: runtime.cli_version,
    native_sha256: runtime.executable_fingerprint, source_commit: runtime.upstream_source_commit,
    profile: runtime.compatibility_profile_id, profile_fingerprint: runtime.compatibility_profile_fingerprint,
    registry_entry: runtime.qualified_runtime_entry_id, manifest: runtime.managed_store_manifest_fingerprint,
    code_mode: runtime.managed_runtime_selection?.scoped_code_mode?.profile_fingerprint,
    authentication: "existing_ordinary_chatgpt", provider_internal_rounds_and_cost: "unobserved" };
}

export function freeze(directory: string) {
  const started = performance.now();
  const repo = identity(); assert.equal(repo.base, BASE); assert.equal(repo.node, "v24.18.0");
  assert(repo.branch.includes("1320"));
  mkdirSync(directory, { mode: 0o700 });
  mkdirSync(path.join(directory, "authored"));
  const authored = Object.fromEntries(readdirSync(sourceDir).filter(x => x.endsWith(".ts")).sort().map(name => {
    const data = readFileSync(path.join(sourceDir, name));
    writeFileSync(path.join(directory, "authored", name), data, { flag: "wx", mode: 0o400 });
    return [name, sha(data)];
  }));
  const cases = freezeCases();
  const archives = Object.fromEntries([...new Set(Object.values(CASES).map(x => x.ref))].map(ref => {
    const data = execFileSync("git", ["archive", "--format=tar", ref], { cwd: root, maxBuffer: 150_000_000 });
    const name = `${ref}.tar`; writeFileSync(path.join(directory, name), data, { flag: "wx", mode: 0o400 });
    return [ref, { name, sha256: sha(data), bytes: data.length, tree: git("rev-parse", `${ref}^{tree}`) }];
  }));
  const value = { method_version: METHOD_VERSION, frozen_at: new Date().toISOString(), repo, runtime: runtimeIdentity(), authored,
    owner_files: Object.fromEntries(OWNER_FILES.map(name => [name, sha(readFileSync(path.join(root, name)))])),
    approved_instruction_hashes: approvedInstructions().map(x => x.sha256),
    seed: SEED, seed_sha256: sha(SEED), seed_source: SEED_SOURCE, cases, review: REVIEW, archives, limits: LIMITS, order: ORDER,
    task_cutoff: "Exact supplied source commit plus the declared constructed wrapper/display; later fixes, evaluations, other arms and future feedback withheld.",
    isolation: "Fresh disposable DB, plain-folder project, admitted packet, host thread and read snapshot per counted turn. Only current task/source/exact memory/own observation files. Existing generic approved global instructions remain; no planning conversation is provided.",
    feedback: "For B/A, identical categories: exact own choice, chosen real observation or refusal, final public result, current task conditions. No gold or sibling answer. Case-author review only after the sequence; no evaluator-model calls.",
    stop: "No retries/replacement slots. Runtime, isolation, source or cleanup failure stops execution; dependent slots stay NOT_RUN. Invalid method output is retained and dependent arms stop; weak valid output continues as data.",
    output: "Existing native schema, 4096 summary-character ceiling and actual admitted result byte bound; memory <=1800 Unicode characters /7200 bytes; no clipping, padding or hidden reasoning.",
    preparation_ms: performance.now() - started };
  save(path.join(directory, "frozen.json"), value);
  writeFileSync(path.join(directory, "frozen.sha256"), sha(readFileSync(path.join(directory, "frozen.json"))) + "\n", { flag: "wx" });
  console.log(JSON.stringify({ frozen: true, sha256: sha(readFileSync(path.join(directory, "frozen.json"))), runtime: value.runtime,
    cases: Object.keys(cases), archive_bytes: Object.values(archives).reduce((sum, x) => sum + x.bytes, 0) }));
}

export async function runProbe(directory: string, task: Task, probe: string, createResource = createCanonicalTestResourceRoot) {
  if (!Object.hasOwn(CASES[task].probes, probe)) return { status: "refused", code: "probe_not_allowlisted", executed: false };
  const frozen = readJSON(path.join(directory, "frozen.json"));
  const archive = frozen.archives[CASES[task].ref];
  const content = readFileSync(path.join(directory, archive.name)); assert.equal(sha(content), archive.sha256);
  const probeBytes = readFileSync(path.join(directory, "authored/probe.ts")); assert.equal(sha(probeBytes), frozen.authored["probe.ts"]);
  const start = performance.now();
  let output = "", stderr = "";
  const resource = createResource("ag-c02-");
  try {
    const snapshot = path.join(resource.root, "source"); mkdirSync(snapshot);
    execFileSync("/usr/bin/tar", ["-x", "-C", snapshot], { input: content });
    symlinkSync(path.join(root, "node_modules"), path.join(snapshot, "node_modules"), "dir");
    const probeDir = path.join(snapshot, "scripts/conditional-procedure-learning"); mkdirSync(probeDir, { recursive: true });
    writeFileSync(path.join(probeDir, "p46-probe.ts"), probeBytes, { flag: "wx" });
    const stream = (error: boolean) => new Writable({ write(chunk, _encoding, callback) {
      if (error) stderr += String(chunk); else output += String(chunk);
      if (bytes(output) + bytes(stderr) > 64_000) callback(new Error("probe_output_bound_exceeded")); else callback();
    } });
    const command = { command: process.execPath, args: ["--import", "tsx", "scripts/conditional-procedure-learning/p46-probe.ts", task, probe] };
    const result = await runCanonicalChild({ suite: "p46-probe", label: `${task}-${probe}`, ...command, cwd: snapshot,
      env: buildCanonicalChildEnvironment({ temporaryRoot: resource.root, resourceRoot: resource.root }),
      timeoutMs: 30_000, heartbeatMs: 10_000, resourceOwner: resource,
      stdout: stream(false) as typeof process.stdout, stderr: stream(true) as typeof process.stderr, log: () => {} });
    const failure = canonicalChildAcceptanceFailure(result, { suite: "p46-probe", timeoutMs: 30_000, requireNaturalExit: true });
    const observation = { status: failure ? "failed" : "observed", task, probe, source_ref: CASES[task].ref,
      archive_sha256: archive.sha256, probe_owner_sha256: sha(probeBytes), command: ["node", ...command.args],
      result, elapsed_including_preparation_ms: performance.now() - start,
      observation: failure ? null : JSON.parse(output.trim()), failure_code: (failure as (Error & { code?: string }) | null)?.code ?? null, stderr_bytes: bytes(stderr) };
    if (failure) save(path.join(directory, `probe-failure-${task}-${probe}-${Date.now()}.json`), { stdout: output, stderr, result });
    if (!result.cleanup_completed || result.remaining_owned_processes !== 0) throw new Error("probe_cleanup_integrity_failure");
    return observation;
  } finally {
    const cleanup = cleanupCanonicalTestResources([resource]);
    assert(cleanup.every((x: { completed: boolean }) => x.completed), "probe snapshot cleanup must settle");
  }
}

export async function run(directory: string) {
  const file = path.join(directory, "frozen.json"), raw = readFileSync(file);
  assert.equal(sha(raw), readFileSync(path.join(directory, "frozen.sha256"), "utf8").trim());
  const frozen = JSON.parse(raw.toString());
  const repo = identity(); assert.equal(repo.node, frozen.repo.node); assert.equal(repo.base, frozen.repo.base);
  assert.equal(repo.head, frozen.repo.head); assert.equal(repo.branch, frozen.repo.branch);
  assert.deepEqual(runtimeIdentity(), frozen.runtime);
  for (const [name, hash] of Object.entries(frozen.authored)) assert.equal(sha(readFileSync(path.join(sourceDir, name))), hash);
  return runJobs(directory, { ...frozen, frozen_sha256: sha(raw) }, input => {
    for (const [name, hash] of Object.entries(frozen.authored)) assert.equal(sha(readFileSync(path.join(sourceDir, name))), hash);
    for (const [name, hash] of Object.entries(frozen.owner_files)) assert.equal(sha(readFileSync(path.join(root, name))), hash);
    assert.equal(git("rev-parse", "HEAD"), frozen.repo.head); assert.equal(git("branch", "--show-current"), frozen.repo.branch);
    assert.deepEqual(runtimeIdentity(), frozen.runtime);
    return nativeTurn(input);
  });
}

// The fixed dispatcher accepts an explicit turn implementation so failure paths
// can be exercised without selecting or starting a model host. Live entry stays
// behind run()'s unchanged repository, source and runtime checks.
export async function runJobs(directory: string, frozen: {
  frozen_at: string; frozen_sha256: string; seed: string; seed_sha256: string;
  cases: Record<string, { task: string; provenance: string; source: string; probes: Record<string, string>; probe_ids: string[] }>;
  approved_instruction_hashes?: string[];
}, executeTurn: (input: Parameters<typeof nativeTurn>[0]) => ReturnType<typeof nativeTurn>) {
  const executionStartedAt = new Date().toISOString();
  save(path.join(directory, "execution-started.json"), { at: executionStartedAt, frozen_sha256: frozen.frozen_sha256 });
  const budget = new TurnBudget();
  const memories = new Map<string, Memory>();
  const feedback = new Map<string, unknown>();
  const disposition: Record<string, unknown> = Object.fromEntries(ORDER.map(job => [job, { status: "NOT_RUN" }]));
  let stopped = false;
  const started = performance.now();
  const invoke = async (job: Job, turn: number, files: Record<string, string>, memory?: string) => {
    const turnDir = path.join(directory, `${job}-${turn}`); mkdirSync(turnDir);
    save(path.join(turnDir, "permitted-inputs.json"), files);
    return executeTurn({ files, memory, directory: turnDir, approved_instruction_hashes: frozen.approved_instruction_hashes,
      beforeStart() { budget.claim(job, turn); appendFileSync(path.join(directory, "initiated.jsonl"), JSON.stringify({ job, turn, at: new Date().toISOString() }) + "\n"); },
      onEvent(kind) { if (["turn_started", "terminal_observed", "settled"].includes(kind)) console.log(JSON.stringify({ job, turn, event: kind, consumed: budget.initiated.length })); },
    });
  };
  try {
    for (const job of ORDER) {
      if (stopped) break;
      const key = memoryFor(job), prior = key ? memories.get(key) : undefined;
      if (key && !prior) { disposition[job] = { status: "NOT_RUN", reason: `dependency_${key}_unavailable` }; continue; }
      console.log(JSON.stringify({ job, status: "starting", consumed: budget.initiated.length }));
      try {
        if (!job.startsWith("T")) {
          const initial = job.endsWith("0"), adaptive = job.startsWith("P");
          const feed = initial ? null : feedback.get(`T${job[1]}-${adaptive ? "A" : "B"}`);
          if (!initial && !feed) { disposition[job] = { status: "NOT_RUN", reason: "own_feedback_unavailable" }; continue; }
          const recipe = initial ? adaptive ? RECIPES.extract : RECIPES.memo : adaptive ? RECIPES.revise : RECIPES.updateMemo;
          const result = await invoke(job, 1, initial ? { "TASK.md": recipe, "SEED.md": frozen.seed } : {
            "TASK.md": recipe, "MEMORY.md": prior!.text, "FEEDBACK.json": JSON.stringify(feed, null, 2),
          }, prior?.text);
          try {
            const version = adaptive && !initial ? reviseMemory(prior!, job, result.summary, [sha(JSON.stringify(feed))])
              : memoryVersion(job, result.summary, prior?.sha256 ?? null, [initial ? frozen.seed_sha256 : sha(JSON.stringify(feed))]);
            memories.set(job, version); save(path.join(directory, `${job}.json`), version);
            disposition[job] = { status: "COMPLETED", memory_sha256: version.sha256, bytes: version.bytes,
              change: prior ? version.sha256 === prior.sha256 ? "unchanged" : "changed" : "initial" };
          } catch {
            disposition[job] = { status: "METHOD_UNAVAILABLE", reason: "generated_memory_or_local_change_invalid", output_preserved: true };
          }
        } else {
          const task = job.slice(0, 2) as Task, item = frozen.cases[task];
          const taskText = `${RECIPES.choose}\n\n${item.task}\n\nProvenance: ${item.provenance}\nAvailable probes:\n${JSON.stringify(item.probes, null, 2)}`;
          const files = { "TASK.md": taskText, "SOURCE.txt": item.source, "MEMORY.md": prior!.text };
          const first = await invoke(job, 1, files, prior!.text);
          let choice: ReturnType<typeof parseChoice> | null = null;
          try { choice = parseChoice(first.summary, item.probe_ids); } catch { /* Weak malformed choice is retained, not repaired. */ }
          let observation: unknown = { status: "not_executed", reason: "no_valid_choice" };
          let final = first;
          if (choice && choice.probe_id !== "NONE") {
            observation = choice.supported ? await runProbe(directory, task, choice.probe_id)
              : { status: "refused", code: "probe_not_allowlisted", executed: false };
            save(path.join(directory, `${job}-observation.json`), observation);
            final = await invoke(job, 2, { ...files,
              "TASK.md": `${RECIPES.conclude}\n\n${item.task}\nProvenance: ${item.provenance}`,
              "OBSERVATION.json": JSON.stringify({ prior_public_choice: first.summary, observation }, null, 2),
            }, prior!.text);
          } else if (choice) observation = { status: "not_executed", reason: "worker_selected_NONE", source_inspection_endpoint: choice.finding_if_no_probe };
          const ownFeedback = { source_task: task, task_conditions: item.task, provenance: item.provenance,
            exact_prior_memory_sha256: prior!.sha256, first_public_result: first.public_result,
            actual_observation: observation, final_public_result: final.public_result,
            feedback_provider: "Trusted coordinator returns actual own-action results only; no independent blind correctness label or model-confidence outcome.",
            changed_conditions: "Only the supplied current task conditions; no future task information is available." };
          feedback.set(job, ownFeedback); save(path.join(directory, `${job}-feedback.json`), ownFeedback);
          disposition[job] = { status: choice ? "COMPLETED" : "COMPLETED_NO_VALID_CHOICE", memory: key,
            memory_sha256: prior!.sha256, memory_bytes: prior!.bytes, selected_probe: choice?.probe_id ?? null,
            substantive_success: "requires_case_author_review_not_inferred_from_delivery" };
        }
      } catch (error) {
        // Stop rather than repairing runtime/transport and spending a replacement.
        const code = error instanceof Error && /^[a-zA-Z0-9_]+$/.test(error.message) ? error.message : "study_execution_or_integrity_failure";
        disposition[job] = { status: "FAILED", code }; stopped = true;
      }
      save(path.join(directory, `${job}-disposition.json`), disposition[job]);
      console.log(JSON.stringify({ job, ...disposition[job] as object, consumed: budget.initiated.length }));
    }
  } finally {
    save(path.join(directory, "final-accounting.json"), { protocol_frozen_at: frozen.frozen_at,
      started_at: executionStartedAt, completed_at: new Date().toISOString(),
      execution_elapsed_ms: performance.now() - started, initiated_study_turns: budget.initiated.length,
      ledger: budget.initiated, stopped, disposition, provider_internal_rounds_tokens_cost: "unobserved" });
  }
  if (stopped) throw new Error("study_stopped_inspect_local_evidence");
}

export async function runCli(args = process.argv.slice(2), execute = run) {
  const [command, directory] = args;
  if (!directory || !path.isAbsolute(directory) || path.resolve(directory).startsWith(root + path.sep)) throw new Error("external_evidence_directory_required");
  if (command === "freeze") freeze(directory);
  else if (command === "run") await execute(directory).catch(() => { console.error("study_stopped_inspect_local_evidence"); process.exitCode = 1; });
  else throw new Error("usage_freeze_or_run_external_evidence_directory");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) void runCli();
