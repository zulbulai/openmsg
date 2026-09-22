import { WhatsAppMessage, WhatsAppUser, SendResult } from './whatsapp';

/**
 * Message Bus Protocol for communication between:
 * - Sidepanel
 * - Background Service Worker
 * - Content Script
 * - Injected Script
 */

export type OpenMsgMessage =
  | {
      type: 'PING';
      payload?: { timestamp: number };
    }
  | {
      type: 'PING_OPENMSG';
      payload?: { timestamp?: number };
    }
  | {
      type: 'PONG';
      payload: { timestamp: number; context: string };
    }
  | {
      type: 'PONG_OPENMSG';
      payload: { timestamp: number; context: string; state?: string; uiMode?: string };
    }
  | {
      type: 'OPENMSG_LAUNCH';
      payload?: { timestamp?: number };
    }
  | {
      type: 'OPENMSG_INIT';
      payload?: { timestamp?: number };
    }
  | {
      type: 'WHATSAPP_READY';
      payload: { user: WhatsAppUser };
    }
  | {
      type: 'WHATSAPP_STATUS_REQUEST';
    }
  | {
      type: 'WHATSAPP_STATUS_RESPONSE';
      payload: { ready: boolean; user?: WhatsAppUser | null };
    }
  | {
      type: 'SEND_MESSAGE';
      payload: { chatId: string; text: string; correlationId: string };
    }
  | {
      type: 'SEND_MESSAGE_RESULT';
      payload: { correlationId: string; result: SendResult };
    }
  | {
      type: 'MESSAGE_RECEIVED';
      payload: { message: WhatsAppMessage };
    }
  | {
      type: 'SCHEDULE_ALARM';
      payload: { alarmId: string; triggerAt: number; data?: Record<string, unknown> };
    }
  | {
      type: 'CANCEL_ALARM';
      payload: { alarmId: string };
    }
  | {
      type: 'ALARM_FIRED';
      payload: { alarmId: string; timestamp: number };
    }
  | {
      type: 'TRIGGER_WORKFLOW';
      payload: { workflowId: string; contactId: string; initialVariables?: Record<string, unknown> };
    };

/**
 * Window postMessage Envelope for Isolated World <-> Main World Bridge
 */
export interface OpenMsgBridgeEnvelope<T = unknown> {
  target: 'OPENMSG_BRIDGE_REQUEST' | 'OPENMSG_BRIDGE_RESPONSE' | 'OPENMSG_BRIDGE_EVENT';
  id?: string;
  action?: string;
  payload?: T;
  error?: string;
}
