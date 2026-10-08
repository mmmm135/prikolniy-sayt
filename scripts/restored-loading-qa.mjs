import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const origin=process.argv[2]||'http://localhost:5174';
const browser=await chromium.launch({headless:true,channel:'chrome'});
try{
 for(const [width,height] of [[390,844],[1440,900]]){
  const context=await browser.newContext({viewport:{width,height}});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/_next/**',async route=>{if(route.request().resourceType()==='script')await new Promise(resolve=>setTimeout(resolve,1800));await route.continue();});
  await page.goto(origin,{waitUntil:'commit'});
  await page.locator('.loading-butterfly-filmstrip').waitFor();
  assert(await page.locator('.loading-screen').isVisible());
  const first=await page.locator('.loading-butterfly-filmstrip').evaluate(e=>getComputedStyle(e).transform);
  await page.waitForTimeout(350);
  assert.notEqual(await page.locator('.loading-butterfly-filmstrip').evaluate(e=>getComputedStyle(e).transform),first,'Butterfly animates before hydration');
  await page.waitForSelector('.scene-scroll.is-ready',{timeout:20000});
  await page.waitForSelector('.loading-screen',{state:'detached',timeout:20000});
  assert(!await page.evaluate(()=>document.documentElement.classList.contains('site-loading')));
  await page.unroute('**/_next/**');
  await page.reload({waitUntil:'commit'});
  await page.waitForFunction(()=>document.documentElement.dataset.loadingMode==='simple');
  await page.waitForSelector('.loading-screen',{state:'detached',timeout:20000});
  assert.deepEqual(errors,[]);
  console.log('PASS intro, pre-hydration animation, readiness and simple reload',width);
  await context.close();
 }
 const page=await browser.newPage();
 await page.route('**/art/night-valley-render.webp',route=>route.abort());
 await page.goto(origin);
 await page.waitForSelector('.loading-screen',{state:'detached',timeout:20000});
 assert(await page.locator('.hero-poster img').isVisible());
 assert(!await page.evaluate(()=>document.documentElement.classList.contains('site-loading')));
 console.log('PASS failed scene unlocks poster fallback');
 const context=await browser.newContext({javaScriptEnabled:false});
 const nojs=await context.newPage();await nojs.goto(origin);
 assert(!await nojs.locator('.loading-screen').isVisible());
 assert(await nojs.locator('.intro h1').isVisible());
 console.log('PASS no-JavaScript fallback');
}finally{await browser.close();}
