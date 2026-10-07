'use client';
import {useEffect,useRef} from 'react';
import {ease} from './scroll-scene';

export default function AboutStudio(){
 const root=useRef<HTMLElement>(null),canvas=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
  const el=root.current!,c=canvas.current!,ctx=c.getContext('2d')!;
  const sample=document.createElement('canvas');sample.width=512;sample.height=342;
  const sampler=sample.getContext('2d',{willReadFrequently:true})!;
  let pixels:Uint8ClampedArray|undefined,w=1,h=1,frame=0,visible=false,disposed=false,dirty=true,last=0;
  let mx=0,my=0,px=0,py=0;
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const image=new Image();image.onload=()=>{if(disposed)return;sampler.drawImage(image,0,0,512,342);pixels=sampler.getImageData(0,0,512,342).data;dirty=true;};image.src='/art/studio-hand.jpg';
  const resize=()=>{w=c.clientWidth;h=c.clientHeight;const d=Math.min(devicePixelRatio,1.5);c.width=Math.round(w*d);c.height=Math.round(h*d);ctx.setTransform(d,0,0,d,0,0);dirty=true;};
  const resizer=new ResizeObserver(resize);resizer.observe(c);resize();
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;dirty=true;});observer.observe(el);
  const scroll=()=>{dirty=true;};
  const pointer=(event:PointerEvent)=>{if(event.pointerType!=='mouse'||motion.matches)return;mx=(event.clientX/w-.5)*8;my=(event.clientY/h-.5)*5;dirty=true;};
  addEventListener('scroll',scroll,{passive:true});el.addEventListener('pointermove',pointer);motion.addEventListener('change',scroll);
  const draw=(now:number)=>{
   frame=requestAnimationFrame(draw);
   if(!visible||document.hidden||now-last<33||(!dirty&&Math.abs(px-mx)+Math.abs(py-my)<.05))return;
   last=now;dirty=false;px+=(mx-px)*.08;py+=(my-py)*.08;
   const reduced=motion.matches,rect=el.getBoundingClientRect();
   const reveal=reduced?1:ease((innerHeight*.86-rect.top)/(innerHeight*.67));
   el.style.setProperty('--studio-reveal',String(reveal));
   ctx.clearRect(0,0,w,h);if(!pixels)return;
   const mobile=w<=700,pw=mobile?w*1.9:w*1.02,ph=pw*342/512;
   const ox=(mobile?-w*.47:w*.16)+(1-reveal)*w*.16+(reduced?0:px);
   const oy=(mobile?h*.43:h*.11)+(1-reveal)*h*.10+(reduced?0:py);
   const pitch=mobile?3.5:5,cell=mobile?5:6;
   ctx.fillStyle='#c9b894';
   for(let x=0;x<pw;x+=pitch)for(let y=0;y<ph;y+=cell){
    const sx=Math.min(511,Math.floor(x/pw*512)),sy=Math.min(341,Math.floor(y/ph*342));
    const tone=pixels[(sy*512+sx)*4]/255;if(tone<.065)continue;
    const edge=Math.min(1,(h-oy-y)/30);if(edge<=0)continue;
    ctx.fillRect(Math.round((ox+x)/pitch)*pitch,Math.round((oy+y)/cell)*cell,pitch*Math.pow(tone,.75)*.87,cell*.96);
   }
  };
  frame=requestAnimationFrame(draw);
  return()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();resizer.disconnect();removeEventListener('scroll',scroll);el.removeEventListener('pointermove',pointer);motion.removeEventListener('change',scroll);};
 },[]);
 return <section ref={root} className="about-studio" id="studio" lang="en" aria-labelledby="studio-title">
  <canvas ref={canvas} className="studio-hand" aria-hidden="true"/>
  <div className="studio-copy"><h2 id="studio-title"><span className="studio-line"><span>Small studio.</span></span><span className="studio-line"><em>Personal attention.</em></span></h2>
   <p>POUDEV is an independent web studio. We work directly with you, keep communication simple, and take care of the details — from the first conversation to launch.</p>
  </div>
  <footer className="studio-footer"><span>POUDEV</span><span>Independent web studio</span></footer>
 </section>;
}
