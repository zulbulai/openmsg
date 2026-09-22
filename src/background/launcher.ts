/**
 * OpenMsg Background Tab Launcher
 * Handles extension icon click: detects existing WhatsApp Web tabs,
 * focuses window/tab, prevents duplicate tab creation, or opens a new tab.
 */

export const WHATSAPP_WEB_ORIGIN = 'https://web.whatsapp.com';
export const WHATSAPP_WEB_URL = 'https://web.whatsapp.com/';

/**
 * Safely validate whether a URL belongs strictly to https://web.whatsapp.com
 * Handles subpaths, query strings, hashes, trailing slashes,
 * and rejects fake lookalike origins (e.g. web.whatsapp.com.attacker.com).
 */
export function isWhatsAppWebUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;

  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname === 'web.whatsapp.com';
  } catch {
    return false;
  }
}

/**
 * Find an existing WhatsApp Web tab among all open browser windows.
 */
export async function findExistingWhatsAppTab(): Promise<chrome.tabs.Tab | null> {
  if (typeof chrome === 'undefined' || !chrome.tabs || !chrome.tabs.query) {
    return null;
  }

  try {
    // Query all tabs to handle edge cases across multiple windows
    const allTabs = await chrome.tabs.query({});
    for (const tab of allTabs) {
      const targetUrl = tab.url || tab.pendingUrl;
      if (isWhatsAppWebUrl(targetUrl)) {
        return tab;
      }
    }
  } catch (err) {
    console.error('[OpenMsg Launcher] Failed to query tabs:', err);
  }

  return null;
}

// In-flight mutex lock to prevent opening duplicate tabs during rapid consecutive clicks
let isLaunching = false;
let lastLaunchTime = 0;
const LAUNCH_DEBOUNCE_MS = 600;

/**
 * Main launcher entry point invoked when extension action is clicked.
 */
export async function launchOrFocusWhatsAppWeb(): Promise<{
  action: 'FOCUSED_EXISTING' | 'CREATED_NEW' | 'THROTTLED';
  tabId?: number;
}> {
  const now = Date.now();
  if (isLaunching || now - lastLaunchTime < LAUNCH_DEBOUNCE_MS) {
    console.log('[OpenMsg Launcher] Launch debounced/in-flight, ignoring rapid click.');
    return { action: 'THROTTLED' };
  }

  isLaunching = true;
  lastLaunchTime = now;

  try {
    const existingTab = await findExistingWhatsAppTab();

    if (existingTab && existingTab.id) {
      console.log('[OpenMsg Launcher] Existing WhatsApp Web tab found. Tab ID:', existingTab.id);

      // 1. Focus the window containing the tab
      if (typeof existingTab.windowId === 'number' && chrome.windows?.update) {
        try {
          await chrome.windows.update(existingTab.windowId, { focused: true });
        } catch (winErr) {
          console.warn('[OpenMsg Launcher] Could not focus window:', winErr);
        }
      }

      // 2. Activate the tab
      try {
        await chrome.tabs.update(existingTab.id, { active: true });
      } catch (tabErr) {
        console.warn('[OpenMsg Launcher] Could not activate tab:', tabErr);
      }

      // 3. Perform handshake / send launch event to content script
      try {
        await chrome.tabs.sendMessage(existingTab.id, {
          type: 'OPENMSG_LAUNCH',
          payload: { timestamp: Date.now() },
        });
      } catch {
        // Tab might still be loading or content script initializing; this is normal
        console.log('[OpenMsg Launcher] Tab notified (content script will auto-init if loading).');
      }

      return { action: 'FOCUSED_EXISTING', tabId: existingTab.id };
    }

    // No existing tab found -> Create a new WhatsApp Web tab
    console.log('[OpenMsg Launcher] No existing tab found. Creating new WhatsApp Web tab.');
    const newTab = await chrome.tabs.create({
      url: WHATSAPP_WEB_URL,
      active: true,
    });

    return { action: 'CREATED_NEW', tabId: newTab.id };
  } catch (err) {
    console.error('[OpenMsg Launcher] Error during launchOrFocusWhatsAppWeb:', err);
    throw err;
  } finally {
    // Release the launch lock after a short buffer
    setTimeout(() => {
      isLaunching = false;
    }, 400);
  }
}
