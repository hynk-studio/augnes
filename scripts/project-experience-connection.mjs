// A closed statement/scope reader for the two plain-Node orchestration owners.
// It does not execute historical source or load an unfrozen npm parser before
// dependency preparation. Comments and literal contents cannot supply calls.
export function orchestrationTokens(source) {
  let at=source.startsWith("#!") ? source.indexOf("\n") : 0, previous=""; const tokens=[];
  if(at<0) return tokens;
  const quoted=quote=>{
    const start=at++;
    while(at<source.length) {
      if(source[at]==="\\") {at+=2;continue;}
      if(source[at]===quote) {at++;return quote==="`"?"<template>":"<string:"+source.slice(start+1,at-1)+">";}
      if(quote==="`" && source.slice(at,at+2)==="${") {at+=2;scan(true);continue;}
      at++;
    }
    throw new Error("serial_connection_unclosed_literal");
  };
  const scan=(interpolation=false)=>{
    let braces=0;
    while(at<source.length) {
      const char=source[at];
      if(/\s/u.test(char)){at++;continue;}
      if(source.slice(at,at+2)==="//"){at=source.indexOf("\n",at+2);if(at<0){at=source.length;return;}continue;}
      if(source.slice(at,at+2)==="/*"){const end=source.indexOf("*/",at+2);if(end<0)throw new Error("serial_connection_unclosed_comment");at=end+2;continue;}
      let token;
      if(['"',"'","`"].includes(char)) token=quoted(char);
      else if(char==="/" && ["","=","(","[",",",":","return","=>","!","&&","||","?"].includes(previous)) {
        at++;let characterClass=false,closed=false;
        while(at<source.length){const c=source[at++];if(c==="\\"){at++;continue;}if(c==="[")characterClass=true;if(c==="]")characterClass=false;if(c==="/"&&!characterClass){closed=true;break;}}
        if(!closed)throw new Error("serial_connection_unclosed_regex");
        while(/[a-z]/iu.test(source[at]??""))at++;token="<regex>";
      } else if (char === "/") {
        // These owners need no division expressions. Ambiguous slash contexts
        // (including a regex after a control-closing parenthesis) fail closed.
        throw new Error("serial_connection_unsupported_slash");
      } else {
        const match=source.slice(at).match(/^(?:[A-Za-z_$][\w$]*|\d[\d_.]*|\.\.\.|===|!==|=>|\?\.|\?\?|&&|\|\||==|!=|<=|>=|\+\+|--|\+=|-=|\*\*)/u);
        token=match?.[0]??char;at+=token.length;
      }
      if(interpolation){if(token==="}"){if(braces===0)return;braces--;}else if(token==="{")braces++;}
      else tokens.push(token);
      previous=token;
    }
    if(interpolation)throw new Error("serial_connection_unclosed_template");
  };
  scan();return tokens;
}

function reader(source) {
  const tokens=orchestrationTokens(source),stack=[],scopes=[],pairs=new Map();
  for(let i=0;i<tokens.length;i++) {
    scopes[i]=[...stack];
    if(tokens[i]==="{")stack.push(i);
    if(tokens[i]==="}"){const open=stack.pop();if(open===undefined)throw Error("serial_connection_unbalanced");pairs.set(open,i);}
  }
  if(stack.length)throw Error("serial_connection_unbalanced");
  const matches=snippet=>{const want=orchestrationTokens(snippet), found=[];
    for(let i=0;i<=tokens.length-want.length;i++)if(want.every((t,j)=>t===tokens[i+j]))found.push(i);return found;};
  const unique=(snippet,predicate)=>{const found=matches(snippet);return found.length===1&&predicate(found[0]);};
  const moduleTry=i=>scopes[i].length===1&&tokens[scopes[i][0]-1]==="try";
  const namedFunction=(name,i)=>scopes[i].some(open=>{
    if(scopes[open].length!==0)return false;
    let start=open-1,parens=0;
    while(start>=0){if(tokens[start]===")")parens++;if(tokens[start]==="("&&--parens===0)break;start--;}
    return tokens[start-1]===name&&tokens[start-2]==="function";
  });
  return {tokens,scopes,pairs,unique,moduleTry,namedFunction};
}

export function validProjectExperienceConnection(suiteSource,parentSource) {
  try {
    const s=reader(suiteSource),p=reader(parentSource);
    return s.unique('import { createProjectExperienceBudget, projectExperienceBudgetEvent, projectExperienceSteps, runProjectExperienceChildren } from "./project-experience-serial-budget.mjs";',i=>s.scopes[i].length===0) &&
      p.unique('import { PROJECT_EXPERIENCE_ENVELOPE_MS, PROJECT_EXPERIENCE_SERIAL, PROJECT_EXPERIENCE_COMMITMENT, runProjectExperienceParent } from "./project-experience-serial-budget.mjs";',i=>p.scopes[i].length===0) &&
      s.unique("const [projectExperienceStep, projectClientBrowserStep, webPlanningBrowserStep, webPlanningDraftSafetyStep] = projectExperienceSteps(repoRoot);",i=>s.scopes[i].length===0) &&
      s.unique('"e2e-project-experience": [{ ...projectExperienceStep }, { ...projectClientBrowserStep }, { ...webPlanningBrowserStep }, { ...webPlanningDraftSafetyStep }]',i=>s.scopes[i].length===1&&s.tokens.slice(s.scopes[i][0]-3,s.scopes[i][0]).join(" ")==="const suites =") &&
      s.unique('const serialController = suiteName === "e2e-project-experience" ? new AbortController() : null;',i=>s.scopes[i].length===0) &&
      s.unique('const serialBudget = serialController ? createProjectExperienceBudget({ startedAt: 0, onFailure: () => serialController.abort(), }) : null;',i=>s.scopes[i].length===0) &&
      s.unique("else if (serialBudget) { completedResults = await runProjectExperienceChildren({ steps: preparedSteps, root: repoRoot, signal: serialController.signal, emit: emitSerial }); }",s.moduleTry) &&
      s.unique("allowAcquire: !serialBudget",i=>s.scopes[i].length===3&&s.tokens[s.scopes[i][0]-1]==="try"&&
        s.tokens.slice(s.scopes[i][2]-3,s.scopes[i][2]).join(" ")==="await acquireCompanionServiceMaintenance (") &&
      p.unique('"e2e-project-experience": { label: "Canonical project experience Browser owner", suite: "e2e-project-experience", timeoutMs: PROJECT_EXPERIENCE_ENVELOPE_MS, }',i=>p.namedFunction("browserPhaseDefinition",i)) &&
      p.unique('result = await (phase.id === "e2e-project-experience" ? runProjectExperienceParent : runCanonicalChild)(',i=>p.namedFunction("executePhase",i)&&p.scopes[i].length===2&&p.tokens[p.scopes[i][1]-1]==="try");
  } catch {return false;}
}
