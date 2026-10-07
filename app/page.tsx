'use client';
import {useEffect,useRef,useState} from 'react';
import gsap from 'gsap';
import Lenis from 'lenis';
import {ScrollTrigger} from 'gsap/ScrollTrigger';

import {vertex,fragment} from './scene-shaders';
import {createStrokeScene} from './stroke-scene';
import {createWildlife} from './wildlife';
import Garden from './Garden';
import WorkPrelude from './WorkPrelude';
import Process from './Process';
import AboutStudio from './AboutStudio';
import {restoreWorkReturn} from './work-return';

export default function Home(){
 const stage=useRef<HTMLElement>(null),canvas=useRef<HTMLCanvasElement>(null),strokes=useRef<HTMLCanvasElement>(null);
 const [failed,setFailed]=useState(false);
 useEffect(()=>{
  gsap.registerPlugin(ScrollTrigger);
  const surface=canvas.current!,gl=surface.getContext('webgl',{alpha:false,antialias:false,powerPreference:'high-performance'});
  if(!gl){setFailed(true);return;}
  const compile=(type:number,source:string)=>{const shader=gl.createShader(type)!;gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader)||'Shader error');return shader;};
  const program=gl.createProgram()!;
  try{const vs=compile(gl.VERTEX_SHADER,vertex),fs=compile(gl.FRAGMENT_SHADER,fragment);gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Link error');}catch(e){console.error(e);setFailed(true);return;}
  gl.useProgram(program);let disposed=false;
  const textures:WebGLTexture[]=[];
  const texture=(unit:number,name:string)=>{const tex=gl.createTexture()!;textures.push(tex);gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,tex);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([0,0,0,0]));gl.uniform1i(gl.getUniformLocation(program,name),unit);return tex;};
  const load=(unit:number,name:string,url:string)=>{const tex=texture(unit,name);return new Promise<void>((resolve,reject)=>{const img=new Image();img.onload=()=>{if(!disposed){gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,tex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);}resolve();};img.onerror=reject;img.src=url;});};
  const art=load(0,'landscape','/art/night-valley.png'),pond=load(1,'pond','/art/woodland-pond.jpg');
  const animals=texture(2,'wildlife'),wildlife=createWildlife();
  Promise.all([art,pond,wildlife.ready]).then(()=>{if(!disposed)stage.current?.classList.add('is-ready');}).catch(e=>{console.error('Scene asset failed',e);if(!disposed)setFailed(true);});
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const position=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  const u=Object.fromEntries(['resolution','progress','landing','time','pointer'].map(k=>[k,gl.getUniformLocation(program,k)]));
  const strokeScene=createStrokeScene(strokes.current!);
  const resize=()=>{const d=Math.min(devicePixelRatio,1.6),w=surface.clientWidth,h=surface.clientHeight;surface.width=Math.round(w*d);surface.height=Math.round(h*d);gl.viewport(0,0,surface.width,surface.height);gl.uniform2f(u.resolution,surface.width,surface.height);strokeScene.resize();wildlife.resize(w,h);};resize();
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,state={p:0};

  const lenis=new Lenis({lerp:.09,smoothWheel:true});
  restoreWorkReturn(top=>lenis.scrollTo(top,{immediate:true,force:true}));
  lenis.on('scroll',ScrollTrigger.update);
  const anim=gsap.to(state,{p:.89,ease:'none',scrollTrigger:{trigger:stage.current,start:'top top',end:'bottom bottom',scrub:true}});
  let raf=0,mx=0,my=0,px=0,py=0;const started=performance.now();
  const pointer=(e:PointerEvent)=>{mx=e.clientX/innerWidth-.5;my=e.clientY/innerHeight-.5;};
  const draw=(timestamp:number)=>{
   raf=requestAnimationFrame(draw);lenis.options.lerp=state.p>.66?1:.09;lenis.raf(timestamp);
   const bounds=stage.current!.getBoundingClientRect();if(bounds.bottom<=0||bounds.top>=innerHeight)return;
   px+=(mx-px)*.035;py+=(my-py)*.035;const p=state.p,t=reduced?0:(timestamp-started)*.001;
   wildlife.draw(p,t);gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,animals);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,wildlife.canvas);
   gl.uniform1f(u.progress,Math.min(p/.47,1));gl.uniform1f(u.landing,p);gl.uniform1f(u.time,t);gl.uniform2f(u.pointer,px,py);gl.drawArrays(gl.TRIANGLES,0,6);
   stage.current?.style.setProperty('--p',String(p));strokeScene.draw(p,t);
  };raf=requestAnimationFrame(draw);
  addEventListener('resize',resize);addEventListener('pointermove',pointer);const lost=(e:Event)=>{e.preventDefault();setFailed(true);};surface.addEventListener('webglcontextlost',lost);
  return()=>{disposed=true;lenis.destroy();cancelAnimationFrame(raf);anim.scrollTrigger?.kill();anim.kill();wildlife.dispose();removeEventListener('resize',resize);removeEventListener('pointermove',pointer);surface.removeEventListener('webglcontextlost',lost);textures.forEach(tex=>gl.deleteTexture(tex));gl.deleteBuffer(buffer);gl.deleteProgram(program);};
 },[]);
 return <main>
  <section ref={stage} className="scene-scroll" aria-label="Графический пейзаж POUDEV">
   <div className="scene"><canvas ref={canvas} className="night" aria-hidden="true"/><canvas ref={strokes} className="stroke-field" aria-hidden="true"/>{failed&&<div className="fallback"><strong>POUDEV</strong></div>}
    <div className="intro" lang="en"><h1>Your business deserves<br/>a better website.</h1><p>We design, write, and build custom websites.<br/>One studio, from the first idea to launch.</p></div>
    <h2 className="sr-only">POUDEV — дизайн и разработка сайтов</h2>
   </div>
  </section>
  <Garden/>
  <WorkPrelude/>
  <Process/>
  <AboutStudio/>
 </main>;
}

