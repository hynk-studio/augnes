import path from "node:path";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { digest, classifyInputChange, nonFaultInputChange } from "./local-canonical-inputs.mjs";
import { browserInputLocalPath, readBrowserInputJson, readBrowserInputBinding, assertBrowserBundle } from "./local-canonical-browser-input.mjs";
import { createGitHubBrowserAuthorizationTransport } from "./github-main-branch-transport.mjs";

export const BROWSER_REPLACEMENT_CONTRACT = "augnes.local-canonical-browser-replacement.v1";
export const BROWSER_AUTHORIZATION_CONTRACT = "augnes.local-canonical-browser-authorization.v1";
const capabilities = new WeakMap();
const sha = value => /^[0-9a-f]{64}$/u.test(value ?? "");
const gitSha = value => /^[0-9a-f]{40}$/u.test(value ?? "");
const fail = code => Object.assign(new Error(code), { code });
const VERIFIER_DELTA_PATHS = new Set([
  ".github/LOCAL_CANONICAL_VERIFICATION.md", "docs/LOCAL_CANONICAL_INPUT_CONTRACT.md", "docs/CANONICAL_BROWSER_VERIFICATION_OWNERSHIP_V1.md",
  ...["local-canonical-browser-bundle", "local-canonical-browser-input", "local-canonical-browser-replacement", "local-canonical-browser-identity",
    "local-canonical-attempts", "local-canonical-receipt", "local-canonical-review-export", "local-canonical-environment", "local-canonical-inputs",
    "github-main-branch-transport", "canonical-test-environment", "run-local-canonical-verification", "run-canonical-test-suite",
    "browser-validate-project-experience-v1", "browser-validate-continuity-v1", "browser-validate-web-planning", "operator-execution-browser-lifecycle-v1",
    "test-local-canonical-browser-input", "test-local-canonical-browser-replacement", "test-local-canonical-classification", "test-local-canonical-review-corrections",
    "test-local-canonical-executor", "test-local-canonical-receipt", "test-local-canonical-verification-contract", "test-github-main-branch-transport"].map(name => `scripts/${name}.mjs`),
  "scripts/test-project-client-browser.ts", "scripts/test-durable-work-surfaces.ts", "scripts/fixtures/browser-input-contract.mjs",
]);
export const BROWSER_REPLACEMENT_PHASES = Object.freeze(["dependencies-root", "dependencies-nested", "dependencies-web-planning", "typecheck", "build", "unit", "authority", "integration", "operability", "e2e-project-experience", "e2e-operator-review-control", "e2e-operator-native-host-execution", "e2e-operator-work-expectation", "e2e-operator-multi-candidate", "e2e-continuity", "e2e-golden"]);

// Eligibility is deliberately narrower than arbitrary input invalidation. It
// preserves the original guard verdict, and reconstructs every retained event.
export function validateBrowserReplacementPredecessor(receipt) {
  const value = structuredClone(receipt); delete value.integrity;
  const input = receipt?.inputs, first = input?.first_fault;
  if (receipt?.receipt_version !== 4 || digest(value) !== receipt.integrity?.content_fingerprint ||
      receipt.outcome?.disposition !== "safety_violation" || digest(receipt.outcome.first_fault) !== digest(first) ||
      receipt.cleanup?.completed !== true || receipt.cleanup.remaining_owned_processes !== 0 || receipt.cleanup.companion_service?.restored !== true ||
      receipt.cleanup.isolated_resources?.completed !== true || receipt.cleanup.isolated_resources.failure_count !== 0 ||
      receipt.checkout_ownership?.released !== true || receipt.capacity_ownership?.released !== true ||
      !Array.isArray(input?.resources) || !Array.isArray(input.events) || input.events.length === 0 || input.events.length >= 64 || !Array.isArray(input.secondary_faults) || input.secondary_faults.length >= 16 ||
      first?.resource !== "browser-executable" || first.disposition !== "safety_violation") throw fail("browser_replacement_predecessor_ineligible");
  const declaration = { contract: input.contract, path_kind: input.path_kind, binding: input.binding, resources: input.resources };
  if (input.contract !== "augnes.local-canonical-inputs.v2" || digest(declaration) !== input.fingerprint || new Set(input.resources.map(r => r.id)).size !== input.resources.length ||
      !["codex-preferences", "user-instructions", "auth-location", "github-auth-location", "git-config", "node-executable", "browser-executable"].every(id => input.resources.some(r => r.id === id))) throw fail("browser_replacement_original_incomplete");
  const faults = [];
  for (const event of input.events) {
    const resource = input.resources.find(r => r.id === event.resource);
    if (!resource || !event.after || event.identity !== digest([event.resource, event.disposition, event.after]) ||
        event.classification !== resource.classification || classifyInputChange(resource.before, event.after, resource) !== event.disposition) throw fail("browser_replacement_event_invalid");
    if (!nonFaultInputChange(event.disposition)) {
      if (event.resource !== "browser-executable" || !["safety_violation", "input_invalidation"].includes(event.disposition) || resource.readOnlyExecutable !== true ||
          resource.before?.present !== true || event.after?.present !== true || !sha(event.after.sha256) ||
          // Demonstrated replacement has a different physical file and bytes;
          // permissions/credentials/other independent faults do not qualify.
          resource.before.metadata?.inode === event.after.metadata?.inode || resource.before.sha256 === event.after.sha256 ||
          ["mode", "uid", "gid", "device"].some(k => resource.before.metadata?.[k] !== event.after.metadata?.[k]) || resource.before.permission_identity !== event.after.permission_identity)
        throw fail("browser_replacement_fault_not_selected_replacement");
      faults.push(event);
    }
  }
  const represented = fault => faults.some(e => e.resource === fault.resource && e.disposition === fault.disposition && e.observed_at === fault.observed_at && e.monotonic_ns === fault.monotonic_ns);
  if (!represented(first) || !input.secondary_faults.every(represented) || faults.some(e => ![first, ...input.secondary_faults].some(f => f.resource === e.resource && f.disposition === e.disposition))) throw fail("browser_replacement_fault_inventory_incomplete");
  if (!Array.isArray(receipt.final?.reason_codes) || receipt.final.reason_codes.some(code => !["verification_cancelled", "selected_phases_incomplete", "phase_cancelled", "input_invalidation"].includes(code)) ||
      !Array.isArray(receipt.phases) || digest(receipt.phases.map(p => p.id)) !== digest(BROWSER_REPLACEMENT_PHASES) || receipt.phases.some(p =>
    !["pass", "failure", "not_run"].includes(p.status) || (p.status !== "not_run" && (p.cleanup?.completed !== true || p.cleanup.remaining_owned_processes !== 0 || p.cleanup.exit_observed !== true || p.cleanup.streams_closed !== true)) ||
    (p.status === "failure" && p.failure_code !== "input_invalidation" && p.failure_code !== "phase_cancelled") || p.timed_out === true || p.spawn_error_code)) throw fail("browser_replacement_phase_fault_unexplained");
  return { receipt_fingerprint: receipt.integrity.content_fingerprint, faults_sha256: digest({ first, events: input.events, secondary: input.secondary_faults }), cleanup_sha256: digest(receipt.cleanup) };
}

export function readBrowserReplacementProof(relative, repositoryRoot) {
  const file = browserInputLocalPath(repositoryRoot, relative), { value: proof } = readBrowserInputJson(file);
  if (proof.contract !== BROWSER_REPLACEMENT_CONTRACT || proof.kind !== "browser_input_replacement" || proof.budget?.initial !== 1 || proof.budget?.recovery !== 0 ||
      !sha(proof.prior_family_id) || ![1, 2].includes(proof.prior_number) || !sha(proof.prior_receipt_fingerprint) || !gitSha(proof.head) || !gitSha(proof.tree) || !gitSha(proof.base) ||
      !sha(proof.delta_sha256) || !sha(proof.executor_fingerprint) || !sha(proof.environment_fingerprint) || !sha(proof.workload_fingerprint) || !sha(proof.common_inputs_sha256) ||
      !Array.isArray(proof.changed_paths) || proof.changed_paths.length > 200 || proof.changed_paths.some(p => typeof p !== "string" || !/^[A-Za-z0-9_./-]+$/u.test(p) || p.split("/").includes("..")) ||
      proof.source_semantics !== "retained_product_new_verifier" || proof.trust_decision !== "pending_exact_artifact_authority") throw fail("browser_replacement_proof_invalid");
  const original = readBrowserInputJson(browserInputLocalPath(repositoryRoot, proof.prior_receipt_path), 512 * 1024).value;
  const evidence = validateBrowserReplacementPredecessor(original);
  if (original.integrity.content_fingerprint !== proof.prior_receipt_fingerprint || original.run.id !== proof.prior_attempt_id ||
      original.attempt?.family_id !== proof.prior_family_id || original.attempt.number !== proof.prior_number || original.repository.branch !== proof.branch ||
      evidence.faults_sha256 !== proof.faults_sha256 || evidence.cleanup_sha256 !== proof.cleanup_sha256) throw fail("browser_replacement_original_mismatch");
  const git = args => execFileSync("git", args, { cwd: repositoryRoot, timeout: 10000, maxBuffer: 16 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] });
  git(["merge-base", "--is-ancestor", original.repository.head_sha, proof.head]);
  git(["merge-base", "--is-ancestor", proof.base, proof.head]);
  if (proof.changed_paths.some(name => !VERIFIER_DELTA_PATHS.has(name))) throw fail("browser_replacement_product_delta_refused");
  if (git(["rev-parse", `${proof.head}^{tree}`]).toString().trim() !== proof.tree ||
      digest(git(["diff", "--binary", "--no-ext-diff", "--no-textconv", original.repository.head_sha, proof.head, "--"])) !== proof.delta_sha256 ||
      digest(git(["diff", "--name-only", original.repository.head_sha, proof.head, "--"]).toString().trim().split("\n").filter(Boolean).sort()) !== digest(proof.changed_paths)) throw fail("browser_replacement_source_delta_invalid");
  // Retained original diagnostic files are independently hash-bound. This is
  // local integrity, not attribution or a publisher signature.
  if (!Array.isArray(proof.evidence) || proof.evidence.length < 3 || proof.evidence.length > 32 || new Set(proof.evidence.map(e => e.relative_path)).size !== proof.evidence.length ||
      !["stabilization", "provenance", "common_inputs"].every(role => proof.evidence.filter(e => e.role === role).length === 1)) throw fail("browser_replacement_evidence_missing");
  for (const item of proof.evidence) {
    const artifact = browserInputLocalPath(repositoryRoot, item.relative_path), record = readBrowserInputJson(artifact, 1024 * 1024);
    if (record.sha256 !== item.sha256) throw fail("browser_replacement_evidence_changed");
  }
  const binding = readBrowserInputBinding(proof.browser_input_path, repositoryRoot);
  if (digest(binding.publicBinding) !== proof.browser_input_sha256) throw fail("browser_replacement_input_mismatch");
  return { ...proof, local_relative_path: relative };
}

export function browserReplacementAuthorityBinding(proof) {
  const copy = structuredClone(proof); delete copy.authorization; delete copy.local_relative_path;
  return { contract: BROWSER_AUTHORIZATION_CONTRACT, binding_sha256: digest(copy), head: proof.head, tree: proof.tree, base: proof.base,
    delta_sha256: proof.delta_sha256, input_sha256: proof.browser_input_sha256, workload_sha256: proof.workload_fingerprint,
    predecessor_receipt: proof.prior_receipt_fingerprint, initial: 1, recovery: 0 };
}

export async function authorizeBrowserReplacement(proof, { transport = createGitHubBrowserAuthorizationTransport() } = {}) {
  const refs = proof.authorization;
  if (!refs || !Number.isSafeInteger(refs.review_id) || !Number.isSafeInteger(refs.grant_comment_id) || !sha(refs.review_sha256) || !sha(refs.grant_sha256)) throw fail("browser_replacement_independent_authority_missing");
  const review = await transport.review(refs.review_id), grant = await transport.grant(refs.grant_comment_id);
  const expected = browserReplacementAuthorityBinding(proof);
  const record = (value, kind) => {
    const matches = [...(value.body ?? "").matchAll(/```augnes-browser-input-authorization\n([^`]+)\n```/gu)];
    if (matches.length !== 1 || value.user?.type !== "User" || !["OWNER", "MEMBER", "COLLABORATOR"].includes(value.author_association)) throw fail("browser_replacement_authority_unattributed");
    const binding = JSON.parse(matches[0][1]);
    if (digest(binding) !== digest({ ...expected, role: kind, review_id: refs.review_id, decision: kind === "independent_review" ? "accept_exact_source_and_artifact_for_trusted_local_fixtures" : "authorize_one_full_and_separate_stock" })) throw fail("browser_replacement_authority_binding_invalid");
    return { id: value.id, author: value.user.login, author_id: value.user.id, body_sha256: digest(value.body), timestamp: value.updated_at ?? value.submitted_at, role: kind };
  };
  if (review.id !== refs.review_id || review.commit_id !== proof.head || !["APPROVED", "COMMENTED"].includes(review.state) || review.pull_request_url !== "https://api.github.com/repos/hynk-studio/augnes/pulls/1546" ||
      grant.id !== refs.grant_comment_id || grant.issue_url !== "https://api.github.com/repos/hynk-studio/augnes/issues/1545") throw fail("browser_replacement_authority_source_invalid");
  const observed = { review: record(review, "independent_review"), grant: record(grant, "execution_grant") };
  if (digest(observed.review) !== refs.review_sha256 || digest(observed.grant) !== refs.grant_sha256 ||
      !Number.isFinite(Date.parse(observed.review.timestamp)) || !Number.isFinite(Date.parse(observed.grant.timestamp)) ||
      Date.parse(observed.grant.timestamp) < Date.parse(observed.review.timestamp) || Date.parse(observed.grant.timestamp) > Date.now()) throw fail("browser_replacement_authority_changed");
  for (const author of new Set([observed.review.author, observed.grant.author])) {
    const permission = await transport.permission(author);
    if (permission.user?.login !== author || !["admin", "maintain"].includes(permission.permission)) throw fail("browser_replacement_authority_not_authorized");
  }
  const capability = Object.freeze({ observations: observed });
  capabilities.set(capability, digest(proof));
  return capability;
}

export function assertBrowserReplacementAuthorization(proof, capability) {
  if (capabilities.get(capability) !== digest(proof)) throw fail("browser_replacement_authority_capability_invalid");
}

export function validateBrowserReplacementLive({ proof, repositoryRoot, branch, head, tree, base, executorFingerprint, environmentFingerprint, workloadFingerprint, commonInputsSha256, browserInput }) {
  const reread = readBrowserReplacementProof(proof.local_relative_path, repositoryRoot);
  if (digest(reread) !== digest(proof) || proof.branch !== branch || proof.head !== head || proof.tree !== tree || proof.base !== base || proof.executor_fingerprint !== executorFingerprint ||
      proof.environment_fingerprint !== environmentFingerprint || proof.workload_fingerprint !== workloadFingerprint || proof.common_inputs_sha256 !== commonInputsSha256 || digest(browserInput.publicBinding) !== proof.browser_input_sha256) throw fail("browser_replacement_live_binding_invalid");
  assertBrowserBundle(browserInput);
  return reread;
}
