import {chromium} from 'file:///C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {mkdirSync, writeFileSync} from 'node:fs';
mkdirSync('work/chapters-qa',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});
const report=[];
for(const [width,height,reduced] of [[1440,900,false],[1280,720,false],[768,1024,false],[430,932,false],[390,844,false],[390,780,false],[320,800,false],[320,667,false],[1440,900,true],[390,844,true]]){
 const page=await browser.newPage({viewport:{width,height},reducedMotion:reduced?'reduce':'no-preference'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5173/',{waitUntil:'networkidle'});
 await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(800);
 const prefix=`${width}-${height}${reduced?'-reduced':''}`;
 const scroll=async(selector,p)=>{
  await page.evaluate(({selector,p})=>{const el=document.querySelector(selector),stage=el.querySelector('[data-scroll-stage]')||el.querySelector('.work-stage');scrollTo(0,el.getBoundingClientRect().top+scrollY+(el.offsetHeight-stage.offsetHeight)*p);},{selector,p});
  await page.waitForTimeout(650);
 };
 if(!reduced){
  for(const p of [.85,.94,.995]){
   await scroll('#work',.34+.66*p);
   const cards=await page.locator('.work-card').evaluateAll(els=>els.map(el=>{const b=el.getBoundingClientRect();return {right:b.right,left:b.left,visibility:getComputedStyle(el).visibility}}));
   report.push({width,section:'carousel',p,cards});
   if(p===.995&&cards.some(card=>card.visibility!=='hidden'&&card.right>0&&card.left<width))throw Error(`Carousel did not exit at ${width}`);
   if(p===.94)await page.screenshot({path:`work/chapters-qa/${prefix}-carousel-exit.png`});
  }
  for(const p of [.08,.20,.34,.56,.82,.97]){
   await scroll('#process',p);await page.screenshot({path:`work/chapters-qa/${prefix}-process-${p}.png`});
   const layout=await page.evaluate(({width,p})=>{const el=document.querySelector('#process'),stage=el.querySelector('.process-stage').getBoundingClientRect();const panels=[...el.querySelectorAll('.process-story')].filter(e=>Number(getComputedStyle(e).opacity)>.85);return {width,p,section:'process',progress:el.style.getPropertyValue('--process-progress'),panels:panels.map(panel=>{const copy=panel.querySelector('.process-story-copy').getBoundingClientRect(),visual=panel.querySelector('.process-story-visual').getBoundingClientRect(),artifact=panel.querySelector('.process-artifact').getBoundingClientRect(),footer=el.querySelector('.process-bottom').getBoundingClientRect();return {copyBottom:copy.bottom,visualBottom:visual.bottom,artifactBottom:artifact.bottom,footerTop:footer.top,stageTop:stage.top,copyTop:copy.top,stageBottom:stage.bottom}})}} ,{width,p});
   report.push(layout);
   if(layout.panels.some(panel=>panel.copyBottom>panel.footerTop-7||panel.artifactBottom>panel.footerTop-7))throw Error(`Process overlaps navigation: ${width}x${height} ${p} ${JSON.stringify(layout)}`);
  }
  for(const p of [0,.35,.80,1]){await scroll('#studio',p);await page.screenshot({path:`work/chapters-qa/${prefix}-studio-${p}.png`});}
  await scroll('#process',.08);await page.getByRole('button',{name:'Go to step 2: Shape'}).click();await page.waitForTimeout(1500);
  const current=await page.locator('.process-step-button[aria-current=step]').textContent();
  if(!current?.includes('Shape'))throw Error(`Step navigation failed ${width}: ${current}`);
 }else{
  for(const selector of ['#process','#studio']){
   await page.locator(selector).scrollIntoViewIfNeeded();await page.screenshot({path:`work/chapters-qa/${prefix}-${selector.slice(1)}.png`});
  }
  const hidden=await page.locator('.process-story').evaluateAll(els=>els.some(el=>el.inert||el.getAttribute('aria-hidden')==='true'));
  if(hidden)throw Error('Reduced motion content is inaccessible');
 }
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
 report.push({width,height,reduced,errors,overflow});
 if(errors.length||overflow)throw Error(JSON.stringify(report.at(-1)));
 await page.close();
}
writeFileSync('work/chapters-qa/report.json',JSON.stringify(report,null,2));
console.log('PASS:',report.filter(x=>x.height));await browser.close();
