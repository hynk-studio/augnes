import { lstatSync, mkdirSync, readdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import path from "node:path";
import { assertCheckoutVerificationOwnership } from "./local-canonical-checkout-ownership.mjs";

const validId = id => /^[A-Za-z0-9_-]{1,160}$/u.test(id ?? "");
const fail = () => Object.assign(new Error("evidence_pin_invalid"), { code: "evidence_pin_invalid" });
function pinRoot(root, create = false) {
  const pins = path.join(root, ".augnes-local-verification", "pins");
  if (create) try { mkdirSync(pins, { mode: 0o700 }); } catch (e) { if (e.code !== "EEXIST") throw e; }
  let s; try { s = lstatSync(pins); } catch (e) { if (e.code === "ENOENT" && !create) return null; throw e; }
  if (!s.isDirectory() || s.isSymbolicLink() || realpathSync(pins) !== pins) throw fail();
  return pins;
}

export function pinVerificationEvidence({ root, checkoutOwner, runId, reason = "explicit_review" }) {
  assertCheckoutVerificationOwnership(checkoutOwner, root);
  if (!validId(runId) || !["explicit_review", "attempt_family"].includes(reason)) throw fail();
  const pins = pinRoot(root, true);
  writeFileSync(path.join(pins, `${runId}.json`), `${JSON.stringify({ schema: "augnes.local-canonical-evidence-pin.v1", run_id: runId, reason })}\n`, { flag: "wx", mode: 0o600 });
}

export function readPinnedEvidence(root) {
  const pins = pinRoot(root);
  if (!pins) return new Set();
  const ids = new Set();
  for (const name of readdirSync(pins)) {
    const id = name.replace(/\.json$/u, "");
    if (name !== `${id}.json` || !validId(id)) throw fail();
    const file = path.join(pins, name), s = lstatSync(file);
    if (!s.isFile() || s.isSymbolicLink() || s.nlink !== 1 || s.size > 2048) throw fail();
    const pin = JSON.parse(readFileSync(file, "utf8"));
    if (pin.schema !== "augnes.local-canonical-evidence-pin.v1" || pin.run_id !== id || !["explicit_review", "attempt_family"].includes(pin.reason)) throw fail();
    ids.add(id);
  }
  return ids;
}
