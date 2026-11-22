import {showLessonDiagram,showLessonPart} from './ui-helpers.mjs';
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
const open = async (page, hash='') => { await page.goto(base + hash); if(!hash){await page.locator('#home-explore').click();await page.locator('[data-start-molecule="water"]').click();} await page.locator('#install-toggle').waitFor(); await page.waitForLoadState('networkidle'); await frame(page); };
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
  await page.goto(base+'#lessons');await page.locator('#lesson-dashboard').waitFor();
  assert.equal(await page.locator('.unit-card').count(),8);
  await page.locator('[data-course-unit="8"]').click();await page.reload();
  await page.locator('#lesson-unit-heading').waitFor();assert.equal(await page.locator('.topic-lesson').count(),7);
  await page.locator('#lesson-search').fill('replication');await page.locator('[data-lesson="topic-6-2"]').click();
  assert.equal(await page.locator('#lesson-content').isVisible(),true);assert.equal(await page.locator('#lesson-live').isHidden(),true);
  check('The lesson dashboard, unit deep links, search, and focused reading view work offline');
  await page.locator('#lesson-catalog-button').click();await page.locator('#dashboard-explore').click();await page.locator('#explore-start').waitFor();
  await page.reload();await page.locator('#explore-start').waitFor();assert.equal(await page.locator('#viewer').isHidden(),true);
  await page.locator('#start-family').selectOption('lipids');await page.locator('[data-start-molecule="oleic-acid"]').click();await page.locator('#scene[data-model="molecules"]').waitFor();assert.match(page.url(),/molecule=oleic-acid/);
  check('The starting-point chooser and selected molecular route work offline');

  await open(page,'#practice&type=mcq&item=ap-3-1');await page.locator('#practice-prompt').waitFor();
  assert.equal(await page.locator('.practice-mcq-stimulus table').count(),1);
  await page.locator('input[value="o0"]').check();await page.locator('#practice-submit').click();assert.match(await page.locator('.practice-feedback').innerText(),/Correct/);
  await open(page,'#practice&type=frq&item=frq-unit-5');await page.locator('[data-frq-part="0"]').fill('Eight DNA molecules after replication.');await page.reload();await page.locator('[data-frq-part="0"]').waitFor();assert.match(await page.locator('[data-frq-part="0"]').inputValue(),/Eight/);
  await page.locator('#practice-submit').click();assert.equal(await page.locator('#frq-criteria-title').isVisible(),true);
  for(const [path,model] of [['dna','nucleosome'],['dna','chromatin'],['renewal','mitotic-cell'],['germline','meiotic-cell']]){
    await open(page,`#path=${path}&organism=animal&at=${model}`);assert.equal(await page.locator('#scene').getAttribute('data-model'),model);
    await page.locator('#process-range').evaluate(el=>{el.value='1';el.dispatchEvent(new Event('input',{bubbles:true}));});await frame(page);assert.equal(await page.locator('#process-panel').isVisible(),true);
  }
  check('Stimulus MCQs, FRQ drafts and rubrics, chromatin and division pathways work offline');
  for (const model of ['animal-cell', 'ecosystem', 'biosphere']) {
    await open(page, `#path=dna&organism=animal&at=${model}`);
    assert.equal(await page.locator('#scene').getAttribute('data-model'), model);
    assert.equal(await page.locator('#scene canvas').count(), 1);
    assert.equal(await page.locator('.webgl-fallback').count(), 0);
  }
  await open(page, '#lesson=gradient&step=2');
  await showLessonDiagram(page);await page.locator('[data-lesson-at="0.75"]').click();
  assert.match(await page.locator('#lesson-cue-text').textContent(), /ADP and phosphate/);
  assert.equal(await page.evaluate(async () => (await (await fetch('/data/ontology.json')).json()).nodes.length), 234);
  for (const [id, condition, expected] of [['replication','ligase-off',/5 unsealed/],['translation','stop',/Met–Ala/],['polypeptide','blocked',/3 residues/]]) {
    await open(page, `#lesson=${id}&step=0`);
    await showLessonPart(page,'experiment');
    await page.locator('#experiment-condition').selectOption(condition);
    await page.locator('#experiment-prediction').fill('This blocked step will change the product.');
    await page.locator('#experiment-run').click();
    assert.match(await page.locator('#experiment-status').textContent(), expected);
    assert.equal(await page.locator('#scene canvas').count(), 1);
  }
  await page.reload(); await showLessonPart(page,'experiment');
  assert.equal(await page.locator('#experiment-prediction').inputValue(), 'This blocked step will change the product.');
  assert.equal(await page.locator('.experiment-results tbody tr').count(), 1);
  check('Replication, translation, and peptide experiments run offline and preserve predictions and results');

  for (const id of ['topic-1-1','topic-2-2','topic-3-1','topic-4-5','topic-5-1','topic-6-3','topic-7-9','topic-8-4']) {
    await open(page, `#lesson=${id}&step=0`);
    assert.equal(await page.locator('#scene').getAttribute('data-model'), 'lesson-lab');
    await showLessonPart(page,'experiment');
    await page.locator('#experiment-prediction').fill('Compare the result with the stated mechanism.');
    await page.locator('#experiment-run').click();
    await page.waitForFunction(() => document.querySelector('#experiment-status').textContent.startsWith('Run complete'));
    assert.equal(await page.locator('.experiment-results tbody tr').count(), 1);
    if(id==='topic-4-5'||id==='topic-5-1'){
      assert.equal(await page.locator('#lesson-stage-nav').isVisible(),true);
      assert.equal(await page.locator('#lesson-stage-select option').count(),id==='topic-4-5'?9:13);
      assert.match(await page.locator('#experiment-status').textContent(),id==='topic-4-5'?/Chromosomes per cell: 4 \/ 4/:/Chromosomes per cell: 2 \/ 2 \/ 2 \/ 2/);
    }
  }
  const coverage = await page.evaluate(async () => (await fetch('/data/lesson-coverage.json')).json());
  assert.equal(coverage.lessonCount, 60);
  assert.equal(await page.evaluate(async () => (await (await fetch('/data/lesson-coverage.csv')).text()).trim().split('\n').length), 61);
  await page.reload(); await showLessonPart(page,'experiment');
  assert.equal(await page.locator('.experiment-results tbody tr').count(), 1);
  check('Previously unvisited topic lessons from all eight units and their coverage tables work offline');
  // Leave the original detailed study open for the existing update-lifecycle check.
  await open(page, '#lesson=polypeptide&step=0');

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
  const nextWorker = context.waitForEvent('serviceworker');
  await page.evaluate(async () => (await navigator.serviceWorker.getRegistration()).update());
  const verifiedWorker = await nextWorker;
  await page.waitForFunction(() => document.querySelector('#app-update').hidden === false, null, {timeout:45000});
  assert.equal((await workerStatus(page)).version, build.version);
  assert.match(page.url(), /lesson=polypeptide/);
  // Activation is asynchronous after the last app client closes. Observe it
  // from the worker so reopening does not race and keep the old worker alive.
  await verifiedWorker.evaluate(() => { self.__testActivation = new Promise(resolve => self.addEventListener('activate', () => resolve(true), {once:true})); });
  await page.close();
  let activationTimeout;
  try { await Promise.race([verifiedWorker.evaluate(() => self.__testActivation),new Promise((_,reject) => { activationTimeout=setTimeout(() => reject(new Error('Waiting update did not activate after app closure')),15000); })]); }
  finally { clearTimeout(activationTimeout); }
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
