import { mkdirSync, writeFileSync, readFileSync, chmodSync, renameSync, symlinkSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { digest, observeInputFile } from "../local-canonical-inputs.mjs";
import { createBrowserBundleObserver } from "../local-canonical-browser-bundle.mjs";
import { BROWSER_INPUT_CONTRACT, readBrowserInputBinding } from "../local-canonical-browser-input.mjs";
import { BROWSER_REPLACEMENT_CONTRACT, BROWSER_REPLACEMENT_PHASES, browserReplacementAuthorityBinding, validateBrowserReplacementPredecessor } from "../local-canonical-browser-replacement.mjs";
import { beginAttempt, finishAttempt } from "../local-canonical-attempts.mjs";
import { finalizeReceipt } from "../local-canonical-receipt.mjs";
import { baseReceipt } from "./local-canonical-receipt-v3.mjs";

export const fixtureWrite = (file, value) => writeFileSync(file, typeof value === "string" ? value : JSON.stringify(value), { mode: 0o600 });
export function fixtureBrowser(checkout) {
  const relative = ".augnes-local-verification/browser/Google Chrome for Testing.app", root = path.join(checkout, relative);
  mkdirSync(path.join(root, "Contents/MacOS"), { recursive: true }); mkdirSync(path.join(root, "Contents/Frameworks/Versions/A/Resources"), { recursive: true });
  const executable = path.join(root, "Contents/MacOS/Google Chrome for Testing");
  fixtureWrite(executable, "#!/bin/sh\necho 'Google Chrome for Testing 156.0.8078.47'\n"); chmodSync(executable, 0o700);
  fixtureWrite(path.join(root, "Contents/Frameworks/Versions/A/Resources/data"), "fixture-data");
  symlinkSync("A", path.join(root, "Contents/Frameworks/Versions/Current"));
  return refreshFixtureBinding(checkout, relative);
}
export function refreshFixtureBinding(checkout, relative = ".augnes-local-verification/browser/Google Chrome for Testing.app") {
  const snapshot = createBrowserBundleObserver(path.join(checkout, relative))({ force: true });
  const reference = ".augnes-local-verification/browser/reference.json", binding = ".augnes-local-verification/browser/binding.json";
  fixtureWrite(path.join(checkout, reference), { observation: snapshot.observation, inventory: snapshot.inventory, files: snapshot.files });
  fixtureWrite(path.join(checkout, binding), { contract: BROWSER_INPUT_CONTRACT, version: "156.0.8078.47", platform: "mac-arm64", bundle_relative_path: relative,
    executable: "Contents/MacOS/Google Chrome for Testing", reference: { relative_path: reference, sha256: digest(readFileSync(path.join(checkout, reference))) },
    artifact: { origin: "https://storage.googleapis.com/chrome-for-testing-public/156.0.8078.47/mac-arm64/chrome-mac-arm64.zip", zip_sha256: "a".repeat(64), metadata_sha256: "b".repeat(64), codesign_exit: 1, spctl_exit: 1 } });
  return readBrowserInputBinding(binding, checkout);
}

export function fixtureCandidate({ checkout, anchor, checkoutOwner, branch = "codex/browser-fixture" }) {
  const git = (...args) => execFileSync("git", args, { cwd: checkout, timeout: 10000, maxBuffer: 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] });
  git("init", "-b", branch); mkdirSync(path.join(checkout, "scripts"));
  fixtureWrite(path.join(checkout, "scripts/local-canonical-inputs.mjs"), "export const version=1;\n");
  const commit = message => { git("add", "scripts"); git("-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-m", message); return git("rev-parse", "HEAD").toString().trim(); };
  const oldHead = commit("original verifier"), oldTree = git("rev-parse", "HEAD^{tree}").toString().trim();
  const prior = beginAttempt({ repositoryRoot: checkout, anchorRoot: anchor, checkoutOwner, branch, head: oldHead, tree: oldTree, runId: "original-browser-stop", contractFingerprint: "c".repeat(64) });
  const launcher = path.join(checkout, ".augnes-local-verification/shared-fixture"); fixtureWrite(launcher, "old fixture\n"); chmodSync(launcher, 0o700);
  const before = observeInputFile(launcher, { readOnlyExecutable: true }); renameSync(launcher, launcher + ".old"); fixtureWrite(launcher, "new fixture\n"); chmodSync(launcher, 0o700);
  const after = observeInputFile(launcher, { readOnlyExecutable: true }), fault = { resource: "browser-executable", disposition: "safety_violation", observed_at: new Date().toISOString(), monotonic_ns: "1" };
  const resource = { id: "browser-executable", classification: "execution", readOnlyExecutable: true, before, location_fingerprint: digest(launcher) };
  const resources = [resource, ...["codex-preferences", "user-instructions", "auth-location", "github-auth-location", "git-config", "node-executable"].map(id => ({ id, classification: "safety", before: { present: false }, location_fingerprint: digest(id) }))];
  const declaration = { contract: "augnes.local-canonical-inputs.v2", path_kind: "isolated-model-free-v1", binding: {}, resources };
  const event = { ...fault, classification: "execution", after, identity: digest([fault.resource, fault.disposition, after]) };
  const receipt = finalizeReceipt({ ...structuredClone(baseReceipt), receipt_version: 4, repository: { ...baseReceipt.repository, head_sha: oldHead, tree_sha: oldTree, base_sha: oldHead, branch }, run: { ...baseReceipt.run, id: prior.attempt_id }, attempt: prior,
    inputs: { ...declaration, fingerprint: digest(declaration), checks: 2, first_fault: fault, secondary_faults: [], events: [event] },
    outcome: { disposition: "safety_violation", first_fault: fault },
    checkout_ownership: { released: true }, capacity_ownership: { released: true },
    cleanup: { completed: true, remaining_owned_processes: 0, companion_service: { restored: true }, isolated_resources: { completed: true, failure_count: 0 } },
    phases: BROWSER_REPLACEMENT_PHASES.map((id, i) => ({ id, status: i < 5 ? "pass" : i === 5 ? "failure" : "not_run", failure_code: i === 5 ? "phase_cancelled" : null, timed_out: false,
      cleanup: { completed: i < 6, remaining_owned_processes: i < 6 ? 0 : null, exit_observed: i < 6, streams_closed: i < 6 } })) });
  const receipts = path.join(checkout, ".augnes-local-verification/receipts"); mkdirSync(receipts);
  fixtureWrite(path.join(receipts, "original.json"), receipt);
  finishAttempt(prior, { receiptFingerprint: receipt.integrity.content_fingerprint, disposition: "safety_violation", cleanupComplete: true });
  fixtureWrite(path.join(checkout, "scripts/local-canonical-inputs.mjs"), "export const version=2;\n");
  const head = commit("new verifier"), tree = git("rev-parse", "HEAD^{tree}").toString().trim(), binding = fixtureBrowser(checkout);
  const evidence = [];
  for (const role of ["stabilization", "provenance", "common_inputs"]) {
    const relative_path = `.augnes-local-verification/browser/${role}.json`; fixtureWrite(path.join(checkout, relative_path), { role, fixture: true });
    evidence.push({ role, relative_path, sha256: digest(readFileSync(path.join(checkout, relative_path))) });
  }
  const observed = validateBrowserReplacementPredecessor(receipt);
  const proof = { contract: BROWSER_REPLACEMENT_CONTRACT, kind: "browser_input_replacement", budget: { initial: 1, recovery: 0 }, branch,
    prior_family_id: prior.family_id, prior_number: 1, prior_attempt_id: prior.attempt_id, prior_receipt_fingerprint: receipt.integrity.content_fingerprint,
    prior_receipt_path: ".augnes-local-verification/receipts/original.json", faults_sha256: observed.faults_sha256, cleanup_sha256: observed.cleanup_sha256,
    head, tree, base: oldHead, delta_sha256: digest(git("diff", "--binary", "--no-ext-diff", "--no-textconv", oldHead, head, "--")), changed_paths: ["scripts/local-canonical-inputs.mjs"],
    executor_fingerprint: "d".repeat(64), environment_fingerprint: "e".repeat(64), workload_fingerprint: "f".repeat(64), common_inputs_sha256: "1".repeat(64),
    source_semantics: "retained_product_new_verifier", trust_decision: "pending_exact_artifact_authority", evidence,
    browser_input_path: binding.publicBinding.local_relative_path, browser_input_sha256: digest(binding.publicBinding) };
  const relative = ".augnes-local-verification/browser/proof.json";
  const authority = fixtureAuthority(proof);
  fixtureWrite(path.join(checkout, relative), proof);
  return { checkout, anchor, checkoutOwner, branch, head, tree, base: oldHead, prior, receipt, proof, relative, binding, authority, git,
    live: { browserInput: binding, executorFingerprint: proof.executor_fingerprint, environmentFingerprint: proof.environment_fingerprint, workloadFingerprint: proof.workload_fingerprint, commonInputsSha256: proof.common_inputs_sha256 } };
}

export function fixtureAuthority(proof) {
  // Fake authenticated responses exist only behind the transport's existing
  // runner injection; production CLI has no flag/file/env authority substitute.
  const now = new Date().toISOString(), reviewId = 101, grantId = 202;
  const body = role => "```augnes-browser-input-authorization\n" + JSON.stringify({ ...browserReplacementAuthorityBinding(proof), role, review_id: reviewId, decision: role === "independent_review" ? "accept_exact_source_and_artifact_for_trusted_local_fixtures" : "authorize_one_full_and_separate_stock" }) + "\n```";
  const review = { id: reviewId, user: { login: "fixture-owner", id: 7, type: "User" }, author_association: "OWNER", body: body("independent_review"), submitted_at: now, state: "COMMENTED", commit_id: proof.head, pull_request_url: "https://api.github.com/repos/hynk-studio/augnes/pulls/1546" };
  const grant = { id: grantId, user: { ...review.user }, author_association: "OWNER", body: body("execution_grant"), updated_at: now, issue_url: "https://api.github.com/repos/hynk-studio/augnes/issues/1545" };
  const digestRecord = (r, role) => digest({ id: r.id, author: r.user.login, author_id: r.user.id, body_sha256: digest(r.body), timestamp: r.updated_at ?? r.submitted_at, role });
  proof.authorization = { review_id: reviewId, grant_comment_id: grantId, review_sha256: digestRecord(review, "independent_review"), grant_sha256: digestRecord(grant, "execution_grant") };
  return { review, grant };
}
