import {chromium} from 'file:///C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {mkdir, writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {galleryCardProgress, galleryGeometry} from '../app/work-gallery-motion.ts';
const folder = 'work/refinement-qa';
const motionOnly=process.argv.includes('--motion-only');
await mkdir(folder, {recursive:true});
const browser = await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});
const context = await browser.newContext({viewport:{width:1440,height:900},recordVideo:{dir:folder,size:{width:1440,height:900}}});
const page = await context.newPage(), errors = [], results = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => {if(m.type()==='error') errors.push(`${m.text()} ${m.location().url}`);});
page.on('response', r => {if(r.status()>=400) errors.push(`${r.status()} ${r.url()}`);});
async function at(p) {
 await page.evaluate(p => {const e=document.querySelector('#work');scrollTo(0,e.getBoundingClientRect().top+scrollY+(e.offsetHeight-innerHeight)*(.34+.66*p));},p);
 await page.waitForTimeout(1500);
}
async function choose(i,offset=0) {
 const width=page.viewportSize().width,cardWidth=await page.locator('.work-card').first().evaluate(e=>e.offsetWidth);
 const {duration,total}=galleryGeometry(width,cardWidth);
 const catalog=galleryCardProgress(width,cardWidth,i)-duration*offset/total;
 await page.evaluate(catalog=>{
  const e=document.querySelector('#work');
  scrollTo({top:e.getBoundingClientRect().top+scrollY+(e.offsetHeight-innerHeight)*(.34+.66*catalog),behavior:'instant'});
 },catalog);
 await page.waitForTimeout(2500);
 await page.mouse.move(50,450);
}
try {
 await page.goto('http://127.0.0.1:5173/',{waitUntil:'networkidle'});
 const branchMotion=await page.evaluate(async()=>{
  const {createWorkBranch}=await import('/app/work-branch.ts');
  const THREE=await import('/node_modules/three/build/three.module.js');
  const branch=createWorkBranch(),renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});
  await branch.ready;
  renderer.setSize(800,600);renderer.setClearColor(0,0);
  const camera=new THREE.OrthographicCamera(-400,400,300,-300,.1,3000);camera.position.z=1000;
  const render=(p,time=0,impulse=0)=>{branch.draw(p,800,600,time,impulse);renderer.render(branch.scene,camera);return renderer.domElement.toDataURL();};
  const start=render(.14),end=render(.72),reverse=render(.14);
  await new Promise(r=>setTimeout(r,1200));
  const held=render(.14);
  const breezeA=render(.72,1),breezeB=render(.72,4),replay=render(.72,1);
  const responding=render(.72,1,.5);
  const image=new Image();image.src=end;await image.decode();
  const c=document.createElement('canvas');c.width=800;c.height=600;
  const ctx=c.getContext('2d');ctx.drawImage(image,0,0);const data=ctx.getImageData(0,0,800,600).data;
  let ink=0;for(let i=3;i<data.length;i+=4)if(data[i]>100)ink++;
  branch.dispose();renderer.dispose();
  return {changesWithScroll:start!==end,reversesExactly:start===reverse,stableAtSamePhase:start===held,
   livingBreeze:breezeA!==breezeB,replaysExactly:breezeA===replay,scrollResponse:responding!==breezeA,ink:ink/(800*600)};
 });
 assert(branchMotion.changesWithScroll,'Branch does not animate with scroll');
 assert(branchMotion.reversesExactly,'Branch does not return to its earlier pose');
 assert(branchMotion.stableAtSamePhase,'Branch flickers at the same animation phase');
 assert(branchMotion.livingBreeze,'No secondary leaf motion');
 assert(branchMotion.replaysExactly,'Animation is not coherent');
 assert(branchMotion.scrollResponse,'No response to scrolling impulse');
 assert(branchMotion.ink>.008,'Branch not visible');
 results.push({branchMotion});
 await at(.14);await page.screenshot({path:`${folder}/branch-folded.png`});
 await at(.72);await page.screenshot({path:`${folder}/branch-open.png`});
 console.log('Branch scroll QA',branchMotion);
 if(motionOnly){const video=page.video();await page.close();await context.close();await video.saveAs(`${folder}/motion.webm`);}
 if(!motionOnly){
 assert.equal(await page.locator('.gallery-navigation').count(),0,'Numbered panel remains');
 await choose(0,-.15);const upper=await page.locator('.work-card').first().boundingBox();
 await choose(0,.15);const lower=await page.locator('.work-card').first().boundingBox();
 assert(lower.y-upper.y>67,'Card movement is too horizontal');
 for(let i=0;i<5;i++) {
  await choose(i);
  const card=page.locator('.work-card').nth(i),box=await card.boundingBox();
  assert(box.y>=8 && box.y+box.height<890,`Card ${i+1} clips vertically`);
  const cap=await card.locator('.work-card-caption').evaluate(e=>({background:getComputedStyle(e).backgroundColor,text:getComputedStyle(e).color}));
  assert.equal(cap.background,'rgb(41, 41, 32)');
  assert.equal(cap.text,'rgb(244, 237, 223)');
  assert.equal(await card.locator('.work-preview').evaluate(e=>getComputedStyle(e).clipPath),'none');
  assert.equal(await card.getAttribute('data-primary'),'true');
  const roll=await card.evaluate(e=>{const m=new DOMMatrix(getComputedStyle(e).transform);return Math.atan2(m.m12,m.m11)*180/Math.PI;});
  assert(Math.abs(roll)<.1,`Main card ${i+1} is not straight`);
  assert.equal(await card.locator('.work-card-caption').evaluate(e=>getComputedStyle(e,'::after').content),'none');
  const iframe=page.frames().find(f=>f.url().includes(`/concepts/`) && f.url().includes(['little-loaf','sweet-blissful-blooms','little-local','down-home-roots','curly-and-spot'][i]));
  assert(iframe,`No live iframe for ${i}`);
  assert.equal(await iframe.locator('html').evaluate(e=>getComputedStyle(e).overflow),'hidden');
  assert.equal(await iframe.locator('.poudev-return').count(),0,'Return control appears in a preview');
  const neighbour=page.locator('.work-card').nth(i===4?3:i+1);
  const neighbourRoll=await neighbour.evaluate(e=>{const m=new DOMMatrix(getComputedStyle(e).transform);return Math.atan2(m.m12,m.m11)*180/Math.PI;});
  assert(Math.abs(neighbourRoll)>2,'Neighbour card has no visible rotation');
  results.push({project:i+1,unclipped:true,darkCaption:true,previewScrollbar:false,straightMain:true,rotatedNeighbour:true});
  if(i===0) {
   await page.screenshot({path:`${folder}/desktop.png`});
   const normal=await card.locator('.work-preview-media').evaluate(e=>getComputedStyle(e).transform);
   await card.locator('.work-card-surface').hover({position:{x:box.width*.73,y:box.height*.3}});
   await page.waitForTimeout(850);
   const zoom=await card.locator('.work-preview-media').evaluate(e=>getComputedStyle(e).transform);
   assert.notEqual(normal,zoom,'Hover zoom did not activate');
   const hovered=await card.boundingBox();
   assert(hovered.y>0 && hovered.y+hovered.height<900,'Hovered card clips');
   assert.equal(await card.locator('.caption-open').evaluate(e=>getComputedStyle(e).opacity),'1');
   await page.screenshot({path:`${folder}/hover.png`});
  }
  await page.mouse.move(50,450);await page.waitForTimeout(700);
  const before=await page.evaluate(()=>scrollY),beforeBox=await card.boundingBox();
  await card.locator('.work-card-surface').click({position:{x:box.width*.5,y:200}});
  await page.waitForURL('**/concepts/*.html');
  await page.waitForLoadState('networkidle');
  const back=page.locator('.poudev-return');await back.waitFor({state:'visible'});
  assert.equal(await page.locator('footer a[href="/#work"]').count(),0);
  const initialButton=await back.boundingBox();assert(initialButton.height>=58);
  await page.evaluate(()=>scrollTo({top:document.body.scrollHeight,behavior:'instant'}));
  const finalButton=await back.boundingBox();assert(Math.abs(initialButton.y-finalButton.y)<1,'Return button is not fixed');
  await page.evaluate(()=>document.querySelector('.modal')?.classList.add('open'));
  assert(await back.evaluate(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),'Return button is covered by the concept modal');
  if(i===0)await page.screenshot({path:`${folder}/concept-return.png`});
  await back.click();await page.waitForURL(/\/$|\/#work$/);await page.waitForLoadState('networkidle');await page.waitForTimeout(1700);
  const returned=await page.evaluate(()=>scrollY),returnedBox=await page.locator('.work-card').nth(i).boundingBox();
  assert(Math.abs(returned-before)<2,`Return moved card ${i+1}: ${before} -> ${returned}`);
  assert(Math.abs(returnedBox.x-beforeBox.x)<3 && Math.abs(returnedBox.y-beforeBox.y)<3,'Card pose changed after return');
  results.push({project:i+1,returnToExactPosition:true,fixedButtonAboveModal:true});
  if(i===0){
   await page.locator('.work-card-surface').first().click({position:{x:200,y:200}});await page.waitForURL('**/concepts/little-loaf.html');
   await page.goBack({waitUntil:'networkidle'});await page.waitForTimeout(1500);
   assert(Math.abs(await page.evaluate(()=>scrollY)-before)<2,'Browser Back loses the portfolio position');
  }
 }
 await choose(0);await page.locator('.work-card-surface').first().focus();
 await page.keyboard.press('ArrowRight');await page.waitForTimeout(1600);
 assert.equal(await page.locator('.work-card').nth(1).getAttribute('data-primary'),'true');
 const video=page.video();await page.close();await context.close();await video.saveAs(`${folder}/motion.webm`);
 const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
 mobile.on('pageerror',e=>errors.push(e.message));
 await mobile.goto('http://127.0.0.1:5173/',{waitUntil:'networkidle'});
 for(const [width,height] of [[320,640],[390,844],[700,900]]) {
  await mobile.setViewportSize({width,height});
  await mobile.evaluate(()=>{const e=document.querySelector('#work');scrollTo(0,e.getBoundingClientRect().top+scrollY+(e.offsetHeight-innerHeight)*(.34+.66*.4));});
  await mobile.waitForTimeout(1600);
  for(const i of [0,4]) {
   const catalog=galleryCardProgress(width,await mobile.locator('.work-card').first().evaluate(e=>e.offsetWidth),i);
   await mobile.evaluate(catalog=>{
    const e=document.querySelector('#work');
    scrollTo({top:e.getBoundingClientRect().top+scrollY+(e.offsetHeight-innerHeight)*(.34+.66*catalog),behavior:'instant'});
   },catalog);await mobile.waitForTimeout(1600);
   const bounds=await mobile.locator('.work-card').nth(i).boundingBox();
   assert(bounds.y>0 && bounds.y+bounds.height<height,`Clipping at ${width}x${height}, card ${i+1}`);
   assert(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Horizontal overflow');
   await mobile.screenshot({path:`${folder}/mobile-${width}-${i}.png`});
   const before=await mobile.evaluate(()=>scrollY);
   // A physical click avoids Playwright scrolling the positioned sticky ancestor first.
   const surface=await mobile.locator('.work-card-surface').nth(i).boundingBox();
   await mobile.mouse.click(surface.x+100,surface.y+100);await mobile.waitForURL('**/concepts/*.html');
   await mobile.locator('.poudev-return').click();await mobile.waitForURL(/\/$|\/#work$/);await mobile.waitForTimeout(1700);
   assert(Math.abs(await mobile.evaluate(()=>scrollY)-before)<2,`Mobile return moved at ${width}`);
  }
 }
 await mobile.close();
 }
 const still=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 await still.goto('http://127.0.0.1:5173/',{waitUntil:'networkidle'});
 await still.evaluate(()=>{const e=document.querySelector('#work');scrollTo({top:e.getBoundingClientRect().top+scrollY+(e.offsetHeight-innerHeight)*(.34+.66*.4),behavior:'instant'});});
 await still.waitForLoadState('networkidle');
 await still.waitForTimeout(1800);
 const first=await still.locator('.work-stage > canvas:not(.cloud-passage)').evaluate(c=>c.toDataURL());
 await still.waitForTimeout(1100);
 assert(first===await still.locator('.work-stage > canvas:not(.cloud-passage)').evaluate(c=>c.toDataURL()),'Reduced-motion scene moves');
 await still.close();
 assert.deepEqual(errors,[]);
 await writeFile(`${folder}/${motionOnly?'motion-results':'results'}.json`,JSON.stringify({results,hover:!motionOnly,fullCardClick:!motionOnly,keyboardNavigation:!motionOnly,mobile:!motionOnly,reducedMotion:true,errors},null,2));
 console.log('Refinement QA passed',JSON.stringify(results));
} finally {await browser.close();}
