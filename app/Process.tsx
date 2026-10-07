'use client';
import {useEffect, useRef} from 'react';
import {clamp, ease, observeScrollScene} from './scroll-scene';
import './studio-chapters.css';

const steps = [
 {name: 'Discover', note: 'First, the right questions.', title: <>Good websites start<br/>with <em>understanding.</em></>,
  text: 'We learn about your business, your audience, and your website’s goals. Together, we make a clear plan.',
  points: ['Your goals & your audience', 'What works. What needs to change.', 'Scope, priorities & a shared plan'],
  result: 'A clear brief. A shared starting point.'},
 {name: 'Shape', note: 'Give the idea a shape.', title: <>A place for every word.<br/>A reason for <em>every detail.</em></>,
  text: 'We map the pages, shape the content, and agree on the visual direction. You see the whole picture before development begins.',
  points: ['Page structure & the visitor’s journey', 'Content that sounds like you', 'A visual direction we agree on'],
  result: 'An agreed design. No guessing what comes next.'},
 {name: 'Build & launch', note: 'Make it real. Make it work.', title: <>Thoughtfully built.<br/><em>Ready for the world.</em></>,
  text: 'We build your website, test it across screens, and get it ready to launch. You see the progress and know what’s coming next.',
  points: ['Responsive development', 'Performance & the finishing touches', 'Testing, launch & a clear handover'],
  result: 'Your website, live. Your next chapter, open.'},
];
const starts = [.24, .47, .70];

function Brief() {
 return <div className="process-brief process-artifact">
  <div className="artifact-topline"><span>THE STARTING POINT</span><span>01 / BRIEF</span></div>
  <div className="brief-title"><span className="brief-desktop-title">Before pixels,<br/><em>purpose.</em></span><span className="brief-mobile-title">Find the<br/><em>purpose.</em></span></div>
  <div className="brief-field"><span>01 — THE BUSINESS</span><p>What makes you, you?</p></div>
  <div className="brief-field"><span>02 — THE PEOPLE</span><p>Who are we speaking to?</p></div>
  <div className="brief-field"><span>03 — THE GOAL</span><p>What should happen next?</p></div>
  <div className="brief-foot"><span>Made together.</span><span className="artifact-asterisk">✳</span></div>
 </div>;
}

function Structure() {
 return <div className="process-structure process-artifact">
  <div className="artifact-topline"><span>FROM IDEA TO DIRECTION</span><span>02 / DESIGN</span></div>
  <div className="structure-tabs"><span>Structure</span><span>Content</span><span>Visuals</span></div>
  <div className="structure-window">
   <div className="structure-nav"><strong>Your brand</strong><span>About &nbsp; · &nbsp; Contact</span></div>
   <div className="structure-hero"><div><span>A CLEAR FIRST IMPRESSION</span><h4>A place for<br/><em>your story.</em></h4><div className="structure-lines"/><span className="structure-link">Your next step</span></div><div className="structure-image"><img src="/art/woodland-pond.jpg" alt="" loading="lazy"/><span>01</span></div></div>
   <div className="structure-bottom"><span>What you do</span><span>Why it matters</span><span>Let’s talk</span></div>
  </div>
  <div className="structure-annotation">Every element has a purpose.</div>
 </div>;
}

function Launch() {
 return <div className="process-launch process-artifact">
  <div className="artifact-topline"><span>THE NEXT CHAPTER</span><span>03 / LAUNCH</span></div>
  <div className="launch-preview"><img src="/art/woodland-pond.jpg" alt="" loading="lazy"/><div className="launch-preview-copy"><span>YOUR IDEA, BROUGHT TO LIFE</span><h4>Ready to<br/><em>grow.</em></h4><span className="launch-site-label">A new home for your business.</span></div><div className="launch-corner">✳</div></div>
  <div className="launch-checks"><span><i>✓</i> Built for every screen</span><span><i>✓</i> Details, checked</span><span><i>✓</i> Ready to launch</span></div>
  <div className="launch-foot"><span>From the first idea to the final detail.</span><span>POUDEV</span></div>
 </div>;
}

export default function Process() {
 const root = useRef<HTMLElement>(null);
 useEffect(() => {
  const el = root.current!, question = el.querySelector<HTMLElement>('.process-question')!;
  const stories = Array.from(el.querySelectorAll<HTMLElement>('.process-story'));
  const markers = Array.from(el.querySelectorAll<HTMLButtonElement>('.process-step-button'));
  const visuals = Array.from(el.querySelectorAll<HTMLElement>('.process-story-visual'));
  const fit = () => {
   const sticky = getComputedStyle(el.querySelector('.process-stage')!).position === 'sticky';
   const storiesTop = el.querySelector<HTMLElement>('.process-stories')!.offsetTop;
   const footerTop = el.querySelector<HTMLElement>('.process-bottom')!.offsetTop;
   visuals.forEach(visual => {
    const artifact = visual.querySelector<HTMLElement>('.process-artifact')!;
    const compact = innerWidth <= 700 || !sticky;
    if (innerWidth <= 700 && sticky && innerHeight > 760) {
     const copy = visual.previousElementSibling as HTMLElement;
     const available = footerTop - storiesTop - copy.offsetHeight - 19 - 18;
     visual.style.display = available < 145 ? 'none' : '';
     visual.style.height = `${Math.min(150,Math.max(0,available))}px`;
    } else {
     visual.style.removeProperty('display');visual.style.removeProperty('height');
    }
    artifact.style.setProperty('--artifact-fit', String(compact ? 1 : Math.min(1, (visual.clientHeight-28)/artifact.offsetHeight, (visual.clientWidth-28)/artifact.offsetWidth)));
   });
  };
  const sizeObserver = new ResizeObserver(fit);
  visuals.forEach(visual => {sizeObserver.observe(visual);sizeObserver.observe(visual.firstElementChild!);});
  fit();
  const stop = observeScrollScene(el, (p, reduced) => {
   el.style.setProperty('--process-progress', String(p));
   const enter = ease((p + .025) / .13), exit = ease((p - .145) / .125);
   question.style.opacity = reduced ? '1' : String(enter * (1 - exit));
   question.style.transform = reduced ? 'none' : `translate3d(${exit * innerWidth * .95}px,${(1-enter)*innerHeight*.75-exit*75}px,0) rotate(${exit*13}deg)`;
   question.setAttribute('aria-hidden', String(!reduced && exit > .98));
   let current = -1;
   stories.forEach((story, i) => {
    const arrival = ease((p - starts[i]) / .065);
    const departure = i === 2 ? 0 : ease((p - starts[i] - .182) / .045);
    const opacity = reduced ? 1 : arrival * (1 - departure);
    story.style.opacity = String(opacity);
    story.style.transform = reduced ? 'none' : `translate3d(0,${(1-arrival)*95-departure*65}px,0)`;
    story.style.setProperty('--step-reveal', String(reduced ? 1 : arrival));
    story.style.setProperty('--step-detail', String(reduced ? 1 : ease((p-starts[i]-.025)/.10)));
    for (let detail=1; detail<=3; detail++) story.style.setProperty(`--detail-${detail}`, String(reduced ? 1 : ease((p-starts[i]-.02-detail*.018)/.055)));
    story.inert = !reduced && opacity < .45;
    story.setAttribute('aria-hidden', String(!reduced && opacity < .02));
    if (opacity > .45) current = i;
   });
   markers.forEach((marker, i) => {
    marker.dataset.active = String(i === current);
    if (i === current) marker.setAttribute('aria-current', 'step'); else marker.removeAttribute('aria-current');
    marker.style.setProperty('--step-fill', String(reduced ? 1 : clamp((p-starts[i])/.23)));
   });
   el.dataset.started = String(p > .25);
   el.dataset.finished = String(p > .91);
  });
  return () => {stop(); sizeObserver.disconnect();};
 }, []);
 const go = (index: number) => {
  const el = root.current!, reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stage = el.querySelector<HTMLElement>('[data-scroll-stage]')!;
  const top = reduced ? el.querySelectorAll<HTMLElement>('.process-story')[index].getBoundingClientRect().top + scrollY - 30
   : el.getBoundingClientRect().top + scrollY + (el.offsetHeight-stage.offsetHeight)*(starts[index]+.10);
  window.scrollTo({top, behavior: reduced ? 'instant' : 'smooth'});
 };
 return <section ref={root} className="process-section" id="process" lang="en" aria-labelledby="process-title">
  <div className="process-stage" data-scroll-stage>
   <header className="chapter-heading"><span className="chapter-kicker">03 / THE PROCESS</span><h2 id="process-title">A clear process.<br/><em>Room for good ideas.</em></h2><span className="chapter-aside">A little clarity.<br/>A lot of possibility.</span></header>
   <div className="process-question"><div className="question-topline"><span>YOU MIGHT BE WONDERING</span><span>?</span></div><p><span>So… how does</span><em>this work?</em></p><div className="question-bottom"><span>You don’t need to have it all figured out.</span><span>We’ll start there.</span></div></div>
   <div className="process-stories">{steps.map((step, i) => <article className="process-story" key={step.name} aria-labelledby={`process-step-${i}`}>
    <div className="process-story-copy"><div className="process-story-label"><span>0{i+1}</span><h3 id={`process-step-${i}`}>{step.name}</h3></div><span className="process-story-note">{step.note}</span><h4>{step.title}</h4><p>{step.text}</p><ul>{step.points.map(point => <li key={point}>{point}</li>)}</ul><div className="process-deliverable"><span>WHAT YOU LEAVE WITH</span><p>{step.result}</p></div></div>
    <div className="process-story-visual" aria-hidden="true">{i === 0 ? <Brief/> : i === 1 ? <Structure/> : <Launch/>}</div>
   </article>)}</div>
   <footer className="process-bottom"><nav aria-label="Process steps">{steps.map((step, i) => <button className="process-step-button" key={step.name} aria-label={`Go to step ${i+1}: ${step.name}`} onClick={() => go(i)}><span>0{i+1}</span><span>{i===2?'Launch':step.name}</span><i/></button>)}</nav><p className="process-reassurance"><span className="reassurance-during">Clear decisions. Shared progress. No disappearing acts.</span><span className="reassurance-after">One studio. With you from the first “hello” to launch.</span></p></footer>
  </div>
 </section>;
}
