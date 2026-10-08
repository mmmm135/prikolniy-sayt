// Optional GPU scenes must never prevent the page from mounting.
export function createSceneFallback(){
 const canvas=document.createElement('canvas');canvas.width=1;canvas.height=1;
 const resize:(width:number,height:number)=>void=()=>{};
 const draw:(progress:number,time:number,target?:{x:number;y:number})=>void=()=>{};
 return {canvas,ready:Promise.resolve(),resize,draw,prepare:()=>{},pause:()=>{},dispose:()=>{}};
}
