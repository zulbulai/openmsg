import { ConnectionState } from '@/types/whatsapp';

export type LifecycleListener = (state: ConnectionState, previousState: ConnectionState) => void;

/**
 * WhatsAppLifecycleManager
 * Monitors WhatsApp Web DOM in the Isolated World to reliably determine
 * whether WhatsApp is LOADING, showing the QR code (LOGIN_REQUIRED),
 * syncing (CONNECTING), fully ready with chats loaded (READY), or DISCONNECTED.
 */
export class WhatsAppLifecycleManager {
  private static instance: WhatsAppLifecycleManager | null = null;

  private currentState: ConnectionState = 'LOADING';
  private listeners: Set<LifecycleListener> = new Set();
  private observer: MutationObserver | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private isObserving = false;

  private constructor() {
    this.currentState = this.evaluateCurrentState();
  }

  public static getInstance(): WhatsAppLifecycleManager {
    if (!WhatsAppLifecycleManager.instance) {
      WhatsAppLifecycleManager.instance = new WhatsAppLifecycleManager();
    }
    return WhatsAppLifecycleManager.instance;
  }

  /**
   * Evaluates the current state synchronously by querying key DOM selectors.
   */
  public evaluateCurrentState(): ConnectionState {
    if (typeof document === 'undefined') return 'LOADING';

    // 1. Check for Chats Ready: #pane-side or data-testid="chat-list"
    const chatPane = document.getElementById('pane-side');
    const chatList = document.querySelector('[data-testid="chat-list"], header[data-testid="chatlist-header"]');
    if (chatPane || chatList) {
      return 'READY';
    }

    // 2. Check for QR Code Screen (Login Required)
    const qrCanvas = document.querySelector('canvas[aria-label*="Scan" i], canvas[aria-label*="código QR" i]');
    const dataRefEl = document.querySelector('[data-ref]');
    const qrContainer = document.querySelector('[data-testid="qrcode"]');
    const introTitle = document.querySelector('[data-testid="intro-title"]');
    
    // Check if the page text contains instructions to scan QR
    const bodyText = document.body ? document.body.innerText || '' : '';
    const hasScanText = bodyText.includes('Scan with your phone') ||
      bodyText.includes('To use WhatsApp on your computer') ||
      bodyText.includes('WhatsApp Web on your computer');

    if (qrCanvas || dataRefEl || qrContainer || (introTitle && hasScanText)) {
      return 'LOGIN_REQUIRED';
    }

    // 3. Check for Disconnected / Reconnecting banner
    const disconnectedBanner = document.querySelector(
      '[data-testid="alert-phone-not-connected"], [data-testid="banner-network-reconnecting"]'
    );
    if (disconnectedBanner) {
      return 'DISCONNECTED';
    }

    // 4. Check for Loading Progress / Startup progress bar
    const progress = document.querySelector('progress, [data-testid="startup-progress"]');
    if (progress) {
      return 'CONNECTING';
    }

    // 5. If main app root container exists but no chats or QR yet, it is still loading
    const waApp = document.getElementById('app');
    if (waApp) {
      return 'LOADING';
    }

    return 'LOADING';
  }

  /**
   * Start observing DOM changes to dynamically detect transitions
   * (e.g. user scans QR -> WhatsApp loads -> chats appear).
   */
  public start(): void {
    if (this.isObserving) return;
    this.isObserving = true;

    // Run immediate check
    this.checkState();

    this.observer = new MutationObserver(() => {
      if (this.debounceTimer) clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.checkState();
      }, 150);
    });

    if (document.body) {
      this.observer.observe(document.body, { childList: true, subtree: true });
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        if (this.observer && document.body) {
          this.observer.observe(document.body, { childList: true, subtree: true });
        }
      });
    }
  }

  public stop(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.isObserving = false;
  }

  public getState(): ConnectionState {
    return this.currentState;
  }

  public isReady(): boolean {
    return this.currentState === 'READY';
  }

  public onStateChange(listener: LifecycleListener): () => void {
    this.listeners.add(listener);
    // Immediately call listener with current state
    listener(this.currentState, this.currentState);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private checkState(): void {
    const newState = this.evaluateCurrentState();
    if (newState !== this.currentState) {
      const oldState = this.currentState;
      this.currentState = newState;
      console.log(`[OpenMsg Lifecycle] Transition: ${oldState} -> ${newState}`);
      this.listeners.forEach((listener) => {
        try {
          listener(newState, oldState);
        } catch (err) {
          console.error('[OpenMsg Lifecycle] Listener error:', err);
        }
      });
    }
  }
}
