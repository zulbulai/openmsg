import { MessageBus } from '@/core/events/message-bus';
import { AlarmManager } from './alarms';

export function setupBackgroundMessaging(): void {
  MessageBus.onMessage((msg, _sender, sendResponse) => {
    switch (msg.type) {
      case 'PING':
      case 'PING_OPENMSG':
        sendResponse({
          type: 'PONG_OPENMSG',
          payload: { timestamp: Date.now(), context: 'background' },
        });
        return true;

      case 'SCHEDULE_ALARM':
        AlarmManager.schedule(msg.payload.alarmId, msg.payload.triggerAt);
        sendResponse({ success: true });
        return true;

      case 'CANCEL_ALARM':
        AlarmManager.cancel(msg.payload.alarmId);
        sendResponse({ success: true });
        return true;

      case 'WHATSAPP_STATUS_REQUEST':
        // Forward or respond with current known connection state
        sendResponse({
          type: 'WHATSAPP_STATUS_RESPONSE',
          payload: { ready: true },
        });
        return true;

      default:
        // Allow unhandled messages to pass through to other listeners
        return false;
    }
  });
}
