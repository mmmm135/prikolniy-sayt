import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {clamp,ease} from './scroll-scene';

const ramp=(a:number,b:number,p:number)=>ease((p-a)/(b-a));
type Wing={bone:THREE.Object3D,rest:THREE.Quaternion,axis:THREE.Vector3,sign:number,hind:boolean};

// Shape and lighting are sampled into discrete marks. No original surface or
// continuous silhouette is visible. Credits: /ASSET-CREDITS.md.
export function createContactMeadow(canvas:HTMLCanvasElement){
 const renderer=new THREE.WebGLRenderer({canvas,antialias:false,alpha:false,powerPreference:'high-performance'});
 renderer.setPixelRatio(1);renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
 const scene=new THREE.Scene(),subjectScene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(43,1,.05,130);
 scene.background=new THREE.Color('#ffffff');scene.fog=new THREE.FogExp2('#ffffff',.039);
 for(const world of [scene,subjectScene]){
  world.add(new THREE.HemisphereLight(0xfff6df,0x61513e,2.6));
  const sun=new THREE.DirectionalLight(0xffe6b2,3.1);sun.position.set(-8,12,8);world.add(sun);
 }
 const target=new THREE.WebGLRenderTarget(1,1,{depthBuffer:true}),subjectTarget=new THREE.WebGLRenderTarget(1,1,{depthBuffer:true});
 target.depthTexture=new THREE.DepthTexture(1,1,THREE.UnsignedIntType);
 const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>();
 const windUniforms={windTime:{value:0}},legUniforms={deployment:{value:0}};
 let disposed=false,loaded=false,width=1,elapsed=0,lastTime=0,perchedTime=0,wasPerched=false;
 const bloom=new THREE.Group(),insect=new THREE.Group();subjectScene.add(bloom,insect);
 const landing=new THREE.Vector3(0,3.4,0),normal=new THREE.Vector3(0,1,0),position=new THREE.Vector3(),look=new THREE.Vector3();
 const wings:Wing[]=[];let footHeight=.13;
 let crossing:THREE.CatmullRomCurve3,following:THREE.CatmullRomCurve3,approach:THREE.CubicBezierCurve3;
 const flightRotation=new THREE.Quaternion(),perchRotation=new THREE.Quaternion(),turn=new THREE.Quaternion();
 const postScene=new THREE.Scene(),postCamera=new THREE.Camera();
 const print=new THREE.ShaderMaterial({
  depthTest:false,depthWrite:false,
  uniforms:{image:{value:target.texture},subject:{value:subjectTarget.texture},depth:{value:target.depthTexture},focus:{value:6},resolution:{value:new THREE.Vector2()},progress:{value:0}},
  vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position,1.);}',
  fragmentShader:`
   precision highp float;varying vec2 vUv;
   uniform sampler2D image,subject,depth;uniform vec2 resolution;uniform float progress,focus;
   float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
   float lum(vec3 p){p=mix(p*12.92,1.055*pow(max(p,vec3(0.)),vec3(.416667))-.055,step(vec3(.0031308),p));return dot(p,vec3(.299,.587,.114));}
   vec3 fieldSample(vec2 uv){
    float z=texture2D(depth,uv).x*2.-1.;float distance=13./(130.05-z*129.95);
    vec2 px=smoothstep(1.,5.,abs(distance-focus))*4.*smoothstep(.35,.54,progress)/resolution;
    return texture2D(image,uv).rgb*.4+(texture2D(image,uv+px).rgb+texture2D(image,uv-px).rgb+texture2D(image,uv+px*vec2(1.,-1.)).rgb+texture2D(image,uv+px*vec2(-1.,1.)).rgb)*.15;
   }
   float incision(float weight,vec2 cell,vec2 grid){
    vec2 local=fract(vUv*resolution/grid);
    float jitter=(hash(cell)-.5)*.14;
    float line=abs(local.x-.5+jitter)*2.,aa=max(fwidth(line),.035);
    float stroke=1.-smoothstep(weight-aa,weight+aa,line);
    float bottom=.015+hash(cell+37.)*.035,top=.96+hash(cell+14.)*.02;
    return stroke*smoothstep(bottom,bottom+.025,local.y)*(1.-smoothstep(top,top+.025,local.y));
   }
   void main(){
    float mobile=1.-step(700.,resolution.x);
    vec3 paper=vec3(.788,.722,.580),ink=vec3(.161,.161,.126);
    vec2 fieldGrid=vec2(mix(4.2,3.3,mobile),9.);
    vec2 fieldCell=floor(vUv*resolution/fieldGrid),fieldUv=(fieldCell+.5)*fieldGrid/resolution;
    float fieldWeight=clamp((.86-lum(fieldSample(fieldUv)))*1.65,0.,.9);
    float fieldMark=incision(fieldWeight,fieldCell,fieldGrid)*smoothstep(.02,.1,fieldWeight);
    fieldMark*=1.-smoothstep(.38,.76,progress)*.83;
    vec3 colour=mix(paper,ink,fieldMark);

    // The sampled cells alone create the subject: edges and detail are reduced
    // to the same coarse grid as the earlier scenes, with broken stroke ends.
    vec2 grid=vec2(mix(4.6,3.2,mobile),mix(10.,8.,mobile));
    vec2 cell=floor(vUv*resolution/grid),sampleUv=(cell+.5)*grid/resolution;
    vec4 shape=texture2D(subject,sampleUv);
    float coverage=smoothstep(.25,.75,shape.a);
    float weight=clamp(.04+pow(max(0.,1.-lum(shape.rgb)),1.8)*.95,.045,.85);
    float mark=incision(weight,cell,grid)*coverage;
    colour=mix(colour,paper,coverage);colour=mix(colour,ink,mark);
    colour+=(hash(floor(vUv*resolution))-.5)*.024;
    float reveal=smoothstep(.015,.18,progress)*smoothstep(.025,.22,progress+vUv.y*.035);
    gl_FragColor=vec4(mix(ink,colour,reveal),1.);
   }
  `,
 });materials.add(print);
 const quad=new THREE.PlaneGeometry(2,2);geometries.add(quad);postScene.add(new THREE.Mesh(quad,print));
 const terrain=(x:number,z:number)=>Math.sin(x*.12+z*.09)*.48+Math.cos(z*.14-x*.06)*.34-.34;
 const groundGeometry=new THREE.PlaneGeometry(160,150,85,75);groundGeometry.rotateX(-Math.PI/2);
 const gp=groundGeometry.getAttribute('position');for(let i=0;i<gp.count;i++)gp.setY(i,terrain(gp.getX(i),gp.getZ(i)-32));
 groundGeometry.computeVertexNormals();geometries.add(groundGeometry);
 const groundMaterial=new THREE.MeshStandardMaterial({color:'#c6c7af',roughness:1});materials.add(groundMaterial);
 const ground=new THREE.Mesh(groundGeometry,groundMaterial);ground.position.z=-32;scene.add(ground);
 let seed=3041;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
 const ready=Promise.all([
  loader.loadAsync('/models/meadow/grass/optimized.glb'),loader.loadAsync('/models/meadow/orchid/orchid-print.glb'),
  loader.loadAsync('/models/meadow/butterfly-optimized.glb'),new THREE.TextureLoader().loadAsync('/models/meadow/grass/alpha.webp'),
 ]).then(([grass,orchid,butterfly,alpha])=>{
  alpha.flipY=false;alpha.colorSpace=THREE.NoColorSpace;textures.add(alpha);
  const sources:THREE.Mesh[]=[];grass.scene.traverse(o=>{if(o instanceof THREE.Mesh)sources.push(o);});
  const dummy=new THREE.Object3D(),mobile=innerWidth<700,plantCount=mobile?2800:5700;
  for(const index of [0,3,4]){
   const source=sources[index],geometry=source.geometry.clone(),material=(source.material as THREE.MeshStandardMaterial).clone();
   geometries.add(geometry);materials.add(material);if(material.map)textures.add(material.map);
   geometry.computeBoundingBox();const box=geometry.boundingBox!,scale=1/(box.max.y-box.min.y);
   geometry.translate(0,-box.min.y,0);geometry.scale(scale,scale,scale);
   material.alphaMap=alpha;material.alphaTest=.42;material.transparent=false;material.side=THREE.DoubleSide;
   material.onBeforeCompile=shader=>{
    Object.assign(shader.uniforms,windUniforms);shader.vertexShader='uniform float windTime;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`
     #include <begin_vertex>
     vec3 origin=instanceMatrix[3].xyz;
     float reach=max(position.y,0.);
     float breeze=sin(windTime*.67+origin.x*.32+origin.z*.19-position.y*.65);
     transformed.x+=reach*reach*(breeze*.055+sin(windTime*1.4+origin.z*.4+position.x*3.)*.013);
     transformed.z+=reach*reach*sin(windTime*.57+origin.x*.24)*.027;
    `);
   };material.customProgramCacheKey=()=> 'contact-meadow-breeze';
   const plants=new THREE.InstancedMesh(geometry,material,Math.ceil(plantCount/3));plants.frustumCulled=false;
   for(let i=0;i<plants.count;i++){
    const x=(random()-.5)*54,z=random()*65-55;
    dummy.position.set(x,terrain(x,z),z);dummy.rotation.set(0,random()*6.28,0);
    dummy.scale.setScalar(.65+random()*.9);dummy.updateMatrix();plants.setMatrixAt(i,dummy.matrix);
    plants.setColorAt(i,new THREE.Color().setHSL(.14,.15,.55+random()*.12));
   }scene.add(plants);
  }
  sources.forEach(o=>{o.geometry.dispose();(o.material as THREE.Material).dispose();});
  orchid.scene.position.y=3.42;bloom.add(orchid.scene);bloom.position.y=terrain(0,0);
  orchid.scene.traverse(o=>{if(o instanceof THREE.Mesh){geometries.add(o.geometry);const m=o.material as THREE.MeshStandardMaterial;materials.add(m);if(m.map)textures.add(m.map);}});
  bloom.updateMatrixWorld(true);
  // Raycast against the scanned petal: the perch isn't a guessed flower centre.
  const ray=new THREE.Raycaster(new THREE.Vector3(-.34,5,.29),new THREE.Vector3(0,-1,0));
  const contact=ray.intersectObject(orchid.scene,true)[0];
  if(contact){landing.copy(contact.point);if(contact.face)normal.copy(contact.face.normal).transformDirection(contact.object.matrixWorld);}
  else landing.set(.12,3.38,.29);
  if(normal.y<0)normal.negate();normal.lerp(new THREE.Vector3(0,1,0),.65).normalize();
  landing.y-=bloom.position.y;
  butterfly.scene.updateMatrixWorld(true);
  butterfly.scene.traverse(o=>{if(o instanceof THREE.SkinnedMesh){o.skeleton.update();o.computeBoundingBox();}});
  const bounds=new THREE.Box3().setFromObject(butterfly.scene),center=bounds.getCenter(new THREE.Vector3()),span=bounds.getSize(new THREE.Vector3()).x;
  const body=new THREE.Group();body.add(butterfly.scene);body.scale.setScalar(1.3/span);
  footHeight=(center.y-bounds.min.y)*body.scale.x;
  const head=new THREE.Vector3();let headCount=0;
  butterfly.scene.traverse(o=>{
   if(!(o instanceof THREE.SkinnedMesh))return;
   const joints=o.geometry.getAttribute('skinIndex'),weights=o.geometry.getAttribute('skinWeight');
   // Bone.002 carries the head and forelegs; Bone.008 is the abdomen tip.
   const jointIndex=o.skeleton.bones.findIndex(b=>b.name==='Bone002'||b.name==='Bone.002');
   for(let i=0;i<joints.count;i++)for(let k=0;k<4;k++)if(joints.getComponent(i,k)===jointIndex&&weights.getComponent(i,k)>.3){head.add(o.getVertexPosition(i,new THREE.Vector3()).applyMatrix4(o.matrixWorld));headCount++;break;}
  });
  if(!headCount)head.set(center.x,center.y,center.z-.2);else head.divideScalar(headCount);
  const forward=head.sub(center);forward.y=0;forward.normalize();
  for(const [name,side,hind] of [['Bone009',1,false],['Bone004',1,true],['Bone019',-1,false],['Bone026',-1,true]] as const){
   const bone=butterfly.scene.getObjectByName(name)||butterfly.scene.getObjectByName(name.replace('Bone','Bone.'));
   if(!bone)throw Error(`Missing butterfly wing hinge ${name}`);
   const axis=forward.clone().applyQuaternion(bone.parent!.getWorldQuaternion(new THREE.Quaternion()).invert());
   const outward=bone.getWorldPosition(new THREE.Vector3()).sub(center);
   const sign=Math.sign(new THREE.Vector3().crossVectors(forward,outward).y)||-side;
   wings.push({bone,rest:bone.quaternion.clone(),axis,sign,hind});
  }
  butterfly.scene.position.sub(center);body.rotation.y=-Math.atan2(forward.x,forward.z);insect.add(body);insect.visible=false;
  butterfly.scene.traverse(o=>{
   if(!(o instanceof THREE.Mesh))return;o.frustumCulled=false;geometries.add(o.geometry);
   const p=o.geometry.getAttribute('position'),legMask=new Float32Array(p.count);
   for(let i=0;i<p.count;i++)legMask[i]=Math.abs(p.getX(i))<.24&&p.getY(i)<-.09?Math.min(1,(-p.getY(i)-.09)*4):0;
   o.geometry.setAttribute('_leg_reach',new THREE.BufferAttribute(legMask,1));
   for(const m of Array.isArray(o.material)?o.material:[o.material]){
    const material=m as THREE.MeshStandardMaterial;materials.add(material);if(material.map)textures.add(material.map);
    material.onBeforeCompile=shader=>{
     Object.assign(shader.uniforms,legUniforms);shader.vertexShader='uniform float deployment;attribute float _leg_reach;\n'+shader.vertexShader;
     shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.y+=_leg_reach*(1.-deployment)*.16;');
    };material.customProgramCacheKey=()=> 'butterfly-leg-approach';
   }
  });
  landing.addScaledVector(normal,footHeight);
  crossing=new THREE.CatmullRomCurve3([new THREE.Vector3(9,4.9,5.4),new THREE.Vector3(4.3,4.85,5.3),new THREE.Vector3(-1.2,5.05,4.5),new THREE.Vector3(-5.3,4.85,3.5)],false,'centripetal');
  following=new THREE.CatmullRomCurve3([crossing.getPoint(1),crossing.getPoint(1).addScaledVector(crossing.getTangent(1),3.7),new THREE.Vector3(-8.6,4.6,-2.8),new THREE.Vector3(-5.7,4.4,-5.2),new THREE.Vector3(-2.3,4.25,-3.9),landing.clone().add(new THREE.Vector3(.3,.9,-1.25))],false,'centripetal');
  approach=new THREE.CubicBezierCurve3(following.getPoint(1),following.getPoint(1).addScaledVector(following.getTangent(1),.7),landing.clone().add(new THREE.Vector3(0,.18,-.09)),landing.clone());
  perchRotation.setFromUnitVectors(new THREE.Vector3(0,1,0),normal);
  if(disposed){release();return;}loaded=true;
 });
 const resize=(w:number,h:number)=>{
  width=w;const ratio=Math.min(devicePixelRatio,width<700?1.2:1.4);
  renderer.setSize(Math.round(w*ratio),Math.round(h*ratio),false);
  target.setSize(Math.round(w*ratio),Math.round(h*ratio));subjectTarget.setSize(Math.round(w*ratio),Math.round(h*ratio));
  camera.aspect=w/h;camera.updateProjectionMatrix();print.uniforms.resolution.value.set(w,h);
 };
 const draw=(p:number,time:number,reduced=false)=>{
  if(disposed)return;const delta=lastTime?Math.min(.05,(time-lastTime)*.001):0;lastTime=time;
  if(!reduced)elapsed+=delta;windUniforms.windTime.value=elapsed;
  const progress=reduced?1:p,mobile=width<700,catchUp=ramp(.335,.475,progress),settle=ramp(.80,.92,progress);
  const touchdown=.795,isPerched=progress>=touchdown;
  if(loaded&&isPerched){if(!wasPerched)perchedTime=0;if(!reduced)perchedTime+=delta;}else perchedTime=0;
  wasPerched=isPerched;
  print.uniforms.progress.value=progress;
  // Let the stalk quieten as the feet arrive, then resume its breeze together
  // with the perched insect. This keeps the contact continuous at touchdown.
  const stalkMotion=1-ramp(.70,touchdown,progress)+(isPerched?ramp(0,1.2,perchedTime):0);
  bloom.rotation.z=reduced?0:Math.sin(elapsed*.6)*.008*stalkMotion;bloom.updateMatrixWorld(true);
  let tangent=new THREE.Vector3(-1,0,0);
  if(loaded){
   if(progress<.385){const u=clamp((progress-.16)/.225);crossing.getPointAt(u,position);tangent=crossing.getTangentAt(u);}
   else if(progress<.65){const v=clamp((progress-.385)/.265),u=v+.62*v*v*(1-v);following.getPointAt(u,position);tangent=following.getTangentAt(u);}
   else{const v=clamp((progress-.65)/(touchdown-.65)),u=1-(1-v)*(1-v);approach.getPoint(u,position);tangent=approach.getTangent(Math.min(.98,u));}
   const braking=ramp(.65,.78,progress),seating=ramp(.74,touchdown,progress);
   const beats=clamp((progress-.16)/(.795-.16))*Math.PI*2*7;
   const flightFlap=.39+Math.sin(beats)*THREE.MathUtils.lerp(.86,.22,ramp(.73,touchdown,progress));
   const restingFlap=THREE.MathUtils.lerp(.39,.48+Math.sin(perchedTime*.75)*.3,ramp(0,2.2,perchedTime));
   const flap=isPerched?(reduced?.55:restingFlap):flightFlap;
   for(const wing of wings){
    const flex=wing.hind?Math.sin(beats-.25)*.07*(1-seating):0;
    turn.setFromAxisAngle(wing.axis,wing.sign*(flap+flex));wing.bone.quaternion.copy(wing.rest).premultiply(turn);
   }
   legUniforms.deployment.value=ramp(.685,.765,progress);
   position.y+=Math.sin(beats+.7)*.035*(1-braking);
   // Only landing and the grounded feet inherit the stalk's quiet sway.
   if(isPerched)position.applyMatrix4(bloom.matrixWorld);
   insect.position.copy(position);insect.visible=progress>.16;
   const heading=Math.atan2(tangent.x,tangent.z),pitch=-Math.asin(THREE.MathUtils.clamp(tangent.y,-1,1))*.7;
   const bank=Math.sin(ramp(.385,.65,progress)*Math.PI*2)*.18*(1-braking);
   flightRotation.setFromEuler(new THREE.Euler(pitch,heading,bank,'YXZ'));
   insect.quaternion.copy(flightRotation).slerp(perchRotation,seating);
   if(isPerched)insect.quaternion.premultiply(bloom.quaternion);
  }
  const orbit=ramp(.47,.66,progress)*1.04;
  const distance=THREE.MathUtils.lerp(mobile?4.1:4.6,mobile?6:4.5,ramp(.64,.795,progress));
  const cameraSubject=progress>=.795?landing:position;
  const chase=cameraSubject.clone().add(new THREE.Vector3(Math.sin(orbit)*distance,1.3+ramp(.62,.8,progress)*.65,Math.cos(orbit)*distance));
  camera.position.set(0,5.8,mobile?12.8:12).lerp(chase,catchUp);
  look.set(0,3.7,-8).lerp(cameraSubject.clone().add(new THREE.Vector3(mobile?ramp(.65,.79,progress)*.34:0,0,0)),catchUp);
  const finalCamera=landing.clone().add(new THREE.Vector3(mobile?1.8:2.5,1.05,mobile?4.8:5.2));
  const finalLook=landing.clone().add(new THREE.Vector3(mobile?.34:1.55,mobile?-.3:-.8,0));
  camera.position.lerp(finalCamera,settle);look.lerp(finalLook,settle);camera.lookAt(look);
  print.uniforms.focus.value=camera.position.distanceTo(insect.position);
  renderer.setRenderTarget(target);renderer.render(scene,camera);
  renderer.setClearColor(0,0);renderer.setRenderTarget(subjectTarget);renderer.render(subjectScene,camera);
  renderer.setRenderTarget(null);renderer.render(postScene,postCamera);
 };
 const release=()=>{geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());scene.clear();subjectScene.clear();};
 const dispose=()=>{disposed=true;release();target.dispose();subjectTarget.dispose();renderer.dispose();};
 return {ready,resize,draw,dispose};
}
