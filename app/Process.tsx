'use client';
import {useEffect, useRef} from 'react';
import {ease, observeScrollScene} from './scroll-scene';
import {createProcessLines} from './process-lines';
import './studio-chapters.css';

const steps = [
 {name:'Discover', text:'We learn about your business, your audience, and what your website needs to achieve.'},
 {name:'Shape', text:'We agree on the structure, content, and visual direction before development begins.'},
 {name:'Build & launch', text:'We build, test, and launch your website. You see the progress along the way.'},
];
const starts = [.20, .43, .66];

export default function Process() {
 const root = useRef<HTMLElement>(null), canvas = useRef<HTMLCanvasElement>(null);
 useEffect(() => {
  const el=root.current!, question=el.querySelector<HTMLElement>('.process-question')!;
  const stories=Array.from(el.querySelectorAll<HTMLElement>('.process-story'));
  const conclusion=el.querySelector<HTMLElement>('.process-conclusion')!;
  const lines=createProcessLines(canvas.current!);
  const stop=observeScrollScene(el,(p,reduced)=>{
   el.style.setProperty('--process-progress',String(p));
   const arrival=ease((p+.025)/.09), departure=ease((p-.115)/.10);
   question.style.opacity=String(reduced?1:arrival*(1-departure));
   question.style.transform=reduced?'none':`translate3d(${-departure*innerWidth*.85}px,${(1-arrival)*innerHeight*.75-departure*25}px,0) rotate(${-departure*7}deg)`;
   question.setAttribute('aria-hidden',String(!reduced&&departure>.99));
   stories.forEach((story,i)=>{
    const enter=ease((p-starts[i])/.055), leave=ease((p-starts[i]-.18)/.045);
    const opacity=reduced?1:enter*(1-leave);
    story.style.opacity=String(opacity);
    story.style.transform=reduced?'none':`translateY(${(1-enter)*55-leave*40}px)`;
    story.setAttribute('aria-hidden',String(!reduced&&opacity<.01));
    story.inert=!reduced&&opacity<.1;
   });
   const ending=reduced?1:ease((p-.88)/.07);
   conclusion.style.opacity=String(ending);
   conclusion.style.transform=`translateY(${reduced?0:(1-ending)*25}px)`;
   conclusion.setAttribute('aria-hidden',String(!reduced&&ending<.01));
   lines.update(p,reduced);
  });
  return()=>{stop();lines.dispose();};
 },[]);
 return <section ref={root} className="process-section" id="process" lang="en" aria-labelledby="process-title">
  <div className="process-stage" data-scroll-stage>
   <h2 id="process-title" className="process-context">How we work</h2>
   <canvas ref={canvas} className="process-lines" aria-hidden="true"/>
   <div className="process-question"><p>How does<br/><em>this work?</em></p></div>
   <div className="process-stories">{steps.map((step,i)=><article className="process-story" key={step.name} aria-labelledby={`process-step-${i}`}>
    <span className="process-number">0{i+1}</span><h3 id={`process-step-${i}`}>{i===2?<>Build<br/><em>& launch.</em></>:<>{step.name}<em>.</em></>}</h3><p>{step.text}</p>
   </article>)}</div>
   <div className="process-conclusion"><h3>A clear process.<br/><em>Room for good ideas.</em></h3><p>From the first conversation to launch,<br/>you’re part of the process.</p></div>
  </div>
 </section>;
}
