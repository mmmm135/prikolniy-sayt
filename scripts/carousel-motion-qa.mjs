import {chromium} from 'file:///C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const b=await chromium.launch({headless:true,channel:'chrome',args:['--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1440,height:900}});const errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
await p.goto('http://127.0.0.1:5173/',{waitUntil:'networkidle'});
async function at(c){const box=await p.locator('#work').evaluate(e=>({top:e.getBoundingClientRect().top+scrollY,height:e.offsetHeight}));await p.evaluate(y=>scrollTo(0,y),box.top+(box.height-p.viewportSize().height)*(.34+.66*c));await p.waitForTimeout(1800);}
for(const c of [.04,.13,.22,.4,.6,.8,1]){await at(c);await p.screenshot({path:`qa-revised-${c}.png`});}
await at(.14);await p.addStyleTag({content:'.work-gallery,.work-heading{visibility:hidden}'});await p.screenshot({path:'qa-revised-background.png'});
console.log('desktop',await p.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth})),errors);
await p.setViewportSize({width:390,height:844});await p.reload({waitUntil:'networkidle'});for(const c of [.15,.4,.7,1]){await at(c);await p.screenshot({path:`qa-revised-mobile-${c}.png`});}
console.log('mobile',await p.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth})),errors);await b.close();
