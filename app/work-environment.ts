import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';

// Filmed animals and an original botanical plate sampled into one two-colour print grid.
// Credits for the original artwork and animation: /ASSET-CREDITS.md.
export function createWorkEnvironment(motion = true) {
 const renderer = new THREE.WebGLRenderer({alpha: true, antialias: false});
 renderer.setClearColor(0, 0);
 const scene = new THREE.Scene(), camera = new THREE.Camera();
 const flightScene = new THREE.Scene();
 const flightCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 3000);
 flightCamera.position.z = 1000;
 const flightTarget = new THREE.WebGLRenderTarget(1, 1, {depthBuffer: false});
 const flock: THREE.Group[] = [], mixers: THREE.AnimationMixer[] = [];
 const geometryResources = new Set<THREE.BufferGeometry>();
 const birdMaterial = new THREE.MeshBasicMaterial({color: 0xffffff, side: THREE.DoubleSide});
 let disposed = false, width = 1, height = 1, active = false, prepared = false;
 let lastTime = -1, elapsed = 0;

 const videos = ['work-herd-meadow'].map(name => {
  const video = document.createElement('video');
  video.src = `/art/${name}.mp4`;
  video.muted = true; video.loop = true; video.playsInline = true;
  video.preload = 'none'; video.playbackRate = name.includes('herd') ? .75 : .7;
  return video;
 });
 const textures = videos.map(video => {
  const texture = new THREE.VideoTexture(video);
  texture.colorSpace = THREE.NoColorSpace;
  return texture;
 });
 const posters = ['work-herd-poster'].map(name => {
  const texture = new THREE.TextureLoader().load(`/art/${name}.jpg`);
  texture.colorSpace = THREE.NoColorSpace;
  return texture;
 });
 const treeTexture = new THREE.TextureLoader().load('/art/work-oak-atlas.png');
 treeTexture.colorSpace = THREE.NoColorSpace;
 const material = new THREE.ShaderMaterial({
  transparent: true, depthTest: false, depthWrite: false,
  uniforms: {
   herd: {value: posters[0]}, tree: {value: treeTexture}, birds: {value: flightTarget.texture},
   resolution: {value: new THREE.Vector2(1, 1)}, progress: {value: 0}, growth: {value: motion ? 0 : 1},
  },
  vertexShader: 'varying vec2 uvScene; void main(){uvScene=uv;gl_Position=vec4(position,1.);}',
  fragmentShader: `
   precision highp float;
   varying vec2 uvScene;
   uniform sampler2D herd, tree, birds;
   uniform vec2 resolution;
   uniform float progress, growth;
   float ramp(float a,float b,float x){return smoothstep(a,b,x);}
   float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
   float lightness(vec3 c){return dot(c,vec3(.299,.587,.114));}
   float printMark(float tone,vec2 cell,vec2 grid,float entrance){
    // Width encodes luminance; small broken ends keep the print from becoming a flat silhouette.
    float seed=hash(cell),line=fract(uvScene.x*resolution.x/grid.x);
    float aa=max(fwidth(line),.015);
    float weight=clamp(tone,0.,.96);
    float stroke=1.-smoothstep(weight-aa,weight+aa,line);
    float stagger=hash(vec2(cell.x,floor(cell.y/3.)));
    float reveal=ramp(stagger*.55,stagger*.55+.24,entrance);
    float row=fract(uvScene.y*resolution.y/grid.y);
    float end=1.-ramp(.88,.99,row)*step(.75,seed);
    return stroke*end*reveal*step(.035,tone);
   }
   void main(){
    float mobile=1.-step(700.,resolution.x);
    vec2 grid=vec2(mix(6.4,3.7,mobile),mix(9.,6.,mobile));
    vec2 cell=floor(uvScene*resolution/grid);
    vec2 p=(cell+.5)*grid/resolution;
    float aspect=resolution.x/resolution.y,alpha=0.;
    float entrance=ramp(.0,.12,progress);

    // The wide original shot retains its real proportions, antlers and grazing motion.
    float animalWidth=mix(.64,1.4,mobile);
    vec2 animal=(p-vec2(mix(-.12,-.32,mobile),mix(.052,.028,mobile)))/vec2(animalWidth,animalWidth*aspect*.28125);
    if(animal.x>0.&&animal.x<1.&&animal.y>0.&&animal.y<1.){
     vec3 colour=texture2D(herd,vec2(animal.x*.5,animal.y)).rgb;
     float matte=texture2D(herd,vec2(.5+animal.x*.5,animal.y)).r;
     float body=matte*(.49+(1.-lightness(colour))*.46);
     // A low, ragged meadow follows the filmed ground; no rectangular video edge.
     float ridge=.34-animal.x*.16+sin(animal.x*6.)*.027;
     float seed=hash(cell);
     float meadow=ramp(seed*.07,.06+seed*.08,animal.y)*(1.-ramp(ridge-.05,ridge+.025+seed*.055,animal.y));
     meadow*=ramp(.035,.10,animal.x)*(1.-ramp(.85,1.,animal.x));
     float grass=meadow*clamp((.79-lightness(colour))*1.65+seed*.13,.035,.85);
     float tone=max(body,grass);
     alpha=max(alpha,printMark(tone,cell,grid,entrance));
    }

    // One stable tree plate. Bark and foliage share exactly the same UVs;
    // only leaf opacity changes, with no video keying, resampling sway or shimmer.
    float treeHeight=min(mix(.66,.34,mobile),mix(.46,.74,mobile)*aspect);
    float treeWidth=treeHeight*.6666667/aspect;
    vec2 treeGrid=grid*.65;
    vec2 treeCell=floor(uvScene*resolution/treeGrid);
    vec2 treePoint=(treeCell+.5)*treeGrid/resolution;
    vec2 treeUV=(treePoint-vec2(1.-treeWidth-.02,.95-treeHeight))/vec2(treeWidth,treeHeight);
    if(treeUV.x>0.&&treeUV.x<1.&&treeUV.y>0.&&treeUV.y<1.){
     vec4 plate=texture2D(tree,vec2(.5+treeUV.x*.5,treeUV.y));
     // Olive leaves include warm highlights; pure green-only keying leaves them visible too early.
     float leaf=(1.-ramp(.012,.10,plate.r-plate.g))*ramp(.025,.075,plate.g-plate.b);
     float grain=.38+(1.-lightness(plate.rgb))*.5;
     float bark=plate.a*(1.-leaf);
     vec2 cluster=floor(treeUV*vec2(9.,13.));
     float delay=treeUV.y*.48+hash(cluster)*.16;
     float bloom=ramp(delay,delay+.28,growth);
     float tone=printMark(grain,treeCell,treeGrid,entrance);
     alpha=max(alpha,tone*(bark+plate.a*leaf*bloom));
    }

    vec2 birdGrid=grid*.57;
    vec2 birdCell=floor(uvScene*resolution/birdGrid);
    vec2 birdPoint=(birdCell+.5)*birdGrid/resolution;
    float bird=texture2D(birds,birdPoint).a;
    alpha=max(alpha,printMark(bird*.84,birdCell,birdGrid,entrance));
    gl_FragColor=vec4(vec3(41.,41.,32.)/255.,alpha);
   }`,
 });
 const geometry = new THREE.PlaneGeometry(2, 2);
 scene.add(new THREE.Mesh(geometry, material));

 const prepare = () => {
  if (prepared || disposed) return;
  prepared = true;
  if (motion) videos.forEach(video => {video.preload = 'auto'; video.load();});
  new GLTFLoader().loadAsync('/models/work-stork.glb').then(gltf => {
   if (disposed) {
    gltf.scene.traverse(object => {if (object instanceof THREE.Mesh) object.geometry.dispose();});
    return;
   }
   const originalMaterials = new Set<THREE.Material>();
   for (let i = 0; i < 5; i++) {
    const model = clone(gltf.scene);
    model.traverse(object => {
     if (!(object instanceof THREE.Mesh)) return;
     geometryResources.add(object.geometry);
     (Array.isArray(object.material) ? object.material : [object.material]).forEach(m => originalMaterials.add(m));
     object.material = birdMaterial;
    });
    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    model.scale.multiplyScalar(100 / Math.max(size.x, size.y, size.z));
    model.position.sub(new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3()));
    const group = new THREE.Group();
    group.add(model); group.rotation.y = .98;
    flock.push(group); flightScene.add(group);
    const mixer = new THREE.AnimationMixer(model);
    if (gltf.animations[0]) mixer.clipAction(gltf.animations[0]).play();
    mixer.timeScale = .54 + i*.045; mixer.setTime(i*.371);
    mixers.push(mixer);
   }
   originalMaterials.forEach(m => m.dispose());
  }).catch(error => {if (!disposed) console.error('Work scene bird could not load', error);});
 };
 const resize = (w: number, h: number) => {
  width = w; height = h;
  const density = Math.min(devicePixelRatio, 1.5);
  renderer.setPixelRatio(density); renderer.setSize(w, h, false);
  flightTarget.setSize(Math.round(w*density), Math.round(h*density));
  flightCamera.left = -w/2; flightCamera.right = w/2;
  flightCamera.top = h/2; flightCamera.bottom = -h/2;
  flightCamera.updateProjectionMatrix();
  material.uniforms.resolution.value.set(w, h);
 };
 const draw = (time: number, progress: number) => {
  if (disposed) return;
  prepare();
  if (!active) {
   active = true; lastTime = time;
   if (motion) videos.forEach(video => {void video.play().catch(() => {});});
  }
  const delta = Math.max(0, Math.min(.08, time-lastTime));
  lastTime = time;
  if (motion) {elapsed += delta; mixers.forEach(mixer => mixer.update(delta));}
  videos.forEach((video, i) => {
   material.uniforms.herd.value = motion && video.readyState >= 2 ? textures[i] : posters[i];
  });
  flock.forEach((bird, i) => {
   const u = ((motion ? elapsed : 5)/(23+i*2.7)+i*.197)%1;
   const x = (-.65+u*1.3)*width;
   const y = height*(.32-i*.045)+Math.sin(u*Math.PI*2+i)*height*.024;
   bird.position.set(x, y, 0);
   bird.rotation.z = Math.cos(u*Math.PI*2+i)*.055;
   bird.scale.setScalar((width<700 ? .68 : 1.4)*(1+i*.085));
  });
  renderer.setRenderTarget(flightTarget); renderer.clear(); renderer.render(flightScene, flightCamera);
  renderer.setRenderTarget(null);
  material.uniforms.growth.value = motion ? Math.min(1, Math.max(0, (elapsed-1)/13)) : 1;
  material.uniforms.progress.value = progress;
  renderer.render(scene, camera);
 };
 const pause = () => {active = false; lastTime = -1; videos.forEach(video => video.pause());};
 const dispose = () => {
  disposed = true; pause();
  mixers.forEach(mixer => mixer.stopAllAction());
  geometryResources.forEach(resource => resource.dispose()); birdMaterial.dispose();
  videos.forEach(video => {video.removeAttribute('src'); video.load();});
  [...textures, ...posters, treeTexture].forEach(texture => texture.dispose());
  flightTarget.dispose(); geometry.dispose(); material.dispose(); renderer.dispose();
 };
 return {canvas: renderer.domElement, resize, prepare, draw, pause, dispose};
}
