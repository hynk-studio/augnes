import { createHash } from "node:crypto";
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdirSync,
  realpathSync,
  rmdirSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";

export const AUGNES_LOCAL_PATH_LAYOUT_VERSION = 1;

export class PublicLocalPathError extends Error {
  constructor(code) {
    super(code);
    this.name = "PublicLocalPathError";
    this.code = code;
  }
}

export function repositoryPathFingerprint(repositoryRoot) {
  return createHash("sha256").update(realpathSync(repositoryRoot)).digest("hex");
}

export function resolveAugnesLocalPaths({
  environment = process.env,
  platform = process.platform,
  repositoryRoot,
  repositoryFingerprint = repositoryPathFingerprint(repositoryRoot),
  homeDirectory,
  validatePhysicalPaths = true,
} = {}) {
  if (!repositoryRoot) throw new PublicLocalPathError("repository_path_invalid");
  const pathApi = platform === "win32" ? path.win32 : path;
  const home = resolveHomeDirectory({
    environment,
    platform,
    pathApi,
    homeDirectory,
  });
  const checkoutScope = `checkout-${repositoryFingerprint.slice(0, 16)}`;
  const roots = resolvePlatformRoots({ environment, platform, pathApi, home });

  let dataDirectory;
  let configDirectory;
  let backupDirectory;
  if (platform === "darwin") {
    const checkoutRoot = pathApi.join(
      roots.data,
      "Augnes",
      `v${AUGNES_LOCAL_PATH_LAYOUT_VERSION}`,
      "checkouts",
      checkoutScope,
    );
    dataDirectory = pathApi.join(checkoutRoot, "data");
    configDirectory = pathApi.join(checkoutRoot, "config");
    backupDirectory = pathApi.join(checkoutRoot, "backups");
  } else if (platform === "win32") {
    const dataRoot = pathApi.join(
      roots.data,
      "Augnes",
      `v${AUGNES_LOCAL_PATH_LAYOUT_VERSION}`,
      "checkouts",
      checkoutScope,
    );
    const configRoot = pathApi.join(
      roots.config,
      "Augnes",
      `v${AUGNES_LOCAL_PATH_LAYOUT_VERSION}`,
      "checkouts",
      checkoutScope,
    );
    dataDirectory = pathApi.join(dataRoot, "data");
    configDirectory = pathApi.join(configRoot, "config");
    backupDirectory = pathApi.join(dataRoot, "backups");
  } else {
    const relativeCheckout = [
      "augnes",
      `v${AUGNES_LOCAL_PATH_LAYOUT_VERSION}`,
      "checkouts",
      checkoutScope,
    ];
    dataDirectory = pathApi.join(roots.data, ...relativeCheckout, "data");
    configDirectory = pathApi.join(roots.config, ...relativeCheckout, "config");
    backupDirectory = pathApi.join(roots.state, ...relativeCheckout, "backups");
  }

  const runtimeDirectory = resolveRuntimeDirectory({
    environment,
    platform,
    pathApi,
    home,
    roots,
    checkoutScope,
  });
  const explicitDatabasePath = nonEmptyString(environment.AUGNES_DB_PATH);
  if (explicitDatabasePath && !pathApi.isAbsolute(explicitDatabasePath)) {
    throw new PublicLocalPathError("database_path_must_be_absolute");
  }
  const databasePath = explicitDatabasePath
    ? pathApi.resolve(explicitDatabasePath)
    : pathApi.join(dataDirectory, "augnes.db");

  if (validatePhysicalPaths) {
    for (const [candidate, code] of [
      [dataDirectory, "data_path_must_be_outside_repository"],
      [configDirectory, "config_path_must_be_outside_repository"],
      [backupDirectory, "backup_path_must_be_outside_repository"],
      [runtimeDirectory, "runtime_state_path_must_be_outside_repository"],
    ]) {
      resolvePhysicalLocalDestination({
        candidate,
        repositoryRoot,
        insideRepositoryCode: code,
      });
      assertDirectoryIsNotSymlink(candidate, directoryErrorCode(code));
    }
  }

  return {
    layout_version: AUGNES_LOCAL_PATH_LAYOUT_VERSION,
    checkout_scope: checkoutScope,
    data_directory: dataDirectory,
    config_directory: configDirectory,
    backup_directory: backupDirectory,
    runtime_directory: runtimeDirectory,
    database_path: databasePath,
    database_override_active: Boolean(explicitDatabasePath),
  };
}

export function resolvePhysicalLocalDestination({
  candidate,
  repositoryRoot,
  insideRepositoryCode = "local_path_must_be_outside_repository",
  invalidCode = "local_path_invalid",
} = {}) {
  if (!path.isAbsolute(candidate)) throw new PublicLocalPathError(invalidCode);
  const lexicalDestination = path.resolve(candidate);
  let existingAncestor = lexicalDestination;
  const missingSegments = [];
  while (!existsSync(existingAncestor)) {
    const parent = path.dirname(existingAncestor);
    if (parent === existingAncestor) throw new PublicLocalPathError(invalidCode);
    missingSegments.unshift(path.basename(existingAncestor));
    existingAncestor = parent;
  }

  let physicalRepositoryRoot;
  let physicalAncestor;
  try {
    physicalRepositoryRoot = realpathSync(repositoryRoot);
    physicalAncestor = realpathSync(existingAncestor);
  } catch {
    throw new PublicLocalPathError(invalidCode);
  }
  const physicalDestination = path.resolve(physicalAncestor, ...missingSegments);
  if (isInsideOrEqual(physicalRepositoryRoot, physicalDestination)) {
    throw new PublicLocalPathError(insideRepositoryCode);
  }
  return {
    lexical_destination: lexicalDestination,
    physical_destination: physicalDestination,
    physical_repository_root: physicalRepositoryRoot,
  };
}

export function ensureApplicationDirectory({
  directory,
  repositoryRoot,
  insideRepositoryCode = "local_path_must_be_outside_repository",
  invalidCode = "local_directory_invalid",
} = {}) {
  resolvePhysicalLocalDestination({
    candidate: directory,
    repositoryRoot,
    insideRepositoryCode,
    invalidCode,
  });
  const existedBefore = existsSync(directory);
  let firstCreatedDirectory;
  try {
    firstCreatedDirectory = mkdirSync(directory, { recursive: true, mode: 0o700 });
    const stats = lstatSync(directory);
    if (!stats.isDirectory() || stats.isSymbolicLink()) {
      throw new PublicLocalPathError(invalidCode);
    }
    const physicalDirectory = realpathSync(directory);
    const physicalRepositoryRoot = realpathSync(repositoryRoot);
    if (isInsideOrEqual(physicalRepositoryRoot, physicalDirectory)) {
      throw new PublicLocalPathError(insideRepositoryCode);
    }
    try {
      chmodSync(directory, 0o700);
    } catch {
      // Windows does not implement POSIX mode semantics.
    }
    return physicalDirectory;
  } catch (error) {
    if (!existedBefore && firstCreatedDirectory) {
      removeCreatedEmptyDirectoryChain(directory, firstCreatedDirectory);
    }
    if (error instanceof PublicLocalPathError) throw error;
    throw new PublicLocalPathError(invalidCode);
  }
}

function resolvePlatformRoots({ environment, platform, pathApi, home }) {
  if (platform === "darwin") {
    const applicationSupport = pathApi.join(home, "Library", "Application Support");
    return {
      data: applicationSupport,
      config: applicationSupport,
      state: applicationSupport,
      runtime: applicationSupport,
    };
  }
  if (platform === "win32") {
    const local = resolveOptionalAbsolute(
      nonEmptyString(environment.LOCALAPPDATA),
      pathApi.join(home, "AppData", "Local"),
      pathApi,
    );
    const roaming = resolveOptionalAbsolute(
      nonEmptyString(environment.APPDATA),
      pathApi.join(home, "AppData", "Roaming"),
      pathApi,
    );
    return { data: local, config: roaming, state: local, runtime: local };
  }
  return {
    data: resolveOptionalAbsolute(
      nonEmptyString(environment.XDG_DATA_HOME),
      pathApi.join(home, ".local", "share"),
      pathApi,
    ),
    config: resolveOptionalAbsolute(
      nonEmptyString(environment.XDG_CONFIG_HOME),
      pathApi.join(home, ".config"),
      pathApi,
    ),
    state: resolveOptionalAbsolute(
      nonEmptyString(environment.XDG_STATE_HOME),
      pathApi.join(home, ".local", "state"),
      pathApi,
    ),
    runtime: nonEmptyString(environment.XDG_RUNTIME_DIR)
      ? resolveRequiredAbsolute(environment.XDG_RUNTIME_DIR, pathApi)
      : null,
  };
}

function resolveRuntimeDirectory({
  environment,
  platform,
  pathApi,
  roots,
  checkoutScope,
}) {
  const configured = nonEmptyString(environment.AUGNES_RUNTIME_STATE_DIR);
  if (configured) {
    if (!pathApi.isAbsolute(configured)) {
      throw new PublicLocalPathError("runtime_state_path_must_be_absolute");
    }
    return pathApi.resolve(configured);
  }
  if (platform === "darwin") {
    return pathApi.join(roots.runtime, "Augnes", "runtime", checkoutScope);
  }
  if (platform === "win32") {
    return pathApi.join(roots.runtime, "Augnes", "runtime", checkoutScope);
  }
  if (roots.runtime) return pathApi.join(roots.runtime, checkoutScope);
  return pathApi.join(roots.state, "augnes", "runtime", checkoutScope);
}

function resolveHomeDirectory({ environment, platform, pathApi, homeDirectory }) {
  const platformHome =
    platform === "win32"
      ? nonEmptyString(environment.USERPROFILE) ??
        (nonEmptyString(environment.HOMEDRIVE) && nonEmptyString(environment.HOMEPATH)
          ? `${environment.HOMEDRIVE}${environment.HOMEPATH}`
          : null) ??
        nonEmptyString(environment.HOME)
      : nonEmptyString(environment.HOME) ?? nonEmptyString(environment.USERPROFILE);
  const configured =
    nonEmptyString(homeDirectory) ??
    platformHome ??
    os.homedir();
  if (!pathApi.isAbsolute(configured)) {
    throw new PublicLocalPathError("home_path_invalid");
  }
  return pathApi.resolve(configured);
}

function resolveOptionalAbsolute(value, fallback, pathApi) {
  return value ? resolveRequiredAbsolute(value, pathApi) : pathApi.resolve(fallback);
}

function resolveRequiredAbsolute(value, pathApi) {
  if (!pathApi.isAbsolute(value)) throw new PublicLocalPathError("local_path_invalid");
  return pathApi.resolve(value);
}

function assertDirectoryIsNotSymlink(directory, invalidCode) {
  try {
    const stats = lstatSync(directory);
    if (!stats.isDirectory() || stats.isSymbolicLink()) {
      throw new PublicLocalPathError(invalidCode);
    }
  } catch (error) {
    if (error instanceof PublicLocalPathError) throw error;
    if (error?.code !== "ENOENT") throw new PublicLocalPathError(invalidCode);
  }
}

function directoryErrorCode(insideRepositoryCode) {
  if (insideRepositoryCode.startsWith("runtime_state_")) {
    return "runtime_state_directory_invalid";
  }
  return insideRepositoryCode.replace("_path_must_be_outside_repository", "_directory_invalid");
}

function removeCreatedEmptyDirectoryChain(directory, firstCreatedDirectory) {
  const boundary = path.resolve(firstCreatedDirectory);
  let current = path.resolve(directory);
  while (isInsideOrEqual(boundary, current)) {
    try {
      const stats = lstatSync(current);
      if (!stats.isDirectory() || stats.isSymbolicLink()) return;
      rmdirSync(current);
    } catch {
      return;
    }
    if (current === boundary) return;
    current = path.dirname(current);
  }
}

function isInsideOrEqual(root, candidate) {
  const relative = path.relative(path.resolve(root), path.resolve(candidate));
  return (
    relative === "" ||
    (relative !== ".." &&
      !relative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relative))
  );
}

function nonEmptyString(value) {
  return typeof value === "string" && value.length > 0 ? value : null;
}
