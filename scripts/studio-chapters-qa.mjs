import {chromium} from 'file:///C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {mkdirSync,writeFileSync} from 'node:fs';
mkdirSync('work/narrative-qa',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});
const report=[];
const cases=process.argv.includes('--targeted')?[[1440,900,false],[390,844,false]]:[[1440,900,false],[390,844,false],[320,667,false],[768,1024,false],[1280,720,false],[844,390,false],[390,844,true]];
try{
for(const [width,height,reduced] of cases){
 const page=await browser.newPage({viewport:{width,height},reducedMotion:reduced?'reduce':'no-preference'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:5173/',{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
 const scroll=async(selector,p)=>{
  await page.evaluate(({selector,p})=>{const e=document.querySelector(selector),stage=e.querySelector('[data-scroll-stage]')||e.querySelector('.work-stage');scrollTo(0,e.getBoundingClientRect().top+scrollY+(e.offsetHeight-stage.offsetHeight)*p)},{selector,p});await page.waitForTimeout(450);
 };
 if(!reduced&&height>600){
  await scroll('#work',.34+.66*.995);await page.waitForTimeout(700);
  const exited=await page.locator('.work-card').evaluateAll(els=>els.every(e=>{const r=e.getBoundingClientRect();return getComputedStyle(e).visibility==='hidden'||r.right<=0||r.left>=innerWidth}));
  if(!exited)throw Error(`Carousel did not exit: ${width}`);
  for(const p of [.04,.14,.22,.32,.44,.56,.69,.81,.94]){
   await scroll('#process',p);await page.screenshot({path:`work/narrative-qa/${width}-${height}-process-${p}.png`});
   const layout=await page.evaluate(()=>[...document.querySelectorAll('.process-chapter')].filter(e=>+getComputedStyle(e).opacity>.9).map(e=>{const title=e.querySelector('h3').getBoundingClientRect(),copy=e.querySelector('.process-detail p').getBoundingClientRect(),art=e.querySelector('.process-action').getBoundingClientRect(),outcome=e.querySelector('.process-outcome').getBoundingClientRect();return{title:title.toJSON(),copy:copy.toJSON(),art:art.toJSON(),outcome:outcome.toJSON()}}));
   if(layout.some(e=>e.copy.bottom>height-10||e.outcome.bottom>height-10||e.art.bottom>e.title.top-3))throw Error(`Layout overlaps ${width}x${height} p=${p} ${JSON.stringify(layout)}`);
   report.push({width,height,p,layout});
  }
  const hiddenQuestion=await page.locator('.process-question').getAttribute('aria-hidden');if(hiddenQuestion!=='true')throw Error('Question did not leave');
  let earlyInk,earlyBuild;
  await scroll('#process',.69);earlyBuild=await page.locator('.launch-headline').evaluate(e=>getComputedStyle(e).transform);
  await scroll('#process',.81);const assembledBuild=await page.locator('.launch-headline').evaluate(e=>getComputedStyle(e).transform);
  if(earlyBuild===assembledBuild)throw Error('Build elements did not assemble');
  for(const p of [.025,.07,.26,.33,.46,.59,.9]){
   await scroll('#studio',p);await page.screenshot({path:`work/narrative-qa/${width}-${height}-studio-${p}.png`});
   const ink=await page.locator('.studio-letter').evaluateAll(els=>els.map(e=>e.style.getPropertyValue('--letter-arrival')));
   if(p===.025)earlyInk=ink;if(p===.07&&JSON.stringify(ink)===JSON.stringify(earlyInk))throw Error('Pencil did not reveal new ink');
  }
  const end=await page.locator('.studio-final').evaluate(e=>({opacity:+getComputedStyle(e).opacity,bottom:e.querySelector('.studio-promises').getBoundingClientRect().bottom,heading:e.querySelector('h2').getBoundingClientRect().top}));
  if(end.opacity<.99||end.bottom>height-25||end.heading<height*.17)throw Error(`Studio final clipping ${width} ${JSON.stringify(end)}`);
  await page.mouse.move(width*.85,height*.32);await page.waitForTimeout(350);
  const parallax=await page.locator('#studio').evaluate(e=>Number(e.style.getPropertyValue('--studio-x')));
  if(parallax<.3)throw Error('Studio lettering did not react to the pointer');
 }else{
  for(const selector of ['#process','#studio']){await page.locator(selector).scrollIntoViewIfNeeded();await page.waitForTimeout(500);await page.screenshot({path:`work/narrative-qa/${width}-${height}-${selector.slice(1)}-natural.png`});}
  const inaccessible=await page.locator('.process-chapter,.studio-final,.studio-exchange').evaluateAll(els=>els.some(e=>e.inert||e.getAttribute('aria-hidden')==='true'));
  if(inaccessible)throw Error('Natural flow content inaccessible');
 }
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
 const old=await page.locator('.process-lines,.studio-hand,.process-artifact,.studio-door').count();
 const stars=await page.locator('#process,#studio').evaluateAll(els=>els.some(e=>e.textContent.includes('✳')));
 if(overflow||old||stars||errors.length)throw Error(JSON.stringify({width,height,overflow,old,stars,errors}));
 console.log('PASS',width,height,reduced);await page.close();
}
writeFileSync('work/narrative-qa/report.json',JSON.stringify(report,null,2));
}finally{await browser.close();}
