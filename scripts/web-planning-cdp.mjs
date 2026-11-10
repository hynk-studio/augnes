// Shared Web Planning adapter. Protocol errors retain command context without
// retaining headers or bodies; every error still rejects its original command.
export class CDP {
 constructor(url){this.ws=new WebSocket(url);this.next=1;this.pending=new Map();this.handlers=[];}
 async open(){await new Promise((ok,no)=>{this.ws.addEventListener('open',ok,{once:true});this.ws.addEventListener('error',no,{once:true});});this.ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=this.pending.get(m.id);if(p){clearTimeout(p.timer);this.pending.delete(m.id);if(m.error){const error=new Error(m.error.message);error.cdp={method:p.method,code:m.error.code,message:m.error.message,data:m.error.data??null,request_id:p.requestId??null};error.commandStack=p.commandStack;p.no(error);}else p.ok(m.result);}}else for(const fn of this.handlers)fn(m);});return this;}
 send(method,params={}){const commandStack=new Error('CDP command '+method).stack;return new Promise((ok,no)=>{const id=this.next++,timer=setTimeout(()=>{this.pending.delete(id);no(new Error('cdp_timeout:'+method));},15000);this.pending.set(id,{ok,no,timer,method,requestId:params.requestId,commandStack});this.ws.send(JSON.stringify({id,method,params}));});}
 async eval(expression){const r=await this.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.text);return r.result.value;}
 async close(){for(const p of this.pending.values()){clearTimeout(p.timer);p.no(new Error('cdp_closed'));}this.pending.clear();await new Promise(resolve=>{this.ws.addEventListener('close',resolve,{once:true});this.ws.close();});}
}
