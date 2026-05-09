import {
  DeliveryRecord,
  PublicationDraft,
  PublicationNotFoundError,
  PublicationValidationError,
  createDelivery,
  getDeliveryByIdempotencyKey,
  getPublication,
  updateDeliveryStatus,
  updatePublicationStatus,
} from "@/lib/publications";
import { normalizeScope } from "@/lib/work";

export const GITHUB_PR_COMMENT_TARGET_SURFACE = "github_pr_comment";

const GITHUB_PR_REF_PATTERN =
  /^([A-Za-z0-9](?:[A-Za-z0-9-]{0,38}[A-Za-z0-9])?)\/([A-Za-z0-9._-]{1,100})#([1-9][0-9]*)$/;

export type GitHubPrCommentTarget = {
  owner: string;
  repo: string;
  pullNumber: number;
  targetRef: string;
};

export type GitHubPrCommentPublishInput = {
  publicationId: string;
  scope?: string | null;
  dryRun: boolean;
  idempotencyKey: string;
  targetRefOverride?: string | null;
  expectedTargetSurface?: string | null;
  requestedBy?: string | null;
  githubToken?: string | null;
};

export type GitHubPrCommentPublishResult = {
  dry_run: boolean;
  publication: PublicationDraft;
  delivery: DeliveryRecord | null;
  proposed_delivery: {
    publication_id: string;
    target_surface: typeof GITHUB_PR_COMMENT_TARGET_SURFACE;
    target_ref: string;
    status: "pending";
    idempotency_key: string;
  } | null;
  target_surface: typeof GITHUB_PR_COMMENT_TARGET_SURFACE;
  target_ref: string;
  would_post: boolean;
  posted: boolean;
  idempotent_replay: boolean;
  github_comment_url: string | null;
  github_comment_id: number | null;
  error_message: string | null;
  requested_by: string | null;
};

type GitHubCommentResponse = {
  id?: unknown;
  html_url?: unknown;
  message?: unknown;
};

export async function publishGitHubPrComment(
  input: GitHubPrCommentPublishInput,
): Promise<GitHubPrCommentPublishResult> {
  const scope = input.scope ? normalizeScope(input.scope) : null;
  const publication = getPublication(input.publicationId, scope);

  if (!publication) {
    throw new PublicationNotFoundError(input.publicationId, scope);
  }

  const expectedTargetSurface = cleanNullableString(input.expectedTargetSurface);
  if (
    expectedTargetSurface &&
    expectedTargetSurface !== GITHUB_PR_COMMENT_TARGET_SURFACE
  ) {
    throw new PublicationValidationError(
      `expected_target_surface must be ${GITHUB_PR_COMMENT_TARGET_SURFACE}.`,
    );
  }

  if (publication.target_surface !== GITHUB_PR_COMMENT_TARGET_SURFACE) {
    throw new PublicationValidationError(
      `publication target_surface must be ${GITHUB_PR_COMMENT_TARGET_SURFACE}.`,
    );
  }

  const targetRef =
    cleanNullableString(input.targetRefOverride) ?? publication.target_ref;
  const target = parseGitHubPrCommentTargetRef(targetRef);
  const previewBody = requireNonEmptyString(
    publication.preview_body,
    "preview_body",
  );
  const idempotencyKey = requireNonEmptyString(
    input.idempotencyKey,
    "idempotency_key",
  );
  const requestedBy = cleanNullableString(input.requestedBy);

  if (input.dryRun) {
    return {
      dry_run: true,
      publication,
      delivery: null,
      proposed_delivery: {
        publication_id: publication.publication_id,
        target_surface: GITHUB_PR_COMMENT_TARGET_SURFACE,
        target_ref: target.targetRef,
        status: "pending",
        idempotency_key: idempotencyKey,
      },
      target_surface: GITHUB_PR_COMMENT_TARGET_SURFACE,
      target_ref: target.targetRef,
      would_post: publication.status === "approved",
      posted: false,
      idempotent_replay: false,
      github_comment_url: null,
      github_comment_id: null,
      error_message:
        publication.status === "approved"
          ? null
          : "Dry-run only: publication is not approved, so an actual publish request would be blocked.",
      requested_by: requestedBy,
    };
  }

  const existingDelivery = getDeliveryByIdempotencyKey({
    publicationId: publication.publication_id,
    targetSurface: GITHUB_PR_COMMENT_TARGET_SURFACE,
    targetRef: target.targetRef,
    idempotencyKey,
  });

  if (existingDelivery) {
    if (
      existingDelivery.status === "sent" ||
      existingDelivery.status === "acknowledged"
    ) {
      return {
        dry_run: false,
        publication,
        delivery: existingDelivery,
        proposed_delivery: null,
        target_surface: GITHUB_PR_COMMENT_TARGET_SURFACE,
        target_ref: target.targetRef,
        would_post: false,
        posted: false,
        idempotent_replay: true,
        github_comment_url: null,
        github_comment_id: null,
        error_message: null,
        requested_by: requestedBy,
      };
    }

    return {
      dry_run: false,
      publication,
      delivery: existingDelivery,
      proposed_delivery: null,
      target_surface: GITHUB_PR_COMMENT_TARGET_SURFACE,
      target_ref: target.targetRef,
      would_post: false,
      posted: false,
      idempotent_replay: true,
      github_comment_url: null,
      github_comment_id: null,
      error_message:
        existingDelivery.status === "failed"
          ? "Existing failed delivery found for this idempotency_key. Use a new idempotency_key for a retry."
          : "Existing pending delivery found for this idempotency_key. Refusing to post a duplicate GitHub comment.",
      requested_by: requestedBy,
    };
  }

  if (publication.status !== "approved") {
    throw new PublicationValidationError(
      "publication status must be approved before publishing to GitHub.",
    );
  }

  const deliveryResult = createDelivery({
    publication_id: publication.publication_id,
    scope: publication.scope,
    target_surface: GITHUB_PR_COMMENT_TARGET_SURFACE,
    target_ref: target.targetRef,
    status: "pending",
    idempotency_key: idempotencyKey,
  });
  let delivery = deliveryResult.delivery;

  const githubToken = cleanNullableString(
    input.githubToken ?? process.env.GITHUB_TOKEN,
  );
  if (!githubToken) {
    const errorMessage =
      "GitHub publish failed: GITHUB_TOKEN is not configured for this runtime.";
    delivery = updateDeliveryStatus({
      deliveryId: delivery.delivery_id,
      scope: delivery.scope,
      status: "failed",
      error_message: errorMessage,
    });
    const failedPublication = updatePublicationStatus({
      publicationId: publication.publication_id,
      scope: publication.scope,
      status: "failed",
    });

    return {
      dry_run: false,
      publication: failedPublication,
      delivery,
      proposed_delivery: null,
      target_surface: GITHUB_PR_COMMENT_TARGET_SURFACE,
      target_ref: target.targetRef,
      would_post: false,
      posted: false,
      idempotent_replay: false,
      github_comment_url: null,
      github_comment_id: null,
      error_message: errorMessage,
      requested_by: requestedBy,
    };
  }

  try {
    const comment = await createGitHubPullRequestComment({
      target,
      body: previewBody,
      token: githubToken,
    });
    delivery = updateDeliveryStatus({
      deliveryId: delivery.delivery_id,
      scope: delivery.scope,
      status: "sent",
    });
    const sentPublication = updatePublicationStatus({
      publicationId: publication.publication_id,
      scope: publication.scope,
      status: "sent",
      sent_at: delivery.sent_at ?? undefined,
    });

    return {
      dry_run: false,
      publication: sentPublication,
      delivery,
      proposed_delivery: null,
      target_surface: GITHUB_PR_COMMENT_TARGET_SURFACE,
      target_ref: target.targetRef,
      would_post: false,
      posted: true,
      idempotent_replay: false,
      github_comment_url: comment.htmlUrl,
      github_comment_id: comment.id,
      error_message: null,
      requested_by: requestedBy,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "GitHub publish failed for an unknown reason.";
    delivery = updateDeliveryStatus({
      deliveryId: delivery.delivery_id,
      scope: delivery.scope,
      status: "failed",
      error_message: errorMessage,
    });
    const failedPublication = updatePublicationStatus({
      publicationId: publication.publication_id,
      scope: publication.scope,
      status: "failed",
    });

    return {
      dry_run: false,
      publication: failedPublication,
      delivery,
      proposed_delivery: null,
      target_surface: GITHUB_PR_COMMENT_TARGET_SURFACE,
      target_ref: target.targetRef,
      would_post: false,
      posted: false,
      idempotent_replay: false,
      github_comment_url: null,
      github_comment_id: null,
      error_message: errorMessage,
      requested_by: requestedBy,
    };
  }
}

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

async function createGitHubPullRequestComment({
  target,
  body,
  token,
}: {
  target: GitHubPrCommentTarget;
  body: string;
  token: string;
}) {
  const response = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(
      target.owner,
    )}/${encodeURIComponent(target.repo)}/issues/${target.pullNumber}/comments`,
    {
      method: "POST",
      headers: {
        accept: "application/vnd.github+json",
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
        "user-agent": "augnes-github-pr-comment-publication-adapter",
        "x-github-api-version": "2022-11-28",
      },
      body: JSON.stringify({ body }),
    },
  );

  const payload = (await response
    .json()
    .catch(() => ({}))) as GitHubCommentResponse;

  if (!response.ok) {
    const message =
      typeof payload.message === "string"
        ? payload.message
        : `GitHub API returned HTTP ${response.status}.`;
    throw new Error(`GitHub comment creation failed: ${message}`);
  }

  if (typeof payload.id !== "number") {
    throw new Error(
      "GitHub comment creation response did not include a comment id.",
    );
  }

  return {
    id: payload.id,
    htmlUrl: typeof payload.html_url === "string" ? payload.html_url : null,
  };
}

function requireNonEmptyString(value: string, key: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new PublicationValidationError(`${key} is required.`);
  }

  return value.trim();
}

function cleanNullableString(value: string | null | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  return value.trim() || null;
}
