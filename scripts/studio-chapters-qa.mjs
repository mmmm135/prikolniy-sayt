import {chromium} from 'file:///C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {mkdirSync} from 'node:fs';
mkdirSync('work/rebuilt-chapters',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});
try{
for(const [width,height,reduced] of [[1440,900,false],[390,844,false],[320,667,false],[768,1024,false],[1280,720,false],[390,844,true]]){
 const page=await browser.newPage({viewport:{width,height},reducedMotion:reduced?'reduce':'no-preference'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5173/',{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
 if(!reduced){
  await page.evaluate(()=>{const e=document.querySelector('#work'),stage=e.querySelector('.work-stage');scrollTo(0,e.getBoundingClientRect().top+scrollY+(e.offsetHeight-stage.offsetHeight)*(.34+.66*.995))});await page.waitForTimeout(1100);
  const carouselExited=await page.locator('.work-card').evaluateAll(els=>els.every(e=>{const r=e.getBoundingClientRect();return getComputedStyle(e).visibility==='hidden'||r.right<=0||r.left>=innerWidth}));
  if(!carouselExited)throw Error(`Carousel did not fully exit at ${width}`);
  for(const p of [.07,.29,.52,.75,.97]){
   await page.evaluate(p=>{const e=document.querySelector('#process');scrollTo(0,e.getBoundingClientRect().top+scrollY+(e.offsetHeight-innerHeight)*p)},p);await page.waitForTimeout(450);
   await page.screenshot({path:`work/rebuilt-chapters/${width}-process-${p}.png`});
   const layout=await page.evaluate(()=>{const stage=document.querySelector('.process-stage').getBoundingClientRect();return [...document.querySelectorAll('.process-story')].filter(e=>+getComputedStyle(e).opacity>.95).map(e=>{const p=e.querySelector('p').getBoundingClientRect(),h=e.querySelector('h3').getBoundingClientRect();return{titleBottom:h.bottom,copyTop:p.top,copyBottom:p.bottom,stageBottom:stage.bottom}})});
   if(layout.some(e=>e.titleBottom>e.copyTop||e.copyBottom>e.stageBottom-15))throw Error(`Text clipping ${width} ${JSON.stringify(layout)}`);
  }
 }
 await page.evaluate(()=>{const e=document.querySelector('#studio');scrollTo(0,e.getBoundingClientRect().top+scrollY)});await page.waitForTimeout(700);
 await page.screenshot({path:`work/rebuilt-chapters/${width}-studio${reduced?'-reduced':''}.png`});
 const result=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,stars:[...document.querySelectorAll('#process,#studio')].some(e=>e.textContent.includes('✳')),oldArtifacts:document.querySelectorAll('.process-artifact,.studio-door').length,handLoaded:performance.getEntriesByType('resource').some(e=>e.name.includes('studio-hand.jpg'))}));
 if(result.overflow||result.stars||result.oldArtifacts||!result.handLoaded||errors.length)throw Error(JSON.stringify({width,result,errors}));
 if(reduced){const hidden=await page.locator('.process-story').evaluateAll(els=>els.some(e=>e.inert||e.getAttribute('aria-hidden')==='true'));if(hidden)throw Error('Inaccessible reduced motion content');}
 console.log('PASS',width,height,reduced,result);await page.close();
}
}finally{await browser.close();}
