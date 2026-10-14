#!/usr/bin/env node

import path from "node:path";
import { lstatSync, readFileSync, openSync, closeSync, constants, fstatSync, realpathSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  COMPANION_SERVICE_CONTRACT,
  installCompanionService,
  previewCompanionIdentityEnrollment,
  enrollCompanionIdentity,
  inspectCompanionService,
  lifecycleAuthority,
  publicCompanionServiceProjection,
  PublicCompanionServiceError,
  runCompanionServiceManager,
  selectSupportedNode24Binary,
  startCompanionService,
  stopCompanionService,
  uninstallCompanionService,
} from "../plugins/augnes-operator/mcp/companion-service-core.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");

export async function runCompanionServiceCli(argv = process.argv.slice(2)) {
  const [command, ...rest] = argv;
  try {
    let result;
    switch (command) {
      case "status":
        requireNoArguments(rest);
        result = publicCompanionServiceProjection(
          await inspectCompanionService(serviceOptions()),
        );
        break;
      case "install": {
        if (rest.length && !(rest.length === 1 && rest[0] === "--stopped")) requireNoArguments(rest);
        const node = selectSupportedNode24Binary();
        result = await installCompanionService({
          ...serviceOptions(),
          nodePath: node.path,
          start: rest[0] !== "--stopped",
        });
        break;
      }
      case "identity-preview":
        requireNoArguments(rest);
        result = previewCompanionIdentityEnrollment(serviceOptions());
        break;
      case "enroll-identity": {
        if (rest.length !== 1 || !path.isAbsolute(rest[0]))
          throw new PublicCompanionServiceError("companion_service_identity_decision_file_invalid");
        result = await enrollCompanionIdentity({ ...serviceOptions(), decision: readIdentityDecision(rest[0]) });
        break;
      }
      case "start":
        requireNoArguments(rest);
        result = await startCompanionService(serviceOptions());
        break;
      case "stop":
        requireNoArguments(rest);
        result = await stopCompanionService(serviceOptions());
        break;
      case "uninstall":
        requireNoArguments(rest);
        result = await uninstallCompanionService(serviceOptions());
        break;
      case "run": {
        if (rest.length !== 2 || rest[0] !== "--config" || !path.isAbsolute(rest[1])) {
          throw new PublicCompanionServiceError(
            "companion_service_configuration_argument_invalid",
          );
        }
        return runCompanionServiceManager({ configurationPath: rest[1] });
      }
      default:
        throw new PublicCompanionServiceError(
          "companion_service_command_invalid",
        );
    }
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return 0;
  } catch (error) {
    const reason = error instanceof PublicCompanionServiceError
      ? error.code
      : "companion_service_internal_error";
    process.stderr.write(`${JSON.stringify({
      contract: COMPANION_SERVICE_CONTRACT,
      result: "refused",
      reason,
      ...(error instanceof PublicCompanionServiceError && error.cleanup_failed === true ? { cleanup_failed: true } : {}),
      authority: lifecycleAuthority(false),
    })}\n`);
    return 1;
  }
}

function serviceOptions() {
  return {
    repositoryRoot,
    environment: process.env,
    testScope: process.env.AUGNES_COMPANION_SERVICE_TEST_SCOPE ?? null,
  };
}

function requireNoArguments(args) {
  if (args.length !== 0) {
    throw new PublicCompanionServiceError("companion_service_arguments_refused");
  }
}

function readIdentityDecision(file) {
  let fd;
  const invalid = () => new PublicCompanionServiceError("companion_service_identity_decision_file_invalid");
  try {
    if (realpathSync(file) !== path.resolve(file)) throw invalid();
    fd = openSync(file, constants.O_RDONLY | constants.O_NOFOLLOW);
    const stat = fstatSync(fd);
    if (!stat.isFile() || stat.nlink !== 1 || stat.size > 4096 || stat.uid !== process.getuid() || (stat.mode & 0o077)) throw invalid();
    const text = readFileSync(fd, "utf8"), after = lstatSync(file), opened = fstatSync(fd);
    if (after.isSymbolicLink() || [after, opened].some(value => value.dev !== stat.dev || value.ino !== stat.ino || value.size !== stat.size || value.mtimeMs !== stat.mtimeMs || value.ctimeMs !== stat.ctimeMs)) throw invalid();
    return JSON.parse(text);
  } catch { throw invalid(); }
  finally { if (fd !== undefined) closeSync(fd); }
}

if (
  Boolean(process.argv[1]) &&
  pathToFileURL(process.argv[1]).href === import.meta.url
) {
  process.exitCode = await runCompanionServiceCli();
}
