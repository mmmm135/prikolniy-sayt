// Shared by every concept; the control never appears in embedded previews.
if(!new URLSearchParams(location.search).has('preview')){
 const savedKey='poudev:work-return',pendingKey='poudev:work-return-pending';
 let point;
 try{point=JSON.parse(sessionStorage.getItem(savedKey)||'null');}catch{/* Use the gallery fallback. */}
 const slug=location.pathname.split('/').pop().replace(/\.html$/,'');
 const valid=point?.slug===slug&&typeof point.url==='string'&&new URL(point.url,location.origin).origin===location.origin;
 const link=document.createElement('a');
 link.className='poudev-return';link.href=valid?point.url:'/?work-return=1#work';
 link.setAttribute('aria-label','Back to POUDEV');
 link.innerHTML='<svg class="poudev-return-arrow" aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M20 12H4m6-6-6 6 6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="poudev-return-copy"><span class="poudev-return-label">Back to</span><span class="poudev-return-brand">POUDEV</span></span>';
 link.addEventListener('click',()=>{
  if(valid){try{sessionStorage.setItem(pendingKey,JSON.stringify(point));}catch{link.href='/?work-return=1#work';}}
 });
 document.body.append(link);
}
