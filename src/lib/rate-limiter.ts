/**
 * In-memory sliding window rate limiter for login and sensitive actions
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Clean up expired records every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(
    () => {
      const now = Date.now();
      for (const [key, record] of rateLimitStore.entries()) {
        if (record.resetAt <= now) {
          rateLimitStore.delete(key);
        }
      }
    },
    5 * 60 * 1000
  );
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Check rate limit for a key (e.g. IP address or phone number)
 *
 * @param key Unique identifier (e.g., "login:ip:127.0.0.1" or "login:phone:01711234567")
 * @param maxAttempts Maximum attempts allowed within the window (e.g., 5)
 * @param windowMs Time window in milliseconds (e.g., 15 * 60 * 1000 for 15 mins)
 */
export function checkRateLimit(
  key: string,
  maxAttempts = 5,
  windowMs = 15 * 60 * 1000
): RateLimitResult {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || record.resetAt <= now) {
    // New or expired window
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      allowed: true,
      remaining: maxAttempts - 1,
      retryAfterSeconds: 0,
    };
  }

  if (record.count >= maxAttempts) {
    const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: maxAttempts - record.count,
    retryAfterSeconds: 0,
  };
}

/**
 * Reset rate limit on successful authentication
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}
