import { spawnSync } from "node:child_process";
import { existsSync, lstatSync, mkdirSync, realpathSync } from "node:fs";
import path from "node:path";
import { runCodexRollingStableCandidateV01 } from "../lib/vnext/native-host/codex-rolling-stable-candidate";

function git(...args: string[]): string {
  const result = spawnSync("git", args, { encoding: "utf8", timeout: 10_000, maxBuffer: 1024 * 1024 });
  if (result.status !== 0 || result.error || result.signal) throw new Error("codex_rolling_git_identity_unavailable");
  return result.stdout.trim();
}
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.length !== 3 || args[0] !== "--follow-stable" || args[1] !== "--base")
    throw new Error("usage: --follow-stable --base <exact-main-commit>");
  if (process.version !== "v24.18.0" || process.platform !== "darwin" || process.arch !== "arm64")
    throw new Error("codex_rolling_pinned_node_platform_required");
  const root = realpathSync.native(process.cwd());
  const base = args[2]!;
  if (root !== "/Users/hynk/code/augnes" || git("rev-parse", "--show-toplevel") !== root ||
      git("remote", "get-url", "origin") !== "https://github.com/hynk-studio/augnes.git" ||
      !/^[a-f0-9]{40}$/u.test(base) || git("rev-parse", "main") !== base || git("merge-base", base, "HEAD") !== base ||
      git("status", "--porcelain") !== "" || git("branch", "--show-current") === "main")
    throw new Error("codex_rolling_exact_clean_source_required");
  const source = { base_commit: base, head_commit: git("rev-parse", "HEAD"), head_tree: git("rev-parse", "HEAD^{tree}") };
  let evidence = root;
  for (const name of [".augnes-local-verification", "codex-rolling-candidates"]) {
    evidence = path.join(evidence, name);
    if (!existsSync(evidence)) mkdirSync(evidence, { mode: 0o700 });
    if (!lstatSync(evidence).isDirectory() || lstatSync(evidence).isSymbolicLink() || realpathSync.native(evidence) !== evidence)
      throw new Error("codex_rolling_evidence_directory_invalid");
  }
  const result = await runCodexRollingStableCandidateV01({ augnes_source: source, evidence_directory: evidence });
  if (git("rev-parse", "HEAD") !== source.head_commit || git("status", "--porcelain") !== "")
    throw new Error("codex_rolling_source_changed_during_run");
  console.log(JSON.stringify(result, null, 2));
}
main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "codex_rolling_unavailable");
  process.exitCode = 1;
});
