// Rate limiter to avoid overwhelming the server

import { RATE_LIMIT } from '../config.js';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class RateLimiter {
  constructor(requestsPerMinute = RATE_LIMIT.requestsPerMinute) {
    this.interval = 60000 / requestsPerMinute;
    this.lastRequest = 0;
    this.requestCount = 0;
  }

  async wait() {
    const now = Date.now();
    const elapsed = now - this.lastRequest;

    if (elapsed < this.interval) {
      await sleep(this.interval - elapsed);
    }

    this.lastRequest = Date.now();
    this.requestCount++;
  }

  reset() {
    this.lastRequest = 0;
    this.requestCount = 0;
  }

  getStats() {
    return {
      requestCount: this.requestCount,
      interval: this.interval,
    };
  }
}

// Singleton instance for shared use
export const rateLimiter = new RateLimiter();

export default RateLimiter;
