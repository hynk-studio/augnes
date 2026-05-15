import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const closeoutPath = "docs/GITHUB_APP_TOKEN_MANAGEMENT_V0_1_CLOSEOUT.md";
assert.equal(existsSync(closeoutPath), true, "closeout doc should exist");

const closeout = readFileSync(closeoutPath, "utf8");

for (const phrase of [
  "GitHub App/token management v0.1 is complete",
  "bounded foundation",
  "env `GITHUB_TOKEN` provider foundation",
  "provider redaction",
  "C5 token resolution moved behind",
  "GitHub App config reader/validator",
  "offline RS256 JWT fake-key fixture",
  "target/allowlist policy helper",
  "installation-token exchange boundary helper",
  "network-disabled-by-default exchange behavior",
  "injected fake-fetch exchange smoke",
  "docs and smokes for secret redaction",
  "env `GITHUB_TOKEN` remains the only implemented publish token provider",
  "GitHub App installation-token provider is not wired into C5",
  "Live GitHub App installation-token exchange is future work",
  "Live publish remains separately approved and target-specific",
  "C5 gates remain unchanged",
  "Raw GitHub tokens must not be",
  "Raw JWTs must not be logged, persisted, returned, or recorded",
  "Private key material, private key paths, and base64 private-key config must not",
  "written to evidence records",
  "live GitHub App installation-token exchange",
  "provider integration into `resolveGitHubPublishToken()`",
  "live exchange test",
  "live publish with GitHub App token",
  "in-memory token cache",
  "Cockpit publish/write controls",
  "ChatGPT App publish/write tools",
  "UI polishing / Cockpit MVP polish",
]) {
  assertIncludes(closeout, phrase);
}

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
assert.equal(
  packageJson.scripts["smoke:github-token-management-v01-closeout"],
  "node scripts/smoke-github-token-management-v01-closeout.mjs",
  "package.json should register smoke:github-token-management-v01-closeout",
);

for (const dependencyName of ["jose", "jsonwebtoken", "jwt-simple", "node-jose"]) {
  assert.equal(Object.hasOwn(packageJson.dependencies ?? {}, dependencyName), false);
  assert.equal(Object.hasOwn(packageJson.devDependencies ?? {}, dependencyName), false);
}

const changedFiles = execFileSync("git", ["diff", "--name-only", "HEAD"], {
  encoding: "utf8",
})
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean);

const runtimeChanged = changedFiles.filter((file) =>
  /^(app|components|lib)\//.test(file),
);
assert.deepEqual(
  runtimeChanged,
  [],
  "closeout PR should not change runtime source files",
);

console.log(
  JSON.stringify(
    {
      smoke: "github-token-management-v01-closeout",
      closeout_doc_exists: true,
      v01_complete: true,
      env_github_token_only_publish_provider: true,
      github_app_provider_wired_into_c5: false,
      live_exchange_future: true,
      live_publish_future: true,
      c5_gates_unchanged: true,
      runtime_files_changed: runtimeChanged.length,
      new_dependencies_added: false,
    },
    null,
    2,
  ),
);

function assertIncludes(value, expected) {
  assert.equal(
    value.includes(expected),
    true,
    `Expected closeout doc to include: ${expected}`,
  );
}
