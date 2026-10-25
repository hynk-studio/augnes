import { lstatSync, realpathSync } from "node:fs";
import path from "node:path";
import { selectedPythonInputs } from "./local-canonical-selected-execution.mjs";
import { runCanonicalChild, canonicalChildAcceptanceFailure } from "./canonical-child-runner.mjs";

// node-gyp discovers sys.executable and invokes that absolute path again. Keep
// that capability pointed at this generated dispatcher, so discovery and Python
// scripts' own subprocesses retain the same startup policy. This is a bounded
// interpreter adapter, not a restriction on Python program effects.
const bootstrap = `import builtins, os, sys, types
wrapper, mode, entry, original, *arguments = sys.argv[1:]
sys.executable = wrapper
sys.argv = [original, *arguments]
sys.path[0] = "" if mode == "command" else os.path.dirname(entry)
module = types.ModuleType("__main__")
module.__dict__.update(__builtins__=builtins, __package__=None, __spec__=None, __cached__=None)
sys.modules["__main__"] = module
if mode == "command":
    code = compile(entry, "<string>", "exec")
else:
    module.__file__ = entry
    with open(entry, "rb") as source:
        code = compile(source.read(), entry, "exec")
exec(code, module.__dict__)
`;

try {
  const selected = selectedPythonInputs(process.env, process.cwd());
  const original = process.argv.slice(2), forwarded = [];
  let index = 0;
  while (["-E", "-s", "-S", "-B", "-v"].includes(original[index])) {
    if (["-B", "-v"].includes(original[index])) forwarded.push(original[index]);
    index++;
  }
  let args;
  if (original.length - index === 1 && ["--version", "-V"].includes(original[index])) {
    args = ["-E", "-s", "-S", ...forwarded, "--version"];
  } else {
    const command = original[index] === "-c", entry = original[index + (command ? 1 : 0)];
    if (typeof entry !== "string" || entry.includes("\0") || (!command && entry.startsWith("-"))) throw new Error("selected_python_arguments_unclassified");
    let script = entry;
    if (!command) {
      script = path.resolve(entry);
      if (!selected.roots.some(root => script === root || script.startsWith(root + path.sep)) ||
          realpathSync(script) !== script || !lstatSync(script).isFile()) throw new Error("selected_python_entrypoint_unclassified");
    }
    args = ["-E", "-s", "-S", ...forwarded, "-c", bootstrap, selected.wrapper,
      command ? "command" : "script", script, command ? "-c" : entry, ...original.slice(index + (command ? 2 : 1))];
  }
  // Dedicated dispatch process: install only the already validated selected
  // environment, including its existing own/ancestor ledger identities.
  Object.assign(process.env, selected.env);
  // Keep the mandatory file ledger while preserving Python's byte-exact stdout
  // (notably node-gyp's executable-discovery protocol).
  process.env.AUGNES_CANONICAL_CHILD_LEDGER = "0";
  const result = await runCanonicalChild({ suite: "selected-python", label: "selected Python interpreter",
    command: selected.executable, args, cwd: process.cwd(), env: selected.env, timeoutMs: 30_000,
    stdout: process.stdout, stderr: process.stderr, log() {},
  });
  process.exitCode = canonicalChildAcceptanceFailure(result, { suite: "selected-python", timeoutMs: 30_000, requireNaturalExit: true }) === null
    ? 0 : result.exit_code || 1;
} catch (error) {
  process.stderr.write(`${error.code ?? error.message}\n`);
  process.exitCode = 126;
}
