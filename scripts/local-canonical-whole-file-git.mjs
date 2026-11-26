import { digest, gitTrackingProjection } from "./local-canonical-inputs.mjs";

export const WHOLE_FILE_GIT_REVISION = "whole-file-git-email-insertion-v1";
export const WHOLE_FILE_GIT_GRANT = "Authorize one prospective Mac qualification after this whole-file Git input invalidation.";
export const WHOLE_FILE_GIT_HISTORY = "Original whole-file invalidation, complete false stock and spent invocation stand. Historical branch scope, extended permissions and writer are unknown.";
export const isWholeFileGitRevision = proof => proof?.schema === "augnes.local-canonical-source-correction.v10" &&
  proof.kind === "reviewed_revision" && proof.commission?.input_revision === WHOLE_FILE_GIT_REVISION;

const maxConfigBytes = 1024 * 1024;
const fail = code => { throw Object.assign(new Error(code), { code }); };
const keys = (value, expected) => value && Object.keys(value).sort().join(",") === expected;
const sha = value => typeof value === "string" && /^[a-f0-9]{64}$/u.test(value);

// No extended permission or branch projection existed in this historical role.
export function wholeFileGitObservation(value) {
  const meta = value?.metadata;
  return keys(value, "metadata,present,sha256") && value.present === true && sha(value.sha256) &&
    keys(meta, "bytes,ctime_ns,device,gid,inode,links,mode,mtime_ns,uid") &&
    Object.values(meta).every(v => typeof v === "string" && /^\d{1,40}$/u.test(v)) &&
    meta.links === "1" && (BigInt(meta.mode) & 0o170022n) === 0o100000n && BigInt(meta.bytes) <= maxConfigBytes;
}

const verifierOwner = "scripts/local-canonical-whole-file-git.mjs";
const adoptedOwners = new Set([verifierOwner, "scripts/local-canonical-inputs.mjs",
  "scripts/local-canonical-git-observation.mjs", "scripts/local-canonical-attempts.mjs",
  "scripts/run-local-canonical-verification.mjs", "scripts/local-canonical-receipt.mjs",
  "scripts/local-canonical-browser-identity.mjs", "scripts/local-canonical-browser-revision.mjs",
  "scripts/github-main-branch-transport.mjs", "scripts/local-canonical-verification-context.mjs",
  "scripts/local-canonical-environment.mjs",
  "scripts/prepare-local-canonical-material-source.mjs", ".github/LOCAL_CANONICAL_VERIFICATION.md"]);

export function verifyWholeFileGitRemedy(proof, incident, current, source, witness, { privateBytes, git }) {
  if (!keys(witness, "insertion_offset,insertion_sha256,postimage,stock_capture") ||
      !sha(witness.insertion_sha256) || !Number.isSafeInteger(witness.insertion_offset) ||
      !current.gitTracking?.protected_branches?.includes(digest(proof.branch)) ||
      !current.before.git_projection?.applicable ||
      source.main_to_final.paths.some(name => adoptedOwners.has(name)))
    fail("revision_whole_file_git_remedy_invalid");
  // The route must already exist on the independently published main base.
  if (git(["cat-file", "-t", proof.base + ":" + verifierOwner]).toString().trim() !== "blob")
    fail("revision_whole_file_git_verifier_unadopted");
  const before = incident.config.before, after = incident.change.after;
  const archived = privateBytes(witness.postimage, maxConfigBytes);
  const start = witness.insertion_offset, length = archived.length - Number(before.metadata.bytes), end = start + length;
  if (witness.postimage.sha256 !== after.sha256 || digest(archived) !== after.sha256 ||
      archived.length !== Number(after.metadata.bytes) || length <= 0 || start < 0 || end > archived.length ||
      (start > 0 && archived[start - 1] !== 10)) fail("revision_whole_file_git_delta_invalid");
  const inserted = archived.subarray(start, end);
  const original = Buffer.concat([archived.subarray(0, start), archived.subarray(end)]);
  // Only a complete, plain [user] section at a section boundary. The common
  // projection below also rejects continuations, includes and ambiguous syntax.
  const section = /^[ \t]*\[user\][ \t]*\r?\n[ \t]*email[ \t]*=[ \t]*(?:"[^\x00-\x20"\\]+"|[^\x00-\x20"#;\\]+)[ \t]*(?:\r?\n)?$/iu;
  const suffix = archived.subarray(end).toString("utf8");
  const nextSectionOrEnd = /^(?:[ \t]*(?:[#;][^\r\n]*)?\r?\n)*(?:[ \t]*\[|[ \t]*(?:[#;][^\r\n]*)?$)/u;
  if (!section.test(inserted.toString("utf8")) || digest(inserted) !== witness.insertion_sha256 ||
      digest(original) !== before.sha256 ||
      (suffix && (archived[end - 1] !== 10 || !nextSectionOrEnd.test(suffix))))
    fail("revision_whole_file_git_delta_invalid");
  const branches = current.gitTracking.protected_branches;
  const projectedAfter = gitTrackingProjection(archived, branches);
  const projectedBefore = gitTrackingProjection(original, branches);
  if (projectedAfter === null || projectedBefore === null || projectedAfter !== current.before.git_projection.effective_sha256 ||
      projectedBefore === projectedAfter ||
      ["device","uid","gid","mode","links"].some(key => current.before.metadata[key] !== after.metadata[key]))
    fail("revision_whole_file_git_current_drift");
}
