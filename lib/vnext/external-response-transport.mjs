import {
  constants,
  openSync,
  fstatSync,
  readFileSync,
  closeSync,
} from "node:fs";
import path from "node:path";
import {
  digest,
  keys,
  text,
  time,
  integer,
  ref,
  fail,
  EXTERNAL_VERSION,
} from "./external-response-rules.mjs";
export function readExternalConfiguration() {
  const file = process.env.AUGNES_EXTERNAL_CONFIG_FILE;
  let fd;
  if (!file) fail("external_not_configured", 503);
  try {
    if (!path.isAbsolute(file)) throw new Error();
    fd = openSync(file, constants.O_RDONLY | constants.O_NOFOLLOW);
    const st = fstatSync(fd);
    if (
      !st.isFile() ||
      st.nlink !== 1 ||
      st.mode & 0o077 ||
      st.uid !== process.getuid?.() ||
      st.size > 32768
    )
      throw new Error();
    const c = JSON.parse(readFileSync(fd, "utf8"));
    keys(c, ["version", "projects", "envelopes"]);
    if (
      c.version !== EXTERNAL_VERSION ||
      !Array.isArray(c.projects) ||
      c.projects.length > 16 ||
      !Array.isArray(c.envelopes) ||
      c.envelopes.length > 8
    )
      throw new Error();
    const seen = new Set();
    for (const p of c.projects) {
      keys(p, ["repository_root", "project_key", "share_to"]);
      if (!path.isAbsolute(p.repository_root) || seen.has(p.project_key))
        throw new Error();
      ref(p.project_key);
      seen.add(p.project_key);
      if (!Array.isArray(p.share_to) || p.share_to.length > 16)
        throw new Error();
      p.share_to.forEach(ref);
    }
    const ids = new Set();
    for (const e of c.envelopes) {
      keys(e, [
        "id",
        "project_keys",
        "endpoint",
        "instance",
        "secret",
        "expires_at",
        "max_calls",
        "max_amendments",
        "max_input_bytes",
        "timeout_ms",
        "input_sha256",
      ]);
      text(e.id, 100);
      text(e.instance, 100);
      if (ids.has(e.id)) throw new Error();
      ids.add(e.id);
      if (
        !Array.isArray(e.project_keys) ||
        !e.project_keys.length ||
        e.project_keys.some((k) => !seen.has(k)) ||
        !/^[A-Za-z0-9_-]{43}$/.test(e.secret)
      )
        throw new Error();
      const u = new URL(e.endpoint);
      if (
        u.protocol !== "http:" ||
        u.hostname !== "127.0.0.1" ||
        u.origin !== e.endpoint ||
        !u.port ||
        u.username ||
        u.password
      )
        throw new Error();
      time(e.expires_at);
      integer(e.max_calls, 1, 64);
      integer(e.max_amendments, 0, 3);
      integer(e.max_input_bytes, 1, 1048576);
      integer(e.timeout_ms, 50, 10000);
      if (
        !Array.isArray(e.input_sha256) ||
        !e.input_sha256.length ||
        e.input_sha256.length > 32
      )
        throw new Error();
      e.input_sha256.forEach(ref);
      e.binding = digest(e);
    }
    return c;
  } catch {
    fail("external_configuration_unavailable", 503);
  } finally {
    if (fd !== undefined) closeSync(fd);
  }
}
export function currentEnvelope(id, binding, projectKey) {
  const e = readExternalConfiguration().envelopes.find(
    (e) =>
      e.id === id &&
      e.binding === binding &&
      e.project_keys.includes(projectKey),
  );
  if (!e || Date.parse(e.expires_at) <= Date.now())
    fail("external_permission_unavailable", 403);
  return e;
}
export async function contactProcessor(e, attempt, input, reconcile) {
  const controller = new AbortController(),
    timer = setTimeout(() => controller.abort(), e.timeout_ms);
  try {
    const url = new URL(`/requests/${attempt.ref.slice(7)}`, e.endpoint);
    const r = await fetch(url, {
      method: reconcile ? "GET" : "POST",
      redirect: "error",
      signal: controller.signal,
      headers: {
        authorization: `Bearer ${e.secret}`,
        "content-type": "application/json",
        "x-input-ref": attempt.payload.input_ref,
        "x-terms-ref": digest(attempt.payload.terms),
      },
      ...(reconcile
        ? {}
        : {
            body: JSON.stringify({
              version: EXTERNAL_VERSION,
              instance: e.instance,
              request_ref: attempt.ref,
              input_ref: attempt.payload.input_ref,
              terms: attempt.payload.terms,
              material: { metadata: input.metadata, base64: input.base64 },
            }),
          }),
    });
    if (!r.ok) fail("external_counterpart_unavailable", 503);
    const reader = r.body.getReader(),
      chunks = [];
    let n = 0;
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        n += value.length;
        if (n > 100000) {
          await reader.cancel();
          fail("external_response_out_of_bounds");
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
    return JSON.parse(Buffer.concat(chunks).toString());
  } catch {
    fail("external_effect_unresolved", 503);
  } finally {
    clearTimeout(timer);
  }
}
