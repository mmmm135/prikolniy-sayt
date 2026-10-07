'use client';
import {useEffect,useRef} from 'react';
const projects=[
 {slug:'little-loaf',name:'The Little Loaf',place:'Sorrento, FL',kind:'A sourdough microbakery',story:'A warm digital home for slow-made bread. Bake-day discovery, an inviting collection, and a clear route to ordering.',tags:'CONTENT · DESIGN · DEVELOPMENT'},
 {slug:'sweet-blissful-blooms',name:'Sweet Blissful Blooms',place:'Fall City, WA',kind:'A seasonal flower farm',story:'An expressive floral world with room for seasonal bouquets, farm visits, and a personal wedding enquiry.',tags:'ART DIRECTION · DESIGN · DEVELOPMENT'},
 {slug:'little-local',name:'The Little Local',place:'Hoboken, NJ',kind:'Your neighborhood coffee stop',story:'A confident neighborhood identity, a simple menu journey, and the essentials that make a first visit easy.',tags:'CONTENT · DESIGN · DEVELOPMENT'},
 {slug:'down-home-roots',name:'Down Home Roots',place:'Johnsonville, SC',kind:'Handmade gifts & home',story:'A considered boutique experience for handmade pieces. Collection discovery, personal detail, and a warm visual voice.',tags:'ART DIRECTION · DESIGN · DEVELOPMENT'},
 {slug:'curly-and-spot',name:'Curly & Spot',place:'Fremont, OH',kind:'Small-batch canine treats',story:'A playful storefront concept built around the dogs behind the recipes, ingredient clarity, and treat discovery.',tags:'CONTENT · DESIGN · DEVELOPMENT'}
];
export default function WorkGallery(){
 const root=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const el=root.current!,stage=el.closest<HTMLElement>('.work-prelude')!;
  const cards=Array.from(el.querySelectorAll<HTMLElement>('.work-card'));
  const frames=cards.map(c=>c.querySelector<HTMLIFrameElement>('iframe')!);
  const loaded=new Set<number>(),active=new Set<number>();
  const frameProgress=cards.map(()=>-1);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let frame=0,last=0,progress=0,visible=false;
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(!visible){active.forEach(i=>frames[i].contentWindow?.postMessage({type:'preview-active',active:false},location.origin));active.clear();}});observer.observe(el);
  const clamp=(n:number)=>Math.max(0,Math.min(1,n));
  const draw=(now:number)=>{
   frame=requestAnimationFrame(draw);const dt=Math.min(.05,(now-last)/1000||.016);last=now;
   if(!visible)return;
   const target=Number(stage.style.getPropertyValue('--catalog-progress'))||0;
   progress=reduced?target:progress+(target-progress)*(1-Math.exp(-dt/.12));
   const w=el.clientWidth,h=el.clientHeight,mobile=w<=700;
   const travel=clamp((progress-.16)/.84),stride=mobile?1.02:.52,total=mobile?5.11:2.87;
   el.style.opacity=String(clamp((progress-.12)*12));
   cards.forEach((card,i)=>{
    const x=w*(1.12+i*stride-travel*total),offset=[0,.065,-.035,.08,-.025][i];
    const y=h*((mobile?.20:.15)+(x/w-.25)*(mobile?.29:.43)+offset*(mobile?.45:1));
    const local=clamp((1.12-x/w)/(mobile?1.6:1.4));
    const entrance=clamp(local*6),scale=.95+Math.sin(local*Math.PI)*.05;
    const yaw=(.5-local)*9,roll=(.5-local)*-3;
    card.style.transform=`translate3d(${x}px,${y}px,0) perspective(1400px) rotateY(${yaw}deg) rotateZ(${roll}deg) scale(${scale})`;
    card.style.setProperty('--card-reveal',String(entrance));
    card.style.setProperty('--image-shift',`${(local-.5)*-28}px`);
    const near=target>.12&&x>-card.offsetWidth*1.2&&x<w*1.25;
    const playing=near&&x+card.offsetWidth>0&&x<w;
    card.inert=!playing;card.dataset.previewActive=String(playing);card.style.visibility=near?'visible':'hidden';
    if(near&&!loaded.has(i)){loaded.add(i);frames[i].src=`/concepts/${projects[i].slug}.html?preview=1`;}
    const fw=mobile?1000:1200,factor=card.offsetWidth/fw;
    frames[i].style.width=`${fw}px`;frames[i].style.height=`${(card.querySelector<HTMLElement>('.work-preview')!.offsetHeight+40)/factor}px`;
    frames[i].style.setProperty('--frame-scale',String(factor));
    if(playing!==active.has(i)||(playing&&Math.abs(local-frameProgress[i])>.012)){if(playing)active.add(i);else active.delete(i);frameProgress[i]=local;frames[i].contentWindow?.postMessage({type:'preview-active',active:playing,progress:local},location.origin);}
   });
  };
  frame=requestAnimationFrame(draw);return()=>{cancelAnimationFrame(frame);observer.disconnect();};
 },[]);
 return <div ref={root} className="work-gallery" lang="en"><div className="gallery-track">{projects.map((p,i)=><article className="work-card" key={p.slug} style={{'--card-index':i} as React.CSSProperties}>
 <a className="work-preview" href={`/concepts/${p.slug}.html`} aria-label={`Explore ${p.name} website concept`}><picture><source media="(max-width:700px)" srcSet={`/concepts/${p.slug}-portrait.jpg`}/><img src={`/concepts/${p.slug}-preview.jpg`} alt={`${p.name} website design preview`}/></picture><iframe title={`${p.name} animated website preview`} tabIndex={-1} aria-hidden="true" onLoad={e=>{if(e.currentTarget.src.includes('preview=1')){e.currentTarget.classList.add('preview-loaded');e.currentTarget.contentWindow?.postMessage({type:'preview-active',active:e.currentTarget.closest<HTMLElement>('.work-card')?.dataset.previewActive==='true'},location.origin);}}}/><span className="explore-circle">↗</span><span className="preview-label">EXPLORE THE WEBSITE</span></a>
 <div className="work-card-meta"><span>0{i+1} / INDEPENDENT CONCEPT</span><span>{p.place}</span></div><h3>{p.name}</h3><p className="work-card-kind">{p.kind}</p><p className="work-card-story">{p.story}</p><span className="work-card-tags">{p.tags}</span>
 </article>)}</div><div className="gallery-guide"><span>FIVE IDEAS. FIVE DIFFERENT WORLDS.</span><span>SCROLL TO EXPLORE ↗</span></div></div>;}
