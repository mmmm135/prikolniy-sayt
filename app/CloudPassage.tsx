'use client';
import {useEffect,useRef} from 'react';
import {vertex} from './scene-shaders';
const fragment=`precision highp float;
varying vec2 uv;
uniform vec2 resolution;
uniform float time,spread;
float hash(float x){return fract(sin(x*127.13)*43758.54);}
float ramp(float a,float b,float x){return smoothstep(a,b,x);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i.x+i.y*71.),hash(i.x+1.+i.y*71.),f.x),mix(hash(i.x+(i.y+1.)*71.),hash(i.x+1.+(i.y+1.)*71.),f.x),f.y);}
float fbm(vec2 p){return noise(p)*.55+noise(p*2.1+7.)*.28+noise(p*4.2+19.)*.17;}
float cloudMass(vec2 p){
 p+=vec2(sin(time*.19)*.01,sin(time*.23)*.006);
 float body=length((p-vec2(.22,.36))/vec2(.30,.12));
 body=min(body,length((p-vec2(.10,.28))/vec2(.14,.15)));
 body=min(body,length((p-vec2(.26,.20))/vec2(.12,.18)));
 body=min(body,length((p-vec2(.40,.31))/vec2(.12,.13)));
 body=min(body,length((p-vec2(.17,.45))/vec2(.13,.12)));
 body=min(body,length((p-vec2(.37,.43))/vec2(.10,.11)));
 return body+(fbm(p*vec2(19.,24.)+vec2(time*.055,0.))-.5)*.38;
}

void main(){
 vec2 p=vec2(uv.x,1.-uv.y);
 p.y+=.21;
 float pitch=resolution.x>1000.?12.:7.;
 vec2 c=vec2(floor(p.x*resolution.x/pitch)*pitch/resolution.x,floor(p.y*resolution.y/8.)*8./resolution.y);
 vec2 a=vec2(c.x*.65+spread*.95,c.y*.38+.10);
 vec2 b=vec2((1.-c.x)*.65+spread,c.y*.38+.10);
 vec2 d=vec2(c.x*.65+spread*1.15-.08,c.y*.38-.10);
 float da=cloudMass(a),db=cloudMass(b),dd=cloudMass(d);
 float dist=min(da,min(db,dd));
 vec2 field=dist==da?a:dist==db?b:d;
 float shape=1.-step(1.,dist);
 // The veil meets the section edge through staggered, dissolving columns.
 float edge=.045+.10*noise(vec2(floor(p.x*resolution.x/pitch)*.21,3.));
 shape*=smoothstep(edge,edge+.11,1.-uv.y);
 float volume=fbm(field*vec2(11.,15.)+vec2(time*.12,-time*.04));
 float shade=clamp(.16+(field.y-.24)*1.15+(volume-.5)*.9,.08,.92);
 float line=fract(p.x*resolution.x/pitch);
 float gap=step(shade,line)*step(line,.94);
 vec3 ink=vec3(41.,41.,32.)/255.;
 vec3 paper=vec3(201.,184.,148.)/255.;
 gl_FragColor=vec4(mix(paper,ink,gap),shape);
}`;
export default function CloudPassage(){
 const ref=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
  const canvas=ref.current!,section=canvas.closest('.work-prelude')!;
  const gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:false});if(!gl)return;
  const shader=(type:number,source:string)=>{const s=gl.createShader(type)!;gl.shaderSource(s,source);gl.compileShader(s);return s;};
  const vs=shader(gl.VERTEX_SHADER,vertex),fs=shader(gl.FRAGMENT_SHADER,fragment),program=gl.createProgram()!;
  gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.useProgram(program);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const position=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  const resolution=gl.getUniformLocation(program,'resolution'),time=gl.getUniformLocation(program,'time'),spread=gl.getUniformLocation(program,'spread');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let raf=0,last=0,visible=false,currentSpread=0,initialized=false;
  const resize=()=>{const d=Math.min(devicePixelRatio,1.25);canvas.width=canvas.clientWidth*d;canvas.height=canvas.clientHeight*d;gl.viewport(0,0,canvas.width,canvas.height);gl.uniform2f(resolution,canvas.width,canvas.height);};resize();
  const observer=new IntersectionObserver(e=>{visible=e[0].isIntersecting;});observer.observe(canvas);
  const draw=(now:number)=>{raf=requestAnimationFrame(draw);if(!visible||now-last<33)return;const dt=Math.min(.1,(now-last)/1000);last=now;
   const top=section.getBoundingClientRect().top;
   const p=Math.max(0,Math.min(1,(innerHeight*.90-top)/(innerHeight*1.18)));
   const target=p*p*p*(p*(p*6.-15.)+10.);
   if(!initialized){currentSpread=target;initialized=true;}
   currentSpread+=(target-currentSpread)*(reduced?1:1-Math.exp(-dt/ .22));
   gl.uniform1f(spread,currentSpread);gl.uniform1f(time,reduced?0:now*.001);gl.drawArrays(gl.TRIANGLES,0,6);
  };raf=requestAnimationFrame(draw);addEventListener('resize',resize);
  return()=>{cancelAnimationFrame(raf);observer.disconnect();removeEventListener('resize',resize);gl.deleteBuffer(buffer);gl.deleteProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);};
 },[]);
 return <canvas ref={ref} className="cloud-passage" aria-hidden="true"/>;
}
