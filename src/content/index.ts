import { MessageBus } from '@/core/events/message-bus';
import { OpenMsgBridgeEnvelope } from '@/types/messages';

console.log('[OpenMsg Content Script] Loaded in Isolated World.');

// Inject Main World Bridge script
function injectBridgeScript(): void {
  try {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('injected.js');
    script.type = 'module';
    (document.head || document.documentElement).appendChild(script);
    script.onload = () => script.remove();
    console.log('[OpenMsg Content Script] Bridge script tag appended.');
  } catch (err) {
    console.error('[OpenMsg Content Script] Failed to inject bridge:', err);
  }
}

// Listen for messages from the Main World Bridge
MessageBus.onWindowBridge('OPENMSG_BRIDGE_EVENT', (envelope: OpenMsgBridgeEnvelope) => {
  console.log('[OpenMsg Content Script] Received bridge event:', envelope.action, envelope.payload);

  if (envelope.action === 'BRIDGE_MOUNTED') {
    // Notify background
    MessageBus.send({
      type: 'WHATSAPP_STATUS_RESPONSE',
      payload: { ready: true },
    }).catch(() => {});
  }
});

// Listen for messages from Extension Runtime (Sidepanel / Background)
MessageBus.onMessage((msg, _sender, sendResponse) => {
  if (msg.type === 'PING') {
    sendResponse({ type: 'PONG', payload: { timestamp: Date.now(), context: 'content-script' } });
    return true;
  }
  return false;
});

// Boot
injectBridgeScript();
