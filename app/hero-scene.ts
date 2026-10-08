import gsap from 'gsap';
import Lenis from 'lenis';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {vertex,fragment} from './scene-shaders';
import {createStrokeScene} from './stroke-scene';
import {restoreWorkReturn} from './work-return';

export function mountHero(stage:HTMLElement,surface:HTMLCanvasElement,strokes:HTMLCanvasElement,onReady:()=>void,onFailure:()=>void,onScrollReady:(lenis:Lenis)=>void){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 gsap.registerPlugin(ScrollTrigger);
 const lenis=new Lenis({lerp:reduced?1:.075,smoothWheel:!reduced,syncTouch:false,anchors:true});
 onScrollReady(lenis);restoreWorkReturn(top=>lenis.scrollTo(top,{immediate:true,force:true}));lenis.on('scroll',ScrollTrigger.update);
 const state={p:0};
 const anim=gsap.to(state,{p:.89,ease:'none',scrollTrigger:{trigger:stage,start:'top top',end:'bottom bottom',scrub:true}});
 let disposed=false,assetsReady=false,firstFrame=false,raf=0,last=0,mx=0,my=0,px=0,py=0,needsPaint=true,wildlifeRequested=false;
 let wildlife:ReturnType<typeof import('./wildlife').createWildlife>|undefined;
 const gl=surface.getContext('webgl',{alpha:false,antialias:false,powerPreference:'high-performance'});
 if(!gl){onFailure();let frame=0;const tick=(now:number)=>{frame=requestAnimationFrame(tick);lenis.raf(now);};frame=requestAnimationFrame(tick);return()=>{cancelAnimationFrame(frame);anim.scrollTrigger?.kill();anim.kill();lenis.destroy();};}
 const program=gl.createProgram()!,textures:WebGLTexture[]=[];
 const compile=(type:number,source:string)=>{const shader=gl.createShader(type)!;gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){gl.deleteShader(shader);throw Error('Hero shader failed');}return shader;};
 try{const vs=compile(gl.VERTEX_SHADER,vertex),fs=compile(gl.FRAGMENT_SHADER,fragment);gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Hero shader link failed');}
 catch(error){console.warn(error);gl.deleteProgram(program);anim.scrollTrigger?.kill();anim.kill();lenis.destroy();onFailure();return()=>{};}
 gl.useProgram(program);
 const texture=(unit:number,name:string)=>{const tex=gl.createTexture()!;textures.push(tex);gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,tex);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([0,0,0,0]));gl.uniform1i(gl.getUniformLocation(program,name),unit);return tex;};
 const landscape=texture(0,'landscape'),animals=texture(1,'wildlife'),image=new Image();
 image.onload=()=>{if(disposed)return;gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,landscape);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);assetsReady=true;};
 image.onerror=()=>{if(!disposed)onFailure();};image.src='/art/night-valley-render.webp';
 const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
 const position=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
 const u=Object.fromEntries(['resolution','progress','landing','time','pointer'].map(key=>[key,gl.getUniformLocation(program,key)]));
 const strokeScene=createStrokeScene(strokes);
 const resize=()=>{needsPaint=true;const d=Math.min(devicePixelRatio,surface.clientWidth<=700?1:1.25),w=surface.clientWidth,h=surface.clientHeight;surface.width=Math.round(w*d);surface.height=Math.round(h*d);gl.viewport(0,0,surface.width,surface.height);gl.uniform2f(u.resolution,surface.width,surface.height);strokeScene.resize();wildlife?.resize(w,h);};resize();
 const started=performance.now();
 const pointer=(event:PointerEvent)=>{mx=event.clientX/innerWidth-.5;my=event.clientY/innerHeight-.5;};
 let previousProgress=-1;
 const draw=(timestamp:number)=>{
  raf=requestAnimationFrame(draw);lenis.raf(timestamp);
  if(document.hidden||!assetsReady||timestamp-last<1000/30)return;
  const bounds=stage.getBoundingClientRect();if((bounds.bottom<=0||bounds.top>=innerHeight)&&firstFrame)return;
  const p=state.p;if(reduced&&firstFrame&&!needsPaint&&Math.abs(p-previousProgress)<.0001)return;
  if(!reduced&&!wildlifeRequested&&p<.14&&timestamp-started>1500&&bounds.bottom>0&&bounds.top<innerHeight){
   wildlifeRequested=true;void import('./wildlife').then(module=>{if(disposed)return;wildlife=module.createWildlife();wildlife.resize(surface.clientWidth,surface.clientHeight);}).catch(error=>console.warn('Hero wildlife unavailable',error));
  }
  needsPaint=false;last=timestamp;previousProgress=p;px+=(mx-px)*.07;py+=(my-py)*.07;const t=reduced?0:(timestamp-started)*.001;
  // Wildlife is invisible after this portion; avoid a renderer and texture upload there.
  if(wildlife&&p<.14){wildlife.draw(p,t);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,animals);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,wildlife.canvas);}
  gl.uniform1f(u.progress,Math.min(p/.47,1));gl.uniform1f(u.landing,p);gl.uniform1f(u.time,t);gl.uniform2f(u.pointer,px,py);gl.drawArrays(gl.TRIANGLES,0,6);
  stage.style.setProperty('--p',String(p));strokeScene.draw(p,t);
  if(!firstFrame&&!gl.isContextLost()){firstFrame=true;stage.classList.add('is-ready');onReady();}
 };raf=requestAnimationFrame(draw);
 const lost=(event:Event)=>{event.preventDefault();onFailure();};surface.addEventListener('webglcontextlost',lost);
 addEventListener('resize',resize);addEventListener('pointermove',pointer);
 return()=>{disposed=true;cancelAnimationFrame(raf);lenis.destroy();anim.scrollTrigger?.kill();anim.kill();wildlife?.dispose();removeEventListener('resize',resize);removeEventListener('pointermove',pointer);surface.removeEventListener('webglcontextlost',lost);image.onload=null;image.onerror=null;textures.forEach(tex=>gl.deleteTexture(tex));gl.deleteBuffer(buffer);gl.deleteProgram(program);};
}
