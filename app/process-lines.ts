import {ease} from './scroll-scene';

// A ruled mathematical surface printed on the stationary engraving grid.
export function createProcessLines(canvas:HTMLCanvasElement) {
 const ctx=canvas.getContext('2d')!;
 let w=1,h=1,p=0,reduced=false,visible=false,frame=0,last=0,dirty=true;
 const resize=()=>{
  w=canvas.clientWidth;h=canvas.clientHeight;
  const d=Math.min(devicePixelRatio,1.5);canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);
  ctx.setTransform(d,0,0,d,0,0);dirty=true;
 };
 const resizer=new ResizeObserver(resize);resizer.observe(canvas);resize();
 const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;dirty=true;});observer.observe(canvas);
 const draw=(now:number)=>{
  frame=requestAnimationFrame(draw);
  if(!visible||document.hidden||now-last<40||(!dirty&&reduced))return;
  last=now;dirty=false;ctx.clearRect(0,0,w,h);
  if(getComputedStyle(canvas).display==='none')return;
  const mobile=w<=700,open=ease((p-.25)/.55),exit=ease((p-.88)/.12);
  const pulse=reduced?0:Math.sin(now*.00033)*.025;
  const yaw=-.5+open*1.4+pulse,tilt=-.25+open*.55;
  const size=mobile?Math.min(w*1.20,h*.52):Math.min(w*.61,h*.92);
  const cx=mobile?w*.58:w*.77,cy=mobile?h*.83:h*.57;
  const pitch=mobile?3.5:5,cell=mobile?4.5:6;
  const samples:{x:number;y:number;z:number;tone:number}[]=[];
  for(let i=0;i<=130;i++)for(let j=0;j<=35;j++){
   const u=i/130,v=j/35-.5,angle=(u-.5)*(Math.PI*(2.6-open*.9)),r=.42+v*.36;
   const x=Math.cos(angle)*r,y=Math.sin(angle)*r*.82+v*.18,z=Math.sin(angle*1.4+open*.6)*.22+v*.24;
   const xx=x*Math.cos(yaw)+z*Math.sin(yaw),zz=z*Math.cos(yaw)-x*Math.sin(yaw);
   const yy=y*Math.cos(tilt)-zz*Math.sin(tilt),perspective=1/(1+zz*.45);
   const shade=.3+.65*Math.abs(Math.cos(angle+.4)*Math.cos(v*3+yaw));
   samples.push({x:cx+xx*size*perspective+exit*w*.5,y:cy+yy*size*perspective+exit*h*.35,z:zz,tone:shade});
  }
  samples.sort((a,b)=>b.z-a.z);ctx.globalAlpha=1-exit;
  for(const point of samples){
   const x=Math.round(point.x/pitch)*pitch,y=Math.round(point.y/cell)*cell;
   ctx.fillStyle='#c9b894';ctx.fillRect(x-1,y-1,pitch+1,cell+1);
   ctx.fillStyle='#292920';ctx.fillRect(x,y,pitch*(.1+point.tone*.56),cell*.86);
  }
  ctx.globalAlpha=1;
 };
 frame=requestAnimationFrame(draw);
 return{update(progress:number,reduce:boolean){p=progress;reduced=reduce;dirty=true;},dispose(){cancelAnimationFrame(frame);observer.disconnect();resizer.disconnect();}};
}
