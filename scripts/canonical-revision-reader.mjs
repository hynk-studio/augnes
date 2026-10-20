import { spawnSync } from "node:child_process";
import { isUtf8 } from "node:buffer";
import { createHash } from "node:crypto";
import path from "node:path";

// Internal, operation-local reads, never an admission cache. Callers still
// admit their exact commits and the validator still independently replans.
const SHA = /^[0-9a-f]{40}$/u;
const MAX_BYTES = 8 * 1024 * 1024;
const MAX_BATCH_OBJECTS = 128;
const MAX_FRAMING_BYTES = MAX_BATCH_OBJECTS * 80;
const MAX_CACHED_BLOB_BYTES = 2 * MAX_BYTES;

export function createCanonicalRevisionReader(cwd) {
  const root = path.resolve(cwd);
  const trees = new Map();
  const blobs = new Map();
  let cachedBytes = 0;

  function tree(revision) {
    if (!SHA.test(revision)) throw new Error("canonical revision reader requires an exact SHA");
    if (trees.has(revision)) {
      const entries = trees.get(revision);
      trees.delete(revision);
      trees.set(revision, entries);
      return entries;
    }
    // Include real directory entries; a directory link is not a missing blob.
    // -l supplies object sizes so batches can be bounded before reading content.
    const output = git(root, ["ls-tree", "-r", "-t", "-l", "-z", "--full-tree", revision]);
    const entries = new Map();
    // A decoded lookup key must retain the literal Git path's byte identity.
    // Reject invalid encodings before publishing any entries; a genuine UTF-8
    // U+FFFD filename remains valid and distinct from replacement decoding.
    if (!isUtf8(output)) throw new Error("canonical revision tree contains non-UTF-8 path bytes");
    if (output.length && output.at(-1) !== 0) throw new Error("malformed canonical revision tree");
    for (const row of output.toString("utf8").split("\0").filter(Boolean)) {
      const match = row.match(/^(\d{6}) (blob|tree|commit) ([0-9a-f]{40}) +(-|0|[1-9]\d*)\t([\s\S]+)$/u);
      if (!match) throw new Error("malformed canonical revision tree");
      const [, mode, type, oid, sizeText, file] = match;
      const size = sizeText === "-" ? null : Number(sizeText);
      if (Buffer.byteLength(file) > 4096 || entries.has(file) ||
          file.split("/").some(part => !part || part === "." || part === "..") ||
          !(type === "blob" ? ["100644", "100755", "120000"].includes(mode) &&
            Number.isSafeInteger(size) && size >= 0 :
            size === null && mode === (type === "tree" ? "040000" : "160000"))) {
        throw new Error("malformed canonical revision tree");
      }
      entries.set(file, Object.freeze({ mode, type, oid, size }));
    }
    // Only the two working revisions normally coexist. Historical references
    // can be reread without an unbounded collection of retained trees.
    if (trees.size === 2) trees.delete(trees.keys().next().value);
    trees.set(revision, entries);
    return entries;
  }

  function remember(oid, bytes) {
    if (blobs.has(oid)) return;
    while (cachedBytes + bytes.length > MAX_CACHED_BLOB_BYTES) {
      const key = blobs.keys().next().value;
      cachedBytes -= blobs.get(key).length;
      blobs.delete(key);
    }
    blobs.set(oid, bytes);
    cachedBytes += bytes.length;
  }

  function load(objects) {
    const input = objects.map(object => object.oid + "\n").join("");
    const output = git(root, ["cat-file", "--batch"], {
      input, maxBuffer: MAX_BYTES + MAX_FRAMING_BYTES,
    });
    // Publish no part of a malformed batch, including a valid prefix.
    const contents = parseCanonicalBlobBatch(output, objects);
    for (let i = 0; i < objects.length; i++) remember(objects[i].oid, contents[i]);
  }

  function prefetch(requests) {
    let batch = [], bytes = 0;
    const pending = new Set();
    for (const { revision, file } of requests) {
      const entry = tree(revision).get(file);
      // Prefetch is optional. Preserve lazy missing/non-blob/oversize errors
      // at the actual read, rather than inventing obligations for a hint.
      if (!entry || entry.type !== "blob" || entry.size > MAX_BYTES ||
          blobs.has(entry.oid) || pending.has(entry.oid)) continue;
      if (batch.length === MAX_BATCH_OBJECTS || bytes + entry.size > MAX_BYTES) {
        load(batch);
        batch = []; bytes = 0;
      }
      batch.push(entry); bytes += entry.size; pending.add(entry.oid);
    }
    if (batch.length) load(batch);
  }

  function read(revision, file, maxBytes = MAX_BYTES) {
    if (!Number.isSafeInteger(maxBytes) || maxBytes < 0 || maxBytes > MAX_BYTES) {
      throw new Error("invalid canonical revision read bound");
    }
    const entry = tree(revision).get(file);
    if (!entry) throw new Error(`git show failed: missing path ${file}`);
    if (entry.type !== "blob") {
      // Preserve git show's existing tree/gitlink presentation when a caller
      // explicitly reads one (ordinary existence checks need no content).
      return git(root, ["show", `${revision}:${file}`], { maxBuffer: maxBytes }).toString("utf8");
    }
    if (entry.size > maxBytes) throw new Error("canonical revision blob exceeds the bounded input size");
    if (!blobs.has(entry.oid)) load([entry]);
    const bytes = blobs.get(entry.oid);
    blobs.delete(entry.oid); blobs.set(entry.oid, bytes);
    return bytes.toString("utf8");
  }

  return { tree, prefetch, read };
}

// Byte-oriented framing: blobs can contain NULs, newlines and header-like text.
// Bind the response's identity, type, size AND Git object hash to the exact
// requested tree entry. Missing, extra, truncated and reordered records refuse.
export function parseCanonicalBlobBatch(output, objects) {
  if (!Buffer.isBuffer(output) || output.length > MAX_BYTES + MAX_FRAMING_BYTES ||
      !Array.isArray(objects) || !objects.length || objects.length > MAX_BATCH_OBJECTS ||
      new Set(objects.map(object => object.oid)).size !== objects.length ||
      objects.some(object => !SHA.test(object.oid) || object.type !== "blob" ||
        !Number.isSafeInteger(object.size) || object.size < 0 || object.size > MAX_BYTES) ||
      objects.reduce((total, object) => total + object.size, 0) > MAX_BYTES) {
    throw new Error("invalid canonical blob batch bounds");
  }
  let offset = 0;
  const contents = [];
  for (const { oid, size } of objects) {
    const header = Buffer.from(`${oid} blob ${size}\n`);
    if (!output.subarray(offset, offset + header.length).equals(header)) {
      throw new Error("canonical blob batch identity mismatch");
    }
    offset += header.length;
    const bytes = output.subarray(offset, offset + size);
    offset += size;
    if (bytes.length !== size || output[offset++] !== 10) {
      throw new Error("canonical blob batch truncated payload");
    }
    const actual = createHash("sha1").update(`blob ${size}\0`).update(bytes).digest("hex");
    if (actual !== oid) throw new Error("canonical blob batch content mismatch");
    contents.push(Buffer.from(bytes));
  }
  if (offset !== output.length) throw new Error("canonical blob batch trailing data");
  return contents;
}

function git(cwd, args, options = {}) {
  const result = spawnSync("git", args, {
    cwd, stdio: ["pipe", "pipe", "pipe"], timeout: 30_000,
    maxBuffer: MAX_BYTES, ...options,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`git ${args[0]} failed: ${result.stderr?.toString("utf8").trim() || `exit ${result.status}`}`);
  }
  return result.stdout;
}
