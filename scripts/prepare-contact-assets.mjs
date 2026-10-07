import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'file:///C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp/dist/index.mjs';

// Original artist geometry, skeleton and wing animation are preserved.
// Source URLs and licences are listed in public/ASSET-CREDITS.md.
const source='work/contact-source',destination='public/models/meadow';
await fs.mkdir(destination,{recursive:true});
for(const [name,folder] of [['grass_medium_01','grass']]){
 const from=path.join(source,name),to=path.join(destination,folder);
 await fs.mkdir(to,{recursive:true});
 const model=JSON.parse(await fs.readFile(path.join(from,`${name}.gltf`),'utf8'));
 await fs.copyFile(path.join(from,`${name}.bin`),path.join(to,'geometry.bin'));
 model.buffers[0].uri='geometry.bin';
 await sharp(path.join(from,'textures',`${name}_diff_1k.jpg`)).jpeg({quality:85}).toFile(path.join(to,'colour.jpg'));
 await sharp(path.join(from,'alpha.png')).png({compressionLevel:9}).toFile(path.join(to,'alpha.png'));
 model.images=[{uri:'colour.jpg'}];model.textures=[{source:0,sampler:0}];
 model.materials=[{doubleSided:true,pbrMetallicRoughness:{baseColorTexture:{index:0},metallicFactor:0,roughnessFactor:.92}}];
 await fs.writeFile(path.join(to,'model.gltf'),JSON.stringify(model));
}
const model=JSON.parse(await fs.readFile(path.join(source,'butterfly','butterfly.gltf'),'utf8'));
const binary=Buffer.from(model.buffers[0].uri.split(',')[1],'base64');
const imageViews=new Set(model.images.map(image=>image.bufferView));
const colourImage=model.images[model.textures[model.materials[0].pbrMetallicRoughness.baseColorTexture.index].source];
const colourView=model.bufferViews[colourImage.bufferView];
await sharp(binary.subarray(colourView.byteOffset,colourView.byteOffset+colourView.byteLength)).resize(1024,1024,{fit:'inside'}).jpeg({quality:90}).toFile(path.join(destination,'butterfly-colour.jpg'));
const views=[],parts=[],indices=new Map();let offset=0;
model.bufferViews.forEach((view,index)=>{
 if(imageViews.has(index))return;
 indices.set(index,views.length);
 views.push({...view,buffer:0,byteOffset:offset});
 const bytes=binary.subarray(view.byteOffset||0,(view.byteOffset||0)+view.byteLength);
 parts.push(bytes);offset+=bytes.length;
 const padding=(4-offset%4)%4;if(padding){parts.push(Buffer.alloc(padding));offset+=padding;}
});
model.accessors.forEach(accessor=>{if(accessor.bufferView!==undefined)accessor.bufferView=indices.get(accessor.bufferView);});
model.bufferViews=views;model.buffers=[{uri:'butterfly.bin',byteLength:offset}];
model.images=[{uri:'butterfly-colour.jpg'}];model.textures=[{source:0,sampler:0}];
model.materials=[{doubleSided:true,pbrMetallicRoughness:{baseColorTexture:{index:0},metallicFactor:0,roughnessFactor:.8}}];
model.asset.copyright='Butterfly by Tyler Lazzareschi, CC BY 4.0. Rig and animation: Jiajun Li, Haoquan Liang, Shineng Tang.';
await fs.writeFile(path.join(destination,'butterfly.bin'),Buffer.concat(parts));
await fs.writeFile(path.join(destination,'butterfly.gltf'),JSON.stringify(model));
console.log('Meadow assets prepared; butterfly geometry and animation:',offset,'bytes');
