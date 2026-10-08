'use client';
import {useEffect,useRef,useState} from 'react';
import type Lenis from 'lenis';

import Garden from './Garden';
import WorkPrelude from './WorkPrelude';
import Process from './Process';
import AboutStudio from './AboutStudio';
import ContactFinale from './ContactFinale';
import SiteHeader from './SiteHeader';
import LoadingScreen from './LoadingScreen';

export default function Home(){
 const stage=useRef<HTMLElement>(null),canvas=useRef<HTMLCanvasElement>(null),strokes=useRef<HTMLCanvasElement>(null);
 const smoothScroll=useRef<Lenis|null>(null);
 const [failed,setFailed]=useState(false),[ready,setReady]=useState(false);
 useEffect(()=>{
  let disposed=false,started=false,cleanup:(()=>void)|undefined;
  const deadline=setTimeout(()=>{if(!disposed)setFailed(true);},12000);
  const start=()=>{
   if(started||disposed)return;started=true;
   void import('./hero-scene').then(module=>{
    if(disposed)return;
    cleanup=module.mountHero(stage.current!,canvas.current!,strokes.current!,()=>{clearTimeout(deadline);setReady(true);},()=>{clearTimeout(deadline);setFailed(true);},lenis=>{smoothScroll.current=lenis;});
   }).catch(error=>{console.warn('Hero enhancement unavailable',error);if(!disposed)setFailed(true);});
  };
  // Prepare the first painted scene while the original loading sequence plays.
  start();
  return()=>{disposed=true;clearTimeout(deadline);cleanup?.();smoothScroll.current=null;};
 },[]);
 useEffect(()=>{
  const navigate=(event:Event)=>{
   const target=document.getElementById((event as CustomEvent<string>).detail);
   if(!target)return;
   if(smoothScroll.current)smoothScroll.current.scrollTo(target,{duration:1.1,immediate:matchMedia('(prefers-reduced-motion: reduce)').matches});
   else target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
  };
  const menu=(event:Event)=>{if((event as CustomEvent<boolean>).detail)smoothScroll.current?.stop();else smoothScroll.current?.start();};
  window.addEventListener('poudev:navigate',navigate);
  window.addEventListener('poudev:menu',menu);
  return()=>{window.removeEventListener('poudev:navigate',navigate);window.removeEventListener('poudev:menu',menu);};
 },[]);
 return <main>
  <LoadingScreen ready={ready||failed}/>
  <SiteHeader/>
  <section id="home" ref={stage} className={"scene-scroll"+(ready?" is-ready":"")+(failed?" scene-unavailable":"")} aria-label="POUDEV introductory artwork">
   <div className="scene"><picture className="hero-poster"><source media="(max-width:700px)" srcSet="/art/hero-mobile.webp"/><img src="/art/hero-desktop.webp" width={1440} height={900} fetchPriority="high" alt=""/></picture><canvas ref={canvas} className="night" aria-hidden="true"/><canvas ref={strokes} className="stroke-field" aria-hidden="true"/>
    <div className="intro" lang="en"><h1>Your business deserves<br/>a better website.</h1><p>We design, write, and build custom websites.<br/>One studio, from the first idea to launch.</p></div>
    <h2 className="sr-only">POUDEV — independent web design and development studio</h2>
   </div>
  </section>
  <Garden/>
  <WorkPrelude/>
  <Process/>
  <div className="night-threshold" aria-hidden="true"/>
  <AboutStudio/>
  <ContactFinale/>
 </main>;
}

