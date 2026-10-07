'use client';
import {useEffect, useRef} from 'react';
import {clamp, ease, observeScrollScene} from './scroll-scene';
import './studio-chapters.css';

const stages = [
 {name:'Discover', copy:'We talk about your business, your audience, and what your website needs to do. Together, we turn an open question into a focused brief.', outcome:'A clear starting point', start:.185, end:.405},
 {name:'Shape', copy:'We put the pages, words, and visual direction in place. You can see how it all fits together — and give your input before development begins.', outcome:'An agreed direction', start:.405, end:.635},
 {name:'Build & launch', copy:'We build the site, check the details across devices, and get it ready to go live. You see the progress and know what happens next.', outcome:'A website ready to use', start:.635, end:.865},
];

function Brief(){return <div className="process-brief">
 <span className="folio-eyebrow">The starting point</span><h4>Your business.<br/><em>A clear brief.</em></h4>
 <dl><div><dt>Audience</dt><dd>The people you want to reach</dd></div><div><dt>Purpose</dt><dd>What the website needs to do</dd></div><div><dt>Character</dt><dd>What makes your business yours</dd></div></dl>
</div>;}

function Structure(){return <div className="process-structure">
 <div className="structure-rule"/><div className="structure-masthead"><span>Your business</span><span>01 — Homepage</span></div>
 <div className="structure-title"><span>A place for</span><em>your story.</em></div>
 <div className="structure-copy"><p>The right words.<br/>In the right order.</p><span>Who you are</span><span>What you offer</span><span>How to get in touch</span></div>
 <div className="structure-baseline"/><span className="structure-note">One direction, agreed together.</span>
</div>;}

function Launch(){return <div className="process-launch">
 <div className="launch-site"><div className="launch-masthead"><span>Your business</span><span>Welcome</span></div>
 <div className="launch-headline">Your next<br/><em>chapter.</em></div>
 <div className="launch-body"><p>A website that knows<br/>what it wants to say.</p><span>Discover what we do</span></div>
 <div className="launch-foot"><span>Made for your people.</span><span>Made to work.</span></div></div>
 <div className="launch-mobile" aria-hidden="true"><span>Your business</span><strong>Your next<br/><em>chapter.</em></strong><p>A website that knows<br/>what it wants to say.</p><span>Made to work.</span></div>
 <div className="launch-checks"><span>Responsive</span><span>Tested</span><span>Ready to launch</span></div>
</div>;}

export default function Process(){
 const root=useRef<HTMLElement>(null);
 useEffect(()=>{
  const el=root.current!,question=el.querySelector<HTMLElement>('.process-question')!,chapters=Array.from(el.querySelectorAll<HTMLElement>('.process-chapter'));
  const ending=el.querySelector<HTMLElement>('.process-ending')!,counter=el.querySelector<HTMLElement>('.process-current')!;
  return observeScrollScene(el,(p,reduced)=>{
   el.classList.toggle('natural-chapters',reduced);el.style.setProperty('--process-progress',String(p));
   const arrival=ease(p/.065),departure=ease((p-.10)/.09);
   question.style.setProperty('--question-enter',String(arrival));question.style.setProperty('--question-exit',String(departure));
   question.setAttribute('aria-hidden',String(!reduced&&departure>.99));
   chapters.forEach((chapter,i)=>{
    const step=stages[i],local=clamp((p-step.start)/(step.end-step.start)),show=ease((p-step.start)/.024)*(1-ease((p-step.end+.025)/.025));
    chapter.style.setProperty('--chapter-show',String(show));chapter.style.setProperty('--local',String(local));
    chapter.style.setProperty('--settle',String(ease((local-.15)/.48)));chapter.style.setProperty('--resolve',String(ease((local-.50)/.13)));chapter.style.setProperty('--question-gather',String(ease((local-.34)/.13)));
    chapter.style.setProperty('--draw',String(ease((local-.08)/.55)));chapter.style.setProperty('--device',String(ease((local-.5)/.22)));
    for(let j=0;j<3;j++){
     chapter.style.setProperty(`--beat-${j}`,String(ease((local-.04-j*.11)/.17)));
     chapter.style.setProperty(`--check-${j}`,String(ease((local-.50-j*.085)/.1)));
    }
    chapter.setAttribute('aria-hidden',String(!reduced&&show<.01));chapter.inert=!reduced&&show<.01;
   });
   const end=ease((p-.865)/.055);ending.style.setProperty('--ending',String(end));ending.setAttribute('aria-hidden',String(!reduced&&end<.01));
   counter.textContent=p<.185?'00':p<.405?'01':p<.635?'02':p<.865?'03':'03';
  });
 },[]);
 return <section ref={root} id="process" className="process-section" lang="en" aria-labelledby="process-title">
  <div className="process-stage" data-scroll-stage>
   <header className="chapter-header"><h2 id="process-title">The process</h2><span><span className="process-current" aria-hidden="true">00</span><span aria-hidden="true"> / 03</span></span></header>
   <div className="process-route" aria-hidden="true"><span/></div>
   <div className="process-question"><div className="question-paper"><span className="folio-eyebrow">You have an idea.</span><p>But where<br/><em>do we start?</em></p><span className="question-foot">Let’s work it out, together.</span></div></div>
   {stages.map((step,i)=><article className={`process-chapter chapter-${i}`} key={step.name} aria-labelledby={`process-step-${i}`}>
    <div className="process-action">
     {i===0?<><div className="discovery-questions" aria-hidden="true"><span>Who is it for?</span><span>What should it do?</span><span>What makes you different?</span></div><Brief/></>:i===1?<><div className="shape-ingredients" aria-hidden="true"><span>Structure</span><span>Content</span><span>Direction</span></div><Structure/></>:<Launch/>}
    </div>
    <div className="process-explanation"><div className="process-name"><span className="folio-eyebrow">0{i+1}</span><h3 id={`process-step-${i}`}>{step.name}</h3></div><div className="process-detail"><p>{step.copy}</p><span className="process-outcome">{step.outcome}</span></div></div>
   </article>)}
   <div className="process-ending"><span className="folio-eyebrow">From the first conversation to launch</span><h3>A clear process.<br/><em>Room for good ideas.</em></h3><p>You’re part of the process.<br/>We take care of bringing it together.</p><span className="ending-rule" aria-hidden="true"/></div>
  </div>
 </section>;
}
