import {galleryCardProgress} from './work-gallery-motion';

type WorkReturn = {slug:string;url:string;scroll:number;sectionTop:number;progress:number;width:number;height:number};
const savedKey='poudev:work-return',pendingKey='poudev:work-return-pending';

export function saveWorkReturn(slug:string) {
 const section=document.querySelector<HTMLElement>('#work');
 if(!section)return;
 const sectionTop=section.getBoundingClientRect().top+scrollY;
 const point:WorkReturn={slug,url:location.pathname+location.search+location.hash,scroll:scrollY,sectionTop,
  progress:(scrollY-sectionTop)/(section.offsetHeight-innerHeight),width:innerWidth,height:innerHeight};
 try{sessionStorage.setItem(savedKey,JSON.stringify(point));}catch{/* Browser storage can be disabled. */}
}

// Only a deliberate concept return may override the browser's scroll position.
// Reloads and Back/Forward use native restoration, including old history entries.
export function restoreWorkReturn(scroll:(top:number)=>void) {
 let point:WorkReturn|null=null;
 try{
  const pending=sessionStorage.getItem(pendingKey);
  sessionStorage.removeItem(pendingKey);
  if(pending)point=JSON.parse(pending);
 }catch{/* No explicit return is pending when storage is unavailable. */}
 const url=new URL(location.href),fallback=url.searchParams.has('work-return');
 if(fallback){url.searchParams.delete('work-return');history.replaceState(history.state,'',url.pathname+url.search+url.hash);}
 const navigation=performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming|undefined;
 if(navigation?.type!=='navigate')return;
 const section=document.querySelector<HTMLElement>('#work');
 if(!section||(!point&&!fallback))return;
 const top=section.getBoundingClientRect().top+scrollY,range=section.offsetHeight-innerHeight;
 if(point&&Number.isFinite(point.scroll)&&Number.isFinite(point.progress)){
  scroll(point.width===innerWidth&&point.height===innerHeight?point.scroll+top-point.sectionTop:top+range*point.progress);
 }else if(fallback){
  const cardWidth=section.querySelector<HTMLElement>('.work-card')!.offsetWidth;
  const catalog=galleryCardProgress(innerWidth,cardWidth,0);
  scroll(top+range*(.34+.66*catalog));
 }
}
