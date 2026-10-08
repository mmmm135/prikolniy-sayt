import {readdir,readFile,realpath,stat,unlink} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const repository=fileURLToPath(new URL('../',import.meta.url));
const output=path.resolve(repository,'out');
if(!(await realpath(output)).startsWith((await realpath(repository))+path.sep))throw Error('Resolved export escaped repository');
// An explicit set supports computed shader/video URLs that static source scanning misses.
// Source files in public remain available for future artwork revisions.
const assets=new Set([
 'art/loading-butterfly-filmstrip.webp',
 'art/hero-desktop.webp','art/hero-mobile.webp','art/night-valley-render.webp','art/night-valley-sample.webp',
 'art/rose-print.webm','art/work-rock-sample.webp','art/studio-hand-sample.webp','art/work-herd-print.mp4','art/work-herd-poster.webp',
 'models/bird.glb','models/work-stork.glb','models/work-shrub/optimized.glb','models/work-shrub/textures/shrub_04_alpha_2k.webp',
 'models/meadow/grass/optimized.glb','models/meadow/grass/alpha.webp','models/meadow/orchid/optimized.glb','models/meadow/butterfly-optimized.glb',
]);
let retained=0,removed=0;
const keepAsset=relative=>assets.has(relative)||/^fonts\/[^/]+\.woff2$/.test(relative)||/^concepts\/[^/]+\.(html|css|js|webp|svg)$/.test(relative)||/\.(md|txt)$/.test(relative);
async function validateReferences(directory){
 for(const entry of await readdir(directory,{withFileTypes:true})){
  const absolute=path.join(directory,entry.name);
  if(entry.isDirectory()){await validateReferences(absolute);continue;}
  if(!/\.(js|css|html)$/.test(entry.name))continue;
  const source=await readFile(absolute,'utf8');
  for(const match of source.matchAll(/\/(?:art|images|models|fonts|concepts)\/[a-zA-Z0-9_./-]+\.(?:png|jpe?g|webp|woff2?|ttf|mp4|webm|glb|gltf)/g)){
   const relative=match[0].slice(1);
   if(!keepAsset(relative))throw Error(`Referenced media missing from export policy: ${relative}`);
   await stat(path.join(output,relative));
  }
 }
}
for(const asset of assets)await stat(path.join(output,asset));
await validateReferences(output);
async function walk(directory){
 for(const entry of await readdir(directory,{withFileTypes:true})){
  const absolute=path.resolve(directory,entry.name);
  if(!absolute.startsWith(output+path.sep))throw Error('Export path escaped output directory');
  if(entry.isDirectory()){await walk(absolute);continue;}
  if(!entry.isFile())throw Error(`Unexpected export symlink: ${absolute}`);
  const relative=path.relative(output,absolute).replaceAll('\\','/'),size=(await stat(absolute)).size;
  const keep=keepAsset(relative);
  if(keep)retained+=size;else{await unlink(absolute);removed+=size;}
 }
}
for(const directory of ['art','images','models','fonts','concepts']){
 try{await walk(path.join(output,directory));}catch(error){if(error.code!=='ENOENT')throw error;}
}
for(const asset of assets)await stat(path.join(output,asset));
console.log(`Export media retained: ${(retained/1e6).toFixed(2)} MB; unused source copies removed: ${(removed/1e6).toFixed(2)} MB`);
