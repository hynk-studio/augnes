import { selectedPackageShellInvocation } from "./local-canonical-selected-execution.mjs";
import { runCanonicalChild, canonicalChildAcceptanceFailure } from "./canonical-child-runner.mjs";

// The enclosing unchanged phase/child deadline remains the deciding bound.
// This finite ceiling is the existing longest Canonical phase, not an extension.
const selected=selectedPackageShellInvocation(process.env,process.cwd());
const result=await runCanonicalChild({suite:"selected-package",label:"package lifecycle shell",command:selected.command,args:process.argv.slice(2),
  cwd:process.cwd(),env:selected.env,timeoutMs:4_200_000,stdout:process.stdout,stderr:process.stderr,log(){},
});
process.exitCode=canonicalChildAcceptanceFailure(result,{suite:"selected-package",timeoutMs:4_200_000,requireNaturalExit:true})===null?0:result.exit_code||1;
