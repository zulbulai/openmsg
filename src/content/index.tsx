/**
 * OpenMsg Ultra-Lightweight Content Script (<15KB)
 * 
 * Runs in the ISOLATED world of WhatsApp Web (web.whatsapp.com).
 * Zero React, zero heavy libraries, zero memory footprint.
 * 
 * Responsibilities:
 * 1. Inject a non-intrusive floating OpenMsg launcher button.
 * 2. Bridge RPC requests between Sidepanel (Extension runtime) and Main World (WPPConnect).
 * 3. Forward real-time bridge events (new messages, status changes) to Extension runtime.
 */

console.log('[OpenMsg Content Script] Ultra-light bridge initializing...');

interface PendingRpcEntry {
  sendResponse: (res: any) => void;
  timer: ReturnType<typeof setTimeout>;
}

const pendingRpcs = new Map<string, PendingRpcEntry>();

// ── 1. Floating Launcher Button ───────────────────────────────────────────────
function injectLauncherButton(): HTMLElement {
  const existing = document.getElementById('openmsg-floating-launcher');
  if (existing) return existing;

  const btn = document.createElement('div');
  btn.id = 'openmsg-floating-launcher';
  btn.setAttribute('role', 'button');
  btn.setAttribute('tabindex', '0');
  btn.setAttribute('aria-label', 'Open OpenMsg CRM Sidepanel');
  btn.innerHTML = `
    <div style="
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 16px;
      background: #111214;
      color: #eceef2;
      border: 1.5px solid #25D366;
      border-radius: 9999px;
      font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 13px;
      font-weight: 700;
      box-shadow: 0 10px 25px rgba(0,0,0,0.6), 0 0 15px rgba(37,211,102,0.25);
      cursor: pointer;
      user-select: none;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    ">
      <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#25D366;box-shadow:0 0 8px #25D366;"></span>
      <span style="letter-spacing:0.3px;color:#fff;">OpenMsg CRM</span>
      <span style="font-size:10px;background:#222428;padding:2px 7px;border-radius:6px;color:#8a92a0;font-family:monospace;">Sidepanel</span>
    </div>
  `;
  btn.style.position = 'fixed';
  btn.style.bottom = '24px';
  btn.style.right = '24px';
  btn.style.zIndex = '99998';
  btn.style.cursor = 'pointer';

  btn.addEventListener('mouseenter', () => {
    btn.style.transform = 'translateY(-2px) scale(1.03)';
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.transform = 'translateY(0) scale(1)';
  });

  btn.addEventListener('click', () => {
    try {
      chrome.runtime.sendMessage({ type: 'OPEN_SIDEPANEL' });
    } catch (e) {
      console.warn('[OpenMsg] Failed to request sidepanel open:', e);
    }
  });

  const appendToBody = () => {
    if (document.body && !document.getElementById('openmsg-floating-launcher')) {
      document.body.appendChild(btn);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', appendToBody);
  } else {
    appendToBody();
  }

  return btn;
}

// ── 2. Listen to Main World Bridge (wacrm-main) ──────────────────────────────
window.addEventListener('message', (event: MessageEvent) => {
  if (event.source !== window) return;
  const data = event.data;
  if (!data || data.source !== 'wacrm-main') return;

  // Case A: RPC Response from Main World
  if (data.id && pendingRpcs.has(data.id)) {
    const entry = pendingRpcs.get(data.id)!;
    pendingRpcs.delete(data.id);
    clearTimeout(entry.timer);

    entry.sendResponse({
      ok: Boolean(data.ok),
      result: data.result,
      error: data.error,
    });
    return;
  }

  // Case B: Asynchronous Events (new message, ready, connection change)
  if (data.event) {
    try {
      chrome.runtime.sendMessage({
        type: 'OPENMSG_BRIDGE_EVENT',
        event: data.event,
        data: data.data,
      }).catch(() => {
        // Suppress errors when no listener is active
      });
    } catch {
      // Extension context invalidated or no receivers
    }
  }
});

// ── 3. Listen to Messages from Extension Runtime (Sidepanel / Background) ────
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((msg: any, _sender, sendResponse) => {
    if (!msg) return false;

    // Handle Ping
    if (msg.type === 'PING' || msg.type === 'PING_OPENMSG') {
      sendResponse({
        type: 'PONG_OPENMSG',
        timestamp: Date.now(),
        context: 'content-script-bridge',
        ready: Boolean(document.getElementById('pane-side') || document.querySelector('[data-testid="chat-list"]')),
      });
      return true;
    }

    // Handle RPC forward from Sidepanel
    if (msg.type === 'OPENMSG_RPC_FORWARD') {
      const { id, method, args } = msg;

      const timeoutMs = 25000;
      const timer = setTimeout(() => {
        if (pendingRpcs.has(id)) {
          pendingRpcs.delete(id);
          sendResponse({
            ok: false,
            error: `WhatsApp Bridge RPC timeout after ${timeoutMs}ms for method: ${method}`,
          });
        }
      }, timeoutMs);

      pendingRpcs.set(id, { sendResponse, timer });

      // Dispatch to main world bridge
      window.postMessage(
        {
          source: 'wacrm-iso',
          id,
          method,
          args: args || [],
        },
        window.location.origin || '*'
      );

      return true; // Keep channel open for async response
    }

    return false;
  });
}

// Initialize floating launcher
injectLauncherButton();
console.log('[OpenMsg Content Script] Ultra-light bridge active.');
