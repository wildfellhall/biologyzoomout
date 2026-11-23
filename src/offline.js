// Installation is disabled; browser caching still supports offline lessons.
window.addEventListener('beforeinstallprompt', event => event.preventDefault());

function askWorker(worker, type) {
  return new Promise((resolve, reject) => {
    const channel = new MessageChannel();
    const finish = () => { clearTimeout(timer); channel.port1.close(); };
    const timer = setTimeout(() => { finish(); reject(new Error('Offline cache did not respond.')); }, type === 'REPAIR_OFFLINE' ? 120000 : 10000);
    channel.port1.onmessage = event => { finish(); resolve(event.data); };
    try { worker.postMessage({type}, [channel.port2]); }
    catch (error) { finish(); reject(error); }
  });
}

export function startOfflineCache() {
  if (import.meta.env.DEV || !window.isSecureContext || !('serviceWorker' in navigator)) return;
  let refreshing = false;
  async function refresh() {
    if (refreshing) return;
    refreshing = true;
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {scope:'/', updateViaCache:'none'});
      if (registration.active && navigator.onLine) {
        const status = await askWorker(registration.active, 'OFFLINE_STATUS');
        if (!status.ready) await askWorker(registration.active, 'REPAIR_OFFLINE');
      }
    } catch {
      // Retry on the next connection or page load. A failed update leaves the
      // previously verified release available, without interrupting a lesson.
    } finally { refreshing = false; }
  }
  window.addEventListener('online', refresh);
  void refresh();
}
