import {chromium} from 'file:///C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});
const context=await browser.newContext({viewport:{width:1440,height:900},recordVideo:{dir:'work/motion-qa',size:{width:1440,height:900}}});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:5173/',{waitUntil:'networkidle'});
await page.evaluate(()=>{const e=document.querySelector('#work');scrollTo(0,e.getBoundingClientRect().top+scrollY+(e.offsetHeight-innerHeight)*.34)});
await page.waitForTimeout(1800);
await page.screenshot({path:'work/motion-qa/intro.png'});
for(let i=0;i<29;i++){await page.mouse.wheel(0,115);await page.waitForTimeout(350);if([3,10,18,28].includes(i))await page.screenshot({path:`work/motion-qa/wheel-${i}.png`});}
await page.waitForTimeout(1600);
const deltas=await page.evaluate(()=>new Promise(resolve=>{const values=[];let last=0;function frame(t){if(last)values.push(t-last);last=t;if(values.length<120)requestAnimationFrame(frame);else resolve(values)}requestAnimationFrame(frame)}));
console.log('Real wheel pass; average RAF interval:',deltas.reduce((a,b)=>a+b,0)/deltas.length,'ms; errors:',errors);
const video=page.video();await page.close();await context.close();await video.saveAs('work/motion-qa/carousel-wheel.webm');await browser.close();
