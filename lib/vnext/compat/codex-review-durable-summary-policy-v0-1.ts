export const CODEX_REVIEW_DURABLE_SUMMARY_POLICY_VERSION_V01 =
  "codex_review_durable_summary_policy.v0.1" as const;

export const CODEX_REVIEW_DURABLE_SUMMARY_MAX_CHARACTERS_V01 = 2000 as const;

export const CODEX_REVIEW_REQUIREMENT_CANDIDATE_BUCKET_V01 =
  "requirement_progress_delta_candidates" as const;

export type CodexReviewDurableSummaryPolicyIssueCodeV01 =
  | "codex_review_durable_summary_empty"
  | "codex_review_durable_summary_bound_exceeded"
  | "codex_review_durable_summary_secret_forbidden"
  | "codex_review_durable_summary_credential_forbidden"
  | "codex_review_durable_summary_absolute_path_forbidden"
  | "codex_review_durable_summary_private_url_forbidden"
  | "codex_review_durable_summary_raw_material_forbidden";

export type CodexReviewDurableSummaryPolicyResultV01 =
  | {
      status: "preserved";
      policy_version: typeof CODEX_REVIEW_DURABLE_SUMMARY_POLICY_VERSION_V01;
      source:
        "canonical_requirement_signal" | "legacy_candidate_display_summary";
      summary: string;
      issue_code: null;
    }
  | {
      status: "blocked";
      policy_version: typeof CODEX_REVIEW_DURABLE_SUMMARY_POLICY_VERSION_V01;
      source:
        "canonical_requirement_signal" | "legacy_candidate_display_summary";
      summary: null;
      issue_code: CodexReviewDurableSummaryPolicyIssueCodeV01;
    };

export function deriveCodexReviewDurableSummaryV01(input: {
  candidate_bucket: string;
  canonical_source_signal: string;
  candidate_display_summary: string;
}): CodexReviewDurableSummaryPolicyResultV01 {
  const source =
    input.candidate_bucket === CODEX_REVIEW_REQUIREMENT_CANDIDATE_BUCKET_V01
      ? "canonical_requirement_signal"
      : "legacy_candidate_display_summary";
  const value =
    source === "canonical_requirement_signal"
      ? input.canonical_source_signal
      : input.candidate_display_summary;
  const summary = normalizeDurableSummaryWhitespaceV01(value);
  const blocked = (
    issue_code: CodexReviewDurableSummaryPolicyIssueCodeV01,
  ): CodexReviewDurableSummaryPolicyResultV01 => ({
    status: "blocked",
    policy_version: CODEX_REVIEW_DURABLE_SUMMARY_POLICY_VERSION_V01,
    source,
    summary: null,
    issue_code,
  });

  if (source === "legacy_candidate_display_summary") {
    return {
      status: "preserved",
      policy_version: CODEX_REVIEW_DURABLE_SUMMARY_POLICY_VERSION_V01,
      source,
      summary,
      issue_code: null,
    };
  }

  if (!summary) return blocked("codex_review_durable_summary_empty");
  if (summary.length > CODEX_REVIEW_DURABLE_SUMMARY_MAX_CHARACTERS_V01) {
    return blocked("codex_review_durable_summary_bound_exceeded");
  }
  if (
    /\b(?:sk-(?:proj-)?[A-Za-z0-9_-]{8,}|ghp_[A-Za-z0-9_]{8,}|github_pat_[A-Za-z0-9_]{8,})\b/.test(
      summary,
    )
  ) {
    return blocked("codex_review_durable_summary_credential_forbidden");
  }
  if (
    /(?:OPENAI_API_KEY|GITHUB_TOKEN|ANTHROPIC_API_KEY|AWS_SECRET_ACCESS_KEY)\s*=/i.test(
      summary,
    ) ||
    /\b(?:password|secret|api[_ -]?key|access[_ -]?token)\s*[:=]/i.test(summary)
  ) {
    return blocked("codex_review_durable_summary_secret_forbidden");
  }
  if (/(?:^|\s)(?:file:\/\/|\/(?!\/)|[A-Za-z]:[\\/])/.test(summary)) {
    return blocked("codex_review_durable_summary_absolute_path_forbidden");
  }
  if (
    /\bhttps?:\/\/(?:[^\s/@]+:[^\s/@]+@|localhost(?::\d+)?(?:\/|\b)|127(?:\.\d{1,3}){3}(?::\d+)?(?:\/|\b)|10(?:\.\d{1,3}){3}(?::\d+)?(?:\/|\b)|192\.168(?:\.\d{1,3}){2}(?::\d+)?(?:\/|\b)|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2}(?::\d+)?(?:\/|\b)|\[?::1\]?(?::\d+)?(?:\/|\b)|[^\s/]+\.local(?::\d+)?(?:\/|\b))/i.test(
      summary,
    )
  ) {
    return blocked("codex_review_durable_summary_private_url_forbidden");
  }
  if (
    /\b(?:raw[_ -]?)?(?:prompt|transcript|terminal[_ -]?(?:output|log|dump)|environment[_ -]?(?:dump|variables?)|provider[_ -]?output|hidden[_ -]?reasoning|reasoning[_ -]?trace|chain[_ -]?of[_ -]?thought)\s*[:=]/i.test(
      summary,
    )
  ) {
    return blocked("codex_review_durable_summary_raw_material_forbidden");
  }

  return {
    status: "preserved",
    policy_version: CODEX_REVIEW_DURABLE_SUMMARY_POLICY_VERSION_V01,
    source,
    summary,
    issue_code: null,
  };
}

export function normalizeDurableSummaryWhitespaceV01(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}
