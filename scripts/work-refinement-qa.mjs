import {chromium} from 'file:///C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {mkdir, writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const folder = 'work/refinement-qa';
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
async function choose(i) {
 await page.locator('.gallery-navigation button').nth(i).click();
 await page.waitForTimeout(2500);
 await page.mouse.move(50,450);
}
try {
 await page.goto('http://127.0.0.1:5173/',{waitUntil:'networkidle'});
 const branchMotion=await page.evaluate(async()=>{
  const {createWorkBranch}=await import('/app/work-branch.ts');
  const THREE=await import('/node_modules/three/build/three.module.js');
  const branch=createWorkBranch(),renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});
  renderer.setSize(800,600);renderer.setClearColor(0,0);
  const camera=new THREE.OrthographicCamera(-400,400,300,-300,.1,3000);camera.position.z=1000;
  const render=p=>{branch.draw(p,800,600);renderer.render(branch.scene,camera);return renderer.domElement.toDataURL();};
  const start=render(.14),end=render(.72),reverse=render(.14);
  await new Promise(r=>setTimeout(r,1200));
  const held=render(.14);
  const image=new Image();image.src=end;await image.decode();
  const c=document.createElement('canvas');c.width=800;c.height=600;
  const ctx=c.getContext('2d');ctx.drawImage(image,0,0);const data=ctx.getImageData(0,0,800,600).data;
  let ink=0;for(let i=3;i<data.length;i+=4)if(data[i]>100)ink++;
  branch.dispose();renderer.dispose();
  return {changesWithScroll:start!==end,reversesExactly:start===reverse,holdsWhenScrollStops:start===held,ink:ink/(800*600)};
 });
 assert(branchMotion.changesWithScroll,'Branch does not animate with scroll');
 assert(branchMotion.reversesExactly,'Branch does not return to its earlier pose');
 assert(branchMotion.holdsWhenScrollStops,'Branch moves while scroll is stopped');
 assert(branchMotion.ink>.008,'Branch not visible');
 results.push({branchMotion});
 await at(.14);await page.screenshot({path:`${folder}/branch-folded.png`});
 await at(.72);await page.screenshot({path:`${folder}/branch-open.png`});
 console.log('Branch scroll QA',branchMotion);
 for(let i=0;i<5;i++) {
  await choose(i);
  const card=page.locator('.work-card').nth(i),box=await card.boundingBox();
  assert(box.y>=8 && box.y+box.height<890,`Card ${i+1} clips vertically`);
  const cap=await card.locator('.work-card-caption').evaluate(e=>({background:getComputedStyle(e).backgroundColor,text:getComputedStyle(e).color}));
  assert.equal(cap.background,'rgb(41, 41, 32)');
  assert.equal(cap.text,'rgb(244, 237, 223)');
  assert.equal(await card.locator('.work-preview').evaluate(e=>getComputedStyle(e).clipPath),'none');
  assert.equal(await page.locator('.gallery-navigation button').nth(i).getAttribute('aria-pressed'),'true');
  const iframe=page.frames().find(f=>f.url().includes(`/concepts/`) && f.url().includes(['little-loaf','sweet-blissful-blooms','little-local','down-home-roots','curly-and-spot'][i]));
  assert(iframe,`No live iframe for ${i}`);
  assert.equal(await iframe.locator('html').evaluate(e=>getComputedStyle(e).overflow),'hidden');
  results.push({project:i+1,unclipped:true,darkCaption:true,previewScrollbar:false,navigation:true});
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
   await card.locator('.work-card-surface').click({position:{x:box.width*.5,y:470}});
   await page.waitForURL('**/concepts/little-loaf.html');
   await page.goBack({waitUntil:'networkidle'}); await at(.4);
  }
 }
 await page.locator('.gallery-navigation button').first().focus();
 await page.keyboard.press('ArrowRight');await page.waitForTimeout(1600);
 assert.equal(await page.locator('.gallery-navigation button').nth(1).getAttribute('aria-pressed'),'true');
 const video=page.video();await page.close();await context.close();await video.saveAs(`${folder}/motion.webm`);
 const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
 mobile.on('pageerror',e=>errors.push(e.message));
 await mobile.goto('http://127.0.0.1:5173/',{waitUntil:'networkidle'});
 for(const [width,height] of [[320,640],[390,844],[700,900]]) {
  await mobile.setViewportSize({width,height});
  await mobile.evaluate(()=>{const e=document.querySelector('#work');scrollTo(0,e.getBoundingClientRect().top+scrollY+(e.offsetHeight-innerHeight)*(.34+.66*.4));});
  await mobile.waitForTimeout(1600);
  for(const i of [0,4]) {
   await mobile.locator('.gallery-navigation button').nth(i).click();await mobile.waitForTimeout(1600);
   const bounds=await mobile.locator('.work-card').nth(i).boundingBox();
   assert(bounds.y>0 && bounds.y+bounds.height<height,`Clipping at ${width}x${height}, card ${i+1}`);
   assert(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Horizontal overflow');
   await mobile.screenshot({path:`${folder}/mobile-${width}-${i}.png`});
  }
 }
 await mobile.close();
 const still=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 await still.goto('http://127.0.0.1:5173/',{waitUntil:'networkidle'});
 await still.evaluate(()=>{const e=document.querySelector('#work');scrollTo(0,e.getBoundingClientRect().top+scrollY+(e.offsetHeight-innerHeight)*(.34+.66*.4));});
 await still.waitForTimeout(1800);
 const first=await still.locator('.work-stage > canvas:not(.cloud-passage)').evaluate(c=>c.toDataURL());
 await still.waitForTimeout(1100);
 assert.equal(first,await still.locator('.work-stage > canvas:not(.cloud-passage)').evaluate(c=>c.toDataURL()),'Reduced-motion scene moves');
 await still.close();
 assert.deepEqual(errors,[]);
 await writeFile(`${folder}/results.json`,JSON.stringify({results,hover:true,fullCardClick:true,keyboardNavigation:true,mobile:true,reducedMotion:true,errors},null,2));
 console.log('Refinement QA passed',JSON.stringify(results));
} finally {await browser.close();}
