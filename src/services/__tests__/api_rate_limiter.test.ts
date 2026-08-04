import { describe, it, expect, beforeEach } from 'vitest';
import {
  getDailyUsage,
  checkAndIncrementApiLimit,
  resetDailyUsage,
  DEFAULT_DAILY_API_LIMIT
} from '../api_rate_limiter';

describe('ApiRateLimiter Service - LCDLA', () => {
  const testUser = 'test_user_lcdla_123';

  beforeEach(() => {
    resetDailyUsage(testUser);
  });

  it('should initialize with zero count and full limit', () => {
    const usage = getDailyUsage(testUser);
    expect(usage.count).toBe(0);
    expect(usage.limit).toBe(DEFAULT_DAILY_API_LIMIT);
    expect(usage.remaining).toBe(DEFAULT_DAILY_API_LIMIT);
  });

  it('should increment usage count correctly on API call', () => {
    const result1 = checkAndIncrementApiLimit(testUser, 10);
    expect(result1.allowed).toBe(true);
    expect(result1.count).toBe(1);
    expect(result1.remaining).toBe(9);

    const usage = getDailyUsage(testUser, 10);
    expect(usage.count).toBe(1);
    expect(usage.remaining).toBe(9);
  });

  it('should block API calls when daily limit is reached', () => {
    const limit = 3;
    checkAndIncrementApiLimit(testUser, limit);
    checkAndIncrementApiLimit(testUser, limit);
    checkAndIncrementApiLimit(testUser, limit);

    const blocked = checkAndIncrementApiLimit(testUser, limit);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.message).toContain('Has alcanzado el límite diario');
  });

  it('should allow resetting usage', () => {
    checkAndIncrementApiLimit(testUser, 5);
    resetDailyUsage(testUser);
    const usage = getDailyUsage(testUser, 5);
    expect(usage.count).toBe(0);
  });
});
