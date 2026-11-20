import './install-app.css';

// Listen before model data is fetched; Chromium can offer installation during boot.
let installPrompt = null;
let installed = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
let render = () => {};
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault(); installPrompt = event; render();
});
window.addEventListener('appinstalled', () => {
  installed = true; installPrompt = null; render();
});
matchMedia('(display-mode: standalone)').addEventListener('change', event => {
  if (event.matches) installed = true;
  render();
});

function askWorker(worker, type) {
  return new Promise((resolve, reject) => {
    const channel = new MessageChannel();
    const finish = () => { clearTimeout(timer); channel.port1.close(); };
    const timer = setTimeout(() => { finish(); reject(new Error('Offline download did not respond.')); }, type === 'REPAIR_OFFLINE' ? 120000 : 10000);
    channel.port1.onmessage = event => { finish(); resolve(event.data); };
    try { worker.postMessage({type}, [channel.port2]); }
    catch (error) { finish(); reject(error); }
  });
}

export function mountInstallUI() {
  const download = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12m-4-4 4 4 4-4M5 16v4h14v-4"/></svg>';
  const toolbar = document.querySelector('.top-actions');
  toolbar.insertAdjacentHTML('beforeend', `<button id="install-toggle" aria-label="Install app" title="Install app" aria-haspopup="dialog" aria-controls="install-dialog">${download}<span>Install app</span><i hidden></i></button>`);
  document.body.insertAdjacentHTML('beforeend', `
    <dialog id="install-dialog" aria-labelledby="install-title">
      <div class="dialog-toolbar"><h2 id="install-title">Biology Zoomout</h2><button id="install-close" class="icon-button" aria-label="Close app installation"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6"/></svg></button></div>
      <div class="install-body">
        <img class="install-mark" src="/icons/app-192.png" width="64" height="64" alt="">
        <p class="install-intro">Keep the models and lessons on this device. Open them in their own app window, even offline.</p>
        <button id="install-confirm" hidden>Install app ${download}</button>
        <p id="install-guidance"></p>
        <p id="install-feedback" role="status" hidden></p>
        <div class="offline-state" aria-live="polite" aria-atomic="true"><span class="offline-dot" aria-hidden="true"></span><div><strong id="offline-title"></strong><p id="offline-detail"></p></div></div>
        <button id="offline-retry" hidden>Try download again ↗</button>
        <p id="app-update" hidden>An update is saved. Close all Biology Zoomout tabs and app windows, then reopen to use it. Your lesson progress stays saved.</p>
        <p class="install-footnote">Lesson progress is stored on this device. Clearing app or site data removes it. External references need an internet connection.</p>
      </div>
    </dialog>`);
  const $ = selector => document.querySelector(selector);
  const dialog = $('#install-dialog');
  let registration = null, offline = 'saving', bytes = 0, downloading = false, updateFailed = false, prompting = false;
  const capable = 'serviceWorker' in navigator && window.isSecureContext;
  const development = import.meta.env.DEV;
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const safari = /Safari/.test(navigator.userAgent) && !/Chrome|Chromium|CriOS|Edg|OPR|FxiOS/.test(navigator.userAgent);

  const feedback = text => { $('#install-feedback').textContent = text; $('#install-feedback').hidden = !text; };
  render = () => {
    const label = installed ? 'App' : 'Install app';
    $('#install-toggle span').textContent = label;
    $('#install-toggle').setAttribute('aria-label', installed ? 'App and offline status' : label);
    $('#install-toggle').title = installed ? 'App and offline status' : label;
    $('#install-toggle i').hidden = !registration?.waiting;
    $('#install-confirm').hidden = !installPrompt || installed || development;
    $('#install-confirm').disabled = prompting;
    $('#install-guidance').hidden = !!installPrompt && !installed && !development;
    $('#install-guidance').textContent = development
      ? 'Installation is available in the built preview at http://127.0.0.1:5173/.'
      : installed ? 'Installed. Open Biology Zoomout from your apps whenever you want to return.'
      : !window.isSecureContext ? 'Open the secure HTTPS version of this site to install the app.'
      : ios ? 'In Safari, tap Share, then Add to Home Screen to install Biology Zoomout.'
      : safari ? 'In Safari, choose File → Add to Dock to install Biology Zoomout.'
      : 'In a regular Edge or Chrome window, use the install icon in the address bar or the browser’s app menu. If already installed, open Biology Zoomout from your apps.';
    if (installed) feedback('');
    const ready = offline === 'ready';
    const mb = bytes ? ` · ${(bytes / 1024 / 1024).toFixed(1)} MB` : '';
    const labels = {
      saving: ['Saving for offline use', 'Downloading the complete model library and lessons. You can keep exploring.'],
      ready: [navigator.onLine ? 'Ready offline' : 'You’re offline · ready to explore', `All 3D models, reactions, AP nodes and lessons are saved${mb}.`],
      error: ['Offline download incomplete', 'Reconnect and try again to save every model and lesson.'],
      unsupported: ['Offline storage unavailable', 'You can explore online. Use a regular browser window with site storage enabled to save the app.'],
      development: ['Development preview', 'The built preview includes installation and offline downloads.'],
    };
    const [title, detail] = labels[offline];
    $('#offline-title').textContent = title;
    $('#offline-detail').textContent = updateFailed && ready ? 'Your saved version still works offline. The latest update could not download; try again when connected.' : detail;
    $('.offline-state').dataset.state = offline;
    $('#offline-retry').hidden = downloading || !(offline === 'error' || updateFailed);
    $('#app-update').hidden = !registration?.waiting;
  };

  async function checkOffline() {
    if (!registration?.active) return;
    try {
      const status = await askWorker(registration.active, 'OFFLINE_STATUS');
      offline = status.ready ? 'ready' : 'error'; bytes = status.bytes || 0;
    } catch { offline = 'error'; }
    render();
  }
  const observed = new WeakSet();
  function watchWorker(worker) {
    if (!worker || observed.has(worker)) return;
    observed.add(worker);
    worker.addEventListener('statechange', () => {
      if (worker.state === 'activated') { downloading = false; void checkOffline(); }
      else if (worker.state === 'installed') { downloading = false; render(); }
      else if (worker.state === 'redundant') {
        downloading = false;
        if (registration?.active) { updateFailed = true; void checkOffline(); }
        else { offline = 'error'; render(); }
      }
    });
  }
  async function startOffline() {
    if (development || !capable) { offline = development ? 'development' : 'unsupported'; render(); return; }
    downloading = true; updateFailed = false;
    if (offline !== 'ready') offline = 'saving';
    render();
    try {
      registration = await navigator.serviceWorker.register('/sw.js', {scope: '/', updateViaCache: 'none'});
      registration.onupdatefound = () => watchWorker(registration.installing);
      watchWorker(registration.installing);
      if (registration.active) { downloading = false; await checkOffline(); }
      else if (!registration.installing && !registration.waiting) { downloading = false; offline = 'error'; }
    } catch { downloading = false; offline = 'error'; }
    render();
  }

  $('#install-toggle').onclick = () => { dialog.showModal(); void checkOffline(); };
  $('#install-close').onclick = () => dialog.close();
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  $('#install-confirm').onclick = async () => {
    if (!installPrompt || prompting) return;
    const prompt = installPrompt;
    prompting = true;
    feedback(''); render();
    try {
      // Keep prompt() inside the user's click gesture, before any asynchronous work.
      await prompt.prompt();
      const {outcome} = await prompt.userChoice;
      feedback(outcome === 'accepted' ? 'Finish installation in your browser.' : 'Installation dismissed. You can still explore here.');
    } catch { feedback('Use your browser’s install menu to try again.'); }
    finally { installPrompt = null; prompting = false; render(); }
  };
  $('#offline-retry').onclick = async () => {
    if (downloading) return;
    if (!registration?.active) { await startOffline(); return; }
    downloading = true; offline = 'saving'; render();
    try {
      const status = await askWorker(registration.active, 'REPAIR_OFFLINE');
      offline = status.ready ? 'ready' : 'error'; bytes = status.bytes || 0;
      await registration.update(); updateFailed = false;
    } catch { updateFailed = true; await checkOffline(); }
    finally { downloading = false; render(); }
  };
  navigator.serviceWorker?.addEventListener('controllerchange', () => void checkOffline());
  window.addEventListener('offline', render);
  window.addEventListener('online', () => {
    render();
    if (registration) registration.update().catch(() => {});
  });
  render();
  void startOffline();
}
