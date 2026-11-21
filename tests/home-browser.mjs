import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';

const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:5173/';
const browser = await chromium.launch({executablePath:process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const checks = [], errors = [];
const check = text => { checks.push(text); console.log('PASS', text); };
const frame = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
const watch = page => {
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if(m.type() === 'error') errors.push(m.text()); });
};
await mkdir('test-results/home', {recursive:true});
try {
  const page = await browser.newPage({viewport:{width:1440,height:960}, reducedMotion:'no-preference'}); watch(page);
  await page.goto(base); await page.locator('#home-art[data-render="ready"]').waitFor(); await frame(page);
  assert.equal(new URL(page.url()).hash, '');
  assert.deepEqual(await page.locator('button:visible').allTextContents(), ['Lessons ', 'Zoom In ']);
  assert.equal(await page.locator('#app').evaluate(el => el.inert), true);
  assert.equal(await page.locator('#viewer').isVisible(), false);
  await page.waitForFunction(() => Number(document.querySelector('#home-art').dataset.rotation) > .03);
  await page.screenshot({path:'test-results/home/desktop.png'});
  await page.keyboard.press('ArrowRight'); assert.equal(new URL(page.url()).hash, '');
  await page.locator('#home-art canvas').focus(); await page.keyboard.press('Space');
  await page.locator('#home-art[data-motion="still"]').waitFor();
  const paused = await page.locator('#home-art').getAttribute('data-rotation');
  await page.waitForTimeout(180); assert.equal(await page.locator('#home-art').getAttribute('data-rotation'), paused);
  await page.keyboard.press('Space'); await page.locator('#home-art[data-motion="animated"]').waitFor();
  check('Home has a moving 3D helix and exactly two visible buttons; explorer controls stay hidden and inert');

  await page.locator('#home-lessons').click(); await page.locator('#lesson-dialog[open]').waitFor();
  assert.equal(await page.locator('.lesson-card').count(), 7);
  const still = await page.locator('#home-art').getAttribute('data-rotation');
  await page.waitForTimeout(180); assert.equal(await page.locator('#home-art').getAttribute('data-rotation'), still);
  await page.keyboard.press('Escape'); assert.equal(await page.locator('#home-page').isVisible(), true);
  await page.locator('#home-lessons').click(); await page.locator('[data-lesson="membranes"]').click();
  await page.locator('#lesson-panel').waitFor();
  assert.equal(await page.locator('#home-page').isHidden(), true);
  assert.equal(await page.locator('#scene').getAttribute('data-model'), 'membrane');
  assert.match(page.url(), /lesson=membranes/);
  await page.locator('#lesson-next').click(); await page.locator('[data-answer="down"]').click();
  const answer = await page.evaluate(() => JSON.parse(localStorage.getItem('biology-zoomout-lessons-v1')).lessons.membranes.answers.predict.choice);
  assert.equal(answer, 'down');
  await page.goBack(); await page.locator('#home-page').waitFor();
  await page.locator('#home-lessons').click(); await page.locator('[data-lesson="membranes"]').click();
  assert.equal(await page.locator('#lesson-counter').textContent(), '2 / 6');
  await page.locator('#home').click(); await page.locator('#home-page').waitFor();
  check('Lessons opens the library, starts and resumes saved practice, and browser Back or the brand returns home');

  await page.locator('#home-explore').click(); await page.locator('#scene[data-model="dna"]').waitFor();
  assert.equal(await page.locator('#app').evaluate(el => el.inert), false);
  const stopped = await page.locator('#home-art').getAttribute('data-rotation');
  await page.waitForTimeout(180); assert.equal(await page.locator('#home-art').getAttribute('data-rotation'), stopped);
  await page.locator('#zoom-out').click(); await page.locator('#scene[data-model="chromatin"]').waitFor();
  await page.goBack(); await page.locator('#home-page').waitFor();
  await page.goForward(); await page.locator('#scene[data-model="chromatin"]').waitFor();
  await page.reload(); await page.locator('#scene[data-model="chromatin"]').waitFor();
  assert.equal(await page.locator('#home-page').isHidden(), true);
  await page.goto(`${base}#lesson=gradient&step=2`); await page.locator('#lesson-panel').waitFor();
  assert.equal(await page.locator('#scene').getAttribute('data-model'), 'mitochondrion');
  assert.equal(await page.locator('#home-page').isHidden(), true);
  check('Zoom In enters the DNA pathway, stops the hidden hero renderer, and keeps deep links and browser history working');
  await page.close();

  const mobile = await browser.newPage({viewport:{width:390,height:844}, isMobile:true, hasTouch:true, reducedMotion:'reduce'}); watch(mobile);
  await mobile.goto(base); await mobile.locator('#home-art[data-motion="still"]').waitFor();
  const rotation = await mobile.locator('#home-art').getAttribute('data-rotation');
  await mobile.waitForTimeout(200); assert.equal(await mobile.locator('#home-art').getAttribute('data-rotation'), rotation);
  for (const size of [{width:390,height:844},{width:320,height:568},{width:844,height:390}]) {
    await mobile.setViewportSize(size); await frame(mobile);
    assert.equal(await mobile.evaluate(() => {
      const title = document.querySelector('#home-title').getBoundingClientRect();
      const actions = document.querySelector('.home-actions').getBoundingClientRect();
      return document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight && title.left >= 0 && title.right <= innerWidth && actions.bottom <= innerHeight;
    }), true);
    await mobile.screenshot({path:`test-results/home/${size.width}x${size.height}.png`});
  }
  await mobile.setViewportSize({width:390,height:844});
  await mobile.locator('#home-lessons').tap(); await mobile.locator('.lesson-card').first().tap();
  await mobile.locator('#lesson-panel').waitFor();
  assert.equal(await mobile.locator('#home-page').isHidden(), true);
  await mobile.close();
  check('Phone and landscape layouts fit; reduced motion stops automatic rotation and touch navigation opens lessons');

  const fallback = await browser.newPage({reducedMotion:'reduce'});
  await fallback.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) { return String(type).includes('webgl') ? null : original.call(this, type, ...args); };
  });
  await fallback.goto(base); await fallback.locator('#home-art[data-render="unavailable"]').waitFor();
  assert.equal(await fallback.locator('.home-fallback').isVisible(), true);
  await fallback.locator('#home-lessons').click(); await fallback.locator('.lesson-card').first().click();
  await fallback.locator('#lesson-panel').waitFor();
  await fallback.locator('#home').click(); await fallback.locator('#home-explore').click();
  await fallback.locator('#nodes-toggle').click(); await fallback.locator('#all-scope').click();
  assert.equal(await fallback.locator('.node-card').count(), 234);
  await fallback.close();
  check('Without WebGL, home retains both actions and all curriculum nodes remain usable');
  assert.deepEqual(errors, []); check('No application or WebGL errors');
  await writeFile('test-results/home/report.json', JSON.stringify({checks,errors}, null, 2));
} finally { await browser.close(); }
