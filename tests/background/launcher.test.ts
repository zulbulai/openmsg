import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isWhatsAppWebUrl,
  findExistingWhatsAppTab,
  launchOrFocusWhatsAppWeb,
  _resetLauncherState,
  WHATSAPP_WEB_URL,
} from '@/background/launcher';

describe('OpenMsg Background Launcher', () => {
  describe('isWhatsAppWebUrl', () => {
    it('should strictly match valid https://web.whatsapp.com URLs', () => {
      expect(isWhatsAppWebUrl('https://web.whatsapp.com/')).toBe(true);
      expect(isWhatsAppWebUrl('https://web.whatsapp.com')).toBe(true);
      expect(isWhatsAppWebUrl('https://web.whatsapp.com/chat/919876543210@c.us')).toBe(true);
      expect(isWhatsAppWebUrl('https://web.whatsapp.com/?tab=inbox#overview')).toBe(true);
      expect(isWhatsAppWebUrl('https://web.whatsapp.com/settings')).toBe(true);
    });

    it('should reject non-HTTPS URLs', () => {
      expect(isWhatsAppWebUrl('http://web.whatsapp.com/')).toBe(false);
      expect(isWhatsAppWebUrl('http://web.whatsapp.com')).toBe(false);
    });

    it('should reject spoofed or attacker domain names', () => {
      expect(isWhatsAppWebUrl('https://web.whatsapp.com.attacker.com/')).toBe(false);
      expect(isWhatsAppWebUrl('https://fake-web.whatsapp.com/')).toBe(false);
      expect(isWhatsAppWebUrl('https://web.whatsapp.com@attacker.com/')).toBe(false);
      expect(isWhatsAppWebUrl('https://whatsapp.com/')).toBe(false);
      expect(isWhatsAppWebUrl('https://google.com')).toBe(false);
    });

    it('should handle null, undefined, empty, and invalid inputs gracefully', () => {
      expect(isWhatsAppWebUrl('')).toBe(false);
      expect(isWhatsAppWebUrl(null)).toBe(false);
      expect(isWhatsAppWebUrl(undefined)).toBe(false);
      expect(isWhatsAppWebUrl('invalid-url-string')).toBe(false);
      expect(isWhatsAppWebUrl('chrome://extensions/')).toBe(false);
      expect(isWhatsAppWebUrl('about:blank')).toBe(false);
    });
  });

  describe('findExistingWhatsAppTab', () => {
    beforeEach(() => {
      vi.stubGlobal('chrome', {
        tabs: {
          query: vi.fn(),
          update: vi.fn(),
          create: vi.fn(),
          sendMessage: vi.fn(),
        },
        windows: {
          update: vi.fn(),
        },
      });
    });

    it('should return null when no tabs match WhatsApp Web', async () => {
      vi.mocked(chrome.tabs.query).mockResolvedValue([
        { id: 1, url: 'https://google.com', windowId: 10 } as chrome.tabs.Tab,
        { id: 2, url: 'https://github.com', windowId: 10 } as chrome.tabs.Tab,
      ]);

      const tab = await findExistingWhatsAppTab();
      expect(tab).toBeNull();
    });

    it('should return matching tab when WhatsApp Web is already open', async () => {
      const waTab = {
        id: 42,
        url: 'https://web.whatsapp.com/',
        windowId: 101,
      } as chrome.tabs.Tab;

      vi.mocked(chrome.tabs.query).mockResolvedValue([
        { id: 1, url: 'https://google.com', windowId: 10 } as chrome.tabs.Tab,
        waTab,
      ]);

      const tab = await findExistingWhatsAppTab();
      expect(tab).toEqual(waTab);
    });

    it('should check pendingUrl if url is not yet committed', async () => {
      const waTab = {
        id: 77,
        url: '',
        pendingUrl: 'https://web.whatsapp.com/chat/123',
        windowId: 202,
      } as unknown as chrome.tabs.Tab;

      vi.mocked(chrome.tabs.query).mockResolvedValue([waTab]);

      const tab = await findExistingWhatsAppTab();
      expect(tab).toEqual(waTab);
    });
  });

  describe('launchOrFocusWhatsAppWeb', () => {
    beforeEach(() => {
      _resetLauncherState();
      vi.stubGlobal('chrome', {
        tabs: {
          query: vi.fn(),
          update: vi.fn().mockResolvedValue({}),
          create: vi.fn().mockResolvedValue({ id: 99 }),
          sendMessage: vi.fn().mockResolvedValue({ success: true }),
        },
        windows: {
          update: vi.fn().mockResolvedValue({}),
        },
      });
    });

    it('CASE A: should focus existing tab and window without creating a new tab', async () => {
      const existingTab = {
        id: 55,
        url: 'https://web.whatsapp.com/',
        windowId: 10,
      } as chrome.tabs.Tab;

      vi.mocked(chrome.tabs.query).mockResolvedValue([existingTab]);

      const result = await launchOrFocusWhatsAppWeb();

      expect(result.action).toBe('FOCUSED_EXISTING');
      expect(result.tabId).toBe(55);
      expect(chrome.windows.update).toHaveBeenCalledWith(10, { focused: true });
      expect(chrome.tabs.update).toHaveBeenCalledWith(55, { active: true });
      expect(chrome.tabs.create).not.toHaveBeenCalled();
    });

    it('CASE B: should open a new tab when WhatsApp Web is not already open', async () => {
      vi.mocked(chrome.tabs.query).mockResolvedValue([
        { id: 1, url: 'https://news.ycombinator.com', windowId: 1 } as chrome.tabs.Tab,
      ]);

      const result = await launchOrFocusWhatsAppWeb();

      expect(result.action).toBe('CREATED_NEW');
      expect(chrome.tabs.create).toHaveBeenCalledWith({
        url: WHATSAPP_WEB_URL,
        active: true,
      });
    });
  });
});
