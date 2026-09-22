import { AlarmManager } from './alarms';
import { setupBackgroundMessaging } from './messaging';

console.log('[OpenMsg Background] Service worker initializing...');

// Enable side panel toggle on extension toolbar action click
if (typeof chrome !== 'undefined' && chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((err: Error) => console.error('[OpenMsg Background] Error setting side panel behavior:', err));
}

// Initialize core background subsystems
AlarmManager.init();
setupBackgroundMessaging();

console.log('[OpenMsg Background] Service worker ready.');
