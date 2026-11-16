import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { digest, INPUT_CONTRACT } from "./local-canonical-inputs.mjs";
import { gitRevisionInventory } from "./local-canonical-git-observation.mjs";
import { ORDINARY_INITIAL_PREPARATION, ORDINARY_INITIAL_TEST_REGISTRATION, isOrdinaryInitialPreparationRevision,
  ordinaryInitialProofShape, readOrdinaryInitialPreparationEvidence, verifyOrdinaryInitialCurrent } from "./local-canonical-initial-preparation.mjs";

const phases = ["dependencies-root", "dependencies-nested", "dependencies-web-planning", "typecheck", "build", "unit", "authority", "integration", "operability",
  "e2e-project-experience", "e2e-operator-review-control", "e2e-operator-native-host-execution", "e2e-operator-work-expectation", "e2e-operator-multi-candidate", "e2e-continuity", "e2e-golden"];
const nativePaths = ["plugins/augnes-operator/mcp/companion-service-core.mjs", "scripts/augnes-companion-service.mjs", "scripts/test-companion-service-native.mjs",
  "scripts/run-canonical-test-suite.mjs", "scripts/canonical-child-runner.mjs", "scripts/canonical-test-environment.mjs", "scripts/test-harness-process-lifecycle.mjs",
  "scripts/companion-service-fixture-observation.mjs"];
const at = seconds => new Date(Date.UTC(2030, 0, 1) + seconds * 1000).toISOString();
const executable = (label, size = 10) => ({ present: true, sha256: digest(label), permission_identity: digest("permission"), executable_identity_policy: "shared-posix-v1",
  metadata: { mode: "33261", uid: "501", gid: "20", links: "1", device: "1", inode: "1", bytes: String(size), mtime_ns: "1", ctime_ns: "1" } });
const role = (id, before, location = id) => ({ id, classification: "execution", location_fingerprint: digest(location), before });
const cleanup = () => ({ completed: true, remaining_owned_processes: 0, exit_observed: true, streams_closed: true, termination_reason: "natural_exit" });
const result = () => ({ label: "controlled helper fixture", exit_code: 0, signal: null, timed_out: false, cancelled: false, spawn_error_code: null,
  duration_ms: 1, exit_observed: true, streams_closed: true, cleanup_completed: true, remaining_owned_processes: 0, termination_reason: "natural_exit" });
const state = () => ({ status: "live", checkout_relation: "exact", preservation_valid: true, preservation_binding: digest("live binding"), service_identity: "sha256:" + digest("service") });
function observation(s = state(), when = 600) {
  const m = { status: "live", reason: "companion_service_live", manager_pid: 42, manager_process_identity: digest("manager"), supervisor_pid: 43,
    supervisor_process_identity: digest("supervisor"), generation_id: "controlled-generation", instance_id: "controlled-instance", restart_count: 0 };
  return { state: s, diagnostics: { contract: "augnes.companion-preservation-observation.v2", started_at: at(when), finished_at: at(when + 1), samples: 1,
    coherent: true, live_identity_valid: true, before_binding: s.preservation_binding, after_binding: s.preservation_binding,
    repository_binding_before: digest("installed source"), repository_binding_after: digest("installed source"), repository_observation_before: "observed", repository_observation_after: "observed",
    material_states: { configuration_path: "valid", desired_state_path: "valid", maintenance_lease_path: "missing", manager_state_path: "valid", manager_lock_path: "valid",
      runtime_manifest_path: "valid", runtime_token_path: "valid", runtime_access_path: "valid", runtime_lock_path: "valid" },
    runtime: { verified: true, generation_id: m.generation_id, instance_id: m.instance_id, supervisor_pid: 43,
      probe_valid: { ui_health: true, bridge_health: true, ui_ownership: true, bridge_ownership: true },
      probe_available: { ui_health: true, bridge_health: true, ui_ownership: true, bridge_ownership: true } },
    manager_before: { ...m, updated_at: at(when) }, manager_after: { ...m, updated_at: at(when + 1) }, loaded_job: { label: "controlled-job", pid: 42, fingerprint: digest("job") } } };
}
const stockIssues = () => [...phases.slice(8).map(id => "phase_not_passing:" + id), "receipt_classified_outcome_not_passing", "receipt_cleanup_incomplete",
  "receipt_companion_scope_invalid", "receipt_companion_service_not_restored", "receipt_final_result_not_pass", "receipt_input_event_invalid", "receipt_input_observation_blocked",
  "receipt_non_deciding", "receipt_phase_environment_binding_invalid"].sort();

// Disposable controls only. These records describe no actual test run, native
// failure, provider response, human grant or qualification evidence. Exporting
// this seed permits the existing admission owner to build physical controls.
export function createOrdinaryInitialPreparationFixture() {
  const ctx = { phases: [...phases], artifacts: new Map(), files: { prior: new Map(), final: new Map() } };
  for (const name of nativePaths) ctx.files.prior.set(name, Buffer.from("// controlled native source " + name + "\n"));
  ctx.files.prior.set("scripts/local-canonical-attempts.mjs", Buffer.from("export const controlledOwner = 0;\n"));
  ctx.files.final = new Map(ctx.files.prior);
  for (const name of ["scripts/local-canonical-initial-preparation.mjs", "scripts/test-local-canonical-initial-preparation.mjs", "scripts/local-canonical-attempts.mjs"])
    ctx.files.final.set(name, Buffer.from("export const controlledOwner = " + JSON.stringify(name) + ";\n"));
  ctx.p = { schema: "augnes.local-canonical-source-correction.v7", kind: "reviewed_revision", branch: "codex/controlled-ordinary-initial-preparation",
    base: "0".repeat(40), head: "3".repeat(40), tree: "4".repeat(40), prior_family_id: digest("ordinary family"), prior_number: 1,
    prior_attempt_id: "controlled-initial", prior_receipt_fingerprint: "", pull_request: 1,
    commission: { root_family_id: digest("ordinary family"), root_number: 1, root_attempt_id: "controlled-initial", root_receipt_fingerprint: "", ordinal: 1,
      maximum_invocations: 1, preparation_revision: ORDINARY_INITIAL_PREPARATION, delegation: { id: 1, sha256: digest("controlled delegation") } },
    accepted: {}, inputs: {}, originals: {} };
  const sourceRoot = "/controlled/Documents/runtime", targetRoot = "/controlled/runtime", oldNode = path.join(sourceRoot, "bin/node"), targetNode = path.join(targetRoot, "bin/node");
  const node = executable("controlled node"), npm = executable("controlled npm", 54), browser = role("browser-executable", executable("controlled browser"));
  const gitConfig = { present: true, sha256: digest("git bytes"), permission_identity: digest("git permission"), metadata: { mode: "33188", links: "1", device: "1", uid: "501", gid: "20", bytes: "1", inode: "1", mtime_ns: "1", ctime_ns: "1" },
    git_projection: { applicable: true, policy: "isolated-current-branches-v1", scope_fingerprint: digest("scope"), effective_sha256: digest("projection") } };
  const gitRole = { ...role("git-config", gitConfig), gitTracking: { policy: "isolated-current-branches-v1", protected_branches: [digest("main"), digest(ctx.p.branch)].sort() } };
  ctx.prior = { contract: "augnes.local-canonical-attempt-family.v1", attempt_id: "controlled-initial", family_id: ctx.p.prior_family_id, number: 1,
    branch: "codex/controlled-original", head: "1".repeat(40), tree: "2".repeat(40), budget: { initial: 1, recovery: 1 }, contract_fingerprint: "",
    prior_attempt_id: null, prior_receipt_fingerprint: null, source_correction: null, recovery: null, started_at: at(0) };
  const stopped = { ...state(), status: "installed_stopped", preservation_binding: digest("stopped binding") };
  const serviceAfter = observation(state(), 58), firstFault = { resource: "installed_service_change", disposition: "safety_violation", observed_at: at(60), monotonic_ns: "1" };
  const event = { ...firstFault, classification: "safety", after: null }; event.identity = digest(event);
  const observedPhases = phases.map((id, index) => ({ id, status: index < 8 ? "pass" : index === 8 ? "failure" : "not_run",
    head_sha: ctx.prior.head, base_sha: ctx.p.base, invocation_id: "controlled-invocation", timed_out: false,
    command: id === "operability" ? "npm run test:operability" : "controlled command " + id, cwd_scope: "root", browser: index >= 9,
    exit_status: index < 8 ? 0 : index === 8 ? 1 : null, failure_code: index < 8 ? null : index === 8 ? "phase_failed" : "phase_not_run",
    duration_ms: index <= 8 ? 1 : null, started_at: index <= 8 ? at(index + 1) : null, finished_at: index <= 8 ? at(index + 2) : null,
    cleanup: index <= 8 ? cleanup() : { completed: false, remaining_owned_processes: null }, ...(index <= 8 ? { browser_use: [] } : {}) }));
  observedPhases[7].browser_use = ["durable-work-surface", "durable-work-surface", "durable-work-surface", "cumulative-work-surface", "cumulative-work-surface"].map(consumer => ({
    contract: "augnes.local-canonical-browser-use.v2", consumer, location_fingerprint: browser.location_fingerprint, before: browser.before, after: browser.before,
    actual_version: "Chrome/1.2.3.4", runtime_versions: { http: "Chrome/1.2.3.4", cdp: "Chrome/1.2.3.4" }, disposition: "unchanged", unchanged: true }));
  ctx.original = { receipt_version: 4, attempt: ctx.prior, run: { id: ctx.prior.attempt_id, invocation_id: "controlled-invocation", started_at: at(0), finished_at: at(60) },
    repository: { repository_id: "hynk-studio/augnes", origin: "https://github.com/hynk-studio/augnes.git", branch: ctx.prior.branch, head_sha: ctx.prior.head,
      tree_sha: ctx.prior.tree, base_sha: ctx.p.base, worktree_before: "clean", worktree_after: "clean" },
    verification_context: { kind: "isolated-worktree" }, evidence: { selected_plan: "full-canonical", deciding: false }, environment: { node: { actual_version: "24.22.1" }, npm_version: "11.16.0" },
    final: { result: "failure", exit_status: 1, reason_codes: ["companion_service_not_restored", "phase_failed", "selected_phases_incomplete"] },
    outcome: { disposition: "safety_violation", safety: "blocked", execution: "incomplete_or_failed", validity: "invalid_or_unknown", first_fault: firstFault },
    cleanup: { completed: false, remaining_owned_processes: 0, failure_codes: ["companion_service_not_restored"], isolated_resources: { completed: true },
      companion_service: { restored: false, scope: "accepted_checkout_read_only", maintenance_acquired: false, maintenance_released: true, before: stopped,
        after: serviceAfter.state, observations: { before: { coherent: true, live_identity_valid: true }, after: serviceAfter.diagnostics } } },
    checkout_ownership: { acquired: true, released: true }, capacity_ownership: { acquired: true, released: true }, phases: observedPhases,
    inputs: { contract: INPUT_CONTRACT, path_kind: "isolated-model-free-v1", binding: { head: ctx.prior.head, tree: ctx.prior.tree },
      resources: [role("node-executable", node, oldNode), role("npm-executable", npm, path.join(sourceRoot, "lib/node_modules/npm/bin/npm-cli.js")), gitRole,
        role("git-executable", executable("git")), browser], first_fault: firstFault, secondary_faults: [], events: [event] } };
  ctx.completion = { contract: ctx.prior.contract, attempt_id: ctx.prior.attempt_id, receipt_fingerprint: "", cleanup_complete: false,
    infrastructure_code: null, disposition: "safety_violation", finished_at: at(61) };
  ctx.stock = { valid_deciding_evidence: false, status: "non_deciding_or_stale", content_fingerprint: "", issues: stockIssues(),
    dimensions: { execution: "incomplete_or_failed", historical_integrity: "intact", evidence_validity: "invalid_or_incomplete", safety: "blocked", current_merge_applicability: "matches_observed_context" } };
  const headers = { contract: "augnes.local-canonical-node-headers.v1", present: true, location_fingerprint: digest(path.join(targetRoot, "include/node")),
    inventory_sha256: digest("header inventory"), permission_sha256: digest("header permission"), content_sha256: digest([{ path: "node.h", sha256: digest("header") }]), entries: 2, bytes: 5 };
  ctx.inputs = { contract: "augnes.local-canonical-runtime-inputs.v1", node: { location_fingerprint: digest(targetNode), observation: node },
    headers: { location_fingerprint: headers.location_fingerprint, observation: headers } };
  ctx.inputInventory = { contract: INPUT_CONTRACT, path_kind: "isolated-model-free-v1", binding: {}, resources: [gitRole, role("node-executable", node, targetNode),
    { ...role("node-headers", headers, path.join(targetRoot, "include/node")), nodeHeaders: true },
    role("npm-executable", { ...npm, metadata: { ...npm.metadata } }, path.join(targetRoot, "lib/node_modules/npm/bin/npm-cli.js")),
    role("git-executable", executable("git")), browser], first_fault: null, secondary_faults: [], events: [] };
  ctx.runtimeCopy = { recorded_at: at(200), source: sourceRoot, target: targetRoot, all_entries_identical: true, source_preserved: true, entries: 4, file_bytes: 69,
    catalog: [{ path: "bin/node", type: "file", bytes: 10, sha256: node.sha256, mode: 493 }, { path: "bin/npm", type: "symlink", target: "../lib/node_modules/npm/bin/npm-cli.js" },
      { path: "lib/node_modules/npm/bin/npm-cli.js", type: "file", bytes: 54, sha256: npm.sha256, mode: 493 }, { path: "include/node/node.h", type: "file", bytes: 5, sha256: digest("header"), mode: 420 }] };
  const launched = { executable: targetNode, version: "v24.22.1", npm_node_execpath: targetNode, npm_execpath: path.join(targetRoot, "lib/node_modules/npm/bin/npm-cli.js"),
    child: { executable: targetNode, version: "v24.22.1" }, headers_exist: true };
  ctx.launcher = { at: at(201), npm_version: "11.16.0", exit_code: 0, offline: true, network_or_registry_request: false, deciding: false, observed: launched,
    stdout: JSON.stringify(launched) + "\n", stderr: "" };
  ctx.nativePlan = { observed_at: at(120), deciding: false, source_changed: false, production_lifecycle_mutation: false, native_owner_timeout_ms: 240000,
    nodes: [oldNode, "/controlled/native-runtime/bin/node"].map(v => ({ path: v, realpath: v, bytes: 10, sha256: node.sha256, version: "v24.22.1" })) };
  ctx.nativeBefore = { at: at(121), node: ctx.nativePlan.nodes[1].path, node_version: "v24.22.1", repository: "/controlled/original-repository", head: ctx.prior.head,
    branch: ctx.prior.branch, origin: ctx.original.repository.origin, status: "", command: [ctx.nativePlan.nodes[1].path, "scripts/test-companion-service-native.mjs"], timeout_ms: 240000, files: [] };
  ctx.nativeAfter = { at: at(123), files: [] };
  ctx.collector = Buffer.from("// controlled retained collector\n");
  ctx.nativeResult = { accepted: true, failure: null, result: { ...result(), label: "test-companion-service-native.mjs", duration_ms: 100 },
    cleanup: [{ completed: true, failure_count: 0, failures: [] }] };
  ctx.nativeDiagnostic = { observed_at: at(124), deciding: false, source_head: ctx.prior.head, source_unchanged: true, production_source_unchanged: true,
    production_binding_unchanged: true, production_observations_coherent: true, probe: ctx.nativeResult, production_before: serviceAfter.state, production_after: serviceAfter.state,
    npm_available_in_probe_PATH: "11.19.1", original_Full_npm: "11.16.0" };
  ctx.nativeLog = Buffer.from('[canonical:operability] child_result label="machine-owned macOS Companion service lifecycle and cleanup" duration_ms=100 exit_code=1 signal=null timed_out=false exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0 termination_reason=natural_exit\n' +
    JSON.stringify({ case: "native-install-observation", observation: { manager: { state: "absent" }, job: { state: "available", job_state: "running", pid: 42 }, process: { state: "present" }, node_matches: true, entry_matches: true, cwd_matches: true } }) + "\n" +
    'AssertionError [ERR_ASSERTION]: ' + JSON.stringify({ exit_status: 1, signal: null, streams_closed: true, spawn_error_code: null, refusal: { state: "available", result: "refused", reason: "companion_service_manager_state_unavailable", cleanup_failed: false }, manager: { state: "absent" } }) +
    '\n    at file:///controlled/original-repository/scripts/test-companion-service-native.mjs:94:10\n');
  ctx.permission = { exit_code: 0, stdout: oldNode + " pid=42 kTCCServiceSystemPolicyAllFiles Auth Right: Denied (Service Policy) kTCCServiceSystemPolicyDocumentsFolder AUTHREQ_PROMPTING",
    stderr: "", started_at: at(62), command: ["/usr/bin/log", "show"] };
  ctx.supportRecord = { schema: "augnes.local-canonical-ordinary-initial-support-check.v1", command: "node scripts/test-local-canonical-initial-preparation.mjs",
    node_version: "24.22.1", node_sha256: node.sha256, tested_source_head: ctx.p.head, started_at: at(300), finished_at: at(301), result: result() };
  ctx.baseline = { at: at(400), source: digest("installed observer"), observation: observation(state(), 400) };
  ctx.coordination = [1, 2].map(n => ({ schema: "task-owned.scoped-task-coordination-source.v1", source_thread_id: "controlled-owner-" + n,
    source_turn_id: "controlled-owner-turn-" + n, source_tool_call_id: "controlled-call-" + n, received_in_thread: "controlled-receiver",
    authority: { human_thread_id: "controlled-receiver", human_turn_id: "controlled-human-turn", human_message_id: "controlled-human-message" },
    recorded_at: at(350), scope: "preparation_and_prospective_full_cleanup_stock_window", limits: ["controlled provenance; no execution grant or global lease"],
    tool_call: { type: "mcpToolCall", id: "controlled-call-" + n, server: "codex_app", tool: "send_message_to_thread", status: "completed",
      arguments: { threadId: "controlled-receiver", hostId: "local", prompt: "Controlled fixture for scoped human instruction controlled-human-turn" } } }));
  ctx.focused = { schema: "augnes.local-canonical-ordinary-initial-preparation.v1", basis: "implementation_owner_not_independent_review", predecessor_receipt_fingerprint: "",
    runtime_inputs_sha256: "", finished_at: at(500), native_failure: { phase: "operability", log: null, manager_pid: 42, node_executable: oldNode }, native_setup: {}, support_checks: [] };
  ctx.settlement = { schema: "augnes.local-canonical-ordinary-initial-settlement.v1", prior_receipt_fingerprint: "", target: {}, recorded_at: at(510),
    after_state: serviceAfter.state, coordination: [], history: { original_consumed: 1, recovery_consumed: 0, original_cleanup_complete: false, original_stock_issues: stockIssues(), qualification: "NOT_RUN" } };
  ctx.git = args => {
    const fromFiles = head => head === ctx.p.head ? ctx.files.final : ctx.files.prior;
    if (args[0] === "merge-base") return Buffer.alloc(0);
    if (args[0] === "rev-parse") return Buffer.from((args[1].startsWith(ctx.p.head) ? ctx.p.tree : ctx.prior.tree) + "\n");
    if (args[0] === "show") { const [head, name] = [args[1].slice(0, 40), args[1].slice(41)]; const value = fromFiles(head).get(name); assert.ok(value, "missing controlled blob " + name); return Buffer.from(value); }
    if (args[0] === "ls-tree") { const value = fromFiles(args[2]).get(args.at(-1)); return Buffer.from(value ? "100644 blob " + "f".repeat(40) + "\t" + args.at(-1) + "\0" : ""); }
    if (args[0] === "diff") {
      const marker = args.indexOf("--"), [from, to] = args.slice(marker - 2, marker), a = fromFiles(from), b = fromFiles(to);
      const names = [...new Set([...a.keys(), ...b.keys()])].filter(name => !a.get(name)?.equals(b.get(name))).sort();
      if (args.includes("--name-only")) return Buffer.from(names.join("\n"));
      return Buffer.from(names.length ? names.map(name => "diff " + name + " " + digest(a.get(name) ?? "") + " " + digest(b.get(name) ?? "")).join("\n") : "");
    }
    throw new Error("unsupported controlled Git query " + JSON.stringify(args));
  };
  ctx.put = (name, value) => { const raw = Buffer.isBuffer(value) ? Buffer.from(value) : Buffer.from(JSON.stringify(value)); ctx.artifacts.set(name, raw); return { artifact: name, sha256: digest(raw) }; };
  ctx.bytes = (reference, maximum = 2 * 1024 * 1024) => { const raw = ctx.artifacts.get(reference.artifact); assert.ok(raw && raw.length <= maximum && digest(raw) === reference.sha256, "controlled artifact changed"); return Buffer.from(raw); };
  ctx.parse = reference => JSON.parse(ctx.bytes(reference));
  ctx.seal = () => {
    const p = ctx.p, prior = ctx.prior, original = ctx.original;
    original.attempt = prior; original.repository.head_sha = prior.head; original.repository.tree_sha = prior.tree; original.repository.branch = prior.branch;
    original.inputs.binding = { ...original.inputs.binding, head: prior.head, tree: prior.tree };
    for (const phase of original.phases) { phase.head_sha = prior.head; phase.base_sha = original.repository.base_sha; }
    original.phases[8].log = { bytes: ctx.nativeLog.length, truncated: false, relative_path: `.augnes-local-verification/logs/${original.run.id}/operability.log` };
    original.inputs.fingerprint = digest({ contract: original.inputs.contract, path_kind: original.inputs.path_kind, binding: original.inputs.binding, resources: original.inputs.resources });
    prior.contract_fingerprint = original.inputs.fingerprint;
    const content = { ...original }; delete content.integrity; original.integrity = { content_fingerprint: digest(content) };
    p.prior_family_id = prior.family_id; p.prior_number = prior.number; p.prior_attempt_id = prior.attempt_id; p.prior_receipt_fingerprint = original.integrity.content_fingerprint;
    Object.assign(p.commission, { root_family_id: prior.family_id, root_number: prior.number, root_attempt_id: prior.attempt_id, root_receipt_fingerprint: p.prior_receipt_fingerprint });
    p.accepted = { ...p.accepted, head: p.head, tree: p.tree, base: p.base };
    ctx.completion.attempt_id = prior.attempt_id; ctx.completion.receipt_fingerprint = p.prior_receipt_fingerprint; ctx.stock.content_fingerprint = p.prior_receipt_fingerprint;
    p.inputs.identity_sha256 = digest(ctx.inputs); p.inputs.predecessor_sha256 = digest(original.inputs.resources.filter(v => ["node-executable", "node-headers"].includes(v.id)));
    ctx.inputInventory.binding = { ...ctx.inputInventory.binding, head: p.head, tree: p.tree, runtime_inputs: ctx.inputs };
    ctx.inputInventory.fingerprint = digest({ contract: ctx.inputInventory.contract, path_kind: ctx.inputInventory.path_kind, binding: ctx.inputInventory.binding, resources: ctx.inputInventory.resources });
    p.inputs.inventory_sha256 = gitRevisionInventory(ctx.inputInventory);
    const delta = (a, b) => { const raw = ctx.git(["diff", "--binary", "--full-index", "--no-ext-diff", "--no-textconv", a, b, "--"]); return { bytes: raw.length, sha256: digest(raw), paths: ctx.git(["diff", "--name-only", a, b, "--"]).toString().trim().split("\n").filter(Boolean).sort() }; };
    ctx.source = { schema: "augnes.local-canonical-reviewed-revision-source.v1", basis: "implementation_owner_not_independent_review", predecessor_to_final: delta(prior.head, p.head),
      accepted_to_final: delta(p.head, p.head), main_to_final: delta(p.base, p.head), reviewed_at: at(450) };
    const entry = (head, name) => ctx.git(["ls-tree", "-z", head, "--", name]).length ? { byte_size: ctx.git(["show", `${head}:${name}`]).length, sha256: digest(ctx.git(["show", `${head}:${name}`])) } : null;
    ctx.manifest = { schema: "augnes.local-canonical-ordinary-initial-support-manifest.v1", predecessor: { head: prior.head, tree: prior.tree }, target: { head: p.head, tree: p.tree },
      delta: ctx.source.predecessor_to_final, entries: ctx.source.predecessor_to_final.paths.map(name => ({ path: name, before: entry(prior.head, name), after: entry(p.head, name) })) };
    p.originals = { receipt: ctx.put("receipt.json", original), attempt: ctx.put("attempt.json", prior), completion: ctx.put("completion.json", ctx.completion), stock: ctx.put("stock.log", ctx.stock) };
    p.inputs.current = ctx.put("runtime.json", ctx.inputs); p.source = ctx.put("source.json", ctx.source);
    const f = ctx.focused; f.predecessor_receipt_fingerprint = p.prior_receipt_fingerprint; f.runtime_inputs_sha256 = p.inputs.identity_sha256;
    f.source_manifest = ctx.put("manifest.json", ctx.manifest); f.input_inventory = ctx.put("inventory.json", ctx.inputInventory); f.native_failure.log = ctx.put("native-failure.log", ctx.nativeLog);
    f.permission_diagnostic = ctx.put("permission.json", ctx.permission); f.runtime_relocation = ctx.put("runtime-copy.json", ctx.runtimeCopy); f.launcher_resolution = ctx.put("launcher.json", ctx.launcher);
    ctx.nativeBefore.head = prior.head; ctx.nativeBefore.branch = prior.branch; ctx.nativeDiagnostic.source_head = prior.head;
    ctx.nativeBefore.files = nativePaths.map(name => { const raw = ctx.git(["show", `${prior.head}:${name}`]); return { path: path.join(ctx.nativeBefore.repository, name), bytes: raw.length, sha256: digest(raw) }; });
    ctx.nativeBefore.files.push({ path: "/controlled/collector.mjs", bytes: ctx.collector.length, sha256: digest(ctx.collector) }); ctx.nativeAfter.files = ctx.nativeBefore.files;
    f.native_setup = { plan: ctx.put("native-plan.json", ctx.nativePlan), diagnostic: ctx.put("native-diagnostic.json", ctx.nativeDiagnostic), result: ctx.put("native-result.json", ctx.nativeResult),
      sources_before: ctx.put("native-before.json", ctx.nativeBefore), sources_after: ctx.put("native-after.json", ctx.nativeAfter), collector: ctx.put("collector.log", ctx.collector), stdout: ctx.put("native-pass.log", Buffer.from("controlled native setup result\n")), stderr: ctx.put("native-errors.log", Buffer.alloc(0)) };
    ctx.supportRecord.tested_source_head = p.head; ctx.supportRecord.node_sha256 = ctx.inputs.node.observation.sha256;
    f.support_checks = [{ record: ctx.put("support-check.json", ctx.supportRecord), stdout: ctx.put("support-check.log", Buffer.from("controlled pure fixture result\n")) }];
    p.focused = ctx.put("focused.json", f);
    const s = ctx.settlement; s.prior_receipt_fingerprint = p.prior_receipt_fingerprint; s.target = { base: p.base, head: p.head, tree: p.tree, runtime_inputs_sha256: p.inputs.identity_sha256 };
    s.live_observation = ctx.put("baseline.json", ctx.baseline); s.coordination = ctx.coordination.map((v, n) => ({ owner: v.source_thread_id, scope: v.scope, record: ctx.put("coordination-" + n + ".json", v) }));
    p.settlement = ctx.put("settlement.json", s);
    ctx.live = { observed_at: at(601), inventory: p.inputs.inventory_sha256, foreign_checkout_owners: [], service: observation(state(), 600) };
    ctx.now = Date.parse(at(602)); return ctx;
  };
  return ctx.seal();
}

export function runOrdinaryInitialPreparationControls() {
  let accepted = 0, refused = 0;
  const read = c => readOrdinaryInitialPreparationEvidence(c.p, c);
  const valid = createOrdinaryInitialPreparationFixture(), evidence = read(valid);
  assert.equal(isOrdinaryInitialPreparationRevision(valid.p), true); assert.equal(ordinaryInitialProofShape(valid.p), true);
  assert.equal(evidence.ordinaryInitial.authorized, false); assert.equal(evidence.ordinaryInitial.reserved, false);
  assert.deepEqual(verifyOrdinaryInitialCurrent(evidence, valid.live, { now: valid.now }), { preserved: true, coordination_sha256: digest(valid.settlement.coordination), authorized: false, reserved: false }); accepted++;
  const cases = [
    ["wrong discriminator", c => c.p.commission.preparation_revision = "unknown"],
    ["second ordinal", c => c.p.commission.ordinal = 2],
    ["recovery allowance", c => c.p.commission.maximum_invocations = 2],
    ["product route disguise", c => c.p.commission.source_revision = "material-source-correction-v1"],
    ["non initial predecessor", c => c.prior.source_correction = { kind: "source_revision" }, true],
    ["recovered predecessor", c => c.prior.recovery = { infrastructure_code: "ENOENT" }, true],
    ["forged old cleanup", c => c.original.cleanup.completed = true, true],
    ["receipt changed without identity", c => c.original.final.result = "pass"],
    ["unsettled resources", c => c.original.cleanup.isolated_resources.completed = false, true],
    ["checkout owner retained", c => c.original.checkout_ownership.released = false, true],
    ["wrong failure", c => c.original.phases[8].timed_out = true, true],
    ["dropped phase", c => c.original.phases.pop(), true],
    ["phase reordered", c => [c.original.phases[1], c.original.phases[2]] = [c.original.phases[2], c.original.phases[1]], true],
    ["missing Browser consumers", c => c.original.phases[7].browser_use.pop(), true],
    ["missing safety event", c => c.original.inputs.events = [], true],
    ["extra input fault", c => c.original.inputs.secondary_faults.push({ resource: "node-executable", disposition: "input_invalidation" }), true],
    ["missing stock issue", c => c.stock.issues.pop(), true],
    ["extra stock issue", c => c.stock.issues.push("receipt_attempt_records_unverified"), true],
    ["upgraded stock", c => c.stock.valid_deciding_evidence = true, true],
    ["missing native log", c => c.nativeLog = Buffer.from("unrelated failure"), true],
    ["different native failure", c => c.nativeLog = Buffer.from(c.nativeLog.toString().replace("spawn_error_code\":null", "spawn_error_code\":\"ENOENT\"")), true],
    ["missing permission provenance", c => c.permission.stdout = "no observed denial", true],
    ["wrong permission PID", c => c.focused.native_failure.manager_pid = 99, true],
    ["changed Node bytes", c => c.runtimeCopy.catalog[0].sha256 = digest("different node"), true],
    ["wrong npm", c => c.launcher.npm_version = "11.19.1", true],
    ["wrong child path", c => c.launcher.observed.child.executable = "/controlled/other-node", true],
    ["wrong headers", c => c.inputs.headers.observation.content_sha256 = digest("different headers"), true],
    ["inventory/runtime mismatch", c => { const v = c.inputInventory.resources.find(v => v.id === "node-executable"); v.before = { ...v.before, sha256: digest("different inventory node") }; }, true],
    ["protected Documents target", c => c.runtimeCopy.target = "/controlled/Documents/new-runtime", true],
    ["runtime copy not exact", c => c.runtimeCopy.all_entries_identical = false, true],
    ["native setup absent", c => c.nativeResult.accepted = false, true],
    ["old setup mislabeled final", c => c.nativeBefore.head = c.p.head, false, "native-before.json"],
    ["native PATH mismatch hidden", c => c.nativeDiagnostic.npm_available_in_probe_PATH = "11.16.0", true],
    ["changed native source", c => c.files.final.set("scripts/test-companion-service-native.mjs", Buffer.from("changed product")), true],
    ["product source delta", c => c.files.final.set("apps/web_planning/src/participation-page.ts", Buffer.from("changed product")), true],
    ["policy only cosmetic", c => { c.files.final = new Map(c.files.prior); c.files.final.set(".github/LOCAL_CANONICAL_VERIFICATION.md", Buffer.from("policy")); }, true],
    ["wrong support check command", c => c.supportRecord.command = "node --check scripts/local-canonical-initial-preparation.mjs", true],
    ["missing coordination", c => c.coordination = [], true],
    ["wrong coordination authority", c => c.coordination[1].authority.human_turn_id = "different-human-turn", true],
    ["wrong coordination destination", c => c.coordination[0].tool_call.arguments.threadId = "unrelated-thread", true],
    ["forged history success", c => c.settlement.history.original_cleanup_complete = true, true],
  ];
  for (const [label, mutate, reseal, rawName] of cases) {
    const c = createOrdinaryInitialPreparationFixture(); mutate(c); if (reseal) c.seal();
    if (rawName) { const updated = c.put(rawName, c.nativeBefore); c.focused.native_setup.sources_before = updated; c.p.focused = c.put("focused.json", c.focused); }
    assert.throws(() => read(c), undefined, label); refused++;
  }
  const currentNpm = c => c.inputInventory.resources.find(v => v.id === "npm-executable");
  for (const [label, mutate] of [
    ["byte-identical npm 11.16.0 at another PATH location", c => currentNpm(c).location_fingerprint = digest("/controlled/alternate-runtime/lib/node_modules/npm/bin/npm-cli.js")],
    ["original Documents npm", c => currentNpm(c).location_fingerprint = c.original.inputs.resources.find(v => v.id === "npm-executable").location_fingerprint],
    ["missing current npm", c => c.inputInventory.resources = c.inputInventory.resources.filter(v => v.id !== "npm-executable")],
    ["changed current npm bytes", c => currentNpm(c).before.sha256 = digest("different current npm bytes")],
    ["changed current npm size", c => currentNpm(c).before.metadata.bytes = "55"],
    ["wrong current npm role", c => currentNpm(c).classification = "ambient"],
  ]) {
    const c = createOrdinaryInitialPreparationFixture(); mutate(c); c.seal();
    assert.throws(() => read(c), { code: "revision_ordinary_initial_current_npm_invalid" }, label); refused++;
  }
  for (const [label, change] of [
    ["receipt bytes changed", c => c.artifacts.set("receipt.json", Buffer.from("{}"))],
    ["source manifest incomplete", c => { c.manifest.entries.pop(); c.focused.source_manifest = c.put("manifest.json", c.manifest); c.p.focused = c.put("focused.json", c.focused); }],
    ["coordination bytes changed", c => c.artifacts.set("coordination-0.json", Buffer.from("{}"))],
  ]) { const c = createOrdinaryInitialPreparationFixture(); change(c); assert.throws(() => read(c), undefined, label); refused++; }
  for (const [label, mutate] of [
    ["stale", c => c.live.observed_at = at(0)],
    ["future", c => c.live.observed_at = at(999)],
    ["incoherent", c => c.live.service.diagnostics.coherent = false],
    ["unavailable", c => c.live.service.diagnostics.runtime.verified = false],
    ["service generation changed", c => { const d = c.live.service.diagnostics; d.manager_before.generation_id = d.manager_after.generation_id = d.runtime.generation_id = "changed"; }],
    ["source binding changed", c => { const d = c.live.service.diagnostics; d.repository_binding_before = d.repository_binding_after = digest("changed source"); }],
    ["preservation binding changed", c => { const s = c.live.service; s.state.preservation_binding = s.diagnostics.before_binding = s.diagnostics.after_binding = digest("changed service"); }],
    ["foreign writer", c => c.live.foreign_checkout_owners = [{ owner: "foreign" }]],
    ["inventory changed", c => c.live.inventory = digest("different inventory")],
    ["coordination record changed after read", (c, e) => e.ordinaryInitial.record.coordination.pop()],
  ]) { const c = createOrdinaryInitialPreparationFixture(), e = read(c); mutate(c, e); assert.throws(() => verifyOrdinaryInitialCurrent(e, c.live, { now: c.now }), undefined, label); refused++; }
  const copy = JSON.parse(JSON.stringify(evidence.ordinaryInitial)); assert.throws(() => verifyOrdinaryInitialCurrent(copy, valid.live, { now: valid.now })); refused++;
  const registered = createOrdinaryInitialPreparationFixture(); registered.files.final.set("scripts/run-canonical-test-suite.mjs", Buffer.concat([
    Buffer.from(ORDINARY_INITIAL_TEST_REGISTRATION), registered.files.prior.get("scripts/run-canonical-test-suite.mjs")])); registered.seal(); read(registered); accepted++;
  const changedRegistration = createOrdinaryInitialPreparationFixture(); changedRegistration.files.final.set("scripts/run-canonical-test-suite.mjs", Buffer.from(ORDINARY_INITIAL_TEST_REGISTRATION.replace("30_000", "300_000") + "changed suite")); changedRegistration.seal(); assert.throws(() => read(changedRegistration)); refused++;
  const emptyBinding = createOrdinaryInitialPreparationFixture(); emptyBinding.inputInventory.binding = {};
  emptyBinding.inputInventory.fingerprint = digest({ contract: emptyBinding.inputInventory.contract, path_kind: emptyBinding.inputInventory.path_kind, binding: {}, resources: emptyBinding.inputInventory.resources });
  emptyBinding.focused.input_inventory = emptyBinding.put("inventory.json", emptyBinding.inputInventory); emptyBinding.p.focused = emptyBinding.put("focused.json", emptyBinding.focused); read(emptyBinding); accepted++;
  const summary = { status: "pass", controls_only: true, natural_RED_GREEN: false, accepted, refused, deciding_invocations: 0, service_operations: 0 };
  process.stdout.write(JSON.stringify(summary) + "\n"); return summary;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) runOrdinaryInitialPreparationControls();
