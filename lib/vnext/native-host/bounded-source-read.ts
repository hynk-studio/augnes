import { closeSync, constants, fstatSync, lstatSync, openSync, readSync, realpathSync } from "node:fs";

function fail(): never { throw new Error("bounded_source_unavailable_or_changed"); }

/** Shared bounded regular-file reader. No commands, providers or hidden state. */
export function readBoundedLocalSourceBytes(filename: string, limit = 128 * 1024): Buffer {
  let fd: number | undefined;
  try {
    // Reject the opened object without waiting for a writer if a FIFO is
    // supplied or replaces an approved path before this open.
    fd = openSync(filename, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
    const stat = fstatSync(fd);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || stat.size > limit || realpathSync(filename) !== filename)
      fail();
    const buffer = Buffer.alloc(limit + 1); let length = 0;
    while (length < buffer.length) {
      const count = readSync(fd, buffer, length, buffer.length - length, null);
      if (!count) break;
      length += count;
    }
    if (length > limit) fail();
    const bytes = buffer.subarray(0, length);
    const after = fstatSync(fd), named = lstatSync(filename);
    if (bytes.length !== stat.size || stat.dev !== named.dev || stat.ino !== named.ino || named.isSymbolicLink() ||
        stat.size !== after.size || stat.mtimeMs !== after.mtimeMs || stat.ctimeMs !== after.ctimeMs) fail();
    return bytes;
  } catch { return fail(); }
  finally { if (fd !== undefined) closeSync(fd); }
}
