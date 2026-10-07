'use client';
import {useEffect,useRef} from 'react';
import {createWildlife} from './wildlife';
import CloudPassage from './CloudPassage';
import WorkGallery from './WorkGallery';
import {createWorkEnvironment} from './work-environment';

export default function WorkPrelude(){
 const root=useRef<HTMLElement>(null),surface=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
  const el=root.current!,canvas=surface.current!,ctx=canvas.getContext('2d')!;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const environment=createWorkEnvironment(!reduced);
  const birds=createWildlife({towardCenter:true,modelUrl:'/models/work-stork.glb'});
  const buffer=document.createElement('canvas');buffer.width=256;buffer.height=288;
  const sample=buffer.getContext('2d',{willReadFrequently:true})!;
  const birdBuffer=document.createElement('canvas');birdBuffer.width=720;birdBuffer.height=450;
  const birdSample=birdBuffer.getContext('2d',{willReadFrequently:true})!;
  let pixels:Uint8ClampedArray|undefined,w=1,h=1,frame=0,last=0,visible=false,disposed=false,environmentRunning=false;
  const landscape=new Image();landscape.onload=()=>{if(disposed)return;sample.drawImage(landscape,60,440,1870,1833,0,0,256,288);pixels=sample.getImageData(0,0,256,288).data;};landscape.src='/art/work-rock.jpg';
  const resize=()=>{w=canvas.clientWidth;h=canvas.clientHeight;const d=Math.min(devicePixelRatio,1.5);canvas.width=w*d;canvas.height=h*d;ctx.setTransform(d,0,0,d,0,0);birds.resize(w,h);environment.resize(w,h);};resize();
  const observer=new IntersectionObserver(e=>{visible=e[0].isIntersecting;if(visible)environment.prepare();else {environment.pause();environmentRunning=false;}});observer.observe(el);
  const visibility=()=>{if(document.hidden){environment.pause();environmentRunning=false;}};
  document.addEventListener('visibilitychange',visibility);
  const draw=(now:number)=>{
   frame=requestAnimationFrame(draw);if(!visible||document.hidden||now-last<33)return;last=now;
   const rect=el.getBoundingClientRect();const total=Math.max(0,Math.min(1,-rect.top/(el.offsetHeight-h)));
   const p=Math.min(1,total/.34),catalog=Math.max(0,Math.min(1,(total-.34)/.66));
   el.style.setProperty('--catalog-progress',String(catalog));
   el.style.setProperty('--work-progress',String(p));
   const t=reduced?0:now*.001;
   if(total>=.34){
    ctx.fillStyle='#c9b894';ctx.fillRect(0,0,w,h);
    environmentRunning=true;
    environment.draw(t,catalog);
    ctx.drawImage(environment.canvas,0,0,w,h);
    return;
   }
   if(environmentRunning){environment.pause();environmentRunning=false;}
   const approach=Math.max(0,(p-.12)/.88);
   const camera=Math.pow(approach,2.25),zoom=1+camera*26;
   const pw=w<700?Math.min(w*1.55,h*.82):Math.min(w*.78,h*1.02),ph=pw*288/256,ox=w*.5-pw*.5,oy=h*.43-ph*.345;
   ctx.fillStyle='#292920';ctx.fillRect(0,0,w,h);
   ctx.save();ctx.translate(w*.5,h*.43);ctx.scale(zoom,zoom);ctx.translate(-w*.5,-h*.43);
   const pitch=w<700?5:10,step=w<700?6:8;
   if(pixels){
    ctx.fillStyle='#c9b894';
    for(let x=0;x<pw;x+=pitch)for(let y=0;y<ph;y+=step){
     const sx=Math.min(255,Math.floor(x/pw*256)),sy=Math.min(287,Math.floor(y/ph*288));
     const at=(sy*256+sx)*4,r=pixels[at],g=pixels[at+1],b=pixels[at+2];
     const sky=b>g*1.06&&b>r*1.10;
     const yy=y/ph,xx=x/pw;
     const rim=.48*Math.sqrt(Math.max(0,1-Math.pow((yy-.58)/.63,2)))+.014*Math.sin(sy*.18);
     if(Math.abs(xx-.5)>rim)continue;
     if(sky)continue;
     const light=(r*.3+g*.5+b*.2)/255;
     const tone=Math.max(0,Math.min(1,(light-.07)/.60));
     if(tone<.06)continue;
     const width=pitch*(tone>.8?.94:tone>.6?.76:tone>.4?.5:tone>.22?.24:.08);
     const crown=sy<130&&g>r*1.04;
     const breeze=crown?Math.sin(t*.8+sy*.05)*2.4:0;
     const boundary=Math.min(1,x/(pw*.06),(pw-x)/(pw*.06),(ph-y)/(ph*.07));
     ctx.fillRect(ox+x+breeze,oy+y,width*boundary,step+.25);
    }
    // The original natural opening is also the actual camera destination.
    const hole=[[.401,.297],[.433,.276],[.479,.27],[.516,.285],[.546,.319],[.556,.365],[.536,.425],[.49,.455],[.453,.418],[.418,.37]];
    // Quantise the opening to the same engraving grid as its stone edges.
    for(let x=0;x<pw;x+=pitch)for(let y=ph*.265;y<ph*.46;y+=step){
     const nx=x/pw,ny=y/ph;let inside=false;
     for(let i=0,j=hole.length-1;i<hole.length;j=i++){
      const [xi,yi]=hole[i],[xj,yj]=hole[j];
      if((yi>ny)!==(yj>ny)&&nx<(xj-xi)*(ny-yi)/(yj-yi)+xi)inside=!inside;
     }
     if(inside)ctx.fillRect(ox+x,oy+y,pitch+.3,step+.3);
    }
   }
   birds.draw(0,t,{x:ox+pw*.48,y:oy+ph*.355});birdSample.clearRect(0,0,720,450);birdSample.drawImage(birds.canvas,0,0,720,450);
   const bp=birdSample.getImageData(0,0,720,450).data;
   ctx.fillStyle='#c9b894';
   const birdPitch=2,birdStep=1;
   for(let x=0;x<720;x+=birdPitch)for(let y=0;y<450;y+=birdStep){
    const a=bp[(y*720+x)*4+3];if(a<120)continue;
    const px=x/720*w,py=y/450*h;
    ctx.fillRect(px,py,w/720*1.65,h/450*birdStep+.2);
   }
   ctx.restore();

   const reveal=Math.max(0,Math.min(1,(h*.60-rect.top)/(h*.32)));
   if(reveal<1){ctx.save();ctx.globalAlpha=1-reveal;ctx.fillStyle='#292920';ctx.fillRect(0,0,w,h);ctx.restore();}

  };
  frame=requestAnimationFrame(draw);addEventListener('resize',resize);
  return()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();document.removeEventListener('visibilitychange',visibility);birds.dispose();environment.dispose();removeEventListener('resize',resize);};
 },[]);
 return <section ref={root} className="work-prelude" id="work" aria-labelledby="work-title"><div className="work-stage"><CloudPassage/><canvas ref={surface} aria-hidden="true"/><div className="work-heading" lang="en"><span className="work-kicker">A CLOSER LOOK</span><h2 id="work-title">Selected<br/><em>work.</em></h2><span className="work-caption">Individual ideas. Built for the real world.</span></div><WorkGallery/></div></section>;
}
