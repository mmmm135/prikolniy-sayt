// Preserve server-rendered chapter geometry; only defer the graphic's setup.
export function deferScene(element:Element,setup:()=>void|(()=>void),rootMargin='700px'){
 let cleanup:(()=>void)|undefined;
 const observer=new IntersectionObserver(entries=>{
  if(!entries[0].isIntersecting)return;observer.disconnect();cleanup=setup()||undefined;
 },{rootMargin});observer.observe(element);
 return()=>{observer.disconnect();cleanup?.();};
}
