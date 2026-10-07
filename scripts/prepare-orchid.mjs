import fs from 'node:fs/promises';
import {OBJLoader} from 'three/addons/loaders/OBJLoader.js';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import {Vector3,Quaternion} from 'three';
import sharp from 'file:///C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp/dist/index.mjs';

// Artec 3D's real scanned orchid, CC BY 4.0. Only normalize its orientation
// and compress its original surface. The tall stalk is articulated at runtime.
const directory='work/contact-source/orchid/Flower.obj',out='public/models/meadow/orchid';
await fs.mkdir(out,{recursive:true});
const root=new OBJLoader().parse(await fs.readFile(`${directory}/Flower.obj`,'utf8'));
const mesh=root.children.find(o=>o.isMesh);mesh.geometry.deleteAttribute('normal');
const geometry=mergeVertices(mesh.geometry,1e-3);geometry.computeVertexNormals();
const image=await sharp(`${directory}/Flower_0.jpg`).raw().toBuffer({resolveWithObject:true});
const p=geometry.attributes.position,uv=geometry.attributes.uv,n=geometry.attributes.normal;
const flower=new Vector3(),stem=[];let flowers=0;
for(let i=0;i<p.count;i++){
 const x=Math.max(0,Math.min(image.info.width-1,Math.floor(uv.getX(i)*image.info.width))),y=Math.max(0,Math.min(image.info.height-1,Math.floor((1-uv.getY(i))*image.info.height))),at=(y*image.info.width+x)*image.info.channels;
 const r=image.data[at],g=image.data[at+1],b=image.data[at+2],v=new Vector3().fromBufferAttribute(p,i);
 if(g>b*1.35&&r>b*1.35)stem.push(v);
 if(r>g*1.25&&b>g*1.2){flower.add(v);flowers++;}
}
flower.divideScalar(flowers);stem.sort((a,b)=>b.distanceToSquared(flower)-a.distanceToSquared(flower));
const tip=stem.slice(0,Math.max(1,Math.floor(stem.length*.015))).reduce((v,p)=>v.add(p),new Vector3()).divideScalar(Math.max(1,Math.floor(stem.length*.015)));
const up=flower.clone().sub(tip).normalize(),turn=new Quaternion().setFromUnitVectors(up,new Vector3(0,1,0));
geometry.translate(-flower.x,-flower.y,-flower.z);geometry.applyQuaternion(turn);
geometry.computeBoundingBox();let bounds=geometry.boundingBox;
const scale=1.6/Math.max(bounds.max.x-bounds.min.x,bounds.max.z-bounds.min.z);geometry.scale(scale,scale,scale);
// Lengthen only the existing narrow scanned stalk, leaving all petals intact.
for(let i=0;i<p.count;i++)if(p.getY(i)<-.48&&Math.hypot(p.getX(i),p.getZ(i))<.24){p.setY(i,-.48+(p.getY(i)+.48)*4.4);}
geometry.computeVertexNormals();
geometry.computeBoundingBox();console.log('Orchid',p.count,'vertices; source flower centre',flower.toArray(),'stem tip',tip.toArray(),'bounds',geometry.boundingBox.min.toArray(),geometry.boundingBox.max.toArray());
const parts=[],views=[],accessors=[];let offset=0;
function add(array,type,componentType,normalized=false){
 const bytes=Buffer.from(array.buffer,array.byteOffset,array.byteLength),pad=(4-offset%4)%4;if(pad){parts.push(Buffer.alloc(pad));offset+=pad;}
 views.push({buffer:0,byteOffset:offset,byteLength:bytes.length});parts.push(bytes);offset+=bytes.length;
 const size={SCALAR:1,VEC2:2,VEC3:3}[type],accessor={bufferView:views.length-1,componentType,count:array.length/size,type};if(normalized)accessor.normalized=true;
 accessors.push(accessor);return accessors.length-1;
}
const positions=new Int16Array(p.count*3),normals=new Int8Array(p.count*3),uvs=new Uint16Array(p.count*2);
for(let i=0;i<p.count;i++){for(let d=0;d<3;d++){positions[i*3+d]=Math.round(p.array[i*3+d]*8000);normals[i*3+d]=Math.round(n.array[i*3+d]*127);}uvs[i*2]=Math.round(Math.max(0,Math.min(1,uv.getX(i)))*65535);uvs[i*2+1]=Math.round(Math.max(0,Math.min(1,uv.getY(i)))*65535);}
const POSITION=add(positions,'VEC3',5122),NORMAL=add(normals,'VEC3',5120,true),TEXCOORD_0=add(uvs,'VEC2',5123,true),indices=add(new Uint32Array(geometry.index.array),'SCALAR',5125);
accessors[POSITION].min=geometry.boundingBox.min.toArray().map(x=>Math.floor(x*8000));accessors[POSITION].max=geometry.boundingBox.max.toArray().map(x=>Math.ceil(x*8000));
await fs.writeFile(`${out}/model.bin`,Buffer.concat(parts));
await sharp(`${directory}/Flower_0.jpg`).resize(1024,1024,{fit:'inside'}).jpeg({quality:86}).toFile(`${out}/colour.jpg`);
const model={asset:{version:'2.0',copyright:'Flower by Artec 3D, CC BY 4.0. https://www.artec3d.com/3d-models/flower'},extensionsUsed:['KHR_mesh_quantization'],extensionsRequired:['KHR_mesh_quantization'],scene:0,scenes:[{nodes:[0]}],nodes:[{mesh:0,scale:[1/8000,1/8000,1/8000]}],meshes:[{primitives:[{attributes:{POSITION,NORMAL,TEXCOORD_0},indices,material:0}]}],materials:[{doubleSided:true,pbrMetallicRoughness:{baseColorTexture:{index:0},roughnessFactor:.95,metallicFactor:0}}],textures:[{source:0}],images:[{uri:'colour.jpg'}],buffers:[{uri:'model.bin',byteLength:offset}],bufferViews:views,accessors};
await fs.writeFile(`${out}/model.gltf`,JSON.stringify(model));
await fs.writeFile(`${out}/anatomy.json`,JSON.stringify({stemTip:tip.clone().sub(flower).applyQuaternion(turn).multiplyScalar(scale).toArray(),minY:geometry.boundingBox.min.y}));

