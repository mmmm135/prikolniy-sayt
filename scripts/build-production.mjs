import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
await import('./validate-orchid.mjs');
const next=fileURLToPath(new URL('../node_modules/next/dist/bin/next',import.meta.url));
const code=await new Promise((resolve,reject)=>{
 const child=spawn(process.execPath,[next,'build'],{stdio:'inherit'});
 child.on('error',reject);child.on('exit',resolve);
});
if(code!==0)process.exit(code||1);
await import('./prune-export-assets.mjs');
