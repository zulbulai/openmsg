import { AlarmManager } from './alarms';
import { setupBackgroundMessaging } from './messaging';

import { launchOrFocusWhatsAppWeb } from './launcher';

console.log('[OpenMsg Background] Service worker initializing...');

// Listen for extension icon click in toolbar
chrome.action.onClicked.addListener(async () => {
  console.log('[OpenMsg Background] OpenMsg icon clicked. Launching/focusing WhatsApp Web...');
  try {
    const result = await launchOrFocusWhatsAppWeb();
    console.log('[OpenMsg Background] Launcher result:', result);
  } catch (err) {
    console.error('[OpenMsg Background] Failed to launch or focus WhatsApp Web:', err);
  }
});

// Initialize core background subsystems
AlarmManager.init();
setupBackgroundMessaging();

console.log('[OpenMsg Background] Service worker ready.');
