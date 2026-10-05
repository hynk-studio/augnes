// Exact historical product owners run in a disposable process. Only the old
// test harness entry point/root are adapted; no product source or record is patched.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { runCanonicalChild, canonicalChildAcceptanceFailure } from "./canonical-child-runner.mjs";

export const DURABLE_WORK_PREDECESSOR = "d9b6b56f0de6dcb0a36ac591b13a3672f99fa71a";
export async function historicalDurableWorkFixtures(root: string) {
  const repository = process.cwd(), source = path.join(root, "historical-source"), data = path.join(root, "historical-projects");
  mkdirSync(source); mkdirSync(data);
  const git = (args: string[]) => execFileSync("git", args, { cwd: repository, timeout: 10_000, maxBuffer: 96 * 1024 * 1024 });
  assert.equal(git(["rev-parse", `${DURABLE_WORK_PREDECESSOR}:package-lock.json`]).toString(), git(["rev-parse", "HEAD:package-lock.json"]).toString(), "Historical fixture requires the same verified dependencies");
  const archive = git(["archive", "--format=tar", DURABLE_WORK_PREDECESSOR, "lib", "types", "app", "components", "scripts", "fixtures", "package.json", "tsconfig.json"]);
  execFileSync("tar", ["-xf", "-", "-C", source], { input: archive, timeout: 10_000, maxBuffer: 1024 * 1024 });
  symlinkSync(path.join(repository, "node_modules"), path.join(source, "node_modules"), "junction");
  const harness = path.join(source, "scripts/test-stateless-source-review.ts");
  let text = readFileSync(harness, "utf8");
  const rootDeclaration = 'const root = realpathSync(mkdtempSync(path.join(tmpdir(), "augnes-stateless-review-")));';
  assert.equal(text.split(rootDeclaration).length, 2);
  text = text.replace(rootDeclaration, 'const root = realpathSync(process.env.AUGNES_TEST_HISTORICAL_FIXTURE_ROOT!);');
  const entry = text.split("\n").filter(line => line.startsWith('void (process.argv[2] === "--resume"'));
  assert.equal(entry.length, 1);
  text = text.replace(entry[0]!, "export { fixture, root, databases, network, onNetwork, zeroNetwork, canonical, readProjectWorkInitializationV01, readProjectAutomationControlV01, controlFor };");
  writeFileSync(harness, text);
  const producer = path.join(source, "scripts/historical-durable-work-producer.ts");
  writeFileSync(producer, readFileSync(path.join(repository, "scripts/historical-durable-work-producer.ts")));
  const output = path.join(root, "historical-work.json");
  const result = await runCanonicalChild({ suite: "durable-work-history", label: "pinned predecessor authentic authoring", command: process.execPath,
    args: ["--import", "tsx", producer, harness, output], cwd: repository, timeoutMs: 45_000, resourceOwner: undefined,
    env: { ...process.env, OPENAI_API_KEY: "", TSX_TSCONFIG_PATH: path.join(source, "tsconfig.json"), AUGNES_TEST_HISTORICAL_FIXTURE_ROOT: data } });
  assert.equal(canonicalChildAcceptanceFailure(result, { suite: "durable-work-history", timeoutMs: 45_000, requireNaturalExit: true }), null);
  const bytes = readFileSync(output); assert(bytes.length <= 1024 * 1024);
  const fixtures = JSON.parse(bytes.toString());
  for (const fixture of Object.values(fixtures) as any[]) {
    for (const target of [fixture.config.database_path, fixture.projectRoot]) {
      const relative = path.relative(data, target);
      assert(relative && !relative.startsWith("..") && !path.isAbsolute(relative));
    }
  }
  return fixtures;
}
