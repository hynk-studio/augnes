import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import {
  lstatSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(
  repositoryRoot,
  "native",
  "windows-physical-root",
  "augnes-windows-physical-root-v0.1.cpp",
);
const outputDirectory = path.join(repositoryRoot, "native", "windows-x64");
const helperPath = path.join(
  outputDirectory,
  "augnes-windows-physical-root-v0.1.exe",
);
const manifestPath = path.join(
  outputDirectory,
  "augnes-windows-physical-root-v0.1.json",
);

if (process.platform !== "win32" || process.arch !== "x64") {
  throw new Error("windows_physical_identity_build_platform_unsupported");
}

mkdirSync(outputDirectory, { recursive: true });
const temporaryHelper = `${helperPath}.${process.pid}.tmp.exe`;
const temporaryManifest = `${manifestPath}.${process.pid}.tmp`;
try {
  const result = await execFileAsync(
    "cl.exe",
    [
      "/nologo",
      "/std:c++17",
      "/O2",
      "/EHsc",
      "/W4",
      "/WX",
      "/DUNICODE",
      "/D_UNICODE",
      `/Fe:${temporaryHelper}`,
      sourcePath,
    ],
    {
      cwd: outputDirectory,
      encoding: "utf8",
      maxBuffer: 64 * 1024,
      timeout: 60_000,
      windowsHide: true,
      shell: false,
    },
  );
  if (result.stderr.trim()) {
    throw new Error("windows_physical_identity_build_stderr");
  }
  const stats = lstatSync(temporaryHelper);
  if (!stats.isFile() || stats.isSymbolicLink() || stats.size < 1) {
    throw new Error("windows_physical_identity_build_output_invalid");
  }
  const helperSha256 = createHash("sha256")
    .update(readFileSync(temporaryHelper))
    .digest("hex");
  const manifest = {
    architecture: "x64",
    contract: "augnes.windows_physical_root_helper_manifest.v0.1",
    helper_contract: "augnes.windows_physical_root_helper.v0.1",
    helper_file: "native/windows-x64/augnes-windows-physical-root-v0.1.exe",
    helper_sha256: helperSha256,
    identity_version: "physical_root_identity.windows.v0.1",
    minimum_windows_build: 19045,
    platform: "win32",
  };
  writeFileSync(temporaryManifest, `${JSON.stringify(manifest, null, 2)}\n`, {
    encoding: "utf8",
    flag: "wx",
  });
  renameSync(temporaryHelper, helperPath);
  renameSync(temporaryManifest, manifestPath);
  process.stdout.write(`${JSON.stringify({
    contract: manifest.contract,
    result: "created",
    helper: path.relative(repositoryRoot, helperPath).replaceAll("\\", "/"),
    helper_sha256: helperSha256,
  })}\n`);
} finally {
  rmSync(temporaryHelper, { force: true });
  rmSync(temporaryManifest, { force: true });
  for (const suffix of [".obj", ".pdb", ".ilk"]) {
    rmSync(path.join(outputDirectory, `${path.basename(sourcePath, ".cpp")}${suffix}`), {
      force: true,
    });
  }
}
