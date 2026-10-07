import {chromium} from 'file:///C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {mkdir, writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const output = 'work/background-qa';
await mkdir(output, {recursive: true});
const browser = await chromium.launch({channel: 'chrome', headless: true, args: ['--enable-unsafe-swiftshader']});
const context = await browser.newContext({viewport: {width: 1440, height: 900}, recordVideo: {dir: output, size: {width: 1440, height: 900}}});
const page = await context.newPage(), errors = [], results = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => {if (message.type() === 'error') errors.push(message.text());});
page.on('response', response => {if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);});

async function at(progress) {
 await page.evaluate(p => {
  const work = document.querySelector('#work');
  scrollTo(0, work.getBoundingClientRect().top+scrollY+(work.offsetHeight-innerHeight)*(.34+.66*p));
 }, progress);
 await page.waitForTimeout(1600);
}
async function snapshot() {
 return page.locator('.work-stage > canvas:not(.cloud-passage)').evaluate(canvas => {
  const {width, height} = canvas;
  return {width, height, pixels: Array.from(canvas.getContext('2d').getImageData(0,0,width,height).data)};
 });
}
function change(first, second, region) {
 let changed = 0, ink = 0, count = 0;
 for (let y = Math.floor(region[1]*first.height); y < region[3]*first.height; y+=2) {
  for (let x = Math.floor(region[0]*first.width); x < region[2]*first.width; x+=2) {
   const offset = (y*first.width+x)*4;
   if (Math.abs(first.pixels[offset]-second.pixels[offset]) > 20) changed++;
   if (first.pixels[offset] < 100) ink++;
   count++;
  }
 }
 return {changed: changed/count, ink: ink/count};
}

try {
 await page.goto('http://127.0.0.1:5173/', {waitUntil: 'networkidle'});
 await at(.22);
 await page.screenshot({path: `${output}/desktop.png`});
 const before = await snapshot();
 await page.waitForTimeout(2600);
 const after = await snapshot();
 for (const [name, area] of [
  ['grazing deer', [0,.65,.53,.94]],
  ['branch in wind', [.64,0,1,.35]],
  ['flying birds', [0,.10,.60,.36]],
 ]) {
  const stats = change(before, after, area);
  assert(stats.ink > .001, `${name} is missing`);
  assert(stats.changed > .001, `${name} is not moving while scroll is stationary`);
  results.push({name, ...stats});
 }
 const start = await page.locator('.work-card').first().boundingBox();
 await at(.4);
 const finish = await page.locator('.work-card').first().boundingBox();
 assert(finish.x < start.x && finish.y < start.y, 'Diagonal carousel motion changed');
 await page.screenshot({path: `${output}/carousel.png`});
 for (const p of [.57,.74,.93]) {await at(p); await page.waitForTimeout(350);}
 const video = page.video();
 await page.screenshot({path: `${output}/end.png`});
 await page.close(); await context.close();
 await video.saveAs(`${output}/carousel-motion.webm`);

 const mobile = await browser.newPage({viewport: {width: 390, height: 844}, deviceScaleFactor: 2});
 mobile.on('pageerror', error => errors.push(error.message));
 await mobile.goto('http://127.0.0.1:5173/', {waitUntil: 'networkidle'});
 for (const width of [320,390,700]) {
  await mobile.setViewportSize({width, height: 844});
  await mobile.evaluate(() => {
   const work = document.querySelector('#work');
   scrollTo(0, work.getBoundingClientRect().top+scrollY+(work.offsetHeight-innerHeight)*(.34+.66*.25));
  });
  await mobile.waitForTimeout(1800);
  assert(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow at ${width}px`);
  await mobile.screenshot({path: `${output}/mobile-${width}.png`});
 }
 await mobile.close();

 const still = await browser.newPage({viewport: {width: 1440, height: 900}, reducedMotion: 'reduce'});
 await still.goto('http://127.0.0.1:5173/', {waitUntil: 'networkidle'});
 await still.evaluate(() => {
  const work = document.querySelector('#work');
  scrollTo(0, work.getBoundingClientRect().top+scrollY+(work.offsetHeight-innerHeight)*(.34+.66*.25));
 });
 await still.waitForTimeout(2000);
 const first = await still.locator('.work-stage > canvas:not(.cloud-passage)').evaluate(c => c.toDataURL());
 await still.waitForTimeout(1200);
 const second = await still.locator('.work-stage > canvas:not(.cloud-passage)').evaluate(c => c.toDataURL());
 assert.equal(first, second, 'Reduced motion backdrop keeps animating');
 await still.screenshot({path: `${output}/reduced-motion.png`});
 await still.close();
 assert.deepEqual(errors, [], 'Browser errors');
 await writeFile(`${output}/results.json`, JSON.stringify({motion: results, diagonalCarousel: true, mobileWidths: [320,390,700], reducedMotion: true, browserErrors: errors}, null, 2));
 console.log('Background QA passed', results);
} finally {
 await browser.close();
}
