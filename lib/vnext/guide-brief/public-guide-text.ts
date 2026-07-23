export function publicGuideBriefTextV02(value: string): string {
  const redacted = value
    .replace(/(?:file:\/\/)?\/(?:Users|home)\/[^\s,;)'"<>]+/giu, "[private path]")
    .replace(/\b[A-Za-z]:\\[^\s,;)'"<>]+/gu, "[private path]")
    .replace(/\b(?:sk|ghp|github_pat)-?[A-Za-z0-9_-]{8,}\b/gu, "[credential]")
    .replace(/\b(?:OPENAI_API_KEY|GITHUB_TOKEN|API_KEY)\s*[=:]\s*[^\s,;]+/giu, "[credential]");
  const replacements: Array<[RegExp, string]> = [
    [/TaskContextPacket/giu, "work instructions"],
    [/RunReceipt/giu, "result"],
    [/CriterionAssessment/giu, "verification"],
    [/EpisodeDeltaProposal/giu, "suggested change"],
    [/ReviewDecision/giu, "decision"],
    [/StateTransitionReceipt/giu, "change record"],
    [/Decision debt/giu, "pending decisions"],
    [/Accepted state/giu, "saved project state"],
    [/Working projection/giu, "working context"],
    [/Exact coordination/giu, "exact details"],
    [/Inspector lineage/giu, "source history"],
    [/packet fingerprint/giu, "source check"],
    [/\bTransition\b/gu, "project change"],
    [/\blineage\b/giu, "source history"],
    [/\bsemantic gate\b/giu, "review boundary"],
    [/\bcurrent-head\b/giu, "current version"],
    [/\bfingerprint\b/giu, "source check"],
  ];
  return replacements.reduce(
    (text, [pattern, replacement]) => text.replace(pattern, replacement),
    redacted,
  );
}

export function ordinaryActionLabelV02(entryState: string, fallback?: string): string {
  const known: Record<string, string> = {
    project_review: "Open current work",
    result_only: "Review result",
    assessment: "Review result",
    pending_proposal: "Review suggested change",
    decided_proposal: "Review next step",
    transition_blocked: "Resolve next step",
    transition_applied: "See what changed",
    feedback_needed: "Share outcome",
  };
  return known[entryState] ?? publicGuideBriefTextV02(fallback ?? "Continue");
}
