import { handle } from "./handler";
import type { Environment, Principal } from "./access";

// Platform-verified Access context, supplied by workerd only for a direct
// authenticated invocation. Headers, cookies and request bodies are not identity.
interface AccessContext {
  access?: { aud: string; getIdentity(): Promise<{ email?: unknown } | null> };
}
export default {
  async fetch(request: Request, env: Environment & { ACCESS_AUDIENCE: string }, ctx: AccessContext) {
    const principal: Principal = { login: null, ingress: "cloudflare-access" };
    if (/^[a-f0-9]{64}$/.test(env.ACCESS_AUDIENCE ?? "") && ctx.access?.aud === env.ACCESS_AUDIENCE) {
      try {
        const identity = await ctx.access.getIdentity();
        if (typeof identity?.email === "string") principal.login = identity.email;
      } catch { /* Identity lookup failure grants no access; never log its payload. */ }
    }
    return handle(request, env, principal);
  },
};
