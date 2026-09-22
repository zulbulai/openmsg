import { AlarmManager } from './alarms';
import { setupBackgroundMessaging } from './messaging';
import { launchOrFocusWhatsAppWeb } from './launcher';

console.log('[OpenMsg Background] Service worker initializing...');

// Enable Side Panel to open when clicking the extension icon
if (typeof chrome !== 'undefined' && chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((err) => {
      console.warn('[OpenMsg Background] setPanelBehavior not supported or failed:', err);
    });
}

// Fallback action click handler
chrome.action.onClicked.addListener(async (tab) => {
  console.log('[OpenMsg Background] OpenMsg icon clicked. Opening sidepanel or focusing WhatsApp...');
  try {
    if (tab.id && chrome.sidePanel && chrome.sidePanel.open) {
      await chrome.sidePanel.open({ tabId: tab.id });
    } else {
      await launchOrFocusWhatsAppWeb();
    }
  } catch (err) {
    console.warn('[OpenMsg Background] Failed to open side panel directly, focusing WhatsApp:', err);
    await launchOrFocusWhatsAppWeb();
  }
});

// Handle requests from content script (e.g. floating button click)
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'OPEN_SIDEPANEL') {
    if (sender.tab?.id && chrome.sidePanel && chrome.sidePanel.open) {
      chrome.sidePanel.open({ tabId: sender.tab.id }).catch((err) => {
        console.warn('[OpenMsg Background] Failed to open side panel:', err);
      });
      sendResponse({ success: true });
      return true;
    }
  }
  return false;
});

// Initialize core background subsystems
AlarmManager.init();
setupBackgroundMessaging();

console.log('[OpenMsg Background] Service worker ready.');
