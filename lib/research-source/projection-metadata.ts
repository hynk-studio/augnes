import { detectPrivacyRedactionRuntimeGuardFindingsV01 } from "@/lib/privacy/redaction-guard";
import { containsPublicTextLocalPathV01 } from "@/lib/vnext/repository-relative-path";

/** Existing hosted projection metadata policy. Never scan literal excerpts
 * with this predicate or describe its lexical checks as a secrecy guarantee. */
export function isSafeSourceProjectionMetadataV01(value: unknown): boolean {
  if (typeof value === "string") return !(
    containsPublicTextLocalPathV01(value) ||
    /\b(?:cookie|authorization|OPENAI_API_KEY|GITHUB_TOKEN)\s*[:=]/iu.test(value) ||
    detectPrivacyRedactionRuntimeGuardFindingsV01(value).some((finding) => finding.action !== "allowed")
  );
  return !value || typeof value !== "object" || Object.values(value).every(isSafeSourceProjectionMetadataV01);
}
