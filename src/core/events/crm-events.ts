/**
 * OpenMsg CRM Event Bus
 * Typed event emitter for CRM stage changes, contact updates, and pipeline events.
 */

import { ContactStageHistory } from '@/storage/schemas';

export type CrmEventType =
  | 'CONTACT_STAGE_CHANGED'
  | 'CONTACT_CREATED'
  | 'CONTACT_UPDATED'
  | 'STAGE_UPDATED'
  | 'PIPELINE_UPDATED';

export type CrmEventHandler<T = any> = (payload: T) => void | Promise<void>;

class CrmEventEmitter {
  private listeners: Map<CrmEventType, Set<CrmEventHandler>> = new Map();

  on<T = any>(event: CrmEventType, handler: CrmEventHandler<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler as CrmEventHandler);

    return () => {
      this.off(event, handler);
    };
  }

  off<T = any>(event: CrmEventType, handler: CrmEventHandler<T>): void {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(handler as CrmEventHandler);
    }
  }

  async emit<T = any>(event: CrmEventType, payload: T): Promise<void> {
    const set = this.listeners.get(event);
    if (!set || set.size === 0) return;

    const handlers = Array.from(set);
    for (const handler of handlers) {
      try {
        await handler(payload);
      } catch (err) {
        console.error(`[CrmEventEmitter] Error executing listener for ${event}:`, err);
      }
    }
  }
}

export const crmEvents = new CrmEventEmitter();

export interface ContactStageChangedPayload extends ContactStageHistory {
  contactName?: string;
  phone?: string;
}
