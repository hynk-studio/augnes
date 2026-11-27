import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CANONICAL_ORIGIN_URL } from "../canonical-repository-identity.mjs";
import { cleanupCanonicalTestResources, createCanonicalTestResourceRoot } from "../canonical-test-environment.mjs";
import { checkoutVerificationFingerprint } from "../local-canonical-checkout-ownership.mjs";
import { findCompanionMatrixCheckout, verifyCompanionMatrixLogs } from "../local-canonical-companion-matrix-integration.mjs";
import { admitVerificationContext } from "../local-canonical-verification-context.mjs";

const childLabel = "Companion stale-manager stopped recovery and interruption regressions";
const lastCase = "crashed-applier-exact-journal-recovery";
const cases = [
  "fresh-production-layout-stopped-install", "present-invalid-production-sidecar-refused",
  "reused-manager-stopped-history-and-replay", "confirmed-missing-manager",
  "later-live-recovery-with-reused-historical-group", "later-live-recovery-refuses-current-group-and-changed-history",
  "prior-boot-startup-recovery-with-settled-history", "starting-manager-identity-and-recovery-refusals",
  ...["manager", "supervisor", "member"].map(role => `live-${role}-refused`),
  ...["unavailable", "changing"].map(mode => `${mode}-process-observation-refused`),
  "changed-process-witness-after-preparation-refused", "unrecorded-retained-group-member-refused", "active-launch-pid-refused",
  ...["runtime_manifest_path", "runtime_lock_path", "runtime_token_path", "runtime_access_path", "runtime_bridge_environment_path"].map(key => `present-${key}-refused`),
  ...["configuration", "source", "launch", "manager", "manager-lock", "historical-record", "runtime-material"].map(key => `changed-${key}-at-effect-refused`),
  "stale-decision-refused", "active-maintenance-refused",
  ...["active", "unrelated-dead", "reused"].map(owner => `${owner}-lifecycle-lock-refused`),
  ...["after_record", "after_bootout", "after_desired", "after_manager", "after_lock"].map(stage => `interrupted-${stage}-fresh-decision`),
  lastCase,
];

const effectCounts = new Map([
  [cases[2], 1], [cases[3], 1], [cases[4], 3], [cases[5], 1], [cases[6], 3], [lastCase, 1],
]);

function scenarioRows(scenario, duration) {
  const effects = scenario.startsWith("interrupted-") ? 1 : (effectCounts.get(scenario) ?? 0);
  return [
    { stage: "scenario_start", elapsed_ms: 0 },
    { stage: "fixture_ready", elapsed_ms: 500 },
    { stage: "action_pass", elapsed_ms: duration - 120 },
    { pass: true, effects, cleanup_complete: true, elapsed_ms: duration },
  ].map(event => JSON.stringify({ scenario, ...event }));
}

function childLine(event, detail, label = childLabel) {
  return `[canonical:unit] ${event} label=${JSON.stringify(label)} ${detail}`;
}

const live = "exit_observed=false stdout_closed=false stderr_closed=false";
const settled = "exit_observed=true streams_closed=true cleanup_completed=true remaining_owned_processes=0";
const failedDuration = 180_160;
const acceptedDuration = 185_600;

// Exercise the log reader with generated native-format records and no processes or timers.
function matrixLog(interrupted, commonDuration, duration) {
  const bound = interrupted ? 180_000 : 300_000;
  const heartbeat = ms => childLine("child_active", `elapsed_ms=${ms} timeout_ms=${bound} ${live} wait=process_exit`);
  const rows = [childLine("child_start", `timeout_ms=${bound}`), childLine("child_spawn", "pid=1400 wait=process_exit")];
  let elapsed = 0;
  let nextHeartbeat = 30_000;
  for (const scenario of cases) {
    const caseDuration = scenario === lastCase ? 9400 : commonDuration;
    const all = scenarioRows(scenario, caseDuration);
    const observed = interrupted && scenario === lastCase ? all.slice(0, 2) : all;
    for (const row of observed) {
      const eventTime = elapsed + JSON.parse(row).elapsed_ms;
      while (nextHeartbeat <= eventTime) {
        rows.push(heartbeat(nextHeartbeat));
        nextHeartbeat += 30_000;
      }
      rows.push(row);
    }
    elapsed += caseDuration;
  }
  if (interrupted) {
    rows.push(
      childLine("child_cleanup_start", `elapsed_ms=180020 reason=bounded_timeout ${live}`),
      heartbeat(180075),
      childLine("child_cleanup_result", `elapsed_ms=${duration} reason=bounded_timeout streams_closed=true remaining_owned_processes=0`),
      childLine("child_result", `duration_ms=${duration} exit_code=null signal=SIGTERM timed_out=true ${settled} termination_reason=bounded_timeout`),
      `Error: canonical child timed out: suite=unit label=${childLabel} timeout_ms=${bound}`,
    );
  } else {
    rows.push(
      childLine("child_exit", `elapsed_ms=${duration - 40} exit_code=0 signal=null stdout_closed=true stderr_closed=true`),
      childLine("child_cleanup_start", `elapsed_ms=${duration - 40} reason=post_exit_settlement exit_observed=true stdout_closed=true stderr_closed=true`),
      childLine("child_cleanup_result", `elapsed_ms=${duration} reason=post_exit_settlement term_sent=false kill_sent=false streams_closed=true remaining_owned_processes=0`),
      childLine("child_result", `duration_ms=${duration} exit_code=0 signal=null timed_out=false ${settled} termination_reason=natural_exit`),
    );
  }
  return rows.join("\n") + "\n";
}

function replaceOnce(source, needle, replacement) {
  assert(needle.length > 0 && source.includes(needle) && source.indexOf(needle) === source.lastIndexOf(needle));
  assert.notEqual(needle, replacement);
  return source.replace(needle, replacement);
}

function checkRegisteredCheckout() {
  const fixture = createCanonicalTestResourceRoot("ag-resource-test-");
  try {
    const anchor = path.join(fixture.root, "anchor"), upstream = path.join(fixture.root, "accepted checkout");
    mkdirSync(anchor);
    const git = args => execFileSync("git", ["-C", anchor, ...args], { timeout: 10_000 });
    git(["init", "--quiet", "--initial-branch=main"]);
    git(["remote", "add", "origin", CANONICAL_ORIGIN_URL]);
    git(["-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "--quiet", "--allow-empty", "-m", "fixture"]);
    git(["worktree", "add", "--quiet", "--detach", upstream, "HEAD"]);
    for (const dir of ["apps/augnes_apps", "apps/web_planning"]) mkdirSync(path.join(upstream, dir), { recursive: true });

    const context = admitVerificationContext({ repositoryRoot: upstream, canonicalRoot: anchor, platform: "darwin", kind: "isolated-worktree" });
    const owner = checkoutVerificationFingerprint(upstream);
    const lookup = (ownerFingerprint, contextFingerprint) => findCompanionMatrixCheckout(git, {
      checkout_ownership: { checkout_fingerprint: ownerFingerprint },
      verification_context: { checkout_fingerprint: contextFingerprint },
    });
    const refused = { code: "integration_companion_matrix_upstream_originals_changed" };
    assert.notEqual(owner, context.checkout_fingerprint);
    assert.equal(lookup(owner, context.checkout_fingerprint), upstream);
    assert.throws(() => lookup(owner, owner), refused);
    assert.throws(() => lookup(context.checkout_fingerprint, context.checkout_fingerprint), refused);
    assert.throws(() => lookup(owner, context.anchor_fingerprint), refused);
    assert.throws(() => lookup(checkoutVerificationFingerprint(anchor), context.checkout_fingerprint), refused);
    git(["worktree", "remove", upstream]);
    assert.throws(() => lookup(owner, context.checkout_fingerprint), refused);
  } finally {
    assert.equal(cleanupCanonicalTestResources([fixture])[0].completed, true);
  }
}

export function runCompanionMatrixIntegrationControls() {
  checkRegisteredCheckout();
  assert.equal(new Set(cases).size, 39);
  const failed = matrixLog(true, 4560, failedDuration);
  const accepted = matrixLog(false, 4630, acceptedDuration);
  const verify = (before, after) => verifyCompanionMatrixLogs(Buffer.from(before), Buffer.from(after));
  const result = verify(failed, accepted);
  assert.equal(result.interrupted_scenario, lastCase);
  assert.equal(result.completed_scenarios, cases.length);
  assert.equal(result.accepted_duration_ms, acceptedDuration);

  const [start, ready, action, pass] = scenarioRows(lastCase, 9400);
  const delayedStart = JSON.stringify({ scenario: lastCase, stage: "scenario_start", elapsed_ms: 1 });
  const otherSettled = childLine("child_result", `duration_ms=100 exit_code=0 signal=null timed_out=false ${settled} termination_reason=exited_with_owned_descendant_cleanup`, "another unit child");
  assert.deepEqual(verify(otherSettled + "\n" + failed, replaceOnce(accepted, start, delayedStart)), result);
  const otherFailure = childLine("child_result", `duration_ms=100 exit_code=1 signal=null timed_out=false ${settled} termination_reason=natural_exit`, "another unit child");
  const afterTimeout = childLine("child_cleanup_start", `elapsed_ms=180020 reason=bounded_timeout ${live}`);
  const first = scenarioRows(cases[0], 4560).join("\n");
  const second = scenarioRows(cases[1], 4560).join("\n");
  const short = matrixLog(false, 4300, 173000);
  const longSettlement = replaceOnce(replaceOnce(short, "elapsed_ms=173000 reason=post_exit_settlement",
    `elapsed_ms=${acceptedDuration} reason=post_exit_settlement`), "duration_ms=173000", `duration_ms=${acceptedDuration}`);
  const earlierPass = scenarioRows(cases.at(-2), 4560).at(-1);
  const negatives = [
    ["assertion mixed into timed-out child", replaceOnce(failed, ready, ready + "\nAssertionError [ERR_ASSERTION]: recovery produced an extra effect"), accepted],
    ["substantive marker missing", failed, replaceOnce(accepted, action + "\n", "")],
    ["reordered final markers", failed, replaceOnce(accepted, start + "\n" + ready, ready + "\n" + start)],
    ["reordered completed scenarios in predecessor", replaceOnce(failed, first + "\n" + second, second + "\n" + first), accepted],
    ["duplicate completed marker", failed, replaceOnce(accepted, pass, pass + "\n" + pass)],
    ["another failing unit child", otherFailure + "\n" + failed, accepted],
    ["earlier child leaves owned processes", otherSettled.replace("remaining_owned_processes=0", "remaining_owned_processes=1") + "\n" + failed, accepted],
    ["later failure in purportedly passing unit log", failed, accepted + otherFailure + "\n"],
    ["success inside former bound", failed, short],
    ["watchdog fires early", replaceOnce(failed, afterTimeout, afterTimeout.replace("180020", "179950")), accepted],
    ["only post-exit settlement crosses former bound", failed, longSettlement],
    ["action completes inside former bound before delayed exit", failed, matrixLog(false, 4400, acceptedDuration)],
    ["missing final recovery effect", failed, replaceOnce(accepted, pass, pass.replace('"effects":1', '"effects":0'))],
    ["common scenario records a different effect", replaceOnce(failed, earlierPass,
      earlierPass.replace('"effects":1', '"effects":0')), accepted],
    ["completion after interrupted cleanup began", replaceOnce(failed, afterTimeout, afterTimeout + "\n" + action + "\n" + pass), accepted],
  ];
  for (const [label, before, after] of negatives) assert.throws(() => verify(before, after), label);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCompanionMatrixIntegrationControls();
  console.log("Companion matrix integration checkout and log controls passed");
}
