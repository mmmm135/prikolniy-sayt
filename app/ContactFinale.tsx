'use client';
import {useEffect,useRef,useState,type FormEvent} from 'react';
import {observeScrollScene,ease} from './scroll-scene';
import './contact-finale.css';

export default function ContactFinale(){
 const section=useRef<HTMLElement>(null),canvas=useRef<HTMLCanvasElement>(null),status=useRef<HTMLDivElement>(null);
 const [sending,setSending]=useState(false),[sent,setSent]=useState(false),[error,setError]=useState('');
 useEffect(()=>{
  const element=section.current!,surface=canvas.current!;
  let disposed=false,visible=false,frame=0,progress=0,reduced=false;
  let meadow:ReturnType<typeof import('./contact-meadow').createContactMeadow>|undefined;
  const resize=()=>meadow?.resize(surface.clientWidth,surface.clientHeight);
  const paint=()=>{
   frame=0;if(disposed||!visible||document.hidden)return;
   meadow?.draw(progress,performance.now(),reduced);
   if(!reduced)frame=requestAnimationFrame(paint);
  };
  const schedule=()=>{if(visible&&!frame)frame=requestAnimationFrame(paint);};
  const stopScroll=observeScrollScene(element,(p,natural)=>{
   progress=p;reduced=natural;element.classList.toggle('finale-natural',natural);
   const opacity=ease((p-.025)/.07)*(1-ease((p-.17)/.045));
   element.style.setProperty('--invitation',String(natural?0:opacity));
   schedule();
  });
  // Start the heavier scene near this chapter, without downloading it at the hero.
  let started=false;
  const observer=new IntersectionObserver(entries=>{
   visible=entries[0].isIntersecting;
   if(visible&&!started){
    started=true;
    import('./contact-meadow').then(module=>{
     if(disposed)return;
     meadow=module.createContactMeadow(surface);resize();
     return meadow.ready.then(()=>{if(!disposed){element.classList.add('finale-ready');schedule();}});
    }).catch(e=>{console.error('Meadow scene unavailable',e);if(!disposed)element.classList.add('finale-unavailable');});
   }
   if(visible)schedule();else{cancelAnimationFrame(frame);frame=0;}
  },{rootMargin:'700px'});observer.observe(element);
  const resizer=new ResizeObserver(()=>{resize();schedule();});resizer.observe(surface);
  document.addEventListener('visibilitychange',schedule);
  const lost=(event:Event)=>{event.preventDefault();element.classList.add('finale-unavailable');};surface.addEventListener('webglcontextlost',lost);
  return()=>{disposed=true;cancelAnimationFrame(frame);stopScroll();observer.disconnect();resizer.disconnect();meadow?.dispose();document.removeEventListener('visibilitychange',schedule);surface.removeEventListener('webglcontextlost',lost);};
 },[]);
 const submit=async(event:FormEvent<HTMLFormElement>)=>{
  event.preventDefault();if(sending)return;
  const form=event.currentTarget,data=new FormData(form);
  if(!form.reportValidity())return;
  const enquiry={name:String(data.get('name')||'').trim(),contact:String(data.get('contact')||'').trim(),message:String(data.get('message')||'').trim()};
  if(!enquiry.name||!enquiry.message){setError('Please add your name and a few words about your project.');requestAnimationFrame(()=>status.current?.focus());return;}
  setSending(true);setError('');
  try{
   const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),20000);
   let response:Response;
   try{response=await fetch('/api/inquiries',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(enquiry),signal:controller.signal});}
   finally{clearTimeout(timeout);}
   if(!response.ok)throw Error('Unable to send');
   const result=await response.json() as {ok?:boolean};if(result.ok!==true)throw Error('Unable to send');
   setSent(true);requestAnimationFrame(()=>status.current?.focus());
  }catch{setError('Your enquiry could not be sent. Please try again — your details are still here.');requestAnimationFrame(()=>status.current?.focus());}
  finally{setSending(false);}
 };
 return <section ref={section} className="contact-finale" id="contact" lang="en" aria-labelledby="contact-title">
  <div className="finale-stage" data-scroll-stage aria-hidden="true">
   <canvas ref={canvas}/>
   <div className="finale-invitation"><span>Something good starts</span><em>with a little space.</em></div>
  </div>
  <div className="finale-scroll-space" aria-hidden="true"/>
  <div className="contact-sheet">
   <div className="contact-copy"><p className="contact-eyebrow">Your next chapter</p><h2 id="contact-title">Let’s make<br/><em>something good.</em></h2><p>Tell us about your business,<br className="contact-desktop-break"/> your idea, or the thing you’d like to change.</p></div>
   {sent?<div className="contact-success" ref={status} tabIndex={-1} role="status"><span>Enquiry received</span><h3>A good<br/><em>beginning.</em></h3><p>Thank you for sharing your idea.<br/>We’ll be in touch using the email you left.</p><button type="button" onClick={()=>setSent(false)}>Send another enquiry <span aria-hidden="true">↗</span></button></div>:
   <form className="contact-form" onSubmit={submit} aria-label="Project enquiry" aria-busy={sending}>
    <div className="contact-pair"><label>Your name<input autoComplete="name" name="name" required maxLength={120} placeholder="How should we address you?" disabled={sending}/></label><label>Email address<input type="email" autoComplete="email" name="contact" required maxLength={240} placeholder="Where can we reach you?" disabled={sending}/></label></div>
    <label>A little about your project<textarea name="message" required maxLength={5000} rows={3} placeholder="What do you have in mind?" disabled={sending}/></label>
    <div className="contact-action"><p>Just a conversation to start.</p><button type="submit" disabled={sending}>{sending?'Sending…':'Start a conversation'}<span aria-hidden="true">↗</span></button></div>
    <div ref={status} className="contact-feedback" role="alert" tabIndex={-1}>{error}</div>
   </form>}
   <footer className="contact-footer"><a href="#" aria-label="POUDEV — back to top" className="footer-brand">POUDEV</a><span>Independent web studio</span><div><a href="/ASSET-CREDITS.md" target="_blank" rel="noreferrer">Artwork credits</a><span>© {new Date().getFullYear()}</span></div></footer>
  </div>
 </section>;
}
