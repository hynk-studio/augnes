import assert from "node:assert/strict";
import {readFileSync,writeFileSync,mkdirSync} from "node:fs";
import path from "node:path";
import {execFileSync} from "node:child_process";
import {createHash} from "node:crypto";
import ts from "typescript";
import {createCanonicalTestResourceRoot,cleanupCanonicalTestResources,buildCanonicalChildEnvironment} from "./canonical-test-environment.mjs";

// Execute the actual fixture helper initializer, avoiding the fixture module's
// CLI dispatcher. These controls are not historical reproduction or authority.
const source=readFileSync(new URL("./fixtures/local-canonical-reviewed-revision.mjs",import.meta.url),"utf8");
const tree=ts.createSourceFile("fixture.mjs",source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
assert.equal(tree.parseDiagnostics.length,0);
const declarations=tree.statements.filter(ts.isVariableStatement).flatMap(s=>[...s.declarationList.declarations]).filter(d=>d.name.getText(tree)==="gitFor");
assert.equal(declarations.length,1);assert(ts.isArrowFunction(declarations[0].initializer));
const factory=exec=>Function("execFileSync","return ("+declarations[0].initializer.getText(tree)+");")(exec);
const small=1024*1024,large=16*small,a="a".repeat(40),b="b".repeat(40);
const forms=[
 ["diff","--binary","--full-index","--no-ext-diff","--no-textconv"],
 ["diff","--binary","--no-ext-diff","--no-textconv","--no-renames"],
 ["diff","--binary","--no-ext-diff","--no-textconv"],
];
const owner=createCanonicalTestResourceRoot("ag-resource-test-",{shortSocketPaths:true}),repo=path.join(owner.root,"repo");
let observations,cleanup;
try {
mkdirSync(repo);
const c={checkout:repo,env:buildCanonicalChildEnvironment({temporaryRoot:owner.root})},calls=[];
const spy=factory((command,args,options)=>{calls.push({command,args,options});return Buffer.alloc(0);})(c);
const refusedForms=[
 ["show",a+":payload.bin"],["diff","--binary",a,b,"--"],
 [...forms[2],"--stat",a,b,"--"],[...forms[2],a,b,"--","../outside"],
 [...forms[2],"HEAD",b,"--"],[...forms[2],a,b],[...forms[2],a,b,"--",""],
 ["diff","--no-ext-diff","--no-textconv",a,b,"--"],
];
for(const prefix of forms){spy([...prefix,a,b,"--"]);spy([...prefix,a,b,"--","scripts/fixture.mjs"]);}
for(const args of refusedForms)spy(args);
for(let i=0;i<calls.length;i++){
 const v=calls[i];assert.equal(v.command,"git");assert.equal(v.options.maxBuffer,i<forms.length*2?large:small);
 assert.equal(v.options.timeout,5000);assert.equal(v.options.cwd,repo);assert.equal(v.options.env,c.env);
 assert.deepEqual(v.options.stdio,["ignore","pipe","pipe"]);assert.equal(v.options.encoding,undefined);
}
const primary=Object.assign(new Error("controlled signal/error"),{signal:"SIGTERM",code:"ENOBUFS"});
assert.throws(()=>factory(()=>{throw primary;})(c)([...forms[2],a,b,"--"]),e=>e===primary);
const git=factory(execFileSync)(c),sha=v=>createHash("sha256").update(v).digest("hex");
const commit=()=>{git(["add","."]);git(["-c","user.name=Fixture","-c","user.email=fixture@example.invalid","commit","--quiet","-m","bounded diff control"]);return git(["rev-parse","HEAD"]).toString().trim();};
const bytes=size=>{const result=Buffer.allocUnsafe(size);let state=0x72acfe31;for(let i=0;i<size;i++){state^=state<<13;state^=state>>>17;state^=state<<5;result[i]=state&255;}return result;};
const refuses=operation=>{let returned=false;assert.throws(()=>{operation();returned=true;},e=>e.code==="ENOBUFS"&&Buffer.isBuffer(e.stdout));assert.equal(returned,false);};
 git(["init","--quiet"]);writeFileSync(path.join(repo,"seed.txt"),"seed\n");const initial=commit();
 writeFileSync(path.join(repo,"payload.bin"),bytes(1200*1024));const within=commit();const hashes=[];
 for(const prefix of forms){
  const args=[...prefix,initial,within,"--"],expected=execFileSync("git",args,{cwd:repo,env:c.env,timeout:5000,maxBuffer:large,stdio:["ignore","pipe","pipe"]}),actual=git(args);
  assert(Buffer.isBuffer(actual));assert(actual.length>small&&actual.length<large);assert(actual.equals(expected));assert.equal(sha(actual),sha(expected));
  hashes.push({bytes:actual.length,sha256:sha(actual)});
 }
 refuses(()=>git(["show",within+":payload.bin"]));
 writeFileSync(path.join(repo,"oversize.bin"),bytes(14*small));const oversized=commit();
 refuses(()=>git([...forms[1],within,oversized,"--"]));
 assert.throws(()=>git([...forms[2],"f".repeat(40),within,"--"]),e=>Number.isInteger(e.status)&&e.status!==0);
 observations={synthetic_only:true,real_git:true,complete_raw_buffer_comparisons:hashes,finite_diff_cap:large,other_git_cap:small,timeout_ms:5000,overflow_refused:true,non_binary_overflow_refused:true,nonzero_and_signal_errors_preserved:true,argument_boundary_refusals:refusedForms.length};
}finally{cleanup=cleanupCanonicalTestResources([owner]);assert(cleanup.every(v=>v.completed));}
console.log(JSON.stringify({fixture_git_capture_controls:observations,cleanup}));
