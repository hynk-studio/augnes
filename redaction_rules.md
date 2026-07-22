# Redaction Rules

Use these rules before promoting anything from this private lab into the public
Augnes repository.

- Remove private conversation logs, personal context, raw notes, and subjective
  evaluations.
- Replace raw examples with public-safe fixtures that preserve structure without
  preserving private content.
- Promote only clean schemas, tests, docs, or implementation changes that can be
  reviewed independently of private lab context.
- Record the upstream Augnes commit SHA behind each experiment before deriving
  public-safe output.
- Keep failed experiments and speculative research logs in this private lab
  unless they have been rewritten into public-safe documentation.
- Do not include tokens, secrets, private URLs, personal identifiers, or
  unredacted screenshots in public PRs.
