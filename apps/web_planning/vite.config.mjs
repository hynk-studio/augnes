import { defineConfig } from 'vite';
import { sites } from '@openai/sites-vite-plugin';
import { readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root=fileURLToPath(new URL('.',import.meta.url));
export default defineConfig(async () => {
  // The Cloudflare plugin can copy local secrets to dist. This artifact never
  // admits such inputs; production values belong to the Sites settings owner.
  if((await readdir(root)).some(name=>name.startsWith('.dev.vars') || name.startsWith('.env')))
    throw new Error('web_planning_build_refuses_local_environment_files');
  process.env.WRANGLER_SEND_METRICS='false';
  process.env.WRANGLER_WRITE_LOGS='false';
  process.env.CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV='false';
  const { cloudflare }=await import('@cloudflare/vite-plugin');
  return {
    root, publicDir:false, envDir:false,
    plugins:[{name:'web-planning-portable-boundary',generateBundle(){
      if([...this.getModuleIds()].some(id=>/\/runtime\/|better-sqlite|local-ingress|test-web-planning/.test(id)))
        this.error('nonportable_or_test_dependency_in_artifact');
    }},sites(),cloudflare({configPath:new URL('./wrangler.json',import.meta.url).pathname,
      viteEnvironment:{name:'server'},remoteBindings:false,inspectorPort:false,persistState:false})],
    // HTML and assets stay behind the existing authenticated Worker routes.
    builder:{async buildApp(builder){await builder.build(builder.environments.server);}},
  };
});
