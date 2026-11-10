import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { closeSync, constants, fstatSync, lstatSync, openSync, realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const CHECKOUT_IDENTITY_CONTRACT = "augnes.darwin-checkout-identity.v1";
const helper = fileURLToPath(new URL("./checkout-identity-darwin.py", import.meta.url));
const fail = code => { throw Object.assign(new Error(code), { code }); };
const hash = value => createHash("sha256").update(value).digest("hex");
const decimal = value => typeof value === "string" && /^(0|[1-9][0-9]*)$/u.test(value);

export function validDurableCheckoutIdentity(value) {
  return value !== null && typeof value === "object" &&
    Object.keys(value).sort().join(",") === "birth_nanoseconds,birth_seconds,contract,filesystem,object_id,object_id_format,volume_uuid" &&
    value.contract === CHECKOUT_IDENTITY_CONTRACT &&
    ["apfs", "hfs"].includes(value.filesystem) &&
    typeof value.volume_uuid === "string" && /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/u.test(value.volume_uuid) &&
    value.volume_uuid !== "00000000-0000-0000-0000-000000000000" &&
    typeof value.object_id === "string" && /^[0-9a-f]{16}$/u.test(value.object_id) && value.object_id !== "0000000000000000" &&
    ["uint64", "fsobj_id_t"].includes(value.object_id_format) &&
    decimal(value.birth_seconds) && BigInt(value.birth_seconds) > 0n &&
    decimal(value.birth_nanoseconds) && BigInt(value.birth_nanoseconds) < 1_000_000_000n;
}

const sameObject = (a, b) => a.dev === b.dev && a.ino === b.ino && a.uid === b.uid && a.birthtimeNs === b.birthtimeNs;

// The descriptor pins the object across every attribute call. The path must
// still name it at both ends; a volume observation is never joined by pathname.
export function observeCheckoutIdentity(repositoryRoot) {
  return observe(repositoryRoot, true);
}

// Same-operation guard only. Never sufficient for enrollment/continuity.
export function observeCurrentCheckoutIdentity(repositoryRoot) {
  return observe(repositoryRoot, false);
}

function observe(repositoryRoot, readDurable) {
  if (typeof repositoryRoot !== "string" || !path.isAbsolute(repositoryRoot))
    fail("companion_service_repository_invalid");
  const lexical = path.resolve(repositoryRoot);
  const before = lstatSync(lexical, { bigint: true });
  if (!before.isDirectory() || before.isSymbolicLink()) fail("companion_service_repository_invalid");
  if (realpathSync(lexical) !== lexical) fail("companion_service_repository_alias_refused");
  let fd;
  try {
    fd = openSync(lexical, constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW);
    if (!sameObject(before, fstatSync(fd, { bigint: true }))) fail("companion_service_identity_observation_incoherent");
    let observation = { state: "unsupported" };
    if (readDurable && process.platform === "darwin") {
      try {
        const interpreter = lstatSync("/usr/bin/python3");
        const source = lstatSync(helper);
        if (!interpreter.isFile() || interpreter.isSymbolicLink() || interpreter.uid !== 0 || (interpreter.mode & 0o022) ||
            !source.isFile() || source.isSymbolicLink()) throw new Error();
        const result = spawnSync("/usr/bin/python3", ["-I", "-S", helper], {
          env: { PATH: "/usr/bin:/bin" }, encoding: "utf8", timeout: 2_000,
          maxBuffer: 2_048, stdio: ["ignore", "pipe", "ignore", fd],
        });
        const value = JSON.parse(result.stdout);
        if (result.status === 0 && value.state === "observed" && validDurableCheckoutIdentity(value.durable) &&
            BigInt(value.durable.birth_seconds) * 1_000_000_000n + BigInt(value.durable.birth_nanoseconds) === before.birthtimeNs &&
            value.device === String(before.dev) && value.inode === String(before.ino) && value.uid === Number(before.uid)) observation = value;
        else observation = { state: ["unsupported", "incoherent", "unavailable"].includes(value.state) ? value.state : "unavailable" };
      } catch { observation = { state: "unavailable" }; }
    }
    if (realpathSync(lexical) !== lexical || !sameObject(before, fstatSync(fd, { bigint: true })) ||
        !sameObject(before, lstatSync(lexical, { bigint: true }))) fail("companion_service_identity_observation_incoherent");
    return {
      realpath: lexical, repository_fingerprint: hash(lexical), device: String(before.dev), inode: String(before.ino),
      uid: String(before.uid), birthtime_ns: String(before.birthtimeNs),
      durable_observation: observation.state, durable_identity: observation.state === "observed" ? observation.durable : null,
    };
  } finally { if (fd !== undefined) closeSync(fd); }
}

// Persisted schema v1 has no historical durable witness. Exact legacy stat
// identity permits explicit stop/retirement, never automatic durable enrollment.
export function compareCompanionCheckoutIdentity(configuration, repository) {
  const pathMatches = configuration.repository_root === repository.realpath &&
    configuration.repository_fingerprint === repository.repository_fingerprint;
  const currentMatches = configuration.repository_device === repository.device && configuration.repository_inode === repository.inode;
  const comparisons = { canonical_path: configuration.repository_root === repository.realpath,
    path_fingerprint: configuration.repository_fingerprint === repository.repository_fingerprint,
    enrollment_device: decimal(configuration.repository_device) && decimal(repository.device) ? configuration.repository_device === repository.device : null,
    enrollment_inode: decimal(configuration.repository_inode) && decimal(repository.inode) ? configuration.repository_inode === repository.inode : null,
    volume: null, object: null, birth: null };
  const result = (valid, category, extra = {}) => ({ valid, category, comparisons, ...extra });
  if (!pathMatches) return result(false, "path_mismatch");
  if (configuration.schema_version === 1)
    return result(false, "legacy_evidence_insufficient", { legacy_exact: currentMatches });
  if (configuration.schema_version !== 2) return result(false, "durable_evidence_invalid");
  if (repository.durable_observation !== "observed")
    return result(false, ["unsupported", "unavailable", "incoherent"].includes(repository.durable_observation) ? repository.durable_observation : "unavailable");
  if (!decimal(configuration.repository_device) || !decimal(configuration.repository_inode) || configuration.repository_inode === "0" ||
      !validDurableCheckoutIdentity(configuration.repository_identity) || !validDurableCheckoutIdentity(repository.durable_identity))
    return result(false, "durable_evidence_invalid");
  comparisons.volume = configuration.repository_identity.volume_uuid === repository.durable_identity.volume_uuid && configuration.repository_identity.filesystem === repository.durable_identity.filesystem;
  comparisons.object = configuration.repository_identity.object_id === repository.durable_identity.object_id && configuration.repository_identity.object_id_format === repository.durable_identity.object_id_format;
  comparisons.birth = configuration.repository_identity.birth_seconds === repository.durable_identity.birth_seconds && configuration.repository_identity.birth_nanoseconds === repository.durable_identity.birth_nanoseconds;
  const keys = Object.keys(configuration.repository_identity);
  const valid = keys.every(key => configuration.repository_identity[key] === repository.durable_identity[key]);
  return result(valid, valid ? "durable_match" : "durable_mismatch", { current_stat_matches_enrollment: currentMatches });
}

// In-process ownership and preservation bind current observations too. This
// hash is not durable identity and must never be stored as an enrollment.
export function checkoutObservationBinding(repository) {
  return hash(JSON.stringify(repository));
}

export function currentCheckoutObservationBinding(repository) {
  return hash(JSON.stringify([repository.realpath, repository.repository_fingerprint, repository.device,
    repository.inode, repository.uid, repository.birthtime_ns]));
}
