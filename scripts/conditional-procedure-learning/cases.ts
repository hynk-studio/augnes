import { execFileSync } from "node:child_process";
import { sha } from "./method";

export const BASE = "325bb45c020e8ee7c8ea50527c136e8bd864cb9c";
export const T1_SOURCE = "045e2b6eef53f831bdc6a0a86b9507ab79e5518a";
export const SEED_SOURCE = "9ddc28001360a27819867a8832a9e610de7e6a8e";
export const SEED = `Source episode: hynk-studio/augnes PR #1310, implementing #1309; exact change f6ee2d07f12d68eb12f9e59a13dc4810500ee6f5 -> 9ddc28001360a27819867a8832a9e610de7e6a8e, lib/vnext/persistence/project-verify-lifecycle-source.ts, resolveSelectedRecordV01.
The recorded task was reducing measured reconstruction work without weakening source, current-head, authority or recovery checks. Historical whole-child durations around 550 seconds did not attribute internal cost. The worker used stage timers, CPU sampling and a deterministic receipt-source read counter. The PR reports overlapping inclusive samples in family authentication and selected-record resolution; those ancestors were not added together.
Source inspection found that readClaimEvidenceRelationV01 authenticated a complete relation family, then adjacent listClaimEvidenceRelationFamilyRevisionsV01 authenticated it again. The implemented correction shares the existing database/scope-bound material read session only inside one private synchronous transaction. No write, callback or asynchronous yield occurs there, and the session cannot escape. Selected-record membership is still checked; current-head and authority checks remain outside this interval. Separate database, recovery and independent readers are not replaced by a shared conclusion.
The recorded fixed ten-materialization samples reduced receipt-source reads 120 to 60 with equal complete material fingerprints, unchanged DB bytes and zero network attempts. The production regression counts 6 rather than 12 receipt reads per materialization; it covers mutation, rollback, same-ID replacement, source conflict and independent connection boundaries. Exact source and this deterministic regression are independently inspectable. Historical timing values are PR-reported, not freshly remeasured here; no statistical confidence or Full Canonical speedup is established.
Recorded corrections: an initial counter predicate matched no SQLite statements; the worker corrected the predicate and, after tracing both required receipt/proposal reads at each gate, corrected its initial expected count of 3 to 6. The before-change regression then failed at 12 vs 6, and the candidate passed at 6. Do not attribute unrecorded motives to that worker. This is one solved seed episode, not a held-out success. No prior procedure candidate is supplied.`;

export const CANDIDATE = `// Constructed variant for this study; not production code.
// A UI loop proposes retaining the full result across calls.
let key: string | undefined;
let value: ReturnType<typeof materializeRunAssessmentProposalV01> | undefined;
function retained(input: Parameters<typeof materializeRunAssessmentProposalV01>[0]) {
  const next = input.packet.packet_id + ":" + input.receipt.receipt_id;
  if (next !== key) { value = materializeRunAssessmentProposalV01(input); key = next; }
  return value;
}
`;

const common = `Investigate this exact disposable source state and recommend an appropriate repair/reuse direction. Do not edit source. You may select one coordinator probe or justify why direct source inspection suffices. No production issue or new production failure is asserted. Only the current case is available; historical fixes and future feedback are excluded. Probe time ceiling is 30 seconds; each executes a fixed repository-owned study probe against the listed source snapshot, with isolated environment and no network. A failed or inconclusive check remains data. No further probe follows the observation turn.`;
export const CASES = {
  T1: {
    ref: T1_SOURCE,
    path: "lib/vnext/run-assessment-proposal.ts",
    provenance: "Historical reconstruction of the pre-#1312/#1313 materializer; related to but distinct from the #1310 seed. Known later fix withheld. Public history/model-training contamination cannot be excluded.",
    task: `${common}\nA pure proposal materializer performs several validations over an already bound packet/receipt/assessment. Its consumer wants less repeated work while preserving complete output, source-refusal, and independent-call behavior. Determine whether expensive work is duplicated inside this call or whether the validations protect different boundaries, and identify the safe scope of any reuse. SOURCE.txt contains the exact materializer and the relation-availability predicate; instrumentation is not a replacement validator.`,
    probes: { "validation-count": "Measure real source-validation and relation-availability calls across ten materializations, retaining output equality and input immutability observations.",
      "repeat-parity": "Compare complete outputs of separate equivalent calls, caller mutation isolation, and an invalid receipt refusal, without collecting call counts." },
  },
  T2: {
    ref: BASE,
    path: "lib/vnext/run-assessment-proposal.ts",
    provenance: "Constructed cross-call memoization proposal around the actual current materializer. This wrapper has never been a production change. Same-ID invalid material is an adversarial test input, not a claimed current incident.",
    task: `${common}\nThe materializer now shares a relation-availability boolean within each call. A caller proposes the retained wrapper in SOURCE.txt to avoid all repeated work across calls. In this consumer, later calls can arrive after another producer replaces receipt material while keeping reference labels. Callers can also modify their returned object. Investigate whether this proposal preserves the owner's refusal/output contract; recommend acceptance, narrowing, or rejection with evidence.`,
    probes: { "steady-reuse": "Run repeated unchanged inputs through the proposed wrapper and the owner; compare output equality and actual owner call counts.",
      "changed-input": "Run a valid input followed by changed receipt content under identical packet/receipt IDs through the proposed wrapper and the owner; compare acceptance/refusal and output identities.",
      "caller-mutation": "Modify one returned result and compare later results through the wrapper and the owner, with unchanged inputs." },
  },
  T3: {
    ref: BASE,
    path: "scripts/supervisor-process-observation.mjs",
    provenance: "Constructed lossy display and reuse proposal over the actual #1305 observation owner. Synthetic command outcomes are produced by real bounded child processes; no ambient supervisor is killed or production failure alleged.",
    task: `${common}\nAn operator sees a local preservation display change from one matching process to zero. The constructed display computes count = observation.pids?.length ?? 0, discarding status/reason. A proposed remedy retains the first successful observation across the run and cleanup to suppress fluctuation and reduce repeated process reads. Determine what the apparent change can establish, what distinguishes plausible causes, and what repair direction preserves a meaningful end-of-run check. SOURCE.txt is the exact observation/cleanup owner. A conclusion of "do not reuse the memo" alone is insufficient.`,
    probes: { "observation-contract": "Exercise successful empty output, command failure and a synthetic PID disappearance using real child exit/output results through the exact observer/comparator.",
      "cleanup-path": "Exercise one successful baseline and one failing final command around the exact cleanup wrapper; observe work/cleanup counts and the returned error classification." },
  },
} as const;

export function gitSource(ref: string, filename: string): string {
  return execFileSync("git", ["show", `${ref}:${filename}`], { encoding: "utf8", maxBuffer: 2_000_000 });
}
export function caseSource(task: keyof typeof CASES): string {
  const item = CASES[task];
  let text = `Exact source: ${item.ref}:${item.path}\n\n${gitSource(item.ref, item.path)}`;
  if (task !== "T3") {
    const owner = gitSource(item.ref, "lib/vnext/episode-delta-proposal.ts");
    const start = owner.indexOf("export function criterionSpecificRelationsAvailableV01(");
    const end = owner.indexOf("\nexport ", start + 1);
    if (start < 0 || end < 0) throw new Error("case_source_excerpt_unavailable");
    text += `\nExact excerpt: ${item.ref}:lib/vnext/episode-delta-proposal.ts\n${owner.slice(start, end)}`;
  }
  if (task === "T2") text += `\n${CANDIDATE}`;
  return text;
}
export function freezeCases() {
  return Object.fromEntries(Object.entries(CASES).map(([id, item]) => {
    const source = caseSource(id as keyof typeof CASES);
    return [id, { ...item, source, source_sha256: sha(source),
      task_sha256: sha(item.task), probe_ids: Object.keys(item.probes) }];
  }));
}

// Review expectations stay coordinator-only, never in a worker snapshot.
export const REVIEW = {
  provenance: "Case-author review, not independent or blind. No evaluator-model call. Factual observations are returned identically to B/A within their own chosen action; no gold diagnosis is added as feedback.",
  categories: ["supported_diagnosis_and_repair_direction", "missed_constraints_or_counterexamples",
    "harmful_transfer", "inappropriate_non_use", "unnecessary_checks_or_failed_approaches", "unresolved_blockers"],
  T1: "A successful count probe should reveal duplicate relation-availability evaluation, not make all source checks redundant. Private within-call boolean reuse is a candidate; global/cross-call cache, removing admission/refusal, or general speedup claims are unsupported.",
  T2: "Identical labels are not an immutable complete input. Changed-input or caller-mutation can refute the proposed whole-result wrapper. A steady-input success alone cannot establish safety. Preserve independent validation and caller isolation; distinguish this wrapper from the current private boolean reuse.",
  T3: "Failed observation is unknown, not zero. Successful empty and successful changed PID sets differ from failure. Caching across work/cleanup hides actual change or unavailable observation; retain fresh final observation, status and cleanup. No inference that real supervisors disappeared, and no repair by killing/restarting ambient processes.",
  comparison: "No composite score, verbosity/obedience reward, superiority promise or pure-updater causal claim. T1 F/A is repeat variability. Later arms compare complete adaptation histories. One sequence is not nine independent samples. B>=A does not earn specialized overhead; F=A shows no additional revision value. No justified change is valid.",
};
