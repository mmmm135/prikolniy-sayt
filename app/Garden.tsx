"use client";
import {useEffect, useRef} from 'react';

export default function Garden(){
 const root=useRef<HTMLElement>(null),canvas=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
  const el=root.current!, c=canvas.current!, ctx=c.getContext('2d')!;
  let w=1,h=1,raf=0,last=0,started=false,visible=false,disposed=false;
  const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
  const copy=el.querySelectorAll('.botanical-reveal');
  copy.forEach(node=>{const element=node as HTMLElement;element.style.transform=reduced?'none':'translateY(105%)';element.style.opacity=reduced?'1':'0';});
  const textAnimations:Animation[]=[];
  const reveal=()=>copy.forEach((node,index)=>{
   const element=node as HTMLElement;
   element.style.transform='none';element.style.opacity='1';
   if(!reduced)textAnimations.push(element.animate([{transform:'translateY(105%)',opacity:0},{transform:'translateY(0)',opacity:1}],{duration:1150,delay:250+index*160,easing:'cubic-bezier(.215,.61,.355,1)',fill:'backwards'}));
  });
  const video=document.createElement('video');
  video.muted=true;video.playsInline=true;video.preload='none';video.playbackRate=1.35;
  const buffer=document.createElement('canvas');buffer.width=320;buffer.height=360;
  const sampler=buffer.getContext('2d',{willReadFrequently:true})!;
  const resize=()=>{w=c.clientWidth;h=c.clientHeight;const dpr=Math.min(devicePixelRatio,2);c.width=w*dpr;c.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);};resize();
  const begin=()=>{
   if(disposed||started||!visible||video.readyState<2)return;
   started=true;
   reveal();
   if(reduced)video.currentTime=11.8;else void video.play().catch(()=>{video.currentTime=11.8;});
  };
  video.addEventListener('loadeddata',begin);
  const failed=()=>{if(!disposed&&!started){started=true;reveal();}};video.addEventListener('error',failed);
  // Fetch this chapter's footage shortly before it enters view, not at the hero.
  const loader=new IntersectionObserver(entries=>{
   if(disposed||!entries[0].isIntersecting)return;
   loader.disconnect();video.preload='auto';video.src='/art/rose-print.webm';video.load();
  },{rootMargin:'700px'});loader.observe(el);
  const observer=new IntersectionObserver(entries=>{
   visible=entries[0].isIntersecting;
   if(visible){begin();if(!raf)raf=requestAnimationFrame(draw);if(started&&!reduced&&!video.ended)void video.play().catch(()=>{});}else{video.pause();cancelAnimationFrame(raf);raf=0;}
  },{threshold:.2});observer.observe(el);
  const draw=(now:number)=>{
   raf=0;if(!visible||document.hidden)return;raf=requestAnimationFrame(draw);if(now-last<40||video.readyState<2)return;last=now;
   ctx.clearRect(0,0,w,h);
   // Real bud-to-flower footage, sampled into a stepped two-colour engraving.
   sampler.drawImage(video,0,0,320,360);
   const data=sampler.getImageData(0,0,320,360).data;
   const mobile=w<700;
   const pw=mobile?w*.87:Math.min(w*.39,560),ph=pw*1.125;
   const pitch=mobile?4:6,cell=mobile?5:8;
   ctx.fillStyle='#c9b894';
   for(let i=0;i<2;i++){
    const ox=i===0?-pw*.22:w-pw*.78;
    const oy=mobile?h*.53:h*.18+i*90;
    const sway=reduced?0:Math.sin(now*.00045+i*2)*3;
    for(let x=0;x<pw;x+=pitch)for(let y=0;y<ph;y+=cell){
     const sx=Math.min(319,Math.floor(x/pw*320)),sy=Math.min(359,Math.floor(y/ph*360));
     const at=(sy*320+sx)*4,r=data[at],g=data[at+1],b=data[at+2];
     if(Math.max(r,g,b)<22)continue;
     const light=(r*.35+g*.45+b*.2)/255;
     const level=light>.51?.91:light>.38?.68:light>.25?.36:light>.14?.16:.06;
     // Disintegrate the cropped stem/foliage edge into staggered incisions.
     const hash=(Math.sin(sx*12.9898+sy*78.233)*43758.5453)%1;
     const bottom=Math.max(0,Math.min(1,(1-y/ph)/.25));
     const screenBottom=Math.max(0,Math.min(1,(h-oy-y-12)/(mobile?100:35)));
     if((y>ph*.75 && Math.abs(hash)>bottom)||Math.abs(hash)>screenBottom)continue;
     const width=pitch*level*(y>ph*.75?Math.max(.08,bottom):1)*screenBottom;
     const px=i===0?ox+x:ox+pw-x;
     ctx.fillRect(px+sway*(1-y/ph),oy+y,width,cell+.3);
     // Sparse hairline incisions extend the square silhouette, as in a woodcut.
     if(light>.46 && sy>0 && Math.max(data[at-1280],data[at-1279],data[at-1278])<22){
      ctx.fillRect(px+sway,oy+y-10,pitch*.12,10);
     }
    }
   }
  };
  const visibility=()=>{if(!document.hidden&&visible&&!raf)raf=requestAnimationFrame(draw);};document.addEventListener('visibilitychange',visibility);addEventListener('resize',resize);
  return()=>{disposed=true;cancelAnimationFrame(raf);observer.disconnect();loader.disconnect();document.removeEventListener('visibilitychange',visibility);textAnimations.forEach(animation=>animation.cancel());video.pause();video.removeEventListener('error',failed);video.removeEventListener('loadeddata',begin);video.removeAttribute('src');video.load();removeEventListener('resize',resize);};
 },[]);
 return <div className="afterwater"><div className="night-threshold" aria-hidden="true"/>
  <section ref={root} className="botanical" id="about" aria-labelledby="botanical-title">
   <canvas ref={canvas} aria-hidden="true"/>
   <div className="botanical-copy" lang="en">
    <div className="botanical-mask"><span className="botanical-label botanical-reveal">CONTENT · DESIGN · DEVELOPMENT</span></div>
    <h2 id="botanical-title"><span className="botanical-mask"><span className="botanical-reveal">From an idea</span></span><span className="botanical-mask"><em className="botanical-reveal">to a live website.</em></span></h2>
    <div className="botanical-mask"><p className="botanical-reveal">Starting fresh or rethinking what you already have?<br/>{' '}We bring content, design, and development together<br/>{' '}to build a website that fits your business.</p></div>
    <div className="botanical-mask"><span className="botanical-sign botanical-reveal">✦</span></div>
   </div>
  </section>

 </div>;
}
