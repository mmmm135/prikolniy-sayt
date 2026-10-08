'use client';
import {useEffect,useRef,useState} from 'react';
import LoadingButterfly from './LoadingButterfly';
import LoadingWordmark from './LoadingWordmark';
import {createStrokeScene} from './stroke-scene';
export default function LoadingScreen({ready}:{ready:boolean}){
 const canvas=useRef<HTMLCanvasElement>(null),[mode,setMode]=useState<'intro'|'simple'>('intro'),[leaving,setLeaving]=useState(false),[done,setDone]=useState(false);
 const started=useRef(0),readyRef=useRef(false),revealRef=useRef<(()=>void)|undefined>(undefined);
 useEffect(()=>{
  const root=document.documentElement;
  started.current=Number(root.dataset.loadingStarted)||performance.now();
  root.classList.add('site-loading');
  const repeat=root.dataset.loadingMode==='simple';
  const timer=setTimeout(()=>setMode(repeat?'simple':'intro'),0);
  return()=>{clearTimeout(timer);document.documentElement.classList.remove('site-loading');};
 },[]);
 useEffect(()=>{
  readyRef.current=ready;if(ready)revealRef.current?.();
 },[ready]);
 useEffect(()=>{
  if(done||mode!=='intro')return;
  let scene:ReturnType<typeof createStrokeScene>;
  try{scene=createStrokeScene(canvas.current!,{sampleLandscape:false});}catch(error){console.warn('Loading wordmark unavailable',error);return;}
  let frame=0;const begin=performance.now(),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const draw=(now:number)=>{const t=leaving?Math.min(1,(now-begin)/(reduced?1:1100)):0;scene.drawMark(1-Math.pow(1-t,3));canvas.current?.closest('.loading-screen')?.classList.add('loading-mark-live');if(t<1||!leaving)frame=requestAnimationFrame(draw);};frame=requestAnimationFrame(draw);
  const resize=()=>scene.resize();addEventListener('resize',resize);return()=>{cancelAnimationFrame(frame);removeEventListener('resize',resize);};
 },[leaving,done,mode]);
 // One controller per navigation. Readiness changes cannot cancel an active exit.
 useEffect(()=>{
  let exit:ReturnType<typeof setTimeout>,finish:ReturnType<typeof setTimeout>,fontTimeout:ReturnType<typeof setTimeout>;let cancelled=false,scheduled=false;
  const reveal=()=>{
   if(cancelled||scheduled)return;scheduled=true;
   exit=setTimeout(()=>{
    setLeaving(true);finish=setTimeout(()=>{setDone(true);document.documentElement.classList.remove('site-loading');},mode==='intro'?1250:400);
   },Math.max(0,(mode==='intro'?2000:0)-(performance.now()-started.current)));
  };
  const onReady=()=>{void Promise.race([document.fonts.ready,new Promise(resolve=>{fontTimeout=setTimeout(resolve,1000);})]).then(reveal);};
  revealRef.current=onReady;if(readyRef.current)onReady();
  return()=>{cancelled=true;revealRef.current=undefined;clearTimeout(fontTimeout);clearTimeout(exit);clearTimeout(finish);};
 },[mode]);
 if(done)return null;
 return <div className={'loading-screen '+(mode==='intro'?'loading-intro':'loading-simple')+(leaving?' loading-leaving':'')} role="status" aria-label="Loading POUDEV" aria-busy={!leaving}>
  {mode==='intro'&&<><div className="loading-panels" aria-hidden="true">{Array.from({length:18},(_,i)=><i key={i} style={{'--delay':(i*7%18)*18+'ms'} as React.CSSProperties}/>)}</div><div className="loading-object-space" aria-hidden="true"><LoadingButterfly/></div><LoadingWordmark/><canvas ref={canvas} className="loading-mark-canvas" aria-hidden="true"/></>}
  <span className="sr-only">POUDEV</span>
 </div>;
}
