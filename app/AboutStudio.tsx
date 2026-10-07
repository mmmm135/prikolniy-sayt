'use client';
import {useEffect, useRef} from 'react';
import {ease, observeScrollScene} from './scroll-scene';

export default function AboutStudio() {
 const root = useRef<HTMLElement>(null);
 useEffect(() => {
  const el = root.current!;
  return observeScrollScene(el, (p, reduced) => {
   const opening = reduced ? 1 : ease((p-.08)/.60);
   el.style.setProperty('--studio-open', String(opening));
   el.style.setProperty('--studio-copy', String(reduced ? 1 : ease((p-.42)/.32)));
   el.dataset.open = String(opening > .96);
  });
 }, []);
 return <section ref={root} className="about-studio" id="studio" lang="en" aria-labelledby="studio-title">
  <div className="about-stage" data-scroll-stage>
   <div className="studio-interior">
    <div className="studio-topline"><span className="chapter-kicker">04 / THE STUDIO</span><span>INDEPENDENT BY DESIGN.</span></div>
    <div className="studio-personal"><span className="studio-pretitle">Small studio. Big on the details.</span><h2 id="studio-title">Personal<br/><em>attention.</em><span className="studio-title-star" aria-hidden="true">✳</span></h2></div>
    <div className="studio-details"><div className="studio-principles"><span>DIRECT CONVERSATIONS.</span><span>CONSIDERED DECISIONS.</span><span>CARE IN EVERY DETAIL.</span></div><div className="studio-description"><p>POUDEV is an independent web studio. We work directly with you, keep communication simple, and take care of the details — from the first conversation to launch.</p><span>Close collaboration. From start to finish.</span></div></div>
    <div className="studio-signature" aria-hidden="true">POUDEV<span>✳</span></div>
   </div>
   <div className="studio-door studio-door-left" aria-hidden="true"><span className="door-index">04 / A CLOSER INTRODUCTION</span><div className="door-word">Small</div><span className="door-foot">A SMALL STUDIO.</span></div>
   <div className="studio-door studio-door-right" aria-hidden="true"><span className="door-index">POUDEV</span><div className="door-word"><em>studio.</em></div><span className="door-foot">ROOM FOR YOUR BIG IDEA.</span></div>
   <div className="studio-seam" aria-hidden="true"><span>✳</span><i/><span>SCROLL A LITTLE CLOSER</span></div>
  </div>
  <footer className="studio-colophon"><span className="studio-closing">Good ideas deserve good company.</span><span>POUDEV — INDEPENDENT WEB STUDIO</span></footer>
 </section>;
}
