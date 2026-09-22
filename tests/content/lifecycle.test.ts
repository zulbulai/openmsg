import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WhatsAppLifecycleManager } from '@/content/whatsapp/lifecycle';

// Lightweight in-memory DOM mock for Node.js test environment
class MockElement {
  id: string = '';
  attributes: Record<string, string> = {};
  children: MockElement[] = [];
  innerText: string = '';

  constructor(public tagName: string) {}

  setAttribute(name: string, value: string) {
    this.attributes[name.toLowerCase()] = value;
  }

  getAttribute(name: string): string | null {
    return this.attributes[name.toLowerCase()] ?? null;
  }

  appendChild(child: MockElement) {
    this.children.push(child);
    return child;
  }
}

class MockDocument {
  body: MockElement = new MockElement('BODY');

  createElement(tag: string): MockElement {
    return new MockElement(tag.toUpperCase());
  }

  getElementById(id: string): MockElement | null {
    const search = (el: MockElement): MockElement | null => {
      if (el.id === id) return el;
      for (const child of el.children) {
        const found = search(child);
        if (found) return found;
      }
      return null;
    };
    return search(this.body);
  }

  querySelector(selector: string): MockElement | null {
    const parts = selector.split(',').map((s) => s.trim().toLowerCase());

    const search = (el: MockElement): MockElement | null => {
      for (const part of parts) {
        if (part.startsWith('#') && el.id.toLowerCase() === part.substring(1)) {
          return el;
        }
        if (part.startsWith('[') && part.endsWith(']')) {
          const attrRule = part.slice(1, -1);
          if (attrRule.includes('*=')) {
            const [attrName, valWithFlag] = attrRule.split('*=');
            const val = valWithFlag.replace(/["'i\s]/g, '').toLowerCase();
            const actualVal = (el.getAttribute(attrName) || '').toLowerCase();
            if (actualVal.includes(val)) return el;
          } else if (attrRule.includes('=')) {
            const [attrName, val] = attrRule.split('=');
            const cleanVal = val.replace(/["']/g, '');
            if (el.getAttribute(attrName) === cleanVal) return el;
          } else {
            if (el.getAttribute(attrRule) !== null) return el;
          }
        }
        if (part === el.tagName.toLowerCase()) {
          return el;
        }
        if (part.startsWith('canvas[') && el.tagName === 'CANVAS') {
          const attr = el.getAttribute('aria-label');
          if (attr && attr.toLowerCase().includes('scan')) return el;
        }
      }

      for (const child of el.children) {
        const found = search(child);
        if (found) return found;
      }
      return null;
    };

    return search(this.body);
  }
}

describe('WhatsAppLifecycleManager', () => {
  let manager: WhatsAppLifecycleManager;
  let mockDoc: MockDocument;

  beforeEach(() => {
    mockDoc = new MockDocument();
    (globalThis as any).document = mockDoc;
    (globalThis as any).MutationObserver = class {
      observe() {}
      disconnect() {}
    };

    manager = WhatsAppLifecycleManager.getInstance();
  });

  afterEach(() => {
    manager.stop();
  });

  it('should detect READY when chat pane #pane-side is present', () => {
    const pane = mockDoc.createElement('div');
    pane.id = 'pane-side';
    mockDoc.body.appendChild(pane);

    const state = manager.evaluateCurrentState();
    expect(state).toBe('READY');
  });

  it('should detect READY when [data-testid="chat-list"] is present', () => {
    const chatList = mockDoc.createElement('div');
    chatList.setAttribute('data-testid', 'chat-list');
    mockDoc.body.appendChild(chatList);

    const state = manager.evaluateCurrentState();
    expect(state).toBe('READY');
  });

  it('should detect LOGIN_REQUIRED when QR code canvas is present', () => {
    const canvas = mockDoc.createElement('canvas');
    canvas.setAttribute('aria-label', 'Scan this QR code with WhatsApp');
    mockDoc.body.appendChild(canvas);

    const state = manager.evaluateCurrentState();
    expect(state).toBe('LOGIN_REQUIRED');
  });

  it('should detect LOGIN_REQUIRED when data-ref attribute is present', () => {
    const qrDiv = mockDoc.createElement('div');
    qrDiv.setAttribute('data-ref', 'qr-token-12345');
    mockDoc.body.appendChild(qrDiv);

    const state = manager.evaluateCurrentState();
    expect(state).toBe('LOGIN_REQUIRED');
  });

  it('should detect CONNECTING when startup progress bar is present', () => {
    const progress = mockDoc.createElement('progress');
    mockDoc.body.appendChild(progress);

    const state = manager.evaluateCurrentState();
    expect(state).toBe('CONNECTING');
  });

  it('should detect LOADING when only #app is present without chats or QR', () => {
    const app = mockDoc.createElement('div');
    app.id = 'app';
    mockDoc.body.appendChild(app);

    const state = manager.evaluateCurrentState();
    expect(state).toBe('LOADING');
  });

  it('should notify registered listeners when state changes', () => {
    let notifiedState = '';
    const unsub = manager.onStateChange((state) => {
      notifiedState = state;
    });

    const pane = mockDoc.createElement('div');
    pane.id = 'pane-side';
    mockDoc.body.appendChild(pane);

    const newState = manager.evaluateCurrentState();
    expect(newState).toBe('READY');
    expect(notifiedState).toBeDefined();

    unsub();
  });
});
