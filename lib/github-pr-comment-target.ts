import { PublicationValidationError } from "@/lib/publications";

export const GITHUB_PR_COMMENT_TARGET_SURFACE = "github_pr_comment";

const GITHUB_PR_REF_PATTERN =
  /^([A-Za-z0-9](?:[A-Za-z0-9-]{0,38}[A-Za-z0-9])?)\/([A-Za-z0-9._-]{1,100})#([1-9][0-9]*)$/;

export type GitHubPrCommentTarget = {
  owner: string;
  repo: string;
  pullNumber: number;
  targetRef: string;
};

export function parseGitHubPrCommentTargetRef(
  targetRef: string,
): GitHubPrCommentTarget {
  const cleanTargetRef = requireNonEmptyString(targetRef, "target_ref");
  const match = GITHUB_PR_REF_PATTERN.exec(cleanTargetRef);
  if (!match) {
    throw new PublicationValidationError(
      "target_ref must use owner/repo#pull_number format, for example Aurna-code/augnes#62.",
    );
  }

  return {
    owner: match[1],
    repo: match[2],
    pullNumber: Number(match[3]),
    targetRef: `${match[1]}/${match[2]}#${match[3]}`,
  };
}

function requireNonEmptyString(value: string, key: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new PublicationValidationError(`${key} is required.`);
  }

  return value.trim();
}
