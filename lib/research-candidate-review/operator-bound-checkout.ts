export const RESEARCH_CANDIDATE_OPERATOR_BOUND_CHECKOUT_INSTRUCTION =
  "Authorized checkout: use the repository checkout explicitly supplied by the human operator for this Codex task. Do not assume a machine-specific path.";

const ABSOLUTE_USER_HOME_PATH =
  /(?:file:\/\/\/?(?:Users|home)\/[^/\s]+(?:\/|$)|\/Users\/[^/\s]+(?:\/|$)|\/home\/[^/\s]+(?:\/|$)|[A-Za-z]:\\Users\\[^\\\s]+(?:\\|$))/iu;

export function containsAbsoluteUserHomePath(value: string): boolean {
  return ABSOLUTE_USER_HOME_PATH.test(value);
}
