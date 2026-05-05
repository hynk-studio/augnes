# Privacy and review checklist

## Tool annotations
- [ ] Every tool sets `readOnlyHint`
- [ ] Every tool sets `destructiveHint`
- [ ] Every tool sets `openWorldHint`
- [ ] Public tools are truly read-only

## Data minimization
- [ ] No raw prompt text returned unless strictly required
- [ ] No secrets or tokens ever returned
- [ ] No provider session/thread/workspace IDs in public payloads
- [ ] No raw internal account IDs unless explicitly required

## Widget safety
- [ ] `_meta.ui.domain` is set
- [ ] `_meta.ui.csp.connectDomains` only includes required domains
- [ ] `_meta.ui.csp.resourceDomains` only includes required asset domains
- [ ] `frameDomains` omitted unless absolutely required

## Product safety
- [ ] Public app does not write or automate external actions
- [ ] Narrator text is never promoted to evidence
- [ ] Search/Explore repo outputs are not promoted to evidence
- [ ] Thread/session metadata is not treated as canonical memory

## Submission readiness
- [ ] Verified OpenAI platform account ready
- [ ] Public HTTPS MCP URL ready
- [ ] Test credentials work without MFA
- [ ] Test cases verified on ChatGPT web and mobile
