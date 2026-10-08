import * as THREE from 'three';
import {createSceneFallback} from './scene-fallback';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';

// Original meshes and animation clips are external assets; see /ASSET-CREDITS.md.
export function createWildlife(options:{towardCenter?:boolean;modelUrl?:string}={}){
 let renderer:THREE.WebGLRenderer;
 try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:false});}
 catch(error){console.warn('Wildlife GPU scene unavailable',error);return createSceneFallback();}
 renderer.setClearColor(0x000000,0);renderer.setPixelRatio(1);
 const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-1,1,1,-1,.1,3000);
 camera.position.set(0,0,1000);camera.lookAt(0,0,0);
 scene.add(new THREE.HemisphereLight(0xffffff,0x777777,2.5));
 const sun=new THREE.DirectionalLight(0xffffff,3);sun.position.set(-3,7,10);scene.add(sun);
 const birds:THREE.Group[]=[],foxes:THREE.Group[]=[],mixers:THREE.AnimationMixer[]=[];
 const loader=new GLTFLoader();let disposed=false,last=0,width=1,height=1;
 const normalize=(model:THREE.Object3D,size:number)=>{
  const bounds=new THREE.Box3().setFromObject(model),dimensions=bounds.getSize(new THREE.Vector3());
  const group=new THREE.Group();group.add(model);const scale=size/Math.max(dimensions.x,dimensions.y,dimensions.z);model.scale.multiplyScalar(scale);
  bounds.setFromObject(model);const center=bounds.getCenter(new THREE.Vector3());model.position.sub(center);return group;
 };
 const materialize=(model:THREE.Object3D)=>model.traverse(o=>{if(o instanceof THREE.Mesh){o.material=Array.isArray(o.material)?o.material.map(m=>m.clone()):o.material.clone();}});
 const ready=Promise.all([
  loader.loadAsync(options.modelUrl||'/models/bird.glb').then(g=>{if(disposed)return;for(let i=0;i<(options.towardCenter?20:3);i++){const model=clone(g.scene);materialize(model);const group=normalize(model,120);group.rotation.y=-Math.PI/2;scene.add(group);birds.push(group);const mixer=new THREE.AnimationMixer(model);if(g.animations[0])mixer.clipAction(g.animations[0]).play();mixer.timeScale=options.towardCenter?.75+(i*7%11)*.075:1;mixer.setTime(i*.371);mixers.push(mixer);}}),

 ]).catch(error=>{if(!disposed)console.warn('Wildlife model unavailable',error);});
 const resize=(w:number,h:number)=>{width=w;height=h;renderer.setSize(Math.min(w,720),Math.round(h*Math.min(w,720)/w),false);camera.left=-w/2;camera.right=w/2;camera.top=h/2;camera.bottom=-h/2;camera.updateProjectionMatrix();};
 const draw=(p:number,t:number,target?:{x:number;y:number})=>{
  const delta=Math.min(.05,Math.max(0,t-last));last=t;mixers.forEach(m=>m.update(delta));
  birds.forEach((b,i)=>{b.visible=p<.28;const u=(t*.11+i*.32)%1.5;b.position.set(width*(.7-u),height*(.28-i*.03)+Math.sin(t*.35+i)*height*.022,0);b.scale.setScalar(Math.min(width,height)/900*(.65+i*.14));b.rotation.z=Math.sin(t*.3+i)*.06;
   if(options.towardCenter){
    // Independent curved approaches all terminate inside the natural opening.
    const duration=5.5+(i*13%17)*.19;
    const u=(t/duration+i*.61803398875)%1;
    const tx=(target?.x??width*.5)-width*.5,ty=height*.5-(target?.y??height*.43);
    const startX=-width*(.57+(i*7%9)*.024),startY=height*(.37-(i*11%19)*.034);
    const bend=height*((i%2?1:-1)*(.09+(i%5)*.018));
    const x=startX+(tx-startX)*u;
    const y=startY+(ty-startY)*u+Math.sin(Math.PI*u)*bend+Math.sin(u*9+i)*height*.014*Math.sin(Math.PI*u);
    const dx=tx-startX,dy=ty-startY+Math.cos(Math.PI*u)*Math.PI*bend;
    b.visible=true;b.position.set(x,y,0);
    b.rotation.y=1.05+(i%5-2)*.12+u*.32;
    b.rotation.z=Math.atan2(dy,dx)*.55;
    b.rotation.x=Math.sin(u*5+i)*.16;
    const size=(.7+(i*7%13)*.065)*(1-u*.68);
    const entry=Math.min(1,u*25),arrival=Math.min(1,(1-u)*22);
    b.scale.setScalar(Math.min(width,height)/900*size*entry*arrival);
   }});

  foxes.forEach(f=>{f.visible=p>.67;const entry=Math.min(1,Math.max(0,(p-.67)/.1));f.position.set(width*(width<700?-.3:-.35),height*-.285-height*(1-entry)*.12,2);f.scale.setScalar(Math.min(width/1350,height/900)*(1.02));});
  renderer.render(scene,camera);
 };
 const dispose=()=>{disposed=true;mixers.forEach(m=>m.stopAllAction());scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>m.dispose());}});renderer.dispose();renderer.forceContextLoss();};
 return{canvas:renderer.domElement,ready,resize,draw,dispose};
}






