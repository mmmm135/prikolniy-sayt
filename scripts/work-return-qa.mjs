import {chromium} from 'file:///C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});
const results=[],errors=[];
try{
 for(const [width,height] of [[1440,900],[390,844]]){
  const page=await browser.newPage({viewport:{width,height}});
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:5173/#work',{waitUntil:'networkidle'});
  async function select(index){
   await page.evaluate(index=>{
    const e=document.querySelector('#work'),mobile=innerWidth<=700,ratio=document.querySelector('.work-card').offsetWidth/innerWidth;
    const catalog=.16+.84*(1.12+index*(mobile?1.02:.52)-(1-ratio)*.5)/(mobile?5.11:2.87);
    scrollTo({top:e.getBoundingClientRect().top+scrollY+(e.offsetHeight-innerHeight)*(.34+.66*catalog),behavior:'instant'});
   },index);await page.waitForTimeout(1300);
  }
  async function open(index){
   const before=await page.evaluate(()=>scrollY),box=await page.locator('.work-card-surface').nth(index).boundingBox();
   await page.mouse.click(box.x+100,box.y+100);await page.waitForURL('**/concepts/*.html');await page.waitForLoadState('networkidle');return before;
  }
  await select(2);const before=await open(2);
  await page.locator('.hero a[href="#collection"]').click();
  await page.locator('.poudev-return').click();await page.waitForURL('**/#work');await page.waitForLoadState('networkidle');await page.waitForTimeout(1500);
  assert(Math.abs(await page.evaluate(()=>scrollY)-before)<2,'Explicit return lost the selected card');
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('poudev:work-return-pending')),null);
  // Seed the old persistent marker to cover users who already visited the buggy version.
  await page.evaluate(()=>history.replaceState({...history.state,poudevWorkReturn:JSON.parse(sessionStorage.getItem('poudev:work-return'))},'',location.href));
  for(const area of ['intro','garden','work-intro','gallery']){
   await page.evaluate(area=>{
    const work=document.querySelector('#work');
    const target=area==='intro'?320:area==='garden'?document.querySelector('.botanical').getBoundingClientRect().top+scrollY+120:area==='work-intro'?work.getBoundingClientRect().top+scrollY+(work.offsetHeight-innerHeight)*.12:work.getBoundingClientRect().top+scrollY+(work.offsetHeight-innerHeight)*.82;
    scrollTo({top:target,behavior:'instant'});
    // Even an unconsumed old request cannot hijack a reload.
    sessionStorage.setItem('poudev:work-return-pending',sessionStorage.getItem('poudev:work-return'));
   },area);await page.waitForTimeout(600);
   const position=await page.evaluate(()=>scrollY);
   await page.reload({waitUntil:'networkidle'});await page.waitForTimeout(1500);
   const returned=await page.evaluate(()=>scrollY);
   assert(Math.abs(returned-position)<2,`${width}: reload moved ${area} from ${position} to ${returned}`);
   assert.equal(await page.evaluate(()=>sessionStorage.getItem('poudev:work-return-pending')),null);
   results.push({width,area,reloadPreservesPosition:true});
  }
  await select(3);const backPosition=await open(3);
  await page.goBack({waitUntil:'networkidle'});await page.waitForTimeout(1400);
  assert(Math.abs(await page.evaluate(()=>scrollY)-backPosition)<2,'Native browser Back lost the card');
  await page.goForward({waitUntil:'networkidle'});
  assert(page.url().endsWith('/concepts/down-home-roots.html'),'Native browser Forward went to the wrong page');
  const popupPromise=page.context().waitForEvent('page');
  await page.locator('.poudev-return').click({modifiers:['Control']});const popup=await popupPromise;await popup.close();
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('poudev:work-return-pending')),null,'Modified click left a return request in the original tab');
  await page.locator('.poudev-return').click();await page.waitForURL('**/#work');await page.waitForLoadState('networkidle');await page.waitForTimeout(1300);
  assert(Math.abs(await page.evaluate(()=>scrollY)-backPosition)<2,'Return failed after browser Back/Forward');
  results.push({width,explicitReturn:true,nativeBackForward:true,modifiedClickDoesNotLeakState:true});await page.close();
 }
 assert.deepEqual(errors,[]);console.log('Work return QA passed',JSON.stringify(results));
}finally{await browser.close();}
