'use client';
import { useEffect, useMemo, useRef, useState } from 'react';

export default function Home() {
  const stage = useRef<HTMLElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [menu, setMenu] = useState(false);
  const bars = useMemo(() => Array.from({ length: 64 }, (_, i) => ({ left: `${(i / 64) * 100}%`, delay: `${(i % 9) * 0.04}s`, seed: `${35 + ((i * 37) % 61)}%` })), []);
  useEffect(() => { const onScroll = () => { const el = stage.current; if (!el) return; const p = Math.min(1, Math.max(0, scrollY / (innerHeight * 1.45))); el.style.setProperty('--progress', String(p)); }; addEventListener('scroll', onScroll, { passive:true }); onScroll(); const timer = setTimeout(() => setLoaded(true), 900); return () => { removeEventListener('scroll', onScroll); clearTimeout(timer); }; }, []);
  return <main className={loaded ? 'loaded' : ''}><section ref={stage} className="hero-stage" aria-label="POUDEV — nocturnal opening scene"><div className="hero-scene">
    <div className="sky-image" aria-hidden="true"/><div className="sky-vignette" aria-hidden="true"/><div className="stripe-reveal" aria-hidden="true">{bars.map((b,i)=><i key={i} style={{ left:b.left, '--seed':b.seed, '--delay':b.delay } as React.CSSProperties}/>)}</div>
    <div className="constellation" aria-hidden="true"><i/><i/><i/><i/><i/></div><div className="bird bird-one" aria-hidden="true"><img src="/images/owl.png" alt=""/></div><div className="bird bird-two" aria-hidden="true"><img src="/images/owl.png" alt=""/></div><div className="bird bird-three" aria-hidden="true"><img src="/images/owl.png" alt=""/></div><div className="hero-grain" aria-hidden="true"/>
    <header className="hero-nav"><button className="menu-trigger" aria-label="Открыть меню" aria-expanded={menu} onClick={()=>setMenu(!menu)}><span/><span/><span/></button><div className="hero-mark">POUDEV<sup>®</sup></div><div className="hero-meta"><span>INDEPENDENT<br/>DIGITAL STUDIO</span><button onClick={()=>document.documentElement.lang=document.documentElement.lang==='en'?'ru':'en'}>RU&nbsp; / &nbsp;EN</button></div></header>
    {menu&&<nav className="hero-menu"><button onClick={()=>setMenu(false)}>CLOSE <b>×</b></button><a href="#scene" onClick={()=>setMenu(false)}>THE SCENE</a><a href="#scene" onClick={()=>setMenu(false)}>POUDEV</a><span>DESIGN / DEVELOPMENT / MOTION</span></nav>}
    <div className="hero-title" id="scene"><span className="title-kicker">A DIGITAL STUDIO</span><h1>POU<br/><em>DEV</em></h1><div className="title-note">Websites with<br/><em>a pulse.</em></div></div><div className="hero-caption"><span className="caption-line"/><span>SCROLL TO ENTER</span><span className="caption-count">01 — 01</span></div><div className="scroll-story" aria-hidden="true"><span>THE NIGHT OPENS</span><b>01</b></div>
  </div></section></main>;
}
