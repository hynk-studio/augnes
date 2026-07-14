import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createServer, request as httpRequest } from "node:http";

const LOOPBACK_HOST = "127.0.0.1";
const OWNERSHIP_PATH = "/v1/ownership";
const OWNERSHIP_HEADER = "x-augnes-local-owner";
const REQUEST_TIMEOUT_MS = 1_000;
const MAX_RESPONSE_BYTES = 16 * 1024;

export async function startPrivateProcessOwnershipProbe({
  contract,
  schemaVersion,
  repositoryFingerprint,
  ownershipId,
  ownershipNonce,
} = {}) {
  const processOwner = readProcessBirthIdentity(process.pid);
  if (processOwner.state !== "present") {
    throw new Error("local_process_identity_unavailable");
  }
  const probeToken = randomBytes(32).toString("hex");
  const ownershipBinding = ownershipBindingFor({
    contract,
    schemaVersion,
    repositoryFingerprint,
    ownershipId,
    ownerPid: process.pid,
    ownerProcessIdentity: processOwner.identity,
    ownershipNonce,
    probeToken,
  });
  const responseBody = {
    ownership_verified: true,
    contract,
    schema_version: schemaVersion,
    repository_fingerprint: repositoryFingerprint,
    ownership_id: ownershipId,
    owner_pid: process.pid,
    owner_process_identity: processOwner.identity,
    ownership_binding: ownershipBinding,
  };
  const server = createServer((request, response) => {
    if (
      request.method !== "GET" ||
      request.url !== OWNERSHIP_PATH ||
      !constantTimeEqual(request.headers[OWNERSHIP_HEADER], probeToken)
    ) {
      response.writeHead(403, { "content-type": "application/json" });
      response.end('{"ownership_verified":false}\n');
      return;
    }
    response.writeHead(200, { "content-type": "application/json" });
    response.end(`${JSON.stringify(responseBody)}\n`);
  });
  const probePort = await listen(server);
  let closed = false;
  return {
    ownerProcessIdentity: processOwner.identity,
    probePort,
    probeToken,
    ownershipBinding,
    async close() {
      if (closed) return;
      closed = true;
      server.closeAllConnections?.();
      await new Promise((resolve) => {
        if (!server.listening) return resolve();
        server.close(() => resolve());
      });
    },
  };
}

export async function classifyPrivateProcessOwnership({
  contract,
  schemaVersion,
  repositoryFingerprint,
  ownershipId,
  ownerPid,
  ownerProcessIdentity,
  probePort,
  probeToken,
  ownershipBinding,
} = {}) {
  if (
    !validOwnershipDescriptor({
      contract,
      schemaVersion,
      repositoryFingerprint,
      ownershipId,
      ownerPid,
      ownerProcessIdentity,
      probePort,
      probeToken,
      ownershipBinding,
    })
  ) {
    return "ownership_unverifiable";
  }
  const expected = {
    contract,
    schema_version: schemaVersion,
    repository_fingerprint: repositoryFingerprint,
    ownership_id: ownershipId,
    owner_pid: ownerPid,
    owner_process_identity: ownerProcessIdentity,
    ownership_binding: ownershipBinding,
  };
  const proof = await requestOwnershipProof({ probePort, probeToken }).catch(
    () => null,
  );
  if (
    proof?.ownership_verified === true &&
    Object.entries(expected).every(([key, value]) => proof[key] === value)
  ) {
    return "verified_live";
  }

  const currentOwner = readProcessBirthIdentity(ownerPid);
  if (currentOwner.state === "missing") return "stale";
  if (
    currentOwner.state === "present" &&
    currentOwner.identity !== ownerProcessIdentity
  ) {
    return "stale";
  }
  return "ownership_unverifiable";
}

export function readProcessBirthIdentity(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return { state: "missing" };
  if (process.platform === "linux") return readLinuxProcessIdentity(pid);
  if (process.platform === "win32") return readWindowsProcessIdentity(pid);
  return readPosixProcessIdentity(pid);
}

export function validPrivateProcessOwnershipFields({
  ownerProcessIdentity,
  probePort,
  probeToken,
  ownershipBinding,
} = {}) {
  return (
    typeof ownerProcessIdentity === "string" &&
    /^[0-9a-f]{64}$/.test(ownerProcessIdentity) &&
    Number.isInteger(probePort) &&
    probePort > 0 &&
    probePort <= 65_535 &&
    typeof probeToken === "string" &&
    probeToken.length >= 64 &&
    typeof ownershipBinding === "string" &&
    /^[0-9a-f]{64}$/.test(ownershipBinding)
  );
}

function readLinuxProcessIdentity(pid) {
  try {
    const bootIdentity = readFileSync("/proc/sys/kernel/random/boot_id", "utf8").trim();
    const stat = readFileSync(`/proc/${pid}/stat`, "utf8");
    const commandEnd = stat.lastIndexOf(")");
    if (!bootIdentity || commandEnd < 0) return processIdentityFallback(pid);
    const fields = stat.slice(commandEnd + 2).trim().split(/\s+/);
    const startTicks = fields[19];
    if (!/^\d+$/.test(startTicks ?? "")) return processIdentityFallback(pid);
    return {
      state: "present",
      identity: opaqueIdentity(`linux:${bootIdentity}:${pid}:${startTicks}`),
    };
  } catch (error) {
    if (error?.code === "ENOENT" || error?.code === "ESRCH") {
      return { state: "missing" };
    }
    return processIdentityFallback(pid);
  }
}

function readPosixProcessIdentity(pid) {
  const result = spawnSync("/bin/ps", ["-o", "lstart=", "-p", String(pid)], {
    encoding: "utf8",
    timeout: 1_500,
    windowsHide: true,
  });
  const startedAt = result.status === 0 ? result.stdout.trim() : "";
  if (startedAt) {
    return {
      state: "present",
      identity: opaqueIdentity(`${process.platform}:${pid}:${startedAt}`),
    };
  }
  return processIdentityFallback(pid);
}

function readWindowsProcessIdentity(pid) {
  const result = spawnSync(
    "powershell.exe",
    [
      "-NoProfile",
      "-NonInteractive",
      "-Command",
      `(Get-Process -Id ${pid} -ErrorAction Stop).StartTime.ToUniversalTime().Ticks`,
    ],
    { encoding: "utf8", timeout: 1_500, windowsHide: true },
  );
  const creationTicks = result.status === 0 ? result.stdout.trim() : "";
  if (/^\d+$/.test(creationTicks)) {
    return {
      state: "present",
      identity: opaqueIdentity(`win32:${pid}:${creationTicks}`),
    };
  }
  return processIdentityFallback(pid);
}

function processIdentityFallback(pid) {
  try {
    process.kill(pid, 0);
    return { state: "unavailable" };
  } catch (error) {
    return error?.code === "ESRCH"
      ? { state: "missing" }
      : { state: "unavailable" };
  }
}

function ownershipBindingFor({
  contract,
  schemaVersion,
  repositoryFingerprint,
  ownershipId,
  ownerPid,
  ownerProcessIdentity,
  ownershipNonce,
  probeToken,
}) {
  return opaqueIdentity(
    JSON.stringify([
      contract,
      schemaVersion,
      repositoryFingerprint,
      ownershipId,
      ownerPid,
      ownerProcessIdentity,
      ownershipNonce,
      probeToken,
    ]),
  );
}

function validOwnershipDescriptor(value) {
  return (
    typeof value.contract === "string" &&
    value.contract.length > 0 &&
    Number.isInteger(value.schemaVersion) &&
    value.schemaVersion > 0 &&
    typeof value.repositoryFingerprint === "string" &&
    value.repositoryFingerprint.length > 0 &&
    typeof value.ownershipId === "string" &&
    value.ownershipId.length > 0 &&
    Number.isInteger(value.ownerPid) &&
    value.ownerPid > 0 &&
    validPrivateProcessOwnershipFields(value)
  );
}

function requestOwnershipProof({ probePort, probeToken }) {
  return new Promise((resolve, reject) => {
    const request = httpRequest(
      {
        host: LOOPBACK_HOST,
        port: probePort,
        path: OWNERSHIP_PATH,
        method: "GET",
        headers: { [OWNERSHIP_HEADER]: probeToken },
        agent: false,
      },
      (response) => {
        response.setEncoding("utf8");
        let body = "";
        response.on("data", (chunk) => {
          body += chunk;
          if (body.length > MAX_RESPONSE_BYTES) request.destroy();
        });
        response.on("end", () => {
          try {
            resolve(response.statusCode === 200 ? JSON.parse(body) : null);
          } catch (error) {
            reject(error);
          }
        });
      },
    );
    request.setTimeout(REQUEST_TIMEOUT_MS, () => request.destroy());
    request.once("error", reject);
    request.end();
  });
}

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen({ host: LOOPBACK_HOST, port: 0, exclusive: true }, () => {
      server.removeListener("error", reject);
      resolve(server.address().port);
    });
  });
}

function opaqueIdentity(value) {
  return createHash("sha256").update(value).digest("hex");
}

function constantTimeEqual(left, right) {
  if (typeof left !== "string" || typeof right !== "string") return false;
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}
