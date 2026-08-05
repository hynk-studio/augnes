import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
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

const toolchain = await resolveWindowsToolchain();
mkdirSync(outputDirectory, { recursive: true });
const temporaryHelper = `${helperPath}.${process.pid}.tmp.exe`;
const temporaryManifest = `${manifestPath}.${process.pid}.tmp`;
try {
  rmSync(helperPath, { force: true });
  rmSync(manifestPath, { force: true });
  const result = await execFileAsync(
    toolchain.compilerPath,
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
      env: toolchain.environment,
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

async function resolveWindowsToolchain() {
  const systemRoot = process.env.SystemRoot ?? "C:\\Windows";
  const programFilesX86 = process.env["ProgramFiles(x86)"] ?? path.join(
    path.parse(systemRoot).root,
    "Program Files (x86)",
  );
  const vswherePath = path.join(
    programFilesX86,
    "Microsoft Visual Studio",
    "Installer",
    "vswhere.exe",
  );
  if (!existsSync(vswherePath)) {
    throw new Error("windows_physical_identity_build_toolchain_missing");
  }
  const discovery = await execFileAsync(
    vswherePath,
    [
      "-latest",
      "-products",
      "*",
      "-requires",
      "Microsoft.VisualStudio.Component.VC.Tools.x86.x64",
      "-property",
      "installationPath",
    ],
    {
      encoding: "utf8",
      maxBuffer: 16 * 1024,
      timeout: 15_000,
      windowsHide: true,
      shell: false,
    },
  );
  const installationPath = discovery.stdout.trim();
  if (discovery.stderr.trim() || !path.isAbsolute(installationPath)) {
    throw new Error("windows_physical_identity_build_toolchain_missing");
  }
  const toolsVersionPath = path.join(
    installationPath,
    "VC",
    "Auxiliary",
    "Build",
    "Microsoft.VCToolsVersion.default.txt",
  );
  if (!existsSync(toolsVersionPath)) {
    throw new Error("windows_physical_identity_build_toolchain_missing");
  }
  const toolsVersion = readFileSync(toolsVersionPath, "utf8").trim();
  if (!/^\d+\.\d+\.\d+$/u.test(toolsVersion)) {
    throw new Error("windows_physical_identity_build_toolchain_invalid");
  }
  const toolsRoot = path.join(
    installationPath,
    "VC",
    "Tools",
    "MSVC",
    toolsVersion,
  );
  const compilerDirectory = path.join(toolsRoot, "bin", "Hostx64", "x64");
  const compilerPath = path.join(compilerDirectory, "cl.exe");
  const sdkRoot = path.join(programFilesX86, "Windows Kits", "10");
  const sdkVersion = newestWindowsSdkVersion(sdkRoot);
  const includeRoot = path.join(sdkRoot, "Include", sdkVersion);
  const libraryRoot = path.join(sdkRoot, "Lib", sdkVersion);
  const includeDirectories = [
    path.join(toolsRoot, "include"),
    path.join(includeRoot, "ucrt"),
    path.join(includeRoot, "shared"),
    path.join(includeRoot, "um"),
    path.join(includeRoot, "winrt"),
    path.join(includeRoot, "cppwinrt"),
  ];
  const libraryDirectories = [
    path.join(toolsRoot, "lib", "x64"),
    path.join(libraryRoot, "ucrt", "x64"),
    path.join(libraryRoot, "um", "x64"),
  ];
  if (
    !existsSync(compilerPath) ||
    [...includeDirectories, ...libraryDirectories].some(
      (candidate) => !existsSync(candidate),
    )
  ) {
    throw new Error("windows_physical_identity_build_toolchain_incomplete");
  }
  const environment = { ...process.env };
  const pathKey = Object.keys(environment).find(
    (key) => key.toLowerCase() === "path",
  ) ?? "Path";
  environment[pathKey] = `${compilerDirectory};${environment[pathKey] ?? ""}`;
  environment.INCLUDE = includeDirectories.join(";");
  environment.LIB = libraryDirectories.join(";");
  return { compilerPath, environment };
}

function newestWindowsSdkVersion(sdkRoot) {
  const includeRoot = path.join(sdkRoot, "Include");
  if (!existsSync(includeRoot)) {
    throw new Error("windows_physical_identity_build_sdk_missing");
  }
  const candidates = readdirSync(includeRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^\d+\.\d+\.\d+\.\d+$/u.test(entry.name))
    .map((entry) => entry.name)
    .sort((left, right) => right.localeCompare(left, "en", { numeric: true }));
  const selected = candidates.find((version) =>
    existsSync(path.join(sdkRoot, "Lib", version, "um", "x64")),
  );
  if (!selected) {
    throw new Error("windows_physical_identity_build_sdk_missing");
  }
  return selected;
}
