// Shared by every concept; the control never appears in embedded previews.
if(!new URLSearchParams(location.search).has('preview')){
 const savedKey='poudev:work-return',pendingKey='poudev:work-return-pending';
 let point;
 try{point=JSON.parse(sessionStorage.getItem(savedKey)||'null');}catch{/* Use the gallery fallback. */}
 const slug=location.pathname.split('/').pop().replace(/\.html$/,'');
 const valid=point?.slug===slug&&typeof point.url==='string'&&new URL(point.url,location.origin).origin===location.origin;
 const link=document.createElement('a');
 link.className='poudev-return';link.href=valid?point.url:'/?work-return=1#work';
 link.innerHTML='<span class="poudev-return-arrow" aria-hidden="true">←</span><span>Back to POUDEV</span>';
 link.addEventListener('click',()=>{
  if(valid){try{sessionStorage.setItem(pendingKey,JSON.stringify(point));}catch{link.href='/?work-return=1#work';}}
 });
 document.body.append(link);
}
