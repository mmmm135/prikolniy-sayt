import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';

// One complete Shrub 04 branch by Rico Cilliers / Poly Haven (CC0).
// Original leaf silhouettes, bark, UVs and normal maps remain intact.
export function createWorkBranch() {
 const scene = new THREE.Scene(), root = new THREE.Group();
 scene.add(root, new THREE.HemisphereLight(0xfff8e8,0x595044,2.4));
 const light = new THREE.DirectionalLight(0xfff6df,3.2);
 light.position.set(-500,600,900);scene.add(light);
 const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
 const textures = new Set<THREE.Texture>();
 const uniforms = {branchProgress:{value:0},branchTime:{value:0},branchImpulse:{value:0}};
 let disposed = false;

 const deformation = `
  uniform float branchProgress,branchTime,branchImpulse;
  attribute vec3 _anchor;
  attribute vec2 _leaf_info;
  mat3 turnZ(float a){float c=cos(a),s=sin(a);return mat3(c,s,0.,-s,c,0.,0.,0.,1.);}
  mat3 turnY(float a){float c=cos(a),s=sin(a);return mat3(c,0.,-s,0.,1.,0.,s,0.,c);}
  float leafOpen(){return smoothstep(.02+_anchor.y*.08,.36+_anchor.y*.19,branchProgress);}
  float leafWave(){return sin(branchTime*.87-_anchor.y*2.7+_leaf_info.y*6.28);}
  mat3 leafTurn(){
   float fold=(1.-leafOpen())*_leaf_info.x;
   float wave=leafWave()*_leaf_info.x;
   return turnY(fold*(.7+_leaf_info.y*.8)+wave*.095+branchImpulse*.14*_leaf_info.x)
    *turnZ(fold*(_leaf_info.y-.5)*1.15+wave*.038);
  }
  float bendAngle(float y){
   float reach=clamp(y/1.72,0.,1.);
   float open=smoothstep(.02,.78,branchProgress);
   return reach*reach*((1.-open)*.64+sin(branchTime*.61-reach*2.)*.035+branchImpulse*.18);
  }
  vec3 bend(vec3 p){
   float reach=clamp(p.y/1.72,0.,1.);
   p=turnZ(bendAngle(p.y))*p;
   p.z+=reach*reach*(sin(branchProgress*3.2)*.16+sin(branchTime*.43-reach*2.3)*.032);
   return p;
  }
 `;
 const release = () => {
  geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());
  root.clear();
 };
 const ready = Promise.all([
  new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync('/models/work-shrub/optimized.glb'),
  new THREE.TextureLoader().loadAsync('/models/work-shrub/textures/shrub_04_alpha_2k.webp'),
 ]).then(([gltf,alpha])=>{
  alpha.flipY=false;alpha.colorSpace=THREE.NoColorSpace;textures.add(alpha);
  gltf.scene.traverse(object=>{
   if(!(object instanceof THREE.Mesh))return;
   geometries.add(object.geometry);
   const source = (Array.isArray(object.material)?object.material:[object.material]) as THREE.MeshStandardMaterial[];
   source.forEach(material=>{
    materials.add(material);
    [material.map,material.normalMap,material.roughnessMap,material.metalnessMap].forEach(t=>{if(t)textures.add(t);});
    material.alphaMap=alpha;material.alphaTest=.45;material.alphaToCoverage=true;
    material.side=THREE.DoubleSide;material.metalness=0;material.roughness=.86;
    material.onBeforeCompile=shader=>{
     Object.assign(shader.uniforms,uniforms);
     shader.vertexShader=deformation+shader.vertexShader;
     shader.vertexShader=shader.vertexShader.replace('#include <beginnormal_vertex>',`
      #include <beginnormal_vertex>
      objectNormal=turnZ(bendAngle(position.y))*leafTurn()*objectNormal;
     `).replace('#include <begin_vertex>',`
      vec3 localLeaf=position-_anchor;
      localLeaf=leafTurn()*localLeaf*mix(1.,.42+.58*leafOpen(),_leaf_info.x);
      vec3 transformed=bend(_anchor+localLeaf);
     `);
    };
    material.customProgramCacheKey=()=> 'polyhaven-natural-bough-v1';
   });
   // The animated shoot can move beyond the original mesh's static bounds.
   object.frustumCulled=false;
  });
  if(disposed){release();return;}
  root.add(gltf.scene);
 });
 const draw = (progress:number,width:number,height:number,time=0,impulse=0) => {
  uniforms.branchProgress.value=progress;uniforms.branchTime.value=time;uniforms.branchImpulse.value=impulse;
  const mobile=width<=700,scale=Math.min(height*(mobile?.33:.43),width*(mobile?.65:.30));
  root.scale.setScalar(scale);
  root.position.set(width*(mobile?.515:.455),height*.535,0);
  root.rotation.set(0,-.18+progress*.32,2.42+progress*.12+Math.sin(time*.47)*.012);
 };
 const dispose = () => {disposed=true;release();};
 return {scene,ready,draw,dispose};
}
