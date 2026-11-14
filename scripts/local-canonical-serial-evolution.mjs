// Versioned exact-content review profile. These source identities describe a
// reviewed evolution, not task/branch identities or acceptance of arbitrary main.
import { digest } from "./local-canonical-inputs.mjs";
import { PROJECT_EXPERIENCE_SERIAL, PROJECT_EXPERIENCE_COMMITMENT, PROJECT_EXPERIENCE_ENVELOPE_MS } from "./project-experience-serial-budget.mjs";
export const SERIAL_EVOLUTION_CONTRACT = "serial-historical-three-source-evolution-v1";
export const SERIAL_EVOLUTION_FINDINGS = Object.freeze([
  "Project-client A/B authentication, held saves, conflict recovery and fresh readback assertions remain; contrast and real keyboard/focus/draft checks are added.",
  "Result-draft capture changes fixture transport and readiness scheduling; its helper and scheduler are bound. This is reviewed evolution, not semantic identity.",
  "Web default journey calls remain with added project/cooperation/succession coverage; polling, busy settlement, fragment navigation, download and cleanup diagnostics evolve.",
  "The stale-context focus expectation changes from saved-context to status; no blanket transitive assertion-equivalence claim is made.",
  "Current fourth-child draft-safety coverage and the complete reviewed tree remain required; original history contains no fourth child or result.",
  "Only inherited scripts.build changes from vite build to vite build --configLoader native; every other manifest declaration and pinned input stays fixed.",
]);
const reviewed = [
  {
    "path": "scripts/test-project-client-browser.ts",
    "historical": {
      "bytes": 45790,
      "sha256": "ac8a9fa02d2ffaa4f6050ff0115a429532bef8354857c3034274c3760ba81deb"
    },
    "base": {
      "bytes": 47606,
      "sha256": "dacb3f039ebfceac1a91758c4cc6ae8f76a2cbb0a3dc8cdc05b3821ed637e236"
    }
  },
  {
    "path": "scripts/browser-validate-web-planning.mjs",
    "historical": {
      "bytes": 51089,
      "sha256": "722c568d6b1824163572b72d0498c89aa2074d2cbdf1bb0b3075e562f620217d"
    },
    "base": {
      "bytes": 61183,
      "sha256": "2d6554f07d3772f24f82974053d8f5d774ae54911cd38ece3dad6c406c251be8"
    }
  },
  {
    "path": "scripts/result-work-draft-browser-checks.ts",
    "historical": {
      "bytes": 10862,
      "sha256": "4d8ac5d38be41fd83937fa65bd04d5dbf938a29c3e24e6913489e9c7aea0091c"
    },
    "base": {
      "bytes": 14219,
      "sha256": "f17834a4448ca66b9d4a9f4321d3cb2957d8034125b555a4350a91885cb3eaab"
    }
  },
  {
    "path": "scripts/result-draft-capture-scheduler.mjs",
    "historical": null,
    "base": {
      "bytes": 8839,
      "sha256": "b7e2afcf19c04fc7029e1258e4bff0022146f07f5f5b023c30574f967aac9187"
    }
  },
  {
    "path": "scripts/web-planning-browser-observation.mjs",
    "historical": null,
    "base": {
      "bytes": 4291,
      "sha256": "e9a1d3401e2d48f5e0a8b34e5d8f012a827be0d2246f4adeb84785af42f81a1e"
    }
  },
  {
    "path": "scripts/web-planning-cdp.mjs",
    "historical": {
      "bytes": 1677,
      "sha256": "e36747ffbf0447357bb626b1cc428a55f76d3729552fdd5b23f91b4f3b116b80"
    },
    "base": {
      "bytes": 6366,
      "sha256": "3c57cbc0a64615f66de63a5be0008dcb51df8429104ad0d94596ea22ab72eaa9"
    }
  },
  {
    "path": "scripts/browser-web-planning-draft-safety.mjs",
    "historical": null,
    "base": {
      "bytes": 20403,
      "sha256": "f42383551b4794402e4bd8f8cf0deff0639694388388921c16f27ed055bd7a88"
    }
  },
  {
    "path": "apps/web_planning/package.json",
    "historical": {
      "bytes": 894,
      "sha256": "1b419dd6cd9ee62565ae7057b847bce40b90121c8a40c7ac19df1316a25faba6"
    },
    "base": {
      "bytes": 916,
      "sha256": "f33f48d5a01ad84981a4206ae52c3ecf6af6cbeac28f4bd23b8a41690cb212e4"
    }
  }
];
const equal=(a,b)=>digest(a)===digest(b);
const refuse=code=>{throw Object.assign(new Error(code),{code});};
const blob=(git,head,name)=>git(["ls-tree",head,"--",name]).length ? git(["show",head+":"+name]) : null;
const identity=bytes=>bytes===null?null:{bytes:bytes.length,sha256:digest(bytes)};
const entries=(git,head)=>{
  const map=new Map();
  for(const row of git(["ls-tree","-r","--full-tree",head,"--",...reviewed.map(v=>v.path)]).toString().trim().split("\n").filter(Boolean)) {
    const match=row.match(/^100644 blob ([a-f0-9]{40})\t(.+)$/u);
    if(!match || map.has(match[2]))refuse("serial_evolution_source_mode_invalid");
    map.set(match[2],match[1]);
  }
  return map;
};
// Repeated refusal controls share one reader's immutable commit triple. The
// live input/authority readers are never cached; cold readers get a fresh scope.
const immutableEvidence = new WeakMap();
export function serialEvolutionEvidence(p,prior,historical,git) {
  const key=digest([prior.head,prior.tree,p.base,p.head,p.tree,historical,PROJECT_EXPERIENCE_COMMITMENT]);
  let scope=immutableEvidence.get(git);
  if(!scope){scope=new Map();immutableEvidence.set(git,scope);}
  if(scope.has(key))return structuredClone(scope.get(key));
  const trees=[prior.head,p.base,p.head].map(head=>entries(git,head)),blobs=new Map();
  const binding=(index,name)=>{
    const oid=trees[index].get(name);if(!oid)return null;
    if(!blobs.has(oid))blobs.set(oid,identity(git(["show",[prior.head,p.base,p.head][index]+":"+name])));
    return blobs.get(oid);
  };
  const evidence={contract:SERIAL_EVOLUTION_CONTRACT,
    common_ancestor:git(["merge-base",prior.head,p.base]).toString().trim(),
    historical:{head:prior.head,tree:prior.tree,inventory_sha256:digest(historical)},
    base:{head:p.base,tree:git(["rev-parse",p.base+"^{tree}"]).toString().trim()},
    candidate:{head:p.head,tree:p.tree,inventory_sha256:PROJECT_EXPERIENCE_COMMITMENT},
    sources:reviewed.map(({path})=>({path,historical:binding(0,path),base:binding(1,path),candidate:binding(2,path)})),
    findings:[...SERIAL_EVOLUTION_FINDINGS]};
  if(scope.size<4 && Buffer.byteLength(JSON.stringify(evidence))<=65536)scope.set(key,structuredClone(evidence));
  return evidence;
}
export function verifySerialEvolution(p,prior,historical,evidence,git) {
  if(historical.length!==3 || PROJECT_EXPERIENCE_SERIAL.children.length!==4 || PROJECT_EXPERIENCE_ENVELOPE_MS!==730000)
    refuse("serial_evolution_inventory_invalid");
  git(["merge-base","--is-ancestor",prior.head,p.head]);git(["merge-base","--is-ancestor",p.base,p.head]);
  const expected=serialEvolutionEvidence(p,prior,historical,git);
  if(!equal(evidence,expected))refuse("serial_evolution_binding_invalid");
  for(const [i,entry] of reviewed.entries()) {
    const actual=expected.sources[i];
    if(!equal(actual.historical,entry.historical)||!equal(actual.base,entry.base)||!equal(actual.candidate,entry.base))
      refuse("serial_evolution_unreviewed_source");
  }
  const name="apps/web_planning/package.json",a=JSON.parse(blob(git,prior.head,name)),b=JSON.parse(blob(git,p.base,name));
  if(a.scripts?.build!=="vite build" || b.scripts?.build!=="vite build --configLoader native")refuse("serial_evolution_build_invalid");
  const normalized=structuredClone(b);normalized.scripts.build=a.scripts.build;
  if(!equal(a,normalized))refuse("serial_evolution_build_invalid");
  return {contract:SERIAL_EVOLUTION_CONTRACT,evidence_sha256:digest(evidence),historical_inventory_sha256:digest(historical),
    current_inventory_sha256:PROJECT_EXPERIENCE_COMMITMENT,inherited_build_path:name};
}
