import { sitesPrincipal, type Environment } from "./access";
import { handle } from "./handler";
export default { fetch(request:Request,env:Environment) { return handle(request,env,sitesPrincipal(request,env)); } };
