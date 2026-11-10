import assert from "node:assert/strict";
import fs from "node:fs";
import childProcess from "node:child_process";
import { syncBuiltinESMExports } from "node:module";
import path from "node:path";

// Called only in the existing review-corrections owner's disposable child.
// Interpose at exact read boundaries; every filesystem mutation targets its
// owned fixture. The identical controls can import the retained earlier source.
export async function observerControls(root, moduleUrl) {
  const input = await import(moduleUrl);
  const findings = [];
  const cases = [
    ["link-before-open", "incidental"], ["link-during-read", "incidental"],
    ["unlink-during-read", "incidental"], ["ctime-only", "incidental"],
    ["links-both-reads", "incidental"], ["content", "fault"],
    ["content-masked-mtime", "fault"], ["replacement", "fault"],
    ["mode", "fault"], ["owner", "fault"], ["group", "fault"],
    ["missing-name", "diagnostic", "file_type", "input_unsafe_file"],
    ["named-stat-error", "diagnostic", "named_stat", "ENOENT"],
    ["stat-error", "diagnostic", "initial_stat", "EACCES"],
    ["reader-error", "diagnostic", "read", "EIO"],
    ["open-error", "diagnostic", "open", "EACCES"],
    ["descriptor-error", "diagnostic", "descriptor_stat", "EBADF"],
    ["close-error", "diagnostic", "close", "EIO"],
    ["confirmation-error", "diagnostic", "read", "EIO"],
    ["helper-error", "diagnostic", "permission_acl", "EACCES"],
    ["helper-timeout", "diagnostic", "permission_acl", "ETIMEDOUT"],
    ["helper-exit", "diagnostic", "permission_acl", "helper_exit_nonzero"],
    ["helper-unknown", "diagnostic", "permission_acl", "unclassified_error"],
    ["helper-format", "diagnostic", "permission_acl", "input_executable_permissions_unknown"],
    ["mutable-alias", "fault"],
    ...(process.platform === "darwin" ? [["acl", "fault"], ["attribute", "fault"], ["flags", "fault"],
      ["helper-flags-error", "diagnostic", "permission_flags", "EIO"],
      ["helper-attributes-error", "diagnostic", "permission_attributes", "EIO"]] : []),
  ];
  for (const [name, expected, stage, code] of cases) {
    const dir = path.join(root, name); fs.mkdirSync(dir);
    const file = path.join(dir, "executable"), alias = path.join(dir, "alias");
    fs.writeFileSync(file, "fixture executable\n", { mode: 0o700 });
    if (name === "unlink-during-read") fs.linkSync(file, alias);
    const role = { classification: "execution", ...(name === "mutable-alias" ? {} : { readOnlyExecutable: true }) };
    const contract = input.freezeInputContract({ resources: [{ id: "browser-executable", file, ...role }], pathKind: "isolated-model-free-v1", binding: {} });
    const baseline = contract.snapshot().resources[0].before;
    const originals = Object.fromEntries(["lstatSync", "openSync", "fstatSync", "readFileSync", "closeSync"].map(k => [k, fs[k]]));
    const originalExec = childProcess.execFileSync;
    let reads = 0, mutation = false, closes = 0;
    const descriptors = new Set();
    const secretError = value => Object.assign(new Error("private fixture path /private/observer-sentinel with raw output"), value);
    const transform = stat => {
      if (mutation && ["owner", "group", "content-masked-mtime"].includes(name)) {
        const copy = Object.assign(Object.create(Object.getPrototypeOf(stat)), stat);
        if (name === "owner") copy.uid += 1n;
        if (name === "group") copy.gid += 1n;
        if (name === "content-masked-mtime") copy.mtimeNs = BigInt(baseline.metadata.mtime_ns);
        return copy;
      }
      return stat;
    };
    try {
      fs.lstatSync = (p, ...args) => {
        if (p === file && name === "stat-error") throw secretError({ code: "EACCES" });
        if (p === file && name === "named-stat-error" && mutation) throw secretError({ code: "ENOENT" });
        return p === file ? transform(originals.lstatSync(p, ...args)) : originals.lstatSync(p, ...args);
      };
      fs.openSync = (p, ...args) => {
        if (p === file && name === "open-error") throw secretError({ code: "EACCES" });
        if (p === file && !mutation && ["link-before-open", "mutable-alias"].includes(name)) { fs.linkSync(file, alias); mutation = true; }
        const fd = originals.openSync(p, ...args); if (p === file) descriptors.add(fd); return fd;
      };
      fs.fstatSync = (fd, ...args) => {
        if (descriptors.has(fd) && name === "descriptor-error") throw secretError({ code: "EBADF" });
        return descriptors.has(fd) ? transform(originals.fstatSync(fd, ...args)) : originals.fstatSync(fd, ...args);
      };
      fs.closeSync = fd => {
        const owned = descriptors.delete(fd); if (owned) closes++;
        const result = originals.closeSync(fd);
        if (owned && name === "close-error") throw secretError({ code: "EIO" });
        return result;
      };
      fs.readFileSync = (fd, ...args) => {
        if (!descriptors.has(fd)) return originals.readFileSync(fd, ...args);
        reads++;
        if (name === "reader-error" || (name === "confirmation-error" && reads === 2)) throw secretError({ code: "EIO" });
        const bytes = originals.readFileSync(fd, ...args);
        if (reads === 1) {
          mutation = true;
          if (["link-during-read", "links-both-reads", "confirmation-error"].includes(name)) fs.linkSync(file, alias);
          if (name === "unlink-during-read") fs.rmSync(alias);
          if (name === "ctime-only") { fs.linkSync(file, alias); fs.rmSync(alias); }
          if (["content", "content-masked-mtime"].includes(name)) fs.writeFileSync(file, "changed executable\n");
          if (name === "replacement") { const next = path.join(dir, "next"); fs.writeFileSync(next, bytes, { mode: 0o700 }); fs.renameSync(next, file); }
          if (name === "mode") fs.chmodSync(file, 0o600);
          if (name === "missing-name") fs.rmSync(file);
          if (name === "acl") originalExec("/bin/chmod", ["+a", "everyone deny execute", file]);
          if (name === "attribute") originalExec("/usr/bin/xattr", ["-w", "augnes.disposable-control", "sentinel", file]);
          if (name === "flags") originalExec("/usr/bin/chflags", ["hidden", file]);
        } else if (reads === 2 && name === "links-both-reads") fs.linkSync(file, path.join(dir, "second-alias"));
        return bytes;
      };
      childProcess.execFileSync = (tool, args, ...options) => {
        if (args?.includes(file) && name.startsWith("helper-")) {
          if (name === "helper-format") return "unparseable fixture output";
          if (name === "helper-flags-error" || name === "helper-attributes-error") {
            if (tool === (name === "helper-flags-error" ? "/usr/bin/stat" : "/usr/bin/xattr")) throw secretError({ code: "EIO" });
          } else throw secretError(name === "helper-exit" ? { status: 1 } :
            { code: ({ "helper-error": "EACCES", "helper-timeout": "ETIMEDOUT", "helper-unknown": "RAW_PRIVATE_CODE" })[name] });
        }
        return originalExec(tool, args, ...options);
      };
      syncBuiltinESMExports();
      const fault = contract.check({ force: true }), snapshot = contract.snapshot();
      assert.equal(descriptors.size, 0, "all observation descriptors closed");
      assert(reads <= 2 && closes <= 2, "fixed read bound, no retries");
      if (expected === "incidental") {
        assert.equal(fault, null, "permitted incidental window must be completely observed");
        assert.equal(snapshot.events.length, 1);
        assert.equal(snapshot.events[0].disposition, "incidental_executable_metadata");
        assert.equal(snapshot.events[0].after.sha256, baseline.sha256);
        assert.equal(reads, 2, "both complete byte observations required");
      } else {
        assert.equal(fault?.disposition, "observer_failure", "unresolved window refuses");
        if (expected === "diagnostic") {
          assert.equal(fault.diagnostic?.stage, stage);
          assert.equal(fault.diagnostic?.code, code);
          assert.deepEqual(snapshot.events[0].diagnostic, fault.diagnostic);
          assert(!JSON.stringify(snapshot).includes("observer-sentinel"));
          assert(!JSON.stringify(snapshot).includes("RAW_PRIVATE_CODE"));
          if (name === "reader-error") assert.equal(reads, 1, "failed first read is never retried");
          if (name === "confirmation-error") assert.equal(reads, 2, "failed corroboration is never retried");
          if (name.startsWith("helper-")) assert.throws(() => input.observeInputFile(file, { readOnlyExecutable: true }), error =>
            error.code === code && error.message === code && !Object.hasOwn(error, "stdout") && !Object.hasOwn(error, "cause"));
        }
      }
      findings.push({ control: name, pass: true, reads, closes });
    } catch (error) { findings.push({ control: name, pass: false, assertion: error.code === "ERR_ASSERTION" ? "expectation_failed" : "fixture_failed", reads, closes }); }
    finally {
      Object.assign(fs, originals); childProcess.execFileSync = originalExec; syncBuiltinESMExports();
      for (const fd of descriptors) originals.closeSync(fd);
      if (name === "acl") originalExec("/bin/chmod", ["-N", file]);
      if (name === "flags") originalExec("/usr/bin/chflags", ["nohidden", file]);
      fs.rmSync(dir, { recursive: true, force: true }); assert(!fs.existsSync(dir));
    }
  }
  return findings;
}
