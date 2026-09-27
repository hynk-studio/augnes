// TEST/LOCAL ENTRY ONLY. Never included by build-web-planning's deployment entry.
import { handle } from "../apps/web_planning/src/handler";
import type { Environment } from "../apps/web_planning/src/access";
interface FixtureEnvironment extends Environment { LOCAL_SESSION: string; LOCAL_LOGIN: string }
export default { async fetch(request:Request,env:FixtureEnvironment) {
  const url=new URL(request.url);
  if(!['127.0.0.1','localhost'].includes(url.hostname)||url.origin!==env.APP_ORIGIN)return new Response('Local fixture only',{status:403});
  const noStore={'Cache-Control':'no-store','Content-Type':'text/html; charset=utf-8'};
  if(url.pathname==='/_local/login') {
    if(request.method==='POST') {
      if(request.headers.get('origin')!==env.APP_ORIGIN)return new Response('Same origin required',{status:403});
      return new Response(null,{status:303,headers:{...noStore,Location:'/', 'Set-Cookie':`web_planning_local=${env.LOCAL_SESSION}; Path=/; HttpOnly; SameSite=Strict`}});
    }
    return new Response('<!doctype html><html lang="en"><meta name="viewport" content="width=device-width"><title>Local synthetic workspace</title><h1>Local synthetic workspace</h1><p>Only disposable test data. This login is excluded from the deployment artifact and does not verify Sites authentication.</p><form method="post"><button>Enter synthetic workspace</button></form></html>',{headers:noStore});
  }
  if(url.pathname==='/signout-with-chatgpt')return new Response(null,{status:303,headers:{...noStore,Location:'/_local/login','Set-Cookie':'web_planning_local=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict'}});
  const values=(request.headers.get('cookie')??'').split(';').map(v=>v.trim()).filter(v=>v.startsWith('web_planning_local='));
  const authenticated=values.length===1 && values[0]===`web_planning_local=${env.LOCAL_SESSION}`;
  return handle(request,env,{login:authenticated?env.LOCAL_LOGIN:null,localFixture:true});
} };
