/**
 * OpenMsg Message Rate Limiter & Dispatch Queue
 * Throttles outbound WhatsApp messages to prevent account bans.
 * Features:
 * - Configurable randomized jitter (default 3s–8s between messages)
 * - Rolling hourly quota enforcement (default 250 messages/hour)
 * - Exponential backoff retry for transient failures
 * - Pause, resume, and clear controls
 */

export interface RateLimiterConfig {
  minDelayMs: number; // Minimum wait between sends
  maxDelayMs: number; // Maximum wait between sends (random jitter)
  maxPerHour: number; // Maximum messages per rolling hour
  maxRetries: number; // Maximum retry attempts on failure
}

export interface QueuedMessage<T = unknown> {
  id: string;
  payload: T;
  execute: () => Promise<unknown>;
  attempts: number;
  priority?: number;
  createdAt: number;
  onSuccess?: (result: unknown) => void;
  onError?: (error: Error) => void;
}

export class MessageDispatchQueue {
  private queue: QueuedMessage[] = [];
  private isProcessing = false;
  private isPaused = false;
  private sentTimestamps: number[] = [];
  private config: RateLimiterConfig;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(config: Partial<RateLimiterConfig> = {}) {
    this.config = {
      minDelayMs: config.minDelayMs ?? 3000,
      maxDelayMs: config.maxDelayMs ?? 8000,
      maxPerHour: config.maxPerHour ?? 250,
      maxRetries: config.maxRetries ?? 3,
    };
  }

  /**
   * Updates configuration dynamically (e.g. from Settings UI)
   */
  updateConfig(newConfig: Partial<RateLimiterConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): RateLimiterConfig {
    return { ...this.config };
  }

  /**
   * Enqueues a message send action
   */
  enqueue<T>(
    id: string,
    execute: () => Promise<unknown>,
    options: {
      payload?: T;
      priority?: number;
      onSuccess?: (result: unknown) => void;
      onError?: (error: Error) => void;
    } = {}
  ): string {
    const item: QueuedMessage = {
      id,
      payload: options.payload,
      execute,
      attempts: 0,
      priority: options.priority ?? 0,
      createdAt: Date.now(),
      onSuccess: options.onSuccess,
      onError: options.onError,
    };

    // Higher priority items placed earlier
    if (options.priority && options.priority > 0) {
      const idx = this.queue.findIndex((q) => (q.priority ?? 0) < options.priority!);
      if (idx !== -1) {
        this.queue.splice(idx, 0, item);
      } else {
        this.queue.push(item);
      }
    } else {
      this.queue.push(item);
    }

    this.processNext();
    return id;
  }

  /**
   * Pauses the dispatch queue
   */
  pause(): void {
    this.isPaused = true;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  /**
   * Resumes the dispatch queue
   */
  resume(): void {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.processNext();
  }

  get isPausedState(): boolean {
    return this.isPaused;
  }

  /**
   * Clears all pending messages
   */
  clear(): void {
    this.queue = [];
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.isProcessing = false;
  }

  get pendingCount(): number {
    return this.queue.length;
  }

  /**
   * Checks rolling hourly quota
   */
  private checkQuota(): boolean {
    const oneHourAgo = Date.now() - 3600000;
    this.sentTimestamps = this.sentTimestamps.filter((t) => t > oneHourAgo);
    return this.sentTimestamps.length < this.config.maxPerHour;
  }

  /**
   * Calculates random delay between min and max jitter
   */
  private getRandomDelay(): number {
    const min = this.config.minDelayMs;
    const max = this.config.maxDelayMs;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Processes the next message in queue
   */
  private async processNext(): Promise<void> {
    if (this.isProcessing || this.isPaused || this.queue.length === 0) {
      return;
    }

    if (!this.checkQuota()) {
      // Reached hourly limit, schedule re-check in 60 seconds
      this.timer = setTimeout(() => {
        this.processNext();
      }, 60000);
      return;
    }

    this.isProcessing = true;
    const current = this.queue.shift()!;
    current.attempts += 1;

    try {
      const result = await current.execute();
      this.sentTimestamps.push(Date.now());
      if (current.onSuccess) current.onSuccess(result);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      if (current.attempts < this.config.maxRetries) {
        // Requeue with exponential backoff delay
        const backoffDelay = Math.pow(2, current.attempts) * 1000;
        setTimeout(() => {
          this.queue.unshift(current);
          this.processNext();
        }, backoffDelay);
        this.isProcessing = false;
        return;
      } else {
        if (current.onError) current.onError(error);
      }
    }

    this.isProcessing = false;

    // Wait random jitter delay before next dispatch
    if (this.queue.length > 0 && !this.isPaused) {
      const delay = this.getRandomDelay();
      this.timer = setTimeout(() => {
        this.processNext();
      }, delay);
    }
  }
}

export const messageQueue = new MessageDispatchQueue();
