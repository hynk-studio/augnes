import { digest } from "./local-canonical-inputs.mjs";

// This is a separate prospective action, not a material-source repair or an
// infrastructure recovery. The existing v7 owners still authenticate and spend
// authority, acquire inputs, reserve the exclusive edge and inspect stock.
export const NO_REMEDY_REQUALIFICATION = "accepted-no-remedy-diagnosis-v1";
export const NO_REMEDY_DECISION = "ACCEPT_DIAGNOSTIC_RECORD_AND_NO_CHANGE_DISPOSITION";
export const NO_REMEDY_GRANT = "Authorize one NEW prospective v7 reviewed_revision commission for accepted no-remedy requalification.";
export const NO_REMEDY_HISTORY = "The accepted diagnosis establishes no remedy. Historical causes remain UNKNOWN; original failures, false stock, issued limits and consumed grants remain unchanged.";
export const NO_REMEDY_LIMIT = "Exactly one admitted deciding invocation total. Reservation/interruption consumes it. No ordinal two, recovery, automatic renewal or further no-remedy requalification in this branch lineage. Separate fresh-process stock and independent result audit are required.";
export const isNoRemedyRequalification = p => p?.schema === "augnes.local-canonical-source-correction.v7" &&
  p.kind === "reviewed_revision" && p.commission?.requalification === NO_REMEDY_REQUALIFICATION &&
  Object.hasOwn(p.inputs ?? {}, "inventory_sha256");

const equal = (a, b) => a !== undefined && b !== undefined && digest(a) === digest(b);
const sha = value => /^[a-f0-9]{64}$/u.test(value ?? "");
const time = value => typeof value === "string" && Number.isFinite(Date.parse(value));
const keys = (value, names) => value && equal(Object.keys(value).sort(), [...names].sort());
const fail = code => { throw Object.assign(new Error(code), { code }); };
const natural = result => result?.exit_code === 0 && result.timed_out === false && result.cancelled === false &&
  result.termination_reason === "natural_exit" && result.exit_observed === true && result.streams_closed === true &&
  result.cleanup_completed === true && result.remaining_owned_processes === 0 &&
  Number.isFinite(result.duration_ms) && result.duration_ms > 0;
const sourcePath = value => typeof value === "string" && /^[A-Za-z0-9_./\[\]-]+$/u.test(value) &&
  !value.startsWith("/") && value.split("/").every(part => part && part !== "." && part !== "..");

// An introducing admission change can travel in the same PR. This closed
// surface excludes product, workload, deadline and planner changes. Its only
// registration/input-catalogue changes are the exact additive controls below.
// An unchanged candidate has an empty delta and needs no cosmetic commit.
export const NO_REMEDY_ADMISSION_PATHS = Object.freeze([
  ".github/LOCAL_CANONICAL_VERIFICATION.md",
  "scripts/local-canonical-attempts.mjs",
  "scripts/local-canonical-browser-revision.mjs",
  "scripts/local-canonical-no-remedy.mjs",
  "scripts/local-canonical-serial-aggregate.mjs",
  "scripts/prepare-local-canonical-material-source.mjs",
  "scripts/fixtures/local-canonical-material-source.mjs",
  "scripts/fixtures/local-canonical-failed-integration-maintenance.mjs",
  "scripts/fixtures/local-canonical-reviewed-revision.mjs",
  "scripts/test-local-canonical-review-corrections.mjs",
  "scripts/test-local-canonical-verification-contract.mjs",
  "scripts/run-canonical-test-suite.mjs",
  "scripts/run-local-canonical-verification.mjs",
]);

export function noRemedyDelegation(p) {
  return [
    "Accept the no-remedy diagnosis and delegate prospective requalification.",
    `Target: ${p.branch} / Draft PR #${p.pull_request} / ${p.base} / ${p.head} / ${p.tree}.`,
    `Predecessor: ${p.prior_family_id} / ${p.prior_attempt_id} / ${p.prior_receipt_fingerprint}.`,
    `Diagnosis evidence: ${p.focused.sha256}.`,
    NO_REMEDY_REQUALIFICATION, NO_REMEDY_HISTORY,
    "This delegation accepts the referenced separate diagnostic assessment and permits non-reserving preparation. It is not COMPLETE final-source/preparation acceptance or a deciding execution grant.",
    "A separate COMPLETE source, policy, evidence and actual preparation review must precede a distinct authenticated exact-target commission. No source change or diagnostic pass supplies that authority.",
    NO_REMEDY_LIMIT,
  ].join("\n\n");
}

export const delegatesNoRemedyRequalification = (body, p) => body === noRemedyDelegation(p);

export function noRemedyAuthorityScope(p, review, grant, target) {
  const first = body => body.split(/\r?\n/u).find(line => line.trim().length);
  const common = [NO_REMEDY_REQUALIFICATION, NO_REMEDY_HISTORY, p.focused.sha256, p.base, p.head, p.tree,
    p.prior_receipt_fingerprint, target];
  return first(grant.body) === NO_REMEDY_GRANT &&
    [review.body, grant.body].every(body => common.every(value => body.includes(value))) &&
    review.body.split(/\r?\n/u).includes("COMPLETE: exact source, policy, diagnosis, controls and actual preparation accepted.") &&
    grant.body.includes(NO_REMEDY_LIMIT);
}

// The normalized record retains the original observation and assessment files.
// Its hashes establish identity, not truth or reviewer independence; the later
// authenticated delegation explicitly accepts these exact attributed records.
export function verifyNoRemedySourceDelta(p, prior, source, git) {
  if (source.predecessor_to_final.paths.some(name => !NO_REMEDY_ADMISSION_PATHS.includes(name)))
    fail("requalification_not_no_remedy");
  // The introducing controls extend the existing bounded group sequence only.
  // Removing exactly these additions must reproduce all original registration
  // bytes: no existing command, order, bound or assertion can be substituted.
  for (const name of ["scripts/run-canonical-test-suite.mjs", "scripts/test-local-canonical-review-corrections.mjs",
    "scripts/fixtures/local-canonical-reviewed-revision.mjs", "scripts/test-local-canonical-verification-contract.mjs"].filter(name => source.predecessor_to_final.paths.includes(name))) {
    const before = git(["show", `${prior.head}:${name}`]).toString("utf8");
    let after = git(["show", `${p.head}:${name}`]).toString("utf8");
    // Once introduced, these declarations cannot be removed or duplicated by a
    // later lineage. An unchanged existing registration needs no special delta.
    const expected = name.endsWith("fixtures/local-canonical-reviewed-revision.mjs") ? 2 : 1;
    for (const group of ["source", "controls", "successor"])
      if (!before.includes(`"material-no-remedy-${group}"`)) {
        const pattern = new RegExp(`, ?"material-no-remedy-${group}"`, "gu");
        if ([...after.matchAll(pattern)].length !== expected) fail("requalification_workload_changed");
        after = after.replaceAll(pattern, "");
      }
    if (after !== before) fail("requalification_workload_changed");
  }
  const runner = "scripts/run-local-canonical-verification.mjs";
  if (source.predecessor_to_final.paths.includes(runner)) {
    const before = git(["show", `${prior.head}:${runner}`]).toString("utf8");
    let after = git(["show", `${p.head}:${runner}`]).toString("utf8");
    const entry = '  "scripts/local-canonical-no-remedy.mjs",\n';
    if (!before.includes(entry)) {
      if (after.split(entry).length !== 2) fail("requalification_executor_changed");
      after = after.replace(entry, "");
    }
    if (after !== before) fail("requalification_executor_changed");
  }
}

export function readNoRemedyDiagnosis(p, prior, focused, source, { parse, bytes, git, completion, inputs }) {
  if (!isNoRemedyRequalification(p) || focused.remedy !== "none" ||
      !equal(focused.implicated_paths, []) || !equal(focused.input_remedy_resources, []) || focused.regression !== undefined)
    fail("requalification_not_no_remedy");
  verifyNoRemedySourceDelta(p, prior, source, git);
  const evidence = parse(focused.no_remedy);
  if (!keys(evidence, ["contract", "predecessor", "observation", "assessment"]) || evidence.contract !== NO_REMEDY_REQUALIFICATION ||
      !equal(evidence.predecessor, { family_id: p.prior_family_id, attempt_id: p.prior_attempt_id,
        receipt_fingerprint: p.prior_receipt_fingerprint, head: prior.head, tree: prior.tree }))
    fail("requalification_diagnosis_target_invalid");
  const observation = parse(evidence.observation), assessment = parse(evidence.assessment);
  if (!keys(observation, ["contract", "author", "head", "tree", "command", "started_at", "finished_at", "result", "runtime_inputs_sha256", "inventory_sha256", "observed_inputs", "source_files", "instrumentation", "stdout", "stderr", "originals"]) ||
      observation.contract !== "augnes.local-canonical-nondeciding-diagnosis.v1" ||
      typeof observation.author !== "string" || !observation.author.trim() || observation.author.length > 200 ||
      observation.head !== prior.head || observation.tree !== prior.tree ||
      !(observation.runtime_inputs_sha256 === null || observation.runtime_inputs_sha256 === p.inputs.identity_sha256) ||
      !(observation.inventory_sha256 === null || observation.inventory_sha256 === p.inputs.inventory_sha256) ||
      typeof observation.command !== "string" || !observation.command.trim() || observation.command.length > 2000 ||
      !time(observation.started_at) || !time(observation.finished_at) ||
      Date.parse(observation.started_at) <= Date.parse(completion.finished_at) ||
      Date.parse(observation.finished_at) < Date.parse(observation.started_at) || !natural(observation.result) ||
      !Array.isArray(observation.source_files) || !observation.source_files.length || observation.source_files.length > 128 ||
      new Set(observation.source_files.map(row => row.path)).size !== observation.source_files.length ||
      observation.source_files.some(row => {
        if (!keys(row, ["path", "sha256"]) || !sourcePath(row.path) || !sha(row.sha256)) return true;
        return [prior.head, p.head].some(head => {
          const content = git(["show", `${head}:${row.path}`]);
          return digest(content) !== row.sha256;
        });
      }) || !Array.isArray(observation.originals) || !observation.originals.length || observation.originals.length > 16)
    fail("requalification_diagnosis_observation_invalid");
  // A diagnostic may have observed only the Node/header subset. Preserve null
  // for a full runtime/inventory identity it never recorded; current complete
  // preparation is a separate mandatory observation, not retroactive evidence.
  const observed = parse(observation.observed_inputs);
  if (!keys(observed, ["scope", "runtime_before", "runtime_after", "record"]) ||
      !["node-and-headers", "complete-runtime"].includes(observed.scope) ||
      !equal(observed.runtime_before, observed.runtime_after) ||
      !(observed.scope === "complete-runtime" ? equal(observed.runtime_before, inputs) :
        observed.runtime_before?.contract === "augnes.local-canonical-runtime-inputs.v1" &&
        equal(observed.runtime_before.node, inputs.node) && equal(observed.runtime_before.headers, inputs.headers)))
    fail("requalification_diagnosis_inputs_invalid");
  bytes(observed.record, 2 * 1024 * 1024);
  // Keep raw streams and original result/input material readable. Instrumented
  // evidence must disclose its exact method and never becomes uninstrumented PASS.
  bytes(observation.stdout, 2 * 1024 * 1024); bytes(observation.stderr, 2 * 1024 * 1024);
  for (const ref of observation.originals) bytes(ref, 2 * 1024 * 1024);
  if (observation.instrumentation !== null) bytes(observation.instrumentation, 2 * 1024 * 1024);
  if (!keys(assessment, ["contract", "author", "decision", "observation_sha256", "finished_at", "historical_cause", "qualification", "record"]) ||
      assessment.contract !== "augnes.local-canonical-no-remedy-assessment.v1" || assessment.decision !== NO_REMEDY_DECISION ||
      assessment.observation_sha256 !== evidence.observation.sha256 || typeof assessment.author !== "string" ||
      !assessment.author.trim() || assessment.author.length > 200 || assessment.author === observation.author ||
      !time(assessment.finished_at) || Date.parse(assessment.finished_at) < Date.parse(observation.finished_at) ||
      Date.parse(assessment.finished_at) > Date.parse(focused.finished_at) || assessment.historical_cause !== "UNKNOWN" ||
      assessment.qualification !== false || !bytes(assessment.record).toString("utf8").includes(NO_REMEDY_DECISION))
    fail("requalification_diagnosis_assessment_invalid");
  return { evidence, observation, assessment };
}
