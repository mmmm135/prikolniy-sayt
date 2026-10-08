'use client';
import {useEffect,useRef,useState,type FormEvent} from 'react';
import {observeScrollScene,ease} from './scroll-scene';
import './contact-finale.css';

type EnquiryField='name'|'contact'|'message';
type FieldErrors=Partial<Record<EnquiryField,string>>;
const fields:EnquiryField[]=['name','contact','message'];
function fieldError(field:EnquiryField,input:HTMLInputElement|HTMLTextAreaElement){
 if(!input.value.trim())return {name:'Please tell us your name.',contact:'Please leave your email address.',message:'Tell us a little about your project.'}[field];
 if(field==='contact'&&input.validity.typeMismatch)return 'Please enter a valid email address.';
 return undefined;
}

export default function ContactFinale(){
 const section=useRef<HTMLElement>(null),canvas=useRef<HTMLCanvasElement>(null),status=useRef<HTMLDivElement>(null);
 const [sending,setSending]=useState(false),[sent,setSent]=useState(false),[error,setError]=useState('');
 const [fieldErrors,setFieldErrors]=useState<FieldErrors>({});
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
  let started=false,attempt=0,timeout:ReturnType<typeof setTimeout>|undefined;
  const unavailable=()=>{clearTimeout(timeout);meadow?.dispose();meadow=undefined;element.classList.remove('finale-ready');element.classList.add('finale-unavailable');};
  const start=()=>{
   started=true;const current=++attempt;
   timeout=setTimeout(()=>{if(!disposed&&current===attempt){attempt++;unavailable();}},20000);
   import('./contact-meadow').then(module=>{
    if(disposed||current!==attempt)return;
    meadow=module.createContactMeadow(surface);resize();
    return meadow.ready.then(()=>{if(!disposed&&current===attempt){clearTimeout(timeout);element.classList.remove('finale-unavailable');element.classList.add('finale-ready');schedule();}});
   }).catch(e=>{console.error('Meadow scene unavailable',e);if(!disposed&&current===attempt)unavailable();});
  };
  const observer=new IntersectionObserver(entries=>{
   visible=entries[0].isIntersecting;
   if(visible&&!started)start();
   if(visible)schedule();else{cancelAnimationFrame(frame);frame=0;}
  },{rootMargin:'700px'});observer.observe(element);
  const resizer=new ResizeObserver(()=>{resize();schedule();});resizer.observe(surface);
  document.addEventListener('visibilitychange',schedule);
  const lost=(event:Event)=>{event.preventDefault();attempt++;unavailable();};
  const restored=()=>{if(!disposed)start();};
  surface.addEventListener('webglcontextlost',lost);surface.addEventListener('webglcontextrestored',restored);
  return()=>{disposed=true;attempt++;clearTimeout(timeout);cancelAnimationFrame(frame);stopScroll();observer.disconnect();resizer.disconnect();meadow?.dispose();document.removeEventListener('visibilitychange',schedule);surface.removeEventListener('webglcontextlost',lost);surface.removeEventListener('webglcontextrestored',restored);};
 },[]);
 const submit=async(event:FormEvent<HTMLFormElement>)=>{
  event.preventDefault();if(sending)return;
  const form=event.currentTarget,data=new FormData(form);
  const errors:FieldErrors={};
  for(const field of fields){const input=form.elements.namedItem(field) as HTMLInputElement|HTMLTextAreaElement;const message=fieldError(field,input);if(message)errors[field]=message;}
  setFieldErrors(errors);setError('');
  const invalid=fields.find(field=>errors[field]);
  if(invalid){requestAnimationFrame(()=>(form.elements.namedItem(invalid) as HTMLInputElement|HTMLTextAreaElement).focus());return;}
  const enquiry={name:String(data.get('name')||'').trim(),contact:String(data.get('contact')||'').trim(),message:String(data.get('message')||'').trim()};
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
   {sent?<div className="contact-success" ref={status} tabIndex={-1} role="status"><span>Enquiry received</span><h3>A good<br/><em>beginning.</em></h3><p>Thank you for sharing your idea.<br/>We’ll be in touch using the email you left.</p><button type="button" onClick={()=>{setSent(false);setError('');setFieldErrors({});}}>Send another enquiry <span aria-hidden="true">↗</span></button></div>:
   <form className="contact-form" noValidate onSubmit={submit} onInput={event=>{
    const input=event.target;if(!(input instanceof HTMLInputElement||input instanceof HTMLTextAreaElement))return;
    const field=input.name as EnquiryField;if(field in fieldErrors)setFieldErrors(previous=>({...previous,[field]:fieldError(field,input)}));
   }} aria-label="Project enquiry" aria-busy={sending}>
    <div className="contact-pair">
     <div className="contact-field"><label htmlFor="contact-name">Your name</label><input id="contact-name" autoComplete="name" name="name" required maxLength={120} placeholder="How should we address you?" disabled={sending} aria-invalid={!!fieldErrors.name} aria-describedby={fieldErrors.name?'contact-name-note':undefined}/>{fieldErrors.name&&<p id="contact-name-note" className="contact-field-note">{fieldErrors.name}</p>}</div>
     <div className="contact-field"><label htmlFor="contact-email">Email address</label><input id="contact-email" type="email" autoComplete="email" name="contact" required maxLength={240} placeholder="Where can we reach you?" disabled={sending} aria-invalid={!!fieldErrors.contact} aria-describedby={fieldErrors.contact?'contact-email-note':undefined}/>{fieldErrors.contact&&<p id="contact-email-note" className="contact-field-note">{fieldErrors.contact}</p>}</div>
    </div>
    <div className="contact-field"><label htmlFor="contact-message">A little about your project</label><textarea id="contact-message" name="message" required maxLength={5000} rows={3} placeholder="What do you have in mind?" disabled={sending} data-lenis-prevent aria-invalid={!!fieldErrors.message} aria-describedby={fieldErrors.message?'contact-message-note':undefined}/>{fieldErrors.message&&<p id="contact-message-note" className="contact-field-note">{fieldErrors.message}</p>}</div>
    <div className="contact-action"><p>Just a conversation to start.</p><button type="submit" disabled={sending}>{sending?'Sending…':'Start a conversation'}<span aria-hidden="true">↗</span></button></div>
    <div ref={status} className="contact-feedback" role="alert" tabIndex={-1}>{error&&<p>{error}</p>}</div>
   </form>}
   <footer className="contact-footer"><a href="#" aria-label="POUDEV — back to top" className="footer-brand">POUDEV</a><span>Independent web studio</span><span className="footer-copyright">© {new Date().getFullYear()}</span></footer>
  </div>
 </section>;
}
