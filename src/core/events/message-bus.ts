import { OpenMsgMessage, OpenMsgBridgeEnvelope } from '@/types/messages';

/**
 * MessageBus helper for Chrome runtime message passing
 */
export class MessageBus {
  /**
   * Send a typed message to the background service worker or runtime listeners
   */
  static async send<TResponse = unknown>(message: OpenMsgMessage): Promise<TResponse> {
    if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
      throw new Error('Chrome runtime messaging is not available in current environment.');
    }
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        const err = chrome.runtime.lastError;
        if (err) {
          reject(new Error(err.message));
        } else {
          resolve(response as TResponse);
        }
      });
    });
  }

  /**
   * Send a typed message to a specific tab content script
   */
  static async sendToTab<TResponse = unknown>(tabId: number, message: OpenMsgMessage): Promise<TResponse> {
    if (typeof chrome === 'undefined' || !chrome.tabs || !chrome.tabs.sendMessage) {
      throw new Error('Chrome tabs messaging is not available in current environment.');
    }
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, message, (response) => {
        const err = chrome.runtime.lastError;
        if (err) {
          reject(new Error(err.message));
        } else {
          resolve(response as TResponse);
        }
      });
    });
  }

  /**
   * Register a typed listener for chrome.runtime.onMessage
   */
  static onMessage(
    handler: (
      message: OpenMsgMessage,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: unknown) => void
    ) => boolean | void | Promise<unknown>
  ): () => void {
    if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.onMessage) {
      return () => {};
    }

    const listener = (
      msg: unknown,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: unknown) => void
    ) => {
      const openMsg = msg as OpenMsgMessage;
      if (openMsg && typeof openMsg.type === 'string') {
        return handler(openMsg, sender, sendResponse);
      }
      return false;
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => {
      chrome.runtime.onMessage.removeListener(listener);
    };
  }

  /**
   * Post message across the window boundary (Isolated <-> Main world)
   */
  static postToWindow<T>(envelope: OpenMsgBridgeEnvelope<T>, targetOrigin = '*'): void {
    if (typeof window !== 'undefined') {
      window.postMessage(envelope, targetOrigin);
    }
  }

  /**
   * Listen for window.postMessage bridge envelopes
   */
  static onWindowBridge(
    expectedTarget: OpenMsgBridgeEnvelope['target'],
    handler: (envelope: OpenMsgBridgeEnvelope) => void
  ): () => void {
    if (typeof window === 'undefined') return () => {};

    const listener = (event: MessageEvent) => {
      if (event.source !== window) return;
      const data = event.data as OpenMsgBridgeEnvelope;
      if (data && data.target === expectedTarget) {
        handler(data);
      }
    };

    window.addEventListener('message', listener);
    return () => {
      window.removeEventListener('message', listener);
    };
  }
}
