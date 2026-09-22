import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from '@/sidepanel/App';
import { MessageBus } from '@/core/events/message-bus';
import { WhatsAppLifecycleManager } from './whatsapp/lifecycle';
import { ConnectionState } from '@/types/whatsapp';
import '@/ui/theme/index.css';

console.log('[OpenMsg Content Script] Initializing in Isolated World...');

export type UIMode = 'FULL' | 'SPLIT' | 'MINIMIZED';

let rootInstance: ReactDOM.Root | null = null;
let currentUIMode: UIMode =
  typeof window !== 'undefined' && window.location.search.includes('openmsg')
    ? 'FULL'
    : 'MINIMIZED';
let isUserDismissed = false;

/**
 * Creates or retrieves the single OpenMsg root container.
 * Guaranteed: Exactly one <div id="openmsg-root"> in the DOM.
 */
function getOrCreateRootElement(): HTMLElement {
  let rootEl = document.getElementById('openmsg-root');
  if (!rootEl) {
    rootEl = document.createElement('div');
    rootEl.id = 'openmsg-root';
    rootEl.style.zIndex = '99999';
    document.body.appendChild(rootEl);
  }
  return rootEl;
}

/**
 * Creates or retrieves the floating restore button for when OpenMsg is minimized or idle.
 */
function getOrCreateFloatingRestoreButton(): HTMLElement {
  let btn = document.getElementById('openmsg-floating-launcher');
  if (!btn) {
    btn = document.createElement('div');
    btn.id = 'openmsg-floating-launcher';
    btn.setAttribute('role', 'button');
    btn.setAttribute('tabindex', '0');
    btn.setAttribute('aria-label', 'Open OpenMsg CRM');
    btn.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;padding:10px 18px;background:#09090b;color:#10b981;border:1.5px solid #10b98188;border-radius:9999px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;font-weight:700;box-shadow:0 12px 30px rgba(0,0,0,0.6),0 0 15px rgba(16,185,129,0.25);cursor:pointer;transition:all 0.2s cubic-bezier(0.16,1,0.3,1);user-select:none;">
        <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#10b981;box-shadow:0 0 10px #10b981;"></span>
        <span style="letter-spacing:0.3px;">OpenMsg CRM</span>
        <span style="font-size:10px;background:#18181b;padding:2px 6px;border-radius:6px;color:#a1a1aa;font-family:monospace;">v0.1.0</span>
      </div>
    `;
    btn.style.position = 'fixed';
    btn.style.bottom = '24px';
    btn.style.right = '24px';
    btn.style.zIndex = '99998';
    btn.style.cursor = 'pointer';
    btn.style.display = 'block';

    btn.addEventListener('mouseenter', () => {
      btn!.style.transform = 'translateY(-2px) scale(1.03)';
    });
    btn.addEventListener('mouseleave', () => {
      btn!.style.transform = 'translateY(0) scale(1)';
    });

    btn.addEventListener('click', () => {
      isUserDismissed = false;
      mountReactApp();
      applyUIMode('FULL');
    });

    document.body.appendChild(btn);
  }
  return btn;
}

/**
 * Creates or retrieves the non-blocking status banner shown on the QR screen.
 */
function getOrCreateQrStatusBanner(): HTMLElement {
  let banner = document.getElementById('openmsg-qr-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'openmsg-qr-banner';
    banner.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;padding:8px 16px;background:rgba(9,9,11,0.92);backdrop-filter:blur(8px);color:#e4e4e7;border:1px solid #27272a;border-radius:12px;font-family:sans-serif;font-size:12px;box-shadow:0 8px 30px rgba(0,0,0,0.4);">
        <img src="${chrome.runtime.getURL('icons/icon-32.png')}" style="width:18px;height:18px;border-radius:4px;" alt="OpenMsg" />
        <span style="color:#a1a1aa;">Waiting for WhatsApp Web...</span>
        <span style="color:#34d399;font-weight:600;">Please scan the QR code to continue</span>
      </div>
    `;
    banner.style.position = 'fixed';
    banner.style.top = '16px';
    banner.style.left = '50%';
    banner.style.transform = 'translateX(-50%)';
    banner.style.zIndex = '99997';
    banner.style.display = 'none';
    document.body.appendChild(banner);
  }
  return banner;
}

/**
 * Apply layout changes based on UI mode (FULL, SPLIT, MINIMIZED)
 */
export function applyUIMode(mode: UIMode) {
  currentUIMode = mode;
  const rootEl = getOrCreateRootElement();
  const floatingBtn = getOrCreateFloatingRestoreButton();
  const qrBanner = getOrCreateQrStatusBanner();
  const waApp = document.getElementById('app');

  const lifecycle = WhatsAppLifecycleManager.getInstance();
  const state = lifecycle.getState();

  // If WhatsApp is currently requiring login (QR code screen), do not cover it
  if (state === 'LOGIN_REQUIRED') {
    rootEl.style.display = 'none';
    qrBanner.style.display = 'block';
    floatingBtn.style.display = 'none';
    if (waApp) {
      waApp.style.display = 'block';
      waApp.style.width = '100%';
      waApp.style.marginTop = '';
    }
    return;
  }

  // QR banner should only be visible on QR screen
  qrBanner.style.display = 'none';

  if (mode === 'FULL') {
    // Overlay mode: OpenMsg shell floats on top of WhatsApp Web.
    // The .om-root div handles its own fixed positioning (inset:0).
    // We push WhatsApp Web down by the top bar height (50px) so it
    // is visible beneath the OpenMsg top bar.
    floatingBtn.style.display = 'none';
    rootEl.style.display = 'block';
    rootEl.style.position = 'fixed';
    rootEl.style.top = '0';
    rootEl.style.left = '0';
    rootEl.style.width = '100vw';
    rootEl.style.height = '100dvh';
    rootEl.style.pointerEvents = 'none'; // let mouse events pass through to WA
    rootEl.style.zIndex = '2147483646';

    if (waApp) {
      // Push WA down by topbar height so it is visible below our bar
      waApp.style.display = 'block';
      waApp.style.width = '100%';
      waApp.style.marginTop = '50px';
      waApp.style.height = 'calc(100dvh - 50px)';
    }
  } else if (mode === 'SPLIT') {
    floatingBtn.style.display = 'none';
    rootEl.style.display = 'block';
    rootEl.style.position = 'fixed';
    rootEl.style.top = '0';
    rootEl.style.left = '0';
    rootEl.style.width = '100vw';
    rootEl.style.height = '100dvh';
    rootEl.style.pointerEvents = 'none';
    rootEl.style.zIndex = '2147483646';

    if (waApp) {
      waApp.style.display = 'block';
      waApp.style.width = '100%';
      waApp.style.marginTop = '50px';
      waApp.style.height = 'calc(100dvh - 50px)';
    }
  } else {
    // MINIMIZED
    rootEl.style.display = 'none';
    rootEl.style.pointerEvents = 'none';
    floatingBtn.style.display = 'block';

    if (waApp) {
      waApp.style.display = 'block';
      waApp.style.width = '100%';
      waApp.style.marginTop = '';
      waApp.style.height = '';
    }
  }
}

/**
 * Mount the React Application into #openmsg-root idempotently.
 */
function mountReactApp() {
  const rootEl = getOrCreateRootElement();

  if (!rootInstance) {
    rootInstance = ReactDOM.createRoot(rootEl);
    rootInstance.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log('[OpenMsg Content Script] React application mounted.');
  }

  // Set initial layout mode
  applyUIMode(currentUIMode);
}

/**
 * Coordinate with WhatsApp Lifecycle
 */
function initLifecycleObserver() {
  const lifecycle = WhatsAppLifecycleManager.getInstance();
  lifecycle.start();

  lifecycle.onStateChange((state: ConnectionState, prevState: ConnectionState) => {
    console.log(`[OpenMsg Content Script] WhatsApp State: ${prevState} -> ${state}`);

    const qrBanner = getOrCreateQrStatusBanner();

    if (state === 'LOGIN_REQUIRED') {
      qrBanner.style.display = 'block';
      const rootEl = getOrCreateRootElement();
      rootEl.style.display = 'none';
      const waApp = document.getElementById('app');
      if (waApp) {
        waApp.style.display = 'block';
        waApp.style.width = '100%';
        waApp.style.float = 'none';
      }
    } else if (state === 'READY') {
      qrBanner.style.display = 'none';
      if (!isUserDismissed) {
        mountReactApp();
        applyUIMode(currentUIMode);
      }
    } else if (state === 'DISCONNECTED') {
      console.warn('[OpenMsg Content Script] WhatsApp is disconnected.');
    }
  });

  // Always ensure the floating restore button is available on WhatsApp Web
  getOrCreateFloatingRestoreButton();

  // If WhatsApp is already ready on script load, mount immediately
  if (lifecycle.isReady()) {
    mountReactApp();
  }
}

// ── Event Handlers & Message Listeners ────────────────────────────────────────

// Listen for messages from the Main World Bridge
window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  if (event.data?.source === 'wacrm-main' && event.data?.event === 'ready') {
    const isReady = Boolean(event.data?.data?.ready || event.data?.data?.status?.ready || event.data?.data?.status?.fullReady);
    if (isReady) {
      MessageBus.send({
        type: 'WHATSAPP_STATUS_RESPONSE',
        payload: { ready: true },
      }).catch(() => {});
    }
  }
});

// Listen for messages from Extension Runtime (Background)
MessageBus.onMessage((msg, _sender, sendResponse) => {
  if (msg.type === 'PING' || msg.type === 'PING_OPENMSG') {
    const lifecycle = WhatsAppLifecycleManager.getInstance();
    sendResponse({
      type: 'PONG_OPENMSG',
      payload: {
        timestamp: Date.now(),
        context: 'content-script',
        state: lifecycle.getState(),
        uiMode: currentUIMode,
      },
    });
    return true;
  }

  // Extension Action Click Handshake: User clicked the toolbar icon
  if (msg.type === 'OPENMSG_LAUNCH' || msg.type === 'OPENMSG_INIT') {
    console.log('[OpenMsg Content Script] Received OPENMSG_LAUNCH from background.');
    isUserDismissed = false;
    mountReactApp();
    applyUIMode('FULL');
    sendResponse({ success: true, mode: 'FULL' });
    return true;
  }

  if (msg.type === 'TOGGLE_UI' as any) {
    const newMode: UIMode = currentUIMode === 'MINIMIZED' ? 'FULL' : 'MINIMIZED';
    isUserDismissed = newMode === 'MINIMIZED';
    applyUIMode(newMode);
    sendResponse({ success: true, mode: newMode });
    return true;
  }

  return false;
});

// Listen for mode changes and window messages from the React App
window.addEventListener('message', (event) => {
  if (event.data?.type === 'OPENMSG_SET_MODE') {
    const { mode } = event.data.payload;
    if (mode === 'FULL' || mode === 'SPLIT') {
      applyUIMode(mode);
    }
  } else if (event.data?.type === 'OPENMSG_CLOSE_UI') {
    isUserDismissed = true;
    applyUIMode('MINIMIZED');
  }
});

// ── Startup Sequence ─────────────────────────────────────────────────────────
initLifecycleObserver();
