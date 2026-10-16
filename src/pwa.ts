import { useSyncExternalStore } from 'react';

interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
interface PwaState {
  prompt: InstallPrompt | null;
  standalone: boolean;
  waiting: ServiceWorker | null;
  busy: boolean;
  feedback: string;
}
let state: PwaState = { prompt: null, standalone: false, waiting: null, busy: false, feedback: '' };
const listeners = new Set<() => void>();
const update = (patch: Partial<PwaState>) => {
  state = { ...state, ...patch };
  listeners.forEach((fn) => fn());
};
export const usePwa = () =>
  useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    () => state,
  );
let started = false;
let reloadRequested = false;
export function startPwa() {
  if (started) return;
  started = true;
  const display = window.matchMedia('(display-mode: standalone)');
  const checkDisplay = () =>
    update({
      standalone:
        display.matches || !!(navigator as Navigator & { standalone?: boolean }).standalone,
    });
  checkDisplay();
  display.addEventListener('change', checkDisplay);
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    update({ prompt: e as InstallPrompt, feedback: '' });
  });
  window.addEventListener('appinstalled', () =>
    update({
      prompt: null,
      standalone: true,
      feedback: 'Date-Plan sudah terpasang. Buka dari layar utama, ya.',
    }),
  );
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  let previousController = navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    const controller = navigator.serviceWorker.controller;
    if (reloadRequested) window.location.reload();
    else if (previousController && controller && controller !== previousController)
      update({ waiting: controller }); // Another tab activated it; preserve this tab's draft.
    previousController = controller;
  });
  void navigator.serviceWorker
    .register(`${import.meta.env.BASE_URL}sw.js`, {
      scope: import.meta.env.BASE_URL,
      updateViaCache: 'none',
    })
    .then((registration) => {
      const checkWaiting = () => {
        if (registration.waiting && navigator.serviceWorker.controller)
          update({ waiting: registration.waiting });
      };
      checkWaiting();
      registration.addEventListener('updatefound', () => {
        registration.installing?.addEventListener('statechange', checkWaiting);
      });
      let checkedAt = Date.now();
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && Date.now() - checkedAt > 60000) {
          checkedAt = Date.now();
          void registration.update().catch(() => {});
        }
      });
    })
    .catch(() => {
      // Browser/storage restrictions must never block authentication or planning.
    });
}
export async function installApp() {
  const prompt = state.prompt;
  if (!prompt || state.busy) return;
  update({ prompt: null, busy: true, feedback: '' });
  try {
    await prompt.prompt();
    const choice = await prompt.userChoice;
    update({
      feedback:
        choice.outcome === 'accepted'
          ? 'Pemasangan disetujui. Ikuti proses browser, lalu cari Date-Plan di layar utama.'
          : 'Pemasangan dibatalkan. Kamu tetap bisa memakai Date-Plan di browser.',
    });
  } catch {
    update({
      feedback: 'Pemasangan belum bisa dibuka. Gunakan menu browser untuk memasang aplikasi.',
    });
  } finally {
    update({ busy: false });
  }
}
export function activateUpdate() {
  if (!state.waiting) return;
  // An already-active worker will not send a second controllerchange event.
  if (state.waiting.state !== 'installed') {
    window.location.reload();
    return;
  }
  reloadRequested = true;
  state.waiting.postMessage({ type: 'ACTIVATE_UPDATE' });
}
