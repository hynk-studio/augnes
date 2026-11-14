// Immutable historical registration examples, independent of the runtime inventory.
export const historicalChildren = [
  {
    "id": "project-experience",
    "group": "project-experience",
    "requirements": [
      "database",
      "migrations",
      "filesystem",
      "project-root",
      "process-owning",
      "listener-port-owning",
      "browser-profile-owning",
      "cdp-session-owning",
      "immutable-fixture-input"
    ],
    "label": "independent project experience Browser owner",
    "args": [
      "--import",
      "tsx",
      "scripts/browser-validate-project-experience-v1.mjs"
    ],
    "timeoutMs": 360000,
    "requireNaturalExit": true
  },
  {
    "id": "project-client-browser",
    "group": "project-experience",
    "requirements": [
      "database",
      "migrations",
      "filesystem",
      "process-owning",
      "listener-port-owning",
      "browser-profile-owning",
      "cdp-session-owning"
    ],
    "label": "same-profile project clients, held saves and recoverable drafts in Browser",
    "args": [
      "--import",
      "tsx",
      "scripts/test-project-client-browser.ts"
    ],
    "timeoutMs": 60000,
    "requireNaturalExit": true
  },
  {
    "id": "web-planning-browser",
    "group": "project-experience",
    "requirements": [
      "database",
      "migrations",
      "filesystem",
      "process-owning",
      "listener-port-owning",
      "browser-profile-owning",
      "cdp-session-owning"
    ],
    "label": "durable web planning real D1 Browser producer and consumer",
    "args": [
      "--import",
      "tsx",
      "scripts/browser-validate-web-planning.mjs"
    ],
    "timeoutMs": 180000,
    "requireNaturalExit": true
  },
  {
    "id": "web-planning-draft-safety",
    "group": "project-experience",
    "requirements": [
      "database",
      "migrations",
      "filesystem",
      "process-owning",
      "listener-port-owning",
      "browser-profile-owning",
      "cdp-session-owning"
    ],
    "label": "Web draft mutation, provenance and erasure Browser controls",
    "args": [
      "--import",
      "tsx",
      "scripts/browser-validate-web-planning.mjs",
      "--draft-safety"
    ],
    "timeoutMs": 60000,
    "requireNaturalExit": true
  }
];
export function historicalSuite(count=4) {
  if(![3,4].includes(count))throw Error("unsupported historical fixture");
  const names=["projectExperienceStep","projectClientBrowserStep","webPlanningBrowserStep","webPlanningDraftSafetyStep"].slice(0,count);
  return historicalChildren.slice(0,count).map((v,i)=>i===3?`const ${names[i]} = {\n  ...webPlanningBrowserStep, id: ${JSON.stringify(v.id)}, label: ${JSON.stringify(v.label)},\n  ...rootNode(${v.args.slice(2).map(JSON.stringify).join(', ')}), timeoutMs: ${v.timeoutMs},\n};`:`const ${names[i]} = {\n  id: ${JSON.stringify(v.id)}, group: ${JSON.stringify(v.group)}, requirements: ${JSON.stringify(v.requirements)}, label: ${JSON.stringify(v.label)},\n  ...rootNode(${JSON.stringify(v.args[2])}), timeoutMs: ${v.timeoutMs}, requireNaturalExit: true,\n};`).join("\n")+'\nconst suites = { "e2e-project-experience": ['+names.map(name=>'{ ...'+name+' }').join(', ')+'] };\n';
}
