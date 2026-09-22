import { describe, it, expect, beforeEach } from 'vitest';
import { DeduplicationCache } from '@/core/automation/deduplication';

describe('DeduplicationCache', () => {
  let cache: DeduplicationCache;

  beforeEach(() => {
    cache = new DeduplicationCache(1000, 100); // 1-second TTL for testing
  });

  it('should mark first occurrence as not duplicate', () => {
    expect(cache.isDuplicate('msg_1001')).toBe(false);
  });

  it('should detect duplicate when called immediately with same ID', () => {
    expect(cache.isDuplicate('msg_1002')).toBe(false);
    expect(cache.isDuplicate('msg_1002')).toBe(true);
    expect(cache.isDuplicate('msg_1002')).toBe(true);
  });

  it('should handle different event IDs independently', () => {
    expect(cache.isDuplicate('msg_a')).toBe(false);
    expect(cache.isDuplicate('msg_b')).toBe(false);
    expect(cache.isDuplicate('msg_a')).toBe(true);
    expect(cache.isDuplicate('msg_b')).toBe(true);
  });

  it('should handle empty or null IDs safely', () => {
    expect(cache.isDuplicate('')).toBe(false);
  });
});
