import { createHash } from "node:crypto";
import { constants, closeSync, fstatSync, lstatSync, openSync, opendirSync, readSync, readlinkSync, realpathSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

export const BROWSER_BUNDLE_CONTRACT = "augnes.local-canonical-browser-bundle.v1";
export const BROWSER_BUNDLE_LIMITS = Object.freeze({ entries: 4096, bytes: 1024 * 1024 * 1024, milliseconds: 15000, securityBytes: 8 * 1024 * 1024 });
const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === "object"
  ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
const hash = value => createHash("sha256").update(typeof value === "string" ? value : JSON.stringify(canonical(value))).digest("hex");
const fail = code => Object.assign(new Error(code), { code });
const metadata = s => Object.fromEntries(["mode", "uid", "gid", "dev", "ino", "nlink", "size", "mtimeNs", "ctimeNs"].map(key => [key, String(s[key])]));
const inside = (root, file) => file === root || file.startsWith(`${root}${path.sep}`);

// A complete enumeration is required on every poll. Only content hashing may
// reuse an earlier read, and only after the entire metadata/security inventory
// agrees. Settlement and stock always request force=true. No manifest is an
// authority to skip reading the selected bundle.
export function createBrowserBundleObserver(root) {
  let previous = null;
  return ({ force = false, afterRead = null } = {}) => {
    const started = performance.now();
    const deadline = () => { if (performance.now() - started > BROWSER_BUNDLE_LIMITS.milliseconds) throw fail("browser_bundle_observation_bound"); };
    const inventory = () => {
      if (!path.isAbsolute(root) || realpathSync(root) !== root || !lstatSync(root).isDirectory()) throw fail("browser_bundle_root_unsafe");
      const rows = [];
      let bytes = 0;
      const visit = relative => {
        deadline();
        if (rows.length >= BROWSER_BUNDLE_LIMITS.entries) throw fail("browser_bundle_inventory_bound");
        const file = path.join(root, relative), s = lstatSync(file, { bigint: true });
        const type = s.isSymbolicLink() ? "link" : s.isDirectory() ? "directory" : s.isFile() ? "file" : null;
        if (!type || (s.mode & 0o022n) !== 0n || (type === "file" && s.nlink !== 1n)) throw fail("browser_bundle_entry_unsafe");
        const row = { path: relative || ".", type, metadata: metadata(s) };
        if (type === "link") {
          row.target = readlinkSync(file);
          // realpath detects dangling links and cycles; traversal never follows
          // aliases, but each target must terminate inside this physical bundle.
          if (!row.target || path.isAbsolute(row.target) || /[\x00-\x1f\x7f]/u.test(row.target) || !inside(root, path.resolve(path.dirname(file), row.target)) || !inside(root, realpathSync(file))) throw fail("browser_bundle_link_escape");
        } else if (realpathSync(file) !== file) throw fail("browser_bundle_path_alias");
        rows.push(row);
        if (type === "file") {
          bytes += Number(s.size);
          if (!Number.isSafeInteger(bytes) || bytes > BROWSER_BUNDLE_LIMITS.bytes) throw fail("browser_bundle_byte_bound");
        }
        if (type === "directory") {
          const directory = opendirSync(file), names = [];
          try {
            let entry;
            while ((entry = directory.readSync()) !== null) {
              deadline();
              if (names.length + rows.length >= BROWSER_BUNDLE_LIMITS.entries) throw fail("browser_bundle_inventory_bound");
              if (!entry.name || /[\x00-\x1f\x7f]/u.test(entry.name)) throw fail("browser_bundle_name_unsafe");
              names.push(entry.name);
            }
          } finally { directory.closeSync(); }
          for (const name of names.sort()) visit(relative ? `${relative}/${name}` : name);
        }
      };
      visit("");
      return { rows, bytes };
    };
    const security = rows => {
      const result = [];
      let outputBytes = 0;
      const run = (tool, args) => {
        deadline();
        const output = execFileSync(tool, args, { timeout: Math.max(1, Math.min(2000, BROWSER_BUNDLE_LIMITS.milliseconds - (performance.now() - started))), maxBuffer: BROWSER_BUNDLE_LIMITS.securityBytes,
          encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], env: { PATH: "/usr/bin:/bin", LC_ALL: "C" } });
        outputBytes += Buffer.byteLength(output);
        if (outputBytes > BROWSER_BUNDLE_LIMITS.securityBytes) throw fail("browser_bundle_security_bound");
        return output;
      };
      for (let i = 0; i < rows.length; i += 64) {
        const files = rows.slice(i, i + 64).map(row => path.join(root, row.path));
        if (process.platform === "darwin") result.push(hash({ acl: run("/bin/ls", ["-lde", ...files]), flags: run("/usr/bin/stat", ["-f", "%f", ...files]), attributes: run("/usr/bin/xattr", ["-s", "-lx", ...files]) }));
        else if (process.platform === "linux") {
          const output = run("/bin/ls", ["-ld", "--", ...files]);
          if (output.split("\n").filter(Boolean).some(line => !/^[dl-][rwxstST-]{9} /u.test(line))) throw fail("browser_bundle_security_unknown");
          result.push(hash(output));
        } else throw fail("browser_bundle_platform_unsupported");
      }
      return hash(result);
    };
    const before = inventory(), permissions = security(before.rows);
    const inventoryHash = hash(before.rows);
    const cached = !force && previous?.inventory_sha256 === inventoryHash && previous?.permission_sha256 === permissions;
    const files = [];
    if (!cached) for (const row of before.rows.filter(row => row.type === "file")) {
      deadline();
      const file = path.join(root, row.path), fd = openSync(file, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
      try {
        if (hash(metadata(fstatSync(fd, { bigint: true }))) !== hash(row.metadata)) throw fail("browser_bundle_read_race");
        const digest = createHash("sha256"), buffer = Buffer.allocUnsafe(1024 * 1024);
        let count, total = 0;
        while ((count = readSync(fd, buffer, 0, buffer.length, null)) > 0) { deadline(); total += count; if (total > Number(row.metadata.size)) throw fail("browser_bundle_read_race"); digest.update(buffer.subarray(0, count)); }
        if (total !== Number(row.metadata.size) || hash(metadata(fstatSync(fd, { bigint: true }))) !== hash(row.metadata) || hash(metadata(lstatSync(file, { bigint: true }))) !== hash(row.metadata)) throw fail("browser_bundle_read_race");
        files.push({ path: row.path, sha256: digest.digest("hex") });
      } finally { closeSync(fd); }
    }
    // Test callers may induce a real filesystem race here; all normal checks
    // still run. There is no CLI/environment switch that disables observation.
    afterRead?.();
    const after = inventory(), finalPermissions = security(after.rows);
    deadline();
    if (hash(after.rows) !== inventoryHash || finalPermissions !== permissions) throw fail("browser_bundle_read_race");
    const observation = { contract: BROWSER_BUNDLE_CONTRACT, present: true, location_fingerprint: hash(root),
      inventory_sha256: inventoryHash, content_sha256: cached ? previous.content_sha256 : hash(files), permission_sha256: permissions,
      entries: before.rows.length, bytes: before.bytes };
    previous = observation;
    return { observation, inventory: before.rows, files: cached ? null : files, cost: { duration_ms: performance.now() - started, content_reused: cached } };
  };
}

export function validBrowserBundle(value) {
  return value?.contract === BROWSER_BUNDLE_CONTRACT && value.present === true &&
    ["location_fingerprint", "inventory_sha256", "content_sha256", "permission_sha256"].every(key => /^[0-9a-f]{64}$/u.test(value[key] ?? "")) &&
    Number.isInteger(value.entries) && value.entries > 0 && value.entries <= BROWSER_BUNDLE_LIMITS.entries && Number.isSafeInteger(value.bytes) && value.bytes > 0 && value.bytes <= BROWSER_BUNDLE_LIMITS.bytes;
}

export function compareBrowserBundle(before, after) {
  if (!validBrowserBundle(before) || !validBrowserBundle(after)) return "observer_failure";
  if (hash(before) === hash(after)) return "unchanged";
  // No inode/ctime/permission/topology change is incidental in the fixed lane.
  return before.location_fingerprint !== after.location_fingerprint || before.inventory_sha256 !== after.inventory_sha256 || before.permission_sha256 !== after.permission_sha256 ? "safety_violation" : "input_invalidation";
}
