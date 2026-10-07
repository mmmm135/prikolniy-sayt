import {chromium} from 'file:///C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:5173/',{waitUntil:'networkidle'});
async function at(c){await page.evaluate(({c,h})=>{const e=document.querySelector('#work');scrollTo(0,e.getBoundingClientRect().top+scrollY+(e.offsetHeight-h)*(.34+.66*c));},{c,h:page.viewportSize().height});await page.waitForTimeout(1400);}
await at(.37);const before=await page.locator('.work-card').first().boundingBox();await at(.41);const after=await page.locator('.work-card').first().boundingBox();
if(!(after.x<before.x&&after.y<before.y))throw Error('Carousel does not move diagonally');
console.log('Diagonal movement', {dx:after.x-before.x,dy:after.y-before.y});
for(let i=0;i<5;i++){
 await at(.16+.84*(1.12+i*.52-.33)/2.87);
 const frame=page.frames().find(f=>f.url().includes(`/concepts/`)&&f.url().includes(['little-loaf','sweet-blissful-blooms','little-local','down-home-roots','curly-and-spot'][i]));
 if(!frame)throw Error('Missing live preview '+i);
 const t1=await frame.locator('.hero img').evaluate(e=>getComputedStyle(e).transform);await page.waitForTimeout(350);const t2=await frame.locator('.hero img').evaluate(e=>getComputedStyle(e).transform);
 if(t1===t2)throw Error('Static preview '+i);
 const link=page.locator('.work-preview').nth(i),href=await link.getAttribute('href');
 await link.click({position:{x:150,y:150}});await page.waitForURL('**'+href);await page.goBack({waitUntil:'networkidle'});
 console.log('Animated preview and clickable website',i+1);
}
for(const width of [320,390,700,1440])for(const slug of ['little-loaf','sweet-blissful-blooms','little-local','down-home-roots','curly-and-spot']){
 await page.setViewportSize({width,height:844});await page.goto(`http://127.0.0.1:5173/concepts/${slug}.html`,{waitUntil:'networkidle'});
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
 if(overflow)throw Error(`Horizontal overflow ${slug} ${width}`);
}
console.log('20 concept viewport checks passed; browser errors:',errors);if(errors.length)throw Error(errors.join('\n'));
await browser.close();
