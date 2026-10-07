'use client';
import {useEffect, useRef, type CSSProperties, type PointerEvent} from 'react';

const projects = [
 {slug:'little-loaf',name:'The Little Loaf',place:'Sorrento, FL',kind:'A sourdough microbakery',tags:'CONTENT · DESIGN · DEVELOPMENT'},
 {slug:'sweet-blissful-blooms',name:'Sweet Blissful Blooms',place:'Fall City, WA',kind:'A seasonal flower farm',tags:'ART DIRECTION · DESIGN · DEVELOPMENT'},
 {slug:'little-local',name:'The Little Local',place:'Hoboken, NJ',kind:'Your neighborhood coffee stop',tags:'CONTENT · DESIGN · DEVELOPMENT'},
 {slug:'down-home-roots',name:'Down Home Roots',place:'Johnsonville, SC',kind:'Handmade gifts & home',tags:'ART DIRECTION · DESIGN · DEVELOPMENT'},
 {slug:'curly-and-spot',name:'Curly & Spot',place:'Fremont, OH',kind:'Small-batch canine treats',tags:'CONTENT · DESIGN · DEVELOPMENT'},
];

export default function WorkGallery() {
 const root = useRef<HTMLDivElement>(null);
 const reducedMotion = useRef(false);
 useEffect(() => {
  const el = root.current!, stage = el.closest<HTMLElement>('.work-prelude')!;
  const cards = Array.from(el.querySelectorAll<HTMLElement>('.work-card'));
  const frames = cards.map(card => card.querySelector<HTMLIFrameElement>('iframe')!);
  const buttons = Array.from(el.querySelectorAll<HTMLButtonElement>('.gallery-navigation button'));
  const loaded = new Set<number>(), active = new Set<number>();
  const frameProgress = cards.map(() => -1);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  reducedMotion.current = reduced;
  let frame = 0, last = 0, progress = 0, visible = false, current = -1;
  let width = 1, height = 1, mobile = false;
  const sizes = cards.map(() => ({width: 1, height: 1, preview: 1}));
  const resize = () => {
   width = el.clientWidth; height = el.clientHeight; mobile = width <= 700;
   const frameWidth = mobile ? 1000 : 1200;
   cards.forEach((card, i) => {
    sizes[i] = {width: card.offsetWidth, height: card.offsetHeight, preview: card.querySelector<HTMLElement>('.work-preview')!.offsetHeight};
    const scale = sizes[i].width/frameWidth;
    frames[i].style.width = `${frameWidth}px`;
    frames[i].style.height = `${(sizes[i].preview+40)/scale}px`;
    frames[i].style.setProperty('--frame-scale', String(scale));
   });
  };
  const resizer = new ResizeObserver(resize);
  resizer.observe(el); cards.forEach(card => resizer.observe(card)); resize();
  const observer = new IntersectionObserver(entries => {
   visible = entries[0].isIntersecting;
   if (!visible) {
    active.forEach(i => frames[i].contentWindow?.postMessage({type:'preview-active',active:false},location.origin));
    active.clear();
   }
  });
  observer.observe(el);
  const clamp = (n: number) => Math.max(0, Math.min(1, n));
  const draw = (now: number) => {
   frame = requestAnimationFrame(draw);
   const dt = Math.min(.05, (now-last)/1000 || .016); last = now;
   if (!visible || document.hidden) return;
   const target = Number(stage.style.getPropertyValue('--catalog-progress')) || 0;
   progress = reduced ? target : progress+(target-progress)*(1-Math.exp(-dt/.12));
   const travel = clamp((progress-.16)/.84), stride = mobile ? 1.02 : .52, total = mobile ? 5.11 : 2.87;
   el.style.opacity = String(clamp((progress-.12)*12));
   let closest = 0, distance = Infinity;
   cards.forEach((card, i) => {
    const x = width*(1.12+i*stride-travel*total), offset = [0,.065,-.035,.08,-.025][i];
    const diagonal = height*((mobile ? .20 : .15)+(x/width-.25)*(mobile ? .29 : .43)+offset*(mobile ? .45 : 1));
    // Reserve real caption height and rotation/hover clearance at both viewport edges.
    const clearance = mobile ? 62 : 72;
    const y = Math.max(30, Math.min(height-sizes[i].height-clearance, diagonal));
    const local = clamp((1.12-x/width)/(mobile ? 1.6 : 1.4));
    const entrance = clamp(local*6), scale = .97+Math.sin(local*Math.PI)*.03;
    const yaw = (.5-local)*5, roll = (.5-local)*-1.5;
    card.style.transform = `translate3d(${x}px,${y}px,0) perspective(1400px) rotateY(${yaw}deg) rotateZ(${roll}deg) scale(${scale})`;
    card.style.setProperty('--card-reveal', String(entrance));
    card.style.setProperty('--image-shift', `${(local-.5)*-20}px`);
    const near = target>.12 && x>-sizes[i].width*1.2 && x<width*1.25;
    const playing = near && x+sizes[i].width>0 && x<width;
    card.inert = !playing; card.dataset.previewActive = String(playing);
    card.style.visibility = near ? 'visible' : 'hidden';
    if (near && !loaded.has(i)) {loaded.add(i); frames[i].src = `/concepts/${projects[i].slug}.html?preview=1`;}
    if (playing !== active.has(i) || (playing && Math.abs(local-frameProgress[i])>.012)) {
     if (playing) active.add(i); else active.delete(i);
     frameProgress[i] = local;
     frames[i].contentWindow?.postMessage({type:'preview-active',active:playing,progress:local},location.origin);
    }
    const delta = Math.abs(x+sizes[i].width*.5-width*.5);
    if (playing && delta<distance) {closest=i; distance=delta;}
   });
   if (current !== closest) {
    current = closest;
    buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i===current)));
   }
  };
  frame = requestAnimationFrame(draw);
  return () => {cancelAnimationFrame(frame); observer.disconnect(); resizer.disconnect();};
 }, []);

 const point = (event: PointerEvent<HTMLAnchorElement>) => {
  if (event.pointerType !== 'mouse' || reducedMotion.current) return;
  const surface = event.currentTarget, box = surface.getBoundingClientRect();
  const x = (event.clientX-box.left)/box.width, y = (event.clientY-box.top)/box.height;
  surface.style.setProperty('--tilt-x', `${(.5-y)*3}deg`);
  surface.style.setProperty('--tilt-y', `${(x-.5)*3}deg`);
  surface.style.setProperty('--cursor-x', `${x*100}%`);
  surface.style.setProperty('--cursor-y', `${y*100}%`);
  surface.style.setProperty('--magnet-x', `${(x-.5)*7}px`);
  surface.style.setProperty('--magnet-y', `${(y-.5)*7}px`);
 };
 const leave = (event: PointerEvent<HTMLAnchorElement>) => {
  ['--tilt-x','--tilt-y','--magnet-x','--magnet-y'].forEach(property => event.currentTarget.style.removeProperty(property));
 };
 const go = (index: number) => {
  const stage = root.current!.closest<HTMLElement>('.work-prelude')!;
  const width = root.current!.clientWidth;
  const mobile = width <= 700, stride = mobile ? 1.02 : .52, total = mobile ? 5.11 : 2.87;
  const cardWidth = root.current!.querySelector<HTMLElement>('.work-card')!.offsetWidth;
  const destination = (1-cardWidth/width)*.5;
  const catalog = .16+.84*(1.12+index*stride-destination)/total;
  const top = stage.getBoundingClientRect().top+scrollY+(stage.offsetHeight-innerHeight)*(.34+.66*catalog);
  window.scrollTo({top, behavior: reducedMotion.current ? 'instant' : 'smooth'});
 };
 return <div ref={root} className="work-gallery" lang="en">
  <div className="gallery-track">{projects.map((project, i) => <article className="work-card" key={project.slug} style={{'--card-index':i} as CSSProperties}>
   <a className="work-card-surface" href={`/concepts/${project.slug}.html`} aria-label={`Explore ${project.name} website concept`} onPointerMove={point} onPointerLeave={leave}>
    <div className="work-preview">
     <div className="work-preview-media"><picture><source media="(max-width:700px)" srcSet={`/concepts/${project.slug}-portrait.jpg`}/><img src={`/concepts/${project.slug}-preview.jpg`} alt={`${project.name} website design preview`}/></picture>
      <iframe title={`${project.name} animated website preview`} tabIndex={-1} aria-hidden="true" onLoad={event => {
       const frame = event.currentTarget;
       if (!frame.src.includes('preview=1')) return;
       frame.classList.add('preview-loaded');
       frame.contentWindow?.postMessage({type:'preview-active',active:frame.closest<HTMLElement>('.work-card')?.dataset.previewActive==='true'},location.origin);
      }}/>
     </div>
     <span className="card-highlight" aria-hidden="true"/>
     <span className="preview-label">EXPLORE THE WEBSITE</span><span className="explore-circle" aria-hidden="true">↗</span>
    </div>
    <div className="work-card-caption">
     <div className="work-card-meta"><span>0{i+1} / INDEPENDENT CONCEPT</span><span>{project.place}</span></div>
     <h3>{project.name}</h3><p className="work-card-kind">{project.kind}</p>
     <div className="caption-footer"><span>{project.tags}</span><span className="caption-open">VIEW CONCEPT</span></div>
    </div>
   </a>
  </article>)}</div>
  <nav className="gallery-navigation" aria-label="Choose a website concept">{projects.map((project, i) => <button key={project.slug} type="button" aria-label={`Show ${project.name}`} aria-pressed={i===0} title={project.name} onClick={() => go(i)} onKeyDown={event => {
   if (event.key==='ArrowRight' || event.key==='ArrowLeft') {
    event.preventDefault(); const next = (i+(event.key==='ArrowRight' ? 1 : -1)+projects.length)%projects.length;
    go(next); root.current!.querySelectorAll<HTMLButtonElement>('.gallery-navigation button')[next].focus();
   }
  }}>0{i+1}</button>)}</nav>
 </div>;
}
