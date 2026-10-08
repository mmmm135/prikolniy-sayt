import {clamp,ease} from './scroll-scene';

// The pencil's nib follows the live typesetting, including responsive scaling.
// The source hand is only a moving actor in the opening printing sequence.
export function createStudioInk(canvas:HTMLCanvasElement,wordmark:HTMLElement){
 const ctx=canvas.getContext('2d')!,sample=document.createElement('canvas');sample.width=512;sample.height=342;
 const sampler=sample.getContext('2d',{willReadFrequently:true})!;
 let pixels:Uint8ClampedArray|undefined,w=1,h=1,p=0,reduced=false,visible=false,dirty=true,disposed=false,frame=0;
 const source=new Image();source.onload=()=>{if(disposed)return;sampler.drawImage(source,0,0,512,342);pixels=sampler.getImageData(0,0,512,342).data;dirty=true;schedule();};
 const resize=()=>{w=canvas.clientWidth;h=canvas.clientHeight;const d=Math.min(devicePixelRatio,1.5);canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);ctx.setTransform(d,0,0,d,0,0);dirty=true;};
 const resizer=new ResizeObserver(resize);resizer.observe(canvas);resize();
 const loader=new IntersectionObserver(entries=>{if(!entries[0].isIntersecting||disposed)return;loader.disconnect();source.src='/art/studio-hand-sample.webp';},{rootMargin:'700px'});loader.observe(canvas);
 const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;dirty=true;schedule();});observer.observe(canvas);
 const schedule=()=>{if(visible&&!frame&&!disposed)frame=requestAnimationFrame(draw);};
 const draw=()=>{
  frame=0;if(!visible||document.hidden||!dirty)return;dirty=false;ctx.clearRect(0,0,w,h);
  if(!pixels||reduced||p>.23)return;
  const letters=wordmark.querySelectorAll<HTMLElement>('.studio-letter'),first=letters[0].getBoundingClientRect(),last=letters[letters.length-1].getBoundingClientRect(),bounds=canvas.getBoundingClientRect();
  const travel=ease(p/.115),exit=ease((p-.12)/.085),alpha=ease((p+.005)/.025)*(1-exit);
  const nibX=first.left-bounds.left+(last.right-first.left)*travel+exit*w*.35;
  const nibY=first.bottom-bounds.top-first.height*.12+Math.sin(travel*Math.PI*12)*first.height*.09+exit*h*.4;
  const pw=w<=700?w*1.20:Math.min(w*.74,1050),ph=pw*342/512;
  const ox=nibX-pw*.365,oy=nibY-ph*.706,pitch=w<=700?3.5:5,cell=w<=700?4.5:6;
  ctx.globalAlpha=clamp(alpha);ctx.fillStyle='#c9b894';
  for(let x=0;x<pw;x+=pitch)for(let y=0;y<ph;y+=cell){
   const sx=Math.min(511,Math.floor(x/pw*512)),sy=Math.min(341,Math.floor(y/ph*342)),tone=pixels[(sy*512+sx)*4]/255;
   if(tone<.07)continue;
   ctx.fillRect(Math.round((ox+x)/pitch)*pitch,Math.round((oy+y)/cell)*cell,pitch*Math.pow(tone,.8)*.87,cell*.93);
  }
  ctx.globalAlpha=1;
 };
 return{update(progress:number,natural:boolean){p=progress;reduced=natural;dirty=true;schedule();},dispose(){disposed=true;cancelAnimationFrame(frame);observer.disconnect();loader.disconnect();resizer.disconnect();source.onload=null;}};
}
