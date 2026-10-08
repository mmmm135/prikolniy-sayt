type Point=[number,number];
type Glyph={width:number;outer:Point[];holes?:Point[][]};
// Bespoke chamfered lettering. No font outline or image is drawn on the scene.
const glyphs:Glyph[]=[
 {width:22,outer:[[0,0],[17,0],[22,5],[22,15],[17,20],[6,20],[6,32],[0,32]],holes:[[[6,6],[15,6],[16,7],[16,13],[15,14],[6,14]]]},
 {width:25,outer:[[5,0],[20,0],[25,5],[25,27],[20,32],[5,32],[0,27],[0,5]],holes:[[[7,6],[18,6],[19,7],[19,25],[18,26],[7,26],[6,25],[6,7]]]},
 {width:24,outer:[[0,0],[6,0],[6,25],[7,26],[17,26],[18,25],[18,0],[24,0],[24,27],[19,32],[5,32],[0,27]]},
 {width:24,outer:[[0,0],[18,0],[24,6],[24,26],[18,32],[0,32]],holes:[[[6,6],[15,6],[18,9],[18,23],[15,26],[6,26]]]},
 {width:21,outer:[[0,0],[21,0],[21,6],[6,6],[6,13],[18,13],[18,19],[6,19],[6,26],[21,26],[21,32],[0,32]]},
 {width:25,outer:[[0,0],[6,0],[12.5,24],[19,0],[25,0],[16,32],[9,32]]}
];
function inside(x:number,y:number,points:Point[]){let hit=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const [xi,yi]=points[i],[xj,yj]=points[j];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)hit=!hit;}return hit;}
export function createStrokeScene(canvas:HTMLCanvasElement,options={sampleLandscape:true}){
 const ctx=canvas.getContext('2d')!;let w=1,h=1,dpr=1;
 let bars:{x:number;a:number;b:number;seed:number}[]=[];
 const rnd=(n:number)=>{const v=Math.sin(n*127.13+19.7)*43758.54;return v-Math.floor(v);};
 const ease=(a:number,b:number,p:number)=>{const x=Math.min(1,Math.max(0,(p-a)/(b-a)));return x*x*(3-2*x);};
 const resize=()=>{
  w=canvas.clientWidth;h=canvas.clientHeight;dpr=Math.min(devicePixelRatio,1.6);canvas.width=w*dpr;canvas.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
  const total=glyphs.reduce((s,g)=>s+g.width,0)+5*3,scale=w*.88/total,pitch=w>1000?5:3.5;bars=[];
  let offset=(w-total*scale)/2;
  glyphs.forEach((g,letter)=>{
   for(let x=Math.ceil(offset/pitch)*pitch;x<offset+g.width*scale;x+=pitch){const gx=(x-offset)/scale;let start=-1;
    for(let y=0;y<=128;y++){const gy=y/4,hit=inside(gx,gy,g.outer)&&!g.holes?.some(hole=>inside(gx,gy,hole));if(hit&&start<0)start=gy;if(start>=0&&(!hit||y===128)){bars.push({x,a:start/32,b:gy/32,seed:rnd(x+letter*79)});start=-1;}}
   }offset+=(g.width+3)*scale;
  });
 };
 const source=document.createElement('canvas');source.width=256;source.height=144;
 const sourceContext=source.getContext('2d',{willReadFrequently:true})!;
 let runsByColumn:[number,number][][]=[];
 const sourceImage=new Image();sourceImage.onload=()=>{
  sourceContext.drawImage(sourceImage,0,0,256,144);const pixels=sourceContext.getImageData(0,0,256,144).data;
  runsByColumn=Array.from({length:256},(_,sx)=>{
   const runs:[number,number][]=[];let a=-1;
   for(let sy=0;sy<=144;sy++){const hit=sy<144&&pixels[(sy*256+sx)*4]>70;if(hit&&a<0)a=sy;if(a>=0&&!hit){if(sy-a>1)runs.push([a/144,sy/144]);a=-1;}}
   return runs;
  });
 };if(options.sampleLandscape)sourceImage.src='/art/night-valley-sample.webp';
 let impactTime:number|null=null;
 const draw=(p:number,t:number)=>{
  ctx.clearRect(0,0,w,h);const pitch=w>1000?5:3.5,height=Math.min(w*.185,h*.3),hero=Math.min(p/.47,1);
  ctx.fillStyle='#292920';
  if(p<.13&&w<h){const wash=ctx.createRadialGradient(w*.37,h*.60,10,w*.37,h*.60,w*.48);wash.addColorStop(0,'rgba(201,184,148,1)');wash.addColorStop(.65,'rgba(201,184,148,.96)');wash.addColorStop(1,'rgba(201,184,148,0)');ctx.fillStyle=wash;ctx.fillRect(0,0,w,h);ctx.fillStyle='#292920';}
  if(p<.13){const k=w<h?.64:.42;ctx.globalAlpha=1;for(const b of bars){ctx.fillRect(w*.055+(b.x-w*.06)*k,h*(w<h?.57:.13)+b.a*height*k,pitch*.7*k,(b.b-b.a)*height*k);}}

  if(p<.78)impactTime=null;
  if(p>=.823&&impactTime===null)impactTime=t;
  const elapsed=impactTime===null?-1:t-impactTime;
  const shrink=ease(.52,.67,p),scale=1-shrink*.22;
  const fall=Math.pow(Math.min(1,Math.max(0,(p-.685)/(.823-.685))),2),logoHeight=height*scale,waterY=h*.675;
  const top=h*.35+(waterY-logoHeight*.935-h*.35)*fall+Math.sin(t*.8)*1.1*ease(.83,.88,p);
  const settle=ease(.88,.975,hero);
  const paintLogo=(reflect=false,under=false)=>{
   for(const b of bars){const local=ease(.32+b.seed*.12,.90+b.seed*.08,hero);if(hero<.3)continue;
    const travel=1-local,x=w*.5+(b.x-w*.5)*scale;
    const sx=Math.min(255,Math.max(0,Math.floor(b.x/w*256)));
    let start=.1,end=.9;
    if(runsByColumn.length){const runs=runsByColumn[sx],run=runs[Math.min(runs.length-1,Math.floor(b.seed*runs.length))];if(run){start=run[0];end=run[1];}else{start=b.a;end=b.a+.015;}}

    let y=(top+b.a*logoHeight)*local+start*h*travel;
    const length=(b.b-b.a)*logoHeight*local+(end-start)*h*travel,split=length*(.25+b.seed*.5),gap=(1-settle)*(5+b.seed*20);
    if(reflect){y=waterY+(waterY-y)*.57;ctx.globalAlpha=.16*Math.max(0,1-(y-waterY)/(logoHeight*.8));const drift=Math.sin(t*.8+y*.11)*3;ctx.fillRect(x+drift,y,pitch*.7*scale,-Math.max(0,split-gap)*.57);ctx.fillRect(x+drift,y-(split+gap)*.57,pitch*.7*scale,-Math.max(0,length-split-gap)*.57);}
    else{ctx.globalAlpha=(under?.28:1);ctx.fillRect(x,y,pitch*.7*scale,Math.max(0,split-gap));ctx.fillRect(x,y+split+gap,pitch*.7*scale,Math.max(0,length-split-gap));}
   }
  };
  if(p>.73){ctx.save();ctx.beginPath();ctx.rect(0,waterY,w,h-waterY);ctx.clip();paintLogo(true);ctx.restore();}
  ctx.save();if(p>.76){ctx.beginPath();ctx.rect(0,0,w,waterY+2);ctx.clip();}paintLogo();ctx.restore();
  if(p>.76){ctx.save();ctx.globalAlpha=.3;ctx.translate(Math.sin(t)*1.5,0);ctx.beginPath();ctx.rect(0,waterY,w,h-waterY);ctx.clip();paintLogo(false,true);ctx.restore();}
  if(elapsed>=0){
   const ring=(age:number,radius:number,alpha:number)=>{if(age<0)return;const rx=w*radius,ry=h*(.01+radius*.085);ctx.globalAlpha=alpha;for(let i=0;i<160;i++){const a=i/160*Math.PI*2;if(rnd(i*7.1)<.2)continue;const x=w*.5+Math.cos(a)*rx,y=waterY+Math.sin(a)*ry;ctx.fillRect(Math.round(x/pitch)*pitch,Math.round(y/2)*2,pitch*.66,1.2);}};
   for(let i=0;i<4;i++){const age=elapsed-i*.17;if(age>=0&&age<4)ring(age,.18+age*.072,Math.max(0,.43-age*.11));}
   if(elapsed<1.5){for(let i=0;i<44;i++){const r=rnd(i+91),age=elapsed-r*.12;if(age<0)continue;const x=w*(.5+(r-.5)*.63)+(r-.5)*age*w*.17,y=waterY-age*h*(.12+r*.13)+age*age*h*.20;ctx.globalAlpha=Math.max(0,.75-age*.55);if(y<=waterY)ctx.fillRect(Math.round(x/pitch)*pitch,Math.round(y/3)*3,pitch*.7,3+r*5);}}
   const cycle=(t*.16)%1;ring(cycle,.22+cycle*.14,.11*(1-cycle));
  }
  ctx.globalAlpha=1;
 };
 const drawMark=(travel:number)=>{
  ctx.clearRect(0,0,w,h);ctx.globalAlpha=1;ctx.fillStyle='#c9b894';
  const k=w<h?.64:.42,height=Math.min(w*.185,h*.3),target=h*(w<h?.57:.13),top=h*.84+(target-h*.84)*travel,pitch=w>1000?5:3.5;
  for(const b of bars)ctx.fillRect(w*.055+(b.x-w*.06)*k,top+b.a*height*k,pitch*.7*k,(b.b-b.a)*height*k);
 };
 resize();return{resize,draw,drawMark};
}




