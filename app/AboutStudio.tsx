'use client';
import {useEffect, useRef, type CSSProperties} from 'react';
import {clamp, ease, observeScrollScene} from './scroll-scene';
import {createStudioInk} from './studio-ink';

const exchanges=[
 {you:'Here’s what I have in mind.',studio:'Let’s give it a direction.'},
 {you:'Can we try a different approach?',studio:'Let’s find what feels right.'},
 {you:'What happens next?',studio:'We’ll keep you in the loop.'},
];

export default function AboutStudio(){
 const root=useRef<HTMLElement>(null);
 const pen=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
  const el=root.current!,letters=Array.from(el.querySelectorAll<HTMLElement>('.studio-letter')),dialogue=el.querySelector<HTMLElement>('.studio-dialogue')!,intro=el.querySelector<HTMLElement>('.studio-intro')!,final=el.querySelector<HTMLElement>('.studio-final')!;
  const messages=Array.from(el.querySelectorAll<HTMLElement>('.studio-exchange'));
  const ink=createStudioInk(pen.current!,el.querySelector<HTMLElement>('.studio-wordmark')!);
  let reduced=false,visible=false,frame=0,tx=0,ty=0,x=0,y=0;
  const pointer=(event:PointerEvent)=>{if(reduced||event.pointerType!=='mouse')return;tx=(event.clientX/innerWidth-.5)*2;ty=(event.clientY/innerHeight-.5)*2;if(!frame)frame=requestAnimationFrame(drift);};
  const leave=()=>{tx=0;ty=0;if(!frame)frame=requestAnimationFrame(drift);};
  const drift=()=>{
   frame=0;if(!visible||reduced)return;x+=(tx-x)*.09;y+=(ty-y)*.09;
   el.style.setProperty('--studio-x',String(x));el.style.setProperty('--studio-y',String(y));
   if(Math.abs(tx-x)+Math.abs(ty-y)>.002)frame=requestAnimationFrame(drift);
  };
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;el.classList.toggle('studio-in-view',visible);if(!visible){cancelAnimationFrame(frame);frame=0;}else if(!frame)frame=requestAnimationFrame(drift);});observer.observe(el);
  const stop=observeScrollScene(el,(p,natural)=>{
   reduced=natural;el.classList.toggle('natural-chapters',natural);
   ink.update(p,natural);
   el.style.setProperty('--studio-progress',String(p));
   el.style.setProperty('--brand-enter',String(ease((p+.035)/.12)));
   el.style.setProperty('--brand-fold',String(ease((p-.12)/.14)));
   el.style.setProperty('--direct',String(ease((p-.22)/.12)));
   el.style.setProperty('--dialogue-out',String(ease((p-.68)/.10)));
   const finish=ease((p-.76)/.12);el.style.setProperty('--studio-finish',String(finish));
   const boxes=letters.map(letter=>letter.getBoundingClientRect()),stroke=boxes[0].left+(boxes[boxes.length-1].right-boxes[0].left)*ease(p/.115);
   letters.forEach((letter,i)=>letter.style.setProperty('--letter-arrival',String(natural?1:clamp((stroke-boxes[i].left)/boxes[i].width))));
   intro.setAttribute('aria-hidden',String(!natural&&p>.26));dialogue.setAttribute('aria-hidden',String(!natural&&(p<.22||p>.78)));final.setAttribute('aria-hidden',String(!natural&&finish<.01));
   messages.forEach((message,i)=>{
    const start=.28+i*.13,show=ease((p-start)/.022)*(1-ease((p-start-.10)/.03));
    message.style.setProperty('--message-in',String(ease((p-start)/.018)));message.style.setProperty('--reply-in',String(ease((p-start-.018)/.024)));message.style.setProperty('--message-out',String(ease((p-start-.10)/.03)));
    message.style.setProperty('--message-show',String(show));message.setAttribute('aria-hidden',String(!natural&&show<.01));
   });
  });
  el.addEventListener('pointermove',pointer);el.addEventListener('pointerleave',leave);
  return()=>{stop();ink.dispose();observer.disconnect();cancelAnimationFrame(frame);el.removeEventListener('pointermove',pointer);el.removeEventListener('pointerleave',leave);};
 },[]);
 return <section ref={root} id="studio" className="about-studio" lang="en" aria-labelledby="studio-title">
  <div className="studio-stage" data-scroll-stage>
   <header className="chapter-header"><span>About the studio</span><span>Independent by choice</span></header>
   <canvas ref={pen} className="studio-pen" aria-hidden="true"/>
   <div className="studio-wordmark" role="img" aria-label="POUDEV">{'POUDEV'.split('').map((letter,i)=><span className="studio-letter" key={i} aria-hidden="true" style={{'--letter-index':i} as CSSProperties}><span>{letter}</span></span>)}</div>
   <div className="studio-intro"><p>Small studio.</p><span>Close to your project.</span></div>
   <div className="studio-dialogue"><div className="studio-people"><span>You.</span><span>Us.</span></div>
    <div className="direct-line" aria-hidden="true"><span/><i/><i/></div>
    {exchanges.map(exchange=><div className="studio-exchange" key={exchange.you}><div className="message-from-you"><span className="folio-eyebrow">You</span><p>{exchange.you}</p></div><div className="message-from-studio"><span className="folio-eyebrow">POUDEV</span><p>{exchange.studio}</p></div></div>)}
    <p className="studio-dialogue-note">The people you talk to are the people making your website.</p>
   </div>
   <div className="studio-final"><h2 id="studio-title"><span>Small studio.</span><em>Personal attention.</em></h2><p>POUDEV is an independent web studio. We work directly with you, keep communication simple, and take care of the details — from the first conversation to launch.</p><div className="studio-promises"><span>Direct contact</span><span>Clear updates</span><span>Considered details</span></div></div>
   <footer className="studio-footer"><span>POUDEV</span><span>Design, content & development</span></footer>
  </div>
 </section>;
}
