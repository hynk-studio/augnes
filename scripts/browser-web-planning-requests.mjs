import assert from 'node:assert/strict';

// Request-window accounting for this Browser owner only. A POST is not itself
// a write: capacity is an advisory read, bound to a known tab's current draft.
// Everything else must match the complete, ordered foreground request contract.
export function assertReadOnlyRequestWindow(requests,{expected,background,allowFocusReads=false}) {
 const foreground=[],seen=new Set(),checks=new Set();let capacity=0,focus=0;
 for(const request of requests){
   const {source}=request;
   assert(source?.target_id&&source.request_id,'request attribution required');
   const key=source.target_id+':'+source.request_id;
   assert(!seen.has(key),'duplicate recorded request');seen.add(key);
   const tab=background.find(t=>t.target_id===source.target_id&&t.document_url===source.document_url);
   assert(tab,'unknown request tab or document');
   const body=request.body===undefined?undefined:JSON.parse(request.body);
   const frames=source.initiator?.type==='script'?source.initiator.stack?.callFrames??[]:[];
   const caller=name=>frames.some(f=>f.functionName===name&&f.url===tab.client_url);
   if(request.method==='POST'&&request.path===tab.capacity.path&&caller('checkCapacity')&&caller('request')){
     const {check_id,...payload}=body??{};
     assert.match(check_id??'',/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,'capacity check identity');
     assert(!checks.has(check_id),'duplicate capacity check identity');checks.add(check_id);
     assert.deepEqual(payload,tab.capacity.body,'capacity must inspect the known draft and saved binding');
     capacity++;continue;
   }
   // The viewport/keyboard journey can also cause the existing focus access read.
   // This exception is not enabled for list recovery or either branch window.
   if(allowFocusReads&&request.method==='GET'&&request.path==='/api/works'&&body===undefined&&caller('api')&&caller('request')){focus++;continue;}
   foreground.push({target_id:source.target_id,method:request.method,path:request.path,body});
 }
 assert.deepEqual(foreground,expected,'exact foreground requests; no ticket, preview, save or other operation');
 return {foreground:foreground.length,capacity,focus};
}

// Constructed contract negatives run inside the same Browser owner as the real
// overlap journeys. They ensure the exception cannot hide a broken foreground.
export function testReadOnlyRequestWindow(){
 const body={workspace_id:'workspace',project_id:'project',definition:{goal:'Constructed draft'},notes:[],material_edits:[],expected:{revision:2,fingerprint:'original'}};
 const tab={target_id:'background',document_url:'https://example.test/',client_url:'https://example.test/client.js',capacity:{path:'/api/work/known/capacity',body}};
 const front={...tab,target_id:'foreground'};
 const source=(target_id,request_id)=>({target_id,request_id,document_url:tab.document_url,initiator:{type:'script',stack:{callFrames:['request','api','checkCapacity'].map(functionName=>({functionName,url:tab.client_url}))}}});
 const context={method:'POST',path:'/api/work/known/context',body:JSON.stringify({expected:body.expected}),source:source('foreground','context')};
 const capacity={method:'POST',path:tab.capacity.path,body:JSON.stringify({check_id:'00000000-0000-4000-8000-000000000001',...body}),source:source('background','capacity')};
 const expected=[{target_id:'foreground',method:context.method,path:context.path,body:JSON.parse(context.body)}];
 const options={expected,background:[front,tab]};
 assert.deepEqual(assertReadOnlyRequestWindow([context,capacity],options),{foreground:1,capacity:1,focus:0});
 assertReadOnlyRequestWindow([context],options);
 const failures={
   missing_context:[capacity],duplicate_context:[context,{...context,source:source('foreground','second')},capacity],
   wrong_context_binding:[{...context,body:'{"expected":{"revision":3}}'},capacity],
   wrong_context_tab:[{...context,source:source('background','context')},capacity],
   missing_attribution:[context,{...capacity,source:undefined}],
   unknown_tab:[context,{...capacity,source:source('unknown','capacity')}],
   wrong_document:[context,{...capacity,source:{...capacity.source,document_url:'https://other.test/'}}],
   wrong_caller:[context,{...capacity,source:{...capacity.source,initiator:{type:'other'}}}],
   arbitrary_capacity_path:[context,{...capacity,path:'/api/unexpected/capacity'}],
   capacity_query:[context,{...capacity,path:capacity.path+'?write=true'}],
   wrong_method:[context,{...capacity,method:'GET'}],
   wrong_binding:[context,{...capacity,body:JSON.stringify({...JSON.parse(capacity.body),expected:{revision:3}})}],
   wrong_draft:[context,{...capacity,body:JSON.stringify({...JSON.parse(capacity.body),notes:[{text:'unobserved'}]})}],
   extra_body_field:[context,{...capacity,body:JSON.stringify({...JSON.parse(capacity.body),ticket:'unexpected'})}],
   invalid_check_id:[context,{...capacity,body:JSON.stringify({...JSON.parse(capacity.body),check_id:'unknown'})}],
   repeated_capacity:[context,capacity,{...capacity,source:source('background','another')}],
 };
 for(const path of ['/api/drafts','/api/work/known/ticket','/api/work/known/incorporation-preview','/api/work/known/relation-save','/api/work/known/save','/api/unknown'])failures[path]=[context,capacity,{...context,path,source:source('foreground',path)}];
 for(const [name,requests] of Object.entries(failures))assert.throws(()=>assertReadOnlyRequestWindow(requests,options),{name:'AssertionError'},name);
 assertReadOnlyRequestWindow([capacity],{...options,expected:[]});
 assert.throws(()=>assertReadOnlyRequestWindow([context,capacity],{...options,expected:[]}),{name:'AssertionError'},'blocked controls cannot send context either');
 const list={method:'GET',path:'/api/works',body:undefined,source:source('foreground','list')};
 const recovery={...options,expected:[{target_id:'foreground',method:'GET',path:'/api/works',body:undefined}]};
 assertReadOnlyRequestWindow([list,capacity],recovery);
 assert.throws(()=>assertReadOnlyRequestWindow([capacity],recovery),{name:'AssertionError'},'missing recovery list');
 assert.throws(()=>assertReadOnlyRequestWindow([list,{...list,source:source('foreground','second-list')},capacity],recovery),{name:'AssertionError'},'duplicate recovery list');
 console.log(JSON.stringify({request_window_contract:{constructed:true,negative_cases:Object.keys(failures).length+3}}));
}
