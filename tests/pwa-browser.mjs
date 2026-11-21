import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile, mkdir, mkdtemp, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

// Serve a real production build, including worker requests that Playwright page
// routes cannot intercept. Release/asset faults stay in this isolated server.
const root = fileURLToPath(new URL('../', import.meta.url));
const originalWorker = await readFile(path.join(root, 'dist/sw.js'), 'utf8');
const build = JSON.parse(originalWorker.match(/const BUILD = (.+);/)[1]);
let servedWorker = originalWorker, brokenAsset = false;
const brokenPath = '/textures/natural/forest_slope_hdri.hdr';
const mime = {'.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.webmanifest':'application/manifest+json', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg'};
const server = createServer(async (request, response) => {
  const url = new URL(request.url, 'http://localhost');
  response.setHeader('Cache-Control', 'no-store');
  if (url.pathname === '/sw.js') {
    response.setHeader('Content-Type', 'text/javascript'); response.end(servedWorker); return;
  }
  if (brokenAsset && url.pathname === brokenPath) {
    // A misconfigured static host can return HTML with 200 for missing assets.
    response.setHeader('Content-Type', 'text/html'); response.end('<html>Missing model</html>'); return;
  }
  try {
    const relative = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname).slice(1);
    const file = path.resolve(root, 'dist', relative);
    if (!file.startsWith(path.join(root, 'dist') + path.sep)) throw new Error('Bad path');
    response.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    response.end(await readFile(file));
  } catch { response.writeHead(404); response.end('Not found'); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}/`;
const profiles = [], contexts = [];
async function createContext(options) {
  // Incognito browsers deliberately disallow installation. Use disposable,
  // ordinary profiles, never the user's Chrome profile or OS app registry.
  const profile = await mkdtemp(path.join(tmpdir(), 'biology-pwa-')); profiles.push(profile);
  const context = await chromium.launchPersistentContext(profile, {executablePath:process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, args:['--use-angle=swiftshader','--enable-unsafe-swiftshader'], ...options});
  contexts.push(context); return context;
}
const checks = [], errors = [];
const check = text => { checks.push(text); console.log('PASS', text); };
const ready = page => page.waitForFunction(() => document.querySelector('.offline-state')?.dataset.state === 'ready', null, {timeout:45000});
const frame = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
const open = async (page, hash='') => { await page.goto(base + hash); if(!hash)await page.locator('#home-explore').click(); await page.locator('#install-toggle').waitFor(); await page.waitForLoadState('networkidle'); await frame(page); };
const workerStatus = page => page.evaluate(async () => {
  const registration = await navigator.serviceWorker.getRegistration();
  return new Promise(resolve => { const channel = new MessageChannel(); channel.port1.onmessage = event => { channel.port1.close(); resolve(event.data); }; registration.active.postMessage({type:'OFFLINE_STATUS'}, [channel.port2]); });
});
const savedAnswer = page => page.evaluate(() => {
  const answer = JSON.parse(localStorage.getItem('biology-zoomout-lessons-v1')).lessons.membranes.answers.predict;
  return {choice:answer.choice, firstCorrect:answer.firstCorrect, attempts:answer.attempts};
});
await mkdir(path.join(root, 'test-results/pwa'), {recursive:true});
try {
  const context = await createContext({viewport:{width:1440,height:960}, reducedMotion:'reduce'});
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error' && !message.location().url.includes('offline-network-probe')) errors.push(message.text()); });
  await page.addInitScript(() => window.addEventListener('beforeinstallprompt', () => window.__nativeInstallAvailable = true));
  await open(page); await ready(page);
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  const cdp = await context.newCDPSession(page);
  const manifest = await cdp.send('Page.getAppManifest');
  assert.deepEqual(manifest.errors, []);
  assert.equal(JSON.parse(manifest.data).display, 'standalone');
  const installability = await cdp.send('Page.getInstallabilityErrors');
  assert.deepEqual(installability.installabilityErrors, []);
  await page.waitForFunction(() => window.__nativeInstallAvailable === true);
  for (const icon of JSON.parse(manifest.data).icons) {
    const png = await readFile(path.join(root, 'dist', icon.src));
    assert.equal(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`, icon.sizes);
  }
  const saved = await workerStatus(page);
  assert.equal(saved.ready, true); assert.equal(saved.version, build.version); assert.equal(saved.bytes, build.bytes);
  check('Chrome reports no installability errors and emits a real install offer; icons and all offline files are valid');

  await page.locator('#install-toggle').click();
  assert.equal(await page.locator('#install-confirm').isVisible(), true);
  await page.screenshot({path:path.join(root, 'test-results/pwa/install-desktop.png')});
  await page.keyboard.press('Escape');
  await open(page, '#lesson=membranes&step=1');
  await page.locator('[data-answer="down"]').click();
  const lessonProgress = await savedAnswer(page);
  assert.ok(lessonProgress);
  await context.setOffline(true);
  assert.equal(await page.evaluate(() => fetch('/offline-network-probe').then(() => false, () => true)), true);
  await page.reload(); await page.locator('#lesson-panel').waitFor();
  assert.deepEqual(await savedAnswer(page), lessonProgress);
  await page.goto(base); await page.locator('#home-art[data-render="ready"]').waitFor();
  assert.equal(await page.locator('#home-page').isVisible(), true);
  for (const model of ['animal-cell', 'ecosystem', 'biosphere']) {
    await open(page, `#path=dna&organism=animal&at=${model}`);
    assert.equal(await page.locator('#scene').getAttribute('data-model'), model);
    assert.equal(await page.locator('#scene canvas').count(), 1);
    assert.equal(await page.locator('.webgl-fallback').count(), 0);
  }
  await open(page, '#lesson=gradient&step=2');
  await page.locator('[data-lesson-at="0.75"]').click();
  assert.match(await page.locator('#lesson-cue-text').textContent(), /ADP and phosphate/);
  assert.equal(await page.evaluate(async () => (await (await fetch('/data/ontology.json')).json()).nodes.length), 234);
  await page.locator('#install-toggle').click();
  await ready(page);
  assert.match(await page.locator('#offline-title').textContent(), /ready.*offline|offline.*ready/i);
  assert.deepEqual(errors, []);
  check('Offline reload preserves progress; previously unvisited cells, habitats, Earth, reactions and all 234 nodes load without errors');
  await page.keyboard.press('Escape'); await context.setOffline(false);

  // Exercise deferred-prompt UI branches without installing an OS app on the host.
  await page.evaluate(() => {
    window.__promptCalls = 0;
    const event = new Event('beforeinstallprompt', {cancelable:true});
    event.prompt = () => { window.__promptCalls++; return Promise.resolve(); };
    event.userChoice = new Promise(resolve => window.__chooseInstall = resolve);
    dispatchEvent(event);
  });
  await page.locator('#install-toggle').click(); await page.locator('#install-confirm').click();
  assert.equal(await page.locator('#install-confirm').isDisabled(), true);
  assert.equal(await page.evaluate(() => window.__promptCalls), 1);
  await page.evaluate(() => window.__chooseInstall({outcome:'dismissed'}));
  await page.waitForFunction(() => document.querySelector('#install-feedback').textContent.includes('dismissed'));
  assert.equal(await page.locator('#install-confirm').isHidden(), true);
  assert.match(await page.locator('#install-toggle').getAttribute('aria-label'), /Install/);
  await page.evaluate(() => {
    const event = new Event('beforeinstallprompt', {cancelable:true});
    event.prompt = () => Promise.resolve(); event.userChoice = Promise.resolve({outcome:'accepted'}); dispatchEvent(event);
  });
  await page.locator('#install-confirm').click();
  await page.waitForFunction(() => document.querySelector('#install-feedback').textContent.includes('Finish installation'));
  assert.match(await page.locator('#install-toggle').getAttribute('aria-label'), /Install/);
  await page.evaluate(() => dispatchEvent(new Event('appinstalled')));
  assert.equal(await page.locator('#install-toggle').getAttribute('aria-label'), 'App and offline status');
  assert.equal(await page.locator('#install-confirm').isHidden(), true);
  await page.keyboard.press('Escape');
  check('Install UI handles prompt, dismissal, acceptance and confirmed installation without claiming an app was installed early');

  for (const width of [320,390,768]) {
    await page.setViewportSize({width,height:844});
    await page.locator('#install-toggle').click(); await frame(page);
    const fits = await page.evaluate(() => {
      const dialog = document.querySelector('#install-dialog').getBoundingClientRect();
      const brand = document.querySelector('.brand').getBoundingClientRect();
      const actions = document.querySelector('.top-actions').getBoundingClientRect();
      return document.documentElement.scrollWidth <= innerWidth && dialog.left >= 0 && dialog.right <= innerWidth && brand.right < actions.left;
    });
    assert.equal(fits, true, `Layout at ${width}px`);
    if (width === 390) await page.screenshot({path:path.join(root, 'test-results/pwa/install-phone.png')});
    await page.keyboard.press('Escape');
  }
  check('Install dialog and compact header fit tablet and 320–390px phone screens');

  // Reject an incomplete release without losing the currently working cache.
  const appErrorsBeforeFault = errors.length;
  brokenAsset = true; servedWorker = originalWorker.replace(build.version, 'invalid-release');
  await page.evaluate(async () => (await navigator.serviceWorker.getRegistration()).update());
  await page.waitForFunction(() => document.querySelector('#offline-detail').textContent.includes('could not download'), null, {timeout:45000});
  assert.equal((await workerStatus(page)).version, build.version);
  assert.equal(await page.evaluate(() => caches.keys().then(keys => keys.some(key => key.endsWith('invalid-release')))), false);
  assert.deepEqual(await savedAnswer(page), lessonProgress);
  brokenAsset = false; servedWorker = originalWorker.replace(build.version, 'verified-update');
  await page.evaluate(async () => (await navigator.serviceWorker.getRegistration()).update());
  await page.waitForFunction(() => document.querySelector('#app-update').hidden === false, null, {timeout:45000});
  assert.equal((await workerStatus(page)).version, build.version);
  assert.match(page.url(), /lesson=gradient/);
  await page.close();
  const reopened = await context.newPage(); await open(reopened); await ready(reopened);
  assert.equal((await workerStatus(reopened)).version, 'verified-update');
  assert.deepEqual(await savedAnswer(reopened), lessonProgress);
  const keys = await reopened.evaluate(() => caches.keys());
  assert.equal(keys.filter(key => key.startsWith('biology-zoomout:')).length, 1);
  check('Integrity failure keeps the saved release; verified updates wait for app closure and preserve lesson progress');
  await context.close();

  servedWorker = originalWorker; brokenAsset = true;
  const retryContext = await createContext({reducedMotion:'reduce'});
  const retryPage = await retryContext.newPage(); await open(retryPage);
  await retryPage.waitForFunction(() => document.querySelector('.offline-state')?.dataset.state === 'error', null, {timeout:45000});
  await retryPage.locator('#install-toggle').click();
  assert.equal(await retryPage.locator('#offline-retry').isVisible(), true);
  assert.equal(await retryPage.evaluate(() => caches.keys().then(keys => keys.filter(key => key.startsWith('biology-zoomout:')).length)), 0);
  brokenAsset = false; await retryPage.locator('#offline-retry').click(); await ready(retryPage);
  check('An incomplete first download is reported honestly, cleaned up, and can be retried successfully');
  await retryContext.close();
  await writeFile(path.join(root, 'test-results/pwa/report.json'), JSON.stringify({checks, installability, offlineFiles:build.files.length, offlineBytes:build.bytes, applicationErrors:errors.slice(0, appErrorsBeforeFault)}, null, 2));
} finally {
  await Promise.all(contexts.map(context => context.close()));
  await new Promise(resolve => server.close(resolve));
  await Promise.all(profiles.map(profile => rm(profile, {recursive:true, force:true})));
}
