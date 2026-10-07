type WorkReturn = {slug:string;url:string;scroll:number;sectionTop:number;progress:number;width:number;height:number};
const savedKey='poudev:work-return',pendingKey='poudev:work-return-pending';

export function saveWorkReturn(slug:string) {
 const section=document.querySelector<HTMLElement>('#work');
 if(!section)return;
 const sectionTop=section.getBoundingClientRect().top+scrollY;
 const point:WorkReturn={slug,url:location.pathname+location.search+location.hash,scroll:scrollY,sectionTop,
  progress:(scrollY-sectionTop)/(section.offsetHeight-innerHeight),width:innerWidth,height:innerHeight};
 try{sessionStorage.setItem(savedKey,JSON.stringify(point));}catch{/* Browser storage can be disabled. */}
 history.replaceState({...history.state,poudevWorkReturn:point},'',location.href);
}

// Restore after a full-page concept visit, including the browser's Back button.
// Lenis must receive the same immediate position so its next frame cannot undo it.
export function restoreWorkReturn(scroll:(top:number)=>void) {
 let cancelled=false,resize:ResizeObserver|undefined,frame=0,timer:ReturnType<typeof setTimeout>|undefined;
 const cancel=()=>{cancelled=true;resize?.disconnect();cancelAnimationFrame(frame);};
 const restore=()=>{
  let point:WorkReturn|undefined;
  try{point=JSON.parse(sessionStorage.getItem(pendingKey)||'null')||history.state?.poudevWorkReturn;}catch{point=history.state?.poudevWorkReturn;}
  const fallback=new URLSearchParams(location.search).has('work-return');
  const section=document.querySelector<HTMLElement>('#work');
  if(!section||(!point&&!fallback))return;
  cancelled=false;
  const apply=()=>{
   if(cancelled)return;
   const top=section.getBoundingClientRect().top+scrollY,range=section.offsetHeight-innerHeight;
   let target:number;
   if(point&&Number.isFinite(point.scroll)&&Number.isFinite(point.progress)){
    target=point.width===innerWidth&&point.height===innerHeight?point.scroll+top-point.sectionTop:top+range*point.progress;
   }else{
    const mobile=innerWidth<=700,ratio=section.querySelector<HTMLElement>('.work-card')!.offsetWidth/innerWidth;
    const catalog=.16+.84*(1.12-(1-ratio)*.5)/(mobile?5.11:2.87);
    target=top+range*(.34+.66*catalog);
   }
   scroll(target);
  };
  apply();frame=requestAnimationFrame(()=>{apply();frame=requestAnimationFrame(apply);});
  resize?.disconnect();resize=new ResizeObserver(apply);resize.observe(section);
  void document.fonts.ready.then(apply);
  clearTimeout(timer);timer=setTimeout(()=>resize?.disconnect(),1200);
  try{sessionStorage.removeItem(pendingKey);}catch{/* Restoration also works from history state. */}
  if(point)history.replaceState({...history.state,poudevWorkReturn:point},'',location.href);
  if(fallback){const url=new URL(location.href);url.searchParams.delete('work-return');history.replaceState(history.state,'',url.pathname+url.search+url.hash);}
 };
 restore();addEventListener('pageshow',restore);
 const inputs=['wheel','touchstart','pointerdown','keydown'] as const;
 inputs.forEach(type=>addEventListener(type,cancel,{passive:true}));
 return()=>{cancel();clearTimeout(timer);removeEventListener('pageshow',restore);inputs.forEach(type=>removeEventListener(type,cancel));};
}
