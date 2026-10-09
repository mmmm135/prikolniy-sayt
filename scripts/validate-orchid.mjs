import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Box3,Matrix4,Quaternion,Vector3} from 'three';

async function bounds(relative){
 const bytes=await readFile(new URL(`../public/models/meadow/orchid/${relative}`,import.meta.url));
 const document=JSON.parse(relative.endsWith('.glb')?bytes.subarray(20,20+bytes.readUInt32LE(12)).toString():bytes.toString());
 const result=new Box3();
 const visit=(index,parent)=>{
  const node=document.nodes[index];
  const local=node.matrix?new Matrix4().fromArray(node.matrix):new Matrix4().compose(new Vector3().fromArray(node.translation||[0,0,0]),new Quaternion().fromArray(node.rotation||[0,0,0,1]),new Vector3().fromArray(node.scale||[1,1,1]));
  const world=parent.clone().multiply(local);
  if(node.mesh!==undefined)for(const primitive of document.meshes[node.mesh].primitives){
   const a=document.accessors[primitive.attributes.POSITION];
   assert(a.min&&a.max,'Position bounds required');
   const divisor=a.normalized?({5120:127,5121:255,5122:32767,5123:65535}[a.componentType]||1):1;
   const point=values=>new Vector3().fromArray(values.map(v=>Math.max(a.normalized?-1:-Infinity,v/divisor)));
   result.union(new Box3(point(a.min),point(a.max)).applyMatrix4(world));
  }
  for(const child of node.children||[])visit(child,world);
 };
 for(const node of document.scenes[document.scene||0].nodes)visit(node,new Matrix4());
 return result;
}
const source=await bounds('model.gltf'),prepared=await bounds('orchid-print.glb');
const size=source.getSize(new Vector3());
for(const axis of ['x','y','z']){
 assert(prepared.max[axis]-prepared.min[axis]>size[axis]*.95,`Orchid collapsed on ${axis}`);
 assert(Math.abs(source.min[axis]-prepared.min[axis])<size[axis]*.01,`Orchid lower bound changed on ${axis}`);
 assert(Math.abs(source.max[axis]-prepared.max[axis])<size[axis]*.01,`Orchid upper bound changed on ${axis}`);
}
console.log('PASS orchid preserves source bounds on all three axes');
