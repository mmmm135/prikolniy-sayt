import fs from 'node:fs';
import path from 'node:path';

// Preserve one complete artist-authored branch, including its original UVs and normals.
const directory='public/models/work-shrub';
const source=JSON.parse(fs.readFileSync(path.join(directory,'shrub_04.gltf'),'utf8'));
const binary=fs.readFileSync(path.join(directory,'shrub_04.bin'));
function read(index){const a=source.accessors[index],view=source.bufferViews[a.bufferView];
 const Type=a.componentType===5126?Float32Array:Uint16Array;
 const channels={SCALAR:1,VEC2:2,VEC3:3}[a.type];
 return new Type(binary.buffer,binary.byteOffset+(view.byteOffset||0)+(a.byteOffset||0),a.count*channels);
}
const positions=read(0),uvs=read(1),normals=read(2),indices=read(3),count=positions.length/3;
const parents=Array.from({length:count},(_,i)=>i);
function find(i){while(parents[i]!==i){parents[i]=parents[parents[i]];i=parents[i];}return i;}
function union(a,b){parents[find(a)]=find(b);}
for(let i=0;i<indices.length;i+=3){union(indices[i],indices[i+1]);union(indices[i],indices[i+2]);}
const components=new Map();
for(let i=0;i<count;i++){const key=find(i);if(!components.has(key))components.set(key,[]);components.get(key).push(i);}
const selected=[...components.values()].filter(part=>part.reduce((sum,i)=>sum+positions[i*3],0)/part.length>-.095);
const wood=selected.filter(part=>part.reduce((sum,i)=>sum+uvs[i*2],0)/part.length>.70).flat();
if(!wood.length)throw Error('No original wood geometry');
const root=wood.reduce((a,i)=>positions[i*3+1]<positions[a*3+1]?i:a,wood[0]);
const origin=[positions[root*3],positions[root*3+1],positions[root*3+2]],scale=8;
const anchorByVertex=new Map(),metadataByVertex=new Map();
selected.forEach((part,k)=>{
 const leaf=part.reduce((sum,i)=>sum+uvs[i*2],0)/part.length<=.70;
 let attachment=part[0];
 if(leaf){let closest=Infinity;for(const i of part)for(const j of wood){
  const d=[0,1,2].reduce((sum,c)=>sum+(positions[i*3+c]-positions[j*3+c])**2,0);
  if(d<closest){closest=d;attachment=i;}
 }}
 const anchor=[0,1,2].map(c=>(positions[attachment*3+c]-origin[c])*scale);
 part.forEach(i=>{anchorByVertex.set(i,anchor);metadataByVertex.set(i,[leaf?1:0,(k*.61803398875)%1]);});
});
const oldToNew=new Map(),v=[],uv=[],normal=[],anchor=[],info=[];
for(const part of selected)for(const i of part){oldToNew.set(i,v.length/3);
 v.push(...[0,1,2].map(c=>(positions[i*3+c]-origin[c])*scale));
 uv.push(uvs[i*2],uvs[i*2+1]);normal.push(...normals.subarray(i*3,i*3+3));
 anchor.push(...anchorByVertex.get(i));info.push(...metadataByVertex.get(i));
}
const triangles=[];for(let i=0;i<indices.length;i+=3)if(oldToNew.has(indices[i]))triangles.push(...[indices[i],indices[i+1],indices[i+2]].map(j=>oldToNew.get(j)));
const chunks=[],views=[],accessors=[];let offset=0;
function add(data,type,componentType,target){const bytes=Buffer.from(data.buffer);const index=accessors.length;
 views.push({buffer:0,byteOffset:offset,byteLength:bytes.length,target});
 accessors.push({bufferView:views.length-1,componentType,count:data.length/({SCALAR:1,VEC2:2,VEC3:3}[type]),type});
 chunks.push(bytes);offset+=bytes.length;const pad=(4-offset%4)%4;if(pad){chunks.push(Buffer.alloc(pad));offset+=pad;}return index;
}
const attributes={POSITION:add(new Float32Array(v),'VEC3',5126,34962),TEXCOORD_0:add(new Float32Array(uv),'VEC2',5126,34962),NORMAL:add(new Float32Array(normal),'VEC3',5126,34962),_ANCHOR:add(new Float32Array(anchor),'VEC3',5126,34962),_LEAF_INFO:add(new Float32Array(info),'VEC2',5126,34962)};
accessors[0].min=[0,1,2].map(c=>Math.min(...v.filter((_,i)=>i%3===c)));
accessors[0].max=[0,1,2].map(c=>Math.max(...v.filter((_,i)=>i%3===c)));
const index=add(new Uint16Array(triangles),'SCALAR',5123,34963);
const result={...source,asset:{...source.asset,copyright:'Rico Cilliers / Poly Haven, CC0',extras:{source:'https://polyhaven.com/a/shrub_04',adaptation:'Fourth complete branch, root normalized; attachment metadata added for animation.'}},nodes:[{name:'PolyHaven_shrub04_branch04',mesh:0}],meshes:[{name:'Natural branch',primitives:[{attributes,indices:index,material:0}]}],accessors,bufferViews:views,buffers:[{uri:'natural-branch.bin',byteLength:offset}]};
fs.writeFileSync(path.join(directory,'natural-branch.bin'),Buffer.concat(chunks));
fs.writeFileSync(path.join(directory,'natural-branch.gltf'),JSON.stringify(result));
console.log({vertices:v.length/3,triangles:triangles.length/3,parts:selected.length,woodVertices:wood.length,bounds:accessors[0]});
