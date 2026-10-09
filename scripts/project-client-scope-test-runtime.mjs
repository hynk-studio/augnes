import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const ts = require('typescript');

// These causal hook tests control React commits and transport. Evaluate the
// production scope/header helpers too, so a dependency mock cannot hide scope
// loss. Only the context value is supplied by the test's synthetic React host.
export function loadProjectClientScopeTestRuntime({ react, fetch, projectId }) {
  const evaluate = (pathname, dependencies, globals = {}) => {
    const source = readFileSync(new URL(`../${pathname}`, import.meta.url), 'utf8');
    const code = ts.transpileModule(source, { compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
    } }).outputText;
    const exports = {};
    vm.runInNewContext(code, { exports, ...globals, require: name => {
      assert(Object.hasOwn(dependencies, name), `unexpected scope helper dependency: ${name}`);
      return dependencies[name];
    } });
    return exports;
  };
  const href = evaluate('lib/vnext/project-client-href.ts', {}, { URL, URLSearchParams });
  return evaluate('components/workbench/semantic-review/project-client-scope.tsx', {
    react: { ...react, createContext: () => ({}), useContext: () => projectId },
    'react/jsx-runtime': require('react/jsx-runtime'),
    '@/lib/vnext/project-client-href': href,
  }, { fetch, Headers, URL });
}
