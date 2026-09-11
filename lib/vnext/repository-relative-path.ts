import path from "node:path";

import type { ExternalRefV01 } from "@/types/vnext/external-ref";

const MAX_REPOSITORY_RELATIVE_PATH_LENGTH = 4096;
const WINDOWS_DRIVE_QUALIFIED = /^[a-zA-Z]:/u;
const REPOSITORY_RELATIVE_REF_TYPES = new Set([
  "repository_relative_artifact",
  "repository_relative_path",
]);

export class RepositoryRelativePathErrorV01 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "RepositoryRelativePathErrorV01";
  }
}

export function canonicalizeRepositoryRelativePathV01(value: string): string {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > MAX_REPOSITORY_RELATIVE_PATH_LENGTH ||
    value.includes("\0") ||
    hasRootOrDriveV01(value)
  ) {
    invalidRepositoryRelativePath();
  }

  const normalized = path.posix.normalize(value.replaceAll("\\", "/"));
  if (
    normalized.length === 0 ||
    normalized.length > MAX_REPOSITORY_RELATIVE_PATH_LENGTH ||
    normalized === "." ||
    normalized === ".." ||
    normalized.startsWith("../") ||
    hasRootOrDriveV01(normalized)
  ) {
    invalidRepositoryRelativePath();
  }
  return normalized;
}

export function externalRefUsesRepositoryRelativePathV01(
  ref: Pick<ExternalRefV01, "ref_type">,
): boolean {
  return REPOSITORY_RELATIVE_REF_TYPES.has(ref.ref_type);
}

function hasRootOrDriveV01(value: string): boolean {
  return (
    path.posix.isAbsolute(value) ||
    path.win32.isAbsolute(value) ||
    path.posix.parse(value).root.length > 0 ||
    path.win32.parse(value).root.length > 0 ||
    WINDOWS_DRIVE_QUALIFIED.test(value)
  );
}

function invalidRepositoryRelativePath(): never {
  throw new RepositoryRelativePathErrorV01(
    "repository_relative_path_invalid",
  );
}

/** Prose-only label exception, never a filesystem-path or identifier rule.
 * "C: notes" is lexically ambiguous and classified as prose here. */
export function isPublicProseDriveLabelV01(value: string): boolean {
  return /^[A-Za-z]:[ \t]+[\p{L}\p{N}]/u.test(value);
}

/** Lexical privacy guard for public descriptions, not path canonicalization. */
export function containsPublicTextLocalPathV01(value: string): boolean {
  const trimmed = value.trim();
  if (
    path.posix.isAbsolute(trimmed) || path.win32.isAbsolute(trimmed) ||
    /\bfile:\/\//iu.test(value) ||
    /(?:^|[\s("'`])\/(?!\/)(?:[^/\s"'`]+\/)+[^/\s"'`]+/u.test(value) ||
    /(?:^|[\s("'`])\\\\[^\s"'`]+\\[^\s"'`]+/u.test(value)
  ) return true;
  for (const match of value.matchAll(/(?:^|[\s("'`])[a-zA-Z]:/gu)) {
    const token = value.slice(match.index + match[0].length - 2);
    // All letters, not task-specific labels. Bare drives, drive-relative paths
    // without a space and drive-absolute paths retain their refusal.
    if (!isPublicProseDriveLabelV01(token)) return true;
  }
  return false;
}
