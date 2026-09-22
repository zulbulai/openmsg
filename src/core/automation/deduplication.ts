/**
 * OpenMsg Event Deduplication Cache
 * Prevents identical incoming WhatsApp messages or events from triggering automations multiple times.
 * Uses a TTL cache with automatic garbage collection.
 */

export class DeduplicationCache {
  private cache: Map<string, number> = new Map();
  private readonly ttlMs: number;
  private readonly maxEntries: number;

  constructor(ttlMs: number = 5 * 60 * 1000, maxEntries: number = 2000) {
    this.ttlMs = ttlMs;
    this.maxEntries = maxEntries;
  }

  /**
   * Checks if an event ID is duplicate.
   * If not duplicate, marks it as seen and returns false.
   * If already seen within TTL, returns true.
   */
  isDuplicate(eventId: string): boolean {
    if (!eventId) return false;

    const now = Date.now();
    this.cleanup(now);

    const existingTime = this.cache.get(eventId);
    if (existingTime !== undefined && now - existingTime < this.ttlMs) {
      return true; // Already processed recently
    }

    // Evict oldest if capacity reached
    if (this.cache.size >= this.maxEntries) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(eventId, now);
    return false;
  }

  /**
   * Removes expired entries from cache
   */
  private cleanup(now: number): void {
    if (this.cache.size === 0) return;

    for (const [key, timestamp] of this.cache.entries()) {
      if (now - timestamp > this.ttlMs) {
        this.cache.delete(key);
      } else {
        // Since entries are inserted in chronological order, we can stop at first non-expired entry
        break;
      }
    }
  }

  /**
   * Clears the cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Gets current count of cached events
   */
  get size(): number {
    return this.cache.size;
  }
}

export const eventDeduplication = new DeduplicationCache();
