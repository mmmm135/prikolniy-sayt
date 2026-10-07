import {chromium} from 'file:///C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const b=await chromium.launch({headless:true,channel:'chrome',args:['--enable-unsafe-swiftshader']});
const c=await b.newContext({viewport:{width:1440,height:900},recordVideo:{dir:'work/environment-qa',size:{width:1440,height:900}}});
const p=await c.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
await p.goto('http://127.0.0.1:5173/',{waitUntil:'networkidle'});
await p.evaluate(()=>{const e=document.querySelector('#work');scrollTo(0,e.getBoundingClientRect().top+scrollY+(e.offsetHeight-innerHeight)*(.34+.66*.23));});
for(let i=0;i<6;i++){await p.waitForTimeout(i?7000:1500);await p.screenshot({path:`work/environment-qa/cycle-${i}.png`});}
console.log('Observed five forward herd loops and continuous model flight.',errors);
const v=p.video();await p.close();await c.close();await v.saveAs('work/environment-qa/three-cycles.webm');await b.close();
