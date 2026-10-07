import {chromium} from 'file:///C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const b=await chromium.launch({headless:true,channel:'chrome',args:['--enable-unsafe-swiftshader']});
const p=await b.newPage(); const errors=[];p.on('pageerror',e=>errors.push(e.message));
for(const [width,height] of [[320,568],[390,844]]){
 await p.setViewportSize({width,height});await p.goto('http://127.0.0.1:5173/',{waitUntil:'networkidle'});
 for(let i=0;i<5;i++){
  const c=.16+.84*(1.12+i*1.02-.09)/5.11;
  await p.evaluate(c=>{const e=document.querySelector('#work');scrollTo(0,e.getBoundingClientRect().top+scrollY+(e.offsetHeight-innerHeight)*(.34+.66*c))},c);
  await p.waitForTimeout(1300);
  await p.screenshot({path:`work/motion-qa/phone-${width}-${i}.png`});
  console.log(width,i,await p.evaluate(i=>{const e=document.querySelectorAll('.work-card')[i];return {overflow:document.documentElement.scrollWidth>innerWidth,bottom:e.getBoundingClientRect().bottom}},i));
 }
}
console.log(errors);await b.close();
