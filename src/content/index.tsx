import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from '@/sidepanel/App'; // We reuse App.tsx for now
import { MessageBus } from '@/core/events/message-bus';
import { OpenMsgBridgeEnvelope } from '@/types/messages';
import '@/ui/theme/index.css';

console.log('[OpenMsg Content Script] Loaded in Isolated World.');

let rootInstance: ReactDOM.Root | null = null;

// Inject Main World Bridge script
function injectBridgeScript(): void {
  if (document.getElementById('openmsg-bridge-script')) return; // Idempotent check
  try {
    const script = document.createElement('script');
    script.id = 'openmsg-bridge-script';
    script.src = chrome.runtime.getURL('injected.js');
    script.type = 'module';
    (document.head || document.documentElement).appendChild(script);
    script.onload = () => script.remove();
    console.log('[OpenMsg Content Script] Bridge script tag appended.');
  } catch (err) {
    console.error('[OpenMsg Content Script] Failed to inject bridge:', err);
  }
}

// Mount React Application
function mountReactApp() {
  if (document.getElementById('openmsg-root')) {
    console.log('[OpenMsg Content Script] Root already exists. Skipping mount.');
    return;
  }

  const rootEl = document.createElement('div');
  rootEl.id = 'openmsg-root';
  rootEl.style.display = 'none'; // Hidden by default until toggled
  rootEl.style.position = 'fixed';
  rootEl.style.top = '0';
  rootEl.style.right = '0';
  rootEl.style.width = '320px';
  rootEl.style.height = '100dvh';
  rootEl.style.zIndex = '10000';
  document.body.appendChild(rootEl);

  rootInstance = ReactDOM.createRoot(rootEl);
  rootInstance.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  
  console.log('[OpenMsg Content Script] React application mounted.');
}

// Ensure WhatsApp DOM is ready before mounting
function waitForWhatsAppReady() {
  // WhatsApp's main container is usually #app
  if (document.getElementById('app')) {
    mountReactApp();
  } else {
    const observer = new MutationObserver((_mutations, obs) => {
      if (document.getElementById('app')) {
        obs.disconnect();
        mountReactApp();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
}

// Listen for messages from the Main World Bridge
MessageBus.onWindowBridge('OPENMSG_BRIDGE_EVENT', (envelope: OpenMsgBridgeEnvelope) => {
  if (envelope.action === 'BRIDGE_MOUNTED') {
    MessageBus.send({
      type: 'WHATSAPP_STATUS_RESPONSE',
      payload: { ready: true },
    }).catch(() => {});
  }
});

// Listen for messages from Extension Runtime (Background)
MessageBus.onMessage((msg, _sender, sendResponse) => {
  if (msg.type === 'PING') {
    sendResponse({ type: 'PONG', payload: { timestamp: Date.now(), context: 'content-script' } });
    return true;
  }
  
  if (msg.type === 'TOGGLE_UI' as any) {
    const rootEl = document.getElementById('openmsg-root');
    if (rootEl) {
      const isHidden = rootEl.style.display === 'none';
      rootEl.style.display = isHidden ? 'block' : 'none';
      
      const waApp = document.getElementById('app');
      if (waApp) {
        if (isHidden) {
          // It was hidden, now opening. Check current mode? Default is SPLIT
          if (rootEl.style.width === '100%') { // FULL mode
            waApp.style.display = 'none';
          } else { // SPLIT mode
            waApp.style.width = 'calc(100% - 320px)';
            waApp.style.float = 'left';
            waApp.style.display = 'block';
          }
        } else {
          // Closing
          waApp.style.width = '100%';
          waApp.style.float = 'none';
          waApp.style.display = 'block';
        }
      }
    }
    sendResponse({ success: true });
    return true;
  }
  
  return false;
});

// Listen for mode changes from the React App
window.addEventListener('message', (event) => {
  if (event.data?.type === 'OPENMSG_SET_MODE') {
    const { mode } = event.data.payload;
    const rootEl = document.getElementById('openmsg-root');
    const waApp = document.getElementById('app');
    
    if (rootEl) {
      if (mode === 'FULL') {
        rootEl.style.width = '100%';
        rootEl.style.position = 'fixed';
        rootEl.style.top = '0';
        rootEl.style.left = '0';
        rootEl.style.height = '100dvh';
        if (waApp) {
          waApp.style.display = 'none';
        }
      } else {
        rootEl.style.width = '320px';
        rootEl.style.position = 'fixed';
        rootEl.style.top = '0';
        rootEl.style.right = '0';
        rootEl.style.height = '100dvh';
        if (waApp) {
          waApp.style.display = 'block';
          waApp.style.width = 'calc(100% - 320px)';
          waApp.style.float = 'left';
        }
      }
    }
  } else if (event.data?.type === 'OPENMSG_CLOSE_UI') {
    const rootEl = document.getElementById('openmsg-root');
    if (rootEl) {
      rootEl.style.display = 'none';
      const waApp = document.getElementById('app');
      if (waApp) {
        waApp.style.width = '100%';
        waApp.style.display = 'block';
        waApp.style.float = 'none';
      }
    }
  }
});

// Boot
injectBridgeScript();
waitForWhatsAppReady();
