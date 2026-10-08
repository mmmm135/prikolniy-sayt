'use client';
import {useEffect,useRef,useState,type CSSProperties,type MouseEvent} from 'react';
import LoadingWordmark from './LoadingWordmark';
import './site-header.css';

const sections=[['about','The idea','From the first spark to launch'],['work','Selected work','Individual ideas, brought to life'],['process','Our process','A clear path, together'],['studio','The studio','Small studio. Personal attention.'],['contact','Let’s talk','Your next chapter starts here']];

export default function SiteHeader(){
 const dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLButtonElement>(null),timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const [open,setOpen]=useState(false);
 const [revealed,setRevealed]=useState(true),[hidden,setHidden]=useState(false);
 useEffect(()=>{
  const root=document.documentElement;
  let frame=0,previous=window.scrollY,distance=0,direction=0;
  const loading=()=>setRevealed(!root.classList.contains('site-loading'));
  const observer=new MutationObserver(loading);observer.observe(root,{attributes:true,attributeFilter:['class']});
  frame=requestAnimationFrame(loading);
  const scroll=()=>{
   const current=Math.max(0,window.scrollY),delta=current-previous;previous=current;
   const bottom=root.scrollHeight-current-window.innerHeight<=Math.max(80,window.innerHeight*.15);
   if(current<80||bottom){setHidden(false);distance=0;return;}
   if(root.classList.contains('menu-open'))return;
   const next=Math.sign(delta);if(!next)return;
   if(next!==direction){distance=0;direction=next;}
   distance+=Math.abs(delta);
   if(distance>=12){setHidden(next>0);distance=0;}
  };
  window.addEventListener('scroll',scroll,{passive:true});
  return()=>{observer.disconnect();cancelAnimationFrame(frame);window.removeEventListener('scroll',scroll);};
 },[]);
 const signal=(value:boolean)=>window.dispatchEvent(new CustomEvent('poudev:menu',{detail:value}));
 const close=(target?:string)=>{
  if(timer.current)return;
  setOpen(false);
  const finish=()=>{
   dialog.current?.close();document.documentElement.classList.remove('menu-open');signal(false);timer.current=null;
   trigger.current?.focus({preventScroll:true});
   if(target)window.dispatchEvent(new CustomEvent('poudev:navigate',{detail:target}));
  };
  timer.current=setTimeout(finish,matchMedia('(prefers-reduced-motion: reduce)').matches?0:380);
 };
 const show=()=>{dialog.current?.showModal();document.documentElement.classList.add('menu-open');signal(true);setOpen(true);};
 const navigate=(event:MouseEvent<HTMLAnchorElement>,target:string)=>{
  if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  event.preventDefault();if(dialog.current?.open)close(target);else window.dispatchEvent(new CustomEvent('poudev:navigate',{detail:target}));
 };
 useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current);document.documentElement.classList.remove('menu-open');signal(false);},[]);
 return <>
  <header className={'site-header'+(revealed?' is-revealed':'')+(hidden&&!open?' is-hidden':'')} inert={!revealed||(hidden&&!open)} lang="en">
   <button ref={trigger} className="header-menu" aria-label="Open navigation" aria-expanded={open} aria-controls="site-navigation" onClick={show}><span className="burger" aria-hidden="true"><i/><i/></span><span className="header-menu-label">Menu</span></button>
   <a className="header-brand" href="#home" aria-label="POUDEV — home" onClick={event=>navigate(event,'home')}><LoadingWordmark/></a>
   <a className="header-contact" href="#contact-sheet" onClick={event=>navigate(event,'contact-sheet')}>Let’s talk<span aria-hidden="true">↗</span></a>
  </header>
  <dialog ref={dialog} id="site-navigation" className={'site-navigation'+(open?' is-open':'')} aria-labelledby="navigation-title" data-lenis-prevent onCancel={event=>{event.preventDefault();close();}}>
   <div className="navigation-top"><span id="navigation-title">POUDEV / Explore</span><button className="navigation-close" aria-label="Close navigation" onClick={()=>close()}><span>Close</span><span aria-hidden="true">×</span></button></div>
   <nav aria-label="Main navigation">{sections.map(([id,title,subtitle],index)=><a key={id} href={'#'+(id==='contact'?'contact-sheet':id)} style={{'--nav-index':index} as CSSProperties} onClick={event=>navigate(event,id==='contact'?'contact-sheet':id)}><span className="navigation-index">0{index+1}</span><span className="navigation-title">{title}<small>{subtitle}</small></span><span className="navigation-arrow" aria-hidden="true">↗</span></a>)}</nav>
   <div className="navigation-footer"><span>Independent web studio</span><span>Design · Content · Development</span></div>
  </dialog>
 </>;
}
